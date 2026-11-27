#pragma once

// What Closed Eyes looks at (six sources) and what is left when it looks
// away (six opposites). Numbers only: where the partials sit, how strong each
// is, how long it rings, and which way it leans. closed_eyes.h plays them.

#include "../../kit/kit.h"

namespace livemix {
namespace closed_eyes {

constexpr int kLanes = 4;
constexpr int kPartials = 32;  // of the note
constexpr int kImages = 16;    // of the after-image

enum SourceKind : int { kLamp = 0, kReed, kBowl, kVowel, kStruck, kString, kNumSources };
enum OpponentKind : int { kEven = 0, kMirror, kSides, kRough, kBreath, kBelow, kNumOpponents };

// Where a source's partials sit and how they ring; fixed when a key is struck.
struct Spectrum {
  float ratio[kPartials] = {};
  float ring[kPartials] = {};  // seconds to fall 60 dB; 0 sounds for as long as the key is held
  float side[kPartials] = {};
  int count = 0;
};

// The air round a source: two bands of noise.
struct Air {
  float low_hz = 1000.0f, high_hz = 3000.0f;
  float low_q = 2.0f, high_q = 1.5f;
  float low = 1.0f, high = 0.5f;  // how strong each band is
  float steady = 1.0f;            // of it that goes on as the note sounds
  float burst = 1.0f;             // of it that comes with the onset
  float burst_seconds = 0.06f;
};

inline bool percussive(int source) { return source == kStruck || source == kString; }

// 1 at the centre, a half one width away.
inline float bump(float hz, float centre, float width) {
  const float x = (hz - centre) / width;
  return 1.0f / (1.0f + x * x);
}
// From one frequency to another by equal steps to the ear.
inline float sweep(float from, float to, float t) { return from * std::pow(to / from, t); }
// A gentle roof: 1 far under `hz`, falling 12 dB an octave above it.
inline float roof(float hz, float corner) {
  const float x = hz / corner;
  return 1.0f / (1.0f + x * x);
}

// The struck bar, bell and glass: eight modes each, brought into tune with
// the key and, the second, with its octave or double octave.
inline float struck_ratio(int mode, float form) {
  static constexpr float kBar[8] = {1.0f, 4.0f, 9.2f, 10.1f, 16.4f, 17.6f, 24.0f, 25.5f};
  static constexpr float kBell[8] = {1.0f, 2.0f, 2.994f, 4.17f, 5.43f, 6.79f, 8.21f, 10.3f};
  static constexpr float kGlass[8] = {1.0f, 2.32f, 4.25f, 6.63f, 9.38f, 12.5f, 15.95f, 19.75f};
  const float x = kit::clamp(form, 0.0f, 1.0f) * 2.0f;
  const float* from = x < 1.0f ? kBar : kBell;
  const float* to = x < 1.0f ? kBell : kGlass;
  const float t = x < 1.0f ? x : x - 1.0f;
  return from[mode] * std::pow(to[mode] / from[mode], t);
}

inline void tune_source(int source, float hz, float form, float colour, float top_hz, Spectrum* out) {
  static constexpr float kBowlModes[6] = {1.0f, 2.71f, 5.15f, 8.2f, 11.7f, 15.6f};
  const float octaves = std::log2(261.6256f / hz);  // below middle C
  const float key_ring = kit::clamp(std::exp2(0.4f * octaves), 0.35f, 2.0f);
  int count = kPartials;
  for (int k = 0; k < kPartials; ++k) {
    const float n = static_cast<float>(k + 1);
    float ratio = n, ring = 0.0f;
    float side = (k == 0) ? 0.0f : ((k & 1) ? 0.75f : -0.75f) * kit::min(1.0f, 0.28f * n);
    switch (source) {
      case kBowl: {
        // Six modes, each a pair a few cents apart: the slow turning of a rim.
        const int mode = k / 2;
        if (mode >= 6) {
          count = kit::min(count, k);
          break;
        }
        const float apart = 0.6f + 2.6f * form * form + 0.35f * static_cast<float>(mode);
        ratio = kBowlModes[mode] * kit::cents_to_ratio((k & 1) ? apart : -apart);
        side = (k & 1) ? 0.95f : -0.95f;
        break;
      }
      case kStruck: {
        const int mode = k / 2;
        if (mode >= 8) {
          count = kit::min(count, k);
          break;
        }
        const float apart = mode == 0 ? 0.25f : 0.5f + 0.25f * static_cast<float>(mode);
        ratio = struck_ratio(mode, form) * kit::cents_to_ratio((k & 1) ? apart : -apart);
        side = ((k & 1) ? 0.85f : -0.85f) * (mode == 0 ? 0.5f : 1.0f);
        // Wood is short, a bell is long, glass between; upper modes sooner.
        const float body = form < 0.5f ? kit::lerp(1.7f, 18.0f, form * 2.0f) : kit::lerp(18.0f, 8.0f, form * 2.0f - 1.0f);
        const float damp = kit::lerp(0.65f, 0.18f, kit::min(1.0f, form * 2.0f)) * (1.4f - 0.8f * colour);
        ring = body * key_ring / (1.0f + damp * (ratio - 1.0f));
        break;
      }
      case kString: {
        // A stiff string, its first partial on the key.
        ratio = n * std::sqrt((1.0f + 6.0e-5f * n * n) / (1.0f + 6.0e-5f));
        ring = kit::lerp(11.0f, 2.4f, form) * key_ring / (1.0f + (0.42f - 0.3f * colour) * (n - 1.0f));
        break;
      }
      case kVowel:
        side = ((k & 1) ? 0.65f : -0.65f) * (k == 0 ? 0.2f : 1.0f);
        break;
      case kReed:
        side *= 0.2f;
        break;
      default:
        break;
    }
    if (k >= count) ratio = 0.0f;
    if (ratio * hz > top_hz) count = kit::min(count, k);
    out->ratio[k] = ratio;
    out->ring[k] = ring;
    out->side[k] = side;
  }
  out->count = count > 1 ? count : 1;
}

// Two vowels' worth of formants between which Form walks: oo, oh, ah, eh, ee.
inline void formants(float form, float hz[3], float gain[3]) {
  static constexpr float kHz[5][3] = {
      {320.0f, 800.0f, 2250.0f}, {450.0f, 820.0f, 2600.0f}, {720.0f, 1180.0f, 2650.0f},
      {520.0f, 1800.0f, 2550.0f}, {300.0f, 2150.0f, 2950.0f}};
  static constexpr float kGain[5][3] = {
      {1.0f, 0.22f, 0.04f}, {1.0f, 0.5f, 0.12f}, {1.0f, 0.75f, 0.34f}, {1.0f, 0.5f, 0.4f}, {1.0f, 0.36f, 0.4f}};
  const float x = kit::clamp(form, 0.0f, 1.0f) * 3.9999f;
  const int i = static_cast<int>(x);
  const float t = x - static_cast<float>(i);
  for (int f = 0; f < 3; ++f) {
    hz[f] = kHz[i][f] * std::pow(kHz[i + 1][f] / kHz[i][f], t);
    gain[f] = kit::lerp(kGain[i][f], kGain[i + 1][f], t);
  }
}

// How strong each partial is for a touch of this hardness. The level is
// brought halfway between one power and one sum, so that a note of many
// partials is neither much louder nor much peakier than a plain one.
inline void weigh_source(int source, const Spectrum& spectrum, float hz, float form, float colour, float gain,
                         float* weight, float* brightness) {
  // A harder touch is brighter, and high keys are rounder than low ones.
  const float octaves = std::log2(261.6256f / hz);
  const float bright = kit::clamp(colour + 0.35f * (gain - 0.7f), 0.0f, 1.2f);
  const float lean = kit::clamp(0.16f * octaves, -0.3f, 0.3f);
  float centre[3] = {}, strength[3] = {};
  if (source == kVowel) formants(form, centre, strength);
  for (int k = 0; k < kPartials; ++k) {
    weight[k] = 0.0f;
    if (k >= spectrum.count) continue;
    const float r = spectrum.ratio[k];
    const float at = hz * r;
    const int n = k + 1;
    const bool even = (n & 1) == 0;
    float w = 0.0f;
    switch (source) {
      case kReed: {
        // A free reed in a small case: from hollow to full, with two resonances.
        const float tilt = kit::lerp(1.3f, -0.25f, bright) - lean;
        w = std::pow(r, -tilt) * (even ? kit::lerp(0.06f, 1.0f, form) : 1.0f);
        w *= 0.3f + kit::lerp(1.6f, 0.4f, form) * bump(at, sweep(500.0f, 1700.0f, form), 250.0f) +
             sweep(0.7f, 6.5f, form) * bump(at, 2500.0f, 600.0f);
        if (n == 1) w *= kit::lerp(1.0f, 0.3f, form);
        w *= roof(at, sweep(1200.0f, 11500.0f, bright));
        break;
      }
      case kBowl: {
        const float mode = static_cast<float>(k / 2);
        w = std::pow(r, -kit::lerp(2.6f, -0.3f, kit::clamp(0.5f * bright + 0.5f * form, 0.0f, 1.0f)) + 0.5f * lean);
        if (mode == 1.0f) w *= 0.6f + 0.9f * form;
        if (mode == 2.0f) w *= 1.3f;
        w *= (k & 1) ? 0.45f : 1.0f;
        w *= roof(at, sweep(900.0f, 9500.0f, bright));
        break;
      }
      case kVowel: {
        const float tilt = kit::lerp(1.6f, 0.2f, bright) - lean;
        float body = 0.005f + (n == 1 ? 0.14f : 0.0f);
        static constexpr float kWidth[3] = {55.0f, 70.0f, 130.0f};
        for (int f = 0; f < 3; ++f) body += strength[f] * bump(at, centre[f], kWidth[f]) * (f == 0 ? 1.0f : 0.4f + 1.1f * bright);
        w = std::pow(r, -tilt) * body * roof(at, sweep(1300.0f, 7000.0f, bright));
        break;
      }
      case kStruck: {
        w = std::pow(r, -kit::lerp(2.1f, -0.5f, bright) + 0.6f * lean);
        if (k / 2 == 0) w *= kit::lerp(1.0f, 0.75f, bright);
        w *= (k & 1) ? 0.8f : 1.0f;
        w *= roof(at, sweep(900.0f, 11000.0f, bright));
        break;
      }
      case kString: {
        // Plucked from close to the bridge, wiry and long, to the middle,
        // hollow and soon damped.
        const float place = kit::lerp(0.07f, 0.49f, form);
        const float pluck = std::fabs(std::sin(kit::kPi * place * r));
        w = (0.04f + pluck) * std::pow(r, -kit::lerp(2.7f, 0.4f, bright) + lean);
        w *= 0.8f + 0.7f * bump(at, 210.0f, 70.0f) + 0.6f * bump(at, 430.0f, 120.0f) + 0.4f * bump(at, 1100.0f, 350.0f);
        w *= roof(at, sweep(560.0f, 9500.0f, bright) * sweep(1.6f, 0.6f, form));
        break;
      }
      case kLamp:
      default: {
        // A filament behind glass: odd partials, then all, then octaves.
        const float tilt = kit::lerp(3.5f, 0.6f, bright) - lean;
        float colourful = even ? kit::min(1.0f, 0.05f + 1.5f * form) : 1.0f;
        const bool octave = n == 2 || n == 4 || n == 8 || n == 16;
        if (form > 0.6f) colourful *= octave ? 1.0f + 4.5f * (form - 0.6f) : 1.0f - 1.6f * (form - 0.6f) * (n > 1 ? 1.0f : 0.0f);
        w = std::pow(r, -tilt) * colourful;
        w *= 0.7f + 1.6f * bump(at, sweep(380.0f, 1500.0f, form), 300.0f);
        w *= roof(at, sweep(480.0f, 7500.0f, bright));
        break;
      }
    }
    weight[k] = w;
  }
  float sum = 1.0e-9f, power = 1.0e-12f;
  for (int k = 0; k < spectrum.count; ++k) {
    sum += weight[k];
    power += weight[k] * weight[k];
  }
  const float scale = 1.0f / std::sqrt(sum * std::sqrt(power));
  // Where the note's weight lies, in octaves above its key.
  float above = 0.0f;
  for (int k = 0; k < spectrum.count; ++k) above += weight[k] * weight[k] * std::log2(kit::max(spectrum.ratio[k], 1.0f));
  *brightness = above / power;
  // The same loudness along the keyboard, not the same peak.
  const float even_out = kit::clamp(std::pow(hz / 261.6256f, -0.1f), 0.75f, 1.3f);
  for (int k = 0; k < spectrum.count; ++k) weight[k] *= scale * even_out;
}

// How slowly a source takes up its attack: a reed speaks, a rim has to be
// rubbed into sound.
inline float attack_scale(int source) {
  static constexpr float kScale[kNumSources] = {1.0f, 0.3f, 2.8f, 1.5f, 1.0f, 1.0f};
  return kScale[source];
}
// The turning of a rubbed rim and a singer's swell: how deep, and how fast.
inline float pulse_depth(int source, float form) {
  return source == kBowl ? 0.42f + 0.3f * form : (source == kVowel ? 0.3f : 0.0f);
}
// How slowly its opposite comes up, against After Rise.
inline float rise_scale(int source) {
  static constexpr float kScale[kNumSources] = {1.0f, 0.4f, 2.4f, 1.9f, 0.6f, 0.8f};
  return kScale[source];
}
// How long its opposite stays, against After Length, and how loud it is.
inline float length_scale(int source) {
  static constexpr float kScale[kNumSources] = {1.0f, 0.8f, 1.35f, 0.72f, 1.2f, 1.1f};
  return kScale[source];
}
inline float after_trim(int source) {
  static constexpr float kTrim[kNumSources] = {1.0f, 0.8f, 0.8f, 0.72f, 0.75f, 1.1f};
  return kTrim[source];
}
// A dark source leaves a bright outline, and the other way round.
inline float image_tilt(int source) {
  static constexpr float kTilt[kNumSources] = {0.0f, -1.1f, 1.1f, 0.35f, 0.3f, 0.0f};
  return kTilt[source];
}
// The opposite is strong where the source's own body is not.
inline float hollow(int source, float hz, float form) {
  switch (source) {
    case kReed:
      return 0.3f + 1.2f * roof(hz, 1100.0f);
    case kVowel: {
      float centre[3], strength[3];
      formants(form, centre, strength);
      float body = 0.12f;
      for (int f = 0; f < 3; ++f) body += (f == 0 ? 1.0f : 0.8f) * bump(hz, centre[f], 90.0f + 0.1f * centre[f]);
      return 0.45f / (body + 0.2f);
    }
    case kString:
      return 1.0f / (1.0f + 1.5f * bump(hz, 430.0f, 160.0f));
    default:
      return 1.0f;
  }
}
inline float pulse_hz(int source) { return source == kBowl ? 0.85f : 0.27f; }
// And how it lets go: a reed stops, a rim rings on.
inline float release_scale(int source) {
  static constexpr float kScale[kNumSources] = {1.0f, 0.45f, 3.0f, 2.2f, 1.0f, 1.0f};
  return kScale[source];
}

// A source's level against the others, so a change of source keeps the level.
inline float source_trim(int source) {
  static constexpr float kTrim[kNumSources] = {1.08f, 1.03f, 1.0f, 0.82f, 1.1f, 1.05f};
  return kTrim[source];
}

inline Air air_of(int source, float hz, float form, float colour) {
  Air air;
  switch (source) {
    case kReed:
      air.low_hz = 850.0f;
      air.high_hz = 2600.0f;
      air.low = 1.0f;
      air.burst = 1.6f;
      air.high = 0.45f;
      air.burst_seconds = 0.05f;
      break;
    case kBowl:
      air.low_hz = kit::clamp(2.71f * hz, 300.0f, 3000.0f);
      air.high_hz = kit::clamp(5.15f * hz, 900.0f, 5000.0f);
      air.low_q = 9.0f;
      air.high_q = 9.0f;
      air.high = 0.6f;
      air.steady = 0.8f;
      air.burst = 0.4f;
      air.burst_seconds = 0.15f;
      break;
    case kVowel: {
      float centre[3], strength[3];
      formants(form, centre, strength);
      air.low_hz = centre[1];
      air.high_hz = kit::min(centre[2] * 1.6f, 5200.0f);
      air.low_q = 3.0f;
      air.high_q = 2.0f;
      air.high = 0.7f;
      air.steady = 1.5f;
      air.burst_seconds = 0.09f;
      break;
    }
    case kStruck:
      air.low_hz = kit::clamp(kit::lerp(1.0f, 3.0f, colour) * hz + 250.0f, 250.0f, 2500.0f);
      air.high_hz = kit::lerp(1600.0f, 4200.0f, form);
      air.low_q = 1.2f;
      air.high_q = 1.2f;
      air.steady = 0.3f;
      air.burst = 4.0f;
      air.burst_seconds = 0.016f;
      break;
    case kString:
      air.low_hz = 700.0f;
      air.high_hz = 2900.0f;
      air.low_q = 1.4f;
      air.steady = 0.3f;
      air.burst = 3.0f;
      air.burst_seconds = 0.022f;
      break;
    case kLamp:
    default:
      air.low_hz = kit::clamp(2.0f * hz, 350.0f, 2400.0f);
      air.high_hz = kit::clamp(6.0f * hz, 1400.0f, 4500.0f);
      air.low_q = 4.0f;
      air.high_q = 3.0f;
      air.high = 0.12f;
      air.burst = 0.5f;
      air.burst_seconds = 0.12f;
      break;
  }
  return air;
}

}  // namespace closed_eyes
}  // namespace livemix
