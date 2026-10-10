// Native harness for Spread (cpp/devices/spread). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it width by frequency.

#include <complex>

#include "../devices/spread/spread.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Spread;
namespace p = livemix::spread;

static Spread device;

static const float kRate = 48000.0f;

// --- the curve as the header's notes give it, worked out apart from the device ---------------

typedef std::complex<double> Complex;

// One stage: A at `low_hz`, B at `high_hz`, gains l, m, h (already square roots).
static Complex stage_response(double hz, double low_hz, double high_hz, double l, double m, double h,
                              double rate) {
  const double k = std::sqrt(2.0);
  auto split = [&](double corner, Complex* lp, Complex* bp, Complex* hp) {
    const double top = 0.45 * rate;  // kTopOfRange
    const double w = std::tan(kPi * hz / rate) / std::tan(kPi * std::min(corner, top) / rate);
    const Complex s(0.0, w);
    const Complex d = s * s + k * s + 1.0;
    *lp = 1.0 / d;
    *bp = k * s / d;  // k·bp
    *hp = s * s / d;
  };
  Complex lp_a, bp_a, hp_a, lp_b, bp_b, hp_b;
  split(low_hz, &lp_a, &bp_a, &hp_a);
  split(high_hz, &lp_b, &bp_b, &hp_b);
  const double c = std::cbrt(l * m * h);
  return lp_b * (l * lp_a + std::sqrt(l * m) * bp_a + m * hp_a) +
         hp_a * (std::sqrt(m * h) * bp_b + h * hp_b) + c * (lp_a + bp_a) * (bp_b + hp_b);
}

// The gain on the sides at `hz` for the six settings of the curve.
static double curve(double hz, double low, double mid, double high, double low_hz, double high_hz,
                    double slope, double rate = kRate) {
  const double apart = std::exp2(1.0 - slope);  // kSpreadOctaves
  const double l = std::sqrt(low), m = std::sqrt(mid), h = std::sqrt(high);
  return std::abs(stage_response(hz, low_hz / apart, high_hz / apart, l, m, h, rate) *
                  stage_response(hz, low_hz * apart, high_hz * apart, l, m, h, rate));
}

// What Make at 1 puts beside a mono sound at `hz`, against its middle: the
// same curve for what each width has over 1.
static double made_curve(double hz, double low, double mid, double high, double low_hz,
                         double high_hz, double slope, double rate = kRate) {
  return curve(hz, std::max(low - 1.0, 0.0), std::max(mid - 1.0, 0.0), std::max(high - 1.0, 0.0),
               low_hz, high_hz, slope, rate);
}

// --- driving it -------------------------------------------------------------------------------

struct Setting {
  float low = 1.0f, mid = 1.0f, high = 1.0f, low_hz = 180.0f, high_hz = 3200.0f, slope = 0.5f;
  float make = 0.0f, smear = 0.4f, safe = 0.0f, output = 0.0f;
};

static void set(Spread& d, const Setting& s, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kLow, s.low);
  d.set_param(p::kMid, s.mid);
  d.set_param(p::kHigh, s.high);
  d.set_param(p::kLowHz, s.low_hz);
  d.set_param(p::kHighHz, s.high_hz);
  d.set_param(p::kSlope, s.slope);
  d.set_param(p::kMake, s.make);
  d.set_param(p::kSmear, s.smear);
  d.set_param(p::kSafe, s.safe);
  d.set_param(p::kOutput, s.output);
}

static std::vector<float> negated(const std::vector<float>& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = -x[i];
  return out;
}

static std::vector<float> middle(const Stereo& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = 0.5f * (x.left[i] + x.right[i]);
  return out;
}

static std::vector<float> sides(const Stereo& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = 0.5f * (x.left[i] - x.right[i]);
  return out;
}

// RMS of `x` in a narrow band around `hz` (a band-pass run six times, so
// that what lies two octaves off is 100 dB down and a region at 0 can be
// told from its loud neighbour), after the first tenth of a second.
static double band_rms(const std::vector<float>& x, double hz, double rate = kRate) {
  livemix::kit::Svf pass[6];
  for (livemix::kit::Svf& filter : pass) {
    filter.set(static_cast<float>(hz), 2.1f, static_cast<float>(rate));
  }
  double sum = 0.0;
  size_t count = 0;
  const size_t from = static_cast<size_t>(0.1 * rate);
  for (size_t i = 0; i < x.size(); ++i) {
    float y = x[i];
    for (livemix::kit::Svf& filter : pass) y = filter.bandpass(y);
    if (i >= from) {
      sum += static_cast<double>(y) * y;
      ++count;
    }
  }
  return count > 0 ? std::sqrt(sum / static_cast<double>(count)) : 0.0;
}

// The gain on a side tone at `hz`, measured: a tone on the sides alone, half a second.
static double side_gain(Spread& d, const Setting& s, double hz, float rate = kRate) {
  set(d, s, rate);
  const std::vector<float> tone = sine(static_cast<float>(hz), 0.6f, rate, 0.5f);
  Stereo out = run(d, tone, negated(tone));
  const size_t from = static_cast<size_t>(0.3f * rate);
  return tone_level(sides(out), hz, rate, from) / 0.5;
}

int main() {
  Conformance spec;
  spec.name = "spread";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // 1. The gain on the sides is the curve: side tones through four settings,
  // against the formula, wherever the curve stands above -70 dB.
  {
    const Setting settings[] = {
        {0.0f, 1.0f, 1.7f, 180.0f, 3200.0f, 0.5f},   // as it starts
        {2.0f, 0.5f, 2.0f, 300.0f, 2000.0f, 1.0f},   // wide ends, sharp
        {1.0f, 0.0f, 1.0f, 120.0f, 6000.0f, 0.0f},   // the middle taken out, soft
        {0.6f, 2.0f, 0.0f, 500.0f, 1500.0f, 0.3f},   // the top in the middle
    };
    const double tones[] = {45.0, 90.0, 180.0, 400.0, 900.0, 2000.0, 3200.0, 6000.0, 11000.0, 16000.0};
    double worst = 0.0;
    for (const Setting& s : settings) {
      for (double hz : tones) {
        const double want = curve(hz, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope);
        if (want < 3.0e-4) continue;
        const double got = side_gain(device, s, hz);
        worst = std::max(worst, std::fabs(db(got) - db(want)));
      }
    }
    std::printf("curve: worst error against the formula %.3f dB\n", worst);
    EXPECT(worst < 0.1, "side tones follow the curve's formula to 0.1 dB");
  }

  // 2. With correlated noise in (a middle and sides of their own), the side
  // level per band follows the curve, and the middle is what came in.
  {
    const Setting settings[] = {
        {0.0f, 1.0f, 2.0f, 250.0f, 3000.0f, 1.0f},
        {2.0f, 1.0f, 0.5f, 250.0f, 3000.0f, 1.0f},
        {0.5f, 2.0f, 1.0f, 250.0f, 3000.0f, 0.5f},
    };
    rng_state() = 0x5EEDu;
    const std::vector<float> mid_in = noise(4.0f, kRate, 0.25f);
    const std::vector<float> side_in = noise(4.0f, kRate, 0.15f);
    std::vector<float> left(mid_in.size()), right(mid_in.size());
    for (size_t i = 0; i < mid_in.size(); ++i) {
      left[i] = mid_in[i] + side_in[i];
      right[i] = mid_in[i] - side_in[i];
    }
    double worst = 0.0, worst_mid = 0.0;
    for (const Setting& s : settings) {
      set(device, s);
      Stereo out = run(device, left, right);
      const std::vector<float> side_out = sides(out);
      const std::vector<float> mid_out = middle(out);
      for (double hz : {60.0, 900.0, 9000.0}) {
        const double got = band_rms(side_out, hz) / band_rms(side_in, hz);
        const double want = curve(hz, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope);
        if (want < 0.01) {
          EXPECT(got < 0.02, "a region at 0 leaves no sides in its band");
        } else {
          worst = std::max(worst, std::fabs(db(got) - db(want)));
        }
      }
      for (size_t i = 0; i < mid_in.size(); ++i) {
        worst_mid = std::max(worst_mid, std::fabs(static_cast<double>(mid_out[i]) - mid_in[i]));
      }
    }
    std::printf("noise: side level per band within %.2f dB of the curve; middle off by %.2g\n", worst,
                worst_mid);
    EXPECT(worst < 1.0, "with noise in, the side level per band follows the curve");
    EXPECT(worst_mid < 1.0e-6, "the middle goes through untouched");
  }

  // 3. Low at 0 makes everything below the split mono: at Slope 1 a side tone
  // three octaves under the split is more than 60 dB down, and the middle of
  // the range is left as it was.
  {
    Setting s;
    s.low = 0.0f;
    s.low_hz = 400.0f;
    s.slope = 1.0f;
    const double deep = side_gain(device, s, 50.0);
    const double octave = side_gain(device, s, 200.0);
    const double above = side_gain(device, s, 1600.0);
    std::printf("Low 0, split 400 Hz, Slope 1: %.1f dB at 50 Hz, %.1f at 200, %.2f at 1600\n",
                db(deep), db(octave), db(above));
    EXPECT(db(deep) < -60.0, "Low 0: the sides three octaves under the split are under -60 dB");
    EXPECT(db(octave) < -20.0, "Low 0: an octave under the split the sides are 20 dB down");
    EXPECT(std::fabs(db(above)) < 0.3, "Low 0: two octaves over the split nothing is taken");
    // As it starts (split 180 Hz, Slope 0.5) the bass is mono from 45 Hz down.
    Setting start;
    start.low = 0.0f;
    const double start_deep = side_gain(device, start, 30.0);
    std::printf("Low 0 as it starts: %.1f dB at 30 Hz\n", db(start_deep));
    EXPECT(db(start_deep) < -40.0, "Low 0 as it starts: the sides at 30 Hz are under -40 dB");
  }

  // 4. Everything at 1 is the input, sample for sample, whatever Make is; a
  // hair off 1 it is still the input to 1e-4 (the splits sum flat).
  {
    Setting flat;
    flat.safe = 0.5f;
    flat.make = 1.0f;
    rng_state() = 0xF1A7u;
    const std::vector<float> a = noise(1.0f, kRate, 0.5f);
    const std::vector<float> b = noise(1.0f, kRate, 0.5f);
    set(device, flat);
    Stereo out = run(device, a, b);
    EXPECT(out.left == a && out.right == b, "all at 1 is the input, sample for sample, with Make full");
    Setting near = flat;
    near.low = 0.9999f;
    near.mid = 1.0001f;
    near.high = 0.9999f;
    set(device, near);
    out = run(device, a, b);
    double worst = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - a[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - b[i]));
    }
    std::printf("a hair off flat: the output is the input to %.2g\n", worst);
    EXPECT(worst < 1.0e-4, "the regions sum flat: a hair off 1 the output is the input to 1e-4");
  }

  // 5. The mono sum is what came in whatever the width controls do, Make and
  // Safe included: nothing here can cancel in mono.
  {
    rng_state() = 0xA11CEu;
    const std::vector<float> a = noise(2.0f, kRate, 0.4f);
    const std::vector<float> b = noise(2.0f, kRate, 0.4f);
    const Setting settings[] = {
        {0.0f, 1.0f, 1.7f, 180.0f, 3200.0f, 0.5f, 0.7f, 0.4f, 0.5f},
        {2.0f, 2.0f, 2.0f, 40.0f, 1000.0f, 0.0f, 1.0f, 1.0f, 0.0f},
        {2.0f, 2.0f, 2.0f, 800.0f, 12000.0f, 1.0f, 1.0f, 0.0f, 1.0f},
        {0.0f, 0.0f, 0.0f, 300.0f, 5000.0f, 0.5f, 1.0f, 0.5f, 1.0f},
    };
    double worst = 0.0;
    for (const Setting& s : settings) {
      set(device, s);
      Stereo out = run(device, a, b);
      for (size_t i = 0; i < a.size(); ++i) {
        const double sum_in = static_cast<double>(a[i]) + b[i];
        const double sum_out = static_cast<double>(out.left[i]) + out.right[i];
        worst = std::max(worst, std::fabs(sum_out - sum_in));
      }
    }
    std::printf("mono sum: off by at most %.2g over four settings\n", worst);
    EXPECT(worst < 1.0e-6, "the mono sum is unchanged by every width control, Make and Safe (1e-6)");
  }

  // 6. Make gives a mono input width in the band asked for, as much as the
  // region stands over 1, and none where a region is at 1 or under; the made
  // sides are as loud as the formula says (the scatter is allpass), and every
  // part of the knob's travel makes more.
  {
    rng_state() = 0xB0A7u;
    const std::vector<float> mono = noise(4.0f, kRate, 0.25f);
    Setting s;
    s.low = 0.0f;
    s.mid = 1.5f;
    s.high = 2.0f;
    s.low_hz = 250.0f;
    s.slope = 1.0f;
    s.make = 1.0f;
    set(device, s);
    Stereo out = run(device, mono);
    const std::vector<float> made = sides(out);
    const double top = band_rms(made, 9000.0) / band_rms(mono, 9000.0);
    const double centre = band_rms(made, 900.0) / band_rms(mono, 900.0);
    const double bottom = band_rms(made, 50.0) / band_rms(mono, 50.0);
    std::printf("Make 1 on a mono sound: sides against the middle %.2f at 9 kHz, %.2f at 900 Hz, %.4f at 50 Hz\n",
                top, centre, bottom);
    EXPECT_NEAR(top, 1.0, 0.08, "Make 1 under High 2: the made sides are as loud as the middle");
    EXPECT_NEAR(centre, made_curve(900.0, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope), 0.04,
                "Make 1 under Mid 1.5: the made sides are what the formula says, half the middle");
    EXPECT_NEAR(centre, 0.5, 0.06, "Make 1 under Mid 1.5: the made sides are half the middle");
    EXPECT(bottom < 0.01, "Make makes nothing where the curve is at 0");
    {
      Setting plain = s;
      plain.mid = 1.0f;
      set(device, plain);
      Stereo as_it_came = run(device, mono);
      const double none = band_rms(sides(as_it_came), 700.0) / band_rms(mono, 700.0);
      std::printf("  Mid at 1: sides against the middle %.4f at 700 Hz\n", none);
      EXPECT(none < 0.02, "Make makes nothing in a region left as it came");
    }
    double last = 2.0;
    bool falls = true;
    for (float make : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      s.make = make;
      set(device, s);
      out = run(device, mono);
      const double c = correlation(out.left, out.right, 4800);
      std::printf("  Make %.2f: left against right %.3f\n", make, c);
      if (!(c < last - 0.03)) falls = false;
      last = c;
    }
    EXPECT(falls, "every quarter of Make's travel takes the two sides further apart");
  }

  // 7. Smear: the made sides of one click last longer as it goes up, and are
  // as loud whatever it is set to.
  {
    double length[3], energy[3];
    int n = 0;
    for (float smear : {0.0f, 0.5f, 1.0f}) {
      Setting s;
      s.low = s.mid = s.high = 2.0f;
      s.make = 1.0f;
      s.smear = smear;
      set(device, s);
      Stereo out = run(device, impulse(0.5f, kRate, 0.5f));
      const std::vector<float> made = sides(out);
      double total = 0.0, moment = 0.0;
      for (size_t i = 0; i < made.size(); ++i) {
        const double e = static_cast<double>(made[i]) * made[i];
        total += e;
        moment += e * static_cast<double>(i);
      }
      length[n] = 1000.0 * moment / total / kRate;  // the energy's centre, in ms
      energy[n] = total;
      ++n;
    }
    std::printf("Smear 0, 0.5, 1: the made sides of a click centre at %.1f, %.1f, %.1f ms\n", length[0],
                length[1], length[2]);
    EXPECT(length[1] > length[0] * 1.5 && length[2] > length[1] * 1.3, "Smear spreads the made width in time");
    // An impulse of 0.5 in both channels is a middle of 0.5, and under widths of 2 so are the made sides.
    EXPECT_NEAR(std::sqrt(energy[0]), 0.5, 0.01, "the scatter is allpass at Smear 0");
    EXPECT_NEAR(std::sqrt(energy[2]), 0.5, 0.01, "the scatter is allpass at Smear 1");
  }

  // 8. Safe holds the sides under the middle: on a mono sound with Make full
  // and every region wide, the sides stand level with the middle at Safe 0,
  // no higher than it at 0.5 and 12 dB under it at 1; the meter says by how
  // much. Safe never narrows what came in: a sound that is all sides stays.
  {
    rng_state() = 0x5AFEu;
    const std::vector<float> mono = noise(3.0f, kRate, 0.25f);
    Setting s;
    s.low = s.mid = s.high = 2.0f;
    s.make = 1.0f;
    double ratio[4], meter[4];
    int n = 0;
    for (float safe : {0.0f, 0.5f, 0.75f, 1.0f}) {
      s.safe = safe;
      set(device, s);
      Stereo out = run(device, mono);
      ratio[n] = rms(sides(out), 48000) / rms(middle(out), 48000);
      meter[n] = device.meter(0);
      ++n;
    }
    std::printf("Safe 0, 0.5, 0.75, 1: sides against the middle %.1f, %.1f, %.1f, %.1f dB (meter %.1f, %.1f, %.1f, %.1f)\n",
                db(ratio[0]), db(ratio[1]), db(ratio[2]), db(ratio[3]), meter[0], meter[1], meter[2],
                meter[3]);
    EXPECT_NEAR(db(ratio[0]), 0.0, 0.5, "Safe 0 holds nothing: the made sides are level with the middle");
    EXPECT(meter[0] == 0.0, "Safe 0: the meter reads 0 dB");
    EXPECT(db(ratio[1]) < 0.3, "Safe 0.5: the sides are no louder than the middle");
    EXPECT_NEAR(db(ratio[2]), -7.0, 1.0, "Safe 0.75: the sides are held 7 dB under the middle");
    EXPECT_NEAR(db(ratio[3]), -12.0, 1.0, "Safe 1: the sides are held 12 dB under the middle");
    EXPECT_NEAR(meter[3], db(ratio[3]) - db(ratio[0]), 1.5, "the meter reads how far Safe holds the sides");

    // All sides (left and right in opposite phase), widened: held to what came in, not silenced.
    const std::vector<float> tone = sine(700.0f, 2.0f, kRate, 0.4f);
    s.make = 0.0f;
    s.safe = 1.0f;
    set(device, s);
    Stereo out = run(device, tone, negated(tone));
    const double kept = rms(sides(out), 48000) / rms(tone, 48000);
    std::printf("opposite phase in, widths 2, Safe 1: sides out against in %.2f dB\n", db(kept));
    EXPECT_NEAR(db(kept), 0.0, 0.5, "Safe holds a sound that is all sides to what came in, no lower");
    // And as it starts, a sound in opposite phase does not vanish.
    device.init(kRate);
    out = run(device, tone, negated(tone));
    EXPECT(rms(out.left, 48000) > 0.9 * rms(tone, 48000), "as it starts, a sound in opposite phase stays");
    // A source wider than its middle, narrowed a little: Safe leaves it alone.
    Setting narrow;
    narrow.mid = 0.9f;
    narrow.safe = 1.0f;
    set(device, narrow);
    out = run(device, tone, negated(tone));
    EXPECT(device.meter(0) == 0.0, "Safe does not act on sides that were not raised");
  }

  // 9. No click when a point is dragged or a knob jumps: each control from one
  // end to the other while a full chord sounds, against renders with no move.
  {
    std::vector<float> left = sine(110.0f, 1.0f, kRate, 0.3f);
    std::vector<float> right = sine(110.0f, 1.0f, kRate, 0.3f);
    const std::vector<float> a = sine(331.0f, 1.0f, kRate, 0.25f);
    const std::vector<float> b = sine(1319.0f, 1.0f, kRate, 0.2f);
    for (size_t i = 0; i < left.size(); ++i) {
      left[i] += a[i] + 0.5f * b[i];
      right[i] += 0.3f * a[i] - b[i];
    }
    const std::vector<float> first_l(left.begin(), left.begin() + 24000);
    const std::vector<float> first_r(right.begin(), right.begin() + 24000);
    const std::vector<float> rest_l(left.begin() + 24000, left.end());
    const std::vector<float> rest_r(right.begin() + 24000, right.end());
    auto worst_step = [](const Stereo& x) { return std::max(max_step(x.left), max_step(x.right)); };
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int way = 0; way < 2; ++way) {
        const float from = way == 0 ? p::kParamMin[id] : p::kParamMax[id];
        const float to = way == 0 ? p::kParamMax[id] : p::kParamMin[id];
        // The two renders with no move in them.
        double still = 0.0;
        for (float value : {from, to}) {
          device.init(kRate);
          device.set_param(p::kMake, 1.0f);
          device.set_param(id, value);
          run(device, first_l, first_r);
          still = std::max(still, worst_step(run(device, rest_l, rest_r)));
        }
        device.init(kRate);
        device.set_param(p::kMake, 1.0f);
        device.set_param(id, from);
        run(device, first_l, first_r);
        device.set_param(id, to);
        const double moved = worst_step(run(device, rest_l, rest_r));
        if (!(moved < still * 1.25 + 0.002)) {
          std::printf("FAIL: param %d from %g to %g clicks: step %.4f against %.4f with no move\n", id,
                      from, to, moved, still);
          ++failures();
        }
      }
    }
  }

  // 10. Level: a full-scale chord held for a minute, with each control at
  // each end and with everything up, never peaks more than 6.5 dB over the
  // input and does not grow.
  {
    const float seconds = 60.0f;
    std::vector<float> chord = sine(130.81f, seconds, kRate, 0.34f);
    const std::vector<float> e = sine(329.63f, seconds, kRate, 0.33f);
    const std::vector<float> g = sine(1567.98f, seconds, kRate, 0.33f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += e[i] + g[i];
    const std::vector<float> nothing = silence(seconds, kRate);
    double highest = 0.0;
    auto hold_chord = [&](const char* what, int id, bool one_side) {
      Stereo out = one_side ? run(device, chord, nothing) : run(device, chord);
      const size_t n = out.size(), five = static_cast<size_t>(5.0f * kRate);
      const double early = std::max(peak(out.left, five, 2 * five), peak(out.right, five, 2 * five));
      const double late = std::max(peak(out.left, n - five, n), peak(out.right, n - five, n));
      const double top = std::max(peak(out.left), peak(out.right));
      highest = std::max(highest, top);
      if (!(finite(out.left) && finite(out.right) && top < 2.12 && late < early * 1.01)) {
        std::printf("FAIL: held chord, %s %d: peak %.3f, last five seconds %.3f against %.3f\n", what,
                    id, top, late, early);
        ++failures();
      }
    };
    for (int id = 0; id < p::kNumParams; ++id) {
      if (id == p::kOutput) continue;  // a trim: it is the level
      device.init(kRate);
      device.set_param(id, p::kParamMin[id]);
      hold_chord("minimum of", id, false);
      device.init(kRate);
      device.set_param(id, p::kParamMax[id]);
      hold_chord("maximum of", id, false);
    }
    Setting all;
    all.low = all.mid = all.high = 2.0f;
    all.make = 1.0f;
    all.smear = 1.0f;
    for (int safe = 0; safe < 2; ++safe) {
      all.safe = static_cast<float>(safe);
      set(device, all);
      hold_chord("everything up, both sides, Safe", safe, false);
      set(device, all);
      hold_chord("everything up, one side, Safe", safe, true);
    }
    std::printf("held full-scale chord: highest peak %.2f dB over the input\n", db(highest));
  }

  // 11. Held tones over the piano's range through the device as it starts,
  // on a mono sound: the two sides together never fall under the input, the
  // mono sum is the input, and one side alone dips no further than stated.
  {
    double worst_total = 100.0, worst_side = 100.0, most_side = -100.0, worst_sum = 0.0;
    for (int key = 0; key < 88; key += 2) {
      const float hz = 27.5f * std::pow(2.0f, static_cast<float>(key) / 12.0f);
      const std::vector<float> tone = sine(hz, 0.5f, kRate, 0.5f);
      device.init(kRate);
      Stereo out = run(device, tone);
      const size_t from = 12000;
      const double in = rms(tone, from);
      const double l = rms(out.left, from), r = rms(out.right, from);
      worst_total = std::min(worst_total, db(std::sqrt(0.5 * (l * l + r * r)) / in));
      worst_side = std::min(worst_side, db(std::min(l, r) / in));
      most_side = std::max(most_side, db(std::max(l, r) / in));
      worst_sum = std::max(worst_sum, std::fabs(db(rms(middle(out), from) / in)));
    }
    std::printf("piano range as it starts: both sides together %.2f dB at worst, one side from %.2f to %.2f dB, mono sum off by %.4f dB\n",
                worst_total, worst_side, most_side, worst_sum);
    EXPECT(worst_total > -0.01, "held tones: the two sides together never fall under the input");
    EXPECT(worst_side > -3.5 && most_side < 2.6, "held tones: one side leans by no more than stated");
    EXPECT(worst_sum < 0.001, "held tones: the mono sum is the input");
  }

  // 12. Bad input: NaN, infinity and 1e30 are taken as silence, so once good
  // input returns the output is what it would have been after a silence.
  {
    rng_state() = 0xBAD1u;
    const std::vector<float> good = noise(1.0f, kRate, 0.3f);
    std::vector<float> bad(4800, 0.0f);
    for (size_t i = 0; i < bad.size(); ++i) {
      bad[i] = i % 3 == 0 ? std::nanf("") : (i % 3 == 1 ? INFINITY : 1.0e30f);
    }
    device.init(kRate);
    run(device, good);
    Stereo during = run(device, bad, negated(bad));
    Stereo after = run(device, good);
    device.init(kRate);
    run(device, good);
    run(device, silence(0.1f, kRate));
    Stereo clean = run(device, good);
    EXPECT(finite(during.left) && finite(during.right) && finite(after.left) && finite(after.right),
           "NaN, infinite and runaway input leaves the output finite");
    EXPECT(after.left == clean.left && after.right == clean.right && rms(after.left) > 0.1,
           "after bad input the device is where a silence would have left it");
  }

  // 13. Across a sleep, with knobs moved while asleep, the output is the same
  // at block sizes 1, 128 and 2048, and the moved knobs have snapped: waking
  // is the same as starting with those settings.
  {
    rng_state() = 0x51EEu;
    const std::vector<float> a = noise(0.5f, kRate, 0.3f);
    const std::vector<float> b = noise(0.5f, kRate, 0.3f);
    Stereo first[3], last[3];
    int n = 0;
    for (int block : {1, 128, 2048}) {
      device.init(kRate);
      first[n] = run(device, a, b, block);
      Stereo quiet = run(device, silence(1.5f, kRate), block);
      EXPECT(peak(quiet.left, 48000) == 0.0 && peak(quiet.right, 48000) == 0.0,
             "asleep within a second of silence");
      device.set_param(p::kHigh, 0.3f);
      device.set_param(p::kLowHz, 600.0f);
      device.set_param(p::kSmear, 1.0f);
      device.set_param(p::kMake, 1.0f);
      last[n] = run(device, b, a, block);
      ++n;
    }
    EXPECT(first[0].left == first[1].left && first[1].left == first[2].left &&
               first[0].right == first[1].right && first[1].right == first[2].right,
           "block sizes 1, 128 and 2048 give the same output");
    EXPECT(last[0].left == last[1].left && last[1].left == last[2].left &&
               last[0].right == last[1].right && last[1].right == last[2].right,
           "block sizes 1, 128 and 2048 give the same output after a sleep");
    device.init(kRate);
    device.set_param(p::kHigh, 0.3f);
    device.set_param(p::kLowHz, 600.0f);
    device.set_param(p::kSmear, 1.0f);
    device.set_param(p::kMake, 1.0f);
    Stereo fresh = run(device, b, a);
    EXPECT(fresh.left == last[1].left && fresh.right == last[1].right,
           "knobs moved while asleep snap: waking is the same as starting");
  }

  // 14. The device comes to rest after every control move: each control
  // thrown from end to end in mid sound, then silence, ends in exact zeros.
  {
    rng_state() = 0x4E57u;
    const std::vector<float> a = noise(0.3f, kRate, 0.3f);
    for (int id = 0; id < p::kNumParams; ++id) {
      device.init(kRate);
      device.set_param(p::kMake, 1.0f);
      device.set_param(id, p::kParamMin[id]);
      run(device, a, negated(a));
      device.set_param(id, p::kParamMax[id]);
      run(device, a);
      device.set_param(id, p::kParamMin[id]);
      render(device, 1.5f, kRate);
      Stereo rest = render(device, 0.5f, kRate);
      if (!(peak(rest.left) == 0.0 && peak(rest.right) == 0.0)) {
        std::printf("FAIL: not at rest two seconds after param %d moved (peak %g)\n", id,
                    std::max(peak(rest.left), peak(rest.right)));
        ++failures();
      }
    }
  }

  // 15. The curve is in hertz at every sample rate, also where a stage would
  // be tuned past the top of the range.
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 96000.0f}) {
      const Setting settings[] = {
          {0.0f, 1.0f, 1.7f, 180.0f, 3200.0f, 0.5f},
          {0.5f, 1.0f, 2.0f, 800.0f, 12000.0f, 0.0f},
      };
      for (const Setting& s : settings) {
        for (double hz : {100.0, 1000.0, 5000.0, 14000.0}) {
          const double want = curve(hz, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope, rate);
          worst = std::max(worst, std::fabs(db(side_gain(device, s, hz, rate)) - db(want)));
        }
      }
    }
    std::printf("44.1 and 96 kHz: worst error against the formula %.3f dB\n", worst);
    EXPECT(worst < 0.1, "the curve follows the formula at 44.1 and 96 kHz");
  }

  // 16. Every preset: a full-scale chord held for a minute peaks no more than
  // 6.5 dB over the input and does not grow; held tones over the piano's range
  // never come out with less power than went in, and the mono sum is the
  // input times the preset's own Output.
  {
    struct Preset {
      const char* name;
      float values[p::kNumParams];
    };
    const Preset presets[] = {
    // presets: begin (the sixteen of device.json, every control filled in; tmp/preset-table.py writes them)
      {"Firm and airy", {0.0f, 1.0f, 1.7f, 180.0f, 3200.0f, 0.5f, 0.7f, 0.4f, 0.5f, 0.0f}},
      {"Wide top", {0.0f, 1.0f, 2.0f, 180.0f, 2200.0f, 0.5f, 1.0f, 0.5f, 0.5f, 0.0f}},
      {"Air only", {0.0f, 1.0f, 2.0f, 180.0f, 7000.0f, 1.0f, 1.0f, 0.2f, 0.5f, 0.0f}},
      {"Open middle", {0.0f, 1.8f, 1.2f, 180.0f, 3200.0f, 0.5f, 0.9f, 0.4f, 0.5f, 0.0f}},
      {"Wide pad", {0.5f, 1.6f, 2.0f, 120.0f, 3200.0f, 0.2f, 0.9f, 0.8f, 0.4f, -1.5f}},
      {"Hazy edges", {0.0f, 1.3f, 2.0f, 180.0f, 1500.0f, 0.0f, 1.0f, 1.0f, 0.5f, 0.0f}},
      {"Tight shimmer", {0.0f, 1.0f, 2.0f, 180.0f, 5000.0f, 1.0f, 0.8f, 0.0f, 0.5f, 0.0f}},
      {"Wide ends", {2.0f, 0.6f, 2.0f, 150.0f, 3200.0f, 0.5f, 0.8f, 0.4f, 0.5f, 0.0f}},
      {"Wide bass", {2.0f, 1.0f, 1.0f, 300.0f, 3200.0f, 0.5f, 1.0f, 0.7f, 0.3f, 0.0f}},
      {"Nearly dry", {0.0f, 1.0f, 1.3f, 180.0f, 3200.0f, 0.5f, 0.4f, 0.4f, 0.5f, 0.0f}},
      {"Everything wide", {2.0f, 2.0f, 2.0f, 180.0f, 3200.0f, 0.5f, 1.0f, 0.4f, 0.0f, -3.0f}},
      {"Wide but safe", {1.5f, 2.0f, 2.0f, 180.0f, 3200.0f, 0.5f, 1.0f, 0.4f, 1.0f, 0.0f}},
      {"Soft tilt", {0.0f, 1.4f, 2.0f, 100.0f, 2000.0f, 0.0f, 0.7f, 0.4f, 0.5f, 0.0f}},
      {"Narrow top", {1.0f, 1.6f, 0.0f, 180.0f, 4000.0f, 0.5f, 0.8f, 0.4f, 0.5f, 0.0f}},
      {"Centre focus", {0.0f, 0.3f, 1.6f, 250.0f, 3200.0f, 0.5f, 0.6f, 0.4f, 0.5f, 0.0f}},
      {"All in the middle", {0.0f, 0.0f, 0.0f, 180.0f, 3200.0f, 0.5f, 0.0f, 0.4f, 0.5f, 0.0f}},
    // presets: end
    };
    const float seconds = 60.0f;
    std::vector<float> chord = sine(130.81f, seconds, kRate, 0.34f);
    const std::vector<float> e = sine(329.63f, seconds, kRate, 0.33f);
    const std::vector<float> g = sine(1567.98f, seconds, kRate, 0.33f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += e[i] + g[i];
    int count = 0;
    double highest = 0.0, lowest_total = 100.0, worst_sum = 0.0;
    for (const Preset& preset : presets) {
      ++count;
      auto load = [&] {
        device.init(kRate);
        for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.values[id]);
      };
      const double trim = std::pow(10.0, preset.values[p::kOutput] / 20.0);
      load();
      Stereo out = run(device, chord);
      const size_t n = out.size(), five = static_cast<size_t>(5.0f * kRate);
      const double early = std::max(peak(out.left, five, 2 * five), peak(out.right, five, 2 * five));
      const double late = std::max(peak(out.left, n - five, n), peak(out.right, n - five, n));
      const double top = std::max(peak(out.left), peak(out.right));
      highest = std::max(highest, top);
      if (!(finite(out.left) && finite(out.right) && top < 2.12 && late < early * 1.01)) {
        std::printf("FAIL: preset %s, held chord: peak %.3f, last five seconds %.3f against %.3f\n",
                    preset.name, top, late, early);
        ++failures();
      }
      double total = 100.0, sum = 0.0;
      for (int key = 0; key < 88; key += 4) {
        const float hz = 27.5f * std::pow(2.0f, static_cast<float>(key) / 12.0f);
        const std::vector<float> tone = sine(hz, 0.5f, kRate, 0.5f);
        load();
        Stereo heard = run(device, tone);
        const size_t from = 12000;
        const double in = rms(tone, from) * trim;
        const double l = rms(heard.left, from), r = rms(heard.right, from);
        total = std::min(total, db(std::sqrt(0.5 * (l * l + r * r)) / in));
        sum = std::max(sum, std::fabs(db(rms(middle(heard), from) / in)));
      }
      lowest_total = std::min(lowest_total, total);
      worst_sum = std::max(worst_sum, sum);
      if (!(total > -0.01 && sum < 0.001)) {
        std::printf("FAIL: preset %s, held tones: both sides together %.3f dB at worst, mono sum off by %.4f dB\n",
                    preset.name, total, sum);
        ++failures();
      }
    }
    std::printf("%d presets: held chord peaks %.2f dB over the input at most; held tones never under %.3f dB, mono sum off by %.4f dB at most\n",
                count, db(highest), lowest_total, worst_sum);
    EXPECT(count == 16, "all sixteen presets are held to the level rules");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("spread", 10.0f, kRate, [&] { run(device, input); });

  return finish("spread");
}
