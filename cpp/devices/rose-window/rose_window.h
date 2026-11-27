#pragma once

// Rose Window: every key draws a turning rose, and its petals are its harmonics.
//
//   heart, rings 1 to 9 ─► figure z = x + iy ─► Fold, Curl ─► Breath ─► Light ─► place ─► sum ─► Stone
//                     └──► the rings' own places (Tilt) ──────┘
//
// - A rotor is one complex number turned a little every sample. The heart
//   turns once a period; ring k is a rotor at 1 + k m times the note forwards
//   and one at k m - 1 backwards, m the number of petals. The figure they draw
//   has m petals and holds only the harmonics one to each side of a multiple
//   of m. With the golden number there is no whole number of petals: the rose
//   never closes and its rings are the partials of a bell.
// - Left is x and right is y. No two rotors share a frequency, so a rotor is
//   as loud in mono whatever its phase.
// - Fold and Curl multiply z by a function of |z|. |z| has the same m petals,
//   so what they add is in the same family: the timbre changes and the
//   symmetry stays. Fold takes the radius back through the heart; Curl turns a
//   point by how far out the figure was a moment ago. Rotors above
//   kFoldFrom..kFoldTo stay outside both, so there is little to alias.
// - Turn rotates every ring at a speed of its own, which changes the phase it
//   meets the others with (Fold and Curl make that timbre) and rocks its plane
//   (Tilt: the ring dims and leans to a side). The heart never turns, so the
//   note keeps its pitch.
// - Each rotor has a level that opens (Bloom, Order) and one that was struck
//   and dies (Strike, Decay, Damping). The release is after the figure, so a
//   key let go keeps its shape as it fades.
//
// One voice to a pitch: two figures of the same frequencies could cancel. A
// voice remembers the note ids that hold it.

#include <initializer_list>

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class RoseWindow : public kit::DeviceBase<rose_window::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12, kRingCount = 9, kRotors = 1 + 2 * kRingCount;
  static constexpr int kGroups = 5, kSlots = 4 * kGroups;  // the last slot is empty
  static constexpr int kHolders = 16;                      // note ids one voice remembers
  enum Tracery : int { kSmooth = 0, kPointed, kBroken, kGoldenBells, kNumTraceries };
  enum Order : int { kHeartFirst = 0, kRimFirst, kPassing, kNumOrders };
  enum Meter : int { kMeterAngle = 0, kMeterOpen, kMeterLevel, kMeterNote };

  void init(float sample_rate) {
    using namespace rose_window;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) voice = Voice();
    stamp_ = 0, chunk_left_ = 0, fresh_ = true, ride_ = riding_ = kRest;
    ride_decay_ = std::exp(-1.5f / sr), ride_coeff_ = 1.0f - std::exp(-20000.0f / sr);
    tick_seconds_ = static_cast<float>(kChunk) / sr;
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    const auto glide = [this](float seconds) { return kit::time_to_coeff(seconds, 1.0f / tick_seconds_); };
    weight_coeff_ = glide(0.02f), open_coeff_ = glide(0.03f), recover_coeff_ = glide(0.008f), even_coeff_ = glide(0.25f);
    pane_coeff_ = glide(0.09f), chiff_coeff_ = glide(0.07f), knock_coeff_ = glide(0.014f);
    fade_step_ = tick_seconds_ / 0.008f, swap_step_ = tick_seconds_ / 0.012f;
    revive_ticks_ = kit::clamp_int(static_cast<int>(0.15f / tick_seconds_), 1, 4096);
    for (kit::Smoother& knob : knobs_) knob.set_time(0.012f, 1.0f / tick_seconds_);
    volume_.set_time(0.02f, sr);
    set_stone(), reset_stones();
    stone_at_ = stone_to_ = stone_step_ = 0.0f;
    idle_.reset(sr, 0.4f);
  }

  void set_param(int id, float value) { store_param(id, value); }  // read on the control clock

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // With nothing sounding every knob is where it points and the control clock starts with the sound.
    if (count_sounding() == 0) chunk_left_ = 0, fresh_ = true, ride_ = riding_ = kRest;
    Voice *same = nullptr, *waiting = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (!same && (voice.pending ? voice.pending_frequency : voice.frequency) == frequency) {
        same = &voice;
      } else if (voice.drop(note_id) && voice.pending && voice.holders == 0) {  // an id has one pitch at a time
        waiting = &voice;
      }
    }
    if (same) {
      same->hold(note_id);
      same->stamp = ++stamp_;
      float& struck = same->pending ? same->pending_gain : same->strike_gain;
      struck = kit::max(struck, gain);
      if (!same->pending) same->strikes = true;
      same->follow = kit::max(same->follow, 0.2f * gain + kSilence);
      return;
    }
    Voice& voice = waiting ? *waiting : voices_[pick()];
    const bool taken = voice.sounding;
    voice.holders = 0, voice.hold(note_id);
    voice.stamp = ++stamp_;
    voice.follow = 0.2f * gain + kSilence;
    if (taken) {
      voice.pending = true;
      voice.pending_frequency = frequency, voice.pending_gain = gain;
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (voice.sounding) voice.drop(note_id);
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(count_sounding() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (chunk_left_ == 0) {
        control(), chunk_left_ = kChunk;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      float left[kChunk] = {}, right[kChunk] = {};
      for (Voice& voice : voices_) {
        if (voice.sounding && !voice.fresh) render_voice(voice, n, left, right);
      }
      frame(left, right, n);
      for (int i = 0; i < n; ++i) {
        float gain = volume_.next();
        // Many hard keys at once are ridden down before they meet the knee.
        ride_ = kit::max(gain * kit::max(std::fabs(left[i]), std::fabs(right[i])), kit::max(ride_ * ride_decay_, kRest));
        riding_ += (ride_ - riding_) * ride_coeff_;
        if (riding_ > kRide) gain *= std::exp2(-0.9f * std::log2(riding_ * (1.0f / kRide)));
        out_left_[done + i] = kit::soft_clip(left[i] * gain);
        out_right_[done + i] = kit::soft_clip(right[i] * gain);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // The newest key: where its first ring has turned to (0..1), how far it is
  // open (0..1), how loud, its note. With none: zeros.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (voice.sounding && !voice.pending && !voice.fresh && (!newest || voice.stamp > newest->stamp)) newest = &voice;
    }
    const float values[] = {newest ? newest->plane[1] : 0.0f, newest ? newest->opened : 0.0f, newest ? newest->follow : 0.0f, newest ? newest->frequency : 0.0f};
    return index < kMeterAngle || index > kMeterNote ? 0.0f : values[index];
  }

 private:
  typedef float Vec __attribute__((vector_size(16)));

  static constexpr int kChunk = 64;  // control period, samples
  static constexpr float kMinHz = 20.0f, kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kEdgeHz = 5500.0f, kTopHz = 14000.0f;      // a rotor fades out between these two
  static constexpr float kFoldFrom = 2800.0f, kFoldTo = 5600.0f;  // and leaves Fold and Curl between these
  static constexpr float kLevel = 0.318f, kSilence = 1.0e-6f, kMostFold = 4.8f, kRide = 0.41f, kRest = 0.2f;
  static constexpr float kSoftSeconds = 0.016f, kHardSeconds = 0.0025f;  // how long a strike takes to go in
  static constexpr int kStoneModes = 4;

  // The knobs that glide on the control clock.
  enum Knob : int { kTurnKnob = 0, kStoneKnob, kTiltKnob, kBendKnob, kFoldKnob, kCurlKnob, kLightKnob, kBreathKnob, kWidthKnob,
                    kHeartKnob, kRingsKnob, kReachKnob, kStrikeKnob, kNumKnobs };
  static constexpr int kKnobParams[kNumKnobs] = {
      rose_window::kTurn, rose_window::kStone, rose_window::kTilt, rose_window::kBend, rose_window::kFold,
      rose_window::kCurl, rose_window::kLight, rose_window::kBreath, rose_window::kWidth, rose_window::kHeart,
      rose_window::kRings, rose_window::kReach, rose_window::kStrike};
  float knob(int k) const { return knobs_[k].value; }

  // What ramps from tick to tick: the levels of the two sides, the fold and
  // what it costs, the curl, the noise on the rotors, what is left of the pure
  // tone under it, the noise of its own, the filter, and the width.
  enum Ramp : int { kAmpLeft = 0, kAmpRight, kInverse, kMean, kFoldBy, kTip, kMakeup, kCurlBy, kAir, kTone, kHiss, kCut, kWide, kRamps };

  struct alignas(16) Voice {
    // Per rotor: where it is, its turn a sample, its gain into the folded
    // figure and into each channel past it, with the ramps of this tick.
    float re[kSlots] = {}, im[kSlots] = {};
    float turn_re[kSlots] = {}, turn_im[kSlots] = {};
    float figure[kSlots] = {}, left[kSlots] = {}, right[kSlots] = {};
    float figure_step[kSlots] = {}, left_step[kSlots] = {}, right_step[kSlots] = {};
    float figure_to[kSlots] = {}, left_to[kSlots] = {}, right_to[kSlots] = {};
    float ratio[kRotors] = {}, hz[kRotors] = {};  // harmonic, unsigned
    float edge[kRotors] = {}, inside[kRotors] = {};
    float plane[kRingCount + 1] = {};                        // the rocking of each ring's plane, cycles
    float place[kRotors] = {}, close[kRotors] = {};          // when it opens, 0..1; what opens last closes first
    float pane[kRotors] = {}, pane_to[kRotors] = {}, pane_at[kRotors] = {};  // Broken: how lit, and its clock
    float cloud = 1.0f, cloud_to = 1.15f, cloud_at = 0.7f;
    float open[kRotors] = {}, stay[kRotors] = {};            // stay: what Golden bells have left of the held sound
    float struck[kRotors] = {}, push[kRotors] = {}, die[kRotors] = {}, soak[kRotors] = {};
    float frequency = 440.0f, gain = 0.0f, touch = 1.0f;
    float decay = -1.0f, damping = -1.0f;                    // what `die` was made for
    float cutoff = 1000.0f, aim = 0.0f;                          // and the cutoff
    float heft = 1.0f, octave = 0.0f, side = 0.0f, room = 1.0f;    // from its pitch: octaves from C4, its place, how far it may fold
    float own = 0.0f, pace = 1.0f, lift = 0.0f, early = 0.0f;                                        // this key's own orientation, cycles
    float attack = 0.0f, attack_at = 0.0f, release = 0.0f, bloom_at = 0.0f, fade = 1.0f, chiff = 0.0f, knock = 0.0f;
    float swap = 1.0f;                                       // the rings, while their number of petals changes
    float now[kRamps] = {}, to[kRamps] = {}, step[kRamps] = {};
    float even = 1.0f;                                       // what Light takes is given back
    float noise_pole = 0.9f, noise_gain = 1.0f, noise[4] = {};
    float low[4] = {}, x1[2] = {}, y1[2] = {}, block = 0.999f;
    float lag = 0.0f, lag_coeff = 0.1f;                      // the radius as Curl sees it, a little behind
    kit::Rng rng;
    kit::Drift gust;
    float follow = 0.0f, opened = 0.0f, power = 0.0f, spread = 0.0f, energy = 0.0f, heard = 0.0f, went_in = 0.0f, came_out = 0.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f, strike_gain = 0.0f;
    uint32_t stamp = 0;
    int figure_of = -1, push_left = 0, push_ticks = 1, revive = 0, groups = kGroups, holders = 0, ids[kHolders] = {};
    bool sounding = false, pending = false, fresh = false, strikes = false;

    bool released() const { return holders == 0; }
    void hold(int id) {
      drop(id);
      if (holders == kHolders) drop(ids[0]);
      ids[holders++] = id;
    }
    bool drop(int id) {
      for (int i = 0; i < holders; ++i) {
        if (ids[i] != id) continue;
        for (int j = i + 1; j < holders; ++j) ids[j - 1] = ids[j];
        --holders;
        return true;
      }
      return false;
    }
  };

  static float smoothstep(float t) {
    t = kit::clamp(t, 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
  }
  static float part(float x) { return x - std::floor(x); }
  int choice(int id, int count) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1); }

  int figure_now() const {
    using namespace rose_window;
    return 2 * kit::clamp_int(static_cast<int>(param(kPetals) + 0.5f), 3, 13) + (choice(kTracery, kNumTraceries) == kGoldenBells ? 1 : 0);
  }
  // How far apart the rings stand: whole petals, or the golden measure, which
  // never closes (three petals then give a golden number squared).
  static float ring_spacing(int figure) {
    return static_cast<float>(figure / 2) * (figure % 2 ? 0.8726780f : 1.0f);
  }

  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding;
    return count;
  }

  // The voice a new key takes: an idle one, else the quietest let go, else the
  // quietest held, the oldest on a tie; one a key already waits in only when
  // there is no other.
  int pick() const {
    int found = 0, best = 4;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = voices_[v];
      const Voice& other = voices_[found];
      const int rank = !voice.sounding ? 0 : voice.pending ? 3 : voice.released() ? 1 : 2;
      const bool even = rank == 0 || rank == 3 || voice.follow == other.follow;
      if (rank < best || (rank == best && (even ? voice.stamp < other.stamp : voice.follow < other.follow))) found = v, best = rank;
    }
    return found;
  }

  void start(Voice& voice, float frequency, float gain) {
    Voice next;  // who holds the key stays; the rest begins again
    next.stamp = voice.stamp, next.holders = voice.holders;
    for (int i = 0; i < kHolders; ++i) next.ids[i] = voice.ids[i];
    next.follow = voice.follow;
    voice = next;
    voice.frequency = frequency, voice.gain = gain, voice.release = 1.0f;
    for (int j = 0; j < kRotors; ++j) voice.close[j] = voice.stay[j] = 1.0f;
    voice.sounding = voice.fresh = voice.strikes = true;
    voice.strike_gain = gain;
    const float key = kit::hz_to_midi(frequency);
    voice.own = part(key * 0.2360680f);
    voice.pace = 0.75f + 0.5f * part(key * 0.6180340f);  // no two keys rock together
    voice.octave = (key - 60.0f) * (1.0f / 12.0f);
    voice.side = kit::clamp((key - 62.0f) * 0.011f, -0.35f, 0.35f);
    voice.heft = kit::clamp(std::exp2(0.06f * voice.octave), 0.85f, 1.2f);
    // High notes fold less: there is less room over them.
    voice.room = kit::clamp(400.0f / frequency, 0.12f, 1.0f);
    const uint32_t seed = 0x205EBADu + static_cast<uint32_t>(frequency * 16.0f) * 2654435761u;
    voice.rng.seed(seed);
    voice.gust.seed(seed ^ 0x9E3779B9u);
    voice.gust.set_rate(0.45f, 1.0f / tick_seconds_);
  }

  // The harmonics of the petals in force, where each rotor starts, and how far
  // each is inside the band. The heart is slot 0; ring k is 2k - 1 (backwards)
  // and 2k (forwards).
  void set_figure(Voice& voice, bool from_rest) {
    voice.figure_of = figure_now();
    const float m = ring_spacing(voice.figure_of);
    voice.lag_coeff = 1.0f - std::exp(-kit::kTwoPi * kit::clamp(0.5f * m * voice.frequency, 40.0f, 3000.0f) / sample_rate());
    voice.ratio[0] = 1.0f;
    for (int k = 1; k <= kRingCount; ++k) {
      voice.ratio[2 * k - 1] = static_cast<float>(k) * m - 1.0f;
      voice.ratio[2 * k] = static_cast<float>(k) * m + 1.0f;
    }
    for (int j = from_rest ? 0 : 1; j < kRotors; ++j) {
      const float k = static_cast<float>((j + 1) / 2);
      // Rings start at spread angles: all in line they are a spike once a period.
      const float angle = part(k * k * 0.1180340f + k * 0.19f + 5.52f * voice.octave);
      voice.re[j] = kit::SineTable::cos_lookup(angle), voice.im[j] = kit::SineTable::lookup(angle);
    }
    for (int k = 0; from_rest && k <= kRingCount; ++k) voice.plane[k] = part(0.3f * voice.own + 0.05f * static_cast<float>(k) - 0.1f);
    tune(voice);
  }

  // How fast ring k turns, in turns of Turn: each its own, and alternate rings
  // the other way where Turn is under nothing.
  static float ring_speed(int k, float counter) {
    const float speed = 0.7f + 0.9f * part(static_cast<float>(k) * 0.6180340f);
    return k % 2 ? speed : speed * kit::lerp(1.0f, -1.4f, counter);
  }
  float counter() const { return kit::clamp(-10.0f * knob(kTurnKnob), 0.0f, 1.0f); }
  float turn_hz() const {
    const float t = std::fabs(knob(kTurnKnob));
    return 5.0f * t * t * std::sqrt(t);
  }

  void tune(Voice& voice) {
    const float sr = sample_rate();
    const float stretch = knob(kBendKnob) * (1.0f / 1200.0f), top = kit::min(kTopHz, 0.45f * sr);
    const float turning = 0.22f * turn_hz(), against = counter();
    for (int j = 0; j < kRotors; ++j) {
      const int k = (j + 1) / 2;
      float ratio = voice.ratio[j];
      if (stretch != 0.0f && j > 0) ratio *= std::exp2(stretch * std::log2(ratio));
      const float hz = voice.frequency * ratio;
      voice.hz[j] = hz;
      voice.edge[j] = 1.0f - smoothstep((hz - kEdgeHz) / (top - kEdgeHz));
      voice.inside[j] = 1.0f - smoothstep((hz - kFoldFrom) / (kFoldTo - kFoldFrom));
      const float spin = k == 0 ? 0.0f : turning * ring_speed(k, against);
      const float signed_hz = (j % 2 ? -hz : hz) + spin;
      const float w = voice.edge[j] > 0.0f ? kit::kTwoPi * signed_hz / sr : 0.0f;
      voice.turn_re[j] = std::cos(w), voice.turn_im[j] = std::sin(w);
    }
  }

  // What was struck dies by its harmonic; a higher key dies sooner.
  void set_decay(Voice& voice) {
    using namespace rose_window;
    if (voice.decay == param(kDecay) && voice.damping == param(kDamping)) return;
    voice.decay = param(kDecay), voice.damping = param(kDamping);
    const float damping = param(kDamping) * (1.0f + 1.4f * param(kDamping));
    const float seconds = param(kDecay) * std::pow(kit::clamp(220.0f / voice.frequency, 0.1f, 2.0f), 0.35f);
    for (int j = 0; j < kRotors; ++j) {
      const float own = kit::max(seconds * std::exp2(-damping * std::log2(voice.ratio[j])), 0.03f);
      voice.soak[j] = std::exp2(-0.9f * param(kDamping) * std::log2(kit::max(voice.ratio[j], 1.0f)));
      voice.die[j] = std::exp(-kSixtyDb * tick_seconds_ / own);
    }
  }

  void strike(Voice& voice, float gain) {
    using namespace rose_window;
    if (voice.fresh) voice.touch = gain;
    voice.gain = voice.fresh ? gain : kit::max(gain, 0.03f);
    // What rings already keeps its own loudness as the touch changes under it.
    const float keeps = std::pow(kit::max(voice.touch, 0.03f) / kit::max(voice.gain, 0.03f), 0.85f);
    const float struck = tracery_ == kGoldenBells ? 0.3f + 0.7f * param(kStrike) : param(kStrike);  // a bell always is
    const float hit = (1.0f - 0.48f * struck * struck) * std::sin(kit::kHalfPi * struck);
    // A harder strike reaches further out.
    const float reach = 0.15f + 0.75f * gain;
    float amount[kRotors], power = 1.0e-9f, whole = 1.0e-9f;
    for (int j = 0; j < kRotors; ++j) {
      const float k = static_cast<float>((j + 1) / 2);
      amount[j] = std::pow(1.0f + k, 0.9f * reach) * (k > 1.0f ? std::pow(0.55f + 0.45f * gain, k - 1.0f) : 1.0f);
      if (choice(kOrder, kNumOrders) == kRimFirst && k < 2.0f) amount[j] *= 0.3f + 0.3f * k;
      power += weight_to_[j] * weight_to_[j] * amount[j] * amount[j];
      whole += weight_to_[j] * weight_to_[j];
    }
    // However far it reaches, a strike has one power.
    const float scale = hit * std::sqrt(whole / power);
    for (int j = 0; j < kRotors; ++j) voice.push[j] = kit::min(amount[j] * scale, kit::max(1.15f * amount[j] * scale - keeps * voice.struck[j], 0.0f));
    voice.push_left = voice.push_ticks = kit::clamp_int(static_cast<int>(kit::lerp(kSoftSeconds, kHardSeconds, param(kStrike)) / tick_seconds_ + 0.5f), 1, 255);
    voice.revive = revive_ticks_, voice.chiff = 1.0f;
    voice.knock = kit::max(voice.knock, param(kStrike) * (0.3f + 0.7f * gain));
    voice.strikes = false, voice.strike_gain = voice.bloom_at = 0.0f;
  }

  // The rings' own profile, shared by all keys: how loud each rotor is in a
  // figure whose power is one.
  void set_profile(bool snap) {
    using namespace rose_window;
    const int tracery = choice(kTracery, kNumTraceries);
    const bool moving = !knobs_[kHeartKnob].settled() || !knobs_[kRingsKnob].settled() || !knobs_[kReachKnob].settled();
    if (snap || moving || tracery != tracery_) {
      tracery_ = tracery;
      const float rings = knob(kRingsKnob), reach = knob(kReachKnob);
      const float apart = 1.0f / (0.64f * rings * std::sqrt(std::sqrt(rings)));
      float target[kRotors];
      target[0] = 0.08f * std::pow(156.0f, knob(kHeartKnob));
      float power = target[0] * target[0];
      if (tracery == kPointed) target[0] *= 0.07f;
      if (tracery == kBroken) target[0] *= 0.36f;
      for (int k = 1; k <= kRingCount; ++k) {
        static const float kPanes[kRingCount] = {0.08f, 0.9f, 0.1f, 0.9f, 1.0f, 0.15f, 0.9f, 0.1f, 1.0f};
        const float at = static_cast<float>(k);
        const float out = (0.8f / rings - at) * apart;  // the first ring of few is heard as the first of many
        float ring = std::exp(out * kit::lerp(9.0f, 0.4f, reach));
        if (tracery == kPointed) {
          const float far = (at - (0.8f + 0.62f * reach * (rings - 1.0f))) * 1.3f;
          ring = 1.2f * std::exp(-far * far) + 0.004f;
        } else if (tracery == kBroken) {
          ring = kPanes[k - 1] * std::exp(out * kit::lerp(4.0f, 0.0f, reach));
        } else if (tracery == kGoldenBells) {
          ring = 0.9f * std::exp((out + 0.4f * apart) * kit::lerp(6.0f, 0.5f, reach));
        }
        ring *= kit::clamp(rings - at + 1.0f, 0.0f, 1.0f);
        target[2 * k - 1] = target[2 * k] = ring;
        power += 2.0f * ring * ring;
      }
      const float scale = 1.0f / std::sqrt(power);
      for (int j = 0; j < kRotors; ++j) weight_to_[j] = target[j] * scale;
    }
    for (int j = 0; j < kRotors; ++j) {
      const float delta = weight_[j] - weight_to_[j];
      weight_[j] = snap || (delta < 1.0e-6f && delta > -1.0e-6f) ? weight_to_[j] : weight_to_[j] + delta * weight_coeff_;
    }
  }

  void set_knobs(bool glide) {
    for (int k = 0; k < kNumKnobs; ++k) {
      const float value = param(kKnobParams[k]);
      knobs_[k].set(k == kLightKnob ? std::log2(value) : k == kStoneKnob ? std::pow(value, 0.7f) : value, glide);
    }
    volume_.set(kit::db_to_gain(param(rose_window::kVolume)), glide);
  }

  void control() {
    set_knobs(!fresh_);
    retune_ = !knobs_[kTurnKnob].settled() || !knobs_[kBendKnob].settled();
    for (kit::Smoother& knob : knobs_) knob.next();
    fold_depth_ = std::pow(knob(kFoldKnob), 0.8f);
    closing_ = kSixtyDb * tick_seconds_ / param(rose_window::kRelease);
    closing_gain_ = std::exp(-closing_);
    set_profile(fresh_);
    stone_at_ = fresh_ ? knob(kStoneKnob) : stone_to_, stone_to_ = knob(kStoneKnob);
    stone_step_ = (stone_to_ - stone_at_) * (1.0f / kChunk);
    if (count_sounding() == 0) {  // what the frame still rings with is let go at a level nothing hears
      float most = 0.0f;
      for (auto& side : stones_) {
        for (kit::Svf& mode : side) most = kit::max(most, kit::max(std::fabs(mode.ic1), std::fabs(mode.ic2)));
      }
      if (most <= 3.0e-8f) reset_stones();
    }
    fresh_ = false;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (voice.pending && voice.fade <= 0.0f) start(voice, voice.pending_frequency, voice.pending_gain);
      control_voice(voice);
    }
  }

  // How open each rotor is, by Order.
  void open_rotors(Voice& voice, bool from_rest) {
    using namespace rose_window;
    const int order = choice(kOrder, kNumOrders);
    const float bloom = param(kBloom);
    const float rings = kit::clamp(kEdgeHz / (voice.frequency * ring_spacing(voice.figure_of)), 1.0f, kit::max(knob(kRingsKnob), 1.0f));  // what is heard of them
    const float window = 1.0f / (0.3f * bloom + 0.01f);
    // Passing: one ring of light goes out from the heart and comes again.
    const float cycle = kit::max(1.4f * bloom, 0.35f);
    const float front = part(voice.bloom_at / cycle + 0.1f) * (rings + 3.2f) - 1.2f;
    float sum = 0.0f;
    for (int j = 0; j < kRotors; ++j) {
      const float k = static_cast<float>((j + 1) / 2);
      float target = 1.0f;
      voice.place[j] = kit::clamp(k / (rings + 0.5f), 0.0f, 1.0f);
      if (order == kPassing) {
        const float far = (k - front) / (0.5f + 0.1f * rings);
        target = 0.03f + 0.87f * std::exp(-far * far);
      } else {
        if (order == kRimFirst) voice.place[j] = 1.0f - voice.place[j];
        if (j > 0 || order == kRimFirst) target = smoothstep((voice.bloom_at + 0.08f * bloom - 0.85f * bloom * voice.place[j]) * window);
      }
      voice.open[j] = from_rest ? (j > 0 || order == kRimFirst ? 0.0f : target)
                                : target + (voice.open[j] - target) * open_coeff_;
      sum += weight_[j] * weight_[j] * voice.open[j] * voice.open[j];
    }
    voice.opened = kit::clamp(std::sqrt(sum), 0.0f, 1.0f);
  }

  // The level stages: attack, release with its recovery, what was struck, and
  // the breath of the onset.
  void step_levels(Voice& voice) {
    using namespace rose_window;
    if (!voice.released()) {
      for (int j = 0; j < kRotors; ++j) {
        voice.open[j] *= voice.close[j], voice.struck[j] *= voice.close[j];
        voice.close[j] = 1.0f;
      }
      if (voice.release < 1.0f) {
        // A key struck again while it fades: the release opens over a few
        // milliseconds and what is under it gives way by as much.
        float next = 1.0f + (voice.release - 1.0f) * recover_coeff_;
        if (next > 0.999f) next = 1.0f;
        const float ratio = voice.release / next;
        voice.release = next;
        voice.attack *= ratio;
        voice.attack_at = 0.6366198f * std::asin(std::sqrt(kit::clamp(voice.attack, 0.0f, 1.0f)));
        for (int j = 0; j < kRotors; ++j) voice.struck[j] *= ratio;
      }
      if (voice.attack_at < 1.0f) {
        voice.attack_at = kit::min(voice.attack_at + tick_seconds_ / param(kAttack), 1.0f);
        const float s = kit::SineTable::lookup(0.25f * voice.attack_at);  // an even swell
        voice.attack = s * s;
      }
      voice.bloom_at += tick_seconds_;
      if (voice.bloom_at > 3600.0f) voice.bloom_at -= 1800.0f;
    } else {
      // The rose closes in the order it opened, backwards.
      voice.release *= closing_gain_;
      for (int j = 0; j < kRotors; ++j) {
        voice.close[j] *= 1.0f - kit::min(2.2f * closing_ * voice.place[j], 0.9f);
        if (voice.close[j] < 1.0e-6f) voice.close[j] = 0.0f;
      }
      voice.bloom_at += tick_seconds_;
    }
    if (voice.push_left > 0) {
      const float share = 1.0f / static_cast<float>(voice.push_ticks);
      for (int j = 0; j < kRotors; ++j) voice.struck[j] += voice.push[j] * share;
      --voice.push_left;
    } else {
      for (int j = 0; j < kRotors; ++j) {
        voice.struck[j] *= voice.die[j];
        if (voice.struck[j] < 1.0e-7f) voice.struck[j] = 0.0f;
      }
    }
    // A bell's held sound dies as well, slower than what was struck.
    const bool bell = tracery_ == kGoldenBells && voice.revive == 0;
    if (voice.revive > 0) --voice.revive;
    for (int j = 0; j < kRotors; ++j) {
      if (bell) {
        voice.stay[j] = voice.stay[j] < 1.0e-7f ? 0.0f : voice.stay[j] * (1.0f - 0.45f * (1.0f - voice.die[j]));
      } else if (voice.stay[j] != 1.0f) {
        voice.stay[j] = voice.stay[j] > 0.9999f ? 1.0f : 1.0f + (voice.stay[j] - 1.0f) * open_coeff_;
      }
    }
    voice.chiff = voice.chiff < 1.0e-5f ? 0.0f : voice.chiff * chiff_coeff_;
    voice.knock = voice.knock < 1.0e-5f ? 0.0f : voice.knock * knock_coeff_;
    if (voice.touch != voice.gain) {
      const float before = kit::max(voice.touch, 0.03f);
      voice.touch = std::fabs(voice.touch - voice.gain) < 1.0e-5f ? voice.gain : voice.gain + (voice.touch - voice.gain) * (voice.touch > voice.gain ? even_coeff_ : recover_coeff_);
      const float keeps = std::pow(before / kit::max(voice.touch, 0.03f), 0.85f);
      for (float& struck : voice.struck) struck *= keeps;
    }
  }

  static void land(Voice& voice) {
    for (int j = 0; j < kSlots; ++j) {
      voice.figure[j] = voice.figure_to[j], voice.left[j] = voice.left_to[j], voice.right[j] = voice.right_to[j];
      // The turning keeps its length: what rounding did to it is undone.
      const float fix = 1.5f - 0.5f * (voice.re[j] * voice.re[j] + voice.im[j] * voice.im[j]);
      voice.re[j] *= fix, voice.im[j] *= fix;
    }
    for (int r = 0; r < kRamps; ++r) voice.now[r] = voice.to[r];
  }

  void control_voice(Voice& voice) {
    using namespace rose_window;
    const bool from_rest = voice.fresh;
    const float sr = sample_rate();
    land(voice);
    if (from_rest) {
      set_figure(voice, true);
      voice.block = 1.0f - kit::kTwoPi * 12.0f / sr;
      const float width = kit::clamp(0.35f * voice.frequency, 45.0f, 420.0f);
      const float a = std::exp(-kit::kTwoPi * width / sr);
      voice.noise_pole = a;
      // Two poles in a row on white noise: the sum of its power, undone.
      const float b = 1.0f - a, c = 1.0f - a * a;
      voice.noise_gain = std::sqrt(c * c * c / (b * b * b * b * (1.0f + a * a)));
    } else if (voice.figure_of != figure_now()) {
      // The rings step back, take their new places and come forward again.
      voice.swap -= swap_step_;
      if (voice.swap <= 0.0f) {
        voice.swap = 0.0f;
        bool silent = true;
        for (int j = 1; j < kRotors; ++j) silent = silent && voice.figure[j] == 0.0f && voice.left[j] == 0.0f && voice.right[j] == 0.0f;
        if (silent) set_figure(voice, false);
      }
    } else if (voice.swap < 1.0f) {
      voice.swap = kit::min(voice.swap + swap_step_, 1.0f);
    }
    if (retune_ && !from_rest) tune(voice);
    set_decay(voice);
    if (voice.strikes) strike(voice, voice.strike_gain);
    step_levels(voice);
    open_rotors(voice, from_rest);
    set_gains(voice);
    set_tone(voice, from_rest);
    if (voice.pending) voice.fade = kit::max(voice.fade - fade_step_, 0.0f);
    place(voice);
    voice.fresh = false;
    // Over: let go and faded, or struck and died away with nothing held.
    if (voice.release < kSilence * 3.0f || (!voice.pending && spent(voice))) {
      voice.to[kAmpLeft] = voice.to[kAmpRight] = 0.0f;
      if (voice.now[kAmpLeft] == 0.0f && voice.now[kAmpRight] == 0.0f && !voice.pending) voice.sounding = false;
    }
    for (int r = 0; r < kRamps; ++r) voice.step[r] = (voice.to[r] - voice.now[r]) * (1.0f / kChunk);
  }

  // Nothing struck is left, and nothing is or will be held.
  bool spent(const Voice& voice) const {
    if (voice.push_left > 0 || voice.revive > 0 || voice.knock > 0.0f) return false;
    const float pad = 1.0f - knob(kStrikeKnob);
    const bool bell = tracery_ == kGoldenBells;
    float most = 0.0f;
    for (int j = 0; j < kRotors; ++j) most = kit::max(most, kit::max(voice.struck[j], pad * (bell ? voice.stay[j] : 1.0f)));
    return most < 1.0e-5f;
  }

  // Broken: every piece of glass is lit and dark in its own time, and the whole
  // window has clouds over it. All 1 where the tracery is whole.
  void weather(Voice& voice) {
    const bool broken = tracery_ == kBroken;
    for (int j = 0; j < kRotors; ++j) {
      voice.pane_at[j] -= tick_seconds_;
      if (voice.pane_at[j] <= 0.0f) {
        const bool lit = voice.rng.uniform() < 0.45f;
        voice.pane_to[j] = lit ? 0.75f + 0.6f * voice.rng.uniform() : 0.05f;
        voice.pane_at[j] += 0.15f + (lit ? 0.5f : 1.1f) * voice.rng.uniform();
      }
      const float target = broken ? (j == 0 ? 0.5f + 0.5f * voice.pane_to[j] : voice.pane_to[j]) : 1.0f;
      voice.pane[j] = voice.fresh ? target : target + (voice.pane[j] - target) * pane_coeff_;
    }
    voice.cloud_at -= tick_seconds_;
    if (voice.cloud_at <= 0.0f) {
      voice.cloud_to = voice.cloud_to > 0.5f ? 0.04f : 1.2f;
      voice.cloud_at += 0.5f + 1.0f * voice.rng.uniform();
    }
    const float target = broken ? voice.cloud_to : 1.0f;
    voice.cloud = voice.fresh ? target : target + (voice.cloud - target) * pane_coeff_;
  }

  void set_gains(Voice& voice) {
    static const float kEvenly[kNumTraceries] = {1.0f, 0.8f, 0.95f, 0.88f};
    const float tilt = std::sqrt(kit::max(knob(kTiltKnob), 0.0f));
    const float pad = 1.0f - knob(kStrikeKnob);
    const float sustained = 0.64f * std::pow(pad, 1.6f) * voice.attack;
    const float spin = turn_hz() * tick_seconds_, against = counter();
    const float swap = smoothstep(voice.swap);
    weather(voice);
    const float lit = voice.cloud * kEvenly[tracery_] * (choice(rose_window::kOrder, kNumOrders) == kPassing ? 0.92f : 1.0f);
    for (int k = 0; k <= kRingCount; ++k) {
      const float speed = k > 0 && k % 2 == 0 ? kit::lerp(1.0f, -1.0f, against) : 1.0f;
      voice.plane[k] = part(voice.plane[k] + spin * speed * voice.pace);
    }
    const float shaped = voice.to[kFoldBy] + voice.to[kCurlBy];
    const float anchor = 0.7f * shaped / (shaped + 1.5f);  // the heart's own share past the fold: a note keeps its note
    float energy = 0.0f, inside = 0.0f, fourth = 0.0f, heard = 0.0f;
    int last = 0;
    for (int j = 0; j < kRotors; ++j) {
      const int k = (j + 1) / 2;
      // The plane: a ring that tips away dims, and leans to a side; the heart
      // brightens as the rings go.
      float angle = voice.plane[k] + (j % 2 ? 0.07f : 0.0f);
      if (k == 0) angle += 0.5f;
      if (k % 2 == 0) angle += 0.5f * against;
      const float depth = j == 0 ? 0.5f * tilt : tilt;
      const float face = 0.5f - 0.5f * kit::SineTable::cos_lookup(angle);
      const float facing = (1.0f - 0.97f * depth * face * (2.0f - face)) * (1.0f + 0.55f * depth);
      const float lean = 1.1f * depth * kit::SineTable::lookup(angle + 0.11f);
      const float weight = j == 0 ? kit::max(weight_[0], 0.75f * voice.lift) : weight_[j];
      const float open = j == 0 ? kit::max(voice.open[0], voice.early) : voice.open[j];
      float level = weight * voice.edge[j] * facing * voice.close[j] * (sustained * voice.stay[j] * voice.soak[j] * open + voice.struck[j]);
      level *= lit * voice.pane[j] * (j > 0 ? swap : 1.0f);
      if (level < 1.0e-8f) level = 0.0f;
      const float meant = weight * (sustained * voice.stay[j] * (0.3f + 0.7f * open) + voice.struck[j]) * lit;
      energy += meant * meant;
      heard += level * level;
      voice.figure_to[j] = level * voice.inside[j];
      const float square = voice.figure_to[j] * voice.figure_to[j];
      inside += square, fourth += square * square;
      float apart = level * (1.0f - voice.inside[j]);
      if (j == 0) apart += anchor * voice.figure_to[0];
      voice.left_to[j] = apart + level * lean;
      voice.right_to[j] = apart - level * lean;
      // A ring that is yet to open turns all the same: where it meets the
      // others does not hang on when it was heard first.
      if (voice.edge[j] > 0.0f && (weight_[j] > 0.0f || weight_to_[j] > 0.0f || voice.figure[j] != 0.0f)) last = j;
      voice.figure_step[j] = (voice.figure_to[j] - voice.figure[j]) * (1.0f / kChunk);
      voice.left_step[j] = (voice.left_to[j] - voice.left[j]) * (1.0f / kChunk);
      voice.right_step[j] = (voice.right_to[j] - voice.right[j]) * (1.0f / kChunk);
    }
    voice.power = inside, voice.energy = energy;
    voice.spread = kit::max(inside * inside - fourth, 0.0f);
    voice.groups = last / 4 + 1;
    voice.follow = kit::max(0.6f * std::sqrt(heard) * voice.touch * voice.release,
                            voice.attack_at < 0.3f && !voice.released() ? 0.2f * voice.gain * voice.release + kSilence : kSilence);
  }

  void set_tone(Voice& voice, bool snap) {
    using namespace rose_window;
    const float sr = sample_rate();
    const float touch = voice.touch;
    static const float kOpenness[kNumTraceries] = {0.0f, 0.65f, 1.2f, 0.4f};  // octaves of light a tracery lets in
    // Light: two poles that follow the key half way and the touch an octave.
    const float light = knob(kLightKnob) + kOpenness[tracery_];
    static const float kOpening[kNumOrders] = {1.4f, -0.8f, 0.5f};
    const float opening = tracery_ == kPointed ? 0.0f : kOpening[choice(kOrder, kNumOrders)] * (voice.opened - 1.0f);  // and the rose as it opens
    const float aim = light + 0.4f * voice.octave + 1.3f * (touch - 0.7f) + opening;
    if (snap || std::fabs(voice.aim - aim) > 0.002f) {
      voice.aim = aim;
      const float cutoff = kit::clamp(std::exp2(aim), 60.0f, 0.45f * sr);
      voice.cutoff = cutoff;
      voice.to[kCut] = 1.0f - std::exp(-kit::kTwoPi * cutoff / sr);
    }
    // Fold and Curl count from the figure's own mean radius and by its own
    // spread: a rose that is nearly a circle folds as a wide one does, a plain
    // circle is left alone, and both give way as it fades.
    const float live = 1.1f * voice.power / (voice.power + 0.012f);
    voice.to[kInverse] = 1.0f / (kit::kTwoPi * kit::max(std::sqrt(voice.spread), kit::max(0.25f * voice.power, 0.004f)));
    voice.to[kMean] = voice.power * voice.to[kInverse];
    const float fold = kMostFold * fold_depth_ * (0.5f + 0.7f * touch) * voice.room * kit::min(live, 1.1f);
    voice.to[kFoldBy] = fold;
    voice.to[kTip] = 0.13f * fold / (fold + 1.2f);  // off the crest, so the first bend of the petals is heard
    voice.to[kMakeup] = 1.0f + 0.45f * fold / (fold + 1.0f);
    voice.to[kCurlBy] = 9.0f * knob(kCurlKnob) * (0.6f + 0.57f * touch) * voice.room * kit::min(live, 1.1f);
    const float gust = 1.0f + 0.4f * voice.gust.next(1);
    const float breath = knob(kBreathKnob) * (0.4f + 0.6f * knob(kBreathKnob));
    const float wind = tracery_ == kBroken ? voice.cloud : 0.0f;
    voice.to[kAir] = 0.8f * breath * gust + 1.2f * voice.knock + 1.1f * breath * voice.chiff + 0.4f * wind;
    voice.to[kWide] = 0.5f + 0.5f * knob(kWidthKnob) * std::sqrt(knob(kWidthKnob));
    voice.to[kTone] = 1.0f - 0.95f * breath;
    voice.to[kHiss] = (0.15f * breath * gust + 0.17f * breath * voice.chiff + 0.3f * voice.knock + 0.09f * wind * voice.attack) * noise_scale_ * kit::clamp(voice.cutoff * 0.0007f, 0.25f, 1.0f) * kit::min(1.3f / voice.even, 1.0f);
    // What Light, Fold and Curl take of the figure's power is given back, most
    // of it, as it is measured; until then, as it is worked out.
    float through = 0.0f, rings = 0.0f;
    const float edge = 1.0f / (voice.cutoff * voice.cutoff);
    for (int j = 0; j < kRotors; ++j) {
      const float pass = weight_[j] * voice.edge[j] / (1.0f + voice.hz[j] * voice.hz[j] * edge);
      through += pass * pass, rings += j > 0 ? pass * pass : 0.0f;
    }
    // Where nearly all of it is past Light or past hearing the heart comes forward.
    voice.lift = smoothstep(1.0f - 20.0f * through), voice.early = smoothstep(1.0f - 500.0f * rings);
    if (snap) {
      voice.went_in = 0.02f;
      voice.came_out = 0.02f * kit::min(through + 0.5f * voice.lift, 1.0f);
    } else {
      voice.went_in = voice.energy * (1.0f - even_coeff_) + voice.went_in * even_coeff_;
      voice.came_out = voice.heard * (1.0f / kChunk) * (1.0f - even_coeff_) + voice.came_out * even_coeff_;
    }
    voice.heard = 0.0f;
    voice.even = kit::clamp(std::pow((voice.went_in + 1.0e-9f) / (voice.came_out + 1.0e-9f), 0.45f), 0.5f, 7.0f);
    voice.went_in = settle_to_zero(voice.went_in), voice.came_out = settle_to_zero(voice.came_out);
    if (snap) {
      for (int r = kInverse; r < kRamps; ++r) voice.now[r] = voice.to[r];
    }
  }

  void place(Voice& voice) {
    // Keys stand a little apart, low to the left.
    const float level = kLevel * (1.1f - 0.36f * weight_[0] * weight_[0]) * voice.even * std::pow(voice.touch, 0.85f) * voice.heft * voice.release * smoothstep(voice.fade);
    const float side = voice.side * knob(kWidthKnob);
    voice.to[kAmpLeft] = level * (1.0f - side);
    voice.to[kAmpRight] = level * (1.0f + side);
  }

  static Vec* lanes(float* from) { return reinterpret_cast<Vec*>(from); }
  static float total(Vec v) { return v[0] + v[1] + v[2] + v[3]; }

  void render_voice(Voice& voice, int n, float* left, float* right) {
    Vec *re = lanes(voice.re), *im = lanes(voice.im);
    const Vec *turn_re = lanes(voice.turn_re), *turn_im = lanes(voice.turn_im);
    Vec *figure = lanes(voice.figure), *gain_left = lanes(voice.left), *gain_right = lanes(voice.right);
    const Vec *figure_step = lanes(voice.figure_step), *left_step = lanes(voice.left_step), *right_step = lanes(voice.right_step);
    alignas(16) float sums[4][kChunk];
    const int groups = voice.groups;
    for (int i = 0; i < n; ++i) {
      Vec fx = {}, fy = {}, px = {}, py = {};
      for (int g = 0; g < groups; ++g) {
        const Vec x = re[g] * turn_re[g] - im[g] * turn_im[g];
        const Vec y = re[g] * turn_im[g] + im[g] * turn_re[g];
        re[g] = x, im[g] = y;
        figure[g] += figure_step[g];
        gain_left[g] += left_step[g];
        gain_right[g] += right_step[g];
        fx += x * figure[g], fy += y * figure[g];
        px += x * gain_left[g], py += y * gain_right[g];
      }
      sums[0][i] = total(fx), sums[1][i] = total(fy);
      sums[2][i] = total(px), sums[3][i] = total(py);
    }
    // The figure folded, curled, breathed on, filtered and placed.
    float heard = voice.heard;
    const float lag = voice.lag_coeff;
    float now[kRamps], step[kRamps];
    for (int r = 0; r < kRamps; ++r) now[r] = voice.now[r], step[r] = voice.step[r];
    const bool shapes = now[kFoldBy] != 0.0f || voice.to[kFoldBy] != 0.0f || now[kCurlBy] != 0.0f || voice.to[kCurlBy] != 0.0f;
    const bool airy = now[kAir] != 0.0f || voice.to[kAir] != 0.0f || now[kHiss] != 0.0f || voice.to[kHiss] != 0.0f;
    const float pole = voice.noise_pole, feed = 1.0f - pole, noise_gain = voice.noise_gain;
    for (int i = 0; i < n; ++i) {
      for (int r = 0; r < kRamps; ++r) now[r] += step[r];
      float x = sums[0][i], y = sums[1][i];
      if (shapes) {
        // How far past the mean radius, in the spreads of this figure, held where a spike is.
        const float far = kit::clamp((x * x + y * y) * now[kInverse] - now[kMean], -0.64f, 0.64f);
        const float fold = now[kMakeup] * kit::SineTable::cos_lookup(16.0f + now[kFoldBy] * far - now[kTip]);
        voice.lag = flush_denormal(voice.lag + lag * (far - voice.lag));
        const float angle = 16.0f + now[kCurlBy] * voice.lag;  // over nothing: the table is not read past its end
        const float c = fold * kit::SineTable::cos_lookup(angle), s = fold * kit::SineTable::lookup(angle);
        const float turned = x * c - y * s;
        y = x * s + y * c;
        x = turned;
      }
      x += sums[2][i];
      y += sums[3][i];
      if (airy) {
        float white[2];
        for (int c = 0; c < 2; ++c) {
          white[c] = voice.rng.bipolar() * 1.7320508f;
          float &first = voice.noise[2 * c], &second = voice.noise[2 * c + 1];
          first = flush_denormal(white[c] * feed + first * pole);
          second = flush_denormal(first * feed + second * pole);
        }
        x = x * (now[kTone] + now[kAir] * noise_gain * voice.noise[1]) + now[kHiss] * white[0];
        y = y * (now[kTone] + now[kAir] * noise_gain * voice.noise[3]) + now[kHiss] * white[1];
      }
      // Light, in two poles, then nothing under the note.
      float out[2];
      for (int c = 0; c < 2; ++c) {
        float &first = voice.low[2 * c], &second = voice.low[2 * c + 1];
        first = flush_denormal(first + now[kCut] * ((c ? y : x) - first));
        second = flush_denormal(second + now[kCut] * (first - second));
        out[c] = voice.y1[c] = flush_denormal(second - voice.x1[c] + voice.block * voice.y1[c]);
        voice.x1[c] = second;
      }
      const float a = out[0], b = out[1];
      heard += a * a + b * b;
      const float wide = now[kWide], narrow = 1.0f - wide;
      left[i] += now[kAmpLeft] * (a * wide + b * narrow);
      right[i] += now[kAmpRight] * (b * wide + a * narrow);
    }
    voice.heard = heard;
    for (int r = 0; r < kRamps; ++r) voice.now[r] = now[r];
  }

  // Stone: the frame all the roses stand in, four soft resonances a side, a
  // little apart. They take over from the open sound as Stone comes up.
  void set_stone() {
    static const float kStones[2][kStoneModes] = {{196.0f, 561.0f, 1187.0f, 2540.0f}, {209.0f, 593.0f, 1121.0f, 2710.0f}};
    static const float kNarrow[kStoneModes] = {4.0f, 11.0f, 12.0f, 10.0f};
    for (int c = 0; c < 2; ++c) {
      for (int m = 0; m < kStoneModes; ++m) stones_[c][m].set(kStones[c][m], kNarrow[m], sample_rate());
    }
  }

  void reset_stones() { for (auto& side : stones_) for (kit::Svf& mode : side) mode.reset(); }

  void frame(float* left, float* right, int n) {
    static const float kShare[kStoneModes] = {1.2f, 2.2f, 2.8f, 2.6f};
    if (stone_to_ == 0.0f && stone_at_ == 0.0f) {
      reset_stones();
      return;
    }
    float at = stone_at_;
    for (int i = 0; i < n; ++i) {
      at += stone_step_;
      const float open = 1.0f - 0.86f * at;
      float* sides[2] = {&left[i], &right[i]};
      for (int c = 0; c < 2; ++c) {
        float sum = 0.0f;
        for (int m = 0; m < kStoneModes; ++m) sum += kShare[m] * stones_[c][m].bandpass(*sides[c]);
        *sides[c] = open * *sides[c] + at * sum;
      }
    }
    stone_at_ = at;
  }

  Voice voices_[kMaxVoices];
  kit::Svf stones_[2][kStoneModes];
  float stone_at_ = 0.0f, stone_to_ = 0.0f, stone_step_ = 0.0f;
  kit::Smoother knobs_[kNumKnobs], volume_;
  kit::IdleGate idle_;
  float weight_[kRotors] = {}, weight_to_[kRotors] = {};
  float tick_seconds_ = 0.00133f, noise_scale_ = 1.0f;
  float even_coeff_ = 0.0f, pane_coeff_ = 0.0f, weight_coeff_ = 0.0f, open_coeff_ = 0.0f, recover_coeff_ = 0.0f, chiff_coeff_ = 0.0f, knock_coeff_ = 0.0f;
  int revive_ticks_ = 1, chunk_left_ = 0, tracery_ = -1;
  uint32_t stamp_ = 0;
  float fold_depth_ = 0.0f, closing_ = 0.0f, closing_gain_ = 1.0f, ride_ = kRest, riding_ = kRest, ride_decay_ = 1.0f, ride_coeff_ = 1.0f, fade_step_ = 1.0f, swap_step_ = 1.0f;
  bool fresh_ = true, retune_ = false;
};

}  // namespace livemix
