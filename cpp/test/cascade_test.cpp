// Native harness for Cascade (cpp/devices/cascade). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a cascade of loops.

#include "../devices/cascade/cascade.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Cascade;
namespace p = livemix::cascade;

static Cascade device;

static const float kRate = 48000.0f;

// A wet-only device with nothing left to chance: no decay, no reverse, no
// width, tone wide open. Each check then sets what it is about.
static void plain(Cascade& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kDecay, 0.0f);
  d.set_param(p::kHigh, 0.0f);
  d.set_param(p::kLow, 0.0f);
  d.set_param(p::kReverse, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kTone, 18000.0f);
  d.set_param(p::kShape, 1.0f);
}

// `seconds` of signal: a tone of `burst` seconds with 5 ms fades, then silence.
static std::vector<float> tone_burst(float hz, float burst, float seconds, float gain = 0.5f,
                                     float rate = kRate) {
  std::vector<float> x(static_cast<size_t>(seconds * rate), 0.0f);
  const size_t n = static_cast<size_t>(burst * rate);
  const double fade = 0.005 * rate;
  for (size_t i = 0; i < n && i < x.size(); ++i) {
    const double edge = std::min(1.0, std::min(i / fade, (n - 1 - i) / fade));
    x[i] = static_cast<float>(gain * edge * std::sin(2.0 * kPi * hz * i / rate));
  }
  return x;
}

// A plucked note: eight harmonics, the higher ones dying sooner.
static void pluck(std::vector<float>& x, float at, float hz, float gain) {
  const size_t start = static_cast<size_t>(at * kRate);
  for (size_t i = start; i < x.size(); ++i) {
    const double t = (i - start) / static_cast<double>(kRate);
    if (t > 3.0) break;
    double v = 0.0;
    for (int h = 1; h <= 8; ++h) v += std::sin(2.0 * kPi * hz * h * t) / h * std::exp(-t * h / 0.6);
    x[i] += static_cast<float>(gain * 0.6 * std::min(1.0, t / 0.002) * v);
  }
}

// RMS in dB of [from, to) seconds.
static double level_db(const std::vector<float>& x, double from, double to) {
  return db(rms(x, static_cast<size_t>(from * kRate), static_cast<size_t>(to * kRate)));
}

// Rectified and smoothed (3 ms) level, one value per millisecond.
static std::vector<double> envelope(const std::vector<float>& x) {
  std::vector<double> out;
  const double a = std::exp(-1.0 / (0.003 * kRate));
  double level = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    level = std::fabs(x[i]) + (level - std::fabs(x[i])) * a;
    if (i % 48 == 47) out.push_back(level);
  }
  return out;
}

// Normalised autocorrelation of an envelope at `lag_ms`, mean removed.
static double periodicity(const std::vector<double>& e, size_t from, size_t to, size_t lag_ms) {
  double mean = 0.0;
  for (size_t i = from; i < to; ++i) mean += e[i];
  mean /= static_cast<double>(to - from);
  double num = 0.0, den = 0.0;
  for (size_t i = from; i + lag_ms < to; ++i) num += (e[i] - mean) * (e[i + lag_ms] - mean);
  for (size_t i = from; i < to; ++i) den += (e[i] - mean) * (e[i] - mean);
  return den > 0.0 ? num / den : 0.0;
}

// Level of the `hz` component in 10 ms frames, one value per millisecond.
static std::vector<double> band_envelope(const std::vector<float>& x, double hz) {
  std::vector<double> out;
  for (size_t at = 0; at + 480 <= x.size(); at += 48) out.push_back(tone_level(x, hz, kRate, at, at + 480));
  return out;
}

// Seconds from the start to the last sample above -80 dBFS.
static double last_sound(const Stereo& out) {
  for (size_t i = out.size(); i > 0; --i) {
    if (std::fabs(out.left[i - 1]) > 1.0e-4f || std::fabs(out.right[i - 1]) > 1.0e-4f) return i / kRate;
  }
  return 0.0;
}

int main() {
  Conformance spec;
  spec.name = "cascade";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // Mix 0 is the dry signal untouched, bit for bit.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(440.0f, 1.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    EXPECT(out.left == tone && out.right == tone, "Mix 0 passes the input through bit for bit");
  }

  // Mosaic stacks the slice at x1, x2 and x4: a 220 Hz burst comes back with
  // 440 and 880 Hz in it when High is up, and with 110 Hz when Low is up.
  {
    const std::vector<float> burst = tone_burst(220.0f, 0.3f, 3.0f);
    const size_t from = static_cast<size_t>(0.4f * kRate), to = static_cast<size_t>(2.4f * kRate);
    plain(device);
    Stereo base = run(device, burst);
    plain(device);
    device.set_param(p::kHigh, 1.0f);
    Stereo high = run(device, burst);
    plain(device);
    device.set_param(p::kLow, 1.0f);
    Stereo low = run(device, burst);
    const double root = tone_level(base.left, 220.0, kRate, from, to);
    std::printf("mosaic, 220 Hz burst: 220 %.1f dB; High 0: 440 %.1f, 880 %.1f; High 1: 440 %.1f, 880 %.1f; "
                "Low 0: 110 %.1f, Low 1: 110 %.1f\n",
                db(root), db(tone_level(base.left, 440.0, kRate, from, to)),
                db(tone_level(base.left, 880.0, kRate, from, to)),
                db(tone_level(high.left, 440.0, kRate, from, to)),
                db(tone_level(high.left, 880.0, kRate, from, to)),
                db(tone_level(base.left, 110.0, kRate, from, to)),
                db(tone_level(low.left, 110.0, kRate, from, to)));
    EXPECT(root > 0.02, "Mosaic: the slice comes back at its own pitch");
    EXPECT(tone_level(high.left, 440.0, kRate, from, to) > 0.3 * root, "Mosaic, High: an octave up is there");
    EXPECT(tone_level(high.left, 880.0, kRate, from, to) > 0.15 * root, "Mosaic, High: two octaves up is there");
    EXPECT(tone_level(base.left, 440.0, kRate, from, to) < 0.01 * root &&
               tone_level(base.left, 880.0, kRate, from, to) < 0.01 * root,
           "Mosaic, High 0: nothing above the played pitch");
    EXPECT(tone_level(low.left, 110.0, kRate, from, to) > 0.3 * root, "Mosaic, Low: an octave down is there");
    EXPECT(tone_level(base.left, 110.0, kRate, from, to) < 0.01 * root, "Mosaic, Low 0: nothing below");
  }

  // Octaves and fifths adds x3/2 and x3: 330 and 660 Hz from a 220 Hz burst.
  {
    const std::vector<float> burst = tone_burst(220.0f, 0.3f, 3.0f);
    const size_t from = static_cast<size_t>(0.4f * kRate), to = static_cast<size_t>(2.4f * kRate);
    plain(device);
    device.set_param(p::kHigh, 1.0f);
    Stereo octaves = run(device, burst);
    plain(device);
    device.set_param(p::kHigh, 1.0f);
    device.set_param(p::kInterval, 1.0f);
    Stereo fifths = run(device, burst);
    const double root = tone_level(fifths.left, 220.0, kRate, from, to);
    std::printf("interval: fifths 330 %.1f dB, 660 %.1f dB (220 at %.1f); octaves only 330 %.1f, 660 %.1f\n",
                db(tone_level(fifths.left, 330.0, kRate, from, to)),
                db(tone_level(fifths.left, 660.0, kRate, from, to)), db(root),
                db(tone_level(octaves.left, 330.0, kRate, from, to)),
                db(tone_level(octaves.left, 660.0, kRate, from, to)));
    EXPECT(tone_level(fifths.left, 330.0, kRate, from, to) > 0.2 * root, "fifths: a fifth up is there");
    EXPECT(tone_level(fifths.left, 660.0, kRate, from, to) > 0.1 * root, "fifths: an octave and a fifth up is there");
    EXPECT(tone_level(octaves.left, 330.0, kRate, from, to) < 0.01 * root &&
               tone_level(octaves.left, 660.0, kRate, from, to) < 0.01 * root,
           "Octaves: no fifths");
  }

  // A short burst comes back on the Time grid: its envelope repeats every
  // Time, and with High up also every quarter of it (the x4 loop).
  {
    const std::vector<float> burst = tone_burst(330.0f, 0.4f, 5.0f);
    plain(device);
    device.set_param(p::kTime, 400.0f);
    device.set_param(p::kRepeats, 8.0f);
    Stereo slow = run(device, burst);
    plain(device);
    device.set_param(p::kTime, 400.0f);
    device.set_param(p::kRepeats, 8.0f);
    device.set_param(p::kHigh, 1.0f);
    device.set_param(p::kShape, 0.0f);
    Stereo fast = run(device, burst);
    const std::vector<double> e_slow = envelope(slow.left);
    const std::vector<double> e_double = band_envelope(fast.left, 660.0);
    const std::vector<double> e_four = band_envelope(fast.left, 1320.0);
    const double at_time = periodicity(e_slow, 400, 3600, 400);
    const double off_time = periodicity(e_slow, 400, 3600, 200);
    const double at_half = periodicity(e_double, 400, 3600, 200);
    const double off_half = periodicity(e_double, 400, 3600, 100);
    const double at_quarter = periodicity(e_four, 400, 3600, 100);
    const double off_quarter = periodicity(e_four, 400, 3600, 50);
    std::printf("rhythm: envelope autocorrelation %.2f at Time (%.2f at half of it); the octave above: %.2f at "
                "Time / 2 (%.2f at Time / 4); two octaves above: %.2f at Time / 4 (%.2f at Time / 8)\n",
                at_time, off_time, at_half, off_half, at_quarter, off_quarter);
    EXPECT(at_time > 0.8 && off_time < 0.0, "the replays pulse at Time");
    EXPECT(at_half > 0.7 && off_half < 0.0, "the x2 loop pulses at half of Time");
    EXPECT(at_quarter > 0.7 && off_quarter < 0.0, "the x4 loop pulses at a quarter of Time");
    // The first replay starts exactly one Time after the burst did.
    size_t first = 0;
    while (first < slow.size() && std::fabs(slow.left[first]) < 1.0e-5f) ++first;
    std::printf("rhythm: first replay starts %.2f ms after the input\n", 1000.0 * first / kRate);
    EXPECT_NEAR(first / kRate, 0.4, 0.004, "the first replay starts one Time after the note");
  }

  // The tail follows Repeats: a burst shorter than Time has gone quiet
  // Repeats x Time after its last replay started, give or take a slot.
  {
    for (float repeats : {2.0f, 6.0f, 12.0f}) {
      plain(device);
      device.set_param(p::kTime, 250.0f);
      device.set_param(p::kRepeats, repeats);
      device.set_param(p::kHigh, 1.0f);
      Stereo out = run(device, tone_burst(330.0f, 0.2f, 5.0f));
      const double end = last_sound(out);
      std::printf("tail: Repeats %.0f at 250 ms ends at %.3f s (bound %.3f)\n", repeats, end,
                  0.25 * (repeats + 1.0f));
      EXPECT(end > 0.25 * repeats && end <= 0.25 * (repeats + 1.0f) + 0.001,
             "the cascade ends (Repeats + 1) x Time after the note started");
    }
  }

  // Each repeat is quieter by the Decay setting (0 to -12 dB a repeat) and
  // darker.
  {
    plain(device);
    device.set_param(p::kTime, 300.0f);
    device.set_param(p::kRepeats, 6.0f);
    device.set_param(p::kDecay, 0.5f);
    Stereo out = run(device, tone_burst(200.0f, 0.25f, 3.0f));
    double worst = 0.0;
    std::printf("decay 0.5: repeat levels");
    for (int k = 0; k < 5; ++k) {
      const double a = level_db(out.left, 0.3 * (k + 1), 0.3 * (k + 2));
      const double b = level_db(out.left, 0.3 * (k + 2), 0.3 * (k + 3));
      std::printf(" %.1f", a);
      worst = std::max(worst, std::fabs((b - a) + 6.0));
    }
    std::printf(" dB (worst error against -6 dB a repeat: %.2f dB)\n", worst);
    EXPECT(worst < 0.75, "each repeat is 6 dB down at Decay 0.5");

    plain(device);
    device.set_param(p::kTime, 300.0f);
    device.set_param(p::kRepeats, 6.0f);
    device.set_param(p::kDecay, 0.0f);
    Stereo flat = run(device, tone_burst(200.0f, 0.25f, 3.0f));
    EXPECT_NEAR(level_db(flat.left, 1.8, 2.1), level_db(flat.left, 0.3, 0.6), 0.2,
                "Decay 0: the last repeat is as loud as the first");

    plain(device);
    device.set_param(p::kTime, 300.0f);
    device.set_param(p::kRepeats, 6.0f);
    device.set_param(p::kDecay, 0.5f);
    rng_state() = 0xC0FFEEu;
    std::vector<float> hiss = noise(0.25f, kRate, 0.3f);
    hiss.resize(static_cast<size_t>(3.0f * kRate), 0.0f);
    Stereo dark = run(device, hiss);
    const size_t slot = static_cast<size_t>(0.3f * kRate);
    const double first = energy_above(dark.left, 3000.0, kRate, slot, 2 * slot);
    const double third = energy_above(dark.left, 3000.0, kRate, 3 * slot, 4 * slot);
    const double sixth = energy_above(dark.left, 3000.0, kRate, 6 * slot, 7 * slot);
    std::printf("decay 0.5: share of energy above 3 kHz: repeat 1 %.2f, repeat 3 %.2f, repeat 6 %.2f\n", first,
                third, sixth);
    EXPECT(third < 0.8 * first && sixth < 0.5 * third, "each repeat is darker");
  }

  // Steps: each repeat is at the next speed, so the pitch of a 220 Hz burst
  // climbs and falls like an arpeggio.
  {
    for (int interval = 0; interval < 2; ++interval) {
      plain(device);
      device.set_param(p::kPattern, 3.0f);
      device.set_param(p::kTime, 300.0f);
      device.set_param(p::kRepeats, 8.0f);
      device.set_param(p::kHigh, 1.0f);
      device.set_param(p::kInterval, static_cast<float>(interval));
      Stereo out = run(device, tone_burst(220.0f, 0.28f, 3.5f));
      static const double kOctaves[8] = {1, 2, 4, 2, 1, 2, 4, 2};
      static const double kFifths[8] = {1, 1.5, 2, 3, 4, 3, 2, 1.5};
      double worst = 0.0;
      std::printf("steps (%s):", interval ? "octaves and fifths" : "octaves");
      for (int k = 0; k < 8; ++k) {
        const double speed = interval ? kFifths[k] : kOctaves[k];
        // The pass lasts Time / speed from the start of its slot.
        const size_t from = static_cast<size_t>((0.3 * (k + 1) + 0.02) * kRate);
        const size_t to = static_cast<size_t>((0.3 * (k + 1) + 0.28 / speed - 0.01) * kRate);
        const double hz = dominant_frequency(out.left, kRate, 100.0, 1500.0, from, to);
        std::printf(" %.0f", hz);
        worst = std::max(worst, std::fabs(hz / (220.0 * speed) - 1.0));
      }
      std::printf(" Hz (worst error %.2f %%)\n", 100.0 * worst);
      EXPECT(worst < 0.02, "Steps: the pitch follows the sequence of speeds");
    }
  }

  // Strum: the start of the slice is struck once per repeat, and the gaps
  // between strokes shrink from Time / 2 to Time / 8 in equal ratios.
  {
    plain(device);
    device.set_param(p::kPattern, 1.0f);
    device.set_param(p::kTime, 400.0f);
    device.set_param(p::kRepeats, 5.0f);
    device.set_param(p::kShape, 0.0f);
    Stereo out = run(device, tone_burst(880.0f, 0.03f, 2.5f));
    // Stroke starts: where the level rises out of silence.
    std::vector<double> starts;
    const std::vector<double> e = envelope(out.left);
    for (size_t i = 1; i < e.size(); ++i) {
      if (e[i] > 1.0e-3 && e[i - 1] <= 1.0e-3) starts.push_back(static_cast<double>(i));
    }
    std::printf("strum: %zu strokes, gaps", starts.size());
    const double expected[4] = {200.0, 126.0, 79.4, 50.0};
    double worst = 0.0;
    for (size_t i = 1; i < starts.size() && i <= 4; ++i) {
      std::printf(" %.0f", starts[i] - starts[i - 1]);
      worst = std::max(worst, std::fabs(starts[i] - starts[i - 1] - expected[i - 1]));
    }
    std::printf(" ms (expected 200 126 79 50)\n");
    EXPECT(starts.size() == 5, "Strum: one stroke per repeat");
    EXPECT(starts.size() == 5 && worst < 3.0, "Strum: the gaps shrink geometrically from Time / 2 to Time / 8");
  }

  // A note played while another still sounds cuts the slot: it is captured
  // from its own attack, so in Strum it is its start that is struck, first
  // one Time after it was played and then at the strum's gaps (every other
  // slice strums the other way round, slowing down).
  {
    plain(device);
    device.set_param(p::kPattern, 1.0f);
    device.set_param(p::kTime, 400.0f);
    device.set_param(p::kRepeats, 5.0f);
    device.set_param(p::kShape, 0.0f);
    std::vector<float> two(static_cast<size_t>(2.5f * kRate), 0.0f);
    pluck(two, 0.0f, 220.0f, 0.3f);
    const std::vector<float> second = tone_burst(3000.0f, 0.03f, 0.1f, 0.5f);
    const size_t at = static_cast<size_t>(0.25f * kRate);
    for (size_t i = 0; i < second.size(); ++i) two[at + i] += second[i];
    Stereo out = run(device, two);
    const std::vector<double> band = band_envelope(out.left, 3000.0);
    std::vector<double> starts;
    for (size_t i = 1; i < band.size(); ++i) {
      if (band[i] > 0.02 && band[i - 1] <= 0.02) starts.push_back(static_cast<double>(i) + 5.0);
    }
    std::printf("onset: a second note at 250 ms is struck again at");
    for (double start : starts) std::printf(" %.0f", start);
    std::printf(" ms (expected 650 700 779 905 1105)\n");
    EXPECT(starts.size() == 5, "the second note gets its own strum");
    // The second slice strums the other way: the gaps grow from Time / 8 to Time / 2.
    const double expected[5] = {650.0, 700.0, 779.4, 905.4, 1105.4};
    double worst = 0.0;
    for (size_t i = 0; i < starts.size() && i < 5; ++i) worst = std::max(worst, std::fabs(starts[i] - expected[i]));
    EXPECT(starts.size() == 5 && worst < 8.0, "its strokes start one Time after it and follow the strum's gaps");
  }

  // Tunnel: one piece of the note looped into a drone that keeps its pitch,
  // has no gaps between passes (under a full swell), and gets darker.
  {
    std::vector<float> note(static_cast<size_t>(5.0f * kRate), 0.0f);
    pluck(note, 0.0f, 220.0f, 0.5f);
    for (size_t i = static_cast<size_t>(0.39f * kRate); i < note.size(); ++i) note[i] = 0.0f;
    plain(device);
    device.set_param(p::kPattern, 2.0f);
    device.set_param(p::kTime, 400.0f);
    device.set_param(p::kRepeats, 8.0f);
    Stereo out = run(device, note);
    const double hz = dominant_frequency(out.left, kRate, 100.0, 1000.0, 24000, 96000);
    double lowest = 1.0e9, highest = -1.0e9;
    for (double t = 0.45; t < 3.4; t += 0.02) {
      const double level = level_db(out.left, t, t + 0.04);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    std::printf("tunnel: pitch %.1f Hz; level from 0.45 to 3.4 s stays between %.1f and %.1f dB; ends at %.2f s\n",
                hz, lowest, highest, last_sound(out));
    EXPECT_NEAR(hz, 220.0, 4.4, "Tunnel: the drone keeps the note's pitch");
    EXPECT(highest - lowest < 6.0, "Tunnel: no gaps between passes under a full swell");
    EXPECT(last_sound(out) > 3.2 && last_sound(out) < 0.4 * 9.0 + 0.5, "Tunnel: lasts Repeats x Time");

    plain(device);
    device.set_param(p::kPattern, 2.0f);
    device.set_param(p::kTime, 400.0f);
    device.set_param(p::kRepeats, 8.0f);
    device.set_param(p::kDecay, 0.3f);
    Stereo dark = run(device, note);
    // The fifth harmonic against the fundamental, early and late.
    const double early = tone_level(dark.left, 1100.0, kRate, 24000, 48000) /
                         tone_level(dark.left, 220.0, kRate, 24000, 48000);
    const double late = tone_level(dark.left, 1100.0, kRate, 120000, 144000) /
                        tone_level(dark.left, 220.0, kRate, 120000, 144000);
    std::printf("tunnel, Decay 0.3: fifth harmonic against the fundamental %.1f dB at 0.5 s, %.1f dB at 2.5 s\n",
                db(early), db(late));
    EXPECT(late < 0.4 * early, "Tunnel: the drone gets darker");
  }

  // Tunnel on sound with no pitch to cut on. Noise does not repeat, so the
  // two voices that hand the loop to each other are unrelated where they
  // cross; with gains that add up to one the drone would dip 3 dB at every
  // crossing (a flutter at twice the loop rate). The crossing bends towards
  // equal power by how badly the loop closes: the drone of one slice of
  // noise is then about as steady as the noise itself, and a pure tone's
  // drone stays as steady as before.
  {
    auto steadiness = [&](const std::vector<float>& x, double from, double to) {
      // Spread of the 20 ms levels about their straight-line trend (each
      // pass is a little darker, which is not flutter).
      double n = 0.0, st = 0.0, sl = 0.0, stt = 0.0, stl = 0.0, sll = 0.0;
      for (double t = from; t + 0.02 <= to; t += 0.005) {
        const double level = level_db(x, t, t + 0.02);
        n += 1.0;
        st += t;
        sl += level;
        stt += t * t;
        stl += t * level;
        sll += level * level;
      }
      const double slope = (n * stl - st * sl) / (n * stt - st * st);
      const double residual = sll - sl * sl / n - slope * (stl - st * sl / n);
      return std::sqrt(std::max(0.0, residual / n));
    };
    auto drone = [&](const std::vector<float>& slice) {
      std::vector<float> x(static_cast<size_t>(8.0f * kRate), 0.0f);
      const size_t n = static_cast<size_t>(0.88f * kRate);
      for (size_t i = 0; i < n; ++i) {
        x[i] = slice[i] * static_cast<float>(std::min(1.0, std::min(i / 240.0, (n - 1 - i) / 240.0)));
      }
      plain(device);
      device.set_param(p::kPattern, 2.0f);
      device.set_param(p::kTime, 900.0f);
      device.set_param(p::kRepeats, 8.0f);
      return run(device, x).left;
    };
    rng_state() = 0xC0FFEEu;
    std::vector<float> hiss = noise(1.0f, kRate, 0.5f);
    // Rumble rather than hiss: two poles at 1.5 kHz.
    float one = 0.0f, two = 0.0f;
    for (float& v : hiss) {
      one += 0.18f * (v - one);
      two += 0.18f * (one - two);
      v = two;
    }
    const double noise_own = steadiness(hiss, 0.1, 0.85);
    const double noise_drone = steadiness(drone(hiss), 1.4, 7.0);
    const double tone_drone = steadiness(drone(sine(220.0f, 1.0f, kRate, 0.25f)), 1.4, 7.0);
    std::printf("tunnel on noise: the drone's level in 20 ms windows varies by %.2f dB (the noise itself: %.2f dB); "
                "on a 220 Hz tone: %.2f dB\n", noise_drone, noise_own, tone_drone);
    EXPECT(noise_drone < 0.95, "Tunnel: a drone of noise does not flutter where the loop crosses over");
    EXPECT(tone_drone < 0.3, "Tunnel: a drone of a tone is steady");
  }

  // No clicks. A held 110 Hz sine through the x1 loops only: the steepest
  // the output can be is the sine's own slope times the voices that overlap,
  // so a window that opened or closed with a jump would stand out. Checked
  // with plucked fronts (Shape 0), full swells (Shape 1), and for every
  // pattern with everything up.
  {
    const std::vector<float> held = sine(110.0f, 4.0f, kRate, 0.1f);
    for (float shape : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kShape, shape);
      device.set_param(p::kTime, 200.0f);
      Stereo out = run(device, held);
      std::printf("clicks: Shape %.0f, held 110 Hz sine at 0.1: largest step %.4f (the sine alone: 0.0014), peak %.2f\n",
                  shape, max_step(out.left), peak(out.left));
      EXPECT(peak(out.left) > 0.05, "the held sine comes back");
      EXPECT(max_step(out.left) < 0.012, "no click from a window opening or closing");
    }
    for (int pattern = 0; pattern < 4; ++pattern) {
      plain(device);
      device.set_param(p::kPattern, static_cast<float>(pattern));
      device.set_param(p::kShape, 0.0f);
      device.set_param(p::kTime, 150.0f);
      device.set_param(p::kHigh, 1.0f);
      device.set_param(p::kLow, 1.0f);
      device.set_param(p::kInterval, 1.0f);
      device.set_param(p::kReverse, 0.5f);
      device.set_param(p::kSpread, 1.0f);
      Stereo out = run(device, held);
      const double step = std::max(max_step(out.left), max_step(out.right));
      std::printf("clicks: pattern %d, everything up: largest step %.4f, peak %.2f\n", pattern, step,
                  std::max(peak(out.left), peak(out.right)));
      EXPECT(step < 0.03, "no click in any pattern with every part up");
    }
  }

  // Voice stealing does not click: the shortest Time, the most Repeats and
  // six parts a slice ask for several times the pool, all the time.
  {
    plain(device);
    device.set_param(p::kTime, 60.0f);
    device.set_param(p::kRepeats, 16.0f);
    device.set_param(p::kHigh, 1.0f);
    device.set_param(p::kLow, 1.0f);
    device.set_param(p::kInterval, 1.0f);
    Stereo out = run(device, sine(110.0f, 4.0f, kRate, 0.1f));
    plain(device);
    device.set_param(p::kTime, 60.0f);
    device.set_param(p::kRepeats, 16.0f);
    Stereo ones = run(device, sine(110.0f, 4.0f, kRate, 0.1f));
    std::printf("stealing: 6 parts x 16 repeats at 60 ms: largest step %.4f, peak %.2f; x1 loops only: %.4f, "
                "peak %.2f\n",
                max_step(out.left), peak(out.left), max_step(ones.left), peak(ones.left));
    EXPECT(max_step(out.left) < 0.03, "stealing under the heaviest load does not click");
    EXPECT(max_step(ones.left) < 0.012, "sixteen generations of the x1 loop do not click");
  }

  // Moving Time, Pattern, Repeats and Shape while a note is held does not
  // click either: voices keep what they started with.
  {
    plain(device);
    std::vector<float> held = sine(110.0f, 0.25f, kRate, 0.1f);
    double worst = 0.0;
    for (int move = 0; move < 24; ++move) {
      device.set_param(p::kTime, 80.0f + 70.0f * static_cast<float>((move * 7) % 11));
      device.set_param(p::kPattern, static_cast<float>(move % 4));
      device.set_param(p::kRepeats, 1.0f + static_cast<float>((move * 5) % 12));
      device.set_param(p::kShape, 0.25f * static_cast<float>(move % 5));
      Stereo out = run(device, held);
      worst = std::max(worst, max_step(out.left));
    }
    std::printf("clicks: Time, Pattern, Repeats and Shape moved 24 times under a held sine: largest step %.4f\n",
                worst);
    EXPECT(worst < 0.012, "moving the controls while sounding does not click");
  }

  // Stereo. Spread 0 is mono; the default spread is wide but stays positive
  // and loses little when summed to mono; the half-speed part stays centred.
  {
    std::vector<float> phrase(static_cast<size_t>(6.0f * kRate), 0.0f);
    pluck(phrase, 0.0f, 220.0f, 0.4f);
    pluck(phrase, 0.6f, 277.18f, 0.4f);
    pluck(phrase, 1.2f, 329.63f, 0.4f);
    pluck(phrase, 1.8f, 440.0f, 0.4f);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    Stereo mono = run(device, phrase);
    EXPECT(mono.left == mono.right, "Spread 0: left and right are the same");
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo wide = run(device, phrase);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo widest = run(device, phrase);
    std::vector<float> sum(wide.size());
    for (size_t i = 0; i < sum.size(); ++i) sum[i] = 0.5f * (wide.left[i] + wide.right[i]);
    const double each = std::sqrt(0.5 * (rms(wide.left) * rms(wide.left) + rms(wide.right) * rms(wide.right)));
    const double folded = db(rms(sum) / each);
    std::printf("stereo, wet only: correlation %.2f at the default spread, %.2f at full; mono sum %.2f dB against "
                "the channels\n",
                correlation(wide.left, wide.right), correlation(widest.left, widest.right), folded);
    EXPECT(correlation(wide.left, wide.right) > 0.3 && correlation(wide.left, wide.right) < 0.97,
           "default spread: decorrelated but positive");
    EXPECT(correlation(widest.left, widest.right) > 0.0, "full spread stays mono compatible");
    EXPECT(folded > -1.5, "the mono sum loses under 1.5 dB");

    plain(device);
    device.set_param(p::kLow, 1.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo low = run(device, tone_burst(220.0f, 0.3f, 3.0f));
    const size_t from = static_cast<size_t>(0.4f * kRate), to = static_cast<size_t>(2.4f * kRate);
    const double left = tone_level(low.left, 110.0, kRate, from, to);
    const double right = tone_level(low.right, 110.0, kRate, from, to);
    std::printf("stereo: the half-speed part at full spread: left %.2f dB, right %.2f dB\n", db(left), db(right));
    EXPECT_NEAR(db(left), db(right), 0.1, "the half-speed part stays in the centre");
  }

  // The same at every sample rate: the first replay of a burst starts one
  // Time after it and its x2 loop is an octave up.
  {
    for (float rate : {44100.0f, 96000.0f}) {
      plain(device, rate);
      device.set_param(p::kHigh, 1.0f);
      device.set_param(p::kTime, 250.0f);
      Stereo out = run(device, tone_burst(220.0f, 0.2f, 2.0f, 0.5f, rate));
      size_t first = 0;
      while (first < out.size() && std::fabs(out.left[first]) < 1.0e-5f) ++first;
      const size_t from = static_cast<size_t>(0.25f * rate), to = static_cast<size_t>(1.5f * rate);
      const double root = tone_level(out.left, 220.0, rate, from, to);
      const double octave = tone_level(out.left, 440.0, rate, from, to);
      const double two = tone_level(out.left, 880.0, rate, from, to);
      std::printf("at %.0f Hz: first replay at %.1f ms; 220 Hz %.1f dB, 440 Hz %.1f dB, 880 Hz %.1f dB\n", rate,
                  1000.0 * first / rate, db(root), db(octave), db(two));
      EXPECT_NEAR(first / rate, 0.25, 0.004, "Time is in milliseconds at every sample rate");
      EXPECT(octave > 0.3 * root && two > 0.15 * root, "the octaves are there at every sample rate");
    }
  }

  // Levels. The default patch on held material stays within 3 dB of the dry
  // level; everything at its loudest with a full-scale input stays bounded.
  {
    std::vector<float> chord(static_cast<size_t>(8.0f * kRate), 0.0f);
    for (size_t i = 0; i < chord.size(); ++i) {
      const double t = i / static_cast<double>(kRate);
      double v = 0.0;
      for (double hz : {220.0, 277.18, 329.63}) {
        for (int h = 1; h <= 4; ++h) v += std::sin(2.0 * kPi * hz * h * t + h) / (h * h);
      }
      chord[i] = static_cast<float>(0.1 * std::min(1.0, t / 0.25) * v);
    }
    device.init(kRate);
    Stereo out = run(device, chord);
    const size_t from = static_cast<size_t>(3.0f * kRate);
    const double dry = db(rms(chord, from));
    const double wet = db(std::sqrt(0.5 * (rms(out.left, from) * rms(out.left, from) +
                                           rms(out.right, from) * rms(out.right, from))));
    std::printf("level: default patch on a held chord %.1f dB against the dry %.1f dB (%+.1f dB), peak %.2f\n",
                wet, dry, wet - dry, std::max(peak(out.left), peak(out.right)));
    EXPECT_NEAR(wet, dry, 3.0, "default patch within 3 dB of the dry level on held material");

    double worst = 0.0;
    for (int pattern = 0; pattern < 4; ++pattern) {
      device.init(kRate);
      device.set_param(p::kPattern, static_cast<float>(pattern));
      device.set_param(p::kRepeats, 16.0f);
      device.set_param(p::kDecay, 0.0f);
      device.set_param(p::kHigh, 1.0f);
      device.set_param(p::kLow, 1.0f);
      device.set_param(p::kInterval, 1.0f);
      device.set_param(p::kTime, 100.0f);
      device.set_param(p::kTone, 18000.0f);
      device.set_param(p::kSpread, 1.0f);
      device.set_param(p::kMix, 1.0f);
      // 100 Hz at full scale: ten whole cycles a slot, so every repeat adds in phase.
      Stereo loud = run(device, sine(100.0f, 4.0f, kRate, 1.0f));
      worst = std::max(worst, std::max(peak(loud.left), peak(loud.right)));
      EXPECT(finite(loud.left) && finite(loud.right), "worst case stays finite");
    }
    std::printf("level: sixteen repeats that never fade, every part up, a full-scale tone in step with Time, "
                "wet only: peak %.2f over the four patterns\n", worst);
    EXPECT(worst < 2.0, "worst case stays under +6 dBFS");
  }

  // No aliasing. A 9 kHz burst sped up x4 would land on 36 kHz and fold back
  // to 12 kHz; the x4 loop reads a copy of the buffer that was low-passed
  // first, so it is not there.
  {
    plain(device);
    device.set_param(p::kHigh, 1.0f);
    Stereo out = run(device, tone_burst(9000.0f, 0.3f, 3.0f));
    const size_t from = static_cast<size_t>(0.4f * kRate), to = static_cast<size_t>(2.4f * kRate);
    const double root = tone_level(out.left, 9000.0, kRate, from, to);
    const double octave = tone_level(out.left, 18000.0, kRate, from, to);
    const double folded = tone_level(out.left, 12000.0, kRate, from, to);
    double worst = 0.0;
    for (double hz = 500.0; hz < 8500.0; hz += 250.0) worst = std::max(worst, tone_level(out.left, hz, kRate, from, to));
    std::printf("aliasing, 9 kHz burst: 9 kHz %.1f dB, 18 kHz (x2) %.1f dB, 12 kHz (x4 folded) %.1f dB, "
                "strongest below 8.5 kHz %.1f dB\n",
                db(root), db(octave), db(folded), db(worst));
    EXPECT(root > 0.02, "the burst comes back");
    EXPECT(folded < root * 0.001, "the x4 loop does not fold back");
    EXPECT(worst < root * 0.003, "nothing appears below the burst");
  }

  // The same audio whatever the block size, with every source of chance in
  // play (reverse, the Tunnel's search, stealing), and the same again after a
  // second init.
  {
    std::vector<float> phrase(static_cast<size_t>(3.0f * kRate), 0.0f);
    pluck(phrase, 0.0f, 220.0f, 0.4f);
    pluck(phrase, 0.7f, 329.63f, 0.4f);
    for (int pattern = 0; pattern < 4; ++pattern) {
      Stereo renders[4];
      const int blocks[4] = {128, 1, 2048, 128};
      for (int r = 0; r < 4; ++r) {
        device.init(kRate);
        device.set_param(p::kPattern, static_cast<float>(pattern));
        device.set_param(p::kReverse, 0.5f);
        device.set_param(p::kLow, 0.7f);
        device.set_param(p::kInterval, 1.0f);
        device.set_param(p::kTime, 90.0f);
        device.set_param(p::kRepeats, 12.0f);
        renders[r] = run(device, phrase, phrase, blocks[r]);
      }
      EXPECT(renders[0].left == renders[1].left && renders[0].right == renders[1].right,
             "blocks of 1 frame give the same audio as blocks of 128");
      EXPECT(renders[0].left == renders[2].left && renders[0].right == renders[2].right,
             "blocks of 2048 frames give the same audio as blocks of 128");
      EXPECT(renders[0].left == renders[3].left && renders[0].right == renders[3].right,
             "a second init gives the same audio");
    }
  }

  // The device sleeps: exact zeros once the last repeat has ended, and a new
  // note wakes it and is captured from its start.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, tone_burst(330.0f, 0.3f, 1.0f));
    render(device, 2.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the last repeat");
    Stereo woken = run(device, tone_burst(330.0f, 0.3f, 1.0f));
    size_t first = 0;
    while (first < woken.size() && std::fabs(woken.left[first]) < 1.0e-5f) ++first;
    std::printf("sleep: silent after the tail; woken, the first replay starts at %.1f ms\n", 1000.0 * first / kRate);
    EXPECT_NEAR(first / kRate, 0.4, 0.004, "wakes on new input and replays it one Time later");
  }

  // What is set while the device sleeps is there from the first sample of
  // the note that wakes it: Mix moved to fully wet lets none of the dry
  // attack through (nothing is replayed until one Time later).
  {
    device.init(kRate);
    render(device, 1.0f, kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo out = run(device, tone_burst(330.0f, 0.3f, 1.0f));
    const size_t before = static_cast<size_t>(0.39f * kRate);
    std::printf("asleep: Mix set to 1 in silence, then a note: peak before the first replay %.1e\n",
                std::max(peak(out.left, 0, before), peak(out.right, 0, before)));
    // (Under -120 dB rather than zero: the cosine of a float pi / 2 is -4e-8.)
    EXPECT(peak(out.left, 0, before) < 1.0e-6 && peak(out.right, 0, before) < 1.0e-6,
           "a control moved while asleep does not glide in under the next note");
    EXPECT(rms(out.left, before) > 1.0e-3, "and the note is still replayed");
  }

  // Bad input samples are survivable. A NaN, an infinity or an absurd value
  // on either input is dropped: the output stays finite and in range, and
  // once the slices that held the bad samples have played out the device is
  // back to what it does with clean input.
  {
    std::vector<float> clean(static_cast<size_t>(9.0f * kRate), 0.0f);
    for (float at : {0.0f, 0.6f, 1.1f, 1.9f, 2.5f, 5.0f, 5.7f}) pluck(clean, at, 196.0f + 90.0f * at, 0.4f);
    for (size_t i = static_cast<size_t>(4.5f * kRate); i < static_cast<size_t>(5.0f * kRate); ++i) clean[i] = 0.0f;
    for (size_t i = static_cast<size_t>(6.5f * kRate); i < clean.size(); ++i) clean[i] = 0.0f;
    std::vector<float> left = clean, right = clean;
    left[static_cast<size_t>(1.0f * kRate)] = std::nanf("");
    right[static_cast<size_t>(1.3f * kRate)] = INFINITY;
    left[static_cast<size_t>(1.6f * kRate)] = -INFINITY;
    right[static_cast<size_t>(2.0f * kRate)] = 1.0e30f;
    left[static_cast<size_t>(2.2f * kRate)] = -1.0e30f;
    device.init(kRate);
    Stereo good = run(device, clean);
    device.init(kRate);
    Stereo bad = run(device, left, right);
    const size_t later = static_cast<size_t>(5.0f * kRate);
    double apart = 0.0;
    for (size_t i = later; i < bad.size(); ++i) {
      apart = std::max(apart, static_cast<double>(std::fabs(bad.left[i] - good.left[i])));
      apart = std::max(apart, static_cast<double>(std::fabs(bad.right[i] - good.right[i])));
    }
    const size_t end = static_cast<size_t>(8.9f * kRate);
    std::printf("bad input (NaN, +inf, -inf, 1e30, -1e30 between 1.0 and 2.2 s): %s, peak %.2f (clean %.2f); "
                "from 5 s on it differs from the clean render by at most %.1e\n",
                finite(bad.left) && finite(bad.right) ? "finite" : "NOT FINITE",
                std::max(peak(bad.left), peak(bad.right)), std::max(peak(good.left), peak(good.right)), apart);
    EXPECT(finite(bad.left) && finite(bad.right), "bad input samples never reach the output");
    EXPECT(std::max(peak(bad.left), peak(bad.right)) < 1.25 * std::max(peak(good.left), peak(good.right)),
           "bad input samples do not make a burst");
    EXPECT(apart < 1.0e-4, "the device recovers from bad input samples");
    EXPECT(peak(bad.left, end) == 0.0 && peak(bad.right, end) == 0.0, "and still falls asleep afterwards");
  }

  // Cost: the default patch, and the heaviest setting (every part up, sixteen
  // repeats: the whole pool sounding and stealing), on continuous input.
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("cascade (default patch)", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kRepeats, 16.0f);
  device.set_param(p::kHigh, 1.0f);
  device.set_param(p::kLow, 1.0f);
  device.set_param(p::kInterval, 1.0f);
  report_cost("cascade (every part up, 16 repeats, 32 voices)", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kPattern, 2.0f);
  device.set_param(p::kRepeats, 16.0f);
  device.set_param(p::kHigh, 1.0f);
  device.set_param(p::kLow, 1.0f);
  device.set_param(p::kTime, 60.0f);
  report_cost("cascade (Tunnel at 60 ms, 16 repeats)", 10.0f, kRate, [&] { run(device, input); });

  return finish("cascade");
}
