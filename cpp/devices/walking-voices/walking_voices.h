#pragma once

// Walking Voices: one crowd, always the same people. Change the chord and
// everyone walks to the nearest new note.
//
//   held notes ─► seats ─► least motion ─► 36 singers ─► each: path, phrase,
//   (12 at most)  (two to a note, the rest  (crowd.h)          tension
//                  by Low share)                                  │
//                                                                 ▼
//      out ◄─ soft clip ◄─ volume ◄─ walls (short taps) ◄─ grains (wavelets.h)
//
// - A key does not start a voice. It changes what the crowd is asked to sing:
//   the notes are dealt out again, whoever is already on a note that stays is
//   left there (two of them by rule), and the others walk as little as they
//   can. So every held note has two singers at all times, whatever comes and
//   goes, and the pool never steals anything.
// - A singer has a character for life: a place in the order from low to high,
//   a pace, a will, an ear, a mouth, a spot in the room. All of it is drawn
//   once from constants.
// - A walk has a wait (Lag, and more for the stubborn), a manner (Path) and a
//   tension (Strain) that eases after arriving. A walk is a pitch: the phase
//   is never touched, so nothing clicks. A leap closes the mouth for a moment
//   and opens it on the new note.
// - A phrase runs from breath to breath. Nobody breathes, and nobody wanders,
//   when that would leave fewer than two others singing on the note.
// - The crowd's power is shared, so ten keys are little louder than one.
//
// Everything slow runs once a tick (about 750 times a second) and ramps in
// between. A tick's samples are worked out from where the tick began, so the
// host's blocks make no difference, not in a single bit.

#include "../../kit/kit.h"
#include "crowd.h"
#include "params.gen.h"
#include "room.h"
#include "singer.h"
#include "wavelets.h"

namespace livemix {

class WalkingVoices : public kit::DeviceBase<walking_voices::kNumParams> {
 public:
  static constexpr int kSingers = walking_dsp::kSingers;
  static constexpr int kNotes = walking_dsp::kNotes;
  static constexpr int kCover = walking_dsp::kCover;
  static constexpr int kMaxPeriod = 256;
  static constexpr float kTickRate = 750.0f;

  enum Path : int { kSlide = 0, kSteps, kTurn, kLeap, kLate };
  void init(float sample_rate) {
    using namespace walking_voices;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    period_ = kit::clamp_int(static_cast<int>(sr / kTickRate + 0.5f), 16, kMaxPeriod);
    per_sample_ = 1.0f / static_cast<float>(period_);
    tick_rate_ = sr / static_cast<float>(period_);
    dt_ = 1.0f / tick_rate_;
    for (int i = 0; i < kSingers; ++i) walking_dsp::make_singer(singers_[i], i, dt_, kMaxPeriod, kRing);
    for (int n = 0; n < kNotes; ++n) {
      notes_[n] = Note();
      beats_[n] = 0.0f;
      beat_count_[n] = 0;
      lift_[n] = 1.0f;
    }
    for (int c = 0; c < kTones; ++c) tones_[c].set_time(kToneSeconds, tick_rate_);
    for (int i = 0; i < kRing * 2; ++i) ring_[i] = 0.0f;
    ring_at_ = 0;
    noise_.seed(0x6D2B79F5u);
    noise_low_ = noise_lower_ = 0.0f;
    noise_pole_ = std::exp(-kit::kTwoPi * kNoiseHz / sr);
    {
      // White noise of variance a third, twice through the pole, back to one:
      // the power of (1 - a)^2 / (1 - a z)^2 is (1 - a)(1 + a^2) / (1 + a)^3.
      const float a = noise_pole_;
      noise_gain_ = std::sqrt(3.0f * (1.0f + a) * (1.0f + a) * (1.0f + a) / ((1.0f - a) * (1.0f + a * a)));
    }
    chance_.seed(0x1B873593u);
    walls_.init(sr);
    for (kit::DcBlocker& block : dc_) block.set_cutoff(18.0f, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    norm_ = 0.0f;
    chord_gain_ = 1.0f;
    serial_ = 0;
    clock_ = 0;
    quiet_ = 0;
    dead_ = true;
    dirty_ = false;
    wander_wait_ = 0.5f;
    count_held_ = 0;
    clear_room();
    idle_.reset(sr, 0.25f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    // A pitch there is no such thing as would draw the whole crowd to it.
    if (!(frequency > 0.0f && frequency < 1.0e6f)) return;
    frequency = kit::clamp(frequency, kLowestHz, kHighestHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // One slot to an id: the same id again moves it, so one note off ends it.
    int slot = -1;
    for (int n = 0; n < kNotes && slot < 0; ++n) {
      if (notes_[n].held && notes_[n].id == note_id) slot = n;
    }
    for (int n = 0; n < kNotes && slot < 0; ++n) {
      if (!notes_[n].held) slot = n;
    }
    if (slot < 0) {
      // Twelve are held: the oldest gives way.
      slot = 0;
      for (int n = 1; n < kNotes; ++n) {
        if (static_cast<int32_t>(notes_[n].serial - notes_[slot].serial) < 0) slot = n;
      }
    }
    Note& note = notes_[slot];
    note.id = note_id;
    note.held = true;
    note.fresh = true;
    note.serial = ++serial_;
    note.pitch = kit::hz_to_midi(frequency);
    note.touch = gain;
    if (dead_) wake();
    dirty_ = true;
  }

  void note_off(int note_id) {
    for (Note& note : notes_) {
      if (note.held && note.id == note_id) {
        note.held = false;
        dirty_ = true;
      }
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(!dead_)) {
      volume_.snap(volume_.target);
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    int done = 0;
    while (done < frames) {
      if (clock_ == 0) tick();
      const int n = kit::clamp_int(period_ - clock_, 1, frames - done);
      render(out_left_ + done, out_right_ + done, n);
      done += n;
      clock_ += n;
      if (clock_ >= period_) clock_ = 0;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // For the harness: how many singers have been sent to the note of `note_id`
  // and are not breathing or away, and how many of those have arrived.
  int singers_on(int note_id, bool arrived) const {
    int count = 0;
    for (int n = 0; n < kNotes; ++n) {
      if (!notes_[n].held || notes_[n].id != note_id) continue;
      for (const Singer& s : singers_) {
        if (!s.gate || s.serial != notes_[n].serial || !s.own || s.away || s.gap > 0.0f || s.hush > 0.0f) continue;
        if (!arrived || s.state == walking_dsp::kHome) ++count;
      }
    }
    return count;
  }
  float place_of(int singer) const { return singers_[singer].place; }
  float goal_of(int singer) const { return singers_[singer].goal; }
  bool in_crowd(int singer) const { return singers_[singer].gate; }

 private:
  using Note = walking_dsp::Note;
  using Singer = walking_dsp::Singer;
  using Manner = walking_dsp::Manner;
  static constexpr float kLowestHz = 12.0f;
  static constexpr float kHighestHz = 9000.0f;
  static constexpr float kToneSeconds = 0.02f;
  static constexpr float kNoiseHz = 650.0f;
  static constexpr int kRing = 4096;
  // A key at velocity 0.7 peaks near -17 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.115f;
  // A singer under this is silent (its square is -120 dB).
  static constexpr float kSilent = 0.001f;
  static constexpr float kNever = 1.0e6f;

  // The knobs that reach every singer at every tick.
  enum ToneKnob : int {
    kToneVowel = 0,
    kToneVaried,
    kToneEffort,
    kToneStrain,
    kToneAir,
    kToneVibrato,
    kToneAgree,
    kToneLeader,
    kToneSpread,
    kTones
  };

  void apply(int id) {
    using namespace walking_voices;
    const float value = param(id);
    switch (id) {
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      case kVowel:
        tones_[kToneVowel].set(value, primed());
        break;
      case kVowelSpread:
        tones_[kToneVaried].set(value, primed());
        break;
      case kEffort:
        tones_[kToneEffort].set(value, primed());
        break;
      case kStrain:
        tones_[kToneStrain].set(value, primed());
        break;
      case kAir:
        tones_[kToneAir].set(value, primed());
        break;
      case kVibrato:
        tones_[kToneVibrato].set(value, primed());
        break;
      case kAgreement:
        tones_[kToneAgree].set(value, primed());
        break;
      case kLeader:
        tones_[kToneLeader].set(value, primed());
        break;
      case kSpread:
        tones_[kToneSpread].set(value, primed());
        break;
      case kPeople:
      case kLowShare:
        dirty_ = dirty_ || count_held_ > 0;
        break;
      default:
        break;
    }
  }

  // What a manner does to a time, less of it the longer the time asked for.
  static float eased(float factor, float length) { return 1.0f + (factor - 1.0f) / (1.0f + length); }

  int choice(int id, int count) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1); }

  void clear_room() {
    walls_.clear();
    for (kit::DcBlocker& block : dc_) block.reset();
  }

  // The first key after a silence: the clock starts again and the knobs are
  // where they were left.
  void wake() {
    dead_ = false;
    quiet_ = 0;
    clock_ = 0;
    norm_ = 0.0f;
    for (kit::Smoother& tone : tones_) tone.snap(tone.target);
    volume_.snap(volume_.target);
  }

  // --- who sings what -------------------------------------------------------

  // Deals the held notes out to the crowd again.
  void gather() {
    using namespace walking_voices;
    using walking_dsp::Seat;
    dirty_ = false;
    int slots[kNotes];
    int held = 0;
    for (int n = 0; n < kNotes; ++n) {
      if (!notes_[n].held) continue;
      int at = held++;
      while (at > 0 && notes_[slots[at - 1]].pitch > notes_[n].pitch) {
        slots[at] = slots[at - 1];
        --at;
      }
      slots[at] = n;
    }
    count_held_ = held;
    if (held == 0) {
      for (Singer& s : singers_) s.gate = false;
      return;
    }
    float pitches[kNotes], middle = 0.0f;
    for (int n = 0; n < held; ++n) {
      pitches[n] = notes_[slots[n]].pitch;
      middle += pitches[n] / static_cast<float>(held);
    }
    const float bottom = pitches[0];
    Seat seats[walking_dsp::kSeats];
    const int count = walking_dsp::lay(pitches, slots, held, param(kLowShare), seats);
    const int wanted = kit::clamp_int(static_cast<int>(param(kPeople) + 0.5f), kCover, kSingers);
    crowd_ = wanted > kCover * held ? wanted : kCover * held;
    walking_dsp::deal(seats, count, crowd_);
    walking_dsp::even_out(seats, count, crowd_);
    // Fewer people than it takes to have two on every note: both still sing,
    // and the second of them stays in the shadow of the first.
    const int short_of = kCover * held - wanted;
    shy_ = short_of > 0 ? static_cast<float>(short_of) / static_cast<float>(kCover * held - kCover + 1) : 0.0f;

    int member[kSingers], pinned[kSingers], seat_of[kSingers];
    float place[kSingers];
    int people = 0, kept[walking_dsp::kSeats] = {};
    for (int i = 0; i < kSingers; ++i) {
      Singer& s = singers_[i];
      if (s.priority >= crowd_) {
        s.gate = false;
        continue;
      }
      if (!s.born) {
        s.born = true;
        s.place = s.goal = middle;
      }
      pinned[people] = -1;
      // Two who are already on a note that stays are left there.
      for (int t = 0; t < count && pinned[people] < 0; ++t) {
        const Note& note = notes_[seats[t].note];
        if (seats[t].own && !note.fresh && s.gate && s.own && !s.away && s.gap <= 0.0f && s.hush <= 0.0f &&
            s.state == walking_dsp::kHome && s.serial == note.serial && kept[t] < kCover) {
          pinned[people] = t;
          ++kept[t];
        }
      }
      place[people] = s.place;
      member[people++] = i;
    }
    walking_dsp::assign(place, pinned, people, seats, count, seat_of);

    for (int t = 0; t < count; ++t) {
      // The two quickest on a note go first, and one of them leads.
      int first = -1, second = -1;
      for (int p = 0; p < people; ++p) {
        if (seat_of[p] != t) continue;
        const float pace = singers_[member[p]].pace - (pinned[p] >= 0 ? 100.0f : 0.0f);
        if (first < 0 || pace < rank_pace(member[first], pinned[first])) {
          second = first;
          first = p;
        } else if (second < 0 || pace < rank_pace(member[second], pinned[second])) {
          second = p;
        }
      }
      for (int p = 0; p < people; ++p) {
        if (seat_of[p] == t) send(singers_[member[p]], seats[t], bottom, p == first || p == second, p == first);
      }
    }
    for (Note& note : notes_) note.fresh = false;
  }

  float rank_pace(int singer, int pinned) const { return singers_[singer].pace - (pinned >= 0 ? 100.0f : 0.0f); }

  // A touch of nothing is nothing, and 0.7 is the voice as it is written.
  static float loudness(float touch) { return touch > 0.0f ? touch * (1.75f - 0.459f * touch) : 0.0f; }

  // Sends a singer to a seat: they stay, walk over or come in.
  void send(Singer& s, const walking_dsp::Seat& seat, float bottom, bool prompt, bool lead) {
    using namespace walking_voices;
    const Note& note = notes_[seat.note];
    const bool same = s.gate && s.serial == note.serial && s.own == seat.own && !s.away &&
                      std::fabs(s.home - seat.pitch) < 0.01f && !note.fresh;
    const bool was_singing = s.level > 0.03f && s.gap <= 0.0f;
    s.gate = true;
    s.note = seat.note;
    s.serial = note.serial;
    s.own = seat.own;
    s.lead = lead && seat.own;
    s.prompt = prompt;
    if (prompt) s.hush = 0.0f;
    s.share = seat.loud * (s.lead ? 1.0f + 0.35f * shy_ : 1.0f - 0.75f * shy_);
    s.home = seat.pitch;
    s.pure_goal = walking_dsp::pure_offset(seat.pitch - bottom);
    s.touch_goal = note.touch;
    if (same) return;
    s.away = false;
    const float lag = param(kLag);
    float wait = lag * (s.lead ? 0.1f : (prompt ? 0.3f : 1.0f)) * s.pace;
    if (!prompt)
      wait += stubborn_wait(s);
    else if (choice(kPath, 5) != kLeap)
      wait += 0.3f * kit::min(stubborn_wait(s), 4.0f);
    // However slow the rest are, a key is answered.
    if (prompt) wait = kit::min(wait, s.lead ? 0.15f : 0.5f);
    if (!was_singing) {
      s.pure = s.pure_goal;
      come_in(s, seat.pitch, prompt && choice(kPath, 5) == kLeap, wait, prompt ? 0.3f : 1.0f);
      s.hush = entry_wait(s);
      s.touch = s.touch_goal;
      return;
    }
    if (note.fresh && std::fabs(s.place - seat.pitch) < 0.05f) {
      // The same note struck again: the mouth closes and they come in anew.
      s.goal = seat.pitch;
      s.wait = wait;
      s.closing = true;
      s.enter = true;
      return;
    }
    if (note.fresh && param(kFade) > 0.0f) walking_dsp::renew(s);
    walk(s, seat.pitch, wait);
  }

  // Some give in late. At the top of the knob the most wilful never do.
  float stubborn_wait(const Singer& s) const {
    const float stubborn = param(walking_voices::kStubborn);
    if (stubborn <= 0.0f) return 0.0f;
    const float held = stubborn * s.will;
    if (held > 0.72f) return kNever;
    return 9.0f * held * held * stubborn;
  }

  // Nobody but the first two on a note comes in on the beat.
  float entry_wait(const Singer& s) const {
    if (s.prompt) return 0.0f;
    const float leap = choice(walking_voices::kPath, 5) == kLeap ? 0.6f : 1.0f;
    return leap * (param(walking_voices::kLag) * s.pace * (0.04f + 0.76f * s.will * s.will) +
                   0.5f * kit::min(stubborn_wait(s), 2.4f));
  }

  // From silence, or after a breath: begins as far off as Reach allows, on
  // the side they were last heard on.
  void come_in(Singer& s, float goal, bool straight, float wait, float share) {
    using namespace walking_voices;
    const float reach = param(kReach) * share;
    float from = kit::clamp(s.place, goal - reach, goal + reach);
    if (std::fabs(from - goal) < 0.3f * reach) from = goal + s.side * reach * (0.45f + 0.4f * s.mouth);
    if (straight) from = goal;
    s.goal = goal;
    s.from = from;
    s.place = from;
    s.jump = s.enter = s.closing = false;
    s.duck = 1.0f;
    if (s.level < 0.03f) s.level = kit::min(s.level, 0.03f);
    walking_dsp::renew(s);
    s.gap = s.hush = 0.0f;
    s.age = 0.0f;
    s.beat = 0.0f;
    s.tension = kit::max(s.tension, 0.8f);
    s.heard = s.note >= 0 ? beat_count_[s.note] : 0;
    s.turning = 0.0f;
    s.phrase = param(kBreath) * (0.65f + 0.7f * s.rng.uniform());
    if (straight || std::fabs(from - goal) < 0.01f) {
      s.state = walking_dsp::kHome;
      s.place = goal;
      if (choice(kPath, 5) == kTurn) start_turn(s);
      return;
    }
    s.state = walking_dsp::kWait;
    s.wait = wait * manner_wait();
  }

  float manner_wait() const { return choice(walking_voices::kPath, 5) == kLate ? 2.2f : 1.0f; }

  void walk(Singer& s, float goal, float wait) {
    s.goal = goal;
    s.from = s.place;
    s.state = walking_dsp::kWait;
    s.wait = wait * manner_wait() + (choice(walking_voices::kPath, 5) == kLate ? 0.25f : 0.0f);
    s.turning = 0.0f;
  }

  // --- the tick -------------------------------------------------------------

  void tick() {
    using namespace walking_voices;
    if (dirty_) gather();
    if (dead_) {
      // Long enough for the walls to have said all they have to say.
      if (quiet_ < kClearTicks && ++quiet_ == kClearTicks) clear_room();
      return;
    }
    for (kit::Smoother& tone : tones_) tone.next();
    for (int i = 0; i < period_; ++i) {
      const float white = noise_.bipolar();
      noise_low_ = flush_denormal(white + (noise_low_ - white) * noise_pole_);
      noise_lower_ = flush_denormal(noise_low_ + (noise_lower_ - noise_low_) * noise_pole_);
      // Held in, so that a whisper does not spit.
      const float held_in = noise_lower_ * noise_gain_;
      ring_[ring_at_] = ring_[ring_at_ + kRing] = 1.17f * held_in / std::sqrt(1.0f + 0.4f * held_in * held_in);
      ring_at_ = (ring_at_ + 1) & (kRing - 1);
    }

    int sent[kNotes] = {}, here[kNotes] = {};
    for (int n = 0; n < kNotes; ++n) present_[n] = 0;
    for (const Singer& s : singers_) {
      if (!s.gate || s.away || s.note < 0) continue;
      ++sent[s.note];
      if (s.gap > 0.0f || s.hush > 0.0f || s.state != walking_dsp::kHome) continue;
      ++here[s.note];
      if (s.own) ++present_[s.note];
    }
    // Whoever has arrived sings up for those who have not.
    for (int n = 0; n < kNotes; ++n) {
      const float missing = static_cast<float>(sent[n]) / static_cast<float>(here[n] > 0 ? here[n] : 1);
      const float goal = std::sqrt(kit::clamp(missing, 1.0f, 4.0f));
      lift_[n] += (goal - lift_[n]) * kit::min(1.0f, dt_ / (goal > lift_[n] ? 0.02f : 0.12f));
    }
    if (count_held_ > 0) stroll();
    // Each note marks time at a pace of its own.
    for (int n = 0; n < kNotes; ++n) {
      const float pace = 0.86f + 0.045f * static_cast<float>((n * 5) % 7);
      const float seconds = (path_ == kTurn ? 4.0f : 2.0f) * kit::clamp(param(kLag), 0.14f, 2.5f) * pace;
      beats_[n] += dt_ / seconds;
      if (beats_[n] >= 1.0f) {
        beats_[n] -= 1.0f;
        ++beat_count_[n];
      }
    }

    // The power of a crowd of this size, shared out; more keys add a little.
    const float crowd = static_cast<float>(crowd_ > 0 ? crowd_ : kCover);
    // Where notes die away there are never as many at once.
    const float norm_goal = kVoiceGain * (1.0f + 0.3f * param(kFade)) / std::sqrt(crowd);
    const float chord_goal = std::exp2(0.2f * std::log2(static_cast<float>(count_held_ > 0 ? count_held_ : 1)));
    if (norm_ == 0.0f) {
      norm_ = norm_goal;
      chord_gain_ = chord_goal;
    } else {
      norm_ += (norm_goal - norm_) * kit::min(1.0f, dt_ / 0.05f);
      if (count_held_ > 0) chord_gain_ += (chord_goal - chord_gain_) * kit::min(1.0f, dt_ / 0.08f);
    }
    // Leaders have this share of the power and the rest have the rest.
    const float leaders = static_cast<float>(count_held_ > 0 ? count_held_ : 1);
    const float fair = kit::min(leaders / crowd, 0.5f);
    const float leader = tones_[kToneLeader].value;
    const float share = fair + (0.985f - fair) * leader;
    // Out in front and in the middle, they are heard as louder than they are.
    const float near = 1.0f - 0.2f * leader;
    lead_weight_ = near * std::sqrt(share / fair);
    rest_weight_ = near * std::sqrt((1.0f - share) / (1.0f - fair));

    const float effort = tones_[kToneEffort].value;
    const float agree = tones_[kToneAgree].value;
    effort_ = effort * (0.7f + 0.5f * effort);
    const float loose = 1.0f - agree;
    cents_ = 0.5f + 75.0f * loose * loose * std::sqrt(loose + 0.0001f);
    // Who cannot agree on a pitch does not agree on a vowel either.
    const float varied = tones_[kToneVaried].value;
    varied_ = 1.15f * varied * (0.6f + 0.55f * varied) * (1.36f - 0.6f * agree);
    pull_ = walking_dsp::smooth_step((agree - 0.6f) * 2.5f);
    sway_cents_ = 105.0f * tones_[kToneVibrato].value * (0.35f + 0.65f * tones_[kToneVibrato].value);
    path_ = choice(kPath, 5);
    body_ = choice(kBody, walking_dsp::kBodies);
    const Manner& manner = walking_dsp::kManners[path_];
    const Manner& wood = walking_dsp::kBodyManners[body_];
    const float attack = param(kAttack), release = param(kRelease);
    attack_step_ = dt_ / kit::clamp(attack * eased(manner.attack * wood.attack, attack * 0.9f), 0.0015f, 8.0f);
    release_drop_ = std::exp(-3.454f * dt_ / kit::clamp(release * eased(manner.release * wood.release, release * 0.1f), 0.03f, 24.0f));

    bool any = false;
    for (int i = 0; i < kSingers; ++i) {
      Singer& s = singers_[i];
      if (!s.gate && s.level <= 0.0f && !s.sounding) continue;
      live(s);
      voice(s);
      any = any || s.sounding || s.gate;
    }
    if (!any && count_held_ == 0) {
      dead_ = true;
      quiet_ = 0;
    }
  }

  // Now and then someone goes to another note, if two others stay behind.
  void stroll() {
    using namespace walking_voices;
    const float wander = param(kWander);
    if (wander <= 0.0f) return;
    wander_wait_ -= dt_ * wander * std::sqrt(wander) * static_cast<float>(crowd_) * 0.22f;
    if (wander_wait_ > 0.0f) return;
    wander_wait_ = 0.4f + 1.2f * chance_.uniform();
    int who = -1;
    for (int tries = 0; tries < 6 && who < 0; ++tries) {
      const int i = static_cast<int>(chance_.uniform() * static_cast<float>(kSingers));
      const Singer& c = singers_[i];
      const bool free = c.gate && !c.away && c.state == walking_dsp::kHome && c.gap <= 0.0f && c.note >= 0 && !c.lead;
      if (free && (!c.own || present_[c.note] > kCover)) who = i;
    }
    if (who < 0) return;
    Singer& s = singers_[who];
    float goal = s.home;
    int others[kNotes];
    int count = 0;
    for (int n = 0; n < kNotes; ++n) {
      if (notes_[n].held && std::fabs(notes_[n].pitch - s.home) > 0.5f) others[count++] = n;
    }
    const float octave = chance_.uniform() < 0.5f ? -12.0f : 12.0f;
    if (count > 0 && chance_.uniform() < 0.6f) {
      goal = notes_[others[static_cast<int>(chance_.uniform() * static_cast<float>(count))]].pitch;
    } else {
      goal = s.home + octave;
    }
    // Nobody goes further than their voice does.
    while (goal - s.home > 12.5f) goal -= 12.0f;
    while (goal - s.home < -12.5f) goal += 12.0f;
    if (goal < 31.0f || goal > 100.0f) return;
    if (s.own) --present_[s.note];
    s.away = true;
    s.stay = 1.5f + 3.5f * chance_.uniform() + 3.0f * wander + param(kLag);
    walk(s, goal, 0.05f);
  }

  void start_turn(Singer& s) {
    s.turning = 1.0e-4f;
    s.pace_step = dt_ / kit::clamp(param(walking_voices::kLag) * 1.4f * s.pace, 0.22f, 3.0f);
  }

  // A singer's pitch, level and mood over one tick.
  void live(Singer& s) {
    using namespace walking_voices;
    const bool held = s.gate;
    // The mouth closes for a change of body, a leap or the same note again.
    if (held && s.body != body_ && s.body_wait < 0.0f) {
      s.body_wait = s.sounding ? 0.09f * s.pace * s.rng.uniform() : 0.0f;
    }
    bool change = false;
    if (s.body_wait >= 0.0f) {
      s.body_wait -= dt_;
      change = s.body_wait < 0.0f;
      if (change && s.body == body_) change = false;
    }
    if (change) s.closing = true;
    if (s.closing) {
      if (s.duck > 0.0f && s.sounding) {
        s.duck = kit::max(0.0f, s.duck - 0.25f);
      } else {
        // Shut since the last tick: now nothing that changes is heard.
        s.duck = 0.0f;
        s.closing = false;
        if (s.body != body_) s.body = body_;
        if (s.enter) {
          s.level = 0.0f;
          come_in(s, s.goal, path_ == kLeap, s.wait, s.prompt ? 0.3f : 1.0f);
          s.hush = entry_wait(s);
          s.duck = 0.0f;
        } else if (s.jump) {
          s.jump = false;
          s.level = 0.0f;
          arrive(s);
        }
      }
    } else if (s.duck < 1.0f) {
      s.duck = kit::min(1.0f, s.duck + 0.25f);
    }

    if (s.hush > 0.0f) s.hush -= dt_;
    if (s.hush > 0.0f) {
      s.beat = 0.0f;
    } else if (s.state == walking_dsp::kWait) {
      s.wait -= dt_;
      if (s.wait <= 0.0f && !s.closing) set_out(s);
    } else if (s.state == walking_dsp::kMove) {
      s.u += s.pace_step;
      if (s.u >= 1.0f) arrive(s);
    } else {
      s.age += dt_;
    }
    if (s.state == walking_dsp::kHome && s.turning > 0.0f) {
      s.turning += s.pace_step;
      if (s.turning >= 1.0f) s.turning = 0.0f;
    }
    s.beat += dt_;
    s.place = pitch_now(s);
    // One loudness from the bottom to the top. Whistlers are never down there.
    s.tilt = std::exp2(kit::clamp(72.0f - s.place, -18.0f, s.body == walking_dsp::kWhistle ? 0.0f : 36.0f) * 0.0166f);

    if (s.away && held && s.state == walking_dsp::kHome) {
      s.stay -= dt_;
      if (s.stay <= 0.0f) {
        s.away = false;
        walk(s, s.home, 0.02f);
      }
    }
    if (held && s.hush <= 0.0f) phrase(s);
    express(s);

    float target = 0.0f;
    const float fade = param(kFade);
    if (held && s.gap <= 0.0f && s.hush <= 0.0f) {
      // Nobody sinks before they have come up.
      if (s.level > 0.9f * std::sqrt(s.sunk)) s.risen = true;
      const bool there = path_ != kLate || s.state == walking_dsp::kHome || s.sung > 2.0f * s.phrase;
      if (s.risen && there) s.sinking += dt_;
      if (fade > 0.0f)
        s.sunk = kit::lerp(std::exp(-3.6f * s.sinking / s.phrase), 1.0f, (1.0f - fade) * (1.0f - fade));
      else
        s.sunk = 1.0f;
      target = std::sqrt(s.sunk);
      if (target < 0.002f) target = 0.0f;
    }
    if (!held) {
      s.level *= s.away ? release_drop_ * release_drop_ : release_drop_;
    } else if (s.level < target) {
      // ... nor takes the whole of a breath to come up.
      s.level = kit::min(target, s.level + kit::max(attack_step_, fade * dt_ / (0.35f * s.phrase)));
    } else {
      s.level += (target - s.level) * (s.gap > 0.0f ? kit::min(1.0f, dt_ / 0.05f) : kit::min(1.0f, dt_ / 0.02f));
    }
    if (s.level < kSilent && target == 0.0f) s.level = 0.0f;
  }

  // The wait is over: how the walk goes is Path's.
  void set_out(Singer& s) {
    using namespace walking_voices;
    const float far = std::fabs(s.goal - s.from);
    const float lag = param(kLag);
    float seconds = 0.12f + lag * s.pace * kit::min(1.6f, 0.45f + 0.09f * far);
    s.state = walking_dsp::kMove;
    s.manner = path_;
    s.u = 0.0f;
    s.steps = 1;
    s.step_at = -1;
    switch (path_) {
      case kSteps:
        s.steps = kit::clamp_int(static_cast<int>(std::ceil(far * 0.5f - 0.01f)), 1, 7);
        seconds = static_cast<float>(s.steps) * kit::clamp(lag * 0.5f * s.pace, 0.09f, 1.4f);
        break;
      case kTurn:
        seconds = 0.2f + seconds * 1.5f;
        break;
      case kLeap:
        // The mouth closes; the jump is made while it is shut.
        s.state = walking_dsp::kWait;
        s.wait = kNever;
        s.jump = true;
        s.closing = true;
        return;
      case kLate:
        seconds = 0.12f + 0.35f * lag * s.pace;
        break;
      default:
        break;
    }
    // The first two on a note show the others where it is.
    if (s.prompt && !s.away && path_ != kLate) seconds = path_ == kSlide ? kit::min(0.05f + 0.2f * (seconds - 0.12f), 0.6f) : 0.5f * seconds;
    s.pace_step = dt_ / kit::max(seconds, 0.02f);
  }

  void arrive(Singer& s) {
    s.state = walking_dsp::kHome;
    s.place = s.from = s.goal;
    s.u = 1.0f;
    if (path_ == kLeap) s.tension = 1.0f;
    s.age = 0.0f;
    if (path_ == kSteps || path_ == kLeap) s.beat = 0.0f;
    s.next_beat = 0.5f;
  }

  float pitch_now(Singer& s) {
    using namespace walking_voices;
    if (s.state == walking_dsp::kWait) return s.from;
    float wave = 0.0f, place = s.goal;
    const float width = kit::min(0.6f + 0.35f * param(kReach), 3.2f);
    if (s.state == walking_dsp::kMove) {
      const float gap = s.goal - s.from;
      if (s.manner == kSteps) {
        const float at = s.u * static_cast<float>(s.steps);
        const int step = kit::clamp_int(static_cast<int>(at), 0, s.steps - 1);
        if (step != s.step_at) {
          s.step_at = step;
          walking_dsp::speak(s);
        }
        const float n = static_cast<float>(s.steps);
        const float behind = s.goal - std::floor(gap * (1.0f - static_cast<float>(step) / n) + 0.5f);
        const float below = step == 0 ? s.from : behind;
        const float next = s.goal - std::floor(gap * (1.0f - static_cast<float>(step + 1) / n) + 0.5f);
        return below + (next - below) * walking_dsp::smooth_step((at - static_cast<float>(step)) * 2.6f);
      }
      if (s.manner == kTurn) {
        place = s.from + gap * walking_dsp::smooth_step(s.u * 2.2f);
        const float t = kit::clamp((s.u - 0.3f) * (1.0f / 0.7f), 0.0f, 1.0f);
        wave = width * walking_dsp::turn_wave(t);
      } else {
        place = s.from + gap * walking_dsp::smooth_step(s.u);
      }
    } else if (s.turning > 0.0f) {
      wave = width * walking_dsp::turn_wave(s.turning);
    }
    return place + wave;
  }

  // From breath to breath, and what people do meanwhile.
  void phrase(Singer& s) {
    using namespace walking_voices;
    const float breath = param(kBreath);
    if (s.gap > 0.0f) {
      s.gap -= dt_;
      if (s.gap <= 0.0f) {
        s.gap = 0.0f;
        come_in(s, s.away ? s.goal : s.home, false, 0.3f * param(kLag) * s.pace, 0.55f);
      }
      return;
    }
    s.sung += dt_;
    // The knob moved: nobody sings on for longer than it says.
    if (s.phrase > breath * 1.4f) s.phrase = breath * 1.4f;
    // The more they fade, the longer it is until they come in again: at the
    // top, never.
    const float fade = param(kFade);
    const float dying = kit::clamp((fade - 0.5f) * 2.0f, 0.0f, 1.0f);
    if (s.sung > s.phrase * (1.0f + 4.0f * dying * dying) && fade < 0.97f && s.duck >= 1.0f) {
      if (!s.away && s.own && (s.state != walking_dsp::kHome || present_[s.note] <= kCover)) {
        // Needed here: they catch a breath while singing on.
        walking_dsp::renew(s);
        s.phrase = breath * (0.65f + 0.7f * s.rng.uniform());
        if (path_ == kSteps || path_ == kLeap) walking_dsp::speak(s);
        return;
      }
      if (s.own && !s.away) --present_[s.note];
      s.gap = kit::min(0.14f + 0.07f * breath, 0.55f) * (0.8f + 0.4f * s.rng.uniform());
      return;
    }
    if (s.state != walking_dsp::kHome || s.away) return;
    if (path_ == kSteps) {
      // Marking time: the people of a note together, or nearly.
      if (s.heard != beat_count_[s.note]) {
        s.heard = beat_count_[s.note];
        s.next_beat = 0.1f * param(kLag) * s.pace;
      }
      if (s.next_beat > 0.0f) {
        s.next_beat -= dt_;
        if (s.next_beat <= 0.0f) walking_dsp::speak(s);
      }
    } else if (path_ == kTurn) {
      // A turn goes through the people of a note like a wave, and two of
      // them hold the note meanwhile.
      if (s.heard != beat_count_[s.note]) {
        s.heard = beat_count_[s.note];
        s.next_beat = 0.35f * kit::min(param(kLag), 2.5f) * s.pace + 0.002f;
      }
      if (s.next_beat > 0.0f) {
        s.next_beat -= dt_;
        if (s.next_beat <= 0.0f && s.turning <= 0.0f && !s.prompt) start_turn(s);
      }
    }
  }

  // What the way there does to the voice.
  void express(Singer& s) {
    const Manner& manner = walking_dsp::kManners[path_];
    float accent = 1.0f, bright = 0.0f, word = 0.0f;
    const bool off = s.state != walking_dsp::kHome && std::fabs(s.goal - s.from) > 0.05f;
    switch (path_) {
      case kSteps: {
        const float hit = 1.0f / (1.0f + 60.0f * s.beat * s.beat);
        accent = 0.05f + 1.1f * hit;
        bright = -0.15f + 0.5f * hit;
        word = (s.syllable & 1 ? 0.3f : -0.12f) * (0.35f + 0.65f * hit);
        break;
      }
      case kTurn: {
        const bool turning = s.turning > 0.0f || s.state == walking_dsp::kMove;
        accent = turning ? 1.25f : 0.45f;
        bright = turning ? 0.5f : -0.05f;
        word = turning ? 0.3f : 0.0f;
        break;
      }
      case kLeap: {
        const float hit = 1.0f / (1.0f + 40.0f * s.beat * s.beat);
        accent = 0.2f + 1.3f * hit;
        bright = 0.9f * hit;
        word = 0.12f * hit;
        break;
      }
      case kLate: {
        const float eased = s.state == walking_dsp::kHome ? walking_dsp::smooth_step(s.age * kit::max(0.5f, 1.2f / s.phrase)) : 0.0f;
        accent = 0.36f + 0.68f * eased;
        bright = 0.3f * (1.0f - eased);
        word = -0.2f * (1.0f - eased);
        break;
      }
      default:
        break;
    }
    bright += manner.effort;
    word += manner.vowel;
    s.word += (word - s.word) * kit::min(1.0f, dt_ / 0.03f);
    const float quick = kit::min(1.0f, dt_ / (accent > s.accent ? 0.005f : 0.03f));
    s.accent += (accent - s.accent) * quick;
    s.bright += (bright - s.bright) * quick;
    // High notes are never quite easy.
    const float easy = off ? 1.0f : 0.12f + 0.36f * walking_dsp::smooth_step((s.place - 55.0f) * 0.04f);
    s.tension += (easy - s.tension) * kit::min(1.0f, dt_ / (off ? 0.05f : 0.5f + 2.0f * tones_[kToneStrain].value));
    const float slow = kit::min(1.0f, dt_ / 0.04f);
    s.touch += (s.touch_goal - s.touch) * slow;
    s.front += ((s.lead ? 1.0f : 0.0f) - s.front) * slow;
    const float way = off || s.note < 0 ? walking_dsp::kOnTheWay[path_] : lift_[s.note];
    s.lift += (way - s.lift) * kit::min(1.0f, dt_ / 0.03f);
    const float weight = s.share * (rest_weight_ + (lead_weight_ - rest_weight_) * s.front);
    s.weight += (weight - s.weight) * (s.sounding ? slow : 1.0f);
    s.pure += (s.pure_goal - s.pure) * kit::min(1.0f, dt_ / 0.15f);
  }

  // What is heard of it by the end of the tick that follows.
  void voice(Singer& s) {
    using namespace walking_voices;
    using walking_dsp::Tone;
    s.now = s.aim;
    const float sr = sample_rate();
    float drift = 0.0f;
    for (int k = 0; k < 3; ++k) {
      drift += kit::SineTable::lookup(s.drift[k]) * (k == 0 ? 0.5f : (k == 1 ? 0.28f : 0.35f));
      s.drift[k] += s.drift_step[k];
      s.drift[k] -= std::floor(s.drift[k]);
    }
    s.swing += s.sway * dt_ * (1.0f + 0.06f * drift);
    s.swing -= std::floor(s.swing);
    // A cent is fewer beats down there: low voices stand further apart.
    const float low = 1.0f + 0.8f * walking_dsp::smooth_step((66.0f - s.place) * (1.0f / 36.0f));
    const float own = cents_ * low * (1.0f - 0.6f * s.front);
    const float found = s.state == walking_dsp::kHome ? walking_dsp::smooth_step((s.age - 0.12f) * 1.3f) : 0.0f;
    const float swing = kit::SineTable::lookup(s.swing);
    const float cents = own * (0.75f * s.ear + 0.6f * drift) + sway_cents_ * found * (1.0f + 0.35f * drift) * swing;
    const float pitch = s.place + 0.01f * cents + s.pure * pull_;
    const float hz = kit::clamp(kit::midi_to_hz(pitch), 6.0f, kit::min(11000.0f, 0.4f * sr));

    walking_dsp::Ask ask;
    ask.body = s.body;
    ask.hz = hz;
    const float varied = varied_;
    ask.vowel = kit::clamp(tones_[kToneVowel].value + s.word + varied * (0.85f * s.mouth + 0.6f * drift), 0.0f, 1.0f);
    const float strain = tones_[kToneStrain].value;
    ask.effort = kit::max(0.0f, effort_ + 0.75f * (s.touch - 0.7f) + strain * s.tension * 1.3f +
                                    s.bright * (0.5f + 0.5f * effort_) + 0.12f * s.front +
                                    0.45f * varied * (s.ear * s.ear * 2.0f - 0.7f + 0.5f * drift) +
                                    tones_[kToneVibrato].value * found * (0.38f + 0.45f * swing));
    // The voice gives less and less for what is asked of it.
    if (ask.effort > 0.6f) ask.effort = 0.6f + 1.1f * (1.0f - std::exp((0.6f - ask.effort) / 1.1f));
    ask.rough = strain * s.tension * (0.2f + 0.4f * strain);
    ask.air = tones_[kToneAir].value;
    ask.air *= 0.6f + 0.4f * ask.air + 0.25f * (1.0f - s.level) * (1.0f - ask.air);
    walking_dsp::shape(ask, sr, &s.aim);
    s.aim.v[walking_dsp::kInc] = hz / sr;

    const float stand = walking_dsp::kManners[path_].spread * walking_dsp::kBodyManners[s.body].spread;
    const float spread = kit::min(1.0f, tones_[kToneSpread].value * stand);
    s.stand += (spread - s.stand) * (s.sounding ? kit::min(1.0f, dt_ / 0.1f) : 1.0f);
    const float forward = 1.0f - 0.85f * s.front * tones_[kToneLeader].value;
    float left, right;
    const float round = s.turning > 0.0f ? 0.6f * walking_dsp::turn_wave(s.turning) * s.side : 0.0f;
    s.round += (round - s.round) * kit::min(1.0f, dt_ / 0.03f);
    kit::pan_gains(s.stand * (s.spot * forward + s.round + 0.1f * drift), &left, &right);
    const float back = s.depth * s.stand * forward;
    const float gain = norm_ * chord_gain_ * s.level * s.level * s.duck * s.accent * s.weight * s.lift *
                       loudness(s.touch) * (1.0f - 0.3f * back) * s.tilt;
    s.aim.v[walking_dsp::kLeft] = gain * left;
    s.aim.v[walking_dsp::kRight] = gain * right;
    s.aim.v[walking_dsp::kFar] = gain * back;
    const bool was = s.sounding;
    s.sounding = gain > 0.0f || (was && s.now.v[walking_dsp::kLeft] + s.now.v[walking_dsp::kRight] > 0.0f);
    if (!was || (s.now.v[walking_dsp::kLeft] == 0.0f && s.now.v[walking_dsp::kRight] == 0.0f)) {
      // Nothing to ramp from: they begin as they are, from silence.
      s.now = s.aim;
      s.now.v[walking_dsp::kLeft] = s.now.v[walking_dsp::kRight] = s.now.v[walking_dsp::kFar] = 0.0f;
    }
    for (int l = 0; l < walking_dsp::kLanes; ++l) s.step.v[l] = (s.aim.v[l] - s.now.v[l]) * per_sample_;
    // The phase of the tick that just ended has been carried on by render.
  }

  // `frames` samples of the tick, beginning at its sample clock_.
  void render(float* left, float* right, int frames) {
    float* const far = far_;
    for (int i = 0; i < frames; ++i) left[i] = right[i] = far[i] = 0.0f;
    const bool last = clock_ + frames >= period_;
    if (!dead_) {
      for (Singer& s : singers_) {
        if (!s.sounding) continue;
        const int at = (ring_at_ - period_ - s.noise_delay) & (kRing - 1);
        walking_dsp::sing_body(s.body, s.now, s.step, s.phase, ring_ + at + clock_, clock_, frames, left, right, far);
        if (last) {
          const float k = static_cast<float>(period_);
          s.phase += k * (0.5f * s.now.v[walking_dsp::kInc] + k * 0.25f * s.step.v[walking_dsp::kInc]);
          s.phase -= std::floor(s.phase);
        }
      }
    }
    for (int i = 0; i < frames; ++i) {
      float from_left, from_right;
      walls_.process(far[i], &from_left, &from_right);
      const float volume = volume_.next();
      left[i] = kit::soft_clip((dc_[0].process(left[i]) + from_left) * volume);
      right[i] = kit::soft_clip((dc_[1].process(right[i]) + from_right) * volume);
    }
  }

  static constexpr int kClearTicks = 112;  // 0.15 s

  Singer singers_[kSingers];
  Note notes_[kNotes];
  int present_[kNotes] = {};
  float beats_[kNotes] = {};
  uint32_t beat_count_[kNotes] = {};
  kit::Smoother tones_[kTones];
  kit::Smoother volume_;
  kit::Rng noise_, chance_;
  float ring_[2 * kRing] = {};
  float far_[kMaxBlockFrames] = {};
  walking_dsp::Walls walls_;
  kit::DcBlocker dc_[2];
  kit::IdleGate idle_;
  int ring_at_ = 0, period_ = 64, clock_ = 0, quiet_ = 0, count_held_ = 0, crowd_ = kCover;
  int path_ = 0, body_ = 0;
  bool dead_ = true, dirty_ = false;
  uint32_t serial_ = 0;
  float per_sample_ = 1.0f / 64.0f, tick_rate_ = 750.0f, dt_ = 1.0f / 750.0f;
  float noise_low_ = 0.0f, noise_lower_ = 0.0f, noise_pole_ = 0.9f, noise_gain_ = 1.0f;
  float lift_[kNotes] = {};
  float shy_ = 0.0f, varied_ = 0.0f;
  float wander_wait_ = 0.5f, norm_ = 0.0f, chord_gain_ = 1.0f, lead_weight_ = 1.0f, rest_weight_ = 1.0f;
  float effort_ = 0.4f, cents_ = 5.0f, pull_ = 0.0f, sway_cents_ = 0.0f, attack_step_ = 0.01f, release_drop_ = 0.99f;
};

}  // namespace livemix
