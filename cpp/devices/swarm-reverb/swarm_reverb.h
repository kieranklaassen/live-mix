#pragma once

// Swarm Reverb: a cavern made of a swarm of short echoes, on a delay line
// whose clock can be dragged.
//
//   in ─►(+)─► dampen ─► low cut ─► 4 allpasses ─► line ─┬─ 14 taps ─► swarm ─► width ─► wet
//         ▲              (Diffuse)                       └─ end of the line ─┐
//         └── limit ◄── Reflect ◄── rotate left/right ◄─────────────────────┘
//
// - Two lines, one per side. Each is read by fourteen taps at uneven, seeded
//   times between a few hundredths of Length and Length itself: a hit comes
//   back as a rush of separate reflections. The left and right lines have
//   different tap times, so the swarm is decorrelated without any polarity
//   trick.
// - Reflect sends the end of each line back in through a rotation that mixes
//   left and right. The rotation loses nothing, so the gain round the loop is
//   Reflect at every frequency (no one resonance takes over), and each trip
//   doubles the number of echo paths: the swarm piles up into a cave. Past 1
//   the loop grows until a soft limiter on the return holds it.
// - Every delay in the device (taps, loop reads, allpass lengths) is a
//   distance on one tape whose speed is 1 / (Length x Drag). The device keeps
//   the history of the tape position and, for each read, finds when the
//   sample now under it was written. So when the speed changes from v1 to
//   v2, everything already on the tape plays back at v2 / v1 until it has
//   passed its tap, exactly as on a delay whose clock is turned: Drag bends
//   the whole cave by one ratio. With Steps on, the speeds are related by
//   octaves, fifths and fourths, so the bend is a musical interval. What has
//   been bent and goes round again stays bent.
// - Wander moves Drag on its own: a slow seeded drift, or with Steps on a
//   seeded walk between neighbouring steps.
// - Each tap is also swept a little by its own slow sine, which keeps the
//   cluster from ringing like a comb.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class SwarmReverb : public kit::DeviceBase<swarm_reverb::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace swarm_reverb;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();

    for (int c = 0; c < 2; ++c) {
      line_[c].clear();
      for (int a = 0; a < kStages; ++a) allpass_[c][a].clear();
      dampen_[c].reset();
      low_cut_[c].reset();
    }
    side_low_.reset();
    side_low_.set_cutoff(kBassMonoHz, sr);
    for (int i = 0; i < kHistory; ++i) history_[i] = 0.0;
    position_ = 0.0;
    tick_ = 0;
    for (int c = 0; c < 2; ++c) {
      for (int j = 0; j < kControlPeriod; ++j) {
        swarm_chunk_[c][j] = 0.0f;
        back_chunk_[c][j] = 0.0f;
      }
    }
    chunk_at_ = 0;
    build_swarm();

    reflect_.set_time(kSmoothingSeconds, sr);
    diffuse_.set_time(kSmoothingSeconds, sr);
    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    level_.set_time(0.03f, sr);
    const float control_rate = sr / kControlPeriod;
    length_.set_time(kLengthGlideSeconds, control_rate);
    depth_.set_time(0.05f, control_rate);
    wander_.set_time(0.05f, control_rate);
    dampen_hz_.set_time(0.02f, control_rate);
    low_cut_hz_.set_time(0.02f, control_rate);
    drag_ = 0.0f;
    fill_ = 0.0f;
    fill_coeff_ = kit::time_to_coeff(kFillSeconds, sr);

    wander_drift_.seed(0x3C6EF372u);
    wander_drift_.set_rate(kWanderHz, sr);
    step_rng_.seed(0xA54FF53Au);
    step_offset_ = 0;
    step_wait_ = 0;
    step_armed_ = false;

    clock_.reset(kControlPeriod);
    // The longest silent gap is the longest tap: Length x Drag at their tops.
    idle_.reset(sr, kParamMax[kLength] * 2.0f + 0.6f);
    started_ = false;
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) render(i);
    idle_.settle(output_peak(frames), frames);
  }

  // For the harness: the current delay of the last left tap, in seconds.
  float last_tap_seconds() const {
    return static_cast<float>(tap_[0][kTaps - 1].delay) / sample_rate();
  }

 private:
  static constexpr int kTaps = 14;
  static constexpr int kStages = 4;
  static constexpr int kLineSize = 262144;  // 2.4 s at 96 kHz and room to sweep
  static constexpr int kAllpassSize = 8192;
  static constexpr int kHistory = 16384;    // control ticks: 2.7 s at 96 kHz
  static constexpr int kControlPeriod = 16;
  static constexpr int kStepCount = 7;
  // The shortest a tap may be: a control period and the interpolator's reach.
  static constexpr float kLeastTap = kControlPeriod + 4.0f;

  // Allpass lengths as shares of Length. Their sum is the earliest a sound
  // can come back; the tap distances are shortened by it so the arrivals
  // land where the swarm table says.
  static constexpr float kAllpassSpan[2][kStages] = {{0.0037f, 0.0059f, 0.0083f, 0.0113f},
                                                     {0.0041f, 0.0061f, 0.0079f, 0.0121f}};
  // Where each line is read for the loop, as a share of Length.
  static constexpr float kLoopSpan[2] = {1.0f, 0.887f};
  static constexpr float kFirstArrival = 0.035f;
  static constexpr float kSwarmCurve = 1.25f;    // above 1: denser at the front
  static constexpr float kSwarmTiltDb = 6.0f;    // the last tap against the first
  static constexpr float kMaxDiffusion = 0.7f;
  static constexpr float kSweepSeconds = 0.0018f;  // per tap at Modulation 1
  static constexpr float kLengthGlideSeconds = 0.08f;
  static constexpr float kWanderHz = 0.05f;
  static constexpr float kWanderOctaves = 0.6f;
  static constexpr float kBassMonoHz = 160.0f;
  static constexpr float kWetGain = 1.0f;
  static constexpr float kFullLevel = 0.4f;        // RMS in the line where the return starts to give
  static constexpr float kFillSeconds = 0.25f;
  static constexpr float kAntiDenormal = 1.0e-18f;
  // Drag positions with Steps on, in octaves of time: 1/2, 2/3, 3/4, 1, 4/3,
  // 3/2 and 2 times Length.
  static constexpr float kStepOctaves[kStepCount] = {-1.0f,     -0.5849625f, -0.4150375f, 0.0f,
                                                 0.4150375f, 0.5849625f,  1.0f};

  // A read point on the tape.
  struct Read {
    double span = 0.5;    // distance behind the write point, in Lengths
    double delay = 16.0;  // in samples, now
    double from = 16.0;   // where it was a control period ago
    long long at = 0;     // allpass reads: where on the line, 32.32 fixed point
    long long advance = 0;
    float least = 3.0f;
    long long index = 0;  // the history segment the read point is in
    float limit = 64.0f;
    float phase = 0.0f;   // its own slow sweep
    float rate = 0.0f;
    float gain = 0.0f;

    // Ramp from `from` to `delay` over one control period: the absolute
    // position of the first read and how far it moves per sample.
    void ramp(int write_position, int size) {
      const double step = (delay - from) * (1.0 / kControlPeriod);
      at = static_cast<long long>(
          (static_cast<double>(write_position + size) - (from + step)) * 4294967296.0);
      advance = static_cast<long long>((1.0 - step) * 4294967296.0);
    }
  };

  // Hermite read at a 32.32 fixed-point position on a line.
  template <int Size>
  static float read_at(const kit::DelayLine<Size>& line, long long at) {
    const int index = static_cast<int>(at >> 32);
    const float t = static_cast<float>(static_cast<unsigned int>(at)) * (1.0f / 4294967296.0f);
    return kit::hermite(line.at(index - 1), line.at(index), line.at(index + 1), line.at(index + 2),
                        t);
  }

  // The tap table: where each echo arrives (a share of Length), how loud and
  // which way up. Seeded, so it is the same swarm every time; left and right
  // draw different numbers.
  void build_swarm() {
    kit::Rng rng;
    rng.seed(0x1F83D9ABu);
    for (int c = 0; c < 2; ++c) {
      float diffusers = 0.0f;
      for (int a = 0; a < kStages; ++a) {
        Read& stage = stage_[c][a];
        stage = Read();
        stage.span = kAllpassSpan[c][a];
        stage.limit = static_cast<float>(kAllpassSize - 16);
        diffusers += kAllpassSpan[c][a];
      }
      float energy = 0.0f;
      for (int k = 0; k < kTaps; ++k) {
        // One tap per fourteenth of the way, moved about inside its slot.
        float u = (static_cast<float>(k) + 0.5f + 0.7f * (rng.uniform() - 0.5f)) / kTaps;
        if (k == kTaps - 1) u = 1.0f;
        const float arrival = kFirstArrival + (1.0f - kFirstArrival) * std::pow(u, kSwarmCurve);
        Read& tap = tap_[c][k];
        tap = Read();
        tap.span = arrival - diffusers;
        tap.limit = static_cast<float>(kLineSize - 16);
        tap.least = kLeastTap;
        tap.phase = rng.uniform();
        tap.rate = 0.15f + 0.6f * rng.uniform();
        const float sign = rng.uniform() < 0.5f ? -1.0f : 1.0f;
        tap.gain = sign * kit::db_to_gain(-kSwarmTiltDb * arrival);
        energy += tap.gain * tap.gain;
      }
      // Unit energy: the swarm is as loud as the sound that made it.
      const float scale = 1.0f / std::sqrt(energy);
      for (int k = 0; k < kTaps; ++k) tap_[c][k].gain *= scale;

      Read& loop = loop_[c];
      loop = Read();
      loop.span = kLoopSpan[c] - diffusers;
      loop.limit = static_cast<float>(kLineSize - 16);
      loop.least = kLeastTap;
      loop.phase = rng.uniform();
      loop.rate = 0.11f + 0.2f * rng.uniform();
    }
  }
  static void copy_tuning(const kit::Svf& from, kit::Svf* to) {
    to->g = from.g;
    to->k = from.k;
    to->a1 = from.a1;
    to->a2 = from.a2;
    to->a3 = from.a3;
  }

  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  // Exact to ±1, landing on ±2: the ceiling on the return and on the swarm.
  static float limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  // One control period of a tap, added to `out`: the read point ramps from
  // where it was to where control() aimed it. Every tap is at least a period
  // and a few samples long, so what it reads in this period is already on
  // the line; reading it in one run is the same audio as reading it sample
  // by sample, at a fraction of the cost. Positions are 32.32 fixed point.
  static void sweep(const kit::DelayLine<kLineSize>& line, Read& read, float gain, float* out) {
    read.ramp(line.write_position(), kLineSize);
    long long at = read.at;
    for (int j = 0; j < kControlPeriod; ++j) {
      out[j] += gain * read_at(line, at);
      at += read.advance;
    }
  }

  // The swarm and the loop reads for the coming control period.
  void gather() {
    for (int c = 0; c < 2; ++c) {
      for (int j = 0; j < kControlPeriod; ++j) {
        swarm_chunk_[c][j] = 0.0f;
        back_chunk_[c][j] = 0.0f;
      }
      for (int k = 0; k < kTaps; ++k) sweep(line_[c], tap_[c][k], tap_[c][k].gain, swarm_chunk_[c]);
      sweep(line_[c], loop_[c], 1.0f, back_chunk_[c]);
    }
  }

  void render(int i) {
    float in[2];
    take_input(i, &in[0], &in[1]);
    if (clock_.tick()) {
      control();
      gather();
      started_ = true;
      chunk_at_ = 0;
    }
    const float reflect = glide(reflect_);
    const float diffusion = glide(diffuse_);
    const float back[2] = {back_chunk_[0][chunk_at_], back_chunk_[1][chunk_at_]};
    const float swarm[2] = {swarm_chunk_[0][chunk_at_], swarm_chunk_[1][chunk_at_]};
    ++chunk_at_;

    // The return: a quarter-turn rotation between the sides, then the limiter.
    const float turned[2] = {(back[0] + back[1]) * kit::kSqrtHalf,
                             (back[1] - back[0]) * kit::kSqrtHalf};
    // What holds the loop when Reflect is past 1: the return is turned down
    // as the cave fills (half the excess, in dB, over kFullLevel). It rides
    // the level slowly instead of clipping the waveform, so a chord left to
    // regenerate stays a chord and does not collapse onto its loudest note.
    // The limiter after it only catches peaks.
    const float power = 0.5f * (back[0] * back[0] + back[1] * back[1]);
    fill_ = flush_denormal(power + (fill_ - power) * fill_coeff_);
    float hold = reflect;
    if (fill_ > kFullLevel * kFullLevel) hold *= std::sqrt(kFullLevel / std::sqrt(fill_));
    for (int c = 0; c < 2; ++c) {
      float x = in[c] + limit(hold * turned[c]);
      // A constant far below hearing keeps the four recursions out of the
      // denormal range while a tail dies away, for less than flushing each.
      x = low_cut_[c].highpass(dampen_[c].lowpass(x)) + kAntiDenormal;
      for (int a = 0; a < kStages; ++a) {
        Read& stage = stage_[c][a];
        const float delayed = read_at(allpass_[c][a], stage.at);
        stage.at += stage.advance;
        const float v = x + diffusion * delayed;
        allpass_[c][a].write(v);
        x = delayed - diffusion * v;
      }
      line_[c].write(flush_denormal(x));
    }

    // Width on the swarm only; below kBassMonoHz the difference between the
    // sides is dropped so the bass stays in the middle.
    const float mid = 0.5f * (swarm[0] + swarm[1]);
    float side = 0.5f * (swarm[0] - swarm[1]);
    side = (side - side_low_.lowpass(side)) * glide(width_);
    const float wet = glide(wet_) * glide(level_);
    const float dry = glide(dry_);
    out_left_[i] = in[0] * dry + limit((mid + side) * wet);
    out_right_[i] = in[1] * dry + limit((mid - side) * wet);
  }

  // Find where a read point will be one control period on, and ramp to it.
  // `position_` is then the tape position at that time and the history holds
  // the position at every control tick before it: the sample `span` behind
  // the write point was written when the tape was at position_ - span.
  void aim(Read& read, float sweep, float turn) {
    const long long ahead = tick_ + 1;
    const double wanted = position_ - read.span;
    if (!started_) read.index = ahead - kHistory + 2;
    if (read.index < ahead - kHistory + 2) read.index = ahead - kHistory + 2;
    while (read.index + 1 < ahead && history_[(read.index + 1) & (kHistory - 1)] <= wanted) {
      ++read.index;
    }
    const double lo = history_[read.index & (kHistory - 1)];
    const double hi = history_[(read.index + 1) & (kHistory - 1)];
    double fraction = hi > lo ? (wanted - lo) / (hi - lo) : 0.0;
    if (fraction < 0.0) fraction = 0.0;
    if (fraction > 1.0) fraction = 1.0;
    double target =
        (static_cast<double>(ahead - read.index) - fraction) * static_cast<double>(kControlPeriod);
    if (sweep > 0.0f) {
      read.phase += read.rate * turn;
      if (read.phase >= 1.0f) read.phase -= 1.0f;
      // Never sweep a short tap by more than a quarter of its own length.
      const float reach = kit::min(sweep, 0.25f * static_cast<float>(target));
      target += static_cast<double>(reach * kit::SineTable::lookup(read.phase));
    }
    if (target < read.least) target = read.least;
    if (target > read.limit) target = read.limit;
    if (!started_) {
      read.from = target;
    } else {
      read.from = read.delay;
    }
    read.delay = target;
  }

  // With Steps on, Wander is a walk: every few seconds Drag jumps to another
  // step within reach. More Wander reaches further and jumps more often.
  int walk(float wander) {
    if (wander < 0.005f) {
      step_offset_ = 0;
      step_armed_ = false;
      return 0;
    }
    const float ticks_per_second = sample_rate() / kControlPeriod;
    if (!step_armed_) {
      step_armed_ = true;
      step_wait_ = static_cast<int>(1.5f * ticks_per_second);
    }
    if (--step_wait_ <= 0) {
      const int reach = 1 + static_cast<int>(wander * 2.99f);
      int next = step_offset_;
      while (next == step_offset_) {
        next = static_cast<int>(step_rng_.uniform() * static_cast<float>(2 * reach + 1)) - reach;
      }
      step_offset_ = next;
      const float seconds = kit::lerp(9.0f, 2.0f, wander) * (0.6f + 0.8f * step_rng_.uniform());
      step_wait_ = static_cast<int>(seconds * ticks_per_second);
    }
    return step_offset_;
  }

  // Every 16 samples: where Drag is, how fast the tape runs, where every
  // read point is going, and the loop filters.
  void control() {
    using namespace swarm_reverb;
    const float sr = sample_rate();
    const float knob = 2.0f * param(kDrag) - 1.0f;
    const float wander = wander_.next();
    const float drift = wander_drift_.next(kControlPeriod);
    float target = knob;
    float free = wander * kWanderOctaves * drift;
    if (param(kSteps) >= 0.5f) {
      int nearest = 0;
      for (int s = 1; s < kStepCount; ++s) {
        if (std::fabs(kStepOctaves[s] - knob) < std::fabs(kStepOctaves[nearest] - knob)) nearest = s;
      }
      const int offset = walk(wander);
      int index = nearest + offset;
      if (index < 0 || index >= kStepCount) index = nearest - offset;  // bounce off the ends
      target = kStepOctaves[kit::clamp_int(index, 0, kStepCount - 1)];
      free = 0.0f;
    } else {
      step_offset_ = 0;
      step_armed_ = false;
    }
    if (!started_) {
      drag_ = target;
    } else {
      // Drag Time is the time to cover 95 % of a move.
      const float coeff = kit::time_to_coeff(param(kDragTime) * (1.0f / 3.0f), sr / kControlPeriod);
      drag_ = flush_denormal(target + (drag_ - target) * coeff);
    }
    const float octaves = kit::clamp(drag_ + free, -1.0f, 1.0f);
    const float seconds = std::exp2(length_.next() + octaves);
    const double speed = 1.0 / (static_cast<double>(seconds) * sr);  // Lengths per sample

    if (!started_) {
      // As if the tape had always run at this speed.
      for (int n = 0; n < kHistory; ++n) {
        history_[(kHistory - n) & (kHistory - 1)] = -speed * kControlPeriod * n;
      }
      position_ = 0.0;
    }
    position_ += speed * kControlPeriod;
    history_[(tick_ + 1) & (kHistory - 1)] = position_;

    const float sweep = depth_.next() * kSweepSeconds * sr;
    const float turn = kControlPeriod / sr;
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kTaps; ++k) aim(tap_[c][k], sweep, turn);
      aim(loop_[c], sweep, turn);
      for (int a = 0; a < kStages; ++a) {
        aim(stage_[c][a], 0.0f, turn);
        stage_[c][a].ramp(allpass_[c][a].write_position(), kAllpassSize);
      }
    }
    ++tick_;

    // Both second-order Butterworth: next to no loss between the corners, so
    // at the top of Reflect the middle of the spectrum hangs while the edges
    // fall away a little more on every trip.
    dampen_[0].set(dampen_hz_.next(), kit::kSqrtHalf, sr);
    low_cut_[0].set(low_cut_hz_.next(), kit::kSqrtHalf, sr);
    copy_tuning(dampen_[0], &dampen_[1]);
    copy_tuning(low_cut_[0], &low_cut_[1]);
  }
  void apply(int id) {
    using namespace swarm_reverb;
    const float value = param(id);
    switch (id) {
      case kLength:
        length_.set(std::log2(value), primed());
        break;
      case kDiffuse:
        diffuse_.set(value * kMaxDiffusion, primed());
        break;
      case kReflect:
        reflect_.set(value, primed());
        // A long decay stores more energy for the same input; take half of
        // that back (in dB) so Reflect is not also a volume knob.
        level_.set(kWetGain * std::sqrt(std::sqrt(kit::max(1.0f - value * value, 0.04f))),
                   primed());
        break;
      case kDampen:
        dampen_hz_.set(value, primed());
        break;
      case kLowCut:
        low_cut_hz_.set(value, primed());
        break;
      case kWander:
        wander_.set(value, primed());
        break;
      case kModulation:
        depth_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is not quite 0
        dry_.set(dry, primed());
        wet_.set(wet, primed());
        break;
      }
      default:
        break;  // Drag, Drag Time and Steps are read on the control clock
    }
  }

  kit::DelayLine<kLineSize> line_[2];
  kit::DelayLine<kAllpassSize> allpass_[2][kStages];
  double history_[kHistory];
  double position_ = 0.0;
  long long tick_ = 0;
  float swarm_chunk_[2][kControlPeriod] = {};
  float back_chunk_[2][kControlPeriod] = {};
  int chunk_at_ = 0;
  Read tap_[2][kTaps];
  Read loop_[2];
  Read stage_[2][kStages];

  kit::Svf dampen_[2];
  kit::Svf low_cut_[2];
  kit::OnePole side_low_;
  kit::Smoother reflect_, diffuse_, dry_, wet_, width_, level_;
  kit::Smoother length_, depth_, wander_, dampen_hz_, low_cut_hz_;
  float drag_ = 0.0f;  // where Drag is now, in octaves of time
  float fill_ = 0.0f;  // mean square at the end of the lines
  float fill_coeff_ = 0.0f;
  kit::Drift wander_drift_;
  kit::Rng step_rng_;
  int step_offset_ = 0;
  int step_wait_ = 0;
  bool step_armed_ = false;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  bool started_ = false;
};

}  // namespace livemix
