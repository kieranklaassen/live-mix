#pragma once

// Scale Filter: a filter with an opening at every note of a key and scale,
// in every octave, and nothing between.
//
//   in ─┬─► (kit::Stft dry, 9216 late) ─────────────────────────────────► dry ─┐
//       │                                                                       ├─► out
//       └─► Hann ─► FFT ─► per bin: gain ─► glow ─► ring ─► IFFT ─► Hann ─► wet ─┘
//                             │
//                             a bell at every note of the scale, by the pitch of
//                             the bin, or of the partial that sounds in it
//
// Built on kit::Stft<8192, 2048>: frames of 8192 samples every 2048. A bin is
// 5.86 Hz wide at 48 kHz (5.38 at 44.1, 11.7 at 96), and that is what a mask
// over the bins can tell apart: a semitone is one bin wide at 98 Hz and four
// at 394 Hz. The latency is kLatency = 9216 samples (192 ms at 48 kHz), and
// the dry path is the Stft's own, the same 9216 late.
//
// - The mask. Every bin has a pitch (69 + 12 log2(hz / 440), less Tune). Its
//   distance d to the nearest note that is let through gives the gain
//
//     g = floor + (1 - floor) × exp(-2 ln2 × (d / Width)²) × range
//
//   so the opening is 3 dB down at ±Width/2 whatever the octave (Width in
//   cents), `floor` is Depth, and `range` closes the notes under Low and over
//   High (a raised cosine one semitone long outside each end).
// - A partial is placed by its own frequency. A held note is three or four
//   bins wide, and in the bass a bin is wider than the opening, so a gain by
//   the bin's centre could not tell a wrong note from a right one down there.
//   Each bin's true frequency is measured from the turn of its phase between
//   two frames; where a bin and its stronger neighbour agree on it (a
//   partial), the gain is the mask at that frequency, the same for all the
//   bins of the partial. Where they do not (noise), it is the gain of the
//   bin as a whole: the root of the mean of the mask's power across the bin,
//   which is what the mask would leave of noise that fills it.
//   So a played note a semitone out of the scale is turned down by Depth at
//   55 Hz as at 1760 Hz; noise can only be shaped as finely as the bins. At
//   48 kHz, with Width at 30 cents, the gap in a whole-tone step is 20 dB
//   deep from about 230 Hz up and the full Depth from about 400 Hz; under
//   100 Hz noise is turned down evenly, by the share of each bin that is shut.
// - Ring: each bin's level rises with what the mask lets through and falls
//   at a rate set by Ring (-60 dB in Ring seconds). A bin the input has let
//   go of keeps sounding as its sound would have gone on: at the phase of
//   its last whole frame, turned on each frame by its last measured turn (a
//   rotator, as in cpp/devices/spectral-blur; the bins of one partial take
//   the turn of its peak). A frame in which a sound is cut off has the
//   phase of the cut, so a frame is only believed once the next one has
//   held up too. At the bottom of the knob there is no hold and the wet
//   signal is the input times the mask.
// - Glow lifts the notes by a share of what the mask takes from pink noise
//   (worked out from the mask, not from the sound, so a wrong note alone is
//   not brought back up), never by more than 24 dB and never to more power
//   than the frame brought in.
// - Mix is a linear crossfade: the gains are real, so wet and dry are in
//   step and nothing cancels.
//
// Storage: two kit::Stft<8192> (352 KB each), nine floats per bin per
// channel for the hold (295 KB), and the tables per bin (130 KB): under 1.2 MB.
//
// Cost: a frame is two transforms of 8192 and three passes over 4097 bins,
// once every 2048 samples per channel, the channels 1024 samples apart.

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class ScaleFilter : public kit::DeviceBase<scale_filter::kNumParams> {
 public:
  using Stft = kit::Stft<8192, 2048>;
  static constexpr int kLatency = Stft::kLatency;  // 9216: "latencySamples" in device.json
  static constexpr int kBins = Stft::kBins;        // 4097

  // The scales, as the semitones over Root that are in them (bit s is semitone s), in the order of the Scale
  // choices: Major, Natural Minor, Harmonic Minor, Dorian, Phrygian, Lydian, Mixolydian, Major Pentatonic, Minor
  // Pentatonic, Whole Tone, Chromatic.
  static constexpr int kNumScales = 11;
  static constexpr uint16_t kScales[kNumScales] = {
      0b101010110101, 0b010110101101, 0b100110101101, 0b011010101101, 0b010110101011, 0b101011010101,
      0b011010110101, 0b001010010101, 0b010010101001, 0b010101010101, 0b111111111111,
  };
  // The widest make-up Glow gives, as a gain: 24 dB.
  static constexpr float kMaxMakeup = 15.848932f;

  // The semitones over Root that a scale and a Chord choice let through, as bits. Whole scale is the scale;
  // Triad its root, its third (major where the scale has one, else minor) and its fifth (perfect where it has
  // one, else the augmented or the diminished one it has); Fifths the root and that fifth; Root only the root.
  static uint16_t chord_notes(int scale, int chord) {
    const uint16_t all = kScales[kit::clamp_int(scale, 0, kNumScales - 1)];
    if (chord <= 0) return all;
    const uint16_t third = (all & (1u << 4)) ? (1u << 4) : (1u << 3);
    const uint16_t fifth = (all & (1u << 7)) ? (1u << 7) : ((all & (1u << 8)) ? (1u << 8) : (1u << 6));
    if (chord == 1) return static_cast<uint16_t>(1u | third | fifth);
    if (chord == 2) return static_cast<uint16_t>(1u | fifth);
    return 1u;
  }

  void init(float sample_rate) {
    using namespace scale_filter;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();
    stft_[1].init(Stft::kMaxStagger);
    for (int i = 0; i <= kBellSize; ++i) {
      const float x = kBellSpan * static_cast<float>(i) / kBellSize;
      bell_[i] = i == kBellSize ? 0.0f : std::exp(-1.3862944f * x * x);
    }
    const float bin_hz = sr / Stft::kFrame;
    for (int k = 0; k < kBins; ++k) {
      const float bin = static_cast<float>(k > 0 ? k : 1);
      pitch_[k] = 69.0f + 12.0f * std::log2(bin * bin_hz * (1.0f / 440.0f));
      slope_[k] = 17.312340f / bin;  // semitones per bin: 12 / (ln 2 × k)
    }
    // The pitch classes are read (for the display) where a bin is no wider than a semitone, up to 16 kHz.
    chroma_from_ = kit::clamp_int(static_cast<int>(std::ceil(17.312340f)), 1, kBins - 1);
    chroma_to_ = kit::clamp_int(Stft::nearest_bin(16000.0f, sr), chroma_from_, kBins - 1);
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kBins; ++k) {
        mag_[c][k] = 0.0f;
        guessed_[c][k] = 0;
        ref_re_[c][k] = 1.0f;
        ref_im_[c][k] = 0.0f;
        next_re_[c][k] = 0.0f;
        next_im_[c][k] = 0.0f;
        // Until measured, a bin turns by its centre frequency: k quarter turns a frame.
        turn_re_[c][k] = kQuarterTurn[k & 3][0];
        turn_im_[c][k] = kQuarterTurn[k & 3][1];
        last_re_[c][k] = 0.0f;
        last_im_[c][k] = 0.0f;
      }
      alive_[c] = false;
      quiet_[c] = true;
      makeup_[c] = 1.0f;
      for (int n = 0; n < 12; ++n) {
        chroma_in_[c][n] = 0.0f;
        chroma_out_[c][n] = 0.0f;
      }
    }
    for (int n = 0; n < 12; ++n) packed_[n] = 0.0f;
    for (int k = 0; k < kBins; ++k) {
      offset_[k] = 0.0f;
      power_[k] = 0.0f;
      gain_[k] = 1.0f;
      turned_re_[k] = 0.0f;
      turned_im_[k] = 0.0f;
      lead_[k] = static_cast<uint16_t>(k);
    }
    // A quarter of a second for the make-up to come back up, in frames.
    release_ = 1.0f - std::exp(-static_cast<float>(Stft::kHop) / (0.25f * sr));
    mix_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    // What is in flight when the last bin has gone: a latency and a frame.
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
    dirty_ = true;
    update_mask();
  }

  void set_param(int id, float value) {
    using namespace scale_filter;
    if (!store_param(id, value)) return;
    if (id == kMix) {
      mix_.set(param(id), primed() && !idle_.asleep());  // moved while asleep, it does not glide in
    } else {
      dirty_ = true;  // read when the left channel's next frame comes
    }
  }

  // The readings named by "meters" in device.json, for the display: one per pitch class from C (as Tune has
  // it), each the level of that note over every octave in the newest frames, going in and coming out (the
  // dry and the wet frame by Mix, before the wet path's ceiling), packed as two whole numbers of dB:
  // in + 64 × out, each 0 for nothing (63 dB or more under a full-scale tone) up to 63 for a full-scale
  // tone. A partial is read under the note it is at, noise under the note its bin is at, from the bin
  // where a bin is a semitone wide up to 16 kHz. Asleep it reads 0.
  float meter(int index) const {
    if (index < 0 || index >= 12 || idle_.asleep()) return 0.0f;
    return packed_[index];
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || alive_[0] || alive_[1])) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock runs on through the sleep
      stft_[1].skip(frames);
      mix_.snap(mix_.target);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float mix = mix_.next();
      const float dry_gain = 1.0f - mix;
      float out[2];
      for (int c = 0; c < 2; ++c) {
        float wet = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        // Linear up to ±1, never past ±2.
        wet = 2.0f * kit::soft_clip(0.5f * wet);
        out[c] = stft_[c].dry() * dry_gain + wet * mix;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kTable = 12 * 64;  // places in the octave the distance to a note is kept at
  static constexpr int kBellSize = 512;
  static constexpr float kBellSpan = 3.0f;  // the bell is kept out to three widths, where it is -108 dB
  static constexpr int kMostPoints = 1024;  // places a bin's gain is read at, at the most
  // A bin under this holds nothing: -174 dBFS (a full-scale sine reads Stft::kFullScale = 2048).
  static constexpr float kFloor = 4.0e-6f;
  // Under this a frame's power is silence: -160 dB under a full-scale sine's.
  static constexpr float kSilence = 1.0e-9f;
  // Two bins that hold one partial agree on where it is to a hundredth of a bin; two that hold noise are a
  // bin apart as often as not. Trusted fully under kAgreeNear bins, not at all over kAgreeFar.
  static constexpr float kAgreeNear = 0.06f;
  static constexpr float kAgreeFar = 0.30f;
  // Under this bin the measured frequency is not trusted: the mirror image leaks into it (kit::Stft's own
  // note: a tenth of a hertz under bin 8, more below). Bin 4 is 23 Hz at 48 kHz and 47 Hz at 96 kHz.
  static constexpr int kTrustFrom = 4;
  // How far the rise of a held bin is softened at the longest Ring: a pure peak hold rides the peaks of
  // anything noisy and comes out hot.
  static constexpr float kAttackSoftening = 0.6f;
  static constexpr float kQuarterTurn[4][2] = {{1.0f, 0.0f}, {0.0f, 1.0f}, {-1.0f, 0.0f}, {0.0f, -1.0f}};

  static float smooth_step(float x) {
    x = kit::clamp(x, 0.0f, 1.0f);
    return x * x * (3.0f - 2.0f * x);
  }

  // The mask at a pitch (a MIDI note number, not a whole one, Tune not yet taken off).
  float mask_at(float pitch) const {
    float position = (pitch - tune_) * (1.0f / 12.0f);
    position -= std::floor(position);
    const float place = position * kTable;
    const int index = static_cast<int>(place);
    const float distance = distance_[index] + (distance_[index + 1] - distance_[index]) * (place - index);
    const float off = distance * per_width_;
    float bell = 0.0f;
    if (off < kBellSpan) {
      const float at = off * (kBellSize / kBellSpan);
      const int b = static_cast<int>(at);
      bell = bell_[b] + (bell_[b + 1] - bell_[b]) * (at - b);
    }
    const float range = smooth_step(pitch - low_pitch_ + 1.0f) * smooth_step(high_pitch_ + 1.0f - pitch);
    return floor_ + (1.0f - floor_) * bell * range;
  }

  // Everything the knobs set but Mix, worked out when the left channel's next frame comes (the right
  // channel's frame of the same number follows it, so both work with the same mask): the notes, the gain at
  // every bin's centre, the hold's rates and Glow's make-up.
  void update_mask() {
    using namespace scale_filter;
    dirty_ = false;
    const int root = kit::clamp_int(static_cast<int>(param(kRoot) + 0.5f), 0, 11);
    const uint16_t notes = chord_notes(static_cast<int>(param(kScale) + 0.5f), static_cast<int>(param(kChord) + 0.5f));
    // The distance from every place in the octave (from C) to the nearest note let through, in semitones.
    for (int i = 0; i <= kTable; ++i) {
      const float at = 12.0f * static_cast<float>(i) / kTable;
      float nearest = 12.0f;
      for (int s = 0; s < 12; ++s) {
        if (!(notes & (1u << s))) continue;
        float apart = std::fabs(at - static_cast<float>((root + s) % 12));
        if (apart > 6.0f) apart = 12.0f - apart;
        if (apart < nearest) nearest = apart;
      }
      distance_[i] = nearest;
    }
    tune_ = param(kTune) * 0.01f;
    per_width_ = 100.0f / param(kWidth);
    floor_ = kit::db_to_gain(-param(kDepth));
    low_pitch_ = kit::hz_to_midi(param(kLow));
    high_pitch_ = kit::hz_to_midi(param(kHigh));

    // Ring: -60 dB in so many seconds, a frame at a time. At the bottom of the knob nothing is held.
    const float seconds = param(kRing);
    const bool ringing = seconds > kParamMin[kRing] * 1.001f;
    decay_ = ringing ? std::exp(-6.9077553f * Stft::kHop / (seconds * sample_rate())) : 0.0f;
    const float along = std::log(seconds / kParamMin[kRing]) / std::log(kParamMax[kRing] / kParamMin[kRing]);
    attack_ = ringing ? 1.0f - kAttackSoftening * kit::clamp(along, 0.0f, 1.0f) : 1.0f;

    // The gain of each bin as a whole: the root of the mean of the mask's power over the bin, read every
    // eighth of a Width, which is what an ideal filter would leave of noise that fills the bin. High up, where
    // a bin is a sliver of the opening, that is the mask at its centre; low down, where a bin holds several
    // notes and the gaps between them, it is the share of it that is open. And what the mask so takes from
    // pink noise between 20 Hz and 20 kHz (as much power in every bin's share of an octave: 1 / k).
    const float bin_hz = sample_rate() / Stft::kFrame;
    double kept = 0.0;
    double whole = 0.0;
    for (int k = 0; k < kBins; ++k) {
      float gain = floor_;
      if (k > 0) {
        const float slope = slope_[k];
        const int points = kit::clamp_int(static_cast<int>(std::ceil(8.0f * slope * per_width_)), 1, kMostPoints);
        float sum = 0.0f;
        for (int i = 0; i < points; ++i) {
          const float off = (static_cast<float>(i) + 0.5f) / static_cast<float>(points) - 0.5f;  // in bins
          const float at = mask_at(pitch_[k] + slope * off * (1.0f - 0.5f * off / static_cast<float>(k)));
          sum += at * at;
        }
        gain = std::sqrt(sum / static_cast<float>(points));
      }
      bin_gain_[k] = gain;
      const float hz = static_cast<float>(k) * bin_hz;
      if (hz >= 20.0f && hz <= 20000.0f) {
        kept += static_cast<double>(gain) * gain / k;
        whole += 1.0 / k;
      }
      int note = 255;
      if (k >= chroma_from_ && k <= chroma_to_) {
        note = static_cast<int>(std::floor(pitch_[k] - tune_ + 0.5f)) % 12;
        if (note < 0) note += 12;
      }
      note_[k] = static_cast<uint8_t>(note);
    }
    const float taken = kept > 0.0 ? static_cast<float>(std::sqrt(whole / kept)) : kMaxMakeup;
    static_makeup_ = std::pow(kit::min(taken, kMaxMakeup), param(kGlow));
  }

  // One frame of channel c, changed in place.
  void frame(int c, float* re, float* im) {
    if (c == 0 && dirty_) update_mask();
    float* last_re = last_re_[c];
    float* last_im = last_im_[c];
    im[0] = 0.0f;
    im[kBins - 1] = 0.0f;

    // 1. Each bin's power, and where what sounds in it lies: the turn of its phase since the last frame,
    //    less the bin's own k quarter turns, is its distance from the bin's centre (±π is ±2 bins).
    for (int k = 0; k < kBins; ++k) {
      const float xr = re[k];
      const float xi = im[k];
      const float tr = xr * last_re[k] + xi * last_im[k];
      const float ti = xi * last_re[k] - xr * last_im[k];
      float dr, di;
      switch (k & 3) {
        case 0: dr = tr; di = ti; break;
        case 1: dr = ti; di = -tr; break;
        case 2: dr = -tr; di = -ti; break;
        default: dr = -ti; di = tr; break;
      }
      offset_[k] = kit::fast_atan2(di, dr) * 0.63661977f;
      power_[k] = xr * xr + xi * xi;
      turned_re_[k] = tr;
      turned_im_[k] = ti;
      lead_[k] = static_cast<uint16_t>(k);
    }

    // 2. The gain. A bin and its stronger neighbour that agree on where the sound lies hold one partial:
    //    its gain is the mask at that frequency. The rest take the gain of the bin as a whole.
    gain_[0] = bin_gain_[0];
    gain_[kBins - 1] = bin_gain_[kBins - 1];
    heard_[0] = 255;
    heard_[kBins - 1] = 255;
    sure_[0] = 0;
    sure_[kBins - 1] = 0;
    double power_in = power_[0] + power_[kBins - 1];
    double power_through = static_cast<double>(gain_[0]) * gain_[0] * power_[0] +
                           static_cast<double>(gain_[kBins - 1]) * gain_[kBins - 1] * power_[kBins - 1];
    for (int k = 1; k < kBins - 1; ++k) {
      float gain = bin_gain_[k];
      uint8_t heard = note_[k];
      uint8_t sure = 0;
      const float power = power_[k];
      if (k >= kTrustFrom && power > 1.0e-12f) {
        const int n = power_[k + 1] > power_[k - 1] ? k + 1 : k - 1;
        const float apart = std::fabs(offset_[k] - offset_[n] - static_cast<float>(n - k));
        if (apart < kAgreeFar && std::fabs(offset_[k]) < 1.9f) {
          const float trust = kit::min(1.0f, (kAgreeFar - apart) * (1.0f / (kAgreeFar - kAgreeNear)));
          const float off = offset_[k];
          // 12 log2(1 + off / k), to the second order.
          const float pitch = pitch_[k] + slope_[k] * off * (1.0f - 0.5f * off / static_cast<float>(k));
          gain += trust * (mask_at(pitch) - gain);
          // The bins of one partial turn together: each takes its turn from the stronger one beside it.
          if (trust >= 1.0f && power_[n] > power) lead_[k] = static_cast<uint16_t>(n);
          sure = trust >= 1.0f;
          // And for the display a partial is read under the note it is at, not the one its bin is at.
          if (trust >= 1.0f && heard < 12) {
            int note = static_cast<int>(std::floor(pitch - tune_ + 0.5f)) % 12;
            if (note < 0) note += 12;
            heard = static_cast<uint8_t>(note);
          }
        }
      }
      gain_[k] = gain;
      heard_[k] = heard;
      sure_[k] = sure;
      power_in += power;
      power_through += static_cast<double>(gain) * gain * power;
    }

    // Glow: the make-up the mask asks for, but never so much that the frame comes out with more power than
    // it came in with. It falls at once and comes back over a quarter of a second; a silent frame leaves it
    // be, and after a silence it starts where it should stand.
    float makeup = makeup_[c];
    if (power_in > kSilence) {
      const float most = power_through > 0.0 ? static_cast<float>(std::sqrt(power_in / power_through)) : kMaxMakeup;
      const float target = kit::min(static_makeup_, most);
      makeup = (quiet_[c] || target < makeup) ? target : makeup + (target - makeup) * release_;
      makeup_[c] = makeup;
      quiet_[c] = false;
    }

    // 3. The hold, and the frame that goes out.
    float* mag = mag_[c];
    uint8_t* guessed = guessed_[c];
    float* ref_re = ref_re_[c];
    float* ref_im = ref_im_[c];
    float* next_re = next_re_[c];
    float* next_im = next_im_[c];
    float* turn_re = turn_re_[c];
    float* turn_im = turn_im_[c];
    float* note_in = chroma_in_[c];
    float* note_out = chroma_out_[c];
    for (int n = 0; n < 12; ++n) {
      note_in[n] = 0.0f;
      note_out[n] = 0.0f;
    }
    const bool ringing = decay_ > 0.0f;
    // For the display's readings only: what comes out is the dry frame and the wet one by Mix.
    const float mix = mix_.target;
    const float dry_share = 1.0f - mix;
    bool alive = false;
    for (int k = 0; k < kBins; ++k) {
      const float xr = re[k];
      const float xi = im[k];
      const float lr = last_re[k];
      const float li = last_im[k];
      last_re[k] = xr;
      last_im[k] = xi;
      const float power = power_[k];
      const float gain = makeup * gain_[k];
      float out_power;
      if (!ringing) {
        re[k] = xr * gain;
        im[k] = xi * gain;
        mag[k] = 0.0f;
        guessed[k] = 0;
        next_re[k] = 0.0f;
        next_im[k] = 0.0f;
        const float through = dry_share + mix * gain;
        out_power = through * through * power;
      } else {
        const float level = std::sqrt(power);
        const float target = gain * level;
        const float before = mag[k];
        float held = before * decay_;
        // The bin's input is holding up: no weaker than a frame ago (to 1 dB), and not far under what the
        // bin holds. A frame in which a sound is cut off has the phase of the cut, not of the sound, so
        // what is measured on one frame is only believed when the next has held up too.
        const float last_power = lr * lr + li * li;
        const bool holding = power >= 0.8f * last_power && last_power > 1.0e-24f && target > 0.1f * held;
        float tr = turn_re[k];
        float ti = turn_im[k];
        if (holding) {
          const float size = next_re[k] * next_re[k] + next_im[k] * next_im[k];
          if (size > 1.0e-24f) {
            const float inverse = 1.0f / std::sqrt(size);
            tr = next_re[k] * inverse;
            ti = next_im[k] * inverse;
            turn_re[k] = tr;
            turn_im[k] = ti;
          }
          // This frame's turn, for the next frame to confirm: from the peak of the partial the bin belongs
          // to, two steps uphill at the most; a bin on its own has its own. (A partial's bins all turn by
          // the same angle a frame, whatever their number.)
          const int peak = lead_[lead_[lead_[k]]];
          next_re[k] = turned_re_[peak];
          next_im[k] = turned_im_[peak];
        } else {
          next_re[k] = 0.0f;
          next_im[k] = 0.0f;
        }
        // The phase the bin would have now had its sound gone on as it was: the last frame's, turned on,
        // while the input holds up; and from there on its own, turned on each frame.
        float pr, pi;
        if (holding) {
          const float inverse = 1.0f / std::sqrt(last_power);
          pr = (lr * tr - li * ti) * inverse;
          pi = (lr * ti + li * tr) * inverse;
        } else if (before > 0.0f) {
          pr = ref_re[k] * tr - ref_im[k] * ti;
          pi = ref_re[k] * ti + ref_im[k] * tr;
          const float keep = 1.5f - 0.5f * (pr * pr + pi * pi);  // back to unit length
          pr *= keep;
          pi *= keep;
        } else {
          // A bin that holds nothing stands still, so a frame of silence leaves no trace: the frames a
          // sleep skips are then the same as frames worked through.
          pr = ref_re[k];
          pi = ref_im[k];
        }
        ref_re[k] = pr;
        ref_im[k] = pi;
        // A note's first frames cannot be placed, and come in on the gain of their bins as a whole. Once
        // it is placed and still sounding, what the bin holds of that guess is the note's own and is given
        // up: a note off the scale does not ring on for having begun. (What the bin held as a placed
        // partial, or holds more of than the note could have brought, rings on.)
        const bool taken_back = sure_[k] && guessed[k] && power >= 0.8f * last_power && held <= makeup * level;
        if (target >= held || taken_back) {
          // Driven by the input, with the input's own phase. A rise over what the bin held is softened;
          // under that the bin is at the input's own level, so a steady tone comes out as it went in.
          guessed[k] = !sure_[k];
          held = target > before ? before + attack_ * (target - before) : target;
          if (held < kFloor) held = 0.0f;
          const float scale = level > 1.0e-12f ? held / level : 0.0f;
          re[k] = xr * scale;
          im[k] = xi * scale;
        } else {
          // Let go of: what the bin holds, at the phase its sound would have had.
          if (held < kFloor) held = 0.0f;
          re[k] = held * pr;
          im[k] = held * pi;
        }
        mag[k] = held;
        alive = alive || held > 0.0f;
        const float out_re = dry_share * xr + mix * re[k];
        const float out_im = dry_share * xi + mix * im[k];
        out_power = out_re * out_re + out_im * out_im;
      }
      const int note = heard_[k];
      if (note < 12) {
        note_in[note] += power;
        note_out[note] += out_power;
      }
    }
    alive_[c] = alive;
    if (!alive && !(power_in > kSilence)) quiet_[c] = true;

    // The readings for the display, once both channels have had this frame.
    if (c == 1) {
      for (int n = 0; n < 12; ++n) {
        packed_[n] = static_cast<float>(steps(0.5f * (chroma_in_[0][n] + chroma_in_[1][n])) +
                                        64 * steps(0.5f * (chroma_out_[0][n] + chroma_out_[1][n])));
      }
    }
  }

  // A power as whole dB over 63 dB under a full-scale tone's (which reads 1.5 × kFullScale² over its bins): 0
  // for nothing, 63 at the most.
  static int steps(float power) {
    if (!(power > 0.0f)) return 0;
    const float db = 10.0f * std::log10(power * (1.0f / (1.5f * Stft::kFullScale * Stft::kFullScale)));
    return kit::clamp_int(static_cast<int>(std::floor(db + 63.5f)), 0, 63);
  }

  Stft stft_[2];
  // Per bin, per channel: what the bin holds; the phase its sound would have now and its turn per frame, as
  // unit vectors; the turn measured on the last frame, waiting to be confirmed; and the frame before.
  float mag_[2][kBins] = {};
  uint8_t guessed_[2][kBins] = {};  // what a bin holds came in on its gain as a whole, not as a placed partial
  float ref_re_[2][kBins] = {};
  float ref_im_[2][kBins] = {};
  float next_re_[2][kBins] = {};
  float next_im_[2][kBins] = {};
  float turn_re_[2][kBins] = {};
  float turn_im_[2][kBins] = {};
  float last_re_[2][kBins] = {};
  float last_im_[2][kBins] = {};
  // Per bin, from the sample rate: its pitch as a MIDI note number, and how many semitones a bin is there.
  float pitch_[kBins] = {};
  float slope_[kBins] = {};
  // Per bin, from the knobs: its gain as a whole and the pitch class it is read under (255 for none).
  float bin_gain_[kBins] = {};
  uint8_t note_[kBins] = {};
  // Work space of one frame.
  float offset_[kBins] = {};
  float power_[kBins] = {};
  float gain_[kBins] = {};
  float turned_re_[kBins] = {};  // this frame against the last: the turn of each bin's phase, not normalised
  float turned_im_[kBins] = {};
  uint16_t lead_[kBins] = {};    // the bin whose turn a bin takes: the stronger one beside it, or itself
  uint8_t sure_[kBins] = {};     // the bin holds a partial whose place is known in this frame
  uint8_t heard_[kBins] = {};    // the pitch class a bin's sound is read under in this frame (255 for none)
  float distance_[kTable + 1] = {};
  float bell_[kBellSize + 1] = {};
  float chroma_in_[2][12] = {};
  float chroma_out_[2][12] = {};
  float packed_[12] = {};
  float makeup_[2] = {1.0f, 1.0f};
  bool alive_[2] = {false, false};  // any bin still holding sound
  bool quiet_[2] = {true, true};    // the last frame was silent and held nothing
  bool dirty_ = true;
  int chroma_from_ = 1;
  int chroma_to_ = 1;
  float tune_ = 0.0f;
  float per_width_ = 1.0f;
  float floor_ = 1.0f;
  float low_pitch_ = 0.0f;
  float high_pitch_ = 127.0f;
  float decay_ = 0.0f;
  float attack_ = 1.0f;
  float static_makeup_ = 1.0f;
  float release_ = 1.0f;
  kit::Smoother mix_;
  kit::IdleGate idle_;
};

}  // namespace livemix
