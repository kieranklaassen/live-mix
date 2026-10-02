#pragma once

#include "../../kit/math.h"

namespace livemix {
namespace half_speed {

// Where to start a new playback head so that it joins the heads already
// playing in step with them: the waveform-similarity search of WSOLA
// (Verhelst and Roelands, "An overlap-add technique based on waveform
// similarity (WSOLA) for high quality time-scale modification of speech",
// ICASSP 1993), run on a low-rate copy of the input.
//
// The input is kept a second time as mono, band-limited to about 2.5 kHz and
// decimated to about 6 kHz. A head that is `d` frames behind the write point
// has just played the stretch of that copy ending `d` frames back. `find`
// compares the stretch the old heads have just played with every stretch
// ending 0 to 26 ms before the present, and returns the offset whose
// waveform matches best: two heads started that far apart carry the same
// periodic sound in phase, so their crossfade does not cancel. The score of
// the match, checked again on the stretch before that one (a match that
// does not hold there is chance, as in noise), tells the device how much of
// a linear crossfade's level it can rely on.
class Matcher {
 public:
  static constexpr int kSize = 65536;
  static constexpr int kMask = kSize - 1;
  static constexpr int kMaxWindow = 192;

  struct Match {
    double offset = 0.0;  // input frames to add to the new head's delay
    float score = 0.0f;   // 0 unrelated .. 1 the same waveform
  };

  void init(float sample_rate) {
    factor_ = static_cast<int>(sample_rate / kAnalysisRate + 0.5f);
    factor_ = kit::clamp_int(factor_, 1, kMaxFactor);
    const float rate = sample_rate / static_cast<float>(factor_);
    window_ = kit::clamp_int(static_cast<int>(kWindowSeconds * rate), 16, kMaxWindow);
    range_ = kit::clamp_int(static_cast<int>(kRangeSeconds * rate), 1, kMaxRange);
    low_a_ = std::exp(-kit::kTwoPi * 2500.0f / sample_rate);
    high_a_ = std::exp(-kit::kTwoPi * 35.0f / rate);
    reset();
  }

  void reset() {
    for (int i = 0; i < kSize; ++i) buffer_[i] = 0.0f;
    write_ = 0;
    count_ = 0;
    sum_ = 0.0f;
    low_[0] = low_[1] = 0.0f;
    high_ = 0.0f;
  }

  // Start the low-rate copy on a clean frame (the device waking from sleep):
  // what is kept stays, the filters and the decimation count start over, so
  // a note after a silence is placed the same way whatever was played before.
  void rewind() {
    count_ = 0;
    sum_ = 0.0f;
    low_[0] = low_[1] = 0.0f;
    high_ = 0.0f;
  }

  // One input frame (mono). Two one-pole low-passes and an average over the
  // decimation factor keep what folds back well under the wanted band.
  void write(float x) {
    low_[0] = flush_denormal(x + (low_[0] - x) * low_a_);
    low_[1] = flush_denormal(low_[0] + (low_[1] - low_[0]) * low_a_);
    sum_ += low_[1];
    if (++count_ < factor_) return;
    const float value = sum_ / static_cast<float>(factor_);
    count_ = 0;
    sum_ = 0.0f;
    // No DC or rumble: it would correlate with itself at every offset.
    high_ = flush_denormal(value + (high_ - value) * high_a_);
    buffer_[write_] = value - high_;
    write_ = (write_ + 1) & kMask;
  }

  int factor() const { return factor_; }
  // The largest offset find() returns, in input frames.
  double range() const { return static_cast<double>(range_ * factor_); }
  // How far back find() looks from a head, in input frames.
  double window() const { return static_cast<double>(3 * window_ * factor_); }

  // Two steps: `coarse` on the low-rate copy finds the offset to within one
  // low-rate sample and says whether the match holds; `fine` then tries
  // every whole input frame around it on the device's own ring, which lines
  // up what the low-rate copy cannot see (anything above 2.5 kHz).
  Match coarse(const double* delays, const float* weights, int heads, double start_delay);
  template <typename Ring>
  Match fine(const Ring& ring, const Match& rough, const double* delays, const float* weights,
             int heads, double start_delay, float sample_rate) const;

 private:
  static constexpr float kAnalysisRate = 6000.0f;
  static constexpr float kWindowSeconds = 0.021f;
  static constexpr float kRangeSeconds = 0.026f;
  static constexpr int kMaxRange = 200;
  static constexpr float kFineSeconds = 0.0107f;
  static constexpr int kMaxFine = 1056;
  static constexpr int kMaxFactor = 32;
  static constexpr float kLatenessCost = 0.03f;

  // The sample `delay` low-rate samples before the newest one.
  float at(int delay) const { return buffer_[(write_ - 1 - delay) & kMask]; }
  float at_linear(float delay) const {
    const int whole = static_cast<int>(delay);
    const float fraction = delay - static_cast<float>(whole);
    const float a = at(whole);
    return a + (at(whole + 1) - a) * fraction;
  }

  float buffer_[kSize] = {};
  int write_ = 0;
  int count_ = 0;
  int factor_ = 8;
  int window_ = 128;
  int range_ = 156;
  float sum_ = 0.0f;
  float low_[2] = {0.0f, 0.0f};
  float high_ = 0.0f;
  float low_a_ = 0.0f;
  float high_a_ = 0.0f;
};

// `delays` are the old heads' places (input frames behind the write point),
// `weights` how much each will sound against the new head; the new head
// would start `start_delay` behind the write point with no offset.
inline Matcher::Match Matcher::coarse(const double* delays, const float* weights, int heads,
                                      double start_delay) {
  Match result;
  const int window = window_;
  // What the old heads have just played, newest first, three windows long.
  float reference[3 * kMaxWindow];
  for (int j = 0; j < 3 * window; ++j) reference[j] = 0.0f;
  float nearest = 1.0e9f;
  bool any = false;
  for (int h = 0; h < heads; ++h) {
    if (!(weights[h] > 0.0f)) continue;
    float behind = static_cast<float>((delays[h] - start_delay) / factor_);
    if (behind < 0.0f) behind = 0.0f;
    if (behind > static_cast<float>(kSize - 3 * kMaxWindow - 8)) continue;
    for (int j = 0; j < 3 * window; ++j) {
      reference[j] += weights[h] * at_linear(behind + static_cast<float>(j));
    }
    if (behind < nearest) nearest = behind;
    any = true;
  }
  if (!any) return result;
  float reference_energy = 0.0f;
  for (int j = 0; j < window; ++j) reference_energy += reference[j] * reference[j];
  if (reference_energy < 1.0e-12f) return result;

  // The new head has to stay well ahead of the old ones: a start right on
  // an old head would match perfectly and jump nowhere.
  const int last = kit::clamp_int(static_cast<int>(nearest * 0.5f), 0, range_);
  float scores[kMaxRange + 1];
  float energy = 0.0f;
  for (int j = 0; j < window; ++j) energy += at(j) * at(j);
  int best = 0;
  float best_biased = -2.0f;
  for (int lag = 0; lag <= last; ++lag) {
    float dot = 0.0f;
    for (int j = 0; j < window; ++j) dot += reference[j] * at(lag + j);
    const float score = dot / std::sqrt(reference_energy * energy + 1.0e-20f);
    scores[lag] = score;
    // Among equal peaks a period apart, take the one nearest the present.
    const float biased = score - kLatenessCost * static_cast<float>(lag) / static_cast<float>(range_);
    if (biased > best_biased) {
      best_biased = biased;
      best = lag;
    }
    energy += at(lag + window) * at(lag + window) - at(lag) * at(lag);
    if (energy < 0.0f) energy = 0.0f;
  }

  // Does the match hold on the stretch before the one it was found on?
  float dot = 0.0f, older_reference = 0.0f, older = 0.0f;
  for (int j = window; j < 3 * window; ++j) {
    const float value = at(best + j);
    dot += reference[j] * value;
    older_reference += reference[j] * reference[j];
    older += value * value;
  }
  const float held = dot / std::sqrt(older_reference * older + 1.0e-20f);
  result.score = kit::clamp(kit::min(scores[best], held), 0.0f, 1.0f);
  result.offset = static_cast<double>(best * factor_);
  return result;
}

template <typename Ring>
Matcher::Match Matcher::fine(const Ring& ring, const Match& rough, const double* delays,
                             const float* weights, int heads, double start_delay,
                             float sample_rate) const {
  Match result = rough;
  const int window = kit::clamp_int(static_cast<int>(kFineSeconds * sample_rate), 32, kMaxFine);
  float reference[kMaxFine];
  for (int j = 0; j < window; ++j) reference[j] = 0.0f;
  double nearest = 1.0e12;
  for (int h = 0; h < heads; ++h) {
    if (!(weights[h] > 0.0f)) continue;
    if (delays[h] + window + 8 > Ring::max_delay()) continue;
    for (int j = 0; j < window; ++j) {
      float left, right;
      ring.read(delays[h] + j, &left, &right);
      reference[j] += weights[h] * 0.5f * (left + right);
    }
    if (delays[h] < nearest) nearest = delays[h];
  }
  float reference_energy = 0.0f;
  for (int j = 0; j < window; ++j) reference_energy += reference[j] * reference[j];
  if (reference_energy < 1.0e-12f) return result;

  const int start = static_cast<int>(start_delay);
  const int centre = static_cast<int>(rough.offset + 0.5);
  const int furthest = static_cast<int>((nearest - start_delay) * 0.5);
  const int first = kit::clamp_int(centre - factor_, 0, furthest > 0 ? furthest : 0);
  const int last = kit::clamp_int(centre + factor_, first, furthest > first ? furthest : first);
  float scores[2 * kMaxFactor + 1];
  float energy = 0.0f;
  for (int j = 0; j < window; ++j) {
    const float value = ring.mono(start + first + j);
    energy += value * value;
  }
  int best = first;
  float best_score = -2.0f;
  for (int lag = first; lag <= last; ++lag) {
    float dot = 0.0f;
    for (int j = 0; j < window; ++j) dot += reference[j] * ring.mono(start + lag + j);
    const float score = dot / std::sqrt(reference_energy * energy + 1.0e-20f);
    scores[lag - first] = score;
    if (score > best_score) {
      best_score = score;
      best = lag;
    }
    const float leaving = ring.mono(start + lag);
    const float entering = ring.mono(start + lag + window);
    energy += entering * entering - leaving * leaving;
    if (energy < 0.0f) energy = 0.0f;
  }
  // The peak lies between frames: a parabola through its neighbours.
  float fraction = 0.0f;
  if (best > first && best < last) {
    const float before = scores[best - first - 1];
    const float after = scores[best - first + 1];
    const float curve = before - 2.0f * best_score + after;
    if (curve < -1.0e-9f) fraction = kit::clamp(0.5f * (before - after) / curve, -0.5f, 0.5f);
  }
  result.offset = static_cast<double>(best) + fraction;
  if (result.offset < 0.0) result.offset = 0.0;
  result.score = kit::clamp(kit::min(best_score, rough.score), 0.0f, 1.0f);
  return result;
}

}  // namespace half_speed
}  // namespace livemix
