#pragma once

// Breath Pacer: a breath pattern in counted seconds, heard as a swell.
//
//   keys (up to 8) ─► tone at the key: a sine and three partials ──┐
//                     × the key's envelope and gain                 ├─► × level ─┐
//   two noises ─► pink ─► spread ─► low cut ─► low pass (open) ────┘            ├─► volume ─► soft clip ─► out
//   keys ─► a struck mark at each of the two turns, at its own level ───────────┘
//
// One cycle has four parts, each with its own length in seconds: In (the
// breath fills), Hold (full), Out (it empties) and Rest (empty). The breath b
// runs from 0 (empty) to 1 (full):
//
//   In    b = rise(t)        Hold  b = 1
//   Out   b = 1 - rise(t)    Rest  b = 0            t = 0..1 through the part
//   rise(t) = t + kEase·(½ - ½·cos(π·t) - t)        half a line, half a soft S
//
// and two things follow it:
//
//   level   gain = floor + (1 - floor)·b, floor = Floor²: silence at the
//           bottom at Floor 0, a quarter of the crest (12 dB down) at a
//           half, no movement at 1
//   open    how open the sound is, 0.5 + Bright·(b - 0.5): a half whatever
//           the breath does at Bright 0, the breath itself at Bright 1. The
//           tone's partials 2, 3 and 4 stand at 0.6·open, 0.4·open² and
//           0.25·open³ of its first, and the air's low pass is 3 dB down at
//           kAirLowHz·(kAirHighHz / kAirLowHz)^open (300 Hz shut, 1.3 kHz
//           at a half, 6 kHz open).
//
// - ONE clock for the device, counted in samples in a double: the place in
//   the part as it is set, moved on each sample by the speed (1, or less
//   while the cycle is slowed). It starts at In on the sample where a key
//   arrives with no voice sounding; a later key joins where it stands; a key
//   up lets its voice go at once (Release) and the clock runs on while any
//   voice still sounds. Nothing here is set per host block.
// - A change of a length changes the speed, never the place, so the level
//   does not step. A Hold or a Rest of 0 takes no time at all.
// - The marks: at the first sample of In every sounding key strikes a soft
//   sine at its own pitch, and at the first sample of Out one a fifth below
//   (two thirds of the key). They rise over 5 ms, fall 60 dB in half a second
//   and end in exact zeros. With Hold at 0 the Out mark is the one mark of
//   the turn; where a Hold begins there is none. A key that joins waits for
//   the next turn, and does not move the marks that are ringing. A key taken
//   up again while it lets go brings its ringing mark back as its tone. A mark
//   is not shaped by the breath's level.
// - The slow down: the speed glides from 1 to 1 / Slow to over Over minutes
//   by ratio and in closed form (kit::RateGlide), so the whole cycle grows
//   to Slow to times its length. Slow to and Over arm it; In, Hold, Out and
//   Rest do not. Armed with a key open it starts at that sample, otherwise at
//   the first key; it counts on through releases, new keys and sleep, then
//   holds. Over at 0 is off.
// - The sum of the keys is scaled by 1 / √max(1, Σ envelope²) (the tone by
//   the keys' envelopes, the marks by the gates of the keys whose marks are
//   ringing), so a chord is as loud as one key and a full pool of eight stays
//   under the clip's knee. The air is one stereo noise, as loud as one key
//   whatever the count. The soft clip is a guard only. While the summed
//   envelopes stand over 1 the scale makes up for their fall, so a chord let
//   go together keeps its level for the first tenth of Release or so (five
//   keys are 6 dB down after 0.18 of it where one key takes 0.10).
// - The air is pink noise (kit::ColourFilter, one level at every sample
//   rate) from two unlike streams, spread by the Ears law at a half: its side
//   is 6 dB under its mid, so it folds to mono without loss. The tone and the
//   marks are the same in both ears.
// - Sleep: the device is idle once no voice sounds. The clock, the noise, the
//   filters and the smoothed controls all start again from one known state at
//   the first key after that (restart), which is exact to the sample, so the
//   output is the same at any block size across any silence and a knob moved
//   in silence is simply there. Only the slow down runs on, by a count.
//
// Storage: eight voices, two colour filters, one table of 257 floats and the
// block buffers. Well under 1 MB.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "../../kit/colour.h"
#include "params.gen.h"

namespace livemix {

class BreathPacer : public kit::DeviceBase<breath_pacer::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  enum Stage : int { kStageIn = 0, kStageHold, kStageOut, kStageRest, kNumStages };

  // How much of the soft S is in a rise: 0 is a straight line, 1 half a cosine.
  static constexpr float kEase = 0.5f;
  // A key comes in over this long and a stolen voice goes out over that.
  static constexpr float kAttackSeconds = 0.05f;
  static constexpr float kStealSeconds = 0.006f;
  // The marks: their rise, their fall of 60 dB, where they end, the Out
  // mark's pitch against the key (a fifth below) and the marks' own way in.
  static constexpr float kMarkAttackSeconds = 0.005f;
  static constexpr float kMarkDecaySeconds = 0.5f;
  static constexpr float kMarkFloor = 1.0e-5f;
  static constexpr double kMarkOutRatio = 2.0 / 3.0;
  static constexpr float kMarkGateSeconds = 0.0005f;
  // The air: its colour (pink), how far it is spread, its low cut, and the
  // two ends of its low pass.
  static constexpr float kAirColour = 0.5f;
  static constexpr float kAirEars = 0.5f;
  static constexpr float kAirLowCutHz = 150.0f;
  static constexpr float kAirLowHz = 300.0f;
  static constexpr float kAirHighHz = 6000.0f;
  // Levels at a knob's top, for one key at full gain before Volume: the
  // tone's first partial, the air (the gain on the coloured noise) and a
  // mark's peak.
  static constexpr float kToneGain = 0.63f;
  static constexpr float kAirGain = 2.5f;
  static constexpr float kMarkGain = 1.25f;
  // Keys outside this are held to it.
  static constexpr float kLowestHz = 8.0f;
  static constexpr float kHighestHz = 12000.0f;

  // The way in at `t` (0..1). Needs kit::SineTable::init() (init does it).
  static float rise(float t) {
    const float soft = 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * t);
    return t + kEase * (soft - t);
  }

  // How full the breath is at `t` through a part: 0 empty, 1 full.
  static float breath_at(int stage, float t) {
    switch (stage) {
      case kStageIn:
        return rise(t);
      case kStageHold:
        return 1.0f;
      case kStageOut:
        return 1.0f - rise(t);
      default:
        return 0.0f;
    }
  }

  // The gain at the bottom of the breath for a Floor of 0..1.
  static float floor_gain(float floor) { return floor * floor; }
  // The gain of the breathing sound for a Floor and a breath.
  static float level_gain(float floor, float breath) {
    const float gain = floor_gain(floor);
    return gain + (1.0f - gain) * breath;
  }
  // How open the sound is for a Bright and a breath, 0..1.
  static float openness(float bright, float breath) { return 0.5f + bright * (breath - 0.5f); }
  // Where the air's low pass is 3 dB down, in Hz.
  static float air_cutoff_hz(float open) { return kAirLowHz * std::pow(kAirHighHz / kAirLowHz, open); }
  // The level of the tone's partial `n` (1 to 4) against its first.
  static float partial_weight(int n, float open) {
    switch (n) {
      case 1:
        return 1.0f;
      case 2:
        return 0.6f * open;
      case 3:
        return 0.4f * open * open;
      case 4:
        return 0.25f * open * open * open;
      default:
        return 0.0f;
    }
  }

  void init(float sample_rate) {
    using namespace breath_pacer;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      voice.gate.set_sample_rate(sr);
      voice.gain.set_time(kSmoothingSeconds, sr);
    }
    for (int i = 0; i <= kAirSteps; ++i) {
      const float hz = air_cutoff_hz(static_cast<float>(i) / kAirSteps);
      air_g_[i] = std::tan(kit::kPi * kit::min(hz, 0.45f * sr) / sr);
    }
    for (int c = 0; c < 2; ++c) {
      colour_[c].init(sr);
      colour_[c].set_colour(kAirColour);
      air_cut_[c].set_cutoff(kAirLowCutHz, sr);
    }
    mark_decay_ = std::exp(-6.907755279f / (kMarkDecaySeconds * sr));
    mark_attack_ = kit::max(1.0f, kMarkAttackSeconds * sr);
    steal_step_ = 1.0f / kit::max(1.0f, kStealSeconds * sr);
    kit::Smoother* const smoothers[] = {&air_, &tone_, &marks_, &bright_, &floor_, &volume_};
    for (kit::Smoother* smoother : smoothers) smoother->set_time(kSmoothingSeconds, sr);
    for (double& length : len_) length = 0.0;
    glide_.reset(sr);
    // Nothing outlives the voices: no delay, no tail.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
    strike_ = 0;
    running_ = false;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // not a number: no note
    frequency = kit::clamp(frequency, kLowestHz, kHighestHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // The first key from silence starts the breath at In.
    if (pool_.count_active() == 0) restart();
    glide_.key();

    const int own = find_own(note_id);
    if (own >= 0) {
      Voice& voice = pool_.voices[own];
      if (voice.waiting || voice.fade_step > 0.0f) {
        // Its voice is still fading for it: the waiting note is this one.
        voice.waiting = true;
        voice.next_frequency = frequency;
        voice.next_gain = gain;
        return;
      }
      // A key struck again, held or letting go, takes its own voice up again
      // where it is: nothing stacks and nothing starts over.
      set_frequency(voice, frequency);
      voice.gain.set_target(gain);
      voice.env.gate_on();
      // A mark of this key may still be ringing under its release: its gate
      // comes back as the key's tone does, never at once.
      voice.gate_attack = kAttackSeconds;
      voice.gate.set(voice.gate_attack, voice.gate_attack, 1.0f, param(breath_pacer::kRelease));
      voice.gate.gate_on();
      return;
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // The old note fades out first; the new one waits in the voice.
      voice.waiting = true;
      voice.next_frequency = frequency;
      voice.next_gain = gain;
      if (voice.fade_step == 0.0f) voice.fade_step = steal_step_;
    } else {
      start(voice, frequency, gain, -1);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.waiting) {
      voice.waiting = false;  // let go before it began: the fade just finishes
    } else {
      voice.env.gate_off();
      voice.gate.gate_off();
    }
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, where the breath is in its cycle as it is set (0 at the start of In, 1
  // at the end of Rest, each part taking its share of the four lengths; 0
  // when nothing sounds);
  // 1, how far through the slow down is (0 until it starts, 1 once it holds);
  // 2, how many times its set length the cycle is now.
  float meter(int index) const {
    if (index == 0) {
      if (!running_) return 0.0f;
      double before = 0.0, total = 0.0;
      for (int s = 0; s < kNumStages; ++s) {
        if (s < stage_) before += len_[s];
        total += len_[s];
      }
      return static_cast<float>((before + pos_) / total);
    }
    if (index == 1) return glide_.place();
    if (index == 2) return static_cast<float>(1.0 / glide_.rate());
    return 0.0f;
  }

  // The length of the whole cycle now, slow down included, in seconds.
  double cycle_seconds() const {
    return (len_[0] + len_[1] + len_[2] + len_[3]) / static_cast<double>(sample_rate()) / glide_.rate();
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      // Idle: only the slow down runs on, by the same count.
      glide_.advance(frames);
      running_ = false;
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    const kit::EarGains spread = kit::ear_gains(kAirEars);
    for (int i = 0; i < frames; ++i) {
      const double speed = glide_.step();

      // The first sample of In or of Out: every sounding key strikes.
      if (strike_ != 0) {
        for (int v = 0; v < kMaxVoices; ++v) {
          Voice& voice = pool_.voices[v];
          if (!voice.env.active() || voice.waiting) continue;
          if (strike_ & kStrikeIn) strike(voice.mark[0], voice.frequency);
          if (strike_ & kStrikeOut) strike(voice.mark[1], voice.frequency * kMarkOutRatio);
        }
        strike_ = 0;
      }

      // Where the breath is, and what follows it.
      const float t = len_[stage_] > 0.0 ? static_cast<float>(pos_ / len_[stage_]) : 0.0f;
      const float breath = breath_at(stage_, t);
      const float floor = floor_.next();
      const float level = floor + (1.0f - floor) * breath;
      const float open = openness(bright_.next(), breath);
      const float weight2 = partial_weight(2, open);
      const float weight3 = partial_weight(3, open);
      const float weight4 = partial_weight(4, open);

      // The keys: the tone and the marks, and what the sums are scaled by.
      float tone = 0.0f, marks = 0.0f;
      float power = 0.0f, mark_power = 0.0f, presence = 0.0f;
      bool sounding = false;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) {
          if (!voice.waiting) continue;
          start(voice, voice.next_frequency, voice.next_gain, v);
        }
        sounding = true;
        float fade = 1.0f;
        if (voice.fade_step > 0.0f) {
          voice.fade -= voice.fade_step;
          if (voice.fade <= 0.0f) {
            // The stolen note is gone: start the one that was waiting.
            voice.env.reset();
            if (!voice.waiting) {
              voice.fade = 1.0f;
              voice.fade_step = 0.0f;
              continue;
            }
            start(voice, voice.next_frequency, voice.next_gain, v);
          } else {
            fade = voice.fade;
          }
        }
        const float envelope = voice.env.next() * fade;
        const float gate = voice.gate.next() * fade;
        const float gain = voice.gain.next();
        power += envelope * envelope;
        // Only a key whose mark is ringing counts towards the marks' scale: a key
        // that joins has none yet and must not turn the sounding marks down.
        if (voice.mark[0].on || voice.mark[1].on) mark_power += gate * gate;
        presence += gain * gain * envelope * envelope;

        const kit::SinCos turn = kit::sin_cos(voice.phase);
        voice.phase = kit::wrap_phase(voice.phase + voice.increment);
        const kit::SinCos second = kit::second_partial(turn);
        const float wave = turn.s + voice.partial[0] * weight2 * second.s +
                           voice.partial[1] * weight3 * kit::third_partial(turn).s +
                           voice.partial[2] * weight4 * 2.0f * second.s * second.c;
        tone += gain * envelope * wave;

        for (Mark& mark : voice.mark) {
          if (!mark.on) continue;
          const float in = mark.age < mark_attack_
                               ? 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * mark.age / mark_attack_)
                               : 1.0f;
          marks += gain * gate * in * mark.level * kit::SineTable::lookup(static_cast<float>(mark.phase));
          mark.phase = kit::wrap_phase(mark.phase + mark.increment);
          mark.age += 1.0f;
          mark.level *= mark_decay_;
          if (mark.level < kMarkFloor) mark.on = false;
        }
      }

      if (!sounding) {
        // The last voice has ended: silence until the idle gate closes.
        running_ = false;
        out_left_[i] = 0.0f;
        out_right_[i] = 0.0f;
        continue;
      }

      // The air: two unlike pink noises, spread, low cut, low pass.
      const float position = open * kAirSteps;
      const int index = kit::clamp_int(static_cast<int>(position), 0, kAirSteps - 1);
      const float g = kit::lerp(air_g_[index], air_g_[index + 1], position - static_cast<float>(index));
      const float a1 = 1.0f / (1.0f + g * (g + kAirDamping));
      const float a2 = g * a1;
      const float a3 = g * a2;
      float air[2];
      kit::to_ears(spread, colour_[0].process(rng_[0].bipolar()), colour_[1].process(rng_[1].bipolar()), &air[0], &air[1]);
      for (int c = 0; c < 2; ++c) {
        kit::Svf& low = air_low_[c];
        low.g = g;
        low.k = kAirDamping;
        low.a1 = a1;
        low.a2 = a2;
        low.a3 = a3;
        air[c] = low.lowpass(air_cut_[c].highpass(air[c]));
      }

      const float norm = power > 1.0f ? 1.0f / std::sqrt(power) : 1.0f;
      const float mark_norm = mark_power > 1.0f ? 1.0f / std::sqrt(mark_power) : 1.0f;
      const float centre = tone_.next() * level * norm * tone + marks_.next() * mark_norm * marks;
      const float air_level = air_.next() * level * norm * std::sqrt(presence);
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip((centre + air_level * air[0]) * volume);
      out_right_[i] = kit::soft_clip((centre + air_level * air[1]) * volume);

      // On by one sample of the pattern, at the cycle's speed.
      pos_ += speed;
      if (pos_ >= len_[stage_]) roll();
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kAirSteps = 256;
  static constexpr float kAirDamping = 1.41421356f;  // the low pass has no peak
  static constexpr int kStrikeIn = 1;
  static constexpr int kStrikeOut = 2;

  // A struck mark: a sine that rises over a few milliseconds and dies away.
  struct Mark {
    double phase = 0.0;
    double increment = 0.0;
    float level = 0.0f;  // the fall: 1 at the strike
    float age = 0.0f;    // samples since the strike
    bool on = false;
  };

  struct Voice {
    kit::Adsr env;        // the key's own envelope: the tone and the air follow it
    kit::Adsr gate;       // the same key for the marks: open at once, the same release
    float gate_attack = kMarkGateSeconds;  // how fast `gate` opens: slower for a key taken up again
    kit::Smoother gain;   // the note's gain
    double phase = 0.0;   // in cycles
    double increment = 0.0;
    double frequency = 220.0;
    // Partials 2, 3 and 4 are left out as they near half the sample rate.
    float partial[3] = {1.0f, 1.0f, 1.0f};
    Mark mark[2];         // the In mark and the Out mark
    // A stolen voice fades out, then plays the note that waits in it.
    float fade = 1.0f;
    float fade_step = 0.0f;
    bool waiting = false;
    float next_frequency = 220.0f;
    float next_gain = 0.0f;

    bool active() const { return env.active() || waiting; }
    // A voice that waits is as good as held: it is not stolen twice.
    bool releasing() const { return !waiting && (fade_step > 0.0f || env.releasing()); }
    // From the envelope, never the output: a key at the bottom of the breath
    // is as loud as one at the crest. A key that is still coming in counts
    // above every held one, so the newest is the last to be taken.
    float level() const {
      if (waiting) return 2.0f;
      return (env.stage() == kit::Adsr::kAttack ? 1.0f + env.level() : env.level()) * fade;
    }
  };

  // The voice that plays `note_id`, held, letting go or fading, or -1.
  int find_own(int note_id) const {
    for (int v = 0; v < kMaxVoices; ++v) {
      if (pool_.note_id_of(v) == note_id && pool_.voices[v].active()) return v;
    }
    return -1;
  }

  void set_frequency(Voice& voice, float frequency) {
    const double sr = static_cast<double>(sample_rate());
    voice.frequency = static_cast<double>(frequency);
    voice.increment = voice.frequency / sr;
    for (int n = 0; n < 3; ++n) {
      // All there under four tenths of the rate, gone at 0.45 of it.
      const float place = static_cast<float>((n + 2) * voice.increment);
      voice.partial[n] = kit::clamp((0.45f - place) * 20.0f, 0.0f, 1.0f);
    }
  }

  // A fresh note in `voice`. A voice already sounding the same pitch is
  // joined in step, so two keys of one pitch add and never cancel; `in_loop`
  // is this voice's place in the sample loop (the ones before it have moved
  // on by a sample already), or -1 from a note on.
  void start(Voice& voice, float frequency, float gain, int in_loop) {
    voice.waiting = false;
    voice.fade = 1.0f;
    voice.fade_step = 0.0f;
    voice.mark[0].on = false;
    voice.mark[1].on = false;
    set_frequency(voice, frequency);
    voice.phase = 0.0;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& other = pool_.voices[v];
      if (&other == &voice || !other.env.active() || other.increment != voice.increment) continue;
      voice.phase = v < in_loop ? kit::wrap_phase(other.phase - other.increment) : other.phase;
      break;
    }
    voice.gain.snap(gain);
    const float release = param(breath_pacer::kRelease);
    voice.env.reset();
    voice.env.set(kAttackSeconds, kAttackSeconds, 1.0f, release);
    voice.env.gate_on();
    voice.gate.reset();
    voice.gate_attack = kMarkGateSeconds;  // nothing rings in a fresh voice
    voice.gate.set(voice.gate_attack, voice.gate_attack, 1.0f, release);
    voice.gate.gate_on();
  }

  void strike(Mark& mark, double frequency) const {
    mark.phase = 0.0;
    mark.increment = frequency / static_cast<double>(sample_rate());
    mark.level = 1.0f;
    mark.age = 0.0f;
    mark.on = true;
  }

  // The first key after every voice has ended: the breath starts at In, and
  // everything that ran on (or stood still) while nothing sounded starts
  // from one known state. Whether the device had fallen asleep by then
  // depends on the host's block size; this does not. Nothing is sounding at
  // this point (the last voice ended 100 dB down), so nothing can click.
  void restart() {
    stage_ = kStageIn;
    pos_ = 0.0;
    strike_ = kStrikeIn;
    running_ = true;
    for (int c = 0; c < 2; ++c) {
      rng_[c].seed(0xB7EA7400u + static_cast<uint64_t>(c));
      colour_[c].reset();
      air_cut_[c].reset();
      air_low_[c].reset();
    }
    kit::Smoother* const smoothers[] = {&air_, &tone_, &marks_, &bright_, &floor_, &volume_};
    for (kit::Smoother* smoother : smoothers) smoother->snap(smoother->target);
  }

  // The part has ended: carry what is over into the next. A part of no
  // length is passed without a sample; In and Out are a second at the least.
  void roll() {
    double over = pos_ - len_[stage_];
    for (int passed = 0; passed < 2 * kNumStages; ++passed) {
      stage_ = (stage_ + 1) % kNumStages;
      if (stage_ == kStageIn) strike_ |= kStrikeIn;
      if (stage_ == kStageOut) strike_ |= kStrikeOut;
      if (over < len_[stage_]) {
        pos_ = over;
        return;
      }
      over -= len_[stage_];
    }
    pos_ = 0.0;
  }

  // A part's length in samples of the pattern as set. The place in the part
  // stays where it is: only the speed changes.
  void set_length(int stage, float seconds) {
    double length = static_cast<double>(seconds) * static_cast<double>(sample_rate());
    if (!(length >= 1.0)) length = 0.0;
    if (stage == stage_) pos_ = len_[stage] > 0.0 ? pos_ * (length / len_[stage]) : 0.0;
    len_[stage] = length;
  }

  void apply(int id) {
    using namespace breath_pacer;
    const float value = param(id);
    switch (id) {
      case kIn:
        set_length(kStageIn, value);
        break;
      case kHold:
        set_length(kStageHold, value);
        break;
      case kOut:
        set_length(kStageOut, value);
        break;
      case kRest:
        set_length(kStageRest, value);
        break;
      case kSlowTo:
      case kOver:
        // The speed falls from 1 to 1 / Slow to, so the cycle grows by ratio.
        glide_.set(1.0, 1.0 / static_cast<double>(param(kSlowTo)), 60.0 * static_cast<double>(param(kOver)),
                   pool_.count_active() > 0);
        break;
      case kAir:
        air_.set(kAirGain * value * value, primed());
        break;
      case kTone:
        tone_.set(kToneGain * value * value, primed());
        break;
      case kMarks:
        marks_.set(kMarkGain * value * value, primed());
        break;
      case kBright:
        bright_.set(value, primed());
        break;
      case kFloor:
        floor_.set(floor_gain(value), primed());
        break;
      case kRelease:
        for (int v = 0; v < kMaxVoices; ++v) {
          Voice& voice = pool_.voices[v];
          voice.env.set(kAttackSeconds, kAttackSeconds, 1.0f, value);
          voice.gate.set(voice.gate_attack, voice.gate_attack, 1.0f, value);
        }
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::RateGlide glide_;   // the cycle's speed: 1, on its way to 1 / Slow to
  kit::StreamRng rng_[2];
  kit::ColourFilter colour_[2];
  kit::OnePole air_cut_[2];
  kit::Svf air_low_[2];
  kit::Smoother air_, tone_, marks_, bright_, floor_, volume_;
  kit::IdleGate idle_;
  float air_g_[kAirSteps + 1] = {};
  float mark_decay_ = 0.999f;
  float mark_attack_ = 240.0f;
  float steal_step_ = 0.01f;
  // The cycle: which part, how far into it in samples of the pattern as set,
  // and each part's length in the same.
  int stage_ = kStageIn;
  double pos_ = 0.0;
  double len_[kNumStages] = {0.0, 0.0, 0.0, 0.0};
  int strike_ = 0;        // marks to strike at the next sample
  bool running_ = false;  // a breath is sounding
};

}  // namespace livemix
