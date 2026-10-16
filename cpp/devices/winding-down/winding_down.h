#pragma once

// Winding Down: a pulse that seems to slow, or quicken, without end.
//
//   place (0..1, one double) ──► where each layer lies on the bell, and its rate
//   phase (one double) ─►×2─►×2─►×2─►×2─►×2      the layers' phases, by doubling
//        │      │     │     │     │     │
//        ▼      ▼     ▼     ▼     ▼     ▼
//      pulse  pulse pulse pulse pulse pulse        the kit's pulse, half on, half off
//        × w0   × w1  × w2  × w3  × w4  × w5       weights from the bell, adding to 1
//        └──────┴─────┴──┬──┴─────┴─────┘
//                        ▼
//   in ──► guard ──► × (floor + (1 - floor) · sum) ──► out        floor = (1 - Depth)²
//
// - Six layers are kept. At place p the layer k of them lies k - 2 - p
//   octaves from the centre and pulses at Rate · 2^(k - 2 - p). Slower, the
//   place rises by one in Halving seconds, so every layer halves its rate in
//   that time; Quicker, it falls. Direction turns the sign of that step and
//   nothing else, so the glide turns round from where it is.
// - The weight of a layer depends only on where it lies: a raised cosine
//   over Layers octaves, centred on Rate, zero at its two ends. Layers an
//   octave apart under such a bell number Layers (one fewer at the instant
//   one leaves as another comes in), and for a whole number their weights
//   add to the same total wherever the place is; the device divides by the
//   total anyway, since Layers is smoothed between whole numbers.
// - When the place passes 1 the lowest layer, by then three octaves under
//   the centre and long silent, is dropped; every layer takes the next place
//   down and a new one comes in on top, where the bell has not begun. The
//   one phase is doubled, which is the phase the second layer had, so
//   nothing that sounds moves. Quicker it is the other way: the phase is
//   halved, and the layer that comes in underneath has half the phase of the
//   one over it at that sample.
// - A layer's phase is the first one's doubled as many times as it is places
//   up. So the layers are locked: every pulse of a layer begins with a pulse
//   of each faster one, for as long as the device runs.
// - Each layer is the kit's pulse (cpp/kit/beat.h) at full depth: on for
//   half its period, with half-cosine edges of Edge seconds, held to a
//   quarter of its own period. kit::PulseGate carries it, so a change of
//   Rate or Edge in the middle of a pulse is one more edge, never a jump.
// - The gain is floor + (1 - floor) · (weighted sum of the pulses), with
//   floor = (1 - Depth)²: exactly 1 at Depth 0, exactly 0 at Depth 1 where
//   every layer is in its gap, never over 1. There is no make-up gain: the
//   device only turns down, and no sample comes out larger than it went in.
// - The right ear reads every layer Offset degrees of that layer's own cycle
//   later. At 180 the ears take turns layer by layer, each ear's pulses fill
//   the other's gaps, and the sum of the two does not pulse at all.
// - The two clocks never stop and are never set by the sound. Asleep they go
//   on a sample at a time by the very same sums as awake. What is smoothed
//   (Layers, Depth, Edge, Offset) and the twelve gates are put where they
//   belong when sound comes back after kArriveSeconds of exact silence, a
//   moment counted in samples, which does not depend on the block size the
//   way falling asleep does. Rate, Halving and Direction go straight into
//   the clocks: they change how fast a phase moves, never where it is.
// - A sample that is not a number passes as silence and one outside
//   ±kBound is held there. Nothing of the sound is kept, so a bad sample is
//   gone with the block it came in.
//
// Storage: two clocks, twelve gates, four smoothers. No delay line.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "params.gen.h"

namespace livemix {

class WindingDown : public kit::DeviceBase<winding_down::kNumParams> {
 public:
  // How many layers are kept, and how many octaves under the centre the
  // lowest of them lies when the place is 0.
  static constexpr int kSlots = 6;
  static constexpr int kBelow = 2;
  // Every layer is on for half of its period.
  static constexpr float kDuty = 0.5f;
  // How long the input has to be exact silence before sound counts as new.
  static constexpr float kArriveSeconds = 0.1f;
  // The largest sample let through; more is held here.
  static constexpr float kBound = 100.0f;
  // How fast the bell follows Layers. Slower than the other knobs: a layer's
  // weight is not a straight line in the bell's width (one at the bell's end
  // comes in several times faster at first than on the whole), so at 5 ms a
  // sixth of the change was there within 8 samples.
  static constexpr float kSpanSeconds = 0.03f;

  // The bell: the weight, before the weights are made to add to 1, of a layer
  // `octaves` from the centre when `span` octaves sound.
  static float bell(float octaves, float span) {
    const float away = octaves < 0.0f ? -octaves : octaves;
    if (!(away < 0.5f * span)) return 0.0f;
    // away / span is under a half, so the cosine's phase stays inside the table.
    return 0.5f + 0.5f * kit::SineTable::cos_lookup(away / span);
  }

  void init(float sample_rate) {
    using namespace winding_down;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (kit::Smoother& smoother : smooth_) smoother.set_time(kSmoothingSeconds, sr);
    smooth_[kSpanNow].set_time(kSpanSeconds, sr);
    place_.reset();
    phase_.reset();
    count_ = 0;
    for (int c = 0; c < 2; ++c) {
      for (kit::PulseGate& gate : gate_[c]) gate.reset();
    }
    arrive_after_ = static_cast<long>(kArriveSeconds * sr);
    silent_ = arrive_after_;
    // One whole block more than the silence that counts as new sound, so the
    // device is never asleep before that silence is over.
    idle_.reset(sr, kArriveSeconds + static_cast<float>(kMaxBlockFrames + 1) / sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    anchor();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json, for a display: the place
  // in the halving, 0 to 1 (a place a hair under 1 reads as 1). It rises
  // when slowing and falls when quickening, awake or asleep.
  float meter(int index) const { return index == 0 ? static_cast<float>(place_.phase) : 0.0f; }

  // What layer `slot` (0 the slowest) is doing now: its rate in hertz, and
  // its share of the weight with Layers where the knob points. For the
  // harness and for a display's truth test; nothing is changed.
  double layer_rate(int slot) const {
    return rate_ * ratio_ * static_cast<double>(sample_rate()) * static_cast<double>(1 << slot);
  }
  float layer_weight(int slot) const {
    const float span = smooth_[kSpanNow].target;
    const float place = static_cast<float>(place_.phase);
    float total = 0.0f;
    for (int k = 0; k < kSlots; ++k) total += bell(static_cast<float>(k - kBelow) - place, span);
    return total > 0.0f ? bell(static_cast<float>(slot - kBelow) - place, span) / total : 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      // Asleep the clocks go on as they do awake, a sample at a time, so that
      // where they stand afterwards is the same to the last bit.
      for (int i = 0; i < frames; ++i) {
        mark();
        step();
      }
      if (silent_ < arrive_after_) silent_ += frames;
      silence_output(frames);
      return;
    }
    const double sr = static_cast<double>(sample_rate());
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      mark();
      if (in[0] == 0.0f && in[1] == 0.0f) {
        if (silent_ < arrive_after_) ++silent_;
      } else {
        if (silent_ >= arrive_after_) arrive();
        silent_ = 0;
      }

      const float span = smooth_[kSpanNow].next();
      const float floor = smooth_[kFloorNow].next();
      const float edge = smooth_[kEdgeNow].next();
      const double offset = static_cast<double>(smooth_[kOffsetNow].next());
      const float place = static_cast<float>(place_.phase);

      // The layers, slowest first: each is the one before at twice the rate
      // and twice the phase.
      double phase = phase_.phase;
      double turn = rate_ * ratio_;  // cycles a sample
      float hz = static_cast<float>(turn * sr);
      float total = 0.0f, open_left = 0.0f, open_right = 0.0f;
      for (int k = 0; k < kSlots; ++k) {
        const float weight = bell(static_cast<float>(k - kBelow) - place, span);
        const kit::PulseShape shape = kit::pulse_shape(hz, kDuty, edge);
        const float left = gate_[0][k].next(phase, shape, turn);
        const float right = gate_[1][k].next(kit::wrap_phase(phase - offset), shape, turn);
        total += weight;
        open_left += weight * left;
        open_right += weight * right;
        phase += phase;
        if (phase >= 1.0) phase -= 1.0;
        turn += turn;
        hz += hz;
      }
      step();

      const float scale = total > 1.0e-6f ? (1.0f - floor) / total : 0.0f;
      float gain_left = floor + scale * open_left;
      float gain_right = floor + scale * open_right;
      // The weights add to 1 but for the rounding of a sum: never over.
      if (gain_left > 1.0f) gain_left = 1.0f;
      if (gain_right > 1.0f) gain_right = 1.0f;
      out_left_[i] = guard(in[0]) * gain_left;
      out_right_[i] = guard(in[1]) * gain_right;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // The ratio is worked out afresh every this many samples of the device's
  // own count (a power of two), and stepped in between.
  static constexpr uint32_t kAnchorMask = 31u;

  // A sample that is not a number is silence; one outside ±kBound is held.
  static float guard(float x) {
    if (x > -kBound && x < kBound) return x;
    if (x >= kBound) return kBound;
    if (x <= -kBound) return -kBound;
    return 0.0f;
  }

  // The lowest layer's cycles a sample for each hertz of Rate, at the place
  // as it stands: 2^-(kBelow + place) over the sample rate.
  void anchor() {
    ratio_ = std::exp2(-(static_cast<double>(kBelow) + place_.phase)) / static_cast<double>(sample_rate());
  }

  // The start of a sample, awake or asleep: the device's own count, and on
  // its multiples of 32 the ratio from the place in closed form, so that
  // what the steps in between round away never adds up.
  void mark() {
    if ((count_ & kAnchorMask) == 0u) anchor();
    ++count_;
  }

  // The end of a sample, awake or asleep: both clocks on by one.
  void step() {
    phase_.step(rate_ * ratio_);
    ratio_ *= ratio_step_;
    const double before = place_.phase;
    place_.step(glide_);
    if (glide_ > 0.0) {
      if (place_.phase < before) wrap_up();
    } else if (place_.phase > before) {
      wrap_down();
    }
  }

  // The phase of layer `slot`: the lowest one's, doubled that many times.
  double slot_phase(int slot) const {
    double phase = phase_.phase;
    for (int k = 0; k < slot; ++k) {
      phase += phase;
      if (phase >= 1.0) phase -= 1.0;
    }
    return phase;
  }

  // Put the two gates of one layer where its pulse stands, with the edge and
  // the offset as they are.
  void place_gates(int slot) {
    const double turn = rate_ * ratio_ * static_cast<double>(1 << slot);
    const kit::PulseShape shape =
        kit::pulse_shape(static_cast<float>(turn * static_cast<double>(sample_rate())), kDuty, smooth_[kEdgeNow].value);
    const double phase = slot_phase(slot);
    const double offset = static_cast<double>(smooth_[kOffsetNow].value);
    gate_[0][slot].reset(kit::pulse_open(phase, shape));
    gate_[1][slot].reset(kit::pulse_open(kit::wrap_phase(phase - offset), shape));
  }

  // Slowing, the place has passed 1: the lowest layer is dropped, every
  // layer takes the next place down, and a new one comes in on top.
  void wrap_up() {
    phase_.reset(2.0 * phase_.phase);
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k + 1 < kSlots; ++k) gate_[c][k] = gate_[c][k + 1];
    }
    anchor();
    place_gates(kSlots - 1);
  }

  // Quickening, the place has passed 0: the highest layer is dropped, every
  // layer takes the next place up, and a new one comes in underneath with
  // half the phase of the one over it.
  void wrap_down() {
    phase_.reset(0.5 * phase_.phase);
    for (int c = 0; c < 2; ++c) {
      for (int k = kSlots - 1; k > 0; --k) gate_[c][k] = gate_[c][k - 1];
    }
    anchor();
    place_gates(0);
  }

  // Sound after a silence: nothing is sounding, so every knob moved in the
  // silence has arrived and the gates stand where their pulses put them.
  void arrive() {
    for (kit::Smoother& smoother : smooth_) smoother.snap(smoother.target);
    for (int k = 0; k < kSlots; ++k) place_gates(k);
  }

  void apply(int id) {
    using namespace winding_down;
    const float value = param(id);
    switch (id) {
      case kDirection:
      case kHalving: {
        // Octaves a sample: up the bell's scale when slowing.
        const double pace = 1.0 / (static_cast<double>(param(kHalving)) * static_cast<double>(sample_rate()));
        glide_ = param(kDirection) > 0.5f ? -pace : pace;
        ratio_step_ = std::exp2(-glide_);
        break;
      }
      case kRate:
        rate_ = static_cast<double>(value);
        break;
      case kLayers:
        smooth_[kSpanNow].set(std::floor(value + 0.5f), primed());
        break;
      case kDepth:
        smooth_[kFloorNow].set(kit::pulse_floor(value), primed());
        break;
      case kEdge:
        smooth_[kEdgeNow].set(0.001f * value, primed());
        break;
      case kOffset:
        smooth_[kOffsetNow].set(value * (1.0f / 360.0f), primed());
        break;
      default:
        break;
    }
  }

  // The smoothed knobs: Layers as the bell's width in octaves, Depth as the
  // level it leaves in a gap, Edge in seconds, Offset in turns.
  enum Smoothed : int { kSpanNow = 0, kFloorNow, kEdgeNow, kOffsetNow, kNumSmoothed };
  kit::Smoother smooth_[kNumSmoothed];
  kit::IdleGate idle_;
  // The place in the halving, 0 up to 1, and the phase of the lowest layer.
  kit::SlowClock place_;
  kit::SlowClock phase_;
  // One gate a layer and an ear.
  kit::PulseGate gate_[2][kSlots];
  double rate_ = 4.0;        // Rate, in hertz
  double glide_ = 0.0;       // what the place moves by each sample: over 0 when slowing
  double ratio_ = 0.0;       // the lowest layer's cycles a sample for each hertz of Rate
  double ratio_step_ = 1.0;  // what the ratio is multiplied by each sample: 2^-glide
  uint32_t count_ = 0;       // samples since init, awake and asleep
  // Samples of exact silence at the input, up to arrive_after_.
  long silent_ = 0;
  long arrive_after_ = 0;
};

}  // namespace livemix
