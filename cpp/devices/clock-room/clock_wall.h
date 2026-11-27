#pragma once

// The wall the clocks of Clock Room hang on: who is on it and in what order,
// what each pendulum feels of the others, and what of it is heard.

#include "../../kit/kit.h"
#include "clock_voice.h"

namespace livemix {

struct ClockWall {
  using Voice = ClockVoice;
  static constexpr int kMaxVoices = 12;
  static constexpr float kPull = 5.5f;  // its strongest pull, radians a swing
  enum WallKind : int { kInStep = 0, kOpposed, kSplayed, kChain, kNumWalls };

  kit::Smoother bond, share[kNumWalls];  // once a tick
  int on_wall = 0;
  float crowd = 0.0f, crowd_rate = 0.1f;  // whether more than one is on it
  float agreement = 0.0f;

  void init(float tick_seconds) {
    const float tick_rate = 1.0f / tick_seconds;
    bond.set_time(0.02f, tick_rate);
    for (kit::Smoother& part : share) part.set_time(0.25f, tick_rate);
    crowd_rate = kit::min(tick_seconds * 4.0f, 1.0f);
    agreement = 0.0f;
    restart();
  }
  void restart() {
    crowd = 0.0f;
    on_wall = 0;
  }
  void set(int kind, float learn, bool glide) {
    bond.set(learn, glide);
    for (int w = 0; w < kNumWalls; ++w) share[w].set(w == kind ? 1.0f : 0.0f, glide);
  }
  void next() {
    bond.next();
    for (kit::Smoother& part : share) part.next();
  }
  void fill(bool first) {
    const float to = on_wall > 1 ? 1.0f : 0.0f;
    crowd = first ? to : crowd + (to - crowd) * crowd_rate;
  }
  bool opposes() const { return bond.value * crowd > 0.5f; }

  // What the wall makes of a clock: where it stands, how its octave below
  // sounds, how hard and where it is struck. A clock alone has no wall.
  struct Manner {
    float place = 0.0f, hum = 1.0f, force = 1.0f, edge = 0.0f, comb = 0.0f, hollow = 0.0f;
    float low = 1.0f, high = 1.0f;  // how much of its low and its high part is carried
    float swing = 1.0f;             // and of its swing
    float apart = 1.0f;             // how far apart its rods stand
  };
  Manner manner_of(const Voice& voice) const {
    const float carried = kit::min(1.12f * bond.value, 1.0f) * crowd;
    const float step = share[kInStep].value * carried, opposed = share[kOpposed].value * carried;
    const float splayed = share[kSplayed].value * carried, chain = share[kChain].value * carried;
    Manner out;
    const float alone = kit::max(1.0f - step - opposed - splayed - chain, 0.0f);
    const float climb = 2.0f * voice.rank - 1.0f;
    out.place = alone * voice.spread + step * 0.75f * voice.spread + opposed * (voice.odd ? 1.0f : -1.0f) +
                splayed * 0.95f * (2.0f * voice.slot - 0.8f) + chain * climb;
    out.hum = kit::max(1.0f + 1.3f * step - opposed - 0.95f * splayed - 1.2f * chain * climb, 0.0f);
    out.force = 1.0f + chain * (0.1f + 0.25f * climb);
    out.edge = -0.06f * step + opposed * (voice.odd ? 0.34f : 0.0f) + splayed * 0.46f + chain * (0.16f + 0.52f * climb);
    out.comb = splayed;
    out.hollow = opposed;
    out.low = 1.0f + 0.45f * opposed - 0.85f * splayed - 0.1f * chain - 0.3f * chain * climb;
    out.high = 1.0f - 0.46f * step + opposed * (voice.odd ? 0.7f : -0.6f) + 1.5f * splayed + chain * (0.1f + 0.7f * climb);
    out.apart = 1.0f - 0.2f * step + 0.6f * opposed;
    out.swing = 1.0f + 0.8f * step + 1.4f * opposed + 0.5f * splayed + 1.6f * chain;
    return out;
  }
  // Where a clock is struck. Splayed, each at a place of its own, so that some
  // of its modes hardly move there; opposed, at the middle, which leaves out
  // the octaves and is hollow.
  static float struck_at(const Voice& voice, const Manner& manner, float ratio) {
    if (ratio < 1.2f) return 1.0f;
    float out = 1.0f;
    if (manner.comb > 0.0f) {
      const float s = kit::SineTable::lookup(0.5f * ratio * (0.16f + 0.30f * voice.slot + 0.05f * voice.spread));
      out += manner.comb * (1.5f * s * s - 0.97f);
    }
    if (manner.hollow > 0.0f) {
      const float s = kit::SineTable::lookup(0.25f * ratio);
      out *= 1.0f + manner.hollow * (1.25f * s * s - 0.95f);
    }
    return out;
  }

  // How much the clocks move as a chain, whose wave takes two swings.
  float waves() const { return share[kChain].value * kit::min(2.5f * bond.value * crowd, 1.0f); }

  static bool on_the_wall(const Voice& voice) { return voice.sounding && !voice.pending && !voice.fresh && !voice.released(); }

  // The order of the clocks on the wall, by pitch, and each one's share of the
  // swing under the law that holds.
  void rank(Voice* voices) {
    Voice* order[kMaxVoices];
    int count = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = voices[v];
      if (!voice.sounding || voice.pending || voice.released()) continue;
      int at = count++;
      while (at > 0 && order[at - 1]->frequency > voice.frequency) {
        order[at] = order[at - 1];
        --at;
      }
      order[at] = &voice;
    }
    // A step through the places that leaps: near 0.38 of their number, and
    // with no divisor in common with it.
    int leap = kit::clamp_int(static_cast<int>(0.382f * static_cast<float>(count) + 0.5f), 1, kMaxVoices);
    while (count > 1 && divisor(leap, count) != 1) ++leap;
    for (int i = 0; i < count; ++i) {
      order[i]->odd = (i & 1) != 0;
      order[i]->rank = count > 1 ? static_cast<float>(i) / static_cast<float>(count - 1) : 0.5f;
      order[i]->slot = count > 1 ? static_cast<float>((i * leap) % count) / static_cast<float>(count) : 0.0f;
    }
    on_wall = count;
  }
  static int divisor(int a, int b) {
    while (b != 0) {
      const int rest = a % b;
      a = b;
      b = rest;
    }
    return a;
  }

  static float asked(const Voice& voice, int wall) {
    switch (wall) {
      case kOpposed:
        return voice.odd ? 0.5f : 0.0f;
      case kSplayed:
        return voice.slot;
      case kChain:
        return 0.5f * voice.rank;
      default:
        return 0.0f;
    }
  }

  // Every fourth tick: what each pendulum feels of the others.
  void couple(Voice* voices, int wall, float beat, float learn, float unlike) {
    const float pull = learn * learn * learn * kPull * (1.0f / kit::kTwoPi) * beat;
    float place[kMaxVoices] = {};
    float sum_re = 0.0f, sum_im = 0.0f;
    int count = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = voices[v];
      if (!on_the_wall(voice)) continue;
      const double at = voice.phase * (wall == kChain ? 0.5 : 1.0) - asked(voice, wall);
      place[v] = static_cast<float>(at - std::floor(at));
      sum_re += kit::SineTable::cos_lookup(place[v]);
      sum_im += kit::SineTable::lookup(place[v]);
      ++count;
    }
    const float many = kit::max(static_cast<float>(count), 1.0f);
    agreement = count > 1 ? kit::min(std::sqrt(sum_re * sum_re + sum_im * sum_im) / many, 1.0f) : 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = voices[v];
      if (!voice.sounding || voice.pending) continue;
      const float own = beat * (1.0f + 0.50f * unlike * voice.nature) * (0.25f + 0.75f * voice.spring);
      float felt = 0.0f;
      if (count > 1 && on_the_wall(voice)) {
        // The mean of sin(θj − θi) over the others, from the two sums.
        const float c = kit::SineTable::cos_lookup(place[v]), s = kit::SineTable::lookup(place[v]);
        felt = (sum_im * c - sum_re * s) / (many - 1.0f);
      }
      voice.rate = kit::clamp(own + pull * felt, 0.2f * own, 2.6f * own);
    }
  }

  // The voice a new clock takes: an idle one, else the quietest let go, else
  // the quietest held, the oldest on a tie; one that a strike already waits in
  // only when there is no other.
  static int pick(const Voice* voices) {
    int choice = -1;
    for (int pass = 0; pass < 4 && choice < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices[v];
        if (pass == 0 && voice.sounding) continue;
        if (pass == 1 && (voice.pending || !voice.released())) continue;
        if (pass == 2 && voice.pending) continue;
        if (choice < 0) {
          choice = v;
          continue;
        }
        const Voice& best = voices[choice];
        const bool older = voice.stamp < best.stamp;
        if (pass == 0 ? older : voice.follow < best.follow || (voice.follow == best.follow && older)) choice = v;
      }
    }
    return choice;
  }
};

}  // namespace livemix
