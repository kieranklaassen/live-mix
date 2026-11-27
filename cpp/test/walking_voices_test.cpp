// Native harness for Walking Voices (cpp/devices/walking-voices). The
// conformance pass covers silence, parameter abuse and other sample rates;
// the rest measures what makes it one crowd: the dealing by least motion, two
// singers on every held note, the leap, the six bodies and their own spectra,
// the five ways of walking, tuning, level, clicks, and the faults instruments
// have had before.

#include "../devices/walking-voices/walking_voices.h"

#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::WalkingVoices;
namespace p = livemix::walking_voices;
namespace w = livemix::walking_dsp;

static WalkingVoices device;
static const float kRate = 48000.0f;
static char label[240];

static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static double high(const Stereo& s, double hz, double rate = kRate) {
  return 10.0 * std::log10(energy_above(s.left, hz, rate, at(0.8, rate)));
}
static float uniform(uint32_t& state) {
  state = state * 1664525u + 1013904223u;
  return static_cast<float>(state >> 8) / 16777216.0f;
}

// Everybody comes in on the note, at once, in tune and stays there.
static void plain(float rate = kRate) {
  device.init(rate);
  for (int id : {p::kReach, p::kStubborn, p::kWander, p::kVibrato, p::kAir, p::kFade, p::kStrain, p::kVowelSpread})
    device.set_param(id, 0.0f);
  device.set_param(p::kLag, 0.01f); device.set_param(p::kAttack, 0.02f); device.set_param(p::kBreath, 12.0f);
}
static void set(int id, float value) { device.set_param(id, value); }
static void play(int id, float midi, float gain = 0.7f) { device.note_on(id, note_hz(midi), gain); }
static Stereo listen(double seconds, float rate = kRate) { return render(device, static_cast<float>(seconds), rate); }
static void chord() {
  const float keys[5] = {50, 57, 65, 72, 76};
  for (int i = 0; i < 5; ++i) play(i, keys[i]);
}

// The dealing against every other dealing there is, for crowds of up to seven.
static void test_least_motion() {
  uint32_t seed = 7u; int worse = 0, wrong = 0;
  for (int round = 0; round < 300; ++round) {
    const int count = 1 + static_cast<int>(uniform(seed) * 3.0f);
    const int people = 2 * count + static_cast<int>(uniform(seed) * static_cast<float>(8 - 2 * count));
    w::Seat seats[w::kSeats]; float pitch = 40.0f;
    for (int s = 0; s < count; ++s) {
      seats[s].pitch = pitch += 1.0f + 9.0f * uniform(seed); seats[s].weight = 0.1f + uniform(seed);
    }
    w::deal(seats, count, people); std::vector<int> spots;
    for (int s = 0; s < count; ++s) {
      wrong += seats[s].quota < 2;
      for (int q = 0; q < seats[s].quota; ++q) spots.push_back(s);
    }
    wrong += static_cast<int>(spots.size()) != people; float place[8];
    int pinned[8], seat_of[8], seated[w::kSeats] = {};
    for (int i = 0; i < people; ++i) {
      place[i] = 38.0f + 34.0f * uniform(seed); pinned[i] = -1;
    }
    if (round % 2 == 1) pinned[0] = static_cast<int>(uniform(seed) * static_cast<float>(count));
    w::assign(place, pinned, people, seats, count, seat_of);
    double walked = 0.0, least = 1.0e9;
    for (int i = 0; i < people; ++i) {
      walked += std::fabs(place[i] - seats[seat_of[i]].pitch); ++seated[seat_of[i]];
      wrong += pinned[i] >= 0 && seat_of[i] != pinned[i];
    }
    for (int s = 0; s < count; ++s) wrong += seated[s] != seats[s].quota;
    do {
      if (pinned[0] >= 0 && spots[0] != pinned[0]) continue;
      double sum = 0.0;
      for (int i = 0; i < people; ++i) sum += std::fabs(place[i] - seats[spots[static_cast<size_t>(i)]].pitch);
      least = std::min(least, sum);
    } while (std::next_permutation(spots.begin(), spots.end()));
    worse += walked > least + 1.0e-3;
  }
  EXPECT(worse == 0, "no dealing of all there are walks less than the one it makes");
  EXPECT(wrong == 0, "every seat gets its places, no note fewer than two, and who is kept on a note stays");

  // In the device: a chord moves round a held C and nobody overtakes anybody.
  plain(); set(p::kLag, 1.0f); const float before[4] = {48, 55, 60, 64}, after[4] = {47, 53, 60, 65};
  for (int i = 0; i < 4; ++i) play(i, before[i]);
  listen(4.0); float start[w::kSingers];
  for (int i = 0; i < w::kSingers; ++i) start[i] = device.place_of(i);
  for (int i = 0; i < 4; ++i) {
    if (i == 2) continue;
    device.note_off(i); play(10 + i, after[i]);
  }
  listen(0.01);
  double walked = 0.0;
  int crossed = 0, people = 0;
  for (int i = 0; i < w::kSingers; ++i) {
    if (!device.in_crowd(i)) continue;
    ++people; walked += std::fabs(device.goal_of(i) - start[i]);
    for (int j = 0; j < w::kSingers; ++j)
      crossed += device.in_crowd(j) && start[i] < start[j] - 0.5f && device.goal_of(i) > device.goal_of(j) + 0.5f;
  }
  std::printf("a chord moves: %.2f semitones a singer, %d crossings\n", walked / people, crossed);
  EXPECT(crossed == 0 && walked / people < 1.6, "nobody crosses and everybody takes the nearest note");
}

// Chords come and go under the worst of knobs: two singers on every key.
static void test_cover() {
  uint32_t seed = 99u; int bare = 0, left_alone = 0;
  for (int pass = 0; pass < 3; ++pass) {
    device.init(kRate); set(p::kWander, 1.0f); set(p::kStubborn, 1.0f); set(p::kBreath, pass == 0 ? 0.15f : 1.5f);
    set(p::kLag, pass == 2 ? 3.0f : 0.1f); set(p::kPath, static_cast<float>(pass * 2));
    set(p::kPeople, pass == 1 ? 2.0f : 30.0f); set(p::kLowShare, pass == 2 ? -1.0f : 1.0f);
    bool held[12] = {}, reached[12] = {};
    for (int step = 0; step < 140; ++step) {
      const int key = static_cast<int>(uniform(seed) * 12.0f);
      if (held[key]) device.note_off(key);
      else play(key, 40.0f + 3.0f * static_cast<float>(key));
      held[key] = !held[key]; reached[key] = false;
      for (int b = 0; b < 12; ++b) {
        device.process(128);
        for (int k = 0; k < 12; ++k) {
          if (!held[k]) continue;
          bare += device.singers_on(k, false) < 2; const bool here = device.singers_on(k, true) >= 2;
          left_alone += reached[k] && !here; reached[k] = reached[k] || here;
        }
      }
    }
  }
  EXPECT(bare == 0, "every held note has two singers sent to it at all times");
  EXPECT(left_alone == 0, "and keeps two who have arrived, whatever the chord does"); plain(); set(p::kPeople, 2.0f);
  for (int k = 0; k < 12; ++k) play(k, 38.0f + 4.0f * static_cast<float>(k));
  listen(1.0); int alone = 0;
  for (int k = 0; k < 12; ++k) alone += device.singers_on(k, true) < 2;
  EXPECT(alone == 0, "twelve keys have two singers each, however small the crowd");
}

static void test_leap() {
  double slowest = 0.0;
  for (int body = 0; body < w::kBodies; ++body) {
    plain(); set(p::kPath, WalkingVoices::kLeap); set(p::kAttack, 0.005f); set(p::kBody, static_cast<float>(body));
    set(p::kLag, 0.5f); set(p::kReach, 4.0f); play(1, 60, 0.8f); Stereo out = listen(0.6);
    const double full = rms(out.left, 0, at(0.4)); int ms = 0;
    while (ms < 200 && rms(out.left, at(ms * 0.001), at(ms * 0.001 + 0.006)) < 0.4 * full) ++ms;
    slowest = std::max(slowest, ms + 6.0);
  }
  std::printf("leap speaks in %.0f ms\n", slowest);
  EXPECT(slowest <= 30.0, "Leap speaks within 30 ms, with every body and a slow crowd behind");
  plain(); set(p::kPath, WalkingVoices::kLeap); set(p::kAttack, 0.005f); play(1, 60, 0.8f); listen(1.5);
  device.note_off(1); play(2, 66, 0.8f); Stereo moved = listen(0.2);
  EXPECT(tone_level(moved.left, note_hz(66), kRate, at(0.03), at(0.12)) >
             3.0 * tone_level(moved.left, note_hz(60), kRate, at(0.03), at(0.12)),
         "a leap from a held note is over within 30 ms");
}

static double harmonic(const Stereo& s, double f0, double n) {
  double power = 0.0;
  for (double c = -24.0; c <= 24.0; c += 8.0) {
    power += std::pow(tone_level(s.left, f0 * n * std::exp2(c / 1200.0), kRate, at(0.8), at(1.8)), 2.0);
  }
  return db(std::sqrt(power));
}

// A body is what its cycle is made of, and shows in which harmonics there are.
static void test_bodies() {
  double h[w::kBodies][9], above[w::kBodies];
  for (int body = 0; body < w::kBodies; ++body) {
    plain(); set(p::kPeople, 2.0f); set(p::kSpread, 0.0f); set(p::kAgreement, 1.0f); set(p::kEffort, 0.6f);
    set(p::kBody, static_cast<float>(body)); play(1, 57); Stereo out = listen(2.0); std::printf("body %d:", body);
    for (int n = 1; n <= 8; ++n) std::printf(" %.0f", h[body][n] = harmonic(out, note_hz(57), n));
    above[body] = high(out, 1500.0); std::printf("  over 1.5 kHz %.1f dB\n", above[body]);
  }
  EXPECT(h[w::kHollow][1] - h[w::kHollow][2] > 20.0 && h[w::kHollow][3] - h[w::kHollow][4] > 10.0,
         "Hollow has odd harmonics only");
  EXPECT(h[w::kStrings][2] - h[w::kStrings][1] > -14.0 && h[w::kStrings][8] - h[w::kStrings][1] > -40.0,
         "Strings has all of them, far up");
  EXPECT(h[w::kHum][6] - h[w::kHum][1] < -18.0 && above[w::kHum] < above[w::kOpen] - 2.0, "Hum is closed");
  EXPECT(h[w::kWhistle][2] > h[w::kWhistle][3] + 15.0 && h[w::kWhistle][2] > h[w::kWhistle][1] + 5.0,
         "Whistle puts a low key up an octave and adds little");
  EXPECT(above[w::kReed] > above[w::kOpen] + 2.5, "Reed is the brightest mouth");
}

// Seconds until nine in ten of the crowd are home after a move of a fifth.
static double settle_time(int path, float lag, float stubborn) {
  plain(); set(p::kPath, static_cast<float>(path)); set(p::kLag, lag); set(p::kStubborn, stubborn); play(1, 60);
  listen(lag < 1.0f ? 2.0 : 5.0); device.note_off(1); play(2, 67); listen(0.005);
  for (int t = 1; t <= 80; ++t) {
    int home = 0;
    for (int i = 0; i < w::kSingers; ++i)
      home += device.in_crowd(i) && std::fabs(device.place_of(i) - device.goal_of(i)) < 0.06f;
    if (home >= 23) return 0.1 * t;
    listen(0.1);
  }
  return 99.0;
}

static void test_walking() {
  const double quick = settle_time(WalkingVoices::kSlide, 0.1f, 0.0f);
  const double slow = settle_time(WalkingVoices::kSlide, 1.5f, 0.0f);
  const double late = settle_time(WalkingVoices::kLate, 1.5f, 0.0f);
  const double leap = settle_time(WalkingVoices::kLeap, 1.5f, 0.0f);
  const double wilful = settle_time(WalkingVoices::kSlide, 0.1f, 0.6f);
  std::printf("a fifth takes: lag 0.1 %.1f s, lag 1.5 %.1f s, late %.1f s, leap %.1f s, stubborn %.1f s\n", quick, slow,
              late, leap, wilful);
  EXPECT(slow > 4.0 * quick, "Lag is how long a crowd takes");
  EXPECT(late > slow && leap < slow, "Late comes after Slide and Leap before it");
  EXPECT(wilful > quick + 0.8, "Stubbornness keeps some behind");
  EXPECT(settle_time(WalkingVoices::kSlide, 0.1f, 1.0f) > 50.0, "and at the top some never give in");
  // Slide passes through everything; Steps stands on whole steps.
  for (int path = 0; path < 2; ++path) {
    plain(); set(p::kPath, static_cast<float>(path)); set(p::kLag, 1.0f); play(1, 60); listen(2.0);
    device.note_off(1); play(2, 68); int on_step = 0, between = 0;
    for (int t = 0; t < 500; ++t) {
      listen(0.005);
      for (int i = 0; i < w::kSingers; ++i) {
        const float place = device.place_of(i) - 60.0f;
        if (!device.in_crowd(i) || place < 0.2f || place > 7.8f) continue;
        (std::fabs(place - std::floor(place + 0.5f)) < 0.02f ? on_step : between) += 1;
      }
    }
    const double share = static_cast<double>(on_step) / std::max(1, on_step + between);
    EXPECT(path == 0 ? share < 0.2 : share > 0.5, "Slide glides and Steps stands on its steps");
  }
}

static void test_tuning() {
  double worst = 0.0;
  for (float midi : {36.0f, 49.0f, 62.0f, 75.0f, 84.0f}) {
    plain(); set(p::kAgreement, 0.8f); play(1, midi); Stereo out = listen(4.0);
    const double hz = dominant_frequency(out.left, kRate, note_hz(midi) * 0.98, note_hz(midi) * 1.02, at(0.5));
    worst = std::max(worst, std::fabs(cents(hz, note_hz(midi))));
  }
  std::printf("in tune within %.2f cents\n", worst); EXPECT(worst < 3.0, "in tune from C2 to C6");
  plain(); set(p::kAgreement, 1.0f); play(1, 48); play(2, 64); Stereo out = listen(4.0);
  const double third = dominant_frequency(out.left, kRate, note_hz(64) * 0.98, note_hz(64) * 1.01, at(0.8));
  EXPECT_NEAR(cents(third, note_hz(64)), -13.7, 2.0, "full agreement sings a pure third");
}

// The share of the sound between 180 and 900 Hz that is at `hz`.
static double share_at(const Stereo& s, double hz, size_t from, size_t to) {
  double own = 0.0, all = 0.0;
  for (double f = 180.0; f < 900.0; f += 2.0) {
    const double t = std::pow(tone_level(s.left, f, kRate, from, to), 2.0) + std::pow(tone_level(s.right, f, kRate, from, to), 2.0);
    all += t;
    if (std::fabs(cents(f, hz)) < 80.0) own += t;
  }
  return own / all;
}

// A tune at the defaults: the two who come first are heard on each note.
static void test_a_line() {
  device.init(kRate); const float tune[6] = {62, 67, 64, 71, 65, 69};
  double least = 1.0;
  for (int k = 0; k < 6; ++k) {
    play(k, tune[k], 0.8f); Stereo out = listen(0.19); device.note_off(k); listen(0.01);
    if (k > 0) least = std::min(least, share_at(out, note_hz(tune[k]), at(0.08), at(0.19)));
  }
  std::printf("a tune of fifths of a second: %.2f of the sound is on the note at the least\n", least);
  EXPECT(least > 0.2, "a quick tune is heard at the defaults");
}

// Lag draws an entry out, and whoever is there sings up meanwhile.
static void test_entries() {
  double tenth[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(); set(p::kPeople, 36.0f); set(p::kPath, WalkingVoices::kLeap); set(p::kLag, pass ? 3.0f : 0.01f); set(p::kLowShare, 0.0f); play(1, 60);
    int singing = 0; tenth[pass] = db(rms(listen(0.3).left, at(0.1))); singing = device.singers_on(1, true);
    std::printf("lag %d: %d have come in\n", pass, singing);
    EXPECT(pass ? singing < 22 && singing >= w::kCover : singing == 36, "Lag spreads the crowd's first entry");
  }
  EXPECT(tenth[0] - tenth[1] < 9.0, "and who has come in sings up for the rest");
  // The first two carry a move while the others are on their way.
  plain(); set(p::kLag, 5.0f); play(1, 60); listen(4.0); device.note_off(1); play(2, 67);
  listen(1.0);
  const double carried = 10.0 * std::log10(share_at(listen(0.5), note_hz(67), 0, at(0.5)) + 1.0e-9);
  std::printf("the new note a second in: %.1f dB of the sound\n", carried);
  EXPECT(carried > -2.8, "a new note is carried by the two who are there");
  // Low share is also how loud they are.
  plain(); set(p::kLowShare, 1.0f); set(p::kPath, WalkingVoices::kLeap); play(1, 57); play(2, 64); play(3, 72);
  Stereo weighted = listen(4.0);
  const double tilt = 10.0 * std::log10(share_at(weighted, note_hz(57), at(1.0), at(4.0)) /
                                        share_at(weighted, note_hz(72), at(1.0), at(4.0)));
  std::printf("Low share: the bottom is %.1f dB over the top\n", tilt);
  EXPECT(tilt > 14.0, "Low share weights the low notes");
  // Knobs moved in a silence are where they were left on the next note.
  double fresh[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(); set(p::kPath, WalkingVoices::kLeap); set(p::kAttack, 0.01f); set(p::kRelease, 0.12f);
    set(p::kEffort, pass ? 1.0f : 0.0f); play(1, 57); listen(0.3);
    if (!pass) {
      device.note_off(1); listen(3.0); set(p::kEffort, 1.0f); play(1, 57);
    } else {
      device.init(kRate); plain(); set(p::kPath, WalkingVoices::kLeap); set(p::kAttack, 0.01f); set(p::kEffort, 1.0f); play(1, 57);
    }
    Stereo out = listen(0.04);
    fresh[pass] = 10.0 * std::log10(energy_above(out.left, 1500.0, kRate, 0));
  }
  std::printf("a knob moved asleep: %.1f dB against %.1f dB\n", fresh[0], fresh[1]);
  EXPECT(fresh[0] > fresh[1] - 2.4, "a knob moved asleep does not glide under the next note");
  // Now and then: at the default Wander few are away, at the top most.
  int away[2] = {0, 0};
  for (int pass = 0; pass < 2; ++pass) {
    plain(); set(p::kWander, pass ? 1.0f : p::kParamDefault[p::kWander]); play(1, 60);
    for (int t = 0; t < 20; ++t) {
      listen(0.5);
      for (int i = 0; i < w::kSingers; ++i) away[pass] += device.in_crowd(i) && std::fabs(device.goal_of(i) - 60.0f) > 6.0f;
    }
  }
  std::printf("away: %.1f at the default, %.1f at the top\n", away[0] / 20.0, away[1] / 20.0);
  EXPECT(away[0] > 8 && away[0] < 120 && away[1] > 2 * away[0], "now and then someone wanders");
  // A crowd too small for the chord sings on in pairs, and is heard to be small.
  double second[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(); set(p::kPeople, pass ? 12.0f : 2.0f); set(p::kAgreement, 0.2f); set(p::kSpread, 0.0f);
    for (int k = 0; k < 6; ++k) play(k, 48.0f + 5.0f * static_cast<float>(k));
    Stereo out = listen(6.0);
    double loud = 0.0, soft = 1.0;
    for (int t = 10; t < 59; ++t) {
      const double v = tone_level(out.left, note_hz(58), kRate, at(0.1 * t), at(0.1 * t + 0.1));
      loud = std::max(loud, v); soft = std::min(soft, v);
    }
    second[pass] = db(loud / soft);
  }
  std::printf("a pair beats %.1f dB, a singer and a shadow %.1f dB\n", second[1], second[0]);
  EXPECT(second[1] > second[0] + 3.0, "below two a note the second steps back");
  // Nothing plain is left in a whisper, and a leap obeys Release.
  double whisper[2], left[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(); set(p::kAir, static_cast<float>(pass)); set(p::kAgreement, 1.0f); play(1, 57); Stereo out = listen(3.0);
    whisper[pass] = share_at(out, note_hz(57), at(1.0), at(3.0));
    plain(); set(p::kPath, WalkingVoices::kLeap); set(p::kRelease, pass ? 12.0f : 0.5f); play(1, 57); listen(1.0); device.note_off(1); listen(1.0);
    left[pass] = db(rms(listen(0.2).left) + 1.0e-9);
  }
  EXPECT(whisper[1] < 0.5 * whisper[0], "all the way up Air leaves hardly a tone");
  EXPECT(left[1] > left[0] + 30.0, "Release is heard whatever the path");
}

static double level_of(float midi, int people, float gain, int body) {
  device.init(kRate); set(p::kPeople, static_cast<float>(people)); set(p::kBody, static_cast<float>(body));
  play(1, midi, gain); Stereo out = listen(5.0);
  std::snprintf(label, sizeof label, "body %d note %.0f peaks at %.1f dBFS", body, midi, db(loudest(out)));
  EXPECT(db(loudest(out)) > -24.0 && db(loudest(out)) < -10.0, label);
  return db(std::sqrt(0.5 * (std::pow(rms(out.left, at(1.0)), 2.0) + std::pow(rms(out.right, at(1.0)), 2.0))));
}

static void test_levels() {
  for (int body = 0; body < w::kBodies; ++body) {
    double least = 0.0, most = -99.0;
    for (float midi = 36.0f; midi <= 84.0f; midi += 12.0f) {
      const double level = level_of(midi, 26, 0.7f, body); least = std::min(least, level);
      most = std::max(most, level);
    }
    device.init(kRate); set(p::kBody, static_cast<float>(body));
    for (int k = 0; k < 10; ++k) play(k, 38.0f + 5.0f * static_cast<float>(k), 1.0f);
    const double ten = loudest(listen(3.0));
    std::printf("body %d: %.1f to %.1f dBFS from C2 to C6, ten keys peak at %.2f\n", body, least, most, ten);
    EXPECT(most - least < 7.5, "even over four octaves");
    EXPECT(ten < 0.5, "ten keys at full touch stay under the knee");
  }
  EXPECT(std::fabs(level_of(60, 8, 0.7f, 0) - level_of(60, 36, 0.7f, 0)) < 4.0, "a bigger crowd is no louder");
  device.init(kRate); play(1, 60, 0.15f); const double soft = rms(listen(3.0).left, at(1.0));
  device.init(kRate); play(1, 60, 1.0f);
  EXPECT(db(rms(listen(3.0).left, at(1.0)) / soft) > 10.0, "a soft touch is soft");
  device.init(kRate); play(1, 60, 0.0f); EXPECT(loudest(listen(1.0)) == 0.0, "a touch of nothing is nothing");
  for (int id : {p::kLowShare, p::kPeople, p::kLeader}) {
    for (float value : {p::kParamMin[id], p::kParamMax[id]}) {
      device.init(kRate); set(p::kPath, WalkingVoices::kSteps); set(p::kLag, 0.2f); set(id, value);
      for (int k = 0; k < 10; ++k) play(k, 38.0f + 5.0f * static_cast<float>(k), 1.0f);
      EXPECT(loudest(listen(3.0)) < 0.55, "ten stepping keys stay near the knee at both ends of the crowd's knobs");
    }
  }
  double bright[2], under[2], alike[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(); play(1, 57, pass ? 1.0f : 0.25f); bright[pass] = high(listen(2.0), 1000.0);
    plain(); set(p::kLowShare, pass ? 0.9f : 0.0f); play(1, 57);
    under[pass] = db(tone_level(listen(2.0).left, note_hz(45), kRate, at(1.0)));
    plain(); set(p::kSpread, 1.0f); set(p::kLeader, static_cast<float>(pass)); play(1, 57); Stereo out = listen(2.0);
    alike[pass] = correlation(out.left, out.right, at(0.8));
  }
  EXPECT(bright[1] > bright[0] + 2.0, "touch is heard in the colour");
  EXPECT(under[1] > under[0] + 20.0, "Low share sings an octave under");
  EXPECT(alike[1] > 0.9 && alike[0] < 0.8, "a leader stands alone in the middle and a crowd all round");
}

// The largest second difference: a click stands out of it, a tone does not.
static double bend(const Stereo& s) {
  double worst = 0.0;
  for (const std::vector<float>* x : {&s.left, &s.right}) {
    for (size_t i = 2; i < x->size(); ++i)
      worst = std::max(worst, std::fabs(static_cast<double>((*x)[i]) - 2.0 * (*x)[i - 1] + (*x)[i - 2]));
  }
  return worst;
}

static void test_clicks() {
  // Each event against a second with nothing in it, or, where the voices
  // strike anew, against their first strike.
  const char* names[] = {"Body", "Path", "People", "a restrike", "a new chord", "Volume", "Vowel", "a leap struck again"};
  for (int event = 0; event < 8; ++event) {
    device.init(kRate); set(p::kAir, 0.0f); set(p::kAttack, 0.02f);
    if (event == 7) set(p::kPath, WalkingVoices::kLeap);
    chord(); const double first = bend(listen(0.6)); listen(1.4);
    const double still = event == 7 ? first : bend(listen(1.0));
    if (event == 0) set(p::kBody, w::kHum);
    if (event == 1) set(p::kPath, WalkingVoices::kLate);
    if (event == 2) set(p::kPeople, 4.0f);
    if (event == 3 || event == 7) chord();
    for (int i = 0; event == 4 && i < 5; ++i) {
      device.note_off(i); play(20 + i, 48.0f + 5.0f * static_cast<float>(i));
    }
    if (event == 5) set(p::kVolume, -30.0f);
    if (event == 6) set(p::kVowel, 0.05f);
    const double worst = bend(listen(0.6));
    std::snprintf(label, sizeof label, "no click at %s (%.4f against %.4f)", names[event], worst, still);
    EXPECT(worst < 1.8 * still, label);
  }
  // Every knob thrown about while a chord sounds.
  for (int id = 0; id < p::kNumParams; ++id) {
    device.init(kRate); set(p::kAir, 0.0f); chord(); listen(0.5);
    double worst = 0.0;
    bool fine = true;
    for (int step = 0; step < 40; ++step) {
      set(id, livemix::kit::lerp(p::kParamMin[id], p::kParamMax[id], 0.5f - 0.5f * std::cos(static_cast<float>(step) * 0.31f)));
      Stereo out = listen(0.01); fine = fine && finite(out.left) && finite(out.right) && loudest(out) < 1.0;
      worst = std::max(worst, bend(out));
    }
    std::snprintf(label, sizeof label, "param %d thrown about while sounding: %.4f", id, worst);
    EXPECT(fine && worst < 0.08, label);
  }
}

static Stereo across_a_silence(int block) {
  device.init(kRate); set(p::kRelease, 0.1f); set(p::kWander, 1.0f); set(p::kBreath, 0.4f); chord();
  Stereo out = render(device, 2048.0f * 20.0f / kRate, kRate, block);
  for (int i = 0; i < 5; ++i) device.note_off(i);
  out = concat(out, render(device, 2048.0f * 40.0f / kRate, kRate, block)); set(p::kVowel, 0.9f); play(9, 62, 0.8f);
  return concat(out, render(device, 2048.0f * 20.0f / kRate, kRate, block));
}

static void test_rules() {
  const Stereo reference = across_a_silence(128);
  for (int block : {1, 2048}) {
    const Stereo other = across_a_silence(block);
    EXPECT(other.left == reference.left && other.right == reference.right, "any block gives the same across a silence");
  }
  // One id at A, at B and at A again, and one note off; then a flurry.
  device.init(kRate);
  for (float midi : {57.0f, 64.0f, 57.0f}) {
    play(1, midi); listen(0.3);
  }
  device.note_off(1); listen(6.0);
  EXPECT(loudest(listen(0.2)) == 0.0, "one note off ends an id played at A, B and A");
  for (int k = 0; k < 30; ++k) {
    play(k, 40.0f + static_cast<float>(k), 0.9f); device.process(3);
  }
  for (int k = 0; k < 30; ++k) device.note_off(k);
  listen(6.0); EXPECT(loudest(listen(0.2)) == 0.0, "and nothing is left after a flurry");
  const float nan = std::numeric_limits<float>::quiet_NaN(), inf = std::numeric_limits<float>::infinity();
  device.init(kRate); play(1, 60); device.note_on(2, 0.0f, 0.7f); device.note_on(3, inf, 0.7f); device.note_on(4, -50.0f, 0.7f);
  listen(0.3); int astray = 0;
  for (int i = 0; i < w::kSingers; ++i) astray += device.in_crowd(i) && std::fabs(device.goal_of(i) - 60.0f) > 13.0f;
  EXPECT(astray == 0, "no pitch there is no such thing as draws anybody away");
  device.init(kRate); device.note_on(1, nan, 0.7f); device.note_on(2, inf, nan); device.note_on(3, -inf, inf);
  device.note_on(4, 0.0f, -1.0f); device.note_on(5, 20000.0f, 9.0f); const Stereo odd = listen(1.0);
  EXPECT(finite(odd.left) && finite(odd.right) && loudest(odd) < 1.0, "absurd notes are survived");
  double level[3], bright[3];
  const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
  for (int r = 0; r < 3; ++r) {
    plain(rates[r]); set(p::kAir, 0.5f);
    for (int k = 0; k < 4; ++k) play(k, 45.0f + 7.0f * static_cast<float>(k));
    const Stereo out = listen(4.0, rates[r]); level[r] = db(rms(out.left, at(1.0, rates[r])));
    bright[r] = high(out, 2000.0, rates[r]);
  }
  double hiss[2];
  for (int r = 0; r < 2; ++r) {
    plain(rates[r ? 2 : 0]); set(p::kBody, w::kWhistle); set(p::kAir, 1.0f); set(p::kPeople, 36.0f); play(1, 60);
    const Stereo out = listen(4.0, rates[r ? 2 : 0]);
    hiss[r] = 10.0 * std::log10(energy_above(out.left, 5500.0, rates[r ? 2 : 0], at(0.8, rates[r ? 2 : 0])));
  }
  std::printf("hiss over 5.5 kHz: %.1f dB at 44.1, %.1f dB at 96 kHz\n", hiss[0], hiss[1]);
  EXPECT(std::fabs(hiss[0] - hiss[1]) < 2.8, "and as airy");
  EXPECT(std::fabs(level[0] - level[2]) < 1.5 && std::fabs(level[1] - level[2]) < 1.5, "as loud at every rate");
  EXPECT(std::fabs(bright[0] - bright[2]) < 1.5 && std::fabs(bright[1] - bright[2]) < 1.5, "and as bright");
  device.init(kRate); chord(); listen(3.0); const double early = rms(listen(5.0).left); listen(20.0);
  EXPECT(std::fabs(db(early) - db(rms(listen(5.0).left))) < 2.5, "a long chord neither swells nor sinks");
}

int main() {
  Conformance spec; spec.name = "walking-voices"; spec.num_params = p::kNumParams; spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax; spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;  // let go at the defaults, the crowd is at -120 dB after 3.6 s
  spec.max_peak = 1.01f; check_instrument(device, spec, kRate); test_least_motion(); test_cover(); test_leap();
  test_bodies(); test_walking(); test_tuning(); test_a_line(); test_entries(); test_levels(); test_clicks();
  test_rules();
  for (int body : {static_cast<int>(w::kOpen), static_cast<int>(w::kReed)}) {
    device.init(kRate); set(p::kPeople, 36.0f); set(p::kBody, static_cast<float>(body));
    for (int n = 0; n < 8; ++n) play(n, 45.0f + 4.0f * static_cast<float>(n), 0.8f);
    listen(0.5);
    report_cost(body ? "walking-voices (reed, 8 notes)" : "walking-voices (open, 8 notes)", 2.0f, kRate, [] { listen(2.0); });
  }
  return finish("walking-voices");
}
