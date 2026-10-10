// Native harness for Shortwave (cpp/devices/shortwave). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest measures what makes it this instrument: a
// whistle that is found by tuning and then sits on the note, the two-tone and
// pulsed signals, the breath of Voices, fading that differs left and right, a
// second station that beats, static that lives and dies with the keys, and
// the receiver's band.
//
// Nobody has listened to this device. Every claim below is a measurement.

#include <functional>
#include <limits>

#include "../devices/shortwave/shortwave.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Shortwave;
namespace p = livemix::shortwave;

static Shortwave device;

static const float kRate = 48000.0f;

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// The bare signal: on the note at once, no wander, no fading, no static, the
// band open, quick envelope, level at unity.
static void plain(Shortwave& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kTuneIn, 0.0f);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kFading, 0.0f);
  d.set_param(p::kStatic, 0.0f);
  d.set_param(p::kBand, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kVolume, 0.0f);
}

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(std::min(a.size(), b.size()));
  for (size_t i = 0; i < out.size(); ++i) out[i] = a[i] - b[i];
  return out;
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = a.size() == b.size() ? 0.0 : 1.0e9;
  for (size_t i = 0; i < std::min(a.size(), b.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// The frequency of a tone from its rising zero crossings over [from, to),
// each placed between two samples: cycles counted over the time they took.
// It follows a pitch that moves, where a long transform would smear it.
static double crossing_hz(const std::vector<float>& x, size_t from, size_t to, double rate) {
  double first = 0.0, last = 0.0;
  int count = 0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double t = static_cast<double>(i - 1) + static_cast<double>(-x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
      if (count == 0) first = t;
      last = t;
      ++count;
    }
  }
  return count >= 2 ? static_cast<double>(count - 1) * rate / (last - first) : 0.0;
}

// RMS of consecutive windows of `window` samples from `from`, in dB.
static std::vector<double> level_track(const std::vector<float>& x, size_t from, size_t window, size_t to = SIZE_MAX) {
  std::vector<double> track;
  to = std::min(to, x.size());
  for (size_t start = from; start + window <= to; start += window) track.push_back(db(rms(x, start, start + window)));
  return track;
}

static double swing(const std::vector<double>& track) {
  if (track.empty()) return 0.0;
  const auto range = std::minmax_element(track.begin(), track.end());
  return *range.second - *range.first;
}

// How many times a track rises through `threshold`.
static int rises(const std::vector<double>& track, double threshold) {
  int count = 0;
  for (size_t i = 1; i < track.size(); ++i) count += (track[i - 1] < threshold && track[i] >= threshold) ? 1 : 0;
  return count;
}

// The largest third difference: a band-limited tone leaves almost nothing in
// it, a cut or a jump leaves about its own size.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

// The output of a two-pole band-pass at `hz` (unity at its centre), for
// reading one band of a noise over time.
static std::vector<float> band_of(const std::vector<float>& x, double hz, double q, double rate) {
  const double w = 2.0 * kPi * hz / rate;
  const double alpha = std::sin(w) / (2.0 * q);
  const double b0 = alpha / (1.0 + alpha), a1 = -2.0 * std::cos(w) / (1.0 + alpha), a2 = (1.0 - alpha) / (1.0 + alpha);
  std::vector<float> out(x.size());
  double x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    const double y = b0 * (x[i] - x2) - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = y;
    out[i] = static_cast<float>(y);
  }
  return out;
}

static Stereo render_ragged(Shortwave& d, float seconds) {
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  const size_t total = static_cast<size_t>(seconds * kRate);  // as testkit::render counts
  Stereo out;
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0;
  int which = 0;
  while (done < total) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), total - done));
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// How much of an event is heard in its first 8 samples: the largest
// difference from the same render without the event over those samples,
// against the largest over 20 ms. Something smoothed or faded has gone a
// small part of the way; a jump is there at once. The worst of eight moments
// a little apart, so a jump cannot hide in a zero crossing.
static double suddenness(const std::function<void(Shortwave&)>& setup, const std::function<void(Shortwave&)>& event,
                         float settle = 0.5f) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render(device, settle + 0.0137f * static_cast<float>(trial), kRate);
      if (pass == 0) event(device);
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

static void test_tuning();
static void test_signals();
static void test_voices();
static void test_fading();
static void test_beat();
static void test_static();
static void test_band();
static void test_playing();
static void test_clicks();
static void test_blocks();

int main() {
  Conformance spec;
  spec.name = "shortwave";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_tuning();
  test_signals();
  test_voices();
  test_fading();
  test_beat();
  test_static();
  test_band();
  test_playing();
  test_clicks();
  test_blocks();

  // Cost with eight notes held: the default patch, then the two dearest.
  for (int which = 0; which < 3; ++which) {
    device.init(kRate);
    if (which == 1) device.set_param(p::kSignal, Shortwave::kVoices);
    if (which == 2) {
      device.set_param(p::kSignal, Shortwave::kWarble);
      device.set_param(p::kBeat, 0.5f);
    }
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
    render(device, 1.0f, kRate);
    const char* label = which == 0 ? "shortwave (8 keys, default)" : which == 1 ? "shortwave (8 keys, Voices)" : "shortwave (8 keys, Warble with Beat)";
    report_cost(label, 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  }

  return finish("shortwave");
}

// --- the whistle is on the note; tune in and drift ---------------------------------------------

static void test_tuning() {
  // Tune in 0, Drift 0: on the note within 2 cents, bottom to top of the
  // keyboard, at three sample rates.
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (float hz : {27.5f, 55.0f, 110.0f, 261.63f, 880.0f, 1760.0f, 4186.0f}) {
        plain(device, rate);
        device.note_on(1, hz, 0.8f);
        Stereo out = render(device, 2.5f, rate);
        const double off = cents(crossing_hz(out.left, at(0.3, rate), at(2.5, rate), rate), hz);
        worst = std::max(worst, std::fabs(off));
      }
    }
    std::printf("  whistle, Tune in 0 and Drift 0: worst %.3f cents over 7 notes at 3 rates\n", worst);
    EXPECT(worst < 2.0, "the whistle is on the note within 2 cents");
  }

  // The same at once: with Tune in at 0 the first 50 ms are already there.
  {
    plain(device);
    device.note_on(1, 880.0f, 0.8f);
    Stereo out = render(device, 0.2f, kRate);
    const double early = cents(crossing_hz(out.left, 0, at(0.05), kRate), 880.0);
    EXPECT(std::fabs(early) < 2.0, "Tune in 0 is on the note at once");
  }

  // The default patch slides in and then holds the note within 5 cents.
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (float hz : {55.0f, 261.63f, 1760.0f}) {
        device.init(rate);
        device.set_param(p::kStatic, 0.0f);
        device.note_on(1, hz, 0.8f);
        Stereo out = render(device, 8.0f, rate);
        for (double from = 1.5; from < 7.5; from += 0.5) {
          const double off = cents(crossing_hz(out.left, at(from, rate), at(from + 0.5, rate), rate), hz);
          worst = std::max(worst, std::fabs(off));
        }
      }
    }
    std::printf("  default patch after its slide: worst %.2f cents in any half second\n", worst);
    EXPECT(worst < 5.0, "the default patch holds the note within 5 cents once it has arrived");
  }

  // The default slide is a colour at the start of a note, not a chord that
  // is out of tune: twelve notes one after another (they come from above and
  // from below, from nearer and further) all start most of a semitone off,
  // are within 10 cents a quarter of a second in and within 5 cents, drift
  // and all, from 0.3 s on.
  {
    device.init(kRate);
    device.set_param(p::kStatic, 0.0f);
    device.set_param(p::kRelease, 0.05f);
    double nearest_start = 1.0e9, furthest_start = 0.0, quarter = 0.0, later = 0.0;
    for (int n = 0; n < 12; ++n) {
      device.note_on(n, 880.0f, 0.8f);
      Stereo out = render(device, 1.5f, kRate);
      const double start = std::fabs(cents(crossing_hz(out.left, at(0.02), at(0.05), kRate), 880.0));
      nearest_start = std::min(nearest_start, start);
      furthest_start = std::max(furthest_start, start);
      for (double from = 0.25; from < 1.45; from += 0.025) {
        const double off = std::fabs(cents(crossing_hz(out.left, at(from), at(from + 0.025), kRate), 880.0));
        quarter = std::max(quarter, off);
        if (from >= 0.3) later = std::max(later, off);
      }
      device.note_off(n);
      render(device, 0.4f, kRate);
    }
    std::printf("  default Tune in, twelve notes: %.0f to %.0f cents off at 20 to 50 ms, at most %.1f cents from 0.25 s, %.1f from 0.3 s\n",
                nearest_start, furthest_start, quarter, later);
    EXPECT(nearest_start > 50.0 && furthest_start < 130.0, "at the defaults every note starts most of a semitone off");
    EXPECT(quarter < 10.0, "and is within 10 cents a quarter of a second in");
    EXPECT(later < 5.0, "and within 5 cents from 0.3 s on");
  }

  // Tune in: the note starts off pitch, takes the time said, and arrives.
  for (float amount : {0.5f, 1.0f}) {
    plain(device);
    device.set_param(p::kTuneIn, amount);
    device.note_on(1, 880.0f, 0.8f);
    const double arrives = Shortwave::slide_seconds(amount);
    Stereo out = render(device, static_cast<float>(arrives) + 1.0f, kRate);
    const double start = cents(crossing_hz(out.left, 0, at(0.1), kRate), 880.0);
    const double half = cents(crossing_hz(out.left, at(0.5 * arrives - 0.025), at(0.5 * arrives + 0.025), kRate), 880.0);
    const double there = cents(crossing_hz(out.left, at(arrives + 0.02), at(arrives + 0.5), kRate), 880.0);
    std::printf("  Tune in %.1f: %+.0f cents in the first 100 ms, %+.1f half way (%.2f s), %+.3f after %.2f s\n", amount,
                start, half, 0.5 * arrives, there, arrives);
    EXPECT(std::fabs(start) >= 100.0, "with Tune in up the first 100 ms are 100 cents or more off");
    EXPECT(std::fabs(start) <= Shortwave::kTuneCents * amount + 5.0, "and no further off than the knob says");
    // Half way through the time the slide has an eighth of its way to go.
    EXPECT(std::fabs(half) > 0.06 * Shortwave::kTuneCents * amount, "the slide is still under way at half its time");
    EXPECT(start * half > 0.0, "and comes in from one side");
    EXPECT(std::fabs(there) < 2.0, "it has arrived by the time said");
  }

  // The direction is drawn from a seeded generator: both occur, and a second
  // init draws the same.
  {
    int up = 0, down = 0;
    std::vector<int> first, second;
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kTuneIn, 0.5f);
      for (int n = 0; n < 12; ++n) {
        device.note_on(n, 880.0f, 0.8f);
        Stereo out = render(device, 0.1f, kRate);
        const double start = cents(crossing_hz(out.left, 0, at(0.08), kRate), 880.0);
        (pass == 0 ? first : second).push_back(start > 0.0 ? 1 : -1);
        if (pass == 0) (start > 0.0 ? up : down) += 1;
        device.note_off(n);
        render(device, 0.5f, kRate);
      }
    }
    std::printf("  twelve notes slide in: %d from above, %d from below\n", up, down);
    EXPECT(up >= 2 && down >= 2, "notes slide in from above and from below");
    EXPECT(first == second, "and the same way after a second init");
  }

  // Drift: a slow wander whose reach is the knob, different for every key.
  {
    double reach[3] = {0.0, 0.0, 0.0};
    const float amounts[3] = {0.0f, 0.15f, 1.0f};
    for (int which = 0; which < 3; ++which) {
      plain(device);
      device.set_param(p::kDrift, amounts[which]);
      device.note_on(1, 880.0f, 0.8f);
      Stereo out = render(device, 40.0f, kRate);
      for (double from = 0.25; from < 39.5; from += 0.25) {
        const double off = cents(crossing_hz(out.left, at(from), at(from + 0.25), kRate), 880.0);
        reach[which] = std::max(reach[which], std::fabs(off));
      }
    }
    std::printf("  Drift 0 / 0.15 / 1: furthest %.3f / %.2f / %.1f cents from the note in 40 s\n", reach[0], reach[1],
                reach[2]);
    EXPECT(reach[0] < 0.5, "Drift 0 does not move");
    EXPECT(reach[1] > 0.8 && reach[1] < 5.0, "the default Drift is a few cents");
    EXPECT(reach[2] > 20.0 && reach[2] <= Shortwave::kDriftCents + 1.0, "Drift 1 reaches towards a quarter tone and no further");

    // Two keys on one pitch wander apart: the pair beats.
    plain(device);
    device.set_param(p::kDrift, 1.0f);
    device.note_on(1, 880.0f, 0.8f);
    device.note_on(2, 880.0f, 0.8f);
    Stereo pair = render(device, 10.0f, kRate);
    plain(device);
    device.note_on(1, 880.0f, 0.8f);
    device.note_on(2, 880.0f, 0.8f);
    Stereo still = render(device, 10.0f, kRate);
    const double moving = swing(level_track(pair.left, at(0.5), at(0.05)));
    const double steady = swing(level_track(still.left, at(0.5), at(0.05)));
    std::printf("  two keys on one pitch: level swings %.1f dB with Drift 1, %.2f dB with Drift 0\n", moving, steady);
    EXPECT(moving > 6.0 && steady < 0.1, "every key has a drift of its own");
  }
}
// --- Warble and Pips --------------------------------------------------------------------------

// Which of two tones is sounding in each 10 ms of `x`: +1 for `a`, -1 for
// `b`, 0 when neither clearly is (an edge).
static std::vector<int> which_tone(const std::vector<float>& x, double a, double b, double rate, size_t from, size_t to) {
  std::vector<int> out;
  const size_t window = at(0.01, rate);
  for (size_t start = from; start + window <= to; start += window) {
    const double la = tone_level(x, a, rate, start, start + window);
    const double lb = tone_level(x, b, rate, start, start + window);
    out.push_back(la > 3.0 * lb ? 1 : (lb > 3.0 * la ? -1 : 0));
  }
  return out;
}

static int changes(const std::vector<int>& which) {
  int count = 0, last = 0;
  for (int w : which) {
    if (w == 0) continue;
    if (last != 0 && w != last) ++count;
    last = w;
  }
  return count;
}

static void test_signals() {
  // Whistle is one sine and Rate does nothing to it.
  {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kRate, pass == 0 ? 0.25f : 12.0f);
      device.note_on(1, 440.0f, 0.8f);
      out[pass] = render(device, 1.0f, kRate);
    }
    const double second = tone_level(out[0].left, 880.0, kRate, at(0.3)) / tone_level(out[0].left, 440.0, kRate, at(0.3));
    std::printf("  whistle: second harmonic %.1f dB under the note\n", -db(second));
    EXPECT(second < 1.0e-3, "a whistle is a pure tone");
    EXPECT(out[0].left == out[1].left && out[0].right == out[1].right, "Rate does nothing on Whistle");
  }

  // Warble changes tone Rate times a second, between the note and its octave.
  {
    plain(device);
    device.set_param(p::kSignal, Shortwave::kWarble);
    device.set_param(p::kRate, 3.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 10.2f, kRate);
    const int count = changes(which_tone(out.left, 440.0, 880.0, kRate, at(0.1), at(10.1)));
    // The first tone is the note; the second count of the clock is the octave.
    const double note_first = tone_level(out.left, 440.0, kRate, at(0.1), at(0.25));
    const double octave_first = tone_level(out.left, 880.0, kRate, at(0.1), at(0.25));
    const double note_second = tone_level(out.left, 440.0, kRate, at(0.4), at(0.6));
    const double octave_second = tone_level(out.left, 880.0, kRate, at(0.4), at(0.6));
    std::printf("  warble at Rate 3: %d changes of tone in 10 s; other tone %.0f dB and %.0f dB down mid tone\n", count,
                -db(octave_first / note_first), -db(note_second / octave_second));
    EXPECT(count == 30, "Warble changes tone Rate times a second");
    EXPECT(octave_first < 0.01 * note_first, "it starts on the note alone");
    EXPECT(note_second < 0.01 * octave_second, "then sounds the octave alone");
    EXPECT_NEAR(db(octave_second / note_first), 0.0, 0.5, "the two tones are equally loud");

    // The change is a crossfade: no more of a corner in it than the higher
    // tone has by itself.
    plain(device);
    device.note_on(1, 880.0f, 0.8f);
    Stereo steady = render(device, 1.0f, kRate);
    const double edges = kink(out.left, at(0.1));
    const double own = kink(steady.left, at(0.1));
    std::printf("  warble edges: third difference %.6f against %.6f for the upper tone held\n", edges, own);
    EXPECT(edges < 1.5 * own, "Warble changes tone without a click");
  }

  // The same count at the other sample rates and at the ends of Rate.
  for (float rate : {44100.0f, 96000.0f}) {
    for (float speed : {0.25f, 12.0f}) {
      plain(device, rate);
      device.set_param(p::kSignal, Shortwave::kWarble);
      device.set_param(p::kRate, speed);
      device.note_on(1, 440.0f, 0.8f);
      const float seconds = speed < 1.0f ? 20.0f : 5.0f;
      Stereo out = render(device, seconds + 0.02f, rate);
      const int count = changes(which_tone(out.left, 440.0, 880.0, rate, 0, at(seconds + 0.02, rate)));
      char label[160];
      std::snprintf(label, sizeof label, "Warble at Rate %.2f changes tone %d times in %.0f s at %.0f Hz (%d)", speed,
                    static_cast<int>(speed * seconds), seconds, rate, count);
      EXPECT(count == static_cast<int>(speed * seconds), label);
    }
  }

  // Shift picks the other tone: an octave below, an octave above, two above.
  {
    const double ratios[3] = {0.5, 2.0, 4.0};
    for (int shift = 0; shift < 3; ++shift) {
      plain(device);
      device.set_param(p::kSignal, Shortwave::kWarble);
      device.set_param(p::kRate, 2.0f);
      device.set_param(p::kShift, static_cast<float>(shift));
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 1.0f, kRate);
      const double hz = crossing_hz(out.left, at(0.6), at(0.9), kRate);
      char label[160];
      std::snprintf(label, sizeof label, "Shift %d: the second tone is %.2f Hz (%.2f cents from %.0f Hz)", shift, hz,
                    cents(hz, 440.0 * ratios[shift]), 440.0 * ratios[shift]);
      EXPECT(std::fabs(cents(hz, 440.0 * ratios[shift])) < 2.0, label);
    }
    // At the top of the keyboard two octaves up would pass Nyquist at 44.1 kHz:
    // the second tone is then one octave up, and nothing folds.
    plain(device, 44100.0f);
    device.set_param(p::kSignal, Shortwave::kWarble);
    device.set_param(p::kRate, 2.0f);
    device.set_param(p::kShift, 2.0f);
    device.note_on(1, 4186.0f, 0.8f);
    Stereo top = render(device, 1.0f, 44100.0f);
    const double hz = crossing_hz(top.left, at(0.6, 44100.0), at(0.9, 44100.0), 44100.0);
    EXPECT(std::fabs(cents(hz, 8372.0)) < 2.0, "a Shift that will not fit under Nyquist drops an octave");
    // The same for a note that began under Voices and is switched to Warble
    // while its second tone is due.
    plain(device, 44100.0f);
    device.set_param(p::kSignal, Shortwave::kVoices);
    device.set_param(p::kRate, 2.0f);
    device.set_param(p::kShift, 2.0f);
    device.note_on(1, 4186.0f, 0.8f);
    render(device, 0.55f, 44100.0f);
    device.set_param(p::kSignal, Shortwave::kWarble);
    Stereo switched = render(device, 0.4f, 44100.0f);
    const double after = crossing_hz(switched.left, at(0.05, 44100.0), at(0.35, 44100.0), 44100.0);
    EXPECT(std::fabs(cents(after, 8372.0)) < 2.0, "also when the note began under another Signal");
  }

  // Pips: Rate pulses a second with silence between them.
  {
    plain(device);
    device.set_param(p::kSignal, Shortwave::kPips);
    device.set_param(p::kRate, 4.0f);
    device.note_on(1, 660.0f, 0.8f);
    Stereo out = render(device, 5.0f, kRate);
    // The peak of every 2 ms (more than a cycle of the tone).
    std::vector<double> envelope;
    for (size_t start = 0; start + 96 <= out.size(); start += 96) envelope.push_back(peak(out.left, start, start + 96));
    const double top = *std::max_element(envelope.begin(), envelope.end());
    const int pulses = rises(envelope, 0.5 * top);
    int open = 0;
    for (double v : envelope) open += v >= 0.5 * top ? 1 : 0;
    const double share = static_cast<double>(open) / static_cast<double>(envelope.size());
    // The quietest 2 ms of every gap: 150 to 240 ms into each quarter second.
    double gap = 0.0;
    for (int n = 0; n < 20; ++n) gap = std::max(gap, peak(out.left, at(0.25 * n + 0.15), at(0.25 * n + 0.24)));
    std::printf("  pips at Rate 4: %d in 5 s, open %.1f %% of the time, gaps %.0f dB under the pips\n", pulses,
                100.0 * share, -db(gap / top));
    EXPECT(pulses == 20, "Pips pulse Rate times a second");
    EXPECT(gap < 1.0e-4 * top, "with silence between them");
    EXPECT_NEAR(share, Shortwave::kPipDuty - 0.048, 0.03, "a pip fills under half its cycle");
    EXPECT(std::fabs(cents(crossing_hz(out.left, at(0.02), at(0.1), kRate), 660.0)) < 2.0, "a pip is on the note");

    plain(device);
    device.note_on(1, 660.0f, 0.8f);
    Stereo steady = render(device, 1.0f, kRate);
    const double edges = kink(out.left, at(0.1));
    const double own = kink(steady.left, at(0.1));
    std::printf("  pip edges: third difference %.6f against %.6f for the tone held\n", edges, own);
    EXPECT(edges < 1.5 * own, "Pips open and shut without a click");
    EXPECT_NEAR(db(top / peak(steady.left, at(0.1))), 0.0, 0.5, "a pip is as loud as the whistle");
  }

  // Slow pips are short: 0.3 s at most, however long the gap.
  {
    plain(device);
    device.set_param(p::kSignal, Shortwave::kPips);
    device.set_param(p::kRate, 0.5f);
    device.note_on(1, 660.0f, 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    std::vector<double> envelope;
    for (size_t start = 0; start + 96 <= out.size(); start += 96) envelope.push_back(peak(out.left, start, start + 96));
    const double top = *std::max_element(envelope.begin(), envelope.end());
    int open = 0;
    for (double v : envelope) open += v >= 0.5 * top ? 1 : 0;
    const double each = 0.002 * open / 3.0;
    std::printf("  pips at Rate 0.5: %d in 6 s, each %.3f s long\n", rises(envelope, 0.5 * top), each);
    EXPECT(rises(envelope, 0.5 * top) == 3, "slow Pips keep to Rate");
    EXPECT_NEAR(each, Shortwave::kPipSeconds - 0.012, 0.01, "and stay short");
  }
  for (float rate : {44100.0f, 96000.0f}) {
    plain(device, rate);
    device.set_param(p::kSignal, Shortwave::kPips);
    device.set_param(p::kRate, 12.0f);
    device.note_on(1, 660.0f, 0.8f);
    Stereo out = render(device, 5.0f, rate);
    const size_t window = at(0.002, rate);
    std::vector<double> envelope;
    for (size_t start = 0; start + window <= out.size(); start += window) envelope.push_back(peak(out.left, start, start + window));
    const double top = *std::max_element(envelope.begin(), envelope.end());
    char label[160];
    std::snprintf(label, sizeof label, "Pips at Rate 12 pulse 60 times in 5 s at %.0f Hz (%d)", rate, rises(envelope, 0.5 * top));
    EXPECT(rises(envelope, 0.5 * top) == 60, label);
  }
}

// --- Voices -----------------------------------------------------------------------------------

// The band `hz` ± `half` read at steps of 0.75 Hz: how flat its power is
// (geometric over arithmetic mean: near 0 for a tone, 0.56 for one stretch of
// even noise) and where its weight sits.
static void band_shape(const std::vector<float>& x, double hz, double half, size_t from, size_t to, double* flatness,
                       double* centroid) {
  const int reach = static_cast<int>(half / 0.75);
  double log_sum = 0.0, sum = 0.0, weighted = 0.0;
  for (int k = -reach; k <= reach; ++k) {
    const double f = hz + 0.75 * k;
    const double level = tone_level(x, f, kRate, from, to);
    const double power = level * level + 1.0e-30;
    log_sum += std::log(power);
    sum += power;
    weighted += f * power;
  }
  const double count = 2.0 * reach + 1.0;
  *flatness = std::exp(log_sum / count) / (sum / count);
  *centroid = weighted / sum;
}

// The power in `hz` ± `half` over [from, to), from tones read 1 Hz apart.
static double band_power(const std::vector<float>& x, double hz, double half, size_t from, size_t to) {
  double sum = 0.0;
  for (double f = hz - half; f <= hz + half + 1.0e-9; f += 1.0) {
    const double level = tone_level(x, f, kRate, from, to);
    sum += level * level;
  }
  return sum;
}

static Stereo voices_note(float hz, float rate, float seconds, float beat = 0.0f) {
  plain(device);
  device.set_param(p::kSignal, Shortwave::kVoices);
  device.set_param(p::kRate, rate);
  device.set_param(p::kBeat, beat);
  device.note_on(1, hz, 0.8f);
  return render(device, seconds, kRate);
}

static void test_voices() {
  // Noise, not a tone, in a band on the note: flat where a whistle is one line.
  for (float hz : {110.0f, 440.0f, 1760.0f}) {
    Stereo breath = voices_note(hz, 2.0f, 9.5f);
    plain(device);
    device.note_on(1, hz, 0.8f);
    Stereo whistle = render(device, 5.5f, kRate);
    const double half = std::min(0.03 * hz, 12.0);
    double flat_a, flat_b, centre_a, centre_b, flat_whistle, centre_whistle;
    band_shape(breath.left, hz, half, at(1.0), at(5.0), &flat_a, &centre_a);
    band_shape(breath.left, hz, half, at(5.0), at(9.0), &flat_b, &centre_b);
    band_shape(whistle.left, hz, half, at(1.0), at(5.0), &flat_whistle, &centre_whistle);
    std::printf("  voices at %.0f Hz: flatness %.2f and %.2f (whistle %.5f), band centred %+.1f and %+.1f cents off\n", hz,
                flat_a, flat_b, flat_whistle, cents(centre_a, hz), cents(centre_b, hz));
    EXPECT(flat_a > 0.25 && flat_b > 0.25, "Voices is noise around the note");
    EXPECT(flat_whistle < 0.01, "where a whistle is one line");
    // The band is 4 % of the note wide either way (70 cents).
    EXPECT(std::fabs(cents(centre_a, hz)) < 25.0 && std::fabs(cents(centre_b, hz)) < 25.0, "and the band sits on the note");
  }

  // The breath is on the note's harmonics and not between them.
  {
    Stereo breath = voices_note(440.0f, 2.0f, 21.0f);
    const double first = band_power(breath.left, 440.0, 20.0, at(1.0), at(21.0));
    const double second = band_power(breath.left, 880.0, 20.0, at(1.0), at(21.0));
    const double third = band_power(breath.left, 1320.0, 20.0, at(1.0), at(21.0));
    const double between = band_power(breath.left, 660.0, 20.0, at(1.0), at(21.0));
    std::printf("  voices at 440 Hz: second harmonic %+.1f dB, third %+.1f dB, between the first two %+.1f dB\n",
                0.5 * db(second / first), 0.5 * db(third / first), 0.5 * db(between / first));
    EXPECT(second > 0.1 * first && third > 0.03 * first, "Voices carries the note's harmonics");
    EXPECT(between < 1.0e-3 * first, "with nothing between them");
  }

  // It murmurs: the level rises and falls a syllable at a time, and Rate is
  // how many a second. Read on a high note, where the breath itself flutters
  // too fast to be taken for a syllable: every time the level comes up
  // through 7.5 dB under its loudest, a syllable has begun.
  {
    const float rates[3] = {1.0f, 3.0f, 6.0f};
    int syllables[3];
    double depth[3];
    for (int which = 0; which < 3; ++which) {
      Stereo out = voices_note(1760.0f, rates[which], 20.5f);
      const std::vector<double> track = level_track(out.left, at(0.5), at(0.03));
      std::vector<double> sorted = track;
      std::sort(sorted.begin(), sorted.end());
      const double loudest = sorted[sorted.size() - 1 - sorted.size() / 50];
      syllables[which] = rises(track, loudest - 7.5);
      depth[which] = loudest - sorted[sorted.size() / 20];
    }
    std::printf("  voices in 20 s: %d syllables at Rate 1, %d at Rate 3, %d at Rate 6; the level falls %.1f, %.1f and %.1f dB between them\n",
                syllables[0], syllables[1], syllables[2], depth[0], depth[1], depth[2]);
    EXPECT(syllables[0] >= 12 && syllables[0] <= 26, "Voices murmurs about one syllable a second at Rate 1");
    EXPECT(syllables[1] >= 40 && syllables[1] <= 72, "about three a second at Rate 3");
    EXPECT(syllables[2] >= 80 && syllables[2] <= 140, "and about six a second at Rate 6");
    EXPECT(depth[0] > 8.0 && depth[1] > 8.0 && depth[2] > 6.0, "the level falls 8 dB or more between syllables");
  }

  // The mouth changes shape from one syllable to the next. The noise of two
  // renders is the same whatever Rate is, and at Rate 0.25 the mouth keeps
  // its first shape for two seconds, so the balance of the first two
  // harmonics at Rate 4 against Rate 0.25 over those seconds is the formants
  // of the faster mouth alone.
  {
    auto balance = [](float rate) {
      Stereo out = voices_note(440.0f, rate, 2.0f);
      const std::vector<double> one = level_track(band_of(out.left, 440.0, 6.0, kRate), at(0.1), at(0.05));
      const std::vector<double> two = level_track(band_of(out.left, 880.0, 12.0, kRate), at(0.1), at(0.05));
      std::vector<double> track;
      for (size_t i = 0; i < one.size(); ++i) track.push_back(two[i] - one[i]);
      return track;
    };
    const std::vector<double> still = balance(0.25f), slow = balance(0.5f), fast = balance(4.0f);
    std::vector<double> moved, barely;
    for (size_t i = 0; i < still.size(); ++i) {
      moved.push_back(fast[i] - still[i]);
      if (i < still.size() / 2) barely.push_back(slow[i] - still[i]);
    }
    std::printf("  voices, second harmonic against the first, the mouth alone: swings %.1f dB in 2 s at Rate 4, %.2f dB in 1 s at Rate 0.5\n",
                swing(moved), swing(barely));
    EXPECT(swing(moved) > 6.0, "the formants of Voices move from syllable to syllable");
    EXPECT(swing(barely) < 0.5, "and stay while a syllable lasts");
  }

  // As heard: the balance of the first two harmonics wanders over seconds.
  {
    Stereo out = voices_note(440.0f, 2.0f, 41.0f);
    const std::vector<double> one = level_track(band_of(out.left, 440.0, 6.0, kRate), at(1.0), at(1.0));
    const std::vector<double> two = level_track(band_of(out.left, 880.0, 12.0, kRate), at(1.0), at(1.0));
    std::vector<double> balance;
    for (size_t i = 0; i < one.size(); ++i) balance.push_back(two[i] - one[i]);
    std::printf("  voices: second harmonic against the first swings %.1f dB over 40 s\n", swing(balance));
    EXPECT(swing(balance) > 6.0, "the colour of Voices changes over seconds");
  }

  // Beat under Voices is a plain whistle a few hertz up: what it adds is one line.
  {
    Stereo with = voices_note(440.0f, 2.0f, 4.0f, 0.5f);
    Stereo without = voices_note(440.0f, 2.0f, 4.0f, 0.0f);
    const std::vector<float> added = minus(with.left, without.left);
    const double hz = crossing_hz(added, at(0.5), at(4.0), kRate);
    const double pure = rms(added, at(0.5)) * std::sqrt(2.0) / peak(added, at(0.5));
    plain(device);
    device.note_on(1, 440.0f, 0.8f);
    Stereo whistle = render(device, 1.0f, kRate);
    const double under = peak(added, at(0.5)) / peak(whistle.left, at(0.5));
    std::printf("  voices with Beat 0.5: adds a tone at %.3f Hz, %.1f dB under a whistle\n", hz, -db(under));
    EXPECT_NEAR(under, Shortwave::kBeatLevel, 0.01, "at the second station's level");
    EXPECT_NEAR(hz, 440.0 + Shortwave::beat_hz(0.5f), 0.01, "Beat under Voices is a whistle a few hertz above the note");
    EXPECT(pure > 0.99, "and a pure one");
  }
}

// --- fading -----------------------------------------------------------------------------------

static Stereo fading_note(float fading, float hz, float seconds) {
  plain(device);
  device.set_param(p::kFading, fading);
  device.note_on(1, hz, 0.8f);
  return render(device, seconds, kRate);
}

// The static alone: the same render with Static up and at 0, one from the
// other. Nothing else in the device reads Static and the sum stays under the
// clip's knee, so the difference is the static as it leaves the receiver.
static Stereo static_alone(const std::function<void(Shortwave&)>& patch, float amount, float hz, float gain, float held,
                           float tail, float rate = kRate) {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(device, rate);
    patch(device);
    device.set_param(p::kStatic, pass == 0 ? amount : 0.0f);
    device.note_on(1, hz, gain);
    out[pass] = render(device, held, rate);
    if (tail > 0.0f) {
      device.note_off(1);
      out[pass] = concat(out[pass], render(device, tail, rate));
    }
  }
  Stereo only;
  only.left = minus(out[0].left, out[1].left);
  only.right = minus(out[0].right, out[1].right);
  return only;
}

static void test_fading() {
  // Fading 0: the level stands still and the two sides are one.
  double steady_level = 0.0;
  {
    Stereo out = fading_note(0.0f, 440.0f, 30.0f);
    const double moved = swing(level_track(out.left, at(0.5), at(0.1)));
    steady_level = db(rms(out.left, at(0.5)));
    std::printf("  Fading 0: level moves %.3f dB in 30 s\n", moved);
    EXPECT(moved < 1.0, "Fading 0 holds the level within 1 dB");
    EXPECT(out.left == out.right, "and left and right are the same");
  }

  // Fading 1: the station sinks and returns, and the sides part.
  {
    Stereo out = fading_note(1.0f, 440.0f, 60.0f);
    const std::vector<double> left = level_track(out.left, at(0.5), at(0.1));
    const std::vector<double> right = level_track(out.right, at(0.5), at(0.1));
    const std::vector<double> centre = level_track(mid(out), at(0.5), at(0.1));
    double left_leads = 0.0, right_leads = 0.0;
    for (size_t i = 0; i < left.size(); ++i) {
      left_leads = std::max(left_leads, left[i] - right[i]);
      right_leads = std::max(right_leads, right[i] - left[i]);
    }
    std::printf("  Fading 1: level swings %.1f dB in 60 s; left leads by up to %.1f dB, right by up to %.1f dB\n",
                swing(centre), left_leads, right_leads);
    EXPECT(swing(centre) >= 10.0, "Fading 1 swings the level 10 dB or more");
    EXPECT(swing(centre) <= Shortwave::kFadeDb + 17.0, "and no deeper than the fade and a notch on both sides");
    EXPECT(left_leads > 3.0 && right_leads > 3.0, "left and right differ under Fading, each leading in turn");
    // The station as a whole sinks and returns, not only one side at a
    // time: the louder side too goes far under the level without Fading, and
    // comes back over it (a notch alone can only take away).
    double sunk = 0.0, risen = -1.0e9;
    for (size_t i = 0; i < left.size(); ++i) {
      const double louder = std::max(left[i], right[i]) - steady_level;
      sunk = std::min(sunk, louder);
      risen = std::max(risen, louder);
    }
    std::printf("  Fading 1: the louder side goes from %.1f dB under the steady level to %.1f dB over it\n", -sunk, risen);
    EXPECT(sunk < -8.0, "the whole station sinks, as well as each side hollowing");
    EXPECT(risen > 1.0 && risen < Shortwave::kFadeLift + 0.5, "and returns a little over its level without Fading, by no more than the lift");
    // A station comes in at the level it has without Fading.
    const double start = db(rms(out.left, at(0.05), at(0.3)));
    std::printf("  Fading 1: the first 0.3 s are %.2f dB from the steady level\n", start - steady_level);
    EXPECT_NEAR(start, steady_level, 1.0, "a note starts at its level without Fading");
    // The fade is slow: no more than a few dB in any tenth of a second.
    double fastest = 0.0;
    for (size_t i = 1; i < centre.size(); ++i) fastest = std::max(fastest, std::fabs(centre[i] - centre[i - 1]));
    std::printf("  Fading 1: fastest change %.2f dB in 0.1 s\n", fastest);
    EXPECT(fastest < 6.0, "the level changes over seconds, not as a tremolo");
  }

  // No note leans to one side from the start: each station's notches begin
  // far from it, and the notch that sweeps the static (which stands at the
  // same place whenever a first key is pressed) is not over the stations.
  {
    double worst = 0.0;
    float worst_hz = 0.0f;
    for (int n = 0; n <= 24; ++n) {
      const float hz = 55.0f * std::pow(2.0f, static_cast<float>(n) / 4.0f);
      Stereo out = fading_note(1.0f, hz, 0.6f);
      const double lean = std::fabs(db(rms(out.left, at(0.1)) / rms(out.right, at(0.1))));
      if (lean > worst) {
        worst = lean;
        worst_hz = hz;
      }
    }
    std::printf("  Fading 1, the first half second of 25 notes from 55 Hz to 3.5 kHz: left and right within %.2f dB (at %.0f Hz)\n",
                worst, worst_hz);
    EXPECT(worst < 1.5, "no note starts on one side under Fading");
  }

  // Each station has a notch of its own on each side: left and right part
  // on a low note as well as a high one.
  {
    Stereo out = fading_note(1.0f, 82.4f, 60.0f);
    const std::vector<double> left = level_track(out.left, at(0.5), at(0.5));
    const std::vector<double> right = level_track(out.right, at(0.5), at(0.5));
    double left_leads = 0.0, right_leads = 0.0;
    for (size_t i = 0; i < left.size(); ++i) {
      left_leads = std::max(left_leads, left[i] - right[i]);
      right_leads = std::max(right_leads, right[i] - left[i]);
    }
    std::printf("  Fading 1 on a low note: left leads by up to %.1f dB, right by up to %.1f dB\n", left_leads, right_leads);
    EXPECT(left_leads > 4.0 && right_leads > 4.0, "every station has its own notch on each side");
  }

  // The knob is the depth.
  {
    Stereo out = fading_note(p::kParamDefault[p::kFading], 440.0f, 60.0f);
    const double moved = swing(level_track(mid(out), at(0.5), at(0.1)));
    // What a five second note at the default gets of it: the level moves a
    // few dB and the sides part a little, so the idea is heard in a phrase.
    const std::vector<double> left = level_track(out.left, at(0.5), at(0.25), at(5.5));
    const std::vector<double> right = level_track(out.right, at(0.5), at(0.25), at(5.5));
    double parted = 0.0;
    for (size_t i = 0; i < left.size(); ++i) parted = std::max(parted, std::fabs(left[i] - right[i]));
    const double phrase = swing(level_track(mid(out), at(0.5), at(0.25), at(5.5)));
    std::printf("  Fading %.1f (the default): level swings %.1f dB in 60 s; in the first 5 s it moves %.1f dB and the sides part by up to %.1f dB\n",
                p::kParamDefault[p::kFading], moved, phrase, parted);
    EXPECT(moved > 2.0 && moved < 14.0, "the default Fading is a gentle swell");
    EXPECT(phrase > 2.0 && phrase < 9.0 && parted > 1.0 && parted < 9.0, "that is heard within a five second note");
  }

  // Fading does not take the level away: eight stations held a minute at
  // Fading 1 are, taken together, within 4.5 dB of the same eight without
  // it, and their loudest 400 ms within 3 dB. (Without the lift the minute
  // sits 7 dB under.)
  {
    double whole[2], loudest[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kFading, pass == 0 ? 0.0f : 1.0f);
      for (int n = 0; n < 8; ++n) device.note_on(n + 1, 98.0f * std::pow(1.5f, static_cast<float>(n) * 0.75f), 0.8f);
      Stereo out = render(device, 60.5f, kRate);
      const double l = rms(out.left, at(0.5)), r = rms(out.right, at(0.5));
      whole[pass] = db(std::sqrt(0.5 * (l * l + r * r)));
      const std::vector<double> left = level_track(out.left, at(0.5), at(0.4)), right = level_track(out.right, at(0.5), at(0.4));
      loudest[pass] = -1.0e9;
      for (size_t i = 0; i < left.size(); ++i) loudest[pass] = std::max(loudest[pass], std::max(left[i], right[i]));
    }
    std::printf("  eight stations a minute under Fading 1: %+.1f dB against the same without it, the loudest 400 ms %+.1f dB\n",
                whole[1] - whole[0], loudest[1] - loudest[0]);
    EXPECT(whole[1] - whole[0] > -4.5 && whole[1] - whole[0] < 0.5, "Fading keeps a chord near its level without it");
    EXPECT(std::fabs(loudest[1] - loudest[0]) < 3.0, "and its loudest moments where they were");
  }

  // Every station fades by itself: two keys far apart do not move together.
  {
    plain(device);
    device.set_param(p::kFading, 1.0f);
    device.note_on(1, 330.0f, 0.8f);
    device.note_on(2, 1245.0f, 0.8f);
    Stereo out = render(device, 40.0f, kRate);
    const std::vector<float> centre = mid(out);
    const std::vector<double> low = level_track(band_of(centre, 330.0, 8.0, kRate), at(0.5), at(0.2));
    const std::vector<double> high = level_track(band_of(centre, 1245.0, 8.0, kRate), at(0.5), at(0.2));
    std::vector<float> a(low.begin(), low.end()), b(high.begin(), high.end());
    const double ma = mean(a), mb = mean(b);
    for (float& v : a) v -= static_cast<float>(ma);
    for (float& v : b) v -= static_cast<float>(mb);
    const double together = correlation(a, b);
    std::printf("  two stations under Fading 1: their levels correlate %.2f\n", together);
    EXPECT(swing(low) > 8.0 && swing(high) > 8.0 && std::fabs(together) < 0.7, "every station fades by itself");
  }

  // Each station's notches are its own. Eight keys a fifth apart: how far the
  // left stands over the right in one of them, followed over the first
  // seconds, says nothing about the others. (With one path for all of them
  // the eight lean together and the mean below is about 0.5.)
  {
    plain(device);
    device.set_param(p::kFading, 1.0f);
    const int stations = 8;
    double hz[stations];
    for (int n = 0; n < stations; ++n) {
      hz[n] = 110.0 * std::pow(1.5, n);
      device.note_on(n + 1, static_cast<float>(hz[n]), 0.8f);
    }
    Stereo out = render(device, 15.0f, kRate);
    std::vector<std::vector<float>> lean(stations);
    for (int n = 0; n < stations; ++n) {
      const std::vector<double> left = level_track(band_of(out.left, hz[n], 8.0, kRate), at(0.5), at(0.2));
      const std::vector<double> right = level_track(band_of(out.right, hz[n], 8.0, kRate), at(0.5), at(0.2));
      double sum = 0.0;
      for (size_t i = 0; i < left.size(); ++i) {
        lean[n].push_back(static_cast<float>(left[i] - right[i]));
        sum += lean[n].back();
      }
      for (float& v : lean[n]) v -= static_cast<float>(sum / static_cast<double>(lean[n].size()));
    }
    double together = 0.0;
    int pairs = 0;
    for (int a = 0; a < stations; ++a) {
      for (int b = a + 1; b < stations; ++b, ++pairs) together += correlation(lean[a], lean[b]);
    }
    together /= pairs;
    std::printf("  eight stations under Fading 1: how far left stands over right correlates %.2f between them on average\n",
                together);
    EXPECT(std::fabs(together) < 0.25, "every station has notches of its own, so a chord does not lean to one side together");
  }

  // The notch over the static. The static of two renders is the same
  // noise whatever Fading is, so one band of it with Fading up against the
  // same band without is the notch alone: it passes through each band in
  // turn, and not at the same time left and right.
  {
    Stereo hiss[2];
    for (int pass = 0; pass < 2; ++pass) {
      const float fading = pass == 0 ? 0.0f : 1.0f;
      hiss[pass] = static_alone([fading](Shortwave& d) { d.set_param(p::kFading, fading); }, 1.0f, 440.0f, 0.8f, 60.5f, 0.0f);
    }
    const double bands[3] = {450.0, 900.0, 1800.0};
    double deepest[3], apart = 0.0, steady = 0.0;
    for (int n = 0; n < 3; ++n) {
      // Two band-passes in series: a single one lets too much past its skirts
      // to show a notch.
      const auto narrow = [&](const std::vector<float>& x) {
        return level_track(band_of(band_of(x, bands[n], 8.0, kRate), bands[n], 8.0, kRate), at(0.5), at(0.5));
      };
      const std::vector<double> still = narrow(hiss[0].left), left = narrow(hiss[1].left);
      const std::vector<double> still_right = narrow(hiss[0].right), right = narrow(hiss[1].right);
      deepest[n] = 0.0;
      for (size_t i = 0; i < still.size(); ++i) {
        deepest[n] = std::min(deepest[n], left[i] - still[i]);
        apart = std::max(apart, std::fabs((left[i] - still[i]) - (right[i] - still_right[i])));
      }
      steady = std::max(steady, swing(still));
    }
    std::printf("  the notch over the static in 60 s: %.1f dB at 450 Hz, %.1f dB at 900 Hz, %.1f dB at 1.8 kHz; sides up to %.1f dB apart; without Fading the bands move %.1f dB\n",
                deepest[0], deepest[1], deepest[2], apart, steady);
    // The two notches are two walks, not one walked at two paces: they are
    // apart from the first second on. Where each stands is where the hiss
    // has lost most, read a third of an octave at a time.
    double centre[2] = {0.0, 0.0};
    for (int side = 0; side < 2; ++side) {
      double lowest = 0.0;
      for (double hz = 250.0; hz < 3200.0; hz *= std::pow(2.0, 1.0 / 3.0)) {
        const auto first_second = [&](const Stereo& s) {
          const std::vector<float>& x = side == 0 ? s.left : s.right;
          return db(rms(band_of(band_of(x, hz, 6.0, kRate), hz, 6.0, kRate), at(0.2), at(1.2)));
        };
        const double lost = first_second(hiss[1]) - first_second(hiss[0]);
        if (lost < lowest) {
          lowest = lost;
          centre[side] = hz;
        }
      }
    }
    const double octaves = std::fabs(std::log2(centre[0] / centre[1]));
    std::printf("  the notch over the static in its first second: at %.0f Hz on the left, %.0f Hz on the right\n", centre[0], centre[1]);
    EXPECT(centre[0] > 0.0 && centre[1] > 0.0 && octaves > 0.6, "the left notch and the right one start in different places");
    EXPECT(steady < 5.0, "without Fading the static is steady");
    EXPECT(deepest[0] < -8.0 && deepest[1] < -8.0 && deepest[2] < -8.0, "with Fading a notch sweeps through the static");
    EXPECT(apart > 6.0, "and not the same way left and right");
  }
}

// --- the second station -----------------------------------------------------------------------

// The note is 500 Hz: the level is read in windows of 10 ms, which hold
// five whole cycles of it, so a steady tone reads steady.
static void test_beat() {
  // What the knob promises, in hertz: half a hertz at its lowest, eight at its highest.
  const float settings[3] = {0.25f, 0.5f, 1.0f};
  const double promised[3] = {1.0, 2.0, 8.0};
  for (int which = 0; which < 3; ++which) {
    const float setting = settings[which];
    plain(device);
    device.set_param(p::kBeat, setting);
    device.note_on(1, 500.0f, 0.8f);
    Stereo out = render(device, 10.3f, kRate);
    const double offset = Shortwave::beat_hz(setting);
    const std::vector<double> level = level_track(out.left, at(0.25), at(0.01), at(10.25));
    const auto range = std::minmax_element(level.begin(), level.end());
    const int beats = rises(level, 0.5 * (*range.first + *range.second));
    const double other = tone_level(out.left, 500.0 + offset, kRate, at(0.3), at(10.3)) /
                         tone_level(out.left, 500.0, kRate, at(0.3), at(10.3));
    std::printf("  Beat %.2f: %d beats in 10 s (%.2f Hz set), %.1f dB deep, the second station %.1f dB under the first\n",
                setting, beats, offset, *range.second - *range.first, -db(other));
    char label[120];
    std::snprintf(label, sizeof label, "Beat %.2f beats at the offset it sets", setting);
    EXPECT(std::abs(beats - static_cast<int>(std::lround(10.0 * promised[which]))) <= 1, label);
    EXPECT_NEAR(offset, promised[which], 0.01, "and the offset is the one the knob promises");
    // Two tones of 1 and 0.45: the level runs between 1.45 and 0.55.
    EXPECT_NEAR(*range.second - *range.first, db(1.45 / 0.55), 0.7, "the beat is as deep as the second station is loud");
    EXPECT_NEAR(other, Shortwave::kBeatLevel, 0.03, "the second station is the fainter one, above the note");
  }
  {
    plain(device);
    device.note_on(1, 500.0f, 0.8f);
    Stereo out = render(device, 5.0f, kRate);
    EXPECT(swing(level_track(out.left, at(0.25), at(0.01))) < 0.05, "Beat 0 is one station: the level does not beat");
  }
  // On Warble the second station follows the tone.
  {
    plain(device);
    device.set_param(p::kSignal, Shortwave::kWarble);
    device.set_param(p::kRate, 0.25f);
    device.set_param(p::kBeat, 0.5f);
    device.note_on(1, 500.0f, 0.8f);
    Stereo out = render(device, 7.5f, kRate);
    // The octave sounds from 4 to 8 s; the offset doubles with the tone.
    const std::vector<double> level = level_track(out.left, at(4.3), at(0.01), at(7.3));
    const auto range = std::minmax_element(level.begin(), level.end());
    const int beats = rises(level, 0.5 * (*range.first + *range.second));
    std::printf("  Beat 0.5 under Warble, on the octave: %d beats in 3 s\n", beats);
    EXPECT(std::abs(beats - 12) <= 1, "the second station moves up the octave with the first");
  }
}

// --- static -----------------------------------------------------------------------------------

static void no_patch(Shortwave&) {}

static void test_static() {
  // What Static adds is noise, as loud against the key as the knob says, the
  // two sides sharing most of it; it goes with the key and the device then
  // reaches exact silence.
  {
    const auto quick = [](Shortwave& d) { d.set_param(p::kRelease, 0.2f); };
    Stereo hiss = static_alone(quick, 0.5f, 440.0f, 0.8f, 3.0f, 2.0f);
    plain(device);
    device.set_param(p::kRelease, 0.2f);
    device.set_param(p::kStatic, 0.5f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo whole = render(device, 3.0f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 2.0f, kRate);
    const double tone = tone_level(whole.left, 440.0, kRate, at(0.5), at(3.0)) / std::sqrt(2.0);
    const double noise = rms(hiss.left, at(0.5), at(3.0));
    // Uniform noise of amplitude h, mid plus 0.6 of side: h * 0.577 * sqrt(1.36).
    const double model = 0.6 * std::pow(0.5, 1.5) * 0.5774 * std::sqrt(1.36) * std::sqrt(2.0);
    double flatness = 0.0;
    {
      double log_sum = 0.0, sum = 0.0;
      int count = 0;
      for (double f = 300.0; f <= 6000.0; f += 150.0) {
        const std::vector<float> band = band_of(hiss.left, f, 4.0, kRate);
        const double power = rms(band, at(0.5), at(3.0)) / std::sqrt(f);  // a band of constant Q widens with f
        log_sum += std::log(power * power);
        sum += power * power;
        ++count;
      }
      flatness = std::exp(log_sum / count) / (sum / count);
    }
    const double sides = correlation(hiss.left, hiss.right, at(0.5), at(3.0));
    std::printf("  Static 0.5: noise %.1f dB under the key (%.1f dB by the knob), flat to %.2f from 300 Hz to 6 kHz, sides correlate %.2f\n",
                -db(noise / tone), -db(model), flatness, sides);
    // The open band still ends at 18 kHz, which takes a little off.
    EXPECT_NEAR(db(noise / tone), db(model), 3.0, "Static is as loud against the key as the knob says");
    Stereo full = static_alone(quick, 1.0f, 440.0f, 0.8f, 3.0f, 0.0f);
    EXPECT_NEAR(db(rms(full.left, at(0.5), at(3.0)) / noise), 1.5 * db(2.0), 0.3, "and grows with the knob by its power of one and a half");
    EXPECT(flatness > 0.7, "it is noise, even across the band");
    EXPECT(sides > 0.3 && sides < 0.65, "the two sides share most of their static");
    EXPECT(tone_level(hiss.left, 440.0, kRate, at(0.5), at(3.0)) < 0.1 * noise, "and it has no pitch");

    // After the key: gone with the note, then exactly nothing.
    const double after = rms(hiss.left, at(3.25), at(3.35));
    std::printf("  Static after the key: %.1f dB down 0.3 s after note off; exact zero from %.2f s\n", -db(after / noise),
                [&] {
                  size_t last = 0;
                  for (size_t i = 0; i < tail.size(); ++i) {
                    if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
                  }
                  return static_cast<double>(last + 1) / kRate;
                }());
    EXPECT(after < 0.01 * noise, "the static dies away with the key");
    EXPECT(both_peak(tail, at(1.0)) == 0.0, "and the instrument reaches exact silence");
    EXPECT(rms(tail.left, at(0.02), at(0.1)) > 0.0, "(the tail itself is not empty)");
  }

  // It rises with the key: under a slow attack the static is not there first.
  {
    const auto slow = [](Shortwave& d) { d.set_param(p::kAttack, 2.0f); };
    Stereo hiss = static_alone(slow, 0.5f, 440.0f, 0.8f, 5.0f, 0.0f);
    const double early = rms(hiss.left, 0, at(0.2));
    const double late = rms(hiss.left, at(4.0), at(5.0));
    std::printf("  Static under a 2 s attack: the first 0.2 s are %.1f dB under the held level\n", -db(early / late));
    EXPECT(early < 0.2 * late, "the static rises with the key");
  }

  // It is a balance against the key: a soft key has as much less static.
  {
    Stereo soft = static_alone(no_patch, 0.5f, 440.0f, 0.2f, 2.0f, 0.0f);
    Stereo loud = static_alone(no_patch, 0.5f, 440.0f, 1.0f, 2.0f, 0.0f);
    const double ratio = db(rms(loud.left, at(0.5)) / rms(soft.left, at(0.5)));
    std::printf("  Static under a key at gain 1.0 against 0.2: %.1f dB more (the keys differ by %.1f dB)\n", ratio,
                db(1.0 / (0.25 + 0.75 * 0.2)));
    EXPECT_NEAR(ratio, db(1.0 / (0.25 + 0.75 * 0.2)), 1.0, "static follows the loudness of the key");
  }

  // Crackle. The hiss of two settings of Static is the same noise, scaled
  // by the knob to the power 1.5; taking one from the other in that
  // proportion leaves the crackles alone, each a single spike.
  {
    plain(device);
    device.note_on(1, 440.0f, 0.8f);
    Stereo tone = render(device, 1.0f, kRate);
    const double key = peak(tone.left, at(0.5));
    const float pairs[2][2] = {{0.2f, 0.1f}, {1.0f, 0.5f}};
    int counts[2] = {0, 0};
    double largest[2] = {0.0, 0.0}, longest[2] = {0.0, 0.0};
    for (int which = 0; which < 2; ++which) {
      Stereo more = static_alone(no_patch, pairs[which][0], 440.0f, 0.8f, 20.5f, 0.0f);
      Stereo less = static_alone(no_patch, pairs[which][1], 440.0f, 0.8f, 20.5f, 0.0f);
      const float scale = std::pow(pairs[which][0] / pairs[which][1], 1.5f);
      size_t quiet = 1000, length = 0;
      for (size_t i = at(0.5); i < more.size(); ++i) {
        const double spike = std::max(std::fabs(static_cast<double>(more.left[i]) - scale * less.left[i]),
                                      std::fabs(static_cast<double>(more.right[i]) - scale * less.right[i]));
        largest[which] = std::max(largest[which], spike);
        if (spike > 0.02 * key) {
          if (quiet > 48) {
            ++counts[which];
            length = 0;
          }
          quiet = 0;
          longest[which] = std::max(longest[which], static_cast<double>(++length));
        } else {
          ++quiet;
        }
      }
    }
    std::printf("  crackles in 20 s: %d at Static 0.2, %d at Static 1; the largest %.2f and %.2f of the key's peak; none longer than %.0f samples\n",
                counts[0], counts[1], largest[0] / key, largest[1] / key, std::max(longest[0], longest[1]));
    // 0.5 + 11 * Static^2 a second: 19 and 230 in 20 s.
    EXPECT(counts[0] >= 8 && counts[0] <= 34, "low Static crackles now and then");
    EXPECT(counts[1] >= 180 && counts[1] <= 280, "Static 1 crackles several times a second");
    EXPECT(largest[1] > 0.5 * key && largest[1] < 2.0 * key, "the largest crackle is about as tall as the key");
    EXPECT(largest[0] > 0.1 * key && largest[0] < largest[1], "and smaller at low Static");
    EXPECT(std::max(longest[0], longest[1]) <= 12.0, "a crackle is a spike, not a burst");
  }

  // The same balance at 96 kHz: noise made per sample would lose 3 dB there,
  // and a one-sample crackle 6 dB. The crackles fall at the same moments at
  // both rates, so the largest can be compared.
  {
    double balance[2] = {0.0, 0.0}, crack[2] = {0.0, 0.0};
    const float rates[2] = {48000.0f, 96000.0f};
    for (int which = 0; which < 2; ++which) {
      const float rate = rates[which];
      const auto narrow = [](Shortwave& d) { d.set_param(p::kBand, 0.5f); };
      Stereo more = static_alone(narrow, 1.0f, 440.0f, 0.8f, 10.5f, 0.0f, rate);
      Stereo less = static_alone(narrow, 0.5f, 440.0f, 0.8f, 10.5f, 0.0f, rate);
      plain(device, rate);
      device.set_param(p::kBand, 0.5f);
      device.note_on(1, 440.0f, 0.8f);
      Stereo tone = render(device, 2.0f, rate);
      balance[which] = db(rms(more.left, at(0.5, rate)) / rms(tone.left, at(0.5, rate)));
      const float scale = std::pow(2.0f, 1.5f);
      for (size_t i = at(0.5, rate); i < more.size(); ++i) {
        crack[which] = std::max(crack[which], std::fabs(static_cast<double>(more.left[i]) - scale * less.left[i]));
      }
      crack[which] = db(crack[which] / peak(tone.left, at(0.5, rate)));
    }
    std::printf("  Static 1 against the key: %.2f dB at 48 kHz, %.2f dB at 96 kHz; largest crackle %.1f and %.1f dB against the key\n",
                balance[0], balance[1], crack[0], crack[1]);
    EXPECT_NEAR(balance[1], balance[0], 1.0, "the static is as loud at 96 kHz as at 48 kHz");
    EXPECT_NEAR(crack[1], crack[0], 1.5, "and so are its crackles");
  }
}

// --- the receiver's band ----------------------------------------------------------------------

static void test_band() {
  // The static narrows: less above 3 kHz and less at the bottom.
  {
    double high[2] = {0.0, 0.0}, low[2] = {0.0, 0.0};
    for (int which = 0; which < 2; ++which) {
      const float band = which == 0 ? 0.0f : 1.0f;
      Stereo hiss = static_alone([band](Shortwave& d) { d.set_param(p::kBand, band); }, 1.0f, 440.0f, 0.8f, 4.0f, 0.0f);
      const double middle = rms(band_of(hiss.left, 1000.0, 4.0, kRate), at(0.5));
      high[which] = db(rms(band_of(hiss.left, 8000.0, 4.0, kRate), at(0.5)) / middle);
      low[which] = db(rms(band_of(hiss.left, 60.0, 4.0, kRate), at(0.5)) / middle);
    }
    std::printf("  static against its 1 kHz band: 8 kHz %.1f dB with Band 0 and %.1f dB with Band 1; 60 Hz %.1f dB and %.1f dB\n",
                high[0], high[1], low[0], low[1]);
    EXPECT(high[1] < high[0] - 15.0, "Band takes the top off the static");
    EXPECT(low[1] < low[0] - 10.0, "and the bottom");
  }

  // What it does to the stations: the middle stays, the ends thin.
  {
    const float notes[4] = {55.0f, 440.0f, 1000.0f, 4186.0f};
    double loss[4];
    for (int n = 0; n < 4; ++n) {
      double level[2];
      for (int which = 0; which < 2; ++which) {
        plain(device);
        device.set_param(p::kBand, which == 0 ? 0.0f : 1.0f);
        device.note_on(1, notes[n], 0.8f);
        Stereo out = render(device, 1.0f, kRate);
        level[which] = rms(out.left, at(0.5));
      }
      loss[n] = db(level[1] / level[0]);
    }
    std::printf("  Band 1 against Band 0: %.1f dB at 55 Hz, %.1f dB at 440 Hz, %.1f dB at 1 kHz, %.1f dB at 4186 Hz\n", loss[0],
                loss[1], loss[2], loss[3]);
    EXPECT(loss[0] < -15.0 && loss[0] > -23.0, "a narrow Band thins the low notes without losing them");
    EXPECT(loss[3] < -6.0 && loss[3] > -13.0, "and the high ones");
    EXPECT(std::fabs(loss[2]) < 1.5 && loss[1] > -4.0, "and leaves the middle");
  }

  // The default band costs the lowest note little.
  {
    double level[2];
    for (int which = 0; which < 2; ++which) {
      plain(device);
      device.set_param(p::kBand, which == 0 ? 0.0f : p::kParamDefault[p::kBand]);
      device.note_on(1, 27.5f, 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      level[which] = rms(out.left, at(1.0));
    }
    std::printf("  the default Band takes %.1f dB off the lowest note\n", -db(level[1] / level[0]));
    EXPECT(db(level[1] / level[0]) > -6.0, "the default Band keeps the bottom of the keyboard");
  }
}

// --- playing it -------------------------------------------------------------------------------

static const char* const kSignalNames[4] = {"Whistle", "Warble", "Pips", "Voices"};

// Ten keys a minor third apart from A2, as a player's two hands would hold.
static void hold_ten(Shortwave& d, float gain) {
  for (int n = 0; n < 10; ++n) d.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), gain);
}

static void test_playing() {
  char label[200];

  // A key is heard at once, and one key at gain 0.7 sits where the recipe
  // asks, on every signal at the default settings.
  for (int signal = 0; signal < 4; ++signal) {
    device.init(kRate);
    device.set_param(p::kSignal, static_cast<float>(signal));
    device.note_on(1, 261.63f, 0.7f);
    Stereo out = render(device, 8.0f, kRate);
    const double top = both_peak(out);
    const double early = both_peak(out, 0, at(0.03));
    double loudest = 0.0;
    for (size_t from = 0; from + at(0.4) <= out.size(); from += at(0.1)) loudest = std::max(loudest, rms(out.left, from, from + at(0.4)));
    std::printf("  %s: one key at gain 0.7 peaks %.1f dBFS, loudest 400 ms %.1f dBFS, first 30 ms reach %.1f dBFS\n",
                kSignalNames[signal], db(top), db(loudest), db(early));
    std::snprintf(label, sizeof label, "%s: one key at gain 0.7 peaks between -24 and -10 dBFS", kSignalNames[signal]);
    EXPECT(db(top) > -24.0 && db(top) < -10.0, label);
    std::snprintf(label, sizeof label, "%s: a key is heard within 30 ms", kSignalNames[signal]);
    EXPECT(early > 0.05 * top && db(early) > -50.0, label);
  }

  // Both ends of the keyboard do something sensible on every signal.
  for (int signal = 0; signal < 4; ++signal) {
    double level[3];
    const float notes[3] = {27.5f, 440.0f, 4186.0f};
    for (int n = 0; n < 3; ++n) {
      device.init(kRate);
      device.set_param(p::kSignal, static_cast<float>(signal));
      device.set_param(p::kFading, 0.0f);
      device.note_on(1, notes[n], 0.8f);
      Stereo out = render(device, 4.0f, kRate);
      level[n] = finite(out.left) && finite(out.right) ? rms(out.left, at(1.0)) : 0.0;
    }
    std::snprintf(label, sizeof label, "%s: 27.5 Hz and 4186 Hz sound, %.1f dB and %.1f dB against A4", kSignalNames[signal],
                  db(level[0] / level[1]), db(level[2] / level[1]));
    EXPECT(std::fabs(db(level[0] / level[1])) < 8.0 && std::fabs(db(level[2] / level[1])) < 8.0, label);
  }

  // Loudness follows velocity.
  {
    double level[2];
    for (int which = 0; which < 2; ++which) {
      plain(device);
      device.note_on(1, 440.0f, which == 0 ? 0.1f : 1.0f);
      Stereo out = render(device, 1.0f, kRate);
      level[which] = rms(out.left, at(0.5));
    }
    std::printf("  a key at gain 0.1 is %.1f dB under one at gain 1.0\n", -db(level[0] / level[1]));
    EXPECT_NEAR(db(level[0] / level[1]), db(0.25 + 0.75 * 0.1), 0.2, "soft keys are quieter");
  }

  // Ten held keys stay under the clip's knee, with the fading that hides
  // some of them and without it.
  for (int signal = 0; signal < 4; ++signal) {
    double top[2];
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.set_param(p::kSignal, static_cast<float>(signal));
      if (which == 1) device.set_param(p::kFading, 0.0f);
      hold_ten(device, 0.8f);
      Stereo out = render(device, 12.0f, kRate);
      top[which] = both_peak(out);
    }
    std::snprintf(label, sizeof label, "%s: ten held keys stay under the clip knee (peak %.3f, %.3f without Fading)",
                  kSignalNames[signal], top[0], top[1]);
    std::printf("  %s\n", label);
    EXPECT(top[0] < 0.5 && top[1] < 0.5, label);
  }

  // The receiver turns itself down as stations crowd in: four keys are each
  // as loud as one alone, nine are each quieter by four ninths to the power
  // of 0.6 (a little more than the root, which would hold the sum's power).
  {
    double level[3];
    const int keys[3] = {1, 4, 9};
    for (int which = 0; which < 3; ++which) {
      plain(device);
      device.set_param(p::kVolume, -20.0f);  // the sum stays under the clip's knee
      device.note_on(0, 1000.0f, 0.8f);
      for (int n = 1; n < keys[which]; ++n) device.note_on(n, 1000.0f * std::pow(2.0f, (n * 5 + 2) / 12.0f - 3.0f), 0.8f);
      Stereo out = render(device, 1.5f, kRate);
      level[which] = tone_level(out.left, 1000.0, kRate, at(0.5), at(1.5));
    }
    std::printf("  one key among four is %.2f dB from alone, among nine %.2f dB\n", db(level[1] / level[0]), db(level[2] / level[0]));
    EXPECT_NEAR(db(level[1] / level[0]), 0.0, 0.1, "up to four keys each keep their level");
    EXPECT_NEAR(db(level[2] / level[0]), 0.6 * db(4.0 / 9.0), 0.3, "more keys turn each other down");
  }

  // The output ends in the soft clip: pushed far past full scale it stays inside it.
  {
    plain(device);
    device.set_param(p::kVolume, 6.0f);
    device.set_param(p::kBeat, 1.0f);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * (n + 1), 1.0f);
    Stereo out = render(device, 3.0f, kRate);
    std::printf("  ten keys at full gain on one harmonic series, Volume up: peak %.3f\n", both_peak(out));
    EXPECT(both_peak(out) > 0.8 && both_peak(out) <= 1.0, "the output ends in the soft clip");
  }

  // Attack and release are the times they say; then the device is silent.
  {
    plain(device);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo rise = render(device, 2.0f, kRate);
    const double full = rms(rise.left, at(1.5), at(2.0));
    EXPECT(rms(rise.left, 0, at(0.1)) < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise.left, at(1.1), at(1.2)) > 0.9 * full, "and has arrived shortly after 1 s");
    device.note_off(1);
    Stereo fall = render(device, 3.0f, kRate);
    EXPECT(rms(fall.left, at(0.4), at(0.5)) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall.left, at(1.0), at(1.1)) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(both_peak(fall, at(2.0)) == 0.0, "and is exactly silent soon after");
  }

  // Stealing. Ten keys held until their levels tie, then two more at once:
  // both sound, and each took one voice.
  {
    plain(device);
    hold_ten(device, 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(98, 2000.0f, 0.8f);
    device.note_on(99, 2500.0f, 0.8f);
    Stereo both = render(device, 0.6f, kRate);
    const double a = tone_level(both.left, 2000.0, kRate, at(0.3)), b = tone_level(both.left, 2500.0, kRate, at(0.3));
    int left_of_ten = 0;
    for (int n = 0; n < 10; ++n) {
      left_of_ten += tone_level(both.left, 110.0 * std::pow(2.0, n * 3 / 12.0), kRate, at(0.3)) > 0.01 ? 1 : 0;
    }
    std::printf("  two keys over a full pool: %.1f and %.1f dBFS, %d of the ten still sound\n", db(a), db(b), left_of_ten);
    EXPECT(a > 0.03 && b > 0.03, "two keys that both have to steal both sound");
    EXPECT(left_of_ten == 8, "and take one voice each");

    // Nine held and two at once: the first takes the free voice and is not
    // then taken by the second, although it has not sounded yet.
    plain(device);
    for (int n = 0; n < 9; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(98, 2000.0f, 0.8f);
    device.note_on(99, 2500.0f, 0.8f);
    Stereo pair = render(device, 0.6f, kRate);
    EXPECT(tone_level(pair.left, 2000.0, kRate, at(0.3)) > 0.03 && tone_level(pair.left, 2500.0, kRate, at(0.3)) > 0.03,
           "a voice just taken is not stolen by the next key of the chord");

    // A key struck twice inside the steal fade is one note, and lets go.
    plain(device);
    hold_ten(device, 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(99, 2000.0f, 0.8f);
    device.note_on(99, 2000.0f, 0.8f);
    Stereo twice = render(device, 0.6f, kRate);
    left_of_ten = 0;
    for (int n = 0; n < 10; ++n) {
      left_of_ten += tone_level(twice.left, 110.0 * std::pow(2.0, n * 3 / 12.0), kRate, at(0.3)) > 0.01 ? 1 : 0;
    }
    EXPECT(left_of_ten == 9, "a key struck twice during a steal takes one voice");
    for (int n = 0; n < 10; ++n) device.note_off(n);
    device.note_off(99);
    Stereo rest = render(device, 1.5f, kRate);
    EXPECT(both_peak(rest, at(1.0)) == 0.0, "and every voice ends when the keys are let go");

    // A key let go before its stolen voice has faded never starts.
    plain(device);
    hold_ten(device, 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(99, 2000.0f, 0.8f);
    device.note_off(99);
    Stereo never = render(device, 0.4f, kRate);
    EXPECT(tone_level(never.left, 2000.0, kRate, at(0.1)) < 1.0e-4, "a stolen voice released before it starts stays silent");

    // A held key struck again with every voice busy keeps its release.
    plain(device);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(0, 3000.0f, 0.8f);
    for (int n = 1; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(0, 3000.0f, 0.8f);
    Stereo held = render(device, 0.5f, kRate);
    device.note_off(0);
    Stereo let_go = render(device, 0.5f, kRate);
    const double before = tone_level(held.left, 3000.0, kRate, at(0.3));
    const double after = tone_level(let_go.left, 3000.0, kRate, at(0.2), at(0.3));
    std::printf("  a key struck again in a full pool: %.1f dB down a quarter of its release after note off\n", -db(after / before));
    EXPECT(after > 0.1 * before && after < 0.3 * before, "a key struck again keeps its release time");
  }

  // Bad input: notes that are not numbers are ignored, absurd ones are
  // brought into range, and nothing breaks.
  {
    const float inf = std::numeric_limits<float>::infinity();
    device.init(kRate);
    device.note_on(1, std::nanf(""), 0.8f);
    Stereo nothing = render(device, 0.2f, kRate);
    EXPECT(both_peak(nothing) == 0.0, "a note without a frequency is ignored");
    device.note_on(2, inf, inf);
    device.note_on(3, -inf, -1.0f);
    device.note_on(4, 0.0f, std::nanf(""));
    device.note_on(5, 1.0e9f, 5.0f);
    device.note_off(77);
    for (int id = -2; id <= p::kNumParams + 1; ++id) {
      device.set_param(id, std::nanf(""));
      device.set_param(id, inf);
      device.set_param(id, -inf);
    }
    Stereo abused = render(device, 1.0f, kRate);
    EXPECT(finite(abused.left) && finite(abused.right) && both_peak(abused) <= 1.0 && rms(abused.left) > 1.0e-4,
           "absurd notes and parameters are survived");
    // A frequency far above the keyboard is played as the highest the device takes.
    plain(device, 44100.0f);
    device.note_on(1, 30000.0f, 0.8f);
    Stereo high = render(device, 0.5f, 44100.0f);
    const double hz = crossing_hz(high.left, at(0.1, 44100.0), at(0.5, 44100.0), 44100.0);
    std::snprintf(label, sizeof label, "a note above the range is clamped (%.0f Hz at 44.1 kHz)", hz);
    EXPECT(hz > 11000.0 && hz < 0.3 * 44100.0 + 10.0, label);
    for (int n = 1; n <= 5; ++n) device.note_off(n);
  }

  // The same notes after a second init give the same audio, bit for bit:
  // every signal, everything that moves turned up, played as the app plays.
  for (int signal = 0; signal < 4; ++signal) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kSignal, static_cast<float>(signal));
      device.set_param(p::kTuneIn, 0.7f);
      device.set_param(p::kDrift, 0.8f);
      device.set_param(p::kFading, 0.9f);
      device.set_param(p::kBeat, 0.4f);
      device.set_param(p::kStatic, 0.8f);
      device.note_on(60, 261.63f, 0.8f);
      device.note_on(64, 329.63f, 0.8f);
      out[pass] = render(device, 0.9f, kRate);
      device.note_off(60);
      device.note_on(67, 392.0f, 0.8f);
      out[pass] = concat(out[pass], render(device, 0.7f, kRate));
      device.note_off(64);
      device.note_off(67);
      out[pass] = concat(out[pass], render(device, 3.5f, kRate));
      device.note_on(72, 523.25f, 0.8f);
      out[pass] = concat(out[pass], render(device, 0.5f, kRate));
    }
    std::snprintf(label, sizeof label, "%s: a second init gives bit-identical audio", kSignalNames[signal]);
    EXPECT(out[0].left == out[1].left && out[0].right == out[1].right, label);
    std::snprintf(label, sizeof label, "%s: (and the phrase is not silent)", kSignalNames[signal]);
    EXPECT(rms(out[0].left) > 1.0e-3 && rms(out[0].right) > 1.0e-3, label);
  }
}

// --- clicks -----------------------------------------------------------------------------------

// One low whistle, held: close to nothing in its third difference, so
// whatever an event adds at once stands out.
static void held_whistle(Shortwave& d) {
  plain(d);
  d.set_param(p::kBand, p::kParamDefault[p::kBand]);
  d.set_param(p::kVolume, p::kParamDefault[p::kVolume]);
  d.note_on(1, 220.0f, 0.8f);
}

static void test_clicks() {
  struct Case {
    const char* name;
    std::function<void(Shortwave&)> setup;
    std::function<void(Shortwave&)> event;
    float settle;
  };
  const auto set = [](int id, float value) { return [id, value](Shortwave& d) { d.set_param(id, value); }; };
  const auto with = [](int id, float value) {
    return [id, value](Shortwave& d) {
      held_whistle(d);
      d.set_param(id, value);
    };
  };
  const auto with_two = [](int a, float va, int b, float vb) {
    return [a, va, b, vb](Shortwave& d) {
      held_whistle(d);
      d.set_param(a, va);
      d.set_param(b, vb);
    };
  };
  const auto ten = [](Shortwave& d) {
    plain(d);
    d.set_param(p::kVolume, p::kParamDefault[p::kVolume]);
    hold_ten(d, 0.8f);
  };
  const std::vector<Case> cases = {
      {"Signal to Warble", held_whistle, set(p::kSignal, Shortwave::kWarble), 0.75f},
      {"Signal to Pips", held_whistle, set(p::kSignal, Shortwave::kPips), 0.75f},
      {"Signal to Voices", held_whistle, set(p::kSignal, Shortwave::kVoices), 0.5f},
      {"Signal from Voices", with(p::kSignal, Shortwave::kVoices), set(p::kSignal, Shortwave::kWhistle), 0.5f},
      {"Signal from Warble", with(p::kSignal, Shortwave::kWarble), set(p::kSignal, Shortwave::kWhistle), 0.75f},
      {"Shift on its tone", with_two(p::kSignal, Shortwave::kWarble, p::kRate, 0.25f), set(p::kShift, 2.0f), 5.0f},
      {"Rate under Pips", with(p::kSignal, Shortwave::kPips), set(p::kRate, 12.0f), 0.5f},
      {"Rate under Warble", with(p::kSignal, Shortwave::kWarble), set(p::kRate, 12.0f), 0.75f},
      {"Band narrowed", held_whistle, set(p::kBand, 1.0f), 0.5f},
      {"Band opened", with(p::kBand, 1.0f), set(p::kBand, 0.0f), 0.5f},
      {"Fading up", held_whistle, set(p::kFading, 1.0f), 3.0f},
      {"Fading down", with(p::kFading, 1.0f), set(p::kFading, 0.0f), 3.0f},
      {"Static up", held_whistle, set(p::kStatic, 1.0f), 0.5f},
      {"Static down", with(p::kStatic, 1.0f), set(p::kStatic, 0.0f), 0.5f},
      {"Beat up", held_whistle, set(p::kBeat, 1.0f), 0.5f},
      {"Beat down", with(p::kBeat, 1.0f), set(p::kBeat, 0.0f), 0.5f},
      {"Drift up", held_whistle, set(p::kDrift, 1.0f), 0.5f},
      {"Volume up", held_whistle, set(p::kVolume, 6.0f), 0.5f},
      {"Volume down", held_whistle, set(p::kVolume, -48.0f), 0.5f},
      {"a second key", held_whistle, [](Shortwave& d) { d.note_on(2, 330.0f, 0.8f); }, 0.5f},
      {"a key struck again", held_whistle, [](Shortwave& d) { d.note_on(1, 220.0f, 0.8f); }, 0.5f},
      {"note off at the shortest release", held_whistle, [](Shortwave& d) { d.note_off(1); }, 0.5f},
      {"an eleventh key (a steal)", ten, [](Shortwave& d) { d.note_on(99, 233.08f, 0.8f); }, 1.0f},
  };
  double worst = 0.0;
  const char* worst_name = "";
  for (const Case& c : cases) {
    const double sudden = suddenness(c.setup, c.event, c.settle);
    if (sudden > worst) {
      worst = sudden;
      worst_name = c.name;
    }
    char label[160];
    std::snprintf(label, sizeof label, "%s arrives gradually (%.3f of it in the first 8 samples)", c.name, sudden);
    EXPECT(sudden < 0.15, label);
  }
  std::printf("  %zu events under a held whistle: the most sudden is %s, %.3f of it in the first 8 samples\n", cases.size(),
              worst_name, worst);

  // Rate thrown between its ends while pips and warbles sound. A pip's
  // length and both signals' edges follow Rate, so an edge worked out from
  // the Rate of the moment would jump; the gates are walked instead, and the
  // third difference stays where the edges of a steady Rate 12 leave it.
  for (int signal : {static_cast<int>(Shortwave::kPips), static_cast<int>(Shortwave::kWarble)}) {
    const auto take = [signal](bool thrown) {
      held_whistle(device);
      device.set_param(p::kSignal, static_cast<float>(signal));
      device.set_param(p::kRate, 12.0f);
      Stereo out = render(device, 0.5f, kRate);
      for (int n = 0; n < 40; ++n) {
        if (thrown) device.set_param(p::kRate, n % 2 == 0 ? 0.25f : 12.0f);
        out = concat(out, render(device, 0.0371f + 0.0113f * static_cast<float>(n % 5), kRate));
      }
      return kink(out.left, at(0.3));
    };
    const double thrown = take(true), steady = take(false);
    std::printf("  Rate thrown between its ends under %s: third difference %.6f against %.6f at a steady Rate 12\n",
                kSignalNames[signal], thrown, steady);
    EXPECT(thrown < 1.5 * steady + 1.0e-5, "a thrown Rate makes no edge a jump");
  }

  // A Shift chosen while the second tone sounds waits for it to end, and is
  // the next second tone.
  {
    held_whistle(device);
    device.set_param(p::kSignal, Shortwave::kWarble);
    device.set_param(p::kRate, 1.0f);
    Stereo before = render(device, 1.5f, kRate);  // the octave sounds from 1 s to 2 s
    device.set_param(p::kShift, 2.0f);
    Stereo after = render(device, 2.5f, kRate);
    const double still = crossing_hz(after.left, at(0.05), at(0.4), kRate);
    const double next = crossing_hz(after.left, at(1.6), at(2.4), kRate);
    std::printf("  Shift changed on the second tone: it stays at %.1f Hz, the next one is %.1f Hz\n", still, next);
    EXPECT(std::fabs(cents(still, 440.0)) < 2.0 && std::fabs(cents(next, 880.0)) < 2.0, "a new Shift waits for the tone to end");
    const double own = kink(before.left, at(1.2));
    EXPECT(kink(concat(before, after).left, at(1.2)) < 1.5 * std::max(own, kink(after.left, at(1.6), at(2.4))),
           "and changes nothing with a corner");
  }
}

// --- block size, silence and waking -----------------------------------------------------------

static void test_blocks() {
  // The output does not depend on the block size, across silences of every
  // length around the moment the device falls asleep (which block that is
  // depends on the block size) and one long after it. Knobs are moved in the
  // silence, 10 ms before the next key: asleep or not, they are there when
  // the key arrives.
  for (int signal : {static_cast<int>(Shortwave::kWarble), static_cast<int>(Shortwave::kVoices)}) {
    auto phrase = [signal](int block, float silence) {
      device.init(kRate);
      device.set_param(p::kSignal, static_cast<float>(signal));
      device.set_param(p::kBand, 0.0f);  // the low cut at its lowest rings longest into the silence
      device.set_param(p::kRelease, 0.05f);
      device.set_param(p::kAttack, 0.01f);
      device.set_param(p::kBeat, 0.4f);
      device.set_param(p::kStatic, 0.6f);
      device.set_param(p::kFading, 0.8f);
      device.set_param(p::kDrift, 0.6f);
      device.set_param(p::kRate, 7.0f);
      Stereo out;
      auto run_for = [&](float seconds) {
        Stereo part = block > 0 ? render(device, seconds, kRate, block) : render_ragged(device, seconds);
        out = concat(out, part);
      };
      device.note_on(1, 220.0f, 0.8f);
      device.note_on(2, 329.63f, 0.8f);
      run_for(0.5f);
      device.note_off(1);
      device.note_off(2);
      run_for(silence - 0.01f);
      device.set_param(p::kBand, 0.8f);
      device.set_param(p::kVolume, -4.0f);
      device.set_param(p::kRate, 3.0f);
      device.set_param(p::kFading, 0.3f);
      run_for(0.01f);
      device.note_on(3, 277.18f, 0.8f);
      run_for(0.4f);
      device.set_param(p::kSignal, Shortwave::kPips);
      device.set_param(p::kBand, 0.1f);
      run_for(0.3f);
      return out;
    };
    if (signal == Shortwave::kWarble) {
      Stereo asleep = phrase(128, 1.3f);
      EXPECT(both_peak(asleep, at(0.9), at(1.75)) == 0.0, "the phrase holds a silence in which the device sleeps");
      EXPECT(rms(asleep.left, at(1.9)) > 1.0e-3, "and a note after it");
    }
    double worst = 0.0;
    float worst_silence = 0.0f;
    const char* worst_block = "none";
    for (float silence : {0.12f, 0.14f, 0.16f, 0.18f, 0.20f, 0.22f, 0.24f, 0.26f, 0.28f, 0.30f, 1.3f}) {
      Stereo reference = phrase(128, silence);
      for (int block : {1, 0, 2048}) {
        const double diff = worst_difference(phrase(block, silence), reference);
        if (diff > worst) {
          worst = diff;
          worst_silence = silence;
          worst_block = block == 0 ? "ragged" : block == 1 ? "1 frame" : "2048 frames";
        }
      }
    }
    char label[200];
    std::snprintf(label, sizeof label, "%s: output does not depend on block size (worst %g, %s blocks, %.2f s silence)",
                  kSignalNames[signal], worst, worst_block, worst_silence);
    std::printf("  %s\n", label);
    EXPECT(worst == 0.0, label);
  }

  // Knobs moved while the device sleeps are in place for the next key: the
  // note after the silence is the one a device set that way from the start
  // plays. The device is put to sleep off the beat of its control clock.
  {
    const int knobs[6] = {p::kVolume, p::kBand, p::kFading, p::kStatic, p::kBeat, p::kRate};
    const float values[6] = {-3.0f, 0.9f, 0.9f, 0.8f, 0.6f, 9.0f};
    Stereo second[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kSignal, Shortwave::kWarble);
      device.set_param(p::kRelease, 0.05f);
      if (pass == 1) {
        for (int k = 0; k < 6; ++k) device.set_param(knobs[k], values[k]);
      }
      device.note_on(1, 220.0f, 0.8f);
      render(device, 0.3f, kRate);
      device.process(13);
      device.note_off(1);
      Stereo rest = render(device, 1.0f, kRate);
      EXPECT(both_peak(rest, at(0.6)) == 0.0, "(the device sleeps between the two notes)");
      if (pass == 0) {
        for (int k = 0; k < 6; ++k) device.set_param(knobs[k], values[k]);
      }
      render(device, 0.1f, kRate);
      device.note_on(2, 330.0f, 0.8f);
      second[pass] = render(device, 1.0f, kRate);
    }
    const double apart = worst_difference(second[0], second[1]);
    std::printf("  six knobs moved in a silence: the next note differs by %g from one set that way from the start\n", apart);
    EXPECT(apart < 1.0e-6, "knobs moved while asleep are in place for the next key");
    EXPECT(rms(second[0].left) > 1.0e-3, "(and that note sounds)");
  }
}
