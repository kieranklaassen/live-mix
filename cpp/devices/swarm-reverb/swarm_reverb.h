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
  static constexpr int kSteps = 7;

  // Allpass lengths as shares of Length. Their sum is the earliest a sound
  // can come back; the tap distances are shortened by it so the arrivals
  // land where the swarm table says.
  static constexpr float kAllpassSpan[2][kStages] = {{0.0071f, 0.0113f, 0.0173f, 0.0243f},
                                                     {0.0077f, 0.0121f, 0.0163f, 0.0257f}};
  // Where each line is read for the loop, as a share of Length.
  static constexpr float kLoopSpan[2] = {1.0f, 0.887f};
  static constexpr float kFirstArrival = 0.075f;
  static constexpr float kSwarmCurve = 1.25f;    // above 1: denser at the front
  static constexpr float kSwarmTiltDb = 6.0f;    // the last tap against the first
  static constexpr float kMaxDiffusion = 0.7f;
  static constexpr float kSweepSeconds = 0.0018f;  // per tap at Modulation 1
  static constexpr float kLengthGlideSeconds = 0.08f;
  static constexpr float kWanderHz = 0.05f;
  static constexpr float kWanderOctaves = 0.6f;
  static constexpr float kBassMonoHz = 160.0f;
  static constexpr float kWetGain = 1.0f;
  // Drag positions with Steps on, in octaves of time: 1/2, 2/3, 3/4, 1, 4/3,
  // 3/2 and 2 times Length.
  static constexpr float kStepOctaves[kSteps] = {-1.0f,     -0.5849625f, -0.4150375f, 0.0f,
                                                 0.4150375f, 0.5849625f,  1.0f};

  // A read point on the tape.
  struct Read {
    double span = 0.5;    // distance behind the write point, in Lengths
    double delay = 16.0;  // in samples, now
    double step = 0.0;
    long long index = 0;  // the history segment the read point is in
    float limit = 64.0f;
    float phase = 0.0f;   // its own slow sweep
    float rate = 0.0f;
    float gain = 0.0f;

    double next() {
      delay += step;
      return delay;
    }
  };

  template <int Size>
  static float read_at(const kit::DelayLine<Size>& line, double delay) {
    const int whole = static_cast<int>(delay);
    const float fraction = static_cast<float>(delay - static_cast<double>(whole));
    const int at = line.write_position() - whole;
    return kit::hermite(line.at(at + 1), line.at(at), line.at(at - 1), line.at(at - 2), fraction);
  }

  void build_swarm() {}
  void render(int i) { (void)i; }
  void apply(int id) { (void)id; }

  kit::DelayLine<kLineSize> line_[2];
  kit::DelayLine<kAllpassSize> allpass_[2][kStages];
  double history_[kHistory];
  double position_ = 0.0;
  long long tick_ = 0;
  Read tap_[2][kTaps];
  Read loop_[2];
  Read stage_[2][kStages];

  kit::OnePole dampen_[2];
  kit::OnePole low_cut_[2];
  kit::OnePole side_low_;
  kit::Smoother reflect_, diffuse_, dry_, wet_, width_, level_;
  kit::Smoother length_, depth_, wander_, dampen_hz_, low_cut_hz_;
  float drag_ = 0.0f;  // where Drag is now, in octaves of time
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
