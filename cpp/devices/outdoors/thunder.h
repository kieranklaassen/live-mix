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
  static constexpr float kGain = 3.0f;
  static constexpr float kCrack = 1.6f;
  static constexpr float kLull = 0.09f;  // what is left of the arrivals between claps
  // The chain of one-poles, and after which of them each band is taken:
  // the body has gone through two at 420 Hz, so it carries no hiss.
  static constexpr int kPoles = 5;
  static constexpr float kCorner[kPoles] = {2800.0f, 420.0f, 420.0f, 130.0f, 48.0f};
  static constexpr int kTap[kBands] = {0, 2, 3, 4};
  // What makes each band as loud as the others for the same envelope.
  static constexpr float kTrim[kBands] = {0.35f, 1.4f, 2.4f, 4.8f};
  // Seconds to fall to 1/e after an arrival, and to rise to it.
  static constexpr float kFall[kBands] = {0.07f, 0.16f, 0.3f, 0.45f};
  static constexpr float kRise[kBands] = {0.002f, 0.012f, 0.04f, 0.09f};

  kit::Rng rng;
  kit::Noise noise[2];
  kit::OnePole pole[2][kPoles];
  kit::DcBlocker floor[2];  // nothing under 25 Hz: it only eats headroom
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
  float lobe = 1.0f;       // strength of the arrivals now: up with a clap, then down
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
      for (kit::OnePole& q : pole[ch]) q.reset();
      for (int k = 0; k < kBands; ++k) {
        kick[ch][k] = level[ch][k] = gain[ch][k] = target[ch][k] = step[ch][k] = 0.0f;
      }
    }
    for (kit::DcBlocker& f : floor) {
      f.reset();
      f.set_cutoff(25.0f, c.sample_rate);
    }
    sounding = false;
    rolling = false;
    // The key brings the first stroke; a key added to others brings its own
    // a little later, so a chord is a storm and not one clap eight times over.
    wait = c.held > 0 ? between(rng, 0.4f, 3.0f) : 0.01f;
    seen_tone = -1.0f;
    retune(c);
  }

  float fall[kBands] = {}, rise[kBands] = {};
  float target[2][kBands] = {};
  float trim = 1.0f;
  float seen_tone = -1.0f, seen_distance = -1.0f;

  // Coefficients that follow Tone and Distance, redone only when they move.
  void retune(const Controls& c) {
    if (c.tone == seen_tone && c.distance == seen_distance) return;
    seen_tone = c.tone;
    seen_distance = c.distance;
    const float sr = c.sample_rate;
    tilt = lean * std::exp2(1.2f * (c.tone - 0.5f));
    // White noise spreads its power to half the sample rate: keep the level
    // of what the low-passes leave the same at any rate.
    trim = kGain * std::sqrt(sr / 48000.0f);
    // Overhead (the nearest third of Distance) the crack is brighter and
    // over sooner: the top band opens up and falls in half the time.
    const float close = nearness(c);
    for (int q = 0; q < kPoles; ++q) {
      const float open = q == 0 ? 1.0f + 1.5f * close : 1.0f;
      for (int ch = 0; ch < 2; ++ch) {
        pole[ch][q].set_cutoff(kit::min(kCorner[q] * tilt * open, 0.4f * sr), sr);
      }
    }
    for (int k = 0; k < kBands; ++k) {
      const float quick = k == 0 ? 1.0f - 0.5f * close : 1.0f;
      fall[k] = std::exp(-c.step_seconds / (kFall[k] * quick * (1.0f + 0.6f * c.distance)));
      // From far off nothing arrives with an edge.
      rise[k] = 1.0f - std::exp(-c.step_seconds / (kRise[k] * (1.0f + 9.0f * c.distance)));
    }
  }

  // 1 with the storm overhead, 0 from Distance 0.3 outwards.
  static float nearness(const Controls& c) { return kit::max(0.0f, 1.0f - c.distance / 0.3f); }

  void control(const Controls& c) {
    const float dt = c.step_seconds;
    retune(c);
    wait -= dt;
    if (wait <= 0.0f) {
      // A stroke a minute when sparse, one every ten seconds when the storm is overhead.
      wait = 60.0f * std::pow(1.0f / 6.0f, c.density) * between(rng, 0.5f, 1.5f);
      strike(c);
    }
    if (rolling) {
      t += dt;
      // Every clap dies back into the murmur, and the murmur itself thins out.
      const float left = 1.0f - kit::min(1.0f, t / length);
      lobe += (kLull * left - lobe) * kit::min(1.0f, dt / 0.3f);
      while (rolling && t >= next) arrive(c);
    }
    if (!sounding) return;
    float total = 0.0f;
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < kBands; ++k) {
        kick[ch][k] = flush_denormal(kick[ch][k] * fall[k]);
        level[ch][k] = flush_denormal(level[ch][k] + (kick[ch][k] - level[ch][k]) * rise[k]);
        gain[ch][k] = target[ch][k];  // where the last ramp ended
        target[ch][k] = level[ch][k] * kTrim[k] * trim;
        step[ch][k] = (target[ch][k] - gain[ch][k]) / static_cast<float>(kControlPeriod);
        total += level[ch][k] + kick[ch][k];
      }
    }
    if (!rolling && total < 1.0e-7f) {
      for (int ch = 0; ch < 2; ++ch) {
        for (int k = 0; k < kBands; ++k) {
          kick[ch][k] = level[ch][k] = gain[ch][k] = target[ch][k] = step[ch][k] = 0.0f;
        }
        for (kit::OnePole& q : pole[ch]) q.reset();
      }
      sounding = false;
    }
  }

  void strike(const Controls& c) {
    rolling = true;
    sounding = true;
    t = 0.0f;
    next = 0.0f;
    // Strokes differ more the more the storm moves and the further off it is.
    const float unlike = kit::min(0.85f, 0.25f + 0.45f * c.movement + 0.25f * c.distance);
    size = 1.0f - unlike * rng.uniform();
    // (Overhead, the whole length of the channel is heard: the rumble after
    // the crack goes on for longer than from the middle distance.)
    length = between(rng, 2.5f, 5.0f) * (1.0f + 1.2f * c.distance) * (1.0f + 0.6f * nearness(c));
    place = 0.8f * c.movement * rng.bipolar();
    lobe = 1.0f;
  }

  // One arrival of the roll: kick the envelopes, and draw when the next comes.
  void arrive(const Controls& c) {
    const float age = kit::clamp(t / length, 0.0f, 1.0f);
    const float gap = 0.02f + 0.10f * age;
    // Now and then another length of the channel reports: a clap, weaker the later it comes.
    if (rng.uniform() < gap / 1.6f) lobe = kit::max(lobe, between(rng, 0.5f, 1.5f) * (1.0f - 0.5f * age));
    const float draw = rng.uniform();
    // Near, the first arrival is the loudest; far, the roll swells in.
    const float onset = kit::lerp(1.0f, kit::min(1.0f, t / 0.7f), c.distance);
    const float amount = size * lobe * (0.3f + 0.7f * draw * draw) * onset;
    const float clear = (1.0f - c.distance) * std::sqrt(1.0f - c.distance);
    const float bright = clear * std::exp(-3.0f * age);
    // Overhead the edge is in the first tenth of a second; what follows is mostly body.
    const float close = nearness(c);
    const float crack = 0.6f * amount * bright * bright * (1.0f - 0.75f * close * (1.0f - std::exp(-t / 0.15f)));
    const float weight[kBands] = {crack, amount * (0.2f + 0.8f * bright), amount,
                                  amount * (1.0f - 0.3f * bright)};
    float pan_left, pan_right;
    kit::pan_gains(kit::clamp(place + 0.45f * rng.bipolar(), -1.0f, 1.0f), &pan_left, &pan_right);
    for (int k = 0; k < kBands; ++k) {
      // So that a crowd of arrivals adds up to their strength, not their number.
      const float share = weight[k] * kit::min(1.0f, 1.6f * gap / kFall[k]) * 1.4142f;
      kick[0][k] += share * pan_left;
      kick[1][k] += share * pan_right;
    }
    if (next == 0.0f) {
      // Only a near stroke cracks, and only at its very start.
      const float snap = kCrack * size * close * close * (1.0f + 0.8f * close);
      kick[0][0] += snap * pan_left;
      kick[1][0] += snap * pan_right;
    }
    next += exp_gap(rng, gap);
    if (next > length) rolling = false;
  }

  void tick(float& left, float& right) {
    if (!sounding) return;
    const float a = noise[0].white();
    const float b = 0.6f * noise[1].white();
    float x[2] = {a + b, a - b};  // the two sides share most of their rumble
    float out[2] = {0.0f, 0.0f};
    for (int ch = 0; ch < 2; ++ch) {
      int k = 0;
      for (int q = 0; q < kPoles; ++q) {
        x[ch] = pole[ch][q].lowpass(x[ch]);
        if (q != kTap[k]) continue;
        gain[ch][k] += step[ch][k];
        out[ch] += x[ch] * gain[ch][k];
        ++k;
      }
    }
    left += floor[0].process(out[0]);
    right += floor[1].process(out[1]);
  }
};

}  // namespace outdoors_scene
}  // namespace livemix
