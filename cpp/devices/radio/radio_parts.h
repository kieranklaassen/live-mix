#pragma once

// Pieces of the Radio device that are not in the kit: a ramp between control
// ticks, Butterworth cascades (and their settled state for a carrier), the
// two-path propagation model, the atmospheric noise source and the
// interference events.

#include "../../kit/kit.h"

namespace livemix {
namespace radio_parts {

// A value worked out on the control clock and ramped linearly to the next
// tick, so nothing computed at control rate steps in the audio.
struct Glide {
  float value = 0.0f;
  float step = 0.0f;

  void snap(float v) {
    value = v;
    step = 0.0f;
  }
  // Reach `target` in 1 / inverse_period samples.
  void aim(float target, float inverse_period, bool snap_now) {
    if (snap_now) {
      snap(target);
    } else {
      step = (target - value) * inverse_period;
    }
  }
  float next() {
    value += step;
    return value;
  }
};

// Butterworth section Qs, lowest first.
static constexpr float kButter4[2] = {0.54119610f, 1.30656296f};
static constexpr float kButter6[3] = {0.51763809f, 0.70710678f, 1.93185165f};
static constexpr float kButter8[4] = {0.50979558f, 0.60134489f, 0.89997622f, 2.56291545f};

// N second-order sections in series: a Butterworth low-pass or high-pass of
// order 2N. The corner only moves when a control does, and then by a glide
// on the control clock, which a transposed direct-form biquad follows
// without a sound.
template <int N>
struct Cascade {
  kit::Biquad section[N];

  void reset() {
    for (kit::Biquad& s : section) s.reset();
  }
  void set_lowpass(float hz, float sample_rate, const float* qs) {
    for (int i = 0; i < N; ++i) section[i].set_lowpass(hz, qs[i], sample_rate);
  }
  void set_highpass(float hz, float sample_rate, const float* qs) {
    for (int i = 0; i < N; ++i) section[i].set_highpass(hz, qs[i], sample_rate);
  }
  float process(float x) {
    for (int i = 0; i < N; ++i) x = section[i].process(x);
    return x;
  }
  // Put the cascade in the state it has after a constant input `x` has been
  // running for a long time; returns its (constant) output.
  float settle(float x) {
    for (kit::Biquad& s : section) {
      const float poles = 1.0f + s.a1 + s.a2;  // above zero for any stable section
      const float y = poles > 1.0e-9f ? x * (s.b0 + s.b1 + s.b2) / poles : 0.0f;
      s.z1 = y - s.b0 * x;
      s.z2 = s.b2 * x - s.a2 * y;
      x = y;
    }
    return x;
  }
};

// The same for two identical cascades that filter the real and imaginary
// parts of one complex signal, when that signal is a phasor turning by `step`
// radians a sample and standing at (re, im) on the sample just gone. Leaves
// the cascades' output for that sample in (re, im).
template <int N>
inline void settle_phasor(Cascade<N>& real, Cascade<N>& imag, float step, float* re, float* im) {
  // The sample before is this one times r = e^(-j step).
  const float rr = std::cos(step), ri = -std::sin(step);
  const float r2r = rr * rr - ri * ri, r2i = 2.0f * rr * ri;
  float xr = *re, xi = *im;
  for (int i = 0; i < N; ++i) {
    const kit::Biquad& s = real.section[i];
    // H(r) = (b0 + b1 r + b2 r^2) / (1 + a1 r + a2 r^2)
    const float nr = s.b0 + s.b1 * rr + s.b2 * r2r, ni = s.b1 * ri + s.b2 * r2i;
    const float dr = 1.0f + s.a1 * rr + s.a2 * r2r, di = s.a1 * ri + s.a2 * r2i;
    const float dd = kit::max(dr * dr + di * di, 1.0e-18f);  // above zero for any stable section
    const float hr = (nr * dr + ni * di) / dd, hi = (ni * dr - nr * di) / dd;
    const float yr = hr * xr - hi * xi, yi = hr * xi + hi * xr;
    // The input and output one sample earlier.
    const float pxr = xr * rr - xi * ri, pxi = xr * ri + xi * rr;
    const float pyr = yr * rr - yi * ri, pyi = yr * ri + yi * rr;
    real.section[i].z2 = s.b2 * xr - s.a2 * yr;
    imag.section[i].z2 = s.b2 * xi - s.a2 * yi;
    real.section[i].z1 = s.b1 * xr - s.a1 * yr + s.b2 * pxr - s.a2 * pyr;
    imag.section[i].z1 = s.b1 * xi - s.a1 * yi + s.b2 * pxi - s.a2 * pyi;
    xr = yr;
    xi = yi;
  }
  *re = xr;
  *im = xi;
}

// Sky-wave propagation as two paths. Both ride one slow flat fade (the
// absorption that comes and goes over seconds, now and then dropping deep);
// the second path arrives a millisecond or so late with its own strength and
// a carrier phase that keeps turning. Where the two cancel depends on
// frequency, so a comb of notches walks through the audio (selective fading)
// and, when a notch crosses the carrier, the carrier itself sinks.
struct Propagation {
  struct Style {
    float depth_db;    // flat fade at Fading 1, deepest point
    float rate_a_hz;   // the two smooth random movements of the flat fade
    float rate_b_hz;
    float echo;        // strength of the second path at Fading 1
    float turn_hz;     // how fast the relative carrier phase turns at Fading 1
    float delay_s;     // centre of the path difference
  };

  void reset(float sample_rate) {
    slow_a_.reset(0.13f);
    slow_a_.seed(0x243F6A88u);
    slow_b_.reset(0.61f);
    slow_b_.seed(0x85A308D3u);
    ratio_.reset(0.37f);
    ratio_.seed(0x13198A2Eu);
    turn_.reset(0.82f);
    turn_.seed(0x03707344u);
    spread_.seed(0xA4093822u);
    spread_.set_rate(0.043f, sample_rate);
    phase_ = 0.31;
  }

  void set_style(const Style& style, float sample_rate) {
    style_ = style;
    slow_a_.set_rate(style.rate_a_hz, sample_rate);
    slow_b_.set_rate(style.rate_b_hz, sample_rate);
    ratio_.set_rate(style.rate_b_hz * 0.37f, sample_rate);
    turn_.set_rate(style.rate_a_hz * 0.53f, sample_rate);
  }

  // Advance by `frames` samples. Out: the gain of the direct path, the
  // complex gain of the late one, and how late it is in seconds.
  void tick(float fading, int frames, float sample_rate, float* direct, float* late_re,
            float* late_im, float* delay_s) {
    const float a = slow_a_.next_block(kit::Lfo::kSmooth, frames);
    const float b = slow_b_.next_block(kit::Lfo::kSmooth, frames);
    const float wander = ratio_.next_block(kit::Lfo::kSmooth, frames);
    const float hurry = turn_.next_block(kit::Lfo::kSmooth, frames);
    const float spread = spread_.next(frames);

    const float u = kit::clamp(0.5f + 0.5f * (0.6f * a + 0.4f * b), 0.0f, 1.0f);
    // Fading is felt early on the control: 0.4 already takes half the depth.
    const float depth = std::sqrt(fading * std::sqrt(fading));
    const float flat = kit::db_to_gain(-style_.depth_db * depth * u * std::sqrt(u));
    // The late path matters most when the direct one is weak: a strong
    // signal is clean, a sinking one hollows and phases.
    const float echo = kit::clamp(
        style_.echo * fading * (0.3f + 0.7f * u) * (0.75f + 0.25f * wander), 0.0f, 0.97f);
    const float hz = style_.turn_hz * (0.25f + 0.75f * fading) * (0.7f + 0.6f * hurry);
    phase_ += static_cast<double>(hz) * frames / static_cast<double>(sample_rate);
    phase_ -= std::floor(phase_);
    const float phase = static_cast<float>(phase_);

    *direct = flat;
    *late_re = flat * echo * kit::SineTable::cos_lookup(phase);
    *late_im = -flat * echo * kit::SineTable::lookup(phase);
    *delay_s = style_.delay_s * std::exp2(0.9f * spread);
  }

 private:
  Style style_ = {30.0f, 0.13f, 0.31f, 0.85f, 0.35f, 0.001f};
  kit::Lfo slow_a_, slow_b_, ratio_, turn_;
  kit::Drift spread_;
  double phase_ = 0.0;
};

// Atmospheric noise at the aerial, as a complex signal across the whole
// passband: steady hiss, crackle (single impulses that ring the receiver's
// filter) and the crashes of distant lightning (the hiss thrown up for a
// tenth of a second to a second, ragged). Sizes are heavy-tailed: most are
// small, a few are large. Levels are relative to a carrier of 1.
struct Atmospherics {
  static constexpr float kHiss = 0.26f;         // noise amplitude at Static 1, at 48 kHz
  static constexpr float kCrashesPerSecond = 0.5f;
  static constexpr float kClicksPerSecond = 14.0f;

  void reset(float sample_rate) {
    noise_.seed(0x299F31D0u);
    dice_.seed(0x082EFA98u);
    ragged_.reset(0.0f);
    ragged_.seed(0xEC4E6C89u);
    ragged_.set_rate(47.0f, sample_rate);
    crash_ = 0.0f;
    crash_decay_ = 0.0f;
    click_re_ = 0.0f;
    click_im_ = 0.0f;
    rate_scale_ = std::sqrt(sample_rate / 48000.0f);
  }

  // Advance by `frames` samples; returns the noise gain to ramp towards.
  float tick(float amount, int frames, float sample_rate) {
    const float dt = static_cast<float>(frames) / sample_rate;
    const float hiss = kHiss * amount * std::sqrt(amount);
    const float ragged = ragged_.next_block(kit::Lfo::kSmooth, frames);
    // The dice are thrown every tick so the sequence does not depend on Static.
    const float crash_chance = dice_.uniform();
    const float crash_size = dice_.uniform();
    const float crash_length = dice_.uniform();
    const float click_chance = dice_.uniform();
    const float click_size = dice_.uniform();
    const float click_angle = dice_.uniform();

    crash_ = flush_denormal(crash_ * crash_decay_);
    if (crash_chance < (0.03f + kCrashesPerSecond * amount * amount) * dt && amount > 0.0f) {
      const float size = heavy(crash_size);
      // The largest crash is about 17 dB over the hiss at Static 1 (14 dB at
      // the default): more than that and, on quiet material, one crash in a
      // few minutes arrives far louder than the music.
      crash_ = kit::max(crash_, 1.5f + (2.0f + 4.0f * amount) * size);
      const float seconds = 0.06f + 0.5f * crash_length * crash_length;
      crash_decay_ = std::exp(-dt / seconds);
    }
    if (click_chance < (0.4f + kClicksPerSecond * amount * amount) * dt && amount > 0.0f) {
      const float size = hiss * rate_scale_ * rate_scale_ * (3.0f + (8.0f + 16.0f * amount) * heavy(click_size));
      click_re_ = size * kit::SineTable::cos_lookup(click_angle);
      click_im_ = size * kit::SineTable::lookup(click_angle);
    }
    const float storm = crash_ * (0.25f + 0.75f * (ragged < 0.0f ? -ragged : ragged));
    return hiss * rate_scale_ * (1.0f + storm);
  }

  void sample(float gain, float* re, float* im) {
    *re = gain * noise_.bipolar() + click_re_;
    *im = gain * noise_.bipolar() + click_im_;
    click_re_ = 0.0f;
    click_im_ = 0.0f;
  }

 private:
  // 0..1, mostly small: 1 / (u + 0.08) rescaled.
  static float heavy(float u) { return (1.0f / (u + 0.08f) - 0.9259f) * (1.0f / 11.574f); }

  kit::Rng noise_, dice_;
  kit::Lfo ragged_;
  float crash_ = 0.0f;
  float crash_decay_ = 0.0f;
  float click_re_ = 0.0f;
  float click_im_ = 0.0f;
  float rate_scale_ = 1.0f;
};

// One neighbour on the frequency. Idle for a random wait, then one event of
// a kind chosen by dice: a carrier (steady or gliding) that whistles against
// ours, a burst of frequency-shift data tones, a mains rasp (noise in pulses
// at twice the mains frequency) or the splatter of the next station along (a
// carrier five kilohertz off with speech-shaped noise on it). Each is a
// complex signal relative to our station's carrier, so the receiver's tuning,
// filter, gain and detector treat it as they treat the station.
struct Interferer {
  enum Kind : int { kIdle = -1, kWhistle = 0, kData, kBuzz, kSplatter };

  void reset(uint32_t seed, float first_wait, float sample_rate) {
    dice_.seed(seed);
    noise_.seed(seed ^ 0x5BD1E995u);
    syllable_.reset(0.2f);
    syllable_.seed(seed ^ 0x1B873593u);
    syllable_.set_rate(4.3f, sample_rate);
    phrase_.reset(0.7f);
    phrase_.seed(seed ^ 0xCC9E2D51u);
    phrase_.set_rate(0.55f, sample_rate);
    voice_low_.reset();
    voice_low_.set_cutoff(2200.0f, sample_rate);
    voice_high_.reset();
    voice_high_.set_cutoff(350.0f, sample_rate);
    kind_ = kIdle;
    wait_ = first_wait;
    amp_.snap(0.0f);
    shape_.snap(0.0f);
    phase_ = 0.0f;
    pulse_phase_ = 0.0f;
    increment_ = 0.0f;
    pulse_increment_ = 0.0f;
  }

  bool active() const { return kind_ != kIdle; }
  int kind() const { return kind_; }

  // `amount` is the Interference control; `passband_hz` the top of the audio
  // band, so events land where they can be heard.
  void tick(float amount, bool sideband, float passband_hz, int frames, float sample_rate,
            float inverse_period, bool snap) {
    const float dt = static_cast<float>(frames) / sample_rate;
    if (kind_ == kIdle) {
      if (amount <= 0.0f) return;
      const float quiet = 1.0f - amount;
      wait_ -= dt / (4.0f + 56.0f * quiet * quiet);
      if (wait_ <= 0.0f) start(sideband, passband_hz, sample_rate);
      return;
    }
    age_ += dt;
    // Interference turned to zero: the event in progress fades out now.
    if (amount <= 0.0f) length_ = kit::min(length_, age_ + fade_);
    if (age_ >= length_) {
      kind_ = kIdle;
      wait_ = -std::log(dice_.uniform() + 1.0e-4f);
      amp_.snap(0.0f);
      return;
    }
    float along = kit::min(age_, length_ - age_) / fade_;
    along = kit::clamp(along, 0.0f, 1.0f);
    const float envelope = along * along * (3.0f - 2.0f * along);
    amp_.aim(level_ * envelope * (0.3f + 0.7f * amount), inverse_period, snap);

    if (kind_ == kWhistle) {
      hz_ += glide_ * dt;
    } else if (kind_ == kData) {
      bit_ -= dt * baud_;
      if (bit_ <= 0.0f) {
        bit_ += 1.0f;
        tone_ = static_cast<int>(dice_.uniform() * static_cast<float>(tones_));
      }
      const float target = base_hz_ + shift_hz_ * static_cast<float>(tone_);
      hz_ += 0.6f * (target - hz_);
    } else if (kind_ == kSplatter) {
      const float syllable = kit::clamp(0.5f + 0.9f * syllable_.next_block(kit::Lfo::kSmooth, frames),
                                        0.0f, 1.0f);
      const float phrase =
          kit::clamp(1.5f + 3.0f * phrase_.next_block(kit::Lfo::kSmooth, frames), 0.0f, 1.0f);
      shape_.aim(syllable * syllable * phrase, inverse_period, snap);
    }
    increment_ = hz_ / sample_rate;
  }

  // Adds this neighbour's signal to (re, im).
  void sample(float* re, float* im) {
    const float amp = amp_.next();
    switch (kind_) {
      case kWhistle:
      case kData: {
        advance();
        *re += amp * kit::SineTable::cos_lookup(phase_);
        *im += amp * kit::SineTable::lookup(phase_);
        break;
      }
      case kBuzz: {
        // Two pulses per mains cycle, the second smaller.
        pulse_phase_ += pulse_increment_;
        if (pulse_phase_ >= 2.0f) pulse_phase_ -= 2.0f;
        const float within = pulse_phase_ >= 1.0f ? pulse_phase_ - 1.0f : pulse_phase_;
        const float a = noise_.bipolar();
        const float b = noise_.bipolar();
        if (within < kPulseWidth) {
          const float half_sine = kit::SineTable::lookup(0.5f * within / kPulseWidth);
          const float pulse = amp * half_sine * half_sine * (pulse_phase_ >= 1.0f ? 0.6f : 1.0f);
          *re += pulse * a;
          *im += pulse * b;
        }
        break;
      }
      case kSplatter: {
        advance();
        const float n = noise_.bipolar();
        const float speech = voice_high_.highpass(voice_low_.lowpass(n));
        const float v = amp * (3.0f * speech * shape_.next() + 0.1f);
        *re += v * kit::SineTable::cos_lookup(phase_);
        *im += v * kit::SineTable::lookup(phase_);
        break;
      }
      default:
        break;
    }
  }

 private:
  static constexpr float kPulseWidth = 0.16f;

  void advance() {
    phase_ += increment_;
    phase_ -= std::floor(phase_);
  }

  void start(bool sideband, float passband_hz, float sample_rate) {
    const float pick = dice_.uniform();
    const float a = dice_.uniform();
    const float b = dice_.uniform();
    const float c = dice_.uniform();
    const float d = dice_.uniform();
    const float side = (sideband || d < 0.5f) ? 1.0f : -1.0f;
    age_ = 0.0f;
    glide_ = 0.0f;
    amp_.snap(0.0f);
    shape_.snap(0.0f);
    if (pick < 0.34f) {
      kind_ = kWhistle;
      hz_ = side * (350.0f + a * kit::max(200.0f, passband_hz - 700.0f));
      if (b > 0.5f) glide_ = (c < 0.5f ? -1.0f : 1.0f) * (15.0f + 150.0f * (2.0f * b - 1.0f));
      length_ = 2.5f + 6.5f * c;
      fade_ = 0.4f + 1.1f * d;
      level_ = 0.1f;
    } else if (pick < 0.6f) {
      kind_ = kData;
      static constexpr int kTones[4] = {2, 2, 4, 8};
      static constexpr float kShift[4] = {170.0f, 425.0f, 120.0f, 62.5f};
      const int scheme = kit::clamp_int(static_cast<int>(b * 4.0f), 0, 3);
      tones_ = kTones[scheme];
      shift_hz_ = side * kShift[scheme];
      base_hz_ = side * (500.0f + a * kit::max(200.0f, passband_hz - 1400.0f));
      hz_ = base_hz_;
      baud_ = 45.0f + 65.0f * c;
      bit_ = 1.0f;
      tone_ = 0;
      length_ = 1.2f + 3.8f * d;
      fade_ = 0.03f;
      level_ = 0.09f;
    } else if (pick < 0.76f) {
      kind_ = kBuzz;
      pulse_increment_ = 2.0f * (a < 0.5f ? 50.0f : 60.0f) / sample_rate;
      length_ = 2.0f + 5.0f * b;
      fade_ = 0.25f;
      level_ = 0.3f * std::sqrt(sample_rate / 48000.0f);
    } else {
      kind_ = kSplatter;
      hz_ = sideband ? 1800.0f + 900.0f * a : side * 5000.0f;
      length_ = 3.0f + 6.0f * b;
      fade_ = 0.5f;
      level_ = 0.5f;
    }
    increment_ = hz_ / sample_rate;
  }

  kit::Rng dice_, noise_;
  kit::Lfo syllable_, phrase_;
  kit::OnePole voice_low_, voice_high_;
  Glide amp_, shape_;
  int kind_ = kIdle;
  float wait_ = 1.0f;
  float age_ = 0.0f, length_ = 1.0f, fade_ = 0.1f, level_ = 0.0f;
  float hz_ = 0.0f, glide_ = 0.0f, base_hz_ = 0.0f, shift_hz_ = 0.0f, baud_ = 50.0f, bit_ = 1.0f;
  int tones_ = 2, tone_ = 0;
  float phase_ = 0.0f, increment_ = 0.0f;
  float pulse_phase_ = 0.0f, pulse_increment_ = 0.0f;
};

}  // namespace radio_parts
}  // namespace livemix
