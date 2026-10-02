#pragma once

// Horns: soft brass for swells and distant lines.
//
//   key down ─► breath envelope e ──┬──────────────────────────────┐
//   Blow, velocity ─► pressure P    │                              │
//                                   ▼                              │
//        P·e ─► lag (slow up, fast down) ─► brightness a           │
//                                                │                 ▼
//   per player (1 to 4):                         ▼        × e × levelling
//     detune, drift, lip settle, vibrato ─► rotor ─► series(x, a) ─┐   │
//                                           rotor at the interval ─┤   │
//                                           ─► series (Harmony)    ├─► pan ─► bus
//   noise, pulsed by player one ─► pipe comb at the note ─► × e² ──┘
//
//   bus ─► bell of the Type (fixed in hertz) ─► + lip hiss ─► volume ─► soft clip
//
// - The tone is the driven pipe of driven_pipe.h: a closed-form harmonic
//   series whose ratio between neighbours, the brightness, rises with the
//   breath pressure. So a note is brighter the louder it is, sample by
//   sample inside the note: the cue brass is known by. The brightness lags
//   a rising pressure by some tens of milliseconds and follows a falling
//   one at once, so the highs come in after the lows and leave first.
// - Loudness follows the envelope and colour follows the pressure. A bell
//   keeps the low partials in, so a soft, nearly pure note would come out
//   far quieter than a bright one and a release would fall several times
//   faster than its knob says. Each note therefore carries a small table of
//   the level its series has through the bell against its brightness, and
//   is divided by it as it goes.
// - Section brings in players two, three and four in turn and moves them
//   apart: a few cents either way, more drift, entries up to 25 ms late,
//   and places left and right (alternate notes mirror them). The section
//   keeps the power of one player. Every player's pitch starts a quarter
//   tone or less flat and settles in under a tenth of a second.
// - Harmony is a second series per player a fifth above or a fourth below,
//   sharing the player's pitch movement. It is not a pitch shifter: its
//   formant does not move and it has no splices.
// - Breath is noise through the passive pipe, scaled after the comb so it
//   follows the envelope exactly, plus an unpitched hiss past the bell.
// - A stolen voice fades over 2 ms and then starts the new note afresh.
//
// The instrument sleeps when no note sounds.

#include "../../kit/kit.h"
#include "bell.h"
#include "driven_pipe.h"
#include "params.gen.h"

namespace livemix {

class Horns : public kit::DeviceBase<horns::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  static constexpr int kPlayers = 4;
  static constexpr int kControlPeriod = 32;

  static constexpr float kMinHz = 24.5f;
  static constexpr float kMaxHz = 8000.0f;

  // The four players of a note: cents from the note at Section 1 (each note
  // varies them by a fifth either way), place in the image at Section 1,
  // how late they come in at Section 1, their drift rate, and their vibrato
  // rate (as a ratio) and delay.
  static constexpr float kDetuneCents[kPlayers] = {2.0f, -6.0f, 6.0f, -2.0f};
  static constexpr float kPosition[kPlayers] = {-0.25f, 0.25f, 0.65f, -0.65f};
  static constexpr float kLateSeconds[kPlayers] = {0.0f, 0.014f, 0.025f, 0.019f};
  static constexpr float kDriftHz[kPlayers] = {0.37f, 0.29f, 0.47f, 0.41f};
  static constexpr float kVibratoPace[kPlayers] = {1.0f, 1.06f, 0.95f, 1.03f};
  static constexpr float kVibratoDelay[kPlayers] = {0.25f, 0.36f, 0.3f, 0.42f};
  // Player two starts to play at Section 0, three at a third and four at
  // two thirds; each comes up to full over a span of a third.
  static constexpr float kPlayerEvery = 0.33f;
  static constexpr float kPlayerSpan = 0.34f;
  // Every player wanders by this many cents on their own, more in a section.
  static constexpr float kDriftCents = 1.0f;
  static constexpr float kDriftCentsSection = 2.0f;
  // A late player comes in over this long.
  static constexpr float kOnsetSeconds = 0.01f;
  // Lip settle: a player starts this flat and closes in with this time
  // constant.
  static constexpr float kSettleCents = 22.0f;
  static constexpr float kSettleCentsVaries = 12.0f;
  static constexpr float kSettleSeconds = 0.03f;
  static constexpr float kVibratoHz = 5.3f;
  static constexpr float kVibratoRiseSeconds = 0.65f;
  static constexpr float kVibratoCents = 30.0f;
  // The harmony voice: an equal-tempered fifth above or fourth below.
  static constexpr float kFifthAbove = 1.4983071f;
  static constexpr float kFourthBelow = 0.7491535f;
  // A series is kept this far down where its harmonics cross Nyquist; every
  // bell's low-pass takes what folds back from there further down.
  static constexpr float kCapDb = 50.0f;
  // The series never gets brighter than this, and its level through the
  // bell is tabulated at this many brightnesses from zero up to it.
  static constexpr float kMaxBrightness = 0.92f;
  static constexpr int kLevelPoints = 13;
  static constexpr int kLevelHarmonics = 128;
  // Levelling never lifts a note by more than this over a partial sitting
  // on the bell's peak (notes far under a mute, which nobody plays).
  static constexpr float kMaxLevelling = 1.0e6f;  // as power: 60 dB
  // Brightness follows a falling pressure in this time.
  static constexpr float kFallSeconds = 0.005f;
  // The pressure wanders by this share, slowly, so a held note's colour
  // does not stand still.
  static constexpr float kPressureDrift = 0.04f;
  static constexpr float kPressureDriftHz = 1.1f;
  // Breath: how deeply the noise pulses with the lips, the pipe's feedback
  // and loss, its level against the tone at Breath 1, and the unpitched
  // hiss beside it.
  static constexpr float kBreathPulse = 0.6f;
  static constexpr float kPipeFeedback = 0.88f;
  static constexpr float kPipeDampingHz = 4000.0f;
  static constexpr float kBreathGain = 1.0f;
  static constexpr float kHissGain = 0.25f;
  static constexpr float kHissHz = 3500.0f;
  static constexpr float kHissQ = 0.7f;
  // One note at full velocity and Blow has this RMS before Volume.
  static constexpr float kVoiceGain = 0.14f;
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kTypeFadeSeconds = 0.03f;

  void init(float sample_rate) {
    using namespace horns;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      const uint32_t seed = 0x9E3779B9u * static_cast<uint32_t>(v + 1);
      voice.noise.seed(seed ^ 0x0BADC0DEu);
      voice.pressure_drift.seed(seed ^ 0x2468ACE1u);
      voice.pressure_drift.set_rate(kPressureDriftHz, sr);
      for (int k = 0; k < kPlayers; ++k) {
        voice.player[k].drift.seed((seed + 0x632BE5ABu * static_cast<uint32_t>(k + 1)) ^ 0x51ED270Bu);
        voice.player[k].drift.set_rate(kDriftHz[k], sr);
      }
    }
    start_.seed(0xA5A5F00Du);
    hiss_noise_.seed(0xC0FFEE11u);
    hiss_.reset();
    hiss_.set(kHissHz, kHissQ, sr);
    // White noise of variance 1/3 through a band-pass of unit peak gain.
    hiss_scale_ = kHissGain * kVoiceGain * 0.5f /
                  std::sqrt(kit::kPi * kit::min(kHissHz, 0.45f * sr) / (kHissQ * sr) / 3.0f);
    section_.set_time(0.02f, control_rate);
    harmony_.set_time(kSmoothingSeconds, sr);
    breath_.set_time(kSmoothingSeconds, sr);
    air_scale_.set_time(0.01f, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    fall_ = 1.0f - kit::time_to_coeff(kFallSeconds, sr);
    gain_coeff_ = 1.0f - kit::time_to_coeff(0.005f, sr);
    onset_coeff_ = 1.0f - kit::time_to_coeff(kOnsetSeconds, control_rate);
    settle_coeff_ = kit::time_to_coeff(kSettleSeconds, control_rate);
    steal_step_ = 1.0f / (kStealSeconds * sr);
    fade_step_ = 1.0f / (kTypeFadeSeconds * sr);
    fading_ = false;
    fade_ = 0.0f;
    interval_up_ = true;
    breath_on_ = false;
    rebuild_turn_ = 0;
    type_ = -1;
    clock_.reset(kControlPeriod);
    // Nothing outlives the envelopes but the ring of the bell filters.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kit::min(kMaxHz, 0.2f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: let the old note go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) let_go(pool_.voices[held], true);

    bool stolen = false;
    const int index = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[index];
    if (stolen) {
      // Fade the old note over 2 ms, then start (see process).
      voice.pending = true;
      voice.fading = false;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
    } else {
      start(voice, index, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) let_go(pool_.voices[held], false);
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    if (was_asleep) wake();
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control(sr);

      // The harmony voice: its level is the knob's distance from centre,
      // and its interval changes as the knob passes centre, where it is
      // silent.
      const float harmony = harmony_.next();
      if (harmony != 0.0f && (harmony > 0.0f) != interval_up_) set_interval(harmony > 0.0f, sr);
      const float harmony_level = std::fabs(harmony);
      const bool harmony_on = harmony_level > 0.0f;
      const float main_gain = 1.0f / std::sqrt(1.0f + harmony_level * harmony_level);
      const float harmony_gain = harmony_level * main_gain;

      float left = 0.0f, right = 0.0f, air = 0.0f, rushing = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        float leaving = 1.0f;
        if (voice.pending || voice.fading) {
          // A stolen or cancelled voice: out over 2 ms, then the new note
          // or nothing.
          voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
          if (voice.steal <= 0.0f || !voice.env.active()) {
            if (voice.pending) {
              start(voice, v, voice.pending_frequency, voice.pending_gain);
            } else {
              voice.env.reset();
              voice.fading = false;
            }
          }
          leaving = voice.steal;
        }
        if (!voice.env.active()) continue;
        const float env = voice.env.next();

        // Brightness follows the pressure: late on the way up, at once on
        // the way down.
        const float wanted = kit::min(soft_ + span_ * voice.push * env, voice.cap);
        float a = voice.bright;
        a += (wanted - a) * (wanted > a ? rise_ : fall_);
        voice.bright = a;
        const float k1 = 1.0f + a * a, k2 = 2.0f * a;
        const float ah = kit::min(a, voice.harmony_cap);
        const float h1 = 1.0f + ah * ah, h2 = 2.0f * ah;

        float voice_left = 0.0f, voice_right = 0.0f;
        for (int k = 0; k < kPlayers; ++k) {
          Player& player = voice.player[k];
          if (!player.sounding) continue;
          player.main.tick();
          float tone = main_gain * player.main.s / (k1 - k2 * player.main.c);
          if (harmony_on) {
            player.harmony.tick();
            tone += harmony_gain * player.harmony.s / (h1 - h2 * player.harmony.c);
          }
          voice_left += tone * player.left;
          voice_right += tone * player.right;
          player.left += player.left_step;
          player.right += player.right_step;
        }
        voice.gain += (voice.gain_target - voice.gain) * gain_coeff_;
        const float gain = env * voice.gain * leaving;
        left += voice_left * gain;
        right += voice_right * gain;

        if (breath_on_) {
          // Air: noise that rushes as the lips open, through the tube.
          const float noise = voice.noise.bipolar() * (1.0f + kBreathPulse * voice.player[0].main.c);
          const float rush = env * env * voice.loudness * leaving;
          air += voice.comb.process(noise) * rush;
          rushing += rush * rush;
        }
      }
      const float breath = breath_.next();
      const float piped = air * breath * air_scale_.next();
      left += piped;
      right += piped;

      const float bus_left = left, bus_right = right;
      bell_[0].process(bus_left, bus_right, &left, &right);
      if (fading_) {
        // A Type change: the new bell comes in beside the old one.
        float new_left, new_right;
        bell_[1].process(bus_left, bus_right, &new_left, &new_right);
        fade_ = kit::min(fade_ + fade_step_, 1.0f);
        left += (new_left - left) * fade_;
        right += (new_right - right) * fade_;
      }
      if (breath_on_) {
        // Unpitched air at the lips, past the bell. The noise is drawn only
        // while a note rushes, so it does not depend on when the device
        // last slept.
        const float rush = rushing > 0.0f ? hiss_noise_.bipolar() * std::sqrt(rushing) : 0.0f;
        const float hiss = hiss_.bandpass(rush) * breath * hiss_scale_;
        left += hiss;
        right += hiss;
      }
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Player {
    horns::Rotor main, harmony;
    kit::Drift drift;
    float level = 0.0f;          // weight in the section, eased on the control clock
    float left = 0.0f, right = 0.0f;            // level and place, ramped per sample
    float left_step = 0.0f, right_step = 0.0f;
    float left_next = 0.0f, right_next = 0.0f;  // where the ramps land
    float wait = 0.0f;           // seconds until this player comes in
    float age = 0.0f;            // seconds since, for the vibrato onset
    float settle = 0.0f;         // cents, negative, closing in on zero
    float vibrato_phase = 0.0f;
    float detune = 0.0f;         // cents from the note at Section 1
    float position = 0.0f;       // -1 left .. 1 right at Section 1
    bool sounding = false;
  };

  struct Voice {
    Player player[kPlayers];
    kit::Adsr env;
    horns::PipeComb<4096> comb;
    kit::Rng noise;
    kit::Drift pressure_drift;
    float frequency = 220.0f;
    float velocity = 0.0f;
    float push = 0.0f;           // pressure at full envelope: Blow, velocity, drift
    float loudness = 0.0f;       // level at full envelope: velocity alone
    float cap = 0.0f, harmony_cap = 0.0f;  // brightest clean series, note and harmony
    float bright = 0.0f;         // the series' ratio now
    float gain = 0.0f;           // loudness and levelling, smoothed per sample
    float gain_target = 0.0f;
    // The level of the series through the bell against brightness, as the
    // logarithm of its power (kLevelPoints from 0 to kMaxBrightness; the
    // logarithm is what stays near a straight line between them): the note
    // and its harmony voice.
    float level_main[kLevelPoints] = {};
    float level_harmony[kLevelPoints] = {};
    float steal = 1.0f;
    float pending_frequency = 220.0f, pending_gain = 0.0f;
    bool pending = false;        // stolen: a new note starts when this one has faded
    bool fading = false;         // cancelled: fades and stops
    bool stale = false;          // the bell or the interval changed: tabulate again
    bool fresh = false;          // started since the last control tick

    bool active() const { return env.active() || pending; }
    bool releasing() const { return !pending && (env.releasing() || fading); }
    float level() const { return env.level(); }
  };

  // Release a held voice. A voice whose note has not started yet (it is
  // still fading the note it was stolen from) never sounds.
  static void let_go(Voice& voice, bool quickly) {
    if (voice.pending) {
      voice.pending = false;
      voice.fading = true;
    } else if (quickly) {
      voice.env.fast_release(0.03f);
    } else {
      voice.env.gate_off();
    }
  }

  float interval() const { return interval_up_ ? kFifthAbove : kFourthBelow; }

  void start(Voice& voice, int index, float frequency, float gain) {
    using namespace horns;
    const float sr = sample_rate();
    voice.frequency = frequency;
    voice.velocity = gain;
    voice.cap = kit::min(brightness_cap(frequency, sr, kCapDb), kMaxBrightness);
    voice.harmony_cap = kit::min(brightness_cap(frequency * interval(), sr, kCapDb), kMaxBrightness);
    voice.bright = kit::min(soft_, voice.cap);
    voice.comb.clear();
    voice.comb.tune(frequency, kPipeFeedback, kPipeDampingHz, sr);
    const float section = param(kSection);
    // Sections alternate sides from note to note.
    const float side = (index & 1) ? -1.0f : 1.0f;
    for (int k = 0; k < kPlayers; ++k) {
      Player& player = voice.player[k];
      player.main.tune(frequency, sr);
      player.main.start(start_.uniform());
      player.harmony.tune(frequency * interval(), sr);
      player.harmony.start(start_.uniform());
      player.detune = kDetuneCents[k] * (0.8f + 0.4f * start_.uniform());
      player.position = kPosition[k] * side;
      player.wait = kLateSeconds[k] * (0.5f + 0.5f * start_.uniform()) * section;
      player.age = 0.0f;
      player.settle = -(kSettleCents + kSettleCentsVaries * start_.uniform());
      player.vibrato_phase = start_.uniform();
      player.level = 0.0f;
      player.left = player.right = 0.0f;
      player.left_step = player.right_step = 0.0f;
      player.left_next = player.right_next = 0.0f;
      player.sounding = false;
    }
    voice.steal = 1.0f;
    voice.pending = voice.fading = false;
    voice.stale = false;
    voice.fresh = true;
    tabulate(voice);
    breathe(voice, 0.0f);
    voice.gain_target = levelled(voice);
    voice.gain = voice.gain_target;
    voice.env.reset();
    voice.env.set(attack_for(voice), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  // The envelope's attack: the knob, plus the time the tube takes to speak,
  // which is a number of periods and so longer for low notes.
  float attack_for(const Voice& voice) const {
    return param(horns::kAttack) + kit::clamp(speech_periods_ / voice.frequency, 0.005f, 0.15f);
  }

  // Pressure from Blow and velocity, loudness from velocity alone (a harder
  // blow is brighter at the same level); `drift` in -1..1.
  void breathe(Voice& voice, float drift) {
    const float blow = param(horns::kBlow);
    voice.push = (0.2f + 0.8f * blow) * (0.15f + 0.85f * voice.velocity) * (1.0f + kPressureDrift * drift);
    voice.loudness = 0.3f + 0.7f * voice.velocity;
  }

  // Tabulate the level of one series through the bell against brightness.
  void tabulate_series(float frequency, float cap, float* level) const {
    const float sr = sample_rate();
    const horns::BellBank& bell = bell_[fading_ ? 1 : 0];
    float ratio[kLevelPoints], weight[kLevelPoints], power[kLevelPoints];
    for (int p = 0; p < kLevelPoints; ++p) {
      const float a =
          kit::min(kMaxBrightness * static_cast<float>(p) / static_cast<float>(kLevelPoints - 1), cap);
      ratio[p] = a * a;
      weight[p] = 1.0f;
      power[p] = 0.0f;
    }
    int harmonics = static_cast<int>(0.5f * sr / frequency);
    if (harmonics > kLevelHarmonics) harmonics = kLevelHarmonics;
    // cos(h·w) by Chebyshev's recurrence, in double so it holds for 128 steps.
    const double first = std::cos(6.283185307179586 * static_cast<double>(frequency) / sr);
    double before = 1.0, cosine = first;
    for (int h = 1; h <= harmonics; ++h) {
      const float through = bell.power_at(1.0 - cosine);
      for (int p = 0; p < kLevelPoints; ++p) {
        power[p] += weight[p] * through;
        weight[p] *= ratio[p];
      }
      const double next = 2.0 * first * cosine - before;
      before = cosine;
      cosine = next;
    }
    const float least = bell.peak_power() / kMaxLevelling;
    for (int p = 0; p < kLevelPoints; ++p) level[p] = std::log(kit::max(power[p], least));
  }

  void tabulate(Voice& voice) {
    tabulate_series(voice.frequency, voice.cap, voice.level_main);
    tabulate_series(voice.frequency * interval(), voice.harmony_cap, voice.level_harmony);
  }

  // The gain that gives a note its loudness whatever its colour: over the
  // level its series, and its harmony voice's, have through the bell now.
  float levelled(const Voice& voice) const {
    const float at = voice.bright * (static_cast<float>(kLevelPoints - 1) / kMaxBrightness);
    int index = static_cast<int>(at);
    if (index > kLevelPoints - 2) index = kLevelPoints - 2;
    const float t = at - static_cast<float>(index);
    float power = std::exp(kit::lerp(voice.level_main[index], voice.level_main[index + 1], t));
    const float level = std::fabs(harmony_.value);
    if (level > 0.0f) {
      // The note and its copy, mixed as process() mixes them.
      const float copy = std::exp(kit::lerp(voice.level_harmony[index], voice.level_harmony[index + 1], t));
      const float l2 = level * level;
      power = (power + l2 * copy) / (1.0f + l2);
    }
    return voice.loudness * kVoiceGain / std::sqrt(power);
  }

  // Every 32 samples: the section, each player's pitch and place, each
  // note's pressure and level, and the bell when the Type has changed.
  void control(float sr) {
    using namespace horns;
    const float dt = static_cast<float>(kControlPeriod) / sr;
    const float step = 1.0f / static_cast<float>(kControlPeriod);

    if (fading_ && fade_ >= 1.0f) {
      bell_[0] = bell_[1];
      fading_ = false;
    }
    if (!fading_ && wanted_type_ != type_) change_type(wanted_type_, true);
    breath_on_ = breath_.value != 0.0f || breath_.target != 0.0f;

    // The section: who plays, and how far apart.
    const float section = section_.next();
    float weight[kPlayers];
    weight[0] = 1.0f;
    float sum = 1.0f;
    for (int k = 1; k < kPlayers; ++k) {
      weight[k] = kit::clamp((section - static_cast<float>(k - 1) * kPlayerEvery) / kPlayerSpan, 0.0f, 1.0f);
      sum += weight[k] * weight[k];
    }
    const float even = 1.0f / std::sqrt(sum);
    const float drift_cents = kDriftCents + kDriftCentsSection * section;
    const float vibrato_cents = kVibratoCents * param(kVibrato);
    const float vibrato_step = kVibratoHz * dt;
    const float release = param(kRelease);

    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      voice.env.set(attack_for(voice), 0.01f, 1.0f, release);
      breathe(voice, voice.pressure_drift.next(kControlPeriod));
      for (int k = 0; k < kPlayers; ++k) {
        Player& player = voice.player[k];
        float target = weight[k] * even;
        if (target == 0.0f && player.level == 0.0f) {
          player.sounding = player.left != 0.0f || player.right != 0.0f;
          if (!player.sounding) continue;  // not in the section
        }
        if (player.wait > 0.0f) {
          player.wait -= dt;
          target = 0.0f;
        } else {
          player.age += dt;
          player.settle *= settle_coeff_;
          if (player.settle > -0.01f) player.settle = 0.0f;
        }
        if (voice.fresh && k == 0) {
          player.level = target;  // the first player is there from the start
        } else {
          player.level += (target - player.level) * onset_coeff_;
          if (player.level < 1.0e-5f && target == 0.0f) player.level = 0.0f;
        }
        const float cents = player.detune * section + drift_cents * player.drift.next(kControlPeriod) +
                            player.settle + vibrato_cents * vibrato(player, k, vibrato_step);
        // 2^(cents/1200) to second order: exact to 0.01 cent over ±100 cents.
        const float x = cents * (0.69314718f / 1200.0f);
        const float ratio = 1.0f + x + 0.5f * x * x;
        player.main.bend(ratio);
        player.harmony.bend(ratio);
        // Equal-power place: cos and sin of (1 + position)·π/4, by series
        // in the offset from the centre, so the centre is exactly even.
        const float angle = player.position * section * (0.25f * kit::kPi);
        const float a2 = angle * angle;
        const float cosine = 1.0f - a2 * (0.5f - a2 * (1.0f / 24.0f - a2 * (1.0f / 720.0f)));
        const float sine = angle * (1.0f - a2 * (1.0f / 6.0f - a2 * (1.0f / 120.0f)));
        player.left = player.left_next;
        player.right = player.right_next;
        player.left_next = player.level * kit::kSqrtHalf * (cosine - sine);
        player.right_next = player.level * kit::kSqrtHalf * (cosine + sine);
        player.left_step = (player.left_next - player.left) * step;
        player.right_step = (player.right_next - player.right) * step;
        player.sounding = true;
      }
      voice.fresh = false;
      voice.gain_target = levelled(voice);
    }

    // After a change of bell or interval: one note's table per tick.
    for (int n = 0; n < kMaxVoices; ++n) {
      Voice& turn = pool_.voices[rebuild_turn_];
      if (++rebuild_turn_ >= kMaxVoices) rebuild_turn_ = 0;
      if (turn.stale && turn.env.active()) {
        turn.stale = false;
        tabulate(turn);
        break;
      }
    }
  }

  // One player's vibrato, -1..1: none at first, then in over
  // kVibratoRiseSeconds. `step` is the cycles the common rate turns per tick.
  static float vibrato(Player& player, int k, float step) {
    const float t = kit::clamp((player.age - kVibratoDelay[k]) / kVibratoRiseSeconds, 0.0f, 1.0f);
    const float onset = t * t * (3.0f - 2.0f * t);
    player.vibrato_phase += step * kVibratoPace[k];
    player.vibrato_phase -= std::floor(player.vibrato_phase);
    return onset * kit::SineTable::lookup(player.vibrato_phase);
  }

  // The harmony voice moves to the other interval (while it is silent).
  void set_interval(bool up, float sr) {
    interval_up_ = up;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      const float frequency = voice.frequency * interval();
      voice.harmony_cap = kit::min(horns::brightness_cap(frequency, sr, kCapDb), kMaxBrightness);
      for (int k = 0; k < kPlayers; ++k) voice.player[k].harmony.tune(frequency, sr);
      voice.stale = true;
    }
  }

  // Another instrument: its lips at once (the brightness lag eases them
  // in), its bell crossfaded in beside the old one when notes are sounding.
  void change_type(int type, bool glide) {
    const horns::Voicing& v = horns::voicing(type);
    const float sr = sample_rate();
    type_ = type;
    soft_ = v.soft;
    span_ = v.hard - v.soft;
    rise_ = 1.0f - kit::time_to_coeff(v.lag_seconds, sr);
    speech_periods_ = v.speech_periods;
    if (glide) {
      bell_[1].set(v, sr);
      bell_[1].reset();
      fading_ = true;
      fade_ = 0.0f;
    } else {
      bell_[0].set(v, sr);
      bell_[0].reset();
      fading_ = false;
    }
    const horns::BellBank& bell = bell_[fading_ ? 1 : 0];
    // Breath keeps its loudness under the tone whatever the bell: noise of
    // variance (1 + pulse²/2)/3, through the comb and the bell.
    const float variance = (1.0f + 0.5f * kBreathPulse * kBreathPulse) / 3.0f;
    const float comb = 1.0f / (1.0f - kPipeFeedback * kPipeFeedback);
    air_scale_.set(kBreathGain * kVoiceGain * 0.5f / std::sqrt(variance * comb * bell.noise_power()),
                   glide);
    for (int n = 0; n < kMaxVoices; ++n) pool_.voices[n].stale = true;
  }

  // Back from sleep: whatever moved while nothing sounded is simply there,
  // and the control clock starts on the first sample.
  void wake() {
    section_.snap(section_.target);
    harmony_.snap(harmony_.target);
    breath_.snap(breath_.target);
    air_scale_.snap(air_scale_.target);
    volume_.snap(volume_.target);
    if (fading_) {
      bell_[0] = bell_[1];
      fading_ = false;
    }
    if (wanted_type_ != type_) change_type(wanted_type_, false);
    bell_[0].reset();
    hiss_.reset();
    rebuild_turn_ = 0;
    clock_.reset(kControlPeriod);
  }

  void apply(int id) {
    using namespace horns;
    const float value = param(id);
    // Glide only while something can be heard.
    const bool glide = primed() && !idle_.asleep();
    switch (id) {
      case kType:
        wanted_type_ = static_cast<int>(value + 0.5f);
        // Otherwise control() brings the new bell in beside the old one.
        if (!glide) change_type(wanted_type_, false);
        break;
      case kBreath:
        breath_.set(value * value, glide);
        break;
      case kSection:
        section_.set(value, glide);
        break;
      case kHarmony:
        harmony_.set(value, glide);
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), glide);
        break;
      default:
        break;  // read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  horns::BellBank bell_[2];  // the bell, and the one coming in on a Type change
  kit::Svf hiss_;
  kit::Rng start_, hiss_noise_;
  kit::Smoother section_;                               // read on the control clock
  kit::Smoother harmony_, breath_, air_scale_, volume_;  // read per sample
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  // The lips of the Type.
  float soft_ = 0.05f, span_ = 0.8f, rise_ = 0.0f, speech_periods_ = 8.0f;
  float fall_ = 0.0f;
  float gain_coeff_ = 0.0f;
  float onset_coeff_ = 0.0f;
  float settle_coeff_ = 0.0f;
  float steal_step_ = 0.0f;
  float hiss_scale_ = 0.0f;
  float fade_ = 0.0f, fade_step_ = 0.0f;
  int type_ = -1, wanted_type_ = 0;
  int rebuild_turn_ = 0;
  bool fading_ = false;
  bool interval_up_ = true;
  bool breath_on_ = false;
};

}  // namespace livemix
