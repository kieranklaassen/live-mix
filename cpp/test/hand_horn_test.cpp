// Hand Horn: the conformance pass, and what makes it what it is: the rule of
// the crook and the hand, its pitches and its shadows, the ladder of a slide,
// and the ways a set of keys can go wrong. Every claim is measured on a render.

#include "support/test_kit.h"

#include "../devices/hand-horn/hand_horn.h"

using namespace testkit;
using namespace livemix::hand_horn;
using livemix::HandHorn;

namespace {

constexpr float kRate = 48000.0f;
HandHorn device;
HandHorn other;

enum Crook { kBbBasso = 0, kC, kD, kEb, kE, kF, kG, kAb, kA, kBbAlto, kCAlto };
enum Play { kSolo = 0, kChords };

float key(float midi) { return 440.0f * std::pow(2.0f, (midi - 69.0f) / 12.0f); }
size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// A plain horn: near and in the middle, so a tone is measured and not a room.
void plain(HandHorn& d, float rate = kRate) {
  d.init(rate);
  d.set_param(kDistance, 0.0f);
  d.set_param(kSpread, 0.0f);
  d.set_param(kBreath, 0.0f);
}

Stereo play(HandHorn& d, float midi, float seconds, float gain = 0.7f, float rate = kRate) {
  d.note_on(1, key(midi), gain);
  return render(d, seconds, rate);
}

// Cents between the sound and `hz`: the turn of the fundamental's phase over
// the stretch, so a good deal finer than a spectrum's bins. The wave is first
// turned down by `hz` and averaged over a whole number of its periods.
double cents_off(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  const size_t period = static_cast<size_t>(std::lround(std::max(2.0, std::round(hz * 0.04)) * rate / hz));
  double last = 0.0, total = 0.0;
  size_t steps = 0;
  bool first = true;
  for (size_t start = from; start + period <= to; start += period / 2) {
    double re = 0.0, im = 0.0;
    for (size_t i = 0; i < period; ++i) {
      const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(period));
      const double p = 2.0 * kPi * hz * static_cast<double>(start + i) / rate;
      re += w * x[start + i] * std::cos(p);
      im -= w * x[start + i] * std::sin(p);
    }
    const double phase = std::atan2(im, re);
    if (!first) {
      double turn = phase - last;
      while (turn > kPi) turn -= 2.0 * kPi;
      while (turn < -kPi) turn += 2.0 * kPi;
      total += turn;
      ++steps;
    }
    last = phase;
    first = false;
  }
  const double seconds = static_cast<double>(steps) * static_cast<double>(period / 2) / rate;
  const double off_hz = seconds > 0.0 ? total / (2.0 * kPi * seconds) : 0.0;
  return 1200.0 * std::log2((hz + off_hz) / hz);
}

// The kit's correlation takes the means as zero: these are not.
double together(std::vector<float> a, std::vector<float> b) {
  const double ma = mean(a), mb = mean(b);
  for (float& v : a) v -= static_cast<float>(ma);
  for (float& v : b) v -= static_cast<float>(mb);
  return correlation(a, b);
}

struct Tone {
  double level = 0.0;      // dB, root mean square of the harmonics
  double centroid = 0.0;   // Hz, by power
  double amplitude_centroid = 0.0;
  std::vector<double> harmonic;  // dB, from 1 (index 0 unused)
};

Tone tone(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  Tone t;
  t.harmonic.push_back(0.0);
  double power = 0.0, weighted = 0.0, sum = 0.0, weighted_sum = 0.0;
  for (int h = 1; h * hz < 9000.0; ++h) {
    const double a = tone_level(x, h * hz, rate, from, to);
    t.harmonic.push_back(db(a));
    power += a * a;
    weighted += a * a * h * hz;
    sum += a;
    weighted_sum += a * h * hz;
  }
  t.level = db(std::sqrt(power / 2.0));
  t.centroid = weighted / power;
  t.amplitude_centroid = weighted_sum / sum;
  return t;
}

Tone held_tone(float midi, float shadow = -1.0f, float gain = 0.7f, int crook = kC) {
  plain(device);
  device.set_param(kCrook, static_cast<float>(crook));
  if (shadow >= 0.0f) device.set_param(kShadow, shadow);
  const Stereo out = play(device, midi, 1.4f, gain);
  return tone(out.left, key(midi), kRate, at(0.5), at(1.4));
}

double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// --- the rule ------------------------------------------------------------------------------

void test_rule() {
  struct Row {
    float key;       // cents over C4
    int from;
    bool open;
    float down;      // cents the hand lowers it
  };
  // The card: the C crook in the octave from its 8th partial.
  const Row rows[] = {
      {0.0f, 8, true, 0.0f},     {200.0f, 9, true, 0.0f},   {400.0f, 10, true, 0.0f},
      {500.0f, 11, false, 51.3f}, {600.0f, 12, false, 102.0f}, {700.0f, 12, true, 0.0f},
      {800.0f, 13, false, 40.5f}, {900.0f, 14, false, 68.8f}, {1000.0f, 14, true, 0.0f},
      {1100.0f, 15, true, 0.0f}, {1200.0f, 16, true, 0.0f},  {100.0f, 9, false, 103.9f},
      {300.0f, 10, false, 86.3f}};
  for (const Row& row : rows) {
    const Ask a = ask(3600.0f + row.key, 0.0f, 35.0f);
    char label[120];
    std::snprintf(label, sizeof label, "rule: %g cents over C4 comes from partial %d (got %d, open %d)", row.key,
                  row.from, a.from, a.open);
    EXPECT(a.from == row.from && a.open == row.open, label);
    if (!row.open) {
      EXPECT_NEAR(a.from_at - (3600.0f + row.key), row.down, 0.1, "rule: cents the hand lowers");
      EXPECT_NEAR(a.covering, std::min(1.0f, row.down / 120.0f), 0.001, "rule: covering is cents over 120");
    } else {
      EXPECT(a.covering == 0.0f, "rule: an open key has no hand in it");
    }
  }
  EXPECT_NEAR(ask(4700.0f, 0.0f, 35.0f).thin, 11.73 / 60.0, 0.002, "rule: B4 is lipped 12 cents up");
  EXPECT_NEAR(ask(4600.0f, 0.0f, 35.0f).thin, 31.17 / 60.0, 0.002, "rule: B flat 4 is lipped 31 cents up");
  EXPECT(ask(3800.0f, 0.0f, 35.0f).thin == 0.0f, "rule: lipping down does not thin");
  // Under the fundamental, and far up.
  EXPECT(ask(-900.0f, 0.0f, 35.0f).from == 1 && ask(-900.0f, 0.0f, 35.0f).covering == 1.0f,
         "rule: under the fundamental the first partial is stopped");
  for (float lip : {5.0f, 35.0f, 60.0f}) {
    for (float cents = -1500.0f; cents < 9500.0f; cents += 7.3f) {
      const Ask a = ask(cents, 0.0f, lip);
      const bool good = a.from >= 1 && a.nearest >= 1 && a.covering >= 0.0f && a.covering <= 1.0f &&
                        (a.open || a.from_at > cents) &&
                        std::fabs(cents - a.nearest_at) <= std::fabs(cents - rung(a.nearest + 1)) + 0.01f &&
                        (a.nearest == 1 ||
                         std::fabs(cents - a.nearest_at) <= std::fabs(cents - rung(a.nearest - 1)) + 0.01f) &&
                        (!a.open || std::fabs(cents - a.nearest_at) <= lip);
      EXPECT(good, "rule: nearest is nearest, stopped is from above, open is in reach");
      if (!good) return;
    }
  }
  const float semitones[] = {-2, 0, 2, 3, 4, 5, 7, 8, 9, 10, 12};
  for (int c = 0; c < kNumCrooks; ++c) {
    EXPECT_NEAR(crook_cents(c), 100.0f * semitones[c], 0.001, "crooks stand where they say");
  }
}

// --- pitch ---------------------------------------------------------------------------------

double pitch_of(float midi, float against_hz, int crook, float hand, float* covering = nullptr,
                float* partial = nullptr) {
  plain(device);
  device.set_param(kCrook, static_cast<float>(crook));
  device.set_param(kHand, hand);
  const Stereo out = play(device, midi, 1.0f);
  if (covering) *covering = device.meter(0);
  if (partial) *partial = device.meter(1);
  return cents_off(out.left, against_hz, kRate, at(0.35), at(1.0));
}

void test_pitch() {
  // Hand 1: every key is in tune, open or stopped.
  for (float midi : {60.0f, 62.0f, 64.0f, 67.0f, 65.0f, 69.0f, 66.0f, 70.0f, 71.0f, 72.0f}) {
    float covering = 0.0f, partial = 0.0f;
    const double off = pitch_of(midi, key(midi), kC, 1.0f, &covering, &partial);
    std::printf("  hand 1, key %g: %+.2f cents, partial %g, covering %.3f\n", midi, off, partial, covering);
    EXPECT_NEAR(off, 0.0, 0.8, "Hand 1 plays the key exactly");
  }
  // Hand 0: the nearest partial, at its own pitch.
  struct Row {
    float midi;
    int partial;
  };
  for (const Row& row : {Row{60, 8}, Row{62, 9}, Row{64, 10}, Row{65, 11}, Row{66, 11}, Row{67, 12}, Row{68, 13},
                         Row{69, 13}, Row{70, 14}, Row{71, 15}, Row{72, 16}}) {
    const float true_hz = 32.703196f * static_cast<float>(row.partial);
    float covering = 1.0f, partial = 0.0f;
    const double off = pitch_of(row.midi, true_hz, kC, 0.0f, &covering, &partial);
    const double from_key = 1200.0 * std::log2(true_hz / key(row.midi));
    std::printf("  hand 0, key %g: partial %d, %+.1f cents from the key, off by %+.2f\n", row.midi, row.partial,
                from_key, off);
    EXPECT_NEAR(off, 0.0, 0.8, "Hand 0 plays the nearest partial at its own pitch");
    EXPECT(covering == 0.0f && partial == static_cast<float>(row.partial), "Hand 0 is open on that partial");
  }
  // Half way: half the gap, half the covering.
  float covering = 0.0f;
  const double half = pitch_of(65.0f, key(65.0f), kC, 0.5f, &covering);
  EXPECT_NEAR(half, 51.3 / 2.0, 0.8, "Hand at half leaves half the gap");
  EXPECT_NEAR(covering, 0.5 * 51.3 / 120.0, 0.01, "Hand at half covers half");
  // A retuned key: a quarter tone over C4 is played as a quarter tone.
  plain(device);
  device.note_on(1, key(60.5f), 0.7f);
  const Stereo quarter = render(device, 1.0f, kRate);
  EXPECT_NEAR(cents_off(quarter.left, key(60.5f), kRate, at(0.35), at(1.0)), 0.0, 0.8, "a retuned key is honoured");
  // Every crook, every key: in tune, finite, and the meters in range.
  double worst = 0.0;
  int worst_key = 0, worst_crook = 0;
  for (int crook = 0; crook < kNumCrooks; ++crook) {
    for (int midi = 24; midi <= 96; ++midi) {
      plain(device);
      device.set_param(kCrook, static_cast<float>(crook));
      device.set_param(kAttack, 0.005f);
      const Stereo out = play(device, static_cast<float>(midi), 0.6f);
      EXPECT(finite(out.left) && finite(out.right) && rms(out.left, at(0.3)) > 1.0e-3, "every key sounds");
      const double off = std::fabs(cents_off(out.left, key(static_cast<float>(midi)), kRate, at(0.3), at(0.6)));
      if (off > worst) {
        worst = off;
        worst_key = midi;
        worst_crook = crook;
      }
      EXPECT(device.meter(0) >= 0.0f && device.meter(0) <= 1.0f && device.meter(1) >= 1.0f, "meters in range");
    }
  }
  std::printf("  worst pitch over 11 crooks and 73 keys: %.2f cents (crook %d key %d)\n", worst, worst_crook,
              worst_key);
  EXPECT(worst < 1.0, "every key of every crook is within a cent");
}

// --- the shadow ----------------------------------------------------------------------------

void test_shadow() {
  // F4, A4 and F sharp 4 in the order the hand moves: 51, 69 and 102 cents.
  struct Row {
    float midi;
    const char* name;
  };
  double last_level = 1.0, last_centroid = 2.0, last_amplitude = 2.0;
  for (const Row& row : {Row{67, "G4 open"}, Row{65, "F4, 51"}, Row{69, "A4, 69"}, Row{66, "F#4, 102"}}) {
    const Tone stopped = held_tone(row.midi), bare = held_tone(row.midi, 0.0f);
    const double level = stopped.level - bare.level;
    const double centroid = stopped.centroid / bare.centroid;
    const double amplitude = stopped.amplitude_centroid / bare.amplitude_centroid;
    // What the hand does to the harmonic nearest 1200 Hz against the one an
    // octave or so above it: the nasal band stands out of the dark.
    const int h = static_cast<int>(std::lround(1220.0 / key(row.midi)));
    const int up = static_cast<int>(std::lround(1950.0 / key(row.midi)));
    const double nasal = (stopped.harmonic[h] - bare.harmonic[h]) - (stopped.harmonic[up] - bare.harmonic[up]);
    std::printf("  %-9s level %+.2f dB, centroid %.0f Hz (x %.3f of the open tone), by amplitude x %.3f, "
                "nasal band %+.1f dB over the octave above\n",
                row.name, level, stopped.centroid, centroid, amplitude, nasal);
    EXPECT(level < last_level - (last_level < 0.5 ? 0.5 : 0.0), "a note is smaller the further the hand moved");
    EXPECT(centroid < last_centroid - 0.005, "a note is darker the further the hand moved");
    EXPECT(amplitude < last_amplitude - 0.005, "a note is darker by amplitude too");
    if (last_level < 0.5) EXPECT(nasal > 5.0, "a stopped note keeps its nasal band over what lies above it");
    last_level = level;
    last_centroid = centroid;
    last_amplitude = amplitude;
  }
  // The nasal band is a band: at a full stop what the hand leaves at 1100 to
  // 1250 Hz stands over what it leaves below and above.
  const Tone stopped = held_tone(53.0f, 1.0f), bare = held_tone(53.0f, 0.0f);  // F3, 175 Hz, from the 6th
  std::vector<double> hand(stopped.harmonic.size(), 0.0);
  for (size_t h = 1; h < 14; ++h) hand[h] = stopped.harmonic[h] - bare.harmonic[h];
  std::printf("  full stop by harmonic of F3:");
  for (int h = 1; h < 13; ++h) std::printf(" %.1f", hand[h]);
  std::printf("\n");
  EXPECT(hand[7] > hand[5] + 1.5 && hand[7] > hand[10] + 6.0, "a full stop leaves a nasal band near 1200 Hz");

  // Shadow at five points: darker and smaller each time.
  double level = 100.0, centroid = 1.0e9;
  for (float shadow : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    const Tone t = held_tone(66.0f, shadow);
    std::printf("  F#4 at Shadow %.2f: level %.1f dB, centroid %.0f Hz\n", shadow, t.level, t.centroid);
    EXPECT(t.level < level - 0.5 && t.centroid < centroid - 10.0, "Shadow is darker and smaller all the way");
    level = t.level;
    centroid = t.centroid;
  }
  // The open notes do not hear Shadow.
  EXPECT(held_tone(67.0f, 0.0f).level == held_tone(67.0f, 1.0f).level, "Shadow leaves open notes alone");

  // B4 is the 15th partial lipped up and thinner than C5; B flat more so.
  auto body = [](const Tone& t) { return t.harmonic[1] - t.harmonic[2]; };
  auto alone = [&](float midi, float hand_at) {
    plain(device);
    device.set_param(kHand, hand_at);
    const Stereo out = play(device, midi, 1.4f);
    const double hz = hand_at > 0.5f ? key(midi) : 32.703196 * device.meter(1);
    return tone(out.left, hz, kRate, at(0.5), at(1.4));
  };
  const Tone c5 = alone(72, 1), c5_bare = alone(72, 0), b4 = alone(71, 1), b4_bare = alone(71, 0);
  const Tone bb4 = alone(70, 1), bb4_bare = alone(70, 0), d4 = alone(62, 1), d4_bare = alone(62, 0);
  std::printf("  first harmonic lost to lipping: C5 %+.2f, B4 %+.2f, Bb4 %+.2f, D4 (down) %+.2f dB; level %+.2f %+.2f "
              "%+.2f %+.2f\n",
              body(c5) - body(c5_bare), body(b4) - body(b4_bare), body(bb4) - body(bb4_bare), body(d4) - body(d4_bare),
              c5.level - c5_bare.level, b4.level - b4_bare.level, bb4.level - bb4_bare.level, d4.level - d4_bare.level);
  EXPECT(body(b4) - body(b4_bare) < body(c5) - body(c5_bare) - 0.5, "B4 is thinner than C5");
  EXPECT(b4.level < c5.level - 0.5, "B4 is smaller than C5");
  EXPECT(body(bb4) - body(bb4_bare) < body(b4) - body(b4_bare) - 1.0, "B flat 4, lipped further, is thinner still");
  EXPECT_NEAR(body(d4) - body(d4_bare), 0.0, 0.1, "lipping down does not thin");

  // The F crook puts the shadows elsewhere.
  auto covering = [](int crook, float midi) {
    plain(device);
    device.set_param(kCrook, static_cast<float>(crook));
    play(device, midi, 0.2f);
    return device.meter(0);
  };
  for (float midi : {65.0f, 69.0f}) {
    EXPECT(covering(kC, midi) > 0.4f && covering(kF, midi) == 0.0f, "F and A are stopped on C and open on F");
  }
  for (float midi : {70.0f, 74.0f}) {
    EXPECT(covering(kC, midi) == 0.0f && covering(kF, midi) > 0.4f, "B flat and D are open on C and stopped on F");
  }
  // Level is in proportion to loudness: Lip.
  auto open_with = [](float lip) {
    plain(device);
    device.set_param(kLip, lip);
    play(device, 68.0f, 0.2f);
    return device.meter(0) == 0.0f;
  };
  EXPECT(!open_with(40.0f) && open_with(41.0f), "Lip over 40 cents takes A flat 4 open from the 13th");
  auto open_count = [](float lip) {
    int open = 0;
    for (int midi = 48; midi < 73; ++midi) open += ask(100.0f * static_cast<float>(midi - 24), 0.0f, lip).open;
    return open;
  };
  std::printf("  open keys of 25 from C3 on the C crook at Lip 5, 15, 30, 45, 60: %d %d %d %d %d\n", open_count(5),
              open_count(15), open_count(30), open_count(45), open_count(60));
}

// --- the slide -----------------------------------------------------------------------------

// The pitch of a harmonic sound every 10 ms, in cents over C1: the first lag
// of the autocorrelation over 60 ms that is nearly the best.
std::vector<double> pitch_track(const std::vector<float>& x, double low_hz, double high_hz, double rate) {
  std::vector<double> track;
  const int window = static_cast<int>(0.06 * rate), hop = static_cast<int>(0.01 * rate);
  const int shortest = static_cast<int>(rate / high_hz), longest = static_cast<int>(rate / low_hz);
  for (size_t start = 0; start + static_cast<size_t>(window + longest + 1) < x.size(); start += static_cast<size_t>(hop)) {
    std::vector<double> match(static_cast<size_t>(longest) + 2, 0.0);
    double best = 0.0;
    for (int lag = shortest - 1; lag <= longest + 1; ++lag) {
      double ab = 0.0, aa = 1.0e-12, bb = 1.0e-12;
      for (int i = 0; i < window; i += 2) {
        const double a = x[start + static_cast<size_t>(i)], b = x[start + static_cast<size_t>(i + lag)];
        ab += a * b;
        aa += a * a;
        bb += b * b;
      }
      match[static_cast<size_t>(lag)] = ab / std::sqrt(aa * bb);
      best = std::max(best, match[static_cast<size_t>(lag)]);
    }
    for (int lag = shortest; lag <= longest; ++lag) {
      const double m = match[static_cast<size_t>(lag)], l = match[static_cast<size_t>(lag - 1)],
                   r = match[static_cast<size_t>(lag + 1)];
      if (m < 0.97 * best || m < l || m < r) continue;
      const double bend = l - 2.0 * m + r;
      const double at_lag = lag + (bend < 0.0 ? 0.5 * (l - r) / bend : 0.0);
      track.push_back(1200.0 * std::log2(rate / at_lag / 32.703196));
      break;
    }
  }
  return track;
}

// Stretches of 70 ms or more within 12 cents of where they began.
std::vector<double> plateaus(const std::vector<double>& track, int least = 7) {
  std::vector<double> found;
  size_t i = 0;
  while (i < track.size()) {
    size_t end = i + 1;
    double sum = track[i];
    while (end < track.size() && std::fabs(track[end] - sum / static_cast<double>(end - i)) < 12.0) sum += track[end++];
    if (static_cast<int>(end - i) >= least) {
      found.push_back(sum / static_cast<double>(end - i));
      i = end;
    } else {
      ++i;
    }
  }
  return found;
}

void test_slide() {
  // A tenth and more, C3 (the 4th partial) to E5 is far; C3 to E4 (the 10th,
  // lipped) is a tenth: the rungs are 5 6 7 8 9, one after the other.
  for (int way = 0; way < 2; ++way) {
    plain(device);
    device.set_param(kPlay, kSolo);
    device.set_param(kSlide, 2.0f);
    device.note_on(1, key(way == 0 ? 48.0f : 64.0f), 0.7f);
    render(device, 1.0f, kRate);
    device.note_on(2, key(way == 0 ? 64.0f : 48.0f), 0.7f);
    const Stereo out = render(device, 2.6f, kRate);
    const std::vector<double> found = plateaus(pitch_track(out.left, 110.0, 400.0, kRate));
    std::printf("  slide of a tenth, %s:", way == 0 ? "up" : "down");
    for (double f : found) std::printf(" %.0f", f);
    std::printf("\n");
    int next = way == 0 ? 5 : 9;
    size_t place = 0;
    int passed = 0;
    for (; next >= 5 && next <= 9; next += way == 0 ? 1 : -1) {
      while (place < found.size() && std::fabs(found[place] - rung(next)) > 14.0) ++place;
      if (place < found.size()) ++passed;
    }
    EXPECT(passed == 5, "a slide of a tenth rests on each of the five partials between, in order");
    EXPECT(found.size() >= 6 && found.size() <= 8, "and on nothing else but its ends");
    EXPECT_NEAR(found.back(), way == 0 ? 4000.0 : 2400.0, 6.0, "and ends on the key");
    EXPECT_NEAR(cents_off(out.left, key(way == 0 ? 64.0f : 48.0f), kRate, at(2.1), at(2.6)), 0.0, 1.0,
                "the slide ends in tune when its time is up");
  }
  // It rests: on each rung for most of its share of the time, with the hand
  // open on rungs between two stopped keys; and a key let go underneath a
  // slide under way does not begin it again.
  plain(device);
  device.set_param(kPlay, kSolo);
  device.set_param(kSlide, 2.0f);
  device.note_on(1, key(48.0f), 0.7f);
  render(device, 1.0f, kRate);
  device.note_on(2, key(64.0f), 0.7f);
  double rest[10] = {};
  for (int i = 0; i < 420; ++i) {
    if (i == 300) device.note_off(1);
    render(device, 0.005f, kRate);
    for (int n = 5; n <= 9; ++n) {
      if (std::fabs(1200.0 * std::log2(device.meter(2)) - rung(n)) < 3.0) rest[n] += 0.005;
    }
  }
  std::printf("  rests on the rungs: %.3f %.3f %.3f %.3f %.3f s\n", rest[5], rest[6], rest[7], rest[8], rest[9]);
  for (int n = 5; n <= 9; ++n) EXPECT(rest[n] > 0.2 && rest[n] < 0.35, "a slide rests on a rung");
  EXPECT_NEAR(1200.0 * std::log2(device.meter(2)), 4000.0, 3.0,
              "a key let go under a slide does not begin it again");
  // Lip slide 0 is a slur: there in 30 ms with no ladder.
  plain(device);
  device.set_param(kPlay, kSolo);
  device.set_param(kSlide, 0.0f);
  device.note_on(1, key(48.0f), 0.7f);
  render(device, 0.6f, kRate);
  device.note_on(2, key(64.0f), 0.7f);
  render(device, 0.03f, kRate);
  EXPECT_NEAR(device.meter(2), std::exp2(4000.0 / 1200.0), 0.03, "Lip slide 0 is there at once");
  // The time is the knob's: half way through a slide the place is under way,
  // at five settings.
  for (float seconds : {0.2f, 0.8f, 1.5f, 2.2f, 3.0f}) {
    plain(device);
    device.set_param(kPlay, kSolo);
    device.set_param(kSlide, seconds);
    device.note_on(1, key(48.0f), 0.7f);
    render(device, 0.6f, kRate);
    device.note_on(2, key(72.0f), 0.7f);
    double took = 0.0;
    while (took < 4.0 && device.meter(2) < 15.9) {
      render(device, 0.005f, kRate);
      took += 0.005;
    }
    std::printf("  Lip slide %.1f s arrives after %.3f s\n", seconds, took);
    EXPECT_NEAR(took, seconds, 0.05, "a slide takes its time");
  }
  // On a stopped key the hand opens for the rungs and closes at the end.
  plain(device);
  device.set_param(kPlay, kSolo);
  device.set_param(kSlide, 1.0f);
  device.note_on(1, key(65.0f), 0.7f);
  render(device, 0.5f, kRate);
  const float before = device.meter(0);
  device.note_on(2, key(69.0f), 0.7f);
  float least = 1.0f;
  double open_for = 0.0;
  for (int i = 0; i < 100; ++i) {
    render(device, 0.01f, kRate);
    least = std::min(least, device.meter(0));
    if (device.meter(0) < 0.01f) open_for += 0.01;
  }
  render(device, 0.1f, kRate);
  EXPECT(before > 0.4f && least < 0.01f && device.meter(0) > 0.55f, "the hand opens on the rungs of a slide");
  std::printf("  the hand is open for %.2f s of a slide of 1 s\n", open_for);
  EXPECT(open_for > 0.4 && open_for < 0.9, "and stays open while it rests on them");
}

// --- one horn ------------------------------------------------------------------------------

double level_of(const Stereo& s, double midi, size_t from, size_t to) {
  return db(tone_level(s.left, key(static_cast<float>(midi)), kRate, from, to));
}

void test_solo() {
  plain(device);
  device.set_param(kPlay, kSolo);
  device.set_param(kSlide, 0.1f);
  device.note_on(1, key(60.0f), 0.7f);
  render(device, 0.6f, kRate);
  device.note_on(2, key(67.0f), 0.7f);
  render(device, 0.4f, kRate);
  Stereo up = render(device, 0.6f, kRate);
  EXPECT_NEAR(cents_off(up.left, key(67.0f), kRate, 0, at(0.6)), 0.0, 1.0, "the last key wins");
  EXPECT(level_of(up, 60.0, 0, at(0.6)) < level_of(up, 67.0, 0, at(0.6)) - 50.0, "Solo is one horn");
  device.note_off(2);
  render(device, 0.4f, kRate);
  Stereo back = render(device, 0.6f, kRate);
  EXPECT_NEAR(cents_off(back.left, key(60.0f), kRate, 0, at(0.6)), 0.0, 1.0, "let go, the held key is back");
  EXPECT_NEAR(db(rms(back.left)), db(rms(up.left)), 2.0, "and as loud");
  // A key let go underneath does nothing.
  device.note_on(3, key(64.0f), 0.7f);
  render(device, 0.4f, kRate);
  device.note_off(1);
  Stereo still = render(device, 0.4f, kRate);
  EXPECT_NEAR(cents_off(still.left, key(64.0f), kRate, 0, at(0.4)), 0.0, 1.0, "a key let go underneath does nothing");
  device.note_off(3);
  render(device, 2.5f, kRate);
  EXPECT(both_peak(render(device, 0.3f, kRate)) == 0.0, "Solo falls silent with its last key");
  // The same id to another pitch and back is one key.
  for (int i = 0; i < 3; ++i) {
    device.note_on(7, key(60.0f + 4.0f * static_cast<float>(i % 2)), 0.7f);
    render(device, 0.02f, kRate);
  }
  device.note_off(7);
  render(device, 2.5f, kRate);
  EXPECT(both_peak(render(device, 0.3f, kRate)) == 0.0, "Solo: an id at A, B and A again is one key");
  // Forty keys, all let go, newest first and oldest first.
  for (int order = 0; order < 2; ++order) {
    for (int i = 0; i < 40; ++i) {
      device.note_on(100 + i, key(48.0f + static_cast<float>(i % 24)), 0.7f);
      render(device, 0.01f, kRate);
    }
    for (int i = 0; i < 40; ++i) device.note_off(100 + (order == 0 ? i : 39 - i));
    render(device, 2.5f, kRate);
    EXPECT(both_peak(render(device, 0.3f, kRate)) == 0.0, "Solo: a pile of keys drains");
  }
  // Solo and Chords change places under held keys and nothing hangs.
  for (int start = 0; start < 2; ++start) {
    plain(device);
    device.set_param(kPlay, static_cast<float>(start));
    for (int i = 0; i < 4; ++i) device.note_on(i, key(55.0f + 3.0f * static_cast<float>(i)), 0.7f);
    render(device, 0.4f, kRate);
    device.set_param(kPlay, static_cast<float>(1 - start));
    render(device, 0.3f, kRate);
    Stereo after = render(device, 0.4f, kRate);
    EXPECT(level_of(after, 64.0, 0, at(0.4)) > -60.0, "Play changes and the newest key is still there");
    for (int i = 0; i < 4; ++i) device.note_off(i);
    render(device, 2.5f, kRate);
    EXPECT(both_peak(render(device, 0.3f, kRate)) == 0.0, "Play changed under keys leaves none hanging");
  }
}

// --- keys that go wrong --------------------------------------------------------------------

void test_keys() {
  auto silent_after = [](double seconds) {
    render(device, static_cast<float>(seconds), kRate);
    return both_peak(render(device, 0.3f, kRate)) == 0.0;
  };
  // A, B, A under one id, then one note off: 10 ms apart, let go between
  // under a long Release, and through a full pool.
  plain(device);
  for (float midi : {60.0f, 64.0f, 60.0f}) {
    device.note_on(5, key(midi), 0.8f);
    render(device, 0.01f, kRate);
  }
  device.note_off(5);
  EXPECT(silent_after(2.5), "an id at A, B, A again has one held voice");
  plain(device);
  device.set_param(kRelease, 2.0f);
  device.note_on(5, key(60.0f), 0.8f);
  render(device, 0.5f, kRate);
  device.note_off(5);
  render(device, 0.3f, kRate);
  device.note_on(5, key(64.0f), 0.8f);
  render(device, 0.5f, kRate);
  device.note_on(5, key(60.0f), 0.8f);
  render(device, 0.5f, kRate);
  device.note_off(5);
  EXPECT(silent_after(8.0), "A let go, B, A again: one note off ends it");
  plain(device);
  for (int i = 0; i < 6; ++i) device.note_on(10 + i, key(40.0f + 5.0f * static_cast<float>(i)), 0.8f);
  render(device, 3.0f, kRate);
  for (float midi : {72.0f, 76.0f, 72.0f}) {
    device.note_on(5, key(midi), 0.8f);
    device.process(16);
  }
  for (int i = 0; i < 6; ++i) device.note_off(10 + i);
  device.note_off(5);
  EXPECT(silent_after(3.0), "A, B, A through a full pool leaves nothing held");
  // A key struck twice inside a steal's fade, with every level tied.
  plain(device);
  for (int i = 0; i < 6; ++i) device.note_on(10 + i, key(40.0f + 5.0f * static_cast<float>(i)), 0.8f);
  render(device, 3.0f, kRate);
  device.note_on(5, key(79.0f), 0.8f);
  device.note_on(5, key(79.0f), 0.8f);
  Stereo twice = render(device, 1.0f, kRate);
  EXPECT(level_of(twice, 45.0, at(0.3), at(1.0)) > -45.0, "a key struck twice takes one voice");
  for (int i = 0; i < 6; ++i) device.note_off(10 + i);
  device.note_off(5);
  EXPECT(silent_after(3.0), "and leaves nothing held");
  // Two keys in one block over a full pool: both are heard.
  plain(device);
  for (int i = 0; i < 6; ++i) device.note_on(10 + i, key(40.0f + 5.0f * static_cast<float>(i)), 0.8f);
  render(device, 1.0f, kRate);
  device.note_on(30, key(79.0f), 0.8f);
  device.note_on(31, key(84.5f), 0.8f);
  Stereo two = render(device, 1.0f, kRate);
  std::printf("  two over a full pool: %.1f and %.1f dB\n", level_of(two, 79.0, at(0.4), at(1.0)),
              level_of(two, 84.5, at(0.4), at(1.0)));
  EXPECT(level_of(two, 79.0, at(0.4), at(1.0)) > -35.0 && level_of(two, 84.5, at(0.4), at(1.0)) > -35.0,
         "two keys in one block over a full pool both sound");

  // One id at another key with no note off between: the first key stops.
  plain(device);
  device.note_on(5, key(60.0f), 0.8f);
  render(device, 0.5f, kRate);
  device.note_on(5, key(67.0f), 0.8f);
  render(device, 0.5f, kRate);
  Stereo moved = render(device, 0.6f, kRate);
  EXPECT(level_of(moved, 60.0, 0, at(0.6)) < level_of(moved, 67.0, 0, at(0.6)) - 50.0, "one id is one key");

  // Two ids on one key are one horn: no louder, no quieter, and the older
  // carries on when the newer is let go.
  for (int trial = 0; trial < 6; ++trial) {
    plain(device);
    device.set_param(kCrook, kC);
    device.note_on(1, key(60.0f), 0.7f);
    Stereo one = render(device, 0.71f + 0.013f * static_cast<float>(trial), kRate);
    device.note_on(2, key(60.0f), 0.7f);
    render(device, 0.4f, kRate);
    Stereo both = render(device, 0.4f, kRate);
    device.note_off(2);
    render(device, 0.4f, kRate);
    Stereo left = render(device, 0.4f, kRate);
    EXPECT_NEAR(db(rms(both.left)), db(rms(one.left, at(0.4))), 0.6, "two ids on one key are as loud as one");
    EXPECT_NEAR(db(rms(left.left)), db(rms(one.left, at(0.4))), 0.6, "the older id carries on");
    device.note_off(1);
    EXPECT(silent_after(3.0), "and ends with its own note off");
  }
  // And so are two keys fallen to one partial at Hand 0.
  plain(device);
  device.set_param(kHand, 0.0f);
  device.note_on(1, key(65.0f), 0.7f);
  render(device, 0.4f, kRate);
  Stereo f = render(device, 0.4f, kRate);
  device.note_on(2, key(66.0f), 0.7f);
  render(device, 0.4f, kRate);
  Stereo fs = render(device, 2.0f, kRate);
  EXPECT_NEAR(db(rms(fs.left)), db(rms(f.left)), 0.6, "two keys on one partial are one horn");
  // Hand brought up moves them apart and both are heard.
  device.set_param(kHand, 1.0f);
  render(device, 0.4f, kRate);
  Stereo apart = render(device, 0.8f, kRate);
  EXPECT(level_of(apart, 65.0, 0, at(0.8)) > -50.0 && level_of(apart, 66.0, 0, at(0.8)) > -50.0,
         "Hand up and each key is its own horn again");
  // Full pool on one pitch at full gain is one note.
  plain(device);
  for (int i = 0; i < 6; ++i) device.note_on(i, key(48.0f), 1.0f);
  Stereo pile = render(device, 3.0f, kRate);
  device.init(kRate);
  plain(device);
  device.note_on(1, key(48.0f), 1.0f);
  Stereo single = render(device, 3.0f, kRate);
  EXPECT(both_peak(pile) < 1.5 * both_peak(single), "six ids on one pitch do not add up");
  // The same key struck 60 times while it rings does not grow.
  plain(device);
  device.set_param(kRelease, 5.0f);
  double worst = 0.0;
  for (int i = 0; i < 60; ++i) {
    device.note_on(200 + i, key(48.0f), 1.0f);
    worst = std::max(worst, both_peak(render(device, 0.06f, kRate)));
    device.note_off(200 + i);
  }
  EXPECT(worst < 1.6 * both_peak(single), "a key struck again and again does not grow");

  // No ducking: C4 is as loud with five other keys down.
  plain(device);
  device.note_on(1, key(60.0f), 0.7f);
  render(device, 0.6f, kRate);
  Stereo lone = render(device, 0.6f, kRate);
  for (int i = 0; i < 5; ++i) device.note_on(2 + i, key(61.7f + 2.3f * static_cast<float>(i)), 1.0f);
  render(device, 0.6f, kRate);
  Stereo among = render(device, 0.6f, kRate);
  EXPECT_NEAR(level_of(among, 60.0, 0, at(0.6)), level_of(lone, 60.0, 0, at(0.6)), 0.2, "a held key does not duck");
  // Bad notes.
  plain(device);
  device.note_on(1, std::nanf(""), 0.7f);
  EXPECT(both_peak(render(device, 0.2f, kRate)) == 0.0, "a NaN pitch is not played");
  device.note_on(2, INFINITY, INFINITY);
  device.note_on(3, -5.0f, -3.0f);
  device.note_on(4, 1.0e30f, std::nanf(""));
  Stereo odd = render(device, 0.5f, kRate);
  EXPECT(finite(odd.left) && finite(odd.right) && both_peak(odd) < 1.0, "absurd notes are survived");
  for (int i = 1; i < 5; ++i) device.note_off(i);
  EXPECT(silent_after(3.0), "and end");
}

// --- headroom ------------------------------------------------------------------------------

void test_headroom() {
  // Six keys at full gain at the defaults, on chords low and high, from
  // several starting phases: the sound into the clip is read 30 dB down.
  const float chords[][6] = {{36, 43, 48, 52, 55, 60}, {60, 64, 67, 72, 76, 79}, {24, 31, 36, 40, 43, 48},
                             {50, 57, 65, 72, 76, 81}, {24, 36, 48, 60, 72, 84}, {48, 52, 55, 60, 64, 67},
                             {36, 48, 55, 60, 64, 67}, {41, 48, 53, 57, 60, 65}, {36, 40, 43, 46, 48, 50}};
  double worst = 0.0;
  for (const auto& chord : chords) {
    for (int start = 0; start < 4; ++start) {
      device.init(kRate);
      device.set_param(kVolume, kParamDefault[kVolume] - 30.0f);
      for (int i = 0; i < start; ++i) {
        device.note_on(90, key(60.0f), 0.5f);
        device.note_off(90);
        render(device, 1.5f, kRate);
      }
      for (int i = 0; i < 6; ++i) device.note_on(i, key(chord[i]), 1.0f);
      worst = std::max(worst, both_peak(render(device, 6.0f, kRate)) * std::pow(10.0, 1.5));
    }
  }
  std::printf("  six keys at full gain at the defaults: %.3f into the clip (knee 0.5)\n", worst);
  EXPECT(worst < 0.5, "a full pool stays under the knee at the default patch");
  // Volume at the top under a full pool at full blow is held by the clip.
  device.init(kRate);
  device.set_param(kVolume, kParamMax[kVolume]);
  device.set_param(kBlow, 1.0f);
  for (int i = 0; i < 6; ++i) device.note_on(i, key(chords[0][i]), 1.0f);
  const double clipped = both_peak(render(device, 3.0f, kRate));
  std::printf("  the same at full Volume: %.3f out of the clip\n", clipped);
  EXPECT(clipped > 0.7 && clipped <= 1.0, "the clip holds a full pool at full Volume");
  // One note's level.
  double quietest = 0.0, loudest = -100.0;
  for (int midi = 36; midi <= 84; ++midi) {
    device.init(kRate);
    const double p = db(both_peak(play(device, static_cast<float>(midi), 1.0f)));
    quietest = std::min(quietest, p);
    loudest = std::max(loudest, p);
  }
  std::printf("  one key at gain 0.7, C2 to C6: peaks %.1f to %.1f dBFS\n", quietest, loudest);
  EXPECT(loudest < -10.0 && loudest > -24.0, "one note is in the range an instrument has");
}

// --- rates, blocks and sleep ---------------------------------------------------------------

void test_rates() {
  struct Reading {
    Tone open, stopped;
    double air;
  };
  Reading at_rate[4];
  const float rates[] = {44100.0f, 48000.0f, 96000.0f, 192000.0f};
  for (int r = 0; r < 4; ++r) {
    const float rate = rates[r];
    for (int which = 0; which < 2; ++which) {
      plain(device, rate);
      const float midi = which == 0 ? 67.0f : 66.0f;
      const Stereo out = play(device, midi, 1.2f, 0.7f, rate);
      (which == 0 ? at_rate[r].open : at_rate[r].stopped) =
          tone(out.left, key(midi), rate, at(0.5, rate), at(1.2, rate));
    }
    plain(device, rate);
    const Stereo without = play(device, 67.0f, 1.5f, 0.7f, rate);
    plain(device, rate);
    device.set_param(kBreath, 1.0f);
    const Stereo with = play(device, 67.0f, 1.5f, 0.7f, rate);
    std::vector<float> air(with.left.size());
    for (size_t i = 0; i < air.size(); ++i) air[i] = with.left[i] - without.left[i];
    at_rate[r].air = db(rms(air, at(0.5, rate)));
    std::printf("  %.1f kHz: open %.2f dB %.0f Hz, stopped %.2f dB %.0f Hz, breath %.2f dB\n", rate / 1000.0,
                at_rate[r].open.level, at_rate[r].open.centroid, at_rate[r].stopped.level,
                at_rate[r].stopped.centroid, at_rate[r].air);
  }
  for (int r = 0; r < 4; ++r) {
    EXPECT_NEAR(at_rate[r].open.level, at_rate[1].open.level, 0.2, "the level does not move with the rate");
    EXPECT_NEAR(at_rate[r].stopped.level, at_rate[1].stopped.level, 0.2, "nor a stopped note's");
    EXPECT_NEAR(at_rate[r].open.centroid, at_rate[1].open.centroid, 15.0, "nor the colour");
    EXPECT_NEAR(at_rate[r].air, at_rate[1].air, 0.6, "nor the breath");
  }
  // Nor where the answers of Distance are: what follows a short note.
  double answers[3][4] = {};
  for (int r = 0; r < 4; ++r) {
    const float rate = rates[r];
    plain(device, rate);
    device.set_param(kDistance, 1.0f);
    device.set_param(kRelease, 0.005f);
    device.note_on(1, key(60.0f), 0.8f);
    render(device, 0.6f, rate);
    device.note_off(1);
    const Stereo tail = render(device, 0.4f, rate);
    for (int part = 0; part < 3; ++part) {
      answers[part][r] = db(rms(tail.left, at(0.05 + 0.02 * part, rate), at(0.07 + 0.02 * part, rate)));
    }
    std::printf("  %.1f kHz: answers %.1f %.1f %.1f dB\n", rate / 1000.0, answers[0][r], answers[1][r], answers[2][r]);
  }
  for (int part = 0; part < 3; ++part) {
    for (int r = 0; r < 4; ++r) EXPECT_NEAR(answers[part][r], answers[part][1], 1.5, "nor the answers of Distance");
  }
}

Stereo phrase(int block_kind, double gap, int play_mode) {
  static const int kSizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  device.init(kRate);
  device.set_param(kPlay, static_cast<float>(play_mode));
  device.set_param(kRelease, 0.05f);
  device.set_param(kAttack, 0.02f);
  device.set_param(kDistance, 0.4f);
  device.set_param(kTremble, 0.4f);
  device.set_param(kRip, 0.6f);
  struct Event {
    size_t when;
    int kind;
  };
  const size_t second = at(0.6 + gap);
  const std::vector<Event> events = {{0, 0},           {at(0.1), 1},         {at(0.3), 2},          {at(0.35), 3},
                                     {second - 200, 4}, {second, 5},          {second + at(0.15), 6}, {second + at(0.3), 7}};
  const size_t total = second + at(0.6);
  Stereo out;
  size_t done = 0, next = 0;
  int which = 0;
  while (done < total) {
    while (next < events.size() && events[next].when == done) {
      switch (events[next++].kind) {
        case 0: device.note_on(1, key(57.0f), 0.8f); break;
        case 1: device.note_on(2, key(64.0f), 0.7f); break;
        case 2: device.note_off(2); break;
        case 3: device.note_off(1); break;
        case 4:
          device.set_param(kVolume, -12.0f);
          device.set_param(kShadow, 0.2f);
          device.set_param(kDistance, 0.1f);
          device.set_param(kHand, 0.7f);
          device.set_param(kSpread, 1.0f);
          device.set_param(kBreath, 0.8f);
          break;
        case 5: device.note_on(3, key(66.0f), 0.8f); break;
        case 6: device.note_on(4, key(70.0f), 0.8f); break;
        case 7: device.note_off(3); device.note_off(4); break;
      }
    }
    size_t until = next < events.size() ? events[next].when : total;
    const int size = block_kind > 0 ? block_kind : kSizes[which++ % 8];
    const int frames = static_cast<int>(std::min(static_cast<size_t>(size), until - done));
    device.process(frames);
    out.left.insert(out.left.end(), device.out_left(), device.out_left() + frames);
    out.right.insert(out.right.end(), device.out_right(), device.out_right() + frames);
    done += static_cast<size_t>(frames);
  }
  return out;
}

void test_blocks() {
  double worst = 0.0;
  for (int mode = 0; mode < 2; ++mode) {
    for (double gap : {0.0, 0.1, 0.18, 0.24, 0.28, 0.30, 0.32, 0.34, 0.36, 0.40, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 1.5}) {
      const Stereo reference = phrase(128, gap, mode);
      EXPECT(both_peak(reference, at(0.65 + gap)) > 0.005, "the second note sounds");
      for (int size : {1, 2048, 0}) worst = std::max(worst, worst_difference(reference, phrase(size, gap, mode)));
    }
  }
  std::printf("  blocks of 1, 128, 2048 and ragged across silences: %.2g apart\n", worst);
  EXPECT(worst < 1.0e-6, "the sound does not depend on the block size across a silence");
}

void test_sleep() {
  // Knobs moved in a silence are in place for the next note: the note is the
  // one a device set that way from the start plays. The second note's start
  // phase is the second of both.
  for (int id = 0; id < kNumParams; ++id) {
    const float to = kParamDefault[id] == kParamMax[id] ? kParamMin[id] : kParamMax[id];
    Stereo heard[2];
    for (int early = 0; early < 2; ++early) {
      device.init(kRate);
      if (early) device.set_param(id, to);
      device.note_on(1, key(65.0f), 0.0f);
      device.process(13);
      device.note_off(1);
      render(device, 8.0f, kRate);
      device.process(7);
      if (!early) device.set_param(id, to);
      device.note_on(2, key(66.0f), 0.8f);
      heard[early] = render(device, 0.5f, kRate);
    }
    // The drift of the pitch has run on by as long as the first note took,
    // which Attack and Release change: those are only held to their level.
    const double apart = worst_difference(heard[0], heard[1]);
    char label[100];
    std::snprintf(label, sizeof label, "param %d moved asleep is in place for the next note (%g apart)", id, apart);
    EXPECT(apart < (id == kRelease || id == kAttack ? 0.02 : 1.0e-6), label);
  }
}

// --- the breath, the rip, the tremble, the distance ------------------------------------------

void test_voice() {
  // Blow: brighter at five points, and no louder.
  double last = 0.0, level = 0.0;
  for (float blow : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    plain(device);
    device.set_param(kBlow, blow);
    const Tone t = tone(play(device, 60.0f, 1.2f).left, key(60.0f), kRate, at(0.5), at(1.2));
    std::printf("  Blow %.2f: %.0f Hz, %.2f dB\n", blow, t.centroid, t.level);
    EXPECT(t.centroid > last + 20.0, "Blow is brighter all the way");
    if (blow > 0.0f) EXPECT_NEAR(t.level, level, 0.5, "Blow is not a volume control");
    last = t.centroid;
    level = t.level;
  }
  // Harder keys are louder and brighter.
  const Tone soft = held_tone(60.0f, -1.0f, 0.2f), hard = held_tone(60.0f, -1.0f, 1.0f);
  EXPECT(hard.level > soft.level + 4.0 && hard.centroid > soft.centroid + 150.0, "a harder key is louder and brighter");
  // Inside a note the highs come after the lows.
  plain(device);
  device.set_param(kAttack, 0.5f);
  const Stereo swell = play(device, 60.0f, 2.0f);
  EXPECT(energy_above(swell.left, 900.0, kRate, at(0.12), at(0.22)) <
             0.8 * energy_above(swell.left, 900.0, kRate, at(1.5), at(2.0)),
         "a note opens up as it swells");
  // And it darkens as it is let go.
  plain(device);
  device.set_param(kRelease, 1.5f);
  play(device, 60.0f, 1.0f);
  device.note_off(1);
  const Stereo fading = render(device, 1.0f, kRate);
  const double early = tone(fading.left, key(60.0f), kRate, 0, at(0.08)).centroid;
  const double later = tone(fading.left, key(60.0f), kRate, at(0.4), at(0.5)).centroid;
  std::printf("  a note let go: %.0f Hz, then %.0f Hz\n", early, later);
  EXPECT(later < 0.7 * early, "a note darkens as it fades");
  // Attack and Release at five points.
  double before = 0.0;
  for (float attack : {0.005f, 0.03f, 0.15f, 0.7f, 3.0f}) {
    plain(device);
    device.set_param(kAttack, attack);
    const Stereo out = play(device, 60.0f, 4.0f);
    const double full = rms(out.left, at(3.6), at(4.0));
    double when = 0.0;
    while (when < 3.9 && rms(out.left, at(when), at(when + 0.01)) < 0.7 * full) when += 0.004;
    std::printf("  Attack %.3f s reaches its level after %.3f s\n", attack, when);
    EXPECT(when > before + 0.004, "Attack is longer all the way");
    before = when;
  }
  before = 0.0;
  for (float release : {0.03f, 0.2f, 0.8f, 2.0f, 5.0f}) {
    plain(device);
    device.set_param(kRelease, release);
    play(device, 60.0f, 1.0f);
    device.note_off(1);
    const Stereo out = render(device, 5.5f, kRate);
    const double full = rms(out.left, 0, at(0.005));
    double when = 0.0;
    while (when < 5.4 && rms(out.left, at(when), at(when + 0.01)) > 0.01 * full) when += 0.004;
    std::printf("  Release %.2f s: 40 dB down after %.3f s\n", release, when);
    EXPECT(when > before + 0.01, "Release is longer all the way");
    before = when;
  }
  // Breath at five points: more air each time, under the tone.
  before = -200.0;
  for (float breath : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    plain(device);
    device.set_param(kBreath, breath);
    const Stereo out = play(device, 60.0f, 1.5f);
    // Between the harmonics.
    double air = 0.0;
    for (double h = 2.5; h < 9.0; h += 1.0) air += rms(out.left) > 0.0 ? tone_level(out.left, h * key(60.0f), kRate, at(0.5), at(1.5)) : 0.0;
    std::printf("  Breath %.2f: %.1f dB between the harmonics\n", breath, db(air));
    EXPECT(db(air) > before + 2.0, "Breath is more air all the way");
    before = db(air);
  }

  // Rip: starts from the partial below and is at the key soon after, at five
  // points further each time. G4 is the 12th of C: under it is the 11th.
  before = 10.0;
  for (float rip : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    plain(device);
    device.set_param(kRip, rip);
    device.set_param(kAttack, 0.005f);
    device.note_on(1, key(67.0f), 0.8f);
    render(device, 0.03f, kRate);
    const double off = 1200.0 * std::log2(device.meter(2) / 12.0);
    render(device, 0.5f, kRate);
    Stereo out = render(device, 0.5f, kRate);
    std::printf("  Rip %.2f: %.0f cents from the 12th after 30 ms\n", rip, off);
    EXPECT(off < before - 8.0, "Rip scoops from lower all the way");
    if (rip == 1.0f) EXPECT_NEAR(off, rung(11) - rung(12), 12.0, "Rip at full starts on the partial below");
    EXPECT_NEAR(cents_off(out.left, key(67.0f), kRate, 0, at(0.5)), 0.0, 1.0, "a rip ends on the key");
    before = off;
  }

  // Tremble: pitch and colour move together, at the rate, deeper with depth.
  double last_range = -1.0;
  for (float tremble : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    plain(device);
    device.set_param(kTremble, tremble);
    device.set_param(kTrembleRate, 2.0f);
    play(device, 67.0f, 1.0f);
    std::vector<float> cents, covering;
    Stereo held;
    for (int i = 0; i < 400; ++i) {
      held = concat(held, render(device, 0.005f, kRate));
      cents.push_back(1200.0f * std::log2(device.meter(2) / 12.0f));
      covering.push_back(device.meter(0));
    }
    const double range = *std::max_element(cents.begin(), cents.end()) - *std::min_element(cents.begin(), cents.end());
    std::printf("  Tremble %.2f: %.1f cents end to end, covering to %.2f\n", tremble, range,
                *std::max_element(covering.begin(), covering.end()));
    EXPECT(range > last_range + 4.0 || tremble == 0.0f, "Tremble is deeper all the way");
    last_range = range;
    if (tremble == 1.0f) {
      EXPECT(together(cents, covering) < -0.95, "Tremble: pitch goes down as the hand closes");
      // In the sound too: the bright half of each turn is the sharp half.
      std::vector<float> high, low;
      for (size_t i = 0; i + 1200 < held.left.size(); i += 1200) {
        high.push_back(static_cast<float>(energy_above(held.left, 900.0, kRate, i, i + 1200)));
        low.push_back(static_cast<float>(cents[i / 240 + 2]));
      }
      std::printf("  Tremble: brightness against pitch %.2f\n", together(high, low));
      EXPECT(together(high, low) > 0.8, "Tremble: the sound is brightest when it is highest");
      // The rate, from the crossings of the meter over 2 s at 2 Hz.
      int crossings = 0;
      for (size_t i = 1; i < cents.size(); ++i) crossings += cents[i - 1] < 0.0f && cents[i] >= 0.0f;
      EXPECT(crossings >= 3 && crossings <= 5, "Tremble turns at Tremble rate");
    }
  }
  int turns = 0;
  for (float rate : {0.2f, 0.6f, 1.5f, 4.0f, 8.0f}) {
    plain(device);
    device.set_param(kTremble, 1.0f);
    device.set_param(kTrembleRate, rate);
    play(device, 67.0f, 1.0f);
    int crossings = 0;
    float last_place = device.meter(2);
    for (int i = 0; i < 2000; ++i) {
      render(device, 0.005f, kRate);
      crossings += last_place < 12.0f && device.meter(2) >= 12.0f;
      last_place = device.meter(2);
    }
    EXPECT(std::abs(crossings - static_cast<int>(10.0f * rate + 0.5f)) <= 1 && crossings > turns, "Tremble rate is in hertz");
    turns = crossings;
  }

  // Distance: softer and duller at five points. Spread: wider at five.
  before = 100.0;
  last = 1.0e9;
  for (float distance : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    device.init(kRate);
    device.set_param(kSpread, 0.0f);
    device.set_param(kDistance, distance);
    device.set_param(kShadow, 0.0f);
    device.set_param(kRelease, 0.03f);
    double power = 0.0, bright = 0.0;
    for (int i = 0; i < 25; ++i) {
      const float midi = 55.0f + static_cast<float>(i);
      device.note_on(1, key(midi), 0.7f);
      const Stereo out = render(device, 0.8f, kRate);
      device.note_off(1);
      render(device, 0.3f, kRate);
      const Tone t = tone(out.left, key(midi), kRate, at(0.4), at(0.8));
      power += std::pow(10.0, t.level / 10.0) / 25.0;
      bright += t.centroid / 25.0;
    }
    const double far = 10.0 * std::log10(power);
    std::printf("  Distance %.2f: %.1f dB, %.0f Hz\n", distance, far, bright);
    EXPECT(far < before - 0.3 && bright < last - (distance < 0.9f ? 30.0 : -2.0), "Distance is softer and duller all the way");
    before = far;
    last = bright;
  }
  before = 2.0;
  for (float spread : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    device.init(kRate);
    device.set_param(kSpread, spread);
    for (int i = 0; i < 5; ++i) device.note_on(i, key(48.0f + 7.0f * static_cast<float>(i)), 0.7f);
    const Stereo out = render(device, 1.5f, kRate);
    const double sides = correlation(out.left, out.right, at(0.5));
    std::printf("  Spread %.2f: the sides agree %.3f\n", spread, sides);
    EXPECT(spread == 0.0f ? sides > 0.999999 : sides < before - 0.01, "Spread is wider all the way");
    before = sides;
  }
}

void test_sweeps() {
  // Crook: the place of one key moves with the tube, the pitch does not.
  double before = 100.0;
  for (float crook : {0.0f, 2.0f, 5.0f, 8.0f, 10.0f}) {
    plain(device);
    device.set_param(kCrook, crook);
    const Stereo out = play(device, 60.0f, 1.0f);
    const double place = device.meter(2);
    std::printf("  Crook %g: C4 at %.2f, partial %.0f, covering %.2f\n", crook, place,
                static_cast<double>(device.meter(1)), static_cast<double>(device.meter(0)));
    EXPECT(place < before - 0.2, "Crook shortens the tube all the way");
    EXPECT_NEAR(cents_off(out.left, key(60.0f), kRate, at(0.5), at(1.0)), 0.0, 0.5, "and the key stays in tune");
    before = place;
  }
  // Hand: pitch and covering go together.
  double last = 1000.0, covered = -1.0;
  for (float hand : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    plain(device);
    device.set_param(kHand, hand);
    const Stereo out = play(device, 65.0f, 1.0f);
    const double off = cents_off(out.left, key(65.0f), kRate, at(0.5), at(1.0));
    std::printf("  Hand %.2f: F4 is %.1f cents off, covering %.3f\n", hand, off, static_cast<double>(device.meter(0)));
    EXPECT(off < last - 8.0 && device.meter(0) > covered + 0.05, "Hand brings a key to pitch and covers it, in step");
    last = off;
    covered = device.meter(0);
  }
  EXPECT_NEAR(last, 0.0, 0.5, "and at full it is in tune");
  // Volume is decibels.
  for (float volume : {-48.0f, -34.0f, -21.0f, -12.0f, -6.0f}) {
    plain(device);
    device.set_param(kVolume, volume);
    const double level = db(rms(play(device, 60.0f, 1.0f).left, at(0.5)));
    if (volume == -48.0f) before = level + 48.0;
    EXPECT_NEAR(level - volume, before, 0.1, "Volume is decibels");
  }
}

// --- no clicks -----------------------------------------------------------------------------

// The third difference: a band-limited tone leaves almost nothing in it, a
// jump leaves about its own size.
double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

template <typename Event>
double kink_of(Event event, float midi = 48.0f, float blow = 0.1f, int play_mode = kChords) {
  double worst = 0.0;
  for (int trial = 0; trial < 6; ++trial) {
    plain(device);
    device.set_param(kBlow, blow);
    device.set_param(kPlay, static_cast<float>(play_mode));
    for (int i = 0; i < (play_mode == kChords ? 6 : 1); ++i) device.note_on(i, key(midi + static_cast<float>(5 * i)), 0.6f);
    render(device, 1.0f + 0.0021f * static_cast<float>(trial), kRate);
    const Stereo steady = render(device, 0.2f, kRate);
    event(device);
    // Joined to what came before: a jump at the event is between the two.
    const Stereo after = concat(steady, render(device, 0.2f, kRate));
    worst = std::max(worst, kink(after.left, steady.size() - 3) / std::max(kink(steady.left), 1.0e-9));
  }
  return worst;
}

void test_clicks() {
  struct Row {
    const char* name;
    double worst, limit;
  };
  const Row rows[] = {
      {"steal", kink_of([](HandHorn& d) { d.note_on(20, key(50.0f), 0.6f); }), 4.0},
      {"restrike", kink_of([](HandHorn& d) { d.note_on(0, key(48.0f), 0.6f); }), 4.0},
      {"second id", kink_of([](HandHorn& d) { d.note_on(9, key(48.0f), 0.6f); }, 48.0f, 0.1f), 4.0},
      {"note off", kink_of([](HandHorn& d) { d.note_off(0); }), 2.0},
      {"Hand", kink_of([](HandHorn& d) { d.set_param(kHand, 0.0f); }), 3.0},
      {"Shadow", kink_of([](HandHorn& d) { d.set_param(kShadow, 0.0f); }), 3.0},
      {"Crook", kink_of([](HandHorn& d) { d.set_param(kCrook, kF); }), 3.0},
      {"Lip", kink_of([](HandHorn& d) { d.set_param(kLip, 60.0f); }), 3.0},
      {"Blow", kink_of([](HandHorn& d) { d.set_param(kBlow, 0.0f); }), 3.0},
      {"Distance", kink_of([](HandHorn& d) { d.set_param(kDistance, 1.0f); }), 3.0},
      {"Spread", kink_of([](HandHorn& d) { d.set_param(kSpread, 1.0f); }), 3.0},
      {"Volume", kink_of([](HandHorn& d) { d.set_param(kVolume, -40.0f); }), 8.0},
      {"Play", kink_of([](HandHorn& d) { d.set_param(kPlay, kSolo); }), 3.0},
      {"slide", kink_of([](HandHorn& d) { d.note_on(9, key(60.0f), 0.6f); }, 48.0f, 0.1f, kSolo), 6.0},
  };
  for (const Row& row : rows) {
    std::printf("  kink of %s: %.2f of the steady sound\n", row.name, row.worst);
    char label[80];
    std::snprintf(label, sizeof label, "%s does not click", row.name);
    EXPECT(row.worst < row.limit, label);
  }
}

void test_aliasing() {
  // Full brightness at the top: what is not on a harmonic.
  for (float midi : {84.0f, 91.0f, 96.0f}) {
    plain(device);
    device.set_param(kBlow, 1.0f);
    device.set_param(kVolume, -12.0f);
    const Stereo out = play(device, midi, 1.5f, 1.0f);
    const double hz = key(midi);
    double folded = 0.0;
    for (int h = 1; h < 60; ++h) {
      double f = std::fmod(h * hz, static_cast<double>(kRate));
      if (f > kRate / 2) f = kRate - f;
      if (h * hz < kRate / 2 || f < 100.0) continue;
      const double near = std::fabs(f / hz - std::round(f / hz)) * hz;
      if (near < 40.0) continue;
      folded = std::max(folded, tone_level(out.left, f, kRate, at(0.5), at(1.5)));
    }
    const double down = db(folded) - db(tone_level(out.left, hz, kRate, at(0.5), at(1.5)));
    std::printf("  folded at key %g: %.1f dB\n", midi, down);
    EXPECT(down < -60.0, "what folds is 60 dB down");
  }
}

void test_meters() {
  device.init(kRate);
  for (int m = 0; m < 4; ++m) EXPECT(device.meter(m) == 0.0f, "meters rest at zero");
  device.note_on(1, key(65.0f), 0.8f);
  render(device, 0.5f, kRate);
  EXPECT_NEAR(device.meter(0), 51.3 / 120.0, 0.005, "the covering meter");
  EXPECT(device.meter(1) == 11.0f, "the partial meter");
  EXPECT_NEAR(device.meter(2), std::exp2(4100.0 / 1200.0), 0.01, "the place meter");
  EXPECT(device.meter(3) > 0.5f && device.meter(3) <= 1.0f, "the level meter");
  // A newer note let go leaves the older held one on the display.
  device.note_on(2, key(60.0f), 0.8f);
  render(device, 0.1f, kRate);
  EXPECT(device.meter(1) == 8.0f, "the meters show the newest note");
  device.note_off(2);
  render(device, 0.05f, kRate);
  EXPECT(device.meter(1) == 11.0f, "and the held one once that is let go");
  device.init(kRate);
  device.note_on(1, key(65.0f), 0.8f);
  render(device, 0.5f, kRate);
  // Reading the meters changes nothing.
  Stereo quiet = render(device, 0.2f, kRate);
  other.init(kRate);
  other.note_on(1, key(65.0f), 0.8f);
  Stereo read;
  for (int i = 0; i < 263; ++i) {
    read = concat(read, render(other, 128.0f / kRate + 1.0e-6f, kRate));
    for (int m = -1; m < 6; ++m) (void)other.meter(m);
  }
  read.left.resize(at(0.7));
  std::vector<float> tail(read.left.begin() + static_cast<long>(at(0.5)), read.left.end());
  double worst = 0.0;
  for (size_t i = 0; i < tail.size() && i < quiet.left.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(tail[i]) - quiet.left[i]));
  EXPECT(worst < 1.0e-6, "a meter read does not touch the sound");
  device.note_off(1);
  render(device, 3.0f, kRate);
  for (int m = 0; m < 4; ++m) EXPECT(device.meter(m) == 0.0f, "meters rest again");
}

}  // namespace

int main() {
  Conformance spec;
  spec.name = "hand-horn";
  spec.num_params = kNumParams;
  spec.mins = kParamMin;
  spec.maxs = kParamMax;
  spec.defaults = kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  test_rule();
  test_pitch();
  test_shadow();
  test_slide();
  test_solo();
  test_keys();
  test_headroom();
  test_rates();
  test_blocks();
  test_sleep();
  test_voice();
  test_sweeps();
  test_clicks();
  test_aliasing();
  test_meters();
  device.init(kRate);
  for (int i = 0; i < 6; ++i) device.note_on(i, key(50.0f + 4.0f * static_cast<float>(i)), 0.8f);
  device.set_param(kTremble, 0.5f);
  report_cost("hand-horn, six horns", 5.0f, kRate, [] { render(device, 5.0f, kRate); });
  return finish("hand-horn");
}
