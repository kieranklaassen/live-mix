// Native harness for Ambient EQ (cpp/devices/ambient-eq). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it this EQ: flat is the input,
// each tone control moves its own region, and Clear turns down a frequency
// that rings on above a bed of sound while leaving the bed, and anything
// sparse, alone. Nobody hears this run, so every check prints what it
// measured next to what was asked.

#include "../devices/ambient-eq/ambient_eq.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::AmbientEq;
namespace p = livemix::ambient_eq;

static AmbientEq device;

static const float kRate = 48000.0f;
// The third-octave band Clear is asked to act on: 180·2^(5/3) to 180·2^2,
// centre 641.4 Hz.
static const double kRingLo = 180.0 * std::pow(2.0, 5.0 / 3.0);
static const double kRingHi = 720.0;
static const double kRingHz = std::sqrt(kRingLo * kRingHi);
static const double kSixthOctave = std::pow(2.0, 1.0 / 6.0);

static size_t at(double seconds, double rate = kRate) {
  return static_cast<size_t>(seconds * rate);
}

static void measured(const char* what, double value, const char* unit, const char* target) {
  std::printf("  %-66s %9.3f %-3s (%s)\n", what, value, unit, target);
}

// Pink noise: the test kit's white noise through Paul Kellet's refined
// filter (six one-poles and a one-sample delay), scaled to `level` RMS. The
// first second warms the filter up and is thrown away. Measured through the
// band-pass below over 60 s, its level per octave is the same in all 23 of
// Clear's bands to within 0.3 dB at 44.1, 48 and 96 kHz.
static std::vector<float> pink(float seconds, float rate, double level, uint32_t seed) {
  rng_state() = seed;
  const size_t warm = at(1.0, rate);
  const size_t total = at(seconds, rate);
  std::vector<float> out(total);
  double b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (size_t i = 0; i < warm + total; ++i) {
    const double w = white();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    const double value = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
    if (i >= warm) out[i - warm] = static_cast<float>(value);
  }
  const double scale = level / rms(out);
  for (float& v : out) v = static_cast<float>(v * scale);
  return out;
}

// The band from `lo` to `hi`: a sixteenth-order Butterworth high-pass and a
// sixteenth-order low-pass (96 dB per octave each side) as biquads in double
// precision. Integrated over frequency, what it passes of pink noise is the
// ideal band's power to within 0.01 dB for a third and for half an octave.
static std::vector<float> band_pass(const std::vector<float>& x, double lo, double hi,
                                    double rate) {
  const int kOrder = 16;
  std::vector<double> y(x.begin(), x.end());
  for (int side = 0; side < 2; ++side) {
    const double w = 2.0 * kPi * (side == 0 ? lo : hi) / rate;
    for (int section = 0; section < kOrder / 2; ++section) {
      const double q = 1.0 / (2.0 * std::cos(kPi * (2 * section + 1) / (2.0 * kOrder)));
      const double alpha = std::sin(w) / (2.0 * q);
      const double cosw = std::cos(w);
      const double a0 = 1.0 + alpha;
      const double b1 = (side == 0 ? -(1.0 + cosw) : 1.0 - cosw) / a0;
      const double b0 = (side == 0 ? 1.0 + cosw : 1.0 - cosw) * 0.5 / a0;
      const double a1 = -2.0 * cosw / a0;
      const double a2 = (1.0 - alpha) / a0;
      double z1 = 0.0, z2 = 0.0;
      for (double& v : y) {
        const double out = b0 * v + z1;
        z1 = b1 * v - a1 * out + z2;
        z2 = b0 * v - a2 * out;
        v = out;
      }
    }
  }
  return std::vector<float>(y.begin(), y.end());
}

// RMS of `x` in the third-octave band centred on `centre`, over [from, to).
static double third_octave(const std::vector<float>& x, double centre, size_t from, size_t to,
                           double rate = kRate) {
  return rms(band_pass(x, centre / kSixthOctave, centre * kSixthOctave, rate), from, to);
}

// `x` with the steady sine at `hz` taken out: a least-squares sine fitted to
// each quarter second and subtracted. What is left is the noise around it.
static std::vector<float> without_tone(const std::vector<float>& x, double hz,
                                       double rate = kRate) {
  std::vector<float> out = x;
  const size_t piece = at(0.25, rate);
  for (size_t start = 0; start + piece <= x.size(); start += piece) {
    double c = 0.0, s = 0.0;
    for (size_t i = start; i < start + piece; ++i) {
      const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
      c += x[i] * std::cos(phase);
      s += x[i] * std::sin(phase);
    }
    c *= 2.0 / static_cast<double>(piece);
    s *= 2.0 / static_cast<double>(piece);
    for (size_t i = start; i < start + piece; ++i) {
      const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
      out[i] = static_cast<float>(x[i] - c * std::cos(phase) - s * std::sin(phase));
    }
  }
  return out;
}

// A run that also reads the meter after every block.
struct Metered {
  Stereo out;
  std::vector<float> meter;  // one reading per 128-frame block
  double deepest(size_t from, size_t to) const {
    double low = 0.0;
    for (size_t b = from / kBlock; b < std::min(meter.size(), to / kBlock); ++b) {
      low = std::min(low, static_cast<double>(meter[b]));
    }
    return low;
  }
  double shallowest(size_t from, size_t to) const {
    double high = -1.0e9;
    for (size_t b = from / kBlock; b < std::min(meter.size(), to / kBlock); ++b) {
      high = std::max(high, static_cast<double>(meter[b]));
    }
    return high;
  }
  // The reading in force at sample `index`.
  double at_sample(size_t index) const { return meter[std::min(meter.size() - 1, index / kBlock)]; }
};

static Metered run_metered(AmbientEq& d, const std::vector<float>& left,
                           const std::vector<float>& right) {
  Metered result;
  const size_t total = left.size();
  result.out.left.resize(total);
  result.out.right.resize(total);
  for (size_t done = 0; done < total;) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(kBlock), total - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = left[done + i];
      d.in_right()[i] = right[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      result.out.left[done + i] = d.out_left()[i];
      result.out.right[done + i] = d.out_right()[i];
    }
    result.meter.push_back(d.meter(0));
    done += frames;
  }
  return result;
}

// A run in which `move(block)` sets parameters before each 128-frame block.
template <typename Move>
static Stereo run_moving(AmbientEq& d, const std::vector<float>& mono, Move move) {
  Stereo out;
  out.left.resize(mono.size());
  out.right.resize(mono.size());
  int block = 0;
  for (size_t done = 0; done < mono.size(); ++block) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(kBlock), mono.size() - done));
    move(block);
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = mono[done + i];
      d.in_right()[i] = mono[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// What a tone at `hz` gains through the device with one parameter set, dB.
static double tone_gain_db(int param, float value, double hz) {
  device.init(kRate);
  device.set_param(p::kClear, 0.0f);
  device.set_param(param, value);
  std::vector<float> in = sine(static_cast<float>(hz), 2.0f, kRate, 0.25f);
  Stereo out = run(device, in);
  return db(tone_level(out.left, hz, kRate, at(1.0), at(2.0)) /
            tone_level(in, hz, kRate, at(1.0), at(2.0)));
}

// How far a 320 Hz output strays from a steady sine: y[n+1] - 2cos(w)y[n] +
// y[n-1] is zero for any steady sine at w, small while its level glides, and
// the size of the jump where there is a click.
static double click_residue(const std::vector<float>& y, double hz) {
  const double k = 2.0 * std::cos(2.0 * kPi * hz / kRate);
  double worst = 0.0;
  for (size_t i = 1; i + 1 < y.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(y[i + 1]) - k * y[i] + y[i - 1]));
  }
  return worst;
}

int main() {
  char label[200];

  // 1. Conformance. An EQ is linear and has no ceiling of its own, so the
  // bound is what its boosts can do. The four tone stages at +12 dB barely
  // overlap: together they reach +12.7 dB at one frequency (317 Hz), a gain
  // of 4.3. The loudest the conformance signals come out is 5.2 (every
  // parameter at its maximum: the four boosts and the Low cut's overshoot on
  // noise at 0.9), then 4.0 (Air alone). 8, the kit's default bound, is 3.7 dB
  // over the first and far under anything unstable.
  Conformance spec;
  spec.name = "ambient-eq";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 8.0f;
  check_effect(device, spec, kRate);
  std::printf("1. conformance (check_effect): max_peak %.1f, tail %.1f s\n", spec.max_peak,
              spec.tail_seconds);

  // 2. Flat is flat: defaults with Clear at 0 return the input.
  std::printf("2. flat is flat\n");
  {
    device.init(kRate);
    device.set_param(p::kClear, 0.0f);
    rng_state() = 0xF1A7u;
    std::vector<float> left = noise(2.0f, kRate, 0.5f);
    std::vector<float> right = noise(2.0f, kRate, 0.5f);
    Stereo out = run(device, left, right);
    double worst = 0.0;
    for (size_t i = 0; i < left.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - right[i]));
    }
    measured("defaults, Clear 0: largest difference from the input", worst, "", "under 1e-6");
    EXPECT(worst < 1.0e-6, "defaults with Clear at 0 return the input");
  }

  // 3. Each tone control does what its name says.
  std::printf("3. tone controls\n");
  {
    struct Control {
      int param;
      const char* name;
      double hz;
    };
    const Control controls[] = {{p::kLow, "Low", 60.0},
                                {p::kBody, "Body", 320.0},
                                {p::kPresence, "Presence", 3000.0},
                                {p::kAir, "Air", 14000.0}};
    for (const Control& control : controls) {
      for (float amount : {6.0f, -6.0f}) {
        const double gain = tone_gain_db(control.param, amount, control.hz);
        std::snprintf(label, sizeof label, "%s %+.0f dB at %.0f Hz", control.name, amount,
                      control.hz);
        measured(label, gain, "dB", amount > 0.0f ? "+6 ± 0.6" : "-6 ± 0.6");
        EXPECT_NEAR(gain, amount, 0.6, label);
      }
    }
    for (float amount : {6.0f, -6.0f}) {
      const double far = tone_gain_db(p::kBody, amount, 3000.0);
      std::snprintf(label, sizeof label, "Body %+.0f dB leaves 3 kHz alone", amount);
      measured(label, far, "dB", "within 0.3 of 0");
      EXPECT_NEAR(far, 0.0, 0.3, label);
      const double near = tone_gain_db(p::kPresence, amount, 320.0);
      std::snprintf(label, sizeof label, "Presence %+.0f dB leaves 320 Hz alone", amount);
      measured(label, near, "dB", "within 0.3 of 0");
      EXPECT_NEAR(near, 0.0, 0.3, label);
    }
  }

  // 4. The cuts.
  std::printf("4. cuts\n");
  {
    const double low_stop = tone_gain_db(p::kLowCut, 100.0f, 50.0);
    const double low_pass = tone_gain_db(p::kLowCut, 100.0f, 400.0);
    measured("Low cut 100 Hz at 50 Hz", low_stop, "dB", "-22 or lower");
    measured("Low cut 100 Hz at 400 Hz", low_pass, "dB", "within 0.3 of 0");
    EXPECT(low_stop <= -22.0, "Low cut 100 Hz: 50 Hz is at least 22 dB down");
    EXPECT_NEAR(low_pass, 0.0, 0.3, "Low cut 100 Hz leaves 400 Hz alone");
    const double high_stop = tone_gain_db(p::kHighCut, 2000.0f, 8000.0);
    const double high_pass = tone_gain_db(p::kHighCut, 2000.0f, 500.0);
    measured("High cut 2 kHz at 8 kHz", high_stop, "dB", "-22 or lower");
    measured("High cut 2 kHz at 500 Hz", high_pass, "dB", "within 0.3 of 0");
    EXPECT(high_stop <= -22.0, "High cut 2 kHz: 8 kHz is at least 22 dB down");
    EXPECT_NEAR(high_pass, 0.0, 0.3, "High cut 2 kHz leaves 500 Hz alone");
  }

  // The bed for everything below: 15 s of pink noise at -26 dBFS RMS, and a
  // sine in the middle of one band at 15 times that band's noise power, so
  // the band stands 12 dB over its neighbours.
  const double kBedLevel = std::pow(10.0, -26.0 / 20.0);
  const std::vector<float> bed = pink(15.0f, kRate, kBedLevel, 0xA3B1E5u);
  const double band_noise = rms(band_pass(bed, kRingLo, kRingHi, kRate), at(1.0), bed.size());
  const double ring_gain = std::sqrt(2.0 * 15.0) * band_noise;
  auto ringing = [&](float seconds, float from_seconds = 0.0f, float to_seconds = 1.0e9f) {
    std::vector<float> x(bed.begin(), bed.begin() + static_cast<long>(at(seconds)));
    for (size_t i = 0; i < x.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      if (t < from_seconds || t >= to_seconds) continue;
      x[i] += static_cast<float>(ring_gain * std::sin(2.0 * kPi * kRingHz * t));
    }
    return x;
  };

  // 5. Broadband sound passes Clear unchanged.
  std::printf("5. broadband sound passes (pink noise %.1f dBFS RMS, Clear 1, 10 s)\n",
              db(rms(bed)));
  {
    device.init(kRate);
    device.set_param(p::kClear, 1.0f);
    std::vector<float> in(bed.begin(), bed.begin() + static_cast<long>(at(10.0)));
    Metered result = run_metered(device, in, in);
    for (double centre : {250.0, 1000.0, 5000.0}) {
      const double change = db(third_octave(result.out.left, centre, at(6.0), at(10.0)) /
                               third_octave(in, centre, at(6.0), at(10.0)));
      std::snprintf(label, sizeof label, "third octave at %.0f Hz, last 4 s, against the input",
                    centre);
      measured(label, change, "dB", "within 0.75 of 0");
      EXPECT_NEAR(change, 0.0, 0.75, label);
    }
    const double deepest = result.deepest(at(6.0), at(10.0));
    measured("meter(0), deepest over the last 4 s", deepest, "dB", "above -1");
    measured("meter(0), deepest over all 10 s", result.deepest(0, at(10.0)), "dB",
             "for the record");
    EXPECT(deepest > -1.0, "pink noise: the meter stays above -1 dB");
  }

  // 6. A ringing frequency is turned down.
  std::printf("6. a ringing frequency is turned down (sine at %.1f Hz, 15x its band's noise)\n",
              kRingHz);
  Metered rung;
  const std::vector<float> ring_in = ringing(8.0f);
  {
    for (float clear : {1.0f, 0.5f}) {
      device.init(kRate);
      device.set_param(p::kClear, clear);
      device.set_param(p::kClearTime, 0.5f);
      Metered result = run_metered(device, ring_in, ring_in);
      const double drop = db(tone_level(result.out.left, kRingHz, kRate, at(6.0), at(8.0)) /
                             tone_level(ring_in, kRingHz, kRate, at(6.0), at(8.0)));
      if (clear == 1.0f) {
        measured("Clear 1: the sine after 6 s, against its input", drop, "dB", "-6 ± 1.5");
        EXPECT_NEAR(drop, -6.0, 1.5, "Clear 1: the ringing sine is 6 dB down after 6 s");
        const double far = db(third_octave(result.out.left, 2500.0, at(6.0), at(8.0)) /
                              third_octave(ring_in, 2500.0, at(6.0), at(8.0)));
        measured("Clear 1: the noise at 2.5 kHz", far, "dB", "within 0.75 of 0");
        EXPECT_NEAR(far, 0.0, 0.75, "Clear 1: the noise at 2.5 kHz is left alone");
        const double low = result.deepest(at(6.0), at(8.0));
        const double high = result.shallowest(at(6.0), at(8.0));
        measured("Clear 1: meter(0) after 6 s, deepest", low, "dB", "-6 ± 1.5");
        measured("Clear 1: meter(0) after 6 s, shallowest", high, "dB", "-6 ± 1.5");
        EXPECT_NEAR(low, -6.0, 1.5, "Clear 1: the meter reads the cut (deepest)");
        EXPECT_NEAR(high, -6.0, 1.5, "Clear 1: the meter reads the cut (shallowest)");
        rung = result;
      } else {
        measured("Clear 0.5: the sine after 6 s, against its input", drop, "dB", "-3 ± 1");
        EXPECT_NEAR(drop, -3.0, 1.0, "Clear 0.5: the ringing sine is 3 dB down after 6 s");
      }
    }
  }

  // 7. It takes the time it says: the sine joins a bed that has been playing
  // for 4 s, and the cut is read 1 s later.
  std::printf("7. it takes the time it says (cut 1 s after the sine starts)\n");
  {
    const std::vector<float> in = ringing(6.0f, 4.0f);
    double cut[2], heard[2];
    int which = 0;
    for (float seconds : {0.3f, 4.0f}) {
      device.init(kRate);
      device.set_param(p::kClear, 1.0f);
      device.set_param(p::kClearTime, seconds);
      Metered result = run_metered(device, in, in);
      cut[which] = result.at_sample(at(5.0));
      heard[which] = db(tone_level(result.out.left, kRingHz, kRate, at(4.9), at(5.1)) /
                        tone_level(in, kRingHz, kRate, at(4.9), at(5.1)));
      ++which;
    }
    measured("Clear time 0.3 s: meter(0) at 1 s", cut[0], "dB", "the deeper");
    measured("Clear time 4 s: meter(0) at 1 s", cut[1], "dB", "at least 2 dB shallower");
    measured("Clear time 0.3 s: the sine at 1 s (0.2 s window)", heard[0], "dB", "the deeper");
    measured("Clear time 4 s: the sine at 1 s (0.2 s window)", heard[1], "dB",
             "at least 2 dB less cut");
    EXPECT(cut[0] <= cut[1] - 2.0, "after 1 s the cut is 2 dB deeper at Clear time 0.3 than at 4");
    EXPECT(heard[0] <= heard[1] - 2.0, "and so is what the sine has lost");
  }

  // 8. It lets go: the sine stops after 8 s, the noise goes on.
  std::printf("8. it lets go (Clear time 0.5 s, the sine stops, 5 s later)\n");
  {
    const std::vector<float> in = ringing(15.0f, 0.0f, 8.0f);
    device.init(kRate);
    device.set_param(p::kClear, 1.0f);
    device.set_param(p::kClearTime, 0.5f);
    Metered result = run_metered(device, in, in);
    const double before = result.at_sample(at(8.0) - 1);
    const double after = result.at_sample(at(13.0));
    const double band =
        db(rms(band_pass(result.out.left, kRingLo, kRingHi, kRate), at(13.0), at(15.0)) /
           rms(band_pass(in, kRingLo, kRingHi, kRate), at(13.0), at(15.0)));
    measured("meter(0) as the sine stops", before, "dB", "the cut of check 6");
    measured("meter(0) ten Clear times later", after, "dB", "within 0.3 of 0");
    measured("the band's noise from then on, against the input", band, "dB", "within 0.3 of 0");
    EXPECT(before < -4.5, "the cut is in force when the sine stops");
    EXPECT(after >= -0.3 && after <= 0.0, "ten Clear times after the sine stops the cut is gone");
    EXPECT_NEAR(band, 0.0, 0.3, "and the band's noise passes as it came");
  }

  // 9. Sparse sounds are left alone, at the default Clear time and at the
  // fastest, where a cut would get furthest before it was called off.
  std::printf("9. sparse sounds are left alone (Clear 1, 8 s)\n");
  {
    // The largest change of the tone at `hz` over any one of the 8 seconds.
    auto worst_second = [&](const Metered& result, const std::vector<float>& in, double hz) {
      double worst = 0.0;
      for (int second = 0; second < 8; ++second) {
        const double change =
            db(tone_level(result.out.left, hz, kRate, at(second), at(second + 1)) /
               tone_level(in, hz, kRate, at(second), at(second + 1)));
        if (std::fabs(change) > std::fabs(worst)) worst = change;
      }
      return worst;
    };
    for (float seconds : {1.5f, 0.2f}) {
      auto sparse = [&](const std::vector<float>& in) {
        device.init(kRate);
        device.set_param(p::kClear, 1.0f);
        device.set_param(p::kClearTime, seconds);
        return run_metered(device, in, in);
      };
      std::printf("  Clear time %.1f s\n", seconds);

      const std::vector<float> lone = sine(440.0f, 8.0f, kRate, 0.25f);
      Metered result = sparse(lone);
      double worst = worst_second(result, lone, 440.0);
      double deepest = result.deepest(0, at(8.0));
      measured("a lone 440 Hz sine: worst second", worst, "dB", "within 0.5 of 0");
      measured("a lone 440 Hz sine: deepest meter(0)", deepest, "dB", "within 0.5 of 0");
      EXPECT(std::fabs(worst) < 0.5, "a lone 440 Hz sine changes by less than 0.5 dB");
      EXPECT(deepest > -0.5, "a lone 440 Hz sine: no cut is ever in force");

      std::vector<float> fifth = sine(220.0f, 8.0f, kRate, 0.25f);
      const std::vector<float> upper = sine(330.0f, 8.0f, kRate, 0.25f);
      for (size_t i = 0; i < fifth.size(); ++i) fifth[i] += upper[i];
      result = sparse(fifth);
      for (double hz : {220.0, 330.0}) {
        worst = worst_second(result, fifth, hz);
        std::snprintf(label, sizeof label, "a bare fifth: %.0f Hz, worst second", hz);
        measured(label, worst, "dB", "within 1 of 0");
        EXPECT(std::fabs(worst) < 1.0, label);
      }
      deepest = result.deepest(0, at(8.0));
      measured("a bare fifth: deepest meter(0)", deepest, "dB", "within 1 of 0");
      EXPECT(deepest > -1.0, "a bare fifth: no cut to speak of is ever in force");

      // The hardest lone note found while measuring: a loud bass tone that
      // starts on its peak, stops dead after 2 s and comes back half a second
      // later. Each start and stop smears across the low bands.
      std::vector<float> bass(at(8.0));
      for (size_t i = 0; i < bass.size(); ++i) {
        const double t = static_cast<double>(i) / kRate;
        bass[i] =
            (t >= 2.0 && t < 2.5) ? 0.0f : static_cast<float>(0.9 * std::cos(2.0 * kPi * 90.0 * t));
      }
      result = sparse(bass);
      worst = worst_second(result, bass, 90.0);
      deepest = result.deepest(0, at(8.0));
      measured("a 90 Hz tone from its peak, stopped and restarted: worst second", worst, "dB",
               "within 0.5 of 0");
      measured("a 90 Hz tone from its peak, stopped and restarted: deepest meter(0)", deepest, "dB",
               "within 0.5 of 0");
      EXPECT(std::fabs(worst) < 0.5,
             "a lone bass tone with hard edges changes by less than 0.5 dB");
      EXPECT(deepest > -0.5, "a lone bass tone with hard edges: no cut is ever in force");

      // One note with overtones lights many bands, so by the count of bands
      // alone it is a bed; its fundamental must still be left alone. A
      // sawtooth (partials at 1/n) and a softer bass note (1/n²).
      struct Note {
        const char* name;
        double hz;
        double slope;
      };
      for (const Note& note : {Note{"a lone 220 Hz sawtooth", 220.0, 1.0},
                               Note{"a lone soft 55 Hz note", 55.0, 2.0}}) {
        std::vector<float> in(at(8.0), 0.0f);
        for (int n = 1; n * note.hz < 16000.0; ++n) {
          const double gain = 0.2 / std::pow(static_cast<double>(n), note.slope);
          for (size_t i = 0; i < in.size(); ++i) {
            in[i] += static_cast<float>(
                gain *
                std::sin(2.0 * kPi * n * note.hz * static_cast<double>(i) / kRate + 0.7 * n));
          }
        }
        result = sparse(in);
        worst = worst_second(result, in, note.hz);
        std::snprintf(label, sizeof label, "%s: its fundamental, worst second", note.name);
        measured(label, worst, "dB", "within 0.5 of 0");
        EXPECT(std::fabs(worst) < 0.5, label);
        std::snprintf(label, sizeof label, "%s: deepest meter(0)", note.name);
        measured(label, result.deepest(0, at(8.0)), "dB", "within 0.5 of 0");
        EXPECT(result.deepest(0, at(8.0)) > -0.5, label);
      }
    }
  }

  // 10. The image does not move.
  std::printf("10. the image does not move\n");
  {
    EXPECT(rung.out.left == rung.out.right,
           "a mono input gives bit-identical left and right outputs");
    measured("mono in: samples where left and right differ",
             rung.out.left == rung.out.right ? 0.0 : 1.0, "", "0");

    // The sine on the left only, over independent noise on each side.
    const std::vector<float> other = pink(8.0f, kRate, kBedLevel, 0x5EED77u);
    device.init(kRate);
    device.set_param(p::kClear, 1.0f);
    device.set_param(p::kClearTime, 0.5f);
    Metered result = run_metered(device, ring_in, other);
    auto band_level = [&](const std::vector<float>& x) {
      return rms(band_pass(without_tone(x, kRingHz), kRingLo, kRingHi, kRate), at(5.0), at(8.0));
    };
    const double left = db(band_level(result.out.left) / band_level(ring_in));
    const double right = db(band_level(result.out.right) / band_level(other));
    measured("left: the band's noise under the sine, against the input", left, "dB",
             "a cut, -1 or lower");
    measured("right: the same band, against the input", right, "dB", "within 0.5 of the left");
    measured("meter(0) over those 3 s, deepest", result.deepest(at(5.0), at(8.0)), "dB",
             "for the record");
    EXPECT(left < -1.0, "the cut the left's sine asks for is there to compare");
    EXPECT_NEAR(right, left, 0.5, "the right channel is cut by what the left is");
  }

  // Clear across its range: the set-up of check 6 with the sine in the middle
  // of each band in turn. The two lowest bands have nothing below them to
  // stand out of and are left alone; every other band turns its sine down.
  std::printf("Clear across its range (the sine of check 6 in each band in turn, Clear 1)\n");
  {
    const std::vector<float> noise_bed(bed.begin(), bed.begin() + static_cast<long>(at(8.0)));
    for (int k = 0; k < AmbientEq::kBands; ++k) {
      const double lo =
          k < 4 ? 45.0 * std::pow(2.0, 0.5 * k) : 180.0 * std::pow(2.0, (k - 4) / 3.0);
      const double hi = lo * std::pow(2.0, k < 4 ? 0.5 : 1.0 / 3.0);
      const double hz = std::sqrt(lo * hi);
      const double level = rms(band_pass(bed, lo, hi, kRate), at(1.0), bed.size());
      std::vector<float> in = noise_bed;
      for (size_t i = 0; i < in.size(); ++i) {
        in[i] += static_cast<float>(std::sqrt(30.0) * level *
                                    std::sin(2.0 * kPi * hz * static_cast<double>(i) / kRate));
      }
      device.init(kRate);
      device.set_param(p::kClear, 1.0f);
      device.set_param(p::kClearTime, 0.5f);
      Stereo out = run(device, in);
      const double drop = db(tone_level(out.left, hz, kRate, at(6.0), at(8.0)) /
                             tone_level(in, hz, kRate, at(6.0), at(8.0)));
      std::snprintf(label, sizeof label, "band %2d, %5.0f to %5.0f Hz: the sine at %7.1f Hz", k, lo,
                    hi, hz);
      if (k < 2) {
        measured(label, drop, "dB", "left alone: within 0.3 of 0");
        EXPECT_NEAR(drop, 0.0, 0.3, label);
      } else {
        measured(label, drop, "dB", "-6 ± 1.5");
        EXPECT_NEAR(drop, -6.0, 1.5, label);
      }
    }
  }

  // 11. No clicks: Body from -12 to +12, then Low cut from 20 Hz up to 300
  // and back, a small step every block, under a 320 Hz tone.
  std::printf("11. no clicks\n");
  {
    const float kTone = 0.2f;
    const int kBodySteps = 480, kCutSteps = 300;
    std::vector<float> tone = sine(320.0f, 3.2f, kRate, kTone);
    device.init(kRate);
    device.set_param(p::kBody, -12.0f);
    Stereo out = run_moving(device, tone, [&](int block) {
      if (block <= kBodySteps) {
        device.set_param(p::kBody, -12.0f + 24.0f * static_cast<float>(block) / kBodySteps);
        return;
      }
      const int step = block - kBodySteps;
      const int up = step <= kCutSteps ? step : std::max(0, 2 * kCutSteps - step);
      device.set_param(p::kLowCut, 20.0f * std::pow(15.0f, static_cast<float>(up) / kCutSteps));
    });
    const double own = max_step(tone) * std::pow(10.0, 12.0 / 20.0);
    const double step = max_step(out.left);
    const double loudest = peak(out.left) / kTone;
    measured("largest step in the output", step, "", "under the limit");
    measured("the tone's own largest step at +12 dB, times 1.5", 1.5 * own, "", "the limit");
    measured("loudest gain reached", db(loudest), "dB", "+12");
    EXPECT(step <= 1.5 * own, "sweeping Body and Low cut under a tone does not click");
    EXPECT_NEAR(db(loudest), 12.0, 0.2, "the sweep reaches +12 dB at 320 Hz");
    // Sharper than the step: how far the output leaves a steady sine.
    const double residue = click_residue(out.left, 320.0) / (kTone * loudest);
    measured("largest departure from a steady sine, of its amplitude", 100.0 * residue, "%",
             "under 1");
    EXPECT(residue < 0.01, "no sample of the sweep jumps by 1 % of the tone");

    // Straight off the stop and back: 20 Hz to 300 Hz in one move.
    device.init(kRate);
    tone = sine(320.0f, 1.0f, kRate, kTone);
    out = run_moving(device, tone, [&](int block) {
      if (block == 100) device.set_param(p::kLowCut, 300.0f);
      if (block == 250) device.set_param(p::kLowCut, 20.0f);
    });
    const double jump = click_residue(out.left, 320.0) / kTone;
    measured("Low cut 20 to 300 Hz and back in one move, same measure", 100.0 * jump, "%",
             "under 1");
    EXPECT(jump < 0.01, "the Low cut comes off its stop and returns without a click");
    EXPECT(max_step(out.left) <= 1.5 * max_step(tone), "and its largest step stays the tone's");
    double worst = 0.0;
    for (size_t i = at(0.9); i < tone.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - tone[i]));
    }
    measured("back on the stop: largest difference from the input", worst, "", "0");
    EXPECT(worst == 0.0, "back on its stop the Low cut is out of circuit again");
  }

  // A fault upstream does not stay: one NaN and one infinite sample go in
  // while every filter is at work, and the output is finite throughout.
  // Without Clear, set flat again while the sound goes on, the output is the
  // input once more.
  std::printf("bad input\n");
  {
    std::vector<float> in(ring_in.begin(), ring_in.begin() + static_cast<long>(at(2.0)));
    in[at(0.5)] = std::nanf("");
    in[at(0.6)] = INFINITY;
    for (float clear : {1.0f, 0.0f}) {
      device.init(kRate);
      device.set_param(p::kBody, 6.0f);
      device.set_param(p::kAir, 6.0f);
      device.set_param(p::kLowCut, 80.0f);
      device.set_param(p::kHighCut, 12000.0f);
      device.set_param(p::kClear, clear);
      device.set_param(p::kClearTime, 0.2f);
      Metered result = run_metered(device, in, in);
      EXPECT(finite(result.out.left) && finite(result.out.right),
             "a NaN and an infinite input sample leave no trace");
      if (clear == 1.0f) {
        measured("Clear 1: meter(0) 1.4 s after them", result.at_sample(in.size() - 1), "dB",
                 "a cut in force: -3 or lower");
        EXPECT(result.at_sample(in.size() - 1) < -3.0, "and Clear goes on working");
        continue;
      }
      device.set_param(p::kBody, 0.0f);
      device.set_param(p::kAir, 0.0f);
      device.set_param(p::kLowCut, 20.0f);
      device.set_param(p::kHighCut, 20000.0f);
      const std::vector<float> rest(bed.begin(), bed.begin() + static_cast<long>(at(1.0)));
      Stereo out = run(device, rest);
      double worst = 0.0;
      for (size_t i = at(0.5); i < rest.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - rest[i]));
      }
      measured("Clear 0, set flat again: largest difference from the input", worst, "", "0");
      EXPECT(worst == 0.0, "and set flat again the device returns its input");
    }
  }

  // The device sleeps, and waking is the same as starting.
  std::printf("asleep and awake\n");
  {
    const std::vector<float> in = ringing(3.0f);
    device.init(kRate);
    device.set_param(p::kClear, 1.0f);
    device.set_param(p::kClearTime, 0.5f);
    Metered first = run_metered(device, in, in);
    render(device, 1.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the input stops");
    measured("meter(0) with a cut in force, then asleep", first.at_sample(in.size() - 1), "dB",
             "then 0");
    EXPECT(first.at_sample(in.size() - 1) < -3.0, "the cut was in force before the silence");
    EXPECT(device.meter(0) == 0.0f, "asleep the meter reads 0");
    EXPECT(device.meter(1) == 0.0f && device.meter(-1) == 0.0f, "an unknown meter reads 0");
    Metered second = run_metered(device, in, in);
    EXPECT(second.out.left == first.out.left && second.out.right == first.out.right,
           "waking after silence renders what a fresh start does, bit for bit");
  }

  // Clear at other sample rates: the bands are laid out in Hz, so the same
  // sine over the same kind of bed gets the same cut.
  std::printf("other sample rates (the set-up of check 6, Clear 1)\n");
  for (float rate : {44100.0f, 96000.0f}) {
    const std::vector<float> noise_bed = pink(8.0f, rate, kBedLevel, 0xA3B1E5u);
    const double level =
        rms(band_pass(noise_bed, kRingLo, kRingHi, rate), at(1.0, rate), noise_bed.size());
    std::vector<float> in = noise_bed;
    for (size_t i = 0; i < in.size(); ++i) {
      in[i] += static_cast<float>(std::sqrt(30.0) * level *
                                  std::sin(2.0 * kPi * kRingHz * static_cast<double>(i) / rate));
    }
    device.init(rate);
    device.set_param(p::kClear, 1.0f);
    device.set_param(p::kClearTime, 0.5f);
    Stereo out = run(device, in);
    const double drop = db(tone_level(out.left, kRingHz, rate, at(6.0, rate), at(8.0, rate)) /
                           tone_level(in, kRingHz, rate, at(6.0, rate), at(8.0, rate)));
    std::snprintf(label, sizeof label, "%.1f kHz: the sine after 6 s, against its input",
                  rate / 1000.0f);
    measured(label, drop, "dB", "-6 ± 1.5");
    EXPECT_NEAR(drop, -6.0, 1.5, label);
  }

  // 12. Cost, on 10 s of the ringing bed with Clear at work.
  device.init(kRate);
  device.set_param(p::kClear, 1.0f);
  device.set_param(p::kClearTime, 0.5f);
  const std::vector<float> load = ringing(10.0f);
  report_cost("ambient-eq", 10.0f, kRate, [&] { run(device, load); });

  // And with everything in: both cuts, all four tone stages, and five bands
  // ringing at once (every fifth band, which is as many as can stand clear of
  // each other).
  {
    std::vector<float> busy = load;
    const double centres[5] = {45.0 * std::pow(2.0, 1.25), 180.0 * std::pow(2.0, 3.5 / 3.0),
                               180.0 * std::pow(2.0, 8.5 / 3.0), 180.0 * std::pow(2.0, 13.5 / 3.0),
                               180.0 * std::pow(2.0, 18.5 / 3.0)};
    for (size_t i = 0; i < busy.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      busy[i] = bed[i];
      for (double hz : centres) {
        busy[i] += static_cast<float>(ring_gain * std::sin(2.0 * kPi * hz * t));
      }
    }
    device.init(kRate);
    device.set_param(p::kLowCut, 40.0f);
    device.set_param(p::kLow, 3.0f);
    device.set_param(p::kBody, -3.0f);
    device.set_param(p::kPresence, 3.0f);
    device.set_param(p::kAir, 3.0f);
    device.set_param(p::kHighCut, 16000.0f);
    device.set_param(p::kClear, 1.0f);
    device.set_param(p::kClearTime, 0.5f);
    report_cost("ambient-eq, everything in", 10.0f, kRate, [&] { run(device, busy); });
    measured("everything in: meter(0) at the end", device.meter(0), "dB", "five bands cutting");
  }

  return finish("ambient-eq");
}
