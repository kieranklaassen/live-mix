// Native harness for the Silent Keys effect (cpp/devices/silent-keys):
// conformance, then what makes it what it is. A chord held without a sound
// answers only where the sound meets its partials, rings on by itself at its
// own pitches, changes with its dampers, and is silent where nothing is held.
//
//   c++ -std=c++17 -O2 -fno-exceptions -fno-rtti cpp/test/silent_keys_test.cpp -o /tmp/silent_keys_test
//
// SILENT_KEYS_REPORT=1 prints every figure, passing or not.

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <vector>

#include "../devices/silent-keys/silent_keys.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::SilentKeys;
namespace p = livemix::silent_keys;

static SilentKeys device;
static SilentKeys twin;

static const float kRate = 48000.0f;

static bool report() {
  static const bool on = std::getenv("SILENT_KEYS_REPORT") != nullptr;
  return on;
}
#define MEASURED(...)              \
  do {                             \
    if (report()) {                \
      std::printf("  measured: "); \
      std::printf(__VA_ARGS__);    \
      std::printf("\n");           \
    }                              \
  } while (0)

enum Shape { kKeys = 0, kSingle = 1, kMajor = 2, kMinor = 3, kMinor9 = 8, kFifths = 14, kLydian = 22 };

static double hz(double note) { return 440.0 * std::exp2((note - 69.0) / 12.0); }
static size_t at(double seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

// The strings alone, under one chord.
static void fresh(SilentKeys& d, int root, int shape, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kRoot1, static_cast<float>(root - 24));
  d.set_param(p::kShape1, static_cast<float>(shape));
  d.set_param(p::kMix, 1.0f);
}

// A short note with `partials` partials at 1/n.
static std::vector<float> note(double f, double length, double total, float rate = kRate, double gain = 0.25,
                               int partials = 12, double from = 0.0) {
  std::vector<float> out(at(total, rate), 0.0f);
  const size_t start = at(from, rate), n = at(length, rate);
  for (size_t i = 0; i < n && start + i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    const double edge = std::min(1.0, t / 0.004) * std::min(1.0, (length - t) / 0.02);
    double sum = 0.0;
    for (int k = 1; k <= partials; ++k) sum += std::sin(2.0 * kPi * f * k * t) / k;
    out[start + i] = static_cast<float>(gain * sum * edge);
  }
  return out;
}

static std::vector<float> bursts(double length, double every, int count, double total, float gain,
                                 float rate = kRate) {
  std::vector<float> out(at(total, rate), 0.0f);
  const float scaled = gain * std::sqrt(rate / 48000.0f);
  for (int b = 0; b < count; ++b) {
    const size_t from = at(every * b, rate);
    for (size_t i = 0; i < at(length, rate) && from + i < out.size(); ++i) out[from + i] = scaled * white();
  }
  return out;
}

static void add(std::vector<float>& to, const std::vector<float>& from) {
  if (to.size() < from.size()) to.resize(from.size(), 0.0f);
  for (size_t i = 0; i < from.size(); ++i) to[i] += from[i];
}

// Both channels' power of one tone, dB of a sine's amplitude.
static double tone(const Stereo& s, double f, size_t from, size_t to, float rate = kRate) {
  return db(std::hypot(tone_level(s.left, f, rate, from, to), tone_level(s.right, f, rate, from, to)));
}
static double loud(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return db(std::hypot(rms(s.left, from, to), rms(s.right, from, to)));
}
static double top(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}
static double apart(const Stereo& a, const Stereo& b, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < std::min(a.size(), b.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// --- the spec's examples -------------------------------------------------------------------------

static void test_triad() {
  // C3 E3 G3 held. A 100 ms C2 wakes C3, G3 and C4 (its 2nd, 3rd, 4th) and
  // leaves E3 under them.
  fresh(device, 48, kMajor);
  const Stereo low_c = run(device, note(hz(36), 0.1, 3.0));
  const size_t from = at(0.5), to = at(2.5);
  const double c3 = tone(low_c, hz(48), from, to), g3 = tone(low_c, hz(55), from, to);
  const double c4 = tone(low_c, hz(60), from, to), e3 = tone(low_c, hz(52), from, to);
  MEASURED("C2 for 100 ms into C3 E3 G3: C3 %.1f, G3 %.1f, C4 %.1f, E3 %.1f dB", c3, g3, c4, e3);
  EXPECT(std::min(c3, std::min(g3, c4)) > e3 + 40.0, "C2 rings C3, G3 and C4 at least 40 dB over E3");
  EXPECT(c3 > -40.0 && g3 > -45.0 && c4 > -50.0, "and rings them loud enough to hear");
  EXPECT(top(low_c, at(0.12), at(0.5)) > 0.02, "the chord blooms after the note has stopped");

  // D2 shares only E5 (the 4th of E3) and D5 (the 3rd of G3) with it.
  fresh(device, 48, kMajor);
  const Stereo low_d = run(device, note(hz(38), 0.1, 3.0));
  const double e5 = tone(low_d, 4.0 * hz(52), from, to), d5 = tone(low_d, 3.0 * hz(55), from, to);
  double other = -200.0;
  int which = 0;
  for (int key : {48, 52, 55}) {
    for (int n = 1; n <= 10; ++n) {
      const double f = n * hz(key);
      if ((key == 52 && n == 4) || (key == 55 && n == 3)) continue;
      // C3's 5th is E5 too (17 cents under E3's 4th), and where three strings meet is one place.
      if (std::fabs(f - 4.0 * hz(52)) < 8.0 || std::fabs(f - 3.0 * hz(55)) < 8.0) continue;
      const double level = tone(low_d, f, from, to);
      if (level > other) {
        other = level;
        which = key * 100 + n;
      }
    }
  }
  MEASURED("D2 for 100 ms: E5 %.1f, D5 %.1f, the loudest other partial %.1f dB (key %d partial %d)", e5, d5, other,
           which / 100, which % 100);
  EXPECT(std::min(e5, d5) > other + 6.0, "D2 wakes E5 and D5 over every other partial of the chord");
  EXPECT(std::max(e5, d5) < c3 - 15.0, "and those faintly: 15 dB under what C2 wakes");
  MEASURED("the whole answer: C2 %.1f dB, D2 %.1f dB", loud(low_c, from, to), loud(low_d, from, to));
  EXPECT(loud(low_c, from, to) > loud(low_d, from, to) + 15.0, "a note of the chord is answered 15 dB over one that is not");
}

static void test_noise() {
  // D3 F3 A3 C4 E4 under noise bursts: only those strings and their partials.
  fresh(device, 50, kMinor9);
  device.set_param(p::kSharpness, 0.1f);
  device.set_param(p::kLift, 36.0f);
  rng_state() = 77u;
  const Stereo out = run(device, bursts(0.2, 0.5, 4, 5.0, 0.4f));
  const size_t from = at(2.2), to = at(4.8);
  double weakest = 0.0, between = -200.0;
  for (int key : {50, 53, 57, 60, 64}) weakest = std::min(weakest, tone(out, hz(key), from, to));
  for (int key : {49, 51, 52, 54, 55, 56, 58, 59, 61, 63}) between = std::max(between, tone(out, hz(key), from, to));
  MEASURED("D3 minor 9 under noise: weakest key %.1f dB, loudest key between %.1f dB, whole %.1f dB", weakest, between,
           loud(out, from, to));
  EXPECT(weakest > between + 30.0, "noise rings every held key 30 dB over the keys between");
  EXPECT(loud(out, at(0.0), at(2.0)) > -35.0, "and loud enough to be a chord");

  // A2 E3 B3 under clicks of 5 ms: fifths out of no pitch at all.
  fresh(device, 45, kFifths);
  device.set_param(p::kSharpness, 0.0f);
  device.set_param(p::kLift, 36.0f);
  device.set_param(p::kLowCut, 80.0f);
  rng_state() = 99u;
  const Stereo clicks = run(device, bursts(0.005, 0.4, 5, 5.0, 0.5f));
  double fifths = 0.0, rest = -200.0;
  for (int key : {45, 52, 59}) fifths = std::min(fifths, tone(clicks, hz(key), from, to));
  for (int key : {46, 47, 48, 49, 50, 51, 53, 54, 55, 56, 58}) rest = std::max(rest, tone(clicks, hz(key), from, to));
  MEASURED("A2 E3 B3 under clicks: weakest %.1f dB, loudest between %.1f dB, whole %.1f dB", fifths, rest,
           loud(clicks, at(1.7), at(3.0)));
  EXPECT(fifths > rest + 30.0, "clicks ring the three keys of the fifths 30 dB over what lies between");
  EXPECT(loud(clicks, at(1.7), at(3.0)) > -45.0, "and they can be heard");
}

static void test_empty() {
  device.init(kRate);
  device.set_param(p::kShape1, kKeys);
  device.set_param(p::kMix, 1.0f);
  rng_state() = 3u;
  const Stereo wet = run(device, noise(1.0f, kRate, 0.8f));
  EXPECT(top(wet) == 0.0, "no key held: the strings are exact silence");
  device.init(kRate);
  device.set_param(p::kShape1, kKeys);
  device.set_param(p::kMix, 0.0f);
  const std::vector<float> in = noise(1.0f, kRate, 0.8f);
  const Stereo dry = run(device, in);
  EXPECT(dry.left == in && dry.right == in, "at Mix 0 and Output 0 dB the sound comes out as it went in");
  device.init(kRate);
  device.set_param(p::kMix, 0.0f);
  const Stereo under = run(device, in);
  EXPECT(under.left == in, "with a chord held too");
  // One key of one's own.
  device.init(kRate);
  device.set_param(p::kShape1, kKeys);
  device.set_param(p::kKey4, 57.0f - 11.0f);  // A3
  device.set_param(p::kMix, 1.0f);
  const Stereo one = run(device, note(220.0, 0.2, 2.0));
  MEASURED("one key of its own: %.1f dB at A3", tone(one, 220.0, at(0.5), at(1.5)));
  EXPECT(tone(one, 220.0, at(0.5), at(1.5)) > -40.0, "Key 4 alone holds the key it names");
  EXPECT(device.meter(6) == 57.0f && device.meter(7) == -1.0f, "and the meters name that key");
}

// --- the list -----------------------------------------------------------------------------------

static void test_change() {
  // C major to F# major (no key in common), by the Chord knob.
  for (double damper : {100.0, 400.0, 2000.0}) {
    fresh(device, 48, kMajor);
    device.set_param(p::kRing, 20.0f);
    device.set_param(p::kRoot2, 54.0f - 24.0f);
    device.set_param(p::kShape2, kMajor);
    device.set_param(p::kDamper, static_cast<float>(damper));
    std::vector<float> in = note(hz(48), 0.4, 6.0);
    add(in, note(hz(54), 0.4, 6.0, kRate, 0.25, 12, 1.0));
    std::vector<float> first(in.begin(), in.begin() + at(1.0)), rest(in.begin() + at(1.0), in.end());
    const Stereo before = run(device, first);
    device.set_param(p::kChord, 2.0f);
    const Stereo after = run(device, rest);
    const double ringing = tone(before, hz(48), at(0.6), at(1.0));
    // The last quarter second before Damper is up (or a window of its own length when that is shorter).
    const double w = 0.2;
    const double gone = tone(after, hz(48), at(0.001 * damper), at(0.001 * damper + w));
    const double half = tone(after, hz(48), at(0.0005 * damper - 0.02), at(0.0005 * damper + 0.02));
    MEASURED("Damper %.0f ms: C3 %.1f dB before, %.1f half way, %.1f after it; F#3 %.1f dB", damper, ringing, half, gone,
             tone(after, hz(54), at(1.0), at(2.0)));
    EXPECT(gone < ringing - 58.0, "an old string is down 60 dB when Damper is up");
    if (damper > 200.0) EXPECT(half > ringing - 40.0, "and not much before");
    EXPECT(tone(after, hz(54), at(1.0), at(2.0)) > -35.0, "and the new chord answers");
  }
  // A key in both chords rings on: C E G to A C E.
  fresh(device, 48, kMajor);
  device.set_param(p::kRoot2, 45.0f - 24.0f);
  device.set_param(p::kShape2, kMinor);
  device.set_param(p::kDamper, 100.0f);
  std::vector<float> in = note(hz(36), 0.4, 1.0);
  add(in, note(hz(52), 0.4, 1.0));
  run(device, in);
  device.set_param(p::kChord, 2.0f);
  const Stereo after = render(device, 2.0f, kRate);
  const double c3 = tone(after, hz(48), at(0.5), at(1.5)), g3 = tone(after, hz(55), at(0.5), at(1.5));
  MEASURED("C E G to A C E: C3 %.1f dB rings on, G3 %.1f dB is gone", c3, g3);
  EXPECT(c3 > g3 + 40.0, "a key both chords hold rings on through the change");
}

// Which of the walk's chords sounds at each moment: a full-band noise would
// do, but the meter says it exactly.
static void test_walk() {
  auto set = [](SilentKeys& d) {
    d.init(kRate);
    d.set_param(p::kEvery, 0.5f);
    d.set_param(p::kCount, 3.0f);
    d.set_param(p::kDamper, 40.0f);
    d.set_param(p::kRing, 0.3f);
    d.set_param(p::kMix, 1.0f);
  };
  set(device);
  std::vector<int> seen;
  rng_state() = 5u;
  for (int block = 0; block < 8; ++block) {  // in the middle of each half second
    run(device, noise(0.25f, kRate, 0.2f));
    seen.push_back(static_cast<int>(device.meter(14)));
    if (block == 2) EXPECT(std::fabs(device.meter(15) - 0.5) < 0.02, "the meter says how far the walk is on its way");
    run(device, noise(0.25f, kRate, 0.2f));
  }
  EXPECT((seen == std::vector<int>{1, 2, 3, 1, 2, 3, 1, 2}), "the list is walked 1 to Count and round, a chord each Every");

  // After a full silence it starts again from Chord, with a whole Every.
  set(device);
  run(device, noise(0.8f, kRate, 0.2f));
  EXPECT(device.meter(14) == 2.0f, "under way");
  render(device, 3.0f, kRate);
  EXPECT(device.resting(), "the device rests once the strings have died");
  EXPECT(device.meter(14) == 1.0f && device.meter(15) == 0.0f, "and at rest the walk stands at its first chord");
  run(device, noise(0.45f, kRate, 0.2f));
  EXPECT(device.meter(14) == 1.0f, "the first chord is held for its whole time");
  run(device, noise(0.1f, kRate, 0.2f));
  EXPECT(device.meter(14) == 2.0f, "and then the second");
  // A pause the strings ring through does not restart it.
  set(device);
  device.set_param(p::kRing, 10.0f);
  run(device, noise(0.3f, kRate, 0.2f));
  render(device, 0.45f, kRate);
  EXPECT(device.meter(14) == 2.0f, "a pause the strings ring through goes on counting");
  // Turning Chord starts the walk from there.
  set(device);
  run(device, noise(0.4f, kRate, 0.2f));
  device.set_param(p::kChord, 3.0f);
  run(device, noise(0.4f, kRate, 0.2f));
  EXPECT(device.meter(14) == 3.0f, "Chord moved while it walks holds that chord for a whole Every");
  run(device, noise(0.2f, kRate, 0.2f));
  EXPECT(device.meter(14) == 1.0f, "and goes round from there");
  device.set_param(p::kEvery, 0.0f);
  run(device, noise(0.1f, kRate, 0.2f));
  EXPECT(device.meter(14) == 3.0f, "with Every at zero the chord is the one Chord says");
  // The audio agrees with the meter: each chord's own keys ring in its half second.
  set(device);
  device.set_param(p::kShape1, kSingle);
  device.set_param(p::kShape2, kSingle);
  device.set_param(p::kRoot1, 45.0f - 24.0f);
  device.set_param(p::kRoot2, 52.0f - 24.0f);
  device.set_param(p::kCount, 2.0f);
  device.set_param(p::kSharpness, 0.0f);
  device.set_param(p::kRing, 1.0f);
  rng_state() = 8u;
  const Stereo out = run(device, noise(1.0f, kRate, 0.3f));
  MEASURED("walk of two: A2 %.1f then %.1f dB, E3 %.1f then %.1f dB", tone(out, hz(45), at(0.2), at(0.5)),
           tone(out, hz(45), at(0.6), at(1.0)), tone(out, hz(52), at(0.2), at(0.5)), tone(out, hz(52), at(0.6), at(1.0)));
  EXPECT(tone(out, hz(45), at(0.2), at(0.5)) > tone(out, hz(45), at(0.6), at(1.0)) + 25.0, "A2 is held first");
  EXPECT(tone(out, hz(52), at(0.6), at(1.0)) > tone(out, hz(52), at(0.2), at(0.5)) + 25.0, "then E3");
}

// Phrase, silence, phrase, with knobs moved in the silence.
static Stereo walked_phrase(int block, double gap, bool ragged) {
  device.init(kRate);
  device.set_param(p::kEvery, 0.4f);
  device.set_param(p::kCount, 5.0f);
  device.set_param(p::kRing, 0.2f);
  device.set_param(p::kDamper, 60.0f);
  device.set_param(p::kBass, 0.5f);
  device.set_param(p::kMix, 0.7f);
  rng_state() = 21u;
  std::vector<float> in = noise(0.9f, kRate, 0.3f);
  const size_t quiet = at(gap);
  in.resize(in.size() + quiet, 0.0f);
  const size_t knob = in.size() - 300;
  add(in, note(hz(45), 0.5, (in.size() + 48000) / kRate, kRate, 0.25, 12, in.size() / kRate));
  Stereo out;
  auto go = [&](size_t from, size_t to) {
    static const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
    int which = 0;
    size_t done = from;
    while (done < to) {
      const int size = ragged ? sizes[which++ % 8] : block;
      const size_t n = std::min(static_cast<size_t>(size), to - done);
      const std::vector<float> part(in.begin() + done, in.begin() + done + n);
      out = concat(out, run(device, part, size));
      done += n;
    }
  };
  go(0, knob);
  device.set_param(p::kWidth, 0.2f);
  device.set_param(p::kMix, 1.0f);
  device.set_param(p::kOutput, 3.0f);
  device.set_param(p::kTune, 10.0f);
  device.set_param(p::kLowCut, 200.0f);
  go(knob, in.size());
  return out;
}

static void test_blocks() {
  double worst = 0.0;
  // Ring 0.2 s dies under the floor about 0.45 to 0.75 s after the noise.
  for (double gap : {0.3, 0.42, 0.46, 0.50, 0.54, 0.58, 0.62, 0.66, 0.70, 0.74, 0.78, 0.9, 1.4}) {
    const Stereo reference = walked_phrase(128, gap, false);
    for (int block : {1, 2048}) {
      if (block == 1 && gap != 0.58 && gap != 0.66) continue;
      worst = std::max(worst, apart(reference, walked_phrase(block, gap, false)));
    }
    worst = std::max(worst, apart(reference, walked_phrase(1, gap, true)));
  }
  MEASURED("blocks of 1, 128, 2048 and ragged, across silences: %.3g apart", worst);
  EXPECT(worst == 0.0, "the output does not depend on the block size, across rests and the walk, to the bit");
}

static void test_rest() {
  // Asleep, knobs land: the same as a device set that way from the start.
  auto turn = [](SilentKeys& d) {
    d.set_param(p::kMix, 0.9f);
    d.set_param(p::kOutput, -6.0f);
    d.set_param(p::kWidth, 0.1f);
    d.set_param(p::kTune, -20.0f);
    d.set_param(p::kLowCut, 300.0f);
    d.set_param(p::kRing, 2.0f);
    d.set_param(p::kRoot1, 30.0f);
    d.set_param(p::kShape1, kLydian);
    d.set_param(p::kBass, 0.7f);
    d.set_param(p::kPartials, 5.0f);
    d.set_param(p::kTilt, 4.0f);
    d.set_param(p::kSharpness, 0.2f);
    d.set_param(p::kSpacing, 2.0f);
    d.set_param(p::kEvery, 0.3f);
    d.set_param(p::kLift, 30.0f);
  };
  device.init(kRate);
  device.set_param(p::kRing, 0.3f);
  rng_state() = 4u;
  run(device, noise(0.3f, kRate, 0.4f));
  device.process(13);
  render(device, 4.0f, kRate);
  EXPECT(device.resting(), "the device is asleep");
  turn(device);
  render(device, 0.2f, kRate);
  twin.init(kRate);
  turn(twin);
  const std::vector<float> in = note(hz(54), 0.3, 1.5);
  const Stereo a = run(device, in), b = run(twin, in);
  EXPECT(apart(a, b) == 0.0, "knobs moved asleep are in place for the next sound, to the bit");

  // Exact silence once the tail is out, and in no more time than the tail needs.
  device.init(kRate);
  device.set_param(p::kRing, 1.0f);
  run(device, note(hz(45), 0.2, 0.3));
  const Stereo tail = render(device, 6.0f, kRate);
  size_t last = 0;
  for (size_t i = 0; i < tail.size(); ++i) {
    if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
  }
  MEASURED("Ring 1 s: exact silence %.2f s after the note, the last sound at %.2g", last / kRate,
           top(tail, last > 480 ? last - 480 : 0, last + 1));
  EXPECT(last < at(4.5) && top(tail, last > 480 ? last - 480 : 0, last + 1) < 1.0e-6, "the tail ends under -120 dBFS, in exact zero");
  for (int m = 0; m < 6; ++m) EXPECT(device.meter(m) == 0.0f, "asleep no string reads a level");
  EXPECT(device.sounding_strings() == 0, "and no string is worked out");
}

// --- controls -----------------------------------------------------------------------------------

static void test_ring() {
  double low = 0.0;
  for (double ring : {0.2, 0.5, 2.0, 8.0, 30.0}) {
    fresh(device, 57, kSingle);
    device.set_param(p::kPartials, 1.0f);
    device.set_param(p::kRing, static_cast<float>(ring));
    const double window = std::max(0.02, 0.02 * ring);
    const Stereo out = run(device, note(hz(57), 0.3, 0.6 + 1.2 * ring, kRate, 0.3, 1));
    const double measured = rt60(out.left, kRate, 0.5, window, -85.0);
    MEASURED("Ring %.1f s: A3 dies in %.2f s", ring, measured);
    EXPECT_NEAR(measured, ring, 0.06 * ring, "Ring is the decay time at 220 Hz");
    low = measured;
  }
  (void)low;
  double times[3];
  int index = 0;
  for (int key : {45, 57, 81}) {
    fresh(device, key, kSingle);
    device.set_param(p::kPartials, 1.0f);
    device.set_param(p::kRing, 3.0f);
    const Stereo out = run(device, note(hz(key), 0.3, 4.0, kRate, 0.3, 1));
    times[index++] = rt60(out.left, kRate, 0.5, 0.1, -85.0);
  }
  MEASURED("Ring 3 s: A2 %.2f, A3 %.2f, A5 %.2f s", times[0], times[1], times[2]);
  EXPECT(times[0] > 1.2 * times[1] && times[2] < 0.65 * times[1], "low strings last longer than high ones");
}

static void test_sharpness() {
  // A tone of half a second `cents` off A3, and noise, at five places.
  double near_last = 100.0, noise_last = 100.0;
  for (double sharp : {0.0, 0.25, 0.5, 0.75, 1.0}) {
    double level[4];
    int index = 0;
    for (double cents : {0.0, 40.0, 80.0, 160.0}) {
      fresh(device, 57, kSingle);
      device.set_param(p::kSharpness, static_cast<float>(sharp));
      level[index++] = loud(run(device, note(hz(57.0 + cents / 100.0), 0.5, 2.0, kRate, 0.2, 1)), at(0.7));
    }
    fresh(device, 57, kMajor);
    device.set_param(p::kSharpness, static_cast<float>(sharp));
    rng_state() = 6u;
    const double hiss = loud(run(device, bursts(0.3, 1.0, 1, 2.0, 0.4f)), at(0.5));
    MEASURED("Sharpness %.2f: in tune %.1f, 40 ct off %.1f, 80 ct %.1f, 160 ct %.1f dB; noise %.1f dB", sharp, level[0],
             level[1], level[2], level[3], hiss);
    EXPECT(level[0] > -32.0, "a tone in tune is always answered");
    EXPECT(level[2] - level[0] < near_last - 1.0, "each step of Sharpness turns a tone 80 cents off further down");
    EXPECT(hiss < noise_last - 1.0, "and noise");
    near_last = level[2] - level[0];
    noise_last = hiss;
  }
  EXPECT(noise_last < -55.0, "at the top noise wakes next to nothing");
}

static void test_tone() {
  // Partials: the tone's 2nd to 12th wake A2's string only as far as Partials goes.
  double last = -200.0;
  for (int partials : {1, 3, 6, 9, 12}) {
    fresh(device, 45, kSingle);
    device.set_param(p::kPartials, static_cast<float>(partials));
    device.set_param(p::kSharpness, 0.2f);
    const Stereo out = run(device, note(hz(45), 0.3, 2.0));
    const double in_reach = tone(out, partials * hz(45), at(0.5), at(1.5));
    const double over = partials < 12 ? tone(out, (partials + 1) * hz(45), at(0.5), at(1.5)) : -200.0;
    MEASURED("Partials %d: that one %.1f dB, the next %.1f dB", partials, in_reach, over);
    EXPECT(in_reach > over + 30.0, "Partials is how many of a string's partials answer");
    const double bright = energy_above(out.left, 400.0, kRate, at(0.5), at(1.5));
    EXPECT(bright > last, "more partials are a brighter answer");
    last = bright;
  }
  // Tilt: the ratio of the 8th partial to the first.
  last = -300.0;
  for (double tilt : {-12.0, -8.0, -4.0, 0.0, 6.0}) {
    fresh(device, 45, kSingle);
    device.set_param(p::kTilt, static_cast<float>(tilt));
    device.set_param(p::kLift, 0.0f);
    const Stereo out = run(device, note(hz(45), 0.3, 2.0));
    const double ratio = tone(out, 8.0 * hz(45), at(0.4), at(1.0)) - tone(out, hz(45), at(0.4), at(1.0));
    MEASURED("Tilt %.0f dB: the 8th partial against the first %.1f dB", tilt, ratio);
    if (last > -299.0) EXPECT(ratio > last + 8.0, "Tilt lifts the upper partials against the low ones");
    last = ratio;
  }
  // Bass: one and two octaves under the lowest key, at the level asked.
  last = -200.0;
  for (double bass : {0.0, 0.25, 0.5, 0.75, 1.0}) {
    fresh(device, 57, kMinor);
    device.set_param(p::kBass, static_cast<float>(bass));
    const Stereo out = run(device, note(hz(33), 0.4, 2.0, kRate, 0.2));
    const double low = tone(out, hz(45), at(0.5), at(1.5)), lowest = tone(out, hz(33), at(0.5), at(1.5));
    MEASURED("Bass %.2f: A2 %.1f, A1 %.1f dB", bass, low, lowest);
    if (bass == 0.0) {
      EXPECT(low < -80.0 && lowest < -80.0, "with no Bass nothing lies under the chord");
    } else {
      EXPECT(low > last + 2.0, "Bass turns its strings up");
    }
    last = low;
  }
  double chord[2];
  for (int with = 0; with < 2; ++with) {
    fresh(device, 57, kMinor);
    device.set_param(p::kBass, static_cast<float>(with));
    chord[with] = tone(run(device, note(hz(33), 0.8, 2.5, kRate, 0.2)), hz(69), at(1.0), at(2.0));
  }
  MEASURED("the bass strings move the chord by %+.2f dB", chord[1] - chord[0]);
  EXPECT(chord[1] > chord[0] - 0.5, "the bass strings take nothing from the chord");
  EXPECT(device.meter(12) > 0.001f && device.meter(13) > 0.001f, "and the meters read both");
  // Lift, on noise.
  last = -200.0;
  for (double lift : {0.0, 9.0, 18.0, 27.0, 36.0}) {
    fresh(device, 45, kMinor9);
    device.set_param(p::kLift, static_cast<float>(lift));
    rng_state() = 12u;
    const double level = loud(run(device, bursts(0.3, 1.0, 1, 1.5, 0.4f)), at(0.4));
    MEASURED("Lift %.0f dB: noise wakes %.1f dB", lift, level);
    EXPECT(level > last + 3.0, "Lift makes noise louder in the strings");
    last = level;
  }
  // Low cut, on a low tone.
  last = 200.0;
  for (double cut : {20.0, 60.0, 180.0, 500.0, 1000.0}) {
    fresh(device, 33, kSingle);
    device.set_param(p::kLift, 0.0f);
    device.set_param(p::kLowCut, static_cast<float>(cut));
    const double level = tone(run(device, note(hz(33), 0.3, 1.5, kRate, 0.2)), hz(33), at(0.4), at(1.4));
    MEASURED("Low cut %.0f Hz: A1 %.1f dB", cut, level);
    EXPECT(level < last, "Low cut keeps the lows from the strings");
    last = level;
  }
  EXPECT(last < -70.0, "well over the key, it is hardly woken");
  // Tune.
  for (double cents : {-50.0, -20.0, 0.0, 20.0, 50.0}) {
    fresh(device, 57, kSingle);
    device.set_param(p::kPartials, 1.0f);
    device.set_param(p::kTune, static_cast<float>(cents));
    rng_state() = 13u;
    device.set_param(p::kSharpness, 0.0f);
    const Stereo out = run(device, bursts(0.05, 1.0, 1, 3.0, 0.5f));
    const double f = dominant_frequency(out.left, kRate, 200.0, 240.0, at(0.3), at(2.8));
    MEASURED("Tune %.0f ct: rings at %.3f Hz", cents, f);
    EXPECT_NEAR(1200.0 * std::log2(f / 220.0), cents, 1.0, "Tune moves the strings by as many cents");
  }
  // Width.
  last = 2.0;
  for (double width : {0.0, 0.25, 0.5, 0.75, 1.0}) {
    fresh(device, 45, kMinor9);
    device.set_param(p::kWidth, static_cast<float>(width));
    device.set_param(p::kSharpness, 0.0f);
    rng_state() = 14u;
    const Stereo out = run(device, bursts(0.3, 1.0, 1, 1.5, 0.4f));
    const double together = correlation(out.left, out.right, at(0.3));
    MEASURED("Width %.2f: the channels correlate %.3f", width, together);
    if (width == 0.0) EXPECT(together > 0.99999, "at Width 0 both channels are one");
    EXPECT(together < last - 0.01, "Width opens them");
    last = together;
  }
  // Output and spacing.
  fresh(device, 48, kMajor);
  device.set_param(p::kOutput, -12.0f);
  const Stereo quiet = run(device, note(hz(48), 0.3, 1.0));
  fresh(device, 48, kMajor);
  const Stereo plain = run(device, note(hz(48), 0.3, 1.0));
  EXPECT_NEAR(loud(quiet) - loud(plain), -12.0, 0.1, "Output is a level");
  const int expected[3][3] = {{48, 52, 55}, {48, 55, 64}, {48, 67, 76}};
  for (int spacing = 0; spacing < 3; ++spacing) {
    fresh(device, 48, kMajor);
    device.set_param(p::kSpacing, static_cast<float>(spacing));
    for (int k = 0; k < 3; ++k) {
      EXPECT(static_cast<int>(device.meter(6 + k)) == expected[spacing][k], "Spacing lays the triad close, open or wide");
    }
    EXPECT(device.meter(9) == -1.0f, "and holds three keys");
  }
  // Every shape holds at least one key and at most six, for every spacing and root.
  bool sound = true;
  for (int shape = 1; shape < 25; ++shape) {
    for (int spacing = 0; spacing < 3; ++spacing) {
      for (int root : {24, 60, 84}) {
        fresh(device, root, shape);
        device.set_param(p::kSpacing, static_cast<float>(spacing));
        int keys = 0;
        float before = 0.0f;
        for (int k = 0; k < 6; ++k) {
          const float key = device.meter(6 + k);
          if (key < 0.0f) continue;
          ++keys;
          if (!(key > before) || key > 108.0f) sound = false;
          before = key;
        }
        if (keys < 1) sound = false;
      }
    }
  }
  EXPECT(sound, "every shape holds one to six keys in rising order, inside the keyboard");
}

// --- level --------------------------------------------------------------------------------------

// Struck notes that die away, a few partials each.
static std::vector<float> piano(float gain = 0.3f, float rate = kRate) {
  std::vector<float> out(at(6.0, rate), 0.0f);
  const double keys[] = {57, 64, 72, 69, 53, 76, 60, 45};
  const double times[] = {0.0, 0.6, 1.2, 2.4, 2.4, 3.0, 3.6, 4.2};
  for (int n = 0; n < 8; ++n) {
    for (size_t i = 0; i < at(1.5, rate); ++i) {
      const size_t where = at(times[n], rate) + i;
      if (where >= out.size()) break;
      const double t = i / static_cast<double>(rate);
      double sum = 0.0;
      for (int k = 1; k <= 6; ++k) sum += std::sin(2.0 * kPi * k * hz(keys[n]) * t) * std::exp(-t * (1.5 + k)) / k;
      out[where] += static_cast<float>(gain * sum * std::min(1.0, t / 0.003) * std::min(1.0, (1.5 - t) / 0.05));
    }
  }
  return out;
}

static void test_level() {
  for (float gain : {0.03f, 0.3f}) {
    device.init(kRate);
    const std::vector<float> in = piano(gain);
    const Stereo out = run(device, in);
    const double over = loud(out) - db(rms(in) * std::sqrt(2.0));
    fresh(device, 45, 6);
    const Stereo wet = run(device, in);
    const double share = loud(wet) - db(rms(in) * std::sqrt(2.0));
    MEASURED("a piano phrase at %.2f: out %+.1f dB over in, strings alone %+.1f dB, peak %.2f of %.2f", gain, over, share,
             top(out), peak(in));
    EXPECT(over < 3.0 && over > -3.0, "at the defaults a piano phrase comes out within 3 dB of how it went in");
    EXPECT(share > -8.0 && share < 3.0, "and the chord is heard beside it, loud or soft");
  }
  // A full-scale sine right on a partial, held.
  double worst = 0.0;
  for (double lift : {0.0, 18.0, 36.0}) {
    for (double ring : {0.2, 5.0, 30.0}) {
      for (double f : {220.0, 440.0}) {
        fresh(device, 45, kMinor);
        device.set_param(p::kSharpness, 0.5f);
        device.set_param(p::kLift, static_cast<float>(lift));
        device.set_param(p::kRing, static_cast<float>(ring));
        worst = std::max(worst, top(run(device, sine(static_cast<float>(f), 12.0f, kRate, 1.0f))));
      }
    }
  }
  MEASURED("a full-scale sine held on a partial: the strings peak at %.3f at the most", worst);
  EXPECT(worst < 1.0, "a full-scale sine on a partial stays bounded, whatever Lift and Ring");
  fresh(device, 45, kMinor);
  const Stereo at_rest = run(device, sine(220.0f, 12.0f, kRate, 1.0f));
  double h2 = tone(at_rest, 440.0, at(8.0), at(12.0)), h3 = tone(at_rest, 660.0, at(8.0), at(12.0));
  MEASURED("at the defaults: %.1f dB, its 2nd %.1f, its 3rd %.1f dB", tone(at_rest, 220.0, at(8.0), at(12.0)), h2, h3);
  EXPECT(tone(at_rest, 220.0, at(8.0), at(12.0)) > h3 + 50.0, "and stays a sine: the level law is no waveshaper");
  // Every string driven at once as hard as it goes.
  double noisy = 0.0;
  fresh(device, 24, kLydian);
  device.set_param(p::kLift, 36.0f);
  device.set_param(p::kSharpness, 0.0f);
  device.set_param(p::kBass, 1.0f);
  device.set_param(p::kRing, 30.0f);
  device.set_param(p::kTilt, 6.0f);
  rng_state() = 31u;
  noisy = top(run(device, noise(8.0f, kRate, 1.0f)));
  MEASURED("eight strings under full-scale noise at full Lift: peak %.3f", noisy);
  EXPECT(noisy <= 1.0, "the strings never pass full scale");
  // Part-way Mix: a steady tone anywhere near a partial is not cancelled.
  double least = 100.0, most = -100.0, under = 100.0;
  for (double cents = -60.0; cents <= 60.0; cents += 3.0) {
    for (double mix : {0.3, 0.5, 0.7}) {
      fresh(device, 45, kMinor);
      device.set_param(p::kMix, static_cast<float>(mix));
      device.set_param(p::kWidth, 0.0f);
      const double f = 220.0 * std::exp2(cents / 1200.0);
      const Stereo out = run(device, sine(static_cast<float>(f), 3.0f, kRate, 0.2f));
      // The quietest fifty milliseconds once the strings have built up.
      for (double t = 1.5; t < 2.9; t += 0.05) {
        const double level = db(rms(out.left, at(t), at(t + 0.05))) - db(0.2 / std::sqrt(2.0));
        under = std::min(under, level - db(std::cos(mix * kPi / 2.0)));
        least = std::min(least, level);
        most = std::max(most, level);
      }
    }
  }
  MEASURED("a steady tone within 60 cents of a partial, Mix 0.3 to 0.7: %+.1f to %+.1f dB of the input, %+.1f of its dry share", least, most, under);
  EXPECT(under > -4.0 && most < 3.5, "part-way Mix neither cancels nor doubles a tone");
  // What rings is not pumped by what comes after.
  fresh(device, 45, kMinor);
  device.set_param(p::kRing, 8.0f);
  std::vector<float> in = note(220.0, 0.4, 3.0, kRate, 0.2, 1);
  const Stereo alone = run(device, in);
  std::vector<float> also = in;
  add(also, note(hz(58.0) * 1.01, 1.0, 3.0, kRate, 0.5, 1, 1.0));
  fresh(device, 45, kMinor);
  device.set_param(p::kRing, 8.0f);
  const Stereo with = run(device, also);
  const double moved = tone(with, 220.0, at(1.2), at(2.0)) - tone(alone, 220.0, at(1.2), at(2.0));
  MEASURED("a loud note off the chord moves what rings by %+.2f dB", moved);
  EXPECT(std::fabs(moved) < 0.5, "a loud note off the chord does not pump the ringing chord");
}

static void test_rates() {
  double level[3], hiss[3], time[3];
  int index = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    fresh(device, 45, kMinor, rate);
    level[index] = loud(run(device, piano(0.2f, rate)));
    fresh(device, 45, kMinor, rate);
    device.set_param(p::kSharpness, 0.3f);
    double power = 0.0;
    for (uint32_t seed = 1; seed < 9; ++seed) {
      fresh(device, 45, kMinor, rate);
      device.set_param(p::kSharpness, 0.3f);
      rng_state() = seed * 977u;
      power += std::pow(10.0, 0.1 * loud(run(device, bursts(0.5, 1.0, 1, 1.5, 0.3f, rate)), at(0.6, rate)));
    }
    hiss[index] = 10.0 * std::log10(power / 8.0);
    fresh(device, 57, kSingle, rate);
    device.set_param(p::kPartials, 1.0f);
    device.set_param(p::kRing, 2.0f);
    time[index] = rt60(run(device, note(220.0, 0.3, 2.5, rate, 0.3, 1)).left, rate, 0.5, 0.05, -85.0);
    MEASURED("%.0f Hz: piano %.2f dB, noise %.2f dB, Ring 2 s lasts %.3f s", rate, level[index], hiss[index], time[index]);
    ++index;
  }
  for (int k : {0, 2}) {
    EXPECT_NEAR(level[k], level[1], 0.5, "a phrase wakes the strings as loudly at every sample rate");
    EXPECT_NEAR(hiss[k], hiss[1], 2.0, "and noise of one power a hertz does too");
    EXPECT_NEAR(time[k], time[1], 0.02, "and Ring is the same");
  }
}

// --- faults -------------------------------------------------------------------------------------

static void test_bad_input() {
  const float bad[] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f, 1.0e-40f};
  for (float value : bad) {
    device.init(kRate);
    std::vector<float> in = piano(0.2f);
    for (size_t i = 4000; i < 4100; ++i) in[i] = value;
    const Stereo out = run(device, in);
    EXPECT(finite(out.left) && finite(out.right), "a bad sample does not get through");
    const Stereo rest = render(device, 25.0f, kRate);
    EXPECT(finite(rest.left) && top(rest, at(24.0)) == 0.0, "or stay: the device comes to rest");
    twin.init(kRate);
    const std::vector<float> again = note(220.0, 0.3, 1.0);
    EXPECT(apart(run(device, again), run(twin, again)) == 0.0, "and plays on as if it had never been");
  }
  // Silence that is not a number is silence.
  device.init(kRate);
  run(device, std::vector<float>(4800, std::nanf("")));
  EXPECT(device.resting(), "a stream of them does not wake it");
}

// How much of what a move changes is there in the first 8 samples, worst of eight moments.
template <typename Move>
static double suddenness(Move move) {
  double worst = 0.0;
  for (int k = 0; k < 8; ++k) {
    Stereo pair[2];
    for (int moved = 0; moved < 2; ++moved) {
      fresh(device, 45, kMinor9);
      device.set_param(p::kMix, 0.8f);
      std::vector<float> in = note(hz(33), 0.8, 2.0);
      add(in, note(hz(64), 0.8, 2.0));
      const size_t when = at(0.6) + 37 * static_cast<size_t>(k);
      const std::vector<float> head(in.begin(), in.begin() + when), tail(in.begin() + when, in.begin() + when + 2400);
      run(device, head);
      if (moved) move(device);
      pair[moved] = run(device, tail);
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < 960; ++i) {
      const double d = std::fabs(static_cast<double>(pair[1].left[i]) - pair[0].left[i]);
      if (i < 8) early = std::max(early, d);
      whole = std::max(whole, d);
    }
    if (whole > 1.0e-5) worst = std::max(worst, early / whole);
  }
  return worst;
}

static void test_moves() {
  struct Row {
    const char* name;
    int id;
    float value;
  };
  const Row rows[] = {{"Chord", p::kChord, 5.0f},       {"Root 1", p::kRoot1, 40.0f},   {"Shape 1", p::kShape1, 0.0f},
                      {"Damper", p::kDamper, 20.0f},    {"Mix", p::kMix, 0.0f},         {"Output", p::kOutput, -24.0f},
                      {"Width", p::kWidth, 0.0f},       {"Ring", p::kRing, 0.2f},       {"Tune", p::kTune, 50.0f},
                      {"Bass", p::kBass, 1.0f},         {"Lift", p::kLift, 36.0f},      {"Low cut", p::kLowCut, 1000.0f},
                      {"Partials", p::kPartials, 1.0f}, {"Spacing", p::kSpacing, 2.0f}, {"Sharpness", p::kSharpness, 1.0f},
                      {"Tilt", p::kTilt, 6.0f}};
  for (const Row& row : rows) {
    const double s = suddenness([&](SilentKeys& d) { d.set_param(row.id, row.value); });
    MEASURED("%s moved under sound: %.3f of the change is there in 8 samples", row.name, s);
    EXPECT(s < 0.15, "a knob moved under sound arrives gradually");
  }
  // The shortest damper under a ringing chord.
  const double cut = suddenness([](SilentKeys& d) {
    d.set_param(p::kDamper, 20.0f);
    d.set_param(p::kChord, 5.0f);
  });
  MEASURED("the shortest damper: %.3f", cut);
  EXPECT(cut < 0.15, "the shortest damper is no click");

  // Chord swept as fast as it goes, with the longest damper: more dying
  // strings than there is room for. Nothing clicks, nothing is stuck.
  fresh(device, 45, kLydian);
  for (int c = 0; c < 8; ++c) {
    device.set_param(p::kRoot1 + 2 * c, static_cast<float>(10 + c));
    device.set_param(p::kShape1 + 2 * c, static_cast<float>(kLydian));
  }
  device.set_param(p::kPartials, 2.0f);  // low partials alone, so a cut has nothing to hide behind
  device.set_param(p::kBass, 1.0f);
  device.set_param(p::kDamper, 4000.0f);
  device.set_param(p::kRing, 20.0f);
  device.set_param(p::kSharpness, 0.0f);
  device.set_param(p::kLift, 30.0f);
  rng_state() = 41u;
  run(device, noise(1.0f, kRate, 0.3f));
  Stereo swept;
  int most = 0;
  for (int k = 0; k < 200; ++k) {
    device.set_param(p::kChord, static_cast<float>(1 + (k * 5) % 8));
    swept = concat(swept, run(device, noise(0.01f, kRate, 0.3f)));
    most = std::max(most, device.sounding_strings());
  }
  // The third difference: smooth partials leave little in it, a cut leaves its own size.
  double kink = 0.0;
  for (size_t i = 3; i < swept.size(); ++i) {
    kink = std::max(kink, std::fabs(static_cast<double>(swept.left[i]) - 3.0 * swept.left[i - 1] + 3.0 * swept.left[i - 2] -
                                    swept.left[i - 3]));
  }
  MEASURED("the chord swept a hundred times a second: %d strings at the most, peak %.2f, third difference %.4f", most,
           top(swept), kink);
  EXPECT(most <= 24, "no more strings than there are places");
  EXPECT(kink < 0.001, "and no place is cut off");
  device.set_param(p::kChord, 8.0f);
  render(device, 0.2f, kRate);
  EXPECT(device.meter(14) == 8.0f && device.meter(6) == 41.0f, "the last chord asked for is the one held");
  render(device, 10.0f, kRate);
  EXPECT(device.sounding_strings() == 8, "and the old strings are given up once they have died");
  const Stereo answer = run(device, note(hz(41), 0.3, 2.0));
  EXPECT(tone(answer, hz(41), at(0.5), at(1.5)) > -40.0, "and it answers");
}

static void test_meters() {
  fresh(device, 48, kMajor);
  EXPECT(device.meter(6) == 48.0f && device.meter(7) == 52.0f && device.meter(8) == 55.0f && device.meter(9) == -1.0f,
         "the meters name the held keys before anything sounds");
  const Stereo out = run(device, note(hz(36), 0.2, 0.6));
  const double g3 = device.meter(2), e3 = device.meter(1), c3 = device.meter(0);
  MEASURED("meters after C2: C3 %.4f E3 %.4f G3 %.4f, output %.4f", c3, e3, g3,
           std::hypot(rms(out.left, at(0.5)), rms(out.right, at(0.5))) * std::sqrt(2.0));
  EXPECT(c3 > 3.0 * e3 && g3 > 3.0 * e3, "and the keys light up as they answer");
  EXPECT_NEAR(std::sqrt(c3 * c3 + g3 * g3 + e3 * e3), std::hypot(rms(out.left, at(0.5)), rms(out.right, at(0.5))) * std::sqrt(2.0),
              0.2 * c3, "the levels are what comes out");
  EXPECT(device.meter(-1) == 0.0f && device.meter(16) == 0.0f, "an index that is none reads 0");
}

int main() {
  Conformance spec;
  spec.name = "silent-keys";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 20.0f;
  spec.max_peak = 6.0f;
  check_effect(device, spec, kRate);
  test_triad();
  test_noise();
  test_empty();
  test_change();
  test_walk();
  test_blocks();
  test_rest();
  test_ring();
  test_sharpness();
  test_tone();
  test_level();
  test_rates();
  test_bad_input();
  test_moves();
  test_meters();

  fresh(device, 24, kLydian);
  device.set_param(p::kBass, 1.0f);
  rng_state() = 51u;
  const std::vector<float> in = noise(10.0f, kRate, 0.2f);
  const std::clock_t start = std::clock();
  run(device, in);
  const double share = 100.0 * static_cast<double>(std::clock() - start) / CLOCKS_PER_SEC / 10.0;
  std::printf("silent-keys cost: %.2f%% of real time, eight strings of twelve partials under noise (native, CPU time)\n",
              share);
  return finish("silent-keys");
}
