// Native harness for Fog (cpp/devices/fog). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it fog: a click becomes a cloud as long as Size
// says, shaped as the stages' own arithmetic says, and then it stops; a held
// note comes out at the level it went in at every frequency; Layers lengthens
// the cloud, Width takes the two sides apart, Drift moves it without bending
// pitch, Soften takes the hit off.

#include <limits>

#include "../devices/fog/fog.h"
#include "support/test_kit.h"

// With -DFOG_VERBOSE every check prints, passed or not, with what it measured.
#ifdef FOG_VERBOSE
#undef EXPECT
#define EXPECT(condition, message)                                                        \
  do {                                                                                    \
    const bool ok_ = (condition);                                                         \
    std::printf("%s: %s (%s:%d)\n", ok_ ? "ok  " : "FAIL", message, __FILE__, __LINE__); \
    if (!ok_) ++testkit::failures();                                                      \
  } while (0)
#undef EXPECT_NEAR
#define EXPECT_NEAR(actual, expected, tolerance, message)                                 \
  do {                                                                                    \
    const double a_ = static_cast<double>(actual);                                        \
    const double e_ = static_cast<double>(expected);                                      \
    const bool ok_ = std::fabs(a_ - e_) <= static_cast<double>(tolerance);                \
    std::printf("%s: %s: got %g, expected %g ± %g (%s:%d)\n", ok_ ? "ok  " : "FAIL", message, \
                a_, e_, static_cast<double>(tolerance), __FILE__, __LINE__);              \
    if (!ok_) ++testkit::failures();                                                      \
  } while (0)
#endif

using namespace testkit;
using livemix::Fog;
namespace p = livemix::fog;
namespace layout = livemix::fog_layout;

static Fog device;

static const float kRate = 48000.0f;

static size_t at(double seconds) { return static_cast<size_t>(seconds * kRate); }

// The cloud alone, nothing moving, nothing cut: every stage at rest on a
// whole sample.
static void plain(Fog& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kSoften, 0.0f);
  d.set_param(p::kDamp, 0.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

static double energy(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) sum += static_cast<double>(x[i]) * x[i];
  return sum;
}

// Seconds until `share` of the energy of `x` has gone by.
static double time_to(const std::vector<float>& x, double share) {
  const double total = energy(x);
  double sum = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    sum += static_cast<double>(x[i]) * x[i];
    if (sum >= share * total) return static_cast<double>(i) / kRate;
  }
  return static_cast<double>(x.size()) / kRate;
}

// What the stages' arithmetic says a click becomes, as energy in bins of
// `dt` seconds. One allpass of length D and coefficient g answers a click
// with g at once and (1 - g^2) g^(k-1) after k lengths; the energies of a
// chain of them are those of each, folded together, as long as the echoes
// of different stages do not land on each other. The display draws this;
// here it is held to the device.
static std::vector<double> model(double size_seconds, double density, int layers, double dt,
                                 int bins) {
  std::vector<double> cloud(bins, 0.0);
  cloud[0] = 1.0;
  const int stages = layout::kShortStages + layers * layout::kLongStages;
  for (int s = 0; s < stages; ++s) {
    const double gain =
        s < layout::kShortStages
            ? Fog::kShortGain * std::min(1.0, std::max(0.0, density * 5.0 - s))
            : Fog::kLongGainLow + (Fog::kLongGainHigh - Fog::kLongGainLow) * density;
    const double g2 = gain * gain;
    const double length = layout::kRatio[s] * size_seconds / dt;
    std::vector<double> next(bins, 0.0);
    for (int k = 0; k < 200; ++k) {
      const double share = k == 0 ? g2 : (1.0 - g2) * (1.0 - g2) * std::pow(g2, k - 1);
      if (k > 0 && share < 1.0e-11) break;
      const double shift = k * length;
      const int whole = static_cast<int>(shift);
      const double part = shift - whole;
      for (int i = 0; i + whole < bins; ++i) {
        if (cloud[i] == 0.0) continue;
        next[i + whole] += cloud[i] * share * (1.0 - part);
        if (i + whole + 1 < bins) next[i + whole + 1] += cloud[i] * share * part;
      }
    }
    cloud = next;
  }
  return cloud;
}

static double model_time_to(const std::vector<double>& cloud, double dt, double share) {
  double sum = 0.0;
  for (size_t i = 0; i < cloud.size(); ++i) {
    sum += cloud[i];
    if (sum >= share) return i * dt;
  }
  return cloud.size() * dt;
}

// The frequency of a tone near `hz` in windows of `window` samples, as the
// furthest it strays from `hz`, in cents.
static double worst_cents(const std::vector<float>& x, double hz, size_t from, size_t window) {
  double worst = 0.0;
  double last = 0.0;
  bool have = false;
  for (size_t start = from; start + window <= x.size(); start += window) {
    const double phase = tone_phase(x, hz, kRate, start, start + window);
    if (have) {
      double turned = phase - last;
      while (turned > kPi) turned -= 2.0 * kPi;
      while (turned < -kPi) turned += 2.0 * kPi;
      const double offset_hz = turned / (2.0 * kPi) * kRate / static_cast<double>(window);
      worst = std::max(worst, std::fabs(1200.0 * std::log2((hz + offset_hz) / hz)));
    }
    last = phase;
    have = true;
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "fog";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // A click becomes a cloud as long as Size: nine tenths of its energy is
  // out after Size (one layer, the default Density), from 20 ms to 600.
  for (float size : {20.0f, 60.0f, 150.0f, 400.0f, 600.0f}) {
    plain(device);
    device.set_param(p::kSize, size);
    Stereo out = run(device, impulse(size * 0.004f + 0.1f, kRate));
    char label[120];
    std::snprintf(label, sizeof label, "Size %.0f ms: nine tenths of a click's energy is out after Size",
                  size);
    EXPECT_NEAR(time_to(out.left, 0.9) / (size * 0.001), 1.0, 0.06, label);
    EXPECT_NEAR(energy(out.left), 1.0, 0.003, "the cloud has the energy of the click");
    EXPECT(peak(out.left, 0, 4) < 0.02, "nothing of the click itself is left at Mix 1");
  }

  // The same at the other rates a session runs at.
  for (float rate : {44100.0f, 96000.0f}) {
    plain(device, rate);
    device.set_param(p::kSize, 300.0f);
    std::vector<float> click(static_cast<size_t>(rate * 1.5f), 0.0f);
    click[0] = 1.0f;
    Stereo out = run(device, click);
    const double total = energy(out.left);
    double sum = 0.0;
    size_t i = 0;
    for (; i < out.left.size() && sum < 0.9 * total; ++i) sum += static_cast<double>(out.left[i]) * out.left[i];
    EXPECT_NEAR(static_cast<double>(i) / rate, 0.3, 0.018, "Size is the same time at 44.1 and 96 kHz");
  }

  // The cloud is the one the stages' arithmetic gives (the display draws
  // that): the same energy in each of 24 stretches of time, and the same
  // moments for a tenth, a half and nine tenths of it.
  {
    struct Case {
      float size, density;
      int layers;
    };
    for (const Case& c : {Case{150.0f, 0.8f, 1}, Case{80.0f, 1.0f, 3}, Case{300.0f, 0.3f, 2},
                          Case{600.0f, 0.0f, 1}}) {
      plain(device);
      device.set_param(p::kSize, c.size);
      device.set_param(p::kDensity, c.density);
      device.set_param(p::kLayers, static_cast<float>(c.layers));
      const double size = c.size * 0.001;
      const double dt = size / 500.0;
      const std::vector<double> cloud = model(size, c.density, c.layers, dt, 500 * 8);
      const double end = model_time_to(cloud, dt, 0.995);
      Stereo out = run(device, impulse(static_cast<float>(size * 8.0 + 0.1), kRate));
      double worst = 0.0;
      const int stretches = 24;
      for (int w = 0; w < stretches; ++w) {
        const double from = w * end / stretches, to = (w + 1) * end / stretches;
        double expected = 0.0;
        for (int i = static_cast<int>(from / dt); i < static_cast<int>(to / dt); ++i) expected += cloud[i];
        if (expected < 0.01) continue;
        const double heard = energy(out.left, at(from), at(to));
        worst = std::max(worst, std::fabs(10.0 * std::log10(heard / expected)));
      }
      char label[160];
      std::snprintf(label, sizeof label,
                    "Size %.0f, Density %.1f, %d layers: the cloud is within 1 dB of the stages' sum "
                    "in every stretch (worst %.2f dB)",
                    c.size, c.density, c.layers, worst);
      EXPECT(worst < 1.0, label);
      for (double share : {0.1, 0.5, 0.9}) {
        std::snprintf(label, sizeof label, "Size %.0f, Density %.1f, %d layers: %.0f %% of the energy",
                      c.size, c.density, c.layers, share * 100.0);
        EXPECT_NEAR(time_to(out.left, share), model_time_to(cloud, dt, share), 0.03 * size + 0.001,
                    label);
      }
    }
  }

  // The picture on the plate is that sum as a level: the root of the energy
  // in a window of a twelfth of Size, drawn to its own peak. The device's
  // click gives the same curve, within 7 % of the peak at every point (13 %
  // at Density 0, where the cloud is a few separate echoes and one window
  // holds one or two of them).
  {
    const int per_size = 96, window = 8;
    const auto level = [&](const std::vector<double>& bins) {
      std::vector<double> out(bins.size(), 0.0);
      for (int i = 0; i < static_cast<int>(bins.size()); ++i) {
        double sum = 0.0;
        for (int j = i - window / 2; j < i + window / 2; ++j) {
          if (j >= 0 && j < static_cast<int>(bins.size())) sum += bins[j];
        }
        out[i] = std::sqrt(sum / window);
      }
      return out;
    };
    double worst_dense = 0.0, worst_sparse = 0.0;
    for (float size : {150.0f, 600.0f}) {
      for (float density : {0.0f, 0.3f, 0.8f, 1.0f}) {
        for (int layers = 1; layers <= 3; ++layers) {
          plain(device);
          device.set_param(p::kSize, size);
          device.set_param(p::kDensity, density);
          device.set_param(p::kLayers, static_cast<float>(layers));
          const double seconds = size * 0.001;
          const int bins = static_cast<int>((2.5 + 1.5 * (layers - 1)) * per_size);
          Stereo out = run(device, impulse(static_cast<float>(seconds * bins / per_size + 0.05), kRate));
          std::vector<double> heard(bins, 0.0);
          const double bin_samples = seconds * kRate / per_size;
          for (size_t i = 0; i < out.left.size(); ++i) {
            const size_t bin = static_cast<size_t>(static_cast<double>(i) / bin_samples);
            if (bin < heard.size()) heard[bin] += static_cast<double>(out.left[i]) * out.left[i];
          }
          const std::vector<double> drawn = level(model(seconds, density, layers, seconds / per_size, bins));
          const std::vector<double> real = level(heard);
          double top = 0.0, off = 0.0;
          for (double v : drawn) top = std::max(top, v);
          for (int i = 0; i < bins; ++i) off = std::max(off, std::fabs(real[i] - drawn[i]));
          (density == 0.0f ? worst_sparse : worst_dense) =
              std::max(density == 0.0f ? worst_sparse : worst_dense, off / top);
        }
      }
    }
    char label[160];
    std::snprintf(label, sizeof label,
                  "the curve the plate draws is the device's click: off by %.3f of its peak at most, "
                  "%.3f at Density 0",
                  worst_dense, worst_sparse);
    EXPECT(worst_dense < 0.07 && worst_sparse < 0.13, label);
  }

  // There is no tail. Three Sizes after a click what is left is 60 dB under
  // it, at every Density; with more layers, three times the cloud's own
  // nine-tenths time after it. The smallest cloud is gone in a tenth of a
  // second (its lowest octaves trail: a stage holds back what lies under
  // its own first resonance).
  {
    const auto left_after = [&](float size, float density, int layers, double seconds) {
      plain(device);
      device.set_param(p::kSize, size);
      device.set_param(p::kDensity, density);
      device.set_param(p::kLayers, static_cast<float>(layers));
      Stereo out = run(device, impulse(static_cast<float>(seconds) + 0.5f, kRate));
      const double from = seconds > 0.0 ? seconds : 3.0 * time_to(out.left, 0.9);
      return 10.0 * std::log10(std::max(1.0e-20, energy(out.left, at(from)) / energy(out.left)));
    };
    double worst_one = -200.0, worst_more = -200.0;
    for (float size : {60.0f, 150.0f, 330.0f, 600.0f}) {
      for (float density : {0.0f, 0.5f, 0.8f, 1.0f}) {
        worst_one = std::max(worst_one, left_after(size, density, 1, 3.0 * size * 0.001));
      }
      for (int layers : {2, 3}) worst_more = std::max(worst_more, left_after(size, 1.0f, layers, 0.0));
    }
    char label[160];
    std::snprintf(label, sizeof label, "one layer: three Sizes after a click 60 dB is gone (%.1f dB left)",
                  worst_one);
    EXPECT(worst_one < -60.0, label);
    std::snprintf(label, sizeof label,
                  "two and three layers: three times the cloud's length after a click 60 dB is gone "
                  "(%.1f dB left)",
                  worst_more);
    EXPECT(worst_more < -60.0, label);
    const double small = left_after(10.0f, 1.0f, 1, 0.1);
    std::snprintf(label, sizeof label, "Size 10 ms: gone a tenth of a second after a click (%.1f dB left)",
                  small);
    EXPECT(small < -60.0, label);
  }

  // The lows are not left behind. Far under its first resonance a stage
  // delays by its length times (1 + g) / (1 - g): near four lengths with a
  // coefficient of 0.6, a quarter of one with -0.6. The signs alternate down
  // the chain (the longer stage of each pair has the positive one), so a
  // 40 Hz note through the smallest cloud arrives 1.6 Sizes on; all one
  // sign, 2.5.
  {
    plain(device);
    device.set_param(p::kSize, 10.0f);
    std::vector<float> burst(at(1.0), 0.0f);
    const size_t length = at(0.1);
    for (size_t i = 0; i < length; ++i) {
      const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / length);
      burst[i] = static_cast<float>(0.5 * window * std::sin(2.0 * kPi * 40.0 * static_cast<double>(i) / kRate));
    }
    Stereo out = run(device, burst);
    const auto centre = [](const std::vector<float>& x) {
      double sum = 0.0, weighted = 0.0;
      for (size_t i = 0; i < x.size(); ++i) {
        const double e = static_cast<double>(x[i]) * x[i];
        sum += e;
        weighted += e * static_cast<double>(i);
      }
      return weighted / sum / kRate;
    };
    const double late = (centre(out.left) - centre(burst)) / 0.01;
    char label[140];
    std::snprintf(label, sizeof label, "a 40 Hz note through a 10 ms cloud arrives %.2f Sizes on, not 2.5", late);
    EXPECT(late > 1.2 && late < 2.0, label);
  }

  // A layer that is called for starts empty: what was in it when it was
  // last heard does not come out.
  {
    plain(device);
    device.set_param(p::kLayers, 3.0f);
    rng_state() = 0x1A7Eu;
    run(device, noise(1.0f, kRate, 0.3f));
    device.set_param(p::kLayers, 1.0f);
    run(device, noise(0.3f, kRate, 0.3f));
    Stereo quiet = render(device, 0.7f, kRate);
    EXPECT(peak(quiet.left, at(0.6)) < 1.0e-5, "0.6 s after the sound stops one layer is empty");
    device.set_param(p::kLayers, 3.0f);
    Stereo after = render(device, 0.7f, kRate);
    char label[140];
    std::snprintf(label, sizeof label, "a layer called for again starts empty (peak %g)", peak(after.left));
    EXPECT(peak(after.left) < 1.0e-5 && peak(after.right) < 1.0e-5, label);
  }

  // Every side is an allpass: a held note comes out at the level it went in,
  // at every frequency, with three layers, and still while the drift moves
  // every length.
  {
    for (float drift : {0.0f, 1.0f}) {
      double lowest = 100.0, highest = -100.0;
      for (int k = 0; k < 20; ++k) {
        const float hz = 80.0f * std::pow(16000.0f / 80.0f, static_cast<float>(k) / 19.0f);
        plain(device);
        device.set_param(p::kLayers, 3.0f);
        device.set_param(p::kWidth, 1.0f);
        device.set_param(p::kDrift, drift);
        Stereo out = run(device, sine(hz, 3.0f, kRate, 0.5f));
        const double full = 0.5 / std::sqrt(2.0);
        for (const std::vector<float>* side : {&out.left, &out.right}) {
          const double level = db(rms(*side, at(1.5), at(3.0)) / full);
          lowest = std::min(lowest, level);
          highest = std::max(highest, level);
        }
      }
      char label[160];
      std::snprintf(label, sizeof label,
                    "Drift %.0f: a held note from 80 Hz to 16 kHz comes out at its own level "
                    "(%.3f to %.3f dB)",
                    drift, lowest, highest);
      const double bound = drift == 0.0f ? 0.03 : 1.0;
      EXPECT(lowest > -bound && highest < bound, label);
    }
  }

  // Layers lengthens the cloud and rounds its start: the middle of the
  // energy comes later by the same step each time, and the first tenth
  // comes later still against the last.
  {
    double half[3], tenth[3], most[3];
    for (int layers = 1; layers <= 3; ++layers) {
      plain(device);
      device.set_param(p::kLayers, static_cast<float>(layers));
      Stereo out = run(device, impulse(2.0f, kRate));
      tenth[layers - 1] = time_to(out.left, 0.1);
      half[layers - 1] = time_to(out.left, 0.5);
      most[layers - 1] = time_to(out.left, 0.9);
    }
    EXPECT_NEAR(half[1] / half[0], 1.87, 0.1, "two layers: the middle of the cloud is 1.9 times as late");
    EXPECT_NEAR(half[2] / half[0], 2.72, 0.15, "three layers: 2.7 times as late");
    EXPECT(most[1] > 1.5 * most[0] && most[2] > 2.1 * most[0], "more layers: a longer cloud");
    EXPECT(tenth[0] / most[0] < 0.42 && tenth[2] / most[2] > 0.52,
           "more layers: the cloud starts later against its length (a rounder onset)");
  }

  // Density: at 0 the cloud is a spray of separate echoes (one sample holds
  // a twentieth of the energy, a few hundred stand out), at 1 it is a wash.
  {
    double largest[2];
    int standing[2];
    int which = 0;
    for (float density : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kSize, 300.0f);
      device.set_param(p::kDensity, density);
      Stereo out = run(device, impulse(1.5f, kRate));
      const double top = peak(out.left);
      largest[which] = top * top / energy(out.left);
      standing[which] = 0;
      for (float v : out.left) {
        if (std::fabs(v) > 0.05 * top) ++standing[which];
      }
      ++which;
    }
    EXPECT(largest[0] > 0.04 && largest[1] < 0.004,
           "Density 0: one echo holds a twentieth of the energy; at 1 no echo holds a 250th");
    EXPECT(standing[1] > 8 * standing[0] && standing[1] > 4000,
           "Density 1: thousands of echoes within 26 dB of the loudest, ten times those at 0");
  }

  // Width takes the two sides apart. At 0 they are the same sample for
  // sample; at 1 unrelated; low down the highs part first and the lows stay
  // together. Each side keeps the level of the sound either way.
  {
    const auto sides = [&](float width) {
      plain(device);
      device.set_param(p::kWidth, width);
      device.set_param(p::kDrift, 0.5f);
      rng_state() = 0x51DEu;
      return run(device, noise(3.0f, kRate, 0.3f));
    };
    const auto band = [](const std::vector<float>& x, double hz, bool above) {
      std::vector<float> out(x.size());
      const double a = std::exp(-2.0 * kPi * hz / kRate);
      double low1 = 0.0, low2 = 0.0;
      for (size_t i = 0; i < x.size(); ++i) {
        low1 = x[i] + (low1 - x[i]) * a;
        low2 = low1 + (low2 - low1) * a;
        out[i] = static_cast<float>(above ? x[i] - 2.0 * low1 + low2 : low2);
      }
      return out;
    };
    Stereo mono = sides(0.0f);
    EXPECT(mono.left == mono.right, "Width 0: the two sides are the same, drift and all");
    Stereo wide = sides(1.0f);
    const double apart = correlation(wide.left, wide.right, at(1.0), at(3.0));
    EXPECT(std::fabs(apart) < 0.12, "Width 1: the sides are unrelated");
    EXPECT_NEAR(rms(wide.right, at(1.0), at(3.0)) / rms(wide.left, at(1.0), at(3.0)), 1.0, 0.02,
                "Width 1: both sides as loud as each other");
    // The knob runs evenly over how far down the two sides part: at 0.3 the
    // highs are apart and the lows together, and at 0.6 the lows under 150 Hz
    // still are. (It used to run evenly over the lengths, which parted
    // everything over 600 Hz by 0.1 and left the rest of the knob to the bass:
    // at 0.6 the lows were at 0.6 already.)
    Stereo narrow = sides(0.3f);
    const double lows = correlation(band(narrow.left, 150.0, false), band(narrow.right, 150.0, false),
                                    at(1.0), at(3.0));
    const double highs = correlation(band(narrow.left, 5000.0, true), band(narrow.right, 5000.0, true),
                                     at(1.0), at(3.0));
    char label[160];
    std::snprintf(label, sizeof label,
                  "Width 0.3: the lows stay together (%.2f) while the highs have parted (%.2f)", lows,
                  highs);
    EXPECT(lows > 0.9 && std::fabs(highs) < 0.3, label);
    Stereo wider = sides(0.6f);
    const double bass = correlation(band(wider.left, 150.0, false), band(wider.right, 150.0, false),
                                    at(1.0), at(3.0));
    const double rest = correlation(band(wider.left, 2400.0, true), band(wider.right, 2400.0, true),
                                    at(1.0), at(3.0));
    std::snprintf(label, sizeof label,
                  "Width 0.6: the lows under 150 Hz are still together (%.2f), all over 2.4 kHz apart (%.2f)",
                  bass, rest);
    EXPECT(bass > 0.85 && std::fabs(rest) < 0.15, label);
    Stereo slight = sides(0.1f);
    const double begun = correlation(band(slight.left, 5000.0, true), band(slight.right, 5000.0, true),
                                     at(1.0), at(3.0));
    std::snprintf(label, sizeof label, "Width 0.1: the highs have begun to part and no more (%.2f)", begun);
    EXPECT(begun > 0.1 && begun < 0.9, label);
  }

  // Drift moves the cloud without bending pitch: a held tone strays a few
  // cents at the very most with three layers and the knob full up, a cent at
  // the default, and not at all at 0.
  {
    const auto strays = [&](float drift, int layers, float hz) {
      device.init(kRate);
      device.set_param(p::kDrift, drift);
      device.set_param(p::kLayers, static_cast<float>(layers));
      Stereo out = run(device, sine(hz, 30.0f, kRate, 0.5f));
      return worst_cents(out.left, hz, at(2.0), 4800);
    };
    const double full = std::max(strays(1.0f, 3, 1000.0f), strays(1.0f, 3, 220.0f));
    const double usual = strays(p::kParamDefault[p::kDrift], 1, 1000.0f);
    const double none = strays(0.0f, 3, 1000.0f);
    char label[140];
    std::snprintf(label, sizeof label,
                  "Drift: a tone strays %.2f cents at most full up, %.2f at the default, %.4f at 0", full,
                  usual, none);
    EXPECT(full < 10.0 && full > 1.0 && usual < 2.0 && usual > 0.1 && none < 0.01, label);
  }

  // Soften takes the hit off. A click is gone in proportion; the first
  // milliseconds of a note that starts at once are turned down in the cloud
  // and in the dry sound; a held note is left as it is.
  {
    double click[3];
    int which = 0;
    for (float soften : {0.0f, 0.5f, 1.0f}) {
      plain(device);
      device.set_param(p::kSoften, soften);
      Stereo out = run(device, impulse(1.0f, kRate, 0.5f));
      click[which++] = std::sqrt(energy(out.left));
    }
    EXPECT_NEAR(click[1] / click[0], 0.5, 0.01, "Soften 0.5: a click's cloud is half as loud");
    EXPECT(click[2] < 0.001 * click[0], "Soften 1: a click from silence is 60 dB down");

    std::vector<float> note = sine(440.0f, 3.0f, kRate, 0.5f);
    Stereo dry[2], cloud[2];
    which = 0;
    for (float soften : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kSoften, soften);
      device.set_param(p::kMix, 0.5f);
      dry[which] = run(device, note);
      plain(device);
      device.set_param(p::kSoften, soften);
      cloud[which] = run(device, note);
      ++which;
    }
    const double first = db(rms(dry[1].left, 0, at(0.003)) / rms(dry[0].left, 0, at(0.003)));
    char label[140];
    std::snprintf(label, sizeof label,
                  "Soften 1 at Mix 0.5: the first 3 ms of the dry note are turned down (%.1f dB)", first);
    EXPECT(first < -8.0 && first > -16.0, label);
    const double early = db(rms(cloud[1].left, 0, at(0.05)) / rms(cloud[0].left, 0, at(0.05)));
    std::snprintf(label, sizeof label, "Soften 1: the first 50 ms of the cloud are turned down (%.1f dB)",
                  early);
    EXPECT(early < -6.0, label);
    double worst = 0.0;
    for (size_t i = at(1.5); i < note.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(cloud[1].left[i]) - cloud[0].left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(dry[1].left[i]) - dry[0].left[i]));
    }
    EXPECT(worst < 1.0e-5, "Soften leaves a held note as it is once it has faded in");
    // A low note is a steady level too: the peak is held from one crest to
    // the next, so the gain does not move with the wave.
    for (float hz : {30.0f, 60.0f}) {
      std::vector<float> low = sine(hz, 3.0f, kRate, 0.5f);
      Stereo with[2];
      which = 0;
      for (float soften : {0.0f, 1.0f}) {
        plain(device);
        device.set_param(p::kSoften, soften);
        with[which++] = run(device, low);
      }
      double off = 0.0;
      for (size_t i = at(1.5); i < low.size(); ++i) {
        off = std::max(off, std::fabs(static_cast<double>(with[1].left[i]) - with[0].left[i]));
      }
      std::snprintf(label, sizeof label, "Soften 1 leaves a held %.0f Hz note as it is (off by %g)", hz, off);
      EXPECT(off < 1.0e-5, label);
    }
  }

  // Mix 0 is the input sample for sample, whatever the other knobs say.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kSoften, 1.0f);
    device.set_param(p::kLayers, 3.0f);
    device.set_param(p::kLowCut, 500.0f);
    device.set_param(p::kDamp, 1.0f);
    rng_state() = 0xD17u;
    std::vector<float> left = noise(1.0f, kRate, 0.7f);
    std::vector<float> right = noise(1.0f, kRate, 0.7f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");
  }

  // Damp takes the highs out of the cloud and Low Cut the lows, 12 dB an
  // octave; at Damp 0 the high cut is out of the path altogether.
  {
    const auto level = [&](float hz, float damp, float low_cut) {
      plain(device);
      device.set_param(p::kDamp, damp);
      device.set_param(p::kLowCut, low_cut);
      Stereo out = run(device, sine(hz, 2.0f, kRate, 0.5f));
      return db(rms(out.left, at(1.0), at(2.0)) / (0.5 / std::sqrt(2.0)));
    };
    EXPECT_NEAR(level(4000.0f, 1.0f, 20.0f), -24.0, 1.0, "Damp 1: 4 kHz is two octaves over a 1 kHz cut");
    EXPECT_NEAR(level(1000.0f, 1.0f, 20.0f), -3.0, 0.3, "Damp 1: the cut is at 1 kHz");
    EXPECT_NEAR(level(15000.0f, 0.0f, 20.0f), 0.0, 0.02, "Damp 0: nothing is taken at 15 kHz");
    EXPECT_NEAR(level(100.0f, 0.0f, 400.0f), -24.0, 1.0, "Low Cut 400 Hz: 100 Hz is two octaves under it");
    EXPECT_NEAR(level(400.0f, 0.0f, 400.0f), -3.0, 0.3, "Low Cut: the cut is where the knob says");
  }

  // Level: a held chord through the default patch comes out as loud as it
  // went in on each side, and noise does with Damp at 0 (the default Damp
  // takes the top off white noise, which is what it is for).
  {
    std::vector<float> chord(at(4.0));
    const double notes[5] = {220.0, 277.2, 329.6, 440.0, 660.0};
    for (size_t i = 0; i < chord.size(); ++i) {
      double sum = 0.0;
      for (int n = 0; n < 5; ++n) sum += std::sin(2.0 * kPi * notes[n] * static_cast<double>(i) / kRate + n);
      chord[i] = static_cast<float>(0.1 * sum);
    }
    device.init(kRate);
    Stereo out = run(device, chord);
    EXPECT_NEAR(db(rms(out.left, at(1.0), at(4.0)) / rms(chord, at(1.0), at(4.0))), 0.0, 0.2,
                "the default patch is as loud as a chord going in, on the left");
    EXPECT_NEAR(db(rms(out.right, at(1.0), at(4.0)) / rms(chord, at(1.0), at(4.0))), 0.0, 0.2,
                "and on the right");
    for (float soften : {0.0f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kDamp, 0.0f);
      device.set_param(p::kSoften, soften);
      rng_state() = 0xA11u;
      std::vector<float> in = noise(4.0f, kRate, 0.3f);
      Stereo loud = run(device, in);
      EXPECT_NEAR(db(rms(loud.left, at(1.0), at(4.0)) / rms(in, at(1.0), at(4.0))), 0.0, 0.2,
                  "steady noise is as loud coming out, and Soften finds no attack in it");
    }
  }

  // No knob clicks. Each is moved while a low tone sounds (a jump across its
  // whole range), against the same tone with nothing moved: Size bends the
  // pitch for a moment, so its step may grow, but there is no jump.
  {
    std::vector<float> tone = sine(220.0f, 3.0f, kRate, 0.25f);
    const std::vector<float> first(tone.begin(), tone.begin() + at(1.0));
    const std::vector<float> second(tone.begin() + at(1.0), tone.begin() + at(2.0));
    const std::vector<float> third(tone.begin() + at(2.0), tone.end());
    const auto steps = [&](int param, float there, float back, float mix) {
      device.init(kRate);
      device.set_param(p::kMix, mix);
      run(device, first);
      if (param >= 0) device.set_param(param, there);
      Stereo moved = run(device, second);
      if (param >= 0) device.set_param(param, back);
      Stereo again = run(device, third);
      return std::max(std::max(max_step(moved.left), max_step(moved.right)),
                      std::max(max_step(again.left), max_step(again.right)));
    };
    const double still = steps(-1, 0.0f, 0.0f, 1.0f);
    const double still_half = steps(-1, 0.0f, 0.0f, 0.5f);
    struct Move {
      int param;
      float there, back, mix;
      double limit;  // times the step of the tone left alone
      const char* name;
    };
    const Move moves[] = {
        {p::kSize, 600.0f, 10.0f, 1.0f, 8.0, "Size"},
        {p::kLayers, 3.0f, 1.0f, 1.0f, 2.0, "Layers"},
        {p::kDensity, 0.0f, 1.0f, 1.0f, 2.0, "Density"},
        {p::kDrift, 1.0f, 0.0f, 1.0f, 2.0, "Drift"},
        {p::kSoften, 1.0f, 0.0f, 0.5f, 2.0, "Soften"},
        {p::kDamp, 1.0f, 0.0f, 1.0f, 2.0, "Damp"},
        {p::kLowCut, 1000.0f, 20.0f, 1.0f, 2.0, "Low Cut"},
        {p::kWidth, 0.0f, 1.0f, 1.0f, 2.0, "Width"},
        {p::kMix, 0.0f, 1.0f, 1.0f, 2.0, "Mix"},
    };
    for (const Move& move : moves) {
      const double reference = move.mix == 1.0f ? still : still_half;
      const double step = steps(move.param, move.there, move.back, move.mix);
      char label[140];
      std::snprintf(label, sizeof label, "%s jumps across its range without a click (step %.4f, %.4f left alone)",
                    move.name, step, reference);
      EXPECT(step < move.limit * reference, label);
    }
  }

  // One bad input sample (not a number, infinite, absurdly large) does not
  // stay in the chain: a second later the output is what it would have been.
  {
    rng_state() = 0xBADu;
    const std::vector<float> clean = noise(3.0f, kRate, 0.25f);
    device.init(kRate);
    device.set_param(p::kLayers, 3.0f);
    Stereo reference = run(device, clean);
    const float bads[3] = {std::nanf(""), std::numeric_limits<float>::infinity(), -1.0e30f};
    const char* names[3] = {"a NaN", "an infinite sample", "a sample of -1e30"};
    for (int k = 0; k < 3; ++k) {
      std::vector<float> spoiled = clean;
      spoiled[at(0.5)] = bads[k];
      device.init(kRate);
      device.set_param(p::kLayers, 3.0f);
      Stereo out = run(device, spoiled);
      double worst = 0.0;
      for (size_t i = at(2.0); i < clean.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
      }
      char label[140];
      std::snprintf(label, sizeof label, "%s in the input: finite, bounded, and gone 1.5 s later (off by %g)",
                    names[k], worst);
      EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < 20.0 && worst < 1.0e-4, label);
      render(device, 3.0f, kRate);
      Stereo rest = render(device, 0.5f, kRate);
      EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "and the device still goes to sleep");
    }
  }

  // The same sound at block sizes 1, 128 and 2048, also across a sleep
  // during which knobs were moved: they snap on waking, the drift starts
  // again, and nothing glides in from where it was.
  {
    rng_state() = 0xB10Cu;
    const std::vector<float> burst = noise(0.7f, kRate, 0.3f);
    const auto session = [&](int block) {
      device.init(kRate);
      device.set_param(p::kDrift, 1.0f);
      device.set_param(p::kLayers, 2.0f);
      Stereo a = run(device, burst, block);
      Stereo gap = render(device, 5.0f, kRate, block);
      device.set_param(p::kSize, 420.0f);
      device.set_param(p::kWidth, 0.3f);
      device.set_param(p::kMix, 0.6f);
      device.set_param(p::kLayers, 3.0f);
      device.set_param(p::kDamp, 0.7f);
      Stereo b = run(device, burst, block);
      Stereo tail = render(device, 1.0f, kRate, block);
      return concat(concat(a, gap), concat(b, tail));
    };
    const Stereo usual = session(128);
    double worst = 0.0;
    for (int block : {1, 2048}) {
      const Stereo other = session(block);
      for (size_t i = 0; i < usual.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(other.left[i]) - usual.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(other.right[i]) - usual.right[i]));
      }
    }
    char label[140];
    std::snprintf(label, sizeof label, "the same sound at blocks of 1, 128 and 2048 across a sleep (off by %g)",
                  worst);
    EXPECT(worst < 1.0e-5, label);
    EXPECT(peak(usual.left, at(4.5), at(5.5)) == 0.0, "asleep between the two bursts");

    // What woke is the device as it would be with those settings from the start.
    device.init(kRate);
    device.set_param(p::kDrift, 1.0f);
    device.set_param(p::kSize, 420.0f);
    device.set_param(p::kWidth, 0.3f);
    device.set_param(p::kMix, 0.6f);
    device.set_param(p::kLayers, 3.0f);
    device.set_param(p::kDamp, 0.7f);
    Stereo fresh = run(device, burst);
    double off = 0.0;
    for (size_t i = 0; i < fresh.size(); ++i) {
      off = std::max(off, std::fabs(static_cast<double>(fresh.left[i]) - usual.left[at(5.7) + i]));
    }
    std::snprintf(label, sizeof label, "knobs moved during a sleep have snapped on waking (off by %g)", off);
    EXPECT(off < 1.0e-5, label);
  }

  // The readings for the display: the time since the last attack, how loud
  // it was, and how much of the gain Soften has off. Reading them changes nothing.
  {
    device.init(kRate);
    device.set_param(p::kSoften, 1.0f);
    EXPECT(device.meter(0) == Fog::kRestAge && device.meter(1) == 0.0f && device.meter(2) == 0.0f,
           "at rest: no attack on its way, no gain taken");
    std::vector<float> phrase = silence(0.25f, kRate);
    std::vector<float> note = sine(330.0f, 0.5f, kRate, 0.4f);
    phrase.insert(phrase.end(), note.begin(), note.end());
    run(device, std::vector<float>(phrase.begin(), phrase.begin() + at(0.25) + 96));
    EXPECT(device.meter(2) > 0.8f, "2 ms into a note Soften has most of the gain off");
    run(device, std::vector<float>(phrase.begin() + at(0.25) + 96, phrase.end()));
    EXPECT_NEAR(device.meter(0), 0.5, 0.005, "half a second after the attack the meter says so");
    EXPECT_NEAR(device.meter(1), 0.4, 0.01, "and how loud the attack was");
    EXPECT(device.meter(2) == 0.0f, "a held note is at full gain");
    const float before = device.meter(0);
    for (int n = 0; n < 5; ++n) device.meter(n % 3);
    EXPECT(device.meter(0) == before, "reading a meter changes nothing");
    render(device, 4.0f, kRate);
    EXPECT(device.meter(0) == Fog::kRestAge && device.meter(2) == 0.0f, "asleep the meters are at rest");
  }

  // --- Found by the second check -------------------------------------------

  // A held note keeps its level from moment to moment while the drift runs,
  // at the longest Size with three layers too. A length that moves bends the
  // pitch of what passes it, and the stages after it ring for about a Size:
  // with every length moving as fast at Size 600 as at Size 25, a 4 kHz note
  // went between 21 dB under its level and 7 over within a second (the level
  // over a second and a half, at Size 150, hid it). Read in windows of 50 ms.
  {
    const auto wavers = [&](float size, int layers, float hz, double* low, double* high) {
      device.init(kRate);
      device.set_param(p::kSize, size);
      device.set_param(p::kLayers, static_cast<float>(layers));
      device.set_param(p::kDrift, 1.0f);
      device.set_param(p::kSoften, 0.0f);
      device.set_param(p::kDamp, 0.0f);
      Stereo out = run(device, sine(hz, 24.0f, kRate, 0.25f));
      const double full = 0.25 / std::sqrt(2.0);
      for (size_t from = at(4.0); from + 2400 <= out.size(); from += 2400) {
        for (const std::vector<float>* side : {&out.left, &out.right}) {
          const double level = db(rms(*side, from, from + 2400) / full);
          *low = std::min(*low, level);
          *high = std::max(*high, level);
        }
      }
    };
    double low = 100.0, high = -100.0;
    wavers(600.0f, 3, 4186.0f, &low, &high);
    wavers(600.0f, 1, 4186.0f, &low, &high);
    wavers(150.0f, 3, 4186.0f, &low, &high);
    char label[200];
    std::snprintf(label, sizeof label,
                  "Drift 1: a held 4186 Hz note stays at its level in every 50 ms, Size 150 and 600, one "
                  "layer and three (%.2f to %+.2f dB)",
                  low, high);
    EXPECT(low > -2.0 && high < 2.0, label);
    low = 100.0;
    high = -100.0;
    wavers(600.0f, 3, 1046.5f, &low, &high);
    std::snprintf(label, sizeof label, "and a 1046 Hz note at Size 600 with three layers (%.2f to %+.2f dB)", low,
                  high);
    EXPECT(low > -0.6 && high < 0.6, label);
  }

  // The drift adds no crackle. A steady tone obeys y[n+1] + y[n-1] =
  // 2 cos(w) y[n] whatever its level and phase, and a tone whose pitch
  // drifts by a few cents nearly so; what is left over is a break in the
  // wave. The interpolator's whole part stepped where its fraction was a
  // half, which shifts a 10 kHz tone's phase by a third of a radian at once:
  // breaks of three quarters of the tone's own height, a hundred a second.
  {
    const float hz = 10000.0f;
    device.init(kRate);
    device.set_param(p::kDrift, 1.0f);
    device.set_param(p::kSoften, 0.0f);
    device.set_param(p::kDamp, 0.0f);
    Stereo out = run(device, sine(hz, 12.0f, kRate, 0.5f));
    const double turn = 2.0 * std::cos(2.0 * kPi * hz / kRate);
    double worst = 0.0, sum = 0.0;
    size_t count = 0;
    for (const std::vector<float>* side : {&out.left, &out.right}) {
      for (size_t i = at(2.0); i + 1 < side->size(); ++i) {
        const double left_over = (*side)[i + 1] + (*side)[i - 1] - turn * (*side)[i];
        worst = std::max(worst, std::fabs(left_over));
        sum += left_over * left_over;
        ++count;
      }
    }
    char label[200];
    std::snprintf(label, sizeof label,
                  "Drift 1: a 10 kHz tone of 0.5 comes out unbroken (largest break %.4f, %.1f dB under the "
                  "tone on average)",
                  worst, -db(std::sqrt(sum / static_cast<double>(count)) / (0.5 / std::sqrt(2.0))));
    EXPECT(worst < 0.05 && std::sqrt(sum / static_cast<double>(count)) < 0.5 / std::sqrt(2.0) * 0.003, label);
  }

  // Soften leaves a held chord alone. Three notes at the bottom of a piano
  // beat against each other tens of times a second, and each return from a
  // beat's low is a rise like an attack's: measured against the level of the
  // moment, Soften took up to 36 % of the gain off a held triad, 27 times a
  // second. It measures against the top of the sound now.
  {
    std::vector<float> chord(at(4.0), 0.0f);
    const double notes[3] = {65.41, 82.41, 98.0};
    for (size_t i = 0; i < chord.size(); ++i) {
      double sum = 0.0;
      for (int k = 0; k < 3; ++k) sum += 0.2 * std::sin(2.0 * kPi * notes[k] * i / kRate + 1.3 * k);
      chord[i] = static_cast<float>(sum * std::min(1.0, i / (0.5 * kRate)));
    }
    double most = 0.0;
    for (float soften : {1.0f, p::kParamDefault[p::kSoften]}) {
      device.init(kRate);
      device.set_param(p::kSoften, soften);
      float taken = 0.0f;
      for (size_t done = 0; done < chord.size(); done += 8) {
        for (int i = 0; i < 8; ++i) {
          device.in_left()[i] = chord[done + i];
          device.in_right()[i] = chord[done + i];
        }
        device.process(8);
        if (done >= at(1.5)) taken = std::max(taken, device.meter(2));
      }
      if (soften == 1.0f) most = taken;
      char label[160];
      std::snprintf(label, sizeof label,
                    "Soften %.1f: a held low triad keeps its gain (at most %.3f taken off between its beats)",
                    soften, taken);
      EXPECT(taken < 0.12f * soften + 0.001f, label);
    }
    (void)most;
  }

  // The host's block size is never heard, wherever in a block a sound
  // starts and however long the silence before it was. The gate used to look
  // at whole blocks: the device went to sleep and woke at a block's edge, and
  // the control clock and the drift started from there, so the same notes
  // after a rest came out up to a quarter of full scale apart at another
  // block size. Six bursts, each after a rest that ends in the middle of a
  // block, the rests on both sides of the time the device takes to doze off.
  {
    rng_state() = 0x5EEDu;
    const std::vector<float> burst = noise(0.3f, kRate, 0.3f);
    std::vector<float> input(4807, 0.0f);
    for (int rest : {57613, 76801, 79207, 81611, 86419, 240007}) {
      input.insert(input.end(), burst.begin(), burst.end());
      input.insert(input.end(), static_cast<size_t>(rest), 0.0f);
    }
    const auto session = [&](const std::vector<int>& blocks) {
      device.init(kRate);
      device.set_param(p::kDrift, 1.0f);
      device.set_param(p::kLayers, 2.0f);
      device.set_param(p::kMix, 0.8f);
      Stereo out;
      out.left.resize(input.size());
      out.right.resize(input.size());
      size_t done = 0;
      for (size_t turn = 0; done < input.size(); ++turn) {
        const int frames =
            static_cast<int>(std::min<size_t>(blocks[turn % blocks.size()], input.size() - done));
        for (int i = 0; i < frames; ++i) {
          device.in_left()[i] = input[done + i];
          device.in_right()[i] = input[done + i];
        }
        device.process(frames);
        for (int i = 0; i < frames; ++i) {
          out.left[done + i] = device.out_left()[i];
          out.right[done + i] = device.out_right()[i];
        }
        done += frames;
      }
      return out;
    };
    const Stereo usual = session({128});
    double worst = 0.0;
    const std::vector<std::vector<int>> others = {{1}, {32}, {512}, {2048}, {7, 128, 1, 2048, 33, 512, 64}};
    for (const std::vector<int>& blocks : others) {
      const Stereo other = session(blocks);
      for (size_t i = 0; i < usual.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(other.left[i]) - usual.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(other.right[i]) - usual.right[i]));
      }
    }
    char label[200];
    std::snprintf(label, sizeof label,
                  "sounds that start in the middle of a block after a rest: the same at blocks of 1, 32, 128, "
                  "512, 2048 and mixed (off by %g)",
                  worst);
    EXPECT(worst < 1.0e-6, label);
    EXPECT(peak(usual.left, input.size() - at(0.5), input.size()) == 0.0 &&
               peak(usual.right, input.size() - at(0.5), input.size()) == 0.0,
           "and after the longest rest the output is exact zero");
  }

  // The cloud never goes out past four times full scale, whatever is done
  // to the knobs. A stage at one of its resonances holds a note at 2.5 times
  // its level, and a length that jumps lets that out at once: a full-scale
  // square wave came out at 4.5 while Size was thrown about, with nothing in
  // the way. And a sample that is infinite is silence, as one that is not a
  // number is: it used to go down the chain as a click 16 times full scale.
  {
    std::vector<float> square(at(12.0));
    for (size_t i = 0; i < square.size(); ++i) square[i] = (i / 436) % 2 == 0 ? 1.0f : -1.0f;  // 55 Hz
    device.init(kRate);
    device.set_param(p::kLayers, 3.0f);
    device.set_param(p::kDensity, 1.0f);
    device.set_param(p::kSoften, 0.0f);
    device.set_param(p::kDamp, 0.0f);
    livemix::kit::Rng dice;
    dice.seed(0xD1CEu);
    float top = 0.0f;
    bool finite = true;
    for (size_t done = 0; done < square.size(); done += 128) {
      if (done % 9600 == 0) {
        device.set_param(p::kSize, 10.0f * std::pow(60.0f, dice.uniform()));
        device.set_param(p::kDensity, dice.uniform() < 0.5f ? 0.0f : 1.0f);
      }
      const int frames = static_cast<int>(std::min<size_t>(128, square.size() - done));
      for (int i = 0; i < frames; ++i) {
        device.in_left()[i] = square[done + i];
        device.in_right()[i] = square[done + i];
      }
      device.process(frames);
      for (int i = 0; i < frames; ++i) {
        const float l = device.out_left()[i], r = device.out_right()[i];
        if (!(l - l == 0.0f) || !(r - r == 0.0f)) finite = false;
        top = std::max(top, std::max(std::fabs(l), std::fabs(r)));
      }
    }
    char label[160];
    std::snprintf(label, sizeof label,
                  "a full-scale square wave with Size and Density thrown about every 0.2 s: peak %.2f", top);
    EXPECT(finite && top <= 4.0f, label);

    // Density thrown from one end to the other under a note: a coefficient
    // that drops within 20 ms let out what the long stages had stored, 1.8
    // times the note's level for a tenth of a second (2.4 times at Size 600
    // with three layers). It glides over a Size now, as long as the stages
    // take to empty, and the most is 1.5.
    {
      const std::vector<float> note = sine(110.0f, 4.0f, kRate, 0.5f);
      double most = 0.0;
      for (float to : {0.0f, 1.0f}) {
        device.init(kRate);
        device.set_param(p::kSoften, 0.0f);
        device.set_param(p::kDensity, 1.0f - to);
        Stereo held = run(device, std::vector<float>(note.begin(), note.begin() + at(2.0)));
        device.set_param(p::kDensity, to);
        Stereo moved = run(device, std::vector<float>(note.begin() + at(2.0), note.end()));
        most = std::max(most, std::max(peak(moved.left), peak(moved.right)) / peak(held.left, at(1.0), at(2.0)));
      }
      std::snprintf(label, sizeof label,
                    "Density thrown across its range under a 110 Hz note: the peak is %.2f times the note's",
                    most);
      EXPECT(most < 1.6, label);
    }

    std::vector<float> tone = sine(220.0f, 2.0f, kRate, 0.25f);
    device.init(kRate);
    const double clean = peak(run(device, tone).left, at(1.0), at(2.0));
    tone[at(1.0)] = std::numeric_limits<float>::infinity();
    tone[at(1.0) + 7] = -std::numeric_limits<float>::infinity();
    device.init(kRate);
    const Stereo out = run(device, tone);
    std::snprintf(label, sizeof label,
                  "two infinite samples in a note are two samples of silence (peak %.3f after them, %.3f without)",
                  peak(out.left, at(1.0), at(2.0)), clean);
    EXPECT(peak(out.left, at(1.0), at(2.0)) < clean + 0.3 && peak(out.right, at(1.0), at(2.0)) < clean + 0.3,
           label);
  }


  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("fog", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kLayers, 3.0f);
  device.set_param(p::kDrift, 1.0f);
  device.set_param(p::kSoften, 1.0f);
  device.set_param(p::kSize, 600.0f);
  report_cost("fog at its heaviest (three layers, drifting)", 10.0f, kRate, [&] { run(device, input); });

  return finish("fog");
}
