#pragma once

// Glass: a four-operator FM synthesizer voiced for bells, crystalline pads
// and mallets.
//
//   Bell, Pad     M2 ─► C1 ──────────► A ─┐
//                 M4 ─► C3 ──────────► B ─┤
//   Glass         M3 ─► M2 ─► C1 ────► A ─┤          (A and B are detuned
//                             C4 ────► B ─┼─► pan ─► DC block ─► soft clip
//   Mallet        M2 ─┬► C1 ─────────► A ─┤           apart and panned apart)
//                     └► C3 ─────────► B ─┤
//                        C4 (bar, 4×) ► A+B
//
// - Operators are table sines with phase modulation; each has its own
//   envelope. The carriers' envelopes are the note's loudness, the
//   modulators' envelopes are its brightness: Decay is the time a modulator
//   takes to fall 60 dB towards its floor, so the spectrum collapses onto the
//   bare carrier the way a struck bar's overtones die first. The carriers ring
//   kAmpDecayRatio times longer. Sustain raises both the level the note holds
//   at and the floor the brightness settles on.
// - Ratio is a list, not a continuous control: FM is only in tune with itself
//   at particular ratios, the useful inharmonic ones (1.41, 2.76, 3.5) are
//   isolated points rather than a range, and sweeping between them is a pitch
//   glide of the modulator, never a timbre fade. Algorithm and Ratio are read
//   when a note starts; held notes keep theirs.
// - The two groups A and B play Detune/2 flat and sharp, so their beat rate is
//   f·(2^(d/2400) − 2^(−d/2400)); Spread pans them apart, which turns the
//   beating into movement between the speakers.
// - Key scaling: the modulation index falls with pitch (kIndexKeySlope) and
//   every decay time grows towards the bass (kTimeKeySlope).
// - Band-limiting: there is no oversampling. Instead each index is capped per
//   note so that the sidebands above -60 dB stay under 0.47 of the sample
//   rate (how far they reach for a given index is known from the Bessel
//   functions; see "band-limiting" below), and feedback is withdrawn as the
//   modulator's own harmonics run out of room. A modulator above the limit is
//   silent. High notes therefore tend to a sine instead of folding back. The
//   reach of a fed-back pair or a stack is an estimate: measured, the worst
//   case at full Brightness and Feedback folds back at -55 dB.
//
// The instrument sleeps when no key sounds.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class FmGlass : public kit::DeviceBase<fm_glass::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;
  enum Algorithm : int { kBell = 0, kGlass, kMallet, kPad, kNumAlgorithms };

  static constexpr int kNumRatios = 12;
  static constexpr float kRatios[kNumRatios] = {0.5f, 1.0f, 1.41f, 2.0f, 2.76f, 3.0f,
                                                3.5f, 4.0f, 5.0f,  7.0f, 9.0f,  14.0f};

  // Peak modulation index in radians at Brightness 1, full velocity, at the
  // key-scaling reference pitch. Brightness maps through a 1.5 power.
  static constexpr float kMaxIndex = 8.0f;
  static constexpr float kKeyReferenceHz = 261.63f;
  static constexpr float kIndexKeySlope = 0.5f;
  static constexpr float kTimeKeySlope = 0.4f;
  // Carrier decay as a multiple of the modulator decay.
  static constexpr float kAmpDecayRatio = 4.0f;

  struct Shape {
    float mod_attack;     // modulator attack as a multiple of Attack
    float mod_decay_a;    // first and second modulator decay, multiples of Decay
    float mod_decay_b;
    float index_b;        // second modulator's index relative to the first
    float level_b;        // group B's level relative to group A
    float floor;          // brightness the modulators settle on at Sustain 1
  };
  static constexpr Shape kShapes[kNumAlgorithms] = {
      {0.5f, 1.0f, 0.6f, 0.7f, 1.0f, 0.35f},   // Bell: the second pair is duller and dies first
      {0.5f, 1.0f, 0.4f, 0.6f, 0.8f, 0.3f},    // Glass: a short bright ping on top of the stack
      {0.25f, 0.5f, 0.3f, 1.0f, 1.0f, 0.2f},   // Mallet: the strike is over quickly
      {2.0f, 2.0f, 3.0f, 0.8f, 1.0f, 0.7f},    // Pad: brightness blooms after the level and stays
  };

  // How much longer (or shorter) than the set time a note at `hz` decays.
  static float key_time_scale(float hz) {
    return kit::clamp(std::pow(kKeyReferenceHz / hz, kTimeKeySlope), 0.4f, 2.5f);
  }
  // The share of the set modulation index a note at `hz` gets.
  static float key_index_scale(float hz) {
    return kit::clamp(std::pow(kKeyReferenceHz / hz, kIndexKeySlope), 0.3f, 1.4f);
  }

  void init(float sample_rate) {
    using namespace fm_glass;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      for (kit::Adsr& env : voice.env) env.set_sample_rate(sr);
    }
    for (kit::DcBlocker& blocker : dc_) {
      blocker.reset();
      blocker.set_cutoff(12.0f, sr);
    }
    brightness_.set_time(kSmoothingSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    clock_.reset(32);
    // Nothing outlives the envelopes but the DC blocker's 12 Hz settle.
    idle_.reset(sr, 0.25f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    detune_flat_ = 1.0f;
    detune_sharp_ = 1.0f;
    update_detune();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace fm_glass;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, kit::min(12000.0f, 0.4f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: let the old voice go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].fast_release(0.03f);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.algorithm = kit::clamp_int(static_cast<int>(param(kAlgorithm) + 0.5f), 0, kNumAlgorithms - 1);
    voice.ratio = kRatios[kit::clamp_int(static_cast<int>(param(kRatio) + 0.5f), 0, kNumRatios - 1)];
    voice.carrier_b = voice.algorithm == kGlass ? 3 : 2;
    voice.frequency = frequency;
    const float amount = param(kVelocity);
    voice.gain = 1.0f - amount * (1.0f - gain * std::sqrt(gain));
    voice.index_gain = (kMaxIndex / kit::kTwoPi) * key_index_scale(frequency) *
                       (1.0f - amount * 0.75f * (1.0f - gain));
    voice.time_scale = key_time_scale(frequency);
    if (!stolen) {
      // Every fresh note starts its operators in the same phase, so the
      // attack is the same every time. A stolen voice keeps running: the
      // jump would click.
      for (int op = 0; op < 4; ++op) voice.phase[op] = 0.0f;
      voice.z[0][0] = voice.z[0][1] = voice.z[1][0] = voice.z[1][1] = 0.0f;
      for (kit::Adsr& env : voice.env) env.reset();
    }
    update_detune();
    tune(voice);
    shape(voice);
    for (kit::Adsr& env : voice.env) env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    for (kit::Adsr& env : pool_.voices[held].env) env.gate_off();
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

      const float brightness = brightness_.next();
      const float feedback = feedback_.next();
      float group_a = 0.0f, group_b = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.active()) continue;
        render(voice, brightness, feedback, &group_a, &group_b);
      }
      // Equal-power placement: A leans left by Spread, B right by as much.
      const float angle = (1.0f - spread_.next()) * 0.125f;
      const float own = kit::SineTable::cos_lookup(angle);
      const float other = kit::SineTable::lookup(angle);
      const float volume = volume_.next() * kVoiceGain;
      out_left_[i] = kit::soft_clip(dc_[0].process((group_a * own + group_b * other) * volume));
      out_right_[i] = kit::soft_clip(dc_[1].process((group_a * other + group_b * own) * volume));
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    float phase[4] = {0.0f, 0.0f, 0.0f, 0.0f};
    float increment[4] = {0.0f, 0.0f, 0.0f, 0.0f};
    kit::Adsr env[4];
    // Last two outputs of the (up to two) operators that feed themselves.
    float z[2][2] = {{0.0f, 0.0f}, {0.0f, 0.0f}};
    // Per modulator: index per unit of Brightness and its band-limit cap, in
    // cycles; and the share of Feedback the modulator may have.
    float index[2] = {0.0f, 0.0f};
    float cap[2] = {0.0f, 0.0f};
    float self[2] = {0.0f, 0.0f};
    float bar = 0.0f;  // Mallet: level of the 4× partial per unit of Brightness
    float frequency = 440.0f;
    float ratio = 1.0f;
    float gain = 0.0f;
    float index_gain = 0.0f;
    float time_scale = 1.0f;
    int algorithm = 0;
    int carrier_b = 2;

    bool active() const { return env[0].active() || env[carrier_b].active(); }
    bool releasing() const { return env[0].releasing(); }
    float level() const { return env[0].level(); }
    void fast_release(float seconds) {
      for (kit::Adsr& e : env) e.fast_release(seconds);
    }
  };

  // One key at gain 0.7 peaks near -20 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.29f;
  // Self-modulation at Feedback 1, in radians. Under 1 rad the operator's
  // harmonics still fall off exponentially (a rounded sawtooth); past it they
  // do not, and the result is noise that no cap can keep under Nyquist.
  static constexpr float kMaxFeedback = 0.75f;
  // Share of the sample rate everything above -60 dB must stay under.
  static constexpr float kBandLimit = 0.47f;
  static constexpr float kFeedbackMargin = 3.0f;
  static constexpr float kStackMargin = 2.0f;
  static constexpr float kFeedbackHarmonics = 28.0f;
  static constexpr float kBarRatio = 4.0f;
  static constexpr float kBarLevel = 0.35f;

  static float advance(float phase, float increment) {
    phase += increment;
    return phase >= 1.0f ? phase - 1.0f : phase;
  }

  // An operator that modulates itself with the mean of its last two outputs
  // (which removes the alternating-sample instability of plain feedback).
  static float self_modulated(float phase, float amount, float* z) {
    const float out = kit::SineTable::lookup(phase + amount * 0.5f * (z[0] + z[1]));
    z[1] = z[0];
    z[0] = out;
    return out;
  }

  void render(Voice& voice, float brightness, float feedback, float* group_a, float* group_b) {
    const float e0 = voice.env[0].next();
    const float e1 = voice.env[1].next();
    const float e2 = voice.env[2].next();
    const float e3 = voice.env[3].next();
    const float* phase = voice.phase;
    const float index_a = kit::min(brightness * voice.index[0], voice.cap[0]);
    const float index_b = kit::min(brightness * voice.index[1], voice.cap[1]);
    float a, b;
    switch (voice.algorithm) {
      case kGlass: {
        const float top = self_modulated(phase[2], feedback * voice.self[1], voice.z[1]);
        const float middle = kit::SineTable::lookup(phase[1] + index_b * e2 * top);
        a = kit::SineTable::lookup(phase[0] + index_a * e1 * middle) * e0;
        b = kit::SineTable::lookup(phase[3]) * e3;
        break;
      }
      case kMallet: {
        const float strike =
            index_a * e1 * self_modulated(phase[1], feedback * voice.self[0], voice.z[0]);
        const float bar =
            kit::SineTable::lookup(phase[3]) * e3 * kit::min(brightness * voice.bar, kBarLevel);
        a = kit::SineTable::lookup(phase[0] + strike) * e0 + bar;
        b = kit::SineTable::lookup(phase[2] + strike) * e2 + bar;
        break;
      }
      default: {
        const float mod_a = self_modulated(phase[1], feedback * voice.self[0], voice.z[0]);
        const float mod_b = self_modulated(phase[3], feedback * voice.self[1], voice.z[1]);
        a = kit::SineTable::lookup(phase[0] + index_a * e1 * mod_a) * e0;
        b = kit::SineTable::lookup(phase[2] + index_b * e3 * mod_b) * e2;
        break;
      }
    }
    for (int op = 0; op < 4; ++op) voice.phase[op] = advance(voice.phase[op], voice.increment[op]);
    *group_a += a * voice.gain;
    *group_b += b * voice.gain * kShapes[voice.algorithm].level_b;
  }

  // --- band-limiting --------------------------------------------------------
  //
  // A carrier under a sine of index I (radians) has sidebands above -60 dB
  // out to I + 1.6·sqrt(I) + 1.8 modulator widths (Carson's I + 1 holds 98 %
  // of the power, which is 40 dB short of that); under 0.06 rad only the
  // first pair is. The I term is the peak frequency deviation, the rest the
  // skirt beyond it. A modulator that is not a sine (a fed-back operator, the
  // modulated middle of a stack) deviates the carrier by I times its peak
  // slope, and its skirt is taken at its RMS slope, both relative to a sine:
  //
  //   reach(I) = I · peak_hz + (1.6·sqrt(I) + 1.8) · skirt_hz
  //
  // The cap is the largest I whose reach fits in `room`.
  static float index_for_room(float room, float peak_hz, float skirt_hz) {
    if (room < skirt_hz) return 0.0f;
    if (room < 0.06f * peak_hz + 2.2f * skirt_hz) return 0.06f;
    const float root = (std::sqrt(2.56f * skirt_hz * skirt_hz + 4.0f * peak_hz * (room - 1.8f * skirt_hz)) -
                        1.6f * skirt_hz) /
                       (2.0f * peak_hz);
    return root * root;
  }

  // A margin on the excess of an RMS slope over a sine's.
  static float skirt(float slope, float margin) { return 1.0f + margin * (slope - 1.0f); }

  // An operator that modulates itself by `beta` radians, y = sin(x + beta·y):
  // its slope dy/dx peaks at 1/(1 - beta) and has the RMS value
  // sqrt((1 - s) / (beta² s)), s = sqrt(1 - beta²), against sqrt(1/2) for a
  // sine.
  static float feedback_peak(float beta) { return 1.0f / (1.0f - beta); }
  static float feedback_slope(float beta) {
    if (beta < 0.05f) return 1.0f + 0.375f * beta * beta;
    const float s = std::sqrt(1.0f - beta * beta);
    return std::sqrt(2.0f * (1.0f - s) / (beta * beta * s));
  }

  // The share of the set Feedback (`beta` radians) a modulator may have: the
  // most whose significant harmonics still fit as sidebands of its carrier.
  // There are about 2 + kFeedbackHarmonics·beta^1.5 of them above -60 dB
  // (after the series 2/(n·beta) · J_n(n·beta); the second is there for any
  // audible feedback at all).
  float feedback_room(float carrier_hz, float modulator_hz, float beta) const {
    const float fit = ((kBandLimit * sample_rate() - carrier_hz) / modulator_hz - 2.0f) *
                      (1.0f / kFeedbackHarmonics);
    if (fit <= 0.0f) return 0.0f;
    const float most = std::cbrt(fit * fit);
    return beta <= most ? 1.0f : most / beta;
  }

  // Largest index (radians) a modulator at `modulator_hz`, fed back by `beta`
  // radians, may have on a carrier at `carrier_hz`.
  float pair_cap(float carrier_hz, float modulator_hz, float beta) const {
    const float room = kBandLimit * sample_rate() - carrier_hz;
    if (room <= 0.0f || modulator_hz <= 0.0f) return 0.0f;
    return index_for_room(room, modulator_hz * feedback_peak(beta),
                          modulator_hz * skirt(feedback_slope(beta), kFeedbackMargin));
  }

  // Whether a stack fits under the limit with a carrier index `index` and a
  // top index `top` (radians), the top operator fed back by `beta`. The
  // middle operator, sin(x + top·sin(2x)), has a peak slope of 1 + 2·top and
  // a mean square slope of (1 + 2·top² + J1(2·top) - 2·top·J2(2·top)) / 2.
  static bool stack_fits(float room, float middle_hz, float index, float top, float beta) {
    float square = 1.0f + 2.0f * top * top;
    if (top < 3.0f) {
      // J1 and J2 of 2·top by their power series.
      float j1 = top, j2 = 0.5f * top * top, t1 = j1, t2 = j2;
      for (int k = 1; k < 14; ++k) {
        t1 *= -top * top / static_cast<float>(k * (k + 1));
        t2 *= -top * top / static_cast<float>(k * (k + 2));
        j1 += t1;
        j2 += t2;
      }
      square += j1 - 2.0f * top * j2;
    }
    const float peak = 1.0f + 2.0f * top * feedback_peak(beta);
    const float slope = kit::max(1.0f, std::sqrt(square) * feedback_slope(beta));
    const float tail = index < 0.002f ? 0.0f : (index < 0.06f ? 1.0f : 1.6f * std::sqrt(index) + 1.8f);
    return index * middle_hz * peak + tail * middle_hz * skirt(slope, kStackMargin) <= room;
  }

  // The share of both of a stack's indices (radians) that fits.
  float stack_scale(float carrier_hz, float middle_hz, float index, float top, float beta) const {
    const float room = kBandLimit * sample_rate() - carrier_hz;
    if (room <= 0.0f) return 0.0f;
    if (stack_fits(room, middle_hz, index, top, beta)) return 1.0f;
    float low = 0.0f, high = 1.0f;
    for (int step = 0; step < 8; ++step) {
      const float middle = 0.5f * (low + high);
      if (stack_fits(room, middle_hz, index * middle, top * middle, beta)) {
        low = middle;
      } else {
        high = middle;
      }
    }
    return low;
  }

  // Operator frequencies and band-limit caps of one voice, from its pitch,
  // ratio, Detune and Feedback.
  void tune(Voice& voice) {
    using namespace fm_glass;
    const float sr = sample_rate();
    const float limit = kBandLimit * sr;
    const float flat = voice.frequency * detune_flat_;
    const float sharp = voice.frequency * detune_sharp_;
    const float feedback = param(kFeedback) * kMaxFeedback;
    const Shape& shape = kShapes[voice.algorithm];
    const float index = voice.index_gain;
    float hz[4];
    switch (voice.algorithm) {
      case kGlass: {
        hz[0] = flat;
        hz[1] = flat * voice.ratio;
        hz[2] = flat * voice.ratio * 2.0f;
        hz[3] = sharp;
        voice.self[0] = 0.0f;
        voice.self[1] = feedback_room(hz[1], hz[2], feedback);
        const float beta = feedback * voice.self[1];
        // The top index is capped twice: for the middle operator's own
        // sidebands, and so that every partial of the middle operator (they
        // sit 2·ratio apart) still fits as a first sideband of the carrier.
        const float partials = 0.5f * ((limit - hz[0]) / hz[1] - 1.0f) / feedback_peak(beta);
        const float top_cap =
            kit::min(pair_cap(hz[1], hz[2], beta), index_for_room(partials, 1.0f, 1.0f));
        // What is left is shared: both indices come down together, so the
        // tone keeps its proportions as it darkens up the keyboard.
        const float wanted = brightness_.target * index * kit::kTwoPi;
        const float top = kit::min(wanted * shape.index_b, top_cap);
        const float scale = stack_scale(hz[0], hz[1], wanted, top, beta);
        voice.index[0] = index;
        voice.index[1] = index * shape.index_b;
        voice.cap[0] = scale * wanted / kit::kTwoPi;
        voice.cap[1] = scale * top / kit::kTwoPi;
        break;
      }
      case kMallet: {
        hz[0] = flat;
        hz[1] = voice.frequency * voice.ratio;
        hz[2] = sharp;
        hz[3] = voice.frequency * kBarRatio;
        voice.self[0] = feedback_room(sharp, hz[1], feedback);
        voice.self[1] = 0.0f;
        voice.index[0] = index;
        voice.index[1] = 0.0f;
        voice.cap[0] = pair_cap(sharp, hz[1], feedback * voice.self[0]) / kit::kTwoPi;
        voice.cap[1] = 0.0f;
        voice.bar = hz[3] < limit ? 2.0f * voice.index_gain * (kit::kTwoPi / kMaxIndex) : 0.0f;
        break;
      }
      default: {
        hz[0] = flat;
        hz[1] = flat * voice.ratio;
        hz[2] = sharp;
        hz[3] = sharp * voice.ratio;
        for (int pair = 0; pair < 2; ++pair) {
          const float carrier = hz[2 * pair], modulator = hz[2 * pair + 1];
          voice.self[pair] = feedback_room(carrier, modulator, feedback);
          voice.index[pair] = index * (pair == 0 ? 1.0f : shape.index_b);
          voice.cap[pair] = pair_cap(carrier, modulator, feedback * voice.self[pair]) / kit::kTwoPi;
        }
        break;
      }
    }
    for (int op = 0; op < 4; ++op) {
      // An operator past the limit stands still; its cap is already zero.
      voice.increment[op] = hz[op] < limit ? hz[op] / sr : 0.0f;
    }
  }

  // Envelope times of one voice from Attack, Decay, Sustain, Release.
  void shape(Voice& voice) {
    using namespace fm_glass;
    const Shape& shape = kShapes[voice.algorithm];
    const float attack = param(kAttack);
    const float release = param(kRelease);
    const float sustain = param(kSustain);
    const float decay = param(kDecay) * voice.time_scale;
    const float ring = decay * kAmpDecayRatio;
    const float mod_attack = kit::max(0.001f, attack * shape.mod_attack);
    const float floor = shape.floor * sustain;
    voice.env[0].set(attack, ring, sustain, release);
    voice.env[1].set(mod_attack, decay * shape.mod_decay_a, floor, release);
    switch (voice.algorithm) {
      case kGlass:
        voice.env[2].set(mod_attack, decay * shape.mod_decay_b, floor, release);
        voice.env[3].set(attack, ring, sustain, release);
        break;
      case kMallet:
        voice.env[2].set(attack, ring, sustain, release);
        // The bar partial is part of the strike: it never sustains.
        voice.env[3].set(attack, ring * shape.mod_decay_b, 0.0f, release);
        break;
      default:
        voice.env[2].set(attack, ring, sustain, release);
        voice.env[3].set(mod_attack, decay * shape.mod_decay_b, floor, release);
        break;
    }
  }

  void update_detune() {
    const float half = 0.5f * param(fm_glass::kDetune);
    detune_flat_ = kit::cents_to_ratio(-half);
    detune_sharp_ = kit::cents_to_ratio(half);
  }

  // Every 32 samples, and only after a parameter that matters has moved:
  // detune, band-limit caps and envelope times of the sounding voices.
  void control() {
    if (!retune_ && !reshape_) return;
    update_detune();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.active()) continue;
      if (retune_) tune(voice);
      if (reshape_) shape(voice);
    }
    retune_ = false;
    reshape_ = false;
  }

  void apply(int id) {
    using namespace fm_glass;
    const float value = param(id);
    switch (id) {
      case kBrightness:
        brightness_.set(value * std::sqrt(value), primed());
        retune_ = true;
        break;
      case kFeedback:
        feedback_.set(value * kMaxFeedback * (1.0f / kit::kTwoPi), primed());
        retune_ = true;
        break;
      case kDetune:
        retune_ = true;
        break;
      case kDecay:
      case kAttack:
      case kRelease:
      case kSustain:
        reshape_ = true;
        break;
      case kSpread:
        spread_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read at note-on
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::DcBlocker dc_[2];
  kit::Smoother brightness_, feedback_, spread_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float detune_flat_ = 1.0f, detune_sharp_ = 1.0f;
  bool retune_ = false, reshape_ = false;
};

}  // namespace livemix
