// Native harness for Feedback (cpp/devices/feedback). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest measures what makes it a string held by its
// own amplifier.

#include "../devices/feedback/feedback.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Feedback;
namespace p = livemix::feedback;

static Feedback device;

static const float kRate = 48000.0f;

// Every check prints the figure it found, pass or fail: nobody can listen
// here, and the report is written from these lines.
#define CHECK(condition, label)       \
  do {                                \
    std::printf("  %s\n", label);     \
    EXPECT(condition, label);        \
  } while (0)

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// A device with nothing wandering, so a measurement is the same every time.
static void still(Feedback& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWander, 0.0f);
}

static double level_db(const std::vector<float>& x, double from, double to, double rate = kRate) {
  return db(rms(x, at(from, rate), at(to, rate)));
}

// Level of harmonic `h` of `hz` over 100 ms from `from`. The window is short
// on purpose: a high overtone a cent or two off its harmonic still reads.
static double harmonic_db(const std::vector<float>& x, double hz, int h, double from, double rate = kRate) {
  return db(tone_level(x, hz * h, rate, at(from, rate), at(from + 0.1, rate)));
}

// The strongest of harmonics 1 to 8 over 100 ms from `from`, and how far
// (dB) it stands over the next strongest.
static int strongest(const std::vector<float>& x, double hz, double from, double* lead = nullptr,
                     double rate = kRate) {
  int best = 1;
  double top = -1.0e9, second = -1.0e9;
  for (int h = 1; h <= 8 && hz * h < 0.45 * rate; ++h) {
    const double level = harmonic_db(x, hz, h, from, rate);
    if (level > top) {
      second = top;
      top = level;
      best = h;
    } else if (level > second) {
      second = level;
    }
  }
  if (lead) *lead = top - second;
  return best;
}

// Cents by which the strongest component within a semitone and a half of
// `hz` is off it: a scan in 2-cent steps over sixteen periods or more finds
// it, then its phase over two windows of whole periods, short enough that 5
// cents cannot wrap, says where it is. (The phase alone, over a quarter of a
// second, wraps at 0.8 cents on the top note and read a note 40 cents out as
// in tune; the kit's own scan steps over a narrow peak.) `level` gets its
// level in dB.
static double cents_off(const std::vector<float>& x, double hz, double rate, double from, double* level = nullptr) {
  const double span = std::max(0.2, 16.0 / hz);
  double best = -1.0, best_cents = 0.0;
  for (int cents = -150; cents <= 150; cents += 2) {
    const double l = tone_level(x, hz * std::pow(2.0, cents / 1200.0), rate, at(from, rate), at(from + span, rate));
    if (l > best) {
      best = l;
      best_cents = cents;
    }
  }
  const double near = hz * std::pow(2.0, best_cents / 1200.0);
  const double seconds = std::min(0.5, 0.25 / (near * 0.003));
  const size_t start = at(from, rate);
  const size_t length = static_cast<size_t>(std::max(1.0, std::floor(seconds * near)) * rate / near);
  const double a = tone_phase(x, near, rate, start, start + length);
  const double b = tone_phase(x, near, rate, start + length, start + 2 * length);
  double turn = (b - a) / (2.0 * kPi);
  turn -= std::floor(turn + 0.5);
  if (level) *level = db(best);
  return best_cents + 1200.0 * std::log2(1.0 + turn * rate / (static_cast<double>(length) * near));
}

// How loud the note `hz` is inside a chord over [from, from + seconds): its
// first four harmonics together, in dB. The chords it is used on have no two
// such harmonics within 25 Hz of each other.
static double note_db(const std::vector<float>& x, double hz, double from, double seconds = 0.5) {
  double power = 0.0;
  for (int h = 1; h <= 4; ++h) {
    const double level = tone_level(x, hz * h, kRate, at(from), at(from + seconds));
    power += level * level;
  }
  return db(std::sqrt(power));
}

// The first time (s) the 50 ms level reaches `share` of the level at the end.
static double time_to_reach(const std::vector<float>& x, double share, double rate = kRate) {
  const double total = static_cast<double>(x.size()) / rate;
  const double steady = rms(x, at(total - 0.5, rate), x.size());
  for (double t = 0.0; t + 0.05 <= total; t += 0.05) {
    if (rms(x, at(t, rate), at(t + 0.05, rate)) >= share * steady) return t;
  }
  return total;
}

// How much of what an event changes is there at once: the same passage is
// rendered with the event and without it, and the largest difference in the
// first 8 samples is held against the largest over 20 ms. A smoothed change
// has covered a small part of its way by then; a step is all there. The
// worst of eight moments a few milliseconds apart, so a step cannot hide in
// a zero crossing.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const float lead = 3.0f + 0.0013f * static_cast<float>(trial);
    setup(device);
    render(device, lead, kRate);
    Stereo plain = render(device, 0.02f, kRate);
    setup(device);
    render(device, lead, kRate);
    event(device);
    Stereo moved = render(device, 0.02f, kRate);
    double first = 0.0, all = 0.0;
    for (size_t i = 0; i < plain.size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(moved.left[i]) - plain.left[i]),
                                         std::fabs(static_cast<double>(moved.right[i]) - plain.right[i]));
      if (i < 8) first = std::max(first, difference);
      all = std::max(all, difference);
    }
    if (all > 1.0e-6) worst = std::max(worst, first / all);
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "feedback";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // 1. Under the threshold a note is a plucked string: it dies, and Gain
  // only makes it die more slowly.
  {
    char label[160];
    double decay[2] = {0.0, 0.0};
    int which = 0;
    for (float gain : {0.0f, 0.42f}) {
      still(device);
      device.set_param(p::kGain, gain);
      device.note_on(1, 110.0f, 0.7f);
      Stereo out = render(device, 4.2f, kRate);
      const double early = level_db(out.left, 0.1, 0.3), late = level_db(out.left, 4.0, 4.2);
      std::snprintf(label, sizeof label, "Gain %.2f: a note is 30 dB down by 4 s (%.1f dB)", gain, late - early);
      CHECK(late - early < -30.0, label);
      decay[which++] = rt60(out.left, kRate, 0.3, 0.1, -80.0);
    }
    std::snprintf(label, sizeof label, "Gain under the threshold lengthens the ring (%.2f s to %.2f s)", decay[0], decay[1]);
    CHECK(decay[1] > 1.2 * decay[0], label);
  }

  // 2. Over it the note takes hold: the level at 8 s is the level at 4 s.
  {
    char label[160];
    for (float hz : {55.0f, 220.0f, 880.0f}) {
      still(device);
      device.set_param(p::kGain, 0.75f);
      device.note_on(1, hz, 0.7f);
      Stereo out = render(device, 8.5f, kRate);
      const double four = level_db(out.left, 4.0, 4.5), eight = level_db(out.left, 8.0, 8.5);
      std::snprintf(label, sizeof label, "Gain 0.75 at %.0f Hz: held (%.1f dB at 4 s, %.1f dB at 8 s)", hz, four, eight);
      CHECK(std::fabs(eight - four) < 3.0 && eight > -40.0, label);
    }
  }

  // 3. Distance picks the overtone that sings: by 10 dB over every other.
  {
    char label[160];
    // (Distance 1 on a low string is left out: its octave has the same
    // loss as the note and takes more than ten seconds to fall 10 dB under.)
    for (float hz : {82.4f, 220.0f}) {
      for (int distance : {hz < 100.0f ? 2 : 1, 3, 5}) {
        still(device);
        device.set_param(p::kDistance, static_cast<float>(distance));
        device.set_param(p::kGrit, 0.2f);
        device.note_on(1, hz, 0.7f);
        Stereo out = render(device, 6.0f, kRate);
        double lead = 0.0;
        const int best = strongest(out.left, hz, 5.5, &lead);
        std::snprintf(label, sizeof label, "Distance %d at %.0f Hz: harmonic %d is strongest, by %.1f dB", distance, hz, best, lead);
        CHECK(best == distance && lead > 10.0, label);
      }
    }
    // Between two overtones it is one of the two, never a third.
    still(device);
    device.set_param(p::kDistance, 2.5f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo between = render(device, 6.0f, kRate);
    const int best = strongest(between.left, 220.0, 5.5);
    std::snprintf(label, sizeof label, "Distance 2.5: harmonic %d sings", best);
    CHECK(best == 2 || best == 3, label);
  }

  // 4. Bloom is how long the feedback takes to open: the time to the held
  // level moves with it.
  {
    char label[160];
    double reached[3] = {0.0, 0.0, 0.0};
    int which = 0;
    for (float bloom : {0.05f, 1.0f, 6.0f}) {
      still(device);
      device.set_param(p::kBloom, bloom);
      device.set_param(p::kGain, 0.8f);
      device.set_param(p::kPick, 0.2f);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 10.0f, kRate);
      reached[which++] = time_to_reach(out.left, 0.7);
    }
    std::snprintf(label, sizeof label, "Bloom 0.05, 1 and 6 s: held level reached at %.2f, %.2f and %.2f s", reached[0],
                  reached[1], reached[2]);
    CHECK(reached[0] < 0.6 && reached[1] > reached[0] + 0.15 && reached[2] > reached[1] + 1.0 && reached[2] < 6.0, label);
  }

  // 5. Grit tears the tone: the odd overtones of the singing one come up
  // (and not the even ones), at the same loudness.
  {
    char label[160];
    double third[2], fifth[2], second[2], loud[2];
    int which = 0;
    for (float grit : {0.0f, 1.0f}) {
      still(device);
      device.set_param(p::kDistance, 1.0f);
      device.set_param(p::kGrit, grit);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 6.0f, kRate);
      const double first = harmonic_db(out.left, 220.0, 1, 5.5);
      second[which] = harmonic_db(out.left, 220.0, 2, 5.5) - first;
      third[which] = harmonic_db(out.left, 220.0, 3, 5.5) - first;
      fifth[which] = harmonic_db(out.left, 220.0, 5, 5.5) - first;
      loud[which++] = level_db(out.left, 5.0, 6.0);
    }
    std::snprintf(label, sizeof label, "Grit 0: third harmonic %.1f dB and fifth %.1f dB under the note", third[0], fifth[0]);
    CHECK(third[0] < -40.0 && fifth[0] < -40.0, label);
    std::snprintf(label, sizeof label, "Grit 1: third harmonic %.1f dB and fifth %.1f dB under the note, second %.1f dB",
                  third[1], fifth[1], second[1]);
    CHECK(third[1] > -14.0 && fifth[1] > -22.0 && second[1] < third[1] - 10.0, label);
    std::snprintf(label, sizeof label, "Grit keeps the level (%.1f dB clean, %.1f dB torn)", loud[0], loud[1]);
    CHECK(std::fabs(loud[0] - loud[1]) < 3.0, label);
  }

  // 6. Crowd. With every string on its own a second note is as loud as it
  // is alone; sharing all of one amplifier, the note that holds it keeps it,
  // the second waits under it, and comes through when the first lets go.
  {
    char label[160];
    for (float crowd : {0.0f, 1.0f}) {
      auto setup = [&] {
        still(device);
        device.set_param(p::kCrowd, crowd);
        device.set_param(p::kWidth, 0.0f);
        device.set_param(p::kRelease, 0.3f);
      };
      setup();
      device.note_on(2, 330.0f, 0.7f);
      Stereo solo = render(device, 6.0f, kRate);
      const double alone = harmonic_db(solo.left, 330.0, 2, 5.5);
      setup();
      device.note_on(1, 220.0f, 0.7f);
      render(device, 4.0f, kRate);
      device.note_on(2, 330.0f, 0.7f);
      Stereo both = render(device, 6.0f, kRate);
      const double beside = harmonic_db(both.left, 330.0, 2, 5.5);
      const double holder = harmonic_db(both.left, 220.0, 2, 5.5);
      if (crowd == 0.0f) {
        std::snprintf(label, sizeof label, "Crowd 0: a second note is %.1f dB against itself alone", beside - alone);
        CHECK(std::fabs(beside - alone) < 1.0, label);
      } else {
        std::snprintf(label, sizeof label, "Crowd 1: a second note waits %.1f dB under itself alone, the first holds at %.1f dB",
                      beside - alone, holder);
        CHECK(beside - alone < -6.0 && holder > alone - 3.0, label);
        device.note_off(1);
        Stereo after = render(device, 8.0f, kRate);
        const double through = harmonic_db(after.left, 330.0, 2, 7.5);
        std::snprintf(label, sizeof label, "Crowd 1: the first note let go, the second comes through (%.1f dB against alone)",
                      through - alone);
        CHECK(std::fabs(through - alone) < 2.0, label);
      }
    }
  }

  // 6b. The idea itself: a held chord of five is a leader and the others
  // under it, all heard, and the lead passes between them. Each note's level
  // is read every half second for half a minute. At the defaults the
  // quietest note is some way under the leader and never gone, and the lead
  // changes hands; with no Crowd there is no leader; with no Wander nothing
  // moves; and only at the very top of Crowd does one note have it all.
  {
    char label[200];
    const float chord[5] = {164.81f, 207.65f, 233.08f, 261.63f, 293.66f};
    struct Fight {
      double mean_gap, worst_gap;
      int changes, leaders;
    };
    auto fight = [&](float crowd, float wander) {
      device.init(kRate);
      device.set_param(p::kCrowd, crowd);
      device.set_param(p::kWander, wander);
      device.set_param(p::kWidth, 0.0f);
      for (int n = 0; n < 5; ++n) device.note_on(n, chord[n], 0.8f);
      Stereo out = render(device, 30.0f, kRate);
      Fight result = {0.0, 0.0, 0, 0};
      bool led[5] = {};
      int leader = -1, rows = 0;
      for (double t = 4.0; t + 0.5 <= 30.0; t += 0.5) {
        double level[5], top = -1.0e9, bottom = 1.0e9;
        int who = 0;
        for (int n = 0; n < 5; ++n) {
          level[n] = note_db(out.left, chord[n], t);
          if (level[n] > top) {
            top = level[n];
            who = n;
          }
          bottom = std::min(bottom, level[n]);
        }
        // A new leader is one that is a clear decibel over the last.
        if (leader < 0) leader = who;
        if (who != leader && level[who] > level[leader] + 1.0) {
          ++result.changes;
          leader = who;
        }
        if (!led[leader]) ++result.leaders;
        led[leader] = true;
        result.mean_gap += top - bottom;
        result.worst_gap = std::max(result.worst_gap, top - bottom);
        ++rows;
      }
      result.mean_gap /= rows;
      return result;
    };
    const Fight usual = fight(0.5f, 0.2f);
    std::snprintf(label, sizeof label,
                  "five held notes at the defaults: the quietest is %.1f dB under the leader on average, %.1f dB at the most; the lead "
                  "changes %d times in 26 s between %d notes",
                  usual.mean_gap, usual.worst_gap, usual.changes, usual.leaders);
    CHECK(usual.mean_gap > 4.0 && usual.mean_gap < 14.0 && usual.worst_gap < 20.0 && usual.changes >= 2 && usual.leaders >= 3, label);
    const Fight apart = fight(0.0f, 0.2f);
    std::snprintf(label, sizeof label, "five held notes at Crowd 0: the quietest is at most %.1f dB under the loudest", apart.worst_gap);
    CHECK(apart.worst_gap < 3.0, label);
    const Fight rest = fight(0.5f, 0.0f);
    std::snprintf(label, sizeof label, "five held notes with no Wander: at most %.1f dB apart, the lead changes %d times", rest.worst_gap,
                  rest.changes);
    CHECK(rest.worst_gap < 3.0 && rest.changes == 0, label);
    const Fight wild = fight(0.5f, 1.0f);
    std::snprintf(label, sizeof label,
                  "five held notes at Wander 1: the quietest is %.1f dB under the leader on average, the lead changes %d times",
                  wild.mean_gap, wild.changes);
    CHECK(wild.mean_gap > usual.mean_gap + 2.0 && wild.mean_gap < 30.0 && wild.changes >= 4, label);
    const Fight most = fight(0.9f, 0.2f);
    std::snprintf(label, sizeof label, "five held notes at Crowd 0.9: the quietest is %.1f dB under the leader on average", most.mean_gap);
    CHECK(most.mean_gap > usual.mean_gap + 2.0 && most.mean_gap < 30.0, label);
    const Fight all = fight(1.0f, 0.2f);
    std::snprintf(label, sizeof label, "five held notes at Crowd 1: one has it all, the quietest %.1f dB under it on average", all.mean_gap);
    CHECK(all.mean_gap > 30.0, label);
  }

  // 7. Pick 0: no pluck at all, and the note still starts by itself, out
  // of the amplifier's hum, inside two seconds at high Gain.
  {
    char label[160];
    still(device);
    device.set_param(p::kPick, 0.0f);
    device.set_param(p::kGain, 1.0f);
    device.set_param(p::kBloom, 0.3f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 6.0f, kRate);
    const double start = level_db(out.left, 0.0, 0.03), two = level_db(out.left, 1.9, 2.0), held = level_db(out.left, 5.5, 6.0);
    std::snprintf(label, sizeof label, "Pick 0, Gain 1: %.1f dB in the first 30 ms, %.1f dB at 2 s, %.1f dB held", start, two, held);
    CHECK(start < held - 40.0 && two > held - 3.0 && held > -40.0, label);

    still(device);
    device.set_param(p::kGain, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo picked = render(device, 0.1f, kRate);
    std::snprintf(label, sizeof label, "Pick 0.5: the pluck is heard at once (%.1f dB in the first 30 ms)",
                  level_db(picked.left, 0.0, 0.03));
    CHECK(level_db(picked.left, 0.0, 0.03) > -40.0, label);

    // Out of the hum a low note starts as surely as a high one: with no
    // pick and a Bloom of 1.2 s every note from 28 Hz to 4.2 kHz is at
    // -40 dBFS well inside the Bloom, and a key held for only 100 ms still
    // gives a small swell.
    double slowest = 0.0, faintest = 0.0;
    for (float hz : {28.0f, 41.2f, 220.0f, 1318.5f, 4186.0f}) {
      auto unpicked = [&] {
        still(device);
        device.set_param(p::kPick, 0.0f);
        device.set_param(p::kGain, 0.85f);
        device.set_param(p::kBloom, 1.2f);
        device.set_param(p::kRelease, 2.5f);
        device.note_on(1, hz, 0.8f);
      };
      unpicked();
      Stereo rise = render(device, 2.0f, kRate);
      double reached = 2.0;
      for (double t = 0.0; t < 1.99; t += 0.01) {
        if (std::max(peak(rise.left, at(t), at(t + 0.01)), peak(rise.right, at(t), at(t + 0.01))) >= 0.01) {
          reached = t;
          break;
        }
      }
      slowest = std::max(slowest, reached);
      unpicked();
      Stereo brief = render(device, 0.1f, kRate);
      device.note_off(1);
      brief = concat(brief, render(device, 3.0f, kRate));
      double loudest = -200.0;
      for (double t = 0.0; t + 0.4 <= 3.1; t += 0.05) loudest = std::max(loudest, level_db(brief.left, t, t + 0.4));
      faintest = std::min(faintest, loudest);
    }
    std::snprintf(label, sizeof label, "Pick 0, Bloom 1.2 s, 28 Hz to 4.2 kHz: -40 dBFS after %.2f s at the latest", slowest);
    CHECK(slowest < 0.6, label);
    std::snprintf(label, sizeof label, "Pick 0, a 100 ms key: its loudest 400 ms are %.1f dB at the least", faintest);
    CHECK(faintest > -50.0, label);
  }

  // 8. Wander: over half a minute the singing overtone changes; without it
  // the same overtone holds throughout, and the note stays through every
  // change (below, also just over the threshold and on a low string, where
  // it used to fall 30 dB and more for seconds while one overtone handed
  // over to the next).
  {
    char label[160];
    for (float wander : {0.0f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kWander, wander);
      device.set_param(p::kDistance, 3.0f);
      device.note_on(1, 110.0f, 0.7f);
      Stereo out = render(device, 30.0f, kRate);
      bool seen[9] = {};
      int kinds = 0, changes = 0, last = 0;
      for (int t = 2; t < 30; ++t) {
        const int best = strongest(out.left, 110.0, t + 0.5);
        if (!seen[best]) ++kinds;
        seen[best] = true;
        if (last != 0 && best != last) ++changes;
        last = best;
      }
      std::snprintf(label, sizeof label, "Wander %.0f: %d different overtones lead over 30 s, changing %d times", wander,
                    kinds, changes);
      CHECK(wander == 0.0f ? (kinds == 1 && seen[3]) : (kinds >= 3 && changes >= 3), label);
      double quietest = 0.0;
      for (int t = 2; t < 30; ++t) quietest = std::min(quietest, level_db(out.left, t, t + 1.0));
      std::snprintf(label, sizeof label, "Wander %.0f: the note never drops out (quietest second %.1f dB)", wander, quietest);
      CHECK(quietest > -34.0, label);
    }
    for (float hz : {41.2f, 110.0f}) {
      device.init(kRate);
      device.set_param(p::kWander, 1.0f);
      device.set_param(p::kGain, 0.6f);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 60.0f, kRate);
      std::vector<double> levels;
      for (double t = 5.0; t + 0.1 <= 60.0; t += 0.1) levels.push_back(level_db(out.left, t, t + 0.1));
      std::vector<double> sorted = levels;
      std::sort(sorted.begin(), sorted.end());
      const double median = sorted[sorted.size() / 2];
      std::snprintf(label, sizeof label, "Wander 1, Gain 0.6, %.0f Hz for a minute: the quietest 100 ms is %.1f dB under the usual level",
                    hz, median - sorted.front());
      CHECK(median - sorted.front() < 6.0, label);
    }
  }

  // 9. In tune: whatever overtone sings is within 8 cents of that harmonic
  // of the played note (5 here), across the keyboard and at three rates.
  {
    char label[160];
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      double worst = 0.0;
      int pairs = 0;
      for (float hz : {28.0f, 110.0f, 440.0f, 1318.5f, 2093.0f, 4186.0f}) {
        for (float distance : {1.0f, 2.0f, 3.0f, 6.5f}) {
          still(device, rate);
          device.set_param(p::kDistance, distance);
          device.set_param(p::kGain, 0.8f);
          device.note_on(1, hz, 0.7f);
          Stereo out = render(device, 5.0f, rate);
          // The harmonic that sings, and how far off it is.
          int best = 1;
          double loudest = -1.0e9, cents = 0.0;
          for (int h = 1; h <= 8 && hz * h < 0.45 * rate; ++h) {
            double level = 0.0;
            const double off = cents_off(out.left, hz * h, rate, 3.9, &level);
            if (level > loudest) {
              loudest = level;
              best = h;
              cents = off;
            }
          }
          ++pairs;
          if (std::fabs(cents) > std::fabs(worst)) worst = cents;
          if (std::fabs(cents) > 5.0 || loudest < -40.0) {
            std::snprintf(label, sizeof label, "%.0f Hz note at %.0f Hz, Distance %.1f: harmonic %d at %.1f dB, %.2f cents off",
                          hz, rate, distance, best, loudest, cents);
            CHECK(false, label);
          }
        }
      }
      std::snprintf(label, sizeof label, "at %.0f Hz the held overtone of %d note and Distance pairs is at most %.2f cents off",
                    rate, pairs, worst);
      CHECK(std::fabs(worst) < 5.0, label);
    }
  }

  // 10. Damp is the tone inside the loop: the top of a plucked string dies
  // sooner, and the pluck itself is duller.
  {
    char label[160];
    double fifth[2], bright[2];
    int which = 0;
    for (float damp : {0.0f, 1.0f}) {
      still(device);
      device.set_param(p::kGain, 0.0f);
      device.set_param(p::kPick, 1.0f);
      device.set_param(p::kDamp, damp);
      device.note_on(1, 110.0f, 0.7f);
      Stereo out = render(device, 1.2f, kRate);
      fifth[which] = harmonic_db(out.left, 110.0, 8, 1.0) - harmonic_db(out.left, 110.0, 1, 1.0);
      bright[which++] = energy_above(out.left, 1500.0, kRate, 0, at(0.1));
    }
    std::snprintf(label, sizeof label, "Damp 0 and 1: the eighth harmonic after 1 s is %.1f and %.1f dB under the note",
                  fifth[0], fifth[1]);
    CHECK(fifth[1] < fifth[0] - 15.0, label);
    std::snprintf(label, sizeof label, "Damp 0 and 1: share of the pluck over 1.5 kHz %.3f and %.3f", bright[0], bright[1]);
    CHECK(bright[1] < 0.5 * bright[0], label);
  }

  // 11. Release: how long a held note takes to sink 60 dB follows the knob,
  // and the instrument then reaches exact silence.
  {
    char label[160];
    double sink[3];
    int which = 0;
    for (float release : {0.1f, 1.5f, 8.0f}) {
      still(device);
      device.set_param(p::kRelease, release);
      device.note_on(1, 220.0f, 0.7f);
      Stereo held = render(device, 4.0f, kRate);
      const double steady = rms(held.left, at(3.5), at(4.0));
      device.note_off(1);
      Stereo tail = render(device, 20.0f, kRate);
      sink[which] = 20.0;
      for (double t = 0.0; t < 19.9; t += 0.05) {
        if (rms(tail.left, at(t), at(t + 0.05)) < 0.001 * steady) {
          sink[which] = t;
          break;
        }
      }
      if (release == 8.0f) {
        std::snprintf(label, sizeof label, "Release 8 s: exact silence by 20 s (peak %g)", peak(tail.left, at(19.5)));
        CHECK(peak(tail.left, at(19.5)) == 0.0 && peak(tail.right, at(19.5)) == 0.0, label);
      }
      ++which;
    }
    std::snprintf(label, sizeof label, "Release 0.1, 1.5 and 8 s: 60 dB down after %.2f, %.2f and %.2f s", sink[0], sink[1], sink[2]);
    CHECK(sink[0] < 0.3 && sink[1] > 1.0 && sink[1] < 3.0 && sink[2] > 4.0, label);
  }

  // 12. Velocity and level: a soft key is quieter, held and plucked, and one
  // key at gain 0.7 peaks between -24 and -10 dBFS at the default volume.
  {
    char label[160];
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo normal = render(device, 4.0f, kRate);
    device.init(kRate);
    device.note_on(1, 220.0f, 0.15f);
    Stereo soft = render(device, 4.0f, kRate);
    device.init(kRate);
    device.note_on(1, 220.0f, 1.0f);
    Stereo hard = render(device, 4.0f, kRate);
    std::snprintf(label, sizeof label, "gain 0.15, 0.7, 1: held at %.1f, %.1f, %.1f dB; pluck peaks %.1f, %.1f, %.1f dB",
                  level_db(soft.left, 3.5, 4.0), level_db(normal.left, 3.5, 4.0), level_db(hard.left, 3.5, 4.0),
                  db(peak(soft.left, 0, at(0.2))), db(peak(normal.left, 0, at(0.2))), db(peak(hard.left, 0, at(0.2))));
    CHECK(level_db(soft.left, 3.5, 4.0) < level_db(normal.left, 3.5, 4.0) - 3.0 &&
              level_db(hard.left, 3.5, 4.0) > level_db(normal.left, 3.5, 4.0) + 1.0 &&
              peak(soft.left, 0, at(0.2)) < 0.7 * peak(normal.left, 0, at(0.2)),
          label);
    const double one = db(std::max(peak(normal.left), peak(normal.right)));
    std::snprintf(label, sizeof label, "one key at gain 0.7 peaks at %.1f dBFS at the default volume", one);
    CHECK(one > -24.0 && one < -10.0, label);
  }

  // 13. Ten held keys stay under the clip knee at the defaults; and at the
  // loudest settings there are (Gain 1, with and without Crowd, clean and
  // torn, Wander on) sixty seconds of ten keys stay finite and under it.
  {
    char label[160];
    const float chord[10] = {55.0f, 82.4f, 110.0f, 146.8f, 196.0f, 246.9f, 329.6f, 440.0f, 587.3f, 784.0f};
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, chord[n], 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    std::snprintf(label, sizeof label, "ten keys at the defaults peak at %.3f", std::max(peak(out.left), peak(out.right)));
    CHECK(std::max(peak(out.left), peak(out.right)) < 0.5, label);
    for (int setting = 0; setting < 4; ++setting) {
      device.init(kRate);
      device.set_param(p::kGain, 1.0f);
      device.set_param(p::kCrowd, (setting & 1) ? 1.0f : 0.0f);
      device.set_param(p::kGrit, (setting & 2) ? 1.0f : 0.0f);
      device.set_param(p::kWander, 1.0f);
      for (int n = 0; n < 10; ++n) device.note_on(n, chord[n], 1.0f);
      Stereo minute = render(device, 60.0f, kRate);
      const double top = std::max(peak(minute.left), peak(minute.right));
      std::snprintf(label, sizeof label, "Gain 1, Crowd %d, Grit %d, ten keys for 60 s: peak %.3f, last 5 s %.1f dB", setting & 1,
                    (setting & 2) / 2, top, level_db(minute.left, 55.0, 60.0));
      CHECK(finite(minute.left) && finite(minute.right) && top < 0.5 && level_db(minute.left, 55.0, 60.0) > -45.0, label);
      // And after that minute every string still comes to rest. (The two
      // running sums over a period used to keep a minute's rounding: one
      // low string at 96 kHz was fed its stale offset for ever.)
      for (int n = 0; n < 10; ++n) device.note_off(n);
      render(device, 10.0f, kRate);
      Stereo rest = render(device, 0.5f, kRate);
      std::snprintf(label, sizeof label, "Gain 1, Crowd %d, Grit %d: exact silence 10 s after that minute", setting & 1, (setting & 2) / 2);
      CHECK(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, label);
    }
    // Ten keys picked as hard as they go, at three rates, with the feedback
    // open at once and with a slow Bloom: the picks do not add up to ten
    // times one and the strings do not overshoot the ceiling on their way
    // up. (They came to 0.68 at 44.1 kHz.)
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      double top = 0.0;
      for (float bloom : {0.02f, 4.0f}) {
        device.init(rate);
        device.set_param(p::kGain, 1.0f);
        device.set_param(p::kCrowd, 0.0f);
        device.set_param(p::kGrit, 0.0f);
        device.set_param(p::kPick, 1.0f);
        device.set_param(p::kDamp, 0.05f);
        device.set_param(p::kDistance, 4.0f);
        device.set_param(p::kBloom, bloom);
        for (int n = 0; n < 10; ++n) device.note_on(n, chord[n], 1.0f);
        Stereo hard = render(device, 20.0f, rate);
        top = std::max(top, std::max(peak(hard.left), peak(hard.right)));
      }
      std::snprintf(label, sizeof label, "Gain 1, Pick 1, Crowd 0, ten keys at %.0f Hz: peak %.3f", rate, top);
      CHECK(top < 0.5, label);
    }
    // And knobs anywhere: twenty-four seeded sets of every knob but Volume,
    // ten keys anywhere on the keyboard, twenty seconds each.
    {
      uint32_t seed = 0x2F6E2B1u;
      auto draw = [&] {
        seed ^= seed << 13;
        seed ^= seed >> 17;
        seed ^= seed << 5;
        return static_cast<float>(seed >> 8) * (1.0f / 16777216.0f);
      };
      double top = 0.0;
      bool sound = true;
      for (int set = 0; set < 24; ++set) {
        device.init(kRate);
        for (int id = 0; id < p::kVolume; ++id) {
          const float pick = draw();
          const float where = pick < 0.2f ? 0.0f : (pick > 0.8f ? 1.0f : draw());  // the ends are in it
          device.set_param(id, p::kParamMin[id] + where * (p::kParamMax[id] - p::kParamMin[id]));
        }
        for (int n = 0; n < 10; ++n) device.note_on(n, 27.5f * std::pow(2.0f, draw() * 7.2f), 0.3f + 0.7f * draw());
        Stereo any = render(device, 20.0f, kRate);
        sound = sound && finite(any.left) && finite(any.right);
        top = std::max(top, std::max(peak(any.left), peak(any.right)));
      }
      std::snprintf(label, sizeof label, "24 random sets of knobs, ten keys, 20 s each: finite, peak %.3f", top);
      CHECK(sound && top < 0.5, label);
    }
    // The soft clip is the last thing in the path: with the volume up full
    // and the same ten keys the peak is over the knee and under one.
    device.init(kRate);
    device.set_param(p::kGain, 1.0f);
    device.set_param(p::kCrowd, 0.0f);
    device.set_param(p::kVolume, 6.0f);
    for (int n = 0; n < 10; ++n) device.note_on(n, chord[n], 1.0f);
    Stereo loud = render(device, 4.0f, kRate);
    std::snprintf(label, sizeof label, "the same at Volume +6 dB: peak %.3f", std::max(peak(loud.left), peak(loud.right)));
    CHECK(std::max(peak(loud.left), peak(loud.right)) > 0.6 && std::max(peak(loud.left), peak(loud.right)) <= 1.0, label);
  }

  // 14. No clicks: a knob thrown from one place to another under a held
  // chord arrives gradually, against the same chord left alone.
  {
    char label[160];
    auto chord = [](Feedback& d) {
      d.init(kRate);
      d.note_on(1, 110.0f, 0.7f);
      d.note_on(2, 164.8f, 0.7f);
      d.note_on(3, 277.2f, 0.7f);
    };
    struct Throw {
      const char* name;
      int id;
      float to;
    };
    const Throw throws[] = {{"Gain to 1", p::kGain, 1.0f},     {"Gain to 0", p::kGain, 0.0f},
                            {"Volume to 0 dB", p::kVolume, 0.0f}, {"Distance to 6", p::kDistance, 6.0f},
                            {"Grit to 1", p::kGrit, 1.0f},     {"Crowd to 1", p::kCrowd, 1.0f},
                            {"Width to 0", p::kWidth, 0.0f},   {"Damp to 1", p::kDamp, 1.0f},
                            {"Width to 1", p::kWidth, 1.0f},   {"Wander to 1", p::kWander, 1.0f},
                            {"Wander to 0", p::kWander, 0.0f}, {"Crowd to 0", p::kCrowd, 0.0f}};
    for (const Throw& t : throws) {
      const double sudden = suddenness(chord, [&](Feedback& d) { d.set_param(t.id, t.to); });
      std::snprintf(label, sizeof label, "%s under a chord: %.3f of the change is there in 8 samples", t.name, sudden);
      CHECK(sudden < 0.15, label);
    }
    // And the plain bound: the largest sample step while Gain is swept is
    // no larger than the chord's own.
    chord(device);
    Stereo before = render(device, 3.0f, kRate);
    const double own = max_step(before.left, at(2.0));
    Stereo sweep;
    for (int step = 0; step < 100; ++step) {
      device.set_param(p::kGain, 0.7f + 0.3f * std::sin(static_cast<float>(step) * 0.4f));
      sweep = concat(sweep, render(device, 0.01f, kRate));
    }
    std::snprintf(label, sizeof label, "Gain swept for a second: largest step %.5f against %.5f at rest", max_step(sweep.left), own);
    CHECK(max_step(sweep.left) < 2.0 * own, label);
  }

  // 15. The host's block size is not heard: the same phrase, with a silence
  // long enough to sleep in, a knob moved inside it and a note that wakes
  // the instrument, in blocks of 1, 128 and 2048 frames. The silence is
  // stepped across the moment the instrument falls asleep.
  {
    char label[160];
    double worst = 0.0;
    auto phrase = [&](int block, float gap) {
      device.init(kRate);
      device.set_param(p::kRelease, 0.1f);
      device.set_param(p::kWander, 0.6f);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 0.4f, kRate, block);
      device.note_off(1);
      out = concat(out, render(device, gap, kRate, block));
      device.set_param(p::kDistance, 3.0f);
      device.set_param(p::kVolume, -3.0f);
      device.set_param(p::kGrit, 0.8f);
      out = concat(out, render(device, 0.005f, kRate, block));
      device.note_on(2, 330.0f, 0.8f);
      device.note_on(3, 110.0f, 0.5f);
      return concat(out, render(device, 0.5f, kRate, block));
    };
    for (float gap = 0.30f; gap < 0.66f; gap += 0.02f) {
      const Stereo reference = phrase(128, gap);
      for (int block : {1, 64, 1000, 2048}) {
        const Stereo other = phrase(block, gap);
        for (size_t i = 0; i < reference.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(other.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(other.right[i]) - reference.right[i]));
        }
      }
    }
    // (They differed by 7e-10 while the tail under the last string's end
    // was cut at whichever block the instrument fell asleep in.)
    std::snprintf(label, sizeof label, "blocks of 1, 64, 128, 1000 and 2048 frames through a silence and a wake differ by %g", worst);
    CHECK(worst == 0.0, label);
  }

  // 16. A second init gives the same audio bit for bit, whatever was played
  // before it, with everything that is random switched on.
  {
    auto piece = [&] {
      device.init(kRate);
      device.set_param(p::kWander, 1.0f);
      device.set_param(p::kPick, 0.3f);
      device.note_on(1, 146.8f, 0.8f);
      device.note_on(2, 220.0f, 0.6f);
      Stereo out = render(device, 2.0f, kRate);
      device.note_off(1);
      device.note_on(3, 440.0f, 0.8f);
      return concat(out, render(device, 1.0f, kRate));
    };
    const Stereo first = piece();
    device.note_on(9, 98.0f, 1.0f);
    render(device, 0.3f, kRate);
    const Stereo second = piece();
    CHECK(first.left == second.left && first.right == second.right, "a second init gives bit-identical audio");
  }

  // 17. Stealing. With all twelve strings held and settled, two more keys
  // in one block both sound; a key struck twice inside the steal takes one
  // string, not two; the steal itself is a fade; and when every key is let
  // go the instrument reaches exact silence.
  {
    char label[160];
    auto full = [](Feedback& d) {
      d.init(kRate);
      d.set_param(p::kWander, 0.0f);
      d.set_param(p::kCrowd, 0.0f);
      d.set_param(p::kDistance, 1.0f);
      d.set_param(p::kRelease, 0.2f);
      for (int n = 0; n < 12; ++n) d.note_on(n, 98.0f * std::pow(2.0f, static_cast<float>(n) * 5.0f / 12.0f) / (n > 6 ? 8.0f : 1.0f), 0.7f);
    };
    full(device);
    render(device, 3.0f, kRate);
    device.note_on(20, 2000.0f, 0.9f);
    device.note_on(21, 2500.0f, 0.9f);
    device.note_on(21, 2500.0f, 0.9f);  // struck twice before it could start
    Stereo out = render(device, 2.0f, kRate);
    // The twelve are at the ceiling: the newcomers are picked softly, then
    // come up to the share every string has, and the rest make room.
    const double a = db(tone_level(out.left, 2000.0, kRate, at(1.0), at(1.1)));
    const double b = db(tone_level(out.left, 2500.0, kRate, at(1.0), at(1.1)));
    const double held = db(tone_level(out.left, 98.0, kRate, at(1.0), at(1.4)));
    std::snprintf(label, sizeof label,
                  "twelve held, two more in one block: %.1f dB at 2 kHz and %.1f dB at 2.5 kHz after a second, a held string at %.1f dB",
                  a, b, held);
    CHECK(std::fabs(a - held) < 6.0 && std::fabs(b - held) < 6.0, label);
    for (int n = 0; n < 12; ++n) device.note_off(n);
    device.note_off(20);
    device.note_off(21);
    render(device, 4.0f, kRate);
    Stereo after = render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label, "every key let go after a double strike: peak %g", std::max(peak(after.left), peak(after.right)));
    CHECK(peak(after.left) == 0.0 && peak(after.right) == 0.0, label);

    const double steal = suddenness(full, [](Feedback& d) { d.note_on(30, 1500.0f, 0.2f); });
    std::snprintf(label, sizeof label, "a thirteenth key: %.3f of the change is there in 8 samples", steal);
    CHECK(steal < 0.15, label);
    const double off = suddenness(full, [](Feedback& d) {
      d.set_param(p::kRelease, 0.05f);
      d.note_off(3);
    });
    std::snprintf(label, sizeof label, "a key let go at the shortest Release: %.3f of the change is there in 8 samples", off);
    CHECK(off < 0.15, label);
  }

  // 18. Knobs moved in a silence have arrived by the next note: sample for
  // sample the note of an instrument that was set that way from the start.
  {
    char label[160];
    auto set = [](Feedback& d) {
      d.set_param(p::kGain, 0.9f);
      d.set_param(p::kDistance, 4.0f);
      d.set_param(p::kGrit, 0.9f);
      d.set_param(p::kDamp, 0.1f);
      d.set_param(p::kCrowd, 1.0f);
      d.set_param(p::kWidth, 1.0f);
      d.set_param(p::kVolume, -2.0f);
    };
    // Both instruments play one note, sleep, and play the note that is
    // compared (on the same string, so pick and place are the same); one
    // has its knobs from the start, the other gets them while asleep.
    auto played = [&](bool from_the_start) {
      device.init(kRate);
      device.set_param(p::kRelease, 0.1f);
      if (from_the_start) set(device);
      device.note_on(5, 330.0f, 0.7f);
      render(device, 0.3f, kRate);
      device.process(13);  // off the beat of the control clock
      device.note_off(5);
      render(device, 2.0f, kRate);
      if (!from_the_start) set(device);
      Stereo asleep = render(device, 0.1f, kRate);
      EXPECT(peak(asleep.left) == 0.0, "the instrument is asleep before the compared note");
      device.note_on(1, 196.0f, 0.7f);
      return render(device, 0.5f, kRate);
    };
    const Stereo fresh = played(true);
    const Stereo later = played(false);
    double worst = 0.0;
    for (size_t i = 0; i < fresh.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(later.left[i]) - fresh.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(later.right[i]) - fresh.right[i]));
    }
    std::snprintf(label, sizeof label, "seven knobs moved in a silence: the next note differs from a fresh one by %g", worst);
    CHECK(worst < 1.0e-6, label);
  }

  // 19. The hum is as loud against the note at any sample rate: a string
  // held under the threshold with no pluck rings with the hum alone.
  {
    char label[160];
    double hum[2];
    int which = 0;
    for (float rate : {48000.0f, 96000.0f}) {
      still(device, rate);
      device.set_param(p::kPick, 0.0f);
      device.set_param(p::kGain, 0.3f);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 6.0f, rate);
      // What is heard of it: under 5 kHz. (Over the whole band the higher
      // rate reads 1.2 dB more, from the string's resonances above 24 kHz.)
      std::vector<float> heard(out.size());
      const double pole = std::exp(-2.0 * kPi * 5000.0 / rate);
      double low = 0.0;
      for (size_t i = 0; i < out.size(); ++i) {
        low = out.left[i] + (low - out.left[i]) * pole;
        heard[i] = static_cast<float>(low);
      }
      hum[which++] = level_db(heard, 2.0, 6.0, rate);
    }
    std::snprintf(label, sizeof label, "the hum alone under 5 kHz: %.1f dB at 48 kHz, %.1f dB at 96 kHz", hum[0], hum[1]);
    CHECK(std::fabs(hum[0] - hum[1]) < 1.0 && hum[0] > -110.0 && hum[0] < -60.0, label);
  }

  // 20. Width: at 0 the two sides are the same; at 1 they are apart, and
  // the side stays well under the middle so nothing is lost in mono.
  {
    char label[160];
    auto side_over_mid = [](const Stereo& out) {
      std::vector<float> mid(out.size()), side(out.size());
      for (size_t i = 0; i < out.size(); ++i) {
        mid[i] = 0.5f * (out.left[i] + out.right[i]);
        side[i] = 0.5f * (out.left[i] - out.right[i]);
      }
      return db(rms(side, at(1.0))) - db(rms(mid, at(1.0)));
    };
    auto chord = [](Feedback& d, float width) {
      d.init(kRate);
      d.set_param(p::kWidth, width);
      d.note_on(1, 146.8f, 0.7f);
      d.note_on(2, 220.0f, 0.7f);
      d.note_on(3, 349.2f, 0.7f);
    };
    chord(device, 0.0f);
    Stereo mono = render(device, 3.0f, kRate);
    CHECK(mono.left == mono.right, "Width 0: left and right are the same samples");
    chord(device, 1.0f);
    Stereo wide = render(device, 3.0f, kRate);
    const double spread = side_over_mid(wide);
    std::snprintf(label, sizeof label, "Width 1: side %.1f dB against mid, correlation %.3f", spread,
                  correlation(wide.left, wide.right, at(1.0)));
    CHECK(spread > -20.0 && spread < -4.0, label);
    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kDistance, 8.0f);
    device.note_on(1, 110.0f, 0.7f);
    Stereo one = render(device, 3.0f, kRate);
    std::snprintf(label, sizeof label, "Width 1, one note on its eighth overtone: side %.1f dB against mid", side_over_mid(one));
    CHECK(side_over_mid(one) < -4.0, label);
  }

  // 21. A short note: 100 ms of key still makes sound at once and then ends.
  {
    char label[160];
    device.init(kRate);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 0.1f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 6.0f, kRate);
    std::snprintf(label, sizeof label, "a 100 ms note: %.1f dB in its first 30 ms, peak %g six seconds on",
                  level_db(out.left, 0.0, 0.03), peak(tail.left, at(5.5)));
    CHECK(level_db(out.left, 0.0, 0.03) > -40.0 && peak(tail.left, at(5.5)) == 0.0, label);
  }

  // 22. The top of the keyboard comes to rest. A high string's loop loses
  // next to nothing at 0 Hz: the hum and the pick piled up there as an
  // offset a quarter of the note's size, the limiter took it for sound, and
  // a released top C was still sounding (inaudibly) a minute later. The
  // offset is taken out inside the loop now: every note from 28 Hz to
  // 4.2 kHz is exactly silent a few seconds after its key, and held it is
  // at the level of the others.
  {
    char label[160];
    double longest = 0.0, lowest = 0.0, highest = -200.0;
    for (float hz : {28.0f, 220.0f, 1046.5f, 2093.0f, 3136.0f, 4186.0f}) {
      device.init(kRate);
      device.note_on(1, hz, 0.7f);
      Stereo held = render(device, 5.0f, kRate);
      const double level = level_db(held.left, 4.0, 5.0);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
      device.note_off(1);
      double silent = 30.0;
      for (double t = 0.0; t < 30.0; t += 0.25) {
        Stereo part = render(device, 0.25f, kRate);
        if (peak(part.left) == 0.0 && peak(part.right) == 0.0) {
          silent = t;
          break;
        }
      }
      longest = std::max(longest, silent);
    }
    std::snprintf(label, sizeof label, "28 Hz to 4.2 kHz at Release 1.5 s: exact silence %.2f s after the key at the latest", longest);
    CHECK(longest < 6.0, label);
    std::snprintf(label, sizeof label, "28 Hz to 4.2 kHz held: %.1f to %.1f dB", lowest, highest);
    CHECK(highest - lowest < 2.0, label);
  }

  // 23. A key by itself is picked at once, whichever string it lands on:
  // twelve keys one after another (each lands on the next string) all speak
  // in their first 3 ms. Keys pressed together are still picked apart.
  {
    char label[160];
    device.init(kRate);
    device.set_param(p::kRelease, 0.05f);
    device.set_param(p::kGain, 0.0f);
    double latest = 0.0;
    for (int n = 0; n < 12; ++n) {
      device.note_on(n, 440.0f, 0.8f);
      Stereo out = render(device, 0.3f, kRate);
      device.note_off(n);
      const double loudest = std::max(peak(out.left), peak(out.right));
      double began = 0.3;
      for (size_t i = 0; i < out.size(); ++i) {
        if (std::fabs(out.left[i]) > 0.1 * loudest || std::fabs(out.right[i]) > 0.1 * loudest) {
          began = static_cast<double>(i) / kRate;
          break;
        }
      }
      latest = std::max(latest, began);
    }
    std::snprintf(label, sizeof label, "twelve keys one after another: the latest pick is heard %.1f ms after its key", latest * 1000.0);
    CHECK(latest < 0.003, label);
  }

  // 24. The pick is the pick, whatever Gain says. The limiter used to give
  // a string it had not read yet all it had, for its first two ticks: a top
  // note goes round its loop several times in that, and at Gain 1 its pick
  // came out four times its size (0.52 from one key, over the knee from
  // two). The first 50 ms of a hard pick are now the same at Gain 0.3 and
  // at Gain 1 on every note.
  {
    char label[160];
    double most = 0.0, loudest = 0.0;
    for (float hz : {110.0f, 1046.5f, 2093.0f, 3136.0f, 4186.0f}) {
      double heard[2] = {};
      for (int which = 0; which < 2; ++which) {
        device.init(kRate);
        device.set_param(p::kPick, 1.0f);
        device.set_param(p::kGrit, 0.0f);
        device.set_param(p::kBloom, 4.0f);
        device.set_param(p::kGain, which == 0 ? 0.3f : 1.0f);
        device.note_on(1, hz, 1.0f);
        Stereo out = render(device, 0.05f, kRate);
        heard[which] = std::max(peak(out.left), peak(out.right));
      }
      most = std::max(most, heard[1] / heard[0]);
      loudest = std::max(loudest, heard[1]);
    }
    std::snprintf(label, sizeof label, "a hard pick at Gain 1 is at most %.2f times the pick at Gain 0.3 (peak %.3f at the most)", most, loudest);
    CHECK(most < 1.05 && loudest < 0.25, label);
  }

  // TESTS

  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("feedback (8 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("feedback");
}
