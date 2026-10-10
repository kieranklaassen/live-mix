#pragma once

// The transposing stage of one follower of the Canon: what the follower's
// reader plays goes into a short ring of its own, and two read heads move
// along that ring at the pitch ratio under Hann windows half a window apart.
// A head's delay shrinks while it sounds (shifting up) or grows (shifting
// down); every half window a new head takes over from the older one, placed
// where the ring best matches what the other head is playing (normalised
// cross-correlation over one search range), so a single note comes out as a
// steady tone at the new pitch and not as a flutter. Where the two heads
// still disagree (a chord, noise) the pair is lifted back to constant power.
//
// This is the "Smooth" splice of cpp/devices/pitch-shifter/ShiftVoice.h on a
// ring of its own, with one fixed window of 50 ms: long enough that a low
// note keeps two periods under each head, short enough that an attack an
// octave up is heard within 25 ms of its place. The kit's DelayPitchShifter
// (two heads crossfaded blindly) costs less and flutters at
// |1 - ratio| / window, twenty times a second for an octave.
//
// The ring is written on every sample whether or not the heads run, so heads
// that start always find the follower's last 170 ms there.
//
// Splices happen on a timetable the device hands in (restart's argument), so
// the four followers never look for a splice in the same block.

#include "../../kit/delay.h"
#include "../../kit/math.h"

namespace livemix {
namespace canon_dsp {

class Shifter {
 public:
  // 170 ms at 96 kHz, of which an octave up needs 88: the window it closes
  // over, the search range and the stretch the search compares.
  static constexpr int kSize = 16384;
  static constexpr float kWindowSeconds = 0.05f;

  // The window in samples at a sample rate, a multiple of eight (the
  // followers' timetables are an eighth of a window apart).
  static int window_samples(float sample_rate) {
    return static_cast<int>(kWindowSeconds * held_rate(sample_rate)) / 8 * 8;
  }

  void prepare(float sample_rate) {
    const float sr = held_rate(sample_rate);
    life_ = static_cast<float>(window_samples(sample_rate));
    floor_ = kit::max(kMinDelay, kFloorSeconds * sr);
    range_ = static_cast<int>(kSearchSeconds * sr);
    span_ = kSpanSeconds * sr;
    left_.clear();
    right_.clear();
    mono_.clear();
    restart(0);
  }

  // Drop the heads. The next render starts one in full voice and splices the
  // second in `until_splice` samples later (less than half a window).
  void restart(int until_splice) {
    for (Head& head : heads_) head.active = false;
    started_ = false;
    newest_ = -1;
    match_ = 1.0f;
    first_wait_ = kit::clamp(static_cast<float>(until_splice), 0.0f, 0.5f * life_);
    until_spawn_ = 0.0f;
  }

  void write(float left, float right) {
    left_.write(left);
    right_.write(right);
    mono_.write(0.5f * (left + right));
  }

  // How late the heads play an attack on average at a ratio, in samples: the
  // closest a head comes to the newest sample, and a share of what it sweeps.
  // An attack is heard when the first head to reach it gets there, which
  // depends on where in its sweep that head is: anywhere in the sweep, so
  // half of it on average, when shifting down; shifting up the head closes on
  // the attack as it goes and reaches it sooner (0.4 of the sweep, measured
  // as the time the note gets to half its height, over twelve placings).
  float latency(float ratio) const {
    return floor_ + (ratio > 1.0f ? kUpShare * (ratio - 1.0f) : 0.5f * (1.0f - ratio)) * life_;
  }

  // One output frame at `ratio`, read after this sample's write.
  // `target_ratio` is where the ratio is heading (head room for a glide).
  void render(float ratio, float target_ratio, float* left, float* right) {
    if (!started_) {
      started_ = true;
      // One head, as old as it will be when the timetable's next splice
      // comes: it holds full level until then.
      const float age = 0.5f - first_wait_ / life_;
      start(ratio, target_ratio, age, true);
      until_spawn_ = first_wait_;
    }
    if (until_spawn_ <= 0.0f) {
      start(ratio, target_ratio, 0.0f, false);
      until_spawn_ += 0.5f * life_;
    }
    until_spawn_ -= 1.0f;

    const int now = left_.write_position();
    const double step = 1.0 - static_cast<double>(ratio);
    float sum_left = 0.0f, sum_right = 0.0f;
    float product = 1.0f;
    int joined = 0;
    for (Head& head : heads_) {
      if (!head.active) continue;
      const float window = head.flat && head.phase < 0.5f
                               ? 1.0f
                               : 0.5f - 0.5f * kit::SineTable::cos_lookup(head.phase);
      const double position = static_cast<double>(now) - head.delay;
      const double floored = std::floor(position);
      const int index = static_cast<int>(floored);
      const float t = static_cast<float>(position - floored);
      sum_left += window * kit::hermite(left_.at(index - 1), left_.at(index), left_.at(index + 1),
                                        left_.at(index + 2), t);
      sum_right += window * kit::hermite(right_.at(index - 1), right_.at(index),
                                         right_.at(index + 1), right_.at(index + 2), t);
      product *= window;
      ++joined;
      head.delay += step;
      if (head.delay < kMinDelay) head.delay = kMinDelay;
      if (head.delay > kMaxDelay) head.delay = kMaxDelay;
      head.phase += phase_step();
      if (head.phase >= 1.0f) head.active = false;
    }
    // Two heads in a join add to 1 in amplitude; where they do not agree
    // (match < 1) that dips in power, so lift it back.
    if (joined == 2 && match_ < 0.999f) {
      const float lift = 1.0f / std::sqrt(kit::max(0.25f, 1.0f - 2.0f * product * (1.0f - match_)));
      sum_left *= lift;
      sum_right *= lift;
    }
    *left = sum_left;
    *right = sum_right;
  }

  // How alike the two heads were at the last splice, 0..1 (for the harness).
  float match() const { return match_; }

 private:
  static constexpr int kMaxHeads = 4;
  static constexpr float kMinDelay = 4.0f;
  static constexpr float kMaxDelay = static_cast<float>(kSize - 8);
  static constexpr float kFloorSeconds = 0.0015f;  // the closest a head starts to the newest sample
  static constexpr float kUpShare = 0.4f;          // see latency()
  // The splice search: how far it looks, over what length it compares.
  static constexpr float kSearchSeconds = 0.02f;
  static constexpr float kSpanSeconds = 0.016f;
  static constexpr int kPoints = 48;
  static constexpr int kMaxScan = 512;  // lags tried in the first pass
  static constexpr float kNearBias = 0.03f;

  struct Head {
    bool active = false;
    bool flat = false;   // the first head: full level until its fade out begins
    double delay = 0.0;  // behind the write point
    float phase = 0.0f;  // 0..1 over its life
  };

  // The lines are sized for 96 kHz; above it the window is as many samples.
  static float held_rate(float sample_rate) { return kit::min(sample_rate, 96000.0f); }

  float phase_step() const { return 1.0f / life_; }

  void start(float ratio, float target_ratio, float age, bool first) {
    Head* head = nullptr;
    int slot = 0;
    for (int i = 0; i < kMaxHeads && head == nullptr; ++i) {
      if (!heads_[i].active) {
        head = &heads_[i];
        slot = i;
      }
    }
    if (head == nullptr) return;
    // Shifting up, a head closes on the newest sample: it starts far enough
    // back for its whole life at the faster of the ratio now and where the
    // ratio is heading.
    const float fastest = kit::max(ratio, target_ratio);
    const float room = fastest > 1.0f ? (fastest - 1.0f) * life_ : 0.0f;
    double delay = static_cast<double>(floor_ + room);
    if (!first && newest_ >= 0 && heads_[newest_].active) {
      delay = find_splice(heads_[newest_].delay, delay);
    } else {
      match_ = 1.0f;
      delay += static_cast<double>((1.0f - ratio) * age * life_);
    }
    head->active = true;
    head->flat = first;
    head->delay = delay;
    head->phase = age;
    newest_ = slot;
  }

  // Where a new head should start: at or behind `nominal`, within one search
  // range, where the ring best matches what the old head (at `old_delay`) is
  // playing. Both heads then move along the ring at the same speed, so a
  // match now is a match for the whole join. Sets match_ to the correlation
  // found (1 = the two are alike).
  double find_splice(double old_delay, double nominal) {
    const int now = mono_.write_position();
    const int range = range_;
    const float stride = span_ / kPoints;
    // Compared on whole samples; the old head's fraction is given back at the end.
    const int old_whole = static_cast<int>(old_delay + 0.5);
    const double residue = old_delay - static_cast<double>(old_whole);
    const int coarse = range / kMaxScan + 1;
    // Lag 0 sits one coarse step behind the nominal start, so the step
    // before it can be looked at too.
    const int first = static_cast<int>(nominal + 0.5) + coarse + 1;
    // The comparison straddles the join as far as the ring already holds
    // what lies ahead of both heads, and looks back for the rest.
    const float ahead = kit::clamp(static_cast<float>(old_whole < first ? old_whole : first) - 4.0f,
                                   0.0f, 0.5f * span_);
    // Points are weighted by a Hann bell: with a hard-edged comparison the
    // best lag of a steady tone leans by where the edges fall in its cycle.
    int offset[kPoints];
    float reference[kPoints];
    float weight[kPoints];
    float energy = 0.0f;
    for (int i = 0; i < kPoints; ++i) {
      // Unevenly spaced (golden-ratio steps inside each stride): on an even
      // grid a tone at a multiple of the grid's rate looks the same at
      // every lag.
      const float wander = static_cast<float>(i) * 0.6180340f;
      const float place = static_cast<float>(i) + wander - std::floor(wander);
      offset[i] = static_cast<int>(ahead - place * stride);
      weight[i] =
          0.5f - 0.5f * kit::SineTable::cos_lookup((static_cast<float>(i) + 0.5f) / kPoints);
      const float sample = mono_.at(now - old_whole + offset[i]);
      reference[i] = weight[i] * sample;
      energy += reference[i] * sample;
    }
    if (energy < 1.0e-14f) {
      match_ = 1.0f;
      return nominal;
    }
    const float scale = std::sqrt(energy);
    const auto score = [&](int lag) {
      const int origin = now - first - lag;
      float match = 0.0f;
      float power = 1.0e-20f;
      for (int i = 0; i < kPoints; ++i) {
        const float sample = mono_.at(origin + offset[i]);
        match += reference[i] * sample;
        power += weight[i] * sample * sample;
      }
      // Among equal matches (a steady tone gives one per cycle) take the nearest.
      return match / std::sqrt(power) -
             kNearBias * scale * static_cast<float>(lag) / static_cast<float>(range);
    };
    // Scan the range (one step beyond each end, so an end can be told from
    // a peak) and take the best lag that is a peak: the highest point at an
    // end is the side of a peak outside the range, and splicing there would
    // be off by part of a sample.
    const int count = range / coarse;
    float scores[kMaxScan + 3];
    for (int i = 0; i <= count + 2; ++i) scores[i] = score((i - 1) * coarse);
    int best = -1;
    float best_score = -1.0e30f;
    for (int i = 1; i <= count + 1; ++i) {
      if (scores[i] > best_score && scores[i] >= scores[i - 1] && scores[i] >= scores[i + 1]) {
        best_score = scores[i];
        best = (i - 1) * coarse;
      }
    }
    if (best < 0) {
      best = 0;
      best_score = scores[1];
    }
    const int centre = best;
    for (int lag = centre - coarse + 1; lag < centre + coarse; ++lag) {
      if (lag == centre) continue;
      const float value = score(lag);
      if (value > best_score) {
        best_score = value;
        best = lag;
      }
    }
    // The top of the parabola through the best lag and its neighbours: the
    // fraction of a sample that keeps a pure tone free of sidebands.
    float fraction = 0.0f;
    {
      const float before = score(best - 1);
      const float after = score(best + 1);
      const float curve = before - 2.0f * best_score + after;
      if (curve < -1.0e-12f) fraction = kit::clamp(0.5f * (before - after) / curve, -0.5f, 0.5f);
    }
    const float found =
        best_score + kNearBias * scale * static_cast<float>(best) / static_cast<float>(range);
    match_ = kit::clamp(found / scale, 0.0f, 1.0f);
    return static_cast<double>(first + best) + static_cast<double>(fraction) + residue;
  }

  kit::DelayLine<kSize> left_, right_, mono_;
  Head heads_[kMaxHeads];
  float life_ = 2400.0f;
  float floor_ = 72.0f;
  float span_ = 768.0f;
  int range_ = 960;
  int newest_ = -1;
  float until_spawn_ = 0.0f;
  float first_wait_ = 0.0f;
  float match_ = 1.0f;
  bool started_ = false;
};

}  // namespace canon_dsp
}  // namespace livemix
