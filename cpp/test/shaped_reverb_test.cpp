// Native harness for Shaped Reverb (cpp/devices/shaped-reverb). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest asserts what makes it a shaped
// reverb: the impulse response's level over time follows each Shape and
// scales with Time, the wet energy does not depend on the shape, the wash is
// dense, uncoloured and decorrelated between the sides, and it stops.

#include <complex>

#include "../devices/shaped-reverb/shaped_reverb.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::ShapedReverb;
namespace p = livemix::shaped_reverb;

static ShapedReverb device;

static const float kRate = 48000.0f;
static const double kWindow = 0.02;  // the envelope's window, seconds

enum Shape { kGate = 0, kReverse, kBloom, kFall, kPulse };

// Wet only, nothing but the shape: no tail, no repeats, no colour, the cut
// filters out of the way, the diffuser at rest.
static void bare(ShapedReverb& d, int shape, float seconds) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kShape, static_cast<float>(shape));
  d.set_param(p::kTime, seconds);
  d.set_param(p::kTail, 0.0f);
  d.set_param(p::kRepeat, 0.0f);
  d.set_param(p::kColour, 0.0f);
  d.set_param(p::kModulation, 0.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kHighCut, 18000.0f);
}

// RMS in dB of consecutive 20 ms windows.
static std::vector<double> envelope(const std::vector<float>& x) {
  const size_t window = static_cast<size_t>(kWindow * kRate);
  std::vector<double> out;
  for (size_t i = 0; i + window <= x.size(); i += window) out.push_back(db(rms(x, i, i + window)));
  return out;
}

// Mean power in dB of the envelope windows that lie in [from, to) seconds.
static double level(const std::vector<double>& env, double from, double to) {
  double sum = 0.0;
  int count = 0;
  for (size_t w = static_cast<size_t>(from / kWindow + 0.5); w < env.size() && (w + 1) * kWindow <= to + 1.0e-6; ++w) {
    sum += std::pow(10.0, env[w] / 10.0);
    ++count;
  }
  return count > 0 ? 10.0 * std::log10(sum / count + 1.0e-30) : -300.0;
}

// The impulse response of a bare shape, `extra` seconds past Time.
static Stereo response(int shape, float seconds, float density = 0.8f, float extra = 1.0f) {
  bare(device, shape, seconds);
  device.set_param(p::kDensity, density);
  return run(device, impulse(seconds + extra, kRate, 1.0f));
}

static void fft(std::vector<std::complex<double>>& a) {
  const size_t n = a.size();
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const double angle = -2.0 * kPi / static_cast<double>(len);
    const std::complex<double> step(std::cos(angle), std::sin(angle));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w(1.0);
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= step;
      }
    }
  }
}

// Power spectrum of x[from, to), zero padded to a power of two; `size` is
// the transform length.
static std::vector<double> spectrum(const std::vector<float>& x, size_t from, size_t to, size_t* size) {
  to = std::min(to, x.size());
  size_t n = 1;
  while (n < to - from) n <<= 1;
  std::vector<std::complex<double>> a(n);
  for (size_t i = from; i < to; ++i) a[i - from] = x[i];
  fft(a);
  std::vector<double> power(n / 2 + 1);
  for (size_t i = 0; i <= n / 2; ++i) power[i] = std::norm(a[i]);
  *size = n;
  return power;
}

static double centroid_hz(const std::vector<float>& x, size_t from, size_t to) {
  size_t n;
  const std::vector<double> power = spectrum(x, from, to, &n);
  double weighted = 0.0, total = 0.0;
  for (size_t b = 1; b < power.size(); ++b) {
    weighted += power[b] * static_cast<double>(b) * kRate / static_cast<double>(n);
    total += power[b];
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// Echo density after Abel and Huang: the share of samples in [from, to)
// further from zero than one standard deviation, over what Gaussian noise
// gives (0.3173). Near 0 for a few separate echoes, 1 for a dense wash.
static double echo_density(const std::vector<float>& x, size_t from, size_t to) {
  const double sigma = rms(x, from, to);
  if (sigma <= 0.0) return 0.0;
  size_t count = 0;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > sigma) ++count;
  }
  return static_cast<double>(count) / (0.3173 * static_cast<double>(to - from));
}

// Pink noise (Kellett's filter on the harness's white noise), about `gain` RMS.
static std::vector<float> pink(float seconds, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate));
  double b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (float& v : out) {
    const double w = white();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    v = static_cast<float>(gain * 0.36 * (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362));
    b6 = w * 0.115926;
  }
  return out;
}

static size_t last_sound(const Stereo& x) {
  size_t last = 0;
  for (size_t i = 0; i < x.size(); ++i) {
    if (x.left[i] != 0.0f || x.right[i] != 0.0f) last = i;
  }
  return last;
}

int main() {
  Conformance spec;
  spec.name = "shaped-reverb";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Mix 0 is the dry signal, to the bit.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xD1CEu;
    std::vector<float> in = noise(0.5f, kRate, 0.5f);
    Stereo out = run(device, in);
    EXPECT(out.left == in && out.right == in, "Mix 0 passes the input through bit for bit");
  }

  // Gate: level within ±3 dB from 10 % to 90 % of Time, then more than
  // 40 dB down 60 ms after Time.
  {
    const float seconds = 0.9f;
    Stereo out = response(kGate, seconds);
    const std::vector<double> env = envelope(out.left);
    const double plateau = level(env, 0.1 * seconds, 0.9 * seconds);
    double lowest = 1.0e9, highest = -1.0e9;
    for (size_t w = static_cast<size_t>(0.1 * seconds / kWindow + 0.5); (w + 1) * kWindow <= 0.9 * seconds + 1.0e-6; ++w) {
      lowest = std::min(lowest, env[w] - plateau);
      highest = std::max(highest, env[w] - plateau);
    }
    const double after = level(env, seconds + 0.06, seconds + 0.08) - plateau;
    std::printf("gate 0.9 s: plateau ripple %+.1f / %+.1f dB, %.1f dB 60 ms after Time\n", lowest, highest, after);
    EXPECT(lowest > -3.0 && highest < 3.0, "Gate holds its level within ±3 dB from 10 % to 90 % of Time");
    EXPECT(after < -40.0, "Gate is more than 40 dB down 60 ms after Time");
  }

  // Reverse: each quarter louder than the one before, the last at least
  // 9 dB above the first, then the same cut.
  {
    const float seconds = 1.2f;
    Stereo out = response(kReverse, seconds);
    const std::vector<double> env = envelope(out.left);
    double quarter[4];
    for (int q = 0; q < 4; ++q) quarter[q] = level(env, 0.25 * q * seconds, 0.25 * (q + 1) * seconds);
    const double after = level(env, seconds + 0.06, seconds + 0.08) - level(env, seconds - 0.1, seconds - 0.02);
    std::printf("reverse 1.2 s: quarters %.1f %.1f %.1f %.1f dB, %.1f dB 60 ms after Time\n", quarter[0],
                quarter[1], quarter[2], quarter[3], after);
    EXPECT(quarter[1] > quarter[0] + 3.0 && quarter[2] > quarter[1] + 3.0 && quarter[3] > quarter[2] + 3.0,
           "Reverse rises steadily, quarter by quarter");
    EXPECT(quarter[3] > quarter[0] + 9.0, "Reverse ends at least 9 dB above where it starts");
    EXPECT(after < -40.0, "Reverse is cut off: more than 40 dB down 60 ms after Time");
  }

  // Bloom: the loudest tenth of a second is near the middle, and both ends
  // are far below it.
  {
    const float seconds = 2.0f;
    Stereo out = response(kBloom, seconds);
    const std::vector<double> env = envelope(out.left);
    double best = -1.0e9, best_at = 0.0;
    for (double t = 0.0; t + 0.1 <= seconds; t += 0.02) {
      const double here = level(env, t, t + 0.1);
      if (here > best) {
        best = here;
        best_at = t + 0.05;
      }
    }
    const double start = level(env, 0.0, 0.1) - best, end = level(env, seconds - 0.1, seconds) - best;
    std::printf("bloom 2 s: top at %.2f of Time, ends %.1f and %.1f dB below it\n", best_at / seconds, start, end);
    EXPECT(best_at > 0.3 * seconds && best_at < 0.6 * seconds, "Bloom peaks near the middle");
    EXPECT(start < -10.0 && end < -10.0, "Bloom swells in and fades out");
  }

  // Fall: a straight line in amplitude from the start to nothing at Time.
  {
    const float seconds = 2.0f;
    Stereo out = response(kFall, seconds);
    const std::vector<double> env = envelope(out.left);
    // Least-squares line through the amplitude of 100 ms steps.
    double n = 0, st = 0, sa = 0, stt = 0, sta = 0, saa = 0;
    for (double t = 0.1; t + 0.1 <= 0.95 * seconds; t += 0.1) {
      const double a = std::pow(10.0, level(env, t, t + 0.1) / 20.0);
      n += 1, st += t + 0.05, sa += a, stt += (t + 0.05) * (t + 0.05), sta += (t + 0.05) * a, saa += a * a;
    }
    const double slope = (n * sta - st * sa) / (n * stt - st * st);
    const double offset = (sa - slope * st) / n;
    const double r = (n * sta - st * sa) / std::sqrt((n * stt - st * st) * (n * saa - sa * sa));
    const double zero = -offset / slope;
    std::printf("fall 2 s: amplitude against time r = %.4f, the line reaches zero at %.2f of Time\n", r, zero / seconds);
    EXPECT(r < -0.985, "Fall is a straight line in amplitude");
    EXPECT_NEAR(zero, seconds, 0.08 * seconds, "Fall reaches zero at Time");
  }

  // Pulse: three bumps, with a dip of more than 8 dB between neighbours.
  {
    const float seconds = 1.8f;
    Stereo out = response(kPulse, seconds);
    const std::vector<double> env = envelope(out.left);
    std::vector<double> smooth;
    for (double t = 0.0; t + 0.06 <= seconds + 0.06; t += 0.02) smooth.push_back(level(env, t, t + 0.06));
    // Count rises through 6 dB under the top; the dips go well below that.
    double top = -1.0e9;
    for (double v : smooth) top = std::max(top, v);
    int bumps = 0;
    bool inside = false;
    double dip = 0.0, deepest_between = 1.0e9;
    for (double v : smooth) {
      if (!inside && v > top - 6.0) {
        if (bumps > 0) deepest_between = std::min(deepest_between, top - dip);
        inside = true;
        ++bumps;
      } else if (inside && v < top - 8.0) {
        inside = false;
        dip = v;
      }
      if (!inside) dip = std::min(dip, v);
    }
    std::printf("pulse 1.8 s: %d bumps, the shallowest dip between them is %.1f dB under the top\n", bumps, deepest_between);
    EXPECT(bumps == 3, "Pulse has three bumps");
    EXPECT(deepest_between > 8.0, "Pulse dips more than 8 dB between its bumps");
  }

  // Time scales the whole shape: a Gate's energy sits around the middle of
  // Time and all of it has arrived by Time, at 0.2, 1 and 4 s.
  for (float seconds : {0.2f, 1.0f, 4.0f}) {
    Stereo out = response(kGate, seconds);
    double total = 0.0, weighted = 0.0, before = 0.0;
    const size_t end = static_cast<size_t>((seconds + 0.02f) * kRate);
    for (size_t i = 0; i < out.left.size(); ++i) {
      const double e = static_cast<double>(out.left[i]) * out.left[i];
      total += e;
      weighted += e * static_cast<double>(i) / kRate;
      if (i < end) before += e;
    }
    const double middle = weighted / total;
    std::printf("gate %.1f s: energy centred at %.3f of Time, %.2f %% of it after Time + 20 ms\n", seconds,
                middle / seconds, 100.0 * (1.0 - before / total));
    EXPECT_NEAR(middle, 0.5 * seconds, 0.06 * seconds, "the middle of a Gate's energy is at half of Time");
    EXPECT(before > 0.98 * total, "a Gate's energy has arrived by Time");
  }

  // The wet energy for steady pink noise does not depend on Time, Shape or
  // Density.
  {
    double lowest = 1.0e9, highest = -1.0e9;
    const auto measure = [&](int shape, float seconds, float density) {
      bare(device, shape, seconds);
      device.set_param(p::kDensity, density);
      rng_state() = 0x9E3779B9u;
      std::vector<float> in = pink(seconds + 6.0f, 0.2f);
      Stereo out = run(device, in);
      const size_t from = static_cast<size_t>((seconds + 0.5f) * kRate);
      const double gain = db(std::sqrt(0.5 * (std::pow(rms(out.left, from), 2.0) + std::pow(rms(out.right, from), 2.0)))) -
                          db(rms(in, from));
      lowest = std::min(lowest, gain);
      highest = std::max(highest, gain);
    };
    for (int shape = kGate; shape <= kPulse; ++shape) {
      for (float seconds : {0.2f, 0.9f, 4.0f}) measure(shape, seconds, 0.8f);
    }
    for (float density : {0.0f, 0.4f, 1.0f}) {
      measure(kGate, 0.9f, density);
      measure(kReverse, 0.9f, density);
    }
    std::printf("wet level against a pink input over 21 settings: %+.2f to %+.2f dB\n", lowest, highest);
    EXPECT(highest - lowest < 1.5, "the wet energy is the same within 1.5 dB across Time, Shape and Density");
    // The cut filters at their ends still take the bottom octave and the
    // top quarter octave of the noise.
    EXPECT(lowest > -2.5 && highest < 0.5, "the wet energy is the input's, less what the cut filters remove");
  }

  // The two sides are unrelated at Width 1 and the same at Width 0.
  {
    bare(device, kGate, 0.9f);
    rng_state() = 0xFACEu;
    std::vector<float> in = noise(4.0f, kRate, 0.3f);
    Stereo wide = run(device, in);
    const double apart = correlation(wide.left, wide.right, 48000);
    bare(device, kGate, 0.9f);
    device.set_param(p::kWidth, 0.0f);
    Stereo narrow = run(device, in);
    double worst = 0.0;
    for (size_t i = 0; i < narrow.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(narrow.left[i]) - narrow.right[i]));
    std::printf("mono input: left/right correlation %.3f at Width 1; largest difference %.2g at Width 0\n", apart, worst);
    EXPECT(std::fabs(apart) < 0.3, "left and right are decorrelated at Width 1");
    EXPECT(worst < 1.0e-6 && rms(narrow.left, 48000) > 0.01, "left and right are the same at Width 0");
  }

  // No strong coloration: the third-octave spectrum of a dense response is
  // flat within ±4 dB from 200 Hz to 6.3 kHz, on both sides.
  {
    Stereo out = response(kGate, 0.9f, 1.0f);
    double lowest = 1.0e9, highest = -1.0e9;
    for (const std::vector<float>* side : {&out.left, &out.right}) {
      size_t n;
      const std::vector<double> power = spectrum(*side, 0, side->size(), &n);
      std::vector<double> bands;
      double mean_db = 0.0;
      for (double centre = 200.0; centre < 6400.0; centre *= std::pow(2.0, 1.0 / 3.0)) {
        const size_t lo = static_cast<size_t>(centre / std::pow(2.0, 1.0 / 6.0) * n / kRate);
        const size_t hi = static_cast<size_t>(centre * std::pow(2.0, 1.0 / 6.0) * n / kRate);
        double sum = 0.0;
        for (size_t b = lo; b < hi; ++b) sum += power[b];
        bands.push_back(10.0 * std::log10(sum / static_cast<double>(hi - lo)));
        mean_db += bands.back();
      }
      mean_db /= static_cast<double>(bands.size());
      for (double band : bands) {
        lowest = std::min(lowest, band - mean_db);
        highest = std::max(highest, band - mean_db);
      }
    }
    std::printf("third-octave bands of a dense response, 200 Hz to 6.3 kHz: %+.1f to %+.1f dB\n", lowest, highest);
    EXPECT(lowest > -4.0 && highest < 4.0, "the response is flat within ±4 dB in third octaves");
  }

  // Density: a wash at the top, separate echoes at the bottom.
  {
    double density[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      Stereo out = response(kGate, 0.9f, settings[k]);
      // One window over the level part of the gate, 0.2 to 0.7 s.
      density[k] = echo_density(out.left, 9600, 33600);
    }
    std::printf("echo density at Density 0, 0.5, 1: %.2f, %.2f, %.2f\n", density[0], density[1], density[2]);
    EXPECT(density[2] > 0.9, "Density 1 is as dense as noise");
    EXPECT(density[0] < 0.1, "Density 0 is separate echoes");
    EXPECT(density[1] > density[0] + 0.2 && density[2] > density[1] + 0.1, "echo density rises with Density");
  }

  // Colour: below the centre the end of the shape is darker than its start,
  // above the centre the start is darker than the end, and at the centre
  // they are alike.
  {
    double early[3], late[3];
    const float settings[3] = {-0.7f, 0.0f, 0.7f};
    for (int k = 0; k < 3; ++k) {
      bare(device, kGate, 1.2f);
      device.set_param(p::kColour, settings[k]);
      Stereo out = run(device, impulse(2.0f, kRate, 1.0f));
      early[k] = centroid_hz(out.left, 2400, 19200);    // 0.05 to 0.4 s
      late[k] = centroid_hz(out.left, 38400, 55200);    // 0.8 to 1.15 s
    }
    std::printf("spectral centroid, start / end of a gate: Colour -0.7 %.0f / %.0f Hz, 0 %.0f / %.0f Hz, +0.7 %.0f / %.0f Hz\n",
                early[0], late[0], early[1], late[1], early[2], late[2]);
    EXPECT(late[0] < 0.6 * early[0], "negative Colour makes the end darker than the start");
    EXPECT(early[2] < 0.7 * late[2], "positive Colour makes the start darker than the end");
    EXPECT(std::fabs(late[1] - early[1]) < 0.05 * early[1], "Colour 0 leaves start and end alike");
  }

  // Moving Time while a chord sounds fades between tap sets: no click, at a
  // jump or through a sweep.
  {
    const auto chord = [](float seconds) {
      std::vector<float> x(static_cast<size_t>(seconds * kRate));
      for (size_t i = 0; i < x.size(); ++i) {
        const double t = static_cast<double>(i) / kRate;
        x[i] = 0.25f * static_cast<float>(std::sin(2.0 * kPi * 220.0 * t) + 0.5 * std::sin(2.0 * kPi * 330.0 * t) +
                                           0.3 * std::sin(2.0 * kPi * 554.37 * t));
      }
      return x;
    };
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo steady = run(device, chord(4.0f));
    const double still = max_step(steady.left, 96000);

    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, chord(2.0f));
    device.set_param(p::kTime, 0.3f);
    Stereo jumped = run(device, chord(1.0f));
    Stereo swept;
    const std::vector<float> block = chord(128.0f / kRate);
    for (int k = 0; k < 375; ++k) {
      device.set_param(p::kTime, 0.3f * std::pow(10.0f, static_cast<float>(k) / 374.0f));
      swept = concat(swept, run(device, block));
    }
    std::printf("largest sample step in the wet signal on a chord: steady %.4f, Time jump %.4f, Time sweep %.4f\n",
                still, max_step(jumped.left), max_step(swept.left));
    // The chord itself steps by 0.016 a sample at its steepest.
    EXPECT(max_step(jumped.left) < 0.06 && max_step(jumped.right) < 0.06, "a Time jump does not click");
    EXPECT(max_step(swept.left) < 0.06 && max_step(swept.right) < 0.06, "a Time sweep does not click");
  }

  // The shape ends: with no Tail and no Repeat the output is exact zeros
  // well before the device goes to sleep, and stays there.
  {
    bare(device, kGate, 0.5f);
    device.set_param(p::kPreDelay, 100.0f);
    device.set_param(p::kModulation, 0.3f);
    rng_state() = 0xA11CEu;
    std::vector<float> burst = noise(0.1f, kRate, 0.5f);
    burst.resize(static_cast<size_t>(3.0f * kRate), 0.0f);
    Stereo out = run(device, burst);
    // Input 0.1 s + pre-delay 0.1 s + Time 0.5 s = 0.7 s.
    const double last = static_cast<double>(last_sound(out)) / kRate;
    std::printf("gate 0.5 s after a 0.1 s burst and 0.1 s of pre-delay: the last non-zero sample is at %.3f s\n", last);
    EXPECT(last > 0.6 && last < 1.3, "the output is exact zeros within 0.6 s of the end of the shape");
  }

  // Pre-delay moves the whole shape later and leaves a gap before it.
  {
    bare(device, kGate, 0.3f);
    device.set_param(p::kPreDelay, 150.0f);
    Stereo out = run(device, impulse(1.0f, kRate, 1.0f));
    size_t first = 0;
    while (first < out.size() && out.left[first] == 0.0f && out.right[first] == 0.0f) ++first;
    const std::vector<double> env = envelope(out.left);
    const double plateau = level(env, 0.2, 0.4);
    std::printf("pre-delay 150 ms: first sound at %.1f ms, 20 dB under its level again by %.0f ms\n", 1000.0 * first / kRate,
                [&] { size_t w = env.size(); while (w > 0 && env[w - 1] < plateau - 20.0) --w; return w * kWindow * 1000.0; }());
    EXPECT_NEAR(static_cast<double>(first) / kRate, 0.151, 0.002, "the shape starts after the Pre-delay");
    EXPECT(level(env, 0.46, 0.5) < plateau - 20.0 && level(env, 0.38, 0.42) > plateau - 6.0, "the shape ends at Pre-delay + Time");
  }

  // CHECKS

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("shaped-reverb", 10.0f, kRate, [&] { run(device, input); });

  return finish("shaped-reverb");
}
