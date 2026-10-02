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
//   and its edges as wide as the fingertip; for the hammer, a half-sine
//   blow with its reflection from the near end and a second, softer bounce.
// - `chord` lays open strings over two octaves above the key; `strum` is
//   the time the hand takes to cross them, and `roll` goes on striking them
//   one after another while the key is down.
// - Twelve sympathetic strings, one per pitch class in two whole-tone rows
//   (A2 B2 C#3 D#3 F3 G3 and A#3 C4 D4 E4 F#4 G#4, so no two lie a semitone
//   apart), are driven by the bridge and never damped. They are fixed
//   rather than retuned to what is played: a string only takes up what
//   falls on its own partials, so whatever the key, the ones that ring are
//   the ones in tune with it, and nothing glides.
// - The body is four resonances and two shelves per channel, a little
//   apart left and right; changing it crossfades.
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
    together_ = 0;
    chunk_left_ = 0;
    now_ = 0.0;
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
      float knock_left[kChunk] = {}, knock_right[kChunk] = {};
      for (Voice& voice : voices_) {
        if (voice.sounding) render_voice(voice, n, left, right, bridge, knock_left, knock_right);
      }
      render_sympathetic(n, left, right, bridge);
      finish_chunk(left, right, knock_left, knock_right, n, done);
      chunk_left_ -= n;
      done += n;
      now_ += n;
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
    float wait = 0.0f;       // samples before it lands (the hand's spread over keys pressed together)
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
    double origin = 0.0;      // when the string's first blow began, samples
    float ring = 0.0f;        // the ring time the loop gains are set for
    float key_scale = 1.0f;   // low strings ring longer
    float follow = 0.0f, chunk_peak = 0.0f;
    float fade = 1.0f;
    float second = 0.0f;      // share of the blow the second string takes
    float left[2] = {0.0f, 0.0f}, right[2] = {0.0f, 0.0f};
    float absorb = 1.0f;      // what the string keeps under a new blow
    int absorb_left = 0;      // samples of that still to pass
    float absorb_now = 1.0f;  // what it keeps at this moment: eases to `absorb` and back to all
    float absorb_slew = 0.0f; // how far that moves every four samples
    int absorb_pos = 0;       // samples since the blow asked for it
    // The touch: the short noise of a finger or pick leaving the string.
    uint32_t touch_seed = 1u;
    int touch_wait = 0;        // samples before it begins
    float touch_gain = 0.0f;   // level; 0 when there is none
    float touch_slow = 0.0f, touch_fast = 0.0f;         // its envelope is their difference
    float touch_slow_step = 0.0f, touch_fast_step = 0.0f;
    float touch_cut = 0.0f, touch_floor = 0.0f;         // low-pass and high-pass coefficients
    float touch_lp1 = 0.0f, touch_lp2 = 0.0f, touch_low = 0.0f;
    int roll_turn = 0;
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
    voice.origin = 0.0;
    voice.hz = voice.ring = voice.follow = voice.chunk_peak = voice.second = 0.0f;
    voice.key_scale = 1.0f;
    voice.fade = 1.0f;
    voice.absorb = 1.0f;
    voice.absorb_left = 0;
    voice.absorb_now = 1.0f;
    voice.absorb_slew = 0.0f;
    voice.absorb_pos = 0;
    voice.touch_seed = 1u;
    voice.touch_wait = 0;
    voice.touch_gain = voice.touch_slow = voice.touch_fast = 0.0f;
    voice.touch_slow_step = voice.touch_fast_step = voice.touch_cut = voice.touch_floor = 0.0f;
    voice.touch_lp1 = voice.touch_lp2 = voice.touch_low = 0.0f;
    voice.roll_turn = 0;
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
  static constexpr float kRollLevel = 0.9f;
  static constexpr float kRollLevelSpread = 0.1f;
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

  // Strings that are asked for in the same instant (keys pressed together,
  // a chord with no strum) are not plucked in the same sample: no hand does
  // that, and their first edges would pile into one tall spike. Each takes
  // its turn within a few milliseconds, which the ear still hears as together.
  static constexpr int kHandTurns = 8;
  static constexpr float kHandSeconds[kHandTurns] = {0.0f,     0.0019f,  0.0009f, 0.0028f,
                                                     0.00045f, 0.00235f, 0.0014f, 0.0033f};

  // Strum and roll, once per control period.
  void play_keys() {
    using namespace zither;
    const float sr = sample_rate();
    together_ = 0;
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
    // A strum shares the hand's force between its strings; a stroke of the
    // roll lands on one string at a time and keeps more of it.
    const float share = std::pow(static_cast<float>(key.count), soft ? -0.15f : -0.35f);
    const float touch = soft ? kRollLevel * (1.0f + kRollLevelSpread * rng_.bipolar()) : 1.0f + 0.06f * rng_.bipolar();
    blow.level = kit::clamp(key.velocity * share * touch, 0.0f, 1.0f);
    blow.exciter = choice(kExciter, 3);
    blow.brightness = param(kBrightness);
    blow.position = param(kPosition);
    blow.courses = param(kCourses);
    blow.soft = soft;
    if (!soft) blow.wait = kHandSeconds[together_++ % kHandTurns] * sample_rate();
    const int index = strike(blow);
    Voice& voice = voices_[index];
    if (key.down && !(key.voice[tone] == index && key.generation[tone] == voice.generation)) {
      ++voice.holders;
      key.voice[tone] = index;
      key.generation[tone] = voice.generation;
    }
  }

  // Strings: what a moving string keeps under a new blow, how the ring time
  // leans with pitch, and how long a partial near 3 kHz (higher for the
  // treble strings) rings from Brightness 0 to 1.
  static constexpr float kKeepHammer = 0.45f;
  static constexpr float kRollCeiling = 1.0f;    // the level a roll settles at, in strokes
  static constexpr float kRollLeastKept = 0.35f;
  static constexpr int kRollPhases = 6;
  static constexpr float kRollPhase[kRollPhases] = {0.05f, -0.09f, 0.125f, -0.05f, 0.09f, -0.125f};  // of a period
  static constexpr float kRollSettleSeconds = 0.035f;
  static constexpr float kRingLean = 0.3f;
  static constexpr float kDampHz = 3000.0f;
  static constexpr float kBassLean = 0.55f;  // how closely that follows the pitch below 220 Hz
  static constexpr float kDarkSeconds = 0.25f;
  static constexpr float kBrightSeconds = 12.0f;
  static constexpr float kTopShare = 0.5f;  // the highest partials ring this share of that
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
      start(voice, blow, now_);
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

  // The loss filter: a partial at the reference frequency rings for the
  // time Brightness sets, at any pitch, and the highest partials for a
  // fixed share of that. The shelf follows from the second; the pole is
  // found for the first by bisection (the loss rises with the pole).
  void loss_filter(float hz, float brightness, float* pole, float* shelf) const {
    const float sr = sample_rate();
    // Thinner, shorter treble strings keep their partials further up, and the
    // long, heavy bass strings lose theirs further down: the reference
    // follows the pitch below 220 Hz almost in step, so a low string's upper
    // partials fall two to three times as fast as its fundamental, as they
    // do from the middle of the instrument up.
    const float lean = hz < 220.0f ? std::pow(hz / 220.0f, kBassLean) : std::sqrt(hz / 220.0f);
    const float ref = kit::min(kDampHz * lean, 0.4f * sr);
    const float seconds = kDarkSeconds * std::pow(kBrightSeconds / kDarkSeconds, brightness);
    const float wanted = std::exp(-kSixtyDb / (hz * seconds));  // per period, at the reference
    const float c = std::exp(-kSixtyDb / (hz * seconds * kTopShare));
    const float w = kit::kTwoPi * ref / sr;
    float lo = 0.0f, hi = 0.985f;
    for (int i = 0; i < 20; ++i) {
      const float mid = 0.5f * (lo + hi);
      float gain = 1.0f, lag = 0.0f;
      PlayedString::loss_response(mid, c, w, &gain, &lag);
      if (gain > wanted) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    *pole = 0.5f * (lo + hi);
    *shelf = c;
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
  void start(Voice& voice, const Blow& blow, double when) {
    const float sr = sample_rate();
    voice.hz = blow.hz;
    voice.origin = when + static_cast<double>(blow.wait);
    voice.sounding = true;
    voice.fading = voice.pending = false;
    voice.fade = 1.0f;
    voice.absorb_left = 0;
    voice.absorb_now = 1.0f;
    voice.roll_turn = 0;
    voice.follow = 1.0f;
    voice.chunk_peak = 0.0f;
    voice.two = blow.courses > 0.01f;
    voice.key_scale = kit::clamp(std::pow(220.0f / blow.hz, kRingLean), 0.4f, 1.6f);
    float pole = 0.0f, shelf = 0.0f;
    loss_filter(blow.hz, blow.brightness, &pole, &shelf);
    const float beat = voice.two ? course_beat(blow.hz, blow.courses) : 0.0f;
    voice.strings[0].tune(blow.hz - 0.5f * beat, pole, shelf, sr);
    voice.strings[0].clear();
    if (voice.two) {
      voice.strings[1].tune(blow.hz + 0.5f * beat, pole, shelf, sr);
      voice.strings[1].clear();
    }
    set_ring(voice, ring_time(voice));
    place(voice);
    voice.strikes[0].active = voice.strikes[1].active = false;
    voice.next_strike = 0;
    set_strike(voice, blow, blow.wait);
    set_touch(voice, blow);
  }

  // The touch: a finger or a pick leaving the string makes a short noise of
  // its own beside the pluck, a few milliseconds of it, duller and longer
  // for a fingertip, brighter and shorter for a pick, softer and duller for
  // a soft touch. It is heard directly and knocks on the body (kKnock), but
  // does not go round the string. The hammer has its blow and needs none.
  static constexpr float kTouchFinger = 0.3f, kTouchPick = 0.45f;  // level against the pluck's step
  static constexpr float kFingerCutSoft = 1200.0f, kFingerCutHard = 4800.0f;  // its top, Hz
  static constexpr float kPickCutSoft = 3000.0f, kPickCutHard = 9000.0f;
  static constexpr float kFingerFloorHz = 150.0f, kPickFloorHz = 400.0f;      // and its bottom
  static constexpr float kFingerTouchSeconds = 0.004f, kPickTouchSeconds = 0.0013f;
  static constexpr float kTouchRise = 0.15f;  // of that

  void set_touch(Voice& voice, const Blow& blow) {
    voice.touch_gain = 0.0f;
    if (blow.soft || blow.exciter == kHammer) return;
    const float sr = sample_rate();
    const bool pick = blow.exciter == kPick;
    const float hard = kit::clamp(blow.brightness + 0.35f * (blow.level - 0.6f), 0.0f, 1.0f);
    const float cut = kit::min(pick ? kPickCutSoft * std::pow(kPickCutHard / kPickCutSoft, hard)
                                    : kFingerCutSoft * std::pow(kFingerCutHard / kFingerCutSoft, hard),
                               0.2f * sr);
    const float a = 1.0f - std::exp(-kit::kTwoPi * cut / sr), r = 1.0f - a;
    // What two one-poles in a row leave of white noise: taken out again, so
    // the level is the same at any cut and any sample rate.
    const float kept = a * a * a * a * (1.0f + r * r) / ((1.0f - r * r) * (1.0f - r * r) * (1.0f - r * r));
    const float level = kStringLevel * (0.08f + 0.92f * std::pow(blow.level, 1.5f)) * std::pow(220.0f / voice.hz, kLevelLean);
    voice.touch_gain = level * (pick ? kTouchPick : kTouchFinger) * (0.5f + 0.5f * hard) / std::sqrt(kept);
    const float seconds = (pick ? kPickTouchSeconds : kFingerTouchSeconds) * (1.3f - 0.6f * hard);
    voice.touch_slow_step = std::exp(-1.0f / (seconds * sr));
    voice.touch_fast_step = std::exp(-1.0f / (kTouchRise * seconds * sr));
    voice.touch_slow = voice.touch_fast = 1.0f;
    voice.touch_cut = a;
    voice.touch_floor = 1.0f - std::exp(-kit::kTwoPi * (pick ? kPickFloorHz : kFingerFloorHz) / sr);
    voice.touch_lp1 = voice.touch_lp2 = voice.touch_low = 0.0f;
    voice.touch_wait = static_cast<int>(blow.wait + 0.5f);
    // Its own noise for every note, and the same again after init().
    voice.touch_seed = voice.stamp * 2654435761u + 0x9E3779B9u;
  }

  void render_touch(Voice& voice, float* out, int n) {
    for (int i = 0; i < n; ++i) {
      out[i] = 0.0f;
      if (voice.touch_gain == 0.0f) continue;
      if (voice.touch_wait > 0) {
        --voice.touch_wait;
        continue;
      }
      voice.touch_seed = voice.touch_seed * 1664525u + 1013904223u;
      const float white = static_cast<float>(voice.touch_seed >> 8) * (2.0f / 16777216.0f) - 1.0f;
      voice.touch_lp1 += voice.touch_cut * (white - voice.touch_lp1);
      voice.touch_lp2 += voice.touch_cut * (voice.touch_lp1 - voice.touch_lp2);
      voice.touch_low += voice.touch_floor * (voice.touch_lp2 - voice.touch_low);
      voice.touch_slow *= voice.touch_slow_step;
      voice.touch_fast *= voice.touch_fast_step;
      out[i] = voice.touch_gain * (voice.touch_slow - voice.touch_fast) * (voice.touch_lp2 - voice.touch_low);
      if (voice.touch_slow < 1.0e-4f) voice.touch_gain = 0.0f;  // it has passed
    }
  }

  // The two strings of a course are tuned this many hertz apart.
  static float course_beat(float hz, float courses) { return courses * (1.2f + 0.0035f * hz); }

  // Where the string sits between the speakers: each pitch has its place,
  // wider toward the treble, and a course lies a little across it.
  void place(Voice& voice) {
    const float note = kit::hz_to_midi(voice.hz);
    const float width = 0.15f + 0.45f * kit::clamp((note - 40.0f) / 44.0f, 0.0f, 1.0f);
    const float pan = width * kit::SineTable::lookup(note * 0.381966f);
    if (voice.two) {
      // The two strings of a low course lie close together: the bass stays in the middle.
      const float split = kCourseSplit * kit::clamp((note - 28.0f) / 36.0f, 0.15f, 1.0f);
      kit::pan_gains(pan - split, &voice.left[0], &voice.right[0]);
      kit::pan_gains(pan + split, &voice.left[1], &voice.right[1]);
      for (int s = 0; s < 2; ++s) {
        voice.left[s] *= kCourseGain;
        voice.right[s] *= kCourseGain;
      }
      voice.second = kCourseSecond;
    } else {
      kit::pan_gains(pan, &voice.left[0], &voice.right[0]);
      voice.left[1] = voice.right[1] = 0.0f;
      voice.second = 0.0f;
    }
  }

  // The string gives way to a blow over a millisecond or two and comes back
  // as gradually: were what comes round cut down from one sample to the
  // next, the cut would stay on the string as an edge, a tick with every
  // stroke. The share kept moves in steps of four samples, counted from the
  // blow, so the result does not depend on how the host cuts its blocks.
  static constexpr float kAbsorbRampSeconds = 0.0015f;
  void begin_absorb(Voice& voice, float keep, float samples) {
    voice.absorb = keep;
    voice.absorb_left = static_cast<int>(samples + 0.5f);
    const float ramp = kit::clamp(kAbsorbRampSeconds * sample_rate(), 4.0f, kit::max(4.0f, samples));
    voice.absorb_slew = kit::max(1.0f - keep, 0.05f) * 4.0f / ramp;
    voice.absorb_pos = 0;
  }

  // A blow on a string that is already moving.
  // - A key struck again (the hammer): the string keeps part of what it had
  //   for the period the blow takes to go round, and the blow lands on that.
  // - A stroke of the roll waits for the wave of the first blow to come
  //   round (less than a period), give or take up to an eighth of it: it
  //   pushes the string the way it is going, so the fundamental steps up
  //   with every stroke while the upper partials meet it in a different
  //   phase each time and glitter. Over the next few hundredths of a second
  //   a string that is by then louder than a stroke and a bit gives the
  //   excess back (the hammer leaving it), so each stroke is heard and the
  //   roll settles at a level, while a slow roll loses nothing.
  void add_blow(Voice& voice, const Blow& blow) {
    const float period = sample_rate() / voice.hz;
    if (!blow.soft) {
      voice.follow = kit::max(voice.follow, 0.1f);
      begin_absorb(voice, kKeepHammer, period);
      set_strike(voice, blow, 0.0f);
      return;
    }
    float wait = period - static_cast<float>(std::fmod(now_ - voice.origin, static_cast<double>(period)));
    // Early or late by up to an eighth of a period, by turns, and never
    // where one of the last few strokes still is: two blows exactly on top
    // of each other would stand out as an accent.
    wait += period * kRollPhase[voice.roll_turn];
    voice.roll_turn = (voice.roll_turn + 1) % kRollPhases;
    if (wait > period) wait -= period;
    // An early turn can fall before now: take the next time round instead,
    // or the blow would begin part way through its edge, as a click.
    if (wait < 0.0f) wait += period;
    const float before = voice.follow;
    const float added = set_strike(voice, blow, wait) * (1.0f + voice.second);
    // What the string gives back: nothing while it is quieter than a
    // stroke and a bit, more the further it is above that.
    const float keep = kit::clamp(kRollCeiling * added / (before + added), kRollLeastKept, 1.0f);
    const float turns = kit::max(2.0f, std::ceil(kRollSettleSeconds * voice.hz));
    begin_absorb(voice, std::pow(keep, 1.0f / turns), wait + turns * period);
    voice.follow = kit::max(voice.follow, added);
  }

  // Exciters. Widths are for a string at 220 Hz, from the softest to the
  // hardest touch, and grow toward the bass by the power given.
  static constexpr float kFingerSoft = 0.0009f, kFingerHard = 0.00004f, kFingerLean = 0.5f;
  static constexpr float kPickSoft = 0.0003f, kPickHard = 0.00006f, kPickLean = 0.25f;
  static constexpr float kHammerSoft = 0.0026f, kHammerHard = 0.00045f, kHammerLean = 0.5f;
  static constexpr float kPickStep = 0.65f;     // the pick's share of pluck: thin
  static constexpr float kPickClick = 0.4f;     // and of click: bright
  static constexpr float kHammerLevel = 0.6f;
  static constexpr float kBounce = 0.28f;       // the hammer's second, softer contact
  static constexpr float kBounceSeconds = 0.011f;
  static constexpr float kLevelLean = 0.12f;

  // Draw the blow for this string and hand it to a free strike slot.
  // Returns roughly the peak it puts on one string.
  float set_strike(Voice& voice, const Blow& blow, float wait) {
    const float sr = sample_rate();
    zither::Strike& strike = voice.strikes[voice.next_strike];
    voice.next_strike = 1 - voice.next_strike;
    strike = zither::Strike();
    const float period = sr / voice.hz;
    const float lean = 220.0f / voice.hz;
    // A harder touch is a narrower one.
    const float hard = kit::clamp(blow.brightness + 0.35f * (blow.level - 0.6f), 0.0f, 1.0f);
    // Neighbouring strings are pulled opposite ways, so the first edges of
    // a handful of strings struck together do not pile up.
    const float way = kit::SineTable::lookup(kit::hz_to_midi(voice.hz) * 0.7548777f) < 0.0f ? -1.0f : 1.0f;
    // Equal string motion is louder to the ear in the treble: lean the
    // level gently toward the bass.
    const float level = way * kStringLevel * (0.08f + 0.92f * std::pow(blow.level, 1.5f)) * std::pow(lean, kLevelLean);
    strike.period = period;
    strike.split = kit::clamp(blow.position, 0.02f, 0.5f) * period;
    if (blow.exciter == kHammer) {
      float width = kHammerSoft * std::pow(kHammerHard / kHammerSoft, hard) * std::pow(lean, kHammerLean) * sr;
      width = kit::clamp(width, 2.5f, 0.35f * period);
      strike.blow = 1.0f / width;
      // Level by the fundamental the blow leaves on the string, eased toward
      // the bass where that would make a tall narrow spike.
      strike.pulse = level * kHammerLevel * std::pow(period / (kit::kPi * width), 0.75f) *
                     kit::clamp(std::pow(lean, -0.25f), 0.7f, 1.5f);
      strike.bounce = strike.pulse * kBounce;
      strike.bounce_at = kBounceSeconds * (1.3f - 0.6f * blow.level) * sr;
      strike.bounce_blow = 1.0f / (1.5f * width);
    } else if (blow.exciter == kPick) {
      float width = kPickSoft * std::pow(kPickHard / kPickSoft, hard) * std::pow(lean, kPickLean) * sr;
      width = kit::clamp(width, 1.5f, 0.3f * period);
      strike.edge = 1.0f / width;
      strike.blow = 1.0f / (2.0f * width);
      strike.step = level * kPickStep;
      strike.pulse = level * kPickClick;
    } else {
      float width = kFingerSoft * std::pow(kFingerHard / kFingerSoft, hard) * std::pow(lean, kFingerLean) * sr;
      width = kit::clamp(width, 1.5f, 0.35f * period);
      strike.edge = 1.0f / width;
      strike.step = level;
    }
    strike.finish_setup();
    strike.t = -wait;
    const float step = strike.step < 0.0f ? -strike.step : strike.step;
    const float pulse = strike.pulse < 0.0f ? -strike.pulse : strike.pulse;
    return step * (1.0f - strike.duty) + pulse;
  }

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

  // Levels: the step a full-velocity pluck puts on a string, and each string
  // of a course against a single one.
  static constexpr float kStringLevel = 0.5f;
  static constexpr float kCourseGain = 0.68f;
  // The second string of a course is plucked a little less than the first,
  // so the pair never beats down to nothing, and lies to the other side.
  static constexpr float kCourseSecond = 0.7f;
  static constexpr float kCourseSplit = 0.4f;

  void render_voice(Voice& voice, int count, float* left, float* right, float* bridge, float* knock_left,
                    float* knock_right) {
    // A string that is fading out ends on its own sample, and the blow that
    // waits for it begins on the next, wherever the host cuts its blocks.
    int n = count;
    if (voice.fading) {
      float fade = voice.fade;
      for (n = 0; n < count && fade > 0.0f; ++n) fade -= fade_step_;
    }
    float in[kChunk];
    bool struck = false;
    for (zither::Strike& strike : voice.strikes) {
      if (!strike.active) continue;
      if (!struck) {
        for (int i = 0; i < n; ++i) in[i] = 0.0f;
        struck = true;
      }
      for (int i = 0; i < n && strike.active; ++i) in[i] += strike.next();
    }
    // Under a new blow the moving string keeps only part of itself: scale
    // what comes round while that lasts, easing in and out (begin_absorb).
    float a[kChunk], b[kChunk];
    const float* drive = struck ? in : nullptr;
    int at = 0;
    while (at < n) {
      int span = n - at;
      float keep = 1.0f;
      if (voice.absorb_left > 0 || voice.absorb_now < 1.0f) {
        if ((voice.absorb_pos & 3) == 0) {
          const float target = voice.absorb_left > 0 ? voice.absorb : 1.0f;
          const float gap = target - voice.absorb_now;
          voice.absorb_now = std::fabs(gap) <= voice.absorb_slew
                                 ? target
                                 : voice.absorb_now + (gap < 0.0f ? -voice.absorb_slew : voice.absorb_slew);
        }
        keep = voice.absorb_now;
        // Level stretches run in one piece; while it moves, four samples at a time.
        const bool level = voice.absorb_left > 0 && keep == voice.absorb;
        span = kit::clamp_int(level ? voice.absorb_left : 4 - (voice.absorb_pos & 3), 1, span);
        voice.absorb_pos += span;
        voice.absorb_left = voice.absorb_left > span ? voice.absorb_left - span : 0;
      }
      const float* source = drive ? drive + at : nullptr;
      voice.strings[0].run(source, 1.0f, keep, a + at, span);
      if (voice.two) voice.strings[1].run(source, voice.second, keep, b + at, span);
      at += span;
    }
    if (!voice.two) {
      for (int i = 0; i < n; ++i) b[i] = 0.0f;
    }
    float touch[kChunk];
    const bool touched = voice.touch_gain != 0.0f;
    if (touched) render_touch(voice, touch, n);
    float peak = voice.chunk_peak;
    if (voice.fading) {
      float fade = voice.fade;
      for (int i = 0; i < n; ++i) {
        fade = kit::max(0.0f, fade - fade_step_);
        const float gain = fade * fade * (3.0f - 2.0f * fade);
        a[i] *= gain;
        b[i] *= gain;
        if (touched) touch[i] *= gain;
      }
      voice.fade = fade;
    }
    if (touched) {
      const float l0 = voice.left[0], r0 = voice.right[0];
      for (int i = 0; i < n; ++i) {
        knock_left[i] += touch[i] * l0;
        knock_right[i] += touch[i] * r0;
      }
    }
    if (voice.two) {
      const float l0 = voice.left[0], l1 = voice.left[1], r0 = voice.right[0], r1 = voice.right[1];
      for (int i = 0; i < n; ++i) {
        const float sum = a[i] + b[i];
        peak = kit::max(peak, std::fabs(sum));
        bridge[i] += sum;
        left[i] += a[i] * l0 + b[i] * l1;
        right[i] += a[i] * r0 + b[i] * r1;
      }
    } else {
      const float l0 = voice.left[0], r0 = voice.right[0];
      for (int i = 0; i < n; ++i) {
        peak = kit::max(peak, std::fabs(a[i]));
        bridge[i] += a[i];
        left[i] += a[i] * l0;
        right[i] += a[i] * r0;
      }
    }
    voice.chunk_peak = peak;
    if (voice.fading && voice.fade <= 0.0f) {
      if (voice.pending) {
        start(voice, voice.pending_blow, now_ + static_cast<double>(n));
        if (n < count) {
          render_voice(voice, count - n, left + n, right + n, bridge + n, knock_left + n, knock_right + n);
        }
      } else {
        voice.sounding = voice.fading = false;
      }
    }
  }

  // Sympathetic strings: every pitch class once, in two whole-tone rows.
  static constexpr float kSympatheticNote[kSympathetic] = {45.0f, 58.0f, 47.0f, 60.0f, 49.0f, 62.0f,
                                                           51.0f, 64.0f, 53.0f, 66.0f, 55.0f, 68.0f};
  static constexpr float kSympatheticSeconds = 9.0f;     // ring of the lowest, at its fundamental
  static constexpr float kSympatheticBrightness = 0.62f;
  static constexpr float kSympatheticGain = 0.0065f;      // bridge to string at Sympathy 1
  static constexpr float kSympatheticHighpass = 140.0f;  // the thump of a blow stays out

  void init_sympathetic(float sr) {
    for (int s = 0; s < kSympathetic; ++s) {
      SympatheticString& string = sympathetic_[s];
      string.reset();
      const float hz = kit::midi_to_hz(kSympatheticNote[s]);
      float pole = 0.0f, shelf = 0.0f;
      loss_filter(hz, kSympatheticBrightness, &pole, &shelf);
      string.tune(hz, pole, shelf, sr);
      string.clear();
      // Low and high strings alternate sides, further out toward the treble.
      const float side = (s & 1) ? 1.0f : -1.0f;
      const float pan = side * (0.25f + 0.04f * static_cast<float>(s));
      kit::pan_gains(pan, &sympathetic_left_[s], &sympathetic_right_[s]);
    }
    sympathetic_left_sum_ = sympathetic_right_sum_ = 0.0f;
    for (int s = 0; s < kSympathetic; ++s) {
      sympathetic_left_sum_ += sympathetic_left_[s];
      sympathetic_right_sum_ += sympathetic_right_[s];
    }
    set_sympathetic_ring(false);
    bridge_highpass_.reset();
    bridge_highpass_.set_cutoff(kSympatheticHighpass, sr);
    coupling_.set_time(kSmoothingSeconds, sr);
    coupling_.snap(0.0f);
    sympathetic_follow_ = sympathetic_peak_ = 0.0f;
    sympathetic_live_ = false;
  }

  void set_sympathetic_ring(bool hurried) {
    for (SympatheticString& string : sympathetic_) {
      string.set_ring(hurried ? kHurrySeconds : kSympatheticSeconds * std::pow(110.0f / string.hz, 0.25f));
    }
    sympathetic_hurried_ = hurried;
  }

  void control_sympathetic() {
    bool playing = false;
    for (const Voice& voice : voices_) playing = playing || voice.sounding;
    sympathetic_follow_ = kit::max(sympathetic_peak_, sympathetic_follow_ * 0.98f);
    sympathetic_peak_ = 0.0f;
    const bool wanted = playing && coupling_.target > 0.0f;
    if (sympathetic_live_ && !wanted && sympathetic_follow_ < kFreeLevel * 0.1f) {
      // Rung out: empty the strings and stop working on them.
      for (SympatheticString& string : sympathetic_) string.clear();
      sympathetic_live_ = false;
      sympathetic_follow_ = 0.0f;
    } else if (wanted) {
      sympathetic_live_ = true;
    }
    if (!sympathetic_live_) return;
    // With nothing left to drive them and nothing left to hear, hurry out.
    const bool hurry = !playing && sympathetic_follow_ < kHurryLevel;
    if (hurry != sympathetic_hurried_) set_sympathetic_ring(hurry);
    for (SympatheticString& string : sympathetic_) string.flush();
  }

  void render_sympathetic(int n, float* left, float* right, const float* bridge) {
    if (!sympathetic_live_) {
      coupling_.snap(coupling_.target);
      for (int i = 0; i < n; ++i) bridge_highpass_.highpass(bridge[i]);
      return;
    }
    float drive[kChunk], out[kChunk], sum_left[kChunk] = {}, sum_right[kChunk] = {};
    for (int i = 0; i < n; ++i) drive[i] = bridge_highpass_.highpass(bridge[i]) * coupling_.next();
    for (int s = 0; s < kSympathetic; ++s) {
      sympathetic_[s].run(drive, 1.0f, 1.0f, out, n);
      const float gl = sympathetic_left_[s], gr = sympathetic_right_[s];
      for (int i = 0; i < n; ++i) {
        sum_left[i] += out[i] * gl;
        sum_right[i] += out[i] * gr;
      }
    }
    // Each string's output carries what drives it: take that out again, so
    // only the ringing is heard.
    float peak = sympathetic_peak_;
    for (int i = 0; i < n; ++i) {
      const float l = sum_left[i] - drive[i] * sympathetic_left_sum_;
      const float r = sum_right[i] - drive[i] * sympathetic_right_sum_;
      peak = kit::max(peak, kit::max(std::fabs(l), std::fabs(r)));
      left[i] += l;
      right[i] += r;
    }
    sympathetic_peak_ = peak;
  }

  // The touch is heard beside the strings and knocks on the body's
  // resonances harder than a string does (a real box answers a knock with
  // far more than four of them).
  static constexpr float kKnock = 3.0f;

  void finish_chunk(const float* left, const float* right, const float* knock_left, const float* knock_right, int n,
                    int at) {
    for (int i = 0; i < n; ++i) {
      float l = rumble_[0].process(left[i] + knock_left[i]);
      float r = rumble_[1].process(right[i] + knock_right[i]);
      body(&l, &r, kKnock * knock_left[i], kKnock * knock_right[i]);
      const float volume = volume_.next() * kOutGain;
      out_left_[at + i] = kit::soft_clip(l * volume);
      out_right_[at + i] = kit::soft_clip(r * volume);
    }
  }

  // Bodies: four resonances beside the direct sound, then a low and a high
  // shelf (first order, a gentle contour). The right channel's resonances sit a few percent off the left's
  // (two places on one soundboard).
  static constexpr int kBodyModes = 4;
  struct BodySpec {
    float hz[kBodyModes], q[kBodyModes], gain[kBodyModes];
    float low_hz, low_db, high_hz, high_db, direct, makeup;
  };
  static constexpr BodySpec kBodies[kNumBodies] = {
      // Harp: a wide warm board, soft on top.
      {{165.0f, 260.0f, 440.0f, 780.0f}, {11.0f, 14.0f, 18.0f, 21.0f}, {0.6f, 0.5f, 0.4f, 0.3f},
       200.0f, 2.0f, 3000.0f, 0.0f, 0.8f, 0.9f},
      // Zither: a shallow box, bright.
      {{210.0f, 345.0f, 590.0f, 1150.0f}, {10.5f, 14.0f, 19.0f, 26.0f}, {0.4f, 0.45f, 0.4f, 0.3f},
       160.0f, -3.0f, 2500.0f, 4.5f, 0.8f, 1.0f},
      // Dulcimer: a ringing trapezoid, brighter still.
      {{185.0f, 300.0f, 520.0f, 930.0f}, {12.5f, 17.5f, 23.5f, 29.5f}, {0.6f, 0.6f, 0.55f, 0.45f},
       180.0f, -2.0f, 2000.0f, 4.0f, 0.65f, 1.25f},
      // Koto: a long hollow body, thin below and nasal.
      {{140.0f, 310.0f, 620.0f, 1350.0f}, {4.0f, 6.5f, 3.5f, 3.0f}, {0.2f, 0.4f, 0.8f, 1.2f},
       250.0f, -7.0f, 4500.0f, 1.0f, 0.5f, 1.2f},
  };
  static constexpr float kBodySkew[kBodyModes] = {1.045f, 0.96f, 1.035f, 0.955f};
  static constexpr float kBodyFadeSeconds = 0.04f;
  static constexpr float kOutGain = 1.7f;

  // One body resonance: a two-pole band-pass, unity at its centre. Its
  // state is flushed on the control clock, not per sample.
  struct Mode {
    float b0 = 0.0f, a1 = 0.0f, a2 = 0.0f, z1 = 0.0f, z2 = 0.0f;

    void set(float hz, float q, float sr) {
      const float w = kit::kTwoPi * kit::clamp(hz, 20.0f, 0.45f * sr) / sr;
      const float alpha = std::sin(w) / (2.0f * q);
      b0 = alpha / (1.0f + alpha);
      a1 = -2.0f * std::cos(w) / (1.0f + alpha);
      a2 = (1.0f - alpha) / (1.0f + alpha);
      z1 = z2 = 0.0f;
    }
    float process(float x) {
      const float y = b0 * x + z1;
      z1 = z2 - a1 * y;
      z2 = -b0 * x - a2 * y;
      return y;
    }
  };

  struct Body {
    Mode mode[2][kBodyModes];
    float low[2] = {0.0f, 0.0f}, high[2] = {0.0f, 0.0f};  // one-pole states of the two shelves
    float low_pole = 0.0f, high_pole = 0.0f, low_gain = 0.0f, high_gain = 0.0f;
    int spec = -1;

    void load(int which, float sr) {
      spec = which;
      const BodySpec& body = kBodies[which];
      for (int c = 0; c < 2; ++c) {
        for (int m = 0; m < kBodyModes; ++m) {
          mode[c][m].set(body.hz[m] * (c == 1 ? kBodySkew[m] : 1.0f), body.q[m], sr);
        }
        low[c] = high[c] = 0.0f;
      }
      low_pole = std::exp(-kit::kTwoPi * body.low_hz / sr);
      high_pole = std::exp(-kit::kTwoPi * kit::min(body.high_hz, 0.45f * sr) / sr);
      low_gain = kit::db_to_gain(body.low_db) - 1.0f;
      high_gain = kit::db_to_gain(body.high_db) - 1.0f;
    }

    // `knock` reaches the resonances only, on top of `x`.
    float process(int c, float x, float knock) {
      const BodySpec& body = kBodies[spec];
      float y = body.direct * x;
      const float drive = x + knock;
      for (int m = 0; m < kBodyModes; ++m) y += body.gain[m] * mode[c][m].process(drive);
      // First-order shelves: what lies under the low corner, and what lies
      // over the high one, scaled and added back.
      low[c] = y + (low[c] - y) * low_pole;
      y += low_gain * low[c];
      high[c] = y + (high[c] - y) * high_pole;
      y += high_gain * (y - high[c]);
      return y * body.makeup;
    }

    void flush() {
      for (int c = 0; c < 2; ++c) {
        for (Mode& filter : mode[c]) {
          filter.z1 = flush_denormal(filter.z1);
          filter.z2 = flush_denormal(filter.z2);
        }
        low[c] = flush_denormal(low[c]);
        high[c] = flush_denormal(high[c]);
      }
    }
  };

  void init_bodies(float sr) {
    body_now_ = 0;
    bodies_[0].load(choice(zither::kBody, kNumBodies), sr);
    bodies_[1].load(bodies_[0].spec, sr);
    body_mix_ = 1.0f;
    body_step_ = 1.0f / (kBodyFadeSeconds * sr);
    for (kit::DcBlocker& blocker : rumble_) {
      blocker.reset();
      blocker.set_cutoff(22.0f, sr);
    }
  }

  // A new Body is loaded beside the old one and faded to.
  void control_body() {
    bodies_[0].flush();
    bodies_[1].flush();
    const int wanted = choice(zither::kBody, kNumBodies);
    if (body_mix_ < 1.0f || wanted == bodies_[body_now_].spec) return;
    body_now_ = 1 - body_now_;
    bodies_[body_now_].load(wanted, sample_rate());
    body_mix_ = 0.0f;
  }

  void body(float* left, float* right, float knock_left, float knock_right) {
    float l = bodies_[body_now_].process(0, *left, knock_left);
    float r = bodies_[body_now_].process(1, *right, knock_right);
    if (body_mix_ < 1.0f) {
      body_mix_ = kit::min(1.0f, body_mix_ + body_step_);
      l = kit::lerp(bodies_[1 - body_now_].process(0, *left, knock_left), l, body_mix_);
      r = kit::lerp(bodies_[1 - body_now_].process(1, *right, knock_right), r, body_mix_);
    }
    *left = l;
    *right = r;
  }

  void apply(int id) {
    using namespace zither;
    const float value = param(id);
    switch (id) {
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      case kSympathy:
        coupling_.set(value * kSympatheticGain, primed());
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
  int together_ = 0;  // blows asked for in this control period so far
  int chunk_left_ = 0;
  double now_ = 0.0;  // samples rendered since init
  float fade_step_ = 0.01f;
  SympatheticString sympathetic_[kSympathetic];
  float sympathetic_left_[kSympathetic] = {}, sympathetic_right_[kSympathetic] = {};
  float sympathetic_left_sum_ = 0.0f, sympathetic_right_sum_ = 0.0f;
  float sympathetic_follow_ = 0.0f, sympathetic_peak_ = 0.0f;
  bool sympathetic_live_ = false, sympathetic_hurried_ = false;
  kit::OnePole bridge_highpass_;
  kit::Smoother coupling_;
  Body bodies_[2];
  int body_now_ = 0;
  float body_mix_ = 1.0f, body_step_ = 0.001f;
  kit::DcBlocker rumble_[2];
  kit::Smoother volume_;
  kit::IdleGate idle_;
};

}  // namespace livemix
