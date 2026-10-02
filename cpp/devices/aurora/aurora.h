#pragma once

// Aurora: a dual-layer brass and string pad for slow swells.
//
//   per voice (8):
//     layer I   saw ───────────────► high-pass ─► low-pass ─┐
//               (half the gap flat)   12 dB        12 dB    ├─► × envelope × swell
//     layer II  saw + moving pulse ─► high-pass ─► low-pass ─┘    × note gain × ring
//               (half the gap sharp)  (higher)     (higher)            │
//                                                                      ▼
//                     out ◄─ soft clip ◄─ volume ◄─ layers lean left and right
//
//   low-pass corner, in octaves from Brilliance:
//     keyboard tracking + note gain + Contour × shape + Swell × swell
//
// - Two layers per voice, each with its own high-pass and low-pass in series.
//   Two gentle resonant filters make a band that can be moved and narrowed,
//   which is why this kind of brass sounds open rather than closed. Layer II
//   is voiced a fifth brighter and an octave thinner than layer I and carries
//   a pulse whose width moves slowly: a string layer over a brass one.
// - The contour is the "start low, rise past, settle" shape of a brass
//   attack: the low-pass starts below its resting corner, reaches a peak
//   above it at the Attack time and decays back. On release it glides back
//   towards where it started, so a note darkens as it fades.
// - Swell stands in for a finger leaning into the key. Once the attack is
//   done, level and brightness keep rising towards a plateau. The plateau
//   level is the same at every Swell setting: more Swell starts the note
//   lower, so presets keep their loudness.
// - Detune is the tuning gap between the layers, half below the note and half
//   above, so the centre stays in tune. Each voice also sits a fixed fraction
//   of it off pitch and each layer wanders a little on its own. At zero every
//   oscillator is exactly in tune and the layers of a voice start in phase.
// - Ring multiplies a voice by a sine that falls from 1.4 kHz to 35 Hz while
//   its depth fades: a metallic onset that melts into the pad. It is per
//   voice, so a new note rings without disturbing the ones already held.
// - Note gain is level and brightness together.
// - A stolen voice fades out in 3 ms and starts its new note when the fade is
//   over; until then the note waits on the voice (`pending`).
//
// The oscillators are band-limited four samples wide (layer_osc.h), so a
// high note with Brilliance wide open stays clean. The instrument sleeps when
// no voice sounds.

#include "../../kit/kit.h"
#include "layer_osc.h"
#include "params.gen.h"

namespace livemix {

class Aurora : public kit::DeviceBase<aurora::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  static constexpr int kControlPeriod = 16;

  // The contour, in octaves from the resting corner at Contour 1: where a
  // note starts and how far it overshoots.
  static constexpr float kContourStart = 3.0f;
  static constexpr float kContourPeak = 2.0f;
  // The overshoot decays with this time constant: a floor plus the Attack
  // time, so a slow patch settles slowly.
  static constexpr float kContourDecaySeconds = 0.3f;
  static constexpr float kContourDecayPerAttack = 1.0f;
  // On release the contour glides back to its start with this share of the
  // Release time as its time constant.
  static constexpr float kContourReleaseShare = 0.4f;
  // Swell: time constant of the rise, how far it opens the low-pass at
  // Swell 1 (octaves) and how much lower the note starts (share of level).
  static constexpr float kSwellSeconds = 1.6f;
  static constexpr float kSwellOctaves = 1.5f;
  static constexpr float kSwellLevel = 0.6f;
  // Note gain: level at gain 0, and octaves the low-pass closes by there.
  static constexpr float kSoftestLevel = 0.35f;
  static constexpr float kVelocityOctaves = 1.5f;
  // Both corners follow the keyboard by half, pivoting at middle C.
  static constexpr float kKeyTrack = 0.5f;
  static constexpr float kPivotHz = 261.6256f;
  // The low-pass opens no further than this, at any sample rate.
  static constexpr float kTopHz = 16000.0f;
  // Layer II against layer I: corner ratios, level, and its pulse.
  static constexpr float kLayerTwoBright = 1.5f;
  static constexpr float kLayerTwoThin = 2.0f;
  static constexpr float kLayerTwoLevel = 0.8f;
  static constexpr float kPulseLevel = 0.5f;
  // Its width swings this far either side of half, at a rate that goes up
  // from voice to voice.
  static constexpr float kPulseSweep = 0.3f;
  static constexpr float kPulseHz = 0.31f;
  static constexpr float kPulseHzPerVoice = 0.037f;
  // Tuning. Each voice sits kScatter × Detune × this from pitch and each
  // layer drifts by ± this share of Detune. Below kPhaseSpreadCents the
  // layers of a new note start closer and closer to in phase.
  static constexpr float kScatter[kMaxVoices] = {0.55f, -0.8f, 1.0f, -0.35f,
                                                 0.15f, -1.0f, 0.7f, -0.25f};
  static constexpr float kScatterShare = 0.25f;
  static constexpr float kDriftShare = 0.05f;
  static constexpr float kPhaseSpreadCents = 3.0f;
  // Resonance 0..1 is Q from Butterworth to 6, and trims the level a little.
  static constexpr float kMinQ = 0.7071f;
  static constexpr float kQOctaves = 3.085f;
  static constexpr float kResonanceTrim = 0.5f;
  // Ring: the sweep, and its decay (a floor plus a multiple of Attack, so a
  // slow attack does not hide it).
  static constexpr float kRingEndHz = 35.0f;
  static constexpr float kRingOctaves = 5.32f;
  static constexpr float kRingSeconds = 0.35f;
  static constexpr float kRingPerAttack = 1.2f;
  // A stolen voice is gone in this long; a re-struck key in kRestrikeSeconds.
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kRestrikeSeconds = 0.02f;
  // How far the layers lean to either side (-1..1).
  static constexpr float kSpread = 0.4f;
  // One note at full gain reaches about -7 dBFS before Volume once it has swelled.
  static constexpr float kVoiceGain = 0.175f;

  void init(float sample_rate) {
    using namespace aurora;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      voice.amp.set_time(kStealSeconds, sr);
      voice.ring.set_time(kStealSeconds, sr);
      const uint32_t seed = 0x9E3779B9u * static_cast<uint32_t>(v + 1);
      voice.drift[0].seed(seed ^ 0x51ED270Bu);
      voice.drift[0].set_rate(0.11f + 0.013f * static_cast<float>(v), control_rate);
      voice.drift[1].seed(seed ^ 0x0BADC0DEu);
      voice.drift[1].set_rate(0.17f + 0.011f * static_cast<float>(v), control_rate);
      voice.width_phase = 0.137f * static_cast<float>(v + 1);
      voice.width_step = (kPulseHz + kPulseHzPerVoice * static_cast<float>(v)) / control_rate;
      voice.scatter = kScatter[v];
      kit::pan_gains((v & 1) ? kSpread : -kSpread, &voice.near, &voice.far);
    }
    start_.seed(0xA5A5F00Du);
    brilliance_.set_time(2.0f * kSmoothingSeconds, control_rate);
    low_cut_.set_time(2.0f * kSmoothingSeconds, control_rate);
    resonance_.set_time(2.0f * kSmoothingSeconds, control_rate);
    detune_.set_time(2.0f * kSmoothingSeconds, control_rate);
    volume_.set_time(kSmoothingSeconds, sr);
    clock_.reset(kControlPeriod);
    // Nothing outlives the envelopes.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    snap_knobs();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: let the old voice go quickly. If it was
    // still waiting on a stolen voice, it simply never starts.
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& old = pool_.voices[held];
      if (old.pending) {
        old.pending = false;
      } else {
        old.env.fast_release(kRestrikeSeconds);
      }
    }

    // A note into silence: knobs moved while nothing sounded are simply where
    // they are, and the control clock starts with the note, so the output
    // does not depend on how the silence before it was cut into blocks.
    if (pool_.count_active() == 0) {
      snap_knobs();
      clock_.reset(kControlPeriod);
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.next_frequency = frequency;
    voice.next_gain = gain;
    if (stolen) {
      // The old note fades first; process() starts this one when it is gone.
      voice.pending = true;
      voice.env.fast_release(kStealSeconds);
    } else {
      start(voice);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      voice.pending = false;  // released before it began: the fade is its end
    } else {
      voice.env.gate_off();
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      float left = 0.0f, right = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) {
          if (!voice.pending) continue;
          start(voice);  // the steal fade is over
        }
        const float second = voice.increment * voice.ratio[1];
        voice.width += voice.width_slope;
        float one = voice.osc[0].saw(voice.increment * voice.ratio[0]);
        float two = voice.osc[1].saw_and_pulse(second, voice.width, kPulseLevel);
        one = voice.lowpass[0].lowpass(voice.highpass[0].highpass(one));
        two = voice.lowpass[1].lowpass(voice.highpass[1].highpass(two)) * kLayerTwoLevel;

        float gain = voice.env.next() * voice.amp.next();
        const float ring = voice.ring.next();
        if (ring > 0.0f) {
          gain *= 1.0f - ring + ring * kit::SineTable::lookup(voice.ring_phase);
          voice.ring_phase += voice.ring_increment;
          if (voice.ring_phase >= 1.0f) voice.ring_phase -= 1.0f;
        }
        left += (one * voice.near + two * voice.far) * gain;
        right += (one * voice.far + two * voice.near) * gain;
      }
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    aurora_dsp::LayerOsc osc[2];        // per layer
    kit::Svf highpass[2], lowpass[2];   // per layer
    kit::Adsr env;
    kit::Drift drift[2];
    kit::Smoother amp, ring;            // per sample
    float increment = 0.0f;
    float ratio[2] = {1.0f, 1.0f};      // detune, scatter and drift per layer
    float wander[2] = {0.0f, 0.0f};     // the drifts, -1..1
    float velocity = 0.0f;              // level from note gain
    float track = 0.0f;                 // octaves: keyboard tracking
    float track_ratio = 1.0f;
    float bright = 0.0f;                // octaves: note gain
    float rise = 0.0f;                  // 0..1 through the contour's attack
    float shape = 0.0f;                 // octaves at Contour 1
    float swell = 0.0f;                 // 0..1
    float zing = 0.0f;                  // 1..0: the ring envelope
    float ring_phase = 0.0f, ring_increment = 0.0f;
    float width = 0.5f, width_slope = 0.0f;       // the pulse width, per sample
    float width_phase = 0.0f, width_step = 0.0f;  // its LFO, per control tick
    float scatter = 0.0f;
    float near = 1.0f, far = 0.0f;      // pan gains: layer I, and II mirrored
    // A note waiting for the stolen voice to fade.
    bool pending = false;
    float next_frequency = 220.0f, next_gain = 0.0f;

    bool active() const { return env.active() || pending; }
    // A voice with a note waiting is held by that note, not on its way out.
    bool releasing() const { return env.releasing() && !pending; }
    float level() const { return pending ? 1.0f : env.level(); }
  };

  // Begin the note waiting on `voice`, from silence.
  void start(Voice& voice) {
    using namespace aurora;
    const float gain = voice.next_gain;
    voice.pending = false;
    voice.increment = voice.next_frequency / sample_rate();
    voice.velocity = kSoftestLevel + (1.0f - kSoftestLevel) * gain;
    voice.bright = kVelocityOctaves * (gain - 1.0f);
    voice.track = kKeyTrack * std::log2(voice.next_frequency / kPivotHz);
    voice.track_ratio = std::exp2(voice.track);
    voice.rise = 0.0f;
    voice.shape = -kContourStart;
    voice.swell = 0.0f;
    voice.zing = 1.0f;
    voice.ring_phase = 0.0f;
    // Free-running oscillators: any phase, and layer II anywhere against
    // layer I unless Detune is near zero, where a fixed offset would be a
    // comb filter that never moves.
    const float phase = start_.uniform();
    const float apart = start_.uniform() * kit::min(1.0f, detune_.value / kPhaseSpreadCents);
    voice.osc[0].reset(phase);
    voice.osc[1].reset(phase + apart);
    for (int layer = 0; layer < 2; ++layer) {
      voice.highpass[layer].reset();
      voice.lowpass[layer].reset();
    }
    voice.width = 0.5f + kPulseSweep * kit::SineTable::lookup(voice.width_phase);
    voice.width_slope = 0.0f;
    voice.env.reset();
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
    tune(voice);
    voice.amp.snap(voice.amp.target);
    voice.ring.snap(voice.ring.target);
  }

  // Every 16 samples: the knobs, then each voice's envelopes and filters.
  void control() {
    using namespace aurora;
    const float dt = static_cast<float>(kControlPeriod) / sample_rate();
    brilliance_.next();
    low_cut_.next();
    detune_.next();
    resonate(resonance_.next());

    const float attack = param(kAttack);
    const float release = param(kRelease);
    const float rise_step = dt / attack;
    const float decay = std::exp(-dt / (kContourDecaySeconds + kContourDecayPerAttack * attack));
    const float glide = std::exp(-dt / (kContourReleaseShare * release));
    const float swell_step = 1.0f - std::exp(-dt / kSwellSeconds);
    const float zing_decay = std::exp(-dt / (kRingSeconds + kRingPerAttack * attack));

    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      voice.env.set(attack, 0.01f, 1.0f, release);
      if (voice.env.releasing()) {
        voice.shape = -kContourStart + (voice.shape + kContourStart) * glide;
      } else if (voice.rise < 1.0f) {
        voice.rise = kit::min(1.0f, voice.rise + rise_step);
        voice.shape = -kContourStart + (kContourStart + kContourPeak) * voice.rise;
      } else {
        voice.shape = flush_denormal(voice.shape * decay);
        voice.swell += (1.0f - voice.swell) * swell_step;
      }
      voice.zing = flush_denormal(voice.zing * zing_decay);
      voice.wander[0] = voice.drift[0].next();
      voice.wander[1] = voice.drift[1].next();
      voice.width_phase += voice.width_step;
      voice.width_phase -= std::floor(voice.width_phase);
      const float width = 0.5f + kPulseSweep * kit::SineTable::lookup(voice.width_phase);
      voice.width_slope = (width - voice.width) * (1.0f / static_cast<float>(kControlPeriod));
      tune(voice);
    }
  }

  // 2^(cents/1200) to second order: exact to 0.01 cent over ±100 cents.
  static float cents_ratio(float cents) {
    const float x = cents * (0.69314718f / 1200.0f);
    return 1.0f + x + 0.5f * x * x;
  }

  // Pitch, filters, level and ring of one voice from where its envelopes are.
  void tune(Voice& voice) {
    using namespace aurora;
    const float sr = sample_rate();
    const float detune = detune_.value;
    const float centre = voice.scatter * kScatterShare * detune;
    const float drift = kDriftShare * detune;
    voice.ratio[0] = cents_ratio(centre - 0.5f * detune + drift * voice.wander[0]);
    voice.ratio[1] = cents_ratio(centre + 0.5f * detune + drift * voice.wander[1]);

    const float swell = param(kSwell);
    const float octaves = voice.track + voice.bright + param(kContour) * voice.shape +
                          swell * kSwellOctaves * voice.swell;
    const float low = brilliance_.value * std::exp2(octaves);
    const float high = low_cut_.value * voice.track_ratio;
    voice.lowpass[0].set(kit::min(low, kTopHz), q_, sr);
    voice.lowpass[1].set(kit::min(low * kLayerTwoBright, kTopHz), q_, sr);
    voice.highpass[0].set(high, q_, sr);
    voice.highpass[1].set(high * kLayerTwoThin, q_, sr);

    voice.amp.set_target(voice.velocity * trim_ * (1.0f - kSwellLevel * swell * (1.0f - voice.swell)));
    const float ring = param(kRing);
    voice.ring.set_target(ring * voice.zing);
    if (ring > 0.0f) {
      voice.ring_increment = kRingEndHz * std::exp2(kRingOctaves * voice.zing) / sr;
    }
  }

  // Whatever moved while nothing sounded is simply there.
  void snap_knobs() {
    brilliance_.snap(brilliance_.target);
    low_cut_.snap(low_cut_.target);
    resonance_.snap(resonance_.target);
    detune_.snap(detune_.target);
    volume_.snap(volume_.target);
    resonate(resonance_.value);
  }

  // Resonance 0..1 as the Q of every filter and the level trim that goes with it.
  void resonate(float resonance) {
    q_ = kMinQ * std::exp2(kQOctaves * resonance);
    trim_ = kVoiceGain / (1.0f + kResonanceTrim * resonance);
  }

  void apply(int id) {
    using namespace aurora;
    const float value = param(id);
    switch (id) {
      case kBrilliance:
        brilliance_.set(value, primed());
        break;
      case kLowCut:
        low_cut_.set(value, primed());
        break;
      case kResonance:
        resonance_.set(value, primed());
        break;
      case kDetune:
        detune_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  // Read on the control clock (time constants in control ticks).
  kit::Smoother brilliance_, low_cut_, resonance_, detune_;
  // Read per sample.
  kit::Smoother volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng start_;
  float q_ = kMinQ;
  float trim_ = kVoiceGain;
};

}  // namespace livemix
