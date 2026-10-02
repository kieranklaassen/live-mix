#pragma once

// Running water as a population of bubbles. A bubble is a damped sine whose
// pitch is set by its radius (the Minnaert resonance, about 3 / r Hz for r in
// metres), which rings shorter the smaller it is and whose pitch rises as it
// decays because it is forming near the surface. Small bubbles are many and
// quiet, large ones few and loud. They are shed at four places in the bed,
// each with its own size of bubble, its own spot in the image and a flow
// that babbles; under them runs a soft band of noise, the rush.

#include "scene.h"

namespace livemix {
namespace outdoors_scene {

struct Stream {
  static constexpr int kBubbles = 12;
  static constexpr int kSites = 4;
  static constexpr float kGain = 0.5f;
  static constexpr float kRush = 0.5f;
  // Where each place sheds: bubble pitch (Hz), spread (octaves), pan, share of the flow.
  static constexpr float kCentre[kSites] = {650.0f, 1250.0f, 2300.0f, 4000.0f};
  static constexpr float kSpread[kSites] = {0.45f, 0.55f, 0.6f, 0.65f};
  static constexpr float kPan[kSites] = {0.25f, -0.6f, 0.7f, -0.2f};
  static constexpr float kShare[kSites] = {0.08f, 0.2f, 0.32f, 0.4f};

  struct Bubble {
    Ringer osc;
    float rise = 0.0f;  // added to the oscillator's angle every sample
    int left = 0;       // samples it has yet to sound
    int site = 0;
  };

  Bubble bubble[kBubbles];
  int sounding = 0;  // the first `sounding` bubbles are alive
  kit::Rng rng;
  kit::Noise noise[2];
  kit::OnePole rush_low[2], rush_high[2];
  Wander babble[kSites];
  Wander surge;
  float flow[kSites] = {};  // bubbles a second at each place, now
  float total = 0.0f;       // all of them, per sample
  float until = 1.0f;       // expected bubbles left before the next
  float pan_left[kSites] = {}, pan_right[kSites] = {};
  float sr = 48000.0f;
  float lean = 1.0f, pitch = 1.0f;
  float level = 1.0f, rush = 0.0f, rush_target = 0.0f, rush_step = 0.0f;

  void seed(uint32_t base) {
    rng.seed(seed_for(base));
    noise[0].seed(seed_for(base + 1));
    noise[1].seed(seed_for(base + 2));
    for (int s = 0; s < kSites; ++s) babble[s].seed(seed_for(base + 3 + static_cast<uint32_t>(s)));
    surge.seed(seed_for(base + 3 + kSites));
  }

  void start(float hz, const Controls& c) {
    sr = c.sample_rate;
    lean = key_lean(hz, 0.4f, 0.8f);
    sounding = 0;
    until = 0.05f;
    for (int s = 0; s < kSites; ++s) kit::pan_gains(kPan[s], &pan_left[s], &pan_right[s]);
    for (int ch = 0; ch < 2; ++ch) {
      rush_low[ch].reset();
      rush_high[ch].reset();
    }
    control(c);
    rush = rush_target;
    rush_step = 0.0f;
  }

  void control(const Controls& c) {
    const float dt = c.step_seconds;
    sr = c.sample_rate;
    pitch = lean * std::exp2(1.2f * (c.tone - 0.5f));
    // 25 bubbles a second is a trickle; 1000 is a brook in a hurry.
    const float rate = 25.0f * std::pow(40.0f, c.density);
    // The whole stream surges slowly; each place babbles quickly on its own.
    const float swell = kit::lerp(1.0f, 0.45f + 1.3f * surge.next(0.15f, dt), c.movement);
    float sum = 0.0f;
    for (int s = 0; s < kSites; ++s) {
      const float b = babble[s].next(2.5f + 1.3f * static_cast<float>(s), dt);
      flow[s] = rate * swell * kShare[s] * kit::lerp(1.0f, 3.0f * b * b, 0.3f + 0.7f * c.movement);
      sum += flow[s];
    }
    total = sum / sr;
    // From far off the single bubbles sink into the rush.
    level = kGain * (1.0f - 0.45f * c.distance);
    rush = rush_target;  // where the last step's ramp ended
    rush_target = kRush * (0.5f + 1.5f * c.distance) * std::sqrt(sum / 250.0f) * 0.12f;
    rush_step = (rush_target - rush) / static_cast<float>(kControlPeriod);
    for (int ch = 0; ch < 2; ++ch) {
      rush_low[ch].set_cutoff(kit::min(1400.0f * pitch, 0.4f * sr), sr);
      rush_high[ch].set_cutoff(350.0f * pitch, sr);
    }
  }

  void spawn() {
    if (sounding >= kBubbles) return;  // the pool is full: this one is lost in the others
    // Which place: by its share of the flow now.
    float pick = rng.uniform() * total * sr;
    int site = 0;
    while (site < kSites - 1 && pick > flow[site]) pick -= flow[site++];
    const float scatter = 0.5f * (rng.bipolar() + rng.bipolar());  // triangular
    const float hz = kit::clamp(kCentre[site] * pitch * std::exp2(2.0f * kSpread[site] * scatter), 120.0f, 0.27f * sr);
    // Damping per second for that size: thermal and radiative losses both grow as it shrinks.
    const float damping = 0.0433f * hz + 0.001386f * hz * std::sqrt(hz);
    Bubble& b = bubble[sounding++];
    b.site = site;
    b.osc.tune(hz, sr);
    const float per_sample = damping / sr;
    b.osc.r = 1.0f - per_sample + 0.5f * per_sample * per_sample;
    // The pitch climbs by up to a seventh of itself per time constant.
    // (Held short of where the oscillator would stop being one.)
    const float room = kit::max(0.0f, 1.9f / b.osc.eps - 1.0f) * 0.2f;
    b.rise = b.osc.eps * kit::min(between(rng, 0.0f, 0.14f), room) * per_sample;
    // Bigger is louder; most start shallow and weak, a few deep and strong.
    const float depth = rng.uniform();
    b.osc.x = 0.0f;
    b.osc.y = -level * (0.08f + 0.92f * depth * depth * depth) * kit::min(2.5f, 1000.0f / hz);
    b.left = static_cast<int>(4.6f * sr / damping);  // 40 dB down
  }

  void tick(float& left, float& right) {
    until -= total;
    while (until <= 0.0f) {
      until += exp_gap(rng, 1.0f);
      spawn();
    }
    float at[kSites] = {0.0f, 0.0f, 0.0f, 0.0f};
    for (int i = 0; i < sounding; ++i) {
      Bubble& b = bubble[i];
      const float before = b.osc.x;
      const float now = b.osc.tick();
      at[b.site] += now;
      b.osc.eps += b.rise;
      // Gone once it is 40 dB down, at its next zero crossing.
      if (--b.left <= 0 && (before < 0.0f) != (now < 0.0f)) {
        b = bubble[--sounding];
        --i;
      }
    }
    rush += rush_step;
    float l = rush * rush_high[0].highpass(rush_low[0].lowpass(noise[0].pink()));
    float r = rush * rush_high[1].highpass(rush_low[1].lowpass(noise[1].pink()));
    for (int s = 0; s < kSites; ++s) {
      l += at[s] * pan_left[s];
      r += at[s] * pan_right[s];
    }
    left += l;
    right += r;
  }
};

}  // namespace outdoors_scene
}  // namespace livemix
