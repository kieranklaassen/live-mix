#pragma once

// Saturator: drive into one of five curves, oversampled so the harmonics the
// curve makes above Nyquist are filtered out instead of folding back.
//
//   in ─┬─► × Drive ─► up ─► curve(u + Bias) − curve(Bias) ─► DC block ─► down ─► Tone ─► × Output ─┐
//       │              (1x, 2x or 4x; ADAA on Soft and Hard;     under the                          ├─► out
//       │               Tape adds a high cut that closes with    curve's ceiling                    │
//       │               Drive)                                                                      │
//       └─► delay 39 ────────────────────────────────────────────────────────────────── dry ─► Mix ─┘
//
// Ported from kkfonie's Tatami SaturatorDevice. The curves (Waveshapers.h)
// and the antiderivative anti-aliasing (Adaa.h) are the originals.
//
// - Every Oversampling setting takes the same 39 samples, the length of the
//   4x path (kit::Halfband2x around a shorter second stage: 31 + 8), so the
//   device reports one latency and the dry path is delayed once. The 2x path
//   starts 8 samples late and the 1x path 39.
// - Bias is added at the curve and the curve's own value at that bias taken
//   off again, so the bias moves the operating point (asymmetry, even
//   harmonics) without putting a constant on the output: silence in is exact
//   silence out, the device can sleep, and waking it does not thump. The DC
//   the signal itself produces through an asymmetric curve is what DC Block
//   removes.
// - DC Block works under the curve's ceiling (a deviation from the source,
//   which runs a plain blocker after the downsampler). A plain blocker tilts
//   the flat top of a squared-off low note towards zero, so the next edge
//   starts from further away and lands past the ceiling: a clipped 41 Hz
//   note left 3.7 dB over full scale, and a piano phrase up to 1.2 dB. Here
//   the blocker follows the mean of what leaves once that is held inside the
//   curve's own +-1 (DcBlocker::lowpassBounded), at the curve's rate, so the
//   hold is band-limited by the downsampler like the curve itself. With DC
//   Block off a biased curve keeps the range its bias gave it (full scale
//   less curve(Bias)).
// - What is left over full scale is the band-limiting itself: a squared-off
//   wave without its harmonics above Nyquist is not flat on top, so after the
//   downsampler a sample can stand 0.1 dB over the ceiling at 12 dB of drive
//   on a pure tone and up to 1.5 dB at the hardest drives (0.1 dB on a piano
//   phrase up to 24 dB of drive). Holding that at the base rate would put
//   back the aliasing the oversampling takes out (measured: from -86 to
//   -40 dBFS at 4x), so it is left. At 1x there is no band-limiting and the
//   output is the curve exactly.
// - Curve, Oversampling and ADAA switch by running the new setting beside the
//   old one for 2 ms (to fill its filters) and crossfading over 10 ms.
// - Mix is a linear crossfade: wet and dry are time-aligned and correlated,
//   so equal power would add 3 dB at the middle.

#include "../../kit/kit.h"
#include "Adaa.h"
#include "Waveshapers.h"
#include "halfband.h"
#include "params.gen.h"

namespace livemix {

class Saturator : public kit::DeviceBase<saturator::kNumParams> {
 public:
  // What the manifest reports as latencySamples.
  static constexpr int kLatency = 39;

  void init(float sample_rate) {
    using namespace saturator;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    kit::LinearRamp* ramps[] = {&drive_db_, &bias_, &tone_db_, &output_db_, &mix_, &dc_amount_};
    for (kit::LinearRamp* ramp : ramps) ramp->set_time(kSmoothingSeconds, sr);
    for (int c = 0; c < 2; ++c) {
      delay_[c].clear();
      tilt_[c].reset();
    }
    for (Lane& lane : lanes_) {
      for (Lane::Channel& channel : lane.channel) {
        channel.outer.init();
        channel.inner.init(kInnerBeta);
      }
    }
    fade_length_ = static_cast<int>(kFadeSeconds * sr);
    if (fade_length_ < 1) fade_length_ = 1;
    warm_up_length_ = static_cast<int>(kWarmUpSeconds * sr);
    if (warm_up_length_ < 2 * kLatency) warm_up_length_ = 2 * kLatency;
    // The longest silent gap is the latency, under a millisecond.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    settle(wanted());
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
    const Setup want = wanted();
    // Nothing is sounding, so whatever changed while asleep applies at once.
    if (was_asleep) settle(want);

    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      advance_ramps();
      const float bias = bias_.value;
      const float wet = mix_.value;

      if (phase_ == kSteady && !(lanes_[active_].setup == want)) {
        configure(lanes_[1 - active_], want, &lanes_[active_]);
        phase_ = kWarmUp;
        countdown_ = warm_up_length_;
      }
      const float fade =
          phase_ == kFade ? static_cast<float>(fade_position_) / static_cast<float>(fade_length_) : 0.0f;

      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float delayed = delay_[c].read(kLatency);
        const float early = delay_[c].read(kLatency - kit::Halfband2x::kLatency);
        delay_[c].write(in[c]);

        float y = run(lanes_[active_], c, in[c], early, delayed, bias);
        if (phase_ != kSteady) {
          const float incoming = run(lanes_[1 - active_], c, in[c], early, delayed, bias);
          y += (incoming - y) * fade;
        }
        y = tilt_[c].process(y);
        y *= output_gain_;
        out[c] = delayed + (y - delayed) * wet;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];

      if (phase_ == kWarmUp) {
        if (--countdown_ <= 0) {
          phase_ = kFade;
          fade_position_ = 0;
        }
      } else if (phase_ == kFade) {
        if (++fade_position_ >= fade_length_) {
          active_ = 1 - active_;
          phase_ = kSteady;
        }
      }
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr float kCeiling = 1.0f;
  static constexpr float kMaxDriveDb = 36.0f;
  static constexpr float kTonePivotHz = 1000.0f;
  static constexpr float kTapeCutoffMaxHz = 16000.0f;
  static constexpr float kTapeCutoffMinHz = 6000.0f;
  // Kaiser beta of the 31-tap second stage: -98 dB from 0.355 of its rate.
  static constexpr double kInnerBeta = 10.0;
  static constexpr float kFadeSeconds = 0.010f;
  static constexpr float kWarmUpSeconds = 0.002f;
  static constexpr int kTape = static_cast<int>(tatami::dsp::shapers::Curve::Tape);

  enum Phase : int { kSteady = 0, kWarmUp, kFade };

  // The three choices that cannot be ramped.
  struct Setup {
    int factor = 2;   // 0, 1, 2: 1x, 2x, 4x
    int curve = 0;
    bool adaa = false;
    bool operator==(const Setup& other) const {
      return factor == other.factor && curve == other.curve && adaa == other.adaa;
    }
  };

  // One complete shaper for both channels. Two exist so a new setup can be
  // crossfaded in.
  struct Lane {
    struct Channel {
      kit::Halfband2x outer;
      saturator_dsp::Halfband<8> inner;
      float held = 0.0f;
      tatami::dsp::Adaa1<tatami::dsp::shapers::Soft> soft;
      tatami::dsp::Adaa1<tatami::dsp::shapers::Hard> hard;
      tatami::dsp::DcBlocker dc;   // at the lane's rate
      tatami::dsp::OnePoleLowpass tape;
    };
    Setup setup;
    float offset = 0.0f;   // curve(bias): what the curve gives for silence
    Channel channel[2];
  };

  // Out of line on purpose: the signal path and `Lane::offset` must come
  // from the same machine code, or silence could differ from the offset by
  // a rounding step and never cancel.
#if defined(__GNUC__) || defined(__clang__)
  __attribute__((noinline))
#endif
  static float curve_value(int curve, float x) {
    return tatami::dsp::shapers::shape(tatami::dsp::shapers::curveFromIndex(curve), x);
  }

  Setup wanted() const {
    using namespace saturator;
    Setup setup;
    setup.factor = kit::clamp_int(static_cast<int>(param(kOversample) + 0.5f), 0, 2);
    setup.curve = kit::clamp_int(static_cast<int>(param(kCurve) + 0.5f), 0, tatami::dsp::shapers::kNumCurves - 1);
    // ADAA exists for the two curves with a closed-form antiderivative.
    setup.adaa = param(kAdaa) >= 0.5f && setup.curve <= 1;
    return setup;
  }

  void apply(int id) {
    using namespace saturator;
    const float value = param(id);
    switch (id) {
      case kDriveDb:
        drive_db_.set(value, primed());
        break;
      case kBias:
        bias_.set(value, primed());
        break;
      case kToneDb:
        tone_db_.set(value, primed());
        break;
      case kOutputDb:
        output_db_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      case kDcBlock:
        dc_amount_.set(value >= 0.5f ? 1.0f : 0.0f, primed());
        break;
      default:
        break;  // curve, oversampling and ADAA are read as a Setup in process()
    }
  }

  // Jump to the current targets with clean shaper state. Only called when
  // the signal path is empty (init, waking from sleep).
  void settle(const Setup& want) {
    kit::LinearRamp* ramps[] = {&drive_db_, &bias_, &tone_db_, &output_db_, &mix_, &dc_amount_};
    for (kit::LinearRamp* ramp : ramps) ramp->snap(ramp->target);
    active_ = 0;
    phase_ = kSteady;
    countdown_ = 0;
    fade_position_ = 0;
    set_drive(drive_db_.value);
    set_tone(tone_db_.value);
    set_output(output_db_.value);
    last_bias_ = bias_.value;
    configure(lanes_[0], want, nullptr);
    configure(lanes_[1], want, nullptr);
  }

  // `from` is the lane this one is about to take over from, if any: its DC
  // estimate is the best start for this one's (two milliseconds of warm-up
  // are nothing to a 10 Hz filter).
  void configure(Lane& lane, const Setup& setup, const Lane* from) {
    lane.setup = setup;
    lane.offset = curve_value(setup.curve, last_bias_);
    for (int c = 0; c < 2; ++c) {
      Lane::Channel& channel = lane.channel[c];
      channel.outer.reset();
      channel.inner.reset();
      channel.held = 0.0f;
      channel.dc.prepare(static_cast<double>(sample_rate()) * static_cast<double>(1 << setup.factor));
      channel.dc.state = from != nullptr ? from->channel[c].dc.state : 0.0;
      channel.tape.reset();
      // ADAA averages the curve between consecutive inputs; start it resting
      // on the bias so its first output is the offset, not a jump from zero.
      channel.soft.reset();
      channel.hard.reset();
      channel.soft.process(last_bias_);
      channel.hard.process(last_bias_);
    }
  }

  void set_drive(float db) {
    last_drive_db_ = db;
    gain_ = kit::db_to_gain(db);
    const float cutoff = kTapeCutoffMaxHz * std::pow(kTapeCutoffMinHz / kTapeCutoffMaxHz, db / kMaxDriveDb);
    for (Lane& lane : lanes_) {
      for (Lane::Channel& channel : lane.channel) channel.tape.setCutoff(cutoff, sample_rate());
    }
  }

  void set_tone(float db) {
    last_tone_db_ = db;
    for (tatami::dsp::TiltFilter& tilt : tilt_) tilt.set(db, kTonePivotHz, sample_rate());
  }

  void set_output(float db) {
    last_output_db_ = db;
    output_gain_ = kit::db_to_gain(db);
  }

  // One step of every ramp; what hangs off a ramp is recomputed only while
  // it moves.
  void advance_ramps() {
    const float drive_db = drive_db_.next();
    if (drive_db != last_drive_db_) set_drive(drive_db);
    const float bias = bias_.next();
    if (bias != last_bias_) {
      last_bias_ = bias;
      for (Lane& lane : lanes_) lane.offset = curve_value(lane.setup.curve, bias);
    }
    const float tone_db = tone_db_.next();
    if (tone_db != last_tone_db_) set_tone(tone_db);
    const float output_db = output_db_.next();
    if (output_db != last_output_db_) set_output(output_db);
    mix_.next();
    dc_amount_.next();
  }

  // The curve at the lane's rate, less what it gives for silence, with its
  // DC taken off under the ceiling.
  float shaped(Lane& lane, Lane::Channel& channel, float u, float bias) {
    const float v = u + bias;
    const float y = (lane.setup.adaa
                         ? (lane.setup.curve == 0 ? channel.soft.process(v) : channel.hard.process(v))
                         : curve_value(lane.setup.curve, v)) -
                    lane.offset;
    const float dc = dc_amount_.value;
    // With DC Block on the ceiling is full scale; with it off, the range the
    // bias moved the curve to.
    const float shift = (1.0f - dc) * lane.offset;
    return kit::clamp(y - dc * channel.dc.lowpassBounded(y, kCeiling), -kCeiling - shift, kCeiling - shift);
  }

  // One base-rate sample through a lane. `now`, `early` and `delayed` are the
  // input 0, 8 and 39 samples ago: each path picks the one that makes its
  // total 39.
  float run(Lane& lane, int c, float now, float early, float delayed, float bias) {
    Lane::Channel& channel = lane.channel[c];
    float y;
    if (lane.setup.factor == 0) {
      y = shaped(lane, channel, gain_ * delayed, bias);
    } else if (lane.setup.factor == 1) {
      float a, b;
      channel.outer.up(gain_ * early, &a, &b);
      a = shaped(lane, channel, a, bias);
      b = shaped(lane, channel, b, bias);
      y = channel.outer.down(a, b);
    } else {
      float a, b;
      channel.outer.up(gain_ * now, &a, &b);
      // The inner stage takes 15 samples at the 2x rate; one more makes that
      // a whole number of base-rate samples.
      const float pair[2] = {channel.held, a};
      channel.held = b;
      float back[2];
      for (int k = 0; k < 2; ++k) {
        float p, q;
        channel.inner.up(pair[k], &p, &q);
        p = shaped(lane, channel, p, bias);
        q = shaped(lane, channel, q, bias);
        back[k] = channel.inner.down(p, q);
      }
      y = channel.outer.down(back[0], back[1]);
    }
    // The source runs this high cut after the tone tilt; the filters are
    // linear, so here, per lane, it gives the same response and a curve
    // change can crossfade it.
    return lane.setup.curve == kTape ? channel.tape.process(y) : y;
  }

  kit::DelayLine<64> delay_[2];
  Lane lanes_[2];
  tatami::dsp::TiltFilter tilt_[2];
  kit::LinearRamp drive_db_, bias_, tone_db_, output_db_, mix_, dc_amount_;
  kit::IdleGate idle_;
  float gain_ = 1.0f;
  float output_gain_ = 1.0f;
  float last_drive_db_ = 0.0f;
  float last_bias_ = 0.0f;
  float last_tone_db_ = 0.0f;
  float last_output_db_ = 0.0f;
  int active_ = 0;
  int phase_ = kSteady;
  int countdown_ = 0;
  int fade_position_ = 0;
  int fade_length_ = 480;
  int warm_up_length_ = 96;
};

}  // namespace livemix
