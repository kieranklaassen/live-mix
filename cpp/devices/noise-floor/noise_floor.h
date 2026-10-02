#pragma once

// Noise Floor: the sound of the medium, added under whatever is playing.
//
//   in ─────────────────────────────────────────────────────────────(+)─► out
//    │                                                                ▲
//    ├─► level follower (Response) ─► follow law (Follow) ──┐         │
//    │                                                      ▼         │
//    └─► is anything playing? ─► hold, then fade ─────────► × ─► soft clip
//                                                           ▲
//   bed (Type, cross-faded) ─► tilt (Tone) ─► width ─► × Level, drift (Movement)
//
// - The dry signal is never touched: the output is the input plus the noise.
// - Seven beds (noise_beds.h): tape hiss, vinyl, room, hum at 50 and 60 Hz,
//   static, air. Each measures the same RMS at rest, so Level reads the
//   noise's level in dBFS for every type. A change of Type cross-fades the
//   old bed into the new one over 150 ms at constant power.
// - Follow: at 0 the noise is constant. Towards +1 it is scaled by the
//   input's level (at +1 it is at Level when the input peaks at -12 dBFS,
//   never more than 6 dB above it, and gone in silence). Towards -1 it ducks
//   under the input by 1 / (1 + 4·level) and comes back up in the gaps, as
//   the automatic level of a cheap recorder does. The follower rises in a
//   tenth of Response and falls in Response.
// - Tone tilts the bed around a pivot of its own (first order, ±9 dB) and a
//   table per type takes the change of loudness back out, so Tone changes
//   the colour and not the level. For hum it is the balance of body and buzz.
// - Movement: a slow drift of level (±2.5 dB) and tone shared by both sides,
//   and whatever is unsteady in the chosen bed.
// - An idle device is silent, so the noise only runs while something is
//   playing: it carries on for Hold after the input stops, fades over half a
//   second, and the device sleeps. It fades back in over 40 ms.
// - The noise path ends in a soft clip, so at the loudest settings a crackle
//   or a crash cannot exceed full scale by itself.

#include "../../kit/kit.h"
#include "noise_beds.h"
#include "params.gen.h"

namespace livemix {

class NoiseFloor : public kit::DeviceBase<noise_floor::kNumParams> {
 public:
  enum Type : int { kTape = 0, kVinyl, kRoom, kHum50, kHum60, kStatic, kAir, kTypes };

  void init(float sample_rate) {
    using namespace noise_floor;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tables_.init();
    tape_.init(sr, 0);
    vinyl_.init(sr, 10);
    room_.init(sr, 20);
    hum_[0].init(sr, 30, 50.0f);
    hum_[1].init(sr, 40, 60.0f);
    static_.init(sr, 50);
    air_.init(sr, 60);
    for (int t = 0; t < kTypes; ++t) {
      for (int c = 0; c < 2; ++c) {
        tilt_[t][c].reset();
        tilt_[t][c].set_cutoff(kPivotHz[t], sr);
      }
      fade_[t] = 0.0f;
      amp_[t] = 0.0f;
      comp_[t].set_time(kSmoothingSeconds, sr);
      comp_[t].snap(1.0f);
    }
    type_ = kit::clamp_int(static_cast<int>(param(kType) + 0.5f), 0, kTypes - 1);
    fade_step_ = 1.0f / (kTypeFadeSeconds * sr);

    level_.set_time(kSmoothingSeconds, sr);
    follow_.set_time(kSmoothingSeconds, sr);
    mid_.set_time(kSmoothingSeconds, sr);
    side_.set_time(kSmoothingSeconds, sr);
    drift_gain_.set_time(kSmoothingSeconds, sr);
    tilt_low_.set_time(kSmoothingSeconds, sr);
    tilt_high_.set_time(kSmoothingSeconds, sr);
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    tone_.set_time(0.03f, control_rate);
    movement_.set_time(0.03f, control_rate);
    level_drift_.seed(noise_beds::seed_for(70));
    level_drift_.set_rate(0.09f, sr);
    tone_drift_.seed(noise_beds::seed_for(71));
    tone_drift_.set_rate(0.06f, sr);

    envelope_ = 0.0f;
    smooth_envelope_ = 0.0f;
    response_ = -1.0f;
    attack_ = release_ = settle_ = 0.0f;
    gate_ = 0.0f;
    gate_rise_ = 1.0f / (kGateRiseSeconds * sr);
    gate_fall_ = 1.0f / (kGateFallSeconds * sr);
    quiet_ = kNever;
    hold_samples_ = 1;
    started_ = false;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.02f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    // Awake while there is input and until the noise has faded behind it.
    if (!idle_.wake(input_present(frames) || gate_ > 0.0f)) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) control();

      const float left = in[0] < 0.0f ? -in[0] : in[0];
      const float right = in[1] < 0.0f ? -in[1] : in[1];
      const float magnitude = left > right ? left : right;

      // Is anything playing? The noise runs while it is and for Hold after.
      if (magnitude > kQuiet) {
        quiet_ = 0;
      } else if (quiet_ < kNever) {
        ++quiet_;
      }
      if (quiet_ < hold_samples_) {
        // Coming back from silence there is no old bed to fade from.
        if (gate_ <= 0.0f) snap_types();
        gate_ = kit::min(1.0f, gate_ + gate_rise_);
      } else {
        gate_ = kit::max(0.0f, gate_ - gate_fall_);
      }

      // The input's level, for Follow: a fast rise, a fall in Response, and
      // a second short pole that takes the ripple of low notes out.
      const float coeff = magnitude > envelope_ ? attack_ : release_;
      envelope_ = flush_denormal(magnitude + (envelope_ - magnitude) * coeff);
      smooth_envelope_ = flush_denormal(envelope_ + (smooth_envelope_ - envelope_) * settle_);
      const float loud = smooth_envelope_ * (1.0f / kReference);
      const float follow = follow_.next();
      float follow_gain = 1.0f;
      if (follow > 0.0f) {
        follow_gain += follow * (2.0f * kit::fast_tanh(0.5f * loud) - 1.0f);
      } else if (follow < 0.0f) {
        follow_gain -= follow * (1.0f / (1.0f + kDuck * loud) - 1.0f);
      }

      const float tilt_low = tilt_low_.next();
      const float tilt_high = tilt_high_.next();
      float bed[2] = {0.0f, 0.0f};
      if (gate_ > 0.0f) {
        for (int t = 0; t < kTypes; ++t) {
          const float target = t == type_ ? 1.0f : 0.0f;
          if (fade_[t] != target) {
            fade_[t] = target > fade_[t] ? kit::min(1.0f, fade_[t] + fade_step_)
                                         : kit::max(0.0f, fade_[t] - fade_step_);
            amp_[t] = kit::SineTable::lookup(0.25f * fade_[t]);  // constant power
          }
          if (fade_[t] <= 0.0f) continue;
          float out[2];
          render_bed(t, in, out);
          const float gain = amp_[t] * comp_[t].next();
          if (t == kHum50 || t == kHum60) {
            bed[0] += out[0] * gain;
            bed[1] += out[1] * gain;
          } else {
            for (int c = 0; c < 2; ++c) {
              const float low = tilt_[t][c].lowpass(out[c]);
              bed[c] += (low * tilt_low + (out[c] - low) * tilt_high) * gain;
            }
          }
        }
      }

      // The fade behind the last note is a smooth step, level at both ends.
      const float shape = gate_ * gate_ * (3.0f - 2.0f * gate_);
      const float gain = level_.next() * drift_gain_.next() * follow_gain * shape;
      const float mid = (bed[0] + bed[1]) * 0.5f * mid_.next();
      const float side = (bed[0] - bed[1]) * 0.5f * side_.next();
      out_left_[i] = in[0] + kit::soft_clip((mid + side) * gain);
      out_right_[i] = in[1] + kit::soft_clip((mid - side) * gain);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 32;
  static constexpr long kNever = 1L << 30;
  static constexpr float kTypeFadeSeconds = 0.15f;
  static constexpr float kGateRiseSeconds = 0.04f;
  static constexpr float kGateFallSeconds = 0.5f;
  static constexpr float kQuiet = 1.0e-6f;      // -120 dBFS: below this nothing is playing
  static constexpr float kReference = 0.25f;    // the input level Follow calls "loud": -12 dBFS
  static constexpr float kDuck = 4.0f;
  static constexpr float kTiltDb = 9.0f;
  static constexpr float kLevelDriftDb = 2.5f;
  static constexpr float kToneDrift = 0.3f;
  // Where each bed's tilt pivots (hum has no tilt: Tone is its buzz).
  static constexpr float kPivotHz[kTypes] = {2500.0f, 1500.0f, 150.0f, 300.0f, 300.0f, 1200.0f, 8000.0f};
  // The change of level, in dB, that the tilt makes at Tone -1, -0.5, 0, 0.5
  // and 1, by measurement; it is taken back out.
  static constexpr float kToneLevelDb[kTypes][5] = {
      {0.0f, 0.0f, 0.0f, 0.0f, 0.0f}, {0.0f, 0.0f, 0.0f, 0.0f, 0.0f}, {0.0f, 0.0f, 0.0f, 0.0f, 0.0f},
      {0.0f, 0.0f, 0.0f, 0.0f, 0.0f}, {0.0f, 0.0f, 0.0f, 0.0f, 0.0f}, {0.0f, 0.0f, 0.0f, 0.0f, 0.0f},
      {0.0f, 0.0f, 0.0f, 0.0f, 0.0f},
  };

  void snap_types() {
    for (int t = 0; t < kTypes; ++t) {
      fade_[t] = t == type_ ? 1.0f : 0.0f;
      amp_[t] = fade_[t];
    }
  }

  void render_bed(int type, const float* in, float* out) {
    switch (type) {
      case kTape:
        tape_.render(in, out);
        break;
      case kVinyl:
        vinyl_.render(in, out);
        break;
      case kRoom:
        room_.render(in, out);
        break;
      case kHum50:
        hum_[0].render(tables_, out);
        break;
      case kHum60:
        hum_[1].render(tables_, out);
        break;
      case kStatic:
        static_.render(in, out);
        break;
      default:
        air_.render(in, out);
        break;
    }
  }

  // The level the tilt adds at `tone`, in dB, between the measured points.
  static float tone_level_db(int type, float tone) {
    const float at = (kit::clamp(tone, -1.0f, 1.0f) + 1.0f) * 2.0f;
    const int index = kit::clamp_int(static_cast<int>(at), 0, 3);
    return kit::lerp(kToneLevelDb[type][index], kToneLevelDb[type][index + 1],
                     at - static_cast<float>(index));
  }

  // Every 32 samples: everything derived from the controls, the slow drifts,
  // and the control step of each bed that is sounding.
  void control() {
    using namespace noise_floor;
    const float sr = sample_rate();
    const float tone = tone_.next();
    const float movement = movement_.next();

    const float response = param(kResponse);
    if (response != response_) {
      response_ = response;
      attack_ = kit::time_to_coeff(kit::max(0.002f, 0.1f * response), sr);
      release_ = kit::time_to_coeff(response, sr);
      settle_ = kit::time_to_coeff(0.1f * response, sr);
    }
    hold_samples_ = static_cast<long>(param(kHold) * sr);

    const float level_wander = movement * level_drift_.next(kControlPeriod);
    const float tone_now =
        kit::clamp(tone + kToneDrift * movement * tone_drift_.next(kControlPeriod), -1.0f, 1.0f);
    if (level_wander != level_wander_ || !started_) {
      level_wander_ = level_wander;
      drift_gain_.set(kit::db_to_gain(kLevelDriftDb * level_wander), started_);
    }
    const bool tone_moved = tone_now != tone_now_ || !started_;
    if (tone_moved) {
      tone_now_ = tone_now;
      tilt_low_.set(kit::db_to_gain(-kTiltDb * tone_now), started_);
      tilt_high_.set(kit::db_to_gain(kTiltDb * tone_now), started_);
    }
    for (int t = 0; t < kTypes; ++t) {
      const bool fresh = fade_[t] <= 0.0f;  // not sounding yet
      if (fresh && t != type_) continue;
      if (tone_moved || fresh) {
        comp_[t].set(kit::db_to_gain(-tone_level_db(t, tone_now)), !fresh);
      }
      switch (t) {
        case kTape:
          tape_.control(movement, kControlPeriod);
          break;
        case kVinyl:
          vinyl_.control(movement, kControlPeriod);
          break;
        case kRoom:
          room_.control(movement, kControlPeriod);
          break;
        case kHum50:
        case kHum60: {
          noise_beds::Hum& hum = hum_[t - kHum50];
          if (fresh) hum.started = false;
          hum.control(tone_now, movement, kControlPeriod);
          break;
        }
        case kStatic:
          static_.control(movement, kControlPeriod);
          break;
        default:
          air_.control(movement, kControlPeriod);
          break;
      }
    }
    started_ = true;
  }

  void apply(int id) {
    using namespace noise_floor;
    const float value = param(id);
    switch (id) {
      case kType:
        type_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, kTypes - 1);
        break;
      case kLevel:
        level_.set(kit::db_to_gain(value), primed());
        break;
      case kFollow:
        follow_.set(value, primed());
        break;
      case kTone:
        tone_.set(value, primed());
        break;
      case kMovement:
        movement_.set(value, primed());
        break;
      case kWidth:
        // Constant power for two unrelated sides.
        mid_.set(std::sqrt(2.0f - value * value), primed());
        side_.set(value, primed());
        break;
      default:
        break;  // Response and Hold are read on the control clock
    }
  }

  noise_beds::HumTables tables_;
  noise_beds::TapeHiss tape_;
  noise_beds::Vinyl vinyl_;
  noise_beds::Room room_;
  noise_beds::Hum hum_[2];
  noise_beds::Static static_;
  noise_beds::Air air_;
  kit::OnePole tilt_[kTypes][2];
  kit::Smoother comp_[kTypes];
  float fade_[kTypes] = {};
  float amp_[kTypes] = {};
  kit::Smoother level_, follow_, mid_, side_, drift_gain_, tilt_low_, tilt_high_;
  kit::Smoother tone_, movement_;  // advanced on the control clock
  kit::Drift level_drift_, tone_drift_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float envelope_ = 0.0f;
  float smooth_envelope_ = 0.0f;
  float response_ = -1.0f;
  float attack_ = 0.0f, release_ = 0.0f, settle_ = 0.0f;
  float gate_ = 0.0f;
  float gate_rise_ = 0.0f, gate_fall_ = 0.0f;
  float fade_step_ = 0.0f;
  float tone_now_ = 0.0f;
  float level_wander_ = 0.0f;
  long quiet_ = kNever;
  long hold_samples_ = 1;
  int type_ = 0;
  bool started_ = false;
};

}  // namespace livemix
