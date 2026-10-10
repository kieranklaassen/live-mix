#pragma once

// The transposing stage of one follower of the Canon: what the follower's
// reader plays goes into a short ring of its own, and a read head moves along
// that ring at the pitch ratio. Its delay shrinks while it plays (shifting
// up) or grows (shifting down), so every so often a new head has to take
// over from it, further back or further forward:
//
// - One head plays alone, at full level, between two splices: what comes out
//   then is one plain copy of the ring at the new pitch. (Two heads always
//   crossing, as in the Smooth splice of cpp/devices/pitch-shifter, play
//   every attack two or three times over 25 ms an octave up.)
// - A splice comes only when the head has used up its room, so as often as
//   the interval needs and no more: twice a second for a semitone, some
//   thirty times for an octave up.
// - The new head starts where the ring best matches what the old head is
//   playing (normalised cross-correlation over one search range of 30 ms,
//   long enough for one period of a 30 Hz note), and the two cross over in
//   8 ms. A single note comes out as a steady tone at the new pitch; a chord
//   gets the closest agreement its notes allow, and where the two heads
//   still disagree the pair is lifted back to constant power.
// - An attack is played once, and always as late: when the level written to
//   the ring jumps, a new head is put a fixed way behind the attack, so it
//   plays it whole after latency() samples, and the heads that sounded are
//   faded out in 3 ms. Until enough has been played since the attack, a
//   head shifting up loops inside what it has played, and does not go back
//   over the attack to play it again.
//
// The ring is written on every sample whether or not the heads run, so heads
// that start always find the follower's last 170 ms there.

#include "../../kit/delay.h"
#include "../../kit/math.h"

namespace livemix {
namespace canon_dsp {

class Shifter {
 public:
  // 170 ms at 96 kHz: the furthest a head stands back is its room (38 ms),
  // the search range and the stretch the search compares.
  static constexpr int kSize = 16384;

  void prepare(float sample_rate) {
    const float sr = held_rate(sample_rate);
    floor_ = kit::max(kMinDelay, kFloorSeconds * sr);
    jump_ = kJumpSeconds * sr;
    range_ = static_cast<int>(kSearchSeconds * sr);
    cross_ = kCrossSeconds * sr;
    quick_ = kQuickSeconds * sr;
    first_ = kFirstSeconds * sr;
    margin_ = kMarginSeconds * sr;
    nudge_ = static_cast<int>(kNudgeSeconds * sr);
    span_ = kSpanSeconds * sr;
    hold_ = static_cast<int>(kHoldSeconds * sr);
    fast_coeff_ = kit::time_to_coeff(kFastSeconds, sr);
    slow_coeff_ = kit::time_to_coeff(kSlowSeconds, sr);
    clear();
  }

  // Empty rings and a listener that has heard nothing: init, and waking.
  void clear() {
    left_.clear();
    right_.clear();
    mono_.clear();
    fast_ = 0.0f;
    slow_ = 0.0f;
    since_ = kLong;
    restart(0.0f);
  }

  // Drop the heads. The next render starts one in full voice, `phase` (0..1)
  // of the way through its room, so that several shifters started together
  // do not splice together.
  void restart(float phase) {
    for (Head& head : heads_) head.level = 0.0f, head.step = 0.0f;
    started_ = false;
    attack_ = false;
    match_ = 1.0f;
    phase_ = kit::clamp(phase, 0.0f, 1.0f);
  }

  void write(float left, float right) {
    left_.write(left);
    right_.write(right);
    const float mono = 0.5f * (left + right);
    mono_.write(mono);
    // An attack: the power of the last 2 ms stands well over what it was
    // over the 30 ms before. Not again within 25 ms.
    const float power = mono * mono;
    fast_ = flush_denormal(power + (fast_ - power) * fast_coeff_);
    if (since_ < kLong) ++since_;
    if (since_ >= hold_ && fast_ > kRise * slow_ + kQuiet) {
      attack_ = true;
      since_ = 0;
    }
    slow_ = flush_denormal(power + (slow_ - power) * slow_coeff_);
  }

  // How late an attack is played at a ratio, in samples: the head put behind
  // it (see attack()) reads `ratio` samples a sample.
  float latency(float ratio) const { return behind(ratio) / ratio; }

  // One output frame at `ratio`, read after this sample's write.
  void render(float ratio, float* left, float* right) {
    if (!started_) {
      started_ = true;
      attack_ = false;
      lead_ = 0;
      heads_[0].delay = static_cast<double>(low(ratio, cross_) + phase_ * (jump_ + static_cast<float>(range_)));
      heads_[0].level = 1.0f;
      heads_[0].step = 0.0f;
    }
    if (attack_) {
      attack_ = false;
      attack(ratio);
    }
    Head& lead = heads_[lead_];
    if (lead.level >= 1.0f) {
      // Alone and in full voice: has it used up its room?
      if (ratio > 1.0f) {
        if (lead.delay <= static_cast<double>(low(ratio, cross_))) splice_up(ratio);
      } else if (ratio < 1.0f) {
        if (lead.delay >= static_cast<double>(floor_ + jump_ + static_cast<float>(range_))) splice_down(ratio);
      }
    }

    const int now = left_.write_position();
    const double step = 1.0 - static_cast<double>(ratio);
    float sum_left = 0.0f, sum_right = 0.0f;
    float product = 1.0f;
    int sounding = 0;
    for (Head& head : heads_) {
      if (!(head.level > 0.0f || head.step > 0.0f)) continue;
      head.level += head.step;
      if (head.level >= 1.0f) {
        head.level = 1.0f;
        head.step = 0.0f;
      } else if (head.level <= 0.0f) {
        head.level = 0.0f;
        head.step = 0.0f;
        continue;
      }
      const float gain = head.level >= 1.0f ? 1.0f : 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * head.level);
      const double position = static_cast<double>(now) - head.delay;
      const double floored = std::floor(position);
      const int index = static_cast<int>(floored);
      const float t = static_cast<float>(position - floored);
      sum_left += gain * kit::hermite(left_.at(index - 1), left_.at(index), left_.at(index + 1),
                                      left_.at(index + 2), t);
      sum_right += gain * kit::hermite(right_.at(index - 1), right_.at(index), right_.at(index + 1),
                                       right_.at(index + 2), t);
      product *= gain;
      ++sounding;
      head.delay += step;
      if (head.delay < kMinDelay) head.delay = kMinDelay;
      if (head.delay > kMaxDelay) head.delay = kMaxDelay;
    }
    // Two heads in a splice add to 1 in amplitude; where they do not agree
    // (match < 1) that dips in power, so lift it back.
    if (sounding == 2 && match_ < 0.999f) {
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
  static constexpr int kHeads = 4;
  static constexpr float kMinDelay = 4.0f;
  static constexpr float kMaxDelay = static_cast<float>(kSize - 8);
  static constexpr int kLong = 1 << 30;
  static constexpr float kFloorSeconds = 0.0015f;   // the closest a head comes to the newest sample
  static constexpr float kJumpSeconds = 0.008f;     // the least a splice moves the head
  static constexpr float kSearchSeconds = 0.030f;   // and how much further it may
  static constexpr float kCrossSeconds = 0.008f;    // the crossing of a splice
  static constexpr float kQuickSeconds = 0.003f;    // the crossing at an attack and just after one
  static constexpr float kFirstSeconds = 0.012f;    // what a head shifting up has played of an attack's note when it first loops
  static constexpr float kMarginSeconds = 0.0005f;
  static constexpr float kNudgeSeconds = 0.003f;    // how far an attack's head may move to agree with what sounds
  static constexpr float kSpanSeconds = 0.016f;     // the stretch the search compares
  static constexpr float kHoldSeconds = 0.025f;
  static constexpr float kFastSeconds = 0.002f;
  static constexpr float kSlowSeconds = 0.03f;
  static constexpr float kRise = 6.0f;              // an attack: the power up by this much (8 dB)
  static constexpr float kQuiet = 1.0e-8f;          // and over -80 dBFS
  static constexpr float kAgree = 0.75f;
  static constexpr int kPoints = 48;
  static constexpr int kMaxScan = 512;  // lags tried in the first pass
  static constexpr float kNearBias = 0.03f;

  struct Head {
    double delay = 0.0;  // behind the write point
    float level = 0.0f;  // 0..1 along its fade; it sounds at 0.5 - 0.5 cos(pi level)
    float step = 0.0f;   // per sample: up while it comes in, down while it goes
  };

  // The lines are sized for 96 kHz; above it the times are as many samples.
  static float held_rate(float sample_rate) { return kit::min(sample_rate, 96000.0f); }

  // The closest a head shifting up comes before it hands over: it plays on
  // through a crossing of `cross` samples.
  float low(float ratio, float cross) const {
    return floor_ + (ratio > 1.0f ? (ratio - 1.0f) * cross : 0.0f);
  }

  // How far behind an attack its head is put. It has to come in (3 ms)
  // before it reaches the attack; and shifting up it must not catch up with
  // the newest sample before it has played enough of the note to loop in.
  float behind(float ratio) const {
    float delay = 1.0f + ratio * quick_;
    if (ratio > 1.0f) {
      delay = kit::max(delay, ratio * low(ratio, quick_) + (ratio - 1.0f) * first_);
    }
    return delay + margin_;
  }

  int free_head() const {
    for (int i = 0; i < kHeads; ++i) {
      if (i != lead_ && !(heads_[i].level > 0.0f || heads_[i].step > 0.0f)) return i;
    }
    // None free: take the quietest that is on its way out.
    int quietest = (lead_ + 1) % kHeads;
    for (int i = 0; i < kHeads; ++i) {
      if (i != lead_ && heads_[i].level < heads_[quietest].level) quietest = i;
    }
    return quietest;
  }

  // A new head at `delay` takes over from every head that sounds, in `cross` samples.
  void take_over(double delay, float cross) {
    if (cross < 8.0f) cross = 8.0f;
    const int next = free_head();
    for (Head& head : heads_) {
      if (head.level > 0.0f || head.step > 0.0f) head.step = -1.0f / cross;
    }
    heads_[next].delay = delay;
    heads_[next].level = 0.0f;
    heads_[next].step = 1.0f / cross;
    lead_ = next;
  }

  // Shifting up, the head has come as close to the newest sample as it may:
  // a new one starts further back.
  void splice_up(float ratio) {
    const Head& old = heads_[lead_];
    const float speed = ratio - 1.0f;
    // The least a splice may move the head for a crossing of `cross`.
    const auto least = [&](float cross) { return 1.2f * speed * cross; };
    float lag_min = kit::max(jump_, least(cross_));
    float lag_max = jump_ + static_cast<float>(range_);
    float cross = cross_;
    // What the old head has played since the last attack: the new head stays
    // inside it, or it would play the attack again.
    const float played = static_cast<float>(since_) - static_cast<float>(old.delay) - margin_;
    if (played > 0.0f && played < lag_max) {
      if (played < lag_min + 0.25f * static_cast<float>(range_)) {
        // Too little yet for a splice of the usual size: wait as long as a
        // quick crossing allows, then loop in what there is.
        if (old.delay > static_cast<double>(low(ratio, quick_))) return;
        cross = quick_;
        const float inside = kit::max(least(quick_), 0.25f * played);
        if (played > inside + 4.0f) {
          lag_min = inside;
          lag_max = played;
        }  // otherwise there is nothing for it: back over the attack
      } else {
        lag_max = played;
      }
    }
    const int range = static_cast<int>(lag_max - lag_min);
    const double start = find_splice(old.delay, old.delay + static_cast<double>(lag_min), range);
    // The old head plays on through the crossing: no longer than its room lasts.
    const float lag = static_cast<float>(start - old.delay);
    cross = kit::min(cross, lag / (1.2f * speed));
    cross = kit::min(cross, (static_cast<float>(old.delay) - kMinDelay) / speed);
    take_over(start, cross);
  }

  // Shifting down, the head has fallen as far behind as it may: a new one
  // starts close to the newest sample.
  void splice_down(float ratio) {
    const Head& old = heads_[lead_];
    float nominal = floor_;
    float cross = cross_;
    int range = range_;
    // An attack the old head has not reached yet (one that came too soon
    // after another to get a head of its own): the new head starts behind it.
    if (static_cast<float>(old.delay) > static_cast<float>(since_) + margin_) {
      nominal = kit::max(floor_, static_cast<float>(since_) + behind(ratio));
      cross = quick_;
      const float room = static_cast<float>(old.delay) - 1.2f * (1.0f - ratio) * quick_ - nominal;
      if (room < 0.0f) {
        // No room between the two: play on until the attack is behind, as
        // long as the ring lasts.
        if (old.delay < static_cast<double>(kMaxDelay) - static_cast<double>(range_) - static_cast<double>(span_)) return;
        nominal = floor_;
      } else {
        range = static_cast<int>(kit::min(static_cast<float>(range_), room));
      }
    }
    const double start = find_splice(old.delay, static_cast<double>(nominal), range);
    take_over(start, cross);
  }

  // An attack has just been written. A new head goes a fixed way behind it,
  // so the attack is played once, whole, latency() from now; what sounded is
  // faded out quickly.
  void attack(float ratio) {
    const float want = behind(ratio);
    const Head& old = heads_[lead_];
    // The head that sounds alone is already there, or as good as: leave it.
    if (old.level >= 1.0f && std::fabs(static_cast<float>(old.delay) - want) < 0.5f * margin_) return;
    // Where what sounds goes on under the attack (a note struck over a held
    // one) the new head may move a little to agree with it.
    double start = find_splice(old.delay, static_cast<double>(want), nudge_);
    if (match_ < kAgree) {
      start = static_cast<double>(want);
      match_ = 0.0f;
    }
    take_over(start, quick_);
  }

  // Where a new head should start: between `nominal` and `range` samples
  // behind it, where the ring best matches what the old head (at `old_delay`)
  // is playing. Both heads then move along the ring at the same speed, so a
  // match now is a match for the whole join. Sets match_ to the correlation
  // found (1 = the two are alike).
  double find_splice(double old_delay, double nominal, int range) {
    const int now = mono_.write_position();
    if (range < 1) range = 1;
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
      // Nothing sounds: nothing to agree with.
      match_ = 0.0f;
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
  Head heads_[kHeads];
  int lead_ = 0;  // the head that plays alone, or is coming in
  float floor_ = 72.0f, jump_ = 384.0f, cross_ = 384.0f, quick_ = 144.0f, first_ = 576.0f;
  float margin_ = 24.0f, span_ = 768.0f;
  int range_ = 1440, nudge_ = 144, hold_ = 1200;
  float fast_coeff_ = 0.0f, slow_coeff_ = 0.0f;
  float fast_ = 0.0f, slow_ = 0.0f;  // the power of the ring's last 2 ms and 30 ms
  int since_ = kLong;                // samples since the last attack was written
  float match_ = 1.0f;
  float phase_ = 0.0f;
  bool started_ = false;
  bool attack_ = false;
};

}  // namespace canon_dsp
}  // namespace livemix
