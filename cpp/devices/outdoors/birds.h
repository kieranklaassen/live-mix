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

  // How a species uses its motif: repeats of it in a phrase, the pause
  // between phrases (seconds), phrases in a bout, and the chance that a
  // phrase gets a newly drawn motif.
  struct Habit {
    int repeat_lo, repeat_hi;
    float pause_lo, pause_hi;
    int bout_lo, bout_hi;
    float fresh;
  };
  static constexpr Habit kHabit[kSpecies] = {
      {1, 1, 1.8f, 4.5f, 4, 9, 0.65f},    // thrush: a new fluty phrase most times
      {3, 7, 2.5f, 6.0f, 3, 6, 0.15f},    // tit: two notes, over and over
      {12, 28, 4.0f, 9.0f, 2, 5, 0.2f},   // wren: a long fast trill
      {2, 6, 0.8f, 3.0f, 4, 10, 0.3f},    // sparrow: loose chirps
      {1, 2, 2.5f, 6.0f, 3, 6, 1.0f},     // warbler: never the same twice
      {1, 1, 5.0f, 9.0f, 2, 5, 0.1f},     // finch: a falling run and a flourish
      {1, 3, 4.0f, 9.0f, 2, 4, 0.3f},     // whistler: long slurs
      {1, 2, 5.0f, 11.0f, 2, 4, 0.2f},    // buzzer: a dry buzzing trill
  };

  static int draw_int(kit::Rng& rng, int lo, int hi) {
    return lo + static_cast<int>(rng.next_u32() % static_cast<uint32_t>(hi - lo + 1));
  }

  void start(float hz, const Controls& c) {
    lean = key_lean(hz, 0.33f, 0.5f);
    singing = 0;
    for (int i = 0; i < kBirds; ++i) {
      bird[i].singing = false;
      arrive(bird[i], i);
      // The nearest bird answers the key at once; the others join in.
      bird[i].wait = i == 0 ? 0.03f : between(bird[i].rng, 0.4f, 2.0f + 2.5f * static_cast<float>(i));
    }
    (void)c;
  }

  // A bird lands: which species, where, how far off, and its first motif.
  void arrive(Bird& b, int slot) {
    b.species = slot == 0 ? 0 : draw_int(b.rng, 0, kSpecies - 1);
    if (slot != 0) {
      for (int other = 0; other < kBirds; ++other) {  // two of a kind only by a second coincidence
        if (&bird[other] != &b && bird[other].species == b.species) {
          b.species = draw_int(b.rng, 1, kSpecies - 1);
          break;
        }
      }
    }
    const float side = b.rng.bipolar();
    kit::pan_gains(slot == 0 ? 0.45f * side : (side < 0.0f ? side * 0.8f - 0.2f : side * 0.8f + 0.2f),
                   &b.pan_left, &b.pan_right);
    b.near = slot == 0 ? 1.0f : between_log(b.rng, 0.16f, 0.6f);
    b.own = between_log(b.rng, 0.93f, 1.09f);
    b.songs = draw_int(b.rng, 2, 5);
    b.phrases = draw_int(b.rng, kHabit[b.species].bout_lo, kHabit[b.species].bout_hi);
    b.repeats = 0;
    b.at = 0;
    compose(b);
  }

  void control(const Controls& c) {
    const float dt = c.step_seconds;
    // Waves of activity: with Movement the whole tree goes quiet and picks up again.
    const float wave = mood.next(0.07f, dt);
    activity = kit::lerp(1.0f, 0.3f + 1.6f * wave * wave, c.movement);
    const int here = 1 + static_cast<int>(c.density * static_cast<float>(kBirds - 1) + 0.5f);
    for (int i = 0; i < kBirds; ++i) {
      Bird& b = bird[i];
      b.wait -= dt;
      if (b.wait > 0.0f || b.singing) continue;
      if (i >= here) {
        b.wait = 0.25f;  // not in this tree at this Density
        continue;
      }
      advance(b, i, c);
    }
  }

  // The next thing this bird does: a syllable, or the wait before one.
  void advance(Bird& b, int slot, const Controls& c) {
    const Habit& habit = kHabit[b.species];
    // Sparse scenes leave long gaps; a busy one hardly pauses.
    const float patience = (2.4f - 2.0f * c.density) / kit::max(activity, 0.05f);
    if (b.repeats <= 0) {
      if (b.phrases <= 0) {
        // The bout is over: a long silence, and after a few bouts another bird.
        b.phrases = draw_int(b.rng, habit.bout_lo, habit.bout_hi);
        b.wait = (slot == 0 ? between(b.rng, 3.0f, 8.0f) : between(b.rng, 6.0f, 20.0f)) * patience;
        if (--b.songs <= 0) arrive(b, slot);
        return;
      }
      --b.phrases;
      b.repeats = draw_int(b.rng, habit.repeat_lo, habit.repeat_hi);
      if (b.rng.uniform() < habit.fresh) compose(b);
      b.shift = std::exp2(0.06f * b.rng.bipolar());
      // Far birds come and go with the air between.
      b.fade = std::exp2(-2.0f * c.distance * b.rng.uniform());
      b.swell = habit.repeat_hi > 8 ? 0.35f : 1.0f;
      b.at = 0;
    }
    const Syllable& s = b.motif[b.at];
    sing(b, s, c);
    b.wait = s.seconds + s.gap;
    if (++b.at >= b.length) {
      b.at = 0;
      b.swell = kit::min(1.0f, b.swell + 0.13f);
      if (--b.repeats <= 0) b.wait += between(b.rng, habit.pause_lo, habit.pause_hi) * patience;
    }
  }

  void sing(Bird& b, const Syllable& s, const Controls& c) {
    const float sr = c.sample_rate;
    // Tone moves the register by a third either way and adds the octave.
    const float reg = lean * b.own * b.shift * std::exp2(0.6f * (c.tone - 0.5f)) / sr;
    const float top = 9500.0f / sr, bottom = 500.0f / sr;
    const float i0 = kit::clamp(s.f0 * reg, bottom, top);
    const float im = kit::clamp(s.fm * reg, bottom, top);
    const float i1 = kit::clamp(s.f1 * reg, bottom, top);
    // The parabola through the three pitches.
    b.inc_a = i0;
    b.inc_b = -3.0f * i0 + 4.0f * im - i1;
    b.inc_c = 2.0f * i0 - 4.0f * im + 2.0f * i1;
    b.u = 0.0f;
    b.du = 1.0f / kit::max(8.0f, s.seconds * sr);
    b.trill_phase = 0.0f;
    b.trill_inc = s.trill_hz / sr;
    b.trill_depth = s.trill_depth;
    b.edge = s.edge;
    b.rough = kit::min(0.45f, s.rough + 0.25f * c.tone * c.tone);
    const float level = kGain * s.level * b.near * b.fade * b.swell / (1.0f + b.rough);
    b.amp = level * (1.0f - kit::max(0.0f, s.tilt));
    b.amp_slope = level * s.tilt;
    b.phase = 0.0f;
    if (!b.singing) ++singing;
    b.singing = true;
  }

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
