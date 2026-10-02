// Native harness for Harp (cpp/devices/harp). The conformance pass covers
// silence before and after notes, a pile of keys, parameter abuse and other
// sample rates; the rest measures what makes it a harp, a koto or a guzheng:
// strings that ring on and into each other, a register that decides how long,
// the soft pluck and the hard one, bends that only rise.
//
// Nobody has listened to this instrument. Every claim below is a number.

#include <algorithm>

#include "../devices/harp/harp.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Harp;
namespace p = livemix::harp;

static Harp device;

static const float kRate = 48000.0f;
enum { kHarp = 0, kKoto = 1, kGuzheng = 2 };
static const char* kTypeNames[3] = {"Harp", "Koto", "Guzheng"};

static const float kC2 = 65.406f, kC3 = 130.813f, kC4 = 261.626f, kC5 = 523.251f, kC6 = 1046.502f,
                   kC7 = 2093.005f;

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static std::vector<float> side(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] - s.right[i]);
  return out;
}

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// Level of the `hz` component over n samples from `from`: a Hann-windowed
// DFT bin by a rotating phasor (no trig per sample, so sweeps stay fast).
static double bin_level(const std::vector<float>& x, double rate, double hz, size_t from, size_t n) {
  const double w = 2.0 * kPi * hz / rate, ww = 2.0 * kPi / static_cast<double>(n);
  const double cr = std::cos(w), ci = std::sin(w), wr = std::cos(ww), wi = std::sin(ww);
  double pr = 1.0, pi = 0.0, hr = 1.0, hi = 0.0, re = 0.0, im = 0.0, sum = 0.0;
  for (size_t i = 0; i < n && from + i < x.size(); ++i) {
    const double window = 0.5 - 0.5 * hr;
    re += window * x[from + i] * pr;
    im -= window * x[from + i] * pi;
    sum += window;
    double t = pr * cr - pi * ci;
    pi = pr * ci + pi * cr;
    pr = t;
    t = hr * wr - hi * wi;
    hi = hr * wi + hi * wr;
    hr = t;
  }
  return 2.0 * std::sqrt(re * re + im * im) / sum;
}

// The frequency of the strongest component within 4 % of `guess`, to a
// small fraction of a cent: scan, then narrow the span as the window grows.
static double fine_pitch(const std::vector<float>& x, double rate, double guess, size_t from, size_t to) {
  to = std::min(to, x.size());
  const size_t total = to - from;
  double f = guess, span = guess * 0.04;
  for (int stage = 0; stage < 12 && span > guess * 2.0e-6; ++stage) {
    const size_t n = std::min(total, static_cast<size_t>(3.0 * rate / span));
    double best = -1.0, best_f = f;
    for (int i = -10; i <= 10; ++i) {
      const double hz = f + span * i / 10.0;
      const double level = bin_level(x, rate, hz, from, n);
      if (level > best) {
        best = level;
        best_f = hz;
      }
    }
    f = best_f;
    span *= n == total ? 0.2 : 0.3;
  }
  return f;
}

// Ring time (to -60 dB) of the `hz` component between two moments.
static double ring_time(const std::vector<float>& x, double rate, double hz, double t0, double t1,
                        double window) {
  const size_t n = static_cast<size_t>(window * rate);
  const double a = bin_level(x, rate, hz, at(t0, rate), n);
  const double b = bin_level(x, rate, hz, at(t1, rate), n);
  return b < a ? 60.0 * (t1 - t0) / (db(a) - db(b)) : 1.0e9;
}

// Where the energy sits, in Hz, over n samples: the power-weighted mean of a
// scan from 40 Hz to just under Nyquist at the window's own resolution, so a
// click between the harmonics counts as much as the harmonics do.
static double centroid(const std::vector<float>& x, double rate, size_t from, size_t n) {
  double weighted = 0.0, total = 0.0;
  const double step = rate / static_cast<double>(n);
  for (double hz = 40.0; hz < 0.45 * rate; hz += step) {
    const double a = bin_level(x, rate, hz, from, n);
    weighted += hz * a * a;
    total += a * a;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// The loudest thing between a note's harmonics, relative to its loudest
// harmonic, in dB: what does not belong to the series.
static double out_of_series_db(const std::vector<float>& x, double rate, double hz, size_t from, size_t n) {
  double in = 0.0, between = 0.0;
  for (int k = 1; (k + 0.5) * hz < 0.45 * rate; ++k) {
    in = std::max(in, bin_level(x, rate, k * hz, from, n));
    between = std::max(between, bin_level(x, rate, (k + 0.5) * hz, from, n));
  }
  return db(between) - db(in);
}

// Level of everything between lo and hi Hz over n samples (root of the summed
// power of a scan at the window's resolution).
static double band_level(const std::vector<float>& x, double rate, double lo, double hi, size_t from, size_t n) {
  double total = 0.0;
  const double step = rate / static_cast<double>(n);
  for (double hz = lo; hz < hi; hz += step) {
    const double a = bin_level(x, rate, hz, from, n);
    total += a * a;
  }
  return std::sqrt(total);
}

// Moments, in seconds, when the level above 2.5 kHz jumps: a pluck on a
// string that was quiet up there.
static std::vector<double> onsets(const std::vector<float>& x, double rate) {
  const size_t frame = static_cast<size_t>(0.001 * rate);
  const double a = std::exp(-2.0 * kPi * 2500.0 / rate);
  std::vector<double> energy;
  double low = 0.0;
  for (size_t from = 0; from + frame <= x.size(); from += frame) {
    double sum = 0.0;
    for (size_t i = from; i < from + frame; ++i) {
      low = x[i] + (low - x[i]) * a;
      const double high = x[i] - low;
      sum += high * high;
    }
    energy.push_back(sum);
  }
  std::vector<double> found;
  for (size_t f = 0; f < energy.size(); ++f) {
    double before = 1.0e-12;
    for (size_t b = f >= 20 ? f - 20 : 0; b < f; ++b) before = std::max(before, energy[b]);
    if (energy[f] > 8.0 * before && energy[f] > 1.0e-9 && (found.empty() || 0.001 * f - found.back() > 0.03)) {
      found.push_back(0.001 * static_cast<double>(f));
    }
  }
  return found;
}

// The pitch of the component near `centre`, in cents above `base`, every
// 5 ms: the turning of its phase from one 30 ms window to the next. Entry k
// is the pitch around (k + 3.5) × 5 ms.
static std::vector<double> pitch_track(const std::vector<float>& x, double rate, double centre, double base,
                                       double seconds) {
  const double hop = 0.005, window = 0.03;
  const size_t n = static_cast<size_t>(window * rate), h = static_cast<size_t>(hop * rate);
  std::vector<double> phase;
  for (size_t from = 0; from + n <= at(seconds, rate) && from + n <= x.size(); from += h) {
    double re = 0.0, im = 0.0;
    for (size_t i = 0; i < n; ++i) {
      const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
      const double turn = 2.0 * kPi * centre * static_cast<double>(from + i) / rate;
      re += w * x[from + i] * std::cos(turn);
      im -= w * x[from + i] * std::sin(turn);
    }
    phase.push_back(std::atan2(im, re));
  }
  std::vector<double> track;
  for (size_t k = 0; k + 1 < phase.size(); ++k) {
    double d = phase[k + 1] - phase[k];
    while (d > kPi) d -= 2.0 * kPi;
    while (d < -kPi) d += 2.0 * kPi;
    track.push_back(cents(centre + d / (2.0 * kPi * hop), base));
  }
  return track;
}
static double track_time(size_t k) { return (static_cast<double>(k) + 3.5) * 0.005; }

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(std::min(a.size(), b.size()));
  for (size_t i = 0; i < out.size(); ++i) out[i] = a[i] - b[i];
  return out;
}

// The first moment two renders differ, in seconds (or -1): with the halo off
// the strings do not hear each other, so changing one note changes the sound
// from that note's pluck on and not before.
static double first_difference(const std::vector<float>& a, const std::vector<float>& b, double rate = kRate) {
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    if (std::fabs(a[i] - b[i]) > 1.0e-7f) return static_cast<double>(i) / rate;
  }
  return -1.0;
}

// The device with one type, and nothing in the way of a measurement unless a
// test turns it on: no halo, no sweep, the default body.
static void fresh(Harp& d, int type, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kStrings, static_cast<float>(type));
  d.set_param(p::kHalo, 0.0f);
}

int main() {
  Conformance spec;
  spec.name = "harp";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // Nothing damps a string: at the defaults the lowest of the pile (55 Hz)
  // rings about 8 s to -60 dB and is let go near -100 dB.
  spec.tail_seconds = 24.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // In tune from C2 to C6 at every rate, for every type, soft and hard. The
  // plectrum types start a hard pluck sharp, so they are read once settled.
  {
    double worst_all = 0.0;
    for (int type = 0; type < 3; ++type) {
      double worst = 0.0;
      for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
        for (float hz : {kC2, kC3, kC4, kC5, kC6}) {
          for (float touch : {0.0f, 1.0f}) {
            fresh(device, type, rate);
            device.set_param(p::kTouch, touch);
            device.note_on(1, hz, touch > 0.5f ? 1.0f : 0.4f);
            const std::vector<float> out = mid(render(device, 1.3f, rate));
            const double error = cents(fine_pitch(out, rate, hz, at(0.5, rate), at(1.3, rate)), hz);
            worst = std::max(worst, std::fabs(error));
          }
        }
      }
      std::printf("tuning %s: worst %.2f cents (C2..C6, 44.1/48/96 kHz, soft and hard)\n", kTypeNames[type], worst);
      worst_all = std::max(worst_all, worst);
    }
    EXPECT(worst_all < 3.0, "every type is within 3 cents from C2 to C6 at 44.1, 48 and 96 kHz");
  }

  // Levels: one string where the bank expects it, and a chord under the knee.
  {
    for (float hz : {kC2, kC4, kC6}) {
      device.init(kRate);
      device.note_on(1, hz, 0.7f);
      Stereo soft = render(device, 1.0f, kRate);
      device.init(kRate);
      device.note_on(1, hz, 0.8f);
      Stereo app = render(device, 1.0f, kRate);
      const double at_07 = db(std::max(peak(soft.left), peak(soft.right)));
      const double at_08 = db(std::max(peak(app.left), peak(app.right)));
      std::printf("level %.0f Hz: peak %.1f dBFS at gain 0.7, %.1f at 0.8\n", hz, at_07, at_08);
      EXPECT(at_07 > -24.0 && at_07 < -10.0, "one note at gain 0.7 peaks between -24 and -10 dBFS");
      EXPECT(at_08 > -22.5 && at_08 < -15.5, "one note at gain 0.8 peaks between about -22 and -16 dBFS");
    }
    for (int type = 0; type < 3; ++type) {
      device.init(kRate);
      device.set_param(p::kStrings, static_cast<float>(type));
      for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
      Stereo out = render(device, 3.0f, kRate);
      std::printf("ten %s strings together: peak %.2f\n", kTypeNames[type], std::max(peak(out.left), peak(out.right)));
      EXPECT(peak(out.left) < 0.9 && peak(out.right) < 0.9, "ten strings plucked together stay under the clip knee");
    }
    device.init(kRate);
    device.note_on(1, kC4, 1.0f);
    Stereo loud = render(device, 0.5f, kRate);
    device.init(kRate);
    device.note_on(1, kC4, 0.2f);
    Stereo quiet = render(device, 0.5f, kRate);
    EXPECT(rms(quiet.left) < 0.4 * rms(loud.left), "a soft pluck is quieter");
    const std::vector<float> q = mid(quiet), l = mid(loud);
    const double opens = (db(bin_level(l, kRate, 10 * kC4, 0, 2400)) - db(bin_level(l, kRate, kC4, 0, 2400))) -
                         (db(bin_level(q, kRate, 10 * kC4, 0, 2400)) - db(bin_level(q, kRate, kC4, 0, 2400)));
    std::printf("velocity 0.2 to 1: harmonic 10 comes up %.1f dB against the fundamental\n", opens);
    EXPECT(opens > 4.0, "and darker: a harder pluck opens the tenth harmonic by 4 dB");
  }

  // Nothing damps a string. With Damp at zero a released note is the note
  // held; Damp brings a hand down on it.
  {
    fresh(device, kHarp);
    device.note_on(1, kC3, 0.8f);
    const Stereo held = render(device, 3.0f, kRate);
    fresh(device, kHarp);
    device.note_on(1, kC3, 0.8f);
    Stereo let_go = render(device, 1.0f, kRate);
    device.note_off(1);
    let_go = concat(let_go, render(device, 2.0f, kRate));
    const double ring = db(rms(let_go.left, at(2.0), at(2.5))) - db(rms(held.left, at(2.0), at(2.5)));
    EXPECT(std::fabs(ring) < 1.0, "a second after key-up the string rings as if the key were still down");
    EXPECT(let_go.left == held.left && let_go.right == held.right, "in fact it is the same sound, sample for sample");

    double fall[2];
    int which = 0;
    for (float damp : {0.5f, 1.0f}) {
      fresh(device, kHarp);
      device.set_param(p::kDamp, damp);
      device.note_on(1, kC3, 0.8f);
      Stereo damped = render(device, 1.0f, kRate);
      device.note_off(1);
      damped = concat(damped, render(device, 2.0f, kRate));
      fall[which++] = db(rms(held.left, at(1.4), at(1.5))) - db(rms(damped.left, at(1.4), at(1.5)));
    }
    std::printf("let ring: %.2f dB from the held note 1 s after key-up; Damp 0.5 takes %.0f dB off in 0.4 s, Damp 1 %.0f dB\n",
                ring, fall[0], fall[1]);
    EXPECT(fall[1] > 30.0, "Damp 1 stops a string: 30 dB down within half a second of key-up");
    EXPECT(fall[0] > 4.0 && fall[0] < fall[1] - 10.0, "Damp 0.5 is part of the way there");
  }

  // The register decides how long a string rings: the curve the device says
  // it follows, bass many times longer than treble, and Decay scales it.
  {
    const float notes[4] = {kC2, kC4, kC6, kC7};
    double measured[4];
    for (int n = 0; n < 4; ++n) {
      const double wanted = Harp::ring_seconds(kHarp, notes[n]);
      fresh(device, kHarp);
      device.set_param(p::kBody, 0.0f);
      device.note_on(1, notes[n], 0.8f);
      const std::vector<float> out = mid(render(device, static_cast<float>(0.75 * wanted + 0.5), kRate));
      measured[n] = ring_time(out, kRate, notes[n], 0.1 * wanted, 0.6 * wanted, 0.1 * wanted);
      std::printf("ring %.0f Hz: fundamental T60 %.2f s (the curve says %.2f)\n", notes[n], measured[n], wanted);
      EXPECT(std::fabs(measured[n] - wanted) < 0.15 * wanted, "the fundamental rings as long as the register curve says, within 15 %");
    }
    EXPECT(measured[0] > 5.0 * measured[2], "C2 rings at least five times as long as C6");
    EXPECT(measured[3] < 1.0, "C7 is over in under a second");

    double scaled[2];
    int which = 0;
    for (float decay : {0.25f, 4.0f}) {
      fresh(device, kHarp);
      device.set_param(p::kDecay, decay);
      device.note_on(1, kC4, 0.8f);
      const double wanted = Harp::ring_seconds(kHarp, kC4) * decay;
      const std::vector<float> out = mid(render(device, static_cast<float>(0.75 * wanted + 0.5), kRate));
      scaled[which++] = ring_time(out, kRate, kC4, 0.1 * wanted, 0.6 * wanted, 0.1 * wanted);
    }
    std::printf("Decay 0.25 and 4 at C4: %.2f s and %.2f s\n", scaled[0], scaled[1]);
    EXPECT(scaled[1] > 12.0 * scaled[0], "Decay scales the ring time: sixteen times from one end to the other");
  }

  // The highs go first: the spectrum falls all through the first second.
  {
    fresh(device, kHarp);
    device.set_param(p::kTouch, 0.8f);
    device.note_on(1, kC3, 0.9f);
    const std::vector<float> out = mid(render(device, 1.2f, kRate));
    double previous = 1.0e9;
    bool falling = true;
    double first = 0.0, last = 0.0;
    for (int w = 0; w < 5; ++w) {
      const double c = centroid(out, kRate, at(0.2 * w), 4800);
      if (w == 0) first = c;
      last = c;
      if (c >= previous) falling = false;
      previous = c;
    }
    std::printf("darkening C3: centroid %.0f Hz at the pluck, %.0f Hz after 0.8 s\n", first, last);
    EXPECT(falling && last < 0.8 * first, "a string darkens as it dies: the centroid falls through the first second");
  }

  // Where the string is plucked is a comb: at the middle the even harmonics
  // are missing, at a fifth every fifth one.
  {
    fresh(device, kHarp);
    device.set_param(p::kPluck, 0.5f);
    device.set_param(p::kBody, 0.0f);
    device.set_param(p::kTouch, 0.7f);
    device.note_on(1, kC3, 0.8f);
    std::vector<float> out = mid(render(device, 0.3f, kRate));
    double level[8];
    for (int k = 1; k <= 7; ++k) level[k] = db(bin_level(out, kRate, k * kC3, 0, 9600));
    const double second = std::min(level[1], level[3]) - level[2];
    const double fourth = std::min(level[3], level[5]) - level[4];
    std::printf("pluck at 1/2: harmonic 2 is %.0f dB under its neighbours, harmonic 4 %.0f dB\n", second, fourth);
    EXPECT(second > 12.0 && fourth > 12.0, "plucked at the middle, even harmonics are 12 dB under the odd ones beside them");

    fresh(device, kHarp);
    device.set_param(p::kPluck, 0.2f);
    device.set_param(p::kBody, 0.0f);
    device.set_param(p::kTouch, 0.7f);
    device.note_on(1, kC3, 0.8f);
    out = mid(render(device, 0.3f, kRate));
    for (int k = 1; k <= 7; ++k) level[k] = db(bin_level(out, kRate, k * kC3, 0, 9600));
    const double fifth = std::min(level[4], level[6]) - level[5];
    std::printf("pluck at 1/5: harmonic 5 is %.0f dB under its neighbours; harmonic 2 is %.0f dB under the first\n", fifth,
                level[1] - level[2]);
    EXPECT(fifth > 15.0, "plucked at a fifth, the fifth harmonic is 15 dB under its neighbours");
    EXPECT(level[1] - level[2] < 12.0, "and the second is back");
  }

  // The soft pad and the hard pick.
  {
    fresh(device, kHarp);
    device.set_param(p::kTouch, 0.0f);
    device.note_on(1, kC4, 0.8f);
    const std::vector<float> pad = mid(render(device, 0.6f, kRate));
    fresh(device, kHarp);
    device.set_param(p::kTouch, 1.0f);
    device.note_on(1, kC4, 0.8f);
    const std::vector<float> nail = mid(render(device, 0.6f, kRate));
    const double pad_centroid = centroid(pad, kRate, 0, 2400);
    const double pad_tenth = db(bin_level(pad, kRate, 10 * kC4, 0, 2400)) - db(bin_level(pad, kRate, kC4, 0, 2400));
    const double nail_tenth = db(bin_level(nail, kRate, 10 * kC4, 0, 2400)) - db(bin_level(nail, kRate, kC4, 0, 2400));
    std::printf("harp C4: onset centroid %.0f Hz at Touch 0; harmonic 10 at %.0f dB re the first, %.0f dB at Touch 1\n",
                pad_centroid, pad_tenth, nail_tenth);
    EXPECT(pad_centroid < 600.0, "a harp string under the finger pad starts dark: onset centroid under 600 Hz at C4");
    EXPECT(nail_tenth > pad_tenth + 10.0, "Touch hardens the pluck: the tenth harmonic comes up by 10 dB");

    // The Koto preset's pluck: a hard pick near the end.
    fresh(device, kKoto);
    device.set_param(p::kPluck, 0.08f);
    device.set_param(p::kTouch, 0.75f);
    device.note_on(1, kC4, 0.5f);
    const std::vector<float> koto = mid(render(device, 0.6f, kRate));
    const double koto_centroid = centroid(koto, kRate, 0, 2400);
    double weakest = 1.0e9;
    for (int k = 2; k <= 10; ++k) {
      weakest = std::min(weakest, db(bin_level(koto, kRate, k * kC4, 0, 2400)) - db(bin_level(koto, kRate, kC4, 0, 2400)));
    }
    std::printf("koto C4: onset centroid %.0f Hz; harmonics 2 to 10 no lower than %.0f dB re the first\n", koto_centroid,
                weakest);
    EXPECT(koto_centroid > 2000.0, "a koto's pick is bright: onset centroid above 2 kHz at C4");
    EXPECT(weakest > -20.0, "with every harmonic up to the tenth within 20 dB of the fundamental");
    EXPECT(koto_centroid > 3.0 * pad_centroid, "several times brighter than the harp's finger");
  }

  // Koto against guzheng: steel rings longer and stays brighter, and its
  // stiffness stretches the partials; gut and silk are harmonic.
  {
    double ring[3], high[3], stretch[3];
    for (int type = 0; type < 3; ++type) {
      fresh(device, type);
      device.set_param(p::kPluck, 0.1f);
      device.set_param(p::kTouch, 0.7f);
      device.set_param(p::kBody, 0.0f);
      device.note_on(1, kC4, 0.4f);
      std::vector<float> out = mid(render(device, 2.5f, kRate));
      ring[type] = ring_time(out, kRate, kC4, 0.3, 1.8, 0.3);
      high[type] = db(band_level(out, kRate, 3000.0, 12000.0, at(0.5), 4800)) - db(bin_level(out, kRate, kC4, at(0.5), 4800));
      fresh(device, type);
      device.set_param(p::kPluck, 0.1f);
      device.set_param(p::kTouch, 0.7f);
      device.set_param(p::kBody, 0.0f);
      device.note_on(1, kC3, 0.4f);
      out = mid(render(device, 2.0f, kRate));
      const double first = fine_pitch(out, kRate, kC3, at(0.4), at(2.0));
      const double eighth = fine_pitch(out, kRate, 8.0 * first, at(0.4), at(2.0));
      stretch[type] = cents(eighth, 8.0 * first);
      std::printf("%s: C4 rings %.2f s, energy above 3 kHz at 0.5 s %.0f dB re the fundamental, C3 harmonic 8 %+.1f cents\n",
                  kTypeNames[type], ring[type], high[type], stretch[type]);
    }
    EXPECT(ring[kGuzheng] > 1.5 * ring[kKoto], "a guzheng string rings at least half as long again as a koto's");
    EXPECT(high[kGuzheng] > high[kKoto] + 6.0, "and holds 6 dB more above 3 kHz half a second in");
    EXPECT(stretch[kGuzheng] > 4.0, "wound steel is stiff: the guzheng's eighth partial is over 4 cents sharp");
    EXPECT(std::fabs(stretch[kHarp]) < 3.0 && std::fabs(stretch[kKoto]) < 3.0, "gut and silk are not: harmonic to 3 cents");
  }

  // The halo: a string that is already ringing picks up a new note where the
  // two share a partial. Without the halo a chord is exactly the sum of its
  // notes, so what the halo adds is the chord minus the notes played alone.
  {
    // C3 from the start, a second note half a second in.
    auto play = [](float halo, float second, bool low, bool high) {
      device.init(kRate);
      device.set_param(p::kHalo, halo);
      if (low) device.note_on(1, kC3, 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      if (high) device.note_on(2, second, 0.8f);
      return mid(concat(out, render(device, 3.0f, kRate)));
    };
    const float f_sharp = 369.994f;
    double bloom[2], stray[2];
    int which = 0;
    for (float second : {kC4, f_sharp}) {
      const std::vector<float> alone = play(1.0f, second, false, true);
      const std::vector<float> chord = play(1.0f, second, true, true);
      const std::vector<float> added = minus(minus(chord, play(1.0f, second, true, false)), alone);
      // Half a second after the second pluck, against that note as struck.
      bloom[which] = db(bin_level(added, kRate, second, at(1.0), 9600)) - db(bin_level(alone, kRate, second, at(0.5), 9600));
      const std::vector<float> dry_chord = play(0.0f, second, true, true);
      const std::vector<float> dry = minus(minus(dry_chord, play(0.0f, second, true, false)), play(0.0f, second, false, true));
      stray[which] = db(peak(dry)) - db(peak(alone));
      if (which == 0) {
        const double pitch = cents(fine_pitch(chord, kRate, kC4, at(0.7), at(2.0)), kC4);
        EXPECT(std::fabs(pitch) < 3.0, "the halo does not pull a note out of tune");
      }
      ++which;
    }
    std::printf("halo: C3 answers a C4 at %.0f dB re the note, an F sharp at %.0f dB; with Halo 0 the difference is %.0f dB\n",
                bloom[0], bloom[1], std::max(stray[0], stray[1]));
    EXPECT(bloom[0] > -30.0 && bloom[0] < -8.0, "a ringing C3 answers the C4 an octave above: 8 to 30 dB under the note");
    EXPECT(bloom[1] < bloom[0] - 30.0, "and does not answer an F sharp, which shares no partial with it");
    EXPECT(stray[0] < -100.0 && stray[1] < -100.0, "with Halo at zero the strings do not hear each other at all");

    // It cannot run away: everything ringing, the longest decay, the halo
    // full, bends on. The level only ever falls.
    for (int type = 0; type < 3; ++type) {
      device.init(kRate);
      device.set_param(p::kStrings, static_cast<float>(type));
      device.set_param(p::kHalo, 1.0f);
      device.set_param(p::kDecay, 4.0f);
      device.set_param(p::kBend, type == kHarp ? 0.0f : 200.0f);
      for (int n = 0; n < Harp::kMaxStrings; ++n) device.note_on(n, kC2 * std::pow(2.0f, n / 12.0f), 1.0f);
      const Stereo out = render(device, 20.0f, kRate);
      double rise = -1.0e9, previous = db(rms(out.left, at(1.0), at(2.0)));
      const double first = previous;
      for (int second = 2; second < 20; ++second) {
        const double level = db(rms(out.left, at(second), at(second + 1)));
        rise = std::max(rise, level - previous);
        previous = level;
      }
      std::printf("halo stability (%s, %d strings, Halo 1, Decay 4): %.1f dB in the second second, %.1f dB in the twentieth, largest step %+.2f dB\n",
                  kTypeNames[type], Harp::kMaxStrings, first, previous, rise);
      EXPECT(finite(out.left) && rise < 0.0 && previous < first - 20.0, "with every string ringing and the halo full, the level only falls");
    }
  }

  // Overlap is the instrument: twenty notes in two seconds, each key let go
  // at once, and every one of them is still there a second after the last.
  {
    const int scale[7] = {0, 2, 4, 5, 7, 9, 11};
    float notes[20];
    for (int n = 0; n < 20; ++n) notes[n] = kC3 * std::pow(2.0f, static_cast<float>(12 * (n / 7) + scale[n % 7]) / 12.0f);
    // Without the halo the passage is exactly the sum of its notes, so what
    // a note adds is that note; with it, the other strings ring along too.
    for (float halo : {0.0f, 0.5f}) {
      auto play = [&](int without) {
        device.init(kRate);
        device.set_param(p::kHalo, halo);
        Stereo out;
        for (int n = 0; n < 20; ++n) {
          if (n != without) device.note_on(n, notes[n], 0.8f);
          Stereo a = render(device, 0.05f, kRate);
          device.note_off(n);
          out = concat(concat(out, a), render(device, 0.05f, kRate));
        }
        return mid(concat(out, render(device, 2.0f, kRate)));
      };
      const std::vector<float> all = play(-1);
      double least = 1.0e9, most = -1.0e9;
      for (int n = 0; n < 20; ++n) {
        const std::vector<float> added = minus(all, play(n));
        device.init(kRate);
        device.set_param(p::kHalo, halo);
        const Stereo lead = render(device, 0.1f * static_cast<float>(n), kRate);
        device.note_on(n, notes[n], 0.8f);
        const std::vector<float> alone = mid(concat(lead, render(device, 4.0f, kRate)));
        const double off = db(bin_level(added, kRate, notes[n], at(3.0), 9600)) - db(bin_level(alone, kRate, notes[n], at(3.0), 9600));
        least = std::min(least, off);
        most = std::max(most, off);
      }
      std::printf("overlap (Halo %.1f): a second after twenty notes, what each adds is %+.2f to %+.2f dB of the same note alone\n",
                  halo, least, most);
      if (halo == 0.0f) {
        EXPECT(least > -0.5 && most < 0.5, "twenty notes in two seconds are all still ringing a second later, each exactly as it would alone");
      } else {
        EXPECT(least > -3.0, "and with the halo the other strings add to each note, never take from it");
        EXPECT(most > 1.0, "audibly so for the notes that share partials with lower strings");
      }
    }
  }

  // Playing a ringing string again is the same string: the finger lands on
  // it, then plucks. No second voice, no doubling, no click.
  {
    fresh(device, kHarp);
    device.note_on(1, kC3, 0.8f);
    const Stereo once = render(device, 1.0f, kRate);
    fresh(device, kHarp);
    device.note_on(1, kC3, 0.8f);
    Stereo twice = render(device, 0.2f, kRate);
    device.note_on(2, kC3, 0.8f);
    twice = concat(twice, render(device, 0.8f, kRate));
    const double struck = first_difference(once.left, twice.left);
    const double plucked = struck + 0.01;  // the finger rests on the string for 10 ms
    const double up = db(peak(twice.left, at(0.2), at(0.5))) - db(peak(once.left, 0, at(0.2)));
    // Just before the pluck the string is 10 dB down on what it would have been.
    const double ducked = db(rms(twice.left, at(plucked - 0.002), at(plucked))) - db(rms(once.left, at(plucked - 0.002), at(plucked)));
    const double step = max_step(twice.left, at(0.2), at(0.3)) / max_step(once.left, 0, at(0.1));
    std::printf("re-pluck after 200 ms: the finger lands at %.3f s, the string is %.1f dB down before the pluck, the peak comes up %.1f dB, largest step %.2f of a first pluck's\n",
                struck, ducked, up, step);
    EXPECT(struck >= 0.2 && struck < 0.201, "the finger lands when the key is played");
    EXPECT(ducked < -7.0 && ducked > -13.0, "and takes about 10 dB off the string before it plucks");
    EXPECT(up < 3.0, "plucking a ringing string again raises the peak by less than 3 dB");
    EXPECT(step < 1.3, "with no step larger than a pluck's own");
    // Thirty-two plucks of one pitch use one string: the rest stay free, so a
    // thirty-third pitch does not have to take a ringing one.
    fresh(device, kHarp);
    for (int n = 0; n < 40; ++n) {
      device.note_on(n, kC3, 0.8f);
      render(device, 0.05f, kRate);
    }
    Stereo before = render(device, 0.1f, kRate);
    const double level = rms(before.left);
    EXPECT(level < 1.6 * rms(once.left, at(0.05), at(0.15)), "forty plucks of one key are one string sounding, not forty");
  }

  // When every string is ringing the quietest is taken, and it fades out
  // over 3 ms rather than stopping dead.
  {
    auto play = [](bool extra) {
      fresh(device, kHarp);
      device.set_param(p::kDecay, 4.0f);
      for (int n = 0; n < Harp::kMaxStrings; ++n) device.note_on(n, kC2 * std::pow(2.0f, n / 12.0f), 1.0f);
      Stereo out = render(device, 0.3f, kRate);
      if (extra) device.note_on(99, kC7, 0.1f);
      return concat(out, render(device, 0.2f, kRate));
    };
    const Stereo full = play(false), stolen = play(true);
    const std::vector<float> change = minus(stolen.left, full.left);
    const size_t from = at(0.3), fade = at(0.003);
    const double gone = peak(change, from, from + fade);
    const double step = max_step(change, from > 0 ? from - 1 : 0, from + fade);
    std::printf("steal: the taken string leaves %.4f of signal over 3 ms with a largest step of %.5f (%.0f %% of it)\n", gone,
                step, 100.0 * step / gone);
    EXPECT(gone > 1.0e-4, "a thirty-third pitch takes a string that is still sounding");
    EXPECT(step < 0.25 * gone, "which fades out: no step near the size of what was taken");
    EXPECT(finite(stolen.left), "the passage stays finite through it");
    fresh(device, kHarp);
    device.set_param(p::kDecay, 4.0f);
    render(device, 0.3f, kRate);
    device.note_on(99, kC7, 0.1f);
    const Stereo alone = render(device, 0.2f, kRate);
    const double heard = db(bin_level(change, kRate, kC7, at(0.31), 4800)) - db(bin_level(alone.left, kRate, kC7, at(0.01), 4800));
    std::printf("steal: the new note is within %+.2f dB of the same note on a free string\n", heard);
    EXPECT(std::fabs(heard) < 1.0, "and the new note sounds as it would on a free string");
  }

  // Nothing clicks: the hand that mutes a string, and the two controls most
  // likely to be moved while it sounds.
  {
    auto chord = [](float body, float volume) {
      fresh(device, kHarp);
      device.set_param(p::kBody, body);
      device.set_param(p::kVolume, volume);
      device.note_on(1, kC3, 0.8f);
      device.note_on(2, 196.0f, 0.8f);
      device.note_on(3, 329.63f, 0.8f);
      return render(device, 0.3f, kRate);
    };
    // Damp at full: the key is let go and the string is stopped by a hand.
    fresh(device, kHarp);
    device.set_param(p::kDamp, 1.0f);
    device.note_on(1, kC3, 0.8f);
    Stereo held = render(device, 0.3f, kRate);
    device.note_off(1);
    held = concat(held, render(device, 0.3f, kRate));
    const double muted = max_step(held.left, at(0.3), at(0.4)) / max_step(held.left, at(0.2), at(0.3));
    const double left = db(rms(held.left, at(0.5), at(0.6))) - db(rms(held.left, at(0.2), at(0.3)));
    std::printf("damp: a muted string's largest step is %.2f of the ringing string's, and it is %.0f dB down 200 ms later\n", muted, left);
    EXPECT(muted < 1.1, "muting a string makes no step larger than the string's own");
    EXPECT(left < -40.0, "and stops it");

    // Body thrown from one end to the other while a chord rings.
    auto ringing = [&](float body, float volume) {
      const Stereo start = chord(body, volume);
      return concat(start, render(device, 0.2f, kRate));
    };
    const double bare = max_step(ringing(0.0f, -6.0f).left, at(0.3), at(0.5));
    const double full = max_step(ringing(1.0f, -6.0f).left, at(0.3), at(0.5));
    Stereo moved = chord(0.0f, -6.0f);
    device.set_param(p::kBody, 1.0f);
    moved = concat(moved, render(device, 0.2f, kRate));
    const double body_step = max_step(moved.left, at(0.3), at(0.5)) / std::max(bare, full);
    // Volume thrown up 30 dB: the gain glides, so the swell is quick but it
    // is not an edge. A jump with no glide would step by the signal itself.
    const Stereo loud = ringing(0.6f, 0.0f);
    const double pluck = max_step(loud.left, 0, at(0.3));
    moved = chord(0.6f, -30.0f);
    device.set_param(p::kVolume, 0.0f);
    moved = concat(moved, render(device, 0.2f, kRate));
    const double swell = max_step(moved.left, at(0.3), at(0.5));
    const double edge = peak(loud.left, at(0.3), at(0.31));
    std::printf("moving a control under a ringing chord: Body end to end %.2f of the steady sound's largest step; Volume up 30 dB %.2f of it, %.2f of the pluck's, %.3f of an unsmoothed jump\n",
                body_step, swell / max_step(loud.left, at(0.3), at(0.5)), swell / pluck, swell / edge);
    EXPECT(body_step < 1.3, "throwing Body from one end to the other does not click");
    EXPECT(swell < 0.5 * pluck && swell < 0.1 * edge, "throwing Volume up 30 dB is a swell, not an edge: under half a pluck's step");
  }

  // Sweep: notes played together are rolled from the lowest to the highest,
  // evenly, over the time on the knob. Each pluck is timed by changing that
  // one note's velocity and finding where the sound first differs.
  {
    const float notes[8] = {466.16f, kC4, 369.99f, 587.33f, 293.66f, 415.30f, 329.63f, kC5};  // played out of order
    auto play = [&](float sweep, int count, int louder) {
      fresh(device, kHarp);
      device.set_param(p::kSweep, sweep);
      for (int n = 0; n < count; ++n) device.note_on(n, notes[n], n == louder ? 0.9f : 0.6f);
      return render(device, 1.2f, kRate).left;
    };
    const std::vector<float> rolled = play(0.8f, 8, -1);
    double when[8];
    int by_pitch[8];
    for (int n = 0; n < 8; ++n) {
      when[n] = first_difference(rolled, play(0.8f, 8, n));
      by_pitch[n] = n;
    }
    std::sort(by_pitch, by_pitch + 8, [&](int a, int b) { return notes[a] < notes[b]; });
    bool ordered = true;
    double shortest = 1.0e9, longest = 0.0;
    for (int n = 1; n < 8; ++n) {
      const double gap = when[by_pitch[n]] - when[by_pitch[n - 1]];
      ordered = ordered && gap > 0.0;
      shortest = std::min(shortest, gap);
      longest = std::max(longest, gap);
    }
    const double total = when[by_pitch[7]] - when[by_pitch[0]];
    std::printf("sweep 0.8 s, eight notes played at once out of order: first pluck at %.3f s, last %.3f s later, gaps %.0f to %.0f ms\n",
                when[by_pitch[0]], total, 1000.0 * shortest, 1000.0 * longest);
    EXPECT(ordered, "a sweep plucks from the lowest note to the highest whatever order they were played in");
    EXPECT(when[by_pitch[0]] >= 0.0 && when[by_pitch[0]] < 0.005, "starting at once");
    EXPECT_NEAR(total, 0.8, 0.08, "and takes the time on the knob");
    EXPECT(shortest > 0.9 * 0.8 / 7.0 && longest < 1.1 * 0.8 / 7.0, "in even steps");
    // One note has nothing to roll; a chord with Sweep at zero is plucked
    // together, a few milliseconds apart as fingers are.
    EXPECT(first_difference(play(0.8f, 1, -1), play(0.8f, 1, 0)) < 0.001, "a single note is never delayed by Sweep");
    const std::vector<float> together = play(0.0f, 8, -1);
    double last = 0.0;
    for (int n = 0; n < 8; ++n) last = std::max(last, first_difference(together, play(0.0f, 8, n)));
    std::printf("sweep 0: the eight plucks land within %.1f ms\n", 1000.0 * last);
    EXPECT(last < 0.005, "with Sweep at zero a chord is plucked together, within 5 ms");
  }

  // Bend: the left hand leans on the string behind the bridge. The pitch
  // only rises, a moment after the pluck, and it is still the same note.
  {
    auto play = [](int type, float bend, float gain, float touch) {
      fresh(device, type);
      device.set_param(p::kBend, bend);
      device.set_param(p::kTouch, touch);
      device.note_on(1, kC4, gain);
      return render(device, 1.2f, kRate);
    };
    for (float bend : {100.0f, 200.0f}) {
      const Stereo out = play(kKoto, bend, 0.3f, 0.5f);
      const std::vector<double> track = pitch_track(out.left, kRate, kC4 * std::pow(2.0, bend / 2400.0), kC4, 1.0);
      double lowest = 1.0e9, begins = -1.0, tenth = -1.0, ninety = -1.0;
      for (size_t k = 4; k < track.size(); ++k) {
        lowest = std::min(lowest, track[k]);
        if (begins < 0.0 && track[k] > 3.0) begins = track_time(k);
        if (tenth < 0.0 && track[k] > 0.1 * bend) tenth = track_time(k);
        if (ninety < 0.0 && track[k] > 0.9 * bend) ninety = track_time(k);
      }
      const double lands = cents(fine_pitch(out.left, kRate, kC4 * std::pow(2.0, bend / 1200.0), at(0.6), at(1.2)), kC4);
      const size_t plucks = onsets(out.left, kRate).size();
      const double between = out_of_series_db(out.left, kRate, kC4 * std::pow(2.0, bend / 1200.0), at(0.6), 9600);
      const Stereo straight = play(kKoto, 0.0f, 0.3f, 0.5f);
      const double step = max_step(out.left, at(0.03), at(0.5)) / max_step(straight.left, at(0.03), at(0.5));
      std::printf("bend %.0f cents (koto, soft): begins at %.0f ms, 10 to 90 %% in %.0f ms, lands at %+.1f cents, lowest %+.1f, %zu pluck, %.0f dB between the harmonics, step %.2f of an unbent note's\n",
                  bend, 1000.0 * begins, 1000.0 * (ninety - tenth), lands, lowest, plucks, between, step);
      EXPECT(lowest > -3.0, "a bend never goes below the note");
      EXPECT(begins > 0.05 && begins < 0.15, "it starts a moment after the pluck: 50 to 150 ms");
      EXPECT(ninety - tenth > 0.1 && ninety - tenth < 0.25, "and takes a tenth to a quarter of a second");
      EXPECT_NEAR(lands, bend, 5.0, "landing on the amount on the knob");
      EXPECT(plucks == 1, "without plucking the string again");
      EXPECT(between < -50.0, "and it is one clean string when it lands");
      EXPECT(step < 1.5, "with no step larger than the unbent note's");
    }
    // The tension of a hard pluck: sharp at first, home within half a second.
    for (int type = 0; type < 3; ++type) {
      double early[2], late[2];
      int which = 0;
      for (float gain : {0.3f, 1.0f}) {
        const Stereo out = play(type, 0.0f, gain, 1.0f);
        const std::vector<double> track = pitch_track(out.left, kRate, kC4, kC4, 1.0);
        early[which] = 0.0;
        for (size_t k = 1; k <= 5; ++k) early[which] += 0.2 * track[k];  // 22 to 43 ms
        late[which] = cents(fine_pitch(out.left, kRate, kC4, at(0.5), at(1.0)), kC4);
        ++which;
      }
      std::printf("settle (%s): a soft pluck starts %+.1f cents, a hard one %+.1f; half a second on they are at %+.2f and %+.2f\n",
                  kTypeNames[type], early[0], early[1], late[0], late[1]);
      if (type == kHarp) {
        EXPECT(std::fabs(early[1]) < 1.5, "a harp string does not go sharp when plucked hard");
      } else {
        EXPECT(early[1] > 3.0 && early[1] < 20.0, "a hard pluck starts a few cents sharp");
        EXPECT(early[0] < 2.0, "a soft one barely does");
      }
      EXPECT(std::fabs(late[0]) < 3.0 && std::fabs(late[1]) < 3.0, "and both are in tune half a second later");
    }
  }

  // Stereo: the strings are laid out low to high, left to right, and the
  // picture folds to mono without losing a note.
  {
    auto note = [](float hz) {
      fresh(device, kHarp);
      device.note_on(1, hz, 0.8f);
      return render(device, 0.5f, kRate);
    };
    double lean[3], fold[3];
    int which = 0;
    for (float hz : {kC2, kC4, kC6}) {
      const Stereo out = note(hz);
      lean[which] = db(rms(out.right)) - db(rms(out.left));
      fold[which] = db(rms(mid(out))) - db(std::sqrt(0.5 * (rms(out.left) * rms(out.left) + rms(out.right) * rms(out.right))));
      ++which;
    }
    fresh(device, kHarp);
    for (int n = 0; n < 8; ++n) device.note_on(n, kC2 * std::pow(2.0f, n * 7 / 12.0f), 0.8f);
    const Stereo spread = render(device, 1.0f, kRate);
    const double width = db(rms(side(spread))) - db(rms(mid(spread)));
    std::printf("stereo: right minus left is %+.1f dB at C2, %+.1f dB at C4, %+.1f dB at C6; mono loses %.2f, %.2f, %.2f dB; side is %.1f dB under mid for a wide chord\n",
                lean[0], lean[1], lean[2], -fold[0], -fold[1], -fold[2], -width);
    EXPECT(lean[0] < -1.0 && lean[2] > 1.0, "low strings sit to the left and high strings to the right");
    EXPECT(std::fabs(lean[1]) < 0.2, "with middle C in the centre");
    EXPECT(fold[0] > -1.0 && fold[1] > -1.0 && fold[2] > -1.0, "a note loses under 1 dB in mono");
    EXPECT(width < -6.0 && width > -40.0, "a chord across the range has width, and more mid than side");
  }

  // Body: how much the soundboard is heard. Its resonances lift the notes
  // that sit on them over the notes between them, and the long zithers' box
  // is more hollow (narrower resonances) than the harp's board.
  {
    auto lift = [](int type, float hz) {
      double level[2];
      int which = 0;
      for (float body : {0.0f, 1.0f}) {
        fresh(device, type);
        device.set_param(p::kBody, body);
        device.note_on(1, hz, 0.6f);
        level[which++] = db(bin_level(mid(render(device, 0.4f, kRate)), kRate, hz, at(0.1), 9600));
      }
      return level[1] - level[0];
    };
    // A resonance of each type and the gap below it.
    const double harp_on = lift(kHarp, 310.0f), harp_off = lift(kHarp, 236.0f);
    const double koto_on = lift(kKoto, 290.0f), koto_off = lift(kKoto, 222.0f);
    std::printf("body: full against none lifts a harp note on a resonance %+.1f dB and one between %+.1f dB; a koto note %+.1f and %+.1f dB\n",
                harp_on, harp_off, koto_on, koto_off);
    EXPECT(std::fabs(harp_on) > 1.0 || std::fabs(harp_off) > 1.0, "Body changes the level of the notes it colours");
    EXPECT(koto_on - koto_off > harp_on - harp_off + 1.5, "the koto's box is more hollow than the harp's board");
  }

  // Aliasing: the brightest sound it makes, at the top of the keyboard, at
  // the two common rates. What is not a harmonic stays 50 dB under them.
  {
    for (float rate : {44100.0f, 48000.0f}) {
      for (float hz : {kC6, kC7}) {
        fresh(device, kKoto, rate);
        device.set_param(p::kTouch, 1.0f);
        device.set_param(p::kPluck, 0.04f);
        device.set_param(p::kVolume, 6.0f);
        device.note_on(1, hz, 1.0f);
        const Stereo out = render(device, 0.6f, rate);
        const double sounding = fine_pitch(out.left, rate, hz, at(0.25, rate), at(0.45, rate));
        const double stray = out_of_series_db(out.left, rate, sounding, at(0.25, rate), at(0.2, rate));
        std::printf("aliasing (koto, hardest pick, %.0f Hz at %.1f kHz): %.0f dB between the harmonics\n", hz, rate / 1000.0, stray);
        EXPECT(stray < -50.0, "nothing between the harmonics within 50 dB of them");
      }
    }
  }

  // The host's block size is not part of the sound: a rolled chord, a bend,
  // a re-pluck and a muted note come out the same in blocks of 128, 37 or 1.
  {
    auto play = [](int block) {
      device.init(kRate);
      device.set_param(p::kStrings, static_cast<float>(kKoto));
      device.set_param(p::kSweep, 0.2f);
      device.set_param(p::kBend, 60.0f);
      device.set_param(p::kDamp, 0.7f);
      for (int n = 0; n < 5; ++n) device.note_on(n, kC3 * std::pow(2.0f, n * 5 / 12.0f), 0.8f);
      Stereo out = render(device, 0.3f, kRate, block);
      device.note_on(9, kC3, 1.0f);
      device.note_off(2);
      out = concat(out, render(device, 0.3f, kRate, block));
      return out;
    };
    const Stereo usual = play(128), odd = play(37), single = play(1);
    const double worst = std::max(peak(minus(usual.left, odd.left)), peak(minus(usual.left, single.left)));
    std::printf("block size: 128 against 37 and 1 differ by at most %.2g\n", worst);
    EXPECT(usual.size() == odd.size() && usual.size() == single.size() && worst < 1.0e-6, "the block size does not change the sound");
  }

  // What is changed in silence is there for the next note from its first
  // sample: another type's soundboard and pick, another volume.
  {
    fresh(device, kKoto);
    device.set_param(p::kVolume, 0.0f);
    device.set_param(p::kBody, 0.9f);
    device.note_on(1, kC4, 0.8f);
    const Stereo wanted = render(device, 0.3f, kRate);

    fresh(device, kHarp);
    device.set_param(p::kDamp, 1.0f);
    device.note_on(1, kC3, 0.8f);
    render(device, 0.1f, kRate);
    device.note_off(1);
    const Stereo rest = render(device, 3.0f, kRate);
    EXPECT(peak(rest.left, at(2.5), at(3.0)) == 0.0, "the device is asleep before the controls are moved");
    device.set_param(p::kStrings, static_cast<float>(kKoto));
    device.set_param(p::kVolume, 0.0f);
    device.set_param(p::kBody, 0.9f);
    device.set_param(p::kDamp, 0.0f);
    render(device, 0.1f, kRate);
    device.note_on(1, kC4, 0.8f);
    const Stereo got = render(device, 0.3f, kRate);
    const double apart = db(peak(minus(got.left, wanted.left))) - db(peak(wanted.left));
    std::printf("controls moved in silence: the next note is %.0f dB from the same note on a device set up that way\n", apart);
    EXPECT(apart < -100.0, "a type, Body and Volume changed in silence are in place for the next note's first sample");
  }

  // A key let go before its turn in a sweep still sounds, and Damp mutes it
  // from the pluck on.
  {
    auto play = [](float damp) {
      fresh(device, kHarp);
      device.set_param(p::kSweep, 0.4f);
      device.set_param(p::kDamp, damp);
      device.note_on(1, kC3, 0.8f);
      device.note_on(2, kC4, 0.8f);
      device.note_off(1);
      device.note_off(2);
      return render(device, 1.2f, kRate).left;
    };
    const std::vector<float> rings = play(0.0f), muted = play(1.0f);
    // Both keys are up before anything sounds, so both plucks are muted ones:
    // the second arrives at its time in the sweep, about as loud as the first.
    const double first = peak(muted, 0, at(0.02)), second = peak(muted, at(0.4), at(0.42));
    const double before = peak(muted, at(0.3), at(0.395));
    const double later = db(bin_level(muted, kRate, kC4, at(0.7), 4800)) - db(bin_level(rings, kRate, kC4, at(0.7), 4800));
    std::printf("a key let go before its pluck in a sweep: with Damp full the swept pluck peaks at %.2f of the first, after %.0f dB of silence, and is %.0f dB under the undamped note 300 ms on\n",
                second / first, db(before / first), later);
    EXPECT(second > 0.3 * first && before < 1.0e-4 * first, "the swept note still sounds, at its time, though its key is already up");
    EXPECT(later < -40.0, "and Damp mutes it from the pluck on");
  }

  // Cost: eight strings ringing, and all of them with the halo full.
  fresh(device, kHarp);
  device.set_param(p::kHalo, 0.5f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("harp (8 strings)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  fresh(device, kGuzheng);
  device.set_param(p::kHalo, 1.0f);
  device.set_param(p::kDecay, 4.0f);
  device.set_param(p::kBend, 100.0f);
  for (int n = 0; n < Harp::kMaxStrings; ++n) device.note_on(n, kC2 * std::pow(2.0f, n / 12.0f), 0.7f);
  report_cost("harp (32 guzheng strings, bends, full halo)", 5.0f, kRate, [&] { render(device, 5.0f, kRate); });

  return finish("harp");
}
