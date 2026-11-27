#pragma once

// The chimes over the arrivals of Slow Accord: up to eight, each a tone that
// swells in six thousandths of a second and dies away in up to three seconds.

#include "../../kit/kit.h"

namespace livemix {
namespace slow_accord {

class Chimes {
 public:
  void init(float sample_rate) {
    sample_rate_ = sample_rate;
    rise_ = 1.0f - std::exp(-1.0f / (0.006f * sample_rate));
    for (Chime& chime : chimes_) chime = Chime();
  }

  bool sounding() const {
    for (const Chime& chime : chimes_) {
      if (chime.level > 0.0f) return true;
    }
    return false;
  }

  // None where every one of them is still over `floor`.
  void strike(float hz, float level, float place, float floor, float seconds) {
    Chime* chime = &chimes_[0];
    for (Chime& other : chimes_) {
      if (other.level * other.swell < chime->level * chime->swell) chime = &other;
    }
    if (chime->level > floor) return;
    const float w = kit::kTwoPi * hz / sample_rate_;
    chime->turn_re = std::cos(w);
    chime->turn_im = std::sin(w);
    chime->re = 1.0f;
    chime->im = 0.0f;
    chime->level = level;
    chime->keep = std::exp(-6.907755279f / (seconds * sample_rate_));
    chime->swell = 0.0f;
    kit::pan_gains(place, &chime->left, &chime->right);
  }

  // Once a tick: the ones that are over, and rounding put right.
  void tick() {
    for (Chime& chime : chimes_) {
      if (chime.level <= 0.0f) continue;
      if (chime.swell > 0.5f && chime.level < 1.0e-7f) chime = Chime();
      const float power = chime.re * chime.re + chime.im * chime.im;
      if (power > 0.0f) {
        const float right = 1.5f - 0.5f * power;
        chime.re *= right;
        chime.im *= right;
      }
    }
  }

  void add(int n, float* left, float* right) {
    for (Chime& chime : chimes_) {
      if (chime.level <= 0.0f) continue;
      for (int i = 0; i < n; ++i) {
        chime.swell += (1.0f - chime.swell) * rise_;
        chime.level *= chime.keep;
        const float x = chime.im * chime.level * chime.swell * chime.swell;
        left[i] += x * chime.left;
        right[i] += x * chime.right;
        const float turned = chime.turn_re * chime.re - chime.turn_im * chime.im;
        chime.im = chime.turn_re * chime.im + chime.turn_im * chime.re;
        chime.re = turned;
      }
    }
  }

 private:
  struct Chime {
    float re = 0.0f, im = 0.0f, turn_re = 0.0f, turn_im = 0.0f;
    float keep = 0.0f, level = 0.0f, swell = 0.0f, left = 0.0f, right = 0.0f;
  };
  Chime chimes_[8];
  float sample_rate_ = 48000.0f, rise_ = 0.003f;
};

}  // namespace slow_accord
}  // namespace livemix
