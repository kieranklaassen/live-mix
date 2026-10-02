// Native harness for Handpan (cpp/devices/handpan). The conformance pass
// covers silence, determinism, voice stealing under a pile of notes,
// parameter abuse and other sample rates; the rest measures what makes it a
// handpan: partials at 1 : 2 : 3 that drift a few cents, a soft tap, the
// strike point, the bloom after a hard hit, the air cavity under every tap,
// notes that ring each other through the shell, hand damping, and the
// tongue drum's plainer tone. Nobody has listened to it: every claim here
// is a number.

#include "../devices/handpan/handpan.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Handpan;
namespace p = livemix::handpan;

static Handpan device;

static const float kRate = 48000.0f;
static const double kD3 = 146.8324, kA3 = 220.0, kD4 = 293.6648, kE4 = 329.6276, kA4 = 440.0;

// One bare note: perfect overtones, no cavity, no shell, and far enough
// under the soft clip that it stays a wire.
static void plain(Handpan& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kShimmer, 0.0f);
  d.set_param(p::kCavity, 0.0f);
  d.set_param(p::kSympathy, 0.0f);
  d.set_param(p::kVolume, -6.0f);
}

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

// Level over a window given in seconds.
static double level_at(const std::vector<float>& x, double rate, double hz, double t0, double seconds) {
  return bin_level(x, rate, hz, static_cast<size_t>(t0 * rate), static_cast<size_t>(seconds * rate));
}

// The frequency of the strongest component within `reach` (a share) of
// `guess`, to a small fraction of a cent: scan, then narrow the span as the
// window grows.
static double fine_pitch(const std::vector<float>& x, double rate, double guess, size_t from, size_t to,
                         double reach = 0.01) {
  to = std::min(to, x.size());
  const size_t total = to - from;
  double f = guess, span = guess * reach;
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
static double ring_time(const std::vector<float>& x, double rate, double hz, double t0, double t1, double window) {
  const double a = level_at(x, rate, hz, t0, window);
  const double b = level_at(x, rate, hz, t1, window);
  return b < a ? 60.0 * (t1 - t0) / (db(a) - db(b)) : 1.0e9;
}

// Share of the energy above `hz` in [from, to), through a fourth-order
// Butterworth high-pass (the test kit's one-pole split leaks a low
// fundamental at -26 dB, which is the size of what is being measured).
static double share_above(const std::vector<float>& x, double rate, double hz, size_t from, size_t to) {
  to = std::min(to, x.size());
  const double w = 2.0 * kPi * hz / rate, cw = std::cos(w), sw = std::sin(w);
  std::vector<double> y(x.begin() + static_cast<long>(from), x.begin() + static_cast<long>(to));
  double total = 0.0;
  for (double v : y) total += v * v;
  for (double q : {0.54119610, 1.30656296}) {
    const double alpha = sw / (2.0 * q), a0 = 1.0 + alpha;
    const double b0 = (1.0 + cw) / (2.0 * a0), b1 = -(1.0 + cw) / a0, a1 = -2.0 * cw / a0, a2 = (1.0 - alpha) / a0;
    double x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0;
    for (double& v : y) {
      const double out = b0 * v + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = v;
      y2 = y1;
      y1 = out;
      v = out;
    }
  }
  double high = 0.0;
  for (double v : y) high += v * v;
  return total > 0.0 ? high / total : 0.0;
}

// The amplitude of the `hz` component sample by sample: multiply by a
// phasor at -hz and average over exactly one period (which also removes the
// partials at whole multiples of it). Smears an edge by one period.
static std::vector<double> envelope(const std::vector<float>& x, double rate, double hz, size_t to) {
  to = std::min(to, x.size());
  const size_t box = static_cast<size_t>(rate / hz + 0.5);
  std::vector<double> re(to + 1, 0.0), im(to + 1, 0.0), out(to, 0.0);
  for (size_t i = 0; i < to; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    re[i + 1] = re[i] + x[i] * std::cos(phase);
    im[i + 1] = im[i] - x[i] * std::sin(phase);
  }
  for (size_t i = 0; i < to; ++i) {
    const size_t lo = i + 1 >= box ? i + 1 - box : 0;
    out[i] = 2.0 * std::hypot(re[i + 1] - re[lo], im[i + 1] - im[lo]) / static_cast<double>(box);
  }
  return out;
}

// 10 to 90 % rise of an envelope toward its highest point, in seconds.
static double rise_time(const std::vector<double>& env, double rate) {
  const double top = *std::max_element(env.begin(), env.end());
  size_t t10 = 0, t90 = 0;
  while (t10 < env.size() && env[t10] < 0.1 * top) ++t10;
  while (t90 < env.size() && env[t90] < 0.9 * top) ++t90;
  return static_cast<double>(t90 - t10) / rate;
}

int main() {
  Conformance spec;
  spec.name = "handpan";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // A note rings on after release: 3.5 s to -60 dB at the defaults, retired
  // at -120 dB, so a loud pile needs a little over twice that.
  spec.tail_seconds = 9.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  char label[220];

  // Pitch: the fundamental is the played frequency from C2 to C6 at three
  // sample rates, with the shell coupling at its default and at full (a
  // mode's own share of the bus is taken out of its turn).
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (double hz : {65.4064, 130.8128, 440.0, 1046.5023}) {
        for (float sympathy : {0.5f, 1.0f}) {
          device.init(rate);
          device.set_param(p::kDecay, 10.0f);
          device.set_param(p::kSympathy, sympathy);
          device.note_on(1, static_cast<float>(hz), 0.8f);
          Stereo out = render(device, 3.0f, rate);
          const std::vector<float> m = mid(out);
          const double found = fine_pitch(m, rate, hz, static_cast<size_t>(0.1 * rate), m.size());
          worst = std::max(worst, std::fabs(cents(found, hz)));
        }
      }
    }
    std::printf("fundamental, C2 to C6 at 44.1, 48 and 96 kHz: worst %.3f cents\n", worst);
    EXPECT(worst < 1.0, "the fundamental is within a cent at every pitch and rate (the bar is 3)");

    // Without the correction a mode on the bus would sit sharp by its share
    // of it: 1.2 rad/s is 0.19 Hz, 5 cents at C2. Sympathy must not retune.
    double at[2];
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.set_param(p::kDecay, 10.0f);
      device.set_param(p::kSympathy, which == 0 ? 0.0f : 1.0f);
      device.note_on(1, 65.4064f, 0.8f);
      const std::vector<float> m = mid(render(device, 4.0f, kRate));
      at[which] = fine_pitch(m, kRate, 65.4064, 4800, m.size());
    }
    const double moved = std::fabs(cents(at[1], at[0]));
    std::printf("C2 with Sympathy 0 and 1: %.3f cents apart\n", moved);
    EXPECT(moved < 0.3, "turning Sympathy does not move the pitch");
  }

  // The identity: three partials at 1 : 2 : 3. With Shimmer 0 they are
  // exact; with Shimmer 1 each is a few cents off, differently per key.
  {
    plain(device);
    device.set_param(p::kPosition, 0.6f);
    device.set_param(p::kDecay, 10.0f);
    device.note_on(1, static_cast<float>(kD3), 0.7f);
    std::vector<float> m = mid(render(device, 4.0f, kRate));
    const double f1 = fine_pitch(m, kRate, kD3, 4800, m.size());
    const double f2 = fine_pitch(m, kRate, 2.0 * kD3, 4800, m.size());
    const double f3 = fine_pitch(m, kRate, 3.0 * kD3, 4800, m.size());
    std::printf("D3, Shimmer 0: partials at 1 : %.5f : %.5f (%.2f and %.2f cents from 2 and 3)\n", f2 / f1, f3 / f1,
                cents(f2, 2.0 * f1), cents(f3, 3.0 * f1));
    EXPECT(std::fabs(cents(f2, 2.0 * f1)) < 1.0 && std::fabs(cents(f3, 3.0 * f1)) < 1.0,
           "Shimmer 0: octave and twelfth within a cent of 2 and 3");
    // The three strongest things in the note are these three.
    const double l1 = level_at(m, kRate, f1, 0.1, 0.5), l2 = level_at(m, kRate, f2, 0.1, 0.5),
                 l3 = level_at(m, kRate, f3, 0.1, 0.5);
    double stray = 0.0;
    for (double ratio = 1.25; ratio < 12.0; ratio += 0.0625) {
      if (std::fabs(ratio - 2.0) < 0.2 || std::fabs(ratio - 3.0) < 0.2) continue;
      stray = std::max(stray, level_at(m, kRate, kD3 * ratio, 0.1, 0.5));
    }
    std::printf("D3: fundamental %.1f dB, octave %.1f dB, twelfth %.1f dB, loudest other component %.1f dB\n", db(l1),
                db(l2), db(l3), db(stray));
    EXPECT(stray < 0.1 * std::min(l1, std::min(l2, l3)), "nothing else in the note comes within 20 dB of the three");

    double lo = 1.0e9, hi = 0.0, least = 1.0e9, most = -1.0e9;
    int sharp = 0, flat = 0;
    for (int key = 50; key < 62; ++key) {
      const double hz = 440.0 * std::pow(2.0, (key - 69) / 12.0);
      plain(device);
      device.set_param(p::kShimmer, 1.0f);
      device.set_param(p::kPosition, 0.6f);
      device.set_param(p::kDecay, 10.0f);
      device.note_on(1, static_cast<float>(hz), 0.7f);
      m = mid(render(device, 4.0f, kRate));
      const double g1 = fine_pitch(m, kRate, hz, 4800, m.size());
      const double c2 = cents(fine_pitch(m, kRate, 2.0 * hz, 4800, m.size()), 2.0 * g1);
      const double c3 = cents(fine_pitch(m, kRate, 3.0 * hz, 4800, m.size()), 3.0 * g1);
      for (double c : {c2, c3}) {
        lo = std::min(lo, std::fabs(c));
        hi = std::max(hi, std::fabs(c));
        least = std::min(least, c);
        most = std::max(most, c);
        (c > 0.0 ? sharp : flat) += 1;
      }
    }
    std::printf("Shimmer 1, D3 to C#4: overtones %.2f to %.2f cents off (%.2f to %+.2f), %d sharp and %d flat\n", lo, hi,
                least, most, sharp, flat);
    EXPECT(hi < 10.0, "Shimmer 1: every overtone within 10 cents of perfect");
    EXPECT(lo > 0.4, "and none of them left perfect");
    EXPECT(sharp >= 3 && flat >= 3, "the lean belongs to the key: some sharp, some flat");
  }

  // Shimmer is heard as a slow turn: with the overtones a few cents off,
  // the three slide in phase and the shape of the wave changes, which shows
  // as the crest factor (peak over RMS, so the decay divides out) rising
  // and falling. With Shimmer 0 the shape stands still.
  {
    double swing[2], period = 0.0;
    for (int which = 0; which < 2; ++which) {
      plain(device);
      device.set_param(p::kShimmer, which == 0 ? 0.0f : 1.0f);
      device.set_param(p::kPosition, 0.7f);
      device.set_param(p::kDecay, 10.0f);
      device.note_on(1, static_cast<float>(kD3), 0.7f);
      const std::vector<float> m = mid(render(device, 8.5f, kRate));
      const size_t window = static_cast<size_t>(10.0 * kRate / kD3);  // ten periods
      std::vector<double> crest;
      for (size_t from = 9600; from + window <= m.size(); from += window) {
        crest.push_back(peak(m, from, from + window) / rms(m, from, from + window));
      }
      // Take out the slow drift the unequal decays give (each value less the
      // mean of the 1.5 s around it), then count the turns.
      const int reach = 11;
      double lo = 1.0e9, hi = -1.0e9, previous = 0.0;
      int crossings = 0, counted = 0;
      for (int i = reach; i + reach < static_cast<int>(crest.size()); ++i) {
        double around = 0.0;
        for (int j = i - reach; j <= i + reach; ++j) around += crest[static_cast<size_t>(j)];
        const double v = crest[static_cast<size_t>(i)] - around / (2 * reach + 1);
        lo = std::min(lo, v);
        hi = std::max(hi, v);
        if (counted > 0 && (v > 0.0) != (previous > 0.0)) ++crossings;
        previous = v;
        ++counted;
      }
      const double n = static_cast<double>(counted);
      swing[which] = hi - lo;
      if (which == 1 && crossings > 0) period = 2.0 * n * static_cast<double>(window) / kRate / crossings;
    }
    std::printf("crest factor of a ringing D3: swings %.3f with Shimmer 0, %.3f with Shimmer 1, turning every %.2f s\n",
                swing[0], swing[1], period);
    EXPECT(swing[0] < 0.03, "Shimmer 0: the wave keeps its shape");
    EXPECT(swing[1] > 0.15 && swing[1] > 6.0 * swing[0], "Shimmer 1: the shape of the wave turns");
    EXPECT(period > 0.2 && period < 5.0, "and it turns slowly: a period between 0.2 and 5 s");
  }

  // Position: the centre is nearly the fundamental alone, the edge brings
  // the octave and the twelfth up to it, and the two climb differently.
  {
    double octave[11], twelfth[11];
    for (int step = 0; step <= 10; ++step) {
      plain(device);
      device.set_param(p::kPosition, step / 10.0f);
      device.note_on(1, static_cast<float>(kD3), 0.7f);
      const std::vector<float> m = mid(render(device, 0.5f, kRate));
      const double l1 = level_at(m, kRate, kD3, 0.05, 0.25);
      octave[step] = db(level_at(m, kRate, 2.0 * kD3, 0.05, 0.25) / l1);
      twelfth[step] = db(level_at(m, kRate, 3.0 * kD3, 0.05, 0.25) / l1);
    }
    double apart = 0.0;
    bool rising = true;
    for (int step = 0; step <= 10; ++step) {
      apart = std::max(apart, std::fabs(octave[step] - twelfth[step]));
      if (step > 0) rising = rising && octave[step] > octave[step - 1] && twelfth[step] > twelfth[step - 1];
    }
    std::printf("octave and twelfth re the fundamental: centre %.1f and %.1f dB, halfway %.1f and %.1f dB, edge %.1f and %.1f dB; "
                "furthest apart %.1f dB\n",
                octave[0], twelfth[0], octave[5], twelfth[5], octave[10], twelfth[10], apart);
    EXPECT(octave[0] < -12.0 && twelfth[0] < -12.0, "centre: octave and twelfth at least 12 dB under the fundamental");
    EXPECT(std::fabs(octave[10]) < 6.0 && std::fabs(twelfth[10]) < 6.0, "edge: both within 6 dB of the fundamental");
    EXPECT(rising, "both rise all the way from the centre to the edge");
    EXPECT(apart > 2.0, "and not together: they differ by more than 2 dB somewhere along the knob");
  }

  // The tap is a hand. Soft: almost nothing above 3 kHz in the first 30 ms
  // and a rise of a few milliseconds. Hard: faster and brighter.
  {
    double share[2][2], rise[2], bright[2];
    for (int which = 0; which < 2; ++which) {
      const double notes[2] = {kD3, kA4};
      for (int n = 0; n < 2; ++n) {
        device.init(kRate);  // the default patch, cavity and tick and all
        device.set_param(p::kTouch, which == 0 ? 0.0f : 1.0f);
        device.note_on(1, static_cast<float>(notes[n]), 0.7f);
        const std::vector<float> m = mid(render(device, 0.25f, kRate));
        share[which][n] = db(std::sqrt(share_above(m, kRate, 3000.0, 0, 1440)));
        if (n == 0) bright[which] = db(std::sqrt(share_above(m, kRate, 500.0, 0, 4800)));
      }
      plain(device);
      device.set_param(p::kTouch, which == 0 ? 0.0f : 1.0f);
      device.set_param(p::kPosition, 0.0f);
      device.note_on(1, 2.0f * static_cast<float>(kA4), 0.7f);  // A5: the measurement smears by one period
      const std::vector<float> m = mid(render(device, 0.1f, kRate));
      rise[which] = rise_time(envelope(m, kRate, 2.0 * kA4, 1440), kRate);
    }
    std::printf("soft touch: %.1f dB (D3) and %.1f dB (A4) above 3 kHz in the first 30 ms, rise %.2f ms; "
                "hard touch: %.1f and %.1f dB, rise %.2f ms\n",
                share[0][0], share[0][1], 1000.0 * rise[0], share[1][0], share[1][1], 1000.0 * rise[1]);
    std::printf("D3 above 500 Hz (past its three tuned partials) in the first 100 ms: soft %.1f dB, hard %.1f dB\n", bright[0], bright[1]);
    EXPECT(share[0][0] < -30.0 && share[0][1] < -30.0, "soft touch: energy above 3 kHz at least 30 dB under the total");
    EXPECT(rise[0] > 0.001 && rise[0] < 0.008, "soft touch: the note rises in 1 to 8 ms");
    EXPECT(rise[1] < 0.75 * rise[0], "a hard touch rises faster");
    EXPECT(bright[1] > bright[0] + 10.0, "and is brighter by 10 dB or more above the tuned partials");
    EXPECT(share[1][0] > share[0][0] + 10.0, "the skin of a harder hand is heard: 10 dB more above 3 kHz under a D3");
    EXPECT(share[1][0] < -20.0, "even a knuckle is no mallet: 20 dB under the total above 3 kHz");
  }

  // Bloom: after a hard, loud hit the octave keeps rising for tens of
  // milliseconds (fed by the fundamental's square); a quiet tap's does not.
  {
    double grew[2];
    const float velocity[2] = {1.0f, 0.15f};
    for (int which = 0; which < 2; ++which) {
      plain(device);
      device.set_param(p::kTouch, 1.0f);
      device.set_param(p::kPosition, 0.0f);
      device.set_param(p::kDecay, 10.0f);
      device.set_param(p::kVolume, -12.0f);
      device.note_on(1, static_cast<float>(kA4), velocity[which]);
      const std::vector<float> m = mid(render(device, 0.2f, kRate));
      const double early = level_at(m, kRate, 2.0 * kA4, 0.002, 0.010);
      const double late = level_at(m, kRate, 2.0 * kA4, 0.060, 0.010);
      grew[which] = db(late / early);
    }
    std::printf("octave of A4, 60 ms after the tap against 7 ms after: %+.1f dB struck hard, %+.1f dB tapped quietly\n",
                grew[0], grew[1]);
    EXPECT(grew[0] > 2.0, "a hard strike brightens after the hit: the octave rises 2 dB or more");
    EXPECT(grew[1] < 1.0, "a quiet tap does not bloom");
    EXPECT(grew[0] > grew[1] + 2.0, "the bloom grows with velocity");
  }

  // The bloom cannot run away. An A4 struck every 125 ms lands on the same
  // phase each time (55 periods), so the fundamental piles up far past one
  // tap; the bloom is the tap's doing and stops growing where the hardest
  // single tap leaves it, so the overtones keep their place under the note.
  {
    double octave[2], twelfth[2];
    for (int which = 0; which < 2; ++which) {
      plain(device);
      device.set_param(p::kTouch, 1.0f);
      device.set_param(p::kPosition, 0.0f);
      device.set_param(p::kDecay, 10.0f);
      device.set_param(p::kVolume, -40.0f);
      const int strikes = which == 0 ? 1 : 30;
      for (int n = 0; n < strikes; ++n) {
        device.note_on(1, static_cast<float>(kA4), 1.0f);
        if (n + 1 < strikes) render(device, 0.125f, kRate);
      }
      const std::vector<float> m = mid(render(device, 0.3f, kRate));
      const double l1 = level_at(m, kRate, kA4, 0.15, 0.1);
      octave[which] = db(level_at(m, kRate, 2.0 * kA4, 0.15, 0.1) / l1);
      twelfth[which] = db(level_at(m, kRate, 3.0 * kA4, 0.15, 0.1) / l1);
    }
    std::printf("A4 struck hard: octave %.1f dB and twelfth %.1f dB re the fundamental; after thirty strikes in phase: "
                "%.1f and %.1f dB\n",
                octave[0], twelfth[0], octave[1], twelfth[1]);
    EXPECT(octave[1] < octave[0] + 3.0 && twelfth[1] < twelfth[0] + 3.0,
           "struck again and again in phase, the overtones do not outgrow the note");
  }

  // Decay is the fundamental's ring time; the octave rings no longer and
  // the twelfth shorter still.
  {
    for (float seconds : {1.0f, 6.0f}) {
      plain(device);
      device.set_param(p::kDecay, seconds);
      device.set_param(p::kPosition, 0.6f);
      device.note_on(1, static_cast<float>(kD3), 0.7f);
      const std::vector<float> m = mid(render(device, 0.3f + 0.6f * seconds, kRate));
      const double t1 = 0.1 + 0.4 * seconds;
      const double fundamental = ring_time(m, kRate, kD3, 0.1, t1, 0.1);
      const double octave = ring_time(m, kRate, 2.0 * kD3, 0.1, t1, 0.1);
      const double twelfth = ring_time(m, kRate, 3.0 * kD3, 0.1, t1, 0.1);
      std::snprintf(label, sizeof label, "Decay %.0f s: fundamental rings %.2f s, octave %.2f s, twelfth %.2f s", seconds,
                    fundamental, octave, twelfth);
      std::printf("%s\n", label);
      EXPECT(std::fabs(fundamental / seconds - 1.0) < 0.05, "the fundamental rings for Decay, within 5 % (the bar is 15)");
      EXPECT(octave < fundamental && twelfth < octave, "octave shorter than the fundamental, twelfth shorter than the octave");
      EXPECT(std::fabs(octave / seconds - 0.8) < 0.05 && std::fabs(twelfth / seconds - 0.6) < 0.05,
             "by the stated shares, 0.8 and 0.6");
    }
  }

  // The cavity: a low thump under every tap, near 80 Hz, as loud as the
  // knob and the tap, and gone in a fraction of a second.
  {
    double level[3], soft = 0.0, late = 0.0, where = 0.0;
    const float knob[3] = {0.0f, 0.5f, 1.0f};
    for (int which = 0; which < 4; ++which) {
      plain(device);
      device.set_param(p::kCavity, which < 3 ? knob[which] : 1.0f);
      device.note_on(1, static_cast<float>(kA4), which < 3 ? 0.9f : 0.3f);
      const std::vector<float> m = mid(render(device, 1.0f, kRate));
      const double here = level_at(m, kRate, 80.0, 0.0, 0.1);
      if (which < 3) {
        level[which] = here;
      } else {
        soft = here;
      }
      if (which == 2) {
        where = dominant_frequency(m, kRate, 40.0, 200.0, 0, 9600);
        late = level_at(m, kRate, 80.0, 0.7, 0.1);
      }
    }
    std::printf("cavity under an A4: %.1f Hz; %.1f dB at Cavity 0, %.1f dB at 0.5, %.1f dB at 1; a soft tap %.1f dB; "
                "after 0.7 s %.1f dB\n",
                where, db(level[0]), db(level[1]), db(level[2]), db(soft), db(late));
    EXPECT(where > 70.0 && where < 90.0, "the thump is a peak between 70 and 90 Hz");
    EXPECT(level[0] < 0.01 * level[2], "Cavity 0 has none of it (40 dB down)");
    EXPECT(level[1] > 100.0 * level[0] && level[2] > 1.8 * level[1] && level[2] < 2.2 * level[1], "the thump follows the knob: twice the knob, twice the thump");
    EXPECT(soft < 0.5 * level[2], "and how hard the tap is");
    EXPECT(late < 0.01 * level[2], "it is gone, 40 dB down, within 0.8 s");
  }

  // The shell. D3 rings; a second note is tapped, held half a second and
  // then muted with the hand (Damp 1) while D3 is still held. What is left
  // at D4's pitch is what D3's octave mode carries. A tap on D4 sets it
  // going; a tap on E4 does not; with Sympathy 0 neither does.
  {
    auto carried = [&](float sympathy, float shimmer, double second) {
      device.init(kRate);
      device.set_param(p::kShimmer, shimmer);
      device.set_param(p::kCavity, 0.0f);
      device.set_param(p::kSympathy, sympathy);
      device.set_param(p::kDamp, 1.0f);
      device.set_param(p::kDecay, 6.0f);
      device.set_param(p::kVolume, -12.0f);
      device.note_on(1, static_cast<float>(kD3), 0.8f);
      render(device, 1.0f, kRate);
      if (second > 0.0) device.note_on(2, static_cast<float>(second), 0.8f);
      render(device, 0.5f, kRate);
      device.note_off(2);
      render(device, 0.5f, kRate);  // the second note is 160 dB down by now
      const std::vector<float> m = mid(render(device, 0.4f, kRate));
      // With shimmer the octave mode is a few cents off: take the strongest thing near D4.
      const double hz = shimmer > 0.0f ? fine_pitch(m, kRate, kD4, 0, m.size(), 0.006) : kD4;
      return bin_level(m, kRate, hz, 0, m.size());
    };
    const double alone = carried(0.0f, 0.0f, 0.0);
    const double off_d4 = carried(0.0f, 0.0f, kD4), off_e4 = carried(0.0f, 0.0f, kE4);
    const double on_d4 = carried(1.0f, 0.0f, kD4), on_e4 = carried(1.0f, 0.0f, kE4);
    const double on_alone = carried(1.0f, 0.0f, 0.0);
    const double half_d4 = carried(0.5f, 0.0f, kD4);
    const double lean_alone = carried(0.0f, 0.4f, 0.0), lean_d4 = carried(0.5f, 0.4f, kD4);
    std::printf("what D3 carries at D4 after a second note has come and gone, re D3 alone: "
                "Sympathy 0: D4 %+.2f dB, E4 %+.2f dB; Sympathy 1: D4 %+.1f dB, E4 %+.2f dB; Sympathy 0.5: D4 %+.1f dB\n",
                db(off_d4 / alone), db(off_e4 / alone), db(on_d4 / on_alone), db(on_e4 / on_alone), db(half_d4 / alone));
    std::printf("the same at the default Shimmer and Sympathy: D4 %+.1f dB\n", db(lean_d4 / lean_alone));
    EXPECT(std::fabs(db(off_d4 / alone)) < 0.2 && std::fabs(db(off_e4 / alone)) < 0.2, "Sympathy 0: other notes leave D3 as it was");
    EXPECT(db(on_d4 / on_alone) > 3.0, "Sympathy 1: a tap on D4 raises D3's octave by 3 dB or more");
    EXPECT(std::fabs(db(on_e4 / on_alone)) < 1.0, "a tap on E4 does not: under 1 dB");
    EXPECT(half_d4 > 1.2 * alone && half_d4 < on_d4, "the knob sets how much");
    EXPECT(db(lean_d4 / lean_alone) > 3.0, "a few cents apart, the octave still answers");
    EXPECT(std::fabs(db(on_alone / alone)) < 0.2, "and a note on its own is the same note at any Sympathy");
  }

  // The shell gives nothing away for free: a held chord full of shared
  // partials only ever loses energy at Sympathy 1, and rings as long as it
  // does at Sympathy 0.
  {
    double total[2];
    bool falling = true;
    for (int which = 0; which < 2; ++which) {
      plain(device);
      device.set_param(p::kSympathy, which == 0 ? 0.0f : 1.0f);
      device.set_param(p::kShimmer, 0.4f);
      device.set_param(p::kDecay, 10.0f);
      device.set_param(p::kVolume, -18.0f);
      const double chord[6] = {kD3, kA3, kD4, kA4, 2.0 * kD4, 3.0 * kD3};
      for (int n = 0; n < 6; ++n) device.note_on(n, static_cast<float>(chord[n]), 0.8f);
      const Stereo out = render(device, 6.0f, kRate);
      double before = 1.0e9;
      total[which] = 0.0;
      for (size_t from = 24000; from + 24000 <= out.size(); from += 24000) {
        const double l = rms(out.left, from, from + 24000), r = rms(out.right, from, from + 24000);
        const double power = l * l + r * r;
        if (which == 1) falling = falling && power < before;
        before = power;
        total[which] += power;
      }
    }
    std::printf("a six-note chord of shared partials: %+.2f dB of energy over 6 s with Sympathy 1 against 0\n",
                0.5 * db(total[1] / total[0]));
    EXPECT(falling, "Sympathy 1: the chord's energy falls in every half second");
    EXPECT(std::fabs(0.5 * db(total[1] / total[0])) < 1.0, "the shell moves energy between notes, it does not add or remove it");
  }

  // Tongue drum: a near-sine with a weak octave and the faint inharmonic
  // ping of a clamped tongue's second mode at 6.27 times the note.
  {
    plain(device);
    device.set_param(p::kType, 1.0f);
    device.set_param(p::kTouch, 0.6f);
    device.note_on(1, static_cast<float>(kD3), 0.7f);
    const std::vector<float> m = mid(render(device, 0.6f, kRate));
    const double l1 = level_at(m, kRate, kD3, 0.02, 0.2);
    const double octave = db(level_at(m, kRate, 2.0 * kD3, 0.02, 0.2) / l1);
    const double twelfth = db(level_at(m, kRate, 3.0 * kD3, 0.02, 0.2) / l1);
    const double ping_hz = fine_pitch(m, kRate, 6.27 * kD3, 960, 9600, 0.03);
    const double ping = db(level_at(m, kRate, ping_hz, 0.02, 0.2) / l1);
    const double beside = db(std::max(level_at(m, kRate, ping_hz * 1.08, 0.02, 0.2), level_at(m, kRate, ping_hz / 1.08, 0.02, 0.2)) / l1);
    std::printf("tongue drum D3: octave %.1f dB, twelfth %.1f dB, ping at %.3f x the note %.1f dB (%.1f dB beside it)\n",
                octave, twelfth, ping_hz / kD3, ping, beside);
    EXPECT(octave < -15.0 && octave > -40.0, "the octave is there, at least 15 dB down");
    EXPECT(twelfth < -50.0, "there is no twelfth");
    EXPECT(std::fabs(ping_hz / kD3 - 6.27) < 0.02, "the ping sits at 6.27 times the note");
    EXPECT(ping < -20.0 && ping > beside + 20.0, "at least 20 dB down, and a partial, not noise");
  }

  // A handpan has no damper: letting go changes nothing at Damp 0. With
  // Damp 1 the hand mutes the note, 40 dB in 150 ms, without a click.
  {
    Stereo held, let_go;
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.note_on(1, static_cast<float>(kD3), 0.8f);
      Stereo out = render(device, 0.3f, kRate);
      if (which == 1) device.note_off(1);
      out = concat(out, render(device, 0.7f, kRate));
      (which == 0 ? held : let_go) = out;
    }
    EXPECT(held.left == let_go.left && held.right == let_go.right, "Damp 0: a released note is the same samples as a held one");

    device.init(kRate);
    device.set_param(p::kDamp, 1.0f);
    device.note_on(1, static_cast<float>(kD3), 0.8f);
    const Stereo ringing = render(device, 0.3f, kRate);
    device.note_off(1);
    const Stereo muted = render(device, 0.3f, kRate);
    const double before = rms(ringing.left, 12000, 14400);
    const double after = rms(muted.left, 7200, 8160);  // 150 to 170 ms after the release
    std::printf("Damp 1: %.1f dB, 150 ms after the key is let go; largest step %.5f against %.5f while it rang\n",
                db(after / before), max_step(muted.left), max_step(ringing.left, 4800));
    EXPECT(after < 0.01 * before, "Damp 1: 40 dB down within 150 ms of the release");
    EXPECT(max_step(muted.left) < 1.05 * max_step(ringing.left, 4800), "muting is a faster decay, not a cut");

    device.init(kRate);
    device.set_param(p::kDamp, 0.5f);
    device.note_on(1, static_cast<float>(kD3), 0.8f);
    render(device, 0.3f, kRate);
    device.note_off(1);
    const std::vector<float> m = mid(render(device, 1.5f, kRate));
    const double half = ring_time(m, kRate, kD3, 0.1, 0.5, 0.1);
    std::printf("Damp 0.5 on a 3.5 s note: rings %.2f s after release\n", half);
    EXPECT(half > 0.5 && half < 1.2, "halfway, the ring is between the hand's 0.18 s and the note's own 3.5 s");
  }

  // Nothing folds back. At 44.1 kHz a 6 kHz note keeps 6, 12 and 18 kHz and
  // drops its shell modes (25.2 and 33.6 kHz would land on 18.9 and
  // 10.5 kHz); at 7.5 kHz the twelfth goes too, and with it the cube that
  // blooms it (22.5 kHz would land on 21.6 kHz).
  {
    double worst = -200.0;
    const double notes[2] = {6000.0, 7500.0};
    const double folds[2][3] = {{18900.0, 10500.0, 0.0}, {21600.0, 12600.0, 2100.0}};
    for (int which = 0; which < 2; ++which) {
      plain(device, 44100.0f);
      device.set_param(p::kTouch, 1.0f);
      device.set_param(p::kPosition, 1.0f);
      device.set_param(p::kVolume, -12.0f);
      device.note_on(1, static_cast<float>(notes[which]), 1.0f);
      const std::vector<float> m = mid(render(device, 0.5f, 44100.0f));
      const double l1 = bin_level(m, 44100.0, notes[which], 2205, 8820);
      for (double hz : folds[which]) {
        if (hz > 0.0) worst = std::max(worst, db(bin_level(m, 44100.0, hz, 2205, 8820) / l1));
      }
      // Everything that rings is one of the kept modes.
      double kept = 0.0;
      for (int k = 1; k <= 3; ++k) {
        if (notes[which] * k < 0.45 * 44100.0) {
          const double level = bin_level(m, 44100.0, notes[which] * k, 2205, 8820);
          kept += level * level;
        }
      }
      const double all = rms(m, 2205, 11025) * std::sqrt(2.0);
      std::snprintf(label, sizeof label, "a %.1f kHz note at 44.1 kHz: its kept modes are %.3f of everything that rings",
                    notes[which] / 1000.0, std::sqrt(kept) / all);
      std::printf("%s\n", label);
      EXPECT(std::sqrt(kept) / all > 0.97, "and nothing else rings beside them");
      EXPECT(finite(m) && l1 > 0.01, "a note at the top of the keyboard still sounds");
    }
    std::printf("where the dropped modes would fold to: %.1f dB re the fundamental at worst\n", worst);
    EXPECT(worst < -50.0, "modes above the band are dropped, not aliased: 50 dB down or more");
  }

  // Stereo: notes alternate sides going up, as the note fields do around
  // the shell, and the two sides never cancel.
  {
    double lean[2];
    const double notes[2] = {kD3, kA3};  // MIDI 50 and 57
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.note_on(1, static_cast<float>(notes[which]), 0.8f);
      const Stereo out = render(device, 1.0f, kRate);
      lean[which] = db(rms(out.right, 4800) / rms(out.left, 4800));
    }
    device.init(kRate);
    const double chord[5] = {kD3, kA3, 261.6256, 349.2282, kA4};
    for (int n = 0; n < 5; ++n) device.note_on(n, static_cast<float>(chord[n]), 0.8f);
    const Stereo out = render(device, 3.0f, kRate);
    const double width = db(rms(side(out)) / rms(mid(out)));
    const double together = correlation(out.left, out.right);
    std::printf("an even key leans %+.1f dB to the right, an odd key %+.1f dB; a five-note chord: side %.1f dB re mid, "
                "left/right correlation %.2f\n",
                lean[0], lean[1], width, together);
    EXPECT(lean[0] < -2.0 && lean[1] > 2.0, "neighbouring keys sit on opposite sides");
    EXPECT(width < -6.0, "mono-compatible: the side is 6 dB or more under the mid");
    EXPECT(together > 0.5 && together < 0.99, "left and right agree in sign and still differ");
  }

  // Levels: one note at the default patch across the keyboard, the
  // velocity range, and ten notes under the clip knee region.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    const double seven = db(std::max(peak(out.left), peak(out.right)));
    std::snprintf(label, sizeof label, "one note at gain 0.7 peaks at %.1f dBFS (-24 to -10)", seven);
    std::printf("%s\n", label);
    EXPECT(seven > -24.0 && seven < -10.0, label);

    double lowest = 0.0, highest = -200.0;
    for (int type = 0; type < 2; ++type) {
      for (double hz : {65.4064, 130.8128, kD3, kD4, 587.3295, 1046.5023}) {
        device.init(kRate);
        device.set_param(p::kType, static_cast<float>(type));
        device.note_on(1, static_cast<float>(hz), 0.8f);
        out = render(device, 2.0f, kRate);
        const double level = db(std::max(peak(out.left), peak(out.right)));
        lowest = std::min(lowest, level);
        highest = std::max(highest, level);
      }
    }
    std::snprintf(label, sizeof label, "one note at gain 0.8, C2 to C6, both types: peaks from %.1f to %.1f dBFS (-22 to -16)",
                  lowest, highest);
    std::printf("%s\n", label);
    EXPECT(lowest > -22.0 && highest < -16.0, label);

    double soft = 0.0, loud = 0.0;
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.note_on(1, 220.0f, which == 0 ? 0.2f : 1.0f);
      out = render(device, 1.0f, kRate);
      (which == 0 ? soft : loud) = rms(out.left, 0, 24000);
    }
    std::printf("velocity 0.2 to 1: %.1f dB\n", db(loud / soft));
    EXPECT(db(loud / soft) > 12.0 && db(loud / soft) < 36.0, "velocity gives 12 to 36 dB of range");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    out = render(device, 3.0f, kRate);
    const double ten = std::max(peak(out.left), peak(out.right));
    std::snprintf(label, sizeof label, "ten notes struck together peak at %.2f (under the clip knee region, 0.9)", ten);
    std::printf("%s\n", label);
    EXPECT(ten < 0.9, label);
  }

  // No clicks: a stolen voice, a key struck again while it rings, and the
  // knobs moved under a ringing chord.
  {
    // Stealing: eleven loud low notes and one quiet high one, which is the
    // one a thirteenth note takes. Cut dead, a 3 kHz note leaves a step of
    // up to its whole amplitude; faded over 2 ms it leaves none.
    double own = 0.0, taken = 0.0;
    for (int trial = 0; trial < 8; ++trial) {
      plain(device);
      device.set_param(p::kDecay, 10.0f);
      device.set_param(p::kPosition, 0.0f);
      device.set_param(p::kVolume, -18.0f);
      for (int n = 0; n < 11; ++n) device.note_on(n, 60.0f + 5.0f * n, 1.0f);
      device.note_on(11, 3000.0f, 0.5f);
      Stereo ringing = render(device, 0.3f + trial * 0.00002f, kRate);
      own = std::max(own, max_step(ringing.left, 4800));
      device.note_on(12, 80.0f, 0.2f);
      Stereo out = render(device, 0.02f, kRate);
      Stereo joined = concat(ringing, out);
      taken = std::max(taken, max_step(joined.left, ringing.size() - 2));
      EXPECT(bin_level(out.left, kRate, 3000.0, 480, 480) < 0.01 * bin_level(ringing.left, kRate, 3000.0, 9600, 480),
             "the quietest voice is the one taken");
    }
    std::printf("stealing a 3 kHz note: largest step %.5f, %.5f while it rang\n", taken, own);
    EXPECT(taken < 1.1 * own, "stealing does not click");

    // The same key again: the tap adds to the motion it finds, through the
    // same soft contact as the first.
    double again = 0.0, first = 0.0;
    for (int trial = 0; trial < 8; ++trial) {
      device.init(kRate);
      device.note_on(1, static_cast<float>(kA4), 0.8f);
      const Stereo once = render(device, 0.25f + trial * 0.0003f, kRate);
      first = std::max(first, max_step(once.left));
      device.note_on(1, static_cast<float>(kA4), 0.8f);
      again = std::max(again, max_step(render(device, 0.05f, kRate).left));
    }
    std::printf("striking a ringing A4 again: largest step %.5f, %.5f for the first strike\n", again, first);
    EXPECT(again < 2.2 * first, "a second tap is no louder than two taps and never a jump");

    const int swept[4] = {p::kDecay, p::kShimmer, p::kSympathy, p::kDamp};
    const char* names[4] = {"decay", "shimmer", "sympathy", "damp"};
    for (int which = 0; which < 4; ++which) {
      double step[2];
      for (int pass = 0; pass < 2; ++pass) {
        device.init(kRate);
        device.set_param(p::kDecay, 6.0f);
        for (int n = 0; n < 4; ++n) device.note_on(n, static_cast<float>(kD3) * std::pow(2.0f, n * 7 / 12.0f), 0.8f);
        render(device, 0.3f, kRate);
        device.note_off(0);  // one of them released, so Damp has a note to hold
        device.note_off(2);
        Stereo out;
        const int id = swept[which];
        for (int k = 0; k < 200; ++k) {
          const float t = 0.5f + 0.5f * std::sin(k * 0.21f) + (k % 17 == 0 ? 0.3f : 0.0f) - 0.25f;
          const float value = p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * std::fmin(std::fmax(t, 0.0f), 1.0f);
          if (pass == 1) device.set_param(id, value);
          out = concat(out, render(device, 0.005f, kRate, 64));
        }
        step[pass] = std::max(max_step(out.left), max_step(out.right));
      }
      std::snprintf(label, sizeof label, "sweeping %s under a chord: largest step %.5f (%.5f held)", names[which], step[1],
                    step[0]);
      std::printf("%s\n", label);
      EXPECT(step[1] < 1.2 * step[0], label);
    }
  }

  // The instrument rules where a bus between notes could break them: block
  // size, a pile of notes with everything at its most, and going to sleep.
  {
    Stereo a, b;
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kSympathy, 1.0f);
      device.set_param(p::kDamp, 0.6f);
      device.note_on(1, static_cast<float>(kD3), 0.8f);
      device.note_on(2, static_cast<float>(kD4), 0.5f);
      device.note_on(3, static_cast<float>(kA4), 0.7f);
      if (pass == 0) {
        a = render(device, 0.5f, kRate, 128);
        device.note_off(2);
        a = concat(a, render(device, 0.5f, kRate, 128));
      } else {
        b = render(device, 0.5f, kRate, 1);
        device.note_off(2);
        b = concat(b, render(device, 0.5f, kRate, 2048));
      }
    }
    double worst = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
    }
    std::snprintf(label, sizeof label, "a coupled chord does not depend on the block size (max diff %g)", worst);
    EXPECT(worst < 1.0e-6, label);

    // Sixty notes over twelve voices, loudest and longest, at each rate.
    for (float rate : {44100.0f, 96000.0f}) {
      device.init(rate);
      device.set_param(p::kDecay, 10.0f);
      device.set_param(p::kTouch, 1.0f);
      device.set_param(p::kPosition, 1.0f);
      device.set_param(p::kShimmer, 1.0f);
      device.set_param(p::kCavity, 1.0f);
      device.set_param(p::kSympathy, 1.0f);
      device.set_param(p::kVolume, 6.0f);
      bool bounded = true;
      for (int n = 0; n < 60; ++n) {
        device.note_on(n, 65.4f * std::pow(2.0f, static_cast<float>(n % 37) / 12.0f), 1.0f);
        const Stereo out = render(device, 0.03f, rate);
        bounded = bounded && finite(out.left) && finite(out.right) && peak(out.left) < 1.01 && peak(out.right) < 1.01;
      }
      const Stereo more = render(device, 3.0f, rate);
      bounded = bounded && finite(more.left) && peak(more.left) < 1.01 && peak(more.right) < 1.01;
      std::snprintf(label, sizeof label, "sixty notes with everything at its most stay bounded at %.0f Hz", rate);
      EXPECT(bounded, label);
      device.set_param(p::kDecay, 0.5f);
      render(device, 3.0f, rate);
      const Stereo after = render(device, 0.5f, rate);
      EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "and every voice is freed once they have rung out");
    }

    // A note that has rung out frees its voice and the device sleeps, held or not.
    plain(device);
    device.set_param(p::kDecay, 0.5f);
    device.set_param(p::kCavity, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 1.5f, kRate);
    const Stereo quiet = render(device, 0.5f, kRate);
    EXPECT(peak(quiet.left) == 0.0 && peak(quiet.right) == 0.0, "a held note that has rung out leaves exact silence");
  }

  // Cost with every voice ringing and the bus at full.
  device.init(kRate);
  device.set_param(p::kDecay, 10.0f);
  device.set_param(p::kSympathy, 1.0f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  render(device, 0.5f, kRate);
  report_cost("handpan (12 notes)", 8.0f, kRate, [&] { render(device, 8.0f, kRate); });

  return finish("handpan");
}
