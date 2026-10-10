#pragma once

// Warp: moves every partial by a curve. A pitch shifter multiplies every
// frequency by one number and a frequency shifter adds one number to each;
// here a partial at f goes to
//
//   g(f) = pivot × (f / pivot)^e × 2^(shift / 12),      e = 2^stretch
//
// so the spacing of the partials is stretched (e > 1) or squeezed (e < 1)
// around a pivot that stays where it was. Evenly spaced partials come out
// unevenly spaced: a string turns into a bell.
//
//   in ─┬─► kit::Stft ring ─────────────────────────────────► dry() ─┐
//       │                                                             ├─► out
//       └─► frame ─► peaks ─► move each peak's region ─► tone ─► clip ┘
//
// 4096-point frames every 1024 samples (kit::Stft<4096, 1024>): a bin is
// 11.7 Hz wide at 48 kHz, so partials 47 Hz apart are told from one another
// and a low note's harmonics move one by one. The latency is 4608 samples
// and the dry path is as late (Stft::dry()), so Mix does not comb.
//
// One frame of one channel (frame() below):
//
// 1. Peaks. A bin whose power tops its two neighbours on either side is a
//    partial. Its true frequency is read from how far its phase turned since
//    the last frame (Stft::advance_to_bin), so a partial between two bins is
//    placed to a hundredth of a hertz. Each peak owns the bins from the
//    quietest bin below it to the quietest bin above it: its region.
// 2. The move. A region is moved whole by Δ = g(b) - b bins (b the peak's
//    place in bins, not a whole number) and turned by an angle that adds up
//    Δ / 4 of a turn every frame: together that is the region multiplied by
//    exp(j 2π Δ n / Frame) in time, a frequency shift of its own. A shift
//    changes no envelope, so an attack stays an attack, and the bins of one
//    partial move and turn as one, so a sine stays a sine. The part of Δ that
//    is not a whole bin is done by weighting two neighbouring bins, with the
//    signs a frame centred on its middle needs ((-1)^d: the kit counts phases
//    from the frame's first sample); that costs up to 0.9 dB of level, which
//    kInterpolationLoss gives back.
// 3. The angle is kept per input bin, so the partial that sits there next
//    frame carries on from it. A region that is to move by less than a
//    quarter of a hertz is at rest: it stays where it is and its
//    angle falls back to nought, so a partial on the pivot, and everything
//    with Stretch in the middle and Shift at 0, lines up with the dry path
//    again, whatever was played before. Mix is an equal-power crossfade, and
//    a region at rest is turned down by (1 - cos) / sin of Mix's angle, so
//    that with its dry self it adds up to what came in: a partial that does
//    not move keeps its level at every Mix.
//
// - Lean says where the stretch bites. With o the octaves from the pivot
//   and r = (o/2)² / (1 + (o/2)²), which runs from 0 at the pivot to 1 far
//   from it, the stretch is weighted by w = 1 - lean (1 - r) for lean ≥ 0
//   (at 1 the partials near the pivot stay close to where they were and the
//   far ones move most, as on a stiff string) and by w = 1 + lean r for
//   lean < 0 (at -1 the near ones move and the far ones stay):
//
//     g(f) = pivot × 2^(o (1 + (e - 1) w) + shift / 12)
//
//   The curve rises all the way at every setting, so partials never cross.
// - Drift adds a slow wander to the stretch: three sines at 0.043 Hz and
//   two rates beside it, read from the frame's number (the Stft's sample
//   clock), so it keeps its place through silence and sleep and is the same
//   at every block size. Up to ±0.12 of the stretch's range.
// - Width moves the two sides' stretches apart, left down and right up, by
//   up to 0.04 each. At 0 a mono input stays mono, bit for bit.
// - Follow puts a pivot on every note being played, at or above the Pivot
//   setting (track() below, up to eight, each channel from its own spectrum):
//   each note keeps its pitch and its overtones are warped from it.
// - Tone is a gain per bin on the wet signal, over 500 Hz only: up to 6 dB
//   an octave of cut (turned down) or of boost (turned up, never more than
//   12 dB). What lies under 500 Hz is left as it is, so a darker tone is
//   not a louder one.
//
// The wet path sums nothing: left stays left and right stays right. Nothing
// is held and nothing feeds back; what goes above half the sample rate or
// below nought is dropped. The wet signal passes a clip that is linear up to
// ±1 and never passes ±2.
//
// Storage: two Stft<4096, 1024> (176 KB each) and nine arrays of 2049 floats
// per channel or shared (74 KB): 0.43 MB in all.

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Warp : public kit::DeviceBase<warp::kNumParams> {
 public:
  using Stft = kit::Stft<4096, 1024>;
  static constexpr int kLatency = Stft::kLatency;  // 4608: "latencySamples" in device.json
  static constexpr int kBins = Stft::kBins;
  static constexpr int kMarks = 6;   // the strongest partials reported to the display
  static constexpr int kPivots = 8;  // Follow: the most notes that each get a pivot

  // The constants of the curve, which the display copies (src/react/components/displays/warp.ts).
  static constexpr float kDriftDepth = 0.12f;  // of stretch, at Drift 1
  static constexpr float kWidthDepth = 0.04f;  // of stretch each side, at Width 1
  static constexpr float kDriftHz = 0.043f;
  static constexpr float kLeanOctaves = 2.0f;  // where Lean's weight is a half
  // The drift's three sines: their rates against kDriftHz, their weights, and where each starts
  // (in 2^32 of a turn).
  static constexpr double kDriftRate[3] = {1.0, 0.6180339887, 1.7320508076};
  static constexpr float kDriftWeight[3] = {0.5f, 0.3f, 0.2f};
  static constexpr uint32_t kDriftStart[3] = {0x1F3A5C00u, 0x8E2B9D00u, 0xC4D17A00u};
  static constexpr float kTonePivotHz = 500.0f;
  static constexpr float kToneDbPerOctave = 6.0f;
  static constexpr float kToneMaxBoostDb = 12.0f;
  static constexpr float kToneMaxCutDb = 48.0f;

  void init(float sample_rate) {
    using namespace warp;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();
    stft_[1].init(Stft::kMaxStagger);
    for (int k = 0; k < kBins; ++k) {
      octave_[k] = std::log2(Stft::bin_to_hz(static_cast<float>(k > 0 ? k : 1), sr) / kTonePivotHz);
      tone_gain_[k] = 1.0f;
      power_[k] = 0.0f;
    }
    for (int k = 0; k <= kBins; ++k) {
      out_re_[k] = 0.0f;
      out_im_[k] = 0.0f;
    }
    peaks_ = 0;
    stretch_now_ = param(kStretch);
    for (int c = 0; c < 2; ++c) {
      Channel& channel = channel_[c];
      for (int k = 0; k < kBins; ++k) {
        channel.last_re[k] = 0.0f;
        channel.last_im[k] = 0.0f;
        channel.turn[k] = 0.0f;
      }
      for (float& pivot : channel.pivots) pivot = 0.0f;
      for (int& age : channel.age) age = 0;
      for (float& power : channel.pivot_power) power = 0.0f;
      for (float& power : channel.note_power) power = 0.0f;
      channel.pivot_bin = Stft::hz_to_bin(param(kPivot), sr);
      for (int m = 0; m < kMarks; ++m) {
        channel.mark_in[m] = 0.0f;
        channel.mark_out[m] = 0.0f;
        channel.mark_level[m] = 0.0f;
      }
    }
    tone_dirty_ = true;
    rest_gain_ = 1.0f;
    at_rest_ = Stft::hz_to_bin(kAtRestHz, sr);
    young_frames_ = static_cast<int>(kYoungSeconds * sr / Stft::kHop + 0.5f);
    // The drift's three phases per frame, as fractions of 2^32 of a turn.
    const double turns_per_frame = static_cast<double>(kDriftHz) * Stft::kHop / sr;
    for (int i = 0; i < 3; ++i) {
      drift_step_[i] = static_cast<uint32_t>(turns_per_frame * kDriftRate[i] * 4294967296.0);
    }
    mix_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    mix_seen_ = -1.0f;
    // What is in flight when the input stops: a latency and a frame.
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
  }

  void set_param(int id, float value) {
    using namespace warp;
    if (!store_param(id, value)) return;
    // (asleep, a knob snaps: nothing is sounding for it to glide under)
    if (id == kMix) mix_.set(param(id), primed() && !idle_.asleep());
    if (id == kTone) tone_dirty_ = true;
  }

  // The readings named by "meters" in device.json, for the display:
  // 0, the stretch in use now, Drift's wander included and Width's left and
  // right offsets not (asleep, where the knob stands);
  // 1, the pivot in use now in hertz: the knob's, or with Follow on the
  // partial the pivot has gone to (of the louder side);
  // 2 to 19, the six strongest partials of the newest frame of the louder
  // side, strongest first: where each came in and where it was sent, in
  // hertz, and its level (1 is a full-scale sine). Asleep, and for a mark
  // with no partial, the level is 0.
  float meter(int index) const {
    using namespace warp;
    const bool asleep = idle_.asleep();
    if (index == 0) return asleep ? param(kStretch) : stretch_now_;
    const Channel& channel = channel_[channel_[1].mark_level[0] > channel_[0].mark_level[0] ? 1 : 0];
    if (index == 1) {
      return asleep ? param(kPivot) : Stft::bin_to_hz(channel.pivot_bin, sample_rate());
    }
    const int mark = (index - 2) / 3;
    if (index < 2 || mark >= kMarks || asleep) return 0.0f;
    const int what = (index - 2) % 3;
    if (what == 2) return channel.mark_level[mark];
    return Stft::bin_to_hz(what == 0 ? channel.mark_in[mark] : channel.mark_out[mark], sample_rate());
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock, and the drift read from it, run on through the sleep
      stft_[1].skip(frames);
      mix_.snap(mix_.target);  // a knob moved while asleep does not glide in
      for (int c = 0; c < 2; ++c) {
        for (int m = 0; m < kMarks; ++m) channel_[c].mark_level[m] = 0.0f;
      }
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float wet = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        // Linear up to ±1, never past ±2.
        out[c] = stft_[c].dry() * dry_gain_ + 2.0f * kit::soft_clip(0.5f * wet) * wet_gain_;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // A peak under this (in power) is not a partial: -140 dBFS for a sine.
  static constexpr float kPeakFloor = (Stft::kFullScale * 1.0e-7f) * (Stft::kFullScale * 1.0e-7f);
  // The most peaks a frame can hold: one in three bins.
  static constexpr int kMaxPeaks = kBins / 3 + 2;
  // A region moved by half a bin comes out this share quieter; in between by 4 ε (1 - ε) of it.
  static constexpr float kInterpolationLoss = 0.095f;
  // A region whose move is under a quarter of a hertz is at rest: it is left where it is and its
  // angle falls back to nought. The measure of a partial's place is good to a thousandth of a
  // hertz and worse in the frames of an attack; without a rest wider than that a partial on the
  // pivot would keep whatever angle its attack left it, and part way up Mix it would cancel
  // against the dry one, or not, by chance.
  static constexpr float kAtRestHz = 0.25f;
  static constexpr float kRestDecay = 0.75f;
  // Follow: a partial is strong within 18 dB of the strongest, the pivot stays with a partial until
  // it is 36 dB under, and a partial within 3 % (half a semitone) is the one it had.
  static constexpr float kAcquirePower = 0.01585f;
  static constexpr float kReleasePower = 2.512e-4f;
  static constexpr float kSameNote = 0.03f;
  static constexpr float kYoungSeconds = 0.25f;
  static constexpr float kOvertoneMargin = 4.0f;  // in power: 6 dB over a sawtooth's harmonic
  static constexpr float kFreshRise = 2.0f;       // in power, from one frame to the next

  struct Channel {
    float last_re[kBins], last_im[kBins];  // the previous analysis frame
    float turn[kBins];                     // each input bin's added angle, in turns, [-0.5, 0.5)
    float pivots[kPivots];                 // Follow: each note's partial in bins, 0 for a free place
    float pivot_power[kPivots];            // the power of its partial in the newest frame
    float note_power[kPivots];             // and of the strongest partial that went with it
    int age[kPivots];                      // and the frames it has been one, up to young_frames_
    float pivot_bin;                       // the pivot in use, in bins (Follow: the lowest)
    float mark_in[kMarks], mark_out[kMarks], mark_level[kMarks];  // for meter() only
  };

  // The slow wander Drift adds, about ±1, at frame `n`: three sines whose phases are the frame's
  // number times a step, in whole numbers that wrap with the turn.
  float wander(uint32_t n) const {
    float sum = 0.0f;
    for (int i = 0; i < 3; ++i) {
      const uint32_t phase = kDriftStart[i] + n * drift_step_[i];
      sum += kDriftWeight[i] * kit::SineTable::lookup(static_cast<float>(phase >> 8) * (1.0f / 16777216.0f));
    }
    return sum;
  }

  // Gain per bin from Tone: a slope over kTonePivotHz, nothing under it.
  void update_tone() {
    using namespace warp;
    const float slope = param(kTone) * kToneDbPerOctave;
    for (int k = 0; k < kBins; ++k) {
      const float db = kit::clamp(slope * octave_[k], -kToneMaxCutDb, kToneMaxBoostDb);
      tone_gain_[k] = (slope == 0.0f || octave_[k] <= 0.0f) ? 1.0f : std::exp(db * 0.11512925f);
    }
    tone_dirty_ = false;
  }

  // Follow: the notes being played, each a pivot. From this frame's peaks (peak_bin_, peak_true_,
  // peak_fresh_, `peaks_` of them, lowest first) and the pivots there were:
  // - a pivot stays on its partial (the nearest peak within half a semitone) for as long as that,
  //   or any overtone that went with it in the last frame, is within 36 dB of the strongest
  //   partial; while only overtones are left it stays where it was;
  // - a strong partial (within 18 dB of the strongest) at or over the knob becomes a pivot when it
  //   is no harmonic of one; and one that is a harmonic, when it has just been struck (its power
  //   has more than doubled since the last frame) and is too strong for an overtone: 6 dB over
  //   what the n-th harmonic of a sawtooth on that pivot would be (the pivot's power × 4 / n²).
  //   So a melody note struck on a harmonic of a held bass is a note, the overtones of one rich
  //   note are overtones, and an overtone does not turn into a note when its fundamental fades;
  // - a young pivot that would not be taken now is let go: the frames of an attack are smeared,
  //   and a pivot taken in one can settle on an overtone of the note that follows, which would
  //   then not move. An old one stays, so a held note keeps its pitch whatever is struck under it.
  // With every place taken, a stronger newcomer takes the weakest pivot's.
  void track(Channel& channel, float floor_bin) const {
    const float lowest = floor_bin * (1.0f - kSameNote);
    float strongest = 0.0f;
    for (int i = 0; i < peaks_; ++i) {
      if (peak_true_[i] >= lowest) strongest = kit::max(strongest, power_[peak_bin_[i]]);
    }
    for (int j = 0; j < kPivots; ++j) {
      const float pivot = channel.pivots[j];
      if (!(pivot > 0.0f)) continue;
      float nearest = 0.0f;
      float distance = pivot * kSameNote + 0.5f;
      for (int i = 0; i < peaks_ && pivot >= lowest; ++i) {
        const float off = std::fabs(peak_true_[i] - pivot);
        if (off <= distance && power_[peak_bin_[i]] >= strongest * kReleasePower) {
          distance = off;
          nearest = peak_true_[i];
          channel.pivot_power[j] = power_[peak_bin_[i]];
        }
      }
      if (nearest > 0.0f) {
        channel.pivots[j] = nearest;
      } else if (pivot < lowest || channel.note_power[j] < strongest * kReleasePower) {
        channel.pivots[j] = 0.0f;  // the note has gone: the place is free
      }
    }
    for (int j = 0; j < kPivots; ++j) {
      if (!(channel.pivots[j] > 0.0f) || channel.age[j] >= young_frames_) continue;
      ++channel.age[j];
      const float pivot = channel.pivots[j];
      channel.pivots[j] = 0.0f;  // out of the way while it is judged against the others
      if (is_note(channel, pivot, channel.pivot_power[j], true)) channel.pivots[j] = pivot;
    }
    for (int i = 0; i < peaks_; ++i) {
      const float place = peak_true_[i];
      const float power = power_[peak_bin_[i]];
      if (place < lowest || power < strongest * kAcquirePower) continue;
      if (!is_note(channel, place, power, peak_fresh_[i] != 0)) continue;
      int free = -1, weakest = 0;
      for (int j = 0; j < kPivots; ++j) {
        if (!(channel.pivots[j] > 0.0f)) {
          free = j;
          break;
        }
        if (channel.pivot_power[j] < channel.pivot_power[weakest]) weakest = j;
      }
      if (free < 0 && power > channel.pivot_power[weakest]) free = weakest;
      if (free >= 0) {
        channel.pivots[free] = place;
        channel.pivot_power[free] = power;
        channel.note_power[free] = power;
        channel.age[free] = 0;
      }
    }
  }

  // Whether a partial at `place` bins with this power is a note of its own beside the pivots there
  // are: not one of them, and no harmonic of one, or freshly struck and too strong for an overtone.
  static bool is_note(const Channel& channel, float place, float power, bool fresh) {
    int harmonic = 0;
    const int owner = pivot_for(channel, place, &harmonic);
    if (owner < 0 || harmonic == 0) return true;
    if (harmonic == 1 || !fresh) return false;
    return power * static_cast<float>(harmonic) * static_cast<float>(harmonic) >=
           kOvertoneMargin * channel.pivot_power[owner];
  }

  // The pivot (its place in channel.pivots) a partial at `place` bins is warped around, with
  // Follow on: the pivot it is a harmonic of (within half a semitone; of several, the one it is
  // the lowest harmonic of), which `harmonic` then numbers; failing that the nearest pivot under
  // it, or the lowest of all, with `harmonic` 0. -1 when there is no pivot.
  static int pivot_for(const Channel& channel, float place, int* harmonic) {
    int fits = -1, under = -1, bottom = -1;
    int number = 1 << 30;
    for (int j = 0; j < kPivots; ++j) {
      const float pivot = channel.pivots[j];
      if (!(pivot > 0.0f)) continue;
      if (bottom < 0 || pivot < channel.pivots[bottom]) bottom = j;
      const float ratio = place / pivot;
      if (ratio < 1.0f - kSameNote) continue;
      if (under < 0 || pivot > channel.pivots[under]) under = j;
      const float n = std::floor(ratio + 0.5f);
      if (std::fabs(ratio - n) <= kSameNote * ratio && static_cast<int>(n) < number) {
        number = static_cast<int>(n);
        fits = j;
      }
    }
    *harmonic = fits >= 0 ? number : 0;
    return fits >= 0 ? fits : (under >= 0 ? under : bottom);
  }

  // One frame of channel c: kBins bins, changed in place. Parameters are read here, once per
  // frame; the overlap crossfades a change.
  void frame(int c, float* re, float* im) {
    using namespace warp;
    Channel& channel = channel_[c];
    const float sr = sample_rate();
    if (c == 0 && tone_dirty_) update_tone();

    // The stretch for this side: the knob, the drift (the same for both sides), and the width.
    const float centre = param(kStretch) + param(kDrift) * kDriftDepth * wander(stft_[c].frame());
    if (c == 0) stretch_now_ = centre;
    const float stretch = centre + (c == 0 ? -1.0f : 1.0f) * param(kWidth) * kWidthDepth;
    const float lean = param(kLean);
    const float exponent = std::exp2(stretch) - 1.0f;    // e - 1
    const float shift = param(kShift) * (1.0f / 12.0f);  // octaves
    // What a region at rest is turned down by. Mix is an equal-power crossfade, which is right for
    // partials that have moved (they add to the dry ones as power) and 3 dB too much at the centre
    // for one that has not (it adds to its dry self as amplitude). With (1 - cos) / sin on those,
    // dry × cos + wet × sin is the partial as it came in, at every Mix.
    float dry_gain, wet_gain;
    kit::equal_power(param(kMix), &dry_gain, &wet_gain);
    rest_gain_ = wet_gain > 1.0e-4f ? (1.0f - dry_gain) / wet_gain : 0.0f;

    // 1. Power, and the peaks: a bin over its two neighbours on either side.
    for (int k = 0; k < kBins; ++k) power_[k] = re[k] * re[k] + im[k] * im[k];
    peaks_ = 0;
    for (int k = 2; k < kBins - 2; ++k) {
      const float p = power_[k];
      if (p > kPeakFloor && p > power_[k - 1] && p > power_[k - 2] && p >= power_[k + 1] && p >= power_[k + 2]) {
        // Its true place in bins, from the turn since the last frame; a peak that was not there
        // a frame ago (an onset) is taken at its bin's centre.
        float place = static_cast<float>(k);
        const float lr = channel.last_re[k];
        const float li = channel.last_im[k];
        // Freshly struck: its power has more than doubled since the last frame (a note coming
        // into the frame grows thirty times, then three, then levels off).
        float before = lr * lr + li * li;
        for (int j = k - 1; j <= k + 1; j += 2) {
          before = kit::max(before, channel.last_re[j] * channel.last_re[j] + channel.last_im[j] * channel.last_im[j]);
        }
        peak_fresh_[peaks_] = p > kFreshRise * before;
        if (lr * lr + li * li > 1.0e-4f * p) {
          const float advance = kit::fast_atan2(im[k] * lr - re[k] * li, re[k] * lr + im[k] * li);
          place = kit::clamp(Stft::advance_to_bin(k, advance), place - 1.0f, place + 1.0f);
        }
        peak_bin_[peaks_] = static_cast<int16_t>(k);
        peak_true_[peaks_] = place;
        ++peaks_;
        k += 2;  // the next two cannot be peaks
      }
    }
    for (int k = 0; k < kBins; ++k) {
      channel.last_re[k] = re[k];
      channel.last_im[k] = im[k];
    }

    if (peaks_ == 0) {
      // A frame of silence: the angles and the partial Follow was on are forgotten, so what comes
      // after a silence starts as it would after init (a sleep is only ever entered past such a
      // frame, so it makes no difference whether the device slept).
      for (int k = 0; k < kBins; ++k) channel.turn[k] = 0.0f;
      for (float& pivot : channel.pivots) pivot = 0.0f;
    }

    // The pivot: the knob's, or with Follow on the notes being played (the knob until there is one).
    const float knob_bin = Stft::hz_to_bin(param(kPivot), sr);
    const bool follow = param(kFollow) >= 0.5f;
    if (follow) {
      track(channel, knob_bin);
    } else {
      for (float& pivot : channel.pivots) pivot = 0.0f;
    }
    int harmonic = 0;
    const int bottom = follow ? pivot_for(channel, 0.0f, &harmonic) : -1;
    const bool following = bottom >= 0;
    channel.pivot_bin = following ? channel.pivots[bottom] : knob_bin;
    const float log2_knob = std::log2(knob_bin);
    for (float& power : channel.note_power) power = 0.0f;

    // 2. Each peak's region, moved whole.
    int marks = 0;
    float mark_power[kMarks];
    int low = 0;
    for (int i = 0; i < peaks_; ++i) {
      const int k = peak_bin_[i];
      // The region ends at the quietest bin before the next peak.
      int high = kBins;
      if (i + 1 < peaks_) {
        high = k + 1;
        for (int j = k + 2; j < peak_bin_[i + 1]; ++j) {
          if (power_[j] < power_[high]) high = j;
        }
      }
      const float place = peak_true_[i];
      float octaves = std::log2(place) - log2_knob;
      if (following) {
        const int owner = pivot_for(channel, place, &harmonic);
        octaves = std::log2(place / channel.pivots[owner]);
        if (harmonic > 0) channel.note_power[owner] = kit::max(channel.note_power[owner], power_[k]);
      }
      // Lean's weight: r runs from 0 at the pivot to 1 far from it (a half at kLeanOctaves).
      const float x = octaves * (1.0f / kLeanOctaves);
      const float r = x * x / (1.0f + x * x);
      const float weight = lean >= 0.0f ? 1.0f - lean * (1.0f - r) : 1.0f + lean * r;
      // g(place) = pivot × 2^(octaves × (1 + (e - 1) w) + shift) = place × 2^(octaves × (e - 1) w +
      // shift): written the second way, a region that is not to move has a move of exactly nought.
      const float ratio = std::exp2(octaves * exponent * weight + shift);
      move_region(channel, re, im, low, high, k, place * (ratio - 1.0f), place * ratio);

      // The strongest few, for the display.
      const float p = power_[k];
      if (marks < kMarks || p > mark_power[kMarks - 1]) {
        int at = marks < kMarks ? marks++ : kMarks - 1;
        for (; at > 0 && mark_power[at - 1] < p; --at) {
          mark_power[at] = mark_power[at - 1];
          channel.mark_in[at] = channel.mark_in[at - 1];
          channel.mark_out[at] = channel.mark_out[at - 1];
        }
        mark_power[at] = p;
        channel.mark_in[at] = place;
        channel.mark_out[at] = place * ratio;
      }
      low = high;
    }
    for (int m = 0; m < kMarks; ++m) {
      channel.mark_level[m] = m < marks ? std::sqrt(mark_power[m]) * (1.0f / Stft::kFullScale) : 0.0f;
    }

    // 3. Tone on the way out, and the sums emptied for the next frame.
    for (int k = 0; k < kBins; ++k) {
      re[k] = out_re_[k] * tone_gain_[k];
      im[k] = out_im_[k] * tone_gain_[k];
      out_re_[k] = 0.0f;
      out_im_[k] = 0.0f;
    }
    out_re_[kBins] = 0.0f;
    out_im_[kBins] = 0.0f;
  }

  // Bins [low, high) of this frame, the region of the peak at bin `peak`, added to the output
  // `move` bins higher (not a whole number) and turned by the region's angle. `target` is where
  // the peak lands: past the ends of the spectrum the region is dropped.
  void move_region(Channel& channel, const float* re, const float* im, int low, int high, int peak, float move,
                   float target) {
    // The angle: what the bin under the peak carried, on by a quarter of the move in turns
    // (Hop / Frame), wrapped. At rest it falls back to nought.
    float turn = channel.turn[peak];
    if (std::fabs(move) < at_rest_) {
      move = 0.0f;
      turn *= kRestDecay;
      if (std::fabs(turn) < 1.0e-6f) turn = 0.0f;
    } else {
      turn += move * (1.0f / Stft::kOverlap);
      turn -= std::floor(turn + 0.5f);
    }
    for (int k = low; k < high; ++k) channel.turn[k] = turn;
    if (!(target >= 0.5f && target <= static_cast<float>(kBins - 2))) return;

    const float whole = std::floor(move);
    const float part = move - whole;
    const int d = static_cast<int>(whole);
    // Two neighbouring bins share the part of a bin, with the signs of a frame centred on its
    // middle, and the level that costs is given back.
    const float gain = move == 0.0f ? rest_gain_ : 1.0f / (1.0f - 4.0f * kInterpolationLoss * part * (1.0f - part));
    const float sign = (d & 1) ? -gain : gain;
    const float cosine = kit::SineTable::cos_lookup(turn);
    const float sine = kit::SineTable::lookup(turn);
    const float ar = cosine * sign * (1.0f - part), ai = sine * sign * (1.0f - part);
    const float br = -cosine * sign * part, bi = -sine * sign * part;
    // Bins that would land outside 0..kBins-1 are dropped (out_*[kBins] is a spare slot).
    const int from = low > -d ? low : -d;
    const int to = high < kBins - d ? high : kBins - d;
    float* out_re = out_re_ + d;
    float* out_im = out_im_ + d;
    for (int k = from; k < to; ++k) {
      const float xr = re[k], xi = im[k];
      out_re[k] += xr * ar - xi * ai;
      out_im[k] += xr * ai + xi * ar;
      out_re[k + 1] += xr * br - xi * bi;
      out_im[k + 1] += xr * bi + xi * br;
    }
  }

  Stft stft_[2];
  Channel channel_[2];
  float power_[kBins];
  float out_re_[kBins + 1], out_im_[kBins + 1];  // the moved spectrum, summed
  float octave_[kBins];                          // octaves from the tone's corner, per bin
  float tone_gain_[kBins];
  float peak_true_[kMaxPeaks];  // each peak's true place in bins
  int16_t peak_bin_[kMaxPeaks];
  uint8_t peak_fresh_[kMaxPeaks];  // whether it has just been struck
  int peaks_ = 0;
  uint32_t drift_step_[3] = {0, 0, 0};
  kit::Smoother mix_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  float at_rest_ = 0.0f;      // kAtRestHz in bins
  int young_frames_ = 12;     // kYoungSeconds in frames
  float rest_gain_ = 1.0f;    // this frame's gain for a region at rest
  float stretch_now_ = 0.0f;  // for meter() only
  bool tone_dirty_ = true;
};

}  // namespace livemix
