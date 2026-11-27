#pragma once

// Slow Accord: metal whose overtones learn the chord.
//
//   key ─► metal (a note and 3 to 19 overtones) ─► one overtone after another
//          leans out, travels to a tone that agrees, rests there and sounds on
//   all keys ─► tone + breath ─► volume ─► soft clip        (glints beside them)
//
// - The note of a key never moves. Each overtone has a place in the metal and
//   a goal (regoal): a tone of the held chord in any octave, one of the key's
//   own overtones, an octave, or an overtone of a tone under the lowest key.
//   Goals keep the order of the metal, so overtones do not cross.
// - Three overtones at most are on their way at once over ALL keys (dispatch).
//   Starts are a third of Travel apart and go round the keys, so a chord
//   agrees a tone at a time. A change of chord sends what rested where it no
//   longer agrees on its way again, through the same three places.
// - On its way an overtone comes forward by Forward. An arrived one sounds on
//   at Glow. One that has not gone yet dies away as metal does. That is how a
//   bell becomes a pad. At full Glow a key is sung and hardly struck, and a
//   slow Attack is a soft mallet: it wakes less of what is high.
// - Again sends what rests on its way again, one at a time: Rest is the pause
//   between one that leaves and the next. Swing leaves a pendulum in each key
//   that all its resting overtones hang on.
// - Nothing clicks on arriving or leaving: the path is continuous and slows to
//   rest, or the overtone is silent where it jumps (Steps, Dissolve), and it
//   leaves from as loud as it was.
// - On the last half of its way an overtone falls into step with the phase
//   every key agrees on for its goal (reference), and at rest it is held there
//   by less than two cents. Keys that end on one tone add, and never cancel.
// - Two laws keep the level: the makeup of a key, from what it is struck with
//   and what it rests at together (weigh), and the room of all keys, which
//   brings what is over kRoom down to a fifth of its decibels (control).
// - A partial is a phase, a frequency and two gains on a 32 sample clock, and
//   a turned complex number between the ticks, four at a time.
// - A key struck again is a new voice. The one that rang is let go fast, or as
//   slowly as the new one swells.
//   The clock and everything that runs free starts again with the first key
//   after a silence, so the output does not depend on the block size.

#include <initializer_list>

#include "../../kit/kit.h"
#include "params.gen.h"
#include "materials.h"
#include "voice.h"
#include "chimes.h"

namespace livemix {
namespace slow_accord {

class SlowAccord : public kit::DeviceBase<kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kSlots = 3;  // overtones on their way at once
  enum Meter : int { kMeterAgreed = 0, kMeterAway, kMeterMoving, kMeterLevel };

  void init(float sample_rate) {
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) voice = Voice();
    dt_ = static_cast<float>(kTick) / sr;
    stamp_ = 0;
    tick_left_ = 0;
    for (kit::Smoother* knob : {&glow_, &tilt_, &air_, &spread_, &forward_, &leftover_, &manner_, &swing_}) {
      knob->set_time(kKnobSeconds, sr / static_cast<float>(kTick));
    }
    volume_.set_time(0.02f, sr);
    chimes_.init(sr);
    knock_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    restart();
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    if (!store_param(id, value)) return;
    if (id == kGoal || id == kBend || id == kAgain) dirty_ = true;
    set_knobs(primed());
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (gain <= 0.0f) return note_off(note_id);
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!alive()) restart();
    for (Voice& voice : voices_) {
      if (voice.used()) voice.drop(note_id);
    }
    // The same pitch again: the voice that has it hands over who holds it.
    int ids[kHolders], count = 0;
    for (Voice& voice : voices_) {
      if (!voice.used()) continue;
      if (voice.pending && voice.next_hz == frequency) {
        voice.hold(note_id);
        voice.next_gain = kit::max(voice.next_gain, gain);
        return;
      }
      if (voice.pending || voice.hz0 != frequency) continue;
      for (int i = 0; i < voice.holders && count < kHolders - 1; ++i) ids[count++] = voice.ids[i];
      voice.holders = 0;
      voice.damped = true;
    }
    Voice& voice = voices_[pick()];
    voice.holders = 0;
    for (int i = 0; i < count; ++i) voice.hold(ids[i]);
    voice.hold(note_id);
    voice.stamp = ++stamp_;
    voice.pending = true;
    voice.next_hz = frequency;
    voice.next_gain = gain;
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (voice.used()) voice.drop(note_id);
    }
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
      if (tick_left_ == 0) {
        control();
        tick_left_ = kTick;
      }
      const int n = kit::clamp_int(frames - done, 1, tick_left_);
      render(n, out_left_ + done, out_right_ + done);
      tick_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // How many of the held keys' overtones have arrived (0 to 1), how far from
  // its goals the newest key is on the whole (cents), how many of the three
  // places are taken (0 to 1), and how loud the keys are.
  float meter(int index) const {
    int at = 0, all = 0, moving = 0;
    float level = 0.0f;
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (!voice.sounding) continue;
      level = kit::max(level, voice.follow);
      for (int k = 1; k < voice.count; ++k) {
        moving += voice.state[k] == kMoving ? 1 : 0;
        if (voice.holders == 0) continue;
        ++all;
        at += voice.state[k] == kRested ? 1 : 0;
      }
      if (voice.holders > 0 && (!newest || voice.stamp > newest->stamp)) newest = &voice;
    }
    switch (index) {
      case kMeterAgreed:
        return all > 0 ? static_cast<float>(at) / static_cast<float>(all) : 0.0f;
      case kMeterAway: {
        if (!newest) return 0.0f;
        float sum = 0.0f;
        for (int k = 1; k < newest->count; ++k) sum += std::fabs(newest->place[k] - newest->goal[k]);
        return 1200.0f * sum / static_cast<float>(kit::clamp_int(newest->count - 1, 1, kP));
      }
      case kMeterMoving:
        return static_cast<float>(moving) * (1.0f / kSlots);
      case kMeterLevel:
        return level;
      default:
        return 0.0f;
    }
  }

  // For the harness: overtone k of the voice that holds `note_id`, its pitch
  // now (Hz) and whether it is on its way. 0 for what there is not.
  float overtone_hz(int note_id, int k) const {
    for (const Voice& voice : voices_) {
      if (voice.sounding && voice.holds(note_id) && k >= 0 && k < voice.count) return voice.hz[k];
    }
    return 0.0f;
  }
  int moving_now() const {
    int moving = 0;
    for (const Voice& voice : voices_) {
      for (int k = 1; voice.sounding && k < voice.count; ++k) moving += voice.state[k] == kMoving ? 1 : 0;
    }
    return moving;
  }

 private:
  static constexpr int kTick = 32;
  static constexpr int kP = kPartials;
  static constexpr int kCandidates = 64;
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 6000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kLevel = 0.18f;        // a full strike
  static constexpr float kKnobSeconds = 0.02f;
  static constexpr float kStealSeconds = 0.004f;
  static constexpr float kDampSeconds = 0.18f;  // what rang when its key is struck again, at the least
  static constexpr float kRoom = 0.12f;         // what all keys make together before they make room
  static constexpr float kEdgeHz = 8500.0f;     // partials fade out between these
  static constexpr float kTopHz = 12500.0f;
  static constexpr float kGoalHz = 8000.0f;     // no goal is over this
  static constexpr float kSilence = 1.0e-5f;
  static constexpr float kPullHz = 0.35f;       // the most a resting overtone is drawn by
  static constexpr float kPullShare = 0.0008f;
  static constexpr float kStepHz = 8.0f;        // and one that is about to arrive
  static constexpr float kStepShare = 0.03f;
  static constexpr float kAgreed = 0.0004f;     // octaves: this near is there

  bool alive() const {
    for (const Voice& voice : voices_) {
      if (voice.used()) return true;
    }
    return chimes_.sounding();
  }

  int choice(int id) const { return static_cast<int>(param(id) + 0.5f); }

  void set_knobs(bool glide) {
    glow_.set(param(kGlow), glide);
    tilt_.set(param(kTilt), glide);
    air_.set(param(kAir), glide);
    spread_.set(param(kSpread), glide);
    forward_.set(param(kForward), glide);
    leftover_.set(param(kLeftover), glide);
    manner_.set(param(kManner), glide);
    swing_.set(param(kSwing), glide);
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
  }

  // The first key after a silence: every knob where it points, the clock and
  // all that runs free at its start.
  void restart() {
    set_knobs(false);
    tick_left_ = 0;
    seconds_ = 0.0;
    until_next_ = 0.0f;
    again_wait_ = busy_ = 0.0f;
    crowd_ = 1.0f;
    old_first_ = 0.0f;
    held_ = 0;
    dirty_ = true;
    rng_.seed(0x51A0ACC0u);
  }

  // An idle voice, else the quietest let go, else the quietest held, the
  // oldest on a tie; one a key already waits in only when there is no other.
  int pick() const {
    int best = -1;
    for (int pass = 0; pass < 4 && best < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0 && voice.used()) continue;
        if (pass == 1 && (voice.pending || voice.holders > 0)) continue;
        if (pass == 2 && voice.pending) continue;
        if (best < 0) {
          best = v;
          continue;
        }
        const float mine = pass == 0 ? 0.0f : voice.follow, its = pass == 0 ? 0.0f : voices_[best].follow;
        if (mine < its || (mine == its && voice.stamp < voices_[best].stamp)) best = v;
      }
    }
    return best;
  }

  // --- goals ----------------------------------------------------------------

  // Tones, in octaves over this key, that its overtones may go to, rising.
  int tones_for(const Voice& voice, float* tones) const {
    const int goal = choice(kGoal);
    const float most = kit::min(goal == kChord ? body(voice.material).reach : (goal == kBass ? 2.6f : 4.35f), std::log2(kGoalHz / voice.hz0));
    int count = 0;
    auto add = [&](float octaves) {
      if (octaves < 0.08f || octaves > most || count >= kCandidates) return;
      int at = count;
      while (at > 0 && tones[at - 1] > octaves) --at;
      if (at > 0 && octaves - tones[at - 1] < 0.02f) return;
      if (at < count && tones[at] - octaves < 0.02f) return;
      for (int j = count; j > at; --j) tones[j] = tones[j - 1];
      tones[at] = octaves;
      ++count;
    };
    float lowest = voice.octave0;
    for (const Voice& other : voices_) {
      if (other.held()) lowest = kit::min(lowest, other.octave0);
    }
    switch (goal) {
      case kOwn:
        for (int n = 2; n <= 20; ++n) add(std::log2(static_cast<float>(n)));
        break;
      case kOctaves:
        for (int n = 1; n <= 4; ++n) add(static_cast<float>(n));
        break;
      case kBass: {
        const float root = under(lowest) - voice.octave0;
        for (int n = 1; n <= kCandidates; ++n) add(root + std::log2(static_cast<float>(n)));
        break;
      }
      default: {
        int classes = 0;
        float seen[kMaxVoices];
        for (const Voice& other : voices_) {
          if (!other.held() && &other != &voice) continue;
          const float away = other.octave0 - voice.octave0;
          const float within = away - std::floor(away);
          bool known = false;
          for (int c = 0; c < classes; ++c) {
            const float d = std::fabs(seen[c] - within);
            if (d < 0.02f || d > 0.98f) known = true;
          }
          if (!known) seen[classes++] = within;
          for (int octave = -1; octave <= 5; ++octave) add(within + static_cast<float>(octave));
        }
        // One or two notes are no chord yet: their twelfths are in it.
        for (int c = 0; classes < 3 && c < classes; ++c) {
          for (int octave = -1; octave <= 5; ++octave) add(seen[c] + 1.5849625f + static_cast<float>(octave - 1));
        }
        break;
      }
    }
    if (count == 0) tones[count++] = kit::max(most, 0.0f) >= 1.0f ? 1.0f : 0.0f;
    return count;
  }

  // Goals for every overtone of a key. The order of the metal is kept: each
  // takes the nearest tone not under the last one's, and no tone is shared
  // before every one is taken.
  void regoal(Voice& voice) {
    float tones[kCandidates];
    const int total = tones_for(voice, tones);
    const int goal = choice(kGoal);
    const float bend = param(kBend);
    const bool wander = param(kAgain) > 0.0f;
    int first = 1;
    while (first < voice.count && voice.metal[first] < 0.0f) ++first;
    float lowest = voice.octave0;
    for (const Voice& other : voices_) {
      if (other.held()) lowest = kit::min(lowest, other.octave0);
    }
    const float root = under(lowest);
    const bool sends = goal == kBass && root > std::log2(30.0f) && voice.count > 2;
    const int movers = voice.count - first - (sends ? 1 : 0);
    const int each = movers <= total ? 1 : (movers + total - 1) / total;
    int at = 0, taken = 0;
    for (int k = 1; k < voice.count; ++k) {
      float aim;
      if (k < first) {
        aim = -1.0f;
        if (sends) aim = kit::max(root - voice.octave0, -5.0f);
      } else if (sends && first == 1 && k == 1) {
        aim = kit::max(root - voice.octave0, -5.0f);
      } else if (goal == kOwn) {
        aim = tones[k - first < total ? k - first : total - 1];
      } else if (goal == kOctaves) {
        // Like the ranks of an organ, one under the note among them.
        const int rank = (k - first) % (total + 1);
        aim = rank == 1 ? -1.0f : tones[rank == 0 ? 0 : rank - 1];
      } else {
        const int still = voice.count - k;  // to be placed, this one too
        const int last = total - 1 - (still - 1) / each;
        if (taken >= each && at < total - 1) {
          ++at;
          taken = 0;
        }
        while (at < last && at < total - 1 && std::fabs(tones[at + 1] - voice.metal[k]) < std::fabs(tones[at] - voice.metal[k])) {
          ++at;
          taken = 0;
        }
        aim = tones[at];
        ++taken;
      }
      if (wander && voice.strayed[k] && k >= first) aim = nearest(tones, total, voice.aim[k]);
      if (!wander) voice.strayed[k] = false;
      send(voice, k, aim, bend);
    }
    weigh(voice);
  }

  // How far what rests has the levels of its goal and not those of the metal.
  float agreement() const { return std::sqrt(param(kBend)) * (1.0f - 0.95f * leftover_.value); }
  float glowing() const { return 1.05f * glow_.value * std::sqrt(glow_.value); }

  // How loud each overtone will rest, shared where several go to one tone, and
  // the trim that keeps keys of any metal, goal and tilt at one level.
  void weigh(Voice& voice) {
    const int goal = choice(kGoal);
    int held = 0;
    for (const Voice& other : voices_) held += other.held() ? 1 : 0;
    const float sub = (0.25f + 0.75f * kit::min(body(voice.material).root, 1.0f)) * std::pow(static_cast<float>(kit::clamp_int(held, 1, kMaxVoices)), -1.0f);  // every key sends one
    static const float kNote[4] = {0.95f, 0.35f, 1.4f, 0.2f};
    const float agreed = agreement();
    voice.rest[0] = kNote[kit::clamp_int(goal, 0, 3)] * body(voice.material).root;
    static const float kGather[4] = {1.0f, 0.35f, 1.9f, 0.25f};
    voice.gather_to = kGather[kit::clamp_int(goal, 0, 3)];
    float power = voice.rest[0] * voice.rest[0];
    for (int k = 1; k < voice.count; ++k) {
      int sharing = 0;
      for (int j = 1; j < voice.count; ++j) sharing += std::fabs(voice.goal[j] - voice.goal[k]) < kAgreed ? 1 : 0;
      float level = rest_level(goal, voice.goal[k]) / std::sqrt(static_cast<float>(sharing));
      if (goal == kBass && voice.goal[k] < 0.0f) level *= sub;
      level *= std::exp2(voice.colour * coloured(goal, voice.goal[k]));
      level = voice.bare[k] + (level - voice.bare[k]) * agreed;  // what has not agreed is as loud as in the metal
      voice.rest[k] = level;
      const float heard = level * voice.tone[k];
      power += heard * heard;
    }
    static const float kHeld[4] = {1.15f, 0.38f, 1.9f, 1.3f};
    const float hold = kHeld[kit::clamp_int(goal, 0, 3)] * body(voice.material).held * std::pow(power, -0.42f);
    // What it is struck with and what it rests at, together, are brought most
    // of the way to one level.
    const float soon = kit::clamp(5.0f / (param(kTravel) * static_cast<float>(voice.count)), 0.25f, 1.0f);  // how much of it is there in a few seconds
    const float rested = glowing() * hold * std::sqrt(power * soon);
    voice.makeup = kit::clamp(std::pow(0.9f * voice.strike * voice.strike + 1.6f * rested * rested + 1.0e-4f, -0.38f), 0.5f, 6.0f);
    voice.trim_to = hold * voice.makeup;
  }

  // --- a key is struck ------------------------------------------------------

  // The phase every key agrees on for a pitch, 0 to 1.
  float reference(float hz, float octaves) const {
    const double turns = static_cast<double>(hz) * seconds_ + 0.371 * static_cast<double>(octaves) * 12.0;
    return static_cast<float>(turns - std::floor(turns));
  }

  void start(Voice& voice) {
    const int holders = voice.holders;
    int ids[kHolders];
    for (int i = 0; i < holders; ++i) ids[i] = voice.ids[i];
    const float hz0 = voice.next_hz, gain = voice.next_gain;
    const uint32_t stamp = voice.stamp;
    voice = Voice();
    voice.holders = holders;
    for (int i = 0; i < holders; ++i) voice.ids[i] = ids[i];
    voice.stamp = stamp;
    voice.sounding = true;
    voice.hz0 = hz0;
    voice.octave0 = std::log2(hz0);
    voice.pendulum = voice.octave0 - std::floor(voice.octave0);
    voice.gain = gain * std::sqrt(gain);
    voice.follow = kLevel * voice.gain;
    voice.material = choice(kMaterial);
    voice.count = kit::clamp_int(choice(kOvertones), 1, kP - 1) + 1;
    voice.track = 0.13f * kit::clamp(std::log2(196.0f / hz0), -2.2f, 2.5f);
    const Body& metal = body(voice.material);
    // The metal of a key is the same each time it is struck.
    voice.rng.seed(0xACC0D1Eu + static_cast<uint32_t>(hz0 * 16.0f) * 2654435761u);
    for (int i = 0; i < 4; ++i) voice.rng.next_u32();

    // Its overtones, put in order.
    float levels[kP];
    levels[0] = metal.note;
    for (int n = 0; n < voice.count - 1; ++n) {
      Overtone overtone = metal.overtones[n];
      float octaves = voice.material == kScattered ? std::log2(scatter(n, voice.count - 1, voice.rng)) : std::log2(overtone.ratio);
      int at = n + 1;
      while (at > 1 && voice.metal[at - 1] > octaves) {
        voice.metal[at] = voice.metal[at - 1];
        levels[at] = levels[at - 1];
        --at;
      }
      voice.metal[at] = octaves;
      levels[at] = overtone.level;
    }

    const float ring = param(kRing) * metal.ring;
    const float hard = kit::clamp(param(kTouch) * 0.8f + 0.55f * (gain - 0.55f), 0.0f, 1.0f);
    const float slope = metal.slope - 3.0f * (1.0f - hard) * (1.0f - hard) + 1.0f * hard;
    voice.colour = metal.colour + 1.4f * (hard - 0.55f);
    // A slow attack is a soft mallet: it wakes less of what is high.
    const float attack = param(kAttack);
    const float soft = kit::max(1900.0f * std::pow(attack * (1.0f / 0.01f), -0.85f), 1.6f * hz0);
    voice.bloom = kit::min(metal.bloom, 0.5f * kit::max(ring, attack));
    float power = 0.0f;
    for (int k = 0; k < voice.count; ++k) {
      const float octaves = voice.metal[k];
      voice.place[k] = voice.to[k] = octaves;
      voice.hz[k] = voice.still[k] = hz0 * std::exp2(octaves);
      voice.phase[k] = k == 0 ? reference(hz0, voice.octave0) : voice.rng.uniform();
      voice.chance[k] = voice.rng.uniform();
      voice.restless[k] = voice.rng.uniform();
      voice.beat[k] = voice.rng.uniform();
      voice.shape[k] = k > 0 && metal.bloom > 0.0f ? 0.0f : 1.0f;
      voice.state[k] = k == 0 ? kRested : kMetal;
      const float keep = octaves > 0.0f ? std::exp2(-metal.keep * octaves) : 1.0f;
      voice.die[k] = kSixtyDb / kit::max(ring * keep, 0.06f);
      voice.depth[k] = k == 0 ? 0.05f : metal.depth;
      const float way = static_cast<float>(k) / static_cast<float>(kP);
      voice.pan[k] = k == 0 ? 0.0f : ((k & 1) ? 1.0f : -1.0f) * (0.5f + 0.5f * way + 0.2f * (voice.chance[k] - 0.5f)) * kit::clamp((voice.hz[k] - 90.0f) * (1.0f / 250.0f), 0.1f, 1.0f);
      voice.amp[k] = levels[k] * (octaves > 0.0f ? std::exp2(slope * octaves) : 0.45f + 0.55f * hard) / (1.0f + std::pow(voice.hz[k] / soft, 1.5f));
      voice.side[k] = voice.pan[k];
      voice.tone[k] = tone_at(voice, k, tilt_.value);
      const float heard = voice.amp[k] * voice.tone[k];
      power += heard * heard;
    }
    const float level = (0.65f + 1.05f * hard) * metal.struck * std::pow(kit::max(power, 1.0e-6f), -0.44f);
    for (int k = 0; k < voice.count; ++k) voice.bare[k] = voice.amp[k] / std::sqrt(kit::max(power, 1.0e-6f));
    const float sung = (1.0f - 0.6f * glow_.value * glow_.value) * (1.0f - kit::min(2.0f * glow_.value, 1.0f) * attack / (attack + 0.12f));  // at full glow hardly struck at all
    for (int k = 0; k < voice.count; ++k) voice.amp[k] *= level * sung;
    const float sounds = kit::max(ring, 0.6f * attack);
    voice.strike = level * sung * std::sqrt(power * sounds / (sounds + 0.35f));
    float least = 1.0e9f;
    for (const Voice& other : voices_) {
      if (&other != &voice && other.held()) least = kit::min(least, static_cast<float>(other.turns));
    }
    voice.turns = least < 1.0e8f ? kit::clamp_int(static_cast<int>(least) - 2, 0, 1 << 28) : 0;
    regoal(voice);
    // The strike is trimmed by its own level, what rests by its own, so the
    // strike takes the resting trim back.
    for (int k = 0; k < voice.count; ++k) voice.struck[k] = voice.amp[k] *= voice.makeup / voice.trim_to;
    voice.trim = voice.trim_to;

    // The mallet: none where the key swells.
    const float sudden = 1.0f / (1.0f + (attack / 0.03f) * (attack / 0.03f));
    voice.knock = 0.9f * kLevel * metal.knock * (0.06f + hard * hard) * voice.gain * sudden * knock_scale_;
    const float size = kit::clamp(std::sqrt(hz0 * (1.0f / 220.0f)), 0.5f, 2.2f);
    voice.knock_filter.set(kit::clamp(metal.knock_hz * size, 200.0f, kit::min(5000.0f, 0.4f * sample_rate())), 0.9f, sample_rate());
    voice.knock_keep = std::exp(-kSixtyDb * size / (metal.wash * sample_rate()));
    for (int k = 0; k < voice.count; ++k) aim_gains(voice, k, true);
    set_turns(voice);
  }

  // Tilt, a little more of the overtones on low keys, and the top edge.
  float tone_at(const Voice& voice, int k, float tilt) const {
    const float octaves = voice.place[k];
    const float hz = voice.still[k];
    const float top = kit::min(kTopHz, 0.45f * sample_rate());
    const float edge = kit::clamp((top - hz) / (kTopHz - kEdgeHz), 0.0f, 1.0f);
    const float x = hz * (1.0f / 2600.0f);
    return edge * std::exp2(((tilt > 0.0f ? 0.65f : 1.1f) * tilt + voice.track) * kit::max(octaves, -0.4f)) / (1.0f + x * x * x);
  }

  // --- the three places -----------------------------------------------------

  // May this overtone leave now, and how soon should it (low first). Negative:
  // it stays.
  float eagerness(const Voice& voice, int k, float order, bool prefer_old) const {
    const bool far = std::fabs(voice.goal[k] - voice.place[k]) > kAgreed;
    const bool fresh = voice.state[k] == kMetal;
    if (voice.state[k] == kHome ? voice.wait[k] > 0.0f : !fresh && !far && !due(voice, k)) return -1.0f;
    const float rank = static_cast<float>(k) / static_cast<float>(voice.count);
    const float lean = 1.0f - 2.0f * order;
    const float amount = std::fabs(lean);
    const float score = amount * (lean > 0.0f ? rank : 1.0f - rank) + (1.0f - amount) * voice.chance[k];
    return fresh == prefer_old ? score + 1.0f : score;
  }

  // Has it rested enough, and is it one of those that Again sends on?
  bool due(const Voice& voice, int k) const {
    return again_wait_ <= 0.0f && voice.state[k] == kRested && voice.wait[k] <= 0.0f && voice.restless[k] < std::fabs(param(kAgain));
  }

  // Sends an overtone on its way when one of the three places is free and a
  // third of a travel has gone by: the key that had the fewest turns first.
  void dispatch() {
    until_next_ -= dt_;
    again_wait_ = kit::max(again_wait_ - dt_, 0.0f);
    if (until_next_ > 0.0f) return;
    until_next_ = 0.0f;
    if (moving_now() >= kSlots) return;
    const float travel = param(kTravel), order = param(kOrder);
    const bool prefer_old = old_first_ >= 1.0f;
    Voice* chosen = nullptr;
    int which = 0;
    float best = 0.0f;
    for (Voice& voice : voices_) {
      if (!voice.held()) continue;
      if (voice.age < kit::clamp(0.2f * travel + 0.25f * param(kAttack), 0.03f, 0.9f)) continue;
      for (int k = 1; k < voice.count; ++k) {
        if (voice.state[k] == kMoving) continue;
        const float score = eagerness(voice, k, order, prefer_old);
        if (score < 0.0f) continue;
        const float whole = score + 4.0f * static_cast<float>(voice.turns);
        if (!chosen || whole < best) {
          chosen = &voice;
          which = k;
          best = whole;
        }
      }
    }
    if (!chosen) return;
    depart(*chosen, which, travel);
    ++chosen->turns;
    old_first_ = (prefer_old ? old_first_ - 1.0f : old_first_) + 0.8f * std::fabs(param(kAgain));
    until_next_ = travel * (1.0f / kSlots);
  }

  void depart(Voice& voice, int k, float travel) {
    const float bend = param(kBend);
    const float again = param(kAgain);
    const bool leaves = due(voice, k) && std::fabs(voice.goal[k] - voice.place[k]) <= kAgreed;
    if (leaves) again_wait_ = param(kRest) * (0.6f + 0.8f * rng_.uniform()) * (1.5f - std::fabs(again));
    voice.homeward[k] = false;
    float to = voice.goal[k];
    if (leaves && again < 0.0f) {
      voice.homeward[k] = true;
      to = voice.metal[k];
    } else if (leaves && voice.metal[k] > 0.0f) {
      float tones[kCandidates];
      const int total = tones_for(voice, tones);
      int at = 0;
      for (int i = 1; i < total; ++i) {
        if (std::fabs(tones[i] - voice.aim[k]) < std::fabs(tones[at] - voice.aim[k])) at = i;
      }
      // Two to four tones up or down, turned back at the ends.
      const int far = 2 + static_cast<int>(rng_.uniform() * 3.0f);
      int next = rng_.uniform() < 0.5f ? at - far : at + far;
      if (next < 0) next = at + far;
      if (next >= total) next = at - far;
      next = kit::clamp_int(next, 0, total - 1);
      voice.strayed[k] = true;
      send(voice, k, tones[next], bend);
      to = voice.goal[k];
      const float level = rest_level(choice(kGoal), to) * std::exp2(voice.colour * kit::max(to, 0.0f));
      voice.rest[k] = voice.bare[k] + (level - voice.bare[k]) * agreement();
    }
    voice.from[k] = voice.place[k];
    voice.to[k] = to;
    voice.clock[k] = 0.0f;
    voice.span[k] = kit::max(travel * (0.72f + 0.56f * voice.chance[k]), 0.03f);
    voice.state[k] = kMoving;
    voice.before[k] = voice.shape[k];
    voice.lift[k] = voice.amp[k];
  }

  void travel_on(Voice& voice, int k) {
    voice.clock[k] += dt_ / voice.span[k];
    const Path path = path_at(kit::min(voice.clock[k], 1.0f), voice.span[k], voice.from[k], voice.to[k], manner_.value, swing_.value, voice.before[k]);
    float place = path.place;
    if (voice.clock[k] >= 1.0f) {
      place = voice.to[k];
      arrive(voice, k);
    }
    voice.place[k] = place;
    voice.shape[k] = path.shape;
    voice.hz[k] = voice.still[k] = voice.hz0 * std::exp2(place);
    if (voice.clock[k] > 0.5f && !voice.homeward[k]) {
      // On the last half of its way it falls into step with whoever is there.
      const float hz = voice.hz0 * std::exp2(voice.to[k]);
      const float most = kit::min(kStepHz, kStepShare * hz);
      voice.hz[k] += kit::clamp(behind(voice, k, hz, voice.to[k]) * 5.0f / voice.span[k], -most, most);
    }
    voice.tone[k] = tone_at(voice, k, tilt_.value);
  }

  void arrive(Voice& voice, int k) {
    const float rest = 0.3f * param(kRest) * (0.6f + 0.8f * voice.rng.uniform());
    if (voice.homeward[k]) {
      voice.state[k] = kHome;
      voice.wait[k] = rest;
      return;
    }
    voice.state[k] = kRested;
    voice.stroke[k] = param(kManner) > 0.0f ? 0.97f : kPeak;
    voice.wait[k] = rest;
    const float amount = std::pow(param(kGlint), 0.75f) * kit::min(voice.amp[k] * voice.trim * 7.0f, 1.0f);
    if (amount <= 0.0f || voice.holders == 0) return;
    // A small chime an octave or two over where it came to rest.
    float hz = voice.hz0 * std::exp2(voice.to[k]);
    while (hz < 700.0f) hz *= 2.0f;
    if (hz < 2000.0f && body(voice.material).colour > -1.0f) hz *= 2.0f;  // dull metal chimes lower
    if (hz > 5500.0f) return;
    chimes_.strike(hz, kLevel * 1.6f * amount * voice.gain * std::sqrt(900.0f / hz),
                   -0.9f * param(kSpread) * voice.pan[k], 0.02f * kLevel, 0.7f + 2.3f * param(kGlint));
  }

  // --- every kTick samples --------------------------------------------------

  void control() {
    seconds_ += dt_;
    const bool tilted = !tilt_.settled(), weighed = tilted || !glow_.settled() || !leftover_.settled();
    for (kit::Smoother* knob : {&glow_, &tilt_, &air_, &spread_, &forward_, &leftover_, &manner_, &swing_}) knob->next();
    for (Voice& voice : voices_) {
      if (!voice.pending) continue;
      if (voice.sounding && voice.fade > 0.0f) {
        voice.fade = kit::max(voice.fade - dt_ / kStealSeconds, 0.0f);
        continue;
      }
      start(voice);
      dirty_ = true;
    }
    uint32_t held = 0;
    for (int v = 0; v < kMaxVoices; ++v) held |= voices_[v].held() ? 1u << v : 0u;
    if (held != held_ || dirty_) {
      held_ = held;
      dirty_ = false;
      for (Voice& voice : voices_) {
        if (voice.held()) regoal(voice);
      }
    }
    dispatch();
    release_keep_ = std::exp(-kSixtyDb * dt_ / param(kRelease));
    damp_keep_ = std::exp(-kSixtyDb * dt_ / kit::min(param(kRelease), kit::max(1.7f * param(kAttack), kDampSeconds)));
    settle_ = 1.0f - std::exp(-dt_ / kit::clamp(0.1f * param(kRing), 0.2f, 2.5f));
    breathe_ = 1.0f - std::exp(-dt_ / 0.3f);
    const float pole = std::exp(-kit::kTwoPi * (24.0f + 76.0f * air_.value * air_.value) * dt_);
    const float b = 1.0f - pole, aa = 1.0f - pole * pole;
    noise_pole_ = pole;
    // What makes uniform noise through two poles of unit level.
    noise_gain_ = std::sqrt(3.0f * aa * aa * aa / (b * b * b * b * (2.0f - aa)));
    const float angle = 0.93f * kit::kHalfPi * air_.value;
    still_ = std::cos(angle);
    windy_ = std::sin(angle);
    const float angle_moving = 0.93f * kit::kHalfPi * kit::min(1.7f * air_.value, 1.0f);
    still_moving_ = std::cos(angle_moving);
    windy_moving_ = std::sin(angle_moving);
    breath_on_ = air_.value > 0.0f || windy_ > 0.0f;
    // Keys make room for themselves: what is over kRoom together comes out as
    // a fifth of its decibels, soon down and slowly up again.
    float whole = 0.0f;
    for (const Voice& voice : voices_) whole += voice.sounding ? voice.heard * voice.heard : 0.0f;
    const float room = whole > kRoom * kRoom ? std::pow(whole / (kRoom * kRoom), -0.4f) : 1.0f;
    crowd_ += (room - crowd_) * (1.0f - std::exp(-dt_ / (room < crowd_ ? 0.005f : 0.2f)));
    const float busy = kit::min(static_cast<float>(moving_now()), 1.0f);
    busy_ += (busy - busy_) * breathe_;
    for (Voice& voice : voices_) {
      if (voice.sounding) step(voice, tilted, weighed);
    }
    chimes_.tick();
  }

  void step(Voice& voice, bool tilted, bool weighed) {
    voice.age += dt_;
    const float attack = param(kAttack);
    const bool rising = voice.rise < 1.0f;
    const bool let_go = voice.holders == 0 && (!rising || attack > 0.06f || voice.damped);
    if (let_go) {
      voice.env *= voice.damped ? damp_keep_ : release_keep_;
      voice.rise = 1.0f;
    } else if (rising) {
      voice.rise = kit::min(voice.rise + dt_ / attack, 1.0f);
      voice.env = ease(voice.rise);
    }
    if (breath_on_) make_breath(voice);
    const float glow = glowing();
    const float forward = 9.0f * std::pow(forward_.value, 1.7f);
    const float under = 1.0f - 0.8f * forward_.value * busy_;  // the cloud steps back while one travels
    const float leftover = leftover_.value, manner = manner_.value, swing = swing_.value;
    const float travel = param(kTravel);
    const float stroke_hz = manner > 0.0f ? 1.0f / kit::clamp(2.2f * travel, 0.22f, 9.0f) : 1.0f / kit::clamp(6.5f * travel, 1.6f, 24.0f);
    const float residue = 0.026f * leftover * std::sqrt(leftover);  // 45 cents at the most
    const float clash = 1.0f - param(kBend);  // what is not bent home goes on beating as metal
    const Body& metal = body(voice.material);
    const float fading = kit::min(4.0f * glow, 1.0f);
    const float dying = rising ? voice.rise * voice.rise : 1.0f;  // not while the key still swells
    // What Swing leaves is a pendulum of the key's own that its resting overtones hang on.
    voice.pendulum += dt_ * (0.5f + 0.5f * voice.chance[0]);
    if (voice.pendulum >= 1.0f) voice.pendulum -= 1.0f;
    voice.swung_left = kit::SineTable::lookup(voice.pendulum);
    voice.swung_right = kit::SineTable::lookup(voice.pendulum + 0.5f * kit::min(1.2f * spread_.value, 1.0f));
    float power = 0.0f, shown = 0.0f;
    if (weighed) weigh(voice);
    for (int k = 0; k < voice.count; ++k) {
      if (voice.state[k] == kMoving) {
        travel_on(voice, k);
      } else if (tilted) {
        voice.tone[k] = tone_at(voice, k, tilt_.value);
      }
      const int state = voice.state[k];
      float amp = voice.amp[k];
      const float ring_away = kit::min(voice.die[k] * dt_, 0.5f) * dying;
      float beat_to, depth_to, sway_to = 0.0f;
      const float jitter = voice.chance[k];
      if (state == kRested) {
        if (k > 0) voice.wait[k] -= dt_;
        const float target = glow * voice.rest[k] * under;
        if (amp > target) {
          amp += (target - amp) * (k == 0 ? ring_away : ring_away + (settle_ - ring_away) * fading);
        } else {
          amp += (target - amp) * settle_;
        }
        beat_to = kit::min(0.05f + 0.16f * jitter + voice.hz[k] * residue * (0.55f + 0.9f * jitter), 13.0f);
        depth_to = k == 0 ? 0.03f + 0.45f * leftover : 0.05f + 0.85f * leftover;
        sway_to = k > 0 ? swing : 0.75f * swing;
        if (k > 0) {
          beat_to += clash * (metal.beat * (0.45f + 1.1f * jitter) - beat_to) * (1.0f - leftover);
          depth_to = kit::max(depth_to, clash * metal.depth);
          voice.stroke[k] += dt_ * stroke_hz * (0.7f + 0.6f * jitter);
          if (voice.stroke[k] >= 1.0f) voice.stroke[k] -= 1.0f;
          voice.shape[k] = resting_shape(manner, voice.stroke[k]);
        }
        draw(voice, k);
      } else if (state == kMoving) {
        const float high = voice.hz[k] * (1.0f / 1500.0f);
        const float lift = 1.0f + forward / (1.0f + high * high);
        const float away = voice.homeward[k] ? 0.6f : 1.0f;
        const float target = kit::max(away * glow * voice.rest[k] * lift, kit::min(voice.lift[k] * kit::min(lift, 2.2f), voice.struck[k]));
        const float quick = kit::clamp(0.16f * voice.span[k], 0.02f, 0.6f);
        if (amp < target) {
          amp += (target - amp) * kit::min(dt_ / quick, 0.5f);
        } else {
          amp -= amp * ring_away;
        }
        beat_to = 0.2f + 0.3f * jitter;
        depth_to = 0.06f;
      } else {
        if (state == kHome) {
          voice.wait[k] -= dt_;
          voice.shape[k] += (1.0f - voice.shape[k]) * breathe_;
        }
        amp -= amp * ring_away * kit::max(1.0f - 0.85f * glow * glow, 0.1f);
        if (state == kMetal && voice.shape[k] < 1.0f) {
          voice.shape[k] = ease(kit::clamp((voice.age - 0.8f * voice.bloom * jitter) / (0.2f * voice.bloom), 0.0f, 1.0f));
        }
        beat_to = metal.beat * (0.45f + 1.1f * jitter);
        depth_to = k == 0 ? 0.05f : metal.depth;
      }
      const float side_to = state == kMetal || state == kHome ? voice.pan[k] : (voice.goal[k] < 0.0f ? 0.0f : voice.pan[k] * (clash + (1.0f - clash) * voice.gather_to));
      voice.side[k] = settle_to_zero(voice.side[k] + (side_to - voice.side[k]) * breathe_);
      voice.amp[k] = settle_to_zero(amp);
      voice.sway[k] = settle_to_zero(voice.sway[k] + (sway_to - voice.sway[k]) * breathe_);
      voice.beat_hz[k] += (beat_to - voice.beat_hz[k]) * breathe_;
      voice.depth[k] += (depth_to - voice.depth[k]) * breathe_;
      voice.beat[k] += voice.beat_hz[k] * dt_;
      if (voice.beat[k] >= 1.0f) voice.beat[k] -= 1.0f;
      aim_gains(voice, k, false);
      const float heard = amp * voice.tone[k];
      power += heard * heard;
      shown += heard * heard * voice.shape[k] * voice.shape[k];
    }
    voice.trim += (voice.trim_to - voice.trim) * breathe_;
    set_turns(voice);
    const float sum = std::sqrt(power) * voice.trim;
    voice.heard = kLevel * voice.gain * voice.env * voice.fade * voice.trim * std::sqrt(shown);
    voice.follow = kLevel * voice.gain * kit::max(voice.env, rising ? 0.5f : 0.0f) * sum;
    if (voice.knock > 0.0f && voice.knock < 1.0e-7f) {
      voice.knock = 0.0f;
      voice.knock_filter.reset();
    }
    const bool gone = let_go ? voice.env < kSilence : (!rising && glow <= 0.0f && sum < kSilence);
    if (gone && !voice.pending && voice.knock < 1.0e-5f) voice = Voice();
  }

  // How far a partial is behind the phase of all keys at a pitch, in turns.
  float behind(const Voice& voice, int k, float hz, float place) const {
    const float error = reference(hz, voice.octave0 + place) - voice.phase[k];
    return error - std::floor(error + 0.5f);
  }

  // A resting overtone is drawn slowly to the phase that all keys share.
  void draw(Voice& voice, int k) {
    const float hz = voice.still[k];
    // More in the first second of its rest than later.
    voice.clock[k] = kit::min(voice.clock[k] + dt_, 100.0f);
    const float since = 3.0f * kit::max(voice.clock[k] - 1.0f, 0.0f);
    const float most = kit::min(kPullHz, kPullShare * hz) * (1.0f + (k > 0 ? 9.0f : 0.0f) / (1.0f + since * since));
    voice.hz[k] = hz + kit::clamp(2.0f * behind(voice, k, hz, voice.place[k]), -most, most);
  }

  // Where the gains of a partial are by the end of this tick.
  void aim_gains(Voice& voice, int k, bool snap) {
    const bool moving = voice.state[k] == kMoving;
    const float spread = 1.4f * std::pow(spread_.value, 1.25f) * body(voice.material).width;
    const float level = kLevel * crowd_ * voice.gain * voice.env * voice.fade * voice.trim * voice.amp[k] * voice.tone[k] * voice.shape[k];
    const float depth = voice.depth[k];
    const float swing_left = kit::SineTable::lookup(voice.beat[k]);
    const float apart = kit::min(1.2f * spread_.value, 1.0f);  // the two sides: beats and breath of their own
    const float swing_right = kit::SineTable::lookup(voice.beat[k] + 0.5f * apart);
    const float place = kit::clamp(spread * voice.side[k], -1.0f, 1.0f);
    const float still = moving ? still_moving_ : still_, windy = moving ? windy_moving_ : windy_;
    const float wind_left = still + windy * voice.breath[k];
    const float wind_right = still + windy * ((1.0f - 0.4f * apart) * voice.breath[k] + 0.8f * apart * voice.breath[k + 1 < voice.count ? k + 1 : 0]);
    const float sway = 0.92f * voice.sway[k];
    const float even = 1.0f / ((1.0f + 0.35f * depth) * (1.0f + 0.2f * sway));
    const float left = level * wind_left * even * (1.0f - 0.95f * kit::max(place, 0.0f)) * (1.0f + depth * swing_left) * (1.0f + sway * voice.swung_left);
    const float right = level * wind_right * even * (1.0f + 0.95f * kit::min(place, 0.0f)) * (1.0f + depth * swing_right) * (1.0f + sway * voice.swung_right);
    if (snap) {
      voice.left[k] = left;
      voice.right[k] = right;
      voice.left_step[k] = voice.right_step[k] = 0.0f;
      return;
    }
    voice.left_step[k] = (left - voice.left[k]) * (1.0f / kTick);
    voice.right_step[k] = (right - voice.right[k]) * (1.0f / kTick);
  }

  // The partials' places in their cycles for this tick and their turn a
  // sample, and the places moved on to the next.
  void set_turns(Voice& voice) {
    const float per_sample = 1.0f / sample_rate();
    float rate[kP];
    for (int k = 0; k < kP; ++k) rate[k] = kit::min(voice.hz[k] * per_sample, 0.5f);
    for (int k = 0; k < kP; ++k) turn(voice.phase[k], &voice.re[k], &voice.im[k]);
    for (int k = 0; k < kP; ++k) turn(rate[k], &voice.turn_re[k], &voice.turn_im[k]);
    for (int k = 0; k < kP; ++k) {
      const float next = voice.phase[k] + rate[k] * static_cast<float>(kTick);
      voice.phase[k] = next - static_cast<float>(static_cast<int>(next));
    }
  }

  // Slow noise of unit level for every partial: a tone times this is breath
  // at the pitch of the tone. (The gains go straight from tick to tick, which
  // leaves nothing to hear beside it.)
  void make_breath(Voice& voice) {
    const float a = noise_pole_, b = 1.0f - a, unit = b * noise_gain_;
    for (int k = 0; k < voice.count; ++k) {
      voice.gust[k] = voice.gust[k] * a + voice.rng.bipolar() * unit;
      voice.breath[k] = voice.breath[k] * a + voice.gust[k] * b;
    }
  }

  // --- sound ----------------------------------------------------------------

  void render(int n, float* out_left, float* out_right) {
    float left[kTick] = {}, right[kTick] = {};
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      Four sum_left[kTick] = {}, sum_right[kTick] = {};
      for (int g = 0; g < voice.count; g += kLanes) {
        Four re = load(voice.re + g), im = load(voice.im + g);
        const Four turn_re = load(voice.turn_re + g), turn_im = load(voice.turn_im + g);
        Four gain_left = load(voice.left + g), gain_right = load(voice.right + g);
        const Four step_left = load(voice.left_step + g), step_right = load(voice.right_step + g);
        for (int i = 0; i < n; ++i) {
          gain_left += step_left;
          gain_right += step_right;
          sum_left[i] += gain_left * im;
          sum_right[i] += gain_right * im;
          const Four turned = turn_re * re - turn_im * im;
          im = turn_re * im + turn_im * re;
          re = turned;
        }
        store(re, voice.re + g);
        store(im, voice.im + g);
        store(gain_left, voice.left + g);
        store(gain_right, voice.right + g);
      }
      for (int i = 0; i < n; ++i) {
        left[i] += sum_left[i][0] + sum_left[i][1] + sum_left[i][2] + sum_left[i][3];
        right[i] += sum_right[i][0] + sum_right[i][1] + sum_right[i][2] + sum_right[i][3];
      }
      if (voice.knock > 0.0f) {
        for (int i = 0; i < n; ++i) {
          const float x = voice.knock_filter.bandpass(voice.rng.bipolar() * voice.knock) * crowd_ * voice.env * voice.fade;
          voice.knock *= voice.knock_keep;
          left[i] += x;
          right[i] += x;
        }
      }
    }
    chimes_.add(n, left, right);
    for (int i = 0; i < n; ++i) {
      const float volume = volume_.next();
      out_left[i] = kit::soft_clip(left[i] * volume);
      out_right[i] = kit::soft_clip(right[i] * volume);
    }
  }

  Voice voices_[kMaxVoices];
  Chimes chimes_;
  kit::Smoother glow_, tilt_, air_, spread_, forward_, leftover_, manner_, swing_;  // once a tick
  kit::Smoother volume_;                                           // every sample
  kit::IdleGate idle_;
  kit::Rng rng_;
  float noise_pole_ = 0.0f, noise_gain_ = 1.0f, knock_scale_ = 1.0f;
  float still_ = 1.0f, windy_ = 0.0f, still_moving_ = 1.0f, windy_moving_ = 0.0f;
  bool breath_on_ = false;
  bool dirty_ = true;
  double seconds_ = 0.0;
  float dt_ = 0.0f;
  float until_next_ = 0.0f, again_wait_ = 0.0f, busy_ = 0.0f, old_first_ = 0.0f, crowd_ = 1.0f;
  float release_keep_ = 1.0f, damp_keep_ = 1.0f, settle_ = 0.0f, breathe_ = 0.0f;
  uint32_t stamp_ = 0, held_ = 0;
  int tick_left_ = 0;
};

}  // namespace slow_accord

using slow_accord::SlowAccord;

}  // namespace livemix
