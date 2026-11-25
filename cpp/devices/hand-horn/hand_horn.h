#pragma once

// Hand Horn: a natural horn, its crook, and a hand in the bell.
//
//   key ─► ladder (ladder.h): which partial of the crook, lipped or stopped
//            │ pitch, covering, thinness
//            ▼
//   breath envelope ─► brightness a ─► series(x, a) ─┐
//   rip, slide, tremble, drift ─► pitch ─► x         ├─► hand ─► level ─► place ─► bus
//   air, pulsed by x ────────────────────────────────┘
//
//   bus ─► bell ─► distance (duller, and eight answers a side) ─► volume ─► soft clip
//
// - The rule. A key within Lip cents of a partial is played open and lipped
//   to pitch. Any other key is the next partial above, lowered by the hand,
//   and the covering is the cents it was lowered by over 120. Hand scales
//   both: at 0 a key is its nearest partial at that partial's own pitch, at
//   1 it is in tune. Between the two the pitch closes the gap in proportion
//   and the covering goes with it.
// - The tone is a closed form harmonic series whose ratio between
//   neighbours, the brightness, rises with the breath, so a note is brighter
//   the louder it is. It is divided by the level it has past the bell
//   (LevelTable), so neither Blow nor the pitch is a volume control. What
//   the hand takes is outside that: a stopped note is smaller.
// - The hand is a filter per note (HandFilter): the highs go, a band at
//   1190 Hz stays, and the whole is turned down, all by covering · Shadow.
// - A note lipped up loses some of its fundamental and a little level, in
//   proportion to the cents.
// - Solo is one voice with a stack of keys. An overlapping key slides: the
//   pitch goes to every partial between in turn, rests on each, and the hand
//   is open on them. Chords is a voice to a key, six of them.
// - One horn to a pitch. Keys that come to within two cents of each other
//   (two ids on one key, or two keys fallen to one partial at Hand 0) sound
//   as the newest one alone, so they neither double nor cancel; let that one
//   go and the older takes over. No other level depends on how many sound.
// - Rest. What a note finds (smoothers, clock, filters, echoes) is put in
//   order when a note comes after kRestSeconds of no voice, counted in
//   samples, so it does not depend on the block size or on sleep.

#include "../../kit/kit.h"
#include "ladder.h"
#include "params.gen.h"
#include "tube.h"

namespace livemix {

class HandHorn : public kit::DeviceBase<hand_horn::kNumParams> {
 public:
  static constexpr int kMaxVoices = 6;
  static constexpr int kMaxKeys = 32;
  static constexpr int kControlPeriod = 32;
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 8000.0f;

  void init(float sample_rate) {
    using namespace hand_horn;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    dt_ = static_cast<float>(kControlPeriod) / sr;
    const float control_rate = 1.0f / dt_;
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.hand.prepare(sr);
      voice.noise.seed(0x9E3779B9u * static_cast<uint32_t>(v + 1) ^ 0x0BADC0DEu);
      voice.drift.seed(0x51ED270Bu + 7919u * static_cast<uint32_t>(v));
      voice.drift.set_rate(kDriftHz, sr);
      voice.air_low.set_cutoff(kAirCeilingHz, sr);
    }
    start_.seed(0xA5A5F00Du);
    bell_.set(sr);
    table_.build(bell_, sr);
    waves_.init();
    for (int side = 0; side < 2; ++side) {
      for (int k = 0; k < 2; ++k) {
        far_[side][k].reset();
        far_[side][k].set_cutoff(kFarHz, sr);
      }
      field_[side].reset();
      field_[side].set_cutoff(kFieldHz, sr);
    }
    clear_echoes();
    for (int side = 0; side < 2; ++side) {
      for (int t = 0; t < kTaps; ++t) {
        tap_[side][t] = kit::clamp_int(static_cast<int>(kTapSeconds[side][t] * sr + 0.5f), 1, kRing - 1);
      }
    }
    hand_.set_time(0.015f, control_rate);
    shadow_.set_time(0.015f, control_rate);
    spread_.set_time(0.015f, control_rate);
    tremble_.set_time(0.015f, control_rate);
    air_.set_time(kSmoothingSeconds, sr);
    distance_.set_time(0.02f, sr);
    width_.set_time(0.02f, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    follow_ = 1.0f - kit::time_to_coeff(kFollowSeconds, control_rate);
    rise_ = 1.0f - kit::time_to_coeff(kRiseSeconds, control_rate);
    fall_ = 1.0f - kit::time_to_coeff(kFallSeconds, control_rate);
    settle_ = kit::time_to_coeff(kSettleSeconds, control_rate);
    fade_step_ = 1.0f / (kStealSeconds * sr);
    air_scale_ = kAirGain * std::sqrt(sr / 48000.0f);
    crack_ticks_ = kit::max(1.0f, kCrackSeconds * control_rate);
    rest_ = static_cast<long>(kRestSeconds * sr);
    quiet_ = rest_;
    order_ = 0;
    solo_ = -1;
    keys_ = 0;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, kIdleSeconds);
    solo_mode_ = param(kPlay) < 0.5f;
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace hand_horn;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kit::min(kMaxHz, 0.2f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (quiet_ >= rest_ && pool_.count_active() == 0) restart();
    const float cents = cents_of(frequency);
    if (solo_mode_) {
      solo_on(note_id, cents, gain);
    } else {
      chord_on(note_id, cents, gain);
    }
  }

  void note_off(int note_id) {
    if (solo_mode_) {
      solo_off(note_id);
      return;
    }
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.on && voice.id == note_id) let_go(voice, 0.0f);
    }
  }

  // Covering, partial, place (the pitch over the crook's fundamental) and
  // level of the newest note that is held, or that still sounds when none is;
  // all zero with nothing sounding.
  float meter(int index) const {
    int shown = -1;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      if (shown < 0 || (voice.on != pool_.voices[shown].on ? voice.on : voice.sounded > pool_.voices[shown].sounded)) {
        shown = v;
      }
    }
    if (shown < 0) return 0.0f;
    const Voice& voice = pool_.voices[shown];
    switch (index) {
      case 0:
        return voice.shown_covering;
      case 1:
        return static_cast<float>(voice.shown_partial);
      case 2:
        return std::exp2((voice.sounding - base_) * (1.0f / 1200.0f));
      case 3:
        return voice.env.level() * voice.loud;
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      quiet_ = quiet_ < rest_ ? quiet_ + frames : rest_;
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();
      const float air = air_.next();
      float left = 0.0f, right = 0.0f;
      bool any = false;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.active() || !fade(voice)) continue;
        any = true;
        const float env = voice.env.next();
        voice.bright += voice.bright_step;
        voice.increment += voice.increment_step;
        voice.gain += voice.gain_step;
        voice.left += voice.left_step;
        voice.right += voice.right_step;
        voice.phase += voice.increment;
        if (voice.phase >= 1.0f) voice.phase -= 1.0f;
        float sine, cosine;
        waves_.read(voice.phase, &sine, &cosine);
        const float a = voice.bright;
        float tone = sine / (1.0f - 2.0f * a * cosine + a * a) - voice.lost * sine;
        tone *= voice.gain;
        if (air > 0.0f) {
          float noise = voice.air_low.lowpass(voice.noise.bipolar());
          noise -= voice.air_high.lowpass(noise);
          tone += noise * air * voice.air_gain * (1.0f + kAirPulse * cosine);
        }
        const float sound = voice.hand.process(tone) * env * voice.fade;
        left += sound * voice.left;
        right += sound * voice.right;
      }
      quiet_ = any ? 0 : (quiet_ < rest_ ? quiet_ + 1 : rest_);

      left = bell_.process(0, left);
      right = bell_.process(1, right);
      // Distance: the horn itself goes soft and dull, the field answers.
      const float distance = distance_.next();
      const float width = width_.next();
      const float direct = 1.0f - kFarQuieter * distance;
      const float dull_left = far_[0][1].lowpass(far_[0][0].lowpass(left));
      const float dull_right = far_[1][1].lowpass(far_[1][0].lowpass(right));
      ring_[write_] = field_[1].lowpass(field_[0].lowpass(0.5f * (left + right)));
      float answer_left = 0.0f, answer_right = 0.0f;
      for (int t = 0; t < kTaps; ++t) {
        answer_left += kTapGain[t] * ring_[(write_ - tap_[0][t]) & (kRing - 1)];
        answer_right += kTapGain[t] * ring_[(write_ - tap_[1][t]) & (kRing - 1)];
      }
      write_ = (write_ + 1) & (kRing - 1);
      const float middle = 0.5f * (answer_left + answer_right);
      const float side = 0.5f * (answer_left - answer_right) * width;
      const float answers = kAnswerGain * distance;
      left = (left + (dull_left - left) * distance) * direct + (middle + side) * answers;
      right = (right + (dull_right - right) * distance) * direct + (middle - side) * answers;

      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    kit::Adsr env;
    hand_horn::HandFilter hand;
    kit::OnePole air_low, air_high;
    kit::Rng noise;
    kit::Drift drift;
    // Which key, and in what order it came.
    int id = -1;
    uint32_t order = 0;    // of the key
    uint32_t sounded = 0;  // of the note that sounds
    bool on = false;       // its key is down (or it waits for a steal's fade)
    bool pending = false;  // a new note starts when the fade is over
    bool fading = false;
    float fade = 1.0f;
    float next_key = 0.0f, next_loud = 0.0f;
    // What was asked, and what the horn made of it.
    float key = 0.0f;      // cents over C1
    float velocity = 0.0f;
    float loud = 0.0f, loud_target = 0.0f;
    hand_horn::Ask ask;
    float ask_key = -1.0e9f, ask_base = 0.0f, ask_lip = 0.0f;
    float target = 0.0f, target_covering = 0.0f, target_thin = 0.0f;
    float cents = 0.0f, covering = 0.0f, thin = 0.0f;
    float sounding = 0.0f;  // cents with everything on it
    float shown_covering = 0.0f;
    int shown_partial = 0;
    // A slide in Solo.
    bool sliding = false;
    float slide_seconds = 0.0f, slide_step = 0.0f, slide_move = 0.0f, slide_total = 0.0f;
    float slide_from = 0.0f, slide_covering = 0.0f, slide_thin = 0.0f, slide_base = 0.0f;
    int slide_first = 0, slide_way = 1, slide_count = 0;
    float slide_dip = 1.0f;
    // A rough start.
    float rip = 0.0f, rip_age = 0.0f, rip_seconds = 0.0f, rip_cents = 0.0f;
    float crack = 1.0f, crack_next = 1.0f, crack_tick = 0.0f;
    // Sound.
    float age = 0.0f;
    float settle = 0.0f;
    float tremble_phase = 0.0f;
    float lone = 1.0f;     // 1 heard, 0 another note has this pitch
    bool yields = false;
    float phase = 0.0f, increment = 0.0f, increment_step = 0.0f;
    float bright = 0.0f, bright_step = 0.0f, lips = 0.0f;
    float gain = 0.0f, gain_step = 0.0f, air_gain = 0.0f, lost = 0.0f;
    float left = 0.0f, left_step = 0.0f, right = 0.0f, right_step = 0.0f;

    bool active() const { return env.active() || pending; }
    bool releasing() const { return !on; }
    // True from the moment the voice is taken: what the note will be.
    float level() const {
      if (pending) return next_loud;
      return loud_target * (on ? 1.0f : env.level()) * (yields ? 0.2f : 1.0f);
    }
  };

  struct Key {
    int id = -1;
    float cents = 0.0f;
    float gain = 0.0f;
  };

  // The lips and the breath.
  static constexpr float kDriftHz = 0.5f;
  static constexpr float kDriftCents = 0.5f;
  static constexpr float kFollowSeconds = 0.012f;
  static constexpr float kRiseSeconds = 0.030f;
  static constexpr float kFallSeconds = 0.008f;
  static constexpr float kSettleSeconds = 0.025f;
  static constexpr float kSettleCents = 14.0f;
  static constexpr float kSpeechPeriods = 6.0f;
  // Brightness with no breath, and at full breath for Blow 0 and 1; how much
  // of it a soft key has; and how much duller, per harmonic, a high note is.
  static constexpr float kSoftest = 0.06f;
  static constexpr float kDullest = 0.35f;
  static constexpr float kBrightest = 0.96f;
  static constexpr float kSoftShare = 0.4f;
  static constexpr float kMiddleHz = 261.63f;
  static constexpr float kColourPower = 0.5f;
  static constexpr float kCapDb = 55.0f;
  static constexpr float kQuietest = 0.45f;
  static constexpr float kVoiceGain = 0.15f;
  static constexpr float kEdgePower = 0.6f;  // 3.6 dB an octave under middle C
  // Lipped up by the most there is: this much of the fundamental and this
  // much level is lost.
  static constexpr float kLostFundamental = 0.5f;
  static constexpr float kLostDb = 1.5f;
  // Air.
  static constexpr float kAirGain = 3.0f;
  static constexpr float kAirPulse = 0.5f;
  static constexpr float kAirCeilingHz = 3500.0f;
  static constexpr float kAirFloor = 0.8f;  // of the note
  // The slide: the share of a step that moves, the dip on the way, and the
  // shortest a slide is.
  static constexpr float kSlideMove = 0.35f;
  static constexpr float kSlideDip = 0.2f;
  static constexpr float kSlideLeast = 0.015f;
  // A partial this near the start or the end of a slide is not a rung of it.
  static constexpr float kSlideClear = 28.0f;
  // The rip.
  static constexpr float kRipShort = 0.04f;
  static constexpr float kRipLong = 0.22f;
  static constexpr float kRipHold = 0.45f;
  static constexpr float kRipFirst = 500.0f;  // under the fundamental there is no partial
  static constexpr float kRipDip = 0.5f;
  static constexpr float kRipRough = 0.6f;
  static constexpr float kCrackSeconds = 0.005f;
  // The tremble.
  static constexpr float kTrembleCents = 28.0f;
  static constexpr float kTrembleClose = 0.55f;
  static constexpr float kTrembleOpen = 0.5f;
  static constexpr float kTrembleDelay = 0.15f;
  static constexpr float kTrembleRise = 0.4f;
  // One horn to a pitch.
  static constexpr float kOnePitchCents = 2.0f;
  static constexpr float kYieldSeconds = 0.03f;
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kRestrikeSeconds = 0.04f;
  // Spread: cents over middle E that stand all the way right.
  static constexpr float kSpreadMiddle = 4000.0f;
  static constexpr float kSpreadCents = 2400.0f;
  // Distance.
  static constexpr float kFarHz = 800.0f;
  static constexpr float kFarQuieter = 0.55f;
  static constexpr float kFieldHz = 650.0f;
  static constexpr int kTaps = 8;
  static constexpr int kRing = 32768;
  static constexpr float kAnswerGain = 0.3f;
  static constexpr float kTapSeconds[2][kTaps] = {
      {0.0113f, 0.0197f, 0.0311f, 0.0433f, 0.0569f, 0.0731f, 0.0907f, 0.1093f},
      {0.0137f, 0.0229f, 0.0347f, 0.0479f, 0.0613f, 0.0787f, 0.0953f, 0.1151f}};
  static constexpr float kTapGain[kTaps] = {0.9f, -0.8f, 0.72f, 0.62f, -0.55f, 0.47f, -0.4f, 0.34f};
  static constexpr float kRestSeconds = 0.3f;
  static constexpr float kIdleSeconds = 0.5f;

  // --- keys --------------------------------------------------------------------------------

  static float loudness(float gain) { return kQuietest + (1.0f - kQuietest) * gain; }

  void let_go(Voice& voice, float seconds) {
    if (!voice.on) return;
    voice.on = false;
    if (voice.pending) {
      voice.pending = false;  // the fade under way ends the voice
    } else if (seconds > 0.0f) {
      voice.env.fast_release(seconds);
    } else {
      voice.env.gate_off();
    }
  }

  // Take a voice for a key: now, or after the fade of what it plays.
  int take(int id, float cents, float gain) {
    bool stolen = false;
    const int index = pool_.note_on(id, &stolen);
    Voice& voice = pool_.voices[index];
    voice.id = id;
    voice.on = true;
    voice.order = ++order_;
    voice.next_key = cents;
    voice.next_loud = loudness(gain);
    if (stolen) {
      voice.pending = true;
      voice.fading = true;
    } else {
      start(index);
    }
    return index;
  }

  void chord_on(int id, float cents, float gain) {
    int waiting = -1;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.on || voice.id != id) continue;
      if (voice.pending && waiting < 0) {
        waiting = v;  // not begun: the new strike takes its place
      } else {
        let_go(voice, kRestrikeSeconds);
      }
    }
    if (waiting >= 0) {
      pool_.voices[waiting].next_key = cents;
      pool_.voices[waiting].next_loud = loudness(gain);
      return;
    }
    take(id, cents, gain);
  }

  void drop_key(int place) {
    for (int k = place; k + 1 < keys_; ++k) stack_[k] = stack_[k + 1];
    --keys_;
  }

  void push_key(int id, float cents, float gain) {
    if (keys_ == kMaxKeys) drop_key(0);
    stack_[keys_].id = id;
    stack_[keys_].cents = cents;
    stack_[keys_].gain = gain;
    ++keys_;
  }

  void solo_on(int id, float cents, float gain) {
    bool again = false;
    for (int k = 0; k < keys_; ++k) {
      if (stack_[k].id != id) continue;
      again = k == keys_ - 1 && std::fabs(stack_[k].cents - cents) < 1.0f;
      drop_key(k);
      break;
    }
    push_key(id, cents, gain);
    const bool held = solo_ >= 0 && pool_.voices[solo_].on;
    if (held && pool_.voices[solo_].pending) {
      // The horn has not begun yet: it begins on this key.
      Voice& voice = pool_.voices[solo_];
      voice.id = id;
      voice.next_key = cents;
      voice.next_loud = loudness(gain);
    } else if (held && !again) {
      slide_to(pool_.voices[solo_], stack_[keys_ - 1]);
    } else {
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        voice.on = false;
        voice.pending = false;
        if (voice.env.active()) voice.env.fast_release(kRestrikeSeconds);
      }
      solo_ = take(id, cents, gain);
    }
  }

  void solo_off(int id) {
    for (int k = 0; k < keys_; ++k) {
      if (stack_[k].id != id) continue;
      const bool top = k == keys_ - 1;
      drop_key(k);
      if (!top || solo_ < 0) return;
      Voice& voice = pool_.voices[solo_];
      if (!voice.on) return;
      if (keys_ == 0) {
        let_go(voice, 0.0f);
      } else if (voice.pending) {
        voice.id = stack_[keys_ - 1].id;
        voice.next_key = stack_[keys_ - 1].cents;
        voice.next_loud = loudness(stack_[keys_ - 1].gain);
      } else {
        slide_to(voice, stack_[keys_ - 1]);
      }
      return;
    }
  }

  // Solo and Chords change places under held keys: to Solo the newest key
  // keeps its horn and the others wait behind it; to Chords only the horn
  // that sounds is held.
  void change_play(bool solo) {
    if (solo == solo_mode_) return;
    solo_mode_ = solo;
    keys_ = 0;
    if (!solo) {
      solo_ = -1;
      return;
    }
    solo_ = -1;
    uint32_t after = 0;
    for (;;) {
      int next = -1;
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = pool_.voices[v];
        if (!voice.on || voice.order <= after) continue;
        if (next < 0 || voice.order < pool_.voices[next].order) next = v;
      }
      if (next < 0) break;
      Voice& voice = pool_.voices[next];
      const float loud = voice.pending ? voice.next_loud : voice.loud_target;
      push_key(voice.id, voice.pending ? voice.next_key : voice.key, (loud - kQuietest) / (1.0f - kQuietest));
      after = voice.order;
      if (solo_ >= 0) let_go(pool_.voices[solo_], 0.0f);
      solo_ = next;
    }
  }

  // One sample of a stolen or cancelled voice's fade; false when it stopped.
  bool fade(Voice& voice) {
    if (!voice.fading) return true;
    voice.fade -= fade_step_;
    if (voice.fade > 0.0f && voice.env.active()) return true;
    if (!voice.pending) {
      voice.env.reset();
      voice.fading = false;
      voice.fade = 1.0f;
      return false;
    }
    start(static_cast<int>(&voice - pool_.voices));
    return true;
  }

  // --- the note ----------------------------------------------------------------------------

  // What the horn makes of the voice's key now: pitch, covering, thinness.
  void aim(Voice& voice, float hand) {
    using namespace hand_horn;
    const float lip = param(kLip);
    if (voice.ask_key != voice.key || voice.ask_base != base_ || voice.ask_lip != lip) {
      voice.ask = ask(voice.key, base_, lip);
      voice.ask_key = voice.key;
      voice.ask_base = base_;
      voice.ask_lip = lip;
    }
    const Ask& a = voice.ask;
    voice.target = a.nearest_at + hand * (voice.key - a.nearest_at);
    voice.target_covering = hand * a.covering;
    voice.target_thin = hand * a.thin;
    voice.shown_partial = hand >= 0.5f ? a.from : a.nearest;
  }

  void set_times(Voice& voice, float hz) {
    using namespace hand_horn;
    voice.env.set(param(kAttack) + kit::clamp(kSpeechPeriods / hz, 0.003f, 0.12f), 0.01f, 1.0f, param(kRelease));
  }

  void start(int index) {
    using namespace hand_horn;
    Voice& voice = pool_.voices[index];
    const float sr = sample_rate();
    voice.sounded = voice.order;
    voice.pending = false;
    voice.fading = false;
    voice.fade = 1.0f;
    voice.key = voice.next_key;
    voice.loud = voice.loud_target = voice.next_loud;
    voice.velocity = (voice.next_loud - kQuietest) / (1.0f - kQuietest);
    aim(voice, hand_.value);
    voice.cents = voice.target;
    voice.covering = voice.target_covering;
    voice.thin = voice.target_thin;
    voice.sliding = false;
    voice.slide_dip = 1.0f;
    voice.age = 0.0f;
    voice.settle = -kSettleCents;
    voice.tremble_phase = 0.0f;
    voice.lone = 1.0f;
    voice.yields = false;
    voice.phase = start_.uniform();
    voice.lips = 0.0f;
    voice.rip = param(kRip);
    voice.rip_age = 0.0f;
    voice.rip_seconds = kRipShort + (kRipLong - kRipShort) * voice.rip;
    const int from = voice.ask.from;
    voice.rip_cents = from > 1 ? rung(from) - rung(from - 1) : kRipFirst;
    voice.crack = voice.crack_next = 1.0f;
    voice.crack_tick = 0.0f;
    voice.hand.reset();
    voice.air_low.reset();
    voice.air_high.reset();
    voice.env = kit::Adsr();
    voice.env.set_sample_rate(sr);
    set_times(voice, hz_of(voice.cents));
    voice.env.gate_on();
    form(voice, true);
  }

  // Another key under the same breath: every partial between is a rung, the
  // lips rest on each, and the time is shared out among them.
  void slide_to(Voice& voice, const Key& key) {
    using namespace hand_horn;
    voice.id = key.id;
    voice.order = ++order_;
    voice.key = key.cents;
    voice.loud_target = loudness(key.gain);
    voice.velocity = key.gain;
    aim(voice, hand_.value);
    voice.sliding = true;
    voice.slide_from = voice.cents;
    voice.slide_covering = voice.covering;
    voice.slide_thin = voice.thin;
    voice.slide_base = base_;
    voice.slide_seconds = 0.0f;
    voice.slide_total = param(kSlide);
    voice.slide_count = 0;
    voice.slide_way = voice.target >= voice.cents ? 1 : -1;
    if (voice.slide_total > kSlideLeast) {
      const float low = kit::min(voice.cents, voice.target) + kSlideClear - base_;
      const float high = kit::max(voice.cents, voice.target) - kSlideClear - base_;
      int first = 1, last = 0;
      if (high >= low && high >= 0.0f) {
        first = kit::clamp_int(static_cast<int>(std::ceil(std::exp2(low * (1.0f / 1200.0f)))), 1, kMaxPartial);
        last = kit::clamp_int(static_cast<int>(std::exp2(high * (1.0f / 1200.0f))), 0, kMaxPartial);
      }
      if (last >= first) {
        voice.slide_count = last - first + 1;
        voice.slide_first = voice.slide_way > 0 ? first : last;
      }
    } else {
      voice.slide_total = kSlideLeast;
    }
    voice.slide_step = voice.slide_total / (static_cast<float>(voice.slide_count) + kSlideMove);
    voice.slide_move = kSlideMove * voice.slide_step;
  }

  // Where the slide is. False when it has arrived.
  bool slide(Voice& voice) {
    using namespace hand_horn;
    voice.slide_seconds += dt_;
    int step = static_cast<int>(voice.slide_seconds / voice.slide_step);
    if (step > voice.slide_count) step = voice.slide_count;
    float u = (voice.slide_seconds - static_cast<float>(step) * voice.slide_step) / voice.slide_move;
    const bool arrived = step == voice.slide_count && u >= 1.0f;
    u = kit::clamp(u, 0.0f, 1.0f);
    const bool to_key = step == voice.slide_count;
    const int at = voice.slide_first + voice.slide_way * step;
    const float before = step == 0 ? voice.slide_from : voice.slide_base + rung(at - voice.slide_way);
    const float after = to_key ? voice.target : voice.slide_base + rung(at);
    const float covering_before = step == 0 ? voice.slide_covering : 0.0f;
    const float covering_after = to_key ? voice.target_covering : 0.0f;
    const float thin_before = step == 0 ? voice.slide_thin : 0.0f;
    const float thin_after = to_key ? voice.target_thin : 0.0f;
    const float s = u * u * (3.0f - 2.0f * u);
    voice.cents = before + (after - before) * s;
    voice.covering = covering_before + (covering_after - covering_before) * s;
    voice.thin = thin_before + (thin_after - thin_before) * s;
    voice.slide_dip = 1.0f - kSlideDip * 4.0f * u * (1.0f - u);
    if (!to_key) voice.shown_partial = u >= 0.5f || step == 0 ? at : at - voice.slide_way;
    if (arrived) voice.slide_dip = 1.0f;
    return !arrived;
  }

  // Everything about the voice that moves on the control clock, as the next
  // tick's value with a ramp to it; `now` lands instead (a fresh note).
  void form(Voice& voice, bool now) {
    using namespace hand_horn;
    const float sr = sample_rate();
    float cents = voice.cents + voice.settle;
    float covering = voice.covering;
    float extra = voice.slide_dip;

    // The rip: held under the pitch, then up through it.
    if (voice.rip > 0.0f && voice.rip_age < voice.rip_seconds) {
      const float p = voice.rip_age / voice.rip_seconds;
      const float t = kit::clamp((p - kRipHold) / (1.0f - kRipHold), 0.0f, 1.0f);
      cents -= voice.rip * voice.rip_cents * (1.0f - t * t * (3.0f - 2.0f * t));
      extra *= 1.0f - kRipDip * voice.rip * 4.0f * t * (1.0f - t);
      extra *= 1.0f - kRipRough * voice.rip * (1.0f - p) * voice.crack;
    }

    // The hand's tremble, pitch and covering together. It starts half way
    // and closes first.
    const float depth = tremble_.value;
    if (depth > 0.0f) {
      float onset = kit::clamp((voice.age - kTrembleDelay) * (1.0f / kTrembleRise), 0.0f, 1.0f);
      onset = depth * onset * onset * (3.0f - 2.0f * onset);
      const float wave = kit::SineTable::lookup(voice.tremble_phase);  // 1 closed
      cents -= kTrembleCents * onset * wave;
      covering = covering * (1.0f - onset * kTrembleOpen * (0.5f - 0.5f * wave)) +
                 (1.0f - covering) * onset * kTrembleClose * (0.5f + 0.5f * wave);
    }
    cents += kDriftCents * voice.drift.next(now ? 0 : kControlPeriod);
    voice.sounding = cents;
    voice.shown_covering = covering;

    const float hz = kit::clamp(hz_of(cents), 10.0f, 0.22f * sr);
    const float increment = hz / sr;
    // Brightness: up with the breath late, down with it at once.
    const float top = kit::lerp(kDullest, kBrightest, param(kBlow));
    const float push = (kSoftShare + (1.0f - kSoftShare) * voice.velocity) * voice.env.level();
    voice.lips += (push - voice.lips) * (push > voice.lips ? rise_ : fall_);
    const float open = kSoftest + (top - kSoftest) * voice.lips;
    const float power = kit::clamp(std::pow(hz * (1.0f / kMiddleHz), kColourPower), 0.45f, 2.6f);
    const float cap = std::exp(-0.11512925f * kCapDb * hz / (0.5f * kit::min(sr, 48000.0f)));
    const float bright =
        kit::min(std::pow(open, power), kit::min(cap, LevelTable::kMaxBrightness));

    voice.hand.set(covering * shadow_.value, now ? 0 : kControlPeriod, sr);
    const float thin_gain = kit::db_to_gain(-kLostDb * voice.thin);
    voice.lost = kLostFundamental * voice.thin;
    // A low note is all edge and little body: at one level its peaks would
    // stand far over a high note's.
    const float edge = kit::min(1.0f, std::pow(hz * (1.0f / kMiddleHz), kEdgePower));
    const float level = kVoiceGain * edge * voice.loud * voice.lone * voice.hand.gain() * extra;
    const float gain = level * thin_gain / table_.level(hz, bright);
    voice.air_gain = level * push;
    voice.air_high.set_cutoff(kit::min(kAirFloor * hz, 1500.0f), sr);
    const float place =
        spread_.value * kit::clamp((cents - kSpreadMiddle) * (1.0f / kSpreadCents), -1.0f, 1.0f);
    float left, right;
    kit::pan_gains(place, &left, &right);

    if (now) {
      voice.increment = increment;
      voice.bright = bright;
      voice.gain = gain;
      voice.left = left;
      voice.right = right;
      voice.increment_step = voice.bright_step = voice.gain_step = 0.0f;
      voice.left_step = voice.right_step = 0.0f;
      return;
    }
    const float per = 1.0f / static_cast<float>(kControlPeriod);
    voice.increment_step = (increment - voice.increment) * per;
    voice.bright_step = (bright - voice.bright) * per;
    voice.gain_step = (gain - voice.gain) * per;
    voice.left_step = (left - voice.left) * per;
    voice.right_step = (right - voice.right) * per;
  }

  // Which notes give way to another at their pitch: the newest held one
  // sounds, or the newest of all when none is held.
  void yield() {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.yields = false;
      if (!voice.env.active()) continue;
      const bool held = voice.on && !voice.pending;
      for (int w = 0; w < kMaxVoices; ++w) {
        const Voice& other = pool_.voices[w];
        if (w == v || !other.env.active()) continue;
        if (std::fabs(other.target - voice.target) >= kOnePitchCents) continue;
        const bool other_held = other.on && !other.pending;
        if (other_held != held ? other_held : other.sounded > voice.sounded) voice.yields = true;
      }
    }
  }

  void control() {
    using namespace hand_horn;
    hand_.next();
    shadow_.next();
    spread_.next();
    tremble_.next();
    const float rate = param(kTrembleRate) * dt_;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.env.active()) aim(voice, hand_.value);
    }
    yield();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      set_times(voice, hz_of(voice.target));
      voice.age += dt_;
      voice.rip_age += dt_;
      voice.settle *= settle_;
      if (voice.settle > -0.01f) voice.settle = 0.0f;
      voice.tremble_phase += rate;
      voice.tremble_phase -= std::floor(voice.tremble_phase);
      if (voice.rip > 0.0f) {
        voice.crack_tick += 1.0f;
        if (voice.crack_tick >= crack_ticks_) {
          voice.crack_tick -= crack_ticks_;
          voice.crack_next = voice.noise.uniform();
        }
        voice.crack += (voice.crack_next - voice.crack) * 0.35f;
      }
      if (voice.sliding) {
        voice.sliding = slide(voice);
      } else {
        voice.cents = near(voice.cents, voice.target, 1.0e-3f);
        voice.covering = near(voice.covering, voice.target_covering, 1.0e-5f);
        voice.thin = near(voice.thin, voice.target_thin, 1.0e-5f);
      }
      voice.loud = near(voice.loud, voice.loud_target, 1.0e-6f);
      const float step = dt_ / kYieldSeconds;
      voice.lone = voice.yields ? kit::max(0.0f, voice.lone - step) : kit::min(1.0f, voice.lone + step);
      form(voice, false);
    }
  }

  float near(float value, float target, float close) const {
    const float off = target - value;
    if (off < close && off > -close) return target;
    return value + off * follow_;
  }

  // --- the rest ----------------------------------------------------------------------------

  void clear_echoes() {
    for (int i = 0; i < kRing; ++i) ring_[i] = 0.0f;
    write_ = 0;
  }

  // A note after a rest: whatever moved in the silence is simply there.
  void restart() {
    hand_.snap(hand_.target);
    shadow_.snap(shadow_.target);
    spread_.snap(spread_.target);
    tremble_.snap(tremble_.target);
    air_.snap(air_.target);
    distance_.snap(distance_.target);
    width_.snap(width_.target);
    volume_.snap(volume_.target);
    bell_.reset();
    for (int k = 0; k < 2; ++k) {
      far_[0][k].reset();
      far_[1][k].reset();
      field_[k].reset();
    }
    clear_echoes();
    clock_.reset(kControlPeriod);
    quiet_ = 0;
  }

  void apply(int id) {
    using namespace hand_horn;
    const float value = param(id);
    switch (id) {
      case kCrook:
        base_ = crook_cents(static_cast<int>(value + 0.5f));
        break;
      case kHand:
        hand_.set(value, primed());
        break;
      case kShadow:
        shadow_.set(value, primed());
        break;
      case kBreath:
        air_.set(air_scale_ * value * value, primed());
        break;
      case kPlay:
        change_play(value < 0.5f);
        break;
      case kTremble:
        tremble_.set(value, primed());
        break;
      case kDistance:
        distance_.set(value, primed());
        break;
      case kSpread:
        spread_.set(value, primed());
        width_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock or at a note's start
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  Key stack_[kMaxKeys];
  hand_horn::Bell bell_;
  hand_horn::LevelTable table_;
  hand_horn::Waves waves_;
  kit::OnePole far_[2][2], field_[2];  // two poles each
  kit::Smoother hand_, shadow_, spread_, tremble_;        // on the control clock
  kit::Smoother air_, distance_, width_, volume_;         // per sample
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng start_;
  float base_ = 0.0f;
  float dt_ = 0.0f;
  float follow_ = 0.0f, rise_ = 0.0f, fall_ = 0.0f, settle_ = 0.0f;
  float fade_step_ = 0.0f, air_scale_ = 0.0f, crack_ticks_ = 1.0f;
  long rest_ = 1, quiet_ = 1;
  uint32_t order_ = 0;
  int solo_ = -1;
  int keys_ = 0;
  int write_ = 0;
  int tap_[2][kTaps] = {};
  bool solo_mode_ = false;
  float ring_[kRing] = {};
};

}  // namespace livemix
