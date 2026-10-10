// Native harness for Canon (cpp/devices/canon). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a canon: followers that enter a gap apart,
// on the sample, at their own intervals, forwards or backwards, and a round
// that comes back.

#include <functional>

#include "../devices/canon/canon.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Canon;
namespace p = livemix::canon;

static Canon device;
static Canon other;

static const float kRate = 48000.0f;

// One follower at unison, nothing else in the way: all wet, Tone open, no
// fade, no spread, no round.
static void plain(Canon& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kFollowers, 1.0f);
  d.set_param(p::kGap, 0.5f);
  for (int k = 0; k < 4; ++k) d.set_param(p::kInterval1 + k, 0.0f);
  d.set_param(p::kCrab, 0.0f);
  d.set_param(p::kFade, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kTone, 18000.0f);
  d.set_param(p::kRound, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// Sample index of the largest magnitude in [from, to).
static size_t peak_index(const std::vector<float>& x, size_t from, size_t to) {
  size_t best = from;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

// The share of the power of [from, to) that lies in the tones nearest `hz`
// (each looked for within 1.5 % of where it should be).
static double purity(const std::vector<float>& x, const std::vector<double>& hz, size_t from,
                     size_t to) {
  double in_tones = 0.0;
  for (double f : hz) {
    const double found = dominant_frequency(x, kRate, f * 0.985, f * 1.015, from, to);
    const double level = tone_level(x, found, kRate, from, to);
    in_tones += 0.5 * level * level;
  }
  const double total = rms(x, from, to);
  return total > 0.0 ? in_tones / (total * total) : 0.0;
}

// A tone under a Hann bell: `seconds` long, starting at `at` seconds.
static void add_note(std::vector<float>& x, float hz, float at, float seconds, float gain) {
  const size_t from = static_cast<size_t>(at * kRate);
  const size_t length = static_cast<size_t>(seconds * kRate);
  for (size_t i = 0; i < length && from + i < x.size(); ++i) {
    const double bell = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / length);
    x[from + i] += gain * static_cast<float>(bell * std::sin(2.0 * kPi * hz * i / kRate));
  }
}

// How an event arrives, against the same passage without it: `sudden` is the
// share of the change that is already there after 8 samples (a smoothed
// change has barely begun, a jump is all there), `step` the largest
// sample-to-sample jump with the event over the largest without it, and
// `change` how much the event changed the sound at all. Taken at eight
// moments a little apart, the worst kept, so a jump cannot hide in a zero
// crossing.
struct Arrival {
  double sudden = 0.0;
  double step = 0.0;
  double change = 0.0;
};

static Arrival arrival(const std::function<void(Canon&)>& setup, const std::vector<float>& input,
                       const std::function<void(Canon&)>& event, float listen_seconds = 0.02f) {
  Arrival worst;
  const size_t listen = static_cast<size_t>(listen_seconds * kRate);
  for (int moment = 0; moment < 8; ++moment) {
    const size_t at = input.size() - listen - 4096 + static_cast<size_t>(moment) * 131;
    const std::vector<float> before(input.begin(), input.begin() + at);
    const std::vector<float> after(input.begin() + at, input.begin() + at + listen);
    Stereo quiet, moved;
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      run(device, before);
      if (pass == 1) event(device);
      (pass == 0 ? quiet : moved) = run(device, after);
    }
    double first = 0.0, whole = 0.0;
    for (size_t i = 0; i < listen; ++i) {
      const double d = std::max(std::fabs(static_cast<double>(moved.left[i]) - quiet.left[i]),
                                std::fabs(static_cast<double>(moved.right[i]) - quiet.right[i]));
      if (i < 8) first = std::max(first, d);
      whole = std::max(whole, d);
    }
    if (whole > 0.0) worst.sudden = std::max(worst.sudden, first / whole);
    worst.change = std::max(worst.change, whole);
    const double steady = std::max(max_step(quiet.left), max_step(quiet.right));
    const double stepped = std::max(max_step(moved.left), max_step(moved.right));
    if (steady > 0.0) worst.step = std::max(worst.step, stepped / steady);
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "canon";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // Three followers 1.5 s apart: the last sound comes 4.5 s after the input
  // stops, and the device rests once the line has been blank that long.
  spec.tail_seconds = 6.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // An impulse returns at k x Gap for each follower, on the sample, and the
  // four together carry the power of one (half the height each).
  {
    plain(device);
    device.set_param(p::kFollowers, 4.0f);
    device.set_param(p::kGap, 0.25f);
    Stereo out = run(device, impulse(1.5f, kRate, 0.8f));
    bool on_the_gap = true, right_height = true;
    for (int k = 1; k <= 4; ++k) {
      const size_t at = peak_index(out.left, static_cast<size_t>(k) * 12000 - 6000,
                                   static_cast<size_t>(k) * 12000 + 6000);
      if (at != static_cast<size_t>(k) * 12000) on_the_gap = false;
      if (std::fabs(out.left[at] - 0.4f) > 1.0e-6f) right_height = false;
    }
    EXPECT(on_the_gap, "an impulse returns at k x Gap for each of four followers");
    EXPECT(right_height, "four followers each play at half the height: together the power of one");
    double between = 0.0;
    for (int k = 0; k < 5; ++k) {
      between = std::max(between, peak(out.left, static_cast<size_t>(k) * 12000 + 1,
                                       static_cast<size_t>(k + 1) * 12000));
    }
    EXPECT(between == 0.0 && peak(out.left, 48001) == 0.0, "nothing sounds between the entries");
  }

  // Unison is exact: one follower all wet is the input one gap later, bit for
  // bit, each side its own.
  {
    plain(device);
    rng_state() = 0x5EEDu;
    const std::vector<float> left = noise(2.0f, kRate, 0.9f);
    const std::vector<float> right = noise(2.0f, kRate, 0.9f);
    Stereo out = run(device, left, right);
    size_t wrong = 0;
    for (size_t i = 0; i + 24000 < left.size(); ++i) {
      if (out.left[i + 24000] != left[i] || out.right[i + 24000] != right[i]) ++wrong;
    }
    EXPECT(wrong == 0, "a follower at unison is the line one gap ago, bit for bit");
    EXPECT(peak(out.left, 0, 24000) == 0.0, "all wet, nothing sounds before the first entry");
  }

  // Mix 0 is the input, sample for sample, while the followers run unheard.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kRound, 0.6f);
    device.set_param(p::kGap, 0.2f);
    rng_state() = 0xD0D0u;
    const std::vector<float> in = noise(2.0f, kRate, 0.7f);
    Stereo out = run(device, in);
    EXPECT(out.left == in && out.right == in, "Mix 0 passes the input sample for sample");
  }

  // Each follower plays the line at its own interval: a note of 440 Hz comes
  // back a fifth up, a fourth down, an octave up and an octave down.
  {
    plain(device);
    device.set_param(p::kFollowers, 4.0f);
    const int intervals[4] = {7, -5, 12, -12};
    for (int k = 0; k < 4; ++k) device.set_param(p::kInterval1 + k, static_cast<float>(intervals[k]));
    std::vector<float> in = silence(2.6f, kRate);
    add_note(in, 440.0f, 0.02f, 0.4f, 0.6f);
    Stereo out = run(device, in);
    double worst_cents = 0.0, quietest = 1.0;
    for (int k = 0; k < 4; ++k) {
      const size_t from = static_cast<size_t>((0.5f * (k + 1) + 0.07f) * kRate);
      const size_t to = from + static_cast<size_t>(0.3f * kRate);
      const double want = 440.0 * std::pow(2.0, intervals[k] / 12.0);
      const double found = dominant_frequency(out.left, kRate, want * 0.7, want * 1.4, from, to);
      worst_cents = std::max(worst_cents, std::fabs(1200.0 * std::log2(found / want)));
      quietest = std::min(quietest, rms(out.left, from, to));
    }
    std::printf("canon intervals: worst error %.2f cents\n", worst_cents);
    EXPECT(worst_cents < 4.0, "each follower returns the note at its own interval");
    EXPECT(quietest > 0.05, "each of the four transposed followers sounds");
  }

  // A transposed follower holds a note steady: the splice lines the two
  // heads up, so nearly all the power is at the new pitch (a blind crossfade
  // leaves a fifth of it in sidebands). A chord keeps its notes, each within
  // a sixth of a semitone.
  {
    double worst = 1.0;
    for (int semis : {12, 7, -5, -12}) {
      for (float hz : {82.41f, 220.0f, 440.0f, 1318.5f}) {
        plain(device);
        device.set_param(p::kInterval1, static_cast<float>(semis));
        Stereo out = run(device, sine(hz, 2.5f, kRate, 0.5f));
        worst = std::min(worst, purity(out.left, {hz * std::pow(2.0, semis / 12.0)}, 48000, 120000));
      }
    }
    std::printf("canon transposed tone: least share of the power at the new pitch %.4f\n", worst);
    EXPECT(worst > 0.99, "a transposed follower holds a single note steady");

    plain(device);
    device.set_param(p::kInterval1, 7.0f);
    std::vector<float> chord = sine(220.0f, 2.5f, kRate, 0.2f);
    const std::vector<float> third = sine(277.18f, 2.5f, kRate, 0.2f);
    const std::vector<float> fifth = sine(329.63f, 2.5f, kRate, 0.2f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += third[i] + fifth[i];
    Stereo out = run(device, chord);
    const double up = std::pow(2.0, 7.0 / 12.0);
    const double kept = purity(out.left, {220.0 * up, 277.18 * up, 329.63 * up}, 48000, 120000);
    std::printf("canon transposed chord: share of the power in its three notes %.3f, level %.2f dB\n",
                kept, db(rms(out.left, 48000, 120000) / rms(chord)));
    EXPECT(kept > 0.95, "a transposed chord keeps its three notes");
    EXPECT(std::fabs(db(rms(out.left, 48000, 120000) / rms(chord))) < 1.0,
           "a transposed chord comes back at the level it went in");
  }

  // A transposed follower still enters on the gap: how late the shifter
  // plays an attack is taken off the reader's delay. A struck note, placed
  // twelve ways against the heads' sweep; its entry is where it first
  // reaches half its height.
  {
    const auto entry = [](const std::vector<float>& x) {
      const double top = peak(x);
      for (size_t i = 0; i < x.size(); ++i) {
        if (std::fabs(x[i]) >= 0.5 * top) return static_cast<double>(i);
      }
      return 0.0;
    };
    double worst_mean = 0.0, worst_one = 0.0;
    for (int semis : {12, 7, -5, -12}) {
      double sum = 0.0;
      for (int placing = 0; placing < 12; ++placing) {
        plain(device);
        device.set_param(p::kInterval1, static_cast<float>(semis));
        std::vector<float> in = silence(1.2f, kRate);
        in[0] = 1.0e-6f;  // wakes the device, so the heads' timetable starts here
        const size_t from = 4800 + static_cast<size_t>(placing) * 107;
        for (size_t i = 0; i < 14400; ++i) {
          in[from + i] = static_cast<float>(0.8 * std::sin(2.0 * kPi * 440.0 * i / kRate) *
                                            std::min(1.0, i / 48.0) * std::exp(-static_cast<double>(i) / 4800.0));
        }
        Stereo out = run(device, in);
        const double late = (entry(out.left) - entry(in) - 24000.0) / 48.0;
        sum += late;
        worst_one = std::max(worst_one, std::fabs(late));
      }
      worst_mean = std::max(worst_mean, std::fabs(sum / 12.0));
    }
    std::printf("canon transposed entry: on average %.2f ms off the gap at the most, one note %.2f ms\n",
                worst_mean, worst_one);
    EXPECT(worst_mean < 3.0, "a transposed follower's attack falls on the gap on average");
    EXPECT(worst_one < 13.0, "a transposed follower's attack is never far from the gap");
  }

  // A crab plays each gap's worth backwards: a rising sweep returns falling,
  // and an impulse at place a of a gap returns at its mirror, Gap - 1 - a.
  {
    std::vector<float> sweep(static_cast<size_t>(kRate), 0.0f);
    double phase = 0.0;
    for (size_t i = 0; i < sweep.size(); ++i) {
      const double hz = 300.0 * std::pow(8.0, static_cast<double>(i) / sweep.size());
      phase += 2.0 * kPi * hz / kRate;
      sweep[i] = 0.5f * static_cast<float>(std::sin(phase));
    }
    sweep.resize(static_cast<size_t>(2.2f * kRate), 0.0f);
    double early[2], late[2];
    for (int crab = 0; crab < 2; ++crab) {
      plain(device);
      device.set_param(p::kGap, 1.0f);
      device.set_param(p::kCrab, crab == 1 ? 3.0f : 0.0f);
      Stereo out = run(device, sweep);
      early[crab] = dominant_frequency(out.left, kRate, 200.0, 4000.0, 52800, 62400);
      late[crab] = dominant_frequency(out.left, kRate, 200.0, 4000.0, 81600, 91200);
    }
    std::printf("canon sweep: forwards %.0f then %.0f Hz, crab %.0f then %.0f Hz\n", early[0],
                late[0], early[1], late[1]);
    EXPECT(late[0] > 2.5 * early[0], "a forward follower returns a rising sweep rising");
    EXPECT(early[1] > 2.5 * late[1], "a crab returns a rising sweep falling");
    EXPECT(std::fabs(early[1] / late[0] - 1.0) < 0.03 && std::fabs(late[1] / early[0] - 1.0) < 0.03,
           "the crab's sweep is the forward one mirrored in time");

    bool mirrored = true;
    for (int follower = 1; follower <= 4; follower += 3) {
      plain(device);
      device.set_param(p::kFollowers, 4.0f);
      device.set_param(p::kGap, 0.25f);
      device.set_param(p::kCrab, 3.0f);
      std::vector<float> in = silence(2.0f, kRate);
      in[0] = 0.5f;      // wakes the device: the gaps count from here
      in[15000] = 0.8f;  // place 3000 of the second gap
      Stereo out = run(device, in);
      // Follower k plays the second gap's worth during gap k + 1, mirrored.
      const size_t want = static_cast<size_t>(follower + 1) * 12000 + (12000 - 1 - 3000);
      const size_t at = peak_index(out.left, want - 4000, want + 4000);
      if (at != want || std::fabs(out.left[at] - 0.4f) > 1.0e-6f) mirrored = false;
    }
    EXPECT(mirrored, "a crab returns an impulse at the mirror of its place in the gap");
  }

  // Where a crab's gap runs out the next one takes over without a hole or a
  // click. The two are different sound, so they cross with equal power:
  // noise keeps its level across the join. A held tone meets itself there,
  // and 230.83 Hz does so half a wave out of step, which is the worst there
  // is: it dips, by 4.4 dB over the crossing, but it does not jump.
  {
    // From the third gap on: what the second join crosses out of is the
    // silence before the line began.
    const size_t kFrom = 31200;
    plain(device);
    device.set_param(p::kGap, 0.3f);
    device.set_param(p::kCrab, 3.0f);
    rng_state() = 0xC4ABu;
    const std::vector<float> hiss = noise(2.0f, kRate, 0.3f);
    Stereo out = run(device, hiss);
    double low = 1.0e9, high = 0.0;
    for (size_t at = kFrom; at + 1440 <= out.left.size(); at += 240) {
      const double level = rms(out.left, at, at + 1440);
      low = std::min(low, level);
      high = std::max(high, level);
    }
    std::printf("canon crab joins on noise: level between %.2f and %.2f dB of the line\n",
                db(low / rms(hiss)), db(high / rms(hiss)));
    EXPECT(db(low / rms(hiss)) > -1.5 && db(high / rms(hiss)) < 1.5,
           "a crab's joins keep the level of unrelated sound");

    plain(device);
    device.set_param(p::kGap, 0.3f);
    device.set_param(p::kCrab, 3.0f);
    out = run(device, sine(230.8333f, 2.0f, kRate, 0.5f));
    low = 1.0e9;
    for (size_t at = kFrom; at + 1440 <= out.left.size(); at += 240) {
      low = std::min(low, rms(out.left, at, at + 1440));
    }
    const double tone_step = max_step(sine(230.8333f, 0.1f, kRate, 0.5f));
    std::printf("canon crab joins on a tone: lowest level %.2f dB, step x%.2f\n", db(low / 0.3536),
                max_step(out.left, kFrom) / tone_step);
    EXPECT(db(low / 0.3536) > -6.0, "a crab's joins leave no hole in a held tone");
    // Two copies of the tone in step add to 1.41 of it at the most: a click would be more.
    EXPECT(max_step(out.left, kFrom) < 1.5 * tone_step, "a crab's joins do not click");
  }

  // Round: the last follower feeds the line, so the canon comes round again,
  // each lap as much quieter as Round says.
  {
    plain(device);
    device.set_param(p::kFollowers, 2.0f);
    device.set_param(p::kGap, 0.25f);
    device.set_param(p::kRound, 0.8f);
    std::vector<float> in = silence(2.2f, kRate);
    add_note(in, 440.0f, 0.02f, 0.1f, 0.8f);
    Stereo out = run(device, in);
    // Lap n of follower 1 sounds at (2 n + 1) gaps, of follower 2 at (2 n + 2).
    double laps[4];
    for (int lap = 0; lap < 4; ++lap) {
      const size_t from = static_cast<size_t>(2 * lap + 1) * 12000;
      laps[lap] = rms(out.left, from, from + 12000);
    }
    std::printf("canon round 0.8: laps fall by %.3f, %.3f, %.3f\n", laps[1] / laps[0],
                laps[2] / laps[1], laps[3] / laps[2]);
    EXPECT(std::fabs(laps[1] / laps[0] - 0.8) < 0.02 && std::fabs(laps[2] / laps[1] - 0.8) < 0.02 &&
               std::fabs(laps[3] / laps[2] - 0.8) < 0.02,
           "each lap of the round is quieter by Round");
    const double second = rms(out.left, 24000, 36000) / laps[0];
    EXPECT(std::fabs(second - 1.0) < 0.01, "inside a lap the two followers are as loud as each other");
  }

  // The round applies the last follower's interval once more on every lap:
  // a fifth up, then a ninth, then an octave and a sixth.
  {
    plain(device);
    device.set_param(p::kGap, 0.5f);
    device.set_param(p::kInterval1, 7.0f);
    device.set_param(p::kRound, 0.9f);
    std::vector<float> in = silence(2.2f, kRate);
    add_note(in, 220.0f, 0.02f, 0.4f, 0.6f);
    Stereo out = run(device, in);
    double worst_cents = 0.0;
    for (int lap = 1; lap <= 3; ++lap) {
      const size_t from = static_cast<size_t>((0.5f * lap + 0.09f) * kRate);
      const double want = 220.0 * std::pow(2.0, 7.0 * lap / 12.0);
      const double found = dominant_frequency(out.left, kRate, want * 0.8, want * 1.25, from, from + 12000);
      worst_cents = std::max(worst_cents, std::fabs(1200.0 * std::log2(found / want)));
    }
    std::printf("canon round climbs: worst error %.2f cents over three laps\n", worst_cents);
    EXPECT(worst_cents < 8.0, "the round climbs by the last follower's interval on every lap");
  }

  // A round at its highest with a full-scale line, transposed and crabbed:
  // bounded. At unison it goes on: four seconds after the line stops, ten
  // laps on, it is 0.95 to the tenth of what it was.
  {
    device.init(kRate);
    device.set_param(p::kFollowers, 4.0f);
    device.set_param(p::kGap, 0.1f);
    device.set_param(p::kRound, 0.95f);
    device.set_param(p::kInterval4, 12.0f);
    device.set_param(p::kCrab, 2.0f);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0xFACEu;
    Stereo loud = run(device, noise(20.0f, kRate, 1.0f));
    std::printf("canon round 0.95 on full-scale noise: peak %.2f, rms %.2f\n",
                std::max(peak(loud.left), peak(loud.right)), rms(loud.left, 480000));
    EXPECT(finite(loud.left) && finite(loud.right) && peak(loud.left) < 2.01 && peak(loud.right) < 2.01,
           "the highest round on a full-scale line stays bounded");
    // The output is limited whatever the line holds, so the line is asked too:
    // what returns to it is never past twice full scale.
    std::printf("canon round 0.95 on full-scale noise: the line holds %.2f at the most\n", device.meter(1));
    EXPECT(device.meter(1) < 3.01f, "the line itself stays bounded under the highest round");

    // The hardest case for the loop: a full-scale tone that fits the gap, so
    // every lap adds in step. Unlimited it would settle at twenty times full
    // scale; what returns is limited to twice, so the line holds three at most.
    plain(device);
    device.set_param(p::kGap, 0.1f);
    device.set_param(p::kRound, 0.95f);
    Stereo ringing = run(device, sine(100.0f, 20.0f, kRate, 1.0f));
    std::printf("canon round 0.95 on a full-scale tone in step with the gap: the line holds %.2f, out %.2f\n",
                device.meter(1), peak(ringing.left));
    EXPECT(finite(ringing.left) && device.meter(1) < 3.01f && peak(ringing.left) < 2.01,
           "a tone in step with the round stays bounded, in the line and out of it");
    EXPECT(device.meter(1) > 2.0f, "that tone does build up to where the limit holds it");

    plain(device);
    device.set_param(p::kFollowers, 4.0f);
    device.set_param(p::kGap, 0.1f);
    device.set_param(p::kRound, 0.95f);
    rng_state() = 0xFACEu;
    Stereo held = run(device, noise(8.0f, kRate, 0.2f));
    Stereo after = render(device, 4.4f, kRate);
    // The last lap that was fed, against the one ten laps (4 s) later.
    const double kept = rms(after.left, 192000, 211200) / rms(after.left, 0, 19200);
    std::printf("canon round 0.95 at unison: ten laps on, %.3f of the level (0.95^10 = %.3f)\n", kept,
                std::pow(0.95, 10.0));
    EXPECT(std::fabs(kept / std::pow(0.95, 10.0) - 1.0) < 0.05, "the round dies away at the rate Round sets");
    EXPECT(finite(held.left) && peak(held.left) < 2.01, "a round that builds up stays bounded");
  }

  // Fade: each follower is 12 dB x Fade quieter than the one before.
  {
    plain(device);
    device.set_param(p::kFollowers, 4.0f);
    device.set_param(p::kGap, 0.25f);
    device.set_param(p::kFade, 0.5f);
    Stereo out = run(device, impulse(1.5f, kRate, 0.8f));
    bool steps = true;
    for (int k = 1; k < 4; ++k) {
      const double drop = db(std::fabs(out.left[static_cast<size_t>(k + 1) * 12000]) /
                             std::fabs(out.left[static_cast<size_t>(k) * 12000]));
      if (std::fabs(drop + 6.0) > 0.01) steps = false;
    }
    EXPECT(steps, "at Fade 0.5 each follower is 6 dB under the one before");
    double power = 0.0;
    for (int k = 1; k <= 4; ++k) {
      const double height = out.left[static_cast<size_t>(k) * 12000] / 0.8;
      power += height * height;
    }
    EXPECT(std::fabs(power - 1.0) < 1.0e-4, "faded followers still carry the power of one together");
  }

  // The count does not change the level: noise through four followers is as
  // loud as through one.
  {
    double levels[2];
    for (int many = 0; many < 2; ++many) {
      plain(device);
      device.set_param(p::kFollowers, many ? 4.0f : 1.0f);
      device.set_param(p::kGap, 0.2f);
      rng_state() = 0xABCDu;
      Stereo out = run(device, noise(4.0f, kRate, 0.3f));
      levels[many] = rms(out.left, 96000);
    }
    EXPECT(std::fabs(db(levels[1] / levels[0])) < 0.5, "four followers are as loud as one");
  }

  // Spread: the followers sit left and right in turn; without it each sits
  // where the line was played.
  {
    plain(device);
    device.set_param(p::kFollowers, 2.0f);
    device.set_param(p::kGap, 0.25f);
    device.set_param(p::kSpread, 1.0f);
    Stereo out = run(device, impulse(1.0f, kRate, 0.8f));
    EXPECT(std::fabs(out.left[12000]) > 0.5 && std::fabs(out.right[12000]) < 1.0e-6,
           "at full Spread the first follower is on the left");
    EXPECT(std::fabs(out.right[24000]) > 0.5 && std::fabs(out.left[24000]) < 1.0e-6,
           "at full Spread the second follower is on the right");
    plain(device);
    device.set_param(p::kFollowers, 3.0f);
    device.set_param(p::kGap, 0.25f);
    device.set_param(p::kSpread, 0.5f);
    out = run(device, impulse(1.0f, kRate, 0.8f));
    const double first = db(std::fabs(out.left[12000]) / std::fabs(out.right[12000]));
    const double second = db(std::fabs(out.left[24000]) / std::fabs(out.right[24000]));
    const double third = db(std::fabs(out.left[36000]) / std::fabs(out.right[36000]));
    EXPECT(first > 6.0 && second < -6.0 && std::fabs(first + second) < 0.01 && std::fabs(third) < 0.01,
           "half Spread: one left, one as far right, the third in the middle");
    // A line played on one side keeps both its sides when its follower moves aside.
    plain(device);
    device.set_param(p::kFollowers, 2.0f);
    device.set_param(p::kSpread, 1.0f);
    std::vector<float> one_side = impulse(1.5f, kRate, 0.8f);
    out = run(device, silence(1.5f, kRate), one_side);
    EXPECT(std::fabs(out.left[24000]) > 0.25, "a follower moved aside still plays a line from the other side");
  }

  // Tone: each follower passes one more pole than the one before, so each is
  // darker; the round is darker again.
  {
    plain(device);
    device.set_param(p::kFollowers, 4.0f);
    device.set_param(p::kGap, 0.25f);
    device.set_param(p::kTone, 2000.0f);
    rng_state() = 0x70E5u;
    std::vector<float> burst = noise(0.1f, kRate, 0.5f);
    burst.resize(static_cast<size_t>(1.5f * kRate), 0.0f);
    Stereo out = run(device, burst);
    double bright[4];
    for (int k = 0; k < 4; ++k) {
      const size_t from = static_cast<size_t>(k + 1) * 12000;
      bright[k] = energy_above(out.left, 4000.0, kRate, from, from + 4800);
    }
    std::printf("canon tone 2 kHz: share above 4 kHz %.3f, %.3f, %.3f, %.3f\n", bright[0], bright[1],
                bright[2], bright[3]);
    EXPECT(bright[1] < 0.7 * bright[0] && bright[2] < 0.7 * bright[1] && bright[3] < 0.7 * bright[2],
           "each follower is darker than the one before");
    // One pole at 2 kHz is 7 dB down at 4 kHz... measured on a tone to be sure of the slope.
    plain(device);
    device.set_param(p::kFollowers, 2.0f);
    device.set_param(p::kGap, 0.25f);
    device.set_param(p::kTone, 2000.0f);
    Stereo tone = run(device, sine(2000.0f, 1.0f, kRate, 0.5f));
    plain(other);
    other.set_param(p::kFollowers, 2.0f);
    other.set_param(p::kGap, 0.25f);
    Stereo open = run(other, sine(2000.0f, 1.0f, kRate, 0.5f));
    // First follower alone between 0.25 and 0.5 s: one pole, 3 dB down at its corner.
    const double one = db(rms(tone.left, 14400, 21600) / rms(open.left, 14400, 21600));
    EXPECT(std::fabs(one + 3.0) < 0.25, "the first follower is 3 dB down at Tone's corner: one pole");
  }

  // Gap moved while sounding: the followers cross over to their new places,
  // without a click, and then sit on the new gap.
  {
    const auto setup = [](Canon& d) {
      plain(d);
      d.set_param(p::kFollowers, 2.0f);
      d.set_param(p::kGap, 0.3f);
    };
    const std::vector<float> tone = sine(220.0f, 2.5f, kRate, 0.5f);
    const Arrival moved = arrival(setup, tone, [](Canon& d) { d.set_param(p::kGap, 0.45f); }, 0.04f);
    std::printf("canon gap moved: %.3f of the change in 8 samples, step x%.2f\n", moved.sudden, moved.step);
    EXPECT(moved.change > 0.1, "moving Gap changes the sound");
    EXPECT(moved.sudden < 0.1 && moved.step < 1.5, "moving Gap crosses over without a click");

    setup(device);
    run(device, silence(0.01f, kRate));
    run(device, impulse(0.5f, kRate, 0.5f));
    device.set_param(p::kGap, 0.45f);
    run(device, silence(0.5f, kRate));
    Stereo out = run(device, impulse(1.2f, kRate, 0.8f));
    const size_t at = peak_index(out.left, 12000, 30000);
    EXPECT(at == 21600, "after the move the first follower sits on the new gap");
  }

  // Crab, Followers and the intervals changed while sounding come in
  // gradually: every stepped control crosses over.
  {
    const auto setup = [](Canon& d) {
      plain(d);
      d.set_param(p::kFollowers, 3.0f);
      d.set_param(p::kGap, 0.2f);
      d.set_param(p::kInterval2, 7.0f);
      d.set_param(p::kSpread, 0.6f);
      d.set_param(p::kMix, 0.6f);
    };
    std::vector<float> line = sine(196.0f, 2.5f, kRate, 0.35f);
    const std::vector<float> second = sine(293.66f, 2.5f, kRate, 0.2f);
    for (size_t i = 0; i < line.size(); ++i) line[i] += second[i];
    struct Move {
      const char* name;
      int param;
      float value;
      double least;  // how much the move must change the sound to count
    };
    const Move moves[] = {
        {"Crab to All", p::kCrab, 3.0f, 0.05},
        {"Crab to Last", p::kCrab, 1.0f, 0.05},
        {"Followers down to one", p::kFollowers, 1.0f, 0.05},
        {"Followers up to four", p::kFollowers, 4.0f, 0.05},
        {"Interval 1 from unison to a fifth", p::kInterval1, 7.0f, 0.05},
        {"Interval 2 from a fifth to unison", p::kInterval2, 0.0f, 0.05},
        {"Interval 2 from a fifth to an octave down", p::kInterval2, -12.0f, 0.05},
        {"Mix to all wet", p::kMix, 1.0f, 0.05},
        {"Mix to dry", p::kMix, 0.0f, 0.05},
        {"Fade to full", p::kFade, 1.0f, 0.02},
        {"Spread to none", p::kSpread, 0.0f, 0.02},
        {"Round to its highest", p::kRound, 0.95f, 0.0},
        {"Tone to its lowest", p::kTone, 500.0f, 0.0},
    };
    for (const Move& move : moves) {
      const Arrival came = arrival(
          setup, line, [&](Canon& d) { d.set_param(move.param, move.value); }, 0.04f);
      std::printf("canon %s: %.3f of the change in 8 samples, step x%.2f, change %.3f\n", move.name,
                  came.sudden, came.step, came.change);
      char label[160];
      std::snprintf(label, sizeof label, "%s changes the sound", move.name);
      EXPECT(came.change >= move.least, label);
      std::snprintf(label, sizeof label, "%s comes in gradually, without a click", move.name);
      EXPECT(came.sudden < 0.15 && came.step < 1.5, label);
    }
  }

  // Bad input (not a number, infinite, absurdly large) leaves through the
  // line like anything else: the output is finite throughout, and once the
  // line has turned over an impulse returns as it should.
  {
    plain(device);
    device.set_param(p::kFollowers, 2.0f);
    device.set_param(p::kGap, 0.2f);
    device.set_param(p::kInterval2, 7.0f);
    device.set_param(p::kRound, 0.9f);
    device.set_param(p::kTone, 4000.0f);
    std::vector<float> bad = sine(330.0f, 0.5f, kRate, 0.5f);
    for (size_t i = 2000; i < 2400; ++i) bad[i] = std::nanf("");
    for (size_t i = 4000; i < 4400; ++i) bad[i] = (i & 1) ? INFINITY : -INFINITY;
    for (size_t i = 6000; i < 6400; ++i) bad[i] = (i & 1) ? 1.0e30f : -1.0e30f;
    Stereo during = run(device, bad);
    Stereo after = run(device, sine(330.0f, 3.0f, kRate, 0.5f));
    EXPECT(finite(during.left) && finite(during.right) && finite(after.left) && finite(after.right),
           "bad input never reaches the output as something that is not a number");
    EXPECT(peak(during.left) <= 8.0 + 2.0, "bad input is held to +18 dBFS");
    // The same passage on a device that never saw the bad samples: after the
    // round has died down the two agree.
    device.set_param(p::kRound, 0.0f);
    plain(other);
    other.set_param(p::kFollowers, 2.0f);
    other.set_param(p::kGap, 0.2f);
    other.set_param(p::kInterval2, 7.0f);
    other.set_param(p::kTone, 4000.0f);
    run(device, silence(1.0f, kRate));
    std::vector<float> phrase = silence(1.0f, kRate);
    add_note(phrase, 440.0f, 0.05f, 0.1f, 0.6f);
    Stereo recovered = run(device, phrase);
    Stereo clean = run(other, phrase);
    const double level = rms(recovered.left, 9600, 24000) / rms(clean.left, 9600, 24000);
    std::printf("canon after bad input: the first follower plays at %.3f of a clean device's level\n", level);
    EXPECT(std::fabs(level - 1.0) < 0.02 && rms(clean.left, 9600, 24000) > 0.01,
           "after bad input the followers play as on a device that never saw it");
  }

  // The device sleeps once the last follower has played, returns exact zero,
  // and wakes on new input with the gaps counted from its first sample.
  {
    plain(device);
    device.set_param(p::kFollowers, 2.0f);
    device.set_param(p::kGap, 0.5f);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 1.6f, kRate);
    EXPECT(device.asleep(), "asleep once the last follower has played and the line is blank");
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "exact silence asleep");
    EXPECT(device.meter(0) == -1.0f && device.meter(1) == 0.0f, "asleep its clock reads -1");
    Stereo woken = run(device, impulse(1.2f, kRate, 0.8f));
    EXPECT(peak_index(woken.left, 100, 48000) == 24000, "wakes on new input and plays it a gap later");
    EXPECT(peak(woken.left, 1, 24000) == 0.0, "what was played before a sleep does not come back");
  }

  // A knob moved while the device sleeps snaps on the next note: the output
  // is that of a device that had the setting from the start.
  {
    const auto prepare = [](Canon& d) {
      plain(d);
      d.set_param(p::kFollowers, 3.0f);
      d.set_param(p::kGap, 0.2f);
      d.set_param(p::kMix, 0.5f);
    };
    const auto move = [](Canon& d) {
      d.set_param(p::kMix, 0.9f);
      d.set_param(p::kInterval1, 7.0f);
      d.set_param(p::kInterval2, 0.0f);
      d.set_param(p::kFollowers, 2.0f);
      d.set_param(p::kSpread, 1.0f);
      d.set_param(p::kFade, 0.8f);
      d.set_param(p::kTone, 1500.0f);
      d.set_param(p::kRound, 0.5f);
      d.set_param(p::kCrab, 3.0f);
      d.set_param(p::kGap, 0.3f);
    };
    prepare(device);
    run(device, noise(0.1f, kRate, 0.5f));
    render(device, 1.5f, kRate);
    EXPECT(device.asleep(), "asleep before the knobs are moved");
    move(device);
    prepare(other);
    move(other);
    rng_state() = 0x1DEAu;
    const std::vector<float> note = noise(1.0f, kRate, 0.4f);
    Stereo slept = run(device, note);
    Stereo fresh = run(other, note);
    double worst = 0.0;
    for (size_t i = 0; i < note.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(slept.left[i]) - fresh.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(slept.right[i]) - fresh.right[i]));
    }
    std::printf("canon knobs moved asleep: differs from a fresh device by %g\n", worst);
    EXPECT(worst < 1.0e-6, "knobs moved while asleep snap on wake");
  }

  // The same sound at block sizes 1, 128 and 2048, across a sleep, with
  // crabs counting their gaps and the shifters splicing on their timetable.
  {
    rng_state() = 0xB10Cu;
    std::vector<float> passage = noise(0.4f, kRate, 0.4f);
    // Long enough to fall asleep: each lap of the round is 20 dB under the last.
    passage.resize(static_cast<size_t>(10.0f * kRate), 0.0f);
    std::vector<float> again = sine(330.0f, 0.5f, kRate, 0.4f);
    again.resize(static_cast<size_t>(1.2f * kRate), 0.0f);
    passage.insert(passage.end(), again.begin(), again.end());
    Stereo by_size[3];
    const int sizes[3] = {128, 1, 2048};
    for (int s = 0; s < 3; ++s) {
      device.init(kRate);
      device.set_param(p::kGap, 0.25f);
      device.set_param(p::kFollowers, 4.0f);
      device.set_param(p::kCrab, 2.0f);
      device.set_param(p::kRound, 0.1f);
      by_size[s] = run(device, passage, sizes[s]);
    }
    double worst = 0.0;
    for (int s = 1; s < 3; ++s) {
      for (size_t i = 0; i < passage.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(by_size[s].left[i]) - by_size[0].left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(by_size[s].right[i]) - by_size[0].right[i]));
      }
    }
    std::printf("canon block sizes 1, 128, 2048 across a sleep: differ by %g\n", worst);
    EXPECT(worst < 1.0e-6, "the same sound at block sizes 1, 128 and 2048, across a sleep");
    EXPECT(peak(by_size[0].left, 456000, 480000) == 0.0 && peak(by_size[0].left, 480000) > 0.05,
           "the passage did sleep in between, and woke");
  }

  // Level: at its defaults a steady sound comes out about as loud as it went
  // in, and the dry path is unity.
  {
    device.init(kRate);
    rng_state() = 0x1E7Eu;
    const std::vector<float> in = noise(12.0f, kRate, 0.25f);
    Stereo out = run(device, in);
    const double gain = db(rms(out.left, 288000) / rms(in, 288000));
    std::printf("canon defaults on steady noise: %.2f dB against the input\n", gain);
    EXPECT(gain > -1.5 && gain < 1.5, "at its defaults a steady sound keeps its level");
  }

  // 96 kHz: the gap is the same time, the interval the same pitch.
  {
    plain(device, 96000.0f);
    device.set_param(p::kGap, 7.5f);
    device.set_param(p::kFollowers, 4.0f);
    Stereo out = run(device, impulse(30.5f, 96000.0f, 0.8f));
    bool held = true;
    for (int k = 1; k <= 4; ++k) {
      if (std::fabs(out.left[static_cast<size_t>(k) * 720000] - 0.4f) > 1.0e-6f) held = false;
    }
    EXPECT(held, "at 96 kHz four followers 7.5 s apart: the last returns after thirty seconds");

    plain(device, 96000.0f);
    device.set_param(p::kGap, 7.5f);
    device.set_param(p::kFollowers, 4.0f);
    device.set_param(p::kCrab, 3.0f);
    std::vector<float> in = silence(38.0f, 96000.0f);
    in[0] = 0.8f;
    out = run(device, in);
    // The first frame is place 0 of the first gap: the fourth crab plays it
    // last in its fifth gap, 37.5 s on.
    EXPECT(std::fabs(out.left[5 * 720000 - 1] - 0.4f) < 1.0e-6f,
           "at 96 kHz the fourth crab reaches back five gaps of 7.5 s");

    plain(device, 96000.0f);
    device.set_param(p::kInterval1, -12.0f);
    out = run(device, sine(440.0f, 2.0f, 96000.0f, 0.5f));
    const double found = dominant_frequency(out.left, 96000.0, 150.0, 330.0, 96000, 192000);
    EXPECT(std::fabs(1200.0 * std::log2(found / 220.0)) < 3.0, "at 96 kHz an octave down is an octave down");
  }

  // The readings a display draws from: the clock runs with the device, the
  // line's level is what was written, each follower's level is what it plays.
  {
    plain(device);
    device.set_param(p::kFollowers, 2.0f);
    device.set_param(p::kGap, 0.5f);
    device.set_param(p::kFade, 0.5f);
    EXPECT(device.meter(0) == -1.0f, "before anything is played the clock reads -1");
    run(device, sine(440.0f, 0.3f, kRate, 0.5f));
    EXPECT(std::fabs(device.meter(0) - 0.3f) < 0.001f, "the clock counts the seconds since it woke");
    EXPECT(std::fabs(device.meter(1) - 0.5f) < 0.01f, "the line's level is the peak just written");
    EXPECT(device.meter(3) == 0.0f, "no follower has entered yet");
    EXPECT(std::fabs(device.meter(2) - 0.3f) < 0.001f, "0.3 s into the first gap");
    run(device, silence(0.4f, kRate));
    // 0.7 s: the first follower is playing the tone; together the two carry the power of one.
    const float first = 0.5f / std::sqrt(1.0f + 0.25f);
    EXPECT(std::fabs(device.meter(3) - first) < 0.01f, "the first follower's level is what it plays");
    EXPECT(device.meter(4) == 0.0f && device.meter(1) == 0.0f, "the second has not entered; the line is quiet");
    EXPECT(std::fabs(device.meter(2) - 0.2f) < 0.001f, "0.2 s into the second gap");
    run(device, silence(0.5f, kRate));
    EXPECT(std::fabs(device.meter(4) - 0.5f * first) < 0.01f, "the second follower plays 6 dB under the first");
  }

  // Cost: at the defaults, and at the worst there is: four followers, all
  // transposed, all crabs, with the round on, on noise.
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  run(device, input);
  report_cost("canon", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kFollowers, 4.0f);
  device.set_param(p::kGap, 0.3f);
  device.set_param(p::kInterval1, 12.0f);
  device.set_param(p::kInterval2, -12.0f);
  device.set_param(p::kInterval3, 7.0f);
  device.set_param(p::kInterval4, -5.0f);
  device.set_param(p::kCrab, 3.0f);
  device.set_param(p::kRound, 0.9f);
  run(device, input);
  report_cost("canon, four transposed crabs and the round", 10.0f, kRate, [&] { run(device, input); });

  return finish("canon");
}
