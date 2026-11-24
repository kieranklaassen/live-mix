#pragma once

// Tierce Bells: cast bells whose third is a control.
//
//   key down ─► whose third? ─► strike ─► partials (12 to 17 modes) ─► pan ─► sum
//               (Follow, Root,   │         hum · prime · TIERCE · quint
//                Scale, Tierce)  │         nominal · deciem (2 × tierce) · uppers
//                                └ Lean ─► the third glides to its place (Glide)
//
//   all bells ─► volume ─► soft clip ─► out
//
// - A mode is one complex number turned and shrunk a little every sample
//   (z' = r·e^jw·z, the form modal-bells uses): its length is the amplitude
//   and its angle the phase, so it can change pitch and decay under a ringing
//   bell with no click. A correction once a tick takes back what rounding
//   r·e^jw to single precision does to the decay (it is 3 % at 60 s).
// - The tierce is in cents above the prime and belongs to each bell. The
//   deciem is twice the tierce's ratio, always, so the third heard an octave
//   up never contradicts the one below.
// - Which third a bell takes (place_for): with Follow on, the degree of Scale
//   on Root four semitones above the struck key gives 5/4, three above gives
//   6/5; where the scale has both, the one nearer Tierce; where it has
//   neither, or the key is not in the scale, Tierce. A key is the nearest
//   equal-tempered one, so a retuned note keeps its degree, and the third is
//   measured from the note as it was played.
// - Lean starts a strike's third that far from its place, and it arrives
//   after Glide seconds on a cubic with no speed at either end: it dwells on
//   the suspension, moves, and settles. Moving Tierce, Follow, Root or Scale
//   sends ringing bells to their new places the same way, from where they
//   are and with the speed they have.
// - A strike does not push the modes with a pulse of sound. Each mode is
//   ramped up along its own turning phase, by an amount the clapper sets
//   (strike_share), over a raised cosine; so levels are exact, the same at
//   every sample rate, with no nulls.
// - One pitch is one bell. The same pitch struck again (by the same note id
//   or another) strikes the bell that rings: the new strike goes in a
//   quarter turn from what the mode does, so the two add as power and never
//   cancel or double, and what rang is damped over 3 ms just as far as keeps
//   each mode under kStack of a full strike. The bell is let go when the last
//   id holding it is.
// - Doublets: the halves of a pair stand Doublet hertz apart, with the
//   pair's mean (by level) on the partial, and start at different points of
//   the beat, so the partials of one bell do not swell together.
// - Decay is the hum's ring time to -60 dB; a partial's is that times its
//   share in the table to a power set by Damping.
// - Rubbed: partials are struck lightly and grow toward a level for as long
//   as the key is down.
//
// Asleep when every bell has rung out below -120 dB. Output does not depend
// on the block size: all control runs on a 32-sample clock that restarts,
// with every smoothed knob in its place, when a strike finds no bell ringing.

#include <initializer_list>

#include "../../kit/kit.h"
#include "../../kit/keymap.h"
#include "params.gen.h"

namespace livemix {

class TierceBells : public kit::DeviceBase<tierce_bells::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kSlots = 17;
  static constexpr int kHolders = 16;  // note ids one bell remembers
  enum Bell : int { kTower = 0, kHandbell, kSmallClock, kRubbed, kNumBells };
  enum Meter : int { kMeterTierce = 0, kMeterPlace, kMeterLevel, kMeterPrime };
  static constexpr float kMinorThird = 315.6413f;  // 6/5, cents
  static constexpr float kMajorThird = 386.3137f;  // 5/4

  void init(float sample_rate) {
    using namespace tierce_bells;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) voice = Voice();
    tuning_serial_ = gain_serial_ = place_serial_ = 1;
    stamp_ = 0;
    chunk_left_ = 0;
    tick_seconds_ = static_cast<float>(kChunk) / sr;
    pump_step_ = 1.0f / (kRubSeconds * sr);
    steal_step_ = 1.0f / (kStealSeconds * sr);
    duck_ticks_ = kit::clamp_int(static_cast<int>(kDuckSeconds / tick_seconds_ + 0.5f), 1, 1000);
    for (kit::Smoother* knob : {&hum_pitch_, &hum_gain_, &quint_gain_, &upper_gain_, &spread_}) {
      knob->set_time(kKnobSeconds, sr / static_cast<float>(kChunk));
    }
    volume_.set_time(0.02f, sr);
    set_knobs(false);
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace tierce_bells;
    if (!store_param(id, value)) return;
    switch (id) {
      case kTierce:
      case kFollow:
      case kRoot:
      case kScale:
        ++place_serial_;
        break;
      case kDecay:
      case kDamping:
      case kDoublet:
      case kRelease:
        ++tuning_serial_;
        break;
      case kHumPitch:
      case kHumLevel:
      case kQuint:
      case kUpper:
      case kSpread:
      case kVolume:
        set_knobs(primed());
        break;
      default:
        break;  // bell, hardness, lean: the next strike; glide: the next move
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int bell = chosen_bell();
    if (count_sounding() == 0) restart();

    // The bell this pitch already has, and a strike of this id that still
    // waits in a taken voice. Every other bell the id held is let go.
    Voice* same = nullptr;
    Voice* waiting = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (!same && (voice.pending ? voice.pending_frequency == frequency && voice.pending_bell == bell
                                  : voice.frequency == frequency && voice.bell == bell)) {
        same = &voice;
        continue;
      }
      if (!voice.drop(note_id)) continue;
      if (voice.pending && voice.holders == 0) {
        waiting = &voice;
      }
    }
    if (same) {
      same->hold(note_id);
      same->stamp = ++stamp_;
      if (same->pending) {
        same->pending_gain = together(same->pending_gain, gain);
        same->follow = expected_level(bell, same->pending_gain);
      } else {
        strike_again(*same, gain);
      }
      return;
    }
    Voice& voice = waiting ? *waiting : voices_[pick()];
    const bool taken = voice.sounding;
    voice.holders = 0;
    voice.hold(note_id);
    voice.stamp = ++stamp_;
    if (taken) {
      // Fade what it rang over 2 ms, then strike (see control()).
      voice.pending = true;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.pending_bell = bell;
      voice.follow = expected_level(bell, gain);
    } else {
      start(voice, bell, frequency, gain);
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
        control();
        chunk_left_ = kChunk;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      float left[kChunk] = {}, right[kChunk] = {};
      for (Voice& voice : voices_) {
        if (voice.sounding) render_voice(voice, n, left, right);
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

  // The newest bell that rings: where its third is, where it is going, how
  // loud it is, its note. With none: the knob, the knob, 0, 0.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (voice.sounding && !voice.pending && (!newest || voice.stamp > newest->stamp)) newest = &voice;
    }
    switch (index) {
      case kMeterTierce:
        return newest ? newest->third.value : param(tierce_bells::kTierce);
      case kMeterPlace:
        return newest ? newest->third.to : param(tierce_bells::kTierce);
      case kMeterLevel:
        return newest ? newest->follow : 0.0f;
      case kMeterPrime:
        return newest ? newest->frequency : 0.0f;
      default:
        return 0.0f;
    }
  }

 private:
  static constexpr int kChunk = 32;  // control period, samples
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  // A partial fades out between these, so the top of the keyboard is the
  // same at every sample rate and a gliding third can pass the edge.
  static constexpr float kEdgeHz = 15000.0f;
  static constexpr float kTopHz = 18000.0f;
  static constexpr float kLevel = 0.122f;        // a full strike of a partial of level 1
  static constexpr float kStack = 1.0f;          // the most a partial may reach by being struck again, of a full strike
  static constexpr float kSoftContact = 1.5f;    // clapper contact, periods of the note
  static constexpr float kHardContact = 0.08f;
  static constexpr float kMakeup = 0.7f;         // how much of what a soft clapper costs the note is given back
  static constexpr float kHardTilt = 0.7f;       // how far Hardness tilts the upper partials, a power of the ratio
  static constexpr float kSoftAttack = 0.008f;   // seconds the strike takes
  static constexpr float kHardAttack = 0.0005f;
  static constexpr float kChokeSeconds = 0.08f;  // release 1
  static constexpr float kRubSeconds = 0.35f;    // how fast rubbing closes on its level
  static constexpr float kRubLevel = 0.105f;
  static constexpr float kRubbedHit = 0.22f;     // what is left of the strike of a rubbed bell
  static constexpr float kFarSide = 0.8f;        // how far past its side a pair's second half goes
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kDuckSeconds = 0.003f;
  static constexpr float kKnobSeconds = 0.015f;
  static constexpr float kShortestGlide = 0.02f;
  static constexpr float kSilence = 1.0e-6f;

  enum Role : int { kHum, kPrime, kThird, kFifth, kOver, kDeciem };

  // `ratio` is the partial's place for the clapper (a third's own pitch comes
  // from the bell), `keep` its ring time as a share of the hum's, `mate` its
  // offset in units of Doublet, `phase` how far into its cycle a pair's second half starts (turns),
  // `rub` the level rubbing brings it to.
  struct Mode {
    int role;
    float ratio, level, keep, mate, phase, rub;
  };
  struct Table {
    int count;
    float gain;     // evens out the loudness of the four
    float striker;  // how long this bell's clapper rests on it
    Mode modes[kSlots];
  };

  static const Table& table(int bell) {
    static const Table kTables[kNumBells] = {
        // Tower: deep hum, a third that outlasts everything but the hum.
        {17, 1.0f, 1.0f,
         {{kHum, 0.5f, 0.26f, 1.0f, 0.4f, 0.00f, 0.0f},      {kHum, 0.5f, 0.17f, 1.0f, -0.6f, 0.00f, 0.0f},
          {kPrime, 1.0f, 0.36f, 0.62f, 0.4f, 0.00f, 0.0f},  {kPrime, 1.0f, 0.24f, 0.62f, -0.6f, 0.15f, 0.0f},
          {kThird, 1.2f, 0.50f, 0.80f, 0.4f, 0.00f, 0.0f},  {kThird, 1.2f, 0.33f, 0.80f, -0.6f, -0.10f, 0.0f},
          {kFifth, 1.5f, 0.26f, 0.42f, 0.0f, 0.00f, 0.0f},
          {kOver, 2.0f, 0.54f, 0.40f, 0.4f, 0.00f, 0.0f},   {kOver, 2.0f, 0.36f, 0.40f, -0.6f, 0.20f, 0.0f},
          {kDeciem, 2.4f, 0.27f, 0.32f, 0.4f, 0.00f, 0.0f}, {kDeciem, 2.4f, 0.18f, 0.32f, -0.6f, 0.82f, 0.0f},
          {kOver, 3.0f, 0.30f, 0.22f, 0.4f, 0.00f, 0.0f},   {kOver, 3.0f, 0.20f, 0.22f, -0.6f, 0.08f, 0.0f},
          {kOver, 4.0f, 0.30f, 0.15f, 0.0f, 0.00f, 0.0f},   {kOver, 5.1f, 0.20f, 0.10f, 0.0f, 0.00f, 0.0f},
          {kOver, 6.3f, 0.14f, 0.07f, 0.0f, 0.00f, 0.0f},   {kOver, 7.6f, 0.09f, 0.05f, 0.0f, 0.00f, 0.0f}}},
        // Handbell: the note and its twelfth, little hum.
        {14, 0.96f, 0.8f,
         {{kHum, 0.5f, 0.07f, 1.0f, 0.4f, 0.00f, 0.0f},      {kHum, 0.5f, 0.05f, 1.0f, -0.6f, 0.00f, 0.0f},
          {kPrime, 1.0f, 0.60f, 0.90f, 0.4f, 0.00f, 0.0f},  {kPrime, 1.0f, 0.40f, 0.90f, -0.6f, 0.15f, 0.0f},
          {kThird, 1.2f, 0.33f, 0.60f, 0.4f, 0.00f, 0.0f},  {kThird, 1.2f, 0.22f, 0.60f, -0.6f, -0.10f, 0.0f},
          {kFifth, 1.5f, 0.14f, 0.30f, 0.0f, 0.00f, 0.0f},
          {kOver, 2.0f, 0.16f, 0.35f, 0.0f, 0.00f, 0.0f},
          {kDeciem, 2.4f, 0.15f, 0.30f, 0.4f, 0.00f, 0.0f}, {kDeciem, 2.4f, 0.10f, 0.30f, -0.6f, 0.82f, 0.0f},
          {kOver, 3.0f, 0.60f, 0.50f, 0.4f, 0.00f, 0.0f},   {kOver, 3.0f, 0.40f, 0.50f, -0.6f, 0.08f, 0.0f},
          {kOver, 5.2f, 0.16f, 0.16f, 0.0f, 0.00f, 0.0f},   {kOver, 7.4f, 0.10f, 0.08f, 0.0f, 0.00f, 0.0f}}},
        // Small clock: a hammer on a little bell, bright and soon over.
        {13, 0.95f, 0.6f,
         {{kHum, 0.5f, 0.08f, 1.0f, 0.4f, 0.00f, 0.0f},      {kHum, 0.5f, 0.05f, 1.0f, -0.6f, 0.00f, 0.0f},
          {kPrime, 1.0f, 0.34f, 0.28f, 0.4f, 0.00f, 0.0f},  {kPrime, 1.0f, 0.23f, 0.28f, -0.6f, 0.15f, 0.0f},
          {kThird, 1.2f, 0.36f, 0.26f, 0.4f, 0.00f, 0.0f},  {kThird, 1.2f, 0.24f, 0.26f, -0.6f, -0.10f, 0.0f},
          {kFifth, 1.5f, 0.17f, 0.20f, 0.0f, 0.00f, 0.0f},
          {kOver, 2.0f, 0.84f, 0.20f, 0.0f, 0.00f, 0.0f},
          {kDeciem, 2.4f, 0.36f, 0.17f, 0.4f, 0.00f, 0.0f}, {kDeciem, 2.4f, 0.24f, 0.17f, -0.6f, 0.82f, 0.0f},
          {kOver, 4.1f, 0.44f, 0.11f, 0.0f, 0.00f, 0.0f},   {kOver, 5.6f, 0.28f, 0.08f, 0.0f, 0.00f, 0.0f},
          {kOver, 7.1f, 0.17f, 0.06f, 0.0f, 0.00f, 0.0f}}},
        // Rubbed: a stick drawn round the rim, all low partials.
        {12, 0.86f, 1.3f,
         {{kHum, 0.5f, 0.30f, 1.0f, 0.4f, 0.00f, 0.42f},     {kHum, 0.5f, 0.20f, 1.0f, -0.6f, 0.00f, 0.28f},
          {kPrime, 1.0f, 0.36f, 0.80f, 0.4f, 0.00f, 0.46f}, {kPrime, 1.0f, 0.24f, 0.80f, -0.6f, 0.15f, 0.31f},
          {kThird, 1.2f, 0.40f, 0.80f, 0.4f, 0.00f, 0.50f}, {kThird, 1.2f, 0.27f, 0.80f, -0.6f, -0.10f, 0.33f},
          {kFifth, 1.5f, 0.18f, 0.50f, 0.0f, 0.00f, 0.18f},
          {kOver, 2.0f, 0.30f, 0.50f, 0.4f, 0.00f, 0.20f},  {kOver, 2.0f, 0.20f, 0.50f, -0.6f, 0.20f, 0.13f},
          {kDeciem, 2.4f, 0.15f, 0.40f, 0.4f, 0.00f, 0.12f}, {kDeciem, 2.4f, 0.10f, 0.40f, -0.6f, 0.82f, 0.08f},
          {kOver, 3.0f, 0.14f, 0.30f, 0.0f, 0.00f, 0.07f}}},
    };
    return kTables[kit::clamp_int(bell, 0, kNumBells - 1)];
  }

  // Where a third is and how it gets to its place: a cubic from where it was
  // (at the speed it had) to its place at rest, over `seconds`.
  struct Glider {
    float from = 0.0f, speed = 0.0f;  // cents, cents a second
    float to = 0.0f, value = 0.0f;
    float seconds = 1.0f, at = 0.0f;
    bool moving = false;

    void rest(float place) {
      from = to = value = place;
      speed = 0.0f;
      moving = false;
    }
    void go(float start, float start_speed, float place, float duration) {
      from = value = start;
      speed = start_speed;
      to = place;
      seconds = duration;
      at = 0.0f;
      moving = start != place || start_speed != 0.0f;
    }
    float speed_now() const {
      if (!moving) return 0.0f;
      const float t = at / seconds;
      return (to - from) * 6.0f * t * (1.0f - t) / seconds + speed * (1.0f + t * (3.0f * t - 4.0f));
    }
    void step(float dt) {
      at += dt;
      if (at >= seconds) {
        rest(to);
        return;
      }
      const float t = at / seconds;
      value = from + (to - from) * t * t * (3.0f - 2.0f * t) + speed * seconds * t * (1.0f - t) * (1.0f - t);
    }
  };

  struct Voice {
    // Per mode: the unit turn a sample, the decay a sample (and in nepers),
    // the turn with this tick's decay, what puts rounding right once a tick,
    // the state, the output gains and their ramps, the strike that is going
    // in, the damping a second strike does, and what a rub is after.
    float turn_re[kSlots] = {}, turn_im[kSlots] = {};
    float radius[kSlots] = {}, nepers[kSlots] = {};
    float step_re[kSlots] = {}, step_im[kSlots] = {};
    float correction[kSlots] = {};
    float re[kSlots] = {}, im[kSlots] = {};
    float left[kSlots] = {}, right[kSlots] = {};
    float left_step[kSlots] = {}, right_step[kSlots] = {};
    float left_to[kSlots] = {}, right_to[kSlots] = {};
    float edge[kSlots] = {};
    float push_re[kSlots] = {}, push_im[kSlots] = {};
    float duck[kSlots] = {};
    float rub[kSlots] = {};
    Glider third;
    int count = 0, bell = 0;
    float frequency = 440.0f;
    float turned = 0.0f;    // what every phase of this bell is turned by
    float strength = 0.0f;  // of the last strike, for the rub
    float hit = 0.0f, queued = 0.0f;
    int pulse_at = 0, pulse_length = 0;
    int duck_left = 0;
    float floor = 0.0f, follow = 0.0f;
    float steal = 1.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    int pending_bell = 0;
    uint32_t stamp = 0, tuned = 0, gained = 0, placed = 0;
    int holders = 0;
    int ids[kHolders] = {};
    bool tuned_released = false;
    bool ramping = false;
    bool sounding = false, pending = false;

    bool released() const { return holders == 0; }
    bool struck() const { return pulse_at < pulse_length; }
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

  int chosen_bell() const {
    return kit::clamp_int(static_cast<int>(param(tierce_bells::kBell) + 0.5f), 0, kNumBells - 1);
  }

  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding ? 1 : 0;
    return count;
  }

  // The voice a new bell takes: an idle one, else the quietest let go, else
  // the quietest held, the oldest on a tie; one that a strike already waits in
  // only when there is no other.
  int pick() const {
    int choice = -1;
    for (int pass = 0; pass < 4 && choice < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0 && voice.sounding) continue;
        if (pass == 1 && (voice.pending || !voice.released())) continue;
        if (pass == 2 && voice.pending) continue;
        if (choice < 0) {
          choice = v;
          continue;
        }
        const Voice& best = voices_[choice];
        const bool older = voice.stamp < best.stamp;
        if (pass == 0 ? older : voice.follow < best.follow || (voice.follow == best.follow && older)) choice = v;
      }
    }
    return choice;
  }

  static float level_knob(float value) { return 2.0f * value; }

  void set_knobs(bool glide) {
    using namespace tierce_bells;
    hum_pitch_.set(param(kHumPitch), glide);
    hum_gain_.set(level_knob(param(kHumLevel)), glide);
    quint_gain_.set(level_knob(param(kQuint)), glide);
    upper_gain_.set(level_knob(param(kUpper)), glide);
    spread_.set(param(kSpread), glide);
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
  }

  // A strike that finds no bell ringing: every knob is where it points, and
  // the control clock starts with the sound. This is exact to the sample,
  // where falling asleep is not.
  void restart() {
    set_knobs(false);
    chunk_left_ = 0;
  }

  // --- thirds --------------------------------------------------------------

  static bool in_scale(int scale, int degree) {
    static const int kScales[7][7] = {
        {0, 2, 4, 5, 7, 9, 11}, {0, 2, 3, 5, 7, 8, 10}, {0, 2, 3, 5, 7, 9, 10}, {0, 1, 3, 5, 7, 8, 10},
        {0, 2, 4, 6, 7, 9, 11}, {0, 2, 4, 5, 7, 9, 10}, {0, 2, 3, 5, 7, 8, 11},
    };
    for (int note : kScales[kit::clamp_int(scale, 0, 6)]) {
      if (note == degree) return true;
    }
    return false;
  }

  // The place of a struck key's third, cents above its prime.
  float place_for(float frequency) const {
    using namespace tierce_bells;
    const float knob = param(kTierce);
    if (param(kFollow) < 0.5f) return knob;
    const int root = static_cast<int>(param(kRoot) + 0.5f);
    const int scale = static_cast<int>(param(kScale) + 0.5f);
    const int degree = (kit::octave_key(frequency).key - root + 12) % 12;
    if (!in_scale(scale, degree)) return knob;
    const bool minor = in_scale(scale, (degree + 3) % 12);
    const bool major = in_scale(scale, (degree + 4) % 12);
    if (minor && major) return knob - kMinorThird <= kMajorThird - knob ? kMinorThird : kMajorThird;
    if (major) return kMajorThird;
    return minor ? kMinorThird : knob;
  }

  void strike_third(Voice& voice) {
    using namespace tierce_bells;
    const float place = place_for(voice.frequency);
    const float lean = param(kLean);
    voice.placed = place_serial_;
    if (lean == 0.0f) {
      voice.third.rest(place);
    } else {
      voice.third.go(place + lean, 0.0f, place, kit::max(param(kGlide), kShortestGlide));
    }
  }

  // --- strikes -------------------------------------------------------------

  static float together(float a, float b) { return kit::min(std::sqrt(a * a + b * b), 1.0f); }
  static float hit_of(float gain) { return gain * (0.8f + 0.2f * gain); }

  // How long the clapper rests on the bell, in periods of the note, and the
  // share of a partial it then wakes: a soft one wakes little above the note,
  // a hard one brings the upper partials forward. Most of what a soft clapper
  // costs the note itself is given back, so Hardness is colour before level.
  float contact(const Table& bell, float gain) const {
    const float hardness = param(tierce_bells::kHardness);
    return kSoftContact * std::pow(kHardContact / kSoftContact, hardness) * bell.striker * (1.2f - 0.4f * gain);
  }
  float strike_share(float ratio, float contact) const {
    const float x = ratio * contact;
    const float tilt = kHardTilt * (param(tierce_bells::kHardness) - 0.5f);
    return std::pow(1.0f + contact * contact, kMakeup) / (1.0f + x * x) * (ratio > 1.0f ? std::pow(ratio, tilt) : 1.0f);
  }

  // How loud a strike will be, for choosing which voice to take.
  static float expected_level(int bell, float gain) {
    const float level = bell == kRubbed ? kRubLevel * gain : kLevel * hit_of(gain);
    return kit::max(table(bell).gain * level, kSilence);
  }

  void start(Voice& voice, int bell, float frequency, float gain) {
    voice.bell = bell;
    voice.frequency = frequency;
    voice.count = table(bell).count;
    // Bells struck together start at different points of their cycles, so a
    // chord's strikes do not pile up (0.46 of a turn a semitone came out
    // lowest over six chords and three keys).
    voice.turned = kit::hz_to_midi(frequency) * 0.46f;
    for (int k = 0; k < kSlots; ++k) {
      voice.re[k] = voice.im[k] = voice.push_re[k] = voice.push_im[k] = 0.0f;
      voice.duck[k] = 1.0f;
    }
    voice.sounding = true;
    voice.pending = false;
    voice.steal = 1.0f;
    voice.follow = voice.floor = voice.queued = voice.hit = 0.0f;
    voice.pulse_at = voice.pulse_length = voice.duck_left = 0;
    voice.strength = gain;
    strike_third(voice);
    tune(voice);
    gains(voice, true);
    strike(voice, gain, true);
  }

  void strike_again(Voice& voice, float gain) {
    voice.strength = voice.struck() ? together(voice.strength, gain) : gain;
    strike_third(voice);
    tune(voice);
    if (voice.struck() && voice.pulse_at > 0) {
      // In the middle of a strike (8 ms at most): the next follows it.
      voice.queued = together(voice.queued, gain);
      voice.follow = kit::max(voice.follow, expected_level(voice.bell, gain));
      return;
    }
    strike(voice, voice.struck() ? together(voice.hit, gain) : gain, false);
  }

  void strike(Voice& voice, float gain, bool fresh) {
    const Table& bell = table(voice.bell);
    const float sr = sample_rate();
    const float touch = contact(bell, gain);
    const float hardest = contact(bell, 1.0f);
    const float hit = kLevel * bell.gain * (voice.bell == kRubbed ? kRubbedHit : 1.0f);
    const float hardness = param(tierce_bells::kHardness);
    voice.hit = gain;
    float power = 0.0f;
    bool ducks = false;
    for (int k = 0; k < voice.count; ++k) {
      const Mode& mode = bell.modes[k];
      const float amount = hit * hit_of(gain) * mode.level * strike_share(mode.ratio, touch);
      // Rubbing harder brings up what lies above the note.
      const float tilt = mode.ratio > 1.0f ? std::pow(mode.ratio, 2.0f * hardness - 1.0f) : 1.0f;
      voice.rub[k] = mode.rub * tilt;
      float most = kStack * hit * mode.level * strike_share(mode.ratio, hardest);
      if (voice.bell == kRubbed) most = kit::max(most, kStack * kRubLevel * bell.gain * voice.rub[k]);
      float ringing = fresh ? 0.0f : std::sqrt(voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k]);
      voice.duck[k] = 1.0f;
      if (ringing < 1.0e-9f) {
        const float phase = mode.phase + voice.turned;
        voice.push_re[k] = amount * kit::SineTable::cos_lookup(phase);
        voice.push_im[k] = amount * kit::SineTable::lookup(phase);
        ringing = 0.0f;
      } else {
        voice.push_re[k] = -amount * voice.im[k] / ringing;
        voice.push_im[k] = amount * voice.re[k] / ringing;
        const float room = std::sqrt(kit::max(most * most - amount * amount, 0.0f));
        if (ringing > room) {
          const float share = kit::max(room / ringing, 1.0e-3f);
          voice.duck[k] = std::pow(share, 1.0f / static_cast<float>(duck_ticks_ * kChunk));
          ringing *= share;
          ducks = true;
        }
      }
      const float gain_left = voice.left_to[k], gain_right = voice.right_to[k];
      power += (amount * amount + ringing * ringing) * (gain_left * gain_left + gain_right * gain_right);
    }
    voice.duck_left = ducks ? duck_ticks_ : 0;
    // The clapper's own speed: quicker when harder, and on higher notes.
    const float seconds = kSoftAttack * std::pow(kHardAttack / kSoftAttack, hardness) * (1.3f - 0.5f * gain) *
                          std::sqrt(kit::min(220.0f / voice.frequency, 1.0f));
    const int length = static_cast<int>(kit::clamp(seconds, 0.0003f, kSoftAttack * 1.3f) * sr + 0.5f);
    voice.pulse_at = 0;
    voice.pulse_length = kit::clamp_int(length, 4, 1 << 20);
    voice.floor = std::sqrt(power);
    if (voice.bell == kRubbed) voice.floor = kit::max(voice.floor, expected_level(kRubbed, gain));
    voice.follow = kit::max(kit::max(voice.follow, voice.floor), kSilence);
  }

  // --- pitch, decay and place of the partials ------------------------------

  void turn_to(Voice& voice, int k, float hz) {
    const float sr = sample_rate();
    const float top = kit::min(kTopHz, 0.45f * sr);
    const float edge = kit::clamp((top - hz) * (1.0f / (kTopHz - kEdgeHz)), 0.0f, 1.0f);
    if (edge != voice.edge[k]) {
      voice.edge[k] = edge;
      voice.gained = 0;  // the gains want setting again
    }
    if (edge <= 0.0f || hz < 5.0f) {
      voice.turn_re[k] = voice.turn_im[k] = voice.step_re[k] = voice.step_im[k] = 0.0f;
      return;
    }
    const float w = kit::kTwoPi * hz / sr;
    voice.turn_re[k] = std::cos(w);
    voice.turn_im[k] = std::sin(w);
    voice.step_re[k] = voice.radius[k] * voice.turn_re[k];
    voice.step_im[k] = voice.radius[k] * voice.turn_im[k];
    const double re = voice.step_re[k], im = voice.step_im[k];
    // What rounding did to the decay over a tick.
    voice.correction[k] = static_cast<float>(
        1.0 - kChunk * (static_cast<double>(voice.nepers[k]) + 0.5 * std::log(re * re + im * im)));
  }

  float mode_hz(const Voice& voice, const Mode& mode, float third_ratio) const {
    float ratio = mode.ratio;
    if (mode.role == kHum) ratio = hum_pitch_.value;
    if (mode.role == kThird) ratio = third_ratio;
    if (mode.role == kDeciem) ratio = 2.0f * third_ratio;
    return voice.frequency * ratio + param(tierce_bells::kDoublet) * mode.mate;
  }

  // Frequency and decay of every partial from the knobs as they stand.
  void tune(Voice& voice) {
    using namespace tierce_bells;
    const Table& bell = table(voice.bell);
    const float sr = sample_rate();
    const float damping = param(kDamping);
    const float power = 0.1f + 1.4f * damping + 1.1f * damping * damping;
    const float decay = param(kDecay);
    // A key let go adds to every partial's decay what takes the hum from
    // Decay (release 0) to kChokeSeconds (release 1).
    float choke = 0.0f;
    if (voice.released()) {
      const float seconds = decay * std::pow(kit::min(kChokeSeconds / decay, 1.0f), param(kRelease));
      choke = kSixtyDb / seconds - kSixtyDb / decay;
    }
    const float third_ratio = kit::cents_to_ratio(voice.third.value);
    for (int k = 0; k < voice.count; ++k) {
      const Mode& mode = bell.modes[k];
      const float seconds = decay * std::pow(mode.keep, power);
      voice.nepers[k] = (kSixtyDb / seconds + choke) / sr;
      voice.radius[k] = std::exp(-voice.nepers[k]);
      turn_to(voice, k, mode_hz(voice, mode, third_ratio));
    }
    voice.tuned = tuning_serial_;
    voice.tuned_released = voice.released();
  }

  // Only what a moving third carries: itself and the deciem.
  void tune_third(Voice& voice) {
    const Table& bell = table(voice.bell);
    const float third_ratio = kit::cents_to_ratio(voice.third.value);
    for (int k = 0; k < voice.count; ++k) {
      const Mode& mode = bell.modes[k];
      if (mode.role == kThird || mode.role == kDeciem) turn_to(voice, k, mode_hz(voice, mode, third_ratio));
    }
  }

  // Output gain of every partial: its knob, and its place. One half of a pair
  // stays in the middle; the other moves to a side and on past it into
  // opposite polarity, so a beating pair turns between the speakers (as in
  // modal-bells). Single partials lean to alternate sides.
  void gains(Voice& voice, bool snap) {
    const Table& bell = table(voice.bell);
    const float spread = spread_.value;
    const float turn = kFarSide * kit::kHalfPi * spread;
    const float near = kit::kSqrtHalf * (std::cos(turn) + std::sin(turn));
    const float far = kit::kSqrtHalf * (std::cos(turn) - std::sin(turn));
    int pairs = 0;
    for (int k = 0; k < voice.count; ++k) {
      const Mode& mode = bell.modes[k];
      float left = kit::kSqrtHalf, right = kit::kSqrtHalf;
      if (mode.mate < 0.0f) {
        left = (pairs & 1) ? far : near;
        right = (pairs & 1) ? near : far;
        ++pairs;
      } else if (mode.mate == 0.0f) {
        kit::pan_gains(((k & 1) ? 0.8f : -0.8f) * spread, &left, &right);
      }
      float level = voice.edge[k];
      if (mode.role == kHum) level *= hum_gain_.value;
      if (mode.role == kFifth) level *= quint_gain_.value;
      if (mode.role == kOver || mode.role == kDeciem) level *= upper_gain_.value;
      voice.left_to[k] = level * left;
      voice.right_to[k] = level * right;
      if (snap) {
        voice.left[k] = voice.left_to[k];
        voice.right[k] = voice.right_to[k];
        voice.left_step[k] = voice.right_step[k] = 0.0f;
      } else {
        voice.left_step[k] = (voice.left_to[k] - voice.left[k]) * (1.0f / kChunk);
        voice.right_step[k] = (voice.right_to[k] - voice.right[k]) * (1.0f / kChunk);
      }
    }
    voice.ramping = !snap;
    voice.gained = gain_serial_;
  }

  // --- every kChunk samples ------------------------------------------------

  void move_knobs() {
    if (!hum_pitch_.settled()) {
      hum_pitch_.next();
      ++tuning_serial_;
    }
    bool moved = false;
    for (kit::Smoother* knob : {&hum_gain_, &quint_gain_, &upper_gain_, &spread_}) {
      if (knob->settled()) continue;
      knob->next();
      moved = true;
    }
    if (moved) ++gain_serial_;
  }

  void control() {
    move_knobs();
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      land_gains(voice);
      if (voice.pending) {
        if (voice.steal <= 0.0f) start(voice, voice.pending_bell, voice.pending_frequency, voice.pending_gain);
        continue;
      }
      control_voice(voice);
    }
  }

  static void land_gains(Voice& voice) {
    if (!voice.ramping) return;
    for (int k = 0; k < voice.count; ++k) {
      voice.left[k] = voice.left_to[k];
      voice.right[k] = voice.right_to[k];
      voice.left_step[k] = voice.right_step[k] = 0.0f;
    }
    voice.ramping = false;
  }

  void control_voice(Voice& voice) {
    if (voice.placed != place_serial_) {
      voice.placed = place_serial_;
      const float place = place_for(voice.frequency);
      if (place != voice.third.to) {
        voice.third.go(voice.third.value, voice.third.speed_now(), place,
                       kit::max(param(tierce_bells::kGlide), kShortestGlide));
      }
    }
    const bool glides = voice.third.moving;
    if (glides) voice.third.step(tick_seconds_);
    if (voice.tuned != tuning_serial_ || voice.tuned_released != voice.released()) {
      tune(voice);
    } else if (glides) {
      tune_third(voice);
    }
    if (voice.gained != gain_serial_) gains(voice, false);
    if (!voice.struck() && voice.queued > 0.0f) {
      const float gain = voice.queued;
      voice.queued = 0.0f;
      strike(voice, gain, false);
    }
    // Rubbing: a partial under its level grows toward it (r a little over
    // 1), one over it is left to ring. The push is the partial itself, so it
    // needs no phase.
    const bool rubbing = voice.bell == kRubbed && !voice.released();
    const float rub_level = kRubLevel * table(voice.bell).gain * voice.strength * (0.8f + 0.2f * voice.strength);
    const bool ducking = voice.duck_left > 0;
    bool fed = false;
    float energy = 0.0f;
    for (int k = 0; k < voice.count; ++k) {
      voice.re[k] *= voice.correction[k];
      voice.im[k] *= voice.correction[k];
      const float power = voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
      float radius = voice.radius[k];
      if (voice.turn_re[k] == 0.0f && voice.turn_im[k] == 0.0f) {
        voice.re[k] = voice.im[k] = 0.0f;  // out of the band: it does not exist
      } else if (rubbing && voice.rub[k] > 0.0f && rub_level > 0.0f) {
        fed = true;
        const float target = voice.rub[k] * rub_level;
        float amplitude = std::sqrt(power);
        if (amplitude < target) {
          if (amplitude < 1.0e-4f * target) {
            amplitude = 1.0e-4f * target;
            const float phase = table(voice.bell).modes[k].phase + voice.turned;
            voice.re[k] = amplitude * kit::SineTable::cos_lookup(phase);
            voice.im[k] = amplitude * kit::SineTable::lookup(phase);
          }
          radius = 1.0f + kit::min((target - amplitude) / amplitude, 4.0f) * pump_step_;
        }
      } else if (power < 1.0e-24f) {
        voice.re[k] = voice.im[k] = 0.0f;
      }
      if (ducking) radius *= voice.duck[k];
      voice.step_re[k] = radius * voice.turn_re[k];
      voice.step_im[k] = radius * voice.turn_im[k];
      energy += power * (voice.left_to[k] * voice.left_to[k] + voice.right_to[k] * voice.right_to[k]);
    }
    if (ducking) --voice.duck_left;
    const float ringing = std::sqrt(energy);
    voice.follow = voice.struck() || (fed && rubbing) ? kit::max(voice.floor, ringing) : ringing;
    if (!fed && !voice.struck() && voice.queued <= 0.0f && ringing < kSilence) retire(voice);
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = false;
    voice.holders = 0;
    voice.follow = 0.0f;
    for (int k = 0; k < kSlots; ++k) voice.re[k] = voice.im[k] = 0.0f;
  }

  void render_voice(Voice& voice, int n, float* left, float* right) {
    float pulse[kChunk];
    const bool struck = !voice.pending && voice.struck();
    if (struck) {
      const float share = 1.0f / static_cast<float>(voice.pulse_length);
      for (int i = 0; i < n; ++i) {
        // A raised cosine whose samples add up to exactly 1.
        pulse[i] = voice.struck()
                       ? share * (1.0f - kit::SineTable::cos_lookup((static_cast<float>(voice.pulse_at) + 0.5f) * share))
                       : 0.0f;
        if (voice.struck()) ++voice.pulse_at;
      }
    }
    float out_left[kChunk] = {}, out_right[kChunk] = {};
    for (int k = 0; k < voice.count; ++k) {
      float re = voice.re[k], im = voice.im[k];
      if (re == 0.0f && im == 0.0f && !struck) continue;
      const float step_re = voice.step_re[k], step_im = voice.step_im[k];
      float gain_left = voice.left[k], gain_right = voice.right[k];
      const float ramp_left = voice.left_step[k], ramp_right = voice.right_step[k];
      if (struck) {
        float push_re = voice.push_re[k], push_im = voice.push_im[k];
        for (int i = 0; i < n; ++i) {
          const float turned = step_re * re - step_im * im + push_re * pulse[i];
          im = step_re * im + step_im * re + push_im * pulse[i];
          re = turned;
          const float pushed = step_re * push_re - step_im * push_im;
          push_im = step_re * push_im + step_im * push_re;
          push_re = pushed;
          out_left[i] += gain_left * im;
          out_right[i] += gain_right * im;
          gain_left += ramp_left;
          gain_right += ramp_right;
        }
        voice.push_re[k] = push_re;
        voice.push_im[k] = push_im;
      } else {
        for (int i = 0; i < n; ++i) {
          const float turned = step_re * re - step_im * im;
          im = step_re * im + step_im * re;
          re = turned;
          out_left[i] += gain_left * im;
          out_right[i] += gain_right * im;
          gain_left += ramp_left;
          gain_right += ramp_right;
        }
      }
      voice.re[k] = re;
      voice.im[k] = im;
      voice.left[k] = gain_left;
      voice.right[k] = gain_right;
    }
    if (!voice.pending) {
      for (int i = 0; i < n; ++i) {
        left[i] += out_left[i];
        right[i] += out_right[i];
      }
      return;
    }
    // A taken voice: out over 2 ms, then the new bell at the next tick.
    for (int i = 0; i < n; ++i) {
      voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
      left[i] += out_left[i] * voice.steal;
      right[i] += out_right[i] * voice.steal;
    }
  }

  Voice voices_[kMaxVoices];
  kit::Smoother hum_pitch_, hum_gain_, quint_gain_, upper_gain_, spread_;  // once a tick
  kit::Smoother volume_;                                                   // every sample
  kit::IdleGate idle_;
  uint32_t tuning_serial_ = 1, gain_serial_ = 1, place_serial_ = 1;
  uint32_t stamp_ = 0;
  int chunk_left_ = 0;
  int duck_ticks_ = 1;
  float tick_seconds_ = 0.0f;
  float pump_step_ = 0.0f;
  float steal_step_ = 0.0f;
};

}  // namespace livemix
