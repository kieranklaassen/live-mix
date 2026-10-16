// Samples, sine waves and aliasing: the kit's oscillators
// (cpp/kit/osc.h) and the sine table they read (cpp/kit/math.h), run bare.
//
//   SineOsc ──► sine                      a sine at any frequency up to the sample rate
//   SineOsc ──► sweep                     a sine asked to rise from 0 Hz to the sample rate
//   BlepOsc ──► phase ──► 2·phase − 1 ──► naive ──┐
//                    └──► −blep(phase, inc) ──────┴──► saw
//   BlepOsc ──► phase ──► the ramp folded ──► triangleNaive ──┐
//                    └──► 8·inc·(blamp − blamp) ──────────────┴──► triangle
//
// Computed by the kit: the sines (kit::SineOsc, which sets no limit on its
// step, so it can be asked for a frequency past half the sample rate), the
// band-limited saw and triangle (kit::BlepOsc::saw and ::triangle), the saw's
// correction (the kit's own blep(), a private function the lab is allowed to
// call) and the phase the shapes are read from.
//
// Written for the lesson: the naive saw and the naive triangle, which are the
// first terms of the kit's shapes worked out again from the kit's phase; the
// continuous waves the pictures draw between the samples; the folding
// formula; and the formula for what a correction does to each partial. Checks
// hold these to the kit on every render.
//
// The build part puts the kit's shaped oscillator together a piece at a time,
// on a path of its own beside the kit's (lab::Build in lab.h). It has five
// pieces, each a function of `Pieces` below, in the order the steps add them:
// a phase that wraps, heard through the kit's sine table; a naive saw; the
// step correction; a naive triangle; the slope correction. The path writes
// the "built" taps and leaves every other tap as it was. Three copies of it
// run: one at the step the reader chose, which is what the taps show; one
// with all five pieces, whose output is compared on every render with
// kit::BlepOsc::triangle (the check builtDifference); and one stopped at the
// step correction, compared with kit::BlepOsc::saw (the check builtSaw).
//
// The sine and the shapes are set to the nearest frequency that fits the loop
// a whole number of times, so the loop comes round without a seam. The sine
// starts at phase 0. The shapes start a fiftieth of a cycle in, so that at
// the round frequencies a page is likely to be set to, no drop of the saw
// falls exactly on a sample. With Glide above 0 the shapes rise that many
// octaves over the first half of the loop and come back over the second.

#include "lab.h"

using namespace livemix;

namespace {

kit::SineOsc sine_osc;
kit::SineOsc sweep_osc;
kit::BlepOsc saw_osc;
kit::BlepOsc triangle_osc;

lab::Control freq{"freq", "Sine frequency", "Hz", 0.0f, 48000.0f, 2000.0f};
lab::Control note{"note", "Note", "Hz", 55.0f, 8000.0f, 3840.0f, lab::kLog};
// "oct" and not "octaves": the page prints the value before the unit, and at 1 that read "1 octaves".
lab::Control glide{"glide", "Glide", "oct", 0.0f, 2.0f, 0.0f};

// The loop, in the lesson's order but for the last: play starts on the last of these.
lab::Tap sweep{"sweep", "A sine asked to rise to 48 kHz", lab::kAudio, lab::kKit, 1};
lab::Tap sine{"sine", "Sine, sampled", lab::kAudio, lab::kKit, 1};
lab::Tap naive{"naive", "Naive saw", lab::kAudio, lab::kLesson, 1};
lab::Tap correction{"correction", "The step correction", lab::kAudio, lab::kKit, 1};
lab::Tap triangle_naive{"triangleNaive", "Naive triangle", lab::kAudio, lab::kLesson, 1};
lab::Tap triangle{"triangle", "The kit's triangle", lab::kAudio, lab::kKit, 1};
lab::Tap saw{"saw", "The kit's saw", lab::kAudio, lab::kKit, 1};

// The spectrum of three of them as the loop goes by.
lab::Tap sweep_picture{"sweepPicture", "The rising sine, over the loop", lab::kFrames, lab::kKit, 1, "dB"};
lab::Tap naive_picture{"naivePicture", "The naive saw, over the loop", lab::kFrames, lab::kLesson, 1, "dB"};
lab::Tap saw_picture{"sawPicture", "The kit's saw, over the loop", lab::kFrames, lab::kKit, 1, "dB"};

// Twenty-four samples of the sine, and two waves drawn through them.
lab::Tap samples{"samples", "The samples", lab::kCurve, lab::kKit, 1};
lab::Tap wave{"wave", "The wave at the frequency set", lab::kCurve, lab::kLesson, 1};
lab::Tap alias{"alias", "The lowest wave through the same samples", lab::kCurve, lab::kLesson, 1};

// Where a sine comes out, against where it was set.
lab::Tap folding{"folding", "Peak of the spectrum, measured", lab::kCurve, lab::kKit, 1, "Hz"};
lab::Tap fold_formula{"foldFormula", "The folding formula", lab::kCurve, lab::kLesson, 1, "Hz"};

// Twenty-four samples of the phase the shapes are read from, and the ramp it steps along.
lab::Tap phase{"phase", "The phase, a sample at a time", lab::kCurve, lab::kKit, 1};
lab::Tap phase_line{"phaseLine", "The phase on paper", lab::kCurve, lab::kLesson, 1};

lab::Tap edge_ideal{"edgeIdeal", "The saw as drawn on paper", lab::kCurve, lab::kLesson, 1};
lab::Tap edge_smooth{"edgeSmooth", "The saw with its edge spread", lab::kCurve, lab::kLesson, 1};
lab::Tap edge_naive{"edgeNaive", "Naive samples", lab::kCurve, lab::kLesson, 1};
lab::Tap edge_kit{"edgeKit", "The kit's samples", lab::kCurve, lab::kKit, 1};

// Each partial of the saw by itself, against the frequency it has before it folds.
lab::Tap partials_naive{"partialsNaive", "Partials of the naive saw", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap partials_kit{"partialsKit", "Partials of the kit's saw", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap reduction{"reduction", "What the step correction takes off, measured", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap reduction_formula{"reductionFormula", "The formula", lab::kCurve, lab::kLesson, 1, "dB"};
// The same for the triangle, which has odd partials only.
lab::Tap corner_naive{"cornerNaive", "Partials of the naive triangle", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap corner_kit{"cornerKit", "Partials of the kit's triangle", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap corner_taken{"cornerTaken", "What the slope correction takes off, measured", lab::kCurve, lab::kKit, 1, "dB"};

lab::Check table_error{"tableError", "The kit's table sine against the exact sine of the same phase", "dB"};
lab::Check fold_error{"foldError", "The measured peaks against the folding formula, at worst", "Hz"};
lab::Check lands{"lands", "The formula says this sine comes out at", "Hz"};
lab::Check sum_error{"sumError", "The naive saw with the correction added, against the kit's saw", "dB"};
lab::Check smooth_error{"smoothError", "The saw's measured partials against the formula, at worst", "dB"};
lab::Check corner_error{"cornerError", "The triangle's measured partials against the same formula, at worst", "dB"};
lab::Check built_saw{"builtSaw", "The build stopped at the step correction, against the kit's saw", "dB"};

// ---------------------------------------------------------------------------
// The build part: the kit's shaped oscillator, a piece at a time.

// The pieces, in the order the steps add them.
enum Piece : int { kPhase = 0, kRamp = 1, kStep = 2, kFold = 3, kSlope = 4 };

struct Pieces {
  int pieces = kPhase;
  float phase = 0.0f;  // how far through its cycle the wave is, from 0 to 1
  float inc = 0.0f;    // how much of a cycle goes by in one sample
  float fix = 0.0f;    // what a correction added to the last sample

  // A phase that wraps: one step further each sample, and back by a whole cycle at the end of one.
  void advance(float increment) {
    inc = kit::clamp(increment, 1.0e-7f, 0.49f);
    phase += inc;
    if (phase >= 1.0f) phase -= 1.0f;
  }

  // To hear the phase before it has a shape, the kit's sine table is read at it.
  float tone() const { return kit::SineTable::lookup(phase); }

  // A naive saw: the phase itself, stretched to run from -1 to 1.
  float ramp() const { return 2.0f * phase - 1.0f; }

  // The step correction: how far a sample beside a drop stands from the drop spread over two samples.
  float step_fix() const {
    float t = phase;
    if (t < inc) {  // the drop is behind this sample, t samples back
      t /= inc;
      return t + t - t * t - 1.0f;
    }
    if (t > 1.0f - inc) {  // the drop is ahead of this sample, -t samples on
      t = (t - 1.0f) / inc;
      return t * t + t + t + 1.0f;
    }
    return 0.0f;
  }

  // A naive triangle: the ramp folded at its middle, so it goes up and comes back.
  float fold() const { return phase < 0.5f ? 4.0f * phase - 1.0f : 3.0f - 4.0f * phase; }

  // The slope correction: how far a sample beside a corner stands from the corner rounded over two samples.
  float corner(float t) const {
    if (t < inc) {
      t = 1.0f - t / inc;
      return t * t * t / 6.0f;
    }
    if (t > 1.0f - inc) {
      t = (t - 1.0f) / inc + 1.0f;
      return t * t * t / 6.0f;
    }
    return 0.0f;
  }
  float slope_fix() const {
    const float half_on = phase + 0.5f;  // the other corner is half a cycle away
    return 8.0f * inc * (corner(phase) - corner(half_on >= 1.0f ? half_on - 1.0f : half_on));
  }

  // One sample through the pieces built so far.
  float run(float increment) {
    advance(increment);
    fix = 0.0f;
    if (pieces < kRamp) return tone();
    if (pieces < kFold) {
      if (pieces >= kStep) fix = -step_fix();
      return ramp() + fix;
    }
    if (pieces >= kSlope) fix = slope_fix();
    return fold() + fix;
  }
};

lab::Build build{"A phase that wraps|A naive saw|The step correction|A naive triangle|The slope correction", kSlope,
                 -120.0f, "The oscillator as built, all five pieces, against the kit's own triangle"};

Pieces shown;      // at the step the reader chose: what the built taps hold
Pieces held;       // with every piece: what is compared with the kit's triangle
Pieces saw_built;  // stopped at the step correction: what is compared with the kit's saw

lab::Tap built{"built", "The oscillator so far", lab::kAudio, lab::kLesson, 1};
lab::Tap built_fix{"builtFix", "The correction, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_phase{"builtPhase", "The phase, as built", lab::kCurve, lab::kLesson, 1};

// The frame the partials are measured in. A saw whose step is an odd number
// of 32768ths of a cycle repeats exactly every 32768 samples, in floats too,
// and each of its partials falls on a bin of its own.
constexpr int kFrame = 32768;
kit::Fft<kFrame> frame_fft;

constexpr float kSawStart = 0.02f;

// The rising sine is played at a quarter of full scale: it crosses the frequencies an ear is keenest at.
constexpr float kSweepPeak = 0.25f;

// The step, in cycles a sample, of the frequency nearest `hz` that fits the loop whole.
float whole_cycles(float hz, int frames) {
  const long long cycles = std::llround(static_cast<double>(hz) * frames / lab::kSampleRate);
  return static_cast<float>(static_cast<double>(cycles) / frames);
}

// Where a frequency comes out once it is sampled: the distance to the nearest
// multiple of the sample rate.
float folded(float hz) {
  const float turns = std::floor(hz / lab::kSampleRate + 0.5f);
  return std::fabs(hz - turns * lab::kSampleRate);
}

double wrap(double phase) { return phase - std::floor(phase); }

void draw_samples(float inc) {
  constexpr int kSamples = 24;
  constexpr int kFine = 40;
  if (!samples.open(kSamples + 1) || !wave.open(kSamples * kFine + 1) || !alias.open(kSamples * kFine + 1)) return;
  samples.x0 = wave.x0 = alias.x0 = 0.0f;
  samples.x1 = wave.x1 = alias.x1 = static_cast<float>(kSamples);
  kit::SineOsc osc;
  osc.reset();
  for (int n = 0; n <= kSamples; ++n) samples.set(n, osc.next(inc));
  // The same samples belong to the step less a whole number of cycles: the
  // smallest such step is the lowest wave through them.
  const double low = static_cast<double>(inc) - std::floor(static_cast<double>(inc) + 0.5);
  for (int p = 0; p <= kSamples * kFine; ++p) {
    const double at = static_cast<double>(p) / kFine;
    wave.set(p, static_cast<float>(std::sin(2.0 * lab::kPi * at * inc)));
    alias.set(p, static_cast<float>(std::sin(2.0 * lab::kPi * at * low)));
  }
}

// Twenty-four samples of the phase the kit's shapes are read from, the ramp
// they stand on, and the same samples of the build's own phase.
void draw_phase(float inc) {
  constexpr int kSamples = 24;
  constexpr int kFine = 40;
  if (!phase.open(kSamples + 1) || !built_phase.open(kSamples + 1) || !phase_line.open(kSamples * kFine + 1)) return;
  phase.x0 = built_phase.x0 = phase_line.x0 = 0.0f;
  phase.x1 = built_phase.x1 = phase_line.x1 = static_cast<float>(kSamples);
  kit::BlepOsc osc;
  osc.reset(kSawStart);
  Pieces own;
  own.phase = kSawStart;
  for (int n = 0; n <= kSamples; ++n) {
    osc.saw(inc);
    own.advance(inc);
    phase.set(n, osc.phase());
    built_phase.set(n, own.phase);
  }
  // Sample n is read after n + 1 steps.
  const float step = osc.inc_;
  for (int p = 0; p <= kSamples * kFine; ++p) {
    const double at = static_cast<double>(p) / kFine;
    phase_line.set(p, static_cast<float>(wrap(kSawStart + (at + 1.0) * static_cast<double>(step))));
  }
}

// What lab_setup measured of the folding, kept for every render.
constexpr int kFoldPoints = 48;
constexpr int kFoldFormulaPoints = 97;
float folding_points[kFoldPoints];
float fold_formula_points[kFoldFormulaPoints];
float fold_error_found = 0.0f;

// A sine at each of 48 frequencies from 500 Hz to 47.5 kHz through the kit's
// oscillator, one frame each, and where the peak of its spectrum stands. No
// control and no source reaches it, so this runs once.
void measure_folding() {
  for (int p = 0; p < kFoldFormulaPoints; ++p) fold_formula_points[p] = folded(500.0f * static_cast<float>(p));

  static float x[lab::kSpectrumSize];
  static float level[lab::kSpectrumBins];
  const float bin_hz = lab::kSampleRate / lab::kSpectrumSize;
  float worst = 0.0f;
  for (int p = 0; p < kFoldPoints; ++p) {
    const float hz = 500.0f + 1000.0f * static_cast<float>(p);
    kit::SineOsc osc;
    osc.reset();
    for (int n = 0; n < lab::kSpectrumSize; ++n) x[n] = osc.next(hz / lab::kSampleRate);
    lab::spectrum(x, lab::kSpectrumSize, level);
    int top = 0;
    for (int k = 1; k < lab::kSpectrumBins; ++k) {
      if (level[k] > level[top]) top = k;
    }
    // The peak lies between bins: a parabola through the top three finds it.
    float place = static_cast<float>(top);
    if (top > 0 && top < lab::kSpectrumBins - 1) {
      const float a = level[top - 1], b = level[top], c = level[top + 1];
      const float bend = a - 2.0f * b + c;
      if (bend < 0.0f) place += 0.5f * (a - c) / bend;
    }
    const float measured = place * bin_hz;
    folding_points[p] = measured;
    const float error = std::fabs(measured - folded(hz));
    if (error > worst) worst = error;
  }
  fold_error_found = worst;
}

void put_folding() {
  if (!folding.open(kFoldPoints) || !fold_formula.open(kFoldFormulaPoints)) return;
  folding.x0 = 500.0f;
  folding.x1 = 47500.0f;
  fold_formula.x0 = 0.0f;
  fold_formula.x1 = lab::kSampleRate;
  for (int p = 0; p < kFoldPoints; ++p) folding.set(p, folding_points[p]);
  for (int p = 0; p < kFoldFormulaPoints; ++p) fold_formula.set(p, fold_formula_points[p]);
  fold_error.value = fold_error_found;
}

// Seventeen samples of the saw with an edge in the middle, and the two
// continuous waves they are samples of: the saw with its upright edge, and
// the saw the kit's formula gives at every instant between the samples.
void draw_edge(float inc) {
  constexpr int kEach = 8;
  constexpr int kFine = 40;
  constexpr int kCount = 2 * kEach + 1;
  constexpr int kDense = 2 * kEach * kFine + 1;
  if (!edge_naive.open(kCount) || !edge_kit.open(kCount) || !edge_ideal.open(kDense) || !edge_smooth.open(kDense)) {
    return;
  }
  edge_naive.x0 = edge_kit.x0 = edge_ideal.x0 = edge_smooth.x0 = -static_cast<float>(kEach);
  edge_naive.x1 = edge_kit.x1 = edge_ideal.x1 = edge_smooth.x1 = static_cast<float>(kEach);
  // Sample 0 is the first after the edge, 0.65 of a sample past it.
  constexpr float kPast = 0.65f;
  kit::BlepOsc osc;
  osc.reset(kPast * inc - static_cast<float>(kEach + 1) * inc);
  for (int n = 0; n < kCount; ++n) {
    edge_kit.set(n, osc.saw(inc));
    edge_naive.set(n, 2.0f * osc.phase() - 1.0f);
  }
  const float step = osc.inc_;
  for (int p = 0; p < kDense; ++p) {
    const double at = static_cast<double>(p) / kFine - kEach;
    const float phase = static_cast<float>(wrap((kPast + at) * static_cast<double>(step)));
    const float plain = 2.0f * phase - 1.0f;
    edge_ideal.set(p, plain);
    edge_smooth.set(p, plain - kit::BlepOsc::blep(phase, step));
  }
}

// What the correction does to a partial at `hz`, as an amplitude: the square
// of sin(pi x) / (pi x), with x the frequency over the sample rate.
double triangle_response(double hz) {
  const double x = lab::kPi * hz / lab::kSampleRate;
  if (std::fabs(x) < 1.0e-9) return 1.0;
  const double s = std::sin(x) / x;
  return s * s;
}

// The level of one bin of a frame the kit transformed with no window, in dB
// where a full-scale sine reads 0. Under -140 there is nothing to tell from rounding.
float bin_db(const float* re, const float* im, int bin) {
  const double size = (2.0 / kFrame) * std::sqrt(static_cast<double>(re[bin]) * re[bin] +
                                                 static_cast<double>(im[bin]) * im[bin]);
  return size > 1.0e-7 ? static_cast<float>(20.0 * std::log10(size)) : -140.0f;
}

// Each partial of the shapes, measured apart. One frame of each at the
// nearest frequency that repeats in the frame, transformed with no window:
// partial k of a wave stepping p / 32768 of a cycle a sample is alone on bin
// k·p (taken round the frame and folded), wherever it lands.
void measure_partials(float hz) {
  int odd = 2 * static_cast<int>(std::floor(static_cast<double>(hz) * kFrame / lab::kSampleRate / 2.0)) + 1;
  if (odd < 1) odd = 1;
  const float inc = static_cast<float>(odd) / kFrame;
  const double f0 = static_cast<double>(odd) * lab::kSampleRate / kFrame;
  int count = static_cast<int>(2.0 * lab::kSampleRate / f0);  // partials up to twice the sample rate
  if (count > kFrame / 2 - 1) count = kFrame / 2 - 1;
  if (count < 2) count = 2;
  const auto bin_of = [odd](int k) {
    const int bin = static_cast<int>((static_cast<long long>(k) * odd) % kFrame);
    return bin > kFrame / 2 ? kFrame - bin : bin;
  };

  constexpr int kFormulaPoints = 385;
  if (!reduction_formula.open(kFormulaPoints)) return;
  reduction_formula.x0 = 0.0f;
  reduction_formula.x1 = 2.0f * lab::kSampleRate;
  for (int p = 0; p < kFormulaPoints; ++p) {
    const double response = triangle_response(250.0 * p);
    reduction_formula.set(p, response > 1.0e-6 ? static_cast<float>(20.0 * std::log10(response)) : -120.0f);
  }

  float* kit_re = lab::take(kFrame);
  float* kit_im = lab::take(kFrame);
  float* naive_re = lab::take(kFrame);
  float* naive_im = lab::take(kFrame);
  if (!kit_re || !kit_im || !naive_re || !naive_im) return;
  kit::BlepOsc osc;
  osc.reset();
  for (int n = 0; n < kFrame; ++n) {
    kit_re[n] = osc.saw(inc);
    naive_re[n] = 2.0f * osc.phase() - 1.0f;
  }
  frame_fft.forward(kit_re, kit_im);
  frame_fft.forward(naive_re, naive_im);

  if (!partials_naive.open(count) || !partials_kit.open(count) || !reduction.open(count)) return;
  partials_naive.x0 = partials_kit.x0 = reduction.x0 = static_cast<float>(f0);
  partials_naive.x1 = partials_kit.x1 = reduction.x1 = static_cast<float>(f0 * count);
  float worst = 0.0f;
  for (int k = 1; k <= count; ++k) {
    const float plain_db = bin_db(naive_re, naive_im, bin_of(k));
    const float band_db = bin_db(kit_re, kit_im, bin_of(k));
    const float taken = band_db - plain_db < -120.0f ? -120.0f : band_db - plain_db;
    partials_naive.set(k - 1, plain_db);
    partials_kit.set(k - 1, band_db);
    reduction.set(k - 1, taken);
    // Held to the formula wherever the formula leaves something to measure.
    const double response = triangle_response(f0 * k);
    if (response > 1.0e-3) {
      const float error = std::fabs(taken - static_cast<float>(20.0 * std::log10(response)));
      if (error > worst) worst = error;
    }
  }
  smooth_error.value = worst;

  // The triangle, in the same frames: its even partials are nothing, so only the odd ones are kept.
  for (int n = 0; n < kFrame; ++n) kit_im[n] = naive_im[n] = 0.0f;
  osc.reset();
  for (int n = 0; n < kFrame; ++n) {
    kit_re[n] = osc.triangle(inc);
    naive_re[n] = osc.phase() < 0.5f ? 4.0f * osc.phase() - 1.0f : 3.0f - 4.0f * osc.phase();
  }
  frame_fft.forward(kit_re, kit_im);
  frame_fft.forward(naive_re, naive_im);

  const int odd_count = (count + 1) / 2;
  if (!corner_naive.open(odd_count) || !corner_kit.open(odd_count) || !corner_taken.open(odd_count)) return;
  corner_naive.x0 = corner_kit.x0 = corner_taken.x0 = static_cast<float>(f0);
  corner_naive.x1 = corner_kit.x1 = corner_taken.x1 = static_cast<float>(f0 * (2 * odd_count - 1));
  worst = 0.0f;
  for (int j = 0; j < odd_count; ++j) {
    const int k = 2 * j + 1;
    const float plain_db = bin_db(naive_re, naive_im, bin_of(k));
    const float band_db = bin_db(kit_re, kit_im, bin_of(k));
    const float taken = band_db - plain_db < -120.0f ? -120.0f : band_db - plain_db;
    corner_naive.set(j, plain_db);
    corner_kit.set(j, band_db);
    corner_taken.set(j, taken);
    // A triangle's partials fall away twice as fast as a saw's: held where the
    // naive one stands above -90 dB and the formula leaves a hundredth of it.
    const double response = triangle_response(f0 * k);
    if (response > 1.0e-2 && plain_db > -90.0f) {
      const float error = std::fabs(taken - static_cast<float>(20.0 * std::log10(response)));
      if (error > worst) worst = error;
    }
  }
  corner_error.value = worst;
}

}  // namespace

void lab_setup() {
  kit::SineTable::init();
  frame_fft.init();
  measure_folding();
}

void lab_render(int frames) {
  const float sine_inc = whole_cycles(freq.value, frames);
  const float saw_inc = whole_cycles(note.value, frames);
  sine_osc.reset();
  sweep_osc.reset();
  saw_osc.reset(kSawStart);
  triangle_osc.reset(kSawStart);
  shown = held = saw_built = Pieces{};
  shown.phase = held.phase = saw_built.phase = kSawStart;
  shown.pieces = build.at();
  held.pieces = build.compared_step;
  saw_built.pieces = kStep;

  double table_diff = 0.0, table_ref = 0.0;
  double sum_diff = 0.0, sum_ref = 0.0;
  double held_diff = 0.0, held_ref = 0.0;
  double saw_diff = 0.0, saw_ref = 0.0;
  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const int at = i % frames;

    // The rising sine: its step grows evenly from nothing to a whole cycle
    // a sample, so that the loop ends where it began.
    sweep.put(i, kSweepPeak * sweep_osc.next(static_cast<float>((at + 0.5) / frames)));

    // The sine: the kit reads its table at the phase, then steps the phase on.
    const double turn = sine_osc.phase;
    const float s = sine_osc.next(sine_inc);
    const double exact = std::sin(2.0 * lab::kPi * turn);
    table_diff += (s - exact) * (s - exact);
    table_ref += exact * exact;
    sine.put(i, s);

    // Glide: up over the first half of the loop, back over the second.
    float inc = saw_inc;
    if (glide.value > 0.0f) {
      const float along = static_cast<float>(at) / static_cast<float>(frames);
      inc *= std::exp2(glide.value * (along < 0.5f ? 2.0f * along : 2.0f - 2.0f * along));
    }

    // The saw: the kit's, then its two terms apart, from the kit's own phase.
    const float band = saw_osc.saw(inc);
    const float plain = 2.0f * saw_osc.phase() - 1.0f;
    const float fix = -kit::BlepOsc::blep(saw_osc.phase(), saw_osc.inc_);
    const double apart = static_cast<double>(plain + fix) - band;
    sum_diff += apart * apart;
    sum_ref += static_cast<double>(band) * band;
    naive.put(i, plain);
    correction.put(i, fix);
    saw.put(i, band);

    // The triangle: the kit's, and its first term from the kit's own phase.
    const float rounded = triangle_osc.triangle(inc);
    const float turned = triangle_osc.phase();
    triangle_naive.put(i, turned < 0.5f ? 4.0f * turned - 1.0f : 3.0f - 4.0f * turned);
    triangle.put(i, rounded);

    // The build: the step chosen, and the two that are held to the kit.
    built.put(i, shown.run(inc));
    built_fix.put(i, shown.fix);
    const double held_apart = static_cast<double>(held.run(inc)) - rounded;
    held_diff += held_apart * held_apart;
    held_ref += static_cast<double>(rounded) * rounded;
    const double saw_apart = static_cast<double>(saw_built.run(inc)) - band;
    saw_diff += saw_apart * saw_apart;
    saw_ref += static_cast<double>(band) * band;
  }
  table_error.value = table_ref > 0.0 ? lab::ratio_db(table_diff, table_ref) : lab::kFloorDb;
  sum_error.value = sum_ref > 0.0 ? lab::ratio_db(sum_diff, sum_ref) : lab::kFloorDb;
  build.difference.value = lab::ratio_db(held_diff, held_ref);
  built_saw.value = lab::ratio_db(saw_diff, saw_ref);
  lands.value = folded(sine_inc * lab::kSampleRate);

  lab::spectrogram_tap(sweep_picture, sweep.data, sweep.length);
  lab::spectrogram_tap(naive_picture, naive.data, naive.length);
  lab::spectrogram_tap(saw_picture, saw.data, saw.length);

  draw_samples(sine_inc);
  put_folding();
  draw_phase(saw_inc);
  draw_edge(saw_inc);
  measure_partials(note.value);
}
