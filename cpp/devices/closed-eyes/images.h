#pragma once

// The six opposites: what an eye that has tired of a note sees when it looks
// away. Each is another register or another family of sound than the note.

#include "sources.h"

namespace livemix {
namespace closed_eyes {

struct Image {
  float ratio[kImages] = {};   // to the hertz the image was asked for
  float weight[kImages] = {};  // unit power together
  float side[kImages] = {};
  float cents[kImages] = {};   // which way, and how far, Drift moves it
  float life[kImages] = {};    // above 1: gone sooner than After Length
  int from[kImages] = {};      // the note's partial that tires it into being
  float line = 0.0f;           // Hz: how wide each partial is smeared into a band
  float tones = 1.0f;          // how loud the partials are
  float breath = 0.0f;         // and how loud the two bands of noise
  float low_hz = 800.0f, high_hz = 3000.0f, low_q = 2.5f, high_q = 1.2f;
  float high = 0.4f;
  float length = 1.0f;         // of After Length
  float centre = 0.0f;         // how far its noise keeps to the middle of what Width gives it
  float gust = 0.0f;           // how deep its level comes and goes, unevenly
  float throb = 0.0f, throb_hz = 1.0f;  // how deep and how fast it comes and goes evenly
  float sway = 0.0f, sway_hz = 1.0f;  // how far the whole of it goes from side to side, and how fast
  int count = 0;
};

// The place of a note on the other side of the middle of the keyboard: by
// whole octaves, and never where it was.
inline float mirrored(float hz) {
  constexpr float kMiddle = 440.0f;
  float octaves = std::floor(2.7f * std::log2(kMiddle / hz) + 0.5f);
  if (octaves == 0.0f) octaves = hz < kMiddle ? 1.0f : -1.0f;
  float there = hz * std::exp2(kit::clamp(octaves, -4.0f, 6.0f));
  while (there > 1900.0f) there *= 0.5f;
  while (there < 78.0f) there *= 2.0f;
  return there;
}

inline void make_image(int opponent, float hz, float edge, int source, float form, float brightness, float top_hz, Image* out) {
  Image image;
  // Edge sharpens the outline, and a bright note leaves a dark one: power of the ratio.
  const float tilt = 3.2f * (edge - 0.4f) + image_tilt(source) - kit::clamp(0.8f * (brightness - 0.6f), -0.5f, 1.0f);
  float pitch = 1.0f;                       // the ratio Edge tilts about
  auto add = [&](float ratio, float weight, float side, float cents, int from, float life) {
    if (image.count >= kImages) return;
    const int k = image.count++;
    image.ratio[k] = ratio;
    image.weight[k] = hz * ratio > top_hz || weight <= 0.0f ? 0.0f : weight;
    image.side[k] = side;
    image.cents[k] = cents;
    image.from[k] = from < kPartials ? from : kPartials - 1;
    image.life[k] = life;
  };
  switch (opponent) {
    case kMirror: {
      // Low keys leave a high bell, high keys a low warmth.
      const float r = mirrored(hz) / hz;
      pitch = r;
      const bool risen = r > 1.0f;
      static constexpr float kHigh[8] = {1.0f, 0.34f, 0.3f, 0.34f, 0.28f, 0.2f, 0.0f, 0.0f};
      static constexpr float kGlint[8] = {1.0f, 2.0f, 2.76f, 4.0f, 5.404f, 8.933f, 7.0f, 8.0f};
      static constexpr float kLow[8] = {1.0f, 0.62f, 0.34f, 0.2f, 0.12f, 0.08f, 0.05f, 0.03f};
      for (int m = 0; m < 8; ++m) {
        const float n = risen ? kGlint[m] : static_cast<float>(m + 1);
        const float w = risen ? kHigh[m] : kLow[m];
        const float life = risen ? 1.0f + 0.45f * static_cast<float>(m) : 1.0f;
        add(r * n, w, -0.4f, 1.0f, m < 4 ? 3 - m : m, life);
        add(r * n, w * 0.8f, 0.4f, -0.8f, m < 4 ? 4 - m : m, life);
      }
      break;
    }
    case kSides: {
      // The middle empties: the odd ones to the left, the even to the right,
      // the note itself to neither.
      for (int m = 0; m < 8; ++m) {
        const float odd = 3.0f + 2.0f * static_cast<float>(m), even = 2.0f + 2.0f * static_cast<float>(m);
        add(odd, (m == 0 ? 0.5f : 1.0f) * std::pow(odd, -0.5f), -1.6f, (m & 1) ? 1.6f : -1.6f, m, 1.0f);
        add(even, (m == 0 ? 0.25f : 1.1f) * std::pow(even, -0.5f), 1.6f, (m & 1) ? -1.4f : 1.4f, m, 1.0f);
      }
      image.throb = 0.48f;  // and they tremble
      image.throb_hz = 2.6f;
      image.sway = 0.55f;
      image.sway_hz = 0.8f;
      pitch = 3.0f;
      break;
    }
    case kRough: {
      // Four torn bands where the partials were, each four lines that wander.
      static constexpr float kRatio[4] = {1.0f, 2.0f, 3.0f, 5.0f};
      static constexpr float kWeight[4] = {1.0f, 0.62f, 0.42f, 0.24f};
      for (int m = 0; m < 4; ++m) {
        for (int j = 0; j < 4; ++j) {
          add(kRatio[m], kWeight[m], (j & 1) ? 0.8f : -0.8f, 2.0f * static_cast<float>(j) - 3.0f, 2 * m + j, 1.0f);
        }
      }
      image.line = kit::lerp(22.0f, 95.0f, edge);
      image.gust = 0.6f;
      image.breath = 0.11f;
      image.low_hz = kit::clamp(7.0f * hz, 900.0f, 2400.0f);
      image.high_hz = 3600.0f;
      image.low_q = 4.0f;
      break;
    }
    case kBreath: {
      // A bright source leaves a dark breath, and the other way round.
      const float turned = std::exp2(0.3f * image_tilt(source) - 0.55f * kit::clamp(brightness - 0.6f, -0.8f, 1.6f));
      for (int j = 0; j < 4; ++j) add(4.0f, 1.0f, (j & 1) ? 0.9f : -0.9f, 1.0f, j, 1.0f);
      for (int j = 0; j < 4; ++j) add(2.0f, 0.5f, (j & 1) ? 0.9f : -0.9f, 1.0f, j, 1.0f);
      image.line = 40.0f;
      image.tones = 0.035f;
      image.throb = 0.55f;  // it breathes
      image.throb_hz = 0.4f;
      image.breath = 0.56f;
      image.sway = 0.1f;
      image.sway_hz = 0.24f;
      image.low_hz = kit::clamp(3.5f * hz, 700.0f, 1800.0f) * sweep(0.55f, 1.6f, edge) * turned;
      image.high_hz = sweep(1900.0f, 3700.0f, edge) * kit::clamp(turned, 0.6f, 1.05f);
      image.low_q = 1.3f;
      image.high_q = 1.5f;
      image.high = kit::lerp(0.3f, 0.7f, edge);
      image.centre = 0.6f;
      pitch = 4.0f;
      break;
    }
    case kBelow: {
      // Half the note's speed and only its odd partials: a stopped pipe an
      // octave down. Keys with no octave below them keep their own.
      const float r = hz * 0.5f < 30.0f ? 1.0f : 0.5f;
      pitch = r;
      static constexpr float kWeight[4] = {1.0f, 0.3f, 0.11f, 0.05f};
      for (int m = 0; m < 4; ++m) {
        const float n = static_cast<float>(2 * m + 1);
        add(r * n, kWeight[m], -0.25f, 0.8f, 2 * m + 1, 1.0f);
        add(r * n, kWeight[m], 0.25f, -0.8f, 2 * m, 1.0f);
      }
      break;
    }
    case kEven:
    default: {
      // Only even partials: hollow, and an octave up.
      static constexpr float kWeight[8] = {1.0f, 0.22f, 0.02f, 0.05f, 0.004f, 0.01f, 0.004f, 0.01f};
      for (int m = 0; m < 8; ++m) {
        const float n = 2.0f * static_cast<float>(m + 1);
        add(n, kWeight[m], -0.15f, 1.1f, 2 * m, 1.0f);
        add(n, kWeight[m], 0.15f, -0.9f, 2 * m, 1.0f);
      }
      pitch = 2.0f;
      break;
    }
  }
  float power = 1.0e-12f, centre = 0.0f;
  for (int k = 0; k < image.count; ++k) {
    float& w = image.weight[k];
    if (w > 0.0f) w *= std::pow(image.ratio[k] / pitch, tilt) * roof(hz * image.ratio[k], sweep(1100.0f, 11000.0f, edge)) *
                      hollow(source, hz * image.ratio[k], form);
    power += w * w;
    centre += w * w * hz * image.ratio[k];
  }
  centre /= power;
  // The ear is keener up the keyboard: one loudness, not one level.
  const float ear = kit::clamp(std::pow(kit::max(centre, 20.0f) / 450.0f, -0.28f), 0.45f, 1.9f);
  static constexpr float kLength[kNumOpponents] = {1.3f, 0.6f, 1.0f, 0.8f, 0.75f, 1.2f};
  image.length = kLength[opponent];
  static constexpr float kTrim[kNumOpponents] = {0.8f, 1.2f, 0.95f, 0.95f, 1.2f, 0.62f};
  const float scale = kTrim[opponent] * ear * image.tones / std::sqrt(power);
  for (int k = 0; k < image.count; ++k) image.weight[k] *= scale;
  *out = image;
}

}  // namespace closed_eyes
}  // namespace livemix
