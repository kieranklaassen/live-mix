#pragma once

// The law of Deep Roots: which roots a chord asks for, where they go and how
// strong each is, looked at again every ten milliseconds. Included at the end
// of deep_roots.h and by nothing else.

namespace livemix {

// The nearest octave of a held key, in octaves, and how far off it lies (cents).
inline float DeepRoots::nearest_tone(float octave, float* off) const {
  float best = 1.0e9f, place = octave;
  for (int h = 0; h < held_count_; ++h) {
    const float d = octave - pool_.voices[held_[h]].octave;
    const float away = d - std::floor(d + 0.5f);
    if (std::fabs(away) < best) {
      best = std::fabs(away);
      place = octave - away;
    }
  }
  *off = best * 1200.0f;
  return place;
}

// How well a bass at this pitch carries the keys that are held.
inline float DeepRoots::bears(float octave) const {
  float sum = 0.0f;
  for (int h = 0; h < held_count_; ++h) {
    const float d = pool_.voices[held_[h]].octave - octave;
    const int semitone = static_cast<int>((d - std::floor(d)) * 12.0f + 0.5f) % 12;
    sum += kBears[semitone];
  }
  return sum;
}

inline void DeepRoots::weigh_keys() {
  best_bearing_ = 0.5f;
  for (int h = 0; h < held_count_; ++h) best_bearing_ = kit::max(best_bearing_, bears(pool_.voices[held_[h]].octave));
}

inline float DeepRoots::within(float cents, float tolerance) {
  const float u = cents / tolerance;
  return u > 3.0f ? 0.0f : std::exp(-u * u);
}

inline DeepRoots::Cand* DeepRoots::ask(int voice, int num, int den, float hz, float power) {
  if (count_ >= kMaxCands) return nullptr;
  Cand& c = cands_[count_++];
  c.voice = voice;
  c.num = num;
  c.den = den;
  c.hz = hz;
  c.goal_hz = hz;
  c.octave = std::log2(hz);
  c.power = power;
  c.fast = false;
  c.slot = -1;
  c.depth = 1.0f;
  c.from = clock_;
  c.velocity = 0.7f;
  return &c;
}

// The divisions one key grows, and how much of each.
inline void DeepRoots::list_stems(int index, bool all) {
  using namespace deep_roots;
  const Voice& v = pool_.voices[index];
  const float reach = param(kReach), series = param(kSeries);
  float w[kDivisions];
  float total = 0.0f;
  for (int i = 0; i < kDivisions; ++i) {
    const float u = kit::clamp((reach - kOctaves[kDivision[i]]) * 3.0f + 0.5f, 0.0f, 1.0f);
    w[i] = u * u * (3.0f - 2.0f * u) * series_share(i, series);
    total += w[i];
  }
  if (total < 1.0f) {
    // A key always has a root: its shallowest.
    w[0] += (1.0f - total) * (1.0f - kit::clamp(series * 3.0f - 2.0f, 0.0f, 1.0f));
    w[1] += (1.0f - total) * kit::clamp(series * 3.0f - 2.0f, 0.0f, 1.0f);
    total = 1.0f;
  }
  // Branching: the deepest root first, then the others from the shallow end.
  const float room = param(kBranching) * kit::min(total - 1.0f, static_cast<float>(kStems - 1));
  float shallower = 0.0f;
  const int first = count_;
  for (int i = 0; i < kDivisions; ++i) {
    if (w[i] < 0.001f) continue;
    float deepest = kit::min(1.0f, w[i]);
    for (int j = i + 1; j < kDivisions; ++j) deepest *= 1.0f - kit::min(1.0f, w[j]);
    const float rank = (1.0f - deepest) * (1.0f + shallower);
    shallower += w[i];
    const float power = kit::min(1.0f, w[i]) * kit::clamp(1.0f + room - rank, 0.0f, 1.0f);
    if (power < 0.001f && !(all && w[i] > 0.05f)) continue;
    int num = 1, den = kDivision[i];
    float hz = v.hz / static_cast<float>(den);
    const float floor_hz = param(kFloor);
    while (hz < floor_hz && num * 2 <= den) {
      num *= 2;
      hz *= 2.0f;
    }
    while ((num & 1) == 0 && (den & 1) == 0) {
      num >>= 1;
      den >>= 1;
    }
    bool again = false;
    for (int c = first; c < count_; ++c) {
      if (cands_[c].num == num && cands_[c].den == den) {
        cands_[c].power = kit::min(1.0f, cands_[c].power + power);
        cands_[c].asked = kit::max(cands_[c].asked, kit::min(1.0f, w[i]));
        again = true;
      }
    }
    if (again) continue;
    Cand* c = ask(index, num, den, hz, power);
    if (!c) return;
    c->asked = kit::min(1.0f, w[i]);
    c->from = v.roots_from;
    c->depth = kit::max(0.4f, std::log2(static_cast<float>(den) / static_cast<float>(num)));
    c->velocity = v.gain;
  }
}

inline void DeepRoots::third(float hz, float weight, float top_octave, double from, float velocity) {
  using namespace deep_roots;
  const float floor_hz = param(kFloor), fit = param(kFit);
  if (!(hz > 4.0f)) return;
  // Reach: not further below the lower of the two keys.
  const float deepest = std::exp2(top_octave - param(kReach) - 0.3f);
  while (hz < floor_hz || hz < deepest) hz *= 2.0f;
  if (hz > 1400.0f) return;
  const float octave = std::log2(hz);
  float off;
  const float place = nearest_tone(octave, &off);
  const float near = within(off, param(kTolerance));
  // A bass that carries the chord comes first, one that fights it hardly at all.
  const float carries = kit::clamp(2.2f * bears(place) / best_bearing_ - 1.15f, 0.08f, 1.0f);
  weight *= 1.0f + (near * carries - 1.0f) * fit;
  weight /= 1.0f + (hz / 190.0f) * std::sqrt(hz / 190.0f);
  if (weight < 0.004f) return;
  const float goal_octave = octave + (place - octave) * fit;
  const float goal = std::exp2(goal_octave);
  for (int i = thirds_from_; i < count_; ++i) {
    Cand& c = cands_[i];
    if (std::fabs(c.goal_octave - goal_octave) < 0.01f) {
      if (weight > c.best) {
        c.best = weight;
        c.hz = hz;
      }
      c.power += weight;
      c.velocity = kit::max(c.velocity, velocity);
      return;
    }
  }
  if (count_ - thirds_from_ >= kMaxThirdCands) return;
  Cand* c = ask(-1, 1, 1, hz, weight);
  if (!c) return;
  c->goal_hz = goal;
  c->goal_octave = goal_octave;
  c->best = weight;
  c->from = from;
  c->depth = 1.4f + 0.8f * kit::max(0.0f, top_octave - goal_octave);
  c->velocity = velocity;
}

inline void DeepRoots::list_thirds() {
  using namespace deep_roots;
  thirds_from_ = count_;
  // Series: the plain difference first, then the tones that lie as far under
  // the lower key, then those twice as far; at the top these alone.
  const float at = param(kSeries) * 3.0f;
  const float plain = kit::clamp(3.0f - at, 0.0f, 1.0f), under = 0.7f * kit::clamp(at, 0.0f, 1.0f),
              twice = 0.7f * kit::clamp(at - 1.0f, 0.0f, 1.0f);
  if (held_count_ == 1) {
    // Nobody else is there: a fifth and a third above it that are not played.
    const Voice& v = pool_.voices[held_[0]];
    third(v.hz * 0.5f, 0.8f, v.octave, v.roots_from, v.gain);
    third(v.hz * 0.25f, 0.6f, v.octave, v.roots_from, v.gain);
    third(v.hz * 0.75f, 0.7f * under, v.octave, v.roots_from, v.gain);
    third(v.hz * 0.125f, 0.9f * twice, v.octave, v.roots_from, v.gain);
    thin_thirds();
    return;
  }
  for (int a = 0; a < held_count_; ++a) {
    for (int b = a + 1; b < held_count_; ++b) {
      const Voice& x = pool_.voices[held_[a]];
      const Voice& y = pool_.voices[held_[b]];
      const Voice& low = x.hz < y.hz ? x : y;
      const Voice& high = x.hz < y.hz ? y : x;
      const float w = std::sqrt(x.gain * y.gain);
      const double from = x.roots_from > y.roots_from ? x.roots_from : y.roots_from;
      const float d = high.hz - low.hz;
      if (d < 0.02f * low.hz) continue;
      third(d, plain * w, low.octave, from, w);
      third(low.hz - d, under * w, low.octave, from, w);
      third(std::fabs(low.hz - 2.0f * d), twice * w, low.octave, from, w);
    }
  }
  thin_thirds();
}

// Branching: the strongest first, the deeper ones before the others.
inline void DeepRoots::thin_thirds() {
  const float room = param(deep_roots::kBranching) * 7.0f;
  for (int i = thirds_from_; i < count_; ++i) {
    const float mine = cands_[i].power * (cands_[i].goal_hz < kMudHz ? 2.0f : 1.0f);
    int before = 0;
    for (int j = thirds_from_; j < count_; ++j) {
      const float other = cands_[j].power * (cands_[j].goal_hz < kMudHz ? 2.0f : 1.0f);
      if (other > mine || (other == mine && j < i)) ++before;
    }
    cands_[i].strength = kit::clamp(1.0f + room - static_cast<float>(before), 0.0f, 1.0f);
  }
  for (int i = thirds_from_; i < count_; ++i) cands_[i].power *= cands_[i].strength;
}

// Divisions of different keys that land together.
inline void DeepRoots::meet_stems(float pull, float tolerance) {
  float most = 0.0f;
  for (int i = 0; i < count_; ++i) {
    Cand& a = cands_[i];
    float met = 0.0f;
    for (int j = 0; j < count_; ++j) {
      const Cand& b = cands_[j];
      if (b.voice == a.voice) continue;
      const float cents = std::fabs(a.octave - b.octave) * 1200.0f;
      if (cents < 3.0f * tolerance) met += within(cents, tolerance) * b.asked;
    }
    a.met = met;
    most = kit::max(most, met * a.asked);
  }
  meeting_goal_ = kit::min(1.0f, most);
  for (int i = 0; i < count_; ++i) {
    Cand& a = cands_[i];
    const float met = kit::min(1.0f, a.met);
    // Where it goes: an octave of a held key, or the middle of those that met.
    float off;
    const float place = nearest_tone(a.octave, &off);
    const float draw = kit::min(1.0f, 2.0f * pull) * met;
    if (off < tolerance) {
      a.goal_hz = std::exp2(a.octave + (place - a.octave) * kit::max(draw, off < 4.0f ? 1.0f : 0.0f) * param(deep_roots::kFit));
    } else if (met > 0.0f) {
      float sum = a.asked, middle = a.asked * a.octave;
      for (int j = 0; j < count_; ++j) {
        const Cand& b = cands_[j];
        const float cents = std::fabs(a.octave - b.octave) * 1200.0f;
        if (b.voice == a.voice || cents > 3.0f * tolerance) continue;
        const float w = within(cents, tolerance) * b.asked;
        sum += w;
        middle += w * b.octave;
      }
      a.goal_hz = std::exp2(a.octave + (middle / sum - a.octave) * draw);
    }
    const float thin = pull * meeting_goal_ * (1.0f - met) * 0.97f;
    // What met sounds even where Branching would have passed it over.
    a.power = kit::max(a.power, kit::min(1.0f, 1.5f * pull) * met * a.asked);
    a.power *= (1.0f - thin) * (1.0f + pull * 0.9f * kit::min(2.0f, a.met)) *
               (1.0f - 0.8f * pull * meeting_goal_ * kit::clamp(a.octave - kLowOctave, 0.0f, 1.0f));
  }
}

inline void DeepRoots::plan() {
  using namespace deep_roots;
  count_ = held_count_ = 0;
  for (int v = 0; v < kMaxVoices; ++v) {
    const Voice& voice = pool_.voices[v];
    if (voice.on && !voice.released && !voice.pending && voice.fade_left == 0) held_[held_count_++] = v;
  }
  const float meeting = param(kMeeting), tolerance = param(kTolerance), fit = param(kFit);
  weigh_keys();
  for (int h = 0; h < held_count_; ++h) list_stems(held_[h], meeting < 0.0f);
  for (int i = 0; i < count_; ++i) cands_[i].goal_octave = cands_[i].octave;
  meeting_goal_ = 0.0f;
  if (meeting < 0.0f) {
    meet_stems(-meeting, tolerance);
  } else if (meeting > 0.0f && held_count_ > 0) {
    const int stems = count_;
    list_thirds();
    // What the third tones carry the stems give up.
    float most = 0.0f;
    for (int i = stems; i < count_; ++i) {
      Cand& c = cands_[i];
      const float s = kit::min(1.6f, std::sqrt(c.power * 1.8f));
      c.power = std::sqrt(meeting) * s * 1.4f;
      most = kit::max(most, s);
    }
    meeting_goal_ = kit::min(1.0f, most);
    for (int i = 0; i < stems; ++i) {
      Cand& c = cands_[i];
      float off;
      const float place = nearest_tone(c.octave, &off);
      const float stay = within(off, tolerance);
      if (off < tolerance) c.goal_hz = std::exp2(c.octave + (place - c.octave) * fit);
      c.power *= 1.0f - meeting * meeting * meeting_goal_ * (0.97f - 0.4f * stay * (1.0f - meeting * 0.7f));
    }
  }
  for (int i = 0; i < count_; ++i) cands_[i].goal_octave = std::log2(cands_[i].goal_hz);
  match();
  space(meeting < 0.0f);
  settle();
}

// Which roots that sound already are the ones asked for.
inline void DeepRoots::match() {
  for (int i = 0; i < kRoots; ++i) claimed_[i] = false;
  for (int i = 0; i < count_; ++i) {
    Cand& c = cands_[i];
    if (c.voice >= 0) {
      for (int s = 0; s < kStems; ++s) {
        const int slot = c.voice * kStems + s;
        const Root& r = roots_[slot];
        if (r.live && r.num == c.num && r.den == c.den) {
          c.slot = slot;
          claimed_[slot] = true;
        }
      }
      continue;
    }
    int best = -1;
    float nearest = 0.03f;
    for (int s = 0; s < kThirds; ++s) {
      const int slot = kMaxVoices * kStems + s;
      const Root& r = roots_[slot];
      if (!r.live || claimed_[slot]) continue;
      const float off = std::fabs(std::log2(r.goal_hz) - c.goal_octave);
      if (off < nearest) {
        nearest = off;
        best = slot;
      }
    }
    if (best >= 0) {
      c.slot = best;
      claimed_[best] = true;
    }
  }
}

inline bool DeepRoots::crowds(float a, float b) {
  const float low = a < b ? a : b, high = a < b ? b : a;
  return low < kMudHz && high < kFifth * low;
}

// Between 100 and 230 Hz close neighbours are thinned instead, the less the higher they lie.
inline float DeepRoots::beside(float a, float b) {
  const float low = a < b ? a : b, high = a < b ? b : a;
  if (low < kMudHz || low >= kCloseHz) return 1.0f;
  const float need = (kFifth - 1.0f) * (kCloseHz - low) * (1.0f / (kCloseHz - kMudHz));
  const float have = high / low - 1.0f;
  if (have >= need || have < 0.006f) return 1.0f;
  const float u = have / need;
  return 0.15f + 0.85f * u * u;
}

// Who keeps its place: the strongest first, nothing closer than a fifth
// below 100 Hz, two at one pitch become one.
inline void DeepRoots::space(bool shared) {
  int kept[kSounding];
  int kept_count = 0;
  for (int i = 0; i < count_; ++i) {
    Cand& c = cands_[i];
    const bool sounds = c.slot >= 0 && roots_[c.slot].goal_power > 0.0f;
    const float carry = 1.0f + (bears(c.goal_octave) / best_bearing_ - 0.85f) * param(deep_roots::kFit);
    c.strength = c.power * (sounds ? 1.3f : 1.0f) * (c.voice < 0 ? 1.15f : 1.0f) * (1.0f + 0.5f * kit::clamp(1.4f - c.goal_hz * 0.01f, 0.0f, 1.0f)) *
                 carry * carry;
    order_[i] = i;
  }
  for (int i = 1; i < count_; ++i) {
    const int x = order_[i];
    int j = i - 1;
    while (j >= 0 && cands_[order_[j]].strength < cands_[x].strength) {
      order_[j + 1] = order_[j];
      --j;
    }
    order_[j + 1] = x;
  }
  for (int i = 0; i < count_; ++i) {
    Cand& c = cands_[order_[i]];
    if (c.power < 0.02f) {
      c.power = 0.0f;
      continue;
    }
    bool room = kept_count < kSounding;
    float thinned = 1.0f;
    for (int h = 0; h < held_count_ && room; ++h) {
      const float key = pool_.voices[held_[h]].hz;
      if (crowds(c.goal_hz, key) && std::fabs(c.goal_octave - pool_.voices[held_[h]].octave) > 0.004f) {
        room = false;
        c.fast = true;
      } else {
        thinned = kit::min(thinned, beside(c.goal_hz, key));
      }
    }
    for (int k = 0; k < kept_count && room; ++k) {
      Cand& o = cands_[kept[k]];
      if (std::fabs(o.goal_octave - c.goal_octave) < 0.011f) {
        o.power = kit::min(1.7f, std::sqrt(o.power * o.power + c.power * c.power));
        // A root that has just come up is heard for a moment before it dissolves.
        const bool young = shared && c.voice >= 0 && c.goal_hz > kMudHz &&
                           (c.slot < 0 || roots_[c.slot].age < 1.0f + param(deep_roots::kGrowth));
        if (young && std::fabs(c.octave - c.goal_octave) > 0.001f) {
          c.power *= 0.7f;
        } else {
          c.power = 0.0f;
        }
        room = false;
        break;
      }
      if (crowds(c.goal_hz, o.goal_hz)) {
        room = false;
        c.fast = true;
      } else {
        thinned = kit::min(thinned, beside(c.goal_hz, o.goal_hz));
      }
    }
    if (room) {
      c.power *= thinned;
      kept[kept_count++] = order_[i];
    } else if (c.fast || kept_count >= kSounding) {
      c.power = 0.0f;
    }
  }
  // What is only dying away makes room at once.
  for (int s = 0; s < kRoots; ++s) {
    Root& r = roots_[s];
    if (!r.live || claimed_[s]) continue;
    for (int k = 0; k < kept_count; ++k) {
      if (!crowds(r.hz, cands_[kept[k]].goal_hz)) continue;
      r.fast = true;
      r.goal_power = 0.0f;
    }
  }
}

inline void DeepRoots::settle() {
  using namespace deep_roots;
  const Soil& soil = kSoilTable[soil_now_];
  for (int s = 0; s < kRoots; ++s) {
    if (!roots_[s].live || claimed_[s]) continue;
    const int owner = roots_[s].owner;
    // The roots of a key that is let go fade with it; everything else nobody
    // asks for fades by itself.
    if (owner < 0 || !pool_.voices[owner].released) roots_[s].goal_power = 0.0f;
  }
  for (int i = 0; i < count_; ++i) {
    Cand& c = cands_[order_[i]];
    if (c.slot >= 0) {
      Root& r = roots_[c.slot];
      r.goal_power = c.power;
      r.goal_hz = c.goal_hz;
      r.velocity_goal = c.velocity;
      r.fast = c.fast;
      continue;
    }
    if (c.power <= 0.0f) continue;
    const int from = c.voice >= 0 ? c.voice * kStems : kMaxVoices * kStems;
    const int many = c.voice >= 0 ? kStems : kThirds;
    for (int s = from; s < from + many; ++s) {
      if (roots_[s].live) continue;
      birth(roots_[s], c.voice, c, soil);
      break;
    }
  }
}

// Another leaf or soil: what sounds closes, changes, and opens again.
inline void DeepRoots::switch_choices() {
  using namespace deep_roots;
  const int leaf = choice(kLeaf, kLeaves), soil = choice(kSoil, kSoils);
  if (leaf != leaf_now_) {
    if (leaf_open_ <= 0.0f) {
      leaf_now_ = leaf;
      for (Voice& v : pool_.voices) {
        if (!v.on) continue;
        shape_leaf(v, kLeafTable[leaf]);
        for (int k = 0; k < kLeafPartials; ++k) {
          v.base[k] = v.goal[k];
          v.ring[k] = 1.0f;
          v.noise[k] = 0.0f;
        }
      }
    } else {
      leaf_open_ = kit::max(0.0f, leaf_open_ - open_step_);
    }
  } else if (leaf_open_ < 1.0f) {
    leaf_open_ = kit::min(1.0f, leaf_open_ + open_step_);
  }
  if (soil != soil_now_) {
    if (soil_open_ <= 0.0f) {
      soil_now_ = soil;
      for (Root& r : roots_) {
        if (!r.live || !r.up) continue;
        shape_root(r, kSoilTable[soil]);
        for (int k = 0; k < kLane; ++k) {
          r.base[k] = r.goal[k];
          r.ring[k] = 1.0f;
          r.noise[k] = 0.0f;
        }
      }
    } else {
      soil_open_ = kit::max(0.0f, soil_open_ - open_step_);
    }
  } else if (soil_open_ < 1.0f) {
    soil_open_ = kit::min(1.0f, soil_open_ + open_step_);
  }
}

}  // namespace livemix
