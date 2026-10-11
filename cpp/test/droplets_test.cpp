// Native harness for Droplets (cpp/devices/droplets). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest measures what makes it rain: when the drops
// land, on which notes, what each surface sounds like, how the rain trails
// off, and that none of it depends on the host's block size.
//
// Nobody listens here. Drops are found in the audio itself: every drop opens
// with a tick of noise far above the notes used, and the tick is what the
// detector hears (see onsets()). A pulse (Loose 0) has a known number of
// drops, which is how the detector is checked before it is trusted.

#include "../devices/droplets/droplets.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Droplets;
namespace p = livemix::droplets;

static Droplets device;
static livemix::kit::Fft<16384> fft;

static const float kRate = 48000.0f;
enum Material : int { kGlass = 0, kWood, kMetal, kWater, kFelt, kMaterials };
static const char* const kNames[kMaterials] = {"glass", "wood", "metal", "water", "felt"};

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate + 0.5); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

// Level of the middle (what a mono listener, and the preset bench, hears).
static double mid_rms(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, s.size());
  if (to <= from) return 0.0;
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) {
    const double mid = 0.5 * (static_cast<double>(s.left[i]) + s.right[i]);
    sum += mid * mid;
  }
  return std::sqrt(sum / static_cast<double>(to - from));
}

// The loudest 400 ms of [from, to), in steps of 100 ms: the bench's "loudest".
static double loudest_400ms(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, s.size());
  double loudest = 0.0;
  for (size_t start = from; start + at(0.4) <= to; start += at(0.1)) {
    loudest = std::max(loudest, mid_rms(s, start, start + at(0.4)));
  }
  return loudest;
}

// Drops made to be counted: short, all as loud as each other, in the middle,
// on the key's own octave, each with the loudest and shortest tick.
static void ticking(Droplets& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMaterial, kGlass);
  d.set_param(p::kSize, 0.0f);
  d.set_param(p::kRing, 0.25f);
  d.set_param(p::kSoft, 0.0f);
  d.set_param(p::kSplash, 1.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kTrail, 0.0f);
}

// One drop alone: the key's own, with the rain as slow as it goes and even,
// so the next drop is 3.3 s away. No splash, in the middle.
static void single(Droplets& d, int material, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMaterial, static_cast<float>(material));
  d.set_param(p::kRain, 0.3f);
  d.set_param(p::kLoose, 0.0f);
  d.set_param(p::kSplash, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kSize, 0.5f);
}

struct Highpass {
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  Highpass(double hz, double rate) {
    const double w = 2.0 * kPi * hz / rate, cosw = std::cos(w), alpha = std::sin(w) / std::sqrt(2.0);
    const double a0 = 1.0 + alpha;
    b0 = (1.0 + cosw) * 0.5 / a0;
    b1 = -(1.0 + cosw) / a0;
    b2 = b0;
    a1 = -2.0 * cosw / a0;
    a2 = (1.0 - alpha) / a0;
  }
  double tick(double x) {
    const double y = b0 * x + z1;
    z1 = b1 * x - a1 * y + z2;
    z2 = b2 * x - a2 * y;
    return y;
  }
};

// The output above 6 kHz (fourth order), the louder side, followed by a peak
// detector that lets go in a third of a millisecond: the ticks.
static std::vector<float> tick_envelope(const Stereo& s, double rate) {
  Highpass left_a(6000.0, rate), left_b(6000.0, rate), right_a(6000.0, rate), right_b(6000.0, rate);
  const double fall = std::exp(-1.0 / (0.0003 * rate));
  std::vector<float> envelope(s.size());
  double level = 0.0;
  for (size_t i = 0; i < s.size(); ++i) {
    const double left = std::fabs(left_b.tick(left_a.tick(s.left[i])));
    const double right = std::fabs(right_b.tick(right_a.tick(s.right[i])));
    level = std::max(std::max(left, right), level * fall);
    envelope[i] = static_cast<float>(level);
  }
  return envelope;
}

// When drops land, in seconds: where the ticks rise through an eighth of the
// loudest tick (`loudest`, or the render's own), having been under a thirtieth
// of it and half a millisecond gone since the last. Two drops less than about
// a millisecond apart count as one.
static std::vector<double> onsets(const Stereo& s, double rate = kRate, double loudest = 0.0) {
  const std::vector<float> envelope = tick_envelope(s, rate);
  if (loudest <= 0.0) loudest = peak(envelope);
  const double on = 0.125 * loudest, off = 0.033 * loudest;
  const size_t apart = static_cast<size_t>(0.0005 * rate);
  std::vector<double> times;
  bool armed = true;
  size_t last = 0;
  for (size_t i = 0; i < envelope.size(); ++i) {
    if (armed && envelope[i] > on && (times.empty() || i - last >= apart)) {
      times.push_back(static_cast<double>(i) / rate);
      last = i;
      armed = false;
    } else if (!armed && envelope[i] < off) {
      armed = true;
    }
  }
  return times;
}

struct Gaps {
  double mean = 0.0, spread = 0.0, median = 0.0, longest = 0.0;
  double under_half = 0.0;  // share of the gaps shorter than half the mean
  size_t count = 0;
};

// The gaps between drops landing from `from` seconds on: `spread` is their
// standard deviation over their mean.
static Gaps gaps_of(const std::vector<double>& times, double from = 0.0) {
  std::vector<double> gaps;
  for (size_t i = 1; i < times.size(); ++i) {
    if (times[i - 1] >= from) gaps.push_back(times[i] - times[i - 1]);
  }
  Gaps out;
  out.count = gaps.size();
  if (gaps.empty()) return out;
  for (double g : gaps) out.mean += g;
  out.mean /= static_cast<double>(gaps.size());
  double var = 0.0;
  size_t under = 0;
  for (double g : gaps) {
    var += (g - out.mean) * (g - out.mean);
    out.longest = std::max(out.longest, g);
    if (g < 0.5 * out.mean) ++under;
  }
  out.spread = std::sqrt(var / static_cast<double>(gaps.size())) / out.mean;
  out.under_half = static_cast<double>(under) / static_cast<double>(gaps.size());
  std::sort(gaps.begin(), gaps.end());
  out.median = gaps[gaps.size() / 2];
  return out;
}

static size_t count_in(const std::vector<double>& times, double from, double to) {
  size_t count = 0;
  for (double t : times) count += (t >= from && t < to) ? 1 : 0;
  return count;
}

// The strongest frequency in [lo, hi] over [from, to), whatever it is: the
// highest bin of a Hann-windowed FFT (the first 16384 samples of the span),
// then Goertzel scans closing in on it, as dominant_frequency does.
static double strongest(const std::vector<float>& x, double rate, double lo, double hi, size_t from, size_t to) {
  static float re[16384], im[16384];
  to = std::min(to, x.size());
  if (to <= from) return 0.0;
  const size_t n = std::min<size_t>(to - from, 16384);
  for (size_t i = 0; i < 16384; ++i) {
    const double w = i < n ? 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n)) : 0.0;
    re[i] = i < n ? static_cast<float>(w * x[from + i]) : 0.0f;
    im[i] = 0.0f;
  }
  fft.forward(re, im);
  const double bin = rate / 16384.0;
  double best = -1.0, best_hz = lo;
  for (size_t k = static_cast<size_t>(lo / bin) + 1; k < 8192 && static_cast<double>(k) * bin <= hi; ++k) {
    const double power = static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
    if (power > best) {
      best = power;
      best_hz = static_cast<double>(k) * bin;
    }
  }
  double span = bin, level = -1.0;
  for (int pass = 0; pass < 4; ++pass) {
    const double centre = best_hz;
    for (int i = -10; i <= 10; ++i) {
      const double hz = centre + span * i / 10.0;
      if (hz <= 0.0) continue;
      const double here = tone_level(x, hz, rate, from, from + n);
      if (here > level) {
        level = here;
        best_hz = hz;
      }
    }
    span /= 8.0;
  }
  return best_hz;
}

// When drops land, on any surface and however soft, for drops at least 20 ms
// apart: the same passage rendered with Splash and without differs by the
// splashes alone (nothing else reads Splash, and the device is the same
// after every init), and between two splashes that difference is exactly
// nothing. `setup(device, splash)` sets the device up and plays; the render
// with the splash is left in `heard`.
template <typename Setup>
static std::vector<double> splashes(Setup setup, float seconds, Stereo* heard, float splash = 0.6f) {
  setup(device, 0.0f);
  const Stereo without = render(device, seconds, kRate);
  setup(device, splash);
  *heard = render(device, seconds, kRate);
  std::vector<float> envelope(without.size());
  const double fall = std::exp(-1.0 / (0.0003 * kRate));
  double level = 0.0, loudest = 0.0;
  for (size_t i = 0; i < without.size(); ++i) {
    const double left = std::fabs(static_cast<double>(heard->left[i]) - without.left[i]);
    const double right = std::fabs(static_cast<double>(heard->right[i]) - without.right[i]);
    level = std::max(std::max(left, right), level * fall);
    envelope[i] = static_cast<float>(level);
    loudest = std::max(loudest, level);
  }
  std::vector<double> times;
  bool armed = true;
  size_t last = 0;
  for (size_t i = 0; i < envelope.size(); ++i) {
    if (armed && envelope[i] > 3.0e-4 * loudest && (times.empty() || i - last >= at(0.02))) {
      times.push_back(static_cast<double>(i) / kRate);
      last = i;
      armed = false;
    } else if (!armed && envelope[i] < 1.0e-4 * loudest) {
      armed = true;
    }
  }
  return times;
}

// A drop found in a render: when it landed, the pitch it rings at, which of
// the held keys and which octave above it that is nearest, how far off in
// cents, how loud it is on each side.
struct Found {
  double time = 0.0, hz = 0.0, off = 0.0, left = 0.0, right = 0.0;
  int key = -1, octave = -1;
};

// Every drop of a render, measured over `listen` seconds after it lands
// (drops must be further apart than that). The pitch is the strongest
// frequency under 6 kHz, wherever it is.
static std::vector<Found> survey(const Stereo& s, const std::vector<double>& times, const std::vector<double>& keys,
                                 double listen, double rate = kRate, double skip = 0.004) {
  std::vector<Found> drops;
  for (double time : times) {
    const size_t from = at(time + skip, rate), to = at(time + listen, rate);
    if (to > s.size()) break;
    Found drop;
    drop.time = time;
    drop.left = peak(s.left, from, to);
    drop.right = peak(s.right, from, to);
    const std::vector<float>& louder = drop.left >= drop.right ? s.left : s.right;
    drop.hz = strongest(louder, rate, 40.0, 6000.0, from, to);
    drop.off = 1.0e9;
    for (size_t k = 0; k < keys.size(); ++k) {
      for (int octave = 0; octave <= 4; ++octave) {
        const double off = cents(drop.hz, keys[k] * std::pow(2.0, octave));
        if (std::fabs(off) < std::fabs(drop.off)) {
          drop.off = off;
          drop.key = static_cast<int>(k);
          drop.octave = octave;
        }
      }
    }
    drops.push_back(drop);
  }
  return drops;
}

// The frequency with half of the power of [from, to) under it (the first
// 16384 samples of the span).
static double middle_frequency(const std::vector<float>& x, double rate, size_t from, size_t to) {
  static float re[16384], im[16384];
  to = std::min(to, x.size());
  const size_t n = std::min<size_t>(to - from, 16384);
  for (size_t i = 0; i < 16384; ++i) {
    re[i] = i < n ? x[from + i] : 0.0f;
    im[i] = 0.0f;
  }
  fft.forward(re, im);
  double total = 0.0;
  for (size_t k = 1; k < 8192; ++k) total += static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
  double sum = 0.0;
  for (size_t k = 1; k < 8192; ++k) {
    sum += static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
    if (sum >= 0.5 * total) return static_cast<double>(k) * rate / 16384.0;
  }
  return 0.5 * rate;
}

// The first moment a signal reaches `share` of its own peak, in seconds.
static double reaches(const std::vector<float>& x, double share, double rate = kRate) {
  const double level = share * peak(x);
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(static_cast<double>(x[i])) >= level) return static_cast<double>(i) / rate;
  }
  return 1.0e9;
}

// A phrase with its events on exact samples, rendered in blocks of `block`
// frames (0: a ragged mix), each block cut short where an event falls.
struct Event {
  size_t at;
  int kind;  // 0 note on (id, hz, gain), 1 note off (id), 2 set_param (id, value)
  int id;
  float a, b;
};

static Stereo play(Droplets& d, const std::vector<Event>& events, size_t total, int block) {
  static const int kRagged[] = {1, 7, 64, 128, 33, 512, 2048, 5, 13, 1024};
  Stereo out;
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0, next = 0;
  int which = 0;
  while (done < total) {
    while (next < events.size() && events[next].at <= done) {
      const Event& e = events[next++];
      if (e.kind == 0) d.note_on(e.id, e.a, e.b);
      if (e.kind == 1) d.note_off(e.id);
      if (e.kind == 2) d.set_param(e.id, e.a);
    }
    size_t frames = block > 0 ? static_cast<size_t>(block) : static_cast<size_t>(kRagged[which++ % 10]);
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

static double largest_difference(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// How much of an event is heard in its first 8 samples: the largest
// difference from the same render without the event over those samples,
// against the largest over 20 ms. Something smoothed or faded has gone a
// small part of the way; a jump is there at once. The worst of eight moments
// a little apart, so a jump cannot hide in a zero crossing.
template <typename Setup, typename Change>
static double suddenness(Setup setup, Change change) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render(device, 0.1f + 0.0013f * static_cast<float>(trial), kRate);
      if (pass == 0) change(device);
      out[pass] = render(device, 0.02f, kRate);
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < out[0].size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                                         std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (i < 8) early = std::max(early, difference);
      whole = std::max(whole, difference);
    }
    if (whole > 0.0) worst = std::max(worst, early / whole);
  }
  return worst;
}

// --- a key answers at once -------------------------------------------------------------------

static void test_first_drop() {
  // The key's own drop: something at the very next sample, a tenth of its
  // peak well inside 10 ms, on every surface and across the keyboard.
  double slowest = 0.0;
  bool at_once = true;
  for (int material = 0; material < kMaterials; ++material) {
    for (float hz : {27.5f, 220.0f, 1760.0f, 4186.0f}) {
      single(device, material);
      device.set_param(p::kSize, 1.0f);  // the slowest contact
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      slowest = std::max(slowest, reaches(out.left, 0.1));
      at_once = at_once && out.left[1] != 0.0f;
    }
  }
  std::printf("first drop: a tenth of its peak after at most %.2f ms (largest drops, 27.5 Hz to 4.2 kHz)\n",
              1000.0 * slowest);
  EXPECT(at_once, "a key sounds from the sample after it goes down");
  EXPECT(slowest < 0.010, "the first drop reaches a tenth of its peak within 10 ms of the key");

  // In the middle of a rain, however slow, a new key still gets its own drop.
  single(device, kGlass);
  device.note_on(1, 220.0f, 0.8f);
  Stereo before = render(device, 1.0f, kRate);
  device.note_on(2, 587.33f, 0.8f);
  Stereo after = render(device, 0.03f, kRate);
  const double was = tone_level(before.left, 587.33, kRate, at(0.97), at(1.0));
  const double is = tone_level(after.left, 587.33, kRate);
  std::printf("a key added to a slow rain: its note is %.1f dB up within 30 ms\n", db(is / std::max(was, 1.0e-9)));
  EXPECT(is > 30.0 * was && is > 0.01, "a key added while it rains sounds its own drop at once");

  // And it is on the key's own octave whatever Spread says.
  single(device, kGlass);
  device.set_param(p::kSpread, 3.0f);
  device.set_param(p::kLoose, 1.0f);
  bool own = true;
  for (int n = 0; n < 12; ++n) {
    device.note_on(n, 311.13f, 0.8f);
    Stereo out = render(device, 0.06f, kRate);
    own = own && std::fabs(cents(strongest(out.left, kRate, 100.0, 6000.0, at(0.004), at(0.06)), 311.13)) < 5.0;
    device.note_off(n);
    render(device, 6.0f, kRate);
  }
  EXPECT(own, "the key's own drop is at the key's pitch with Spread at 3");
}

// --- how many, and when ----------------------------------------------------------------------

static Stereo rain_on(float rain, float loose, float bursts, float seconds, float hz = 220.0f) {
  ticking(device);
  device.set_param(p::kRain, rain);
  device.set_param(p::kLoose, loose);
  device.set_param(p::kBursts, bursts);
  device.note_on(1, hz, 0.8f);
  return render(device, seconds, kRate);
}

static void test_rate() {
  // A pulse has a known number of drops: the key's own and one every period.
  // This is also the check on the detector.
  for (float rain : {0.5f, 4.0f, 24.0f}) {
    const std::vector<double> times = onsets(rain_on(rain, 0.0f, 0.0f, 20.0f));
    const double wanted = 1.0 + std::floor(20.0 * rain - 1.0e-3);
    std::printf("pulse at %.1f a second: %zu drops in 20 s (%.0f wanted)\n", rain, times.size(), wanted);
    EXPECT_NEAR(static_cast<double>(times.size()), wanted, 1.0, "an even pulse lands Rain drops a second, counted exactly");
    EXPECT(std::fabs(static_cast<double>(times.size()) - 1.0 - 20.0 * rain) <= 0.15 * 20.0 * rain,
           "onsets over 20 s follow Rain within 15 % (pulse)");
  }
  // Random arrivals, counted over a minute so that chance is well inside the
  // tolerance (one standard deviation is 6.5 % at 4 a second, 2.6 % at 24).
  for (float rain : {4.0f, 10.0f, 24.0f}) {
    const std::vector<double> times = onsets(rain_on(rain, 1.0f, 0.0f, 60.0f));
    const double per_second = (static_cast<double>(times.size()) - 1.0) / 60.0;
    std::printf("rain at %.0f a second: %.2f a second over 60 s (%+.1f %%), first 20 s %zu\n", rain, per_second,
                100.0 * (per_second / rain - 1.0), count_in(times, 0.0, 20.0));
    EXPECT(std::fabs(per_second / rain - 1.0) < 0.15, "random arrivals follow Rain within 15 %");
  }
  // Rain is shared among the held keys: five keys get the drops one key got.
  {
    ticking(device);
    device.set_param(p::kRain, 12.0f);
    device.set_param(p::kLoose, 1.0f);
    for (int n = 0; n < 5; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 5.0f / 12.0f), 0.8f);
    const std::vector<double> times = onsets(render(device, 60.0f, kRate));
    const double per_second = static_cast<double>(count_in(times, 0.1, 60.0)) / 59.9;
    std::printf("five keys at 12 a second: %.2f a second\n", per_second);
    EXPECT(std::fabs(per_second / 12.0 - 1.0) < 0.15, "Rain is drops a second over all held keys, not per key");
  }
  // Rain turned while keys are held is followed from then on.
  {
    ticking(device);
    device.set_param(p::kRain, 2.0f);
    device.set_param(p::kLoose, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 10.0f, kRate);
    device.set_param(p::kRain, 16.0f);
    out = concat(out, render(device, 10.0f, kRate));
    const std::vector<double> times = onsets(out);
    std::printf("Rain 2 then 16: %zu drops in the first 10 s, %zu in the next\n", count_in(times, 0.01, 10.0),
                count_in(times, 10.0, 20.0));
    EXPECT_NEAR(static_cast<double>(count_in(times, 0.01, 10.0)), 20.0, 1.0, "Rain 2 lands 20 drops in 10 s");
    EXPECT_NEAR(static_cast<double>(count_in(times, 10.0, 20.0)), 160.0, 2.0, "Rain turned to 16 lands 160 in the next 10 s");
  }
}

static void test_timing() {
  const Gaps even = gaps_of(onsets(rain_on(6.0f, 0.0f, 0.0f, 20.0f)));
  const Gaps half = gaps_of(onsets(rain_on(6.0f, 0.5f, 0.0f, 60.0f)));
  const Gaps loose = gaps_of(onsets(rain_on(6.0f, 1.0f, 0.0f, 60.0f)));
  std::printf("gaps at 6 a second: Loose 0 mean %.2f ms spread %.3f %%, Loose 0.5 spread %.0f %%, Loose 1 spread %.0f %%\n",
              1000.0 * even.mean, 100.0 * even.spread, 100.0 * half.spread, 100.0 * loose.spread);
  EXPECT_NEAR(even.mean, 1.0 / 6.0, 0.0005, "Loose 0: the gap is the period of Rain");
  EXPECT(even.spread < 0.05, "Loose 0: even gaps (spread under 5 % of the mean)");
  EXPECT(even.spread < 0.002, "Loose 0: the gaps are even to the sample, not only to 5 %");
  EXPECT(loose.spread > 0.6, "Loose 1: uneven gaps (spread over 60 % of the mean)");
  EXPECT(loose.spread > 0.85 && loose.spread < 1.15, "Loose 1: the gaps are those of random arrivals (spread near the mean)");
  EXPECT(half.spread > 0.35 && half.spread < 0.65, "Loose 0.5 sits between the two");
  // Random arrivals have many short gaps and a few long ones; a pulse has neither.
  EXPECT(loose.under_half > 0.3 && loose.longest > 3.0 * loose.mean, "Loose 1 has short gaps and long ones");
  EXPECT(even.under_half == 0.0 && even.longest < 1.01 * even.mean, "Loose 0 has neither");

  // The pulse keeps its beat when a key is added to it.
  ticking(device);
  device.set_param(p::kRain, 5.0f);
  device.set_param(p::kLoose, 0.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo out = render(device, 2.07f, kRate);
  device.note_on(2, 329.63f, 0.8f);
  out = concat(out, render(device, 3.0f, kRate));
  std::vector<double> times = onsets(out);
  // Take the added key's own drop out and the rest is still the pulse.
  std::vector<double> pulse;
  for (double t : times) {
    if (std::fabs(t - 2.07) > 0.002) pulse.push_back(t);
  }
  const Gaps kept = gaps_of(pulse);
  std::printf("a key added to a pulse: %zu drops, %zu of them the pulse, spread %.3f %%\n", times.size(), pulse.size(),
              100.0 * kept.spread);
  EXPECT(times.size() == pulse.size() + 1, "the added key sounds its own drop between the beats");
  EXPECT(kept.spread < 0.002 && pulse.size() == 26, "and the pulse goes on in time");
}

static void test_bursts() {
  // On a pulse: the drops of a flurry are four times as close, the lulls are
  // empty, and the count over a minute is still Rain.
  const std::vector<double> plain_times = onsets(rain_on(4.0f, 0.0f, 0.0f, 60.0f));
  const std::vector<double> burst_times = onsets(rain_on(4.0f, 0.0f, 1.0f, 60.0f));
  const Gaps plain = gaps_of(plain_times), burst = gaps_of(burst_times);
  std::printf("Bursts 1 on a pulse of 4: %zu drops in 60 s (%zu without), median gap %.1f ms (%.1f), longest %.2f s, "
              "%.0f %% of gaps under half the mean\n",
              burst_times.size(), plain_times.size(), 1000.0 * burst.median, 1000.0 * plain.median, burst.longest,
              100.0 * burst.under_half);
  EXPECT_NEAR(burst.median, 0.0625, 0.002, "in a flurry the drops come four times as fast");
  EXPECT(burst.under_half > 0.6 && plain.under_half == 0.0, "Bursts bunches the onsets: most gaps are short");
  EXPECT(burst.longest > 0.5 && plain.longest < 0.26, "with lulls between the flurries");
  EXPECT(std::fabs(static_cast<double>(burst_times.size()) / static_cast<double>(plain_times.size()) - 1.0) < 0.15,
         "and as many drops over a minute as without");
  // On random rain: more uneven than random arrivals are by themselves.
  const Gaps rain = gaps_of(onsets(rain_on(8.0f, 1.0f, 0.0f, 60.0f)));
  const Gaps flurried = gaps_of(onsets(rain_on(8.0f, 1.0f, 1.0f, 60.0f)));
  const Gaps part = gaps_of(onsets(rain_on(8.0f, 1.0f, 0.5f, 60.0f)));
  std::printf("gap spread at Loose 1: Bursts 0 %.0f %%, 0.5 %.0f %%, 1 %.0f %%; drops %zu, %zu, %zu\n", 100.0 * rain.spread,
              100.0 * part.spread, 100.0 * flurried.spread, rain.count, part.count, flurried.count);
  EXPECT(flurried.spread > 1.5 * rain.spread, "Bursts makes random rain come in flurries");
  EXPECT(part.spread > 1.1 * rain.spread && part.spread < flurried.spread, "half way up it does so less");
  EXPECT(std::fabs(static_cast<double>(flurried.count) / 480.0 - 1.0) < 0.15, "and keeps Rain drops a second");
}

// --- on which notes --------------------------------------------------------------------------

// Three keys with no octave of one near another, held under drops that are
// far enough apart to be heard one at a time (Loose 0.5 never waits less
// than half the mean gap).
static const std::vector<double> kChord = {220.0, 261.63, 329.63};

static std::vector<Found> chord_drops(int material, float loose, float spread, float seconds) {
  // Ring set so that each surface's highest drop here still rings through
  // the 120 ms it is listened to, and its lowest is mostly gone by the next.
  static const float kRing[kMaterials] = {0.5f, 1.5f, 0.25f, 2.0f, 1.0f};
  Stereo out;
  const std::vector<double> times = splashes(
      [&](Droplets& d, float splash) {
        ticking(d);
        d.set_param(p::kMaterial, static_cast<float>(material));
        d.set_param(p::kRain, 1.5f);
        d.set_param(p::kLoose, loose);
        d.set_param(p::kSpread, spread);
        d.set_param(p::kSplash, splash);
        d.set_param(p::kSize, 0.2f);
        d.set_param(p::kRing, kRing[material]);
        for (size_t k = 0; k < kChord.size(); ++k) d.note_on(static_cast<int>(k), static_cast<float>(kChord[k]), 0.8f);
      },
      seconds, &out);
  // The three keys' own drops land together: leave them out. A bubble is
  // listened to once it has risen.
  std::vector<Found> rain;
  for (const Found& drop : survey(out, times, kChord, 0.12, kRate, material == kWater ? 0.03 : 0.004)) {
    if (drop.time > 0.05) rain.push_back(drop);
  }
  return rain;
}

static void test_pitches() {
  // Every drop sits on a held note or one of its octaves, on every surface.
  for (int material = 0; material < kMaterials; ++material) {
    const std::vector<Found> drops = chord_drops(material, 0.5f, 2.0f, 100.0f);
    double worst = 0.0;
    int keys[3] = {}, octaves[5] = {};
    for (const Found& drop : drops) {
      worst = std::max(worst, std::fabs(drop.off));
      ++keys[drop.key];
      ++octaves[drop.octave];
    }
    std::printf("%s, Spread 2: %zu drops, worst %.2f cents off a held note or its octaves; keys %d %d %d; octaves %d %d %d %d\n",
                kNames[material], drops.size(), worst, keys[0], keys[1], keys[2], octaves[0], octaves[1], octaves[2],
                octaves[3]);
    EXPECT(drops.size() > 100, "enough drops were found to say anything");
    EXPECT(worst < 5.0, "every drop sits on a held note or its octaves within 5 cents");
    EXPECT(keys[0] > 30 && keys[1] > 30 && keys[2] > 30, "every held key gets drops");
    EXPECT(octaves[0] > 30 && octaves[1] > 30 && octaves[2] > 30, "Spread 2: the key's octave and the two above all get drops");
    EXPECT(octaves[3] == 0 && octaves[4] == 0, "Spread 2: nothing above the second octave");
  }
  // Spread 0: the key's own octave only. Spread 1.5: the second octave half as often.
  {
    const std::vector<Found> flat = chord_drops(kGlass, 0.5f, 0.0f, 60.0f);
    int above = 0;
    double worst = 0.0;
    for (const Found& drop : flat) {
      above += drop.octave > 0 ? 1 : 0;
      worst = std::max(worst, std::fabs(drop.off));
    }
    std::printf("Spread 0: %zu drops, %d above the key's octave, worst %.2f cents\n", flat.size(), above, worst);
    EXPECT(flat.size() > 60 && above == 0 && worst < 5.0, "Spread 0 keeps every drop at the key's own octave");

    const std::vector<Found> part = chord_drops(kGlass, 1.0f, 1.5f, 200.0f);
    int octaves[5] = {};
    for (const Found& drop : part) ++octaves[drop.octave];
    const double share = static_cast<double>(octaves[2]) / static_cast<double>(part.size());
    std::printf("Spread 1.5, Loose 1: octaves %d %d %d %d (the second %.0f %% of the drops, 20 %% wanted)\n", octaves[0],
                octaves[1], octaves[2], octaves[3], 100.0 * share);
    EXPECT(share > 0.12 && share < 0.28 && octaves[3] == 0, "half an octave of Spread is taken half as often");
  }
  // Loose 0 climbs the held keys in order of pitch and goes up an octave each time round.
  {
    const std::vector<Found> drops = chord_drops(kGlass, 0.0f, 1.0f, 24.5f);
    bool in_order = drops.size() >= 30;
    for (size_t i = 0; i < drops.size(); ++i) {
      in_order = in_order && drops[i].key == static_cast<int>(i % 3) && drops[i].octave == static_cast<int>((i / 3) % 2);
    }
    std::printf("Loose 0, Spread 1: %zu drops, climbing the three keys and then their octaves: %s\n", drops.size(),
                in_order ? "yes" : "no");
    EXPECT(in_order, "Loose 0 goes round the held keys in order, an octave up every other time round");
    // Loose 1 does not.
    const std::vector<Found> random = chord_drops(kGlass, 1.0f, 1.0f, 60.0f);
    size_t follows = 0;
    for (size_t i = 1; i < random.size(); ++i) follows += random[i].key == (random[i - 1].key + 1) % 3 ? 1 : 0;
    const double share = static_cast<double>(follows) / static_cast<double>(random.size() - 1);
    std::printf("Loose 1: the next key up follows %.0f %% of the time\n", 100.0 * share);
    EXPECT(share > 0.15 && share < 0.55, "Loose 1 takes the keys at random");
  }
  // A drop that would land above 5 kHz stays an octave down, so a key at the
  // top of the keyboard rains on itself.
  {
    ticking(device);
    device.set_param(p::kRain, 3.0f);
    device.set_param(p::kLoose, 0.5f);
    device.set_param(p::kSpread, 3.0f);
    device.set_param(p::kSplash, 0.0f);
    device.note_on(1, 4186.0f, 0.8f);
    Stereo out = render(device, 10.0f, kRate);
    const double note = tone_level(out.left, 4186.0, kRate);
    const double above = tone_level(out.left, 8372.0, kRate);
    const double found = strongest(out.left, kRate, 2000.0, 20000.0, at(1.0), at(1.3));
    std::printf("C8 with Spread 3: the strongest tone is at %.1f Hz, the octave above it %.1f dB under the note\n", found,
                db(above / note));
    EXPECT(peak(out.left) > 0.01 && above < 0.03 * note && std::fabs(cents(found, 4186.0)) < 5.0,
           "no drop is sent above 5 kHz");
    // Two octaves down there is room for two octaves of Spread and no more.
    device.init(kRate);
    device.set_param(p::kSpread, 3.0f);
    device.set_param(p::kLoose, 1.0f);
    device.set_param(p::kRain, 12.0f);
    device.set_param(p::kSplash, 0.0f);
    device.note_on(1, 1046.5f, 0.8f);
    out = render(device, 20.0f, kRate);
    const double c6 = tone_level(out.left, 1046.5, kRate), c7 = tone_level(out.left, 2093.0, kRate),
                 c8 = tone_level(out.left, 4186.0, kRate), c9 = tone_level(out.left, 8372.0, kRate);
    std::printf("C6 with Spread 3: C7 %.1f dB, C8 %.1f dB, C9 %.1f dB against C6\n", db(c7 / c6), db(c8 / c6), db(c9 / c6));
    EXPECT(c7 > 0.1 * c6 && c8 > 0.1 * c6 && c9 < 0.01 * c6, "an octave that would pass 5 kHz is not taken");
  }
}

// The key's own drop, alone, and the pitch it settles on.
static void test_tuning() {
  double worst = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (int material = 0; material < kMaterials; ++material) {
      for (float hz : {27.5f, 110.0f, 440.0f, 1318.51f, 4186.01f}) {
        single(device, material, rate);
        device.set_param(p::kRing, 4.0f);
        device.note_on(1, hz, 0.8f);
        Stereo out = render(device, 1.2f, rate);
        // From after the bubble has risen, as long as the drop is there: at
        // most a second, at least a dozen periods.
        const double from = material == kWater ? 0.035 : 0.01;
        const double ring = rt60(out.left, rate, from, 0.005, -100.0);
        const double to = from + std::min(1.0, std::max(0.6 * ring, 12.0 / hz));
        const double found = strongest(out.left, rate, 0.7 * hz, 1.4 * hz, at(from, rate), at(to, rate));
        const double off = cents(found, hz);
        if (std::fabs(off) > std::fabs(worst)) worst = off;
        if (std::fabs(off) >= 5.0) {
          std::printf("  %s %.1f Hz at %.0f: %.2f cents (window %.3f to %.3f s)\n", kNames[material], hz, rate, off, from, to);
        }
      }
    }
  }
  std::printf("tuning: worst %.2f cents over 5 surfaces, 5 notes from A0 to C8, 3 sample rates\n", worst);
  EXPECT(std::fabs(worst) < 5.0, "every drop is within 5 cents of its note at 44.1, 48 and 96 kHz");

  // A key over the top of the band at a low rate is brought under it, so
  // its drop has a tone: without that it has no partial left and is silent.
  single(device, kGlass, 16000.0f);
  device.note_on(1, 8000.0f, 0.8f);
  Stereo top = render(device, 0.5f, 16000.0f);
  const double loudest = both_peak(top);
  const double found = strongest(top.left, 16000.0, 5000.0, 7900.0, at(0.01, 16000.0f), at(0.3, 16000.0f));
  std::printf("at 16 kHz the top key (8 kHz): peak %.4f, strongest at %.0f Hz\n", loudest, found);
  EXPECT(loudest > 1e-3 && std::fabs(cents(found, 6400.0)) < 30.0, "at 16 kHz the top key sounds, at 0.4 of the rate");
}

// --- what the drops land on ------------------------------------------------------------------

static void test_materials() {
  const double hz = 440.0;
  Stereo out[kMaterials];
  double ring[kMaterials];
  for (int material = 0; material < kMaterials; ++material) {
    single(device, material);
    device.note_on(1, static_cast<float>(hz), 0.8f);
    out[material] = render(device, 3.2f, kRate);
    // The fundamental's ring: through the part where it is alone.
    ring[material] = rt60(out[material].left, kRate, 0.08, 0.01, -90.0);
  }
  std::printf("ring to -60 dB at A4: glass %.2f s, wood %.2f s, metal %.2f s, water %.2f s, felt %.2f s\n", ring[kGlass],
              ring[kWood], ring[kMetal], ring[kWater], ring[kFelt]);
  EXPECT_NEAR(ring[kGlass], 1.6, 0.25, "glass rings 1.6 s at A4");
  EXPECT_NEAR(ring[kWood], 0.4, 0.08, "wood rings 0.4 s");
  EXPECT_NEAR(ring[kMetal], 5.0, 0.8, "metal rings 5 s");
  EXPECT_NEAR(ring[kWater], 0.25, 0.05, "water dies in a quarter of a second");
  EXPECT_NEAR(ring[kFelt], 0.6, 0.1, "felt rings 0.6 s");
  EXPECT(ring[kMetal] > 2.5 * ring[kGlass] && ring[kGlass] > 2.5 * ring[kWood] && ring[kWood] > 1.3 * ring[kWater],
         "metal is long, glass in between, wood short, water shortest");

  // The partials each surface has, read in the first 40 ms against the
  // fundamental, and what is left of them later.
  auto partial = [&](int material, double ratio, double from, double to) {
    return tone_level(out[material].left, hz * ratio, kRate, at(from), at(to)) /
           tone_level(out[material].left, hz, kRate, at(from), at(to));
  };
  const double early = 0.04;
  std::printf("partials in the first 40 ms, against the fundamental:\n");
  std::printf("  glass  2.32: %.3f  4.25: %.3f  (2: %.3f  4: %.3f)\n", partial(kGlass, 2.32, 0, early),
              partial(kGlass, 4.25, 0, early), partial(kGlass, 2.0, 0, early), partial(kGlass, 4.0, 0, early));
  std::printf("  wood   4: %.3f  9.9: %.3f  (2.32: %.3f), 4 after 150 ms: %.4f\n", partial(kWood, 4.0, 0, early),
              partial(kWood, 9.9, 0, early), partial(kWood, 2.32, 0, early), partial(kWood, 4.0, 0.15, 0.19));
  std::printf("  metal  2: %.3f  3: %.3f  4.2: %.3f  (2.32: %.3f), after 1 s 2: %.3f  3: %.3f  4.2: %.3f\n",
              partial(kMetal, 2.0, 0, early), partial(kMetal, 3.0, 0, early), partial(kMetal, 4.2, 0, early),
              partial(kMetal, 2.32, 0, early), partial(kMetal, 2.0, 1.0, 1.2), partial(kMetal, 3.0, 1.0, 1.2),
              partial(kMetal, 4.2, 1.0, 1.2));
  std::printf("  water  2: %.4f  2.32: %.4f  4: %.4f (after the rise)\n", partial(kWater, 2.0, 0.04, 0.1),
              partial(kWater, 2.32, 0.04, 0.1), partial(kWater, 4.0, 0.04, 0.1));
  std::printf("  felt   2: %.3f  (2.32: %.3f  4: %.3f)\n", partial(kFelt, 2.0, 0, early), partial(kFelt, 2.32, 0, early),
              partial(kFelt, 4.0, 0, early));
  EXPECT(partial(kGlass, 2.32, 0, early) > 0.2 && partial(kGlass, 4.25, 0, early) > 0.08,
         "glass has its two inharmonic partials, at 2.32 and 4.25");
  EXPECT(partial(kGlass, 2.0, 0, early) < 0.05 && partial(kGlass, 4.0, 0, early) < 0.05, "and no octaves");
  EXPECT(partial(kWood, 4.0, 0, early) > 0.25, "wood has the bar's partial at 4 : 1, strong while it knocks");
  EXPECT(partial(kWood, 2.32, 0, early) < 0.03, "and none of the glass's");
  EXPECT(partial(kWood, 4.0, 0.15, 0.19) < 0.01, "the 4 : 1 partial is a knock: gone in 150 ms");
  EXPECT(partial(kMetal, 2.0, 0, early) > 0.25 && partial(kMetal, 3.0, 0, early) > 0.15 && partial(kMetal, 4.2, 0, early) > 0.08,
         "metal has a bell's partials at 2, 3 and 4.2");
  EXPECT(partial(kMetal, 2.0, 1.0, 1.2) > 0.2 && partial(kMetal, 3.0, 1.0, 1.2) > 0.1 && partial(kMetal, 4.2, 1.0, 1.2) > 0.04,
         "and they are still ringing a second later");
  EXPECT(partial(kMetal, 1.2, 0, 0.2) < 0.03, "without a bell's minor third");
  EXPECT(partial(kWater, 2.0, 0.04, 0.1) < 0.01 && partial(kWater, 2.32, 0.04, 0.1) < 0.01 &&
             partial(kWater, 4.0, 0.04, 0.1) < 0.01,
         "water is one sine");
  EXPECT(partial(kFelt, 2.0, 0, early) > 0.02 && partial(kFelt, 2.0, 0, early) < 0.2, "felt has a trace of its octave");
  EXPECT(partial(kFelt, 2.32, 0, early) < 0.03 && partial(kFelt, 4.0, 0, early) < 0.03, "and nothing else");

  // Water: the bubble starts under the note and climbs to it.
  {
    single(device, kWater);
    device.note_on(1, 1760.0f, 0.8f);
    Stereo bubble = render(device, 0.5f, kRate);
    const double start = strongest(bubble.left, kRate, 800.0, 2200.0, at(0.0), at(0.006));
    const double middle = strongest(bubble.left, kRate, 800.0, 2200.0, at(0.010), at(0.018));
    const double end = strongest(bubble.left, kRate, 800.0, 2200.0, at(0.035), at(0.12));
    std::printf("water at A6: %.0f Hz in the first 6 ms, %.0f Hz from 10 to 18 ms, then %.2f Hz (%.2f cents)\n", start,
                middle, end, cents(end, 1760.0));
    EXPECT(start < 0.85 * 1760.0 && start > 0.6 * 1760.0, "a bubble starts well under the note");
    EXPECT(middle > start + 60.0 && middle < 1760.0 - 5.0, "and rises");
    EXPECT(std::fabs(cents(end, 1760.0)) < 5.0, "to arrive at the note");
    // Glass does not.
    const double steady = strongest(out[kGlass].left, kRate, 200.0, 600.0, at(0.0), at(0.02));
    EXPECT(std::fabs(cents(steady, hz)) < 30.0, "a drop on glass is on its note from the start");
  }
  // Felt speaks slowly; glass and metal at once.
  {
    double speaks[kMaterials];
    for (int material = 0; material < kMaterials; ++material) speaks[material] = reaches(out[material].left, 0.25);
    std::printf("time to a quarter of the peak at A4: glass %.2f ms, wood %.2f, metal %.2f, water %.2f, felt %.2f\n",
                1000.0 * speaks[kGlass], 1000.0 * speaks[kWood], 1000.0 * speaks[kMetal], 1000.0 * speaks[kWater],
                1000.0 * speaks[kFelt]);
    EXPECT(speaks[kFelt] > 0.002 && speaks[kFelt] > 3.0 * speaks[kGlass] && speaks[kFelt] > 3.0 * speaks[kMetal] &&
               speaks[kFelt] > 2.0 * speaks[kWood],
           "felt is a soft thump: it takes milliseconds to speak");
    EXPECT(speaks[kGlass] < 0.0007 && speaks[kMetal] < 0.0007, "glass and metal speak at once");

    // Five surfaces are five sounds, not five lengths of one: every pair
    // differs plainly in at least two of how long it rings (by 1.4 times),
    // how fast it speaks (by 2 times), how much sounds above the note in the
    // first 40 ms (by 0.15 of the fundamental) and whether it glides up to
    // the note (more than a semitone under it in its first 6 ms).
    double upper[kMaterials];
    bool glides[kMaterials];
    for (int material = 0; material < kMaterials; ++material) {
      upper[material] = 0.0;
      for (double ratio : {2.0, 2.32, 3.0, 4.0, 4.2, 4.25, 9.9}) upper[material] += partial(material, ratio, 0, early);
      glides[material] = cents(strongest(out[material].left, kRate, 200.0, 600.0, at(0.0), at(0.006)), hz) < -100.0;
    }
    std::printf("above the note in the first 40 ms: glass %.2f, wood %.2f, metal %.2f, water %.2f, felt %.2f of the fundamental\n",
                upper[kGlass], upper[kWood], upper[kMetal], upper[kWater], upper[kFelt]);
    int fewest = 4;
    for (int a = 0; a < kMaterials; ++a) {
      for (int b = a + 1; b < kMaterials; ++b) {
        int ways = 0;
        ways += std::max(ring[a], ring[b]) > 1.4 * std::min(ring[a], ring[b]) ? 1 : 0;
        ways += std::max(speaks[a], speaks[b]) > 2.0 * std::min(speaks[a], speaks[b]) ? 1 : 0;
        ways += std::fabs(upper[a] - upper[b]) > 0.15 ? 1 : 0;
        ways += glides[a] != glides[b] ? 1 : 0;
        if (ways < 2) std::printf("  %s and %s differ in only %d way(s)\n", kNames[a], kNames[b], ways);
        fewest = std::min(fewest, ways);
      }
    }
    EXPECT(fewest >= 2, "every two surfaces differ in at least two of ring, attack, partials and glide");
  }
}

static void test_size_and_ring() {
  // Ring multiplies the ring time.
  double ring[3];
  const float settings[3] = {0.25f, 1.0f, 4.0f};
  for (int i = 0; i < 3; ++i) {
    single(device, kGlass);
    device.set_param(p::kRing, settings[i]);
    device.note_on(1, 880.0f, 0.8f);
    Stereo out = render(device, 3.2f, kRate);
    ring[i] = rt60(out.left, kRate, 0.05, 0.01, -90.0);
  }
  std::printf("Ring 0.25, 1, 4 at A5 on glass: %.2f s, %.2f s, %.2f s\n", ring[0], ring[1], ring[2]);
  EXPECT_NEAR(ring[1] / ring[0], 4.0, 0.5, "Ring 1 rings four times as long as Ring 0.25");
  EXPECT_NEAR(ring[2] / ring[1], 4.0, 0.5, "Ring 4 four times as long again");
  // Low notes ring longer than high ones.
  single(device, kGlass);
  device.note_on(1, 220.0f, 0.8f);
  Stereo low = render(device, 3.2f, kRate);
  const double low_ring = rt60(low.left, kRate, 0.05, 0.01, -90.0);
  std::printf("glass at A3: %.2f s (A5: %.2f s)\n", low_ring, ring[1]);
  EXPECT_NEAR(low_ring / ring[1], 2.0, 0.3, "two octaves down rings twice as long on glass");

  // Size: small is bright, sharp and short; large is dark, slow and long.
  Stereo small, large;
  for (int pass = 0; pass < 2; ++pass) {
    single(device, kGlass);
    device.set_param(p::kSize, pass == 0 ? 0.0f : 1.0f);
    device.note_on(1, 440.0f, 0.8f);
    (pass == 0 ? small : large) = render(device, 3.2f, kRate);
  }
  const double small_ring = rt60(small.left, kRate, 0.08, 0.01, -90.0), large_ring = rt60(large.left, kRate, 0.08, 0.01, -90.0);
  const double small_bright = tone_level(small.left, 440.0 * 2.32, kRate, 0, at(0.04)) / tone_level(small.left, 440.0, kRate, 0, at(0.04));
  const double large_bright = tone_level(large.left, 440.0 * 2.32, kRate, 0, at(0.04)) / tone_level(large.left, 440.0, kRate, 0, at(0.04));
  const double small_speaks = reaches(small.left, 0.5), large_speaks = reaches(large.left, 0.5);
  std::printf("Size 0 and 1 on glass: ring %.2f s and %.2f s, upper partial %.3f and %.3f of the fundamental, "
              "half the peak after %.2f ms and %.2f ms\n",
              small_ring, large_ring, small_bright, large_bright, 1000.0 * small_speaks, 1000.0 * large_speaks);
  EXPECT_NEAR(large_ring / small_ring, 4.0, 0.6, "a large drop rings four times as long as a small one");
  EXPECT(small_bright > 2.5 * large_bright, "a small drop is brighter");
  EXPECT(large_speaks > 1.5 * small_speaks, "a large drop is slower to speak");
  // A large bubble starts lower and takes longer to rise.
  double starts[2], arrived[2];
  for (int pass = 0; pass < 2; ++pass) {
    single(device, kWater);
    device.set_param(p::kSize, pass == 0 ? 0.0f : 1.0f);
    device.note_on(1, 1760.0f, 0.8f);
    Stereo out = render(device, 0.5f, kRate);
    starts[pass] = strongest(out.left, kRate, 800.0, 2200.0, at(0.0), at(0.005));
    arrived[pass] = strongest(out.left, kRate, 800.0, 2200.0, at(0.020), at(0.030));
  }
  std::printf("a bubble at A6: Size 0 starts at %.0f Hz and is at %.0f Hz by 20 ms; Size 1 starts at %.0f Hz and is at %.0f Hz\n",
              starts[0], arrived[0], starts[1], arrived[1]);
  EXPECT(starts[1] < starts[0] - 100.0, "a large bubble starts lower");
  EXPECT(std::fabs(cents(arrived[0], 1760.0)) < 5.0 && cents(arrived[1], 1760.0) < -20.0,
         "a small one has arrived by 20 ms and a large one has not");
}

static void test_soft_and_width() {
  // Soft: how much the drops differ in loudness. One key, drops heard one at a time.
  const std::vector<double> key = {880.0};
  auto sparse = [](float soft, float width) {
    return [soft, width](Droplets& d, float splash) {
      ticking(d);
      d.set_param(p::kRain, 3.0f);
      d.set_param(p::kLoose, 0.5f);
      d.set_param(p::kSoft, soft);
      d.set_param(p::kWidth, width);
      d.set_param(p::kSplash, splash);
      d.note_on(1, 880.0f, 0.8f);
    };
  };
  double range[3], loudest[3], median[3];
  const float settings[3] = {0.0f, 0.5f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    Stereo out;
    const std::vector<double> times = splashes(sparse(settings[i], 0.0f), 60.0f, &out);
    std::vector<double> levels;
    for (const Found& drop : survey(out, times, key, 0.03)) {
      if (drop.time >= 0.05) levels.push_back(drop.left);  // not the key's own drop
    }
    std::sort(levels.begin(), levels.end());
    range[i] = db(levels.back() / levels.front());
    loudest[i] = levels.back();
    median[i] = levels[levels.size() / 2];
  }
  std::printf("loudest drop over softest: Soft 0 %.2f dB, Soft 0.5 %.1f dB, Soft 1 %.1f dB\n", range[0], range[1], range[2]);
  std::printf("the middle drop under the loudest: Soft 0.5 %.1f dB, Soft 1 %.1f dB; the loudest against Soft 0: %.2f and %.2f dB\n",
              db(loudest[1] / median[1]), db(loudest[2] / median[2]), db(loudest[1] / loudest[0]), db(loudest[2] / loudest[0]));
  EXPECT(range[0] < 0.5, "Soft 0: every drop is as loud as the next");
  EXPECT(range[1] > 8.0 && range[1] < 14.0, "Soft 0.5 spreads them over about 12 dB");
  EXPECT(range[2] > 18.0 && range[2] < 26.0, "Soft 1 over about 24 dB");
  // Most drops stay near how the key was played: the middle one is a quarter
  // of the way down the range, not half (which thinned a shower to a whisper).
  EXPECT(db(loudest[1] / median[1]) > 1.5 && db(loudest[1] / median[1]) < 5.0, "Soft 0.5: the middle drop is about 3 dB under the loudest");
  EXPECT(db(loudest[2] / median[2]) > 4.0 && db(loudest[2] / median[2]) < 9.0, "Soft 1: the middle drop is about 6 dB under the loudest");
  EXPECT(std::fabs(db(loudest[1] / loudest[0])) < 0.7 && std::fabs(db(loudest[2] / loudest[0])) < 0.7,
         "Soft makes drops softer, none louder than the key was played");

  // Width 0: both sides are the same. Width 1: every drop has its own place,
  // at the same power wherever it is.
  {
    Stereo middle;
    splashes(sparse(0.0f, 0.0f), 20.0f, &middle);
    EXPECT(middle.left == middle.right && peak(middle.left) > 0.01, "Width 0 is the same on both sides");
  }
  for (int pass = 0; pass < 2; ++pass) {
    Stereo out;
    const std::vector<double> times = splashes(sparse(0.0f, pass == 0 ? 1.0f : 0.4f), 60.0f, &out);
    double leftmost = 90.0, rightmost = 0.0, weakest = 1.0e9, fullest = 0.0;
    int left_side = 0, right_side = 0;
    for (const Found& drop : survey(out, times, key, 0.03)) {
      if (drop.time < 0.05) {
        // The key's own drop is in the middle whatever Width says (and at its own level).
        EXPECT(drop.left == drop.right && drop.left > 0.01, "a key's own drop is in the middle");
        continue;
      }
      const double angle = std::atan2(drop.right, drop.left) * 180.0 / kPi;  // 0 hard left, 45 the middle, 90 hard right
      leftmost = std::min(leftmost, angle);
      rightmost = std::max(rightmost, angle);
      (angle < 45.0 ? left_side : right_side) += 1;
      const double power = drop.left * drop.left + drop.right * drop.right;
      weakest = std::min(weakest, power);
      fullest = std::max(fullest, power);
    }
    std::printf("Width %.1f: drops from %.0f to %.0f degrees (45 is the middle), %d left and %d right, power within %.2f dB\n",
                pass == 0 ? 1.0 : 0.4, leftmost, rightmost, left_side, right_side, 0.5 * db(fullest / weakest));
    if (pass == 0) {
      EXPECT(leftmost < 8.0 && rightmost > 82.0, "Width 1 scatters the drops from side to side");
      EXPECT(left_side > 50 && right_side > 50, "about as many to the left as to the right");
    } else {
      EXPECT_NEAR(leftmost, 45.0 - 18.0, 4.0, "Width 0.4 keeps them within 18 degrees of the middle (left)");
      EXPECT_NEAR(rightmost, 45.0 + 18.0, 4.0, "Width 0.4 keeps them within 18 degrees of the middle (right)");
    }
    EXPECT(0.5 * db(fullest / weakest) < 0.5, "a drop has the same power wherever it falls");
  }
}

static void test_splash() {
  // What Splash adds, by rendering the same drop with and without it: the
  // difference is the splash alone (the drop itself does not read Splash).
  // Sixteen drops, each with its own noise, for the level: one burst of
  // low noise is a few swings and no more.
  double level[kMaterials], centre[kMaterials], length[kMaterials];
  for (int material = 0; material < kMaterials; ++material) {
    std::vector<float> splash;
    level[material] = 0.0;
    for (int trial = 0; trial < 16; ++trial) {
      Stereo out[2];
      for (int pass = 0; pass < 2; ++pass) {
        single(device, material);
        device.set_param(p::kSplash, pass == 0 ? 0.0f : 1.0f);
        for (int n = 0; n < trial; ++n) {  // silent keys, each using up one noise
          device.note_on(50 + n, 100.0f, 0.0f);
          device.note_off(50 + n);
        }
        device.note_on(1, 440.0f, 0.8f);
        out[pass] = render(device, 0.4f, kRate);
      }
      splash.resize(out[0].size());
      for (size_t i = 0; i < splash.size(); ++i) splash[i] = out[1].left[i] - out[0].left[i];
      level[material] += peak(splash) / peak(out[0].left) / 16.0;
    }
    centre[material] = middle_frequency(splash, kRate, 0, at(0.1));
    // How long it lasts: until its RMS over a millisecond is 40 dB under its loudest millisecond.
    double loudest = 0.0;
    length[material] = 0.0;
    for (size_t from = 0; from + 48 <= splash.size(); from += 48) {
      const double here = rms(splash, from, from + 48);
      loudest = std::max(loudest, here);
      if (here > 0.01 * loudest) length[material] = static_cast<double>(from + 48) / kRate;
    }
  }
  std::printf("splash at Splash 1 (peak against the drop's, the frequency half its power is under, how long): glass %.2f, "
              "%.0f Hz, %.1f ms; wood %.2f, %.0f Hz, %.1f ms; metal %.2f, %.0f Hz, %.1f ms; water %.2f, %.0f Hz, %.1f ms; "
              "felt %.2f, %.0f Hz, %.1f ms\n",
              level[kGlass], centre[kGlass], 1000.0 * length[kGlass], level[kWood], centre[kWood], 1000.0 * length[kWood],
              level[kMetal], centre[kMetal], 1000.0 * length[kMetal], level[kWater], centre[kWater], 1000.0 * length[kWater],
              level[kFelt], centre[kFelt], 1000.0 * length[kFelt]);
  for (int material = 0; material < kMaterials; ++material) {
    EXPECT(level[material] > 0.6 && level[material] < 1.5, "at Splash 1 the splash peaks about where the drop does");
  }
  EXPECT(centre[kGlass] > 4000.0 && centre[kMetal] > 5000.0, "glass and metal tick high");
  EXPECT(centre[kWood] > 600.0 && centre[kWood] < 3000.0, "wood knocks in the middle");
  EXPECT(centre[kFelt] < 800.0, "felt thuds low");
  EXPECT(length[kWater] > 3.0 * length[kGlass] && length[kWater] > 0.012, "water splashes for longer than glass ticks");
  EXPECT(length[kGlass] < 0.006 && length[kMetal] < 0.006, "a tick is over in a few milliseconds");

  // Every drop has noise of its own. Seeded one after another from one
  // generator of the same kind, they all played the same noise, each a
  // sample later than the drop before: the splashes of a chord's keys were
  // one splash, as many times as tall, and a shower's piled the same way.
  // Drops one after the other on water, whose splash is long enough to say
  // (two ticks of a few swings are alike by 0.7 by chance), at every shift
  // up to a millisecond.
  {
    double closest = 0.0;
    for (int first = 0; first < 4; ++first) {
      std::vector<float> noise[2];
      for (int which = 0; which < 2; ++which) {
        Stereo out[2];
        for (int pass = 0; pass < 2; ++pass) {
          single(device, kWater);
          device.set_param(p::kSplash, pass == 0 ? 0.0f : 1.0f);
          for (int n = 0; n < first + which; ++n) {
            device.note_on(50 + n, 100.0f, 0.0f);
            device.note_off(50 + n);
          }
          device.note_on(1, 440.0f, 0.8f);
          out[pass] = render(device, 0.05f, kRate);
        }
        noise[which].resize(out[0].size());
        for (size_t i = 0; i < noise[which].size(); ++i) noise[which][i] = out[1].left[i] - out[0].left[i];
      }
      const long size = static_cast<long>(noise[0].size());
      for (long shift = -48; shift <= 48; ++shift) {
        double ab = 0.0, aa = 0.0, bb = 0.0;
        for (long i = 48; i + 48 < size; ++i) {
          const double a = noise[0][static_cast<size_t>(i)], b = noise[1][static_cast<size_t>(i + shift)];
          ab += a * b;
          aa += a * a;
          bb += b * b;
        }
        closest = std::max(closest, std::fabs(ab) / std::sqrt(aa * bb + 1.0e-30));
      }
    }
    std::printf("the splashes of two drops in a row on water: alike by %.2f at the most (1 is the same noise)\n", closest);
    EXPECT(closest < 0.6, "two drops do not play the same noise");
  }

  // Splash 0 is no noise at all: two drops with different noise are the same.
  {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      single(device, kGlass);
      // Use up a different number of noise seeds first.
      for (int n = 0; n < pass * 2; ++n) {
        device.note_on(50 + n, 100.0f, 0.0f);
        device.note_off(50 + n);
      }
      device.note_on(1, 440.0f, 0.8f);
      out[pass] = render(device, 0.2f, kRate);
    }
    EXPECT(out[0].left == out[1].left, "Splash 0 leaves the drop without noise");
  }
  // The splash against the drop is the same at 44.1, 48 and 96 kHz: noise
  // made per sample would be 3 dB down at 96 kHz, and a filter near half the
  // sample rate passes a narrower band than the same one far under it (the
  // tick of a small drop on glass was 2 dB up at 96 kHz, on metal 2.7 dB).
  for (int material : {kGlass, kMetal, kWater}) {
    double share[3];
    const float rates[3] = {48000.0f, 44100.0f, 96000.0f};
    for (int pass = 0; pass < 3; ++pass) {
      const float rate = rates[pass];
      double noise = 0.0, tone = 0.0;
      // Four hundred drops with as many noises: one burst is a few swings and no more.
      for (int trial = 0; trial < 400; ++trial) {
        Stereo out[2];
        for (int with = 0; with < 2; ++with) {
          single(device, material, rate);
          device.set_param(p::kSize, 0.0f);  // the highest tick
          device.set_param(p::kSplash, with == 0 ? 0.0f : 1.0f);
          for (int n = 0; n < trial; ++n) {
            device.note_on(50 + n, 100.0f, 0.0f);
            device.note_off(50 + n);
          }
          device.note_on(1, 440.0f, 0.8f);
          out[with] = render(device, 0.06f, rate);
        }
        for (size_t i = 0; i < out[0].size(); ++i) {
          const double difference = static_cast<double>(out[1].left[i]) - out[0].left[i];
          noise += difference * difference;
          tone += static_cast<double>(out[0].left[i]) * out[0].left[i];
        }
      }
      share[pass] = 10.0 * std::log10(noise / tone);
    }
    std::printf("splash against drop (%s, Size 0): %.2f dB at 48 kHz, %+.2f dB from that at 44.1 kHz, %+.2f dB at 96 kHz\n",
                kNames[material], share[0], share[1] - share[0], share[2] - share[0]);
    EXPECT(std::fabs(share[2] - share[0]) < 1.0, "the splash is as loud against the drop at 96 kHz as at 48 kHz");
    EXPECT(std::fabs(share[1] - share[0]) < 1.0, "and at 44.1 kHz");
  }
}

// --- after the keys --------------------------------------------------------------------------

static void test_trail() {
  // Rain goes on for Trail seconds after the key, thinning, then stops.
  double last[3];
  const float trails[3] = {0.0f, 4.0f, 8.0f};
  const double rain = 24.0;
  for (int i = 0; i < 3; ++i) {
    ticking(device);
    device.set_param(p::kRain, static_cast<float>(rain));
    device.set_param(p::kLoose, 1.0f);
    device.set_param(p::kTrail, trails[i]);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    device.note_off(1);
    Stereo tail = render(device, trails[i] + 2.0f, kRate);
    // The ticks of a trail get softer: hold them against the held rain's.
    const std::vector<double> times = onsets(tail, kRate, peak(tick_envelope(out, kRate)));
    last[i] = times.empty() ? 0.0 : times.back();
    const double trail = trails[i];
    const size_t first_half = count_in(times, 0.0, 0.5 * trail), second_half = count_in(times, 0.5 * trail, trail);
    std::printf("Trail %.0f s at %.0f a second: %zu drops after the key, the last at %.2f s; %zu in the first half, %zu in the second\n",
                trail, rain, times.size(), last[i], first_half, second_half);
    if (i == 0) {
      // (A drop that fell on the last samples before the key went is still ticking at the very start.)
      EXPECT(count_in(times, 0.002, 1.0e9) == 0, "Trail 0: the rain stops with the key");
    } else {
      EXPECT(last[i] > 0.6 * trail && last[i] <= trail, "drops go on for about Trail seconds after the key, and no longer");
      EXPECT_NEAR(static_cast<double>(times.size()), 0.5 * rain * trail, 0.3 * 0.5 * rain * trail,
                  "half as many drops as the held rain would have had");
      EXPECT(2 * first_half > 3 * second_half && second_half > 0, "the trail thins out");
    }
    // Then silence, exactly: the last drop has rung out and the device sleeps.
    Stereo after = render(device, 1.0f, kRate);
    EXPECT(both_peak(tail, at(trail + 1.0)) == 0.0 && both_peak(after) == 0.0, "exact silence once the trail and its last drop are over");
  }
  // The drops of a trail are softer as it goes.
  {
    ticking(device);
    device.set_param(p::kRain, 4.0f);
    device.set_param(p::kLoose, 0.0f);
    device.set_param(p::kTrail, 8.0f);
    device.set_param(p::kSplash, 0.0f);
    device.note_on(1, 880.0f, 0.8f);
    render(device, 1.01f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 9.0f, kRate);
    const double early = peak(tail.left, 0, at(1.0)), late = peak(tail.left, at(4.5), at(8.0));
    std::printf("trail of 8 s: drops in its first second peak at %.1f dB, from 4.5 s on at %.1f dB\n", db(early), db(late));
    EXPECT(late > 0.0 && late < 0.8 * early && late > 0.3 * early, "the drops of a trail soften, down to 8 dB under");
  }
  // A key that trails and one that is held: the held key keeps the rate, and
  // the trailing key drops out of it.
  {
    Stereo out;
    const std::vector<double> times = splashes(
        [](Droplets& d, float splash) {
          ticking(d);
          d.set_param(p::kRain, 6.0f);
          d.set_param(p::kLoose, 0.5f);
          d.set_param(p::kTrail, 5.0f);
          d.set_param(p::kSplash, splash);
          d.note_on(1, 220.0f, 0.8f);
          d.note_on(2, 329.63f, 0.8f);
          render(d, 1.0f, kRate);
          d.note_off(2);
        },
        12.0f, &out);
    const std::vector<double> keys = {220.0, 329.63};
    int trailing_early = 0, trailing_late = 0, held = 0;
    for (const Found& drop : survey(out, times, keys, 0.08)) {
      if (drop.key == 1) (drop.time < 5.0 ? trailing_early : trailing_late) += 1;
      if (drop.key == 0 && drop.time >= 5.0) ++held;
    }
    std::printf("one key held, one let go with Trail 5: the trailing key gets %d drops in 5 s and %d after; the held key %d in 7 s\n",
                trailing_early, trailing_late, held);
    EXPECT(trailing_early > 4 && trailing_late == 0, "a key let go leaves the rain over Trail seconds");
    EXPECT_NEAR(static_cast<double>(held), 42.0, 7.0, "and the held key then has all of Rain");
  }
}

// --- levels ----------------------------------------------------------------------------------

static void test_levels() {
  // Velocity: the key's own drop, and the rain on that key.
  {
    double own[2], rain[2];
    for (int pass = 0; pass < 2; ++pass) {
      ticking(device);
      device.set_param(p::kRain, 4.0f);
      device.set_param(p::kLoose, 0.0f);
      device.set_param(p::kSplash, 0.0f);
      device.note_on(1, 440.0f, pass == 0 ? 1.0f : 0.25f);
      Stereo out = render(device, 2.0f, kRate);
      own[pass] = peak(out.left, 0, at(0.2));
      rain[pass] = peak(out.left, at(0.24), at(2.0));
    }
    std::printf("gain 0.25 against gain 1: the key's drop %.1f dB, the rain on it %.1f dB\n", db(own[1] / own[0]),
                db(rain[1] / rain[0]));
    EXPECT(own[1] < 0.3 * own[0] && own[1] > 0.02 * own[0], "a soft key's own drop is softer");
    EXPECT(rain[1] < 0.3 * rain[0] && rain[1] > 0.02 * rain[0], "and so is the rain on it");
  }
  // One note at gain 0.7 and the default settings, on every surface.
  for (int material = 0; material < kMaterials; ++material) {
    device.init(kRate);
    device.set_param(p::kMaterial, static_cast<float>(material));
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 8.0f, kRate);
    // The key's own drop (the first rain drop is 0.23 s away), and the rain on it.
    const double level = db(both_peak(out, 0, at(0.2))), rain = db(both_peak(out, at(0.2)));
    std::printf("one note at gain 0.7, default settings, %s: its own drop peaks at %.1f dBFS, 8 s of rain on it at %.1f dBFS\n",
                kNames[material], level, rain);
    EXPECT(level > -24.0 && level < -10.0, "one note at gain 0.7 peaks between -24 and -10 dBFS at the default volume");
    EXPECT(rain > -24.0 && rain < -10.0, "and so does the rain on it");
  }
  // Ten keys held, on every surface.
  double worst_ten = 0.0;
  for (int material = 0; material < kMaterials; ++material) {
    device.init(kRate);
    device.set_param(p::kMaterial, static_cast<float>(material));
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.8f);
    Stereo out = render(device, 8.0f, kRate);
    worst_ten = std::max(worst_ten, both_peak(out));
    std::printf("ten held keys at gain 0.8, default settings, %s: peak %.3f\n", kNames[material], both_peak(out));
  }
  EXPECT(worst_ten < 0.5, "ten held keys stay under the clip knee on every surface");

  // The rain against the strike. A held chord sounds one drop for each key at
  // once and then the rain, which all the keys share: the instrument is the
  // rain, so it must not be five loud strikes and something faint after them.
  // Five keys (D3 A3 F4 C5 E5, as a chord is previewed), every surface, from
  // the default Rain to the fastest: the first 300 ms against the minute
  // from 2 s on (a few seconds of a slow rain on wood or felt are too few
  // drops to say), and the loudest 400 ms of the strike and of the next 12 s.
  {
    const float chord[5] = {146.83f, 220.0f, 349.23f, 523.25f, 659.26f};
    double furthest = -1.0e9, nearest = 1.0e9, widest = 0.0, hottest = 0.0;
    for (int material = 0; material < kMaterials; ++material) {
      std::printf("the strike over the rain, five keys, %s:", kNames[material]);
      for (float rain : {3.0f, 8.0f, 24.0f}) {
        device.init(kRate);
        device.set_param(p::kMaterial, static_cast<float>(material));
        device.set_param(p::kRain, rain);
        for (int n = 0; n < 5; ++n) device.note_on(n, chord[n], n == 4 ? 0.6f : 0.8f);
        Stereo out = render(device, 62.0f, kRate);
        const double over = db(mid_rms(out, 0, at(0.3)) / mid_rms(out, at(2.0)));
        const double window = db(loudest_400ms(out, 0, at(1.0)) / loudest_400ms(out, at(2.0), at(14.0)));
        furthest = std::max(furthest, over);
        nearest = std::min(nearest, over);
        widest = std::max(widest, std::fabs(window));
        hottest = std::max(hottest, both_peak(out, at(2.0)));
        std::printf("  Rain %.0f: %.1f dB (loudest 400 ms %+.1f dB)", rain, over, window);
      }
      std::printf("\n");
    }
    EXPECT(furthest < 9.0, "from the default Rain up, the rain is within 9 dB of a five-key strike on every surface");
    EXPECT(nearest > -3.0, "and the strike is not buried by the shower it starts");
    EXPECT(widest < 5.5, "the loudest 400 ms of the rain and of the strike are within 5.5 dB (both fit the bank's level window)");
    EXPECT(hottest < 0.5, "the rain on a chord stays under the clip knee");
  }
  // A slow rain is single drops with silence between them, so its level over
  // time says little: there, each drop of the rain is about as loud as one
  // key's strike (the loudest 400 ms of each, one key, over a minute).
  {
    double furthest = 0.0;
    for (int material = 0; material < kMaterials; ++material) {
      device.init(kRate);
      device.set_param(p::kMaterial, static_cast<float>(material));
      device.set_param(p::kRain, 0.7f);
      device.note_on(1, 261.63f, 0.8f);
      Stereo out = render(device, 60.0f, kRate);
      const double window = db(loudest_400ms(out, 0, at(0.5)) / loudest_400ms(out, at(2.0)));
      furthest = std::max(furthest, std::fabs(window));
      std::printf("a slow rain on one key, %s: the strike's loudest 400 ms is %+.1f dB against the rain's\n", kNames[material], window);
    }
    EXPECT(furthest < 6.0, "in a slow rain a drop is within 6 dB of a key's own");
  }
  // What the balance is made of: a drop of the rain, before it is thinned or
  // softened, lands a little harder than the key's own, and harder the more
  // keys are held: by their fourth root (few short drops, Soft 0, an even
  // pulse, which starts on the lowest key).
  {
    double own = 0.0, rain[2] = {0.0, 0.0};
    for (int pass = 0; pass < 2; ++pass) {
      ticking(device);
      device.set_param(p::kRain, 1.0f);
      device.set_param(p::kLoose, 0.0f);
      device.set_param(p::kSplash, 0.0f);
      device.note_on(1, 440.0f, 0.8f);
      if (pass == 1) {
        for (int n = 2; n <= 5; ++n) device.note_on(n, 440.0f * static_cast<float>(n + 3) / 4.0f, 0.8f);
      }
      Stereo out = render(device, 1.5f, kRate);
      if (pass == 0) own = peak(out.left, 0, at(0.5));
      rain[pass] = peak(out.left, at(0.9), at(1.5));
    }
    std::printf("a drop of a slow rain against the key's own: %+.2f dB with one key held, %+.2f dB with five\n", db(rain[0] / own),
                db(rain[1] / own));
    EXPECT_NEAR(db(rain[0] / own), 0.83, 0.3, "a drop of a slow rain on one key is about as loud as the key's own");
    EXPECT_NEAR(db(rain[1] / rain[0]), 3.5, 0.3, "and 3.5 dB harder with five keys held");
  }
  // A patter of short drops is thinned as well. A drop that is over at once
  // counts as half a second of rain, so at Rain 24 a tick on glass lands
  // 4.3 dB softer than at Rain 3. By its ring time alone (0.1 s here) it was
  // not thinned at all, and a dense patter stood over the strike that began it.
  {
    double level[2] = {0.0, 0.0};
    for (int pass = 0; pass < 2; ++pass) {
      ticking(device);
      device.set_param(p::kRain, pass == 0 ? 3.0f : 24.0f);
      device.set_param(p::kLoose, 0.0f);
      device.set_param(p::kSplash, 0.0f);
      device.note_on(1, 1760.0f, 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      level[pass] = peak(out.left, at(0.5), at(2.0));
    }
    std::printf("a tick of the rain at Rain 24 against one at Rain 3: %+.2f dB\n", db(level[1] / level[0]));
    EXPECT_NEAR(db(level[1] / level[0]), -4.3, 0.7, "a dense patter of short drops is thinned too");
  }

  // A pile of drops: a triad at full gain under rain as fast, as long and as
  // large as it goes, every drop at the key's level, over three octaves.
  double worst_pile = 0.0, quietest_pile = 1.0e9;
  for (int material = 0; material < kMaterials; ++material) {
    device.init(kRate);
    device.set_param(p::kMaterial, static_cast<float>(material));
    device.set_param(p::kRain, 24.0f);
    device.set_param(p::kRing, 4.0f);
    device.set_param(p::kSize, 1.0f);
    device.set_param(p::kSoft, 0.0f);
    device.set_param(p::kSplash, 1.0f);
    device.set_param(p::kSpread, 3.0f);
    device.note_on(1, 110.0f, 1.0f);
    device.note_on(2, 164.81f, 1.0f);
    device.note_on(3, 261.63f, 1.0f);
    Stereo out = render(device, 30.0f, kRate);
    worst_pile = std::max(worst_pile, both_peak(out));
    quietest_pile = std::min(quietest_pile, rms(out.left, at(10.0)));
    std::printf("a pile on %s (three keys at gain 1, Rain 24, Ring 4, Size 1, Soft 0, Splash 1): peak %.3f, rms %.1f dBFS\n",
                kNames[material], both_peak(out), db(rms(out.left, at(10.0))));
  }
  EXPECT(worst_pile < 0.5, "a pile of drops stays under the clip knee");
  EXPECT(quietest_pile > 0.01, "and is still a shower, not a whisper");

  // Large, long drops are not the worst pile. Small ones are brighter and
  // their splash is the larger part of them, and short ones were never
  // thinned while only their ring time was counted: felt at Size 0, Ring
  // 0.25 and Rain 24 came out at 0.95. Over Size, Ring, Rain and Spread on
  // every surface, three keys and five: played at 0.8 with Splash at 0.7
  // nothing reaches the knee; with a triad at full gain and Splash 1 the
  // clip rounds the tallest peaks, and the rain's are no taller than that.
  {
    const float keys_hz[5] = {110.0f, 164.81f, 261.63f, 392.0f, 523.25f};
    double worst_played = 0.0, worst_full = 0.0;
    for (int material = 0; material < kMaterials; ++material) {
      for (float size : {0.0f, 0.5f, 1.0f}) {
        for (float ring : {0.25f, 1.0f, 4.0f}) {
          for (float rain : {6.0f, 24.0f}) {
            for (float spread : {0.0f, 3.0f}) {
              for (int keys : {3, 5}) {
                for (int full = 0; full < (keys == 3 ? 2 : 1); ++full) {
                  device.init(kRate);
                  device.set_param(p::kMaterial, static_cast<float>(material));
                  device.set_param(p::kRain, rain);
                  device.set_param(p::kRing, ring);
                  device.set_param(p::kSize, size);
                  device.set_param(p::kSoft, 0.0f);
                  device.set_param(p::kSplash, full ? 1.0f : 0.7f);
                  device.set_param(p::kSpread, spread);
                  for (int n = 0; n < keys; ++n) device.note_on(n, keys_hz[n], full ? 1.0f : 0.8f);
                  Stereo out = render(device, 12.0f, kRate);
                  double& worst = full ? worst_full : worst_played;
                  worst = std::max(worst, both_peak(out));
                }
              }
            }
          }
        }
      }
    }
    std::printf("piles over Size, Ring, Rain and Spread: keys at 0.8 with Splash 0.7 peak at %.3f at the most, "
                "a triad at full gain with Splash 1 at %.3f\n",
                worst_played, worst_full);
    EXPECT(worst_played < 0.5, "small and short drops pile no higher than the clip knee either");
    EXPECT(worst_full < 0.75, "and at the hardest the clip only rounds the tallest peaks");
  }

  // A shower is about as loud as a drip: each drop is softer the more there are.
  {
    double loudest[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kMaterial, kMetal);
      device.set_param(p::kRain, pass == 0 ? 0.5f : 24.0f);
      device.set_param(p::kSoft, 0.0f);
      device.set_param(p::kSplash, 0.0f);
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 30.0f, kRate);
      loudest[pass] = 0.0;
      for (size_t from = at(5.0); from + at(0.4) <= out.size(); from += at(0.4)) {
        const double l = rms(out.left, from, from + at(0.4)), r = rms(out.right, from, from + at(0.4));
        loudest[pass] = std::max(loudest[pass], std::sqrt(l * l + r * r));
      }
    }
    std::printf("loudest 400 ms on metal: Rain 0.5 %.1f dBFS, Rain 24 %.1f dBFS\n", db(loudest[0]), db(loudest[1]));
    EXPECT(std::fabs(db(loudest[1] / loudest[0])) < 6.0, "48 times the drops is within 6 dB of the level");
  }
  // The output ends in the soft clip: far too much of everything still stays inside full scale.
  {
    device.init(kRate);
    device.set_param(p::kMaterial, kFelt);
    device.set_param(p::kVolume, 6.0f);
    device.set_param(p::kRain, 0.3f);
    device.set_param(p::kWidth, 0.0f);
    for (int n = 0; n < 4; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 5) / 12.0f), 1.0f);
    Stereo out = render(device, 0.5f, kRate);
    std::printf("four keys at full gain and +6 dB: peak %.3f\n", both_peak(out));
    EXPECT(both_peak(out) > 0.8 && both_peak(out) <= 1.0, "the output is soft clipped: over the knee and never over full scale");
  }
}

// --- no clicks -------------------------------------------------------------------------------

static void test_clicks() {
  // Volume thrown across 30 dB under ringing metal.
  auto ringing = [](Droplets& d) {
    single(d, kMetal);
    d.set_param(p::kVolume, -20.0f);
    d.note_on(1, 196.0f, 0.9f);
    d.note_on(2, 293.66f, 0.9f);
  };
  const double up = suddenness(ringing, [](Droplets& d) { d.set_param(p::kVolume, 6.0f); });
  const double down = suddenness(ringing, [](Droplets& d) { d.set_param(p::kVolume, -48.0f); });
  std::printf("Volume thrown under ringing drops: %.3f of the change in the first 8 samples going up, %.3f going down\n", up,
              down);
  EXPECT(up < 0.15 && down < 0.15, "Volume moves gradually (no click)");
  // The coarser bound: the largest step of the passage with a 6 dB move in
  // it, against the same passage at the lower level and at the higher one.
  {
    Stereo out[3];
    for (int pass = 0; pass < 3; ++pass) {
      ringing(device);
      if (pass == 2) device.set_param(p::kVolume, -14.0f);
      render(device, 0.1f, kRate);
      if (pass == 1) device.set_param(p::kVolume, -14.0f);
      out[pass] = render(device, 0.05f, kRate);
    }
    std::printf("largest step: %.5f at -20 dB, %.5f moved to -14 dB, %.5f at -14 dB all along\n", max_step(out[0].left),
                max_step(out[1].left), max_step(out[2].left));
    EXPECT(max_step(out[1].left) <= 1.001 * max_step(out[2].left) && max_step(out[1].left) > 1.5 * max_step(out[0].left),
           "a Volume move adds no step larger than the sound's own at the new level");
  }

  // Every voice ringing, then one more drop: the voice it takes fades over 2 ms.
  auto full = [](Droplets& d) {
    d.init(kRate);
    d.set_param(p::kMaterial, kMetal);
    d.set_param(p::kRain, 24.0f);
    d.set_param(p::kLoose, 0.0f);
    d.set_param(p::kRing, 4.0f);
    d.set_param(p::kSize, 1.0f);
    d.set_param(p::kSoft, 0.0f);
    d.set_param(p::kSplash, 0.0f);
    d.set_param(p::kWidth, 0.0f);
    d.set_param(p::kTrail, 0.0f);
    for (int n = 0; n < 16; ++n) d.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) / 6.0f), 0.8f);
    render(d, 2.0f, kRate);
    // The rain stops; 32 drops ring on.
    for (int n = 0; n < 16; ++n) d.note_off(n);
  };
  const double steal = suddenness(full, [](Droplets& d) {
    d.set_param(p::kMaterial, kFelt);  // a slow drop, so what is heard at once is the voice it took
    d.note_on(99, 311.13f, 0.03f);
  });
  std::printf("a drop taking a ringing voice: %.3f of the change in the first 8 samples\n", steal);
  EXPECT(steal < 0.15, "a stolen voice fades out (no click)");
  // And it did take one: the 32 voices were all ringing, and the new drop is heard.
  {
    full(device);
    render(device, 0.1f, kRate);
    Stereo before = render(device, 0.1f, kRate);
    full(device);
    render(device, 0.1f, kRate);
    device.set_param(p::kMaterial, kWater);
    device.set_param(p::kRain, 0.3f);
    device.note_on(99, 3000.0f, 1.0f);
    Stereo out = render(device, 0.1f, kRate);
    const double is = tone_level(out.left, 3000.0, kRate, at(0.03), at(0.06));
    const double was = tone_level(before.left, 3000.0, kRate, at(0.03), at(0.06));
    std::printf("with all 32 voices ringing, a new key's note: %.4f (%.6f without it)\n", is, was);
    EXPECT(is > 0.002 && is > 20.0 * was, "with every voice ringing a new key is still heard");
  }

  // Material, Size, Ring, Soft, Splash, Width and Spread belong to the drops
  // still to fall: thrown under ringing drops they change nothing that sounds.
  {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      single(device, kMetal);
      device.set_param(p::kSplash, 0.5f);
      device.set_param(p::kWidth, 1.0f);
      device.note_on(1, 196.0f, 0.9f);
      device.note_on(2, 293.66f, 0.9f);
      render(device, 0.3f, kRate);
      if (pass == 1) {
        device.set_param(p::kMaterial, kWood);
        device.set_param(p::kSize, 1.0f);
        device.set_param(p::kRing, 0.25f);
        device.set_param(p::kSoft, 1.0f);
        device.set_param(p::kSplash, 1.0f);
        device.set_param(p::kWidth, 0.0f);
        device.set_param(p::kSpread, 3.0f);
      }
      out[pass] = render(device, 2.5f, kRate);
    }
    const double moved = largest_difference(out[0], out[1]);
    std::printf("seven knobs thrown under two ringing drops: the output differs by %g\n", moved);
    EXPECT(moved == 0.0 && both_peak(out[0]) > 0.01, "a ringing drop keeps what it fell with");
  }
}

// --- the same whatever the host does ---------------------------------------------------------

static void test_blocks() {
  // A phrase with a silence in it that is stepped across the moment the
  // device falls asleep (the last drop out, then the idle gate's 0.1 s), a
  // Volume move inside the silence, and a wake: 1, 128 and 2048 frames and a
  // ragged mix must give the same audio.
  double worst = 0.0;
  size_t compared = 0;
  double loudest = 0.0;
  for (double silence = 0.0; silence <= 0.30001; silence += 0.02) {
    for (int phrase = 0; phrase < 2; ++phrase) {
      // The chord is let go at 0.6 s with a 0.3 s trail; the last drop of it
      // rings 0.52 s at most, so the output is over by about 1.42 s.
      const double wake = (phrase == 0 ? 1.35 : 3.0) + silence;
      std::vector<Event> events = {
          {0, 0, 1, 220.0f, 0.8f},
          {0, 0, 2, 329.63f, 0.8f},
          {at(0.1), 0, 3, 493.88f, 0.6f},
          {at(0.25), 2, p::kRain, 20.0f, 0.0f},
          {at(0.6), 1, 1, 0.0f, 0.0f},
          {at(0.6), 1, 2, 0.0f, 0.0f},
          {at(0.6) + 7, 1, 3, 0.0f, 0.0f},
          {at(wake) - 301, 2, p::kVolume, -7.0f, 0.0f},
          {at(wake) - 300, 2, p::kMaterial, static_cast<float>(kWater), 0.0f},
          {at(wake), 0, 4, 261.63f, 0.8f},
          {at(wake) + 1000, 0, 5, 392.0f, 0.8f},
          {at(wake + 0.4), 1, 4, 0.0f, 0.0f},
      };
      const size_t total = at(wake + 0.8);
      Stereo reference;
      for (int block : {128, 1, 2048, 0}) {
        ticking(device);
        device.set_param(p::kRain, 12.0f);
        device.set_param(p::kLoose, 0.7f);
        device.set_param(p::kBursts, 0.4f);
        device.set_param(p::kTrail, 0.3f);
        device.set_param(p::kWidth, 0.8f);
        device.set_param(p::kSpread, 2.0f);
        device.set_param(p::kSoft, 0.5f);
        Stereo out = play(device, events, total, block);
        if (block == 128) {
          reference = out;
          loudest = std::max(loudest, both_peak(out, at(wake)));
        } else {
          worst = std::max(worst, largest_difference(reference, out));
          ++compared;
        }
      }
    }
  }
  std::printf("block sizes 1, 2048 and ragged against 128, over %zu renders with a silence and a wake: largest difference %g "
              "(the wake peaks at %.3f)\n",
              compared, worst, loudest);
  EXPECT(worst < 1.0e-6 && loudest > 0.02, "the output does not depend on the block size, through a silence and a wake");
  EXPECT(worst == 0.0, "and is the same to the last bit");

  // The same notes after a second init give the same rain, bit for bit; and
  // it is rain: a third render that goes on from where the second stopped is different.
  {
    std::vector<Event> events = {
        {0, 0, 1, 220.0f, 0.8f},   {0, 0, 2, 277.18f, 0.7f},  {at(0.5), 0, 3, 329.63f, 0.8f},
        {at(2.0), 1, 1, 0.0f, 0.0f}, {at(2.5), 1, 2, 0.0f, 0.0f}, {at(2.5), 1, 3, 0.0f, 0.0f},
    };
    Stereo runs[3];
    for (int run = 0; run < 3; ++run) {
      if (run < 2) device.init(kRate);
      if (run < 2) device.set_param(p::kRain, 9.0f);
      runs[run] = play(device, events, at(10.0), 128);
    }
    const double again = largest_difference(runs[0], runs[1]);
    const double carried = largest_difference(runs[1], runs[2]);
    std::printf("two inits, the same notes: largest difference %g; the same notes again without an init: %g\n", again, carried);
    EXPECT(runs[0].left == runs[1].left && runs[0].right == runs[1].right, "a second init gives bit-identical audio");
    EXPECT(carried > 0.01, "without an init the rain carries on and is not the same twice");
    EXPECT(both_peak(runs[2], at(9.0)) == 0.0, "and the phrase ends in exact silence");
  }

  // Volume moved while the device sleeps is there for the next note: the
  // same as a device that had it from the start.
  {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      single(device, kGlass);
      device.set_param(p::kRing, 0.25f);
      device.set_param(p::kTrail, 0.0f);
      if (pass == 0) {
        // Two drops (so the next swings the same way as a first one would), off
        // the beat of the control clock, then asleep.
        device.note_on(1, 330.0f, 0.8f);
        device.process(13);
        device.note_on(2, 550.0f, 0.8f);
        device.note_off(1);
        device.note_off(2);
        render(device, 2.0f, kRate);
        Stereo quiet = render(device, 0.2f, kRate);
        EXPECT(both_peak(quiet) == 0.0, "asleep before the move");
      }
      device.set_param(p::kVolume, 3.0f);
      if (pass == 0) render(device, 0.05f, kRate);
      device.note_on(3, 440.0f, 0.8f);
      out[pass] = render(device, 0.5f, kRate);
    }
    const double off = largest_difference(out[0], out[1]);
    std::printf("Volume moved 12 dB in a silence: the next note differs from a device set that way by %g\n", off);
    EXPECT(off < 1.0e-6 && both_peak(out[0]) > 0.05, "a Volume moved in silence has arrived when the next note starts");
  }
}

int main() {
  fft.init();

  Conformance spec;
  spec.name = "droplets";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_first_drop();
  test_rate();
  test_timing();
  test_bursts();
  test_pitches();
  test_tuning();
  test_materials();
  test_size_and_ring();
  test_soft_and_width();
  test_splash();
  test_trail();
  test_levels();
  test_clicks();
  test_blocks();

  // Cost: eight keys held at the default settings, and the most it can be
  // asked for (every voice ringing four partials).
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.7f);
  render(device, 2.0f, kRate);
  report_cost("droplets (8 keys, defaults)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  device.set_param(p::kMaterial, kMetal);
  device.set_param(p::kRain, 24.0f);
  device.set_param(p::kRing, 4.0f);
  device.set_param(p::kSize, 1.0f);
  device.set_param(p::kSplash, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.7f);
  render(device, 4.0f, kRate);
  report_cost("droplets (8 keys, metal shower, all 32 voices)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("droplets");
}
