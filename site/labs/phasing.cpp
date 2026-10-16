// Phasing: the Phaser (cpp/devices/phaser) run one sample at a
// time, so the oscillator, the corner frequency it sets and the all-passed
// signal can be read out of the device itself as it works.
//
//   in ──(+)──► all-pass 1 ──► … ──► all-pass N ──┬──► all-passed ──┐
//         ▲                                       │                 ├─ mix ─► out
//         └──── soft limit ◄── feedback ◄── z⁻¹ ──┘           in ───┘
//
//   oscillator ──► 3 ms lag ──► corner = Centre · 2^(oscillator · Depth · 2.5)
//
// Read from the running device: the oscillator, the corner frequency of each
// side (the device's own meters), the all-passed signal (the chain's last
// output, which the device keeps for its feedback), the output.
//
// Measured on a second device with its oscillator held still (Depth 0), by
// putting one sample through it: the phase of the chain, its level, and the
// level of the sum with and without feedback. The frequencies where the
// chain's phase crosses an odd half turn are found from the same response.
//
// The phase of one stage is measured on the device's own stage class
// (phaser_stage.h) with the device's own coefficient, and drawn against the
// formula the lesson gives ("lesson"), with a check of the distance between
// them. The comb is the lesson's own: half the input plus half the input
// delayed, with the delay that puts its first notch on the phaser's.
//
// One picture is a steady tone and not the loop: the second device, its
// oscillator still and its feedback at 0, is played a sine at the frequency
// of the Tone control, and three cycles are kept of what went in, of what
// came out of the chain and of the output.
//
// The build part puts a phaser together a piece at a time, on a path of its
// own beside the device (lab::Build in lab.h). It has five pieces, each a
// function of `Built` below, in the order the steps add them: one all-pass
// stage; a chain of them; the sum with the input; the sweep; the feedback
// loop. The stage, the sum and the loop are written out here ("lesson"), the
// same arithmetic in the same order as the device's; the coefficient of a
// stage and the oscillator are the device's own function and class. The path
// writes the "built" taps and leaves every other tap as it was. Two copies of
// it run: one at the step the reader chose, which is what the taps show, and
// one with all five pieces, whose output is compared on every render with the
// device's own output (the "builtDifference" check). A step before the last
// is the lesson's own: a phaser with a piece missing, which the device never
// is. One thing the build does not work out: when the device sleeps in a
// silence, the build is told, and sleeps with it.

#include "lab.h"

#include "../../cpp/devices/phaser/phaser.h"

using namespace livemix;

namespace {

Phaser device;
Phaser probe;  // a second device with the oscillator still, for the curves

// The controls are the device's parameters, by the device's own ids, and one
// of the lesson's: the frequency of the steady tone of the lesson's one picture.
lab::Control stages{"stages", "Stages", "", 0.0f, 4.0f, 0.0f, lab::kLinear, "4|6|8|10|12"};
lab::Control centre{"centerHz", "Centre", "Hz", 100.0f, 5000.0f, 800.0f, lab::kLog};
lab::Control spread{"spread", "Spread", "%", 0.0f, 100.0f, 0.0f};
lab::Control feedback{"feedback", "Feedback", "%", -95.0f, 95.0f, 0.0f};
lab::Control rate{"rate", "Rate", "Hz", 0.01f, 10.0f, 0.25f, lab::kLog};
lab::Control depth{"depth", "Depth", "%", 0.0f, 100.0f, 60.0f};
lab::Control shape{"shape", "Shape", "", 0.0f, 5.0f, 0.0f, lab::kLinear,
                   "Sine|Triangle|Saw up|Saw down|Square|Random"};
lab::Control stereo{"stereo", "Stereo", "°", 0.0f, 180.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 0.5f};
lab::Control tone{"tone", "Tone", "Hz", 50.0f, 3000.0f, 200.0f, lab::kLog};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap picture_in{"pictureIn", "The input", lab::kFrames, lab::kSource, 1, "dB"};
lab::Tap lfo{"lfo", "Oscillator", lab::kControl, lab::kDevice, 1};
lab::Tap corner{"corner", "Corner frequency", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap corner_right{"cornerRight", "Corner frequency, right side", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap wet{"wet", "The all-passed copy", lab::kAudio, lab::kDevice, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap picture{"picture", "The output", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Tap phase{"phase", "Phase of one stage", lab::kCurve, lab::kCalled, 1, "°"};
lab::Tap phase_formula{"phaseFormula", "The phase as written", lab::kCurve, lab::kLesson, 1, "°"};
lab::Tap chain_phase{"chainPhase", "Phase of the whole chain", lab::kCurve, lab::kDevice, 1, "°"};
lab::Tap crossings{"crossings", "Where the phase crosses an odd half turn", lab::kCurve, lab::kDevice, 1, "Hz"};
lab::Tap chain_level{"chainLevel", "The all-passed copy alone", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap plain{"plain", "Mixed with the input, no feedback", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap response{"response", "Mixed with the input", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap comb{"comb", "A comb with the same first notch", lab::kSpectrum, lab::kLesson, 1, "dB"};

lab::Tap tone_in{"toneIn", "The tone", lab::kCurve, lab::kSource, 1};
lab::Tap tone_copy{"toneCopy", "Its all-passed copy", lab::kCurve, lab::kDevice, 1};
lab::Tap tone_sum{"toneSum", "The two mixed", lab::kCurve, lab::kDevice, 1};

lab::Check phase_error{"phaseError", "One stage's measured phase against the formula", "°"};
lab::Check flat{"flat", "The chain alone, furthest from 0 dB at any frequency", "dB"};
lab::Check null_depth{"nullDepth", "The sum at half mix, at the frequencies where the phase crosses", "dB"};

lab::Tap built{"built", "The phaser so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_corner{"builtCorner", "Corner frequency so far", lab::kControl, lab::kLesson, 1, "Hz"};
lab::Tap built_corner_right{"builtCornerRight", "Corner frequency so far, right side", lab::kControl,
                            lab::kLesson, 1, "Hz"};
lab::Tap built_phase{"builtPhase", "Phase so far", lab::kCurve, lab::kLesson, 1, "°"};
lab::Tap built_response{"builtResponse", "Level so far", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap built_before{"builtBefore", "Level one step back", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap built_picture{"builtPicture", "The phaser so far", lab::kFrames, lab::kLesson, 1, "dB"};

constexpr float kUnit = 0.1f;        // the one sample put in: small, so the loop's limiter stays linear
constexpr int kShort = 16384;        // room for a chain's response
constexpr int kLong = 32768;         // room for a response that feeds back
constexpr int kPoints = 361;         // points of a curve, 20 Hz to 20 kHz
constexpr float kLowHz = 20.0f;
constexpr float kHighHz = 20000.0f;
constexpr int kLeadIn = 160;         // points below 20 Hz the phase is followed through, from 0.9 Hz

float chain_response_[kShort];
float half_response_[kShort];
float plain_response_[kShort];
float long_response_[kLong];
float stage_response_[kShort];
double followed_[kLeadIn + kPoints];

double grid_hz(int p) {
  return kLowHz * std::pow(static_cast<double>(kHighHz) / kLowHz, static_cast<double>(p) / (kPoints - 1));
}

// ---------------------------------------------------------------------------
// The build part: a phaser, a piece at a time.

// One all-pass stage. It keeps the sample that went in last time and the
// sample that came out last time, and has one number of its own, `a`.
struct Stage {
  float a = 0.0f;   // set by the corner frequency
  float x1 = 0.0f;  // the input, one sample ago
  float y1 = 0.0f;  // the output, one sample ago

  float run(float x) {
    const float y = flush_denormal(a * x + x1 - a * y1);
    x1 = x;
    y1 = y;
    return y;
  }
};

// The loop's safety: what is fed back passes as it is up to full scale, and
// is bent over above it so that it lands on twice full scale and no higher.
float limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

// The phaser so far: one function a piece, and run() to take a sample
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kStage = 0, kChain, kSum, kSweep, kLoop };

  int pieces = kStage;
  bool still = false;        // the sweep left out, for a step's curve
  int count = 1;             // how many stages the sound goes through
  Stage chain[2][Phaser::kMaxStages];
  phaser::ModLfo lfo;        // the device's own oscillator
  kit::ControlClock clock;   // counts the samples between two retunings
  float lag = 1.0f;          // the share of the way the sweep follows the oscillator each time
  float swept[2] = {0.0f, 0.0f};  // the oscillator's value after the lag, left and right
  float last[2] = {0.0f, 0.0f};   // what came out of the chain one sample ago
  float out[2] = {0.0f, 0.0f};

  // Tune one side's stages from a corner frequency. With Spread at 0 they
  // all sit on it. Spread tunes them apart in even ratios, from an octave
  // under the corner to an octave over it at 100 %. The coefficient is the
  // device's own function.
  void tune(int c, float corner_hz) {
    if (pieces < kChain) {
      chain[c][0].a = phaser::allpass_coefficient(corner_hz, lab::kSampleRate);
      return;
    }
    const float apart = spread.value * 0.01f;
    const float ratio = std::exp2(2.0f * apart / static_cast<float>(count - 1));
    float hz = corner_hz * std::exp2(-apart);
    for (int s = 0; s < count; ++s) {
      chain[c][s].a = phaser::allpass_coefficient(hz, lab::kSampleRate);
      hz *= ratio;
    }
  }

  // The chain: the stages in a row, each handed what the one before it made.
  float through(int c, float x) {
    for (int s = 0; s < count; ++s) x = chain[c][s].run(x);
    return x;
  }

  // The sum: the input and the all-passed copy, crossed over by Mix. At 0.5
  // it is half of each.
  float mixed(float dry, float copy) const { return dry + (copy - dry) * mix.value; }

  // Where one side's corner is now: Centre, moved up or down by the lagged
  // oscillator. Depth at 100 % is two and a half octaves each way.
  float corner_hz(int c) const {
    return centre.value * std::exp2(swept[c] * (depth.value * 0.01f) * Phaser::kSweepOctaves);
  }

  // The sweep: the oscillator moves on by one sample, and once every four
  // samples the corner follows it and every stage is tuned again. The right
  // side reads the same oscillator Stereo degrees further on in its cycle.
  void sweep() {
    lfo.advance();
    if (!clock.tick()) return;
    swept[0] += (lfo.value() - swept[0]) * lag;
    swept[1] += (lfo.value(stereo.value * (1.0f / 360.0f)) - swept[1]) * lag;
    tune(0, corner_hz(0));
    tune(1, corner_hz(1));
  }

  // Feedback: what came out of the chain one sample ago, scaled by Feedback
  // and limited, is added to what goes into it now.
  float fed_back(int c) const { return limit(last[c] * (feedback.value * 0.01f)); }

  // One sample through the pieces built so far, in the order it meets them.
  void run(float left, float right) {
    const float in[2] = {left, right};
    if (pieces >= kSweep && !still) sweep();
    for (int c = 0; c < 2; ++c) {
      const float x = pieces >= kLoop ? in[c] + fed_back(c) : in[c];
      last[c] = through(c, x);
      out[c] = pieces >= kSum ? mixed(in[c], last[c]) : last[c];
    }
  }

  // Everything at rest, the oscillator at the start of its cycle. With
  // `still` the sweep is left out and every stage stays on Centre: a step's
  // curve is measured so.
  void start(int pieces_, bool still_ = false) {
    pieces = pieces_;
    still = still_;
    count = pieces >= kChain ? 4 + 2 * stages.choice() : 1;
    for (int c = 0; c < 2; ++c) {
      for (Stage& stage : chain[c]) stage = Stage{};
      swept[c] = 0.0f;
      last[c] = 0.0f;
      out[c] = 0.0f;
    }
    lfo.reset();
    lfo.set_rate(rate.value, lab::kSampleRate);
    lfo.set_shape(shape.choice());
    clock.reset(Phaser::kControlInterval);
    lag = 1.0f - kit::time_to_coeff(Phaser::kLfoLagSeconds,
                                    lab::kSampleRate / static_cast<float>(Phaser::kControlInterval));
    if (pieces >= kSweep && !still) settle();
    tune(0, corner_hz(0));
    tune(1, corner_hz(1));
  }

  // Put the lagged value on the oscillator itself, as the device does when
  // nothing is sounding.
  void settle() {
    swept[0] = lfo.value();
    swept[1] = lfo.value(stereo.value * (1.0f / 360.0f));
  }

  // The device sleeps when nothing comes in and nothing rings. Its oscillator
  // goes on turning and its output is silence; the build does the same.
  void sleep() {
    if (pieces >= kSweep) {
      lfo.advance();
      settle();
      clock.reset(Phaser::kControlInterval);
    }
    out[0] = 0.0f;
    out[1] = 0.0f;
  }
};

lab::Build build{"One all-pass|A chain|Add the input|The sweep|Feedback", Built::kLoop, -120.0f,
                 "The phaser as built, all five pieces, against the device's own output"};

Built shown;   // at the step the reader chose: what the built taps hold
Built held;    // with every piece: what is compared with the device
Built struck;  // one sample goes through this one, for a step's curves

// ---------------------------------------------------------------------------
// Measurements on the second device, its oscillator still.

void configure(Phaser& one, float feedback_percent, float depth_percent, float stereo_degrees, float mix_value) {
  using namespace phaser;
  one.init(lab::kSampleRate);
  one.set_param(kStages, stages.value);
  one.set_param(kCenterHz, centre.value);
  one.set_param(kSpread, spread.value);
  one.set_param(kFeedback, feedback_percent);
  one.set_param(kRate, rate.value);
  one.set_param(kDepth, depth_percent);
  one.set_param(kShape, shape.value);
  one.set_param(kStereo, stereo_degrees);
  one.set_param(kMix, mix_value);
}

// A response that was cut short while still ringing: fade its last quarter so
// the cut adds no ripple. Then drop the silence at its end.
int trimmed(float* h, int done, int room, bool ringing) {
  if (done == room && ringing) {
    const int from = room - room / 4;
    for (int i = from; i < room; ++i) {
      h[i] *= 0.5f + 0.5f * static_cast<float>(std::cos(lab::kPi * (i - from) / (room - from)));
    }
  }
  while (done > 1 && h[done - 1] > -1.0e-9f && h[done - 1] < 1.0e-9f) --done;
  return done;
}

// One sample into the probe, its oscillator still, and what comes out of its
// left side until the device itself falls asleep (its tail under -140 dBFS)
// or the room runs out. Returns how many samples are worth keeping.
int unit_response(float mix_value, float feedback_percent, float* out, int room) {
  configure(probe, feedback_percent, 0.0f, 0.0f, mix_value);
  int done = 0;
  while (done < room) {
    const int n = room - done < 512 ? room - done : 512;
    if (done == 0) {
      probe.in_left()[0] = kUnit;
      probe.in_right()[0] = kUnit;
    }
    probe.process(n);
    for (int i = 0; i < n; ++i) out[done + i] = probe.out_left()[i] / kUnit;
    done += n;
    if (probe.idle_.asleep()) break;
  }
  return trimmed(out, done, room, !probe.idle_.asleep());
}

void level_tap(lab::Tap& tap, const float* h, int count) {
  lab::response_tap(tap, h, count, kPoints, kLowHz, kHighHz);
}

// The phase of one stage at the centre: one sample through the device's own
// stage class, set by the device's own coefficient, against the formula.
void measure_stage() {
  if (!phase.open(kPoints) || !phase_formula.open(kPoints)) return;
  phase.x0 = phase_formula.x0 = kLowHz;
  phase.x1 = phase_formula.x1 = kHighHz;
  phase.scale = phase_formula.scale = lab::kLog;

  phaser::PhaserStage stage;
  stage.a = phaser::allpass_coefficient(centre.value, lab::kSampleRate);
  int count = 0;
  for (; count < kShort; ++count) {
    stage_response_[count] = stage.process(count == 0 ? 1.0f : 0.0f);
    if (count > 16 && stage_response_[count] > -1.0e-9f && stage_response_[count] < 1.0e-9f) break;
  }

  const double t = std::tan(lab::kPi * centre.value / lab::kSampleRate);
  double worst = 0.0;
  for (int p = 0; p < kPoints; ++p) {
    const double hz = grid_hz(p);
    const lab::Bin bin = lab::fourier_at(stage_response_, count, hz);
    const double measured = std::atan2(bin.im, bin.re) * 180.0 / lab::kPi;
    const double written = -2.0 * std::atan(std::tan(lab::kPi * hz / lab::kSampleRate) / t) * 180.0 / lab::kPi;
    phase.set(p, static_cast<float>(measured));
    phase_formula.set(p, static_cast<float>(written));
    const double error = measured > written ? measured - written : written - measured;
    if (error > worst) worst = error;
  }
  phase_error.value = static_cast<float>(worst);
}

// The phase of a response against frequency, in degrees, followed up from
// 0.9 Hz (where it has hardly turned) so no whole turn is lost. The phase in
// radians at every point followed is left in followed_.
void phase_tap(lab::Tap& tap, const float* h, int count) {
  if (!tap.open(kPoints)) return;
  tap.x0 = kLowHz;
  tap.x1 = kHighHz;
  tap.scale = lab::kLog;
  double previous = 0.0;
  for (int p = -kLeadIn; p < kPoints; ++p) {
    const lab::Bin bin = lab::fourier_at(h, count, grid_hz(p));
    const double wrapped = std::atan2(bin.im, bin.re);
    const double turned = wrapped + 2.0 * lab::kPi * std::round((previous - wrapped) / (2.0 * lab::kPi));
    followed_[p + kLeadIn] = turned;
    previous = turned;
    if (p >= 0) tap.set(p, static_cast<float>(turned * 180.0 / lab::kPi));
  }
}

// The chain as the device runs it, oscillator still: its phase, its level,
// and the frequencies where the phase passes an odd half turn.
void measure_chain() {
  const int count = unit_response(1.0f, 0.0f, chain_response_, kShort);
  level_tap(chain_level, chain_response_, count);
  float furthest = 0.0f;
  for (int p = 0; p < chain_level.length; ++p) {
    const float d = chain_level.data[p] < 0.0f ? -chain_level.data[p] : chain_level.data[p];
    if (d > furthest) furthest = d;
  }
  flat.value = furthest;

  phase_tap(chain_phase, chain_response_, count);
  if (!chain_phase.data) return;

  // Each odd half turn the phase passes between two points of the curve, found
  // by halving the gap: before the crossing the response's imaginary part is
  // below zero, after it above.
  const int half_count = unit_response(0.5f, 0.0f, half_response_, kShort);
  double found[Phaser::kMaxStages];
  int notches = 0;
  for (int p = -kLeadIn + 1; p < kPoints && notches < Phaser::kMaxStages; ++p) {
    const double target = -(2.0 * notches + 1.0) * lab::kPi;
    if (!(followed_[p + kLeadIn - 1] > target && followed_[p + kLeadIn] <= target)) continue;
    double below = grid_hz(p - 1), above = grid_hz(p);
    for (int step = 0; step < 40; ++step) {
      const double middle = std::sqrt(below * above);
      if (lab::fourier_at(chain_response_, count, middle).im < 0.0) {
        below = middle;
      } else {
        above = middle;
      }
    }
    found[notches++] = std::sqrt(below * above);
  }
  // Kept: the ones the curves show, 20 Hz to 20 kHz.
  int shown_count = 0;
  for (int k = 0; k < notches; ++k) shown_count += found[k] >= kLowHz && found[k] <= kHighHz ? 1 : 0;
  double shallowest = lab::kFloorDb;
  if (shown_count > 0 && crossings.open(shown_count)) {
    crossings.x0 = 1.0f;
    crossings.x1 = static_cast<float>(shown_count);
    int at = 0;
    for (int k = 0; k < notches; ++k) {
      if (found[k] < kLowHz || found[k] > kHighHz) continue;
      crossings.set(at++, static_cast<float>(found[k]));
      const lab::Bin at_half = lab::fourier_at(half_response_, half_count, found[k]);
      const double level = lab::power_to_db(static_cast<float>(at_half.power()));
      if (level > shallowest) shallowest = level;
    }
  }
  null_depth.value = static_cast<float>(shallowest);
}

// The sum as the device makes it at this mix, oscillator still: without
// feedback, and with the feedback as set.
void measure_sum() {
  const int count = unit_response(mix.value, 0.0f, plain_response_, kShort);
  level_tap(plain, plain_response_, count);
  if (feedback.value > -0.05f && feedback.value < 0.05f) {
    level_tap(response, plain_response_, count);
    return;
  }
  const int long_count = unit_response(mix.value, feedback.value, long_response_, kLong);
  level_tap(response, long_response_, long_count);
}

// The lesson's own comb: half the input plus half the input `delay` samples
// late, the delay chosen to put its first notch on the phaser's. One sample
// goes through it, and its level is taken from 0 to 12 kHz in steps of 2.5 Hz.
void measure_comb() {
  constexpr int kCombPoints = 4801;
  constexpr float kCombTop = 12000.0f;
  const float first = crossings.length > 0 ? crossings.data[0] : 0.4142f * centre.value;
  int delay = static_cast<int>(lab::kSampleRate / (2.0f * first) + 0.5f);
  if (delay < 1) delay = 1;
  if (delay > kShort - 1) delay = kShort - 1;
  float* h = stage_response_;
  for (int n = 0; n <= delay; ++n) {
    const float x = n == 0 ? 1.0f : 0.0f;
    const float late = n == delay ? 1.0f : 0.0f;  // x[n - delay]
    h[n] = 0.5f * x + 0.5f * late;
  }
  if (!comb.open(kCombPoints)) return;
  comb.x0 = 0.0f;
  comb.x1 = kCombTop;
  for (int p = 0; p < kCombPoints; ++p) {
    const double hz = kCombTop * p / (kCombPoints - 1);
    // Two samples are all that came out: the Fourier sum has two terms.
    const double w = 2.0 * lab::kPi * hz / lab::kSampleRate * delay;
    const double re = h[0] + h[delay] * std::cos(w);
    const double im = -h[delay] * std::sin(w);
    comb.set(p, lab::power_to_db(static_cast<float>(re * re + im * im)));
  }
}

// A steady tone and its copy: the second device, oscillator still and
// feedback at 0, is played a sine at the Tone control's frequency for a tenth
// of a second, and then three of its cycles are kept, a point a sample: the
// tone as it went in, as it came out of the chain, and the output. The curves
// run against time counted in cycles of the tone, and the tone starts the
// first of them at nothing, on its way up.
void measure_tone() {
  constexpr int kWait = 4800;
  constexpr double kCycles = 3.0;
  const double step = static_cast<double>(tone.value) / lab::kSampleRate;  // cycles a sample
  const int count = static_cast<int>(kCycles / step) + 2;
  if (!tone_in.open(count) || !tone_copy.open(count) || !tone_sum.open(count)) return;
  tone_in.x0 = tone_copy.x0 = tone_sum.x0 = 0.0f;
  tone_in.x1 = tone_copy.x1 = tone_sum.x1 = static_cast<float>((count - 1) * step);
  configure(probe, 0.0f, 0.0f, 0.0f, mix.value);
  for (int n = -kWait; n < count; ++n) {
    const float x = static_cast<float>(std::sin(2.0 * lab::kPi * step * n));
    probe.in_left()[0] = x;
    probe.in_right()[0] = x;
    probe.process(1);
    if (n < 0) continue;
    tone_in.set(n, x);
    tone_copy.set(n, probe.chains_[probe.active_].last_out[0]);
    tone_sum.set(n, probe.out_left()[0]);
  }
}

// ---------------------------------------------------------------------------
// The build's own curves: one sample through the build at a step, its sweep
// left out so that every stage stays on Centre.

float built_response_[kLong];

int built_unit_response(int pieces, float* out, int room) {
  struck.start(pieces, true);
  int done = 0;
  int quiet = 0;
  // Stop once a twentieth of a second has gone by under -140 dBFS, as the device's own gate does.
  while (done < room && quiet < 2400) {
    struck.run(done == 0 ? kUnit : 0.0f, done == 0 ? kUnit : 0.0f);
    out[done] = struck.out[0] / kUnit;
    const float size = struck.last[0] < 0.0f ? -struck.last[0] : struck.last[0];
    quiet = size > kit::IdleGate::kFloor ? 0 : quiet + 1;
    ++done;
  }
  return trimmed(out, done, room, quiet < 2400);
}

// A step's level against frequency, in dB, as a curve.
void built_level(lab::Tap& tap, int pieces) {
  const int count = built_unit_response(pieces, built_response_, kLong);
  lab::response_tap(tap, built_response_, count, kPoints, kLowHz, kHighHz);
}

// A step's phase: of the one stage at the first step, and of the chain alone
// from the second on, since the pieces after it leave the chain as it is.
void built_turn(int pieces) {
  const int alone = pieces < Built::kChain ? Built::kStage : Built::kChain;
  const int count = built_unit_response(alone, built_response_, kLong);
  phase_tap(built_phase, built_response_, count);
}

// A sound's spectrum over time, by the kit's transform: 240 columns across
// the loop, each the mean power of four Hann-windowed frames of 1024 samples
// a quarter of a frame apart. One frame of noise is too ragged to show the
// edge of a notch; four are enough. Rows are the 513 bins from 0 Hz to half
// the sample rate, in dB where a full-scale sine reads 0.
void picture_of(lab::Tap& tap, const float* x, int count) {
  constexpr int kColumns = 240;
  constexpr int kFramesEach = 4;
  constexpr int kSize = lab::kPictureSize;
  constexpr int kRows = lab::kPictureRows;
  static kit::Fft<kSize> fft;
  static float window[kSize];
  static float re[kSize];
  static float im[kSize];
  static double power[kRows];
  static bool ready = false;
  if (!ready) {
    fft.init();
    for (int n = 0; n < kSize; ++n) window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / kSize));
    ready = true;
  }
  if (!x || count <= 0 || !tap.open(kColumns * kRows)) return;
  tap.columns = kColumns;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(count) / lab::kSampleRate;
  const double full = (kSize / 4.0) * (kSize / 4.0) * kFramesEach;
  for (int c = 0; c < kColumns; ++c) {
    const int start = static_cast<int>(static_cast<long long>(c) * count / kColumns);
    for (int k = 0; k < kRows; ++k) power[k] = 0.0;
    for (int f = 0; f < kFramesEach; ++f) {
      for (int n = 0; n < kSize; ++n) {
        re[n] = x[(start + f * (kSize / 4) + n) % count] * window[n];  // reads on from the start, as the loop does
        im[n] = 0.0f;
      }
      fft.forward(re, im);
      for (int k = 0; k < kRows; ++k) power[k] += static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
    }
    float* column = tap.data + c * kRows;
    for (int k = 0; k < kRows; ++k) column[k] = lab::power_to_db(static_cast<float>(power[k] / full));
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  configure(device, feedback.value, depth.value, stereo.value, mix.value);

  // The build part: the chosen step, and the whole build that is held to the
  // device. When the chosen step is the whole build, one copy is both.
  const bool whole = build.at() == build.compared_step;
  shown.start(build.at());
  if (!whole) held.start(build.compared_step);
  Built& compared = whole ? shown : held;
  double built_apart = 0.0, built_against = 0.0;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    // The device works on this sample when something comes in or it is still awake.
    const bool awake = left != 0.0f || right != 0.0f || !device.idle_.asleep();
    device.in_left()[0] = left;
    device.in_right()[0] = right;
    device.process(1);
    const float out_left = device.out_left()[0];
    const float out_right = device.out_right()[0];

    in_tap.put(i, left, right);
    const float* all_passed = device.chains_[device.active_].last_out;
    wet.put(i, all_passed[0], all_passed[1]);
    out_tap.put(i, out_left, out_right);

    // The build, beside the device: asleep when the device is.
    if (awake) {
      shown.run(left, right);
      if (!whole) held.run(left, right);
    } else {
      shown.sleep();
      if (!whole) held.sleep();
    }
    if (i >= frames) {
      const double apart_left = static_cast<double>(compared.out[0]) - out_left;
      const double apart_right = static_cast<double>(compared.out[1]) - out_right;
      built_apart += apart_left * apart_left + apart_right * apart_right;
      built_against += static_cast<double>(out_left) * out_left + static_cast<double>(out_right) * out_right;
    }
    built.put(i, shown.out[0], shown.out[1]);

    if (i % lab::kControlPeriod == 0) {
      lfo.put(i, device.lfo_.value());
      corner.put(i, device.meter(1));
      corner_right.put(i, device.meter(2));
      built_corner.put(i, shown.pieces >= Built::kSweep ? shown.corner_hz(0) : centre.value);
      built_corner_right.put(i, shown.pieces >= Built::kSweep ? shown.corner_hz(1) : centre.value);
    }
  }
  build.difference.value = lab::ratio_db(built_apart, built_against);

  picture_of(picture_in, in_tap.channel(0), frames);
  picture_of(picture, out_tap.channel(0), frames);
  picture_of(built_picture, built.channel(0), frames);

  measure_stage();
  measure_chain();
  measure_sum();
  measure_comb();
  measure_tone();

  built_turn(build.at());
  built_level(built_response, build.at());
  built_level(built_before, build.at() > 0 ? build.at() - 1 : 0);
}
