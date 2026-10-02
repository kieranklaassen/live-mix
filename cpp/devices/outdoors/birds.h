#pragma once

// A dawn chorus: up to six birds a key. Each bird is one tone whose pitch
// sweeps and trills, shaped into syllables of tens of milliseconds; a
// species is a way of drawing a motif of syllables and a grammar for it
// (repeat the motif, pause, sing again, fall silent for a long while, move
// on). Every bird has its own place and distance.

#include "scene.h"

namespace livemix {
namespace outdoors_scene {

struct Birds {
  static constexpr int kBirds = 6;
  static constexpr int kMotif = 10;
  static constexpr int kSpecies = 8;
  static constexpr float kGain = 0.5f;

  // One syllable as it is drawn: pitch at its start, middle and end (Hz,
  // before the bird's register), its length and the silence after it.
  struct Syllable {
    float f0 = 3000.0f, fm = 3000.0f, f1 = 3000.0f;
    float seconds = 0.1f, gap = 0.05f;
    float trill_hz = 0.0f, trill_depth = 0.0f;  // FM: rate, and depth as a share of the pitch
    float level = 1.0f;
    float tilt = 0.0f;   // louder (+) or softer (-) towards its end
    float edge = 0.25f;  // share of the length each fade takes
    float rough = 0.0f;  // second harmonic
  };

  struct Bird {
    kit::Rng rng;
    Syllable motif[kMotif];
    int length = 1;        // syllables in the motif
    int species = 0;
    int at = 0;            // next syllable of the motif
    int repeats = 0;       // motifs left in this phrase
    int phrases = 0;       // phrases left before the long silence
    int songs = 0;         // bouts left before the bird moves on
    float wait = 0.0f;     // seconds to the next syllable
    float swell = 1.0f;    // level of this repeat (crescendos)
    float shift = 1.0f;    // pitch of this phrase against the motif
    float own = 1.0f;      // this individual's register
    float near = 1.0f;     // level from its distance
    float fade = 1.0f;     // level of this phrase (far birds come and go)
    float pan_left = 0.7071f, pan_right = 0.7071f;
    // The syllable that is sounding.
    bool singing = false;
    float u = 0.0f, du = 0.0f;
    float inc_a = 0.0f, inc_b = 0.0f, inc_c = 0.0f;
    float phase = 0.0f;
    float trill_phase = 0.0f, trill_inc = 0.0f, trill_depth = 0.0f;
    float amp = 0.0f, amp_slope = 0.0f, edge = 0.25f, rough = 0.0f;
  };

  Bird bird[kBirds];
  Wander mood;
  float lean = 1.0f;     // register from the key
  float activity = 1.0f; // how keen the whole tree is right now
  int singing = 0;       // how many birds have a syllable sounding

  void seed(uint32_t base) {
    for (int b = 0; b < kBirds; ++b) bird[b].rng.seed(seed_for(base + static_cast<uint32_t>(b)));
    mood.seed(seed_for(base + kBirds));
  }

  // SPECIES

  // GRAMMAR

  void tick(float& left, float& right) {
    if (singing == 0) return;
    for (Bird& b : bird) {
      if (!b.singing) continue;
      b.u += b.du;
      if (b.u >= 1.0f) {
        b.singing = false;
        --singing;
        continue;
      }
      const float trill = b.trill_depth != 0.0f ? kit::SineTable::lookup(b.trill_phase) : 0.0f;
      b.trill_phase += b.trill_inc;
      if (b.trill_phase >= 1.0f) b.trill_phase -= 1.0f;
      b.phase += (b.inc_a + b.u * (b.inc_b + b.u * b.inc_c)) * (1.0f + b.trill_depth * trill);
      if (b.phase >= 1.0f) b.phase -= 1.0f;
      const float s = kit::SineTable::lookup(b.phase);
      // 2s² - 1 is the octave above, for nothing.
      const float tone = s + b.rough * (2.0f * s * s - 1.0f);
      const float out = tone * window(b.u, b.edge) * (b.amp + b.amp_slope * b.u);
      left += out * b.pan_left;
      right += out * b.pan_right;
    }
  }
};

}  // namespace outdoors_scene
}  // namespace livemix
