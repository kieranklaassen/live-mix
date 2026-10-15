#pragma once

// Ear Shift: a band of any sound is moved up by half of Beat in the left ear
// and down by half of Beat in the right, so the two ears are Beat hertz apart
// there and the sound beats between them.
//
//                 ┌─ low ──┐
//   in ─ guard ─ split     (+)──────────► pair ──► I ───────────────────┐
//                 ├─ high ─┘                                            (+)─► out
//                 └─ band ──────────────► pair ─┬► I ─× cos θ ─────┐    │
//                                               └► Q ─× sin θ ─× Ears ─(±)
//
//   left  = I(rest) + I(band)·cos θ + Ears · Q(band)·sin θ      θ = π · Beat · t
//   right = I(rest) + I(band)·cos θ − Ears · Q(band)·sin θ
//
// - One path a channel. The split is kit::ThreeBand at Low and High; the pair
//   is kit::Hilbert, whose quadrature output leads its in-phase one, so
//   I·cos θ + Q·sin θ is the band moved up by θ's rate and I·cos θ − Q·sin θ
//   the band moved down. The left ear takes the plus: it is the higher one,
//   as on every device of the family (the harness reads 443 Hz on the left
//   and 437 Hz on the right for 440 Hz in at Beat 6).
// - That is the family's Ears law written out. With up and down the two
//   shifted bands, left = same·up + other·down and right = other·up +
//   same·down with kit::ear_gains(Ears), which is the line above: the mid is
//   I·cos θ at every setting and the side is Ears · Q·sin θ. At Ears 0 both
//   sides carry I·cos θ, a pulse at Beat that is the same in both ears; the
//   mono fold of any setting is that same pulse.
// - The in-phase output of the pair is an all-pass of its input, not its
//   input. So what does not go through the shifter (the low and the high
//   parts of the split) goes through a second pair and its in-phase output is
//   taken: the three parts then meet turned by the same phase, and the joins
//   do not notch. There is no dry path and no Mix: the true input mixed back
//   would notch at the crossovers, and the band mixed back would make each
//   ear beat on its own at half the rate.
// - A partial on a crossover is half in the band and half out of it, so each
//   ear has it both shifted and not: there it wavers at half of Beat, to
//   silence on the edge itself. That is the price of shifting a band only.
// - The clock is a kit::SlowClock turning at half of Beat, a double moved on
//   by the same sum at every sample, awake or idle. It is never set by the
//   sound and never restarted. Beat goes straight to its rate: the phase is
//   summed, so a change of rate bends the turn and cannot jump.
// - What is smoothed (Ears, Low, High) is put where it is going when sound
//   comes back after kArriveSeconds of exact silence at the input. At that
//   same count of silent samples the filters are emptied, so from there on
//   the output is exact silence and the next sound meets the same state
//   whatever the block size; falling idle, which happens on a block's edge,
//   decides nothing. By then the longest tail (the pair's lowest section, 800
//   samples to fall by e whatever the rate) is 27 such falls down at 44.1 kHz,
//   under -200 dBFS; under 44.1 kHz the silence is kLeastArriveSamples long,
//   so that it is never fewer falls than that.
// - The input is guarded on the way in: a sample that is not a number becomes
//   silence and anything past kBound is held to it, so nothing of the kind
//   can lodge in the sections.
//
// Storage: seven state-variable sections and two pairs a channel, three
// smoothers and one clock. No delay line; the device fits in the default 4 MB.

#include "../../kit/kit.h"
#include "../../kit/band.h"
#include "../../kit/beat.h"
#include "params.gen.h"

namespace livemix {

class EarShift : public kit::DeviceBase<ear_shift::kNumParams> {
 public:
  // How long the input has to be exact silence before the filters are emptied
  // and before sound counts as new.
  static constexpr float kArriveSeconds = 0.5f;
  // And never fewer samples than this: the pair's tail is counted in samples.
  static constexpr long kLeastArriveSamples = 22050;
  // The largest sample let in: 36 dB over full scale.
  static constexpr float kBound = 64.0f;

  void init(float sample_rate) {
    using namespace ear_shift;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    half_beat_.reset();
    ears_.set_time(kSmoothingSeconds, sr);
    low_.set_time(kSmoothingSeconds, sr);
    high_.set_time(kSmoothingSeconds, sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    tune();
    hush();
    arrive_after_ = static_cast<long>(kArriveSeconds * sr);
    if (arrive_after_ < kLeastArriveSamples) arrive_after_ = kLeastArriveSamples;
    silent_ = arrive_after_;
    // One whole block more than the silence that counts as new sound (and a
    // little over, for the rounding of seconds), so the device is never idle
    // before that silence is over.
    idle_.reset(sr, static_cast<float>(arrive_after_ + kMaxBlockFrames + 64) / sr);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      // Idle, the clock goes on as it does awake, a sample at a time, so that
      // where it stands afterwards is the same to the last bit.
      for (int i = 0; i < frames; ++i) half_beat_.step(step_);
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      in[0] = guard(in[0]);
      in[1] = guard(in[1]);
      if (in[0] == 0.0f && in[1] == 0.0f) {
        if (silent_ < arrive_after_ && ++silent_ == arrive_after_) hush();
      } else {
        if (silent_ >= arrive_after_) arrive();
        silent_ = 0;
      }

      const kit::SinCos turn = kit::sin_cos(half_beat_.phase);
      half_beat_.step(step_);
      const float ears = ears_.next();
      low_.next();
      high_.next();
      if (low_.value != tuned_low_ || high_.value != tuned_high_) tune();

      float out[2];
      for (int c = 0; c < 2; ++c) {
        const kit::Bands parts = split_[c].process(in[c]);
        float band_i, band_q, rest_i, unused;
        band_pair_[c].process(parts.band, &band_i, &band_q);
        rest_pair_[c].process(parts.low + parts.high, &rest_i, &unused);
        const float together = band_i * turn.c;
        const float apart = ears * band_q * turn.s;
        out[c] = rest_i + (c == 0 ? together + apart : together - apart);
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // A sample that is not a number becomes silence; one past the bound is held
  // to it.
  static float guard(float x) {
    if (x > kBound) return kBound;
    if (x < -kBound) return -kBound;
    return x == x ? x : 0.0f;
  }

  // Both crossovers, for where the smoothed Low and High stand now.
  void tune() {
    tuned_low_ = low_.value;
    tuned_high_ = high_.value;
    for (kit::ThreeBand& split : split_) split.set(tuned_low_, tuned_high_, sample_rate());
  }

  // kArriveSeconds of exact silence have gone by: what is left in the filters
  // is far under anything heard, and it goes.
  void hush() {
    for (int c = 0; c < 2; ++c) {
      split_[c].reset();
      band_pair_[c].reset();
      rest_pair_[c].reset();
    }
  }

  // Sound after that silence: nothing is sounding, so every knob moved in the
  // silence has arrived.
  void arrive() {
    ears_.snap(ears_.target);
    low_.snap(low_.target);
    high_.snap(high_.target);
  }

  void apply(int id) {
    using namespace ear_shift;
    const float value = param(id);
    switch (id) {
      case kBeat:
        // The clock turns at half of Beat: one ear goes up by that much and
        // the other down.
        step_ = kit::SlowClock::increment(0.5 * static_cast<double>(value), static_cast<double>(sample_rate()));
        break;
      case kEars:
        ears_.set(value, primed());
        break;
      case kLow:
        low_.set(value, primed());
        break;
      case kHigh:
        high_.set(value, primed());
        break;
      default:
        break;
    }
  }

  kit::ThreeBand split_[2];
  kit::Hilbert band_pair_[2];  // the band: in-phase and quadrature, for the shift
  kit::Hilbert rest_pair_[2];  // the rest: in-phase only, the same all-pass
  kit::Smoother ears_, low_, high_;
  kit::SlowClock half_beat_;
  double step_ = 0.0;  // cycles a sample, for half of Beat
  // Where the crossovers were last worked out.
  float tuned_low_ = 0.0f;
  float tuned_high_ = 0.0f;
  // Samples of exact silence at the input, up to arrive_after_.
  long silent_ = 0;
  long arrive_after_ = 0;
  kit::IdleGate idle_;
};

}  // namespace livemix
