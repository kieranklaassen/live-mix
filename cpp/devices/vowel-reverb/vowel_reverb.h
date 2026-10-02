#pragma once

// Vowel Reverb: a hall whose tail is shaped by the formants of a sung vowel.
//
//   in ─► pre-delay ─► 4 allpasses ─┬────────────── early ───────────────┐
//                                   ▼                                    ▼
//                                  (+)─► 8 modulated delay lines ─┬─► taps (+)─► low cut ─┐
//                                   ▲                             │                       │
//                                   │                          Hadamard                   │
//                                   │                             │                       │
//                                   └─ damping ◄─ decay gain ◄─ vowel (broad, in the loop)│
//                                                                                         │
//      wet ◄─ width ◄─ high cut ◄─ (1 - b)·flat + b·makeup·[five formants, per side] ◄────┘
//
// HEADER-NOTES

#include "../../kit/kit.h"
#include "params.gen.h"
#include "vowels.h"

namespace livemix {

class VowelReverb : public kit::DeviceBase<vowel_reverb::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace vowel_reverb;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float scale = sr / 48000.0f;
    const float control_rate = sr / kControlPeriod;

    for (int c = 0; c < 2; ++c) {
      predelay_[c].clear();
      low_cut_[c].reset();
      high_cut_[c].reset();
      bank_[c].reset();
      vowel_gain_[c] = 0.0f;
      vowel_step_[c] = 0.0f;
      for (int a = 0; a < kInputStages; ++a) {
        input_allpass_[c][a].clear();
        input_length_[c][a] =
            kit::clamp_int(static_cast<int>(kInputAllpass[c][a] * scale), 1, kSmallSize - 1);
      }
    }
    side_bass_.reset();
    side_bass_.set_cutoff(kSideBassHz, sr);
    loop_bank_.reset();
    for (int n = 0; n < kLines; ++n) {
      line_[n].clear();
      damping_[n].reset();
      length_[n] = kLineSeconds[n] * sr;
      gain_[n] = 0.0f;
      amount_[n] = 0.0f;
      lfo_phase_[n] = static_cast<float>(n) / kLines;
      lfo_increment_[n] = kLfoHz[n] * kControlPeriod / sr;
      sweep_[n] = 0.0f;
      sweep_step_[n] = 0.0f;
    }
    flat_gain_ = 1.0f;
    flat_step_ = 0.0f;

    vowel_drift_.seed(0x243F6A88u);
    vowel_drift_.set_rate(kMotionHz, sr);
    spread_drift_.seed(0x85A308D3u);
    spread_drift_.set_rate(kMotionHz * 1.37f, sr);
    voice_drift_.seed(0x13198A2Eu);
    voice_drift_.set_rate(kMotionHz * 0.81f, sr);

    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    // Size and Pre-delay move read points: glide them slowly enough to bend
    // rather than zip.
    size_.set_time(0.15f, sr);
    predelay_time_.set_time(0.06f, sr);
    // Stepped on the control clock.
    decay_.set_time(0.02f, control_rate);
    level_.set_time(0.02f, control_rate);
    modulation_.set_time(0.05f, control_rate);
    resonance_.set_time(0.03f, control_rate);
    motion_.set_time(0.1f, control_rate);
    low_cut_hz_.set_time(0.03f, control_rate);
    high_cut_hz_.set_time(0.03f, control_rate);
    // The mouth takes about a tenth of a second to get to a new vowel.
    vowel_.set_time(kVowelGlideSeconds, control_rate);
    vowel_glide_.set_time(kVowelGlideSeconds, control_rate);
    voice_.set_time(kVowelGlideSeconds, control_rate);
    voice_glide_.set_time(kVowelGlideSeconds, control_rate);
    clock_.reset(kControlPeriod);
    // The longest silent gap: the pre-delay plus the longest line.
    idle_.reset(sr, kParamMax[kPreDelay] * 0.001f + 0.6f);
    started_ = false;
    last_decay_ = last_size_ = last_resonance_ = -1.0f;
    for (float& v : last_tuning_) v = -1.0e9f;
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace vowel_reverb;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const float max_line = kit::DelayLine<kLineSize>::max_delay() - 2.0f;
    const float max_predelay = kit::DelayLine<kPredelaySize>::max_delay() - 2.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) {
        control();
        started_ = true;
      }

      // Pre-delay and input diffusion, per side.
      const float predelay = kit::min(1.0f + glide(predelay_time_), max_predelay);
      float feed[2];
      for (int c = 0; c < 2; ++c) {
        predelay_[c].write(in[c]);
        float x = predelay_[c].read_linear(predelay);
        x = input_allpass_[c][0].process(x, input_length_[c][0], 0.75f);
        x = input_allpass_[c][1].process(x, input_length_[c][1], 0.75f);
        x = input_allpass_[c][2].process(x, input_length_[c][2], 0.625f);
        x = input_allpass_[c][3].process(x, input_length_[c][3], 0.625f);
        feed[c] = 0.5f * x;
      }

      // The room.
      const float size = glide(size_);
      float v[kLines];
      for (int n = 0; n < kLines; ++n) {
        sweep_[n] += sweep_step_[n];
        v[n] = line_[n].read_hermite(kit::clamp(length_[n] * size + sweep_[n], 4.0f, max_line));
      }
      float wet[2] = {0.5f * (v[0] - v[2] + v[4] - v[6]) + kEarlyGain * feed[0],
                      0.5f * (v[1] - v[3] + v[5] - v[7]) + kEarlyGain * feed[1]};

      hadamard8(v);
      loop_bank_.tick();
      for (int n = 0; n < kLines; ++n) {
        float x = v[n];
        // The vowel inside the loop: unity at the formants, 1 - amount in
        // the valleys between them.
        x += amount_[n] * (loop_bank_.process(n, x) - x);
        x = damping_[n].lowpass(x * gain_[n]) + ((n & 2) ? -feed[n & 1] : feed[n & 1]);
        // Linear to ±2, landing on ±4: out of the way of any normal level.
        line_[n].write(flush_denormal(4.0f * kit::soft_clip(0.25f * x)));
      }

      // The vowel on the way out, a little different on each side.
      flat_gain_ += flat_step_;
      for (int c = 0; c < 2; ++c) {
        const float x = low_cut_[c].highpass(wet[c]);
        vowel_gain_[c] += vowel_step_[c];
        wet[c] = high_cut_[c].lowpass(flat_gain_ * x + vowel_gain_[c] * bank_[c].process(x));
      }
      const float width = glide(width_);
      const float mid = 0.5f * (wet[0] + wet[1]);
      // The side signal has no bass: the low end of the tail stays in the
      // middle whatever the Width.
      const float side = side_bass_.highpass(0.5f * (wet[0] - wet[1])) * width;
      const float level = glide(wet_) * level_.value;
      const float dry = glide(dry_);
      // Exact up to ±1, landing on ±2.
      out_left_[i] = in[0] * dry + 2.0f * kit::soft_clip(0.5f * (mid + side) * level);
      out_right_[i] = in[1] * dry + 2.0f * kit::soft_clip(0.5f * (mid - side) * level);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kLines = 8;
  static constexpr int kLineSize = 32768;      // 210 ms at 96 kHz plus modulation
  static constexpr int kPredelaySize = 32768;  // 200 ms at 96 kHz
  static constexpr int kSmallSize = 2048;
  static constexpr int kInputStages = 4;
  static constexpr int kControlPeriod = 32;

  // Line lengths at a Size scale of 1, spread geometrically with no simple
  // ratios between them; Size scales them from 0.4 to 1.6 times.
  static constexpr float kLineSeconds[kLines] = {0.059313f, 0.066729f, 0.074354f, 0.083896f,
                                                 0.093104f, 0.104729f, 0.116938f, 0.131313f};
  static constexpr float kMinScale = 0.4f;
  static constexpr float kMaxScale = 1.6f;
  // Each line drifts at its own rate; the peak read-point excursion at
  // Modulation 1 is about ±12 cents on the fastest line.
  static constexpr float kLfoHz[kLines] = {0.31f, 0.43f, 0.23f, 0.57f, 0.37f, 0.67f, 0.29f, 0.49f};
  static constexpr float kModulationSeconds = 0.0016f;
  // Dattorro's input diffuser lengths at 48 kHz; the right side is offset
  // so a centred source still spreads.
  static constexpr float kInputAllpass[2][kInputStages] = {{229.0f, 173.0f, 611.0f, 447.0f},
                                                           {241.0f, 181.0f, 631.0f, 463.0f}};
  static constexpr float kEarlyGain = 1.0f;
  static constexpr float kWetGain = 1.7f;
  static constexpr float kSideBassHz = 140.0f;

  // TUNING-CONSTANTS
  static constexpr float kValleyDepth = 3.0f;
  static constexpr float kValleySlowest = 0.2f;
  static constexpr float kOutputWiden = 1.3f;
  static constexpr float kPinkReference = 1.0f;
  static constexpr float kMaxMakeup = 2.8f;
  static constexpr float kMotionVowel = 1.0f;
  static constexpr float kMotionSpread = 0.5f;
  static constexpr float kMotionVoice = 0.08f;
  static constexpr float kMotionHz = 0.083f;
  static constexpr float kVowelGlideSeconds = 0.03f;

  // kit::hadamard<8> written out: the loop form costs six times as much
  // without unrolling, and this runs every sample.
  static void hadamard8(float* v) {
    const float a0 = v[0] + v[1], a1 = v[0] - v[1], a2 = v[2] + v[3], a3 = v[2] - v[3];
    const float a4 = v[4] + v[5], a5 = v[4] - v[5], a6 = v[6] + v[7], a7 = v[6] - v[7];
    const float b0 = a0 + a2, b1 = a1 + a3, b2 = a0 - a2, b3 = a1 - a3;
    const float b4 = a4 + a6, b5 = a5 + a7, b6 = a4 - a6, b7 = a5 - a7;
    constexpr float scale = 0.35355339059f;
    v[0] = (b0 + b4) * scale;
    v[1] = (b1 + b5) * scale;
    v[2] = (b2 + b6) * scale;
    v[3] = (b3 + b7) * scale;
    v[4] = (b0 - b4) * scale;
    v[5] = (b1 - b5) * scale;
    v[6] = (b2 - b6) * scale;
    v[7] = (b3 - b7) * scale;
  }

  // A smoother that has arrived costs one compare.
  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  // Keep a wandering vowel on the A..U line by turning it back at the ends.
  static float fold(float vowel) {
    if (vowel < 0.0f) vowel = -vowel;
    if (vowel > 4.0f) vowel = 8.0f - vowel;
    return kit::clamp(vowel, 0.0f, 4.0f);
  }

  // Every 32 samples: loop gains, line drift, the cut filters, and where the
  // vowel is now.
  void control() {
    using namespace vowel_reverb;
    const float sr = sample_rate();
    const float decay = decay_.next();
    const float size = size_.value;
    const float resonance = resonance_.next();
    if (decay != last_decay_ || size != last_size_ || resonance != last_resonance_) {
      last_decay_ = decay;
      last_size_ = size;
      last_resonance_ = resonance;
      // ln(0.001) per second of delay: a line's gain is exp(rate · seconds).
      const float rate = -6.9077553f / decay;
      // How much faster than the formants the valleys between them decay,
      // as a rate (1/s): at Resonance 1 they last a quarter as long, and
      // never more than five seconds.
      const float extra = -6.9077553f * resonance * resonance *
                          kit::max(kValleyDepth / decay, kValleySlowest - 1.0f / decay);
      for (int n = 0; n < kLines; ++n) {
        const float seconds = kLineSeconds[n] * size;
        gain_[n] = std::exp(rate * seconds);
        amount_[n] = 1.0f - std::exp(extra * seconds);
      }
      // A long decay stores more energy for the same input; take half of
      // that back (in dB) so the Decay knob is not also a volume knob.
      const float middle = gain_[kLines / 2] * gain_[kLines / 2];
      level_.set(kWetGain * std::sqrt(std::sqrt(kit::max(1.0f - middle, 1.0e-4f))), started_);
    }
    level_.next();

    // Each line's read point heads for where its LFO will be one period on.
    const float depth = modulation_.next() * kModulationSeconds * sr;
    for (int n = 0; n < kLines; ++n) {
      lfo_phase_[n] += lfo_increment_[n];
      if (lfo_phase_[n] >= 1.0f) lfo_phase_[n] -= 1.0f;
      const float target = depth * kit::SineTable::lookup(lfo_phase_[n]);
      sweep_step_[n] = (target - sweep_[n]) * (1.0f / kControlPeriod);
    }

    if (!low_cut_hz_.settled() || !high_cut_hz_.settled() || !started_) {
      const float low = low_cut_hz_.next();
      const float high = high_cut_hz_.next();
      damping_[0].set_cutoff(high, sr);
      for (int n = 1; n < kLines; ++n) damping_[n].a = damping_[0].a;
      for (int c = 0; c < 2; ++c) {
        low_cut_[c].set(low, kit::kSqrtHalf, sr);
        high_cut_[c].a = damping_[0].a;
      }
    }

    // The vowel: the knob through an S-shaped glide, plus Motion's drift. The
    // room drifts as one; the two sides of the output lean away from each
    // other and are sung by slightly different sizes of voice.
    if (started_) {
      vowel_glide_.set_target(vowel_.next());
      voice_glide_.set_target(voice_.next());
    } else {
      vowel_glide_.snap(vowel_.value);
      voice_glide_.snap(voice_.value);
    }
    const float vowel = vowel_glide_.next();
    const float voice = voice_glide_.next();
    const float motion = motion_.next();
    const float wander = motion * kMotionVowel * vowel_drift_.next(kControlPeriod);
    const float lean = motion * kMotionVowel * kMotionSpread * spread_drift_.next(kControlPeriod);
    const float build = motion * kMotionVoice * voice_drift_.next(kControlPeriod);
    const float tuning[5] = {vowel + wander, lean, voice, build, 0.0f};
    bool moved = false;
    for (int k = 0; k < 4; ++k) {
      if (tuning[k] != last_tuning_[k]) moved = true;
      last_tuning_[k] = tuning[k];
    }
    if (moved) {
      vowel_dsp::Formants formants;
      vowel_dsp::formants_at(fold(vowel + wander), voice, &formants);
      loop_bank_.set(formants, sr, kControlPeriod);
      vowel_dsp::formants_at(fold(vowel + wander + lean), voice + build, &formants);
      bank_[0].set(formants, kOutputWiden, sr, kControlPeriod);
      vowel_dsp::formants_at(fold(vowel + wander - lean), voice - build, &formants);
      bank_[1].set(formants, kOutputWiden, sr, kControlPeriod);
    }

    // The output blend: flat at Resonance 0, the five formants alone at 1,
    // made up for what the formants take away.
    const float blend = resonance;
    const float flat = 1.0f - blend;
    const float ramp = started_ ? 1.0f / kControlPeriod : 1.0f;
    flat_step_ = started_ ? (flat - flat_gain_) * ramp : 0.0f;
    if (!started_) flat_gain_ = flat;
    for (int c = 0; c < 2; ++c) {
      const float makeup =
          kit::min(std::sqrt(kPinkReference / kit::max(bank_[c].pink_power(), 1.0e-6f)), kMaxMakeup);
      const float target = blend * makeup;
      vowel_step_[c] = started_ ? (target - vowel_gain_[c]) * ramp : 0.0f;
      if (!started_) vowel_gain_[c] = target;
    }
  }

  void apply(int id) {
    using namespace vowel_reverb;
    const float value = param(id);
    switch (id) {
      case kVowel:
        vowel_.set(value, primed());
        break;
      case kResonance:
        resonance_.set(value, primed());
        break;
      case kVoice:
        voice_.set(value, primed());
        break;
      case kMotion:
        motion_.set(value, primed());
        break;
      case kDecay:
        decay_.set(value, primed());
        break;
      case kSize:
        size_.set(kMinScale * std::pow(kMaxScale / kMinScale, value), primed());
        break;
      case kPreDelay:
        predelay_time_.set(value * 0.001f * sample_rate(), primed());
        break;
      case kModulation:
        modulation_.set(value, primed());
        break;
      case kLowCut:
        low_cut_hz_.set(value, primed());
        break;
      case kHighCut:
        high_cut_hz_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        dry_.set(dry, primed());
        wet_.set(wet, primed());
        break;
      }
      default:
        break;
    }
  }

  kit::DelayLine<kPredelaySize> predelay_[2];
  kit::AllpassDelay<kSmallSize> input_allpass_[2][kInputStages];
  int input_length_[2][kInputStages] = {};
  kit::DelayLine<kLineSize> line_[kLines];
  kit::OnePole damping_[kLines];
  vowel_dsp::LoopBank<kLines> loop_bank_;
  float length_[kLines] = {};
  float gain_[kLines] = {};
  float amount_[kLines] = {};
  float lfo_phase_[kLines] = {};
  float lfo_increment_[kLines] = {};
  float sweep_[kLines] = {};
  float sweep_step_[kLines] = {};

  vowel_dsp::OutputBank bank_[2];
  float flat_gain_ = 1.0f, flat_step_ = 0.0f;
  float vowel_gain_[2] = {}, vowel_step_[2] = {};
  kit::Svf low_cut_[2];
  kit::OnePole high_cut_[2];
  kit::OnePole side_bass_;
  kit::Drift vowel_drift_, spread_drift_, voice_drift_;

  kit::Smoother dry_, wet_, width_, size_, predelay_time_;
  kit::Smoother decay_, level_, modulation_, resonance_, motion_;
  kit::Smoother vowel_, vowel_glide_, voice_, voice_glide_, low_cut_hz_, high_cut_hz_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float last_decay_ = -1.0f, last_size_ = -1.0f, last_resonance_ = -1.0f;
  float last_tuning_[5] = {};
  bool started_ = false;  // the first control tick snaps what later ones glide
};

}  // namespace livemix
