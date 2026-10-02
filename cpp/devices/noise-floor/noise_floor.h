#pragma once

// Noise Floor: the sound of the medium, added under whatever is playing.
//
//   in ─────────────────────────────────────────────────────────────(+)─► out
//    │                                                                ▲
//    ├─► level follower (Response) ─► follow law (Follow) ──┐         │
//    │                                                      ▼         │
//    └─► is anything playing? ─► hold, then fade ─────────► × ─► soft clip
//                                                           ▲
//   bed (Type, cross-faded) ─► filters (Tone) ─► width ─► × Level, drift (Movement)
//
// - The dry signal is never touched: the output is the input plus the noise.
// - Seven beds (noise_beds.h): tape hiss, vinyl, room, hum at 50 and 60 Hz,
//   static, air. Each measures the same RMS at rest, so Level reads the
//   noise's level in dBFS for every type. A change of Type cross-fades the
//   old bed into the new one over 150 ms at constant power.
// - Follow: at 0 the noise is constant. Towards +1 it is scaled by the
//   input's level (at +1 it is at Level when the input peaks at -12 dBFS,
//   never more than 6 dB above it, and gone in silence). Towards -1 it ducks
//   under the input by 1 / (1 + 4·level), level counted in multiples of
//   -12 dBFS, and comes back up in the gaps, as the automatic level of a
//   cheap recorder does. The follower rises in a tenth of Response and
//   falls in Response.
// - Tone: below the middle a low-pass closes over the bed (to a dark
//   frequency of its own: 2.5 kHz for tape hiss, 80 Hz for the room); above
//   it a first-order high-pass thins the bed out from underneath. A table
//   per type takes the change of level back out, so Tone changes the colour
//   and Level still reads the level. For hum it is the balance of body and buzz.
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
        dark_lp_[t][c].reset();
        dark_lp_[t][c].set(kDarkOpenHz[t], kDarkQ, sr);
        thin_lp_[t][c].reset();
        thin_lp_[t][c].set_cutoff(kThinOpenHz[t], sr);
      }
      fade_[t] = 0.0f;
      amp_[t] = 0.0f;
      prepared_[t] = false;
      comp_[t].set_time(kSmoothingSeconds, sr);
      comp_[t].snap(1.0f);
    }
    type_ = kit::clamp_int(static_cast<int>(param(kType) + 0.5f), 0, kTypes - 1);
    fade_step_ = 1.0f / (kTypeFadeSeconds * sr);

    level_.set_time(kSmoothingSeconds, sr);
    follow_.set_time(kSmoothingSeconds, sr);
    mid_.set_time(kSmoothingSeconds, sr);
    side_.set_time(kSmoothingSeconds, sr);
    hum_mid_.set_time(kSmoothingSeconds, sr);
    drift_gain_.set_time(kSmoothingSeconds, sr);
    dark_.set_time(kSmoothingSeconds, sr);
    thin_.set_time(kSmoothingSeconds, sr);
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
      // A sample that is not a number becomes silence and an absurd one is
      // held to kInputLimit, so one bad sample from upstream cannot lodge in
      // the follower. Anything a mix can really hold passes bit for bit.
      for (int c = 0; c < 2; ++c) {
        if (!(in[c] == in[c])) in[c] = 0.0f;
        in[c] = kit::clamp(in[c], -kInputLimit, kInputLimit);
      }
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
        // Coming back from silence there is no old bed to fade from, and
        // whatever level the follower held then is long gone.
        if (gate_ <= 0.0f) {
          snap_types();
          envelope_ = smooth_envelope_ = 0.0f;
        }
        gate_ = kit::min(1.0f, gate_ + gate_rise_);
      } else {
        gate_ = kit::max(0.0f, gate_ - gate_fall_);
      }

      // The input's level, for Follow: a fast rise, a fall in Response, and
      // a second short pole that takes the ripple of low notes out.
      const float heard = kit::min(magnitude, kFollowLimit);
      const float coeff = heard > envelope_ ? attack_ : release_;
      envelope_ = flush_denormal(heard + (envelope_ - heard) * coeff);
      smooth_envelope_ = flush_denormal(envelope_ + (smooth_envelope_ - envelope_) * settle_);
      const float loud = smooth_envelope_ * (1.0f / kReference);
      const float follow = glide(follow_);
      float follow_gain = 1.0f;
      if (follow > 0.0f) {
        follow_gain += follow * (2.0f * kit::fast_tanh(kFollowKnee * loud) - 1.0f);
      } else if (follow < 0.0f) {
        follow_gain -= follow * (1.0f / (1.0f + kDuck * loud) - 1.0f);
      }

      const float dark = glide(dark_);
      const float thin = glide(thin_);
      const float hum_mid = glide(hum_mid_);
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
          const float level = glide(comp_[t]);
          if (t == kHum50 || t == kHum60) {
            // Hum is the same on both sides of a real system. Its two sides
            // are a quarter of a cycle apart, which between the ears sounds
            // hollow, so they are brought most of the way together: at full
            // Width they still correlate by 0.7. The mid gain makes up what
            // the Width law, written for unrelated sides, would lose.
            const float hum_centre = 0.5f * (out[0] + out[1]) * hum_mid * level * amp_[t];
            const float hum_side = 0.5f * (out[0] - out[1]) * kHumSide * level * amp_[t];
            bed[0] += hum_centre + hum_side;
            bed[1] += hum_centre - hum_side;
          } else {
            for (int c = 0; c < 2; ++c) {
              float y = out[c];
              if (dark > 0.0f) y += dark * (dark_lp_[t][c].lowpass(y) - y);
              if (thin > 0.0f) y -= thin * thin_lp_[t][c].lowpass(y);
              bed[c] += y * level * amp_[t];
            }
          }
        }
      }

      // The fade behind the last note is a smooth step, level at both ends.
      const float shape = gate_ * gate_ * (3.0f - 2.0f * gate_);
      const float gain = glide(level_) * follow_gain * shape;
      const float drift = glide(drift_gain_);
      const float mid = (bed[0] + bed[1]) * 0.5f * drift * glide(mid_);
      const float side = (bed[0] - bed[1]) * 0.5f * drift * glide(side_);
      // No tick, crackle, crash or swell passes kCeiling times the RMS that
      // Level sets (14 dB over it), whatever Tone, Width and Movement have
      // made of it: the few peaks that would are shaved here. Steady hiss
      // never reaches it, and hum, whose buzz is all peaks, is left alone.
      const float ceiling = kCeiling * (1.0f + 2.0f * (amp_[kHum50] + amp_[kHum60]));
      out_left_[i] = in[0] + kit::soft_clip(kit::clamp(mid + side, -ceiling, ceiling) * gain);
      out_right_[i] = in[1] + kit::soft_clip(kit::clamp(mid - side, -ceiling, ceiling) * gain);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 32;
  static constexpr long kNever = 1L << 30;
  static constexpr float kTypeFadeSeconds = 0.15f;
  static constexpr float kGateRiseSeconds = 0.04f;
  static constexpr float kGateFallSeconds = 0.5f;
  // Below -74 dBFS nothing is playing: the last of a reverb tail or the
  // hiss of another device does not keep the noise running.
  static constexpr float kQuiet = 2.0e-4f;
  static constexpr float kInputLimit = 8.0f;  // +18 dBFS
  static constexpr float kFollowLimit = 2.0f;  // Follow hears nothing louder: a glitch upstream is soon forgotten
  static constexpr float kReference = 0.25f;    // the input level Follow calls "loud": -12 dBFS
  static constexpr float kFollowKnee = 0.5493f;  // atanh(1/2): unity at the reference, a ceiling of 2
  static constexpr float kDuck = 4.0f;
  static constexpr float kHumSide = 0.55f;  // hum at full Width: a correlation of 1 - 0.55² = 0.7
  static constexpr float kCeiling = 5.0f;  // the largest peak, in multiples of the RMS that Level sets
  static constexpr float kDarkQ = 0.6f;
  static constexpr float kToneBlend = 4.0f;  // the tone filters are fully in by Tone ±0.25
  static constexpr float kLevelDriftDb = 2.5f;
  static constexpr float kToneDrift = 0.3f;
  // Tone, per bed (hum has none of this: Tone is its buzz). Going down, a
  // low-pass closes from the open frequency to the dark one; going up, a
  // high-pass rises from its open frequency to the thin one.
  static constexpr float kDarkOpenHz[kTypes] = {18000.0f, 9000.0f, 2000.0f, 1.0f, 1.0f, 5000.0f, 18000.0f};
  static constexpr float kDarkHz[kTypes] = {2500.0f, 450.0f, 80.0f, 1.0f, 1.0f, 900.0f, 5000.0f};
  static constexpr float kThinOpenHz[kTypes] = {500.0f, 100.0f, 30.0f, 1.0f, 1.0f, 300.0f, 3000.0f};
  static constexpr float kThinHz[kTypes] = {6000.0f, 900.0f, 300.0f, 1.0f, 1.0f, 1200.0f, 9000.0f};
  // The change of level, in dB, that Tone makes from -1 to 1 in steps of a
  // quarter, by measurement; it is taken back out.
  static constexpr int kTonePoints = 9;
  static constexpr float kToneLevelDb[kTypes][kTonePoints] = {
      {-16.57f, -12.07f, -7.77f, -3.93f, 0.00f, -0.60f, -1.21f, -2.47f, -5.13f},  // Tape hiss
      {-5.46f, -2.38f, -0.78f, -0.21f, 0.00f, -0.85f, -1.55f, -2.80f, -4.80f},  // Vinyl
      {-4.72f, -2.19f, -0.90f, -0.29f, 0.00f, -1.58f, -2.83f, -4.55f, -6.78f},  // Room
      {0.00f, 0.00f, 0.00f, 0.00f, 0.00f, 0.00f, 0.00f, 0.00f, 0.00f},  // Hum 50: its Tone keeps the power itself
      {0.00f, 0.00f, 0.00f, 0.00f, 0.00f, 0.00f, 0.00f, 0.00f, 0.00f},  // Hum 60
      {-4.57f, -2.83f, -1.64f, -0.86f, 0.00f, -1.27f, -1.95f, -2.89f, -4.13f},  // Static
      {-12.54f, -9.05f, -5.96f, -3.27f, 0.00f, -3.00f, -4.15f, -5.74f, -7.95f},  // Air
  };

  // A smoother's next value; at rest it costs one comparison.
  static float glide(kit::Smoother& smoother) {
    return smoother.settled() ? smoother.value : smoother.next();
  }

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

  // The level Tone adds at `tone`, in dB, between the measured points.
  static float tone_level_db(int type, float tone) {
    const float at = (kit::clamp(tone, -1.0f, 1.0f) + 1.0f) * (0.5f * static_cast<float>(kTonePoints - 1));
    const int index = kit::clamp_int(static_cast<int>(at), 0, kTonePoints - 2);
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
      dark_.set(kit::clamp(-kToneBlend * tone_now, 0.0f, 1.0f), started_);
      thin_.set(kit::clamp(kToneBlend * tone_now, 0.0f, 1.0f), started_);
    }
    for (int t = 0; t < kTypes; ++t) {
      if (fade_[t] <= 0.0f && t != type_) {
        prepared_[t] = false;
        continue;
      }
      // A bed that starts sounding takes the current Tone at once; until
      // then it has missed every move of it.
      const bool fresh = !prepared_[t] || fade_[t] <= 0.0f;
      prepared_[t] = true;
      if (tone_moved || fresh) {
        comp_[t].set(kit::db_to_gain(-tone_level_db(t, tone_now)), !fresh);
        if (t != kHum50 && t != kHum60) {
          const float down = kit::max(0.0f, -tone_now), up = kit::max(0.0f, tone_now);
          const float dark_hz = kDarkOpenHz[t] * std::pow(kDarkHz[t] / kDarkOpenHz[t], down);
          const float thin_hz = kThinOpenHz[t] * std::pow(kThinHz[t] / kThinOpenHz[t], up);
          for (int c = 0; c < 2; ++c) {
            dark_lp_[t][c].set(dark_hz, kDarkQ, sr);
            thin_lp_[t][c].set_cutoff(thin_hz, sr);
          }
        }
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
        hum_mid_.set(std::sqrt((2.0f - kHumSide * kHumSide * value * value) / (2.0f - value * value)), primed());
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
  kit::Svf dark_lp_[kTypes][2];
  kit::OnePole thin_lp_[kTypes][2];
  kit::Smoother comp_[kTypes];
  float fade_[kTypes] = {};
  float amp_[kTypes] = {};
  bool prepared_[kTypes] = {};
  kit::Smoother level_, follow_, mid_, side_, hum_mid_, drift_gain_, dark_, thin_;
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
