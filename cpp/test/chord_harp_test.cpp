// Native harness for Chord Harp (cpp/devices/chord-harp). The conformance
// pass covers silence, determinism, a pile of notes and parameter abuse; the
// rest measures the instrument. Nobody listens to it here, so each trait is
// read from the audio: which strings a sweep plucks and when, the time
// between them against the Strum knob, the finger's unevenness, the plucked
// voice (tuning, attack, the 30 % pulse, the chime, the decay), the pad under
// it, where the strings sit between the speakers, and the absence of clicks.

#include "../devices/chord-harp/chord_harp.h"
#include "support/test_kit.h"

#include <complex>

using namespace testkit;
using livemix::ChordHarp;
namespace p = livemix::chord_harp;

static ChordHarp device;

static const float kRate = 48000.0f;

static const float kC2 = 65.406f, kC3 = 130.813f, kE3 = 164.814f, kF3 = 174.614f, kG3 = 195.998f;
static const float kA3 = 220.0f, kC4 = 261.626f, kE4 = 329.628f, kG4 = 391.995f;
static const float kC5 = 523.251f, kE5 = 659.255f, kG5 = 783.991f, kC6 = 1046.502f;

// Single plucks only: no sweep, no pad, every string in the centre.
static void plain(ChordHarp& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kStrum, 0.0f);
  d.set_param(p::kPad, 0.0f);
  d.set_param(p::kSpread, 0.0f);
}

// A sweep slow and short-lived enough to hear each pluck on its own: by the
// next one the last has fallen 45 dB.
static void slow(ChordHarp& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kStrum, 150.0f);
  d.set_param(p::kSustain, 0.2f);
  d.set_param(p::kPad, 0.0f);
  d.set_param(p::kSpread, 0.0f);
}

static std::vector<float> mono(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static Stereo minus(const Stereo& a, const Stereo& b) {
  Stereo out = a;
  for (size_t i = 0; i < out.size() && i < b.size(); ++i) {
    out.left[i] -= b.left[i];
    out.right[i] -= b.right[i];
  }
  return out;
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = a.size() == b.size() ? 0.0 : 1.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// Distance in cents from `hz` to the nearest octave of `reference`.
static double class_cents(double hz, double reference) {
  const double c = cents(hz, reference);
  return c - 1200.0 * std::round(c / 1200.0);
}

// Power spectrum (Hann) of n samples from `from`; n is a power of two.
static std::vector<double> power_spectrum(const std::vector<float>& x, size_t from, size_t n) {
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    a[i] = from + i < x.size() ? w * x[from + i] : 0.0;
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> step = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w = 1.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= step;
      }
    }
  }
  std::vector<double> power(n / 2);
  for (size_t i = 0; i < n / 2; ++i) power[i] = std::norm(a[i]);
  return power;
}

// Share of the energy that lies between the harmonics of `hz`: with a
// band-limited voice, what folded back from above Nyquist.
static double folded_share(const std::vector<float>& x, double hz, double rate, size_t from) {
  const size_t n = 16384;
  const std::vector<double> power = power_spectrum(x, from, n);
  const double bin = rate / static_cast<double>(n);
  double off = 0.0, total = 0.0;
  for (size_t i = 12; i < power.size(); ++i) {
    const double f = static_cast<double>(i) * bin;
    const double k = std::round(f / hz);
    total += power[i];
    if (k < 1.0 || std::fabs(f - k * hz) > 16.0 * bin) off += power[i];
  }
  return total > 0.0 ? off / total : 0.0;
}

// When plucks start, in seconds: where the power of the last `window` has
// risen by `rise_db` over the window before it. `apart` is the least time
// between two plucks, longer than a window.
static std::vector<double> onsets(const Stereo& s, double rate, double window, double rise_db,
                                  double apart) {
  const size_t n = s.size();
  std::vector<double> sum(n + 1, 0.0);
  for (size_t i = 0; i < n; ++i) {
    sum[i + 1] = sum[i] + static_cast<double>(s.left[i]) * s.left[i] +
                 static_cast<double>(s.right[i]) * s.right[i];
  }
  const size_t win = static_cast<size_t>(window * rate);
  const size_t hop = static_cast<size_t>(0.00025 * rate);
  const double ratio = std::pow(10.0, rise_db / 10.0);
  const double floor = 1.0e-10 * static_cast<double>(win);
  std::vector<double> times;
  for (size_t end = hop; end <= n; end += hop) {
    const size_t start = end > win ? end - win : 0;
    const double now = sum[end] - sum[start];
    const double before = sum[start] - sum[start > win ? start - win : 0];
    const double t = static_cast<double>(end) / rate;
    if (now > floor && now > before * ratio && (times.empty() || t - times.back() > apart)) {
      times.push_back(t);
    }
  }
  return times;
}

// The pitch of the pluck that starts at `at` seconds: the strongest partial
// of the next 60 ms, or the octave or twelfth under it if that is there too.
static double pluck_pitch(const std::vector<float>& x, double rate, double at, double lo = 55.0,
                          double hi = 5000.0) {
  const size_t from = static_cast<size_t>((at + 0.002) * rate);
  const size_t to = from + static_cast<size_t>(0.06 * rate);
  double hz = dominant_frequency(x, rate, lo, hi, from, to);
  const double level = tone_level(x, hz, rate, from, to);
  for (int divisor = 3; divisor >= 2; --divisor) {
    if (hz / divisor >= lo && tone_level(x, hz / divisor, rate, from, to) > 0.5 * level) {
      return dominant_frequency(x, rate, hz / divisor * 0.97, hz / divisor * 1.03, from, to);
    }
  }
  return hz;
}

struct Plucks {
  std::vector<double> times;
  std::vector<double> pitches;
  size_t count() const { return times.size(); }
};

// Every pluck of a slow sweep, with its pitch.
static Plucks read_plucks(const Stereo& s, double rate = kRate) {
  Plucks out;
  out.times = onsets(s, rate, 0.01, 10.0, 0.06);
  const std::vector<float> m = mono(s);
  for (double t : out.times) out.pitches.push_back(pluck_pitch(m, rate, t));
  return out;
}

static void print_pitches(const char* label, const Plucks& plucks) {
  std::printf("  %s:", label);
  for (double hz : plucks.pitches) std::printf(" %.1f", hz);
  std::printf(" Hz\n");
}

// How many of the plucks are within 35 cents of the pitches expected, in order.
static bool pitches_match(const Plucks& plucks, const std::vector<float>& expected) {
  if (plucks.count() != expected.size()) return false;
  for (size_t i = 0; i < expected.size(); ++i) {
    if (std::fabs(cents(plucks.pitches[i], expected[i])) > 35.0) return false;
  }
  return true;
}

// Whether every pluck is some octave of one of `chord`.
static bool all_in_chord(const Plucks& plucks, const std::vector<float>& chord, size_t from = 0) {
  for (size_t i = from; i < plucks.count(); ++i) {
    bool found = false;
    for (float hz : chord) found = found || std::fabs(class_cents(plucks.pitches[i], hz)) < 35.0;
    if (!found) return false;
  }
  return true;
}

static void chord(ChordHarp& d, const std::vector<float>& keys, float gain = 0.7f, int first_id = 1) {
  for (size_t i = 0; i < keys.size(); ++i) d.note_on(first_id + static_cast<int>(i), keys[i], gain);
}

int main() {
  char label[200];

  Conformance spec;
  spec.name = "chord-harp";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // A default sweep is over in half a second and its strings in six more.
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // --- the plucked voice -------------------------------------------------------------------

  // A single pluck is in tune from C2 to C6 at every sample rate, and a key
  // that is off the grid plays where it is.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double worst = 0.0;
    for (float hz : {kC2, kC3, kC4, kC5, kC6, 432.0f * 1.013f}) {
      plain(device, rate);
      device.set_param(p::kSustain, 8.0f);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 1.2f, rate);
      const double measured = dominant_frequency(out.left, rate, hz * 0.94, hz * 1.06,
                                                 static_cast<size_t>(0.1 * rate), out.size());
      worst = std::max(worst, std::fabs(cents(measured, hz)));
    }
    std::snprintf(label, sizeof label, "plucks are within 3 cents, C2 to C6, at %.0f Hz (worst %.2f)",
                  rate, worst);
    std::printf("  tuning at %.0f Hz: worst %.2f cents\n", rate, worst);
    EXPECT(worst < 3.0, label);
  }

  // The attack: from nothing, no step on the first sample, and there within
  // 5 ms.
  {
    plain(device);
    device.set_param(p::kVolume, 0.0f);
    device.note_on(1, kC5, 1.0f);
    Stereo out = render(device, 0.05f, kRate);
    const double top = peak(out.left);
    size_t arrived = 0;
    while (arrived < out.size() && std::fabs(out.left[arrived]) < 0.7 * top) ++arrived;
    const double ms = 1000.0 * static_cast<double>(arrived) / kRate;
    std::printf("  attack: 70 %% of the peak after %.2f ms, first sample %.5f of the peak\n", ms,
                std::fabs(out.left[0]) / top);
    EXPECT(ms > 0.5 && ms < 5.0, "a pluck reaches its level in a few milliseconds, not at once");
    EXPECT(std::fabs(out.left[0]) < 0.02 * top, "a pluck starts from nothing");
  }

  // The string is a 30 % pulse: its tenth harmonic is missing and its second
  // sits 4.6 dB under the first. On the attack the chime, an octave up, lifts
  // the second, and it is gone before the string is.
  {
    plain(device);
    device.set_param(p::kTone, 1.0f);
    device.set_param(p::kSustain, 1.0f);
    device.set_param(p::kVolume, 0.0f);
    device.note_on(1, kC3, 1.0f);
    Stereo out = render(device, 0.6f, kRate);
    const size_t from = static_cast<size_t>(0.3 * kRate), to = static_cast<size_t>(0.5 * kRate);
    const double h1 = tone_level(out.left, kC3, kRate, from, to);
    const double h2 = tone_level(out.left, kC3 * 2, kRate, from, to);
    const double h9 = tone_level(out.left, kC3 * 9, kRate, from, to);
    const double h10 = tone_level(out.left, kC3 * 10, kRate, from, to);
    const double h11 = tone_level(out.left, kC3 * 11, kRate, from, to);
    const double notch = db(h10 / (0.5 * (h9 + h11)));
    const double early_from = 0.004 * kRate, early_to = 0.064 * kRate;
    const double early = db(tone_level(out.left, kC3 * 2, kRate, static_cast<size_t>(early_from),
                                       static_cast<size_t>(early_to)) /
                            tone_level(out.left, kC3, kRate, static_cast<size_t>(early_from),
                                       static_cast<size_t>(early_to)));
    const double late = db(h2 / h1);
    std::printf("  pulse: 10th harmonic %.1f dB against the 9th and 11th; 2nd against 1st %.1f dB on the "
                "attack, %.1f dB in the tail\n",
                notch, early, late);
    EXPECT(notch < -20.0, "the tenth harmonic of a 30 % pulse is missing");
    EXPECT_NEAR(late, -4.6, 1.0, "the second harmonic of a 30 % pulse sits 4.6 dB under the first");
    EXPECT(early > late + 1.5, "the chime lifts the octave on the attack and dies before the string");
  }

  // Sustain is the time a string takes to fall 60 dB, and letting the key go
  // changes nothing: the string rings on.
  for (float seconds : {0.5f, 3.0f, 8.0f}) {
    plain(device);
    device.set_param(p::kSustain, seconds);
    device.set_param(p::kVolume, 0.0f);
    device.note_on(1, kC4, 0.8f);
    Stereo held = render(device, seconds * 0.9f, kRate);
    const double measured = rt60(held.left, kRate, seconds * 0.3, seconds * 0.05);
    std::printf("  Sustain %.1f s: 60 dB in %.2f s\n", seconds, measured);
    std::snprintf(label, sizeof label, "a string falls 60 dB in the Sustain time (%.1f s)", seconds);
    EXPECT_NEAR(measured, seconds, 0.2 * seconds, label);

    plain(device);
    device.set_param(p::kSustain, seconds);
    device.set_param(p::kVolume, 0.0f);
    device.note_on(1, kC4, 0.8f);
    Stereo released = render(device, 0.1f, kRate);
    device.note_off(1);
    released = concat(released, render(device, seconds * 0.9f - 0.1f, kRate));
    EXPECT(worst_difference(held, released) == 0.0, "a plucked string rings on after its key is let go");
  }

  // Tone: darker to brighter, a two-pole slope above the corner, and soft and
  // round at the bottom: a middle string keeps little more than its
  // fundamental.
  {
    auto pluck = [&](float tone, float hz) {
      plain(device);
      device.set_param(p::kTone, tone);
      device.note_on(1, hz, 0.8f);
      return render(device, 0.5f, kRate);
    };
    Stereo dark = pluck(0.0f, kC3), mid = pluck(0.5f, kC3), bright = pluck(1.0f, kC3);
    Stereo round = pluck(0.0f, kC4);
    const size_t from = static_cast<size_t>(0.2 * kRate), to = static_cast<size_t>(0.4 * kRate);
    const double e0 = energy_above(dark.left, 1500.0, kRate, from, to);
    const double e1 = energy_above(mid.left, 1500.0, kRate, from, to);
    const double e2 = energy_above(bright.left, 1500.0, kRate, from, to);
    // At Tone 0.5 the corner for C3 is near 2 kHz: harmonics one and two
    // octaves above it, against the same harmonics with the filter open.
    const double octave1 = db(tone_level(mid.left, kC3 * 31, kRate, from, to) /
                              tone_level(bright.left, kC3 * 31, kRate, from, to));
    const double octave2 = db(tone_level(mid.left, kC3 * 61, kRate, from, to) /
                              tone_level(bright.left, kC3 * 61, kRate, from, to));
    double overtones = 0.0;
    for (int k = 2; k <= 12; ++k) {
      const double level = tone_level(round.left, kC4 * k, kRate, from, to);
      overtones += level * level;
    }
    const double purity = db(std::sqrt(overtones) / tone_level(round.left, kC4, kRate, from, to));
    std::printf("  Tone: energy above 1.5 kHz %.4f / %.4f / %.4f; at Tone 0.5 %.1f dB one octave above "
                "the corner, %.1f dB two; overtones of middle C at Tone 0 %.1f dB\n",
                e0, e1, e2, octave1, octave2, purity);
    EXPECT(e0 < 0.6 * e1 && e1 < 0.8 * e2, "Tone goes from dark to bright");
    EXPECT(octave1 < -8.0 && octave2 < -20.0 && octave2 < octave1 - 9.0,
           "the low-pass falls about 12 dB per octave above its corner");
    EXPECT(purity < -10.0, "at the bottom of Tone a middle string is soft: overtones 10 dB under");
    EXPECT(tone_level(dark.left, kC3, kRate, from, to) > 0.5 * tone_level(bright.left, kC3, kRate, from, to),
           "the darkest Tone keeps the fundamental");
  }

  // The top of the plate: nothing folds back from above Nyquist, with the
  // filter open and the pad under it, where the strings are highest. (Under
  // the soft clip's knee, which makes harmonics of its own above it.)
  for (float rate : {44100.0f, 48000.0f}) {
    double worst = 0.0;
    for (float hz : {1975.5f, 2637.0f, 3136.0f, 3729.3f, 4186.0f, 4290.0f}) {
      device.init(rate);
      device.set_param(p::kStrum, 0.0f);
      device.set_param(p::kTone, 1.0f);
      device.set_param(p::kSustain, 8.0f);
      device.note_on(1, hz, 1.0f);
      Stereo out = render(device, 0.5f, rate);
      worst = std::max(worst, folded_share(mono(out), hz, rate, static_cast<size_t>(0.05 * rate)));
    }
    std::printf("  folded energy, 2 kHz to the top string, at %.0f Hz: %.1f dB\n", rate,
                10.0 * std::log10(worst));
    std::snprintf(label, sizeof label, "aliasing is 50 dB down at the top of the plate at %.0f Hz", rate);
    EXPECT(worst < 1.0e-5, label);
  }

  // A key above the plate plays its pitch class lower down.
  {
    plain(device);
    device.note_on(1, 6000.0f, 0.8f);
    Stereo out = render(device, 0.5f, kRate);
    const double hz = dominant_frequency(out.left, kRate, 500.0, 12000.0, 2400, out.size());
    EXPECT(std::fabs(cents(hz, 3000.0)) < 3.0, "a key above the top of the plate plays an octave down");
  }

  // At a low sample rate the plate's top edge comes down with it: at 8 kHz
  // the highest C is played an octave lower, under Nyquist.
  {
    plain(device, 8000.0f);
    device.note_on(1, 4186.0f, 0.8f);
    Stereo out = render(device, 0.5f, 8000.0f);
    const double hz = dominant_frequency(out.left, 8000.0, 300.0, 3900.0, 400, out.size());
    EXPECT(std::fabs(cents(hz, 2093.0)) < 3.0, "at 8 kHz the top of the plate stays under Nyquist");
  }

  // --- the pad ------------------------------------------------------------------------------

  // The pad is what Pad adds: the same keys with it and without differ by a
  // soft held note at the key's pitch, the same in both channels, in
  // proportion to the knob, there while the key is down and gone after.
  {
    auto take = [&](float pad) {
      device.init(kRate);
      device.set_param(p::kPad, pad);
      device.note_on(1, kA3, 0.7f);
      Stereo out = render(device, 1.0f, kRate);
      device.note_off(1);
      return concat(out, render(device, 1.5f, kRate));
    };
    Stereo without = take(0.0f);
    Stereo half = minus(take(0.5f), without);
    Stereo full = minus(take(1.0f), without);
    const size_t held_from = static_cast<size_t>(0.5 * kRate), held_to = static_cast<size_t>(1.0 * kRate);
    const double level = rms(full.left, held_from, held_to);
    const double ratio = level / rms(half.left, held_from, held_to);
    const double hz = dominant_frequency(full.left, kRate, 100.0, 1000.0, held_from, held_to);
    const double third = db(tone_level(full.left, kA3 * 3, kRate, held_from, held_to) /
                            tone_level(full.left, kA3, kRate, held_from, held_to));
    const double rise = rms(full.left, static_cast<size_t>(0.1 * kRate), static_cast<size_t>(0.15 * kRate));
    const double start = rms(full.left, 0, static_cast<size_t>(0.005 * kRate));
    const double after = peak(full.left, static_cast<size_t>(1.5 * kRate), full.size());
    const double pluck = peak(without.left);
    std::printf("  pad at 1: %.1f dB rms under a pluck peaking at %.1f dBFS; third harmonic %.1f dB; "
                "%.1f dB 5 ms in\n",
                db(level), db(pluck), third, db(start / level));
    EXPECT(level > 3.0e-4, "the pad sounds while a key is held");
    EXPECT_NEAR(ratio, 2.0, 0.1, "the pad's level follows the Pad knob");
    EXPECT(std::fabs(cents(hz, kA3)) < 5.0, "the pad plays the held key");
    EXPECT(worst_difference(full, Stereo{full.right, full.left}) < 1.0e-6, "the pad is in the centre");
    EXPECT(third < -12.0 && third > -30.0, "the pad is a softened square: odd harmonics, rolled off");
    EXPECT(start < 0.2 * level && rise > 0.8 * level, "the pad swells in, in about a tenth of a second");
    EXPECT(after < 1.0e-3 * level, "the pad stops when the key is let go");
    EXPECT(db(level / pluck) < 3.0 && db(level / pluck) > -12.0,
           "the pad at full is about as loud as a pluck, so at its default it sits well under");
  }

  // With Pad at zero a held key keeps nothing running: exact silence once the
  // strings have rung out.
  {
    device.init(kRate);
    device.set_param(p::kPad, 0.0f);
    device.set_param(p::kSustain, 0.2f);
    chord(device, {kC3, kE3, kG3});
    render(device, 2.0f, kRate);
    Stereo after = render(device, 0.5f, kRate);
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0,
           "with Pad at zero a held chord is exact silence once its strings have rung out");
    // And a key let go in that silence leaves nothing behind for the pad.
    device.note_off(1);
    device.note_off(2);
    device.note_off(3);
    device.set_param(p::kPad, 1.0f);
    Stereo later = render(device, 0.5f, kRate);
    EXPECT(peak(later.left) == 0.0, "a key let go in silence leaves no pad behind");
  }

  // --- single plucks ------------------------------------------------------------------------

  // With Strum at zero three keys are three plucks and nothing else: the
  // chord is the sum of its keys played one at a time.
  {
    const std::vector<float> keys = {kC4, kE4, kG4};
    plain(device);
    chord(device, keys);
    Stereo together = render(device, 0.5f, kRate);
    Stereo sum;
    for (float hz : keys) {
      plain(device);
      device.note_on(1, hz, 0.7f);
      Stereo one = render(device, 0.5f, kRate);
      if (sum.size() == 0) {
        sum = one;
      } else {
        for (size_t i = 0; i < sum.size(); ++i) {
          sum.left[i] += one.left[i];
          sum.right[i] += one.right[i];
        }
      }
    }
    const double worst = worst_difference(together, sum);
    std::printf("  Strum 0, three keys against the sum of three plucks: %.2g apart\n", worst);
    EXPECT(worst < 1.0e-6, "with Strum at zero three keys are exactly three plucks");
  }

  // --- the strum ----------------------------------------------------------------------------

  const std::vector<float> triad = {kC3, kE3, kG3};
  const std::vector<float> up = {kC3, kE3, kG3, kC4, kE4, kG4, kC5, kE5, kG5, kC6};

  // Three keys, three octaves, up: ten strings, the chord's notes and no
  // others, lowest first, the first as the keys go down.
  {
    slow(device);
    chord(device, triad);
    Plucks plucks = read_plucks(render(device, 2.0f, kRate));
    print_pitches("C E G, three octaves, up", plucks);
    EXPECT(pitches_match(plucks, up), "a press sweeps the held chord up over three octaves: ten strings");
    EXPECT(all_in_chord(plucks, triad), "every plucked string is a note of the held chord");
    EXPECT(plucks.count() > 0 && plucks.times[0] < 0.003, "the first string sounds as the keys go down");
  }

  // Direction: down from the top, there and back with the top plucked once,
  // or in no order (never the same string twice running).
  {
    std::vector<float> down(up.rbegin(), up.rend());
    slow(device);
    device.set_param(p::kDirection, ChordHarp::kDown);
    chord(device, triad);
    Plucks plucks = read_plucks(render(device, 2.0f, kRate));
    EXPECT(pitches_match(plucks, down), "Down sweeps from the top string to the bottom");

    std::vector<float> both = up;
    both.insert(both.end(), down.begin() + 1, down.end());
    slow(device);
    device.set_param(p::kDirection, ChordHarp::kUpDown);
    chord(device, triad);
    plucks = read_plucks(render(device, 3.4f, kRate));
    EXPECT(pitches_match(plucks, both), "Up Down goes up and comes back, the top string once: 19 plucks");

    slow(device);
    device.set_param(p::kDirection, ChordHarp::kRandom);
    chord(device, triad);
    plucks = read_plucks(render(device, 2.0f, kRate));
    print_pitches("random", plucks);
    int rises = 0, falls = 0, repeats = 0;
    for (size_t i = 1; i < plucks.count(); ++i) {
      const double step = cents(plucks.pitches[i], plucks.pitches[i - 1]);
      rises += step > 35.0 ? 1 : 0;
      falls += step < -35.0 ? 1 : 0;
      repeats += std::fabs(step) <= 35.0 ? 1 : 0;
    }
    EXPECT(plucks.count() == 10 && all_in_chord(plucks, triad),
           "Random plucks as many strings as the plate has, all of them notes of the chord");
    EXPECT(rises >= 2 && falls >= 2 && repeats == 0,
           "Random goes up and down the plate and never plucks a string twice running");
  }

  // Span: the plate reaches that many octaves above the lowest key, and stops
  // at its top edge whatever the knob says.
  for (int octaves = 1; octaves <= 4; ++octaves) {
    slow(device);
    device.set_param(p::kSpan, static_cast<float>(octaves - 1));
    chord(device, triad);
    Plucks plucks = read_plucks(render(device, 2.3f, kRate));
    const double top = plucks.count() ? plucks.pitches.back() : 0.0;
    std::printf("  Span %d: %zu strings, the top one %.1f Hz\n", octaves, plucks.count(), top);
    std::snprintf(label, sizeof label, "Span %d: the sweep covers %d octaves above the lowest key", octaves,
                  octaves);
    EXPECT(plucks.count() == static_cast<size_t>(3 * octaves + 1) &&
               std::fabs(cents(top, kC3 * std::pow(2.0, octaves))) < 35.0 && all_in_chord(plucks, triad),
           label);
  }
  {
    slow(device);
    device.set_param(p::kSpan, 3.0f);
    device.note_on(1, kC6, 0.7f);
    Plucks plucks = read_plucks(render(device, 1.2f, kRate));
    EXPECT(plucks.count() == 3 && plucks.pitches.back() < 4300.0 &&
               std::fabs(cents(plucks.pitches.back(), kC6 * 4.0)) < 35.0,
           "no string above the top edge of the plate: C6 over four octaves is C6, C7, C8");
  }

  // Strum is the time from one string to the next, and a finger's time: the
  // gaps average the knob and each strays from it, by no more than 15 %. One
  // key over four octaves (strings an octave apart do not beat, so each pluck
  // shows as a step in the power), pressed three times.
  for (float strum : {25.0f, 40.0f, 80.0f, 150.0f}) {
    device.init(kRate);
    device.set_param(p::kStrum, strum);
    device.set_param(p::kSpan, 3.0f);
    device.set_param(p::kSustain, 0.2f);
    device.set_param(p::kPad, 0.0f);
    std::vector<double> gaps;
    for (int press = 0; press < 3; ++press) {
      device.note_on(1, kC4, 0.7f);
      Stereo out = render(device, 1.2f, kRate);
      device.note_off(1);
      // A window of one cycle of the lowest string.
      const std::vector<double> times = onsets(out, kRate, 1.0 / kC4, 3.0, 0.0005 * strum);
      EXPECT(times.size() == 5, "one key over four octaves is five strings");
      for (size_t i = 1; i < times.size(); ++i) gaps.push_back(1000.0 * (times[i] - times[i - 1]));
    }
    double sum = 0.0, low = 1.0e9, high = 0.0;
    for (double gap : gaps) {
      sum += gap;
      low = std::min(low, gap);
      high = std::max(high, gap);
    }
    const double average = gaps.empty() ? 0.0 : sum / static_cast<double>(gaps.size());
    std::printf("  Strum %.0f ms: gaps average %.1f ms, from %.1f to %.1f\n", strum, average, low, high);
    std::snprintf(label, sizeof label, "the time between strings is the Strum time (%.0f ms)", strum);
    EXPECT_NEAR(average, strum, 0.1 * strum, label);
    std::snprintf(label, sizeof label, "at Strum %.0f ms no gap strays more than 15 %% (and a detection "
                                       "margin of 2.5 ms)", strum);
    EXPECT(low > 0.85 * strum - 2.5 && high < 1.15 * strum + 2.5, label);
    std::snprintf(label, sizeof label, "at Strum %.0f ms the gaps are uneven, like a finger's", strum);
    EXPECT(high - low > 0.05 * strum, label);
  }

  // The strum is counted in samples of whatever rate the host runs at: the
  // same press plucks at the same times at 44.1, 48 and 96 kHz.
  {
    auto press = [&](float rate) {
      device.init(rate);
      device.set_param(p::kSpan, 3.0f);
      device.set_param(p::kSustain, 0.2f);
      device.set_param(p::kPad, 0.0f);
      device.note_on(1, kC4, 0.7f);
      return onsets(render(device, 0.5f, rate), rate, 1.0 / kC4, 3.0, 0.02);
    };
    const std::vector<double> reference = press(kRate);
    for (float rate : {44100.0f, 96000.0f}) {
      const std::vector<double> times = press(rate);
      double worst = times.size() == reference.size() ? 0.0 : 1.0;
      for (size_t i = 0; i < times.size() && i < reference.size(); ++i) {
        worst = std::max(worst, std::fabs(times[i] - reference[i]));
      }
      std::snprintf(label, sizeof label, "the same press plucks at the same times at %.0f Hz (%.2f ms off)",
                    rate, 1000.0 * worst);
      EXPECT(reference.size() == 5 && worst < 0.001, label);
    }
  }

  // The finger's touch: the same string plucked by twelve presses comes out
  // at twelve levels within 3 dB of each other. With Strum at zero there is
  // no finger and every pluck is the same.
  {
    slow(device);
    device.set_param(p::kSpan, 0.0f);
    double quietest = 1.0e9, loudest = 0.0;
    for (int press = 0; press < 12; ++press) {
      device.note_on(1, kC4, 0.7f);
      Stereo out = render(device, 0.7f, kRate);
      device.note_off(1);
      const double level = peak(out.left, 0, static_cast<size_t>(0.05 * kRate));
      quietest = std::min(quietest, level);
      loudest = std::max(loudest, level);
    }
    const double range = db(loudest / quietest);
    std::printf("  the same string over twelve presses: levels %.2f dB apart\n", range);
    EXPECT(range > 0.5 && range < 3.1, "plucks differ in level like a finger's, within 3 dB");

    plain(device);
    device.set_param(p::kSustain, 0.2f);
    device.note_on(1, kC4, 0.7f);
    Stereo first = render(device, 0.7f, kRate);
    device.note_off(1);
    device.note_on(1, kC4, 0.7f);
    Stereo second = render(device, 0.7f, kRate);
    EXPECT(worst_difference(first, second) == 0.0, "with Strum at zero every pluck of a key is the same");
  }

  // Letting the keys go a tenth of a second into a slow sweep: the sweep
  // finishes (the plate was set when the keys went down), the pad goes.
  {
    auto take = [&](float pad) {
      slow(device);
      device.set_param(p::kPad, pad);
      chord(device, triad);
      Stereo out = render(device, 0.1f, kRate);
      for (int id = 1; id <= 3; ++id) device.note_off(id);
      return concat(out, render(device, 2.0f, kRate));
    };
    Stereo strings = take(0.0f);
    Stereo pad = minus(take(1.0f), strings);
    Plucks plucks = read_plucks(strings);
    EXPECT(pitches_match(plucks, up), "a sweep finishes after its keys are let go");
    const double while_held = rms(pad.left, static_cast<size_t>(0.05 * kRate), static_cast<size_t>(0.1 * kRate));
    const double later = peak(pad.left, static_cast<size_t>(0.7 * kRate), pad.size());
    EXPECT(while_held > 1.0e-3 && later < 1.0e-3 * while_held, "the pad goes when the keys are let go");
  }

  // A new chord in the middle of a sweep: the sweep starts again on the new
  // chord at once, from its lowest key, and plucks nothing of the old one.
  {
    const std::vector<float> second = {kF3, kA3, kC4};
    slow(device);
    chord(device, triad);
    Stereo out = render(device, 0.375f, kRate);
    for (int id = 1; id <= 3; ++id) device.note_off(id);
    chord(device, second, 0.7f, 11);
    out = concat(out, render(device, 2.0f, kRate));
    Plucks plucks = read_plucks(out);
    print_pitches("C E G, then F A C at 375 ms", plucks);
    EXPECT(plucks.count() == 13, "three strings of the first chord, then ten of the second");
    EXPECT(plucks.count() > 3 && std::fabs(cents(plucks.pitches[3], kF3)) < 35.0 &&
               std::fabs(plucks.times[3] - 0.375) < 0.003,
           "the new chord's lowest string is plucked as its keys go down");
    EXPECT(all_in_chord(plucks, second, 3), "after the change every string is a note of the new chord");
  }

  // ... and the strings of the old chord ring on under it, and nothing clicks.
  {
    auto take = [&](bool change, float pad) {
      device.init(kRate);
      device.set_param(p::kPad, pad);
      device.set_param(p::kSpread, 0.0f);
      chord(device, triad);
      Stereo out = render(device, 0.1f, kRate);
      if (change) {
        for (int id = 1; id <= 3; ++id) device.note_off(id);
        chord(device, {kF3, kA3, kC4}, 0.7f, 11);
      }
      return concat(out, render(device, 0.6f, kRate));
    };
    Stereo steady = take(false, 0.5f), changed = take(true, 0.5f);
    Stereo strings = take(false, 0.0f), strings_changed = take(true, 0.0f);
    const size_t from = static_cast<size_t>(0.3 * kRate), to = static_cast<size_t>(0.6 * kRate);
    const double kept = db(tone_level(strings_changed.left, kG3, kRate, from, to) /
                           tone_level(strings.left, kG3, kRate, from, to));
    const double step =
        max_step(changed.left, static_cast<size_t>(0.099 * kRate), static_cast<size_t>(0.13 * kRate));
    const double usual = max_step(steady.left);
    std::printf("  chord change mid-sweep: the old G3 string at %.2f dB of where it would be; largest step "
                "%.4f against %.4f in an undisturbed sweep\n",
                kept, step, usual);
    EXPECT(std::fabs(kept) < 1.5, "strings of the old chord ring on under the new one");
    EXPECT(step < 1.5 * usual, "a new chord in the middle of a sweep does not click");
  }

  // A chord played by hand is one sweep: keys 10 ms apart join the sweep the
  // first one started. A key 100 ms later starts the sweep again.
  {
    slow(device);
    device.note_on(1, kC3, 0.7f);
    Stereo out = render(device, 0.01f, kRate);
    device.note_on(2, kE3, 0.7f);
    out = concat(out, render(device, 0.01f, kRate));
    device.note_on(3, kG3, 0.7f);
    out = concat(out, render(device, 2.0f, kRate));
    Plucks plucks = read_plucks(out);
    EXPECT(pitches_match(plucks, up), "keys pressed 10 ms apart are one sweep: the lowest string once");

    slow(device);
    device.note_on(1, kC3, 0.7f);
    out = render(device, 0.1f, kRate);
    device.note_on(2, kE3, 0.7f);
    out = concat(out, render(device, 1.5f, kRate));
    plucks = read_plucks(out);
    print_pitches("C, then E 100 ms later", plucks);
    EXPECT(pitches_match(plucks, {kC3, kC3, kE3, kC4, kE4, kC5, kE5, kC6}) && plucks.count() > 1 &&
               std::fabs(plucks.times[1] - 0.1) < 0.003,
           "a key pressed 100 ms later starts the sweep again on the chord then held");
  }

  // --- between the speakers -----------------------------------------------------------------

  // Spread lays the plate out from left to right; at zero every string is in
  // the centre; and the two channels never work against each other.
  {
    slow(device);
    device.set_param(p::kSpread, 1.0f);
    chord(device, triad);
    Stereo out = render(device, 2.0f, kRate);
    const std::vector<double> times = onsets(out, kRate, 0.01, 10.0, 0.06);
    std::vector<double> balance;
    for (double t : times) {
      const size_t from = static_cast<size_t>((t + 0.005) * kRate), to = from + static_cast<size_t>(0.05 * kRate);
      balance.push_back(db(rms(out.right, from, to) / rms(out.left, from, to)));
    }
    bool rising = balance.size() == 10;
    for (size_t i = 1; i < balance.size(); ++i) rising = rising && balance[i] > balance[i - 1] + 0.5;
    if (!balance.empty()) {
      std::printf("  Spread 1: right against left from %.1f dB (lowest string) to %.1f dB (highest)\n",
                  balance.front(), balance.back());
    }
    EXPECT(rising && balance.front() < -15.0 && balance.back() > 15.0,
           "Spread puts the low strings left and the high strings right, string by string");

    device.init(kRate);
    device.set_param(p::kSpread, 1.0f);
    chord(device, triad, 0.8f);
    Stereo wide = render(device, 2.0f, kRate);
    std::vector<float> side(wide.size());
    for (size_t i = 0; i < side.size(); ++i) side[i] = 0.5f * (wide.left[i] - wide.right[i]);
    const double mid_level = rms(mono(wide)), side_level = rms(side);
    const double both = std::sqrt(0.5 * (rms(wide.left) * rms(wide.left) + rms(wide.right) * rms(wide.right)));
    std::printf("  Spread 1, default sweep: side %.1f dB under mid, channel correlation %.2f, mono sum "
                "%.1f dB against the channels\n",
                db(mid_level / side_level), correlation(wide.left, wide.right), db(mid_level / both));
    EXPECT(mid_level > side_level && correlation(wide.left, wide.right) > 0.0 && mid_level > 0.7 * both,
           "at full Spread the sound still folds to mono without loss");

    device.init(kRate);
    device.set_param(p::kSpread, 0.0f);
    chord(device, triad, 0.8f);
    Stereo narrow = render(device, 1.0f, kRate);
    EXPECT(worst_difference(narrow, Stereo{narrow.right, narrow.left}) == 0.0,
           "with Spread at zero both channels are the same");

    // Single plucks sit by pitch about middle C.
    auto balance_of = [&](float hz) {
      device.init(kRate);
      device.set_param(p::kStrum, 0.0f);
      device.set_param(p::kPad, 0.0f);
      device.set_param(p::kSpread, 1.0f);
      device.note_on(1, hz, 0.7f);
      Stereo one = render(device, 0.2f, kRate);
      return db(rms(one.right) / rms(one.left));
    };
    const double low = balance_of(kC2), centre = balance_of(kC4), high = balance_of(kC6);
    EXPECT(low < -6.0 && std::fabs(centre) < 0.1 && high > 6.0,
           "single plucks sit left to right by pitch, middle C in the centre");
  }

  // --- levels -------------------------------------------------------------------------------

  // At the default settings: one key, a chord, and the most a player's hands
  // can hold, all under the soft clip's knee.
  {
    auto loudest = [&](const std::vector<float>& keys, float gain, float seconds) {
      device.init(kRate);
      chord(device, keys, gain);
      Stereo out = render(device, seconds, kRate);
      return std::max(peak(out.left), peak(out.right));
    };
    const double one = loudest({kA3}, 0.7f, 2.0f);
    const double one_firm = loudest({kA3}, 0.8f, 2.0f);
    const double three = loudest({kC4, kE4, kG4}, 0.8f, 2.0f);
    std::vector<float> ten;
    for (int n = 0; n < 10; ++n) ten.push_back(kC3 * std::pow(2.0f, static_cast<float>(n) / 12.0f));
    const double many = loudest(ten, 0.7f, 3.0f);
    const double sixteen = loudest({kC3, kE3, kG3, 246.942f, 293.665f}, 1.0f, 3.0f);
    plain(device);
    device.set_param(p::kSpread, p::kParamDefault[p::kSpread]);
    device.note_on(1, kA3, 0.7f);
    Stereo single = render(device, 1.0f, kRate);
    const double pluck = std::max(peak(single.left), peak(single.right));
    std::printf("  levels at the default volume: one key %.1f dBFS (%.1f at gain 0.8), a triad %.1f, ten "
                "keys %.1f, sixteen strings at full gain %.1f; a single pluck %.1f\n",
                db(one), db(one_firm), db(three), db(many), db(sixteen), db(pluck));
    EXPECT(db(one) > -24.0 && db(one) < -10.0, "one key at gain 0.7 peaks between -24 and -10 dBFS");
    EXPECT(db(one_firm) > -22.0 && db(one_firm) < -16.0, "one key at gain 0.8 peaks between -22 and -16 dBFS");
    EXPECT(db(pluck) > -24.0 && db(pluck) < -10.0, "a single pluck at gain 0.7 peaks between -24 and -10 dBFS");
    EXPECT(many < 0.5, "ten held keys stay under the soft clip's knee");
    EXPECT(sixteen < 0.5, "a sixteen-string sweep at full gain stays under the soft clip's knee");

    // Touch: a harder key is a louder sweep.
    const double soft = loudest({kA3}, 0.2f, 1.0f), hard = loudest({kA3}, 1.0f, 1.0f);
    EXPECT(db(hard / soft) > 5.0 && db(hard / soft) < 12.0, "a harder key is a louder pluck");
  }

  // --- no clicks ----------------------------------------------------------------------------

  // Plucking a string that still rings: it takes the new level over the
  // attack, with no step larger than the string makes anyway.
  {
    plain(device);
    device.set_param(p::kSustain, 3.0f);
    device.note_on(1, kC4, 0.8f);
    Stereo out = render(device, 0.3f, kRate);
    device.note_on(1, kC4, 0.8f);
    out = concat(out, render(device, 0.1f, kRate));
    const double usual = max_step(out.left, static_cast<size_t>(0.003 * kRate), static_cast<size_t>(0.05 * kRate));
    const double again = max_step(out.left, static_cast<size_t>(0.299 * kRate), static_cast<size_t>(0.35 * kRate));
    std::printf("  re-plucking a ringing string: largest step %.4f against %.4f\n", again, usual);
    EXPECT(again < 1.1 * usual, "plucking a string that still rings does not click");
  }

  // More strings than voices: the quietest is faded out for the new one. The
  // darkest Tone makes each string close to a sine, so a cut would show.
  {
    auto pile = [&](int first, int last) {
      plain(device);
      device.set_param(p::kTone, 0.0f);
      device.set_param(p::kSustain, 8.0f);
      Stereo out;
      for (int n = 0; n < 40; ++n) {
        const float hz = 110.0f * std::pow(2.0f, static_cast<float>(n) / 20.0f);
        if (n >= first && n < last) device.note_on(1 + n, hz, 0.7f);
        out = concat(out, render(device, 0.01f, kRate));
      }
      return concat(out, render(device, 0.3f, kRate));
    };
    // Forty strings, the thirty lowest of them, and the thirty highest.
    Stereo over = pile(0, 40), within = pile(0, 30), upper = pile(10, 40);
    const size_t from = static_cast<size_t>(0.45 * kRate), to = over.size();
    const double first_string = tone_level(over.left, 110.0, kRate, from, to) /
                                tone_level(within.left, 110.0, kRate, from, to);
    const double step = max_step(over.left), usual = max_step(upper.left);
    std::printf("  40 strings on 32 voices: the first string is at %.1f dB of its level, largest step "
                "%.4f against %.4f with 30 strings and no voice taken\n",
                db(first_string), step, usual);
    EXPECT(first_string < 0.1, "with every voice ringing a new string takes the quietest one");
    EXPECT(step < 1.25 * usual, "a taken voice fades out: no click");
  }

  // Letting a key go with the pad up, turning the volume down, and sweeping
  // Tone under ringing strings.
  {
    device.init(kRate);
    device.set_param(p::kPad, 1.0f);
    device.set_param(p::kSustain, 0.5f);
    device.note_on(1, kA3, 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    device.note_off(1);
    out = concat(out, render(device, 0.2f, kRate));
    const double before = max_step(out.left, static_cast<size_t>(1.9 * kRate), static_cast<size_t>(2.0 * kRate));
    const double release = max_step(out.left, static_cast<size_t>(2.0 * kRate) - 2, out.size());
    EXPECT(before > 0.0 && release < 1.1 * before, "letting a key go does not click the pad");

    device.init(kRate);
    chord(device, triad, 0.8f);
    out = render(device, 0.5f, kRate);
    device.set_param(p::kVolume, -48.0f);
    out = concat(out, render(device, 0.1f, kRate));
    const double loud = max_step(out.left, static_cast<size_t>(0.4 * kRate), static_cast<size_t>(0.5 * kRate));
    const double turned = max_step(out.left, static_cast<size_t>(0.5 * kRate) - 2, out.size());
    EXPECT(turned < 1.1 * loud, "Volume glides");

    // 0: Tone left open. 1: thrown end to end. 2: closed once.
    auto ring = [&](int what) {
      plain(device);
      device.set_param(p::kSustain, 8.0f);
      device.set_param(p::kTone, 1.0f);
      chord(device, triad, 0.8f);
      Stereo take = render(device, 0.2f, kRate);
      for (int n = 0; n < 100; ++n) {
        if (what == 1) device.set_param(p::kTone, n % 2 ? 1.0f : 0.0f);
        if (what == 2) device.set_param(p::kTone, 0.0f);
        take = concat(take, render(device, 0.005f, kRate));
      }
      return take;
    };
    Stereo still = ring(0), moved = ring(1), closed = ring(2);
    const size_t from = static_cast<size_t>(0.2 * kRate);
    std::printf("  Tone thrown end to end every 5 ms: largest step %.4f against %.4f with it still and open\n",
                max_step(moved.left, from), max_step(still.left, from));
    EXPECT(max_step(moved.left, from) < 1.5 * max_step(still.left, from), "Tone moves without clicks");
    const size_t late = static_cast<size_t>(0.5 * kRate);
    EXPECT(energy_above(closed.left, 1500.0, kRate, late) < 0.3 * energy_above(still.left, 1500.0, kRate, late),
           "Tone reaches strings that already ring");
  }

  // --- time is counted in samples -----------------------------------------------------------

  // The same playing comes out the same whatever the host's block size, and
  // the same again after init().
  {
    auto scene = [&](int block) {
      device.init(kRate);
      device.set_param(p::kDirection, ChordHarp::kUpDown);
      device.set_param(p::kPad, 0.5f);
      chord(device, triad, 0.8f);
      Stereo out = render(device, 0.31f, kRate, block);
      device.set_param(p::kTone, 0.9f);
      device.set_param(p::kStrum, 17.0f);
      out = concat(out, render(device, 0.2f, kRate, block));
      for (int id = 1; id <= 3; ++id) device.note_off(id);
      chord(device, {kF3, kA3, kC4, kE4}, 0.9f, 11);
      out = concat(out, render(device, 0.013f, kRate, block));
      device.note_on(20, kC5, 0.5f);
      out = concat(out, render(device, 0.4f, kRate, block));
      device.set_param(p::kStrum, 0.0f);
      device.note_on(21, kG5, 1.0f);
      device.set_param(p::kVolume, -14.0f);
      out = concat(out, render(device, 0.25f, kRate, block));
      for (int id = 11; id <= 21; ++id) device.note_off(id);
      return concat(out, render(device, 1.0f, kRate, block));
    };
    Stereo usual = scene(128), single = scene(1), large = scene(2048), again = scene(128);
    const double worst = std::max(worst_difference(usual, single), worst_difference(usual, large));
    std::printf("  blocks of 1, 128 and 2048 frames: %.2g apart\n", worst);
    EXPECT(worst < 1.0e-6, "the strum does not depend on the host's block size");
    EXPECT(worst_difference(usual, again) == 0.0, "init() puts the finger back where it started");

    // A Tone change and a key that arrive together just after the last string
    // has died, while the instrument is still awake: the glide starts with
    // the key, not on a count left over from the silence.
    auto after_silence = [&](int block) {
      plain(device);
      device.set_param(p::kSustain, 0.2f);
      device.note_on(1, kC4, 0.7f);
      Stereo out = render(device, 0.31f, kRate, block);
      device.set_param(p::kTone, 1.0f);
      device.note_on(2, kE4, 0.7f);
      return concat(out, render(device, 0.2f, kRate, block));
    };
    usual = after_silence(128);
    const double silent = peak(usual.left, static_cast<size_t>(0.3 * kRate), static_cast<size_t>(0.31 * kRate));
    const double apart =
        std::max(worst_difference(usual, after_silence(1)), worst_difference(usual, after_silence(2048)));
    std::printf("  a key and a Tone change just after silence, blocks of 1, 128 and 2048: %.2g apart\n", apart);
    EXPECT(silent == 0.0 && apart < 1.0e-6, "a glide that starts just after silence does not depend on block size");
  }

  // Six keys strummed over four octaves once a second, in random order.
  report_cost("chord-harp, six keys over four octaves", 10.0f, kRate, [&] {
    device.init(kRate);
    device.set_param(p::kSpan, 3.0f);
    device.set_param(p::kDirection, ChordHarp::kRandom);
    for (int second = 0; second < 10; ++second) {
      chord(device, {kC3, kE3, kG3, 246.942f, 293.665f, kA3}, 0.8f);
      render(device, 1.0f, kRate);
    }
  });

  return finish("chord-harp");
}
