// Native harness for Twin Bars (cpp/devices/twin-bars). The conformance pass
// covers silence, a pile of keys, parameter abuse and other sample rates; the
// rest measures what makes it two bars a few hertz apart: the pair's
// difference and mean on every key, mode and sample rate, the Ears law, the
// decay against its control, the materials, the mallet, Tone, Scatter and
// Damp, a key struck again and its beat carried on through the stroke, rolls
// and a full pool against the clip's knee, stealing, then what conformance
// lacks: block sizes across a steal and across stepped silences, a knob
// moved in silence, how sudden each event is, and cost. Nobody has listened
// to it: every claim here is a number.

#include "../devices/twin-bars/twin_bars.h"
#include <ctime>

#include "support/test_kit.h"

using namespace testkit;
using livemix::TwinBars;
namespace p = livemix::twin_bars;

static TwinBars device;

static const float kRate = 48000.0f;
static const float kRates[3] = {44100.0f, 48000.0f, 96000.0f};
static const double kC2 = 65.40639, kC3 = 130.8128, kC4 = 261.6256, kC5 = 523.2511, kC6 = 1046.502;
static const double kKnee = 0.5;  // where kit::soft_clip stops being a straight line

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

// The frequency of the strongest component within `reach` hertz of `guess`,
// to a few thousandths of a hertz: scan, then narrow the span as the window
// grows to the whole stretch.
static double fine_pitch(const std::vector<float>& x, double rate, double guess, size_t from, size_t to, double reach) {
  to = std::min(to, x.size());
  const size_t total = to - from;
  double f = guess, span = reach;
  for (int stage = 0; stage < 14 && span > 2.0e-4; ++stage) {
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
  const size_t n = static_cast<size_t>(window * rate);
  const double a = bin_level(x, rate, hz, static_cast<size_t>(t0 * rate), n);
  const double b = bin_level(x, rate, hz, static_cast<size_t>(t1 * rate), n);
  return b < a ? 60.0 * (t1 - t0) / (db(a) - db(b)) : 1.0e9;
}

// Where the energy of the first `n` samples sits, in Hz (a DFT every 50 Hz up to 12 kHz).
static double centroid(const std::vector<float>& x, double rate, size_t n) {
  double weighted = 0.0, total = 0.0;
  for (double hz = 50.0; hz <= 12000.0; hz += 50.0) {
    double re = 0.0, im = 0.0;
    for (size_t i = 0; i < n && i < x.size(); ++i) {
      const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
      re += x[i] * std::cos(phase);
      im -= x[i] * std::sin(phase);
    }
    const double power = re * re + im * im;
    weighted += hz * power;
    total += power;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}
static std::vector<float> side(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] - s.right[i]);
  return out;
}
static double both_peak(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = a.size() == b.size() ? 0.0 : 1.0e9;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// Exactly `samples` frames, in blocks of `block`; block 0 is a ragged mix.
static Stereo span(TwinBars& d, size_t samples, int block) {
  static const int ragged[8] = {1, 7, 64, 128, 33, 512, 2048, 5};
  Stereo out;
  out.left.resize(samples);
  out.right.resize(samples);
  size_t done = 0;
  int which = 0;
  while (done < samples) {
    const int size = block > 0 ? block : ragged[which++ % 8];
    const int frames = static_cast<int>(std::min(static_cast<size_t>(size), samples - done));
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
// small part of the way; a jump is there at once. The worst of sixteen
// moments spread over one swing of the default beat (a quarter of a second)
// and a little more, so a jump cannot hide in a zero crossing or in the
// beat's null: eight anywhere in the device's control period of 32 samples,
// and eight on its very edge, where a control read on that clock lands at once.
template <typename Setup, typename Event>
static double moved_within(Setup setup, Event event, size_t first) {
  double worst = 0.0;
  for (int trial = 0; trial < 16; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      setup(device);
      span(device, trial < 8 ? 19200 + 1565 * static_cast<size_t>(trial) : 19200 + 1568 * static_cast<size_t>(trial - 8), 128);
      if (pass == 0) event(device);
      out[pass] = render(device, 0.02f, kRate);
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < out[0].size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                                         std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (i < first) early = std::max(early, difference);
      whole = std::max(whole, difference);
    }
    if (whole > 0.0) worst = std::max(worst, early / whole);
  }
  return worst;
}
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  return moved_within(setup, event, 8);
}

// Three soft low keys left to ring: what a control is thrown under.
static void soft_chord(TwinBars& d) {
  d.set_param(p::kMallet, 0.0f);
  d.note_on(1, 110.0f, 0.8f);
  d.note_on(2, 165.0f, 0.8f);
  d.note_on(3, 220.0f, 0.8f);
}
// The same keys under a hard mallet, overtones and all: what Tone is thrown under.
static void hard_chord(TwinBars& d) {
  d.set_param(p::kMallet, 1.0f);
  d.set_param(p::kDecay, 20.0f);
  d.note_on(1, 110.0f, 0.8f);
  d.note_on(2, 165.0f, 0.8f);
  d.note_on(3, 220.0f, 0.8f);
}

static char label[320];

// --- The pair ------------------------------------------------------------------------------

// One key with a bar in each ear, hard and bright and left to ring, so every
// mode can be read on its own: the left ear holds the second bar alone.
static Stereo one_bar_an_ear(double hz, float rate, float beat, float seconds, int material = TwinBars::kMetal) {
  device.init(rate);
  device.set_param(p::kBeat, beat);
  device.set_param(p::kEars, 1.0f);
  device.set_param(p::kBar, static_cast<float>(material));
  device.set_param(p::kMallet, 1.0f);
  device.set_param(p::kDecay, 20.0f);
  device.note_on(1, static_cast<float>(hz), 0.9f);
  return render(device, seconds, rate);
}

// C2, C4 and C6: the two fundamentals are Beat apart and their mean is the
// key, at three sample rates; the second and third modes are Beat apart too.
static void the_pair() {
  static const double keys[3] = {kC2, kC4, kC6};
  static const double ratios[3] = {1.0, 2.757, 5.404};
  double worst_apart = 0.0, worst_mean = 0.0, worst_other = 0.0;
  for (float rate : kRates) {
    for (double key : keys) {
      Stereo out = one_bar_an_ear(key, rate, 4.0f, 3.2f);
      const size_t from = static_cast<size_t>(0.1 * rate), to = out.size();
      const int modes = rate == kRate ? 3 : 1;
      for (int m = 0; m < modes; ++m) {
        // The key reaches the device as a float.
        const double centre = static_cast<double>(static_cast<float>(key)) * ratios[m];
        const double high = fine_pitch(out.left, rate, centre + 2.0, from, to, 1.5);
        const double low = fine_pitch(out.right, rate, centre - 2.0, from, to, 1.5);
        worst_apart = std::max(worst_apart, std::fabs(high - low - 4.0));
        worst_mean = std::max(worst_mean, std::fabs(0.5 * (high + low) - centre));
        // Each ear has its own bar and nothing of the other.
        const double own = bin_level(out.left, rate, high, from, to - from);
        const double other = bin_level(out.left, rate, low, from, to - from);
        worst_other = std::max(worst_other, other / own);
        if (std::fabs(high - low - 4.0) > 0.05 || std::fabs(0.5 * (high + low) - centre) > 0.05) {
          std::printf("  %.0f Hz key at %.0f Hz, mode %d: %.4f and %.4f Hz\n", key, rate, m + 1, low, high);
        }
      }
    }
  }
  std::snprintf(label, sizeof label,
                "C2, C4, C6 at Beat 4 and three rates: the pair is 4 Hz apart within %.4f Hz and its mean is on the key within %.4f Hz (0.05 allowed)",
                worst_apart, worst_mean);
  std::printf("%s\n", label);
  EXPECT(worst_apart < 0.05 && worst_mean < 0.05, label);
  std::snprintf(label, sizeof label, "Ears 1: the left ear holds the higher bar alone (the lower one %.1f dB under it)", db(worst_other));
  std::printf("%s\n", label);
  EXPECT(worst_other < 0.01, label);

  // The ends of Beat, on the fundamental and the second mode.
  for (float beat : {0.5f, 20.0f}) {
    Stereo out = one_bar_an_ear(kC4, kRate, beat, 3.2f);
    const size_t from = 4800, to = out.size();
    double worst = 0.0;
    for (int m = 0; m < 2; ++m) {
      const double centre = static_cast<double>(static_cast<float>(kC4)) * ratios[m];
      const double high = fine_pitch(out.left, kRate, centre + 0.5 * beat, from, to, 0.2);
      const double low = fine_pitch(out.right, kRate, centre - 0.5 * beat, from, to, 0.2);
      worst = std::max(worst, std::max(std::fabs(high - low - beat), std::fabs(0.5 * (high + low) - centre)));
    }
    std::snprintf(label, sizeof label, "Beat %.1f at C4: difference and mean within %.4f Hz on two modes", beat, worst);
    std::printf("%s\n", label);
    EXPECT(worst < 0.05, label);
  }

  // The lowest key the device plays with the widest Beat: 10 and 30 Hz, mean 20.
  {
    Stereo out = one_bar_an_ear(20.0, kRate, 20.0f, 4.0f);
    const double high = fine_pitch(out.left, kRate, 30.0, 4800, out.size(), 0.5);
    const double low = fine_pitch(out.right, kRate, 10.0, 4800, out.size(), 0.5);
    std::snprintf(label, sizeof label, "a 20 Hz key at Beat 20: bars at %.3f and %.3f Hz", low, high);
    std::printf("%s\n", label);
    EXPECT(std::fabs(high - low - 20.0) < 0.05 && std::fabs(0.5 * (high + low) - 20.0) < 0.05, label);
  }

  // A key outside what the device plays is brought to its ends, 20 Hz and
  // 8 kHz, and a strength outside 0 to 1 likewise.
  {
    Stereo low_key = one_bar_an_ear(3.0, kRate, 4.0f, 4.0f);
    const double low = fine_pitch(low_key.left, kRate, 22.0, 4800, low_key.size(), 0.5);
    Stereo high_key = one_bar_an_ear(30000.0, kRate, 4.0f, 0.5f);
    const double high = bin_level(high_key.left, kRate, 8002.0, 2400, 19200);
    std::snprintf(label, sizeof label, "a 3 Hz key plays as 20 Hz (its upper bar at %.3f Hz) and a 30 kHz key as 8 kHz (its upper bar at %.1f dB)", low, db(high));
    std::printf("%s\n", label);
    EXPECT(std::fabs(low - 22.0) < 0.05 && high > 1.0e-3, label);
    Stereo strength[4];
    const float gains[4] = {1.0f, 4.0f, 0.0f, -2.0f};
    for (int which = 0; which < 4; ++which) {
      device.init(kRate);
      device.note_on(1, 220.0f, gains[which]);
      strength[which] = render(device, 0.3f, kRate);
    }
    EXPECT(strength[0].left == strength[1].left && strength[0].right == strength[1].right, "a key at gain 4 is a key at gain 1");
    EXPECT(both_peak(strength[2]) == 0.0 && both_peak(strength[3]) == 0.0, "a key at gain 0 or under is silent");
  }

  // Ringing bars follow Beat: moved from 4 to 9 under a held key, the pair is 9 apart.
  {
    Stereo before = one_bar_an_ear(kC4, kRate, 4.0f, 0.5f);
    device.set_param(p::kBeat, 9.0f);
    Stereo out = render(device, 3.2f, kRate);
    const double centre = static_cast<double>(static_cast<float>(kC4));
    const double high = fine_pitch(out.left, kRate, centre + 4.5, 4800, out.size(), 3.0);
    const double low = fine_pitch(out.right, kRate, centre - 4.5, 4800, out.size(), 3.0);
    std::snprintf(label, sizeof label, "Beat moved 4 to 9 under a ringing key: the bars are %.4f Hz apart, mean %.4f Hz off the key",
                  high - low, 0.5 * (high + low) - centre);
    std::printf("%s\n", label);
    EXPECT(std::fabs(high - low - 9.0) < 0.05 && std::fabs(0.5 * (high + low) - centre) < 0.05, label);
  }
}

// --- The ears ------------------------------------------------------------------------------

// A phrase with everything in it: a chord, a flam, a key struck again.
static Stereo ears_phrase(float ears) {
  device.init(kRate);
  device.set_param(p::kEars, ears);
  device.set_param(p::kScatter, 7.0f);
  device.set_param(p::kDecay, 20.0f);
  device.note_on(1, 220.0f, 0.8f);
  device.note_on(2, 330.0f, 0.6f);
  Stereo out = render(device, 0.6f, kRate);
  device.note_on(1, 220.0f, 0.9f);
  return concat(out, render(device, 1.4f, kRate));  // two seconds: eight whole beats
}

static void the_ears() {
  Stereo middle = ears_phrase(0.0f);
  EXPECT(middle.left == middle.right, "Ears 0: the two sides are the same to the sample");

  // The mid does not move with Ears, and the side is the mid's twin scaled by Ears.
  const std::vector<float> mono = mid(middle);
  for (float ears : {0.5f, 0.8f, 1.0f}) {
    Stereo out = ears_phrase(ears);
    const std::vector<float> m = mid(out), s = side(out);
    double moved = 0.0;
    for (size_t i = 0; i < m.size(); ++i) moved = std::max(moved, std::fabs(static_cast<double>(m[i]) - mono[i]));
    // From 0.6 s on nothing is struck: whole beats of a ringing pair.
    const size_t from = static_cast<size_t>(1.0 * kRate), to = static_cast<size_t>(2.0 * kRate);
    const double width = db(rms(s, from, to) / rms(m, from, to));
    std::snprintf(label, sizeof label, "Ears %.1f: the mid moves by %.2g against Ears 0; side over mid %.2f dB (the law says %.2f)", ears,
                  moved, width, 20.0 * std::log10(ears));
    std::printf("%s\n", label);
    EXPECT(moved < 1.0e-6, label);
    EXPECT(std::fabs(width - 20.0 * std::log10(ears)) < 0.4, label);
  }

  // The left ear is the higher one, at a part setting too.
  device.init(kRate);
  device.set_param(p::kDecay, 20.0f);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  Stereo part = render(device, 3.2f, kRate);
  const double centre = static_cast<double>(static_cast<float>(kC4));
  const double lean_left = bin_level(part.left, kRate, centre + 2.0, 4800, 144000) / bin_level(part.left, kRate, centre - 2.0, 4800, 144000);
  const double lean_right = bin_level(part.right, kRate, centre + 2.0, 4800, 144000) / bin_level(part.right, kRate, centre - 2.0, 4800, 144000);
  std::snprintf(label, sizeof label, "Ears 0.6: the higher bar is %.1f dB over the lower in the left ear and %.1f dB in the right (12 and -12)",
                db(lean_left), db(lean_right));
  std::printf("%s\n", label);
  EXPECT(std::fabs(db(lean_left) - 12.04) < 0.5 && std::fabs(db(lean_right) + 12.04) < 0.5, label);
}

// --- Decay, the materials, the mallet, Tone, Scatter, Damp ---------------------------------

// One bar's fundamental, read in the left ear at Ears 1 where nothing beats.
static double fundamental_ring(double key, float rate, float decay, int material = TwinBars::kMetal) {
  device.init(rate);
  device.set_param(p::kEars, 1.0f);
  device.set_param(p::kBar, static_cast<float>(material));
  device.set_param(p::kDecay, decay);
  device.note_on(1, static_cast<float>(key), 0.8f);
  Stereo out = render(device, 0.75f * decay + 0.2f, rate);
  return ring_time(out.left, rate, key + 2.0, 0.1 * decay, 0.6 * decay, 0.05 * decay);
}

static void the_decay() {
  // Decay is the time the low tone of a held key takes to fall 60 dB: at the
  // default 6 s on three keys and three rates, and at both ends of the knob.
  double worst = 0.0;
  for (float rate : kRates) {
    for (double key : {kC2, kC4, kC6}) {
      const double rings = fundamental_ring(key, rate, 6.0f);
      worst = std::max(worst, std::fabs(rings / 6.0 - 1.0));
    }
  }
  std::snprintf(label, sizeof label, "Decay 6 s on C2, C4, C6 at three rates: the low tone falls 60 dB in 6 s within %.2f %% (the plan allows 15, held to 3)", 100.0 * worst);
  std::printf("%s\n", label);
  EXPECT(worst < 0.03, label);
  for (float decay : {0.3f, 20.0f}) {
    for (int material = 0; material < TwinBars::kNumMaterials; ++material) {
      const double rings = fundamental_ring(kC4, kRate, decay, material);
      std::snprintf(label, sizeof label, "Decay %.1f s, material %d: the low tone of C4 rings %.3f s", decay, material, rings);
      std::printf("%s\n", label);
      EXPECT(std::fabs(rings / decay - 1.0) < 0.03, label);
    }
  }
  // Ringing bars follow Decay: moved from 20 s to 2 s under a held key, the low tone falls at the new rate.
  {
    device.init(kRate);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kDecay, 20.0f);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    render(device, 0.3f, kRate);
    device.set_param(p::kDecay, 2.0f);
    Stereo out = render(device, 1.6f, kRate);
    const double rings = ring_time(out.left, kRate, kC4 + 2.0, 0.1, 1.2, 0.1);
    std::snprintf(label, sizeof label, "Decay moved from 20 s to 2 s under a held key: its low tone now rings %.3f s", rings);
    std::printf("%s\n", label);
    EXPECT(std::fabs(rings / 2.0 - 1.0) < 0.03, label);
  }

  // The whole sound, overtones and all, has fallen at least as far.
  device.init(kRate);
  device.set_param(p::kEars, 1.0f);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  Stereo out = render(device, 6.3f, kRate);
  const double fallen = db(rms(out.left, 288000, 297600) / rms(out.left, 0, 9600));
  std::snprintf(label, sizeof label, "the default patch, C4 held: %.1f dB down 6 s after the stroke (60 or more, less than 75)", -fallen);
  std::printf("%s\n", label);
  EXPECT(fallen < -57.0 && fallen > -75.0, label);
}

static void the_materials() {
  struct Expect {
    int material;
    const char* name;
    int count;
    double ratios[4];
  };
  const Expect expects[3] = {
      {TwinBars::kMetal, "metal", 4, {1.0, 2.757, 5.404, 8.933}},
      {TwinBars::kWood, "wood", 3, {1.0, 4.0, 9.9, 0.0}},
      {TwinBars::kGlass, "glass", 4, {1.0, 2.32, 4.25, 6.63}},
  };
  double second_ring[3], low_ring[3], overtone[3];
  for (const Expect& expect : expects) {
    // The right ear holds the first bar alone: every mode 2 Hz under f·r.
    Stereo out = one_bar_an_ear(220.0, kRate, 4.0f, 2.5f, expect.material);
    double worst = 0.0;
    bool present = true;
    for (int m = 0; m < expect.count; ++m) {
      const double hz = 220.0 * expect.ratios[m] - 2.0;
      // Wood's overtones are gone in a fraction of a second: read them early.
      const size_t from = 240, n = expect.material == TwinBars::kWood && m > 0 ? 9600 : 96000;
      const double found = fine_pitch(out.right, kRate, hz, from, from + n, 12.0);
      worst = std::max(worst, std::fabs(found - hz));
      const double here = bin_level(out.right, kRate, found, from, n);
      const double beside = std::max(bin_level(out.right, kRate, found * 1.06, from, n), bin_level(out.right, kRate, found / 1.06, from, n));
      present = present && here > 5.0 * beside;
    }
    std::snprintf(label, sizeof label, "%s: %d modes within %.3f Hz of f times its ratios less 2 Hz", expect.name, expect.count, worst);
    std::printf("%s\n", label);
    EXPECT(worst < (expect.material == TwinBars::kWood ? 1.5 : 0.1), label);
    std::snprintf(label, sizeof label, "%s: every listed mode is there", expect.name);
    EXPECT(present, label);
    const double second = 220.0 * expect.ratios[1] - 2.0;
    low_ring[expect.material] = ring_time(out.right, kRate, 218.0, 0.3, 2.0, 0.2);
    second_ring[expect.material] = expect.material == TwinBars::kWood ? ring_time(out.right, kRate, second, 0.02, 0.3, 0.02)
                                                                     : ring_time(out.right, kRate, second, 0.3, 2.0, 0.2);
    overtone[expect.material] = db(bin_level(out.right, kRate, second, 240, 9600) / bin_level(out.right, kRate, 218.0, 240, 9600));
    std::printf("%s at 220 Hz, hard mallet, Decay 20: low tone rings %.1f s, second mode %.2f s and starts %.1f dB against the low tone\n",
                expect.name, low_ring[expect.material], second_ring[expect.material], overtone[expect.material]);
  }
  EXPECT(second_ring[TwinBars::kMetal] > 0.5 * low_ring[TwinBars::kMetal], "metal: the second mode rings more than half as long as the low tone");
  EXPECT(second_ring[TwinBars::kWood] < 0.15 * low_ring[TwinBars::kWood], "wood: the second mode is gone in under a sixth of the low tone's time");
  EXPECT(overtone[TwinBars::kWood] > -6.0, "wood: the knock is there, the second mode starts within 6 dB of the low tone");
  EXPECT(overtone[TwinBars::kGlass] < -10.0, "glass: the second mode starts more than 10 dB under the low tone");
  EXPECT(overtone[TwinBars::kMetal] > overtone[TwinBars::kGlass] + 6.0, "metal is brighter than glass by 6 dB or more in its second mode");

  // Nothing that does not belong: at 44.1 kHz a 4 kHz metal key has its
  // fourth mode at 35.7 kHz, which would fold to 8.4 kHz, and its third at
  // 21.6 kHz. Modes over 16 kHz or 0.45 of the rate are left out.
  {
    Stereo top = one_bar_an_ear(4000.0, 44100.0f, 4.0f, 0.5f);
    const double own = bin_level(top.right, 44100.0, 3998.0, 441, 17640);
    const double second = bin_level(top.right, 44100.0, 4000.0 * 2.757 - 2.0, 441, 17640);
    double stray = 0.0, stray_hz = 0.0;
    for (double hz = 200.0; hz < 21800.0; hz += 25.0) {
      if (std::fabs(hz / 3998.0 - 1.0) < 0.06 || std::fabs(hz / (4000.0 * 2.757) - 1.0) < 0.06) continue;
      const double level = bin_level(top.right, 44100.0, hz, 441, 1764);  // 40 ms: a window as wide as the step
      if (level > stray) {
        stray = level;
        stray_hz = hz;
      }
    }
    std::snprintf(label, sizeof label, "a 4 kHz metal key at 44.1 kHz: low tone %.1f dB, second mode %.1f dB, strongest other component %.1f dB at %.0f Hz",
                  db(own), db(second), db(stray), stray_hz);
    std::printf("%s\n", label);
    EXPECT(own > 0.01 && second > 0.001, "the two modes that fit sound");
    EXPECT(stray < 0.003 * own, label);
  }

  // Bar is read when a key first strikes its bars: a ringing key keeps its
  // material and the same key again starts new bars and lets the old go.
  device.init(kRate);
  device.set_param(p::kEars, 1.0f);
  device.set_param(p::kMallet, 1.0f);
  device.set_param(p::kDamp, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  render(device, 0.3f, kRate);
  device.set_param(p::kBar, static_cast<float>(TwinBars::kWood));
  Stereo kept = render(device, 0.3f, kRate);
  const double still_metal = bin_level(kept.right, kRate, 220.0 * 2.757 - 2.0, 0, 9600);
  device.note_on(1, 220.0f, 0.8f);
  Stereo again = render(device, 0.6f, kRate);
  const double metal_left = bin_level(again.right, kRate, 220.0 * 2.757 - 2.0, 19200, 9600);
  const double wood_hum = bin_level(again.right, kRate, 218.0, 19200, 9600);
  std::snprintf(label, sizeof label, "Bar moved under a ringing key: its metal mode stays (%.1f dB); the key again is wood (%.1f dB) and the metal is damped (%.1f dB)",
                db(still_metal), db(wood_hum), db(metal_left));
  std::printf("%s\n", label);
  EXPECT(still_metal > 1.0e-3 && wood_hum > 1.0e-2 && metal_left < 1.0e-4, label);
}

static void the_mallet_and_tone() {
  // Mallet: harder is brighter in the first 20 ms and no louder in the low tone.
  double bright[5], low[5];
  for (int which = 0; which < 5; ++which) {
    device.init(kRate);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kMallet, 0.25f * which);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo out = render(device, 0.4f, kRate);
    bright[which] = centroid(out.left, kRate, 960);
    low[which] = bin_level(out.left, kRate, kC4 + 2.0, 2400, 14400);
  }
  std::snprintf(label, sizeof label, "Mallet 0 to 1 at C4: centroid of the first 20 ms %.0f, %.0f, %.0f, %.0f, %.0f Hz; low tone within %.2f dB",
                bright[0], bright[1], bright[2], bright[3], bright[4], db(*std::max_element(low, low + 5) / *std::min_element(low, low + 5)));
  std::printf("%s\n", label);
  for (int which = 0; which < 4; ++which) EXPECT(bright[which + 1] > 1.05 * bright[which], "each step harder is brighter");
  EXPECT(bright[4] > 2.0 * bright[0], "a hard mallet is an octave or more brighter than a soft one");
  EXPECT(db(*std::max_element(low, low + 5) / *std::min_element(low, low + 5)) < 1.0, "the low tone is as loud whatever the mallet");

  // A harder key press is a brighter one.
  double press[3];
  const float gains[3] = {0.3f, 0.65f, 1.0f};
  for (int which = 0; which < 3; ++which) {
    device.init(kRate);
    device.set_param(p::kEars, 1.0f);
    device.note_on(1, static_cast<float>(kC4), gains[which]);
    Stereo out = render(device, 0.3f, kRate);
    press[which] = centroid(out.left, kRate, 960);
  }
  std::printf("C4 at gain 0.3, 0.65, 1: centroid %.0f, %.0f, %.0f Hz\n", press[0], press[1], press[2]);
  EXPECT(press[1] > 1.03 * press[0] && press[2] > 1.03 * press[1], "a harder press is a brighter stroke");

  // Tone: dark to bright, with the low tone where it was.
  double tilt[5], kept[5];
  for (int which = 0; which < 5; ++which) {
    device.init(kRate);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kTone, 0.25f * which);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo out = render(device, 0.4f, kRate);
    tilt[which] = centroid(out.left, kRate, 9600);
    kept[which] = bin_level(out.left, kRate, kC4 + 2.0, 2400, 14400);
  }
  std::snprintf(label, sizeof label, "Tone 0 to 1 at C4: centroid of the first 200 ms %.0f, %.0f, %.0f, %.0f, %.0f Hz; low tone within %.3f dB",
                tilt[0], tilt[1], tilt[2], tilt[3], tilt[4], db(*std::max_element(kept, kept + 5) / *std::min_element(kept, kept + 5)));
  std::printf("%s\n", label);
  for (int which = 0; which < 4; ++which) EXPECT(tilt[which + 1] > 1.05 * tilt[which], "each step of Tone is brighter");
  EXPECT(db(*std::max_element(kept, kept + 5) / *std::min_element(kept, kept + 5)) < 0.1, "Tone leaves the low tone as loud");
}

static size_t first_sound(const std::vector<float>& x) {
  for (size_t i = 0; i < x.size(); ++i) {
    if (x[i] != 0.0f) return i;
  }
  return x.size();
}

static void the_scatter() {
  // Scatter delays the second bar, the one in the left ear, by its time in
  // milliseconds at any sample rate; at zero both bars start together.
  for (float rate : kRates) {
    for (float scatter : {0.0f, 20.0f, 40.0f}) {
      device.init(rate);
      device.set_param(p::kEars, 1.0f);
      device.set_param(p::kScatter, scatter);
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 0.1f, rate);
      const double first = static_cast<double>(first_sound(out.right)), second = static_cast<double>(first_sound(out.left));
      const double late = 1000.0 * (second - first) / rate;
      std::snprintf(label, sizeof label, "Scatter %.0f ms at %.0f Hz: the second bar starts %.3f ms after the first", scatter, rate, late);
      if (rate == kRate) std::printf("%s\n", label);
      EXPECT(std::fabs(late - scatter) < 1000.0 * 1.5 / rate, label);
    }
  }
}

static void the_damp() {
  // Damp 0: letting go changes nothing at all.
  Stereo rings[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.set_param(p::kDamp, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.3f, kRate);
    if (pass == 1) device.note_off(1);
    rings[pass] = render(device, 1.0f, kRate);
  }
  EXPECT(rings[0].left == rings[1].left && rings[0].right == rings[1].right, "Damp 0: a key let go rings on exactly as if held");

  // Damp 1: the note is over inside a tenth of a second, and it is a fall, not a cut.
  device.init(kRate);
  device.set_param(p::kDamp, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo held = render(device, 0.5f, kRate);
  device.note_off(1);
  Stereo after = render(device, 0.3f, kRate);
  const double gone = db(rms(after.left, 4320, 4800) / rms(held.left, 23520, 24000));
  std::snprintf(label, sizeof label, "Damp 1: %.1f dB down between 90 and 100 ms after the key is let go (60 or more)", -gone);
  std::printf("%s\n", label);
  EXPECT(gone < -60.0, label);
  EXPECT(max_step(after.left, 0, 4800) < 1.2 * max_step(held.left, 19200), "the damper is a decay, not a cut");

  // A key let go and struck again is a held key again: at Damp 1 it rings
  // on at Decay's rate, where a key still counted as let go would be gone.
  {
    device.init(kRate);
    device.set_param(p::kDamp, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.05f, kRate);
    device.note_off(1);
    render(device, 0.02f, kRate);
    device.note_on(1, 220.0f, 0.8f);
    Stereo again = render(device, 0.5f, kRate);
    const double fallen = db(rms(again.left, 19200, 24000) / rms(again.left, 0, 4800));
    std::snprintf(label, sizeof label, "Damp 1, a key let go and struck again: 0.4 s on it is %.1f dB down (held, under 10)", -fallen);
    std::printf("%s\n", label);
    EXPECT(fallen > -10.0, label);
  }

  // One note id at one pitch, at another and at the first again, then one
  // key up: the id keeps one voice held, so its bars fall as fast as those
  // of a key struck once and let go. (A second held voice would be one that
  // no key up lets go, and it would ring on at Decay.) At the default Damp
  // the fall is read over most of a second; at Damp 1, where a let go key is
  // over in 70 ms, over 30 ms.
  for (float damp : {p::kParamDefault[p::kDamp], 1.0f}) {
    const double from = damp < 1.0f ? 0.05 : 0.01, to = damp < 1.0f ? 0.9 : 0.04, window = damp < 1.0f ? 0.1 : 0.02;
    double rings[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kEars, 1.0f);
      device.set_param(p::kDamp, damp);
      device.note_on(1, 220.0f, 0.8f);
      render(device, 0.4f, kRate);
      if (pass == 1) {
        device.note_on(1, 330.0f, 0.8f);
        render(device, 0.01f, kRate);
        device.note_on(1, 220.0f, 0.8f);
        render(device, 0.4f, kRate);
      }
      device.note_off(1);
      Stereo tail = render(device, 1.2f, kRate);
      rings[pass] = ring_time(tail.left, kRate, 222.0, from, to, window);
    }
    const double held = p::kParamDefault[p::kDecay];
    std::snprintf(label, sizeof label,
                  "Damp %.1f, a note id at 220, 330 and 220 Hz, then one key up: it rings %.3f s, a key struck once and let go %.3f s (a held one %.0f s)",
                  damp, rings[1], rings[0], held);
    std::printf("%s\n", label);
    EXPECT(std::fabs(rings[1] / rings[0] - 1.0) < 0.05 && rings[1] < 0.5 * held, label);
  }

  // In between, a let go key rings Decay^(1 - Damp) · 0.07^Damp: 1.58 s at the defaults.
  device.init(kRate);
  device.set_param(p::kEars, 1.0f);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  render(device, 0.4f, kRate);
  device.note_off(1);
  Stereo between = render(device, 1.2f, kRate);
  const double rings_for = ring_time(between.left, kRate, kC4 + 2.0, 0.05, 0.9, 0.1);
  std::snprintf(label, sizeof label, "Damp 0.3 at Decay 6: a key let go rings %.2f s (1.58 by the law)", rings_for);
  std::printf("%s\n", label);
  EXPECT(std::fabs(rings_for / 1.58 - 1.0) < 0.1, label);
}

// --- A key struck again, rolls, levels -----------------------------------------------------

static void struck_again() {
  // The same key again while its bars ring: no second copy, no cancelling.
  // Twenty four moments spread over one swing of the note and one of the beat.
  device.init(kRate);
  device.set_param(p::kEars, 1.0f);
  device.set_param(p::kDecay, 20.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo first = render(device, 0.5f, kRate);
  const double before[2] = {bin_level(first.right, kRate, 218.0, 12000, 12000), bin_level(first.left, kRate, 222.0, 12000, 12000)};
  double least = 1.0e9, most = 0.0;
  for (int n = 0; n < 24; ++n) {
    device.init(kRate);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kDecay, 20.0f);
    device.note_on(1, 220.0f, 0.7f);
    render(device, 0.5f + n * (0.25f / 24.0f) + n / (24.0f * 220.0f), kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo second = render(device, 0.5f, kRate);
    const double after[2] = {bin_level(second.right, kRate, 218.0, 12000, 12000), bin_level(second.left, kRate, 222.0, 12000, 12000)};
    for (int b = 0; b < 2; ++b) {
      least = std::min(least, after[b] / before[b]);
      most = std::max(most, after[b] / before[b]);
    }
  }
  std::snprintf(label, sizeof label, "a second equal stroke leaves each bar between %.2fx and %.2fx as loud, whenever it lands (0.95 to 1.25)", least, most);
  std::printf("%s\n", label);
  EXPECT(least > 0.95 && most < 1.25, label);

  // It strikes the same bars: twelve strokes of one key, held or let go,
  // take no voice from fifteen ringing keys.
  double with[15], without[15];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.set_param(p::kBar, static_cast<float>(TwinBars::kGlass));
    device.set_param(p::kEars, 0.0f);
    device.set_param(p::kDecay, 20.0f);
    device.set_param(p::kDamp, 0.0f);
    device.set_param(p::kMallet, 0.0f);
    for (int n = 0; n < 15; ++n) device.note_on(10 + n, 300.0f + 100.0f * n, 0.3f);
    render(device, 0.2f, kRate);
    for (int hit = 0; hit < 12; ++hit) {
      if (pass == 1) {
        device.note_on(1, 3050.0f, 0.5f);
        if (hit & 1) device.note_off(1);
      }
      render(device, 0.1f, kRate);
    }
    Stereo out = render(device, 0.5f, kRate);
    // The upper bar of each key, half a second long: its twin is 4 Hz away.
    for (int n = 0; n < 15; ++n) (pass == 0 ? without : with)[n] = bin_level(out.left, kRate, 302.0 + 100.0 * n, 0, 24000);
  }
  double changed = 0.0;
  for (int n = 0; n < 15; ++n) changed = std::max(changed, std::fabs(with[n] / without[n] - 1.0));
  std::snprintf(label, sizeof label, "twelve strokes of one key take no voice from fifteen ringing keys (worst change %.3f)", changed);
  std::printf("%s\n", label);
  EXPECT(changed < 0.05, label);

  // The level rule counts rolls: sixteen and thirty two strokes a second on
  // one key for two seconds, each material, three mallets, the longest
  // Decay. At full strength a roll stays under the knee and is no louder than
  // one stroke left alone by more than 1.5 dB: every mode is topped up where
  // it is in its own swing, so no overtone piles up, and the room holds the
  // low tone at one key's worth. At half strength the room is not reached and
  // the roll swells to what the stroke law allows, one and a half strokes'
  // worth in a mode (3.5 dB) and a little for the knock: 5 dB is allowed, and
  // a touch that never shrank would swell it to the room, near 10 dB.
  for (float strength : {1.0f, 0.5f}) {
    double worst = 0.0, worst_over = 0.0;
    for (int material = 0; material < TwinBars::kNumMaterials; ++material) {
      for (double key : {kC2, 220.0, kC5, 2093.0}) {
        for (float ears : {0.0f, 1.0f}) {
          for (float mallet : {0.0f, 0.5f, 1.0f}) {
            device.init(kRate);
            device.set_param(p::kBar, static_cast<float>(material));
            device.set_param(p::kEars, ears);
            device.set_param(p::kDecay, 20.0f);
            device.set_param(p::kMallet, mallet);
            device.note_on(1, static_cast<float>(key), strength);
            const double single = both_peak(render(device, 2.0f, kRate));
            for (int per_second : {16, 32}) {
              device.init(kRate);
              device.set_param(p::kBar, static_cast<float>(material));
              device.set_param(p::kEars, ears);
              device.set_param(p::kDecay, 20.0f);
              device.set_param(p::kMallet, mallet);
              double roll = 0.0;
              for (int hit = 0; hit < 2 * per_second; ++hit) {
                device.note_on(1, static_cast<float>(key), strength);
                roll = std::max(roll, both_peak(span(device, static_cast<size_t>(kRate) / per_second, 128)));
              }
              if (roll > worst || roll > single * std::pow(10.0, worst_over / 20.0)) {
                std::printf("rolled at %d a second at gain %.1f, material %d, %.0f Hz, Ears %.0f, Mallet %.1f: peak %.3f (one stroke %.3f, %.2f dB over)\n",
                            per_second, strength, material, key, ears, mallet, roll, single, db(roll / single));
              }
              worst = std::max(worst, roll);
              worst_over = std::max(worst_over, db(roll / single));
            }
          }
        }
      }
    }
    const double allowed = strength == 1.0f ? 1.5 : 5.0;
    std::snprintf(label, sizeof label,
                  "sixteen and thirty two strokes a second for two seconds at gain %.1f: the peak is %.3f, under the knee at 0.5, and at most %.2f dB over one stroke (%.1f allowed)",
                  strength, worst, worst_over, allowed);
    std::printf("%s\n", label);
    EXPECT(worst < kKnee, label);
    EXPECT(worst_over < allowed, label);
  }

  // Every stroke is heard: a second equal stroke a twentieth of a second
  // after the first, when the bar has hardly fallen, still adds a touch (a
  // tenth of a fresh stroke, 0.8 dB) to the low tone.
  {
    double with = 0.0, without = 0.0;
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kEars, 1.0f);
      device.set_param(p::kDecay, 20.0f);
      device.note_on(1, 220.0f, 0.7f);
      render(device, 0.05f, kRate);
      if (pass == 0) device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 0.5f, kRate);
      (pass == 0 ? with : without) = bin_level(out.left, kRate, 222.0, 12000, 12000);
    }
    std::snprintf(label, sizeof label, "a second equal stroke 50 ms after the first leaves the low tone %.2f dB louder than one stroke alone (0.5 to 1.2)", db(with / without));
    std::printf("%s\n", label);
    EXPECT(db(with / without) > 0.5 && db(with / without) < 1.2, label);
  }

  // A roll faster than Scatter: the stroke on its way to the second bar
  // lands as it was sent, so the second bar (the left ear at Ears 1) sounds
  // all the same. A stroke that replaced the waiting one would never land.
  for (int per_second : {24, 32}) {
    device.init(kRate);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kScatter, 40.0f);
    Stereo out;
    for (int hit = 0; hit < per_second; ++hit) {
      device.note_on(1, 440.0f, 0.8f);
      out = concat(out, span(device, static_cast<size_t>(kRate) / per_second, 128));
    }
    std::snprintf(label, sizeof label,
                  "Scatter 40 ms under a roll at %d a second: the second bar peaks %.4f beside the first bar's %.4f (more than half of it)",
                  per_second, peak(out.left), peak(out.right));
    std::printf("%s\n", label);
    EXPECT(peak(out.left) > 0.5 * peak(out.right), label);
  }
}

// Phase of the `hz` component over n samples from `from`, in turns (a Hann window).
static double bin_turns(const std::vector<float>& x, double rate, double hz, size_t from, size_t n) {
  double re = 0.0, im = 0.0;
  for (size_t i = 0; i < n && from + i < x.size(); ++i) {
    const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    re += window * x[from + i] * std::cos(phase);
    im -= window * x[from + i] * std::sin(phase);
  }
  return std::atan2(im, re) / (2.0 * kPi);
}

// Where a pair is in its beat on one mode: the upper bar's phase (the left
// ear at Ears 1) less the lower bar's, in turns.
static double place_in_beat(const Stereo& out, double hz, size_t from, size_t n) {
  return bin_turns(out.left, kRate, hz + 2.0, from, n) - bin_turns(out.right, kRate, hz - 2.0, from, n);
}

// A key struck again carries its beat on, on the low tone and on the second
// mode, on every material: against the same key never struck again, the
// place of the pair in its beat does not move. Twelve moments from 0.1 s to
// 1.9 s after the first stroke (at Decay 4 the low tone is 1.5 to 29 dB down).
static void the_beat_carries_on() {
  const char* names[3] = {"metal", "wood", "glass"};
  const double second_ratio[3] = {2.757, 4.0, 2.32};
  for (int material = 0; material < TwinBars::kNumMaterials; ++material) {
    double worst[2] = {0.0, 0.0};
    int compared[2] = {0, 0};
    for (double key : {220.0, 1760.0}) {
      for (int trial = 0; trial < 12; ++trial) {
        Stereo out[2];
        for (int pass = 0; pass < 2; ++pass) {
          device.init(kRate);
          device.set_param(p::kBar, static_cast<float>(material));
          device.set_param(p::kEars, 1.0f);
          device.set_param(p::kDecay, 4.0f);
          device.set_param(p::kMallet, 0.7f);
          device.note_on(1, static_cast<float>(key), 0.8f);
          render(device, 0.1f + 0.1637f * trial, kRate);
          if (pass == 0) device.note_on(1, static_cast<float>(key), 0.8f);
          out[pass] = render(device, 0.3f, kRate);
        }
        for (int mode = 0; mode < 2; ++mode) {
          const double hz = static_cast<double>(static_cast<float>(key)) * (mode == 0 ? 1.0 : second_ratio[material]);
          // Read from 100 to 250 ms after the second stroke; an overtone that has died away has no place to keep.
          if (bin_level(out[1].left, kRate, hz + 2.0, 4800, 7200) < 3.0e-6) continue;
          double moved = place_in_beat(out[0], hz, 4800, 7200) - place_in_beat(out[1], hz, 4800, 7200);
          moved -= std::round(moved);
          worst[mode] = std::max(worst[mode], std::fabs(moved));
          ++compared[mode];
        }
      }
    }
    std::snprintf(label, sizeof label,
                  "%s, a key struck again: its beat moves by at most %.3f of a turn on the low tone (%d moments) and %.3f on the second mode (%d moments); 0.05 allowed",
                  names[material], worst[0], compared[0], worst[1], compared[1]);
    std::printf("%s\n", label);
    EXPECT(worst[0] < 0.05 && worst[1] < 0.05, label);
    EXPECT(compared[0] == 24 && compared[1] >= 4, label);

    // A bar whose low tone has fallen 40 dB under the new stroke is at rest:
    // the stroke is a fresh one and the beat starts again at its crest, as
    // on a key never played. Eight moments from 0.8 s on at Decay 1 (48 to
    // 55 dB down), where a beat carried on would be anywhere in its swing.
    device.init(kRate);
    device.set_param(p::kBar, static_cast<float>(material));
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kDecay, 1.0f);
    device.set_param(p::kMallet, 0.7f);
    device.note_on(1, 220.0f, 0.8f);
    const double fresh = place_in_beat(render(device, 0.3f, kRate), 220.0, 4800, 7200);
    double off = 0.0;
    for (int trial = 0; trial < 8; ++trial) {
      device.init(kRate);
      device.set_param(p::kBar, static_cast<float>(material));
      device.set_param(p::kEars, 1.0f);
      device.set_param(p::kDecay, 1.0f);
      device.set_param(p::kMallet, 0.7f);
      device.note_on(1, 220.0f, 0.8f);
      render(device, 0.8f + 0.0171f * trial, kRate);
      device.note_on(1, 220.0f, 0.8f);
      double moved = place_in_beat(render(device, 0.3f, kRate), 220.0, 4800, 7200) - fresh;
      moved -= std::round(moved);
      off = std::max(off, std::fabs(moved));
    }
    std::snprintf(label, sizeof label, "%s, a key struck again once it has all but rung out: its beat starts within %.3f of a turn of a fresh key's (0.05 allowed)",
                  names[material], off);
    std::printf("%s\n", label);
    EXPECT(off < 0.05, label);
  }
}

static void the_levels() {
  // One key at gain 0.7 at the default volume, each material, each rate.
  const char* names[3] = {"metal", "wood", "glass"};
  for (int material = 0; material < TwinBars::kNumMaterials; ++material) {
    double at[3];
    for (int r = 0; r < 3; ++r) {
      device.init(kRates[r]);
      device.set_param(p::kBar, static_cast<float>(material));
      device.note_on(1, 220.0f, 0.7f);
      at[r] = db(both_peak(render(device, 2.0f, kRates[r])));
    }
    std::snprintf(label, sizeof label, "%s: one key at gain 0.7 peaks at %.1f, %.1f, %.1f dBFS at 44.1, 48, 96 kHz (-24 to -10, within 1 dB)",
                  names[material], at[0], at[1], at[2]);
    std::printf("%s\n", label);
    for (int r = 0; r < 3; ++r) EXPECT(at[r] > -24.0 && at[r] < -10.0, label);
    EXPECT(std::fabs(at[0] - at[1]) < 1.0 && std::fabs(at[2] - at[1]) < 1.0, label);
  }
  double quietest = 0.0, loudest = -200.0;
  for (double key : {kC2, kC3, 220.0, kC4, kC5, kC6}) {
    device.init(kRate);
    device.note_on(1, static_cast<float>(key), 0.8f);
    const double level = db(both_peak(render(device, 2.0f, kRate)));
    quietest = std::min(quietest, level);
    loudest = std::max(loudest, level);
  }
  std::snprintf(label, sizeof label, "the default patch at gain 0.8 peaks between %.1f and %.1f dBFS from C2 to C6 (-22 to -16)", quietest, loudest);
  std::printf("%s\n", label);
  EXPECT(quietest > -22.0 && loudest < -16.0, label);

  double soft = 0.0, loud = 0.0;
  for (int which = 0; which < 2; ++which) {
    device.init(kRate);
    device.note_on(1, 220.0f, which == 0 ? 0.2f : 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    (which == 0 ? soft : loud) = rms(out.left, 0, 24000);
  }
  // The stroke's level is gain * (0.3 + 0.7 * gain): 21.1 dB from 0.2 to 1.
  std::snprintf(label, sizeof label, "gain 0.2 to 1: %.1f dB (20 to 23)", db(loud / soft));
  std::printf("%s\n", label);
  EXPECT(db(loud / soft) > 20.0 && db(loud / soft) < 23.0, label);

  // One key at full strength, hard and bright, each material: under the
  // knee at the default volume, so 20 dB down it is the same sound 20 dB down.
  for (int material = 0; material < TwinBars::kNumMaterials; ++material) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kBar, static_cast<float>(material));
      device.set_param(p::kEars, 1.0f);
      device.set_param(p::kMallet, 1.0f);
      device.set_param(p::kTone, 1.0f);
      if (pass == 1) device.set_param(p::kVolume, p::kParamDefault[p::kVolume] - 20.0f);
      device.note_on(1, 220.0f, 1.0f);
      out[pass] = render(device, 0.3f, kRate);
    }
    std::snprintf(label, sizeof label, "%s, one key at full strength, hard and bright: peak %.3f at the default volume, %.2f dB over the same 20 dB down",
                  names[material], both_peak(out[0]), db(both_peak(out[0]) / both_peak(out[1])));
    std::printf("%s\n", label);
    EXPECT(both_peak(out[0]) < kKnee && std::fabs(db(both_peak(out[0]) / both_peak(out[1])) - 20.0) < 0.05, label);
  }

  // A full pool of held keys, struck together at full strength, stays under
  // the clip's knee in either ear: three chords, each material, three Ears.
  double worst = 0.0;
  const char* chords[3] = {"minor thirds from A2", "a cluster from C4", "octaves and fifths from C1"};
  for (int chord = 0; chord < 3; ++chord) {
    for (int material = 0; material < TwinBars::kNumMaterials; ++material) {
      for (float ears : {0.0f, 0.6f, 1.0f}) {
        for (float gain : {0.8f, 1.0f}) {
          device.init(kRate);
          device.set_param(p::kBar, static_cast<float>(material));
          device.set_param(p::kEars, ears);
          for (int n = 0; n < TwinBars::kMaxVoices; ++n) {
            const float semitones = chord == 0 ? 3.0f * n : chord == 1 ? 1.0f * n : (n / 2) * 12.0f + (n % 2) * 7.0f;
            const float base = chord == 0 ? 110.0f : chord == 1 ? 261.6256f : 32.70320f;
            device.note_on(n, base * std::pow(2.0f, semitones / 12.0f), gain);
          }
          const double here = both_peak(render(device, 3.0f, kRate));
          if (here > worst) std::printf("a full pool (%s), material %d, Ears %.1f, gain %.1f: peak %.3f\n", chords[chord], material, ears, gain, here);
          worst = std::max(worst, here);
        }
      }
    }
  }
  std::snprintf(label, sizeof label, "sixteen held keys at full strength: the peak in either ear is %.3f, under the knee at 0.5", worst);
  std::printf("%s\n", label);
  EXPECT(worst < kKnee, label);

  // The room is counted on the low tones alone: one key at full strength is
  // as loud in its low tone soft and dark as hard and bright. Read from 50
  // to 250 ms at the longest Decay, while the key still fills the room: were
  // the overtones counted, the hard bright key would be more than a decibel
  // down here.
  double low_tone[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kDecay, 20.0f);
    device.set_param(p::kMallet, static_cast<float>(pass));
    device.set_param(p::kTone, static_cast<float>(pass));
    device.note_on(1, 220.0f, 1.0f);
    Stereo out = render(device, 0.3f, kRate);
    low_tone[pass] = bin_level(out.left, kRate, 222.0, 2400, 9600);
  }
  std::snprintf(label, sizeof label, "one key at full strength: its low tone hard and bright is %.3f dB from soft and dark", db(low_tone[1] / low_tone[0]));
  std::printf("%s\n", label);
  EXPECT(std::fabs(db(low_tone[1] / low_tone[0])) < 0.1, label);

  // One key is never turned down, on any material: from gain 0.5 to gain 1
  // its low tone rises by the stroke's law alone, 9.76 dB.
  for (int material = 0; material < TwinBars::kNumMaterials; ++material) {
    double tone_at[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kEars, 1.0f);
      device.set_param(p::kBar, static_cast<float>(material));
      device.note_on(1, 220.0f, pass == 0 ? 0.5f : 1.0f);
      Stereo out = render(device, 0.4f, kRate);
      tone_at[pass] = bin_level(out.left, kRate, 222.0, 2400, 14400);
    }
    std::snprintf(label, sizeof label, "%s: one key at gain 1 has its low tone %.2f dB over the same key at gain 0.5 (9.76 by the stroke's law)", names[material],
                  db(tone_at[1] / tone_at[0]));
    std::printf("%s\n", label);
    EXPECT(std::fabs(db(tone_at[1] / tone_at[0]) - 9.76) < 0.2, label);
  }

  // The law of the room: n keys at full strength add up as the root of n,
  // so each is down by 10·log10(n) dB once more than one rings. Read in the
  // first 150 ms, before the bars have fallen and the room has opened again.
  double one_key = 0.0;
  for (int keys : {1, 2, 4, 16}) {
    device.init(kRate);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kBar, static_cast<float>(TwinBars::kGlass));
    device.set_param(p::kDecay, 20.0f);
    device.note_on(1, 220.0f, 1.0f);
    for (int n = 1; n < keys; ++n) device.note_on(1 + n, 300.0f + 55.0f * n, 1.0f);
    Stereo out = render(device, 0.2f, kRate);
    const double level = bin_level(out.left, kRate, 222.0, 2400, 4800);
    if (keys == 1) {
      one_key = level;
      continue;
    }
    const double down = db(level / one_key), law = -10.0 * std::log10(static_cast<double>(keys));
    std::snprintf(label, sizeof label, "%d keys at full strength: each low tone is %.2f dB against one key alone (the law says %.2f)", keys, down, law);
    std::printf("%s\n", label);
    EXPECT(std::fabs(down - law) < 0.5, label);
  }

  // The corner the room does not cover: sixteen keys at full strength, hard
  // and bright. The overtones are not counted, so here the clip is reached.
  {
    double corner = 0.0;
    for (int material = 0; material < TwinBars::kNumMaterials; ++material) {
      device.init(kRate);
      device.set_param(p::kBar, static_cast<float>(material));
      device.set_param(p::kMallet, 1.0f);
      device.set_param(p::kTone, 1.0f);
      for (int n = 0; n < TwinBars::kMaxVoices; ++n) device.note_on(n, 261.6256f * std::pow(2.0f, n / 12.0f), 1.0f);
      const double here = both_peak(render(device, 1.0f, kRate));
      std::printf("sixteen keys at full strength, Mallet 1 and Tone 1, material %d: peak %.3f\n", material, here);
      corner = std::max(corner, here);
    }
    EXPECT(corner < 1.0, "the hardest, brightest full pool is held by the soft clip");
  }

  // Two keys a player holds together are not turned down either: a second
  // key leaves the first one's low tone where it was.
  double alone = 0.0, joined = 0.0;
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.set_param(p::kEars, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    if (pass == 1) device.note_on(2, 311.0f, 0.8f);
    Stereo out = render(device, 0.6f, kRate);
    (pass == 0 ? alone : joined) = bin_level(out.left, kRate, 222.0, 4800, 24000);
  }
  std::snprintf(label, sizeof label, "a second key at gain 0.8 moves the first by %.3f dB", db(joined / alone));
  std::printf("%s\n", label);
  EXPECT(std::fabs(db(joined / alone)) < 0.1, label);
}

// --- Stealing ------------------------------------------------------------------------------

// A full pool of wooden bars under soft mallets: sixteen keys from 200 Hz up
// in steps of 40 Hz, whose modes leave 2130 and 2630 Hz clear.
static void full_pool(float gain) {
  device.init(kRate);
  device.set_param(p::kBar, static_cast<float>(TwinBars::kWood));
  device.set_param(p::kEars, 1.0f);  // the left ear holds each key's upper bar alone, 2 Hz over the key
  device.set_param(p::kMallet, 0.0f);
  device.set_param(p::kDamp, 1.0f);
  for (int n = 0; n < TwinBars::kMaxVoices; ++n) device.note_on(n, 200.0f + 40.0f * n, gain);
}

// How many of the sixteen held keys still sound in `out`.
static int still_held(const Stereo& out, size_t from, size_t n) {
  int count = 0;
  for (int k = 0; k < TwinBars::kMaxVoices; ++k) {
    if (bin_level(out.left, kRate, 202.0 + 40.0 * k, from, n) > 3.0e-3) ++count;
  }
  return count;
}

static void stealing() {
  // Two keys in one block over a full pool: each takes its own voice.
  for (int held = TwinBars::kMaxVoices - 1; held <= TwinBars::kMaxVoices; ++held) {
    full_pool(0.8f);
    if (held < TwinBars::kMaxVoices) device.note_off(TwinBars::kMaxVoices - 1);
    render(device, 0.5f, kRate);
    device.note_on(100, 2130.0f, 0.8f);
    device.note_on(101, 2630.0f, 0.8f);
    Stereo out = render(device, 0.3f, kRate);
    const double first = db(bin_level(out.left, kRate, 2132.0, 2400, 9600));
    const double second = db(bin_level(out.left, kRate, 2632.0, 2400, 9600));
    std::snprintf(label, sizeof label, "%d held keys, then two in one block: both sound (%.1f and %.1f dB)", held, first, second);
    std::printf("%s\n", label);
    EXPECT(first > -40.0 && second > -40.0, label);
  }

  // The quietest voice is the one taken, and it leaves without a click.
  {
    device.init(kRate);
    device.set_param(p::kBar, static_cast<float>(TwinBars::kGlass));
    device.set_param(p::kMallet, 0.0f);
    device.set_param(p::kDecay, 20.0f);
    for (int n = 0; n < TwinBars::kMaxVoices - 1; ++n) device.note_on(n, 60.0f + 5.0f * n, 1.0f);
    device.note_on(15, 1500.0f, 0.5f);
    Stereo ringing = render(device, 0.3f, kRate);
    device.note_on(16, 90.0f, 0.2f);
    Stereo out = render(device, 0.05f, kRate);
    const double left_over = bin_level(out.left, kRate, 1500.0, 960, 1440) / bin_level(ringing.left, kRate, 1500.0, 12000, 1440);
    std::snprintf(label, sizeof label, "a seventeenth key takes the quietest voice: its 1500 Hz is %.1f dB under where it was", -db(left_over));
    std::printf("%s\n", label);
    EXPECT(left_over < 0.01, label);
  }

  // A key struck twice in one block over a full pool whose levels tie: one
  // voice is taken, not two, and after every key is let go the device is
  // exactly silent by its deadline (Damp 1 ends a note in a tenth of a
  // second; a voice no key can end would ring for seconds).
  for (int pass = 0; pass < 2; ++pass) {
    full_pool(0.8f);
    if (pass == 1) render(device, 0.25f, kRate);  // ringing: the levels no longer tie exactly
    device.note_on(100, 2130.0f, 0.8f);
    device.note_on(100, 2130.0f, 0.8f);
    Stereo out = render(device, 0.3f, kRate);
    const int left = still_held(out, 2400, 9600);
    const double struck = db(bin_level(out.left, kRate, 2132.0, 2400, 9600));
    for (int n = 0; n < TwinBars::kMaxVoices; ++n) device.note_off(n);
    device.note_off(100);
    render(device, 1.0f, kRate);
    Stereo after = render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label,
                  "a key struck twice over a full pool (%s): it sounds (%.1f dB), %d of 16 held keys are left, and a second after the keys are let go the peak is %g",
                  pass == 0 ? "levels tied" : "ringing", struck, left, both_peak(after));
    std::printf("%s\n", label);
    EXPECT(struck > -40.0 && left == TwinBars::kMaxVoices - 1, label);
    EXPECT(both_peak(after) == 0.0, label);
  }

  // A held key sent at another pitch over a full pool, and 10 ms later at
  // its first pitch again. The lowest key holds the first voice; the highest
  // is let go, so that it is the quietest voice and the other pitch takes
  // it. Back on its first bars the id lets that voice go, and one key up
  // ends the id: a second after every key is let go the device is exactly
  // silent.
  {
    full_pool(0.8f);
    render(device, 0.25f, kRate);
    device.note_off(TwinBars::kMaxVoices - 1);
    render(device, 0.05f, kRate);
    device.note_on(0, 2130.0f, 0.8f);
    render(device, 0.01f, kRate);
    device.note_on(0, 200.0f, 0.8f);
    Stereo out = render(device, 0.3f, kRate);
    const double back = db(bin_level(out.left, kRate, 202.0, 2400, 9600));
    for (int n = 0; n < TwinBars::kMaxVoices; ++n) device.note_off(n);
    render(device, 1.0f, kRate);
    Stereo after = render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label,
                  "a held key at another pitch over a full pool and back 10 ms later: its first pitch sounds (%.1f dB), and a second after the keys are let go the peak is %g",
                  back, both_peak(after));
    std::printf("%s\n", label);
    EXPECT(back > -40.0, label);
    EXPECT(both_peak(after) == 0.0, label);
  }

  // A key let go before the voice it took has finished fading never sounds.
  {
    full_pool(0.8f);
    render(device, 0.3f, kRate);
    device.note_on(100, 2130.0f, 0.8f);
    device.note_off(100);
    Stereo out = render(device, 0.3f, kRate);
    std::snprintf(label, sizeof label, "a key released before its stolen voice starts never sounds (its pitch at %.1f dB)",
                  db(bin_level(out.left, kRate, 2132.0, 2400, 9600)));
    std::printf("%s\n", label);
    EXPECT(bin_level(out.left, kRate, 2132.0, 2400, 9600) < 1.0e-4, label);
  }

  // Sixty keys over sixteen voices stay bounded and all come to rest.
  device.init(kRate);
  bool bounded = true;
  for (int n = 0; n < 60; ++n) {
    device.note_on(n, 65.4f * std::pow(2.0f, static_cast<float>(n % 37) / 12.0f), 1.0f);
    Stereo out = render(device, 0.03f, kRate);
    bounded = bounded && finite(out.left) && peak(out.left) < 1.01 && peak(out.right) < 1.01;
  }
  EXPECT(bounded, "sixty keys over sixteen voices stay bounded");
  for (int n = 0; n < 60; ++n) device.note_off(n);
  render(device, 5.0f, kRate);
  Stereo after = render(device, 0.5f, kRate);
  EXPECT(both_peak(after) == 0.0, "and every voice is freed");

  // A held key that has rung out frees its voice: exact silence, key still down.
  device.init(kRate);
  device.set_param(p::kDecay, 0.3f);
  device.note_on(1, 880.0f, 0.8f);
  render(device, 1.0f, kRate);
  Stereo quiet = render(device, 0.5f, kRate);
  EXPECT(both_peak(quiet) == 0.0, "a held key that has rung out leaves exact silence");
}

// --- What conformance lacks: silences, a knob moved in silence -----------------------------

// A key, a silence of `gap` samples with every live control moved inside it,
// then two more keys with Beat and Tone moved under them: `block` sets the
// host's block size (0 is ragged).
static Stereo across_a_silence(size_t gap, int block) {
  device.init(kRate);
  device.set_param(p::kDamp, 1.0f);
  device.set_param(p::kScatter, 3.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo out = span(device, 9000, block);
  device.note_off(1);
  const size_t before = gap > 240 ? gap - 240 : 0;  // the controls move 5 ms before the next key
  out = concat(out, span(device, before, block));
  device.set_param(p::kVolume, -14.0f);
  device.set_param(p::kEars, 0.9f);
  device.set_param(p::kBeat, 9.0f);
  device.set_param(p::kTone, 0.85f);
  device.set_param(p::kDecay, 2.0f);
  device.set_param(p::kMallet, 0.8f);
  out = concat(out, span(device, gap - before, block));
  device.note_on(2, 330.0f, 0.7f);
  device.note_on(3, 495.0f, 0.5f);
  // Beat and Tone are read on the control clock: moved under the new keys
  // they land where that clock says, so it must not remember the silence.
  out = concat(out, span(device, 4001, block));
  device.set_param(p::kBeat, 2.0f);
  device.set_param(p::kTone, 0.2f);
  return concat(out, span(device, 9999, block));
}

// A full pool of soft keys, then louder keys that each take a voice: a
// seventeenth `lead` samples off the beat of the host's blocks, two more
// while its fade still runs (one of them let go before it starts), then the
// seventeenth again and one more. The new keys are louder than the pool, so
// none of them is the quietest voice and taken in its turn. `block` sets the
// host's block size (0 is ragged).
static Stereo across_a_steal(size_t lead, int block) {
  device.init(kRate);
  device.set_param(p::kScatter, 5.0f);
  for (int n = 0; n < TwinBars::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.5f);
  Stereo out = span(device, 4800 + lead, block);
  device.note_on(40, 777.0f, 0.9f);
  out = concat(out, span(device, 37, block));  // inside the 2 ms fade
  device.note_on(41, 555.0f, 0.8f);
  device.note_on(42, 333.0f, 0.9f);
  device.note_off(42);
  out = concat(out, span(device, 1000, block));
  device.note_on(40, 777.0f, 0.9f);
  device.note_on(43, 999.0f, 0.7f);
  return concat(out, span(device, 6000, block));
}

static void silences() {
  // A steal is the same sound at any block size: the note that takes a voice
  // starts on the sample the old one's fade ends, not at the end of the
  // host's block.
  {
    double worst = 0.0;
    int differing = 0, renders = 0;
    for (size_t lead : {0, 1, 17, 50, 100, 127}) {
      Stereo reference = across_a_steal(lead, 128);
      for (int block : {1, 32, 33, 2048, 0}) {
        const double apart = worst_difference(reference, across_a_steal(lead, block));
        if (apart >= 1.0e-6) ++differing;
        ++renders;
        worst = std::max(worst, apart);
      }
    }
    std::snprintf(label, sizeof label, "steals over a full pool, blocks of 1, 32, 33, 2048 and ragged against 128: %d of %d renders differ, the worst by %g",
                  differing, renders, worst);
    std::printf("%s\n", label);
    EXPECT(worst < 1.0e-6, label);
    // And the keys that took a voice do sound: the phrase is about steals.
    Stereo heard = across_a_steal(17, 128);
    const size_t from = 4817 + 37 + 1000 + 600;
    const double sounding = std::min(bin_level(heard.left, kRate, 777.0, from, 4800), bin_level(heard.left, kRate, 555.0, from, 4800));
    std::snprintf(label, sizeof label, "the keys that took a voice sound (the quieter of two at %.1f dB)", db(sounding));
    EXPECT(sounding > 1.0e-3, label);
  }

  // Silences stepped in 20 ms across the time the key takes to fall (0.13 s
  // at Damp 1) plus the idle hold (0.1 s) and a 2048 block more, and one long
  // one: blocks of 1, 2048 and a ragged mix against blocks of 128.
  double worst = 0.0;
  size_t worst_gap = 0;
  int worst_block = 0, differing = 0;
  std::vector<size_t> gaps;
  for (size_t gap = 0; gap <= 24000; gap += 960) gaps.push_back(gap);
  gaps.push_back(11111);
  gaps.push_back(144000);
  for (size_t gap : gaps) {
    Stereo reference = across_a_silence(gap, 128);
    for (int block : {1, 2048, 0}) {
      const double apart = worst_difference(reference, across_a_silence(gap, block));
      if (apart >= 1.0e-6) ++differing;
      if (apart > worst) {
        worst = apart;
        worst_gap = gap;
        worst_block = block;
      }
    }
  }
  std::snprintf(label, sizeof label,
                "%zu silences from 0 to 3 s, blocks of 1, 2048 and ragged against 128: %d renders differ, the worst by %g (a silence of %.3f s, block %d)",
                gaps.size(), differing, worst, worst_gap / static_cast<double>(kRate), worst_block);
  std::printf("%s\n", label);
  EXPECT(worst < 1.0e-6, label);

  // A knob moved in silence: the next key sounds as on a device set that way
  // from the start. The device is put to sleep off the beat of its control
  // clock (one odd block while the key still rings).
  for (int asleep = 0; asleep < 2; ++asleep) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      if (pass == 0) {
        device.set_param(p::kDamp, 1.0f);
        device.note_on(1, 220.0f, 0.8f);
        render(device, 0.2f, kRate);
        device.process(13);
        device.note_off(1);
        // Asleep after two seconds; after 0.18 s the last bar has rung out but the device is still awake.
        span(device, asleep ? 96000 : 8640, 128);
      }
      device.set_param(p::kBeat, 11.0f);
      device.set_param(p::kEars, 0.2f);
      device.set_param(p::kBar, static_cast<float>(TwinBars::kWood));
      device.set_param(p::kMallet, 0.9f);
      device.set_param(p::kDecay, 1.5f);
      device.set_param(p::kScatter, 12.0f);
      device.set_param(p::kDamp, 0.6f);
      device.set_param(p::kTone, 0.1f);
      device.set_param(p::kVolume, 0.0f);
      device.note_on(5, 330.0f, 0.7f);
      out[pass] = render(device, 0.5f, kRate);
    }
    const double apart = worst_difference(out[0], out[1]);
    std::snprintf(label, sizeof label, "every knob moved in silence (%s): the next key differs from a fresh device by %g", asleep ? "asleep" : "awake, no bar ringing", apart);
    std::printf("%s\n", label);
    EXPECT(apart < 1.0e-6, label);
  }
}

// --- How sudden each event is --------------------------------------------------------------

static void sudden() {
  // Every live control thrown from one end to the other, both ways, under
  // three soft low keys that ring: nothing is there at once.
  struct Throw {
    int id;
    const char* name;
  };
  const Throw live[5] = {{p::kVolume, "Volume"}, {p::kEars, "Ears"}, {p::kBeat, "Beat"}, {p::kTone, "Tone"}, {p::kDecay, "Decay"}};
  for (const Throw& control : live) {
    for (int way = 0; way < 2; ++way) {
      const float from = way == 0 ? p::kParamMin[control.id] : p::kParamMax[control.id];
      const float to = way == 0 ? p::kParamMax[control.id] : p::kParamMin[control.id];
      const int id = control.id;
      const double sharp = suddenness(
          [id, from](TwinBars& d) {
            d.set_param(id, from);
            if (id == p::kTone) {
              hard_chord(d);
            } else {
              soft_chord(d);
            }
          },
          [id, to](TwinBars& d) { d.set_param(id, to); });
      std::snprintf(label, sizeof label, "%s thrown from %g to %g under a ringing chord: suddenness %.3f (under 0.15)", control.name, from, to, sharp);
      std::printf("%s\n", label);
      EXPECT(sharp < 0.15, label);
    }
  }
  // Beat is smoothed too: a millisecond after the throw the bars have gone a
  // small part of the way to their new pitches. (No jump would be heard
  // either way, the bars keep their place in their swing; what the smoother
  // gives is a glide.)
  for (int way = 0; way < 2; ++way) {
    const float from = way == 0 ? 0.5f : 20.0f, to = way == 0 ? 20.0f : 0.5f;
    const double gone = moved_within(
        [from](TwinBars& d) {
          d.set_param(p::kBeat, from);
          soft_chord(d);
        },
        [to](TwinBars& d) { d.set_param(p::kBeat, to); }, 48);
    std::snprintf(label, sizeof label, "Beat thrown from %g to %g: a millisecond later the sound has moved %.4f of what it moves in 20 ms (under 0.025)", from, to,
                  gone);
    std::printf("%s\n", label);
    EXPECT(gone < 0.025, label);
  }
  // Tone is smoothed over milliseconds, not only ramped across one control
  // period (two thirds of a millisecond): one millisecond after the throw the
  // overtones have gone a small part of the way.
  for (int way = 0; way < 2; ++way) {
    const float from = way == 0 ? 0.0f : 1.0f;
    const double gone = moved_within(
        [from](TwinBars& d) {
          d.set_param(p::kTone, from);
          hard_chord(d);
        },
        [from](TwinBars& d) { d.set_param(p::kTone, 1.0f - from); }, 48);
    std::snprintf(label, sizeof label, "Tone thrown from %g to %g: a millisecond later the sound has gone %.3f of the way (under 0.4)", from, 1.0f - from, gone);
    std::printf("%s\n", label);
    EXPECT(gone < 0.4, label);
    // And it does not climb in steps of a control period: a step of the
    // smoothed value would be an eighth of the way at once.
    const double step = moved_within(
        [from](TwinBars& d) {
          d.set_param(p::kTone, from);
          hard_chord(d);
        },
        [from](TwinBars& d) { d.set_param(p::kTone, 1.0f - from); }, 4);
    std::snprintf(label, sizeof label, "Tone thrown from %g to %g: four samples later the sound has gone %.3f of the way (under 0.06)", from, 1.0f - from, step);
    std::printf("%s\n", label);
    EXPECT(step < 0.06, label);
  }
  // Damp works on a key that has been let go.
  for (int way = 0; way < 2; ++way) {
    const float from = way == 0 ? 0.0f : 1.0f;
    const double sharp = suddenness(
        [from](TwinBars& d) {
          d.set_param(p::kDamp, from);
          d.set_param(p::kDecay, 20.0f);
          soft_chord(d);
          for (int n = 1; n <= 3; ++n) d.note_off(n);
        },
        [from](TwinBars& d) { d.set_param(p::kDamp, 1.0f - from); });
    std::snprintf(label, sizeof label, "Damp thrown from %g to %g under let go keys: suddenness %.3f (under 0.15)", from, 1.0f - from, sharp);
    std::printf("%s\n", label);
    EXPECT(sharp < 0.15, label);
  }
  // Bar, Mallet and Scatter are read at the stroke: moved under a ringing chord they change nothing.
  for (int id : {static_cast<int>(p::kBar), static_cast<int>(p::kMallet), static_cast<int>(p::kScatter)}) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      soft_chord(device);
      render(device, 0.3f, kRate);
      if (pass == 1) device.set_param(id, p::kParamMax[id]);
      out[pass] = render(device, 0.3f, kRate);
    }
    std::snprintf(label, sizeof label, "param %d moved under a ringing chord changes nothing until the next stroke", id);
    EXPECT(out[0].left == out[1].left && out[0].right == out[1].right, label);
  }

  // A key let go at Damp 1.
  {
    const double sharp = suddenness(
        [](TwinBars& d) {
          d.set_param(p::kDamp, 1.0f);
          soft_chord(d);
        },
        [](TwinBars& d) {
          for (int n = 1; n <= 3; ++n) d.note_off(n);
        });
    std::snprintf(label, sizeof label, "three keys let go at Damp 1: suddenness %.3f (under 0.15)", sharp);
    std::printf("%s\n", label);
    EXPECT(sharp < 0.15, label);
  }
  // A key struck again, soft and low: the stroke goes with the bar's swing.
  {
    const double sharp = suddenness(soft_chord, [](TwinBars& d) { d.note_on(1, 110.0f, 0.8f); });
    std::snprintf(label, sizeof label, "a soft low key struck again: suddenness %.3f (under 0.15)", sharp);
    std::printf("%s\n", label);
    EXPECT(sharp < 0.15, label);
  }
  // A steal by a key too soft to cover it: sixteen loud low keys and a very
  // soft high one. The voice that goes still counts towards the room while
  // it fades, so the room does not open at once on the fifteen that stay.
  {
    const double sharp = suddenness(
        [](TwinBars& d) {
          d.set_param(p::kMallet, 0.0f);
          d.set_param(p::kTone, 0.0f);
          d.set_param(p::kDecay, 20.0f);
          for (int n = 0; n < TwinBars::kMaxVoices; ++n) d.note_on(n, 60.0f + 4.0f * n, 1.0f);
        },
        [](TwinBars& d) { d.note_on(40, 3000.0f, 0.02f); });
    std::snprintf(label, sizeof label, "sixteen loud low keys and a very soft high one (a loud voice taken): suddenness %.3f (under 0.15)", sharp);
    std::printf("%s\n", label);
    EXPECT(sharp < 0.15, label);
  }
  // A steal: a full pool of soft low keys, and one more.
  {
    const double sharp = suddenness(
        [](TwinBars& d) {
          d.set_param(p::kMallet, 0.0f);
          d.set_param(p::kBar, static_cast<float>(TwinBars::kGlass));
          for (int n = 0; n < TwinBars::kMaxVoices; ++n) d.note_on(n, 80.0f + 9.0f * n, 0.8f);
        },
        [](TwinBars& d) { d.note_on(40, 123.0f, 0.5f); });
    std::snprintf(label, sizeof label, "a seventeenth soft low key (a steal): suddenness %.3f (under 0.15)", sharp);
    std::printf("%s\n", label);
    EXPECT(sharp < 0.15, label);
  }
}

// --- A second init, cost -------------------------------------------------------------------

static Stereo busy_phrase() {
  device.init(kRate);
  device.set_param(p::kScatter, 9.0f);
  for (int n = 0; n < TwinBars::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  Stereo out = render(device, 0.2f, kRate);
  device.note_on(3, 110.0f * std::pow(2.0f, 6 / 12.0f), 0.9f);  // struck again
  device.note_on(50, 777.0f, 0.7f);                              // a steal
  device.set_param(p::kBeat, 7.0f);
  device.set_param(p::kTone, 0.9f);
  out = concat(out, render(device, 0.2f, kRate));
  for (int n = 0; n < TwinBars::kMaxVoices; ++n) device.note_off(n);
  return concat(out, render(device, 0.3f, kRate));
}

static void again_and_cost() {
  Stereo a = busy_phrase();
  render(device, 0.7f, kRate);
  Stereo b = busy_phrase();
  EXPECT(a.left == b.left && a.right == b.right, "a second init gives the same render: a full pool, a key struck again, a steal, knobs moved");

  // Cost with every voice in use: sixteen metal keys left to ring, and the
  // same with Beat on the move, which retunes every bar on every control tick.
  device.init(kRate);
  device.set_param(p::kDecay, 20.0f);
  device.set_param(p::kDamp, 0.0f);
  for (int n = 0; n < TwinBars::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 0.5f, kRate);
  const std::clock_t began = std::clock();
  report_cost("twin-bars (16 keys ringing, 128 modes)", 5.0f, kRate, [&] { render(device, 5.0f, kRate); });
  std::printf("the same by CPU time: %.2f%% of real time at 48 kHz (native)\n",
              100.0 * static_cast<double>(std::clock() - began) / CLOCKS_PER_SEC / 5.0);
  report_cost("twin-bars (16 keys ringing, Beat moved every 128 frames)", 5.0f, kRate, [&] {
    for (int k = 0; k < 1875; ++k) {
      device.set_param(p::kBeat, 4.0f + 3.0f * std::sin(k * 0.01f));
      device.process(128);
    }
  });
}


int main() {
  Conformance spec;
  spec.name = "twin-bars";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // A key let go at the defaults falls 60 dB in 1.6 s and is retired at
  // -120 dB: under 3 s for the loudest pile.
  spec.tail_seconds = 5.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  the_pair();
  the_ears();
  the_decay();
  the_materials();
  the_mallet_and_tone();
  the_scatter();
  the_damp();
  struck_again();
  the_beat_carries_on();
  the_levels();
  stealing();
  silences();
  sudden();
  again_and_cost();

  return finish("twin-bars");
}
