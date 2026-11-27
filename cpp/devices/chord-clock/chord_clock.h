#pragma once

// Chord Clock: a chord is a rhythm played too fast to count, and here both
// are heard at once.
//
//   key ─► ratio to the lowest key ─► pitch f, and a clock at f / 2^Slowness
//            │                           │
//            │   tone: the pulse at full speed,    pulses: each excites the
//            │   a moving band-limited table       key's body (8 modes)
//            └──────────── Path joins them ───────────────┘
//   all keys ─► volume ─► soft clip ─► out
//
// - Clocks. The lowest held key is the bass and has the master clock M. A key
//   R = p/q above it is tuned to R (Agree 1) and its clock is R·M, so the
//   whole pattern comes back after q pulses of the bass, exactly. A key's own
//   phase starts at zero when it is struck, so a note speaks at once; what is
//   left between it and R·M is taken up by running its clock a little fast or
//   slow. With Agree under 1 pitches are drawn only part of the way, clocks
//   follow the pitches, and the pattern drifts.
// - Path. `s` is how many octaves below the pitch the quickening pulses are:
//   a glide from Slowness to 0, or octave by octave by filling in the pulses
//   between (which needs no jump: the pulses of f/2^j are among those of
//   f/2^(j-1)), or from 0 out to Slowness, or there and back. Under two
//   octaves the pulses run together, and the tone's table goes on from there:
//   it is four periods long, and pulses at f/2 and f/4 are its odd lines.
// - The tone's table is made anew every kTable samples for both ears by one
//   transform and crossfaded, with every harmonic moving a little in level,
//   place and phase, and what the pulses lift in it.
// - Pulses. An impulse at a place between two samples goes through two
//   one-poles (Pulse width), and is the push, or shapes the noise, that goes
//   to the body's modes. A mode is a complex number turned and shrunk a
//   little every sample. Noise is scaled by each mode's bandwidth, which
//   makes it the same at every sample rate.
// - Pulses close together would pile up in a ringing mode: each is scaled by
//   what is left of the one before it.
// - What a key's pulses move under its pitch is filtered off (12 dB an octave
//   under a quarter of it), and the more keys there are the softer each is.
// - Everything is worked out in chunks of 32 samples that restart with the
//   first key after silence, and dealt out to the host's blocks, so block
//   sizes change nothing.
// - One pitch is one voice. The bell-like rules for ids and steals are those
//   of the other struck instruments here: a pitch struck again restarts the
//   voice it has, and a taken voice fades for 4 ms before its new key.

#include <initializer_list>

#include "../../kit/fft.h"
#include "../../kit/kit.h"
#include "clock_voice.h"
#include "params.gen.h"

namespace livemix {

class ChordClock : public kit::DeviceBase<chord_clock::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kModes = chord_clock_dsp::kModes;
  static constexpr int kTable = chord_clock_dsp::kTable;
  static constexpr int kPeriods = chord_clock_dsp::kPeriods;
  static constexpr int kLines = chord_clock_dsp::kLines;

  void init(float sample_rate) {
    using namespace chord_clock;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    fft_.init();
    for (int m = 1; m <= kLines; ++m) octave_[m] = std::log2(kit::max(0.25f * static_cast<float>(m), 1.0f));
    for (Voice& voice : voices_) voice = Voice();
    const float sr = this->sample_rate();
    dt_ = static_cast<float>(kChunk) / sr;
    tone_ease_ = 1.0f - std::exp(-dt_ / 0.0025f);
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    stamp_ = 0;
    chunk_left_ = 0;
    master_ = 0.0;
    anchor_hz_ = 220.0f;
    root_return_ = 4;
    for (int i = 0; i < kNumParams; ++i) knobs_[i].set_time(0.02f, sr / static_cast<float>(kChunk));
    volume_.set_time(0.01f, sr);
    snap_knobs();
  }

  void set_param(int id, float value) {
    if (!store_param(id, value)) return;
    if (id == chord_clock::kVolume) {
      volume_.set(kit::db_to_gain(value), primed());
    } else {
      knobs_[id].set(param(id), primed());
    }
    if (id == chord_clock::kRatios || id == chord_clock::kAgree) retune_ = true;
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.7f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (count_sounding() == 0) restart();
    Voice* same = nullptr;
    Voice* waiting = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (!same && (voice.pending ? voice.pending_hz : voice.played) == frequency) {
        same = &voice;
        continue;
      }
      if (voice.drop(note_id) && voice.pending && voice.holders == 0) waiting = &voice;
    }
    retune_ = true;
    if (same) {
      same->hold(note_id);
      same->stamp = ++stamp_;
      if (same->pending) {
        same->pending_gain = kit::max(same->pending_gain, gain);
      } else {
        strike(*same, gain, false);
      }
      return;
    }
    Voice& voice = waiting ? *waiting : voices_[pick()];
    const bool taken = voice.sounding;
    voice.holders = 0;
    voice.hold(note_id);
    voice.stamp = ++stamp_;
    if (taken) {
      voice.pending = true;
      voice.pending_hz = frequency;
      voice.pending_gain = gain;
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (voice.sounding) voice.drop(note_id);  // the others keep the ratios they have
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    clear_input(frames);
    for (int i = 0; i < frames; ++i) {
      if (chunk_left_ == 0) {
        if (count_sounding() == 0) {
          for (; i < frames; ++i) out_left_[i] = out_right_[i] = 0.0f;
          return;
        }
        render_chunk();
        chunk_left_ = kChunk;
      }
      const int at = kChunk - chunk_left_--;
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(mix_left_[at] * volume);
      out_right_[i] = kit::soft_clip(mix_right_[at] * volume);
    }
  }

 private:
  static constexpr int kChunk = 32;
  static constexpr double kLastPlace = kChunk - 0.001;
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kToneLevel = 0.215f;   // RMS of one full tone
  static constexpr float kPulseLevel = 0.31f;  // of one full pulse
  static constexpr float kAirLevel = 0.05f;
  static constexpr float kWindLevel = 0.028f;
  static constexpr float kKnockLevel = 0.5f;
  static constexpr float kStealSeconds = 0.004f;
  static constexpr float kGlideSeconds = 0.09f;  // a key goes to a new ratio
  static constexpr float kFresh = 0.04f;         // younger than this it is simply there
  static constexpr float kSilence = 2.0e-7f;

  using Voice = chord_clock_dsp::Voice;

  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding ? 1 : 0;
    return count;
  }

  int pick() const {
    int choice = -1;
    for (int pass = 0; pass < 4 && choice < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0 && voice.sounding) continue;
        if (pass == 1 && (voice.pending || !voice.released())) continue;
        if (pass == 2 && voice.pending) continue;
        if (choice < 0) {
          choice = v;
          continue;
        }
        const Voice& best = voices_[choice];
        const bool older = voice.stamp < best.stamp;
        if (pass == 0 ? older : voice.loudness() < best.loudness() || (voice.loudness() == best.loudness() && older)) {
          choice = v;
        }
      }
    }
    return choice;
  }

  int choice_of(int id, int count) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1); }
  float knob(int id) const { return knobs_[id].value; }
  // Even in what is heard.
  float tone_knob() const {
    const float t = knob(chord_clock::kTone);
    return 1.19f * t * (0.2f + 0.8f * t);
  }

  void snap_knobs() {
    for (int i = 0; i < chord_clock::kNumParams; ++i) knobs_[i].snap(param(i));
    volume_.snap(kit::db_to_gain(param(chord_clock::kVolume)));
  }

  void restart() {
    snap_knobs();
    chunk_left_ = 0;
    master_ = 0.0;
    anchor_ = nullptr;
    retune_ = true;
    crowd_ = -1.0f;  // set by the first chunk
  }

  // --- keys --------------------------------------------------------------------

  void start(Voice& voice, float hz, float gain) {
    const float semitone = kit::hz_to_midi(hz);
    voice.played = voice.hz = voice.aim = hz;
    voice.rng.seed(0xC10Cu + static_cast<uint32_t>(hz * 16.0f) * 2654435761u);
    voice.seed = voice.rng.uniform();
    for (int k = 0; k < kModes; ++k) voice.re[k] = voice.im[k] = 0.0f;
    for (float& kept : voice.low) kept = 0.0f;
    voice.imp_carry = voice.env1 = voice.env2 = voice.chirp = 0.0f;
    voice.position = static_cast<double>(semitone * 0.618f - std::floor(semitone * 0.618f)) * kTable;
    voice.level = voice.lift = voice.lift_raw = voice.glint = voice.climb = voice.tone_gain = voice.air_gain = voice.wind_gain = 0.0f;
    voice.knock.reset();
    voice.colour_pulse = voice.colour_body = -1;
    voice.age = voice.clock = 0.0f;
    voice.steal = 1.0f;
    voice.ratio = 1.0f;
    voice.numer = voice.denom = 1;
    voice.placed = false;
    voice.pending = false;
    voice.sounding = true;
    voice.blend = kTable;
    strike(voice, gain, true);
  }

  // A key goes down, on a voice that is new or still sounds.
  void strike(Voice& voice, float gain, bool fresh) {
    voice.velocity = gain;
    if (fresh) voice.force = gain;
    voice.attack_from = fresh ? 0.0f : voice.level;
    voice.attack_at = 0.0f;
    voice.hold_level = 1.0f;
    voice.struck_for = 0.0f;
    voice.rhythm = 1.0f;
    voice.since_release = 0.0f;
    voice.phase = 0.0;
    voice.path_phase = 0.0;
    voice.path_time = 0.0f;
    voice.stair = 0;
    voice.climbed = 1.0f;
    voice.home = 0.0f;
    voice.struck = true;
    if (fresh) {
      voice.fused = -1.0f;  // set by the first control
      voice.target = 0.0;
    }
  }

  // Who is the bass, and where everybody's ratio puts them.
  void place_keys() {
    using namespace chord_clock_dsp;
    retune_ = false;
    Voice* bass = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding || voice.pending || voice.released()) continue;
      if (!bass || voice.played < bass->played) bass = &voice;
    }
    if (!bass) return;
    if (bass != anchor_ || bass->played != anchor_hz_) {
      anchor_ = bass;
      anchor_hz_ = bass->played;
      master_ = bass->placed ? std::floor(bass->target + 0.5) + wrap(bass->phase) : 0.0;
    }
    const int family = kit::clamp_int(static_cast<int>(param(chord_clock::kRatios) + 0.5f) - 1, 0, 4);
    const float agree = param(chord_clock::kAgree);
    int together = 1;
    for (Voice& voice : voices_) {
      if (!voice.sounding || voice.pending || voice.released()) continue;
      const float above = 12.0f * std::log2(voice.played / anchor_hz_);
      const int semitones = static_cast<int>(above + 0.5f);
      const Fraction f = ratio_of(family, semitones);
      voice.numer = f.p;
      voice.denom = f.q;
      voice.ratio = static_cast<float>(f.p) / static_cast<float>(f.q);
      // Plain ratios sound a little brighter than far ones.
      voice.accord_to = 0.35f - 0.11f * kit::min(std::log2(static_cast<float>(f.p) * static_cast<float>(f.q)), 16.0f);
      if (voice.age < kFresh) voice.accord = voice.accord_to;
      const float exact = anchor_hz_ * voice.ratio;
      voice.aim = &voice == bass ? voice.played : voice.played * std::pow(exact / voice.played, agree);
      const float turn = static_cast<float>(semitones) * 0.618034f;
      voice.offset = turn - std::floor(turn);
      if (voice.age < kFresh) voice.hz = voice.aim;
      voice.target = agree < 0.995f && voice.placed ? voice.target : master_ * static_cast<double>(voice.ratio);
      voice.placed = true;
      const int lcm = together / gcd(together, f.q) * f.q;
      together = lcm > 4096 ? together : lcm;
    }
    root_return_ = together < 2 ? 4 : together;
  }

  // The part of a phase round the nearest whole number, -0.5 to 0.5.
  static double wrap(double x) { return x - std::floor(x + 0.5); }

  // --- a chunk -------------------------------------------------------------------

  void render_chunk() {
    for (kit::Smoother& smoother : knobs_) smoother.next();
    bool begun = false;
    for (Voice& voice : voices_) {
      if (voice.sounding && voice.pending && voice.steal <= 0.0f) {
        start(voice, voice.pending_hz, voice.pending_gain);
        begun = true;
      }
    }
    if (retune_ || begun) place_keys();
    for (int i = 0; i < kChunk; ++i) mix_left_[i] = mix_right_[i] = 0.0f;
    slow_factor_ = std::exp2(-knob(chord_clock::kSlowness));
    float crowd = 0.0f;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      crowd += voice.velocity * (voice.released() ? voice.level : 1.0f);
      render_voice(voice);
    }
    finish_chunk(crowd);
    master_ += static_cast<double>(anchor_hz_ * slow_factor_ / sample_rate()) * kChunk;
  }

  // Many keys are each a little softer, so that a chord has room.
  void finish_chunk(float crowd) {
    const float to = 1.0f / std::sqrt(1.0f + 0.45f * kit::max(crowd - 0.7f, 0.0f));
    const float from = crowd_ < 0.0f ? to : crowd_;
    crowd_ = from + (to - from) * (1.0f - std::exp(-dt_ / 0.06f));
    const float step = (crowd_ - from) * (1.0f / kChunk);
    float gain = from;
    for (int i = 0; i < kChunk; ++i) {
      gain += step;
      mix_left_[i] *= gain;
      mix_right_[i] *= gain;
    }
  }

  // How far along the path a key is: octaves below pitch, 0 to Slowness.
  float path_below(const Voice& voice, int path, float slowness, int* stair) const {
    using namespace chord_clock_dsp;
    float u = voice.path_time;
    *stair = 0;
    switch (path) {
      case kGlide:
        u = kit::min(u, 1.0f);
        return slowness * (1.0f - u);
      case kSteps: {
        const int steps = static_cast<int>(std::ceil(slowness - 0.001f));
        *stair = kit::clamp_int(static_cast<int>(kit::min(u, 1.0f) * (static_cast<float>(steps) + 0.999f)), 0, steps);
        return kit::max(slowness - static_cast<float>(*stair), 0.0f);
      }
      case kSlowing:
        return slowness * kit::min(u, 1.0f);
      default: {
        u = 2.0f * (u - std::floor(u));
        u = u > 1.0f ? 2.0f - u : u;
        return slowness * (1.0f - u * u * (3.0f - 2.0f * u));
      }
    }
  }

  void render_voice(Voice& voice) {
    using namespace chord_clock;
    using namespace chord_clock_dsp;
    const float sr = sample_rate();
    const int pulse = choice_of(kPulse, kNumPulses), body = choice_of(kBody, kNumBodies), path = choice_of(kPath, kNumPaths);
    const Material& material = chord_clock_dsp::material(pulse);
    const Resonator& bodied = resonator(body);
    const bool released = voice.released() && !voice.pending;
    const float touch = knob(kTouch);
    voice.force += (voice.velocity - voice.force) * (1.0f - std::exp(-dt_ / 0.006f));
    if (std::fabs(voice.force - voice.velocity) < 1.0e-5f) voice.force = voice.velocity;
    const float force = 4.0f * touch * (voice.velocity - 0.7f);  // in octaves of colour

    // Pitch.
    if (voice.hz != voice.aim) {
      const float k = 1.0f - std::exp(-dt_ / (kGlideSeconds * 0.4f));
      voice.hz += (voice.aim - voice.hz) * k;
      if (std::fabs(voice.hz - voice.aim) < 1.0e-5f * voice.aim) voice.hz = voice.aim;
    }

    voice.accord += (voice.accord_to - voice.accord) * (1.0f - std::exp(-dt_ / 0.1f));

    // Clocks.
    const float slowness = knob(kSlowness);
    const bool locked = !released && param(kAgree) >= 0.995f;
    float rate = voice.hz * slow_factor_;
    if (released) {
      const float gone = voice.since_release / (0.35f * knob(kRelease) + 0.15f);
      rate *= std::exp2(-3.5f * knob(kSlowAgain) * (1.0f - std::exp(-gone)));
    }
    double step = static_cast<double>(rate / sr) * kChunk;
    if (locked) {
      step = static_cast<double>(anchor_hz_ * slow_factor_ / sr) * kChunk * static_cast<double>(voice.ratio);
      voice.target = master_ * static_cast<double>(voice.ratio);
    }
    const double own = step;
    if (!released) {
      const double error = wrap(voice.target + static_cast<double>(voice.offset * knob(kStagger)) - voice.phase);
      const double most = 0.4 * step;
      double nudge = error * static_cast<double>(dt_ * kit::min(0.35f * rate, 1.5f) + 1.0e-6f);
      nudge = nudge > most ? most : (nudge < -most ? -most : nudge);
      step += nudge;
    }

    // The path.
    int stair = 0;
    const float below = path_below(voice, path, slowness, &stair);
    const float fused = path == kSteps || slowness < 0.01f
                            ? (slowness < 0.01f ? 1.0f : 1.0f - below / slowness)
                            : 1.0f - below / slowness;
    const float ease = 1.0f - std::exp(-dt_ / 0.05f);
    if (voice.fused < 0.0f) {
      voice.fused = fused;
      voice.below = below;
      voice.blend = kTable;
    } else {
      voice.fused += (fused - voice.fused) * ease;
      voice.below += (below - voice.below) * ease;
    }
    // A tone that slows down first has to be there.
    voice.path_time += dt_ / knob(kQuicken) * (path == kSlowing ? kit::min(0.05f + voice.attack_at, 1.0f) : 1.0f);
    if (voice.path_time > 4.0f) voice.path_time -= 2.0f;  // past its end, or whole rounds
    if (stair != voice.stair) {
      if (path == kSteps && stair > voice.stair && !released) voice.climbed = voice.hold_level = 1.0f;  // every stair is a small strike
      voice.stair = stair;
    }
    voice.climbed *= std::exp(-dt_ / 0.4f);

    // Envelopes.
    if (released) voice.since_release += dt_;
    advance_level(voice, material, bodied, released);
    voice.age += dt_;
    voice.struck_for += dt_;
    voice.clock += dt_;

    // Pulses.
    float imp[kChunk + 2] = {};
    imp[0] = voice.imp_carry;
    const float hardness = 0.15f + 1.35f * touch;
    const float force_gain = std::pow(kit::max(voice.velocity, 0.02f) * (1.0f / 0.7f), hardness) * 0.7f;
    const float tone_force = std::pow(kit::max(voice.force, 0.02f) * (1.0f / 0.7f), hardness) * 0.7f;
    const float width = std::exp2(4.0f * (knob(kPulseWidth) - 0.5f) - 0.6f * force);
    float tau = material.tau * width;
    tau = kit::min(tau, 0.16f / kit::max(rate, 0.05f));
    const float ring = kit::clamp(body_ring(material, bodied, voice.hz), 0.01f, 20.0f);
    const float piled = hits_piled(material, rate, ring);
    const float soft = std::pow(1.0f + square(kit::kTwoPi * kit::min(voice.hz, 2000.0f) * tau), material.imp > 0.0f ? 0.55f : 0.0f) * (material.imp > 0.0f ? 1.0f : std::pow(width, -0.35f));
    const float base = kPulseLevel * material.level * bodied.level * force_gain * piled * soft * voice.rhythm;
    float lift_to = 0.0f;
    if (voice.struck) {
      voice.struck = false;
      drop_pulse(imp, 0.0, base * knob(kRhythm));
      lift_to = 1.0f;
      voice.chirp = 1.0f;
    }
    if (voice.rhythm > 0.0f) {
      const float amount = base * knob(kRhythm) * (1.0f + (path == kSlowing ? 1.8f : 0.9f) * knob(kBloom) * (1.0f - voice.fused));
      lift_to = kit::max(lift_to, clock_pulses(voice, step, amount, imp, rate));
      lift_to = kit::max(lift_to, path_pulses(voice, material, path, stair, step, below, slowness, rate, amount, ring, imp));
    }
    voice.phase += step;
    voice.target += own;

    // What the pulses lift.
    voice.lift_raw = kit::max(voice.lift_raw, lift_to);
    const float lift_rate = kit::max(rate * std::exp2(slowness - kit::max(voice.below, 1.0f)) * (below > 0.05f && below < slowness ? 1.0f : 0.0f), rate);
    const float lift_seconds = kit::clamp(0.45f / kit::max(lift_rate, 0.3f), 0.03f, 0.9f);
    voice.lift_raw *= std::exp(-dt_ / lift_seconds);
    voice.lift += (voice.lift_raw - voice.lift) * (1.0f - std::exp(-dt_ / 0.014f));

    voice.home *= std::exp(-dt_ / 0.7f);
    voice.glint += (voice.home - voice.glint) * (1.0f - std::exp(-dt_ / 0.03f));

    for (float* slow : {&voice.home, &voice.glint, &voice.climbed, &voice.climb, &voice.lift_raw, &voice.lift, &voice.below, &voice.fused}) {
      *slow = settle_to_zero(*slow);  // each of these only ever shrinks under a long key
    }
    shape_pulses(voice, material, imp, tau, sr);
    const float blown = voice.level * tone_force * tone_knob() * (0.55f + 0.45f * voice.lift) * std::exp2(1.2f * (knob(kPulseWidth) - 0.5f));
    const float air = (material.air + bodied.air) * kAirLevel * blown;
    const float wind = (material.wind + bodied.wind) * kWindLevel * noise_scale_ * blown * (0.35f + 0.65f * voice.fused);
    tune_body(voice, material, bodied, ring, sr);
    voice.knock.set(kit::clamp(bodied.knock_hz * std::exp2(0.35f * (std::log2(voice.hz) - 8.0f) + 0.5f * force), 80.0f, 7000.0f), 0.9f, sr);
    render_body(voice, material, tau, air, wind);
    render_tone(voice, material, bodied, pulse, body, path, force, tone_force);
    voice.imp_carry = imp[kChunk];
    retire_or_fade(voice);
  }

  static float square(float x) { return x * x; }

  // A short attack is a stroke: the tone starts over its level, and bright.
  float bite(const Voice& voice, const chord_clock_dsp::Material& material) const {
    if (voice.struck_for > 6.0f) return 0.0f;
    const float sharp = kit::clamp(std::log2(0.5f / knob(chord_clock::kAttack)) * 0.15f, 0.0f, 1.0f);
    return sharp * (0.3f + 0.7f * material.sustain) * std::exp(-voice.struck_for * 1.2f);
  }

  // A ringing mode keeps what came before: near pulses are each made smaller.
  // Noise does not pile up: it is as loud as it is, however long it goes on.
  static float hits_piled(const chord_clock_dsp::Material& material, float rate, float ring) {
    const float power = material.imp > 0.0f ? 0.7f : 0.2f;
    const float left = kSixtyDb / (kit::max(rate, 0.02f) * ring);
    return left > 12.0f ? 1.0f : std::pow(1.0f - std::exp(-left), power);
  }

  float body_ring(const chord_clock_dsp::Material& material, const chord_clock_dsp::Resonator& bodied, float hz) const {
    return bodied.ring * material.ring * std::exp2(5.0f * (0.5f - knob(chord_clock::kDamping))) *
           std::pow(kit::clamp(220.0f / hz, 0.1f, 4.0f), 0.4f);
  }

  void advance_level(Voice& voice, const chord_clock_dsp::Material& material, const chord_clock_dsp::Resonator& bodied,
                     bool released) {
    using namespace chord_clock;
    using namespace chord_clock_dsp;
    // Stairs end short; there and back ends slowly; slowing leaves its pulses behind.
    static constexpr float kPathRelease[kNumPaths] = {1.0f, 0.4f, 0.5f, 2.8f};
    if (released) {
      const float seconds = knob(kRelease) * bodied.release * material.release * kPathRelease[choice_of(kPath, kNumPaths)] * (1.15f - 0.65f * knob(kSlowAgain)) * std::exp2(1.6f * (0.5f - knob(kDamping)));
      voice.level *= std::exp(-kSixtyDb * dt_ / seconds);
      if (voice.level < 1.0e-7f) voice.level = 0.0f;  // before the noise that goes with it is too small to count
      voice.rhythm = settle_to_zero(voice.rhythm * std::exp(-kSixtyDb * dt_ / (knob(kRelease) * (0.7f + 2.6f * knob(kSlowAgain)) * (choice_of(kPath, kNumPaths) == kSlowing ? 1.8f : 1.0f))));
      if (voice.rhythm < 2.0e-4f) voice.rhythm = 0.0f;
      return;
    }
    if (voice.attack_at < 1.0f) {
      const float seconds = kit::clamp(knob(kAttack) * kit::min(material.attack * bodied.attack, 5.5f), 0.004f, 10.0f);
      voice.attack_at = kit::min(voice.attack_at + dt_ / seconds, 1.0f);
      const float t = voice.attack_at;
      const float s = t * (2.0f - t);  // speaks at once, arrives gently
      voice.level = voice.attack_from + (1.0f - voice.attack_from) * s * (0.25f + 0.75f * t);
      return;
    }
    // Pulses that run together keep a dying tone going.
    const float sustain = kit::max(material.sustain * bodied.sustain, choice_of(kPath, kNumPaths) == kSteps ? 0.0f : 0.32f * square(voice.fused));
    const float fall = kit::min(material.fall, bodied.fall);
    voice.hold_level = sustain + (voice.hold_level - sustain) * std::exp(-dt_ / fall);
    voice.level = voice.hold_level;
  }

  // One pulse at `at` samples into the chunk, between two samples.
  static void drop_pulse(float* imp, double at, float amount) {
    const int i = static_cast<int>(at);
    const float part = static_cast<float>(at - i);
    imp[i] += amount * (1.0f - part);
    imp[i + 1] += amount * part;
  }

  // The key's own clock.
  float clock_pulses(Voice& voice, double step, float amount, float* imp, float rate) {
    float lift = 0.0f;
    double next = std::floor(voice.phase) + 1.0;
    const double end = voice.phase + step;
    const bool bass = &voice == anchor_;
    const int period = bass ? root_return_ : voice.numer;
    const float accent = knob(chord_clock::kAccent);
    for (int guard = 0; next <= end && guard < kChunk; next += 1.0, ++guard) {
      const double at = kit::min((next - voice.phase) / step * kChunk, kLastPlace);
      const long index = static_cast<long>(std::floor(voice.target + (next - voice.phase) + 0.5));
      const bool home = !voice.released() && period > 1 && ((index % period) + period) % period == 0;
      const float stress = home ? 1.0f + 1.8f * accent : 1.0f - 0.65f * accent;
      drop_pulse(imp, at < 0.0 ? 0.0 : at, amount * stress);
      lift = kit::max(lift, kit::min(stress, 2.2f));
      if (home && rate < 25.0f) voice.home = 1.0f;
      if (rate < 25.0f) voice.chirp = 1.0f;
    }
    return lift;
  }

  // The pulses that quicken.
  float path_pulses(Voice& voice, const chord_clock_dsp::Material& material, int path, int stair, double step, float below, float slowness, float rate, float amount,
                    float ring, float* imp) {
    using namespace chord_clock_dsp;
    const float speed = rate * std::exp2(slowness - below);
    double stride = step * static_cast<double>(std::exp2(slowness - below));
    float gain = kit::clamp((below - 0.6f) * 0.6f, 0.0f, 1.0f) * kit::clamp((slowness - below) * 2.0f, 0.0f, 1.0f) *
                 kit::clamp((240.0f - speed) * (1.0f / 150.0f), 0.0f, 1.0f);
    double from = voice.path_phase;
    if (path == kSteps) {
      from = std::ldexp(voice.phase, stair);
      stride = std::ldexp(step, stair);
      if (stair == 0) gain = 0.0f;
    } else {
      voice.path_phase += stride;
      if (voice.path_phase > 1.0e6) voice.path_phase -= 1.0e6;
    }
    if (gain <= 0.0f || stride <= 0.0) return 0.0f;
    const float heavier = hits_piled(material, speed, ring) / hits_piled(material, rate, ring);
    const float each = amount * 1.15f * gain * heavier;
    float lift = 0.0f;
    double next = std::floor(from) + 1.0;
    const long whole = 1L << stair;
    for (int guard = 0; next <= from + stride && guard < kChunk; next += 1.0, ++guard) {
      const double at = kit::min((next - from) / stride * kChunk, kLastPlace);
      if (path == kSteps && static_cast<long>(next) % whole == 0) continue;  // the clock has that one
      drop_pulse(imp, at < 0.0 ? 0.0 : at, each);
      lift = 0.85f * gain;
      if (speed < 25.0f) voice.chirp = kit::max(voice.chirp, 0.8f * gain);
    }
    return lift;
  }

  // The smooth pulse under everything: two one-poles whose whole is one.
  void shape_pulses(Voice& voice, const chord_clock_dsp::Material& material, const float* imp, float tau, float sr) {
    const float a = std::exp(-1.0f / kit::max(tau * sr, 0.05f));
    const float b = 1.0f - a;
    // A pulse under way keeps its height when its length is changed.
    const float kept = voice.tau > 0.0f ? voice.tau / tau : 1.0f;
    voice.tau = tau;
    float y1 = voice.env1 * kept, y2 = voice.env2 * kept;
    for (int i = 0; i < kChunk; ++i) {
      y1 = imp[i] * b + y1 * a;
      y2 = y1 * b + y2 * a;
      shape_[i] = y2;
    }
    voice.env1 = flush_denormal(y1);
    voice.env2 = flush_denormal(y2);
    if (material.chirp > 0.0f) {
      voice.chirp = voice.chirp < 1.0e-4f ? 0.0f : voice.chirp * std::exp(-dt_ / 0.016f);
    } else {
      voice.chirp = 0.0f;
    }
  }

  void tune_body(Voice& voice, const chord_clock_dsp::Material& material, const chord_clock_dsp::Resonator& bodied, float ring,
                 float sr) {
    const float hz = voice.hz * (1.0f - material.chirp * voice.chirp);
    if (hz == voice.tuned_hz && ring == voice.tuned_ring && &material == voice.tuned_material && &bodied == voice.tuned_body) return;
    voice.tuned_hz = hz;
    voice.tuned_ring = ring;
    voice.tuned_material = &material;
    voice.tuned_body = &bodied;
    const float top = kit::min(15000.0f, 0.42f * sr);
    for (int k = 0; k < kModes; ++k) {
      const float f = hz * bodied.ratio[k];
      const float edge = kit::clamp((top - f) * (1.0f / 3000.0f), 0.0f, 1.0f);
      if (edge <= 0.0f || f < 18.0f) {
        voice.step_re[k] = voice.step_im[k] = voice.push[k] = voice.hiss[k] = 0.0f;
        continue;
      }
      const float r = std::exp(-kSixtyDb / (ring * bodied.keep[k] * sr));
      const float turn = f / sr;
      voice.step_re[k] = r * kit::SineTable::cos_lookup(turn);
      voice.step_im[k] = r * kit::SineTable::lookup(turn);
      float weight = bodied.weight[k] * edge;
      if (material.comb > 0.0f) weight *= std::fabs(kit::SineTable::lookup(0.5f * bodied.ratio[k] * material.comb)) * 1.3f;
      if (bodied.ratio[k] > 1.0f) weight *= std::pow(bodied.ratio[k], material.tilt);
      voice.push[k] = weight;
      voice.hiss[k] = weight * std::sqrt(1.0f - r * r) * 2.45f;  // an even noise gives a mode the level a push does
    }
  }

  void render_body(Voice& voice, const chord_clock_dsp::Material& material, float tau, float air, float wind) {
    const float spread = 0.75f * knob(chord_clock::kWidth);
    const float a_to = kit::kSqrtHalf * std::sqrt(1.0f + spread);
    const float b_to = kit::kSqrtHalf * std::sqrt(1.0f - spread);
    const float push = material.imp;
    const float hiss = material.noise * 2.71828f * tau * sample_rate();
    const float knock = material.knock * kKnockLevel * noise_scale_ * 2.71828f * tau * sample_rate();
    const float wind_step = (wind - voice.wind_gain) * (1.0f / kChunk);
    float wind_gain = voice.wind_gain;
    const float air_step = (air - voice.air_gain) * (1.0f / kChunk);
    const float a_step = (a_to - voice.side_a) * (1.0f / kChunk), b_step = (b_to - voice.side_b) * (1.0f / kChunk);
    float air_gain = voice.air_gain, side_a = voice.side_a, side_b = voice.side_b;
    const float fade = voice.pending ? 1.0f : 0.0f;
    const float steal_step = fade * dt_ / (kStealSeconds * kChunk);
    float steal = voice.steal;
    float re[kModes], im[kModes];
    for (int k = 0; k < kModes; ++k) {
      re[k] = voice.re[k];
      im[k] = voice.im[k];
    }
    const bool turned = voice.seed >= 0.5f;
    // What a soft push moves under the note is not heard as the note: it is taken off.
    const float low_keep = std::exp(-kit::kTwoPi * 0.24f * voice.hz / sample_rate());
    float one_in = voice.low[0], one_mid = voice.low[1], one_out = voice.low[2];
    float two_in = voice.low[3], two_mid = voice.low[4], two_out = voice.low[5];
    for (int i = 0; i < kChunk; ++i) {
      const float white = voice.rng.bipolar();
      air_gain += air_step;
      wind_gain += wind_step;
      const float x = shape_[i] * push;
      const float puff = voice.knock.bandpass(white * (shape_[i] * knock + wind_gain)) * kit::kSqrtHalf;
      const float n = white * (shape_[i] * hiss + air_gain);
      float y[kModes];
      for (int k = 0; k < kModes; ++k) {
        const float next = voice.step_re[k] * re[k] - voice.step_im[k] * im[k] + voice.push[k] * x + voice.hiss[k] * n;
        im[k] = voice.step_re[k] * im[k] + voice.step_im[k] * re[k];
        re[k] = next;
        y[k] = im[k];
      }
      // The first mode stays in the middle, the others go to the sides by turns.
      const float centre = y[0] * kit::kSqrtHalf + puff;
      const float a = y[1] + y[3] + y[5] + y[7], b = y[2] + y[4] + y[6];
      side_a += a_step;
      side_b += b_step;
      steal -= steal_step;
      const float left_of_it = steal > 0.0f ? steal : 0.0f;
      const float out = left_of_it * left_of_it * (3.0f - 2.0f * left_of_it);
      const float one = centre + a * side_a + b * side_b, two = centre + a * side_b + b * side_a;
      const float one_was = one_mid, two_was = two_mid;
      one_mid = one - one_in + low_keep * one_mid;
      two_mid = two - two_in + low_keep * two_mid;
      one_out = one_mid - one_was + low_keep * one_out;
      two_out = two_mid - two_was + low_keep * two_out;
      one_in = one;
      two_in = two;
      mix_left_[i] += (turned ? two_out : one_out) * out;
      mix_right_[i] += (turned ? one_out : two_out) * out;
      fade_[i] = out;
    }
    for (int k = 0; k < kModes; ++k) {
      voice.re[k] = flush_denormal(re[k]);
      voice.im[k] = flush_denormal(im[k]);
    }
    const float kept[6] = {one_in, one_mid, one_out, two_in, two_mid, two_out};
    for (int i = 0; i < 6; ++i) voice.low[i] = flush_denormal(kept[i]);
    voice.air_gain = air;
    voice.wind_gain = wind;
    voice.side_a = a_to;
    voice.side_b = b_to;
    voice.steal = steal;
  }

  // --- tone ------------------------------------------------------------------------

  void render_tone(Voice& voice, const chord_clock_dsp::Material& material, const chord_clock_dsp::Resonator& bodied, int pulse,
                   int body, int path, float force, float force_gain) {
    using namespace chord_clock;
    if (voice.blend >= kTable) {
      if (voice.colour_pulse < 0) {
        colour(voice, material, bodied, pulse, body);
        build(voice, voice.now, material, bodied, path, force);
      } else {
        voice.now ^= 1;
        if (voice.colour_pulse != pulse || voice.colour_body != body || std::fabs(voice.colour_hz - voice.hz) > 1.0e-3f * voice.hz ||
            std::fabs(voice.colour_damping - knob(kDamping)) > 0.004f) {
          colour(voice, material, bodied, pulse, body);
        }
      }
      build(voice, voice.now ^ 1, material, bodied, path, force);
      voice.blend = 0;
    }
    const float waits = kit::min(knob(kBloom) * (path == chord_clock_dsp::kGlide ? 0.8f : (path == chord_clock_dsp::kSlowing ? 1.0f : 1.5f)), 1.0f);
    float bloom = 1.0f - waits * (1.0f - voice.fused);
    if (path == chord_clock_dsp::kSteps) {
      // A stair is struck and dies away a little; the last one stays.
      voice.climb += (voice.climbed - voice.climb) * (1.0f - std::exp(-dt_ / 0.012f));
      const float stays = kit::clamp(6.0f * voice.fused - 5.0f, 0.0f, 1.0f);
      bloom = (1.0f + 0.25f * waits * (1.0f - stays) * voice.climb) * (1.0f - waits * (1.0f - stays) * (1.0f - voice.climb));
    }
    const float lift = knob(kLift) * (1.75f - 0.75f * knob(kLift));  // felt early
    const float lifted = 1.0f - lift * 0.96f * (1.0f - kit::min(voice.lift, 1.5f));
    const float struck = (1.0f + 1.4f * bite(voice, material) * (path == chord_clock_dsp::kSteps ? 1.0f : 1.0f + 1.2f * waits * (1.0f - voice.fused))) * std::exp2(0.3f * voice.accord * knob(kAgree));
    const float tilt = std::pow(voice.hz * (1.0f / 262.0f), -0.06f);
    const float wanted = kToneLevel * tone_knob() * (1.0f + 0.5f * lift) * (1.0f + 0.3f * knob(kBloom)) * force_gain * voice.level * bloom * bloom * struck *
                     kit::max(lifted, 0.03f) * (1.0f + knob(kAccent) * (1.5f * voice.glint - 0.15f)) * kit::clamp(tilt, 0.7f, 1.3f);
    // A choice, a path or a new touch moves it in a few milliseconds and never in one.
    const float ended = voice.tone_gain + (wanted - voice.tone_gain) * tone_ease_;
    const float to = ended < 1.0e-9f && wanted < 1.0e-9f ? 0.0f : ended;
    const float step = (to - voice.tone_gain) * (1.0f / kChunk);
    if (to < 1.0e-9f && voice.tone_gain < 1.0e-9f) {
      voice.tone_gain = 0.0f;
      voice.blend += kChunk;
      return;
    }
    const double size = static_cast<double>(kTable);
    const double turn = static_cast<double>(voice.hz) * (size / kPeriods) / static_cast<double>(sample_rate());
    double position = voice.position;
    float gain = voice.tone_gain, share = static_cast<float>(voice.blend) * (1.0f / kTable);
    const float* old_l = voice.table[voice.now][0] + 1;
    const float* old_r = voice.table[voice.now][1] + 1;
    const float* new_l = voice.table[voice.now ^ 1][0] + 1;
    const float* new_r = voice.table[voice.now ^ 1][1] + 1;
    for (int i = 0; i < kChunk; ++i) {
      const int at = static_cast<int>(position);
      const float t = static_cast<float>(position - at);
      position += turn;
      if (position >= size) position -= size;
      // Hermite's four weights, the same for all four tables.
      const float t2 = t * t, t3 = t2 * t;
      const float w0 = -0.5f * t3 + t2 - 0.5f * t, w1 = 1.5f * t3 - 2.5f * t2 + 1.0f;
      const float w2 = -1.5f * t3 + 2.0f * t2 + 0.5f * t, w3 = 0.5f * t3 - 0.5f * t2;
      const float a = old_l[at - 1] * w0 + old_l[at] * w1 + old_l[at + 1] * w2 + old_l[at + 2] * w3;
      const float b = new_l[at - 1] * w0 + new_l[at] * w1 + new_l[at + 1] * w2 + new_l[at + 2] * w3;
      const float c = old_r[at - 1] * w0 + old_r[at] * w1 + old_r[at + 1] * w2 + old_r[at + 2] * w3;
      const float d = new_r[at - 1] * w0 + new_r[at] * w1 + new_r[at + 1] * w2 + new_r[at + 2] * w3;
      gain += step;
      const float out = gain * fade_[i];
      mix_left_[i] += (a + (b - a) * share) * out;
      mix_right_[i] += (c + (d - c) * share) * out;
      share += 1.0f / kTable;
    }
    voice.position = position;
    voice.tone_gain = to;
    voice.blend += kChunk;
  }

  // What does not move of the tone's lines: the pulse's own spectrum and the body.
  void colour(Voice& voice, const chord_clock_dsp::Material& material, const chord_clock_dsp::Resonator& bodied, int pulse,
              int body) {
    using namespace chord_clock_dsp;
    voice.colour_pulse = pulse;
    voice.colour_body = body;
    voice.colour_hz = voice.hz;
    voice.colour_damping = knob(chord_clock::kDamping);
    const float depth = 1.0f + (voice.colour_damping < 0.5f ? 1.1f : 1.6f) * (0.5f - voice.colour_damping);  // a damped body colours less
    const float top = kit::min(13000.0f, 0.44f * sample_rate());
    for (int m = 1; m <= kLines; ++m) {
      const float x = 0.25f * static_cast<float>(m);
      const float hz = x * voice.hz;
      if (hz > top) {
        voice.colour[m] = 0.0f;
        continue;
      }
      float a = std::pow(kit::max(x, 1.0f), -material.slope + bodied.tilt * (x > 1.0f ? 1.0f : 0.0f));
      const float odd = 0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * (x - 1.0f));
      a *= 1.0f - kit::clamp(material.odd + bodied.odd, 0.0f, 0.93f) * (1.0f - odd) * (x > 1.0f ? 1.0f : 0.0f);
      if (material.comb > 0.0f) a *= 0.12f + std::fabs(kit::SineTable::lookup(0.5f * x * material.comb)) * 1.3f;
      a *= std::pow(body_colour(bodied, hz), depth);
      const float high = hz * (1.0f / 5200.0f);
      a /= 1.0f + high * high * high;                                     // nothing buzzes up there
      a *= kit::clamp((hz - 28.0f) * (1.0f / 20.0f), 0.0f, 1.0f);         // nor rumbles
      voice.colour[m] = a;
    }
  }

  // One table for each ear, at one transform: the left in the real part, the
  // right in the imaginary one.
  void build(Voice& voice, int which, const chord_clock_dsp::Material& material, const chord_clock_dsp::Resonator& bodied, int path,
             float force) {
    using namespace chord_clock;
    for (int i = 0; i < kTable; ++i) re_[i] = im_[i] = 0.0f;
    // How far the tone has come together decides how bright it is, and what
    // of the pulses at f/2 and f/4 is left in it.
    const float lower = knob(kLower);
    const float reach = path == chord_clock_dsp::kSteps ? 0.4f + 0.65f * lower : lower * (0.8f + 0.5f * lower);
    const float stays = 1.5f * kit::max(lower - 0.25f, 0.0f);  // and goes on under the whole tone
    const float stair = path == chord_clock_dsp::kSteps ? 3.0f * (1.0f - voice.fused) : voice.below;
    const float half = kit::max(kit::max(reach * kit::clamp(stair, 0.0f, 1.0f), stays), kit::min(bodied.sub * (0.4f + 1.2f * lower), 1.0f));
    const float quarter = kit::max(reach * kit::clamp(stair - 1.0f, 0.0f, 1.0f), stays * stays);
    const float bright = force + 1.2f * (knob(kTone) - 0.75f) - 1.2f * kit::max(lower - 0.5f, 0.0f) + 2.4f * bite(voice, material) + voice.accord * knob(kAgree) + 3.6f * (0.5f - knob(kPulseWidth)) + (path == chord_clock_dsp::kGlide ? 2.8f : 5.0f) * knob(kBloom) * (voice.fused - 0.8f) +
                         1.9f * knob(kLift) * (voice.lift - 0.6f) + 3.0f * knob(kAccent) * voice.glint + (path == chord_clock_dsp::kSteps ? 2.2f * voice.climb : 0.0f);
    const float tilt = 0.3f * bright;
    const float corner = kit::max(material.corner * std::exp2(bright) * std::pow(kit::clamp(262.0f / voice.hz, 0.2f, 4.0f), 0.25f), 0.8f);
    // Gliding keys gather as they fuse; stairs and there and back open out.
    const bool opens = path == chord_clock_dsp::kSteps || path == chord_clock_dsp::kTurn;
    const float width = knob(kWidth) * (0.79f + 0.35f * knob(kWidth)) * material.spread * bodied.spread * (opens ? 0.15f + 1.0f * voice.fused : 1.6f - 0.6f * voice.fused);
    const float turn = kit::hz_to_midi(voice.played) * 0.618034f;
    const float home = 1.9f * (turn - std::floor(turn) - 0.5f);
    const float time = voice.clock;
    float power = 0.0f;
    for (int m = 1; m <= kLines; ++m) {
      const int kind = m & 3;
      const float part = kind == 0 ? 1.0f : (kind == 2 ? half : quarter);
      if (part < 1.0e-4f || voice.colour[m] <= 0.0f) continue;
      const float x = 0.25f * static_cast<float>(m);
      const float over = x / corner;
      const float own = static_cast<float>(m) * 0.7548777f + voice.seed * 7.0f;
      const float slow = own - std::floor(own);
      const float sway = kit::SineTable::lookup(time * (0.05f + 0.11f * slow) + own);
      const float a = voice.colour[m] * part / (1.0f + over * over) * std::exp2(tilt * octave_[m]) * (m < 4 ? 1.5f : 1.0f) * (1.0f + (m == 4 ? 0.10f : 0.42f) * sway);
      const float hz = x * voice.hz;
      power += a * a * (0.55f + 0.45f * hz / (hz + 240.0f));
      // Harmonics sit to both sides by turns and wander; the lowest stays near the middle.
      const float side = m <= 4 ? home : ((m >> 2) & 1 ? 0.8f : -0.8f) * (voice.seed < 0.5f ? 1.0f : -1.0f);
      const float wander = kit::SineTable::lookup(time * (0.031f + 0.05f * slow) + own * 1.7f);
      const float pan = kit::clamp(width * (side + 0.5f * wander), -0.96f, 0.96f);
      const float left = a * std::sqrt(0.5f * (1.0f + pan)), right = a * std::sqrt(0.5f * (1.0f - pan));
      const float drift = 0.13f * kit::SineTable::lookup(time * (0.07f + 0.08f * slow) + own * 2.3f);
      const float stand = 0.021f * static_cast<float>(m) * static_cast<float>(m) * 0.25f + voice.seed;
      const float ear = 0.10f * width * (m <= 4 ? 0.3f : 1.0f) * kit::SineTable::lookup(time * (0.06f + 0.05f * slow) + own * 3.1f);
      const float pl = stand + drift + ear, pr = stand + drift - ear;
      const float lr = left * kit::SineTable::cos_lookup(pl), li = left * kit::SineTable::lookup(pl);
      const float rr = right * kit::SineTable::cos_lookup(pr), ri = right * kit::SineTable::lookup(pr);
      re_[m] = lr - ri;
      im_[m] = li + rr;
      re_[kTable - m] = lr + ri;
      im_[kTable - m] = rr - li;
    }
    fft_.inverse(re_, im_);
    // The choice's own level is in its table, and fades over with it.
    const float scale = power > 1.0e-12f ? 0.7071f * material.gain * bodied.gain / std::sqrt(power) : 0.0f;
    float* left = voice.table[which][0] + 1;
    float* right = voice.table[which][1] + 1;
    for (int i = 0; i < kTable; ++i) {
      left[i] = re_[i] * scale;
      right[i] = im_[i] * scale;
    }
    for (float* ear : {left, right}) {
      ear[-1] = ear[kTable - 1];
      ear[kTable] = ear[0];
      ear[kTable + 1] = ear[1];
    }
  }

  void retire_or_fade(Voice& voice) {
    if (voice.pending || !voice.released() || voice.struck) return;
    float ringing = 0.0f;
    for (int k = 0; k < kModes; ++k) ringing += voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
    if (voice.level > 4.0e-6f || voice.rhythm > 0.0f || ringing > kSilence * kSilence * 25.0f || std::fabs(voice.low[2]) + std::fabs(voice.low[5]) > 1.0e-6f || voice.env1 > 1.0e-7f ||
        voice.env2 > 1.0e-7f) {
      return;
    }
    voice.sounding = false;
    if (anchor_ == &voice) anchor_ = nullptr;
  }

  Voice voices_[kMaxVoices];
  kit::Fft<kTable> fft_;
  kit::Smoother knobs_[chord_clock::kNumParams];  // once a chunk
  kit::Smoother volume_;                          // every sample
  Voice* anchor_ = nullptr;
  float anchor_hz_ = 220.0f;
  double master_ = 0.0;
  int root_return_ = 4;
  bool retune_ = false;
  float slow_factor_ = 0.01f;
  float crowd_ = -1.0f;  // the gain many keys leave each, under 0 before the first chunk
  float dt_ = 0.001f, noise_scale_ = 1.0f, tone_ease_ = 0.2f;
  int chunk_left_ = 0;
  uint32_t stamp_ = 0;
  float mix_left_[kChunk] = {}, mix_right_[kChunk] = {};
  float shape_[kChunk] = {}, fade_[kChunk] = {};
  float octave_[kLines + 1] = {};  // log2 of a line's ratio, 0 under the note
  float re_[kTable] = {}, im_[kTable] = {};
};

}  // namespace livemix
