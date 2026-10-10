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
// - Lean scales the stretch on one side of the pivot down to nothing: the
//   exponent above the pivot is 2^(stretch × min(1, 1 + lean)), below it
//   2^(stretch × min(1, 1 - lean)).
// - Drift adds a slow wander to the stretch: three sines at 0.043 Hz and
//   two rates beside it, read from the frame's number (the Stft's sample
//   clock), so it keeps its place through silence and sleep and is the same
//   at every block size. Up to ±0.12 of the stretch's range.
// - Width moves the two sides' stretches apart, left down and right up, by
//   up to 0.04 each. At 0 a mono input stays mono, bit for bit.
// - Follow moves the pivot to the lowest strong partial at or above the
//   Pivot setting (Tracker below), each channel from its own spectrum.
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
  static constexpr int kMarks = 6;  // the strongest partials reported to the display

  // The constants of the curve, which the display copies (src/react/components/displays/warp.ts).
  static constexpr float kDriftDepth = 0.12f;  // of stretch, at Drift 1
  static constexpr float kWidthDepth = 0.04f;  // of stretch each side, at Width 1
  static constexpr float kDriftHz = 0.043f;
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
      channel.tracked = 0.0f;
      channel.pivot_bin = Stft::hz_to_bin(param(kPivot), sr);
      for (int m = 0; m < kMarks; ++m) {
        channel.mark_bin[m] = 0.0f;
        channel.mark_level[m] = 0.0f;
      }
    }
    tone_dirty_ = true;
    rest_gain_ = 1.0f;
    at_rest_ = Stft::hz_to_bin(kAtRestHz, sr);
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
  // 2 to 13, the six strongest partials of the newest frame of the louder
  // side, strongest first: where each came in, in hertz, and its level
  // (1 is a full-scale sine). Asleep, and for a mark with no partial, 0.
  float meter(int index) const {
    using namespace warp;
    const bool asleep = idle_.asleep();
    if (index == 0) return asleep ? param(kStretch) : stretch_now_;
    const Channel& channel = channel_[channel_[1].mark_level[0] > channel_[0].mark_level[0] ? 1 : 0];
    if (index == 1) {
      return asleep ? param(kPivot) : Stft::bin_to_hz(channel.pivot_bin, sample_rate());
    }
    const int mark = (index - 2) >> 1;
    if (index < 2 || mark >= kMarks || asleep) return 0.0f;
    if (((index - 2) & 1) == 0) return Stft::bin_to_hz(channel.mark_bin[mark], sample_rate());
    return channel.mark_level[mark];
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

  struct Channel {
    float last_re[kBins], last_im[kBins];  // the previous analysis frame
    float turn[kBins];                     // each input bin's added angle, in turns, [-0.5, 0.5)
    float tracked;                         // Follow: the pivot's partial in bins, 0 before any
    float pivot_bin;                       // the pivot in use, in bins
    float mark_bin[kMarks], mark_level[kMarks];
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

  // Follow: the pivot's place in bins, from this frame's peaks (peak_bin_, peak_true_, `peaks_` of
  // them, lowest first) and the partial it was on. With no peak at or over the knob it stays.
  float track(Channel& channel, float floor_bin) const {
    const float lowest = floor_bin * (1.0f - kSameNote);
    float strongest = 0.0f;
    for (int i = 0; i < peaks_; ++i) {
      if (peak_true_[i] >= lowest) strongest = kit::max(strongest, power_[peak_bin_[i]]);
    }
    if (!(strongest > 0.0f)) return channel.tracked >= lowest ? channel.tracked : floor_bin;
    float candidate = 0.0f;
    for (int i = 0; i < peaks_; ++i) {
      if (peak_true_[i] >= lowest && power_[peak_bin_[i]] >= strongest * kAcquirePower) {
        candidate = peak_true_[i];
        break;
      }
    }
    const float held = channel.tracked;
    if (held >= lowest && candidate >= held * (1.0f - kSameNote)) {
      // Still there? The nearest peak to it, within half a semitone.
      float nearest = 0.0f;
      float distance = held * kSameNote + 0.5f;
      for (int i = 0; i < peaks_; ++i) {
        const float off = std::fabs(peak_true_[i] - held);
        if (off <= distance && power_[peak_bin_[i]] >= strongest * kReleasePower) {
          distance = off;
          nearest = peak_true_[i];
        }
      }
      if (nearest > 0.0f) {
        channel.tracked = nearest;
        return nearest;
      }
    }
    channel.tracked = candidate;
    return candidate;
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
    const float above = std::exp2(stretch * kit::min(1.0f, 1.0f + lean));
    const float below = std::exp2(stretch * kit::min(1.0f, 1.0f - lean));
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
      channel.tracked = 0.0f;
    }

    // The pivot: the knob's, or the partial Follow has gone to.
    const float knob_bin = Stft::hz_to_bin(param(kPivot), sr);
    const float pivot = param(kFollow) >= 0.5f ? track(channel, knob_bin) : knob_bin;
    channel.pivot_bin = pivot;
    const float log2_pivot = std::log2(pivot);

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
      const float octaves = std::log2(place) - log2_pivot;
      // g(place) = pivot × 2^(octaves × e + shift) = place × 2^(octaves × (e - 1) + shift): written
      // the second way, a region that is not to move has a move of exactly nought.
      const float ratio = std::exp2(octaves * ((octaves >= 0.0f ? above : below) - 1.0f) + shift);
      move_region(channel, re, im, low, high, k, place * (ratio - 1.0f), place * ratio);

      // The strongest few, for the display.
      const float p = power_[k];
      if (marks < kMarks || p > mark_power[kMarks - 1]) {
        int at = marks < kMarks ? marks++ : kMarks - 1;
        for (; at > 0 && mark_power[at - 1] < p; --at) {
          mark_power[at] = mark_power[at - 1];
          channel.mark_bin[at] = channel.mark_bin[at - 1];
        }
        mark_power[at] = p;
        channel.mark_bin[at] = place;
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
  int peaks_ = 0;
  uint32_t drift_step_[3] = {0, 0, 0};
  kit::Smoother mix_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  float at_rest_ = 0.0f;      // kAtRestHz in bins
  float rest_gain_ = 1.0f;    // this frame's gain for a region at rest
  float stretch_now_ = 0.0f;  // for meter() only
  bool tone_dirty_ = true;
};

}  // namespace livemix
