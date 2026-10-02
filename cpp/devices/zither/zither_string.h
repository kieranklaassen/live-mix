#pragma once

// The string and the blow that sets it going, for Zither (zither.h).
//
// StringLoop is one plucked-string loop: a delay line closed through a
// first-order allpass (the fractional part of the tuning), a one-pole
// low-pass (the string's loss, heavier for the upper partials) and a gain
// (how long the fundamental rings).
//
//   in ──(+)──────────────────────────────────────────────┬──► out
//         ▲                                               │
//         └── gain ◄── low-pass ◄── allpass ◄── delay N ◄─┘
//
// The low-pass's own delay at the fundamental is taken off the delay line
// and the allpass coefficient is solved for the exact remainder there, so
// the pitch holds at any brightness.
//
// Strike is the excitation as a function of time, so that it can be put on
// a string that is already moving. Two ingredients:
//   - the step: what an ideal pluck sends down the string, a rectangular
//     wave whose duty is the plucking position (partials as 1/n with a comb
//     from the position), with raised-cosine edges as wide as the fingertip
//     and its mean taken off over one period;
//   - the pulse: a raised-cosine blow and its inverted reflection from the
//     near end (flat partials up to the reciprocal of its width, same comb),
//     the felt hammer and the click of a pick.

#include "../../kit/math.h"

namespace livemix {
namespace zither {

template <int Size>
struct StringLoop {
  static constexpr int kMask = Size - 1;
  static_assert((Size & (Size - 1)) == 0, "StringLoop size must be a power of two");

  float buffer[Size];
  int write = 0;
  int delay = 16;       // whole samples
  float eta = 0.0f;     // allpass coefficient
  float ap_x1 = 0.0f, ap_y1 = 0.0f;
  float pole = 0.0f;    // low-pass pole
  float lp = 0.0f;
  float gain = 0.0f;    // loop gain
  float lp_gain0 = 1.0f;  // the low-pass's gain at the fundamental
  float hz = 220.0f;

  // Empty the part of the line the current delay reads.
  void clear() {
    const int span = kit::clamp_int(delay + 8, 8, Size);
    for (int i = 0; i < span; ++i) buffer[(write - 1 - i) & kMask] = 0.0f;
    ap_x1 = ap_y1 = lp = 0.0f;
  }
  // Back to a new, empty string.
  void reset() {
    for (int i = 0; i < Size; ++i) buffer[i] = 0.0f;
    write = 0;
    delay = 16;
    eta = pole = gain = 0.0f;
    ap_x1 = ap_y1 = lp = 0.0f;
    lp_gain0 = 1.0f;
    hz = 220.0f;
  }

  // Tune to `frequency` with loss pole `p` (0 = no low-pass). Call before
  // clear(): it moves the delay.
  void tune(float frequency, float p, float sample_rate) {
    hz = frequency;
    pole = p;
    const float w = kit::kTwoPi * frequency / sample_rate;
    const float cw = std::cos(w), sw = std::sin(w);
    const float lp_delay = std::atan2(p * sw, 1.0f - p * cw) / w;
    lp_gain0 = (1.0f - p) / std::sqrt(kit::max(1.0e-12f, 1.0f - 2.0f * p * cw + p * p));
    const float total = sample_rate / frequency - lp_delay;
    int whole = static_cast<int>(total - 0.4f);
    whole = kit::clamp_int(whole, 1, Size - 8);
    const float tau = kit::clamp(total - static_cast<float>(whole), 0.05f, 1.95f);
    delay = whole;
    eta = std::sin(0.5f * (1.0f - tau) * w) / std::sin(0.5f * (1.0f + tau) * w);
  }

  // Loop gain for the fundamental to fall 60 dB in `seconds`.
  void set_ring(float seconds) {
    const float wanted = std::exp(-6.907755f / (hz * kit::max(seconds, 0.01f)));
    gain = kit::min(wanted / lp_gain0, 0.99999f);
  }

  // One sample; `scale` multiplies what comes round (1 normally).
  float tick(float in, float scale) {
    const float read = buffer[(write - delay) & kMask];
    const float through = eta * (read - ap_y1) + ap_x1;
    ap_x1 = read;
    ap_y1 = through;
    lp = through + (lp - through) * pole;
    const float out = lp * gain * scale + in;
    buffer[write] = out;
    write = (write + 1) & kMask;
    return out;
  }

  // `count` samples at once: out[i] is the loop with in[i] * in_gain added
  // (`in` may be null). `scale` as in tick().
  void run(const float* in, float in_gain, float scale, float* out, int count) {
    int w = write;
    float x1 = ap_x1, y1 = ap_y1, state = lp;
    const float e = eta, p = pole, g = gain * scale;
    const int d = delay;
    for (int i = 0; i < count; ++i) {
      const float read = buffer[(w - d) & kMask];
      const float through = e * (read - y1) + x1;
      x1 = read;
      y1 = through;
      state = through + (state - through) * p;
      const float y = state * g + (in ? in[i] * in_gain : 0.0f);
      buffer[w] = y;
      w = (w + 1) & kMask;
      out[i] = y;
    }
    write = w;
    ap_x1 = x1;
    ap_y1 = y1;
    lp = state;
  }

  void flush() {
    lp = flush_denormal(lp);
    ap_y1 = flush_denormal(ap_y1);
    ap_x1 = flush_denormal(ap_x1);
  }
};

// One blow, evaluated a sample at a time until it has passed.
struct Strike {
  float t = 0.0f;        // samples since the blow began
  float length = 0.0f;   // when it has passed
  float step = 0.0f;     // level of the step part
  float pulse = 0.0f;    // level of the pulse part
  float edge = 0.01f;    // 1 / edge width of the step, samples
  float blow = 0.01f;    // 1 / width of the pulse, samples
  float split = 10.0f;   // position on the string, samples (period × position)
  float period = 100.0f; // samples
  float duty = 0.2f;     // split / period
  float bounce = 0.0f;   // level of the second, softer blow (hammer)
  float bounce_at = 0.0f;
  float bounce_blow = 0.01f;
  bool active = false;

  // 0 below 0, 1 above 1, a raised cosine between.
  static float rise(float u) {
    if (u <= 0.0f) return 0.0f;
    if (u >= 1.0f) return 1.0f;
    return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * u);
  }
  // A raised-cosine bump on (0, 1), peak 1.
  static float bump(float u) {
    if (u <= 0.0f || u >= 1.0f) return 0.0f;
    return 0.5f - 0.5f * kit::SineTable::cos_lookup(u);
  }

  void finish_setup() {
    duty = split / period;
    const float step_end = step != 0.0f ? period + 1.0f / edge : 0.0f;
    const float pulse_end = pulse != 0.0f ? split + 1.0f / blow : 0.0f;
    const float bounce_end = bounce != 0.0f ? bounce_at + split + 1.0f / bounce_blow : 0.0f;
    length = kit::max(step_end, kit::max(pulse_end, bounce_end)) + 1.0f;
    t = 0.0f;
    active = true;
  }

  float next() {
    float x = 0.0f;
    if (step != 0.0f) {
      const float a = rise(t * edge);
      x += step * (a - rise((t - split) * edge) - duty * (a - rise((t - period) * edge)));
    }
    if (pulse != 0.0f) x += pulse * (bump(t * blow) - bump((t - split) * blow));
    if (bounce != 0.0f) {
      const float tb = t - bounce_at;
      if (tb > 0.0f) x += bounce * (bump(tb * bounce_blow) - bump((tb - split) * bounce_blow));
    }
    t += 1.0f;
    if (t >= length) active = false;
    return x;
  }
};

}  // namespace zither
}  // namespace livemix
