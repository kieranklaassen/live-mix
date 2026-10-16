// Lesson 12, phasing: the Phaser (cpp/devices/phaser) run one sample at a
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

#include "lab.h"

#include "../../cpp/devices/phaser/phaser.h"

using namespace livemix;

namespace {

Phaser device;
Phaser probe;  // a second device with the oscillator still, for the curves

lab::Control stages{"stages", "Stages", "", 0.0f, 4.0f, 0.0f, lab::kLinear, "4|6|8|10|12"};
lab::Control centre{"centre", "Centre", "Hz", 100.0f, 5000.0f, 800.0f, lab::kLog};
lab::Control spread{"spread", "Spread", "%", 0.0f, 100.0f, 0.0f};
lab::Control feedback{"feedback", "Feedback", "%", -95.0f, 95.0f, 0.0f};
lab::Control rate{"rate", "Rate", "Hz", 0.01f, 10.0f, 0.25f, lab::kLog};
lab::Control depth{"depth", "Depth", "%", 0.0f, 100.0f, 60.0f};
// Four of the device's six shapes: all six do not fit a narrow page's switch.
// The triangle and the falling saw are on the plate at the lesson's end.
lab::Control shape{"shape", "Shape", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "Sine|Saw up|Square|Random"};
constexpr int kShapes[4] = {phaser::ModLfo::kSine, phaser::ModLfo::kSawUp, phaser::ModLfo::kSquare,
                            phaser::ModLfo::kRandom};
lab::Control stereo{"stereo", "Stereo", "°", 0.0f, 180.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 0.5f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap lfo{"lfo", "Oscillator", lab::kControl, lab::kDevice, 1};
lab::Tap corner{"corner", "Corner frequency", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap corner_right{"cornerRight", "Corner frequency, right side", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap wet{"wet", "All-passed", lab::kAudio, lab::kDevice, 2};
lab::Tap out_tap{"out", "Sum with the input", lab::kAudio, lab::kDevice, 2};
lab::Tap picture{"picture", "The output", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Tap phase{"phase", "Phase of one stage", lab::kCurve, lab::kKit, 1, "°"};
lab::Tap phase_formula{"phaseFormula", "The phase as written", lab::kCurve, lab::kLesson, 1, "°"};
lab::Tap chain_phase{"chainPhase", "Phase of the whole chain", lab::kCurve, lab::kDevice, 1, "°"};
lab::Tap crossings{"crossings", "Where the phase crosses an odd half turn", lab::kCurve, lab::kDevice, 1, "Hz"};
lab::Tap chain_level{"chainLevel", "The all-passed signal alone", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap plain{"plain", "The sum, no feedback", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap response{"response", "The sum", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap comb{"comb", "A comb with the same first notch", lab::kSpectrum, lab::kLesson, 1, "dB"};

lab::Check phase_error{"phaseError", "One stage's measured phase against the formula", "°"};
lab::Check flat{"flat", "The chain alone, furthest from 0 dB at any frequency", "dB"};
lab::Check null_depth{"nullDepth", "The sum at half mix, at the frequencies where the phase crosses", "dB"};

constexpr double kPi = 3.14159265358979323846;
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

// The sum the Fourier transform is (lesson 2), at one frequency.
struct Bin {
  double re;
  double im;
  double power() const { return re * re + im * im; }
};

Bin fourier_at(const float* h, int count, double hz) {
  const double w = 2.0 * kPi * hz / lab::kSampleRate;
  const double cw = std::cos(w), sw = std::sin(w);
  double c = 1.0, s = 0.0;
  Bin sum{0.0, 0.0};
  for (int n = 0; n < count; ++n) {
    sum.re += h[n] * c;
    sum.im -= h[n] * s;
    const double next = c * cw - s * sw;
    s = s * cw + c * sw;
    c = next;
  }
  return sum;
}

// One sample into the probe, its oscillator still, and what comes out of its
// left side until the device itself falls asleep (its tail under -140 dBFS)
// or the room runs out. Returns how many samples are worth keeping.
int unit_response(float mix_value, float feedback_percent, float* out, int room) {
  using namespace phaser;
  probe.init(lab::kSampleRate);
  probe.set_param(kStages, stages.value);
  probe.set_param(kCenterHz, centre.value);
  probe.set_param(kSpread, spread.value);
  probe.set_param(kFeedback, feedback_percent);
  probe.set_param(kDepth, 0.0f);
  probe.set_param(kStereo, 0.0f);
  probe.set_param(kMix, mix_value);
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
  if (done == room && !probe.idle_.asleep()) {
    // Cut short while still ringing: fade the last quarter so the cut adds no ripple.
    const int from = room - room / 4;
    for (int i = from; i < room; ++i) {
      out[i] *= 0.5f + 0.5f * static_cast<float>(std::cos(kPi * (i - from) / (room - from)));
    }
  }
  while (done > 1 && out[done - 1] > -1.0e-9f && out[done - 1] < 1.0e-9f) --done;
  return done;
}

// A response's level at the curve's frequencies.
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

  const double t = std::tan(kPi * centre.value / lab::kSampleRate);
  double worst = 0.0;
  for (int p = 0; p < kPoints; ++p) {
    const double hz = grid_hz(p);
    const Bin bin = fourier_at(stage_response_, count, hz);
    const double measured = std::atan2(bin.im, bin.re) * 180.0 / kPi;
    const double written = -2.0 * std::atan(std::tan(kPi * hz / lab::kSampleRate) / t) * 180.0 / kPi;
    phase.set(p, static_cast<float>(measured));
    phase_formula.set(p, static_cast<float>(written));
    const double error = measured > written ? measured - written : written - measured;
    if (error > worst) worst = error;
  }
  phase_error.value = static_cast<float>(worst);
}

// The chain as the device runs it, oscillator still: its phase followed up
// from 0.9 Hz (where it has hardly turned) so no whole turn is lost, its
// level, and the frequencies where the phase passes an odd half turn.
void measure_chain() {
  const int count = unit_response(1.0f, 0.0f, chain_response_, kShort);
  level_tap(chain_level, chain_response_, count);
  float furthest = 0.0f;
  for (int p = 0; p < chain_level.length; ++p) {
    const float d = chain_level.data[p] < 0.0f ? -chain_level.data[p] : chain_level.data[p];
    if (d > furthest) furthest = d;
  }
  flat.value = furthest;

  if (!chain_phase.open(kPoints)) return;
  chain_phase.x0 = kLowHz;
  chain_phase.x1 = kHighHz;
  chain_phase.scale = lab::kLog;
  double previous = 0.0;
  for (int p = -kLeadIn; p < kPoints; ++p) {
    const Bin bin = fourier_at(chain_response_, count, grid_hz(p));
    const double wrapped = std::atan2(bin.im, bin.re);
    const double turned = wrapped + 2.0 * kPi * std::round((previous - wrapped) / (2.0 * kPi));
    followed_[p + kLeadIn] = turned;
    previous = turned;
    if (p >= 0) chain_phase.set(p, static_cast<float>(turned * 180.0 / kPi));
  }

  // Each odd half turn the phase passes between two points of the curve, found
  // by halving the gap: before the crossing the response's imaginary part is
  // below zero, after it above.
  const int half_count = unit_response(0.5f, 0.0f, half_response_, kShort);
  double found[Phaser::kMaxStages];
  int notches = 0;
  for (int p = -kLeadIn + 1; p < kPoints && notches < Phaser::kMaxStages; ++p) {
    const double target = -(2.0 * notches + 1.0) * kPi;
    if (!(followed_[p + kLeadIn - 1] > target && followed_[p + kLeadIn] <= target)) continue;
    double below = grid_hz(p - 1), above = grid_hz(p);
    for (int step = 0; step < 40; ++step) {
      const double middle = std::sqrt(below * above);
      if (fourier_at(chain_response_, count, middle).im < 0.0) {
        below = middle;
      } else {
        above = middle;
      }
    }
    found[notches++] = std::sqrt(below * above);
  }
  // Kept: the ones the curves show, 20 Hz to 20 kHz.
  int shown = 0;
  for (int k = 0; k < notches; ++k) shown += found[k] >= kLowHz && found[k] <= kHighHz ? 1 : 0;
  double shallowest = lab::kFloorDb;
  if (shown > 0 && crossings.open(shown)) {
    crossings.x0 = 1.0f;
    crossings.x1 = static_cast<float>(shown);
    int at = 0;
    for (int k = 0; k < notches; ++k) {
      if (found[k] < kLowHz || found[k] > kHighHz) continue;
      crossings.set(at++, static_cast<float>(found[k]));
      const double level = lab::power_to_db(static_cast<float>(fourier_at(half_response_, half_count, found[k]).power()));
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
    const double w = 2.0 * kPi * hz / lab::kSampleRate * delay;
    const double re = h[0] + h[delay] * std::cos(w);
    const double im = -h[delay] * std::sin(w);
    comb.set(p, lab::power_to_db(static_cast<float>(re * re + im * im)));
  }
}

// The output's spectrum over time, by the kit's transform: 240 columns across
// the loop, each the mean power of four Hann-windowed frames of 1024 samples
// a quarter of a frame apart. One frame of noise is too ragged to show the
// edge of a notch; four are enough. Rows are the 513 bins from 0 Hz to half
// the sample rate, in dB where a full-scale sine reads 0.
void picture_tap(const float* x, int count) {
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
    for (int n = 0; n < kSize; ++n) window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * kPi * n / kSize));
    ready = true;
  }
  if (count <= 0 || !picture.open(kColumns * kRows)) return;
  picture.columns = kColumns;
  picture.x0 = 0.0f;
  picture.x1 = static_cast<float>(count) / lab::kSampleRate;
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
    float* column = picture.data + c * kRows;
    for (int k = 0; k < kRows; ++k) column[k] = lab::power_to_db(static_cast<float>(power[k] / full));
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  using namespace phaser;
  device.init(lab::kSampleRate);
  device.set_param(kStages, stages.value);
  device.set_param(kCenterHz, centre.value);
  device.set_param(kSpread, spread.value);
  device.set_param(kFeedback, feedback.value);
  device.set_param(kRate, rate.value);
  device.set_param(kDepth, depth.value);
  device.set_param(kShape, static_cast<float>(kShapes[shape.choice() & 3]));
  device.set_param(kStereo, stereo.value);
  device.set_param(kMix, mix.value);

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    device.in_left()[0] = left;
    device.in_right()[0] = right;
    device.process(1);

    in_tap.put(i, left, right);
    lfo.put(i, device.lfo_.value());
    corner.put(i, device.meter(1));
    corner_right.put(i, device.meter(2));
    // The chain's last output, which the device keeps to feed back.
    const float* all_passed = device.chains_[device.active_].last_out;
    wet.put(i, all_passed[0], all_passed[1]);
    out_tap.put(i, device.out_left()[0], device.out_right()[0]);
  }
  if (out_tap.data) picture_tap(out_tap.channel(0), frames);

  measure_stage();
  measure_chain();
  measure_sum();
  measure_comb();
}
