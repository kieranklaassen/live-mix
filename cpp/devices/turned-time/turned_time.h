#pragma once

// Turned Time: a sound is a function of its own local time, and that time can
// be turned over while it sounds.
//
//   key ─► glass: place u ─► levels(u) ─► 24 partials, left bank ─┐
//          (-1.8 … 0 … 1.8)  bend(u)      24 partials, right bank ├─► envelope ─► sum
//            ▲ speed v       noise(u)     strike, air, sand noise │
//            └ turned by keys,            8 small modes that the  ┘
//              by emptiness or by letting go   grains fall on
//
//   all keys ─► volume ─► soft clip ─► out
// - u is 0 at the neck, where the sound begins, and leaves it on either side.
//   Its speed v (1 is one Sand) closes on the way the glass stands, at a rate
//   set by Inertia. A glass that is empty turns itself, whatever the rule, so
//   a lone key always comes back.
// - Levels are worked out from |u| once a tick, in dB: the body's level, less
//   what Depth takes by Pour's curve, plus the strike's brightness, plus
//   Exchange, a wave over the partials along the sand. So walking back is
//   walking the same path. The phases never turn: pitch stays what it is.
// - The neck: Soften rounds |u| so that a return never reaches the strike;
//   Strike knocks and brightens; Hover lets time run slow near the neck, with
//   a small wandering so that it never stands; Pass gives the two sides of
//   the neck different weights of the same partials.
// - Split lets a group of partials read the sand from the other end.
// - Two banks, one to an ear, a little apart in pitch (Beat) and in local time
//   (Ears). Within a pair one half is weaker, and it alternates, so the mono
//   sum shimmers and does not vanish.
// - Grains are impulses at a rate that follows |v|, on eight small decaying
//   modes; the sand stops when time stops.
// - A key struck again, and a choice that changes under a sounding key, start
//   from the levels the partials have and cross over: nothing jumps.
//
// All control runs on a 64-sample clock that restarts, with every smoothed
// knob in its place, when a key finds no glass sounding; so the output does
// not depend on the block size. Asleep when every key has died away.

#include <cstring>

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

namespace turned_time {

typedef float Four __attribute__((vector_size(16)));

// 2^x within 2e-4 of its value, for x from -100 to 20.
inline float quick_exp2(float x) {
  const float whole = std::floor(x);
  const float f = x - whole;
  const float part = 1.0f + f * (0.6951786f + f * (0.2261698f + f * 0.0786516f));
  const int32_t bits = (static_cast<int32_t>(whole) + 127) << 23;
  float power;
  std::memcpy(&power, &bits, sizeof power);
  return power * part;
}

// sin(2 pi x), good to 1e-3: what a slow wave of levels needs.
inline float quick_sine(float x) {
  x -= std::floor(x);
  x = x * 2.0f - 1.0f;
  const float y = -4.0f * x * (1.0f - (x < 0.0f ? -x : x));
  return y * (0.775f + 0.225f * (y < 0.0f ? -y : y));
}

}  // namespace turned_time

class TurnedTime : public kit::DeviceBase<turned_time::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kPartials = 24;
  static constexpr int kSlots = 2 * kPartials;
  static constexpr int kGrainModes = 8;
  static constexpr int kHolders = 8;
  enum Body : int { kBell = 0, kBar, kString, kSkin, kGlass, kReed, kNumBodies };
  enum Turn : int { kNewKey = 0, kEmptyGlass, kLetGo };
  enum Neck : int { kSoften = 0, kStrikeNeck, kHover, kPass };
  enum Meter : int { kMeterPlace = 0, kMeterWay, kMeterLevel };

  void init(float sample_rate) {
    using namespace turned_time;
    kit::SineTable::init();
    table(0);
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) voice = Voice();
    stamp_ = 0;
    shape_serial_ = walk_serial_ = choice_serial_ = 1;
    dt_ = static_cast<float>(kChunk) / sr;
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    ease_ = 1.0f - std::exp(-dt_ / 0.1f);
    ramp_ = 1.0f - std::exp(-dt_ / 0.004f);
    burst_rise_ = 1.0f - std::exp(-dt_ / 0.0025f);
    touch_rise_ = 1.0f - std::exp(-dt_ / 0.02f);
    flash_decay_ = std::exp(-dt_ / 0.14f);
    touch_decay_ = std::exp(-dt_ / 0.28f);
    for (kit::Smoother& knob : knobs_) knob.set_time(kKnobSeconds, sr / static_cast<float>(kChunk));
    volume_.set_time(0.02f, sr);
    restart();
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace turned_time;
    if (id < 0 || id >= kNumParams) return;
    const float before = param(id);
    if (!store_param(id, value)) return;
    if (id == kTurn || id == kNeck) {
      if (choice(id) != static_cast<int>(before + 0.5f)) ++choice_serial_, ++walk_serial_;
    } else if (id != kBody && id != kAttack) {  // those two are for the next key
      set_knobs(primed());
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace turned_time;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (count_sounding() == 0) restart();

    // Every glass this id held is let go; a glass of this pitch is struck again.
    Voice* same = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      const float hz = voice.pending ? voice.pending_hz : voice.hz;
      if (!same && hz == frequency) same = &voice;
      if (voice.drop(note_id) && &voice != same && !voice.pending) let_go(voice);
    }
    if (choice(kTurn) == kNewKey) turn_the_others(frequency, same);
    const int order = take_order();
    Voice& voice = same ? *same : voices_[pick()];
    const bool taken = !same && voice.sounding;
    if (taken) voice.holders = 0;
    voice.hold(note_id);
    voice.stamp = ++stamp_;
    if (taken || (same && (voice.pending || voice.body != choice(kBody)))) {
      voice.pending = true;
      voice.pending_hz = frequency;
      voice.pending_gain = gain;
      voice.pending_order = order;
      voice.level = kLevel * gain;
    } else {
      start(voice, frequency, gain, order, same != nullptr);
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (!voice.sounding || !voice.drop(note_id) || voice.holders > 0) continue;
      if (!voice.pending) let_go(voice);
      if (choice(turned_time::kTurn) == kLetGo) turn_the_others(voice.hz, &voice);
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
        control();
        chunk_left_ = kChunk;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      float left[kChunk] = {}, right[kChunk] = {};
      for (Voice& voice : voices_) {
        if (voice.sounding) render(voice, n, left, right);
      }
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(left[i] * volume);
        out_right_[done + i] = kit::soft_clip(right[i] * volume);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // The newest glass: how much of its sand has run, its way and speed, how loud.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (voice.sounding && !voice.pending && (!newest || voice.stamp > newest->stamp)) newest = &voice;
    }
    if (!newest) return 0.0f;
    if (index == kMeterPlace) return kit::clamp(newest->u, -2.0f, 2.0f);
    if (index == kMeterWay) return newest->speed;
    return index == kMeterLevel ? newest->level : 0.0f;
  }

 private:
  static constexpr int kChunk = 64;
  static constexpr float kMinHz = 20.0f, kMaxHz = 8000.0f;
  static constexpr float kEdgeHz = 13000.0f, kTopHz = 17000.0f;
  static constexpr float kLevel = 0.129f;
  static constexpr float kKnobSeconds = 0.02f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kChordSeconds = 0.09f;   // keys within this are one chord
  static constexpr float kYoungest = 0.12f;       // a glass younger than this is not turned
  static constexpr float kSoftNeck = 0.55f;       // how far from its beginning a softened return stays
  static constexpr float kWeak = 0.58f;           // the weaker half of a pair
  static constexpr float kNearSide = 1.2f;        // how far Pass leans the near side away from the other
  static constexpr float kFarSide = 1.9f;         // how far the far side leans its own way
  static constexpr float kSoftDark = 9.0f;        // dB an octave a softened neck leans down
  static constexpr float kEvenShare = 0.8f, kEvenAt = -4.8f, kEvenRoom = 4.0f;  // how much of a walk's loudness is evened, and to where
  static constexpr float kHoverLight = 5.6f;      // dB an octave a hovering sound leans up, over two octaves and a half
  static constexpr float kSilence = 1.0e-6f;
  static constexpr float kEmptyAt = 1.8f;         // where the sand is quite out

  enum Knob : int {
    kKTilt, kKFrame, kKStrike, kKSand, kKDepth, kKPour, kKInertia, kKStagger, kKSettling,
    kKExchange, kKMemory, kKGrains, kKBeat, kKEars, kKRelease, kKApart, kKSplit, kNumKnobs
  };

  // A body: the places of its partials, their levels (dB), how many times the
  // note's own fading each has, what the strike adds (dB) and what the other
  // side of the neck does (dB).
  struct BodyTable {
    int count;
    float gain_db;                         // evens the bodies' loudness
    float burst, burst_hz, burst_seconds;  // the knock: its level, its place as a ratio of the note
    float air, bend;                       // breath under the tone; how much of Settling it takes
    float grain_seconds, drain;            // how much faster than the others it fades
    float places[kPartials], levels[kPartials], fading[kPartials], spark[kPartials], side[kPartials];
  };

  static const BodyTable& table(int body) {
    static const BodyTable* const kTables = build_tables();
    return kTables[kit::clamp_int(body, 0, kNumBodies - 1)];
  }

  static const BodyTable* build_tables() {
    static BodyTable t[kNumBodies] = {
        // Bell: hum, note, fifth and a wide stack above.
        {14, 0.0f, 0.5f, 3.1f, 0.035f, 0.0f, 1.0f, 0.14f, 1.0f,
         {1.0f, 0.5f, 1.498f, 2.0f, 2.52f, 3.0f, 4.0f, 5.04f, 6.02f, 7.1f, 8.25f, 9.6f, 11.1f, 12.9f},
         {0.0f, -8.0f, -13.0f, -5.0f, -14.0f, -9.0f, -14.0f, -19.0f, -21.0f, -25.0f, -27.0f, -30.0f, -33.0f, -36.0f},
         {1.0f, 0.75f, 1.3f, 1.35f, 1.5f, 1.6f, 1.9f, 2.1f, 2.3f, 2.5f, 2.7f, 2.9f, 3.1f, 3.3f},
         {0.0f, 0.0f, 3.0f, 3.0f, 6.0f, 6.0f, 9.0f, 11.0f, 12.0f, 14.0f, 15.0f, 16.0f, 17.0f, 18.0f},
         {-11.0f, -14.0f, 4.0f, 4.0f, 3.0f, 2.0f, 8.0f, 3.0f, 9.0f, 3.0f, 8.0f, 3.0f, 6.0f, 3.0f}},
        // Bar: a round low tone, its double octave and a wooden knock.
        {8, -0.5f, 1.0f, 5.2f, 0.016f, 0.0f, 0.5f, 0.05f, 2.2f,
         {1.0f, 2.0f, 4.0f, 6.4f, 9.9f, 13.6f, 17.9f, 22.0f},
         {0.0f, -44.0f, -26.0f, -50.0f, -42.0f, -54.0f, -60.0f, -64.0f},
         {1.0f, 1.2f, 1.9f, 2.2f, 2.6f, 3.0f, 3.2f, 3.4f},
         {0.0f, 2.0f, 16.0f, 18.0f, 24.0f, 26.0f, 26.0f, 26.0f},
         {-24.0f, 34.0f, 12.0f, 24.0f, 16.0f, 16.0f, 16.0f, 16.0f}},
        {24, 0.0f, 0.35f, 4.0f, 0.02f, 0.004f, 1.0f, 0.09f, 1.45f, {}, {}, {}, {}, {}},
        // Skin: a tuned drum.
        {12, 0.0f, 1.3f, 1.6f, 0.06f, 0.0f, 1.7f, 0.04f, 2.3f,
         {1.0f, 1.504f, 1.993f, 2.494f, 2.98f, 3.5f, 4.06f, 4.6f, 5.2f, 5.9f, 6.7f, 0.5f},
         {0.0f, -8.0f, -10.0f, -16.0f, -18.0f, -22.0f, -26.0f, -29.0f, -32.0f, -35.0f, -38.0f, 0.0f},
         {1.0f, 1.25f, 1.6f, 2.0f, 2.3f, 2.6f, 2.8f, 3.0f, 3.2f, 3.4f, 3.6f, 1.2f},
         {0.0f, 5.0f, 7.0f, 11.0f, 12.0f, 14.0f, 15.0f, 16.0f, 17.0f, 18.0f, 19.0f, 4.0f},
         {-12.0f, 6.0f, -14.0f, 10.0f, -10.0f, 12.0f, -8.0f, 12.0f, -8.0f, 12.0f, -8.0f, -24.0f}},
        // Glass: few partials, high and bright, that all ring long.
        {8, 1.0f, 0.22f, 9.0f, 0.02f, 0.003f, 0.7f, 0.2f, 0.7f,
         {1.0f, 2.0f, 4.0f, 6.64f, 9.45f, 12.6f, 16.2f, 20.4f},
         {-13.0f, -40.0f, 0.0f, -6.0f, -8.0f, -13.0f, -18.0f, -24.0f},
         {1.0f, 1.0f, 1.05f, 1.15f, 1.25f, 1.45f, 1.6f, 1.8f},
         {0.0f, 2.0f, 3.0f, 5.0f, 5.0f, 8.0f, 9.0f, 10.0f},
         {-14.0f, 24.0f, -16.0f, 6.0f, -14.0f, 6.0f, 2.0f, 2.0f}},
        {24, -2.0f, 0.12f, 3.0f, 0.05f, 0.1f, 0.35f, 0.06f, 0.42f, {}, {}, {}, {}, {}},
    };
    for (int k = 0; k < kPartials; ++k) {
      const float n = k < 16 ? static_cast<float>(k + 1) : 16.0f + 2.5f * static_cast<float>(k - 15);
      const float place = std::floor(n + 0.01f);
      const float octave = std::log2(place);
      // String: plucked near a fifth of its length, hardly stiff.
      BodyTable& s = t[kString];
      const float comb = std::fabs(std::sin(kit::kPi * place * 0.19f)) + 0.06f;
      s.places[k] = place * std::sqrt(1.0f + 0.00006f * place * place);
      s.levels[k] = -6.2f * octave + 20.0f * std::log10(comb) + 4.0f;
      s.fading[k] = 1.0f + 0.4f * octave;
      s.spark[k] = kit::min(5.5f * octave, 15.0f);
      s.side[k] = (k & 1) ? 8.0f : -22.0f;
      // Reed: odd harmonics first, a nasal hump, all fading nearly alike.
      BodyTable& r = t[kReed];
      r.places[k] = place;
      const bool even = (static_cast<int>(place) & 1) == 0;
      r.levels[k] = -1.0f * octave - (even ? 14.0f * std::exp(-0.1f * place) : 0.0f) - (octave > 2.33f ? 16.0f * (octave - 2.33f) : 0.0f);
      r.fading[k] = 1.0f + 0.25f * octave;
      r.spark[k] = 0.8f * octave;
      r.side[k] = even ? 12.0f : -22.0f;
    }
    return t;
  }

  struct Voice {
    float turn_re[kSlots] = {}, turn_im[kSlots] = {};  // the turn a sample, in tune
    float step_re[kSlots] = {}, step_im[kSlots] = {};  // with this tick's bend
    float re[kSlots] = {}, im[kSlots] = {};
    float amp[kSlots] = {}, ramp[kSlots] = {}, from[kSlots] = {};
    float base[kPartials] = {}, heard[kPartials] = {}, octave[kPartials] = {}, low[kPartials] = {}, bend[kPartials] = {};
    float angle[kPartials] = {}, edge[kPartials] = {}, other[kPartials] = {}, here[kPartials] = {}, wave[kPartials] = {}, wave_0[kPartials] = {};
    float grain_re[kGrainModes] = {}, grain_im[kGrainModes] = {};
    float grain_step_re[kGrainModes] = {}, grain_step_im[kGrainModes] = {};
    int count = 0, body = 0, neck = 0;
    // The glass.
    float u = 0.0f, speed = 0.0f, run = 0.0f, sand = 1.0f;
    int way = 1;
    float lean = 0.0f;            // which way and how far Stagger moves its pace
    float soft = 0.0f, hover = 0.0f;  // how much of the two slow necks this glass has
    float lim = 1.0f, back_rate = 1.0f;
    float turn_in = -1.0f;        // seconds until a turn that is on its way; below 0 none
    float even = 0.0f;            // dB that bring the whole walk to one loudness
    float lost = 0.0f, lost_to = 0.0f;  // dB a return is short of its beginning
    bool returning = false, ended = false;
    bool even_fresh = false, catch_levels = false, envelope_to_one = false;  // `from` is taken at the next tick; struck again while dying away
    float age = 0.0f, cross = 1.0f, cross_seconds = 0.01f;
    float spoken = 0.0f, blunt = 0.0f;  // how far its first beginning has come, and how soft that is
    float beyond = 0.0f;          // how far it is on the other side
    float flash = 0.0f, flash_to = 0.0f, touch = 0.0f, touch_to = 0.0f;
    float burst = 0.0f, burst_to = 0.0f, burst_decay = 0.0f;
    float hiss = 0.0f, hiss_step = 0.0f, peak_amp = 0.0f;  // the last is of the tone as it is heard
    float wander_at = 0.0f, side_of = 1.0f;
    kit::Rng rng;
    kit::Svf band;
    kit::OnePole veil;  // takes the top off every noise
    float hz = 440.0f, gain = 0.0f, level = 0.0f, steal = 1.0f;
    float envelope = 1.0f, master = 0.0f, master_step = 0.0f;
    float pending_hz = 440.0f, pending_gain = 0.0f;
    uint32_t stamp = 0, shaped = 0, walked = 0, chosen = 0;
    int pending_order = 0, holders = 0, ids[kHolders] = {};
    bool sounding = false, pending = false;

    bool released() const { return holders == 0; }
    bool held_full() const { return holders > 0 && !envelope_to_one && envelope > 0.999f; }
    void hold(int id) {
      drop(id);
      if (holders == kHolders) {
        for (int i = 1; i < kHolders; ++i) ids[i - 1] = ids[i];
        --holders;
      }
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

  int choice(int id) const { return static_cast<int>(param(id) + 0.5f); }
  float knob(int id) const { return knobs_[id].value; }

  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding ? 1 : 0;
    return count;
  }

  void set_knobs(bool glide) {
    using namespace turned_time;
    static constexpr int kIds[kNumKnobs] = {kTilt,     kFrame,    kStrike, kSand,   kDepth, kPour, kInertia, kStagger,
                                            kSettling, kExchange, kMemory, kGrains, kBeat,  kEars, kRelease, kApart, kSplit};
    for (int i = 0; i < kNumKnobs; ++i) {
      const float value = param(kIds[i]);
      const bool log = i == kKFrame || i == kKSand || i == kKRelease;
      knobs_[i].set(log ? std::log2(value) : value, glide);
    }
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
    if (!glide) ++shape_serial_, ++walk_serial_;
  }

  // A key that finds no glass sounding: every knob is where it points and the
  // control clock starts with the sound.
  void restart() {
    set_knobs(false);
    chunk_left_ = 0;
    fresh_ = true;
    strikes_ = chord_ = 0;
    since_strike_ = 1.0e9f;
  }

  // The voice a new key takes: an idle one, else the quietest let go, else the
  // quietest held; one that a key already waits in only when there is no other.
  int pick() const {
    int choice = -1;
    for (int pass = 0; pass < 4 && choice < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0 ? voice.sounding : pass == 1 ? voice.pending || !voice.released() : pass == 2 && voice.pending) continue;
        const Voice& best = voices_[choice < 0 ? v : choice];
        const bool older = choice < 0 || voice.stamp < best.stamp;
        if (pass == 0 || choice < 0 ? older : voice.level < best.level || (voice.level == best.level && older)) choice = v;
      }
    }
    return choice;
  }

  // --- turning -------------------------------------------------------------

  // Which key of its chord this is.
  int take_order() {
    chord_ = since_strike_ < kChordSeconds ? chord_ + 1 : 0;
    ++strikes_;
    since_strike_ = 0.0f;
    return chord_;
  }

  // Where a key begins: with Apart up, the keys of a chord start spread along
  // the sand, on their way to the neck.
  float start_place(int order) const {
    static constexpr float kPlaces[4] = {0.0f, -0.92f, -0.46f, -0.7f};
    return kPlaces[order & 3] * knob(kKApart);
  }

  bool turnable(const Voice& voice) const {
    return voice.sounding && !voice.pending && !voice.returning && !voice.ended && voice.age >= kYoungest;
  }

  // An event on the key of `hz`: the other glasses turn, the near ones before
  // the far ones when Stagger is up, and only the near ones when Apart is.
  void turn_the_others(float hz, const Voice* self) {
    const float spread = 0.3f * knob(kKStagger) * kit::min(std::exp2(knob(kKSand)), 6.0f);
    const float apart = knob(kKApart);
    const float reach = 0.25f + 8.0f * (1.0f - apart) * (1.0f - apart);  // octaves
    for (Voice& voice : voices_) {
      if (&voice == self || !turnable(voice)) continue;
      const float far = std::fabs(std::log2(voice.hz / hz));
      if (far <= reach) voice.turn_in = kit::min(far * spread, 4.0f);
    }
  }

  // A way back begins: how much of the beginning it will find.
  void forget(Voice& voice) { voice.lost_to += 0.4f * (30.0f * (1.0f - knob(kKMemory)) - voice.lost_to); }

  void turn(Voice& voice) {
    voice.way = -voice.way;
    if (voice.u * static_cast<float>(voice.way) < 0.0f) forget(voice);
    voice.touch_to = kit::max(voice.touch_to, (0.02f + 0.2f * knob(kKStrike)) * (1.0f - 0.6f * voice.soft));
    voice.burst_to = kit::max(voice.burst_to, 0.25f * table(voice.body).burst * knob(kKStrike));
  }

  // The beginning is reached again.
  void land(Voice& voice) {
    if (voice.returning) {
      voice.returning = false;
      voice.ended = true;
    }
    const float strike = knob(kKStrike);
    const int neck = choice(turned_time::kNeck);
    if (neck == kStrikeNeck) {
      voice.flash_to = 1.4f;
      voice.burst_to = kit::max(voice.burst_to, 0.8f * table(voice.body).burst * strike);
    } else if (neck == kPass) {
      voice.flash_to = 0.0f;
    }
  }

  void let_go(Voice& voice) {
    if (choice(turned_time::kTurn) != kLetGo || voice.returning || voice.ended) return;
    if (std::fabs(voice.u) < 0.04f) return;
    voice.way = voice.u > 0.0f ? -1 : 1;
    voice.back_rate = kit::max(std::fabs(voice.u), 0.2f) / (0.6f * kit::max(std::exp2(knob(kKRelease)), 0.1f));
    voice.returning = true;
    voice.turn_in = -1.0f;
    voice.touch_to = kit::max(voice.touch_to, 0.04f + 0.2f * knob(kKStrike));
  }

  // --- keys ----------------------------------------------------------------

  void start(Voice& voice, float hz, float gain, int order, bool again) {
    using namespace turned_time;
    const int body = kit::clamp_int(choice(kBody), 0, kNumBodies - 1);
    if (!again) {
      voice.body = body;
      voice.count = table(body).count;
      voice.neck = choice(kNeck);
      voice.hz = hz;
      voice.rng.seed(0x7C9E15u + static_cast<uint32_t>(hz * 16.0f) * 2654435761u);
      for (int k = 0; k < kSlots; ++k) {
        const float phase = voice.rng.uniform();
        voice.re[k] = SineOf(phase + 0.25f);
        voice.im[k] = SineOf(phase);
        voice.amp[k] = voice.ramp[k] = voice.from[k] = 0.0f;
      }
      for (int k = 0; k < kGrainModes; ++k) voice.grain_re[k] = voice.grain_im[k] = 0.0f;
      voice.band.reset();
      voice.veil.reset();
      voice.veil.set_cutoff(2800.0f, sample_rate());
      voice.hiss = voice.hiss_step = 0.0f;
      voice.flash = voice.touch = voice.touch_to = voice.burst = voice.burst_to = 0.0f;
      voice.soft = choice(kNeck) == kSoften ? 1.0f : 0.0f;
      voice.hover = choice(kNeck) == kHover ? 1.0f : 0.0f;
      voice.wander_at = voice.rng.uniform() * 8.0f;
      voice.side_of = (strikes_ & 1) ? 1.0f : -1.0f;
      const float note = kit::hz_to_midi(hz);
      voice.lean = kit::clamp((note - 60.0f) / 24.0f, -1.3f, 1.3f) + 0.12f * voice.rng.bipolar();
      voice.master = 1.0f;
      voice.master_step = 0.0f;
    }
    voice.gain = gain;
    voice.u = start_place(order);
    voice.way = 1;
    voice.speed = voice.u < 0.0f ? 1.0f : 1.0f - 0.8f * knob(kKInertia);
    voice.turn_in = -1.0f;
    voice.lost_to = 0.0f;
    if (!again) voice.lost = 0.0f;
    voice.returning = voice.ended = false;
    voice.age = 0.0f;
    voice.cross = 0.0f;
    voice.cross_seconds = kit::max(param(kAttack), choice(kNeck) == kSoften ? 0.06f : (voice.body == kReed ? 0.05f : 0.003f));
    voice.catch_levels = true;
    if (!again) voice.spoken = 0.0f;
    voice.blunt = 1.0f - kit::min(0.011f / kit::max(param(kAttack), 0.001f), 1.0f);
    voice.envelope_to_one = again;
    if (!again) voice.envelope = 1.0f;
    voice.steal = 1.0f;
    voice.pending = false;
    voice.sounding = true;
    voice.flash_to = 0.0f;
    const float share = voice.u < 0.0f ? 0.35f : 1.0f;
    voice.burst_to = share * table(voice.body).burst * knob(kKStrike) * kit::min(0.02f / voice.cross_seconds, 1.0f);
    if (voice.u < 0.0f) voice.touch_to = 0.2f + 0.3f * knob(kKStrike);
    voice.shaped = voice.walked = voice.chosen = 0;
    voice.even_fresh = voice.even_fresh || !again;
    voice.level = kLevel * gain;
    voice.band.set(kit::clamp(hz * table(voice.body).burst_hz, 250.0f, 4200.0f), 0.7f, sample_rate());
    voice.burst_decay = std::exp(-dt_ / (table(voice.body).burst_seconds * kit::clamp(std::sqrt(220.0f / hz), 0.5f, 2.5f)));
    voice.lim = limit();
    shape(voice);
  }

  static float touch_of(const Voice& voice) { return 0.4f + 0.8f * voice.gain; }  // how much of Strike this touch has
  static float SineOf(float phase) { return kit::SineTable::lookup(phase); }
  float limit() const { return choice(turned_time::kTurn) == kEmptyGlass ? kEmptyAt : 1.0f; }

  // How loud a hertz is, roughly: what levels are evened by.
  static float hearing(float hz) {
    const float low = hz / std::sqrt(hz * hz + 130.0f * 130.0f);
    return 0.8f * low * std::sqrt(low) * (1.0f + 0.5f * hz * hz / (hz * hz + 2200.0f * 2200.0f));
  }

  // Levels, tunings and the grains' modes of a key from the knobs as they stand.
  void shape(Voice& voice) {
    const BodyTable& body = table(voice.body);
    const float sr = sample_rate();
    const float tilt = (knob(kKTilt) > 0.0f ? 4.4f : 6.0f) * knob(kKTilt) + 4.0f * (knob(kKStrike) - 0.4f) + 5.0f * (voice.gain - 0.75f);
    const float frame = knob(kKFrame);
    const float top = kit::min(kTopHz, 0.45f * sr);
    const float strike = 1.5f * knob(kKStrike) * touch_of(voice);
    float power = 1.0e-9f, power_other = 1.0e-9f, power_struck = 1.0e-9f, power_here = 1.0e-9f;
    for (int k = 0; k < voice.count; ++k) {
      const float hz = voice.hz * body.places[k];
      const float octave = std::log2(body.places[k]);
      const float off = (std::log2(hz) - frame) * (1.0f / 0.5f);
      voice.octave[k] = kit::max(octave, 0.0f);
      voice.base[k] = body.levels[k] + tilt * kit::max(octave, -0.5f) + 9.0f * std::exp(-0.5f * off * off);
      if (voice.body == kReed) voice.base[k] -= 12.0f * kit::max(std::log2(hz) - 9.8f, 0.0f);  // a throat that closes over 900 Hz
      voice.base[k] -= 6.0f * kit::max(std::log2(hz) - 11.6f, 0.0f);  // softer over 3 kHz
      voice.base[k] -= 6.0f * kit::max(std::log2(hz) - 12.3f, 0.0f);  // and again over 5
      voice.edge[k] = kit::clamp((top - hz) * (1.0f / (kTopHz - kEdgeHz)), 0.0f, 1.0f);
      const float weight = hearing(hz) * voice.edge[k];
      voice.heard[k] = weight;
      power += weight * std::pow(10.0f, 0.1f * voice.base[k]);
      power_struck += weight * std::pow(10.0f, 0.1f * (voice.base[k] + strike * body.spark[k]));
      power_here += weight * std::pow(10.0f, 0.1f * (voice.base[k] - kNearSide * body.side[k]));
      power_other += weight * std::pow(10.0f, 0.1f * (voice.base[k] + kFarSide * body.side[k]));
    }
    // A hard strike gives back half of what its brightness adds.
    const float even = -10.0f * std::log10(power) - kit::min(4.5f * std::log10(power_struck / power), 6.0f) + 2.3f;
    const float other = 10.0f * std::log10(power / power_other) - 1.0f;
    const float here = 10.0f * std::log10(power / power_here) - 1.0f;
    const float hit = 20.0f * std::log10(kit::max(kLevel * voice.gain * (0.6f + 0.4f * voice.gain), 1.0e-6f)) + body.gain_db +
                      kit::clamp(0.11f * (kit::hz_to_midi(voice.hz) - 62.0f), -3.5f, 0.0f);
    const float beat = 0.5f * knob(kKBeat);
    for (int k = 0; k < voice.count; ++k) {
      const float hz = voice.hz * body.places[k];
      voice.base[k] += kit::clamp(even, -24.0f, 9.0f) + hit;
      voice.here[k] = here - kNearSide * body.side[k];
      voice.other[k] = kFarSide * body.side[k] + other;
      voice.low[k] = turned_time::quick_exp2((voice.base[k] - 7.0f * voice.octave[k]) * (1.0f / 6.0206f)) * voice.edge[k];
      voice.wave[k] = voice.octave[k] < 0.3f ? 5.0f : 28.0f;
      voice.wave_0[k] = turned_time::quick_sine(voice.octave[k] * 0.28f);
      voice.angle[k] = kit::kTwoPi * hz / sr;
      // A cent of Settling moves the note a third and the overtones more.
      voice.bend[k] = voice.angle[k] * 5.7763e-4f * body.bend * (0.33f + 0.42f * voice.octave[k]);
      const float golden = 0.618034f * static_cast<float>(k);
      const float apart = beat * (0.6f + 0.8f * (golden - std::floor(golden))) * ((k & 1) ? -1.0f : 1.0f);
      for (int b = 0; b < 2; ++b) {
        const float w = kit::kTwoPi * (hz + (b ? apart : -apart)) / sr;
        const float held = voice.edge[k] > 0.0f ? w : 0.0f;
        voice.turn_re[b * kPartials + k] = std::cos(held);
        voice.turn_im[b * kPartials + k] = std::sin(held);
      }
    }
    for (int k = 0; k < kGrainModes; ++k) {
      float hz = voice.hz * body.places[1 + (k & 3) * 2 < voice.count ? 1 + (k & 3) * 2 : (k & 3)];
      while (hz < 450.0f) hz *= 2.0f;
      while (hz > 4500.0f) hz *= 0.5f;
      const float w = kit::kTwoPi * hz / sr, r = std::exp(-1.0f / (body.grain_seconds * sr));
      voice.grain_step_re[k] = r * std::cos(w);
      voice.grain_step_im[k] = r * std::sin(w);
    }
    voice.shaped = shape_serial_;
  }

  // What brings the loudness of a whole walk along the sand to one level,
  // whatever Depth, Pour, Split, Exchange, the neck and the body make of it:
  // the loudness at eight places, the loud ones counting more, against the
  // beginning's. Most of the difference is evened and not all of it.
  void even_walk(Voice& voice) {
    static constexpr int kPlaces = 8;
    const BodyTable& body = table(voice.body);
    const float split = split_now(), exchange = exchange_now();
    const bool odd = knob(kKSplit) > 0.0f;
    const float against = against_now(body, split, odd);
    const float dark = kSoftDark * voice.soft, lit = kHoverLight * voice.hover;
    const float soft = kSoftNeck * voice.soft;
    const float strike = 1.5f * knob(kKStrike) * touch_of(voice) * std::exp(-soft * voice.sand * 5.5f);
    float start = 1.0e-9f, sum = 0.0f, first = 1.0e-9f;
    for (int k = 0; k < voice.count; ++k) start += voice.heard[k] * turned_time::quick_exp2(voice.base[k] * (1.0f / 3.0103f));
    const int sides = voice.neck == kPass ? 2 : 1;
    for (int i = 0; i < sides * kPlaces; ++i) {
      const int j = i & (kPlaces - 1);
      const float at = static_cast<float>(j) * voice.lim * (1.0f / (kPlaces - 1));
      const float p = std::sqrt(at * at + soft * soft) + 0.06f * voice.hover;
      const float place[2] = {p, p + (kit::max(voice.lim - p, 0.0f) - p) * split};
      const float* const side = sides == 1 ? nullptr : (i >= kPlaces ? voice.other : voice.here);
      float fade[2], power = 0.0f;
      for (int g = 0; g < 2; ++g) fade[g] = fade_at(voice, body, place[g]);
      for (int k = 0; k < voice.count; ++k) {
        const int g = split > 0.0f ? group_of(voice, k, odd) : 0;
        const float x = voice.base[k] - kit::min(fade[g] * body.fading[k], 100.0f) + wave_of(voice, k, place[g], exchange) +
                        (side ? side[k] : 0.0f) - dark * voice.octave[k] + lit * kit::min(voice.octave[k], 2.5f) + (g ? against : 0.0f);
        if (i == 0) first += voice.heard[k] * turned_time::quick_exp2(kit::clamp(x + strike * body.spark[k], -150.0f, 20.0f) * (1.0f / 3.0103f));
        power += voice.heard[k] * turned_time::quick_exp2(kit::clamp(x, -150.0f, 20.0f) * (1.0f / 3.0103f));
      }
      sum += power * power;
    }
    const float loud = 5.0f * std::log10(sum * (1.0f / static_cast<float>(sides * kPlaces)) / (start * start) + 1.0e-16f);
    const float room = kEvenRoom - 10.0f * std::log10(first / start);
    const float to = kit::clamp(kEvenAt - 4.0f * voice.hover - kEvenShare * loud, -26.0f, kit::clamp(room, -2.0f, 24.0f));
    voice.even = voice.even_fresh ? to : voice.even + (to - voice.even) * ease_;
    voice.even_fresh = false;
    const bool there = std::fabs(to - voice.even) < 0.01f && (voice.soft < 0.001f || voice.soft > 0.999f) && (voice.hover < 0.001f || voice.hover > 0.999f);
    if (there) voice.walked = walk_serial_;
  }

  // --- every kChunk samples ------------------------------------------------

  void control() {
    using namespace turned_time;
    since_strike_ += dt_;
    bool moved = false, walked = false;
    for (int i = 0; i < kNumKnobs; ++i) {
      if (knobs_[i].settled()) continue;
      knobs_[i].next();
      if (i == kKTilt || i == kKFrame || i == kKBeat || i == kKStrike) moved = true;
      if (i == kKDepth || i == kKPour || i == kKExchange || i == kKSplit || i == kKSand || i == kKStagger) walked = true;
    }
    if (moved) ++shape_serial_;
    if (moved || walked) ++walk_serial_;
    // How much each bank is heard in the other ear.
    own_ = own_to_;
    cross_ = cross_to_;
    const float bleed = 0.7f - 0.6f * knob(kKEars);
    own_to_ = 1.0f / std::sqrt(1.0f + bleed * bleed);
    cross_to_ = bleed * own_to_;
    if (fresh_) own_ = own_to_, cross_ = cross_to_;
    fresh_ = false;
    own_step_ = (own_to_ - own_) * (1.0f / kChunk);
    cross_step_ = (cross_to_ - cross_) * (1.0f / kChunk);
    now_.sand = std::exp2(knob(kKSand));
    now_.release = std::exp2(knob(kKRelease));
    now_.fade = 4.0f * std::exp2(3.75f * knob(kKDepth));
    now_.pour = std::exp2((knob(kKPour) < 0.5f ? 2.7f : 3.2f) * (knob(kKPour) - 0.5f));
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (voice.pending && voice.steal <= 0.0f) {
        start(voice, voice.pending_hz, voice.pending_gain, voice.pending_order, false);
      } else if (voice.pending) {
        voice.steal = kit::max(voice.steal - 0.34f, 0.0f);
      }
      if (voice.shaped != shape_serial_) shape(voice);
      move(voice);
      if (voice.walked != walk_serial_) even_walk(voice);
      levels(voice);
      noise(voice);
      const float master = voice.envelope * (voice.pending ? voice.steal : 1.0f);
      voice.master_step = (master - voice.master) * (1.0f / kChunk);
      if (!voice.pending && voice.released() && voice.envelope < kSilence) {
        voice.sounding = false;
        voice.level = 0.0f;
      }
    }
  }

  // The glass: where the sand is, and which way it runs.
  void move(Voice& voice) {
    using namespace turned_time;
    voice.age += dt_;
    voice.lost += (voice.lost_to - voice.lost) * ease_;
    if (voice.way < 0) voice.blunt = flush_denormal(voice.blunt - voice.blunt * ease_);
    const bool letting = choice(kTurn) == kLetGo;
    if (voice.turn_in >= 0.0f) {
      voice.turn_in -= dt_;
      if (voice.turn_in < 0.0f && turnable(voice)) {
        voice.turn_in = -1.0f;
        turn(voice);
      }
    }
    float pace = std::exp2(0.9f * knob(kKStagger) * voice.lean);
    if (letting && !voice.released()) pace *= 0.5f;
    voice.sand = now_.sand / pace;
    float tau = 0.015f + 0.9f * knob(kKInertia) * knob(kKInertia) * voice.sand;
    float rate = 1.0f / voice.sand;
    if (voice.returning) tau = kit::min(tau, 0.05f), rate = voice.back_rate;
    voice.speed += (static_cast<float>(voice.way) - voice.speed) * (1.0f - std::exp(-dt_ / tau));
    const int neck = choice(kNeck);
    voice.soft += ((neck == kSoften ? 1.0f : 0.0f) - voice.soft) * ease_;
    voice.hover += ((neck == kHover ? 1.0f : 0.0f) - voice.hover) * ease_;
    if (voice.hover > 0.001f && !voice.returning) {
      const float x = kit::min(std::fabs(voice.u) * 2.5f, 1.0f);
      rate *= 1.0f - voice.hover * 0.88f * (1.0f - x * x * (3.0f - 2.0f * x));
    }
    rate *= 1.0f - 0.3f * voice.soft * (voice.returning ? 0.0f : 1.0f);
    if (neck == kPass && voice.u < 0.0f && !voice.returning) rate *= 0.5f;
    const float before = voice.u;
    rate *= 0.35f + 0.65f * voice.spoken;  // the sand waits while a slow key comes to speak
    voice.u += voice.speed * rate * dt_;
    voice.run = voice.speed * (voice.returning ? 1.0f : rate * voice.sand);
    if ((before < 0.0f && voice.u >= 0.0f) || (before > 0.0f && voice.u <= 0.0f)) land(voice);
    const float out = voice.u * static_cast<float>(voice.way);
    if (out >= limit() && !voice.returning) turn(voice);
    voice.u = kit::clamp(voice.u, -3.0f, 3.0f);

    if (voice.released() || voice.envelope > 0.999f) voice.envelope_to_one = false;
    if (voice.envelope_to_one) voice.envelope += (1.0f - voice.envelope) * kit::min(dt_ / 0.006f, 1.0f);
    if (voice.held_full()) voice.envelope = 1.0f;
    if (voice.released() && !voice.pending && !voice.returning) {
      const float seconds = kit::max(voice.ended ? 0.4f * now_.release : now_.release, 0.04f);
      voice.envelope *= std::exp(-kSixtyDb * dt_ / seconds);
    }
  }

  // What every partial's level and tuning is at this place of the sand.
  void levels(Voice& voice) {
    using namespace turned_time;
    const BodyTable& body = table(voice.body);
    if (voice.chosen != choice_serial_) {
      if (voice.chosen != 0) {
        voice.catch_levels = true;
        voice.cross_seconds = kit::max((1.0f - voice.cross) * voice.cross_seconds, 0.12f);
        voice.cross = 0.0f;
      }
      voice.chosen = choice_serial_;
      voice.neck = choice(kNeck);
      voice.lim = limit();
    }
    if (voice.catch_levels) {
      for (int k = 0; k < kSlots; ++k) voice.from[k] = voice.amp[k];
      voice.catch_levels = false;
    }
    if (voice.cross < 1.0f) voice.cross = kit::min(voice.cross + dt_ / voice.cross_seconds, 1.0f);
    const float cross = voice.cross * voice.cross * (3.0f - 2.0f * voice.cross);
    voice.spoken = kit::max(voice.spoken, cross);
    voice.wander_at += dt_;
    const float slow = 0.6f * SineOf(voice.wander_at * 0.231f) + 0.4f * SineOf(voice.wander_at * 0.383f + 0.3f);
    // Gestures rise over a few milliseconds and fall in their own time.
    voice.flash = flush_denormal(voice.flash + (voice.flash_to - voice.flash) * ramp_);
    voice.flash_to = flush_denormal(voice.flash_to * flash_decay_);
    voice.touch = flush_denormal(voice.touch + (voice.touch_to - voice.touch) * touch_rise_);
    voice.touch_to = flush_denormal(voice.touch_to * touch_decay_);

    const float lag = 0.2f * knob(kKEars) * (1.0f - std::exp(-voice.age * 3.0f)) * voice.side_of;
    const float strike = 1.5f * knob(kKStrike) * (1.0f - 0.6f * voice.hover) * touch_of(voice) * (1.0f - voice.blunt);
    const float exchange = exchange_now();
    const float split = split_now();
    const bool odd = knob(kKSplit) > 0.0f;
    const float against = against_now(body, split, odd);
    const float dark = kSoftDark * voice.soft, lit = kHoverLight * voice.hover;
    float loudest = 0.0f, heard = 0.0f;
    for (int b = 0; b < 2; ++b) {
      const float u = voice.u + (b ? lag : -lag);
      float p = std::fabs(u);
      if (voice.soft > 0.0f) p = std::sqrt(p * p + kSoftNeck * kSoftNeck * voice.soft * voice.soft);
      p = kit::max(p + voice.hover * 0.06f * (1.0f + slow), 0.0f);
      const float across = kit::clamp(-u * 9.0f, 0.0f, 1.0f);
      const float far_side = voice.neck == kPass ? across * across * (3.0f - 2.0f * across) : 0.0f;
      const float near_side = voice.neck == kPass ? 1.0f - far_side : 0.0f;  // leans the other way
      if (b == 0) voice.beyond = far_side;
      const float place[2] = {p, p + (kit::max(voice.lim - p, 0.0f) - p) * split};
      float fade[2], spark[2], wave_at[2], settle[2];
      for (int g = 0; g < 2; ++g) {
        fade[g] = fade_at(voice, body, place[g]);
        spark[g] = strike * std::exp(-place[g] * kit::max(voice.sand, 0.7f) * 5.5f);
        wave_at[g] = place[g] + slow * (0.008f + 0.16f * voice.hover);
        settle[g] = knob(kKSettling) * std::exp(-6.0f * place[g]);
      }
      const int at = b * kPartials;
      float x[kPartials], grow[kPartials], bend[kPartials];
      for (int k = 0; k < voice.count; ++k) {
        const int g = split > 0.0f ? group_of(voice, k, odd) : 0;
        const float wave = wave_of(voice, k, wave_at[g], exchange);
        const float fall = kit::min(fade[g] * body.fading[k], 100.0f);
        x[k] = voice.base[k] - fall + spark[g] * body.spark[k] + wave + far_side * voice.other[k] + near_side * voice.here[k] + voice.even - dark * voice.octave[k] + lit * kit::min(voice.octave[k], 2.5f);
        grow[k] = g ? against : 0.0f;
        bend[k] = settle[g] * voice.bend[k];
      }
      for (int k = 0; k < voice.count; ++k) {
        const float db = x[k] + grow[k] - voice.lost * (0.6f + 0.35f * voice.octave[k]) +
                         voice.flash * (0.6f + 0.4f * body.spark[k]);
        float to = quick_exp2(kit::clamp(db, -150.0f, 20.0f) * (1.0f / 6.0206f)) * voice.edge[k];
        to += voice.touch * voice.low[k];
        if ((k + b) & 1) to *= kWeak;
        loudest = kit::max(loudest, to);
        to = voice.from[at + k] + (to - voice.from[at + k]) * cross;
        heard = kit::max(heard, to);
        voice.ramp[at + k] = (to - voice.amp[at + k]) * (1.0f / kChunk);
      }
      for (int k = 0; k < voice.count; ++k) {
        const int i = at + k;
        const float d = kit::min(bend[k], 0.3f);
        const float c = 1.0f - 0.5f * d * d, s = d * (1.0f - d * d * (1.0f / 6.0f));
        voice.step_re[i] = voice.turn_re[i] * c - voice.turn_im[i] * s;
        voice.step_im[i] = voice.turn_im[i] * c + voice.turn_re[i] * s;
        const float fix = 1.5f - 0.5f * (voice.re[i] * voice.re[i] + voice.im[i] * voice.im[i]);
        voice.re[i] *= fix;
        voice.im[i] *= fix;
      }
    }
    voice.peak_amp = heard;
    if (!voice.pending) voice.level = kit::max(loudest * voice.envelope, voice.age < 0.05f ? kLevel * voice.gain : 0.0f);
  }

    // How much a group that runs against the sand is brought up.
  float against_now(const BodyTable& body, float split, bool odd) const {
    // High against low, the overtones are half poured at either end: they are brought up for it.
    const float middle = odd ? 0.0f : 4.0f * split * (1.0f - split) * kit::clamp(now_.fade * body.drain * std::pow(0.5f, now_.pour) - 6.0f, 0.0f, 7.0f);
    return split * kit::min(0.5f * now_.fade * body.drain, 8.0f) + middle;
  }
  float split_now() const { return std::fabs(knob(kKSplit)) * (2.0f - std::fabs(knob(kKSplit))); }
  float exchange_now() const { return knob(kKExchange) * (1.5f - 0.5f * knob(kKExchange)); }
  float fade_at(const Voice& voice, const BodyTable& body, float place) const {
    // A softened neck keeps its distance from the beginning, and is let off most of the fading that costs.
    const float let_off = voice.soft > 0.0f ? 0.75f * voice.soft * std::pow(kSoftNeck, now_.pour) : 0.0f;
    float whole = now_.fade * body.drain * (1.0f + 0.5f * voice.soft);
    if (whole > 60.0f) whole = 60.0f + 0.3f * (whole - 60.0f);  // a body that drains fast is not gone at once
    return whole * kit::max(std::pow(place, now_.pour) - let_off, 0.0f);
  }
  static float wave_of(const Voice& voice, int k, float at, float exchange) {
    const float swing = voice.wave[k] * (turned_time::quick_sine(at * 1.2f - voice.octave[k] * 0.28f) + voice.wave_0[k]);
    return exchange * (swing > 0.0f ? 0.45f : 1.0f) * swing;
  }

  // Which way a partial's sand runs: 0 with the glass, 1 against it.
  static int group_of(const Voice& voice, int k, bool odd) {
    return odd ? k & 1 : (voice.octave[k] > 1.2f ? 1 : 0);
  }

  // The knock, the air, the pouring and the grains.
  void noise(Voice& voice) {
    using namespace turned_time;
    const BodyTable& body = table(voice.body);
    const float hit = kLevel * voice.gain * (0.4f + 0.6f * voice.gain);
    voice.burst = flush_denormal(voice.burst + (voice.burst_to - voice.burst) * burst_rise_);
    voice.burst_to = flush_denormal(voice.burst_to * voice.burst_decay);
    const float grains = knob(kKGrains);
    const float run = kit::min(std::fabs(voice.run), 1.5f) * voice.spoken;
    const float crest = voice.soft * std::exp(-14.0f * voice.u * voice.u) * 0.18f * voice.peak_amp;
    float hiss = hit * (voice.burst * 1.2f + grains * std::sqrt(grains) * 0.075f * run);
    hiss += crest + body.air * 6.0f * voice.peak_amp + (voice.hover * 0.03f + voice.beyond * 0.25f) * voice.peak_amp;
    hiss *= noise_scale_;
    if (hiss < 1.0e-7f) hiss = 0.0f;
    voice.hiss_step = (hiss - voice.hiss) * (1.0f / kChunk);
    // Grains fall at random, more of them the faster the sand runs.
    const float often = dt_ * run * grains * (14.0f + 110.0f * grains);
    if (often > 0.0f && voice.rng.uniform() < often) {
      const float size = hit * grains * (1.6f - 0.6f * grains) * (0.15f + 0.5f * voice.rng.uniform() * voice.rng.uniform());
      const int lane = static_cast<int>(voice.rng.next_u32() >> 29);
      voice.grain_re[lane] += (voice.rng.next_u32() & 0x10000u) ? size : -size;
    }
    for (int k = 0; k < kGrainModes; ++k) {
      if (voice.grain_re[k] * voice.grain_re[k] + voice.grain_im[k] * voice.grain_im[k] < 1.0e-18f) {
        voice.grain_re[k] = voice.grain_im[k] = 0.0f;
      }
    }
  }

  // --- sound ---------------------------------------------------------------

  static turned_time::Four load(const float* from) {
    turned_time::Four out;
    std::memcpy(&out, from, sizeof out);
    return out;
  }
  static void store(float* to, turned_time::Four value) { std::memcpy(to, &value, sizeof value); }
  void render(Voice& voice, int n, float* left, float* right) {
    using turned_time::Four;
    float out[2][kChunk];
    for (int b = 0; b < 2; ++b) {
      Four mix[kChunk] = {};
      for (int k = b * kPartials; k < b * kPartials + voice.count; k += 4) {
        Four re = load(&voice.re[k]), im = load(&voice.im[k]), amp = load(&voice.amp[k]);
        const Four ramp = load(&voice.ramp[k]), c = load(&voice.step_re[k]), s = load(&voice.step_im[k]);
        for (int i = 0; i < n; ++i) {
          const Four turned = c * re - s * im;
          im = s * re + c * im;
          re = turned;
          amp += ramp;
          mix[i] += amp * im;
        }
        store(&voice.re[k], re);
        store(&voice.im[k], im);
        store(&voice.amp[k], amp);
      }
      const int g = 4 * b;
      Four re = load(&voice.grain_re[g]), im = load(&voice.grain_im[g]);
      const Four c = load(&voice.grain_step_re[g]), s = load(&voice.grain_step_im[g]);
      const Four zero = {};
      const Four energy = re * re + im * im;
      if (energy[0] + energy[1] + energy[2] + energy[3] > 0.0f) {
        for (int i = 0; i < n; ++i) {
          const Four turned = c * re - s * im;
          im = s * re + c * im;
          re = turned;
          mix[i] += im;
        }
      } else {
        re = im = zero;
      }
      store(&voice.grain_re[g], re);
      store(&voice.grain_im[g], im);
      for (int i = 0; i < n; ++i) out[b][i] = mix[i][0] + mix[i][1] + mix[i][2] + mix[i][3];
    }
    const float since = static_cast<float>(kChunk - chunk_left_);
    float own = own_ + since * own_step_, cross = cross_ + since * cross_step_;
    const bool hissing = voice.hiss != 0.0f || voice.hiss_step != 0.0f;
    for (int i = 0; i < n; ++i) {
      float air = 0.0f;
      if (hissing) {
        voice.hiss += voice.hiss_step;
        air = voice.band.bandpass(voice.veil.lowpass(voice.rng.bipolar() * voice.hiss)) * 3.0f;
      }
      voice.master += voice.master_step;
      const float l = out[0][i] + air, r = out[1][i] + air;
      own += own_step_, cross += cross_step_;
      left[i] += voice.master * (own * l + cross * r);
      right[i] += voice.master * (own * r + cross * l);
    }
  }

  // What the knobs say this tick.
  struct Now { float sand = 1.0f, release = 1.0f, fade = 12.0f, pour = 1.0f; } now_;
  Voice voices_[kMaxVoices];
  kit::Smoother knobs_[kNumKnobs], volume_;  // once a tick, and every sample
  kit::IdleGate idle_;
  uint32_t shape_serial_ = 1, walk_serial_ = 1, choice_serial_ = 1, stamp_ = 0;
  int chunk_left_ = 0, strikes_ = 0, chord_ = 0;
  float own_ = 1.0f, cross_ = 0.0f, own_to_ = 1.0f, cross_to_ = 0.0f, own_step_ = 0.0f, cross_step_ = 0.0f;
  bool fresh_ = true;  // the two above snap at the next tick
  float since_strike_ = 1.0e9f;
  float dt_ = 0.0f, noise_scale_ = 1.0f;
  float ease_ = 0.0f, ramp_ = 0.0f, burst_rise_ = 0.0f, touch_rise_ = 0.0f, flash_decay_ = 0.0f, touch_decay_ = 0.0f;
};

}  // namespace livemix
