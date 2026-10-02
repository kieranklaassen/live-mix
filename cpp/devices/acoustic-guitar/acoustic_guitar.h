#pragma once

// Acoustic Guitar: plucked strings heard through a wooden body.
//
//   per note (up to 12):
//     pluck ─► string loop A ─┐
//     pluck ─► string loop B ─┴─► release damping ─► pan ─┐
//                                                         ▼
//   all notes ─► DC blocker ─┬─► direct ──────────────────(+)─► tone ─► volume ─► soft clip
//                            └─► eight body modes ─────────┘
//   body knock (a pulse at every pluck) ──► the same modes
//
// - Each note is two kit::PluckedString loops. On Steel and Nylon they are
//   the string's two polarisations: loop A moves towards the top plate, is
//   the louder one and loses its energy to the bridge sooner; loop B moves
//   along the top, is quieter and rings longer. Together they give the
//   two-stage decay of a guitar note, and Shimmer detunes them so the note
//   slowly beats. The pair is centred so the level-weighted pitch is the one
//   played. On Twelve string loop B is the other string of the course: an
//   octave above for notes below B3, a unison from B3 up.
// - A note rings Sustain × sqrt(110 Hz / f): several seconds in the bass,
//   one or two at the top, and nylon 0.7 as long as steel. A partial at
//   frequency f rings (f / f0)^-k as long as the note: k is 0.45 on steel
//   and 1 on nylon, whose highs are gone in a few tenths of a second. Steel
//   has stiff, stretched partials and nylon has none.
// - A fundamental that sits on the body's air or top mode hands its energy
//   to the body: loop A dies up to 40 % sooner there, and the mode makes the
//   note louder.
// - The body is the same for every note: band-pass modes at fixed
//   frequencies beside the direct string. The two low ones (100 and 200 Hz)
//   are what makes it a guitar; the six above are the box. Every pluck also
//   knocks the body with a short low pulse, which is what makes the attack
//   sound like wood.
// - Notes start from a sample countdown. A chord's notes are spread low to
//   high by Strum; a note played on a pitch that is still ringing first
//   stops the old string (8 ms), and a stolen voice fades (3 ms) before the
//   new note is plucked. Key-up never touches the ringing loop: the voice's
//   output fades over Release behind a low-pass that closes as it fades, so
//   the highs go first, like a finger landing on the string.
// - Every pluck differs a little in level, brightness and position, from a
//   generator seeded in init: the same notes always give the same audio.
//
// Type, Position, Nail, Sustain, Shimmer and Strum are read when a note is
// plucked, Release when its key goes up; Body, Tone and Volume are live. The
// instrument sleeps when no note sounds and the body has rung out.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class AcousticGuitar : public kit::DeviceBase<acoustic_guitar::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  // 4096 samples hold 24 Hz at 96 kHz: below the lowest note at every rate.
  static constexpr int kStringSize = 4096;
  static constexpr int kBodyModes = 8;

  enum Type : int { kSteel = 0, kNylon = 1, kTwelve = 2 };

  // The body: the air mode, the main top-plate mode, and six more for the
  // box. The two low ones are measured figures for guitars in general; the
  // rest, and every Q, are choices.
  static constexpr float kBodyHz[kBodyModes] = {100.0f, 200.0f, 283.0f, 372.0f, 441.0f, 553.0f, 728.0f, 1010.0f};
  static constexpr float kBodyQ[kBodyModes] = {14.0f, 18.0f, 16.0f, 14.0f, 14.0f, 12.0f, 12.0f, 10.0f};
  static constexpr float kBodyGain[kBodyModes] = {1.0f, 0.9f, 0.5f, 0.45f, 0.4f, 0.35f, 0.3f, 0.25f};
  // Where each mode sits between left (-1) and right (1); the low two are centred.
  static constexpr float kBodyPan[kBodyModes] = {0.0f, 0.0f, -0.5f, 0.5f, -0.6f, 0.6f, -0.7f, 0.7f};

  // Seconds for a held note at `hz` to fall 60 dB, before the two loops
  // share it out.
  static float ring_seconds(float hz, float sustain, int type) {
    const float by_pitch = kit::clamp(std::sqrt(kReferenceHz / hz), 0.25f, 1.3f);
    return sustain * by_pitch * kTypeRing[type];
  }

  // How close `hz` is to the body's air or top mode: 1 on a mode, falling to
  // nothing two semitones away.
  static float bridge_coupling(float hz) {
    float nearest = 0.0f;
    for (int m = 0; m < 2; ++m) {
      const float semitones = 12.0f * std::log2(hz / kBodyHz[m]);
      nearest = kit::max(nearest, std::exp(-0.5f * semitones * semitones));
    }
    return nearest;
  }

  void init(float sample_rate) {
    using namespace acoustic_guitar;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.clear();
      voice.string[0].reset();
      voice.string[1].reset();
    }
    noise_.seed(0x51C0FFEEu);
    human_.seed(0x0AC057A7u);
    for (int c = 0; c < 3; ++c) {
      dc_[c].reset();
      dc_[c].set_cutoff(kDcHz, sr);
    }
    for (int m = 0; m < kBodyModes; ++m) {
      body_[m].reset();
      body_[m].set(kBodyHz[m], kBodyQ[m], sr);
      kit::pan_gains(kBodyPan[m], &body_left_[m], &body_right_[m]);
      // Unity for a centred mode.
      body_left_[m] *= kBodyGain[m] * kSqrtTwo;
      body_right_[m] *= kBodyGain[m] * kSqrtTwo;
    }
    for (int stage = 0; stage < 2; ++stage) {
      knock_[stage].reset();
      knock_[stage].set_cutoff(kKnockHz, sr);
    }
    knock_pulse_ = 0.0f;
    for (int c = 0; c < 2; ++c) {
      low_[c].reset();
      low_[c].set_cutoff(kDirectHz, sr);
    }
    shelf_[0].reset();
    shelf_[1].reset();
    shelf_db_ = 1.0e9f;  // not set yet
    tone_.set_time(0.02f, sr / static_cast<float>(kControlPeriod));
    amount_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    follow_coeff_ = kit::time_to_coeff(0.03f, sr);
    group_open_ = false;
    group_age_ = 0;
    group_window_ = seconds_to_samples(kGroupSeconds, sr);
    group_started_ = 0;
    group_serial_ = 0;
    rank_pass_ = 0;
    clock_.reset(kControlPeriod);
    // Nothing outlives the strings but the body modes (a few tenths of a second).
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace acoustic_guitar;
    if (!(frequency == frequency)) return;  // NaN
    const float sr = sample_rate();
    frequency = kit::clamp(frequency, kLowestHz, kit::min(kHighestHz, 0.1f * sr));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    // One string per pitch. A pluck of this pitch that is still waiting
    // gives way to the new one; a string of this pitch that is ringing is
    // stopped by a finger, and the new pluck waits until it is.
    int wait = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& other = pool_.voices[v];
      if (other.waiting && same_pitch(other.next_hz, frequency)) {
        other.waiting = false;
        other.release_pending = false;
      }
      if (other.sounding && same_pitch(other.hz, frequency)) {
        other.choke(seconds_to_samples(kRestrikeSeconds, sr));
        wait = wait > other.choke_left ? wait : other.choke_left;
      }
    }

    bool stolen = false;  // not needed: only a voice that still sounds has anything to fade
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (voice.sounding) {
      // What it was playing fades before its strings are reused.
      const int steal = seconds_to_samples(kStealSeconds, sr);
      voice.choke(steal);
      wait = wait > voice.choke_left ? wait : voice.choke_left;
    }
    voice.waiting = true;
    voice.release_pending = false;
    voice.next_hz = frequency;
    voice.next_gain = gain;

    // Strum: the notes of a chord, low to high, a fifth of the Strum time
    // apart, so six strings take the time on the knob.
    if (!group_open_) {
      group_open_ = true;
      group_age_ = 0;
      ++group_serial_;
      group_started_ = 0;
    }
    voice.group = group_serial_;
    voice.ready = group_age_ + wait;
    const float step = param(kStrum) * 0.001f * sr / 5.0f;
    int rank = group_started_;
    float below = 0.0f;
    for (;;) {
      // The lowest waiting note of the group above the last one ranked.
      Voice* next = nullptr;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& candidate = pool_.voices[v];
        if (!candidate.waiting || candidate.group != group_serial_ || candidate.ranked == rank_pass_) continue;
        if (candidate.next_hz < below) continue;
        if (next == nullptr || candidate.next_hz < next->next_hz) next = &candidate;
      }
      if (next == nullptr) break;
      next->ranked = rank_pass_;
      below = next->next_hz;
      const int at = static_cast<int>(static_cast<float>(rank) * step);
      next->countdown = (at > next->ready ? at : next->ready) - group_age_;
      ++rank;
    }
    ++rank_pass_;
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.waiting) {
      voice.release_pending = true;  // it is plucked first, then damped
    } else {
      voice.release(param(acoustic_guitar::kRelease), sample_rate());
    }
  }

  void process(int frames) {
    using namespace acoustic_guitar;
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      group_open_ = false;
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control(sr);
      if (group_open_ && ++group_age_ > group_window_) group_open_ = false;

      float left = 0.0f, right = 0.0f, mono = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.active()) continue;
        if (voice.waiting && --voice.countdown < 0) pluck(voice, sr);
        if (!voice.sounding) continue;
        const float out = voice.render(noise_, follow_coeff_);
        mono += out;
        left += out * voice.pan_left;
        right += out * voice.pan_right;
      }
      left = dc_[0].process(left);
      right = dc_[1].process(right);
      mono = dc_[2].process(mono);

      // The body: every mode hears all the strings and the knock.
      const float pulse = knock_[1].lowpass(knock_[0].lowpass(knock_pulse_));
      knock_pulse_ = 0.0f;
      const float struck = mono + pulse;
      float box_left = 0.0f, box_right = 0.0f;
      for (int m = 0; m < kBodyModes; ++m) {
        const float ring = body_[m].bandpass(struck);
        box_left += ring * body_left_[m];
        box_right += ring * body_right_[m];
      }
      // The box takes the place of the string's own low end: what is left of
      // the direct sound below a few hundred hertz is what the modes do not carry.
      const float amount = amount_.next();
      const float cut = kDirectCut * amount;
      left -= cut * low_[0].lowpass(left);
      right -= cut * low_[1].lowpass(right);
      const float volume = volume_.next() * kVoiceGain;
      left = shelf_[0].process(left + box_left * amount);
      right = shelf_[1].process(right + box_right * amount);
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  using String = kit::PluckedString<kStringSize>;

  static constexpr float kSqrtTwo = 1.41421356f;
  static constexpr int kControlPeriod = 32;
  static constexpr float kReferenceHz = 110.0f;
  static constexpr float kLowestHz = 30.0f;
  static constexpr float kHighestHz = 4200.0f;
  static constexpr float kDcHz = 20.0f;
  // Per type: Steel, Nylon, Twelve string.
  static constexpr float kTypeRing[3] = {1.0f, 0.7f, 0.9f};
  // How much sooner high partials die: a partial at frequency f rings
  // (f / f0)^-k as long as the note. Nylon's internal damping is the larger.
  static constexpr float kTypeDamping[3] = {0.45f, 1.0f, 0.45f};
  static constexpr float kHighHz = 3000.0f;
  // Inharmonicity B of the string (0 leaves the partials harmonic).
  static constexpr float kTypeStiffness[3] = {8.0e-5f, 0.0f, 8.0e-5f};
  static constexpr int kStiffStages = 2;
  // The low-pass on the pluck, Nail 0 to Nail 1, and how much brighter a
  // steel string is plucked than a nylon one. A soft pluck is darker.
  static constexpr float kFleshHz = 650.0f;
  static constexpr float kPickHz = 11000.0f;
  static constexpr float kTypePluck[3] = {1.5f, 1.0f, 1.6f};
  // The two polarisations: level and share of the ring time.
  static constexpr float kLevelA = 0.75f;
  static constexpr float kLevelB = 0.25f;
  static constexpr float kRingA = 0.75f;
  static constexpr float kRingB = 1.5f;
  static constexpr float kBridgeLoss = 0.4f;
  // Twelve string: both strings of a course at the same level, the thin
  // octave string dying sooner. Courses are octaves below B3.
  static constexpr float kCourseLevel = 0.5f;
  static constexpr float kOctaveRing = 0.7f;
  static constexpr float kOctaveBelowHz = 240.0f;
  // The body knock: a one-sample pulse this many times a full pluck's
  // level, through two low-passes, into the modes.
  static constexpr float kKnockLevel = 150.0f;
  static constexpr float kKnockHz = 150.0f;
  // How much of the direct string's low end the full body takes away, and
  // below where.
  static constexpr float kDirectCut = 0.85f;
  static constexpr float kDirectHz = 700.0f;
  static constexpr float kToneLowDb = -12.0f;
  static constexpr float kToneHighDb = 8.0f;
  static constexpr float kToneHz = 3000.0f;
  static constexpr float kRestrikeSeconds = 0.008f;
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kGroupSeconds = 0.01f;
  // A quarter tone either side counts as the same string.
  static constexpr float kSamePitchLow = 0.9715f;
  static constexpr float kSamePitchHigh = 1.0293f;
  static constexpr float kSilence = 1.0e-5f;
  // One note at gain 0.8 peaks near -19 dBFS at the default volume, and ten
  // of them stay under the soft clip's knee.
  static constexpr float kVoiceGain = 0.18f;

  static bool same_pitch(float hz, float other_hz) {
    const float ratio = hz / other_hz;
    return ratio > kSamePitchLow && ratio < kSamePitchHigh;
  }

  static int seconds_to_samples(float seconds, float sample_rate) {
    const int samples = static_cast<int>(seconds * sample_rate);
    return samples < 1 ? 1 : samples;
  }

  struct Voice {
    String string[2];
    kit::PluckExciter exciter[2];
    float loop_level[2] = {0.0f, 0.0f};
    float hz = 0.0f;
    float pan_left = 1.0f, pan_right = 1.0f;  // unity in the centre
    // The note waiting to be plucked.
    bool waiting = false;
    bool release_pending = false;
    float next_hz = 0.0f, next_gain = 0.0f;
    int countdown = 0;
    int ready = 0;  // the moment in its chord before which it cannot be plucked
    uint32_t group = 0;
    uint32_t ranked = 0xFFFFFFFFu;
    // The note that sounds.
    bool sounding = false;
    bool released = false;
    float fade = 1.0f, fade_coeff = 1.0f;
    float damp = 0.0f, damp_a = 0.0f;
    float choke_gain = 1.0f, choke_step = 0.0f;
    int choke_left = 0;
    float follower = 0.0f;
    float last = 0.0f;

    bool active() const { return waiting || sounding; }
    bool releasing() const { return !waiting && (released || choke_left > 0); }
    float level_now() const { return follower * fade * choke_gain; }
    // A note still waiting to be plucked is the last one to steal.
    float level() const { return waiting ? 1.0f : level_now(); }

    // Everything but the strings' own state.
    void clear() {
      exciter[0].stop();
      exciter[1].stop();
      loop_level[0] = loop_level[1] = 0.0f;
      hz = 0.0f;
      pan_left = pan_right = 1.0f;
      waiting = false;
      release_pending = false;
      next_hz = next_gain = 0.0f;
      countdown = 0;
      ready = 0;
      group = 0;
      ranked = 0xFFFFFFFFu;
      stop();
    }

    void stop() {
      sounding = false;
      released = false;
      fade = 1.0f;
      fade_coeff = 1.0f;
      damp = 0.0f;
      damp_a = 0.0f;
      choke_gain = 1.0f;
      choke_step = 0.0f;
      choke_left = 0;
      follower = 0.0f;
      last = 0.0f;
    }

    // Key up: fade over `seconds` (to -60 dB), the highs first.
    void release(float seconds, float sample_rate) {
      if (!sounding || released) return;
      released = true;
      fade_coeff = std::exp(-6.907755f / kit::max(1.0f, seconds * sample_rate));
      damp = last;
      damp_a = 0.0f;
    }

    // A fast linear fade to nothing in `samples`; a shorter one already
    // running is left alone.
    void choke(int samples) {
      if (!sounding) return;
      if (choke_left > 0 && choke_left <= samples) return;
      choke_left = samples;
      choke_step = choke_gain / static_cast<float>(samples);
    }

    // One sample of the two loops, with the voice's fades on.
    float render(kit::Rng& noise, float follow_coeff) {
      float out = loop_level[0] * string[0].tick(exciter[0].next(noise)) +
                  loop_level[1] * string[1].tick(exciter[1].next(noise));
      const float magnitude = out < 0.0f ? -out : out;
      follower = magnitude > follower ? magnitude : flush_denormal(follower * follow_coeff);
      if (released) {
        fade *= fade_coeff;
        damp = flush_denormal(out + (damp - out) * damp_a);
        out = damp;
      }
      last = out;
      if (choke_left > 0) {
        choke_gain -= choke_step;
        if (--choke_left == 0) choke_gain = 0.0f;
      }
      const bool plucking = exciter[0].active() || exciter[1].active();
      if (choke_gain <= 0.0f || (!plucking && level_now() < kSilence)) {
        stop();
        return 0.0f;
      }
      return out * fade * choke_gain;
    }
  };

  // The countdown has ended: clear the strings and pluck the waiting note.
  void pluck(Voice& voice, float sr) {
    using namespace acoustic_guitar;
    voice.waiting = false;
    const bool release_now = voice.release_pending;
    voice.release_pending = false;
    voice.stop();
    voice.sounding = true;
    if (voice.group == group_serial_) ++group_started_;

    const float hz = voice.next_hz;
    const float gain = voice.next_gain;
    voice.hz = hz;
    const int type = kit::clamp_int(static_cast<int>(param(kType) + 0.5f), 0, 2);
    const float shimmer = param(kShimmer);

    // The two loops: where each is tuned, how loud it is, how long it rings.
    const float ring = ring_seconds(hz, param(kSustain), type);
    const float coupled = 1.0f - kBridgeLoss * bridge_coupling(hz);
    float loop_hz[2], loop_ring[2];
    if (type == kTwelve) {
      const bool octave = hz < kOctaveBelowHz;
      voice.loop_level[0] = kCourseLevel;
      voice.loop_level[1] = kCourseLevel;
      // An octave course beats where the low string's second partial meets
      // the high string, so the low string moves half as far.
      loop_hz[0] = hz - (octave ? 0.25f : 0.5f) * shimmer;
      loop_hz[1] = (octave ? 2.0f * hz : hz) + 0.5f * shimmer;
      loop_ring[0] = ring * coupled;
      loop_ring[1] = ring * (octave ? kOctaveRing : 1.0f);
    } else {
      voice.loop_level[0] = kLevelA;
      voice.loop_level[1] = kLevelB;
      loop_hz[0] = hz - kLevelB * shimmer;
      loop_hz[1] = hz + kLevelA * shimmer;
      loop_ring[0] = ring * kRingA * coupled;
      loop_ring[1] = ring * kRingB;
    }

    // A hand never plucks twice alike.
    const float strength = (0.2f + 0.8f * gain * std::sqrt(gain)) * (1.0f + 0.08f * human_.bipolar());
    const float nail = param(kNail);
    const float pick_hz = kFleshHz * std::pow(kPickHz / kFleshHz, nail) * kTypePluck[type] * (0.35f + 0.85f * gain) *
                          (1.0f + 0.08f * human_.bipolar());
    const float position = param(kPosition) * (1.0f + 0.02f * human_.bipolar());
    const float click = nail * nail * (0.3f + 0.4f * gain);

    for (int s = 0; s < 2; ++s) {
      String& string = voice.string[s];
      string.reset();
      // The loop takes its high decay at 3 kHz, or an octave above a note
      // that is higher than that. Set before the pitch, so the loop is
      // worked out once.
      const float high_hz = kit::max(kHighHz, 2.0f * loop_hz[s]);
      const float high_ring = ring * std::pow(high_hz / loop_hz[s], -kTypeDamping[type]);
      string.set_decay(loop_ring[s], high_ring, high_hz);
      string.set_stiffness(kTypeStiffness[type], kStiffStages);
      string.set_frequency(loop_hz[s], sr);
      string.set_pluck_position(position);
      voice.exciter[s].stop();
      // Never duller than the note itself, or the top notes would not speak.
      voice.exciter[s].strike(strength, loop_hz[s], kit::max(pick_hz, 2.0f * loop_hz[s]), click, sr);
    }

    // Low strings a little to the left, high ones to the right.
    const float place = kit::clamp((kit::hz_to_midi(hz) - 60.0f) * (1.0f / 30.0f), -1.0f, 1.0f);
    kit::pan_gains(0.35f * place, &voice.pan_left, &voice.pan_right);
    voice.pan_left *= kSqrtTwo;
    voice.pan_right *= kSqrtTwo;

    // A one-sample pulse: scaled by the rate so the thump is the same at any.
    knock_pulse_ += kKnockLevel * strength * sr * (1.0f / 48000.0f);
    if (release_now) voice.release(param(kRelease), sr);
  }

  // Every 32 samples: the tone shelf and the release damping of each voice.
  void control(float sr) {
    const float db = kit::lerp(kToneLowDb, kToneHighDb, tone_.next());
    if (db != shelf_db_) {
      shelf_db_ = db;
      shelf_[0].set_high_shelf(kToneHz, db, sr);
      shelf_[1].set_high_shelf(kToneHz, db, sr);
    }
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || !voice.released) continue;
      // The low-pass closes as the note fades: wide open at key-up, a few
      // hundred hertz by the time the note is 30 dB down.
      const float cutoff = kit::max(120.0f, 0.4f * sr * voice.fade * std::sqrt(voice.fade));
      voice.damp_a = std::exp(-kit::kTwoPi * kit::min(cutoff, 0.4f * sr) / sr);
    }
  }

  void apply(int id) {
    using namespace acoustic_guitar;
    const float value = param(id);
    switch (id) {
      case kBody:
        amount_.set(value, primed());
        break;
      case kTone:
        tone_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read when a note is plucked or released
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Rng noise_, human_;
  kit::DcBlocker dc_[3];  // left, right, and the sum the body hears
  kit::Svf body_[kBodyModes];
  float body_left_[kBodyModes] = {};
  float body_right_[kBodyModes] = {};
  kit::OnePole knock_[2];
  kit::OnePole low_[2];
  float knock_pulse_ = 0.0f;
  kit::Biquad shelf_[2];
  float shelf_db_ = 1.0e9f;
  kit::Smoother tone_, amount_, volume_;
  float follow_coeff_ = 0.0f;
  // The chord being strummed: notes that arrive within 10 ms of its first.
  bool group_open_ = false;
  int group_age_ = 0;
  int group_window_ = 480;
  int group_started_ = 0;
  uint32_t group_serial_ = 0;
  uint32_t rank_pass_ = 0;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
};

}  // namespace livemix
