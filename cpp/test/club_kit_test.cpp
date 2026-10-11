// Native harness for Club Kit (cpp/devices/club-kit). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest asserts what makes it this kit: twelve drums
// on the twelve keys, each drum's own shape, every pitch on a white key in
// all four characters, the choke, the ten controls and the levels.
//
// CLUB_KIT_PRINT=1 prints what was measured.

#include <chrono>
#include <cstdlib>
#include <functional>
#include <limits>

#include "../devices/club-kit/club_kit.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::ClubKit;
namespace p = livemix::club_kit;

static ClubKit device;
static ClubKit other;

static const float kRate = 48000.0f;
static const char* kNames[12] = {"kick",   "crash",    "snare", "ride",      "rim",     "closed hat",
                                 "shaker", "open hat", "clap",  "low conga", "cowbell", "high conga"};
static const char* kKits[4] = {"Firm", "Deep", "Dusty", "Bright"};
enum Key : int { C = 0, Cs, D, Ds, E, F, Fs, G, Gs, A, As, B };

static bool verbose() {
  static const bool on = std::getenv("CLUB_KIT_PRINT") != nullptr;
  return on;
}
#define NOTE(...)                            \
  do {                                       \
    if (verbose()) std::printf(__VA_ARGS__); \
  } while (0)

// The frequency of a key of the octave a kit is written in (MIDI 60 to 71).
static float key_hz(int key, int octave = 0, float cents = 0.0f) {
  return 440.0f * std::pow(2.0f, (60.0f + key + 12.0f * octave + cents * 0.01f - 69.0f) / 12.0f);
}

// The frequency of a MIDI note: what a white key is held against.
static double midi_hz(int note) { return 440.0 * std::pow(2.0, (note - 69) / 12.0); }
static double cents_from(double hz, double target) { return 1200.0 * std::log2(hz / target); }
static bool white(int note) {
  static const bool keys[12] = {true, false, true, false, true, true, false, true, false, true, false, true};
  return keys[((note % 12) + 12) % 12];
}

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// A device at its defaults with Variation at 0, so a hit can be measured
// against another hit sample for sample.
static void plain(ClubKit& d, float rate = kRate, int kit = 0) {
  d.init(rate);
  d.set_param(p::kVariation, 0.0f);
  d.set_param(p::kKit, static_cast<float>(kit));
}

static Stereo hit(ClubKit& d, int key, float gain = 0.7f, float seconds = 1.5f, float rate = kRate,
                  int octave = 0, float cents = 0.0f) {
  d.note_on(1, key_hz(key, octave, cents), gain);
  return render(d, seconds, rate);
}

static double both_peak(const Stereo& x) { return std::max(peak(x.left), peak(x.right)); }

// `x` through a fourth-order Butterworth high-pass at `hz`.
static std::vector<float> highpassed(const std::vector<float>& x, double hz, double rate) {
  std::vector<float> out(x.size(), 0.0f);
  size_t end = x.size();
  while (end > 0 && x[end - 1] == 0.0f) --end;  // nothing rings on after the last sample
  const double qs[2] = {0.54119610, 1.3065630};
  double z[2][2] = {{0.0, 0.0}, {0.0, 0.0}};
  double b0[2], b1[2], a1[2], a2[2];
  const double w = 2.0 * kPi * hz / rate, cw = std::cos(w), sw = std::sin(w);
  for (int s = 0; s < 2; ++s) {
    const double alpha = sw / (2.0 * qs[s]), a0 = 1.0 + alpha;
    b0[s] = (1.0 + cw) / 2.0 / a0;
    b1[s] = -(1.0 + cw) / a0;
    a1[s] = -2.0 * cw / a0;
    a2[s] = (1.0 - alpha) / a0;
  }
  for (size_t i = 0; i < end; ++i) {
    double v = x[i];
    for (int s = 0; s < 2; ++s) {
      const double y = b0[s] * v + z[s][0];
      z[s][0] = b1[s] * v - a1[s] * y + z[s][1];
      z[s][1] = b0[s] * v - a2[s] * y;
      v = y;
    }
    out[i] = static_cast<float>(v);
  }
  return out;
}

// The share of the energy in [from, to) that lies above `hz` (the test
// kit's energy_above is a one-pole split and cannot read more than about half
// for any signal at 48 kHz). The filter runs from the start of the render,
// so a window that opens inside a ringing drum has no edge of its own.
static double share_above(const std::vector<float>& x, double hz, double rate, size_t from = 0,
                          size_t to = SIZE_MAX) {
  const std::vector<float> high = highpassed(x, hz, rate);
  const double all = rms(x, from, to);
  const double top = rms(high, from, to);
  return all > 0.0 ? (top * top) / (all * all) : 0.0;
}

// The share of the energy between two frequencies.
static double share_between(const std::vector<float>& x, double lo, double hi, double rate, size_t from = 0,
                            size_t to = SIZE_MAX) {
  return share_above(x, lo, rate, from, to) - share_above(x, hi, rate, from, to);
}

// The strongest frequency in [lo, hi]: the test kit's dominant_frequency
// (a Hann-windowed scan, coarse then fine) with the window applied once and
// each frequency read by the Goertzel recurrence, which is many times faster.
static double dominant(const std::vector<float>& x, double rate, double lo, double hi, size_t from = 0,
                       size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  if (to <= from + 2) return lo;
  const size_t n = to - from;
  std::vector<double> windowed(n);
  for (size_t i = 0; i < n; ++i) {
    windowed[i] = x[from + i] * (0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n)));
  }
  auto level = [&](double hz) {
    const double w = 2.0 * kPi * hz / rate, coeff = 2.0 * std::cos(w);
    double s1 = 0.0, s2 = 0.0;
    for (size_t i = 0; i < n; ++i) {
      const double s0 = windowed[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    return s1 * s1 + s2 * s2 - coeff * s1 * s2;
  };
  const int steps = 600;
  double best_hz = lo, best = -1.0;
  for (int i = 0; i <= steps; ++i) {
    const double hz = lo * std::pow(hi / lo, static_cast<double>(i) / steps);
    const double l = level(hz);
    if (l > best) {
      best = l;
      best_hz = hz;
    }
  }
  double span = best_hz * (std::pow(hi / lo, 1.0 / steps) - 1.0);
  for (int pass = 0; pass < 3; ++pass) {
    const double centre = best_hz;
    for (int i = -10; i <= 10; ++i) {
      const double hz = centre + span * i / 10.0;
      if (hz <= 0.0) continue;
      const double l = level(hz);
      if (l > best) {
        best = l;
        best_hz = hz;
      }
    }
    span /= 10.0;
  }
  return best_hz;
}

// The frequency half the energy lies above.
static double median_hz(const std::vector<float>& x, double rate, size_t from = 0, size_t to = SIZE_MAX) {
  double lo = 20.0, hi = 20000.0;
  for (int i = 0; i < 14; ++i) {
    const double mid = std::sqrt(lo * hi);
    if (share_above(x, mid, rate, from, to) > 0.5) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return std::sqrt(lo * hi);
}

// How long the drum rings: the end of the last window whose RMS is within
// 60 dB of the loudest window.
static double ring_time(const std::vector<float>& x, double rate, double window_seconds = 0.005) {
  const size_t window = static_cast<size_t>(window_seconds * rate);
  double top = 0.0;
  size_t last = 0, count = 0;
  for (size_t i = 0; i + window <= x.size(); i += window) top = std::max(top, rms(x, i, i + window));
  for (size_t i = 0; i + window <= x.size(); i += window, ++count) {
    if (rms(x, i, i + window) > top * 0.001) last = count;
  }
  return static_cast<double>(last + 1) * window_seconds;
}

// The window ring_time reads a drum with: 2 ms for the short ones.
static double ring_window(int key) { return key == E || key == F || key == Fs ? 0.002 : 0.005; }

// How far two renders are apart, as a share of the louder one.
static double distance(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> diff(std::min(a.size(), b.size()));
  for (size_t i = 0; i < diff.size(); ++i) diff[i] = a[i] - b[i];
  return rms(diff) / std::max(1.0e-12, std::max(rms(a), rms(b)));
}

static double max_diff(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < std::min(a.size(), b.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

static std::vector<float> side_of(const Stereo& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (x.left[i] - x.right[i]);
  return out;
}

static std::vector<float> mid_of(const Stereo& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (x.left[i] + x.right[i]);
  return out;
}

// What a drum is, in two numbers that survive a retuning of a few cents.
struct Shape {
  double ring;
  double median;
};
static Shape shape_of(const Stereo& x, int key, double rate = kRate) {
  return {ring_time(x.left, rate, ring_window(key)), median_hz(x.left, rate)};
}
static double apart(const Shape& a, const Shape& b) {
  return std::fabs(std::log(a.ring / b.ring)) + std::fabs(std::log(a.median / b.median));
}

// How much of what an event changes is already there after eight samples:
// the same passage is rendered with and without the event, and the largest
// difference in the first 8 samples is held against the largest in 20 ms. A
// smoothed change has barely begun; a jump is all there at once. The worst of
// eight moments, so that a jump cannot hide in a zero crossing.
static double suddenness(const std::function<void(ClubKit&)>& setup,
                         const std::function<void(ClubKit&)>& event, double from_seconds = 0.03) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const float before = static_cast<float>(from_seconds + 0.0037 * trial);
    setup(device);
    render(device, before, kRate);
    Stereo quiet = render(device, 0.02f, kRate);
    setup(device);
    render(device, before, kRate);
    event(device);
    Stereo moved = render(device, 0.02f, kRate);
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < quiet.size(); ++i) {
      const double d = std::max(std::fabs(static_cast<double>(moved.left[i]) - quiet.left[i]),
                                std::fabs(static_cast<double>(moved.right[i]) - quiet.right[i]));
      if (i < 8) early = std::max(early, d);
      whole = std::max(whole, d);
    }
    // An event that changes nothing has not been smoothed, it has been lost.
    worst = std::max(worst, whole > 1.0e-7 ? early / whole : 1.0);
  }
  return worst;
}

// Notes and knob moves at exact sample positions, rendered in blocks of the
// given sizes (cut where an event falls, as a host does).
struct Event {
  size_t at;
  std::function<void(ClubKit&)> act;
};
static Stereo play(ClubKit& d, const std::vector<Event>& events, size_t total, const std::vector<int>& sizes) {
  Stereo out;
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0, next = 0, which = 0;
  while (done < total) {
    while (next < events.size() && events[next].at <= done) events[next++].act(d);
    size_t frames = static_cast<size_t>(sizes[which++ % sizes.size()]);
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

// A bar of house at 120 with every key in it: the kick on the four beats, a
// shaker in sixteenths, the open hat off the beat, and the rest between.
static void busy_bar(ClubKit& d, float gain, Stereo* out, float rate = kRate) {
  static const int kSteps[16][3] = {{C, Fs, Cs}, {Fs, -1, -1}, {G, Fs, -1}, {Fs, E, -1},  {C, D, Gs},  {Fs, -1, -1},
                                    {G, Fs, A},  {Fs, B, -1},  {C, Fs, Ds}, {Fs, F, -1},  {G, Fs, As}, {Fs, F, -1},
                                    {C, D, Gs},  {Fs, A, -1},  {G, Fs, B},  {Fs, F, As}};
  for (int step = 0; step < 16; ++step) {
    for (int n = 0; n < 3; ++n) {
      if (kSteps[step][n] >= 0) d.note_on(step * 3 + n, key_hz(kSteps[step][n]), gain);
    }
    Stereo part = render(d, 0.125f, rate);
    if (out) *out = step == 0 ? part : concat(*out, part);
  }
}

// The first moment a wave reaches half its peak, in seconds.
static double speak_time(const std::vector<float>& x, double rate) {
  const double half = 0.5 * peak(x);
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) >= half) return static_cast<double>(i) / rate;
  }
  return 0.0;
}

// --- each drum --------------------------------------------------------------------------

// 1. What makes each drum what it is, on the Firm kit.
static void test_voices() {
  // Kick: a sine that falls to G1 in a few hundredths of a second, with
  // harmonics from its waveshaper and a click.
  plain(device);
  Stereo kick = hit(device, C);
  {
    const double g1 = midi_hz(31);
    const double start = dominant(kick.left, kRate, 30.0, 1000.0, 0, at(0.010));
    const double mid = dominant(kick.left, kRate, 30.0, 1000.0, at(0.012), at(0.040));
    const double settled = dominant(kick.left, kRate, 30.0, 200.0, at(0.06), at(0.16));
    const double rest = dominant(kick.left, kRate, 30.0, 200.0, at(0.12), at(0.30));
    const double first = tone_level(kick.left, rest, kRate, at(0.06), at(0.16));
    const double second = tone_level(kick.left, 2.0 * rest, kRate, at(0.06), at(0.16)) / first;
    const double third = tone_level(kick.left, 3.0 * rest, kRate, at(0.06), at(0.16)) / first;
    const double off = tone_level(kick.left, 2.5 * rest, kRate, at(0.06), at(0.16)) / first;
    const double small = share_between(kick.left, 100.0, 400.0, kRate);
    const double click = share_above(kick.left, 2000.0, kRate, 0, at(0.01));
    const double ring = ring_time(kick.left, kRate);
    NOTE("kick: %.1f Hz in the first 10 ms, %.1f Hz from 12 to 40 ms, %.2f Hz from 60 ms, %.3f Hz at rest (%+.1f cents on G1)\n",
         start, mid, settled, rest, cents_from(rest, g1));
    NOTE("kick: harmonics on the fundamental: second %.3f, third %.3f (between them %.4f); %.3f of its energy from 100 to 400 Hz\n",
         second, third, off, small);
    NOTE("kick: speaks in %.2f ms, %.2f of its peak in the first 2 ms, above 2 kHz in its first 10 ms %.5f, rings %.3f s\n",
         1000.0 * speak_time(kick.left, kRate), peak(kick.left, 0, at(0.002)) / peak(kick.left), click, ring);
    EXPECT(std::fabs(cents_from(rest, g1)) < 5.0, "the kick rests on G1");
    EXPECT(start > 2.5 * rest, "the kick starts well above its resting pitch");
    EXPECT(mid < 0.6 * start && mid > rest, "most of the fall is over in the first hundredths of a second");
    EXPECT(std::fabs(cents_from(settled, rest)) < 8.0, "the fall is over 60 ms on");
    EXPECT(second > 0.08 && third > 0.08 && second > 8.0 * off && third > 8.0 * off,
           "the waveshaper gives the kick a second and a third harmonic");
    EXPECT(small > 0.12, "an eighth of the kick's energy and more lies between 100 and 400 Hz");
    EXPECT(speak_time(kick.left, kRate) < 0.0015 && peak(kick.left, 0, at(0.002)) > 0.6 * peak(kick.left),
           "the kick starts within a millisecond or two");
    EXPECT(click > 0.002, "the kick has a click");
    EXPECT(ring > 0.25 && ring < 0.5, "the kick rings between 0.25 and 0.5 s");
  }

  // Crash: metal and noise, bright, a fast first fall and then a long wash.
  plain(device);
  Stereo crash = hit(device, Cs, 0.7f, 5.0f);
  double crash_ring = 0.0;
  {
    crash_ring = ring_time(crash.left, kRate);
    const double first = db(rms(crash.left, at(0.005), at(0.025)));
    const double early = db(rms(crash.left, at(0.105), at(0.125)));
    const double later = db(rms(crash.left, at(0.305), at(0.325)));
    const double late = db(rms(crash.left, at(0.505), at(0.525)));
    const double centre = median_hz(crash.left, kRate);
    NOTE("crash: falls %.1f dB in its first 100 ms, then %.1f dB and %.1f dB in 200 ms each; centre %.0f Hz, above 3 kHz %.2f, rings %.3f s\n",
         first - early, early - later, later - late, centre, share_above(crash.left, 3000.0, kRate), crash_ring);
    EXPECT(crash_ring > 1.5, "the crash takes 1.5 s and more to fall 60 dB");
    EXPECT(first - early > 7.0 && first - early > 2.5 * 0.5 * (later - late),
           "the crash falls fast at first, then at less than half that rate");
    EXPECT(centre > 4500.0 && share_above(crash.left, 3000.0, kRate) > 0.85, "the crash is bright");
  }

  // Snare: two tones under a firm band of noise.
  plain(device);
  Stereo snare = hit(device, D);
  {
    const double low = tone_level(snare.left, midi_hz(55), kRate, at(0.01), at(0.06));
    const double high = tone_level(snare.left, midi_hz(64), kRate, at(0.01), at(0.06));
    const double between = tone_level(snare.left, 255.0, kRate, at(0.01), at(0.06));
    const double early = share_above(snare.left, 1000.0, kRate, 0, at(0.03));
    const double late = share_above(snare.left, 1000.0, kRate, at(0.08), at(0.16));
    const double band_low = share_above(snare.left, 1400.0, kRate, at(0.08), at(0.16));
    const double band_high = share_above(snare.left, 11000.0, kRate, at(0.08), at(0.16));
    NOTE("snare: tones %.4f and %.4f (between them %.4f), above 1 kHz %.2f early and %.2f late, "
         "late band above 1.4 kHz %.2f above 11 kHz %.2f, noise centre %.0f Hz, rings %.3f s\n",
         low, high, between, early, late, band_low, band_high, median_hz(snare.left, kRate, at(0.08), at(0.16)),
         ring_time(snare.left, kRate));
    EXPECT(low > 3.0 * between && high > 2.0 * between, "the snare has its two tones");
    EXPECT(late > 0.9 && late > early, "the snare's noise outlasts its tones");
    EXPECT(band_low > 0.85 && band_high < 0.2, "the snares lie between about 1.8 and 9 kHz");
    EXPECT_NEAR(ring_time(snare.left, kRate), 0.17, 0.04, "the snare is about 0.17 s");
  }

  // Ride: a ping of four high sines over a quieter wash, about a second.
  plain(device);
  Stereo ride = hit(device, Ds, 0.7f, 4.0f);
  double ride_ring = 0.0;
  {
    ride_ring = ring_time(ride.left, kRate);
    const double notes[4] = {midi_hz(98), midi_hz(105), midi_hz(112), midi_hz(115)};  // D7, A7, E8, G8
    double ping_power = 0.0, least = 1.0e9;
    for (double hz : notes) {
      const double on = tone_level(ride.left, hz, kRate, at(0.02), at(0.22));
      const double under = tone_level(ride.left, hz * 0.955, kRate, at(0.02), at(0.22));
      const double over = tone_level(ride.left, hz * 1.045, kRate, at(0.02), at(0.22));
      NOTE("ride: %.1f Hz at %.5f, a little under it %.5f, a little over %.5f\n", hz, on, under, over);
      least = std::min(least, on / std::max(under, over));
      ping_power += 0.5 * on * on;
    }
    const double all = rms(ride.left, at(0.02), at(0.22));
    const double share = ping_power / (all * all);
    NOTE("ride: the four sines are %.2f of its energy from 20 to 220 ms, centre %.0f Hz, rings %.3f s\n", share,
         median_hz(ride.left, kRate), ride_ring);
    EXPECT(least > 4.0, "the ride's ping stands on D7, A7, E8 and G8");
    EXPECT(share > 0.5 && share < 0.95, "the ping is over a quieter wash");
    EXPECT_NEAR(ride_ring, 1.0, 0.25, "the ride rings about a second");
  }

  // Rim: two partials on C5 and G6 and a click, gone in a few hundredths.
  plain(device);
  Stereo rim = hit(device, E);
  {
    const double low = tone_level(rim.left, midi_hz(72), kRate, 0, at(0.03));
    const double high = tone_level(rim.left, midi_hz(91), kRate, 0, at(0.03));
    const double between = tone_level(rim.left, 950.0, kRate, 0, at(0.03));
    const double click = share_above(rim.left, 2500.0, kRate, 0, at(0.004));
    const double ring = ring_time(rim.left, kRate, 0.002);
    NOTE("rim: partials %.4f and %.4f (between %.4f), above 2.5 kHz in its first 4 ms %.3f, speaks in %.2f ms, rings %.3f s\n",
         low, high, between, click, 1000.0 * speak_time(rim.left, kRate), ring);
    EXPECT(low > 5.0 * between && high > 4.0 * between, "the rim knocks on C5 and G6");
    EXPECT(click > 0.01, "the rim has a click");
    EXPECT(ring > 0.03 && ring < 0.06, "the rim is very short: under 60 ms");
  }

  // Closed hat: high and short.
  plain(device);
  Stereo closed = hit(device, F);
  double closed_ring = 0.0;
  {
    closed_ring = ring_time(closed.left, kRate, 0.002);
    NOTE("closed hat: above 5 kHz %.2f, centre %.0f Hz, rings %.3f s\n", share_above(closed.left, 5000.0, kRate),
         median_hz(closed.left, kRate), closed_ring);
    EXPECT(share_above(closed.left, 5000.0, kRate) > 0.85, "most of the closed hat lies above 5 kHz");
    EXPECT(closed_ring > 0.03 && closed_ring < 0.06, "the closed hat is 30 to 60 ms");
  }

  // Shaker: a band of noise that arrives softly.
  plain(device);
  Stereo shaker = hit(device, Fs);
  {
    const double first = rms(shaker.left, 0, at(0.001));
    const double arrived = rms(shaker.left, at(0.006), at(0.012));
    const double hat_first = rms(closed.left, 0, at(0.001)) / rms(closed.left, at(0.006), at(0.012));
    const double ring = ring_time(shaker.left, kRate, 0.002);
    NOTE("shaker: above 3 kHz %.2f, above 13 kHz %.2f, first ms %.3f of 6..12 ms (closed hat %.2f), rings %.3f s\n",
         share_above(shaker.left, 3000.0, kRate), share_above(shaker.left, 13000.0, kRate), first / arrived, hat_first,
         ring);
    EXPECT(share_above(shaker.left, 3000.0, kRate) > 0.9 && share_above(shaker.left, 13000.0, kRate) < 0.2,
           "the shaker is a band between about 4.5 and 9.5 kHz");
    EXPECT(first < 0.2 * arrived && first / arrived < 0.3 * hat_first,
           "the shaker arrives softly where the hat strikes");
    EXPECT(ring > 0.05 && ring < 0.11, "the shaker is short");
  }

  // Open hat: the closed hat's sound, ringing 0.3 to 0.5 s.
  plain(device);
  Stereo open = hit(device, G);
  {
    const double ring = ring_time(open.left, kRate);
    NOTE("open hat: above 5 kHz %.2f, centre %.0f Hz, rings %.3f s\n", share_above(open.left, 5000.0, kRate),
         median_hz(open.left, kRate), ring);
    EXPECT(std::fabs(share_above(open.left, 5000.0, kRate) - share_above(closed.left, 5000.0, kRate)) < 0.08,
           "the open hat has the closed hat's spectrum");
    EXPECT(std::fabs(std::log(median_hz(open.left, kRate) / median_hz(closed.left, kRate))) < 0.08,
           "the open hat is centred where the closed hat is");
    EXPECT(ring > 0.3 && ring < 0.5, "the open hat rings 0.3 to 0.5 s");
    // The cymbals in order of length, each well clear of the next.
    NOTE("cymbals: crash %.3f s, ride %.3f s, open hat %.3f s, closed hat %.3f s\n", crash_ring, ride_ring, ring,
         closed_ring);
    EXPECT(crash_ring > 1.4 * ride_ring && ride_ring > 1.6 * ring && ring > 4.0 * closed_ring,
           "the crash outlasts the ride, the ride the open hat, the open hat the closed one");
    // Told apart by more than length: the ride is lower than the open hat and
    // has its ping, the crash is noise and metal with no sine standing in it.
    const double a7 = midi_hz(105);
    const double ride_ping = tone_level(ride.left, a7, kRate, at(0.02), at(0.22)) / rms(ride.left, at(0.02), at(0.22));
    const double crash_ping = tone_level(crash.left, a7, kRate, at(0.02), at(0.22)) / rms(crash.left, at(0.02), at(0.22));
    const double open_ping = tone_level(open.left, a7, kRate, at(0.02), at(0.22)) / rms(open.left, at(0.02), at(0.22));
    NOTE("cymbals: A7 against the whole sound: ride %.3f, crash %.3f, open hat %.3f; centres ride %.0f, crash %.0f, open hat %.0f Hz\n",
         ride_ping, crash_ping, open_ping, median_hz(ride.left, kRate), median_hz(crash.left, kRate),
         median_hz(open.left, kRate));
    EXPECT(ride_ping > 5.0 * crash_ping && ride_ping > 5.0 * open_ping, "only the ride has a ping");
    EXPECT(median_hz(ride.left, kRate) < 0.7 * median_hz(open.left, kRate), "the ride is lower than the open hat");
  }

  // Clap: four bursts 8 ms apart between 1 and 2 kHz, then a tail.
  plain(device);
  Stereo clap = hit(device, Gs);
  {
    double level[48];
    for (int ms = 0; ms < 48; ++ms) level[ms] = rms(clap.left, at(0.001 * ms), at(0.001 * (ms + 1)));
    double burst[5], gap[4];
    for (int n = 0; n < 5; ++n) burst[n] = std::max(level[8 * n], std::max(level[8 * n + 1], level[8 * n + 2]));
    for (int n = 0; n < 4; ++n) gap[n] = std::min(level[8 * n + 6], level[8 * n + 7]);
    const double centre = median_hz(clap.left, kRate);
    const double ring = ring_time(clap.left, kRate);
    NOTE("clap: bursts %.4f %.4f %.4f %.4f with %.4f %.4f %.4f %.4f before the next, tail from %.4f, centre %.0f Hz, rings %.3f s\n",
         burst[0], burst[1], burst[2], burst[3], gap[0], gap[1], gap[2], gap[3], burst[4], centre, ring);
    bool bursts = true;
    for (int n = 0; n < 4; ++n) bursts = bursts && burst[n] > 2.0 * gap[n] && burst[n + 1] > 2.0 * gap[n];
    EXPECT(bursts, "the clap is four bursts 8 ms apart and then a tail");
    EXPECT(centre > 1000.0 && centre < 2000.0, "the clap's band is centred between 1 and 2 kHz");
    EXPECT(ring > 0.2 && ring < 0.3, "the clap is 0.2 to 0.3 s");
  }

  // Congas: a struck skin on G3 and on D4, a fifth apart, with a quieter
  // partial a fifth over each, a small fall and a slap at the start only.
  double conga_hz[2] = {0.0, 0.0}, conga_ring[2] = {0.0, 0.0}, conga_slap[2] = {0.0, 0.0};
  for (int which = 0; which < 2; ++which) {
    const int key = which == 0 ? A : B;
    const double hz = midi_hz(which == 0 ? 55 : 62);
    char label[160];
    plain(device);
    Stereo conga = hit(device, key);
    const double rest = dominant(conga.left, kRate, hz * 0.7, hz * 1.25, at(0.04), at(0.16));
    const double start = dominant(conga.left, kRate, hz * 0.7, hz * 1.4, 0, at(0.012));
    const double first = tone_level(conga.left, hz, kRate, at(0.03), at(0.09));
    const double second = tone_level(conga.left, hz * 1.4983, kRate, at(0.03), at(0.09)) / first;
    const double off = tone_level(conga.left, hz * 1.75, kRate, at(0.03), at(0.09)) / first;
    const double slap = share_above(conga.left, hz * 4.0, kRate, 0, at(0.02));
    const double slap_late = share_above(conga.left, hz * 4.0, kRate, at(0.08), at(0.16));
    conga_hz[which] = rest;
    conga_ring[which] = ring_time(conga.left, kRate);
    conga_slap[which] = slap;
    NOTE("%s: %.2f Hz at rest (%+.1f cents), %.1f Hz in its first 12 ms, a fifth over it %.3f of the tone (off it %.4f), "
         "above its body %.4f early %.6f late, rings %.3f s\n",
         kNames[key], rest, cents_from(rest, hz), start, second, off, slap, slap_late, conga_ring[which]);
    std::snprintf(label, sizeof label, "the %s sounds on its key", kNames[key]);
    EXPECT(std::fabs(cents_from(rest, hz)) < 5.0, label);
    std::snprintf(label, sizeof label, "the %s falls a little in pitch", kNames[key]);
    EXPECT(start > 1.03 * rest && start < 1.3 * rest, label);
    std::snprintf(label, sizeof label, "the %s has a quieter partial a fifth over its tone", kNames[key]);
    EXPECT(second > 0.04 && second < 0.5 && second > 4.0 * off, label);
    std::snprintf(label, sizeof label, "the %s has a slap at its start only", kNames[key]);
    EXPECT(slap > 0.01 && slap_late < 0.05 * slap, label);
  }
  NOTE("congas: %.4f apart in pitch, rings %.3f and %.3f s, slap %.4f and %.4f\n", conga_hz[1] / conga_hz[0],
       conga_ring[0], conga_ring[1], conga_slap[0], conga_slap[1]);
  EXPECT_NEAR(cents_from(conga_hz[1] / conga_hz[0], 1.0), 700.0, 6.0, "the congas are a fifth apart");
  EXPECT_NEAR(conga_ring[0], 0.25, 0.04, "the low conga rings about 0.25 s");
  EXPECT(conga_ring[1] < 0.92 * conga_ring[0] && conga_slap[1] > 1.3 * conga_slap[0],
         "the high conga is a little shorter and has more slap");

  // Cowbell: two pulses on D5 and A5 through a band-pass, a hard start, a short ring.
  plain(device);
  Stereo bell = hit(device, As);
  {
    const double low = dominant(bell.left, kRate, 480.0, 700.0, at(0.02), at(0.12));
    const double high = dominant(bell.left, kRate, 760.0, 1000.0, at(0.02), at(0.12));
    const double l1 = tone_level(bell.left, low, kRate, at(0.02), at(0.12));
    const double l2 = tone_level(bell.left, high, kRate, at(0.02), at(0.12));
    const double between = tone_level(bell.left, 715.0, kRate, at(0.02), at(0.12));
    const double third = tone_level(bell.left, 3.0 * low, kRate, at(0.02), at(0.12));
    const double front = rms(bell.left, at(0.0005), at(0.0045)) / rms(bell.left, at(0.030), at(0.034));
    const double ring = ring_time(bell.left, kRate);
    NOTE("cowbell: %.2f and %.2f Hz (%+.1f and %+.1f cents on D5 and A5), %.1f cents apart, levels %.4f and %.4f (between %.5f), "
         "third harmonic of the lower %.4f\n",
         low, high, cents_from(low, midi_hz(74)), cents_from(high, midi_hz(81)), cents_from(high / low, 1.0), l1, l2,
         between, third);
    NOTE("cowbell: its first 4 ms are %.2f times its level 30 ms on, speaks in %.2f ms, above 6 kHz %.4f, rings %.3f s\n", front,
         1000.0 * speak_time(bell.left, kRate), share_above(bell.left, 6000.0, kRate), ring);
    EXPECT(std::fabs(cents_from(low, midi_hz(74))) < 5.0 && std::fabs(cents_from(high, midi_hz(81))) < 5.0,
           "the cowbell's two pulses are on D5 and A5");
    EXPECT_NEAR(cents_from(high / low, 1.0), 700.0, 5.0, "the cowbell's two pulses are a fifth apart");
    EXPECT(l1 > 8.0 * between && l2 > 8.0 * between && l2 > 0.4 * l1 && l1 > 0.4 * l2,
           "both of the cowbell's pulses stand clear, about as loud as each other");
    EXPECT(third > 0.03 * l1 && third < 0.6 * l1, "the cowbell is pulses through a band-pass: harmonics, the fundamentals over them");
    EXPECT(front > 1.8 && speak_time(bell.left, kRate) < 0.002, "the cowbell starts hard");
    EXPECT(ring > 0.1 && ring < 0.25, "the cowbell's ring is short");
  }
}

// --- the keys --------------------------------------------------------------------------

// 2. Twelve keys, twelve drums; the octave and Tune retune the same drum.
static void test_keys() {
  std::vector<Stereo> drum(12);
  for (int key = 0; key < 12; ++key) {
    plain(device);
    drum[key] = hit(device, key, 0.7f, 1.2f);
  }
  double nearest = 1.0e9;
  int nearest_a = 0, nearest_b = 0;
  for (int a = 0; a < 12; ++a) {
    for (int b = a + 1; b < 12; ++b) {
      const double d = distance(drum[a].left, drum[b].left);
      if (d < nearest) {
        nearest = d;
        nearest_a = a;
        nearest_b = b;
      }
    }
  }
  NOTE("keys: the two closest drums are %.2f of their level apart (%s and %s)\n", nearest, kNames[nearest_a],
       kNames[nearest_b]);
  EXPECT(nearest > 0.5, "each of the twelve keys gives a different sound");

  // The pitched drums: where the tone settles, read once the fall is over.
  struct Pitched {
    int key;
    double hz, from, to;
  };
  const Pitched pitched[] = {{C, midi_hz(31), 0.12, 0.30},   {D, midi_hz(55), 0.03, 0.09},  {Ds, midi_hz(105), 0.05, 0.40},
                             {E, midi_hz(72), 0.004, 0.03},  {A, midi_hz(55), 0.05, 0.20},  {As, midi_hz(74), 0.02, 0.12},
                             {B, midi_hz(62), 0.05, 0.18}};
  for (const Pitched& v : pitched) {
    char label[120];
    plain(device);
    Stereo home = hit(device, v.key, 0.7f, 2.5f);
    const double base = dominant(home.left, kRate, v.hz * 0.75, v.hz * 1.25, at(v.from), at(v.to));
    plain(device);
    Stereo up = hit(device, v.key, 0.7f, 2.5f, kRate, 1);
    const double octave = dominant(up.left, kRate, v.hz * 1.5, v.hz * 2.5, at(v.from * 0.6), at(v.to * 0.6));
    plain(device);
    device.set_param(p::kTune, 12.0f);
    Stereo tuned = hit(device, v.key, 0.7f, 2.5f);
    const double tune = dominant(tuned.left, kRate, v.hz * 1.5, v.hz * 2.5, at(v.from * 0.6), at(v.to * 0.6));
    plain(device);
    Stereo down = hit(device, v.key, 0.7f, 4.0f, kRate, -1);
    const double window = ring_window(v.key);
    const double ring = ring_time(home.left, kRate, window);
    NOTE("%-10s settles at %8.2f Hz, octave up %8.2f, Tune +12 %8.2f; rings %.3f s, up %.3f, down %.3f\n",
         kNames[v.key], base, octave, tune, ring, ring_time(up.left, kRate, window), ring_time(down.left, kRate, window));
    std::snprintf(label, sizeof label, "%s sounds at its pitch", kNames[v.key]);
    EXPECT_NEAR(base, v.hz, v.hz * 0.004, label);
    std::snprintf(label, sizeof label, "%s an octave up is the same drum at twice the pitch", kNames[v.key]);
    EXPECT_NEAR(octave / base, 2.0, 0.01, label);
    std::snprintf(label, sizeof label, "%s with Tune at +12 is at twice the pitch", kNames[v.key]);
    EXPECT_NEAR(tune / base, 2.0, 0.01, label);
    EXPECT(up.left == tuned.left && up.right == tuned.right, "the octave above and Tune +12 are the same retuning");
    std::snprintf(label, sizeof label, "%s rings about a third shorter an octave up", kNames[v.key]);
    EXPECT_NEAR(ring_time(up.left, kRate, window) / ring, 0.667, 0.12, label);
    std::snprintf(label, sizeof label, "%s rings about half longer an octave down", kNames[v.key]);
    EXPECT_NEAR(ring_time(down.left, kRate, window) / ring, 1.5, 0.2, label);
  }
  // The noise drums: their band moves with the key's octave.
  for (int key : {Cs, F, Fs, G, Gs}) {
    char label[120];
    plain(device);
    const double home = median_hz(hit(device, key).left, kRate);
    plain(device);
    const double up = median_hz(hit(device, key, 0.7f, 1.5f, kRate, 1).left, kRate);
    plain(device);
    const double down = median_hz(hit(device, key, 0.7f, 1.5f, kRate, -1).left, kRate);
    NOTE("%-10s band centre %6.0f Hz, octave up %6.0f, octave down %6.0f\n", kNames[key], home, up, down);
    if (key == Gs) {
      // The clap's band is as wide as it is high; its level is held as it moves.
      plain(device);
      const double level = db(rms(hit(device, key).left, 0, at(0.03)));
      plain(device);
      const double above = db(rms(hit(device, key, 0.7f, 1.5f, kRate, 1).left, 0, at(0.03)));
      plain(device);
      const double below = db(rms(hit(device, key, 0.7f, 1.5f, kRate, -1).left, 0, at(0.03)));
      NOTE("clap: bursts at %+.1f dB an octave up, %+.1f dB an octave down\n", above - level, below - level);
      EXPECT(std::fabs(above - level) < 2.2 && std::fabs(below - level) < 2.2, "the clap keeps its level as it is retuned");
    }
    std::snprintf(label, sizeof label, "%s is brighter an octave up and duller an octave down", kNames[key]);
    EXPECT(up > 1.2 * home && down < 0.85 * home, label);
  }

  // A key 30 cents off is still its own drum, retuned by those cents.
  std::vector<Shape> shapes(12);
  for (int key = 0; key < 12; ++key) shapes[key] = shape_of(drum[key], key);
  for (int key = 0; key < 12; ++key) {
    for (float cents : {-30.0f, 30.0f}) {
      char label[120];
      plain(device);
      const Shape off = shape_of(hit(device, key, 0.7f, 1.2f, kRate, 0, cents), key);
      int closest = 0;
      for (int k = 1; k < 12; ++k) {
        if (apart(off, shapes[k]) < apart(off, shapes[closest])) closest = k;
      }
      std::snprintf(label, sizeof label, "%s played %+.0f cents off is still the %s", kNames[key], cents,
                    kNames[key]);
      EXPECT(closest == key && apart(off, shapes[key]) < 0.15, label);
    }
  }
  plain(device);
  Stereo sharp = hit(device, A, 0.7f, 1.0f, kRate, 0, 30.0f);
  const double cents = cents_from(dominant(sharp.left, kRate, 150.0, 250.0, at(0.05), at(0.2)), midi_hz(55));
  NOTE("low conga 30 cents sharp sounds %.1f cents sharp\n", cents);
  EXPECT_NEAR(cents, 30.0, 3.0, "the cents a key is off go into the tuning");

  // A hit is a one-shot: letting the key go changes nothing.
  plain(device);
  device.note_on(7, key_hz(G), 0.7f);
  Stereo rung = render(device, 0.6f, kRate);
  plain(device);
  device.note_on(7, key_hz(G), 0.7f);
  Stereo first = render(device, 0.05f, kRate);
  device.note_off(7);
  device.note_off(99);
  Stereo let_go = concat(first, render(device, 0.55f, kRate));
  EXPECT(let_go.left == rung.left && let_go.right == rung.right, "note off does nothing to a hit");
}

// 3. Pitch: with Tune at 0, in the octave of middle C, everything with a
// pitch is on a white key within 5 cents, in all four characters. Read at
// Length 4, where every partial rings long enough to be read to a cent (at
// Length 1 the snare's upper tone and the congas' fifth are over in a few
// hundredths of a second and stand on the skirt of the tone under them), and
// held at Length 1 to a wider mark. Length sets how long a drum rings, not
// where it is tuned.
static void test_white_keys() {
  struct Line {
    int key;
    int note[4];    // MIDI notes, per character
    double from, to;  // at Length 1; four times as long at Length 4
    const char* what;
  };
  const Line lines[] = {
      {C, {31, 29, 31, 31}, 0.12, 0.30, "kick"},
      {D, {55, 50, 52, 57}, 0.03, 0.09, "snare, lower tone"},
      {D, {64, 57, 60, 64}, 0.03, 0.08, "snare, upper tone"},
      {Ds, {98, 98, 98, 98}, 0.05, 0.40, "ride, ping on D7"},
      {Ds, {105, 105, 105, 105}, 0.05, 0.40, "ride, ping on A7"},
      {Ds, {112, 112, 112, 112}, 0.05, 0.30, "ride, ping on E8"},
      {Ds, {115, 115, 115, 115}, 0.05, 0.25, "ride, ping on G8"},
      {E, {72, 69, 72, 74}, 0.004, 0.03, "rim, lower partial"},
      {E, {91, 88, 91, 93}, 0.004, 0.025, "rim, upper partial"},
      {A, {55, 55, 55, 55}, 0.05, 0.20, "low conga"},
      {A, {62, 62, 62, 62}, 0.04, 0.12, "low conga, the fifth over it"},
      {As, {74, 74, 74, 74}, 0.02, 0.12, "cowbell, lower pulse"},
      {As, {81, 81, 81, 81}, 0.02, 0.12, "cowbell, upper pulse"},
      {B, {62, 62, 62, 62}, 0.05, 0.18, "high conga"},
      {B, {69, 69, 69, 69}, 0.04, 0.10, "high conga, the fifth over it"},
  };
  double worst = 0.0, worst_short = 0.0;
  bool five = true;
  for (int kit = 0; kit < 4; ++kit) {
    Stereo long_hit[12], short_hit[12];
    for (int key : {C, D, Ds, E, A, As, B}) {
      // The snare with its noise at its least: the tones are what is read.
      plain(device, kRate, kit);
      device.set_param(p::kLength, 4.0f);
      if (key == D) device.set_param(p::kSnap, 0.0f);
      long_hit[key] = hit(device, key, 0.7f, 4.0f);
      plain(device, kRate, kit);
      if (key == D) device.set_param(p::kSnap, 0.0f);
      short_hit[key] = hit(device, key, 0.7f, 1.5f);
    }
    for (const Line& line : lines) {
      char label[200];
      const int note = line.note[kit];
      const double target = midi_hz(note);
      // A quarter tone either side: the next key is out of reach.
      const double lo = target * 0.9715, hi = target * 1.0293;
      const double found = dominant(long_hit[line.key].left, kRate, lo, hi, at(line.from), at(line.from + 4.0 * (line.to - line.from)));
      const double brief = dominant(short_hit[line.key].left, kRate, lo, hi, at(line.from), at(line.to));
      const double cents = cents_from(found, target), cents_brief = cents_from(brief, target);
      // The line stands there: over what lies a semitone and a half either side.
      const double on = tone_level(long_hit[line.key].left, target, kRate, at(line.from), at(line.from + 4.0 * (line.to - line.from)));
      const double beside = std::max(
          tone_level(long_hit[line.key].left, target * 0.917, kRate, at(line.from), at(line.from + 4.0 * (line.to - line.from))),
          tone_level(long_hit[line.key].left, target * 1.091, kRate, at(line.from), at(line.from + 4.0 * (line.to - line.from))));
      NOTE("white keys, %-6s: %-30s MIDI %3d %9.3f Hz, found %9.3f (%+5.2f cents; %+5.2f at Length 1), %5.1f times what lies beside it\n",
           kKits[kit], line.what, note, target, found, cents, cents_brief, on / beside);
      worst = std::max(worst, std::fabs(cents));
      worst_short = std::max(worst_short, std::fabs(cents_brief));
      std::snprintf(label, sizeof label, "%s kit: the %s is on a white key within 5 cents (%+.2f)", kKits[kit], line.what, cents);
      EXPECT(white(note) && std::fabs(cents) < 5.0 && on > 3.0 * beside, label);
      std::snprintf(label, sizeof label, "%s kit: the %s reads within 20 cents at Length 1 too (%+.2f)", kKits[kit], line.what,
                    cents_brief);
      EXPECT(std::fabs(cents_brief) < 20.0, label);
      // C, D, E, G and A only, Deep's kick apart: so Tune at 5 or 7 either way lands on white keys too.
      const int pc = note % 12;
      five = five && (pc == 0 || pc == 2 || pc == 4 || pc == 7 || pc == 9 || (kit == 1 && line.key == C));
    }
  }
  NOTE("white keys: the furthest line is %.2f cents off at Length 4, %.2f at Length 1\n", worst, worst_short);
  EXPECT(five, "every pitch is on C, D, E, G or A, Deep's kick on F apart");

  // And a fifth up they still are, which is how the bank moves a kit into another key.
  plain(device);
  device.set_param(p::kTune, 7.0f);
  device.set_param(p::kLength, 4.0f);
  const double kick = dominant(hit(device, C, 0.7f, 3.0f).left, kRate, 60.0, 90.0, at(0.12), at(0.8));
  plain(device);
  device.set_param(p::kTune, 7.0f);
  device.set_param(p::kLength, 4.0f);
  const double bell = dominant(hit(device, As, 0.7f, 2.0f).left, kRate, 800.0, 950.0, at(0.02), at(0.4));
  NOTE("white keys: with Tune at 7 the kick is at %.3f Hz (%+.2f cents on D2), the cowbell's lower pulse at %.2f Hz (%+.2f on A5)\n",
       kick, cents_from(kick, midi_hz(38)), bell, cents_from(bell, midi_hz(81)));
  EXPECT(std::fabs(cents_from(kick, midi_hz(38))) < 5.0 && std::fabs(cents_from(bell, midi_hz(81))) < 5.0,
         "Tune moves every pitch by the same interval, onto another white key");
}

// --- the controls -----------------------------------------------------------------------

// 4. Length, Tone, Punch and Snap do what they say.
static void test_controls() {
  // Length scales how long every drum rings.
  for (int key : {C, D, F, G, A, As}) {
    char label[120];
    const double window = ring_window(key);
    plain(device);
    const double home = ring_time(hit(device, key, 0.7f, 4.0f).left, kRate, window);
    plain(device);
    device.set_param(p::kLength, 2.0f);
    const double longer = ring_time(hit(device, key, 0.7f, 4.0f).left, kRate, window);
    plain(device);
    device.set_param(p::kLength, 0.5f);
    const double shorter = ring_time(hit(device, key, 0.7f, 4.0f).left, kRate, window);
    NOTE("length: %-10s rings %.3f s, %.3f s at 2, %.3f s at 0.5\n", kNames[key], home, longer, shorter);
    std::snprintf(label, sizeof label, "Length 2 doubles how long the %s rings", kNames[key]);
    EXPECT_NEAR(longer / home, 2.0, 0.3, label);
    std::snprintf(label, sizeof label, "Length 0.5 halves how long the %s rings", kNames[key]);
    EXPECT_NEAR(shorter / home, 0.5, 0.1, label);
  }
  // The ends of the knob on the two that matter most: a clipped kick, a long crash.
  {
    plain(device);
    device.set_param(p::kLength, 0.25f);
    const double kick = ring_time(hit(device, C, 0.7f, 1.0f).left, kRate, 0.002);
    plain(device);
    device.set_param(p::kLength, 4.0f);
    const double crash = ring_time(hit(device, Cs, 0.7f, 12.0f).left, kRate);
    NOTE("length: the kick rings %.3f s at 0.25, the crash %.2f s at 4\n", kick, crash);
    EXPECT(kick < 0.1 && crash > 6.0, "Length runs from clipped taps to long washes");
  }

  // Tone: the top of the tonal drums, the upper edge of the noise drums.
  struct Toned {
    int key;
    double hz, seconds;  // the share above `hz` in the first `seconds`
    double step;         // how much of a step is asked for
  };
  const Toned toned[] = {{C, 1500.0, 0.02, 1.0},  {Cs, 9000.0, 0.3, 1.0},  {D, 5000.0, 0.2, 1.0},  {Ds, 6000.0, 0.3, 1.0},
                         {E, 1200.0, 0.05, 0.5},  {F, 9000.0, 0.06, 1.0},  {Fs, 7500.0, 0.1, 1.0}, {G, 9000.0, 0.3, 1.0},
                         {Gs, 2500.0, 0.2, 1.0},  {A, 600.0, 0.03, 1.0},   {As, 1500.0, 0.1, 0.5}, {B, 900.0, 0.03, 1.0}};
  for (const Toned& v : toned) {
    char label[120];
    double share[3], level[3];
    int index = 0;
    for (float tone : {0.0f, 0.5f, 1.0f}) {
      plain(device);
      device.set_param(p::kTone, tone);
      if (v.key == C || v.key == A || v.key == B) device.set_param(p::kSnap, 1.0f);
      Stereo out = hit(device, v.key);
      share[index] = share_above(out.left, v.hz, kRate, 0, at(v.seconds));
      level[index++] = db(rms(out.left, 0, at(v.seconds)));
    }
    NOTE("tone: %-10s above %5.0f Hz: %.5f dull, %.5f centre, %.5f bright; level %+.1f and %+.1f dB on the centre\n",
         kNames[v.key], v.hz, share[0], share[1], share[2], level[0] - level[1], level[2] - level[1]);
    std::snprintf(label, sizeof label, "Tone takes the %s from dull to bright", kNames[v.key]);
    EXPECT(share[1] > (1.0 + 0.3 * v.step) * share[0] && share[2] > (1.0 + 0.15 * v.step) * share[1], label);
    std::snprintf(label, sizeof label, "Tone leaves the %s within 8 dB of its level", kNames[v.key]);
    EXPECT(std::fabs(level[0] - level[1]) < 8.0 && std::fabs(level[2] - level[1]) < 8.0, label);
    if (v.key == F || v.key == Fs || v.key == Cs) {
      std::snprintf(label, sizeof label, "dull makes the %s quieter", kNames[v.key]);
      EXPECT(level[0] < level[1] - 1.0, label);
    }
  }

  // Punch: how far the kick and congas fall, and how hard they start.
  {
    double start[3], speak[3];
    int index = 0;
    for (float punch : {0.0f, 0.5f, 1.0f}) {
      plain(device);
      device.set_param(p::kPunch, punch);
      device.set_param(p::kSnap, 0.0f);
      Stereo kick = hit(device, C);
      start[index] = dominant(kick.left, kRate, 30.0, 1000.0, 0, at(0.010));
      speak[index] = speak_time(kick.left, kRate);
      const double rest = dominant(kick.left, kRate, 30.0, 100.0, at(0.12), at(0.30));
      NOTE("punch %.2f: kick at %.1f Hz in the first 10 ms, %.3f Hz at rest, speaks in %.2f ms\n", punch, start[index],
           rest, 1000.0 * speak[index]);
      EXPECT(std::fabs(cents_from(rest, midi_hz(31))) < 5.0, "Punch leaves the kick's resting pitch alone");
      ++index;
    }
    EXPECT(start[1] > 1.4 * start[0] && start[2] > 1.3 * start[1], "Punch raises the pitch the kick starts at");
    EXPECT(speak[2] < 0.7 * speak[1] && speak[1] < 0.8 * speak[0], "Punch hardens the kick's first moments");
    plain(device);
    device.set_param(p::kPunch, 0.0f);
    Stereo soft_conga = hit(device, A);
    plain(device);
    device.set_param(p::kPunch, 1.0f);
    Stereo hard_conga = hit(device, A);
    const double soft = dominant(soft_conga.left, kRate, 150.0, 300.0, 0, at(0.012));
    const double hard = dominant(hard_conga.left, kRate, 150.0, 300.0, 0, at(0.012));
    NOTE("punch: low conga starts at %.1f Hz with none and %.1f Hz with all of it, rests at %.2f and %.2f Hz\n", soft, hard,
         dominant(soft_conga.left, kRate, 150.0, 250.0, at(0.05), at(0.2)),
         dominant(hard_conga.left, kRate, 150.0, 250.0, at(0.05), at(0.2)));
    EXPECT(hard > 1.05 * soft, "Punch raises the pitch the congas start at");
  }

  // Snap: the kick's click, the snare's noise, the congas' slap, the bite of the hats and cymbals.
  {
    plain(device);
    device.set_param(p::kSnap, 0.0f);
    Stereo round = hit(device, C);
    plain(device);
    device.set_param(p::kSnap, 1.0f);
    Stereo clicked = hit(device, C);
    const double none = share_above(round.left, 2000.0, kRate, 0, at(0.01));
    const double some = share_above(clicked.left, 2000.0, kRate, 0, at(0.01));
    NOTE("snap: kick's first 10 ms above 2 kHz %.7f at 0, %.5f at 1\n", none, some);
    EXPECT(none < 2.0e-4, "Snap 0 leaves the kick without a click");
    EXPECT(some > 0.01 && some > 100.0 * none, "Snap puts a click on the kick");

    double noise_share[2], bite[2], front[2], wire_level[2], slap[2], crash_front[2], rim_click[2];
    int index = 0;
    for (float snap : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kSnap, snap);
      Stereo snare = hit(device, D);
      noise_share[index] = share_above(snare.left, 1000.0, kRate, 0, at(0.05));
      // The snares alone, without the tones under them.
      const std::vector<float> wires = highpassed(snare.left, 2000.0, kRate);
      front[index] = rms(wires, 0, at(0.001)) / rms(wires, at(0.006), at(0.012));
      wire_level[index] = rms(wires, at(0.02), at(0.1)) / tone_level(snare.left, midi_hz(55), kRate, at(0.01), at(0.06));
      plain(device);
      device.set_param(p::kSnap, snap);
      Stereo hat = hit(device, F);
      bite[index] = rms(hat.left, 0, at(0.0005)) / rms(hat.left, at(0.003), at(0.005));
      plain(device);
      device.set_param(p::kSnap, snap);
      Stereo conga = hit(device, A);
      slap[index] = share_above(conga.left, 800.0, kRate, 0, at(0.02));
      plain(device);
      device.set_param(p::kSnap, snap);
      Stereo crash = hit(device, Cs, 0.7f, 1.0f);
      crash_front[index] = db(rms(crash.left, at(0.005), at(0.025))) - db(rms(crash.left, at(0.4), at(0.5)));
      plain(device);
      device.set_param(p::kSnap, snap);
      Stereo rim = hit(device, E);
      rim_click[index] = share_above(rim.left, 2500.0, kRate, 0, at(0.004));
      ++index;
    }
    NOTE("snap: snare above 1 kHz %.3f at 0 and %.3f at 1, its snares against its lower tone %.3f and %.3f, their front %.3f and %.3f\n",
         noise_share[0], noise_share[1], wire_level[0], wire_level[1], front[0], front[1]);
    NOTE("snap: hat's first half ms against 3..5 ms %.3f and %.3f; conga above 800 Hz %.4f and %.4f; crash's front over its wash %.1f and %.1f dB; rim's click %.4f and %.4f\n",
         bite[0], bite[1], slap[0], slap[1], crash_front[0], crash_front[1], rim_click[0], rim_click[1]);
    EXPECT(noise_share[1] > 1.5 * noise_share[0] && wire_level[1] > 3.0 * wire_level[0],
           "Snap sets the snare's noise against its tones");
    EXPECT(bite[1] > 5.0 * bite[0] && bite[1] > 1.0, "Snap gives the hats their bite");
    EXPECT(slap[1] > 3.0 * slap[0], "Snap gives the congas their slap");
    EXPECT(crash_front[1] > crash_front[0] + 3.0, "Snap puts the stick on the crash");
    EXPECT(rim_click[1] > 3.0 * rim_click[0], "Snap puts the click on the rim");
    EXPECT(bite[0] < 0.2 && front[0] < 0.25 && front[1] > 3.0 * front[0], "at Snap 0 the noise drums start soft");
  }
}

// What a drum is across the four characters: how long it rings, where half
// its energy lies, and the frequency nine tenths of its energy lie under.
struct Print {
  double ring, median, top, peak_db;
};
static double top_hz(const std::vector<float>& x, double rate) {
  double lo = 20.0, hi = 22000.0;
  for (int i = 0; i < 14; ++i) {
    const double mid = std::sqrt(lo * hi);
    if (share_above(x, mid, rate) > 0.1) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return std::sqrt(lo * hi);
}
static double print_apart(const Print& a, const Print& b) {
  return std::fabs(std::log(a.ring / b.ring)) + std::fabs(std::log(a.median / b.median)) +
         std::fabs(std::log(a.top / b.top));
}

// 5. Drive, Volume and the four characters.
static void test_drive_and_kits() {
  // Drive: thicker and not louder.
  {
    plain(device);
    device.set_param(p::kSnap, 0.0f);
    Stereo clean = hit(device, C);
    plain(device);
    device.set_param(p::kSnap, 0.0f);
    device.set_param(p::kDrive, 1.0f);
    Stereo driven = hit(device, C);
    const double hz = dominant(clean.left, kRate, 30.0, 100.0, at(0.06), at(0.16));
    auto harmonic = [&](const Stereo& x, double n) {
      return tone_level(x.left, n * hz, kRate, at(0.06), at(0.16)) / tone_level(x.left, hz, kRate, at(0.06), at(0.16));
    };
    const double peak_change = db(peak(driven.left)) - db(peak(clean.left));
    const double body_change = db(rms(driven.left, 0, at(0.3))) - db(rms(clean.left, 0, at(0.3)));
    NOTE("drive: kick at %.1f Hz, third harmonic %.4f clean and %.4f driven, fifth %.4f and %.4f; peak %+.2f dB, rms %+.2f dB\n",
         hz, harmonic(clean, 3.0), harmonic(driven, 3.0), harmonic(clean, 5.0), harmonic(driven, 5.0), peak_change,
         body_change);
    // The kick has harmonics of its own: what Drive adds is read on a hard
    // conga, which is a sine once its slap is over.
    plain(device);
    Stereo conga = hit(device, A, 1.0f);
    plain(device);
    device.set_param(p::kDrive, 1.0f);
    Stereo conga_driven = hit(device, A, 1.0f);
    const double g3 = midi_hz(55);
    auto over = [&](const Stereo& x, double n) {
      return tone_level(x.left, n * g3, kRate, at(0.03), at(0.09)) / tone_level(x.left, g3, kRate, at(0.03), at(0.09));
    };
    NOTE("drive: a hard low conga's third harmonic %.5f clean and %.5f driven, second %.5f and %.5f\n", over(conga, 3.0),
         over(conga_driven, 3.0), over(conga, 2.0), over(conga_driven, 2.0));
    EXPECT(over(conga_driven, 3.0) > 0.0015 && over(conga_driven, 3.0) > 20.0 * over(conga, 3.0) &&
               over(conga_driven, 3.0) > 3.0 * over(conga_driven, 2.0),
           "Drive adds odd harmonics");
    EXPECT(std::fabs(peak_change) < 1.5, "Drive keeps the kick's peak within 1.5 dB");
    EXPECT(body_change > 1.0, "Drive thickens: the body comes up under the same peak");
    // Everything quieter than the kick comes up.
    plain(device);
    Stereo hat = hit(device, G);
    plain(device);
    device.set_param(p::kDrive, 1.0f);
    Stereo hat_driven = hit(device, G);
    const double hat_change = db(rms(hat_driven.left, 0, at(0.3))) - db(rms(hat.left, 0, at(0.3)));
    NOTE("drive: the open hat comes up %.1f dB\n", hat_change);
    EXPECT(hat_change > 3.0 && hat_change < 7.0, "Drive brings the quieter drums up");
    plain(device);
    device.set_param(p::kDrive, 1.0f);
    Stereo bar;
    busy_bar(device, 0.9f, &bar);
    plain(device);
    Stereo bar_clean;
    busy_bar(device, 0.9f, &bar_clean);
    NOTE("drive: busy bar peaks %.3f driven, %.3f clean; rms %+.1f dB\n", both_peak(bar), both_peak(bar_clean),
         db(rms(bar.left)) - db(rms(bar_clean.left)));
    EXPECT(db(both_peak(bar)) - db(both_peak(bar_clean)) < 1.5, "a driven bar is not louder at its peaks");
    EXPECT(db(rms(bar.left)) - db(rms(bar_clean.left)) > 1.0, "and it is thicker");
  }

  // Volume is the level it says.
  {
    plain(device);
    Stereo unity = hit(device, A);
    plain(device);
    device.set_param(p::kVolume, -12.0f);
    Stereo down = hit(device, A);
    EXPECT_NEAR(db(peak(down.left)) - db(peak(unity.left)), -12.0, 0.05, "Volume -12 dB is 12 dB down");
  }

  // Kit: four different kits, each in the direction it says.
  {
    Print prints[4][12];
    double kick_hz[4], kick_click[4], kick_third[4], kick_dust[4], snare_noise[4], hat_top[4], bell_top[4];
    for (int kit = 0; kit < 4; ++kit) {
      for (int key = 0; key < 12; ++key) {
        plain(device, kRate, kit);
        Stereo out = hit(device, key, 0.7f, 5.0f);
        prints[kit][key] = {ring_time(out.left, kRate, ring_window(key)), median_hz(out.left, kRate), top_hz(out.left, kRate),
                            db(both_peak(out))};
        if (key == C) {
          kick_hz[kit] = dominant(out.left, kRate, 30.0, 100.0, at(0.12), at(0.30));
          kick_click[kit] = share_above(out.left, 2000.0, kRate, 0, at(0.01));
          kick_third[kit] = tone_level(out.left, 3.0 * kick_hz[kit], kRate, at(0.06), at(0.16)) /
                            tone_level(out.left, kick_hz[kit], kRate, at(0.06), at(0.16));
          kick_dust[kit] = share_above(out.left, 1000.0, kRate, at(0.06), at(0.16));
        }
        if (key == D) {
          const std::vector<float> wires = highpassed(out.left, 1000.0, kRate);
          snare_noise[kit] = rms(wires, at(0.02), at(0.1)) / rms(out.left, 0, at(0.1));
        }
        if (key == F) hat_top[kit] = share_above(out.left, 9000.0, kRate);
        if (key == As) bell_top[kit] = share_above(out.left, 1500.0, kRate);
        NOTE("kit %-6s %-10s rings %.3f s, centre %6.0f Hz, nine tenths under %6.0f Hz, peaks %+.1f dB on Firm\n", kKits[kit],
             kNames[key], prints[kit][key].ring, prints[kit][key].median, prints[kit][key].top,
             prints[kit][key].peak_db - prints[0][key].peak_db);
      }
    }
    // No two characters are shades of one kit: taken over the twelve drums
    // any two of them are well apart, and no drum is the same in two.
    double nearest_pair = 1.0e9, nearest_drum = 1.0e9;
    int drum_at = 0, pair_a = 0, pair_b = 0;
    for (int a = 0; a < 4; ++a) {
      for (int b = a + 1; b < 4; ++b) {
        double sum = 0.0;
        for (int key = 0; key < 12; ++key) {
          const double d = print_apart(prints[a][key], prints[b][key]);
          sum += d;
          if (d < nearest_drum) {
            nearest_drum = d;
            drum_at = key;
          }
        }
        NOTE("kit: %s and %s are %.2f apart a drum on the average\n", kKits[a], kKits[b], sum / 12.0);
        if (sum / 12.0 < nearest_pair) {
          nearest_pair = sum / 12.0;
          pair_a = a;
          pair_b = b;
        }
      }
    }
    NOTE("kit: the two closest kits are %.2f apart a drum (%s and %s); the closest single drum is %.2f apart (%s)\n", nearest_pair,
         kKits[pair_a], kKits[pair_b], nearest_drum, kNames[drum_at]);
    EXPECT(nearest_pair > 0.35, "any two characters are well apart over the twelve drums");
    EXPECT(nearest_drum > 0.08, "no drum is the same in two characters");

    NOTE("kit: kick rests at %.2f / %.2f / %.2f / %.2f Hz, click %.5f / %.5f / %.5f / %.5f, third harmonic %.3f / %.3f / %.3f / %.3f, "
         "above 1 kHz in its body %.6f / %.6f / %.6f / %.6f\n",
         kick_hz[0], kick_hz[1], kick_hz[2], kick_hz[3], kick_click[0], kick_click[1], kick_click[2], kick_click[3],
         kick_third[0], kick_third[1], kick_third[2], kick_third[3], kick_dust[0], kick_dust[1], kick_dust[2], kick_dust[3]);
    NOTE("kit: snare's noise against the whole %.3f / %.3f / %.3f / %.3f; closed hat above 9 kHz %.3f / %.3f / %.3f / %.3f; "
         "cowbell above 1.5 kHz %.4f / %.4f / %.4f / %.4f\n",
         snare_noise[0], snare_noise[1], snare_noise[2], snare_noise[3], hat_top[0], hat_top[1], hat_top[2], hat_top[3],
         bell_top[0], bell_top[1], bell_top[2], bell_top[3]);
    const Print* firm = prints[0];
    const Print* deep = prints[1];
    const Print* dusty = prints[2];
    const Print* bright = prints[3];
    // Deep.
    EXPECT_NEAR(cents_from(kick_hz[1], kick_hz[0]), -200.0, 5.0, "Deep: the kick sits a whole tone lower, on F1");
    EXPECT(deep[C].ring > 1.3 * firm[C].ring && kick_click[1] < 0.5 * kick_click[0] && kick_third[1] < 0.7 * kick_third[0],
           "Deep: a longer, rounder kick with little click");
    EXPECT(deep[F].median < 0.85 * firm[F].median && deep[G].median < 0.85 * firm[G].median &&
               deep[F].peak_db < firm[F].peak_db - 1.5 && deep[G].peak_db < firm[G].peak_db - 1.5,
           "Deep: darker, quieter hats");
    EXPECT(deep[Gs].median < 0.85 * firm[Gs].median && deep[D].top < 0.75 * firm[D].top, "Deep: a darker clap and snare");
    EXPECT(deep[A].ring > 1.25 * firm[A].ring && deep[B].ring > 1.25 * firm[B].ring, "Deep: longer congas");
    // Dusty.
    EXPECT(dusty[F].top < 0.75 * firm[F].top && dusty[G].top < 0.75 * firm[G].top && dusty[Cs].top < 0.75 * firm[Cs].top &&
               hat_top[2] < 0.3 * hat_top[0],
           "Dusty: reduced bandwidth on the tops");
    EXPECT(dusty[C].ring < 0.95 * firm[C].ring && dusty[C].ring > 0.8 * firm[C].ring && kick_third[2] > 1.25 * kick_third[0],
           "Dusty: a slightly shorter and thicker kick");
    EXPECT(kick_dust[2] > 20.0 * kick_dust[0] && snare_noise[2] > 1.1 * snare_noise[0], "Dusty: more noise");
    EXPECT(dusty[D].top < 0.75 * firm[D].top && dusty[Gs].top < 0.85 * firm[Gs].top && bell_top[2] < 0.7 * bell_top[0],
           "Dusty: duller edges");
    // Bright.
    EXPECT(bright[F].median > 1.15 * firm[F].median && bright[G].median > 1.15 * firm[G].median &&
               bright[Cs].median > 1.15 * firm[Cs].median && bright[F].peak_db > firm[F].peak_db + 1.5 &&
               bright[G].peak_db > firm[G].peak_db + 1.5 && bright[Cs].peak_db > firm[Cs].peak_db + 1.0 &&
               bright[Ds].peak_db > firm[Ds].peak_db + 1.0,
           "Bright: brighter, louder hats and cymbals");
    EXPECT(snare_noise[3] > 1.2 * snare_noise[0], "Bright: more noise on the snare");
    EXPECT(bright[C].ring < 0.87 * firm[C].ring && kick_click[3] > 1.3 * kick_click[0], "Bright: a shorter kick with more click");
    // Every character keeps the kick the strongest drum, and no drum strays far.
    for (int kit = 0; kit < 4; ++kit) {
      for (int key = 1; key < 12; ++key) {
        if (prints[kit][key].peak_db > prints[kit][C].peak_db - 1.0 ||
            std::fabs(prints[kit][key].peak_db - prints[0][key].peak_db) > 4.0) {
          std::printf("FAIL: %s kit: the %s peaks %.1f dB (kick %.1f, Firm's %.1f)\n", kKits[kit], kNames[key],
                      prints[kit][key].peak_db, prints[kit][C].peak_db, prints[0][key].peak_db);
          ++testkit::failures();
        }
      }
    }
  }
}

// 6. Velocity, and a note that is no note.
static void test_velocity() {
  for (int key : {C, Cs, D, E, F, Gs, A, As}) {
    char label[120];
    // A drum of tones is read by how much of it lies above them, a drum of
    // noise by where the middle of its energy is.
    const double above = key == C || key == A ? 300.0 : key == E ? 2500.0 : key == As ? 1500.0 : 0.0;
    plain(device);
    Stereo soft = hit(device, key, 0.2f);
    plain(device);
    Stereo hard = hit(device, key, 1.0f);
    const double level = db(peak(hard.left)) - db(peak(soft.left));
    const double dull = above > 0.0 ? share_above(soft.left, above, kRate, 0, at(0.03)) : median_hz(soft.left, kRate);
    const double bright = above > 0.0 ? share_above(hard.left, above, kRate, 0, at(0.03)) : median_hz(hard.left, kRate);
    NOTE("velocity: %-10s hard is %+.1f dB on soft; brightness %.4g soft, %.4g hard\n", kNames[key], level, dull,
         bright);
    std::snprintf(label, sizeof label, "a soft %s is quieter", kNames[key]);
    EXPECT(level > 6.0 && level < 16.0, label);
    std::snprintf(label, sizeof label, "a soft %s is duller", kNames[key]);
    EXPECT(bright > 1.1 * dull, label);
  }
  // The level law: 0.25 + 0.75 * gain, read on the kick without its click.
  plain(device);
  device.set_param(p::kSnap, 0.0f);
  const double low = rms(hit(device, C, 0.0f).left, at(0.1), at(0.2));
  plain(device);
  device.set_param(p::kSnap, 0.0f);
  const double full = rms(hit(device, C, 1.0f).left, at(0.1), at(0.2));
  NOTE("velocity: the kick's body at gain 0 is %.3f of gain 1\n", low / full);
  EXPECT_NEAR(low / full, 0.25, 0.02, "the quietest hit is a quarter of the loudest");
  // Gains outside 0..1 are the nearest end.
  plain(device);
  Stereo loudest = hit(device, D, 1.0f);
  plain(device);
  Stereo beyond = hit(device, D, 2.5f);
  plain(device);
  Stereo quietest = hit(device, D, 0.0f);
  plain(device);
  Stereo below = hit(device, D, -3.0f);
  EXPECT(beyond.left == loudest.left && below.left == quietest.left && rms(below.left) > 0.0,
         "a gain outside 0..1 is clamped");

  // A note that is no note takes no slot and leaves the kit as it was: a
  // frequency or a gain that is not a finite number, a frequency not above 0.
  const float nan = std::nanf(""), inf = std::numeric_limits<float>::infinity();
  struct Bad {
    float hz, gain;
    const char* what;
  };
  const Bad bad[] = {{nan, 0.7f, "a frequency that is not a number"},
                     {inf, 0.7f, "an infinite frequency"},
                     {-inf, 0.7f, "a frequency of minus infinity"},
                     {0.0f, 0.7f, "a frequency of zero"},
                     {-100.0f, 0.7f, "a negative frequency"},
                     {key_hz(D), nan, "a gain that is not a number"},
                     {key_hz(D), inf, "an infinite gain"},
                     {key_hz(D), -inf, "a gain of minus infinity"}};
  plain(other);
  Stereo fresh = hit(other, D, 0.7f, 0.3f);
  for (const Bad& b : bad) {
    char label[160];
    plain(device);
    device.note_on(1, b.hz, b.gain);
    const int taken = device.sounding();
    Stereo out = render(device, 0.3f, kRate);
    const bool silent = finite(out.left) && finite(out.right) && peak(out.left) == 0.0 && peak(out.right) == 0.0;
    Stereo next = hit(device, D, 0.7f, 0.3f);
    NOTE("bad note: %s takes %d slots, output %s, the next snare %s\n", b.what, taken, silent ? "silent" : "NOT silent",
         next.left == fresh.left ? "as a fresh one" : "DIFFERENT");
    std::snprintf(label, sizeof label, "a note with %s is dropped", b.what);
    EXPECT(taken == 0 && silent && device.sounding() <= 1 && next.left == fresh.left && next.right == fresh.right, label);
  }
  // A frequency far outside the keyboard is a key of the octave all the same,
  // and what it plays is finite and bounded.
  for (float hz : {1.0e-6f, 3.0f, 30000.0f, 1.0e9f}) {
    char label[120];
    plain(device);
    device.note_on(1, hz, 1.0f);
    Stereo out = render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label, "a note at %g Hz plays a drum and stays bounded", static_cast<double>(hz));
    EXPECT(finite(out.left) && finite(out.right) && both_peak(out) < 1.0 && rms(out.left) > 0.0, label);
  }
}

// 7. Variation: none repeats exactly, a little is a little, all of it differs
// within about 6 dB.
static void test_variation() {
  for (int key = 0; key < 12; ++key) {
    char label[120];
    // Long enough for the hit before to have ended: the cymbals ring on.
    const float seconds = key == Cs ? 6.0f : key == Ds ? 3.5f : 1.5f;
    plain(device);
    Stereo first = hit(device, key, 0.7f, seconds);
    Stereo second = hit(device, key, 0.7f, seconds);
    Stereo third = hit(device, key, 0.7f, seconds);
    std::snprintf(label, sizeof label, "with Variation at 0 every %s is the same sample for sample", kNames[key]);
    EXPECT(first.left == second.left && first.right == second.right && second.left == third.left &&
               second.right == third.right && rms(first.left) > 0.0,
           label);
  }
  for (int key : {C, D, F, Gs, A, Ds}) {
    char label[120];
    const float seconds = key == Ds ? 3.0f : 2.0f;
    // The default: a hit is nearly the hit before.
    device.init(kRate);
    double low = 1.0e9, high = -1.0e9, nearest = 1.0e9, furthest = 0.0;
    Stereo last;
    for (int n = 0; n < 16; ++n) {
      Stereo out = hit(device, key, 0.7f, seconds);
      const double level = db(both_peak(out));
      low = std::min(low, level);
      high = std::max(high, level);
      if (n > 0) {
        nearest = std::min(nearest, distance(out.left, last.left));
        furthest = std::max(furthest, distance(out.left, last.left));
      }
      last = out;
    }
    NOTE("variation at its default: %-10s peaks over %.2f dB in 16 hits, a hit %.3f to %.3f from the one before\n",
         kNames[key], high - low, nearest, furthest);
    std::snprintf(label, sizeof label, "at the default Variation no two hits of the %s are the same", kNames[key]);
    EXPECT(nearest > 0.001, label);
    std::snprintf(label, sizeof label, "at the default Variation the %s peaks within 2 dB", kNames[key]);
    EXPECT(high - low < 2.0, label);

    device.init(kRate);
    device.set_param(p::kVariation, 1.0f);
    double quietest = 1.0e9, loudest = -1.0e9, shortest = 1.0e9, longest = 0.0, dullest = 1.0e9, brightest = 0.0;
    double least = 1.0e9;
    for (int n = 0; n < 16; ++n) {
      Stereo out = hit(device, key, 0.7f, seconds);
      const double level = db(rms(out.left, 0, at(0.25)));
      const double window = ring_window(key);
      quietest = std::min(quietest, level);
      loudest = std::max(loudest, level);
      shortest = std::min(shortest, ring_time(out.left, kRate, window));
      longest = std::max(longest, ring_time(out.left, kRate, window));
      const double centre = median_hz(out.left, kRate);
      dullest = std::min(dullest, centre);
      brightest = std::max(brightest, centre);
      if (n > 0) least = std::min(least, distance(out.left, last.left));
      last = out;
    }
    NOTE("variation 1: %-10s level over %.1f dB, ring %.3f..%.3f s, centre %.0f..%.0f Hz, closest pair %.3f apart\n",
         kNames[key], loudest - quietest, shortest, longest, dullest, brightest, least);
    std::snprintf(label, sizeof label, "with Variation at 1 no two hits of the %s are alike", kNames[key]);
    EXPECT(least > 0.02 && loudest - quietest > 0.8, label);
    std::snprintf(label, sizeof label, "with Variation at 1 the %s stays within 6 dB", kNames[key]);
    EXPECT(loudest - quietest < 6.0, label);
    std::snprintf(label, sizeof label, "Variation changes how long the %s rings", kNames[key]);
    EXPECT(longest > 1.1 * shortest && longest < 1.6 * shortest, label);
  }
  // The tuning: a few cents at the most, and under two at the default.
  for (float variation : {1.0f, 0.08f}) {
    double flattest = 1.0e9, sharpest = -1.0e9;
    device.init(kRate);
    device.set_param(p::kVariation, variation);
    device.set_param(p::kLength, 4.0f);
    for (int n = 0; n < 16; ++n) {
      const double hz = dominant(hit(device, A, 0.7f, 2.0f).left, kRate, 170.0, 225.0, at(0.08), at(0.5));
      const double cents = cents_from(hz, midi_hz(55));
      flattest = std::min(flattest, cents);
      sharpest = std::max(sharpest, cents);
    }
    NOTE("variation %.2f: low conga tuned from %+.2f to %+.2f cents\n", static_cast<double>(variation), flattest,
         sharpest);
    if (variation == 1.0f) {
      EXPECT(sharpest - flattest > 10.0 && sharpest < 22.0 && flattest > -22.0,
             "Variation moves the tuning of each hit by a few cents");
    } else {
      EXPECT(sharpest - flattest > 0.5 && sharpest < 2.0 && flattest > -2.0,
             "at the default Variation a drum stays within two cents of its key");
    }
  }
  // The noise: how much of it is new follows Variation. Two shakers, with
  // the level, tone and length they drew taken out by reading how alike the
  // two waves are.
  {
    double alike[3] = {0.0, 0.0, 0.0};
    const float amounts[3] = {0.08f, 0.5f, 1.0f};
    for (int n = 0; n < 3; ++n) {
      device.init(kRate);
      device.set_param(p::kVariation, amounts[n]);
      Stereo a = hit(device, Fs, 0.7f, 0.5f);
      Stereo b = hit(device, Fs, 0.7f, 0.5f);
      alike[n] = correlation(a.left, b.left, 0, at(0.05));
    }
    NOTE("variation: two shakers are %.3f alike at 0.08, %.3f at 0.5, %.3f at 1\n", alike[0], alike[1], alike[2]);
    EXPECT(alike[0] > 0.9 && alike[0] < 0.9999, "a little Variation leaves the noise nearly the same");
    EXPECT(alike[1] < alike[0] - 0.1 && alike[1] > 0.4, "half of it mixes in a share of new noise");
    EXPECT(std::fabs(alike[2]) < 0.2, "and all of it leaves nothing of the noise before");
  }
  // The same notes always give the same audio, whatever came before init.
  for (float variation : {0.08f, 1.0f}) {
    device.init(kRate);
    device.set_param(p::kVariation, variation);
    Stereo once;
    busy_bar(device, 0.8f, &once);
    hit(device, Cs, 1.0f, 0.3f);
    device.set_param(p::kKit, 2.0f);
    device.init(kRate);
    device.set_param(p::kVariation, variation);
    Stereo again;
    busy_bar(device, 0.8f, &again);
    EXPECT(once.left == again.left && once.right == again.right && rms(once.left) > 0.0,
           "the same notes give the same audio after init");
  }
}

// 8. Width: 0 is mono, the kick and the snare stay in the centre.
static void test_width() {
  for (int kit = 0; kit < 4; ++kit) {
    char label[120];
    device.init(kRate);
    device.set_param(p::kKit, static_cast<float>(kit));
    device.set_param(p::kWidth, 0.0f);
    device.set_param(p::kDrive, 0.5f);
    Stereo mono;
    busy_bar(device, 0.9f, &mono);
    std::snprintf(label, sizeof label, "Width 0 is exactly mono on the %s kit", kKits[kit]);
    EXPECT(mono.left == mono.right && rms(mono.left) > 0.0, label);
    for (int key : {C, D}) {
      device.init(kRate);
      device.set_param(p::kKit, static_cast<float>(kit));
      device.set_param(p::kWidth, 1.0f);
      Stereo out = hit(device, key);
      std::snprintf(label, sizeof label, "the %s is in the centre at Width 1 on the %s kit", kNames[key], kKits[kit]);
      EXPECT(out.left == out.right && rms(out.left) > 0.0, label);
    }
  }
  struct Placed {
    int key;
    double pan;  // of the way to one side at Width 1, right positive
  };
  const Placed placed[] = {{Ds, 0.30}, {E, -0.25}, {F, 0.35}, {Fs, -0.45}, {G, 0.40}, {A, -0.35}, {As, 0.45}, {B, 0.35}};
  for (const Placed& v : placed) {
    char label[120];
    plain(device);
    device.set_param(p::kWidth, 1.0f);
    Stereo wide = hit(device, v.key);
    plain(device);
    device.set_param(p::kWidth, 0.4f);
    Stereo part = hit(device, v.key);
    const double full = db(rms(wide.right)) - db(rms(wide.left));
    const double some = db(rms(part.right)) - db(rms(part.left));
    const double expected = db((1.0 + v.pan) / (1.0 - v.pan));
    NOTE("width: %-10s right over left %+.1f dB at 1 (%+.1f expected), %+.1f dB at 0.4\n", kNames[v.key], full,
         expected, some);
    std::snprintf(label, sizeof label, "the %s sits to its side at Width 1", kNames[v.key]);
    EXPECT_NEAR(full, expected, 0.3, label);
    std::snprintf(label, sizeof label, "the %s sits nearer the centre at Width 0.4", kNames[v.key]);
    EXPECT(std::fabs(some) > 0.8 && std::fabs(some) < 0.6 * std::fabs(full) && some * full > 0.0, label);
  }
  // The crash and the clap are wide: their sides are sound of their own.
  for (int key : {Cs, Gs}) {
    char label[120];
    plain(device);
    device.set_param(p::kWidth, 1.0f);
    Stereo wide = hit(device, key, 0.7f, 3.0f);
    plain(device);
    Stereo usual = hit(device, key, 0.7f, 3.0f);
    plain(device);
    device.set_param(p::kWidth, 0.0f);
    Stereo narrow = hit(device, key, 0.7f, 3.0f);
    const double lean = db(rms(wide.right)) - db(rms(wide.left));
    NOTE("width: %-5s left and right correlate %.3f at 1, %.3f at the default, right over left %+.1f dB at 1\n",
         kNames[key], correlation(wide.left, wide.right), correlation(usual.left, usual.right), lean);
    std::snprintf(label, sizeof label, "the %s is wide at Width 1", kNames[key]);
    EXPECT(correlation(wide.left, wide.right) < 0.6, label);
    std::snprintf(label, sizeof label, "the %s is less wide at the default", kNames[key]);
    EXPECT(correlation(usual.left, usual.right) > correlation(wide.left, wide.right) + 0.15 &&
               correlation(usual.left, usual.right) < 0.97,
           label);
    std::snprintf(label, sizeof label, "the %s is mono at Width 0", kNames[key]);
    EXPECT(narrow.left == narrow.right && rms(narrow.left) > 0.0, label);
    std::snprintf(label, sizeof label, "the %s leans to its side", kNames[key]);
    EXPECT(key == Cs ? (lean < -1.5 && lean > -5.0) : (lean > 0.5 && lean < 3.0), label);
  }
}

// 9. A drum struck again, and the choke.
static void test_retrigger() {
  auto soft_kit = [](ClubKit& d) {
    plain(d);
    d.set_param(p::kSnap, 0.0f);
  };
  for (int key : {C, Cs, Ds, G, A, As}) {
    char label[160];
    soft_kit(device);
    Stereo single = hit(device, key, 0.8f, 1.0f);
    soft_kit(device);
    Stereo roll;
    for (int n = 0; n < 50; ++n) {
      device.note_on(n, key_hz(key), 0.8f);
      Stereo part = render(device, 0.02f, kRate);
      roll = n == 0 ? part : concat(roll, part);
    }
    Stereo after = render(device, 12.0f, kRate);
    const double step = std::max(max_step(roll.left), max_step(roll.right));
    const double own = std::max(max_step(single.left), max_step(single.right));
    NOTE("retrigger: %-10s every 20 ms: largest step %.5f (one hit %.5f), peak %.3f (one hit %.3f)\n", kNames[key],
         step, own, both_peak(roll), both_peak(single));
    // The new hit's attack lies over what is left of the old one, so the two
    // slopes can add up; a cut would be the old hit's whole level in one step.
    std::snprintf(label, sizeof label, "the %s struck every 20 ms makes no click (%.2f times its own attack)",
                  kNames[key], step / own);
    EXPECT(step < 2.0 * own, label);
    std::snprintf(label, sizeof label, "the %s struck every 20 ms stays bounded", kNames[key]);
    EXPECT(both_peak(roll) < 1.6 * both_peak(single), label);
    EXPECT(peak(after.left, at(11.0)) == 0.0 && device.sounding() == 0, "and the kit is silent after the roll");
  }

  // The older hit is let go, not left to pile up: a roll of the crash is no
  // louder at its end than at its start.
  soft_kit(device);
  Stereo roll;
  for (int n = 0; n < 50; ++n) {
    device.note_on(n, key_hz(Cs), 0.8f);
    Stereo part = render(device, 0.02f, kRate);
    roll = n == 0 ? part : concat(roll, part);
  }
  NOTE("retrigger: crash roll rms %.4f in its first 100 ms, %.4f in its last, %d slots sounding\n",
       rms(roll.left, at(0.02), at(0.12)), rms(roll.left, at(0.9), at(1.0)), device.sounding());
  EXPECT(rms(roll.left, at(0.9), at(1.0)) < 1.5 * rms(roll.left, at(0.02), at(0.12)) && device.sounding() <= 2,
         "a drum struck again lets its older hit go");

  // The fade of the older hit begins gradually, and so does the end of a
  // slot taken a third time inside that fade.
  const double again = suddenness(
      [&](ClubKit& d) {
        soft_kit(d);
        d.note_on(1, key_hz(C), 0.8f);
      },
      [](ClubKit& d) { d.note_on(2, key_hz(C, 2), 0.0f); });
  NOTE("retrigger: a second strike is %.3f there after 8 samples\n", again);
  EXPECT(again < 0.2, "the older hit fades, it is not cut");
  const double thrice = suddenness(
      [&](ClubKit& d) {
        soft_kit(d);
        d.note_on(1, key_hz(C), 0.8f);
        render(d, 0.03f, kRate);
        d.note_on(2, key_hz(C, 2), 0.0f);
        render(d, 0.001f, kRate);
      },
      [](ClubKit& d) { d.note_on(3, key_hz(C, 2), 0.0f); }, 0.0);
  NOTE("retrigger: a third strike inside the fade is %.3f there after 8 samples\n", thrice);
  EXPECT(thrice < 0.3, "a slot taken while it still sounds leaves no step");
  // What the second strike leaves of the first is the first, fading: the
  // rim struck twice 10 ms apart, less the second strike alone.
  {
    plain(device);
    Stereo once = hit(device, E, 0.8f, 0.2f);
    plain(device);
    device.note_on(1, key_hz(E), 0.8f);
    Stereo head = render(device, 0.01f, kRate);
    Stereo twice = concat(head, hit(device, E, 0.8f, 0.19f));
    std::vector<float> remains(twice.size());
    for (size_t i = 0; i < remains.size(); ++i) {
      remains[i] = twice.left[i] - (i >= at(0.01) ? once.left[i - at(0.01)] : 0.0f);
    }
    const double shape = correlation(remains, once.left, at(0.01), at(0.013));
    const double at_1ms = rms(remains, at(0.0105), at(0.0115)) / rms(once.left, at(0.0105), at(0.0115));
    const double at_6ms = rms(remains, at(0.016), at(0.018)) / rms(once.left, at(0.016), at(0.018));
    NOTE("retrigger: the first rim is %.3f of itself 1 ms after the second, %.5f 6 ms after, and still its own shape (%.3f)\n",
         at_1ms, at_6ms, shape);
    EXPECT(shape > 0.9 && at_1ms > 0.5 && at_1ms < 0.99, "the older hit fades over a few milliseconds in its own slot");
    EXPECT(at_6ms < 0.01, "and is gone 6 ms on");
  }

  // Different drums never take each other's slots: a low conga under the
  // eleven other drums, less those eleven alone, is the conga alone (the
  // kit is linear under the clip's knee).
  {
    plain(device);
    Stereo conga = hit(device, A, 0.7f, 0.5f);
    plain(device);
    device.note_on(1, key_hz(A), 0.7f);
    Stereo start = render(device, 0.05f, kRate);
    for (int key : {C, Cs, D, Ds, E, F, Fs, G, Gs, As, B}) device.note_on(10 + key, key_hz(key), 0.2f);
    const int sounding = device.sounding();
    Stereo crowded = concat(start, render(device, 0.45f, kRate));
    plain(device);
    Stereo lead = render(device, 0.05f, kRate);
    for (int key : {C, Cs, D, Ds, E, F, Fs, G, Gs, As, B}) device.note_on(10 + key, key_hz(key), 0.2f);
    Stereo others = concat(lead, render(device, 0.45f, kRate));
    double worst = 0.0;
    for (size_t i = 0; i < crowded.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(crowded.left[i]) - others.left[i] - conga.left[i]));
    }
    NOTE("slots: a low conga under eleven other drums is %g from itself alone, %d slots sounding\n", worst, sounding);
    EXPECT(worst < 1.0e-6 && sounding == 12, "other drums do not take a ringing drum's slot");
  }

  // The choke: a closed hat ends a ringing open hat, and nothing else does.
  plain(device);
  Stereo ringing = hit(device, G, 0.7f, 0.5f);
  const double alone = rms(ringing.left, at(0.15), at(0.17));
  NOTE("choke: an open hat alone is %.1f dB under its start at 150 ms\n",
       db(alone) - db(rms(ringing.left, at(0.005), at(0.025))));
  EXPECT(alone > 0.05 * rms(ringing.left, at(0.005), at(0.025)), "an open hat alone still rings at 150 ms");
  for (int key = 0; key < 12; ++key) {
    if (key == G) continue;
    char label[120];
    plain(device);
    device.note_on(1, key_hz(G), 0.7f);
    Stereo before = render(device, 0.05f, kRate);
    device.note_on(2, key_hz(key), 0.7f);
    Stereo choked = concat(before, render(device, 0.45f, kRate));
    // The other drum alone, at the same moment: taken off, what is left
    // is the open hat (the kit is linear under the clip's knee).
    plain(device);
    Stereo lead = render(device, 0.05f, kRate);
    Stereo closer = concat(lead, hit(device, key, 0.7f, 0.45f));
    std::vector<float> left_over(choked.size());
    for (size_t i = 0; i < left_over.size(); ++i) left_over[i] = choked.left[i] - closer.left[i];
    const double at_2ms = rms(left_over, at(0.0515), at(0.0525)) / rms(ringing.left, at(0.0515), at(0.0525));
    const double at_10ms = rms(left_over, at(0.059), at(0.061)) / rms(ringing.left, at(0.059), at(0.061));
    const double at_150 = rms(left_over, at(0.15), at(0.17)) / alone;
    NOTE("choke by %-10s: the open hat is %.3f of itself 2 ms on, %.5f 10 ms on, %.6f at 150 ms\n", kNames[key], at_2ms,
         at_10ms, at_150);
    if (key == F) {
      EXPECT(at_150 < 0.0316, "a closed hat 50 ms into an open hat leaves it 30 dB down by 150 ms");
      EXPECT(at_2ms > 0.5 && at_2ms < 0.98 && at_10ms < 0.01, "a closed hat chokes the open hat in about 8 ms");
    } else {
      std::snprintf(label, sizeof label, "a %s leaves a ringing open hat as it was", kNames[key]);
      EXPECT_NEAR(at_2ms, 1.0, 0.001, label);
      EXPECT_NEAR(at_10ms, 1.0, 0.001, label);
      EXPECT_NEAR(at_150, 1.0, 0.001, label);
    }
  }
  // The choke reaches both of the open hat's slots: struck twice, the hat
  // rings in its second slot and is choked there as it is in the first.
  {
    plain(device);
    device.note_on(1, key_hz(G), 0.7f);
    Stereo first = render(device, 0.03f, kRate);
    device.note_on(2, key_hz(G), 0.7f);
    Stereo second = concat(first, render(device, 0.03f, kRate));
    device.note_on(3, key_hz(F), 0.7f);
    Stereo choked = concat(second, render(device, 0.44f, kRate));
    plain(device);
    Stereo lead = render(device, 0.06f, kRate);
    Stereo closer = concat(lead, hit(device, F, 0.7f, 0.44f));
    std::vector<float> left_over(choked.size());
    for (size_t i = 0; i < left_over.size(); ++i) left_over[i] = choked.left[i] - closer.left[i];
    // The second hat is 30 ms old when it is choked: held against the lone hat 30 ms earlier.
    const double unchoked = rms(ringing.left, at(0.12), at(0.14));
    const double at_150 = rms(left_over, at(0.15), at(0.17)) / unchoked;
    const double at_2ms = rms(left_over, at(0.0615), at(0.0625)) / rms(ringing.left, at(0.0315), at(0.0325));
    NOTE("choke of the second slot: the open hat is %.3f of itself 2 ms on, %.6f at 150 ms\n", at_2ms, at_150);
    EXPECT(at_150 < 0.0316 && at_2ms > 0.5 && at_2ms < 0.98, "the choke reaches an open hat ringing in its second slot");
  }
  // A closed hat does not choke itself away, and an open hat struck after
  // the choke rings as a fresh one.
  {
    plain(device);
    device.note_on(1, key_hz(G), 0.7f);
    render(device, 0.05f, kRate);
    device.note_on(2, key_hz(F), 0.7f);
    render(device, 0.05f, kRate);
    Stereo next = hit(device, G, 0.7f, 0.5f);
    double worst = 0.0;
    for (size_t i = at(0.06); i < next.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(next.left[i]) - ringing.left[i]));
    }
    NOTE("choke: an open hat struck after the choke is %g from a fresh one once the closed hat has ended\n", worst);
    EXPECT(worst < 1.0e-6 && rms(next.left, at(0.15), at(0.17)) > 0.9 * alone, "an open hat struck after a choke rings on");
  }
  // An open hat struck again: the older one is gone in 4 ms and what is left
  // is the new hit alone, sample for sample.
  {
    plain(device);
    device.note_on(1, key_hz(G), 0.7f);
    Stereo head = render(device, 0.1f, kRate);
    Stereo twice = concat(head, hit(device, G, 0.7f, 0.4f));
    double early = 0.0, late = 0.0;
    for (size_t i = at(0.1); i < twice.size(); ++i) {
      const double d = std::fabs(static_cast<double>(twice.left[i]) - ringing.left[i - at(0.1)]);
      if (i < at(0.102)) early = std::max(early, d);
      if (i >= at(0.106)) late = std::max(late, d);
    }
    NOTE("retrigger: open hat struck again: %.5f of the older one in the first 2 ms, %g 6 ms on\n", early, late);
    EXPECT(early > 1.0e-4 && late < 1.0e-6, "an open hat struck again lets its older hit go in 4 ms");
  }

  // A fade is never slowed by a later, slower one: an open hat struck again
  // and choked a millisecond on still loses its older hit in 4 ms, not in 8.
  {
    auto hats = [&](bool with_first) {
      plain(device);
      std::vector<Event> events;
      if (with_first) events.push_back({0, [](ClubKit& d) { d.note_on(1, key_hz(G), 0.7f); }});
      events.push_back({at(0.03), [](ClubKit& d) { d.note_on(2, key_hz(G), 0.7f); }});
      events.push_back({at(0.031), [](ClubKit& d) { d.note_on(3, key_hz(F), 0.7f); }});
      return play(device, events, at(0.08), {64});
    };
    Stereo all = hats(true);
    Stereo rest = hats(false);
    double fading = 0.0, gone = 0.0;
    for (size_t i = at(0.031); i < at(0.038); ++i) {
      const double d = std::fabs(static_cast<double>(all.left[i]) - rest.left[i]);
      if (i < at(0.033)) fading = std::max(fading, d);
      if (i >= at(0.0345)) gone = std::max(gone, d);
    }
    NOTE("fades: the older open hat is %.5f while it fades, %g half a millisecond after its 4 ms\n", fading, gone);
    EXPECT(fading > 1.0e-4 && gone < 1.0e-6, "a choke does not slow a fade that is already quicker");
  }

  // What a retaken slot leaves is gone in about 8 ms: the kick struck three
  // times a millisecond apart, less the third strike alone.
  {
    soft_kit(device);
    Stereo once = hit(device, C, 0.8f, 0.2f);
    soft_kit(device);
    const std::vector<Event> events = {{0, [](ClubKit& d) { d.note_on(1, key_hz(C), 0.8f); }},
                                       {48, [](ClubKit& d) { d.note_on(2, key_hz(C), 0.8f); }},
                                       {96, [](ClubKit& d) { d.note_on(3, key_hz(C), 0.8f); }}};
    Stereo thrice_kick = play(device, events, at(0.1), {64});
    std::vector<float> remains(thrice_kick.size(), 0.0f);
    for (size_t i = 96; i < remains.size(); ++i) remains[i] = thrice_kick.left[i] - once.left[i - 96];
    const double left = peak(remains, 96, 96 + at(0.001));
    const double at_5ms = peak(remains, 96 + at(0.0045), 96 + at(0.0055));
    const double at_16ms = peak(remains, 96 + at(0.016), 96 + at(0.020));
    NOTE("carry: a retaken slot leaves %.4f, %.5f of it 5 ms on, %.7f 16 ms on\n", left, at_5ms / left, at_16ms / left);
    EXPECT(left > 0.003 && at_5ms > 1.0e-3 * left && at_5ms < 0.1 * left && at_16ms < 1.0e-4 * left,
           "what a retaken slot leaves dies away in about 8 ms");
  }

  // The choke is a fade: with and without a closed hat that is too quiet and
  // too high to be heard in the difference, on every Kit.
  for (int kit = 0; kit < 4; ++kit) {
    char label[120];
    const double choke = suddenness(
        [kit](ClubKit& d) {
          plain(d, kRate, kit);
          d.set_param(p::kWidth, 0.0f);
          d.note_on(1, key_hz(G), 0.7f);
        },
        [](ClubKit& d) { d.note_on(2, key_hz(F, 2), 0.0f); });
    NOTE("choke on the %s kit: %.3f there after 8 samples\n", kKits[kit], choke);
    std::snprintf(label, sizeof label, "the choke is a fade of some milliseconds, not a cut, on the %s kit", kKits[kit]);
    EXPECT(choke < 0.3, label);
  }
}

// 10. Levels: every drum at gain 0.7 in its window under the kick, on every
// Kit, and a busy bar under the top of the clip's knee.
static void test_levels() {
  // How far under the kick a drum peaks, in dB: the nearest and the furthest.
  struct Window {
    double nearest, furthest;
  };
  const Window windows[12] = {{0.0, 0.0},  {4.0, 7.0},  {2.0, 4.0},  {6.0, 10.0}, {6.0, 10.0}, {6.0, 10.0},
                              {10.0, 13.0}, {6.0, 10.0}, {2.0, 4.0},  {4.0, 7.0},  {6.0, 10.0}, {4.0, 7.0}};
  for (int kit = 0; kit < 4; ++kit) {
    // The other Kits move a drum up or down by what makes them that Kit
    // (the Deep kit's tops are quieter, the Bright kit's louder): 2 dB more
    // room at either end, and the kick stays the loudest drum.
    const double room = kit == 0 ? 0.0 : 2.0;
    double first[12], steady[12], mean[12], lowest[12], highest[12], body[12];
    for (int key = 0; key < 12; ++key) {
      const float seconds = key == Cs ? 6.0f : key == Ds ? 3.5f : 2.0f;
      device.init(kRate);  // the defaults, Variation included
      device.set_param(p::kKit, static_cast<float>(kit));
      double sum = 0.0;
      lowest[key] = 1.0e9;
      highest[key] = -1.0e9;
      for (int n = 0; n < 12; ++n) {
        const double level = db(both_peak(hit(device, key, 0.7f, seconds)));
        if (n == 0) first[key] = level;
        sum += level;
        lowest[key] = std::min(lowest[key], level);
        highest[key] = std::max(highest[key], level);
      }
      mean[key] = sum / 12.0;
      plain(device, kRate, kit);
      Stereo out = hit(device, key, 0.7f, seconds);
      steady[key] = db(both_peak(out));
      const double ring = ring_time(out.left, kRate, ring_window(key));
      body[key] = db(rms(mid_of(out), 0, at(ring)));
      NOTE("level, %-6s: %-10s peaks %6.1f dBFS at the defaults (%6.1f to %6.1f over 12 hits, %6.1f with Variation 0), "
           "rms %6.1f dBFS over its %.3f s\n",
           kKits[kit], kNames[key], first[key], lowest[key], highest[key], steady[key], body[key], ring);
    }
    char label[200];
    std::snprintf(label, sizeof label, "one kick at gain 0.7 peaks between -12 and -10 dBFS on the %s kit (%.1f)",
                  kKits[kit], first[C]);
    EXPECT(lowest[C] > -12.0 && highest[C] < -10.0 && steady[C] > -12.0 && steady[C] < -10.0, label);
    for (int key = 1; key < 12; ++key) {
      const double under = mean[C] - mean[key];
      std::snprintf(label, sizeof label, "the %s peaks %.1f to %.1f dB under the kick on the %s kit (%.1f)", kNames[key],
                    windows[key].nearest - room, windows[key].furthest + room, kKits[kit], under);
      EXPECT(under > windows[key].nearest - room && under < windows[key].furthest + room, label);
      // Any one hit, the one with no Variation too, is within 1 dB of that.
      std::snprintf(label, sizeof label, "every hit of the %s is within 1 dB of its usual level on the %s kit", kNames[key],
                    kKits[kit]);
      EXPECT(highest[key] - mean[key] < 1.0 && mean[key] - lowest[key] < 1.0 && std::fabs(steady[key] - mean[key]) < 1.0,
             label);
      std::snprintf(label, sizeof label, "the kick is the strongest drum on the %s kit (the %s is not)", kKits[kit],
                    kNames[key]);
      EXPECT(highest[key] < lowest[C] - 0.5 && body[key] < body[C], label);
    }
    if (kit == 0) {
      // The default kit, any hit: inside the window itself.
      for (int key = 1; key < 12; ++key) {
        std::snprintf(label, sizeof label, "any hit of the %s is in its window under the kick (%.1f to %.1f dB under)",
                      kNames[key], mean[C] - highest[key], mean[C] - lowest[key]);
        EXPECT(mean[C] - highest[key] > windows[key].nearest && mean[C] - lowest[key] < windows[key].furthest, label);
      }
    }

    device.init(kRate);
    device.set_param(p::kKit, static_cast<float>(kit));
    Stereo bar;
    busy_bar(device, 0.9f, &bar);
    device.init(kRate);
    device.set_param(p::kKit, static_cast<float>(kit));
    for (int key = 0; key < 12; ++key) device.note_on(key, key_hz(key), 1.0f);
    Stereo twelve = render(device, 0.5f, kRate);
    NOTE("level, %-6s: a busy bar at gain 0.9 peaks %.3f, rms %.1f dBFS; the twelve drums at once at gain 1 peak %.3f\n",
         kKits[kit], both_peak(bar), db(rms(mid_of(bar))), both_peak(twelve));
    std::snprintf(label, sizeof label, "a busy bar stays under the top of the clip's knee on the %s kit", kKits[kit]);
    EXPECT(both_peak(bar) < 0.9 && both_peak(bar) > 0.2, label);
    // The twelve at their hardest all at once are inside the knee, as the
    // Drum Kit's are (0.81 to 0.95 there): rounded, and short of full scale.
    std::snprintf(label, sizeof label, "twelve drums at once at gain 1 stay short of full scale on the %s kit", kKits[kit]);
    EXPECT(both_peak(twelve) < 0.95 && both_peak(twelve) > 0.3, label);
  }

  // The soft clip: every drum at once, hard, with the volume up, lands on
  // full scale; 96 notes, eight octaves of the twelve keys, stay bounded.
  device.init(kRate);
  device.set_param(p::kVolume, 6.0f);
  for (int n = 0; n < 8; ++n) {
    for (int key = 0; key < 12; ++key) device.note_on(n * 12 + key, key_hz(key, n - 4), 1.0f);
  }
  const int sounding = device.sounding();
  Stereo pile = render(device, 0.5f, kRate);
  NOTE("level: ninety-six hard hits at once at +6 dB peak %.4f, %d slots sounding\n", both_peak(pile), sounding);
  EXPECT(finite(pile.left) && finite(pile.right) && both_peak(pile) <= 1.0 && both_peak(pile) > 0.9,
         "the kit ends in a soft clip");
  EXPECT(sounding == 24, "ninety-six notes take two slots a drum and no more");
}

// 11. The same kit at 22.05, 44.1, 96 and 192 kHz.
static void test_rates() {
  struct Reading {
    double hz, ring, level, centre;
    bool finite;
  };
  auto read = [](int kit, int key, float rate, double lo, double hi, double from, double to) {
    plain(device, rate, kit);
    Stereo out = hit(device, key, 0.7f, key == Cs ? 3.0f : 2.0f, rate);
    Reading r;
    r.finite = finite(out.left) && finite(out.right);
    r.hz = lo > 0.0 ? dominant(out.left, rate, lo, hi, at(from, rate), at(to, rate)) : 0.0;
    r.ring = ring_time(out.left, rate, ring_window(key));
    r.level = db(rms(out.left, 0, at(0.2, rate)));
    // The snare is tones and noise, and the middle of its energy jumps from
    // one to the other: its brightness is the share of the noise instead.
    r.centre = key == D ? share_above(out.left, 1000.0, rate) : median_hz(out.left, rate);
    return r;
  };
  struct Probe {
    int key;
    double lo, hi, from, to;
    bool noise;
  };
  const Probe probes[] = {{C, 30.0, 70.0, 0.12, 0.30, false},   {Cs, 0.0, 0.0, 0.0, 0.0, true},
                          {D, 150.0, 235.0, 0.025, 0.09, true}, {Ds, 3200.0, 3900.0, 0.05, 0.4, false},
                          {E, 380.0, 700.0, 0.002, 0.04, false}, {F, 0.0, 0.0, 0.0, 0.0, true},
                          {Fs, 0.0, 0.0, 0.0, 0.0, true},        {G, 0.0, 0.0, 0.0, 0.0, true},
                          {Gs, 0.0, 0.0, 0.0, 0.0, true},        {A, 150.0, 250.0, 0.05, 0.2, false},
                          {As, 500.0, 700.0, 0.02, 0.12, false}, {B, 240.0, 350.0, 0.05, 0.18, false}};
  for (int kit : {0, 2}) {
    for (const Probe& v : probes) {
      const Reading home = read(kit, v.key, 48000.0f, v.lo, v.hi, v.from, v.to);
      for (float rate : {22050.0f, 44100.0f, 96000.0f, 192000.0f}) {
        char label[200];
        const Reading there = read(kit, v.key, rate, v.lo, v.hi, v.from, v.to);
        NOTE("rate %6.0f, %-5s: %-10s %8.2f Hz (%8.2f), rings %.3f s (%.3f), level %+.2f dB, brightness %.4g (%.4g)\n",
             static_cast<double>(rate), kKits[kit], kNames[v.key], there.hz, home.hz, there.ring, home.ring,
             there.level - home.level, there.centre, home.centre);
        std::snprintf(label, sizeof label, "the %s of the %s kit is finite at %.0f Hz", kNames[v.key], kKits[kit],
                      static_cast<double>(rate));
        EXPECT(there.finite && home.finite, label);
        if (v.lo > 0.0) {
          std::snprintf(label, sizeof label, "the %s of the %s kit has the same pitch at %.0f Hz", kNames[v.key],
                        kKits[kit], static_cast<double>(rate));
          EXPECT(std::fabs(cents_from(there.hz, home.hz)) < 3.0, label);
        }
        std::snprintf(label, sizeof label, "the %s of the %s kit rings as long at %.0f Hz", kNames[v.key], kKits[kit],
                      static_cast<double>(rate));
        EXPECT_NEAR(there.ring / home.ring, 1.0, 0.09, label);
        // At 22.05 kHz there is nothing above 11 kHz, and the hats and the
        // crash live from 7 to 12 kHz: there they are quieter by what that
        // rate cannot carry, up to 3 dB, and may only be duller.
        const bool cut = rate < 40000.0f && (v.key == Cs || v.key == F || v.key == G);
        const double level = there.level - home.level;
        std::snprintf(label, sizeof label, "the %s of the %s kit is as loud at %.0f Hz", kNames[v.key], kKits[kit],
                      static_cast<double>(rate));
        if (cut) {
          EXPECT(level < 0.5 && level > -3.5, label);
        } else {
          // The Dusty kit's hold spreads each step over the sample it falls
          // in: at a rate this near the hold's own that takes off a decibel.
          EXPECT_NEAR(level, 0.0, kit == 2 && rate < 40000.0f ? 1.25 : 1.0, label);
        }
        // The Dusty kit's grit is made at a rate in hertz: from 44.1 kHz up
        // its tops are the same sound, closer than the other kits' are.
        if (kit == 2 && rate > 40000.0f && (v.key == Cs || v.key == F || v.key == Fs || v.key == G)) {
          std::snprintf(label, sizeof label, "the Dusty %s is the same sound at %.0f Hz", kNames[v.key],
                        static_cast<double>(rate));
          EXPECT(std::fabs(level) < 0.7 && std::fabs(there.centre / home.centre - 1.0) < 0.04, label);
        }
        std::snprintf(label, sizeof label, "the %s of the %s kit is about as bright at %.0f Hz", kNames[v.key],
                      kKits[kit], static_cast<double>(rate));
        if (v.key == D) {
          EXPECT_NEAR(there.centre, home.centre, 0.06, label);
        } else if (cut) {
          EXPECT(there.centre < 1.03 * home.centre && there.centre > 0.84 * home.centre, label);
        } else {
          // What a higher rate adds lies above the hearing range and still
          // moves the middle of the energy a little.
          EXPECT_NEAR(there.centre / home.centre, 1.0, 0.16, label);
        }
      }
    }
  }
  // The clap's bursts are 8 ms apart in time, not in samples.
  for (float rate : {22050.0f, 44100.0f, 96000.0f, 192000.0f}) {
    char label[160];
    plain(device, rate);
    Stereo clap = hit(device, Gs, 0.7f, 0.5f, rate);
    double level[48];
    for (int ms = 0; ms < 48; ++ms) level[ms] = rms(clap.left, at(0.001 * ms, rate), at(0.001 * (ms + 1), rate));
    double burst[5], gap[4];
    for (int n = 0; n < 5; ++n) burst[n] = std::max(level[8 * n], std::max(level[8 * n + 1], level[8 * n + 2]));
    for (int n = 0; n < 4; ++n) gap[n] = std::min(level[8 * n + 6], level[8 * n + 7]);
    NOTE("rate %6.0f: clap bursts %.4f %.4f %.4f %.4f with %.4f %.4f %.4f %.4f before the next, tail from %.4f\n",
         static_cast<double>(rate), burst[0], burst[1], burst[2], burst[3], gap[0], gap[1], gap[2], gap[3], burst[4]);
    bool bursts = true;
    for (int n = 0; n < 4; ++n) bursts = bursts && burst[n] > 2.0 * gap[n] && burst[n + 1] > 2.0 * gap[n];
    std::snprintf(label, sizeof label, "the clap's four bursts are 8 ms apart at %.0f Hz", static_cast<double>(rate));
    EXPECT(bursts, label);
  }

  // No sine above 0.45 of the rate. The ride and the rim tuned up one, two
  // and three octaves: a partial that still fits is where the tuning puts
  // it, and one that does not is left out, neither held under the limit nor
  // folded back from above half the rate.
  struct Sine {
    int key;
    int note;  // MIDI, at Tune 0 in the octave of middle C
    double from, to;
  };
  const Sine sines[] = {{Ds, 98, 0.02, 0.12}, {Ds, 105, 0.02, 0.12}, {Ds, 112, 0.02, 0.12}, {Ds, 115, 0.02, 0.12},
                        {E, 72, 0.001, 0.03}, {E, 91, 0.001, 0.03}};
  for (float rate : {22050.0f, 44100.0f, 48000.0f, 96000.0f, 192000.0f}) {
    int kept = 0, dropped = 0;
    bool right = true, clean = true;
    double most_parked = 0.0;
    for (int up = 1; up <= 3; ++up) {
      Stereo out[12];
      for (int key : {Ds, E}) {
        plain(device, rate);
        device.set_param(p::kLength, 4.0f);
        device.set_param(p::kSnap, 0.0f);
        device.set_param(p::kTune, up == 3 ? 12.0f : 0.0f);
        out[key] = hit(device, key, 0.7f, 0.3f, rate, up == 3 ? 2 : up);
        clean = clean && finite(out[key].left) && finite(out[key].right);
        // Nothing is parked at the limit itself: a sine held there would be
        // a good part of the drum, and the lines of the wash are not.
        const size_t from = at(0.005, rate), to = at(0.1, rate);
        const double parked = tone_level(out[key].left, 0.45 * rate, rate, from, to) / rms(out[key].left, from, to);
        most_parked = std::max(most_parked, parked);
        if (!(parked < 0.05)) right = false;
      }
      for (const Sine& sine : sines) {
        const double hz = midi_hz(sine.note + 12 * up);
        const std::vector<float>& x = out[sine.key].left;
        const size_t from = at(sine.from, rate), to = at(sine.to, rate);
        // Where it would be heard: itself, or its image under half the rate.
        const double heard = hz < 0.5 * rate ? hz : static_cast<double>(rate) - hz;
        const double on = tone_level(x, heard, rate, from, to);
        // The rim is short, so its lines are wide: what lies beside is read further off.
        const double off = sine.key == E ? 1.25 : 1.07;
        const double beside = std::max(tone_level(x, heard / off, rate, from, to), tone_level(x, heard * off, rate, from, to));
        const bool fits = hz <= 0.45 * rate;
        if (fits) {
          ++kept;
          if (!(on > 3.0 * beside)) right = false;
        } else if (heard > 20.0 && heard < 0.49 * rate) {
          ++dropped;
          if (!(on < 2.0 * beside + 1.0e-7)) right = false;
        }
        if (verbose() && ((fits && !(on > 3.0 * beside)) || (!fits && !(on < 2.0 * beside + 1.0e-7)))) {
          std::printf("rate %6.0f: %s up %d: %.1f Hz %s, level %.6f against %.6f beside it\n", static_cast<double>(rate),
                      kNames[sine.key], up, hz, fits ? "fits" : "does not fit", on, beside);
        }
      }
    }
    char label[160];
    NOTE("rate %6.0f: of the ride's and the rim's sines tuned up, %d fit and are there, %d do not and are left out; "
         "at the limit itself %.4f of the drum\n",
         static_cast<double>(rate), kept, dropped, most_parked);
    std::snprintf(label, sizeof label, "no sine lies above 0.45 of the rate at %.0f Hz, and none folds", static_cast<double>(rate));
    EXPECT(right && clean && kept > 0, label);
    if (rate < 50000.0f) EXPECT(dropped > 0, "at this rate some of them do not fit");
  }
  // Every drum at the top of its reach, on every Kit, at every rate: finite
  // and bounded, the pulses of the metal held under the rate too.
  for (float rate : {22050.0f, 44100.0f, 48000.0f, 96000.0f, 192000.0f}) {
    bool sound = true;
    double loudest = 0.0;
    for (int kit = 0; kit < 4; ++kit) {
      for (int low = 0; low < 2; ++low) {
        plain(device, rate, kit);
        device.set_param(p::kTune, low ? -12.0f : 12.0f);
        device.set_param(p::kTone, 1.0f);
        device.set_param(p::kSnap, 1.0f);
        device.set_param(p::kPunch, 1.0f);
        for (int key = 0; key < 12; ++key) device.note_on(key, key_hz(key, low ? -2 : 2), 1.0f);
        Stereo out = render(device, 0.25f, rate);
        sound = sound && finite(out.left) && finite(out.right) && rms(out.left) > 0.0;
        loudest = std::max(loudest, both_peak(out));
      }
    }
    char label[160];
    NOTE("rate %6.0f: every drum three octaves up and down, hard, on every kit: peak %.3f\n", static_cast<double>(rate),
         loudest);
    std::snprintf(label, sizeof label, "every drum at the ends of its reach is finite and bounded at %.0f Hz",
                  static_cast<double>(rate));
    EXPECT(sound && loudest <= 1.0, label);
  }
}

// 12. No clicks from the smoothed controls, and nothing depends on the block size.
static void test_clicks_and_blocks() {
  // Volume, Tone and Width thrown across their range, block by block, under a ringing kick.
  auto long_kick = [](ClubKit& d) {
    plain(d);
    d.set_param(p::kLength, 4.0f);
    d.set_param(p::kSnap, 0.0f);
  };
  long_kick(device);
  Stereo steady = hit(device, C, 0.8f, 0.6f);
  long_kick(device);
  device.note_on(1, key_hz(C), 0.8f);
  Stereo swept;
  for (int block = 0; block < 225; ++block) {
    device.set_param(p::kVolume, block % 2 == 0 ? -24.0f : 6.0f);
    device.set_param(p::kTone, block % 3 == 0 ? 0.0f : 1.0f);
    device.set_param(p::kWidth, block % 2 == 0 ? 1.0f : 0.0f);
    Stereo part = render(device, 128.0f / kRate, kRate);
    swept = block == 0 ? part : concat(swept, part);
  }
  const double own = max_step(steady.left, at(0.02));
  const double moved = std::max(max_step(swept.left, at(0.02)), max_step(swept.right, at(0.02)));
  NOTE("clicks: kick steps %.5f at rest, %.5f with Volume, Tone and Width thrown every block\n", own, moved);
  EXPECT(moved < 6.0 * own, "Volume and Tone swept under a ringing drum make no step");

  struct Throw {
    const char* name;
    int param;
    float from, to;
    int key;
  };
  const Throw throws[] = {{"Volume", p::kVolume, 0.0f, -24.0f, C}, {"Volume", p::kVolume, -24.0f, 6.0f, G},
                          {"Tone", p::kTone, 1.0f, 0.0f, G},       {"Tone", p::kTone, 0.0f, 1.0f, Cs},
                          {"Width", p::kWidth, 0.0f, 1.0f, G},     {"Width", p::kWidth, 1.0f, 0.0f, Cs},
                          {"Drive", p::kDrive, 0.0f, 1.0f, C},     {"Drive", p::kDrive, 1.0f, 0.0f, Ds}};
  for (const Throw& t : throws) {
    char label[160];
    const double sudden = suddenness(
        [&](ClubKit& d) {
          plain(d);
          d.set_param(p::kLength, 2.0f);
          d.set_param(t.param, t.from);
          d.note_on(1, key_hz(t.key), 0.8f);
        },
        [&](ClubKit& d) { d.set_param(t.param, t.to); });
    NOTE("clicks: %s thrown from %g to %g under the %s is %.3f there after 8 samples\n", t.name,
         static_cast<double>(t.from), static_cast<double>(t.to), kNames[t.key], sudden);
    std::snprintf(label, sizeof label, "%s thrown from %g to %g arrives gradually (%.2f)", t.name,
                  static_cast<double>(t.from), static_cast<double>(t.to), sudden);
    EXPECT(sudden < 0.15, label);
  }

  // Tone moved under a ringing drum is heard on that drum, and ends where a
  // drum struck at that setting is.
  {
    plain(device);
    device.set_param(p::kTone, 1.0f);
    Stereo bright = hit(device, G, 0.8f, 0.3f);
    plain(device);
    device.set_param(p::kTone, 1.0f);
    device.note_on(1, key_hz(G), 0.8f);
    Stereo head = render(device, 0.05f, kRate);
    device.set_param(p::kTone, 0.0f);
    Stereo turned = concat(head, render(device, 0.25f, kRate));
    plain(device);
    device.set_param(p::kTone, 0.0f);
    Stereo dull = hit(device, G, 0.8f, 0.3f);
    const double was = share_above(bright.left, 9000.0, kRate, at(0.1), at(0.25));
    const double now = share_above(turned.left, 9000.0, kRate, at(0.1), at(0.25));
    const double there = share_above(dull.left, 9000.0, kRate, at(0.1), at(0.25));
    NOTE("tone under a ringing open hat: above 9 kHz %.3f before, %.3f after the turn, %.3f struck dull\n", was, now, there);
    EXPECT(now < 0.6 * was, "Tone turned down under a ringing drum dulls it");
    EXPECT_NEAR(now, there, 0.02, "and leaves it where a drum struck at that setting is");
  }

  // Tone moved by a hair under a ringing clap or crash changes nothing that
  // can be heard: every filter of the slot, the sides' too, keeps its state
  // as it is retuned.
  for (int key : {Gs, Cs}) {
    char label[160];
    auto wide = [&](bool wobble) {
      plain(device);
      device.set_param(p::kWidth, 1.0f);
      device.set_param(p::kLength, 4.0f);
      std::vector<Event> events = {{0, [key](ClubKit& d) { d.note_on(1, key_hz(key), 0.8f); }}};
      for (size_t n = 1; wobble && n < 150; ++n) {
        events.push_back({n * 64, [n](ClubKit& d) { d.set_param(p::kTone, n % 2 ? 0.502f : 0.5f); }});
      }
      return play(device, events, 150 * 64, {64});
    };
    Stereo still = wide(false);
    Stereo moved_hair = wide(true);
    const double side_change = distance(side_of(still), side_of(moved_hair));
    const double mid_change = distance(still.left, moved_hair.left);
    NOTE("tone by a hair under a %s: the sides change by %.5f of their level, the left channel by %.5f\n", kNames[key],
         side_change, mid_change);
    std::snprintf(label, sizeof label, "retuning the %s's filters keeps their state, the sides' too", kNames[key]);
    EXPECT(rms(side_of(still)) > 1.0e-3 && side_change > 0.0 && side_change < 0.02 && mid_change < 0.02, label);
  }

  // Tone is followed on a control clock of 16 samples that starts with the
  // hit: thrown one sample after a tick, it is heard before the next period is over.
  {
    auto snare = [&](bool thrown) {
      plain(device);
      std::vector<Event> events = {{0, [](ClubKit& d) { d.note_on(1, key_hz(D), 0.8f); }}};
      if (thrown) events.push_back({1025, [](ClubKit& d) { d.set_param(p::kTone, 0.0f); }});
      return play(device, events, 1025 + 400, {64});
    };
    Stereo held = snare(false);
    Stereo thrown = snare(true);
    size_t first = 400;
    for (size_t i = 1025; i < held.size(); ++i) {
      if (held.left[i] != thrown.left[i]) {
        first = i - 1025;
        break;
      }
    }
    NOTE("control clock: Tone thrown under a snare is first heard %zu samples on\n", first);
    EXPECT(first <= 16, "Tone is followed within 16 samples");
  }
  // A phrase with a silence that steps across the moment the kit falls
  // asleep, and knobs moved inside the silence: the same audio at every
  // block size, on the Firm kit and on the Dusty one with its hold.
  for (int kit : {0, 2}) {
    char label[160];
    double worst = 0.0;
    for (double gap : {0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.24, 0.26, 1.0}) {
      const size_t second = at(0.0113 + gap);
      const std::vector<Event> events = {
          {at(0.0113), [](ClubKit& d) { d.note_on(1, key_hz(F), 0.8f); }},
          {second - 150, [](ClubKit& d) {
             d.set_param(p::kVolume, -9.0f);
             d.set_param(p::kTone, 0.9f);
             d.set_param(p::kWidth, 1.0f);
             d.set_param(p::kDrive, 0.5f);
           }},
          {second, [](ClubKit& d) { d.note_on(2, key_hz(D), 0.8f); }},
          {second + 333, [](ClubKit& d) { d.note_on(3, key_hz(C), 0.9f); }},
          {second + 777, [](ClubKit& d) { d.note_on(4, key_hz(G), 0.6f); }},
          {second + 1501, [](ClubKit& d) { d.note_on(5, key_hz(Cs), 0.7f); }},
          {second + 2999, [](ClubKit& d) { d.set_param(p::kTone, 0.2f); }},
          {second + 4001, [](ClubKit& d) { d.note_on(6, key_hz(F), 0.6f); }},
          {second + 5003, [](ClubKit& d) { d.note_on(7, key_hz(Gs), 0.6f); }},
      };
      const size_t total = second + at(0.4);
      device.init(kRate);
      device.set_param(p::kKit, static_cast<float>(kit));
      Stereo reference = play(device, events, total, {128});
      for (const std::vector<int>& sizes :
           {std::vector<int>{1}, std::vector<int>{2048}, std::vector<int>{1, 7, 64, 128, 33, 512, 2048, 5}}) {
        device.init(kRate);
        device.set_param(p::kKit, static_cast<float>(kit));
        Stereo out = play(device, events, total, sizes);
        worst = std::max(worst, max_diff(out, reference));
      }
      if (gap == 0.10) EXPECT(rms(reference.left) > 1.0e-3, "the phrase sounds");
    }
    NOTE("blocks: the phrase on the %s kit differs by %g at most between block sizes\n", kKits[kit], worst);
    std::snprintf(label, sizeof label, "the output does not depend on the block size, across a silence, on the %s kit",
                  kKits[kit]);
    EXPECT(worst < 1.0e-6, label);
  }

  // Knobs moved while the kit sleeps are in place for the next hit.
  plain(device);
  hit(device, F, 0.8f, 1.0f);
  device.process(13);  // off the beat of the control clock
  render(device, 0.5f, kRate);
  EXPECT(device.asleep(), "the kit is asleep half a second after a closed hat");
  device.set_param(p::kVolume, -12.0f);
  device.set_param(p::kTone, 1.0f);
  device.set_param(p::kWidth, 1.0f);
  device.set_param(p::kDrive, 0.7f);
  render(device, 0.1f, kRate);
  Stereo woken = hit(device, G, 0.8f, 0.3f);
  plain(other);
  other.set_param(p::kVolume, -12.0f);
  other.set_param(p::kTone, 1.0f);
  other.set_param(p::kWidth, 1.0f);
  other.set_param(p::kDrive, 0.7f);
  Stereo set_up = hit(other, G, 0.8f, 0.3f);
  NOTE("sleep: a hit after knobs moved in silence differs by %g from one set up that way\n", max_diff(woken, set_up));
  EXPECT(max_diff(woken, set_up) == 0.0 && rms(woken.left) > 0.0, "knobs moved in silence have arrived at the next hit");
  // The per-hit ones too: read at the hit, whatever they were when the kit fell asleep.
  plain(device);
  hit(device, F, 0.8f, 1.0f);
  device.set_param(p::kKit, 1.0f);
  device.set_param(p::kTune, -5.0f);
  device.set_param(p::kLength, 2.0f);
  device.set_param(p::kPunch, 0.9f);
  device.set_param(p::kSnap, 0.8f);
  Stereo woken_kick = hit(device, C, 0.8f, 0.5f);
  plain(other, kRate, 1);
  other.set_param(p::kTune, -5.0f);
  other.set_param(p::kLength, 2.0f);
  other.set_param(p::kPunch, 0.9f);
  other.set_param(p::kSnap, 0.8f);
  hit(other, F, 0.8f, 1.0f);
  Stereo set_up_kick = hit(other, C, 0.8f, 0.5f);
  EXPECT(max_diff(woken_kick, set_up_kick) == 0.0 && rms(woken_kick.left) > 0.0,
         "Kit, Tune, Length, Punch and Snap moved in silence are those of the next hit");

  // The per-hit controls are read at the hit: moving them does not touch a ringing drum.
  plain(device);
  Stereo untouched = hit(device, Cs, 0.7f, 0.5f);
  plain(device);
  device.note_on(1, key_hz(Cs), 0.7f);
  Stereo head = render(device, 0.05f, kRate);
  device.set_param(p::kKit, 3.0f);
  device.set_param(p::kTune, 12.0f);
  device.set_param(p::kLength, 0.25f);
  device.set_param(p::kPunch, 1.0f);
  device.set_param(p::kSnap, 1.0f);
  device.set_param(p::kVariation, 1.0f);
  Stereo moved_under = concat(head, render(device, 0.45f, kRate));
  EXPECT(moved_under.left == untouched.left && moved_under.right == untouched.right,
         "Kit, Tune, Length, Punch, Snap and Variation are heard from the next hit");
}

// 13. The ends of the range: no drum is infrasound, and the reach is two octaves and Tune.
static void test_range() {
  auto rest_hz = [](int key, int octave, float tune, int kit, double from, double to, float seconds) {
    plain(device, kRate, kit);
    device.set_param(p::kTune, tune);
    device.set_param(p::kSnap, 0.0f);
    Stereo out = hit(device, key, 0.7f, seconds, kRate, octave);
    return dominant(out.left, kRate, 8.0, 200.0, at(from), at(to));
  };
  const double down1 = rest_hz(C, -1, 0.0f, 0, 0.15, 0.8, 3.0f);
  const double down2 = rest_hz(C, -2, 0.0f, 0, 0.15, 1.0, 3.0f);
  const double deep1 = rest_hz(C, -1, 0.0f, 1, 0.2, 1.0, 3.0f);
  NOTE("floor: kick an octave down %.2f Hz, two octaves down %.2f Hz, Deep an octave down %.2f Hz\n", down1, down2,
       deep1);
  EXPECT_NEAR(down1, 24.5, 0.4, "the kick an octave down is at half its pitch, 24.5 Hz");
  EXPECT_NEAR(down2, 24.0, 0.4, "the kick two octaves down is held at the 24 Hz floor, not at 12 Hz");
  EXPECT_NEAR(deep1, 24.0, 0.4, "the Deep kick an octave down is held at the floor");
  plain(device);
  Stereo low1 = hit(device, C, 0.7f, 4.0f, kRate, -1);
  plain(device);
  Stereo low2 = hit(device, C, 0.7f, 4.0f, kRate, -2);
  EXPECT(ring_time(low2.left, kRate) > 1.3 * ring_time(low1.left, kRate), "held at the floor the kick still rings longer");
  // Three octaves down (the lowest octave and Tune at -12) no tonal drum is under the floor.
  for (int kit = 0; kit < 4; ++kit) {
    for (int key : {C, D, A, B}) {
      char label[160];
      const double hz = rest_hz(key, -2, -12.0f, kit, key == D ? 0.03 : 0.2, key == D ? 0.5 : 1.2, 4.0f);
      NOTE("floor: the %s kit's %s three octaves down is strongest at %.2f Hz\n", kKits[kit], kNames[key], hz);
      std::snprintf(label, sizeof label, "the %s kit's %s three octaves down is not under the floor (%.1f Hz)", kKits[kit],
                    kNames[key], hz);
      EXPECT(hz > 23.5, label);
    }
  }
  // The snare's upper tone and the congas' upper partial keep their ratio to
  // the held lower one: on the Deep kit, whose snare is the lowest.
  {
    plain(device, kRate, 1);
    device.set_param(p::kTune, -12.0f);
    device.set_param(p::kSnap, 0.0f);
    device.set_param(p::kLength, 2.0f);
    Stereo snare = hit(device, D, 0.7f, 3.0f, kRate, -2);
    const double low = dominant(snare.left, kRate, 18.0, 30.0, at(0.05), at(0.8));
    const double high = dominant(snare.left, kRate, 31.0, 45.0, at(0.05), at(0.6));
    NOTE("floor: the Deep snare three octaves down has its tones at %.2f and %.2f Hz\n", low, high);
    EXPECT_NEAR(low, 24.0, 0.5, "the Deep snare three octaves down is held at the floor");
    EXPECT_NEAR(high / low, midi_hz(57) / midi_hz(50), 0.03, "held at the floor the snare's two tones keep their fifth");
  }
  // The octave is kept to two either way and Tune adds an octave: beyond that nothing moves.
  for (int key : {C, E, F, As}) {
    char label[160];
    plain(device);
    Stereo top = hit(device, key, 0.7f, 0.3f, kRate, 2);
    plain(device);
    Stereo beyond = hit(device, key, 0.7f, 0.3f, kRate, 4);
    plain(device);
    Stereo bottom = hit(device, key, 0.7f, 0.3f, kRate, -2);
    plain(device);
    Stereo below = hit(device, key, 0.7f, 0.3f, kRate, -4);
    plain(device);
    Stereo home = hit(device, key, 0.7f, 0.3f);
    std::snprintf(label, sizeof label, "the %s beyond two octaves away is the %s two octaves away", kNames[key], kNames[key]);
    // The cents of a key are a rounding apart from one octave to another,
    // so the two are held to a thousandth of their level, not to the sample.
    NOTE("reach: %-10s two and four octaves up are %.6f apart, down %.6f; two up is %.2f from home, two down %.2f\n",
         kNames[key], distance(top.left, beyond.left), distance(bottom.left, below.left), distance(top.left, home.left),
         distance(bottom.left, home.left));
    EXPECT(distance(top.left, beyond.left) < 0.001 && distance(bottom.left, below.left) < 0.001 && rms(top.left) > 0.0 &&
               rms(bottom.left) > 0.0 && distance(top.left, home.left) > 0.3 && distance(bottom.left, home.left) > 0.3,
           label);
  }
}

// 14. At rest: nothing decays into the subnormals, a drum's slot is let go
// 100 dB down, and the kit asleep costs a cleared buffer.
static void test_rest() {
  struct Setting {
    const char* name;
    int kit;
    float length, snap;
  };
  const Setting settings[] = {{"at its defaults", 0, 1.0f, 0.45f},
                              {"long and deep", 1, 4.0f, 1.0f},
                              {"dusty and soft", 2, 1.0f, 0.0f},
                              {"bright and short", 3, 0.25f, 1.0f}};
  for (const Setting& setting : settings) {
    char label[160];
    int states = 0, worst_key = -1, unended = 0;
    size_t samples = 0;
    for (int key = 0; key < 12; ++key) {
      plain(device, kRate, setting.kit);
      device.set_param(p::kLength, setting.length);
      device.set_param(p::kSnap, setting.snap);
      // Struck three times a millisecond apart, so that a slot is retaken and carries.
      for (int n = 0; n < 3; ++n) {
        device.note_on(n, key_hz(key), 0.7f);
        device.process(48);
      }
      const int before = states;
      for (int block = 0; block < 24 * 750 && device.sounding() > 0; ++block) {
        device.process(64);
        states += device.subnormal_states();
        for (int i = 0; i < 64; ++i) {
          const float l = device.out_left()[i], r = device.out_right()[i];
          if ((l != 0.0f && std::fabs(l) < 1.17549435e-38f) || (r != 0.0f && std::fabs(r) < 1.17549435e-38f)) ++samples;
        }
      }
      if (device.sounding() > 0) ++unended;
      if (states > before && worst_key < 0) worst_key = key;
    }
    NOTE("rest: %s, %d subnormal states and %zu subnormal samples over the life of every drum, %d drums not ended\n",
         setting.name, states, samples, unended);
    std::snprintf(label, sizeof label, "no slot holds a subnormal number while its drum rings, %s%s%s", setting.name,
                  worst_key < 0 ? "" : ": first the ", worst_key < 0 ? "" : kNames[worst_key]);
    EXPECT(states == 0 && samples == 0, label);
    std::snprintf(label, sizeof label, "every drum ends, %s", setting.name);
    EXPECT(unended == 0, label);
  }

  // A drum rings on under -60 dB; its slot is faded out over 4 ms once it is 100 dB down.
  plain(device);
  device.set_param(p::kSnap, 0.0f);
  Stereo conga = hit(device, A, 0.7f, 1.5f);
  const double far_down = db(rms(conga.left, at(0.36), at(0.40))) - db(peak(conga.left));
  size_t last = 0;
  for (size_t i = 0; i < conga.size(); ++i) {
    if (conga.left[i] != 0.0f || conga.right[i] != 0.0f) last = i;
  }
  NOTE("rest: the low conga is %.1f dB under its peak 0.38 s on, and its last sample that is not zero is at %.3f s\n",
       far_down, static_cast<double>(last) / kRate);
  EXPECT(far_down > -110.0 && far_down < -80.0, "a drum rings on under -60 dB: the low conga is about 95 dB down at 0.38 s");
  EXPECT(last > at(0.39) && last < at(0.50), "and its slot is let go 100 dB down, 0.42 s on");

  // The idle gate. Awake or asleep the kit takes what is on its input and plays none of it.
  plain(device);
  EXPECT(device.asleep() && device.sounding() == 0, "a new kit is asleep");
  device.note_on(1, key_hz(As), 0.7f);
  device.in_left()[5] = 0.5f;
  device.in_right()[6] = -0.5f;
  device.process(64);
  EXPECT(!device.asleep() && device.sounding() == 1, "a hit wakes it");
  EXPECT(device.in_left()[5] == 0.0f && device.in_right()[6] == 0.0f, "awake the kit clears its input");
  render(device, 1.0f, kRate);
  EXPECT(device.asleep() && device.sounding() == 0, "it sleeps again once its last drum has ended");
  device.in_left()[5] = 0.5f;
  device.process(64);
  EXPECT(device.in_left()[5] == 0.0f && device.out_left()[5] == 0.0f && device.asleep(),
         "asleep it clears its input and stays asleep");
  // Asleep, a block is a buffer cleared; awake with nothing sounding (the
  // 50 ms after the last drum) it is the whole loop. The quickest of many.
  double awake = 1.0e9, asleep = 1.0e9;
  const auto blocks = [](int count) {
    const auto start = std::chrono::steady_clock::now();
    for (int n = 0; n < count; ++n) device.process(128);
    return std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count() / count;
  };
  for (int round = 0; round < 60; ++round) {
    plain(device);
    device.note_on(1, key_hz(E), 0.0f);
    while (device.sounding() > 0) device.process(128);
    awake = std::min(awake, blocks(8));
    render(device, 0.2f, kRate);
    asleep = std::min(asleep, blocks(8));
  }
  NOTE("rest: a block of 128 costs %.3f us awake with nothing sounding, %.3f us asleep\n", awake, asleep);
  EXPECT(asleep * 4.0 < awake, "asleep the kit does not run its loop");
}

int main() {
  Conformance spec;
  spec.name = "club-kit";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The crash two octaves down rings 4.6 s to 60 dB down and its slot ends 8.6 s on at the
  // default length, 9.1 s on the Bright kit.
  spec.tail_seconds = 16.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_voices();
  test_keys();
  test_white_keys();
  test_controls();
  test_drive_and_kits();

  test_velocity();
  test_variation();
  test_width();
  test_retrigger();
  test_levels();
  test_rates();
  test_clicks_and_blocks();
  test_range();
  test_rest();

  // The longest drum at the longest length ends, and the kit sleeps.
  plain(device);
  device.set_param(p::kLength, 4.0f);
  Stereo longest = hit(device, Cs, 0.7f, 20.0f);
  Stereo asleep = render(device, 0.5f, kRate);
  NOTE("tail: the crash at Length 4 rings %.2f s\n", ring_time(longest.left, kRate));
  EXPECT(peak(longest.left, at(9.0), at(9.5)) > 0.0 && peak(asleep.left) == 0.0 && peak(asleep.right) == 0.0 &&
             device.asleep(),
         "the longest drum at the longest Length ends in exact silence");

  // Cost: a busy bar, looped for ten seconds.
  device.init(kRate);
  report_cost("club-kit (a busy bar, looped)", 10.0f, kRate, [&] {
    for (int loop = 0; loop < 5; ++loop) busy_bar(device, 0.9f, nullptr);
  });

  return finish("club-kit");
}
