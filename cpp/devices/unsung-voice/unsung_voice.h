#pragma once

// Unsung Voice: where the overtones of the held keys meet, a voice nobody is
// singing.
//
//   per key (12):  40 harmonics ─► body, mouth, tilt ─► three singers ─┐
//                       │  (a harmonic that is in the line steps back)  │
//                       ▼                                               ├─► volume ─► soft clip
//   meetings ─► two lines ─► tones (8): the contributors of one meeting ┘
//               (Lean, Pace)    on one pitch, with one vibrato
//
// - A key is a row of turning numbers (bank.h) whose fundamental never moves.
//   Its three singers are not three rows: a singer a little off the pitch is
//   the same row with harmonic k turned by k times a slow angle, so the
//   section costs one complex gain a harmonic, worked out once a tick.
//   Breath is drawn into the same gains: noise around every harmonic, as
//   strong as the mouth makes it there.
// - The meetings (meetings.h) are found again 20 ms after the last key came
//   or went. A line keeps its meeting if it still stands, else it moves to
//   the nearest one, as a good inner voice does.
// - A tone is the harmonics that meet, taken out of their keys (they step
//   back in the row), put on one pitch, in phase, with their own octave,
//   twelfth and so on (which meet too) as far as Colour says. One vibrato
//   and one glide for all of it is what makes it one voice. Beating lets
//   each contributor back towards where its key has it.
// - Lift turns from keys alone through keys and line to the line alone.
// - Linger says how long a tone of the line rings: short, the line is struck
//   like a bell at every meeting; full, it is sung.
// - Hold says how long the keys themselves last. The line lasts as long as
//   the keys under it are down.
//
// All control runs on a tick of a millisecond that restarts when a key finds
// nothing sounding, so output does not depend on the block size. Asleep when
// the last key has gone.

#include "../../kit/kit.h"
#include "bank.h"
#include "bodies.h"
#include "meetings.h"
#include "params.gen.h"

namespace livemix {

class UnsungVoice : public kit::DeviceBase<unsung_voice::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kHarmonics = 40;
  static constexpr int kModes = 3;
  static constexpr int kTones = 8;
  static constexpr int kMultiples = 8;
  static constexpr int kMaxTick = 200;
  enum Meter : int { kMeterLine = 0, kMeterLineLevel, kMeterSecond, kMeterSecondLevel };

  void init(float sample_rate) {
    using namespace unsung_voice;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tick_ = kit::clamp_int(static_cast<int>(sr / 1000.0f + 0.5f), 8, kMaxTick);
    tick_rate_ = sr / static_cast<float>(tick_);
    dt_ = 1.0f / tick_rate_;
    per_sample_ = 1.0f / static_cast<float>(tick_);
    top_hz_ = kit::min(0.45f * sr, 12000.0f);
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    for (int k = 0; k < kHarmonics; ++k) {
      log2k_[k] = std::log2(static_cast<float>(k + 1));
      voice_share_[k] = static_cast<float>(k + 1) / static_cast<float>(k + 2);
    }
    for (Voice& voice : voices_) voice = Voice();
    for (Tone& tone : tones_) tone = Tone();
    meetings_.clear();
    for (kit::Smoother* knob : knobs()) knob->set_time(kKnobSeconds, tick_rate_);
    volume_.set_time(0.02f, sr);
    stamp_ = 0;
    set_knobs(false);
    restart();
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace unsung_voice;
    if (!store_param(id, value)) return;
    if (id == kTolerance || id == kRegister || id == kPartner) dirty_ = true;
    set_knobs(primed());
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (count_sounding() == 0 && lines_quiet()) restart();

    // Whatever else this id holds is let go; the same pitch is taken up again.
    Voice* same = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.active) continue;
      const float pitch = voice.pending ? voice.next_hz : voice.hz;
      const bool held = !voice.released;
      const bool mine = voice.id == note_id;
      if (!same && pitch == frequency && (!held || mine)) {
        same = &voice;
      } else if (mine && held) {
        let_go(voice);
      }
    }
    if (same) {
      same->id = note_id;
      same->released = false;
      same->stamp_in = ++stamp_;
      if (same->pending) {
        same->next_gain = gain;
      } else if (same->fade_left > 0) {
        // Let go before it was started, and wanted again.
        same->pending = true;
        same->next_hz = frequency;
        same->next_gain = gain;
      } else {
        strike_again(*same, gain);
      }
      return;
    }
    Voice& voice = voices_[pick()];
    const bool taken = voice.active;
    voice.id = note_id;
    voice.released = false;
    voice.stamp_in = ++stamp_;
    if (taken) {
      voice.pending = true;
      voice.next_hz = frequency;
      voice.next_gain = gain;
      voice.loud = kit::max(0.02f, gain);
      if (voice.fade_left == 0) voice.fade_left = kStealTicks;
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (voice.active && !voice.released && voice.id == note_id) let_go(voice);
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(count_sounding() > 0)) {
      set_knobs(false);
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (left_ == 0) {
        control();
        left_ = tick_;
      }
      const int n = kit::clamp_int(frames - done, 1, left_);
      unsung::F4 l[kMaxTick], r[kMaxTick];
      for (int i = 0; i < n; ++i) l[i] = r[i] = unsung::F4{0.0f, 0.0f, 0.0f, 0.0f};
      for (Voice& voice : voices_) {
        if (voice.active && voice.rendering) {
          voice.bank.render(voice.live, n, l, r);
          if (voice.extra_on) voice.extra.render(4, n, l, r);
        }
      }
      for (Tone& tone : tones_) {
        if (tone.active) tone.bank.render(kMultiples, n, l, r);
      }
      for (int i = 0; i < n; ++i) {
        float left = l[i][0] + l[i][1] + l[i][2] + l[i][3];
        float right = r[i][0] + r[i][1] + r[i][2] + r[i][3];
        if (chiff_on_) {
          chiff_ += chiff_step_;
          chiff_filter_.process(noise_.bipolar() * noise_scale_ * chiff_);
          const float hiss = chiff_filter_.band * chiff_filter_.k;
          left += hiss * chiff_left_;
          right += hiss * chiff_right_;
        }
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(left * volume);
        out_right_[done + i] = kit::soft_clip(right * volume);
      }
      left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // Where the two lines stand and how loud they are; 0 with no line.
  float meter(int index) const {
    const Line& line = lines_[index >= kMeterSecond ? 1 : 0];
    if (line.tone < 0 || !tones_[line.tone].active || count_sounding() == 0) return 0.0f;
    const Tone& tone = tones_[line.tone];
    return index == kMeterLine || index == kMeterSecond ? tone.hz : tone.env * tone.gate;
  }

 private:
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kKnobSeconds = 0.015f;
  static constexpr float kLevel = 0.092f;       // one key, gain 1, before Volume (RMS of its row)
  static constexpr float kLineLevel = 0.16f;
  static constexpr float kRoom = 0.5f;         // how far the keys step back round the line
  static constexpr int kStealTicks = 5;         // 4 ms
  static constexpr int kGatherTicks = 20;       // 20 ms from the last key to new meetings
  static constexpr float kSingerCents = 46.0f;  // Closeness 0
  static constexpr float kVibratoCents = 70.0f;
  static constexpr float kDuckSeconds = 0.06f;
  static constexpr float kStepBack = 0.94f;     // how far a harmonic in the line steps back
  static constexpr float kSilence = 1.0e-6f;
  static constexpr int kSlowTicks = 16;
  static constexpr float kOctaveCents = 1731.234f;  // cents in a step, for small steps

  struct Voice {
    unsung::Bank<kHarmonics> bank;
    unsung::Bank<4> extra;  // the modes of a strike, and an octave under
    float soft[kHarmonics] = {}, hard[kHarmonics] = {}, air[kHarmonics] = {};
    float soft_to[kHarmonics] = {}, hard_to[kHarmonics] = {}, air_to[kHarmonics] = {};
    float duck[kHarmonics] = {}, duck_to[kHarmonics] = {};
    float mode[kModes] = {}, mode_keep[kModes] = {}, sub = 0.0f;
    bool extra_on = false;
    int harmonics = 4;
    int body = 0;
    float hz = 220.0f, gain = 0.0f, touch = 0.0f, gain_to = 0.0f, touch_to = 0.0f;
    float play = 0.0f, play_to = 0.0f;  // what the line over it is worth
    float twin = 1.0f, twin_to = 1.0f;  // its share of a pitch several keys hold
    float rise = 0.0f, env = 0.0f, hold = 1.0f, settle = 1.0f;
    bool climbing = false;
    float go_attack = 1.0f, go_release = 0.0f, go_climb = 1.0f, go_hold = 1.0f, go_settle = 0.0f, go_chiff = 0.0f;
    int live = 4;  // harmonics that are heard
    float theta[2] = {}, cents[2] = {};
    kit::Drift drift[3];
    float wander = 0.0f, swell = 1.0f;
    float left[3] = {}, right[3] = {}, part[2] = {1.0f, 1.0f};
    float side = 0.0f;
    float chiff = 0.0f, chiff_to = 0.0f;
    float loud = 0.0f;
    kit::Rng rng;
    int id = -1;
    uint32_t stamp = 0, stamp_in = 0;
    int fade_left = 0;
    float next_hz = 220.0f, next_gain = 0.0f;
    bool active = false, released = false, pending = false, rendering = false;
    bool sings() const { return active && !pending && fade_left == 0; }
  };

  // A tone of a line: the harmonics that meet, on one pitch.
  struct Tone {
    unsung::Bank<kMultiples> bank;
    unsung::Meeting meeting;
    uint32_t stamps[3] = {};
    float theta[3] = {};
    float left[3] = {}, right[3] = {};
    float breath[2 * kMultiples] = {};
    float hz = 440.0f, from = 0.0f, to = 0.0f;  // the last two as octaves (log2 Hz)
    float glide = 1.0f, glide_step = 0.0f;
    float env = 0.0f, rise = 0.1f, shape[kMultiples] = {}, gate = 0.0f, age = 0.0f, force = 1.0f, touch = 0.0f;
    float strain = 0.0f, tremble = 0.0f;
    int line = 0;
    bool active = false, rising = false, leaving = false, fresh = true;
    float leave = 0.99f;
    kit::Rng rng;
  };

  struct Line {
    int tone = -1;
    float wait = 0.0f;
    kit::Rng rng;
    kit::Drift drift;
    float vibrato_phase = 0.0f, vibrato = 0.0f;
  };

  // --- knobs ------------------------------------------------------------------------------

  void set_knobs(bool glide) {
    using namespace unsung_voice;
    vowel_.set(param(kVowel), glide);
    tilt_.set(param(kTilt), glide);
    closeness_.set(param(kCloseness), glide);
    breath_.set(param(kBreath), glide);
    const float lift = param(kLift);
    // The keys alone, the keys with the line over them, the line alone.
    keys_gain_.set(lift <= 0.5f ? 1.0f : kit::db_to_gain(-26.0f * (lift - 0.5f) * 2.0f), glide);
    const float up = kit::min(1.0f, lift * 2.0f);
    const float over = kit::max(0.0f, lift - 0.5f) * 2.0f;  // alone, it is brought up
    line_gain_.set(up <= 0.0f ? 0.0f : kit::db_to_gain(-14.0f * (1.0f - up) + 2.0f * over) * kit::min(1.0f, up * 8.0f), glide);
    second_.set(param(kSecond), glide);
    beating_.set(param(kBeating), glide);
    colour_.set(param(kColour), glide);
    width_.set(param(kWidth), glide);
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
  }

  // The first key after a silence: every clock and every chance starts over.
  void restart() {
    left_ = 0;
    beat_ = 0;
    set_knobs(false);
    tilt_at_ = -99.0f;
    noise_.seed(0x51ed27u);
    chiff_filter_.reset();
    chiff_ = chiff_step_ = chiff_to_ = chiff_side_ = 0.0f;
    chiff_left_ = chiff_right_ = kit::kSqrtHalf;
    chiff_on_ = false;
    for (Tone& tone : tones_) tone.active = false;
    for (int l = 0; l < 2; ++l) {
      Line& line = lines_[l];
      line = Line();
      line.rng.seed(0x2f6e2b1u + 0x9e3779b9u * static_cast<uint32_t>(l));
      line.drift.seed(0x77a1u + static_cast<uint32_t>(l) * 131u);
      line.drift.set_rate(0.31f, tick_rate_);
      line.wait = first_wait(l);
    }
    meetings_.clear();
    dirty_ = false;
    gather_ = 0;
    duck_rate_ = 1.0f - std::exp(-dt_ / kDuckSeconds);
    table_rate_ = 1.0f - std::exp(-dt_ / 0.03f);
    touch_rate_ = 1.0f - std::exp(-dt_ / 0.004f);
    crowd_ = 1.0f;
    crowd_to_ = 0.0f;
    gate_rate_ = 1.0f - std::exp(-dt_ / 0.012f);
    breath_pass_ = 1.0f - std::exp(-kit::kTwoPi * 45.0f * dt_);
    breath_lift_ = 1.0f / std::sqrt(breath_pass_);
    hurry_ = std::exp(-kSixtyDb * dt_ / 0.06f);
    starts_ = 0;
  }

  int count_sounding() const {
    int n = 0;
    for (const Voice& voice : voices_) n += voice.active ? 1 : 0;
    return n;
  }

  // No tone of a line is heard any more: a restart cuts nothing off.
  bool lines_quiet() const {
    if (idle_.asleep()) return true;
    for (const Tone& tone : tones_) {
      if (tone.active && tone.env * tone.gate > 1.0e-5f) return false;
    }
    return true;
  }

  // A free voice, else the quietest let go, else the quietest held.
  int pick() const {
    int best = -1;
    float lowest = 1.0e9f;
    for (int i = 0; i < kMaxVoices; ++i) {
      if (!voices_[i].active) return i;
    }
    for (int pass = 0; pass < 2 && best < 0; ++pass) {
      for (int i = 0; i < kMaxVoices; ++i) {
        const Voice& voice = voices_[i];
        if (pass == 0 && !voice.released) continue;
        if (voice.loud < lowest || (voice.loud == lowest && voice.stamp_in < voices_[best].stamp_in)) {
          lowest = voice.loud;
          best = i;
        }
      }
    }
    return best;
  }

  // --- keys ---------------------------------------------------------------------------------

  void touch(Voice& voice, float gain) {
    // Keys that die at once are struck harder, or they would not be heard.
    const float dying = 1.0f - param(unsung_voice::kHold);
    const float played = (0.3f + 0.7f * gain) * gain;
    voice.play_to = played * (1.0f + 0.35f * dying * dying);
    voice.gain_to = kLevel * played * (1.0f + 0.5f * dying * dying);
    voice.touch_to = gain * std::sqrt(gain);
    voice.loud = kit::max(0.02f, gain);
    voice.climbing = true;
  }

  void start(Voice& voice, float hz, float gain) {
    using namespace unsung_voice;
    voice.active = true;
    voice.rendering = true;
    voice.pending = false;
    voice.fade_left = 0;
    voice.stamp = ++stamp_;
    voice.hz = hz;
    voice.rng.seed(0x9e3779b9u * static_cast<uint32_t>(++starts_) ^ static_cast<uint32_t>(hz * 64.0f));
    voice.body = kit::clamp_int(static_cast<int>(param(kBody) + 0.5f), 0, unsung::kNumBodies - 1);
    voice.rise = voice.env = 0.0f;
    voice.hold = 1.0f;
    voice.settle = 1.0f;
    touch(voice, gain);
    voice.gain = voice.gain_to;
    voice.play = voice.play_to;
    voice.touch = voice.touch_to;
    voice.twin = voice.twin_to = twin_share(hz);
    int count = static_cast<int>(top_hz_ * 0.8f / hz);
    count = (kit::clamp_int(count, 4, kHarmonics) + 3) & ~3;
    voice.harmonics = count;
    const float sr = sample_rate();
    for (int k = 0; k < count; ++k) {
      const float w = kit::min(hz * static_cast<float>(k + 1) / sr, 0.49f) * kit::kTwoPi;
      voice.bank.turn_re[k] = std::cos(w);
      voice.bank.turn_im[k] = std::sin(w);
      // Harmonics start all over the cycle: a row with no spike in it.
      const float at = k == 0 ? -0.25f : voice.rng.uniform();
      voice.bank.re[k] = kit::SineTable::cos_lookup(at);
      voice.bank.im[k] = kit::SineTable::lookup(at);
      voice.duck[k] = voice.duck_to[k] = 1.0f;
    }
    voice.bank.silence(0, kHarmonics);
    voice.extra.silence(0, 4);
    voice.sub = unsung::traits(voice.body).sub;
    for (int m = 0; m < 4; ++m) {
      voice.extra.re[m] = 0.0f;
      voice.extra.im[m] = 1.0f;
    }
    for (float& mode : voice.mode) mode = 0.0f;
    const float under = hz * 0.5f / sr * kit::kTwoPi;
    voice.extra.turn_re[3] = std::cos(under);
    voice.extra.turn_im[3] = std::sin(under);
    // The key that was here before leaves nothing behind.
    for (int k = 0; k < kHarmonics; ++k) voice.soft[k] = voice.hard[k] = voice.air[k] = 0.0f;
    voice.chiff = voice.chiff_to = 0.0f;
    voice.live = count;
    for (int s = 0; s < 2; ++s) {
      voice.theta[s] = voice.rng.uniform();
      voice.drift[s].seed(voice.rng.next_u32());
      voice.drift[s].set_rate(s == 0 ? 0.23f : 0.31f, tick_rate_);
    }
    voice.drift[2].seed(voice.rng.next_u32());
    voice.drift[2].set_rate(0.17f, tick_rate_);
    // Low keys stand near the middle, the others on alternate sides.
    const float far = kit::clamp((std::log2(hz) - 6.5f) * 0.28f, 0.12f, 0.8f);
    voice.side = (starts_ & 1) != 0 ? -far : far;
    place(voice);
    set_drift(voice);
    pace_key(voice);
    tilt_table();
    spectrum(voice);
    for (int k = 0; k < count; ++k) {
      voice.soft[k] = voice.soft_to[k];
      voice.hard[k] = voice.hard_to[k];
      voice.air[k] = voice.air_to[k];
    }
    strike(voice, gain);
    dirty_ = true;
    gather_ = kGatherTicks;
  }

  void strike_again(Voice& voice, float gain) {
    touch(voice, gain);
    voice.rendering = true;
    strike(voice, gain);
    dirty_ = true;
    gather_ = kGatherTicks;
  }

  // The modes a struck body adds, and the noise it speaks with.
  void strike(Voice& voice, float gain) {
    const unsung::BodyTraits& body = unsung::traits(voice.body);
    const float quick = 1.0f / (1.0f + param(unsung_voice::kAttack) * 22.0f);
    const float sr = sample_rate();
    for (int m = 0; m < kModes; ++m) {
      const float hz = voice.hz * body.mode_ratio[m];
      const float edge = hz > 9000.0f ? 0.0f : 1.0f;
      const float w = kit::min(hz / sr, 0.49f) * kit::kTwoPi;
      voice.extra.turn_re[m] = std::cos(w);
      voice.extra.turn_im[m] = std::sin(w);
      voice.mode[m] = kit::max(voice.mode[m], body.strike * body.mode_level[m] * gain * quick * edge);
      voice.mode_keep[m] = std::exp(-kSixtyDb * dt_ / body.mode_s[m]);
    }
    voice.chiff_to = kit::max(voice.chiff_to, 0.3f * body.chiff * gain * gain * (0.25f + 0.9f * quick));
    chiff_hz_ = kit::clamp(voice.hz * body.chiff_ratio, 300.0f, 5000.0f);
    chiff_q_ = body.chiff_q;
    chiff_side_ = voice.side * 0.6f;
  }

  void let_go(Voice& voice) {
    voice.released = true;
    if (voice.pending) voice.pending = false;  // it fades, and nothing follows
    dirty_ = true;
    gather_ = kGatherTicks;
  }

  // Where its three singers stand.
  void place(Voice& voice) {
    const float width = width_.value;
    for (int s = 0; s < 3; ++s) {
      const float at = s == 0 ? voice.side * 0.6f : (s == 1 ? 0.9f : -0.9f) * (voice.side < 0.0f ? -1.0f : 1.0f);
      kit::pan_gains(kit::clamp(at * width, -1.0f, 1.0f), &voice.left[s], &voice.right[s]);
    }
  }

  float wind_of(const unsung::BodyTraits& body) const {
    return breath_.value * breath_.value * 2.4f * body.air + body.wind;
  }

  // How fast everything about a key goes, a tick.
  void pace_key(Voice& voice) {
    using namespace unsung_voice;
    const unsung::BodyTraits& body = unsung::traits(voice.body);
    const float slow = param(kAttack) * kit::max(0.0f, body.attack - 1.0f) * 0.14f;  // a slow body is not slower without end
    const float attack = param(kAttack) * body.attack / (1.0f + slow) + body.attack_add;
    voice.go_attack = 1.0f - std::exp(-dt_ / (0.22f * attack));
    voice.go_release = std::exp(-kSixtyDb * dt_ / kit::max(0.04f, param(kRelease) * body.release));
    voice.go_climb = 1.0f - std::exp(-dt_ / (0.008f + 0.1f * param(kAttack)));
    const float hold = param(kHold);
    voice.go_hold = std::exp(-kSixtyDb * dt_ / (0.35f * std::exp2(hold * 6.5f)) * kit::min(1.0f, (1.0f - hold) * 6.0f));
    voice.go_settle = 1.0f - std::exp(-dt_ / body.settle_s);
    voice.go_chiff = std::exp(-dt_ / body.chiff_s);
  }

  void set_drift(Voice& voice) {
    const float loose = 1.0f - closeness_.value;
    const unsung::BodyTraits& body = unsung::traits(voice.body);
    const float reach = kSingerCents * body.apart * loose * loose;
    const float d0 = voice.drift[0].next(kSlowTicks), d1 = voice.drift[1].next(kSlowTicks);
    voice.cents[0] = reach * (0.8f + 0.5f * d0);
    voice.cents[1] = -reach * (0.7f + 0.5f * d1);
    // Loose singers also come and go a little, each by itself.
    voice.part[0] = 1.0f + 1.4f * loose * d1;
    voice.part[1] = 1.0f - 1.4f * loose * d0;
    voice.wander = voice.drift[2].next(kSlowTicks);
    voice.swell = 1.0f + 0.12f * voice.wander;
    voice.twin_to = twin_share(voice.hz);
  }

  // Keys on one pitch share it: twelve of them are a section and no pile.
  float twin_share(float hz) const {
    int n = 0;
    for (const Voice& voice : voices_) {
      if (voice.active && !voice.pending && std::fabs(voice.hz - hz) < 0.002f * hz) ++n;
    }
    return n > 1 ? std::pow(static_cast<float>(n), -0.7f) : 1.0f;
  }

  void tilt_table() {
    if (tilt_.value == tilt_at_) return;
    tilt_at_ = tilt_.value;
    const float slope = tilt_at_ * (tilt_at_ < 0.0f ? 9.0f : 7.0f) / 6.0206f;  // powers of two an octave
    for (int k = 0; k < kHarmonics; ++k) tilt_table_[k] = std::exp2(slope * log2k_[k]);
  }

  // What each harmonic of a key is heading for: soft and hard, level for
  // level whatever the body, the vowel and the tilt.
  void spectrum(Voice& voice) {
    using namespace unsung_voice;
    const unsung::BodyTraits& body = unsung::traits(voice.body);
    unsung::Mouth mouth;
    mouth.set(vowel_.value + 0.035f * voice.wander, voice.hz);
    float power = 1.0e-9f, air_power = 1.0e-9f;
    for (int k = 0; k < voice.harmonics; ++k) {
      const float hz = voice.hz * static_cast<float>(k + 1);
      float soft, hard;
      unsung::source(voice.body, k + 1, voice.hz, &soft, &hard);
      const float lips = mouth.gain(hz);
      const float shaped = 1.0f + body.mouth * (lips - 1.0f);
      float edge = hz > top_hz_ && k > 0 ? 0.0f : 1.0f;
      if (k > 0) {
        const float q = hz * (1.0f / 6500.0f);
        edge /= 1.0f + q * q * q * q;
      }
      const float all = kit::max(shaped, 0.0f) * tilt_table_[k] * edge;
      voice.soft_to[k] = soft * all;
      voice.hard_to[k] = hard * all;
      const float mid = 0.5f * (voice.soft_to[k] + voice.hard_to[k]);
      const float ear = hz / (hz + 160.0f) * (1.0f + hz * (1.0f / 7000.0f));
      power += mid * mid * ear * ear;
      const float over = hz * (1.0f / 4200.0f);
      const float wind = (0.25f + lips) * edge * hz / ((hz + 500.0f) * (1.0f + over * over));
      voice.air_to[k] = wind;
      air_power += wind * wind;
    }
    const float level = 1.4142f * body.gain * 0.72f / std::sqrt(power);
    const float wind = 1.0f / std::sqrt(air_power);
    const float windy = wind_of(body);
    int last = 0;
    for (int k = 0; k < voice.harmonics; ++k) {
      voice.soft_to[k] *= level;
      voice.hard_to[k] *= level;
      voice.air_to[k] *= wind;
      const float heard = kit::max(voice.hard_to[k], kit::max(voice.hard[k], voice.air_to[k] * windy));
      if (heard > 5.0e-4f) last = k;
    }
    // Harmonics 66 dB under the key are not worked out.
    const int live = kit::min((last + 4) & ~3, voice.harmonics);
    if (live < voice.live) voice.bank.silence(live, voice.live);
    for (int k = voice.live; k < live; ++k) voice.soft[k] = voice.hard[k] = voice.air[k] = 0.0f;
    voice.live = live;
  }

  // One key, one tick: what it is worth now, and its gains at the tick's end.
  void tick_key(Voice& voice, int slot) {
    using namespace unsung_voice;
    const unsung::BodyTraits& body = unsung::traits(voice.body);
    if (voice.fade_left > 0 && --voice.fade_left == 0) {
      if (voice.pending) {
        start(voice, voice.next_hz, voice.next_gain);
      } else {
        voice.active = false;
        return;
      }
    }
    if (voice.released && !voice.pending && voice.fade_left == 0) {
      voice.env *= voice.go_release;
      voice.rise = voice.env;
      if (voice.env < kSilence) {
        voice.active = false;
        voice.env = 0.0f;
        return;
      }
    } else if (voice.env < 1.0f) {
      voice.rise += (1.002f - voice.rise) * voice.go_attack;
      voice.env += (voice.rise - voice.env) * voice.go_attack;
      if (voice.env > 1.0f) voice.env = voice.rise = 1.0f;
    }
    if (voice.climbing) {
      voice.hold += (1.0f - voice.hold) * voice.go_climb;
      voice.settle += (1.0f - voice.settle) * voice.go_climb;
      if (voice.hold > 0.995f && voice.settle > 0.995f && voice.env > 0.93f) voice.climbing = false;
    } else {
      voice.hold *= voice.go_hold;
      if (voice.hold < 1.0e-6f) voice.hold = 0.0f;
      voice.settle += (body.settle - voice.settle) * voice.go_settle;
    }
    const bool slow = ((beat_ + static_cast<uint32_t>(slot) * 3u) & (kSlowTicks - 1)) == 0;
    if (slow) {
      voice.body = kit::clamp_int(static_cast<int>(param(kBody) + 0.5f), 0, unsung::kNumBodies - 1);
      place(voice);
      set_drift(voice);
      pace_key(voice);
      spectrum(voice);
    }
    const float fade = voice.fade_left > 0 ? static_cast<float>(voice.fade_left - 1) * (1.0f / kStealTicks) : 1.0f;
    voice.gain += (voice.gain_to - voice.gain) * touch_rate_;
    voice.play += (voice.play_to - voice.play) * touch_rate_;
    voice.touch += (voice.touch_to - voice.touch) * touch_rate_;
    voice.twin += (voice.twin_to - voice.twin) * touch_rate_;
    const float held = voice.env * voice.hold * voice.settle;
    crowd_to_ += voice.gain * held * voice.gain * held * (1.0f / (kLevel * kLevel));
    const float level = voice.gain * held * fade * keys_gain_.value * voice.swell * voice.twin * crowd_;
    const float bright = voice.touch * (0.25f + 0.75f * voice.env) * (0.35f + 0.65f * voice.hold * voice.settle);
    if (!voice.pending) voice.loud = kit::max(voice.gain / kLevel * held, 0.02f * voice.env);
    voice.chiff += (voice.chiff_to - voice.chiff) * 0.3f;
    voice.chiff_to *= voice.go_chiff;
    if (voice.chiff_to < 1.0e-5f) voice.chiff_to = 0.0f;
    chiff_to_ += voice.chiff * fade * keys_gain_.value;

    const bool heard = level > 1.0e-7f || voice.extra_on || voice.climbing || voice.fade_left > 0;
    if (!heard) {
      if (voice.rendering) voice.bank.silence(0, kHarmonics);
      voice.rendering = false;
      return;
    }
    voice.rendering = true;
    const int count = voice.live;
    voice.bank.land(count);
    float amp[kHarmonics] = {};
    for (int k = 0; k < count; ++k) {
      voice.soft[k] += (voice.soft_to[k] - voice.soft[k]) * table_rate_;
      voice.hard[k] += (voice.hard_to[k] - voice.hard[k]) * table_rate_;
      voice.air[k] += (voice.air_to[k] - voice.air[k]) * table_rate_;
      voice.duck[k] += (voice.duck_to[k] - voice.duck[k]) * duck_rate_;
      amp[k] = (voice.soft[k] + (voice.hard[k] - voice.soft[k]) * bright) * voice.duck[k] * level;
    }
    section(voice, amp, count);
    const float wind = wind_of(body) * level;
    if (wind > 1.0e-7f) {
      for (int k = 0; k < count; ++k) {
        const uint32_t bits = voice.rng.next_u32();
        const float a = (static_cast<float>(bits & 0xffffu) * (1.0f / 32768.0f) - 1.0f) * wind * voice.air[k];
        const float b = (static_cast<float>(bits >> 16) * (1.0f / 32768.0f) - 1.0f) * wind * voice.air[k];
        voice.bank.tlr[k] += a;
        voice.bank.trr[k] += a + (b - a) * width_.value;
      }
    }
    voice.sub += (body.sub - voice.sub) * table_rate_;
    const bool was = voice.extra_on;
    voice.extra_on = voice.sub > 1.0e-4f;
    if (was) voice.extra.land(4);
    for (int m = 0; m < kModes; ++m) {
      const float a = voice.mode[m] * kLevel * voice.env * fade * keys_gain_.value;
      voice.mode[m] *= voice.mode_keep[m];
      if (voice.mode[m] < 1.0e-5f) voice.mode[m] = 0.0f;
      voice.extra_on = voice.extra_on || a > 0.0f;
      voice.extra.tlr[m] = a * voice.left[0];
      voice.extra.trr[m] = a * voice.right[0];
    }
    const float under = voice.sub * 1.4142f * level * voice.hz / (voice.hz + 130.0f);
    voice.extra.tlr[3] = under * voice.left[0];
    voice.extra.trr[3] = under * voice.right[0];
    if (voice.extra_on) {
      voice.extra.aim(4, per_sample_);
    } else if (was) {
      voice.extra.silence(0, 4);
    }
    voice.bank.aim(count, per_sample_);
  }

  // Three singers out of one row: harmonic k of a singer a little off the
  // pitch is harmonic k turned by k times that singer's angle.
  void section(Voice& voice, const float* amp, int count) {
    const float apart = 1.0f - closeness_.value;
    const float most = kit::min(0.95f, 2.3f * apart) * (0.75f + 0.25f * apart) * unsung::traits(voice.body).section;
    if (most <= 0.0f) {
      for (int k = 0; k < count; ++k) {
        voice.bank.tlr[k] = amp[k] * voice.left[0];
        voice.bank.trr[k] = amp[k] * voice.right[0];
        voice.bank.tli[k] = voice.bank.tri[k] = 0.0f;
      }
      return;
    }
    // Four harmonics at a time: each singer's angle times 1 to 4, then on by
    // four of it.
    unsung::F4 x[2], y[2], c[2], sn[2];
    for (int i = 0; i < 2; ++i) {
      voice.theta[i] += voice.hz * voice.cents[i] * 5.77789e-4f * dt_;
      voice.theta[i] -= std::floor(voice.theta[i]);
      float co[4], si[4];
      const float c1 = kit::SineTable::cos_lookup(voice.theta[i]), s1 = kit::SineTable::lookup(voice.theta[i]);
      co[0] = c1;
      si[0] = s1;
      for (int k = 1; k < 4; ++k) {
        co[k] = co[k - 1] * c1 - si[k - 1] * s1;
        si[k] = co[k - 1] * s1 + si[k - 1] * c1;
      }
      x[i] = unsung::load4(co);
      y[i] = unsung::load4(si);
      c[i] = unsung::all4(co[3]);
      sn[i] = unsung::all4(si[3]);
    }
    const unsung::F4 l0 = unsung::all4(voice.left[0]), r0 = unsung::all4(voice.right[0]);
    const unsung::F4 l1 = unsung::all4(voice.left[1]), r1 = unsung::all4(voice.right[1]);
    const unsung::F4 l2 = unsung::all4(voice.left[2]), r2 = unsung::all4(voice.right[2]);
    for (int k = 0; k < count; k += 4) {
      // The note itself is mostly the first singer's: it stays where it is.
      const unsung::F4 share = unsung::load4(voice_share_ + k) * unsung::all4(most);
      const unsung::F4 a = unsung::load4(amp + k) * (unsung::all4(1.0f) - unsung::all4(0.35f) * share * share);
      const unsung::F4 b1 = a * share * unsung::all4(voice.part[0]), b2 = a * share * unsung::all4(voice.part[1]);
      unsung::store4(voice.bank.tlr + k, a * l0 + b1 * l1 * x[0] + b2 * l2 * x[1]);
      unsung::store4(voice.bank.tli + k, b1 * l1 * y[0] + b2 * l2 * y[1]);
      unsung::store4(voice.bank.trr + k, a * r0 + b1 * r1 * x[0] + b2 * r2 * x[1]);
      unsung::store4(voice.bank.tri + k, b1 * r1 * y[0] + b2 * r2 * y[1]);
      for (int i = 0; i < 2; ++i) {
        const unsung::F4 turned = x[i] * c[i] - y[i] * sn[i];
        y[i] = x[i] * sn[i] + y[i] * c[i];
        x[i] = turned;
      }
    }
  }

  // --- the lines ----------------------------------------------------------------------------

  float first_wait(int line) const {
    using namespace unsung_voice;
    const float wait = kit::min(0.1f + 0.5f * param(kAttack), 1.2f);
    return kit::min(wait, kit::max(param(kPace), 0.03f)) + (line == 1 ? kit::min(0.3f * param(kPace), 0.8f) : 0.0f);
  }

  bool gathered() {
    for (const Voice& voice : voices_) {
      if (voice.sings() && !voice.released) return true;
    }
    return false;
  }

  void find_meetings() {
    using namespace unsung_voice;
    unsung::Key keys[kMaxVoices];
    int n = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = voices_[v];
      if (!voice.sings() || voice.released) continue;
      bool twin = false;
      for (int i = 0; i < n; ++i) twin = twin || std::fabs(keys[i].hz - voice.hz) < 0.004f * voice.hz;
      if (twin) continue;
      keys[n].hz = voice.hz;
      keys[n].voice = v;
      ++n;
    }
    if (n == 0) return;  // the keys are let go: the line fades with them where it stands
    meetings_.find(keys, n, param(kTolerance), param(kRegister), static_cast<int>(param(kPartner) + 0.5f));
    for (int l = 0; l < 2; ++l) {
      Line& line = lines_[l];
      if (line.tone < 0 || !tones_[line.tone].active) continue;
      Tone& tone = tones_[line.tone];
      const int i = meetings_.nearest(std::exp2(tone.to));
      if (i < 0) {
        leave(tone, 0.4f);
        line.tone = -1;
        continue;
      }
      const unsung::Meeting& meeting = meetings_.at(i);
      if (same_meeting(tone, meeting)) {
        tone.meeting = meeting;
        if (std::fabs(tone.to - std::log2(meeting.hz)) > 1.0e-5f) slide(tone, meeting.hz, 0.12f);
        continue;
      }
      const float other = standing(1 - l);
      if (other > 0.0f && std::fabs(meeting.hz / other - 1.0f) < 0.03f) {
        leave(tone, 0.3f);
        line.tone = -1;
        line.wait = 0.2f;
        continue;
      }
      step_to(l, meeting);
      line.wait = kit::max(line.wait, 0.6f * param(kPace));
    }
  }

  bool same_meeting(const Tone& tone, const unsung::Meeting& meeting) const {
    if (meeting.count != tone.meeting.count) return false;
    for (int c = 0; c < meeting.count; ++c) {
      if (meeting.voice[c] != tone.meeting.voice[c] || meeting.harmonic[c] != tone.meeting.harmonic[c]) return false;
      if (voices_[meeting.voice[c]].stamp != tone.stamps[c]) return false;
    }
    return true;
  }

  float standing(int l) const {
    const Line& line = lines_[l];
    if (line.tone < 0 || !tones_[line.tone].active || (l == 1 && second_.value < 1.0e-4f)) return 0.0f;
    return std::exp2(tones_[line.tone].to);
  }

  void leave(Tone& tone, float seconds) {
    tone.leaving = true;
    tone.rising = false;
    tone.leave = std::exp(-kSixtyDb * dt_ / seconds);
  }

  static void slide(Tone& tone, float hz, float seconds) {
    tone.from = std::log2(tone.hz);
    tone.to = std::log2(hz);
    tone.glide = 0.0f;
    tone.glide_step = 1.0f / kit::max(seconds, 0.001f);
  }

  // A free tone; when only one is left the quietest is hurried out.
  int free_tone() {
    int found = -1, quietest = -1;
    int free = 0;
    for (int t = 0; t < kTones; ++t) {
      if (!tones_[t].active) {
        ++free;
        if (found < 0) found = t;
      } else if (lines_[0].tone != t && lines_[1].tone != t &&
                 (quietest < 0 || tones_[t].env < tones_[quietest].env)) {
        quietest = t;
      }
    }
    if (free <= 2 && quietest >= 0 && !(tones_[quietest].leaving && tones_[quietest].leave < hurry_)) {
      leave(tones_[quietest], 0.05f);
    }
    return found;
  }

  float ring_seconds() const { return 0.35f * std::exp2(param(unsung_voice::kLinger) * 6.5f); }

  float tone_rise() const {
    using namespace unsung_voice;
    const float linger = param(kLinger);
    const float attack = 0.006f + linger * linger * kit::min(0.3f * param(kPace), 0.6f);
    return 1.0f - std::exp(-dt_ / (0.35f * attack));
  }

  void step_to(int l, const unsung::Meeting& meeting) {
    using namespace unsung_voice;
    Line& line = lines_[l];
    const float glide = param(kGlide);
    const bool there = line.tone >= 0 && tones_[line.tone].active && !tones_[line.tone].leaving;
    if (there && glide > 0.02f) {
      Tone& tone = tones_[line.tone];
      slide(tone, meeting.hz, glide * kit::min(param(kPace), 5.0f) * 0.8f);
      contribute(tone, meeting);
      tone.rising = true;
      tone.rise = tone_rise();
      return;
    }
    if (there) {
      // Sung, it gives way to the next; struck, it is left to ring.
      const float linger = param(kLinger);
      const float over = kit::clamp(0.9f * param(kPace), 0.25f, 2.5f);
      if (linger > 0.9f) {
        leave(tones_[line.tone], over);
      } else {
        leave(tones_[line.tone], kit::min(ring_seconds(), 8.0f * param(kPace) + 1.0f));
      }
    }
    const int t = free_tone();
    if (t < 0) {
      line.wait = 0.012f;  // every tone still sounds: in a moment one is out
      return;
    }
    Tone& tone = tones_[t];
    tone.active = true;
    tone.line = l;
    tone.leaving = false;
    tone.rising = true;
    tone.fresh = true;
    tone.env = 0.0f;
    tone.gate = 0.0f;
    tone.touch = voices_[meeting.voice[0]].touch;
    tone.age = 0.0f;
    tone.strain = 0.0f;
    tone.tremble = 0.0f;
    tone.rise = tone_rise();
    tone.force = strike_gain_;
    tone.hz = meeting.hz;
    tone.from = tone.to = std::log2(meeting.hz);
    tone.glide = 1.0f;
    tone.rng.seed(line.rng.next_u32());
    for (float& b : tone.breath) b = 0.0f;
    for (float& theta : tone.theta) theta = 0.0f;
    for (int m = 0; m < kMultiples; ++m) {
      tone.bank.re[m] = 0.0f;
      tone.bank.im[m] = -1.0f;
    }
    tone.bank.silence(0, kMultiples);
    contribute(tone, meeting);
    for (int c = 0; c < 3; ++c) contributor_place(tone, c, &tone.left[c], &tone.right[c]);
    line.tone = t;
  }

  void contribute(Tone& tone, const unsung::Meeting& meeting) {
    tone.meeting = meeting;
    for (int c = 0; c < meeting.count; ++c) tone.stamps[c] = voices_[meeting.voice[c]].stamp;
  }

  void contributor_place(const Tone& tone, int c, float* left, float* right) const {
    *left = *right = 0.0f;
    if (c >= tone.meeting.count) return;
    // In phase they add as they are; beating, as power.
    const float n = static_cast<float>(tone.meeting.count);
    const float share = kit::lerp(1.0f / n, 1.0f / std::sqrt(n), kit::min(1.0f, beating_.value * 4.0f));
    const Voice& voice = voices_[tone.meeting.voice[c]];
    const float own = tone.meeting.harmonic[c] > 0 ? voice.side : -voice.side;
    const float lead = tone.line == 0 ? 0.12f : -0.5f;
    kit::pan_gains(kit::clamp((own * 0.75f + lead) * width_.value, -1.0f, 1.0f), left, right);
    *left *= share;
    *right *= share;
  }

  void walk(int l) {
    using namespace unsung_voice;
    Line& line = lines_[l];
    if (l == 1 && second_.value < 1.0e-4f && second_.target < 1.0e-4f) {
      if (line.tone >= 0 && tones_[line.tone].active) leave(tones_[line.tone], 0.2f);
      line.tone = -1;
      return;
    }
    line.vibrato_phase += dt_ * (4.9f + 0.4f * line.drift.next() + 0.35f * static_cast<float>(l));
    line.vibrato_phase -= std::floor(line.vibrato_phase);
    line.vibrato = kit::SineTable::lookup(line.vibrato_phase);
    line.wait -= dt_;
    if (line.wait > 0.0f || meetings_.count() == 0 || dirty_ || !gathered()) return;
    const bool there = line.tone >= 0 && tones_[line.tone].active && !tones_[line.tone].leaving;
    const float lean = l == 0 ? param(kLean) : -param(kLean);
    const float other = standing(1 - l);
    const int i = there ? meetings_.next(std::exp2(tones_[line.tone].to), other, lean, line.rng)
                        : meetings_.first(lean, other);
    const float pace = param(kPace) * (l == 0 ? 1.0f : 1.5f);
    line.wait = pace * (0.82f + 0.36f * line.rng.uniform());
    if (i >= 0) {
      step_to(l, meetings_.at(i));
    } else if (there && param(kLinger) < 0.9f) {
      step_to(l, tones_[line.tone].meeting);  // nowhere else to go: the same again
    }
  }

  void tick_tone(Tone& tone) {
    using namespace unsung_voice;
    const Line& line = lines_[tone.line];
    tone.age += dt_;
    if (tone.glide < 1.0f) {
      tone.glide = kit::min(1.0f, tone.glide + dt_ * tone.glide_step);
      tone.hz = std::exp2(kit::lerp(tone.from, tone.to, unsung::smoothstep(tone.glide)));
    }
    if (tone.leaving) {
      tone.env *= tone.leave;
    } else if (tone.rising) {
      tone.env += (1.03f - tone.env) * tone.rise;
      if (tone.env >= 1.0f) {
        tone.env = 1.0f;
        tone.rising = false;
      }
    } else {
      tone.env *= ring_;
    }
    // It lasts as long as the keys under it.
    float under = 0.0f, touch = 0.0f;
    bool there = false;
    for (int c = 0; c < tone.meeting.count; ++c) {
      const Voice& voice = voices_[tone.meeting.voice[c]];
      if (!voice.active || voice.stamp != tone.stamps[c] || !voice.sings()) continue;
      const float worth = voice.env * voice.play;
      if (worth > under) under = worth;
      touch = kit::max(touch, voice.touch);
      there = there || worth > 0.0f;
      if (tone.meeting.harmonic[c] > 0) {
        const float back = kStepBack * kit::min(1.0f, line_gain_.value * 8.0f) * kit::min(1.0f, tone.env * 2.0f) *
                           (tone.line == 0 ? 1.0f : kit::min(1.0f, second_.value * 2.0f));
        for (int m = 1; m <= 2; ++m) {
          const int k = tone.meeting.harmonic[c] * m - 1;
          if (k < kHarmonics) {
            float& to = voices_[tone.meeting.voice[c]].duck_to[k];
            to = kit::min(to, 1.0f - (m == 1 ? back : 0.6f * back * colour_.value));
          }
        }
      }
    }
    make_room(tone);
    tone.touch += (touch - tone.touch) * gate_rate_;
    tone.gate += (under - tone.gate) * gate_rate_;
    if (tone.env < kSilence || (!there && tone.gate < kSilence)) {
      tone.active = false;
      for (Line& other : lines_) {
        if (other.tone == static_cast<int>(&tone - tones_)) other.tone = -1;  // the slot may be the other line's next
      }
      return;
    }
    const float settle = kit::min(0.9f, 0.5f * param(kPace));
    const float bend = param(kVibrato) * kVibratoCents * line.vibrato *
                       unsung::smoothstep((tone.age - 0.25f * settle) / (0.2f + settle));
    const float hz = kit::min(tone.hz * (1.0f + 5.77789e-4f * bend), 0.45f * sample_rate());
    const float at = hz / sample_rate() * kit::kTwoPi;
    const float c1 = std::cos(at), s1 = std::sin(at);
    float c = c1, s = s1;
    for (int m = 0; m < kMultiples; ++m) {
      tone.bank.turn_re[m] = c;
      tone.bank.turn_im[m] = s;
      const float turned = c * c1 - s * s1;
      s = c * s1 + s * c1;
      c = turned;
    }
    tone_gains(tone, hz);
  }

  // The keys' overtones a fourth either way of a tone step back a little, so
  // that a bright body does not sing over the line.
  void make_room(const Tone& tone) {
    const float line = tone.line == 0 ? 1.0f : second_.value;
    const float back = kRoom * kit::min(1.0f, tone.env * tone.gate * line_gain_.value * line * 3.0f);
    if (back < 0.01f) return;
    for (Voice& voice : voices_) {
      if (!voice.active || !voice.rendering) continue;
      const float at = tone.hz / voice.hz;
      const int from = kit::max(2, static_cast<int>(at * 0.77f) + 1);
      const int to = kit::min(voice.live, static_cast<int>(at * 1.3f));
      for (int k = from; k <= to; ++k) voice.duck_to[k - 1] = kit::min(voice.duck_to[k - 1], 1.0f - back);
    }
  }

  void tone_gains(Tone& tone, float hz) {
    using namespace unsung_voice;
    // The contributors: each its own little angle, which Beating lets go.
    const float beating = beating_.value;
    float cc[3] = {1.0f, 1.0f, 1.0f}, ss[3] = {}, x[3] = {}, y[3] = {};
    const float ease = table_rate_;
    static const float kApart[3] = {-0.9f, 1.1f, 0.25f};
    for (int i = 0; i < 3; ++i) {
      float l, r;
      contributor_place(tone, i, &l, &r);
      tone.left[i] += (l - tone.left[i]) * ease;
      tone.right[i] += (r - tone.right[i]) * ease;
      const float own = i < tone.meeting.count ? tone.meeting.own[i] - tone.meeting.hz : 0.0f;
      tone.theta[i] += dt_ * beating * (kit::clamp(own, -14.0f, 14.0f) + 1.6f * kApart[i] * beating);
      tone.theta[i] -= std::floor(tone.theta[i] + 0.5f);
      if (beating < 0.02f) tone.theta[i] -= tone.theta[i] * ease * (1.0f - 50.0f * beating);
      const float turn = tone.theta[i] + 1.0f;  // the table takes no phase a hair under zero
      cc[i] = x[i] = kit::SineTable::cos_lookup(turn);
      ss[i] = y[i] = kit::SineTable::lookup(turn);
    }
    const unsung::BodyTraits& body = unsung::traits(kit::clamp_int(static_cast<int>(param(kBody) + 0.5f), 0, 4));
    if (((beat_ + static_cast<uint32_t>(tone.line) * 4u) & 7) == 0 || tone.fresh) shape_tone(tone, body, hz);
    const float carry = kit::clamp(std::sqrt(std::sqrt(700.0f / tone.hz)), 0.6f, 1.25f);
    const float second = tone.line == 0 ? 1.0f : 1.2f * second_.value;
    // Overtones Tolerance only just lets in are pulled together less surely:
    // such a meeting is softer and trembles.
    const float colour = colour_.value;
    const float reach = 0.05f + 0.74f * std::sqrt(colour * std::sqrt(colour));
    const float strain = tone_strain(tone);
    tone.strain += (strain - tone.strain) * ease;
    tone.tremble += dt_ * kit::min(6.0f, 0.35f * std::fabs(tone.meeting.own[1] - tone.meeting.own[0]) + 0.4f);
    tone.tremble -= std::floor(tone.tremble);
    const float fit = (1.0f + 0.28f * tone.strain * kit::SineTable::lookup(tone.tremble)) / (1.0f + 0.7f * tone.strain * tone.strain);
    const float level = fit * kLineLevel * 1.4142f * line_gain_.value * tone.env * tone.gate * carry * second * body.line * tone.force *
                        (1.0f + 0.4f * param(kVibrato) * lines_[tone.line].vibrato);
    const float wind = breath_.value * 2.2f * body.air;
    const float pass = breath_pass_, lift = breath_lift_;
    const float dull = (0.45f + 0.55f * tone.env) * (0.62f + 0.65f * tone.touch) *
                       (1.0f + 0.5f * param(kVibrato) * lines_[tone.line].vibrato);
    // As loud with many multiples as with one, or nearly.
    float power = 0.0f, part = 1.0f;
    for (int m = 0; m < kMultiples; ++m) {
      power += part * part * tone.shape[m] * tone.shape[m];
      part *= reach * colour_step(colour, m) * dull;
    }
    float amp = level / std::sqrt(0.2f + 0.8f * kit::max(1.0f, power));
    for (int m = 0; m < kMultiples; ++m) {
      const float a = amp * tone.shape[m];
      float l = 0.0f, li = 0.0f, r = 0.0f, ri = 0.0f;
      for (int i = 0; i < 3; ++i) {
        l += tone.left[i] * x[i];
        li += tone.left[i] * y[i];
        r += tone.right[i] * x[i];
        ri += tone.right[i] * y[i];
        const float turned = x[i] * cc[i] - y[i] * ss[i];
        y[i] = x[i] * ss[i] + y[i] * cc[i];
        x[i] = turned;
      }
      if (wind > 1.0e-5f) {
        // Air round the line: slow noise on it, so it hisses at its own pitch.
        const uint32_t bits = tone.rng.next_u32();
        float& p = tone.breath[2 * m];
        float& q = tone.breath[2 * m + 1];
        p += (static_cast<float>(bits & 0xffffu) * (1.0f / 32768.0f) - 1.0f - p) * pass;
        q += (static_cast<float>(bits >> 16) * (1.0f / 32768.0f) - 1.0f - q) * pass;
        const float quiet = 1.0f / (1.0f + 0.35f * wind);
        const float air = lift * wind / (1.0f + 0.35f * static_cast<float>(m));
        const float nl = p * air, nr = q * air;
        l = l * quiet + 0.5f * nl;
        r = r * quiet + 0.5f * nr;
      }
      tone.bank.tlr[m] = a * l;
      tone.bank.tli[m] = a * li;
      tone.bank.trr[m] = a * r;
      tone.bank.tri[m] = a * ri;
      amp *= reach * colour_step(colour, m) * dull;
    }
    tone.bank.aim(kMultiples, per_sample_);
  }

  float tone_strain(const Tone& tone) const {
    const unsung::Meeting& meeting = tone.meeting;
    if (meeting.count < 2) return 0.0f;
    const float apart = kOctaveCents * std::fabs(meeting.own[meeting.count - 1] / meeting.own[0] - 1.0f);
    return kit::min(1.0f, apart / param(unsung_voice::kTolerance));
  }

  // What the mouth and the body do to the multiples of a tone.
  void shape_tone(Tone& tone, const unsung::BodyTraits& body, float hz) {
    unsung::Mouth mouth;
    mouth.set(vowel_.value, hz);
    const float here = mouth.gain(hz);
    const float ease = tone.fresh ? 1.0f : 0.2f;
    tone.fresh = false;
    for (int m = 0; m < kMultiples; ++m) {
      const float f = hz * static_cast<float>(m + 1), q = f * (1.0f / 5500.0f);
      float a = 1.0f;
      if (m > 0) {
        const float lips = kit::clamp(mouth.gain(f) / here, 0.1f, 1.6f);
        a = (1.0f + 0.6f * body.mouth * (lips - 1.0f)) / (1.0f + q * q * q * q);
        a *= body.rich;
        if (f > top_hz_) a = 0.0f;
        if (param(unsung_voice::kBody) > 3.5f && (m & 1) != 0) a *= 0.15f;
      }
      tone.shape[m] += (a - tone.shape[m]) * ease;
    }
  }

  // Colour 0 is one sine; from there the multiples come in from below.
  static float colour_step(float colour, int m) {
    return kit::clamp(colour * 10.0f - 0.6f * static_cast<float>(m), 0.0f, 1.0f);
  }

  // --- one tick -----------------------------------------------------------------------------

  void control() {
    for (kit::Smoother* knob : knobs()) knob->next();
    tilt_table();
    if ((beat_ & 15) == 0) {
      const float linger = param(unsung_voice::kLinger);
      strike_gain_ = 1.0f + 0.65f * (1.0f - linger) * (1.0f - linger);
      ring_ = std::exp(-kSixtyDb * dt_ / ring_seconds() * kit::min(1.0f, (1.0f - linger) * 6.0f));
    }
    ++beat_;
    if (gather_ > 0) --gather_;
    if (dirty_ && gather_ == 0) {
      dirty_ = false;
      find_meetings();
    }
    walk(0);
    walk(1);
    for (Voice& voice : voices_) {
      if (!voice.active) continue;
      for (int k = 0; k < voice.harmonics; ++k) voice.duck_to[k] = 1.0f;
    }
    for (Tone& tone : tones_) {
      if (!tone.active) continue;
      tone.bank.land(kMultiples);
      tick_tone(tone);
    }
    chiff_ = chiff_to_;
    chiff_to_ = 0.0f;
    // Many keys at once make a little room for each other.
    const float room = 1.0f / std::sqrt(1.0f + 0.14f * crowd_to_);
    crowd_ += (room - crowd_) * (room < crowd_ ? touch_rate_ : table_rate_);
    crowd_to_ = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      if (voices_[v].active) tick_key(voices_[v], v);
    }
    float cl, cr;
    kit::pan_gains(chiff_side_ * width_.value, &cl, &cr);
    chiff_left_ += (cl - chiff_left_) * 0.2f;
    chiff_right_ += (cr - chiff_right_) * 0.2f;
    chiff_on_ = chiff_ > 1.0e-6f || chiff_to_ > 1.0e-6f;
    chiff_step_ = (chiff_to_ - chiff_) * per_sample_;
    if (chiff_on_) chiff_filter_.set(chiff_hz_, chiff_q_, sample_rate());
  }


  struct KnobList {
    kit::Smoother* list[10];
    kit::Smoother** begin() { return list; }
    kit::Smoother** end() { return list + 10; }
  };
  KnobList knobs() {
    return {{&vowel_, &tilt_, &closeness_, &breath_, &keys_gain_, &line_gain_, &second_, &beating_, &colour_, &width_}};
  }

  Voice voices_[kMaxVoices];
  Tone tones_[kTones];
  Line lines_[2];
  unsung::Meetings meetings_;
  kit::IdleGate idle_;
  kit::Smoother vowel_, tilt_, closeness_, breath_, keys_gain_, line_gain_, second_, beating_, colour_, width_;
  kit::Smoother volume_;
  kit::Svf chiff_filter_;
  kit::Rng noise_;
  float voice_share_[kHarmonics] = {};  // k / (k + 1)
  float log2k_[kHarmonics] = {}, tilt_table_[kHarmonics] = {};
  float tilt_at_ = -99.0f;
  float tick_rate_ = 1000.0f, dt_ = 1.0f / 1000.0f, per_sample_ = 1.0f / 48.0f;
  float top_hz_ = 12000.0f, noise_scale_ = 1.0f;
  float duck_rate_ = 0.01f, table_rate_ = 0.03f, touch_rate_ = 0.2f, crowd_ = 1.0f, crowd_to_ = 0.0f, gate_rate_ = 0.05f, ring_ = 1.0f, strike_gain_ = 1.0f;
  float breath_pass_ = 0.1f, breath_lift_ = 3.0f, hurry_ = 0.9f;
  float chiff_ = 0.0f, chiff_step_ = 0.0f, chiff_to_ = 0.0f, chiff_left_ = 0.7f, chiff_right_ = 0.7f;
  float chiff_hz_ = 1000.0f, chiff_q_ = 1.0f, chiff_side_ = 0.0f;
  bool chiff_on_ = false, dirty_ = false;
  int gather_ = 0, tick_ = 48, left_ = 0;
  uint32_t beat_ = 0;
  uint32_t stamp_ = 0, starts_ = 0;
};

}  // namespace livemix
