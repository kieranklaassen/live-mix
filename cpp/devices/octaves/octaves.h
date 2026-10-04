#pragma once

// Octaves: a polyphonic octave generator. Chords in; the same chords one and
// two octaves down and up, mixed like drawbars beside the untouched input.
//
//   in ──┬───────────────────────────────────────────────────────── × Dry ──┐
//        │                                                                  ▼
//        └► mono ► ÷2 ► channel bank ► phase ×½ ×¼ ×2 ×4 ► levels, ► ×2 ► low-pass ►(+)► out
//                       (OctaveBank.h)                     spread
//
// The method is filter-bank phase scaling, after the approach of Etienne
// Thuillier, "Real-Time Polyphonic Octave Doubling for the Guitar": the
// input is split into narrow complex band-pass channels, each
// giving an analytic signal a·e^(jφ), and each channel is played back with
// its phase multiplied and its amplitude kept. A channel that holds one
// partial gives an exact octave of it at once: there is no window to wait
// for and no splice to warble, and a chord is transposed note by note.
// OctaveBank.h says what this device adds to that method.
//
// - The bank runs at half the sample rate (a quarter from 88.2 kHz up): its
//   channels end at 5.5 kHz and the highest voice it makes stays under
//   10 kHz. The dry signal never passes through any of it.
// - Latency: the way down to the bank's rate and back is 0.46 ms at 48 kHz,
//   and that is all the fixed delay there is. What is heard as the start of
//   a voice is the rise of its channel: a few milliseconds, longer for low
//   notes (the harness measures it).
// - There is no Mix: Dry is the balance. With the four voices at 0 the
//   output is the input, bit for bit.
// - Spread sends the channels of the two upper voices left and right in
//   alternate runs of three (opposite ways for the two voices), so every
//   note sits somewhere of its own; the sub octaves stay in the centre and
//   the mono sum never changes.
// - The low-pass and a soft ceiling (linear to ±1, never past ±2) act on the
//   generated voices only.

#include "../../kit/kit.h"
#include "Halfband.h"
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
    down_.init(kDownBeta);
    outer_down_.init(kOuterBeta);
    for (int c = 0; c < 2; ++c) {
      up_[c].init(kUpBeta);
      outer_up_[c].init(kOuterBeta);
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
    filter_set_ = false;
    // The longest a channel rings after its input stops is well under this.
    idle_.reset(sr, 0.5f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json, for a display to draw: the
  // frequency of the loudest partial the bank holds, in Hz, read from its
  // loudest channel and the louder of that channel's two neighbours (a note
  // in tune lies between two channels). 0 while it holds nothing or sleeps.
  float meter(int index) const {
    if (index != 0 || idle_.asleep()) return 0.0f;
    int top = 0;
    float peak = bank_.probe(0).power;
    for (int k = 1; k < bank_.bands(); ++k) {
      const float power = bank_.probe(k).power;
      if (power > peak) {
        peak = power;
        top = k;
      }
    }
    if (!(peak > kHeard)) return 0.0f;
    const float below = top > 0 ? bank_.probe(top - 1).power : 0.0f;
    const float above = top + 1 < bank_.bands() ? bank_.probe(top + 1).power : 0.0f;
    const int beside = above > below ? top + 1 : top - 1;
    const float share = (above > below ? above : below) / (peak + (above > below ? above : below));
    if (beside < 0 || !(share > 0.0f)) return bank_.centre(top);
    return bank_.centre(top) * std::pow(bank_.centre(beside) / bank_.centre(top), share);
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool slept = idle_.asleep();
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    if (slept) bank_.rest();
    for (int i = 0; i < frames; ++i) {
      float left, right;
      take_input(i, &left, &right);
      // A sample that is not a number, or absurdly large, is not sound: the
      // dry path holds it to a bound and the bank hears silence for it.
      float mono = 0.5f * (left + right);
      if (!(left > -kSane && left < kSane) || !(right > -kSane && right < kSane)) {
        left = sane(left);
        right = sane(right);
        mono = 0.0f;
      }

      // The bank runs when it has a full set of input samples; the first of
      // what it makes goes out with this sample, the rest with the next ones.
      pending_[phase_] = mono;
      if (++phase_ >= factor_) {
        phase_ = 0;
        run_bank();
      }
      float wet_left = ready_[0][phase_];
      float wet_right = ready_[1][phase_];

      // (the coefficients only while Filter or Resonance are on their way)
      if (filter_clock_.tick() && !filter_set_) {
        const float q = 0.7071f * std::pow(kMaxQ / 0.7071f, resonance_.value);
        const float hz = std::exp(cutoff_.value);
        filter_[0].set(hz, q, sample_rate());
        filter_[1].set(hz, q, sample_rate());
        filter_set_ = cutoff_.settled() && resonance_.settled();
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
  static constexpr int kChannels = 63;
  // The way down to the bank's rate and back (Halfband.h): 15 taps down and
  // 31 up, 0.46 ms together at 48 kHz, better than 47 dB where it matters
  // (the bank's channels end at 5.5 kHz, its voices at 10 kHz). From
  // 88.2 kHz up there is one more, easier, pair outside these.
  static constexpr double kDownBeta = 6.0;
  static constexpr double kUpBeta = 4.5;
  static constexpr double kOuterBeta = 4.5;
  static constexpr float kLowHz = 40.0f;
  static constexpr float kHighHz = 5500.0f;
  static constexpr float kMaxQ = 9.0f;
  static constexpr float kCeiling = 2.0f;
  // How far Spread moves a channel off centre at its top.
  static constexpr float kMaxSpread = 0.8f;
  // The channel power under which meter() reports no partial (-80 dB).
  static constexpr float kHeard = 1.0e-8f;
  // The largest input sample taken as sound (+36 dB over full scale).
  static constexpr float kSane = 64.0f;
  static float sane(float x) {
    if (!(x == x)) return 0.0f;
    return x > kSane ? kSane : (x < -kSane ? -kSane : x);
  }
  enum Voice : int { kVoiceSub2 = 0, kVoiceSub1, kVoiceUp1, kVoiceUp2, kNumVoices };

  // One bank sample from the last `factor_` input samples, and the
  // `factor_` output samples it becomes.
  void run_bank() {
    float x = pending_[0];
    if (factor_ == 2) {
      x = down_.down(pending_[0], pending_[1]);
    } else if (factor_ == 4) {
      const float a = outer_down_.down(pending_[0], pending_[1]);
      const float b = outer_down_.down(pending_[2], pending_[3]);
      x = down_.down(a, b);
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

    // Alternate runs of channels lean left and right; the two sides sum to
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
        up_[c].up(wet[c], &ready_[c][0], &ready_[c][1]);
      } else {
        float a, b;
        up_[c].up(wet[c], &a, &b);
        outer_up_[c].up(a, &ready_[c][0], &ready_[c][1]);
        outer_up_[c].up(b, &ready_[c][2], &ready_[c][3]);
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
        filter_set_ = false;
        break;
      case kResonance:
        resonance_.set(value, primed());
        filter_set_ = false;
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
  octaves::HalfbandDown<4> down_;
  octaves::HalfbandUp<8> up_[2];
  octaves::HalfbandDown<3> outer_down_;
  octaves::HalfbandUp<3> outer_up_[2];
  int factor_ = 2;
  int phase_ = 0;
  float pending_[4] = {};
  float ready_[2][4] = {};
  kit::Smoother level_[kNumVoices];
  kit::Smoother spread_, dry_, cutoff_, resonance_;
  kit::Svf filter_[2];
  kit::ControlClock filter_clock_;
  bool filter_set_ = false;
  kit::IdleGate idle_;
};

}  // namespace livemix
