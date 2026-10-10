// Native harness for Drum Kit (cpp/devices/drum-kit). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest asserts what makes it a kit: twelve drums on
// the twelve keys, the octave tuning them, and each drum's own shape.
//
// DRUM_KIT_PRINT=1 prints what was measured.

#include <cstdlib>
#include <functional>

#include "../devices/drum-kit/drum_kit.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::DrumKit;
namespace p = livemix::drum_kit;

static DrumKit device;
static DrumKit other;

static const float kRate = 48000.0f;
static const char* kNames[12] = {"kick",   "sub",      "snare", "brush",   "rim",  "closed hat",
                                 "shaker", "open hat", "clap",  "low tom", "tick", "high tom"};
enum Key : int { C = 0, Cs, D, Ds, E, F, Fs, G, Gs, A, As, B };

static bool verbose() {
  static const bool on = std::getenv("DRUM_KIT_PRINT") != nullptr;
  return on;
}
#define NOTE(...)                        \
  do {                                   \
    if (verbose()) std::printf(__VA_ARGS__); \
  } while (0)

// The frequency of a key of the octave a kit is written in (MIDI 60 to 71).
static float key_hz(int key, int octave = 0, float cents = 0.0f) {
  return 440.0f * std::pow(2.0f, (60.0f + key + 12.0f * octave + cents * 0.01f - 69.0f) / 12.0f);
}

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// A device at its defaults with Variation at 0, so a hit can be measured
// against another hit sample for sample.
static void plain(DrumKit& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kVariation, 0.0f);
}

static Stereo hit(DrumKit& d, int key, float gain = 0.7f, float seconds = 1.5f, float rate = kRate,
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

// What a drum is, in two numbers that survive a retuning of a few cents.
struct Shape {
  double ring;
  double median;
};
static Shape shape_of(const Stereo& x, double rate = kRate) {
  return {ring_time(x.left, rate), median_hz(x.left, rate)};
}
static double apart(const Shape& a, const Shape& b) {
  return std::fabs(std::log(a.ring / b.ring)) + std::fabs(std::log(a.median / b.median));
}

// How much of what an event changes is already there after eight samples:
// the same passage is rendered with and without the event, and the largest
// difference in the first 8 samples is held against the largest in 20 ms. A
// smoothed change has barely begun; a jump is all there at once. The worst of
// eight moments, so that a jump cannot hide in a zero crossing.
static double suddenness(const std::function<void(DrumKit&)>& setup,
                         const std::function<void(DrumKit&)>& event, double from_seconds = 0.03) {
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
  std::function<void(DrumKit&)> act;
};
static Stereo play(DrumKit& d, const std::vector<Event>& events, size_t total, const std::vector<int>& sizes) {
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

// Sixteen hits in two seconds across the kit.
static void busy_bar(DrumKit& d, float gain, Stereo* out, float rate = kRate) {
  static const int kSteps[16] = {C, F, Fs, A, D, F, Cs, G, C, Ds, F, Gs, D, As, B, E};
  for (int step = 0; step < 16; ++step) {
    d.note_on(step, key_hz(kSteps[step]), gain);
    Stereo part = render(d, 0.125f, rate);
    if (out) *out = step == 0 ? part : concat(*out, part);
  }
}

// --- the keys --------------------------------------------------------------------------

// 1. Twelve keys, twelve drums; the octave and Tune retune the same drum.
static void test_keys() {
  std::vector<Stereo> drum(12);
  for (int key = 0; key < 12; ++key) {
    plain(device);
    drum[key] = hit(device, key, 0.7f, 1.2f);
  }
  double nearest = 1.0e9;
  for (int a = 0; a < 12; ++a) {
    for (int b = a + 1; b < 12; ++b) nearest = std::min(nearest, distance(drum[a].left, drum[b].left));
  }
  NOTE("keys: the two closest drums are %.2f of their level apart\n", nearest);
  EXPECT(nearest > 0.5, "each of the twelve keys gives a different sound");

  // The pitched drums: where the tone settles, read once the fall is over.
  struct Pitched {
    int key;
    double hz, from, to;
  };
  const Pitched pitched[] = {{C, 49.0, 0.10, 0.30},  {Cs, 49.0, 0.10, 0.40}, {D, 185.0, 0.03, 0.09},
                             {E, 480.0, 0.004, 0.03}, {A, 110.0, 0.08, 0.25}, {As, 2200.0, 0.004, 0.02},
                             {B, 165.0, 0.08, 0.22}};
  for (const Pitched& v : pitched) {
    char label[120];
    plain(device);
    Stereo home = hit(device, v.key);
    const double base = dominant(home.left, kRate, v.hz * 0.6, v.hz * 1.6, at(v.from), at(v.to));
    plain(device);
    Stereo up = hit(device, v.key, 0.7f, 1.5f, kRate, 1);
    const double octave = dominant(up.left, kRate, v.hz * 1.2, v.hz * 3.2, at(v.from * 0.6), at(v.to * 0.6));
    plain(device);
    device.set_param(p::kTune, 12.0f);
    Stereo tuned = hit(device, v.key);
    const double tune = dominant(tuned.left, kRate, v.hz * 1.2, v.hz * 3.2, at(v.from * 0.6), at(v.to * 0.6));
    plain(device);
    Stereo down = hit(device, v.key, 0.7f, 2.5f, kRate, -1);
    NOTE("%-10s settles at %7.1f Hz, octave up %7.1f, Tune +12 %7.1f; rings %.3f s, up %.3f, down %.3f\n",
         kNames[v.key], base, octave, tune, ring_time(home.left, kRate), ring_time(up.left, kRate),
         ring_time(down.left, kRate));
    std::snprintf(label, sizeof label, "%s sounds at its pitch", kNames[v.key]);
    EXPECT_NEAR(base, v.hz, v.hz * 0.03, label);
    std::snprintf(label, sizeof label, "%s an octave up is the same drum at twice the pitch", kNames[v.key]);
    EXPECT_NEAR(octave / base, 2.0, 0.06, label);
    std::snprintf(label, sizeof label, "%s with Tune at +12 is at twice the pitch", kNames[v.key]);
    EXPECT_NEAR(tune / base, 2.0, 0.06, label);
    EXPECT(up.left == tuned.left, "the octave above and Tune +12 are the same retuning");
    std::snprintf(label, sizeof label, "%s rings about a third shorter an octave up", kNames[v.key]);
    EXPECT_NEAR(ring_time(up.left, kRate) / ring_time(home.left, kRate), 0.667, 0.12, label);
    std::snprintf(label, sizeof label, "%s rings about half longer an octave down", kNames[v.key]);
    EXPECT_NEAR(ring_time(down.left, kRate) / ring_time(home.left, kRate), 1.5, 0.2, label);
  }
  // The noise drums: their band moves with the key's octave.
  for (int key : {Ds, F, Fs, G, Gs}) {
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

  // 2. A key 30 cents off is still its own drum, retuned by those cents.
  std::vector<Shape> shapes(12);
  for (int key = 0; key < 12; ++key) shapes[key] = shape_of(drum[key]);
  for (int key = 0; key < 12; ++key) {
    for (float cents : {-30.0f, 30.0f}) {
      char label[120];
      plain(device);
      const Shape off = shape_of(hit(device, key, 0.7f, 1.2f, kRate, 0, cents));
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
  const double cents = 1200.0 * std::log2(dominant(sharp.left, kRate, 80.0, 160.0, at(0.08), at(0.4)) / 110.0);
  NOTE("low tom 30 cents sharp sounds %.1f cents sharp\n", cents);
  EXPECT_NEAR(cents, 30.0, 8.0, "the cents a key is off go into the tuning");

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

// --- each drum --------------------------------------------------------------------------

// 3. What makes each drum what it is.
static void test_voices() {
  // Kick: a 49 Hz sine that falls to its pitch, about 0.45 s, a faint click.
  plain(device);
  Stereo kick = hit(device, C);
  {
    const double start = dominant(kick.left, kRate, 30.0, 1000.0, 0, at(0.015));
    const double rest = dominant(kick.left, kRate, 30.0, 1000.0, at(0.1), at(0.2));
    NOTE("kick: %.1f Hz in the first 15 ms, %.1f Hz at rest, rings %.3f s, above 2 kHz %.5f\n", start, rest,
         ring_time(kick.left, kRate), share_above(kick.left, 2000.0, kRate, 0, at(0.01)));
    EXPECT_NEAR(rest, 49.0, 1.5, "the kick rests near 49 Hz");
    EXPECT(start > 1.6 * rest, "the kick starts well above its resting pitch");
    EXPECT_NEAR(ring_time(kick.left, kRate), 0.45, 0.07, "the kick is 60 dB down in about 0.45 s");
    EXPECT(share_above(kick.left, 300.0, kRate) < 0.02, "the kick is nearly all low");
  }

  // Sub: the same drum played soft. It swells, has no click and rings twice as long.
  plain(device);
  Stereo sub = hit(device, Cs, 0.7f, 2.5f);
  {
    const double hz = dominant(sub.left, kRate, 30.0, 200.0, at(0.1), at(0.4));
    const double early = peak(sub.left, 0, at(0.003)) / peak(sub.left);
    const double kick_early = peak(kick.left, 0, at(0.003)) / peak(kick.left);
    const double start = dominant(sub.left, kRate, 30.0, 1000.0, 0, at(0.04));
    NOTE("sub: %.1f Hz, rings %.3f s, at 3 ms %.2f of its peak (kick %.2f), first 40 ms at %.1f Hz, above 1 kHz %.6f\n",
         hz, ring_time(sub.left, kRate), early, kick_early, start, share_above(sub.left, 1000.0, kRate, 0, at(0.02)));
    EXPECT_NEAR(hz, 49.0, 1.5, "the sub is tuned as the kick is");
    EXPECT_NEAR(ring_time(sub.left, kRate), 0.9, 0.12, "the sub rings about 0.9 s");
    EXPECT(early < 0.3 && early < 0.4 * kick_early, "the sub swells where the kick strikes");
    EXPECT(start < 1.25 * hz, "the sub has almost no fall in pitch");
    EXPECT(share_above(sub.left, 1000.0, kRate, 0, at(0.02)) < 1.0e-4, "the sub has no click");
  }

  // Snare: two tones under noise, the noise outlasting them.
  plain(device);
  Stereo snare = hit(device, D);
  {
    const double low = tone_level(snare.left, 187.0, kRate, at(0.01), at(0.06));
    const double high = tone_level(snare.left, 333.0, kRate, at(0.01), at(0.06));
    const double between = tone_level(snare.left, 250.0, kRate, at(0.01), at(0.06));
    const double early = share_above(snare.left, 1000.0, kRate, 0, at(0.04));
    const double late = share_above(snare.left, 1000.0, kRate, at(0.12), at(0.22));
    const double band_low = share_above(snare.left, 1200.0, kRate, at(0.12), at(0.22));
    const double band_high = share_above(snare.left, 8500.0, kRate, at(0.12), at(0.22));
    NOTE("snare: tones %.4f and %.4f (between them %.4f), above 1 kHz %.2f early and %.2f late, "
         "late band above 1.2 kHz %.2f above 8.5 kHz %.2f, rings %.3f s\n",
         low, high, between, early, late, band_low, band_high, ring_time(snare.left, kRate));
    EXPECT(low > 3.0 * between && high > 2.0 * between, "the snare has its two tones");
    EXPECT(early < 0.6 && late > 0.9, "the snare's noise outlasts its tones");
    EXPECT(band_low > 0.85 && band_high < 0.2, "the snares lie between about 1.5 and 7 kHz");
    EXPECT_NEAR(ring_time(snare.left, kRate), 0.25, 0.06, "the snare is about 0.25 s");
  }

  // Brush: noise only, slow to arrive, slow to go, duller than the snare.
  plain(device);
  Stereo brush = hit(device, Ds);
  {
    const double first = rms(brush.left, 0, at(0.003));
    const double arrived = rms(brush.left, at(0.015), at(0.03));
    const double snare_first = rms(snare.left, 0, at(0.003)) / rms(snare.left, at(0.015), at(0.03));
    const double dull = median_hz(brush.left, kRate);
    const double snare_noise = median_hz(snare.left, kRate, at(0.12), at(0.22));
    NOTE("brush: first 3 ms %.3f of 15..30 ms (snare %.2f), centre %.0f Hz (snare noise %.0f Hz), rings %.3f s\n",
         first / arrived, snare_first, dull, snare_noise, ring_time(brush.left, kRate));
    EXPECT(first < 0.15 * arrived, "the brush has a soft attack of about 15 ms");
    EXPECT(dull < 0.85 * snare_noise, "the brush is duller than the snare");
    EXPECT(share_above(brush.left, 500.0, kRate) > 0.9, "the brush is noise with no drum under it");
    EXPECT_NEAR(ring_time(brush.left, kRate), 0.36, 0.07, "the brush falls in about 0.35 s");
  }

  // Rim: two partials near 480 Hz and 1.7 kHz, gone in about 60 ms.
  plain(device);
  Stereo rim = hit(device, E);
  {
    const double low = tone_level(rim.left, 480.0, kRate, 0, at(0.03));
    const double high = tone_level(rim.left, 1700.0, kRate, 0, at(0.03));
    const double between = tone_level(rim.left, 1000.0, kRate, 0, at(0.03));
    NOTE("rim: partials %.4f and %.4f (between %.4f), rings %.3f s\n", low, high, between,
         ring_time(rim.left, kRate, 0.002));
    EXPECT(low > 5.0 * between && high > 4.0 * between, "the rim knocks at 480 Hz and 1.7 kHz");
    EXPECT_NEAR(ring_time(rim.left, kRate, 0.002), 0.06, 0.015, "the rim is about 60 ms");
  }

  // Closed hat: high and short.
  plain(device);
  Stereo closed = hit(device, F);
  {
    NOTE("closed hat: above 5 kHz %.2f, centre %.0f Hz, rings %.3f s\n", share_above(closed.left, 5000.0, kRate),
         median_hz(closed.left, kRate), ring_time(closed.left, kRate, 0.002));
    EXPECT(share_above(closed.left, 5000.0, kRate) > 0.8, "most of the closed hat lies above 5 kHz");
    EXPECT_NEAR(ring_time(closed.left, kRate, 0.002), 0.045, 0.012, "the closed hat is about 45 ms");
  }

  // Shaker: a band from about 4 to 9 kHz that arrives softly.
  plain(device);
  Stereo shaker = hit(device, Fs);
  {
    const double first = rms(shaker.left, 0, at(0.002));
    const double arrived = rms(shaker.left, at(0.008), at(0.016));
    const double hat_first = rms(closed.left, 0, at(0.002)) / rms(closed.left, at(0.008), at(0.016));
    NOTE("shaker: above 3 kHz %.2f, above 12 kHz %.2f, first 2 ms %.2f of 8..16 ms (closed hat %.2f), rings %.3f s\n",
         share_above(shaker.left, 3000.0, kRate), share_above(shaker.left, 12000.0, kRate), first / arrived,
         hat_first, ring_time(shaker.left, kRate, 0.002));
    EXPECT(share_above(shaker.left, 3000.0, kRate) > 0.9 && share_above(shaker.left, 12000.0, kRate) < 0.2,
           "the shaker is a band between about 4 and 9 kHz");
    EXPECT(first < 0.2 * arrived && first / arrived < 0.3 * hat_first,
           "the shaker arrives softly where the hat strikes");
    EXPECT_NEAR(ring_time(shaker.left, kRate, 0.002), 0.095, 0.025, "the shaker falls in about 90 ms");
  }

  // Open hat: the closed hat's sound, ringing about 0.4 s.
  plain(device);
  Stereo open = hit(device, G);
  {
    NOTE("open hat: above 5 kHz %.2f, centre %.0f Hz, rings %.3f s\n", share_above(open.left, 5000.0, kRate),
         median_hz(open.left, kRate), ring_time(open.left, kRate));
    EXPECT(std::fabs(share_above(open.left, 5000.0, kRate) - share_above(closed.left, 5000.0, kRate)) < 0.08,
           "the open hat has the closed hat's spectrum");
    EXPECT_NEAR(ring_time(open.left, kRate), 0.4, 0.06, "the open hat rings about 0.4 s");
    EXPECT(max_diff(open, closed) > 0.0 && rms(open.left, 0, at(0.002)) > 0.0, "the open hat sounds");
    // Its strongest line is the eleventh harmonic of the 800 Hz pulse, and
    // it moves with the tuning as a partial does (the bands move half as far).
    const double line = dominant(open.left, kRate, 8000.0, 9600.0, at(0.01), at(0.2));
    plain(device);
    device.set_param(p::kTune, 1.0f);
    Stereo sharp = hit(device, G);
    const double moved = dominant(sharp.left, kRate, 8500.0, 10200.0, at(0.01), at(0.2));
    NOTE("open hat: strongest line at %.0f Hz, at %.0f Hz a semitone up\n", line, moved);
    EXPECT_NEAR(line, 8800.0, 30.0, "the hats are made of pulses at fixed ratios");
    EXPECT_NEAR(moved / line, 1.0595, 0.004, "the hats' partials move with the tuning");
  }

  // Clap: three bursts about 10 ms apart near 1.2 kHz, then a tail.
  plain(device);
  Stereo clap = hit(device, Gs);
  {
    double level[40];
    for (int ms = 0; ms < 40; ++ms) level[ms] = rms(clap.left, at(0.001 * ms), at(0.001 * (ms + 1)));
    const double burst1 = std::max(level[1], level[2]), gap1 = std::min(level[8], level[9]);
    const double burst2 = std::max(level[11], level[12]), gap2 = std::min(level[18], level[19]);
    const double burst3 = std::max(level[21], level[22]), gap3 = std::min(level[28], level[29]);
    const double tail = std::max(level[31], level[32]);
    NOTE("clap: bursts %.4f %.4f %.4f with %.4f %.4f %.4f before the next, tail from %.4f, centre %.0f Hz, rings %.3f s\n",
         burst1, burst2, burst3, gap1, gap2, gap3, tail, median_hz(clap.left, kRate), ring_time(clap.left, kRate));
    EXPECT(burst2 > 2.0 * gap1 && burst3 > 2.0 * gap2 && tail > 2.0 * gap3 && burst1 > 2.0 * gap1,
           "the clap is three bursts about 10 ms apart and then a tail");
    EXPECT(median_hz(clap.left, kRate) > 900.0 && median_hz(clap.left, kRate) < 2000.0,
           "the clap's band sits above 1.2 kHz");
    EXPECT_NEAR(ring_time(clap.left, kRate), 0.18, 0.04, "the clap's tail is about 0.15 s after its bursts");
  }

  // Toms: a sine with a small fall and a little skin noise.
  for (int key : {A, B}) {
    const double hz = key == A ? 110.0 : 165.0;
    const double seconds = key == A ? 0.4 : 0.3;
    char label[120];
    plain(device);
    Stereo tom = hit(device, key);
    const double rest = dominant(tom.left, kRate, hz * 0.5, hz * 4.0, at(0.08), at(0.22));
    const double start = dominant(tom.left, kRate, hz * 0.5, hz * 4.0, 0, at(0.02));
    const double skin = share_above(tom.left, hz * 2.4, kRate, 0, at(0.03));
    const double skin_late = share_above(tom.left, hz * 2.4, kRate, at(0.15), at(0.25));
    NOTE("%s: %.1f Hz at rest, %.1f Hz in the first 20 ms, rings %.3f s, above its body %.4f early %.6f late\n",
         kNames[key], rest, start, ring_time(tom.left, kRate), skin, skin_late);
    std::snprintf(label, sizeof label, "the %s sounds at its pitch", kNames[key]);
    EXPECT_NEAR(rest, hz, hz * 0.02, label);
    std::snprintf(label, sizeof label, "the %s falls a little in pitch", kNames[key]);
    EXPECT(start > 1.08 * rest && start < 2.0 * rest, label);
    std::snprintf(label, sizeof label, "the %s rings its time", kNames[key]);
    EXPECT_NEAR(ring_time(tom.left, kRate), seconds, seconds * 0.15, label);
    std::snprintf(label, sizeof label, "the %s has a skin noise at its start only", kNames[key]);
    EXPECT(skin > 0.002 && skin_late < 0.1 * skin, label);
  }

  // Tick: two partials from 2.2 kHz, about 40 ms.
  plain(device);
  Stereo tick = hit(device, As);
  {
    const double first = tone_level(tick.left, 2200.0, kRate, at(0.004), at(0.024));
    const double second = tone_level(tick.left, 3410.0, kRate, at(0.004), at(0.024));
    const double between = tone_level(tick.left, 2800.0, kRate, at(0.004), at(0.024));
    const double start = dominant(tick.left, kRate, 1500.0, 3000.0, 0, at(0.004));
    const double rest = dominant(tick.left, kRate, 1500.0, 3000.0, at(0.012), at(0.03));
    NOTE("tick: partials %.4f and %.4f (between %.5f), %.0f Hz at first and %.0f Hz after, rings %.3f s\n", first,
         second, between, start, rest, ring_time(tick.left, kRate, 0.002));
    EXPECT(first > 8.0 * between && second > 1.5 * between, "the tick has its two partials");
    EXPECT_NEAR(rest, 2200.0, 40.0, "the tick sits near 2.2 kHz");
    EXPECT(start > rest + 20.0, "the tick has a little fall in pitch");
    EXPECT_NEAR(ring_time(tick.left, kRate, 0.002), 0.04, 0.012, "the tick is about 40 ms");
  }
}

// --- the controls -----------------------------------------------------------------------

// 4. Every control does what it says.
static void test_controls() {
  // Length scales how long every drum rings.
  for (int key : {C, Ds, F, A}) {
    char label[120];
    const double window = key == F ? 0.002 : 0.005;
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

  // Tone: the top of the tonal drums, the upper edge of the noise drums.
  struct Toned {
    int key;
    double hz, seconds;  // the share above `hz` in the first `seconds`
  };
  const Toned toned[] = {{C, 1500.0, 0.02}, {D, 4000.0, 0.3}, {Ds, 3000.0, 0.4}, {E, 1200.0, 0.06},
                         {F, 9000.0, 0.06}, {Fs, 7500.0, 0.1}, {Gs, 2500.0, 0.2}, {A, 600.0, 0.03}, {As, 2800.0, 0.04}};
  for (const Toned& v : toned) {
    char label[120];
    double share[3], level[3];
    int index = 0;
    for (float tone : {0.0f, 0.5f, 1.0f}) {
      plain(device);
      device.set_param(p::kTone, tone);
      if (v.key == C || v.key == A) device.set_param(p::kSnap, 1.0f);
      Stereo out = hit(device, v.key);
      share[index] = share_above(out.left, v.hz, kRate, 0, at(v.seconds));
      level[index++] = db(rms(out.left, 0, at(v.seconds)));
    }
    NOTE("tone: %-10s above %5.0f Hz: %.5f dull, %.5f centre, %.5f bright; level %+.1f and %+.1f dB on the centre\n",
         kNames[v.key], v.hz, share[0], share[1], share[2], level[0] - level[1], level[2] - level[1]);
    std::snprintf(label, sizeof label, "Tone takes the %s from dull to bright", kNames[v.key]);
    // The tick is two partials, both high: Tone can only lean on the upper one.
    const double step = v.key == As ? 0.5 : 1.0;
    EXPECT(share[1] > (1.0 + 0.3 * step) * share[0] && share[2] > (1.0 + 0.15 * step) * share[1], label);
    std::snprintf(label, sizeof label, "Tone leaves the %s within 8 dB of its level", kNames[v.key]);
    EXPECT(std::fabs(level[0] - level[1]) < 8.0 && std::fabs(level[2] - level[1]) < 8.0, label);
  }

  // Punch: how far the kick and toms fall, and how hard they start.
  {
    double start[3], early[3];
    int index = 0;
    for (float punch : {0.0f, 0.35f, 1.0f}) {
      plain(device);
      device.set_param(p::kPunch, punch);
      device.set_param(p::kSnap, 0.0f);
      Stereo kick = hit(device, C);
      start[index] = dominant(kick.left, kRate, 30.0, 1000.0, 0, at(0.015));
      early[index] = peak(kick.left, 0, at(0.002)) / peak(kick.left);
      const double rest = dominant(kick.left, kRate, 30.0, 1000.0, at(0.1), at(0.2));
      NOTE("punch %.2f: kick at %.1f Hz in the first 15 ms, %.1f Hz at 100..200 ms, %.3f of its peak by 2 ms\n",
           punch, start[index], rest, early[index]);
      EXPECT_NEAR(rest, 49.5, 1.5, "Punch leaves the kick's resting pitch alone");
      ++index;
    }
    EXPECT(start[1] > 1.4 * start[0] && start[2] > 1.5 * start[1], "Punch raises the pitch the kick starts at");
    EXPECT(early[2] > 1.2 * early[1] && early[1] > 1.5 * early[0], "Punch hardens the kick's first milliseconds");
    plain(device);
    device.set_param(p::kPunch, 0.0f);
    const double soft = dominant(hit(device, A).left, kRate, 60.0, 800.0, 0, at(0.02));
    plain(device);
    device.set_param(p::kPunch, 1.0f);
    const double hard = dominant(hit(device, A).left, kRate, 60.0, 800.0, 0, at(0.02));
    NOTE("punch: low tom starts at %.1f Hz with none and %.1f Hz with all of it\n", soft, hard);
    EXPECT(hard > 1.3 * soft, "Punch raises the pitch the toms start at");
  }

  // Snap: the kick's click, the snare's noise, the hats' bite.
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
    EXPECT(none < 1.0e-5, "Snap 0 leaves the kick's first milliseconds without energy above 2 kHz");
    EXPECT(some > 0.003 && some > 300.0 * none, "Snap puts a click on the kick");

    double noise_share[2], bite[2], front[2], wire_level[2], hat_peak[2];
    int index = 0;
    for (float snap : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kSnap, snap);
      Stereo snare = hit(device, D);
      noise_share[index] = share_above(snare.left, 1000.0, kRate, 0, at(0.05));
      // The snares alone, without the tones under them.
      const std::vector<float> wires = highpassed(snare.left, 2000.0, kRate);
      front[index] = rms(wires, 0, at(0.001)) / rms(wires, at(0.006), at(0.012));
      wire_level[index] = rms(wires, at(0.02), at(0.1));
      plain(device);
      device.set_param(p::kSnap, snap);
      Stereo hat = hit(device, F);
      bite[index] = rms(hat.left, 0, at(0.0005)) / rms(hat.left, at(0.003), at(0.005));
      hat_peak[index] = rms(hat.left, 0, at(0.001)) / rms(hat.left, at(0.012), at(0.02));
      ++index;
    }
    NOTE("snap: snare above 1 kHz %.3f at 0 and %.3f at 1; front against what follows: snares %.3f and %.3f, hat %.3f and %.3f\n",
         noise_share[0], noise_share[1], front[0], front[1], bite[0], bite[1]);
    NOTE("snap: the snares are %.5f at 0 and %.5f at 1; the hat's first ms against 12..20 ms %.2f and %.2f\n",
         wire_level[0], wire_level[1], hat_peak[0], hat_peak[1]);
    EXPECT(noise_share[1] > 3.0 * noise_share[0], "Snap sets the snare's noise against its tone");
    EXPECT(wire_level[1] > 2.5 * wire_level[0], "Snap brings the snares up");
    EXPECT(bite[1] > 5.0 * bite[0] && bite[1] > 1.0, "Snap gives the hats their bite");
    // The attack alone would leave the first millisecond 7.5 times what follows.
    EXPECT(hat_peak[1] > 9.0 && hat_peak[0] < 1.0, "the bite is more than a quick attack");
    EXPECT(bite[0] < 0.2 && front[0] < 0.2 && front[1] > 3.0 * front[0], "at Snap 0 the drums start soft");
  }

  // Drive: thicker and not louder.
  {
    plain(device);
    device.set_param(p::kPunch, 0.0f);
    device.set_param(p::kSnap, 0.0f);
    Stereo clean = hit(device, C);
    plain(device);
    device.set_param(p::kPunch, 0.0f);
    device.set_param(p::kSnap, 0.0f);
    device.set_param(p::kDrive, 1.0f);
    Stereo driven = hit(device, C);
    const double hz = dominant(clean.left, kRate, 30.0, 100.0, at(0.01), at(0.09));
    const double third_clean = tone_level(clean.left, 3.0 * hz, kRate, at(0.01), at(0.09)) /
                               tone_level(clean.left, hz, kRate, at(0.01), at(0.09));
    const double third = tone_level(driven.left, 3.0 * hz, kRate, at(0.01), at(0.09)) /
                         tone_level(driven.left, hz, kRate, at(0.01), at(0.09));
    const double fifth = tone_level(driven.left, 5.0 * hz, kRate, at(0.01), at(0.09)) /
                         tone_level(driven.left, hz, kRate, at(0.01), at(0.09));
    const double second = tone_level(driven.left, 2.0 * hz, kRate, at(0.01), at(0.09)) /
                          tone_level(driven.left, hz, kRate, at(0.01), at(0.09));
    const double peak_change = db(peak(driven.left)) - db(peak(clean.left));
    const double body_change = db(rms(driven.left, 0, at(0.3))) - db(rms(clean.left, 0, at(0.3)));
    NOTE("drive: kick at %.1f Hz, third harmonic %.4f clean and %.4f driven, fifth %.4f, second %.4f; peak %+.2f dB, rms %+.2f dB\n",
         hz, third_clean, third, fifth, second, peak_change, body_change);
    EXPECT(third > 0.03 && third > 10.0 * third_clean && fifth > 2.0 * third_clean, "Drive raises the kick's odd harmonics");
    EXPECT(third > 3.0 * second, "the harmonics Drive adds are the odd ones");
    EXPECT(std::fabs(peak_change) < 1.5, "Drive keeps the kick's peak within 1.5 dB");
    EXPECT(body_change > 1.0, "Drive thickens: the body comes up under the same peak");
    plain(device);
    device.set_param(p::kDrive, 1.0f);
    Stereo bar;
    busy_bar(device, 0.9f, &bar);
    plain(device);
    Stereo bar_clean;
    busy_bar(device, 0.9f, &bar_clean);
    NOTE("drive: busy bar peaks %.3f driven, %.3f clean\n", both_peak(bar), both_peak(bar_clean));
    EXPECT(db(both_peak(bar)) - db(both_peak(bar_clean)) < 1.5, "a driven bar is not louder at its peaks");
  }

  // Volume is the level it says.
  {
    plain(device);
    Stereo unity = hit(device, Cs);
    plain(device);
    device.set_param(p::kVolume, -12.0f);
    Stereo down = hit(device, Cs);
    EXPECT_NEAR(db(peak(down.left)) - db(peak(unity.left)), -12.0, 0.05, "Volume -12 dB is 12 dB down");
  }

  // Kit: each choice is a different kit on every drum, in the direction it says.
  {
    Shape shapes[4][12];
    double level[4][12];
    double kick_low[4];
    for (int kit = 0; kit < 4; ++kit) {
      for (int key = 0; key < 12; ++key) {
        plain(device);
        device.set_param(p::kKit, static_cast<float>(kit));
        Stereo out = hit(device, key, 0.7f, 2.5f);
        shapes[kit][key] = shape_of(out);
        level[kit][key] = db(both_peak(out));
        if (key == C) kick_low[kit] = 1.0 - share_above(out.left, 70.0, kRate);
      }
    }
    double nearest = 1.0e9;
    int nearest_key = 0;
    for (int key = 0; key < 12; ++key) {
      for (int a = 0; a < 4; ++a) {
        for (int b = a + 1; b < 4; ++b) {
          const double d = apart(shapes[a][key], shapes[b][key]);
          if (d < nearest) {
            nearest = d;
            nearest_key = key;
          }
        }
      }
    }
    NOTE("kit: kick rings %.3f / %.3f / %.3f / %.3f s, closed hat centre %.0f / %.0f / %.0f / %.0f Hz, kick under 70 Hz %.3f / %.3f / %.3f / %.3f\n",
         shapes[0][C].ring, shapes[1][C].ring, shapes[2][C].ring, shapes[3][C].ring, shapes[0][F].median,
         shapes[1][F].median, shapes[2][F].median, shapes[3][F].median, kick_low[0], kick_low[1], kick_low[2],
         kick_low[3]);
    NOTE("kit: the two closest kits on one drum are %.2f apart (%s)\n", nearest, kNames[nearest_key]);
    EXPECT(nearest > 0.2, "every Kit choice measures differently on every drum");
    EXPECT(shapes[1][C].ring > 1.4 * shapes[0][C].ring && shapes[1][A].ring > 1.4 * shapes[0][A].ring,
           "Deep: the kick and toms ring about 1.6 times as long");
    EXPECT(shapes[1][F].median < 0.85 * shapes[0][F].median && shapes[1][C].median < shapes[0][C].median,
           "Deep: darker hats and a lower kick");
    EXPECT(shapes[2][C].ring < 0.7 * shapes[0][C].ring && shapes[2][Ds].ring < 0.7 * shapes[0][Ds].ring,
           "Tight: everything about 0.6 times as long");
    EXPECT(shapes[2][F].median > 1.08 * shapes[0][F].median, "Tight: brighter hats");
    EXPECT(shapes[3][C].ring < 0.6 * shapes[0][C].ring && shapes[3][A].ring < 0.6 * shapes[0][A].ring,
           "Paper: tones damped quickly");
    EXPECT(kick_low[3] < 0.2 * kick_low[0], "Paper: little low end under 70 Hz");
    EXPECT(shapes[3][F].median < 0.75 * shapes[0][F].median && shapes[3][Ds].median < 0.8 * shapes[0][Ds].median,
           "Paper: the noise drums are lower");
    for (int kit = 1; kit < 4; ++kit) {
      for (int key = 0; key < 12; ++key) {
        NOTE("kit %d: %-10s peaks %+.1f dB on the Soft kit\n", kit, kNames[key], level[kit][key] - level[0][key]);
        if (std::fabs(level[kit][key] - level[0][key]) > 4.0) {
          std::printf("FAIL: kit %d leaves the %s %.1f dB from the Soft kit\n", kit, kNames[key],
                      level[kit][key] - level[0][key]);
          ++testkit::failures();
        }
      }
    }
  }
}

// 5. A soft hit is quieter and duller.
static void test_velocity() {
  for (int key : {C, D, Ds, F, Gs, A}) {
    char label[120];
    const bool tonal = key == C || key == A;
    plain(device);
    Stereo soft = hit(device, key, 0.2f);
    plain(device);
    Stereo hard = hit(device, key, 1.0f);
    const double level = db(peak(hard.left)) - db(peak(soft.left));
    const double dull = tonal ? share_above(soft.left, 300.0, kRate, 0, at(0.03)) : median_hz(soft.left, kRate);
    const double bright = tonal ? share_above(hard.left, 300.0, kRate, 0, at(0.03)) : median_hz(hard.left, kRate);
    NOTE("velocity: %-10s hard is %+.1f dB on soft; brightness %.4g soft, %.4g hard\n", kNames[key], level, dull,
         bright);
    std::snprintf(label, sizeof label, "a soft %s is quieter", kNames[key]);
    EXPECT(level > 6.0 && level < 16.0, label);
    std::snprintf(label, sizeof label, "a soft %s is duller", kNames[key]);
    EXPECT(bright > 1.08 * dull, label);
  }
  // The level law: 0.25 + 0.75 * gain, read on the sub, which is one sine.
  plain(device);
  const double low = peak(hit(device, Cs, 0.0f).left);
  plain(device);
  const double full = peak(hit(device, Cs, 1.0f).left);
  NOTE("velocity: sub at gain 0 is %.3f of gain 1\n", low / full);
  EXPECT_NEAR(low / full, 0.25, 0.04, "the quietest hit is a quarter of the loudest");
  // Gains outside 0..1 are the nearest end, and a note that is no note is ignored.
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
  plain(device);
  device.note_on(1, std::nanf(""), 0.7f);
  Stereo nothing = render(device, 0.2f, kRate);
  EXPECT(peak(nothing.left) == 0.0 && peak(nothing.right) == 0.0, "a note with no frequency is ignored");
}

// 6. Variation: none repeats exactly, all of it differs within about 6 dB.
static void test_variation() {
  for (int key : {C, D, F, Gs}) {
    char label[120];
    plain(device);
    Stereo first = hit(device, key, 0.7f, 2.0f);
    Stereo second = hit(device, key, 0.7f, 2.0f);
    Stereo third = hit(device, key, 0.7f, 2.0f);
    std::snprintf(label, sizeof label, "with Variation at 0 every %s is the same sample for sample", kNames[key]);
    EXPECT(first.left == second.left && first.right == second.right && second.left == third.left && rms(first.left) > 0.0,
           label);

    device.init(kRate);
    device.set_param(p::kVariation, 1.0f);
    double quietest = 1.0e9, loudest = -1.0e9, shortest = 1.0e9, longest = 0.0, dullest = 1.0e9, brightest = 0.0;
    double least = 1.0e9;
    Stereo last;
    for (int n = 0; n < 16; ++n) {
      Stereo out = hit(device, key, 0.7f, 2.0f);
      const double level = db(rms(out.left, 0, at(0.25)));
      const double window = key == F ? 0.002 : 0.005;
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
  // Level alone, read on the sub's peak (one sine, no tone to move); tone
  // alone, read on where the brush's band ends against its redrawn noise.
  {
    double quietest = 1.0e9, loudest = -1.0e9, dullest = 1.0e9, brightest = 0.0, steady_low = 1.0e9, steady_high = 0.0;
    double flattest = 1.0e9, sharpest = -1.0e9;
    device.init(kRate);
    device.set_param(p::kVariation, 1.0f);
    for (int n = 0; n < 16; ++n) {
      const double level = db(peak(hit(device, Cs, 0.7f, 2.5f).left));
      quietest = std::min(quietest, level);
      loudest = std::max(loudest, level);
      const double cents = 1200.0 * std::log2(dominant(hit(device, A, 0.7f, 1.5f).left, kRate, 90.0, 135.0, at(0.08), at(0.3)) / 110.0);
      flattest = std::min(flattest, cents);
      sharpest = std::max(sharpest, cents);
    }
    NOTE("variation 1: low tom tuned from %+.1f to %+.1f cents\n", flattest, sharpest);
    EXPECT(sharpest - flattest > 10.0 && sharpest < 30.0 && flattest > -30.0,
           "Variation moves the tuning of each hit by a few cents");
    for (float variation : {1.0f, 0.01f}) {
      device.init(kRate);
      device.set_param(p::kVariation, variation);
      for (int n = 0; n < 16; ++n) {
        const double edge = share_above(hit(device, Ds, 0.7f, 1.0f).left, 4000.0, kRate);
        if (variation == 1.0f) {
          dullest = std::min(dullest, edge);
          brightest = std::max(brightest, edge);
        } else {
          steady_low = std::min(steady_low, edge);
          steady_high = std::max(steady_high, edge);
        }
      }
    }
    NOTE("variation 1: sub peaks over %.2f dB; brush above 4 kHz %.3f..%.3f (%.3f..%.3f with the noise alone redrawn)\n",
         loudest - quietest, dullest, brightest, steady_low, steady_high);
    EXPECT(loudest - quietest > 1.0 && loudest - quietest < 3.0, "Variation moves the level of each hit by a decibel or two");
    EXPECT(brightest - dullest > 2.0 * (steady_high - steady_low), "Variation moves the tone of each hit");
  }
  // The noise itself is redrawn.
  device.init(kRate);
  device.set_param(p::kVariation, 0.05f);
  Stereo a = hit(device, Ds, 0.7f, 1.0f);
  Stereo b = hit(device, Ds, 0.7f, 1.0f);
  NOTE("variation 0.05: two brushes are %.2f apart\n", distance(a.left, b.left));
  EXPECT(distance(a.left, b.left) > 0.8, "with any Variation the noise is new at each hit");
  // The same notes always give the same audio, whatever came before init.
  device.init(kRate);
  device.set_param(p::kVariation, 1.0f);
  Stereo once;
  busy_bar(device, 0.8f, &once);
  device.init(kRate);
  device.set_param(p::kVariation, 1.0f);
  Stereo again;
  busy_bar(device, 0.8f, &again);
  EXPECT(once.left == again.left && once.right == again.right, "the same notes give the same audio after init");
}

// 7. Width: 0 is mono, the low drums stay in the centre.
static void test_width() {
  device.init(kRate);
  device.set_param(p::kWidth, 0.0f);
  device.set_param(p::kDrive, 0.5f);
  Stereo mono;
  busy_bar(device, 0.9f, &mono);
  EXPECT(mono.left == mono.right && rms(mono.left) > 0.0, "Width 0 is exactly mono");

  for (int key : {C, Cs, D, Ds}) {
    char label[120];
    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    Stereo out = hit(device, key);
    std::snprintf(label, sizeof label, "the %s is in the centre at Width 1", kNames[key]);
    EXPECT(out.left == out.right && rms(out.left) > 0.0, label);
  }
  struct Placed {
    int key;
    double side;  // right over left, in dB, at Width 1
  };
  const Placed placed[] = {{E, -4.4}, {F, 6.3}, {Fs, -8.4}, {G, 7.4}, {A, -9.5}, {As, 9.5}, {B, 5.4}};
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
    NOTE("width: %-10s right over left %+.1f dB at 1, %+.1f dB at 0.4\n", kNames[v.key], full, some);
    std::snprintf(label, sizeof label, "the %s sits to its side at Width 1", kNames[v.key]);
    EXPECT_NEAR(full, v.side, 0.6, label);
    std::snprintf(label, sizeof label, "the %s sits nearer the centre at Width 0.4", kNames[v.key]);
    EXPECT(std::fabs(some) > 0.8 && std::fabs(some) < 0.6 * std::fabs(full) && some * full > 0.0, label);
  }
  // The clap is wide: its sides are their own noise.
  plain(device);
  device.set_param(p::kWidth, 1.0f);
  Stereo wide = hit(device, Gs);
  plain(device);
  device.set_param(p::kWidth, 0.0f);
  Stereo narrow = hit(device, Gs);
  NOTE("width: clap left and right correlate %.3f at 1, %.5f at 0\n", correlation(wide.left, wide.right),
       correlation(narrow.left, narrow.right));
  EXPECT(correlation(wide.left, wide.right) < 0.6, "the clap is wide at Width 1");
  EXPECT(narrow.left == narrow.right, "and mono at Width 0");
}

// 8. Retrigger, and the choke.
static void test_retrigger() {
  auto soft_kit = [](DrumKit& d) {
    plain(d);
    d.set_param(p::kSnap, 0.0f);
  };
  for (int key : {C, Cs, A, G}) {
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
    Stereo after = render(device, 3.0f, kRate);
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
    EXPECT(peak(after.left, at(2.0)) == 0.0, "and the kit is silent after the roll");
  }

  // The older hit is let go, not left to pile up: a roll of the sub is no
  // louder at its end than at its start.
  soft_kit(device);
  Stereo roll;
  for (int n = 0; n < 50; ++n) {
    device.note_on(n, key_hz(Cs), 0.8f);
    Stereo part = render(device, 0.02f, kRate);
    roll = n == 0 ? part : concat(roll, part);
  }
  NOTE("retrigger: sub roll rms %.4f in its first 100 ms, %.4f in its last\n", rms(roll.left, 0, at(0.1)),
       rms(roll.left, at(0.9), at(1.0)));
  EXPECT(rms(roll.left, at(0.9), at(1.0)) < 1.5 * rms(roll.left, at(0.02), at(0.12)),
         "a drum struck again lets its older hit go");

  // The fade of the older hit begins gradually, and so does the end of a
  // slot taken a third time inside that fade.
  const double again = suddenness(
      [&](DrumKit& d) {
        soft_kit(d);
        d.note_on(1, key_hz(Cs), 0.8f);
      },
      [](DrumKit& d) { d.note_on(2, key_hz(Cs, 2), 0.0f); });
  NOTE("retrigger: a second strike is %.3f there after 8 samples\n", again);
  EXPECT(again < 0.2, "the older hit fades, it is not cut");
  const double thrice = suddenness(
      [&](DrumKit& d) {
        soft_kit(d);
        d.note_on(1, key_hz(Cs), 0.8f);
        render(d, 0.03f, kRate);
        d.note_on(2, key_hz(Cs, 2), 0.0f);
        render(d, 0.001f, kRate);
      },
      [](DrumKit& d) { d.note_on(3, key_hz(Cs, 2), 0.0f); }, 0.0);
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

  // Different drums never take each other's slots.
  plain(device);
  Stereo tom = hit(device, A, 0.7f, 0.5f);
  plain(device);
  device.note_on(1, key_hz(A), 0.7f);
  Stereo start = render(device, 0.05f, kRate);
  for (int key : {C, Cs, D, Ds, E, F, Fs, G, Gs, As, B}) device.note_on(10 + key, key_hz(key), 0.2f);
  Stereo crowded = concat(start, render(device, 0.45f, kRate));
  NOTE("slots: low tom at 110 Hz %.5f alone, %.5f under eleven other drums\n",
       tone_level(tom.left, 110.0, kRate, at(0.15), at(0.35)), tone_level(crowded.left, 110.0, kRate, at(0.15), at(0.35)));
  EXPECT_NEAR(tone_level(crowded.left, 110.0, kRate, at(0.15), at(0.35)) /
                  tone_level(tom.left, 110.0, kRate, at(0.15), at(0.35)),
              1.0, 0.05, "other drums do not take a ringing drum's slot");

  // The choke: a closed hat or a shaker ends a ringing open hat.
  plain(device);
  Stereo ringing = hit(device, G, 0.7f, 0.5f);
  const double alone = rms(ringing.left, at(0.15), at(0.17));
  NOTE("choke: an open hat alone is %.1f dB under its start at 150 ms\n",
       db(alone) - db(rms(ringing.left, at(0.005), at(0.025))));
  EXPECT(alone > 0.05 * rms(ringing.left, at(0.005), at(0.025)), "an open hat alone still rings at 150 ms");
  for (int key : {F, Fs}) {
    char label[120];
    plain(device);
    device.note_on(1, key_hz(G), 0.7f);
    Stereo before = render(device, 0.05f, kRate);
    device.note_on(2, key_hz(key), 0.7f);
    Stereo choked = concat(before, render(device, 0.45f, kRate));
    // The choking drum alone, at the same moment: taken off, what is left
    // is the open hat (the kit is linear under the clip's knee).
    plain(device);
    Stereo lead = render(device, 0.05f, kRate);
    Stereo closer = concat(lead, hit(device, key, 0.7f, 0.45f));
    std::vector<float> left_over(choked.size());
    for (size_t i = 0; i < left_over.size(); ++i) left_over[i] = choked.left[i] - closer.left[i];
    const double at_2ms = rms(left_over, at(0.0515), at(0.0525)) / rms(ringing.left, at(0.0515), at(0.0525));
    const double at_10ms = rms(left_over, at(0.059), at(0.061)) / rms(ringing.left, at(0.059), at(0.061));
    const double at_150 = rms(left_over, at(0.15), at(0.17)) / alone;
    NOTE("choke by %s: the open hat is %.3f of itself 2 ms on, %.5f 10 ms on, %.6f at 150 ms\n", kNames[key], at_2ms,
         at_10ms, at_150);
    std::snprintf(label, sizeof label, "a %s 50 ms into an open hat leaves it 30 dB down by 150 ms", kNames[key]);
    EXPECT(at_150 < 0.0316, label);
    std::snprintf(label, sizeof label, "a %s chokes the open hat in about 8 ms", kNames[key]);
    EXPECT(at_2ms > 0.5 && at_2ms < 0.98 && at_10ms < 0.01, label);
  }
  const double choke = suddenness(
      [](DrumKit& d) {
        plain(d);
        d.set_param(p::kWidth, 0.0f);
        d.note_on(1, key_hz(G), 0.7f);
      },
      [](DrumKit& d) {
        d.set_param(p::kVolume, 0.0f);
        d.note_on(2, key_hz(Fs, 2), 0.0f);
      });
  NOTE("choke: %.3f there after 8 samples\n", choke);
  EXPECT(choke < 0.3, "the choke is a fade of some milliseconds, not a cut");
}

// 9. Levels: every drum at gain 0.7 in its window, and a busy bar under the knee.
static void test_levels() {
  double levels[12];
  for (int key = 0; key < 12; ++key) {
    char label[120];
    device.init(kRate);  // the defaults, Variation included
    Stereo out = hit(device, key, 0.7f, 2.0f);
    levels[key] = db(both_peak(out));
    plain(device);
    Stereo steady = hit(device, key, 0.7f, 2.0f);
    NOTE("level: %-10s peaks %6.1f dBFS at the defaults (%6.1f with Variation 0), rings %.3f s, centre %.0f Hz\n",
         kNames[key], levels[key], db(both_peak(steady)), ring_time(steady.left, kRate, key == F || key == As || key == E ? 0.002 : 0.005),
         median_hz(steady.left, kRate));
    std::snprintf(label, sizeof label, "one %s at gain 0.7 peaks between -24 and -10 dBFS (%.1f)", kNames[key],
                  levels[key]);
    EXPECT(levels[key] > -24.0 && levels[key] < -10.0, label);
  }
  for (int key = 1; key < 12; ++key) {
    char label[120];
    std::snprintf(label, sizeof label, "the kick is the strongest drum (the %s is not)", kNames[key]);
    EXPECT(levels[key] < levels[C], label);
  }
  EXPECT(levels[F] < levels[C] - 6.0 && levels[Fs] < levels[C] - 6.0 && levels[G] < levels[C] - 5.0 &&
             levels[As] < levels[C] - 5.0,
         "the hats, shaker and tick sit well under the kick");

  device.init(kRate);
  Stereo bar;
  busy_bar(device, 0.9f, &bar);
  NOTE("level: a busy bar at gain 0.9 peaks %.3f\n", both_peak(bar));
  EXPECT(both_peak(bar) < 0.9 && both_peak(bar) > 0.2, "a busy bar stays under the clip knee");

  // The soft clip: every drum at once, hard, with the volume up, lands on full scale.
  device.init(kRate);
  device.set_param(p::kVolume, 6.0f);
  for (int n = 0; n < 4; ++n) {
    for (int key = 0; key < 12; ++key) device.note_on(key, key_hz(key, n - 2), 1.0f);
  }
  Stereo pile = render(device, 0.5f, kRate);
  NOTE("level: forty-eight hard hits at once at +6 dB peak %.4f\n", both_peak(pile));
  EXPECT(both_peak(pile) <= 1.0 && both_peak(pile) > 0.9, "the kit ends in a soft clip");
}

// 10. The same kit at 44.1 and 96 kHz.
static void test_rates() {
  struct Reading {
    double hz, ring, level, centre;
  };
  auto read = [](int key, float rate, double lo, double hi, double from, double to) {
    plain(device, rate);
    Stereo out = hit(device, key, 0.7f, 2.0f, rate);
    Reading r;
    r.hz = lo > 0.0 ? dominant(out.left, rate, lo, hi, at(from, rate), at(to, rate)) : 0.0;
    r.ring = ring_time(out.left, rate, key == F || key == As ? 0.002 : 0.005);
    r.level = db(rms(out.left, 0, at(0.2, rate)));
    r.centre = median_hz(out.left, rate);
    return r;
  };
  struct Probe {
    int key;
    double lo, hi, from, to;
  };
  const Probe probes[] = {{C, 30.0, 100.0, 0.1, 0.3},     {Cs, 30.0, 100.0, 0.1, 0.4}, {D, 120.0, 260.0, 0.03, 0.09},
                          {Ds, 0.0, 0.0, 0.0, 0.0},       {E, 300.0, 700.0, 0.004, 0.03}, {F, 0.0, 0.0, 0.0, 0.0},
                          {Fs, 0.0, 0.0, 0.0, 0.0},       {G, 0.0, 0.0, 0.0, 0.0},     {Gs, 0.0, 0.0, 0.0, 0.0},
                          {A, 70.0, 180.0, 0.08, 0.25},   {As, 1500.0, 3000.0, 0.004, 0.02}, {B, 100.0, 260.0, 0.08, 0.22}};
  for (const Probe& v : probes) {
    const Reading home = read(v.key, 48000.0f, v.lo, v.hi, v.from, v.to);
    for (float rate : {44100.0f, 96000.0f}) {
      char label[160];
      const Reading there = read(v.key, rate, v.lo, v.hi, v.from, v.to);
      NOTE("rate %.0f: %-10s %.1f Hz (%.1f), rings %.3f s (%.3f), level %+.2f dB, centre %.0f Hz (%.0f)\n", rate,
           kNames[v.key], there.hz, home.hz, there.ring, home.ring, there.level - home.level, there.centre, home.centre);
      if (v.lo > 0.0) {
        std::snprintf(label, sizeof label, "the %s has the same pitch at %.0f Hz", kNames[v.key], rate);
        EXPECT_NEAR(there.hz / home.hz, 1.0, 0.01, label);
      }
      std::snprintf(label, sizeof label, "the %s rings as long at %.0f Hz", kNames[v.key], rate);
      EXPECT_NEAR(there.ring / home.ring, 1.0, 0.09, label);
      std::snprintf(label, sizeof label, "the %s is as loud at %.0f Hz", kNames[v.key], rate);
      // The clap is three bursts of a few milliseconds: its level is a matter of few samples.
      EXPECT_NEAR(there.level - home.level, 0.0, v.key == Gs ? 2.2 : 1.5, label);
      std::snprintf(label, sizeof label, "the %s is about as bright at %.0f Hz", kNames[v.key], rate);
      EXPECT_NEAR(there.centre / home.centre, 1.0, 0.12, label);
    }
  }
}

// 11. No clicks from the smoothed controls, and nothing depends on the block size.
static void test_clicks_and_blocks() {
  // Volume and Tone thrown across their range, block by block, under a ringing sub.
  plain(device);
  device.set_param(p::kLength, 4.0f);
  Stereo steady = hit(device, Cs, 0.8f, 0.6f);
  plain(device);
  device.set_param(p::kLength, 4.0f);
  device.note_on(1, key_hz(Cs), 0.8f);
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
  NOTE("clicks: sub steps %.5f at rest, %.5f with Volume, Tone and Width thrown every block\n", own, moved);
  EXPECT(moved < 6.0 * own, "Volume and Tone swept under a ringing drum make no step");

  struct Throw {
    const char* name;
    int param;
    float from, to;
    int key;
  };
  const Throw throws[] = {{"Volume", p::kVolume, 0.0f, -24.0f, Cs}, {"Volume", p::kVolume, -24.0f, 6.0f, G},
                          {"Tone", p::kTone, 1.0f, 0.0f, G},        {"Tone", p::kTone, 0.0f, 1.0f, Ds},
                          {"Width", p::kWidth, 0.0f, 1.0f, G},      {"Drive", p::kDrive, 0.0f, 1.0f, Cs}};
  for (const Throw& t : throws) {
    char label[160];
    const double sudden = suddenness(
        [&](DrumKit& d) {
          plain(d);
          d.set_param(p::kLength, 2.0f);
          d.set_param(t.param, t.from);
          d.note_on(1, key_hz(t.key), 0.8f);
        },
        [&](DrumKit& d) { d.set_param(t.param, t.to); });
    NOTE("clicks: %s thrown from %g to %g under the %s is %.3f there after 8 samples\n", t.name, t.from, t.to,
         kNames[t.key], sudden);
    std::snprintf(label, sizeof label, "%s thrown from %g to %g arrives gradually (%.2f)", t.name, t.from, t.to, sudden);
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

  // A phrase with a silence that steps across the moment the kit falls
  // asleep, and knobs moved inside the silence: the same audio at every
  // block size.
  double worst = 0.0;
  for (double gap : {0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.24, 0.26, 1.0}) {
    const size_t second = at(0.0113 + gap);
    const std::vector<Event> events = {
        {at(0.0113), [](DrumKit& d) { d.note_on(1, key_hz(F), 0.8f); }},
        {second - 150, [](DrumKit& d) {
           d.set_param(p::kVolume, -9.0f);
           d.set_param(p::kTone, 0.9f);
           d.set_param(p::kWidth, 1.0f);
           d.set_param(p::kDrive, 0.5f);
         }},
        {second, [](DrumKit& d) { d.note_on(2, key_hz(D), 0.8f); }},
        {second + 777, [](DrumKit& d) { d.note_on(3, key_hz(G), 0.6f); }},
        {second + 2999, [](DrumKit& d) { d.set_param(p::kTone, 0.2f); }},
        {second + 4001, [](DrumKit& d) { d.note_on(4, key_hz(F), 0.6f); }},
    };
    const size_t total = second + at(0.4);
    device.init(kRate);
    Stereo reference = play(device, events, total, {128});
    for (const std::vector<int>& sizes : {std::vector<int>{1}, std::vector<int>{2048}, std::vector<int>{1, 7, 64, 128, 33, 512, 2048, 5}}) {
      device.init(kRate);
      Stereo out = play(device, events, total, sizes);
      worst = std::max(worst, max_diff(out, reference));
    }
  }
  NOTE("blocks: the phrase differs by %g at most between block sizes\n", worst);
  EXPECT(worst < 1.0e-6, "the output does not depend on the block size, across a silence");

  // Knobs moved while the kit sleeps are in place for the next hit.
  plain(device);
  hit(device, F, 0.8f, 1.0f);
  device.process(13);  // off the beat of the control clock
  render(device, 0.5f, kRate);
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
  EXPECT(moved_under.left == untouched.left, "Kit, Tune, Length, Punch, Snap and Variation are heard from the next hit");
}

int main() {
  Conformance spec;
  spec.name = "drum-kit";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The sub two octaves down rings 4 s to the slot's end at the default length.
  spec.tail_seconds = 16.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_keys();
  test_voices();
  test_controls();
  test_velocity();
  test_variation();
  test_width();
  test_retrigger();
  test_levels();
  test_rates();
  test_clicks_and_blocks();

  // The longest drum at the longest length ends, and the kit sleeps.
  plain(device);
  device.set_param(p::kLength, 4.0f);
  Stereo longest = hit(device, Cs, 0.7f, 9.0f);
  Stereo asleep = render(device, 0.5f, kRate);
  NOTE("tail: the sub at Length 4 rings %.2f s\n", ring_time(longest.left, kRate));
  EXPECT(peak(longest.left, at(3.0), at(3.5)) > 0.0 && peak(asleep.left) == 0.0 && peak(asleep.right) == 0.0,
         "the longest drum at the longest Length ends in exact silence");

  // Cost: a busy bar, looped for ten seconds.
  device.init(kRate);
  report_cost("drum-kit (a busy bar, looped)", 10.0f, kRate, [&] {
    for (int loop = 0; loop < 5; ++loop) busy_bar(device, 0.9f, nullptr);
  });

  return finish("drum-kit");
}
