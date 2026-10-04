#pragma once

// The noise beds of Noise Floor: one small model per medium. Each makes a
// stereo pair whose two sides never share a noise source, and each is scaled
// so that one side measures an RMS of 1 at rest (Movement 0); the device
// applies Level, Tone and everything else on top.
//
// White noise here has the same power per hertz at every sample rate (it is
// scaled by sqrt(rate / 48 kHz)), and every filter is set in hertz and stops
// below 18 kHz, so a bed has the same level and colour at 44.1, 48 and 96 kHz.

#include "../../kit/kit.h"

namespace livemix {
namespace noise_beds {

// An unrelated seed per stream. Seeding one xorshift from the next output of
// another would hand out the same sequence one step apart.
inline uint32_t seed_for(uint32_t stream) {
  uint32_t x = (stream + 1u) * 0x9E3779B9u;
  x ^= x >> 16;
  x *= 0x85EBCA6Bu;
  x ^= x >> 13;
  x *= 0xC2B2AE35u;
  x ^= x >> 16;
  return x == 0 ? 0x2545F491u : x;
}

// White noise with unit variance at 48 kHz and the same density elsewhere.
struct Source {
  kit::Rng rng;
  float scale = 1.7320508f;

  void init(uint32_t stream, float sample_rate) {
    rng.seed(seed_for(stream));
    scale = std::sqrt(3.0f * sample_rate / 48000.0f);
  }
  float next() { return rng.bipolar() * scale; }
};

// The gap to the next event of a Poisson stream, in samples.
inline float poisson_gap(kit::Rng& rng, float per_second, float sample_rate) {
  const float gap = -std::log(1.0f - rng.uniform()) * sample_rate / kit::max(per_second, 1.0e-3f);
  return kit::max(gap, 1.0f);
}

// A heavy-tailed size: most draws sit just above 1 and a few are larger (a
// Pareto tail, index 1 / `tail`), but the tail bends over smoothly towards
// `ceiling`: nothing reaches it, and no pile of events sits exactly on it.
inline float heavy_tail(kit::Rng& rng, float tail, float ceiling) {
  const float u = kit::max(rng.uniform(), 1.0e-6f);
  const float over = std::exp(-tail * std::log(u)) - 1.0f;
  const float span = kit::max(ceiling - 1.0f, 1.0e-3f);
  return 1.0f + span * over / (over + span);
}

// One-pole lowpass by the trapezoidal rule. Unlike kit::OnePole it reaches
// zero at Nyquist as the analogue filter does at infinity, so a shelf built
// on it has the same shape at every sample rate.
struct TrapezoidPole {
  float state = 0.0f;
  float g = 0.0f;

  void reset() { state = 0.0f; }
  void set_cutoff(float hz, float sample_rate) {
    const float t = kit::tan_prewarp(kit::kPi * kit::clamp(hz, 1.0f, 0.49f * sample_rate) / sample_rate);
    g = t / (1.0f + t);
  }
  float lowpass(float x) {
    const float v = (x - state) * g;
    const float y = v + state;
    state = flush_denormal(y + v);
    return y;
  }
};

// A struck two-pole resonator: `strike` starts amp·rⁿ·sin(n·w) on top of
// whatever is still ringing. A tick, a click or a pop, depending on pitch and
// damping; at rest it costs one comparison.
struct Ping {
  float y1 = 0.0f, y2 = 0.0f;
  float c = 0.0f, r2 = 0.0f;

  void reset() {
    y1 = y2 = 0.0f;
    c = r2 = 0.0f;
  }
  void strike(float amp, float hz, float q, float sample_rate) {
    const float cycles = kit::clamp(hz / sample_rate, 1.0e-4f, 0.45f);
    const float r = std::exp(-kit::kPi * cycles / kit::max(q, 0.3f));
    c = 2.0f * r * kit::SineTable::cos_lookup(cycles);
    r2 = r * r;
    y1 += amp * r * kit::SineTable::lookup(cycles);
  }
  float next() {
    if (y1 == 0.0f && y2 == 0.0f) return 0.0f;
    const float out = y1;
    const float y0 = flush_denormal(c * y1 - r2 * y2);
    y2 = flush_denormal(y1);
    y1 = y0;
    // Far below anything audible the ring is dropped.
    if (y1 > -1.0e-9f && y1 < 1.0e-9f && y2 > -1.0e-9f && y2 < 1.0e-9f) y1 = y2 = 0.0f;
    return out;
  }
};

// Tape hiss: white noise through a shelf that sits 18 dB down below 1 kHz,
// rises at 6 dB an octave and levels off at 8.5 kHz. Movement adds a slow
// shimmer in level and a faster, finer one. On top rides modulation noise:
// the passing signal multiplied by low-passed noise, so loud passages are
// rougher than quiet ones, as on tape.
struct TapeHiss {
  static constexpr float kNorm = 2.008f;     // by measurement: one side has an RMS of 1
  static constexpr float kShelf = 0.875f;
  // Under a signal at -12 dBFS RMS the modulation noise is 6 dB below the hiss.
  static constexpr float kModulation = 3.56f;

  Source src[2];
  TrapezoidPole shelf[2];
  kit::OnePole rough[2];
  kit::Svf top[2];
  kit::Drift shimmer[2];
  kit::Lfo flutter[2];
  float gain[2] = {1.0f, 1.0f};

  void init(float sr, uint32_t stream) {
    for (int c = 0; c < 2; ++c) {
      src[c].init(stream + c, sr);
      shelf[c].reset();
      shelf[c].set_cutoff(8500.0f, sr);
      rough[c].reset();
      rough[c].set_cutoff(1200.0f, sr);
      top[c].reset();
      top[c].set(16000.0f, 0.6f, sr);
      shimmer[c].seed(seed_for(stream + 2 + c));
      shimmer[c].set_rate(c == 0 ? 0.31f : 0.37f, sr);
      flutter[c].seed(seed_for(stream + 4 + c));
      flutter[c].reset(c == 0 ? 0.0f : 0.4f);
      flutter[c].set_rate(c == 0 ? 4.7f : 5.3f, sr);
      gain[c] = 1.0f;
    }
  }
  void control(float movement, int period) {
    for (int c = 0; c < 2; ++c) {
      gain[c] = 1.0f + movement * (0.12f * shimmer[c].next(period) +
                                   0.06f * flutter[c].next_block(kit::Lfo::kSmooth, period));
    }
  }
  void render(const float* in, float* out) {
    for (int c = 0; c < 2; ++c) {
      const float w = src[c].next();
      const float hiss = top[c].lowpass(w - kShelf * shelf[c].lowpass(w));
      out[c] = kNorm * (hiss * gain[c] + kModulation * in[c] * rough[c].lowpass(w));
    }
  }
};

// Air: the hiss of a microphone preamp in a quiet room. Nearly all of it is
// above 5 kHz, with a soft knee into the band and a faint flat floor under
// it. Movement lets each side breathe a little.
struct Air {
  static constexpr float kNorm = 1.816f;  // by measurement
  static constexpr float kFloor = 0.05f;

  Source src[2];
  kit::Svf high[2], top[2];
  kit::Drift breath[2];
  float gain[2] = {1.0f, 1.0f};

  void init(float sr, uint32_t stream) {
    for (int c = 0; c < 2; ++c) {
      src[c].init(stream + c, sr);
      high[c].reset();
      high[c].set(5500.0f, 0.5f, sr);
      top[c].reset();
      top[c].set(17000.0f, 0.6f, sr);
      breath[c].seed(seed_for(stream + 2 + c));
      breath[c].set_rate(c == 0 ? 0.13f : 0.17f, sr);
      gain[c] = 1.0f;
    }
  }
  void control(float movement, int period) {
    for (int c = 0; c < 2; ++c) gain[c] = 1.0f + 0.2f * movement * breath[c].next(period);
  }
  void render(const float*, float* out) {
    for (int c = 0; c < 2; ++c) {
      const float w = src[c].next();
      out[c] = kNorm * gain[c] * top[c].lowpass(high[c].highpass(w) + kFloor * w);
    }
  }
};

// Vinyl: a dull surface noise (a band from 200 Hz to 1 kHz, falling away
// above it, over a trace of hiss), fine bright crackle, the odd soft pop,
// and a low rumble. Crackle is a Poisson stream of ticks with heavy-tailed
// sizes, each a struck resonator with its own pitch (3.5 to 9 kHz), damping
// and place between the sides. Movement makes the rumble and the dust come round
// once per turn of a 33⅓ record.
struct Vinyl {
  static constexpr float kNorm = 5.508f;   // by measurement
  static constexpr float kRumble = 0.85f;  // 10 dB under the surface noise
  static constexpr float kSurfaceLowHz = 200.0f;
  static constexpr float kSurfaceTopHz = 1000.0f;
  static constexpr float kAir = 0.0115f;   // a trace of hiss over the whole band, 24 dB under the bed
  // The surface noise is held to this many times the bed's RMS: its own rare
  // peaks would otherwise use up the room the ticks need.
  static constexpr float kSurfacePeak = 2.8f;
  // Ticks and pops are sized in multiples of the bed's RMS, and kept small:
  // a tick is struck at 1 to 1.6 times kTick, and its damping and its place
  // between the sides take some of that away again, so the largest in several
  // minutes, surface noise included, peaks about 14 dB over the bed's RMS.
  // They are heard because they are bright and the surface noise is dull,
  // not because they are loud. A pop is a soft thump of 2 to 5 dB over.
  static constexpr float kTick = 2.3f;
  static constexpr float kTickCeiling = 1.6f;
  static constexpr float kTickHz = 3500.0f;
  static constexpr float kTickOctaves = 1.4f;
  static constexpr float kTickQ = 1.5f;
  static constexpr float kPop = 3.0f;
  static constexpr float kTicksPerSecond = 16.0f;
  static constexpr float kPopsPerSecond = 0.22f;
  static constexpr float kTurnHz = 33.333f / 60.0f;

  Source src[2];
  kit::OnePole low_cut[2];
  kit::Svf high_cut[2], rumble[2];
  Ping tick[2][2], pop[2];
  kit::Rng events;
  float tick_wait = 0.0f, pop_wait = 0.0f;
  float turn = 0.0f;
  float rumble_gain[2] = {1.0f, 1.0f};
  float dust = 1.0f;
  float sr = 48000.0f;
  int which = 0;
  // How many ticks and pops have been struck, for a display to count.
  int ticks = 0, pops = 0;

  void init(float sample_rate, uint32_t stream) {
    sr = sample_rate;
    ticks = pops = 0;
    for (int c = 0; c < 2; ++c) {
      src[c].init(stream + c, sr);
      low_cut[c].reset();
      low_cut[c].set_cutoff(kSurfaceLowHz, sr);
      high_cut[c].reset();
      high_cut[c].set(kSurfaceTopHz, 0.6f, sr);
      rumble[c].reset();
      rumble[c].set(42.0f, 0.8f, sr);
      tick[c][0].reset();
      tick[c][1].reset();
      pop[c].reset();
      rumble_gain[c] = 1.0f;
    }
    events.seed(seed_for(stream + 2));
    tick_wait = poisson_gap(events, kTicksPerSecond, sr);
    pop_wait = poisson_gap(events, kPopsPerSecond, sr);
    turn = 0.0f;
    dust = 1.0f;
    which = 0;
  }
  void control(float movement, int period) {
    turn += kTurnHz * static_cast<float>(period) / sr;
    if (turn >= 1.0f) turn -= 1.0f;
    // The warp reaches the right a quarter of a turn after the left.
    rumble_gain[0] = 1.0f + 0.6f * movement * kit::SineTable::lookup(turn);
    rumble_gain[1] = 1.0f + 0.6f * movement * kit::SineTable::lookup(turn + 0.25f);
    dust = 1.0f + 0.7f * movement * kit::SineTable::lookup(turn + 0.6f);
  }
  void render(const float*, float* out) {
    // The dice are thrown at a fixed pace of their own; `dust` only stretches
    // or shrinks the wait, so the crackle does not restart when it moves.
    tick_wait -= dust;
    if (tick_wait <= 0.0f) {
      tick_wait += poisson_gap(events, kTicksPerSecond, sr);
      const float size = kTick * heavy_tail(events, 0.35f, kTickCeiling);
      const float hz = kTickHz * std::exp2(kTickOctaves * events.uniform());
      const float q = kTickQ + 1.5f * events.uniform();
      // Anywhere between the sides, and as often out of phase as in: dust
      // sits on either wall of the groove.
      const float place = 0.25f * events.uniform();
      const uint32_t coin = events.next_u32();
      const float up = (coin & 0x100u) ? 1.0f : -1.0f;
      const float flip = (coin & 0x200u) ? up : -up;
      tick[0][which].strike(up * size * kit::SineTable::cos_lookup(place), hz, q, sr);
      tick[1][which].strike(flip * size * kit::SineTable::lookup(place), hz * (0.9f + 0.2f * events.uniform()),
                            q, sr);
      which ^= 1;
      ++ticks;
    }
    pop_wait -= 1.0f;
    if (pop_wait <= 0.0f) {
      pop_wait += poisson_gap(events, kPopsPerSecond, sr);
      // Either way up, so the thumps leave no offset behind.
      const float way = (events.next_u32() & 0x100u) ? 1.0f : -1.0f;
      const float size = way * kPop * (1.0f + 0.6f * events.uniform());
      const float hz = 70.0f * std::exp2(1.5f * events.uniform());
      const float lean = 0.125f + 0.06f * events.bipolar();
      pop[0].strike(size * kit::SineTable::cos_lookup(lean), hz, 0.9f, sr);
      pop[1].strike(size * kit::SineTable::lookup(lean), hz * 1.04f, 0.9f, sr);
      ++pops;
    }
    for (int c = 0; c < 2; ++c) {
      const float w = src[c].next();
      const float hiss = high_cut[c].lowpass(low_cut[c].highpass(w)) + kAir * w;
      const float low = rumble[c].bandpass(w);
      const float surface = kit::clamp(kNorm * (hiss + kRumble * rumble_gain[c] * low), -kSurfacePeak, kSurfacePeak);
      out[c] = surface + tick[c][0].next() + tick[c][1].next() + pop[c].next();
    }
  }
};

// Room: the tone of an empty room. A rumble below 90 Hz, three broad room
// modes, the band noise of ventilation around 220 Hz and a trace of air.
// Movement lets each part swell and sink on its own, very slowly.
struct Room {
  static constexpr float kNorm = 9.189f;  // by measurement
  // Each mode stands about 5 dB out of the rumble around it; the ventilation
  // band is 5 dB under the lows and the air 26 dB under.
  static constexpr float kMode = 1.44f;
  static constexpr float kVent = 0.42f;
  static constexpr float kAir = 0.0047f;
  static constexpr int kModes = 3;
  static constexpr float kModeHz[kModes] = {43.0f, 67.0f, 109.0f};
  static constexpr float kModeWeight[kModes] = {1.0f, 0.8f, 0.5f};

  Source src[2];
  kit::OnePole rumble_a[2], rumble_b[2], vent_top[2], air_cut[2];
  kit::DcBlocker floor_cut[2];
  kit::Svf mode[2][kModes], vent[2];
  kit::Drift wander[2 + kModes];
  float rumble_gain = 1.0f, vent_gain = 1.0f;
  float mode_gain[kModes] = {1.0f, 1.0f, 1.0f};

  void init(float sr, uint32_t stream) {
    for (int c = 0; c < 2; ++c) {
      src[c].init(stream + c, sr);
      rumble_a[c].reset();
      rumble_a[c].set_cutoff(90.0f, sr);
      rumble_b[c].reset();
      rumble_b[c].set_cutoff(90.0f, sr);
      floor_cut[c].reset();
      floor_cut[c].set_cutoff(22.0f, sr);
      vent[c].reset();
      vent[c].set(220.0f, 0.7f, sr);
      vent_top[c].reset();
      vent_top[c].set_cutoff(450.0f, sr);
      air_cut[c].reset();
      air_cut[c].set_cutoff(1500.0f, sr);
      for (int m = 0; m < kModes; ++m) {
        mode[c][m].reset();
        mode[c][m].set(kModeHz[m], 5.0f, sr);
      }
    }
    static constexpr float kRates[2 + kModes] = {0.043f, 0.071f, 0.057f, 0.089f, 0.113f};
    for (int d = 0; d < 2 + kModes; ++d) {
      wander[d].seed(seed_for(stream + 2 + d));
      wander[d].set_rate(kRates[d], sr);
    }
    rumble_gain = vent_gain = 1.0f;
    for (float& g : mode_gain) g = 1.0f;
  }
  void control(float movement, int period) {
    rumble_gain = 1.0f + 0.25f * movement * wander[0].next(period);
    vent_gain = 1.0f + 0.5f * movement * wander[1].next(period);
    for (int m = 0; m < kModes; ++m) {
      mode_gain[m] = kModeWeight[m] * (1.0f + 0.6f * movement * wander[2 + m].next(period));
    }
  }
  void render(const float*, float* out) {
    for (int c = 0; c < 2; ++c) {
      const float w = src[c].next();
      const float low = floor_cut[c].process(rumble_b[c].lowpass(rumble_a[c].lowpass(w)));
      float modes = 0.0f;
      for (int m = 0; m < kModes; ++m) modes += mode_gain[m] * mode[c][m].bandpass(w);
      const float band = vent_top[c].lowpass(vent[c].bandpass(w));
      out[c] = kNorm * (rumble_gain * low + kMode * modes + kVent * vent_gain * band +
                        kAir * air_cut[c].highpass(w));
    }
  }
};

// Static: a radio between stations. Everything goes through the receiver's
// band (350 Hz to 3.8 kHz): a sputtering hiss, darker than the band so the
// crackle is heard over it without being loud, crackles that come in bursts,
// and crashes, sudden swells of noise that die away in a fraction of a
// second and leave a flurry of crackle behind. Both sides hear the same
// events through noise of their own. Movement is how restless the band is.
struct Static {
  static constexpr float kNorm = 5.80f;  // by measurement
  // The hiss is tilted down above this, so the crackle is the bright part.
  static constexpr float kHissDarkHz = 700.0f;
  // Events that sit in the bed instead of jumping out of it: the largest
  // crackle peaks about 14 dB over the bed's RMS and most are far smaller; a
  // crash is a swell of 3 to 5 dB. (The device shaves the few peaks that
  // would pass 14 dB over the RMS.)
  static constexpr float kCrackle = 2.0f;
  static constexpr float kCrackleCeiling = 1.6f;
  static constexpr float kCrash = 0.45f;
  static constexpr float kCrashCeiling = 1.6f;
  static constexpr float kCracklesPerSecond = 30.0f;
  static constexpr float kCrashesPerSecond = 0.45f;

  Source src[2];
  kit::Svf low_cut[2], high_cut[2];
  TrapezoidPole dark[2];
  kit::Lfo sputter[2];
  kit::Drift fading, flurry;
  kit::Rng events;
  float bed[2] = {1.0f, 1.0f};
  float crash[2] = {0.0f, 0.0f};
  float crash_decay = 0.999f;
  float crackle_wait = 0.0f, crash_wait = 0.0f;
  float pace = 1.0f;       // how fast the crackle clock runs
  float aftermath = 0.0f;  // the flurry a crash leaves behind
  float aftermath_decay = 0.99f;
  float restless = 0.0f;
  float impulse_scale = 1.0f;
  float sr = 48000.0f;
  // How many crackles and crashes there have been, for a display to count.
  int crackles = 0, crashes = 0;

  void init(float sample_rate, uint32_t stream) {
    sr = sample_rate;
    crackles = crashes = 0;
    for (int c = 0; c < 2; ++c) {
      src[c].init(stream + c, sr);
      low_cut[c].reset();
      low_cut[c].set(350.0f, 0.7f, sr);
      high_cut[c].reset();
      high_cut[c].set(3800.0f, 0.9f, sr);
      dark[c].reset();
      dark[c].set_cutoff(kHissDarkHz, sr);
      sputter[c].seed(seed_for(stream + 2 + c));
      sputter[c].reset(c == 0 ? 0.0f : 0.5f);
      sputter[c].set_rate(c == 0 ? 11.0f : 13.0f, sr);
      bed[c] = 1.0f;
      crash[c] = 0.0f;
    }
    fading.seed(seed_for(stream + 4));
    fading.set_rate(0.19f, sr);
    flurry.seed(seed_for(stream + 5));
    flurry.set_rate(0.33f, sr);
    events.seed(seed_for(stream + 6));
    crackle_wait = poisson_gap(events, kCracklesPerSecond, sr);
    crash_wait = poisson_gap(events, kCrashesPerSecond, sr);
    pace = 1.0f;
    aftermath = 0.0f;
    restless = 0.0f;
    crash_decay = 0.999f;
    // A flurry dies away in a third of a second.
    aftermath_decay = std::exp(-1.0f / (0.3f * sr));
    // An impulse through a band set in hertz peaks lower at a higher rate.
    impulse_scale = sr / 48000.0f;
  }
  void control(float movement, int period) {
    restless = movement;
    const float fade = 1.0f + 0.45f * movement * fading.next(period);
    for (int c = 0; c < 2; ++c) {
      bed[c] = fade * (1.0f + 0.25f * (0.4f + 0.6f * movement) * sputter[c].next_block(kit::Lfo::kSmooth, period));
    }
    // Bursts: the crackle rate swings over two octaves either way.
    pace = std::exp2(2.0f * movement * flurry.next(period));
  }
  void render(const float*, float* out) {
    float hit[2] = {0.0f, 0.0f};
    crackle_wait -= pace * (1.0f + 8.0f * aftermath);
    if (crackle_wait <= 0.0f) {
      crackle_wait += poisson_gap(events, kCracklesPerSecond, sr);
      const float size = kCrackle * impulse_scale * heavy_tail(events, 0.4f, kCrackleCeiling);
      hit[0] = size * events.bipolar();
      hit[1] = size * events.bipolar();
      ++crackles;
    }
    crash_wait -= 0.4f + 0.6f * restless + 0.6f * restless * restless;
    if (crash_wait <= 0.0f) {
      crash_wait += poisson_gap(events, kCrashesPerSecond, sr);
      const float size = kCrash * heavy_tail(events, 0.3f, kCrashCeiling);
      crash[0] = kit::min(crash[0] + size * (0.8f + 0.4f * events.uniform()), kCrash * kCrashCeiling);
      crash[1] = kit::min(crash[1] + size * (0.8f + 0.4f * events.uniform()), kCrash * kCrashCeiling);
      crash_decay = std::exp(-1.0f / ((0.03f + 0.2f * events.uniform()) * sr));
      aftermath = 1.0f;
      ++crashes;
    }
    aftermath = flush_denormal(aftermath * aftermath_decay);
    for (int c = 0; c < 2; ++c) {
      const float x = dark[c].lowpass(src[c].next()) * (bed[c] + crash[c]) + hit[c];
      crash[c] = flush_denormal(crash[c] * crash_decay);
      out[c] = kNorm * high_cut[c].lowpass(low_cut[c].highpass(x));
    }
  }
};

// One cycle of mains hum as two wavetables per side, both with an RMS of 1:
// the body (the fundamental, the 100 or 120 Hz of the rectifier and the
// next few harmonics) and the buzz (harmonics 8 to 40 in phase with each
// other, which makes the narrow charging pulses of a rectifier, twice a
// cycle and not quite alike). The right side has every harmonic a quarter
// of its own cycle later: the same sound, uncorrelated with the left, and
// the two sum to mono without any harmonic cancelling.
struct HumTables {
  static constexpr int kSize = 2048;
  static constexpr int kBody = 7;
  static constexpr int kTop = 40;

  // [side][1 + index], with one guard sample before and two after.
  float body[2][kSize + 3] = {};
  float buzz[2][kSize + 3] = {};

  void init() {
    static constexpr float kBodyLevel[kBody] = {1.0f, 0.8f, 0.45f, 0.2f, 0.2f, 0.1f, 0.1f};
    static constexpr float kBodyPhase[kBody] = {0.0f, 0.15f, 0.4f, 0.3f, 0.7f, 0.1f, 0.55f};
    float level[kTop + 1] = {};
    float body_power = 0.0f, buzz_power = 0.0f;
    for (int n = 1; n <= kTop; ++n) {
      if (n <= kBody) {
        level[n] = kBodyLevel[n - 1];
        body_power += 0.5f * level[n] * level[n];
      } else {
        // Even harmonics carry the pulses; the odd ones make them unequal.
        level[n] = std::pow(8.0f / static_cast<float>(n), 0.9f) * ((n & 1) ? 0.35f : 1.0f);
        if (n >= 28) {
          const float taper = kit::SineTable::cos_lookup(0.25f * static_cast<float>(n - 28) / 13.0f);
          level[n] *= taper * taper;
        }
        buzz_power += 0.5f * level[n] * level[n];
      }
    }
    const float body_scale = 1.0f / std::sqrt(body_power);
    const float buzz_scale = 1.0f / std::sqrt(buzz_power);
    for (int side = 0; side < 2; ++side) {
      const float late = side == 0 ? 0.0f : 0.25f;
      for (int i = -1; i < kSize + 2; ++i) {
        const float at = static_cast<float>((i + kSize) % kSize) / static_cast<float>(kSize);
        float b = 0.0f, z = 0.0f;
        for (int n = 1; n <= kTop; ++n) {
          if (n <= kBody) {
            b += level[n] * kit::SineTable::lookup(static_cast<float>(n) * at + kBodyPhase[n - 1] + late);
          } else {
            z += level[n] * kit::SineTable::cos_lookup(static_cast<float>(n) * at + late);
          }
        }
        body[side][i + 1] = b * body_scale;
        buzz[side][i + 1] = z * buzz_scale;
      }
    }
  }
};

// Mains hum at 50 or 60 Hz, read from the tables, over a trace of amplifier
// hiss. Tone goes from the body alone to mostly buzz, at constant power.
// Movement lets the mains frequency drift by a few hundredths of a hertz and
// the buzz waver.
struct Hum {
  static constexpr float kHiss = 0.1005f;  // by measurement: 26 dB under the hum
  static constexpr float kHissPower = 0.00251f;
  static constexpr float kDriftHz = 0.04f;

  Source src[2];
  kit::OnePole hiss_cut[2];
  kit::Svf hiss_top[2];
  kit::Drift mains, waver[2];
  double phase = 0.0;
  double increment = 0.0;
  float hz = 50.0f;
  float body_gain = 1.0f, body_step = 0.0f, body_target = 1.0f;
  float buzz_gain[2] = {0.0f, 0.0f}, buzz_step[2] = {0.0f, 0.0f}, buzz_target[2] = {0.0f, 0.0f};
  float hiss_gain = 0.0f;
  float sr = 48000.0f;
  bool started = false;

  void init(float sample_rate, uint32_t stream, float mains_hz) {
    sr = sample_rate;
    hz = mains_hz;
    for (int c = 0; c < 2; ++c) {
      src[c].init(stream + c, sr);
      hiss_cut[c].reset();
      hiss_cut[c].set_cutoff(2000.0f, sr);
      hiss_top[c].reset();
      hiss_top[c].set(12000.0f, 0.6f, sr);
      waver[c].seed(seed_for(stream + 2 + c));
      waver[c].set_rate(c == 0 ? 0.29f : 0.23f, sr);
    }
    mains.seed(seed_for(stream + 4));
    mains.set_rate(0.05f, sr);
    phase = 0.0;
    increment = static_cast<double>(hz) / sr;
    started = false;
  }
  void control(float tone, float movement, int period) {
    // Buzz against body: none at Tone -1, 0.15 in the middle (the ear hears
    // it far better than the hum under it), 1.2 at +1.
    const float ratio = tone < 0.0f ? 0.15f * (1.0f + tone) : 0.15f * std::exp2(3.0f * tone);
    const float norm = 1.0f / std::sqrt(1.0f + ratio * ratio + kHissPower);
    const float per_sample = 1.0f / static_cast<float>(period);
    body_gain = started ? body_target : norm;
    body_target = norm;
    body_step = (body_target - body_gain) * per_sample;
    for (int c = 0; c < 2; ++c) {
      const float buzz = norm * ratio * (1.0f + 0.25f * movement * waver[c].next(period));
      buzz_gain[c] = started ? buzz_target[c] : buzz;
      buzz_target[c] = buzz;
      buzz_step[c] = (buzz_target[c] - buzz_gain[c]) * per_sample;
    }
    hiss_gain = norm * kHiss;
    increment = static_cast<double>(hz + kDriftHz * movement * mains.next(period)) / sr;
    started = true;
  }
  void render(const HumTables& tables, float* out) {
    // In double: a float product could round up to the table's length.
    const double position = phase * HumTables::kSize;
    const int index = static_cast<int>(position);
    const float t = static_cast<float>(position - static_cast<double>(index));
    phase += increment;
    if (phase >= 1.0) phase -= 1.0;
    body_gain += body_step;
    for (int c = 0; c < 2; ++c) {
      const float* b = &tables.body[c][index];
      const float* z = &tables.buzz[c][index];
      buzz_gain[c] += buzz_step[c];
      const float hiss = hiss_top[c].lowpass(hiss_cut[c].highpass(src[c].next()));
      out[c] = body_gain * kit::hermite(b[0], b[1], b[2], b[3], t) +
               buzz_gain[c] * kit::hermite(z[0], z[1], z[2], z[3], t) + hiss_gain * hiss;
    }
  }
};

}  // namespace noise_beds
}  // namespace livemix
