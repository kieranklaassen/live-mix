#pragma once

// Tape Echo: one record head and up to three playback heads on a loop of
// tape, per channel.
//
//   in ──(+)──► saturate ──► tape ──► heads ──┬──────────────► wet
//         ▲                                   │
//         └── feedback ◄─ low cut ◄─ high cut ◄┘  (crossed between channels
//                                                  by Ping Pong)
//
// - Time is the tape speed: changing it glides (a 120 ms motor lag), so the
//   repeats bend in pitch the way a varispeed knob does.
// - Wow (0.5 Hz drift) and flutter (7 Hz) move the read point by a fixed
//   amount of time, so the pitch wobble is the same at every delay length.
// - The record path saturates (tanh, unity gain for small signals), which is
//   what bounds the loop when Feedback goes past 1.
// - Ping Pong sends the input to the left tape only and crosses the feedback,
//   so repeats alternate sides.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class TapeEcho : public kit::DeviceBase<tape_echo::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace tape_echo;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      tape_[c].clear();
      low_cut_[c].reset();
      high_cut_[c].reset();
    }
    time_.set_time(kMotorLagSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    wow_.set_time(kSmoothingSeconds, sr);
    flutter_.set_time(kSmoothingSeconds, sr);
    drive_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    for (kit::Smoother& gain : head_gain_) gain.set_time(0.02f, sr);
    wow_drift_.seed(0x51ED270Bu);
    wow_drift_.set_rate(0.5f, sr);
    flutter_lfo_.reset();
    flutter_lfo_.seed(0x9E3779B9u);
    flutter_lfo_.set_rate(7.1f, sr);
    flutter_drift_.seed(0x7F4A7C15u);
    flutter_drift_.set_rate(1.9f, sr);
    filter_clock_.reset(16);
    // The longest silent gap is the longest delay plus the motor lag.
    idle_.reset(sr, kParamMax[kTime] * 0.001f + 0.5f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    time_seen_ = time_.value;
    time_step_ = 0.0f;
    wobble_seen_ = 0.0f;
    wobble_step_ = 0.0f;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, where the Time head stands now in milliseconds (the knob's time while
  // the motor is still catching up with it; asleep, where it will stand);
  // 1, the tape's speed past the heads against a steady transport (1 is
  // steady, above it the repeats play sharp): one less the rate at which the
  // read point moves away, from the motor's glide and the wow and flutter.
  float meter(int index) const {
    const float sr = sample_rate();
    if (index == 0) return (idle_.asleep() ? time_.target : time_seen_) * 1000.0f / sr;
    if (index == 1) return idle_.asleep() ? 1.0f : 1.0f - (time_step_ + wobble_step_ * sr);
    return 0.0f;
  }

  void process(int frames) {
    using namespace tape_echo;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    // The last two read points of the block, kept for meter(): the motor's
    // part in samples and the wobble in seconds, apart, because their sum is
    // too coarse a float to take a small difference of.
    float time_was = time_seen_, time_is = time_seen_;
    float wobble_was = wobble_seen_, wobble_is = wobble_seen_;
    const float max_delay = kit::DelayLine<kTapeSize>::max_delay() - 8.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      if (filter_clock_.tick()) {
        const float sr = sample_rate();
        for (int c = 0; c < 2; ++c) {
          low_cut_[c].set_cutoff(param(kLowCut), sr);
          high_cut_[c].set(param(kHighCut), 0.6f, sr);
        }
      }

      const float wobble = wow_.next() * kWowSeconds * wow_drift_.next() +
                           flutter_.next() * kFlutterSeconds *
                               (0.7f * flutter_lfo_.next(kit::Lfo::kSine) + 0.3f * flutter_drift_.next());
      const float base = time_.next() + wobble * sample_rate();
      time_was = time_is;
      time_is = time_.value;
      wobble_was = wobble_is;
      wobble_is = wobble;

      float echo[2] = {0.0f, 0.0f};
      for (int h = 0; h < kNumHeads; ++h) {
        const float gain = head_gain_[h].next();
        if (gain == 0.0f) continue;
        const float delay = kit::clamp(base * kHeadRatio[h], 4.0f, max_delay);
        echo[0] += gain * tape_[0].read_hermite(delay);
        echo[1] += gain * tape_[1].read_hermite(delay);
      }

      const float feedback = feedback_.next();
      const float spread = spread_.next();
      float back[2];
      for (int c = 0; c < 2; ++c) {
        back[c] = low_cut_[c].highpass(high_cut_[c].lowpass(echo[c]));
      }
      const float drive = 1.0f + 3.0f * drive_.next();
      const float record_left = in[0] + feedback * kit::lerp(back[0], back[1], spread);
      const float record_right =
          in[1] * (1.0f - spread) + feedback * kit::lerp(back[1], back[0], spread);
      tape_[0].write(flush_denormal(kit::fast_tanh(record_left * drive) / drive));
      tape_[1].write(flush_denormal(kit::fast_tanh(record_right * drive) / drive));

      float dry_gain, wet_gain;
      kit::equal_power(mix_.next(), &dry_gain, &wet_gain);
      out_left_[i] = in[0] * dry_gain + echo[0] * wet_gain;
      out_right_[i] = in[1] * dry_gain + echo[1] * wet_gain;
    }
    time_seen_ = time_is;
    time_step_ = time_is - time_was;
    wobble_seen_ = wobble_is;
    wobble_step_ = wobble_is - wobble_was;
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // 2 s at 96 kHz plus wow headroom.
  static constexpr int kTapeSize = 262144;
  static constexpr int kNumHeads = 3;
  static constexpr float kMotorLagSeconds = 0.12f;
  // Peak read-point excursions: ±0.5 % pitch at 0.5 Hz, ±0.3 % at 7 Hz.
  static constexpr float kWowSeconds = 0.0016f;
  static constexpr float kFlutterSeconds = 0.00007f;
  // Head positions as a share of the Time setting (the last head is Time).
  static constexpr float kHeadRatio[kNumHeads] = {1.0f, 2.0f / 3.0f, 1.0f / 3.0f};
  // Per mode: gain of each head. Sums are kept near 1 so the loop gain a
  // Feedback setting gives does not jump with the mode.
  static constexpr float kHeadGains[4][kNumHeads] = {
      {1.0f, 0.0f, 0.0f},      // One
      {0.6f, 0.0f, 0.5f},      // Two: Time and a third of it
      {0.45f, 0.35f, 0.35f},   // Three
      {0.6f, 0.5f, 0.0f},      // Dotted: Time and two thirds of it
  };

  void apply(int id) {
    using namespace tape_echo;
    const float value = param(id);
    switch (id) {
      case kTime:
        time_.set(value * 0.001f * sample_rate(), primed());
        break;
      case kFeedback:
        feedback_.set(value, primed());
        break;
      case kHeads: {
        const int mode = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 3);
        for (int h = 0; h < kNumHeads; ++h) head_gain_[h].set(kHeadGains[mode][h], primed());
        break;
      }
      case kWow:
        wow_.set(value, primed());
        break;
      case kFlutter:
        flutter_.set(value, primed());
        break;
      case kDrive:
        drive_.set(value, primed());
        break;
      case kSpread:
        spread_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // the cut filters read their parameters on the control clock
    }
  }

  kit::DelayLine<kTapeSize> tape_[2];
  kit::OnePole low_cut_[2];
  kit::Svf high_cut_[2];
  kit::Smoother time_, feedback_, wow_, flutter_, drive_, spread_, mix_;
  kit::Smoother head_gain_[kNumHeads];
  kit::Drift wow_drift_, flutter_drift_;
  kit::Lfo flutter_lfo_;
  kit::ControlClock filter_clock_;
  kit::IdleGate idle_;
  // For meter() only: never read by the sound.
  float time_seen_ = 0.0f;
  float time_step_ = 0.0f;
  float wobble_seen_ = 0.0f;
  float wobble_step_ = 0.0f;
};

}  // namespace livemix
