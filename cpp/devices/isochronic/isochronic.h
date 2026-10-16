#pragma once

// Isochronic: a tone, or a band of noise, switched on and off evenly.
//
//   per key:  carrier ─► sine + two partials ─┐
//             noise ─► band at the key ───────┴─ Air ─► envelope ─┐
//   (up to eight keys)                                             │
//                                      sum over 1 / √(Σ level²) ◄──┘
//                                        │
//   one clock ─► pulse shape ─► gate ────┼─► × left gate ──► volume ─► clip ─► left
//                  └─ Offset later ─► gate ─► × right gate ─► volume ─► clip ─► right
//
// - One pulse for the whole device (kit/beat.h): a clock in double, the pulse
//   shape read from its phase, one gate an ear. Every key is switched by the
//   same gate, so all keys pulse together to the sample. The right ear reads
//   the same clock Offset later; at Offset 0 the two ears are the same to the
//   sample, and the sound is mono.
// - A key that arrives with no voice sounding starts everything again at that
//   sample: the clock at 0 with both ears shut, the noise streams, and every
//   smoothed control at its target. The left ear's first pulse begins at
//   once and the right ear's begins Offset later. A later key joins the pulse
//   that is running. Nothing is decided when the device wakes, because the
//   block it fell asleep in depends on the host's block size.
// - Each ear takes up a new Duty or Edge only while its gate is shut and the
//   new shape is shut at that place too: a pulse under way finishes as it
//   began, so a change waits at most one period. Depth and Offset move over
//   10 ms. Rate is followed at once; the gate's own slew holds the step.
// - Rate glides to Target by the kit's closed form. The glide is armed by any
//   change of Rate, Target or Glide, starts at the first key after that (at
//   once with a key held) and counts on through releases, new keys and
//   sleep. Only the clock restarts on a key from silence, never the glide.
// - A voice is a carrier phase in double, an envelope, and two band-pass
//   sections on its own noise stream. Its level and whether it is alive come
//   from the envelope, never from the output: in the pulse's gap every voice
//   puts out exact zero and none of them is the quietest.
// - The sum of the voices is divided by the root of the sum of their
//   envelopes squared (once that is over 1): one key at gain 0.7 peaks near
//   -18 dBFS at the default Volume and eight at full gain, all in step, reach
//   the edge of the clip's knee and no further. A preset's Volume and Air
//   part way are outside that, and presets do pass the knee (WEAK.md).
// - Keys under 80 Hz sound an octave or more up; every other key where it is.
// - A key on a pitch that another voice is sounding (a key folded up onto
//   it, the same key under another id, or the same key struck again) takes
//   that voice's carrier, so the two add in step whenever the second is
//   struck: two keys are 3.01 dB over one. Started from its own zero
//   crossing, the second cancelled the first when it came half a cycle late
//   (55 dB under one key) and doubled it when it came a whole cycle late.
//   Such a key begins part way through a cycle, so the corner at the start
//   of its attack is not hidden in a zero crossing: at the quickest Attack
//   it puts 40 dB under the tone above 1.5 kHz, with no step in the sound.
//   A key struck again does not dip while its old voice fades.
//
// The noise is the same in both ears (the ears differ only by the pulse). Its
// RMS is half the tone's peak, 3 dB under the tone's RMS, on any key and at
// any sample rate. Its peaks are another matter: one key's noise peaks 6 to
// 8 dB over its tone, and eight keys of noise alone at full gain stay under
// the knee (0.47 in ten minutes). With Air part way the tone has used the
// room already: eight keys of a chord at full gain pass the knee on a few
// samples in ten minutes (0.53), and eight on one pitch on 2 % of them
// (0.62). The clip holds those; the scale is not lowered for them.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "../../kit/colour.h"
#include "params.gen.h"

namespace livemix {

class Isochronic : public kit::DeviceBase<isochronic::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  // Keys under this sound an octave or more up.
  static constexpr float kFoldHz = 80.0f;
  // The second and third partials against the first at Warmth 1.
  static constexpr float kSecondPartial = 0.5f;
  static constexpr float kThirdPartial = 0.25f;
  // Each of the two band-pass sections on the noise. Together they are 3 dB
  // down about three semitones either side of the key and 20 dB down an
  // octave away.
  static constexpr float kBandQ = 2.0f;
  // The power the two sections leave of white noise is summed over this many
  // steps of ln(frequency), from e^-3 to e^3 of the key (band_power).
  static constexpr int kBandSteps = 120;
  // The RMS of a key's noise against the peak of its tone.
  static constexpr float kNoiseRms = 0.5f;
  // One key at full gain at 0 dB of Volume. Eight in step add to √8 of one
  // after the scaling: at the default Volume of -6 dB that is 0.4997.
  static constexpr float kVoiceAmp = 0.3525f;

  void init(float sample_rate) {
    using namespace isochronic;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    kit::SineTable::init();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
    }
    pulse_.reset();
    right_waits_ = false;
    glide_.reset(sr);
    strikes_ = 0;
    steal_step_ = 1.0f / (kStealSeconds * sr);
    restrike_step_ = 1.0f / (kRestrikeSeconds * sr);
    warmth_.set_time(kSmoothingSeconds, sr);
    air_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    gap_.set_time(kShapeSeconds, sr);
    offset_.set_time(kShapeSeconds, sr);
    build_peak_table();
    // Nothing outlives the envelopes.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    for (Ear& ear : ear_) ear.begin(duty_, edge_);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, kit::min(12000.0f, 0.45f * sample_rate()));
    while (frequency < kFoldHz) frequency *= 2.0f;
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    glide_.key();
    if (pool_.count_active() == 0) restart();

    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.waiting) {
        // Struck again before it could start: the waiting note is this one.
        // Letting the voice go would have the pool take a second voice for
        // the same key.
        again.next_hz = frequency;
        again.next_gain = gain;
        return;
      }
      // A key struck again while held: the old voice fades out quickly.
      fade_out(again, restrike_step_);
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.next_hz = frequency;
    voice.next_gain = gain;
    if (stolen) {
      // The old note fades out first; the new one waits in the voice.
      voice.waiting = true;
      fade_out(voice, steal_step_);
    } else {
      start(voice, false);
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
    }
  }

  // The reading named by "meters" in device.json: how far through its glide
  // the rate is, 0 while it waits for a key, 1 once it holds at the Target.
  // It counts on while the device sleeps.
  float meter(int index) const { return index == 0 ? glide_.place() : 0.0f; }

  void process(int frames);

 private:
  struct Voice {
    kit::Adsr env;
    kit::Svf band[2];
    kit::StreamRng noise;
    double carrier = 0.0;  // phase in cycles
    double step = 0.0;     // cycles a sample
    float gain = 0.0f;     // from the key's strength
    // How much of each partial the key may have: 1, falling to 0 as the
    // partial nears half the sample rate.
    float second = 1.0f;
    float third = 1.0f;
    bool whole = true;  // both partials in full: the peak table holds
    float noise_gain = 0.0f;
    // A fade out for a voice that is being taken or was struck again: the
    // place in it from 0 to 1, and its step a sample (0 when there is none).
    float fade = 0.0f;
    float fade_step = 0.0f;
    // A taken voice waits for its fade before it plays the next note.
    bool waiting = false;
    float next_hz = 220.0f;
    float next_gain = 0.0f;

    bool active() const { return env.active() || waiting; }
    // A waiting voice is as good as held: it is not taken twice.
    bool releasing() const { return (env.releasing() || fade_step > 0.0f) && !waiting; }
    // From the envelope and the key's strength, never from the output, and
    // true from the moment the voice is taken: a voice still in its attack
    // counts as arrived.
    float level() const {
      if (waiting) return 2.0f;
      const float envelope = env.stage() == kit::Adsr::kAttack ? 1.0f : env.level();
      return envelope * gain * (1.0f - fade);
    }
  };

  // The level in the gap and the Offset are smoothed more slowly than a
  // plain level is: a change that begins just before a gap ends is cut short
  // by the next pulse, and at 5 ms the little that got through arrives in a
  // hurry (Depth thrown from 0 to 1 put 0.17 of its whole effect into its
  // first 8 samples at 44.1 kHz).
  static constexpr float kShapeSeconds = 0.01f;
  static constexpr float kStealSeconds = 0.004f;
  static constexpr float kRestrikeSeconds = 0.02f;
  static constexpr int kPeakPoints = 17;
  // Two keys are on one pitch when they are this close, as a part of the
  // pitch: a sixtieth of a cent. Wider apart they beat, as two keys do.
  static constexpr double kSamePitch = 1.0e-5;
  static constexpr uint64_t kNoiseSeed = 0x150C4001ull;

  static void fade_out(Voice& voice, float step) {
    if (step > voice.fade_step) voice.fade_step = step;
  }

  void set_envelope(Voice& voice) const {
    voice.env.set(param(isochronic::kAttack), 0.1f, 1.0f, param(isochronic::kRelease));
  }

  // One ear's pulse: its gate, and the Duty and the Edge (in seconds) its
  // pulse was begun with. A pulse under way finishes as it began. An ear
  // takes up a new Duty or Edge only while it is shut and would be shut with
  // the new settings too, which is in the gap before its next pulse at the
  // latest, so neither control ever moves the gate by itself. (Smoothed
  // instead, an Edge thrown from 2 to 50 ms half way up a rise held the rise
  // back at once: 0.28 of the change was there in 8 samples.)
  struct Ear {
    kit::PulseGate gate;
    float duty = 0.5f;
    float edge = 0.008f;

    void begin(float new_duty, float new_edge) {
      gate.reset();
      duty = new_duty;
      edge = new_edge;
    }

    float next(double phase, float hz, double step, float new_duty, float new_edge) {
      if (gate.open <= 0.0f && (duty != new_duty || edge != new_edge) &&
          kit::pulse_open(phase, kit::pulse_shape(hz, new_duty, new_edge)) <= 0.0f) {
        duty = new_duty;
        edge = new_edge;
      }
      return gate.next(phase, kit::pulse_shape(hz, duty, edge), step);
    }

    // How far open the pulse itself is at `phase`, whatever the gate is doing.
    float asked(double phase, float hz) const { return kit::pulse_open(phase, kit::pulse_shape(hz, duty, edge)); }
  };

  void start(Voice& voice, bool in_sample);
  void restart();
  static float band_power(float g, float k);
  void build_peak_table();
  float wave_peak(float warmth) const;
  void apply(int id);

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::SlowClock pulse_;
  Ear ear_[2];
  kit::RateGlide glide_;
  // Duty and Edge (in seconds) as the controls stand; each ear takes them up
  // at its own moment.
  float duty_ = 0.5f;
  float edge_ = 0.008f;
  // Per sample. Offset is in turns, and `gap_` is the level between pulses
  // that Depth asks for.
  kit::Smoother gap_, offset_, warmth_, air_, volume_;
  kit::IdleGate idle_;
  float peak_table_[kPeakPoints] = {};
  uint64_t strikes_ = 0;       // keys started since the last restart: each takes its own noise stream
  bool right_waits_ = false;   // the right ear is shut until its first pulse
  float steal_step_ = 0.0f;
  float restrike_step_ = 0.0f;
};

inline void Isochronic::process(int frames) {
  frames = begin_block(frames);
  if (!idle_.wake(pool_.count_active() > 0)) {
    silence_output(frames);
    // The glide counts on: this is that many steps, to the bit.
    glide_.advance(frames);
    return;
  }
  clear_input(frames);  // an instrument ignores its input
  const double sr = sample_rate();
  for (int i = 0; i < frames; ++i) {
    // The pulse: one clock, one gate an ear, the right ear Offset later.
    const double rate = glide_.step();
    const double step = kit::SlowClock::increment(rate, sr);
    const float hz = static_cast<float>(rate);
    const double right_phase = kit::wrap_phase(pulse_.phase - static_cast<double>(offset_.next()));
    const float open_left = ear_[0].next(pulse_.phase, hz, step, duty_, edge_);
    float open_right = ear_[1].next(right_phase, hz, step, duty_, edge_);
    if (right_waits_) {
      // Since the restart the right ear has not come to its first gap: it
      // stays shut through what would be the end of a pulse that never began.
      if (ear_[1].asked(right_phase, hz) > 0.0f) {
        ear_[1].gate.reset();
        open_right = 0.0f;
      } else {
        right_waits_ = false;
      }
    }
    pulse_.step(step);
    const float floor = gap_.next();

    // Tone and noise cross with their powers added: they have nothing in
    // common. The ends are exact.
    const float warmth = warmth_.next();
    const float air = air_.next();
    const float tone_mix = air < 1.0f ? kit::SineTable::cos_lookup(0.25f * air) : 0.0f;
    const float noise_mix = air > 0.0f ? kit::SineTable::lookup(0.25f * air) : 0.0f;
    const float second = warmth * kSecondPartial;
    const float third = warmth * kThirdPartial;
    const float whole_scale = warmth > 0.0f ? 1.0f / wave_peak(warmth) : 1.0f;

    float mono = 0.0f;
    float power = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) {
        if (!voice.waiting) continue;
        start(voice, true);
      }
      float level = voice.env.next();
      if (voice.fade_step > 0.0f) {
        voice.fade += voice.fade_step;
        if (voice.fade >= 1.0f) {
          // Faded out. A note that waits here starts with the next sample.
          voice.env.reset();
          voice.fade = 0.0f;
          voice.fade_step = 0.0f;
          continue;
        }
        level *= 0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * voice.fade);
      }
      power += level * level;

      float sound = 0.0f;
      if (tone_mix > 0.0f) {
        const kit::SinCos turn = kit::sin_cos(voice.carrier);
        float wave = turn.s;
        if (warmth > 0.0f) {
          const float more_second = second * voice.second;
          const float more_third = third * voice.third;
          wave += more_second * kit::second_partial(turn).s + more_third * kit::third_partial(turn).s;
          // Scaled so the wave's peak is the sine's. With a partial left
          // out near half the sample rate the table no longer holds and the
          // sum of the three stands in for the peak.
          wave *= voice.whole ? whole_scale : 1.0f / (1.0f + more_second + more_third);
        }
        sound = tone_mix * wave;
      }
      voice.carrier = kit::wrap_phase(voice.carrier + voice.step);
      if (noise_mix > 0.0f) {
        const float band = voice.band[1].bandpass(voice.band[0].bandpass(voice.noise.bipolar()));
        sound += noise_mix * voice.noise_gain * band;
      }
      mono += sound * level * voice.gain;
    }

    // One key keeps its level; more are divided by the root of the sum of
    // their envelopes squared, which moves as smoothly as the envelopes do.
    float scale = volume_.next() * kVoiceAmp;
    if (power > 1.0f) scale /= std::sqrt(power);
    mono *= scale;
    out_left_[i] = kit::soft_clip(mono * kit::pulse_gain(open_left, floor));
    out_right_[i] = kit::soft_clip(mono * kit::pulse_gain(open_right, floor));
  }
  idle_.settle(output_peak(frames), frames);
}

// Start a note in a voice that is silent. `in_sample` when the sample loop
// calls it, part way through its pass over the voices.
inline void Isochronic::start(Voice& voice, bool in_sample) {
  const float sr = sample_rate();
  const float hz = voice.next_hz;
  voice.waiting = false;
  voice.step = static_cast<double>(hz) / static_cast<double>(sr);
  voice.carrier = 0.0;  // a sine from its zero crossing
  // Unless another voice is sounding this pitch: then its carrier is taken,
  // step and place, and the two stay in step for as long as both sound. All
  // the voices on a pitch are in step already, so the first found will do.
  for (Voice& other : pool_.voices) {
    if (&other == &voice || !other.env.active()) continue;
    const double apart = other.step - voice.step;
    if (apart > kSamePitch * voice.step || -apart > kSamePitch * voice.step) continue;
    voice.step = other.step;
    // In the sample loop the voices before this one have moved on already.
    voice.carrier = in_sample && &other < &voice ? kit::wrap_phase(other.carrier - other.step) : other.carrier;
    break;
  }
  voice.gain = 0.1f + 0.9f * voice.next_gain;
  voice.second = kit::clamp((0.45f * sr - 2.0f * hz) / (0.05f * sr), 0.0f, 1.0f);
  voice.third = kit::clamp((0.45f * sr - 3.0f * hz) / (0.05f * sr), 0.0f, 1.0f);
  voice.whole = voice.second >= 1.0f && voice.third >= 1.0f;
  for (kit::Svf& section : voice.band) {
    section.reset();
    section.set(hz, kBandQ, sr);
  }
  // One random value a sample has a power of a third, spread over half the
  // sample rate; what the two sections leave of it is worked out for this
  // key at this rate, so the noise is as loud at any rate and on any key.
  voice.noise_gain = kNoiseRms / std::sqrt(band_power(voice.band[0].g, voice.band[0].k) / 3.0f);
  voice.noise.seed(kNoiseSeed + strikes_++);
  voice.fade = 0.0f;
  voice.fade_step = 0.0f;
  set_envelope(voice);
  voice.env.reset();
  voice.env.gate_on();
}

// The share of white noise's power that two band-pass sections in a row let
// through: the mean of the fourth power of one section's response over half
// the sample rate. The sections are the analogue band-pass at the warped
// frequency u = tan(ω/2) (kit::Svf is the trapezoidal form), so with
// x = u / g, the frequency in units of the centre,
//
//   power = (2g/π) · ∫ F(x)² / (1 + g²x²) dx     F(x) = (kx)² / ((1 - x²)² + (kx)²)
//
// summed in ln x, where the band is a quarter wide and the same shape on any
// key. On a low key g is small, the divisor is 1 and this is g·k/2, which is
// π·hz / (2·Q·rate); near half the sample rate the divisor takes the band's
// upper side away: 2.4 dB of it on a 12 kHz key at 44.1 kHz. Called once
// when a note starts, which for a note that waited for its voice is inside
// the sample loop: 121 exponentials and no allocation.
inline float Isochronic::band_power(float g, float k) {
  constexpr float kSpan = 3.0f;
  const float step = 2.0f * kSpan / static_cast<float>(kBandSteps);
  float sum = 0.0f;
  for (int n = 0; n <= kBandSteps; ++n) {
    const float x = std::exp(-kSpan + step * static_cast<float>(n));
    const float kx2 = k * k * x * x;
    const float one = kx2 / ((1.0f - x * x) * (1.0f - x * x) + kx2);
    const float end = (n == 0 || n == kBandSteps) ? 0.5f : 1.0f;
    sum += end * one * one * x / (1.0f + g * g * x * x);
  }
  return (2.0f * g / kit::kPi) * sum * step;
}

// Before the first key after every voice has ended. A sleeping device stands
// still, and the block it falls asleep in depends on the host's block size,
// so nothing that would run on through a silence is carried into the next
// note: the pulse begins again with both ears shut, the noise streams are
// counted from one again, and a control moved in the silence is simply
// there. The glide is not touched: it has been counting all along.
inline void Isochronic::restart() {
  pulse_.reset();
  for (Ear& ear : ear_) ear.begin(duty_, edge_);
  strikes_ = 0;
  kit::Smoother* const smoothers[] = {&gap_, &offset_, &warmth_, &air_, &volume_};
  for (kit::Smoother* smoother : smoothers) smoother->snap(smoother->target);
  // With no Offset the right ear is the left one, to the sample.
  right_waits_ = offset_.value > 0.0f;
}

// The peak of sin x + w·(a sin 2x + b sin 3x) for 17 values of Warmth w. The
// peak is a convex function of w, so reading between two entries never gives
// less than the true peak and the scaled wave never passes 1.
inline void Isochronic::build_peak_table() {
  constexpr int kSteps = 1024;  // half a cycle: the wave is odd
  for (int k = 0; k < kPeakPoints; ++k) {
    const float warmth = static_cast<float>(k) / static_cast<float>(kPeakPoints - 1);
    float most = 0.0f;
    for (int n = 0; n <= kSteps; ++n) {
      const kit::SinCos turn = kit::sin_cos(0.5 * n / kSteps);
      const float wave = turn.s + warmth * (kSecondPartial * kit::second_partial(turn).s +
                                            kThirdPartial * kit::third_partial(turn).s);
      const float size = wave < 0.0f ? -wave : wave;
      if (size > most) most = size;
    }
    peak_table_[k] = most;
  }
}

inline float Isochronic::wave_peak(float warmth) const {
  const float place = kit::clamp(warmth, 0.0f, 1.0f) * static_cast<float>(kPeakPoints - 1);
  const int index = place < static_cast<float>(kPeakPoints - 2) ? static_cast<int>(place) : kPeakPoints - 2;
  return kit::lerp(peak_table_[index], peak_table_[index + 1], place - static_cast<float>(index));
}

inline void Isochronic::apply(int id) {
  using namespace isochronic;
  const float value = param(id);
  switch (id) {
    case kRate:
    case kTarget:
    case kGlide:
      // Any of the three arms the glide; with a key held it starts here.
      glide_.set(param(kRate), param(kTarget), 60.0 * static_cast<double>(param(kGlide)), pool_.count_active() > 0);
      break;
    case kDuty:
      duty_ = value;
      break;
    case kEdge:
      edge_ = 0.001f * value;
      break;
    case kDepth:
      // The level in the gap is what is smoothed, as any gain is.
      gap_.set(kit::pulse_floor(value), primed());
      break;
    case kOffset:
      offset_.set(value * (1.0f / 360.0f), primed());
      break;
    case kWarmth:
      warmth_.set(value, primed());
      break;
    case kAir:
      air_.set(value, primed());
      break;
    case kAttack:
    case kRelease:
      for (int v = 0; v < kMaxVoices; ++v) set_envelope(pool_.voices[v]);
      break;
    case kVolume:
      volume_.set(kit::db_to_gain(value), primed());
      break;
    default:
      break;
  }
}

}  // namespace livemix
