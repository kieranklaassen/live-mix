#pragma once

// Guitar: a clean electric guitar.
//
//   per note (up to 12):
//     pluck ─► string, polarisation A (heard most, dies sooner) ─┐
//           └► string, polarisation B (quieter, rings longest) ──┤
//                                                                ▼
//     pickup: each string minus itself a little earlier ─► pickup curve ─► swell
//
//   all notes ─► DC blocker ─► pickup resonance (Tone) ─► amplifier (Warmth)
//             ─► mid scoop ─► speaker ─► volume ─► soft clip ─► out (mono)
//
// - A note is one of six strings, stopped at the lowest fret that reaches it
//   (notes under the low E lengthen that string, as a baritone does). The
//   string decides how stiff the note is and how soon its top dies; the fret
//   decides where the pickup and the pick sit on what is left of the string.
// - The pickup is fixed to the body. It hears the string's velocity at one
//   point, so a partial with a node there is missing: the output is the
//   string minus the string a fraction q of a period ago, and q is the
//   pickup's distance from the bridge over the sounding length. q grows by a
//   semitone's ratio with every fret, which is why no two notes have the
//   same colour and why no fixed equaliser sounds like a pickup. Past the
//   middle of the string the comb folds back on itself (sin(n·π·q) does).
// - The pick stays over the body too: Position is a fraction of the open
//   string and is scaled by the fret in the same way.
// - Each note is two loops of kit::PluckedString, tuned half the Shimmer rate
//   below and above the note. The first is the motion the pickup hears most
//   and it dies in a little over half the time; the second is quieter and
//   rings for the whole Sustain time. Together they give a note that falls
//   quickly at first, then slowly, and beats against itself as it goes.
// - Sustain is the time the tail takes to fall 60 dB at 110 Hz. Higher notes
//   ring for less (sustain_seconds), and within a note the partials near
//   3 kHz ring for a small fraction of the fundamental's time (less still on
//   the wound strings), so every note darkens as it dies. Towards the top of
//   the neck that fraction grows: the loop's one low-pass cannot take the
//   top of a high note away much faster than the note itself.
// - A key struck again, or a new key at a pitch that is still ringing, picks
//   the same string: its output is faded over a few milliseconds (the pick
//   landing on the moving string), the string is stopped and plucked afresh.
//   A stolen string goes the same way, faster. Nothing is ever doubled.
// - Key up lays a finger on the string: over about 10 ms its decay times are
//   walked down to a fraction of a second, the top going first. It is the
//   loop that is damped, not the output that is faded.
// - Strum waits a few milliseconds for the rest of a chord, sorts what came
//   by pitch and picks the strings a fifth of the Strum time apart. A chord
//   that still rings is strummed a few milliseconds later, so that its old
//   notes have faded as each string is reached. At zero nothing waits.
// - Swell is a volume pedal per note: a smooth fade-in after the string, so
//   the pick is hidden and the string is already ringing when it arrives.
// - The pickup curve adds a little second harmonic to hard notes (the flux
//   is not linear in where the string is). After the sum come the pickup's
//   resonant low-pass against the cable, a soft amplifier stage with room
//   for a chord (two notes at once mix 50 dB under themselves at the default
//   Warmth), the mid scoop of a tone stack, and a speaker that passes little
//   under 85 Hz and nearly nothing over 5 kHz.
// - A plucked string is mostly attack: the pick's spike stands 15 to 20 dB
//   over the body of the note, as it does on a real clean guitar, and where
//   the pick and the pickup sit decides how tall it is. The level trim keeps
//   the body of a note as loud from bridge to neck; the peak is not held.
//
// Position, Hardness, Swell and Strum are read when a string is picked;
// Sustain and Shimmer reach ringing notes on the control clock; the rest are
// smoothed, and one moved in silence has arrived by the next note. Each
// strike varies the pick's place, weight and edge a little from a seeded
// generator, so repeated notes are not copies and two inits still render the
// same. The instrument sleeps when no string sounds.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Guitar : public kit::DeviceBase<guitar::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kStrings = 6;
  // E1 fits at 96 kHz.
  using String = kit::PluckedString<4096>;

  // Open strings, low E to high E.
  static constexpr float kOpenHz[kStrings] = {82.407f, 110.0f, 146.832f, 195.998f, 246.942f, 329.628f};
  // The pickup's distance from the bridge over the open string: 42 mm and
  // 162 mm on a 648 mm scale.
  static constexpr float kBridgePickup = 0.065f;
  static constexpr float kNeckPickup = 0.25f;
  // Decay times are set at the fundamental and at this frequency.
  static constexpr float kHighHz = 3000.0f;

  // The string a note is played on: the highest one whose open pitch is not
  // above it.
  static int string_for(float hz) {
    int string = 0;
    for (int s = 1; s < kStrings; ++s) {
      if (hz >= kOpenHz[s] * 0.999f) string = s;
    }
    return string;
  }
  // Sounding length of the open string over that of the note: 2^(fret / 12).
  static float fret_ratio(float hz) { return hz / kOpenHz[string_for(hz)]; }

  // Where a pickup at `open_fraction` of the open string sits on a note's
  // sounding length, folded about the middle of the string. The floor keeps
  // the top frets, where the pickup is nearly under the finger, from fading.
  static float pickup_fraction(float open_fraction, float ratio) {
    float q = open_fraction * ratio;
    if (q > 0.5f) q = kit::max(1.0f - q, kFoldFloor);
    return kit::max(q, 0.01f);
  }
  static float pickup_open_fraction(float pickup) { return kit::lerp(kBridgePickup, kNeckPickup, pickup); }
  static float pick_fraction(float position, float ratio) { return kit::clamp(position * ratio, 0.02f, 0.5f); }

  // Seconds for the tail of a held note at `hz` to fall 60 dB.
  static float sustain_seconds(float hz, float sustain) {
    return sustain * kit::clamp(std::sqrt(110.0f / hz), 0.2f, 1.4f);
  }
  // Inharmonicity of the note's string at its fret: it rises as the string
  // shortens.
  static float stiffness(float hz) {
    const float ratio = fret_ratio(hz);
    return kit::min(kStringStiffness[string_for(hz)] * ratio * ratio, 4.0e-4f);
  }

  void init(float sample_rate) {
    using namespace guitar;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int v = 0; v < kMaxVoices; ++v) voices_[v].clear();
    stamp_ = 0;
    group_open_ = false;
    group_age_ = 0;
    gather_samples_ = static_cast<int>(kGatherSeconds * sr);
    vary_.seed(0x0BADC0DEu);
    variation_ = 1.0f;

    dc_.reset();
    dc_.set_cutoff(15.0f, sr);
    resonance_.reset();
    scoop_.reset();
    scoop_.set_peak(480.0f, 0.7f, -4.0f, sr);
    speaker_high_.reset();
    speaker_high_.set_highpass(85.0f, 0.75f, sr);
    presence_.reset();
    presence_.set_peak(2600.0f, 0.9f, 3.0f, sr);
    // Fourth-order Butterworth in two sections.
    speaker_low_[0].reset();
    speaker_low_[0].set_lowpass(5000.0f, 0.5412f, sr);
    speaker_low_[1].reset();
    speaker_low_[1].set_lowpass(5000.0f, 1.3066f, sr);

    const int period = kit::clamp_int(static_cast<int>(32.0f * sr / 48000.0f + 0.5f), 8, 128);
    clock_.reset(period);
    pickup_.set_time(0.02f, sr);
    tone_.set_time(0.02f, sr / static_cast<float>(period));
    drive_.set_time(kSmoothingSeconds, sr);
    makeup_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    trim_rate_ = 1.0f - kit::time_to_coeff(0.01f, sr);
    level_decay_ = kit::time_to_coeff(0.05f, sr);
    sustain_applied_ = param(kSustain);
    shimmer_applied_ = param(kShimmer);
    trimmed_pickup_ = -1.0f;
    // A strum's gaps are spent with a string waiting, which counts as sound.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // How much each strike differs from the last, 0 to 1. Not a parameter: at
  // 0 every pluck is exact, which is what a harness needs to measure a comb
  // null. init() sets it back to 1.
  void set_variation(float amount) { variation_ = kit::clamp(amount, 0.0f, 1.0f); }

  void note_on(int note_id, float frequency, float gain) {
    using namespace guitar;
    if (!(frequency == frequency)) return;  // NaN
    const float sr = sample_rate();
    // The string core plays up to an eighth of the sample rate; a little
    // under it leaves room for the two polarisations either side of the note.
    frequency = kit::clamp(frequency, kLowestHz, kit::min(kHighestHz, 0.11f * sr));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    Voice& voice = voices_[choose_voice(note_id, frequency)];
    // The pick lands on a string that is still moving: a little longer for
    // the same note than for a string taken for another.
    const bool same = voice.sounding && same_pitch(voice.hz, frequency);
    voice.fade_step = 1.0f / ((same ? kRepluckSeconds : kStealSeconds) * sr);
    voice.note_id = note_id;
    voice.stamp = ++stamp_;
    voice.on = true;
    voice.held = true;
    voice.pending = true;
    voice.mute_after = false;
    voice.next_hz = frequency;
    voice.next_gain = gain;
    voice.wait = 0;
    voice.gathering = param(kStrum) * 0.001f * sr >= 1.0f;
    if (voice.gathering && !group_open_) {
      group_open_ = true;
      group_age_ = 0;
    }
  }

  void note_off(int note_id) {
    int found = -1;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = voices_[v];
      if (voice.on && voice.held && voice.note_id == note_id) {
        if (found < 0 || voice.stamp > voices_[found].stamp) found = v;
      }
    }
    if (found < 0) return;
    Voice& voice = voices_[found];
    voice.held = false;
    if (voice.pending) {
      voice.mute_after = true;  // let go before it was picked: a muted pluck
    } else {
      begin_damp(voice);
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(any_on())) {
      silence_output(frames);
      return;
    }
    // Nothing is sounding, so a knob moved in the silence has arrived.
    if (was_asleep) arrive();
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();
      if (group_open_ && ++group_age_ >= gather_samples_) close_group();

      const float open_fraction = pickup_.next();
      float sum = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = voices_[v];
        if (voice.on) sum += render(voice, open_fraction);
      }

      float x = resonance_.lowpass(dc_.process(sum) * kAmpGain);
      // The amplifier: one soft stage. Its ceiling falls as it is pushed.
      const float drive = drive_.next();
      x = kit::fast_tanh(x * drive) * makeup_.next();
      x = scoop_.process(x);
      x = presence_.process(speaker_high_.process(x));
      x = speaker_low_[1].process(speaker_low_[0].process(x));
      const float out = kit::soft_clip(x * kOutputGain * volume_.next());
      out_left_[i] = out;
      out_right_[i] = out;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // Inharmonicity B of each open string, and how many allpasses stretch it.
  static constexpr float kStringStiffness[kStrings] = {1.0e-4f, 8.0e-5f, 6.0e-5f, 6.0e-5f, 4.0e-5f, 2.5e-5f};
  static constexpr int kStringStages[kStrings] = {2, 2, 2, 1, 1, 1};
  // Decay time near 3 kHz over the fundamental's: the wound strings are
  // duller at the top.
  static constexpr float kStringHighDecay[kStrings] = {0.045f, 0.050f, 0.055f, 0.080f, 0.090f, 0.100f};
  static constexpr float kShortestHighSeconds = 0.06f;
  // The most of a fundamental's loss that the loop's low-pass may be asked
  // to supply; the rest is the loop gain.
  static constexpr float kFilterShare = 0.6f;
  // The two polarisations: how much of each the pickup hears, and how soon
  // the first dies against the second.
  static constexpr float kFirstLevel = 0.72f;
  static constexpr float kSecondLevel = 0.34f;
  static constexpr float kFirstDecay = 0.55f;
  static constexpr float kFoldFloor = 0.12f;
  // A pickup close to the bridge hears less of the fundamental; this much of
  // the difference is given back (0 none, 1 all).
  static constexpr float kTrimPower = 0.5f;
  // Second-order share of the pickup curve, per unit of string velocity.
  static constexpr float kPickupCurve = 0.07f;
  static constexpr float kResonanceQ = 1.7f;
  // A finger on the string at key up.
  static constexpr float kDampSeconds = 0.14f;
  static constexpr float kDampHighSeconds = 0.035f;
  static constexpr int kDampTicks = 16;
  static constexpr float kRepluckSeconds = 0.008f;
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kGatherSeconds = 0.003f;
  // The share of the swell's length its gain takes from 10 % to 90 %.
  static constexpr float kSwellRise = 0.608f;
  static constexpr float kLowestHz = 24.0f;
  static constexpr float kHighestHz = 4200.0f;
  // String velocity under which a held note is let go, and a damped one ends.
  static constexpr float kFaded = 1.0e-5f;
  static constexpr float kSilence = 3.0e-7f;
  // Levels. A hard note swings about ±1 at the pickup curve; one note sits
  // well under the amplifier's knee and ten at once lean on it; one note at
  // gain 0.8 peaks near -19 dBFS at the default volume.
  static constexpr float kStringGain = 0.15f;
  static constexpr float kAmpGain = 0.40f;
  static constexpr float kOutputGain = 1.15f;
  // High notes have fewer partials under the speaker's roll-off and are
  // given this much back per octave above 110 Hz (as an exponent).
  static constexpr float kPitchTilt = 0.3f;

  struct Voice {
    String a;
    String b;
    kit::PluckExciter exciter;
    kit::Rng scrape;  // the pick's noise, its own for each strike
    int note_id = -1;
    uint32_t stamp = 0;
    bool on = false;        // sounding, or waiting to be picked
    bool sounding = false;  // the strings are running
    bool held = false;
    bool pending = false;     // a strike is on its way
    bool gathering = false;   // waiting for the rest of a strummed chord
    bool mute_after = false;  // released before it was picked
    bool damping = false;
    int wait = 0;  // samples until the pick starts down
    int damp_tick = 0;
    float next_hz = 0.0f;
    float next_gain = 0.0f;
    float hz = 0.0f;
    float ratio = 1.0f;
    int string = 0;
    float first = 0.0f;  // the pickup's ear for each polarisation
    float second = 0.0f;
    float fade = 0.0f;  // 1 while ringing, ramped to 0 under a new pick
    float fade_step = 0.0f;
    float swell = 1.0f;  // progress of the fade-in, 0 to 1
    float swell_step = 0.0f;
    float trim = 1.0f;
    float trim_target = 1.0f;
    float level = 0.0f;

    void clear() {
      a.reset();
      b.reset();
      exciter.stop();
      scrape.seed(1);
      note_id = -1;
      stamp = 0;
      on = sounding = held = pending = gathering = mute_after = damping = false;
      wait = 0;
      damp_tick = 0;
      next_hz = next_gain = 0.0f;
      hz = 0.0f;
      ratio = 1.0f;
      string = 0;
      first = second = 0.0f;
      fade = 0.0f;
      fade_step = 0.0f;
      swell = 1.0f;
      swell_step = 0.0f;
      trim = trim_target = 1.0f;
      level = 0.0f;
    }

    // How loud it is, for stealing.
    float loudness() const { return sounding ? level * fade : 0.0f; }
  };

  static bool same_pitch(float a, float b) { return a > b * 0.997f && a < b * 1.003f; }

  // What a pickup at fraction q does to the fundamental, partly undone.
  static float level_trim(float q) { return std::pow(2.0f * std::sin(kit::kPi * q), -kTrimPower); }

  bool any_on() const {
    for (int v = 0; v < kMaxVoices; ++v) {
      if (voices_[v].on) return true;
    }
    return false;
  }

  // The voice a new note takes: the key's own string if it is held, else a
  // string already at that pitch, else a free one (the longest unused), else
  // the quietest released one, else the quietest of all.
  int choose_voice(int note_id, float hz) const {
    int choice = -1;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = voices_[v];
      if (voice.on && voice.held && voice.note_id == note_id) {
        if (choice < 0 || voice.stamp > voices_[choice].stamp) choice = v;
      }
    }
    if (choice >= 0) return choice;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = voices_[v];
      if (voice.on && same_pitch(voice.pending ? voice.next_hz : voice.hz, hz)) return v;
    }
    for (int v = 0; v < kMaxVoices; ++v) {
      if (!voices_[v].on && (choice < 0 || voices_[v].stamp < voices_[choice].stamp)) choice = v;
    }
    if (choice >= 0) return choice;
    for (int pass = 0; pass < 2 && choice < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0 && voice.held) continue;
        if (choice < 0 || voice.loudness() < voices_[choice].loudness() ||
            (voice.loudness() == voices_[choice].loudness() && voice.stamp < voices_[choice].stamp)) {
          choice = v;
        }
      }
    }
    return choice;
  }

  // The chord is in: lowest string first, a fifth of the Strum time apart.
  // If any of its strings still rings, the whole strum starts late by the
  // time that string takes to fade, so the spacing is kept.
  void close_group() {
    group_open_ = false;
    int order[kMaxVoices];
    int count = 0;
    int lead = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      if (!(voices_[v].pending && voices_[v].gathering)) continue;
      if (voices_[v].sounding && voices_[v].fade > 0.0f) {
        lead = kit::max(lead, static_cast<int>(voices_[v].fade / voices_[v].fade_step + 0.999f));
      }
      int at = count++;
      while (at > 0 && voices_[order[at - 1]].next_hz > voices_[v].next_hz) {
        order[at] = order[at - 1];
        --at;
      }
      order[at] = v;
    }
    const float step = param(guitar::kStrum) * 0.001f * sample_rate() / static_cast<float>(kStrings - 1);
    for (int rank = 0; rank < count; ++rank) {
      Voice& voice = voices_[order[rank]];
      voice.gathering = false;
      voice.wait = lead + static_cast<int>(step * static_cast<float>(rank) + 0.5f);
    }
  }

  // Both polarisations, either side of the note.
  void tune(Voice& voice) {
    const float half = 0.5f * param(guitar::kShimmer);
    const float sr = sample_rate();
    voice.a.set_frequency(voice.hz - half, sr);
    voice.b.set_frequency(voice.hz + half, sr);
  }

  // How long the tail rings at the fundamental and near 3 kHz; the first
  // polarisation takes its share of both.
  void set_ring(Voice& voice, float seconds, float high_seconds) {
    voice.a.set_decay(seconds * kFirstDecay, high_seconds * kFirstDecay, kHighHz);
    voice.b.set_decay(seconds, high_seconds, kHighHz);
  }
  float ring_seconds(const Voice& voice) const { return sustain_seconds(voice.hz, param(guitar::kSustain)); }
  float ring_high_seconds(const Voice& voice) const {
    const float seconds = ring_seconds(voice);
    // The loop's loss filter takes from the fundamental too, by the square of
    // how close the note is to where the high decay is set (the string sets
    // it an octave above a note that is over half kHighHz). Asked for more
    // than a share of the fundamental's own loss, it would take the
    // fundamental down with the top: high notes would die early.
    const float nearness = voice.hz / kit::max(kHighHz, 2.0f * voice.hz);
    const float soonest = seconds * nearness * nearness / kFilterShare;
    return kit::max(kit::max(seconds * kStringHighDecay[voice.string], kShortestHighSeconds), soonest);
  }

  // The pick leaves the string.
  void strike(Voice& voice) {
    using namespace guitar;
    const float sr = sample_rate();
    const float gain = voice.next_gain;
    voice.pending = false;
    voice.hz = voice.next_hz;
    voice.string = string_for(voice.hz);
    voice.ratio = voice.hz / kOpenHz[voice.string];

    // No two strokes are the same: where, how hard, with how much edge, and
    // which way the string is sent.
    const float place = 1.0f + 0.03f * variation_ * vary_.bipolar();
    const float weight = kit::db_to_gain(1.2f * variation_ * vary_.bipolar());
    const float edge = 1.0f + 0.12f * variation_ * vary_.bipolar();
    const float lean = 0.05f * variation_ * vary_.bipolar();

    voice.a.reset();
    voice.b.reset();
    // Settings first: with no pitch yet they are only stored, and the pitch
    // then works the loop out once.
    set_ring(voice, ring_seconds(voice), ring_high_seconds(voice));
    const float b = stiffness(voice.hz);
    voice.a.set_stiffness(b, kStringStages[voice.string]);
    voice.b.set_stiffness(b, kStringStages[voice.string]);
    tune(voice);
    const float position = pick_fraction(param(kPosition) * place, voice.ratio);
    voice.a.set_pluck_position(position);
    voice.b.set_pluck_position(position);

    // A soft stroke is darker, not only quieter.
    const float hardness = param(kHardness);
    const float pick_hz = 300.0f * std::pow(32.0f, hardness) * (0.3f + gain) * edge;
    const float amplitude = (0.25f + 0.75f * gain * std::sqrt(gain)) * weight;
    voice.exciter.strike(amplitude, voice.hz, pick_hz, 0.03f + 0.25f * hardness, sr);
    // The scrape is new with every stroke; with variation off it is the
    // note's own, so the same note is the same sound wherever it is played.
    voice.scrape.seed(static_cast<uint32_t>(voice.hz * 4096.0f) * 2654435761u +
                      (variation_ > 0.0f ? vary_.next_u32() : 0u));

    const float level = kStringGain * kit::clamp(std::pow(voice.hz / 110.0f, kPitchTilt), 0.7f, 2.2f);
    voice.first = (kFirstLevel + lean) * level;
    voice.second = (kSecondLevel - lean) * level;
    // The pickup may still be on its way: the trim starts where it is and
    // ends where it is going.
    voice.trim = level_trim(pickup_fraction(pickup_.value, voice.ratio));
    voice.trim_target = level_trim(pickup_fraction(pickup_.target, voice.ratio));
    voice.fade = 1.0f;
    const float swell = param(kSwell);
    if (swell * sr >= 1.0f) {
      voice.swell = 0.0f;
      voice.swell_step = kSwellRise / (swell * sr);
    } else {
      voice.swell = 1.0f;
    }
    voice.level = 0.0f;
    voice.damping = false;
    voice.damp_tick = 0;
    voice.sounding = true;
    if (voice.mute_after) {
      voice.mute_after = false;
      begin_damp(voice);
    }
  }

  void begin_damp(Voice& voice) {
    if (!voice.sounding || voice.damping) return;
    voice.damping = true;
    voice.damp_tick = 0;
  }

  // One control tick of the finger coming down: the decay times move a step
  // nearer the damped ones, so neither the loop gain nor its length jumps.
  void advance_damp(Voice& voice) {
    if (voice.damp_tick >= kDampTicks) return;
    ++voice.damp_tick;
    const float t = static_cast<float>(voice.damp_tick) / static_cast<float>(kDampTicks);
    const float from = ring_seconds(voice);
    const float from_high = ring_high_seconds(voice);
    const float to = kit::min(from, kDampSeconds);
    const float to_high = kit::min(from_high, kDampHighSeconds);
    set_ring(voice, from * std::pow(to / from, t), from_high * std::pow(to_high / from_high, t));
  }

  void stop(Voice& voice) {
    voice.sounding = false;
    voice.damping = false;
    voice.exciter.stop();
    voice.on = voice.pending;
  }

  // One sample of one note at the pickup.
  float render(Voice& voice, float open_fraction) {
    if (voice.pending && !voice.gathering) {
      // What still rings fades so that it is gone as the pick leaves the
      // string: the fade ends on the note's turn in the strum when there is
      // time for it, and holds the pick back when there is not.
      const bool ringing = voice.sounding && voice.fade > 0.0f;
      if (ringing && static_cast<float>(voice.wait) * voice.fade_step <= voice.fade) {
        voice.fade -= voice.fade_step;
      }
      if (voice.wait > 0) {
        --voice.wait;
      } else if (!voice.sounding || voice.fade <= 0.0f) {
        strike(voice);
      }
    }
    if (!voice.sounding) return 0.0f;

    const float pluck = voice.exciter.active() ? voice.exciter.next(voice.scrape) : 0.0f;
    const float q = pickup_fraction(open_fraction, voice.ratio);
    const float a = voice.a.tick(pluck);
    const float b = voice.b.tick(pluck);
    float x = voice.first * (a - voice.a.tap(q * voice.a.period())) +
              voice.second * (b - voice.b.tap(q * voice.b.period()));
    const float magnitude = x < 0.0f ? -x : x;
    voice.level = magnitude > voice.level ? magnitude : voice.level * level_decay_;
    x += kPickupCurve * x * x;

    voice.trim += (voice.trim_target - voice.trim) * trim_rate_;
    float gain = voice.trim * voice.fade;
    if (voice.swell < 1.0f) {
      voice.swell = kit::min(1.0f, voice.swell + voice.swell_step);
      gain *= voice.swell * voice.swell * (3.0f - 2.0f * voice.swell);
    }
    return x * gain;
  }

  // Every control tick: the tone filter, Sustain and Shimmer for the notes
  // already ringing, fingers coming down, and strings that have died.
  void control() {
    using namespace guitar;
    resonance_.set(tone_.next(), kResonanceQ, sample_rate());
    const bool retime = param(kSustain) != sustain_applied_;
    const bool retune = param(kShimmer) != shimmer_applied_;
    sustain_applied_ = param(kSustain);
    shimmer_applied_ = param(kShimmer);
    const bool retrim = pickup_.target != trimmed_pickup_;
    trimmed_pickup_ = pickup_.target;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = voices_[v];
      if (!voice.sounding) continue;
      if (retrim) voice.trim_target = level_trim(pickup_fraction(pickup_.target, voice.ratio));
      if (voice.damping) {
        advance_damp(voice);
        if (voice.damp_tick >= kDampTicks && voice.level < kSilence) stop(voice);
        continue;
      }
      if (retune) tune(voice);
      if (retime) set_ring(voice, ring_seconds(voice), ring_high_seconds(voice));
      // A held note that has rung out is let go, so its string is free.
      if (voice.level < kFaded && !voice.exciter.active() && !voice.pending) begin_damp(voice);
    }
  }

  void arrive() {
    pickup_.snap(pickup_.target);
    tone_.snap(tone_.target);
    resonance_.set(tone_.target, kResonanceQ, sample_rate());  // not at the next control tick
    drive_.snap(drive_.target);
    makeup_.snap(makeup_.target);
    volume_.snap(volume_.target);
  }

  void apply(int id) {
    using namespace guitar;
    const float value = param(id);
    switch (id) {
      case kPickup:
        pickup_.set(pickup_open_fraction(value), primed());
        break;
      case kTone:
        tone_.set(value, primed());
        break;
      case kWarmth: {
        const float drive = 1.0f + 4.0f * value * value;
        drive_.set(drive, primed());
        // Pushed harder it is louder, by less than it is driven.
        makeup_.set(std::pow(drive, -0.6f), primed());
        break;
      }
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read when a string is picked, or on the control clock
    }
  }

  Voice voices_[kMaxVoices];
  uint32_t stamp_ = 0;
  bool group_open_ = false;
  int group_age_ = 0;
  int gather_samples_ = 1;
  kit::Rng vary_;
  float variation_ = 1.0f;

  kit::DcBlocker dc_;
  kit::Svf resonance_;
  kit::Biquad scoop_;
  kit::Biquad speaker_high_;
  kit::Biquad presence_;
  kit::Biquad speaker_low_[2];
  kit::Smoother pickup_, tone_, drive_, makeup_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float trim_rate_ = 1.0f;
  float level_decay_ = 0.999f;
  float sustain_applied_ = 0.0f;
  float shimmer_applied_ = 0.0f;
  float trimmed_pickup_ = -1.0f;
};

}  // namespace livemix
