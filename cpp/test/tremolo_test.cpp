// Native harness for Tremolo (cpp/devices/tremolo). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest measures the movement: its rate, its depth, which way each
// side or band goes, and that nothing clicks.

#include "../devices/tremolo/tremolo.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Tremolo;
namespace p = livemix::tremolo;

static Tremolo device;

static const float kRate = 48000.0f;
enum { kTremolo = 0, kPan, kHarmonic, kVibrato };
enum { kSine = 0, kTriangle, kSquare, kRandom };

static std::vector<float> dc(float seconds, float level) {
  return std::vector<float>(static_cast<size_t>(seconds * kRate), level);
}

// Peak of each millisecond: the envelope of a tone of 1 kHz or more, sampled
// at 1 kHz.
static std::vector<float> envelope(const std::vector<float>& x, size_t from = 0) {
  std::vector<float> out;
  for (size_t i = from; i + 48 <= x.size(); i += 48)
    out.push_back(static_cast<float>(peak(x, i, i + 48)));
  return out;
}

static double lowest(const std::vector<float>& x, size_t from = 0) {
  double v = 1.0e9;
  for (size_t i = from; i < x.size(); ++i) v = std::min(v, static_cast<double>(x[i]));
  return v;
}
static double highest(const std::vector<float>& x, size_t from = 0) {
  double v = -1.0e9;
  for (size_t i = from; i < x.size(); ++i) v = std::max(v, static_cast<double>(x[i]));
  return v;
}

static std::vector<float> centred(const std::vector<float>& x) {
  const double m = mean(x);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = static_cast<float>(x[i] - m);
  return out;
}

// Times (seconds) at which `x`, sampled at `rate`, rises through `level`.
static std::vector<double> rising_crossings(const std::vector<float>& x, double rate,
                                            double level = 0.0) {
  std::vector<double> out;
  for (size_t i = 1; i < x.size(); ++i) {
    if (x[i - 1] < level && x[i] >= level) {
      const double fraction = (level - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
      out.push_back((static_cast<double>(i - 1) + fraction) / rate);
    }
  }
  return out;
}

// Frequency of each cycle of a tone, from its rising zero crossings.
static std::vector<float> cycle_frequencies(const std::vector<float>& x, size_t from) {
  std::vector<float> tail(x.begin() + static_cast<long>(from), x.end());
  const std::vector<double> t = rising_crossings(tail, kRate);
  std::vector<float> out;
  for (size_t i = 1; i < t.size(); ++i) out.push_back(static_cast<float>(1.0 / (t[i] - t[i - 1])));
  return out;
}

// Steady, exact settings: no drift, the shortest slew.
static void exact(Tremolo& d, int mode, float rate, float depth, int shape = kSine) {
  d.init(kRate);
  d.set_param(p::kMode, static_cast<float>(mode));
  d.set_param(p::kRate, rate);
  d.set_param(p::kDepth, depth);
  d.set_param(p::kShape, static_cast<float>(shape));
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kSmooth, 0.0f);
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b,
                               size_t shift = 0) {
  double worst = 0.0;
  for (size_t i = shift; i < a.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i - shift]));
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "tremolo";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 0.5f;
  spec.max_peak = 1.5f;  // Pan puts +3 dB on one side at its extremes
  check_effect(device, spec, kRate);

  // Tremolo: the envelope of a steady tone moves at Rate, between unity and
  // unity less Depth.
  {
    const float settings[3][2] = {{0.5f, 0.3f}, {4.0f, 0.6f}, {12.0f, 1.0f}};
    for (const float* setting : settings) {
      const float rate = setting[0], depth = setting[1];
      exact(device, kTremolo, rate, depth);
      Stereo out = run(device, sine(1000.0f, std::max(4.0f, 8.0f / rate), kRate, 0.5f));
      const std::vector<float> env = envelope(out.left);
      char label[96];
      std::snprintf(label, sizeof label, "Tremolo %.1f Hz: the peaks stay at unity", rate);
      EXPECT_NEAR(highest(env) / 0.5, 1.0, 0.01, label);
      std::snprintf(label, sizeof label, "Tremolo %.1f Hz: the troughs are Depth %.1f down", rate,
                    depth);
      EXPECT_NEAR(lowest(env) / 0.5, 1.0 - depth, 0.03, label);
      std::snprintf(label, sizeof label, "Tremolo %.1f Hz: the envelope moves at Rate", rate);
      EXPECT_NEAR(dominant_frequency(centred(env), 1000.0, rate / 3.0, rate * 3.0), rate,
                  0.01 * rate, label);
      EXPECT(out.left == out.right, "Tremolo with no stereo phase moves both sides together");
    }
  }

  // Depth 0 and Mix 0 are the input in every mode.
  {
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = noise(0.5f, kRate, 0.5f);
    for (int mode = 0; mode < 4; ++mode) {
      device.init(kRate);
      device.set_param(p::kMode, static_cast<float>(mode));
      device.set_param(p::kDepth, 0.0f);
      Stereo out = run(device, in);
      // The vibrato's interpolator keeps one sample in hand.
      EXPECT(worst_difference(out.left, in, mode == kVibrato ? 1 : 0) < 1.0e-6,
             "Depth 0 is the input");
      device.init(kRate);
      device.set_param(p::kMode, static_cast<float>(mode));
      device.set_param(p::kMix, 0.0f);
      out = run(device, in);
      EXPECT(worst_difference(out.left, in) < 1.0e-6, "Mix 0 is the input");
    }
    exact(device, kTremolo, 4.0f, 1.0f);
    device.set_param(p::kMix, 0.5f);
    Stereo half = run(device, sine(1000.0f, 2.0f, kRate, 0.5f));
    EXPECT_NEAR(lowest(envelope(half.left)) / 0.5, 0.5, 0.02, "Mix 0.5 halves the depth");
  }

  // Pan: the sides trade places and the summed power stays put.
  {
    exact(device, kPan, 2.0f, 1.0f);
    Stereo out = run(device, sine(1000.0f, 4.0f, kRate, 0.5f));
    const std::vector<float> left = envelope(out.left), right = envelope(out.right);
    // Not -1: the equal-power law bends each side's envelope its own way.
    EXPECT(correlation(centred(left), centred(right)) < -0.9,
           "Pan: left and right move in opposite phase");
    EXPECT_NEAR(highest(left) / 0.5, 1.414, 0.02,
                "Pan: a side at its extreme carries the whole power");
    EXPECT(lowest(left) / 0.5 < 0.03 && lowest(right) / 0.5 < 0.03,
           "Pan: Depth 1 empties the other side");
    double low_power = 1.0e9, high_power = 0.0;
    for (size_t i = 0; i < left.size(); ++i) {
      const double power =
          static_cast<double>(left[i]) * left[i] + static_cast<double>(right[i]) * right[i];
      low_power = std::min(low_power, power);
      high_power = std::max(high_power, power);
    }
    EXPECT(high_power / low_power < 1.03, "Pan: the summed power is constant");
    EXPECT_NEAR(std::sqrt(high_power * 0.5) / 0.5, 1.0, 0.01, "Pan: that power is the input's");
    EXPECT_NEAR(dominant_frequency(centred(left), 1000.0, 0.7, 6.0), 2.0, 0.02, "Pan: at Rate");
  }

  // Harmonic: a low and a high tone are moved in opposite phase, so the
  // level hardly changes where a tremolo would empty it.
  {
    std::vector<float> in = sine(200.0f, 4.0f, kRate, 0.25f);
    const std::vector<float> high = sine(3000.0f, 4.0f, kRate, 0.25f);
    for (size_t i = 0; i < in.size(); ++i) in[i] += high[i];
    exact(device, kHarmonic, 2.0f, 1.0f);
    device.set_param(p::kCrossover, 800.0f);
    Stereo out = run(device, in);
    exact(device, kTremolo, 2.0f, 1.0f);
    Stereo pulsed = run(device, in);
    std::vector<float> low_level, high_level, whole, whole_pulsed;
    const size_t window = 1200;  // 25 ms: five cycles of the low tone
    for (size_t i = 0; i + window <= in.size(); i += window) {
      low_level.push_back(static_cast<float>(tone_level(out.left, 200.0, kRate, i, i + window)));
      high_level.push_back(static_cast<float>(tone_level(out.left, 3000.0, kRate, i, i + window)));
      whole.push_back(static_cast<float>(rms(out.left, i, i + window)));
      whole_pulsed.push_back(static_cast<float>(rms(pulsed.left, i, i + window)));
    }
    EXPECT(correlation(centred(low_level), centred(high_level)) < -0.9,
           "Harmonic: 200 Hz and 3 kHz are modulated in opposite phase");
    // A one-pole split leaves a quarter of each tone in the other band.
    EXPECT(lowest(low_level) < 0.3 * highest(low_level) &&
               lowest(high_level) < 0.3 * highest(high_level),
           "Harmonic: each band is modulated deeply");
    EXPECT_NEAR(dominant_frequency(centred(low_level), 40.0, 0.7, 6.0), 2.0, 0.03,
                "Harmonic: at Rate");
    EXPECT(lowest(whole) > 0.6 * highest(whole), "Harmonic: the overall level only shimmers");
    EXPECT(lowest(whole_pulsed) < 0.1 * highest(whole_pulsed),
           "where a tremolo at the same depth pulses");
  }

  // Crossover decides which band a tone belongs to: 1 kHz follows the low
  // band under a 4 kHz split and the high band over a 100 Hz one.
  {
    const std::vector<float> in = sine(1000.0f, 3.0f, kRate, 0.5f);
    exact(device, kTremolo, 2.0f, 1.0f);
    const std::vector<float> reference = centred(envelope(run(device, in).left));
    exact(device, kHarmonic, 2.0f, 1.0f);
    device.set_param(p::kCrossover, 4000.0f);
    const std::vector<float> as_low = centred(envelope(run(device, in).left));
    exact(device, kHarmonic, 2.0f, 1.0f);
    device.set_param(p::kCrossover, 100.0f);
    const std::vector<float> as_high = centred(envelope(run(device, in).left));
    EXPECT(correlation(reference, as_low) > 0.9,
           "Crossover above the tone: it moves with the low band");
    EXPECT(correlation(reference, as_high) < -0.9,
           "Crossover below the tone: it moves with the high band");
  }

  // Vibrato: the level holds still and the pitch moves, ±2 % at Depth 1.
  {
    const std::vector<float> in = sine(1000.0f, 3.0f, kRate, 0.5f);
    exact(device, kVibrato, 5.0f, 1.0f);
    Stereo out = run(device, in);
    const std::vector<float> env = envelope(out.left, 4800);
    EXPECT(lowest(env) > 0.98 * highest(env), "Vibrato: the level is steady");
    const std::vector<float> hz = cycle_frequencies(out.left, 4800);
    EXPECT_NEAR(highest(hz) - 1000.0, 20.0, 2.0, "Vibrato: Depth 1 bends 2 % sharp");
    EXPECT_NEAR(1000.0 - lowest(hz), 20.0, 2.0, "Vibrato: and 2 % flat");
    EXPECT_NEAR(dominant_frequency(centred(hz), 1000.0, 1.5, 15.0), 5.0, 0.1, "Vibrato: at Rate");

    exact(device, kVibrato, 5.0f, 0.5f);
    const std::vector<float> half = cycle_frequencies(run(device, in).left, 4800);
    EXPECT_NEAR(highest(half) - lowest(half), 20.0, 2.0, "Vibrato: Depth scales the bend");

    exact(device, kTremolo, 5.0f, 0.5f);
    const std::vector<float> still = cycle_frequencies(run(device, in).left, 4800);
    EXPECT(highest(still) - lowest(still) < 1.0, "a tremolo leaves the pitch alone");
  }

  // Square never clicks: on a constant input the output is the gain itself,
  // and its fastest move is the 1 ms two-pole slew.
  {
    exact(device, kTremolo, 8.0f, 1.0f, kSquare);
    Stereo out = run(device, dc(2.0f, 0.5f));
    size_t at_ends = 0;
    for (float v : out.left) at_ends += (v > 0.49f || v < 0.01f) ? 1 : 0;
    EXPECT(at_ends > out.size() * 8 / 10, "Square spends its time fully on or fully off");
    EXPECT(lowest(out.left) < 0.001 && highest(out.left) > 0.499, "Square reaches both ends");
    EXPECT(max_step(out.left) < 0.006, "Square is slewed: no step in the gain");

    // Changing shape or mode while sounding does not step either.
    exact(device, kTremolo, 3.0f, 1.0f, kSine);
    Stereo moved = run(device, dc(0.4f, 0.5f));
    device.set_param(p::kShape, static_cast<float>(kSquare));
    moved = concat(moved, run(device, dc(0.2f, 0.5f)));
    device.set_param(p::kMode, static_cast<float>(kPan));
    moved = concat(moved, run(device, dc(0.2f, 0.5f)));
    device.set_param(p::kMode, static_cast<float>(kHarmonic));
    device.set_param(p::kDepth, 0.2f);
    device.set_param(p::kPhase, 180.0f);
    moved = concat(moved, run(device, dc(0.2f, 0.5f)));
    device.set_param(p::kMode, static_cast<float>(kVibrato));
    device.set_param(p::kMix, 0.4f);
    moved = concat(moved, run(device, dc(0.2f, 0.5f)));
    EXPECT(max_step(moved.left) < 0.01 && max_step(moved.right) < 0.01,
           "Shape, Mode, Depth, Stereo Phase and Mix changes glide");
  }

  // Smooth rounds the square in proportion to the period.
  {
    double fall[2];
    for (int which = 0; which < 2; ++which) {
      exact(device, kTremolo, 2.0f, 1.0f, kSquare);
      device.set_param(p::kSmooth, static_cast<float>(which));
      Stereo out = run(device, dc(2.0f, 1.0f));
      // The second fall, from 90 % to 10 %.
      size_t i = 48000;
      while (i < out.size() && out.left[i] < 0.95f) ++i;
      size_t t90 = i;
      while (t90 < out.size() && out.left[t90] > 0.9f) ++t90;
      size_t t10 = t90;
      while (t10 < out.size() && out.left[t10] > 0.1f) ++t10;
      fall[which] = static_cast<double>(t10 - t90) / kRate;
    }
    EXPECT_NEAR(fall[0], 0.0034, 0.0006, "Smooth 0: the square turns in about 3 ms");
    EXPECT(fall[1] > 0.1 && fall[1] < 0.2,
           "Smooth 1: the square is rounded over a quarter of its period");
  }

  // Random wanders: unlike the sine, its movement never repeats.
  {
    auto repeats = [&](int shape) {
      exact(device, kTremolo, 4.0f, 1.0f, shape);
      Stereo out = run(device, dc(40.0f, 1.0f));
      std::vector<float> gain;
      for (size_t i = 0; i < out.size(); i += 480) gain.push_back(out.left[i]);  // 100 per second
      const std::vector<float> g = centred(gain);
      double best = -1.0;
      for (size_t lag = 38; lag <= 500; ++lag) {  // one and a half periods to 20
        double sab = 0.0, saa = 0.0, sbb = 0.0;
        for (size_t i = 0; i + lag < g.size(); ++i) {
          sab += static_cast<double>(g[i]) * g[i + lag];
          saa += static_cast<double>(g[i]) * g[i];
          sbb += static_cast<double>(g[i + lag]) * g[i + lag];
        }
        best = std::max(best, sab / std::sqrt(saa * sbb));
      }
      return best;
    };
    EXPECT(repeats(kSine) > 0.99, "a sine repeats itself exactly");
    EXPECT(repeats(kRandom) < 0.3, "Random does not repeat at any lag up to 20 periods");
    exact(device, kTremolo, 4.0f, 1.0f, kRandom);
    Stereo out = run(device, dc(40.0f, 1.0f));
    EXPECT(highest(out.left) - lowest(out.left) > 0.8, "Random uses the whole depth");
    EXPECT(max_step(out.left) < 0.001, "Random is smooth");
  }

  // Drift leans on the rate: cycles differ in length, around the same mean.
  {
    double spread[2], average[2];
    for (int which = 0; which < 2; ++which) {
      exact(device, kTremolo, 4.0f, 1.0f);
      device.set_param(p::kDrift, static_cast<float>(which));
      Stereo out = run(device, dc(60.0f, 1.0f));
      const std::vector<double> t = rising_crossings(out.left, kRate, 0.5);
      double shortest = 1.0e9, longest = 0.0;
      for (size_t i = 1; i < t.size(); ++i) {
        shortest = std::min(shortest, t[i] - t[i - 1]);
        longest = std::max(longest, t[i] - t[i - 1]);
      }
      spread[which] = longest / shortest;
      average[which] = static_cast<double>(t.size() - 1) / (t.back() - t.front());
    }
    EXPECT(spread[0] < 1.001, "Drift 0: every cycle is the same length");
    EXPECT_NEAR(average[0], 4.0, 0.004, "Drift 0: and Rate is exact");
    EXPECT(spread[1] > 1.2 && spread[1] < 1.7,
           "Drift 1: cycles vary by up to a quarter either way");
    EXPECT_NEAR(average[1], 4.0, 0.3, "Drift 1: around the set rate");
  }

  // Stereo Phase offsets the right side: 180 is opposite, 90 a quarter cycle late.
  {
    exact(device, kTremolo, 2.0f, 1.0f);
    device.set_param(p::kPhase, 180.0f);
    Stereo out = run(device, dc(4.0f, 1.0f));
    EXPECT(correlation(centred(out.left), centred(out.right)) < -0.99,
           "Stereo Phase 180: opposite");
    exact(device, kTremolo, 2.0f, 1.0f);
    device.set_param(p::kPhase, 90.0f);
    out = run(device, dc(4.0f, 1.0f));
    const std::vector<double> left = rising_crossings(out.left, kRate, 0.5);
    const std::vector<double> right = rising_crossings(out.right, kRate, 0.5);
    EXPECT(left.size() > 3 && right.size() > 3, "both sides cycle");
    // The right side is ahead in phase, so it crosses a quarter period earlier.
    EXPECT_NEAR(left[2] - right[2], 0.125, 0.003, "Stereo Phase 90: a quarter period apart");
  }

  // The device sleeps and wakes.
  {
    device.init(kRate);
    run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    render(device, 0.5f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the input stops");
    Stereo woken = run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    EXPECT(peak(woken.left) > 0.4, "wakes on new input");
  }

  for (int mode : {kTremolo, kHarmonic, kVibrato}) {
    device.init(kRate);
    device.set_param(p::kMode, static_cast<float>(mode));
    rng_state() = 0xBEEFu;
    const std::vector<float> input = noise(10.0f, kRate, 0.25f);
    static const char* names[4] = {"tremolo (Tremolo)", "tremolo (Pan)", "tremolo (Harmonic)",
                                   "tremolo (Vibrato)"};
    report_cost(names[mode], 10.0f, kRate, [&] { run(device, input); });
  }

  return finish("tremolo");
}
