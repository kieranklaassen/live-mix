#pragma once

// A pond: up to five frogs a key. A croak is a train of pulses (tens a
// second) into three formant resonators, the frog's body and mouth; the
// kinds differ in pulse rate, formants and how a call is put together. Two
// croakers call and answer in the gaps of each other; a peeper whistles
// above them; a trilling one and a deep one join as Density rises.

#include "scene.h"

namespace livemix {
namespace outdoors_scene {

struct Frogs {
  static constexpr int kFrogs = 5;
  static constexpr int kFormants = 3;
  static constexpr float kGain = 0.89f;
  enum Kind : int { kCroak = 0, kPeep, kTrill, kDeep, kKinds };
  // Which kind sits in which slot: slots fill in this order as Density rises.
  static constexpr int kSlot[kFrogs] = {kCroak, kCroak, kPeep, kTrill, kDeep};

  // A kind's body: formants (Hz), how much of each, how long each rings
  // (seconds to -60 dB), and the pulse rate (Hz) at the start and end of a call.
  struct Body {
    float hz[kFormants], gain[kFormants], ring[kFormants];
    float rate_lo, rate_hi;
  };
  static constexpr Body kBody[kKinds] = {
      {{620.0f, 1450.0f, 2400.0f}, {1.0f, 0.55f, 0.2f}, {0.022f, 0.016f, 0.012f}, 60.0f, 92.0f},
      {{2900.0f, 0.0f, 0.0f}, {1.0f, 0.0f, 0.0f}, {0.0f, 0.0f, 0.0f}, 0.0f, 0.0f},  // a whistle, no pulses
      {{1250.0f, 2500.0f, 3600.0f}, {1.0f, 0.5f, 0.15f}, {0.020f, 0.014f, 0.010f}, 20.0f, 30.0f},
      {{250.0f, 1050.0f, 1900.0f}, {1.0f, 0.3f, 0.08f}, {0.035f, 0.020f, 0.012f}, 88.0f, 104.0f},
  };

  struct Frog {
    kit::Rng rng;
    int kind = kCroak;
    float size = 1.0f;  // this individual: scales formants and pulse rate
    float near = 1.0f;
    float pan_left = 0.7071f, pan_right = 0.7071f;
    Ringer formant[kFormants];
    float gain[kFormants] = {};
    bool ringing = false;
    // The call that is sounding.
    bool calling = false;
    float u = 0.0f, du = 0.0f;
    float period_a = 600.0f, period_b = 600.0f;  // samples between pulses, start and end
    float until = 0.0f;
    float amp = 0.0f, edge = 0.2f;
    float phase = 0.0f, inc_a = 0.0f, inc_b = 0.0f;  // the peeper's whistle
    // What comes next (counted on the control clock).
    float wait = 1.0f;       // seconds to the next call
    int calls = 0;           // calls left in this bout
    int part = 0;            // which half of a two-part croak comes next
    float pace = 0.6f;       // seconds from call to call in a bout
    float fade = 1.0f;
    // No frog shapes its mouth the same way twice: every call draws where
    // each formant sits and how far it moves while the call lasts.
    kit::Rng throat;
    float set[kFormants] = {1.0f, 1.0f, 1.0f};   // this call's formants against the body's
    float bend[kFormants] = {0.0f, 0.0f, 0.0f};  // how far each moves from start to end
  };

  Frog frog[kFrogs];
  kit::DcBlocker floor[2];  // a pulse lands on one side of zero: take out what that leaves
  Wander mood;
  float lean = 1.0f;
  float tune = 1.0f;      // key and Tone on the formants
  float bright = 1.0f;    // Tone on the upper formants
  float seen_tone = -1.0f;
  float activity = 1.0f;
  bool answering = false; // the second croaker has taken up the first one's bout

  void seed(uint32_t base) {
    for (int i = 0; i < kFrogs; ++i) {
      frog[i].rng.seed(seed_for(base + static_cast<uint32_t>(i)));
      frog[i].throat.seed(seed_for(base + 0x1000u + static_cast<uint32_t>(i)));
    }
    mood.seed(seed_for(base + kFrogs));
  }

  static int draw_int(kit::Rng& rng, int lo, int hi) {
    return lo + static_cast<int>(rng.next_u32() % static_cast<uint32_t>(hi - lo + 1));
  }

  void start(float hz, const Controls& c) {
    lean = key_lean(hz, 0.3f, 0.5f);
    answering = false;
    for (kit::DcBlocker& f : floor) {
      f.reset();
      f.set_cutoff(90.0f, c.sample_rate);
    }
    for (int i = 0; i < kFrogs; ++i) {
      Frog& f = frog[i];
      kit::Rng& rng = f.rng;
      f.kind = kSlot[i];
      f.size = i == 0 ? between(rng, 0.95f, 1.05f) : between_log(rng, 0.8f, 1.25f);
      f.near = i == 0 ? 1.0f : between_log(rng, 0.25f, 0.7f);
      const float side = rng.bipolar();
      kit::pan_gains(i == 0 ? 0.4f * side : (side < 0.0f ? side * 0.7f - 0.3f : side * 0.7f + 0.3f),
                     &f.pan_left, &f.pan_right);
      for (Ringer& r : f.formant) r.reset();
      f.ringing = false;
      f.calling = false;
      f.calls = 0;
      f.part = 0;
      f.fade = 1.0f;
      // The nearest answers the key; the second croaker waits to be called.
      f.wait = i == 0 ? 0.03f : (i == 1 ? 1.0e9f : between(rng, 1.0f, 3.0f + 2.0f * static_cast<float>(i)));
    }
    seen_tone = -1.0f;
    retune(c);
  }

  void retune(const Controls& c) {
    if (c.tone == seen_tone) return;
    seen_tone = c.tone;
    tune = lean * std::exp2(0.5f * (c.tone - 0.5f));
    bright = 0.5f + c.tone;
  }

  void control(const Controls& c) {
    const float dt = c.step_seconds;
    retune(c);
    // A pond swells and hushes as one; Movement is how far.
    const float wave = mood.next(0.08f, dt);
    activity = kit::lerp(1.0f, 0.2f + 1.8f * wave * wave, c.movement);
    const int here = 1 + static_cast<int>(c.density * static_cast<float>(kFrogs - 1) + 0.5f);
    for (int i = 0; i < kFrogs; ++i) {
      Frog& f = frog[i];
      if (f.calling && f.kind != kPeep) {
        // The mouth opens through a croak: the first formant rises, and the
        // others go their own way, by this call's amounts.
        for (int k = 0; k < kFormants; ++k) {
          const float hz = kBody[f.kind].hz[k] * f.size * tune * f.set[k] * (1.0f + f.bend[k] * f.u);
          f.formant[k].eps = 2.0f * kit::SineTable::lookup(0.5f * kit::min(hz, 0.45f * c.sample_rate) / c.sample_rate);
        }
      }
      if (f.ringing && !f.calling &&
          f.formant[0].size() + f.formant[1].size() + f.formant[2].size() < 1.0e-7f) {
        for (Ringer& r : f.formant) r.reset();
        f.ringing = false;
      }
      f.wait -= dt;
      if (f.wait > 0.0f || f.calling) continue;
      if (i >= here) {
        f.wait = i == 1 ? 1.0e9f : 0.3f;  // not at this pond at this Density
        continue;
      }
      next(f, i, c, here);
    }
  }

  // The frog's next call, and when the one after it is due.
  void next(Frog& f, int slot, const Controls& c, int here) {
    kit::Rng& rng = f.rng;
    const float patience = (2.2f - 1.8f * c.density) / kit::max(activity, 0.05f);
    if (f.calls <= 0 && f.part == 0) {
      // A new bout.
      static constexpr int kBout[kKinds][2] = {{3, 9}, {5, 18}, {1, 2}, {1, 3}};
      static constexpr float kPace[kKinds][2] = {{0.5f, 0.78f}, {0.6f, 0.95f}, {1.9f, 2.8f}, {0.95f, 1.35f}};
      f.calls = draw_int(rng, kBout[f.kind][0], kBout[f.kind][1]);
      f.pace = between(rng, kPace[f.kind][0], kPace[f.kind][1]);
      f.fade = std::exp2(-2.0f * c.distance * rng.uniform());
      if (slot == 0) answering = rng.uniform() < 0.8f;
    }
    const float length = call(f, slot, c);
    if (f.kind == kCroak && slot == 0 && f.part == 0) {
      // "rib", and after a breath "bit".
      f.part = 1;
      f.wait = length + between(rng, 0.035f, 0.06f);
      return;
    }
    f.part = 0;
    --f.calls;
    if (slot == 0 && answering && here > 1 && !frog[1].calling) {
      // The second croaker drops its call into the gap, and may add one of
      // its own when the first has finished.
      frog[1].pace = f.pace;
      frog[1].fade = std::exp2(-2.0f * c.distance * rng.uniform());
      frog[1].wait = f.pace * between(rng, 0.38f, 0.52f);
      frog[1].calls = f.calls <= 0 && rng.uniform() < 0.4f ? draw_int(rng, 2, 3) : 1;
    }
    if (f.calls > 0) {
      f.wait = f.pace * (1.0f + 0.06f * rng.bipolar());
    } else if (slot == 1) {
      f.wait = 1.0e9f;
    } else {
      static constexpr float kRest[kKinds][2] = {{2.0f, 7.0f}, {4.0f, 14.0f}, {4.0f, 12.0f}, {6.0f, 18.0f}};
      f.wait = length + between(rng, kRest[f.kind][0], kRest[f.kind][1]) * patience;
    }
  }

  // Start one call; returns its length in seconds.
  float call(Frog& f, int slot, const Controls& c) {
    kit::Rng& rng = f.rng;
    const float sr = c.sample_rate;
    const Body& body = kBody[f.kind];
    float seconds = 0.2f, rate_a = body.rate_lo, rate_b = body.rate_hi, level = 1.0f;
    f.edge = 0.2f;
    switch (f.kind) {
      case kCroak:
        if (slot != 0) {  // one longer croak
          seconds = between(rng, 0.17f, 0.27f);
          rate_b = 0.5f * (body.rate_lo + body.rate_hi);
        } else if (f.part == 0) {
          seconds = between(rng, 0.07f, 0.10f);
          rate_b = rate_a * 1.1f;
          level = 0.8f;
        } else {
          seconds = between(rng, 0.11f, 0.17f);
          rate_a *= 1.15f;
        }
        break;
      case kPeep:
        seconds = between(rng, 0.09f, 0.15f);
        f.edge = 0.3f;
        level = 0.45f;
        break;
      case kTrill:
        seconds = between(rng, 0.6f, 1.6f);
        rate_a = rate_b = between(rng, body.rate_lo, body.rate_hi);
        f.edge = 0.12f;
        level = 1.3f;
        break;
      default:  // deep
        seconds = between(rng, 0.45f, 0.8f);
        f.edge = 0.3f;
        break;
    }
    kit::Rng& throat = f.throat;
    // A bigger frog pulses slower; and no call at quite the pace of the last,
    // nor speeding up by quite as much.
    const float speed = std::sqrt(f.size * lean) * std::exp2(0.11f * throat.bipolar());
    rate_b *= std::exp2(0.09f * throat.bipolar());
    f.period_a = sr / (rate_a * speed + 1.0e-3f);
    f.period_b = sr / (rate_b * speed + 1.0e-3f);
    static constexpr float kSet[kFormants] = {0.045f, 0.08f, 0.08f};  // octaves either way
    f.bend[0] = f.kind == kCroak ? between(throat, 0.10f, 0.26f) : between(throat, 0.0f, 0.08f);
    f.bend[1] = between(throat, -0.08f, 0.12f);
    f.bend[2] = between(throat, -0.06f, 0.06f);
    for (int k = 0; k < kFormants; ++k) {
      f.set[k] = std::exp2(kSet[k] * throat.bipolar());
      const float hz = body.hz[k] * f.size * tune * f.set[k];
      f.formant[k].tune(kit::min(hz, 0.45f * sr), sr);
      f.formant[k].decay(kit::max(body.ring[k], 1.0e-3f), sr);
      // The upper formants are a little stronger or weaker each time too.
      const float colour = k == 0 ? 1.0f : bright * std::exp2(0.4f * throat.bipolar());
      f.gain[k] = hz * 1.2f < 0.45f * sr ? body.gain[k] * colour : 0.0f;
    }
    const float pitch = kit::min(body.hz[0] * f.size * tune, 0.4f * sr) / sr;
    f.inc_a = pitch * 0.95f;
    f.inc_b = pitch * 1.03f;
    f.phase = 0.0f;
    f.amp = kGain * level * f.near * f.fade * (0.85f + 0.3f * rng.uniform());
    f.u = 0.0f;
    f.du = 1.0f / (seconds * sr);
    f.until = 0.0f;
    f.calling = true;
    f.ringing = f.kind != kPeep;
    return seconds;
  }

  void tick(float& left, float& right) {
    float body_left = 0.0f, body_right = 0.0f;
    for (Frog& f : frog) {
      if (f.calling) {
        f.u += f.du;
        if (f.u >= 1.0f) {
          f.calling = false;
        } else if (f.kind == kPeep) {
          f.phase += f.inc_a + (f.inc_b - f.inc_a) * f.u;
          if (f.phase >= 1.0f) f.phase -= 1.0f;
          const float out = kit::SineTable::lookup(f.phase) * window(f.u, f.edge) * f.amp;
          left += out * f.pan_left;
          right += out * f.pan_right;
          continue;
        } else {
          f.until -= 1.0f;
          if (f.until <= 0.0f) {
            // One pulse: never quite the same strength or spacing as the last.
            const float hit = window(f.u, f.edge) * f.amp * (1.0f + 0.2f * f.rng.bipolar());
            for (int k = 0; k < kFormants; ++k) f.formant[k].strike(hit * f.gain[k]);
            f.until += kit::lerp(f.period_a, f.period_b, f.u) * (1.0f + 0.04f * f.rng.bipolar());
          }
        }
      }
      if (!f.ringing) continue;
      const float sum = f.formant[0].tick() + f.formant[1].tick() + f.formant[2].tick();
      body_left += sum * f.pan_left;
      body_right += sum * f.pan_right;
    }
    left += floor[0].process(body_left);
    right += floor[1].process(body_right);
  }
};

}  // namespace outdoors_scene
}  // namespace livemix
