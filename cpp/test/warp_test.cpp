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

// The device with nothing moving by itself: one pivot where the knob is (220 Hz until a check moves
// it), no drift, no width, all wet.
static void still(Warp& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kFollow, 0.0f);
  d.set_param(p::kPivot, 220.0f);
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

// One sample of a note at 196 Hz with three harmonics, for a note struck under a held one.
static float lower_octave(size_t i) {
  float sum = 0.0f;
  for (int n = 1; n <= 3; ++n) sum += 0.2f / n * static_cast<float>(std::sin(2.0 * kPi * 196.0 * n * static_cast<double>(i) / kRate));
  return sum;
}

// The presets of device.json (what each changes; the rest is the defaults), for the level checks.
struct Setting {
  int param;
  float value;
};
struct Preset {
  const char* name;
  std::vector<Setting> settings;
};
static const std::vector<Preset>& presets() {
  static const std::vector<Preset> all = {
    {"Bell metal", {}},
    {"Stiff string", {{p::kStretch, 0.45f}, {p::kLean, 1.0f}, {p::kDrift, 0.0f}, {p::kWidth, 0.15f}}},
    {"Soft chime", {{p::kStretch, 0.12f}, {p::kDrift, 0.2f}, {p::kTone, -0.3f}, {p::kMix, 0.5f}}},
    {"Glass bar", {{p::kStretch, 0.6f}, {p::kDrift, 0.0f}, {p::kTone, 0.2f}, {p::kWidth, 0.1f}}},
    {"Tight hum", {{p::kStretch, -1.0f}, {p::kTone, 0.3f}}},
    {"Slow breath", {{p::kStretch, 0.2f}, {p::kDrift, 1.0f}, {p::kWidth, 0.5f}}},
    {"Sunken gong", {{p::kStretch, 0.45f}, {p::kPivot, 220.0f}, {p::kFollow, 0.0f}, {p::kShift, -12.0f}, {p::kTone, -0.5f}}},
    {"Thin halo", {{p::kStretch, 0.06f}, {p::kDrift, 0.4f}, {p::kWidth, 1.0f}, {p::kMix, 0.35f}}},
    {"Wide drone", {{p::kStretch, -0.25f}, {p::kPivot, 110.0f}, {p::kFollow, 0.0f}, {p::kDrift, 0.6f}, {p::kWidth, 1.0f}, {p::kMix, 0.85f}}},
    {"Close cluster", {{p::kStretch, 0.7f}, {p::kLean, -1.0f}, {p::kMix, 0.9f}}},
    {"Beating cluster", {{p::kStretch, -0.6f}, {p::kPivot, 330.0f}, {p::kFollow, 0.0f}, {p::kDrift, 0.3f}, {p::kWidth, 0.6f}}},
    {"Tin toy", {{p::kStretch, 0.9f}, {p::kPivot, 300.0f}, {p::kFollow, 0.0f}, {p::kShift, 7.0f}, {p::kTone, -0.6f}, {p::kMix, 0.9f}}},
    {"Fifth shadow", {{p::kStretch, 0.0f}, {p::kShift, 7.0f}, {p::kWidth, 0.5f}, {p::kMix, 0.4f}}},
    {"Octave under", {{p::kStretch, 0.0f}, {p::kShift, -12.0f}, {p::kTone, -0.3f}, {p::kMix, 0.5f}}},
    {"Dark bowl", {{p::kStretch, -0.35f}, {p::kDrift, 0.25f}, {p::kTone, -0.8f}}},
    {"Bright spray", {{p::kStretch, 0.5f}, {p::kLean, 1.0f}, {p::kTone, 0.8f}, {p::kWidth, 0.8f}, {p::kMix, 0.6f}}},
  };
  return all;
}
static void load(Warp& d, const Preset& preset) {
  d.init(kRate);
  for (const Setting& setting : preset.settings) d.set_param(setting.param, setting.value);
}

// The device's curve, from its header: where a partial at `hz` goes for a pivot, a stretch and a lean.
static double warped(double hz, double pivot, double stretch, double lean) {
  const double o = std::log2(hz / pivot);
  const double x = o / Warp::kLeanOctaves;
  const double r = x * x / (1.0 + x * x);
  const double w = lean >= 0.0 ? 1.0 - lean * (1.0 - r) : 1.0 + lean * r;
  return pivot * std::pow(2.0, o * (1.0 + (std::pow(2.0, stretch) - 1.0) * w));
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

  // 6. Lean: where the stretch bites. The device's own weight, w = 1 - lean (1 - r) or 1 + lean r with
  // r = (o / 2)² / (1 + (o / 2)²) and o the octaves from the pivot; turned up the octave partial stays
  // close and the high ones go far, turned down the other way round; and the curve always rises.
  {
    const std::vector<float> tone = harmonics(110.0f, 12, 1.5f, 0.3f);  // 110..1320 around a pivot of 220
    double worst = 0.0;
    for (float lean : {1.0f, -1.0f, 0.5f, -0.5f}) {
      still(device);
      device.set_param(p::kStretch, 0.5f);
      device.set_param(p::kLean, lean);
      const Stereo out = run(device, tone);
      for (int n : {1, 3, 4, 8, 12}) {
        const double want = warped(110.0 * n, 220.0, 0.5, lean);
        worst = std::max(worst, std::fabs(cents(partial_near(out.left, want, 60.0, 24000, 66000), want)));
      }
    }
    std::printf("lean: worst partial %.3f cents off its formula\n", worst);
    EXPECT(worst < 1.0, "Lean: every partial lands where the weighted stretch puts it");
    // What the two ends do to the octave over the pivot and to the partial two octaves and a fifth over it.
    const double plain2 = cents(warped(440.0, 220.0, 0.5, 0.0), 440.0), plain12 = cents(warped(1320.0, 220.0, 0.5, 0.0), 1320.0);
    EXPECT(cents(warped(440.0, 220.0, 0.5, 1.0), 440.0) < 0.25 * plain2, "Lean up: the octave partial barely moves");
    EXPECT(cents(warped(1320.0, 220.0, 0.5, 1.0), 1320.0) > 0.6 * plain12, "Lean up: the high partial still goes far");
    EXPECT(cents(warped(440.0, 220.0, 0.5, -1.0), 440.0) > 0.75 * plain2, "Lean down: the octave partial moves");
    EXPECT(cents(warped(1320.0, 220.0, 0.5, -1.0), 1320.0) < 0.45 * plain12, "Lean down: the high partial stays nearer");
    bool rising = true;
    for (double stretch : {-1.16, 1.16}) {
      for (double lean : {-1.0, -0.5, 0.5, 1.0}) {
        double last = 0.0;
        for (double hz = 5.0; hz < 24000.0; hz *= 1.01) {
          const double now = warped(hz, 220.0, stretch, lean);
          rising = rising && now > last;
          last = now;
        }
      }
    }
    EXPECT(rising, "the curve rises all the way at every stretch and lean: partials never cross");
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

  // 10. Follow: every note being played, at or above the Pivot setting, gets a pivot of its own, so a
  // line and a chord keep their pitches and each note's overtones are stretched from it.
  {
    const double e = std::pow(2.0, 0.5);
    auto at = [&](const std::vector<float>& x, double want, size_t from, size_t to, double span = 60.0) {
      return cents(partial_near(x, want, span, from, to), want);
    };
    std::vector<float> line = harmonics(196.0f, 6, 1.5f, 0.3f);
    const std::vector<float> next = harmonics(293.66f, 6, 1.5f, 0.3f);
    line.insert(line.end(), next.begin(), next.end());
    auto with = [&](const std::vector<float>& in, float follow, float pivot) {
      still(device);
      device.set_param(p::kStretch, 0.5f);
      device.set_param(p::kPivot, pivot);
      device.set_param(p::kFollow, follow);
      return run(device, in);
    };
    Stereo out = with(line, 1.0f, 100.0f);
    const size_t a0 = 36000, a1 = 66000, b0 = 72000 + 36000, b1 = 72000 + 66000;
    EXPECT_NEAR(at(out.left, 196.0, a0, a1, 100.0), 0.0, 1.0, "Follow: the first note keeps its pitch");
    EXPECT_NEAR(at(out.left, 196.0 * std::pow(3.0, e), a0, a1), 0.0, 1.0, "Follow: its third partial is stretched from it");
    EXPECT_NEAR(at(out.left, 293.66, b0, b1, 100.0), 0.0, 1.0, "Follow: the second note keeps its pitch");
    EXPECT_NEAR(at(out.left, 293.66 * std::pow(3.0, e), b0, b1), 0.0, 1.0, "Follow: its third partial is stretched from it");
    EXPECT_NEAR(device.meter(1), 293.66, 0.3, "Follow: the pivot reported is the note");
    // Off, the pivot stays at the knob and the notes move.
    out = with(line, 0.0f, 100.0f);
    EXPECT_NEAR(at(out.left, 100.0 * std::pow(1.96, e), a0, a1), 0.0, 1.0, "Follow off: the note is stretched from the knob");
    EXPECT(tone_level(out.left, 196.0, kRate, a0, a1) < 0.003, "Follow off: nothing is left at the note's own pitch");
    EXPECT_NEAR(device.meter(1), 100.0, 0.01, "Follow off: the pivot reported is the knob");
    // The Pivot knob is the lowest a pivot may be: over the first note's fundamental, its octave is taken.
    out = with(line, 1.0f, 250.0f);
    EXPECT_NEAR(at(out.left, 392.0, a0, a1, 100.0), 0.0, 1.0, "Follow: the lowest partial over the knob stays");

    // A chord: both notes stay, each with its own stretched overtones (a partial the two share goes with
    // the note it is the lower harmonic of).
    std::vector<float> chord = harmonics(196.0f, 6, 3.0f, 0.2f);
    const std::vector<float> upper = harmonics(293.66f, 6, 3.0f, 0.2f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += upper[i];
    out = with(chord, 1.0f, 100.0f);
    const size_t c0 = 48000, c1 = 120000;
    EXPECT_NEAR(at(out.left, 196.0, c0, c1, 100.0), 0.0, 1.0, "Follow, a chord: the lower note keeps its pitch");
    EXPECT_NEAR(at(out.left, 293.66, c0, c1, 100.0), 0.0, 1.0, "Follow, a chord: the upper note keeps its pitch");
    EXPECT_NEAR(db(tone_level(out.left, 196.0, kRate, c0, c1) / 0.2), 0.0, 0.3, "Follow, a chord: the lower note at its level");
    EXPECT_NEAR(db(tone_level(out.left, 293.66, kRate, c0, c1) / 0.2), 0.0, 0.3, "Follow, a chord: the upper note at its level");
    EXPECT_NEAR(at(out.left, 196.0 * std::pow(2.0, e), c0, c1), 0.0, 1.0, "Follow, a chord: the lower note's octave is stretched from it");
    // (588 Hz of the lower note and 587.3 Hz of the upper one are a single peak, so this one is a blend)
    EXPECT_NEAR(at(out.left, 293.66 * std::pow(2.0, e), c0, c1), 0.0, 3.0, "Follow, a chord: the upper note's octave from the upper note");
    EXPECT_NEAR(device.meter(1), 196.0, 0.3, "Follow: the pivot reported is the lowest note");

    // A pivot stays with a note that fades under its own overtones (to 30 dB under them).
    std::vector<float> fading = harmonics(196.0f, 6, 3.0f, 0.3f);
    for (size_t i = 48000; i < fading.size(); ++i) {
      fading[i] -= 0.29f * static_cast<float>(std::sin(2.0 * kPi * 196.0 * static_cast<double>(i) / kRate));
    }
    out = with(fading, 1.0f, 100.0f);
    EXPECT_NEAR(device.meter(1), 196.0, 0.3, "Follow: the pivot stays with a fundamental that has faded");
    EXPECT_NEAR(at(out.left, 196.0 * std::pow(2.0, e), 96000, 140000), 0.0, 1.0, "and its overtones stay where they were");
    // One rich note: its overtones are overtones (a sawtooth's are 6 dB under what would make them
    // notes), and every one moves.
    out = with(harmonics(196.0f, 10, 2.0f, 0.3f), 1.0f, 40.0f);
    double worst = 0.0;
    for (int n = 1; n <= 10; ++n) worst = std::max(worst, std::fabs(at(out.left, 196.0 * std::pow(n, e), 48000, 90000)));
    EXPECT(worst < 1.0, "Follow: the ten harmonics of one rich note land at note x n^e");
    // A note struck on a harmonic of a held bass (E4 on the third harmonic of A2) is a note: it stays,
    // and the bass's own third harmonic goes where the stretch puts it.
    std::vector<float> bass = harmonics(110.0f, 8, 3.0f, 0.25f);
    for (size_t i = 72000; i < bass.size(); ++i) {
      bass[i] += 0.2f * static_cast<float>(std::sin(2.0 * kPi * 329.63 * static_cast<double>(i - 72000) / kRate));
    }
    out = with(bass, 1.0f, 40.0f);
    EXPECT_NEAR(at(out.left, 110.0 * std::pow(3.0, e), 30000, 66000), 0.0, 1.0, "Follow: before, the bass's third harmonic is stretched");
    EXPECT_NEAR(db(tone_level(out.left, 329.63, kRate, 100000, 140000) / 0.2), 0.0, 3.0, "Follow: a note struck on it stays at its own pitch");
    EXPECT_NEAR(at(out.left, 110.0 * std::pow(2.0, e), 100000, 140000), 0.0, 1.0, "and the bass's other overtones are where they were");
    // A held note keeps its pitch when a note an octave under it is struck.
    std::vector<float> held = harmonics(392.0f, 4, 3.0f, 0.2f);
    for (size_t i = 72000; i < held.size(); ++i) held[i] += lower_octave(i - 72000);
    out = with(held, 1.0f, 100.0f);
    EXPECT_NEAR(at(out.left, 392.0, 100000, 140000, 100.0), 0.0, 1.0, "Follow: a held note stays when its lower octave is struck");
    EXPECT_NEAR(at(out.left, 196.0, 100000, 140000, 100.0), 0.0, 1.0, "and the new note is in tune too");
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

    // The same with controls thrown in the middle of the sleep; and a second device playing
    // something else in between leaves the first as it was (nothing is shared between two).
    static Warp other;
    const std::vector<float> first = harmonics(196.0f, 6, 0.4f, 0.25f);
    std::vector<float> second = silence(1.0f, kRate);
    const std::vector<float> then = harmonics(261.63f, 6, 0.5f, 0.25f);
    second.insert(second.end(), then.begin(), then.end());
    double apart = 0.0;
    Stereo reference;
    for (int block : {128, 1, 2048, 37, 128}) {
      device.init(kRate);
      device.set_param(p::kDrift, 1.0f);
      run(device, first, block);
      std::vector<float> rest(second.begin(), second.begin() + 24000);
      run(device, rest, block);
      device.set_param(p::kStretch, -0.5f);
      device.set_param(p::kFollow, 0.0f);
      device.set_param(p::kPivot, 300.0f);
      device.set_param(p::kMix, 0.5f);
      device.set_param(p::kTone, -0.7f);
      if (!reference.left.empty()) {
        other.init(kRate);
        other.set_param(p::kStretch, 1.0f);
        run(other, noise(0.3f, kRate, 0.3f), 128);
      }
      rest.assign(second.begin() + 24000, second.end());
      const Stereo out = run(device, rest, block);
      if (reference.left.empty()) {
        reference = out;
        continue;
      }
      for (size_t i = 0; i < out.size(); ++i) {
        apart = std::max(apart, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
        apart = std::max(apart, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
      }
    }
    std::printf("controls thrown in a sleep, at four block sizes, beside a second device: worst difference %.3g\n", apart);
    EXPECT(apart == 0.0, "controls thrown in a sleep give the same sound at every block size, beside a second device");
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
      float follow;  // with Follow on or off (a pivot at 220 Hz)
    };
    const Event events[] = {
        {"Stretch swept", p::kStretch, -0.6f, 0.8f, true, 0.0f},
        {"Stretch swept, following", p::kStretch, -0.6f, 0.8f, true, 1.0f},
        {"Pivot swept", p::kPivot, 80.0f, 900.0f, true, 0.0f},
        {"Pivot swept, following", p::kPivot, 80.0f, 900.0f, true, 1.0f},
        {"Shift swept", p::kShift, -7.0f, 7.0f, true, 1.0f},
        {"Lean swept", p::kLean, -1.0f, 1.0f, true, 0.0f},
        {"Tone swept", p::kTone, -1.0f, 1.0f, true, 1.0f},
        {"Follow switched on", p::kFollow, 0.0f, 1.0f, false, 0.0f},
        {"Follow switched off", p::kFollow, 1.0f, 0.0f, false, 1.0f},
        {"Mix thrown", p::kMix, 1.0f, 0.0f, false, 1.0f},
        {"Stretch thrown", p::kStretch, 0.8f, -0.8f, false, 1.0f},
    };
    // One render: the chord's first 0.67 s to settle, then 0.67 s in blocks of 128 with the control held
    // at `fixed` (0 to 1 along its way) or, with `fixed` under 0, moved as the event says.
    auto steepest = [&](const Event& event, float fixed) {
      const auto at = [&](float along) { return event.from + (event.to - event.from) * along; };
      device.init(kRate);
      device.set_param(p::kMix, 0.7f);
      device.set_param(p::kFollow, event.follow);
      device.set_param(p::kPivot, event.follow > 0.5f ? 20.0f : 220.0f);
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

  // 16. Level. A held chord at full scale (four rich notes, peaking at 1) for a minute, through every
  // preset and with every control at each of its ends: the output peaks no more than 6 dB over the
  // input, is no louder at the end than at the start, and is within 3 dB of the input's level.
  {
    std::vector<float> chord(60 * 48000, 0.0f);
    const float notes[4] = {110.0f, 164.81f, 220.0f, 277.18f};
    for (float hz : notes) {
      for (int n = 1; n <= 8; ++n) {
        const double step = 2.0 * kPi * hz * n / kRate;
        for (size_t i = 0; i < chord.size(); ++i) chord[i] += 0.25f / n * static_cast<float>(std::sin(step * static_cast<double>(i)));
      }
    }
    const float scale = 1.0f / static_cast<float>(peak(chord));
    for (float& v : chord) v *= scale;
    const double in_rms = rms(chord);
    double highest = 0.0, loudest = -100.0, quietest = 100.0, grew = 0.0;
    auto hold = [&](const char* what) {
      const Stereo out = run(device, chord);
      const double top = std::max(peak(out.left), peak(out.right));
      const double level = db(std::sqrt(0.5 * (rms(out.left, 48000) * rms(out.left, 48000) + rms(out.right, 48000) * rms(out.right, 48000))) / in_rms);
      const double first = std::max(peak(out.left, 48000, 11 * 48000), peak(out.right, 48000, 11 * 48000));
      const double last = std::max(peak(out.left, 49 * 48000), peak(out.right, 49 * 48000));
      highest = std::max(highest, top);
      loudest = std::max(loudest, level);
      quietest = std::min(quietest, level);
      grew = std::max(grew, last / first);
      char label[160];
      std::snprintf(label, sizeof label, "%s: a full-scale chord for a minute peaks at %.2f, level %+.1f dB, end to start %.2f", what, top, level, last / first);
      EXPECT(finite(out.left) && finite(out.right) && top < 2.0 && last < 1.2 * first && level < 3.0 && level > -12.0, label);
    };
    for (const Preset& preset : presets()) {
      load(device, preset);
      hold(preset.name);
    }
    for (int id = 0; id < p::kNumParams; ++id) {
      for (float value : {p::kParamMin[id], p::kParamMax[id]}) {
        device.init(kRate);
        device.set_param(id, value);
        char what[64];
        std::snprintf(what, sizeof what, "param %d at %g", id, value);
        hold(what);
      }
    }
    std::printf("a full-scale chord for a minute: peak %.2f at the most, level %+.1f to %+.1f dB, end to start %.2f at the most\n",
                highest, quietest, loudest, grew);
  }

  // 17. Part-way Mix. Held tones over the piano's range, through the default at four mixes and through
  // every preset: the level over three seconds against the tone that went in. A partial that has not
  // moved adds to its dry self to exactly what came in; one that has moved adds as power; nothing
  // cancels for good, because the dry path is as late as the wet one. (Tone is set flat: it is a
  // gain of its own, measured above. A tone the settings throw out of the spectrum, past 18 kHz or
  // under 16 Hz, has no wet part left and is not counted: at Mix 0.9 it is the dry part alone, 16 dB
  // down.)
  {
    double deepest = 0.0, highest = 0.0;
    const char* where = "";
    float where_hz = 0.0f;
    int thrown = 0, counted = 0;
    auto sweep = [&](const char* what, const Preset* preset, float mix) {
      for (float note = 21.0f; note <= 108.0f; note += 3.0f) {
        const float hz = 440.0f * std::pow(2.0f, (note - 69.0f) / 12.0f);
        const std::vector<float> tone = sine(hz, 4.0f, kRate, 0.5f);
        if (preset) {
          load(device, *preset);
        } else {
          device.init(kRate);
          device.set_param(p::kMix, mix);
        }
        device.set_param(p::kTone, 0.0f);
        // Where the tone lands: with Follow on it is its own pivot (under the knob, and with Follow
        // off, it is warped around the knob), then Shift.
        const bool own = device.param(p::kFollow) >= 0.5f && hz >= device.param(p::kPivot);
        const double landed = (own ? hz : warped(hz, device.param(p::kPivot), device.param(p::kStretch), device.param(p::kLean))) *
                              std::pow(2.0, device.param(p::kShift) / 12.0);
        if (landed > 18000.0 || landed < 16.0) {
          ++thrown;
          continue;
        }
        ++counted;
        const Stereo out = run(device, tone);
        const double l = rms(out.left, 48000), r = rms(out.right, 48000);
        const double level = db(std::sqrt(0.5 * (l * l + r * r)) / rms(tone));
        if (level < deepest) {
          deepest = level;
          where = what;
          where_hz = hz;
        }
        highest = std::max(highest, level);
      }
    };
    for (float mix : {0.25f, 0.5f, 0.75f, 1.0f}) sweep("the default", nullptr, mix);
    for (const Preset& preset : presets()) sweep(preset.name, &preset, 0.0f);
    std::printf("held tones A0 to C8 at part-way mix: level %+.2f to %+.2f dB of the input over %d tones (deepest: %s at %.1f Hz); %d thrown out of the spectrum\n",
                deepest, highest, counted, where, where_hz, thrown);
    EXPECT(deepest > -3.0, "no held tone drops by 3 dB at any preset or mix");
    EXPECT(highest < 3.0, "and none rises by 3 dB");
  }

  // 18. No dead part of a knob: on a played phrase (struck notes that ring over one another), every
  // control changes the sound between each fifth of its range and the next, by 3 % of the signal at the
  // least. Pivot is tried with Follow off, where it is the one pivot: with Follow on it is the floor
  // under which a note gets no pivot of its own (check 10), and a floor under every note played does
  // nothing by its nature, which is said here rather than hidden: the least step is printed for both.
  // And at 96 kHz the partials land where they do at 48.
  {
    std::vector<float> phrase(3 * 48000, 0.0f);
    const double starts[4] = {0.0, 0.5, 1.0, 1.7};
    const double pitches[4] = {220.0, 329.63, 523.25, 174.61};
    for (int note = 0; note < 4; ++note) {
      for (int n = 1; n <= 8; ++n) {
        for (size_t i = static_cast<size_t>(starts[note] * kRate); i < phrase.size(); ++i) {
          const double t = static_cast<double>(i) / kRate - starts[note];
          phrase[i] += static_cast<float>(0.15 / n * std::exp(-t * (1.0 + 0.5 * n)) * std::min(1.0, t / 0.004) *
                                          std::sin(2.0 * kPi * pitches[note] * n * t));
        }
      }
    }
    for (int id = 0; id < p::kNumParams; ++id) {
      const bool choice = id == p::kFollow;
      const int steps = choice ? 1 : 5;
      Stereo last;
      double least = 1.0e9;
      for (int step = 0; step <= steps; ++step) {
        const float along = static_cast<float>(step) / steps;
        float value = p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * along;
        if (id == p::kPivot) value = p::kParamMin[id] * std::pow(p::kParamMax[id] / p::kParamMin[id], along);
        device.init(kRate);
        if (id == p::kMix) device.set_param(p::kStretch, 0.5f);
        if (id == p::kPivot) device.set_param(p::kFollow, 0.0f);
        device.set_param(id, value);
        const Stereo out = run(device, phrase);
        if (step > 0) {
          double difference = 0.0, size = 0.0;
          for (size_t i = 0; i < out.size(); ++i) {
            difference += std::pow(static_cast<double>(out.left[i]) - last.left[i], 2.0) + std::pow(static_cast<double>(out.right[i]) - last.right[i], 2.0);
            size += static_cast<double>(out.left[i]) * out.left[i] + static_cast<double>(out.right[i]) * out.right[i];
          }
          least = std::min(least, std::sqrt(difference / size));
        }
        last = out;
      }
      char label[120];
      std::snprintf(label, sizeof label, "param %d changes a played phrase over its whole range (least step %.3f)", id, least);
      EXPECT(least > 0.03, label);
      std::printf("param %d: the least change between fifths of its range is %.3f of the signal\n", id, least);
    }

    for (const float rate : {44100.0f, 96000.0f}) {
      still(device, rate);
      device.set_param(p::kStretch, 0.4f);
      std::vector<float> tone(static_cast<size_t>(1.5f * rate), 0.0f);
      for (int n = 1; n <= 6; ++n) {
        for (size_t i = 0; i < tone.size(); ++i) tone[i] += 0.3f / n * static_cast<float>(std::sin(2.0 * kPi * 220.0 * n * static_cast<double>(i) / rate));
      }
      const Stereo out = run(device, tone);
      double worst = 0.0;
      for (int n = 1; n <= 6; ++n) {
        const double want = 220.0 * std::pow(n, std::pow(2.0, 0.4));
        worst = std::max(worst, std::fabs(cents(partial_near(out.left, want, 60.0, static_cast<size_t>(0.5f * rate), static_cast<size_t>(1.35f * rate), rate), want)));
      }
      std::printf("at %.0f Hz the six partials of a stretched tone are within %.3f cents of pivot x n^e\n", rate, worst);
      EXPECT(worst < 1.0, "at 44.1 and 96 kHz the partials land where they do at 48");
    }
  }

  // Cost: the average on the loads that cost least and most (a chord, which has few partials, and noise,
  // which has a peak every third bin, with Follow on so each is tried against eight pivots), and the
  // worst block: a frame's work lands in one block of eight, so the 95th percentile is one with a frame.
  {
    rng_state() = 0xBEEFu;
    std::vector<float> loud = noise(10.0f, kRate, 0.25f);
    const std::vector<float> few = harmonics(196.0f, 8, 10.0f, 0.2f);
    const std::vector<float> notes8 = harmonics(233.08f, 6, 10.0f, 0.1f);
    for (size_t i = 0; i < loud.size(); ++i) loud[i] += notes8[i];
    device.init(kRate);
    report_cost("warp (a chord, defaults)", 10.0f, kRate, [&] { run(device, few); });
    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kDrift, 1.0f);
    report_cost("warp (noise, everything on)", 10.0f, kRate, [&] { run(device, loud); });
    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kDrift, 1.0f);
    std::vector<double> micros;
    for (size_t done = 0; done + 128 <= loud.size(); done += 128) {
      for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = loud[done + i];
      const auto start = std::chrono::steady_clock::now();
      device.process(128);
      micros.push_back(std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count());
    }
    std::sort(micros.begin(), micros.end());
    const double p95 = micros[micros.size() * 95 / 100];
    std::printf("warp worst block (noise, 95th percentile): %.1f us, %.2f%% of its 2667 us (native)\n", p95, 100.0 * p95 / 2666.7);
  }
  return finish("warp");
}
