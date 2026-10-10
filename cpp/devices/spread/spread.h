#pragma once

// Spread: width by frequency. The sound is taken apart into its middle
// (M = (L + R) / 2) and its sides (S = (L - R) / 2); the middle goes through
// untouched and the sides are given a gain that depends on frequency, in three
// regions: Low below the low split, Mid between the splits, High above the
// high split. Make adds sides where there are none.
//
//   L,R ─► M ──────────────────────────────────────────────┬──────────► L = (M + S') · output
//          │                                               │            R = (M - S') · output
//          └─► scatter (4 allpasses) ─► curve of what is over 1 ─► × Make ─┐
//   L,R ─► S ─► curve ───────────────────────────────────────────────────(+)─► Safe ─► S'
//
// Storage: four delay lines of 2048 samples for the scatter (11.4 ms at
// 96 kHz), 32 KB; everything else is a few filters. No latency.
//
// - The mono sum L + R is 2·M·output: no width control can change it or make
//   anything cancel in it. What the controls change is the sides alone.
// - The curve is two stages in series, each a three region split that sums to
//   its input. One stage, with A the state variable filter at the low split
//   and B the one at the high split (both Butterworth, k = √2; lp + k·bp + hp
//   is the input exactly):
//
//     out = lpB(l·lpA + √(l·m)·k·bpA + m·hpA)             the low shelf, kept below the high split
//         + hpA(√(m·h)·k·bpB + h·hpB)                      the high shelf, kept above the low split
//         + c·(lpA + k·bpA)(k·bpB + hpB),  c = ∛(l·m·h)   what is left over, so that all ones is 1
//
//   with l, m, h the square roots of Low, Mid and High (two stages make the
//   whole gain). A region at 0 is truly out: Low 0 is a high-pass, High 0 a
//   low-pass, Mid 0 leaves a low-pass plus a high-pass, each 12 dB an octave
//   per stage. Nothing is divided by a gain, so no setting needs a floor.
// - Slope moves the two stages apart: stage one sits at split / r and stage
//   two at split · r, r = 2^(1 - Slope). At Slope 1 both stand on the split
//   (24 dB an octave); at 0 they are two octaves apart and the regions blend.
// - Make: a width over 1 asks for more sides than came in, and a mono sound
//   has none to raise. So the middle goes through four allpasses in series
//   (the scatter) and then through a second curve of the same shape whose
//   regions are what each width has over 1 (nothing for a region at 1 or
//   under, 1 for a region at 2); that, times Make, is added to the sides. At
//   Make 1 a region at 2 gets made sides as loud as the middle; a region at 1
//   or under gets none, so it stays as it came. Smear scales the allpass times
//   (0.35 to 1.6 of 1.3, 2.9, 4.7 and 7.1 ms); a settled time is a whole number
//   of samples, so the scatter is exactly allpass, and a moving one glides.
// - Safe: three slow ears (20 ms, on power) on the middle, on the sides as
//   they came in and on the sides going out. The sides going out are held to
//   the larger of the middle times a ceiling (0.25 / Safe², so level with the
//   middle at Safe 0.5 and 12 dB under it at 1) and the sides as they came
//   in: it holds what was added and never narrows the source. Safe 0 holds
//   nothing.
// - With Low, Mid and High at 1 and Output at 0 dB the device is out of
//   circuit whatever Make is: the output is the input, sample for sample.
// - Gains are smoothed over 5 ms at the control rate (every 16 samples) and
//   ramped per sample between ticks; the filters are retuned at the ticks.
//
// Asleep nothing is sounding, so the filters, the scatter and the ears are
// cleared and every smoothed value is put on its target: waking is the same
// as starting, whatever the block size.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Spread : public kit::DeviceBase<spread::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace spread;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / kPeriod;
    for (kit::Smoother& width : width_) width.set_time(kSmoothingSeconds, control_rate);
    low_hz_.set_time(kSmoothingSeconds, control_rate);
    high_hz_.set_time(kSmoothingSeconds, control_rate);
    slope_.set_time(kSmoothingSeconds, control_rate);
    make_.set_time(kSmoothingSeconds, sr);
    output_.set_time(kSmoothingSeconds, sr);
    for (ScatterAllpass& allpass : scatter_) allpass.delay.set_time(kSmearGlideSeconds, sr);
    ear_coeff_ = 1.0f - kit::time_to_coeff(kEarSeconds, sr);
    hold_attack_ = 1.0f - kit::time_to_coeff(kHoldAttackSeconds, sr);
    hold_release_ = 1.0f - kit::time_to_coeff(kHoldReleaseSeconds, sr);
    idle_.reset(sr, kIdleSeconds);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    rest();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // meters[0], for the display: how far Safe is holding the sides down right
  // now, in dB (0 or below; 0 at rest and asleep).
  float meter(int index) const {
    if (index != 0 || idle_.asleep()) return 0.0f;
    return kit::gain_to_db(hold_);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float left, right;
      take_input(i, &left, &right);
      // A NaN or runaway sample would otherwise stay in every filter it met.
      if (!(left > -kSaneInput && left < kSaneInput)) left = 0.0f;
      if (!(right > -kSaneInput && right < kSaneInput)) right = 0.0f;

      if ((position_ & (kPeriod - 1)) == 0) tick();
      ++position_;
      if (ramping_) {
        for (int j = 0; j < kGains; ++j) {
          gain_[j] += gain_step_[j];
          made_gain_[j] += made_gain_step_[j];
        }
      }

      const float mid = 0.5f * (left + right);
      const float side = 0.5f * (left - right);

      // The scatter and its curve always run, so that Make coming up finds them full.
      float scattered = mid;
      for (int a = 0; a < kScatter; ++a) scattered = scatter_[a].process(scattered, kScatterGain[a]);
      const float made =
          made_stage_[1].process(made_stage_[0].process(scattered, made_gain_), made_gain_);
      const float shaped =
          stage_[1].process(stage_[0].process(side, gain_), gain_) + make_.next() * made;

      // Safe: the sides going out against the middle and the sides coming in.
      ear_mid_ = flush_denormal(ear_mid_ + ear_coeff_ * (mid * mid - ear_mid_));
      ear_in_ = flush_denormal(ear_in_ + ear_coeff_ * (side * side - ear_in_));
      ear_out_ = flush_denormal(ear_out_ + ear_coeff_ * (shaped * shaped - ear_out_));
      float want = 1.0f;
      if (safe_on_) {
        const float allowed = kit::max(ceiling_power_ * ear_mid_, ear_in_);
        if (ear_out_ > allowed && ear_out_ > kEarFloor) want = std::sqrt(allowed / ear_out_);
      }
      hold_ += (want < hold_ ? hold_attack_ : hold_release_) * (want - hold_);
      if (want == 1.0f && hold_ > 1.0f - kHoldLanded) hold_ = 1.0f;

      const float output = output_.next();
      if (flat_ && made == 0.0f && output == 1.0f && hold_ == 1.0f) {
        // Out of circuit: nothing is asked of the sides.
        out_left_[i] = left;
        out_right_[i] = right;
      } else {
        const float sides = shaped * hold_;
        out_left_[i] = (mid + sides) * output;
        out_right_[i] = (mid - sides) * output;
      }
    }
    idle_.settle(output_peak(frames), frames);
    if (idle_.asleep()) rest();
  }

 private:
  // The six gains of a stage, in the order Stage::process reads them.
  enum Gain : int { kLowGain = 0, kLowMidGain, kMidGain, kMidHighGain, kHighGain, kRestGain, kGains };

  static constexpr int kPeriod = 16;  // samples between control ticks
  static_assert((kPeriod & (kPeriod - 1)) == 0, "the control period must be a power of two");
  static constexpr int kScatter = 4;
  static constexpr int kScatterSize = 2048;  // 11.4 ms at 96 kHz and room for the read
  static constexpr float kScatterSeconds[kScatter] = {0.0013f, 0.0029f, 0.0047f, 0.0071f};
  static constexpr float kScatterGain[kScatter] = {0.55f, -0.5f, 0.5f, -0.45f};
  static constexpr float kSmearLeast = 0.35f;  // of the times above, at Smear 0
  static constexpr float kSmearMost = 1.6f;    // and at Smear 1
  static constexpr float kSmearGlideSeconds = 0.05f;
  static constexpr float kSpreadOctaves = 1.0f;  // each stage's distance from the split at Slope 0
  static constexpr float kTopOfRange = 0.45f;    // of the sample rate: no stage is tuned above it
  static constexpr float kSafeCeiling = 0.25f;   // sides over middle at Safe 1 (12 dB under)
  static constexpr float kEarSeconds = 0.02f;
  static constexpr float kHoldAttackSeconds = 0.003f;
  static constexpr float kHoldReleaseSeconds = 0.12f;
  static constexpr float kHoldLanded = 1.0e-5f;
  static constexpr float kEarFloor = 1.0e-12f;  // -120 dBFS: under it there is nothing to hold
  static constexpr float kSaneInput = 64.0f;    // +36 dBFS; beyond it is a fault upstream
  static constexpr float kIdleSeconds = 0.3f;

  // One Schroeder allpass of the scatter. Its time glides when Smear moves and
  // lands on a whole number of samples, where the read is exact.
  struct ScatterAllpass {
    kit::DelayLine<kScatterSize> line;
    kit::Smoother delay;  // in samples

    float process(float x, float gain) {
      const float length = delay.next();
      const float delayed = delay.settled() ? line.read(static_cast<int>(length))
                                            : line.read_hermite(length);
      const float v = flush_denormal(x + gain * delayed);
      line.write(v);
      return delayed - gain * v;
    }
  };

  // One stage of the curve: see the notes at the top.
  struct Stage {
    kit::Svf a;       // at the low split
    kit::Svf b_low;   // at the high split, fed the low shelf
    kit::Svf b_high;  // at the high split, fed what is above the low split

    void reset() {
      a.reset();
      b_low.reset();
      b_high.reset();
    }

    void tune(float low_hz, float high_hz, float sample_rate) {
      a.set(low_hz, kit::kSqrtHalf, sample_rate);
      b_low.set(high_hz, kit::kSqrtHalf, sample_rate);
      b_high.set(high_hz, kit::kSqrtHalf, sample_rate);
    }

    float process(float x, const float* gain) {
      a.process(x);
      const float above = a.high;
      const float rest = x - above;  // lpA + k·bpA
      const float shelf =
          gain[kLowGain] * a.low + gain[kLowMidGain] * a.k * a.band + gain[kMidGain] * above;
      b_low.process(shelf - gain[kRestGain] * rest);
      b_high.process(above);
      return b_low.low + gain[kMidHighGain] * b_high.k * b_high.band +
             gain[kHighGain] * b_high.high + gain[kRestGain] * rest;
    }
  };

  // True when a new value should glide: once a block has run and while the
  // device is awake. Asleep there is nothing sounding to glide.
  bool gliding() const { return primed() && !idle_.asleep(); }

  void apply(int id) {
    using namespace spread;
    const float value = param(id);
    const bool glide = gliding();
    switch (id) {
      case kLow:
      case kMid:
      case kHigh:
        width_[id - kLow].set(value, glide);
        break;
      case kLowHz:
        low_hz_.set(value, glide);
        break;
      case kHighHz:
        high_hz_.set(value, glide);
        break;
      case kSlope:
        slope_.set(value, glide);
        break;
      case kMake:
        make_.set(value, glide);
        break;
      case kSmear: {
        const float scale = kit::lerp(kSmearLeast, kSmearMost, value);
        for (int a = 0; a < kScatter; ++a) {
          const float samples = std::floor(kScatterSeconds[a] * scale * sample_rate() + 0.5f);
          scatter_[a].delay.set(samples, glide);
        }
        break;
      }
      case kSafe:
        safe_on_ = value > 0.0f;
        // The ceiling as a power ratio: (0.25 / Safe²)².
        ceiling_power_ = safe_on_ ? (kSafeCeiling * kSafeCeiling) / (value * value * value * value) : 0.0f;
        break;
      case kOutput:
        output_.set(kit::db_to_gain(value), glide);
        break;
      default:
        break;
    }
    if (!glide) land();
  }

  // The six gains for the widths as they stand: square roots, because two
  // stages make the whole.
  void aim(float low, float mid, float high) {
    const float l = std::sqrt(low);
    const float m = std::sqrt(mid);
    const float h = std::sqrt(high);
    gain_target_[kLowGain] = l;
    gain_target_[kLowMidGain] = std::sqrt(l * m);
    gain_target_[kMidGain] = m;
    gain_target_[kMidHighGain] = std::sqrt(m * h);
    gain_target_[kHighGain] = h;
    gain_target_[kRestGain] = std::cbrt(l * m * h);
    // The made sides: the same shape for what each width has over 1.
    const float el = std::sqrt(kit::max(low - 1.0f, 0.0f));
    const float em = std::sqrt(kit::max(mid - 1.0f, 0.0f));
    const float eh = std::sqrt(kit::max(high - 1.0f, 0.0f));
    made_gain_target_[kLowGain] = el;
    made_gain_target_[kLowMidGain] = std::sqrt(el * em);
    made_gain_target_[kMidGain] = em;
    made_gain_target_[kMidHighGain] = std::sqrt(em * eh);
    made_gain_target_[kHighGain] = eh;
    made_gain_target_[kRestGain] = std::cbrt(el * em * eh);
    for (int r = 0; r < 3; ++r) width_set_[r] = r == 0 ? low : (r == 1 ? mid : high);
  }

  void tune(float low_hz, float high_hz, float slope) {
    const float sr = sample_rate();
    const float top = kTopOfRange * sr;
    const float apart = std::exp2(kSpreadOctaves * (1.0f - slope));
    stage_[0].tune(kit::min(low_hz / apart, top), kit::min(high_hz / apart, top), sr);
    stage_[1].tune(kit::min(low_hz * apart, top), kit::min(high_hz * apart, top), sr);
    made_stage_[0].tune(kit::min(low_hz / apart, top), kit::min(high_hz / apart, top), sr);
    made_stage_[1].tune(kit::min(low_hz * apart, top), kit::min(high_hz * apart, top), sr);
    low_hz_set_ = low_hz;
    high_hz_set_ = high_hz;
    slope_set_ = slope;
  }

  bool at_ones() const {
    for (int j = 0; j < kGains; ++j) {
      if (gain_[j] != 1.0f || gain_target_[j] != 1.0f) return false;
    }
    return true;
  }

  // Control rate: land the ramps of the last period, move the smoothed values
  // and aim the gains and the filters at where they stand now.
  void tick() {
    for (int j = 0; j < kGains; ++j) {
      gain_[j] = gain_target_[j];
      made_gain_[j] = made_gain_target_[j];
    }
    const float low = width_[0].next();
    const float mid = width_[1].next();
    const float high = width_[2].next();
    ramping_ = low != width_set_[0] || mid != width_set_[1] || high != width_set_[2];
    if (ramping_) {
      aim(low, mid, high);
      for (int j = 0; j < kGains; ++j) {
        gain_step_[j] = (gain_target_[j] - gain_[j]) * (1.0f / kPeriod);
        made_gain_step_[j] = (made_gain_target_[j] - made_gain_[j]) * (1.0f / kPeriod);
      }
    }
    const float low_hz = low_hz_.next();
    const float high_hz = high_hz_.next();
    const float slope = slope_.next();
    if (low_hz != low_hz_set_ || high_hz != high_hz_set_ || slope != slope_set_) {
      tune(low_hz, high_hz, slope);
    }
    flat_ = at_ones();
  }

  // Put everything that moves on its target at once.
  void land() {
    for (kit::Smoother& width : width_) width.snap(width.target);
    low_hz_.snap(low_hz_.target);
    high_hz_.snap(high_hz_.target);
    slope_.snap(slope_.target);
    make_.snap(make_.target);
    output_.snap(output_.target);
    for (ScatterAllpass& allpass : scatter_) allpass.delay.snap(allpass.delay.target);
    aim(width_[0].value, width_[1].value, width_[2].value);
    for (int j = 0; j < kGains; ++j) {
      gain_[j] = gain_target_[j];
      gain_step_[j] = 0.0f;
      made_gain_[j] = made_gain_target_[j];
      made_gain_step_[j] = 0.0f;
    }
    ramping_ = false;
    tune(low_hz_.value, high_hz_.value, slope_.value);
    flat_ = at_ones();
  }

  // Nothing is sounding: clear what holds sound and start the clock again.
  void rest() {
    for (Stage& stage : stage_) stage.reset();
    for (Stage& stage : made_stage_) stage.reset();
    for (ScatterAllpass& allpass : scatter_) allpass.line.clear();
    ear_mid_ = 0.0f;
    ear_in_ = 0.0f;
    ear_out_ = 0.0f;
    hold_ = 1.0f;
    position_ = 0;
    land();
  }

  Stage stage_[2];       // the curve on the sides
  Stage made_stage_[2];  // the curve of what is over 1, on the scattered middle
  ScatterAllpass scatter_[kScatter];
  kit::Smoother width_[3];  // Low, Mid, High: at the control rate
  kit::Smoother low_hz_, high_hz_, slope_;  // at the control rate
  kit::Smoother make_, output_;  // per sample
  kit::IdleGate idle_;

  float gain_[kGains] = {};         // what the stages use now
  float gain_target_[kGains] = {};  // where the ramp of this period ends
  float gain_step_[kGains] = {};
  float made_gain_[kGains] = {};  // the same three for the made sides
  float made_gain_target_[kGains] = {};
  float made_gain_step_[kGains] = {};
  float width_set_[3] = {};         // the widths the targets were worked out for
  float low_hz_set_ = 0.0f;         // and what the filters are tuned for
  float high_hz_set_ = 0.0f;
  float slope_set_ = 0.0f;
  bool ramping_ = false;
  bool flat_ = false;  // every gain at 1 and staying there

  float ear_mid_ = 0.0f;  // power of the middle, of the sides coming in, of the sides going out
  float ear_in_ = 0.0f;
  float ear_out_ = 0.0f;
  float ear_coeff_ = 0.0f;
  float hold_ = 1.0f;  // Safe's gain on the sides
  float hold_attack_ = 0.0f;
  float hold_release_ = 0.0f;
  float ceiling_power_ = 0.0f;
  bool safe_on_ = false;
  uint32_t position_ = 0;  // samples since waking; the control ticks are counted from it
};

}  // namespace livemix
