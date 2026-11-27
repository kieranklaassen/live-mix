#pragma once

// Deep Roots: a chord's own bass. Each key sends roots down below itself.
//
//   key ─► leaf (the note itself, faint) ────────────────────────────┐
//     └─► divisions of the key: 1/2, 1/3, 1/4 … (Series, Reach,      │
//         Branching), each up in its turn (Growth, Stagger) ─┐       ├─► Volume
//   pairs of keys ─► third tones: f2 - f1 and 2 f1 - f2 ─────┤       │     │
//                                                            ▼       │     ▼
//        the law, every 10 ms: who meets, where, how strongly │      │  soft clip
//          Meeting to the left: divisions of different keys   │      │
//            that land together share one root                │      │
//          Meeting to the right: third tones, drawn by Fit    │      │
//            to the nearest tone of the chord                 │      │
//                                                             ▼      │
//        roots: eight partials each, coloured by Soil ───────────────┘
//
// - Everything is a rotating partial: a bank of eight (kLane) turns with
//   recurrences at audio rate, its frequencies and levels are set on a clock of
//   32 samples and ramped. A root starts on its key's own phase times num/den
//   and turns at that ratio, so it stays locked while nothing draws it away.
// - Meeting. The law gives each root a strength. What meets is drawn onto one
//   pitch over about a second (the beat between two keys' roots slows as they
//   close), one of them carries on stronger, the others dissolve into it and
//   what met nobody thins, all the more the further Meeting is from its middle.
//   Tolerance is how far from its place a root may lie and still be drawn. With
//   Fit at the top the place is an octave of a key that is held, so the bass is
//   in tune with the chord.
// - Thirds of a lone key are made with two partners nobody plays, a fifth and a
//   third above it. What bears() a chord best becomes its bass.
// - Below 100 Hz nothing stands closer than a fifth to anything else: the
//   stronger keeps its place, the other is let go (space()). A division that
//   would fall under Floor is folded up by octaves, as far as the key itself.
// - More notes get less room each: a law of how many sound, which knows nothing
//   of touch, sway, decay or grain, so all of those are heard in full. Behind it
//   a cap that the fullest hands reach keeps the sum under the knee.

#include "../../kit/kit.h"
#include "bank.h"
#include "leaf_and_soil.h"
#include "params.gen.h"

namespace livemix {

class DeepRoots : public kit::DeviceBase<deep_roots::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kStems = 5;    // roots of one key
  static constexpr int kThirds = 8;   // third tones of the whole chord
  static constexpr int kRoots = kMaxVoices * kStems + kThirds;
  static constexpr int kSounding = 36;  // roots that may sound at once
  static constexpr int kTick = deep_roots::kTick;
  static constexpr float kPlanSeconds = 0.01f;  // the law looks again this often
  static constexpr int kLane = deep_roots::kLane;
  using Bank = deep_roots::Bank;

  void init(float sample_rate) {
    using namespace deep_roots;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    dt_ = static_cast<float>(kTick) / sr;
    turn_ = kit::kTwoPi / sr;
    top_hz_ = kit::min(kTopHz, 0.25f * sr);
    noise_scale_ = std::sqrt(sr / 48000.0f);
    pool_.reset();
    for (Voice& voice : pool_.voices) voice = Voice();
    for (Root& root : roots_) root = Root();
    births_ = 0;
    arrivals_ = 0;
    volume_.set_time(kSmoothingSeconds, sr);
    follow_ = 1.0f - std::exp(-dt_ / kFollowSeconds);
    steal_ticks_ = static_cast<int>(kStealSeconds / dt_) + 1;
    plan_ticks_ = kit::max(1, static_cast<int>(kPlanSeconds / dt_ + 0.5f));
    push_fall_ = std::exp(-dt_ * static_cast<float>(plan_ticks_) / 0.138f);
    load_up_ = 1.0f - std::exp(-dt_ / 0.004f);
    load_down_ = 1.0f - std::exp(-dt_ / 0.5f);
    leaf_now_ = soil_now_ = 0;
    leaf_open_ = soil_open_ = 1.0f;
    open_step_ = kit::min(1.0f, dt_ / 0.012f);
    for (int k = 0; k < kNoises; ++k) {
      const float c = 1.0f - std::exp(-kit::kTwoPi * kNoiseHz[k] * dt_);
      noise_c_[k] = c;
      noise_gain_[k] = std::sqrt((2.0f - c) / c) * 1.7320508f;
    }
    idle_.reset(sr, 0.05f);
    left_ = 0;
    until_plan_ = 0;
    clock_ = 0.0;
    deepest_ = meeting_ = level_seen_ = 0.0f;
    sounding_ = 0;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    snap();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency) || !(gain == gain)) return;
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Out of silence the clock starts on this sample and every knob is where
    // it was last put.
    if (!alive()) {
      left_ = 0;
      clock_ = 0.0;
      snap();
    }
    until_plan_ = 0;
    // One id, one held voice: whatever the id already plays is let go.
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& own = pool_.voices[v];
      if (pool_.note_id_of(v) != note_id || !own.on) continue;
      if (own.pending) {
        own.next_hz = frequency;
        own.next_gain = gain;
        return;
      }
      if (!own.released) {
        own.released = true;
        own.quick = true;
      }
    }
    bool stolen = false;
    const int index = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[index];
    if (stolen) {
      voice.next_hz = frequency;
      voice.next_gain = gain;
      voice.pending = true;
      if (voice.fade_left == 0) voice.fade_left = steal_ticks_;
      return;
    }
    start(index, frequency, gain);
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      voice.pending = false;  // only the fade is left
      voice.released = true;
      voice.quick = true;
    } else {
      voice.released = true;
      voice.quick = false;
    }
    until_plan_ = 0;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(alive())) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (left_ == 0) {
        tick();
        left_ = kTick;
      }
      const int count = frames - done < left_ ? frames - done : left_;
      render(done, count);
      left_ -= count;
      done += count;
    }
    const float peak = output_peak(frames);
    level_seen_ = peak;
    idle_.settle(peak, frames);
  }

  // Root `slot`'s pitch and what it is heading for, for the harness; false when it is silent.
  bool root_at(int slot, float* hz, float* goal_hz, float* power) const {
    if (slot < 0 || slot >= kRoots) return false;
    const Root& r = roots_[slot];
    if (!r.live || !r.up || r.power * r.fall < 0.01f) return false;
    *hz = r.hz;
    *goal_hz = r.goal_hz;
    *power = r.power * r.fall;
    return true;
  }

  // The deepest root that sounds (Hz), how far the chord has met (0 to 1), how
  // many roots sound, and the level of the last block.
  float meter(int index) const {
    if (idle_.asleep() || index < 0 || index > 3) return 0.0f;
    const float shown[4] = {deepest_, meeting_, static_cast<float>(sounding_), level_seen_};
    return shown[index];
  }

 private:
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kTopHz = 11000.0f;       // no partial above this
  static constexpr float kLeafTopHz = 8500.0f;
  static constexpr float kFollowSeconds = 0.012f;  // levels and knobs
  static constexpr float kStealSeconds = 0.005f;
  static constexpr float kQuickSeconds = 0.06f;    // 60 dB of a key struck again
  static constexpr float kOff = 1.0e-5f;
  static constexpr float kHit = 0.004f;            // how fast a strike lands
  static constexpr float kRootGain = 0.130f;
  static constexpr float kLeafGain = 0.250f;
  static constexpr float kRootRoom = 3.0f;   // the load at which the roots of one key and of ten come near
  static constexpr float kLeafRoom = 1.6f;
  static constexpr float kCap = 0.80f;         // what all of it together may come to
  static constexpr float kHeldForever = 40.0f;     // Decay's top: no decay at all
  static constexpr float kFifth = 1.485f;          // nothing closer than this under
  static constexpr float kMudHz = 100.0f;
  static constexpr float kCloseHz = 230.0f;        // and up to here close neighbours are thinned
  static constexpr float kLowOctave = 6.9f;        // the bass ends here, 120 Hz
  static constexpr float kPulsePeak = 0.1f;
  static constexpr int kNoises = 3;
  static constexpr float kNoiseHz[kNoises] = {26.0f, 70.0f, 420.0f};  // half width of a noise partial

  struct Voice {
    bool on = false;
    bool released = false;
    bool quick = false;   // a key struck again goes in kQuickSeconds
    bool pending = false;
    int fade_left = 0;
    float next_hz = 220.0f, next_gain = 0.7f;
    float hz = 220.0f, gain = 0.7f, octave = 0.0f;
    double cycles = 0.0;    // of the key's first partial, where this tick starts
    double roots_from = 0.0;  // the clock at which its roots begin
    float age = 0.0f;
    float rise = 0.0f;      // 0 to 1 over Attack
    float rel = 1.0f;       // falls once the key is up
    float side = 0.0f;
    Bank leaf[2];
    float base[deep_roots::kLeafPartials] = {};   // level, smoothed
    float ring[deep_roots::kLeafPartials] = {};
    float noise[deep_roots::kLeafPartials] = {};
    float want_l[deep_roots::kLeafPartials] = {}, want_r[deep_roots::kLeafPartials] = {};
    float goal[deep_roots::kLeafPartials] = {};   // level the base goes to
    float w[deep_roots::kLeafPartials] = {};
    float ring_c[deep_roots::kLeafPartials] = {};
    float sum = 1.0f;       // amplitudes against the level
    kit::Drift sway_a, sway_b;
    float lean = 0.0f, swell = 1.0f, swell_now = 1.0f;
    float rel_root = 1.0f, fade = 1.0f;
    bool ending = false;    // silent after this tick
    kit::Rng rng;
    kit::Svf air, air_right;
    float air_gain = 0.0f, air_step = 0.0f, air_want = 0.0f, air_landed = 0.0f;
    float air_l = 0.7f, air_r = 0.7f, air_wide = 0.0f;

    bool active() const { return on; }
    bool releasing() const { return released && !pending; }
    float level() const { return pending ? next_gain : rel * gain; }
  };

  struct Root {
    bool live = false;
    int owner = -1;         // the key it hangs from; -1 is a third tone
    int num = 1, den = 2;   // its ratio to that key
    float hz = 55.0f, goal_hz = 55.0f;
    float power = 0.0f, goal_power = 0.0f;  // what the law gives it
    float strength = 0.0f;
    float wait = 0.0f;      // seconds until it comes up
    float grow = 0.0f, grow_step = 1.0f;
    float age = 0.0f;
    float velocity = 0.7f;
    float life = 1.0f;      // what Decay has left of it
    float fall = 1.0f;      // a third tone nobody asks for any more falls
    float velocity_goal = 0.7f;
    float home = 0.0f;      // its place between the speakers
    bool up = false, dying = false, fast = false;
    float base[kLane] = {}, goal[kLane] = {}, ring[kLane] = {}, ring_c[kLane] = {}, noise[kLane] = {};
    float want_l[kLane] = {}, want_r[kLane] = {}, side[kLane] = {}, push[kLane] = {};
    float sum = 1.0f;
    float hit = 0.0f;
    float pulse = 0.0f;
    float grain = 0.0f, grain_goal = 0.0f, grain_fall = 1.0f;
    kit::Drift sway_a, sway_b, throb;
    float lean = 0.0f, swell = 1.0f, swell_goal = 1.0f, bend = 0.0f;
    kit::Rng rng;
    Bank bank;
  };

  // One root the law asks for.
  struct Cand {
    int voice, num, den;
    float hz, goal_hz, octave, goal_octave, power, strength, asked, met, best, depth, velocity;
    double from;  // the clock at which its key may begin
    int slot;
    bool fast;
  };
  static constexpr float kOctaves[17] = {0.0f,       0.0f,       1.0f,       1.5849625f, 2.0f,       2.3219281f,
                                         2.5849625f, 2.8073549f, 3.0f,       3.1699250f, 3.3219281f, 3.4594316f,
                                         3.5849625f, 3.7004397f, 3.8073549f, 3.9068906f, 4.0f};
  // How well a bass carries a key that lies so many semitones over it, octaves apart.
  static constexpr float kBears[12] = {1.0f, 0.0f, 0.15f, 0.2f, 0.35f, 0.0f, 0.0f, 0.5f, 0.0f, 0.1f, 0.2f, 0.0f};
  static constexpr int kMaxThirdCands = 40;
  static constexpr int kMaxCands = kMaxVoices * deep_roots::kDivisions + kMaxThirdCands;

  // --- state ------------------------------------------------------------------------------

  bool alive() const {
    for (const Voice& voice : pool_.voices) {
      if (voice.on) return true;
    }
    for (const Root& root : roots_) {
      if (root.live) return true;
    }
    return false;
  }

  void apply(int id) {
    if (id == deep_roots::kVolume) volume_.set(kit::db_to_gain(param(id)), primed());
    until_plan_ = 0;
  }

  int choice(int id, int count) const {
    return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1);
  }

  // The knobs that are read on every tick glide there.
  enum Glide : int { kGLeaf = 0, kGRoot, kGWidth, kGGrain, kGSway, kGPulse, kGPulseDepth, kGliders };

  void glide_goals(float* to) const {
    using namespace deep_roots;
    const float b = param(kBalance);
    const float leaf = kit::min(1.0f, 2.0f - 2.0f * b), root = kit::min(1.0f, 2.0f * b);
    to[kGLeaf] = leaf * std::sqrt(leaf);
    to[kGRoot] = root * std::sqrt(root);
    to[kGWidth] = std::pow(param(kWidth), 1.35f);
    to[kGGrain] = param(kGrain);
    to[kGSway] = param(kSway);
    to[kGPulse] = 0.25f * std::exp2(5.0f * param(kPulse));
    const float d = kit::clamp(param(kPulse) * 16.0f, 0.0f, 1.0f);
    to[kGPulseDepth] = d * d * (3.0f - 2.0f * d) * (0.86f + 0.14f * param(kPulse));
  }

  void snap() {
    glide_goals(knob_);
    volume_.snap(volume_.target);
    leaf_load_ = root_load_ = 0.0f;
    leaf_now_ = choice(deep_roots::kLeaf, deep_roots::kLeaves);
    soil_now_ = choice(deep_roots::kSoil, deep_roots::kSoils);
    leaf_open_ = soil_open_ = 1.0f;
    until_plan_ = 0;
  }

  void start(int index, float hz, float gain) {
    using namespace deep_roots;
    Voice& v = pool_.voices[index];
    kill_roots(index);
    const uint32_t n = ++arrivals_;
    v = Voice();
    v.on = true;
    v.hz = hz;
    v.octave = std::log2(hz);
    v.gain = gain;
    static constexpr float kSides[6] = {0.0f, -0.75f, 0.7f, -0.35f, 0.4f, -1.0f};
    v.side = kSides[n % 6];
    // A key waits for the others that are held, and for no other.
    v.roots_from = clock_;
    for (int i = 0; i < kMaxVoices; ++i) {
      const Voice& other = pool_.voices[i];
      if (i == index || !other.on || other.released || other.pending) continue;
      const double from = other.roots_from + static_cast<double>(param(kStagger));
      if (param(kStagger) > 0.0f && from > v.roots_from) v.roots_from = from;
    }
    v.rng.seed(0x9E3779B9u * (n & 1023u) + 0x51ED270Bu);
    v.sway_a.seed(v.rng.next_u32());
    v.sway_b.seed(v.rng.next_u32());
    v.sway_a.set_rate(0.19f + 0.07f * v.rng.uniform(), sample_rate());
    v.sway_b.set_rate(0.28f + 0.09f * v.rng.uniform(), sample_rate());
    const Leaf& leaf = kLeafTable[leaf_now_];
    v.cycles = 0.618 * (n & 1023u);
    for (int k = 0; k < kLeafPartials; ++k) {
      v.leaf[k / kLane].begin(k % kLane, 0.137 * k + v.cycles);
      v.ring[k] = 1.0f;
      v.noise[k] = 0.0f;
    }
    shape_leaf(v, leaf);
    for (int k = 0; k < kLeafPartials; ++k) v.base[k] = v.goal[k];
  }

  void kill_roots(int index) {
    for (int i = 0; i < kStems; ++i) roots_[index * kStems + i].live = false;
  }

  // --- the colour of a key and of a root ----------------------------------------------------

  static float fade_out(float f, float top) { return kit::clamp((top - f) / (0.3f * top), 0.0f, 1.0f); }

  // Octaves over the first partial, counting less the higher they lie.
  static float steep(float ratio) {
    const float octaves = std::log2(ratio);
    return octaves / (1.0f + 0.11f * octaves);
  }

  void shape_leaf(Voice& v, const deep_roots::Leaf& leaf) {
    using namespace deep_roots;
    const float tone = param(kLeafTone);
    const float tilt = (tone < 0.5f ? (0.5f - tone) * 3.4f * leaf.dark : (0.5f - tone) * 3.2f) +
                       (0.7f - v.gain) * 1.2f + v.lean;
    float power = 0.0f, sum = 0.0f;
    for (int k = 0; k < kLeafPartials; ++k) {
      const float f = v.hz * leaf.ratio[k] + leaf.beat[k];
      float a = leaf.level[k];
      if (a > 0.0f) {
        a *= std::exp2(-tilt * steep(leaf.ratio[k])) * leaf.body.at(f) * (k == 0 ? 1.0f : fade_out(f, kit::min(kLeafTopHz, top_hz_)));
        power += a * a;
        sum += a;
      }
      v.goal[k] = a;
      v.w[k] = turn_ * kit::min(f, top_hz_);
      const float ring = leaf.ring[k] * kit::clamp(std::sqrt(260.0f / v.hz), 0.35f, 1.8f) * (0.6f + 0.8f * tone);
      v.ring_c[k] = leaf.ring[k] > 0.0f ? std::exp(-6.9f * dt_ / kit::max(0.02f, ring)) : 1.0f;
    }
    const float g = leaf.trim / std::sqrt(kit::max(power, 1.0e-6f));
    for (int k = 0; k < kLeafPartials; ++k) v.goal[k] *= g;
    // Partials do not all crest at once: what a bound has to count is less than their sum.
    v.sum = 0.35f * leaf.trim + 0.65f * sum * g;
    const float air_hz = kit::clamp(v.hz * 6.0f, 1200.0f, 4200.0f);
    v.air.set(air_hz, 0.8f, sample_rate());
    v.air_right.set(air_hz, 0.8f, sample_rate());
  }

  void shape_root(Root& r, const deep_roots::Soil& soil) {
    using namespace deep_roots;
    const float tone = param(kRootTone);
    const float tilt = (tone < 0.5f ? (0.5f - tone) * 3.8f : (0.5f - tone) * 3.0f) + (0.7f - r.velocity) * 1.1f + r.lean;
    float power = 0.0f, sum = 0.0f;
    const float width = knob_[kGWidth];
    // Decay is also how long what is struck in the soil rings.
    const float hold = (tone * 0.8f + 0.6f) * std::sqrt(param(kDecay) * (1.0f / 16.0f));
    for (int k = 0; k < kLane; ++k) {
      const float f = r.hz * soil.ratio[k];
      float a = soil.level[k] * std::exp2(-tilt * steep(soil.ratio[k])) * soil.body.at(f);
      // The very lowest partials are felt and not heard: their harmonics carry them.
      if (f < 60.0f) a *= 0.45f + 0.55f * kit::clamp((f - 24.0f) / 36.0f, 0.0f, 1.0f);
      if (k > 0) a *= fade_out(f, kit::min(soil.top, top_hz_));
      a *= 1.0f + r.push[k];
      r.goal[k] = a;
      power += a * a;
      sum += a;
      const float ring = soil.ring[k] * kit::clamp(std::sqrt(150.0f / r.hz), 0.3f, 1.9f) * hold;
      r.ring_c[k] = soil.ring[k] > 0.0f ? std::exp(-6.9f * dt_ / kit::max(0.02f, ring)) : 1.0f;
      // Low partials stand in the middle, higher ones fan out.
      const float open = width * soil.fan * kit::clamp(std::log2(f / 90.0f) * 0.6f, 0.0f, 1.0f);
      r.side[k] = kit::clamp(open * (0.6f * r.home + ((k & 1) ? -0.6f : 0.6f)), -1.0f, 1.0f);
    }
    const float g = soil.trim / std::sqrt(kit::max(power, 1.0e-6f));
    for (int k = 0; k < kLane; ++k) r.goal[k] *= g;
    r.sum = 0.35f * soil.trim + 0.65f * sum * g;
  }

  // A root comes up: its phase is the key's own, divided.
  void birth(Root& r, int owner, const Cand& c, const deep_roots::Soil& soil) {
    using namespace deep_roots;
    const uint32_t n = ++births_;
    r = Root();
    r.live = true;
    r.owner = owner;
    r.num = c.num;
    r.den = c.den;
    r.hz = owner < 0 ? c.goal_hz : c.hz;
    r.goal_hz = c.goal_hz;
    r.goal_power = c.power;
    r.power = c.power;
    r.velocity = r.velocity_goal = c.velocity;
    r.rng.seed(0x9E3779B9u * (n & 4095u) + 0x2468ACE1u);
    r.sway_a.seed(r.rng.next_u32());
    r.sway_b.seed(r.rng.next_u32());
    r.sway_a.set_rate(0.16f + 0.10f * r.rng.uniform(), sample_rate());
    r.sway_b.set_rate(0.26f + 0.11f * r.rng.uniform(), sample_rate());
    r.throb.seed(r.rng.next_u32());
    r.throb.set_rate(0.7f + 0.5f * r.rng.uniform(), sample_rate());
    static constexpr float kHomes[7] = {0.0f, 0.8f, -0.8f, 0.45f, -0.45f, 1.0f, -1.0f};
    r.home = kHomes[n % 7];
    const float growth = param(kGrowth);
    const float wait = static_cast<float>(c.from - clock_) + growth * c.depth;
    r.wait = kit::max(0.0f, wait);
    r.grow_step = dt_ / (soil.quick + 0.8f * growth * soil.rise + 0.7f * param(kAttack));
    r.up = false;
    r.pulse = kPulsePeak;
  }

  // The end of its wait.
  void sprout(Root& r) {
    const deep_roots::Soil& soil = deep_roots::kSoilTable[soil_now_];
    r.up = true;
    double cycles = 0.6180339887 * (births_ & 1023u);
    if (r.owner >= 0) {
      cycles = pool_.voices[r.owner].cycles * r.num / r.den;
    } else {
      // A bass that stands octaves under a key stands in its phase too: the two never cancel.
      const float octave = std::log2(r.goal_hz);
      for (int h = 0; h < held_count_; ++h) {
        const Voice& v = pool_.voices[held_[h]];
        const float d = octave - v.octave, whole = std::floor(d + 0.5f);
        if (std::fabs(d - whole) > 0.0005f) continue;
        cycles = v.cycles * static_cast<double>(std::exp2(whole));
        break;
      }
    }
    shape_root(r, soil);
    for (int k = 0; k < kLane; ++k) {
      r.bank.begin(k, cycles * static_cast<double>(soil.ratio[k]));
      r.base[k] = r.goal[k];
      r.ring[k] = 1.0f;
    }
  }

  // --- the law (law.h) ---------------------------------------------------------------------

  float nearest_tone(float octave, float* off) const;
  float bears(float octave) const;
  void weigh_keys();
  static float within(float cents, float tolerance);
  Cand* ask(int voice, int num, int den, float hz, float power);
  void list_stems(int index, bool all);
  void third(float hz, float weight, float top_octave, double from, float velocity);
  void thin_thirds();
  void list_thirds();
  void meet_stems(float pull, float tolerance);
  void plan();
  void match();
  static bool crowds(float a, float b);
  static float beside(float a, float b);
  void space(bool shared);
  void settle();

  // --- the clock ----------------------------------------------------------------------------

  void tick() {
    using namespace deep_roots;
    float to[kGliders];
    glide_goals(to);
    for (int i = 0; i < kGliders; ++i) knob_[i] = settle_to_zero(knob_[i] + follow_ * (to[i] - knob_[i]));
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.on || !voice.ending) continue;
      const bool next = voice.pending;
      const float hz = voice.next_hz, gain = voice.next_gain;
      kill_roots(v);
      voice = Voice();
      if (next) start(v, hz, gain);
      until_plan_ = 0;
    }
    const bool slow = until_plan_ <= 0;
    if (slow) {
      plan();
      until_plan_ = plan_ticks_;
    }
    --until_plan_;

    const float release = param(kRelease);
    switch_choices();
    const Leaf& leaf = kLeafTable[leaf_now_];
    const Soil& soil = kSoilTable[soil_now_];
    const float rel_leaf = std::exp(-6.9f * dt_ / release);
    const float rel_root = std::exp(-6.9f * dt_ / (release * soil.release));
    const float rel_quick = std::exp(-6.9f * dt_ / kQuickSeconds);
    meeting_ = silent(meeting_ + (meeting_goal_ - meeting_) * follow_);

    // Two passes: what everything would like to be, then how much of it fits.
    float leaf_power = 0.0f, root_power = 0.0f;
    load_ = 0.0f;
    for (Voice& voice : pool_.voices) {
      if (!voice.on) continue;
      const float a = voice_tick(voice, leaf, slow, rel_leaf, rel_root, rel_quick);
      leaf_power += a * a;
    }
    leaf_load_ = follow_load(leaf_load_);
    load_ = 0.0f;
    const float growth = param(kGrowth);
    pace_.up = 1.0f - std::exp(-dt_ / kit::clamp(0.03f + 0.4f * growth, 0.03f, 1.2f));
    pace_.down = 1.0f - std::exp(-dt_ / kit::clamp(0.06f + 0.6f * growth, 0.06f, 0.6f));
    // What nobody asks for while keys are held goes sooner than what rings after the last of them.
    pace_.gone = held_count_ > 0 ? std::exp(-6.9f * dt_ / kit::clamp(release * soil.release, 0.1f, 2.5f)) : rel_root;
    pace_.fast = 1.0f - std::exp(-dt_ / 0.018f);
    pace_.glide = 1.0f - std::exp(-dt_ / 0.35f);
    pace_.life = std::exp(-6.9f * dt_ * kit::max(0.0f, 1.0f / param(kDecay) - 1.0f / kHeldForever + (leaf.life > 0.0f ? 1.0f / leaf.life : 0.0f)));
    pace_.hit = 1.0f - std::exp(-dt_ / kHit);
    sounding_ = 0;
    float deepest = 1.0e9f;
    for (Root& root : roots_) {
      if (!root.live) continue;
      const float a = root_tick(root, soil, slow);
      root_power += a * a;
      if (root.live && root.up && a > 0.004f) {
        ++sounding_;
        deepest = kit::min(deepest, root.hz);
      }
    }
    deepest_ = sounding_ > 0 ? deepest : 0.0f;

    root_load_ = follow_load(root_load_);
    const float leaf_law = room(leaf_load_, kLeafRoom), root_law = room(root_load_, kRootRoom);
    // One cap for both, so that a full hand does not turn the leaf against the roots.
    const float u = 2.0f / (kCap * kCap) * (leaf_power * leaf_law + root_power * root_law) + 1.0e-12f;
    const float capped = 1.0f / std::sqrt(std::sqrt(1.0f + u * u));
    const float leaf_scale = std::sqrt(leaf_law) * capped * leaf_open_;
    const float root_scale = std::sqrt(root_law) * capped * soil_open_;
    for (Voice& voice : pool_.voices) {
      if (!voice.on) continue;
      for (int k = 0; k < kLeafPartials; ++k) {
        voice.want_l[k] *= leaf_scale;
        voice.want_r[k] *= leaf_scale;
      }
      voice.leaf[0].ramp(voice.want_l, voice.want_r);
      voice.leaf[1].ramp(voice.want_l + kLane, voice.want_r + kLane);
      voice.air_landed = voice.air_want * leaf_scale;
      voice.air_step = (voice.air_landed - voice.air_gain) * (1.0f / kTick);
    }
    for (Root& root : roots_) {
      if (!root.live || !root.up) continue;
      for (int k = 0; k < kLane; ++k) {
        root.want_l[k] *= root_scale;
        root.want_r[k] *= root_scale;
      }
      root.bank.ramp(root.want_l, root.want_r);
      if (root.dying && root.bank.quiet) root.live = false;
    }
    for (Voice& voice : pool_.voices) voice.cycles += static_cast<double>(voice.hz) * dt_;
    clock_ += dt_;
  }

  float follow_load(float load) const {
    return settle_to_zero(load + (load_ > load ? load_up_ : load_down_) * (load_ - load));
  }
  // How much room there is for each, as power.
  static float room(float load, float shared) { return 1.0f / (1.0f + load / (shared * shared)); }

  void switch_choices();

  float voice_tick(Voice& v, const deep_roots::Leaf& leaf, bool slow, float rel_leaf, float rel_root, float rel_quick) {
    using namespace deep_roots;
    v.leaf[0].land(v.want_l, v.want_r);
    v.leaf[1].land(v.want_l + kLane, v.want_r + kLane);
    v.air_gain = v.air_landed;
    if (slow) {
      v.lean = knob_[kGSway] * 2.8f * v.sway_b.next(kTick * plan_ticks_);
      v.swell = kit::max(0.05f, 1.0f + (knob_[kGSway] * 1.4f + leaf.breath) * v.sway_a.next(kTick * plan_ticks_));
      shape_leaf(v, leaf);
    }
    if (v.released) {
      v.rel *= v.quick ? rel_quick : rel_leaf;
      v.rel_root *= v.quick ? rel_quick : rel_root;
      if (v.rel < kOff) v.rel = 0.0f;
      if (v.rel_root < kOff) v.rel_root = 0.0f;
      if (v.rel == 0.0f && v.rel_root == 0.0f && !v.pending) v.ending = true;
    } else {
      v.rise = kit::min(1.0f, v.rise + dt_ / kit::max(0.0015f, param(kAttack) * leaf.attack));
    }
    v.fade = 1.0f;
    if (v.fade_left > 0) {
      --v.fade_left;
      v.fade = static_cast<float>(v.fade_left) / static_cast<float>(steal_ticks_);
      if (v.fade_left == 0) v.ending = true;
    }
    if (v.ending) v.fade = 0.0f;
    const float open = v.rise * v.rise * (3.0f - 2.0f * v.rise);
    v.swell_now += follow_ * (v.swell - v.swell_now);
    const float there = open * v.rel * v.fade;
    load_ += there * there + 1.0e-15f;
    const float amp = silent(kLeafGain * knob_[kGLeaf] * std::pow(v.gain, 1.4f) * there * v.swell_now);
    float level_sum = 0.0f;
    const float spread = kit::min(1.0f, knob_[kGWidth] * (0.5f + 0.5f * leaf.fan));
    const float pan = kit::clamp(v.side * spread * 1.15f, -1.0f, 1.0f);
    for (int k = 0; k < kLeafPartials; ++k) {
      v.base[k] = silent(v.base[k] + follow_ * (v.goal[k] - v.base[k]));
      v.ring[k] *= v.ring_c[k];
      float a = v.base[k] * (leaf.ring[k] > 0.0f ? leaf.hold[k] + (1.0f - leaf.hold[k]) * v.ring[k] : 1.0f);
      level_sum += a;
      if (leaf.noise[k] > 0.0f && a > 1.0e-6f) {
        const int band = k == 0 ? 0 : (k < 4 ? 1 : 2);
        v.noise[k] += noise_c_[band] * (v.rng.bipolar() - v.noise[k]);
        a *= 1.0f - leaf.noise[k] + leaf.noise[k] * noise_gain_[band] * v.noise[k];
      }
      a *= amp;
      const float p = kit::clamp(pan + ((k & 1) ? 0.3f : -0.3f) * leaf.fan * knob_[kGWidth], -1.0f, 1.0f);
      v.want_l[k] = a * (0.7071f - 0.35f * p - 0.06f * p * p);
      v.want_r[k] = a * (0.7071f + 0.35f * p - 0.06f * p * p);
    }
    for (float& x : v.ring) x = silent(x);
    v.air_want = leaf.air * amp * 0.5f * (0.4f + 1.2f * param(kLeafTone)) * noise_scale_;
    v.air_wide = spread;
    v.air_l = 0.7071f - 0.35f * pan;
    v.air_r = 0.7071f + 0.35f * pan;
    v.leaf[0].aim(v.w);
    v.leaf[1].aim(v.w + kLane);
    return amp * (0.4f * v.sum + 0.6f * level_sum);
  }

  // The shape of one pulse: up in a tenth of it, then falling.
  static float pulse_shape(float p) {
    if (p < kPulsePeak) {
      const float u = p / kPulsePeak;
      return u * u * (3.0f - 2.0f * u);
    }
    const float u = 1.0f - (p - kPulsePeak) / (1.0f - kPulsePeak);
    return u * u * (0.35f + 0.65f * u);
  }

  // Nothing that is multiplied on into a level shrinks past where it can be heard.
  static float silent(float x) { return x > -1.0e-9f && x < 1.0e-9f ? 0.0f : x; }
  static float touch(float velocity) { return 0.08f + 0.92f * velocity * std::sqrt(velocity); }

  float root_tick(Root& r, const deep_roots::Soil& soil, bool slow) {
    using namespace deep_roots;
    r.bank.land(r.want_l, r.want_r);
    if (!r.up) {
      if (r.goal_power <= 0.0f || (r.owner >= 0 && pool_.voices[r.owner].released)) {
        r.live = false;
        return 0.0f;
      }
      r.wait -= dt_;
      if (r.wait > 0.0f) return 0.0f;
      r.power = r.goal_power;
      r.hz = r.owner >= 0 ? pool_.voices[r.owner].hz * r.num / r.den : r.hz;
      sprout(r);
    }
    float owner = 1.0f;
    if (r.owner >= 0) owner = pool_.voices[r.owner].rel_root * pool_.voices[r.owner].fade;
    r.age += dt_;
    r.grow = kit::min(1.0f, r.grow + r.grow_step);
    if (r.owner < 0 && r.goal_power <= 0.0f && !r.fast) {
      r.fall *= pace_.gone;
    } else {
      r.power *= r.fall;
      r.fall = 1.0f;
      r.power += (r.fast ? pace_.fast : (r.goal_power > r.power ? pace_.up : pace_.down)) * (r.goal_power - r.power);
    }
    r.velocity += pace_.up * (r.velocity_goal - r.velocity);
    if (r.goal_power <= 0.0f && r.power * r.fall < 1.0e-5f) {
      r.power = 0.0f;
      r.dying = true;
    } else {
      r.dying = false;
    }
    if (r.grow >= 1.0f) r.life = settle_to_zero(r.life * pace_.life);
    r.hz += pace_.glide * (r.goal_hz - r.hz);
    if (slow) {
      const float sway = knob_[kGSway];
      const float a = r.sway_a.next(kTick * plan_ticks_), b = r.sway_b.next(kTick * plan_ticks_);
      // The bass stands firmer than what grows over it.
      const float stir = 1.2f + kit::clamp((r.hz - 90.0f) * (1.0f / 90.0f), 0.0f, 1.0f);
      r.swell_goal = kit::max(0.12f, (1.0f + sway * stir * a) * (1.0f + soil.throb * r.throb.next(kTick * plan_ticks_)));
      r.lean = sway * 3.6f * b;
      r.bend = sway * sway * 0.0026f * b;
      for (int k = 0; k < kLane; ++k) r.push[k] = settle_to_zero(r.push[k] * push_fall_);
      shape_root(r, soil);
    }
    r.swell += follow_ * (r.swell_goal - r.swell);

    // Pulse: each root at a rate that is its own pitch, halved until it can be counted.
    const float depth = knob_[kGPulseDepth];
    float beat = 1.0f;
    if (depth > 0.0005f) {
      const float octave = std::log2(r.goal_hz * (1.0f / 110.0f));
      const float rate = knob_[kGPulse] * std::exp2(octave - std::floor(octave + 0.5f));
      r.pulse += rate * dt_;
      if (r.pulse >= 1.0f) {
        r.pulse -= 1.0f;
        if (depth > 0.1f) r.hit = 4.0f * kHit;
      }
      beat = 1.0f - depth + depth * 1.45f * pulse_shape(r.pulse);
    }
    // Grain: the root breaks into pebbles that fall at random moments.
    const float grain = knob_[kGGrain];
    float rough = 1.0f;
    if (grain > 0.001f) {
      const float rate = (2.0f + 14.0f * grain) * kit::clamp(std::sqrt(r.hz / 110.0f), 0.6f, 1.8f);
      if (r.rng.uniform() < rate * dt_) {
        r.grain_goal = 0.5f + 1.0f * r.rng.uniform();
        r.grain_fall = std::exp(-dt_ / ((0.035f + 0.16f * r.rng.uniform()) * (2.0f - 1.6f * grain)));
        r.push[r.rng.next_u32() % kLane] = grain * (1.0f + 9.0f * r.rng.uniform());
        if (r.rng.uniform() < 0.6f) r.hit = 2.0f * kHit;
      }
      r.grain += (r.grain_goal - r.grain) * pace_.hit;
      r.grain_goal = settle_to_zero(r.grain_goal * r.grain_fall);
      const float part = grain * (1.7f - 0.7f * grain);
      rough = 1.0f - part + part * 1.35f * r.grain;
    }
    const bool hit = r.hit > 0.0f;
    if (hit) r.hit -= dt_;

    const float open = r.grow * r.grow * (3.0f - 2.0f * r.grow);
    // A bass has to be stronger to be heard as loud.
    const float low = 1.0f + 0.4f * kit::clamp((150.0f - r.hz) * (1.0f / 90.0f), 0.0f, 1.0f);
    const float there = 1.22f * low * r.power * r.fall * open * owner;
    load_ += there * there;
    const float amp = silent(kRootGain * knob_[kGRoot] * touch(r.velocity) * silent(there) * r.life * r.swell * beat * rough);
    float w[kLane];
    float level_sum = 0.0f;
    const float hz = r.hz * (1.0f + r.bend);
    const float beat_scale = kit::clamp(0.5f + r.hz * (1.0f / 160.0f), 0.6f, 2.5f);
    for (int k = 0; k < kLane; ++k) {
      w[k] = turn_ * kit::min(hz * soil.ratio[k] + soil.beat[k] * beat_scale, top_hz_);
      r.base[k] = silent(r.base[k] + follow_ * (r.goal[k] - r.base[k]));
      r.ring[k] = hit ? r.ring[k] + (1.0f - r.ring[k]) * pace_.hit : silent(r.ring[k] * r.ring_c[k]);
      float a = r.base[k] * (soil.ring[k] > 0.0f ? soil.hold[k] + (1.0f - soil.hold[k]) * r.ring[k] : 1.0f);
      level_sum += a;
      if (soil.noise[k] > 0.0f && amp > 1.0e-6f) {
        const int band = k < 3 ? 0 : (k < 5 ? 1 : 2);
        r.noise[k] += noise_c_[band] * (r.rng.bipolar() - r.noise[k]);
        a *= 1.0f - soil.noise[k] + soil.noise[k] * noise_gain_[band] * r.noise[k];
      }
      a *= amp;
      const float p = r.side[k];
      r.want_l[k] = a * (0.7071f - 0.35f * p - 0.06f * p * p);
      r.want_r[k] = a * (0.7071f + 0.35f * p - 0.06f * p * p);
    }
    r.bank.aim(w);
    return amp * (0.4f * r.sum + 0.6f * level_sum);
  }

  // --- the sound ----------------------------------------------------------------------------

  void add(Bank& bank, int count) {
    if (bank.quiet) return;
    Bank b = bank;
    for (int i = 0; i < count; ++i) {
      for (int k = 0; k < kLane; ++k) {
        const float re = b.re[k] * b.c[k] - b.im[k] * b.s[k];
        b.im[k] = b.im[k] * b.c[k] + b.re[k] * b.s[k];
        b.re[k] = re;
        b.l[k] += b.dl[k];
        b.r[k] += b.dr[k];
      }
      for (int k = 0; k < kLane; ++k) bus_l_[i][k] += b.im[k] * b.l[k];
      for (int k = 0; k < kLane; ++k) bus_r_[i][k] += b.im[k] * b.r[k];
    }
    bank = b;
  }

  void render(int done, int count) {
    for (int i = 0; i < count; ++i) {
      for (int k = 0; k < kLane; ++k) bus_l_[i][k] = bus_r_[i][k] = 0.0f;
    }
    for (Voice& v : pool_.voices) {
      if (!v.on) continue;
      add(v.leaf[0], count);
      add(v.leaf[1], count);
      if (v.air_gain > 1.0e-8f || v.air_step != 0.0f) {
        for (int i = 0; i < count; ++i) {
          v.air_gain += v.air_step;
          const float x = v.air.bandpass(v.rng.bipolar()) * v.air_gain;
          const float y = v.air_right.bandpass(v.rng.bipolar()) * v.air_gain;
          bus_l_[i][0] += x * v.air_l;
          bus_r_[i][0] += (x + (y - x) * v.air_wide) * v.air_r;
        }
      }
    }
    for (Root& root : roots_) {
      if (root.live && root.up) add(root.bank, count);
    }
    for (int i = 0; i < count; ++i) {
      const float* l = bus_l_[i];
      const float* r = bus_r_[i];
      const float volume = volume_.next() * 1.1f;
      const float left = (l[0] + l[4]) + (l[1] + l[5]) + ((l[2] + l[6]) + (l[3] + l[7]));
      const float right = (r[0] + r[4]) + (r[1] + r[5]) + ((r[2] + r[6]) + (r[3] + r[7]));
      out_left_[done + i] = kit::soft_clip(left * volume);
      out_right_[done + i] = kit::soft_clip(right * volume);
    }
  }

  struct Pace {
    float up = 0.1f, down = 0.1f, gone = 0.1f, fast = 0.1f, glide = 0.1f, life = 1.0f, hit = 0.1f;
  };

  kit::VoicePool<Voice, kMaxVoices> pool_;
  Root roots_[kRoots];
  Cand cands_[kMaxCands];
  int order_[kMaxCands] = {};
  bool claimed_[kRoots] = {};
  int held_[kMaxVoices] = {};
  float best_bearing_ = 1.0f;
  int count_ = 0, held_count_ = 0, thirds_from_ = 0;
  kit::Smoother volume_;
  kit::IdleGate idle_;
  Pace pace_;
  float knob_[kGliders] = {};
  float noise_c_[kNoises] = {}, noise_gain_[kNoises] = {};
  alignas(16) float bus_l_[kTick][kLane] = {};
  alignas(16) float bus_r_[kTick][kLane] = {};
  double clock_ = 0.0;
  float dt_ = 1.0f / 1500.0f, turn_ = 1.0e-4f, top_hz_ = 8500.0f, noise_scale_ = 1.0f, follow_ = 0.1f;
  float load_ = 0.0f, leaf_load_ = 0.0f, root_load_ = 0.0f, load_up_ = 0.1f, load_down_ = 0.01f;
  float leaf_open_ = 1.0f, soil_open_ = 1.0f, open_step_ = 0.1f, push_fall_ = 0.93f;
  int leaf_now_ = 0, soil_now_ = 0, plan_ticks_ = 15;
  float deepest_ = 0.0f, meeting_ = 0.0f, meeting_goal_ = 0.0f, level_seen_ = 0.0f;
  int left_ = 0, until_plan_ = 0, steal_ticks_ = 8, sounding_ = 0;
  uint32_t births_ = 0, arrivals_ = 0;
};

}  // namespace livemix

#include "law.h"
