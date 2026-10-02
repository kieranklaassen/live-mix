#pragma once

// Pedal Steel: a pedal and lap steel guitar, played from a keyboard.
//
//   keys ─► legato logic ─► pitch target ─► bend ─┐
//                 shared bar vibrato (one phase) ─┴─► string pitch
//
//   pick ─► string ─► pickup comb ─► swell and pedal ride ─┐   (ten strings)
//                                                          ├─► DC blocker
//   ─► pickup resonance ─► amplifier ─► speaker ─► volume ─► soft clip
//
// - Each voice is one string: the kit's plucked-string loop, read with an
//   interpolator because its pitch moves. Sustain is how long the
//   fundamental rings; the upper partials die in a fifth of that, so a note
//   darkens as it rings.
// - The gesture is the instrument. A note that starts while a neighbour
//   within Range is still held does not pick a string: the nearest held
//   voice bends to it, as when a pedal is pressed under a ringing chord, and
//   the rest of the chord stands still. Letting the new key go while the old
//   one is down bends back. Anything further away, played after the
//   release, or struck together with its neighbour (within 50 ms of that
//   string's pick or of the key that last bent it: a chord) picks a string
//   of its own. A voice remembers the keys that claimed it, newest last; the
//   newest is where it sounds.
// - A bend is two one-pole filters in a row on the pitch in semitones, so it
//   leaves and lands without a corner. Glide is its 10 % to 90 % time.
// - One bar touches every string, so there is one vibrato: one sine and one
//   depth for all voices, never reset by a note. A pick stills the bar and
//   the shake comes back half a second later.
// - The pickup is a second reading point on the string's own delay line a
//   fixed distance from the bridge: the partial with a node there is not
//   heard. A note is played on the highest string of an E9 neck that keeps
//   the bar at the third fret or above, which decides how much of the
//   sounding length the pickup's distance is. A pedal changes tension, not
//   length, so a bend leaves that share alone.
// - The volume pedal sits between pickup and amplifier, per voice: Swell
//   fades the note in after the pick, then the gain goes on rising at seven
//   tenths of the string's decay rate (the foot opening the pedal) until it
//   has given 12 dB.
// - Key up lays a hand on the string: it is damped, highs first, and the
//   voice is free once it has rung out.
// - A voice that is stolen, or whose key is struck again, fades out over a
//   few milliseconds and only then is picked afresh, so no pick lands on top
//   of a ringing string. A key that goes up during that fade is still
//   picked, and damped at once: a struck note always sounds.
//
// Pitch, bend and gain are worked out every 16 samples (32 at 96 kHz) on the
// kit's control clock, and the audio is rendered in runs that end on it, so
// the output does not depend on the host's block size. The string joins the
// pitch steps with its own one-millisecond glide and the pickup tap follows
// with the same.
//
// Pick is read when a string is picked; everything else is live. The
// instrument sleeps when every string has rung out.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "steel_amp.h"

namespace livemix {

class PedalSteel : public kit::DeviceBase<pedal_steel::kNumParams> {
 public:
  static constexpr int kMaxVoices = 10;
  // Keys one voice can answer to at once: the picked one and three bends.
  static constexpr int kMaxKeys = 4;
  using String = kit::PluckedString<4096>;

  // The pickup's distance from the bridge as a share of the sounding length
  // of the string `note` (a MIDI note number) is played on.
  static float pickup_fraction(float note) {
    float open = kOpenStrings[0];
    for (float string : kOpenStrings) {
      if (string <= note - kLowestFret) open = string;
    }
    const float fret = kit::max(note - open, kLowestFret);
    return kit::min(kPickupOpen * kit::semitones_to_ratio(fret), 0.45f);
  }

  void init(float sample_rate) {
    using namespace pedal_steel;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.string.reset();
      voice.pick.stop();
      voice.rng.seed(0x57EE1u + 7919u * static_cast<uint32_t>(v));
      voice.stop();
    }
    amp_.init(sr);
    dc_.reset();
    dc_.set_cutoff(20.0f, sr);
    clock_.reset(sr > 60000.0f ? 32 : 16);
    tick_seconds_ = static_cast<float>(clock_.period) / sr;
    glide_coeff_ = 1.0f - kit::time_to_coeff(0.001f, sr);
    follow_coeff_ = kit::time_to_coeff(0.05f, sr);
    vibrato_rise_ = 1.0f - kit::time_to_coeff(kVibratoRiseSeconds, 1.0f / tick_seconds_);
    vibrato_fall_ = 1.0f - kit::time_to_coeff(kVibratoFallSeconds, 1.0f / tick_seconds_);
    rest_bar();
    tone_.set_time(0.02f, 1.0f / tick_seconds_);
    depth_.set_time(0.02f, 1.0f / tick_seconds_);
    volume_.set_time(kSmoothingSeconds, sr);
    // Nothing outlives the strings but the speaker filters.
    idle_.reset(sr, 0.1f);
    chord_samples_ = static_cast<int>(kChordSeconds * sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    amp_.set_tone(tone_.value);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    const float note = kit::hz_to_midi(kit::clamp(frequency, kMinHz, kMaxHz));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    // The same key again: its own string is picked again.
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.state == Voice::kHeld && voice.key_index(note_id) >= 0) {
        repick(voice, note_id, note, gain, kRestrikeSeconds);
        return;
      }
    }

    // A neighbour of a held note: that voice bends to it, and nothing is picked.
    const float range = param(pedal_steel::kRange);
    if (range >= kNearest) {
      Voice* nearest = nullptr;
      float distance = range + kRangeSlack;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        // A string picked or bent a moment ago is part of the chord being
        // struck, not a note to bend away from.
        if (voice.state != Voice::kHeld || voice.key_count == 0 || voice.waiting || voice.age < chord_samples_) {
          continue;
        }
        const float apart = std::fabs(note - voice.target);
        if (apart < kNearest || apart > distance) continue;
        // Between two voices as near as each other the lower one is raised:
        // most pedals pull a string up.
        if (nearest && apart > distance - 0.01f && voice.target > note) continue;
        nearest = &voice;
        distance = apart;
      }
      if (nearest) {
        nearest->push_key(note_id, note);
        return;
      }
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      repick(voice, note_id, note, gain, kStealSeconds);
    } else {
      voice.hold(note_id, note, gain);
      pick(voice);
    }
  }

  void note_off(int note_id) {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.state != Voice::kHeld) continue;
      const int index = voice.key_index(note_id);
      if (index < 0) continue;
      voice.drop_key(index);
      if (voice.key_count > 0) return;  // an older key still holds it: bend back
      // Let go before its pick: it is picked all the same, then released.
      if (!voice.waiting) release(voice);
      return;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      // Knobs turned while asleep are where they are when it wakes.
      tone_.snap(tone_.target);
      depth_.snap(depth_.target);
      volume_.snap(volume_.target);
      // The bar rests too, so what it plays next does not depend on how
      // long it slept.
      clock_.counter = 0;
      rest_bar();
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    int done = 0;
    while (done < frames) {
      // One run: from here to the control clock's next tick or the block's end.
      if (clock_.counter == 0) control();
      const int run = kit::clamp_int(clock_.period - clock_.counter, 1, frames - done);
      clock_.counter += run;
      if (clock_.counter >= clock_.period) clock_.counter = 0;

      float strings[kMaxRun];
      for (int i = 0; i < run; ++i) strings[i] = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].state != Voice::kIdle) render(pool_.voices[v], strings, run);
      }
      for (int i = 0; i < run; ++i) {
        const float amplified = amp_.process(dc_.process(strings[i] * kVoiceGain));
        const float out = kit::soft_clip(amplified * volume_.next());
        out_left_[done + i] = out;
        out_right_[done + i] = out;
      }
      done += run;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kMaxRun = 32;
  static constexpr int kOldSamples = 1 << 22;
  static constexpr float kMinHz = 27.5f;
  static constexpr float kMaxHz = 4186.0f;
  // The E9 neck's ten open strings, low to high, as MIDI notes: B2 D3 E3 F#3
  // G#3 B3 D#4 E4 F#4 G#4.
  static constexpr float kOpenStrings[10] = {47.0f, 50.0f, 52.0f, 54.0f, 56.0f, 59.0f, 63.0f, 64.0f, 66.0f, 68.0f};
  // The bar is not played below the third fret (a choice: open strings
  // cannot be shaken, and players sit higher up the neck).
  static constexpr float kLowestFret = 3.0f;
  // The pickup sits 1/15 of the open string from the bridge (a choice: about
  // 41 mm on a 610 mm scale).
  static constexpr float kPickupOpen = 1.0f / 15.0f;
  // The pickup's output is not quite linear in the string's swing: a little
  // second harmonic, more on hard picks.
  static constexpr float kPickupCurve = 0.03f;
  // High partials: their decay time at 3 kHz as a share of the fundamental's.
  static constexpr float kHighHz = 3000.0f;
  static constexpr float kHighShare = 0.22f;
  static constexpr float kMinHighSeconds = 0.3f;
  // A hand laid on the string at key up.
  static constexpr float kReleaseSeconds = 0.6f;
  static constexpr float kReleaseHighSeconds = 0.12f;
  // The foot opening the pedal: the share of the string's decay it makes
  // good, and where it runs out (+12 dB).
  static constexpr float kRideShare = 0.7f;
  static constexpr float kRideMax = 3.981f;
  // A raised cosine covers 10 % to 90 % in this share of its length.
  static constexpr float kSwellShare = 0.5903f;
  static constexpr float kNoSwell = 0.001f;
  // Two one-poles in a row cover 10 % to 90 % in this many time constants.
  static constexpr float kBendShare = 3.358f;
  // The nearest note that bends (closer is the same note picked again), and
  // how far past Range a note may sit and still bend.
  static constexpr float kNearest = 0.5f;
  static constexpr float kRangeSlack = 0.25f;
  // Keys that land within this long of a string's pick, or of the key that
  // last bent it, are struck together with it: a chord, each note on its own
  // string (a choice: two fingers are never closer than this by intent, and
  // without it a struck second would be one sliding string).
  static constexpr float kChordSeconds = 0.05f;
  // The bar is stilled by a pick, waits, then shakes again.
  static constexpr float kVibratoWaitSeconds = 0.35f;
  static constexpr float kVibratoRiseSeconds = 0.5f;
  static constexpr float kVibratoFallSeconds = 0.04f;
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kRestrikeSeconds = 0.015f;
  // Pick: from a soft pick a third of the way along the string to a hard one
  // near the bridge. Struck at full strength the soft one's corner is the
  // note's second partial (300 Hz at least), a lighter touch lowers it to a
  // third of that, and it is given a few dB back for what it leaves out.
  static constexpr float kPickNeck = 0.3f;
  static constexpr float kPickBridge = 0.07f;
  static constexpr float kPickSoftHz = 300.0f;
  static constexpr float kPickHardHz = 9000.0f;
  static constexpr float kPickNoise = 0.3f;
  static constexpr float kSoftPickDb = 4.5f;
  // No two picks are alike: this much off in place and in strength.
  static constexpr float kPlaceScatter = 0.03f;
  static constexpr float kLevelScatterDb = 1.0f;
  // A string below this (-140 dB) has rung out.
  static constexpr float kSilence = 1.0e-7f;
  // One note at gain 0.8 peaks near -19 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.16f;

  static float high_seconds(float sustain) { return kit::max(kHighShare * sustain, kMinHighSeconds); }

  struct Voice {
    enum State : int { kIdle = 0, kHeld, kReleased };

    String string;
    kit::PluckExciter pick;
    kit::Rng rng;
    int state = kIdle;
    // The keys holding this voice, oldest first, and the notes they ask for.
    int keys[kMaxKeys] = {};
    float key_note[kMaxKeys] = {};
    int key_count = 0;
    float strike = 0.0f;   // how hard it is (to be) picked, 0..1
    bool waiting = false;  // fading out before its pick
    // Samples since a key last took it, by a pick or a bend (it stops
    // counting after a while).
    int age = 0;
    // Pitch, in MIDI notes.
    float target = 60.0f;
    float bend1 = 60.0f, bend2 = 60.0f;
    float sounding = 60.0f;  // what the string was last tuned to
    // Pickup: its share of the sounding length, and the tap in samples.
    float pickup = 0.1f;
    float tap = 8.0f, tap_target = 8.0f;
    // Volume pedal.
    float swell = 1.0f;  // 0..1 along the fade-in
    float ride = 1.0f;
    float gain = 0.0f, gain_step = 0.0f;
    float fade = 1.0f, fade_step = 0.0f;
    float sustain = 0.0f;  // the decay the string was last given
    float follow = 0.0f;   // the string's level, for stealing and for freeing it

    bool active() const { return state != kIdle; }
    bool releasing() const { return state == kReleased; }
    float level() const { return follow; }

    int key_index(int key) const {
      for (int k = 0; k < key_count; ++k) {
        if (keys[k] == key) return k;
      }
      return -1;
    }

    // Held by one key and nothing else.
    void hold(int key, float note, float gain) {
      state = kHeld;
      keys[0] = key;
      key_note[0] = note;
      key_count = 1;
      target = note;
      strike = gain;
    }

    // One more key claims the voice: it bends there. A full hand drops its
    // oldest key.
    void push_key(int key, float note) {
      if (key_count == kMaxKeys) drop_key(0);
      keys[key_count] = key;
      key_note[key_count] = note;
      ++key_count;
      target = note;
      age = 0;
    }

    void drop_key(int index) {
      for (int k = index; k + 1 < key_count; ++k) {
        keys[k] = keys[k + 1];
        key_note[k] = key_note[k + 1];
      }
      --key_count;
      if (key_count > 0) target = key_note[key_count - 1];
    }

    void stop() {
      state = kIdle;
      key_count = 0;
      waiting = false;
      gain = 0.0f;
      gain_step = 0.0f;
      fade = 1.0f;
      fade_step = 0.0f;
      follow = 0.0f;
    }
  };

  // The bar at rest: no shake, and its phase back at the start.
  void rest_bar() {
    vibrato_phase_ = 0.0f;
    vibrato_depth_ = 0.0f;
    vibrato_wait_ = 0.0f;
    vibrato_cents_ = 0.0f;
  }

  // A hand laid on the string: damped, highs first.
  void release(Voice& voice) {
    voice.state = Voice::kReleased;
    voice.string.set_decay(kReleaseSeconds, kReleaseHighSeconds, kHighHz);
  }

  // Fades what the voice is playing over `seconds`, then picks `note` on it.
  void repick(Voice& voice, int key, float note, float gain, float seconds) {
    voice.hold(key, note, gain);
    voice.waiting = true;
    voice.gain_step = 0.0f;
    voice.fade_step = kit::max(voice.fade_step, 1.0f / (seconds * sample_rate()));
  }

  // Picks the voice's string at its target note.
  void pick(Voice& voice) {
    using namespace pedal_steel;
    const float sr = sample_rate();
    const float hardness = param(kPick);
    const float place = kit::lerp(kPickNeck, kPickBridge, hardness) * (1.0f + kPlaceScatter * voice.rng.bipolar());
    // A soft pick leaves less on the string: make most of it good, so Pick
    // changes the colour and not the level.
    const float soft = 1.0f - hardness;
    const float level = (0.2f + 0.8f * voice.strike) *
                        kit::db_to_gain(kSoftPickDb * soft * soft + kLevelScatterDb * voice.rng.bipolar());

    voice.bend1 = voice.bend2 = voice.target;
    voice.sounding = voice.target + 0.01f * vibrato_cents_;
    const float hz = kit::midi_to_hz(voice.sounding);
    // The softest pick, struck hard, still lets the note's first partials
    // through; a soft touch lowers the corner, so it is darker and not only
    // quieter.
    const float soft_hz = kit::max(kPickSoftHz, 2.0f * hz);
    const float pick_hz =
        soft_hz * std::pow(kit::max(kPickHardHz / soft_hz, 1.0f), hardness) * (0.35f + 0.65f * voice.strike);
    voice.string.reset();
    voice.string.set_tuning(String::Tuning::Interpolated);
    voice.sustain = param(kSustain);
    voice.string.set_decay(voice.sustain, high_seconds(voice.sustain), kHighHz);
    voice.string.set_frequency(hz, sr);
    voice.string.set_pluck_position(place);
    voice.pick.stop();
    voice.pick.strike(level, hz, pick_hz, kPickNoise * hardness, sr);
    voice.pickup = pickup_fraction(voice.target);
    voice.tap = voice.tap_target = voice.pickup * voice.string.period();

    voice.swell = param(kSwell) > kNoSwell ? 0.0f : 1.0f;
    voice.ride = 1.0f;
    voice.gain = voice.swell;
    voice.gain_step = 0.0f;
    voice.fade = 1.0f;
    voice.fade_step = 0.0f;
    voice.waiting = false;
    voice.age = 0;
    voice.follow = level;
    vibrato_wait_ = kVibratoWaitSeconds;
  }

  // `count` samples of one voice, added to `out`.
  void render(Voice& voice, float* out, int count) {
    for (int i = 0; i < count; ++i) {
      if (voice.fade_step > 0.0f) {
        voice.fade -= voice.fade_step;
        if (voice.fade <= 0.0f) {
          if (!voice.waiting) {
            voice.stop();
            return;
          }
          pick(voice);
          if (voice.key_count == 0) release(voice);  // its key went up during the fade
        }
      }
      const float direct = voice.string.tick(voice.pick.next(voice.rng));
      voice.tap += (voice.tap_target - voice.tap) * glide_coeff_;
      float heard = direct - voice.string.tap(voice.tap);
      heard += kPickupCurve * heard * heard;
      const float size = std::fabs(direct);
      voice.follow = size > voice.follow ? size : voice.follow * follow_coeff_;
      voice.gain += voice.gain_step;
      out[i] += heard * voice.gain * voice.fade;
    }
    if (voice.age < kOldSamples) voice.age += count;
  }

  // Every tick of the control clock: the bar, then each voice's pitch,
  // decay and pedal.
  void control() {
    using namespace pedal_steel;
    const float sr = sample_rate();
    amp_.set_tone(tone_.next());

    vibrato_phase_ += param(kRate) * tick_seconds_;
    if (vibrato_phase_ >= 1.0f) vibrato_phase_ -= 1.0f;
    float shake = 1.0f;
    if (vibrato_wait_ > 0.0f) {
      vibrato_wait_ -= tick_seconds_;
      shake = 0.0f;
    }
    vibrato_depth_ += (shake - vibrato_depth_) * (shake > vibrato_depth_ ? vibrato_rise_ : vibrato_fall_);
    if (vibrato_depth_ < 1.0e-6f) vibrato_depth_ = 0.0f;
    vibrato_cents_ = depth_.next() * vibrato_depth_ * kit::SineTable::lookup(vibrato_phase_);

    const float sustain = param(kSustain);
    const float bend = 1.0f - std::exp(-tick_seconds_ * kBendShare / (0.001f * param(kGlide)));
    const float swell = param(kSwell);
    const float swell_step = swell > kNoSwell ? tick_seconds_ * kSwellShare / swell : 1.0f;
    // 60 / sustain dB a second is what the string loses.
    const float ride_step = std::pow(10.0f, kRideShare * 3.0f * tick_seconds_ / sustain);
    const float per_sample = 1.0f / static_cast<float>(clock_.period);

    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      // A voice waiting for its pick is only fading: leave it as it is.
      if (voice.state == Voice::kIdle || voice.waiting) continue;
      if (!voice.pick.active() && voice.follow < kSilence) {
        voice.stop();
        continue;
      }

      voice.bend1 += (voice.target - voice.bend1) * bend;
      voice.bend2 += (voice.bend1 - voice.bend2) * bend;
      if (std::fabs(voice.target - voice.bend2) < 1.0e-4f) voice.bend1 = voice.bend2 = voice.target;
      const float sounding = voice.bend2 + 0.01f * vibrato_cents_;
      if (sounding != voice.sounding) {
        voice.sounding = sounding;
        voice.string.set_frequency(kit::midi_to_hz(sounding), sr);
        voice.tap_target = voice.pickup * voice.string.period();
      }
      if (voice.state == Voice::kHeld && voice.sustain != sustain) {
        voice.sustain = sustain;
        voice.string.set_decay(sustain, high_seconds(sustain), kHighHz);
      }

      voice.swell = kit::min(1.0f, voice.swell + swell_step);
      voice.ride = kit::min(kRideMax, voice.ride * ride_step);
      const float wanted = (0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * voice.swell)) * voice.ride;
      voice.gain_step = (wanted - voice.gain) * per_sample;
    }
  }

  void apply(int id) {
    using namespace pedal_steel;
    const float value = param(id);
    switch (id) {
      case kVibrato:
        depth_.set(value, primed());
        break;
      case kTone:
        tone_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock or when a string is picked
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  pedal_steel::SteelAmp amp_;
  kit::DcBlocker dc_;
  kit::Smoother tone_, depth_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  int chord_samples_ = 0;
  float tick_seconds_ = 0.0f;
  float glide_coeff_ = 1.0f;
  float follow_coeff_ = 0.0f;
  float vibrato_rise_ = 0.0f, vibrato_fall_ = 0.0f;
  float vibrato_phase_ = 0.0f;
  float vibrato_depth_ = 0.0f;  // 0..1: how much of Vibrato the bar is giving
  float vibrato_wait_ = 0.0f;
  float vibrato_cents_ = 0.0f;
};

}  // namespace livemix
