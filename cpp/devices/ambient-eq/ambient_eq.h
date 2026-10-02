#pragma once

// Ambient EQ: broad tone controls for sustained sound and Clear, a slow ear
// that turns down whatever rings on above the sound around it.
//
//   in ─► low cut ─► low ─► body ─► presence ─► air ─► high cut ─┬─► 23 narrow cuts ─► out
//         24 dB/oct  shelf   bell     bell     shelf  12 dB/oct  │        ▲
//                    120 Hz  320 Hz   3 kHz    9 kHz             │        │ gain per band
//                                                                └─► FFT ─► bands ─► Clear
//
// The audio only ever passes IIR filters, so there is no latency; the FFT is
// a side path that listens.
//
// - Low cut is a Butterworth high-pass (two Svf, Q 0.5412 and 1.3066) and
//   High cut a Butterworth low-pass (one Svf). At the end of its range each
//   is out of circuit: the signal goes round it, so with every gain at 0 dB
//   and Clear at 0 the output is the input, sample for sample. Coming off the
//   stop the filter starts from rest at the new frequency and is crossfaded
//   in over 5 ms; going back it is crossfaded out the same way.
// - A tone stage at exactly 0 dB is skipped too, once what was left in its
//   state has gone.
// - Values are smoothed over 5 ms at the control rate and the filters are
//   redesigned there (every 16 samples) while a value moves.
//
// Clear, once per frame (4096 points, Hann, a hop of 1024; left and right
// take turns 512 samples apart so one block never holds both transforms):
//
// - 23 bands: four half an octave wide from 45 to 180 Hz, then thirds of an
//   octave up to 14.5 kHz. A band's power is the sum over its bins of both
//   channels, per octave of width (pink noise reads the same in every band),
//   smoothed over 0.3 s.
// - Each band is compared with the mean power of the bands two to four away
//   on either side. Only what stands more than 6 dB above that is excess, and
//   no more than 12 dB of it counts.
// - Clear acts on a bed of sound, not on a lone note: the cut is scaled by how
//   many bands lie within 25 dB of the loudest, nothing up to three and all of
//   it from eight. A band under -80 dBFS is left alone.
// - The bed has to lie around the band too. One note with overtones lights
//   many bands, and its fundamental stands far above the empty ones next to
//   it. So the cut is also scaled by the share of the band's surroundings
//   that hold sound within 25 dB of it, counted below and above and the
//   smaller taken, and only once that has lasted 0.3 s (the frames that
//   straddle the start or the end of a note smear it over its neighbours,
//   and that passes). The two lowest bands have nothing below them to stand
//   out of, like the lowest partial of any sound, and are never cut.
// - The cut wanted is Clear times the excess, in dB. The cut held moves
//   towards it with Clear time going down and twice Clear time coming back.
// - Each band's cut is a peaking Biquad at its centre, one band wide, with
//   the same gain on both channels so the image does not move. The gain is
//   ramped across the frame and the filter redesigned every 64 samples; a
//   band at 0 dB is skipped.
// - meter(0) is the deepest cut in force, in dB.
//
// Asleep nothing is sounding, so the filters, the band powers, the cuts and
// the FFT's input are cleared: waking is the same as starting.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class AmbientEq : public kit::DeviceBase<ambient_eq::kNumParams> {
 public:
  static constexpr int kFrame = 4096;
  static constexpr int kHop = 1024;
  static constexpr int kStagger = 512;
  static constexpr int kBands = 23;

  void init(float sample_rate) {
    using namespace ambient_eq;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    fft_.init();
    for (int n = 0; n < kFrame; ++n) {
      window_[n] =
          0.5f - 0.5f * static_cast<float>(std::cos(2.0 * 3.14159265358979323846 * n / kFrame));
    }
    lay_out_bands(sr);
    const float control_rate = sr / kEqPeriod;
    low_cut_hz_.set_time(kSmoothingSeconds, control_rate);
    high_cut_hz_.set_time(kSmoothingSeconds, control_rate);
    for (kit::Smoother& gain : tone_db_) gain.set_time(kSmoothingSeconds, control_rate);
    low_cut_mix_.set_time(kSmoothingSeconds, sr);
    high_cut_mix_.set_time(kSmoothingSeconds, sr);
    low_cut_mix_.snap(0.0f);
    high_cut_mix_.snap(0.0f);
    low_cut_in_ = false;
    high_cut_in_ = false;
    for (int s = 0; s < kStages; ++s) {
      tone_set_[s] = 0.0f;
      tone_live_[s] = false;
      tone_[0][s].set_identity();
      tone_[1][s].set_identity();
    }
    power_coeff_ = kit::time_to_coeff(kPowerSeconds, sr / kHop);
    stay_frames_ = static_cast<int>(kStaySeconds * sr / kHop + 0.5f);
    if (stay_frames_ < 1) stay_frames_ = 1;
    // Nothing here rings for long: the lowest band's filter falls 60 dB in
    // 0.12 s and the Low cut just off its stop in 0.14 s. Twice that and a
    // little.
    idle_.reset(sr, kHoldSeconds);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    rest();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by meters[index] in device.json: 0 is the deepest cut
  // Clear is making right now, in dB (0 or below).
  float meter(int index) const { return index == 0 ? deepest_ : 0.0f; }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float x[2];
      take_input(i, &x[0], &x[1]);
      // A NaN or runaway sample would otherwise stay in every filter it met.
      for (int c = 0; c < 2; ++c) {
        if (!(x[c] > -kSaneInput && x[c] < kSaneInput)) x[c] = 0.0f;
      }

      if (eq_clock_.tick()) update_tone();

      if (low_cut_in_) {
        const float mix = low_cut_mix_.next();
        for (int c = 0; c < 2; ++c) {
          const float cut = low_cut_[c][1].highpass(low_cut_[c][0].highpass(x[c]));
          x[c] += mix * (cut - x[c]);
        }
        if (mix == 0.0f && low_cut_mix_.target == 0.0f) {
          low_cut_in_ = false;
          for (int c = 0; c < 2; ++c) {
            low_cut_[c][0].reset();
            low_cut_[c][1].reset();
          }
        }
      }
      for (int s = 0; s < kStages; ++s) {
        if (!tone_live_[s]) continue;
        x[0] = tone_[0][s].process(x[0]);
        x[1] = tone_[1][s].process(x[1]);
      }
      if (high_cut_in_) {
        const float mix = high_cut_mix_.next();
        for (int c = 0; c < 2; ++c) {
          const float cut = high_cut_[c].lowpass(x[c]);
          x[c] += mix * (cut - x[c]);
        }
        if (mix == 0.0f && high_cut_mix_.target == 0.0f) {
          high_cut_in_ = false;
          high_cut_[0].reset();
          high_cut_[1].reset();
        }
      }

      // Clear listens here: after the tone controls, before its own cuts.
      ring_[0][position_ & kRingMask] = x[0];
      ring_[1][position_ & kRingMask] = x[1];
      const uint32_t phase = position_ & (kHop - 1);
      if (phase == 0) analyse(0);
      if (phase == static_cast<uint32_t>(kStagger)) analyse(1);
      if (clear_clock_.tick()) update_bands();
      for (int n = 0; n < live_count_; ++n) {
        const int k = live_bands_[n];
        x[0] = band_[0][k].process(x[0]);
        x[1] = band_[1][k].process(x[1]);
      }
      ++position_;

      out_left_[i] = x[0];
      out_right_[i] = x[1];
    }
    idle_.settle(output_peak(frames), frames);
    if (idle_.asleep()) rest();
  }

 private:
  enum Stage : int { kLowStage = 0, kBodyStage, kPresenceStage, kAirStage, kStages };

  static constexpr uint32_t kRingMask = kFrame - 1;
  static constexpr int kEqPeriod = 16;     // samples between tone control updates
  static constexpr int kClearPeriod = 64;  // samples between band filter updates
  static constexpr int kTicksPerFrame = kHop / kClearPeriod;
  static constexpr int kHalfOctaveBands = 4;
  static constexpr float kFirstEdgeHz = 45.0f;
  static constexpr float kThirdsFromHz = 180.0f;
  static constexpr float kTopOfRange = 0.45f;  // of the sample rate
  static constexpr float kSaneInput = 64.0f;   // +36 dBFS; beyond it is a fault upstream
  static constexpr float kLowHz = 120.0f;
  static constexpr float kBodyHz = 320.0f;
  static constexpr float kPresenceHz = 3000.0f;
  static constexpr float kAirHz = 9000.0f;
  static constexpr float kBellQ = 0.7f;
  static constexpr float kLowCutQ[2] = {0.5412f, 1.3066f};
  static constexpr float kHoldSeconds = 0.3f;
  static constexpr float kPowerSeconds = 0.3f;
  static constexpr float kStaySeconds = 0.3f;  // surroundings that last this long are a bed
  static constexpr float kMarginRatio = 3.9810717f;  // 6 dB, as a power ratio
  static constexpr float kMarginDb = 6.0f;
  static constexpr float kMaxExcessDb = 12.0f;
  static constexpr float kLitRatio = 0.0031622777f;  // -25 dB
  static constexpr float kQuietPower = 1.0e-8f;      // -80 dBFS
  static constexpr int kLoneBands = 3;               // what one tone can light
  static constexpr float kBedBands = 5.0f;           // and how many more make a bed
  // A cut closer to 0 dB than this with nothing asking for it is let go, so
  // the band's filter can be skipped. The last step is ramped like any other.
  static constexpr float kLetGoDb = 0.01f;

  static void copy_coefficients(const kit::Biquad& from, kit::Biquad* to) {
    to->b0 = from.b0;
    to->b1 = from.b1;
    to->b2 = from.b2;
    to->a1 = from.a1;
    to->a2 = from.a2;
  }

  // True when a new value should glide: once a block has run and while the
  // device is awake. Asleep there is nothing sounding to glide.
  bool gliding() const { return primed() && !idle_.asleep(); }

  void apply(int id) {
    using namespace ambient_eq;
    const float value = param(id);
    switch (id) {
      case kLowCut: {
        const bool wanted = value > kParamMin[kLowCut];
        if (wanted && !low_cut_in_) {
          // Off the stop: the filter is at rest, so it starts where it is set.
          low_cut_hz_.snap(value);
          tune_low_cut(value);
          low_cut_in_ = true;
        } else {
          low_cut_hz_.set(value, gliding());
        }
        low_cut_mix_.set(wanted ? 1.0f : 0.0f, gliding());
        break;
      }
      case kLow:
        tone_db_[kLowStage].set(value, gliding());
        break;
      case kBody:
        tone_db_[kBodyStage].set(value, gliding());
        break;
      case kPresence:
        tone_db_[kPresenceStage].set(value, gliding());
        break;
      case kAir:
        tone_db_[kAirStage].set(value, gliding());
        break;
      case kHighCut: {
        const bool wanted = value < kParamMax[kHighCut];
        if (wanted && !high_cut_in_) {
          high_cut_hz_.snap(value);
          tune_high_cut(value);
          high_cut_in_ = true;
        } else {
          high_cut_hz_.set(value, gliding());
        }
        high_cut_mix_.set(wanted ? 1.0f : 0.0f, gliding());
        break;
      }
      default:
        break;  // Clear and Clear time are read once per frame
    }
  }

  // Band edges, centres and the bins each band sums, for this sample rate.
  void lay_out_bands(float sr) {
    const float bin_hz = sr / kFrame;
    // A full-scale sine in both channels reads 1: Hann² sums to 3/8 of the
    // frame, a sine puts a quarter of its N·Σw² into the positive bins, and
    // the two channels are averaged.
    const float full_scale =
        16.0f / (3.0f * static_cast<float>(kFrame) * static_cast<float>(kFrame));
    num_bands_ = 0;
    for (int k = 0; k < kBands; ++k) {
      const bool half = k < kHalfOctaveBands;
      const float octaves = half ? 0.5f : 1.0f / 3.0f;
      const float lo = half ? kFirstEdgeHz * std::exp2(0.5f * static_cast<float>(k))
                            : kThirdsFromHz *
                                  std::exp2(static_cast<float>(k - kHalfOctaveBands) / 3.0f);
      const float hi = lo * std::exp2(octaves);
      if (hi > kTopOfRange * sr) break;
      const float centre = lo * std::exp2(0.5f * octaves);
      // The bins whose centre lies in [lo, hi), or the nearest one.
      int first = static_cast<int>(std::ceil(lo / bin_hz));
      int last = static_cast<int>(std::ceil(hi / bin_hz)) - 1;
      if (last < first) {
        first = static_cast<int>(centre / bin_hz + 0.5f);
        last = first;
      }
      if (first < 1) first = 1;
      if (last < first) last = first;
      first_bin_[k] = first;
      last_bin_[k] = last;
      band_scale_[k] = full_scale / octaves;
      centre_hz_[k] = centre;
      // The Q whose bandwidth is the band: 4.32 for a third, 2.87 for a half.
      band_q_[k] = std::exp2(0.5f * octaves) / (std::exp2(octaves) - 1.0f);
      num_bands_ = k + 1;
    }
  }

  // Nothing is sounding: put every moving thing where a fresh start has it.
  void rest() {
    for (int c = 0; c < 2; ++c) {
      low_cut_[c][0].reset();
      low_cut_[c][1].reset();
      high_cut_[c].reset();
      for (kit::Biquad& stage : tone_[c]) stage.reset();
      for (kit::Biquad& band : band_[c]) {
        band.reset();
        band.set_identity();
      }
      for (int n = 0; n < kFrame; ++n) ring_[c][n] = 0.0f;
    }
    low_cut_hz_.snap(low_cut_hz_.target);
    high_cut_hz_.snap(high_cut_hz_.target);
    low_cut_mix_.snap(low_cut_mix_.target);
    high_cut_mix_.snap(high_cut_mix_.target);
    low_cut_in_ = low_cut_mix_.target > 0.0f;
    high_cut_in_ = high_cut_mix_.target > 0.0f;
    // Unset, so the first control tick designs both cuts.
    low_cut_set_ = 0.0f;
    high_cut_set_ = 0.0f;
    for (kit::Smoother& gain : tone_db_) gain.snap(gain.target);
    for (int k = 0; k < kBands; ++k) {
      power_[k] = 0.0f;
      frame_power_[k] = 0.0f;
      cut_[k] = 0.0f;
      surrounded_[k] = 0;
      gain_[k].length = kTicksPerFrame;
      gain_[k].snap(0.0f);
      band_live_[k] = false;
    }
    live_count_ = 0;
    deepest_ = 0.0f;
    position_ = 0;
    eq_clock_.reset(kEqPeriod);
    clear_clock_.reset(kClearPeriod);
  }

  void tune_low_cut(float hz) {
    const float sr = sample_rate();
    low_cut_set_ = hz;
    for (int c = 0; c < 2; ++c) {
      low_cut_[c][0].set(hz, kLowCutQ[0], sr);
      low_cut_[c][1].set(hz, kLowCutQ[1], sr);
    }
  }

  void tune_high_cut(float hz) {
    const float sr = sample_rate();
    high_cut_set_ = hz;
    high_cut_[0].set(hz, kit::kSqrtHalf, sr);
    high_cut_[1].set(hz, kit::kSqrtHalf, sr);
  }

  // Control rate: move the smoothed values and redesign what they changed.
  void update_tone() {
    if (low_cut_in_) {
      const float hz = low_cut_hz_.next();
      if (hz != low_cut_set_) tune_low_cut(hz);
    }
    if (high_cut_in_) {
      const float hz = high_cut_hz_.next();
      if (hz != high_cut_set_) tune_high_cut(hz);
    }
    for (int s = 0; s < kStages; ++s) {
      const float db = tone_db_[s].next();
      if (db != tone_set_[s]) {
        tone_set_[s] = db;
        design_tone(s, db);
        tone_live_[s] = true;
      } else if (tone_live_[s] && db == 0.0f && drained(tone_[0][s]) && drained(tone_[1][s])) {
        tone_live_[s] = false;
      }
    }
  }

  static bool drained(const kit::Biquad& filter) { return filter.z1 == 0.0f && filter.z2 == 0.0f; }

  // At exactly 0 dB the stage becomes a wire: its state runs out in two
  // samples and it can be skipped.
  void design_tone(int stage, float db) {
    const float sr = sample_rate();
    kit::Biquad& filter = tone_[0][stage];
    if (db == 0.0f) {
      filter.set_identity();
    } else if (stage == kLowStage) {
      filter.set_low_shelf(kLowHz, db, sr);
    } else if (stage == kBodyStage) {
      filter.set_peak(kBodyHz, kBellQ, db, sr);
    } else if (stage == kPresenceStage) {
      filter.set_peak(kPresenceHz, kBellQ, db, sr);
    } else {
      filter.set_high_shelf(kAirHz, db, sr);
    }
    copy_coefficients(filter, &tone_[1][stage]);
  }

  // Every 64 samples: step each moving band's gain along its ramp, redesign
  // its filter, and note which bands still have work to do.
  void update_bands() {
    const float sr = sample_rate();
    float deepest = 0.0f;
    int live = 0;
    for (int k = 0; k < num_bands_; ++k) {
      kit::LinearRamp& gain = gain_[k];
      if (gain.remaining > 0) {
        const float db = gain.next();
        kit::Biquad& filter = band_[0][k];
        if (db == 0.0f) {
          filter.set_identity();
        } else {
          filter.set_peak(centre_hz_[k], band_q_[k], db, sr);
        }
        copy_coefficients(filter, &band_[1][k]);
        band_live_[k] = true;
      } else if (band_live_[k] && gain.value == 0.0f && drained(band_[0][k]) &&
                 drained(band_[1][k])) {
        band_live_[k] = false;
      }
      if (gain.value < deepest) deepest = gain.value;
      if (band_live_[k]) live_bands_[live++] = k;
    }
    live_count_ = live;
    deepest_ = deepest;
  }

  // One transform of one channel: the last 4096 samples under a Hann window,
  // summed into bands. The right channel's completes the frame.
  void analyse(int c) {
    const uint32_t start = position_ + 1;  // the oldest sample in the ring
    for (int n = 0; n < kFrame; ++n) {
      re_[n] = ring_[c][(start + n) & kRingMask] * window_[n];
      im_[n] = 0.0f;
    }
    fft_.forward(re_, im_);
    for (int k = 0; k < num_bands_; ++k) {
      float sum = 0.0f;
      for (int bin = first_bin_[k]; bin <= last_bin_[k]; ++bin) {
        sum += re_[bin] * re_[bin] + im_[bin] * im_[bin];
      }
      sum *= band_scale_[k];
      frame_power_[k] = c == 0 ? sum : frame_power_[k] + sum;
    }
    if (c == 1) listen();
  }

  // Once per frame: smooth the band powers, decide how much of each band
  // stands out, and move each cut towards what Clear asks for.
  void listen() {
    using namespace ambient_eq;
    float loudest = 0.0f;
    for (int k = 0; k < num_bands_; ++k) {
      power_[k] = flush_denormal(frame_power_[k] + (power_[k] - frame_power_[k]) * power_coeff_);
      if (power_[k] > loudest) loudest = power_[k];
    }

    // How much of a bed there is: bands within 25 dB of the loudest.
    int lit = 0;
    for (int k = 0; k < num_bands_; ++k) {
      if (power_[k] > 0.0f && power_[k] >= loudest * kLitRatio) ++lit;
    }
    const float bed = kit::clamp(static_cast<float>(lit - kLoneBands) / kBedBands, 0.0f, 1.0f);
    const float depth = bed * param(kClear);

    const float frames_per_second = sample_rate() / kHop;
    const float down = kit::time_to_coeff(param(kClearTime), frames_per_second);
    const float back = kit::time_to_coeff(2.0f * param(kClearTime), frames_per_second);
    for (int k = 0; k < num_bands_; ++k) {
      // The surroundings: bands two to four away on either side, and how
      // many of them on each side hold sound of their own, within 25 dB of
      // this band.
      float sum = 0.0f;
      int count = 0;
      int side_count[2] = {0, 0};
      int side_sounding[2] = {0, 0};
      for (int j = k - 4; j <= k + 4; ++j) {
        if (j < 0 || j >= num_bands_ || (j > k - 2 && j < k + 2)) continue;
        sum += power_[j];
        ++count;
        const int side = j < k ? 0 : 1;
        ++side_count[side];
        if (power_[j] > 0.0f && power_[j] >= power_[k] * kLitRatio) ++side_sounding[side];
      }
      // A band can only stand out of sound that lies on both sides of it: the
      // smaller of the two shares, and only once that has lasted (see the
      // notes at the top). With no bands below there is no telling, so
      // nothing; with none above, the lower side speaks for both.
      float around = 0.0f;
      if (side_count[0] > 0) {
        around = static_cast<float>(side_sounding[0]) / static_cast<float>(side_count[0]);
        if (side_count[1] > 0) {
          around = kit::min(
              around, static_cast<float>(side_sounding[1]) / static_cast<float>(side_count[1]));
        }
      }
      if (around > 0.0f) {
        if (surrounded_[k] < stay_frames_) ++surrounded_[k];
      } else {
        surrounded_[k] = 0;
      }
      if (surrounded_[k] < stay_frames_) around = 0.0f;

      float target = 0.0f;
      if (depth > 0.0f && around > 0.0f && power_[k] >= kQuietPower) {
        const float reference = sum / static_cast<float>(count);
        if (power_[k] > reference * kMarginRatio) {
          const float excess = 10.0f * std::log10(power_[k] / reference) - kMarginDb;
          target = -depth * around * kit::min(excess, kMaxExcessDb);
        }
      }
      float cut = cut_[k];
      cut = target + (cut - target) * (target < cut ? down : back);
      if (target == 0.0f && cut > -kLetGoDb) cut = 0.0f;
      cut_[k] = cut;
      gain_[k].set_target(cut);
    }
  }

  kit::Fft<kFrame> fft_;
  float window_[kFrame];
  float ring_[2][kFrame];  // what Clear hears, per channel
  float re_[kFrame];
  float im_[kFrame];

  kit::Svf low_cut_[2][2];
  kit::Svf high_cut_[2];
  kit::Biquad tone_[2][kStages];
  kit::Biquad band_[2][kBands];

  kit::Smoother low_cut_hz_, high_cut_hz_;
  kit::Smoother tone_db_[kStages];
  kit::LinearRamp low_cut_mix_, high_cut_mix_;  // 0 out of circuit, 1 in
  kit::ControlClock eq_clock_, clear_clock_;
  kit::IdleGate idle_;
  float low_cut_set_ = 0.0f;   // the frequency the filters are designed for
  float high_cut_set_ = 0.0f;
  float tone_set_[kStages] = {};  // the gain each stage is designed for
  bool low_cut_in_ = false;
  bool high_cut_in_ = false;
  bool tone_live_[kStages] = {};

  int num_bands_ = 0;  // bands under 0.45 of the sample rate
  int first_bin_[kBands] = {};
  int last_bin_[kBands] = {};
  float band_scale_[kBands] = {};  // sum of |X|² to power per octave
  float centre_hz_[kBands] = {};
  float band_q_[kBands] = {};
  float frame_power_[kBands] = {};  // this frame, left then left plus right
  float power_[kBands] = {};        // smoothed
  float cut_[kBands] = {};          // dB, 0 or below
  kit::LinearRamp gain_[kBands];    // the cut on its way to the filters, per tick
  int surrounded_[kBands] = {};     // frames in a row its surroundings have held sound
  int stay_frames_ = 1;             // how many make them a bed
  bool band_live_[kBands] = {};
  int live_bands_[kBands] = {};
  int live_count_ = 0;
  float power_coeff_ = 0.0f;
  float deepest_ = 0.0f;
  uint32_t position_ = 0;  // samples since waking; schedules the transforms
};

}  // namespace livemix
