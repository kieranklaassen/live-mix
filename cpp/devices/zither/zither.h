#pragma once

// Zither: a box of open strings to pluck, strum and hammer.
//
//   key ─► chord ─► strum / roll ─► strikes ─┐
//                                            ▼
//            strings (one per pitch, each a course of two) ─► pan ──┐
//                          │                                        ├─► body ─► volume ─► out
//                          └─► bridge ─► twelve sympathetic strings ┘
//
// - There is one string per pitch, as on the instrument: a key that asks
//   for a pitch that is already ringing plays that string again. A finger or
//   a pick stops it first (the old string fades over a few milliseconds and
//   a fresh one is plucked); a hammer and every stroke of a roll land on the
//   moving string, which gives up part of its motion to the blow, so a roll
//   builds to a level and stays there.
// - A string is a delay loop with a loss filter (zither_string.h). The blow
//   is a function of time added to the loop: for a pluck, the rectangular
//   wave an ideal pluck sends down the string, its duty set by `position`
//   and its edges as wide as the fingertip; for the hammer, a raised-cosine
//   blow with its reflection from the near end and a second, softer bounce.
// - `chord` lays open strings over two octaves above the key; `strum` is
//   the time the hand takes to cross them, and `roll` goes on striking them
//   one after another while the key is down.
// - Twelve sympathetic strings, one per pitch class and laid out so that
//   neighbours are a major ninth apart (A2 B2 C#3 D#3 F3 G3, then A#3 C4 D4
//   E4 F#4 G#4), are driven by the bridge and never damped. They are fixed
//   rather than retuned to what is played: a string only takes up what
//   falls on its own partials, so whatever the key, the ones that ring are
//   the ones in tune with it, and nothing glides.
// - The body is four resonances and a shelf per channel, a little apart
//   left and right; changing it crossfades.
//
// Brightness, position, courses and the exciter are read when a string is
// struck; decay, release, sympathy, body and volume act on what is ringing.
// The instrument sleeps when every string has rung out below -140 dB.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "zither_string.h"

namespace livemix {

class Zither : public kit::DeviceBase<zither::kNumParams> {
 public:
  static constexpr int kMaxVoices = 24;
  static constexpr int kMaxKeys = 16;
  static constexpr int kMaxTones = 6;
  static constexpr int kSympathetic = 12;
  static constexpr int kNumBodies = 4;
  enum Exciter : int { kFinger = 0, kPick = 1, kHammer = 2 };

  void init(float sample_rate) {
    using namespace zither;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) reset_voice(voice);
    for (Key& key : keys_) key = Key();
    rng_.seed(0x5EED2171u);
    stamp_ = 0;
    flip_ = false;
    chunk_left_ = 0;
    fade_step_ = 1.0f / (kFadeSeconds * sr);
    init_sympathetic(sr);
    init_bodies(sr);
    volume_.set_time(kSmoothingSeconds, sr);
    idle_.reset(sr, 0.3f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxKeyHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    press(note_id, frequency, gain);
  }

  void note_off(int note_id) {
    int found = -1;
    for (int k = 0; k < kMaxKeys; ++k) {
      const Key& key = keys_[k];
      if (key.used && key.down && key.note_id == note_id && (found < 0 || key.stamp > keys_[found].stamp)) {
        found = k;
      }
    }
    if (found >= 0) lift(keys_[found]);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(busy())) {
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
      float left[kChunk] = {}, right[kChunk] = {}, bridge[kChunk] = {};
      for (Voice& voice : voices_) {
        if (voice.sounding) render_voice(voice, n, left, right, bridge);
      }
      render_sympathetic(n, left, right, bridge);
      finish_chunk(left, right, n, done);
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kChunk = 32;  // control period, samples
  static constexpr float kMinHz = 27.5f;
  static constexpr float kMaxKeyHz = 4500.0f;
  static constexpr float kMaxStringHz = 4500.0f;
  static constexpr float kFadeSeconds = 0.005f;
  static constexpr float kSixtyDb = 6.907755279f;

  using PlayedString = zither::StringLoop<4096>;     // 27.5 Hz at 96 kHz is 3491 samples
  using SympatheticString = zither::StringLoop<1024>;  // 110 Hz at 96 kHz is 873 samples

  // What a strike needs to know, fixed when it is asked for.
  struct Blow {
    float hz = 220.0f;
    float level = 0.0f;      // 0..1, from velocity
    int exciter = kFinger;
    float brightness = 0.5f;
    float position = 0.2f;
    float courses = 0.0f;
    bool soft = false;       // a stroke of the roll: lands on the moving string
  };

  // One pitch: a course of one or two strings.
  struct Voice {
    PlayedString strings[2];
    zither::Strike strikes[2];
    Blow pending_blow;
    int next_strike = 0;
    int holders = 0;          // keys that are down on this string
    uint32_t generation = 0;  // counts the notes this voice has played
    uint32_t stamp = 0;
    float hz = 0.0f;
    float ring = 0.0f;        // the ring time the loop gains are set for
    float key_scale = 1.0f;   // low strings ring longer
    float follow = 0.0f, chunk_peak = 0.0f;
    float fade = 1.0f;
    float second = 0.0f;      // share of the blow the second string takes
    float left[2] = {0.0f, 0.0f}, right[2] = {0.0f, 0.0f};
    float absorb = 1.0f;      // what the string keeps under a new blow
    int absorb_left = 0;      // samples of the period still to pass
    bool sounding = false, two = false, fading = false, pending = false;
  };

  // One key that is down, or whose strum is still crossing the strings.
  struct Key {
    int note_id = -1;
    uint32_t stamp = 0;
    float velocity = 0.0f;
    float tones[kMaxTones] = {};
    int voice[kMaxTones] = {};             // the string each tone landed on, or -1
    uint32_t generation[kMaxTones] = {};
    int count = 0;
    int strum_next = 0;                    // strings struck so far
    float strum_wait = 0.0f;               // samples until the next one
    float roll_wait = 0.0f;
    int roll_index = 0, roll_step = 1;
    bool descending = false;
    bool used = false, down = false;
  };

  void reset_voice(Voice& voice) {
    for (PlayedString& string : voice.strings) string.reset();
    for (zither::Strike& strike : voice.strikes) strike = zither::Strike();
    voice.pending_blow = Blow();
    voice.next_strike = 0;
    voice.holders = 0;
    voice.generation = 0;
    voice.stamp = 0;
    voice.hz = voice.ring = voice.follow = voice.chunk_peak = voice.second = 0.0f;
    voice.key_scale = 1.0f;
    voice.fade = 1.0f;
    voice.absorb = 1.0f;
    voice.absorb_left = 0;
    voice.left[0] = voice.left[1] = voice.right[0] = voice.right[1] = 0.0f;
    voice.sounding = voice.two = voice.fading = voice.pending = false;
  }

  // The open strings of each chord, in semitones above the key.
  static constexpr int kNumChords = 8;
  static constexpr int kChordSize[kNumChords] = {1, 2, 5, 6, 6, 6, 6, 6};
  static constexpr int kChordTones[kNumChords][kMaxTones] = {
      {0, 0, 0, 0, 0, 0},      // Single
      {0, 12, 0, 0, 0, 0},     // Octave
      {0, 7, 12, 19, 24, 0},   // Fifth and octave
      {0, 7, 12, 16, 19, 24},  // Major
      {0, 7, 12, 15, 19, 24},  // Minor
      {0, 7, 12, 14, 19, 24},  // Sus 2
      {0, 7, 12, 17, 19, 24},  // Sus 4
      {0, 7, 14, 16, 19, 24},  // Add 9
  };
  // A stroke of the roll against the first blow, and how much it varies.
  static constexpr float kRollLevel = 0.5f;
  static constexpr float kRollLevelSpread = 0.2f;
  static constexpr float kRollTimeSpread = 0.1f;
  static constexpr float kMinRollHz = 2.0f;

  int choice(int id, int count) const {
    return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1);
  }

  void press(int note_id, float hz, float velocity) {
    using namespace zither;
    for (Key& key : keys_) {
      if (key.used && key.down && key.note_id == note_id) lift(key);
    }
    // A free key, else the oldest one whose strum is still running, else the oldest.
    int slot = -1;
    for (int pass = 0; pass < 3 && slot < 0; ++pass) {
      for (int k = 0; k < kMaxKeys; ++k) {
        const Key& key = keys_[k];
        const bool fits = pass == 0 ? !key.used : (pass == 1 ? !key.down : true);
        if (fits && (slot < 0 || key.stamp < keys_[slot].stamp)) slot = k;
      }
    }
    Key& key = keys_[slot];
    if (key.used && key.down) lift(key);
    key = Key();
    key.used = key.down = true;
    key.note_id = note_id;
    key.stamp = ++stamp_;
    key.velocity = velocity;
    const int chord = choice(kChord, kNumChords);
    for (int t = 0; t < kChordSize[chord]; ++t) {
      float tone = hz * kit::semitones_to_ratio(static_cast<float>(kChordTones[chord][t]));
      while (tone > kMaxStringHz) tone *= 0.5f;  // off the top of the instrument: the octave below
      bool twice = false;
      for (int u = 0; u < key.count; ++u) twice = twice || std::fabs(key.tones[u] - tone) < 0.001f * tone;
      if (twice) continue;
      key.tones[key.count] = tone;
      key.voice[key.count] = -1;
      ++key.count;
    }
    const int direction = choice(kDirection, 3);
    key.descending = direction == 1 || (direction == 2 && flip_);
    flip_ = !flip_;
  }

  void lift(Key& key) {
    key.down = false;
    for (int t = 0; t < key.count; ++t) {
      if (key.voice[t] < 0) continue;
      Voice& voice = voices_[key.voice[t]];
      if (voice.generation == key.generation[t] && voice.holders > 0) --voice.holders;
      key.voice[t] = -1;
    }
    if (key.strum_next >= key.count) key.used = false;
  }

  float roll_interval() {
    const float rate = kit::max(param(zither::kRoll), kMinRollHz);
    return sample_rate() / rate * (1.0f + kRollTimeSpread * rng_.bipolar());
  }

  // Strum and roll, once per control period.
  void play_keys() {
    using namespace zither;
    const float sr = sample_rate();
    const bool rolling = param(kRoll) >= 0.5f;
    for (Key& key : keys_) {
      if (!key.used) continue;
      while (key.strum_next < key.count && key.strum_wait <= 0.0f) {
        const int tone = key.descending ? key.count - 1 - key.strum_next : key.strum_next;
        strike_tone(key, tone, false);
        ++key.strum_next;
        key.strum_wait += key.count > 1 ? param(kStrum) * 0.001f * sr / static_cast<float>(key.count - 1) : 0.0f;
        if (key.strum_next == key.count) {
          // The roll goes on from the string the strum began on.
          key.roll_index = key.descending ? key.count - 1 : 0;
          key.roll_step = key.descending ? -1 : 1;
          key.roll_wait = roll_interval();
        }
      }
      if (key.strum_next >= key.count) {
        if (!key.down) {
          key.used = false;
          continue;
        }
        if (!rolling) {
          key.roll_wait = 0.0f;
        } else if (key.roll_wait <= 0.0f) {
          strike_tone(key, key.roll_index, true);
          if (key.count > 1) {
            if (choice(kDirection, 3) == 2) {  // to and fro
              if (key.roll_index + key.roll_step < 0 || key.roll_index + key.roll_step >= key.count) {
                key.roll_step = -key.roll_step;
              }
              key.roll_index += key.roll_step;
            } else {
              key.roll_index = (key.roll_index + key.roll_step + key.count) % key.count;
            }
          }
          key.roll_wait += roll_interval();
        }
        key.roll_wait -= static_cast<float>(kChunk);
      }
      key.strum_wait -= static_cast<float>(kChunk);
    }
  }

  void strike_tone(Key& key, int tone, bool soft) {
    using namespace zither;
    Blow blow;
    blow.hz = key.tones[tone];
    // A chord shares the hand's force between its strings.
    const float share = std::pow(static_cast<float>(key.count), -0.35f);
    const float touch = soft ? kRollLevel * (1.0f + kRollLevelSpread * rng_.bipolar()) : 1.0f + 0.06f * rng_.bipolar();
    blow.level = kit::clamp(key.velocity * share * touch, 0.0f, 1.0f);
    blow.exciter = choice(kExciter, 3);
    blow.brightness = param(kBrightness);
    blow.position = param(kPosition);
    blow.courses = param(kCourses);
    blow.soft = soft;
    const int index = strike(blow);
    Voice& voice = voices_[index];
    if (key.down && !(key.voice[tone] == index && key.generation[tone] == voice.generation)) {
      ++voice.holders;
      key.voice[tone] = index;
      key.generation[tone] = voice.generation;
    }
  }

  // Strings: what a moving string keeps under a new blow, how the ring time
  // leans with pitch, and how long a partial near 3 kHz rings from
  // Brightness 0 to 1.
  static constexpr float kKeepHammer = 0.7f;
  static constexpr float kKeepRollHammer = 0.8f;
  static constexpr float kKeepRollPluck = 0.65f;
  static constexpr float kRingLean = 0.3f;
  static constexpr float kDampHz = 3000.0f;
  static constexpr float kDarkSeconds = 0.12f;
  static constexpr float kBrightSeconds = 5.0f;
  // Release at its top never damps.
  static constexpr float kOpenRelease = 19.5f;
  // A released string that has fallen this far is hurried out.
  static constexpr float kHurryLevel = 1.0e-5f;
  static constexpr float kHurrySeconds = 0.3f;
  static constexpr float kFreeLevel = 1.0e-7f;

  // Put a blow on the string of its pitch; returns the voice.
  int strike(const Blow& blow) {
    const float near = 0.0003f * blow.hz;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = voices_[v];
      if (!voice.sounding) continue;
      if (voice.fading) {
        // About to start on this pitch already: one blow is enough.
        if (voice.pending && std::fabs(voice.pending_blow.hz - blow.hz) < near) {
          if (blow.level > voice.pending_blow.level) voice.pending_blow = blow;
          return v;
        }
        continue;
      }
      if (std::fabs(voice.hz - blow.hz) >= near) continue;
      if (blow.soft || blow.exciter == kHammer) {
        add_blow(voice, blow);
        return v;
      }
      voice.fading = true;  // a finger or pick stops the string before it plucks
      voice.pending = false;
    }
    int found = -1;
    for (int v = 0; v < kMaxVoices && found < 0; ++v) {
      if (!voices_[v].sounding) found = v;
    }
    if (found >= 0) {
      Voice& voice = voices_[found];
      ++voice.generation;
      voice.holders = 0;
      voice.stamp = ++stamp_;
      start(voice, blow);
      return found;
    }
    // Every string is in use: take the quietest released one, else the quietest.
    for (int pass = 0; pass < 3 && found < 0; ++pass) {
      float lowest = 1.0e9f;
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass < 2 && (voice.fading || (pass == 0 && voice.holders > 0))) continue;
        const float level = pass < 2 ? voice.follow : voice.fade;
        if (level < lowest) {
          lowest = level;
          found = v;
        }
      }
    }
    Voice& voice = voices_[found];
    voice.fading = voice.pending = true;
    voice.pending_blow = blow;
    ++voice.generation;
    voice.holders = 0;
    voice.stamp = ++stamp_;
    return found;
  }

  // The loss filter's pole: a partial at the reference frequency rings for
  // the time Brightness sets, at any pitch.
  float loss_pole(float hz, float brightness) const {
    const float sr = sample_rate();
    const float ref = kit::min(kit::max(kDampHz, 3.0f * hz), 0.45f * sr);
    const float seconds = kDarkSeconds * std::pow(kBrightSeconds / kDarkSeconds, brightness);
    const float m = std::exp(-2.0f * kSixtyDb / (hz * seconds));  // per period, squared
    if (1.0f - m < 1.0e-6f) return 0.0f;
    const float b = 1.0f - m * std::cos(kit::kTwoPi * ref / sr);
    const float p = (b - std::sqrt(kit::max(0.0f, b * b - (1.0f - m) * (1.0f - m)))) / (1.0f - m);
    return kit::clamp(p, 0.0f, 0.97f);
  }

  // How long the string should ring now: Decay while a key holds it, the
  // shorter of that and Release once it is let go.
  float ring_time(const Voice& voice) const {
    using namespace zither;
    float seconds = param(kDecay) * voice.key_scale;
    if (voice.holders > 0) return seconds;
    if (param(kRelease) < kOpenRelease) seconds = kit::min(seconds, param(kRelease));
    if (voice.follow < kHurryLevel) seconds = kit::min(seconds, kHurrySeconds);
    return seconds;
  }

  void set_ring(Voice& voice, float seconds) {
    voice.ring = seconds;
    voice.strings[0].set_ring(seconds);
    if (voice.two) voice.strings[1].set_ring(seconds);
  }

  // A fresh string for this blow.
  void start(Voice& voice, const Blow& blow) {
    const float sr = sample_rate();
    voice.hz = blow.hz;
    voice.sounding = true;
    voice.fading = voice.pending = false;
    voice.fade = 1.0f;
    voice.absorb_left = 0;
    voice.follow = 1.0f;
    voice.chunk_peak = 0.0f;
    voice.two = blow.courses > 0.01f;
    voice.key_scale = kit::clamp(std::pow(220.0f / blow.hz, kRingLean), 0.4f, 1.6f);
    const float pole = loss_pole(blow.hz, blow.brightness);
    const float beat = voice.two ? course_beat(blow.hz, blow.courses) : 0.0f;
    voice.strings[0].tune(blow.hz - 0.5f * beat, pole, sr);
    voice.strings[0].clear();
    if (voice.two) {
      voice.strings[1].tune(blow.hz + 0.5f * beat, pole, sr);
      voice.strings[1].clear();
    }
    set_ring(voice, ring_time(voice));
    place(voice);
    voice.strikes[0].active = voice.strikes[1].active = false;
    voice.next_strike = 0;
    set_strike(voice, blow);
  }

  // The two strings of a course are tuned this many hertz apart.
  static float course_beat(float hz, float courses) { return courses * (1.2f + 0.0035f * hz); }

  // Where the string sits between the speakers: each pitch has its place,
  // wider toward the treble, and a course lies a little across it.
  void place(Voice& voice) {
    const float note = kit::hz_to_midi(voice.hz);
    const float width = 0.1f + 0.5f * kit::clamp((note - 40.0f) / 44.0f, 0.0f, 1.0f);
    const float pan = width * kit::SineTable::lookup(note * 0.381966f);
    if (voice.two) {
      kit::pan_gains(pan - 0.12f, &voice.left[0], &voice.right[0]);
      kit::pan_gains(pan + 0.12f, &voice.left[1], &voice.right[1]);
      for (int s = 0; s < 2; ++s) {
        voice.left[s] *= kCourseGain;
        voice.right[s] *= kCourseGain;
      }
      voice.second = 0.9f;
    } else {
      kit::pan_gains(pan, &voice.left[0], &voice.right[0]);
      voice.left[1] = voice.right[1] = 0.0f;
      voice.second = 0.0f;
    }
  }

  // A blow on a string that is already moving.
  void add_blow(Voice& voice, const Blow& blow) {
    voice.absorb = blow.soft ? (blow.exciter == kHammer ? kKeepRollHammer : kKeepRollPluck) : kKeepHammer;
    voice.absorb_left = static_cast<int>(sample_rate() / voice.hz + 0.5f);
    voice.follow = kit::max(voice.follow, 0.1f);
    set_strike(voice, blow);
  }

  // ZITHER_STRIKE

  // Every 32 samples: keys, ring times, freeing.
  void control() {
    play_keys();
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      voice.follow = kit::max(voice.chunk_peak, voice.follow * 0.98f);
      voice.chunk_peak = 0.0f;
      const bool struck = voice.strikes[0].active || voice.strikes[1].active;
      if (!voice.fading && !struck && voice.follow < kFreeLevel) {
        voice.sounding = false;
        continue;
      }
      const float seconds = ring_time(voice);
      if (seconds != voice.ring) set_ring(voice, seconds);
      for (PlayedString& string : voice.strings) string.flush();
    }
    control_sympathetic();
    control_body();
  }

  bool busy() const {
    for (const Voice& voice : voices_) {
      if (voice.sounding) return true;
    }
    for (const Key& key : keys_) {
      if (key.used && (key.strum_next < key.count || (key.down && param(zither::kRoll) >= 0.5f))) return true;
    }
    return false;
  }

  // ZITHER_RENDER

  // ZITHER_BODY

  void apply(int id) {
    using namespace zither;
    const float value = param(id);
    switch (id) {
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read at the strike or on the control clock
    }
  }

  Voice voices_[kMaxVoices];
  Key keys_[kMaxKeys];
  kit::Rng rng_;
  uint32_t stamp_ = 0;
  bool flip_ = false;
  int chunk_left_ = 0;
  float fade_step_ = 0.01f;
  kit::Smoother volume_;
  kit::IdleGate idle_;
};

}  // namespace livemix
