// Native harness for Warp (cpp/devices/warp). The conformance pass covers stability, silence when
// idle, block-size independence and parameter abuse; the rest asserts what makes it a warp: where
// the partials land.

#include "../devices/warp/warp.h"
#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::Warp;
namespace p = livemix::warp;

static Warp device;

static const float kRate = 48000.0f;
static const size_t kLate = Warp::kLatency;

// The device with nothing moving by itself: no drift, no width, all wet.
static void still(Warp& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// `count` harmonics of `hz`, each at `gain / n`.
static std::vector<float> harmonics(float hz, int count, float seconds, float gain, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (int n = 1; n <= count; ++n) {
    for (size_t i = 0; i < out.size(); ++i) {
      out[i] += gain / n * static_cast<float>(std::sin(2.0 * kPi * hz * n * static_cast<double>(i) / rate));
    }
  }
  return out;
}

static double cents(double a, double b) { return 1200.0 * std::log2(a / b); }

// The strongest frequency within `span` cents of `guess` over [from, to): a scan, then two finer ones.
static double partial_near(const std::vector<float>& x, double guess, double span, size_t from, size_t to,
                           float rate = kRate) {
  double best_hz = guess, best = -1.0;
  double centre = guess;
  for (int pass = 0; pass < 3; ++pass) {
    for (int i = -12; i <= 12; ++i) {
      const double hz = centre * std::pow(2.0, span * i / 12.0 / 1200.0);
      const double level = tone_level(x, hz, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = hz;
      }
    }
    centre = best_hz;
    span /= 8.0;
  }
  return best_hz;
}

// What is left of x over [from, to) once the sine at `hz` is taken out by least squares, as RMS.
static double residual(const std::vector<float>& x, double hz, size_t from, size_t to) {
  double ss = 0, cc = 0, sc = 0, xs = 0, xc = 0;
  for (size_t i = from; i < to; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    const double s = std::sin(phase), c = std::cos(phase);
    ss += s * s;
    cc += c * c;
    sc += s * c;
    xs += x[i] * s;
    xc += x[i] * c;
  }
  const double det = ss * cc - sc * sc;
  const double a = (xs * cc - xc * sc) / det, b = (xc * ss - xs * sc) / det;
  double sum = 0;
  for (size_t i = from; i < to; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    const double r = x[i] - a * std::sin(phase) - b * std::cos(phase);
    sum += r * r;
  }
  return std::sqrt(sum / static_cast<double>(to - from));
}

// The worst difference between `out` and `in` delayed by the latency, from `from` on.
static double off_by(const std::vector<float>& out, const std::vector<float>& in, float gain = 1.0f, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i + kLate < in.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(out[i + kLate]) - static_cast<double>(gain * in[i])));
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "warp";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // 1. Where the partials land: ten harmonics on the pivot come out at pivot × n^e, e = 2^stretch, each
  // at the level it came in at.
  {
    const std::vector<float> tone = harmonics(220.0f, 10, 2.0f, 0.3f);
    double worst_cents = 0.0, worst_db = 0.0;
    for (float stretch : {-0.6f, 0.3f, 0.8f}) {
      still(device);
      device.set_param(p::kStretch, stretch);
      device.set_param(p::kPivot, 220.0f);
      const Stereo out = run(device, tone);
      const double e = std::pow(2.0, stretch);
      for (int n = 1; n <= 10; ++n) {
        const double want = 220.0 * std::pow(n, e);
        const double got = partial_near(out.left, want, 60.0, 48000, 90000);
        worst_cents = std::max(worst_cents, std::fabs(cents(got, want)));
        worst_db = std::max(worst_db, std::fabs(db(tone_level(out.left, got, kRate, 48000, 90000) / (0.3 / n))));
      }
      EXPECT_NEAR(db(rms(out.left, 48000) / rms(tone)), 0.0, 0.5, "the level of a harmonic tone holds");
    }
    std::printf("partials at pivot x n^e: worst %.3f cents, worst level %.3f dB\n", worst_cents, worst_db);
    EXPECT(worst_cents < 1.0, "ten harmonics on the pivot land at pivot x n^e within a cent, at three stretches");
    EXPECT(worst_db < 0.3, "and each at the level it had");
  }

  // 2. The pivot does not move: a sine on it comes out as it went in, whatever the stretch (what is left
  // over is the far skirt of its window, which other regions carry off: 55 dB under it or less).
  {
    const std::vector<float> tone = sine(220.0f, 1.5f, kRate, 0.5f);
    double worst = 0.0;
    for (float stretch : {-1.0f, 1.0f}) {
      still(device);
      device.set_param(p::kStretch, stretch);
      device.set_param(p::kPivot, 220.0f);
      const Stereo out = run(device, tone);
      worst = std::max(worst, off_by(out.left, tone, 1.0f, 24000));
    }
    std::printf("a sine on the pivot: off the input by %.3g (%.1f dB under it)\n", worst, -db(worst / 0.5));
    EXPECT(worst < 1.0e-3, "a sine on the pivot is the input, a latency late, to 54 dB");
    // And a sine an octave over the pivot goes up by e octaves, and is still one sine.
    still(device);
    device.set_param(p::kStretch, 0.5f);
    device.set_param(p::kPivot, 220.0f);
    const Stereo out = run(device, sine(440.0f, 1.5f, kRate, 0.5f));
    const double want = 220.0 * std::pow(2.0, std::pow(2.0, 0.5));
    EXPECT_NEAR(cents(partial_near(out.left, want, 60.0, 24000, 66000), want), 0.0, 0.5,
                "a sine an octave over the pivot lands e octaves over it");
    const double rest = db(residual(out.left, want, 24000, 66000) / (0.5 * 0.7071));
    std::printf("a sine stretched away from the pivot: the rest is %.1f dB under it\n", -rest);
    EXPECT(rest < -50.0, "and is still one sine: nothing else within 50 dB of it");
  }

  // 3. Stretch in the middle with Shift at 0 is the input, a latency late; Mix 0 is the input bit for bit;
  // and part way the dry path is in step with the wet one and what has not moved keeps its level (the
  // sum is the input again: no comb, and none of the 3 dB an equal-power crossfade adds to a copy).
  {
    rng_state() = 77;
    std::vector<float> in = noise(1.0f, kRate, 0.4f);
    const std::vector<float> chord = harmonics(196.0f, 12, 1.0f, 0.2f);
    for (size_t i = 0; i < in.size(); ++i) in[i] = 0.3f * in[i] + chord[i];
    still(device);
    device.set_param(p::kStretch, 0.0f);
    Stereo out = run(device, in);
    const double wet = off_by(out.left, in);
    std::printf("stretch 0, shift 0: the wet path is off the input by %.3g\n", wet);
    EXPECT(wet < 2.0e-6, "Stretch 0 and Shift 0: the wet path is the input, a latency late");
    EXPECT(out.left == out.right, "mono in, mono out, bit for bit, at Width 0");

    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    out = run(device, in);
    bool same = true;
    for (size_t i = 0; i + kLate < in.size(); ++i) same = same && out.left[i + kLate] == in[i] && out.right[i + kLate] == in[i];
    EXPECT(same, "Mix 0 is the input, a latency late, bit for bit (at the default stretch)");
    EXPECT(peak(out.left, 0, kLate) == 0.0, "and nothing before it");

    still(device);
    device.set_param(p::kStretch, 0.0f);
    device.set_param(p::kMix, 0.5f);
    out = run(device, in);
    const double part_way = off_by(out.left, in);
    std::printf("Mix 0.5 with nothing moved: off the input by %.3g\n", part_way);
    EXPECT(part_way < 2.0e-6, "Mix 0.5 with nothing moved is the input: dry and wet in step, and no 3 dB added");
  }

  // 4. Sines stay sines: a sine moved by any part of a bin comes out one sine at the new pitch, at its
  // level, with everything else at least 50 dB under it.
  {
    double worst_residual = -200.0, worst_level = 0.0, worst_cents = 0.0;
    for (float hz : {220.0f, 3000.0f}) {
      const std::vector<float> tone = sine(hz, 1.5f, kRate, 0.5f);
      for (float semitones = 0.07f; semitones < 2.0f; semitones += 0.13f) {
        still(device);
        device.set_param(p::kStretch, 0.0f);
        device.set_param(p::kShift, semitones);
        const Stereo out = run(device, tone);
        const double want = hz * std::pow(2.0, semitones / 12.0);
        const double got = partial_near(out.left, want, 30.0, 24000, 66000);
        worst_cents = std::max(worst_cents, std::fabs(cents(got, want)));
        worst_level = std::max(worst_level, std::fabs(db(tone_level(out.left, got, kRate, 24000, 66000) / 0.5)));
        worst_residual = std::max(worst_residual, db(residual(out.left, want, 24000, 66000) / (0.5 * 0.7071)));
      }
    }
    std::printf("a moved sine: pitch within %.3f cents, level within %.3f dB, the rest %.1f dB under it\n",
                worst_cents, worst_level, -worst_residual);
    EXPECT(worst_cents < 0.2, "a moved sine lands on its pitch");
    EXPECT(worst_level < 0.1, "at its level, whatever part of a bin it moved by");
    EXPECT(worst_residual < -50.0, "and stays a sine: nothing else within 50 dB of it");
  }

  // 5. Shift moves everything by its semitones, the pivot too.
  {
    const std::vector<float> tone = harmonics(220.0f, 8, 1.5f, 0.3f);
    double worst = 0.0;
    for (float semitones : {-12.0f, -5.0f, 7.0f, 12.0f}) {
      still(device);
      device.set_param(p::kStretch, 0.0f);
      device.set_param(p::kShift, semitones);
      const Stereo out = run(device, tone);
      for (int n = 1; n <= 8; ++n) {
        const double want = 220.0 * n * std::pow(2.0, semitones / 12.0);
        worst = std::max(worst, std::fabs(cents(partial_near(out.left, want, 60.0, 24000, 66000), want)));
      }
    }
    std::printf("shift: worst partial %.3f cents off\n", worst);
    EXPECT(worst < 1.0, "Shift moves every partial by its semitones");
    // After a stretch: pivot × n^e × 2^(shift / 12).
    still(device);
    device.set_param(p::kStretch, 0.4f);
    device.set_param(p::kShift, 3.0f);
    const Stereo out = run(device, tone);
    const double want = 220.0 * std::pow(3.0, std::pow(2.0, 0.4)) * std::pow(2.0, 3.0 / 12.0);
    EXPECT_NEAR(cents(partial_near(out.left, want, 60.0, 24000, 66000), want), 0.0, 1.0,
                "Shift comes after the stretch");
  }

  // 6. Lean: turned up, what lies under the pivot stays and what lies over it moves; turned down, the
  // other way round.
  {
    const std::vector<float> tone = harmonics(110.0f, 8, 1.5f, 0.3f);  // 110..880 around a pivot of 440
    const double e = std::pow(2.0, 0.5);
    for (float lean : {1.0f, -1.0f, 0.5f}) {
      still(device);
      device.set_param(p::kStretch, 0.5f);
      device.set_param(p::kPivot, 440.0f);
      device.set_param(p::kLean, lean);
      const Stereo out = run(device, tone);
      const double e_below = std::pow(2.0, 0.5 * std::min(1.0, 1.0 - lean));
      const double e_above = std::pow(2.0, 0.5 * std::min(1.0, 1.0 + lean));
      const double low = 440.0 * std::pow(220.0 / 440.0, e_below);
      const double high = 440.0 * std::pow(880.0 / 440.0, e_above);
      EXPECT_NEAR(cents(partial_near(out.left, low, 60.0, 24000, 66000), low), 0.0, 1.0, "Lean: the partial under the pivot");
      EXPECT_NEAR(cents(partial_near(out.left, high, 60.0, 24000, 66000), high), 0.0, 1.0, "Lean: the partial over the pivot");
    }
    (void)e;
  }

  // 7. Width: the two sides are stretched apart, left less and right more, by kWidthDepth of the
  // stretch's range each at Width 1; a partial on the pivot stays on both sides.
  {
    const std::vector<float> tone = harmonics(220.0f, 6, 1.5f, 0.3f);
    still(device);
    device.set_param(p::kStretch, 0.3f);
    device.set_param(p::kWidth, 1.0f);
    const Stereo out = run(device, tone);
    for (int n : {1, 3, 5}) {
      const double left = 220.0 * std::pow(n, std::pow(2.0, 0.3 - Warp::kWidthDepth));
      const double right = 220.0 * std::pow(n, std::pow(2.0, 0.3 + Warp::kWidthDepth));
      EXPECT_NEAR(cents(partial_near(out.left, left, 20.0, 24000, 66000), left), 0.0, 1.0, "Width: the left partial");
      EXPECT_NEAR(cents(partial_near(out.right, right, 20.0, 24000, 66000), right), 0.0, 1.0, "Width: the right partial");
    }
    EXPECT(correlation(out.left, out.right, 24000, 66000) < 0.9, "Width makes the two sides differ");
    EXPECT_NEAR(db(rms(out.left, 24000) / rms(out.right, 24000)), 0.0, 0.3, "and keeps them as loud as each other");
  }

  // 8. Tone: over 500 Hz a slope of kToneDbPerOctave an octave at the ends (a boost stops at 12 dB);
  // under 500 Hz nothing, so a darker tone is no louder.
  {
    for (float tone : {-1.0f, -0.5f, 1.0f}) {
      for (float hz : {250.0f, 1000.0f, 4000.0f}) {
        still(device);
        device.set_param(p::kStretch, 0.0f);
        device.set_param(p::kTone, tone);
        const Stereo out = run(device, sine(hz, 1.0f, kRate, 0.2f));
        const double octaves = std::max(0.0, std::log2(static_cast<double>(hz) / Warp::kTonePivotHz));
        const double want = std::min<double>(Warp::kToneMaxBoostDb, tone * Warp::kToneDbPerOctave * octaves);
        EXPECT_NEAR(db(tone_level(out.left, hz, kRate, 24000, 44000) / 0.2), want, 0.3, "Tone: the slope over 500 Hz");
      }
    }
  }

  // 9. Drift: the stretch wanders by the clock. The wander is three sines read from the frame's number
  // (the constants are the device's), up to kDriftDepth either way; what the meter says is that formula,
  // the partials are where that stretch puts them, and a silence the device sleeps through does not
  // stop the clock.
  {
    auto wander = [](uint32_t frame) {
      double sum = 0.0;
      for (int i = 0; i < 3; ++i) {
        const uint32_t step = static_cast<uint32_t>(static_cast<double>(Warp::kDriftHz) * Warp::Stft::kHop / kRate *
                                                    Warp::kDriftRate[i] * 4294967296.0);
        const uint32_t phase = Warp::kDriftStart[i] + frame * step;
        sum += Warp::kDriftWeight[i] * std::sin(2.0 * kPi * (phase / 4294967296.0));
      }
      return sum;
    };
    const std::vector<float> second = sine(440.0f, 1.0f, kRate, 0.4f);
    still(device);
    device.set_param(p::kStretch, 0.3f);
    device.set_param(p::kDrift, 1.0f);
    double lowest = 10.0, highest = -10.0, worst_meter = 0.0, worst_cents = 0.0;
    for (int t = 1; t <= 40; ++t) {
      const Stereo out = run(device, second);
      const uint32_t frame = static_cast<uint32_t>((t * 48000 - 1) / Warp::Stft::kHop);
      const double now = device.meter(0);
      worst_meter = std::max(worst_meter, std::fabs(now - (0.3 + Warp::kDriftDepth * wander(frame))));
      lowest = std::min(lowest, now);
      highest = std::max(highest, now);
      // The partial over the last quarter second, against the stretch at the middle of it.
      const double middle = 0.3 + Warp::kDriftDepth * wander(frame - (Warp::kLatency + 6000) / Warp::Stft::kHop);
      const double want = 220.0 * std::pow(2.0, std::pow(2.0, middle));
      worst_cents = std::max(worst_cents, std::fabs(cents(partial_near(out.left, want, 40.0, 36000, 48000), want)));
    }
    std::printf("drift over 40 s: stretch %.3f to %.3f, the meter off its formula by %.2g, the partial by %.2f cents\n",
                lowest, highest, worst_meter, worst_cents);
    EXPECT(worst_meter < 1.0e-4, "Drift: the stretch in use is the clock's wander");
    EXPECT(worst_cents < 4.0, "Drift: the partial is where the wandering stretch puts it");
    EXPECT(lowest < 0.3 - 0.5 * Warp::kDriftDepth && highest > 0.3 + 0.5 * Warp::kDriftDepth, "Drift covers its range");
    EXPECT(lowest > 0.3 - Warp::kDriftDepth - 1.0e-3 && highest < 0.3 + Warp::kDriftDepth + 1.0e-3, "and stays in it");

    // Through a sleep: eight seconds of tone, and one second, five of silence and two more.
    std::vector<float> whole = sine(440.0f, 8.0f, kRate, 0.4f);
    std::vector<float> broken = whole;
    for (size_t i = 48000; i < 6 * 48000; ++i) broken[i] = 0.0f;
    still(device);
    device.set_param(p::kStretch, 0.3f);
    device.set_param(p::kDrift, 1.0f);
    const Stereo a = run(device, whole);
    const float meter_a = device.meter(0);
    still(device);
    device.set_param(p::kStretch, 0.3f);
    device.set_param(p::kDrift, 1.0f);
    const Stereo b = run(device, broken);
    EXPECT(peak(b.left, 3 * 48000, 5 * 48000) == 0.0, "(the device slept through the silence)");
    EXPECT(device.meter(0) == meter_a, "Drift keeps its place through a sleep, as a clock would");
    const double fa = partial_near(a.left, 560.0, 300.0, 7 * 48000 + 12000, 8 * 48000);
    const double fb = partial_near(b.left, 560.0, 300.0, 7 * 48000 + 12000, 8 * 48000);
    EXPECT_NEAR(cents(fb, fa), 0.0, 0.5, "and the partial is where it would have been");
  }

  // 10. Follow: the pivot goes to the lowest strong partial at or above the Pivot setting, so each note
  // of a line keeps its pitch and its overtones are stretched from it.
  {
    const double e = std::pow(2.0, 0.5);
    std::vector<float> line = harmonics(196.0f, 6, 1.5f, 0.3f);
    const std::vector<float> next = harmonics(293.66f, 6, 1.5f, 0.3f);
    line.insert(line.end(), next.begin(), next.end());
    auto with = [&](float follow, float pivot) {
      still(device);
      device.set_param(p::kStretch, 0.5f);
      device.set_param(p::kPivot, pivot);
      device.set_param(p::kFollow, follow);
      return run(device, line);
    };
    Stereo out = with(1.0f, 100.0f);
    const size_t a0 = 36000, a1 = 66000, b0 = 72000 + 36000, b1 = 72000 + 66000;
    EXPECT_NEAR(cents(partial_near(out.left, 196.0, 100.0, a0, a1), 196.0), 0.0, 1.0, "Follow: the first note keeps its pitch");
    EXPECT_NEAR(cents(partial_near(out.left, 196.0 * std::pow(3.0, e), 60.0, a0, a1), 196.0 * std::pow(3.0, e)), 0.0,
                1.0, "Follow: its third partial is stretched from it");
    EXPECT_NEAR(cents(partial_near(out.left, 293.66, 100.0, b0, b1), 293.66), 0.0, 1.0, "Follow: the second note keeps its pitch");
    EXPECT_NEAR(cents(partial_near(out.left, 293.66 * std::pow(3.0, e), 60.0, b0, b1), 293.66 * std::pow(3.0, e)), 0.0,
                1.0, "Follow: its third partial is stretched from it");
    EXPECT_NEAR(device.meter(1), 293.66, 0.3, "Follow: the pivot reported is the note");
    // Off, the pivot stays at the knob and the notes move.
    out = with(0.0f, 100.0f);
    const double moved = 100.0 * std::pow(1.96, e);
    EXPECT_NEAR(cents(partial_near(out.left, moved, 60.0, a0, a1), moved), 0.0, 1.0, "Follow off: the note is stretched from the knob");
    EXPECT(tone_level(out.left, 196.0, kRate, a0, a1) < 0.003, "Follow off: nothing is left at the note's own pitch");
    EXPECT_NEAR(device.meter(1), 100.0, 0.01, "Follow off: the pivot reported is the knob");
    // The Pivot knob is the lowest the pivot may go: over the first note's fundamental, its octave is taken.
    out = with(1.0f, 250.0f);
    EXPECT_NEAR(cents(partial_near(out.left, 392.0, 100.0, a0, a1), 392.0), 0.0, 1.0, "Follow: the lowest partial over the knob stays");

    // It stays with a note that fades under its own overtones (to 30 dB under), and with the lower of two
    // notes; when the lower one stops, it goes to the one left.
    std::vector<float> fading = harmonics(196.0f, 6, 3.0f, 0.3f);
    for (size_t i = 48000; i < fading.size(); ++i) {
      fading[i] -= 0.29f * static_cast<float>(std::sin(2.0 * kPi * 196.0 * static_cast<double>(i) / kRate));
    }
    still(device);
    device.set_param(p::kStretch, 0.5f);
    device.set_param(p::kPivot, 100.0f);
    device.set_param(p::kFollow, 1.0f);
    run(device, fading);
    EXPECT_NEAR(device.meter(1), 196.0, 0.3, "Follow: the pivot stays with a fundamental that has faded");
    std::vector<float> pair = harmonics(293.66f, 6, 3.0f, 0.2f);
    const std::vector<float> lower = harmonics(196.0f, 6, 1.5f, 0.2f);
    for (size_t i = 0; i < lower.size(); ++i) pair[i] += lower[i];
    still(device);
    device.set_param(p::kStretch, 0.5f);
    device.set_param(p::kPivot, 100.0f);
    device.set_param(p::kFollow, 1.0f);
    run(device, std::vector<float>(pair.begin(), pair.begin() + 60000));
    EXPECT_NEAR(device.meter(1), 196.0, 0.3, "Follow: of two notes, the lower is the pivot");
    run(device, std::vector<float>(pair.begin() + 60000, pair.end()));
    EXPECT_NEAR(device.meter(1), 293.66, 0.3, "Follow: when it stops, the pivot goes to the note that is left");
  }

  // 11. Bad input: NaN, infinity and 1e30 go in as silence; the output stays finite, and a latency and
  // two frames later the device is what it would have been (to the far skirts of what it missed).
  {
    const std::vector<float> good = harmonics(196.0f, 8, 2.0f, 0.25f);
    std::vector<float> bad = good;
    bad[30000] = std::nanf("");
    bad[30001] = std::numeric_limits<float>::infinity();
    bad[30002] = -1.0e30f;
    bad[30003] = 1.0e30f;
    device.init(kRate);
    device.set_param(p::kDrift, 1.0f);
    const Stereo clean = run(device, good);
    device.init(kRate);
    device.set_param(p::kDrift, 1.0f);
    const Stereo hurt = run(device, bad);
    EXPECT(finite(hurt.left) && finite(hurt.right), "NaN, infinity and 1e30 in: finite out");
    EXPECT(peak(hurt.left) < 1.0 && peak(hurt.right) < 1.0, "and no louder than the sound");
    const size_t over = 30004 + kLate + 2 * Warp::Stft::kFrame;
    const double level = db(rms(hurt.left, over) / rms(clean.left, over));
    std::printf("after bad input: level %+.3f dB against a clean run\n", level);
    EXPECT(std::fabs(level) < 0.1, "after bad input the sound is back at its level, not stuck");
    const double want = 196.0 * std::pow(3.0, std::pow(2.0, 0.3));
    EXPECT_NEAR(cents(partial_near(hurt.left, want, 80.0, over, over + 30000), partial_near(clean.left, want, 80.0, over, over + 30000)),
                0.0, 0.5, "and its partials where they would have been");
    // Bad input alone leaves the device asleep and silent.
    device.init(kRate);
    std::vector<float> rubbish(48000, std::nanf(""));
    const Stereo out = run(device, rubbish);
    const Stereo after = render(device, 1.0f, kRate);
    EXPECT(finite(out.left) && peak(out.left) == 0.0 && peak(after.left) == 0.0, "NaN alone is silence");
  }

  // 12. Block sizes across a silence, with everything that runs by itself running (Drift at 1, Follow
  // on, Width up): a phrase, a silence stepped across the moment the device falls asleep (0.2 s after
  // the sound: a latency and a frame of tail, then the hold), and a phrase again, the same to the last
  // digit at block sizes 1, 37, 128 and 2048.
  {
    double worst = 0.0;
    for (float gap = 0.05f; gap < 0.5f; gap += 0.0173f) {
      std::vector<float> phrase = harmonics(196.0f, 6, 0.3f, 0.25f);
      const std::vector<float> quiet = silence(gap, kRate);
      const std::vector<float> again = harmonics(293.66f, 6, 0.3f, 0.25f);
      phrase.insert(phrase.end(), quiet.begin(), quiet.end());
      phrase.insert(phrase.end(), again.begin(), again.end());
      Stereo reference;
      for (int block : {128, 1, 2048, 37}) {
        device.init(kRate);
        device.set_param(p::kDrift, 1.0f);
        device.set_param(p::kFollow, 1.0f);
        device.set_param(p::kWidth, 1.0f);
        device.set_param(p::kPivot, 100.0f);
        const Stereo out = run(device, phrase, block);
        if (block == 128) {
          reference = out;
          continue;
        }
        for (size_t i = 0; i < out.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
        }
      }
    }
    std::printf("block sizes across a silence: worst difference %.3g\n", worst);
    EXPECT(worst == 0.0, "the same at block sizes 1, 37, 128 and 2048 across a sleep");
  }

  // 13. No clicks: Stretch, Pivot and Shift swept while a chord sounds, Follow switched and Mix thrown
  // from one end to the other, each against the same sound with no event in it. A move crossfades over
  // a frame; the steepest step stays what the sound itself has.
  {
    std::vector<float> chord = harmonics(196.0f, 8, 2.0f, 0.2f);
    const std::vector<float> fifth = harmonics(293.66f, 8, 2.0f, 0.15f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += fifth[i];
    struct Event {
      const char* name;
      int param;
      float from, to;
      bool sweep;
    };
    const Event events[] = {
        {"Stretch swept", p::kStretch, -0.6f, 0.8f, true}, {"Pivot swept", p::kPivot, 80.0f, 900.0f, true},
        {"Shift swept", p::kShift, -7.0f, 7.0f, true},    {"Lean swept", p::kLean, -1.0f, 1.0f, true},
        {"Tone swept", p::kTone, -1.0f, 1.0f, true},      {"Follow switched on", p::kFollow, 0.0f, 1.0f, false},
        {"Follow switched off", p::kFollow, 1.0f, 0.0f, false}, {"Mix thrown", p::kMix, 1.0f, 0.0f, false},
        {"Stretch thrown", p::kStretch, 0.8f, -0.8f, false},
    };
    // One render: the chord's first 0.67 s to settle, then 0.67 s in blocks of 128 with the control held
    // at `fixed` (0 to 1 along its way) or, with `fixed` under 0, moved as the event says.
    auto steepest = [&](const Event& event, float fixed) {
      const auto at = [&](float along) { return event.from + (event.to - event.from) * along; };
      device.init(kRate);
      device.set_param(p::kMix, 0.7f);
      device.set_param(event.param, at(fixed < 0.0f ? 0.0f : fixed));
      run(device, std::vector<float>(chord.begin(), chord.begin() + 32000));
      Stereo out;
      for (int block = 0; block < 250; ++block) {
        if (fixed < 0.0f && (event.sweep || block == 60)) device.set_param(event.param, at(event.sweep ? block / 249.0f : 1.0f));
        const size_t from = 32000 + static_cast<size_t>(block) * 128;
        out = concat(out, run(device, std::vector<float>(chord.begin() + from, chord.begin() + from + 128)));
      }
      return std::max(max_step(out.left), max_step(out.right));
    };
    for (const Event& event : events) {
      // The reference has no event in it: the steepest the sound is with the control held anywhere
      // along the way (a stretch throws partials upward, and a higher partial is a steeper wave).
      double held = 0.0;
      for (float along : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) held = std::max(held, steepest(event, along));
      const double moved = steepest(event, -1.0f);
      char label[120];
      std::snprintf(label, sizeof label, "%s: no click (step %.4f, %.4f with no event)", event.name, moved, held);
      EXPECT(moved < 1.25 * held + 0.005, label);
      std::printf("%s: steepest step %.4f, %.4f held\n", event.name, moved, held);
    }
  }

  // 14. A knob moved while the device sleeps snaps on wake: the sound after is the sound of a device
  // that had it there all along. And after any control is thrown to its ends the device comes to rest.
  {
    const std::vector<float> tone = harmonics(196.0f, 6, 0.5f, 0.25f);
    device.init(kRate);
    run(device, tone);
    render(device, 1.0f, kRate);
    device.set_param(p::kMix, 0.2f);
    device.set_param(p::kStretch, -0.5f);
    const Stereo woken = run(device, tone);
    device.init(kRate);
    device.set_param(p::kMix, 0.2f);
    device.set_param(p::kStretch, -0.5f);
    run(device, tone);
    render(device, 1.0f, kRate);
    const Stereo always = run(device, tone);
    EXPECT(woken.left == always.left && woken.right == always.right, "knobs moved in a sleep snap on wake");
    for (int id = 0; id < p::kNumParams; ++id) {
      device.init(kRate);
      run(device, tone);
      device.set_param(id, p::kParamMax[id]);
      run(device, tone);
      device.set_param(id, p::kParamMin[id]);
      run(device, tone);
      render(device, 0.5f, kRate);
      const Stereo rest = render(device, 0.5f, kRate);
      EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "the device comes to rest after a control is thrown");
    }
  }

  // 15. The two sides are worked on apart: nothing is summed to mono, so a sound in opposite phase on
  // the two sides comes out as loud as it went in, and still in opposite phase.
  {
    const std::vector<float> tone = harmonics(220.0f, 6, 1.5f, 0.25f);
    std::vector<float> flipped = tone;
    for (float& v : flipped) v = -v;
    still(device);
    const Stereo out = run(device, tone, flipped);
    EXPECT_NEAR(db(rms(out.left, 24000) / rms(tone)), 0.0, 0.3, "opposite phase in: the left as loud as it came");
    EXPECT(correlation(out.left, out.right, 24000) < -0.999, "and the two sides still opposite");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("warp", 10.0f, kRate, [&] { run(device, input); });
  return finish("warp");
}
