#pragma once

// Climbing Gong: a stroke on tuned metal whose energy climbs.
//
//   stroke ─► ground register (6 pairs of modes, the lowest is the key)
//   roll/bow        │  its sum, squared and cubed, with noise: the drive
//                   ▼
//             first rung (4 pairs) ─► second rung (4) ─► third rung (4)
//
//   all keys ─► sum ─► sympathy (a bank tuned to the keys played) ─► volume ─► soft clip
//
// - A mode is one complex number turned and shrunk a little every sample. 36
//   of them make a key (metals.h says where they stand), four at a time.
// - The drive of a rung is made at audio rate from the sums of the registers
//   under it: products of what really sounds there, normalised to the level
//   of the register, and noise under the same gate (Roar). Only what falls on
//   a mode of the rung is heard, because a mode is a narrow filter; the drive
//   itself goes nowhere else, so nothing folds back or sours.
// - How loud a rung may become is a law and not a feedback: Climb times the
//   register below, behind a gate at Threshold, all rungs together under what
//   the ground has. The level slews there over Climb time and back over the
//   rung's ring; a servo on the drive holds the modes to it. What a stroke
//   itself gave a rung rings off under that, and is not damped by it.
// - The climb costs the ground register energy, and Fall back keeps most of
//   it: once the gate shuts it comes down again and the climb starts over.
// - A stroke ramps each mode up along its own phase, so its level is exact at
//   every pitch and sample rate. On a ringing key it goes in a quarter turn
//   from what rings: the two add as power, under a cap. A roll is a row of these.
// - One pitch on one metal is one key, however many note ids hold it.
// - Many keys lean back together, by their power and by what is landing.
//
// All control runs on a 32-sample clock that restarts with the first stroke
// after a silence, so output does not depend on the block size.

#include <initializer_list>

#include "../../kit/kit.h"
#include "beaters.h"
#include "halo.h"
#include "metals.h"
#include "params.gen.h"
#include "voice.h"

namespace livemix {

class ClimbingGong : public kit::DeviceBase<climbing_gong::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kRegisters = climbing_gong_voice::kRegisters;

  void init(float sample_rate) {
    using namespace climbing_gong;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) voice = Voice();
    halo_.init(sr, kChunk);
    stamp_ = 0;
    chunk_left_ = 0;
    level_step_ = 0.0f;
    tuning_serial_ = gain_serial_ = 1;
    dt_ = static_cast<float>(kChunk) / sr;
    steal_step_ = 1.0f / (0.003f * sr);
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    for (kit::Smoother* knob : {&ground_, &width_, &sympathy_}) knob->set_time(0.02f, sr / kChunk);
    volume_.set_time(0.02f, sr);
    lean_down_ = 1.0f - std::exp(-dt_ / 0.001f);
    lean_up_ = 1.0f - std::exp(-dt_ / 0.05f);
    level_ = level_from_ = 1.0f;
    level_fresh_ = false;
    set_knobs(false);
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace climbing_gong;
    if (!store_param(id, value)) return;
    switch (id) {
      case kShimmer: case kLowRing: case kHighRing: case kChoke:
        ++tuning_serial_;
        break;
      case kGround: case kWidth: case kSympathy: case kVolume:
        set_knobs(primed());
        break;
      default:
        break;  // the rest is read once a tick or by the next stroke
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency) || frequency <= 0.0f) return;
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int metal = choice(climbing_gong::kMetal, climbing_gong_metal::kNumMetals);
    if (!sounding()) restart();
    Voice* same = nullptr;
    Voice* waiting = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      const float hz = voice.pending ? voice.pending_hz : voice.frequency;
      const int made_of = voice.pending ? voice.pending_metal : voice.metal;
      if (!same && hz == frequency && made_of == metal) {
        same = &voice;
        continue;
      }
      if (!voice.drop(note_id)) continue;
      if (voice.pending && voice.holders == 0) waiting = &voice;
    }
    if (same) {
      same->hold(note_id);
      same->stamp = ++stamp_;
      if (same->pending) {
        same->pending_gain = together(same->pending_gain, gain);
      } else {
        stroke(*same, gain, false, true);
        same->follow = kit::max(same->follow, kRef * gain);
      }
      return;
    }
    Voice& voice = waiting ? *waiting : voices_[pick()];
    voice.holders = 0;
    voice.hold(note_id);
    voice.stamp = ++stamp_;
    halo_.tune(frequency, metal, stamp_);
    if (voice.sounding) {
      // Out over 3 ms, then struck at the next tick (see control()).
      voice.pending = true;
      voice.pending_hz = frequency;
      voice.pending_gain = gain;
      voice.pending_metal = metal;
      voice.follow = kit::max(kRef * gain, 1.0e-6f);
    } else {
      start(voice, metal, frequency, gain);
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (voice.sounding) voice.drop(note_id);
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(sounding())) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (chunk_left_ == 0) {
        control();
        chunk_left_ = kChunk;
      }
      const int at = kChunk - chunk_left_;
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      float left[kChunk] = {}, right[kChunk] = {}, bus[kChunk] = {};
      for (Voice& voice : voices_) {
        if (voice.sounding) render(voice, n, left, right, bus);
      }
      if (halo_.on()) halo_.render(n, at, left, right, bus);
      for (int i = 0; i < n; ++i) {
        const float held = level_from_ + level_step_ * static_cast<float>(at + i + 1);
        const float volume = volume_.next() * held;
        out_left_[done + i] = kit::soft_clip(left[i] * volume);
        out_right_[done + i] = kit::soft_clip(right[i] * volume);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // How far each register of the newest key is alight, for the plate's face.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (voice.sounding && !voice.pending && (!newest || voice.stamp > newest->stamp)) newest = &voice;
    }
    return newest && index >= 0 && index < kRegisters ? newest->rms[index] * (1.0f / kRef) : 0.0f;
  }

 private:
  using Four = climbing_gong_voice::Four;
  using Voice = climbing_gong_voice::Voice;
  using Touch = climbing_gong_beater::Touch;
  static constexpr int kTones = climbing_gong_voice::kTones;
  static constexpr int kGroundTones = climbing_gong_voice::kGroundTones;
  static constexpr int kModes = climbing_gong_voice::kModes;
  static constexpr int kGroups = climbing_gong_voice::kGroups;
  static constexpr const int* kRegisterGroup = climbing_gong_voice::kRegisterGroup;
  static constexpr int kNumBeaters = climbing_gong_beater::kNumBeaters;
  static constexpr int kBrush = climbing_gong_beater::kBrush;
  static constexpr int kBow = climbing_gong_beater::kBow;
  static constexpr int kChunk = 32;
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 6000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kRef = 0.195f;         // the level of a full stroke's ground register (RMS of both channels' mean)
  static constexpr float kStack = 1.15f;        // the most strokes on a key may pile up to, of a full one
  static constexpr float kFoldHz = 9000.0f;     // tones above this come down by the metal's fold
  static constexpr float kEdgeHz = 11000.0f;    // and are out of the band between these
  static constexpr float kTopHz = 15000.0f;
  static constexpr float kChokeSeconds = 0.15f;
  static constexpr float kSilence = 1.0e-6f;

  int choice(int id, int count) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1); }
  static float together(float a, float b) { return kit::min(std::sqrt(a * a + b * b), 1.0f); }
  static float hit_of(float gain) { return gain * (0.6f + 0.4f * gain); }
  // How a pair shares a tone: the key's is nearly one, so it hardly beats.
  float part(int tone, int half) const {
    const float second = tone == 0 ? 0.14f + 0.05f * param(climbing_gong::kShimmer) : 0.36f;
    return half ? second : 1.0f - second;
  }
  static int register_of(int tone) { return tone < kGroundTones ? 0 : 1 + (tone - kGroundTones) / 4; }
  bool sounding() const {
    for (const Voice& voice : voices_) {
      if (voice.sounding) return true;
    }
    return halo_.alive();
  }

  void set_knobs(bool glide) {
    using namespace climbing_gong;
    const float ground = param(kGround);
    ground_.set(ground < 0.5f ? 2.0f * ground : 0.4f + 1.2f * ground, glide);
    width_.set(param(kWidth), glide);
    sympathy_.set(param(kSympathy), glide);
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
  }

  // The first stroke after a silence: every knob stands where it points and
  // the control clock starts with the sound.
  void restart() {
    set_knobs(false);
    level_fresh_ = true;
    chunk_left_ = 0;
    ++gain_serial_;
    halo_.restart(sympathy_.value);
  }

  // An idle voice, else the quietest let go, else the quietest held, the
  // oldest on a tie; one a stroke already waits in only when there is no other.
  int pick() const {
    int best = -1;
    for (int pass = 0; pass < 4 && best < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0 && voice.sounding) continue;
        if (pass == 1 && (voice.pending || !voice.released())) continue;
        if (pass == 2 && voice.pending) continue;
        if (best < 0) {
          best = v;
          continue;
        }
        const Voice& other = voices_[best];
        const bool older = voice.stamp < other.stamp;
        if (pass == 0 ? older : voice.follow < other.follow || (voice.follow == other.follow && older)) best = v;
      }
    }
    return best;
  }

  // --- strokes -------------------------------------------------------------

  void start(Voice& voice, int metal, float frequency, float gain) {
    const Voice was = voice;
    voice = Voice();
    voice.holders = was.holders;
    for (int i = 0; i < was.holders; ++i) voice.ids[i] = was.ids[i];
    voice.stamp = was.stamp;
    voice.metal = metal;
    voice.frequency = frequency;
    voice.sounding = true;
    voice.turned = kit::hz_to_midi(frequency) * 0.46f;  // a chord's strokes do not pile up in phase
    const uint32_t seed = 0x6C1B0Fu + static_cast<uint32_t>(frequency * 16.0f) * 2654435761u;
    voice.rng.seed(seed);
    voice.hand.seed(seed ^ 0x5BD1E995u);
    for (int r = 0; r < kRegisters; ++r) voice.servo[r] = 1.0f;
    voice.force = voice.cents = 0.0f;
    voice.beater = choice(climbing_gong::kBeater, kNumBeaters);
    tune(voice);
    stroke(voice, gain, true, true);
    gains(voice, true);
    voice.follow = kRef * gain;
  }

  // What a stroke of this beater at this place gives each tone, before its
  // strength: the contact wakes less of what is high, the place tilts and combs.
  void shares(const Voice& voice, const Touch& t, float gain, float* out) const {
    using namespace climbing_gong;
    const climbing_gong_metal::Spec& spec = climbing_gong_metal::spec(voice.metal);
    const float hardness = param(kHardness);
    const float place = param(kPlace);
    const float contact = t.contact * spec.contact * std::pow(9.0f, 0.5f - hardness) * (1.35f - 0.5f * gain);
    const float tilt = -1.5f + 2.6f * place + 1.2f * (hardness - 0.5f) + t.tilt;
    float power = 0.0f, most = 0.0f, above[kRegisters] = {};
    for (int k = 0; k < kTones; ++k) {
      const float ratio = voice.hz[2 * k] / voice.frequency;
      const float x = ratio * contact;
      float share = std::pow(kit::max(ratio, 1.0f), k < kGroundTones ? tilt + 0.6f * spec.lean : 0.6f * (tilt + spec.lean)) / (1.0f + x * x);
      const float comb = std::cos(kit::kPi * (0.31f * (ratio - 1.0f) * place));
      share *= 0.6f + 0.4f * std::fabs(comb);
      if (k < kGroundTones) {
        share *= spec.ground[k];
        most = kit::max(most, share);
        power += 0.5f * share * share * (part(k, 0) * part(k, 0) + part(k, 1) * part(k, 1));
      } else {
        share *= 0.16f * t.upper * (0.35f + 1.3f * hardness) * (0.5f + 0.5f * gain);
      }
      out[k] = share;
      if (k >= kGroundTones) above[register_of(k)] += share * share * 0.28f;
    }
    // Wherever it is touched and with whatever, the key stays the note.
    const float key = kit::max(out[0], 0.42f * most);
    power += 0.5f * (key * key - out[0] * out[0]) * (part(0, 0) * part(0, 0) + part(0, 1) * part(0, 1));
    out[0] = key;
    // A short ring is struck harder, or it would be the quieter for being short.
    const float brief = std::sqrt(std::sqrt(1.0f + 1.2f / ring_of(voice, 1.0f)));
    const float scale = spec.gain * brief * kRef / std::sqrt(power + 1.0e-9f);
    for (int k = 0; k < kTones; ++k) {
      // What goes straight into a rung is never more than the ground.
      const float over = k < kGroundTones ? 0.0f : above[register_of(k)] / (0.4f * power + 1.0e-12f);
      out[k] *= over > 1.0f ? scale / std::sqrt(over) : scale;
    }
  }

  void stroke(Voice& voice, float gain, bool fresh, bool by_hand) {
    using namespace climbing_gong;
    if (!fresh && voice.struck() && voice.pulse_at > 0) {
      // In the middle of a stroke: the next follows it.
      voice.queued_roll = voice.queued > 0.0f ? voice.queued_roll && !by_hand : !by_hand;
      voice.queued = together(voice.queued, gain);
      if (by_hand) voice.gain = kit::max(voice.gain, gain);
      return;
    }
    if (by_hand) {
      if (!fresh && voice.struck()) gain = together(voice.gain, gain);  // two in one block are one
      voice.gain = gain;
      voice.age = 0.0f;
      const int beater = choice(kBeater, kNumBeaters);
      if (beater != voice.beater) voice.tuned = 0;
      voice.beater = beater;
      voice.next_roll = 1.0f / param(kRollSpeed);
    }
    const Touch& t = climbing_gong_beater::touch(voice.beater);
    const float hardness = param(kHardness);
    const float sr = sample_rate();
    float share[kTones];
    shares(voice, t, gain, share);
    // With a roll to come the stroke by hand steps back, and the roll is the attack.
    const float first = by_hand && voice.beater != kBow ? 1.0f - 0.7f * param(kRoll) * std::sqrt(param(kRoll)) : 1.0f;
    const float hit = hit_of(gain) * t.level * first;
    // A stroke of the roll is a part of the level the roll holds.
    // Slow strokes of it are single blows, quick ones hold more together.
    const float pace = std::pow(8.0f / param(kRollSpeed), 0.4f);
    float given_power = 0.0f, direct[kRegisters] = {};
    const float piece = by_hand ? 1.0f : 0.5f * pace + 0.45f / (1.0f + 0.15f * low_of(voice) * param(kRollSpeed));
    for (int k = 0; k < kTones; ++k) {
      for (int half = 0; half < 2; ++half) {
        const int m = 2 * k + half;
        const int g = m >> 2, lane = m & 3;
        const float given = share[k] * part(k, half) * (by_hand || k < kGroundTones ? 1.0f : 0.76f);
        const float amount = given * hit * piece;
        given_power += amount * amount * kit::min(2.0f * voice.edge[m] * voice.edge[m], 1.0f);
        direct[register_of(k)] += 0.5f * amount * amount;
        const float most = given * kStack * (by_hand ? t.level : hit / std::sqrt(pace));
        if (by_hand && k < kGroundTones) voice.share[m] = share[k] * part(k, half);
        const float side = voice.hand.next_u32() & 0x10000u ? amount : -amount;
        const float re = voice.re[g][lane], im = voice.im[g][lane];
        const float ringing = fresh ? 0.0f : std::sqrt(re * re + im * im);
        if (ringing < 1.0e-9f) {
          const float phase = voice.turned + 0.13f * static_cast<float>(k) + (half ? 0.22f * static_cast<float>(k) : 0.0f);
          voice.push_re[g][lane] = amount * kit::SineTable::cos_lookup(phase);
          voice.push_im[g][lane] = amount * kit::SineTable::lookup(phase);
          continue;
        }
        // A quarter turn ahead or behind, or a roll would pull every tone sharp.
        float push_re = -side * im / ringing, push_im = side * re / ringing;
        const float cap = kit::max(most, ringing);
        const float room = std::sqrt(kit::max(cap * cap - amount * amount, 0.0f));
        if (ringing > room) {
          const float less = room / ringing - 1.0f;
          push_re += less * re;
          push_im += less * im;
        }
        voice.push_re[g][lane] = push_re;
        voice.push_im[g][lane] = push_im;
      }
    }
    for (int r = 1; r < kRegisters; ++r) voice.bare[r] = kit::max(voice.bare[r], std::sqrt(direct[r]));
    voice.coming = kit::max(std::sqrt(voice.rms[0] * voice.rms[0] + 0.5f * given_power), voice.coming);
    if (by_hand) {
      // With the key taken away (Ground) what stands above it comes up for it.
      float above = 0.0f, all = 0.0f;
      for (int k = 0; k < kGroundTones; ++k) (k ? above : all) += share[k] * share[k];
      voice.lift = kit::clamp(std::sqrt((all + above) / (above + 1.0e-9f)), 1.0f, 16.0f);
      if (!fresh) voice.gained = 0;
      weigh(voice, t);
    }
    for (int m = 0; m < 2 * kGroundTones; ++m) voice.feed[m >> 2][m & 3] = voice.share[m] * (1.0f / kRef);
    for (int m = 2 * kGroundTones; m < kModes; ++m) voice.feed[m >> 2][m & 3] = voice.weight[m];
    const float size = std::sqrt(kit::clamp(220.0f / voice.frequency, 0.1f, 4.0f));
    const float seconds = t.seconds * std::pow(5.0f, 0.5f - hardness) * (1.3f - 0.5f * gain) * size;
    voice.pulse_at = 0;
    for (int r = 1; r < kRegisters; ++r) voice.lively[r] = true;
    voice.pulse_length = kit::clamp_int(static_cast<int>(kit::clamp(seconds, 0.0004f, by_hand ? 0.4f : 0.05f) * sr + 0.5f), 8, 1 << 20);
    if (t.knock > 0.0f) {
      const float amount = t.knock * kRef * (by_hand ? gain : kit::max(gain, 0.4f)) * hit_of(gain) * piece * (0.25f + 1.5f * hardness * hardness);
      voice.contact.set(kit::clamp(t.knock_hz * (0.6f + 0.8f * hardness) / size, 90.0f, 5200.0f), 0.8f, sr);
      voice.knock = kit::max(voice.knock, amount * 4.0f * noise_scale_);
      voice.knock_decay = std::exp(-kSixtyDb / ((voice.beater == climbing_gong_beater::kWood ? 0.022f : 0.06f) * size * sr));
    }
    if (voice.beater == kBrush && by_hand) sweep(voice, gain, hardness);
  }

  // How the rungs share what climbs, and how far each may come: by the place
  // and the beater of the last stroke by hand.
  void weigh(Voice& voice, const Touch& t) {
    using namespace climbing_gong;
    const climbing_gong_metal::Spec& spec = climbing_gong_metal::spec(voice.metal);
    const float place = param(kPlace), hardness = param(kHardness);
    const float bright = std::exp2(2.0f * (place - 0.42f) + 1.6f * (hardness - 0.5f));
    voice.rushing.set(kit::clamp(voice.frequency * 9.0f * bright, 700.0f, 5200.0f), 0.6f, sample_rate());
    for (int r = 1; r < kRegisters; ++r) {
      const int first = kGroundTones + 4 * (r - 1);
      float power = 0.0f;
      for (int k = first; k < first + 4; ++k) {
        const float w = std::pow(voice.hz[2 * k] / voice.hz[2 * first], -3.4f + 6.0f * place + 2.4f * (hardness - 0.5f)) * ((k + r) & 1 ? 1.0f : 1.15f - 0.5f * place);
        voice.weight[2 * k] = w;
        voice.weight[2 * k + 1] = 0.8f * w;
        power += 1.64f * w * w;
      }
      const float scale = std::sqrt(2.0f / power);
      for (int m = 2 * first; m < 2 * first + 8; ++m) voice.weight[m] *= scale;
      voice.reach[r] = t.reach[r - 1] * spec.reach[r - 1] *
                       std::pow(1.2f + 1.8f * static_cast<float>(r), hardness - 0.5f) *
                       std::pow(1.1f + 0.8f * static_cast<float>(r), place - 0.3f);
      static const float kMost[kRegisters] = {1.0f, 3.2f, 5.0f, 8.0f};
      voice.reach[r] = kit::clamp(voice.reach[r], 0.1f, kMost[r]);
    }
  }

  // The brush is a stretch of noise drawn over the metal, and goes round again
  // for as long as the key is held.
  void sweep(Voice& voice, float gain, float hardness) {
    const float sr = sample_rate();
    voice.sweep_seconds = 1.1f - 0.7f * hardness;
    voice.sweep_at = 0.0f;
    const float base = 2.6f * kRef * hit_of(gain) / (0.577f * std::sqrt(voice.sweep_seconds * 0.5f * sr));
    voice.sweep[0] = base * 0.45f;
    // The brush lies on the ground; what it wakes above is Climb's to say.
    const float up = 0.15f + 0.7f * param(climbing_gong::kClimb);
    voice.sweep[1] = base * up * (0.35f + 0.35f * hardness);
    voice.sweep[2] = base * up * (0.28f + 0.6f * hardness);
    voice.sweep[3] = base * up * (0.17f + 0.36f * hardness);
    voice.air.set(kit::clamp(1900.0f + 2600.0f * hardness, 800.0f, 5000.0f), 0.7f, sr);
  }

  // --- pitch, ring and place -----------------------------------------------

  // The ring of a tone to -60 dB: the key's is Low ring, the top's High ring,
  // between them by how many octaves up the tone stands.
  float low_of(const Voice& voice) const {
    return param(climbing_gong::kLowRing) * climbing_gong_metal::spec(voice.metal).low_ring *
           climbing_gong_beater::touch(voice.beater).ring;
  }
  float ring_of(const Voice& voice, float ratio) const {
    using namespace climbing_gong;
    const climbing_gong_metal::Spec& spec = climbing_gong_metal::spec(voice.metal);
    const float low = low_of(voice);
    const float wanted = param(kHighRing) * spec.high_ring;
    const float high = wanted / (1.0f + wanted / (8.0f * low));  // the top leans on the bottom and never stops moving with its knob
    const float up = kit::clamp(std::log2(kit::max(ratio, 1.0f)) * 0.22f, 0.0f, 1.0f);
    const float size = std::pow(kit::clamp(220.0f / voice.frequency, 0.05f, 6.0f), 0.3f);
    return low * std::pow(high / low, std::pow(up, 0.7f)) * size;
  }

  void tune(Voice& voice) {
    using namespace climbing_gong;
    const climbing_gong_metal::Spec& spec = climbing_gong_metal::spec(voice.metal);
    const float sr = sample_rate();
    const float split = param(kShimmer) * spec.split * 0.5f;
    const float top = kit::min(kTopHz, 0.45f * sr);
    const float low = low_of(voice);
    float choke = 0.0f;
    if (voice.released()) {
      const float seconds = low * std::pow(kit::min(kChokeSeconds / low, 1.0f), std::pow(param(kChoke), 1.2f));
      choke = kSixtyDb / seconds - kSixtyDb / low;
    }
    for (int k = 0; k < kTones; ++k) {
      float ratio = spec.ratio[k];
      while (k >= kGroundTones && voice.frequency * ratio > kFoldHz && ratio > 2.0f * spec.fold) ratio /= spec.fold;
      const float centre = voice.frequency * ratio;
      // The split grows slowly up the metal, never past a fortieth of a tone's pitch.
      const float away = kit::min(split * std::pow(ratio, 0.6f), centre * 0.0125f);
      const float nepers = (kSixtyDb / ring_of(voice, ratio) + choke) / sr;
      for (int half = 0; half < 2; ++half) {
        const int m = 2 * k + half;
        // The key's first half is the key; of the others the middle by level is on the tone.
        float off = half ? -1.0f : 1.0f;
        if (k == 0) off = half ? -2.0f : 0.0f;
        if (k > 0 && k < kGroundTones) off = half ? -2.0f * part(k, 0) : 2.0f * part(k, 1);
        const float hz = centre + off * away;
        voice.hz[m] = hz;
        voice.natural[m >> 2][m & 3] = nepers;
        const float edge = kit::clamp((top - hz) * (1.0f / (kTopHz - kEdgeHz)), 0.0f, 1.0f);
        const float soft = hz * (1.0f / 2600.0f);
        voice.edge[m] = edge / std::sqrt(1.0f + soft * soft);
      }
    }
    turn(voice);
    voice.tuned = tuning_serial_;
    voice.tuned_released = voice.released();
    voice.gained = 0;
  }

  void turn(Voice& voice) {
    const float bent = kit::cents_to_ratio(voice.cents) * kit::kTwoPi / sample_rate();
    for (int m = 0; m < kModes; ++m) {
      const float w = voice.hz[m] * bent;
      const bool there = voice.edge[m] > 0.0f;
      voice.turn_re[m >> 2][m & 3] = there ? std::cos(w) : 0.0f;
      voice.turn_im[m >> 2][m & 3] = there ? std::sin(w) : 0.0f;
    }
  }

  // One half of a pair stays near the middle and the other goes to a side and
  // past it into opposite polarity, so a beating pair turns between the
  // speakers; the rungs lean to alternate sides as well.
  void gains(Voice& voice, bool snap) {
    const float width = width_.value * climbing_gong_metal::spec(voice.metal).wide;
    for (int k = 0; k < kTones; ++k) {
      const bool key = k == 0;
      const float level = key ? ground_.value : (k < kGroundTones ? 1.0f + (voice.lift - 1.0f) * kit::max(1.0f - ground_.value, 0.0f) : 1.0f);
      const float turn = (key ? 0.6f : 0.62f) * kit::kHalfPi * width;
      const float near = kit::kSqrtHalf * (std::cos(turn) + std::sin(turn));
      const float far = kit::kSqrtHalf * (std::cos(turn) - std::sin(turn));
      float middle_left, middle_right;
      kit::pan_gains((key ? 0.0f : (k & 1 ? 0.7f : -0.7f)) * width, &middle_left, &middle_right);
      for (int half = 0; half < 2; ++half) {
        const int m = 2 * k + half;
        const bool flip = ((k >> 1) & 1) != 0;
        voice.left_to[m >> 2][m & 3] = level * voice.edge[m] * (half ? (flip ? far : near) : middle_left);
        voice.right_to[m >> 2][m & 3] = level * voice.edge[m] * (half ? (flip ? near : far) : middle_right);
      }
    }
    for (int g = 0; g < kGroups; ++g) {
      if (snap) {
        voice.left[g] = voice.left_to[g];
        voice.right[g] = voice.right_to[g];
      }
      voice.left_step[g] = (voice.left_to[g] - voice.left[g]) * (1.0f / kChunk);
      voice.right_step[g] = (voice.right_to[g] - voice.right[g]) * (1.0f / kChunk);
    }
    voice.ramping = !snap;
    voice.gained = gain_serial_;
  }

  // --- every kChunk samples ------------------------------------------------

  void control() {
    bool moved = false;
    for (kit::Smoother* knob : {&ground_, &width_}) {
      if (knob->settled()) continue;
      knob->next();
      moved = true;
    }
    if (moved) ++gain_serial_;
    sympathy_.next();
    float power = 0.0f;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (voice.ramping) {
        for (int g = 0; g < kGroups; ++g) {
          voice.left[g] = voice.left_to[g];
          voice.right[g] = voice.right_to[g];
        }
        voice.ramping = false;
      }
      if (voice.pending) {
        if (voice.steal <= 0.0f) start(voice, voice.pending_metal, voice.pending_hz, voice.pending_gain);
      } else {
        control_voice(voice);
      }
      for (int r = 1; r < kRegisters; ++r) power += voice.rms[r] * voice.rms[r];
      // A stroke is counted as it lands and not once it is there.
      if (!voice.struck()) voice.coming = 0.0f;
      const float low = kit::max(voice.rms[0], voice.coming);
      power += 0.35f * voice.rush * voice.rush + 0.1f * voice.knock * voice.knock + low * low * kit::max(ground_.value * ground_.value, 1.0f);
    }
    // Every key has the energy its stroke gave it; many at once lean back together.
    const float lean = 1.0f / std::sqrt(1.0f + power * (1.0f / (kRef * kRef * 1.9f)));
    level_from_ = level_fresh_ ? lean : level_;
    level_ = level_from_ + (lean - level_from_) * (lean < level_from_ ? lean_down_ : lean_up_);
    level_fresh_ = false;
    level_step_ = (level_ - level_from_) * (1.0f / kChunk);
    bool keys = false;
    for (const Voice& voice : voices_) keys = keys || voice.sounding;
    halo_.control(sympathy_.value, param(climbing_gong::kLowRing), keys);
  }

  void measure(Voice& voice) {
    for (int r = 0; r < kRegisters; ++r) {
      Four total = {};
      for (int g = kRegisterGroup[r]; g < kRegisterGroup[r + 1]; ++g) {
        const Four power = voice.re[g] * voice.re[g] + voice.im[g] * voice.im[g];
        total += power;
        for (int lane = 0; lane < 4; ++lane) {
          if (power[lane] < 1.0e-22f) voice.re[g][lane] = voice.im[g][lane] = 0.0f;
        }
      }
      voice.rms[r] = std::sqrt(0.5f * (total[0] + total[1] + total[2] + total[3]));
    }
  }

  static float gate(float x) {
    const float x2 = x * x;
    return x2 * x2 / (1.0f + x2 * x2);
  }

  void control_voice(Voice& voice) {
    using namespace climbing_gong;
    measure(voice);
    voice.age += dt_;
    const float rate = 1.0f / sample_rate();
    const bool held = !voice.released();
    if (!voice.struck() && voice.queued > 0.0f) {
      const float gain = voice.queued;
      const bool by_hand = !voice.queued_roll;
      voice.queued = 0.0f;
      stroke(voice, gain, false, by_hand);
    }
    roll(voice, held);
    if (voice.tuned != tuning_serial_ || voice.tuned_released != voice.released()) tune(voice);

    // The pull of force on pitch: it comes on in 10 ms and goes as the metal dies down.
    const float u = voice.rms[0] * (1.0f / kRef);
    voice.force += (kit::min(u, 1.2f) - voice.force) * kit::min(dt_ * (u > voice.force ? 100.0f : 20.0f), 1.0f);
    const float cents = param(kBend) * voice.force * (0.5f + 0.5f * kit::min(voice.force, 1.0f));
    if (std::fabs(cents - voice.cents) > 0.04f || (cents == 0.0f && voice.cents != 0.0f)) {
      voice.cents = cents;
      turn(voice);
    }
    if (voice.gained != gain_serial_) gains(voice, false);

    // The law of the climb: what each rung may come to.
    const float climb = param(kClimb);
    const float back = param(kFallBack);
    const float energy = u * u;
    const float threshold = 0.07f * std::pow(10.5f, param(kThreshold));
    const climbing_gong_metal::Spec& spec = climbing_gong_metal::spec(voice.metal);
    const float climb_time = kit::max(param(kClimbTime) * spec.pace, 0.1f);
    const float rush = kit::max(spec.rush, climbing_gong_beater::touch(voice.beater).rush);
    const float roar = param(kRoar) + 0.5f * rush * (1.0f - param(kRoar));
    static const float kShare[kRegisters] = {0.0f, 1.75f, 1.3f, 0.95f};
    static const float kGate[kRegisters] = {0.0f, 1.0f, 0.85f, 0.85f};
    static const float kPace[kRegisters] = {0.0f, 1.0f, 0.75f, 0.6f};
    static const float kWide[kRegisters] = {0.0f, 40.0f, 110.0f, 260.0f};
    const float wide_open = gate(u / (threshold * (voice.lit ? 0.65f : 1.0f)));
    voice.shut += ((voice.falling ? 1.0f : 0.0f) - voice.shut) * (1.0f - std::exp(-dt_ / (0.06f + 0.15f * climb_time)));
    if (voice.shut < 1.0e-8f) voice.shut = 0.0f;
    const float open = wide_open * (1.0f - voice.shut * kit::min(1.5f * back, 1.0f));
    if (wide_open > 0.7f) voice.lit = true;
    if (wide_open < 0.3f) voice.lit = false;
    float aims[kRegisters] = {}, asked = 0.0f;
    float extra[kRegisters] = {};  // nepers a sample on top of the natural ring
    // A top that rings on gathers more of what comes up.
    const float gathers = std::pow(param(kHighRing) * (1.0f / 2.6f), 0.1f);
    float gathered = 1.0f;
    for (int r = 1; r < kRegisters; ++r) {
      gathered *= gathers;
      const float own = r == 1 ? 1.0f : voice.reach[r - 1];
      const float below = kit::min(voice.rms[r - 1] / (kRef * own), 1.2f);
      const float opened = r == 1 ? open : gate(below / (threshold * kGate[r]));
      const float reach = climb * (0.45f + 0.75f * climb) * kShare[r] * (1.0f + 0.25f * static_cast<float>(r) * roar * roar);
      aims[r] = voice.pending ? 0.0f
                : kRef * kit::min(reach * below * (r == 1 ? 0.45f + 0.75f * below : 1.0f), 1.5f) * opened * voice.reach[r] * gathered;
      asked += aims[r] * aims[r];
    }
    // All the rungs together never have more than the ground has, or a little more.
    const float has = kRef * kit::min(u, 1.2f) * (0.5f + 0.8f * climb);
    const float granted = asked > has * has ? has / std::sqrt(asked) : 1.0f;
    for (int r = 1; r < kRegisters; ++r) {
      const float aim = kit::min(aims[r] * granted, 1.3f * kRef);
      const float ring = kit::max(1.0f / (voice.natural[kRegisterGroup[r]][0] * sample_rate()), 0.01f);
      const float pace = aim > voice.target[r] ? climb_time * kPace[r] : (voice.falling ? kit::min(ring, 0.15f + 0.3f * climb_time) : ring);
      voice.target[r] += (aim - voice.target[r]) * (1.0f - std::exp(-dt_ / pace));
      if (voice.target[r] < 1.0e-12f) voice.target[r] = 0.0f;
      // What the stroke itself gave a rung rings off by itself under what climbs.
      voice.bare[r] *= std::exp(-voice.natural[kRegisterGroup[r]][0] * static_cast<float>(kChunk));
      if (voice.bare[r] < 1.0e-7f) voice.bare[r] = 0.0f;
      const bool climbing = voice.target[r] > 1.0e-7f && !voice.struck();
      const float goal = climbing ? kit::max(voice.target[r], voice.bare[r]) : voice.target[r], is = voice.rms[r];
      const float bandwidth = (2.5f + 3.0f / (0.2f + climb_time) * 0.2f + kWide[r] * roar * roar) * rate;
      const float act = kit::min(2.0f * goal / (is + 1.0e-7f), 1.0f);
      extra[r] = bandwidth * act;
      if (goal > 1.0e-7f) {
        voice.servo[r] *= std::exp(kit::clamp((goal - is) / goal, -4.0f, 1.0f) * 8.0f * dt_);
        voice.servo[r] = kit::clamp(voice.servo[r], 0.1f, 40.0f);
      } else {
        voice.servo[r] += (1.0f - voice.servo[r]) * kit::min(2.0f * dt_, 1.0f);
      }
      const float drive = goal > 1.0e-7f ? bandwidth * goal * voice.servo[r] : 0.0f;
      ramp(drive * 3.2f * std::cos(roar * kit::kHalfPi), &voice.drive_tone[r], &voice.tone_step[r]);
      ramp(drive * (0.10f + 0.90f * std::sin(roar * kit::kHalfPi)) * 1.733f * std::sqrt(2.0f / bandwidth),
           &voice.drive_noise[r], &voice.noise_step[r]);
      voice.lively[r] = goal > 1.0e-7f || is > 1.0e-7f || voice.struck() || voice.sweep_level > 0.0f;
    }
    // The rush: air between the tones of the upper rungs, under the same law.
    ramp(0.6f * roar * roar * roar * (0.5f * voice.target[1] + voice.target[2] + 0.8f * voice.target[3]) * noise_scale_,
         &voice.rush, &voice.rush_step);
    for (int r = 0; r < kRegisters; ++r) {
      ramp(1.0f / (voice.rms[r] + 1.0e-3f * kRef), &voice.norm[r], &voice.norm_step[r]);
    }

    // What the climb costs the ground, and what comes down again. While it
    // climbs the ground's energy goes into the purse; once Fall back of it is
    // up there the gate shuts, it all comes down, and the climb starts over.
    const float cost = std::sqrt(climb) * open * (0.10f + 2.6f * back * (0.3f + 0.7f * back) / (0.4f + 0.6f * climb_time));
    extra[0] = 0.5f * cost * rate;
    voice.purse += cost * energy * dt_ * 0.97f * kit::min(4.0f * back, 1.0f);
    voice.purse *= std::exp(-kit::min(2.0f * voice.natural[0][0] * static_cast<float>(kChunk), 0.7f * dt_));
    const float whole = energy + voice.purse;
    if (!voice.falling && back > 0.02f && voice.purse > (0.08f + 0.68f * back) * whole) voice.falling = true;
    if (voice.falling && voice.purse < 0.06f * whole) voice.falling = false;
    const float give = voice.falling || open < 0.3f ? voice.purse / (0.3f + 0.35f * climb_time) : 0.0f;
    if (voice.purse > 1.0e-8f && energy > 1.0e-8f) {
      // No more of it than the ground had from its stroke.
      const float had = hit_of(voice.gain);
      const float room = kit::clamp(3.0f * (1.0f - energy / (1.1f * had * had + 1.0e-6f)), 0.0f, 1.0f);
      const float pump = kit::min(0.5f * give / energy, 6.0f);
      extra[0] -= pump * room * rate;
      voice.purse = kit::max(voice.purse - 2.0f * pump * energy * dt_, 0.0f);
    } else if (voice.purse <= 1.0e-8f) {
      voice.purse = 0.0f;
      voice.falling = false;
    }
    bow(voice, held);
    sweep_on(voice, held);
    steps(voice, extra, held);

    const float all = std::sqrt(voice.rms[0] * voice.rms[0] + voice.rms[1] * voice.rms[1] +
                                voice.rms[2] * voice.rms[2] + voice.rms[3] * voice.rms[3]);
    const bool going = voice.struck() || voice.queued > 0.0f || voice.knock > 0.0f || voice.sweep_level > 0.0f ||
                       (held && (voice.beater == kBow || voice.beater == kBrush || param(kRoll) > 0.0f) && voice.gain > 0.0f);
    voice.follow = voice.struck() ? kit::max(voice.follow, all) : all;
    if (voice.knock > 0.0f && voice.knock < 1.0e-6f) {
      voice.knock = 0.0f;
      voice.contact.reset();
    }
    if (!going && all < kSilence) {
      voice.sounding = false;
      voice.follow = 0.0f;
      voice.holders = 0;
    }
  }

  static void ramp(float to, float* value, float* step) {
    // The value arrives a tick later; the ramp starts where the last one ended.
    *step = (to - *value) * (1.0f / kChunk);
    if (std::fabs(*step) < 1.0e-20f) {
      *step = 0.0f;
      *value = to;
    }
  }

  void roll(Voice& voice, bool held) {
    using namespace climbing_gong;
    const float strength = std::pow(param(kRoll), 0.6f);
    if (!held || strength <= 0.0f || voice.beater == kBow) {
      voice.next_roll = 1.0f / param(kRollSpeed);
      return;
    }
    voice.next_roll -= dt_;
    if (voice.next_roll > 0.0f) return;
    const float swell = 1.0f - std::exp(-voice.age * 2.2f / param(kRollSwell));
    const float loose = 0.82f + 0.18f * voice.hand.bipolar();
    voice.next_roll += (1.0f + 0.13f * voice.hand.bipolar()) / param(kRollSpeed);
    const float gain = voice.gain * strength * swell * loose;
    if (gain > 0.003f) stroke(voice, gain, false, false);
  }

  // The bow adds to what is under its level, along the mode's own phase.
  void bow(Voice& voice, bool held) {
    using namespace climbing_gong;
    float air = 0.0f;
    voice.bow_level = 0.0f;
    if (held && voice.beater == kBow) {
      // What has gone up leaves the bow less to hold.
      const float spent = voice.purse / (hit_of(voice.gain) * hit_of(voice.gain) + 0.01f);
      voice.bow_level = hit_of(voice.gain) * 0.85f / (1.0f + 3.0f * spent);
      const float hardness = param(kHardness);
      const float rise = 1.0f - std::exp(-voice.age * (2.0f + 5.0f * hardness));
      air = rise * kRef * hit_of(voice.gain) * (0.02f + 0.09f * hardness) * noise_scale_;
      voice.air.set(kit::clamp(900.0f + 2000.0f * hardness + voice.frequency, 900.0f, 4500.0f), 0.8f, sample_rate());
    }
    ramp(air, &voice.bow_air, &voice.air_step);
  }

  void sweep_on(Voice& voice, bool held) {
    float level = 0.0f;
    if (voice.sweep_seconds > 0.0f) {
      voice.sweep_at += dt_;
      const float rise = kit::clamp(voice.sweep_at / (0.18f * voice.sweep_seconds), 0.0f, 1.0f);
      const float left = 1.0f - voice.sweep_at / (voice.sweep_seconds * 1.6f);
      if (left <= 0.0f) {
        voice.sweep_seconds = 0.0f;
        if (held && voice.beater == kBrush) {
          sweep(voice, voice.gain * (0.57f + 0.1f * voice.hand.bipolar()), param(climbing_gong::kHardness));
          voice.sweep_at = -0.15f * voice.sweep_seconds * voice.hand.uniform();
        }
      } else if (voice.sweep_at > 0.0f) {
        level = rise * rise * (3.0f - 2.0f * rise) * left * left;
      }
    }
    ramp(level, &voice.sweep_level, &voice.sweep_step);
  }

  // The turn of every mode for this tick, with its losses (or its gains).
  void steps(Voice& voice, const float* extra, bool held) {
    using namespace climbing_gong;
    const float pace = 1.0f / (sample_rate() * 0.32f * std::pow(4.0f, 0.5f - param(kHardness)));
    const bool bowed = held && voice.bow_level > 0.0f;
    for (int r = 0; r < kRegisters; ++r) {
      const bool quiet = r > 0 && !voice.lively[r];
      for (int g = kRegisterGroup[r]; g < kRegisterGroup[r + 1]; ++g) {
        if (quiet) voice.re[g] = voice.im[g] = Four{};
        Four loss = voice.natural[g] + extra[r];
        if (r == 0 && bowed) {
          for (int lane = 0; lane < 4; ++lane) {
            const float goal = voice.share[4 * g + lane] * voice.bow_level;
            const float re = voice.re[g][lane], im = voice.im[g][lane];
            const float is = std::sqrt(re * re + im * im);
            if (goal <= 0.0f || is >= goal) continue;
            if (is < 1.0e-3f * goal) {
              voice.re[g][lane] += 1.0e-3f * goal;
              continue;
            }
            loss[lane] -= kit::min((goal - is) / is, 3.0f) * pace;
          }
        }
        const Four radius = 1.0f - loss + 0.5f * loss * loss;
        voice.step_re[g] = radius * voice.turn_re[g];
        voice.step_im[g] = radius * voice.turn_im[g];
      }
    }
  }

  // --- every sample --------------------------------------------------------

  void render(Voice& voice, int n, float* left, float* right, float* bus) {
    const bool struck = !voice.pending && voice.struck();
    // Registers that are alight come one after another from the bottom or not at all.
    int groups = kRegisterGroup[1];
    for (int r = 1; r < kRegisters; ++r) {
      if (voice.lively[r]) groups = kRegisterGroup[r + 1];
    }
    float out_left[kChunk], out_right[kChunk];
    if (struck) voice.run<true>(n, groups, out_left, out_right);
    else voice.run<false>(n, groups, out_left, out_right);
    if (voice.knock > 0.0f) {
      for (int i = 0; i < n; ++i) {
        const float x = voice.contact.bandpass(voice.hand.bipolar() * voice.knock);
        voice.knock *= voice.knock_decay;
        out_left[i] += x;
        out_right[i] += x;
      }
    }
    if (voice.pending) {
      for (int i = 0; i < n; ++i) {
        voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
        out_left[i] *= voice.steal;
        out_right[i] *= voice.steal;
      }
    }
    for (int i = 0; i < n; ++i) {
      left[i] += out_left[i];
      right[i] += out_right[i];
      bus[i] += 0.5f * (out_left[i] + out_right[i]);
    }
  }

  Voice voices_[kMaxVoices];
  ClimbingGongHalo halo_;
  kit::Smoother ground_, width_, sympathy_;  // once a tick
  kit::Smoother volume_;                     // every sample
  kit::IdleGate idle_;
  uint32_t tuning_serial_ = 1, gain_serial_ = 1;
  uint32_t stamp_ = 0;
  bool level_fresh_ = false;
  int chunk_left_ = 0;
  float level_ = 1.0f, level_from_ = 1.0f, level_step_ = 0.0f, lean_down_ = 1.0f, lean_up_ = 1.0f;
  float dt_ = 0.0f, steal_step_ = 0.0f, noise_scale_ = 1.0f;
};

}  // namespace livemix
