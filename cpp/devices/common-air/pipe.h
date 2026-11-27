#pragma once

// The short pipe a reed of Common Air stands in: a delay line as long as the
// note asks for, with a loss at its end.

#include "../../kit/kit.h"

namespace livemix {
namespace common_air {

struct PipeShape {
  float periods;   // how long the pipe is, in periods of the note (0: `fixed` seconds long)
  float fixed;
  float turn;      // the sign the wave comes back with
  float hold;      // most that comes back
  float corner;    // where the loss at the end sets in, in multiples of the note
  float floor_hz;  // and at the least
  float tap;       // a hole along the pipe: how much is heard there
  float place;     // where, as a part of the pipe
  float edge;      // how much of the body is taken off (a bell), 0 to 1
  float edge_at;   // up to where, in multiples of the note
  float steep;     // a second loss at the mouth, in multiples of the note (0: none)
  float air;       // breath noise it is blown with against the others
  float width;     // how far apart the keys stand
  float level;
};

inline const PipeShape* pipe_shapes() {
  static constexpr PipeShape kShapes[4] = {
      // the chest the reeds are screwed to: short, of one length, wooden
      {0.0f, 0.00236f, -1.0f, 0.78f, 6.0f, 2600.0f, 0.95f, 0.37f, 0.0f, 1.0f, 0.0f, 0.5f, 0.35f, 0.9f},
      // stopped: odd harmonics, round and breathy
      {0.5f, 0.0f, -1.0f, 0.93f, 3.0f, 700.0f, 0.0f, 0.5f, 0.0f, 1.0f, 1.0f, 1.8f, 0.7f, 0.5f},
      // open: full, the even harmonics forward
      {1.0f, 0.0f, 1.0f, 0.90f, 6.0f, 1200.0f, 0.52f, 0.5f, 0.0f, 1.0f, 8.0f, 1.0f, 1.4f, 0.4f},
      // cone: nasal, strong
      {1.0f, 0.0f, 1.0f, 0.66f, 9.0f, 3500.0f, -0.9f, 0.17f, 0.97f, 3.6f, 0.0f, 0.45f, 0.8f, 1.0f},
  };
  return kShapes;
}

class Pipe {
 public:
  static constexpr int kSize = 8192;

  void clear() {
    for (int i = 0; i < kSize; ++i) line_[i] = 0.0f;
    write_ = 0;
    low_ = 0.0f;
    last_ = 0.0f;
    mouth_ = 0.0f;
    lip_ = 0.0f;
  }

  // Fit the pipe to a note. Only while it is silent or faded out.
  void fit(const PipeShape& shape, float hz, float sample_rate) {
    shape_ = &shape;
    float length = shape.periods > 0.0f ? shape.periods * sample_rate / hz : shape.fixed * sample_rate;
    while (length > static_cast<float>(kSize - 8)) length *= 0.5f;
    const float corner = kit::clamp(kit::max(shape.corner * hz, shape.floor_hz), 40.0f, 0.35f * sample_rate);
    a_ = std::exp(-kit::kTwoPi * corner / sample_rate);
    const float w = kit::kTwoPi * hz / sample_rate;
    // What the loss is late by at the note, taken off the pipe.
    const float late = std::atan2(a_ * std::sin(w), 1.0f - a_ * std::cos(w)) / w;
    const float delay = kit::max(3.0f, length - late);
    delay_ = delay;
    whole_ = static_cast<int>(delay);
    const float t = delay - static_cast<float>(whole_);
    // Four-point weights of the place between two samples.
    h_[0] = t * (-0.5f + t * (1.0f - 0.5f * t));
    h_[1] = 1.0f + t * t * (-2.5f + 1.5f * t);
    h_[2] = t * (0.5f + t * (2.0f - 1.5f * t));
    h_[3] = t * t * (-0.5f + 0.5f * t);
    tap_ = kit::clamp_int(static_cast<int>(shape.place * delay), 1, kSize - 8);
    edge_ = 1.0f - std::exp(-kit::kTwoPi * kit::min(shape.edge_at * hz, 0.3f * sample_rate) / sample_rate);
    steep_ = shape.steep > 0.0f
                 ? 1.0f - std::exp(-kit::kTwoPi * kit::clamp(shape.steep * hz, 330.0f, 0.3f * sample_rate) / sample_rate)
                 : 1.0f;
  }

  // What comes out for one sample in, `hold` of the most coming back.
  float process(float x, float hold) {
    const float back = h_[0] * at(whole_ - 1) + h_[1] * at(whole_) + h_[2] * at(whole_ + 1) + h_[3] * at(whole_ + 2);
    low_ = flush_denormal(back + (low_ - back) * a_);
    const float y = x + shape_->turn * hold * low_;
    line_[write_] = y;
    write_ = (write_ + 1) & (kSize - 1);
    float out = y;
    if (shape_->tap != 0.0f) out += shape_->tap * at(tap_ + 1);
    if (shape_->edge != 0.0f) {
      const float past = last_;
      last_ = flush_denormal(last_ + edge_ * (out - last_));
      out -= shape_->edge * past;
    }
    if (shape_->steep > 0.0f) {
      mouth_ = flush_denormal(mouth_ + steep_ * (out - mouth_));
      lip_ = flush_denormal(lip_ + steep_ * (mouth_ - lip_));
      out = lip_;
    }
    return out * shape_->level;
  }

  // What the pipe does to a tone of `hz`: the real and the imaginary part.
  void response(float hz, float hold, float sample_rate, float* re, float* im) const {
    const float w = hz / sample_rate;  // turns a sample
    const auto cosine = [w](float samples) { return kit::SineTable::cos_lookup(w * samples); };
    const auto sine = [w](float samples) { return kit::SineTable::lookup(w * samples); };
    // low(z) = (1 - a) / (1 - a z^-1), then the line.
    float lr = 1.0f - a_ * cosine(1.0f), li = a_ * sine(1.0f);
    const float scale = shape_->turn * hold * (1.0f - a_) / (lr * lr + li * li);
    const float cr = scale * lr, ci = -scale * li;
    const float dc = cosine(delay_), ds = sine(delay_);
    const float gr = 1.0f - (cr * dc + ci * ds), gi = -(ci * dc - cr * ds);
    const float inverse = 1.0f / (gr * gr + gi * gi);
    float xr = gr * inverse, xi = -gi * inverse;
    const float tap = static_cast<float>(tap_);
    multiply(&xr, &xi, 1.0f + shape_->tap * cosine(tap), -shape_->tap * sine(tap));
    if (shape_->edge != 0.0f) {
      float er, ei;
      onepole(edge_, cosine(1.0f), sine(1.0f), &er, &ei);
      // The step before is what is taken off.
      const float pr = er * cosine(1.0f) + ei * sine(1.0f), pi = ei * cosine(1.0f) - er * sine(1.0f);
      multiply(&xr, &xi, 1.0f - shape_->edge * pr, -shape_->edge * pi);
    }
    if (shape_->steep > 0.0f) {
      float er, ei;
      onepole(steep_, cosine(1.0f), sine(1.0f), &er, &ei);
      multiply(&xr, &xi, er, ei);
      multiply(&xr, &xi, er, ei);
    }
    *re = xr * shape_->level;
    *im = xi * shape_->level;
  }

  const PipeShape& shape() const { return *shape_; }

 private:
  static void multiply(float* re, float* im, float by_re, float by_im) {
    const float r = *re * by_re - *im * by_im;
    *im = *re * by_im + *im * by_re;
    *re = r;
  }
  static void onepole(float coeff, float c, float s, float* re, float* im) {
    const float dr = 1.0f - (1.0f - coeff) * c, di = (1.0f - coeff) * s;
    const float n = coeff / (dr * dr + di * di);
    *re = dr * n;
    *im = -di * n;
  }

  float at(int delay) const { return line_[(write_ - delay) & (kSize - 1)]; }

  float line_[kSize] = {};
  int write_ = 0;
  const PipeShape* shape_ = pipe_shapes();
  float a_ = 0.0f, low_ = 0.0f, last_ = 0.0f;
  float edge_ = 0.1f, steep_ = 1.0f, mouth_ = 0.0f, lip_ = 0.0f;
  float delay_ = 100.0f;
  int whole_ = 100, tap_ = 1;
  float h_[4] = {0.0f, 1.0f, 0.0f, 0.0f};
};

}  // namespace common_air
}  // namespace livemix
