#pragma once

// One gliding voice of Spiral: a stereo delay-line pitch shifter whose ratio
// may move every control tick.
//
// Each channel is a delay line, and both are read by the same three heads (one
// delay per head, the same on both sides: half the reading and half the
// searching of a head per side, and what stands between the two sides is the
// tank's, untouched) a third of a pass apart
// under Hann bells (three bells that far apart sum to 1.5 in amplitude and to
// 1.125 in power, both constant, hence the 2/3). A head with delay d reads
// the line at (now - d) and its delay changes by (1 - ratio) a sample, so it
// plays the line at `ratio` times its speed: towards the write point to
// shift up, away from it to shift down. One pass lasts `grain` samples at
// ratios up to 2 and less above, so that no pass travels more than `grain`
// samples of delay.
//
// Where a head starts each pass decides how it sounds. On a fixed grid a
// steady tone comes out as a ladder of fixed lines three pass rates apart
// that crossfade as the ratio moves, not as one gliding tone. So each new
// pass looks for its start (the idea of the splice search in
// cpp/devices/shimmer/shimmer.h, written again here for three heads and a
// moving ratio): over one search range it takes the offset whose next
// `span` samples agree best with what the other two heads are about to
// play. Anything periodic then comes out as one tone at ratio x f, gliding
// as the ratio does. Every head keeps at least ratio x span of delay in
// hand, so what the others "are about to play" is already in the line.
//
// A low-pass before the line keeps what a head reading faster than real time
// would fold back.

#include "../../kit/kit.h"

namespace livemix {
namespace spiral_dsp {

template <int Size>
class GlideVoice {
 public:
  static constexpr int kHeads = 3;

  void clear(uint32_t seed, float phase) {
    rng_.seed(seed);
    phase_ = phase - std::floor(phase);
    for (int c = 0; c < 2; ++c) {
      line_[c].clear();
      guard_[c].reset();
    }
    for (int k = 0; k < kHeads; ++k) delay_[k] = 8.0f;
    ratio_ = 1.0f;
    step_ = 1.0f / 4096.0f;
    turn_cos_ = static_cast<float>(std::cos(6.283185307179586 * step_));
    turn_sin_ = static_cast<float>(std::sin(6.283185307179586 * step_));
    cos_ = kit::SineTable::cos_lookup(phase_);
    sin_ = kit::SineTable::lookup(phase_);
    span_ = 512.0f;
    pad_ = 520.0f;
    search_ = 512.0f;
    corner_ = 0.0f;
  }

  // `grain`: one pass at ratios up to 2, `search`: the range of start
  // offsets, both in samples. Called on the control clock.
  void set(float ratio, float grain, float search, float sample_rate) {
    ratio_ = ratio;
    const float away = ratio > 1.0f ? ratio - 1.0f : 1.0f - ratio;
    const float pass = away > 1.0f ? grain / away : grain;
    const float step = 1.0f / pass;
    if (step != step_) {
      step_ = step;
      turn_cos_ = static_cast<float>(std::cos(6.283185307179586 * step));
      turn_sin_ = static_cast<float>(std::sin(6.283185307179586 * step));
    }
    span_ = pass * (1.0f / 6.0f);
    pad_ = ratio * span_ + 4.0f;
    search_ = search;
    // What a head reading at `ratio` could fold back stays out of the line.
    const float corner = kit::min(0.45f * sample_rate, 0.3f * sample_rate / ratio);
    if (corner != corner_) {
      corner_ = corner;
      guard_[0].set(corner, kit::kSqrtHalf, sample_rate);
      guard_[1].g = guard_[0].g;
      guard_[1].k = guard_[0].k;
      guard_[1].a1 = guard_[0].a1;
      guard_[1].a2 = guard_[0].a2;
      guard_[1].a3 = guard_[0].a3;
    }
  }

  float ratio() const { return ratio_; }

  // One sample in, one sample of the voice added to *left / *right at
  // `gain`. A voice at gain 0 keeps its line and its heads moving and reads
  // nothing.
  void process(float in_left, float in_right, float gain, float* left, float* right) {
    line_[0].write(guard_[0].lowpass(in_left));
    line_[1].write(guard_[1].lowpass(in_right));

    // The pass, and the bells' cosine and sine turned on with it (the three
    // bells are a third of a turn apart, so one turning pair gives all
    // three); set afresh from the table at every start of a head.
    const float before = phase_;
    phase_ += step_;
    const float turned = cos_ * turn_cos_ - sin_ * turn_sin_;
    sin_ = sin_ * turn_cos_ + cos_ * turn_sin_;
    cos_ = turned;
    int starting = -1;
    if (phase_ >= 1.0f) {
      phase_ -= 1.0f;
      starting = 0;
    } else if (before < kTwoThirds && phase_ >= kTwoThirds) {
      starting = 1;
    } else if (before < kThird && phase_ >= kThird) {
      starting = 2;
    }

    const float slide = 1.0f - ratio_;
    const float longest = static_cast<float>(Size - 8);
    for (int k = 0; k < kHeads; ++k) delay_[k] = kit::clamp(delay_[k] + slide, pad_, longest);
    if (starting >= 0) {
      cos_ = kit::SineTable::cos_lookup(phase_);
      sin_ = kit::SineTable::lookup(phase_);
      const float base = (ratio_ > 1.0f ? (ratio_ - 1.0f) / step_ : 0.0f) + pad_;
      delay_[starting] = kit::min(gain > kAudible ? find_start(starting, base) : base, longest);
    }
    if (gain == 0.0f) return;

    // cos(a + 120°) and cos(a + 240°) from cos a and sin a.
    const float bell[kHeads] = {0.5f - 0.5f * cos_, 0.5f + 0.25f * cos_ + kQuarterRootThree * sin_,
                                0.5f + 0.25f * cos_ - kQuarterRootThree * sin_};
    const int now = line_[0].write_position();
    float sum[2] = {0.0f, 0.0f};
    for (int k = 0; k < kHeads; ++k) {
      // kit::hermite as four weights, worked out once for both sides.
      const int whole = static_cast<int>(delay_[k]);
      const float t = delay_[k] - static_cast<float>(whole);
      const float w0 = bell[k] * (((-0.5f * t + 1.0f) * t - 0.5f) * t);
      const float w1 = bell[k] * ((1.5f * t - 2.5f) * t * t + 1.0f);
      const float w2 = bell[k] * (((-1.5f * t + 2.0f) * t + 0.5f) * t);
      const float w3 = bell[k] * ((0.5f * t - 0.5f) * t * t);
      const int at = now - whole;
      sum[0] += w0 * line_[0].at(at + 1) + w1 * line_[0].at(at) + w2 * line_[0].at(at - 1) +
                w3 * line_[0].at(at - 2);
      sum[1] += w0 * line_[1].at(at + 1) + w1 * line_[1].at(at) + w2 * line_[1].at(at - 1) +
                w3 * line_[1].at(at - 2);
    }
    const float scale = gain * (2.0f / 3.0f);
    *left += sum[0] * scale;
    *right += sum[1] * scale;
  }

 private:
  static constexpr float kThird = 1.0f / 3.0f;
  static constexpr float kTwoThirds = 2.0f / 3.0f;
  static constexpr float kQuarterRootThree = 0.43301270189f;
  static constexpr float kAudible = 1.0e-4f;  // a head quieter than -80 dB starts anywhere
  static constexpr int kPoints = 48;          // samples of the comparison
  static constexpr int kCandidates = 128;     // coarse steps across the search range

  // The delay at which head `k`, starting a pass now, best continues what
  // the other two will play over the next `span_` samples. One delay serves
  // both sides, so it is looked for on the side where the other two are the
  // louder: what is periodic has the same period on both.
  float find_start(int k, float base) {
    const int now = line_[0].write_position();
    const float stride = span_ / kPoints;
    float heard[2][kPoints];
    int ahead[kPoints];
    float loud[2] = {0.0f, 0.0f};
    for (int i = 0; i < kPoints; ++i) {
      const float j = static_cast<float>(i) * stride;
      ahead[i] = static_cast<int>(j * ratio_ + 0.5f);
      float value[2] = {0.0f, 0.0f};
      for (int h = 0; h < kHeads; ++h) {
        if (h == k) continue;
        float later = phase_ + static_cast<float>(h) * kThird;
        if (later >= 1.0f) later -= 1.0f;
        later += j * step_;
        if (later >= 1.0f) continue;
        const float bell = 0.5f - 0.5f * kit::SineTable::cos_lookup(later);
        const float where = static_cast<float>(now + ahead[i]) - delay_[h];
        value[0] += bell * line_[0].at_linear(where);
        value[1] += bell * line_[1].at_linear(where);
      }
      heard[0][i] = value[0];
      heard[1][i] = value[1];
      loud[0] += value[0] * value[0];
      loud[1] += value[1] * value[1];
    }
    const int side = loud[1] > loud[0] ? 1 : 0;
    const kit::DelayLine<Size>& line = line_[side];
    const float* reference = heard[side];
    const float energy = loud[side];
    const int range = static_cast<int>(search_);
    if (energy < 1.0e-16f) return base + search_ * rng_.uniform();  // nothing playing: anywhere

    // Candidates start on whole samples of the line; `residue` is what that
    // rounding moved the head by, given back at the end.
    const int whole = static_cast<int>(base + 0.5f);
    const float residue = static_cast<float>(whole) - base;
    const int origin = now - whole;
    const auto score = [&](int offset) {
      float match = 0.0f;
      float power = 1.0e-20f;
      const int start = origin - offset;
      for (int i = 0; i < kPoints; ++i) {
        const float sample = line.at(start + ahead[i]);
        match += reference[i] * sample;
        power += sample * sample;
      }
      return match / std::sqrt(power);
    };
    const int coarse = range / kCandidates > 1 ? range / kCandidates : 1;
    int best = 0;
    float best_score = -1.0e30f;
    for (int offset = 0; offset <= range; offset += coarse) {
      const float value = score(offset);
      if (value > best_score) {
        best_score = value;
        best = offset;
      }
    }
    const int centre = best;
    for (int offset = centre - coarse + 1; offset < centre + coarse; ++offset) {
      if (offset < 0 || offset > range || offset == centre) continue;
      const float value = score(offset);
      if (value > best_score) {
        best_score = value;
        best = offset;
      }
    }
    // The top of the parabola through the best offset and its neighbours.
    float fraction = 0.0f;
    if (best > 0 && best < range) {
      const float below = score(best - 1);
      const float above = score(best + 1);
      const float curve = below - 2.0f * best_score + above;
      if (curve < -1.0e-12f) fraction = kit::clamp(0.5f * (below - above) / curve, -0.5f, 0.5f);
    }
    return base + static_cast<float>(best) + fraction + residue;
  }

  kit::DelayLine<Size> line_[2];
  kit::Svf guard_[2];
  kit::Rng rng_;
  float phase_ = 0.0f;
  float cos_ = 1.0f;  // of the pass's phase, turned by the sample
  float sin_ = 0.0f;
  float turn_cos_ = 1.0f;
  float turn_sin_ = 0.0f;
  float delay_[kHeads] = {};
  float ratio_ = 1.0f;
  float step_ = 1.0f / 4096.0f;
  float span_ = 512.0f;
  float pad_ = 520.0f;
  float search_ = 512.0f;
  float corner_ = 0.0f;
};

}  // namespace spiral_dsp
}  // namespace livemix
