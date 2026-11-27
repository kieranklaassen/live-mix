#pragma once

// What a singer of Walking Voices is made of: six bodies, each with wavelets
// of its own, all written so that a stretch of samples depends only on where
// the stretch began. Nothing is carried from sample to sample, so a compiler
// can do four of them at a time.
//
// A cycle is played from its start to its end: every wavelet is at zero where
// the cycle closes, whatever the ratio of its own frequency to the note's, so
// the carriers can be anywhere and nothing clicks and nothing folds.
//
//   open     three grains with a sharp rise and a ringing fall (a tract)
//   hum      a plain tone and two grains that rise and fall the same way
//   hollow   the second half of the cycle is the first turned over, and wind
//   whistle  pure tones an octave and two over a low key, and a hiss at the lips
//   reed     a hard pair of grains, the second one late and turned over
//   strings  a corner that travels once a cycle, and two wooden rings

#include "../../kit/kit.h"

namespace livemix {
namespace walking_dsp {

enum Body : int { kOpen = 0, kHum, kHollow, kWhistle, kReed, kStrings, kBodies };

// The values of a singer that ramp from one tick to the next.
enum Lane : int {
  kInc = 0,  // cycles per sample
  kLeft,
  kRight,
  kFar,
  kGround,  // the plain part of the body
  kAmp0,
  kAmp1,
  kAmp2,  // the three grains
  kRatio0,
  kRatio1,
  kRatio2,  // their carriers, in cycles of the note
  kLen0,
  kLen1,
  kLen2,   // one over their length, in cycles
  kRise,   // one over the share of a grain spent rising
  kRough,  // how far every other cycle is turned down
  kAir,    // how much of the grains is made of noise
  kEdge,   // strings: the share of a cycle the corner takes
  kLanes
};

struct Tone {
  float v[kLanes] = {};
};

// The whole turns below x, for the few hundred turns a tick can have. An
// instruction in WASM; a call in a native build without SSE4.1, where this
// is many times quicker and lets four be done at once.
inline float whole(float x) {
#ifdef __wasm__
  return std::floor(x);
#else
  return static_cast<float>(static_cast<int>(x + 1024.0f) - 1024);
#endif
}

// sin of x turns, any x. Folded to a quarter turn, then a polynomial good to
// a millionth.
inline float sin_turns(float x) {
  x -= 0.25f;
  float c = x - whole(x + 0.5f);
  c = c < 0.0f ? -c : c;
  const float w = 0.25f - c;
  const float w2 = w * w;
  return w * (6.2831640f + w2 * (-41.33713f + w2 * (81.34040f - 70.99091f * w2)));
}

// A grain with a rise and a longer fall, from 0 to 1 of its length.
inline float grain(float p, float ratio, float one_over_length, float one_over_rise) {
  float u = p * one_over_length;
  u = u < 1.0f ? u : 1.0f;
  const float q = 1.0f - u;
  float v = u * one_over_rise;
  v = v < 1.0f ? v : 1.0f;
  return v * v * (3.0f - 2.0f * v) * q * q * q * sin_turns(ratio * p);
}

// One singer for `frames` samples, the first of which is sample `first` of
// the tick. `tone` holds the values at the tick's start and `step` what they
// move by in a sample; `phase` is in cycles of half the note (two cycles of
// the note to one turn), `noise` has the singer's own stretch of noise.
template <int Which>
void sing(const Tone& tone, const Tone& step, float phase, const float* noise, int first, int frames, float* left,
          float* right, float* far) {
  const float* const v = tone.v;
  const float* const d = step.v;
  const float inc = 0.5f * v[kInc];
  const float bend = 0.25f * d[kInc];
  for (int i = 0; i < frames; ++i) {
    const float k = static_cast<float>(first + i);
    float h = phase + k * (inc + k * bend);
    h -= whole(h);
    const float twice = h + h;
    const float odd = twice >= 1.0f ? 1.0f : 0.0f;
    const float p = twice - odd;
    const float air = v[kAir] + k * d[kAir];
    const float breathy = 1.0f - 0.8f * air + air * (1.9f - 0.9f * air) * noise[i];
    const float turned = (1.0f - odd * (v[kRough] + k * d[kRough])) * breathy;
    const float ground = v[kGround] + k * d[kGround];
    const float a0 = v[kAmp0] + k * d[kAmp0];
    const float a1 = v[kAmp1] + k * d[kAmp1];
    const float a2 = v[kAmp2] + k * d[kAmp2];
    const float r0 = v[kRatio0] + k * d[kRatio0];
    const float r1 = v[kRatio1] + k * d[kRatio1];
    const float r2 = v[kRatio2] + k * d[kRatio2];
    const float l0 = v[kLen0] + k * d[kLen0];
    const float l1 = v[kLen1] + k * d[kLen1];
    const float l2 = v[kLen2] + k * d[kLen2];
    const float rise = v[kRise] + k * d[kRise];
    float y;
    if constexpr (Which == kOpen) {
      y = ground * sin_turns(p) +
          turned * (a0 * grain(p, r0, l0, rise) + a1 * grain(p, r1, l1, rise) + a2 * grain(p, r2, l2, rise));
    } else if constexpr (Which == kHum) {
      // Both grains stand in the middle of the cycle and lean neither way.
      const float b = 4.0f * p * (1.0f - p);
      const float c = p - 0.5f;
      y = (ground * sin_turns(p) + a0 * sin_turns(p + p)) * (1.0f - 0.7f * odd * (v[kRough] + k * d[kRough])) +
          turned * b * b * (a1 * sin_turns(r1 * c + 0.25f) + a2 * b * sin_turns(r2 * c + 0.25f));
    } else if constexpr (Which == kHollow) {
      const float over = p >= 0.5f ? 1.0f : 0.0f;
      const float t = p + p - over;
      const float sign = 1.0f - 2.0f * over;
      const float hump = 4.0f * t * (1.0f - t);
      const float b = 4.0f * p * (1.0f - p);
      y = sign * (ground * hump + turned * (a0 * grain(t, r0, l0, rise) + a1 * grain(t, r1, l1, rise))) +
          a2 * b * noise[i] * sin_turns(2.0f * r2 * (p - 0.5f) + 0.25f);
    } else if constexpr (Which == kWhistle) {
      const float b = 4.0f * p * (1.0f - p);
      const float c = p - 0.5f;
      const float n = noise[i];
      y = ground * sin_turns(p) +
          (a0 * sin_turns(p + p) + a1 * sin_turns(4.0f * p)) * (1.0f - 0.75f * air + 0.9f * air * n) +
          a2 * b * b * n * sin_turns(r2 * c + 0.25f);
    } else if constexpr (Which == kReed) {
      float late = p + 0.62f;
      late -= whole(late);
      y = ground * sin_turns(p) + turned * (a0 * grain(p, r0, l0, rise) + a1 * grain(p, r1, l1, rise) -
                                            0.7f * a0 * grain(late, r0, l0, rise) - a2 * grain(late, r2, l2, rise));
    } else {
      const float edge = v[kEdge] + k * d[kEdge];
      const float flat = 1.0f - edge;
      float t = (p - flat) / edge;
      t = t > 0.0f ? t : 0.0f;
      const float down = 1.0f - 2.0f * p / flat;
      const float up = -1.0f + 2.0f * t * t * (3.0f - 2.0f * t);
      y = ground * (p < flat ? down : up) * (1.0f + 0.7f * air * noise[i]) +
          turned * (a0 * grain(p, r0, l0, rise) + a1 * grain(p, r1, l1, rise)) +
          a2 * grain(p, r2, l2, rise) * (0.4f + 0.65f * air * noise[i]);
    }
    left[i] += y * (v[kLeft] + k * d[kLeft]);
    right[i] += y * (v[kRight] + k * d[kRight]);
    far[i] += y * (v[kFar] + k * d[kFar]);
  }
}

inline void sing_body(int body, const Tone& tone, const Tone& step, float phase, const float* noise, int first,
                      int frames, float* left, float* right, float* far) {
  switch (body) {
    case kHum:
      return sing<kHum>(tone, step, phase, noise, first, frames, left, right, far);
    case kHollow:
      return sing<kHollow>(tone, step, phase, noise, first, frames, left, right, far);
    case kWhistle:
      return sing<kWhistle>(tone, step, phase, noise, first, frames, left, right, far);
    case kReed:
      return sing<kReed>(tone, step, phase, noise, first, frames, left, right, far);
    case kStrings:
      return sing<kStrings>(tone, step, phase, noise, first, frames, left, right, far);
    default:
      return sing<kOpen>(tone, step, phase, noise, first, frames, left, right, far);
  }
}

// Five vowels from closed to bright (oo, oh, ah, eh, ee), as three peaks in
// Hz and their levels.
struct Vowel {
  float hz[3];
  float level[3];
};

inline Vowel vowel_at(float position) {
  static constexpr float kTable[5][6] = {{320.0f, 640.0f, 2200.0f, 1.0f, 0.14f, 0.02f},
                                         {460.0f, 860.0f, 2500.0f, 1.0f, 0.5f, 0.09f},
                                         {760.0f, 1180.0f, 2700.0f, 1.0f, 0.85f, 0.25f},
                                         {540.0f, 1800.0f, 2650.0f, 0.9f, 0.75f, 0.42f},
                                         {310.0f, 2300.0f, 3200.0f, 0.8f, 0.60f, 0.55f}};
  const float at = kit::clamp(position, 0.0f, 1.0f) * 4.0f;
  const int low = kit::clamp_int(static_cast<int>(at), 0, 3);
  const float t = at - static_cast<float>(low);
  Vowel out;
  for (int j = 0; j < 3; ++j) {
    out.hz[j] = kit::lerp(kTable[low][j], kTable[low + 1][j], t);
    out.level[j] = kit::lerp(kTable[low][3 + j], kTable[low + 1][3 + j], t);
  }
  return out;
}

inline float smooth_step(float t) {
  t = kit::clamp(t, 0.0f, 1.0f);
  return t * t * (3.0f - 2.0f * t);
}

// What a singer is asked for at a tick.
struct Ask {
  int body = kOpen;
  float hz = 220.0f;
  float vowel = 0.5f;   // 0 closed .. 1 bright
  float effort = 0.4f;  // 0 soft .. about 1.4 at full voice and under strain
  float air = 0.0f;
  float rough = 0.0f;
};

// Fills everything of `tone` but the pitch and the three gains, at one
// loudness whatever the body, the note and the vowel.
inline void shape(const Ask& ask, float sample_rate, Tone* tone) {
  float* const v = tone->v;
  const float hz = ask.hz;
  const float e = kit::clamp(ask.effort, 0.0f, 1.5f);
  const float top = kit::min(0.3f * sample_rate, 9000.0f);
  // A small body sings high: the peaks rise a little with the note.
  const float octave = kit::clamp(std::log2(hz * (1.0f / 220.0f)), -2.0f, 3.0f);
  const float size = 1.0f + 0.08f * octave;
  float length[3] = {0.010f, 0.007f, 0.005f};
  float fall_power = 0.105f;
  float halves = 1.0f;  // cycles of the grain to a cycle of the note
  v[kEdge] = 0.2f;
  v[kAir] = ask.air;
  v[kRough] = ask.rough;
  const Vowel word = vowel_at(ask.vowel);
  float peak[3] = {word.hz[0] * size, word.hz[1] * size, word.hz[2] * size};
  float power = 0.0f;
  switch (ask.body) {
    case kHum: {
      const float w = ask.vowel;
      peak[1] = (240.0f + 420.0f * w) * size;
      peak[2] = (650.0f + 1500.0f * w) * size;
      v[kGround] = 1.0f;
      v[kAmp0] = 0.02f + 0.5f * w * w + 0.3f * e * e;
      v[kAmp1] = 0.02f + 1.6f * e * e * (0.4f + 0.6f * w) + 0.5f * w * w;
      v[kAmp2] = (0.01f + 1.5f * w * w) * (0.06f + e * e);
      v[kRise] = 2.0f;
      power = 0.5f + 0.5f * v[kAmp0] * v[kAmp0] + 0.2f * v[kAmp1] * v[kAmp1] + 0.16f * v[kAmp2] * v[kAmp2];
      break;
    }
    case kHollow: {
      const float w = ask.vowel;
      halves = 2.0f;
      peak[0] = (500.0f + 700.0f * w) * size;
      peak[1] = (1100.0f + 1100.0f * w) * size;
      peak[2] = (2700.0f + 700.0f * w) * size;
      length[0] = 0.008f;
      length[1] = 0.005f;
      length[2] = 0.003f;
      v[kGround] = 0.75f;
      v[kAmp0] = 1.5f * (0.01f + 0.75f * e * e);
      v[kAmp1] = (0.4f + 1.3f * w) * 1.2f * e * e * e;
      v[kAmp2] = (0.47f + 0.45f * ask.air) * (0.45f + 0.5f * e);
      v[kRise] = 3.2f;
      power = 0.5f * v[kGround] * v[kGround] + 0.15f * v[kAmp2] * v[kAmp2];
      break;
    }
    case kWhistle: {
      const float w = ask.vowel;
      // Nobody whistles in the bass: the tune moves up by octaves, and the
      // key itself is only a shadow under it.
      const float low = smooth_step(0.75f - 0.5f * octave), deep = smooth_step(0.1f - 0.6f * octave);
      v[kGround] = 1.0f - 0.97f * low;
      v[kAmp0] = kit::lerp(0.02f + 0.3f * w * w, 1.0f - 0.6f * deep, low);
      v[kAmp1] = 0.005f + 0.75f * deep + 0.3f * w * w * e;
      v[kAmp2] = (0.32f + 0.35f * ask.air) * (0.4f + 0.5f * e);
      peak[2] = (3000.0f + 900.0f * w) * size;
      v[kRise] = 2.0f;
      // Nobody whistles to the dogs.
      const float high = smooth_step((hz - 500.0f) * (1.0f / 900.0f));
      v[kAmp0] *= 1.0f - 0.7f * high;
      v[kAmp1] *= 1.0f - 0.9f * high;
      power =
          0.5f * (v[kGround] * v[kGround] + v[kAmp0] * v[kAmp0] + v[kAmp1] * v[kAmp1]) + 0.15f * v[kAmp2] * v[kAmp2];
      break;
    }
    case kReed: {
      const float w = ask.vowel;
      peak[0] = (800.0f + 600.0f * w) * size;
      peak[1] = (1650.0f + 800.0f * w) * size;
      peak[2] = (2700.0f + 800.0f * w) * size;
      length[0] = 0.006f;
      length[1] = 0.005f;
      length[2] = 0.004f;
      v[kGround] = 0.12f;
      v[kAmp0] = 2.4f;
      v[kAmp1] = 3.6f * (0.14f + 0.65f * e);
      v[kAmp2] = 3.8f * (0.1f + 0.5f * e * e);
      v[kRise] = 5.0f + 7.0f * e;
      fall_power = 0.135f;
      power = 0.5f * v[kGround] * v[kGround] + 0.07f * v[kAmp0] * v[kAmp0] * kit::min(1.0f, length[0] * hz);
      break;
    }
    case kStrings: {
      const float w = ask.vowel;
      const float seconds = 0.0011f * std::exp2(-3.5f * e) + 0.00003f;
      v[kEdge] = kit::min(kit::max(seconds * hz, 4.0f * hz / sample_rate), 0.5f);
      peak[0] = (285.0f + 250.0f * w) * size;
      peak[1] = 420.0f * std::exp2(2.6f * w) * size;
      peak[2] = (3400.0f + 1100.0f * w) * size;
      length[0] = 0.012f;
      length[1] = 0.009f;
      length[2] = 0.005f;
      v[kGround] = 1.0f;
      v[kAmp0] = 0.95f - 0.7f * kit::min(e, 1.2f);
      v[kAmp1] = 0.12f + 2.8f * w * w + 1.1f * e * e * e;
      v[kAmp2] = 1.55f + 0.3f * e * e + 0.7f * e * e * e;
      v[kRise] = 9.0f;
      power = 0.333f * v[kGround] * v[kGround];
      break;
    }
    default: {
      const float soft = kit::min(e, 1.0f);
      v[kGround] = 0.8f - 0.5f * soft;
      v[kAmp0] = 2.2f * word.level[0] * (0.55f + 0.5f * soft);
      v[kAmp1] = 4.2f * word.level[1] * (0.05f + 1.15f * e);
      v[kAmp2] = 3.6f * word.level[2] * (0.01f + 0.25f * e * e + 1.0f * e * e * e);
      v[kRise] = 3.0f + 5.0f * e;
      power = 0.5f * v[kGround] * v[kGround];
      break;
    }
  }
  // A whisper has no tone under it.
  if (ask.body == kOpen || ask.body == kHum || ask.body == kReed || ask.body == kWhistle) {
    const float left = 1.0f - 0.9f * ask.air * ask.air;
    power -= 0.5f * (1.0f - left * left) * v[kGround] * v[kGround];
    v[kGround] *= left;
  }
  // A grain is never longer than its cycle, and its carrier never lower than
  // the note: a singer tunes the mouth to what is sung.
  for (int j = 0; j < 3; ++j) {
    const float cycle = halves * hz;
    const float carrier = kit::clamp(peak[j], hz, top);
    const float share = kit::min(1.0f, length[j] * cycle);
    v[kRatio0 + j] = carrier / cycle;
    v[kLen0 + j] = 1.0f / share;
    // Grains above the top of the band fade out instead of piling up there.
    const float room = kit::clamp((top - hz) / top * 2.0f, 0.0f, 1.0f);
    if (j == 2) v[kAmp2] *= room;
    if (ask.body == kOpen || (ask.body == kHollow && j < 2) || ask.body == kStrings || (ask.body == kReed && j > 0)) {
      // The bow's hiss is only as loud as its air.
      const float part = ask.body == kStrings && j == 2 ? 0.2f + 0.6f * ask.air : 1.0f;
      power += 0.5f * fall_power * share * part * v[kAmp0 + j] * v[kAmp0 + j];
    }
  }
  static constexpr float kLoud[kBodies] = {1.0f, 0.88f, 0.86f, 0.88f, 1.0f, 0.82f};
  const float gain = (1.0f - 0.1f * ask.air) * kLoud[kit::clamp_int(ask.body, 0, kBodies - 1)] / std::sqrt(power + 1.0e-4f);
  v[kGround] *= gain;
  v[kAmp0] *= gain;
  v[kAmp1] *= gain;
  v[kAmp2] *= gain;
}

}  // namespace walking_dsp
}  // namespace livemix
