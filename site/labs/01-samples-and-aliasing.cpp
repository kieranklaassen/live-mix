// Lesson 1, samples, sine waves and aliasing: the kit's oscillators
// (cpp/kit/osc.h) and the sine table they read (cpp/kit/math.h), run bare.
//
//   SineOsc ──► sine                      a sine at any frequency up to the sample rate
//   BlepOsc ──► phase ──► 2·phase − 1 ──► naive ──┐
//                    └──► −blep(phase, inc) ──────┴──► saw
//
// Computed by the kit: the sine (kit::SineOsc, which sets no limit on its
// step, so it can be asked for a frequency past half the sample rate), the
// band-limited saw (kit::BlepOsc::saw) and its correction (the kit's own
// blep(), a private function the lab is allowed to call).
//
// Written for the lesson: the naive saw, which is the first term of the kit's
// saw worked out again from the kit's phase; the continuous waves the
// pictures draw between the samples; the folding formula; and the formula
// for what the correction does to each partial. Three checks hold these to
// the kit on every render.
//
// Both oscillators are set to the nearest frequency that fits the loop a
// whole number of times, so the loop comes round without a seam. The sine
// starts at phase 0. The saw starts a fiftieth of a cycle in, so that at the
// round frequencies a page is likely to be set to, no drop of the saw falls
// exactly on a sample.

#include "lab.h"

using namespace livemix;

namespace {

constexpr double kPiD = 3.14159265358979323846;

kit::SineOsc sine_osc;
kit::BlepOsc saw_osc;

lab::Control freq{"freq", "Sine frequency", "Hz", 0.0f, 48000.0f, 2000.0f};
lab::Control note{"note", "Saw frequency", "Hz", 55.0f, 8000.0f, 3840.0f, lab::kLog};

// The loop, in the lesson's order. Play starts on the last of these.
lab::Tap sine{"sine", "Sine, sampled", lab::kAudio, lab::kKit, 1};
lab::Tap naive{"naive", "Naive saw", lab::kAudio, lab::kLesson, 1};
lab::Tap correction{"correction", "The correction", lab::kAudio, lab::kKit, 1};
lab::Tap saw{"saw", "The kit's saw", lab::kAudio, lab::kKit, 1};

// Twenty-four samples of the sine, and two waves drawn through them.
lab::Tap samples{"samples", "The samples", lab::kCurve, lab::kKit, 1};
lab::Tap wave{"wave", "The wave at the frequency set", lab::kCurve, lab::kLesson, 1};
lab::Tap alias{"alias", "The lowest wave through the same samples", lab::kCurve, lab::kLesson, 1};

// Where a sine comes out, against where it was set.
lab::Tap folding{"folding", "Peak of the spectrum, measured", lab::kCurve, lab::kKit, 1, "Hz"};
lab::Tap fold_formula{"foldFormula", "The folding formula", lab::kCurve, lab::kLesson, 1, "Hz"};

// Sixteen samples around one edge of the saw.
lab::Tap edge_ideal{"edgeIdeal", "The saw as drawn on paper", lab::kCurve, lab::kLesson, 1};
lab::Tap edge_smooth{"edgeSmooth", "The saw with its edge spread", lab::kCurve, lab::kLesson, 1};
lab::Tap edge_naive{"edgeNaive", "Naive samples", lab::kCurve, lab::kLesson, 1};
lab::Tap edge_kit{"edgeKit", "The kit's samples", lab::kCurve, lab::kKit, 1};

// Each partial of the saw by itself, against the frequency it has before it folds.
lab::Tap partials_naive{"partialsNaive", "Partials of the naive saw", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap partials_kit{"partialsKit", "Partials of the kit's saw", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap reduction{"reduction", "What the correction takes off, measured", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap reduction_formula{"reductionFormula", "The formula", lab::kCurve, lab::kLesson, 1, "dB"};

lab::Check table_error{"tableError", "The kit's table sine against the exact sine of the same phase", "dB"};
lab::Check fold_error{"foldError", "The measured peaks against the folding formula, at worst", "Hz"};
lab::Check lands{"lands", "The formula says this sine comes out at", "Hz"};
lab::Check sum_error{"sumError", "The naive saw with the correction added, against the kit's saw", "dB"};
lab::Check smooth_error{"smoothError", "The measured partials against the formula, at worst", "dB"};

// The frame the partials are measured in. A saw whose step is an odd number
// of 32768ths of a cycle repeats exactly every 32768 samples, in floats too,
// and each of its partials falls on a bin of its own.
constexpr int kFrame = 32768;
kit::Fft<kFrame> frame_fft;

constexpr float kSawStart = 0.02f;

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

// The sine's samples, and the waves that pass through them.
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
    wave.set(p, static_cast<float>(std::sin(2.0 * kPiD * at * inc)));
    alias.set(p, static_cast<float>(std::sin(2.0 * kPiD * at * low)));
  }
}

// A sine at each of 48 frequencies from 500 Hz to 47.5 kHz through the kit's
// oscillator, one frame each, and where the peak of its spectrum stands.
void measure_folding() {
  constexpr int kPoints = 48;
  constexpr int kFormulaPoints = 97;
  if (!folding.open(kPoints) || !fold_formula.open(kFormulaPoints)) return;
  folding.x0 = 500.0f;
  folding.x1 = 47500.0f;
  fold_formula.x0 = 0.0f;
  fold_formula.x1 = lab::kSampleRate;
  for (int p = 0; p < kFormulaPoints; ++p) fold_formula.set(p, folded(500.0f * static_cast<float>(p)));

  float* x = lab::take(lab::kSpectrumSize);
  float* level = lab::take(lab::kSpectrumBins);
  if (!x || !level) return;
  const float bin_hz = lab::kSampleRate / lab::kSpectrumSize;
  float worst = 0.0f;
  for (int p = 0; p < kPoints; ++p) {
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
    folding.set(p, measured);
    const float error = std::fabs(measured - folded(hz));
    if (error > worst) worst = error;
  }
  fold_error.value = worst;
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
  const double x = kPiD * hz / lab::kSampleRate;
  if (std::fabs(x) < 1.0e-9) return 1.0;
  const double s = std::sin(x) / x;
  return s * s;
}

// Each partial of the two saws, measured apart. One frame of each at the
// nearest frequency that repeats in the frame, transformed with no window:
// partial k of a saw stepping p / 32768 of a cycle a sample is alone on bin
// k·p (taken round the frame and folded), wherever it lands.
void measure_partials(float hz) {
  int odd = 2 * static_cast<int>(std::floor(static_cast<double>(hz) * kFrame / lab::kSampleRate / 2.0)) + 1;
  if (odd < 1) odd = 1;
  const float inc = static_cast<float>(odd) / kFrame;
  const double f0 = static_cast<double>(odd) * lab::kSampleRate / kFrame;
  int count = static_cast<int>(2.0 * lab::kSampleRate / f0);  // partials up to twice the sample rate
  if (count > kFrame / 2 - 1) count = kFrame / 2 - 1;
  if (count < 2) count = 2;

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
    int bin = static_cast<int>((static_cast<long long>(k) * odd) % kFrame);
    if (bin > kFrame / 2) bin = kFrame - bin;
    const double scale = 2.0 / kFrame;
    const double plain = scale * std::sqrt(static_cast<double>(naive_re[bin]) * naive_re[bin] +
                                           static_cast<double>(naive_im[bin]) * naive_im[bin]);
    const double band = scale * std::sqrt(static_cast<double>(kit_re[bin]) * kit_re[bin] +
                                          static_cast<double>(kit_im[bin]) * kit_im[bin]);
    const float plain_db = plain > 1.0e-7 ? static_cast<float>(20.0 * std::log10(plain)) : -140.0f;
    const float band_db = band > 1.0e-7 ? static_cast<float>(20.0 * std::log10(band)) : -140.0f;
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
}

}  // namespace

void lab_setup() {
  kit::SineTable::init();
  frame_fft.init();
}

void lab_render(int frames) {
  const float sine_inc = whole_cycles(freq.value, frames);
  const float saw_inc = whole_cycles(note.value, frames);
  sine_osc.reset();
  saw_osc.reset(kSawStart);

  double table_diff = 0.0, table_ref = 0.0;
  double sum_diff = 0.0, sum_ref = 0.0;
  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    // The sine: the kit reads its table at the phase, then steps the phase on.
    const double phase = sine_osc.phase;
    const float s = sine_osc.next(sine_inc);
    const double exact = std::sin(2.0 * kPiD * phase);
    table_diff += (s - exact) * (s - exact);
    table_ref += exact * exact;
    sine.put(i, s);

    // The saw: the kit's, then its two terms apart, from the kit's own phase.
    const float band = saw_osc.saw(saw_inc);
    const float plain = 2.0f * saw_osc.phase() - 1.0f;
    const float fix = -kit::BlepOsc::blep(saw_osc.phase(), saw_osc.inc_);
    const double apart = static_cast<double>(plain + fix) - band;
    sum_diff += apart * apart;
    sum_ref += static_cast<double>(band) * band;
    naive.put(i, plain);
    correction.put(i, fix);
    saw.put(i, band);
  }
  table_error.value =
      table_ref > 0.0 && table_diff / table_ref > 1.0e-14 ? static_cast<float>(10.0 * std::log10(table_diff / table_ref))
                                                         : lab::kFloorDb;
  sum_error.value =
      sum_ref > 0.0 && sum_diff / sum_ref > 1.0e-14 ? static_cast<float>(10.0 * std::log10(sum_diff / sum_ref))
                                                    : lab::kFloorDb;
  lands.value = folded(sine_inc * lab::kSampleRate);

  draw_samples(sine_inc);
  measure_folding();
  draw_edge(saw_inc);
  measure_partials(note.value);
}
