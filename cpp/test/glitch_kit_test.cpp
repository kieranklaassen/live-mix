// Native harness for Glitch Kit (cpp/devices/glitch-kit). The conformance
// pass covers silence before and after notes, a pile of keys, parameter abuse
// and other sample rates; the rest asserts what makes it this kit: twelve
// voices on the twelve keys, each tuned by its octave, and what every
// control does to them. Set GLITCH_KIT_PRINT=1 to see the measurements.

#include <cstdlib>

#include "../devices/glitch-kit/glitch_kit.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::GlitchKit;
namespace p = livemix::glitch_kit;

static GlitchKit device;
static GlitchKit other;

static const float kRate = 48000.0f;
static const char* const kNames[12] = {"click", "double", "pop",  "crackle", "pip",     "cut",
                                       "static", "buzz",  "zap",  "chirp",   "stutter", "bit"};
enum Key : int { kC = 0, kCs, kD, kDs, kE, kF, kFs, kG, kGs, kA, kAs, kB };

static bool printing() {
  static const bool on = std::getenv("GLITCH_KIT_PRINT") != nullptr;
  return on;
}
#define NOTE(...)                        \
  do {                                   \
    if (printing()) std::printf(__VA_ARGS__); \
  } while (0)

// The frequency of a key of the octave, `octave` octaves from MIDI 60 to 71.
static float key_hz(int key, int octave = 0, float cents = 0.0f) {
  return 440.0f * std::pow(2.0f, (static_cast<float>(60 + key + 12 * octave - 69) + cents * 0.01f) / 12.0f);
}

// A kit with nothing left to chance: every hit of a key the same, in the centre.
static void plain(GlitchKit& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kScatter, 0.0f);
  d.set_param(p::kSpread, 0.0f);
}

// One hit of a plain kit, left channel (the output is mono there).
template <typename Setup>
static std::vector<float> hit(int key, Setup setup, float seconds = 1.0f, float gain = 0.7f, int octave = 0,
                              float rate = kRate, float cents = 0.0f) {
  plain(device, rate);
  setup(device);
  device.note_on(1, key_hz(key, octave, cents), gain);
  return render(device, seconds, rate).left;
}
static std::vector<float> hit(int key, float seconds = 1.0f, float gain = 0.7f, int octave = 0,
                              float rate = kRate, float cents = 0.0f) {
  return hit(key, [](GlitchKit&) {}, seconds, gain, octave, rate, cents);
}

// Samples until the hit has fallen 60 dB under its peak for good.
static size_t sounding(const std::vector<float>& x) {
  const double floor = 0.001 * peak(x);
  size_t last = 0;
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > floor) last = i;
  }
  return last + 1;
}
static double sounding_ms(const std::vector<float>& x, float rate = kRate) {
  return 1000.0 * static_cast<double>(sounding(x)) / rate;
}

// Sign changes in [from, to).
static int crossings(const std::vector<float>& x, size_t from, size_t to) {
  to = std::min(to, x.size());
  int count = 0;
  float last = 0.0f;
  for (size_t i = from; i < to; ++i) {
    if (x[i] == 0.0f) continue;
    if (last != 0.0f && (x[i] > 0.0f) != (last > 0.0f)) ++count;
    last = x[i];
  }
  return count;
}

// How often the time between sign changes turns against its trend in
// [from, to): none for a plain sweep, many when something modulates it.
static int reversals(const std::vector<float>& x, size_t from, size_t to, bool rising_pitch) {
  std::vector<double> at;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] == 0.0f || x[i] == 0.0f || (x[i] > 0.0f) == (x[i - 1] > 0.0f)) continue;
    at.push_back(static_cast<double>(i - 1) + x[i - 1] / (x[i - 1] - x[i]));
  }
  int count = 0;
  for (size_t i = 2; i < at.size(); ++i) {
    const double before = at[i - 1] - at[i - 2], after = at[i] - at[i - 1];
    // A pitch that rises has shorter and shorter half periods.
    if (rising_pitch ? after > 1.02 * before : after < 0.98 * before) ++count;
  }
  return count;
}

// Where a stepped wave moves: the first sample of each run of change larger
// than `share` of the peak that follows at least three samples of rest.
static std::vector<size_t> steps(const std::vector<float>& x, size_t from, size_t to, double share) {
  const double threshold = share * peak(x);
  std::vector<size_t> out;
  size_t rest = 3;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (std::fabs(static_cast<double>(x[i]) - x[i - 1]) > threshold) {
      if (rest >= 3) out.push_back(i);
      rest = 0;
    } else {
      ++rest;
    }
  }
  return out;
}

// The time in samples between the first two sign changes (half a period of a low tone).
static double half_period(const std::vector<float>& x) {
  double first = -1.0;
  for (size_t i = 1; i < x.size(); ++i) {
    if (x[i - 1] == 0.0f || x[i] == 0.0f || (x[i] > 0.0f) == (x[i - 1] > 0.0f)) continue;
    const double at = static_cast<double>(i - 1) + x[i - 1] / (x[i - 1] - x[i]);
    if (first < 0.0) {
      first = at;
    } else {
      return at - first;
    }
  }
  return 0.0;
}

// The lag in [lo, hi] samples at which the signal best repeats itself, and how well.
static double repeat_lag(const std::vector<float>& x, size_t n, int lo, int hi, double* how_well = nullptr) {
  int best = lo;
  double best_r = -2.0;
  for (int lag = lo; lag <= hi; ++lag) {
    double sab = 0.0, saa = 0.0, sbb = 0.0;
    for (size_t i = 0; i + lag < n; ++i) {
      sab += static_cast<double>(x[i]) * x[i + lag];
      saa += static_cast<double>(x[i]) * x[i];
      sbb += static_cast<double>(x[i + lag]) * x[i + lag];
    }
    const double r = (saa > 0.0 && sbb > 0.0) ? sab / std::sqrt(saa * sbb) : 0.0;
    if (r > best_r) {
      best_r = r;
      best = lag;
    }
  }
  if (how_well) *how_well = best_r;
  return best;
}

// Bursts by envelope: runs above `share` of the peak that are parted by more
// than `gap_ms` under it. `starts` takes where each begins.
static int bursts(const std::vector<float>& x, double share = 0.1, double gap_ms = 1.0, float rate = kRate,
                  std::vector<size_t>* starts = nullptr) {
  const double threshold = share * peak(x);
  const size_t gap = static_cast<size_t>(gap_ms * 0.001 * rate);
  size_t quiet = gap + 1;
  int count = 0;
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > threshold) {
      if (quiet > gap) {
        ++count;
        if (starts) starts->push_back(i);
      }
      quiet = 0;
    } else {
      ++quiet;
    }
  }
  return count;
}

// How far two renders are apart, as a share of the louder one.
static double apart(const std::vector<float>& a, const std::vector<float>& b) {
  const size_t n = std::min(a.size(), b.size());
  double sum = 0.0;
  for (size_t i = 0; i < n; ++i) sum += (static_cast<double>(a[i]) - b[i]) * (static_cast<double>(a[i]) - b[i]);
  const double difference = std::sqrt(sum / static_cast<double>(n));
  return difference / std::max(1.0e-12, std::max(rms(a, 0, n), rms(b, 0, n)));
}
static double largest_difference(const std::vector<float>& a, const std::vector<float>& b) {
  const size_t n = std::min(a.size(), b.size());
  double worst = 0.0;
  for (size_t i = 0; i < n; ++i) worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i]));
  return worst;
}

// The largest step in the first `count` samples from `at`, the one into the
// first of them included.
static double step_at(const std::vector<float>& x, size_t at, size_t count) {
  double worst = at == 0 ? std::fabs(static_cast<double>(x[0])) : 0.0;
  const size_t from = at == 0 ? 1 : at;
  for (size_t i = from; i < at + count && i < x.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - x[i - 1]));
  }
  return worst;
}

// Notes at exact sample positions, rendered in blocks of any size.
struct Event {
  size_t at;
  int key;
  int octave;
  float gain;
};
static Stereo play(GlitchKit& d, const std::vector<Event>& events, size_t total, int block,
                   const int* ragged = nullptr, int ragged_count = 0) {
  Stereo out;
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0;
  size_t next = 0;
  int which = 0;
  while (done < total) {
    while (next < events.size() && events[next].at <= done) {
      d.note_on(static_cast<int>(next), key_hz(events[next].key, events[next].octave), events[next].gain);
      ++next;
    }
    size_t frames = ragged ? static_cast<size_t>(ragged[which++ % ragged_count]) : static_cast<size_t>(block);
    frames = std::min(frames, total - done);
    if (next < events.size()) frames = std::min(frames, events[next].at - done);
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// Sixteen hits in two seconds across the voices: a busy bar.
static std::vector<Event> busy_bar(float rate, float gain, int bars = 1) {
  static const int keys[16] = {kD, kC, kE, kC, kF, kCs, kG, kC, kD, kFs, kA, kC, kGs, kDs, kAs, kB};
  std::vector<Event> events;
  for (int bar = 0; bar < bars; ++bar) {
    for (int step = 0; step < 16; ++step) {
      events.push_back({static_cast<size_t>((bar * 2.0 + step * 0.125) * rate), keys[step], 0, gain});
    }
  }
  return events;
}

// --- the twelve voices ----------------------------------------------------------------------

static void test_keys() {
  // Every key is a sound of its own.
  std::vector<float> voice[12];
  for (int k = 0; k < 12; ++k) voice[k] = hit(k);
  double closest = 1.0e9;
  for (int a = 0; a < 12; ++a) {
    for (int b = a + 1; b < 12; ++b) closest = std::min(closest, apart(voice[a], voice[b]));
  }
  NOTE("closest pair of keys: %.2f apart\n", closest);
  EXPECT(closest > 0.3, "each of the twelve keys gives a different sound");

  // The same key in another octave is the same voice, retuned: the pitched
  // part of each voice doubles an octave up, and Tune +12 does the same.
  auto tuned = [](float tune) { return [tune](GlitchKit& d) { d.set_param(p::kTune, tune); }; };
  {
    const double f0 = dominant_frequency(hit(kE), kRate, 400.0, 8000.0, 0, 1920);
    const double up = dominant_frequency(hit(kE, 1.0f, 0.7f, 1), kRate, 400.0, 8000.0, 0, 1440);
    const double down = dominant_frequency(hit(kE, 1.0f, 0.7f, -1), kRate, 400.0, 8000.0, 0, 2560);
    const double by_tune = dominant_frequency(hit(kE, tuned(12.0f)), kRate, 400.0, 8000.0, 0, 1440);
    const double low_tune = dominant_frequency(hit(kE, tuned(-7.0f)), kRate, 400.0, 8000.0, 0, 2000);
    NOTE("pip: %.2f Hz, octave up %.2f, octave down %.2f, tune +12 %.2f, tune -7 %.2f\n", f0, up, down,
         by_tune, low_tune);
    EXPECT_NEAR(f0, 1318.51, 1.5, "the pip sounds at 1318.5 Hz");
    EXPECT_NEAR(up / f0, 2.0, 0.01, "the pip an octave up is an octave higher");
    EXPECT_NEAR(down / f0, 0.5, 0.005, "the pip an octave down is an octave lower");
    EXPECT_NEAR(by_tune / f0, 2.0, 0.01, "Tune +12 raises the pip an octave");
    EXPECT_NEAR(low_tune / f0, std::pow(2.0, -7.0 / 12.0), 0.005, "Tune -7 lowers the pip a fifth");
  }
  {
    const double f0 = dominant_frequency(hit(kC), kRate, 800.0, 12000.0, 0, 480);
    const double up = dominant_frequency(hit(kC, 1.0f, 0.7f, 1), kRate, 800.0, 12000.0, 0, 480);
    const double by_tune = dominant_frequency(hit(kC, tuned(12.0f)), kRate, 800.0, 12000.0, 0, 480);
    NOTE("click band: %.0f Hz, octave up %.0f, tune +12 %.0f\n", f0, up, by_tune);
    EXPECT_NEAR(up / f0, 2.0, 0.08, "the click's band moves up an octave with the key");
    EXPECT_NEAR(by_tune / f0, 2.0, 0.08, "and with Tune +12");
  }
  {
    auto round = [](GlitchKit& d) { d.set_param(p::kEdge, 0.0f); };
    const double base = half_period(hit(kD, round));
    plain(device);
    device.set_param(p::kEdge, 0.0f);
    device.note_on(1, key_hz(kD, 1), 0.7f);
    const double up = half_period(render(device, 0.5f, kRate).left);
    NOTE("pop: half a period is %.3f ms, an octave up %.3f ms\n", base / 48.0, up / 48.0);
    EXPECT_NEAR(base / up, 2.0, 0.08, "the pop an octave up is an octave higher");
  }
  {
    std::vector<float> low = hit(kG);
    std::vector<float> high = hit(kG, 1.0f, 0.7f, 1);
    const double lag = repeat_lag(low, sounding(low), 300, 700);
    const double lag_up = repeat_lag(high, sounding(high), 150, 350);
    NOTE("buzz: repeats every %.0f samples, an octave up every %.0f\n", lag, lag_up);
    EXPECT_NEAR(lag / lag_up, 2.0, 0.03, "the buzz's pulse rate doubles an octave up");
  }
  {
    // The sweeps keep their shape: the same share of the hit is an octave higher.
    for (int key : {kGs, kA}) {
      std::vector<float> low = hit(key);
      std::vector<float> high = hit(key, 1.0f, 0.7f, 1);
      const size_t n = sounding(low), m = sounding(high);
      const double f = dominant_frequency(low, kRate, 150.0, 16000.0, n / 2, n * 3 / 4);
      const double f_up = dominant_frequency(high, kRate, 150.0, 16000.0, m / 2, m * 3 / 4);
      NOTE("%s: third quarter at %.0f Hz, an octave up %.0f Hz\n", kNames[key], f, f_up);
      EXPECT_NEAR(f_up / f, 2.0, 0.1, key == kGs ? "the zap an octave up is an octave higher"
                                                 : "the chirp an octave up is an octave higher");
    }
  }
  {
    std::vector<float> low = hit(kB);
    std::vector<float> high = hit(kB, 1.0f, 0.7f, 1);
    const double rate_low = crossings(low, 0, sounding(low)) / static_cast<double>(sounding(low));
    const double rate_high = crossings(high, 0, sounding(high)) / static_cast<double>(sounding(high));
    NOTE("bit: %.0f sign changes a second, an octave up %.0f\n", rate_low * kRate, rate_high * kRate);
    EXPECT_NEAR(rate_high / rate_low, 2.0, 0.2, "the bit's clock doubles an octave up");
  }
  {
    std::vector<float> low = hit(kFs);
    std::vector<float> high = hit(kFs, 1.0f, 0.7f, 1);
    const double rate_low = crossings(low, 0, 4800) / 4800.0;
    const double rate_high = crossings(high, 0, 3600) / 3600.0;
    NOTE("static: %.0f sign changes a second, an octave up %.0f\n", rate_low * kRate, rate_high * kRate);
    EXPECT(rate_high > 1.5 * rate_low && rate_high < 2.6 * rate_low, "the static's grain is finer an octave up");
  }
  {
    auto open = [](GlitchKit& d) { d.set_param(p::kTone, 1.0f); };
    std::vector<float> mid = hit(kF, open);
    std::vector<float> low = hit(kF, open, 1.0f, 0.7f, -1);
    const double bright = energy_above(mid, 4000.0, kRate, 0, sounding(mid));
    const double dull = energy_above(low, 4000.0, kRate, 0, sounding(low));
    NOTE("cut: share above 4 kHz %.2f, an octave down %.2f\n", bright, dull);
    EXPECT(dull < 0.6 * bright, "the cut's hiss is duller an octave down");
  }
  {
    std::vector<float> low = hit(kAs);
    std::vector<float> high = hit(kAs, 1.0f, 0.7f, 1);
    const double f = dominant_frequency(low, kRate, 500.0, 12000.0, 0, 288);
    const double f_up = dominant_frequency(high, kRate, 500.0, 12000.0, 0, 216);
    NOTE("stutter grain: %.0f Hz, an octave up %.0f\n", f, f_up);
    EXPECT_NEAR(f, 2093.0, 40.0, "the stutter's grain is a pip at 2093 Hz");
    EXPECT_NEAR(f_up / f, 2.0, 0.05, "and an octave higher an octave up");
  }

  {
    // The click keeps its level up the keyboard, where its pulse is down to a
    // few samples. By its energy over its ring time: so few samples a cycle
    // miss the crests, and the peak says less.
    auto strength = [](int octave) {
      std::vector<float> x = hit(kC, [](GlitchKit& d) { d.set_param(p::kTone, 1.0f); }, 1.0f, 0.7f, octave);
      double energy = 0.0;
      for (float v : x) energy += static_cast<double>(v) * v;
      return std::sqrt(energy / std::pow(0.75, octave));
    };
    const double here = strength(0);
    NOTE("click against its own octave: %+.2f dB an octave down, %+.2f dB one up, %+.2f dB two up\n",
         db(strength(-1) / here), db(strength(1) / here), db(strength(2) / here));
    EXPECT(std::fabs(db(strength(2) / here)) < 1.5 && std::fabs(db(strength(1) / here)) < 1.5 &&
               std::fabs(db(strength(-1) / here)) < 1.5,
           "the click is as strong in every octave");
  }

  // An octave up also shortens a voice by about a quarter; every voice, both ways.
  for (int k = 0; k < 12; ++k) {
    if (k == kCs || k == kAs) continue;  // their length is the spacing Density sets
    const double here = sounding_ms(voice[k]);
    const double up = sounding_ms(hit(k, 1.0f, 0.7f, 1));
    const double down = sounding_ms(hit(k, 1.5f, 0.7f, -1));
    NOTE("%-8s %.1f ms, octave up %.1f ms, octave down %.1f ms\n", kNames[k], here, up, down);
    char label[96];
    std::snprintf(label, sizeof label, "the %s is about a quarter shorter an octave up", kNames[k]);
    EXPECT(up > 0.6 * here && up < 0.9 * here, label);
    std::snprintf(label, sizeof label, "the %s is about a third longer an octave down", kNames[k]);
    EXPECT(down > 1.15 * here && down < 1.55 * here, label);
  }

  // A key 30 cents sharp or flat is still its own voice, and the cents tune it.
  for (int k = 0; k < 12; ++k) {
    const double here = sounding_ms(voice[k]);
    for (float cents : {-30.0f, 30.0f}) {
      std::vector<float> off = hit(k, 1.0f, 0.7f, 0, kRate, cents);
      char label[96];
      std::snprintf(label, sizeof label, "the %s %+.0f cents off its key is still the %s", kNames[k], cents,
                    kNames[k]);
      EXPECT(std::fabs(sounding_ms(off) - here) < 0.04 * here + 0.1, label);
    }
  }
  {
    const double sharp = dominant_frequency(hit(kE, 1.0f, 0.7f, 0, kRate, 30.0f), kRate, 400.0, 8000.0, 0, 1920);
    const double flat = dominant_frequency(hit(kE, 1.0f, 0.7f, 0, kRate, -30.0f), kRate, 400.0, 8000.0, 0, 1920);
    NOTE("pip 30 cents sharp %.2f Hz, flat %.2f Hz\n", sharp, flat);
    EXPECT_NEAR(sharp, 1318.51 * std::pow(2.0, 0.3 / 12.0), 1.5, "a pip 30 cents sharp sounds 30 cents sharp");
    EXPECT_NEAR(flat, 1318.51 * std::pow(2.0, -0.3 / 12.0), 1.5, "a pip 30 cents flat sounds 30 cents flat");
  }
}

// What makes each voice what it is.
static void test_voices() {
  {  // click
    std::vector<float> x = hit(kC);
    const double hz = dominant_frequency(x, kRate, 500.0, 12000.0, 0, 480);
    NOTE("click: band %.0f Hz, %.2f ms, %d burst\n", hz, sounding_ms(x), bursts(x));
    EXPECT_NEAR(hz, 2600.0, 130.0, "the click rings near 2.6 kHz");
    EXPECT(sounding_ms(x) > 1.5 && sounding_ms(x) < 5.0, "the click is a tick of about 3 ms");
    EXPECT(bursts(x) == 1, "the click is one event");
    EXPECT(energy_above(x, 1000.0, kRate, 0, sounding(x)) > 0.6, "the click has no low thud in it");
  }
  {  // double
    std::vector<size_t> starts;
    std::vector<float> x = hit(kCs);
    const int count = bursts(x, 0.1, 1.0, kRate, &starts);
    EXPECT(count == 2, "the double is two clicks at the default Density");
    if (count == 2) {
      const double gap_ms = (starts[1] - starts[0]) / 48.0;
      const double first = peak(x, starts[0], starts[0] + 240);
      const double second = peak(x, starts[1], starts[1] + 240);
      NOTE("double: clicks %.1f ms apart, the second at %.2f of the first\n", gap_ms, second / first);
      EXPECT(gap_ms > 12.0 && gap_ms < 30.0, "the double's clicks are 12 to 30 ms apart");
      EXPECT(second < 0.8 * first && second > 0.3 * first, "the later click is softer");
    }
  }
  {  // pop
    auto round = [](GlitchKit& d) { d.set_param(p::kEdge, 0.0f); };
    std::vector<float> x = hit(kD, round);
    const double half = half_period(x) / kRate;
    NOTE("pop: fundamental %.1f Hz, %.1f ms, share above 400 Hz %.3f\n", 0.5 / half, sounding_ms(x),
         energy_above(x, 400.0, kRate, 0, sounding(x)));
    EXPECT_NEAR(0.5 / half, 98.0, 4.0, "the pop is a 98 Hz sine");
    EXPECT(sounding_ms(x) > 14.0 && sounding_ms(x) < 24.0, "the pop is about 20 ms long");
    EXPECT(energy_above(x, 400.0, kRate, 0, sounding(x)) < 0.1, "the pop's energy is low");
    EXPECT(crossings(x, 0, sounding(x)) <= 3, "the pop is a cycle and a half, not a tone");
  }
  {  // crackle
    std::vector<size_t> starts;
    std::vector<float> x = hit(kDs);
    const int count = bursts(x, 0.1, 0.7, kRate, &starts);
    const size_t n = sounding(x);
    int early = 0;
    for (size_t s : starts) early += s < n / 2 ? 1 : 0;
    NOTE("crackle: %d bursts in %.0f ms, %d of them in the first half\n", count, sounding_ms(x), early);
    EXPECT(count >= 4 && count <= 30, "the crackle is a handful of sparse impulses");
    EXPECT(sounding_ms(x) > 120.0 && sounding_ms(x) < 300.0, "over about a quarter of a second");
    EXPECT(early > count - early, "thinning out as it goes");
    // The impulses are of both signs and of many sizes.
    int up = 0, down = 0;
    double smallest = 1.0e9, largest = 0.0;
    for (size_t s : starts) {
      (x[s] > 0.0f ? up : down) += 1;
      const double size = peak(x, s, s + 24);
      smallest = std::min(smallest, size);
      largest = std::max(largest, size);
    }
    NOTE("crackle: %d impulses up and %d down, the largest %.1f times the smallest\n", up, down, largest / smallest);
    EXPECT(up >= 3 && down >= 3, "the crackle's impulses point both ways");
    EXPECT(largest > 2.0 * smallest, "and differ in size");
    EXPECT(energy_above(x, 1000.0, kRate, 0, n) > 0.6, "through the click's band");
  }
  {  // pip
    std::vector<float> x = hit(kE);
    const size_t n = sounding(x);
    const double fundamental = tone_level(x, 1318.51, kRate, 0, n);
    const double second = tone_level(x, 2.0 * 1318.51, kRate, 0, n);
    const double third = tone_level(x, 3.0 * 1318.51, kRate, 0, n);
    NOTE("pip: %.1f ms, second harmonic %.1f dB, third %.1f dB\n", sounding_ms(x), db(second / fundamental),
         db(third / fundamental));
    EXPECT(sounding_ms(x) > 36.0 && sounding_ms(x) < 44.0, "the pip is about 40 ms long");
    EXPECT(second < 0.01 * fundamental && third < 0.01 * fundamental,
           "the pip is a pure tone: its harmonics are 40 dB under it");
  }
  {  // cut
    std::vector<float> x = hit(kF);
    const size_t n = sounding(x);
    const double first = rms(x, 0, n / 2), second = rms(x, n / 2, n);
    double strongest = 0.0;
    for (double hz = 300.0; hz < 6000.0; hz *= 1.02) strongest = std::max(strongest, tone_level(x, hz, kRate, 0, n));
    NOTE("cut: %.1f ms, halves %.1f dB apart, strongest tone at %.2f of its rms\n", sounding_ms(x),
         db(second / first), strongest / rms(x, 0, n));
    EXPECT(sounding_ms(x) > 45.0 && sounding_ms(x) < 55.0, "the cut is about 50 ms long");
    EXPECT(std::fabs(db(second / first)) < 3.0, "the cut holds its level: a slice, not a decay");
    EXPECT(strongest < 0.6 * rms(x, 0, n), "the cut is noise: no tone stands out");
  }
  {  // static
    std::vector<float> x = hit(kFs);
    const double early = rms(x, 0, 2400), late = rms(x, 4800, 7200);
    const double ring = rt60(x, kRate, 0.0, 0.02, -80.0);
    const double steps = crossings(x, 0, 4800) / 0.1;
    NOTE("static: rt60 %.3f s, %.1f dB down from 0-50 ms to 100-150 ms, %.0f sign changes a second\n", ring,
         db(late / early), steps);
    EXPECT(ring > 0.14 && ring < 0.26, "the static falls away over about 0.2 s");
    EXPECT(late < 0.2 * early, "the static decays");
    EXPECT(steps > 900.0 && steps < 2400.0, "the static's grain is held steps a few thousand times a second");
    // Its clock is uneven: steps as close as half a period of 3 kHz, never a steady 16 samples.
    std::vector<float> open = hit(kFs, [](GlitchKit& d) { d.set_param(p::kTone, 1.0f); }, 1.0f, 1.0f);
    std::vector<size_t> moves = ::steps(open, 0, 2400, 0.03);
    size_t shortest = 1000, longest = 0;
    for (size_t i = 1; i < moves.size(); ++i) {
      shortest = std::min(shortest, moves[i] - moves[i - 1]);
      longest = std::max(longest, moves[i] - moves[i - 1]);
    }
    NOTE("static: %zu steps in 50 ms, %zu to %zu samples apart\n", moves.size(), shortest, longest);
    EXPECT(moves.size() > 60 && shortest >= 6 && shortest <= 11, "the static's clock is uneven: rough, not a pitch");
  }
  {  // buzz
    std::vector<float> x = hit(kG);
    double how_well = 0.0;
    const double lag = repeat_lag(x, sounding(x), 300, 700, &how_well);
    NOTE("buzz: %.1f ms, pulse rate %.2f Hz (repeats %.2f)\n", sounding_ms(x), kRate / lag, how_well);
    EXPECT_NEAR(kRate / lag, 98.0, 1.0, "the buzz is a pulse train at 98 Hz");
    EXPECT(how_well > 0.8, "and it is periodic");
    EXPECT(sounding_ms(x) > 75.0 && sounding_ms(x) < 100.0, "about 90 ms long");
    const double band = energy_above(x, 500.0, kRate, 0, sounding(x));
    EXPECT(band > 0.6, "band-passed: little of it is under 500 Hz");
    // Three octaves up its pulse is down to three samples, and it keeps the
    // area it had: no stronger there, and not lost.
    auto strength = [](int octave, float tune) {
      std::vector<float> y = hit(kG, [tune](GlitchKit& d) {
        d.set_param(p::kTone, 1.0f);
        d.set_param(p::kTune, tune);
      }, 1.0f, 0.7f, octave);
      double energy = 0.0;
      for (float v : y) energy += static_cast<double>(v) * v;
      return std::sqrt(energy / std::pow(0.75, octave + tune / 12.0));
    };
    const double top = db(strength(2, 12.0f) / strength(0, 0.0f));
    NOTE("buzz: %+.1f dB an octave up, %+.1f dB three octaves up\n", db(strength(1, 0.0f) / strength(0, 0.0f)), top);
    EXPECT(std::fabs(db(strength(1, 0.0f) / strength(0, 0.0f))) < 1.0, "the buzz is as strong an octave up");
    EXPECT(top < 1.0 && top > -5.0, "and no stronger three octaves up");
  }
  {  // zap
    std::vector<float> x = hit(kGs, [](GlitchKit& d) { d.set_param(p::kTone, 1.0f); });
    const size_t n = sounding(x);
    const double start = dominant_frequency(x, kRate, 150.0, 12000.0, 0, n / 8);
    const double end = dominant_frequency(x, kRate, 150.0, 12000.0, n - n / 8, n);
    NOTE("zap: %.1f ms, first eighth at %.0f Hz, last eighth at %.0f Hz\n", sounding_ms(x), start, end);
    EXPECT(sounding_ms(x) > 36.0 && sounding_ms(x) < 44.0, "the zap is about 40 ms long");
    EXPECT(start > 4000.0 && start < 6100.0, "the zap starts near 6 kHz");
    EXPECT(end > 290.0 && end < 480.0, "and has fallen to about 300 Hz at its end");
    NOTE("zap: %d reversals in its fall\n", reversals(x, 96, n - 96, false));
    EXPECT(reversals(x, 96, n - 96, false) == 0, "the zap falls all the way: a plain sweep");
  }
  {  // chirp
    std::vector<float> x = hit(kA, [](GlitchKit& d) { d.set_param(p::kTone, 1.0f); });
    const size_t n = sounding(x);
    const double start = dominant_frequency(x, kRate, 300.0, 12000.0, 0, n / 8);
    const double end = dominant_frequency(x, kRate, 300.0, 12000.0, n - n / 8, n);
    NOTE("chirp: %.1f ms, first eighth at %.0f Hz, last eighth at %.0f Hz\n", sounding_ms(x), start, end);
    EXPECT(sounding_ms(x) > 27.0 && sounding_ms(x) < 33.0, "the chirp is about 30 ms long");
    EXPECT(start > 850.0 && start < 1100.0, "the chirp starts near 880 Hz");
    EXPECT(end > 2800.0 && end < 3600.0, "and has risen to about 3.5 kHz at its end");
    NOTE("chirp: %d reversals in its rise\n", reversals(x, 96, n - 96, true));
    EXPECT(reversals(x, 96, n - 96, true) >= 6, "the chirp's rise wavers: a touch of FM");
  }
  {  // stutter
    std::vector<size_t> starts;
    std::vector<float> x = hit(kAs);
    const int count = bursts(x, 0.1, 3.0, kRate, &starts);
    NOTE("stutter: %d grains\n", count);
    EXPECT(count == 7, "the stutter repeats its grain seven times at the default Density");
    if (count >= 3) {
      bool even = true, softer = true;
      const size_t spacing = starts[1] - starts[0];
      for (int i = 1; i < count; ++i) {
        // A softer grain crosses the threshold a little later in its rise.
        if (starts[i] - starts[i - 1] + 12 < spacing || starts[i] - starts[i - 1] > spacing + 12) even = false;
        if (peak(x, starts[i], starts[i] + 288) >= peak(x, starts[i - 1], starts[i - 1] + 288)) softer = false;
      }
      const double grain_ms = sounding_ms(std::vector<float>(x.begin(), x.begin() + spacing - 96));
      NOTE("stutter: spacing %.1f ms, grain %.1f ms\n", spacing / 48.0, grain_ms);
      EXPECT(even, "the stutter's spacing is fixed");
      EXPECT(spacing / 48.0 > 12.0 && spacing / 48.0 < 40.0, "between 12 and 40 ms");
      EXPECT(softer, "each repeat is a little softer");
      EXPECT(grain_ms > 4.5 && grain_ms < 7.5, "the grain is about 6 ms");
    }
  }
  {  // bit
    std::vector<float> x = hit(kB, [](GlitchKit& d) { d.set_param(p::kTone, 1.0f); });
    const size_t n = sounding(x);
    double how_well = 0.0;
    const double lag = repeat_lag(x, n, 400, 800, &how_well);
    const double clock = 93.0 * kRate / lag;
    NOTE("bit: %.1f ms, loop of %.0f samples (clock %.0f Hz, repeats %.2f), rms over peak %.2f\n",
         sounding_ms(x), lag, clock, how_well, rms(x, 0, n) / peak(x));
    EXPECT(sounding_ms(x) > 72.0 && sounding_ms(x) < 88.0, "the bit is about 80 ms long");
    EXPECT_NEAR(clock, 4.0 * 1975.53, 80.0, "the bit's 93-step loop is clocked at four times 1975.5 Hz");
    EXPECT(how_well > 0.8, "and repeats: it has a pitch");
    EXPECT(rms(x, 0, n) > 0.6 * peak(x), "the bit is a two-level wave");
    // Its clock does not fall on whole samples; each step is shared between
    // the two samples it falls between, which keeps the loop's partials clean.
    std::vector<float> held = hit(kB, [](GlitchKit& d) {
      d.set_param(p::kTone, 1.0f);
      d.set_param(p::kLength, 4.0f);
    });
    const double loop_hz = 4.0 * 1975.53 / 93.0;
    double on = 0.0, off = 0.0;
    for (int k = 4; k < 60; ++k) {
      const double partial = tone_level(held, k * loop_hz, kRate, 0, 14400);
      const double between = tone_level(held, (k + 0.5) * loop_hz, kRate, 0, 14400);
      on += partial * partial;
      off += between * between;
    }
    NOTE("bit: what lies between the loop's partials is %.1f dB under them\n", 10.0 * std::log10(on / off));
    EXPECT(on > 1.0e6 * off, "the bit's steps do not rattle against the sample rate: 60 dB clean");
  }
}

// --- the controls ---------------------------------------------------------------------------

// The strongest component of a pip that is not on one of its harmonics, as a share of the pip.
static double off_harmonic(const std::vector<float>& x, double hz) {
  const size_t n = sounding(x);
  double worst = 0.0;
  for (double at = 200.0; at < 12000.0; at += 25.0) {
    const double nearest = std::floor(at / hz + 0.5) * hz;
    if (nearest > 0.0 && std::fabs(at - nearest) < 150.0) continue;
    worst = std::max(worst, tone_level(x, at, kRate, 0, n));
  }
  return worst / tone_level(x, hz, kRate, 0, n);
}

static void test_controls() {
  auto with = [](int id, float value) { return [id, value](GlitchKit& d) { d.set_param(id, value); }; };

  // Length scales how long every voice lasts.
  for (int k = 0; k < 12; ++k) {
    const double base = sounding_ms(hit(k));
    const double longer = sounding_ms(hit(k, with(p::kLength, 2.0f), 2.0f));
    const double shorter = sounding_ms(hit(k, with(p::kLength, 0.5f)));
    NOTE("%-8s length 0.5: %.1f ms, 1: %.1f ms, 2: %.1f ms\n", kNames[k], shorter, base, longer);
    char label[96];
    if (k == kCs || k == kAs) {
      std::snprintf(label, sizeof label, "Length leaves the spacing of the %s alone", kNames[k]);
      EXPECT(longer > base && longer < 1.2 * base && shorter < base && shorter > 0.8 * base, label);
    } else {
      std::snprintf(label, sizeof label, "Length 2 doubles the %s", kNames[k]);
      EXPECT_NEAR(longer / base, 2.0, 0.25, label);
      std::snprintf(label, sizeof label, "Length 0.5 halves the %s", kNames[k]);
      EXPECT_NEAR(shorter / base, 0.5, 0.08, label);
    }
  }
  {
    const double ring = rt60(hit(kFs), kRate, 0.0, 0.02, -80.0);
    const double longer = rt60(hit(kFs, with(p::kLength, 2.0f), 2.0f), kRate, 0.0, 0.02, -80.0);
    NOTE("static rt60: %.3f s, at Length 2 %.3f s\n", ring, longer);
    EXPECT_NEAR(longer / ring, 2.0, 0.3, "Length doubles the static's ring time");
    std::vector<size_t> starts, longer_starts;
    std::vector<float> a = hit(kAs), b = hit(kAs, with(p::kLength, 2.0f));
    bursts(a, 0.1, 3.0, kRate, &starts);
    bursts(b, 0.1, 3.0, kRate, &longer_starts);
    EXPECT(starts.size() == longer_starts.size() && starts.size() > 2 &&
               starts[2] - starts[1] == longer_starts[2] - longer_starts[1],
           "the stutter's spacing does not move with Length");
    const size_t spacing = starts.size() > 1 ? starts[1] - starts[0] : 1;
    const double grain = sounding_ms(std::vector<float>(a.begin(), a.begin() + spacing - 96));
    const double long_grain = sounding_ms(std::vector<float>(b.begin(), b.begin() + spacing - 96));
    EXPECT_NEAR(long_grain / grain, 2.0, 0.3, "and its grain is twice as long at Length 2");
  }

  // Tone is a low-pass over everything.
  {
    double share[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int i = 0; i < 3; ++i) {
      std::vector<float> x = hit(kF, with(p::kTone, settings[i]));
      share[i] = energy_above(x, 3000.0, kRate, 0, sounding(x));
    }
    NOTE("cut, share above 3 kHz: Tone 0 %.3f, 0.5 %.3f, 1 %.3f\n", share[0], share[1], share[2]);
    EXPECT(share[0] < 0.5 * share[1] && share[1] < 0.8 * share[2], "Tone moves the cut from dull to bright");
    std::vector<float> dull = hit(kGs, with(p::kTone, 0.0f)), open = hit(kGs, with(p::kTone, 1.0f));
    EXPECT(tone_level(dull, 5000.0, kRate, 0, 480) < 0.2 * tone_level(open, 5000.0, kRate, 0, 480),
           "Tone 0 takes the top off the zap");
    const double low = peak(hit(kD, with(p::kTone, 0.0f))), full = peak(hit(kD, with(p::kTone, 1.0f)));
    EXPECT(std::fabs(db(low / full)) < 1.0, "and leaves the pop where it is");
  }

  // Edge: 0 rounds every start and stop, 1 switches them.
  {
    auto edged = [](float edge) {
      return [edge](GlitchKit& d) {
        d.set_param(p::kEdge, edge);
        d.set_param(p::kTone, 1.0f);
      };
    };
    std::vector<float> round = hit(kF, edged(0.0f));
    std::vector<float> hard = hit(kF, edged(1.0f));
    const size_t end = 2400;  // 50 ms
    const double round_start = step_at(round, 0, 5) / peak(round);
    const double round_end = step_at(round, end - 5, 12) / peak(round);
    const double hard_start = step_at(hard, 0, 5) / peak(hard);
    const double hard_end = step_at(hard, end - 5, 12) / peak(hard);
    NOTE("cut, largest step over peak: Edge 0 start %.4f end %.4f, Edge 1 start %.3f end %.3f\n", round_start,
         round_end, hard_start, hard_end);
    EXPECT(round_start < 0.01 && round_end < 0.01,
           "Edge 0 leaves no step at either end of a cut larger than a hundredth of its peak");
    EXPECT(hard_start > 0.1 && hard_end > 0.1, "Edge 1 switches the cut on and off");
    // Rounded over 3 ms: halfway up after 1.5 ms.
    EXPECT(rms(round, 0, 48) < 0.15 * rms(round, 480, 1920) && rms(round, 120, 168) > 0.5 * rms(round, 480, 1920),
           "the cut's ends are rounded over 3 ms at Edge 0");

    for (int key : {kE, kD, kC, kGs, kB}) {
      std::vector<float> soft = hit(key, edged(0.0f));
      std::vector<float> sharp = hit(key, edged(1.0f));
      // The click's band rises steeply by itself: only its first sample tells.
      const size_t first = key == kC ? 1 : 4;
      const double soft_step = step_at(soft, 0, first) / peak(soft);
      const double sharp_step = step_at(sharp, 0, first) / peak(sharp);
      NOTE("%-8s first step over peak: Edge 0 %.4f, Edge 1 %.3f\n", kNames[key], soft_step, sharp_step);
      char label[96];
      std::snprintf(label, sizeof label, "the %s starts round at Edge 0 and on a step at Edge 1", kNames[key]);
      EXPECT(soft_step < 0.02 && sharp_step > 0.05, label);
    }
    std::vector<float> soft = hit(kE, edged(0.0f)), sharp = hit(kE, edged(1.0f));
    EXPECT(step_at(sharp, 1920 - 4, 10) > 3.0 * step_at(soft, 1920 - 4, 10), "and the pip stops on one at Edge 1");
    std::vector<float> usual = hit(kE);
    EXPECT(step_at(usual, 0, 4) < 0.03 * peak(usual), "the default Edge still rounds the pip's start");
  }

  // Density: how many events, and how close.
  {
    std::vector<size_t> starts;
    EXPECT(bursts(hit(kCs, with(p::kDensity, 0.0f)), 0.1, 1.0, kRate, &starts) == 2, "the double is two clicks at low Density");
    const double wide = starts.size() == 2 ? (starts[1] - starts[0]) / 48.0 : 0.0;
    starts.clear();
    EXPECT(bursts(hit(kCs, with(p::kDensity, 1.0f)), 0.1, 1.0, kRate, &starts) == 3, "and three at high Density");
    const double close = starts.size() == 3 ? (starts[1] - starts[0]) / 48.0 : 0.0;
    NOTE("double: %.1f ms apart at Density 0, %.1f ms at 1\n", wide, close);
    EXPECT_NEAR(wide, 30.0, 1.0, "30 ms apart at Density 0");
    EXPECT_NEAR(close, 12.0, 1.0, "12 ms apart at Density 1");

    int counts[3];
    double levels[3];
    const float settings[3] = {0.0f, 0.4f, 1.0f};
    for (int i = 0; i < 3; ++i) {
      std::vector<float> x = hit(kDs, with(p::kDensity, settings[i]));
      counts[i] = bursts(x, 0.1, 0.7);
      levels[i] = rms(x, 0, sounding(x));
    }
    NOTE("crackle bursts: Density 0 %d, 0.4 %d, 1 %d (rms %.1f, %.1f, %.1f dB)\n", counts[0], counts[1],
         counts[2], db(levels[0]), db(levels[1]), db(levels[2]));
    EXPECT(counts[0] < counts[1] && counts[1] < counts[2] && counts[2] >= 3 * counts[0],
           "Density fills the crackle with more impulses");
    EXPECT(levels[2] > 2.0 * levels[0], "which makes it denser, not only longer");

    const int expected[3] = {4, 7, 12};
    const double spacing[3] = {40.0, 28.8, 12.0};
    for (int i = 0; i < 3; ++i) {
      starts.clear();
      // A short grain, so that the closest repeats still stand apart.
      std::vector<float> x = hit(kAs, [&](GlitchKit& d) {
        d.set_param(p::kDensity, settings[i]);
        d.set_param(p::kLength, 0.5f);
      });
      const int count = bursts(x, 0.05, 2.0, kRate, &starts);
      const double apart_ms = starts.size() > 1 ? (starts[1] - starts[0]) / 48.0 : 0.0;
      NOTE("stutter at Density %.1f: %d grains %.1f ms apart\n", settings[i], count, apart_ms);
      EXPECT(count == expected[i], "Density sets the stutter's repeats from 4 to 12");
      EXPECT_NEAR(apart_ms, spacing[i], 0.5, "and their spacing from 40 to 12 ms");
    }
  }

  // Crush: fewer bits at a lower rate, the level kept.
  {
    std::vector<float> clean = hit(kE);
    std::vector<float> half = hit(kE, with(p::kCrush, 0.5f));
    std::vector<float> full = hit(kE, with(p::kCrush, 1.0f));
    const double a = off_harmonic(clean, 1318.51), b = off_harmonic(half, 1318.51), c = off_harmonic(full, 1318.51);
    NOTE("pip, strongest component off its harmonics: clean %.1f dB, Crush 0.5 %.1f dB, Crush 1 %.1f dB\n", db(a),
         db(b), db(c));
    EXPECT(a < 0.01, "a clean pip has nothing between its harmonics");
    EXPECT(c > 0.1 && c > 10.0 * a, "Crush 1 raises what is not a harmonic of the pip");
    EXPECT(b > a && b < c, "and Crush 0.5 lies between");
    const double level = db(rms(full, 0, 1920) / rms(clean, 0, 1920));
    NOTE("pip level at Crush 1: %+.2f dB\n", level);
    EXPECT(std::fabs(level) < 2.0, "Crush 1 keeps the pip's level within 2 dB");
    // The image of a 1318.5 Hz tone held at 6 kHz.
    EXPECT(tone_level(full, 6000.0 - 1318.51, kRate, 0, 1920) > 0.1 * tone_level(full, 1318.51, kRate, 0, 1920),
           "Crush 1 holds samples at about 6 kHz");
    // About 5 bits: a soft pop is a staircase of a few levels.
    {
      auto crushed = [](float crush) {
        return [crush](GlitchKit& d) {
          d.set_param(p::kCrush, crush);
          d.set_param(p::kTone, 1.0f);
        };
      };
      // Where the held signal has come to rest, the values it rests on.
      std::vector<float> x = hit(kD, crushed(1.0f), 1.0f, 0.0f);
      std::vector<float> seen;
      for (size_t i = 3; i < 960; ++i) {
        if (std::fabs(x[i] - x[i - 1]) > 1.0e-4f || std::fabs(x[i - 1] - x[i - 2]) > 1.0e-4f) continue;
        bool known = false;
        for (float value : seen) known = known || std::fabs(value - x[i]) < 0.004f;
        if (!known) seen.push_back(x[i]);
      }
      std::sort(seen.begin(), seen.end());
      double narrowest = 1.0, widest = 0.0;
      for (size_t i = 1; i < seen.size(); ++i) {
        narrowest = std::min(narrowest, static_cast<double>(seen[i] - seen[i - 1]));
        widest = std::max(widest, static_cast<double>(seen[i] - seen[i - 1]));
      }
      NOTE("softest pop at Crush 1: %zu levels, %.4f to %.4f apart\n", seen.size(), narrowest, widest);
      EXPECT(seen.size() >= 3 && seen.size() <= 8, "Crush 1 leaves the softest pop a few levels to sit on");
      // One step of 5 bits over the kit's half scale, with the makeup: 0.5 / 16 * 1.06.
      EXPECT(narrowest > 0.029 && widest < 0.037, "a thirty-second of the kit's working range apart: about 5 bits");
    }
    double worst = 0.0;
    for (int k = 0; k < 12; ++k) {
      std::vector<float> dry = hit(k), wet = hit(k, with(p::kCrush, 1.0f));
      const double change = db(rms(wet) / rms(dry));
      NOTE("%-8s level at Crush 1: %+.2f dB\n", kNames[k], change);
      worst = std::max(worst, std::fabs(change));
    }
    EXPECT(worst < 2.5, "Crush 1 keeps every voice's level within 2.5 dB");
  }

  // Volume.
  {
    const double unity = peak(hit(kE));
    EXPECT_NEAR(peak(hit(kE, with(p::kVolume, -12.0f))) / unity, 0.2512, 0.005, "Volume -12 dB is 12 dB down");
    EXPECT_NEAR(peak(hit(kE, with(p::kVolume, 6.0f))) / unity, 1.9953, 0.04, "Volume 6 dB is 6 dB up");
  }
}

// Velocity: a soft hit is quieter and duller.
static void test_velocity() {
  const double soft_pop = peak(hit(kD, 1.0f, 0.0f)), hard_pop = peak(hit(kD, 1.0f, 1.0f));
  NOTE("pop at velocity 0 over velocity 1: %.3f\n", soft_pop / hard_pop);
  EXPECT_NEAR(soft_pop / hard_pop, 0.25, 0.03, "the softest hit is a quarter of the hardest in amplitude");
  {
    // The click's band itself is lower for a soft hit.
    const double soft = dominant_frequency(hit(kC, 1.0f, 0.2f), kRate, 500.0, 12000.0, 0, 480);
    const double hard = dominant_frequency(hit(kC, 1.0f, 1.0f), kRate, 500.0, 12000.0, 0, 480);
    NOTE("click band: %.0f Hz soft, %.0f Hz hard\n", soft, hard);
    EXPECT(soft < 0.85 * hard && soft > 0.6 * hard, "a soft click is lower and rounder than a hard one");
    EXPECT(rms(hit(kC, 1.0f, 0.2f)) < 0.55 * rms(hit(kC, 1.0f, 1.0f)), "and quieter");
  }
  for (int key : {kF, kFs, kB}) {
    auto open = [](GlitchKit& d) { d.set_param(p::kTone, 1.0f); };
    std::vector<float> soft = hit(key, open, 1.0f, 0.2f), hard = hit(key, open, 1.0f, 1.0f);
    const double soft_share = energy_above(soft, 4000.0, kRate, 0, sounding(soft));
    const double hard_share = energy_above(hard, 4000.0, kRate, 0, sounding(hard));
    NOTE("%-8s soft over hard: level %.2f, share above 4 kHz %.3f against %.3f\n", kNames[key],
         rms(soft) / rms(hard), soft_share, hard_share);
    char label[96];
    std::snprintf(label, sizeof label, "a soft %s is quieter", kNames[key]);
    EXPECT(rms(soft) < 0.5 * rms(hard) && rms(soft) > 0.15 * rms(hard), label);
    std::snprintf(label, sizeof label, "and a soft %s is duller", kNames[key]);
    EXPECT(soft_share < 0.75 * hard_share, label);
  }
}

// Scatter: 0 repeats exactly, 1 differs from hit to hit.
static void test_scatter() {
  // At the default Spread, so the place repeats too.
  bool same = true;
  for (int k = 0; k < 12; ++k) {
    device.init(kRate);
    device.set_param(p::kScatter, 0.0f);
    device.note_on(1, key_hz(k), 0.7f);
    Stereo first = render(device, 1.5f, kRate);
    device.note_on(2, key_hz(k), 0.7f);
    Stereo second = render(device, 1.5f, kRate);
    if (first.left != second.left || first.right != second.right || peak(first.left) == 0.0) {
      same = false;
      std::printf("  the %s does not repeat\n", kNames[k]);
    }
  }
  EXPECT(same, "Scatter 0: every hit of a key is sample for sample the hit before it");

  // Scatter 1 on the pip: its pitch moves by up to, and not more than, about three semitones.
  {
    plain(device);
    device.set_param(p::kScatter, 1.0f);
    double lowest = 1.0e9, highest = -1.0e9, shortest = 1.0e9, longest = 0.0;
    for (int n = 0; n < 40; ++n) {
      device.note_on(n, key_hz(kE), 0.7f);
      std::vector<float> x = render(device, 0.5f, kRate).left;
      const double hz = dominant_frequency(x, kRate, 800.0, 2200.0, 0, sounding(x));
      const double semitones = 12.0 * std::log2(hz / 1318.51);
      lowest = std::min(lowest, semitones);
      highest = std::max(highest, semitones);
      shortest = std::min(shortest, sounding_ms(x));
      longest = std::max(longest, sounding_ms(x));
    }
    NOTE("pip at Scatter 1 over 40 hits: %+.2f to %+.2f semitones, %.1f to %.1f ms\n", lowest, highest, shortest,
         longest);
    EXPECT(highest - lowest > 3.0, "Scatter 1 moves the pip's pitch from hit to hit");
    EXPECT(highest < 3.1 && lowest > -3.1, "by no more than about three semitones");
    EXPECT(longest > 1.3 * shortest && longest < 2.2 * shortest, "and its length with it");
  }
  // The default moves it a little: still in tune to a fifth of a semitone.
  {
    plain(device);
    device.set_param(p::kScatter, 0.25f);
    double widest = 0.0;
    std::vector<float> first;
    bool differs = false;
    for (int n = 0; n < 24; ++n) {
      device.note_on(n, key_hz(kE), 0.7f);
      std::vector<float> x = render(device, 0.5f, kRate).left;
      if (n == 0) first = x;
      if (n > 0 && x != first) differs = true;
      const double hz = dominant_frequency(x, kRate, 800.0, 2200.0, 0, sounding(x));
      widest = std::max(widest, std::fabs(12.0 * std::log2(hz / 1318.51)));
    }
    NOTE("pip at the default Scatter: at most %.3f semitones off\n", widest);
    EXPECT(differs, "the default Scatter makes each hit differ a little");
    EXPECT(widest < 0.2 && widest > 0.02, "and keeps the pip within a fifth of a semitone");
  }
  // Level stays within about 6 dB for every voice, and the noises are new each time.
  double widest = 0.0;
  for (int k = 0; k < 12; ++k) {
    plain(device);
    device.set_param(p::kScatter, 1.0f);
    double quietest = 1.0e9, loudest = 0.0;
    std::vector<float> first;
    double least_apart = 1.0e9;
    for (int n = 0; n < 16; ++n) {
      device.note_on(n, key_hz(k), 0.7f);
      std::vector<float> x = render(device, 2.5f, kRate).left;
      quietest = std::min(quietest, peak(x));
      loudest = std::max(loudest, peak(x));
      if (n == 0) first = x;
      if (n > 0) least_apart = std::min(least_apart, apart(first, x));
    }
    NOTE("%-8s at Scatter 1 over 16 hits: peaks %.1f dB apart, least apart %.2f\n", kNames[k],
         db(loudest / quietest), least_apart);
    widest = std::max(widest, db(loudest / quietest));
    char label[96];
    std::snprintf(label, sizeof label, "Scatter 1 makes every %s differ from the first", kNames[k]);
    EXPECT(least_apart > 0.05, label);
    if (k == kF || k == kFs || k == kDs) {
      std::snprintf(label, sizeof label, "and the %s is new noise each time", kNames[k]);
      EXPECT(least_apart > 0.5, label);
    }
  }
  EXPECT(widest < 6.0, "Scatter 1 keeps every voice's hits within about 6 dB of each other");

  // The stutter's grain is chosen per hit: a pip or a click.
  {
    plain(device);
    device.set_param(p::kScatter, 0.25f);
    int pips = 0, clicks = 0;
    for (int n = 0; n < 24; ++n) {
      device.note_on(n, key_hz(kAs), 0.7f);
      std::vector<float> x = render(device, 0.5f, kRate).left;
      // A pip holds its level for 6 ms; a click has rung out by then.
      const double tail = rms(x, 144, 240) / rms(x, 0, 96);
      (tail > 0.5 ? pips : clicks) += 1;
    }
    NOTE("stutter at the default Scatter: %d pip grains, %d click grains of 24\n", pips, clicks);
    EXPECT(pips >= 5 && clicks >= 5, "the stutter's grain is a pip or a click, chosen per hit");
  }

  // The same notes after another init are the same samples, whatever Scatter is.
  {
    std::vector<Event> bar = busy_bar(kRate, 0.8f);
    device.init(kRate);
    device.set_param(p::kScatter, 1.0f);
    Stereo a = play(device, bar, 96000, 128);
    device.init(kRate);
    device.set_param(p::kScatter, 1.0f);
    Stereo b = play(device, bar, 96000, 128);
    EXPECT(a.left == b.left && a.right == b.right && peak(a.left) > 0.01,
           "the same notes give the same samples after another init");
  }
}

// Spread: 0 is mono, 1 throws hits apart; the pop stays in the centre.
static void test_spread() {
  bool mono = true;
  device.init(kRate);
  device.set_param(p::kSpread, 0.0f);
  device.set_param(p::kScatter, 1.0f);
  device.set_param(p::kCrush, 0.4f);
  for (int n = 0; n < 36; ++n) {
    device.note_on(n, key_hz(n % 12, n % 3 - 1), 0.8f);
    Stereo out = render(device, 0.1f, kRate);
    if (out.left != out.right || peak(out.left) == 0.0) mono = false;
  }
  EXPECT(mono, "Spread 0 is exactly mono");

  auto balance = [](const Stereo& s) { return db(rms(s.left) / rms(s.right)); };
  {
    device.init(kRate);
    device.set_param(p::kSpread, 1.0f);
    double leftmost = -1.0e9, rightmost = 1.0e9, last = 0.0;
    int moved = 0;
    for (int n = 0; n < 12; ++n) {
      device.note_on(n, key_hz(kC), 0.7f);
      const double at = balance(render(device, 0.25f, kRate));
      leftmost = std::max(leftmost, at);
      rightmost = std::min(rightmost, at);
      if (n > 0 && std::fabs(at - last) > 0.5) ++moved;
      last = at;
    }
    NOTE("clicks at Spread 1: balance from %+.1f dB to %+.1f dB, %d of 11 moved\n", leftmost, rightmost, moved);
    EXPECT(leftmost - rightmost > 6.0, "Spread 1 throws successive clicks to different places");
    EXPECT(moved >= 9, "each click to a place of its own");
    EXPECT(leftmost > 1.0 && rightmost < -1.0, "to both sides");

    double widest = 0.0;
    for (int n = 0; n < 12; ++n) {
      device.note_on(n, key_hz(kD), 0.7f);
      widest = std::max(widest, std::fabs(balance(render(device, 0.25f, kRate))));
    }
    NOTE("pops at Spread 1: within %.3f dB of the centre\n", widest);
    EXPECT(widest < 0.5, "the pop stays within 0.5 dB of the centre at Spread 1");
  }
  {
    // Less Spread, less throw.
    double wide = 0.0, narrow = 0.0;
    for (float spread : {1.0f, 0.3f}) {
      device.init(kRate);
      device.set_param(p::kSpread, spread);
      double sum = 0.0;
      for (int n = 0; n < 16; ++n) {
        device.note_on(n, key_hz(kE), 0.7f);
        sum += std::fabs(balance(render(device, 0.25f, kRate)));
      }
      (spread == 1.0f ? wide : narrow) = sum / 16.0;
    }
    NOTE("pips, mean distance from the centre: %.2f dB at Spread 1, %.2f dB at 0.3\n", wide, narrow);
    EXPECT(narrow < 0.5 * wide && narrow > 0.05, "Spread sets how far the hits are thrown");
  }
  {
    // With Scatter at 0 each voice keeps a place of its own.
    double places[12];
    for (int k = 0; k < 12; ++k) {
      device.init(kRate);
      device.set_param(p::kSpread, 1.0f);
      device.set_param(p::kScatter, 0.0f);
      device.note_on(1, key_hz(k), 0.7f);
      places[k] = balance(render(device, 1.0f, kRate));
    }
    int lefts = 0, rights = 0;
    for (int k = 0; k < 12; ++k) {
      lefts += places[k] > 1.0 ? 1 : 0;
      rights += places[k] < -1.0 ? 1 : 0;
    }
    NOTE("places at Scatter 0: %d voices left, %d right, click %+.1f dB, static %+.1f dB\n", lefts, rights,
         places[kC], places[kFs]);
    EXPECT(lefts >= 4 && rights >= 4 && std::fabs(places[kD]) < 0.01, "the voices sit apart around a centred pop");
    // Thrown or not, a hit is as loud: the two sides share one power.
    device.init(kRate);
    device.set_param(p::kSpread, 1.0f);
    device.set_param(p::kScatter, 0.0f);
    device.note_on(1, key_hz(kFs), 0.7f);
    Stereo thrown = render(device, 1.0f, kRate);
    std::vector<float> centred = hit(kFs);
    const double power = rms(thrown.left) * rms(thrown.left) + rms(thrown.right) * rms(thrown.right);
    EXPECT_NEAR(10.0 * std::log10(power / (2.0 * rms(centred) * rms(centred))), 0.0, 0.1,
                "a thrown hit has the power of a centred one");
  }
}

// --- striking a key again -------------------------------------------------------------------

// The largest third difference: what a cut leaves in a smooth tone.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

// The tone filter is open: closed, it rounds a cut off into something no
// steeper than the tones themselves.
static std::vector<float> struck(int key, const std::vector<size_t>& at, size_t total, float edge = -1.0f) {
  plain(device);
  device.set_param(p::kTone, 1.0f);
  if (edge >= 0.0f) device.set_param(p::kEdge, edge);
  std::vector<Event> events;
  for (size_t when : at) events.push_back({when, key, 0, 0.7f});
  return play(device, events, total, 128).left;
}

static void test_retrigger() {
  // The same key every 20 ms for a second: no step larger than the hit's own, and bounded.
  for (int k = 0; k < 12; ++k) {
    std::vector<float> once = struck(k, {0}, 48000);
    std::vector<size_t> every;
    for (size_t at = 0; at < 48000; at += 960) every.push_back(at);
    std::vector<float> many = struck(k, every, 72000);
    NOTE("%-8s every 20 ms: step %.2f of one hit's, peak %.2f of one hit's\n", kNames[k],
         max_step(many) / max_step(once), peak(many) / peak(once));
    char label[112];
    std::snprintf(label, sizeof label, "the %s struck every 20 ms makes no step larger than its own attack", kNames[k]);
    // The bit is steps already, and two of them can step together while one fades.
    EXPECT(max_step(many) < (k == kB ? 2.0 : 1.25) * max_step(once), label);
    std::snprintf(label, sizeof label, "the %s struck every 20 ms stays bounded", kNames[k]);
    EXPECT(peak(many) < 1.6 * peak(once) && finite(many), label);
    EXPECT(peak(many, 60000) == 0.0, "and ends");
  }

  // Struck inside its own ring, the smooth voices show a cut most plainly:
  // the older hit fades over about 4 ms instead of stopping.
  for (int key : {kE, kD}) {
    std::vector<float> once = struck(key, {0}, 9600, 0.0f);
    const size_t again = key == kE ? 480 : 300;
    std::vector<float> twice = struck(key, {0, again}, 9600, 0.0f);
    // What is left of the first hit: both, less the second alone.
    std::vector<float> rest(twice.size(), 0.0f);
    for (size_t i = 0; i < twice.size(); ++i) rest[i] = twice[i] - (i >= again ? once[i - again] : 0.0f);
    const double before = largest_difference(std::vector<float>(rest.begin(), rest.begin() + again),
                                             std::vector<float>(once.begin(), once.begin() + again));
    const double early = rms(rest, again, again + 48) / rms(once, again, again + 48);
    const double half = rms(rest, again + 72, again + 120) / rms(once, again + 72, again + 120);
    const double late = peak(rest, again + 240) / peak(once);
    NOTE("%-8s struck again: older hit at %.2f in the first ms, %.2f after 2 ms, %.1e after 5 ms; kink %.2f of one hit's\n",
         kNames[key], early, half, late, kink(twice) / kink(once));
    char label[112];
    std::snprintf(label, sizeof label, "a %s struck again leaves the first hit alone until then", kNames[key]);
    EXPECT(before < 1.0e-6, label);
    std::snprintf(label, sizeof label, "the older %s is still there a millisecond later", kNames[key]);
    EXPECT(early > 0.7, label);
    EXPECT(half > 0.3 && half < 0.7, "the older hit is about half gone after 2 ms");
    EXPECT(late < 1.0e-4, "and gone after 5 ms");
    std::snprintf(label, sizeof label, "striking a %s again leaves no cut in it", kNames[key]);
    EXPECT(kink(twice) < 1.5 * kink(once), label);
  }
  {
    // A third strike inside the fade: both slots are sounding, and the one
    // that is taken runs out instead of stopping.
    std::vector<float> once = struck(kE, {0}, 9600, 0.0f);
    // The third lands on a crest of the first, two thirds of the way through its fade.
    std::vector<float> thrice = struck(kE, {0, 300, 365}, 9600, 0.0f);
    NOTE("pip struck three times in 8 ms: step %.2f of one hit's, peak %.2f\n", max_step(thrice) / max_step(once),
         peak(thrice) / peak(once));
    EXPECT(max_step(thrice) < 1.6 * max_step(once), "a third strike inside the fade makes no step");
    EXPECT(peak(thrice) < 2.0 * peak(once), "and stays bounded");
    EXPECT(peak(thrice, 365 + 1920 + 96) == 0.0, "and what was left of the taken hit has run out with the others");
  }
  {
    // Keys never take from each other: two different hits are the sum of the two.
    std::vector<float> pip = struck(kE, {0}, 9600);
    std::vector<float> click = struck(kC, {0}, 9600);
    plain(device);
    device.set_param(p::kTone, 1.0f);
    Stereo both = play(device, {{0, kE, 0, 0.7f}, {240, kC, 0, 0.7f}}, 9600, 128);
    double worst = 0.0;
    for (size_t i = 0; i < 9600; ++i) {
      const double sum = pip[i] + (i >= 240 ? click[i - 240] : 0.0f);
      worst = std::max(worst, std::fabs(both.left[i] - sum));
    }
    NOTE("pip and click together against their sum: %.1e\n", worst);
    EXPECT(worst < 1.0e-6, "a click does not disturb a ringing pip");
  }
  {
    // A hit is a one-shot: letting go changes nothing, whatever the id.
    plain(device);
    device.note_on(7, key_hz(kFs), 0.7f);
    Stereo held = render(device, 0.5f, kRate);
    plain(device);
    device.note_on(7, key_hz(kFs), 0.7f);
    device.note_off(7);
    device.note_off(99);
    device.note_off(-3);
    Stereo let_go = render(device, 0.5f, kRate);
    EXPECT(held.left == let_go.left && held.right == let_go.right, "a release does nothing to a hit");
  }
}

// --- level ----------------------------------------------------------------------------------

static void test_levels() {
  double pop = 0.0, loudest_other = -1.0e9;
  bool in_range = true;
  for (int k = 0; k < 12; ++k) {
    device.init(kRate);  // the default patch, as it is first heard
    double lowest = 1.0e9, highest = -1.0e9, first = 0.0;
    std::vector<float> first_mid;
    for (int n = 0; n < 8; ++n) {
      device.note_on(n, key_hz(k), 0.7f);
      Stereo out = render(device, 1.0f, kRate);
      const double level = db(std::max(peak(out.left), peak(out.right)));
      if (n == 0) {
        first = level;
        first_mid = out.left;
        for (size_t i = 0; i < first_mid.size(); ++i) first_mid[i] = 0.5f * (out.left[i] + out.right[i]);
      }
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    const size_t n = sounding(first_mid);
    NOTE("%-8s default patch, velocity 0.7: peak %.1f dBFS (%.1f to %.1f over 8 hits), %.1f ms to -60 dB, "
         "strongest at %.0f Hz, share above 2 kHz %.2f\n",
         kNames[k], first, lowest, highest, sounding_ms(first_mid),
         dominant_frequency(first_mid, kRate, 40.0, 12000.0, 0, n), energy_above(first_mid, 2000.0, kRate, 0, n));
    if (lowest < -20.0 || highest > -10.0) {
      in_range = false;
      std::printf("  the %s peaks from %.1f to %.1f dBFS\n", kNames[k], lowest, highest);
    }
    if (k == kD) {
      pop = lowest;
    } else {
      loudest_other = std::max(loudest_other, highest);
    }
  }
  EXPECT(in_range, "one hit at velocity 0.7 peaks between -20 and -10 dBFS for every voice");
  EXPECT(pop > loudest_other, "the pop is the strongest voice of the kit");

  device.init(kRate);
  Stereo bar = play(device, busy_bar(kRate, 0.9f, 2), 4 * 48000 + 24000, 128);
  NOTE("a busy bar at velocity 0.9 peaks at %.2f\n", std::max(peak(bar.left), peak(bar.right)));
  EXPECT(peak(bar.left) < 0.9 && peak(bar.right) < 0.9, "a busy bar stays under the clip knee");
  EXPECT(peak(bar.left) > 0.1, "and is not faint");

  // Every key at once, as loud as it goes: the soft clip holds it.
  device.init(kRate);
  device.set_param(p::kVolume, 6.0f);
  device.set_param(p::kSpread, 0.0f);
  device.set_param(p::kEdge, 1.0f);
  for (int k = 0; k < 12; ++k) device.note_on(k, key_hz(k), 1.0f);
  Stereo pile = render(device, 0.5f, kRate);
  NOTE("all twelve keys at once at 6 dB: peak %.3f\n", peak(pile.left));
  EXPECT(peak(pile.left) <= 1.0 && peak(pile.left) > 0.8, "a pile of hits is rounded off under full scale");
}

// --- other sample rates ---------------------------------------------------------------------

static void test_rates() {
  struct Reading {
    double length_ms[12], level_db[12];
    double pip_hz, click_hz, pop_ms, buzz_ms, bit_ms, zap_end, chirp_start, cut_rms, cut_bright, static_steps;
  };
  auto read = [](float rate) {
    Reading r;
    auto open = [](GlitchKit& d) { d.set_param(p::kEdge, 0.0f); };
    for (int k = 0; k < 12; ++k) {
      std::vector<float> x = hit(k, 1.0f, 0.7f, 0, rate);
      r.length_ms[k] = sounding_ms(x, rate);
      r.level_db[k] = db(peak(x));
    }
    const size_t ms = static_cast<size_t>(rate / 1000.0f);
    std::vector<float> pip = hit(kE, 1.0f, 0.7f, 0, rate);
    r.pip_hz = dominant_frequency(pip, rate, 400.0, 8000.0, 0, 40 * ms);
    r.click_hz = dominant_frequency(hit(kC, 1.0f, 0.7f, 0, rate), rate, 500.0, 12000.0, 0, 10 * ms);
    r.pop_ms = 1000.0 * half_period(hit(kD, open, 1.0f, 0.7f, 0, rate)) / rate;
    std::vector<float> buzz = hit(kG, 1.0f, 0.7f, 0, rate);
    r.buzz_ms = 1000.0 * repeat_lag(buzz, sounding(buzz), static_cast<int>(rate / 160.0f), static_cast<int>(rate / 70.0f)) / rate;
    std::vector<float> bit = hit(kB, 1.0f, 0.7f, 0, rate);
    r.bit_ms = 1000.0 * repeat_lag(bit, sounding(bit), static_cast<int>(rate / 120.0f), static_cast<int>(rate / 60.0f)) / rate;
    std::vector<float> zap = hit(kGs, 1.0f, 0.7f, 0, rate);
    r.zap_end = dominant_frequency(zap, rate, 150.0, 12000.0, 35 * ms, 40 * ms);
    std::vector<float> chirp = hit(kA, 1.0f, 0.7f, 0, rate);
    r.chirp_start = dominant_frequency(chirp, rate, 300.0, 12000.0, 0, 4 * ms);
    std::vector<float> cut = hit(kF, 1.0f, 0.7f, 0, rate);
    r.cut_rms = db(rms(cut, 5 * ms, 45 * ms));
    r.cut_bright = energy_above(cut, 2000.0, rate, 0, 50 * ms);
    r.static_steps = crossings(hit(kFs, 1.0f, 0.7f, 0, rate), 0, 100 * ms) / 0.1;
    return r;
  };
  const Reading base = read(48000.0f);
  for (float rate : {44100.0f, 96000.0f}) {
    const Reading r = read(rate);
    double length = 0.0, level = 0.0;
    for (int k = 0; k < 12; ++k) {
      length = std::max(length, std::fabs(r.length_ms[k] / base.length_ms[k] - 1.0));
      level = std::max(level, std::fabs(r.level_db[k] - base.level_db[k]));
    }
    NOTE("%.0f Hz against 48 kHz: lengths within %.1f %%, peaks within %.2f dB, pip %.2f Hz, click %.0f Hz, "
         "pop %.3f ms, buzz %.3f ms, bit loop %.3f ms, zap end %.0f Hz, chirp start %.0f Hz, cut %.2f dB and "
         "%.3f above 2 kHz (48 kHz: %.2f dB, %.3f), static %.0f steps (%.0f)\n",
         rate, 100.0 * length, level, r.pip_hz, r.click_hz, r.pop_ms, r.buzz_ms, r.bit_ms, r.zap_end,
         r.chirp_start, r.cut_rms, r.cut_bright, base.cut_rms, base.cut_bright, r.static_steps, base.static_steps);
    char label[112];
    std::snprintf(label, sizeof label, "every voice lasts as long at %.0f Hz as at 48 kHz", rate);
    EXPECT(length < 0.04, label);
    std::snprintf(label, sizeof label, "every voice is as loud at %.0f Hz as at 48 kHz", rate);
    EXPECT(level < 1.0, label);
    std::snprintf(label, sizeof label, "the pitches are the same at %.0f Hz", rate);
    EXPECT(std::fabs(r.pip_hz / base.pip_hz - 1.0) < 0.002 && std::fabs(r.click_hz / base.click_hz - 1.0) < 0.03 &&
               std::fabs(r.pop_ms / base.pop_ms - 1.0) < 0.03 && std::fabs(r.buzz_ms / base.buzz_ms - 1.0) < 0.01 &&
               std::fabs(r.bit_ms / base.bit_ms - 1.0) < 0.01 && std::fabs(r.zap_end / base.zap_end - 1.0) < 0.05 &&
               std::fabs(r.chirp_start / base.chirp_start - 1.0) < 0.05,
           label);
    std::snprintf(label, sizeof label, "the cut's noise is as loud and about as bright at %.0f Hz", rate);
    EXPECT(std::fabs(r.cut_rms - base.cut_rms) < 1.0 && std::fabs(r.cut_bright - base.cut_bright) < 0.1, label);
    std::snprintf(label, sizeof label, "the static's grain is the same at %.0f Hz", rate);
    EXPECT(std::fabs(r.static_steps / base.static_steps - 1.0) < 0.15, label);
  }
}

// --- moving the smoothed controls -----------------------------------------------------------

static void test_smoothing() {
  // A long, soft, pure tone to hear a jump against: the pip at Length 4.
  auto long_pip = [](GlitchKit& d) {
    plain(d);
    d.set_param(p::kLength, 4.0f);
    d.set_param(p::kEdge, 0.0f);
    d.note_on(1, key_hz(kE, -1), 0.7f);
  };
  long_pip(device);
  std::vector<float> steady = render(device, 0.2f, kRate).left;
  const double own_step = max_step(steady), own_kink = kink(steady);

  auto thrown = [&](int id, float low, float high) {
    long_pip(device);
    std::vector<float> out;
    for (int n = 0; n < 70; ++n) {
      device.set_param(id, n % 2 == 0 ? low : high);
      std::vector<float> part = render(device, 101.0f / kRate, kRate, 101).left;
      out.insert(out.end(), part.begin(), part.end());
    }
    return out;
  };
  {
    std::vector<float> x = thrown(p::kVolume, -24.0f, 0.0f);
    NOTE("volume thrown under a pip: step %.2f of the tone's own, kink %.2f\n", max_step(x) / own_step,
         kink(x) / own_kink);
    EXPECT(max_step(x) < 1.2 * own_step, "Volume thrown across its range under a ringing pip makes no step");
    // The smoother starts each move at once, which is a corner of its own;
    // a jump would be a thousand times the tone's.
    EXPECT(kink(x) < 12.0 * own_kink, "and no corner");
    EXPECT(peak(x) < 0.9 * peak(steady) && rms(x, 3000, 6000) < 0.8 * rms(steady, 3000, 6000), "while it does move the level");
  }
  {
    std::vector<float> x = thrown(p::kTone, 0.0f, 1.0f);
    NOTE("tone thrown under a pip: step %.2f of the tone's own, kink %.2f\n", max_step(x) / own_step,
         kink(x) / own_kink);
    EXPECT(max_step(x) < 1.2 * own_step, "Tone thrown across its range under a ringing pip makes no step");
    EXPECT(kink(x) < 4.0 * own_kink, "and no corner");
  }

  // A control moved in silence has arrived when the next hit starts: asleep,
  // or still awake a few milliseconds after the last hit.
  for (float wait : {0.012f, 0.3f}) {
    plain(device);
    device.note_on(1, key_hz(kC), 0.7f);
    render(device, wait, kRate);
    device.set_param(p::kVolume, -12.0f);
    device.set_param(p::kTone, 0.1f);
    device.set_param(p::kCrush, 0.6f);
    render(device, 0.002f, kRate);
    device.note_on(2, key_hz(kE), 0.7f);
    Stereo moved = render(device, 0.25f, kRate);

    plain(other);
    other.set_param(p::kVolume, -12.0f);
    other.set_param(p::kTone, 0.1f);
    other.set_param(p::kCrush, 0.6f);
    other.note_on(2, key_hz(kE), 0.7f);
    Stereo fresh = render(other, 0.25f, kRate);
    const double difference = largest_difference(moved.left, fresh.left) / peak(fresh.left);
    NOTE("controls moved %.0f ms after a click, then a pip: %.1e from a kit set that way\n", 1000.0 * wait, difference);
    EXPECT(difference < 1.0e-5, "controls moved in a silence are in place for the next hit");
  }
}

// --- block size -----------------------------------------------------------------------------

static void test_blocks() {
  static const int ragged[8] = {1, 7, 64, 128, 33, 512, 2048, 5};
  auto phrase = [&](int block, bool use_ragged, size_t gap) {
    device.init(kRate);
    device.set_param(p::kScatter, 0.6f);
    device.set_param(p::kCrush, 0.3f);
    std::vector<Event> events = busy_bar(kRate, 0.8f);
    // Then a hit after a silence about as long as it takes to fall asleep.
    events.push_back({96000 + gap, kFs, 0, 0.8f});
    events.push_back({96000 + gap + 9600, kE, 0, 0.8f});
    return play(device, events, 96000 + gap + 48000, block, use_ragged ? ragged : nullptr, 8);
  };
  double worst = 0.0;
  for (size_t gap = 9600; gap <= 16800; gap += 720) {
    Stereo reference = phrase(128, false, gap);
    for (int block : {1, 2048}) {
      Stereo out = phrase(block, false, gap);
      worst = std::max(worst, largest_difference(out.left, reference.left));
      worst = std::max(worst, largest_difference(out.right, reference.right));
    }
    Stereo out = phrase(0, true, gap);
    worst = std::max(worst, largest_difference(out.left, reference.left));
  }
  NOTE("block sizes 1, 2048 and ragged against 128: %.1e apart\n", worst);
  EXPECT(worst < 1.0e-6, "the output does not depend on the block size, across a silence or not");
}

int main() {
  Conformance spec;
  spec.name = "glitch-kit";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The longest voice at the default settings is the crackle, 0.4 s two
  // octaves down; at Length 4, tuned all the way down and scattered, it runs 3.1 s.
  spec.tail_seconds = 4.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_keys();
  test_voices();
  test_controls();
  test_velocity();
  test_scatter();
  test_spread();
  test_retrigger();
  test_levels();
  test_rates();
  test_smoothing();
  test_blocks();

  // The longest any hit can ring: Length 4, two octaves and Tune down, and it ends.
  {
    device.init(kRate);
    device.set_param(p::kLength, 4.0f);
    device.set_param(p::kTune, -12.0f);
    device.set_param(p::kScatter, 1.0f);
    for (int k = 0; k < 12; ++k) device.note_on(k, key_hz(k, -2), 1.0f);
    render(device, 4.0f, kRate);
    Stereo after = render(device, 0.5f, kRate);
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "the longest hits have ended after 4 s");
  }

  // Cost of a busy bar, looped for 10 s.
  device.init(kRate);
  const std::vector<Event> bars = busy_bar(kRate, 0.8f, 5);
  report_cost("glitch-kit (a busy bar for 10 s)", 10.0f, kRate, [&] { play(device, bars, 480000, 128); });

  return finish("glitch-kit");
}
