// Native harness for the Winding Down effect (cpp/devices/winding-down):
// conformance, then what makes it what it is. Layers of one pulse an octave
// apart in rate that glide together under a bell, a gain that only turns
// down, and a clock that runs on through any silence.
//
//   c++ -std=c++17 -O2 -fno-exceptions -fno-rtti cpp/test/winding_down_test.cpp -o /tmp/winding_down_test
//
// WINDING_REPORT=1 prints every figure, passing or not.

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <vector>

#include "../devices/winding-down/winding_down.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::WindingDown;
namespace p = livemix::winding_down;

static WindingDown device;
static WindingDown twin;
static WindingDown spare;

static const float kRate = 48000.0f;
static const float kRates[3] = {44100.0f, 48000.0f, 96000.0f};

static bool report() {
  static const bool on = std::getenv("WINDING_REPORT") != nullptr;
  return on;
}
#define MEASURED(...)              \
  do {                             \
    if (report()) {                \
      std::printf("  measured: "); \
      std::printf(__VA_ARGS__);    \
      std::printf("\n");           \
    }                              \
  } while (0)

// --- settings ----------------------------------------------------------------------------------

struct Setting {
  int direction = 0;  // 0 Slower, 1 Quicker
  double rate = 4.0;
  double halving = 20.0;
  int layers = 4;
  double depth = 0.7;
  double edge_ms = 15.0;
  double offset = 0.0;
};

static void apply(WindingDown& d, const Setting& s) {
  d.set_param(p::kDirection, static_cast<float>(s.direction));
  d.set_param(p::kRate, static_cast<float>(s.rate));
  d.set_param(p::kHalving, static_cast<float>(s.halving));
  d.set_param(p::kLayers, static_cast<float>(s.layers));
  d.set_param(p::kDepth, static_cast<float>(s.depth));
  d.set_param(p::kEdge, static_cast<float>(s.edge_ms));
  d.set_param(p::kOffset, static_cast<float>(s.offset));
}

static void fresh(WindingDown& d, const Setting& s, float rate = kRate) {
  d.init(rate);
  apply(d, s);
}

// --- the law, written out again ----------------------------------------------------------------
//
// Nothing here is the device's code. Every layer keeps a phase of its own
// and is moved on by its own rate, worked out afresh each sample from the
// place in closed form; the device reads all its layers from one phase by
// doubling it and steps a ratio. Where the two agree, the device's layers are
// locked, an octave apart, under the bell, and glide as the spec says.
//
//   place(n)   = ± n / (Halving · rate)             octaves glided after n samples
//   layer j    : x = j - place octaves from the centre, at Rate · 2^x hertz
//   weight     = (1 + cos(2π x / Layers)) / 2 inside half of Layers either way, 0 outside
//   gain       = floor + (1 - floor) · Σ weight · open / Σ weight,   floor = (1 - Depth)²
//
// Six layers are kept, from the one two to three octaves under the centre
// up. One that comes in on top has twice the phase of the one under it; one
// that comes in underneath has half the phase of the one over it at that
// sample, which is the one thing here that is the device's choice.
struct Model {
  static constexpr int kLayers = 6;
  static constexpr int kUnder = 2;

  Model(const Setting& s, double sample_rate) : setting(s), sr(sample_rate) {
    for (double& ph : phase) ph = 0.0;
  }

  static double open(double ph, double edge) {
    const double pi = 3.14159265358979323846;
    if (!(ph > 0.0)) return 0.0;
    if (ph < edge) return 0.5 - 0.5 * std::cos(pi * ph / edge);
    if (ph < 0.5) return 1.0;
    if (ph - 0.5 < edge) return 0.5 + 0.5 * std::cos(pi * (ph - 0.5) / edge);
    return 0.0;
  }

  static double frac(double x) { return x - std::floor(x); }

  double weight_of(double x) const {
    const double pi = 3.14159265358979323846;
    const double span = static_cast<double>(setting.layers);
    if (!(x > -0.5 * span && x < 0.5 * span)) return 0.0;
    return 0.5 + 0.5 * std::cos(2.0 * pi * x / span);
  }

  // The rate in hertz and the share of the weight of the layer `along` places
  // up from the lowest kept, as they stand.
  double rate_of(int along) const { return setting.rate * std::exp2(static_cast<double>(low + along) - place); }
  double share_of(int along) const {
    double total = 0.0;
    for (int i = 0; i < kLayers; ++i) total += weight_of(static_cast<double>(low + i) - place);
    return weight_of(static_cast<double>(low + along) - place) / total;
  }

  // The gains of this sample for the two ears; then everything moves on.
  void next(double* left, double* right) {
    const double turns = setting.offset / 360.0;
    double total = 0.0, sum_left = 0.0, sum_right = 0.0;
    for (int i = 0; i < kLayers; ++i) {
      const double x = static_cast<double>(low + i) - place;
      const double hz = setting.rate * std::exp2(x);
      double edge = setting.edge_ms * 0.001 * hz;
      if (edge > 0.25) edge = 0.25;
      const double w = weight_of(x);
      total += w;
      sum_left += w * open(phase[i], edge);
      sum_right += w * open(frac(phase[i] - turns), edge);
      phase[i] = frac(phase[i] + hz / sr);
    }
    const double floor = (1.0 - setting.depth) * (1.0 - setting.depth);
    *left = floor + (1.0 - floor) * sum_left / total;
    *right = floor + (1.0 - floor) * sum_right / total;

    ++count;
    place = (setting.direction == 0 ? 1.0 : -1.0) * static_cast<double>(count) / (setting.halving * sr);
    const int lowest = static_cast<int>(std::floor(place)) - kUnder;
    while (lowest > low) {
      for (int i = 0; i + 1 < kLayers; ++i) phase[i] = phase[i + 1];
      phase[kLayers - 1] = frac(2.0 * phase[kLayers - 2]);
      ++low;
    }
    while (lowest < low) {
      for (int i = kLayers - 1; i > 0; --i) phase[i] = phase[i - 1];
      phase[0] = 0.5 * phase[1];
      --low;
    }
  }

  Setting setting;
  double sr;
  double place = 0.0;
  double phase[kLayers];
  int low = -kUnder;
  long count = 0;
};

// --- measures ----------------------------------------------------------------------------------

static std::vector<float> dc(float seconds, float rate = kRate, float level = 1.0f) {
  return std::vector<float>(static_cast<size_t>(static_cast<double>(seconds) * rate + 0.5), level);
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b, size_t from = 0) {
  double worst = 0.0;
  const size_t n = std::min(a.size(), b.size());
  for (size_t i = from; i < n; ++i) {
    const double d = std::fabs(static_cast<double>(a[i]) - b[i]);
    if (!(d <= worst)) worst = d;  // a difference that is not a number counts
  }
  return worst;
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0) {
  return std::max(worst_difference(a.left, b.left, from), worst_difference(a.right, b.right, from));
}

// The largest third difference: what a click leaves and a smooth edge does
// not. A step of size s gives about s.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

// Where `x` crosses `level` going up, in samples, between the two samples.
static std::vector<double> rises(const std::vector<float>& x, double level) {
  std::vector<double> out;
  for (size_t i = 1; i < x.size(); ++i) {
    if (x[i - 1] < level && x[i] >= level) {
      const double fraction = (level - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
      out.push_back(static_cast<double>(i - 1) + fraction);
    }
  }
  return out;
}

// A render in blocks of `block` frames; 0 is a ragged mix of sizes.
static Stereo render_in(WindingDown& d, const std::vector<float>& left, const std::vector<float>& right, int block) {
  if (block > 0) return run(d, left, right, block);
  Stereo out;
  out.left.resize(left.size());
  out.right.resize(left.size());
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  size_t done = 0;
  int which = 0;
  while (done < left.size()) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), left.size() - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = left[done + i];
      d.in_right()[i] = right[done + i];
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

// The device against the law over `seconds` of a constant input: the largest
// difference of the gain in either ear.
static double against_law(const Setting& s, float seconds, float rate, int block = kBlock) {
  fresh(device, s, rate);
  const std::vector<float> one = dc(seconds, rate);
  const Stereo out = render_in(device, one, one, block);
  Model model(s, rate);
  double worst = 0.0;
  for (size_t i = 0; i < out.size(); ++i) {
    double left, right;
    model.next(&left, &right);
    worst = std::max(worst, std::fabs(out.left[i] - left));
    worst = std::max(worst, std::fabs(out.right[i] - right));
  }
  return worst;
}

// How suddenly an event is heard: the same passage with it and without it,
// on a constant input of 0.5 so that nothing hides in a zero crossing. The
// device is run to the moment, then two copies of it go on, one with the
// event. Sixteen moments 36 ms apart after each of the starts given (seconds
// into the device's life, rising: places in its halving and, by the sixteen,
// in its pulses).
struct Sudden {
  double ratio = -1.0;   // the largest difference in the first 8 samples as a share of the largest in 20 ms:
                         // the worst of the moments where the event came to a quarter of its largest; -1 if none
  double size = 0.0;     // the largest difference the event came to within 20 ms
  double early = 0.0;    // the largest difference within the first 8 samples
  double at_once = 0.0;  // the largest difference at the very first sample
};

template <typename Event>
static Sudden suddenness(const Setting& s, Event event, const std::vector<float>& starts) {
  Sudden result;
  std::vector<double> early_of, all_of;
  const std::vector<float> tail(960, 0.5f);
  fresh(device, s);
  size_t at = 0;
  for (float start : starts) {
    for (int moment = 0; moment < 16; ++moment) {
      const size_t before = static_cast<size_t>(start * kRate) + static_cast<size_t>(moment) * 1733;
      run(device, std::vector<float>(before - at, 0.5f));
      at = before;
      twin = device;
      spare = device;
      event(twin);
      const Stereo with = run(twin, tail);
      const Stereo without = run(spare, tail);
      double early = 0.0, all = 0.0;
      for (size_t i = 0; i < tail.size(); ++i) {
        const double d = std::max(std::fabs(static_cast<double>(with.left[i]) - without.left[i]),
                                  std::fabs(static_cast<double>(with.right[i]) - without.right[i]));
        all = std::max(all, d);
        if (i < 8) early = std::max(early, d);
        if (i == 0) result.at_once = std::max(result.at_once, d);
      }
      early_of.push_back(early);
      all_of.push_back(all);
      result.size = std::max(result.size, all);
      result.early = std::max(result.early, early);
    }
  }
  for (size_t n = 0; n < all_of.size(); ++n) {
    if (all_of[n] > 1.0e-5 && all_of[n] >= 0.25 * result.size) result.ratio = std::max(result.ratio, early_of[n] / all_of[n]);
  }
  return result;
}

// CPU time, not the clock on the wall: the machine is shared.
template <typename Work>
static void cpu_cost(const char* label, float seconds, Work work) {
  const std::clock_t start = std::clock();
  work();
  const double spent = static_cast<double>(std::clock() - start) / CLOCKS_PER_SEC;
  std::printf("%s: %.2f%% of real time by CPU time\n", label, 100.0 * spent / seconds);
}

int main() {
  Conformance spec;
  spec.name = "winding-down";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 0.5f;
  // One gain of at most one: nothing comes out higher than it went in (the
  // noise of the conformance pass peaks at 0.9).
  spec.max_peak = 0.9001f;
  check_effect(device, spec, kRate);

  const Setting defaults;

  // 1. The law. A constant goes in at Depth as set and what comes out is the
  // gain: it is the law's gain, sample for sample, in both ears, through
  // several halvings (each a wrap of the device's one phase), in both
  // directions, at every count of layers, and at 44.1, 48 and 96 kHz.
  {
    EXPECT(Model::kLayers == WindingDown::kSlots && Model::kUnder == WindingDown::kBelow,
           "six layers are kept, the lowest two to three octaves under the centre");
    struct Case {
      const char* name;
      Setting s;
      float seconds;
    };
    Case cases[7];
    cases[0] = {"defaults, two halvings", defaults, 45.0f};
    cases[1] = {"quicker", defaults, 45.0f};
    cases[1].s.direction = 1;
    cases[2] = {"five wraps, full depth", defaults, 22.0f};
    cases[2].s.halving = 4.0;
    cases[2].s.depth = 1.0;
    cases[3] = {"five layers at Rate 8, hard edge", defaults, 22.0f};
    cases[3].s = {0, 8.0, 4.0, 5, 1.0, 2.0, 0.0};
    cases[4] = {"two layers at Rate 1, soft edge", defaults, 26.0f};
    cases[4].s = {0, 1.0, 6.0, 2, 1.0, 50.0, 0.0};
    cases[5] = {"three layers, the ears a quarter apart", defaults, 22.0f};
    cases[5].s = {0, 3.0, 5.0, 3, 0.85, 15.0, 90.0};
    cases[6] = {"quicker, five layers, the ears taking turns", defaults, 22.0f};
    cases[6].s = {1, 2.0, 4.0, 5, 1.0, 30.0, 180.0};
    for (const Case& c : cases) {
      for (float rate : kRates) {
        const double worst = against_law(c.s, c.seconds, rate);
        char label[160];
        std::snprintf(label, sizeof label, "the gain is the law's (%s, %.1f kHz): worst %.2g", c.name,
                      rate / 1000.0, worst);
        MEASURED("%s", label);
        EXPECT(worst < 2.0e-5, label);
      }
    }
  }

  // 2. Slower, Halving 20 s. Just short of 20 s every layer has the rate and
  // the weight the layer one place down had at the start, and the layer that
  // was strongest has halved; just short of 40 s it has halved again. The
  // same is read off the sound: the strongest pulse at the start is at Rate,
  // and 20 s on that pulse is at half of it and half as strong.
  {
    Setting s = defaults;
    s.depth = 1.0;
    fresh(device, s);
    double rate0[WindingDown::kSlots], share0[WindingDown::kSlots];
    int strongest = 0;
    for (int k = 0; k < WindingDown::kSlots; ++k) {
      rate0[k] = device.layer_rate(k);
      share0[k] = device.layer_weight(k);
      if (share0[k] > share0[strongest]) strongest = k;
    }
    EXPECT(strongest == WindingDown::kBelow, "at the start the strongest layer is the one at the centre");
    EXPECT_NEAR(rate0[strongest], 4.0, 1.0e-4, "and it is at Rate");
    EXPECT_NEAR(share0[strongest], 0.5, 1.0e-4, "with half the weight, four layers");
    const size_t short_of = 64;  // samples: 1.3 ms before the phase wraps
    const size_t twenty = static_cast<size_t>(20.0f * kRate);
    Stereo heard = run(device, dc(1.0f, kRate, 1.0f));
    heard = concat(heard, run(device, std::vector<float>(twenty - short_of - heard.size(), 1.0f)));
    double worst_rate = 0.0, worst_share = 0.0;
    for (int k = 1; k < WindingDown::kSlots; ++k) {
      worst_rate = std::max(worst_rate, std::fabs(device.layer_rate(k) / rate0[k - 1] - 1.0));
      worst_share = std::max(worst_share, std::fabs(device.layer_weight(k) - share0[k - 1]));
    }
    MEASURED("at 20 s: rates within %.3g, shares within %.3g of the layer one place down at 0 s", worst_rate,
             worst_share);
    EXPECT(worst_rate < 0.01, "at 20 s every layer has the rate of the layer one place down at 0 s within 1 %");
    EXPECT(worst_share < 0.01, "at 20 s every layer has the weight of the layer one place down at 0 s within 1 %");
    EXPECT_NEAR(device.layer_rate(strongest), 2.0, 0.02, "the layer that was strongest has halved its rate at 20 s");
    EXPECT_NEAR(device.meter(0), 1.0, 1.0e-3, "and the place in the halving stands at its end");
    // One wrap on, the layer that began in place `strongest` is one place down.
    heard = concat(heard, run(device, std::vector<float>(twenty, 1.0f)));
    EXPECT_NEAR(device.layer_rate(strongest - 1), 1.0, 0.01, "and has halved again at 40 s");
    heard = concat(heard, run(device, std::vector<float>(static_cast<size_t>(1.5f * kRate) + short_of, 1.0f)));
    // Off the sound. The pulse's level is 2/π of its weight (a square wave's first partial).
    std::vector<float> wave = heard.left;
    const double mid = mean(wave);
    for (float& v : wave) v -= static_cast<float>(mid);
    const size_t half = static_cast<size_t>(1.5f * kRate);
    const double hz_start = dominant_frequency(wave, kRate, 3.0, 5.3, 0, 2 * half);
    const double level_start = tone_level(wave, hz_start, kRate, 0, 2 * half);
    const double hz_later = dominant_frequency(wave, kRate, 1.5, 2.7, twenty - half, twenty + half);
    const double level_later = tone_level(wave, hz_later, kRate, twenty - half, twenty + half);
    const double hz_last = dominant_frequency(wave, kRate, 3.0, 5.3, 2 * twenty - half, 2 * twenty + half);
    MEASURED("strongest pulse at 0..3 s: %.3f Hz, level %.3f; that layer at 18.5..21.5 s: %.3f Hz, level %.3f",
             hz_start, level_start, hz_later, level_later);
    // Over the first three seconds it has slid from 4 Hz to 3.6: 3.8 in the middle.
    EXPECT_NEAR(hz_start, 4.0 * std::exp2(-1.5 / 20.0), 0.08, "heard: the strongest pulse starts at Rate");
    EXPECT_NEAR(hz_later, 2.0, 0.04, "heard: 20 s on that pulse is at half of Rate");
    EXPECT_NEAR(level_later / level_start, 0.5, 0.08, "heard: and at half the strength, a place down the bell");
    EXPECT_NEAR(hz_last, 4.0, 0.08, "heard: 40 s on the strongest pulse is at Rate again, a layer two places up");
  }

  // 3. The level is the same in every cycle. A held tone, ten halvings, the
  // level over each whole one.
  {
    auto cycle_levels = [&](const Setting& s, int cycles, double* within) {
      fresh(device, s);
      std::vector<double> levels;
      const size_t per_cycle = static_cast<size_t>(s.halving * kRate);
      const size_t chunk = per_cycle / 8;
      double low = 1.0e9, high = -1.0e9;
      size_t at = 0;
      for (int c = 0; c < cycles; ++c) {
        double energy = 0.0;
        for (int part = 0; part < 8; ++part) {
          std::vector<float> in(chunk);
          for (size_t i = 0; i < chunk; ++i, ++at) {
            in[i] = 0.5f * static_cast<float>(std::sin(2.0 * kPi * 220.0 * static_cast<double>(at) / kRate));
          }
          const Stereo out = run(device, in);
          double sum = 0.0;
          for (float v : out.left) sum += static_cast<double>(v) * v;
          energy += sum;
          const double part_db = 10.0 * std::log10(sum / static_cast<double>(chunk));
          low = std::min(low, part_db);
          high = std::max(high, part_db);
        }
        levels.push_back(10.0 * std::log10(energy / static_cast<double>(8 * chunk)));
      }
      *within = high - low;
      return levels;
    };
    struct Case {
      const char* name;
      Setting s;
    };
    Case cases[4] = {{"defaults", defaults}, {"full depth", defaults}, {"two layers", defaults}, {"five layers", defaults}};
    cases[1].s.depth = 1.0;
    cases[2].s = {0, 4.0, 4.0, 2, 1.0, 15.0, 0.0};
    cases[3].s = {1, 4.0, 4.0, 5, 1.0, 15.0, 0.0};
    for (const Case& c : cases) {
      double within = 0.0;
      const std::vector<double> levels = cycle_levels(c.s, 10, &within);
      double low = levels[0], high = levels[0];
      for (double v : levels) {
        low = std::min(low, v);
        high = std::max(high, v);
      }
      char label[200];
      std::snprintf(label, sizeof label,
                    "the level over each of ten whole cycles is the same (%s): %.3f dB apart, %.2f dB under the "
                    "input (eighths of a cycle, which the slow pulses themselves move: %.2f dB apart)",
                    c.name, high - low, db(0.5 / std::sqrt(2.0)) - high, within);
      MEASURED("%s", label);
      EXPECT(high - low < 0.5, label);
    }
  }

  // 4. A layer's wrap is not heard. A 110 Hz drone at full depth: the
  // largest third difference within 10 ms of the sample where the place
  // wraps is no higher than anywhere else in the cycle, with soft edges
  // (where anything sudden stands far above the pulses' own) and hard ones.
  {
    double worst_ratio = 0.0;
    for (int direction = 0; direction < 2; ++direction) {
      for (double edge : {50.0, 15.0, 2.0}) {
        for (double rate : {1.0, 2.3, 4.0, 8.0}) {
          for (int layers : {4, 5}) {
            const Setting s = {direction, rate, 4.0, layers, 1.0, edge, 0.0};
            fresh(device, s);
            const Stereo out = run(device, sine(110.0f, 9.0f, kRate, 0.5f));
            const size_t near = static_cast<size_t>(0.01f * kRate);
            double at_wrap = 0.0, elsewhere = 0.0;
            size_t from = 0;
            for (size_t wrap : {static_cast<size_t>(4.0f * kRate), static_cast<size_t>(8.0f * kRate)}) {
              at_wrap = std::max(at_wrap, kink(out.left, wrap - near, wrap + near));
              elsewhere = std::max(elsewhere, kink(out.left, from, wrap - near));
              from = wrap + near;
            }
            elsewhere = std::max(elsewhere, kink(out.left, from));
            worst_ratio = std::max(worst_ratio, at_wrap / elsewhere);
            if (at_wrap > elsewhere) {
              char label[160];
              std::snprintf(label, sizeof label,
                            "a wrap is no rougher than the rest of the cycle (%s, Rate %.1f, %d layers, Edge %.0f): "
                            "%.3g at the wrap, %.3g elsewhere",
                            direction == 0 ? "slower" : "quicker", rate, layers, edge, at_wrap, elsewhere);
              EXPECT(false, label);
            }
          }
        }
      }
    }
    MEASURED("kink at a wrap against the rest of its cycle: %.3f at the worst of 48 settings", worst_ratio);
    EXPECT(worst_ratio > 0.0, "the drone was heard at the wraps");
  }

  // 5. Where the weight lies. At Rate 4 with four layers nothing above
  // 16 Hz has any; at Rate 8 with five layers the share is read through a
  // whole cycle and printed for the device's row in docs/devices.md.
  {
    auto share_above = [&](const Setting& s, double hz, double* worst, double* against_model) {
      fresh(device, s);
      Model model(s, kRate);
      const int places = 200;
      const size_t chunk = static_cast<size_t>(s.halving * kRate) / places;
      double total = 0.0;
      *worst = 0.0;
      *against_model = 0.0;
      for (int n = 0; n < places; ++n) {
        double share = 0.0, sum = 0.0;
        for (int k = 0; k < WindingDown::kSlots; ++k) {
          sum += device.layer_weight(k);
          if (device.layer_rate(k) > hz) share += device.layer_weight(k);
          *against_model = std::max(*against_model, std::fabs(device.layer_weight(k) - model.share_of(k)));
          *against_model = std::max(*against_model, std::fabs(device.layer_rate(k) / model.rate_of(k) - 1.0));
        }
        *against_model = std::max(*against_model, std::fabs(sum - 1.0));  // the weights add to one
        total += share;
        *worst = std::max(*worst, share);
        run(device, dc(static_cast<float>(chunk) / kRate));
        for (size_t i = 0; i < chunk; ++i) {
          double left, right;
          model.next(&left, &right);
        }
      }
      return total / places;
    };
    double worst = 0.0, apart = 0.0;
    const double four = share_above(defaults, 16.0, &worst, &apart);
    MEASURED("Rate 4, four layers: share above 16 Hz %.4f mean, %.4f worst; from the law by %.2g", four, worst, apart);
    EXPECT(worst < 0.05, "Rate 4, four layers: layers above 16 Hz carry under 5 % of the weight");
    EXPECT(apart < 1.0e-4, "the rates and weights the device reports are the law's");
    const Setting thick = {0, 8.0, 20.0, 5, 0.7, 15.0, 0.0};
    const double five = share_above(thick, 16.0, &worst, &apart);
    std::printf("winding-down: Rate 8, five layers: layers above 16 Hz carry %.1f %% of the weight (%.1f %% at the most)\n",
                100.0 * five, 100.0 * worst);
    EXPECT(five > 0.10 && five < 0.20, "Rate 8, five layers: about a seventh of the weight is above 16 Hz");
    EXPECT(apart < 1.0e-4, "the rates and weights the device reports are the law's, five layers");
  }

  // 6. Nothing arrives at once. Direction thrown, and every other control
  // thrown end to end both ways, at eight moments in each of five places of
  // the halving: under 0.15 of what it comes to within 20 ms is there in the
  // first 8 samples.
  {
    Setting base = defaults;
    base.halving = 4.0;
    base.depth = 0.9;
    const std::vector<float> starts = {0.31f, 1.3f, 2.7f, 3.95f, 5.1f};
    struct Throw {
      const char* name;
      int id;
      float value;
      Setting from;
      double least;    // what the event must come to within 20 ms to count as heard
      double hardest;  // for Rate and Edge, which the pulse gates carry: the shortest Edge in force, ms; else 0
    };
    Setting quicker = base, apart = base, shallow = base, hard = base, soft = base, two = base, five = base;
    quicker.direction = 1;
    apart.offset = 180.0;
    shallow.depth = 0.0;
    hard.edge_ms = 2.0;
    soft.edge_ms = 50.0;
    two.layers = 2;
    five.layers = 5;
    const Throw throws[14] = {
        {"Direction to Quicker", p::kDirection, 1.0f, base, 1.0e-5, 0.0},
        {"Direction to Slower", p::kDirection, 0.0f, quicker, 1.0e-5, 0.0},
        {"Rate to 1", p::kRate, 1.0f, base, 1.0e-3, 15.0},
        {"Rate to 8", p::kRate, 8.0f, base, 1.0e-3, 15.0},
        {"Halving to 120", p::kHalving, 120.0f, base, 1.0e-5, 0.0},
        {"Halving to 4", p::kHalving, 4.0f, {0, 4.0, 120.0, 4, 0.9, 15.0, 0.0}, 1.0e-5, 0.0},
        {"Layers to 2", p::kLayers, 2.0f, five, 1.0e-2, 0.0},
        {"Layers to 5", p::kLayers, 5.0f, two, 1.0e-2, 0.0},
        {"Depth to 0", p::kDepth, 0.0f, base, 1.0e-2, 0.0},
        {"Depth to 1", p::kDepth, 1.0f, shallow, 1.0e-2, 0.0},
        {"Edge to 2", p::kEdge, 2.0f, soft, 1.0e-3, 2.0},
        {"Edge to 50", p::kEdge, 50.0f, hard, 1.0e-3, 2.0},
        {"Offset to 180", p::kOffset, 180.0f, base, 1.0e-2, 0.0},
        {"Offset to 0", p::kOffset, 0.0f, apart, 1.0e-2, 0.0},
    };
    for (const Throw& t : throws) {
      const Sudden heard = suddenness(t.from, [&](WindingDown& d) { d.set_param(t.id, t.value); }, starts);
      char label[200];
      std::snprintf(label, sizeof label,
                    "%s arrives gradually: %.3f of it in the first 8 samples (it comes to %.3g; %.2g at the first "
                    "sample, %.2g within 8)",
                    t.name, heard.ratio, heard.size, heard.at_once, heard.early);
      MEASURED("%s", label);
      if (t.hardest > 0.0) {
        // Rate and Edge are carried by the gates, which move no faster than
        // a quarter over the steepest part of an edge (π/2 over the edge, a
        // sample). With and without the event the two can part by an edge of
        // each, 2.25 of that slope a sample, on an input of 0.5; half as much
        // again is allowed for the fast layers, whose edge is a quarter of
        // their period. A jump would be all of it at the first sample: 0.02
        // to 0.1 at these moments with the gates taken out.
        const double slope = 0.5 * kPi / (0.001 * t.hardest * kRate);
        const double bound = 1.5 * 2.25 * slope * 0.5;
        EXPECT(heard.at_once < bound && heard.early < 8.0 * bound, label);
      } else {
        EXPECT(heard.ratio >= 0.0 && heard.ratio < 0.15, label);
      }
      std::snprintf(label, sizeof label, "%s is heard (%.3g within 20 ms)", t.name, heard.size);
      EXPECT(heard.size > t.least, label);
    }
  }

  // 7. It only turns down. From twenty starts through the cycle, loud noise
  // and a low drone: no sample comes out larger than it went in, so no peak
  // passes the input's. And the same while every control is thrown about.
  {
    const Setting hard = {0, 8.0, 4.0, 5, 1.0, 2.0, 180.0};
    const Setting quick = {1, 2.0, 4.0, 3, 0.7, 50.0, 60.0};
    Setting four = defaults;
    four.halving = 4.0;
    const Setting* settings[3] = {&four, &hard, &quick};
    size_t over = 0;
    double least_drop = 1.0e9, most_drop = 0.0;
    rng_state() = 0x51A7u;
    for (const Setting* s : settings) {
      fresh(device, *s);
      for (int start = 0; start < 20; ++start) {
        run(device, dc(0.2137f, kRate, 0.3f));  // a fifth of a second on: twenty places in 4.3 s
        for (int which = 0; which < 2; ++which) {
          const std::vector<float> in = which == 0 ? noise(0.25f, kRate, 0.9f) : sine(110.0f, 0.25f, kRate, 0.9f);
          const Stereo out = run(device, in);
          for (size_t i = 0; i < in.size(); ++i) {
            over += std::fabs(out.left[i]) > std::fabs(in[i]);
            over += std::fabs(out.right[i]) > std::fabs(in[i]);
          }
          const double drop = db(peak(in) / std::max(peak(out.left), peak(out.right)));
          least_drop = std::min(least_drop, drop);
          most_drop = std::max(most_drop, drop);
        }
      }
    }
    MEASURED("peaks from twenty starts, three settings: %.2f to %.2f dB under the input's", least_drop, most_drop);
    EXPECT(over == 0, "no sample comes out larger than it went in, from twenty starts in the cycle");
    EXPECT(least_drop >= 0.0, "no peak passes the input's, from twenty starts in the cycle");

    // Every control thrown to a new place every 3 ms for ten seconds.
    fresh(device, defaults);
    rng_state() = 0x7E57u;
    over = 0;
    bool bounded = true;
    for (int n = 0; n < 3300; ++n) {
      const int id = n % p::kNumParams;
      const float where = 0.5f + 0.5f * white();
      device.set_param(id, p::kParamMin[id] + where * (p::kParamMax[id] - p::kParamMin[id]));
      const std::vector<float> in = noise(0.003f, kRate, 0.9f);
      const Stereo out = run(device, in);
      for (size_t i = 0; i < in.size(); ++i) {
        over += std::fabs(out.left[i]) > std::fabs(in[i]);
        over += std::fabs(out.right[i]) > std::fabs(in[i]);
      }
      bounded = bounded && finite(out.left) && finite(out.right);
    }
    EXPECT(over == 0 && bounded, "no sample comes out larger than it went in while every control is thrown about");
  }

  // 8. Depth. At 0 the output is the input to the bit. Otherwise the gap,
  // where every layer is off, is at (1 - Depth)² and the top is at 1; at 1
  // the gap is exact silence.
  {
    fresh(device, defaults);
    device.set_param(p::kDepth, 0.0f);
    rng_state() = 0xD0u;
    const std::vector<float> in = noise(2.0f, kRate, 0.7f);
    const Stereo same = run(device, in);
    EXPECT(same.left == in && same.right == in, "Depth 0: the output is the input, sample for sample");
    for (double depth : {0.25, 0.5, 0.7, 0.9, 1.0}) {
      const Setting s = {0, 2.0, 120.0, 2, depth, 2.0, 0.0};
      fresh(device, s);
      const Stereo out = run(device, dc(2.0f));
      double low = 1.0, high = 0.0;
      for (float v : out.left) {
        low = std::min(low, static_cast<double>(v));
        high = std::max(high, static_cast<double>(v));
      }
      char label[120];
      std::snprintf(label, sizeof label, "Depth %.2f: the gap is at (1 - Depth) squared (got %.6f)", depth, low);
      EXPECT_NEAR(low, (1.0 - depth) * (1.0 - depth), 1.0e-6, label);
      std::snprintf(label, sizeof label, "Depth %.2f: the top is at 1 and not over (got %.7f)", depth, high);
      EXPECT(high <= 1.0 && high > 0.999999, label);
      if (depth == 1.0) EXPECT(low == 0.0, "Depth 1: the gap is exact silence");
    }
  }

  // 9. Offset. At 0 the ears are one. At 90 the right ear's pulses come a
  // quarter of a period after the left's. At 180 the ears take turns, each
  // pulsing in full, and their sum does not pulse at all.
  {
    Setting s = defaults;
    s.depth = 1.0;
    fresh(device, s);
    Stereo out = run(device, dc(10.0f));
    EXPECT(out.left == out.right, "Offset 0: the two ears are the same to the sample");
    auto swing = [](const std::vector<float>& x, size_t from) {
      double low = 1.0e9, high = -1.0e9;
      for (size_t i = from; i < x.size(); ++i) {
        low = std::min(low, static_cast<double>(x[i]));
        high = std::max(high, static_cast<double>(x[i]));
      }
      return high - low;
    };
    std::vector<float> fold(out.size());
    for (size_t i = 0; i < fold.size(); ++i) fold[i] = 0.5f * (out.left[i] + out.right[i]);
    EXPECT(swing(fold, 0) > 0.9, "Offset 0: the mono fold pulses in full");

    for (const Setting& turns : {Setting{0, 4.0, 20.0, 4, 1.0, 15.0, 180.0}, Setting{1, 8.0, 4.0, 5, 1.0, 50.0, 180.0},
                                 Setting{0, 1.0, 4.0, 2, 1.0, 2.0, 180.0}}) {
      fresh(device, turns);
      out = run(device, dc(10.0f));
      for (size_t i = 0; i < fold.size(); ++i) fold[i] = 0.5f * (out.left[i] + out.right[i]);
      // The right ear's first half pulse is under way when the device starts:
      // it is put where it stands, so the sum holds from the first sample.
      const double left = swing(out.left, 0), right = swing(out.right, 0), both = swing(fold, 0);
      char label[160];
      std::snprintf(label, sizeof label,
                    "Offset 180 (Rate %.0f, %d layers): each ear swings %.3f and %.3f, their sum %.2g (%.4f dB)",
                    turns.rate, turns.layers, left, right, both, db((0.5 + 0.5 * both) / (0.5 - 0.5 * both)));
      MEASURED("%s", label);
      // With hard edges every layer is on at once somewhere, and off at once.
      // With soft ones on fast layers the tops never quite meet.
      EXPECT(left > (turns.edge_ms < 20.0 ? 0.9 : 0.5) && right > (turns.edge_ms < 20.0 ? 0.9 : 0.5),
             "Offset 180: each ear pulses");
      EXPECT(both < 2.0e-3, label);
      EXPECT_NEAR(mean(fold), 0.5, 1.0e-3, "Offset 180, Depth 1: the mono fold sits at half, 6 dB under the input");
    }

    const Setting quarter = {0, 2.0, 120.0, 2, 1.0, 2.0, 90.0};
    fresh(device, quarter);
    out = run(device, dc(6.0f));
    const std::vector<double> left = rises(out.left, 0.5), right = rises(out.right, 0.5);
    double worst = 0.0;
    size_t pairs = 0;
    for (size_t n = 0; n + 1 < left.size(); ++n) {
      // The right ear's rise that follows this one of the left's.
      for (double r : right) {
        if (r > left[n] && r < left[n + 1]) {
          worst = std::max(worst, std::fabs((r - left[n]) / (left[n + 1] - left[n]) - 0.25));
          ++pairs;
        }
      }
    }
    MEASURED("Offset 90: the right ear's rises are a quarter of a period late within %.4f of a period (%zu pulses)",
             worst, pairs);
    EXPECT(pairs >= 8 && worst < 0.003, "Offset 90: the right ear's pulses come a quarter of a period after the left's");
  }

  // 10. Edge, and the rate, at 44.1, 48 and 96 kHz. One layer near its
  // centre (two layers, at the start of a long halving): the pulse rises
  // from the first sample, from a tenth to nine tenths in 0.59 of Edge, and
  // each rise comes where the closed form of the glide puts it.
  {
    const double ln2 = std::log(2.0);
    for (float rate : kRates) {
      for (double edge : {2.0, 15.0, 50.0}) {
        const Setting s = {0, 1.0, 120.0, 2, 1.0, edge, 0.0};
        fresh(device, s, rate);
        const Stereo out = run(device, dc(1.2f, rate));
        const std::vector<double> tenth = rises(out.left, 0.1), most = rises(out.left, 0.9);
        const double rise_ms = tenth.empty() || most.empty() ? -1.0 : 1000.0 * (most[0] - tenth[0]) / rate;
        const double expected = edge * (1.0 - 2.0 * std::acos(0.8) / kPi);
        char label[160];
        std::snprintf(label, sizeof label, "Edge %.0f ms at %.1f kHz: a tenth to nine tenths in %.3f ms (%.3f by the law)",
                      edge, rate / 1000.0, rise_ms, expected);
        MEASURED("%s", label);
        EXPECT(std::fabs(rise_ms - expected) < 0.02 * expected + 2000.0 / rate, label);
      }
      for (double hz : {1.0, 4.0, 8.0}) {
        const double halving = 30.0;
        const Setting s = {0, hz, halving, 2, 1.0, 5.0, 0.0};
        fresh(device, s, rate);
        const Stereo out = run(device, dc(4.0f, rate));
        const std::vector<double> up = rises(out.left, 0.5);
        double worst_ms = 0.0;
        // Rise n begins where the layer's phase reaches n: Rate·H/ln2·(1 - 2^(-t/H)) = n;
        // it is half way up half an Edge later.
        for (size_t n = 0; n < up.size(); ++n) {
          const double begins = -halving * std::log2(1.0 - static_cast<double>(n) * ln2 / (hz * halving));
          worst_ms = std::max(worst_ms, std::fabs(1000.0 * up[n] / rate - 1000.0 * begins - 2.5));
        }
        char label[160];
        std::snprintf(label, sizeof label, "Rate %.0f at %.1f kHz: %zu rises in 4 s, each within %.4f ms of the closed form",
                      hz, rate / 1000.0, up.size(), worst_ms);
        MEASURED("%s", label);
        const size_t expected = static_cast<size_t>(hz * halving / ln2 * (1.0 - std::exp2(-4.0 / halving)) + 1.0);
        EXPECT(up.size() == expected, label);
        EXPECT(worst_ms < 0.1, label);
      }
    }
    // The level of a held tone over the first halving, the same at each rate.
    double level[3];
    for (int r = 0; r < 3; ++r) {
      Setting s = defaults;
      s.halving = 4.0;
      fresh(device, s, kRates[r]);
      const Stereo out = run(device, sine(220.0f, 4.0f, kRates[r], 0.5f));
      level[r] = db(rms(out.left));
    }
    MEASURED("a held tone through one halving: %.3f, %.3f and %.3f dBFS at 44.1, 48 and 96 kHz", level[0], level[1],
             level[2]);
    EXPECT(std::fabs(level[0] - level[1]) < 0.05 && std::fabs(level[2] - level[1]) < 0.05,
           "the level is the same at 44.1, 48 and 96 kHz");
  }

  // 11. Silence in is silence out, at once, and the clock goes on. Asleep,
  // the place in the halving is where the time says.
  {
    fresh(device, defaults);
    run(device, sine(220.0f, 0.5f, kRate, 0.5f));
    const Stereo rest = render(device, 9.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "silence in gives exact silence, from its first sample");
    EXPECT_NEAR(device.meter(0), 0.5, 1.0e-5, "ten seconds on, half of them asleep, the place is half way through a halving of 20 s");
    const Stereo woken = run(device, sine(220.0f, 0.5f, kRate, 0.5f));
    EXPECT(peak(woken.left) > 0.2, "and the sound is back when the input is");
    fresh(device, defaults);
    device.set_param(p::kDirection, 1.0f);
    render(device, 5.0f, kRate);
    EXPECT_NEAR(device.meter(0), 0.75, 1.0e-5, "quickening, the place runs the other way");
  }

  // 12. Across a silence the output does not depend on the block size.
  // A note, a silence, a second note, with every control moved 5 ms before
  // the silence ends; the silence stepped by 20 ms across the 143 ms it takes
  // to fall asleep and well past, and one of half a minute. Blocks of 1, of
  // 2048 and a ragged mix, each against blocks of 128. Before the first
  // note the device is put off the beat of anything it counts in blocks.
  {
    Setting base = defaults;
    base.halving = 6.0;
    base.depth = 0.9;
    std::vector<float> gaps;
    for (int n = 1; n <= 15; ++n) gaps.push_back(0.02f * static_cast<float>(n));
    gaps.push_back(1.3f);
    gaps.push_back(30.0f);
    const int blocks[4] = {128, 1, 2048, 0};
    const std::vector<float> first = sine(220.0f, 0.3f, kRate, 0.5f);
    const std::vector<float> second = sine(330.0f, 1.2f, kRate, 0.5f);
    const size_t late = static_cast<size_t>(0.005f * kRate);
    double worst_block = 0.0, worst_knob = 0.0, worst_glide = 0.0, worst_clock = 0.0;
    for (float gap : gaps) {
      const std::vector<float> rest = silence(gap, kRate);
      const std::vector<float> rest_a(rest.size() - late, 0.0f), rest_b(late, 0.0f);
      Stereo reference;
      for (int block : blocks) {
        // Every control, the ones that turn the clock among them.
        fresh(device, base);
        device.in_left()[0] = device.in_right()[0] = 0.25f;
        device.process(13);
        Stereo all = render_in(device, first, first, block);
        all = concat(all, render_in(device, rest_a, rest_a, block));
        device.set_param(p::kDirection, 1.0f);
        device.set_param(p::kRate, 6.5f);
        device.set_param(p::kHalving, 4.5f);
        device.set_param(p::kLayers, 3.0f);
        device.set_param(p::kDepth, 0.6f);
        device.set_param(p::kEdge, 40.0f);
        device.set_param(p::kOffset, 120.0f);
        all = concat(all, render_in(device, rest_b, rest_b, block));
        all = concat(all, render_in(device, second, second, block));
        if (block == 128) {
          reference = all;
        } else {
          worst_block = std::max(worst_block, worst_difference(all, reference));
        }
      }

      // The controls that do not turn the clock (Layers, Depth, Edge and
      // Offset), moved in the silence: the second note is the note of a
      // device that had them there from its init, to the sample once the
      // silence is long enough to count as new sound (0.1 s), and after a
      // shorter one as soon as they have glided in.
      fresh(device, base);
      device.in_left()[0] = device.in_right()[0] = 0.25f;
      device.process(13);
      run(device, first);
      run(device, rest_a);
      device.set_param(p::kLayers, 3.0f);
      device.set_param(p::kDepth, 0.6f);
      device.set_param(p::kEdge, 40.0f);
      device.set_param(p::kOffset, 120.0f);
      run(device, rest_b);
      const Stereo moved = run(device, second);
      Setting there = base;
      there.layers = 3;
      there.depth = 0.6;
      there.edge_ms = 40.0;
      there.offset = 120.0;
      fresh(twin, there);
      twin.in_left()[0] = twin.in_right()[0] = 0.25f;
      twin.process(13);
      run(twin, first);
      run(twin, rest);
      const Stereo set = run(twin, second);
      if (gap >= 0.1f) {
        worst_knob = std::max(worst_knob, worst_difference(moved, set));
      } else {
        // Layers is the slowest to glide in: 30 ms, there to the bit 0.5 s on.
        worst_glide = std::max(worst_glide, worst_difference(moved, set, static_cast<size_t>(0.6f * kRate)));
      }

      // The controls that turn the clock (Direction, Rate, Halving), moved
      // in the silence: the second note is the note of a device that never
      // rested, because a constant kept it awake through the gap, with the
      // same controls moved at the same sample. Its gates are still closing
      // on the pulses as the note begins; an edge on, the two are one.
      fresh(device, base);
      fresh(twin, base);
      WindingDown* both[2] = {&device, &twin};
      Stereo note[2];
      for (int which = 0; which < 2; ++which) {
        WindingDown& d = *both[which];
        d.in_left()[0] = d.in_right()[0] = 0.25f;
        d.process(13);
        run(d, first);
        run(d, which == 0 ? rest_a : std::vector<float>(rest_a.size(), 0.25f));
        d.set_param(p::kDirection, 1.0f);
        d.set_param(p::kRate, 6.5f);
        d.set_param(p::kHalving, 4.5f);
        run(d, which == 0 ? rest_b : std::vector<float>(rest_b.size(), 0.25f));
        note[which] = run(d, second);
      }
      worst_clock = std::max(worst_clock, worst_difference(note[0], note[1], static_cast<size_t>(0.1f * kRate)));
    }
    char label[200];
    std::snprintf(label, sizeof label, "across %zu silences the output does not depend on the block size (worst %g)",
                  gaps.size(), worst_block);
    MEASURED("%s", label);
    EXPECT(worst_block < 1.0e-6, label);
    std::snprintf(label, sizeof label,
                  "a control moved in a silence is there when sound comes back, as on a device set so from its init "
                  "(worst %g)",
                  worst_knob);
    MEASURED("%s", label);
    EXPECT(worst_knob < 1.0e-6, label);
    std::snprintf(label, sizeof label, "after a gap too short to count, once the controls have glided in (worst %g)",
                  worst_glide);
    MEASURED("%s", label);
    EXPECT(worst_glide < 1.0e-6, label);
    std::snprintf(label, sizeof label,
                  "after a silence the pulses are where a device that never rested has them (worst %g)", worst_clock);
    MEASURED("%s", label);
    EXPECT(worst_clock < 1.0e-6, label);
  }

  // 13. Bad input. Not a number comes out as silence, the infinite and the
  // absurd are held to kBound, in the same block; and afterwards the device
  // is where one that never heard them is, to the sample.
  {
    rng_state() = 0xBADu;
    const std::vector<float> good = noise(0.5f, kRate, 0.5f);
    const float bads[5] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f};
    for (float bad : bads) {
      for (int side = 0; side < 2; ++side) {
        Setting s = defaults;
        s.offset = 90.0;
        fresh(device, s);
        fresh(twin, s);
        run(device, good);
        run(twin, good);
        const std::vector<float> spoiled(4800, bad), fine(4800, 0.25f);
        const Stereo during = side == 0 ? run(device, spoiled, spoiled) : run(device, spoiled, fine);
        const Stereo meanwhile = run(twin, fine);
        const Stereo a = run(device, good);
        const Stereo b = run(twin, good);
        char label[160];
        std::snprintf(label, sizeof label, "%g at the input: the output is finite and held to %g in that same block", bad,
                      static_cast<double>(WindingDown::kBound));
        EXPECT(finite(during.left) && finite(during.right) && peak(during.left) <= WindingDown::kBound &&
                   peak(during.right) <= WindingDown::kBound,
               label);
        if (bad != bad) EXPECT(peak(during.left) == 0.0, "not a number at the input comes out as silence");
        if (side == 1) EXPECT(during.right == meanwhile.right, "and the other side passes as if nothing had happened");
        std::snprintf(label, sizeof label, "after %g at the input the device is where it would have been", bad);
        EXPECT(a.left == b.left && a.right == b.right, label);
        EXPECT(rms(a.left) > 0.05, "and it still sounds");
      }
    }
  }

  // 14. A second init is the first: after a life of thrown controls, a
  // silence and a rest, init gives the render of a device never used.
  {
    fresh(device, defaults);
    rng_state() = 0x1A57u;
    for (int n = 0; n < 400; ++n) {
      const int id = n % p::kNumParams;
      device.set_param(id, p::kParamMin[id] + (0.5f + 0.5f * white()) * (p::kParamMax[id] - p::kParamMin[id]));
      run(device, noise(0.01f, kRate, 0.5f));
    }
    render(device, 3.0f, kRate);
    rng_state() = 0x5EEDu;
    const std::vector<float> probe = noise(3.0f, kRate, 0.5f);
    device.init(kRate);
    const Stereo used = run(device, probe);
    twin = WindingDown();
    twin.init(kRate);
    const Stereo unused = run(twin, probe);
    EXPECT(used.left == unused.left && used.right == unused.right, "a second init equals the first, bit for bit");
    EXPECT(used.left != probe, "and the probe was pulsed");
  }

  // 14b. Layers is a count and Direction a choice: a value between two is
  // the nearer one, to the bit.
  {
    auto heard = [&](int id, float value) {
      fresh(device, defaults);
      device.set_param(p::kHalving, 4.0f);
      device.set_param(id, value);
      return run(device, dc(6.0f));
    };
    const Stereo three = heard(p::kLayers, 3.0f), four = heard(p::kLayers, 4.0f);
    const Stereo under = heard(p::kLayers, 3.4f), over = heard(p::kLayers, 3.6f);
    EXPECT(under.left == three.left && over.left == four.left && three.left != four.left,
           "Layers between two whole numbers is the nearer one");
    const Stereo slower = heard(p::kDirection, 0.0f), quicker = heard(p::kDirection, 1.0f);
    const Stereo low = heard(p::kDirection, 0.4f), high = heard(p::kDirection, 0.6f);
    EXPECT(low.left == slower.left && high.left == quicker.left && slower.left != quicker.left,
           "Direction between its two choices is the nearer one");
  }

  // 15. Level and cost. There is no make-up: the device sits under its
  // input by what the pulses take away.
  {
    rng_state() = 0x1E7Eu;
    const std::vector<float> in = noise(20.0f, kRate, 0.25f);
    fresh(device, defaults);
    Stereo out = run(device, in);
    const double at_default = db(rms(out.left) / rms(in));
    Setting full = defaults;
    full.depth = 1.0;
    fresh(device, full);
    out = run(device, in);
    const double at_full = db(rms(out.left) / rms(in));
    std::printf("winding-down: noise through one halving comes out %.2f dB under at the defaults, %.2f dB under at Depth 1\n",
                -at_default, -at_full);
    EXPECT(at_default < -3.5 && at_default > -5.0, "at the defaults the sound is 3.5 to 5 dB under its input, never over");
    EXPECT(at_full < -3.5 && at_full > -6.5, "at Depth 1 it is 3.5 to 6.5 dB under");
  }

  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(20.0f, kRate, 0.25f);
  fresh(device, defaults);
  report_cost("winding-down (defaults)", 20.0f, kRate, [&] { run(device, input); });
  const Setting most = {1, 8.0, 4.0, 5, 1.0, 50.0, 90.0};
  fresh(device, most);
  report_cost("winding-down (five layers, Rate 8, the ears apart)", 20.0f, kRate, [&] { run(device, input); });
  fresh(device, defaults);
  cpu_cost("winding-down (defaults)", 20.0f, [&] { run(device, input); });
  fresh(device, most);
  cpu_cost("winding-down (five layers, Rate 8, the ears apart)", 20.0f, [&] { run(device, input); });
  fresh(device, defaults);
  run(device, noise(0.1f, kRate, 0.25f));
  render(device, 1.0f, kRate);
  cpu_cost("winding-down (asleep)", 60.0f, [&] { render(device, 60.0f, kRate); });

  return finish("winding-down");
}
