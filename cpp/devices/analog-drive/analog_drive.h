#pragma once

// Analog Drive: a sound pushed through one of five circuits.
//
//   in ─┬─► low cut ─► Thump ─► [ circuit: emphasis ─► × drive ─► 4x up ─► curve ─► 4x down ─►
//       │                                  de-emphasis ─► DC block ─► × make-up ] ─► Tone ─►
//       │                                  high cut ─► × Output ─┐
//       └─► delay 39 ──────────────────────────────────── dry ─► Mix ─► out
//
// - A circuit (circuits.h) is an emphasis filter into a curve and a
//   de-emphasis filter out of it. What the emphasis lifts saturates first:
//   the tape preamp's treble, the console's upper mids, the transformer's
//   lows (its curve sees a low-shelved, flux-like copy of the signal). The
//   de-emphasis is the inverse or nearly, so a quiet signal passes close to
//   flat and each circuit keeps a small voicing of its own.
// - The curve (curve.h) is a sum of three kernels, soft, firm and hard,
//   weighted per circuit, at a working point that sits off centre (even
//   harmonics) and moves: with Drive, with the level arriving at the curve
//   (the triode, whose second harmonic then keeps leading as it is pushed),
//   and the gain into it sags a little under what leaves it (tape preamp,
//   transformer, most of all the pentode). The curve's own value at the
//   working point is taken off again, so silence in is exact silence out.
// - Drive is 0 to +36 dB into the curve, with full scale a quarter of the
//   way to its ceiling at Drive 0; Push is another 20 dB.
// - The curve runs at 4x between two linear-phase halfbands (63 and 31
//   taps) with second-order antiderivative anti-aliasing (adaa.h) on top:
//   a 5 kHz tone squared off completely at 44.1 kHz leaves nothing that is
//   not a harmonic above -90 dBFS below 18 kHz. The round trip is 39
//   samples (31 + 8: the second stage's 15 at 2x plus two at 4x for the
//   anti-aliasing and its compensator), reported as latency; the dry path
//   is delayed to match, so Mix is a linear, phase-aligned crossfade.
// - Auto Gain (gain_table.h) is a static make-up per circuit, Drive and
//   Push, measured on pink noise at -18 dBFS. It moves with Drive sample
//   for sample. Off, the make-up starts at unity and gives back the 12 dB of
//   headroom as Drive rises: louder, up to a ceiling that ends at full scale.
// - Circuit and Push switch by running the new setting beside the old one
//   for 5 ms (to fill its filters) and crossfading over 20 ms.
// - Low Cut and Thump are before the circuit, Tone and High Cut after it.
//   Each is skipped while it is out of the path (Low Cut and High Cut fade
//   out over the last part of their travel, so both ends are a clean bypass).

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
        channel.outer.init(kOuterBeta);
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
      if (!drive_.settled()) {
        // The make-up moves with the gain it answers, sample for sample, so
        // a jump in Drive passes through the calibrated levels in between
        // instead of arriving before its make-up does.
        set_gain(drive_.next());
        for (Lane& lane : lanes_) {
          lane.makeup.snap(kit::db_to_gain(makeup_db(lane, drive_.value, auto_gain_.value)));
        }
        makeup_drive_ = drive_.value;
      }
      const float output = output_.next();
      const float mix = mix_.next();

      const Setup want = wanted();
      if (phase_ == kSteady && !(lanes_[active_].setup == want)) {
        configure(lanes_[1 - active_], want, &lanes_[active_]);
        phase_ = kWarmUp;
        countdown_ = warm_up_length_;
      }

      // While both sides have carried the same signal since the path was
      // last empty, the right is the left: one channel is worked out and
      // copied. The first frame that differs gives the right its own copy
      // of every state, and from there both run.
      if (mono_ && in[0] != in[1]) split();
      const int channels = mono_ ? 1 : 2;

      float dry[2], pre[2];
      for (int c = 0; c < channels; ++c) {
        dry[c] = dry_[c].read(kLatency);
        dry_[c].write(in[c]);
        // Each of the four tone-shaping filters is skipped while it is out
        // of the path; it comes back in from rest with its share at zero.
        pre[c] = in[c];
        if (low_cut_on_) pre[c] += (low_cut_filter_[c].process(in[c]) - in[c]) * low_cut_amount_;
        if (thump_on_) pre[c] = thump_filter_[c].process(pre[c]);
      }

      float wet[2];
      run(lanes_[active_], pre, wet, channels);
      if (phase_ != kSteady) {
        float incoming[2];
        run(lanes_[1 - active_], pre, incoming, channels);
        const float fade =
            phase_ == kFade ? static_cast<float>(fade_position_) / static_cast<float>(fade_length_) : 0.0f;
        for (int c = 0; c < channels; ++c) wet[c] += (incoming[c] - wet[c]) * fade;
        if (phase_ == kWarmUp) {
          if (--countdown_ <= 0) {
            phase_ = kFade;
            fade_position_ = 0;
          }
        } else if (++fade_position_ >= fade_length_) {
          active_ = 1 - active_;
          phase_ = kSteady;
          for (Lane::Channel& channel : lanes_[active_].channel) channel.dc.set_cutoff(kDcHz, sample_rate());
        }
      }

      for (int c = 0; c < channels; ++c) {
        float y = wet[c];
        if (tone_on_) y = tilt_[c].process(y);
        if (high_cut_on_) {
          const float cut = high_cut_filter_[c][1].process(high_cut_filter_[c][0].process(y));
          y = cut + (y - cut) * high_cut_open_;
        }
        wet[c] = dry[c] + (y * output - dry[c]) * mix;
      }
      out_left_[i] = wet[0];
      out_right_[i] = mono_ ? wet[0] : wet[1];
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
  static constexpr float kDcFastHz = 40.0f;
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
  // Kaiser betas of the two halfbands. The 63-tap first stage is flat to
  // 0.42 of the sample rate and 80 dB down from 0.58 (the response of
  // kit::Halfband2x, in halfband.h's cheaper structure); the 31-tap second
  // stage is 98 dB down from 0.355 of its rate.
  static constexpr double kOuterBeta = 8.0;
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
      analog_drive_dsp::Halfband<16> outer;   // 63 taps: 1x to 2x and back
      analog_drive_dsp::Halfband<8> inner;    // 31 taps: 2x to 4x and back
      analog_drive_dsp::Adaa2 adaa;
      analog_drive_dsp::Compensator compensator;
      analog_drive_dsp::DcBlock dc;
    };
    Setup setup;
    const analog_drive_dsp::Circuit* spec = nullptr;
    float push_gain = 1.0f;
    float envelope = 0.0f;   // of what leaves the curve, both channels
    float arriving = 0.0f;   // and of what goes into it
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
    mono_ = true;
    active_ = 0;
    phase_ = kSteady;
    countdown_ = 0;
    fade_position_ = 0;
    clock_.reset(kControlPeriod);
    filters_dirty_ = true;
    low_cut_on_ = thump_on_ = tone_on_ = high_cut_on_ = false;
    makeup_drive_ = -1.0f;
    const Setup want = wanted();
    configure(lanes_[0], want, nullptr);
    configure(lanes_[1], want, nullptr);
  }

  static void set_eq(kit::Biquad& filter, const analog_drive_dsp::Eq& eq, float sample_rate) {
    using analog_drive_dsp::Eq;
    switch (eq.kind) {
      case Eq::kLowShelf:
        filter.set_low_shelf(eq.hz, eq.gain_db, sample_rate);
        break;
      case Eq::kHighShelf:
        filter.set_high_shelf(eq.hz, eq.gain_db, sample_rate);
        break;
      case Eq::kPeak:
        filter.set_peak(eq.hz, eq.q, eq.gain_db, sample_rate);
        break;
      default:
        filter.set_identity();
        break;
    }
    filter.reset();
  }

  // Where the signal sits on the lane's curve for its envelope and a Drive.
  static float working_point(const Lane& lane, float drive) {
    const analog_drive_dsp::Circuit& spec = *lane.spec;
    return spec.bias + spec.bias_drive * drive +
           spec.bias_level * lane.arriving / (lane.arriving + spec.bias_knee);
  }

  // The right channel takes a copy of everything the left has been through.
  void split() {
    mono_ = false;
    dry_[1] = dry_[0];
    low_cut_filter_[1] = low_cut_filter_[0];
    thump_filter_[1] = thump_filter_[0];
    high_cut_filter_[1][0] = high_cut_filter_[0][0];
    high_cut_filter_[1][1] = high_cut_filter_[0][1];
    tilt_[1] = tilt_[0];
    for (Lane& lane : lanes_) lane.channel[1] = lane.channel[0];
  }

  // `from` is the lane this one is about to take over from, if any: the new
  // one starts from its envelope, and finds its own DC quickly while it is
  // still faded out.
  void configure(Lane& lane, const Setup& setup, const Lane* from) {
    const float sr = sample_rate();
    lane.setup = setup;
    lane.spec = &analog_drive_dsp::circuit(setup.circuit);
    lane.push_gain = setup.push ? kPushGain : 1.0f;
    lane.attack = 1.0f - kit::time_to_coeff(lane.spec->attack_seconds, sr);
    lane.release = 1.0f - kit::time_to_coeff(lane.spec->release_seconds, sr);
    lane.envelope = from != nullptr ? from->envelope : 0.0f;
    lane.arriving = from != nullptr ? from->arriving * lane.push_gain / from->push_gain : 0.0f;
    lane.bias = working_point(lane, drive_.value);
    lane.offset = lane.spec->curve.f(static_cast<double>(lane.bias));
    lane.makeup.snap(kit::db_to_gain(makeup_db(lane, drive_.value, auto_gain_.value)));
    for (Lane::Channel& channel : lane.channel) {
      for (int k = 0; k < analog_drive_dsp::kMaxPre; ++k) set_eq(channel.pre[k], lane.spec->pre[k], sr);
      for (int k = 0; k < analog_drive_dsp::kMaxPost; ++k) set_eq(channel.post[k], lane.spec->post[k], sr);
      channel.outer.reset();
      channel.inner.reset();
      channel.adaa.reset(lane.spec->curve, static_cast<double>(lane.bias));
      channel.compensator.reset();
      channel.dc.reset();
      channel.dc.set_cutoff(from != nullptr ? kDcFastHz : kDcHz, sr);
    }
  }

  // The make-up after a lane's circuit, in dB. With Auto Gain on it is the
  // measured table; off, it starts where the table does at Drive 0 and gives
  // back the headroom as Drive rises, so the sound gets louder up to a
  // ceiling that ends at full scale. Push is compensated either way.
  static float makeup_db(const Lane& lane, float drive, float auto_gain) {
#ifdef LIVEMIX_ANALOG_DRIVE_RAW_MAKEUP
    (void)lane, (void)drive, (void)auto_gain;
    return -kHeadroomDb;
#else
    using namespace analog_drive_dsp;
    const float position = kit::clamp(drive, 0.0f, 1.0f) * static_cast<float>(kGainPoints - 1);
    const int index = kit::clamp_int(static_cast<int>(position), 0, kGainPoints - 2);
    const float fraction = position - static_cast<float>(index);
    const float (*table)[kGainPoints] = kMakeupDb[lane.setup.circuit];
    const float plain = kit::lerp(table[0][index], table[0][index + 1], fraction);
    const float pushed = kit::lerp(table[1][index], table[1][index + 1], fraction);
    const float on = lane.setup.push ? pushed : plain;
    const float off = table[0][0] + kHeadroomDb * drive + (lane.setup.push ? pushed - plain : 0.0f);
    return kit::lerp(off, on, auto_gain);
#endif
  }

  // Every kControlPeriod samples: glide the filters and follow Drive with
  // the make-up.
  void control() {
    const float sr = sample_rate();
    const bool moving =
        !low_cut_.settled() || !thump_.settled() || !tone_.settled() || !high_cut_.settled();
    if (moving || filters_dirty_) {
      filters_dirty_ = false;
      const float low_hz = std::exp(low_cut_.next());
      const float thump = thump_.next();
      const float tone = tone_.next();
      const float high_hz = std::exp(high_cut_.next());
      // (A hair of margin, so the ends of the travel land on 0 and 1
      // whatever the logarithms round to.)
      low_cut_amount_ = kit::clamp(
          1.01f * std::log(low_hz / kLowCutOutHz) / std::log(kLowCutInHz / kLowCutOutHz) - 0.01f, 0.0f, 1.0f);
      high_cut_open_ = kit::clamp(
          1.01f * std::log(high_hz / kHighCutInHz) / std::log(kHighCutOutHz / kHighCutInHz), 0.0f, 1.0f);
      const float thump_hz = kit::max(kThumpFloorHz, kThumpRatio * low_hz);
      const bool low_cut_on = low_cut_amount_ > 0.0f;
      const bool thump_on = thump > 0.0f;
      const bool tone_on = tone != 0.0f;
      const bool high_cut_on = high_cut_open_ < 1.0f;
      for (int c = 0; c < 2; ++c) {
        if (low_cut_on && !low_cut_on_) low_cut_filter_[c].reset();
        if (thump_on && !thump_on_) thump_filter_[c].reset();
        if (tone_on && !tone_on_) tilt_[c].reset();
        if (high_cut_on && !high_cut_on_) {
          high_cut_filter_[c][0].reset();
          high_cut_filter_[c][1].reset();
        }
        low_cut_filter_[c].set_highpass(low_hz, kit::kSqrtHalf, sr);
        thump_filter_[c].set_bell(thump_hz, kThumpQ, kThumpDb * thump, sr);
        tilt_[c].set(kToneDb * tone, kTonePivotHz, sr);
        // Fourth-order Butterworth as two sections.
        high_cut_filter_[c][0].set_lowpass(high_hz, 0.54119610f, sr);
        high_cut_filter_[c][1].set_lowpass(high_hz, 1.30656296f, sr);
      }
      low_cut_on_ = low_cut_on;
      thump_on_ = thump_on;
      tone_on_ = tone_on;
      high_cut_on_ = high_cut_on;
    }
    const float auto_gain = auto_gain_.next();
    if (drive_.value != makeup_drive_ || auto_gain != makeup_auto_ || phase_ != kSteady) {
      makeup_drive_ = drive_.value;
      makeup_auto_ = auto_gain;
      for (Lane& lane : lanes_) {
        lane.makeup.set_target(kit::db_to_gain(makeup_db(lane, makeup_drive_, auto_gain)));
      }
    }
  }

  // One frame of both channels through a lane's circuit, at four times the
  // rate inside. The working point and the gain move with the lane's
  // envelope, which is taken from what left the curve on the frame before.
  void run(Lane& lane, const float* pre, float* out, int channels) {
    using namespace analog_drive_dsp;
    const Circuit& spec = *lane.spec;
    const float bias = working_point(lane, drive_.value);
    const double offset = bias == lane.bias ? lane.offset : spec.curve.f(static_cast<double>(bias));
    const float gain = gain_ * lane.push_gain / (1.0f + spec.sag * lane.envelope);
    const float bias_step = 0.25f * (bias - lane.bias);
    const double offset_step = 0.25 * (offset - lane.offset);
    const float makeup = lane.makeup.next();
    float level = 0.0f;
    float arriving = 0.0f;
    for (int c = 0; c < channels; ++c) {
      Lane::Channel& channel = lane.channel[c];
      float x = pre[c];
      for (int k = 0; k < kMaxPre; ++k) {
        if (spec.pre[k].kind != Eq::kNone) x = channel.pre[k].process(x);
      }
      x *= gain;
      const float size = std::fabs(x);
      if (size > arriving) arriving = size;
      float pair[2], back[2];
      channel.outer.up(x, &pair[0], &pair[1]);
      float b = lane.bias;
      double o = lane.offset;
      for (int k = 0; k < 2; ++k) {
        float sub[2];
        channel.inner.up(pair[k], &sub[0], &sub[1]);
        for (int j = 0; j < 2; ++j) {
          // The working point glides across the four samples of the frame.
          // Its own value on the curve is taken off again, so the bias adds
          // asymmetry and no DC: silence in is exact silence out.
          // (The anti-aliasing answers one sample late, so the value taken
          // off is the one for the sample before.)
          b += bias_step;
          const double shaped = channel.adaa.process(spec.curve, static_cast<double>(sub[j] + b)) - o;
          o += offset_step;
          sub[j] = channel.compensator.process(static_cast<float>(shaped));
        }
        back[k] = channel.inner.down(sub[0], sub[1]);
      }
      float y = channel.outer.down(back[0], back[1]);
      const float magnitude = std::fabs(y);
      if (magnitude > level) level = magnitude;
      for (int k = 0; k < kMaxPost; ++k) {
        if (spec.post[k].kind != Eq::kNone) y = channel.post[k].process(y);
      }
      out[c] = channel.dc.process(y) * makeup;
    }
    lane.bias = bias;
    lane.offset = offset;
    lane.envelope =
        flush_denormal(lane.envelope + (level > lane.envelope ? lane.attack : lane.release) * (level - lane.envelope));
    lane.arriving = flush_denormal(lane.arriving +
                                   (arriving > lane.arriving ? lane.attack : lane.release) * (arriving - lane.arriving));
  }

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
  bool mono_ = true;
  bool low_cut_on_ = false;
  bool thump_on_ = false;
  bool tone_on_ = false;
  bool high_cut_on_ = false;
  int active_ = 0;
  int phase_ = kSteady;
  int countdown_ = 0;
  int fade_position_ = 0;
  int fade_length_ = 960;
  int warm_up_length_ = 240;
};

}  // namespace livemix
