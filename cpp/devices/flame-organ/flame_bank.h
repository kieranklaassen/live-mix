#pragma once

// The modes of one tube, four at a time, and the curve a flame answers with.

#include <cmath>

#include "../../kit/math.h"
#include "flame_tables.h"

namespace livemix {
namespace flame_organ {

// Four floats side by side; a plain compiler does them one by one.
typedef float Four __attribute__((vector_size(16)));

constexpr int kGroups = kModes / 4;

inline float across(Four x) { return (x[0] + x[1]) + (x[2] + x[3]); }

// A heat that rises with the air and is full or out at the ends.
inline float heat(float x) { return x / std::sqrt(1.0f + x * x); }

// The same over the time of one sample, as the mean of the curve between two
// points of it: what folds back of a hard pulse is far lower, for the same
// work. It comes half a sample late.
struct Flame {
  float x = 0.0f, h = 1.0f;
  float burn(float next) {
    const float up = std::sqrt(1.0f + next * next);
    const float q = (next + x) / (up + h);
    x = next;
    h = up;
    return q;
  }
};

// Each mode is a spinning complex number. It loses a little a sample, takes
// the flame's heat in by `feed`, and the flame reads the air by `see`.
// Twice the loss in `feed` makes a mode as loud as the harmonic that drives it.
struct Bank {
  Four re[kGroups], im[kGroups];
  Four turn_re[kGroups], turn_im[kGroups];
  Four feed[kGroups];
  Four see_re[kGroups], see_im[kGroups];
  Four to_re[kGroups], to_im[kGroups];    // what the flame is to see
  Four way_re[kGroups], way_im[kGroups];  // and a step of the way there
  Four left[kGroups], right[kGroups];
  int groups = 0;

  void clear() {
    for (int g = 0; g < kGroups; ++g) {
      re[g] = im[g] = turn_re[g] = turn_im[g] = feed[g] = Four{};
      see_re[g] = see_im[g] = left[g] = right[g] = Four{};
      to_re[g] = to_im[g] = way_re[g] = way_im[g] = Four{};
    }
  }

  // The flame's eye is moved and never jumps: another mode that takes the note is
  // no edge in the pulses.
  void aim(bool now) {
    for (int g = 0; g < groups; ++g) {
      if (now) see_re[g] = to_re[g], see_im[g] = to_im[g];
      way_re[g] = (to_re[g] - see_re[g]) * 0.04f;
      way_im[g] = (to_im[g] - see_im[g]) * 0.04f;
    }
  }
  void move() {
    for (int g = 0; g < groups; ++g) {
      see_re[g] += way_re[g];
      see_im[g] += way_im[g];
    }
  }

  void hush() {
    for (int g = 0; g < kGroups; ++g) re[g] = im[g] = Four{};
  }

  // The air at the flame: of the first eight modes, and apart from it of the
  // last four, which in a double tube are another pipe with its own flame.
  float air(float* last) const {
    Four sum = {}, rest = {};
    for (int g = 0; g < groups && g < 2; ++g) sum += re[g] * see_re[g] + im[g] * see_im[g];
    if (groups > 2) rest = re[2] * see_re[2] + im[2] * see_im[2];
    *last = across(rest);
    return across(sum);
  }

  // One sample: what comes out, then the heat goes in.
  void step(float q, float q_last, float* out_left, float* out_right) {
    Four l = {}, r = {};
    for (int g = 0; g < groups; ++g) {
      const Four a = re[g], b = im[g];
      l += a * left[g];
      r += a * right[g];
      re[g] = turn_re[g] * a - turn_im[g] * b + feed[g] * (g < 2 ? q : q_last);
      im[g] = turn_im[g] * a + turn_re[g] * b;
    }
    *out_left = across(l);
    *out_right = across(r);
  }

  // Anything too small to be heard is put out, so nothing shrinks for ever.
  void settle() {
    for (int g = 0; g < kGroups; ++g) {
      for (int j = 0; j < 4; ++j) {
        if (std::fabs(re[g][j]) + std::fabs(im[g][j]) < 1.0e-14f) re[g][j] = im[g][j] = 0.0f;
      }
    }
  }
};

// A straight line from one control tick to the next.
struct Line {
  float value = 0.0f, target = 0.0f, step = 0.0f;
  void snap(float v) {
    value = target = v;
    step = 0.0f;
  }
  void aim(float v, int samples) {
    value = target;
    target = v;
    step = (v - value) / static_cast<float>(samples);
  }
  float next() {
    const float now = value;
    value += step;
    return now;
  }
};

}  // namespace flame_organ
}  // namespace livemix
