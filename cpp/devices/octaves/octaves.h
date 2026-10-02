#pragma once

// Octaves: a polyphonic octave generator. Chords in; the same chords one and
// two octaves down and up, mixed like drawbars beside the untouched input.
//
//   in ──┬───────────────────────────────────────────────────────── × Dry ──┐
//        │                                                                  ▼
//        └► mono ► ÷2 ► channel bank ► phase ×½ ×¼ ×2 ×4 ► levels, ► ×2 ► low-pass ►(+)► out
//                       (OctaveBank.h)                     spread
//
// The method is the filter-bank phase scaling of Etienne Thuillier,
// "Real-Time Polyphonic Octave Doubling for the Guitar" (Aalto University,
// 2016): the input is split into narrow complex band-pass channels, each
// giving an analytic signal a·e^(jφ), and each channel is played back with
// its phase multiplied and its amplitude kept. A channel that holds one
// partial gives an exact octave of it at once: there is no window to wait
// for and no splice to warble, and a chord is transposed note by note.
// OctaveBank.h says what this device adds to that method.
//
// - The bank runs at half the sample rate (a quarter from 88.2 kHz up): its
//   channels end at 5.5 kHz and the highest voice it makes stays under
//   10 kHz. The dry signal never passes through any of it.
// - There is no Mix: Dry is the balance. With the four voices at 0 the
//   output is the input, bit for bit.
// - Spread sends alternate channels of the two upper voices left and right
//   (opposite ways for the two voices), so every note sits somewhere of its
//   own; the sub octaves stay in the centre and the mono sum never changes.
// - The low-pass and a soft ceiling (linear to ±1, never past ±2) act on the
//   generated voices only.

#include "../../kit/kit.h"
#include "OctaveBank.h"
#include "params.gen.h"

namespace livemix {

class Octaves : public kit::DeviceBase<octaves::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace octaves;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    factor_ = sr >= 60000.0f ? 4 : (sr >= 30000.0f ? 2 : 1);
    const float inner = sr / static_cast<float>(factor_);
    bank_.init(inner, kLowHz, kHighHz, kChannels);
    for (int stage = 0; stage < 2; ++stage) {
      down_[stage].init();
      up_[stage][0].init();
      up_[stage][1].init();
    }
    phase_ = 0;
    for (int i = 0; i < 4; ++i) {
      pending_[i] = 0.0f;
      ready_[0][i] = 0.0f;
      ready_[1][i] = 0.0f;
    }
    for (kit::Smoother& level : level_) level.set_time(kSmoothingSeconds, inner);
    spread_.set_time(kSmoothingSeconds, inner);
    dry_.set_time(kSmoothingSeconds, sr);
    cutoff_.set_time(kSmoothingSeconds, sr);
    resonance_.set_time(kSmoothingSeconds, sr);
    filter_[0].reset();
    filter_[1].reset();
    filter_clock_.reset(16);
    // The longest a channel rings after its input stops is well under this.
    idle_.reset(sr, 0.5f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float left, right;
      take_input(i, &left, &right);
      float mono = 0.5f * (left + right);
      if (!(mono > -64.0f && mono < 64.0f)) mono = 0.0f;

      // The voices made on the last pass of the bank, at this sample's place.
      float wet_left = ready_[0][phase_];
      float wet_right = ready_[1][phase_];
      pending_[phase_] = mono;
      if (++phase_ >= factor_) {
        phase_ = 0;
        run_bank();
      }

      if (filter_clock_.tick()) {
        const float q = 0.7071f * std::pow(kMaxQ / 0.7071f, resonance_.value);
        filter_[0].set(std::exp(cutoff_.value), q, sample_rate());
        filter_[1].set(std::exp(cutoff_.value), q, sample_rate());
      }
      cutoff_.next();
      resonance_.next();
      wet_left = kCeiling * kit::soft_clip(filter_[0].lowpass(wet_left) * (1.0f / kCeiling));
      wet_right = kCeiling * kit::soft_clip(filter_[1].lowpass(wet_right) * (1.0f / kCeiling));

      const float dry = dry_.next();
      out_left_[i] = left * dry + wet_left;
      out_right_[i] = right * dry + wet_right;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kChannels = 55;
  static constexpr float kLowHz = 40.0f;
  static constexpr float kHighHz = 5500.0f;
  static constexpr float kMaxQ = 9.0f;
  static constexpr float kCeiling = 2.0f;
  // How far Spread moves a channel off centre at its top.
  static constexpr float kMaxSpread = 0.8f;
  enum Voice : int { kVoiceSub2 = 0, kVoiceSub1, kVoiceUp1, kVoiceUp2, kNumVoices };

  // One bank sample from the last `factor_` input samples, and the
  // `factor_` output samples it becomes.
  void run_bank() {
    float x = pending_[0];
    if (factor_ == 2) {
      x = down_[0].down(pending_[0], pending_[1]);
    } else if (factor_ == 4) {
      const float a = down_[0].down(pending_[0], pending_[1]);
      const float b = down_[0].down(pending_[2], pending_[3]);
      x = down_[1].down(a, b);
    }

    float gain[kNumVoices];
    octaves::OctaveBank::Want want;
    for (int v = 0; v < kNumVoices; ++v) gain[v] = level_[v].next();
    want.sub2 = gain[kVoiceSub2] != 0.0f || level_[kVoiceSub2].target != 0.0f;
    want.sub1 = gain[kVoiceSub1] != 0.0f || level_[kVoiceSub1].target != 0.0f;
    want.up1 = gain[kVoiceUp1] != 0.0f || level_[kVoiceUp1].target != 0.0f;
    want.up2 = gain[kVoiceUp2] != 0.0f || level_[kVoiceUp2].target != 0.0f;
    octaves::OctaveBank::Frame frame;
    bank_.process(x, want, &frame);

    // Alternate channels lean left and right; the two sides always sum to
    // the whole voice.
    const float lean = spread_.next() * kMaxSpread;
    const float near = 1.0f + lean, far = 1.0f - lean;
    const float centre = gain[kVoiceSub2] * frame.sub2 + gain[kVoiceSub1] * frame.sub1;
    const float wet[2] = {
        centre + gain[kVoiceUp1] * (near * frame.up1[0] + far * frame.up1[1]) +
            gain[kVoiceUp2] * (near * frame.up2[0] + far * frame.up2[1]),
        centre + gain[kVoiceUp1] * (far * frame.up1[0] + near * frame.up1[1]) +
            gain[kVoiceUp2] * (far * frame.up2[0] + near * frame.up2[1]),
    };

    for (int c = 0; c < 2; ++c) {
      if (factor_ == 1) {
        ready_[c][0] = wet[c];
      } else if (factor_ == 2) {
        up_[0][c].up(wet[c], &ready_[c][0], &ready_[c][1]);
      } else {
        float a, b;
        up_[1][c].up(wet[c], &a, &b);
        up_[0][c].up(a, &ready_[c][0], &ready_[c][1]);
        up_[0][c].up(b, &ready_[c][2], &ready_[c][3]);
      }
    }
  }

  void apply(int id) {
    using namespace octaves;
    const float value = param(id);
    switch (id) {
      case kSub2:
        level_[kVoiceSub2].set(value, primed());
        break;
      case kSub1:
        level_[kVoiceSub1].set(value, primed());
        break;
      case kUp1:
        level_[kVoiceUp1].set(value, primed());
        break;
      case kUp2:
        level_[kVoiceUp2].set(value, primed());
        break;
      case kDry:
        dry_.set(value, primed());
        break;
      case kAttack:
        bank_.set_attack(value);
        break;
      case kFilter:
        cutoff_.set(std::log(value), primed());
        break;
      case kResonance:
        resonance_.set(value, primed());
        break;
      case kDetune:
        bank_.set_detune(value);
        break;
      case kSpread:
        spread_.set(value, primed());
        break;
      default:
        break;
    }
  }

  octaves::OctaveBank bank_;
  kit::Halfband2x down_[2];
  kit::Halfband2x up_[2][2];
  int factor_ = 2;
  int phase_ = 0;
  float pending_[4] = {};
  float ready_[2][4] = {};
  kit::Smoother level_[kNumVoices];
  kit::Smoother spread_, dry_, cutoff_, resonance_;
  kit::Svf filter_[2];
  kit::ControlClock filter_clock_;
  kit::IdleGate idle_;
};

}  // namespace livemix
