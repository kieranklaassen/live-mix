#pragma once

// A distant storm. One stroke of lightning is heard as many arrivals: the
// channel is kilometres long, so its sound comes in over seconds, the far
// parts later, weaker and duller, and again off the ground and the hills.
// Here an arrival is a kick to the envelopes of four bands of noise (a chain
// of low-passes, so each band is darker than the last); a roll is a few
// hundred arrivals, crowded at first and thinning out, with lulls and second
// winds. Rolls come every ten seconds to a minute.

#include "scene.h"

namespace livemix {
namespace outdoors_scene {

struct Thunder {
  static constexpr int kBands = 4;  // crack, body, rumble, sub
  static constexpr float kGain = 1.0f;
  static constexpr float kCorner[kBands] = {2800.0f, 420.0f, 130.0f, 48.0f};
  // What makes each band as loud as the others for the same envelope.
  static constexpr float kTrim[kBands] = {0.35f, 1.0f, 2.2f, 4.5f};
  // Seconds to fall to 1/e after an arrival, and to rise to it.
  static constexpr float kFall[kBands] = {0.07f, 0.28f, 0.7f, 1.3f};
  static constexpr float kRise[kBands] = {0.002f, 0.012f, 0.04f, 0.09f};

  kit::Rng rng;
  kit::Noise noise[2];
  kit::OnePole pole[2][kBands];
  // Envelopes, stepped on the control clock and ramped between.
  float kick[2][kBands] = {};   // what the arrivals have put in
  float level[2][kBands] = {};  // the smoothed envelope
  float gain[2][kBands] = {};   // per sample
  float step[2][kBands] = {};
  bool sounding = false;
  // The roll in progress.
  bool rolling = false;
  float t = 0.0f;          // seconds since the stroke
  float next = 0.0f;       // when the next arrival is due
  float length = 4.0f;     // how long arrivals keep coming
  float size = 1.0f;       // this stroke's strength
  float place = 0.0f;      // where in the image it is, and it drifts
  float lobe = 1.0f;       // slow swell of the arrivals' strength
  float lobe_target = 1.0f;
  float wait = 0.0f;       // seconds to the next stroke
  float lean = 1.0f;
  float tilt = 1.0f;

  void seed(uint32_t base) {
    rng.seed(seed_for(base));
    noise[0].seed(seed_for(base + 1));
    noise[1].seed(seed_for(base + 2));
  }

  void start(float hz, const Controls& c) {
    lean = key_lean(hz, 0.5f, 1.0f);
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < kBands; ++k) {
        pole[ch][k].reset();
        kick[ch][k] = level[ch][k] = gain[ch][k] = step[ch][k] = 0.0f;
      }
    }
    sounding = false;
    rolling = false;
    wait = 0.05f;  // the key brings the first stroke
    retune(c);
  }

  void retune(const Controls& c) {
    tilt = lean * std::exp2(1.2f * (c.tone - 0.5f));
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < kBands; ++k) {
        pole[ch][k].set_cutoff(kit::min(kCorner[k] * tilt, 0.4f * c.sample_rate), c.sample_rate);
      }
    }
  }

  // EVENTS

  void tick(float& left, float& right) {
    if (!sounding) return;
    const float a = noise[0].white();
    const float b = 0.6f * noise[1].white();
    float x[2] = {a + b, a - b};  // the two sides share most of their rumble
    float out[2] = {0.0f, 0.0f};
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < kBands; ++k) {
        x[ch] = pole[ch][k].lowpass(x[ch]);
        gain[ch][k] += step[ch][k];
        out[ch] += x[ch] * gain[ch][k];
      }
    }
    left += out[0];
    right += out[1];
  }
};

}  // namespace outdoors_scene
}  // namespace livemix
