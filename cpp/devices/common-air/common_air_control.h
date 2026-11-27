#pragma once

// Common Air, the control clock: breath, reeds and what they do to each other.
// Included by common_air.h.

namespace livemix {

// A place in the turn, never below 0 and never 1: what the sine table takes.
inline float CommonAir::wrapped(float turns) {
  turns -= std::floor(turns);
  return turns < 1.0f ? turns : 0.0f;
}

// A number between 0 and 1 for a key in a breath.
inline float CommonAir::draw(float place, uint32_t breath) {
  kit::Rng rng;
  rng.seed(0x51ED270Bu + breath * 2654435761u + static_cast<uint32_t>(place * 65536.0f) * 40503u);
  rng.next_u32();
  rng.next_u32();
  return rng.uniform();
}

inline void CommonAir::apply(int id) {
  using namespace common_air;
  const float value = param(id);
  const bool p = primed();
  switch (id) {
    case kBite: bite_.set(value, p); break;
    case kBody: body_.set(value, p); break;
    case kVowel: vowel_.set(value, p); break;
    case kCup: cup_.set(value, p); break;
    case kBeat: beat_.set(value, p); break;
    case kStarve: starve_.set(value, p); break;
    case kShare: share_.set(value, p); break;
    case kLock: lock_.set(value, p); break;
    case kSag: sag_.set(value, p); break;
    case kLeak: leak_.set(value, p); break;
    case kChiff: chiff_.set(value, p); break;
    case kSpread: spread_.set(value, p); break;
    case kSecond: second_.set(value, p); break;
    case kVolume: volume_.set(kit::db_to_gain(value), p); break;
    default: break;  // read where they are used
  }
}

// The second reed's interval, true: semitones as small whole-number ratios.
inline float CommonAir::interval() const {
  static constexpr float kTrue[12] = {1.0f,        16.0f / 15.0f, 9.0f / 8.0f, 6.0f / 5.0f, 5.0f / 4.0f, 4.0f / 3.0f,
                                      45.0f / 32.0f, 3.0f / 2.0f, 8.0f / 5.0f, 5.0f / 3.0f, 9.0f / 5.0f, 15.0f / 8.0f};
  const int steps = kit::clamp_int(static_cast<int>(std::floor(param(common_air::kInterval) + 0.5f)) + 12, 0, 36);
  static constexpr float kOctave[4] = {0.5f, 1.0f, 2.0f, 4.0f};
  return kTrue[steps % 12] * kOctave[steps / 12];
}

inline int CommonAir::mode() const {
  return kit::clamp_int(static_cast<int>(param(common_air::kBreath) + 0.5f), 0, 4);
}

// Out of silence every control stands where it was last put.
inline void CommonAir::snap_controls() {
  using namespace common_air;
  for (kit::Smoother* smoother : list_) smoother->snap(smoother->target);
  volume_.snap(volume_.target);
  const ReedShape& reed = reed_shapes()[kit::clamp_int(static_cast<int>(param(kReed) + 0.5f), 0, 3)];
  for (int i = 0; i < ReedShape::kFields; ++i) shape_[i] = reed.field(i);
  pipe_choice_ = kit::clamp_int(static_cast<int>(param(kPipe) + 0.5f), 0, 3);
  pipe_fade_ = 1.0f;
  pipe_wet_ = wetness();
  pipe_hold_ = held_back();
  pipe_wet_step_ = pipe_hold_step_ = 0.0f;
  depth_ = share_.value * kDepth;
  pipe_wet_to_ = pipe_wet_;
  pipe_hold_to_ = pipe_hold_;
  depth_to_ = depth_;
  piped_ = pipe_wet_ > 0.0f;
  depth_step_ = 0.0f;
  wayness_ = 1.0f;
  round_ = mode() == Breath::kCircular ? 1.0f : 0.0f;
  cup_at_ = cup_to_ = hand();
  cup_step_ = 0.0f;
}

// How much of the sound goes by way of the pipe.
inline float CommonAir::wetness() const {
  const float dry = 1.0f - body_.value;
  return 1.0f - dry * dry;
}

// How much of it comes back from the pipe's end.
inline float CommonAir::held_back() const {
  return common_air::pipe_shapes()[pipe_choice_].hold * (0.3f + 0.7f * body_.value * std::sqrt(body_.value));
}

// How much of the sound is spoken through the hands.
inline float CommonAir::hand() const {
  const float open = 1.0f - cup_.value;
  return 1.0f - open * std::sqrt(std::sqrt(open));
}

// How loud each harmonic of a lane is let out by its pipe, to an ear: what the
// level is evened by.
inline void CommonAir::listen(int k) {
  Lane& lane = lane_[k];
  const float hz = pool_.voices[k & (kVoices - 1)].hz * lane.ratio;
  const float sr = sample_rate();
  for (int n = 0; n < kHarmonics; ++n) {
    const float at = hz * static_cast<float>(n + 1);
    if (at > 0.45f * sr) {
      lane.heard[n] = 0.0f;
      continue;
    }
    float re, im;
    pipe_[k].response(at, pipe_hold_, sr, &re, &im);
    re = 1.0f + pipe_wet_ * (re - 1.0f);
    im *= pipe_wet_;
    const float f2 = at * at;
    const float ear = f2 / (f2 + 140.0f * 140.0f) * (1.0f + 1.6f * f2 / (f2 + 1500.0f * 1500.0f));
    lane.heard[n] = (re * re + im * im) * ear;
  }
}

inline float CommonAir::touch_of(float gain) { return (0.14f + 0.86f * gain) * kit::min(1.0f, 12.0f * gain); }

inline void CommonAir::fit_pipes(int v) {
  for (int k = v; k < kLanes; k += kVoices) {
    pipe_[k].clear();
    pipe_[k].fit(common_air::pipe_shapes()[pipe_choice_ < 0 ? 0 : pipe_choice_],
                 kit::min(pool_.voices[v].hz * lane_[k].ratio, 0.2f * sample_rate()), sample_rate());
    listen(k);
  }
}

inline void CommonAir::start(int v, float hz, float gain) {
  Voice& voice = pool_.voices[v];
  voice.sounding = true;
  voice.down = true;
  voice.pending = false;
  voice.hz = hz;
  voice.gain = gain;
  voice.gate = 1.0f;
  voice.fade = 0.0f;
  voice.bar = 0.0f;
  voice.strike = 0.0f;
  voice.bar_at = 0.0f;
  voice.age = 0.0f;
  voice.glow = 0.0f;
  voice.peak = 1.0f;
  voice.swing = 0.5f;
  voice.rank = -1.0f;  // set by the next control tick
  const float key = 12.0f * std::log2(hz * (1.0f / 440.0f)) + 120.0f;
  const float place = key * 0.6180340f;
  voice.hash = place - std::floor(place);
  // A key on a pitch that sounds already is another reed, not the same one twice.
  int alike = 0;
  for (int o = 0; o < kVoices; ++o) {
    if (o != v && pool_.voices[o].sounding && std::fabs(pool_.voices[o].hz - hz) < 1.0e-3f * hz) alike |= 1 << o;
  }
  const float other = alike != 0 ? draw(0.19f * static_cast<float>(v), 77u) : 0.0f;
  voice.bar_phase = other;
  for (int which = 0; which < 2; ++which) {
    const int k = v + which * kVoices;
    Lane& lane = lane_[k];
    lane = Lane();
    lane.ratio = which == 0 ? 1.0f : interval();
    const float own = key * 0.3819660f + 0.37f * static_cast<float>(which) + other;
    lane.own = own - std::floor(own);
    lane.phase = lane.own;
    lane.swing = 0.03f;
    lane.level = which == 0 ? 1.0f : second_.value;
    // A key that is pressed has its small volume full: it speaks at once.
    lane.air = kit::max(0.62f, kit::min(1.0f, breath_.pressure));
    lane.white.seed(0x7A31C0DEu + 0x9E3779B9u * static_cast<uint32_t>(k) + static_cast<uint32_t>(key * 64.0f));
    lane.drift.seed(0x31F0A5u + 7919u * static_cast<uint32_t>(k) + static_cast<uint32_t>(key * 16.0f));
    lane.drift.set_rate(0.17f, sample_rate());
    bank_.clear(k);
  }
  fit_pipes(v);
  tongue(voice);
  // The stretch before the next control tick has these lanes in it, silent.
  keys_ = kit::max(keys_, (v + 4) & ~3);
  seconds_ = seconds_ || lane_[v + kVoices].level > 0.0f;
}

// A key is tongued: a puff, a push that has the reed swinging at once, a tap
// on its bar.
inline void CommonAir::tongue(Voice& voice) {
  voice.puff = 1.0f;
  voice.strike += voice.gain * (0.1f + 0.9f * param(common_air::kChiff));
}

// The pairs of keys near enough to a small whole-number ratio to lean on each
// other.
inline void CommonAir::find_pairs() {
  static constexpr float kP[13] = {1, 6, 5, 4, 3, 8, 5, 2, 12, 5, 3, 4, 6};
  static constexpr float kQ[13] = {1, 5, 4, 3, 2, 5, 3, 1, 5, 2, 1, 1, 1};
  pairs_ = 0;
  for (int i = 0; i < kVoices; ++i) {
    const Voice& low = pool_.voices[i];
    if (!low.down) continue;
    for (int j = 0; j < kVoices; ++j) {
      const Voice& high = pool_.voices[j];
      if (i == j || !high.down || high.hz < low.hz || (high.hz == low.hz && j < i)) continue;
      const float cents = 1200.0f * std::log2(high.hz / low.hz);
      for (int n = 0; n < 13; ++n) {
        const float off = cents - 1200.0f * std::log2(kP[n] / kQ[n]);
        if (off > 35.0f || off < -35.0f || pairs_ >= kMaxPairs) continue;
        Pair& pair = pair_[pairs_++];
        pair = Pair();
        pair.a = i;
        pair.b = j;
        pair.p = kP[n];
        pair.q = kQ[n];
        pair.weight = kit::min(1.0f, 1.6f / (1.0f + 0.175f * (kP[n] + kQ[n])));
        break;
      }
    }
  }
}

inline void CommonAir::control_breath() {
  using namespace common_air;
  float sum = 0.0f;
  for (int k = 0; k < kLanes; ++k) {
    const Voice& voice = pool_.voices[k & (kVoices - 1)];
    if (!voice.sounding || !voice.down) continue;
    sum += lane_[k].swing * lane_[k].swing * lane_[k].level * (k < kVoices ? 1.0f : 0.4f);
  }
  // A lung that feeds many gives each a little less.
  full_ += (1.0f / (1.0f + 0.05f * kit::max(0.0f, sum - 4.0f)) - full_) * (1.0f - std::exp(-dt_ / 0.05f));
  const float share = share_.value;
  const float want = 1.0f + (0.06f + 0.3f * share) * kit::max(0.0f, sum - 1.0f);
  demand_ += (want - demand_) * (1.0f - std::exp(-dt_ / 0.15f));
  breath_.tick(mode(), dt_, param(kLung), turn_, demand_);
  dip_ += (dip_target_ - dip_) * (1.0f - std::exp(-dt_ / 0.02f));
  dip_target_ = flush_denormal(dip_target_ * std::exp(-dt_ / 0.3f));
  dip_ = flush_denormal(dip_);
  const float crowd = 1.0f / (1.0f + 0.5f * share * (demand_ - 1.0f));
  // A lone key takes air from nobody.
  const float alone = kit::clamp(sum - 0.8f, 0.0f, 1.0f);
  root_now_ = breath_.pressure * crowd * (1.0f - share * dip_ * alone);
  // Who breathes in a circle is always drawing air through the nose.
  round_ += ((mode() == Breath::kCircular ? 1.0f : 0.0f) - round_) * (1.0f - std::exp(-dt_ / 0.2f));
  const float way = static_cast<float>(breath_.way);
  wayness_ += (way - wayness_) * (1.0f - std::exp(-dt_ / (0.03f + 0.2f * turn_)));
}

inline void CommonAir::control_lock() {
  const float dt = dt_;
  for (int v = 0; v < kVoices; ++v) lane_[v].want = lane_[v].lean_want = 0.0f;
  const float reach = kLockCents * lock_.value;
  const float gather = 1.0f - std::exp(-dt / 0.25f);
  float stood = 0.0f, weight = 0.0f;
  float glow[kVoices] = {}, all_of[kVoices] = {};
  for (int n = 0; n < pairs_; ++n) {
    Pair& pair = pair_[n];
    const Voice& va = pool_.voices[pair.a];
    const Voice& vb = pool_.voices[pair.b];
    if (!va.down || !vb.down || va.rank < 0.0f || vb.rank < 0.0f) continue;
    Lane& a = lane_[pair.a];
    Lane& b = lane_[pair.b];
    const float turns = wrapped(pair.p * (a.phase - a.own) - pair.q * (b.phase - b.own));
    const float sine = kit::SineTable::lookup(turns);
    const float together = kit::min(va.age, vb.age) * (1.0f / kLeanSeconds);
    const float pull = reach * pair.weight * kit::min(1.0f, together) * kit::min(a.air, b.air) * sine;
    const float all = a.swing + b.swing + 0.05f;
    a.want -= 2.0f * pull * b.swing / all;
    b.want += 2.0f * pull * a.swing / all;
    const float cosine = kit::SineTable::cos_lookup(turns);
    const float swung = pair.weight * kit::min(1.0f, together) * kit::min(a.air, b.air) * cosine;
    a.lean_want += swung;
    b.lean_want += swung;
    pair.re += (cosine - pair.re) * gather;
    pair.im += (sine - pair.im) * gather;
    const float step = pair.weight * std::sqrt(pair.re * pair.re + pair.im * pair.im) * kit::min(1.0f, together);
    stood += step;
    weight += pair.weight;
    glow[pair.a] += step;
    glow[pair.b] += step;
    all_of[pair.a] += pair.weight;
    all_of[pair.b] += pair.weight;
  }
  in_step_ = weight > 0.0f ? stood / weight : 0.0f;
  const float follow = 1.0f - std::exp(-dt / 0.008f);
  const float swing_with = 1.0f - std::exp(-dt / 0.03f);
  for (int v = 0; v < kVoices; ++v) {
    Voice& voice = pool_.voices[v];
    const float bright = all_of[v] > 0.0f ? glow[v] / all_of[v] : 0.0f;
    voice.glow = flush_denormal(voice.glow + (bright * bright - voice.glow) * gather);
    Lane& lane = lane_[v];
    lane.pull = flush_denormal(lane.pull + (kit::clamp(lane.want, -45.0f, 45.0f) - lane.pull) * follow);
    const float most = all_of[v] > 0.0f ? kit::clamp(lane.lean_want / all_of[v], -1.0f, 1.0f) : 0.0f;
    lane.lean = flush_denormal(lane.lean + (most - lane.lean) * swing_with);
    lane_[v + kVoices].lean = lane.lean;
    // A second reed leans with its first.
    lane_[v + kVoices].pull = lane.pull;
  }
}

// The hands: three formants between oo, oh, ah, eh and ee.
inline void CommonAir::control_hands() {
  static constexpr float kF1[5] = {330.0f, 480.0f, 760.0f, 560.0f, 320.0f};
  static constexpr float kF2[5] = {700.0f, 860.0f, 1220.0f, 1800.0f, 2300.0f};
  static constexpr float kG1[5] = {1.7f, 1.8f, 1.8f, 1.7f, 1.5f};
  static constexpr float kG2[5] = {0.4f, 1.1f, 2.2f, 2.2f, 2.2f};
  static constexpr float kG3[5] = {0.02f, 0.06f, 0.4f, 0.65f, 0.8f};
  const float open = kit::clamp(vowel_.value + 0.22f * (root_now_ - 0.7f), 0.0f, 1.0f);
  vowel_at_ = open;
  const float at = 4.0f * open;
  const int n = kit::clamp_int(static_cast<int>(at), 0, 3);
  const float t = at - static_cast<float>(n);
  const float sr = sample_rate();
  for (int side = 0; side < 2; ++side) {
    const float off = side == 0 ? 0.985f : 1.015f;
    formant_[side][0].set(off * kit::lerp(kF1[n], kF1[n + 1], t), 4.0f, sr);
    formant_[side][1].set(off * kit::lerp(kF2[n], kF2[n + 1], t), 6.0f, sr);
    formant_[side][2].set(off * 2800.0f, 6.0f, sr);
  }
  formant_gain_[0] = kit::lerp(kG1[n], kG1[n + 1], t);
  formant_gain_[1] = kit::lerp(kG2[n], kG2[n + 1], t);
  formant_gain_[2] = kit::lerp(kG3[n], kG3[n + 1], t);
  cup_at_ = cup_to_;
  cup_to_ = hand();
  cup_step_ = (cup_to_ - cup_at_) / static_cast<float>(period_);
}

inline void CommonAir::control() {
  using namespace common_air;
  for (kit::Smoother* smoother : list_) smoother->next();
  const ReedShape& reed = reed_shapes()[kit::clamp_int(static_cast<int>(param(kReed) + 0.5f), 0, 3)];
  const float morph = 1.0f - std::exp(-dt_ / 0.03f);
  for (int i = 0; i < ReedShape::kFields; ++i) shape_[i] += (reed.field(i) - shape_[i]) * morph;

  // A change of pipe goes by way of no pipe.
  const int choice = kit::clamp_int(static_cast<int>(param(kPipe) + 0.5f), 0, 3);
  if (choice != pipe_choice_) {
    pipe_fade_ -= dt_ * 40.0f;
    if (pipe_fade_ <= 0.0f && pipe_wet_ < 1.0e-4f) {
      pipe_choice_ = choice;
      for (int v = 0; v < kVoices; ++v) {
        if (pool_.voices[v].sounding) fit_pipes(v);
      }
    }
  } else {
    pipe_fade_ += dt_ * 40.0f;
  }
  pipe_fade_ = kit::clamp(pipe_fade_, 0.0f, 1.0f);
  const float steps = 1.0f / static_cast<float>(period_);
  const float wet = wetness() * pipe_fade_;
  const float hold = held_back();
  // Where the last stretch was going is where this one starts, to the bit.
  pipe_wet_ = pipe_wet_to_;
  pipe_hold_ = pipe_hold_to_;
  depth_ = depth_to_;
  pipe_wet_to_ = wet;
  pipe_hold_to_ = hold;
  depth_to_ = share_.value * kDepth;
  pipe_wet_step_ = (pipe_wet_to_ - pipe_wet_) * steps;
  pipe_hold_step_ = (pipe_hold_to_ - pipe_hold_) * steps;
  depth_step_ = (depth_to_ - depth_) * steps;
  const bool piped = pipe_wet_ > 0.0f || pipe_wet_to_ > 0.0f;
  if (piped && !piped_) {  // what was left in the pipes is of another time
    for (int k = 0; k < kLanes; ++k) {
      if (pool_.voices[k & (kVoices - 1)].sounding) pipe_[k].clear();
    }
  }
  piped_ = piped;

  // One key's pipes are listened to each tick, four while the pipe changes.
  for (int n = pipe_fade_ < 1.0f ? 4 : 1; n > 0; --n) {
    listening_ = (listening_ + 1) & (kVoices - 1);
    if (!pool_.voices[listening_].sounding) continue;
    listen(listening_);
    if (lane_[listening_ + kVoices].level > 0.0f) listen(listening_ + kVoices);
  }
  for (int n = 0; n < kHarmonics; ++n) {
    comb_[n] = 1.0f + shape_[1] * shape_[1] +
               2.0f * shape_[1] * kit::SineTable::cos_lookup(shape_[0] * static_cast<float>(n + 1));
  }

  leak_curve_ = leak_.value;
  // A turn is never longer than the breath it belongs to can bear, and a reed
  // is not slower than the breath that swings it.
  const bool round = mode() == Breath::kCircular;
  turn_ = param(kTurn) / (1.0f + param(kTurn) / (2.5f * param(kLung)));
  attack_ = param(kAttack);
  if (!round) attack_ /= 1.0f + attack_ / ((mode() == Breath::kOnce ? 0.25f : 0.8f) * param(kLung));
  gate_fall_ = std::exp(-kSixtyDb * dt_ / (param(kRelease) * shape_[13]));
  gate_rise_ = 1.0f - std::exp(-dt_ / 0.006f);
  {
    // Down from the middle to nearly round; up from it sharper. The round body
    // goes as the bite comes.
    const float bite = bite_.value;
    const float down = kit::max(0.0f, (kMiddleBite - bite) / kMiddleBite);
    const float up = kit::max(0.0f, (bite - kMiddleBite) / (1.0f - kMiddleBite));
    body_now_ = shape_[2] * (1.0f - 0.85f * up) + 0.3f * down;
    bite_curve_ = bite > kMiddleBite ? std::exp2((kMiddleBite - bite) * 4.0f)
                                     : std::pow(1.25f / kit::min(1.25f, shape_[3]), down);
  }
  swing_fall_ = 1.0f - std::exp(-dt_ / (0.02f + (mode() == Breath::kOnce ? 0.0f : 0.1f * turn_)));
  // Two reeds are no louder than one.
  const float beside = 1.2f * second_.value;
  touch_first_ = 1.0f / std::sqrt(1.0f + 0.7f * beside * beside);
  touch_second_ = beside * touch_first_ / kit::max(0.001f, second_.value);

  control_breath();
  control_lock();
  control_hands();

  // Places of the keys that are down, low to high, 0 to 1.
  int down = 0;
  for (const Voice& voice : pool_.voices) down += voice.down ? 1 : 0;
  const float slide = 1.0f - std::exp(-dt_ / 0.12f);
  company_ += ((down > 1 ? 1.0f : 0.0f) - company_) * slide;
  for (int v = 0; v < kVoices; ++v) {
    Voice& voice = pool_.voices[v];
    if (!voice.down) continue;
    int under = 0;
    for (int o = 0; o < kVoices; ++o) {
      const Voice& other = pool_.voices[o];
      if (o != v && other.down && (other.hz < voice.hz || (other.hz == voice.hz && o < v))) ++under;
    }
    const float rank = down > 1 ? static_cast<float>(under) / static_cast<float>(down - 1) : 0.0f;
    const float want = down > 1 ? (starve_.value >= 0.0f ? rank : 1.0f - rank) : 0.0f;
    voice.rank = voice.rank < 0.0f ? want : voice.rank + (want - voice.rank) * slide;
  }
  if (breath_.count != breath_seen_) {
    breath_seen_ = breath_.count;
    for (Voice& voice : pool_.voices) {
      if (!voice.down || voice.fade < 1.0f) continue;
      voice.strike += 0.3f * voice.gain * chiff_.value;
      voice.puff = kit::max(voice.puff, 0.7f);
    }
  }
  for (int v = 0; v < kVoices; ++v) {
    if (pool_.voices[v].sounding) control_voice(v, root_now_);
  }
  keys_ = 0;
  seconds_ = false;
  for (int v = 0; v < kVoices; ++v) {
    if (!pool_.voices[v].sounding) continue;
    keys_ = v + 1;
    seconds_ = seconds_ || lane_[v + kVoices].level > 0.0f;
  }
  keys_ = (keys_ + 3) & ~3;
}

inline void CommonAir::control_voice(int v, float root) {
  using namespace common_air;
  Voice& voice = pool_.voices[v];
  if (voice.pending || (!voice.down && voice.gate <= 0.0f)) {
    voice.fade -= dt_ / kFadeSeconds;
    if (voice.fade <= 0.0f) {
      // The ramps have landed on nothing when fade was already at zero.
      const bool landed = voice.fade <= -dt_ / kFadeSeconds;
      voice.fade = kit::max(voice.fade, -2.0f * dt_ / kFadeSeconds);
      if (landed && voice.pending) {
        start(v, voice.next_hz, voice.next_gain);
        find_pairs();
      } else if (landed && voice.peak < 1.0e-7f) {
        voice.sounding = false;
        voice.fade = 0.0f;
        for (int k = v; k < kLanes; k += kVoices) {
          bank_.clear(k);
          lane_[k].gl = lane_[k].gr = lane_[k].noise = 0.0f;
          lane_[k].dl = lane_[k].dr = lane_[k].dnoise = 0.0f;
          lane_[k].level = 0.0f;
        }
        return;
      }
    }
  } else if (voice.fade < 1.0f) {
    voice.fade = kit::min(1.0f, voice.fade + dt_ / kFadeSeconds);
  }
  if (voice.down) {
    voice.gate += (1.0f - voice.gate) * gate_rise_;
  } else if (!voice.pending) {
    voice.gate *= gate_fall_;
    if (voice.gate < kFloor) voice.gate = 0.0f;
  }
  voice.puff *= std::exp(-dt_ / (0.05f + 4.0f / kit::max(40.0f, voice.hz)));
  voice.puff = settle_to_zero(voice.puff);
  // The tap goes into the bar over two milliseconds.
  const float into = voice.strike * (1.0f - std::exp(-dt_ / 0.002f));
  voice.strike = settle_to_zero(voice.strike - into);
  voice.bar = kit::min(1.5f, voice.bar * std::exp(-dt_ / (1.1f * std::sqrt(220.0f / voice.hz))) + into);
  voice.bar = settle_to_zero(voice.bar);

  // Breath: no rumble under the note and no hiss far over it, one level.
  const float top = kit::min(9000.0f, shape_[10] * (2200.0f + 3.0f * voice.hz));
  const float white = std::exp(-kit::kTwoPi * top / sample_rate());
  voice.noise_low = 1.0f - white;
  voice.noise_slow = 1.0f - std::exp(-kit::kTwoPi * kit::min(0.5f * top, kit::max(160.0f, 0.9f * voice.hz)) / sample_rate());
  const float c2 = voice.noise_low * voice.noise_low, w2 = white * white, n2 = 1.0f - w2;
  voice.noise_norm = std::sqrt(3.0f * n2 * n2 * n2 / (c2 * c2 * (1.0f + w2)));

  Lane& first = lane_[v];
  const bool open = voice.down && first.swing > 0.3f;
  voice.age = open ? voice.age + dt_ : voice.age * std::exp(-dt_ / 0.08f);
  voice.age = kit::min(voice.age, 100.0f);
  control_lane(v, 0, root);
  if (second_.value > 0.0f || lane_[v + kVoices].level > 0.0f) control_lane(v, 1, root);
  voice.swing = first.swing;
  voice.peak *= 0.5f;
}

inline void CommonAir::control_lane(int v, int which, float root) {
  using namespace common_air;
  const int k = v + which * kVoices;
  Voice& voice = pool_.voices[v];
  Lane& lane = lane_[k];
  const float steps = 1.0f / static_cast<float>(period_);
  const float sr = sample_rate();

  // A second reed changes its interval where it is silent.
  if (which == 1) {
    const float ratio = interval();
    const bool right = lane.ratio == ratio;
    const float aim = right ? second_.value : 0.0f;
    lane.level += kit::clamp(aim - lane.level, -40.0f * dt_, 40.0f * dt_);
    if (!right && lane.level <= 0.0f) {
      lane.ratio = ratio;
      lane.phase = lane.own;
      pipe_[k].clear();
      pipe_[k].fit(pipe_shapes()[pipe_choice_], kit::min(voice.hz * lane.ratio, 0.2f * sr), sr);
      listen(k);
    }
  }

  // Order: by place, against the place on the way in, and drawn anew for
  // every breath.
  const float starve = std::fabs(starve_.value);
  const float scatter = draw(voice.hash + 0.31f * static_cast<float>(which), breath_.count);
  const float way_in = 0.5f - 0.5f * wayness_;
  float rank = kit::max(0.0f, voice.rank);
  rank = kit::lerp(rank, 1.0f - rank, way_in);
  rank = kit::lerp(rank, scatter, 0.3f);
  const bool round = mode() == Breath::kCircular;
  if (round) {
    // Nothing turns: the air goes round the keys instead.
    const float wave = 0.5f - 0.5f * kit::SineTable::cos_lookup(breath_.cheek + 1.0f - kit::max(0.0f, voice.rank) * 0.8f);
    rank = wave * wave * (3.0f - 2.0f * wave);
  }
  rank *= company_;
  if (which == 1) rank = kit::min(1.0f, rank + 0.25f * company_);

  // The small air volume fills late where the place is late, and empties into
  // the reed quicker than it fills.
  const float turn = turn_;
  const float late = (round ? starve * (1.9f - 0.9f * starve) : starve) * rank;
  float seconds = 0.02f;
  if (root > lane.air) {
    seconds = 0.012f + turn * (0.05f + 1.6f * late);
  } else if (breath_.parted) {
    seconds += turn * (0.16f + (0.3f + 0.45f * starve) * (1.0f - rank));
  }
  lane.air = flush_denormal(lane.air + (root - lane.air) * (1.0f - std::exp(-dt_ / seconds)));

  // A key let go keeps the breath it had: the gate is what closes.
  const float under = shape_[11] + late * (round ? 0.94f : 0.7f * (0.5f + 0.5f * starve));
  const float lift = kit::clamp((lane.air - under) / (1.0f - kit::min(under, 0.7f)), 0.0f, 1.2f);
  const float push = chiff_.value * voice.puff * voice.gate;
  const float aim = kit::max(std::pow(lift, shape_[12]), 0.6f * push * lane.air);
  if (aim > lane.swing) {
    const float build = (lane.swing < 0.35f * push ? kit::min(attack_, 0.012f) : attack_) * (1.0f + 4.0f * late);
    const float grow = kit::min(kSwingTime / build, 3.0f * kit::max(60.0f, voice.hz));
    lane.swing += (lane.swing + 0.02f) * (aim - lane.swing) * kit::min(0.8f, grow * dt_);
  } else {
    lane.swing += (aim - lane.swing) * swing_fall_;
  }
  lane.swing = settle_to_zero(lane.swing);

  // Pitch: true, plus what thin air, the scoop, the others and chance do.
  const float thin = 1.0f - kit::min(1.0f, lane.air);
  const float bend = thin * std::sqrt(thin) * (0.35f + 1.3f * voice.hash) * shape_[7];
  const float chance = lane.white.bipolar();
  lane.rough += (chance * shape_[5] * 8.0f - lane.rough) * 0.12f;
  lane.rough = flush_denormal(lane.rough);
  // Two lags of about six a second.
  lane.flap_near = flush_denormal(lane.flap_near + (chance - lane.flap_near) * flap_coeff_);
  lane.flap = flush_denormal(lane.flap + (lane.flap_near - lane.flap) * flap_coeff_);
  const float flap = kit::clamp(1.0f + 9.0f * shape_[9] * lane.flap, 0.25f, 1.6f);
  const float cents = -kit::min(140.0f, sag_.value * bend) - 40.0f * chiff_.value * voice.puff + lane.pull +
                      lane.rough + 0.7f * lane.drift.next(period_);
  float hz = voice.hz * lane.ratio * kit::cents_to_ratio(cents);
  if (which == 1) hz += beat_.value;
  hz = kit::min(hz, 0.3f * sr);
  lane.hz = hz;
  const float step = hz / sr;
  lane.phase += step * static_cast<float>(period_);
  lane.phase -= std::floor(lane.phase);
  bank_.dc[k] = kit::SineTable::cos_lookup(step);
  bank_.ds[k] = kit::SineTable::lookup(step);
  const float behind = wrapped(lane.phase - step * static_cast<float>(period_));
  bank_.c[k] = kit::SineTable::cos_lookup(behind);
  bank_.s[k] = kit::SineTable::lookup(behind);
  bank_.cg[k] = kit::SineTable::cos_lookup(shape_[0]);
  bank_.sg[k] = kit::SineTable::lookup(shape_[0]);
  bank_.back[k] = shape_[1];
  bank_.body[k] = body_now_;

  // Brightness follows the air, the swing and the hand.
  const float strength = kit::min(1.1f, lane.swing * (0.45f + 0.55f * lane.air)) * std::sqrt(voice.gate);
  const float steep = shape_[3] * bite_curve_ * std::pow(hz * (1.0f / 220.0f), 0.42f) *
                      std::exp2((0.65f - voice.gain) * 2.4f - 1.3f * way_in - 1.0f * round_ - 2.8f * lock_.value * voice.glow -
                                1.5f * chiff_.value * voice.puff);
  const float most = kBandDecay * hz / kit::min(14000.0f, 0.42f * sr);
  const float dull = (1.2f + 0.035f * sag_.value * shape_[7]) * (1.0f - kit::min(1.0f, strength));
  const float slope = kit::clamp(steep * (1.0f + dull), most, 4.5f);
  const float r = std::exp(-slope);
  float power = 0.0f, bare = 0.0f;
  float fall = r;
  for (int n = 0; n < kHarmonics; ++n) {
    const float part = fall * fall * comb_[n];
    power += part * lane.heard[n];
    bare += part;
    fall *= r;
  }
  const float added = body_now_ * (body_now_ + 2.0f * r * (1.0f + shape_[1] * bank_.cg[k]));
  // A pipe that lets nearly nothing out is not made up for in full.
  power = 0.5f * (power + added * lane.heard[0] + 0.05f * (bare + added));
  const float touch = touch_of(voice.gain);
  const float high = 1.0f / (1.0f + voice.hz * voice.hz * (1.0f / (2600.0f * 2600.0f)));
  const float loud = kVoiceGain * full_ * touch * (0.85f + 0.15f * high) * voice.gate * kit::max(0.0f, voice.fade) *
                     (which == 1 ? lane.level * touch_second_ * (1.0f + 0.5f * way_in)
                                 : touch_first_ * (1.0f - 0.55f * second_.value * way_in));
  // Breath against tone: what one has the other has not.
  const float airy = 2.6f * leak_curve_ * shape_[6] * pipe_shapes()[pipe_choice_].air * (1.0f + round_ * (1.2f + 1.5f * breath_.sniff));
  const float trade = 1.0f / std::sqrt(1.0f + airy * airy);
  const float leaning = 1.0f + 0.7f * lock_.value * (lane.lean - 0.4f);
  const float level = loud * lane.swing * (0.5f + 0.5f * kit::min(1.0f, lane.air)) * shape_[8] * leaning * trade;
  const float g = flap * level / std::sqrt(power + 1.0e-6f);
  bank_.dr[k] = (r - bank_.r[k]) * steps;
  if (g < 1.0e-9f && bank_.g[k] < 1.0e-9f) {
    bank_.g[k] = bank_.dg[k] = 0.0f;
  } else {
    bank_.dg[k] = (g - bank_.g[k]) * steps;
  }
  bank_.qc[k] = 1.0f - std::exp(-kit::kTwoPi * (500.0f - 340.0f * rank) / sr);
  bank_.q[k] = flush_denormal(bank_.q[k]);

  const float tongued = 1.5f * chiff_.value * voice.puff * (0.3f + 0.7f * voice.gain) * (0.4f + 0.6f * trade);
  const float breathing = airy * trade * kit::min(1.0f, lane.air) * (0.25f + 0.75f * kit::min(1.0f, lane.swing));
  const float noise = 1.7f * loud * (breathing + tongued * pipe_shapes()[pipe_choice_].air) * voice.noise_norm;
  if (noise < 1.0e-9f && lane.noise < 1.0e-9f) {
    lane.noise = lane.dnoise = 0.0f;
  } else {
    lane.dnoise = (noise - lane.noise) * steps;
  }

  const float side = (which == 0) == (voice.hash < 0.5f) ? -1.0f : 1.0f;
  const float width = pipe_shapes()[pipe_choice_].width;
  const float apart = spread_.value * std::sqrt(std::sqrt(spread_.value));
  const float pan = kit::min(1.0f, apart * width * (0.45f + 0.55f * std::fabs(2.0f * voice.hash - 1.0f))) * side;
  float left, right;
  kit::pan_gains(pan, &left, &right);
  if (voice.pending) {  // what rings in the pipe is faded as well
    left *= kit::max(0.0f, voice.fade);
    right *= kit::max(0.0f, voice.fade);
  }
  if (voice.fade <= dt_ / kFadeSeconds * 1.5f && !voice.pending) {
    lane.gl = left;
    lane.gr = right;
  }
  lane.dl = (left - lane.gl) * steps;
  lane.dr = (right - lane.gr) * steps;
}

}  // namespace livemix
