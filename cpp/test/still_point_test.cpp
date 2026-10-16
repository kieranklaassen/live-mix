// Native harness for Still Point (cpp/devices/still-point). The conformance
// pass covers silence before and after notes, a pile of keys, parameter abuse
// and other sample rates. The rest measures what makes it this instrument:
// one sine that sweeps as a triangle in pitch between limits set by the held
// keys, meets each key where the beat between them stands still, sits at
// Level against one key, and is split from the keys by the Ears law; and what
// conformance cannot see: the same sound at any block size across any
// silence, a knob moved in silence, events that begin gradually, and the
// level of a full pool.
//
// Nobody has listened to this device. Every claim below is a measurement.

#include <ctime>

#include "../devices/still-point/still_point.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::StillPoint;
namespace p = livemix::still_point;

static StillPoint device;
static StillPoint other;

static const float kRate = 48000.0f;
static const float kA3 = 220.0f;
static const float kRates[3] = {44100.0f, 48000.0f, 96000.0f};

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate + 0.5); }
static double semitones(double hz, double reference) { return 12.0 * std::log2(hz / reference); }
static double hz_of(int midi) { return 440.0 * std::pow(2.0, (midi - 69) / 12.0); }

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static double apart(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  const size_t n = std::min(a.size(), b.size());
  for (size_t i = 0; i < n; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return a.size() == b.size() ? worst : 1.0e9;
}

static double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

// A key that comes and goes fast, at unity volume, with pure tones: what the
// measurements below start from unless they say otherwise.
static void plain(StillPoint& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWarmth, 0.0f);
  d.set_param(p::kAttack, 0.01f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kVolume, 0.0f);
}

// --- playing a phrase with events on exact samples ------------------------------------------

struct Event {
  double seconds;
  int kind;  // 0 note on, 1 note off, 2 parameter
  int id;
  float a;
  float b;
};
static Event on(double seconds, int id, float hz, float gain = 0.7f) { return {seconds, 0, id, hz, gain}; }
static Event off(double seconds, int id) { return {seconds, 1, id, 0.0f, 0.0f}; }
static Event set(double seconds, int id, float value) { return {seconds, 2, id, value, 0.0f}; }

static const std::vector<int> kBlocks128 = {128};
static const std::vector<int> kBlocks1 = {1};
static const std::vector<int> kBlocks2048 = {2048};
static const std::vector<int> kBlocksRagged = {1, 7, 64, 128, 33, 512, 2048, 5, 13, 300};

// Render `seconds` of `events` (in time order). Every event lands on its own
// sample whatever the block sizes: a block is cut short where one is due.
static Stereo play(StillPoint& d, const std::vector<Event>& events, double seconds, const std::vector<int>& sizes,
                   float rate = kRate) {
  Stereo out;
  const size_t total = at(seconds, rate);
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0, next = 0, which = 0;
  while (done < total) {
    while (next < events.size() && at(events[next].seconds, rate) <= done) {
      const Event& e = events[next++];
      if (e.kind == 0) d.note_on(e.id, e.a, e.b);
      if (e.kind == 1) d.note_off(e.id);
      if (e.kind == 2) d.set_param(e.id, e.a);
    }
    size_t frames = std::min(static_cast<size_t>(sizes[which++ % sizes.size()]), total - done);
    if (next < events.size()) frames = std::min(frames, at(events[next].seconds, rate) - done);
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// --- measures ---------------------------------------------------------------------------------

// The phase of `x` against a turning `guess` hertz, over a Hann window of
// `window` seconds centred on `seconds`.
static double phase_at(const std::vector<float>& x, double guess, double seconds, double rate, double window) {
  const long half = static_cast<long>(0.5 * window * rate);
  const long centre = static_cast<long>(seconds * rate + 0.5);
  double re = 0.0, im = 0.0;
  for (long k = -half; k <= half; ++k) {
    const long i = centre + k;
    if (i < 0 || i >= static_cast<long>(x.size())) continue;
    const double w = 0.5 + 0.5 * std::cos(kPi * static_cast<double>(k) / static_cast<double>(half));
    const double turn = 2.0 * kPi * guess * static_cast<double>(i) / rate;
    re += w * x[i] * std::cos(turn);
    im -= w * x[i] * std::sin(turn);
  }
  return std::atan2(im, re);
}

// The frequency of a tone near `guess` hertz at `seconds`: how far its phase
// turns against the guess between two windows `step` seconds either side. A
// tone gliding evenly reads its frequency at the centre. The guess has to be
// within 1 / (4 step) hertz.
static double frequency_at(const std::vector<float>& x, double guess, double seconds, double rate,
                           double window = 0.1, double step = 0.025) {
  double turned = phase_at(x, guess, seconds + step, rate, window) - phase_at(x, guess, seconds - step, rate, window);
  while (turned > kPi) turned -= 2.0 * kPi;
  while (turned < -kPi) turned += 2.0 * kPi;
  return guess + turned / (2.0 * kPi * 2.0 * step);
}

// The same, finding its own guess first: for a tone that may be anywhere.
static double frequency_near(const std::vector<float>& x, double lo, double hi, double seconds, double rate,
                             double window = 0.1) {
  const size_t from = at(std::max(0.0, seconds - 0.5 * window), rate);
  const size_t to = at(seconds + 0.5 * window, rate);
  const double guess = dominant_frequency(x, rate, lo, hi, from, to);
  return frequency_at(x, guess, seconds, rate, window, 0.01);
}

// Level in windows of `window` seconds, a hop of half a window: RMS times root two, so a sine reads its amplitude.
static std::vector<double> envelope(const std::vector<float>& x, double rate, double window, std::vector<double>* times = nullptr) {
  std::vector<double> out;
  const size_t n = at(window, rate);
  for (size_t start = 0; start + n <= x.size(); start += n / 2) {
    out.push_back(std::sqrt(2.0) * rms(x, start, start + n));
    if (times) times->push_back((static_cast<double>(start) + 0.5 * static_cast<double>(n)) / rate);
  }
  return out;
}

// How much of an event's effect is there after 8 samples, as a share of what
// it does within 20 ms: the device rendered twice from init, with and
// without the event. A fade is a small part of the way by then; a jump is
// all there at once. The worst of eight places a little apart, spread over a
// whole pass of the sweep (the setup makes a pass 4 s), the meeting included.
// `moved`, when given, takes the largest change any place saw, so a check can
// tell an event that is gradual from one that does nothing.
template <typename Setup, typename Change>
static double suddenness(Setup setup, Change change, double* moved = nullptr) {
  double worst = 0.0;
  if (moved) *moved = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kTime, 4.0f);
      setup(device);
      render(device, 0.4f + 0.4513f * static_cast<float>(trial), kRate);
      if (pass == 0) change(device);
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
    if (moved) *moved = std::max(*moved, whole);
  }
  return worst;
}

static void test_sweep();
static void test_level_and_dip();
static void test_ears();
static void test_limits();
static void test_gate();
static void test_tone_and_envelope();
static void test_voices();
static void test_levels();
static void test_sleep();
static void test_clicks();
static void test_readings();
static void test_cost();
static void test_guards();

// Two faults end in a read outside the kit's sine table, which takes any
// argument without a guard: the control step run once a host block instead
// of on the control clock (the sine's frequency runs away and its phase goes
// under zero), and a pitch that is not a number taking a voice. Either stops
// the program with no line that says why. Each is looked for here first, in a
// way that cannot reach that read, and main() stops if one is found.
static bool test_first() {
  char label[300];

  // The control clock counts samples, not host blocks: one key as two blocks
  // of 2048 and as 256 blocks of 16. (A device that steps once a block is
  // still finite this far in; two blocks later it is not.)
  {
    Stereo renders[2];
    const std::vector<int> sizes[2] = {{2048}, {16}};
    for (int k = 0; k < 2; ++k) {
      plain(device);
      device.set_param(p::kEars, 1.0f);
      device.note_on(1, kA3, 0.7f);
      renders[k] = play(device, {}, 4096.0 / kRate, sizes[k]);
    }
    const bool whole = finite(renders[0].left) && finite(renders[0].right) && finite(renders[1].left) && finite(renders[1].right);
    const double d = apart(renders[0], renders[1]);
    std::snprintf(label, sizeof label, "the control step runs on its own clock: two blocks of 2048 are the 256 blocks of 16, sample for sample (%.2g apart)", d);
    const bool ok = whole && d == 0.0 && both_peak(renders[1]) > 0.01;
    EXPECT(ok, label);
    std::fflush(stdout);
    if (!ok) return false;  // nothing more is rendered on a device like that
  }

  // A pitch that is not a number takes no voice. Eight keys fill the pool;
  // the bad key is sent and let go in the same instant, so even a device
  // that took it never starts it: it would only have faded the oldest key.
  {
    plain(device);
    device.set_param(p::kLevel, 0.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, static_cast<float>(hz_of(48 + 2 * n)), 0.7f);
    Stereo before = render(device, 0.4f, kRate);
    device.note_on(9, std::nanf(""), 0.7f);
    device.note_off(9);
    Stereo after = render(device, 0.4f, kRate);
    double least = 1.0e9;
    for (int n = 0; n < 8; ++n) {
      const double hz = hz_of(48 + 2 * n);
      least = std::min(least, db(tone_level(after.left, hz, kRate, at(0.2), at(0.4)) / tone_level(before.left, hz, kRate, at(0.2), at(0.4))));
    }
    std::snprintf(label, sizeof label, "a pitch that is not a number takes no voice from a full pool: the key that lost most stands %.2f dB from where it was", least);
    const bool ok = finite(after.left) && finite(after.right) && least > -0.1;
    EXPECT(ok, label);
    std::fflush(stdout);
    if (!ok) return false;
  }
  return true;
}

int main() {
  if (!test_first()) {
    std::printf("still-point: stopped before the other tests, which would run a device that reads outside the sine table\n");
    return finish("still-point");
  }
  Conformance spec;
  spec.name = "still-point";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_sweep();
  test_level_and_dip();
  test_ears();
  test_limits();
  test_gate();
  test_tone_and_envelope();
  test_voices();
  test_levels();
  test_sleep();
  test_clicks();
  test_readings();
  test_guards();
  test_cost();

  return finish("still-point");
}

// --- the sweep --------------------------------------------------------------------------------

// The times of the crests of a beat: local maxima of `level` over `floor`,
// each placed by a parabola through its neighbours.
static std::vector<double> crests(const std::vector<double>& level, const std::vector<double>& times, double floor) {
  std::vector<double> out;
  for (size_t k = 1; k + 1 < level.size(); ++k) {
    if (level[k] < floor || level[k] <= level[k - 1] || level[k] < level[k + 1]) continue;
    const double bend = level[k - 1] - 2.0 * level[k] + level[k + 1];
    const double shift = bend < 0.0 ? 0.5 * (level[k - 1] - level[k + 1]) / bend : 0.0;
    out.push_back(times[k] + shift * (times[k + 1] - times[k]));
  }
  return out;
}

static void test_sweep() {
  char label[240];
  for (float rate : kRates) {
    // One key, Reach 0.5, Time 12, at Ears 1: the right side is the sine alone.
    plain(device, rate);
    device.set_param(p::kEars, 1.0f);
    device.note_on(1, kA3, 0.7f);
    Stereo out = render(device, 14.0f, rate);
    const std::vector<float>& sine = out.right;
    auto pitch = [&](double seconds, double expected) {
      return semitones(frequency_at(sine, kA3 * std::pow(2.0, expected / 12.0), seconds, rate), kA3);
    };
    // From the lower limit, going up, linear in pitch: a semitone in 12 s.
    const double p03 = pitch(0.3, -0.475), p3 = pitch(3.0, -0.25), p9 = pitch(9.0, 0.25);
    std::snprintf(label, sizeof label,
                  "%.0f Hz: the sine starts Reach under the key and climbs evenly in pitch (%.4f, %.4f, %.4f st at 0.3, 3 and 9 s)",
                  rate, p03, p3, p9);
    EXPECT(std::fabs(p03 + 0.475) < 0.003 && std::fabs(p3 + 0.25) < 0.003 && std::fabs(p9 - 0.25) < 0.003, label);

    // It meets the key half way through the pass.
    const double f55 = frequency_at(sine, kA3, 5.5, rate), f65 = frequency_at(sine, kA3, 6.5, rate);
    const double meet = 5.5 + (kA3 - f55) / (f65 - f55);
    std::snprintf(label, sizeof label, "%.0f Hz: the sine is on the key at %.4f s of a 12 s pass (6.0 within 50 ms)", rate, meet);
    EXPECT(std::fabs(meet - 6.0) < 0.05, label);

    // The beat a second before and a second after is the same rate.
    const double before = kA3 - frequency_at(sine, kA3 - 1.06, 5.0, rate);
    const double after = frequency_at(sine, kA3 + 1.06, 7.0, rate) - kA3;
    std::snprintf(label, sizeof label, "%.0f Hz: the beat is %.4f Hz a second before the meeting and %.4f Hz a second after", rate,
                  before, after);
    EXPECT(before > 0.9 && after > 0.9 && std::fabs(before / after - 1.0) < 0.05 && std::fabs(before - 1.0563) < 0.02, label);

    // It turns at the upper limit after one pass and comes back the same way.
    const double p115 = pitch(11.5, 0.4583), p125 = pitch(12.5, 0.4583), p135 = pitch(13.5, 0.375);
    std::snprintf(label, sizeof label, "%.0f Hz: the sine turns Reach over the key at 12 s (%.4f, %.4f, %.4f st at 11.5, 12.5, 13.5 s)", rate,
                  p115, p125, p135);
    EXPECT(std::fabs(p115 - 0.4583) < 0.003 && std::fabs(p125 - 0.4583) < 0.003 && std::fabs(p135 - 0.375) < 0.003, label);
    if (rate == kRate) {
      std::printf("sweep at 48 kHz: on the key at %.4f s; beat %.4f Hz at 5 s, %.4f Hz at 7 s\n", meet, before, after);
    }
  }

  // The same read off the sound at Ears 0: the crests of the beat lie the
  // same way either side of the meeting and spread out as it nears.
  {
    plain(device);
    device.note_on(1, kA3, 0.7f);
    Stereo out = render(device, 12.0f, kRate);
    std::vector<double> times;
    const std::vector<double> level = envelope(out.left, kRate, 4.0 / kA3, &times);
    // The key alone is half of 0.7 of the base here; a crest is half as much again.
    const double key = [&] {
      plain(other);
      other.set_param(p::kLevel, 0.0f);
      other.note_on(1, kA3, 0.7f);
      Stereo alone = render(other, 1.0f, kRate);
      return std::sqrt(2.0) * rms(alone.left, at(0.5), at(1.0));
    }();
    const std::vector<double> tops = crests(level, times, 1.3 * key);
    double centre = 0.0, worst = 0.0;
    int pairs = 0;
    // (Within 2.5 s of it: further out the sweep's curve in hertz, which is
    // even in pitch, pulls the two sides apart by tens of milliseconds.)
    for (double t : tops) {
      if (t < 3.5 || t > 5.7) continue;
      double nearest = 1.0e9;
      for (double u : tops) {
        if (std::fabs(u - (12.0 - t)) < std::fabs(nearest - (12.0 - t))) nearest = u;
      }
      worst = std::max(worst, std::fabs(nearest - (12.0 - t)));
      centre += 0.5 * (t + nearest);
      ++pairs;
    }
    centre = pairs > 0 ? centre / pairs : 0.0;
    std::snprintf(label, sizeof label,
                  "the beat's crests mirror about the meeting: %d pairs centred on %.4f s, the worst %.1f ms out", pairs, centre,
                  1000.0 * worst);
    EXPECT(pairs >= 3 && std::fabs(centre - 6.0) < 0.05 && worst < 0.03, label);
    // Slowing to stillness: the crests nearest the meeting are several times further apart than those far from it.
    double far_gap = 0.0, near_gap = 0.0;
    for (size_t k = 1; k < tops.size(); ++k) {
      if (tops[k] < 2.0 && far_gap == 0.0 && tops[k - 1] > 1.0) far_gap = tops[k] - tops[k - 1];
      if (tops[k] < 6.0) near_gap = tops[k] - tops[k - 1];
    }
    std::snprintf(label, sizeof label, "the beat slows towards the meeting: crests %.0f ms apart near 1.5 s, %.0f ms apart just before 6 s",
                  1000.0 * far_gap, 1000.0 * near_gap);
    EXPECT(far_gap > 0.0 && near_gap > 3.0 * far_gap, label);
  }

  // Time is the length of a pass: at 4 s the meeting is at 2 s, at 30 s at 15 s.
  for (float seconds : {4.0f, 30.0f}) {
    plain(device);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kTime, seconds);
    device.note_on(1, kA3, 0.7f);
    Stereo out = render(device, 0.5f * seconds + 1.0f, kRate);
    const double half = 0.5 * seconds;
    const double fa = frequency_at(out.right, kA3, half - 0.3, kRate), fb = frequency_at(out.right, kA3, half + 0.3, kRate);
    const double meet = half - 0.3 + 0.6 * (kA3 - fa) / (fb - fa);
    std::snprintf(label, sizeof label, "Time %.0f s: the sine is on the key at %.4f s", seconds, meet);
    EXPECT(std::fabs(meet - half) < 0.05, label);
  }

  // Reach is how far past the key it starts: 0.1, 2 and 12 semitones.
  for (float reach : {0.1f, 2.0f, 12.0f}) {
    plain(device);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kReach, reach);
    device.set_param(p::kTime, 120.0f);
    device.note_on(1, kA3, 0.7f);
    Stereo out = render(device, 1.0f, kRate);
    const double expected = -reach + 2.0 * reach * 0.5 / 120.0;
    const double got = semitones(frequency_near(out.right, 100.0, 240.0, 0.5, kRate), kA3);
    std::snprintf(label, sizeof label, "Reach %.1f: the sine starts %.4f st from the key (expected %.4f)", reach, got, expected);
    EXPECT(std::fabs(got - expected) < 0.004, label);
  }
}

// --- the sine's level, and what a meeting does to the key ------------------------------------

static void test_level_and_dip() {
  char label[240];
  // Level is the sine's amplitude against one key, whatever the key's gain:
  // each read alone at Ears 1.
  for (float level : {0.0f, 0.25f, 0.5f, 1.0f}) {
    for (float gain : {0.3f, 0.7f, 1.0f}) {
      plain(device);
      device.set_param(p::kEars, 1.0f);
      device.set_param(p::kLevel, level);
      device.note_on(1, kA3, gain);
      Stereo out = render(device, 1.0f, kRate);
      const double ratio = rms(out.right, at(0.5), at(1.0)) / rms(out.left, at(0.5), at(1.0));
      std::snprintf(label, sizeof label, "Level %.2f, a key at gain %.1f: the sine is %.4f of the key", level, gain, ratio);
      EXPECT(std::fabs(ratio - level) < 0.005 && rms(out.left, at(0.5), at(1.0)) > 0.01, label);
      if (level == 0.0f) EXPECT(peak(out.right) == 0.0, "Level 0: the sine's side is exact silence");
    }
  }
  // With Warmth at full the sine still stands at Level against the key's fundamental.
  {
    plain(device);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kWarmth, 1.0f);
    device.note_on(1, kA3, 0.7f);
    Stereo out = render(device, 1.0f, kRate);
    const double ratio = std::sqrt(2.0) * rms(out.right, at(0.5), at(1.0)) / tone_level(out.left, kA3, kRate, at(0.5), at(1.0));
    std::snprintf(label, sizeof label, "Warmth 1: the sine is %.4f of the key's fundamental at Level 0.5", ratio);
    EXPECT(std::fabs(ratio - 0.5) < 0.01, label);
  }

  // Twenty starts at Level 0.5 and Ears 0: other keys, gains, Reach and Time.
  // The key with the sine against the key alone, in windows of six periods.
  double worst_dip = 0.0, worst_rise = 0.0, longest = 0.0;
  for (int start = 0; start < 20; ++start) {
    const float hz = static_cast<float>(hz_of(40 + 2 * start));
    const float reach = start % 3 == 0 ? 0.5f : (start % 3 == 1 ? 0.2f : 1.0f);
    const float seconds = 4.0f + 0.37f * static_cast<float>(start);
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kTime, seconds);
      device.set_param(p::kReach, reach);
      device.set_param(p::kLevel, pass == 0 ? 0.5f : 0.0f);
      device.note_on(1, hz, 0.4f + 0.03f * static_cast<float>(start));
      out[pass] = render(device, 0.5f * seconds + 2.0f, kRate);
    }
    std::vector<double> times;
    const std::vector<double> with = envelope(out[0].left, kRate, 6.0 / hz, &times);
    const std::vector<double> alone = envelope(out[1].left, kRate, 6.0 / hz);
    double under = 0.0;
    for (size_t k = 0; k < with.size(); ++k) {
      if (times[k] < 0.3) continue;
      const double change = db(with[k] / alone[k]);
      worst_dip = std::max(worst_dip, -change);
      worst_rise = std::max(worst_rise, change);
      // The longest unbroken stretch more than 3 dB under the key alone.
      under = change < -3.0 ? under + (times[1] - times[0]) : 0.0;
      longest = std::max(longest, under);
    }
  }
  std::snprintf(label, sizeof label,
                "Level 0.5 at Ears 0, twenty starts: the key dips %.2f dB at the worst (6.5 allowed) and rises %.2f dB; the longest stretch 3 dB under is %.2f s",
                worst_dip, worst_rise, longest);
  EXPECT(worst_dip <= 6.5 && worst_dip > 5.5 && worst_rise < 3.7 && worst_rise > 3.0, label);
  std::printf("meeting, Level 0.5, Ears 0, twenty starts: worst dip %.2f dB, worst rise %.2f dB, longest stretch 3 dB under %.2f s\n",
              worst_dip, worst_rise, longest);

  // The default patch on A3: how deep and how long the low stretch at the meeting is.
  {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kLevel, pass == 0 ? p::kParamDefault[p::kLevel] : 0.0f);
      device.note_on(1, kA3, 0.7f);
      out[pass] = render(device, 9.0f, kRate);
    }
    std::vector<double> times;
    const std::vector<double> with = envelope(out[0].left, kRate, 6.0 / kA3, &times);
    const std::vector<double> alone = envelope(out[1].left, kRate, 6.0 / kA3);
    double deepest = 0.0, under = 0.0, longest_here = 0.0;
    for (size_t k = 0; k < with.size(); ++k) {
      if (times[k] < 4.5 || times[k] > 7.5) continue;
      const double change = db(with[k] / alone[k]);
      deepest = std::max(deepest, -change);
      under = change < -1.0 ? under + (times[1] - times[0]) : 0.0;
      longest_here = std::max(longest_here, under);
    }
    std::printf("default patch on A3, 4.5 to 7.5 s: deepest %.2f dB under the keys alone, longest stretch 1 dB under %.2f s\n", deepest,
                longest_here);
    EXPECT(deepest <= 6.5, "the default patch's meeting dips the output by no more than 6.5 dB");
  }
}

// --- the ears ---------------------------------------------------------------------------------

static void test_ears() {
  char label[240];
  auto play_ears = [&](float ears, float warmth, float level) {
    plain(device);
    device.set_param(p::kTime, 4.0f);
    device.set_param(p::kReach, 2.0f);
    device.set_param(p::kEars, ears);
    device.set_param(p::kWarmth, warmth);
    device.set_param(p::kLevel, level);
    device.note_on(1, kA3, 0.7f);
    return render(device, 4.0f, kRate);
  };

  // Ears 1 with Warmth full: the key's partials mark the keys' side.
  {
    Stereo out = play_ears(1.0f, 1.0f, 1.0f);
    const double left2 = tone_level(out.left, 2.0 * kA3, kRate, at(0.5), at(3.5));
    const double right2 = tone_level(out.right, 2.0 * kA3, kRate, at(0.5), at(3.5));
    std::snprintf(label, sizeof label, "Ears 1: the key's second partial is %.1f dB on the left and %.1f dB on the right", db(left2),
                  db(right2));
    EXPECT(left2 > 0.01 && right2 < 1.0e-5, label);
  }
  // Ears 1: the left is the key alone to the sample, so no dip at the meeting (2 s here).
  {
    Stereo both = play_ears(1.0f, 0.0f, 1.0f);
    Stereo alone = play_ears(1.0f, 0.0f, 0.0f);
    double worst = 0.0;
    for (size_t i = 0; i < both.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(both.left[i]) - alone.left[i]));
    const std::vector<double> level = envelope(both.left, kRate, 6.0 / kA3);
    double lo = 1.0e9, hi = 0.0;
    for (size_t k = 8; k < level.size(); ++k) {
      lo = std::min(lo, level[k]);
      hi = std::max(hi, level[k]);
    }
    std::snprintf(label, sizeof label, "Ears 1: the left is the key alone (%.2g apart) and holds its level through the meeting (%.3f dB of ripple)",
                  worst, db(hi / lo));
    EXPECT(worst < 1.0e-7 && db(hi / lo) < 0.05 && lo > 0.01, label);

    // Ears 0 for contrast: both sides the same to the sample, and the beat at full depth.
    Stereo centre = play_ears(0.0f, 0.0f, 1.0f);
    const std::vector<double> beat = envelope(centre.left, kRate, 6.0 / kA3);
    double low = 1.0e9, high = 0.0;
    for (size_t k = 8; k < beat.size(); ++k) {
      low = std::min(low, beat[k]);
      high = std::max(high, beat[k]);
    }
    std::snprintf(label, sizeof label, "Ears 0: the two sides are the same sample for sample and the beat is %.1f dB deep at Level 1",
                  db(high / low));
    EXPECT(centre.left == centre.right, "Ears 0: the two sides are the same sample for sample");
    EXPECT(db(high / low) > 12.0, label);

    // The law between: left = same K + other S, right = other K + same S, and the mid never moves.
    const std::vector<float>& keys = both.left;
    const std::vector<float>& sine = both.right;
    for (float ears : {0.0f, 0.25f, 0.5f, 0.8f}) {
      Stereo out = play_ears(ears, 0.0f, 1.0f);
      const double same = 0.5 + 0.5 * ears, other_gain = 0.5 - 0.5 * ears;
      double law = 0.0, moved = 0.0;
      for (size_t i = 0; i < out.size(); ++i) {
        law = std::max(law, std::fabs(out.left[i] - (same * keys[i] + other_gain * sine[i])));
        law = std::max(law, std::fabs(out.right[i] - (other_gain * keys[i] + same * sine[i])));
        moved = std::max(moved, std::fabs(0.5 * (out.left[i] + out.right[i]) - 0.5 * (keys[i] + sine[i])));
      }
      const std::vector<float> m = mid(out);
      std::vector<float> s(out.size());
      for (size_t i = 0; i < out.size(); ++i) s[i] = 0.5f * (out.left[i] - out.right[i]);
      const double width = ears > 0.0f ? db(rms(s, at(0.1), at(1.0)) / rms(m, at(0.1), at(1.0))) : -200.0;
      std::snprintf(label, sizeof label, "Ears %.2f: the law holds to %.2g, the mid is the mid of Ears 1 to %.2g, side over mid %.2f dB", ears,
                    law, moved, width);
      EXPECT(law < 1.0e-6 && moved < 1.0e-6, label);
      if (ears > 0.0f) EXPECT(std::fabs(width - 20.0 * std::log10(ears)) < 0.3, label);
    }
  }
}

// --- the limits follow the held keys ---------------------------------------------------------

static void test_limits() {
  char label[240];
  const float e4 = static_cast<float>(hz_of(64)), a4 = static_cast<float>(hz_of(69));
  const double tau = 0.4;  // written out, as in the manifest's note: a change in the header shows here

  // A chord added at 3 s and taken away at 6 s of a sweep under way, at Ears
  // 0.3 with the default Warmth: the same at every block size.
  {
    const std::vector<Event> phrase = {on(0.0, 1, kA3),  on(3.0, 2, e4), on(3.0, 3, a4, 0.5f), off(6.0, 2),
                                       off(6.0, 3),      off(8.0, 1)};
    Stereo renders[4];
    const std::vector<int>* sizes[4] = {&kBlocks128, &kBlocks1, &kBlocks2048, &kBlocksRagged};
    for (int k = 0; k < 4; ++k) {
      device.init(kRate);
      device.set_param(p::kEars, 0.3f);
      device.set_param(p::kRelease, 0.5f);
      renders[k] = play(device, phrase, 10.0, *sizes[k]);
    }
    const double one = apart(renders[1], renders[0]), big = apart(renders[2], renders[0]), ragged = apart(renders[3], renders[0]);
    std::snprintf(label, sizeof label,
                  "a chord added and taken away in mid sweep is the same in blocks of 1, 2048 and ragged as in 128 (%.2g, %.2g, %.2g apart)", one,
                  big, ragged);
    EXPECT(one == 0.0 && big == 0.0 && ragged == 0.0 && both_peak(renders[0]) > 0.01, label);
  }

  // The same chord at Ears 1, where the right side is the sine alone: its
  // pitch follows lo + place (hi - lo), with hi gliding an octave up from the
  // moment A4 lands and back when it is let go.
  {
    plain(device);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kRelease, 0.5f);
    const std::vector<Event> phrase = {on(0.0, 1, kA3), on(3.0, 2, e4), on(3.0, 3, a4), off(6.0, 2), off(6.0, 3)};
    Stereo out = play(device, phrase, 11.0, kBlocks128);
    // Two one poles in a row, each of tau: after the first `a`, after the second `b`.
    auto expected = [&](double t) {
      double a = 0.0, b = 0.0;
      if (t > 3.0) {
        const double x = (std::min(t, 6.0) - 3.0) / tau;
        a = 12.0 * (1.0 - std::exp(-x));
        b = 12.0 * (1.0 - (1.0 + x) * std::exp(-x));
      }
      if (t > 6.0) {
        const double x = (t - 6.0) / tau;
        b = (b + a * x) * std::exp(-x);
      }
      return -0.5 + (t / 12.0) * (b + 1.0);
    };
    double worst = 0.0;
    for (double t : {2.9, 3.5, 4.0, 5.0, 5.9, 6.5, 7.0, 9.0, 10.5}) {
      const double guess = kA3 * std::pow(2.0, expected(t) / 12.0);
      const double got = semitones(frequency_at(out.right, guess, t, kRate, 0.04, 0.005), kA3);
      worst = std::max(worst, std::fabs(got - expected(t)));
    }
    std::snprintf(label, sizeof label, "the sine follows limits that glide through two one poles of %.1f s: %.4f st from the formula at the worst of nine times",
                  tau, worst);
    EXPECT(worst < 0.03, label);

    // No step: read every 5 ms across both changes, the pitch never moves
    // more than the glide itself can (at its steepest 12 / (e tau) st a
    // second, of which the sine takes its place's share: under 0.03 st a reading).
    double jump = 0.0;
    for (double centre : {3.0, 6.0}) {
      double last = 0.0;
      for (int k = -10; k <= 60; ++k) {
        const double t = centre + 0.005 * k;
        const double guess = kA3 * std::pow(2.0, expected(t) / 12.0);
        const double got = semitones(frequency_at(out.right, guess, t, kRate, 0.02, 0.005), kA3);
        if (k > -10) jump = std::max(jump, std::fabs(got - last));
        last = got;
      }
    }
    std::snprintf(label, sizeof label, "the limits move without a step: the sine's pitch changes by %.4f st at most between readings 5 ms apart", jump);
    EXPECT(jump < 0.04 && jump > 0.005, label);
  }

  // The glide of the limits is seconds, not samples: half a second after an
  // octave is added, the same place at every rate.
  for (float rate : kRates) {
    plain(device, rate);
    device.set_param(p::kEars, 1.0f);
    Stereo out = play(device, {on(0.0, 1, kA3), on(1.0, 2, a4)}, 2.0, kBlocks128, rate);
    const double x = 0.5 / tau;
    const double want = -0.5 + (1.5 / 12.0) * (12.0 * (1.0 - (1.0 + x) * std::exp(-x)) + 1.0);
    const double got = semitones(frequency_at(out.right, kA3 * std::pow(2.0, want / 12.0), 1.5, rate, 0.04, 0.005), kA3);
    std::snprintf(label, sizeof label, "%.0f Hz: half a second after an octave is added the sine is at %.4f st (expected %.4f)", rate, got, want);
    EXPECT(std::fabs(got - want) < 0.02, label);
  }

  // Two keys landing together give the same render in either order: from
  // silence, and joining a sweep under way.
  {
    Stereo first[2], second[2];
    for (int order = 0; order < 2; ++order) {
      plain(device);
      device.set_param(p::kWarmth, 0.5f);
      if (order == 0) {
        device.note_on(1, kA3, 0.7f);
        device.note_on(2, e4, 0.5f);
      } else {
        device.note_on(2, e4, 0.5f);
        device.note_on(1, kA3, 0.7f);
      }
      first[order] = render(device, 3.0f, kRate);

      plain(device);
      device.set_param(p::kWarmth, 0.5f);
      device.note_on(5, 261.63f, 0.7f);
      render(device, 1.0f, kRate);
      if (order == 0) {
        device.note_on(1, 196.0f, 0.7f);
        device.note_on(2, a4, 0.5f);
      } else {
        device.note_on(2, a4, 0.5f);
        device.note_on(1, 196.0f, 0.7f);
      }
      second[order] = render(device, 3.0f, kRate);
    }
    std::snprintf(label, sizeof label, "two keys landing together sound the same in either order (%.2g apart from silence, %.2g joining a sweep)",
                  apart(first[0], first[1]), apart(second[0], second[1]));
    EXPECT(apart(first[0], first[1]) < 1.0e-6 && apart(second[0], second[1]) < 1.0e-6 && both_peak(first[0]) > 0.01, label);
    // From silence both keys count at once: the sine starts Reach under the
    // lower one, with no glide from the first key's own range.
    plain(device);
    device.set_param(p::kEars, 1.0f);
    device.note_on(2, e4, 0.5f);
    device.note_on(1, kA3, 0.7f);
    Stereo out = render(device, 0.6f, kRate);
    const double span = 7.0 + 1.0;
    const double got = semitones(frequency_near(out.right, 150.0, 400.0, 0.3, kRate), kA3);
    std::snprintf(label, sizeof label, "a chord from silence: the sine is %.4f st from the lower key at 0.3 s (expected %.4f)", got,
                  -0.5 + span * 0.3 / 12.0);
    EXPECT(std::fabs(got - (-0.5 + span * 0.3 / 12.0)) < 0.01, label);
  }

  // Only the outer held keys count, and a key let go counts no longer; with
  // none held the limits stay where they were while the tail rings.
  {
    auto sine_pitch = [&](const std::vector<Event>& phrase, double t, double guess_st) {
      plain(device);
      device.set_param(p::kEars, 1.0f);
      device.set_param(p::kRelease, 4.0f);
      Stereo out = play(device, phrase, t + 0.5, kBlocks128);
      return semitones(frequency_at(out.right, kA3 * std::pow(2.0, guess_st / 12.0), t, kRate, 0.1, 0.01), kA3);
    };
    const double outer = sine_pitch({on(0.0, 1, kA3), on(0.0, 3, a4)}, 4.0, -0.5 + 13.0 * 4.0 / 12.0);
    const double inner = sine_pitch({on(0.0, 1, kA3), on(0.0, 3, a4), on(1.0, 2, e4)}, 4.0, outer);
    std::snprintf(label, sizeof label, "a key between the outer two leaves the sine where it was (%.4f against %.4f st)", inner, outer);
    EXPECT(std::fabs(inner - outer) < 0.002 && std::fabs(outer - (-0.5 + 13.0 * 4.0 / 12.0)) < 0.01, label);

    // A4 let go at 1 s: by 6 s (over six time constants on) the upper limit is back at A3 + Reach.
    const double let_go = sine_pitch({on(0.0, 1, kA3), on(0.0, 3, a4), off(1.0, 3)}, 6.0, 0.0);
    const double hi = 0.5 + 12.0 * (1.0 + 5.0 / tau) * std::exp(-5.0 / tau);
    std::snprintf(label, sizeof label, "a key let go leaves the limits: the sine is at %.4f st at 6 s (expected %.4f)", let_go,
                  -0.5 + 0.5 * (hi + 0.5));
    EXPECT(std::fabs(let_go - (-0.5 + 0.5 * (hi + 0.5))) < 0.02, label);

    // Every key let go at 1 s: the sine goes on between the limits it had.
    const double tail = sine_pitch({on(0.0, 1, kA3), on(0.0, 3, a4), off(1.0, 1), off(1.0, 3)}, 2.0, -0.5 + 13.0 * 2.0 / 12.0);
    std::snprintf(label, sizeof label, "with no key held the limits stay: the sine is at %.4f st at 2 s (expected %.4f)", tail,
                  -0.5 + 13.0 * 2.0 / 12.0);
    EXPECT(std::fabs(tail - (-0.5 + 13.0 * 2.0 / 12.0)) < 0.01, label);
  }

  // A chord let go a finger at a time, the lower key 30 ms before the upper:
  // the limits have hardly moved when the last key freezes them.
  {
    plain(device);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kRelease, 4.0f);
    Stereo out = play(device, {on(0.0, 1, kA3), on(0.0, 3, a4), off(1.0, 1), off(1.03, 3)}, 2.5, kBlocks128);
    const double want = -0.5 + 13.0 * 2.0 / 12.0;
    const double got = semitones(frequency_at(out.right, kA3 * std::pow(2.0, want / 12.0), 2.0, kRate, 0.1, 0.01), kA3);
    std::snprintf(label, sizeof label, "a chord let go 30 ms apart keeps its range: the sine is at %.4f st at 2 s (%.4f with both held)", got, want);
    EXPECT(std::fabs(got - want) < 0.05, label);
  }

  // Reach moved while a key sounds: the limits glide to it.
  {
    plain(device);
    device.set_param(p::kEars, 1.0f);
    Stereo out = play(device, {on(0.0, 1, kA3), set(1.0, p::kReach, 2.0f)}, 4.0, kBlocks128);
    const double still = -0.5 * (1.0 - 2.0 * 1.02 / 12.0);
    const double near = semitones(frequency_at(out.right, kA3 * std::pow(2.0, still / 12.0), 1.02, kRate, 0.02, 0.005), kA3);
    const double reach = 2.0 - 1.5 * (1.0 + 2.0 / tau) * std::exp(-2.0 / tau);
    const double want = -reach * (1.0 - 2.0 * 3.0 / 12.0);
    const double far = semitones(frequency_at(out.right, kA3 * std::pow(2.0, want / 12.0), 3.0, kRate, 0.1, 0.01), kA3);
    std::snprintf(label, sizeof label,
                  "Reach thrown from 0.5 to 2 at 1 s: the sine is at %.4f st 20 ms later (%.4f unmoved) and %.4f st at 3 s (expected %.4f)", near,
                  still, far, want);
    EXPECT(std::fabs(near - still) < 0.01 && std::fabs(far - want) < 0.01, label);
  }
}

// --- the sine is gated by the keys -----------------------------------------------------------

static size_t last_sound(const std::vector<float>& x) {
  for (size_t i = x.size(); i > 0; --i) {
    if (x[i - 1] != 0.0f) return i - 1;
  }
  return 0;
}

static void test_gate() {
  char label[240];
  // Through a slow attack and a release the sine keeps its Level against the key.
  {
    plain(device);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 0.5f);
    device.note_on(1, kA3, 0.7f);
    Stereo rise = render(device, 2.0f, kRate);
    device.note_off(1);
    Stereo fall = render(device, 2.0f, kRate);
    double worst = 0.0;
    for (double t : {0.1, 0.3, 0.6, 1.5}) {
      const double ratio = rms(rise.right, at(t), at(t + 0.05)) / rms(rise.left, at(t), at(t + 0.05));
      worst = std::max(worst, std::fabs(ratio - 0.5));
    }
    for (double t : {0.05, 0.15, 0.3}) {
      const double ratio = rms(fall.right, at(t), at(t + 0.05)) / rms(fall.left, at(t), at(t + 0.05));
      worst = std::max(worst, std::fabs(ratio - 0.5));
    }
    const size_t key_end = last_sound(fall.left), sine_end = last_sound(fall.right);
    std::snprintf(label, sizeof label,
                  "the sine rises and falls with the key (Level off by %.4f at the worst) and stops with it (key %.4f s, sine %.4f s after the release)",
                  worst, key_end / kRate, sine_end / kRate);
    EXPECT(worst < 0.01 && sine_end <= key_end && key_end > at(0.3) && key_end < at(1.0), label);
    Stereo after = render(device, 0.5f, kRate);
    EXPECT(both_peak(after) == 0.0, "exact zero once the last key's release has ended");
    EXPECT(rms(rise.right, at(0.05), at(0.15)) < 0.5 * rms(rise.right, at(1.5), at(1.6)), "the sine fades in with a slow Attack");
  }
  // Two keys: the sine stands against the louder, and against the other once the louder has gone.
  {
    const float e4 = static_cast<float>(hz_of(64));
    plain(device);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kRelease, 0.1f);
    device.note_on(1, kA3, 1.0f);
    device.note_on(2, e4, 0.3f);
    Stereo both = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo one = render(device, 1.5f, kRate);
    const double loud = std::sqrt(2.0) * rms(both.right, at(0.5), at(1.0)) / tone_level(both.left, kA3, kRate, at(0.5), at(1.0));
    const double soft = std::sqrt(2.0) * rms(one.right, at(1.0), at(1.5)) / tone_level(one.left, e4, kRate, at(1.0), at(1.5));
    std::snprintf(label, sizeof label, "the sine is %.4f of the louder key, and %.4f of the softer once the louder has gone", loud, soft);
    EXPECT(std::fabs(loud - 0.5) < 0.01 && std::fabs(soft - 0.5) < 0.01, label);
  }
  // A key at gain 0 opens no sine.
  {
    plain(device);
    device.note_on(1, kA3, 0.0f);
    Stereo out = render(device, 0.5f, kRate);
    EXPECT(both_peak(out) == 0.0, "a key at gain 0 is silent, sine and all");
  }
}

// --- the held tones and their envelope --------------------------------------------------------

static void test_tone_and_envelope() {
  char label[240];
  for (float rate : kRates) {
    // Warmth adds the second, third and fourth partials at 0.5, 0.3 and 0.15
    // of the fundamental at full, and nothing above.
    double fundamental[3] = {0.0, 0.0, 0.0};
    int which = 0;
    for (float warmth : {0.0f, 0.5f, 1.0f}) {
      plain(device, rate);
      device.set_param(p::kLevel, 0.0f);
      device.set_param(p::kWarmth, warmth);
      device.note_on(1, kA3, 0.7f);
      Stereo out = render(device, 1.0f, rate);
      double part[6];
      for (int k = 1; k <= 5; ++k) part[k] = tone_level(out.left, k * kA3, rate, at(0.5, rate), at(1.0, rate));
      fundamental[which++] = part[1];
      std::snprintf(label, sizeof label, "%.0f Hz, Warmth %.1f: partials 2, 3, 4 and 5 are %.4f, %.4f, %.4f and %.6f of the fundamental", rate,
                    warmth, part[2] / part[1], part[3] / part[1], part[4] / part[1], part[5] / part[1]);
      EXPECT(std::fabs(part[2] / part[1] - 0.5 * warmth) < 0.005 && std::fabs(part[3] / part[1] - 0.3 * warmth) < 0.005 &&
                 std::fabs(part[4] / part[1] - 0.15 * warmth) < 0.005 && part[5] / part[1] < 1.0e-4,
             label);
    }
    // The fundamental gives up a little so the tone's peak never passes the pure sine's.
    const double cost = db(fundamental[2] / fundamental[0]);
    std::snprintf(label, sizeof label, "%.0f Hz: full Warmth costs the fundamental %.2f dB", rate, -cost);
    EXPECT(cost < -0.5 && cost > -2.5, label);

    // Attack and Release are seconds at every rate.
    plain(device, rate);
    device.set_param(p::kLevel, 0.0f);
    device.set_param(p::kAttack, 0.5f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, kA3, 0.7f);
    Stereo rise = render(device, 1.0f, rate);
    device.note_off(1);
    Stereo fall = render(device, 1.2f, rate);
    const double full = rms(rise.left, at(0.8, rate), at(1.0, rate));
    const double half_way = rms(rise.left, at(0.24, rate), at(0.26, rate)) / full;
    const double arrived = rms(rise.left, at(0.5, rate), at(0.52, rate)) / full;
    const double half_down = db(rms(fall.left, at(0.49, rate), at(0.51, rate)) / full);
    std::snprintf(label, sizeof label,
                  "%.0f Hz: Attack 0.5 s is %.3f of the way at 0.25 s and %.3f at 0.5 s; Release 1 s is %.1f dB down at 0.5 s", rate, half_way,
                  arrived, half_down);
    EXPECT(std::fabs(half_way - 0.675) < 0.03 && arrived > 0.99 && std::fabs(half_down + 30.0) < 1.0, label);
  }

  // A key near the top of the range gives up its partials before they can
  // fold: at 44.1 kHz a key at 5200 Hz is a pure sine, one at 4000 Hz is whole.
  {
    plain(device, 44100.0f);
    device.set_param(p::kLevel, 0.0f);
    device.set_param(p::kWarmth, 1.0f);
    device.note_on(1, 5200.0f, 0.7f);
    Stereo high = render(device, 0.5f, 44100.0f);
    const double f1 = tone_level(high.left, 5200.0, 44100.0, at(0.2, 44100.0), at(0.5, 44100.0));
    const double rest = std::sqrt(std::max(0.0, 2.0 * rms(high.left, at(0.2, 44100.0), at(0.5, 44100.0)) *
                                                    rms(high.left, at(0.2, 44100.0), at(0.5, 44100.0)) - f1 * f1));
    plain(device, 44100.0f);
    device.set_param(p::kLevel, 0.0f);
    device.set_param(p::kWarmth, 1.0f);
    device.note_on(1, 4000.0f, 0.7f);
    Stereo whole = render(device, 0.5f, 44100.0f);
    const double w1 = tone_level(whole.left, 4000.0, 44100.0, at(0.2, 44100.0), at(0.5, 44100.0));
    const double w4 = tone_level(whole.left, 16000.0, 44100.0, at(0.2, 44100.0), at(0.5, 44100.0));
    std::snprintf(label, sizeof label, "at 44.1 kHz a key at 5200 Hz has %.4f of its level outside the fundamental; one at 4000 Hz keeps its fourth partial (%.3f)",
                  rest / f1, w4 / w1);
    EXPECT(rest / f1 < 0.01 && std::fabs(w4 / w1 - 0.15) < 0.01, label);
  }
}

// --- voices -----------------------------------------------------------------------------------

static void test_voices() {
  char label[240];
  const float e4 = static_cast<float>(hz_of(64));
  auto level_of = [&](const Stereo& s, double hz, double from, double to) {
    return tone_level(s.left, hz, kRate, at(from), at(to));
  };

  // The keys are scaled by the root of their summed power: a second key of
  // the same gain takes the first down 3 dB; two soft keys are not scaled.
  {
    plain(device);
    device.set_param(p::kLevel, 0.0f);
    device.note_on(1, kA3, 1.0f);
    Stereo one = render(device, 1.0f, kRate);
    device.note_on(2, e4, 1.0f);
    Stereo two = render(device, 1.0f, kRate);
    const double drop = db(level_of(two, kA3, 0.5, 1.0) / level_of(one, kA3, 0.5, 1.0));
    plain(device);
    device.set_param(p::kLevel, 0.0f);
    device.note_on(1, kA3, 0.5f);
    Stereo soft = render(device, 1.0f, kRate);
    device.note_on(2, e4, 0.5f);
    Stereo softer = render(device, 1.0f, kRate);
    const double none = db(level_of(softer, kA3, 0.5, 1.0) / level_of(soft, kA3, 0.5, 1.0));
    std::snprintf(label, sizeof label, "a second key at full gain takes the first down %.2f dB; at half gain %.2f dB", -drop, -none);
    EXPECT(std::fabs(drop + 3.01) < 0.05 && std::fabs(none) < 0.02, label);
  }

  const int chord[8] = {48, 50, 52, 53, 55, 57, 59, 60};
  auto hold_chord = [&](StillPoint& d) {
    plain(d);
    d.set_param(p::kLevel, 0.0f);
    for (int n = 0; n < 8; ++n) d.note_on(n, static_cast<float>(hz_of(chord[n])), 0.8f);
  };

  // A full pool and two more keys back to back: both arrive, the two oldest make room.
  {
    hold_chord(device);
    Stereo held = render(device, 1.0f, kRate);
    const double each = level_of(held, hz_of(52), 0.5, 1.0);
    device.note_on(20, static_cast<float>(hz_of(78)), 0.8f);
    device.note_on(21, static_cast<float>(hz_of(85)), 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    const double a = level_of(out, hz_of(78), 0.5, 1.0), b = level_of(out, hz_of(85), 0.5, 1.0);
    const double gone0 = level_of(out, hz_of(48), 0.5, 1.0), gone1 = level_of(out, hz_of(50), 0.5, 1.0);
    const double kept = level_of(out, hz_of(52), 0.5, 1.0);
    std::snprintf(label, sizeof label,
                  "two keys into a full pool both sound (%.1f and %.1f dB against a held key), the two oldest are gone (%.0f and %.0f dB), the third stays (%.1f dB)",
                  db(a / each), db(b / each), db(gone0 / each), db(gone1 / each), db(kept / each));
    EXPECT(std::fabs(db(a / each)) < 0.5 && std::fabs(db(b / each)) < 0.5 && db(gone0 / each) < -50.0 && db(gone1 / each) < -50.0 &&
               std::fabs(db(kept / each)) < 0.5,
           label);
  }

  // A voice whose old key is still fading has a key waiting in it and is not
  // taken a second time: two keys into a full pool 5 ms apart, a quarter of
  // the way through the first one's fade, both arrive.
  {
    hold_chord(device);
    Stereo held = render(device, 1.0f, kRate);
    const double each = level_of(held, hz_of(52), 0.5, 1.0);
    device.note_on(20, static_cast<float>(hz_of(78)), 0.8f);
    render(device, 0.005f, kRate);
    device.note_on(21, static_cast<float>(hz_of(85)), 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    const double a = level_of(out, hz_of(78), 0.5, 1.0), b = level_of(out, hz_of(85), 0.5, 1.0);
    const double gone0 = level_of(out, hz_of(48), 0.5, 1.0), gone1 = level_of(out, hz_of(50), 0.5, 1.0);
    const double kept = level_of(out, hz_of(52), 0.5, 1.0);
    std::snprintf(label, sizeof label,
                  "two keys into a full pool 5 ms apart both sound (%.1f and %.1f dB against a held key), the two oldest are gone (%.0f and %.0f dB), the third stays (%.1f dB)",
                  db(a / each), db(b / each), db(gone0 / each), db(gone1 / each), db(kept / each));
    EXPECT(std::fabs(db(a / each)) < 0.5 && std::fabs(db(b / each)) < 0.5 && db(gone0 / each) < -50.0 && db(gone1 / each) < -50.0 &&
               std::fabs(db(kept / each)) < 0.5,
           label);
  }

  // A key counts at its gain from the moment it is struck, before its attack
  // has moved: seven soft keys held, then a loud eighth and a loud ninth in
  // one instant. The ninth takes the oldest soft key, not the loud key that
  // has yet to sound.
  {
    plain(device);
    device.set_param(p::kLevel, 0.0f);
    for (int n = 0; n < 7; ++n) device.note_on(n, static_cast<float>(hz_of(chord[n])), 0.2f);
    render(device, 0.5f, kRate);
    device.note_on(7, static_cast<float>(hz_of(78)), 1.0f);
    device.note_on(8, static_cast<float>(hz_of(85)), 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    const double eighth = level_of(out, hz_of(78), 0.5, 1.0), ninth = level_of(out, hz_of(85), 0.5, 1.0);
    const double oldest = level_of(out, hz_of(48), 0.5, 1.0), second = level_of(out, hz_of(50), 0.5, 1.0);
    std::snprintf(label, sizeof label,
                  "a loud key and one more struck together over seven soft keys both sound (%.2f dB apart), the oldest soft key makes room (%.0f dB against the next, which is %.2f dB under the loud key)",
                  db(eighth / ninth), db(oldest / second), -db(second / eighth));
    EXPECT(std::fabs(db(eighth / ninth)) < 0.5 && db(oldest / second) < -40.0 && std::fabs(db(second / eighth) + 13.98) < 0.5, label);
  }

  // Every voice equally loud, the extra key struck twice in one block: it
  // takes one voice, the chord's second note stays, and one note off each
  // ends everything.
  {
    hold_chord(device);
    Stereo held = render(device, 1.0f, kRate);
    const double each = level_of(held, hz_of(52), 0.5, 1.0);
    device.note_on(30, static_cast<float>(hz_of(78)), 0.8f);
    device.note_on(30, static_cast<float>(hz_of(78)), 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    const double extra = level_of(out, hz_of(78), 0.5, 1.0), second = level_of(out, hz_of(50), 0.5, 1.0);
    for (int n = 0; n < 8; ++n) device.note_off(n);
    device.note_off(30);
    render(device, 0.3f, kRate);
    Stereo after = render(device, 0.2f, kRate);
    std::snprintf(label, sizeof label,
                  "a key struck twice into a full pool of equal voices takes one voice (%.1f dB), the chord's second note stays (%.1f dB), and all ends on the note offs (peak %g)",
                  db(extra / each), db(second / each), both_peak(after));
    EXPECT(std::fabs(db(extra / each)) < 0.5 && std::fabs(db(second / each)) < 0.5 && both_peak(after) == 0.0, label);
  }

  // A held key struck again carries on in its own voice: the same level, a
  // new gain reached smoothly, and one note off ends it.
  {
    plain(device);
    device.set_param(p::kLevel, 0.0f);
    device.note_on(1, kA3, 0.7f);
    Stereo first = render(device, 1.0f, kRate);
    device.note_on(1, kA3, 0.7f);
    Stereo again = render(device, 1.0f, kRate);
    device.note_on(1, kA3, 0.35f);
    Stereo softer = render(device, 1.0f, kRate);
    device.note_off(1);
    render(device, 0.3f, kRate);
    Stereo after = render(device, 0.2f, kRate);
    const double same = db(level_of(again, kA3, 0.0, 1.0) / level_of(first, kA3, 0.5, 1.0));
    const double half = db(level_of(softer, kA3, 0.5, 1.0) / level_of(first, kA3, 0.5, 1.0));
    std::snprintf(label, sizeof label, "a held key struck again keeps its level (%.3f dB), takes a new gain (%.2f dB at half), and one note off ends it (peak %g)",
                  same, half, both_peak(after));
    EXPECT(std::fabs(same) < 0.02 && std::fabs(half + 6.02) < 0.05 && both_peak(after) == 0.0, label);
  }

  // The same pitch under another id while the first rings out: the new voice
  // starts in phase with the old, so the two add and never cancel. Eight
  // moments, none a whole number of periods apart.
  {
    double least = 1.0e9;
    for (int trial = 0; trial < 8; ++trial) {
      Stereo out[2];
      for (int pass = 0; pass < 2; ++pass) {
        plain(device);
        device.set_param(p::kLevel, 0.0f);
        device.set_param(p::kAttack, 0.3f);
        device.set_param(p::kRelease, 2.0f);
        device.note_on(1, kA3, 0.7f);
        render(device, 1.0f + 0.00057f * static_cast<float>(trial), kRate);
        device.note_off(1);
        render(device, 0.2f, kRate);
        if (pass == 0) device.note_on(2, kA3, 0.7f);
        out[pass] = render(device, 1.0f, kRate);
      }
      const std::vector<double> with = envelope(out[0].left, kRate, 6.0 / kA3);
      const std::vector<double> tail = envelope(out[1].left, kRate, 6.0 / kA3);
      for (size_t k = 0; k < with.size(); ++k) least = std::min(least, db(with[k] / tail[k]));
    }
    std::snprintf(label, sizeof label, "a pitch played again under another id while it rings out never falls under the old tail (%.2f dB at the least)", least);
    EXPECT(least > -0.05, label);
  }

  // Every voice busy and every key struck again: each keeps the set release.
  {
    hold_chord(device);
    device.set_param(p::kRelease, 2.0f);
    render(device, 0.5f, kRate);
    for (int n = 0; n < 8; ++n) device.note_on(n, static_cast<float>(hz_of(chord[n])), 0.8f);
    Stereo held = render(device, 0.5f, kRate);
    for (int n = 0; n < 8; ++n) device.note_off(n);
    Stereo tail = render(device, 1.0f, kRate);
    // The scale lets go as the power falls under one, so read one key against itself: 15 dB of envelope
    // and 15 - 10 log10(8 x 0.64) of scale given back.
    const double down = db(level_of(tail, hz_of(52), 0.45, 0.55) / level_of(held, hz_of(52), 0.2, 0.5));
    std::snprintf(label, sizeof label, "keys struck again with every voice busy keep their release: %.1f dB down a quarter of the way", -down);
    EXPECT(std::fabs(down + 15.0 - 10.0 * std::log10(8.0 * 0.64)) < 1.5, label);
  }

  // Absurd notes: not a number is ignored, gains and pitches are held to their range, an unknown note off does nothing.
  {
    plain(device);
    device.note_on(1, std::nanf(""), 0.7f);
    Stereo nothing = render(device, 0.2f, kRate);
    EXPECT(both_peak(nothing) == 0.0, "a key whose pitch is not a number is ignored");
    Stereo loud[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.note_on(1, kA3, pass == 0 ? 1.0f : 7.0f);
      if (pass == 1) device.note_off(99);
      loud[pass] = render(device, 0.5f, kRate);
    }
    EXPECT(apart(loud[0], loud[1]) == 0.0, "a gain over 1 is a gain of 1, and a note off for a key not held changes nothing");
    plain(device);
    device.set_param(p::kLevel, 0.0f);
    device.note_on(1, 30000.0f, 0.7f);
    Stereo top = render(device, 0.5f, kRate);
    const double hz = dominant_frequency(top.left, kRate, 8000.0, 20000.0, at(0.2), at(0.3));
    std::snprintf(label, sizeof label, "a key at 30 kHz plays at %.0f Hz", hz);
    EXPECT(std::fabs(hz - 12000.0) < 5.0, label);
  }
}

// --- levels -----------------------------------------------------------------------------------

static void test_levels() {
  char label[240];
  // One key at gain 0.7 at the default patch, over a whole pass and its meeting.
  for (float rate : kRates) {
    device.init(rate);
    device.note_on(1, kA3, 0.7f);
    Stereo out = render(device, 13.0f, rate);
    device.init(rate);
    device.set_param(p::kEars, 1.0f);
    device.note_on(1, kA3, 0.7f);
    Stereo split = render(device, 3.0f, rate);
    std::snprintf(label, sizeof label, "%.0f Hz: one key at gain 0.7 peaks at %.2f dBFS at the default patch; at Ears 1 the key's ear peaks at %.2f dBFS",
                  rate, db(both_peak(out)), db(peak(split.left)));
    EXPECT(db(both_peak(out)) > -24.0 && db(both_peak(out)) < -10.0 && std::fabs(db(peak(split.left)) + 18.5) < 1.0, label);
    if (rate == kRate) std::printf("%s\n", label);
  }

  // Eight keys at full gain, in step: the same pitch under eight ids starts
  // in phase, which is the worst a pool can add up to. At the default Volume
  // it reaches the edge of the clip's knee (0.5) and no further, at every
  // setting of Ears, Warmth and Level.
  double highest = 0.0, at_edge = 0.0;
  for (float ears : {0.0f, 0.5f, 1.0f}) {
    for (float warmth : {0.0f, 0.3f, 1.0f}) {
      for (float level : {0.0f, 0.5f, 1.0f}) {
        device.init(kRate);
        device.set_param(p::kAttack, 0.01f);
        device.set_param(p::kTime, 4.0f);
        device.set_param(p::kEars, ears);
        device.set_param(p::kWarmth, warmth);
        device.set_param(p::kLevel, level);
        for (int n = 0; n < 8; ++n) device.note_on(n, kA3, 1.0f);
        Stereo out = render(device, 4.5f, kRate);
        highest = std::max(highest, both_peak(out));
        if (ears == 1.0f && warmth == 0.0f) at_edge = std::max(at_edge, peak(out.left));
      }
    }
  }
  std::snprintf(label, sizeof label, "eight keys at full gain in step peak at %.4f at the most over 27 settings (the knee is 0.5); the keys' ear alone reaches %.4f",
                highest, at_edge);
  EXPECT(highest <= 0.5 && at_edge > 0.49, label);
  std::printf("%s\n", label);

  // Ten keys of a chord at full gain (the pool holds eight), a whole pass at each end of Ears.
  for (float ears : {0.0f, 1.0f}) {
    device.init(kRate);
    device.set_param(p::kEars, ears);
    device.set_param(p::kAttack, 0.01f);
    for (int n = 0; n < 10; ++n) device.note_on(n, static_cast<float>(hz_of(45 + 3 * n)), 1.0f);
    Stereo out = render(device, 13.0f, kRate);
    std::snprintf(label, sizeof label, "ten keys held at full gain peak at %.4f at Ears %.0f (the knee is 0.5)", both_peak(out), ears);
    EXPECT(both_peak(out) < 0.5 && both_peak(out) > 0.1, label);
  }

  // Volume is decibels, and past the default the soft clip holds the pile under full scale.
  {
    double held[2];
    int which = 0;
    for (float volume : {-12.0f, 0.0f}) {
      plain(device);
      device.set_param(p::kVolume, volume);
      device.set_param(p::kLevel, 0.0f);
      device.note_on(1, kA3, 0.7f);
      Stereo out = render(device, 0.5f, kRate);
      held[which++] = rms(out.left, at(0.2), at(0.5));
    }
    device.init(kRate);
    device.set_param(p::kAttack, 0.01f);
    device.set_param(p::kVolume, 6.0f);
    device.set_param(p::kEars, 1.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, kA3, 1.0f);
    Stereo pile = render(device, 1.0f, kRate);
    std::snprintf(label, sizeof label, "Volume moves the level by %.2f dB for 12; at +6 dB eight keys in step are held to %.4f by the soft clip",
                  db(held[1] / held[0]), both_peak(pile));
    EXPECT(std::fabs(db(held[1] / held[0]) - 12.0) < 0.01 && both_peak(pile) > 0.5 && both_peak(pile) < 1.0, label);
  }
}

// --- sleep, silences and block sizes ---------------------------------------------------------

static void test_sleep() {
  char label[240];
  const float e4 = static_cast<float>(hz_of(64)), c4 = static_cast<float>(hz_of(60));

  // A key, a silence, a chord. The silence is stepped in 20 ms steps across
  // the fall time and the idle hold (0.083 s and 0.05 s here) and well past,
  // with one long one; six controls are moved inside it, 3 ms before the
  // chord. Every block size must give the 128-frame render.
  double worst = 0.0, worst_gap = 0.0;
  std::vector<double> gaps;
  for (int k = 0; k <= 15; ++k) gaps.push_back(0.02 * k);
  gaps.push_back(2.0);
  for (double gap : gaps) {
    const double back = 0.3 + gap;
    const std::vector<Event> phrase = {on(0.0, 1, kA3),
                                       off(0.3, 1),
                                       set(back - 0.003, p::kReach, 2.0f),
                                       set(back - 0.003, p::kLevel, 0.9f),
                                       set(back - 0.003, p::kWarmth, 0.8f),
                                       set(back - 0.003, p::kEars, 0.4f),
                                       set(back - 0.003, p::kTime, 4.0f),
                                       set(back - 0.003, p::kVolume, -3.0f),
                                       on(back, 2, e4, 0.6f),
                                       on(back, 3, c4, 0.8f),
                                       off(back + 0.4, 2)};
    Stereo renders[4];
    const std::vector<int>* sizes[4] = {&kBlocks128, &kBlocks1, &kBlocks2048, &kBlocksRagged};
    for (int k = 0; k < 4; ++k) {
      plain(device);
      renders[k] = play(device, phrase, back + 0.7, *sizes[k]);
    }
    for (int k = 1; k < 4; ++k) {
      const double d = apart(renders[k], renders[0]);
      if (d > worst) {
        worst = d;
        worst_gap = gap;
      }
    }
    if (both_peak(renders[0], at(back + 0.1)) < 0.01) EXPECT(false, "the chord after the silence sounds");
  }
  std::snprintf(label, sizeof label,
                "across %d silences with controls moved inside them, blocks of 1, 2048 and ragged give the 128-frame render (%.2g apart at the worst, at a gap of %.2f s)",
                static_cast<int>(gaps.size()), worst, worst_gap);
  EXPECT(worst == 0.0, label);
  std::printf("%s\n", label);

  // A knob moved in silence is simply there on the next key: the same as a
  // device set that way from init. The device is sent off the beat of its
  // control clock first (one block of 13 while the key rings), then left
  // until asleep (0.5 s) or awake and silent (0.1 s, inside the idle hold).
  for (float wait : {0.5f, 0.1f}) {
    auto settings = [&](StillPoint& d) {
      d.set_param(p::kTime, 4.0f);
      d.set_param(p::kReach, 3.0f);
      d.set_param(p::kLevel, 1.0f);
      d.set_param(p::kEars, 0.7f);
      d.set_param(p::kWarmth, 1.0f);
      d.set_param(p::kAttack, 0.2f);
      d.set_param(p::kRelease, 0.4f);
      d.set_param(p::kVolume, -9.0f);
    };
    plain(device);
    device.note_on(1, kA3, 0.7f);
    render(device, 0.3f, kRate);
    device.note_off(1);
    device.process(13);
    Stereo silent = render(device, wait, kRate);
    settings(device);
    device.note_on(2, e4, 0.6f);
    Stereo moved = render(device, 1.0f, kRate);

    plain(other);
    settings(other);
    other.note_on(2, e4, 0.6f);
    Stereo fresh = render(other, 1.0f, kRate);
    std::snprintf(label, sizeof label,
                  "eight knobs moved in a silence of %.1f s are there on the next key: %.2g from a device set that way from init (silence peak %g)",
                  wait, apart(moved, fresh), both_peak(silent, at(0.09)));
    EXPECT(apart(moved, fresh) == 0.0 && both_peak(silent, at(0.09)) == 0.0 && both_peak(fresh) > 0.01, label);
  }

  // A control set after the key but before its first sample is there too.
  {
    plain(device);
    device.note_on(1, kA3, 0.7f);
    render(device, 0.2f, kRate);
    device.note_off(1);
    render(device, 0.5f, kRate);
    device.note_on(2, e4, 0.6f);
    device.set_param(p::kLevel, 1.0f);
    device.set_param(p::kReach, 3.0f);
    Stereo late = render(device, 0.5f, kRate);
    plain(other);
    other.set_param(p::kLevel, 1.0f);
    other.set_param(p::kReach, 3.0f);
    other.note_on(2, e4, 0.6f);
    Stereo fresh = render(other, 0.5f, kRate);
    std::snprintf(label, sizeof label, "controls set between a key from silence and its first sample are there at once (%.2g apart)", apart(late, fresh));
    EXPECT(apart(late, fresh) == 0.0, label);
  }

  // A second init after a busy passage equals a first one.
  {
    device.init(kRate);
    device.set_param(p::kReach, 7.0f);
    device.set_param(p::kEars, 1.0f);
    for (int n = 0; n < 12; ++n) device.note_on(n, static_cast<float>(hz_of(40 + 5 * n)), 0.9f);
    render(device, 0.777f, kRate);
    device.init(kRate);
    device.note_on(1, kA3, 0.7f);
    device.note_on(2, e4, 0.7f);
    Stereo second = render(device, 1.0f, kRate);
    static StillPoint untouched;
    untouched.init(kRate);
    untouched.note_on(1, kA3, 0.7f);
    untouched.note_on(2, e4, 0.7f);
    Stereo first = render(untouched, 1.0f, kRate);
    EXPECT(second.left == first.left && second.right == first.right, "a second init after a busy passage equals a first one, bit for bit");
  }
}

// --- nothing begins at once -------------------------------------------------------------------

static void test_clicks() {
  char label[240];
  const float e4 = static_cast<float>(hz_of(64)), a4 = static_cast<float>(hz_of(69));
  auto one = [](StillPoint& d) { d.note_on(1, kA3, 0.7f); };
  auto three = [&](StillPoint& d) {
    d.note_on(1, kA3, 0.7f);
    d.note_on(2, e4, 0.7f);
    d.note_on(3, a4, 0.7f);
  };
  // Eight low keys, close to pure: a step would stand out.
  auto eight = [](StillPoint& d) {
    for (int n = 0; n < 8; ++n) d.note_on(n, static_cast<float>(hz_of(36 + 2 * n)), 0.8f);
  };

  const double steal = suddenness(eight, [](StillPoint& d) { d.note_on(8, static_cast<float>(hz_of(55)), 0.8f); });
  const double again = suddenness(one, [](StillPoint& d) { d.note_on(1, kA3, 0.2f); });
  const double same = suddenness(one, [](StillPoint& d) { d.note_on(2, kA3, 0.7f); });
  const double let_go = suddenness(one, [](StillPoint& d) { d.note_off(1); });
  const double added = suddenness(one, [&](StillPoint& d) {
    d.note_on(2, e4, 0.7f);
    d.note_on(3, a4, 0.7f);
  });
  const double taken = suddenness(three, [](StillPoint& d) {
    d.note_off(2);
    d.note_off(3);
  });
  std::snprintf(label, sizeof label,
                "after 8 samples a steal is %.3f of the way, a second strike %.3f, the same pitch under a new id %.3f, a note off at the shortest Release %.3f, a chord added %.3f, a chord let go %.3f",
                steal, again, same, let_go, added, taken);
  EXPECT(steal < 0.15 && again < 0.15 && same < 0.15 && let_go < 0.15 && added < 0.15 && taken < 0.15, label);
  EXPECT(steal > 0.0 && again > 0.0 && same > 0.0 && let_go > 0.0 && added > 0.0 && taken > 0.0, "each of those events changes the sound");
  std::printf("%s\n", label);

  // Every control thrown from one end to the other, both ways, on three keys in mid sweep.
  for (int id = 0; id < p::kNumParams; ++id) {
    const float low = id == p::kVolume ? -12.0f : p::kParamMin[id];
    const float high = p::kParamMax[id];
    auto setup = [&](float value) {
      return [&, value](StillPoint& d) {
        d.set_param(p::kEars, 0.5f);
        d.set_param(p::kWarmth, 0.5f);
        // The envelope's own times are heard only while it moves: throw
        // Attack in mid attack, and Release in mid release.
        if (id == p::kAttack) d.set_param(p::kAttack, 10.0f);
        if (id == p::kRelease) d.set_param(p::kRelease, 15.0f);
        if (id != p::kAttack && id != p::kRelease) d.set_param(id, value);
        three(d);
        if (id == p::kRelease) {
          d.process(64);
          d.note_off(1);
          d.note_off(2);
          d.note_off(3);
        }
      };
    };
    const bool envelope_time = id == p::kAttack || id == p::kRelease;
    double moved_up = 0.0, moved_down = 0.0;
    const double up = suddenness(setup(low), [&](StillPoint& d) { d.set_param(id, envelope_time ? low : high); }, &moved_up);
    const double down = suddenness(setup(high), [&](StillPoint& d) { d.set_param(id, low); }, &moved_down);
    std::snprintf(label, sizeof label,
                  "param %d thrown across its range is %.3f and %.3f of the way after 8 samples (it moves the sound by %.2g and %.2g within 20 ms)", id,
                  up, down, moved_up, moved_down);
    EXPECT(up < 0.15 && down < 0.15 && moved_up > 1.0e-6 && moved_down > 1.0e-6, label);
    std::printf("%s\n", label);
  }
}

// --- what a display may read ------------------------------------------------------------------

static void test_readings() {
  char label[240];
  device.init(kRate);
  EXPECT(device.meter(3) == 0.0f, "the gate reads 0 before any key");
  plain(device);
  device.set_param(p::kEars, 1.0f);
  device.note_on(1, kA3, 0.7f);
  Stereo out = render(device, 3.1f, kRate);
  const double heard = 57.0 + semitones(frequency_at(out.right, kA3 * std::pow(2.0, -0.25 / 12.0), 3.0, kRate), kA3);
  render(device, 2.9f, kRate);
  const float sine = device.meter(0), low = device.meter(1), high = device.meter(2), gate = device.meter(3);
  std::snprintf(label, sizeof label, "at 6 s of the default sweep on A3 the readings are sine %.4f, limits %.4f and %.4f, gate %.3f", sine, low,
                high, gate);
  EXPECT(std::fabs(sine - 57.0f) < 0.01f && std::fabs(low - 56.5f) < 1.0e-3f && std::fabs(high - 57.5f) < 1.0e-3f &&
             std::fabs(gate - 0.7f) < 1.0e-3f && std::fabs(heard - 56.75) < 0.005,
         label);
  device.note_off(1);
  render(device, 0.5f, kRate);
  EXPECT(device.meter(3) == 0.0f && device.meter(99) == 0.0f, "the gate reads 0 once the key has gone, and an unknown reading is 0");
  // Reading changes nothing.
  Stereo with[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.note_on(1, kA3, 0.7f);
    for (int block = 0; block < 100; ++block) {
      if (pass == 1) {
        for (int m = 0; m < 4; ++m) (void)device.meter(m);
      }
      with[pass] = concat(with[pass], render(device, 128.0f / kRate, kRate));
    }
  }
  EXPECT(apart(with[0], with[1]) == 0.0, "reading the meters changes nothing in the sound");
}

// --- guards a checker's mutants got past ------------------------------------------------------

// The sweep written out from the manifest, for one key from silence: the
// sine's pitch is a triangle between `lo` and `hi` semitones, one pass in
// `time` seconds, and its phase is the integral of its frequency.
struct SweepModel {
  double lo, hi, time;
  static double hz(double pitch) { return 440.0 * std::pow(2.0, (pitch - 69.0) / 12.0); }
  // Cycles turned since the key landed.
  double phase(double t) const {
    const double a = std::log(2.0) / 12.0 * (hi - lo) / time;
    const double up = hz(lo) * (std::exp(a * time) - 1.0) / a;
    const double down = hz(hi) * (1.0 - std::exp(-a * time)) / a;
    const double passes = std::floor(t / (2.0 * time));
    const double r = t - passes * 2.0 * time;
    if (r < time) return passes * (up + down) + hz(lo) * (std::exp(a * r) - 1.0) / a;
    return passes * (up + down) + up + hz(hi) * (1.0 - std::exp(-a * (r - time))) / a;
  }
};

// How far `x` (a sine that starts at phase 0) is from the model's phase at
// `seconds`, in cycles, over a Hann window of 20 ms.
static double phase_off(const std::vector<float>& x, const SweepModel& model, double seconds, double rate) {
  const long half = static_cast<long>(0.01 * rate);
  const long centre = static_cast<long>(seconds * rate + 0.5);
  double re = 0.0, im = 0.0;
  for (long k = -half; k <= half; ++k) {
    const long i = centre + k;
    if (i < 0 || i >= static_cast<long>(x.size())) continue;
    const double w = 0.5 + 0.5 * std::cos(kPi * static_cast<double>(k) / static_cast<double>(half));
    const double turn = 2.0 * kPi * model.phase(static_cast<double>(i) / rate);
    re += w * x[i] * std::sin(turn);
    im += w * x[i] * std::cos(turn);
  }
  return std::atan2(im, re) / (2.0 * kPi);
}

static void test_guards() {
  char label[400];
  const float nan = std::nanf("");
  const float inf = HUGE_VALF;
  auto one_key = [&](StillPoint& d, float hz, float gain) {
    plain(d);
    d.note_on(1, hz, gain);
    return render(d, 0.3f, kRate);
  };
  auto whole = [](const Stereo& s) { return finite(s.left) && finite(s.right); };

  // A key's pitch is held inside 8 Hz and the top of the range, and a gain
  // inside 0 and 1, whatever is sent: each absurd key is the key at the edge,
  // sample for sample. (A key under zero is only tried once a key at zero
  // holds: its phase would run backwards out of the sine table.)
  {
    Stereo eight = one_key(other, 8.0f, 0.7f);
    Stereo zero = one_key(device, 0.0f, 0.7f);
    const bool reads = std::isfinite(device.meter(0)) && std::isfinite(device.meter(1)) && std::isfinite(device.meter(2));
    const bool bottom = whole(zero) && apart(zero, eight) == 0.0 && both_peak(eight) > 0.01 && reads;
    bool under = bottom;
    if (bottom) {
      for (float hz : {-440.0f, -inf, 1.0e-30f}) {
        Stereo out = one_key(device, hz, 0.7f);
        under = under && whole(out) && apart(out, eight) == 0.0;
      }
    }
    Stereo top = one_key(other, 12000.0f, 0.7f);
    bool over = both_peak(top) > 0.01;
    for (float hz : {inf, 1.0e30f, 30000.0f}) {
      Stereo out = one_key(device, hz, 0.7f);
      over = over && whole(out) && apart(out, top) == 0.0;
    }
    std::snprintf(label, sizeof label, "a key at 0 Hz is a key at 8 Hz (%s), so is one under zero (%s), and one past the top is a key at 12 kHz (%s)",
                  bottom ? "yes" : "no", under ? "yes" : "no", over ? "yes" : "no");
    EXPECT(bottom && under && over, label);

    Stereo half = one_key(other, kA3, 0.5f);
    Stereo bad = one_key(device, kA3, nan);
    const bool middle = whole(bad) && apart(bad, half) == 0.0 && both_peak(half) > 0.01;
    Stereo full = one_key(other, kA3, 1.0f);
    Stereo big = one_key(device, kA3, inf);
    Stereo huge = one_key(device, kA3, 1.0e30f);
    const bool most = whole(big) && whole(huge) && apart(big, full) == 0.0 && apart(huge, full) == 0.0;
    Stereo none = one_key(other, kA3, 0.0f);
    Stereo minus = one_key(device, kA3, -3.0f);
    Stereo least = one_key(device, kA3, -inf);
    const bool nothing = whole(minus) && whole(least) && apart(minus, none) == 0.0 && apart(least, none) == 0.0;
    std::snprintf(label, sizeof label, "a gain that is not a number is a gain of 0.5 (%s), one past 1 is 1 (%s), one under 0 is 0 (%s)",
                  middle ? "yes" : "no", most ? "yes" : "no", nothing ? "yes" : "no");
    EXPECT(middle && most && nothing, label);
  }

  // The sine stops at 0.45 of the sample rate. At 44.1 kHz a key at the top
  // of the range (12 kHz) with Reach 12 asks for 24 kHz at the turn, which
  // would come back down as 20.1 kHz.
  {
    const double rate = 44100.0;
    plain(device, static_cast<float>(rate));
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kTime, 4.0f);
    device.set_param(p::kReach, 12.0f);
    device.note_on(1, 12000.0f, 0.7f);
    Stereo out = render(device, 4.3f, static_cast<float>(rate));
    const double held = frequency_at(out.right, 0.45 * rate, 4.0, rate, 0.02, 0.0005);
    const double level = std::sqrt(2.0) * rms(out.right, at(3.9, rate), at(4.1, rate)) / tone_level(out.left, 12000.0, rate, at(3.9, rate), at(4.1, rate));
    std::snprintf(label, sizeof label, "44.1 kHz, a 12 kHz key and Reach 12: at the turn the sine stands at %.1f Hz (0.45 of the rate is %.1f), at %.3f of the key",
                  held, 0.45 * rate, level);
    EXPECT(std::fabs(held - 0.45 * rate) < 1.0 && std::fabs(level - 0.5) < 0.01, label);
    std::printf("%s\n", label);
  }

  // A key that waits in a stolen voice counts for the limits from the strike
  // and goes on counting once it has begun: a ninth key two octaves over a
  // full pool takes the upper limit with it (two poles of 0.4 s: 0.888 of
  // the way after 1.5 s). The first key struck is a middle one, so the voice
  // that makes room is not an outer key.
  {
    const int notes[8] = {55, 48, 50, 52, 53, 57, 59, 60};
    plain(device);
    for (int n = 0; n < 8; ++n) device.note_on(n, static_cast<float>(hz_of(notes[n])), 0.7f);
    render(device, 2.0f, kRate);
    const double before = device.meter(2);
    device.note_on(8, static_cast<float>(hz_of(84)), 0.7f);
    render(device, 1.5f, kRate);
    const double after = device.meter(2);
    const double x = 1.5 / 0.4;
    const double want = 24.0 * (1.0 - (1.0 + x) * std::exp(-x));
    std::snprintf(label, sizeof label, "a ninth key two octaves over a full pool moves the upper limit from the strike: %.2f st in 1.5 s (%.2f by the two poles)",
                  after - before, want);
    EXPECT(std::fabs(before - 60.5) < 0.01 && std::fabs(after - before - want) < 0.3, label);
    std::printf("%s\n", label);
  }

  // A key starts at its own gain, whatever the last key in its voice had.
  // From silence: eight loud keys use every voice and end, and a soft key is
  // then what it is on a device that never played them. In mid sound: with
  // one key held, seven keys come and go loud in one render and soft in the
  // other; a soft key that follows is the same in both.
  {
    plain(device);
    for (int n = 0; n < 8; ++n) device.note_on(n, static_cast<float>(hz_of(50 + 3 * n)), 1.0f);
    render(device, 0.3f, kRate);
    for (int n = 0; n < 8; ++n) device.note_off(n);
    Stereo rest = render(device, 0.5f, kRate);
    device.note_on(20, kA3, 0.2f);
    Stereo used = render(device, 0.5f, kRate);
    plain(other);
    other.note_on(20, kA3, 0.2f);
    Stereo fresh = render(other, 0.5f, kRate);

    Stereo mid_sound[2];
    for (int k = 0; k < 2; ++k) {
      std::vector<Event> phrase = {on(0.0, 100, kA3, 0.5f)};
      for (int n = 0; n < 7; ++n) phrase.push_back(on(0.1, n, static_cast<float>(hz_of(60 + 2 * n)), k == 0 ? 1.0f : 0.2f));
      for (int n = 0; n < 7; ++n) phrase.push_back(off(0.4, n));
      phrase.push_back(on(1.0, 50, static_cast<float>(hz_of(66)), 0.2f));
      plain(device);
      mid_sound[k] = play(device, phrase, 1.5, kBlocks128);
    }
    double apart_mid = 0.0;
    for (size_t i = at(0.9); i < mid_sound[0].size(); ++i) {
      apart_mid = std::max(apart_mid, std::fabs(static_cast<double>(mid_sound[0].left[i]) - mid_sound[1].left[i]));
      apart_mid = std::max(apart_mid, std::fabs(static_cast<double>(mid_sound[0].right[i]) - mid_sound[1].right[i]));
    }
    std::snprintf(label, sizeof label,
                  "a soft key after eight loud ones have used every voice is the key on a fresh device (%.2g apart), and after seven loud or seven soft ones in mid sound (%.2g apart)",
                  apart(used, fresh), apart_mid);
    EXPECT(both_peak(rest, at(0.3)) == 0.0 && apart(used, fresh) == 0.0 && apart_mid == 0.0 && both_peak(fresh) > 0.01 &&
               both_peak(mid_sound[0], at(1.1)) > 0.01,
           label);
  }

  // Keys into a full pool at every block size: the key that waits begins on
  // its own sample (the 20 ms fade ends in mid block), so blocks of 1, 2048
  // and ragged give the 128-frame render sample for sample.
  {
    std::vector<Event> phrase;
    for (int n = 0; n < 8; ++n) phrase.push_back(on(0.0, n, static_cast<float>(hz_of(45 + 3 * n)), 0.6f));
    phrase.push_back(on(0.5, 8, static_cast<float>(hz_of(72)), 0.8f));
    phrase.push_back(on(0.507, 9, static_cast<float>(hz_of(79)), 0.5f));
    phrase.push_back(on(0.6, 9, static_cast<float>(hz_of(81)), 0.5f));
    phrase.push_back(off(0.9, 8));
    phrase.push_back(on(0.905, 10, static_cast<float>(hz_of(40)), 0.9f));
    for (int n = 0; n < 11; ++n) phrase.push_back(off(1.2, n));
    Stereo renders[4];
    const std::vector<int>* sizes[4] = {&kBlocks128, &kBlocks1, &kBlocks2048, &kBlocksRagged};
    for (int k = 0; k < 4; ++k) {
      device.init(kRate);
      device.set_param(p::kEars, 0.4f);
      device.set_param(p::kAttack, 0.05f);
      device.set_param(p::kRelease, 0.3f);
      renders[k] = play(device, phrase, 2.0, *sizes[k]);
    }
    const double one = apart(renders[1], renders[0]), big = apart(renders[2], renders[0]), ragged = apart(renders[3], renders[0]);
    std::snprintf(label, sizeof label, "keys into a full pool are the same in blocks of 1, 2048 and ragged as in 128 (%.2g, %.2g, %.2g apart)", one, big, ragged);
    EXPECT(one == 0.0 && big == 0.0 && ragged == 0.0 && both_peak(renders[0]) > 0.01, label);
  }

  // The sine's frequency moves in a straight line between control steps, so
  // its phase follows the sweep written out above. Held for a whole period
  // instead, it runs half a period early: at Reach 12 that is a fifth of a
  // cycle by the turn. One key (A5), Time 4, Reach 12, read at Ears 1.
  for (float rate : kRates) {
    plain(device, rate);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kTime, 4.0f);
    device.set_param(p::kReach, 12.0f);
    device.note_on(1, 880.0f, 0.7f);
    Stereo out = render(device, 8.2f, rate);
    const SweepModel model = {69.0, 93.0, 4.0};
    double worst = 0.0;
    for (double t : {0.5, 1.5, 2.5, 3.5, 3.95, 4.5, 6.0, 7.9}) worst = std::max(worst, std::fabs(phase_off(out.right, model, t, rate)));
    std::snprintf(label, sizeof label, "%.0f Hz: over a pass up and a pass down at Reach 12 the sine's phase stays within %.4f of a cycle of the sweep written out",
                  static_cast<double>(rate), worst);
    EXPECT(worst < 0.05, label);
    std::printf("%s\n", label);
  }

  // What a chord keeps of its range when it is let go a finger at a time,
  // from the top down: the limits follow the keys still held and stand still
  // once none is. Five keys 26 semitones apart with Reach 0.5 (27 from limit
  // to limit): let go 10 ms apart the range is kept, 300 ms apart about half.
  {
    const int notes[5] = {50, 57, 65, 72, 76};
    double kept[2] = {0.0, 0.0}, later[2] = {0.0, 0.0};
    const double gaps[2] = {0.01, 0.3};
    for (int k = 0; k < 2; ++k) {
      std::vector<Event> phrase;
      for (int n = 0; n < 5; ++n) phrase.push_back(on(0.0, n, static_cast<float>(hz_of(notes[n]))));
      for (int n = 4; n >= 0; --n) phrase.push_back(off(2.0 + gaps[k] * (4 - n), n));
      device.init(kRate);
      device.set_param(p::kRelease, 15.0f);
      play(device, phrase, 2.0 + 4.0 * gaps[k] + 0.5, kBlocks128);
      kept[k] = device.meter(2) - device.meter(1);
      render(device, 5.0f, kRate);
      later[k] = device.meter(2) - device.meter(1);
    }
    std::snprintf(label, sizeof label,
                  "a chord 27 st from limit to limit, let go a finger at a time: 10 ms apart it keeps %.2f st, 300 ms apart %.2f st (%.2f and %.2f five seconds on)",
                  kept[0], kept[1], later[0], later[1]);
    EXPECT(kept[0] > 26.8 && kept[1] > 12.0 && kept[1] < 17.0 && later[0] == kept[0] && later[1] == kept[1], label);
    std::printf("%s\n", label);
  }

  // A key's phase is a double: over a minute a held key stays on its
  // frequency to a thousandth of a cycle. (A float phase rounds the same way
  // at every step and walks 0.01 to 0.05 of a cycle off in that time.)
  {
    double worst = 0.0;
    for (float rate : kRates) {
      plain(device, rate);
      device.set_param(p::kLevel, 0.0f);
      device.note_on(1, kA3, 0.7f);
      Stereo out = render(device, 60.0f, rate, 2048);
      double turned = (phase_at(out.left, kA3, 59.0, rate, 0.1) - phase_at(out.left, kA3, 1.0, rate, 0.1)) / (2.0 * kPi);
      turned -= std::round(turned);
      worst = std::max(worst, std::fabs(turned));
    }
    std::snprintf(label, sizeof label, "a held key keeps its phase: %.2g of a cycle off its frequency after a minute, at the worst of three rates", worst);
    EXPECT(worst < 1.0e-3, label);
    std::printf("%s\n", label);
  }
}


static void test_cost() {
  char label[240];
  // CPU time, the best of three: eight keys held at the default patch, and
  // at full Warmth, at 48 and 96 kHz.
  for (float rate : {48000.0f, 96000.0f}) {
    for (float warmth : {0.3f, 1.0f}) {
      double best = 1.0e18;
      for (int trial = 0; trial < 3; ++trial) {
        device.init(rate);
        device.set_param(p::kWarmth, warmth);
        for (int n = 0; n < StillPoint::kMaxVoices; ++n) device.note_on(n, static_cast<float>(hz_of(45 + 4 * n)), 0.8f);
        const std::clock_t start = std::clock();
        render(device, 10.0f, rate);
        best = std::min(best, 1.0e6 * static_cast<double>(std::clock() - start) / CLOCKS_PER_SEC);
      }
      const double blocks = 10.0 * rate / 128.0;
      std::snprintf(label, sizeof label, "still-point (8 keys, Warmth %.1f): %.1f us of CPU per 128-frame stereo block, %.2f%% of real time at %.0f kHz (native)",
                    warmth, best / blocks, best / 1.0e5, rate / 1000.0);
      std::printf("%s\n", label);
      if (rate == 48000.0f) EXPECT(best / 1.0e5 < 5.0, label);
    }
  }
  device.init(kRate);
  for (int n = 0; n < StillPoint::kMaxVoices; ++n) device.note_on(n, static_cast<float>(hz_of(45 + 4 * n)), 0.8f);
  report_cost("still-point (8 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
}
