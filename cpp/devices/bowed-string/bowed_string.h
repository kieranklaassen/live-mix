#pragma once

// Bow: one string, three ways to play it.
//
//                    ┌──────── nut side delay ◄───────┐
//                    ▼ (-1)                           │
//   exciter ──► junction (pick / ebow / bow point) ──(+)──┐
//                    ▲ (-g · damping)                     │
//                    └────── bridge side delay ◄──────────┴──► string out
//
//   strings (two per note, detuned) ─► swell ─► body modes ─► volume ─► out
//
// - The string is a waveguide cut in two at the playing point: `position` is
//   the share of the string on the bridge side, so the comb of a pick or bow
//   point (no partials with a node there) falls out of the structure.
// - Damping is a one-pole low-pass at the bridge. Its phase delay at the
//   fundamental is subtracted from the delay lines and its loss there is
//   given back by the loop gain, so pitch and `decay` hold at any brightness.
// - Pluck injects an impulse and one period of shaped noise.
// - Ebow and Bow are one driver. It measures the string's own fundamental
//   at the junction (against a phasor at the note's frequency, averaged down
//   to the control rate: a lock-in) and feeds back a unit-amplitude copy in
//   phase, scaled by how far the string is from the level the attack
//   envelope asks for: the string blooms from a -68 dB seed and then holds.
//   So the pitch is the string's, not an oscillator's.
// - The upper partials are driven from a table read at the string's phase,
//   drawn for what each mode wants at the bridge: the ebow adds a little
//   twelfth and, pressed hard, hands the level to the octave; the bow draws
//   the ramp of a slipping string (partials as h^-s, steeper for a light
//   bow), with rosin noise let in during the slip. That drive is open loop,
//   so the table is drawn against the loop exactly as the samples see it
//   (interpolated reads included), and a driven string is held just short
//   of its freest ring so no partial hangs on the last fraction of a cent.
// - A memoryless friction junction was tried for the bow and dropped: it
//   fell into double-slip and whistling regimes for most positions above a
//   sixth of the string and at random pitches below, and inside the regime
//   that does work its spectrum does not follow the pressure.
// - A released string is damped to ring for `release`, or for `decay` when
//   that is shorter.
//
// The instrument sleeps when every string has rung out below -160 dB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class BowedString : public kit::DeviceBase<bowed_string::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  enum Mode : int { kPluck = 0, kEbow = 1, kBow = 2 };

  void init(float sample_rate) {
    using namespace bowed_string;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      for (String& string : voice.strings) {
        string = String();
        string.clear();
      }
      voice.env = kit::Adsr();
      voice.env.set_sample_rate(sr);
      voice.rng.seed(0x51A7E5u + 104729u * static_cast<uint32_t>(v));
      voice.pick[0].reset();
      voice.pick[1].reset();
      voice.rosin.reset();
      voice.rosin.set_cutoff(2500.0f, sr);
      voice.sounding = voice.released = voice.pending = false;
      voice.follow = voice.chunk_peak = 0.0f;
      voice.steal = 1.0f;
      voice.bow_on = 0.0f;
      voice.mode = kPluck;
      voice.table_now = 0;
      voice.table_mix = 1.0f;
      voice.rosin_gain = 0.0f;
      for (float& value : voice.drawn) value = 0.0f;
      for (int t = 0; t < 2; ++t) {
        for (int i = 0; i <= kTable; ++i) voice.table[t][i] = voice.lead[t][i] = 0.0f;
      }
    }
    for (int c = 0; c < 2; ++c) {
      for (int m = 0; m < kBodyModes; ++m) {
        body_[c][m].reset();
        body_[c][m].set(kBodyHz[c][m], kBodyQ[m], sr);
      }
      rumble_[c].reset();
      rumble_[c].set_cutoff(18.0f, sr);
    }
    body_amount_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    fft_.init();
    redraw_next_ = 0;
    mix_step_ = 1.0f / (0.02f * sr);
    chunk_left_ = 0;
    lift_coeff_ = kit::time_to_coeff(0.008f, sr);
    steal_step_ = 1.0f / (0.002f * sr);
    // Nothing outlives the strings but the body modes (a few tens of ms).
    idle_.reset(sr, 0.25f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: mute the old string quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      pool_.voices[held].released = true;
      pool_.voices[held].choke = true;
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // Fade the old note over 2 ms, then start (see render_voice).
      voice.pending = true;
      voice.released = false;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
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
    if (voice.mode != kPluck) voice.env.gate_off();
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
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
      float left[kChunk] = {}, right[kChunk] = {};
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].sounding) render_voice(pool_.voices[v], kChunk - chunk_left_, n, left, right);
      }
      finish_chunk(left, right, n, done);
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // 20 Hz at 96 kHz is 4800 samples; the bridge side holds at most half.
  static constexpr int kNutSize = 8192;
  static constexpr int kBridgeSize = 4096;

  static constexpr int kChunk = 16;  // control period, samples
  static constexpr int kTable = 1024;
  static constexpr int kMaxHarmonics = 240;

  // One waveguide string. Delays glide linearly between control ticks so
  // vibrato and position changes do not step.
  struct String {
    kit::DelayLine<kNutSize> nut;
    kit::DelayLine<kBridgeSize> bridge;
    float damp = 0.0f;        // bridge low-pass state
    float nut_delay = 100.0f, bridge_delay = 10.0f;
    float nut_step = 0.0f, bridge_step = 0.0f;
    float damp_lag = 0.0f;    // the low-pass's phase delay at the fundamental, samples
    float ratio = 1.0f;       // detune
    // The driver (ebow and bow). A phasor turns at the note's frequency; the
    // junction's velocity against it, averaged down to the control rate and
    // low-passed there, is the string's fundamental as a slow complex number.
    float ref_phase = 0.0f, ref_step = 0.0f;       // cycles
    float turn_re = 1.0f, turn_im = 0.0f;          // the phasor
    float spin_re = 1.0f, spin_im = 0.0f;          // its turn per sample
    float sum[4] = {0.0f, 0.0f, 0.0f, 0.0f};       // triangle-weighted sums: this tick's and the next's
    float seen[4][2] = {};                         // four one-poles at the control rate
    float seen_coeff = 0.0f;
    float lock_re = 1.0f, lock_im = 0.0f;          // the string's phase against the phasor, unit length
    float lock_re_step = 0.0f, lock_im_step = 0.0f;
    float offset = 0.0f, offset_step = 0.0f;       // the same angle in cycles, for the tables
    float target = 0.0f;      // junction amplitude asked of the fundamental
    float hold = 0.0f;        // drive that holds it there against the string's loss
    float reach = 1.0f;       // error gain
    float error = 0.0f, error_coeff = 0.0f;        // smoothed level error
    float push = 0.0f, push_step = 0.0f;           // drive on the fundamental
    float partial = 0.0f, partial_step = 0.0f;     // envelope of the upper partials
    float partial_lag = 0.0f, partial_coeff = 0.0f;
    float last_drive = 0.0f;  // what the junction was given a sample ago
    bool on = false;

    void clear() {
      nut.clear();
      bridge.clear();
      damp = 0.0f;
      ref_phase = 0.0f;
      turn_re = 1.0f;
      turn_im = 0.0f;
      for (float& value : sum) value = 0.0f;
      for (auto& pole : seen) pole[0] = pole[1] = 0.0f;
      lock_re = 1.0f;
      lock_im = lock_re_step = lock_im_step = 0.0f;
      offset = offset_step = 0.0f;
      error = push = push_step = partial = partial_step = partial_lag = last_drive = 0.0f;
    }
  };

  struct Voice {
    String strings[2];
    kit::Adsr env;            // attack: ebow level, bow speed, pluck swell
    kit::Rng rng;
    kit::OnePole pick[2];     // pluck burst shaping
    kit::OnePole rosin;       // bow noise shaping
    int mode = kPluck;
    float frequency = 220.0f;
    float strength = 0.0f;    // from velocity
    float loop_gain = 0.99f, damp_coeff = 0.0f;
    float bow_on = 0.0f;      // 1 while the bow or ebow touches the string
    float follow = 0.0f, chunk_peak = 0.0f;
    float vib_phase = 0.0f, vib_fade = 0.0f;
    float age = 0.0f;         // seconds since note-on
    float steal = 1.0f;       // fades the old note out before a stolen start
    int burst_left = 0, burst_length = 1;
    bool sounding = false, released = false, pending = false;
    float pending_frequency = 0.0f, pending_gain = 0.0f;

    bool choke = false;       // restruck or cancelled: mute in 60 ms
    float pick_gain = 1.0f, pick_click = 0.0f;
    // The driver's upper partials: one cycle against the string's phase, in
    // two copies so a redesign (a knob moved) can crossfade in.
    float table[2][kTable + 1];
    // The same partials weighted to move the string rather than hold it:
    // times the rate of change of the level, this is the extra drive that
    // makes them follow the envelope (and a redesign) instead of drifting
    // there at the string's own ring time.
    float lead[2][kTable + 1];
    float shaped[4] = {0.0f, 0.0f, 0.0f, 0.0f};  // ring time, brightness, position, pressure of the last shape()
    float tuned_vibrato = 1.0f, tuned_position = 0.0f;
    bool retune = false, gliding = false;
    int table_now = 0;
    float table_mix = 1.0f;
    float drawn[5] = {0.0f, 0.0f, 0.0f, 0.0f, 0.0f};  // what the current table was designed for
    float rosin_gain = 0.0f;

    bool active() const { return sounding; }
    bool releasing() const { return released; }
    float level() const { return follow; }
  };

  // Weight of sample k of a tick in the sum that closes a tick later.
  static constexpr float kTriangle[kChunk] = {0.5f / 16,  1.5f / 16,  2.5f / 16,  3.5f / 16, 4.5f / 16,  5.5f / 16,
                                              6.5f / 16,  7.5f / 16,  8.5f / 16,  9.5f / 16, 10.5f / 16, 11.5f / 16,
                                              12.5f / 16, 13.5f / 16, 14.5f / 16, 15.5f / 16};
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 5000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  // Damping: the ring time of a partial near kDampHz, from Brightness 0 to 1.
  static constexpr float kDampHz = 2500.0f;
  static constexpr float kDarkSeconds = 0.08f;
  static constexpr float kBrightSeconds = 30.0f;
  // Vibrato: full depth in cents; silent for the delay, then fading in.
  static constexpr float kVibratoCents = 40.0f;
  static constexpr float kVibratoDelay = 0.3f;
  static constexpr float kVibratoFade = 0.6f;
  // The driver: error gain (in string losses), its ceiling (times the
  // sensor's lag in periods), and how much of the error drive may reach the
  // sensor directly.
  static constexpr float kDrivenLoss = 0.002f;
  static constexpr float kDriveGain = 20.0f;
  static constexpr float kDriveLoop = 0.6f;
  static constexpr float kDriveDirect = 0.3f;
  static constexpr float kEbowTwelfth = 0.45f;
  static constexpr float kSeedLevel = 0.0004f;  // the pick that starts an ebowed or bowed string
  // The partials' envelope trails the fundamental by two lags of this many
  // periods.
  static constexpr float kPartialLag = 3.0f;
  // Levels: string amplitude at full velocity, before Volume.
  static constexpr float kPluckLevel = 0.8f;
  static constexpr float kEbowLevel = 0.3f;
  static constexpr float kBowLevel = 0.2f;
  // Body: five modes per channel, a little apart left and right (two
  // microphone positions over one soundboard), Q rising with frequency.
  static constexpr int kBodyModes = 5;
  static constexpr float kBodyHz[2][kBodyModes] = {{104.0f, 196.0f, 285.0f, 438.0f, 705.0f},
                                                  {110.0f, 207.0f, 271.0f, 466.0f, 655.0f}};
  static constexpr float kBodyQ[kBodyModes] = {5.0f, 6.0f, 7.0f, 8.0f, 8.0f};
  static constexpr float kBodyGain[kBodyModes] = {0.9f, 1.0f, 0.8f, 0.7f, 0.5f};
  static constexpr float kBodyMakeup = 1.0f;
  // Bow: the slip. Partials fall as h^-s, from a soft flautando to the
  // rosin-rich saw of a heavy bow, under a 12 dB/octave tilt Brightness sets.
  static constexpr float kBowSlopeLight = 1.9f;
  static constexpr float kBowSlopeHeavy = 0.85f;
  static constexpr float kBowTiltHz = 700.0f;
  static constexpr float kBowTiltSpan = 16.0f;
  static constexpr float kRosin = 1.2f;

  void start(Voice& voice, float frequency, float gain) {
    using namespace bowed_string;
    const float sr = sample_rate();
    for (String& string : voice.strings) string.clear();
    voice.mode = kit::clamp_int(static_cast<int>(param(kMode) + 0.5f), 0, 2);
    voice.frequency = frequency;
    voice.strength = 0.3f + 0.7f * gain;
    voice.sounding = true;
    voice.released = voice.choke = voice.pending = false;
    voice.steal = 1.0f;
    voice.bow_on = 1.0f;
    voice.age = 0.0f;
    voice.vib_phase = 0.0f;
    voice.vib_fade = 0.0f;
    voice.follow = 1.0f;
    voice.chunk_peak = 0.0f;
    voice.env.reset();
    set_envelope(voice);
    voice.env.gate_on();
    // The pick: brighter with Brightness and with a harder stroke.
    const float pick_hz = kit::clamp(
        400.0f * std::pow(30.0f, param(kBrightness)) * (0.4f + 0.9f * voice.strength), 200.0f, 0.4f * sr);
    for (kit::OnePole& pole : voice.pick) {
      pole.reset();
      pole.set_cutoff(pick_hz, sr);
    }
    voice.pick_gain = std::sqrt(2500.0f / pick_hz);
    voice.rosin.reset();
    voice.burst_length = static_cast<int>(kit::max(8.0f, sr / frequency));
    voice.burst_left = voice.burst_length;
    // As much energy in the impulse as in the noise, down to about 160 Hz.
    voice.pick_click = 0.35f * std::sqrt(kit::min(static_cast<float>(voice.burst_length), 0.00625f * sr));
    const float detune = param(kDetune);
    voice.strings[0].on = true;
    voice.strings[1].on = detune > 0.01f;
    voice.strings[0].ratio = voice.strings[1].on ? kit::cents_to_ratio(-0.5f * detune) : 1.0f;
    voice.strings[1].ratio = kit::cents_to_ratio(0.5f * detune);
    shape(voice);
    tune(voice, true);
    voice.table_now = 0;
    voice.table_mix = 1.0f;
    if (voice.mode != kPluck) draw(voice, 0);
  }

  void set_envelope(Voice& voice) {
    using namespace bowed_string;
    // A plucked string swells in (a volume pedal); at the shortest attack
    // the swell is off and the pick is heard as it is.
    const float attack = voice.mode == kPluck ? param(kAttack) - kParamMin[kAttack] : param(kAttack);
    voice.env.set(attack, 0.01f, 1.0f, 0.03f);
  }

  // Loss and phase delay of the bridge low-pass y = (1-p)x + p·y1 at `w`.
  static float damp_gain(float p, float w) {
    return (1.0f - p) / std::sqrt(kit::max(1.0e-12f, 1.0f - 2.0f * p * std::cos(w) + p * p));
  }
  static float damp_delay(float p, float w) {
    return std::atan2(p * std::sin(w), 1.0f - p * std::cos(w)) / w;
  }

  // Every 16 samples: age, vibrato, voice freeing, tuning.
  void control() {
    using namespace bowed_string;
    const float sr = sample_rate();
    const float dt = static_cast<float>(kChunk) / sr;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      voice.age += dt;
      voice.follow = kit::max(voice.chunk_peak, voice.follow * 0.995f);
      voice.chunk_peak = 0.0f;
      const bool free_ringing = voice.released || voice.mode == kPluck;
      if (free_ringing && !voice.pending && voice.follow < 1.0e-8f) {
        voice.sounding = false;
        continue;
      }
      voice.vib_phase += param(kVibratoRate) * dt;
      voice.vib_phase -= std::floor(voice.vib_phase);
      voice.vib_fade = kit::clamp((voice.age - kVibratoDelay) / kVibratoFade, 0.0f, 1.0f);
      set_envelope(voice);
      if (voice.shaped[0] != ring_time(voice) || voice.shaped[1] != param(kBrightness) ||
          voice.shaped[2] != param(kPosition) || voice.shaped[3] != param(kPressure)) {
        shape(voice);
        voice.retune = true;
      }
      tune(voice, false);
      if (voice.mode != kPluck) {
        for (String& string : voice.strings) {
          if (string.on) steer(voice, string);
        }
      }
    }
    // A knob moved under a held ebow or bow: redraw one voice's table per
    // tick (it costs about as much as a few samples) and crossfade to it.
    for (int tried = 0; tried < kMaxVoices; ++tried) {
      Voice& voice = pool_.voices[redraw_next_];
      redraw_next_ = (redraw_next_ + 1) % kMaxVoices;
      if (!voice.sounding || voice.released || voice.pending || voice.mode == kPluck) continue;
      if (voice.table_mix < 1.0f || !stale(voice)) continue;
      draw(voice, 1 - voice.table_now);
      voice.table_now = 1 - voice.table_now;
      voice.table_mix = 0.0f;
      break;
    }
  }

  float ring_time(const Voice& voice) const {
    using namespace bowed_string;
    if (voice.choke) return 0.06f;
    return voice.released ? kit::min(param(kDecay), param(kRelease)) : param(kDecay);
  }

  // Set a voice's loop from the parameters: damping, loop gain and what the
  // driver asks of each string. Runs at note-on and when one of them moves;
  // the transcendentals stay out of the per-tick path.
  void shape(Voice& voice) {
    using namespace bowed_string;
    const float sr = sample_rate();
    const float f0 = voice.frequency;
    const float ring = ring_time(voice);
    const float brightness = param(kBrightness);
    const float pressure = param(kPressure);
    voice.shaped[0] = ring;
    voice.shaped[1] = brightness;
    voice.shaped[2] = param(kPosition);
    voice.shaped[3] = pressure;

    // Bridge low-pass: solve its pole so a partial at the reference frequency
    // rings for the time Brightness sets, at any pitch.
    const float ref = kit::min(kit::max(kDampHz, 3.0f * f0), 0.45f * sr);
    const float bright_time = kDarkSeconds * std::pow(kBrightSeconds / kDarkSeconds, brightness);
    const float m = std::exp(-2.0f * kSixtyDb / (f0 * bright_time));
    float p = 0.0f;
    if (1.0f - m > 1.0e-6f) {
      const float c = std::cos(kit::kTwoPi * ref / sr);
      const float b = 1.0f - m * c;
      p = (b - std::sqrt(kit::max(0.0f, b * b - (1.0f - m) * (1.0f - m)))) / (1.0f - m);
    }
    p = kit::clamp(p, 0.0f, 0.98f);
    voice.damp_coeff = p;
    // Loop gain: the fundamental rings for `ring`, whatever the low-pass took.
    const float w0 = kit::kTwoPi * f0 / sr;
    const float fundamental = std::exp(-kSixtyDb / (f0 * ring));
    voice.loop_gain = kit::min(fundamental / damp_gain(p, w0), 0.9999f);
    // Under the ebow or bow the string is not left quite as free as it rings:
    // the upper partials are driven open loop, and a resonance sharper than
    // this would make their level hang on the last fraction of a cent.
    if (voice.mode != kPluck && !voice.released) voice.loop_gain = kit::min(voice.loop_gain, 1.0f - kDrivenLoss);

    for (String& string : voice.strings) {
      if (!string.on) continue;
      const float f = kit::min(f0 * string.ratio, 0.24f * sr);
      const float w = kit::kTwoPi * f / sr;
      // The low-pass's phase delay at the fundamental comes off the delay
      // lines. It moves by microseconds over a vibrato, so the note's own
      // value serves.
      string.damp_lag = damp_delay(p, w);
      if (voice.mode == kPluck) continue;
      // The fundamental is held at its level by a feedback loop; the upper
      // partials come from the voice's table, phase-locked to it.
      const float total = sr / f - string.damp_lag;
      const float share = kit::clamp(param(kPosition) * total, 2.0f, static_cast<float>(kBridgeSize - 8)) / total;
      const float node1 = std::sin(kit::kPi * share);
      const float reach = 1.0f / kit::max(4.0f * node1 * node1, 1.0e-3f);
      const float gain1 = voice.loop_gain * damp_gain(p, w);
      string.target = fundamental_level(voice, pressure) * 2.0f * node1;
      string.hold = (1.0f - gain1) * string.target * reach;
      // The error term is the only path where an upper partial meets its
      // full resonance on the way round (through ripple in the measured
      // amplitude), so its gain is tied to the string's own loss and the
      // error is smoothed over a period and a half. It also reaches the
      // sensor directly, a quarter turn off; cap that too (below).
      // The sensor's low-pass: a quarter of the fundamental, four poles, so
      // the octave is 49 dB down in it. What it costs is lag, and the error
      // gain per period has to stay well under one over that lag.
      const float tick_rate = sr / kChunk;
      const float corner = kit::min(0.25f * f, tick_rate / 12.0f);
      string.seen_coeff = std::exp(-kit::kTwoPi * corner / tick_rate);
      const float period = sr / f;
      const float lag = (kChunk + 4.0f * sr / (kit::kTwoPi * corner)) / period + 1.5f;
      const float error_gain = kit::min(kDriveGain * (1.0f - gain1), kDriveLoop / lag);
      string.reach = error_gain * kit::min(reach, kDriveDirect / (error_gain * 2.0f * node1));
      string.error_coeff = std::exp(-kChunk / (1.5f * period));
      string.partial_coeff = std::exp(-kChunk / (kPartialLag * period));
    }
    if (voice.mode == kBow) {
      // Rosin: noise let through as the string slips, more of it with
      // pressure. The string rings it up by about 1/sqrt(loss), so scale
      // that back out.
      const float loss = kit::max(1.0f - voice.loop_gain * damp_gain(p, w0), 1.0e-5f);
      voice.rosin_gain = kRosin * kBowLevel * voice.strength * (0.25f + 0.75f * pressure) * std::sqrt(loss);
    }
  }

  // Every tick: the two delay lengths per string (and the driver's sensor)
  // follow the vibrato and the position. A string that is where it should be
  // costs nothing.
  void tune(Voice& voice, bool snap) {
    using namespace bowed_string;
    const float sr = sample_rate();
    const float vibrato = kit::cents_to_ratio(param(kVibrato) * kVibratoCents * voice.vib_fade *
                                              kit::SineTable::lookup(voice.vib_phase));
    const float beta = param(kPosition);
    if (!snap && vibrato == voice.tuned_vibrato && beta == voice.tuned_position && !voice.retune) {
      if (voice.gliding) {
        for (String& string : voice.strings) string.bridge_step = string.nut_step = 0.0f;
        voice.gliding = false;
      }
      return;
    }
    voice.tuned_vibrato = vibrato;
    voice.tuned_position = beta;
    voice.retune = false;
    voice.gliding = !snap;
    for (String& string : voice.strings) {
      if (!string.on) continue;
      const float f = kit::min(voice.frequency * string.ratio * vibrato, 0.24f * sr);
      const float total = sr / f - string.damp_lag;
      const float bridge = kit::clamp(beta * total, 2.0f, static_cast<float>(kBridgeSize - 8));
      const float nut = kit::clamp(total - bridge, 2.0f, static_cast<float>(kNutSize - 8));
      if (snap) {
        string.bridge_delay = bridge;
        string.nut_delay = nut;
        string.bridge_step = string.nut_step = 0.0f;
      } else {
        string.bridge_step = (bridge - string.bridge_delay) * (1.0f / kChunk);
        string.nut_step = (nut - string.nut_delay) * (1.0f / kChunk);
      }
      string.ref_step = f / sr;
      string.spin_re = kit::SineTable::cos_lookup(string.ref_step);
      string.spin_im = kit::SineTable::lookup(string.ref_step);
    }
  }

  // Every tick, for a driven string: read the sensor, and set the drive for
  // the next 16 samples (as ramps, so nothing steps).
  void steer(Voice& voice, String& string) {
    const float inv = 1.0f / kChunk;
    // The triangle that just closed, through the four poles.
    float re = string.sum[0] * inv, im = string.sum[1] * inv;
    string.sum[0] = string.sum[2];
    string.sum[1] = string.sum[3];
    string.sum[2] = string.sum[3] = 0.0f;
    for (auto& pole : string.seen) {
      pole[0] = flush_denormal(re + (pole[0] - re) * string.seen_coeff);
      pole[1] = flush_denormal(im + (pole[1] - im) * string.seen_coeff);
      re = pole[0];
      im = pole[1];
    }
    const float half = std::sqrt(re * re + im * im);
    const float amplitude = 2.0f * half;
    // Where the string is against the phasor.
    if (half > 1.0e-9f) {
      const float lock_re = re / half, lock_im = im / half;
      string.lock_re_step = (lock_re - string.lock_re) * inv;
      string.lock_im_step = (lock_im - string.lock_im) * inv;
      float move = angle_cycles(im, re) - string.offset;
      move -= std::floor(move + 0.5f);
      string.offset -= std::floor(string.offset);
      string.offset_step = move * inv;
    } else {
      string.lock_re_step = string.lock_im_step = string.offset_step = 0.0f;
    }
    const float env = voice.env.level();
    const float error = string.target * env - amplitude;
    string.error = flush_denormal(error + (string.error - error) * string.error_coeff);
    const float push = kit::clamp(string.hold * env + string.reach * string.error, -0.5f, 0.5f);
    string.push_step = (push - string.push) * inv;
    // The upper partials follow the fundamental the string actually has
    // (the phase is only worth reading once it is there), through two lags
    // in series so their envelope leaves zero with no slope.
    const float reached = kit::min(env, amplitude / kit::max(string.target, 1.0e-9f));
    string.partial_lag = flush_denormal(reached + (string.partial_lag - reached) * string.partial_coeff);
    const float partial = string.partial_lag + (string.partial - string.partial_lag) * string.partial_coeff;
    string.partial_step = (partial - string.partial) * inv;
    // Keep the phasor on the phase it is meant to have.
    string.turn_re = kit::SineTable::cos_lookup(string.ref_phase);
    string.turn_im = kit::SineTable::lookup(string.ref_phase);
  }

  // Ebow: Pressure moves the level from the fundamental to the octave.
  static float octave_share(float pressure) { return 0.85f * pressure * pressure; }

  float fundamental_level(const Voice& voice, float pressure) const {
    if (voice.mode == kEbow) return kEbowLevel * voice.strength * (1.0f - octave_share(pressure));
    return kBowLevel * voice.strength;
  }

  // Draw one cycle of the driver's upper partials into `table`. Each partial
  // is given the level the mode asks for at the bridge, divided by what the
  // string will do to it on the way (its resonance, and the node pattern of
  // the playing point), and the phase that lines the partials up as a ramp
  // at the bridge, the shape a bowed string makes.
  void draw(Voice& voice, int which) {
    float* table = voice.table[which];
    float* lead = voice.lead[which];
    using namespace bowed_string;
    const float sr = sample_rate();
    const float w = kit::kTwoPi * voice.frequency / sr;
    const float p = voice.damp_coeff;
    const float pressure = param(kPressure);
    const float brightness = param(kBrightness);
    const float total = kit::kTwoPi / w - damp_delay(p, w);
    const float bridge = kit::clamp(param(kPosition) * total, 2.0f, static_cast<float>(kBridgeSize - 8));
    const float nut = total - bridge;
    const int harmonics = kit::clamp_int(static_cast<int>(0.42f * kit::kTwoPi / w), 1, kMaxHarmonics);
    const float level = (voice.mode == kEbow ? kEbowLevel : kBowLevel) * voice.strength;
    const float octave = octave_share(pressure);
    const float slope = kBowSlopeLight + (kBowSlopeHeavy - kBowSlopeLight) * pressure;
    const float tilt_hz = kBowTiltHz * std::pow(kBowTiltSpan, brightness);

    for (int i = 0; i < kTable; ++i) fft_re_[i] = fft_im_[i] = lead_re_[i] = lead_im_[i] = 0.0f;
    const float period = kit::kTwoPi / w;
    float turn1 = 0.0f;  // phase of the fundamental at the bridge against the junction
    for (int h = 1; h <= harmonics; ++h) {
      const float harmonic = static_cast<float>(h);
      const float wh = harmonic * w;
      float asked = 0.0f;
      if (voice.mode == kEbow) {
        if (h == 2) asked = level * octave;
        if (h == 3) asked = level * (1.0f - octave) * (0.05f + kEbowTwelfth * brightness);
        if (h > 3) break;
      } else {
        const float over = harmonic * voice.frequency / tilt_hz;
        asked = level * std::pow(harmonic, -slope) / std::sqrt(1.0f + over * over * over * over);
      }
      // The loop at this partial, exactly as the samples see it: both delay
      // reads with their interpolation (which loses a little and runs a
      // little late up high) and the bridge low-pass.
      const Complex to_bridge = read_response(wh, bridge);
      const Complex to_nut = read_response(wh, nut);
      const float lag = std::atan2(p * std::sin(wh), 1.0f - p * std::cos(wh));
      const float gain = voice.loop_gain * damp_gain(p, wh);
      const Complex from_bridge =
          times(to_bridge, {-gain * std::cos(lag), gain * std::sin(lag)});  // Hb
      const Complex round = times(from_bridge, {-to_nut.re, -to_nut.im});   // Hn·Hb
      const Complex num = {1.0f - to_nut.re, -to_nut.im};                     // 1 + Hn
      const Complex den = {1.0f - round.re, -round.im};
      // junction -> bridge: (1 + Hn) / (1 - Hn·Hb) · (the bridge read)
      const float reach_turn = std::atan2(num.im, num.re) + std::atan2(to_bridge.im, to_bridge.re);
      const float turn = reach_turn - std::atan2(den.im, den.re);
      if (h == 1) {
        turn1 = turn;
        continue;  // the feedback loop's job
      }
      if (asked <= 0.0f) continue;
      const float reach = kit::max(
          std::sqrt((num.re * num.re + num.im * num.im) * (to_bridge.re * to_bridge.re + to_bridge.im * to_bridge.im)),
          0.4f);
      const float drive = asked * std::sqrt(den.re * den.re + den.im * den.im) / reach;
      const float ramp = harmonic * turn1 + (harmonic - 1.0f) * kit::kHalfPi;
      const float cycles = (ramp - turn) * (1.0f / kit::kTwoPi);
      fft_re_[h] = fft_re_[kTable - h] = 0.5f * drive * kit::SineTable::cos_lookup(cycles);
      fft_im_[h] = 0.5f * drive * kit::SineTable::lookup(cycles);
      fft_im_[kTable - h] = -fft_im_[h];
      // Per period the string adds `reach` times the drive to the partial,
      // so a level changing by 1 per sample needs period / reach.
      const float push = asked * period / reach;
      const float push_cycles = (ramp - reach_turn) * (1.0f / kit::kTwoPi);
      lead_re_[h] = lead_re_[kTable - h] = 0.5f * push * kit::SineTable::cos_lookup(push_cycles);
      lead_im_[h] = 0.5f * push * kit::SineTable::lookup(push_cycles);
      lead_im_[kTable - h] = -lead_im_[h];
    }
    fft_.inverse(fft_re_, fft_im_);
    fft_.inverse(lead_re_, lead_im_);
    for (int i = 0; i < kTable; ++i) {
      table[i] = fft_re_[i];
      lead[i] = lead_re_[i];
    }
    table[kTable] = table[0];
    lead[kTable] = lead[0];
    voice.drawn[0] = pressure;
    voice.drawn[1] = brightness;
    voice.drawn[2] = param(kPosition);
    voice.drawn[3] = voice.loop_gain;
    voice.drawn[4] = voice.damp_coeff;
  }

  struct Complex {
    float re, im;
  };
  static Complex times(Complex a, Complex b) { return {a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re}; }

  // What DelayLine::read_hermite(delay) does to a component at `w` radians
  // per sample: the four taps' weights, each at its own delay.
  static Complex read_response(float w, float delay) {
    const int whole = static_cast<int>(delay);
    const float t = delay - static_cast<float>(whole);
    const float t2 = t * t, t3 = t2 * t;
    const float taps[4] = {-0.5f * t + t2 - 0.5f * t3, 1.0f - 2.5f * t2 + 1.5f * t3,
                           0.5f * t + 2.0f * t2 - 1.5f * t3, -0.5f * t2 + 0.5f * t3};
    Complex sum = {0.0f, 0.0f};
    for (int k = 0; k < 4; ++k) {
      const float angle = w * static_cast<float>(whole - 1 + k);
      sum.re += taps[k] * std::cos(angle);
      sum.im -= taps[k] * std::sin(angle);
    }
    return sum;
  }

  bool stale(const Voice& voice) const {
    using namespace bowed_string;
    return voice.drawn[0] != param(kPressure) || voice.drawn[1] != param(kBrightness) ||
           voice.drawn[2] != param(kPosition) || voice.drawn[3] != voice.loop_gain ||
           voice.drawn[4] != voice.damp_coeff;
  }

  static float read(const float* table, int index, float fraction) {
    return table[index] + (table[index + 1] - table[index]) * fraction;
  }

  // atan2(y, x) in cycles, [0, 1): odd polynomial on the octant, error
  // under 2e-6 cycles.
  static float angle_cycles(float y, float x) {
    const float ax = x < 0.0f ? -x : x, ay = y < 0.0f ? -y : y;
    const float hi = ax > ay ? ax : ay, lo = ax > ay ? ay : ax;
    const float a = lo / (hi + 1.0e-20f);
    const float a2 = a * a;
    float r = a * (0.99997726f +
                   a2 * (-0.33262347f + a2 * (0.19354346f + a2 * (-0.11643287f + a2 * (0.05265332f + a2 * -0.01172120f)))));
    if (ay > ax) r = kit::kHalfPi - r;
    if (x < 0.0f) r = kit::kPi - r;
    if (y < 0.0f) r = kit::kTwoPi - r;
    return r * (1.0f / kit::kTwoPi);
  }

  void render_voice(Voice& voice, int first, int n, float* left, float* right) {
    using namespace bowed_string;
    // Per-sample signals the two strings share.
    float env[kChunk], excite[kChunk], hiss[kChunk], touch[kChunk], fade[kChunk], mix[kChunk];
    const bool bowed = voice.mode == kBow;
    const bool driven = voice.mode != kPluck;
    for (int i = 0; i < n; ++i) {
      voice.table_mix = kit::min(1.0f, voice.table_mix + mix_step_);
      mix[i] = voice.table_mix;
      env[i] = voice.env.next();
      if (voice.released) voice.bow_on *= lift_coeff_;
      touch[i] = voice.bow_on;
      if (voice.pending) voice.steal = kit::max(0.0f, voice.steal - steal_step_);
      fade[i] = voice.steal;
      float x = 0.0f;
      hiss[i] = bowed ? voice.rosin.lowpass(voice.rng.bipolar()) * voice.rosin_gain * env[i] : 0.0f;
      if (voice.burst_left > 0) {
        // The pick: an impulse (the ideal pluck) plus one period of noise
        // under a Hann window, both through the pick filter. The noise makes
        // each stroke a little different; the impulse keeps none of them thin.
        const float t = 1.0f - static_cast<float>(voice.burst_left) / static_cast<float>(voice.burst_length);
        const float window = 0.5f - 0.5f * kit::SineTable::cos_lookup(t);
        const float click = voice.burst_left == voice.burst_length ? voice.pick_click : 0.0f;
        x = voice.pick[1].lowpass(voice.pick[0].lowpass(voice.rng.bipolar() * window + click)) * voice.pick_gain;
        x *= voice.strength * (driven ? kSeedLevel : kPluckLevel);
        --voice.burst_left;
      }
      excite[i] = x;
    }

    const float gain = voice.loop_gain;
    const float coeff = voice.damp_coeff;
    const float* table_new = voice.table[voice.table_now];
    const float* table_old = voice.table[1 - voice.table_now];
    const float* lead_new = voice.lead[voice.table_now];
    const float* lead_old = voice.lead[1 - voice.table_now];
    const bool both = voice.strings[1].on;
    float peak = voice.chunk_peak;
    for (int s = 0; s < 2; ++s) {
      String& string = voice.strings[s];
      if (!string.on) continue;
      // Two strings sit a little left and right of centre.
      const float pan = both ? (s == 0 ? -0.4f : 0.4f) : 0.0f;
      const float level = both ? 0.62f : 1.0f;
      const float to_left = level * (1.0f - pan), to_right = level * (1.0f + pan);
      for (int i = 0; i < n; ++i) {
        const float wave = string.bridge.read_hermite(string.bridge_delay);
        const float nut_wave = string.nut.read_hermite(string.nut_delay);
        string.bridge_delay += string.bridge_step;
        string.nut_delay += string.nut_step;
        string.damp = flush_denormal(wave + (string.damp - wave) * coeff);
        const float from_bridge = -gain * string.damp;
        const float from_nut = -nut_wave;
        const float velocity = from_bridge + from_nut;  // the string at the junction
        float x = excite[i];
        if (driven) {
          // The pickup sees the string where it is driven: the arriving
          // waves plus the drive itself. (The arriving waves alone can run
          // against the drive off resonance, and the loop would sing there.)
          const float seen = velocity + string.last_drive;
          const float re = seen * string.turn_re, im = -seen * string.turn_im;
          const float late = kTriangle[first + i];
          string.sum[0] += re - re * late;
          string.sum[1] += im - im * late;
          string.sum[2] += re * late;
          string.sum[3] += im * late;
          // cos of the string's phase, and the tables read at it: what holds
          // the upper partials, plus what moves them while their level moves.
          const float u = string.turn_re * string.lock_re - string.turn_im * string.lock_im;
          float cycles = string.ref_phase + string.offset + 1.0f;
          cycles -= static_cast<float>(static_cast<int>(cycles));
          const float position = cycles * static_cast<float>(kTable);
          const int index = static_cast<int>(position) & (kTable - 1);
          const float fraction = position - static_cast<float>(static_cast<int>(position));
          float partials = string.partial * read(table_new, index, fraction) +
                           string.partial_step * read(lead_new, index, fraction);
          if (mix[i] < 1.0f) {
            const float moving = read(lead_new, index, fraction) - read(lead_old, index, fraction);
            const float old = string.partial * read(table_old, index, fraction) +
                              string.partial_step * read(lead_old, index, fraction);
            partials = old + (partials - old) * mix[i] + string.partial * mix_step_ * moving;
          }
          float drive = string.push * u + partials;
          // Rosin hisses while the string slips, a quarter of each cycle.
          if (bowed) drive += hiss[i] * kit::max(0.0f, u) * kit::max(0.0f, u);
          string.last_drive = touch[i] * drive;
          x += string.last_drive;
          // One sample on.
          string.ref_phase += string.ref_step;
          if (string.ref_phase >= 1.0f) string.ref_phase -= 1.0f;
          const float turned = string.turn_re * string.spin_re - string.turn_im * string.spin_im;
          string.turn_im = string.turn_re * string.spin_im + string.turn_im * string.spin_re;
          string.turn_re = turned;
          string.lock_re += string.lock_re_step;
          string.lock_im += string.lock_im_step;
          string.offset += string.offset_step;
          string.push += string.push_step;
          string.partial += string.partial_step;
        }
        string.nut.write(flush_denormal(from_bridge + x));
        string.bridge.write(flush_denormal(from_nut + x));
        const float magnitude = wave < 0.0f ? -wave : wave;
        if (magnitude > peak) peak = magnitude;
        const float out = wave * fade[i] * (driven ? 1.0f : env[i]);
        left[i] += out * to_left;
        right[i] += out * to_right;
      }
    }
    voice.chunk_peak = peak;
    if (voice.pending && voice.steal <= 0.0f) start(voice, voice.pending_frequency, voice.pending_gain);
  }

  void finish_chunk(const float* left, const float* right, int n, int offset) {
    for (int i = 0; i < n; ++i) {
      const float body = body_amount_.next();
      const float volume = volume_.next();
      const float in[2] = {rumble_[0].highpass(left[i]), rumble_[1].highpass(right[i])};
      float out[2];
      for (int c = 0; c < 2; ++c) {
        float modes = 0.0f;
        for (int m = 0; m < kBodyModes; ++m) modes += kBodyGain[m] * body_[c][m].bandpass(in[c]);
        out[c] = in[c] * (1.0f - 0.5f * body) + modes * body * kBodyMakeup;
      }
      out_left_[offset + i] = kit::soft_clip(out[0] * volume);
      out_right_[offset + i] = kit::soft_clip(out[1] * volume);
    }
  }

  void apply(int id) {
    using namespace bowed_string;
    const float value = param(id);
    switch (id) {
      case kBody:
        body_amount_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock or at note-on
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf body_[2][kBodyModes];
  kit::OnePole rumble_[2];
  kit::Smoother body_amount_, volume_;
  kit::IdleGate idle_;
  kit::Fft<kTable> fft_;
  float fft_re_[kTable], fft_im_[kTable], lead_re_[kTable], lead_im_[kTable];
  int redraw_next_ = 0;
  float mix_step_ = 0.001f;
  int chunk_left_ = 0;
  float lift_coeff_ = 0.99f;
  float steal_step_ = 0.01f;
};

}  // namespace livemix
