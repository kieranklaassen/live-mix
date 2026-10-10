#pragma once

// One gliding voice of Spiral: a stereo delay-line pitch shifter whose ratio
// may move every control tick.
//
// Each channel is a delay line read by three heads a third of a pass apart
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
      for (int k = 0; k < kHeads; ++k) delay_[c][k] = 8.0f;
    }
    ratio_ = 1.0f;
    step_ = 1.0f / 4096.0f;
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
    step_ = 1.0f / pass;
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

    const float before = phase_;
    phase_ += step_;
    int starting = -1;
    if (phase_ >= 1.0f) {
      phase_ -= 1.0f;
      starting = 0;
    } else if (before < kTwoThirds && phase_ >= kTwoThirds) {
      starting = 1;
    } else if (before < kThird && phase_ >= kThird) {
      starting = 2;
    }
    float position[kHeads];
    position[0] = phase_;
    position[1] = phase_ + kThird;
    if (position[1] >= 1.0f) position[1] -= 1.0f;
    position[2] = phase_ + kTwoThirds;
    if (position[2] >= 1.0f) position[2] -= 1.0f;

    const float slide = 1.0f - ratio_;
    const float longest = static_cast<float>(Size - 8);
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kHeads; ++k) {
        delay_[c][k] = kit::clamp(delay_[c][k] + slide, pad_, longest);
      }
    }
    const bool audible = gain > kAudible;
    if (starting >= 0) {
      const float base = (ratio_ > 1.0f ? (ratio_ - 1.0f) / step_ : 0.0f) + pad_;
      for (int c = 0; c < 2; ++c) {
        delay_[c][starting] =
            kit::min(audible ? find_start(c, starting, position, base) : base, longest);
      }
    }
    if (gain == 0.0f) return;
    float sum[2] = {0.0f, 0.0f};
    for (int k = 0; k < kHeads; ++k) {
      const float bell = 0.5f - 0.5f * kit::SineTable::cos_lookup(position[k]);
      sum[0] += bell * line_[0].read_hermite(delay_[0][k]);
      sum[1] += bell * line_[1].read_hermite(delay_[1][k]);
    }
    const float scale = gain * (2.0f / 3.0f);
    *left += sum[0] * scale;
    *right += sum[1] * scale;
  }

 private:
  static constexpr float kThird = 1.0f / 3.0f;
  static constexpr float kTwoThirds = 2.0f / 3.0f;
  static constexpr float kAudible = 1.0e-4f;  // a head quieter than -80 dB starts anywhere
  static constexpr int kPoints = 48;          // samples of the comparison
  static constexpr int kCandidates = 128;     // coarse steps across the search range

  // The delay at which head `k` of channel `c`, starting a pass now, best
  // continues what the other two will play over the next `span_` samples.
  float find_start(int c, int k, const float* position, float base) {
    const kit::DelayLine<Size>& line = line_[c];
    const int now = line.write_position();
    const float stride = span_ / kPoints;
    float reference[kPoints];
    int ahead[kPoints];
    float energy = 0.0f;
    for (int i = 0; i < kPoints; ++i) {
      const float j = static_cast<float>(i) * stride;
      ahead[i] = static_cast<int>(j * ratio_ + 0.5f);
      float value = 0.0f;
      for (int h = 0; h < kHeads; ++h) {
        if (h == k) continue;
        const float later = position[h] + j * step_;
        if (later >= 1.0f) continue;
        const float bell = 0.5f - 0.5f * kit::SineTable::cos_lookup(later);
        value += bell * line.at_linear(static_cast<float>(now + ahead[i]) - delay_[c][h]);
      }
      reference[i] = value;
      energy += value * value;
    }
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
  float delay_[2][kHeads] = {};
  float ratio_ = 1.0f;
  float step_ = 1.0f / 4096.0f;
  float span_ = 512.0f;
  float pad_ = 520.0f;
  float search_ = 512.0f;
  float corner_ = 0.0f;
};

}  // namespace spiral_dsp
}  // namespace livemix
