#pragma once

// The slope of Singing Sand: how its surges come, the same for every key, and
// what each key feels of them. All of it runs on the control clock.

#include "../../kit/kit.h"

namespace livemix {
namespace sand {

enum Surge : int { kWaves = 0, kSlips, kAftershocks };

// What one key feels: `flow` is 0 between surges and 1 at the top of one, for
// the left and the right side of the slope.
struct KeyFlow {
  kit::Rng rng;
  float flow[2] = {1.0f, 1.0f};
  float shown[2] = {1.0f, 1.0f};  // with the last change of Surge faded out
  float held[2] = {0.0f, 0.0f};   // what is left of it
  float kick[2] = {1.0f, 1.0f};  // a slip's push on each side, falling away
  float struck = 0.0f;  // how hard it slipped at this tick
  float slide[2] = {1.0f, 1.0f};  // and what moves after it
  float push = 1.0f;    // how hard the coming slip is
  float due = -1.0f;    // seconds until this key's share of the avalanche, under 0 for none
  float gap = 0.0f;     // the gap before the next aftershock, in shocks
  float until = 0.0f;   // seconds to it
  float strength = 1.0f;
  float place = 0.0f;   // octaves above A3
  float calm = 1.0f;    // 1 as the key goes down: surges come in after its first moment
  bool fresh = true;

  void begin(uint32_t seed, float hz) {
    rng.seed(seed);
    for (int side = 0; side < 2; ++side) {
      flow[side] = shown[side] = slide[side] = 1.0f;
      held[side] = 0.0f;
    }

    kick[0] = kick[1] = push = strength = 1.0f;
    struck = 0.0f;
    due = -1.0f;
    gap = kFirstGap;
    until = -1.0f;
    place = std::log2(hz * (1.0f / 220.0f));
    calm = 1.0f;
    fresh = true;
  }

  static constexpr float kFirstGap = 0.22f;
};

class Slope {
 public:
  void init(float control_rate) {
    tick_ = 1.0f / control_rate;
    sway_.set_rate(0.17f, control_rate);
    restart(0);
  }

  // A new weather, when a key goes down into silence.
  void restart(uint32_t count) {
    sway_.seed(count * 31u + 9u);
    rng_.seed(count * 7919u + 0x51AB3u);
    phase_ = 0.0f;
    avalanche_ = false;
    mode_ = -1;
    strength_ = 1.0f;
  }

  // One control tick of what all keys share.
  void advance(int surge, float pace, float front) {
    surge_ = surge;
    changed_ = mode_ >= 0 && mode_ != surge;
    mode_ = surge;
    pace_ = pace;
    front_ = front;
    const float unrest = 1.0f + 0.16f * sway_.next(1);
    phase_ += pace * tick_ * unrest;
    avalanche_ = phase_ >= 1.0f;
    if (avalanche_) {
      phase_ -= std::floor(phase_);
      strength_ = 0.72f + 0.28f * rng_.uniform();
    }
    fall_ = std::exp(-tick_ / kit::clamp(0.28f / pace, 0.04f, 3.0f));
    quick_fall_ = std::exp(-tick_ / kit::clamp(0.2f / pace, 0.04f, 1.2f));
    rise_ = 1.0f - std::exp(-tick_ / kit::clamp(0.02f / pace, 0.003f, 0.05f));
    calm_keep_ = std::exp(-tick_ / kit::clamp(0.4f / pace, 0.08f, 1.0f));
    fade_ = std::exp(-tick_ / 0.07f);
  }

  // What key `key` feels now. `rank` of `count` keys sounding, from the lowest.
  void feel(KeyFlow& key, int rank, int count) {
    key.struck = 0.0f;
    key.calm = key.calm > 1.0e-4f ? key.calm * calm_keep_ : 0.0f;
    float wanted[2] = {1.0f, 1.0f};
    switch (surge_) {
      case kWaves: {
        for (int side = 0; side < 2; ++side) {
          const float across = side == 0 ? -0.5f : 0.5f;
          float p = phase_ - front_ * (0.42f * key.place + 0.24f * across);
          p -= std::floor(p);
          // Quick up, slow down.
          const float q = p < 0.64f ? p * (0.5f / 0.64f) : 0.5f + (p - 0.64f) * (0.5f / 0.36f);
          const float crest = 0.5f + 0.5f * kit::SineTable::cos_lookup(q);
          wanted[side] = crest * (0.75f + 0.25f * crest);
        }
        break;
      }
      case kSlips: {
        if (avalanche_) {
          if (key.due >= 0.0f) slip(key);
          key.due = count > 1 ? front_ * 0.88f * static_cast<float>(rank) / (pace_ * static_cast<float>(count)) : 0.0f;
          key.push = strength_ * (1.0f - 0.4f * front_ * key.rng.uniform());
        }
        if (key.due >= 0.0f) {
          key.due -= tick_;
          if (key.due < 0.0f) slip(key);
        }
        slide(key, fall_, wanted);
        break;
      }
      case kAftershocks:
      default: {
        if (key.until < 0.0f) key.until = next_gap(key);
        key.until -= tick_;
        if (key.until < 0.0f) {
          key.gap *= 1.33f;
          key.strength *= 0.93f;
          if (key.gap > 1.9f) {
            key.gap = KeyFlow::kFirstGap;
            key.strength = 1.0f;
          }
          key.push = key.strength * (key.gap == KeyFlow::kFirstGap ? 1.0f : 0.45f + 0.5f * key.rng.uniform());
          slip(key);
          key.until = next_gap(key);
        }
        slide(key, quick_fall_, wanted);
        break;
      }
    }
    for (int side = 0; side < 2; ++side) {
      // A key is heard at once, whatever the slope is doing.
      const float value = wanted[side] + (1.0f - wanted[side]) * key.calm;
      key.flow[side] = value;
      if (changed_ && !key.fresh) key.held[side] = key.shown[side] - value;
      key.held[side] = settle_to_zero(key.held[side] * fade_);
      key.shown[side] = kit::clamp(value + key.held[side], 0.0f, 1.0f);
    }
    key.fresh = false;
  }

 private:
  // A slip starts on one side, and reaches the other as far as Front lets it.
  void slip(KeyFlow& key) const {
    const float across = key.rng.bipolar();
    const float weak = key.push * (1.0f - 0.85f * front_ * std::sqrt(across < 0.0f ? -across : across));
    const float on[2] = {across < 0.0f ? key.push : weak, across < 0.0f ? weak : key.push};
    for (int side = 0; side < 2; ++side) {
      if (on[side] > key.kick[side]) key.kick[side] = on[side];
    }
    key.struck = key.push;
    key.due = -1.0f;
  }
  float next_gap(KeyFlow& key) {
    const float stray = front_ * 0.75f * key.rng.bipolar();
    return key.gap * (1.0f + stray) / pace_;
  }
  void slide(KeyFlow& key, float fall, float* wanted) {
    for (int side = 0; side < 2; ++side) {
      key.kick[side] = settle_to_zero(key.kick[side] * fall);
      key.slide[side] += (key.kick[side] - key.slide[side]) * rise_;
      key.slide[side] = settle_to_zero(key.slide[side]);
      wanted[side] = key.slide[side];
    }
  }

  kit::Drift sway_;
  kit::Rng rng_;
  float tick_ = 1.0f / 1500.0f;
  float phase_ = 0.0f, strength_ = 1.0f;
  float pace_ = 0.4f, front_ = 0.4f;
  float fall_ = 0.99f, quick_fall_ = 0.99f, rise_ = 0.1f, calm_keep_ = 0.99f, fade_ = 0.99f;
  int surge_ = kWaves, mode_ = -1;
  bool avalanche_ = false, changed_ = false;
};

}  // namespace sand
}  // namespace livemix
