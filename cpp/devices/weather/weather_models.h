#pragma once

// The weathers of Weather: one small model per kind of weather, each with
// statistics of its own and none of them an LFO. A model is stepped on the
// device's control clock and says, for each side, how much of the sound is
// covered just now (0 is open sky, 1 is the most this weather does at full
// Force); the device turns that into level, brightness and the weather's own
// sound.
//
// Time comes in two kinds. Model time is real time multiplied by Pace: the
// gusts, shadows, showers and waves live in it, so Pace plays the same
// weather faster or slower. Real time is what a drop's tick and duck and a
// roll of thunder take, whatever the Pace.
//
// Every random draw comes from a generator seeded with a constant, and a
// model only moves when it is stepped, so a render is the same every time and
// at every block size.

#include "../../kit/kit.h"

namespace livemix {
namespace weather_models {

// An unrelated seed per stream (seeding one xorshift from the next output of
// another would hand out the same sequence one step apart).
inline uint32_t seed_for(uint32_t stream) {
  uint32_t x = (stream + 1u) * 0x9E3779B9u;
  x ^= x >> 16;
  x *= 0x85EBCA6Bu;
  x ^= x >> 13;
  x *= 0xC2B2AE35u;
  x ^= x >> 16;
  return x == 0 ? 0x2545F491u : x;
}

// White noise with unit variance at 48 kHz and the same power per hertz at
// every sample rate.
struct Source {
  kit::Rng rng;
  float scale = 1.7320508f;

  void init(uint32_t stream, float sample_rate) {
    rng.seed(seed_for(stream));
    scale = std::sqrt(3.0f * sample_rate / 48000.0f);
  }
  float next() { return rng.bipolar() * scale; }
};

// The length of a lull in units of its mean: exponential, as the gaps of
// things that happen by chance are, but never more than three means, so no
// lull is absurdly long. The division brings the mean back to 1.
constexpr float kLongestLull = 3.0f;
constexpr float kLullMean = 0.950213f;  // 1 - exp(-3)
inline float lull(kit::Rng& rng) {
  const float u = kit::max(rng.uniform(), 1.0e-6f);
  return kit::min(kLongestLull, -std::log(u)) * (1.0f / kLullMean);
}

// The wait for the next event of a stream that fires once per unit on average.
inline float poisson(kit::Rng& rng) {
  return -std::log(kit::max(rng.uniform(), 1.0e-6f));
}

inline float smoothstep(float x) {
  x = clamp01(x);
  return x * x * (3.0f - 2.0f * x);
}

// The share of the way to its target a one-pole goes in `dt` with the time
// constant `seconds`.
inline float approach(float dt, float seconds) { return 1.0f - std::exp(-dt / seconds); }

// How much of an event each side gets when it stands at `pan` (-1 left, 1
// right): all of it on its own side and in the middle, less on the far side.
constexpr float kFarSide = 0.6f;
inline void lean(float pan, float* left, float* right) {
  *left = 1.0f - kFarSide * kit::max(0.0f, pan);
  *right = 1.0f - kFarSide * kit::max(0.0f, -pan);
}

// A first-order low-pass that is the same filter at 44.1, 48 and 96 kHz as
// nearly as one pole and one zero can be: the pole of the bilinear filter and
// a zero that leaves `top` of the analogue filter's response at half the
// sample rate (0 leaves none, the plain bilinear filter). kit::OnePole has a
// pole only, so what it takes off a top end (the input less the low-pass)
// stops short by sample rate: 23 dB of a 26 dB shelf at 48 kHz, 24 at 96.
struct Pole {
  float x1 = 0.0f, y1 = 0.0f;
  float b0 = 1.0f, b1 = 0.0f, p = 0.0f;

  void reset() { x1 = y1 = 0.0f; }
  void set(float hz, float sample_rate, float top = 0.0f) {
    const float f = kit::clamp(hz, 1.0f, 0.45f * sample_rate);
    const float g = kit::tan_prewarp(kit::kPi * f / sample_rate);
    p = (1.0f - g) / (1.0f + g);
    float at_top = 0.0f;
    if (top > 0.0f) {
      const float ratio = 0.5f * sample_rate / f;
      at_top = top / std::sqrt(1.0f + ratio * ratio);
    }
    b0 = 0.5f * ((1.0f - p) + at_top * (1.0f + p));
    b1 = 0.5f * ((1.0f - p) - at_top * (1.0f + p));
  }
  void tune_as(const Pole& other) {
    b0 = other.b0;
    b1 = other.b1;
    p = other.p;
  }
  float lowpass(float x) {
    y1 = flush_denormal(b0 * x + b1 * x1 + p * y1);
    x1 = x;
    return y1;
  }
  float highpass(float x) { return x - lowpass(x); }
};

// A swell: something that comes up quickly, holds and sinks back slowly, at
// random moments. Gusts of wind and showers of rain are both this. An event
// has a size and a hold; the level runs at the size with one time constant
// while the event holds and falls back to nothing with another after it.
struct Swell {
  // Set once by the owner.
  float hold_min = 0.3f;
  float hold_span = 0.9f;
  float size_min = 0.45f;

  kit::Rng rng;
  float wait = 0.0f;   // of the lull before the next event, in means
  float hold = 0.0f;   // seconds of model time left of this event
  float size = 0.0f;
  float level = 0.0f;
  float pan = 0.0f;    // where the event stands, -1..1

  void init(uint32_t stream, float first_wait) {
    rng.seed(seed_for(stream));
    wait = first_wait;
    hold = 0.0f;
    size = 0.0f;
    level = 0.0f;
    pan = 0.0f;
  }

  // One step of `dt` seconds of model time. `gap` is the mean lull in
  // seconds, `rise` and `fall` the shares a step goes towards the event and
  // back (approach(dt, ...)). True when an event begins.
  bool step(float dt, float gap, float rise, float fall) {
    bool began = false;
    if (hold > 0.0f) {
      hold -= dt;
    } else {
      wait -= dt / kit::max(gap, 1.0e-3f);
      if (wait <= 0.0f) {
        size = size_min + (1.0f - size_min) * rng.uniform();
        hold = hold_min + hold_span * rng.uniform();
        pan = rng.bipolar();
        wait = lull(rng);
        began = true;
      }
    }
    const float drive = hold > 0.0f ? size : 0.0f;
    level = flush_denormal(level + (drive - level) * (drive > level ? rise : fall));
    return began;
  }
};

// Band-limited random movement for the flutter of a gust and the roll of
// thunder: white noise through two equal poles, scaled so that it stays
// inside -1..1 (two standard deviations are 1; the rest is clipped).
struct Flutter {
  kit::Rng rng;
  float a = 0.0f, b = 0.0f;

  void init(uint32_t stream) {
    rng.seed(seed_for(stream));
    a = b = 0.0f;
  }
  // `share` is approach(dt, time constant); `norm` is norm_for(share).
  float step(float share, float norm) {
    a += (rng.bipolar() - a) * share;
    b += (a - b) * share;
    return kit::clamp(b * norm, -1.0f, 1.0f);
  }
  // Uniform noise has a variance of 1/3; two equal poles leave share/4 of it.
  static float norm_for(float share) {
    return 0.5f / std::sqrt(kit::max(share, 1.0e-6f) * (1.0f / 12.0f));
  }
};

// Wind: gusts. A gust rises in a tenth of a second or two and dies away over
// seconds, and while it blows it flutters, each side a little by itself.
struct Wind {
  static constexpr float kRise = 0.12f;      // seconds of model time
  static constexpr float kFall = 1.8f;
  static constexpr float kHoldMin = 0.3f;    // a gust blows for 0.3 to 1.2 s
  static constexpr float kHoldSpan = 0.9f;
  static constexpr float kSizeMin = 0.45f;
  static constexpr float kGapMin = 0.6f;     // the mean lull at Calm 0 and at Calm 1
  static constexpr float kGapMax = 20.0f;
  static constexpr float kFlutter = 0.4f;    // how far turbulence moves a gust, as a share of it
  static constexpr float kFlutterSeconds = 0.05f;
  static constexpr float kTurnSeconds = 0.5f;  // how quickly the wind comes round to a new side

  Swell gust;
  Flutter shared, own[2];
  float pan = 0.0f;
  float cover[2] = {0.0f, 0.0f};  // each side, 0..1
  float blow[2] = {0.0f, 0.0f};   // the gust with its flutter before it leans, for the whistle
  float rise = 0.0f, fall = 0.0f, turn = 0.0f, flutter = 0.0f, norm = 1.0f;
  float stepped = -1.0f;

  static float gap(float calm) { return kGapMin * std::pow(kGapMax / kGapMin, calm); }

  void init(uint32_t stream) {
    gust.hold_min = kHoldMin;
    gust.hold_span = kHoldSpan;
    gust.size_min = kSizeMin;
    // The first gust comes soon, so the weather is there when it is switched in.
    gust.init(stream, 0.25f);
    shared.init(stream + 1);
    own[0].init(stream + 2);
    own[1].init(stream + 3);
    pan = 0.0f;
    cover[0] = cover[1] = 0.0f;
    blow[0] = blow[1] = 0.0f;
    stepped = -1.0f;
  }

  // `lull_seconds` is gap(Calm), which the device works out when Calm moves.
  void step(float dt, float lull_seconds, float sway) {
    if (dt != stepped) {
      stepped = dt;
      rise = approach(dt, kRise);
      fall = approach(dt, kFall);
      turn = approach(dt, kTurnSeconds);
      flutter = approach(dt, kFlutterSeconds);
      norm = Flutter::norm_for(flutter);
    }
    gust.step(dt, lull_seconds, rise, fall);
    pan += (gust.pan - pan) * turn;
    const float together = shared.step(flutter, norm);
    float weight[2];
    lean(pan * sway, &weight[0], &weight[1]);
    for (int c = 0; c < 2; ++c) {
      const float apart = own[c].step(flutter, norm);
      const float moved = together + (apart - together) * sway;
      blow[c] = clamp01(gust.level * (1.0f + kFlutter * moved));
      cover[c] = blow[c] * weight[c];
    }
  }
  float level() const { return 0.5f * (cover[0] + cover[1]); }
};

// Clouds: shadows. A shadow comes over in a third of its length, lies there
// and passes; with Sway one side is in it before the other. While it lies it
// thins and thickens a little.
struct Clouds {
  static constexpr float kLengthMin = 4.0f;   // a shadow lasts 4 to 12 s of model time
  static constexpr float kLengthSpan = 8.0f;
  static constexpr float kEdge = 0.3f;        // the share of its length each edge takes
  static constexpr float kDepthMin = 0.65f;
  static constexpr float kGapMin = 1.0f;      // the mean of the sun between two shadows
  static constexpr float kGapMax = 30.0f;
  static constexpr float kThin = 0.2f;        // how far a shadow thins while it lies
  static constexpr float kThinHz[2] = {0.13f, 0.21f};

  kit::Rng rng;
  float wait = 0.0f;
  float x = 0.0f;        // seconds of model time into the shadow
  float length = 0.0f;   // 0 while the sun is out
  float depth = 0.0f;
  float side = 1.0f;     // 1 when the left is shadowed first
  float phase[2] = {0.0f, 0.0f};
  float cover[2] = {0.0f, 0.0f};

  static float gap(float calm) { return kGapMin * std::pow(kGapMax / kGapMin, calm); }

  // The shadow over one place `at` seconds after it arrives there, for a
  // shadow `span` seconds long: 0 outside it, 1 under its middle.
  static float shape(float at, float span) {
    if (at <= 0.0f || at >= span) return 0.0f;
    const float edge = kEdge * span;
    if (at < edge) return smoothstep(at / edge);
    if (at > span - edge) return smoothstep((span - at) / edge);
    return 1.0f;
  }

  void init(uint32_t stream) {
    rng.seed(seed_for(stream));
    wait = 0.15f;
    x = 0.0f;
    length = 0.0f;
    depth = 0.0f;
    side = 1.0f;
    phase[0] = 0.0f;
    phase[1] = 0.37f;
    cover[0] = cover[1] = 0.0f;
  }

  void step(float dt, float lull_seconds, float sway) {
    for (int i = 0; i < 2; ++i) {
      phase[i] += kThinHz[i] * dt;
      if (phase[i] >= 1.0f) phase[i] -= 1.0f;
    }
    if (length <= 0.0f) {
      cover[0] = cover[1] = 0.0f;
      wait -= dt / lull_seconds;
      if (wait > 0.0f) return;
      length = kLengthMin + kLengthSpan * rng.uniform();
      depth = kDepthMin + (1.0f - kDepthMin) * rng.uniform();
      side = rng.uniform() < 0.5f ? 1.0f : -1.0f;
      wait = lull(rng);
      x = 0.0f;
    }
    x += dt;
    // With Sway each side has a shorter shadow of its own, one an edge's
    // time behind the other, and both inside the whole.
    const float behind = kEdge * length * sway;
    const float span = length - behind;
    const float thin =
        1.0f - kThin * (0.5f + 0.25f * (kit::SineTable::lookup(phase[0]) +
                                        kit::SineTable::lookup(phase[1])));
    cover[0] = depth * thin * shape(x - (side > 0.0f ? 0.0f : behind), span);
    cover[1] = depth * thin * shape(x - (side > 0.0f ? behind : 0.0f), span);
    if (x >= length) length = 0.0f;
  }
  float level() const { return 0.5f * (cover[0] + cover[1]); }
};

// One drop of rain as it sounds: a short sine that bends upwards while it
// dies, the note of a drop into water when it is low and slow, a tick when it
// is high and short.
struct Drop {
  float phase = 0.0f;
  float inc = 0.0f;
  float bend = 1.0f;
  float amp = 0.0f;
  float decay = 0.0f;
  float gain[2] = {0.0f, 0.0f};

  void reset() {
    phase = inc = amp = decay = 0.0f;
    bend = 1.0f;
    gain[0] = gain[1] = 0.0f;
  }
  // Adds its next sample to both sides.
  void render(float* left, float* right) {
    if (amp <= 0.0f) return;
    const float s = amp * kit::SineTable::lookup(phase);
    *left += s * gain[0];
    *right += s * gain[1];
    phase += inc;
    if (phase >= 1.0f) phase -= 1.0f;
    inc = kit::min(inc * bend, 0.4f);
    amp *= decay;
    if (amp < 1.0e-5f) amp = 0.0f;
  }
};

// Rain: drops, by chance, so many a second as Force and Pace say and the
// shower allows. Showers swell and thin (a Swell in model time, over a floor
// that Calm takes away); in a storm the rain comes in sheets with the gusts
// instead. Each drop ducks the sound a little on the side it falls and sounds
// its own note. The thicker it falls the smaller each duck (duck_share), so
// the ducks together are bounded.
struct Rain {
  static constexpr int kDrops = 6;
  static constexpr float kRate = 24.0f;        // drops a second at Force 1, Pace 1 in the thick of a shower
  static constexpr float kRise = 1.2f;         // a shower, in seconds of model time
  static constexpr float kFall = 2.5f;
  static constexpr float kHoldMin = 2.0f;
  static constexpr float kHoldSpan = 5.0f;
  static constexpr float kShowerMin = 0.6f;
  static constexpr float kGapMin = 1.5f;
  static constexpr float kGapMax = 24.0f;
  static constexpr float kFloor = 0.55f;       // the rain between showers at Calm 0, as a share of their thickest
  static constexpr float kSheetFloor = 0.2f;   // in a storm: the rain between gusts
  static constexpr float kSizeMin = 0.35f;
  static constexpr float kDuckSeconds = 0.035f;  // real time
  static constexpr float kDuckMost = 3.0f;
  // The ducks of all the drops together stay under this on average however
  // thick it rains (as a cover of 1 - exp(-0.25), a fifth of the layer's
  // depth): a thick rain taps on the sound and does not turn it down.
  static constexpr float kDuckMean = 0.25f;
  static constexpr float kMeanSize = kSizeMin + (1.0f - kSizeMin) / 3.0f;
  static constexpr float kLowHz = 450.0f;      // the lowest drop at Colour 0 and at Colour 1
  static constexpr float kHighHz = 4200.0f;
  static constexpr float kOctaves = 1.3f;      // how far above that drops are scattered
  static constexpr float kRingSeconds = 0.010f;  // a drop at 1 kHz dies in this; lower ones ring longer
  static constexpr float kBend = 1.6f;         // how far its pitch has risen after three of those
  static constexpr int kMostPerStep = 4;

  Swell shower;
  kit::Rng rng;
  Drop drops[kDrops];
  float wait = 0.0f;
  float duck[2] = {0.0f, 0.0f};
  float cover[2] = {0.0f, 0.0f};
  float density = 0.0f;
  float rise = 0.0f, fall = 0.0f, stepped = -1.0f;
  float duck_keep = 0.0f, stepped_real = -1.0f;
  int next = 0;
  int count = 0;

  static float gap(float calm) { return kGapMin * std::pow(kGapMax / kGapMin, calm); }
  static float floor(float calm) { return kFloor * (1.0f - calm) * (1.0f - calm); }
  // How much of its duck a drop keeps when `rate` of them fall in a second:
  // all of it while they stand apart, less as they pile up, so that the mean
  // of the ducks together never passes kDuckMean.
  static float duck_share(float rate) {
    const float piled = rate * kDuckSeconds * kMeanSize * (1.0f / kDuckMean);
    return 1.0f / std::sqrt(1.0f + piled * piled);
  }

  void init(uint32_t stream) {
    shower.hold_min = kHoldMin;
    shower.hold_span = kHoldSpan;
    shower.size_min = kShowerMin;
    shower.init(stream, 0.1f);
    rng.seed(seed_for(stream + 1));
    for (Drop& drop : drops) drop.reset();
    wait = 0.3f;
    duck[0] = duck[1] = 0.0f;
    cover[0] = cover[1] = 0.0f;
    density = 0.0f;
    stepped = stepped_real = -1.0f;
    next = 0;
    count = 0;
  }

  // `dt` is model time and `real` real time, both in seconds; `lull_seconds`
  // is gap(Calm) and `low` floor(Calm); `sheets` is how much of a storm this
  // is (0 rain alone, 1 storm) and `gust` the wind's level then.
  void step(float dt, float real, float force, float pace, float lull_seconds, float low,
            float sway, float colour, float sheets, float gust, float sample_rate) {
    if (dt != stepped) {
      stepped = dt;
      rise = approach(dt, kRise);
      fall = approach(dt, kFall);
    }
    if (real != stepped_real) {
      stepped_real = real;
      duck_keep = std::exp(-real / kDuckSeconds);
    }
    shower.step(dt, lull_seconds, rise, fall);
    const float alone = low + (1.0f - low) * shower.level;
    const float in_sheets = kSheetFloor + (1.0f - kSheetFloor) * gust;
    density = alone + (in_sheets - alone) * sheets;

    duck[0] *= duck_keep;
    duck[1] *= duck_keep;
    const float rate = kRate * force * pace * density;
    const float share = duck_share(rate);
    wait -= rate * real;
    for (int n = 0; wait <= 0.0f; ++n) {
      if (n == kMostPerStep) {
        wait = poisson(rng);
        break;
      }
      strike(force, sway, colour, share, sample_rate);
      wait += poisson(rng);
    }
    for (int c = 0; c < 2; ++c) {
      duck[c] = flush_denormal(kit::min(duck[c], kDuckMost));
      cover[c] = 1.0f - std::exp(-duck[c]);
    }
  }

  void strike(float force, float sway, float colour, float share, float sample_rate) {
    const float u = rng.uniform();
    const float size = kSizeMin + (1.0f - kSizeMin) * u * u;
    const float pan = rng.bipolar() * sway;
    const float hz = kLowHz * std::pow(kHighHz / kLowHz, colour) * std::exp2(kOctaves * rng.uniform());
    const float ring = kRingSeconds * std::sqrt(1000.0f / hz);
    Drop& drop = drops[next];
    next = (next + 1) % kDrops;
    drop.phase = 0.0f;
    drop.inc = kit::min(hz / sample_rate, 0.4f);
    drop.bend = std::exp(std::log(kBend) / (3.0f * ring * sample_rate));
    // A light rain has small drops: the note of one grows with the root of
    // Force, and with how many fall the rain as a whole grows with Force.
    drop.amp = size * std::sqrt(force);
    drop.decay = std::exp(-1.0f / (ring * sample_rate));
    // In the middle it is whole on both sides; hard over, whole on one and
    // gone from the other. The duck falls where the drop does.
    drop.gain[0] = kit::min(1.0f, 1.0f - pan);
    drop.gain[1] = kit::min(1.0f, 1.0f + pan);
    duck[0] += share * size * drop.gain[0];
    duck[1] += share * size * drop.gain[1];
    count = (count + 1) & 0xFFFFF;
  }
  float level() const { return density; }
};

// Surf: one wave after another. A wave gathers over half its length, breaks
// in a twelfth of it and draws back; with Sway it gathers and breaks on one
// side and its wash runs across to the other.
struct Surf {
  static constexpr float kWave = 7.0f;       // seconds of model time, give or take a fifth
  static constexpr float kJitter = 0.2f;
  static constexpr float kGather = 0.5f;     // shares of the wave's length
  static constexpr float kBreak = 0.08f;
  static constexpr float kDraw = 0.14f;      // the time constant of the drawing back
  static constexpr float kLand = 0.1f;       // the last of it lands on nothing
  static constexpr float kGatherTo = 0.5f;   // how high the swell stands when it breaks
  static constexpr float kHeightMin = 0.6f;
  static constexpr float kGapMax = 14.0f;    // the mean lull between two waves at Calm 1
  static constexpr float kRun = 0.8f;        // how far to its side a wave gathers at full Sway
  static constexpr float kRunOver = 0.4f;    // and the share of it in which its wash crosses over

  kit::Rng rng;
  float wait = 0.0f;
  float x = 0.0f;
  float length = 0.0f;   // 0 between waves
  float height = 0.0f;
  float side = 1.0f;
  float at = 0.0f;       // where in the wave, 0..1
  float swell = 0.0f;    // its shape there, 0..1
  float cover[2] = {0.0f, 0.0f};

  static float gap(float calm) { return kGapMax * calm * calm; }

  // A wave's height at `at` (0..1 of its length), 1 at the moment it has broken.
  static float shape(float at) {
    if (at <= 0.0f || at >= 1.0f) return 0.0f;
    if (at < kGather) {
      const float t = at * (1.0f / kGather);
      return kGatherTo * t * t;
    }
    if (at < kGather + kBreak) {
      return kGatherTo + (1.0f - kGatherTo) * smoothstep((at - kGather) * (1.0f / kBreak));
    }
    return std::exp(-(at - kGather - kBreak) * (1.0f / kDraw)) *
           (1.0f - smoothstep((at - (1.0f - kLand)) * (1.0f / kLand)));
  }

  void init(uint32_t stream) {
    rng.seed(seed_for(stream));
    wait = 0.0f;
    x = 0.0f;
    length = 0.0f;
    height = 0.0f;
    side = 1.0f;
    at = 0.0f;
    swell = 0.0f;
    cover[0] = cover[1] = 0.0f;
  }

  void step(float dt, float lull_seconds, float sway) {
    if (length <= 0.0f) {
      at = 0.0f;
      swell = 0.0f;
      cover[0] = cover[1] = 0.0f;
      // At Calm 0 there is no lull: the next wave gathers as this one lands.
      if (lull_seconds > 1.0e-3f) {
        wait -= dt / lull_seconds;
        if (wait > 0.0f) return;
      }
      length = kWave * (1.0f + kJitter * rng.bipolar());
      height = kHeightMin + (1.0f - kHeightMin) * rng.uniform();
      side = rng.uniform() < 0.5f ? 1.0f : -1.0f;
      wait = lull(rng);
      x = 0.0f;
    }
    x += dt;
    at = kit::min(1.0f, x / length);
    swell = shape(at);
    // It gathers and breaks on one side, and its wash runs across to the other.
    const float run = 1.0f - 2.0f * smoothstep((at - kGather) * (1.0f / kRunOver));
    float weight[2];
    lean(side * sway * kRun * run, &weight[0], &weight[1]);
    cover[0] = height * swell * weight[0];
    cover[1] = height * swell * weight[1];
    if (x >= length) length = 0.0f;
  }
  float level() const { return 0.5f * (cover[0] + cover[1]); }
};

// Thunder, far off: now and then a roll that is there in a moment and dies
// away over seconds, unevenly. The waits are model time; a roll itself takes
// what it takes whatever the Pace.
struct Thunder {
  static constexpr float kGapMin = 6.0f;     // the mean wait at Calm 0 and at Calm 1
  static constexpr float kGapMax = 30.0f;
  static constexpr float kAttack = 0.03f;    // real seconds
  static constexpr float kDecay = 1.6f;
  static constexpr float kSizeMin = 0.5f;
  static constexpr float kRollSeconds = 0.06f;
  static constexpr float kRoll = 0.45f;      // how far the roll moves it, as a share of it

  kit::Rng rng;
  Flutter roll;
  float wait = 0.0f;
  float size = 0.0f;
  float env = 0.0f;
  float level = 0.0f;
  float attack = 0.0f, keep = 0.0f, roll_share = 0.0f, roll_norm = 1.0f, stepped = -1.0f;
  bool striking = false;
  int count = 0;

  static float gap(float calm) { return kGapMin * std::pow(kGapMax / kGapMin, calm); }

  void init(uint32_t stream) {
    rng.seed(seed_for(stream));
    roll.init(stream + 1);
    wait = 0.35f;
    size = env = level = 0.0f;
    stepped = -1.0f;
    striking = false;
    count = 0;
  }

  void step(float dt, float real, float lull_seconds) {
    if (real != stepped) {
      stepped = real;
      attack = approach(real, kAttack);
      keep = std::exp(-real / kDecay);
      roll_share = approach(real, kRollSeconds);
      roll_norm = Flutter::norm_for(roll_share);
    }
    wait -= dt / lull_seconds;
    if (wait <= 0.0f) {
      size = kSizeMin + (1.0f - kSizeMin) * rng.uniform();
      wait = lull(rng);
      striking = true;
      count = (count + 1) & 0xFFFFF;
    }
    if (striking) {
      env += (size - env) * attack;
      if (env >= 0.95f * size) striking = false;
    } else {
      env = flush_denormal(env * keep);
    }
    level = env * (1.0f - kRoll * (0.5f + 0.5f * roll.step(roll_share, roll_norm)));
  }
};

}  // namespace weather_models
}  // namespace livemix
