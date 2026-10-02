#pragma once

// Wind chimes: six tubes on a major pentatonic set from the key, each four
// partials of a free-free bar (1 : 2.76 : 5.40 : 8.93) and a slightly
// detuned twin of the fundamental (the two bending planes of a real tube,
// which is what makes it shimmer). A clapper swings between neighbouring
// tubes; how often it lands follows a wind that gusts.

#include "scene.h"

namespace livemix {
namespace outdoors_scene {

struct Chimes {
  static constexpr int kTubes = 6;
  static constexpr int kPartials = 4;
  static constexpr float kRatio[kPartials] = {1.0f, 2.76f, 5.40f, 8.93f};
  static constexpr float kWeight[kPartials] = {1.0f, 0.8f, 0.45f, 0.2f};
  // Semitones above the key: a major pentatonic scale and the octave.
  static constexpr int kScale[kTubes] = {0, 2, 4, 7, 9, 12};
  // Where each tube hangs on the ring (neighbours are a third or more apart).
  static constexpr int kRing[kTubes] = {0, 3, 1, 4, 2, 5};
  static constexpr float kGain = 0.16f;

  struct Tube {
    Ringer partial[kPartials];
    Ringer twin;
    float level[kPartials] = {};
    float pan_left = 0.7071f, pan_right = 0.7071f;
    float rest = 1.0f;  // seconds since it was last struck
    bool ringing = false;
  };

  Tube tube[kTubes];
  kit::Rng rng;
  Wander wind;
  float until = 0.0f;  // expected strikes left before the next one lands
  float gust = 0.5f;
  float base = 440.0f; // pitch of the lowest tube
  int at = 0;          // where on the ring the clapper is
  int sweep = 0;       // which tube is checked for silence this step

  void seed(uint32_t a, uint32_t b) {
    rng.seed(a);
    wind.seed(b);
  }

  // The lowest tube's pitch for a key: the key itself, folded by octaves
  // into the range a set of chimes can have.
  static float root(float hz) {
    while (hz > 1800.0f) hz *= 0.5f;
    while (hz < 100.0f) hz *= 2.0f;
    return hz;
  }

  void start(float hz, const Controls& c) {
    const float sr = c.sample_rate;
    base = root(hz);
    for (int t = 0; t < kTubes; ++t) {
      Tube& tb = tube[t];
      const float f = base * std::exp2(static_cast<float>(kScale[t]) / 12.0f);
      for (int k = 0; k < kPartials; ++k) {
        const float pf = f * kRatio[k];
        tb.partial[k].reset();
        tb.partial[k].tune(pf, sr);
        tb.partial[k].decay(ring_seconds(pf), sr);
        tb.level[k] = pf < 0.45f * sr ? kWeight[k] : 0.0f;
      }
      tb.twin.reset();
      tb.twin.tune(f + between(rng, 0.25f, 0.9f), sr);
      tb.twin.decay(ring_seconds(f), sr);
      // Across the field in ring order, never hard to one side.
      kit::pan_gains(-0.75f + 1.5f * static_cast<float>(kRing[t]) / (kTubes - 1), &tb.pan_left,
                     &tb.pan_right);
      tb.rest = 1.0f;
      tb.ringing = false;
    }
    until = 0.02f;  // the first strike comes with the key
    at = static_cast<int>(rng.next_u32() % kTubes);
  }

  // Seconds to fall 60 dB: long for the low partials, short for the top.
  static float ring_seconds(float hz) {
    return kit::clamp(7.0f * std::pow(500.0f / hz, 0.7f), 0.3f, 12.0f);
  }

  void control(const Controls& c) {
    const float dt = c.step_seconds;
    gust = wind.next(0.25f, dt);
    // Strikes a second: one every seven seconds to six a second, bunched
    // into the gusts as Movement rises.
    const float base = 0.15f * std::pow(40.0f, c.density);
    const float rate = base * kit::lerp(1.0f, 4.0f * gust * gust * gust, c.movement);
    for (Tube& tb : tube) tb.rest += dt;
    until -= rate * dt;
    if (until <= 0.0f) {
      until += exp_gap(rng, 1.0f);
      strike(c);
    }
    // One tube a step: put out what has rung down, before it turns denormal.
    Tube& tb = tube[sweep];
    sweep = (sweep + 1) % kTubes;
    if (tb.ringing) {
      float total = tb.twin.size();
      for (Ringer& p : tb.partial) {
        if (p.size() < 1.0e-9f) p.reset();
        total += p.size();
      }
      if (total < 1.0e-7f) {
        for (Ringer& p : tb.partial) p.reset();
        tb.twin.reset();
        tb.ringing = false;
      }
    }
  }

  // With one key down all six tubes sound. With more, a set keeps its root,
  // fifth and octave and those of its other tubes that are (in any octave)
  // one of the keys held, so the chimes spell the chord and not five notes
  // around each of its members.
  bool fits(int which, const Controls& c) const {
    if (c.held <= 1 || kScale[which] == 0 || kScale[which] == 7 || kScale[which] == 12) return true;
    const float hz = base * std::exp2(static_cast<float>(kScale[which]) / 12.0f);
    for (int k = 0; k < c.held; ++k) {
      const float octaves = std::log2(hz / kit::max(c.held_hz[k], 1.0f));
      const float off = octaves - std::floor(octaves + 0.5f);
      if (std::fabs(off) < 0.3f / 12.0f) return true;
    }
    return false;
  }

  void strike(const Controls& c) {
    // The clapper mostly goes on to a neighbour.
    const float turn = rng.uniform();
    if (turn < 0.38f) {
      at = (at + 1) % kTubes;
    } else if (turn < 0.76f) {
      at = (at + kTubes - 1) % kTubes;
    } else {
      at = static_cast<int>(rng.next_u32() % kTubes);
    }
    int which = 0;
    for (int t = 0; t < kTubes; ++t) {
      if (kRing[t] == at) which = t;
    }
    if (!fits(which, c)) {
      // Not with these keys: the clapper swings on to the next tube that is.
      for (int tries = 0; tries < kTubes && !fits(which, c); ++tries) {
        at = (at + 1) % kTubes;
        for (int t = 0; t < kTubes; ++t) {
          if (kRing[t] == at) which = t;
        }
      }
    }
    Tube& tb = tube[which];
    if (tb.rest < 0.09f) return;  // it is still against the clapper
    tb.rest = 0.0f;
    const float draw = rng.uniform();
    const float velocity = (0.22f + 0.78f * draw * draw) * (0.55f + 0.45f * gust);
    // A harder strike, and a brighter Tone, put more into the upper partials.
    const float bright = 0.30f + 0.55f * c.tone + 0.35f * velocity;
    float amount = velocity * kGain;
    for (int k = 0; k < kPartials; ++k) {
      tb.partial[k].strike(amount * tb.level[k]);
      amount *= bright;
    }
    tb.twin.strike(velocity * kGain * 0.55f);
    tb.ringing = true;
  }

  void tick(float& left, float& right) {
    for (Tube& tb : tube) {
      if (!tb.ringing) continue;
      float sum = tb.twin.tick();
      for (Ringer& p : tb.partial) sum += p.tick();
      left += sum * tb.pan_left;
      right += sum * tb.pan_right;
    }
  }
};

}  // namespace outdoors_scene
}  // namespace livemix
