// Native harness for Buzzing Bridge (cpp/devices/buzzing-bridge). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest measures what makes it a buzz
// and not a distortion: a band that climbs from partial to partial as a note
// dies, a skin that soft notes do not wake, shells that only attacks knock,
// partials that belong to the note, and a sound that is itself left alone.

#include "../devices/buzzing-bridge/buzzing_bridge.h"
#include "support/test_kit.h"

#include <limits>

using namespace testkit;
using livemix::BuzzingBridge;
namespace p = livemix::buzzing_bridge;

static BuzzingBridge device;
static const float kRate = 48000.0f;

using Signal = std::vector<float>;
struct Setting {
  int id;
  float value;
};

static void set_up(const std::vector<Setting>& settings, float rate = kRate) {
  device.init(rate);
  for (const Setting& s : settings) device.set_param(s.id, s.value);
}
static Stereo through(const std::vector<Setting>& settings, const Signal& x, float rate = kRate, int block = kBlock) {
  set_up(settings, rate);
  return run(device, x, block);
}
// What was added: the output less the input.
static Signal less(const Signal& a, const Signal& b) {
  Signal out(a.size());
  for (size_t i = 0; i < a.size(); ++i) out[i] = a[i] - b[i];
  return out;
}
static Signal buzz_of(const std::vector<Setting>& settings, const Signal& x, float rate = kRate) {
  return less(through(settings, x, rate).left, x);
}
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// A harp's pluck: forty partials, the upper ones weaker and dying sooner.
static Signal pluck(double hz, double seconds, double amp, double t60, double rate = kRate) {
  Signal x(at(seconds, rate), 0.0f);
  for (int k = 1; k <= 40 && k * hz < 0.4 * rate; ++k) {
    const double a = amp * 0.6 * std::pow(k, -1.3), tau = t60 / (1.0 + 0.35 * (k - 1)) / 6.9;
    for (size_t i = 0; i < x.size(); ++i) {
      const double t = i / rate;
      x[i] += static_cast<float>(a * std::exp(-t / tau) * std::min(1.0, t / 0.002) * std::sin(2 * kPi * hz * k * t + 0.3 * k));
    }
  }
  return x;
}
// A struck bar: its tone and two partials that are not harmonics.
static Signal bar(double hz, double seconds, double amp, double t60, double rate = kRate) {
  Signal x(at(seconds, rate), 0.0f);
  const double ratio[3] = {1.0, 3.93, 9.2}, gain[3] = {1.0, 0.25, 0.06};
  for (int k = 0; k < 3; ++k) {
    for (size_t i = 0; i < x.size(); ++i) {
      const double t = i / rate;
      x[i] += static_cast<float>(amp * gain[k] * std::exp(-6.9 * t * (1 + 2 * k) / t60) * std::min(1.0, t / 0.0015) *
                                 std::sin(2 * kPi * hz * ratio[k] * t));
    }
  }
  return x;
}
// Voices: four notes, four singers each, vibrato and three formants.
static Signal voices(double seconds, double rate = kRate) {
  Signal x(at(seconds, rate), 0.0f);
  rng_state() = 77;
  for (double note : {196.0, 246.9, 293.7, 392.0}) {
    for (int v = 0; v < 4; ++v) {
      double start[30];
      const double detune = 1.0 + 0.003 * white(), speed = 4.5 + white(), turn = 3.0 * white();
      for (double& s : start) s = 3.14 * white();
      double gain[30] = {};
      for (int k = 1; k < 30 && k * note < 9000; ++k) {
        const double hz = k * note;
        gain[k] = (std::exp(-std::pow((hz - 600) / 350, 2)) + 0.5 * std::exp(-std::pow((hz - 1100) / 250, 2)) +
                   0.12 * std::exp(-std::pow((hz - 2800) / 500, 2)) + 0.01) /
                  std::sqrt(static_cast<double>(k));
      }
      double phase = 0.0;
      for (size_t i = 0; i < x.size(); ++i) {
        const double t = i / rate;
        phase += 2 * kPi * note * detune * (1.0 + 0.004 * std::sin(2 * kPi * speed * t + turn)) / rate;
        double s = 0.0;
        for (int k = 1; k < 30; ++k) {
          if (gain[k] > 0.0) s += gain[k] * std::sin(k * phase + start[k]);
        }
        x[i] += static_cast<float>(0.02 * std::min(1.0, t / 0.25) * s);
      }
    }
  }
  return x;
}
static Signal saw(double hz, double seconds, double amp, double rate = kRate) {
  Signal x(at(seconds, rate), 0.0f);
  for (int k = 1; k <= 60 && k * hz < 16000.0; ++k) {
    for (size_t i = 0; i < x.size(); ++i) x[i] += static_cast<float>(amp / k * std::sin(2 * kPi * hz * k * i / rate));
  }
  return x;
}
static void lay(Signal& x, const Signal& y, size_t from) {
  if (x.size() < from + y.size()) x.resize(from + y.size(), 0.0f);
  for (size_t i = 0; i < y.size(); ++i) x[from + i] += y[i];
}

// RMS over [from, to) of what is over `hz` (fourth order).
static double above(const Signal& x, double hz, size_t from, size_t to, float rate = kRate) {
  livemix::kit::Biquad a, b;
  a.set_highpass(static_cast<float>(hz), 0.541f, rate);
  b.set_highpass(static_cast<float>(hz), 1.307f, rate);
  double sum = 0.0;
  for (size_t i = 0; i < to && i < x.size(); ++i) {
    const double y = b.process(a.process(x[i]));
    if (i >= from) sum += y * y;
  }
  return std::sqrt(sum / static_cast<double>(to - from));
}

static const char* kNames[] = {"grazing", "membrane", "shell", "leather", "paper"};

// --- the five examples -------------------------------------------------------------------

// Where the buzz stands, in partials of `hz`: the mean partial by power.
static double centroid(const Signal& b, double hz, size_t from, size_t to) {
  double sum = 0.0, weight = 0.0;
  for (int k = 1; k <= 30; ++k) {
    const double l = tone_level(b, hz * k, kRate, from, to);
    sum += k * l * l;
    weight += l * l;
  }
  return sum / weight;
}

static void test_climb() {
  const double hz = 146.83;
  const Signal x = pluck(hz, 3.0, 0.5, 5.0);
  const Signal b = buzz_of({{p::kAmount, 0.25f}, {p::kCurve, 0.6f}, {p::kTracking, 1.0f}, {p::kThreshold, -50.0f}}, x);
  double last = 0.0, first = 0.0, end = 0.0, reached = 0.0;
  bool rises = true;
  std::printf("climb (partial):");
  for (double t = 0.1; t < 2.05; t += 0.2) {
    const double c = centroid(b, hz, at(t), at(t + 0.15));
    std::printf(" %.1fs %.2f", t, c);
    if (t < 0.15) first = c;
    if (c < last - 0.1) rises = false;
    if (c > 3.4 && c < 11.0) reached = t;
    last = end = c;
  }
  std::printf("\n");
  EXPECT(first > 2.6 && first < 4.2, "a pluck starts about the third partial");
  EXPECT(end > 10.0 && end < 13.5, "and climbs to about the twelfth");
  EXPECT(rises, "never going back");
  EXPECT(reached > 1.2, "and takes over 1.2 s");

  // Curve is how far: flat, it stays.
  const Signal flat = buzz_of({{p::kAmount, 0.25f}, {p::kCurve, 0.0f}, {p::kThreshold, -50.0f}}, x);
  const Signal round = buzz_of({{p::kAmount, 0.25f}, {p::kCurve, 1.0f}, {p::kThreshold, -50.0f}}, x);
  const double stays = centroid(flat, hz, at(1.8), at(1.95));
  const double far = centroid(round, hz, at(1.8), at(1.95));
  std::printf("at 1.8 s: Curve 0 partial %.2f, Curve 1 partial %.2f\n", stays, far);
  EXPECT(stays < 4.5, "Curve 0 stays near the third");
  EXPECT(far > 14.0, "Curve 1 climbs past the twelfth");

  // Tracking: the same pluck an octave up is on the same partials; untracked
  // it is at the same hertz.
  double ratio[2];
  for (int tracked = 0; tracked < 2; ++tracked) {
    double place[2];
    for (int octave = 0; octave < 2; ++octave) {
      set_up({{p::kTracking, static_cast<float>(tracked)}, {p::kThreshold, -50.0f}, {p::kCurve, 0.0f}});
      run(device, pluck(hz * (1 + octave), 0.5, 0.5, 5.0));
      place[octave] = device.meter(2);
    }
    ratio[tracked] = place[1] / place[0];
  }
  EXPECT_NEAR(ratio[0], 1.0, 0.02, "Tracking 0 does not move with pitch");
  EXPECT_NEAR(ratio[1], 2.0, 0.03, "Tracking 1 moves with pitch");
}

static void test_membrane() {
  const std::vector<Setting> skin = {{p::kModel, 1}, {p::kResonance, 2400}, {p::kThreshold, -26}};
  auto band = [](const Signal& x) {
    double sum = 0.0;
    for (double hz = 2000; hz <= 3000; hz += 20) {
      const double l = tone_level(x, hz, kRate, 1000, 12000);
      sum += l * l;
    }
    return std::sqrt(sum);
  };
  for (double note : {196.0, 261.63, 329.63}) {
    const Signal loud = bar(note, 0.6, 0.32, 0.6), soft = bar(note, 0.6, 0.036, 0.6);
    const Stereo hard = through(skin, loud), quiet = through(skin, soft);
    const double gained = db(band(hard.left) / band(loud));
    const double share = db(band(less(hard.left, loud)) / tone_level(loud, note, kRate, 1000, 12000));
    std::printf("membrane %.0f Hz: loud (%.1f dBFS) 2 to 3 kHz +%.1f dB, %.1f dB under the note; soft (%.1f dBFS) %.3f dB\n",
                note, db(peak(loud)), gained, share, db(peak(soft)), db(rms(quiet.left) / rms(soft)));
    EXPECT(gained > 10.0, "a loud note gains 2 to 3 kHz");
    EXPECT(share > -30.0, "by something to be heard");
    EXPECT(quiet.left == soft, "a soft note is exactly plain");
  }
  // Growing with how far over.
  double last = -300.0;
  bool grows = true;
  for (double amp : {0.06, 0.1, 0.2, 0.4}) {
    const Signal x = bar(220, 0.6, amp, 0.6);
    const double share = db(rms(buzz_of(skin, x)) / rms(x));
    if (share < last + 0.5) grows = false;
    last = share;
  }
  EXPECT(grows, "the skin speaks up as notes rise over Threshold");
}

// Bursts in `b`: starts of stretches over `floor`, a stretch ending after
// `gap` seconds under a fifth of its top.
static std::vector<double> bursts(const Signal& b, double floor, double* tops = nullptr, int most = 0) {
  std::vector<double> found;
  const size_t hop = 24;  // half a millisecond
  double valley = 0.0, top = 0.0;
  bool in = false;
  for (size_t s = 0; s + 2 * hop <= b.size(); s += hop) {
    const double l = peak(b, s, s + 2 * hop);
    if (!in) {
      valley = std::min(valley, l);
      if (l > floor && l > 4.0 * valley) {
        in = true;
        top = l;
        found.push_back(s / static_cast<double>(kRate));
      }
    } else {
      top = std::max(top, l);
      if (tops != nullptr && static_cast<int>(found.size()) <= most) tops[found.size() - 1] = top;
      if (l < 0.2 * top) {
        in = false;
        valley = l;
      }
    }
  }
  return found;
}

static void test_shell() {
  const std::vector<Setting> shell = {{p::kModel, 2}, {p::kRattle, 40}, {p::kBounces, 3}, {p::kMix, 0.2f}, {p::kTone, 5000}, {p::kThreshold, -40}};
  // Three struck notes, 1.2 s apart, the last at 2.4 s and held to 4 s.
  Signal x(at(4.0), 0.0f);
  for (int n = 0; n < 3; ++n) lay(x, pluck(196.0 * (1 + 0.25 * n), 1.2, 0.5, 2.0), at(1.2 * n));
  lay(x, Signal(), 0);
  Signal b = less(through(shell, x).left, x);
  double tops[64] = {};
  const std::vector<double> found = bursts(b, 0.002, tops, 64);
  std::printf("shell bursts:");
  for (size_t i = 0; i < found.size(); ++i) std::printf(" %.1fms(%.3f)", found[i] * 1000, tops[i]);
  std::printf("\n");
  EXPECT(found.size() == 9, "three bursts after each of three attacks, and no other");
  if (found.size() == 9) {
    double first_gap = 0.0, second_gap = 0.0, one = 0.0, three = 0.0;
    for (int n = 0; n < 3; ++n) {
      EXPECT_NEAR(found[3 * n], 1.2 * n, 0.012, "they start with the attack");
      first_gap += found[3 * n + 1] - found[3 * n];
      second_gap += found[3 * n + 2] - found[3 * n + 1];
      one += tops[3 * n];
      three += tops[3 * n + 2];
    }
    EXPECT(second_gap < 0.85 * first_gap, "closer together");
    EXPECT(three < 0.8 * one, "and softer");
    EXPECT_NEAR((first_gap + second_gap) / 3, 0.040, 0.005, "over Rattle");
  }
  EXPECT(peak(b, at(0.15), at(1.19)) < 1.0e-4, "nothing in the sustain");

  // Bounces is the count.
  for (int count : {1, 2, 5, 8}) {
    const Signal y = pluck(220, 1.2, 0.5, 2.0);
    const Signal c = buzz_of({{p::kModel, 2}, {p::kRattle, 300}, {p::kBounces, static_cast<float>(count)}, {p::kThreshold, -40}, {p::kFall, 6000}, {p::kCurve, 0.1f}}, y);
    const size_t n = bursts(c, 0.004).size();
    char label[80];
    std::snprintf(label, sizeof label, "%d bounces are heard as %zu", count, n);
    EXPECT(static_cast<int>(n) == count, label);
  }
  // A held chord that beats, and voices with vibrato, are not attacks.
  Signal held(at(4.0), 0.0f);
  for (double hz : {220.0, 221.5, 277.2, 329.6, 331.0}) lay(held, saw(hz, 4.0, 0.08), 0);
  const Signal c = buzz_of(shell, held), v = buzz_of(shell, voices(4.0));
  std::printf("shell in a beating chord after the attack: %.1f dBFS; in voices: %.1f dBFS\n", db(peak(c, at(0.2), c.size())),
              db(peak(v, at(0.6), v.size())));
  EXPECT(peak(c, at(0.2), c.size()) < 1.0e-5, "nothing in a chord that beats");
  EXPECT(peak(v, at(0.6), v.size()) < 1.0e-5, "nothing in held voices");
  // Eight notes a second, each ringing over the last: most are knocked.
  Signal run_of_notes;
  const double notes[] = {220, 277, 330, 440, 330, 277, 220, 165};
  for (int i = 0; i < 8; ++i) lay(run_of_notes, pluck(notes[i], 1.5, 0.3, 2.0), at(0.125 * i));
  const Signal knocked = buzz_of({{p::kModel, 2}, {p::kRattle, 10}, {p::kBounces, 1}, {p::kThreshold, -50}}, run_of_notes);
  int heard = 0;
  for (int i = 0; i < 8; ++i) heard += peak(knocked, at(0.125 * i), at(0.125 * i + 0.02)) > 0.01 ? 1 : 0;
  std::printf("eight ringing notes a second: %d knocked\n", heard);
  EXPECT(heard >= 7, "a fast run of ringing notes is heard as attacks");
}

static void test_paper_edge() {
  const Signal x = voices(3.0);
  for (int model : {1, 4}) {
    const Stereo out = through({{p::kModel, static_cast<float>(model)}, {p::kAmount, 0.08f}, {p::kThreshold, -32}}, x);
    const double top = db(above(out.left, 3000, at(1), at(3)) / above(x, 3000, at(1), at(3)));
    const double all = db(rms(out.left, at(1), at(3)) / rms(x, at(1), at(3)));
    std::printf("voices at Amount 0.08, %s: over 3 kHz %+.2f dB, all %+.2f dB\n", kNames[model], top, all);
    EXPECT(top > (model == 4 ? 1.0 : 0.6) && top < 3.0, "a paper edge: 1 to 3 dB over 3 kHz");
    EXPECT(std::fabs(all) < 0.2, "and no other change");
  }
}

static void test_sine() {
  const Signal x = sine(55.0f, 3.0f, kRate, 0.3f);
  const Stereo out = through({{p::kAmount, 0.5f}, {p::kThreshold, -50}}, x);
  std::printf("55 Hz sine, partials:");
  for (int k = 2; k <= 12; ++k) {
    const double l = db(tone_level(out.left, 55.0 * k, kRate, at(1.5), at(3)) / 0.3);
    std::printf(" %d: %.1f", k, l);
    EXPECT(l > -60.0, "every partial from 2 to 12 is there");
  }
  double other = 0.0;
  for (double hz = 60.0; hz < 12000.0; hz += 7.3) {
    if (std::fabs(hz / 55.0 - std::round(hz / 55.0)) * 55.0 < 5.0) continue;
    other = std::max(other, tone_level(out.left, hz, kRate, at(1.5), at(3)));
  }
  std::printf("; between them %.1f dB\n", db(other / 0.3));
  EXPECT(db(other / 0.3) < -50.0, "and nothing between them");
  EXPECT_NEAR(db(tone_level(out.left, 55.0, kRate, at(1.5), at(3)) / 0.3), 0.0, 0.3, "the sine is as it was");
}

// --- the sound itself --------------------------------------------------------------------

static void test_plain() {
  Signal l = pluck(220, 1.0, 0.6, 2.0), r = saw(330, 1.0, 0.2);
  for (int model = 0; model < BuzzingBridge::kModels; ++model) {
    for (int which = 0; which < 3; ++which) {
      std::vector<Setting> s = {{p::kModel, static_cast<float>(model)}, {p::kDistance, 0.4f}, {p::kWidth, 1.0f}};
      if (which == 0) s.push_back({p::kAmount, 0.0f});
      if (which == 1) s.push_back({p::kMix, 0.0f});
      if (which == 2) s.push_back({p::kThreshold, 0.0f});  // both are under full scale
      set_up(s);
      const Stereo out = run(device, l, r);
      char label[96];
      std::snprintf(label, sizeof label, "%s: %s leaves the sound bit for bit", kNames[model],
                    which == 0 ? "Amount 0" : (which == 1 ? "Mix 0" : "under Threshold"));
      EXPECT(out.left == l && out.right == r, label);
    }
  }
}

static void test_level() {
  // Full Amount on simple sounds: never much louder than what came in.
  double worst_rms = -99, worst_peak = -99, worst_buzz = -99, least_buzz = 99;
  for (int model = 0; model < BuzzingBridge::kModels; ++model) {
    for (double hz : {55.0, 110.0, 220.0, 440.0, 880.0, 1760.0}) {
      for (int kind = 0; kind < 2; ++kind) {
        const Signal x = kind == 0 ? sine(static_cast<float>(hz), 1.0f, kRate, 0.25f) : saw(hz, 1.0, 0.15);
        const Stereo out = through({{p::kModel, static_cast<float>(model)}, {p::kAmount, 1}, {p::kTone, 16000}, {p::kThreshold, -50}}, x);
        const double up = db(rms(out.left, at(0.5), at(1)) / rms(x, at(0.5), at(1)));
        const double crest = db(peak(out.left) / peak(x));
        const double buzz = db(rms(less(out.left, x), at(0.5), at(1)) / rms(x, at(0.5), at(1)));
        worst_rms = std::max(worst_rms, up);
        worst_peak = std::max(worst_peak, crest);
        if (model != 2) {
          worst_buzz = std::max(worst_buzz, buzz);
          least_buzz = std::min(least_buzz, buzz);
        }
      }
    }
  }
  const Signal hiss = noise(1.0f, kRate, 0.5f);
  for (int model = 0; model < BuzzingBridge::kModels; ++model) {
    const Stereo out = through({{p::kModel, static_cast<float>(model)}, {p::kAmount, 1}, {p::kTone, 16000}}, hiss);
    worst_peak = std::max(worst_peak, db(peak(out.left) / peak(hiss)));
    worst_rms = std::max(worst_rms, db(rms(out.left) / rms(hiss)));
  }
  std::printf("Amount 1: output over input %.1f dB rms, %.1f dB peak; buzz against the sound %.1f to %.1f dB\n", worst_rms,
              worst_peak, least_buzz, worst_buzz);
  EXPECT(worst_rms < 4.0, "at Amount 1 no more than 4 dB louder");
  EXPECT(worst_peak < 6.02, "at Amount 1 peaks no more than 6 dB over");
  EXPECT(worst_buzz < 0.5, "the buzz is no louder than the sound");
  EXPECT(least_buzz > -16.0, "nor lost under it");

  // It follows the level: 18 dB down is 18 dB down.
  for (int model : {0, 2, 3, 4}) {
    const Signal loud = pluck(196, 1.5, 0.4, 3.0);
    Signal soft = loud;
    for (float& v : soft) v *= 0.125893f;
    const std::vector<Setting> s = {{p::kModel, static_cast<float>(model)}, {p::kThreshold, -60}};
    const double a = rms(buzz_of(s, loud)), b = rms(buzz_of(s, soft));
    char label[80];
    std::snprintf(label, sizeof label, "%s: from -30 dBFS as from -12", kNames[model]);
    EXPECT_NEAR(db(a / b), 18.0, 0.5, label);
  }
  // Mix and Amount go up all the way, with no dip where the buzz meets
  // partials the sound has.
  for (int model : {0, 1, 3, 4}) {
    for (double hz : {130.81, 246.9, 440.0, 739.99}) {
      const Signal x = saw(hz, 0.8, 0.2);
      for (int id : {static_cast<int>(p::kMix), static_cast<int>(p::kAmount)}) {
        double last = 0.0;
        bool up = true;
        for (float v : {0.0f, 0.2f, 0.4f, 0.6f, 0.8f, 1.0f}) {
          const Stereo out = through({{p::kModel, static_cast<float>(model)}, {id == p::kMix ? static_cast<int>(p::kAmount) : static_cast<int>(p::kMix), 1.0f}, {id, v}, {p::kThreshold, -50}}, x);
          const double l = db(rms(out.left, at(0.4), at(0.8)) / rms(x, at(0.4), at(0.8)));
          if (l < last - 0.15) up = false;
          last = std::max(l, last);
        }
        char label[96];
        std::snprintf(label, sizeof label, "%s at %.0f Hz: %s only adds", kNames[model], hz, id == p::kMix ? "Mix" : "Amount");
        EXPECT(up, label);
      }
    }
  }
  // Output.
  const Signal x = pluck(220, 0.5, 0.3, 2.0);
  const Stereo flat = through({}, x), up = through({{p::kOutput, 6.0f}}, x);
  EXPECT_NEAR(db(rms(up.left) / rms(flat.left)), 6.0, 0.02, "Output is decibels");
}

static void test_pitch() {
  double worst = 0.0;
  int missed = 0;
  for (double hz = 41.2; hz < 1900.0; hz *= 1.0905) {
    for (int kind = 0; kind < 3; ++kind) {
      const Signal x = kind == 0 ? pluck(hz, 0.4, 0.4, 3.0) : (kind == 1 ? sine(static_cast<float>(hz), 0.4f, kRate, 0.2f) : saw(hz, 0.4, 0.2));
      set_up({});
      run(device, x);
      const double cents = 1200.0 * std::log2(std::max(1.0, static_cast<double>(device.meter(5))) / hz);
      if (std::fabs(cents) > 60.0) {
        ++missed;
        std::printf("pitch: %.1f Hz (%d) read as %.1f\n", hz, kind, device.meter(5));
      } else {
        worst = std::max(worst, std::fabs(cents));
      }
    }
  }
  std::printf("pitch: worst %.1f ct, %d missed\n", worst, missed);
  EXPECT(missed == 0, "a pitch from 41 Hz to 1.9 kHz is read in its octave");
  EXPECT(worst < 12.0, "within 12 cents");
  // A chord is not its common period's partial but a note's.
  Signal chord(at(1.5), 0.0f);
  for (double hz : {220.0, 277.2, 329.6}) lay(chord, saw(hz, 1.5, 0.1), 0);
  set_up({});
  run(device, chord);
  EXPECT(device.meter(5) == 0.0f || device.meter(5) > 200.0f, "a chord's pitch is not under the chord");
}

static void test_fold() {
  for (int model : {0, 1, 3, 4}) {
    for (double hz : {5000.0, 3500.0, 1250.0}) {
      const Signal x = sine(static_cast<float>(hz), 3.0f, kRate, 0.5f);
      const Stereo out = through({{p::kModel, static_cast<float>(model)}, {p::kAmount, 1}, {p::kTone, 16000}, {p::kResonance, 6000}, {p::kThreshold, -50}}, x);
      double worst = 0.0;
      // Every multiple of 250 Hz that is no harmonic is where one would fold
      // to; counted over what is just beside it, so that breath and paper do
      // not count.
      for (double f = 250.0; f < 20000.0; f += 250.0) {
        const double part = f / (model == 3 ? 0.5 * hz : hz);
        if (std::fabs(part - std::round(part)) < 0.02) continue;
        const double l = tone_level(out.left, f, kRate, at(1), at(3));
        double beside = 0.0;
        for (double d : {-11.0, 11.0}) beside += 0.5 * tone_level(out.left, f + d, kRate, at(1), at(3));
        worst = std::max(worst, l - 4.0 * beside);
      }
      std::printf("fold-back, %s %.0f Hz: %.1f dB\n", kNames[model], hz, db(worst / 0.5));
      EXPECT(db(worst / 0.5) < -60.0, "the contact folds back under -60 dB");
    }
  }
}

static void test_fall() {
  const Signal x = pluck(146.83, 3.0, 0.5, 2.5);
  double share[3];
  int n = 0;
  for (float fall : {60.0f, 1000.0f, 6000.0f}) {
    const Signal b = buzz_of({{p::kFall, fall}, {p::kCurve, 0.0f}, {p::kThreshold, -60}}, x);
    share[n++] = db(rms(b, at(1.2), at(1.6)) / rms(b, at(0.1), at(0.2)));
  }
  const double own = db(rms(x, at(1.2), at(1.6)) / rms(x, at(0.1), at(0.2)));
  std::printf("a note falls %.1f dB, its buzz %.1f at Fall 60 ms, %.1f at 1 s, %.1f at 6 s\n", own, share[0], share[1], share[2]);
  EXPECT(share[0] < share[1] - 8.0 && share[1] < share[2] - 5.0, "Fall is how soon the buzz dies");
  EXPECT_NEAR(share[1], own, 4.0, "at a second it dies with the sound");
  // The sound gone, the buzz goes.
  for (int model = 0; model < BuzzingBridge::kModels; ++model) {
    Signal cut = sine(220, 1.0f, kRate, 0.4f);
    for (size_t i = at(0.5); i < cut.size(); ++i) cut[i] = 0.0f;
    const Stereo out = through({{p::kModel, static_cast<float>(model)}, {p::kFall, 6000}, {p::kThreshold, -60}}, cut);
    EXPECT(db(peak(out.left, at(0.6), at(0.7))) < -60.0, "nothing buzzes on its own");
  }
}

// --- room and sides ----------------------------------------------------------------------

static void test_sides() {
  const Signal x = pluck(220, 1.0, 0.5, 2.0), none(x.size(), 0.0f);
  Signal turned = x;
  for (float& v : turned) v = -v;
  for (int model = 0; model < BuzzingBridge::kModels; ++model) {
    const Setting m = {p::kModel, static_cast<float>(model)};
    Stereo out = through({m, {p::kDistance, 0.5f}}, x);
    EXPECT(out.left == out.right, "mono in is mono out");
    const Stereo narrow = through({m}, x), wide = through({m, {p::kWidth, 1.0f}}, x);
    double worst = 0.0;
    for (size_t i = 0; i < x.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(narrow.left[i] + narrow.right[i]) - (wide.left[i] + wide.right[i])));
    }
    const double apart = correlation(less(wide.left, x), less(wide.right, x));
    EXPECT(worst < 1.0e-5, "Width leaves the two sides together as they were");
    char label[80];
    std::snprintf(label, sizeof label, "%s: Width spreads the buzz (correlation %.2f)", kNames[model], apart);
    EXPECT(apart < 0.55, label);
    set_up({m});
    out = run(device, x, none);
    EXPECT(peak(out.right) == 0.0, "a buzz comes from the side its sound is on");
    set_up({m, {p::kWidth, 0.0f}});
    out = run(device, x, turned);
    EXPECT(rms(less(out.left, x)) > 1.0e-3, "out of phase between the sides it still buzzes");
  }
}

static void test_distance() {
  Signal x = pluck(220, 0.5, 0.5, 1.0);
  x.resize(at(2.0), 0.0f);
  for (int model : {1, 2, 4}) {
    const Setting m = {p::kModel, static_cast<float>(model)};
    const Signal here = buzz_of({m, {p::kThreshold, -60}}, x), there = buzz_of({m, {p::kThreshold, -60}, {p::kDistance, 1.0f}}, x);
    auto starts = [](const Signal& b) {
      const double floor = 0.1 * peak(b);
      for (size_t i = 0; i < b.size(); ++i) {
        if (std::fabs(b[i]) > floor) return i / static_cast<double>(kRate);
      }
      return 0.0;
    };
    const double dull = energy_above(there, 1500, kRate) / energy_above(here, 1500, kRate);
    std::printf("distance, %s: %.1f ms later, %.1f dB softer, share over 1.5 kHz x%.2f, its tail %.1f dB\n", kNames[model],
                1000 * (starts(there) - starts(here)), db(rms(here) / rms(there)), dull,
                db(rms(there, at(0.6), at(0.8)) / rms(there)));
    EXPECT(starts(there) - starts(here) > 0.035, "the next room is later");
    EXPECT(rms(there) < 0.6 * rms(here), "softer");
    EXPECT(dull < 0.9, "duller");
    EXPECT(rms(there, at(0.6), at(0.8)) > 3.0 * rms(here, at(0.6), at(0.8)), "with walls");
    for (float distance : {0.3f, 1.0f}) {
      const Stereo out = through({m, {p::kAmount, 0.0f}, {p::kDistance, distance}}, x);
      EXPECT(out.left == x, "and the sound stays here");
    }
  }
}

// --- time ------------------------------------------------------------------------------------

static Stereo in_blocks(const Signal& x, const std::vector<int>& sizes, size_t move_at, const std::vector<Setting>& moved) {
  Stereo out;
  out.left.resize(x.size());
  out.right.resize(x.size());
  size_t done = 0, which = 0;
  bool sent = false;
  while (done < x.size()) {
    size_t frames = std::min(static_cast<size_t>(sizes[which++ % sizes.size()]), x.size() - done);
    if (!sent && done >= move_at) {
      for (const Setting& s : moved) device.set_param(s.id, s.value);
      sent = true;
    } else if (!sent && done + frames > move_at) {
      frames = move_at - done;  // so every block size moves it on the same sample
    }
    for (size_t i = 0; i < frames; ++i) device.in_left()[i] = device.in_right()[i] = x[done + i];
    device.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = device.out_left()[i];
      out.right[done + i] = device.out_right()[i];
    }
    done += frames;
  }
  return out;
}

static void test_sleep() {
  const std::vector<std::vector<int>> sizes = {{128}, {1}, {2048}, {1, 7, 64, 128, 33, 512, 2048, 5}};
  double worst = 0.0;
  for (int model = 0; model < BuzzingBridge::kModels; ++model) {
    for (double gap : {0.45, 0.59, 0.60, 0.62, 0.64, 0.66, 0.70, 1.9}) {
      Signal x = bar(220, 0.15, 0.5, 0.15);
      for (size_t i = at(0.1); i < x.size(); ++i) x[i] = 0.0f;
      const size_t second = at(0.1 + gap);
      lay(x, pluck(330, 0.2, 0.5, 0.6), second);
      Stereo reference;
      for (size_t which = 0; which < sizes.size(); ++which) {
        if (which == 1 && gap > 0.65) continue;
        set_up({{p::kModel, static_cast<float>(model)}, {p::kThreshold, -50}, {p::kWidth, 0.6f}, {p::kDistance, gap > 1 ? 0.3f : 0.0f}});
        const Stereo out = in_blocks(x, sizes[which], second - 300, {{p::kAmount, 0.9f}, {p::kResonance, 1200}, {p::kTone, 4000}});
        if (which == 0) {
          reference = out;
        } else {
          for (size_t i = 0; i < x.size(); ++i) {
            worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
            worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
          }
        }
      }
    }
  }
  std::printf("block sizes across a silence: worst difference %g\n", worst);
  EXPECT(worst < 1.0e-6, "the same audio at every block size across a silence");

  // Moved while it sleeps: the next note is as if it had always been so.
  std::vector<Setting> moved = {{p::kModel, 1},      {p::kAmount, 0.9f},   {p::kTone, 3000},  {p::kResonance, 900},
                                      {p::kWidth, 0.8f},   {p::kDistance, 0.5f}, {p::kOutput, -9},  {p::kThreshold, -50},
                                      {p::kMix, 0.7f},     {p::kCurve, 0.9f},    {p::kFall, 200.0f}};
  const Signal note = pluck(220, 0.5, 0.4, 1.0);
  for (int model : {0, 1}) {
    moved[0].value = static_cast<float>(model);
    moved[7].value = model == 1 ? -20.0f : -50.0f;
    set_up({});
    run(device, pluck(330, 0.4, 0.5, 0.6));
    render(device, 3.0f, kRate);
    for (const Setting& s : moved) device.set_param(s.id, s.value);
    render(device, 0.1f, kRate);
    const Stereo woken = run(device, note);
    set_up(moved);
    const Stereo fresh = run(device, note);
    EXPECT(woken.left == fresh.left && woken.right == fresh.right, "knobs moved in silence are there for the next note");
  }

  // Exact silence after the longest tail.
  set_up({{p::kDistance, 1}, {p::kFall, 6000}, {p::kRattle, 400}, {p::kBounces, 8}, {p::kModel, 2}, {p::kThreshold, -60}});
  run(device, note);
  render(device, 6.0f, kRate);
  const Stereo rest = render(device, 0.5f, kRate);
  EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "exact silence after the room has died");
  EXPECT(device.meter(0) == -90.0f && device.meter(1) == 0.0f && device.meter(3) == -60.0f && device.meter(4) == 0.0f,
         "meters rest");
}

static void test_bad_input() {
  const float bad[] = {std::numeric_limits<float>::quiet_NaN(), std::numeric_limits<float>::infinity(),
                       -std::numeric_limits<float>::infinity(), 1.0e30f, -1.0e30f, 1.0e-40f};
  for (int model = 0; model < BuzzingBridge::kModels; ++model) {
    const Signal x = pluck(220, 1.0, 0.4, 2.0);
    const std::vector<Setting> s = {{p::kModel, static_cast<float>(model)}, {p::kDistance, 0.5f}, {p::kThreshold, -50}};
    for (float b : bad) {
      Signal hurt = x, held = x;
      hurt[at(0.3)] = b;
      held[at(0.3)] = std::isfinite(b) && std::fabs(b) < 1.0f ? b : 0.0f;
      const Stereo out = through(s, hurt), clean = through(s, held);
      EXPECT(finite(out.left) && finite(out.right), "bad input: finite");
      EXPECT(out.left == clean.left, "bad input is a sample of silence");
    }
    Signal all(2000, std::numeric_limits<float>::quiet_NaN());
    const Stereo out = through(s, all);
    EXPECT(peak(out.left) == 0.0, "NaN all through is silence");
  }
}

static void test_rates() {
  for (int model = 0; model < BuzzingBridge::kModels; ++model) {
    double level[4], top[4];
    int n = 0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f, 192000.0f}) {
      // Several notes, so that what is drawn at random evens out.
      Signal x(at(2.4, rate), 0.0f);
      for (int k = 0; k < 8; ++k) lay(x, pluck(146.83 * (1 + 0.2 * k), 1.2, 0.4, 1.0, rate), at(0.3 * k, rate));
      const Signal b = buzz_of({{p::kModel, static_cast<float>(model)}, {p::kAmount, 0.6f}, {p::kThreshold, -50}, {p::kRattle, 150}}, x, rate);
      level[n] = db(rms(b) / rms(x));
      top[n++] = db(above(b, 3000, 0, b.size(), rate) / rms(x));
    }
    std::printf("%s at 44.1, 48, 96, 192 kHz: %.2f %.2f %.2f %.2f dB; over 3 kHz %.2f %.2f %.2f %.2f dB\n", kNames[model], level[0],
                level[1], level[2], level[3], top[0], top[1], top[2], top[3]);
    for (int k : {0, 2, 3}) {
      EXPECT_NEAR(level[k], level[1], 1.0, "as loud at every rate");
      EXPECT_NEAR(top[k], top[1], 1.5, "and as bright");
    }
  }
}

// How much of a change is there in the first 8 samples, of what it is over
// 20 ms; the worst of eight moments.
static double suddenness(const std::vector<Setting>& s, const std::vector<Setting>& moved) {
  double worst = 0.0;
  const Signal x = saw(196, 0.7, 0.2);
  for (int k = 0; k < 8; ++k) {
    const size_t when = at(0.5) + 311 * k;
    set_up(s);
    const Stereo plain = in_blocks(x, {128}, x.size() * 2, {});
    set_up(s);
    const Stereo out = in_blocks(x, {128}, when, moved);
    double early = 0.0, whole = 1.0e-9;
    for (size_t i = when; i < when + at(0.02); ++i) {
      const double d = std::fabs(static_cast<double>(out.left[i]) - plain.left[i]);
      if (i < when + 8) early = std::max(early, d);
      whole = std::max(whole, d);
    }
    worst = std::max(worst, early / whole);
  }
  return worst;
}

static void test_moves() {
  for (int model : {0, 1, 4}) {
    const std::vector<Setting> s = {{p::kModel, static_cast<float>(model)}, {p::kThreshold, -50}, {p::kAmount, 1}};
    const struct {
      const char* name;
      Setting to;
    } moves[] = {{"Amount", {p::kAmount, 0}},       {"Mix", {p::kMix, 0}},           {"Tone", {p::kTone, 800}},
                 {"Resonance", {p::kResonance, 400}}, {"Model", {p::kModel, 3}},      {"Distance", {p::kDistance, 1}},
                 {"Width", {p::kWidth, 1}},         {"Output", {p::kOutput, -24}},   {"Threshold", {p::kThreshold, 0}}};
    for (const auto& move : moves) {
      const double sudden = suddenness(s, {move.to});
      char label[96];
      std::snprintf(label, sizeof label, "%s: %s moves gradually (%.3f)", kNames[model], move.name, sudden);
      EXPECT(sudden < 0.2, label);
    }
  }
}

static void test_meters() {
  set_up({{p::kModel, 1}, {p::kThreshold, -26}});
  run(device, sine(220, 0.5f, kRate, 0.2512f));
  EXPECT_NEAR(device.meter(3), 14.0, 0.5, "level against Threshold");
  EXPECT(device.meter(4) > 0.5f && device.meter(4) <= 1.0f, "the touch is closed");
  EXPECT(device.meter(0) > -40.0f && device.meter(0) < 0.0f, "the buzz is read");
  set_up({{p::kCurve, 0.6f}, {p::kThreshold, -50}});
  run(device, pluck(146.83, 2.5, 0.5, 5.0));
  EXPECT(device.meter(1) > 10.0f && device.meter(1) < 13.0f, "the partial it sits on is read");
  EXPECT_NEAR(device.meter(2) / device.meter(1), 146.83, 3.0, "and where that is");
}

// --- levels, runs, chords and what is left over --------------------------------------------------

// Detuned saws under a soft slope with a slow start: a held pad.
static Signal pad(const std::vector<double>& notes, double seconds, double amp) {
  Signal x(at(seconds), 0.0f);
  int voice = 1;
  for (double note : notes) {
    for (double detune : {-0.0035, 0.0, 0.0041}) {
      const double hz = note * (1 + detune);
      for (int k = 1; k < 30 && k * hz < 9000; ++k) {
        const double a = amp * std::pow(k, -1.5) / (1 + std::pow(k * hz / 3000, 2));
        for (size_t i = 0; i < x.size(); ++i) {
          x[i] += static_cast<float>(a * std::min(1.0, i / (0.4 * kRate)) * std::sin(2 * kPi * hz * k * i / kRate + 1.7 * k * voice));
        }
      }
      ++voice;
    }
  }
  return x;
}

// Whatever it is set to, the peaks are at most twice those of the sound: a
// search over corners and at random, on the sounds that stood highest.
static void test_ceiling() {
  Signal square(at(0.4), 0.0f);
  for (size_t i = 0; i < square.size(); ++i) square[i] = i % 400 < 200 ? 0.4f : -0.4f;
  Signal leaps;
  for (int n = 0; n < 4; ++n) lay(leaps, bar(n % 2 ? 880 : 220, 0.2, n % 2 ? 0.6 : 0.15, 0.4), at(0.1 * n));
  const std::vector<Signal> sounds = {square, sine(82, 0.4f, kRate, 0.5f), sine(700, 0.4f, kRate, 0.5f), noise(0.3f, kRate, 0.5f),
                                      leaps, pluck(220, 0.4, 0.6, 1.0)};
  rng_state() = 4242;
  double worst = -99.0;
  for (int n = 0; n < 60; ++n) {
    set_up({});
    std::vector<Setting> s;
    for (int id = 0; id < p::kNumParams; ++id) {
      double u = 0.5 * (1.0 + white());
      if (n < 40) u = u < 0.4 ? 0.0 : 1.0;
      s.push_back({id, static_cast<float>(p::kParamMin[id] + u * (p::kParamMax[id] - p::kParamMin[id]))});
    }
    s[p::kModel].value = static_cast<float>(n % BuzzingBridge::kModels);
    s[p::kAmount].value = s[p::kMix].value = 1.0f;
    s[p::kThreshold].value = -60.0f;
    s[p::kOutput].value = 0.0f;
    for (const Signal& x : sounds) {
      const Stereo out = through(s, x);
      worst = std::max(worst, db(std::max(peak(out.left), peak(out.right)) / peak(x)));
    }
  }
  std::printf("peaks over the sound's, worst of 360 renders: %.2f dB\n", worst);
  EXPECT(worst < 6.02, "no peak is over twice the sound's");
  EXPECT(worst > 4.5, "and the search finds patches that stand high");
}

static void test_after_loud() {
  // Soft notes between loud ones are plain, however long the buzz of the loud
  // ones is held.
  const bool loud[8] = {true, false, true, false, false, false, true, false};
  Signal x(at(2.0), 0.0f);
  for (int n = 0; n < 8; ++n) lay(x, bar(n % 2 ? 327 : 262, 0.2, loud[n] ? 0.32 : 0.03, 0.15), at(0.25 * n));
  for (float fall : {300.0f, 1000.0f, 6000.0f}) {
    const Signal b = buzz_of({{p::kModel, 1}, {p::kThreshold, -26}, {p::kFall, fall}}, x);
    double worst = 0.0, least = 1.0;
    for (int n = 0; n < 8; ++n) {
      const double top = peak(b, at(0.25 * n + (loud[n] ? 0.0 : 0.02)), at(0.25 * n + 0.2));
      if (loud[n]) least = std::min(least, top);
      else worst = std::max(worst, top);
    }
    std::printf("soft notes after loud ones, Fall %.0f ms: loud %.1f dBFS of buzz at least, soft %.1f at most\n", fall, db(least), db(worst));
    EXPECT(db(worst) < -70.0, "a soft note after a loud one is plain");
    EXPECT(db(least) > -32.0, "and each loud one buzzes");
  }
  // Curve: how far over Threshold a note must be.
  const Signal y = sine(220, 0.5f, kRate, 0.1f);
  const double early = rms(buzz_of({{p::kModel, 1}, {p::kThreshold, -30}, {p::kCurve, 0.0f}}, y), at(0.3), at(0.5));
  const double late = rms(buzz_of({{p::kModel, 1}, {p::kThreshold, -30}, {p::kCurve, 1.0f}}, y), at(0.3), at(0.5));
  EXPECT(db(early / late) > 8.0, "Curve is how late the skin speaks up");
  EXPECT(late > 0.0, "and late is not never");
}

static void test_accents() {
  // Every other note half as strong, all ringing on, eight a second.
  const double runs[4][8] = {{220, 277, 330, 440, 330, 277, 220, 165},
                             {196, 220, 247, 262, 294, 330, 349, 392},
                             {330, 370, 330, 370, 330, 370, 330, 370},
                             {262, 327, 262, 327, 392, 327, 262, 196}};
  int heard = 0;
  for (int k = 0; k < 4; ++k) {
    Signal x;
    for (int n = 0; n < 8; ++n) {
      const double amp = n % 2 ? 0.15 : 0.3;
      lay(x, k < 3 ? pluck(runs[k][n], 1.5, amp, 2.0) : bar(runs[k][n], 1.5, amp, 1.0), at(0.125 * n + 0.05));
    }
    const Signal b = buzz_of({{p::kModel, 2}, {p::kRattle, 10}, {p::kBounces, 1}, {p::kThreshold, -50}}, x);
    for (int n = 0; n < 8; ++n) heard += peak(b, at(0.125 * n + 0.05), at(0.125 * n + 0.08)) > 0.008 ? 1 : 0;
  }
  std::printf("eight a second, every other at half strength: %d of 32 knocked\n", heard);
  EXPECT(heard >= 28, "weak notes among strong ones are attacks too");
  // A sound that swells and sinks is not one attack after another.
  Signal swell = sine(300, 3.0f, kRate, 0.4f);
  for (size_t i = 0; i < swell.size(); ++i) swell[i] *= static_cast<float>(0.51 - 0.49 * std::cos(2 * kPi * 3.0 * i / kRate));
  const Signal b = buzz_of({{p::kModel, 2}, {p::kRattle, 10}, {p::kBounces, 1}, {p::kThreshold, -60}}, swell);
  std::printf("shell in a deep tremolo after its start: %.1f dBFS\n", db(peak(b, at(0.3), b.size())));
  EXPECT(peak(b, at(0.3), b.size()) < 1.0e-5, "nothing in a deep tremolo");
}

static void test_chords() {
  int leaps = 0;
  const std::vector<std::vector<double>> chords = {{220, 277.2, 329.6}, {98, 130.8, 146.8, 196}, {130.8, 164.8, 196, 246.9}, {174.6, 220, 261.6, 329.6}};
  for (const auto& chord : chords) {
    const Signal x = pad(chord, 4.0, 0.06);
    set_up({});
    double last = 0.0;
    for (size_t done = 0; done + 128 <= x.size(); done += 128) {
      for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = x[done + i];
      device.process(128);
      const double hz = device.meter(5);
      if (done > at(0.7) && last > 0.0 && std::fabs(std::log2(hz / last)) > 0.1) ++leaps;
      last = hz;
    }
  }
  std::printf("four held chords, 3.3 s each: the pitch leaps %d times\n", leaps);
  EXPECT(leaps <= 5, "the buzz does not go from note to note of a chord");
  // A slur is followed, and a slide.
  for (int slide = 0; slide < 2; ++slide) {
    Signal x(at(1.8), 0.0f);
    double phase = 0.0;
    for (size_t i = 0; i < x.size(); ++i) {
      const double t = i / kRate, hz = slide ? 220 * std::exp2(std::min(1.0, std::max(0.0, (t - 1) / 0.3))) : (t < 1 ? 220 : 330);
      phase += 2 * kPi * hz / kRate;
      for (int k = 1; k < 8; ++k) x[i] += static_cast<float>(0.2 / k * std::sin(k * phase));
    }
    set_up({});
    Signal first(x.begin(), x.begin() + at(1.2));
    run(device, first);
    if (slide) EXPECT(device.meter(5) > 300.0f, "a slide is followed as it goes");
    run(device, Signal(x.begin() + at(1.2), x.begin() + at(1.45)));
    EXPECT_NEAR(device.meter(5), slide ? 440.0 : 330.0, 6.0, "and a note reached with no attack is believed once it stands");
  }
}

static void test_default() {
  // The first thing heard: a pluck and a held pad, both with what they lacked.
  auto over = [](const Signal& x, double hz, double from, double to) {
    const Stereo out = through({}, x);
    return db(above(out.left, hz, at(from), at(to)) / above(x, hz, at(from), at(to)));
  };
  const Signal note = pluck(146.83, 2.0, 0.5, 3.0), held = pad({110}, 3.0, 0.1);
  const double pl = over(note, 1200, 0.4, 0.8), pd = over(held, 2000, 1.0, 2.5);
  set_up({});
  run(device, saw(146.83, 0.4, 0.2));
  const double start = device.meter(1);
  set_up({});
  run(device, saw(146.83, 4.0, 0.2));
  const double end = device.meter(1);
  std::printf("default: a dying pluck gains %.1f dB over 1.2 kHz, a held pad %.1f dB over 2 kHz; a held note goes from partial %.1f to %.1f\n", pl, pd, start, end);
  EXPECT(pl > 10.0, "a dying pluck opens");
  EXPECT(pd > 1.0, "a held pad is edged");
  EXPECT(start < 4.0 && end > 4.8 && end < 6.5, "a held note climbs half of the way");
}

static void test_models() {
  // A skin and a strap are tuned to a partial of the note, and are smaller for
  // a higher note.
  for (int model : {1, 3, 4}) {
    double place[2], hz = 196.0;
    for (int octave = 0; octave < 2; ++octave, hz *= 2) {
      set_up({{p::kModel, static_cast<float>(model)}, {p::kThreshold, -50}});
      run(device, saw(hz, 0.5, 0.2));
      place[octave] = device.meter(2);
      const double part = place[octave] / hz;
      EXPECT(std::fabs(part - std::round(part)) < 0.06, "what buzzes is tuned to a partial");
    }
    const double up = place[1] / place[0];
    std::printf("%s: an octave up, its place x%.2f\n", kNames[model], up);
    EXPECT(up > 1.12 && up < 1.8, "half the way with the note");
  }
  const Signal x = sine(220, 1.5f, kRate, 0.3f);
  // Leather catches every other swing less: there is something an octave down.
  const Signal strap = buzz_of({{p::kModel, 3}, {p::kThreshold, -50}, {p::kAmount, 1}, {p::kResonance, 1000}}, x);
  const double under = db(tone_level(strap, 330, kRate, at(0.5), at(1.5)) / tone_level(strap, 440, kRate, at(0.5), at(1.5)));
  // The skin has a second resonance, over half an octave up.
  const Signal skin = buzz_of({{p::kModel, 1}, {p::kThreshold, -50}, {p::kResonance, 1500}, {p::kTracking, 0.0f}}, sine(47.2f, 1.5f, kRate, 0.3f));
  auto around = [&](double hz) {
    double sum = 0.0;
    for (double f = hz * 0.94; f < hz * 1.06; f += 4.0) sum += std::pow(tone_level(skin, f, kRate, at(0.5), at(1.5)), 2);
    return std::sqrt(sum);
  };
  const double second = db(around(1.59 * 1500) / around(2.2 * 1500));
  // A firm touch is a wider one: its upper partials are further down.
  double lean[2];
  int n = 0;
  for (float amount : {0.05f, 1.0f}) {
    const Signal b = buzz_of({{p::kAmount, amount}, {p::kThreshold, -50}, {p::kCurve, 0.0f}}, x);
    lean[n++] = db(tone_level(b, 1100, kRate, at(0.5), at(1.5)) / tone_level(b, 660, kRate, at(0.5), at(1.5)));
  }
  std::printf("leather between partials %.1f dB; the skin's second resonance %.1f dB over what is above it; partial 5 against 3: %.1f dB at Amount 0.05, %.1f at 1\n",
              under, second, lean[0], lean[1]);
  EXPECT(under > -30.0, "leather skips");
  EXPECT(second > 8.0, "a skin rings twice");
  EXPECT(lean[0] > lean[1] + 1.0, "a little catches only the crest");

  // Fall held long never lets the buzz stand more than four times over.
  const Signal brief = pluck(220, 1.0, 0.5, 0.8);
  const Signal b = buzz_of({{p::kFall, 6000}, {p::kThreshold, -60}, {p::kAmount, 1}, {p::kCurve, 0.0f}}, brief);
  const double over = db(rms(b, at(0.6), at(0.7)) / rms(brief, at(0.6), at(0.7)));
  std::printf("Fall 6 s on a note gone in 0.8 s: the buzz %.1f dB over it\n", over);
  EXPECT(over > 2.0 && over < 12.5, "long Fall stands over a dying note, and not further");

  // A new note's pitch is there within 0.15 s.
  Signal two = pluck(220, 0.5, 0.3, 2.0);
  lay(two, pluck(349, 0.5, 0.5, 2.0), at(0.4));
  set_up({});
  run(device, Signal(two.begin(), two.begin() + at(0.57)));
  EXPECT_NEAR(device.meter(5), 349.0, 8.0, "a struck note's pitch is taken at once");
}

static void test_left_overs() {
  // Distance let down before what was sent into the next room has come out:
  // it comes out, and is not found there later.
  Signal x = pluck(220, 2.0, 0.5, 9.0);
  set_up({{p::kModel, 2}, {p::kThreshold, -60}, {p::kDistance, 1.0f}, {p::kRattle, 5}, {p::kBounces, 1}});
  double soon = 0.0, late = 0.0;
  for (size_t done = 0; done + 64 <= x.size(); done += 64) {
    if (done == 64 * 23) device.set_param(p::kDistance, 0.0f);
    if (done == 64 * 1000) device.set_param(p::kDistance, 1.0f);
    for (int i = 0; i < 64; ++i) device.in_left()[i] = device.in_right()[i] = x[done + i];
    device.process(64);
    for (int i = 0; i < 64; ++i) {
      const double d = std::fabs(static_cast<double>(device.out_left()[i]) - x[done + i]);
      if (done > 64 * 26 && done < 64 * 600) soon = std::max(soon, d);
      if (done > 64 * 1000) late = std::max(late, d);
    }
  }
  std::printf("the next room, let down: %.1f dBFS comes out, %.1f dBFS is left for later\n", db(soon), db(late));
  EXPECT(soon > 1.0e-3, "what is on its way arrives");
  EXPECT(late < 1.0e-6, "and nothing of it is kept");

  // Width turned up in a held note brings no edge.
  Signal y(at(1.2), 0.0f);
  for (int k = 1; k < 8; ++k) {
    for (size_t i = 0; i < y.size(); ++i) y[i] += static_cast<float>(0.18 / (k * k) * std::sin(2 * kPi * 196 * k * i / kRate + k));
  }
  set_up({{p::kWidth, 1.0f}, {p::kAmount, 0.8f}});
  const Stereo always = run(device, y);
  set_up({{p::kAmount, 0.8f}});
  Stereo moved = run(device, Signal(y.begin(), y.begin() + 38400));
  device.set_param(p::kWidth, 1.0f);
  moved = concat(moved, run(device, Signal(y.begin() + 38400, y.end())));
  auto edge = [](const Signal& z, size_t from, size_t to) {
    livemix::kit::Biquad a, b;
    a.set_highpass(9000, 0.541f, kRate);
    b.set_highpass(9000, 1.307f, kRate);
    double top = 0.0;
    for (size_t i = 0; i < to; ++i) {
      const double v = std::fabs(b.process(a.process(z[i])));
      if (i >= from) top = std::max(top, v);
    }
    return top;
  };
  EXPECT(edge(moved.left, 38300, 40000) < 2.0 * edge(always.left, 30000, 50000), "Width comes up with no click");
}

int main() {
  Conformance spec;
  spec.name = "buzzing-bridge";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 8.0f;  // Output at +12 dB, and twice the sound
  check_effect(device, spec, kRate);

  test_climb();
  test_membrane();
  test_shell();
  test_paper_edge();
  test_sine();
  test_plain();
  test_level();
  test_pitch();
  test_fold();
  test_fall();
  test_sides();
  test_distance();
  test_sleep();
  test_bad_input();
  test_rates();
  test_moves();
  test_meters();
  test_ceiling();
  test_after_loud();
  test_accents();
  test_chords();
  test_default();
  test_models();
  test_left_overs();

  const Signal x = pluck(146.83, 10.0, 0.5, 10.0);
  for (int model = 0; model < BuzzingBridge::kModels; ++model) {
    set_up({{p::kModel, static_cast<float>(model)}, {p::kDistance, 0.4f}, {p::kWidth, 0.5f}, {p::kThreshold, -60}});
    report_cost(kNames[model], 10.0f, kRate, [&] { run(device, x); });
  }
  return finish("buzzing-bridge");
}
