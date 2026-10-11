// Native harness for Ice (cpp/devices/ice). The conformance pass covers
// silence before and after notes, a pile of keys, parameter abuse and other
// sample rates; the rest holds the instrument to its model: a strike that
// falls as one over time squared onto a tuned ring, echoes off the shores,
// and a lake that cracks by itself on a seeded schedule.
//
// The model's constants are written out again here, not read from the
// device, so that a change to the device has to answer to them.

#include "../devices/ice/ice.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Ice;
namespace p = livemix::ice;

static Ice device;
static Ice other;

static const float kRate = 48000.0f;

// --- the model, as the header documents it ---------------------------------------------------

static const double kFarT0 = 0.06;       // seconds at Distance 1, times distance squared
static const double kLand = 16.0;        // a chirp is on its note after this many t0 ...
static const double kMaxFlight = 1.6;    // ... or this many seconds
static const double kStiffness = 0.12;   // B at Stretch 1, times stretch squared
static const double kMaxCracks = 4.0;    // a second at Cracks 1, times cracks cubed
static const double kEchoSeconds[3] = {0.31, 0.73, 1.27};
static const double kEchoTop[3] = {0.8, 0.65, 0.5};
static const double kEchoStretch[3] = {1.5, 2.1, 2.8};
static const double kEchoExtraT0 = 0.006;

// Where each partial starts, as a share of the top: the highest overtone at
// the top, the note at 0.72 of it.
static const double kStart[6] = {0.66, 0.72, 0.79, 0.84, 0.93, 1.0};
static const double kNoteStart = kStart[1];
static const double kTopTilt = 0.75;     // a partial in flight: (place / where it is)^this

static double model_top(double bright) { return 1500.0 * std::pow(8.0, bright); }
static double model_t0(double distance) { return kFarT0 * distance * distance; }
static double pure_law(double t, double t0) { return 1.0 / ((1.0 + t / t0) * (1.0 + t / t0)); }
// The law as built: tapered so that it arrives, level, after `flight`.
static double built_law(double t, double t0) {
  const double flight = std::min(kLand * t0, kMaxFlight);
  if (t >= flight) return 0.0;
  const double taper = 1.0 - (t / flight) * (t / flight);
  return pure_law(t, t0) * taper * taper;
}
static double model_ratio(int n, double stretch) {
  const double b = kStiffness * stretch * stretch;
  return n * std::sqrt((1.0 + b * n * n) / (1.0 + b));
}
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// --- helpers ---------------------------------------------------------------------------------

static size_t at(double seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

// The bare instrument: one strike and nothing else, in the middle, loud
// enough to measure and far under the clip.
static void bare(Ice& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kDistance, 0.0f);
  d.set_param(p::kCrack, 0.0f);
  d.set_param(p::kShore, 0.0f);
  d.set_param(p::kCracks, 0.0f);
  d.set_param(p::kRoam, 0.0f);
  d.set_param(p::kStretch, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kVolume, -12.0f);
}

// The strongest frequency in [lo, hi] around `seconds`, over `window` seconds.
static double pitch_at(const std::vector<float>& x, float rate, double seconds, double window, double lo,
                       double hi) {
  const size_t from = at(std::max(0.0, seconds - 0.5 * window), rate);
  return dominant_frequency(x, rate, lo, hi, from, from + at(window, rate));
}

// The third difference: next to nothing for a band-limited tone, about its
// own size for a step.
static double kink(const std::vector<float>& x, size_t from, size_t to) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

static double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

static double max_diff(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// How much of what an event changes is there at once: the same passage is
// rendered with and without the event, and the largest difference in the
// first 8 samples is held against the largest over 20 ms. A smoothed change
// has hardly begun after 8 samples; a jump is all there. Worst of eight
// moments a little apart, so a jump cannot hide in a zero crossing.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo with, without;
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render(device, 0.4f, kRate);
      for (int i = 0; i < trial * 37 + 5; ++i) device.process(1);
      if (pass == 0) event(device);
      (pass == 0 ? with : without) = render(device, 0.02f, kRate, 1);
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < with.size(); ++i) {
      const double d = std::max(std::fabs(static_cast<double>(with.left[i]) - without.left[i]),
                                std::fabs(static_cast<double>(with.right[i]) - without.right[i]));
      if (i < 8) early = std::max(early, d);
      whole = std::max(whole, d);
    }
    if (whole > 0.0) worst = std::max(worst, early / whole);
  }
  return worst;
}

// Onsets of the snap: the noise above the tones, in 2 ms windows, counted
// where it rises over `threshold` after 30 ms of quiet.
static std::vector<double> snap_onsets(const std::vector<float>& x, float rate) {
  std::vector<double> level;
  const size_t window = at(0.002, rate);
  for (size_t from = 3; from + window <= x.size(); from += window) {
    double sum = 0.0;
    for (size_t i = from; i < from + window; ++i) {
      const double d = static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3];
      sum += d * d;
    }
    level.push_back(std::sqrt(sum / static_cast<double>(window)));
  }
  double top = 0.0;
  for (double v : level) top = std::max(top, v);
  std::vector<double> onsets;
  int quiet = 1000;
  for (size_t w = 0; w < level.size(); ++w) {
    if (level[w] > 0.1 * top) {
      if (quiet >= 15) onsets.push_back(static_cast<double>(w * window) / rate);
      quiet = 0;
    } else {
      ++quiet;
    }
  }
  return onsets;
}

// The power spectrum of x[from, to), Hann-windowed when `hann`, zero-padded
// to a power of two: bin k is k · rate / size Hz.
static std::vector<double> power_spectrum(const std::vector<float>& x, size_t from, size_t to, bool hann, size_t pad = 1) {
  to = std::min(to, x.size());
  const size_t length = to - from;
  size_t n = 1;
  while (n < pad * length) n <<= 1;
  std::vector<double> re(n, 0.0), im(n, 0.0);
  for (size_t i = 0; i < length; ++i) {
    const double w = hann ? 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(length)) : 1.0;
    re[i] = w * x[from + i];
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(re[i], re[j]);
  }
  for (size_t span = 2; span <= n; span <<= 1) {
    const double angle = -2.0 * kPi / static_cast<double>(span);
    for (size_t start = 0; start < n; start += span) {
      for (size_t k = 0; k < span / 2; ++k) {
        const double c = std::cos(angle * static_cast<double>(k)), sn = std::sin(angle * static_cast<double>(k));
        const size_t a = start + k, b = a + span / 2;
        const double tr = re[b] * c - im[b] * sn, ti = re[b] * sn + im[b] * c;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
  std::vector<double> power(n / 2);
  for (size_t k = 0; k < n / 2; ++k) power[k] = re[k] * re[k] + im[k] * im[k];
  return power;
}

// Energy of x[from, to) between two frequencies.
static double band_energy(const std::vector<float>& x, size_t from, size_t to, double lo, double hi) {
  const std::vector<double> power = power_spectrum(x, from, to, false);
  const double per_bin = kRate / static_cast<double>(2 * power.size());
  double sum = 0.0;
  for (size_t k = 1; k < power.size(); ++k) {
    const double hz = static_cast<double>(k) * per_bin;
    if (hz >= lo && hz < hi) sum += power[k];
  }
  return sum;
}

// Share of the energy of x[from, to) in its strongest spectral line (the
// main lobe of a Hann window): 1 for one sine, less for a cluster.
static double tone_share(const std::vector<float>& x, size_t from, size_t to) {
  const std::vector<double> power = power_spectrum(x, from, to, true, 4);
  size_t best = 1;
  double total = 0.0;
  for (size_t k = 1; k < power.size(); ++k) {
    total += power[k];
    if (power[k] > power[best]) best = k;
  }
  const size_t half = 2 * (2 * power.size()) / (to - from);  // two bins of the unpadded transform each side
  double lobe = 0.0;
  for (size_t k = best > half ? best - half : 1; k <= best + half && k < power.size(); ++k) lobe += power[k];
  return total > 0.0 ? lobe / total : 0.0;
}

static void test_tuning();
static void test_chirp();
static void test_strike_shape();
static void test_ring_and_tone();
static void test_shore();
static void test_lake();
static void test_snap();
static void test_levels();
static void test_clicks_and_voices();
static void test_blocks_and_sleep();

int main() {
  Conformance spec;
  spec.name = "ice";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 18.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_tuning();
  test_chirp();
  test_strike_shape();
  test_ring_and_tone();
  test_shore();
  test_lake();
  test_snap();
  test_levels();
  test_clicks_and_voices();
  test_blocks_and_sleep();

  // Cost: eight keys held on the default patch, the lake cracking.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("ice (8 keys held)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  // And at its dearest: every strike far off with all its echoes, the lake at full rate.
  device.init(kRate);
  device.set_param(p::kDistance, 1.0f);
  device.set_param(p::kShore, 1.0f);
  device.set_param(p::kCracks, 1.0f);
  device.set_param(p::kRoam, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("ice (8 keys, far, full shore, lake at full rate)", 10.0f, kRate,
              [&] { render(device, 10.0f, kRate); });

  return finish("ice");
}

// Whatever rings is the played note: at four notes across the keyboard and
// three sample rates, on the default patch (chirp and shores included) once
// the last echo has landed. And a key is heard at once at both ends.
static void test_tuning() {
  char label[200];
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (double hz : {55.0, 220.0, 880.0, 3520.0}) {
      device.init(rate);
      device.set_param(p::kCracks, 0.0f);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 3.7f, rate);
      const double found = dominant_frequency(out.left, rate, hz * 0.97, hz * 1.03, at(2.5, rate));
      std::snprintf(label, sizeof label, "tuning at %.0f Hz, %.0f Hz: %.2f cents off", rate, hz, cents(found, hz));
      std::printf("%s\n", label);
      EXPECT(std::fabs(cents(found, hz)) < 5.0, label);
    }
  }
  // The same with the chirp at its longest: it arrives, and stays.
  for (double hz : {110.0, 1760.0}) {
    bare(device);
    device.set_param(p::kDistance, 1.0f);
    device.note_on(1, static_cast<float>(hz), 0.8f);
    Stereo out = render(device, 2.2f, kRate);
    const double found = dominant_frequency(out.left, kRate, hz * 0.97, hz * 1.03, at(1.2));
    std::snprintf(label, sizeof label, "a far strike settles on %.0f Hz: %.2f cents off", hz, cents(found, hz));
    std::printf("%s\n", label);
    EXPECT(std::fabs(cents(found, hz)) < 5.0, label);
  }
  // Heard at once: something sounds inside 30 ms at the ends of the keyboard,
  // near and far, and a 100 ms note is a whole note.
  for (float distance : {0.0f, 1.0f}) {
    for (double hz : {28.0, 440.0, 4186.0}) {
      device.init(kRate);
      device.set_param(p::kDistance, distance);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 0.1f, kRate);
      device.note_off(1);
      Stereo after = render(device, 0.5f, kRate);
      std::snprintf(label, sizeof label, "%.0f Hz at distance %.0f speaks inside 30 ms (peak %.1f dBFS) and rings on",
                    hz, distance, db(both_peak(out, 0, at(0.03))));
      EXPECT(both_peak(out, 0, at(0.03)) > 0.01 && rms(after.left, at(0.2), at(0.4)) > 1.0e-4, label);
    }
  }
}

// The thing the instrument is named for. Near, a strike is a ping on the
// note from its first samples. Far, it falls from the top all the way down
// by the one-over-time-squared law and lands on the note.
static void test_chirp() {
  char label[200];
  // Distance 0: the first 20 ms are already the note.
  for (double hz : {220.0, 880.0, 2500.0}) {
    bare(device);
    device.set_param(p::kThick, 0.7f);
    device.note_on(1, static_cast<float>(hz), 0.8f);
    Stereo out = render(device, 0.5f, kRate);
    const double found = dominant_frequency(out.left, kRate, hz * 0.8, hz * 1.25, 0, at(0.02));
    std::snprintf(label, sizeof label, "distance 0: the first 20 ms of %.0f Hz are %.1f cents off", hz, cents(found, hz));
    std::printf("%s\n", label);
    EXPECT(std::fabs(cents(found, hz)) < 20.0, label);
  }

  // Distance 1. A note of 3 kHz that starts at 5.2 kHz (0.72 of a top of
  // 7.3 kHz): its overtones' places are above where they would start, so
  // they stay where they are, thin ice has no body, and the only thing
  // between 2.9 and 5.5 kHz is the note on its way down.
  const double note = 3000.0;
  const float bright_here = 0.76f;
  const double top = kNoteStart * model_top(bright_here);
  const double t0 = model_t0(1.0);
  bare(device);
  device.set_param(p::kDistance, 1.0f);
  device.set_param(p::kBright, bright_here);
  device.set_param(p::kThick, 0.0f);
  device.note_on(1, static_cast<float>(note), 0.8f);
  Stereo far = render(device, 2.5f, kRate);
  const double first = pitch_at(far.left, kRate, 0.002, 0.004, 2900.0, 5600.0);
  std::snprintf(label, sizeof label, "distance 1: the note starts at %.0f Hz (0.72 of the top: %.0f Hz)", first, top);
  std::printf("%s\n", label);
  EXPECT(first > 0.9 * top && first < 1.02 * top, label);
  // It only ever falls.
  double before = first;
  bool falls = true;
  for (double t = 0.006; t < 1.0; t += 0.004) {
    const double here = pitch_at(far.left, kRate, t, 0.008, 2900.0, 5600.0);
    if (here > before + 6.0) falls = false;
    before = here;
  }
  EXPECT(falls, "distance 1: the frequency only falls");
  // Three points on the curve against the pure law.
  for (double t : {0.5 * t0, t0, 2.0 * t0}) {
    const double here = pitch_at(far.left, kRate, t, 0.008, 2900.0, 5600.0);
    const double measured = (here - note) / (top - note);
    const double law = pure_law(t, t0);
    std::snprintf(label, sizeof label, "distance 1: at %.0f ms the chirp has %.3f of its fall left (the law says %.3f)",
                  1000.0 * t, measured, law);
    std::printf("%s\n", label);
    EXPECT(std::fabs(measured / law - 1.0) < 0.08, label);
  }
  // And it lands: within 5 cents from the moment the header says, to the end.
  const double flight = std::min(kLand * t0, kMaxFlight);
  const double landed = dominant_frequency(far.left, kRate, 2900.0, 5600.0, at(flight), at(flight + 0.4));
  std::snprintf(label, sizeof label, "distance 1: landed after %.2f s, %.2f cents off", flight, cents(landed, note));
  std::printf("%s\n", label);
  EXPECT(std::fabs(cents(landed, note)) < 5.0, label);
  // Half way there in time it is still well above the note.
  const double midway = pitch_at(far.left, kRate, 0.15, 0.02, 2900.0, 5600.0);
  EXPECT(cents(midway, note) > 60.0, "distance 1: 150 ms in, the note is still more than half a semitone sharp");

  // Distance scales the time: at 0.5 the same point of the fall comes four times sooner.
  bare(device);
  device.set_param(p::kDistance, 0.5f);
  device.set_param(p::kBright, bright_here);
  device.set_param(p::kThick, 0.0f);
  device.note_on(1, static_cast<float>(note), 0.8f);
  Stereo nearer = render(device, 1.0f, kRate);
  {
    const double t = model_t0(0.5);
    const double here = pitch_at(nearer.left, kRate, t, 0.004, 2900.0, 5600.0);
    const double measured = (here - note) / (top - note);
    std::snprintf(label, sizeof label, "distance 0.5: at %.1f ms the chirp has %.3f of its fall left (the law says 0.25)",
                  1000.0 * t, measured);
    std::printf("%s\n", label);
    EXPECT(std::fabs(measured / 0.25 - 1.0) < 0.10, label);
  }

  // Bright sets where the chirp starts, at every rate. A note at half the
  // top on thin ice: only the note moves (from 0.72 of the top), and 5 ms
  // in it has 0.852 of its fall left.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double last = 0.0;
    for (float bright : {0.0f, 0.5f, 1.0f}) {
      const double high = model_top(bright);
      bare(device, rate);
      device.set_param(p::kDistance, 1.0f);
      device.set_param(p::kBright, bright);
      device.set_param(p::kThick, 0.0f);
      device.note_on(1, static_cast<float>(0.5 * high), 0.8f);
      Stereo out = render(device, 0.2f, rate);
      const double start = pitch_at(out.left, rate, 0.005, 0.008, 0.52 * high, 0.78 * high);
      const double want = 0.5 * high + (kNoteStart - 0.5) * high * pure_law(0.005, model_t0(1.0));
      std::snprintf(label, sizeof label, "bright %.1f at %.0f Hz: the note starts at %.0f Hz (model %.0f, top %.0f Hz)", bright,
                    rate, start, want, high);
      std::printf("%s\n", label);
      EXPECT(std::fabs(start / want - 1.0) < 0.03 && start > last, label);
      last = start;
    }
  }

  // Landing is seamless: where the partials leave the table and join the
  // ring there is next to no more of a corner than just before. (The ring
  // starts to die where it lands, which is a corner of its own, 90 dB under
  // the note; a partial that landed 1 % off in level or phase would show
  // fifty times that.)
  {
    bare(device);
    device.set_param(p::kDistance, 0.4f);
    device.set_param(p::kThick, 1.0f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo out = render(device, 0.6f, kRate);
    const double flight_here = kLand * model_t0(0.4);
    const double around = kink(out.left, at(flight_here - 0.004), at(flight_here + 0.004));
    const double ahead = kink(out.left, at(flight_here - 0.03), at(flight_here - 0.006));
    std::snprintf(label, sizeof label, "landing leaves no corner: third difference %.2e at the landing, %.2e before it",
                  around, ahead);
    std::printf("%s\n", label);
    EXPECT(around < 4.0 * ahead, label);
  }
}

// A crack heard through ice, not a swept tone: one snap spread out in time.
// The top of the fall is brief and faint and the sound gathers towards the
// note; the partials start apart and on phases of their own, as a faint
// cluster; and nothing dies on the way, the ring starts where it lands.
static void test_strike_shape() {
  char label[240];
  // The top against the ring it lands in (a ring of 30 s, so that nothing
  // has died by then), far and at the default distance.
  struct Case {
    double hz;
    float distance;
    double most;  // dB: the first 5 ms against the 50 ms after landing
  };
  for (const Case& c : {Case{55.0, 1.0f, -12.0}, Case{220.0, 1.0f, -7.0}, Case{220.0, 0.45f, -7.0}, Case{440.0, 1.0f, -3.0}}) {
    bare(device);
    device.set_param(p::kDistance, c.distance);
    device.set_param(p::kThick, 0.5f);
    device.set_param(p::kStretch, 0.3f);
    device.set_param(p::kRing, 30.0f);
    device.note_on(1, static_cast<float>(c.hz), 0.8f);
    Stereo out = render(device, 1.2f, kRate);
    const double flight = std::min(kLand * model_t0(c.distance), kMaxFlight);
    const double top = rms(out.left, 0, at(0.005));
    const double landed = rms(out.left, at(flight + 0.01), at(flight + 0.06));
    std::snprintf(label, sizeof label, "%.0f Hz, distance %.2f: the first 5 ms are %.1f dB under the ring it lands in", c.hz,
                  c.distance, db(landed) - db(top));
    std::printf("%s\n", label);
    EXPECT(db(top) - db(landed) < c.most && top > 0.01 * landed, label);
    if (c.hz != 220.0 || c.distance != 1.0f) continue;

    // Over the whole fall every octave above the ring holds less than the
    // one under it (the ring's own partials end at 1.2 kHz, the top is 5.2 kHz).
    const size_t whole = at(flight);
    const double ring_band = band_energy(out.left, 0, whole, 155.0, 1245.0);
    const double first = band_energy(out.left, 0, whole, 1245.0, 2489.0);
    const double second = band_energy(out.left, 0, whole, 2489.0, 4978.0);
    const double above = band_energy(out.left, 0, whole, 5400.0, 20000.0);
    std::snprintf(label, sizeof label,
                  "a far strike, octave by octave: 1.2 to 2.5 kHz holds %.1f dB re the ring's band, 2.5 to 5 kHz %.1f dB, over the top %.1f dB",
                  0.5 * db(first / ring_band), 0.5 * db(second / ring_band), 0.5 * db(above / ring_band));
    std::printf("%s\n", label);
    EXPECT(first < 0.3 * ring_band && second < 0.25 * first, "each octave of the fall holds less than the one under it");
    EXPECT(second > 1.0e-4 * ring_band, "and the top is still there to be heard");
    EXPECT(above < 0.02 * second, "nothing starts above the top");

    // It starts as a cluster, not as one tone.
    const double share = tone_share(out.left, 0, at(0.01));
    std::snprintf(label, sizeof label, "the first 10 ms of a far strike have %.2f of their energy in the strongest line", share);
    std::printf("%s\n", label);
    EXPECT(share < 0.6, "a strike starts as a cluster of partials, not as one tone");
  }

  // Each partial starts on a phase of its own: near, where a strike is a
  // plain ping, the note and its octave (stretch 0) begin at phases that
  // differ, and differ from strike to strike. 0.1 s is 22 and 44 whole turns.
  {
    bare(device);
    device.set_param(p::kThick, 0.5f);
    double low = 10.0, high = -10.0;
    for (int strike = 0; strike < 6; ++strike) {
      device.set_param(p::kRing, 5.0f);
      device.note_on(strike, 220.0f, 0.8f);
      Stereo out = render(device, 0.1f, kRate);
      double apart = tone_phase(out.left, 440.0, kRate, 0, at(0.1)) - tone_phase(out.left, 220.0, kRate, 0, at(0.1));
      while (apart > kPi) apart -= 2.0 * kPi;
      while (apart < -kPi) apart += 2.0 * kPi;
      low = std::min(low, apart);
      high = std::max(high, apart);
      device.note_off(strike);
      device.set_param(p::kRing, 0.3f);
      render(device, 1.0f, kRate);
    }
    std::snprintf(label, sizeof label, "six strikes: the octave starts between %.2f and %.2f rad from the note", low, high);
    std::printf("%s\n", label);
    EXPECT(high - low > 1.0, "the partials of a strike start on phases of their own");
  }

  // Nothing dies on the way: a far strike on a short ring lands as loud as a
  // near one rings from the start.
  {
    double landed[2];
    int which = 0;
    for (float distance : {0.0f, 1.0f}) {
      bare(device);
      device.set_param(p::kDistance, distance);
      device.set_param(p::kThick, 1.0f);
      device.set_param(p::kRing, 1.0f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 1.2f, kRate);
      const double flight = distance > 0.0f ? std::min(kLand * model_t0(distance), kMaxFlight) : 0.0;
      landed[which++] = tone_level(out.left, 220.0, kRate, at(flight + 0.01), at(flight + 0.06));
    }
    std::snprintf(label, sizeof label, "a far strike on a 1 s ring lands %.1f dB from where a near one starts", db(landed[1]) - db(landed[0]));
    std::printf("%s\n", label);
    EXPECT_NEAR(db(landed[1]) - db(landed[0]), 0.0, 1.5, label);
  }
}

// The ring a strike lands in: how long, how stretched, how thick.
static void test_ring_and_tone() {
  char label[200];
  // Ring is the time the note takes to fall 60 dB.
  for (float ring : {1.0f, 4.0f, 16.0f}) {
    bare(device);
    device.set_param(p::kRing, ring);
    device.set_param(p::kThick, 0.6f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 0.2f + 0.6f * ring, kRate);
    const double early = tone_level(out.left, 440.0, kRate, at(0.1), at(0.2));
    const double late = tone_level(out.left, 440.0, kRate, at(0.1 + 0.5 * ring), at(0.2 + 0.5 * ring));
    std::snprintf(label, sizeof label, "ring %.0f s: the note falls %.1f dB in half of it (30 expected)", ring,
                  db(early) - db(late));
    std::printf("%s\n", label);
    EXPECT_NEAR(db(early) - db(late), 30.0, 1.0, label);
  }
  // The overtones die sooner than the note, the body sooner still.
  {
    bare(device);
    device.set_param(p::kRing, 4.0f);
    device.set_param(p::kThick, 0.6f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 2.4f, kRate);
    auto fall = [&](double hz) {
      return db(tone_level(out.left, hz, kRate, at(0.1), at(0.3))) - db(tone_level(out.left, hz, kRate, at(2.1), at(2.3)));
    };
    std::snprintf(label, sizeof label, "in 2 s of a 4 s ring the note falls %.1f dB, the third overtone %.1f dB, the body %.1f dB",
                  fall(440.0), fall(1760.0), fall(220.0));
    std::printf("%s\n", label);
    EXPECT_NEAR(fall(440.0), 30.0, 1.0, "the note rings for Ring");
    EXPECT_NEAR(fall(1760.0), 30.0 * std::pow(4.0, 0.7), 3.0, "an overtone four times up rings 4^0.7 times shorter");
    EXPECT_NEAR(fall(220.0), 30.0 / 0.4, 3.0, "the body rings 0.4 of Ring");
  }
  // Ring turned under a ringing note changes how it goes on.
  {
    bare(device);
    device.set_param(p::kRing, 16.0f);
    device.note_on(1, 440.0f, 0.8f);
    render(device, 0.5f, kRate);
    device.set_param(p::kRing, 1.0f);
    Stereo out = render(device, 0.8f, kRate);
    const double drop = db(tone_level(out.left, 440.0, kRate, at(0.1), at(0.2))) -
                        db(tone_level(out.left, 440.0, kRate, at(0.6), at(0.7)));
    EXPECT_NEAR(drop, 30.0, 1.5, "ring shortened under a ringing note: it dies at the new rate");
  }

  // Stretch pulls the overtones sharp by what a stiff plate's ratio says.
  for (float stretch : {0.0f, 0.5f, 1.0f}) {
    bare(device);
    device.set_param(p::kStretch, stretch);
    device.set_param(p::kThick, 0.3f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    const double second = dominant_frequency(out.left, kRate, 440.0 * 1.8, 440.0 * 2.6, at(0.1), at(0.9));
    const double third = dominant_frequency(out.left, kRate, 440.0 * 2.7, 440.0 * 4.5, at(0.1), at(0.9));
    const double note = dominant_frequency(out.left, kRate, 440.0 * 0.9, 440.0 * 1.1, at(0.1), at(0.9));
    const double want2 = 1200.0 * std::log2(model_ratio(2, stretch) / 2.0);
    const double want3 = 1200.0 * std::log2(model_ratio(3, stretch) / 3.0);
    std::snprintf(label, sizeof label,
                  "stretch %.1f: the second partial is %.1f cents sharp of the octave (model %.1f), the third %.1f (model %.1f)",
                  stretch, cents(second, 880.0), want2, cents(third, 1320.0), want3);
    std::printf("%s\n", label);
    EXPECT_NEAR(cents(second, 880.0), want2, 3.0, label);
    EXPECT_NEAR(cents(third, 1320.0), want3, 3.0, label);
    EXPECT(std::fabs(cents(note, 440.0)) < 1.0, "stretch leaves the note where it is");
  }
  // Stretch turned under a ringing note moves its overtones, and a chirp in
  // flight makes for the new places.
  {
    bare(device);
    device.set_param(p::kDistance, 1.0f);
    device.set_param(p::kThick, 0.3f);
    device.note_on(1, 440.0f, 0.8f);
    render(device, 0.3f, kRate);
    device.set_param(p::kStretch, 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    const double second = dominant_frequency(out.left, kRate, 440.0 * 1.8, 440.0 * 2.6, at(1.0), at(1.9));
    EXPECT_NEAR(cents(second, 880.0), 1200.0 * std::log2(model_ratio(2, 1.0) / 2.0), 3.0,
                "stretch moved under a chirp in flight: it lands on the new place");
  }

  // Thick: thin ice is overtones over a weak note and no body; thick ice is
  // the note, with a body an octave under it.
  {
    double body[3], note[3], fourth[3];
    int which = 0;
    for (float thick : {0.0f, 0.5f, 1.0f}) {
      bare(device);
      device.set_param(p::kThick, thick);
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 0.4f, kRate);
      body[which] = tone_level(out.left, 220.0, kRate, at(0.05), at(0.25));
      note[which] = tone_level(out.left, 440.0, kRate, at(0.05), at(0.25));
      fourth[which] = tone_level(out.left, 1760.0, kRate, at(0.05), at(0.25));
      std::printf("thick %.1f: body %.1f dB, note %.1f dB, fourth partial %.1f dB\n", thick, db(body[which]),
                  db(note[which]), db(fourth[which]));
      ++which;
    }
    EXPECT(body[0] < 0.001 * note[0], "thin ice has no body under the note");
    EXPECT(db(body[2]) - db(note[2]) > -6.0 && db(body[2]) - db(note[2]) < 0.0,
           "thick ice has a body an octave under the note, a little softer than it");
    EXPECT(db(body[1]) - db(note[1]) > db(body[0]) - db(note[0]) + 20.0 && body[2] > 2.0 * body[1],
           "the body comes up with Thick");
    EXPECT(db(fourth[0]) - db(note[0]) > 6.0, "thin ice: the overtones are louder than the note");
    EXPECT(db(fourth[2]) - db(note[2]) < -12.0, "thick ice: the overtones are far under the note");
  }

  // Width: at zero the two sides are the same sample for sample; open, a
  // strike sits to its key's side and the far shores answer from the other.
  {
    device.init(kRate);
    device.set_param(p::kWidth, 0.0f);
    device.set_param(p::kCracks, 1.0f);
    device.set_param(p::kRoam, 1.0f);
    device.note_on(1, 440.0f, 0.8f);
    device.note_on(2, 466.16f, 0.8f);
    Stereo mono = render(device, 3.0f, kRate);
    EXPECT(mono.left == mono.right, "width 0 is mono, sample for sample");

    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kCracks, 0.0f);
    device.set_param(p::kShore, 0.0f);
    device.note_on(1, 440.0f, 0.8f);  // A4, key 69: the right
    Stereo right = render(device, 0.5f, kRate);
    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kCracks, 0.0f);
    device.set_param(p::kShore, 0.0f);
    device.note_on(1, 466.16f, 0.8f);  // the next key: the left
    Stereo left = render(device, 0.5f, kRate);
    const double lean_right = db(rms(right.right)) - db(rms(right.left));
    const double lean_left = db(rms(left.left)) - db(rms(left.right));
    std::snprintf(label, sizeof label, "width 1: one key leans %.1f dB right, the next %.1f dB left", lean_right, lean_left);
    std::printf("%s\n", label);
    EXPECT(lean_right > 2.0 && lean_right < 9.0 && lean_left > 2.0 && lean_left < 9.0, label);
    EXPECT(correlation(right.left, right.right) > 0.99, "a strike is placed, not doubled: both sides in phase");
  }
}

// Shore: three later arrivals of the strike, where the header says, each
// quieter, each lower at the start and longer in its fall.
static void test_shore() {
  char label[200];
  const double note = 3000.0;
  // A top of 10 kHz: the note starts at 7.2 kHz and in its echoes at 5.8, 4.7
  // and 3.6 kHz, all above it; its overtones stay over 5.6 kHz.
  const float bright_here = 0.912f;
  // Near enough (distance 0.2) that every arrival has landed and died, with a
  // ring of 0.3 s, before the next one comes.
  const double top = kNoteStart * model_top(bright_here);
  const double t0 = model_t0(0.2);
  Stereo with, without;
  for (int pass = 0; pass < 2; ++pass) {
    bare(device);
    device.set_param(p::kDistance, 0.2f);
    device.set_param(p::kBright, bright_here);
    device.set_param(p::kThick, 0.0f);
    device.set_param(p::kRing, 0.3f);
    device.set_param(p::kShore, pass == 0 ? 1.0f : 0.0f);
    device.note_on(1, static_cast<float>(note), 0.8f);
    (pass == 0 ? with : without) = render(device, 2.5f, kRate);
  }
  double last_level = 1.0e9, last_left = 0.0;
  for (int e = 0; e < 3; ++e) {
    const double when = kEchoSeconds[e];
    // The onset: the first sample to reach a quarter of the echo's peak.
    const double echo_peak = peak(with.left, at(when), at(when + 0.05));
    size_t onset = at(when - 0.1);
    while (onset < with.size() && std::fabs(with.left[onset]) < 0.25 * echo_peak) ++onset;
    const double before = rms(with.left, at(when - 0.03), at(when - 0.003));
    const double after = rms(with.left, at(when + 0.003), at(when + 0.03));
    std::snprintf(label, sizeof label, "shore: echo %d begins at %.1f ms (expected %.0f), %.1f dB over what was ringing", e + 1,
                  1000.0 * onset / kRate, 1000.0 * when, db(after) - db(before));
    std::printf("%s\n", label);
    EXPECT(std::fabs(static_cast<double>(onset) / kRate - when) < 0.006 && after > 5.0 * before, label);
    EXPECT(rms(without.left, at(when + 0.003), at(when + 0.03)) < 0.05 * after, "shore 0: nothing arrives there");
    // Quieter each time.
    EXPECT(after < last_level, "each echo is quieter than the one before");
    last_level = after;
    // Lower at the start, and longer in the fall: what is left 20 ms in.
    const double echo_top = top * kEchoTop[e];
    const double echo_t0 = (t0 + kEchoExtraT0) * kEchoStretch[e];
    const double start = pitch_at(with.left, kRate, when + 0.005, 0.006, 2900.0, 5600.0);
    const double start_law = note + (echo_top - note) * built_law(0.005, echo_t0);
    const double later = pitch_at(with.left, kRate, when + 0.02, 0.008, 2900.0, 5600.0);
    const double left = (later - note) / (echo_top - note);
    const double law = built_law(0.02, echo_t0);
    std::snprintf(label, sizeof label,
                  "shore: echo %d is at %.0f Hz 5 ms in (model %.0f, top %.0f) and has %.3f of its fall left after 20 ms (model %.3f)",
                  e + 1, start, start_law, echo_top, left, law);
    std::printf("%s\n", label);
    EXPECT(std::fabs(start / start_law - 1.0) < 0.04, label);
    EXPECT(std::fabs(left / law - 1.0) < 0.12 && left > last_left, label);
    last_left = left;
  }
  // The strike itself, by the same measure, has less of its fall left than any echo.
  {
    const double later = pitch_at(with.left, kRate, 0.02, 0.008, 2900.0, 5600.0);
    const double left = (later - note) / (top - note);
    std::snprintf(label, sizeof label, "shore: the strike itself has %.3f left after 20 ms (model %.3f)", left,
                  built_law(0.02, t0));
    std::printf("%s\n", label);
    EXPECT(left < 0.5 * built_law(0.02, (t0 + kEchoExtraT0) * kEchoStretch[0]), label);
  }
  // Echoes come from the other side, and from both.
  {
    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kCracks, 0.0f);
    device.set_param(p::kCrack, 0.0f);
    device.set_param(p::kRing, 0.3f);
    device.set_param(p::kShore, 1.0f);
    device.set_param(p::kDistance, 0.1f);  // each echo has landed and died before the next
    device.note_on(1, 440.0f, 0.8f);  // sits right
    Stereo out = render(device, 2.5f, kRate);
    double lean[3];
    for (int e = 0; e < 3; ++e) {
      lean[e] = db(rms(out.right, at(kEchoSeconds[e]), at(kEchoSeconds[e] + 0.1))) -
                db(rms(out.left, at(kEchoSeconds[e]), at(kEchoSeconds[e] + 0.1)));
    }
    std::snprintf(label, sizeof label, "shore: the echoes of a strike on the right lean %.1f, %.1f and %.1f dB right", lean[0],
                  lean[1], lean[2]);
    std::printf("%s\n", label);
    EXPECT(lean[0] < -3.0 && lean[1] > 3.0 && lean[2] < -2.0, label);
  }
}
// The lake: with Cracks at zero a key is one strike; above it the lake
// strikes by itself at the rate the knob says, the same way every time.
static void lake(Ice& d, float cracks, float roam) {
  bare(d);
  d.set_param(p::kRing, 0.3f);
  d.set_param(p::kCrack, 1.0f);
  d.set_param(p::kCracks, cracks);
  d.set_param(p::kRoam, roam);
}

static void test_lake() {
  char label[200];
  const float seconds = 30.0f;
  lake(device, 0.0f, 0.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo none = render(device, seconds, kRate);
  const size_t alone = snap_onsets(none.left, kRate).size();
  std::snprintf(label, sizeof label, "cracks 0: %zu strike in 30 s", alone);
  std::printf("%s\n", label);
  EXPECT(alone == 1, label);
  EXPECT(peak(none.left, at(8.0)) == 0.0, "cracks 0: a held key that has rung out is silent");

  double counts[3];
  int which = 0;
  for (float cracks : {0.5f, 0.75f, 1.0f}) {
    lake(device, cracks, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, seconds, kRate);
    const std::vector<double> onsets = snap_onsets(out.left, kRate);
    const double expected = 1.0 + seconds * kMaxCracks * cracks * cracks * cracks;
    counts[which++] = static_cast<double>(onsets.size());
    double shortest = 1.0e9, longest = 0.0;
    for (size_t i = 2; i < onsets.size(); ++i) {
      shortest = std::min(shortest, onsets[i] - onsets[i - 1]);
      longest = std::max(longest, onsets[i] - onsets[i - 1]);
    }
    const double mean = 1.0 / (kMaxCracks * cracks * cracks * cracks);
    std::snprintf(label, sizeof label,
                  "cracks %.2f: %zu strikes in 30 s (%.0f expected), gaps %.2f to %.2f of the mean (0.4 to 1.6)", cracks,
                  onsets.size(), expected, shortest / mean, longest / mean);
    std::printf("%s\n", label);
    EXPECT(std::fabs(static_cast<double>(onsets.size()) / expected - 1.0) < 0.12, label);
    EXPECT(shortest > 0.38 * mean && longest < 1.65 * mean, label);

    // The same on a second run, to the sample.
    lake(device, cracks, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo again = render(device, seconds, kRate);
    EXPECT(again.left == out.left && again.right == out.right, "the lake cracks the same way on a second run");
  }
  std::snprintf(label, sizeof label, "strikes go as cracks cubed: %.0f, %.0f, %.0f for 0.5, 0.75, 1", counts[0], counts[1],
                counts[2]);
  std::printf("%s\n", label);
  EXPECT(std::fabs(counts[2] / counts[0] / 7.69 - 1.0) < 0.15 && std::fabs(counts[2] / counts[1] / 2.35 - 1.0) < 0.12, label);

  // The lake stops with the keys, and waits for them: nothing strikes after
  // the release, however long the ring.
  {
    lake(device, 1.0f, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 2.0f, kRate);
    device.note_off(1);
    Stereo out = render(device, 4.0f, kRate);
    EXPECT(snap_onsets(out.left, kRate).empty() || peak(out.left, at(0.2)) < 1.0e-4,
           "no crack after the key is released");
    EXPECT(peak(out.left, at(3.0)) == 0.0, "and the lake sleeps");
  }

  // The lake strikes whatever is held: with two keys down each gets its
  // share. Near pings on a short ring, no snap: a strike is a jump in the
  // level of its key's note from one 20 ms window to the next.
  {
    lake(device, 1.0f, 0.0f);
    device.set_param(p::kCrack, 0.0f);
    device.set_param(p::kThick, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    device.note_on(2, 587.33f, 0.8f);
    Stereo out = render(device, seconds, kRate);
    int strikes[2] = {0, 0};
    const double keys[2] = {220.0, 587.33};
    for (int k = 0; k < 2; ++k) {
      double before = 1.0;
      for (size_t from = at(0.1); from + at(0.02) <= out.size(); from += at(0.02)) {
        const double here = tone_level(out.left, keys[k], kRate, from, from + at(0.02));
        if (here > 1.5 * before && here > 0.002) ++strikes[k];
        before = here;
      }
    }
    std::snprintf(label, sizeof label, "two keys held for 30 s: the lake strikes one %d times and the other %d times", strikes[0],
                  strikes[1]);
    std::printf("%s\n", label);
    EXPECT(strikes[0] > 25 && strikes[1] > 25 && strikes[0] < 2 * strikes[1] && strikes[1] < 2 * strikes[0], label);
  }

  // Sometimes an octave up: about a quarter of the lake's own strikes land
  // on 440 Hz and not on the held 220 Hz. A strike on 220 Hz has a third
  // partial at 660 Hz; one on 440 Hz has nothing there, and with a short
  // ring what the last strike left there is 40 dB down by the next.
  {
    lake(device, 1.0f, 0.0f);
    device.set_param(p::kThick, 0.3f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 60.0f, kRate);
    const std::vector<double> onsets = snap_onsets(out.left, kRate);
    std::vector<double> third;
    for (size_t i = 1; i < onsets.size(); ++i) {
      third.push_back(tone_level(out.left, 660.0, kRate, at(onsets[i] + 0.004), at(onsets[i] + 0.044)));
    }
    std::vector<double> sorted = third;
    std::sort(sorted.begin(), sorted.end());
    const double usual = sorted[sorted.size() * 3 / 4];
    int low = 0, high = 0;
    for (double level : third) (level < 0.2 * usual ? high : low) += 1;
    std::snprintf(label, sizeof label, "in a minute %d of the lake's strikes land on the held note and %d an octave up (a quarter expected)",
                  low, high);
    std::printf("%s\n", label);
    const double share = static_cast<double>(high) / std::max(1, low + high);
    EXPECT(share > 0.17 && share < 0.33, label);
  }
  // And it is the octave: with the overtones stretched away from 440 Hz,
  // only a strike an octave up puts anything there. The loudest fifth of a
  // second, because strikes start on phases of their own and a long window
  // adds them up to anything.
  {
    auto loudest = [&](const Stereo& out, double hz) {
      double best = 0.0;
      for (size_t from = at(0.5); from + at(0.2) <= out.size(); from += at(0.05)) {
        best = std::max(best, tone_level(out.left, hz, kRate, from, from + at(0.2)));
      }
      return best;
    };
    double there[2];
    for (int pass = 0; pass < 2; ++pass) {
      lake(device, pass == 0 ? 1.0f : 0.0f, 0.0f);
      device.set_param(p::kCrack, 0.0f);  // the snap is noise, and noise is at every frequency
      device.set_param(p::kRing, 1.5f);   // and a ring that dies in 0.3 s is 17 dB down a semitone away
      device.set_param(p::kStretch, 1.0f);
      device.set_param(p::kThick, 0.6f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 6.0f, kRate);
      there[pass] = loudest(out, 440.0);
      if (pass == 0) {
        const double beside = std::max(loudest(out, 415.3), loudest(out, 466.2));
        std::snprintf(label, sizeof label, "strikes an octave up put %.1f dB at 440 Hz, %.1f dB over the semitones beside it",
                      db(there[0]), db(there[0]) - db(beside));
        std::printf("%s\n", label);
        EXPECT(there[0] > 5.0 * beside, label);
      }
    }
    EXPECT(there[1] < 0.01 * there[0], "and without the lake nothing is there");
  }

  // Roam: without it every crack of the lake is the same strike, half as
  // loud as the key's; with it they differ in loudness, in place and in how
  // long they fall.
  {
    double spread[2], sides[2];
    for (int pass = 0; pass < 2; ++pass) {
      lake(device, 1.0f, pass == 0 ? 0.0f : 1.0f);
      device.set_param(p::kWidth, 1.0f);
      device.set_param(p::kDistance, 0.3f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, seconds, kRate);
      const std::vector<double> onsets = snap_onsets(out.left, kRate);
      double lo = 1.0e9, hi = 0.0, lean_lo = 1.0e9, lean_hi = -1.0e9;
      for (size_t i = 1; i < onsets.size(); ++i) {
        const size_t from = at(onsets[i]);
        const double l = rms(out.left, from, from + at(0.004)), r = rms(out.right, from, from + at(0.004));
        const double level = std::sqrt(l * l + r * r);
        lo = std::min(lo, level);
        hi = std::max(hi, level);
        lean_lo = std::min(lean_lo, db(r) - db(l));
        lean_hi = std::max(lean_hi, db(r) - db(l));
      }
      spread[pass] = db(hi) - db(lo);
      sides[pass] = lean_hi - lean_lo;
      std::printf("roam %d: the lake's snaps span %.1f dB in level and %.1f dB from side to side\n", pass, spread[pass],
                  sides[pass]);
    }
    EXPECT(spread[0] < 5.0 && sides[0] < 1.0, "roam 0: every crack of the lake is alike (a snap is noise: a few dB)");
    EXPECT(spread[1] > 10.0 && sides[1] > 12.0, "roam 1: they differ in loudness and in place");
  }
  // The lake's own strikes are softer than the key's.
  {
    lake(device, 1.0f, 0.0f);
    device.set_param(p::kCrack, 0.0f);
    device.set_param(p::kRing, 0.3f);
    device.set_param(p::kThick, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    const double key = tone_level(out.left, 220.0, kRate, 0, at(0.05));
    double own = 0.0;
    for (size_t from = at(0.1); from + at(0.05) <= out.left.size(); from += at(0.01)) {
      own = std::max(own, tone_level(out.left, 220.0, kRate, from, from + at(0.05)));
    }
    std::snprintf(label, sizeof label, "the lake's own strikes are %.1f dB under the key's", db(key) - db(own));
    std::printf("%s\n", label);
    EXPECT(db(key) - db(own) > 3.0 && db(key) - db(own) < 9.0, label);
  }
}

// The snap: a few milliseconds of bright noise at the strike, and nothing
// else changes. The two renders differ by the snap alone.
static Stereo snap_alone(float rate, float crack, float distance, int strikes) {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    bare(device, rate);
    device.set_param(p::kDistance, distance);
    device.set_param(p::kCrack, pass == 0 ? crack : 0.0f);
    out[pass] = Stereo();
    for (int n = 0; n < strikes; ++n) {
      device.note_on(n, 330.0f, 0.8f);
      out[pass] = concat(out[pass], render(device, 0.05f, rate));
    }
  }
  for (size_t i = 0; i < out[0].size(); ++i) {
    out[0].left[i] -= out[1].left[i];
    out[0].right[i] -= out[1].right[i];
  }
  return out[0];
}

static void test_snap() {
  char label[200];
  Stereo snap = snap_alone(kRate, 1.0f, 0.0f, 1);
  const double early = rms(snap.left, 0, at(0.005));
  const double late = rms(snap.left, at(0.02), at(0.04));
  bare(device);
  device.note_on(1, 330.0f, 0.8f);
  Stereo tone = render(device, 0.05f, kRate);
  std::snprintf(label, sizeof label,
                "crack 1 adds %.1f dB re the strike in the first 5 ms, %.0f %% of it above 5 kHz, and %.1f dB after 20 ms",
                db(early) - db(rms(tone.left, 0, at(0.005))), 100.0 * energy_above(snap.left, 5000.0, kRate, 0, at(0.005)),
                db(late) - db(rms(tone.left, 0, at(0.005))));
  std::printf("%s\n", label);
  EXPECT(early > 0.3 * rms(tone.left, 0, at(0.005)), "crack adds a snap as loud as the strike is in its first 5 ms");
  EXPECT(late < 0.001 * early, "the snap is over inside 20 ms");
  // By this one-pole measure white noise itself has 0.36 of its energy above 5 kHz.
  EXPECT(energy_above(snap.left, 5000.0, kRate, 0, at(0.005)) > 0.36, "the snap is broadband: brighter than white noise");
  EXPECT(energy_above(snap.left, 500.0, kRate, 0, at(0.005)) > 0.9, "and brittle: next to nothing under 500 Hz");
  EXPECT(energy_above(tone.left, 5000.0, kRate, 0, at(0.005)) < 0.02, "which the strike without it does not have");

  Stereo half = snap_alone(kRate, 0.5f, 0.0f, 1);
  EXPECT_NEAR(db(rms(half.left, 0, at(0.005))) - db(early), -6.0, 0.5, "crack at half is 6 dB less snap");
  Stereo far = snap_alone(kRate, 1.0f, 1.0f, 1);
  EXPECT_NEAR(db(rms(far.left, 0, at(0.005))) - db(early), db(0.4), 0.5, "a far strike snaps 8 dB softer");

  // Snaps that fall together add in power, as cracks of their own would: four
  // keys at once snap twice as loud as one, sixteen four times, not sixteen.
  {
    double level[3];
    int which = 0;
    for (int keys : {1, 4, 16}) {
      Stereo out[2];
      for (int pass = 0; pass < 2; ++pass) {
        bare(device);
        device.set_param(p::kCrack, pass == 0 ? 1.0f : 0.0f);
        for (int n = 0; n < keys; ++n) device.note_on(n, 330.0f, 0.8f);
        out[pass] = render(device, 0.05f, kRate);
      }
      for (size_t i = 0; i < out[0].size(); ++i) out[0].left[i] -= out[1].left[i];
      level[which++] = rms(out[0].left, 0, at(0.005));
    }
    std::snprintf(label, sizeof label, "four keys at once snap %.1f dB louder than one (6 in power, 12 if they were one noise), sixteen %.1f dB (12, 24)",
                  db(level[1]) - db(level[0]), db(level[2]) - db(level[0]));
    std::printf("%s\n", label);
    EXPECT_NEAR(db(level[1]) - db(level[0]), 6.0, 1.5, "snaps that fall together add in power");
    EXPECT_NEAR(db(level[2]) - db(level[0]), 12.0, 1.5, "snaps that fall together add in power");
  }

  // As loud at every sample rate: sixty-four snaps, the part under 6 kHz
  // (four poles, so that what a higher rate adds above it does not count).
  double level[3];
  int which = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    Stereo many = snap_alone(rate, 1.0f, 0.0f, 64);
    const double a = std::exp(-2.0 * kPi * 6000.0 / rate);
    double low[4] = {0.0, 0.0, 0.0, 0.0}, sum = 0.0;
    for (size_t i = 0; i < many.size(); ++i) {
      double x = many.left[i];
      for (double& stage : low) {
        stage = x + (stage - x) * a;
        x = stage;
      }
      sum += x * x;
    }
    level[which++] = db(std::sqrt(sum / static_cast<double>(many.size())));
  }
  std::snprintf(label, sizeof label, "the snap under 6 kHz: %.1f dB at 44.1 kHz and %.1f dB at 96 kHz re 48 kHz",
                level[0] - level[1], level[2] - level[1]);
  std::printf("%s\n", label);
  EXPECT(std::fabs(level[0] - level[1]) < 1.2 && std::fabs(level[2] - level[1]) < 1.2, label);
}
// Loudness: velocity, one key at a sane level across the keyboard, ten keys
// under the clip knee, and the clip and the note clamp themselves.
static void test_levels() {
  char label[200];
  {
    double level[2], bright[2];
    int which = 0;
    for (float gain : {0.25f, 1.0f}) {
      bare(device);
      device.set_param(p::kThick, 0.5f);
      device.note_on(1, 330.0f, gain);
      Stereo out = render(device, 0.5f, kRate);
      level[which] = rms(out.left, 0, at(0.3));
      bright[which] = tone_level(out.left, 1650.0, kRate, at(0.02), at(0.12)) / tone_level(out.left, 330.0, kRate, at(0.02), at(0.12));
      ++which;
    }
    std::snprintf(label, sizeof label, "a soft key is %.1f dB under a hard one, its fifth partial %.1f dB duller against the note",
                  db(level[1]) - db(level[0]), db(bright[1]) - db(bright[0]));
    std::printf("%s\n", label);
    EXPECT(db(level[1]) - db(level[0]) > 12.0 && db(level[1]) - db(level[0]) < 30.0, label);
    EXPECT(db(bright[1]) - db(bright[0]) > 3.0, "a harder strike is a brighter one");
  }
  double lowest = 0.0, highest = -200.0;
  for (double hz : {28.0, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 3520.0, 4186.0}) {
    device.init(kRate);
    device.note_on(1, static_cast<float>(hz), 0.7f);
    Stereo out = render(device, 2.5f, kRate);
    const double here = db(both_peak(out));
    lowest = std::min(lowest, here);
    highest = std::max(highest, here);
  }
  std::snprintf(label, sizeof label, "one key at gain 0.7, 28 Hz to 4.2 kHz, peaks between %.1f and %.1f dBFS", lowest, highest);
  std::printf("%s\n", label);
  EXPECT(lowest > -24.0 && highest < -10.0, label);

  double ten[3];
  for (int pass = 0; pass < 3; ++pass) {
    device.init(kRate);
    if (pass == 1) device.set_param(p::kDistance, 0.0f);
    if (pass == 2) {
      device.set_param(p::kCracks, 1.0f);
      device.set_param(p::kShore, 1.0f);
      device.set_param(p::kRing, 30.0f);
    }
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo out = render(device, pass == 2 ? 20.0f : 4.0f, kRate);
    ten[pass] = both_peak(out);
  }
  std::snprintf(label, sizeof label,
                "ten held keys peak at %.2f (default), %.2f (all near, in phase at the strike), %.2f (lake at full rate for 20 s)",
                ten[0], ten[1], ten[2]);
  std::printf("%s\n", label);
  EXPECT(ten[0] < 0.5, "ten held keys stay under the clip knee on the default patch");
  EXPECT(ten[1] < 0.6 && ten[2] < 0.6, "and within a tenth of it at their worst");

  // The soft clip is there: a pile at full volume is bent, not cut and not over.
  {
    device.init(kRate);
    device.set_param(p::kVolume, 6.0f);
    device.set_param(p::kDistance, 0.0f);
    device.set_param(p::kCrack, 1.0f);
    for (int n = 0; n < 12; ++n) device.note_on(n, 220.0f * std::pow(2.0f, n / 12.0f), 1.0f);
    Stereo out = render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label, "twelve keys at full volume peak at %.3f", both_peak(out));
    std::printf("%s\n", label);
    EXPECT(both_peak(out) > 0.7 && both_peak(out) <= 1.0, label);
  }
  // A ring holds no more than 1.8 of its hardest strikes: a key struck sixty
  // times in three seconds on a 30 s ring (which would add up to 18 dB over
  // one strike) stays near 5 dB over it, and is not pulled further down.
  {
    double level[3];
    for (int pass = 0; pass < 2; ++pass) {
      bare(device);
      device.set_param(p::kThick, 1.0f);
      device.set_param(p::kRing, 30.0f);
      for (int strike = 0; strike < (pass == 0 ? 1 : 60); ++strike) {
        device.note_on(1, 220.0f, 1.0f);
        render(device, 0.05f, kRate);
      }
      render(device, 0.3f, kRate);
      Stereo out = render(device, 1.2f, kRate);
      level[pass] = rms(out.left, 0, at(0.2));
      if (pass == 1) level[2] = rms(out.left, at(1.0), at(1.2));
    }
    std::snprintf(label, sizeof label, "one key struck sixty times on a 30 s ring rings %.1f dB over one strike, and %.1f dB a second later",
                  db(level[1]) - db(level[0]), db(level[2]) - db(level[0]));
    std::printf("%s\n", label);
    // (How far under the ceiling it sits depends on the phases the last strikes landed with.)
    EXPECT(db(level[1]) - db(level[0]) > 0.0 && db(level[1]) - db(level[0]) < 5.6, label);
    EXPECT(db(level[1]) - db(level[2]) < 2.0 + 2.0, "what is under the ceiling dies at the ring's own rate");
  }
  // Volume is decibels.
  {
    double level[2];
    for (int pass = 0; pass < 2; ++pass) {
      bare(device);
      device.set_param(p::kVolume, pass == 0 ? -12.0f : -24.0f);
      device.note_on(1, 330.0f, 0.8f);
      Stereo out = render(device, 0.3f, kRate);
      level[pass] = rms(out.left);
    }
    EXPECT_NEAR(db(level[0]) - db(level[1]), 12.0, 0.05, "volume is decibels");
  }
  // A note far above the keyboard is held to 8.4 kHz; nonsense is ignored.
  {
    bare(device);
    device.note_on(1, 30000.0f, 0.8f);
    Stereo out = render(device, 0.3f, kRate);
    const double found = dominant_frequency(out.left, kRate, 7000.0, 10000.0, at(0.05));
    EXPECT_NEAR(found, 8400.0, 20.0, "a note above the range sounds at the top of it");
    bare(device);
    device.note_on(1, std::nanf(""), 0.8f);
    device.note_on(2, 440.0f, std::nanf(""));
    device.note_off(77);
    Stereo odd = render(device, 0.3f, kRate);
    EXPECT(finite(odd.left) && tone_level(odd.left, 440.0, kRate, at(0.05)) > 0.001,
           "a NaN frequency is ignored and a NaN gain is a middling strike");
  }
}

static void chord(Ice& d, int keys) {
  d.init(kRate);
  d.set_param(p::kCracks, 0.0f);
  d.set_param(p::kCrack, 0.0f);
  d.set_param(p::kThick, 0.8f);
  d.set_param(p::kBright, 0.0f);
  // A semitone apart from 220 Hz: no key's body or overtone lands on another key.
  for (int n = 0; n < keys; ++n) d.note_on(n, 220.0f * std::pow(2.0f, n / 12.0f), 0.8f);
}

// Nothing clicks, and the voices keep their notes.
static void test_clicks_and_voices() {
  char label[200];
  auto three = [](Ice& d) { chord(d, 3); };
  auto full = [](Ice& d) { chord(d, Ice::kMaxVoices); };
  const double down = suddenness(three, [](Ice& d) { d.set_param(p::kVolume, -40.0f); });
  const double up = suddenness(three, [](Ice& d) { d.set_param(p::kVolume, 6.0f); });
  const double narrow = suddenness(three, [](Ice& d) { d.set_param(p::kWidth, 0.0f); });
  const double ring = suddenness(three, [](Ice& d) { d.set_param(p::kRing, 0.3f); });
  const double stretch = suddenness(three, [](Ice& d) { d.set_param(p::kStretch, 1.0f); });
  const double again = suddenness(three, [](Ice& d) { d.note_on(1, 220.0f * std::pow(2.0f, 1 / 12.0f), 0.8f); });
  const double steal = suddenness(full, [](Ice& d) { d.note_on(50, 196.0f, 0.8f); });
  const double off = suddenness(three, [](Ice& d) { d.note_off(1); });
  std::snprintf(label, sizeof label,
                "how much of a change is there in 8 samples: volume down %.3f, up %.3f, width %.3f, ring %.3f, stretch %.3f, "
                "a key struck again %.3f, a voice stolen %.3f, a key released %.3f",
                down, up, narrow, ring, stretch, again, steal, off);
  std::printf("%s\n", label);
  EXPECT(down < 0.15 && up < 0.15, "volume thrown across its range under a chord arrives gradually");
  EXPECT(narrow < 0.15, "width thrown to mono arrives gradually");
  EXPECT(ring < 0.15 && stretch < 0.15, "ring and stretch thrown under a chord do not step the sound");
  // A strike is meant to be heard at once: it comes up in 0.6 ms, a quarter of that in 8 samples.
  EXPECT(again < 0.3, "a key struck again comes up, it does not jump");
  EXPECT(steal < 0.15, "a stolen voice fades");
  EXPECT(off == 0.0, "a key released rings on untouched");

  // Volume swept under a ringing low note against the same note left alone:
  // the largest step between samples stays the wave's own.
  {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      bare(device);
      device.set_param(p::kThick, 1.0f);
      device.set_param(p::kRing, 20.0f);
      device.note_on(1, 110.0f, 0.8f);
      render(device, 0.3f, kRate);
      out[pass] = Stereo();
      for (int step = 0; step < 100; ++step) {
        if (pass == 1) device.set_param(p::kVolume, -12.0f - 0.2f * static_cast<float>((step * 7) % 31));
        out[pass] = concat(out[pass], render(device, 0.005f, kRate));
      }
    }
    std::snprintf(label, sizeof label, "volume swept under a note: largest step %.5f (%.5f left alone)", max_step(out[1].left),
                  max_step(out[0].left));
    std::printf("%s\n", label);
    EXPECT(max_step(out[1].left) < 1.2 * max_step(out[0].left), label);
  }

  // Every voice held, then two keys in one block: both sound.
  {
    chord(device, Ice::kMaxVoices);
    render(device, 0.5f, kRate);
    device.note_on(40, 2000.0f, 0.8f);
    device.note_on(41, 2700.0f, 0.8f);
    Stereo out = render(device, 0.3f, kRate);
    const double a = tone_level(out.left, 2000.0, kRate, at(0.05)), b = tone_level(out.left, 2700.0, kRate, at(0.05));
    std::snprintf(label, sizeof label, "held chord, then two keys in one block: %.1f dB and %.1f dB", db(a), db(b));
    std::printf("%s\n", label);
    EXPECT(a > 0.003 && b > 0.003 && a < 4.0 * b && b < 4.0 * a, label);
  }
  // A key struck twice inside a steal fade takes one voice, and one release ends it.
  {
    chord(device, Ice::kMaxVoices);
    device.set_param(p::kRing, 30.0f);
    render(device, 1.0f, kRate);
    device.note_on(40, 2000.0f, 0.8f);
    device.note_on(40, 2000.0f, 0.8f);
    Stereo out = render(device, 0.5f, kRate);
    int alive = 0;
    // A held note reads -27 to -34 dB here; where one was taken, what its
    // neighbours a semitone away leak into the reading is near -60 dB.
    for (int n = 0; n < Ice::kMaxVoices; ++n) {
      if (tone_level(out.left, 220.0 * std::pow(2.0, n / 12.0), kRate, at(0.1)) > 0.006) ++alive;
    }
    std::snprintf(label, sizeof label, "a key struck twice during a steal: %d of twelve held notes still ring", alive);
    std::printf("%s\n", label);
    EXPECT(alive == Ice::kMaxVoices - 1, label);
    device.set_param(p::kRing, 0.3f);
    device.set_param(p::kCracks, 1.0f);
    for (int n = 0; n < Ice::kMaxVoices; ++n) device.note_off(n);
    device.note_off(40);
    render(device, 4.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(both_peak(rest) == 0.0, "after every release nothing is left holding a key: the lake is silent");
  }
  // A key released while the note it stole a voice for is still waiting never sounds.
  {
    chord(device, Ice::kMaxVoices);
    render(device, 0.5f, kRate);
    device.note_on(40, 2000.0f, 0.8f);
    device.note_off(40);
    Stereo out = render(device, 0.3f, kRate);
    EXPECT(tone_level(out.left, 2000.0, kRate, at(0.05)) < 1.0e-4, "a key let go inside its steal fade never sounds");
  }
  // A key struck again strikes its own ring: eleven others keep theirs however
  // often. No echoes and a long ring, so that each of them still reads what
  // it did (an echo landing against a ring's phase can take 10 dB off it).
  {
    device.init(kRate);
    device.set_param(p::kCracks, 0.0f);
    device.set_param(p::kCrack, 0.0f);
    device.set_param(p::kShore, 0.0f);
    device.set_param(p::kThick, 0.8f);
    device.set_param(p::kBright, 0.0f);
    device.set_param(p::kRing, 30.0f);
    for (int n = 0; n < Ice::kMaxVoices; ++n) device.note_on(n, 220.0f * std::pow(2.0f, n / 12.0f), 0.8f);
    for (int strike = 0; strike < 40; ++strike) {
      device.note_on(0, 220.0f, 0.8f);
      render(device, 0.03f, kRate);
    }
    Stereo out = render(device, 0.4f, kRate);
    int alive = 0;
    for (int n = 1; n < Ice::kMaxVoices; ++n) {
      if (tone_level(out.left, 220.0 * std::pow(2.0, n / 12.0), kRate, at(0.1)) > 0.006) ++alive;
    }
    EXPECT(alive == Ice::kMaxVoices - 1, "a key struck forty times takes no voice from the others");
  }
  // More arrivals than there are slots: strikes land as pings, nothing breaks.
  for (float rate : {44100.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kDistance, 1.0f);
    device.set_param(p::kShore, 1.0f);
    device.set_param(p::kCracks, 1.0f);
    device.set_param(p::kRoam, 1.0f);
    device.set_param(p::kRing, 30.0f);
    device.set_param(p::kVolume, 6.0f);
    bool bounded = true;
    for (int n = 0; n < 80; ++n) {
      device.note_on(n % 20, 55.0f * std::pow(2.0f, static_cast<float>((n * 7) % 60) / 12.0f), 1.0f);
      Stereo out = render(device, 0.01f, rate);
      bounded = bounded && finite(out.left) && finite(out.right) && both_peak(out) <= 1.0;
    }
    // Far under the clip, so the new key is not flattened by the pile.
    device.set_param(p::kVolume, -40.0f);
    device.set_param(p::kDistance, 0.0f);
    render(device, 0.05f, rate);
    device.note_on(99, 3000.0f, 0.8f);
    Stereo out = render(device, 0.3f, rate);
    EXPECT(bounded && finite(out.left), "eighty far strikes with all their echoes stay finite and inside the clip");
    EXPECT(tone_level(out.left, 3000.0, rate, at(0.05, rate)) > 2.0e-4, "and a key after them still sounds");
    for (int n = 0; n < 100; ++n) device.note_off(n);
    device.set_param(p::kRing, 0.3f);
    render(device, 6.0f, rate);
    Stereo rest = render(device, 0.5f, rate);
    EXPECT(both_peak(rest) == 0.0, "and it all rings out to exact silence");
  }
}

// One passage: a key held while the lake cracks, a silence of `gap` seconds
// in which the knobs move, and a second key.
static Stereo passage(Ice& d, float gap, int block, bool move) {
  d.init(kRate);
  d.set_param(p::kRing, 0.3f);
  d.set_param(p::kCracks, 0.9f);
  d.set_param(p::kRoam, 1.0f);
  d.set_param(p::kShore, 0.5f);
  d.set_param(p::kDistance, 0.4f);
  d.note_on(1, 330.0f, 0.8f);
  d.note_on(2, 440.0f, 0.6f);
  Stereo out = render(d, 0.7f, kRate, block);
  d.note_off(1);
  d.note_off(2);
  out = concat(out, render(d, gap - 0.003f, kRate, block));
  if (move) {
    d.set_param(p::kVolume, -20.0f);
    d.set_param(p::kWidth, 0.2f);
    d.set_param(p::kStretch, 0.9f);
    d.set_param(p::kRing, 2.0f);
  }
  out = concat(out, render(d, 0.003f, kRate, block));
  d.note_on(3, 523.25f, 0.8f);
  return concat(out, render(d, 0.6f, kRate, block));
}

// The host's block size never shows, through a silence and a wake; a second
// init gives the same samples; and what moved while asleep has arrived.
static void test_blocks_and_sleep() {
  char label[200];
  // When does it fall silent after the release?
  Stereo probe = passage(device, 6.0f, 128, false);
  size_t last = at(0.7);
  for (size_t i = at(0.7); i < at(6.6); ++i) {
    if (probe.left[i] != 0.0f || probe.right[i] != 0.0f) last = i;
  }
  const float quiet = static_cast<float>(last) / kRate - 0.7f;
  std::printf("the passage is exactly silent %.3f s after the release; it sleeps 0.1 s later\n", quiet);
  EXPECT(quiet > 0.3f && quiet < 5.0f, "the passage rings out and falls exactly silent");

  // Silences stepped across the moment it falls asleep.
  double worst = 0.0;
  int renders = 0;
  for (float gap = quiet + 0.04f; gap < quiet + 0.24f; gap += 0.02f) {
    Stereo reference = passage(device, gap, 128, true);
    for (int block : {1, 2048}) {
      Stereo out = passage(device, gap, block, true);
      worst = std::max(worst, max_diff(reference, out));
      ++renders;
    }
  }
  {
    Stereo reference = passage(device, quiet + 1.5f, 128, true);
    worst = std::max(worst, max_diff(reference, passage(device, quiet + 1.5f, 2048, true)));
    // And with the second key before the first has rung out.
    Stereo early = passage(device, 0.25f, 128, true);
    worst = std::max(worst, max_diff(early, passage(device, 0.25f, 1, true)));
    worst = std::max(worst, max_diff(early, passage(device, 0.25f, 2048, true)));
  }
  std::snprintf(label, sizeof label, "blocks of 1, 128 and 2048 frames through a silence and a wake: largest difference %g (%d renders)",
                worst, renders + 3);
  std::printf("%s\n", label);
  EXPECT(worst == 0.0, label);

  // A second init: the same samples, lake and all.
  {
    Stereo first = passage(device, quiet + 0.5f, 128, true);
    Stereo second = passage(device, quiet + 0.5f, 128, true);
    EXPECT(first.left == second.left && first.right == second.right, "a second init gives the same audio bit for bit");
    Stereo fresh = passage(other, quiet + 0.5f, 128, true);
    EXPECT(first.left == fresh.left && first.right == fresh.right, "and so does another instance");
  }

  // Knobs moved while asleep have arrived when the next key wakes it: the
  // second key is the same as on a device that slept off the beat of its
  // control clock, sample for sample, as one whose knobs were there before
  // the silence began. (The first key cannot be compared: the knobs differ.)
  {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kCracks, 0.0f);
      device.set_param(p::kRing, 0.3f);
      device.set_param(p::kShore, 0.0f);
      device.note_on(1, 330.0f, 0.8f);
      render(device, 0.2f, kRate);
      device.note_off(1);
      device.process(13);  // off the beat
      if (pass == 0) {
        // Moved at once: it glides while the first note is still ringing.
        device.set_param(p::kVolume, -20.0f);
        device.set_param(p::kWidth, 0.1f);
      }
      render(device, 2.0f, kRate);
      Stereo silent = render(device, 0.2f, kRate);
      EXPECT(both_peak(silent) == 0.0, "asleep before the knobs move");
      if (pass == 1) {
        // Moved in its sleep.
        device.set_param(p::kVolume, -20.0f);
        device.set_param(p::kWidth, 0.1f);
        render(device, 0.01f, kRate);
      } else {
        render(device, 0.01f, kRate);
      }
      device.note_on(2, 440.0f, 0.8f);
      out[pass] = render(device, 0.3f, kRate);
    }
    const double apart = max_diff(out[0], out[1]);
    std::snprintf(label, sizeof label, "knobs moved in its sleep: the next key differs by %g from one that had them all along", apart);
    std::printf("%s\n", label);
    EXPECT(apart == 0.0 && both_peak(out[1]) > 0.005, label);
  }
}
