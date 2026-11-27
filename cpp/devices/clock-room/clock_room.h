#pragma once

// Clock Room: every key is a clock with a gong, and the clocks hang on one
// wall and learn each other's time.
//
//   key down ─► strike ─► rod 1 (16 modes) ─┐
//      │          ▲  └──► rod 2 (16 modes) ─┴► the pendulum's swing ─► place ─► sum
//      ▼          │ touches
//   pendulum ─► escapement        all clocks ─► case ─► volume ─► soft clip ─► out
//      ▲
//      └── wall: each pendulum feels the others (in step, opposed, splayed, chain)
//
// - A mode is one complex number turned and shrunk a little every sample
//   (z' = r·e^jw·z). The modes stand four to a lane (Four), so a clock's 32
//   are eight lanes of the same arithmetic. A mode's loudness is its own
//   length: nothing is multiplied on the way out but the four sums of a
//   clock (low and high part of each rod).
// - A strike does not push a pulse of sound into the modes. Each is ramped up
//   along its own turning phase, a quarter turn from what rings already, so
//   the two add as power and the same strike is always as loud. A hammer
//   also damps what it touches, by the force of the touch: the same ramp
//   takes that much away. So a clock that strikes forever comes to one level.
// - Bloom: a part of what a strike gives the upper modes comes late, fed in
//   over a third of a second to two seconds, more of it from a harder strike.
// - Glow is a rub: a mode under its level grows toward it for as long as the
//   key is down, each on a slow wander of its own, with the pendulum's swing
//   in the pressure.
// - A pendulum is a phase that counts swings. Its own rate is Beat, a little
//   off by Unlike. The wall pulls it: rate = own + K·mean sin(2π(θj − θi − dij)),
//   where d is nothing (in step), half a swing between neighbours (opposed),
//   an equal share of the swing in an order that leaps (splayed), or a share
//   of two swings that rises with the pitch (chain). A phase never runs back.
// - However soft or bright the hammer, the gong, the wall and the case make a
//   strike or a rub, it is brought near one loudness, and what of it lies over
//   2.1 kHz is held down: every gong can stand in every case.
// - What the wall carries is heard: in step it sways and sounds the octave
//   under each note; opposed it is at rest and the halves
//   stand to the sides; splayed each clock is struck at a place of its own;
//   chained the wave is soft and dark below and hard and bright above.
// - Gong, True and Interval move the modes themselves, gliding, so they can be
//   turned under a ringing chord.
//
// All control runs on a 64-sample clock that restarts, with every smoothed
// knob in its place, when a strike finds no clock ringing: the output does
// not depend on the block size.

#include <initializer_list>

#include "../../kit/kit.h"
#include "clock_case.h"
#include "clock_voice.h"
#include "clock_wall.h"
#include "gong_tables.h"
#include "params.gen.h"

namespace livemix {

class ClockRoom : public kit::DeviceBase<clock_room::kNumParams> {
 public:
  using Voice = ClockVoice;
  using Manner = ClockWall::Manner;
  static constexpr int kMaxVoices = ClockWall::kMaxVoices;
  static constexpr int kModes = Voice::kModes, kRods = Voice::kRods, kBuses = Voice::kBuses;
  static constexpr int kChunk = Voice::kChunk;  // control period, samples
  enum EscapementKind : int { kVerge = 0, kAnchor, kDeadbeat, kChimeHammer, kRubOnly };
  enum Meter : int { kMeterAgreement = 0, kMeterSwing, kMeterStrike, kMeterLevel };

  void init(float sample_rate) {
    using namespace clock_room;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) voice = Voice();
    tune_serial_ = member_serial_ = 1;
    ranked_ = 0;
    stamp_ = 0;
    chunk_left_ = 0;
    tick_count_ = 0;
    tick_seconds_ = static_cast<float>(kChunk) / sr;
    steal_step_ = 1.0f / (kStealSeconds * sr);
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    ease_ticks_ = kit::clamp_int(static_cast<int>(0.0107f / tick_seconds_ + 0.5f), 1, 1000);
    ease_fall_ = std::exp(-383.0f * tick_seconds_);
    const float tick_rate = 1.0f / tick_seconds_;
    for (kit::Smoother* knob : {&back_, &second_, &glow_, &swing_, &width_, &tick_level_}) knob->set_time(0.02f, tick_rate);
    interval_.set_time(0.03f, tick_rate);
    wall_.init(tick_seconds_);
    for (int k = 0; k < kModes; ++k) {
      for (kit::Smoother* shape : {&place_[k], &keep_[k], &rub_[k], &off_[k]}) shape->set_time(0.05f, tick_rate);
    }
    gong_decay_.set_time(0.05f, tick_rate);
    volume_.set_time(0.02f, sr);
    case_.init(sr, tick_seconds_);
    restart();
    quiet_ = 0;
    rest_samples_ = static_cast<int>(0.08f * sr);
    idle_.reset(sr, 0.12f);
  }

  void set_param(int id, float value) {
    using namespace clock_room;
    if (!store_param(id, value)) return;
    switch (id) {
      case kSecond:
      case kInterval:
      case kGlow:
      case kSwing:
      case kTick:
      case kWidth:
      case kVolume:
      case kLearn:
      case kWall:
        set_knobs(primed());
        break;
      case kGong:
      case kTrue:
        set_gong(primed());
        break;
      case kCase:
        case_.choose(choice(kCase), primed());
        ++tune_serial_;
        break;
      case kHammer:
        tilt();
        break;
      case kEscapement:
        set_knobs(primed());
        ++tune_serial_;
        break;
      case kDecay:
      case kUnlike:
      case kHush:
        ++tune_serial_;
        break;
      default:
        break;  // the rest is read as it is needed
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (count_sounding() == 0) restart();
    ++member_serial_;

    // The clock this pitch already has. Every other clock the id held is let go.
    Voice* same = nullptr;
    Voice* waiting = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (!same && (voice.pending ? voice.pending_frequency : voice.frequency) == frequency) {
        same = &voice;
        continue;
      }
      if (voice.drop(note_id) && voice.pending && voice.holders == 0) waiting = &voice;
    }
    if (same) {
      same->hold(note_id);
      same->stamp = ++stamp_;
      if (same->pending) {
        same->pending_gain = together(same->pending_gain, gain);
        same->follow = expected_level(same->pending_gain);
      } else {
        wind(*same, gain);
      }
      return;
    }
    Voice& voice = waiting ? *waiting : voices_[ClockWall::pick(voices_)];
    const bool taken = voice.sounding;
    voice.holders = 0;
    voice.hold(note_id);
    voice.stamp = ++stamp_;
    if (taken) {
      // Fade what it rang over 3 ms, then strike (see control()).
      voice.pending = true;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.follow = expected_level(gain);
    } else {
      // Struck at the next tick, so the keys of one chord meet on the wall first.
      voice.sounding = voice.pending = true;
      voice.steal = 0.0f;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.follow = expected_level(gain);
      voice.quiet();
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (voice.sounding && voice.drop(note_id)) ++member_serial_;
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
      float room = room_now_;
      const float room_step = room_step_;
      for (Voice& voice : voices_) {
        if (voice.sounding) voice.render(n, steal_step_, left, right);
      }
      for (int i = 0; i < n; ++i) {
        case_.process(&left[i], &right[i], width_.value);
        const float volume = volume_.next() * room;
        room += room_step;
        out_left_[done + i] = kit::soft_clip(left[i] * volume);
        out_right_[done + i] = kit::soft_clip(right[i] * volume);
      }
      rest(done, n);
      room_now_ = room;
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // How far the clocks agree with what the wall asks (0 to 1), where the
  // newest pendulum is (-1 to 1), how lately it struck (1 falling to 0), and
  // how loud it is. At rest all are 0.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (voice.sounding && !voice.pending && (!newest || voice.stamp > newest->stamp)) newest = &voice;
    }
    if (!newest) return 0.0f;
    switch (index) {
      case kMeterAgreement:
        return wall_.agreement;
      case kMeterSwing:
        return kit::SineTable::cos_lookup(static_cast<float>(newest->phase) * 0.5f);
      case kMeterStrike:
        return newest->struck_lately;
      case kMeterLevel:
        return newest->follow;
    }
    return 0.0f;
  }

 private:
  // Once nothing sounds and the case has rung out, every sample is nothing,
  // from the same one on whatever the block size.
  void rest(int from, int n) {
    if (count_sounding() > 0) {
      quiet_ = 0;
      return;
    }
    for (int i = from; i < from + n; ++i) {
      const float loud = kit::max(std::fabs(out_left_[i]), std::fabs(out_right_[i]));
      quiet_ = loud > kit::IdleGate::kFloor ? 0 : quiet_ + 1;
      if (quiet_ < rest_samples_) continue;
      if (quiet_ == rest_samples_) case_.clear();
      out_left_[i] = out_right_[i] = 0.0f;
    }
  }

  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kEdgeHz = 13500.0f;  // a mode over this dies quickly, over kTopHz it is not there
  static constexpr float kTopHz = 17500.0f;
  static constexpr float kLevel = 0.175f;        // a full strike of a mode of level 1
  static constexpr float kHeard = 1.25f;        // of a full strike, through the wall and the case
  static constexpr float kMostBright = 0.29f;   // of that, over 2.1 kHz
  static constexpr float kRubHeard = 1.35f;     // of a rub
  static constexpr float kMostEased = 8.0f;     // no strike is raised by more
  static constexpr float kRubLevel = 0.185f;
  static constexpr float kSoftContact = 1.4f;   // hammer contact, periods of the note
  static constexpr float kHardContact = 0.034f;
  static constexpr float kMakeup = 0.6f;
  static constexpr float kSoftAttack = 0.030f;  // seconds a strike takes
  static constexpr float kHardAttack = 0.0008f;
  static constexpr float kDamped = 0.40f;       // what a full touch takes of what rings
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kKnockLevel = 0.19f;
  static constexpr float kTickLevel = 2.7f;
  static constexpr float kAirLevel = 0.045f;
  static constexpr float kRodBeat = 0.20f;      // hertz between the rods
  static constexpr float kLateSeconds = 0.7f;
  static constexpr float kLate = 2.6f;          // what Bloom gives for what it takes
  static constexpr float kShortestChoke = 0.11f;
  static constexpr float kSilence = 1.0e-6f;

  // How far the modes are bent from where they are true.
  float bent() const { return std::pow(1.0f - param(clock_room::kTrue), 1.5f); }
  // Raw metal sounds its tones unevenly, the note itself the least.
  static float raw_level(int k, float raw) {
    static constexpr float kRaw[kModes] = {-0.6f, -1.3f, 0.9f, -0.8f, 1.4f, -0.7f, 1.1f, 0.5f, -0.9f, 1.2f, -0.4f, 0.9f, -0.6f, 0.8f, 0.4f, -0.5f};
    return std::exp2(1.3f * raw * kRaw[k]);
  }

  int choice(int id) const { return static_cast<int>(param(id) + 0.5f); }

  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding ? 1 : 0;
    return count;
  }

  void set_knobs(bool glide) {
    using namespace clock_room;
    back_.set(choice(kEscapement) == kAnchor ? 0.5f : 0.0f, glide);
    second_.set(param(kSecond), glide);
    interval_.set(param(kInterval), glide);
    const float glow = param(kGlow);
    glow_.set(glow * (0.80f + 0.15f * glow), glide);
    swing_.set(param(kSwing), glide);
    tick_level_.set(std::pow(param(kTick), 1.25f), glide);
    width_.set(param(kWidth), glide);
    wall_.set(choice(kWall), param(kLearn), glide);
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
  }

  // Where the modes lie and how long they ring, from Gong and True.
  void set_gong(bool glide) {
    using namespace clock_room;
    const clock_room_tables::Gong& gong = clock_room_tables::gong(choice(kGong));
    const float raw = bent();
    for (int k = 0; k < kModes; ++k) {
      const clock_room_tables::Mode& mode = gong.modes[k];
      place_[k].set(std::log2(mode.just) + raw * std::log2(mode.bent / mode.just), glide);
      keep_[k].set(std::log2(mode.keep), glide);
      rub_[k].set(mode.rub, glide);
      off_[k].set(mode.off, glide);
    }
    gong_decay_.set(gong.decay, glide);
    gong_moves_ = true;
    ++tune_serial_;
  }

  // A strike that finds no clock ringing: every knob is where it points, and
  // the control clock starts with the sound.
  void restart() {
    set_knobs(false);
    set_gong(false);
    case_.snap(choice(clock_room::kCase));
    shape();
    tilt();
    gong_moves_ = false;
    wall_.restart();
    chunk_left_ = 0;
    tick_count_ = 0;
  }

  // --- strikes -------------------------------------------------------------

  const clock_room_tables::Escapement& train() const {
    return clock_room_tables::escapement(choice(clock_room::kEscapement));
  }
  static float together(float a, float b) { return kit::min(std::sqrt(a * a + b * b), 1.0f); }
  static float force_of(float gain) { return gain * (0.82f + 0.12f * gain); }

  static float expected_level(float gain) { return kit::max(kLevel * force_of(gain), kSilence); }

  // How much of a mode a hammer wakes: a soft one little above the note, and
  // none wakes what lies out of the warm range.
  float share(float ratio, float hz, float contact, float hardness) const {
    const float x = ratio * contact;
    const float top = hz / (2700.0f + 6800.0f * hardness);
    const float bottom = hz / 44.0f;
    return std::pow(1.0f + contact * contact, kMakeup) / ((1.0f + x * x) * (1.0f + top * top * top)) *
           (bottom * bottom / (1.0f + bottom * bottom));
  }
  float hardness_of(float force, float edge) const {
    return kit::clamp(param(clock_room::kHammer) + edge + 0.28f * (force - 0.7f), 0.0f, 1.0f);
  }
  // Evens the keyboard out: high keys lose more to the case and to the air.
  float evened(float frequency) const {
    const float over = kit::clamp(frequency * (1.0f / 220.0f), 0.2f, 12.0f);
    return std::pow(over, over > 1.0f ? 0.1f : 0.4f);
  }
  // How near a tone at `hz` is to the ear.
  static float near_ear(float hz) {
    const float high = hz * hz / (hz * hz + 2500.0f * 2500.0f);
    return hz / (hz + 60.0f) * (1.0f + 0.9f * high);
  }
  // What a sound that would be heard at `heard` is multiplied by to come near
  // to `want`: whatever the gong, the case and the wall make of it, one
  // clock is about as loud as another.
  static float eased_to(float want, float heard) {
    if (heard <= 1.0e-9f) return 1.0f;
    const float off = want / heard;
    return off < 1.0f ? std::pow(off, 0.94f) : kit::min(std::pow(off, 0.8f), kMostEased);
  }
  // How far a key lies over the middle of the keyboard, in octaves: up there
  // the note itself carries more of the sound.
  static float over_middle(float frequency) { return kit::clamp(std::log2(frequency * (1.0f / 330.0f)), 0.0f, 2.0f); }

  void start(Voice& voice, float frequency, float gain) {
    voice.quiet();
    voice.frequency = frequency;
    const float note = kit::hz_to_midi(frequency);
    // Clocks struck together start at different points of their cycles, so a
    // chord's strikes do not pile up, and their pendulums at different points
    // of the swing, so they do not begin in step.
    const float golden = note * 0.6180340f - std::floor(note * 0.6180340f);
    const float silver = note * 0.4142136f - std::floor(note * 0.4142136f);
    voice.turned = note * 0.46f;
    voice.nature = 2.0f * golden - 1.0f;
    voice.spread = 2.0f * silver - 1.0f;
    voice.phase = 0.04 + 0.46 * golden;
    voice.rate = param(clock_room::kBeat);
    voice.rng.seed(0xC10C4u + static_cast<uint32_t>(frequency * 8.0f) * 2654435761u);
    voice.answer = -1.0f;
    voice.brake = 0.0f;
    voice.fresh = false;
    voice.steal = 1.0f;
    voice.follow = voice.floor = 0.0f;
    voice.bloom = 0.0f;
    voice.ease = 0.0f;
    const Manner manner = wall_.manner_of(voice);
    voice.place = manner.place;
    voice.low = manner.low;
    voice.high = manner.high;
    voice.sway = manner.swing;
    voice.apart = manner.apart;
    tune(voice);
    gains(voice, true);
    wind(voice, gain);
  }

  // The key's own strike: it winds the spring too.
  void wind(Voice& voice, float gain) {
    const int kind = choice(clock_room::kEscapement);
    voice.strength = gain;
    voice.spring = 1.0f;
    voice.ease_hold = ease_ticks_;
    const float touch = kind == kRubOnly ? 0.14f : 1.0f;
    const int first = rods_swapped(voice) ? 1 : 0;
    strike(voice, first, gain * touch, kind == kRubOnly ? -0.2f : (kind == kChimeHammer ? 0.2f : 0.0f));
    if (kind == kChimeHammer) {
      voice.answer = 0.5f / kit::max(param(clock_room::kBeat), 0.05f);
    } else {
      strike(voice, 1 - first, gain * touch * 0.8f, kind == kRubOnly ? -0.2f : 0.0f);
    }
  }
  bool rods_swapped(const Voice& voice) const {
    return voice.odd && choice(clock_room::kWall) == ClockWall::kOpposed && wall_.opposes();
  }

  void strike(Voice& voice, int rod, float gain, float edge) {
    if (gain <= 0.0f) return;
    if (voice.struck(rod)) {
      if (voice.pulse_at[rod] > 0) {  // in the middle of a strike: the next follows it
        voice.queued[rod] = together(voice.queued[rod], gain);
        voice.queued_edge[rod] = edge;
        return;
      }
      gain = together(gain, voice.given[rod]);  // two in one instant are one
    }
    voice.given[rod] = gain;
    const clock_room_tables::Gong& gong = clock_room_tables::gong(choice(clock_room::kGong));
    const float sr = sample_rate();
    const Manner manner = wall_.manner_of(voice);
    const float forced = kit::min(gain * manner.force * (1.0f + 0.4f * param(clock_room::kUnlike) * voice.nature), 1.3f);
    const float hardness = hardness_of(forced, edge + manner.edge + 0.30f * param(clock_room::kUnlike) * voice.spread);
    const float contact = kSoftContact * std::pow(kHardContact / kSoftContact, hardness) * (1.25f - 0.4f * kit::min(forced, 1.0f));
    const float most = kHeard * kLevel * force_of(forced) * evened(voice.frequency);
    const float hit = kLevel * force_of(forced);
    const float bloom = std::pow(param(clock_room::kBloom), 1.7f);
    // Brass wakes the upper tones more than their places alone would have it.
    const float bare = 1.3f * (hardness - 0.4f) + (rod == 1 ? 0.35f : 0.0f);
    const float raw = bent();
    const float lasting = 0.5f * kit::min(train().ring * case_.ring(), 1.0f);  // a short ring cuts off what comes late
    const float over = over_middle(voice.frequency);
    const float lean = train().tilt;
    const float damped = kit::min(kDamped * std::sqrt(forced), 0.6f);
    const float rod_hz = voice.frequency * (rod == 1 ? kit::semitones_to_ratio(interval_.value) : 1.0f);
    // A quarter turn before what rings or one after it, so that hard and soft
    // strikes come out even: a clock that strikes for a long time does not
    // drift sharp.
    const float turn = voice.ahead[rod] > 0.0f ? -1.0f : 1.0f;
    voice.ahead[rod] = 0.95f * voice.ahead[rod] + turn * forced;
    float power = 0.0f, bright = 0.0f, amounts[kModes], owed[kModes], upper[kModes];
    for (int k = 0; k < kModes; ++k) {
      const int s = rod * kModes + k;
      const clock_room_tables::Mode& mode = gong.modes[k];
      const float ratio = ratio_[k];
      float amount = hit * mode.level * share(ratio, rod_hz * ratio, contact, hardness) * ClockWall::struck_at(voice, manner, ratio);
      if (ratio < 0.9f) amount *= manner.hum;
      if (ratio < 1.8f) amount *= (train().low + (1.0f - train().low) * 0.6f * over) * (1.0f + gong.root * over);
      if (ratio > 1.0f) amount *= std::exp2(place_[k].value * (lean + bare));
      amount *= raw_level(k, raw);
      const float ear = voice.lift[s] * near_ear(rod_hz * ratio) * (k < 4 ? manner.low : manner.high);
      owed[k] = 0.0f;
      if (ratio > gong.from && bloom > 0.0f && !voice.off[s]) {
        const float deep = kit::min((ratio - gong.from) * 0.5f, 1.0f);
        owed[k] = hit * mode.level * bloom * deep * gong.bloom * train().bloom * (0.35f + 0.9f * kit::min(forced, 1.0f)) * kLate /
                         (1.0f + gong.dark * ratio * ratio);
        power += lasting * sq(owed[k] * ear);
        amount *= 1.0f - 0.75f * bloom * deep;
      }
      if (voice.off[s]) amount = 0.0f;
      amounts[k] = amount;
      const float over_bright = sq(rod_hz * ratio * (1.0f / 2100.0f));
      upper[k] = over_bright / (1.0f + over_bright);
      power += sq(amount * ear);
      bright += sq((amount + 0.5f * owed[k]) * upper[k] * ear);
    }
    // However bright the hammer, the metal and the case, no strike is far louder than another.
    const float heard = std::sqrt(power);
    const float eased = eased_to(most, heard);
    const float glare = std::sqrt(bright) * eased;
    const float dimmed = glare > kMostBright * most ? std::pow(kMostBright * most / glare, 0.75f) : 1.0f;
    for (int k = 0; k < kModes; ++k) {
      const int s = rod * kModes + k;
      const float let = eased * (1.0f + upper[k] * (dimmed - 1.0f));
      const float amount = amounts[k] * let;
      voice.late[s] += owed[k] * let;
      const float re = voice.re[s], im = voice.im[s];
      const float ringing = std::sqrt(re * re + im * im);
      if (ringing < 1.0e-8f) {
        const float phase = voice.turned + 0.21f * static_cast<float>(k) + 0.37f * static_cast<float>(rod);
        voice.push_re[s] = amount * kit::SineTable::cos_lookup(phase);
        voice.push_im[s] = amount * kit::SineTable::lookup(phase);
      } else {
        voice.push_re[s] = -turn * amount * im / ringing - damped * re;
        voice.push_im[s] = turn * amount * re / ringing - damped * im;
      }
    }
    const float seconds = kSoftAttack * std::pow(kHardAttack / kSoftAttack, hardness) * gong.attack *
                          std::sqrt(kit::clamp(220.0f / voice.frequency, 0.15f, 2.0f));
    voice.pulse_at[rod] = 0;
    voice.pulse_length[rod] = kit::clamp_int(static_cast<int>(kit::clamp(seconds, 0.0006f, 0.09f) * sr + 0.5f), 8, 1 << 20);
    voice.floor = kit::max(voice.floor, heard * eased);
    voice.follow = kit::max(voice.follow, voice.floor);
    if (rod == 0 || second_.value > 0.0f) {
      voice.bloom = 1.0f;
      voice.struck_lately = 1.0f;
      voice.hammer(case_, kKnockLevel * gong.knock * train().knock * (rod == 1 ? second_.value : 1.0f), forced, hardness, sr, noise_scale_);
    }
  }

  // --- pitch, decay and place ----------------------------------------------

  // The gong as it stands between one shape and the next.
  void shape() {
    for (int k = 0; k < kModes; ++k) {
      ratio_[k] = std::exp2(place_[k].value);
      ring_[k] = std::exp2(keep_[k].value);
    }
  }

  // A step of the gong to its next shape. A tone that is moved up gives up
  // level as it goes, as it would with the energy it has.
  void bend() {
    float before[kModes];
    for (int k = 0; k < kModes; ++k) before[k] = ratio_[k];
    shape();
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      for (int s = 0; s < Voice::kSlots; ++s) {
        const float up = ratio_[s % kModes] / before[s % kModes];
        if (up <= 1.0f) continue;
        const float less = 1.0f / (up * up);
        voice.re[s] *= less;
        voice.im[s] *= less;
      }
    }
  }

  void tune(Voice& voice) {
    using namespace clock_room;
    const float sr = sample_rate();
    const float decay = kit::clamp(param(kDecay) * gong_decay_.value * train().ring * case_.ring() * std::exp2(-0.9f * param(kUnlike) * voice.nature) * std::pow(kit::clamp(220.0f / voice.frequency, 0.1f, 8.0f), 0.3f),
                                   0.15f, 60.0f);
    float choke = 0.0f;
    if (voice.released()) {
      const float rest = decay / kit::max(train().ring, 1.0f);  // a rub that is let go rings as a strike does
      const float seconds = rest * std::pow(kit::min(kShortestChoke / rest, 1.0f), std::pow(param(kHush), 1.5f));
      choke = kSixtyDb / seconds - kSixtyDb / decay;
    }
    const float second = kit::semitones_to_ratio(interval_.value);
    const float top = kit::min(kTopHz, 0.46f * sr);
    for (int rod = 0; rod < kRods; ++rod) {
      const float hz_of_rod = voice.frequency * (rod == 1 ? second : 1.0f);
      const float beat = (rod == 1 ? 0.5f : -0.5f) * kit::min(kRodBeat, 0.0013f * hz_of_rod);
      for (int k = 0; k < kModes; ++k) {
        const int s = rod * kModes + k;
        const float hz = hz_of_rod * ratio_[k] + off_[k].value + beat * ratio_[k];
        voice.lift[s] = case_.lift(kit::max(hz, 12.0f));
        voice.off[s] = hz >= top || hz < 12.0f;
        if (voice.off[s]) {
          voice.base_re[s] = voice.base_im[s] = voice.step_re[s] = voice.step_im[s] = 0.0f;
          voice.late[s] = 0.0f;
          continue;
        }
        // Metal high up dies sooner whatever its gong.
        const float seconds = decay * ring_[k] / (1.0f + (hz * hz) * (1.0f / (6500.0f * 6500.0f)));
        float nepers = kSixtyDb / kit::max(seconds, 0.02f) + choke;
        if (hz > kEdgeHz) nepers += 40.0f * (hz - kEdgeHz) * (1.0f / (kTopHz - kEdgeHz));
        voice.nepers[s] = nepers / sr;
        const double radius = std::exp(-static_cast<double>(voice.nepers[s]));
        const double w = 2.0 * 3.14159265358979323846 * hz / sr;
        voice.base_re[s] = static_cast<float>(radius * std::cos(w));
        voice.base_im[s] = static_cast<float>(radius * std::sin(w));
        const double re = voice.base_re[s], im = voice.base_im[s];
        // What rounding did to the decay over a tick.
        voice.correction[s] =
            static_cast<float>(1.0 - kChunk * (static_cast<double>(voice.nepers[s]) + 0.5 * std::log(re * re + im * im)));
        voice.step_re[s] = voice.base_re[s];
        voice.step_im[s] = voice.base_im[s];
      }
    }
    voice.tuned = tune_serial_;
    voice.tuned_released = voice.released();
  }

  // The four sums of a clock, with the pendulum's swing in level, colour and place.
  void gains(Voice& voice, bool snap) {
    const float turn = static_cast<float>(voice.phase - 2.0 * std::floor(voice.phase * 0.5));
    const float swing = swung_by(voice) * voice.ease;
    const float side = kit::SineTable::cos_lookup(turn * 0.5f);
    const float width = width_.value;
    const float level = second_level(), first = first_level();
    const float both = 1.0f / std::sqrt(first * first + 0.95f * level * level);
    for (int bus = 0; bus < kBuses; ++bus) {
      const bool second = bus >= 2, upper = (bus & 1) != 0;
      const float rod_side = (second ? 0.32f : -0.32f) * (upper ? -1.2f : 1.0f);
      float left, right;
      kit::pan_gains((0.95f * voice.place + voice.apart * (rod_side + 0.45f * swing * side)) * width, &left, &right);
      const float dip = dip_of(turn, second ? back_.value : 0.0f);
      // The more it swings, the shorter the while it is before the rod.
      const float near = std::pow(1.0f - dip, (upper ? 1.3f : 1.0f) + 2.0f * swing * swing);
      const float passing = (1.0f + 0.45f * swing) * (1.0f - swing * (1.0f - near)) * (upper ? voice.high : voice.low);
      const float gain = passing * (second ? level : first) * both;
      const float to_left = gain * left, to_right = gain * right;
      if (snap) {
        voice.gain_left[bus] = to_left;
        voice.gain_right[bus] = to_right;
      }
      voice.step_left[bus] = (to_left - voice.gain_left[bus]) * (1.0f / kChunk);
      voice.step_right[bus] = (to_right - voice.gain_right[bus]) * (1.0f / kChunk);
    }
  }
  // Swing as the wall carries it.
  float swung_by(const Voice& voice) const { return 1.0f - std::pow(1.0f - swing_.value, voice.sway); }
  // How far the pendulum is from the rod, 0 to 1: `turn` is its place in two swings.
  float dip_of(float turn, float back) const {
    const float slow = wall_.waves();
    const float one = kit::SineTable::cos_lookup(turn + back), two = kit::SineTable::cos_lookup(0.5f * turn + back);
    return 0.5f - 0.5f * (one + (two - one) * slow);
  }
  float second_level() const { return std::pow(second_.value, 0.75f); }
  // The more there is of the second rod, the less there is of the first.
  float first_level() const { return 1.0f - 0.5f * second_.value * second_.value; }

  // Every clock more leaves a little less room for each, so a full wall stays
  // under the clip's knee.
  void make_room() {
    float many = 0.0f;
    for (const Voice& voice : voices_) many += voice.sounding && (!voice.released() || voice.follow > 0.004f) ? 1.0f : 0.0f;
    const float to = 1.0f / std::sqrt(1.0f + 0.19f * kit::max(many - 1.0f, 0.0f));
    if (tick_count_ == 0) room_now_ = to;
    room_step_ = (to - room_now_) * kit::min(tick_seconds_ * 25.0f, 1.0f) * (1.0f / kChunk);
  }

  // --- every kChunk samples ------------------------------------------------

  void control() {
    using namespace clock_room;
    for (kit::Smoother* knob : {&back_, &second_, &glow_, &swing_, &width_, &tick_level_}) knob->next();
    wall_.next();
    if (!interval_.settled()) {
      interval_.next();
      ++tune_serial_;
    }
    if (gong_moves_) {
      gong_moves_ = false;
      for (int k = 0; k < kModes; ++k) {
        for (kit::Smoother* part : {&place_[k], &keep_[k], &rub_[k], &off_[k]}) {
          part->next();
          gong_moves_ = gong_moves_ || !part->settled();
        }
      }
      gong_decay_.next();
      gong_moves_ = gong_moves_ || !gong_decay_.settled();
      bend();
      tilt();
      ++tune_serial_;
    }
    case_.control(kChunk);
    for (Voice& voice : voices_) {
      // What was taken has faded: its clock may begin.
      if (voice.sounding && voice.pending && voice.steal <= 0.0f) {
        voice.frequency = voice.pending_frequency;
        voice.pending = false;
        voice.fresh = true;
        ++member_serial_;
      }
    }
    make_room();
    if (ranked_ != member_serial_) wall_.rank(voices_);
    ranked_ = member_serial_;
    wall_.fill(tick_count_ == 0);
    for (Voice& voice : voices_) {
      if (!voice.sounding || voice.pending) continue;
      if (voice.fresh) start(voice, voice.pending_frequency, voice.pending_gain);
      control_voice(voice);
    }
    if ((tick_count_ & 3u) == 0) wall_.couple(voices_, choice(kWall), param(kBeat), param(kLearn), param(kUnlike));
    ++tick_count_;
  }

  void control_voice(Voice& voice) {
    if (voice.tuned != tune_serial_ || voice.tuned_released != voice.released()) tune(voice);
    if (!voice.released()) {
      const float run = param(clock_room::kRunDown);
      if (run > 0.0f) {
        const float seconds = 40.0f * std::pow(0.035f, run);
        voice.spring = kit::max(voice.spring - tick_seconds_ * kit::min(run * 25.0f, 1.0f) / seconds, 0.0f);
      }
    }
    swing(voice);
    for (int rod = 0; rod < kRods; ++rod) {
      if (voice.struck(rod)) continue;
      if (voice.queued[rod] > 0.0f) {
        const float gain = voice.queued[rod];
        voice.queued[rod] = 0.0f;
        strike(voice, rod, gain, voice.queued_edge[rod]);
      }
    }
    if (voice.ease_hold > 0) {
      --voice.ease_hold;
      voice.ease *= ease_fall_;
    } else {
      voice.ease += (1.0f - voice.ease) * kit::min(tick_seconds_ * 2.2f, 1.0f);
    }
    const Manner manner = wall_.manner_of(voice);
    const float glide = kit::min(tick_seconds_ * 3.0f, 1.0f);
    voice.place += (manner.place - voice.place) * glide;
    voice.low += (manner.low - voice.low) * glide;
    voice.high += (manner.high - voice.high) * glide;
    voice.sway += (manner.swing - voice.sway) * glide;
    voice.apart += (manner.apart - voice.apart) * glide;
    voice.struck_lately *= 1.0f - kit::min(tick_seconds_ * 5.0f, 0.9f);
    if (voice.struck_lately < 1.0e-6f) voice.struck_lately = 0.0f;
    gains(voice, false);
    feed(voice);
  }

  // The pendulum goes on by a tick; what it passes is struck.
  void swing(Voice& voice) {
    using namespace clock_room;
    const int kind = choice(kEscapement);
    const double before = voice.phase;
    voice.phase += static_cast<double>(voice.rate) * tick_seconds_;
    float brake = 0.0f;
    if (!voice.released() && voice.spring > 0.0f) {
      const float force = param(kStrikes) * voice.strength * (0.2f + 0.8f * voice.spring);
      const clock_room_tables::Escapement& train = clock_room_tables::escapement(kind);
      const bool swapped = rods_swapped(voice);
      const bool slow = wall_.waves() > 0.5f;
      for (int t = 0; t < train.touches; ++t) {
        const clock_room_tables::Touch& touch = train.list[t];
        if (!passed(before, voice.phase, touch.at)) continue;
        if (slow && ((static_cast<long long>(std::floor(voice.phase)) & 1) != 0)) continue;
        const int rod = swapped ? 1 - touch.rod : touch.rod;
        strike(voice, rod, force * touch.force, touch.edge);
        strike(voice, 1 - rod, force * touch.force * touch.other, touch.edge);
      }
      if (tick_level_.value > 0.0f) {
        const float loud = kit::min(0.4f + 0.6f * voice.spring, 1.0f);
        for (int t = 0; t < 4; ++t) {
          static constexpr float kAt[4] = {0.0f, 0.27f, 0.5f, 0.77f};
          static constexpr float kLoud[4] = {1.0f, 0.5f, 0.8f, 0.5f};
          if (passed(before, voice.phase, kAt[t])) voice.let_go(case_, t, kTickLevel * tick_level_.value * loud * kLoud[t], sample_rate(), noise_scale_);
        }
      }
      if (kind == kDeadbeat) {
        const float within = static_cast<float>(voice.phase - std::floor(voice.phase));
        brake = within > 0.34f && within < 0.97f ? param(kStrikes) : 0.0f;
      }
    }
    voice.brake += (brake - voice.brake) * kit::min(tick_seconds_ * 30.0f, 1.0f);
    if (voice.brake < 1.0e-5f) voice.brake = 0.0f;
    if (voice.released()) voice.answer = -1.0f;
    if (voice.answer >= 0.0f) {
      voice.answer -= tick_seconds_;
      if (voice.answer < 0.0f) strike(voice, rods_swapped(voice) ? 0 : 1, voice.strength * 1.05f * param(kStrikes), -0.04f);
    }
  }
  static float sq(float x) { return x * x; }
  static bool passed(double before, double now, double at) { return std::floor(now - at) > std::floor(before - at); }

  // What is fed to the modes over the next tick (the rub and the late rise),
  // what the brake takes, and how loud the clock is.
  void feed(Voice& voice) {
    using namespace clock_room;
    const int kind = choice(kEscapement);
    const clock_room_tables::Gong& gong = clock_room_tables::gong(choice(kGong));
    const bool rub_only = kind == kRubOnly;
    const bool rubbing = !voice.released() && voice.spring > 0.0f;
    const float over = over_middle(voice.frequency);
    const Manner manner = wall_.manner_of(voice);
    const float turn = static_cast<float>(voice.phase - 2.0 * std::floor(voice.phase * 0.5));
    const float press = 1.0f - dip_of(turn, 0.0f);
    const float swung = 1.0f - swung_by(voice) * (1.0f - press * press * 1.25f);
    float glow = rub_only ? 0.48f + 0.55f * glow_.value : glow_.value * train().glow;
    glow *= (rub_only ? 1.5f : 1.0f) * voice.spring * kit::max(swung, 0.02f) * (0.25f + 0.75f * voice.strength);
    const float loud = rubbing ? kRubLevel * glow : 0.0f;
    const float raw = bent();
    const float root = 1.0f + gong.root * over;
    const float per_sample = tick_seconds_ / static_cast<float>(kChunk);
    const float grow = per_sample * (rub_only ? 0.5f : 1.3f);
    const float late_seconds = kLateSeconds * gong.attack;
    const float late_share = kit::min(tick_seconds_ / (0.55f * late_seconds), 1.0f);
    const float brake = voice.brake * 13.0f * voice.rate * per_sample;  // as deep in every swing, fast or slow
    const bool owed = voice.bloom > 0.0f;
    const float held = 0.92f * (1.0f - std::pow(1.0f - param(kBloom), 2.5f));
    const float flare = param(kBloom) * (rub_only ? 1.0f : 0.5f);
    float energy = 0.0f;
    bool moves = false;
    for (int rod = 0; rod < kRods; ++rod) {
      const float level = rod == 1 ? second_level() : 1.0f;
      float targets[kModes] = {};
      if (loud > 0.0f) {
        float heard = 0.0f, bright = 0.0f, upper[kModes];
        for (int k = 0; k < kModes; ++k) {
          const int s = rod * kModes + k;
          if (rub_[k].value <= 0.0f || voice.off[s]) continue;
          const float ratio = ratio_[k];
          const float wander = kit::SineTable::lookup(wander_at(voice, s));
          const float up = kit::clamp(place_[k].value, 0.0f, 3.0f);
          float target = loud * rub_[k].value * (1.0f + 0.65f * wander) * ClockWall::struck_at(voice, manner, ratio) * tilt_[k] *
                         (rub_only ? 0.22f + (1.0f + 1.7f * glow_.value) * up : 0.8f + 0.5f * glow_.value * up);
          // Bloom holds the upper tones of a rub back and lets them flare one after another.
          const float high_up = kit::min(1.4f * up, 1.5f);
          target *= 1.0f + flare * high_up * (wander > 0.0f ? 6.5f * wander * wander - 0.62f : -0.62f);
          target *= kit::max(1.0f + manner.edge * place_[k].value, 0.2f) / (1.0f + sq(sq(voice.frequency * ratio * (1.0f / 2700.0f))));
          if (ratio < 1.8f) target *= root;
          if (ratio < 0.9f) target *= manner.hum;
          target *= raw_level(k, raw);
          if (rod == 1 && up > 0.0f) target *= 1.0f + 0.35f * up;
          targets[k] = kit::max(target, 0.0f);
          const float ear = targets[k] * voice.lift[s] * near_ear(voice.frequency * ratio) * (k < 4 ? manner.low : manner.high);
          const float over_bright = sq(voice.frequency * ratio * (1.0f / 2100.0f));
          upper[k] = over_bright / (1.0f + over_bright);
          heard += sq(ear);
          bright += sq(ear * upper[k]);
        }
        // Nor is any rub: see strike().
        heard = std::sqrt(heard);
        const float most = kRubHeard * loud * evened(voice.frequency);
        const float eased = eased_to(most, heard);
        const float glare = std::sqrt(bright) * eased;
        const float dimmed = glare > kMostBright * most ? std::pow(kMostBright * most / glare, 0.85f) : 1.0f;
        for (int k = 0; k < kModes; ++k) {
          if (targets[k] > 0.0f) targets[k] *= eased * (1.0f + upper[k] * (dimmed - 1.0f));
        }
      }
      for (int k = 0; k < kModes; ++k) {
        const int s = rod * kModes + k;
        if (voice.off[s]) {
          voice.re[s] = voice.im[s] = 0.0f;
          continue;
        }
        float re = voice.re[s] * voice.correction[s], im = voice.im[s] * voice.correction[s];
        const float power = re * re + im * im;
        energy += power * level * level;
        float more = 0.0f;
        const float target = targets[k];
        const bool late = owed && voice.late[s] > 1.0e-7f && !voice.struck(rod);  // not while a strike goes in
        if (target > 0.0f || late) {
          float amplitude = std::sqrt(power);
          const float seed = 3.0e-3f * kit::max(target, late ? voice.late[s] : 0.0f);
          if (amplitude < seed) {
            const float phase = voice.turned + 0.21f * static_cast<float>(k) + 0.37f * static_cast<float>(rod);
            const float c = amplitude > 1.0e-9f ? re / amplitude : kit::SineTable::cos_lookup(phase);
            const float n = amplitude > 1.0e-9f ? im / amplitude : kit::SineTable::lookup(phase);
            amplitude = seed;
            re = seed * c;
            im = seed * n;
          }
          if (amplitude < target) more = kit::min((target - amplitude) / amplitude, 5.0f) * grow + voice.nepers[s];
          if (late) {
            more = kit::max(more, held * voice.nepers[s]);
            const float given = kit::min(voice.late[s] * late_share, 0.45f * amplitude);
            voice.late[s] -= given;
            more += given / (amplitude * static_cast<float>(kChunk));
          }
        } else if (power < 1.0e-22f) {
          re = im = 0.0f;
        }
        voice.re[s] = re;
        voice.im[s] = im;
        const float scale = 1.0f + more - (power > sq(target) ? brake : 0.0f);  // a rub goes on under it
        voice.step_re[s] = voice.base_re[s] * scale;
        voice.step_im[s] = voice.base_im[s] * scale;
        moves = moves || more > 0.0f;
      }
    }
    if (voice.released() && owed) {
      voice.bloom -= tick_seconds_;
      if (voice.bloom < 0.0f) voice.forget();
    }
    const float ringing = 1.4f * std::sqrt(energy);
    const bool striking = voice.struck(0) || voice.struck(1) || voice.queued[0] > 0.0f || voice.queued[1] > 0.0f;
    if (!striking) voice.floor = 0.0f;
    voice.follow = kit::max(kit::max(voice.floor, ringing), kSilence);
    breathe(voice, rubbing ? glow : 0.0f, rub_only);
    if (voice.knock < 1.0e-7f) voice.knock = 0.0f;
    if (voice.tick < 1.0e-7f) voice.tick = 0.0f;
    if (voice.released() && !striking && !moves && voice.answer < 0.0f && voice.knock == 0.0f && voice.tick == 0.0f &&
        voice.air < 1.0e-7f && ringing < kSilence) {
      voice.retire();
    }
  }

  // Each mode's rub comes and goes by itself, over three to ten seconds.
  float wander_at(const Voice& voice, int s) const {
    const float slow = 0.10f + 0.011f * static_cast<float>((s * 7) % 23);
    const float at = static_cast<float>(tick_count_ & 0x3fffffu) * tick_seconds_ * slow;
    return at - std::floor(at) + 0.6180340f * static_cast<float>(s) + voice.turned;
  }
  // A harder hammer's rub is brighter.
  void tilt() {
    const float slope = 1.2f * (param(clock_room::kHammer) - 0.4f);
    for (int k = 0; k < kModes; ++k) tilt_[k] = place_[k].value > 0.0f ? std::exp2(place_[k].value * slope) : 1.0f;
  }

  // The rub itself, heard as air.
  void breathe(Voice& voice, float glow, bool rub_only) {
    const float hz = kit::clamp(voice.frequency * 5.0f, 700.0f, 3000.0f);
    const float to = kAirLevel * (rub_only ? 3.0f : 0.35f) * glow * glow * noise_scale_ * (0.3f + 0.9f * param(clock_room::kHammer)) /
                     kit::max(case_.lift(hz), 1.0f);
    const float next = voice.air + (to - voice.air) * kit::min(tick_seconds_ * 9.0f, 1.0f);
    voice.air_step = ((next < 1.0e-7f ? 0.0f : next) - voice.air) * (1.0f / kChunk);
    if (next > 0.0f) voice.air_filter.set(hz, 0.8f, sample_rate());
  }

  Voice voices_[kMaxVoices];
  ClockCase case_;
  ClockWall wall_;
  kit::Smoother back_, second_, interval_, glow_, swing_, width_, tick_level_;  // once a tick
  kit::Smoother place_[kModes], keep_[kModes], rub_[kModes], off_[kModes], gong_decay_;
  kit::Smoother volume_;  // every sample
  kit::IdleGate idle_;
  float ratio_[kModes] = {}, ring_[kModes] = {}, tilt_[kModes] = {};
  uint32_t tune_serial_ = 1, member_serial_ = 1, ranked_ = 0;
  uint32_t stamp_ = 0, tick_count_ = 0;
  int chunk_left_ = 0;
  int quiet_ = 0, rest_samples_ = 1;
  float room_now_ = 1.0f, room_step_ = 0.0f;
  float noise_scale_ = 1.0f;
  float ease_fall_ = 0.6f;
  int ease_ticks_ = 8;
  float tick_seconds_ = 0.0f;
  float steal_step_ = 0.0f;
  bool gong_moves_ = false;
};

}  // namespace livemix
