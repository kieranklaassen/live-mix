#pragma once

// A field of crickets: up to six a key. Five chirp: a tone near 4.5 kHz in
// pulses of about 11 ms, three or four to a chirp, two to four chirps a
// second, every individual with its own pitch and rate, so they drift in and
// out of step. The sixth is another kind further off that trills on without
// grouping. Timing is counted in samples, so a pulse train is exact.

#include "scene.h"

namespace livemix {
namespace outdoors_scene {

struct Crickets {
  static constexpr int kCrickets = 6;
  static constexpr float kGain = 0.5f;
  static constexpr float kPulseLevel[4] = {0.5f, 0.85f, 1.0f, 0.95f};

  struct Cricket {
    kit::Rng rng;
    float carrier = 4500.0f;     // Hz, before the key and Tone
    float chirp_seconds = 0.35f; // start to start
    float pulse_seconds = 0.02f; // start to start inside a chirp
    float length = 0.011f;       // of one pulse
    int pulses = 3;
    bool triller = false;
    float near = 1.0f;
    float pan_left = 0.7071f, pan_right = 0.7071f;
    // Running.
    float until = 0.0f;  // samples to the next pulse
    int index = 0;       // pulse within the chirp
    int count = 3;       // pulses in this chirp
    float pace = 1.0f;   // slow walk of its chirp rate
    float fade = 1.0f;   // slow walk of its level (far ones come and go)
    float run = 0.0f;    // seconds of singing left before it rests
    bool sounding = false;
    float u = 0.0f, du = 0.0f;
    float phase = 0.0f, inc = 0.0f;
    float amp = 0.0f;
  };

  Cricket cricket[kCrickets];
  // What the control step leaves for the sample loop.
  float sr = 48000.0f;
  float lean = 1.0f;    // from the key
  float pitch = 1.0f;   // key and Tone on the carrier
  float tempo = 1.0f;   // key on the rates: a warm night is higher and faster
  float movement = 0.5f;
  float distance = 0.4f;
  int here = 3;

  void seed(uint32_t base) {
    for (int i = 0; i < kCrickets; ++i) cricket[i].rng.seed(seed_for(base + static_cast<uint32_t>(i)));
  }

  void start(float hz, const Controls& c) {
    lean = key_lean(hz, 0.2f, 0.3f);
    tempo = std::pow(lean, 1.5f);
    sr = c.sample_rate;
    read(c);
    for (int i = 0; i < kCrickets; ++i) {
      Cricket& k = cricket[i];
      kit::Rng& rng = k.rng;
      k.triller = i == kCrickets - 1;
      k.carrier = k.triller ? between(rng, 3500.0f, 3900.0f) : between(rng, 4250.0f, 4950.0f);
      k.chirp_seconds = 1.0f / between(rng, 2.2f, 3.8f);
      k.pulse_seconds = k.triller ? 1.0f / between(rng, 38.0f, 52.0f) : between(rng, 0.017f, 0.023f);
      k.length = k.triller ? 0.009f : between(rng, 0.0095f, 0.0125f);
      k.pulses = rng.uniform() < 0.55f ? 3 : 4;
      k.near = i == 0 ? 1.0f : (k.triller ? between(rng, 0.10f, 0.2f) : between_log(rng, 0.12f, 0.6f));
      const float side = rng.bipolar();
      kit::pan_gains(i == 0 ? 0.4f * side : side, &k.pan_left, &k.pan_right);
      // The nearest starts with the key; the rest fall in over a second.
      k.until = (i == 0 ? 0.02f : between(rng, 0.1f, 1.2f)) * sr;
      k.index = 0;
      k.count = k.triller ? draw_run(k) : k.pulses;
      k.pace = 1.0f;
      k.fade = 1.0f;
      k.run = between(rng, 6.0f, 30.0f);
      k.sounding = false;
      k.phase = 0.0f;
    }
  }

  void read(const Controls& c) {
    pitch = lean * std::exp2(0.5f * (c.tone - 0.5f));
    movement = c.movement;
    distance = c.distance;
    here = 1 + static_cast<int>(c.density * static_cast<float>(kCrickets - 1) + 0.5f);
  }

  void control(const Controls& c) {
    sr = c.sample_rate;
    read(c);
  }

  // A pulse begins: set it sounding and decide when the next one comes.
  void pulse(Cricket& k, int slot) {
    if (slot >= here) {  // not in this field at this Density
      k.until += 0.25f * sr;
      return;
    }
    kit::Rng& rng = k.rng;
    k.sounding = true;
    k.u = 0.0f;
    k.du = 1.0f / (k.length * sr);
    k.phase = 0.0f;
    k.inc = kit::min(k.carrier * pitch, 0.45f * sr) / sr;
    const float level = k.triller ? 0.8f + 0.2f * rng.uniform() : kPulseLevel[k.index < 4 ? k.index : 3];
    k.amp = kGain * k.near * k.fade * level;
    const float jitter = 1.0f + 0.03f * rng.bipolar();
    if (++k.index < k.count) {
      k.until += k.pulse_seconds * jitter * sr / kit::max(0.5f, tempo);
      return;
    }
    // The chirp is done: when is the next?
    k.index = 0;
    k.count = k.triller ? draw_run(k) : k.pulses + (rng.uniform() < 0.12f ? (rng.uniform() < 0.5f ? 1 : -1) : 0);
    k.pace = kit::clamp(k.pace * (1.0f + 0.02f * rng.bipolar()), 0.9f, 1.1f);
    // Level wanders more the further off the field is.
    k.fade = kit::clamp(k.fade * std::exp2(0.5f * distance * rng.bipolar()), 1.0f - 0.75f * distance, 1.0f);
    const float period = k.chirp_seconds * k.pace * (1.0f + 0.05f * rng.bipolar()) / tempo;
    float gap = period - static_cast<float>(k.pulses - 1) * k.pulse_seconds / kit::max(0.5f, tempo);
    if (k.triller) gap = between(rng, 0.6f, 3.0f);
    k.run -= period;
    if (k.run <= 0.0f) {
      // It stops to listen; with Movement more often and for longer.
      k.run = between(rng, 5.0f, 40.0f) * (1.4f - movement);
      gap += between(rng, 1.0f, 4.0f + 14.0f * movement) * (0.2f + movement);
    }
    k.until += kit::max(gap, 0.03f) * sr;
  }

  // Pulses in the next run of the trilling kind: one to six seconds of them.
  static int draw_run(Cricket& k) {
    return static_cast<int>(between(k.rng, 1.0f, 6.0f) / k.pulse_seconds);
  }

  void tick(float& left, float& right) {
    for (int i = 0; i < kCrickets; ++i) {
      Cricket& k = cricket[i];
      k.until -= 1.0f;
      if (k.until <= 0.0f) pulse(k, i);
      if (!k.sounding) continue;
      k.u += k.du;
      if (k.u >= 1.0f) {
        k.sounding = false;
        continue;
      }
      // A quick rise and a slower fall; the pitch sags a little as it rings.
      const float bent = k.u * (2.0f - k.u);
      const float shape = 0.5f - 0.5f * kit::SineTable::cos_lookup(bent);
      k.phase += k.inc * (1.0f - 0.03f * k.u);
      if (k.phase >= 1.0f) k.phase -= 1.0f;
      const float out = kit::SineTable::lookup(k.phase) * shape * k.amp;
      left += out * k.pan_left;
      right += out * k.pan_right;
    }
  }
};

}  // namespace outdoors_scene
}  // namespace livemix
