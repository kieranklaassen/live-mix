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
// - The room is an eight-line feedback delay network (Jot's form: lossless
//   Hadamard mixing, one decay gain per line) with four input allpasses, one
//   allpass in every loop so each pass multiplies the echoes, and every
//   line read at a slowly drifting point (Hermite), which is the ensemble.
//   What is heard is tapped part of the way down the lines, so the room
//   answers before its first full pass.
// - The vowel is the Csound manual's formant table (vowels.h): five
//   formants, for a, e, i, o, u and for bass, tenor, alto and soprano,
//   interpolated along Vowel and across Voice.
// - It acts twice. On the way out, five band-passes in parallel at the
//   table's frequencies and widths colour the whole wet signal at once;
//   Resonance blends from the flat signal to them. In the loop, a broad
//   version of the first three formants takes a little from everything
//   that is not on a formant on every pass, so the valleys decay up to
//   four times faster than the formants: the vowel grows clearer the
//   longer the tail rings, and Decay stays the decay time of the first
//   formant. The loop filter's gain is at most 1 at every frequency (see
//   LoopBank), so no setting can make the room grow.
// - The makeup gain follows the vowel: narrow formants pass less, and the
//   level a played phrase comes out with stays within a few dB from A to U
//   and from Resonance 0 to 1.
// - Motion is three slow drifts: the vowel of the whole room wanders
//   towards its neighbours, the two sides of the output lean away from each
//   other, and they are sung by slightly different sizes of voice. At the
//   ends of the vowel line the wander turns back instead of stopping.
// - High Cut is a shelf in the loop (above it the room lasts a quarter as
//   long, whatever the Decay) and a 6 dB per octave low-pass on the output.
//   Low Cut is on the output only. The side signal carries no bass.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "vowels.h"

namespace livemix {

class VowelReverb : public kit::DeviceBase<vowel_reverb::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace vowel_reverb;
    kit::SineTable::init();
    vowel_dsp::LevelTable::init();
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
    side_bass_.set(kSideBassHz, kit::kSqrtHalf, sr);
    loop_bank_.reset();
    for (int n = 0; n < kLines; ++n) {
      line_[n].clear();
      damping_[n].reset();
      loop_delay_[n] = 0;
      for (int a = 0; a < kLoopStages; ++a) {
        loop_allpass_[n][a].clear();
        loop_length_[n][a] =
            kit::clamp_int(static_cast<int>(kLoopAllpassSeconds[n][a] * sr), 1, kSmallSize - 1);
        loop_delay_[n] += loop_length_[n][a];
      }
      length_[n] = kLineSeconds[n] * sr;
      gain_[n] = 0.0f;
      decay_gain_[n] = 0.0f;
      amount_[n] = 0.0f;
      damp_[n] = 0.0f;
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
    vowel_.set_time(kVowelGlideSeconds, control_rate);
    vowel_glide_.set_time(kVowelGlideSeconds, control_rate);
    voice_.set_time(kVowelGlideSeconds, control_rate);
    voice_glide_.set_time(kVowelGlideSeconds, control_rate);
    clock_.reset(kControlPeriod);
    // The longest silent gap: the pre-delay plus the longest line.
    idle_.reset(sr, kParamMax[kPreDelay] * 0.001f + 0.6f);
    started_ = false;
    tune_turn_ = false;
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
      float tap[kLines];
      for (int n = 0; n < kLines; ++n) {
        sweep_[n] += sweep_step_[n];
        const float delay = kit::clamp(length_[n] * size + sweep_[n], 4.0f, max_line);
        v[n] = line_[n].read_hermite(delay);
        // Half of what is heard is taken part of the way down a line, so
        // the room starts to answer well before its first full pass.
        tap[n] = (n & 2) ? v[n] : line_[n].read_linear(kit::max(delay * kTapPosition[n >> 1 | (n & 1)], 2.0f));
      }
      float wet[2] = {0.5f * (tap[0] - tap[2] + tap[4] - tap[6]) + kEarlyGain * feed[0],
                      0.5f * (tap[1] - tap[3] + tap[5] - tap[7]) + kEarlyGain * feed[1]};

      hadamard8(v);
      loop_bank_.tick();
      for (int n = 0; n < kLines; ++n) {
        float x = v[n];
        // The vowel inside the loop: unity at the formants, 1 - amount in
        // the valleys between them. (At Resonance 0 there is none.)
        x *= gain_[n];
        if (kVowelSlot[n] >= 0) {
          if (amount_[n] > 0.0f) x += amount_[n] * (loop_bank_.process(kVowelSlot[n], x) - x);
        } else {
          // Above High Cut the room loses a fixed share more per pass.
          x += damp_[n] * (damping_[n].lowpass(x) - x);
        }
        x += (n & 2) ? -feed[n & 1] : feed[n & 1];
        // Linear to ±2, landing on ±4: out of the way of any normal level.
        x = 4.0f * kit::soft_clip(0.25f * x);
        // An allpass in each loop: every pass multiplies the echoes.
        for (int a = 0; a < kLoopStages; ++a) {
          x = loop_allpass_[n][a].process(x, loop_length_[n][a], kLoopDiffusion);
        }
        line_[n].write(flush_denormal(x));
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
  // The vowel sits in every other pair of lines (0, 1, 4 and 5), twice as
  // deep, and the high damping in the other four: the Hadamard matrix
  // shares each line's loss with all the others on the next pass, so the
  // room decays as if every line carried both, for half the filters. Each
  // side of the output hears two lines of each kind.
  static constexpr int kVowelLines = 4;
  static constexpr int kVowelSlot[kLines] = {0, 1, -1, -1, 2, 3, -1, -1};
  // The vowel moves slowly: the banks are retuned every other control tick.
  static constexpr int kTunePeriod = 2 * kControlPeriod;

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
  // The left side hears the even lines and the right side the odd ones.
  // Lines 0, 1, 4 and 5 are tapped at this share of their length; the other
  // four are heard at their ends.
  static constexpr float kTapPosition[4] = {0.31f, 0.37f, 0.52f, 0.47f};
  // The allpass in each loop, in seconds (it does not scale with Size).
  static constexpr int kLoopStages = 1;
  static constexpr float kLoopAllpassSeconds[kLines][kLoopStages] = {
      {0.008938f}, {0.010354f}, {0.011896f}, {0.009729f}, {0.012729f}, {0.008354f}, {0.011313f}, {0.010938f}};
  static constexpr float kLoopDiffusion = 0.6f;
  static constexpr float kEarlyGain = 1.0f;
  static constexpr float kWetGain = 1.3f;
  static constexpr float kSideBassHz = 160.0f;

  // The valleys between the formants decay this many times the formants'
  // rate faster at Resonance 1 (so they last a quarter as long), and never
  // slower than 1 / kValleySlowest seconds; the highs do the same above
  // High Cut at every Resonance.
  static constexpr float kValleyDepth = 3.0f;
  static constexpr float kValleySlowest = 0.2f;
  static constexpr float kHighDamping = 3.0f;
  // Output formants: the table's widths times this (a section is wider
  // than one singer), and the makeup that sets the vowel's level against
  // the flat signal's, limited to 12 dB.
  static constexpr float kOutputWiden = 1.5f;
  static constexpr float kMakeupReference = 1.6f;
  static constexpr float kMaxMakeup = 4.0f;
  // Motion 1: the vowel wanders up to a whole vowel either way, the sides
  // lean half as far apart, and the voice changes by a quarter of a step
  // from tenor to alto. The drifts turn over about every twelve seconds.
  static constexpr float kMotionVowel = 1.0f;
  static constexpr float kMotionSpread = 0.5f;
  static constexpr float kMotionVoice = 0.08f;
  static constexpr float kMotionHz = 0.083f;
  // The mouth takes about a tenth of a second to get to a new vowel (two
  // of these in series: an S-shaped glide).
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
    const float tuning[4] = {vowel + wander, lean, voice, build};
    tune_turn_ = !tune_turn_;
    bool retuned = false;
    if (tune_turn_ || !started_) {
      for (int k = 0; k < 4; ++k) {
        if (tuning[k] != last_tuning_[k]) retuned = true;
        last_tuning_[k] = tuning[k];
      }
    }
    if (retuned) {
      vowel_dsp::Formants formants;
      vowel_dsp::formants_at(fold(vowel + wander), voice, &formants);
      loop_bank_.set(formants, sr, kTunePeriod);
      vowel_dsp::formants_at(fold(vowel + wander + lean), voice + build, &formants);
      bank_[0].set(formants, kOutputWiden, sr, kTunePeriod);
      vowel_dsp::formants_at(fold(vowel + wander - lean), voice - build, &formants);
      bank_[1].set(formants, kOutputWiden, sr, kTunePeriod);
    }

    const bool changed = decay != last_decay_ || size != last_size_ || resonance != last_resonance_;
    if (changed) {
      last_decay_ = decay;
      last_size_ = size;
      last_resonance_ = resonance;
      // ln(0.001) per second of delay: a line's gain is exp(rate · seconds).
      const float rate = -6.9077553f / decay;
      // How much faster than the formants the valleys between them decay,
      // as a rate (1/s): at Resonance 1 they last a quarter as long, and
      // never more than five seconds. Half the lines carry the vowel, so
      // each of those takes twice its share.
      const float extra = -6.9077553f * resonance * resonance * (static_cast<float>(kLines) / kVowelLines) *
                          kit::max(kValleyDepth / decay, kValleySlowest - 1.0f / decay);
      const float inverse_rate = 1.0f / sr;
      for (int n = 0; n < kLines; ++n) {
        // A pass takes the line and its allpass (an allpass delays
        // energy by its length on average).
        const float seconds = kLineSeconds[n] * size +
                              static_cast<float>(loop_delay_[n]) * inverse_rate;
        decay_gain_[n] = std::exp(rate * seconds);
        amount_[n] = kVowelSlot[n] >= 0 ? 1.0f - std::exp(extra * seconds) : 0.0f;
        // Highs last a quarter as long as the rest, whatever the Decay: a
        // shelf, so the upper formants are not worn away in a long tail.
        // The four lines without the vowel carry it, twice as deep.
        damp_[n] = kVowelSlot[n] >= 0 ? 0.0f : 1.0f - std::exp(2.0f * rate * kHighDamping * seconds);
      }
      // A long decay stores more energy for the same input; take half of
      // that back (in dB) so the Decay knob is not also a volume knob.
      const float middle = decay_gain_[kLines / 2] * decay_gain_[kLines / 2];
      level_.set(kWetGain * std::sqrt(std::sqrt(kit::max(1.0f - middle, 1.0e-4f))), started_);
    }
    if (changed || retuned) {
      for (int n = 0; n < kLines; ++n) {
        // The vowel takes a little even from the frequency it favours most
        // (the bank stops just under 1, and its phase there is not quite
        // zero). Give that back, so the slowest-decaying frequency, on the
        // first formant, loses only the decay gain. The loop's largest gain
        // is then the decay gain itself; the bound keeps it under 1 even if
        // the search for that frequency were a little off.
        const float bound = 1.0f - amount_[n] * (1.0f - vowel_dsp::LoopBank<kVowelLines>::kCeiling);
        gain_[n] = amount_[n] > 0.0f
                       ? kit::min(decay_gain_[n] / loop_bank_.peak_gain(amount_[n]), 0.9999f / bound)
                       : decay_gain_[n];
      }
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

    // The output blend: flat at Resonance 0, the five formants alone at 1,
    // made up for what the formants take away.
    const float blend = resonance;
    const float flat = 1.0f - blend;
    const float ramp = started_ ? 1.0f / kControlPeriod : 1.0f;
    flat_step_ = started_ ? (flat - flat_gain_) * ramp : 0.0f;
    if (!started_) flat_gain_ = flat;
    for (int c = 0; c < 2; ++c) {
      const float makeup =
          kit::min(std::sqrt(kMakeupReference / kit::max(bank_[c].pink_power(), 1.0e-6f)), kMaxMakeup);
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
  kit::AllpassDelay<kSmallSize> loop_allpass_[kLines][kLoopStages];
  int loop_length_[kLines][kLoopStages] = {};
  int loop_delay_[kLines] = {};
  vowel_dsp::LoopBank<kVowelLines> loop_bank_;
  float length_[kLines] = {};
  float gain_[kLines] = {};
  float decay_gain_[kLines] = {};
  float amount_[kLines] = {};
  float damp_[kLines] = {};
  float lfo_phase_[kLines] = {};
  float lfo_increment_[kLines] = {};
  float sweep_[kLines] = {};
  float sweep_step_[kLines] = {};

  vowel_dsp::OutputBank bank_[2];
  float flat_gain_ = 1.0f, flat_step_ = 0.0f;
  float vowel_gain_[2] = {}, vowel_step_[2] = {};
  kit::Svf low_cut_[2];
  kit::OnePole high_cut_[2];
  kit::Svf side_bass_;
  kit::Drift vowel_drift_, spread_drift_, voice_drift_;

  kit::Smoother dry_, wet_, width_, size_, predelay_time_;
  kit::Smoother decay_, level_, modulation_, resonance_, motion_;
  kit::Smoother vowel_, vowel_glide_, voice_, voice_glide_, low_cut_hz_, high_cut_hz_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float last_decay_ = -1.0f, last_size_ = -1.0f, last_resonance_ = -1.0f;
  float last_tuning_[4] = {};
  bool tune_turn_ = false;
  bool started_ = false;  // the first control tick snaps what later ones glide
};

}  // namespace livemix
