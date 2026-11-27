#pragma once

// Where the overtones of the held keys meet, and how a line walks between
// the meetings.
//
// - Every held key lists its overtones inside the register (Ceiling and the
//   two octaves under it). Overtones of different keys closer than Tolerance
//   are one meeting, at the mean of their pitches with the lower overtones
//   counting more. A meeting on a key that is held is left out: that voice
//   has a singer.
// - The lowest key has a partner nobody hears: a pitch a just interval above
//   it whose overtones meet the key's own. With one key down those are the
//   only meetings there are.
// - A line stands on one meeting and steps to another: Lean says how often
//   upwards and how often downwards, and a seeded draw does the rest.

#include "../../kit/kit.h"

namespace livemix {
namespace unsung {

struct Key {
  float hz = 0.0f;
  int voice = 0;
};

struct Meeting {
  float hz = 0.0f, weight = 0.0f;
  int count = 0;
  int voice[3] = {}, harmonic[3] = {};  // harmonic 0: the partner's, which no key sings
  float own[3] = {};                    // where each would be by itself, Hz
};

class Meetings {
 public:
  static constexpr int kMost = 12;
  static constexpr int kKeys = 12;

  int count() const { return count_; }
  const Meeting& at(int i) const { return list_[i]; }
  void clear() { count_ = 0; }

  void find(const Key* keys, int n, float tolerance_cents, float ceiling, int partner) {
    count_ = 0;
    if (n == 0) return;
    search(keys, n, tolerance_cents, ceiling * 0.25f, ceiling, partner);
    // Nothing in the register (a key too high for it): its own octave a little
    // above, else the lowest meeting there is.
    if (count_ == 0 && partner > 0) {
      search(keys, n, tolerance_cents, ceiling * 0.25f, kit::max(ceiling, 2600.0f), 12);
    }
    if (count_ == 0) {
      search(keys, n, tolerance_cents, ceiling, 4200.0f, partner > 0 ? 12 : 0);
      if (count_ > 1) count_ = 1;
    }
  }

  int nearest(float hz) const {
    int best = -1;
    float best_off = 1.0e9f;
    for (int i = 0; i < count_; ++i) {
      const float off = std::fabs(std::log2(list_[i].hz / hz));
      if (off < best_off) {
        best_off = off;
        best = i;
      }
    }
    return best;
  }

  // The meeting to begin on: the strongest, or the end a leaning line comes from.
  int first(float lean, float other) const {
    int best = -1;
    float best_weight = -1.0f;
    for (int i = 0; i < count_; ++i) {
      if (near(list_[i].hz, other) && count_ > 1) continue;
      const float place = count_ > 1 ? static_cast<float>(i) / static_cast<float>(count_ - 1) : 0.5f;
      const float off = place - 0.5f + 0.5f * lean;
      const float w = list_[i].weight / (0.06f + off * off);
      if (w > best_weight) {
        best_weight = w;
        best = i;
      }
    }
    return best;
  }

  // The next meeting from `hz`. `other` is where the other line stands.
  int next(float hz, float other, float lean, kit::Rng& rng) const {
    if (count_ == 0) return -1;
    bool up = rng.uniform() < 0.5f + 0.5f * lean;
    for (int turn = 0; turn < 2; ++turn, up = !up) {
      // Up to three meetings on that side, the stronger ones likelier.
      int found[3];
      float weight[3], total = 0.0f;
      int n = 0;
      for (int step = 0; step < count_ && n < 3; ++step) {
        const int i = up ? step : count_ - 1 - step;
        const float at = list_[i].hz;
        if (up ? at <= hz * 1.03f : at * 1.03f >= hz) continue;
        if (near(at, other)) continue;
        found[n] = i;
        weight[n] = list_[i].weight / static_cast<float>(1 + n);
        total += weight[n];
        ++n;
      }
      const float draw = rng.uniform() * total;
      if (n > 0) {
        float sum = 0.0f;
        for (int i = 0; i < n; ++i) {
          sum += weight[i];
          if (draw <= sum) return found[i];
        }
        return found[n - 1];
      }
      // The end of the ladder: a line that only climbs (or only falls) begins again.
      if (turn == 0 && std::fabs(lean) > 0.6f && count_ > 2) {
        const int i = up ? 0 : count_ - 1;
        if (!near(list_[i].hz, other) && !near(list_[i].hz, hz)) return i;
      }
    }
    return -1;
  }

 private:
  struct Overtone {
    float hz = 0.0f, weight = 0.0f, plain = 1.0f;
    int voice = 0, harmonic = 0, of = 0;
  };
  static constexpr int kOvertones = 360;

  static bool near(float a, float b) { return b > 0.0f && a < b * 1.03f && b < a * 1.03f; }

  // An overtone that is an octave, a fifth or a third of its key weighs more
  // than one that is none of them: 9 and 15 are strangers over a lone key.
  static float plain(int k) {
    while ((k & 1) == 0) k >>= 1;
    return k <= 5 ? 1.0f : (k == 7 ? 0.7f : 2.4f / static_cast<float>(k));
  }

  static float partner_ratio(int semitones) {
    static const float kRatio[13] = {0.0f,       16.0f / 15, 9.0f / 8, 6.0f / 5, 5.0f / 4, 4.0f / 3, 7.0f / 5,
                                     3.0f / 2,   8.0f / 5,   5.0f / 3, 7.0f / 4, 15.0f / 8, 2.0f};
    return kRatio[kit::clamp_int(semitones, 0, 12)];
  }

  void search(const Key* keys, int n, float tolerance_cents, float low, float high, int partner) {
    int total = 0;
    int lowest = 0;
    for (int i = 1; i < n; ++i) {
      if (keys[i].hz < keys[lowest].hz) lowest = i;
    }
    for (int i = 0; i < n; ++i) add(keys[i].hz, i, keys[i].voice, true, low, high, &total, 1.0f);
    // The lowest key's partner comes first, the others' are fainter.
    const float ratio = partner_ratio(partner);
    for (int i = 0; i < n && ratio > 0.0f; ++i) {
      add(keys[i].hz * ratio, kKeys + i, keys[i].voice, false, low, high, &total, i == lowest ? 0.8f : 0.4f);
    }
    // By pitch.
    for (int i = 1; i < total; ++i) {
      const Overtone x = row_[i];
      int j = i - 1;
      while (j >= 0 && row_[j].hz > x.hz) {
        row_[j + 1] = row_[j];
        --j;
      }
      row_[j + 1] = x;
    }
    const float reach = std::exp2(tolerance_cents * (1.0f / 1200.0f));
    for (int i = 0; i < total;) {
      int end = i + 1;
      while (end < total && row_[end].hz <= row_[i].hz * reach) ++end;
      Meeting meeting = gather(i, end, tolerance_cents);
      if (meeting.count > 1 && heard(meeting) && !sung(keys, n, meeting.hz)) {
        keep(meeting);
        i = end;
      } else {
        ++i;
      }
    }
  }

  void add(float hz, int of, int voice, bool heard, float low, float high, int* total,
           float loud) {
    for (int k = heard ? 2 : 1; k <= 24; ++k) {
      const float at = hz * static_cast<float>(k);
      if (at > high) return;
      if (at < low || *total >= kOvertones) continue;
      Overtone& o = row_[(*total)++];
      o.hz = at;
      o.plain = heard ? plain(k) : 1.0f;
      o.weight = loud / std::sqrt(static_cast<float>(heard ? k : k + 1));
      o.voice = voice;
      o.harmonic = heard ? k : 0;
      o.of = of;
    }
  }

  // One meeting out of overtones from..to, three of different keys at most.
  Meeting gather(int from, int to, float tolerance_cents) const {
    Meeting out;
    int of[3] = {-1, -1, -1};
    float pitch = 0.0f, strange = 1.0f;
    for (int i = from; i < to; ++i) {
      const Overtone& o = row_[i];
      bool seen = false;
      for (int c = 0; c < out.count; ++c) seen = seen || of[c] == o.of;
      if (seen || out.count == 3) continue;
      of[out.count] = o.of;
      out.voice[out.count] = o.voice;
      out.harmonic[out.count] = o.harmonic;
      out.own[out.count] = o.hz;
      ++out.count;
      strange = kit::min(strange, o.plain);
      pitch += o.weight * std::log2(o.hz);
      out.weight += o.weight;
    }
    out.hz = out.weight > 0.0f ? std::exp2(pitch / out.weight) : 0.0f;
    // The ones Tolerance only just lets in are the ones it is turned up for.
    const float cents = 1200.0f * std::log2(out.own[out.count - 1] / out.own[0]);
    const float off = (cents - 0.75f * tolerance_cents) / (0.45f * tolerance_cents);
    out.weight *= strange * (0.22f + 2.0f / (1.0f + off * off));
    return out;
  }

  // Two partners meeting are nobody's overtones.
  static bool heard(const Meeting& meeting) {
    for (int c = 0; c < meeting.count; ++c) {
      if (meeting.harmonic[c] > 0) return true;
    }
    return false;
  }

  static bool sung(const Key* keys, int n, float hz) {
    for (int i = 0; i < n; ++i) {
      if (near(hz, keys[i].hz)) return true;
    }
    return false;
  }

  // The list stays by pitch; when it is full the weakest goes.
  void keep(const Meeting& meeting) {
    // Two meetings a hair apart are one: the stronger stays.
    if (count_ > 0 && meeting.hz < list_[count_ - 1].hz * 1.02f) {
      if (meeting.weight > list_[count_ - 1].weight) list_[count_ - 1] = meeting;
      return;
    }
    if (count_ == kMost) {
      int weakest = 0;
      for (int i = 1; i < count_; ++i) {
        if (list_[i].weight < list_[weakest].weight) weakest = i;
      }
      if (list_[weakest].weight >= meeting.weight) return;
      for (int i = weakest; i + 1 < count_; ++i) list_[i] = list_[i + 1];
      --count_;
    }
    list_[count_++] = meeting;
  }

  Meeting list_[kMost];
  int count_ = 0;
  Overtone row_[kOvertones];
};

}  // namespace unsung
}  // namespace livemix
