// Native harness for Falling (cpp/devices/falling). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a cloud of grains that bend.

#include "../devices/falling/falling.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Falling;
namespace p = livemix::falling;

static Falling device;
static Falling other;

static const float kRate = 48000.0f;

// The readings the device reports for its display (device.json "meters").
enum Reading { kClock = 0, kLevel, kGrains, kNewStart, kNewFall, kNewLength, kNewBehind };

// The plainest cloud: single grains with space between them, each taken from
// what was just played, all alike, soft bells in the centre, wet only.
static void clean(Falling& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kFall, -12.0f);
  d.set_param(p::kCurve, 0.0f);
  d.set_param(p::kSize, 800.0f);
  d.set_param(p::kDensity, 0.3f);
  d.set_param(p::kScatter, 0.0f);
  d.set_param(p::kVary, 0.0f);
  d.set_param(p::kShape, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kAgain, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kMix, 1.0f);
}

// A dense cloud of the same.
static void dense(Falling& d) {
  clean(d);
  d.set_param(p::kSize, 400.0f);
  d.set_param(p::kDensity, 20.0f);
  d.set_param(p::kScatter, 0.3f);
}

struct Marked {
  Stereo out;
  std::vector<size_t> starts;    // the sample each grain started on
  std::vector<float> falls;      // its own fall, in semitones
  std::vector<float> lengths;    // its length, in seconds
  std::vector<float> behinds;    // how far behind the head it started, in seconds
};

// Run sample by sample and note every grain the device says it started.
static Marked run_marked(Falling& d, const std::vector<float>& input) {
  Marked m;
  m.out.left.resize(input.size());
  m.out.right.resize(input.size());
  float count = d.meter(kGrains);
  for (size_t i = 0; i < input.size(); ++i) {
    d.in_left()[0] = input[i];
    d.in_right()[0] = input[i];
    d.process(1);
    m.out.left[i] = d.out_left()[0];
    m.out.right[i] = d.out_right()[0];
    const float now = d.meter(kGrains);
    if (now != count) {
      count = now;
      m.starts.push_back(i);
      m.falls.push_back(d.meter(kNewFall));
      m.lengths.push_back(d.meter(kNewLength));
      m.behinds.push_back(d.meter(kNewBehind));
    }
  }
  return m;
}

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

// Frequency from the upward zero crossings in [from, to).
static double crossing_frequency(const std::vector<float>& x, size_t from, size_t to, double rate = kRate) {
  double first = -1.0, last = -1.0;
  int count = 0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double at = static_cast<double>(i - 1) + x[i - 1] / (static_cast<double>(x[i - 1]) - x[i]);
      if (first < 0.0) first = at;
      last = at;
      ++count;
    }
  }
  return count > 1 ? (count - 1) * rate / (last - first) : 0.0;
}

// The mean speed of a grain between two phases of its life, by the device's
// own bend: 2^(fall / 12 × bend(phase)).
static double mean_speed(float fall, float curve, double from, double to) {
  double sum = 0.0;
  const int steps = 400;
  for (int i = 0; i < steps; ++i) {
    const double phase = from + (to - from) * (i + 0.5) / steps;
    sum += std::pow(2.0, fall / 12.0 * Falling::bend(static_cast<float>(phase), curve));
  }
  return sum / steps;
}

// Power near `hz`, summed over ±`span`: grains are not phase-locked to each
// other, so a partial's energy is spread over a few hertz.
static double band_power(const std::vector<float>& x, double hz, double span, size_t from, size_t to,
                         double step = 1.0) {
  double sum = 0.0;
  for (double offset = -span; offset <= span; offset += step) {
    const double level = tone_level(x, hz + offset, kRate, from, to);
    sum += level * level;
  }
  return sum;
}

// The largest difference between two renders.
static double apart(const Stereo& a, const Stereo& b, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

static Stereo run_ragged(Falling& d, const std::vector<float>& input) {
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  Stereo out;
  out.left.resize(input.size());
  out.right.resize(input.size());
  size_t done = 0;
  int which = 0;
  while (done < input.size()) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), input.size() - done));
    for (int i = 0; i < frames; ++i) d.in_left()[i] = d.in_right()[i] = input[done + i];
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

int main() {
  Conformance spec;
  spec.name = "falling";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // A grain starts at the pitch it was caught at and glides to 2^(fall / 12)
  // of it over Size: the frequency of single grains of a held tone, window by
  // window, against the device's own bend. Down an octave, up a fifth.
  {
    const double tone = 2000.0;
    const float settings[2] = {-12.0f, 7.0f};
    const double windows[5][2] = {{0.02, 0.08}, {0.2, 0.3}, {0.45, 0.55}, {0.7, 0.8}, {0.92, 0.98}};
    for (float fall : settings) {
      clean(device);
      device.set_param(p::kFall, fall);
      Marked m = run_marked(device, sine(static_cast<float>(tone), 30.0f, kRate, 0.5f));
      const size_t length = static_cast<size_t>(0.8f * kRate);
      int judged = 0;
      double first = 0.0, last = 0.0;
      for (size_t g = 0; g < m.starts.size(); ++g) {
        const size_t at = m.starts[g];
        if (at + length > m.out.size()) continue;
        ++judged;
        for (const auto& window : windows) {
          const size_t from = at + static_cast<size_t>(window[0] * length);
          const size_t to = at + static_cast<size_t>(window[1] * length);
          const double found = crossing_frequency(m.out.left, from, to);
          const double expected = tone * mean_speed(fall, 0.0f, window[0], window[1]);
          EXPECT_NEAR(found, expected, expected * 0.01, "Fall: a grain's pitch follows the bend from start to end");
        }
        first += crossing_frequency(m.out.left, at + length / 50, at + length / 12);
        last += crossing_frequency(m.out.left, at + length * 92 / 100, at + length * 98 / 100);
        // After its length the grain is over (what is left is the filters settling).
        EXPECT(rms(m.out.left, at + length * 9 / 20, at + length * 11 / 20) > 0.2, "Size: a grain sounds in its middle");
        EXPECT(peak(m.out.left, at + length + 2, at + length + 4800) < 1.0e-4, "Size: a grain ends after its length");
      }
      EXPECT(judged >= 5, "Fall: enough single grains to judge");
      if (judged > 0) {
        first /= judged;
        last /= judged;
        const double landing = tone * std::pow(2.0, fall / 12.0);
        std::printf("falling: Fall %+.0f st on %.0f Hz: grains start at %.1f Hz and end at %.1f Hz (landing %.1f)\n",
                    fall, tone, first, last, landing);
        EXPECT_NEAR(first, tone, tone * 0.04, "Fall: a grain starts at the pitch it was caught at");
        EXPECT_NEAR(last, landing, landing * 0.04, "Fall: a grain ends 2^(fall/12) from where it started");
      }
    }
  }

  // Fall 0 is a plain grain: the input's frequency from end to end, under a
  // bell that peaks at the input's level in the middle.
  {
    clean(device);
    device.set_param(p::kFall, 0.0f);
    Marked m = run_marked(device, sine(1000.0f, 20.0f, kRate, 0.5f));
    const size_t length = static_cast<size_t>(0.8f * kRate);
    int judged = 0;
    for (size_t at : m.starts) {
      if (at + length > m.out.size()) continue;
      ++judged;
      for (int k = 0; k < 9; ++k) {
        const size_t from = at + length * (k + 1) / 11;
        const double found = crossing_frequency(m.out.left, from, from + length / 11);
        EXPECT_NEAR(found, 1000.0, 1.0, "Fall 0: the grain stays at the input's pitch");
      }
      for (double phase : {0.25, 0.5, 0.75}) {
        const size_t middle = at + static_cast<size_t>(phase * length);
        const double level = rms(m.out.left, middle - 240, middle + 240) * std::sqrt(2.0);
        const double expected = 0.5 * Falling::window(static_cast<float>(phase), 0.5f);
        EXPECT_NEAR(level, expected, 0.01, "Fall 0: the grain is the input under its window");
      }
    }
    EXPECT(judged >= 3, "Fall 0: enough single grains to judge");
  }

  // Curve chooses where in the grain the bend happens: the pitch half way
  // through, for a grain that drops at once, slides straight and lets go late.
  {
    const double tone = 2000.0;
    double middle[3] = {0.0, 0.0, 0.0};
    const float curves[3] = {-1.0f, 0.0f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      clean(device);
      device.set_param(p::kCurve, curves[k]);
      Marked m = run_marked(device, sine(static_cast<float>(tone), 20.0f, kRate, 0.5f));
      const size_t length = static_cast<size_t>(0.8f * kRate);
      int judged = 0;
      for (size_t at : m.starts) {
        if (at + length > m.out.size()) continue;
        ++judged;
        middle[k] += crossing_frequency(m.out.left, at + length * 45 / 100, at + length * 55 / 100);
      }
      EXPECT(judged >= 3, "Curve: enough single grains to judge");
      middle[k] /= std::max(1, judged);
      const double expected = tone * mean_speed(-12.0f, curves[k], 0.45, 0.55);
      EXPECT_NEAR(middle[k], expected, expected * 0.01, "Curve: the pitch half way through a grain");
    }
    std::printf("falling: an octave down from %.0f Hz, half way: Curve -1 %.0f Hz, 0 %.0f Hz, +1 %.0f Hz\n", tone,
                middle[0], middle[1], middle[2]);
    EXPECT(middle[0] < 1100.0, "Curve -1: the grain has all but landed by half way");
    EXPECT(middle[2] > 1880.0, "Curve +1: the grain has hardly let go by half way");
  }

  // Density is how many grains start each second, up to sixteen at once.
  {
    const float settings[3][2] = {{2.0f, 300.0f}, {10.0f, 200.0f}, {40.0f, 3000.0f}};
    const double expected[3] = {2.0, 10.0, 16.0 / 3.0};
    for (int k = 0; k < 3; ++k) {
      clean(device);
      device.set_param(p::kDensity, settings[k][0]);
      device.set_param(p::kSize, settings[k][1]);
      run(device, sine(440.0f, 1.0f, kRate, 0.3f));
      const float before = device.meter(kGrains);
      run(device, sine(440.0f, 30.0f, kRate, 0.3f));
      const double found = (device.meter(kGrains) - before) / 30.0;
      EXPECT_NEAR(found, expected[k], expected[k] * 0.06, "Density: grains started per second");
    }
  }

  // Nothing clicks at a grain's edges: single grains of a low tone are as
  // smooth as the tone at the grain's fastest, plus the steepest of its window.
  {
    const float falls[2] = {-12.0f, 12.0f};
    for (float fall : falls) {
      for (int quick = 0; quick < 2; ++quick) {
        clean(device);
        device.set_param(p::kFall, fall);
        device.set_param(p::kSize, 60.0f);
        device.set_param(p::kDensity, 4.0f);
        device.set_param(p::kShape, static_cast<float>(quick));
        Stereo out = run(device, sine(80.0f, 20.0f, kRate, 0.5f));
        const double fastest = std::max(1.0, std::pow(2.0, fall / 12.0));
        const double attack = Falling::attack_share(static_cast<float>(quick), 0.06f) * 0.06 * kRate;
        const double bound = 0.5 * 2.0 * kPi * 80.0 / kRate * fastest + 0.5 * 0.5 * kPi / attack;
        const double found = max_step(out.left);
        std::printf("falling: 60 ms grains, Fall %+.0f, Shape %d: max step %.5f (tone and window alone: %.5f)\n", fall,
                    quick, found, bound);
        EXPECT(found < 1.1 * bound, "a grain's edges do not click");
        EXPECT(rms(out.left) > 0.01, "the single grains sound");
      }
    }
  }

  // Moving a control while a cloud sounds does not click: for each control,
  // thrown between two settings four times a second, against the same cloud
  // held at either setting with nothing moved.
  {
    struct Throw {
      int param;
      const char* name;
      float a, b;
    };
    const Throw throws[] = {
        {p::kFall, "Fall", -24.0f, -1.0f},      {p::kCurve, "Curve", -1.0f, 1.0f},
        {p::kSize, "Size", 90.0f, 900.0f},      {p::kDensity, "Density", 3.0f, 40.0f},
        {p::kScatter, "Scatter", 0.0f, 1.0f},   {p::kVary, "Vary", 0.0f, 1.0f},
        {p::kShape, "Shape", 0.0f, 1.0f},       {p::kSpread, "Spread", 0.0f, 1.0f},
        {p::kAgain, "Again", 0.0f, 0.6f},       {p::kTone, "Tone", 600.0f, 12000.0f},
        {p::kMix, "Mix", 0.0f, 1.0f},
    };
    const std::vector<float> tone = sine(80.0f, 0.25f, kRate, 0.5f);
    char label[120];
    double worst_ratio = 0.0;
    for (const Throw& thrown : throws) {
      double step[3];
      for (int run_index = 0; run_index < 3; ++run_index) {
        dense(device);
        device.set_param(p::kSpread, 0.7f);
        device.set_param(p::kAgain, 0.3f);
        device.set_param(p::kMix, 0.7f);
        device.set_param(thrown.param, run_index == 1 ? thrown.b : thrown.a);
        run(device, sine(80.0f, 1.0f, kRate, 0.5f));
        double worst = 0.0;
        for (int k = 0; k < 32; ++k) {
          if (run_index == 2) device.set_param(thrown.param, k % 2 ? thrown.a : thrown.b);
          Stereo out = run(device, tone);
          worst = std::max(worst, std::max(max_step(out.left), max_step(out.right)));
        }
        step[run_index] = worst;
      }
      const double held = std::max(step[0], step[1]);
      worst_ratio = std::max(worst_ratio, step[2] / held);
      std::snprintf(label, sizeof label, "%s moved while the cloud sounds does not click (max step %.4f, held %.4f)",
                    thrown.name, step[2], held);
      EXPECT(step[2] < 1.5 * held, label);
    }
    std::printf("falling: a control thrown about against held still: largest max step ratio %.2f\n", worst_ratio);
  }

  // Level: an overlapping cloud plays at the level of its source, whatever
  // the Density and the Shape; below overlap the grains thin out.
  {
    for (int source = 0; source < 2; ++source) {
      double lowest = 1.0e9, highest = 0.0, sparse = 0.0, reference = 0.0;
      for (float density : {1.0f, 10.0f, 20.0f, 40.0f}) {
        for (float shape : {0.0f, 1.0f}) {
          dense(device);
          device.set_param(p::kDensity, density);
          device.set_param(p::kShape, shape);
          device.set_param(p::kFall, -5.0f);
          rng_state() = 0xABCDu;
          std::vector<float> input = source == 0 ? sine(330.0f, 8.0f, kRate, 0.4f) : noise(8.0f, kRate, 0.4f);
          reference = rms(input);
          Stereo out = run(device, input);
          const double level = rms(out.left, 96000);
          if (density < 5.0f) {
            sparse = std::max(sparse, level);
          } else {
            lowest = std::min(lowest, level);
            highest = std::max(highest, level);
          }
        }
      }
      std::printf("falling: %s, density 10..40: %.1f to %.1f dB re input; density 1: %.1f dB\n",
                  source == 0 ? "tone" : "noise", db(lowest / reference), db(highest / reference),
                  db(sparse / reference));
      EXPECT(std::fabs(db(highest / reference)) < 3.0 && std::fabs(db(lowest / reference)) < 3.0,
             "Level: an overlapping cloud plays at the level of its source");
      EXPECT(db(sparse / lowest) < -2.0, "Level: below overlap the grains thin out");
    }
  }

  // Again: the cloud is caught again, so a fall falls further. Grains that
  // drop an octave at once, from 1760 Hz: 880 Hz once round, 440 Hz twice.
  {
    double once[2], twice[2], late[2];
    for (int fed = 0; fed < 2; ++fed) {
      dense(device);
      device.set_param(p::kCurve, -1.0f);
      device.set_param(p::kAgain, fed ? 0.8f : 0.0f);
      Stereo out = run(device, sine(1760.0f, 6.0f, kRate, 0.4f));
      once[fed] = band_power(out.left, 860.0, 40.0, 96000, out.size(), 2.0);
      twice[fed] = band_power(out.left, 430.0, 30.0, 96000, out.size(), 2.0);
      // A small fall, for how long it lasts: an octave a turn is soon under hearing.
      dense(device);
      device.set_param(p::kFall, -1.0f);
      device.set_param(p::kAgain, fed ? 0.8f : 0.0f);
      run(device, sine(1760.0f, 3.0f, kRate, 0.4f));
      Stereo tail = render(device, 4.0f, kRate);
      late[fed] = rms(tail.left, 96000, 144000);
    }
    std::printf("falling: power an octave down %.2e, two octaves down %.2e without Again, %.2e with\n", once[0],
                twice[0], twice[1]);
    EXPECT(once[0] > 1.0e-3 && once[1] > 1.0e-3, "Again: the first fall is there either way");
    EXPECT(twice[0] < 1.0e-3 * once[0], "Again 0: nothing falls twice");
    EXPECT(twice[1] > 100.0 * twice[0] && twice[1] > 0.02 * once[1], "Again: a fall falls further each time round");
    EXPECT(late[0] < 1.0e-6, "Again 0: the cloud ends with the sound it caught");
    EXPECT(late[1] > 1.0e-3, "Again: the cloud outlasts the sound that fed it");
  }

  // Scatter is how far back a grain may be taken from: after a change of
  // note, only a scattered cloud still holds the old one.
  {
    double old_note[2], new_note[2];
    for (int scattered = 0; scattered < 2; ++scattered) {
      clean(device);
      device.set_param(p::kFall, 0.0f);
      device.set_param(p::kSize, 100.0f);
      device.set_param(p::kDensity, 30.0f);
      device.set_param(p::kScatter, static_cast<float>(scattered));
      Stereo out = run(device, join(sine(300.0f, 3.0f, kRate, 0.4f), sine(900.0f, 1.5f, kRate, 0.4f)));
      const size_t from = static_cast<size_t>(3.3f * kRate), to = static_cast<size_t>(4.3f * kRate);
      old_note[scattered] = band_power(out.left, 300.0, 8.0, from, to);
      new_note[scattered] = band_power(out.left, 900.0, 8.0, from, to);
    }
    EXPECT(old_note[0] < 1.0e-4 * new_note[0], "Scatter 0: every grain is what was just played");
    EXPECT(old_note[1] > 0.2 * new_note[1], "Scatter 1: grains are taken from up to two seconds back");
    // And never from further: 2.5 s after the change the old note is gone.
    clean(device);
    device.set_param(p::kFall, 0.0f);
    device.set_param(p::kSize, 100.0f);
    device.set_param(p::kDensity, 30.0f);
    device.set_param(p::kScatter, 1.0f);
    Stereo out = run(device, join(sine(300.0f, 3.0f, kRate, 0.4f), sine(900.0f, 4.0f, kRate, 0.4f)));
    const size_t from = static_cast<size_t>(5.3f * kRate), to = static_cast<size_t>(7.0f * kRate);
    EXPECT(band_power(out.left, 300.0, 8.0, from, to) < 1.0e-4 * band_power(out.left, 900.0, 8.0, from, to),
           "Scatter 1 reaches two seconds back and no further");
  }

  // Spread throws the grains left and right.
  {
    double corr[2];
    for (int wide = 0; wide < 2; ++wide) {
      dense(device);
      device.set_param(p::kFall, -7.0f);
      device.set_param(p::kSpread, static_cast<float>(wide));
      Stereo out = run(device, sine(330.0f, 8.0f, kRate, 0.4f));
      corr[wide] = correlation(out.left, out.right, 96000);
    }
    std::printf("falling: L/R correlation centred %.3f, spread %.3f\n", corr[0], corr[1]);
    EXPECT(corr[0] > 0.999, "Spread 0: a mono source stays mono");
    EXPECT(corr[1] < 0.6, "Spread 1 decorrelates left and right");
  }

  // Shape: a bell is loudest half way through the grain, a quick start
  // 4 % of the way.
  {
    for (int quick = 0; quick < 2; ++quick) {
      clean(device);
      device.set_param(p::kFall, 0.0f);
      device.set_param(p::kShape, static_cast<float>(quick));
      Marked m = run_marked(device, sine(1000.0f, 20.0f, kRate, 0.5f));
      const size_t length = static_cast<size_t>(0.8f * kRate);
      int judged = 0;
      for (size_t at : m.starts) {
        if (at + length > m.out.size()) continue;
        ++judged;
        size_t loudest = at;
        double best = 0.0;
        for (size_t i = at; i + 96 <= at + length; i += 48) {
          const double level = rms(m.out.left, i, i + 96);
          if (level > best) {
            best = level;
            loudest = i + 48;
          }
        }
        const double share = static_cast<double>(loudest - at) / length;
        EXPECT_NEAR(share, quick ? 0.04 : 0.5, 0.012, "Shape: where in the grain it is loudest");
        EXPECT_NEAR(best * std::sqrt(2.0), 0.5, 0.01, "Shape: the grain peaks at the level it caught");
      }
      EXPECT(judged >= 3, "Shape: enough single grains to judge");
    }
  }

  // Vary gives each grain its own fall: all alike at 0; at 1 between Fall and
  // half of it the other way, a third of them going the other way.
  {
    for (int varied = 0; varied < 2; ++varied) {
      dense(device);
      device.set_param(p::kCurve, -1.0f);
      device.set_param(p::kVary, static_cast<float>(varied));
      Marked m = run_marked(device, sine(2000.0f, 12.0f, kRate, 0.4f));
      float lowest = 100.0f, highest = -100.0f;
      int rising = 0;
      for (float fall : m.falls) {
        lowest = std::min(lowest, fall);
        highest = std::max(highest, fall);
        if (fall > 0.0f) ++rising;
      }
      const double landed = band_power(m.out.left, 1010.0, 40.0, 96000, m.out.size(), 2.0);
      const double above = band_power(m.out.left, 2300.0, 200.0, 96000, m.out.size(), 4.0);
      std::printf("falling: Vary %d: %zu grains fall %.1f to %.1f st; power at the landing %.2e, above the source %.2e\n",
                  varied, m.falls.size(), lowest, highest, landed, above);
      EXPECT(m.falls.size() > 150, "Vary: enough grains to judge");
      if (varied) {
        EXPECT_NEAR(lowest, -12.0, 0.3, "Vary 1: the grain that varies least falls all of Fall");
        EXPECT_NEAR(highest, 6.0, 0.3, "Vary 1: the grain that varies most goes half as far the other way");
        EXPECT_NEAR(static_cast<double>(rising) / m.falls.size(), 1.0 / 3.0, 0.08, "Vary 1: a third of the grains rise");
        EXPECT(above > 1.0e-3, "Vary 1: some of the cloud is above the source");
        EXPECT(landed < 1.0e-3, "Vary 1: little of the cloud lands where Fall says");
      } else {
        EXPECT(lowest == -12.0f && highest == -12.0f, "Vary 0: every grain falls alike");
        EXPECT(above < 1.0e-5, "Vary 0: nothing rises above the source");
        EXPECT(landed > 3.0e-3, "Vary 0: the cloud lands an octave down");
      }
    }
  }

  // Tone darkens the grains.
  {
    double bright[2];
    for (int dark = 0; dark < 2; ++dark) {
      dense(device);
      device.set_param(p::kFall, 0.0f);
      device.set_param(p::kTone, dark ? 800.0f : 16000.0f);
      rng_state() = 0xC0FFEEu;
      Stereo out = run(device, noise(4.0f, kRate, 0.3f));
      bright[dark] = energy_above(out.left, 4000.0, kRate, 48000);
    }
    EXPECT(bright[1] < 0.1 * bright[0], "Tone: lower takes the highs away");
  }

  // Mix 0 is the dry signal, sample for sample.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0x51DEu;
    std::vector<float> input = noise(2.0f, kRate, 0.5f);
    Stereo out = run(device, input);
    bool same = true;
    for (size_t i = 0; i < input.size(); ++i) same = same && out.left[i] == input[i] && out.right[i] == input[i];
    EXPECT(same, "Mix 0 is the input, sample for sample");
  }

  // A rising grain never reaches the record head: single grains two octaves
  // up, once the ring has gone round, are as smooth as the tone at the
  // grain's fastest. (A grain that read across the head would jump from the
  // newest sample to one written 21.8 s before.)
  {
    clean(device);
    device.set_param(p::kFall, 24.0f);
    device.set_param(p::kCurve, -1.0f);
    device.set_param(p::kSize, 1500.0f);
    Marked m = run_marked(device, sine(80.0f, 70.0f, kRate, 0.5f));
    const size_t from = static_cast<size_t>(24.0f * kRate);
    const double bound = 0.5 * 2.0 * kPi * 80.0 / kRate * 4.0;
    const double found = max_step(m.out.left, from);
    std::printf("falling: two octaves up, ring gone round: max step %.4f (the tone at four times: %.4f)\n", found, bound);
    EXPECT(found < 1.1 * bound, "a rising grain never reads across the record head");
    EXPECT(peak(m.out.left, from) > 0.4, "the rising grains sound");
    int late = 0;
    for (size_t g = 0; g < m.starts.size(); ++g) {
      if (m.starts[g] < from) continue;
      ++late;
      // It starts as far back as it will read beyond the head's travel.
      EXPECT(m.behinds[g] > 1.5f * 3.0f * Falling::mean_bend(-1.0f), "a rising grain starts behind what it will read");
    }
    EXPECT(late >= 8, "enough rising grains after the ring has gone round");
  }

  // Loud input, Again at its most, the densest cloud of the longest grains,
  // two octaves either way: finite and under the limiter's ceiling.
  {
    for (float fall : {-24.0f, 24.0f}) {
      device.init(kRate);
      device.set_param(p::kFall, fall);
      device.set_param(p::kAgain, 0.95f);
      device.set_param(p::kDensity, 40.0f);
      device.set_param(p::kSize, 3000.0f);
      device.set_param(p::kTone, 16000.0f);
      device.set_param(p::kMix, 1.0f);
      rng_state() = 0x5EEDu;
      Stereo loud = run(device, noise(8.0f, kRate, 1.0f));
      Stereo ringing = render(device, 20.0f, kRate);
      EXPECT(finite(loud.left) && finite(loud.right) && finite(ringing.left), "Again at its most stays finite");
      const double top = std::max(std::max(peak(loud.left), peak(loud.right)), peak(ringing.left));
      std::printf("falling: Again 0.95, Fall %+.0f, full-scale noise: peak %.2f\n", fall, top);
      EXPECT(top <= 2.0, "Again at its most stays under the limiter's ceiling");
    }
  }

  // A NaN, an infinity or an absurd sample in the input does not stay in the
  // device: the next sound is clean, the grains still come, and the tail
  // still ends in silence.
  {
    dense(device);
    device.set_param(p::kAgain, 0.6f);
    std::vector<float> bad = sine(330.0f, 0.5f, kRate, 0.5f);
    bad[1000] = std::nanf("");
    bad[2000] = 1.0e30f;
    bad[3000] = -HUGE_VALF;
    bad[4000] = HUGE_VALF;
    Stereo first = run(device, bad);
    Stereo next = run(device, sine(330.0f, 2.0f, kRate, 0.5f));
    Stereo tail = render(device, 30.0f, kRate);
    EXPECT(finite(next.left) && finite(next.right) && peak(next.left) < 2.5, "recovers from bad input samples");
    EXPECT(rms(next.left, 48000) > 0.05, "and the cloud is not stuck: it sounds again");
    EXPECT(finite(tail.left) && peak(tail.left, tail.size() - 4800) == 0.0, "and still falls silent afterwards");
    // What is not a number does not come out, even with the dry path open.
    device.init(kRate);
    Stereo dry = run(device, bad);
    EXPECT(std::isfinite(dry.left[1000]) && std::isfinite(dry.left[3000]) && std::isfinite(dry.left[4000]),
           "a NaN or an infinity in the input is silence, not a NaN out");
  }

  // The same sound at every block size, also across a silence: with the
  // second phrase stepped across the moment the cloud ends and the device
  // falls asleep, and across the tail that Again leaves.
  {
    const std::vector<float> phrase = sine(330.0f, 0.5f, kRate, 0.4f);
    double worst = 0.0;
    int gaps = 0;
    for (int fed = 0; fed < 2; ++fed) {
      const float from = fed ? 0.4f : 0.78f, to = fed ? 6.01f : 1.12f, step = fed ? 0.4f : 0.02f;
      for (float gap = from; gap < to; gap += step) {
        std::vector<float> input = join(join(phrase, silence(gap, kRate)), phrase);
        input.resize(input.size() + static_cast<size_t>(0.5f * kRate), 0.0f);
        Stereo reference;
        for (int block : {128, 1, 2048, 0}) {
          device.init(kRate);
          device.set_param(p::kAgain, fed ? 0.5f : 0.0f);
          Stereo out = block == 0 ? run_ragged(device, input) : run(device, input, block);
          if (block == 128) reference = out;
          worst = std::max(worst, apart(out, reference));
        }
        ++gaps;
      }
    }
    std::printf("falling: %d silences, block sizes 1, 128, 2048 and ragged: largest difference %.2e\n", gaps, worst);
    EXPECT(worst < 1.0e-6, "the same sound at every block size across a silence");
  }

  // A knob moved in a silence is there when sound returns: the second phrase
  // is, sample for sample, what a device set that way from the start plays.
  {
    const std::vector<float> phrase = sine(330.0f, 1.0f, kRate, 0.4f);
    for (float gap : {0.3f, 3.0f}) {
      device.init(kRate);
      run(device, sine(220.0f, 0.5f, kRate, 0.4f));
      // (an odd block, so the silence does not start on a round number)
      for (int i = 0; i < 13; ++i) device.in_left()[i] = device.in_right()[i] = 0.0f;
      device.process(13);
      render(device, gap, kRate);
      auto set = [](Falling& d) {
        d.set_param(p::kMix, 0.9f);
        d.set_param(p::kTone, 1200.0f);
        d.set_param(p::kAgain, 0.6f);
        d.set_param(p::kFall, 9.0f);
        d.set_param(p::kVary, 0.6f);
        d.set_param(p::kSize, 200.0f);
        d.set_param(p::kDensity, 14.0f);
      };
      if (gap > 2.0f) {
        set(device);
      } else {
        // The cloud of the first phrase is still sounding: it has to end first.
        device.set_param(p::kAgain, 0.0f);
        render(device, 2.0f, kRate);
        set(device);
      }
      Stereo played = run(device, phrase);
      other.init(kRate);
      set(other);
      Stereo fresh = run(other, phrase);
      const double difference = apart(played, fresh);
      EXPECT(difference < 1.0e-6, "a knob moved in a silence has arrived when sound returns");
    }
  }

  // The device sleeps once the cloud has ended, and wakes on new input.
  {
    device.init(kRate);
    run(device, noise(0.5f, kRate, 0.5f));
    render(device, 14.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    EXPECT(device.meter(kClock) == -1.0f && device.meter(kLevel) == 0.0f, "asleep, its readings are at rest");
    device.set_param(p::kMix, 1.0f);
    Stereo woken = run(device, sine(330.0f, 2.0f, kRate, 0.5f));
    EXPECT(rms(woken.left, 48000) > 0.05, "wakes on new input");
    EXPECT(device.meter(kClock) > 1.9f && device.meter(kLevel) > 0.4f, "awake, its clock runs and it reads what it catches");
  }

  // The bend is in time, not in samples: the same glide at 96 kHz.
  {
    clean(device, 96000.0f);
    Marked m = run_marked(device, sine(2000.0f, 12.0f, 96000.0f, 0.5f));
    const size_t length = static_cast<size_t>(0.8f * 96000.0f);
    int judged = 0;
    for (size_t at : m.starts) {
      if (at + length > m.out.size()) continue;
      ++judged;
      const double found = crossing_frequency(m.out.left, at + length * 45 / 100, at + length * 55 / 100, 96000.0);
      const double expected = 2000.0 * mean_speed(-12.0f, 0.0f, 0.45, 0.55);
      EXPECT_NEAR(found, expected, expected * 0.01, "96 kHz: the same pitch half way through a grain");
    }
    EXPECT(judged >= 2, "96 kHz: enough single grains to judge");
  }

  // Cost at the default patch, and at the worst: the most grains at once,
  // rising two octaves, caught again.
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("falling", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kDensity, 40.0f);
  device.set_param(p::kSize, 3000.0f);
  device.set_param(p::kFall, 24.0f);
  device.set_param(p::kAgain, 0.5f);
  run(device, input);
  report_cost("falling (most grains)", 10.0f, kRate, [&] { run(device, input); });
  device.init(96000.0f);
  device.set_param(p::kDensity, 40.0f);
  device.set_param(p::kSize, 3000.0f);
  device.set_param(p::kFall, 24.0f);
  device.set_param(p::kAgain, 0.5f);
  std::vector<float> long_input = noise(10.0f, 96000.0f, 0.25f);
  run(device, long_input);
  report_cost("falling (most grains, 96 kHz)", 10.0f, 96000.0f, [&] { run(device, long_input); });

  return finish("falling");
}
