#pragma once

// Graft: a physical model in two halves that can be crossed.
//
//   Exciter: Breath | Bow | Mallet | Pluck      (graft_exciters.h)
//                       │ force
//                       ▼
//   Body:    String | Pipe | Bar | Bowl         (graft_bodies.h)
//                       │ left, right
//                       ▼
//   notes (up to 10) ─► volume ─► soft clip ─► out
//
// - Breath and Bow close a loop round the body: the body's motion at the
//   contact point goes through the exciter's curve and comes back as force,
//   so the note is the body's own resonance, held for as long as the key is
//   down. A held body is damped (it rings sixty periods, three tenths of a
//   second at least) so it answers the exciter quickly; when the key is let
//   go the exciter lifts off and the body rings for Decay, or Release if
//   shorter. A bar or bowl lets a little of the exciter itself be heard
//   beside it: the buzz of a reed when blown, the scrape of the bow. Its
//   roughness (with Air and Pressure) also keeps the partials above the
//   driven one ringing, so a held bar or bowl still sounds like one.
// - Mallet and Pluck push once; the body rings for Decay from the start.
// - Exciter and Body are read when a note starts: a note that is sounding
//   keeps the two it was struck with.
// - Wander gives each note its own slow drift in pitch, and a slower lean
//   in pressure that moves level and tone together.
// - So that a chord does not pile up: neighbouring keys and octaves swing
//   opposite ways (one key always the same way, so two notes on it double),
//   and strings and pipes sit in two ranks a little left and right (Width).
// - Knobs are read on a control clock, every 32 samples from the first note
//   after silence, and glided: Pressure, Position, Bright, Air, Width and
//   each note's ring time.
//
// The instrument sleeps when every body has rung out below -140 dB.

#include "../../kit/kit.h"
#include "graft_bodies.h"
#include "graft_exciters.h"
#include "params.gen.h"

namespace livemix {

class Graft : public kit::DeviceBase<graft::kNumParams> {
 public:
  static constexpr int kMaxVoices = 10;
  enum Exciter : int { kBreath = 0, kBow, kMallet, kPluck };
  enum Body : int { kString = 0, kPipe, kBar, kBowl };

  void init(float sample_rate) {
    using namespace graft;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.line.clear();
      voice.modes.clear();
      voice.striker.stop();
      voice.env = kit::Adsr();
      voice.env.set_sample_rate(sr);
      voice.rng.seed(0x6A4F7u + 104729u * static_cast<uint32_t>(v));
      voice.drift.seed(0x51DE7u + 7919u * static_cast<uint32_t>(v));
      voice.drift.set_rate(kWanderHz, sr);
      voice.lean.seed(0xB0A7u + 6007u * static_cast<uint32_t>(v));
      voice.lean.set_rate(kWanderHz * 1.37f, sr);
      voice.air.reset();
      voice.air.set_cutoff(kAirHz, sr);
      voice.rough.reset();
      voice.sounding = voice.released = voice.pending = voice.choke = false;
      voice.follow = voice.chunk_peak = 0.0f;
      voice.steal = 1.0f;
    }
    noise_scale_ = std::sqrt(sr / 48000.0f);
    steal_step_ = 1.0f / (kStealSeconds * sr);
    glide_ = 1.0f - std::exp(-static_cast<float>(kChunk) / (kGlideSeconds * sr));
    volume_.set_time(kSmoothingSeconds, sr);
    chunk_left_ = 0;
    // Nothing outlives the bodies.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    land();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Nothing sounds: whatever was moved in the silence has arrived, and the
    // control clock starts with the note (the same at every block size).
    if (pool_.count_active() == 0) {
      land();
      chunk_left_ = 0;
    }
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting note is this one.
        again.pending_frequency = frequency;
        again.pending_gain = gain;
        return;
      }
      // A key struck again while held: a hand on the old note.
      again.released = again.choke = true;
      again.env.gate_off();
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // Fade the old note over 2 ms, then start (see render).
      voice.pending = true;
      voice.released = false;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.follow = 0.25f + 0.75f * gain;  // as loud as the note it waits for
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      // Released before its stolen start: it never sounds.
      voice.pending = false;
      voice.choke = true;
    }
    voice.released = true;
    voice.env.gate_off();
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      land();
      chunk_left_ = 0;
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (chunk_left_ == 0) {
        control();
        chunk_left_ = graft::kChunk;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      float left[graft::kChunk] = {}, right[graft::kChunk] = {};
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].sounding) render(pool_.voices[v], n, left, right);
      }
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(left[i] * volume);
        out_right_[done + i] = kit::soft_clip(right[i] * volume);
      }
      chunk_left_ -= n;
      done += n;
      if (chunk_left_ == 0) flush();
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    graft::Waveguide line;
    graft::Modes modes;
    graft::Driver driver;
    graft::Striker striker;
    kit::Adsr env;        // Breath and Bow: how hard, 0 to 1
    kit::Drift drift;     // pitch wander
    kit::Drift lean;      // pressure wander
    kit::Rng rng;
    kit::OnePole air;     // shapes the exciter's noise
    kit::OnePole rough;   // and what of it reaches a Bar's or Bowl's upper modes
    int exciter = kBreath, body = kString;
    int key = 0;                               // the nearest semitone, counted from the C under the keyboard
    float frequency = 220.0f;
    float strength = 0.0f;                     // from velocity
    float drive = 0.0f, drive_step = 0.0f;     // how hard it is driven, before the envelope
    float hiss = 0.0f, hiss_step = 0.0f;       // air, as a share of the level
    float direct = 0.0f, direct_step = 0.0f;   // the exciter's own sound beside a Bar or Bowl
    float rub = 0.0f, rub_step = 0.0f;         // the exciter's roughness on a Bar's or Bowl's upper modes
    float out = 0.0f;                          // output gain of this crossing
    float track = 1.0f;                        // Decay at this pitch, against middle C
    float ring = 0.0f, bright = -1.0f;         // what the body's loss was last set from
    float position = -1.0f, width = -1.0f, bend = 1.0f;
    bool moving = false;                       // ramps of the last chunk still to land
    float follow = 0.0f, chunk_peak = 0.0f;
    float steal = 1.0f;                        // fades the old note out before a stolen start
    float pending_frequency = 0.0f, pending_gain = 0.0f;
    bool sounding = false, released = false, pending = false, choke = false;

    bool held_by_exciter() const { return exciter <= kBow; }
    bool modal() const { return body >= kBar; }
    bool active() const { return sounding; }
    bool releasing() const { return released; }
    float level() const { return follow; }
  };

  static constexpr float kMinHz = 25.0f;
  static constexpr float kMaxHz = 4500.0f;
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kGlideSeconds = 0.015f;  // Pressure, Position, Air, Width under a held note
  static constexpr float kWanderHz = 0.19f;
  static constexpr float kAirHz = 5000.0f;
  static constexpr float kSilence = 1.0e-7f;
  // A note's level is its loudest chunk, let fall this far a chunk: faster than
  // any body dies, so a note is retired long before it could reach denormals.
  static constexpr float kFollowFall = 0.9f;

  // A held body: how long it rings under Breath or Bow.
  static constexpr float kHeldSeconds = 0.3f;
  static constexpr float kHeldPeriods = 60.0f;
  static constexpr float kChokeSeconds = 0.05f;   // a key struck again, a note cancelled
  static constexpr float kLiftSeconds = 0.03f;    // the breath or bow leaving the body
  static constexpr float kSeed = 0.25f;           // the small pluck that starts a quick Breath or Bow
  static constexpr float kSeedSwell = 0.12f;      // Swell up to which it is whole
  // Bright: a partial near 3 kHz rings this share of the fundamental's time
  // (waveguides); modes lose ring time by d·(ratio - 1), metal to wood.
  static constexpr float kDull = 0.03f;
  static constexpr float kMetal = 0.02f;
  static constexpr float kWood = 2.0f;
  static constexpr float kWanderCents = 6.0f;
  static constexpr float kLean = 0.25f;           // Wander on how hard it is driven: the level
  static constexpr float kBreathLean = 0.5f;      // and the tone, as a move of Pressure (a bow
  static constexpr float kBowLean = 0.3f;         // answers the same move with more)
  static constexpr float kAirLevel = 1.2f;        // Breath and Bow noise against the drive, Air at 1
  static constexpr float kSoftStrike = 0.35f;     // level of a strike at Pressure 0
  // Output level of each crossing, [exciter][body], measured at 220 Hz: one
  // key at gain 0.7 peaks near -23.3 dBFS held and -22.5 dBFS struck at the
  // default volume, which leaves ten keys held at gain 0.8 under the clip's
  // knee, and eight struck at full; eight held at full touch it. (The blown
  // pipe and bar are a little under the rest: their wave is the smoothest,
  // so ten of them add to the most. The blown string, the default, is a
  // little over: its upper notes are its quietest, and the A over middle C
  // sits at the foot of the level rule.)
  static constexpr float kOut[4][4] = {{0.2099f, 0.2305f, 0.1364f, 0.1114f},
                                       {0.1868f, 0.2104f, 0.1959f, 0.1541f},
                                       {0.1996f, 0.3865f, 0.3734f, 0.2713f},
                                       {0.2542f, 0.4546f, 0.3920f, 0.2709f}};

  void start(Voice& voice, float frequency, float gain) {
    using namespace graft;
    const float sr = sample_rate();
    voice.exciter = kit::clamp_int(static_cast<int>(param(kExciter) + 0.5f), 0, 3);
    voice.body = kit::clamp_int(static_cast<int>(param(kBody) + 0.5f), 0, 3);
    voice.frequency = frequency;
    voice.strength = 0.25f + 0.75f * gain;
    voice.track = kit::clamp(std::pow(261.63f / frequency, 0.35f), 0.25f, 2.0f);
    voice.sounding = true;
    voice.released = voice.pending = voice.choke = voice.moving = false;
    voice.steal = 1.0f;
    voice.chunk_peak = 0.0f;
    voice.out = kOut[voice.exciter][voice.body];
    voice.follow = voice.strength * voice.out;  // as loud as it will be, before it has sounded
    // Neighbouring keys, and a key and its octave, swing opposite ways: a
    // chord struck at once does not pile its strikes into one spike. One
    // key always swings the same way, so a note doubled is still doubled.
    voice.key = static_cast<int>(std::floor(12.0f * std::log2(frequency * (1.0f / 16.3516f)) + 0.5f));
    if ((voice.key + voice.key / 12) & 1) voice.out = -voice.out;
    if (voice.modal()) {
      voice.modes.start(voice.body == kBowl, frequency, sr);
    } else {
      voice.line.start(voice.body == kPipe, frequency, sr);
    }
    voice.bend = 1.0f;
    shape(voice, true);
    place(voice, true);
    voice.air.reset();
    voice.rough.reset();
    voice.rough.set_cutoff(kit::min(kRoughPartials * frequency, 0.4f * sr), sr);
    voice.env.reset();
    voice.driver.start(voice.exciter == kBow, frequency, sr);
    voice.driver.set_pressure(pressure_, pressure_);
    voice.drive = drive_level(voice);
    voice.hiss = air_ * air_ * kAirLevel * noise_scale_;
    voice.direct = direct_level(voice);
    voice.rub = voice.modal() ? rub_level() * voice.modes.rub_norm() : 0.0f;
    voice.drive_step = voice.hiss_step = voice.direct_step = voice.rub_step = 0.0f;
    if (voice.held_by_exciter()) {
      const float swell = param(kSwell);
      voice.env.set(swell, 0.01f, 1.0f, kLiftSeconds);
      voice.env.gate_on();
      const float seed = kSeed * voice.strength * kit::min(1.0f, kSeedSwell / swell);
      voice.striker.strike(false, seed, frequency, 0.5f, 0.0f, sr);
    } else {
      // A harder strike is louder and brighter; so is a harder key.
      const float amplitude = voice.strength * (kSoftStrike + (1.0f - kSoftStrike) * pressure_);
      const float hardness = kit::clamp(pressure_ * (0.6f + 0.5f * gain), 0.0f, 1.0f);
      voice.striker.strike(voice.exciter == kMallet, amplitude, frequency, hardness, air_, sr);
    }
  }

  // How hard a held note is driven: velocity and Pressure.
  float drive_level(const Voice& voice) const {
    const float soft = voice.exciter == kBow ? kBowSoft : kBreathSoft;
    return voice.strength * (soft + (1.0f - soft) * pressure_);
  }
  static constexpr float kBreathSoft = 0.45f;  // drive level at Pressure 0, against Pressure 1
  static constexpr float kBowSoft = 0.5f;

  // A bar or bowl gives back little but its own modes, so what the exciter
  // does is heard beside it: air chopped by a blown bar as by a reed, more of
  // it the harder it is blown, and a little of the bow's scrape.
  float direct_level(const Voice& voice) const {
    return voice.exciter == kBow ? kScrapeSoft + (kScrapeHard - kScrapeSoft) * pressure_
                                 : kReedSoft + (kReedHard - kReedSoft) * pressure_;
  }

  // What the roughness of breath or bow does to the modes it does not hold:
  // each upper mode of a bar or bowl against the driven one, were it to ring
  // as long. It is the exciter's noise that finds them, so there is none at
  // Air 0; more with Air, and with Pressure.
  float rub_level() const {
    return (kRubSoft + (kRubHard - kRubSoft) * pressure_) * std::sqrt(air_ * (1.0f / kRubAir));
  }
  // The roughness falls away above the second partial, and reaches the three
  // modes over a bar's driven one (the fifth would be 40 dB under it,
  // unheard) and the two pairs over a bowl's (its next is as far down, and a
  // pair costs more than a mode).
  static constexpr float kRoughPartials = 2.0f;
  static constexpr int kRubbedModes = 4;
  static constexpr int kRubbedPairs = 3;
  static constexpr float kRubSoft = 0.08f;
  static constexpr float kRubHard = 0.6f;
  static constexpr float kRubAir = 0.25f;  // the Air at which it is as the two above say
  static constexpr float kReedSoft = 0.15f;
  static constexpr float kReedHard = 0.75f;
  static constexpr float kScrapeSoft = 0.15f;
  static constexpr float kScrapeHard = 0.35f;

  // How long the body rings as things stand.
  float ring_time(const Voice& voice) const {
    using namespace graft;
    if (voice.choke) return kChokeSeconds;
    const float decay = param(kDecay) * voice.track;
    if (voice.released) return kit::min(decay, param(kRelease));
    if (voice.held_by_exciter()) return kit::max(kHeldSeconds, kHeldPeriods / voice.frequency);
    return decay;
  }

  // The body's loss, from Decay, Release, Bright and whether the key is down.
  // The ring time is glided to, like a knob: a held body is pushed by as much
  // as it loses, so a loss that jumped would be heard as a step.
  void shape(Voice& voice, bool snap) {
    using namespace graft;
    voice.ring = snap ? ring_time(voice) : glide_to(voice.ring, ring_time(voice), glide_);
    voice.bright = bright_;
    if (voice.modal()) {
      voice.modes.set_loss(voice.ring, kMetal * std::pow(kWood / kMetal, 1.0f - voice.bright));
    } else {
      voice.line.set_loss(voice.ring, voice.ring * std::pow(kDull, 1.0f - voice.bright));
    }
  }

  // Position and Width, as they have glided to.
  void place(Voice& voice, bool snap) {
    voice.position = position_;
    voice.width = width_;
    if (voice.modal()) {
      voice.modes.set_position(position_, width_, snap);
    } else {
      const float q = 0.06f + 0.44f * position_;
      // Strings and pipes stand in two ranks, a key and the next on opposite
      // sides: a chord is spread across the two speakers.
      float left, right;
      kit::pan_gains((voice.key & 1) ? -kRanks * width_ : kRanks * width_, &left, &right);
      voice.line.set_comb(q * (1.0f - kCombSpread * width_), q * (1.0f + kCombSpread * width_),
                          left * (kit::kSqrtHalf * 2.0f), right * (kit::kSqrtHalf * 2.0f), snap);
    }
  }
  static constexpr float kCombSpread = 0.22f;
  static constexpr float kRanks = 0.35f;  // how far to its side a string or pipe stands, Width at 1

  static float glide_to(float value, float target, float coeff) {
    const float next = value + (target - value) * coeff;
    const float gap = target - next;
    return (gap < 1.0e-5f && gap > -1.0e-5f) ? target : next;
  }

  // Every 32 samples: glide the knobs, retire what has rung out, and set
  // each note's ramps for the next 32.
  void control() {
    using namespace graft;
    pressure_ = glide_to(pressure_, param(kPressure), glide_);
    position_ = glide_to(position_, param(kPosition), glide_);
    bright_ = glide_to(bright_, param(kBright), glide_);
    air_ = glide_to(air_, param(kAir), glide_);
    width_ = glide_to(width_, param(kWidth), glide_);
    const float wander = param(kWander);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      voice.follow = kit::max(voice.chunk_peak, voice.follow * kFollowFall);
      voice.chunk_peak = 0.0f;
      const bool free_ringing = voice.released || !voice.held_by_exciter();
      if (free_ringing && !voice.pending && !voice.striker.active() && voice.follow < kSilence) {
        voice.sounding = false;
        continue;
      }
      if (voice.moving) {
        if (voice.modal()) {
          voice.modes.settle();
        } else {
          voice.line.settle();
        }
        voice.moving = false;
      }
      if (voice.ring != ring_time(voice) || voice.bright != bright_) {
        shape(voice, false);
        voice.moving = true;
      }
      const float bend = wander > 0.0f ? kit::cents_to_ratio(wander * kWanderCents * voice.drift.next(kChunk)) : 1.0f;
      if (bend != voice.bend) {
        voice.bend = bend;
        if (voice.modal()) {
          voice.modes.bend(bend);
        } else {
          voice.line.bend(bend);
        }
        voice.moving = true;
      }
      if (voice.position != position_ || voice.width != width_) {
        place(voice, false);
        voice.moving = true;
      }
      if (voice.held_by_exciter()) {
        voice.env.set(param(kSwell), 0.01f, 1.0f, kLiftSeconds);
        // Wander leans on the exciter: a little harder is a little louder
        // and a little brighter, as Pressure is.
        const float lean = wander > 0.0f ? wander * voice.lean.next(kChunk) : 0.0f;
        const float tone = voice.exciter == kBow ? kBowLean : kBreathLean;
        voice.driver.set_pressure(pressure_, kit::clamp(pressure_ + tone * lean, 0.0f, 1.0f));
        voice.drive_step = (drive_level(voice) * (1.0f + kLean * lean) - voice.drive) * (1.0f / kChunk);
        voice.hiss_step = (air_ * air_ * kAirLevel * noise_scale_ - voice.hiss) * (1.0f / kChunk);
        voice.direct_step = (direct_level(voice) - voice.direct) * (1.0f / kChunk);
      }
      if (voice.modal()) {
        voice.modes.spin();
        if (voice.held_by_exciter()) {
          voice.rub_step = (rub_level() * voice.modes.rub_norm() - voice.rub) * (1.0f / kChunk);
        }
      }
    }
  }

  // Breath and Bow: the loop round the body.
  void drive_body(Voice& voice, int n, float* left, float* right) {
    using graft::kChunk;
    const bool bow = voice.exciter == kBow;
    // What does not depend on the body: level, air and the seed pluck.
    float level[kChunk], noise[kChunk], rough[kChunk], pulse[kChunk];
    const bool seeding = voice.striker.active();
    const bool rubbed = voice.modal();
    float drive = voice.drive, hiss = voice.hiss, rub = voice.rub;
    const float drive_step = voice.drive_step, hiss_step = voice.hiss_step, rub_step = voice.rub_step;
    for (int i = 0; i < n; ++i) {
      level[i] = voice.env.next() * drive;
      const float white = voice.air.lowpass(voice.rng.bipolar());
      noise[i] = white * hiss;
      rough[i] = rubbed ? voice.rough.lowpass(white) * level[i] * rub : 0.0f;
      pulse[i] = seeding ? voice.striker.next(voice.rng) : 0.0f;
      drive += drive_step;
      hiss += hiss_step;
      rub += rub_step;
    }
    voice.drive = drive;
    voice.hiss = hiss;
    voice.rub = rub;
    // A copy for the loop, so its state stays in registers.
    graft::Driver driver = voice.driver;
    if (!voice.modal()) {
      const float norm = voice.line.drive_norm();
      const float strike = voice.body == kPipe ? 0.5f : 1.0f;
      voice.line.drive(n, left, right, [&](float sense, int i) {
        const float air = noise[i] * (bow ? graft::Driver::slip(sense, level[i]) : level[i]);
        return (driver.shaped(driver.curve(sense, level[i])) + air) * norm + pulse[i] * strike;
      });
    } else {
      // The lowest mode in the loop. The others are pushed by the seed pluck
      // and by the driver's roughness, and the exciter is heard beside them
      // (its tone rising and falling with a bowl's beat, as the bowl does).
      const float norm = voice.modes.drive_norm();
      const float strike = 2.0f * voice.frequency / sample_rate();
      const float place_left = voice.modes.place_left(), place_right = voice.modes.place_right();
      float rest[kChunk];
      float direct = voice.direct, swing = voice.modes.swing();
      const float direct_step = voice.direct_step, swing_step = voice.modes.swing_step();
      voice.modes.drive_one(n, left, right, [&](float sense, int i) {
        const float air = noise[i] * (bow ? graft::Driver::slip(sense, level[i]) : level[i]);
        const float tone = driver.shaped(driver.curve(sense, level[i]));
        const float beside = direct * (tone * swing + air);
        left[i] = beside * place_left;
        right[i] = beside * place_right;
        rest[i] = pulse[i] * strike + rough[i];
        direct += direct_step;
        swing += swing_step;
        return (tone + air) * norm + pulse[i] * strike;
      });
      voice.direct = direct;
      voice.modes.keep_swing(swing);
      voice.modes.ring(rest, n, 1, voice.body == kBowl ? kRubbedPairs : kRubbedModes, left, right);
    }
    voice.driver = driver;
  }

  // Mallet and Pluck: the push, then the body by itself.
  void strike_body(Voice& voice, int n, float* left, float* right) {
    float force[graft::kChunk];
    const bool striking = voice.striker.active();
    const float strike =
        voice.modal() ? 2.0f * voice.frequency / sample_rate() : (voice.body == kPipe ? 0.5f : 1.0f);
    for (int i = 0; i < n; ++i) {
      force[i] = striking ? voice.striker.next(voice.rng) * strike : 0.0f;
      left[i] = right[i] = 0.0f;
    }
    if (voice.modal()) {
      voice.modes.ring(force, n, 0, graft::Modes::kMaxModes, left, right);
    } else {
      voice.line.ring(force, n, left, right);
    }
  }

  void render(Voice& voice, int n, float* left, float* right) {
    float own_left[graft::kChunk], own_right[graft::kChunk];
    if (voice.held_by_exciter()) {
      drive_body(voice, n, own_left, own_right);
    } else {
      strike_body(voice, n, own_left, own_right);
    }
    float peak = voice.chunk_peak;
    for (int i = 0; i < n; ++i) {
      // A stolen voice: the old note out over 2 ms, then the new one.
      if (voice.pending) voice.steal = kit::max(0.0f, voice.steal - steal_step_);
      const float gain = voice.out * voice.steal;
      const float l = own_left[i] * gain, r = own_right[i] * gain;
      left[i] += l;
      right[i] += r;
      peak = kit::max(peak, kit::max(l < 0.0f ? -l : l, r < 0.0f ? -r : r));
    }
    voice.chunk_peak = peak;
    if (voice.pending && voice.steal <= 0.0f) start(voice, voice.pending_frequency, voice.pending_gain);
  }

  void apply(int id) {
    using namespace graft;
    switch (id) {
      case kVolume:
        volume_.set(kit::db_to_gain(param(kVolume)), primed());
        break;
      default:
        break;  // read on the control clock or when a note starts
    }
  }

  // At the end of every chunk, so it falls on the same samples whatever the
  // block size.
  void flush() {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      if (voice.modal()) {
        voice.modes.flush();
      } else {
        voice.line.flush();
      }
      voice.driver.shape.flush();
    }
  }

  // Nothing is sounding: every glided control is where it points.
  void land() {
    using namespace graft;
    pressure_ = param(kPressure);
    position_ = param(kPosition);
    bright_ = param(kBright);
    air_ = param(kAir);
    width_ = param(kWidth);
    volume_.snap(volume_.target);
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother volume_;
  kit::IdleGate idle_;
  // Glided on the control clock.
  float pressure_ = 0.5f, position_ = 0.35f, bright_ = 0.5f, air_ = 0.25f, width_ = 0.6f;
  float glide_ = 1.0f;
  float noise_scale_ = 1.0f;
  float steal_step_ = 0.01f;
  int chunk_left_ = 0;
};

}  // namespace livemix
