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
  static constexpr float kGain = 0.45f;

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
    float flutter = 0.0f;  // how far the trill also pulls the level down
    // What keeps a note from being a test tone: the bird's breath is never
    // quite even. One noise source of its own, heard slowly (the level and
    // the pitch waver together, and the octave with them) and quickly (a
    // faint hiss around the note).
    kit::Rng air;
    float slow = 0.0f, fast = 0.0f;
    float waver = 0.0f, jitter = 0.0f, breath = 0.0f;  // drawn for every syllable
  };

  Bird bird[kBirds];
  Wander mood;
  float lean = 1.0f;     // register from the key
  float activity = 1.0f; // how keen the whole tree is right now
  int singing = 0;       // how many birds have a syllable sounding
  // The breath's two one-poles (25 Hz and 800 Hz) and what brings each back to unit level.
  float slow_k = 0.0f, slow_norm = 0.0f, fast_k = 0.0f, fast_norm = 0.0f;

  void seed(uint32_t base) {
    for (int b = 0; b < kBirds; ++b) {
      bird[b].rng.seed(seed_for(base + static_cast<uint32_t>(b)));
      bird[b].air.seed(seed_for(base + 8u + static_cast<uint32_t>(b)));
    }
    mood.seed(seed_for(base + kBirds));
  }

  static float octaves(kit::Rng& rng, float span) { return std::exp2(span * rng.bipolar()); }

  // Draw a motif for the bird's species.
  void compose(Bird& b) {
    kit::Rng& rng = b.rng;
    for (Syllable& s : b.motif) s = Syllable();
    int n = 1;
    switch (b.species) {
      case 0: {  // thrush: a few slow fluty notes, sometimes a thin twitter to finish
        n = draw_int(rng, 3, 6);
        for (int i = 0; i < n; ++i) {
          Syllable& s = b.motif[i];
          s.f0 = between_log(rng, 2000.0f, 3500.0f);
          s.fm = s.f0 * octaves(rng, 0.18f);
          s.f1 = s.fm * octaves(rng, 0.12f);
          s.seconds = between(rng, 0.11f, 0.28f);
          s.gap = between(rng, 0.02f, 0.10f);
          s.edge = between(rng, 0.2f, 0.4f);
          s.level = between(rng, 0.7f, 1.0f);
          if (rng.uniform() < 0.3f) {
            s.trill_hz = between(rng, 22.0f, 32.0f);
            s.trill_depth = between(rng, 0.008f, 0.02f);
          }
        }
        if (rng.uniform() < 0.5f) {
          const int extra = draw_int(rng, 2, 3);
          for (int i = n; i < n + extra; ++i) {
            Syllable& s = b.motif[i];
            s.f0 = between_log(rng, 4500.0f, 7000.0f);
            s.fm = s.f0 * octaves(rng, 0.3f);
            s.f1 = s.f0 * octaves(rng, 0.3f);
            s.seconds = between(rng, 0.04f, 0.075f);
            s.gap = between(rng, 0.015f, 0.04f);
            s.level = between(rng, 0.3f, 0.5f);
          }
          n += extra;
        }
        break;
      }
      case 1: {  // tit: high, low, high, low
        n = rng.uniform() < 0.25f ? 3 : 2;
        const float high = between_log(rng, 4000.0f, 5600.0f);
        const float low = high * between(rng, 0.70f, 0.82f);
        for (int i = 0; i < n; ++i) {
          Syllable& s = b.motif[i];
          s.f0 = i == 0 ? high : (i == 1 ? low : 0.5f * (high + low));
          s.fm = s.f0 * 0.99f;
          s.f1 = s.f0 * between(rng, 0.95f, 0.99f);
          s.seconds = between(rng, 0.08f, 0.125f);
          s.gap = between(rng, 0.03f, 0.065f);
          s.edge = 0.22f;
          s.rough = 0.05f;
        }
        break;
      }
      case 2: {  // wren: one short falling chirp, many times a second
        Syllable& s = b.motif[0];
        s.f0 = between_log(rng, 5500.0f, 7500.0f);
        s.f1 = s.f0 * between(rng, 0.55f, 0.7f);
        s.fm = 0.5f * (s.f0 + s.f1) * between(rng, 0.92f, 1.0f);
        s.seconds = between(rng, 0.028f, 0.045f);
        s.gap = 1.0f / between(rng, 13.0f, 24.0f) - s.seconds;
        s.edge = 0.3f;
        s.level = 0.8f;
        break;
      }
      case 3: {  // sparrow: a cheep that rises and falls
        n = draw_int(rng, 1, 2);
        for (int i = 0; i < n; ++i) {
          Syllable& s = b.motif[i];
          s.f0 = between_log(rng, 3200.0f, 4500.0f);
          s.fm = s.f0 * between(rng, 1.25f, 1.5f);
          s.f1 = s.f0 * between(rng, 0.9f, 1.1f);
          s.seconds = between(rng, 0.05f, 0.09f);
          s.gap = between(rng, 0.12f, 0.4f);
          s.rough = between(rng, 0.15f, 0.3f);
          s.edge = 0.3f;
        }
        break;
      }
      case 4: {  // warbler: a hurried run of unlike notes
        n = draw_int(rng, 5, 9);
        for (int i = 0; i < n; ++i) {
          Syllable& s = b.motif[i];
          s.f0 = between_log(rng, 2600.0f, 6800.0f);
          s.fm = s.f0 * octaves(rng, 0.4f);
          s.f1 = s.fm * octaves(rng, 0.3f);
          s.seconds = between(rng, 0.04f, 0.11f);
          s.gap = between(rng, 0.012f, 0.05f);
          s.level = between(rng, 0.6f, 1.0f);
          s.edge = between(rng, 0.2f, 0.45f);
        }
        break;
      }
      case 5: {  // finch: a run that falls and speeds up, then a flourish
        n = draw_int(rng, 7, kMotif);
        const float top = between_log(rng, 5200.0f, 6500.0f);
        const float bottom = top * between(rng, 0.48f, 0.58f);
        for (int i = 0; i < n - 1; ++i) {
          const float along = static_cast<float>(i) / static_cast<float>(n - 2);
          Syllable& s = b.motif[i];
          s.f0 = top * std::pow(bottom / top, along);
          s.fm = s.f0 * 0.93f;
          s.f1 = s.f0 * 0.84f;
          s.seconds = kit::lerp(0.055f, 0.034f, along);
          s.gap = kit::lerp(0.075f, 0.02f, along);
          s.level = kit::lerp(0.6f, 1.0f, along);
          s.edge = 0.3f;
        }
        Syllable& last = b.motif[n - 1];
        last.f0 = bottom * 1.2f;
        last.fm = bottom * between(rng, 1.7f, 2.0f);
        last.f1 = bottom * between(rng, 0.9f, 1.1f);
        last.seconds = between(rng, 0.13f, 0.19f);
        last.gap = 0.1f;
        break;
      }
      case 6: {  // whistler: one or two long slurs
        n = draw_int(rng, 1, 2);
        const bool up = rng.uniform() < 0.65f;
        for (int i = 0; i < n; ++i) {
          Syllable& s = b.motif[i];
          const float low = between_log(rng, 1900.0f, 2600.0f);
          const float high = low * between(rng, 1.3f, 1.8f);
          s.f0 = up ? low : high;
          s.f1 = up ? high : low;
          s.fm = kit::lerp(s.f0, s.f1, between(rng, 0.2f, 0.7f));
          s.seconds = between(rng, 0.22f, 0.45f);
          s.gap = between(rng, 0.15f, 0.35f);
          s.edge = 0.18f;
          s.tilt = between(rng, -0.4f, 0.3f);
          s.trill_hz = between(rng, 24.0f, 34.0f);
          s.trill_depth = between(rng, 0.0f, 0.012f);
        }
        break;
      }
      default: {  // buzzer: a long dry note that rattles
        Syllable& s = b.motif[0];
        s.f0 = between_log(rng, 3800.0f, 5200.0f);
        s.fm = s.f0 * between(rng, 0.96f, 1.02f);
        s.f1 = s.f0 * between(rng, 0.88f, 1.0f);
        s.seconds = between(rng, 0.35f, 0.7f);
        s.gap = between(rng, 0.25f, 0.5f);
        s.trill_hz = between(rng, 55.0f, 110.0f);
        s.trill_depth = between(rng, 0.04f, 0.09f);
        s.rough = 0.2f;
        s.edge = 0.12f;
        s.level = 0.7f;
        break;
      }
    }
    // Fades take about 20 ms whatever the length: a long note gets an edge,
    // a short chirp is a bell.
    for (int i = 0; i < n; ++i) {
      b.motif[i].edge = kit::clamp(b.motif[i].edge * 0.07f / b.motif[i].seconds, 0.06f, 0.5f);
    }
    b.length = n;
  }

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
    // (Uniform noise has a variance of a third; a one-pole leaves k / (2 - k) of it.)
    slow_k = 1.0f - std::exp(-2.0f * kit::kPi * 25.0f / c.sample_rate);
    fast_k = 1.0f - std::exp(-2.0f * kit::kPi * 800.0f / c.sample_rate);
    slow_norm = std::sqrt(3.0f * (2.0f - slow_k) / slow_k);
    fast_norm = std::sqrt(3.0f * (2.0f - fast_k) / fast_k);
    for (int i = 0; i < kBirds; ++i) {
      bird[i].singing = false;
      arrive(bird[i], i);
      // The nearest bird answers the key at once; the others join in.
      bird[i].wait = i == 0 ? 0.03f : between(bird[i].rng, 0.4f, 2.0f + 2.5f * static_cast<float>(i));
    }
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
    const float patience = (2.2f - 2.0f * c.density) / kit::max(activity, 0.05f);
    if (b.repeats <= 0) {
      if (b.phrases <= 0) {
        // The bout is over: a long silence, and after a few bouts another bird.
        b.phrases = draw_int(b.rng, habit.bout_lo, habit.bout_hi);
        b.wait = (slot == 0 ? between(b.rng, 3.0f, 8.0f) : between(b.rng, 4.0f, 12.0f)) * patience;
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
    // (No two gaps alike either, or a repeated motif ticks like a clock.)
    b.wait = s.seconds + s.gap * (1.0f + 0.15f * b.air.bipolar());
    if (++b.at >= b.length) {
      b.at = 0;
      b.swell = kit::min(1.0f, b.swell + 0.13f);
      if (--b.repeats <= 0) b.wait += between(b.rng, habit.pause_lo, habit.pause_hi) * patience;
    }
  }

  void sing(Bird& b, const Syllable& s, const Controls& c) {
    const float sr = c.sample_rate;
    // Tone moves the register by a third either way and adds the octave.
    // No bird sings a note twice quite alike.
    const float reg = lean * b.own * b.shift * std::exp2(0.6f * (c.tone - 0.5f) + 0.012f * b.rng.bipolar()) / sr;
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
    b.flutter = kit::min(0.75f, 8.0f * s.trill_depth);
    b.edge = s.edge;
    b.rough = kit::min(0.45f, s.rough + 0.25f * c.tone * c.tone);
    const float level = kGain * s.level * b.near * b.fade * b.swell * std::exp2(0.25f * b.rng.bipolar() - 0.25f) /
                        (1.0f + b.rough);
    b.amp = level * (1.0f - kit::max(0.0f, s.tilt));
    b.amp_slope = level * s.tilt;
    b.phase = 0.0f;
    // How uneven this note is: the level wavers by a tenth or so, the pitch
    // by a few cents, and a hiss sits about 25 dB under the tone.
    b.waver = between(b.air, 0.05f, 0.16f);
    b.jitter = between(b.air, 0.0015f, 0.0045f);
    b.breath = between(b.air, 0.05f, 0.12f);
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
      const float white = b.air.bipolar();
      b.slow += (white - b.slow) * slow_k;
      b.fast += (white - b.fast) * fast_k;
      const float drift = kit::clamp(b.slow * slow_norm, -2.0f, 2.0f);
      b.phase += (b.inc_a + b.u * (b.inc_b + b.u * b.inc_c)) * (1.0f + b.trill_depth * trill) *
                 (1.0f + b.jitter * drift);
      if (b.phase >= 1.0f) b.phase -= 1.0f;
      const float s = kit::SineTable::lookup(b.phase);
      // 2s² - 1 is the octave above, for nothing; it comes and goes with the
      // breath. The hiss is noise times the tone: a band around the note.
      const float tone = s * (1.0f + b.breath * fast_norm * b.fast) +
                         b.rough * (1.0f + 0.5f * drift) * (2.0f * s * s - 1.0f);
      const float out = tone * window(b.u, b.edge) * (b.amp + b.amp_slope * b.u) *
                        (1.0f - b.flutter * (0.5f - 0.5f * trill)) * (1.0f + b.waver * drift);
      left += out * b.pan_left;
      right += out * b.pan_right;
    }
  }
};

}  // namespace outdoors_scene
}  // namespace livemix
