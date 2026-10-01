#pragma once

// Expanse: a very large modulated space whose tail can be played.
//
//   in ─► 4 short allpasses ─┬──────────────────────────► direct ─┐
//        (Density)           └─► 5 long allpasses (bloom) ─► late ─┴─ Gravity blend ─► x (1 - freeze)
//                                                                                        │
//        ┌───────────────────────────────────────────────────────────────────────────────┘
//        ▼
//       (+)─► high cut ─► low cut ─► limit ─► 3 modulated allpasses ─► delay line ─┬─► feedback read
//        ▲      (lifted when frozen)                     (four of these)           └─► 2 modulated taps ─► wet
//        │                                                                         │
//        └────────────── decay gain (1 when frozen) ◄── Hadamard ◄─────────────────┘
//
// - Every length is a share of one time, the Size (40 ms to 2.5 s for the
//   longest line), so Size scales the whole space: when the first sound
//   comes back, how far apart the echoes are, how long a pass takes.
// - The allpasses sit inside the loop, so every pass multiplies the echoes.
//   Density is their coefficient: at 0 they are plain delays and the space
//   answers in separate echoes, at 1 it is a wash.
// - Gravity blends what feeds the loop from the direct signal to a copy
//   spread by five long allpasses. An allpass delays energy by its length
//   on average whatever its coefficient, so the copy swells in and peaks
//   about half a Size later: the reverse-like bloom.
// - The cut filters are second-order Butterworth inside the loop: flat to
//   within a thousandth of a dB an octave or two inside their corners, so at
//   the top of Decay (loop gain 1) the middle of the spectrum hangs for
//   minutes while the edges fall away. With modulation on, the moving read
//   points slowly take the top off as well; Freeze is the hold that loses
//   nothing.
// - Lengths are whole samples whenever they are at rest. Freeze fades the
//   in-loop modulation out, closes the input, lifts the filters and sets
//   the gain to 1: the loop is then lossless to the last bit and holds its
//   level for as long as it is left. The output taps keep moving, so a
//   frozen sound still breathes.
// - Lines are slices of one pool rather than power-of-two kit lines, which
//   would double the memory.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

namespace expanse_layout {

constexpr int kLines = 4;
constexpr int kLoopStages = 3;
constexpr int kBloomStages = 5;
constexpr float kMaxSeconds = 2.5f;
constexpr float kMinSeconds = 0.04f;
constexpr float kPoolRate = 96000.0f;

// Lengths as shares of Size.
constexpr float kLineRatio[kLines] = {1.0f, 0.8409f, 0.7071f, 0.5946f};
constexpr float kLoopRatio[kLoopStages] = {0.113f, 0.071f, 0.047f};
constexpr float kLineSkew[kLines] = {1.0f, 0.93f, 1.07f, 0.87f};
constexpr float kBloomRatio[kBloomStages] = {0.043f, 0.067f, 0.097f, 0.139f, 0.191f};
constexpr float kBloomSkew[2] = {1.0f, 1.06f};

// Samples a slice needs for `ratio` of the largest Size at 96 kHz, with room
// for the modulation sweep.
constexpr int slice_size(float ratio) {
  return static_cast<int>(ratio * kMaxSeconds * kPoolRate) + 512;
}

constexpr int pool_size() {
  int total = 0;
  for (int n = 0; n < kLines; ++n) {
    total += slice_size(kLineRatio[n]);
    for (int k = 0; k < kLoopStages; ++k) total += slice_size(kLoopRatio[k] * kLineSkew[n]);
  }
  for (int c = 0; c < 2; ++c) {
    for (int k = 0; k < kBloomStages; ++k) total += slice_size(kBloomRatio[k] * kBloomSkew[c]);
  }
  return total;
}

}  // namespace expanse_layout

class Expanse : public kit::DeviceBase<expanse::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace expanse;
    using namespace expanse_layout;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float scale = sr / 48000.0f;

    for (int i = 0; i < kPoolSize; ++i) pool_[i] = 0.0f;
    int offset = 0;
    kit::Rng phases;
    phases.seed(0x6A09E667u);
    const auto bind = [&](Slice& slice, Reader& reader, float ratio, float sweep) {
      slice.bind(pool_ + offset, slice_size(ratio));
      offset += slice_size(ratio);
      reader = Reader();
      reader.ratio = ratio;
      reader.limit = static_cast<float>(slice_size(ratio) - 8);
      reader.sweep = sweep;
      reader.phase = phases.uniform();
      reader.rate = 0.6f + phases.uniform();
    };
    for (int n = 0; n < kLines; ++n) {
      bind(line_[n], line_read_[n], kLineRatio[n], 0.0f);
      for (int k = 0; k < kLoopStages; ++k) {
        bind(loop_allpass_[n][k], loop_read_[n][k], kLoopRatio[k] * kLineSkew[n], 1.0f);
      }
      for (int c = 0; c < 2; ++c) {
        Reader& tap = tap_read_[c][n];
        tap = Reader();
        tap.ratio = kTapPosition[c][n] * kLineRatio[n];
        tap.limit = line_read_[n].limit;
        tap.sweep = 1.0f;
        tap.phase = phases.uniform();
        tap.rate = 0.6f + phases.uniform();
      }
      low_cut_[n].reset();
      high_cut_[n].reset();
      gain_[n] = 0.0f;
    }
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kBloomStages; ++k) {
        bind(bloom_[c][k], bloom_read_[c][k], kBloomRatio[k] * kBloomSkew[c], 0.0f);
      }
      for (int a = 0; a < kInputStages; ++a) {
        input_allpass_[c][a].clear();
        input_length_[c][a] =
            kit::clamp_int(static_cast<int>(kInputAllpass[c][a] * scale), 1, kInputSize - 1);
      }
    }

    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    direct_.set_time(0.02f, sr);
    late_.set_time(0.02f, sr);
    // Freeze closes and opens over 40 ms: long enough not to click, short
    // enough to catch a chord.
    freeze_.set_time(0.04f, sr);
    const float control_rate = sr / kControlPeriod;
    decay_.set_time(0.03f, control_rate);
    level_.set_time(0.03f, control_rate);
    diffusion_.set_time(0.03f, control_rate);
    depth_.set_time(0.05f, control_rate);
    // Size glides: moving it bends the pitch of everything in the space.
    glide_ = 1.0f - kit::time_to_coeff(kSizeGlideSeconds, control_rate);
    clock_.reset(kControlPeriod);
    // The longest silent gap is one trip through the bloom and the longest
    // line at the largest Size.
    idle_.reset(sr, 5.0f);
    started_ = false;
    blooming_ = false;
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace expanse;
    using namespace expanse_layout;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) {
        control();
        started_ = true;
      }

      const float freeze = glide(freeze_);
      const float open = 1.0f - freeze;
      const float direct = glide(direct_);
      const float late = glide(late_);
      const float diffusion = diffusion_.value;
      // The bloom only runs while Gravity lets it be heard. It starts empty:
      // what it missed has already gone in directly.
      const bool blooming = late != 0.0f || late_.target != 0.0f;
      if (blooming && !blooming_) clear_bloom();
      blooming_ = blooming;

      // Input diffusion, then the bloom beside it.
      float feed[2];
      for (int c = 0; c < 2; ++c) {
        float x = in[c];
        for (int a = 0; a < kInputStages; ++a) {
          x = input_allpass_[c][a].process(x, input_length_[c][a], diffusion * kInputDiffusion);
        }
        float swell = 0.0f;
        if (blooming) {
          swell = x;
          for (int k = 0; k < kBloomStages; ++k) {
            swell = bloom_[c][k].allpass(swell, bloom_read_[c][k].next(), kBloomDiffusion);
          }
        }
        feed[c] = (direct * x + late * swell) * open * kit::kSqrtHalf;
      }

      // The four lines: feedback reads and the output taps.
      float v[kLines];
      float wet_left = 0.0f;
      float wet_right = 0.0f;
      for (int n = 0; n < kLines; ++n) {
        v[n] = line_[n].read_linear(line_read_[n].next());
        const float left = line_[n].read_linear(tap_read_[0][n].next());
        const float right = line_[n].read_linear(tap_read_[1][n].next());
        wet_left += (n & 1) ? -left : left;
        wet_right += (n & 1) ? -right : right;
      }

      // Hadamard, scaled to be orthonormal.
      const float a0 = v[0] + v[1], a1 = v[0] - v[1], a2 = v[2] + v[3], a3 = v[2] - v[3];
      v[0] = 0.5f * (a0 + a2);
      v[1] = 0.5f * (a1 + a3);
      v[2] = 0.5f * (a0 - a2);
      v[3] = 0.5f * (a1 - a3);

      for (int n = 0; n < kLines; ++n) {
        const float gain = gain_[n] + (1.0f - gain_[n]) * freeze;
        float x = v[n] * gain + ((n & 2) ? -feed[n & 1] : feed[n & 1]);
        const float damped = low_cut_[n].highpass(high_cut_[n].lowpass(x));
        x = damped + (x - damped) * freeze;
        // Linear (and exact) to ±2, landing on ±4: what bounds the space
        // when Decay is infinite and the input keeps coming.
        x = 4.0f * kit::soft_clip(0.25f * x);
        for (int k = 0; k < kLoopStages; ++k) {
          x = loop_allpass_[n][k].allpass(x, loop_read_[n][k].next(), diffusion * kLoopDiffusion);
        }
        line_[n].write(flush_denormal(x));
      }

      const float width = glide(width_);
      const float mid = 0.25f * (wet_left + wet_right);
      const float side = 0.25f * (wet_left - wet_right) * width;
      const float wet = glide(wet_) * level_.value;
      const float dry = glide(dry_);
      // The wet signal is exact up to ±1 and lands on ±2: an infinite decay
      // fed for long enough fills the space to its limiter.
      out_left_[i] = in[0] * dry + 2.0f * kit::soft_clip(0.5f * (mid + side) * wet);
      out_right_[i] = in[1] * dry + 2.0f * kit::soft_clip(0.5f * (mid - side) * wet);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kLines = expanse_layout::kLines;
  static constexpr int kLoopStages = expanse_layout::kLoopStages;
  static constexpr int kBloomStages = expanse_layout::kBloomStages;
  static constexpr int kPoolSize = expanse_layout::pool_size();
  static constexpr int kInputStages = 4;
  static constexpr int kInputSize = 2048;
  static constexpr int kControlPeriod = 32;

  // Where each side taps each line, as a share of the line. In time the
  // four taps of a side sit about a quarter of Size apart (left at 0.09,
  // 0.33, 0.58 and 0.83 of Size, right at 0.16, 0.41, 0.66 and 0.80), so the
  // first pass fills the space evenly until the second arrives. The earliest
  // tap is the first sound: 0.09 of Size on the left.
  static constexpr float kTapPosition[2][kLines] = {{0.830f, 0.690f, 0.127f, 0.555f},
                                                    {0.410f, 0.951f, 0.933f, 0.269f}};
  static constexpr float kInputAllpass[2][kInputStages] = {{229.0f, 173.0f, 611.0f, 447.0f},
                                                           {241.0f, 181.0f, 631.0f, 463.0f}};
  // Allpass coefficients at Density 1.
  static constexpr float kInputDiffusion = 0.7f;
  static constexpr float kLoopDiffusion = 0.62f;
  static constexpr float kBloomDiffusion = 0.62f;
  // Peak sweep of a modulated read at Mod Depth 1 and 1 Hz or slower; above
  // 1 Hz it shrinks with the rate so the pitch deviation stays near ±13
  // cents per allpass instead of growing into a siren.
  static constexpr float kSweepSeconds = 0.0012f;
  static constexpr float kSizeGlideSeconds = 0.25f;
  static constexpr float kWetGain = 1.6f;

  // A delay line on a slice of the pool. read(d) is x[n - d], d >= 1, taken
  // before this sample's write, as in the kit; a whole-number delay returns
  // the stored sample exactly.
  class Slice {
   public:
    void bind(float* data, int size) {
      data_ = data;
      size_ = size;
      write_ = 0;
    }
    void clear() {
      for (int i = 0; i < size_; ++i) data_[i] = 0.0f;
    }
    void write(float x) {
      data_[write_] = x;
      if (++write_ == size_) write_ = 0;
    }
    float read_linear(double delay) const {
      const int whole = static_cast<int>(delay);
      const float fraction = static_cast<float>(delay - static_cast<double>(whole));
      int first = write_ - whole;
      if (first < 0) first += size_;
      int second = first - 1;
      if (second < 0) second += size_;
      return data_[first] + (data_[second] - data_[first]) * fraction;
    }
    float allpass(float x, double delay, float gain) {
      const float delayed = read_linear(delay);
      const float v = flush_denormal(x + gain * delayed);
      write(v);
      return delayed - gain * v;
    }

   private:
    float* data_ = nullptr;
    int size_ = 1;
    int write_ = 0;
  };

  // A read point: it glides to its share of Size, can be swept by its own
  // LFO, and moves in straight segments between control ticks. In doubles:
  // a float cannot hold a 240,000-sample delay and a fraction of a sample,
  // and the ramp has to land on a whole number.
  struct Reader {
    double delay = 16.0;
    double step = 0.0;
    double base = 16.0;
    float ratio = 0.1f;
    float limit = 64.0f;
    float sweep = 0.0f;  // 1 when modulated
    float phase = 0.0f;
    float rate = 1.0f;

    double next() {
      delay += step;
      return delay;
    }
  };

  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  void clear_bloom() {
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kBloomStages; ++k) bloom_[c][k].clear();
    }
  }

  // Aim a reader at where it should be one control period on. `seconds` is
  // the Size time, `depth` the sweep in samples, `turn` the LFO advance.
  void aim(Reader& reader, float seconds, float depth, float turn) {
    const float sr = sample_rate();
    const double target =
        kit::clamp(std::floor(reader.ratio * seconds * sr + 0.5f), 4.0f, std::floor(reader.limit));
    if (!started_) {
      reader.base = target;
    } else {
      reader.base += (target - reader.base) * glide_;
      if (reader.base - target < 0.02 && target - reader.base < 0.02) reader.base = target;
    }
    double wanted = reader.base;
    if (reader.sweep > 0.0f) {
      reader.phase += turn * reader.rate;
      if (reader.phase >= 1.0f) reader.phase -= std::floor(reader.phase);
      wanted += depth * kit::SineTable::lookup(reader.phase);
      if (wanted < 2.0) wanted = 2.0;
      if (wanted > reader.limit) wanted = reader.limit;
    }
    const double distance = wanted - reader.delay;
    if (!started_ || (distance < 1.0e-6 && distance > -1.0e-6)) {
      // At rest on a whole sample: the read is then exact.
      reader.delay = wanted;
      reader.step = 0.0;
    } else {
      reader.step = distance * (1.0 / kControlPeriod);
    }
  }

  // Every 32 samples: where every read point is going, the loop gains, the
  // filters and the control-rate smoothers.
  void control() {
    using namespace expanse;
    using namespace expanse_layout;
    const float sr = sample_rate();
    const float seconds = kMinSeconds * std::pow(kMaxSeconds / kMinSeconds, param(kSize));
    const float rate = param(kModRate);
    depth_.set(param(kModDepth), started_);
    const float depth = depth_.next() * kSweepSeconds * sr / kit::max(rate, 1.0f);
    const float turn = rate * kControlPeriod / sr;
    // Modulation inside the loop fades out as Freeze closes it.
    const float loop_depth = depth * (1.0f - freeze_.value);

    const float decay = decay_.next();
    const bool infinite = param(kDecay) >= kParamMax[kDecay] * 0.995f;
    float finite_gain = 0.0f;
    for (int n = 0; n < kLines; ++n) {
      aim(line_read_[n], seconds, 0.0f, 0.0f);
      float pass = static_cast<float>(line_read_[n].base);
      for (int k = 0; k < kLoopStages; ++k) {
        aim(loop_read_[n][k], seconds, loop_depth, turn);
        pass += static_cast<float>(loop_read_[n][k].base);
      }
      // An allpass delays energy by its length on average, so a pass takes
      // the line plus its three allpasses.
      const float gain = kit::rt60_gain(pass, decay, sr);
      if (n == 0) finite_gain = gain;
      gain_[n] = infinite ? 1.0f : gain;
      for (int c = 0; c < 2; ++c) {
        Reader& tap = tap_read_[c][n];
        tap.limit = static_cast<float>(line_read_[n].base) - 2.0f;
        aim(tap, seconds, depth, turn);
      }
      low_cut_[n].set(param(kLowCut), kit::kSqrtHalf, sr);
      high_cut_[n].set(param(kHighCut), kit::kSqrtHalf, sr);
    }
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kBloomStages; ++k) aim(bloom_read_[c][k], seconds, 0.0f, 0.0f);
    }

    diffusion_.set(param(kDensity), started_);
    diffusion_.next();
    // A long decay stores more energy for the same input; take half of that
    // back (in dB). Infinite uses the level of the longest finite decay, so
    // the last step of the knob is not also a step in volume.
    const float kept = finite_gain * finite_gain;
    level_.set(kWetGain * std::sqrt(std::sqrt(kit::max(1.0f - kept, 0.02f))), started_);
    level_.next();
  }

  void apply(int id) {
    using namespace expanse;
    const float value = param(id);
    switch (id) {
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        dry_.set(dry, primed());
        wet_.set(wet, primed());
        break;
      }
      case kDecay:
        if (primed()) {
          decay_.set_target(value);
        } else {
          decay_.snap(value);
        }
        break;
      case kGravity: {
        float direct, late;
        kit::equal_power(value, &direct, &late);
        direct_.set(direct, primed());
        late_.set(late, primed());
        break;
      }
      case kFreeze:
        freeze_.set(value >= 0.5f ? 1.0f : 0.0f, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      default:
        break;  // everything else is read on the control clock
    }
  }

  float pool_[kPoolSize];
  Slice line_[kLines];
  Slice loop_allpass_[kLines][kLoopStages];
  Slice bloom_[2][kBloomStages];
  Reader line_read_[kLines];
  Reader loop_read_[kLines][kLoopStages];
  Reader tap_read_[2][kLines];
  Reader bloom_read_[2][kBloomStages];
  kit::AllpassDelay<kInputSize> input_allpass_[2][kInputStages];
  int input_length_[2][kInputStages] = {};
  kit::Svf low_cut_[kLines];
  kit::Svf high_cut_[kLines];
  float gain_[kLines] = {};
  float glide_ = 0.0f;

  kit::Smoother dry_, wet_, width_, direct_, late_, freeze_;
  kit::Smoother decay_, level_, diffusion_, depth_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  bool started_ = false;  // the first control tick snaps what later ones glide
  bool blooming_ = false;
};

}  // namespace livemix
