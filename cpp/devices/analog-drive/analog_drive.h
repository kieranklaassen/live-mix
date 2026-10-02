#pragma once

// Analog Drive: a sound pushed through one of five circuits.
//
//   in ─┬─► low cut ─► Thump ─► [ circuit: emphasis ─► × drive ─► 4x up ─► curve ─► 4x down ─►
//       │                                  de-emphasis ─► DC block ─► × make-up ] ─► Tone ─►
//       │                                  high cut ─► × Output ─┐
//       └─► delay 39 ──────────────────────────────────── dry ─► Mix ─► out
//
// HEADER_NOTES

#include "../../kit/kit.h"
#include "adaa.h"
#include "circuits.h"
#include "filters.h"
#include "gain_table.h"
#include "halfband.h"
#include "params.gen.h"

namespace livemix {

class AnalogDrive : public kit::DeviceBase<analog_drive::kNumParams> {
 public:
  // What the manifest reports as latencySamples.
  static constexpr int kLatency = 39;

  void init(float sample_rate) {
    using namespace analog_drive;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    drive_.set_time(kSmoothingSeconds, sr);
    output_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    low_cut_.set_time(kFilterGlideSeconds, control_rate);
    thump_.set_time(kFilterGlideSeconds, control_rate);
    tone_.set_time(kFilterGlideSeconds, control_rate);
    high_cut_.set_time(kFilterGlideSeconds, control_rate);
    auto_gain_.set_time(kAutoGainGlideSeconds, control_rate);
    for (Lane& lane : lanes_) {
      lane.makeup.set_time(kSmoothingSeconds, sr);
      for (Lane::Channel& channel : lane.channel) {
        channel.outer.init();
        channel.inner.init(kInnerBeta);
        channel.dc.set_cutoff(kDcHz, sr);
      }
    }
    fade_length_ = static_cast<int>(kFadeSeconds * sr);
    if (fade_length_ < 1) fade_length_ = 1;
    warm_up_length_ = static_cast<int>(kWarmUpSeconds * sr);
    if (warm_up_length_ < 2 * kLatency) warm_up_length_ = 2 * kLatency;
    // The longest silent gap is the latency, under a millisecond.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    settle();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    // Nothing is sounding, so whatever changed while asleep applies at once.
    if (was_asleep) settle();

    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) control();
      if (!drive_.settled()) set_gain(drive_.next());
      const float output = output_.next();
      const float mix = mix_.next();

      const Setup want = wanted();
      if (phase_ == kSteady && !(lanes_[active_].setup == want)) {
        configure(lanes_[1 - active_], want, &lanes_[active_]);
        phase_ = kWarmUp;
        countdown_ = warm_up_length_;
      }

      float dry[2], pre[2];
      for (int c = 0; c < 2; ++c) {
        dry[c] = dry_[c].read(kLatency);
        dry_[c].write(in[c]);
        const float cut = low_cut_filter_[c].process(in[c]);
        pre[c] = thump_filter_[c].process(in[c] + (cut - in[c]) * low_cut_amount_);
      }

      float wet[2];
      run(lanes_[active_], pre, wet);
      if (phase_ != kSteady) {
        float incoming[2];
        run(lanes_[1 - active_], pre, incoming);
        const float fade =
            phase_ == kFade ? static_cast<float>(fade_position_) / static_cast<float>(fade_length_) : 0.0f;
        wet[0] += (incoming[0] - wet[0]) * fade;
        wet[1] += (incoming[1] - wet[1]) * fade;
        if (phase_ == kWarmUp) {
          if (--countdown_ <= 0) {
            phase_ = kFade;
            fade_position_ = 0;
          }
        } else if (++fade_position_ >= fade_length_) {
          active_ = 1 - active_;
          phase_ = kSteady;
        }
      }

      for (int c = 0; c < 2; ++c) {
        float y = tilt_[c].process(wet[c]);
        const float cut = high_cut_filter_[c][1].process(high_cut_filter_[c][0].process(y));
        y = (cut + (y - cut) * high_cut_open_) * output;
        wet[c] = dry[c] + (y - dry[c]) * mix;
      }
      out_left_[i] = wet[0];
      out_right_[i] = wet[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 16;
  // Full scale reaches a quarter of the way to the curve's ceiling at Drive 0.
  static constexpr float kHeadroom = 0.25f;
  static constexpr float kHeadroomDb = -12.0412f;
  // Drive 1 is +36 dB: ln(10^(36/20)).
  static constexpr float kLogMaxDrive = 4.1446532f;
  static constexpr float kPushGain = 10.0f;
  static constexpr float kFilterGlideSeconds = 0.02f;
  static constexpr float kAutoGainGlideSeconds = 0.03f;
  static constexpr float kDcHz = 7.0f;
  static constexpr float kThumpDb = 9.0f;
  static constexpr float kThumpQ = 1.1f;
  static constexpr float kThumpRatio = 1.6f;
  static constexpr float kThumpFloorHz = 60.0f;
  static constexpr float kToneDb = 6.0f;
  static constexpr float kTonePivotHz = 800.0f;
  // Low Cut fades out of the path over its bottom 10 Hz, High Cut over its
  // top 4 kHz, so both ends of the travel are a clean bypass.
  static constexpr float kLowCutOutHz = 20.0f;
  static constexpr float kLowCutInHz = 30.0f;
  static constexpr float kHighCutInHz = 16000.0f;
  static constexpr float kHighCutOutHz = 20000.0f;
  // Kaiser beta of the 31-tap second stage: -98 dB from 0.355 of its rate.
  static constexpr double kInnerBeta = 10.0;
  static constexpr float kFadeSeconds = 0.02f;
  static constexpr float kWarmUpSeconds = 0.005f;

  enum Phase : int { kSteady = 0, kWarmUp, kFade };

  // The two choices that cannot be ramped.
  struct Setup {
    int circuit = 0;
    bool push = false;
    bool operator==(const Setup& other) const { return circuit == other.circuit && push == other.push; }
  };

  // One complete circuit for both channels. Two exist so a new setup can be
  // crossfaded in.
  struct Lane {
    struct Channel {
      kit::Biquad pre[analog_drive_dsp::kMaxPre];
      kit::Biquad post[analog_drive_dsp::kMaxPost];
      kit::Halfband2x outer;
      analog_drive_dsp::Halfband<8> inner;
      analog_drive_dsp::Adaa2 adaa;
      analog_drive_dsp::Compensator compensator;
      analog_drive_dsp::DcBlock dc;
    };
    Setup setup;
    const analog_drive_dsp::Circuit* spec = nullptr;
    float push_gain = 1.0f;
    float envelope = 0.0f;   // of what leaves the curve, both channels
    float attack = 0.0f;
    float release = 0.0f;
    float bias = 0.0f;       // last frame's working point
    double offset = 0.0;     // and the curve's value there
    kit::Smoother makeup;
    Channel channel[2];
  };

  Setup wanted() const {
    using namespace analog_drive;
    Setup setup;
    setup.circuit =
        kit::clamp_int(static_cast<int>(param(kCircuit) + 0.5f), 0, analog_drive_dsp::kNumCircuits - 1);
    setup.push = param(kPush) >= 0.5f;
    return setup;
  }

  void apply(int id) {
    using namespace analog_drive;
    const float value = param(id);
    switch (id) {
      case kDrive:
        drive_.set(value, primed());
        break;
      case kLowCut:
        low_cut_.set(std::log(value), primed());
        filters_dirty_ = true;
        break;
      case kThump:
        thump_.set(value, primed());
        filters_dirty_ = true;
        break;
      case kTone:
        tone_.set(value, primed());
        filters_dirty_ = true;
        break;
      case kHighCut:
        high_cut_.set(std::log(value), primed());
        filters_dirty_ = true;
        break;
      case kAutoGain:
        auto_gain_.set(value >= 0.5f ? 1.0f : 0.0f, primed());
        break;
      case kOutput:
        output_.set(kit::db_to_gain(value), primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // circuit and push are read as a Setup in process()
    }
  }

  void set_gain(float drive) { gain_ = kHeadroom * std::exp(kLogMaxDrive * drive); }

  // Jump to the current targets with clean state everywhere. Only called
  // when the signal path is empty (init, waking from sleep).
  void settle() {
    kit::Smoother* smoothers[] = {&drive_, &output_, &mix_, &low_cut_, &thump_, &tone_, &high_cut_, &auto_gain_};
    for (kit::Smoother* smoother : smoothers) smoother->snap(smoother->target);
    set_gain(drive_.value);
    for (int c = 0; c < 2; ++c) {
      dry_[c].clear();
      low_cut_filter_[c].reset();
      thump_filter_[c].reset();
      high_cut_filter_[c][0].reset();
      high_cut_filter_[c][1].reset();
      tilt_[c].reset();
    }
    active_ = 0;
    phase_ = kSteady;
    countdown_ = 0;
    fade_position_ = 0;
    clock_.reset(kControlPeriod);
    filters_dirty_ = true;
    makeup_drive_ = -1.0f;
    const Setup want = wanted();
    configure(lanes_[0], want, nullptr);
    configure(lanes_[1], want, nullptr);
  }

  // PRIVATE_METHODS_2

  kit::DelayLine<64> dry_[2];
  Lane lanes_[2];
  analog_drive_dsp::Section low_cut_filter_[2];
  analog_drive_dsp::Section thump_filter_[2];
  analog_drive_dsp::Section high_cut_filter_[2][2];
  analog_drive_dsp::Tilt tilt_[2];
  kit::Smoother drive_, output_, mix_;
  // Stepped on the control clock.
  kit::Smoother low_cut_, thump_, tone_, high_cut_, auto_gain_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float gain_ = 1.0f;
  float low_cut_amount_ = 0.0f;
  float high_cut_open_ = 1.0f;
  float makeup_drive_ = -1.0f;
  float makeup_auto_ = -1.0f;
  bool filters_dirty_ = true;
  int active_ = 0;
  int phase_ = kSteady;
  int countdown_ = 0;
  int fade_position_ = 0;
  int fade_length_ = 960;
  int warm_up_length_ = 240;
};

}  // namespace livemix
