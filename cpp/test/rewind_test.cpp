// Native harness for Rewind (cpp/devices/rewind). The conformance pass covers
// silence before and after notes, a pile of keys, parameter abuse and other
// sample rates; the rest measures what makes it a note played backwards.
// Nobody has listened to it: every figure printed here is what stands in for
// an ear.

#include "../devices/rewind/rewind.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Rewind;
namespace p = livemix::rewind;

static Rewind device;
static char label[240];

static const float kRate = 48000.0f;
static const int kTick = 32;  // the device's control period, samples

// The sample a note struck at sample 0 lands on: Swell rounded to a tick.
static size_t strike_sample(float swell, float rate = kRate) {
  return static_cast<size_t>(static_cast<int>(swell * rate / kTick + 0.5f)) * kTick;
}
static size_t at(double seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

// The note alone: no ghost, no second copy, no wow, no hammer, in the middle.
static void bare(Rewind& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kGhost, 0.0f);
  d.set_param(p::kShimmer, 0.0f);
  d.set_param(p::kWobble, 0.0f);
  d.set_param(p::kSnap, 0.0f);
  d.set_param(p::kWidth, 0.0f);
}

static size_t peak_index(const Stereo& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  size_t where = from;
  double top = -1.0;
  for (size_t i = from; i < to; ++i) {
    const double v = std::max(std::fabs(static_cast<double>(x.left[i])), std::fabs(static_cast<double>(x.right[i])));
    if (v > top) {
      top = v;
      where = i;
    }
  }
  return where;
}
static double both_peak(const Stereo& x, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(x.left, from, to), peak(x.right, from, to));
}
static double both_step(const Stereo& x, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(max_step(x.left, from, to), max_step(x.right, from, to));
}
// Third difference: next to nothing for a smooth wave, about its own size for a cut.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// tone_level, by turning a phasor instead of calling cos and sin per sample:
// the amplitude of the `hz` component over [from, to), Hann-windowed.
static double level_at(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  to = std::min(to, x.size());
  if (to <= from) return 0.0;
  const size_t n = to - from;
  const double turn_re = std::cos(2.0 * kPi * hz / rate), turn_im = -std::sin(2.0 * kPi * hz / rate);
  const double hann_re = std::cos(2.0 * kPi / static_cast<double>(n)), hann_im = std::sin(2.0 * kPi / static_cast<double>(n));
  double c = 1.0, s = 0.0, wc = 1.0, ws = 0.0, re = 0.0, im = 0.0, sum = 0.0;
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * wc;
    re += w * x[from + i] * c;
    im += w * x[from + i] * s;
    sum += w;
    const double next_c = c * turn_re - s * turn_im;
    s = s * turn_re + c * turn_im;
    c = next_c;
    const double next_wc = wc * hann_re - ws * hann_im;
    ws = ws * hann_re + wc * hann_im;
    wc = next_wc;
  }
  return 2.0 * std::sqrt(re * re + im * im) / sum;
}

// The strongest frequency within `span` cents of `hz`, to a tenth of a cent.
static double pitch_near(const std::vector<float>& x, double hz, double rate, size_t from, size_t to,
                         double span = 40.0) {
  double best = hz, top = -1.0;
  for (double offset = -span; offset <= span; offset += 2.0) {
    const double f = hz * std::pow(2.0, offset / 1200.0);
    const double level = level_at(x, f, rate, from, to);
    if (level > top) {
      top = level;
      best = f;
    }
  }
  const double centre = best;
  for (double offset = -2.0; offset <= 2.0; offset += 0.1) {
    const double f = centre * std::pow(2.0, offset / 1200.0);
    const double level = level_at(x, f, rate, from, to);
    if (level > top) {
      top = level;
      best = f;
    }
  }
  return best;
}

// The time at which the `hz` component first comes within `under_db` of its
// own largest value before `until`, read with 40 ms windows every 10 ms.
static double arrival(const std::vector<float>& x, double hz, double under_db, size_t until, float rate = kRate) {
  const size_t window = at(0.04, rate), hop = at(0.01, rate);
  std::vector<double> level;
  double top = 0.0;
  for (size_t from = 0; from + window <= until; from += hop) {
    level.push_back(tone_level(x, hz, rate, from, from + window));
    top = std::max(top, level.back());
  }
  const double threshold = top * std::pow(10.0, -under_db / 20.0);
  for (size_t i = 0; i < level.size(); ++i) {
    if (level[i] >= threshold) return (static_cast<double>(i * hop) + 0.5 * window) / rate;
  }
  return 0.0;
}

// How much of what an event changes is already there after 8 samples (see
// docs/solutions/best-practices/click-checks-need-an-event-free-reference.md):
// the same render with and without the event, at eight moments a little apart.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event, float before = 0.7f) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render(device, before + 0.0013f * static_cast<float>(trial), kRate);
      if (pass == 0) event(device);
      out[pass] = render(device, 0.03f, kRate);
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

static double max_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  const size_t n = std::min(a.size(), b.size());
  for (size_t i = 0; i < n; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return a.size() == b.size() ? worst : 1.0e9;
}

// --- the swell -----------------------------------------------------------------------------

// The level climbs all the way and the peak is the strike, Swell after the key.
static void test_swell_lands() {
  double worst_ms = 0.0;
  for (float swell : {0.3f, 1.5f, 5.0f}) {
    for (float hz : {110.0f, 220.0f, 659.26f}) {
      device.init(kRate);
      device.set_param(p::kSwell, swell);
      device.note_on(1, hz, 0.7f);
      Stereo out = render(device, swell + 1.0f, kRate);
      const size_t strike = strike_sample(swell);
      double before = 0.0;
      bool climbs = true;
      double least = 1.0e9;
      for (int w = 0; w < 6; ++w) {
        const double level = rms(out.left, strike * w / 6, strike * (w + 1) / 6);
        if (!(level > 1.1 * before)) climbs = false;
        if (w > 0) least = std::min(least, db(level / before));
        before = level;
      }
      std::snprintf(label, sizeof label,
                    "Swell %.1f s at %.0f Hz: each sixth of the swell is louder than the one before (least step %.1f dB)",
                    swell, hz, least);
      EXPECT(climbs, label);
      const double off_ms = 1000.0 * (static_cast<double>(peak_index(out)) - static_cast<double>(strike)) / kRate;
      worst_ms = std::max(worst_ms, std::fabs(off_ms));
      std::snprintf(label, sizeof label, "Swell %.1f s at %.0f Hz: the peak falls on the strike (%.2f ms off)", swell,
                    hz, off_ms);
      EXPECT(std::fabs(off_ms) < 10.0, label);
      EXPECT(std::fabs(static_cast<double>(strike) / kRate - swell) < 0.001, "the strike is within 1 ms of Swell");
    }
  }
  std::printf("swell: the peak is at most %.2f ms from Swell after the key (0.3, 1.5 and 5 s; A2, A3, E5)\n", worst_ms);

  // Out of nothing: the first 20 ms are at least 50 dB under the strike.
  device.init(kRate);
  device.note_on(1, 220.0f, 0.7f);
  Stereo out = render(device, 2.0f, kRate);
  const double start_db = db(both_peak(out, 0, at(0.02)) / both_peak(out));
  std::snprintf(label, sizeof label, "a note comes out of nothing (first 20 ms %.1f dB under the strike)", start_db);
  EXPECT(start_db < -50.0, label);
  // ... and yet a key press is answered: something sounds within 100 ms.
  EXPECT(both_peak(out, 0, at(0.1)) > 1.0e-5, "something sounds within 100 ms of the key");
}

// Tail 0: the note stops dead at the strike, and stopping is not a click.
static void test_stops_dead() {
  double worst_after = -200.0, worst_step = 0.0, worst_kink = 0.0, worst_sudden = 0.0;
  for (int source = 0; source < 4; ++source) {
    for (float hz : {110.0f, 220.0f, 880.0f}) {
      // The same note ringing on: the render without the stop in it. A note
      // takes its level from where Tail stands when it starts, so Tail is
      // opened after the key: the two swells are then the same sample for sample.
      device.init(kRate);
      device.set_param(p::kSource, static_cast<float>(source));
      device.set_param(p::kSwell, 1.0f);
      device.set_param(p::kTail, 0.0f);
      device.note_on(1, hz, 0.7f);
      device.set_param(p::kTail, 1.0f);
      Stereo rings = render(device, 1.5f, kRate);
      device.init(kRate);
      device.set_param(p::kSource, static_cast<float>(source));
      device.set_param(p::kSwell, 1.0f);
      device.set_param(p::kTail, 0.0f);
      device.note_on(1, hz, 0.7f);
      Stereo out = render(device, 1.5f, kRate);
      const size_t strike = strike_sample(1.0f);
      EXPECT(std::equal(out.left.begin(), out.left.begin() + strike, rings.left.begin()),
             "Tail does not change the swell");
      // How much of the ringing note the stop has taken away after 8 samples.
      double gone = 0.0, there = 0.0;
      for (size_t i = strike; i < strike + 8; ++i) {
        gone = std::max(gone, std::fabs(static_cast<double>(out.left[i]) - rings.left[i]));
        there = std::max(there, std::fabs(static_cast<double>(rings.left[i])));
      }
      worst_sudden = std::max(worst_sudden, gone / there);
      const double top = both_peak(out);
      const double after_db = db(both_peak(out, strike + at(0.05), strike + at(0.25)) / top);
      worst_after = std::max(worst_after, after_db);
      // The steps inside the note are those it makes with no stop in it: the
      // ringing note over the 50 ms either side of the strike. (The 50 ms
      // before the strike alone would do for the tone, but the hammer is
      // noise, and its largest step falls before or after by chance.)
      const double inside = both_step(rings, strike - at(0.05), strike + at(0.05));
      const double stop = both_step(out, strike, strike + at(0.05));
      worst_step = std::max(worst_step, stop / inside);
      const double inside_kink = std::max(kink(rings.left, strike - at(0.05), strike + at(0.05)),
                                          kink(rings.right, strike - at(0.05), strike + at(0.05)));
      const double stop_kink = std::max(kink(out.left, strike + 1, strike + at(0.05)), kink(out.right, strike + 1, strike + at(0.05)));
      worst_kink = std::max(worst_kink, stop_kink / inside_kink);
      EXPECT(peak(out.left, strike + at(0.2)) == 0.0 && peak(out.right, strike + at(0.2)) == 0.0,
             "Tail 0: exact silence 200 ms after the strike");
    }
  }
  std::snprintf(label, sizeof label, "Tail 0: 50 ms after the strike the level is 50 dB under the peak (worst %.1f dB)",
                worst_after);
  EXPECT(worst_after < -50.0, label);
  std::snprintf(label, sizeof label,
                "Tail 0: stopping makes no step larger than the steps inside the note (%.2f of them, bend %.2f)",
                worst_step, worst_kink);
  EXPECT(worst_step <= 1.02 && worst_kink <= 1.02, label);
  std::snprintf(label, sizeof label, "Tail 0: the stop comes on gradually (%.2f of the note gone after 8 samples)", worst_sudden);
  EXPECT(worst_sudden < 0.15, label);
  std::printf("tail 0: %.1f dB under the peak 50 ms after the strike; largest step after it %.2f of the largest inside; "
              "%.2f of the note is gone after 8 samples\n",
              worst_after, worst_step, worst_sudden);

  // The same on a soft low pure note with no hammer, where a cut has nothing
  // to hide under: the stop bends the wave no more than twice what the swell does.
  bare(device);
  device.set_param(p::kSource, 3.0f);
  device.set_param(p::kTone, 0.0f);
  device.set_param(p::kSwell, 0.5f);
  device.set_param(p::kTail, 0.0f);
  double worst = 0.0;
  for (int trial = 0; trial < 6; ++trial) {
    bare(device);
    device.set_param(p::kSource, 3.0f);
    device.set_param(p::kTone, 0.0f);
    device.set_param(p::kSwell, 0.5f);
    device.set_param(p::kTail, 0.0f);
    device.note_on(1, 82.41f + 3.1f * static_cast<float>(trial), 0.7f);
    Stereo out = render(device, 0.8f, kRate);
    const size_t strike = strike_sample(0.5f);
    const double inside = kink(out.left, strike - at(0.05), strike);
    const double stop = kink(out.left, strike + 1, strike + at(0.05));
    worst = std::max(worst, stop / inside);
  }
  std::snprintf(label, sizeof label, "Tail 0 on a low pure note: the stop is smooth (bend %.2f of the note's own)", worst);
  EXPECT(worst < 3.0, label);
}

// The upper partials die first forwards, so backwards they arrive last.
static void test_brightens() {
  bare(device);
  device.set_param(p::kSwell, 2.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo out = render(device, 2.5f, kRate);
  const size_t strike = strike_sample(2.0f);
  const double sixth = pitch_near(out.left, 1326.0, kRate, strike - at(0.2), strike);
  const double low = arrival(out.left, 220.0, 20.0, strike);
  const double high = arrival(out.left, sixth, 20.0, strike);
  std::snprintf(label, sizeof label,
                "the sixth partial comes within 20 dB of its strike level later than the fundamental (%.2f s against %.2f s of a 2 s swell)",
                high, low);
  EXPECT(high > low + 0.4, label);
  std::printf("brightening: fundamental within 20 dB at %.2f s, sixth partial (%.1f Hz) at %.2f s of a 2 s swell\n", low,
              sixth, high);
  // The sixth partial against the fundamental, half way and at the strike.
  const double early = db(level_at(out.left, sixth, kRate, strike / 2, strike * 5 / 8) /
                          level_at(out.left, 220.0, kRate, strike / 2, strike * 5 / 8));
  const double late = db(level_at(out.left, sixth, kRate, strike - at(0.05), strike) /
                         level_at(out.left, 220.0, kRate, strike - at(0.05), strike));
  std::snprintf(label, sizeof label,
                "the note brightens into its strike (sixth partial %.1f dB under the fundamental half way, %.1f dB at the strike)",
                -early, -late);
  EXPECT(late > early + 25.0, label);
}

// Tail: the same note ringing on forwards, with the source's own decay.
static void test_tail() {
  // Ring time of the slowest partial at A3, from the source tables.
  const double rings[4] = {11.0 * std::pow(2.0, -0.55), 16.0, 4.5 * std::pow(2.0, -0.45), 20.0};
  const double lowest[4] = {220.0, 110.0, 220.0, 220.0};
  double measured[4];
  for (int source = 0; source < 4; ++source) {
    bare(device);
    device.set_param(p::kSource, static_cast<float>(source));
    device.set_param(p::kSwell, 0.5f);
    device.set_param(p::kTail, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    device.set_param(p::kTone, 0.0f);  // mostly the lowest partial
    Stereo out = render(device, 6.5f, kRate);
    const size_t strike = strike_sample(0.5f);
    double first, second;
    if (source == 3) {
      // The bowl's halves beat at 0.6 Hz: the energy over one whole beat.
      // ... in two windows two whole beats apart.
      const size_t beat = 80000;
      first = rms(out.left, strike + at(1.0), strike + at(1.0) + beat);
      second = rms(out.left, strike + at(1.0) + 2 * beat, strike + at(1.0) + 3 * beat);
      measured[source] = 60.0 * (2.0 / 0.6) / db(first / second);
    } else {
      first = level_at(out.left, lowest[source], kRate, strike + at(1.0), strike + at(1.5));
      second = level_at(out.left, lowest[source], kRate, strike + at(4.0), strike + at(4.5));
      measured[source] = 60.0 * 3.0 / db(first / second);
    }
    std::snprintf(label, sizeof label, "Tail 1, source %d: the lowest partial rings forwards with its own decay (%.2f s to -60 dB, table %.2f s)",
                  source, measured[source], rings[source]);
    EXPECT(std::fabs(measured[source] / rings[source] - 1.0) < 0.08, label);
  }
  std::printf("tail 1: ring time of the lowest partial at A3: piano %.2f s, bell %.2f s, pluck %.2f s, bowl %.2f s\n",
              measured[0], measured[1], measured[2], measured[3]);

  // Half way the ring is a quarter as long (Tail squared), and the highs go first.
  bare(device);
  device.set_param(p::kSwell, 0.5f);
  device.set_param(p::kTail, 0.5f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo half = render(device, 3.0f, kRate);
  const size_t strike = strike_sample(0.5f);
  const double a = tone_level(half.left, 220.0, kRate, strike + at(0.1), strike + at(0.4));
  const double b = tone_level(half.left, 220.0, kRate, strike + at(0.6), strike + at(0.9));
  const double ring = 60.0 * 0.5 / db(a / b);
  std::snprintf(label, sizeof label, "Tail 0.5 rings a quarter as long (%.2f s against %.2f s)", ring, rings[0]);
  EXPECT(std::fabs(ring / (0.25 * rings[0] + 0.0138) - 1.0) < 0.1, label);
  const double third = pitch_near(half.left, 660.8, kRate, strike, strike + at(0.2));
  const double bright_early = db(level_at(half.left, third, kRate, strike, strike + at(0.1)) /
                                 level_at(half.left, 220.0, kRate, strike, strike + at(0.1)));
  const double bright_late = db(level_at(half.left, third, kRate, strike + at(0.8), strike + at(0.9)) /
                                level_at(half.left, 220.0, kRate, strike + at(0.8), strike + at(0.9)));
  std::snprintf(label, sizeof label, "the ring darkens as it decays (third partial %.1f dB under the fundamental, then %.1f dB)",
                -bright_early, -bright_late);
  EXPECT(bright_late < bright_early - 10.0, label);
  // Keys do not damp the ring: the tail is the same held or let go.
  bare(device);
  device.set_param(p::kSwell, 0.5f);
  device.set_param(p::kTail, 0.5f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo let_go = render(device, 0.75f, kRate);
  device.note_off(1);
  let_go = concat(let_go, render(device, 2.25f, kRate));
  EXPECT(max_difference(half, let_go) == 0.0, "the ring after the strike does not depend on the key");
}

// Strike "On release": the note hovers under a held key and lands when it is let go.
static void test_on_release() {
  double worst_ms = 0.0;
  for (float held : {0.1f, 0.6f, 2.5f}) {
    device.init(kRate);
    device.set_param(p::kStrike, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo before = render(device, held, kRate);
    device.note_off(1);
    Stereo after = render(device, 1.0f, kRate);
    const double ms = 1000.0 * static_cast<double>(peak_index(after)) / kRate;
    worst_ms = std::max(worst_ms, ms);
    std::snprintf(label, sizeof label, "On release, key held %.1f s: the strike follows the release within 80 ms (%.1f ms)", held, ms);
    EXPECT(ms < 80.0 && ms > 30.0, label);
    std::snprintf(label, sizeof label, "On release, key held %.1f s: the strike is the loudest moment (%.1f dB over the hold)",
                  held, db(both_peak(after) / both_peak(before)));
    EXPECT(both_peak(after) > 1.5 * both_peak(before), label);
  }
  std::printf("on release: the strike lands at most %.1f ms after the key is let go\n", worst_ms);

  // Held half a minute: it grows, comes to rest under the strike level and stays.
  device.init(kRate);
  device.set_param(p::kStrike, 1.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo held = render(device, 30.0f, kRate);
  device.note_off(1);
  Stereo landing = render(device, 1.0f, kRate);
  const double early = rms(held.left, at(0.5), at(1.0));
  const double middle = rms(held.left, at(18.0), at(22.0));
  const double late = rms(held.left, at(26.0), at(30.0));
  std::snprintf(label, sizeof label,
                "On release, held 30 s: bounded and at rest (peak %.3f, %.1f dB from 20 s to 28 s, strike %.3f)",
                both_peak(held), db(late / middle), both_peak(landing));
  EXPECT(finite(held.left) && middle > 2.0 * early && std::fabs(db(late / middle)) < 1.5 &&
             both_peak(held) < 0.8 * both_peak(landing),
         label);
  std::printf("on release, held 30 s: hold peak %.1f dBFS, strike %.1f dBFS, level drifts %.2f dB over the last 10 s\n",
              db(both_peak(held)), db(both_peak(landing)), db(late / middle));
  // The same strike level as After swell gives.
  device.init(kRate);
  device.note_on(1, 220.0f, 0.7f);
  Stereo timed = render(device, 2.5f, kRate);
  EXPECT(std::fabs(db(both_peak(landing) / both_peak(timed))) < 2.5, "both ways of landing strike as hard");
}

// After swell: the note lands whatever the key does.
static void test_short_note_lands() {
  device.init(kRate);
  device.note_on(1, 220.0f, 0.7f);
  Stereo held = render(device, 3.0f, kRate);
  device.init(kRate);
  device.note_on(1, 220.0f, 0.7f);
  Stereo tapped = render(device, 0.1f, kRate);
  EXPECT(both_peak(tapped) > 1.0e-5, "a 100 ms note makes sound while the key is down");
  device.note_off(1);
  tapped = concat(tapped, render(device, 2.9f, kRate));
  const double off_ms = 1000.0 * (static_cast<double>(peak_index(tapped)) - static_cast<double>(strike_sample(1.5f))) / kRate;
  std::snprintf(label, sizeof label, "After swell: a 100 ms note still lands on time (%.2f ms off)", off_ms);
  EXPECT(std::fabs(off_ms) < 10.0, label);
  EXPECT(max_difference(held, tapped) == 0.0, "After swell: a tapped key gives the same note as a held one");
}

// Ghost: a diffuse wash ahead of the note.
static void test_ghost() {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.set_param(p::kGhost, pass == 0 ? 0.0f : 1.0f);
    device.set_param(p::kSwell, 3.0f);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kShimmer, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    out[pass] = render(device, 3.5f, kRate);
  }
  const size_t strike = strike_sample(3.0f);
  const double early = db(rms(out[1].left, strike / 6, strike / 2) / rms(out[0].left, strike / 6, strike / 2));
  const double late = db(both_peak(out[1], strike - at(0.01), strike + at(0.01)) / both_peak(out[0], strike - at(0.01), strike + at(0.01)));
  std::snprintf(label, sizeof label, "Ghost adds energy early in the swell (%.1f dB) and leaves the strike alone (%.2f dB)", early, late);
  EXPECT(early > 10.0 && std::fabs(late) < 1.0, label);
  const double wide = correlation(out[1].left, out[1].right, strike / 6, strike / 2);
  const double narrow = correlation(out[0].left, out[0].right, strike / 6, strike / 2);
  std::snprintf(label, sizeof label, "the ghost is diffuse: left and right differ (correlation %.2f, %.2f without it)", wide, narrow);
  EXPECT(wide < 0.5 && narrow > 0.8, label);
  // A narrow band on each partial: the fundamental with a few hertz of
  // noise round it, which the note alone does not have, and nothing between
  // the partials.
  auto beside = [&](const Stereo& x) {
    double sum = 0.0;
    for (double off : {4.0, 6.0, 10.0}) {
      const double level = tone_level(x.left, 220.0 + off, kRate, strike / 6, strike / 2);
      sum += level * level / 3.0;
    }
    return std::sqrt(sum) / tone_level(x.left, 220.0, kRate, strike / 6, strike / 2);
  };
  const double between = tone_level(out[1].left, 330.0, kRate, strike / 6, strike / 2) /
                         tone_level(out[1].left, 220.0, kRate, strike / 6, strike / 2);
  std::snprintf(label, sizeof label,
                "the ghost is a narrow band on each partial (4 to 10 Hz off %.1f dB, %.1f dB without it; between partials %.1f dB)",
                db(beside(out[1])), db(beside(out[0])), db(between));
  EXPECT(beside(out[1]) > 0.03 && beside(out[1]) > 10.0 * beside(out[0]) && between < 0.01, label);
  // The whole still climbs.
  double before = 0.0;
  bool climbs = true;
  for (int w = 0; w < 6; ++w) {
    const double level = rms(out[1].left, strike * w / 6, strike * (w + 1) / 6);
    if (!(level > before)) climbs = false;
    before = level;
  }
  EXPECT(climbs, "with the ghost at full the level still climbs through the swell");
  std::printf("ghost: +%.1f dB in the first half of the swell, strike %.2f dB, left/right correlation %.2f\n", early, late, wide);
}

// Rise: how late the sound arrives.
static void test_rise() {
  double half[3];
  int index = 0;
  for (float rise : {0.0f, 0.5f, 1.0f}) {
    bare(device);
    device.set_param(p::kRise, rise);
    device.set_param(p::kSwell, 2.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 2.2f, kRate);
    const size_t strike = strike_sample(2.0f);
    // The first 20 ms window to reach half the level of the last one.
    const size_t window = at(0.02);
    const double top = rms(out.left, strike - window, strike);
    half[index] = 0.0;
    for (size_t from = 0; from + window <= strike; from += window / 2) {
      if (rms(out.left, from, from + window) >= 0.5 * top) {
        half[index] = static_cast<double>(from + window / 2) / kRate;
        break;
      }
    }
    ++index;
  }
  std::snprintf(label, sizeof label, "Rise moves the time the note reaches half level (%.2f, %.2f and %.2f s of a 2 s swell)",
                half[0], half[1], half[2]);
  EXPECT(half[0] > 0.3 && half[1] > half[0] + 0.15 && half[2] > half[1] + 0.07 && half[2] < 2.0, label);
  std::printf("rise: half level at %.2f s (Rise 0), %.2f s (0.5), %.2f s (1) of a 2 s swell\n", half[0], half[1], half[2]);
}

// It plays the note it is asked for, into the strike and out of it.
static void test_pitch() {
  double worst = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (int source = 0; source < 3; ++source) {
      for (float hz : {55.0f, 110.0f, 220.0f, 440.0f, 880.0f, 1760.0f, 3520.0f}) {
        bare(device, rate);
        device.set_param(p::kSource, static_cast<float>(source));
        device.set_param(p::kSwell, 1.0f);
        device.set_param(p::kTail, 1.0f);
        device.note_on(1, hz, 0.7f);
        Stereo out = render(device, 2.0f, rate);
        const size_t strike = strike_sample(1.0f, rate);
        const double before = pitch_near(out.left, hz, rate, strike - at(0.4, rate), strike);
        const double after = pitch_near(out.left, hz, rate, strike, strike + at(0.9, rate));
        const double error = std::max(std::fabs(cents(before, hz)), std::fabs(cents(after, hz)));
        worst = std::max(worst, error);
        if (error >= 3.0) {
          std::snprintf(label, sizeof label, "source %d at %.0f Hz and %.0f Hz rate: %.2f and %.2f cents off", source, hz,
                        rate, cents(before, hz), cents(after, hz));
          EXPECT(false, label);
        }
      }
    }
  }
  std::snprintf(label, sizeof label, "piano, bell and pluck: the played note is within 3 cents at the strike (worst %.2f cents)", worst);
  EXPECT(worst < 3.0, label);
  std::printf("pitch: worst %.2f cents for piano, bell and pluck, seven notes (A1 to A7), three sample rates\n", worst);

  // The bowl's lowest mode is a pair that beats, so its pitch wavers by
  // nature. Read over two whole beats, long enough to tell the halves apart,
  // the stronger half is under 3 cents from the note and the pair straddles it.
  double worst_bowl = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (float hz : {110.0f, 440.0f, 1760.0f}) {
      bare(device, rate);
      device.set_param(p::kSource, 3.0f);
      device.set_param(p::kSwell, 0.5f);
      device.set_param(p::kTail, 1.0f);
      device.note_on(1, hz, 0.7f);
      const double apart = 0.6 * std::min(2.0, std::max(0.12, static_cast<double>(hz) / 220.0));
      const float seconds = static_cast<float>(2.0 / apart);
      Stereo out = render(device, 0.6f + seconds, rate);
      const size_t strike = strike_sample(0.5f, rate);
      const double strong = pitch_near(out.left, hz, rate, strike, strike + at(seconds, rate), 12.0);
      worst_bowl = std::max(worst_bowl, std::fabs(cents(strong, hz)));
      const double low = level_at(out.left, hz - 0.4 * apart, rate, strike, strike + at(seconds, rate));
      const double high = level_at(out.left, hz + 0.6 * apart, rate, strike, strike + at(seconds, rate));
      std::snprintf(label, sizeof label, "bowl at %.0f Hz: two halves %.2f Hz apart, the lower the stronger (%.3f and %.3f)",
                    hz, apart, low, high);
      EXPECT(low > 1.2 * high && high > 0.4 * low, label);
    }
  }
  std::snprintf(label, sizeof label, "bowl: the stronger half of the lowest mode is within 3 cents of the note (worst %.2f cents)", worst_bowl);
  EXPECT(worst_bowl < 3.0, label);
  std::printf("pitch: bowl, stronger half of the beating pair %.2f cents from the note at worst\n", worst_bowl);
}

// --- the sources ---------------------------------------------------------------------------

static void test_sources() {
  Stereo out[4];
  for (int source = 0; source < 4; ++source) {
    bare(device);
    device.set_param(p::kSource, static_cast<float>(source));
    device.set_param(p::kSwell, 0.5f);
    device.set_param(p::kTail, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    out[source] = render(device, 4.5f, kRate);
  }
  const size_t strike = strike_sample(0.5f);
  const size_t from = strike, to = strike + at(0.5);
  // Bell: a hum an octave down and a minor third over the note.
  const double prime = level_at(out[1].left, 220.0, kRate, from, to);
  const double hum = level_at(out[1].left, 110.0, kRate, from, to);
  const double tierce = level_at(out[1].left, 264.0, kRate, from, to);
  std::snprintf(label, sizeof label, "bell: hum an octave down and a minor third up (%.1f and %.1f dB against the note)",
                db(hum / prime), db(tierce / prime));
  EXPECT(hum > 0.2 * prime && tierce > 0.4 * prime, label);
  EXPECT(level_at(out[2].left, 264.0, kRate, from, to) < 0.01 * level_at(out[2].left, 220.0, kRate, from, to),
         "pluck: nothing at the minor third");
  // Piano: stiff, so the sixth partial is sharp of six times the note; the plucked string is not.
  const double stiff = cents(pitch_near(out[0].left, 1320.0, kRate, from, to), 1320.0);
  const double slack = cents(pitch_near(out[2].left, 1320.0, kRate, from, strike + at(0.1)), 1320.0);
  std::snprintf(label, sizeof label, "piano: the sixth partial is %.1f cents sharp; pluck: %.1f cents", stiff, slack);
  EXPECT(stiff > 5.0 && stiff < 14.0 && std::fabs(slack) < 1.5, label);
  // Pluck: the highs are gone at once; the piano keeps them longer.
  auto sixth_after = [&](int source, double hz) {
    return db(level_at(out[source].left, hz, kRate, strike + at(0.3), strike + at(0.4)) /
              level_at(out[source].left, hz, kRate, strike, strike + at(0.1)));
  };
  const double piano_drop = sixth_after(0, 1320.0 * std::pow(2.0, stiff / 1200.0));
  const double pluck_drop = sixth_after(2, 1320.0);
  std::snprintf(label, sizeof label, "the sixth partial 0.3 s after the strike: piano %.1f dB, pluck %.1f dB", piano_drop, pluck_drop);
  EXPECT(pluck_drop < piano_drop - 10.0 && piano_drop > -20.0, label);
  // Bowl: the lowest mode beats (its level comes back up); the piano's only falls.
  auto comes_back = [&](int source) {
    double rise = 0.0, before = 0.0;
    for (size_t start = strike + at(0.1); start + at(0.2) <= out[source].size(); start += at(0.1)) {
      const double level = db(level_at(out[source].left, 220.0, kRate, start, start + at(0.2)));
      if (before != 0.0) rise = std::max(rise, level - before);
      before = level;
    }
    return rise;
  };
  const double bowl_rise = comes_back(3), piano_rise = comes_back(0);
  std::snprintf(label, sizeof label, "bowl: the lowest mode beats (comes back up %.1f dB in 0.1 s; piano %.2f dB)", bowl_rise, piano_rise);
  EXPECT(bowl_rise > 1.0 && piano_rise < 0.1, label);
  std::printf("sources: bell hum %.1f dB, minor third %.1f dB; piano sixth partial +%.1f cents, pluck %+.1f; bowl beats %.1f dB\n",
              db(hum / prime), db(tierce / prime), stiff, slack, bowl_rise);

  // A low string still has a top: something above 2 kHz at the strike.
  bare(device);
  device.set_param(p::kSwell, 0.5f);
  device.note_on(1, 55.0f, 0.7f);
  device.set_param(p::kTail, 1.0f);
  Stereo low = render(device, 0.6f, kRate);
  const size_t low_strike = strike_sample(0.5f);
  double top = 0.0, top_hz = 0.0;
  for (double hz = 2000.0; hz < 7500.0; hz += 5.0) {
    const double level = level_at(low.left, hz, kRate, low_strike, low_strike + at(0.04));
    if (level > top) {
      top = level;
      top_hz = hz;
    }
  }
  const double fundamental = level_at(low.left, 55.0, kRate, low_strike, low_strike + at(0.04));
  std::snprintf(label, sizeof label, "A1 on the piano has partials above 2 kHz (strongest at %.0f Hz, %.1f dB under the fundamental)",
                top_hz, db(fundamental / top));
  EXPECT(top > 0.01 * fundamental, label);
}

// --- the knobs -----------------------------------------------------------------------------

// The mean level between the bowl's partials: the hammer's noise, with the
// tone out of the way.
static double between_partials(const std::vector<float>& x, float rate, size_t from, size_t to) {
  static const double kModes[] = {220.0, 609.4, 1137.4, 1790.8, 2560.8, 3432.0};
  double sum = 0.0;
  int count = 0;
  for (double hz = 500.0; hz <= 2500.0; hz += 25.0) {
    bool near = false;
    for (double mode : kModes) near = near || std::fabs(hz - mode) < 90.0;
    if (near) continue;
    const double level = level_at(x, hz, rate, from, to);
    sum += level * level;
    ++count;
  }
  return std::sqrt(sum / count);
}

static void test_snap() {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    bare(device);
    device.set_param(p::kSource, 3.0f);
    device.set_param(p::kSnap, pass == 0 ? 0.0f : 1.0f);
    device.set_param(p::kSwell, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    out[pass] = render(device, 1.5f, kRate);
  }
  const size_t strike = strike_sample(1.0f);
  const double hammer = between_partials(out[1].left, kRate, strike - at(0.03), strike);
  const double none = between_partials(out[0].left, kRate, strike - at(0.03), strike);
  const double earlier = between_partials(out[1].left, kRate, strike - at(0.13), strike - at(0.1));
  const double later = between_partials(out[1].left, kRate, strike + at(0.02), strike + at(0.05));
  std::snprintf(label, sizeof label,
                "Snap: a noise burst rises into the strike (%.1f dB over no Snap; %.1f dB 100 ms earlier, %.1f dB 20 ms after)",
                db(hammer / none), db(earlier / hammer), db(later / hammer));
  EXPECT(hammer > 6.0 * none && earlier < 0.04 * hammer && later < 0.12 * hammer, label);
  // The last surge: the fundamental's final 12 ms against 60 ms before.
  auto surge = [&](const Stereo& x) {
    return db(level_at(x.left, 220.0, kRate, strike - at(0.014), strike) /
              level_at(x.left, 220.0, kRate, strike - at(0.074), strike - at(0.06)));
  };
  std::snprintf(label, sizeof label, "Snap: the note surges into the strike (%.1f dB in the last 60 ms, %.1f dB without)",
                surge(out[1]), surge(out[0]));
  EXPECT(surge(out[1]) > surge(out[0]) + 3.0, label);
  // Louder at the strike, by the level of the 6 ms round it: where the one
  // tallest sample falls is the hammer noise's chance.
  const double louder = rms(out[1].left, strike - at(0.003), strike + at(0.003)) /
                        rms(out[0].left, strike - at(0.003), strike + at(0.003));
  std::snprintf(label, sizeof label, "Snap makes the strike louder (%.1f dB over the 6 ms round it)", db(louder));
  EXPECT(louder > 1.25, label);
  // The same noise against the tone at every sample rate.
  double ratio[2];
  int index = 0;
  for (float rate : {48000.0f, 96000.0f}) {
    bare(device, rate);
    device.set_param(p::kSource, 3.0f);
    device.set_param(p::kSnap, 1.0f);
    device.set_param(p::kSwell, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo x = render(device, 1.2f, rate);
    const size_t s = strike_sample(1.0f, rate);
    ratio[index++] = db(between_partials(x.left, rate, s - at(0.03, rate), s) /
                        level_at(x.left, 220.0, rate, s - at(0.03, rate), s));
  }
  std::snprintf(label, sizeof label, "the hammer is as loud against the note at 96 kHz as at 48 kHz (%.1f and %.1f dB)", ratio[1], ratio[0]);
  EXPECT(std::fabs(ratio[1] - ratio[0]) < 1.5, label);
  // Every key has a hammer of its own. Four keys that strike together are
  // each turned down 3 dB (see gather), so four hammers of their own make
  // 1.4 times the noise of one, and one noise heard four times over 2.8 times.
  bare(device);
  device.set_param(p::kSource, 3.0f);
  device.set_param(p::kSnap, 1.0f);
  device.set_param(p::kSwell, 1.0f);
  for (int n = 0; n < 4; ++n) device.note_on(n, 220.0f, 0.7f);
  Stereo four = render(device, 1.2f, kRate);
  const double together = between_partials(four.left, kRate, strike - at(0.03), strike) / hammer;
  std::snprintf(label, sizeof label, "four keys on one pitch make %.1f dB more hammer noise than one (3 dB if each has its own, 9 if they share one)",
                db(together));
  EXPECT(together > 1.0 && together < 1.8, label);
  std::printf("snap: hammer noise %.1f dB over none, %.1f dB 100 ms before the strike; surge %.1f dB (%.1f without); 96 kHz %+.1f dB; four keys %+.1f dB\n",
              db(hammer / none), db(earlier / hammer), surge(out[1]), surge(out[0]), ratio[1] - ratio[0], db(together));
}

static void test_tone() {
  double bright[3], level[3];
  int index = 0;
  for (float tone : {0.0f, 0.5f, 1.0f}) {
    bare(device);
    device.set_param(p::kTone, tone);
    device.set_param(p::kSwell, 0.5f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 0.7f, kRate);
    const size_t strike = strike_sample(0.5f);
    const double sixth = pitch_near(out.left, 1326.5, kRate, strike - at(0.03), strike, 10.0);
    bright[index] = db(level_at(out.left, sixth, kRate, strike - at(0.03), strike) /
                       level_at(out.left, 220.0, kRate, strike - at(0.03), strike));
    level[index] = db(both_peak(out));
    ++index;
  }
  std::snprintf(label, sizeof label,
                "Tone tilts the overtones (sixth partial %.1f, %.1f, %.1f dB against the fundamental; strike %.1f, %.1f, %.1f dBFS)",
                bright[0], bright[1], bright[2], level[0], level[1], level[2]);
  EXPECT(bright[1] > bright[0] + 10.0 && bright[2] > bright[1] + 8.0 && std::fabs(level[0] - level[1]) < 3.0 &&
             std::fabs(level[2] - level[1]) < 3.0,
         label);
  std::printf("tone: sixth partial %.1f / %.1f / %.1f dB against the fundamental at Tone 0 / 0.5 / 1\n", bright[0], bright[1], bright[2]);
}

// The pitch of the `hz` partial in consecutive 100 ms windows after the strike, in cents.
static std::vector<double> pitch_track(const Stereo& x, double hz, size_t from, int windows) {
  std::vector<double> track;
  for (int w = 0; w < windows; ++w) {
    const size_t start = from + at(0.1) * static_cast<size_t>(w);
    track.push_back(cents(pitch_near(x.left, hz, kRate, start, start + at(0.1)), hz));
  }
  return track;
}

static void test_wobble() {
  const size_t strike = strike_sample(0.5f);
  auto played = [&](float wobble) {
    bare(device);
    device.set_param(p::kWobble, wobble);
    device.set_param(p::kSwell, 0.5f);
    device.set_param(p::kTail, 1.0f);
    device.set_param(p::kTone, 0.0f);
    device.note_on(1, 440.0f, 0.7f);
    device.note_on(2, 1108.73f, 0.7f);
    return render(device, 4.6f, kRate);
  };
  auto spread = [](const std::vector<double>& track, double* mean) {
    double lo = 1.0e9, hi = -1.0e9, sum = 0.0;
    for (double c : track) {
      lo = std::min(lo, c);
      hi = std::max(hi, c);
      sum += c;
    }
    *mean = sum / static_cast<double>(track.size());
    return hi - lo;
  };
  double mean = 0.0;
  Stereo steady = played(0.0f);
  const double still = spread(pitch_track(steady, 440.0, strike, 40), &mean);
  Stereo usual = played(p::kParamDefault[p::kWobble]);
  double usual_mean = 0.0;
  const double usual_spread = spread(pitch_track(usual, 440.0, strike, 40), &usual_mean);
  Stereo full = played(1.0f);
  const std::vector<double> low = pitch_track(full, 440.0, strike, 40);
  const std::vector<double> high = pitch_track(full, 1108.73, strike, 40);
  double full_mean = 0.0;
  const double wide = spread(low, &full_mean);
  int turns = 0;
  double together = 0.0, low_power = 0.0, high_power = 0.0;
  for (size_t i = 0; i < low.size(); ++i) {
    if (i > 0 && (low[i] > 0.0) != (low[i - 1] > 0.0)) ++turns;
    together += low[i] * high[i];
    low_power += low[i] * low[i];
    high_power += high[i] * high[i];
  }
  together /= std::sqrt(low_power * high_power);
  std::snprintf(label, sizeof label,
                "Wobble: the pitch drifts %.1f cents peak to peak at full (%.2f at 0, %.1f at the default), slowly (%d turns in 4 s), about the note (mean %.2f cents)",
                wide, still, usual_spread, turns, full_mean);
  EXPECT(wide > 20.0 && wide < 40.0 && still < 0.3 && usual_spread < 5.0 && usual_spread > 0.5 && turns >= 2 &&
             turns <= 12 && std::fabs(full_mean) < 5.0 && std::fabs(usual_mean) < 1.0,
         label);
  std::snprintf(label, sizeof label, "Wobble moves every note together (two notes' pitch tracks correlate %.3f)", together);
  EXPECT(together > 0.95, label);
  std::printf("wobble: %.1f cents peak to peak at 1, %.1f at the default, %.2f at 0; two notes move together (%.3f)\n", wide,
              usual_spread, still, together);
}

// Dips of 10 dB or more in the level of the `hz` partial over 1.5 s after the strike.
static int beats(const Stereo& x, double hz, size_t strike) {
  std::vector<double> level;
  for (size_t start = strike + at(0.05); start + at(0.04) <= strike + at(1.55); start += at(0.01)) {
    level.push_back(db(level_at(x.left, hz, kRate, start, start + at(0.04))));
  }
  int dips = 0;
  bool low = false;
  double high = level[0];
  for (double value : level) {
    if (!low && value < high - 10.0) {
      low = true;
      ++dips;
    } else if (low && value > high - 5.0) {
      low = false;
    }
    high = std::max(high - 0.15, value);  // follows the decay down, 15 dB a second
  }
  return dips;
}

static void test_shimmer() {
  const size_t strike = strike_sample(0.5f);
  auto played = [&](float shimmer, float width) {
    bare(device);
    device.set_param(p::kShimmer, shimmer);
    device.set_param(p::kWidth, width);
    device.set_param(p::kSwell, 0.5f);
    device.set_param(p::kTail, 1.0f);
    device.set_param(p::kTone, 0.3f);
    device.note_on(1, 440.0f, 0.7f);
    return render(device, 2.2f, kRate);
  };
  Stereo plain = played(0.0f, 0.0f);
  Stereo mono = played(1.0f, 0.0f);
  const int none = beats(plain, 440.0, strike);
  const int first = beats(mono, 440.0, strike);
  const int second = beats(mono, 880.0, strike);
  std::snprintf(label, sizeof label,
                "Shimmer: the two copies beat, the octave twice as fast (%d dips in 1.5 s at the note, %d at its octave, %d without)",
                first, second, none);
  EXPECT(none == 0 && first >= 4 && first <= 7 && second >= 2 * first - 2 && second <= 2 * first + 2, label);
  // The copies sit either side of the note, 14 cents apart.
  const double under = level_at(mono.left, 440.0 * std::pow(2.0, -6.9 / 1200.0), kRate, strike, strike + at(1.5));
  const double over = level_at(mono.left, 440.0 * std::pow(2.0, 6.9 / 1200.0), kRate, strike, strike + at(1.5));
  const double on = level_at(plain.left, 440.0, kRate, strike, strike + at(1.5));
  std::snprintf(label, sizeof label, "Shimmer: a copy 7 cents under and one 7 cents over, each half the note (%.1f and %.1f dB)",
                db(under / on), db(over / on));
  EXPECT(std::fabs(db(under / over)) < 1.0 && db(under / on) > -9.0 && db(under / on) < -4.0, label);
  EXPECT(mono.left == mono.right, "Width 0 is mono, second copy and all");
  Stereo wide = played(1.0f, 1.0f);
  const double apart = correlation(wide.left, wide.right, strike, strike + at(1.5));
  std::snprintf(label, sizeof label, "Width puts the copies either side (left/right correlation %.2f)", apart);
  EXPECT(apart < 0.7, label);
  std::printf("shimmer: %d beats in 1.5 s at A4, %d at its octave; copies %.1f and %.1f dB; correlation %.2f at Width 1\n", first,
              second, db(under / on), db(over / on), apart);

  // Width alone spreads the overtones; Width 0 is mono whatever else is on.
  device.init(kRate);
  device.set_param(p::kWidth, 0.0f);
  device.set_param(p::kGhost, 1.0f);
  device.set_param(p::kShimmer, 1.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo centre = render(device, 2.0f, kRate);
  EXPECT(centre.left == centre.right, "Width 0 is mono with the ghost and the second copy at full");
  bare(device);
  device.set_param(p::kWidth, 1.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo spread = render(device, 2.0f, kRate);
  const double side = db(rms(spread.left, at(1.3), at(1.6)) / rms(spread.right, at(1.3), at(1.6)));
  const double image = correlation(spread.left, spread.right, at(1.3), at(1.6));
  std::snprintf(label, sizeof label, "Width spreads the overtones without tilting the image (correlation %.2f, left over right %.1f dB)", image, side);
  EXPECT(image < 0.98 && image > 0.3 && std::fabs(side) < 2.0, label);
}

// --- level -----------------------------------------------------------------------------------

static void test_levels() {
  double lowest = 0.0, highest = -200.0;
  for (int source = 0; source < 4; ++source) {
    for (float hz : {27.5f, 55.0f, 110.0f, 220.0f, 440.0f, 880.0f, 1760.0f, 4186.0f}) {
      device.init(kRate);
      device.set_param(p::kSource, static_cast<float>(source));
      device.note_on(1, hz, 0.7f);
      Stereo out = render(device, 2.0f, kRate);
      const double level = db(both_peak(out));
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
      if (!(level > -24.0 && level < -10.0)) {
        std::snprintf(label, sizeof label, "source %d at %.1f Hz: the strike peaks at %.1f dBFS", source, hz, level);
        EXPECT(false, label);
      }
      const double off_ms = 1000.0 * (static_cast<double>(peak_index(out)) - static_cast<double>(strike_sample(1.5f))) / kRate;
      if (std::fabs(off_ms) > 25.0) {
        std::snprintf(label, sizeof label, "source %d at %.1f Hz: the peak is %.1f ms from the strike", source, hz, off_ms);
        EXPECT(false, label);
      }
    }
  }
  std::snprintf(label, sizeof label, "one key at gain 0.7 strikes between -24 and -10 dBFS (%.1f to %.1f over four sources, A0 to C8)",
                lowest, highest);
  EXPECT(lowest > -24.0 && highest < -10.0, label);
  std::printf("level: one key at gain 0.7 strikes at %.1f to %.1f dBFS (four sources, A0 to C8)\n", lowest, highest);

  // Velocity.
  device.init(kRate);
  device.note_on(1, 220.0f, 1.0f);
  Stereo loud = render(device, 2.0f, kRate);
  device.init(kRate);
  device.note_on(1, 220.0f, 0.3f);
  Stereo soft = render(device, 2.0f, kRate);
  std::snprintf(label, sizeof label, "a soft key strikes softer (%.1f dB under a hard one)", db(both_peak(loud) / both_peak(soft)));
  EXPECT(both_peak(soft) < 0.4 * both_peak(loud) && both_peak(soft) > 0.05 * both_peak(loud), label);

  // Ten keys landing on the same sample stay under the knee.
  double most = 0.0;
  for (int source = 0; source < 4; ++source) {
    for (int mode = 0; mode < 2; ++mode) {
      device.init(kRate);
      device.set_param(p::kSource, static_cast<float>(source));
      device.set_param(p::kStrike, static_cast<float>(mode));
      for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      for (int n = 0; n < 10; ++n) device.note_off(n);
      out = concat(out, render(device, 1.0f, kRate));
      most = std::max(most, both_peak(out));
    }
  }
  std::snprintf(label, sizeof label, "ten held keys stay under the clip knee (peak %.3f)", most);
  EXPECT(most < 0.5, label);
  std::printf("level: ten keys landing together peak at %.3f; a key at gain 0.3 is %.1f dB under one at 1.0\n", most,
              db(both_peak(loud) / both_peak(soft)));

  // The output ends in the soft clip: a pile of hard strikes at full volume
  // comes out past the knee and under full scale.
  device.init(kRate);
  device.set_param(p::kVolume, 6.0f);
  device.set_param(p::kSnap, 1.0f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 1.0f);
  Stereo pile = render(device, 2.0f, kRate);
  std::snprintf(label, sizeof label, "twelve hard strikes at +6 dB are rounded off by the soft clip (peak %.3f)", both_peak(pile));
  EXPECT(both_peak(pile) > 0.6 && both_peak(pile) <= 1.0, label);

  // Notes outside the keyboard are played at its ends.
  bare(device);
  device.set_param(p::kSwell, 0.3f);
  device.set_param(p::kTail, 1.0f);
  device.note_on(1, 30000.0f, 0.7f);
  Stereo top = render(device, 0.8f, kRate);
  const double top_hz = pitch_near(top.left, 8000.0, kRate, at(0.3), at(0.7));
  EXPECT(std::fabs(cents(top_hz, 8000.0)) < 3.0 && both_peak(top) > 0.01, "a note above the range plays at 8 kHz");
}

// --- the second check's findings ----------------------------------------------------------------

// RMS of both channels over [from, to).
static double both_rms(const Stereo& x, size_t from, size_t to) {
  to = std::min(to, x.size());
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) {
    sum += 0.5 * (static_cast<double>(x.left[i]) * x.left[i] + static_cast<double>(x.right[i]) * x.right[i]);
  }
  return std::sqrt(sum / static_cast<double>(std::max<size_t>(1, to - from)));
}

// The loudest 400 ms of a render, RMS over both channels, in dB.
static double loudest(const Stereo& x, float rate = kRate) {
  const size_t n = at(0.4, rate);
  double sum = 0.0, best = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    sum += 0.5 * (static_cast<double>(x.left[i]) * x.left[i] + static_cast<double>(x.right[i]) * x.right[i]);
    if (i >= n) sum -= 0.5 * (static_cast<double>(x.left[i - n]) * x.left[i - n] + static_cast<double>(x.right[i - n]) * x.right[i - n]);
    if (i + 1 >= n) best = std::max(best, sum);
  }
  return db(std::sqrt(best / static_cast<double>(n)));
}

// Every sound the knobs can make is as loud: the loudest 400 ms of one note
// across Source, Swell, Tail and Snap, and what the ceiling on the strike
// leaves of a note that is all strike.
static void test_loudness() {
  double lowest = 0.0, highest = -200.0;
  for (int source = 0; source < 4; ++source) {
    for (float swell : {0.6f, 1.5f, 6.0f}) {
      for (float tail : {0.45f, 1.0f}) {
        for (float snap : {0.0f, 0.4f}) {
          device.init(kRate);
          device.set_param(p::kSource, static_cast<float>(source));
          device.set_param(p::kSwell, swell);
          device.set_param(p::kTail, tail);
          device.set_param(p::kSnap, snap);
          device.note_on(1, 220.0f, 0.8f);
          const double level = loudest(render(device, swell + 1.5f, kRate));
          lowest = std::min(lowest, level);
          highest = std::max(highest, level);
        }
      }
    }
  }
  std::snprintf(label, sizeof label,
                "one note is as loud whatever the source, Swell, Tail and Snap (loudest 400 ms %.1f to %.1f dBFS)", lowest, highest);
  EXPECT(highest - lowest < 2.0, label);
  // All strike and nothing else: 0.15 s in, stopped dead, Snap at 1. The
  // strike stays under its ceiling and the note is at most 8 dB softer.
  device.init(kRate);
  device.note_on(1, 220.0f, 0.8f);
  const double plain = db(both_peak(render(device, 2.0f, kRate)));
  double tallest = -200.0, softest = 0.0;
  for (int source = 0; source < 4; ++source) {
    device.init(kRate);
    device.set_param(p::kSource, static_cast<float>(source));
    device.set_param(p::kSwell, 0.15f);
    device.set_param(p::kTail, 0.0f);
    device.set_param(p::kSnap, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    tallest = std::max(tallest, db(both_peak(out)));
    softest = std::min(softest, loudest(out));
  }
  std::snprintf(label, sizeof label,
                "a note that is all strike: the strike is at most %.1f dB over the default's and the note %.1f dB under the rest",
                tallest - plain, lowest - softest);
  EXPECT(tallest - plain < 7.0 && lowest - softest < 8.0 && lowest - softest > 1.0, label);
  std::printf("loudness: one note %.1f to %.1f dBFS over 48 settings; all strike: %+.1f dB tall, %.1f dB softer\n", lowest, highest,
              tallest - plain, lowest - softest);
}

// Notes that strike together share the peak, and the instrument sits in the
// middle between the speakers.
static void test_together() {
  auto chord = [](int keys, int mode, float gain) {
    device.init(kRate);
    device.set_param(p::kStrike, static_cast<float>(mode));
    device.set_param(p::kSwell, 1.0f);
    for (int n = 0; n < keys; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 5) / 12.0f), gain);
    Stereo out = render(device, 0.7f, kRate);
    for (int n = 0; n < keys; ++n) device.note_off(n);
    return concat(out, render(device, 0.6f, kRate));
  };
  for (int mode = 0; mode < 2; ++mode) {
    const size_t strike = mode == 0 ? strike_sample(1.0f) : at(0.7) + at(0.06);
    const Stereo one = chord(1, mode, 0.8f), four = chord(4, mode, 0.8f), eight = chord(8, mode, 1.0f);
    const double over = db(both_rms(four, strike - at(0.03), strike + at(0.05)) / both_rms(one, strike - at(0.03), strike + at(0.05)));
    std::snprintf(label, sizeof label, "strike mode %d: four keys land %.1f dB over one (3 shared, 6 if each kept its own)", mode, over);
    EXPECT(over > 1.5 && over < 4.5, label);
    std::snprintf(label, sizeof label, "strike mode %d: eight keys at full velocity land at %.1f dBFS", mode, db(both_peak(eight)));
    EXPECT(both_peak(eight) < 0.45, label);
    if (mode == 0) std::printf("together: four keys %+.1f dB over one, eight at full velocity %.1f dBFS", over, db(both_peak(eight)));
    else std::printf("; on release %+.1f dB and %.1f dBFS\n", over, db(both_peak(eight)));
  }
  // A key struck 60 ms after another strikes on its own and keeps its level.
  device.init(kRate);
  device.set_param(p::kSwell, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo alone = render(device, 1.3f, kRate);
  device.init(kRate);
  device.set_param(p::kSwell, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo first = render(device, 0.06f, kRate);
  device.note_on(2, 587.3f, 0.8f);
  first = concat(first, render(device, 1.24f, kRate));
  const size_t strike = strike_sample(1.0f);
  const double kept = db(level_at(first.left, 220.0, kRate, strike - at(0.03), strike) /
                         level_at(alone.left, 220.0, kRate, strike - at(0.03), strike));
  std::snprintf(label, sizeof label, "a key struck 60 ms later leaves the first one's strike as it was (%.2f dB)", kept);
  EXPECT(std::fabs(kept) < 0.3, label);
  // In the middle: one note of each source, left against right.
  double lean = 0.0;
  for (int source = 0; source < 4; ++source) {
    for (float shimmer : {0.2f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kSource, static_cast<float>(source));
      device.set_param(p::kShimmer, shimmer);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 2.5f, kRate);
      const double side = db(rms(out.left) / rms(out.right));
      if (std::fabs(side) > std::fabs(lean)) lean = side;
    }
  }
  std::snprintf(label, sizeof label, "one note sits in the middle (left %.2f dB over right at worst)", lean);
  EXPECT(std::fabs(lean) < 1.0, label);
}

// On release the strike is not known when the note begins, yet it is as
// strong whenever the key is let go: whatever beats inside the note (the
// bowl's pairs, the two copies of Shimmer) meets on it. And the hover under a
// held key stays well under the strike however shallow Rise is.
static void test_release_strikes() {
  double widest = 0.0, nearest = -200.0;
  for (int source = 0; source < 4; ++source) {
    for (float rise : {0.0f, 0.5f}) {
      double lowest = 200.0, highest = -200.0;
      for (int n = 0; n < 14; ++n) {
        const float hold = 1.8f + 0.2137f * static_cast<float>(n);
        device.init(kRate);
        device.set_param(p::kSource, static_cast<float>(source));
        device.set_param(p::kStrike, 1.0f);
        device.set_param(p::kRise, rise);
        device.set_param(p::kSwell, 1.5f);
        device.set_param(p::kShimmer, 1.0f);
        device.set_param(p::kGhost, 0.0f);
        device.set_param(p::kTail, 0.6f);
        device.note_on(1, 220.0f, 0.8f);
        Stereo out = render(device, hold, kRate);
        device.note_off(1);
        out = concat(out, render(device, 0.3f, kRate));
        const size_t strike = out.size() - at(0.3) + at(0.06);
        const double level = db(both_rms(out, strike, strike + at(0.03)));
        lowest = std::min(lowest, level);
        highest = std::max(highest, level);
        double hover = -200.0;
        for (size_t from = at(0.5); from + at(0.03) < strike - at(0.06); from += at(0.015)) {
          hover = std::max(hover, db(both_rms(out, from, from + at(0.03))));
        }
        nearest = std::max(nearest, hover - level);
      }
      widest = std::max(widest, highest - lowest);
    }
  }
  std::snprintf(label, sizeof label,
                "on release: the strike is as strong whenever the key is let go (%.1f dB between 14 hold times, four sources, Shimmer 1)",
                widest);
  EXPECT(widest < 2.5, label);
  std::snprintf(label, sizeof label, "on release: the loudest moment of the hover is %.1f dB under the strike", -nearest);
  EXPECT(nearest < -5.0, label);
  std::printf("on release: strikes within %.1f dB over 14 hold times; the hover at most %.1f dB under its strike\n", widest, -nearest);

  // A key struck when every voice is taken and let go inside the 2 ms the
  // steal takes: the note still lands (after its swell, or 60 ms after the
  // release), as hard as one that was held.
  for (int mode = 0; mode < 2; ++mode) {
    double level[2] = {0.0, 0.0};
    size_t where[2] = {0, 0};
    for (int quick = 0; quick < 2; ++quick) {
      device.init(kRate);
      device.set_param(p::kStrike, static_cast<float>(mode));
      device.set_param(p::kSwell, 0.5f);
      device.set_param(p::kGhost, 0.0f);
      device.set_param(p::kTail, 1.0f);
      for (int n = 0; n < Rewind::kMaxVoices; ++n) {
        device.note_on(n, 100.0f * std::pow(2.0f, static_cast<float>(n) * 0.075f), 0.05f);
      }
      render(device, 1.5f, kRate);
      device.note_on(50, 1760.0f, 0.9f);
      Stereo out = render(device, quick ? 0.001f : 0.2f, kRate);
      device.note_off(50);
      out = concat(out, render(device, 1.0f, kRate));
      level[quick] = both_peak(out);
      where[quick] = peak_index(out);
    }
    const size_t due = mode == 0 ? strike_sample(0.5f) : at(0.001) + at(0.06);
    const double off_ms = 1000.0 * (static_cast<double>(where[1]) - static_cast<double>(due)) / kRate;
    std::snprintf(label, sizeof label, "strike mode %d: a key let go inside a steal still lands (%.1f dB against a held one, %.1f ms from its time)",
                  mode, db(level[1] / level[0]), off_ms);
    EXPECT(level[1] > 0.5 * level[0] && off_ms > -3.0 && off_ms < (mode == 0 ? 10.0 : 20.0), label);
  }
}

// The ghost is about as loud on every key and on every voice: its energy
// early in the swell against the same note without it.
static void test_ghost_even() {
  auto ghost_db = [](float hz, int voice, float swell) {
    double energy[2] = {0.0, 0.0};
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kGhost, pass == 0 ? 1.0f : 0.0f);
      device.set_param(p::kSwell, 8.0f);
      for (int v = 0; v < voice; ++v) device.note_on(900 + v, 100.0f, 0.0f);  // silent: they take the voices before
      device.set_param(p::kSwell, swell);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, swell, kRate);
      const double level = both_rms(out, at(0.15 * swell), at(0.6 * swell));
      energy[pass] = level * level;
    }
    return 10.0 * std::log10(std::max(energy[0] - energy[1], 1.0e-20));
  };
  double widest = 0.0;
  for (int source = 0; source < 4; ++source) {
    device.init(kRate);
    double lowest[2] = {200.0, 200.0}, highest[2] = {-200.0, -200.0};
    for (int n = 0; n < 12; ++n) {
      // By key, less the tilt every key has (see kKeyTilt), and by voice.
      const float hz = 65.4f * std::pow(2.0f, static_cast<float>(n) / 3.0f);
      const double tilt = 20.0 * std::log10(std::pow(std::min(hz, 1000.0f) / 220.0, -0.08));
      for (int which = 0; which < 2; ++which) {
        device.set_param(p::kSource, static_cast<float>(source));
        const double level = which == 0 ? ghost_db(hz, 0, 1.2f) - tilt : ghost_db(220.0f, n, 1.2f);
        lowest[which] = std::min(lowest[which], level);
        highest[which] = std::max(highest[which], level);
      }
    }
    widest = std::max(widest, std::max(highest[0] - lowest[0], highest[1] - lowest[1]));
  }
  std::snprintf(label, sizeof label, "the ghost is as loud on every key and voice (%.1f dB between twelve of each at worst)", widest);
  EXPECT(widest < 3.0, label);
  std::printf("ghost: %.1f dB between twelve keys or twelve voices at worst\n", widest);
}

// --- clicks ----------------------------------------------------------------------------------

static void test_clicks() {
  // Each smoothed knob thrown across its range in one step, both ways, at a
  // moment when it is heard.
  struct Throw {
    int id;
    float before;  // seconds after the key: 1 s swell, so 0.9 is in it and 1.3 in the ring
    const char* name;
  };
  const Throw throws[] = {{p::kTail, 1.3f, "Tail"},     {p::kSnap, 0.985f, "Snap"},    {p::kTone, 0.9f, "Tone"},
                          {p::kTone, 1.3f, "Tone"},     {p::kGhost, 0.6f, "Ghost"},    {p::kWobble, 1.3f, "Wobble"},
                          {p::kShimmer, 0.9f, "Shimmer"}, {p::kShimmer, 1.3f, "Shimmer"}, {p::kWidth, 0.9f, "Width"},
                          {p::kWidth, 1.3f, "Width"},   {p::kVolume, 0.9f, "Volume"},  {p::kVolume, 1.3f, "Volume"}};
  double worst = 0.0;
  for (const Throw& t : throws) {
    const float low = t.id == p::kVolume ? -20.0f : p::kParamMin[t.id];
    const float high = p::kParamMax[t.id];
    for (int way = 0; way < 2; ++way) {
      const float from = way == 0 ? low : high, to = way == 0 ? high : low;
      const double sudden = suddenness(
          [&](Rewind& d) {
            d.init(kRate);
            d.set_param(p::kSwell, 1.0f);
            d.set_param(p::kTail, 1.0f);
            d.set_param(p::kGhost, 0.6f);
            d.set_param(p::kShimmer, 0.6f);
            d.set_param(p::kWidth, 0.8f);
            d.set_param(t.id, from);
            d.note_on(1, 220.0f, 0.8f);
            d.note_on(2, 329.63f, 0.8f);
          },
          [&](Rewind& d) { d.set_param(t.id, to); }, t.before);
      worst = std::max(worst, sudden);
      if (sudden >= 0.15) {
        std::snprintf(label, sizeof label, "%s thrown from %g to %g at %.2f s is %.2f of the way after 8 samples", t.name, from, to,
                      t.before, sudden);
        EXPECT(false, label);
      }
    }
  }
  std::snprintf(label, sizeof label, "a knob thrown across its range comes on gradually (worst %.2f of the way after 8 samples)", worst);
  EXPECT(worst < 0.15, label);

  // A thirteenth key steals a voice; a held key is struck again; a hovering key is let go.
  auto full = [](Rewind& d) {
    d.init(kRate);
    d.set_param(p::kStrike, 1.0f);
    d.set_param(p::kSwell, 0.4f);
    for (int n = 0; n < 12; ++n) d.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  };
  auto one = [](Rewind& d) {
    d.init(kRate);
    d.set_param(p::kStrike, 1.0f);
    d.set_param(p::kSwell, 0.4f);
    d.note_on(1, 220.0f, 0.8f);
  };
  const double steal = suddenness(full, [](Rewind& d) { d.note_on(40, 987.77f, 0.8f); });
  const double again = suddenness(one, [](Rewind& d) { d.note_on(1, 220.0f, 0.8f); });
  const double off = suddenness(one, [](Rewind& d) { d.note_off(1); });
  std::snprintf(label, sizeof label, "a steal, a second strike and a release start gradually (%.2f, %.2f and %.2f of the way after 8 samples)",
                steal, again, off);
  EXPECT(steal < 0.15 && again < 0.15 && off < 0.15, label);
  std::printf("clicks: after 8 samples a thrown knob is at most %.2f of the way, a steal %.2f, a second strike %.2f, a release %.2f\n",
              worst, steal, again, off);

  // Tone swept under a ringing note makes no step larger than the note's own.
  Stereo swept, still;
  for (int pass = 0; pass < 2; ++pass) {
    bare(device);
    device.set_param(p::kSwell, 0.5f);
    device.set_param(p::kTail, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 0.7f, kRate);
    for (int step = 0; step < 200; ++step) {
      if (pass == 0) device.set_param(p::kTone, 0.5f + 0.5f * std::sin(static_cast<float>(step) * 0.2f));
      out = concat(out, render(device, 0.005f, kRate));
    }
    (pass == 0 ? swept : still) = out;
  }
  std::snprintf(label, sizeof label, "Tone swept under a ringing note: largest step %.4f against %.4f for the note alone",
                both_step(swept, at(0.7)), both_step(still, at(0.7)));
  EXPECT(both_step(swept, at(0.7)) < 2.5 * both_step(still, at(0.7)) && rms(swept.left, at(0.7)) > 0.0, label);
}

// --- voices ----------------------------------------------------------------------------------

// Twelve keys inside one octave, so no key's partial sits on another key.
static float held_key(int n) { return 200.0f * std::pow(2.0f, static_cast<float>(n) * 0.075f); }

static void test_voices() {
  // Twelve hovering keys, then two more in one block: both are heard.
  auto full = [](Rewind& d) {
    d.init(kRate);
    d.set_param(p::kStrike, 1.0f);
    d.set_param(p::kSwell, 0.3f);
    d.set_param(p::kGhost, 0.0f);
    d.set_param(p::kShimmer, 0.0f);
    for (int n = 0; n < 12; ++n) d.note_on(n, held_key(n), 0.8f);
  };
  full(device);
  render(device, 2.0f, kRate);
  device.note_on(20, 2000.0f, 0.8f);
  device.note_on(21, 2500.0f, 0.8f);
  Stereo two = render(device, 1.5f, kRate);
  const double a = level_at(two.left, 2000.0, kRate, at(1.0), at(1.5));
  const double b = level_at(two.left, 2500.0, kRate, at(1.0), at(1.5));
  std::snprintf(label, sizeof label, "held keys, then two in one block: both sound (%.1f and %.1f dBFS)", db(a), db(b));
  EXPECT(a > 1.0e-3 && b > 1.0e-3 && std::fabs(db(a / b)) < 6.0, label);

  // A key struck twice inside a steal fade takes one voice, and every key
  // let go ends in silence.
  full(device);
  render(device, 2.0f, kRate);
  Stereo before = render(device, 1.0f, kRate);
  device.note_on(30, 1500.0f, 0.8f);
  device.note_on(30, 1500.0f, 0.8f);
  render(device, 0.5f, kRate);
  Stereo after = render(device, 1.0f, kRate);
  int kept = 0;
  for (int n = 0; n < 12; ++n) {
    if (level_at(after.left, held_key(n), kRate, 0, at(1.0)) > 0.5 * level_at(before.left, held_key(n), kRate, 0, at(1.0))) ++kept;
  }
  std::snprintf(label, sizeof label, "a key struck twice during a steal takes one voice (%d of 12 held notes left)", kept);
  EXPECT(kept == 11, label);
  for (int n = 0; n < 12; ++n) device.note_off(n);
  device.note_off(30);
  render(device, 14.0f, kRate);
  Stereo end = render(device, 0.5f, kRate);
  EXPECT(peak(end.left) == 0.0 && peak(end.right) == 0.0, "after a doubled steal every key let go ends in silence");

  // A key struck again before it lands: After swell, both strikes land.
  device.init(kRate);
  device.set_param(p::kSwell, 1.0f);
  device.set_param(p::kTail, 0.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo twice = render(device, 0.5f, kRate);
  device.note_on(1, 220.0f, 0.8f);
  twice = concat(twice, render(device, 1.5f, kRate));
  const double first = both_peak(twice, at(0.99), at(1.01));
  const double second = both_peak(twice, at(1.49), at(1.51));
  const double gap = both_peak(twice, at(1.15), at(1.25));
  std::snprintf(label, sizeof label, "a key struck twice lands twice (%.3f at 1.0 s, %.3f at 1.5 s, %.3f between)", first, second, gap);
  EXPECT(first > 0.03 && second > 0.03 && gap < 0.3 * second, label);
  // On release, the second strike lets the first note go: it lands at once.
  device.init(kRate);
  device.set_param(p::kStrike, 1.0f);
  device.set_param(p::kTail, 0.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo hover = render(device, 1.0f, kRate);
  device.note_on(1, 220.0f, 0.8f);
  Stereo landed = render(device, 0.3f, kRate);
  const double ms = 1000.0 * static_cast<double>(peak_index(landed)) / kRate;
  std::snprintf(label, sizeof label, "On release: striking a held key again lands its first note (%.1f ms later)", ms);
  EXPECT(ms > 30.0 && ms < 80.0 && both_peak(landed) > 1.5 * both_peak(hover), label);
  device.note_off(1);
  render(device, 3.0f, kRate);
  Stereo quiet = render(device, 0.2f, kRate);
  EXPECT(peak(quiet.left) == 0.0, "... and one release ends the second");
}

// --- the host --------------------------------------------------------------------------------

// A phrase with events on block boundaries of every size tried: a note that
// stops dead, a silence, knobs moved in the silence, a second note.
static Stereo phrase(int block, float swell, size_t second_at, bool move) {
  device.init(kRate);
  device.set_param(p::kSwell, swell);
  device.set_param(p::kTail, 0.0f);
  device.set_param(p::kGhost, 0.5f);
  Stereo out;
  auto run_to = [&](size_t until) {
    while (out.size() < until) {
      const int frames = static_cast<int>(std::min(static_cast<size_t>(block), until - out.size()));
      device.process(frames);
      for (int i = 0; i < frames; ++i) {
        out.left.push_back(device.out_left()[i]);
        out.right.push_back(device.out_right()[i]);
      }
    }
  };
  device.note_on(1, 220.0f, 0.8f);
  device.note_on(2, 277.18f, 0.8f);
  run_to(2048);
  device.note_off(1);
  device.note_off(2);
  run_to(second_at - 2048);
  if (move) {
    device.set_param(p::kVolume, -3.0f);
    device.set_param(p::kTone, 0.9f);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kShimmer, 0.8f);
    device.set_param(p::kGhost, 1.0f);
    device.set_param(p::kWobble, 1.0f);
    device.set_param(p::kSwell, 0.3f);
    device.set_param(p::kTail, 0.6f);
  }
  run_to(second_at);
  device.note_on(3, 329.63f, 0.8f);
  run_to(second_at + 4096);
  device.note_on(4, 440.0f, 0.6f);
  run_to(second_at + 36864);
  return out;
}

static void test_block_sizes() {
  // The first note is over about 1400 samples after its strike and the
  // device sleeps 2400 samples after that, a block late for long blocks: the
  // second note's times straddle that.
  double worst = 0.0;
  int cases = 0;
  for (float swell : {0.16f, 0.2f, 0.23f, 0.27f}) {
    for (size_t second_at : {size_t{12288}, size_t{14336}, size_t{16384}, size_t{18432}, size_t{20480}, size_t{40960}}) {
      if (second_at < strike_sample(swell) + 2048) continue;
      for (int move = 0; move < 2; ++move) {
        Stereo reference = phrase(128, swell, second_at, move == 1);
        for (int block : {1, 2048, 100}) {
          worst = std::max(worst, max_difference(reference, phrase(block, swell, second_at, move == 1)));
        }
        ++cases;
      }
    }
  }
  std::snprintf(label, sizeof label, "1, 100, 128 and 2048 frames give the same audio through a silence and a wake (%d phrases, worst difference %g)",
                cases, worst);
  EXPECT(worst == 0.0, label);
  std::printf("blocks: %d phrases at 1, 100, 128 and 2048 frames, worst difference %g\n", cases, worst);
}

// Knobs moved while the device sleeps are in place for the next note: it is
// the note a device set that way from the start plays.
static void test_asleep() {
  auto set_all = [](Rewind& d) {
    d.set_param(p::kSource, 1.0f);
    d.set_param(p::kStrike, 0.0f);
    d.set_param(p::kSwell, 0.4f);
    d.set_param(p::kTail, 0.8f);
    d.set_param(p::kSnap, 0.9f);
    d.set_param(p::kRise, 0.2f);
    d.set_param(p::kTone, 0.8f);
    d.set_param(p::kGhost, 0.9f);
    d.set_param(p::kWobble, 0.7f);
    d.set_param(p::kShimmer, 0.9f);
    d.set_param(p::kWidth, 1.0f);
    d.set_param(p::kVolume, -2.0f);
  };
  device.init(kRate);
  set_all(device);
  device.note_on(7, 329.63f, 0.8f);
  Stereo fresh = render(device, 1.0f, kRate);

  device.init(kRate);
  device.set_param(p::kSwell, 0.2f);
  device.set_param(p::kTail, 0.0f);
  device.note_on(1, 220.0f, 0.8f);
  render(device, 0.21f, kRate);
  device.process(13);  // off the beat of the control clock
  Stereo rest = render(device, 1.0f, kRate);
  EXPECT(peak(rest.left, at(0.5)) == 0.0, "the first note is over and the device asleep");
  set_all(device);
  render(device, 0.3f, kRate);
  device.note_on(7, 329.63f, 0.8f);
  Stereo woken = render(device, 1.0f, kRate);
  std::snprintf(label, sizeof label, "knobs moved in a silence are in place for the next note (difference %g from a device set that way)",
                max_difference(fresh, woken));
  EXPECT(max_difference(fresh, woken) == 0.0, label);
}

// Two init() calls and the same notes give the same audio, bit for bit.
static void test_init_twice() {
  auto play = [](float rate) {
    device.init(rate);
    device.set_param(p::kGhost, 0.8f);
    device.set_param(p::kShimmer, 0.7f);
    device.set_param(p::kWobble, 0.5f);
    device.set_param(p::kSnap, 0.8f);
    device.set_param(p::kSwell, 0.5f);
    Stereo out;
    for (int n = 0; n < 16; ++n) {
      device.set_param(p::kSource, static_cast<float>(n % 4));
      device.set_param(p::kStrike, static_cast<float>((n / 4) % 2));
      device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 5 % 36) / 12.0f), 0.8f);
      out = concat(out, render(device, 0.11f, rate));
      if (n >= 2) device.note_off(n - 2);
    }
    return concat(out, render(device, 1.0f, rate));
  };
  Stereo first = play(kRate);
  device.note_on(99, 500.0f, 1.0f);
  render(device, 0.3f, kRate);
  Stereo second = play(kRate);
  EXPECT(first.left == second.left && first.right == second.right, "a second init() gives bit-identical audio");
  EXPECT(rms(first.left) > 1.0e-3, "... of a phrase that sounds");
}

// The swell is the same instrument at every sample rate.
static void test_rates() {
  double when[3], level[3], early[3];
  int index = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kGhost, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 2.0f, rate);
    when[index] = static_cast<double>(peak_index(out)) / rate;
    level[index] = db(both_peak(out));
    early[index] = db(rms(out.left, at(0.3, rate), at(0.9, rate)));
    ++index;
  }
  std::snprintf(label, sizeof label,
                "44.1, 48 and 96 kHz: the strike at %.4f, %.4f, %.4f s and %.1f, %.1f, %.1f dBFS; the ghost at %.1f, %.1f, %.1f dB",
                when[0], when[1], when[2], level[0], level[1], level[2], early[0], early[1], early[2]);
  EXPECT(std::fabs(when[0] - 1.5) < 0.01 && std::fabs(when[1] - 1.5) < 0.01 && std::fabs(when[2] - 1.5) < 0.01 &&
             std::fabs(level[0] - level[1]) < 2.0 && std::fabs(level[2] - level[1]) < 2.0 &&
             std::fabs(early[0] - early[1]) < 2.0 && std::fabs(early[2] - early[1]) < 2.0,
         label);
}

int main() {
  Conformance spec;
  spec.name = "rewind";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_swell_lands();
  test_stops_dead();
  test_brightens();
  test_tail();
  test_on_release();
  test_short_note_lands();
  test_ghost();
  test_rise();
  test_pitch();
  test_sources();
  test_snap();
  test_tone();
  test_wobble();
  test_shimmer();
  test_levels();
  test_loudness();
  test_together();
  test_release_strikes();
  test_ghost_even();
  test_clicks();
  test_voices();
  test_block_sizes();
  test_asleep();
  test_init_twice();
  test_rates();

  // Cost. Eight keys through the second half of an 8 s swell, ghost and
  // second copy at full: every partial of every key is sounding. Then the
  // default sound as the smoke check plays it (most of it is tails).
  device.init(kRate);
  device.set_param(p::kSwell, 8.0f);
  device.set_param(p::kGhost, 1.0f);
  device.set_param(p::kShimmer, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 4.0f, kRate);
  report_cost("rewind (8 keys in an 8 s swell, ghost and shimmer at full)", 4.0f, kRate, [&] { render(device, 4.0f, kRate); });
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("rewind (8 keys, default sound, 1 s to 11 s)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("rewind");
}
