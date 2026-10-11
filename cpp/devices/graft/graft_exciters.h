#pragma once

// What sets a Graft body going. Two that hold a note (Breath, Bow: `Driver`)
// and two that strike once (Mallet, Pluck: `Striker`). All four hand the
// body one number per sample, a force.

#include "../../kit/math.h"
#include "../../kit/string.h"
#include "graft_band.h"

namespace livemix {
namespace graft {

// Breath and Bow: a curve from the body's own motion to a force, closed in a
// loop round the body, so the body speaks at its own pitch.
//
//   body.sense ─► curve(sense / level) · level ─► band-pass at the note ─►(+)─► body
//                                                               air noise ─┘
//
// - Everything is measured against `level` (how hard it is blown or how
//   fast the bow moves), so the tone has one shape at every loudness and its
//   amplitude follows the level: a swell is the level rising.
// - Breath is a soft S-curve (flow that gives way as the body pushes back)
//   plus a little of the motion squared, which is what gives a blown body
//   its even harmonics. The S-curve's slope at rest is over one, so any
//   motion grows until the curve flattens. Pressure steepens it.
// - Bow is friction against the difference between the bow's speed and the
//   body's: strongest when the two nearly match (stick), falling away as
//   they part (slip). That falling side is what feeds the body; the stick
//   side holds its swing at the bow's speed. Pressure tightens the grip: a
//   harder edge to each cycle, more partials.
// - The band-pass is how quick the exciter is: narrow for a soft breath
//   (little but the fundamental gets through), wide for a hard bow. It sits
//   on the note, where it turns no phase, so it shapes the tone without
//   moving the pitch, and it takes the curve's mean with it.
struct Driver {
  bool bow = false;
  Band shape;
  // Set from Pressure on the control clock.
  float steep = 4.0f;      // Breath: slope of the curve
  float stick = 2.0f;      // Bow: bow speed over the width of the stick region
  float grip = 3.0f;       // Bow: friction scale
  float rest = 0.0f;       // Bow: friction with the body at rest

  void start(bool is_bow, float hz, float sample_rate) {
    bow = is_bow;
    shape.reset();
    shape.set(hz, 1.0f, sample_rate);
    pressure_ = -1.0f;
  }

  // `pressure` is the knob; `leaned` is the knob as Wander has it lean just
  // now. Called every control tick: a few sums and one division (the
  // band-pass keeps its centre), and a power only when the knob has moved.
  void set_pressure(float pressure, float leaned) {
    steep = kBreathSoft + (kBreathHard - kBreathSoft) * leaned;
    stick = kStickLight + (kStickHeavy - kStickLight) * leaned;
    grip = kGripLight + (kGripHeavy - kGripLight) * leaned;
    const float third = 1.0f + stick * stick * (1.0f / 3.0f);
    rest = kFrictionPeak * stick / (third * third);
    if (pressure != pressure_) {
      pressure_ = pressure;
      breath_q_ = kBreathNarrow * std::pow(kBreathWide / kBreathNarrow, pressure);
    }
    // Breath: the knob's width, widened or narrowed by the lean (the power's
    // first two terms: a lean is small).
    const float lean = (leaned - pressure) * kBreathLog;
    shape.set_q(bow ? kBowNarrow + (kBowWide - kBowNarrow) * leaned : breath_q_ * (1.0f + lean + 0.5f * lean * lean));
  }

  // The curve: the force for a body moving at `sense` under a drive of
  // `level`. Both are written out over `level` so that one division serves:
  //   Breath: level · (tanh(steep · u) + even · u²), u = sense / level,
  //           tanh as kit::fast_tanh and u² held to 1.5²
  //   Bow:    level · grip · (friction(stick · (1 - u)) - rest),
  //           friction(x) = 1.778 · x / (1 + x²/3)², which is 1 at x = 1
  float curve(float sense, float level) const {
    if (bow) {
      const float m = stick * (level - sense);
      const float l2 = level * level;
      const float d = 3.0f * l2 + m * m;
      return grip * (kFrictionPeak * 9.0f * m * l2 * l2 / (d * d + 1.0e-30f) - rest * level);
    }
    const float n = kit::clamp(steep * sense, -3.0f * level, 3.0f * level);
    const float held = kit::clamp(sense, -1.5f * level, 1.5f * level);
    const float l2 = 27.0f * level * level, n2 = n * n;
    const float bottom = l2 + 9.0f * n2;
    return (n * (l2 + n2) * level + kBreathEven * held * held * bottom) / (bottom * level + 1.0e-30f);
  }

  // How far the body's speed is from the bow's (0 stuck, up to 1.5 of the
  // bow's speed slipping), times the bow's speed: rosin is heard in the slip.
  static float slip(float sense, float level) {
    const float apart = level - sense;
    return kit::min(apart < 0.0f ? -apart : apart, 1.5f * level);
  }

  // The exciter's own quickness: the band-pass on the note.
  float shaped(float force) { return shape.pass(force); }

  static constexpr float kBreathSoft = 2.2f;
  static constexpr float kBreathHard = 9.0f;
  static constexpr float kBreathEven = 0.5f;
  static constexpr float kBreathNarrow = 1.6f;   // Q of the band-pass, Pressure 0
  static constexpr float kBreathWide = 0.45f;    // and Pressure 1
  static constexpr float kBreathLog = -1.2685113f;  // ln(kBreathWide / kBreathNarrow)
  static constexpr float kFrictionPeak = 1.7777778f;
  static constexpr float kStickLight = 2.0f;
  static constexpr float kStickHeavy = 2.4f;
  static constexpr float kGripLight = 2.2f;
  static constexpr float kGripHeavy = 4.5f;
  static constexpr float kBowNarrow = 0.6f;
  static constexpr float kBowWide = 0.3f;

 private:
  float pressure_ = -1.0f, breath_q_ = 1.0f;
};

// Mallet and Pluck: one push, shaped by Pressure.
//
// - Pluck is the kit's: an impulse rounded to the 1/n fall of a plucked
//   string, then by the pick (Pressure opens it), with the pick's noise, and
//   a scratch of the pick beside it that the note's own low-pass leaves be.
// - Mallet is a raised-cosine pulse most of a period long when soft and a
//   small share of one when hard, with the same energy either way, and a
//   thud: a burst of low noise that dies in a few milliseconds.
// Both are scaled by the period, so the fundamental of a waveguide comes out
// near 0.7 × amplitude at any pitch (less for a hard mallet).
struct Striker {
  kit::PluckExciter pluck;
  float phase = 1.0f, phase_step = 0.0f, pulse_gain = 0.0f;
  float thud = 0.0f, thud_decay = 0.0f, thud_state = 0.0f, thud_coeff = 0.0f;
  bool mallet = false;

  void stop() {
    pluck.stop();
    phase = 1.0f;
    thud = thud_state = 0.0f;
  }

  // `hardness` 0 to 1, `air` 0 to 1.
  void strike(bool is_mallet, float amplitude, float hz, float hardness, float air, float sample_rate) {
    stop();
    mallet = is_mallet;
    const float period = sample_rate / hz;
    if (!mallet) {
      // The pick opens with hardness, counted in partials of the note.
      const float pick_hz =
          kit::clamp(hz * kPickSoft * std::pow(kPickHard / kPickSoft, hardness), kPickLowestHz, 0.4f * sample_rate);
      pluck.strike(amplitude, hz, pick_hz, air, sample_rate);
      burst(amplitude * air * kScratchLevel, period, kScratchSeconds, pick_hz, sample_rate);
      return;
    }
    const float periods = kMalletSoft * std::pow(kMalletHard / kMalletSoft, hardness);
    const float length = kit::clamp(periods * period, 2.0f, kLongestPulse * sample_rate);
    phase = 0.0f;
    phase_step = 1.0f / length;
    // A soft mallet's pulse has the area of amplitude × half a period; a
    // harder one is shorter with the same energy, so it is brighter rather
    // than a taller and taller spike.
    // A pulse of a few samples is not its formula: what its samples really
    // add up to is counted, or a high note's hard strike jumps in level.
    float sum = 0.5f * length;
    if (length < kCountedPulse) {
      sum = 0.0f;
      for (float at = 0.5f * phase_step; at < 1.0f; at += phase_step) {
        sum += 0.5f - 0.5f * kit::SineTable::cos_lookup(at);
      }
    }
    pulse_gain = amplitude * period * 0.5f / sum * std::sqrt(kit::min(1.0f, length / (kMalletSoft * period)));
    burst(amplitude * air * kThudLevel, period, kThudSeconds, kThudHz, sample_rate);
  }

  bool active() const { return (mallet ? phase < 1.0f : pluck.active()) || thud > 1.0e-9f; }

  float next(kit::Rng& rng) {
    float x = 0.0f;
    if (!mallet) {
      x = pluck.next(rng);
    } else if (phase < 1.0f) {
      const float at = phase + 0.5f * phase_step;
      if (at < 1.0f) x = pulse_gain * (0.5f - 0.5f * kit::SineTable::cos_lookup(at));
      phase += phase_step;
    }
    if (thud > 1.0e-9f) {
      const float noise = thud * rng.bipolar();
      thud_state = flush_denormal(noise + (thud_state - noise) * thud_coeff);
      x += thud_state;
      thud *= thud_decay;
    } else {
      thud = 0.0f;
    }
    return x;
  }

  // The noise of the stroke: low-passed at `hz`, gone in `seconds`. Scaled
  // by the period like the push itself (up to a point: under about 240 Hz
  // it stays as it is, or it would bury a low note), and against the corner
  // so that an open pick is not a louder burst than a closed one.
  void burst(float level, float period, float seconds, float hz, float sample_rate) {
    const float corner = kit::clamp(hz, 20.0f, 0.4f * sample_rate);
    const float span = kit::min(period, kLongestBurst * sample_rate);
    thud = level * std::sqrt(span * kThudHz / corner);
    thud_decay = kit::time_to_coeff(seconds, sample_rate);
    thud_coeff = std::exp(-kit::kTwoPi * corner / sample_rate);
  }

  static constexpr float kPickSoft = 0.6f;      // the pick's corner, in partials of the note
  static constexpr float kPickHard = 24.0f;
  static constexpr float kPickLowestHz = 120.0f;
  static constexpr float kMalletSoft = 0.7f;    // pulse length in periods
  static constexpr float kMalletHard = 0.07f;
  static constexpr float kLongestPulse = 0.012f;  // seconds
  static constexpr float kCountedPulse = 24.0f;   // samples
  static constexpr float kScratchLevel = 0.34f;  // the pick's scratch, through the pick's own corner
  static constexpr float kScratchSeconds = 0.004f;
  static constexpr float kLongestBurst = 0.0042f;  // seconds: the period the noise stops growing at
  static constexpr float kThudLevel = 0.4f;
  static constexpr float kThudSeconds = 0.006f;
  static constexpr float kThudHz = 600.0f;
};

}  // namespace graft
}  // namespace livemix
