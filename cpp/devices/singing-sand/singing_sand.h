#pragma once

// Singing Sand: thousands of sliding grains that fall into step until the
// slope hums a note.
//
//   the slope (one for all keys, on the control clock: slope_model.h)
//     Surge, Pace, Front ──► what each key feels: flow, left and right
//
//   per key (up to 12):
//     24 grains, each a noisy phase that its own rub (Grit) and its own
//     wish (Spread) pull away and the mean of all of them (Lockstep) pulls
//     back ──► at each slip a pulse from the key's table (sand_pulses.h)
//        │                     Pulse, Grain, velocity, Cluster
//        ├─► four lanes across the stereo field, the surge on each of them
//        └─► loose sand: noise that the grains throw up (Dry)
//     ──► the layer, one resonance on an overtone of the key (Layer, Layer
//     Order) ──► the sand over it (Bury) ──► + the boom an octave down
//     ──► volume ──► soft clip
//
// - The grains are the textbook model of things that fall into step: phase i
//   runs at the key's frequency plus its own error, is kicked by noise of
//   strength D, and is drawn to the mean phase with a coupling K. What the
//   grains settle to depends on K/D alone, so Lockstep sets that ratio
//   (inverted in closed form: coherence() below) and Grit the speed at which
//   they jump about; neither undoes the other. Spread asks for a further
//   coupling, and what Lockstep does not hold drifts round the note.
// - The mean of the noise and of the errors is taken out at each tick, and
//   the pull of the mean field sums to nothing, so the mean frequency of a
//   key is exactly its note. The mean phase is drawn slowly to the key's own.
// - Onset, Slump and the surges move the coupling, and stir the grains while
//   they do, so the sand gathers and comes apart in the time they say.
// - The level law counts what the first harmonics of the pulse are worth
//   after coherence, the layer and the sand over it, and holds that: the
//   knobs change the sound and not the loudness.
// - All that a key keeps is its own and starts afresh with it. Nothing rings
//   after the last key, so the instrument sleeps at once and wakes the same
//   whatever the block size.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "heap.h"
#include "sand_pulses.h"
#include "slope_model.h"

#if defined(__wasm_simd128__)
#include <wasm_simd128.h>
#endif

namespace livemix {

class SingingSand : public kit::DeviceBase<singing_sand::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kLanes = sand::kLanes;
  static constexpr int kGrains = sand::kGrains;
  static constexpr int kMaxGroups = sand::kMaxGroups;
  static constexpr int kMaxPeriod = 160;

  void init(float sample_rate) {
    using namespace singing_sand;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    period_ = kit::clamp_int(static_cast<int>(sr / 1500.0f + 0.5f), 8, kMaxPeriod);
    control_rate_ = sr / static_cast<float>(period_);
    tick_ = 1.0f / control_rate_;
    press_.init();
    met_step_ = 1.0f - kit::time_to_coeff(0.08f, control_rate_);
    meet_step_ = 1.0f - kit::time_to_coeff(0.02f, control_rate_);
    even_step_ = 1.0f - kit::time_to_coeff(0.06f, control_rate_);
    hold_step_ = 1.0f - kit::time_to_coeff(0.006f, control_rate_);
    glide_step_ = 1.0f - kit::time_to_coeff(0.05f, control_rate_);
    letting_step_ = 1.0f - kit::time_to_coeff(0.02f, control_rate_);
    slope_.init(control_rate_);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      pool_.voices[v] = Voice();
      pool_.voices[v].env.set_sample_rate(control_rate_);
      pool_.voices[v].side = (v & 1) ? -1.0f : 1.0f;
    }
    heap_.draw();
    for (kit::Smoother& s : knob_) s.set_time(0.02f, control_rate_);
    for (kit::Smoother& s : kind_) s.set_time(0.03f, control_rate_);
    volume_.set_time(kSmoothingSeconds, sr);
    noise_scale_ = std::sqrt(sr / 48000.0f);
    pat_keep_ = std::exp(-1.0f / (0.0018f * sr));
    fade_ticks_ = static_cast<int>(0.007f * control_rate_) + 1;
    until_tick_ = 0;
    arrivals_ = begun_ = 0;
    tick_chance_ = static_cast<uint32_t>(4294967295.0 * 40.0 / static_cast<double>(sr));
    ticks_ = 0;
    slope_.restart(arrivals_);
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    arrive();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 12.0f, kit::min(9000.0f, 0.2f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) {
      // Nothing sounds: knobs moved in the silence have arrived, and the
      // weather of the slope begins here, to the sample.
      arrive();
      slope_.restart(arrivals_++);
      until_tick_ = 0;
      ticks_ = 0;
    }
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.waiting > 0) {
        again.next_hz = frequency;
        again.next_gain = gain;
        again.next_off = false;
        return;
      }
      again.env.fast_release(0.06f);
      again.released = true;
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.next_hz = frequency;
    voice.next_gain = gain;
    voice.next_off = false;
    if (!stolen) {
      begin(voice);
    } else if (voice.waiting == 0) {
      voice.waiting = fade_ticks_ + 1;  // what it plays fades, then it begins
      voice.fade_from = voice.waiting;
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.waiting > 0) {
      voice.next_off = true;
      return;
    }
    voice.env.gate_off();
    voice.released = true;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (until_tick_ == 0) {
        control();
        until_tick_ = period_;
      }
      const int count = kit::clamp_int(frames - done, 1, until_tick_);
      render(done, count);
      until_tick_ -= count;
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // 0: how many of the grains of the newest key are in step. 1: its surge.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : pool_.voices) {
      if (voice.active() && (!newest || voice.age < newest->age)) newest = &voice;
    }
    if (!newest) return 0.0f;
    return index == 0 ? newest->coherence : 0.5f * (newest->felt.shown[0] + newest->felt.shown[1]);
  }

  // For the harness: the coherence of the key in slot v, 0 where none sounds.
  float coherence(int v) const { return pool_.voices[v].active() ? pool_.voices[v].coherence : 0.0f; }

 private:
  struct Glide {
    float value = 0.0f, target = 0.0f, step = 0.0f;
    void snap(float v) {
      value = target = v;
      step = 0.0f;
    }
    void aim(float v, float per_sample) {
      value = target;
      target = v;
      step = (v - value) * per_sample;
    }
  };

  // Two channels of one state-variable filter with their own tuning.
  struct Filter2 {
    float ic1[2] = {0.0f, 0.0f}, ic2[2] = {0.0f, 0.0f};
    float a1[2] = {0.0f, 0.0f}, a2[2] = {0.0f, 0.0f}, a3[2] = {0.0f, 0.0f};
    float k = 1.0f;
    void clear() { ic1[0] = ic1[1] = ic2[0] = ic2[1] = 0.0f; }
    void set(int c, float hz, float damping, float sample_rate) {
      const float g = kit::tan_prewarp(kit::kPi * kit::clamp(hz, 10.0f, 0.45f * sample_rate) / sample_rate);
      k = damping;
      a1[c] = 1.0f / (1.0f + g * (g + k));
      a2[c] = g * a1[c];
      a3[c] = g * a2[c];
    }
  };

  struct Voice {
    kit::Adsr env;
    kit::Drift bubble[kLanes];
    sand::KeyFlow felt;
    sand::Table tables[2];
    float power[2][sand::kHeard] = {};
    int heard[2] = {1, 1};
    int table = 0;        // the one that is played
    float cross = 0.0f;   // how far the other has been faded out: 1 all of it left, 0 gone
    float cross_step = 0.0f;
    int made_pulse = 0;
    int made_groups = 1;
    float made_grain = 0.0f;

    // The grains. `lean` is where each is from the key's own phase, in turns.
    float lean[kGrains] = {};
    float wish[kGrains] = {};
    float offset[kGrains] = {};
    float gain[kGrains] = {};
    float gain_step[kGrains] = {};
    float gain_aim[kGrains] = {};
    uint32_t phase[kGrains] = {};
    uint32_t before[kGrains] = {};
    uint32_t inc[kGrains] = {};
    uint32_t theta = 0, theta_inc = 0;
    uint32_t sub = 0, sub_inc = 0;
    uint32_t chance[kGrains] = {};
    uint32_t hiss_rng = 1;

    Glide left[kLanes], right[kLanes];
    Glide hiss, ticks, boom;
    float pat = 0.0f;
    float hiss_low[2] = {0.0f, 0.0f}, hiss_high[2] = {0.0f, 0.0f};
    Filter2 layer, cover;
    Glide layer_dry, layer_wet, out;
    float loudest = 0.0f;  // of the stretch just rendered

    float hz = 220.0f, velocity = 0.7f;
    float gather = 0.0f;   // 0 as the key goes down, 1 once the grains have met
    float hit = 0.0f;      // the first sand a key throws up
    float fresh = 0.0f;    // the first rush, whatever Flow keeps of it
    float coherence = 0.0f;
    float scale = 1.0f;    // of the grains' unrest, by register
    float lean_hz = 1.0f;
    float late = 0.0f;     // turns between the lanes
    float rush = 0.0f;     // octaves of it, 0 at its height
    float letting = 0.0f;  // how far it has come to rest since the key was let go
    float tight = 1.0f;    // of the places the grains lie in, narrower in a cluster
    float met = 0.0f;      // coherence, a little behind
    float even = 1.0f;     // the level law's gain
    float even_aim = 1.0f;
    float side = 1.0f;
    int age = 0;
    int waiting = 0, fade_from = 1;
    float next_hz = 220.0f, next_gain = 0.0f;
    bool next_off = false;
    bool released = false;
    bool sounding = false;
    bool first = true;

    bool active() const { return sounding; }
    bool releasing() const { return waiting == 0 && released; }
    float level() const { return waiting > 0 || env.stage() == kit::Adsr::kAttack ? 1.0f : env.level(); }
  };

  // --- what does not change -------------------------------------------------------------

  static constexpr float kVoiceGain = 0.056f;
  static constexpr float kSurgeOctaves = 3.0f;    // of level, 6 dB each, at the middle of Slope twice over
  static constexpr float kSurgeBury = 2.4f;       // octaves of brightness with it
  static constexpr float kSurgeLock = 0.6f;       // of the coherence lost between surges
  static constexpr float kTight[kMaxGroups] = {1.0f, 0.6f, 0.45f, 0.36f, 0.31f, 0.27f};
  static constexpr float kSpentLock = 0.3f;       // and as the first rush of a held key runs out
  static constexpr float kHiss = 2.6f;
  static constexpr float kTickLevel = 12.0f;
  static constexpr float kHitGain = 9.0f;
  static constexpr float kMostThrown = 4.0f;     // the loose sand can only be thrown so hard
  static constexpr float kBoomGain = 2.2f;
  static constexpr float kMostLock = sand::Heap::kMostLock;
  static constexpr float kSilent = 1.0e-6f;

  static bool choice(int id) {
    using namespace singing_sand;
    return id == kPulse || id == kSurge || id == kCluster;
  }
  static bool logarithmic(int id) {
    using namespace singing_sand;
    return id == kLayerOrder || id == kPace || id == kOnset || id == kRun || id == kSlump;
  }
  int pulse() const { return static_cast<int>(param(singing_sand::kPulse) + 0.5f); }
  int groups() const { return kit::clamp_int(static_cast<int>(param(singing_sand::kCluster) + 0.5f), 1, kMaxGroups); }

  void apply(int id) {
    using namespace singing_sand;
    if (id == kVolume) {
      volume_.set(kit::db_to_gain(param(id)), primed());
      return;
    }
    if (choice(id)) return;
    knob_[id].set(logarithmic(id) ? std::log2(param(id)) : param(id), primed());
  }

  // What the kind of sand and the kind of surge set, each gliding when they change.
  enum KindValue : int { kHissLevel = 0, kHissLow, kHissHigh, kStrike, kSettle, kBubble, kBoomMore, kWide, kDeep, kBright, kShock, kSpray, kValues };
  void kind_values(float* to) const {
    const sand::Kind& kind = sand::kind_of(pulse());
    to[kHissLevel] = kind.hiss;
    to[kHissLow] = kind.low_hz;
    to[kHissHigh] = kind.high_hz;
    to[kStrike] = kind.strike;
    to[kSettle] = kind.settle;
    to[kBubble] = kind.bubble;
    to[kBoomMore] = kind.boom;
    to[kWide] = kind.wide;
    // And what each surge is like besides its timing.
    static constexpr float kModes[3][6] = {{1.0f, 0.0f, 0.0f, 0.0f, 1.0f, 1.0f},
                                           {1.9f, 1.8f, 0.0f, 0.8f, 0.5f, 1.0f},
                                           {1.3f, -2.0f, 2.2f, 0.0f, 2.2f, 1.3f}};
    const float* mode = kModes[static_cast<int>(param(singing_sand::kSurge) + 0.5f)];
    to[kDeep] = mode[0];
    to[kBright] = mode[1];
    to[kShock] = mode[2];
    to[kSpray] = mode[3];
    to[kSettle] *= 1.0f + (mode[4] - 1.0f) * kit::min(1.0f, 2.0f * param(singing_sand::kSlope));
    to[kWide] = kit::min(1.2f, to[kWide] * mode[5]);
  }
  float kind(int i) const { return kind_[i].value; }

  // Every knob has reached where it was put.
  void arrive() {
    using namespace singing_sand;
    for (int id = 0; id < kNumParams; ++id) {
      if (id != kVolume && !choice(id)) knob_[id].snap(logarithmic(id) ? std::log2(param(id)) : param(id));
    }
    volume_.snap(kit::db_to_gain(param(kVolume)));
    float to[kValues];
    kind_values(to);
    for (int i = 0; i < kValues; ++i) kind_[i].snap(to[i]);
    share();
  }

  void begin(Voice& v) {
    using namespace singing_sand;
    v.hz = v.next_hz;
    v.velocity = v.next_gain;
    v.waiting = 0;
    v.sounding = true;
    v.released = v.next_off;
    v.first = true;
    v.age = 0;
    v.env.reset();
    v.env.set(param(kOnset), param(kRun), param(kFlow), all_.slump);
    v.env.gate_on();
    if (v.next_off) v.env.gate_off();
    v.next_off = false;
    const float sr = sample_rate();
    v.scale = std::pow(v.hz * (1.0f / 220.0f), 0.6f);
    v.lean_hz = std::sqrt(v.hz * (1.0f / 220.0f));
    v.late = kit::min(v.hz * 0.0002f, 0.075f) * v.side;
    v.letting = 0.0f;
    ++begun_;
    v.felt.begin(begun_ * 2654435761u + 0x9E37u, v.hz);
    kit::Rng rng;
    rng.seed(begun_ * 40503u + 0x1234567u);
    v.hiss_rng = rng.next_u32() | 1u;
    for (kit::Drift& b : v.bubble) {
      b.seed(rng.next_u32());
      b.set_rate(2.6f + 1.4f * rng.uniform(), control_rate_);
    }
    for (uint32_t& c : v.chance) c = rng.next_u32() | 1u;
    v.theta_inc = static_cast<uint32_t>(static_cast<double>(v.hz) / sr * 4294967296.0);
    v.sub_inc = v.hz >= 76.0f ? v.theta_inc >> 1 : v.theta_inc;
    v.theta = rng.next_u32();  // two keys on one note are two heaps of sand
    v.sub = rng.next_u32();
    // A struck key finds its grains nearly met, a slow one scattered; where
    // they lie, their mean is the key's own phase.
    const float scatter = kit::clamp(param(kOnset) * 5.0f, 0.12f, 1.0f);
    float c = 0.0f, s = 0.0f;
    for (int i = 0; i < kGrains; ++i) {
      v.lean[i] = 0.5f * scatter * rng.bipolar();
      c += kit::SineTable::cos_lookup(v.lean[i]);
      s += kit::SineTable::lookup(v.lean[i]);
    }
    const float mean = std::atan2(s, c) * (1.0f / kit::kTwoPi);
    v.coherence = std::sqrt(c * c + s * s) / static_cast<float>(kGrains);
    const int count = groups();
    for (int i = 0; i < kGrains; ++i) {
      v.lean[i] -= mean;
      v.lean[i] -= std::floor(v.lean[i] + 0.5f);
      v.offset[i] = offset_for(v, i, count);
      v.gain[i] = v.gain_aim[i] = heap_.weight[count - 1][i];
      v.gain_step[i] = 0.0f;
      v.phase[i] = v.theta + turns(v.lean[i] + v.offset[i]);
      v.before[i] = v.phase[i];
      v.inc[i] = v.theta_inc;
    }
    v.tight = 1.0f;
    v.gather = 0.0f;
    v.hit = 1.0f;
    v.fresh = 1.0f;
    v.table = 0;
    v.cross = 0.0f;
    v.cross_step = 0.0f;
    make(v, 0);
    for (int l = 0; l < kLanes; ++l) {
      v.left[l].snap(0.0f);
      v.right[l].snap(0.0f);
    }
    v.out.snap(1.0f);
    v.loudest = 0.0f;
    v.hiss.snap(0.0f);
    v.ticks.snap(0.0f);
    v.pat = 0.0f;
    v.boom.snap(0.0f);
    for (int ch = 0; ch < 2; ++ch) v.hiss_low[ch] = v.hiss_high[ch] = 0.0f;
    v.layer.clear();
    v.cover.clear();
  }

  static uint32_t turns(float t) {
    t -= std::floor(t) + 0.5f;
    return static_cast<uint32_t>(static_cast<int32_t>(t * 4294967040.0f)) + 0x80000000u;
  }
  // Its group's turn, and the lane it lies in heard a little early or late.
  float offset_for(const Voice& v, int i, int count) const {
    static constexpr float kShare[kMaxGroups + 1] = {1.0f, 1.0f, 0.5f, 0.333333333f, 0.25f, 0.2f, 0.166666667f};
    return static_cast<float>(heap_.group[count - 1][i]) * kShare[count] + v.late * all_.late[i % kLanes];
  }

  void make(Voice& v, int into) {
    v.made_pulse = pulse();
    v.made_grain = param(singing_sand::kGrain);
    v.made_groups = groups();
    v.heard[into] = press_.press(v.made_pulse, v.made_grain, v.made_groups, v.velocity, v.hz, sample_rate(),
                                 v.tables[into], v.power[into]);
  }

  // --- the control clock ----------------------------------------------------------------

  float knob(int id) const { return knob_[id].value; }

  void share() {
    using namespace singing_sand;
    all_.onset = std::exp2(knob(kOnset));
    all_.run = std::exp2(knob(kRun));
    all_.slump = kit::min(std::exp2(knob(kSlump)) * kind(kSettle), kLongest);
    all_.pace = std::exp2(knob(kPace));
    all_.order = std::exp2(knob(kLayerOrder));
    all_.hit_keep = std::exp(-tick_ / (0.018f + 0.3f * all_.onset));
    all_.fresh_keep = std::exp(-3.5f * tick_ / all_.run);
    all_.gathers = tick_ / kit::max(0.8f * all_.onset, 0.004f);
    all_.apart = 1.0f - knob(kLockstep);
    all_.lock = kMostLock * (1.0f - std::pow(all_.apart, 1.6f));
    all_.wet_layer = 2.4f * knob(kLayer) * std::pow(0.3f + 0.7f * all_.order, 1.25f);
    all_.off = kit::kTwoPi * (std::exp2(knob(kSpread) * (1.0f / 1200.0f)) - 1.0f);
    all_.damping = 1.0f / (1.2f * std::exp2(4.0f * knob(kLayer)));
    all_.width = knob(kWidth) * kind(kWide);
    const float hissing = 0.125f * kit::min(1.0f, all_.width);
    all_.hiss_middle = kit::SineTable::cos_lookup(hissing);
    all_.hiss_across = kit::SineTable::lookup(hissing);
    all_.open = kOpenHz * std::exp2(-5.2f * knob(kBury) + kind(kBright) * knob(kSlope));
    // Finer sand hisses higher.
    const float finer = std::exp2(1.3f * (knob(kGrain) - 0.45f));
    all_.hiss_low = kind(kHissLow) * finer;
    all_.hiss_high = kind(kHissHigh) * finer;
    all_.low_a = std::exp(-kit::kTwoPi * all_.hiss_high / sample_rate());
    all_.high_a = 1.0f - std::exp(-kit::kTwoPi * all_.hiss_low / sample_rate());
    static constexpr float kPlace[kLanes] = {-1.0f, -0.4f, 0.4f, 1.0f};
    static constexpr float kLate[kLanes] = {-1.0f, 0.45f, -0.45f, 1.0f};
    for (int l = 0; l < kLanes; ++l) {
      all_.at[l] = 0.5f + 0.5f * kPlace[l] * kit::min(all_.width, 1.0f);
      all_.near[l] = kit::SineTable::cos_lookup(0.25f * all_.at[l]) * 1.41421356f;
      all_.far[l] = kit::SineTable::lookup(0.25f * all_.at[l]) * 1.41421356f;
      all_.late[l] = kLate[l] * knob(kWidth);
    }
  }

  void control() {
    using namespace singing_sand;
    for (int id = 0; id < kNumParams; ++id) {
      if (id != kVolume && !choice(id)) knob_[id].next();
    }
    float to[kValues];
    kind_values(to);
    for (int i = 0; i < kValues; ++i) {
      kind_[i].set_target(to[i]);
      kind_[i].next();
    }
    ++ticks_;
    pressed_ = false;
    share();
    slope_.advance(static_cast<int>(param(kSurge) + 0.5f), all_.pace, knob(kFront));
    int count = 0;
    for (const Voice& v : pool_.voices) count += v.sounding ? 1 : 0;
    for (Voice& v : pool_.voices) {
      if (!v.sounding) continue;
      int rank = 0;
      for (const Voice& other : pool_.voices) {
        if (other.sounding && other.hz < v.hz) ++rank;
      }
      tick(v, rank, count);
    }
  }

  // A sine good enough to pull a grain by, of x in turns from -0.5 to 0.5.
  static float turn_sine(float x) {
    const float y = 8.0f * x - 16.0f * x * (x < 0.0f ? -x : x);
    return 0.225f * (y * (y < 0.0f ? -y : y) - y) + y;
  }

  void tick(Voice& v, int rank, int count) {
    using namespace singing_sand;
    if (v.waiting > 0 && --v.waiting == 0) begin(v);
    const float per_sample = 1.0f / static_cast<float>(period_);
    v.env.set(all_.onset, all_.run, knob(kFlow), all_.slump);
    const float env = v.env.next();
    const bool ending = !v.env.active();
    const float left = v.waiting > 0 ? static_cast<float>(v.waiting - 1) / static_cast<float>(v.fade_from) : 1.0f;
    v.out.aim(left * left * (3.0f - 2.0f * left), per_sample);
    slope_.feel(v.felt, rank, count);
    const float slope = knob(kSlope);
    if (v.felt.struck > 0.0f) v.hit = kit::max(v.hit, v.felt.struck * kit::min(1.0f, 1.6f * slope));
    const float flow = 0.5f * (v.felt.shown[0] + v.felt.shown[1]);

    v.gather = kit::min(1.0f, v.gather + all_.gathers);
    v.hit = settle_to_zero(v.hit * all_.hit_keep);
    v.fresh = settle_to_zero(v.fresh * all_.fresh_keep);
    v.letting += ((v.released ? 1.0f - v.env.level() : 0.0f) - v.letting) * letting_step_;
    const float letting = v.letting;

    // How much of it should be in step now, and how fast the grains move.
    const float apart = all_.apart;
    float lock = all_.lock;
    lock *= 1.0f - kSurgeLock * slope * (1.0f - flow) * (1.0f - flow);
    const float spent = 1.0f - kit::min(1.0f, v.env.level());
    if (v.env.stage() == kit::Adsr::kDecay || v.env.stage() == kit::Adsr::kSustain) lock *= 1.0f - kSpentLock * spent * spent;
    lock *= v.gather * (2.0f - v.gather);
    lock *= 1.0f - 0.75f * letting * letting;
    const float grit = knob(kGrit);
    float stir = (0.5f + 80.0f * grit * grit * grit) * v.scale * (1.0f + 5.0f * apart * apart * apart);
    stir += (1.0f - v.gather) * kit::min(1.2f / all_.onset, 25.0f);
    if (v.released) stir += kit::min(0.8f / all_.slump, 10.0f);
    stir += slope * all_.pace * 0.6f;
    const float off = all_.off * v.hz;
    const float pull = kit::min(stir * heap_.pull_for(lock) + 2.8f * off * lock * lock * lock,
                                0.6f * control_rate_);
    grains(v, stir, pull * tick_, off * tick_ * (1.0f / kit::kTwoPi), grit);
    colours(v, env, ending, flow, slope, letting, per_sample);

    // Over, once what rings in the layer is as far down as the key is.
    if (ending && v.waiting == 0 && !v.first && v.loudest < kSilent) v.sounding = false;
    v.loudest = 0.0f;
    v.first = false;
    if (v.age < 1000000000) ++v.age;
  }

  // One step of the 24 phases, and what each grain weighs from its next slip.
  void grains(Voice& v, float stir, float pull, float off, float grit) {
    const int count = groups();
    float s[kGrains], c[kGrains], push[kGrains];
    float sum_s = 0.0f, sum_c = 0.0f, sum_push = 0.0f;
    for (int i = 0; i < kGrains; ++i) {
      uint32_t x = v.chance[i];
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      v.chance[i] = x;
      push[i] = static_cast<float>(static_cast<int32_t>(x)) * (1.0f / 2147483648.0f);
    }
    for (int i = 0; i < kGrains; ++i) {
      const float t = v.lean[i];
      const float quarter = t + 0.25f > 0.5f ? t - 0.75f : t + 0.25f;
      s[i] = turn_sine(t);
      c[i] = turn_sine(quarter);
    }
    for (int i = 0; i < kGrains; ++i) {
      sum_s += s[i];
      sum_c += c[i];
      sum_push += push[i] * heap_.warm[i];
    }
    const float mean_s = sum_s * (1.0f / kGrains), mean_c = sum_c * (1.0f / kGrains);
    const float mean_push = sum_push * (1.0f / kGrains);
    const float r = std::sqrt(mean_s * mean_s + mean_c * mean_c);
    v.coherence = r;
    // White noise of variance 2 D dt, in turns; the mean of all of them out.
    const float kick = std::sqrt(6.0f * stir * tick_) * (1.0f / kit::kTwoPi);
    const float draw = pull * (1.0f / kit::kTwoPi);
    const float home = -mean_s * tick_ * 2.0f * (1.0f / kit::kTwoPi);
    const uint32_t ahead = v.theta + v.theta_inc * static_cast<uint32_t>(period_);
    const float glide = glide_step_;
    // Grains that lock in groups lock into narrower places, or the group's own
    // overtone would be the first thing that their noise takes away.
    v.tight += (1.0f - (1.0f - kTight[count - 1]) * v.met * v.met - v.tight) * glide;
    const float inverse = 1.0f / static_cast<float>(period_);
    for (int i = 0; i < kGrains; ++i) {
      float t = v.lean[i] + draw * (mean_s * c[i] - mean_c * s[i]) + kick * (push[i] * heap_.warm[i] - mean_push) +
                off * heap_.wish[i] + home;
      t -= std::floor(t + 0.5f);
      v.lean[i] = t;
    }
    for (int i = 0; i < kGrains; ++i) {
      v.offset[i] += (offset_for(v, i, count) - v.offset[i]) * glide;
      const uint32_t wanted = ahead + turns(v.lean[i] * v.tight + v.offset[i]);
      // What it has to gain on the key's own pace by the next tick.
      const int32_t gain_on = static_cast<int32_t>(wanted - v.phase[i] - v.theta_inc * static_cast<uint32_t>(period_));
      v.inc[i] = v.theta_inc + static_cast<uint32_t>(static_cast<int32_t>(static_cast<float>(gain_on) * inverse));
    }
    const float rough = 0.05f + 1.3f * grit * grit;
    const float even = 1.0f / (1.0f + rough * rough * (1.0f / 3.0f));
    const bool every = static_cast<float>(v.hz) >= control_rate_;
    for (int i = 0; i < kGrains; ++i) {
      if (every || v.phase[i] < v.before[i]) {
        const float share = 1.0f + rough * push[i];
        v.gain_aim[i] = heap_.weight[count - 1][i] * share * share * even;
      }
      v.before[i] = v.phase[i];
      v.gain_step[i] = (v.gain_aim[i] - v.gain[i]) * inverse;
    }
    v.theta = ahead;
  }

  // What the key is heard through and how loud, worked out once a tick.
  void colours(Voice& v, float env, bool ending, float flow, float slope, float letting,
               float per_sample) {
    using namespace singing_sand;
    const float sr = sample_rate();
    // A new pulse: pressed beside the one that plays, and faded over to.
    if (v.cross < 1.0e-3f) v.cross = 0.0f;
    if (v.cross == 0.0f && !pressed_ &&
        (v.made_pulse != pulse() || v.made_grain != param(kGrain) || v.made_groups != groups())) {
      make(v, 1 - v.table);
      v.table = 1 - v.table;
      v.cross = 1.0f;
      pressed_ = true;  // one key a tick
    }
    v.cross_step = v.cross > 0.0f ? kCrossShare * per_sample : 0.0f;

    const float velocity = v.velocity;
    const float order = all_.order;
    const float layer = knob(kLayer);
    const float width = all_.width;
    const float centre = kit::min(v.hz * order, kMostLayer);
    const float damping = all_.damping;
    v.layer.set(0, centre * (1.0f - 0.012f * width), damping, sr);
    v.layer.set(1, centre * (1.0f + 0.012f * width), damping, sr);
    const float dry_layer = 1.0f - 0.85f * layer;
    const float wet_layer = all_.wet_layer;
    v.layer_dry.aim(dry_layer, per_sample);
    v.layer_wet.aim(wet_layer * damping, per_sample);
    // The first rush is brighter than what is left of it.
    // A key let go keeps what it had: its grains come apart under an open cover.
    if (!v.released || v.first) v.rush = env > 0.2f ? std::log2(env) : -2.32f;
    const float open = all_.open * v.lean_hz *
                       std::exp2(1.6f * (velocity - 0.7f) - kSurgeBury * slope * (1.0f - flow) - 0.5f * letting +
                                 kRush * v.rush + kFresh * (v.fresh - 0.5f) + kind(kStrike) * v.hit);
    const float cover = kit::clamp(open, 1.2f * v.hz, 0.42f * sr);
    v.cover.set(0, cover, 1.3f, sr);
    v.cover.set(1, cover, 1.3f, sr);

    // The level law, in turn and not at every tick.
    v.met += (v.coherence - v.met) * (v.first ? 1.0f : v.coherence > v.met ? meet_step_ : met_step_);
    if (v.first || v.cross == 1.0f || ((ticks_ + static_cast<uint32_t>(&v - pool_.voices)) & 7u) == 0u) {
      const float* power = v.power[v.table];
      const int count = groups();
      const float r = std::pow(kit::clamp(v.met, 0.1f, 1.0f), v.tight * v.tight);
      float whole = 1.0e-6f;
      float step = r * r;  // coherence of harmonic h falls as r to the h squared, as power
      float kept = step;
      const float drop = step * step;
      step *= drop;
      for (int h = 1; h <= v.heard[v.table]; ++h) {
        const float n = static_cast<float>(h);
        const float x = v.hz * n / centre;
        const float a = 1.0f - x * x, b = x * damping;
        const float under = 1.0f / (a * a + b * b);
        const float re = dry_layer + wet_layer * b * b * under;
        const float im = wet_layer * a * b * under;
        const float y = v.hz * n / cover;
        const float y2 = y * y;
        const float through = (re * re + im * im) / ((1.0f - y2) * (1.0f - y2) + 1.69f * y2);
        const float share = sand::group_gain(count, h);
        whole += power[h - 1] * through * (kept * share * share + (1.0f - kept) * heap_.apart[count - 1]);
        kept *= step;
        step *= drop;
        if (kept < 1.0e-5f) kept = step = 0.0f;
      }
      const float wanted = kit::clamp(std::pow(whole, -0.46f), 0.2f, 18.0f);
      v.even_aim = wanted;
      if (v.first) v.even = wanted;
    }
    // Slow to lift what has gone dark and quick to hold what opens.
    v.even += (v.even_aim - v.even) * (v.even_aim < v.even ? hold_step_ : even_step_);

    static constexpr float kMake[3] = {0.9f, 1.5f, 1.4f};  // octaves of level a surge is given back
    const float back = slope * kMake[static_cast<int>(param(kSurge) + 0.5f)];
    const float level = kVoiceGain * env * velocity;
    // The boom takes the place of some of the grains, so it is a weight and not a level.
    const float asked = knob(singing_sand::kBoom) + kind(kBoomMore) + kind(kShock) * slope * flow;
    const float boom = asked / (1.0f + 0.45f * asked);
    // In step they stand higher for the same power.
    const float tone = level * v.even * (1.0f - 0.45f * boom) * (1.3f - 0.5f * v.met * v.met);
    // Keys that move one after the other may each fall further.
    const float deep = kSurgeOctaves * kind(kDeep) * slope * (0.75f + 0.55f * slope) * (0.8f + 0.4f * knob(kFront));
    float side[2];
    for (int c = 0; c < 2; ++c) {
      side[c] = std::exp2(back - deep * (1.0f - v.felt.shown[c]));
    }
    for (int l = 0; l < kLanes; ++l) {
      const int at = v.side > 0.0f ? l : kLanes - 1 - l;  // every other key lies the other way round
      // Wet patches come and go, each of them by itself.
      const float gone =
          kind(kBubble) > 1.0e-3f ? std::exp2(kind(kBubble) * (v.bubble[l].next(1) - 0.35f)) : 1.0f;
      const float lane = tone * gone * (side[0] + (side[1] - side[0]) * all_.at[at]);
      v.left[l].aim(lane * all_.near[at], per_sample);
      v.right[l].aim(lane * all_.far[at], per_sample);
    }
    const float moved = 0.5f * (side[0] + side[1]);
    v.boom.aim(kBoomGain * boom * v.met * v.met * level * moved, per_sample);

    // The loose sand: first when a key goes down, and more while out of step.
    const float dry = knob(kDry);
    // The surge carries it less far than the grains, so it goes on between two.
    const float gathering = kit::min(1.0f, 2.0f * all_.onset);
    const float root = std::sqrt(moved);
    float share = root * std::sqrt(root) * (1.0f + kHitGain * (1.0f + gathering + kind(kSpray) * slope) * v.hit * (0.4f + 0.6f * velocity)) *
                  (0.8f + 1.2f * (1.0f - v.met) + 1.5f * letting + 1.2f * v.fresh);
    share /= 1.0f + share * (1.0f / kMostThrown);
    // What the layer makes of a noise, counted and taken out.
    const float low = centre / all_.hiss_low, high = centre / all_.hiss_high;
    const float inside = low * low / ((1.0f + low * low) * (1.0f + high * high));
    const float rung = dry_layer * dry_layer + wet_layer * wet_layer * inside * kit::min(1.0f, centre * damping / all_.hiss_high);
    // It stays behind as the note goes, but not for twice as long.
    const float behind = std::sqrt(env);
    const float thrown = kVoiceGain * behind * (1.0f + (std::sqrt(behind) - 1.0f) * letting) * velocity * kind(kHissLevel) * share / std::sqrt(rung);
    v.hiss.aim(ending ? 0.0f : kHiss * noise_scale_ * thrown * dry * (1.3f - 0.4f * dry), per_sample);
    const float far = kit::max(0.0f, dry - 0.4f) * (1.0f / 0.6f);
    // Single grains: a slip throws more of the hiss than of these.
    v.ticks.aim(ending ? 0.0f : kTickLevel * noise_scale_ * thrown * far * far / (1.0f + 0.6f * share), per_sample);
  }

  // --- the sound ------------------------------------------------------------------------

  void render(int from, int count) {
    float left[kMaxPeriod], right[kMaxPeriod];
    for (int i = 0; i < count; ++i) left[i] = right[i] = 0.0f;
    for (Voice& v : pool_.voices) {
      if (v.sounding) render_voice(v, left, right, count);
    }
    for (int i = 0; i < count; ++i) {
      const float gain = volume_.next();
      out_left_[from + i] = kit::soft_clip(left[i] * gain);
      out_right_[from + i] = kit::soft_clip(right[i] * gain);
    }
  }

  // The 24 grains one sample on, summed lane by lane out of one table.
  static void read(const float* table, const uint32_t* phase, const float* gain, float* lanes) {
#if defined(__wasm_simd128__)
    v128_t sum = wasm_f32x4_splat(0.0f);
    for (int i = 0; i < kGrains; i += kLanes) {
      const v128_t at = wasm_v128_load(phase + i);
      const v128_t whole = wasm_u32x4_shr(at, 22);
      v128_t low = wasm_v128_load64_zero(table + wasm_i32x4_extract_lane(whole, 0));
      low = wasm_v128_load64_lane(table + wasm_i32x4_extract_lane(whole, 1), low, 1);
      v128_t high = wasm_v128_load64_zero(table + wasm_i32x4_extract_lane(whole, 2));
      high = wasm_v128_load64_lane(table + wasm_i32x4_extract_lane(whole, 3), high, 1);
      const v128_t a = wasm_i32x4_shuffle(low, high, 0, 2, 4, 6);
      const v128_t b = wasm_i32x4_shuffle(low, high, 1, 3, 5, 7);
      const v128_t t = wasm_f32x4_mul(wasm_f32x4_convert_i32x4(wasm_v128_and(at, wasm_i32x4_splat(0x3FFFFF))),
                                      wasm_f32x4_splat(1.0f / 4194304.0f));
      const v128_t x = wasm_f32x4_add(a, wasm_f32x4_mul(wasm_f32x4_sub(b, a), t));
      sum = wasm_f32x4_add(sum, wasm_f32x4_mul(x, wasm_v128_load(gain + i)));
    }
    wasm_v128_store(lanes, sum);
#else
    float a[kGrains];
    for (int i = 0; i < kGrains; ++i) {
      const float* at = table + (phase[i] >> 22);
      const float t = static_cast<float>(static_cast<int32_t>(phase[i] & 0x3FFFFFu)) * (1.0f / 4194304.0f);
      a[i] = (at[0] + (at[1] - at[0]) * t) * gain[i];
    }
    for (int l = 0; l < kLanes; ++l) {
      lanes[l] = a[l] + a[l + 4] + a[l + 8] + a[l + 12] + a[l + 16] + a[l + 20];
    }
#endif
  }

  void render_voice(Voice& v, float* left, float* right, int count) {
    const float* table = v.tables[v.table].data;
    const float* fading = v.tables[1 - v.table].data;
    const bool crossing = v.cross > 0.0f;
    float cross = v.cross;
    float loudest = v.loudest;
    for (int i = 0; i < count; ++i) {
      for (int g = 0; g < kGrains; ++g) v.phase[g] += v.inc[g];
      for (int g = 0; g < kGrains; ++g) v.gain[g] += v.gain_step[g];
      float lanes[kLanes];
      read(table, v.phase, v.gain, lanes);
      if (crossing) {
        float old[kLanes];
        read(fading, v.phase, v.gain, old);
        for (int l = 0; l < kLanes; ++l) lanes[l] += (old[l] - lanes[l]) * cross;
        cross -= v.cross_step;
        if (cross < 0.0f) cross = 0.0f;
      }
      float x[2] = {0.0f, 0.0f};
      for (int l = 0; l < kLanes; ++l) {
        v.left[l].value += v.left[l].step;
        v.right[l].value += v.right[l].step;
        x[0] += lanes[l] * v.left[l].value;
        x[1] += lanes[l] * v.right[l].value;
      }
      // The loose sand moves with the slips under it.
      uint32_t n = v.hiss_rng;
      n ^= n << 13;
      n ^= n >> 17;
      n ^= n << 5;
      v.hiss_rng = n;
      v.hiss.value += v.hiss.step;
      v.ticks.value += v.ticks.step;
      const float slip = lanes[0] + lanes[1] + lanes[2] + lanes[3];
      // A single grain is a pat of noise two thousandths of a second long.
      if (n < tick_chance_) {
        const float size = v.ticks.value * static_cast<float>((n >> 4) & 0xFFu) * (1.0f / 255.0f);
        if (size > v.pat) v.pat = size;
      }
      v.pat = settle_to_zero(v.pat * pat_keep_);
      const float thrown = v.hiss.value * (0.35f + 0.55f * (slip < 0.0f ? -slip : slip)) + v.pat;
      float middle = thrown * static_cast<float>(static_cast<int16_t>(n >> 16)) * (1.0f / 32768.0f);
      float across = thrown * static_cast<float>(static_cast<int16_t>(n & 0xFFFFu)) * (1.0f / 32768.0f);
      // As wide as the grains lie: in the middle at no Width, all over at full.
      middle *= all_.hiss_middle;
      across *= all_.hiss_across;
      const float loose[2] = {middle + across, middle - across};
      v.layer_dry.value += v.layer_dry.step;
      v.layer_wet.value += v.layer_wet.step;
      v.boom.value += v.boom.step;
      v.out.value += v.out.step;
      v.sub += v.sub_inc;
      const float deep = v.boom.value != 0.0f
                             ? v.boom.value * kit::SineTable::lookup(static_cast<float>(v.sub) * (1.0f / 4294967296.0f))
                             : 0.0f;
      for (int c = 0; c < 2; ++c) {
        v.hiss_low[c] = flush_denormal(loose[c] + (v.hiss_low[c] - loose[c]) * all_.low_a);
        v.hiss_high[c] = flush_denormal(v.hiss_high[c] + (v.hiss_low[c] - v.hiss_high[c]) * all_.high_a);
        const float in = x[c] + v.hiss_low[c] - v.hiss_high[c];
        const float band = through(v.layer, c, in, true);
        const float y = in * v.layer_dry.value + band * v.layer_wet.value;
        x[c] = (through(v.cover, c, y, false) + deep) * v.out.value;
        loudest = kit::max(loudest, x[c] < 0.0f ? -x[c] : x[c]);
      }
      left[i] += x[0];
      right[i] += x[1];
    }
    v.loudest = loudest;
    v.cross = cross;
  }

  static float through(Filter2& f, int c, float x, bool band) {
    const float v3 = x - f.ic2[c];
    const float v1 = f.a1[c] * f.ic1[c] + f.a2[c] * v3;
    const float v2 = f.ic2[c] + f.a2[c] * f.ic1[c] + f.a3[c] * v3;
    f.ic1[c] = flush_denormal(2.0f * v1 - f.ic1[c]);
    f.ic2[c] = flush_denormal(2.0f * v2 - f.ic2[c]);
    return band ? v1 : v2;
  }

  static constexpr float kCrossShare = 1.0f / 16.0f;
  static constexpr float kLongest = 18.0f;        // seconds of Slump, whatever the sand
  static constexpr float kOpenHz = 11500.0f;
  static constexpr float kMostLayer = 5600.0f;    // Hz: a whistle and no higher
  static constexpr float kFresh = 1.0f;           // octaves more of it while the rush is fresh
  static constexpr float kRush = 0.9f;            // octaves of brightness for 6 dB of the first rush

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::IdleGate idle_;
  kit::Smoother knob_[singing_sand::kNumParams];
  kit::Smoother kind_[kValues];
  kit::Smoother volume_;
  // What every key shares at a tick, worked out once.
  struct Common {
    float onset = 0.3f, run = 4.0f, slump = 3.0f, pace = 0.4f, order = 3.0f, hit_keep = 0.9f, fresh_keep = 0.9f, gathers = 0.1f;
    float apart = 0.2f, lock = 0.9f, off = 0.0f, damping = 0.3f, wet_layer = 0.0f, width = 0.7f, open = 8000.0f;
    float hiss_low = 400.0f, hiss_high = 2800.0f, low_a = 0.5f, high_a = 0.01f, hiss_middle = 1.0f, hiss_across = 0.0f;
    float at[kLanes] = {}, near[kLanes] = {}, far[kLanes] = {}, late[kLanes] = {};
  };
  Common all_;
  float met_step_ = 0.1f, meet_step_ = 0.1f, even_step_ = 0.1f, hold_step_ = 0.1f, glide_step_ = 0.1f, letting_step_ = 0.1f;
  sand::Slope slope_;
  sand::Press press_;
  sand::Heap heap_;
  int period_ = 32, until_tick_ = 0, fade_ticks_ = 6;
  float control_rate_ = 1500.0f, tick_ = 1.0f / 1500.0f;
  float noise_scale_ = 1.0f, pat_keep_ = 0.99f;
  uint32_t tick_chance_ = 0;
  uint32_t arrivals_ = 0, begun_ = 0, ticks_ = 0;
  bool pressed_ = false;
};

}  // namespace livemix
