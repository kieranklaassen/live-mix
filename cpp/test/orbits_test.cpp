// Native harness for Orbits (cpp/devices/orbits). After the conformance pass
// it asserts what makes it Orbits: every loop brings a sound back at its own
// period, the periods are Length x (1 + Offset)^k, a pass costs Feedback and
// Wear, Hold keeps what the loops have and lets nothing in, the level hold
// keeps a full loop from building at whatever level it is played and leaves
// the new playing as it was played, an input that is all sides comes back,
// Drift moves the play heads and not the tape, and nothing clicks, chirps or
// depends on the block size when it is handled.

#include "../devices/orbits/orbits.h"

#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::Orbits;
namespace p = livemix::orbits;

static Orbits device;

static const float kRate = 48000.0f;

// Wet only, pristine loops, steady play heads, everything in the middle.
static void clean(Orbits& d, int loops, float length_seconds, float offset_percent, float feedback,
                  float rate = kRate) {
  d.init(rate);
  d.set_param(p::kLoops, static_cast<float>(loops));
  d.set_param(p::kLength, length_seconds);
  d.set_param(p::kOffset, offset_percent);
  d.set_param(p::kFeedback, feedback);
  d.set_param(p::kWear, 0.0f);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// The same with two loops, one on each side: the left channel is the first
// loop alone and the right the second, both at unity.
static void apart(Orbits& d, float length_seconds, float offset_percent, float feedback) {
  clean(d, 2, length_seconds, offset_percent, feedback);
  d.set_param(p::kSpread, 1.0f);
}

// What the header says a period is, worked out here and not by the device.
static size_t expected_period(double length_seconds, double offset_percent, int k,
                              double rate = kRate) {
  return static_cast<size_t>(
      std::floor(length_seconds * rate * std::pow(1.0 + offset_percent * 0.01, k) + 0.5));
}

static size_t peak_index(const std::vector<float>& x, size_t from, size_t to) {
  size_t best = from;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

// `total_seconds` of silence holding a tone from `at_seconds` for `seconds`
// (10 ms fades).
static std::vector<float> tone_at(float hz, float at_seconds, float seconds, float total_seconds,
                                  float gain) {
  std::vector<float> out(static_cast<size_t>(total_seconds * kRate), 0.0f);
  const size_t start = static_cast<size_t>(at_seconds * kRate);
  const size_t length = static_cast<size_t>(seconds * kRate);
  const size_t fade = 480;
  for (size_t i = 0; i < length && start + i < out.size(); ++i) {
    float g = gain;
    if (i < fade) g *= static_cast<float>(i) / fade;
    if (length - i <= fade) g *= static_cast<float>(length - i) / fade;
    out[start + i] = g * static_cast<float>(std::sin(2.0 * kPi * hz * static_cast<double>(i) / kRate));
  }
  return out;
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  const size_t n = std::min(a.size(), b.size());
  for (size_t i = 0; i < n; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return a.size() == b.size() ? worst : 1.0e9;
}

static bool finite(const Stereo& s) { return finite(s.left) && finite(s.right); }

// How suddenly an event is heard: over the 20 ms from the first sample at
// which the passage differs from the same passage without the event, the
// largest difference in the first 8 samples against the largest of all.
// Something smoothed or faded has gone a small part of the way; a jump is
// there at once. (What an event does to the record head is heard one period
// later, so the passage runs on for a period and more.) The worst of eight
// moments a little apart, so a jump cannot hide in a zero crossing. The
// passage is a chord played into loops that already hold it, `held` with
// Hold on.
template <typename Event>
static double suddenness(bool held, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const size_t before = static_cast<size_t>((1.7f + 0.0013f * static_cast<float>(trial)) * kRate);
    std::vector<float> chord(before + 31200);
    for (size_t i = 0; i < chord.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      chord[i] = static_cast<float>(0.15 * std::sin(2.0 * kPi * 220.0 * t) +
                                    0.1 * std::sin(2.0 * kPi * 1318.5 * t));
    }
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kLength, 0.5f);
      device.set_param(p::kMix, 0.6f);
      if (held) {
        run(device, std::vector<float>(chord.begin(), chord.begin() + 48000));
        device.set_param(p::kHold, 1.0f);
        run(device, std::vector<float>(chord.begin() + 48000, chord.begin() + before));
      } else {
        run(device, std::vector<float>(chord.begin(), chord.begin() + before));
      }
      if (pass == 0) event(device);
      out[pass] = run(device, std::vector<float>(chord.begin() + before, chord.end()));
    }
    std::vector<double> difference(out[0].size());
    size_t first = difference.size();
    for (size_t i = 0; i < difference.size(); ++i) {
      difference[i] = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                               std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (first == difference.size() && difference[i] > 1.0e-7) first = i;
    }
    // An event nobody hears inside a period is not what is being measured.
    if (first + 960 > difference.size()) return 1.0;
    double early = 0.0, whole = 0.0;
    for (size_t i = first; i < first + 960; ++i) {
      if (i < first + 8) early = std::max(early, difference[i]);
      whole = std::max(whole, difference[i]);
    }
    worst = std::max(worst, early / whole);
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "orbits";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 300.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // How long the default patch really rings (keeps tail_seconds honest).
  {
    device.init(kRate);
    rng_state() = 0x1234567u;
    run(device, noise(1.0f, kRate, 0.5f));
    Stereo tail = render(device, 400.0f, kRate);
    size_t last = 0;
    for (size_t i = 0; i < tail.size(); ++i) {
      if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
    }
    const double seconds = static_cast<double>(last) / kRate;
    std::printf("orbits: default patch silent %.1f s after the input stops (%.1f dB after 20 s)\n",
                seconds, db(rms(tail.left, 19 * 48000, 21 * 48000)));
    EXPECT(seconds > 60.0 && seconds < 300.0, "the default tail ends within tail_seconds, not instantly");
  }

  // 1. Every loop brings an impulse back at its own period, for three
  // offsets, and the periods are Length x (1 + Offset)^k to the sample.
  for (float offset : {0.1f, 1.5f, 30.0f}) {
    clean(device, 5, 0.5f, offset, 0.0f);
    Stereo out = run(device, impulse(2.0f, kRate, 0.4f));
    const double share = 0.4 / std::sqrt(5.0);
    bool there = true, exact = true;
    double elsewhere = 0.0;
    std::vector<float> rest = out.left;
    for (int k = 0; k < 5; ++k) {
      const size_t at = expected_period(0.5, offset, k);
      if (std::fabs(out.left[at] - share) > 1.0e-6) there = false;
      if (static_cast<double>(at) != Orbits::period(k, 5, 0.5, offset, kRate)) exact = false;
      rest[at] = 0.0f;
    }
    elsewhere = peak(rest);
    char label[160];
    std::snprintf(label, sizeof label, "Offset %.1f %%: each of five loops returns the impulse at its period",
                  offset);
    EXPECT(there, label);
    std::snprintf(label, sizeof label, "Offset %.1f %%: nothing comes back anywhere else (%g)", offset,
                  elsewhere);
    EXPECT(elsewhere < 1.0e-9, label);
    EXPECT(exact, "the device's own period() is Length x (1 + Offset)^k");
    EXPECT(worst_difference(out, Stereo{out.right, out.left}) == 0.0,
           "Spread 0: every loop is in the middle");
  }

  // 2. Loops sets how many come back, and their sum is scaled by 1/sqrt(n):
  // n returns of 1/sqrt(n) each.
  for (int loops = 2; loops <= 5; ++loops) {
    clean(device, loops, 0.5f, 20.0f, 0.0f);
    Stereo out = run(device, impulse(1.5f, kRate, 0.4f));
    int returns = 0;
    for (size_t i = 1; i < out.size(); ++i) {
      if (std::fabs(out.left[i]) > 0.01) {
        ++returns;
        EXPECT_NEAR(out.left[i], 0.4 / std::sqrt(static_cast<double>(loops)), 1.0e-6,
                    "each return is the impulse over sqrt(loops)");
      }
    }
    EXPECT(returns == loops, "Loops: as many returns as loops");
  }

  // 3. Feedback is what is kept per pass: the m-th return is Feedback^(m-1).
  for (float feedback : {0.5f, 0.8f}) {
    apart(device, 0.5f, 10.0f, feedback);
    Stereo out = run(device, impulse(2.4f, kRate, 0.4f));
    const size_t n = expected_period(0.5, 10.0, 0);
    const size_t m = expected_period(0.5, 10.0, 1);
    EXPECT_NEAR(out.left[n], 0.4, 1.0e-6, "the first return is at the level played");
    EXPECT_NEAR(out.left[2 * n] / out.left[n], feedback, 1.0e-5, "the second is Feedback of it");
    EXPECT_NEAR(out.left[3 * n] / out.left[2 * n], feedback, 1.0e-5, "and the third Feedback of that");
    EXPECT_NEAR(out.left[4 * n] / out.left[n], feedback * feedback * feedback, 1.0e-5,
                "pass after pass");
    EXPECT_NEAR(out.right[2 * m] / out.right[m], feedback, 1.0e-5,
                "the second loop keeps the same share, at its own period");
    EXPECT(std::fabs(out.left[m]) < 1.0e-9 && std::fabs(out.right[n]) < 1.0e-9,
           "Spread 1 with two loops: one loop on each side");
  }

  // 4. Two loops a tenth of a percent apart slide apart by the same number
  // of samples every pass: 48 at one second.
  {
    clean(device, 2, 1.0f, 0.1f, 0.9f);
    Stereo out = run(device, impulse(6.5f, kRate, 0.4f));
    bool slides = true;
    for (size_t pass = 1; pass <= 6; ++pass) {
      const size_t first = peak_index(out.left, pass * 48000 - 10, pass * 48000 + 10);
      const size_t second = peak_index(out.left, pass * 48000 + 20, pass * 48000 + 400);
      if (first != pass * 48000 || second - first != 48 * pass) slides = false;
    }
    EXPECT(slides, "0.1 % apart at 1 s: the copies are 48 samples further apart every pass");
  }

  // 5. Hold stops the loops listening and keeps what they hold, exactly.
  {
    std::vector<float> first = tone_at(330.0f, 0.0f, 0.3f, 1.5f, 0.3f);
    std::vector<float> later = sine(1000.0f, 6.0f, kRate, 0.4f);
    const size_t n = expected_period(0.5, 10.0, 0);
    const size_t m = expected_period(0.5, 10.0, 1);
    Stereo heard[3];
    for (int which = 0; which < 3; ++which) {
      apart(device, 0.5f, 10.0f, 0.6f);
      device.set_param(p::kWear, 0.5f);
      run(device, first);
      device.set_param(p::kHold, which == 0 ? 0.0f : 1.0f);
      render(device, 1.0f, kRate);  // the switch takes 20 ms
      heard[which] = which == 2 ? render(device, 6.0f, kRate) : run(device, later);
    }
    const Stereo& held = heard[2];
    EXPECT(rms(held.left, 0, n) > 0.01 && rms(held.right, 0, m) > 0.01, "Hold: the loops keep turning");
    double worst = 0.0;
    for (size_t i = 0; i + 10 * n < held.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(held.left[i + 10 * n]) - held.left[i]));
    }
    for (size_t i = 0; i + 5 * m < held.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(held.right[i + 5 * m]) - held.right[i]));
    }
    EXPECT(worst == 0.0, "Hold: ten passes later each loop is the same to the bit, Feedback and Wear set aside");
    // (At Mix 1 the table's cosine leaves the dry signal at 1e-16.)
    EXPECT(worst_difference(heard[1], held) < 1.0e-12,
           "Hold: the loops are the same whether or not anything is played");
    EXPECT(tone_level(heard[0].left, 1000.0, kRate, 96000, 192000) > 0.3,
           "Hold off: the same playing is recorded");
    EXPECT(rms(heard[0].left, 5 * 48000) > 0.1 && tone_level(heard[0].left, 330.0, kRate, 5 * 48000) < 0.01,
           "Hold off: and the first layer has faded under it");
    // Let go, the loops fade again and listen again.
    device.set_param(p::kHold, 0.0f);
    render(device, 0.5f, kRate);
    Stereo after = run(device, tone_at(700.0f, 0.0f, 0.2f, 3.0f, 0.3f));
    EXPECT(tone_level(after.left, 700.0, kRate, n, n + 9600) > 0.2, "Hold off again: the loops listen");
    EXPECT(rms(after.left, 5 * n + 9600, 6 * n) < 0.5 * rms(after.left, n + 9600, 2 * n),
           "Hold off again: and what they held fades");
  }

  // Hold keeps loud loops as well as soft ones: loops played full at
  // Feedback 1, to where the record limiter works, are the same to the bit
  // sixty passes later.
  {
    apart(device, 0.5f, 10.0f, 1.0f);
    rng_state() = 0xA11CEu;
    std::vector<float> loud = sine(220.0f, 4.0f, kRate, 0.9f);
    const std::vector<float> hiss = noise(4.0f, kRate, 0.5f);
    for (size_t i = 0; i < loud.size(); ++i) loud[i] += hiss[i];
    run(device, loud);
    device.set_param(p::kHold, 1.0f);
    render(device, 1.0f, kRate);
    Stereo held = render(device, 32.0f, kRate);
    const size_t n = expected_period(0.5, 10.0, 0);
    const size_t m = expected_period(0.5, 10.0, 1);
    double worst = 0.0;
    for (size_t i = 0; i < n; ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(held.left[i + 60 * n]) - held.left[i]));
    }
    for (size_t i = 0; i < m; ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(held.right[i + 50 * m]) - held.right[i]));
    }
    std::printf("orbits: loud loops on Hold: peak %.3f, worst difference after 60 passes %g\n",
                peak(held.left, 0, n), worst);
    EXPECT(peak(held.left, 0, n) > 0.9, "Hold: the loops were played full");
    EXPECT(worst == 0.0, "Hold: a loop played full is the same to the bit sixty passes later");
  }

  // 6. Feedback 1 holds too while nothing is played: 60 passes later the
  // layer is where it was and no pass was louder.
  {
    apart(device, 0.5f, 10.0f, 1.0f);
    Stereo out = run(device, tone_at(330.0f, 0.0f, 0.3f, 31.0f, 0.25f));
    const size_t n = expected_period(0.5, 10.0, 0);
    const double first = rms(out.left, n, 2 * n);
    double lowest = 1.0e9, highest = 0.0;
    for (size_t pass = 1; pass <= 60; ++pass) {
      const double level = rms(out.left, pass * n, (pass + 1) * n);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    EXPECT(first > 0.05, "the held layer is there");
    EXPECT(lowest == first && highest == first, "Feedback 1, Wear 0: every one of 60 passes at the same level");
  }

  // 7. The level hold: playing on into loops at Feedback 1 does not build,
  // at whatever level it is played. A loop comes to hold twice the power of
  // the playing and no more, and when the playing stops it keeps what it has.
  {
    double held[2] = {0.0, 0.0};
    int which = 0;
    for (float gain : {0.25f, 0.03125f}) {
      apart(device, 0.5f, 10.0f, 1.0f);
      Stereo out = run(device, sine(220.0f, 60.0f, kRate, gain));
      const double early = peak(out.left, 24000, 48000) / gain;
      const double late = peak(out.left, 58 * 48000, 59 * 48000) / gain;
      held[which++] = late;
      std::printf("orbits: a %.3f tone into Feedback 1: the loop peaks at %.3f of it after one pass, %.3f after a minute\n",
                  gain, early, late);
      EXPECT_NEAR(early, 1.0, 1.0e-4, "level hold: the first pass is the tone as played");
      EXPECT_NEAR(late, std::sqrt(2.0), 0.04,
                  "level hold: after a minute the loop holds twice the power of the playing");
      Stereo rest = render(device, 30.0f, kRate);
      const double then = rms(rest.left, 3 * 48000, 4 * 48000);
      const double much_later = rms(rest.left, 28 * 48000, 29 * 48000);
      EXPECT(then == much_later, "level hold: with nothing coming in the loop keeps its level, to the bit");
      EXPECT(then > 0.7 * gain, "level hold: and that is the loop that was playing, not a faded one");
    }
    EXPECT_NEAR(held[1] / held[0], 1.0, 1.0e-3, "level hold: the same at an eighth of the level");

    // Notes and gaps, quietly: the loops fill, then stay where they are, and
    // four times the level in is four times the level out.
    rng_state() = 0xB0B0u;
    std::vector<float> bursts(static_cast<size_t>(60.0f * kRate), 0.0f);
    for (size_t burst = 0; burst * 19200 + 7200 <= bursts.size(); ++burst) {
      for (size_t i = 0; i < 7200; ++i) {
        const float fade = i < 480 ? static_cast<float>(i) / 480.0f : i >= 6720 ? static_cast<float>(7200 - i) / 480.0f : 1.0f;
        bursts[burst * 19200 + i] = 0.05f * fade * white();
      }
    }
    std::vector<float> louder = bursts;
    for (float& v : louder) v *= 4.0f;
    apart(device, 0.5f, 10.0f, 1.0f);
    Stereo quiet = run(device, bursts);
    apart(device, 0.5f, 10.0f, 1.0f);
    Stereo loud = run(device, louder);
    const double played = rms(bursts, 480, 6720);
    const double sooner = rms(quiet.left, 20 * 48000, 30 * 48000);
    const double later = rms(quiet.left, 50 * 48000, 60 * 48000);
    std::printf("orbits: bursts of %.4f into Feedback 1: the loop holds %.4f after 20 s, %.4f after 50 s\n",
                played, sooner, later);
    EXPECT(later > 0.8 * played, "level hold: quiet playing fills the loop");
    EXPECT(later < 1.8 * played, "level hold: and leaves it near twice the power of the playing, not at a fixed ceiling");
    EXPECT(std::fabs(db(later / sooner)) < 1.0, "level hold: it does not creep up over a minute");
    double apart_by = 0.0;
    for (size_t i = 0; i < quiet.size(); ++i) {
      apart_by = std::max(apart_by, std::fabs(4.0 * quiet.left[i] - loud.left[i]));
    }
    EXPECT(apart_by < 1.0e-6, "level hold: four times the playing is four times the loop, sample for sample");

    // It does not pump: under a held chord the share of a pass that is kept
    // is steady. (With two loops a side apart the left channel is the first
    // loop's tape one period ago, so what was written is on it one period
    // later, and the share is what was written less the playing, over the
    // tape.)
    {
      apart(device, 0.5f, 10.0f, 1.0f);
      std::vector<float> chord(static_cast<size_t>(30.5f * kRate));
      for (size_t i = 0; i < chord.size(); ++i) {
        const double t = static_cast<double>(i) / kRate;
        chord[i] = static_cast<float>(0.11 * std::sin(2.0 * kPi * 220.0 * t) + 0.1 * std::sin(2.0 * kPi * 277.18 * t) +
                                      0.1 * std::sin(2.0 * kPi * 349.23 * t));
      }
      Stereo out = run(device, chord);
      const size_t n = expected_period(0.5, 10.0, 0);
      const double floor = 0.25 * peak(out.left, 20 * 48000, 30 * 48000);
      double mean_swing = 0.0, worst_swing = 0.0, mean_share = 0.0;
      int windows = 0;
      for (size_t at = 20 * 48000; at + 12000 <= 30 * 48000; at += 12000) {
        double lowest = 1.0e9, highest = -1.0e9;
        for (size_t i = at; i < at + 12000; ++i) {
          if (std::fabs(out.left[i]) < floor) continue;
          const double share = db(std::fabs((static_cast<double>(out.left[i + n]) - chord[i]) / out.left[i]));
          lowest = std::min(lowest, share);
          highest = std::max(highest, share);
        }
        mean_swing += highest - lowest;
        mean_share += 0.5 * (highest + lowest);
        worst_swing = std::max(worst_swing, highest - lowest);
        ++windows;
      }
      mean_swing /= windows;
      mean_share /= windows;
      std::printf("orbits: under a held chord a pass is kept at %.2f dB, moving %.2f dB inside a quarter second (worst %.2f)\n",
                  mean_share, mean_swing, worst_swing);
      EXPECT(mean_share < -1.0, "level hold: the chord presses the old layers down");
      EXPECT(worst_swing < 0.5, "level hold: evenly, not riding the chord");
    }

    // Nor does it touch the playing: a loud note into an empty loop comes
    // back sample for sample, and a note played over a full loop comes back
    // at the level it was played.
    {
      apart(device, 0.5f, 10.0f, 0.8f);
      const std::vector<float> note = tone_at(440.0f, 0.0f, 0.3f, 1.2f, 0.9f);
      Stereo out = run(device, note);
      const size_t n = expected_period(0.5, 10.0, 0);
      double worst = 0.0;
      for (size_t i = 0; i < 14400; ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(out.left[n + i]) - note[i]));
      }
      EXPECT(worst < 1.0e-6, "level hold: a loud note comes back as it was played, attack and all");

      apart(device, 0.5f, 10.0f, 1.0f);
      run(device, sine(220.0f, 10.0f, kRate, 0.2f));
      std::vector<float> over = sine(220.0f, 1.0f, kRate, 0.2f);
      const std::vector<float> struck = tone_at(1000.0f, 0.2f, 0.1f, 1.0f, 0.4f);
      for (size_t i = 0; i < over.size(); ++i) over[i] += struck[i];
      Stereo full = run(device, over);
      const double back = tone_level(full.left, 1000.0, kRate, n + 10080, n + 13920);
      std::printf("orbits: a 0.4 note over a full loop comes back at %.3f\n", back);
      EXPECT_NEAR(back, 0.4, 0.012, "level hold: a note over a full loop is recorded at the level played");
    }

    // Full scale, five loops, everything that can add up: bounded.
    clean(device, 5, 0.25f, 0.1f, 1.0f);
    device.set_param(p::kWear, 1.0f);
    Stereo tone = run(device, sine(110.0f, 30.0f, kRate, 1.0f));
    std::printf("orbits: full-scale tone into five loops at Feedback 1 peaks at %.3f\n", peak(tone.left));
    EXPECT(finite(tone) && peak(tone.left) < 3.4 && peak(tone.right) < 3.4,
           "full scale into five held loops stays bounded");
    EXPECT(rms(tone.left, 29 * 48000) > 0.1, "and keeps sounding");
    rng_state() = 0xFACEu;
    clean(device, 5, 0.25f, 30.0f, 1.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo hiss = run(device, noise(30.0f, kRate, 1.0f));
    std::printf("orbits: full-scale noise into five loops at Feedback 1 peaks at %.3f\n", peak(hiss.left));
    EXPECT(finite(hiss) && peak(hiss.left) < 3.4 && peak(hiss.right) < 3.4,
           "full-scale noise into five held loops stays bounded");
  }

  // 8. Wear: the first return is clean, and every later pass has less treble.
  // Without it every pass has the same.
  {
    rng_state() = 0xC0FFEEu;
    std::vector<float> burst = noise(0.2f, kRate, 0.3f);
    const double played = energy_above(burst, 3000.0, kRate);
    burst.resize(static_cast<size_t>(9.0f * kRate), 0.0f);
    double share[2][4];
    int row = 0;
    for (float wear : {0.0f, 0.6f}) {
      apart(device, 1.0f, 10.0f, 0.9f);
      device.set_param(p::kWear, wear);
      Stereo out = run(device, burst);
      int column = 0;
      for (size_t pass : {1u, 2u, 4u, 8u}) {
        share[row][column++] = energy_above(out.left, 3000.0, kRate, pass * 48000, pass * 48000 + 9600);
      }
      ++row;
    }
    EXPECT_NEAR(share[0][0] / played, 1.0, 0.01, "the first return is what was played");
    EXPECT(std::fabs(share[0][3] / share[0][0] - 1.0) < 0.01, "Wear 0: a pass does not change the tone");
    EXPECT_NEAR(share[1][0] / played, 1.0, 0.01, "Wear: the first return is still clean");
    EXPECT(share[1][1] < 0.8 * share[1][0] && share[1][2] < 0.6 * share[1][1] &&
               share[1][3] < 0.6 * share[1][2],
           "Wear: treble falls pass after pass");
  }
  {
    // And it presses a loud layer down (saturation), which Wear 0 does not.
    std::vector<float> tone = tone_at(300.0f, 0.0f, 0.6f, 8.5f, 0.45f);
    apart(device, 1.0f, 10.0f, 1.0f);
    Stereo pristine = run(device, tone);
    apart(device, 1.0f, 10.0f, 1.0f);
    device.set_param(p::kWear, 1.0f);
    Stereo worn = run(device, tone);
    EXPECT(rms(worn.left, 7 * 48000, 7 * 48000 + 28800) <
               0.9 * rms(pristine.left, 7 * 48000, 7 * 48000 + 28800),
           "Wear: a loud layer is pressed down pass after pass");
  }

  // 9. Drift moves each loop's play head on its own: a steady tone comes
  // back bent, differently on each loop, and nothing of it is on the tape.
  {
    std::vector<float> tone = sine(1000.0f, 24.0f, kRate, 0.25f);
    apart(device, 1.0f, 0.1f, 0.0f);
    Stereo steady = run(device, tone);
    apart(device, 1.0f, 0.1f, 0.0f);
    device.set_param(p::kDrift, 1.0f);
    Stereo bent = run(device, tone);
    EXPECT_NEAR(tone_level(steady.left, 1000.0, kRate, 96000), 0.25, 0.001,
                "Drift 0: a loop plays a tone as that tone");
    double furthest_left = 0.0, furthest_apart = 0.0;
    for (size_t at = 2; at + 2 <= 24; at += 2) {
      const double left = dominant_frequency(bent.left, kRate, 980.0, 1020.0, at * 48000, (at + 2) * 48000);
      const double right = dominant_frequency(bent.right, kRate, 980.0, 1020.0, at * 48000, (at + 2) * 48000);
      furthest_left = std::max(furthest_left, std::fabs(left - 1000.0));
      furthest_apart = std::max(furthest_apart, std::fabs(left - right));
    }
    std::printf("orbits: Drift 1 bends a 1 kHz tone by up to %.2f Hz, the two loops up to %.2f Hz apart\n",
                furthest_left, furthest_apart);
    EXPECT(furthest_left > 0.5 && furthest_left < 6.0, "Drift: the pitch floats, by cents and not more");
    EXPECT(furthest_apart > 0.5, "Drift: each loop floats on its own");
    EXPECT_NEAR(rms(bent.left, 96000), rms(steady.left, 96000), 0.003, "Drift does not change the level");
    // Taken away again, the loops play exactly what a steady machine holds.
    Stereo tails[2];
    for (int which = 0; which < 2; ++which) {
      apart(device, 1.0f, 0.1f, 1.0f);
      device.set_param(p::kDrift, which == 0 ? 1.0f : 0.0f);
      run(device, tone_at(1000.0f, 0.0f, 3.0f, 4.0f, 0.2f));
      device.set_param(p::kDrift, 0.0f);
      render(device, 14.0f, kRate);  // the play heads move with a 0.5 s lag and land exactly
      tails[which] = render(device, 1.2f, kRate);
    }
    EXPECT(rms(tails[1].left) > 0.1, "the tone is still on the loop");
    EXPECT(worst_difference(tails[0], tails[1]) == 0.0, "Drift is not recorded: the tape is the same");
  }

  // 10. Spread lays the loops out from the middle outward and keeps the power.
  {
    const size_t a = expected_period(0.5, 20.0, 0);
    const size_t b = expected_period(0.5, 20.0, 1);
    const size_t c = expected_period(0.5, 20.0, 2);
    clean(device, 3, 0.5f, 20.0f, 0.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo wide = run(device, impulse(1.2f, kRate, 0.4f));
    const double share = 0.4 / std::sqrt(3.0);
    EXPECT_NEAR(wide.left[a], share, 1.0e-6, "three loops: the first is in the middle, at unity");
    EXPECT_NEAR(wide.right[a], share, 1.0e-6, "on both sides");
    EXPECT(std::fabs(wide.left[b] - share * std::sqrt(2.0)) < 1.0e-6 && std::fabs(wide.right[b]) < 1.0e-7,
           "the second is on the left");
    EXPECT(std::fabs(wide.right[c] - share * std::sqrt(2.0)) < 1.0e-6 && std::fabs(wide.left[c]) < 1.0e-7,
           "the third is on the right");
    device.init(kRate);
    clean(device, 3, 0.5f, 20.0f, 0.0f);
    device.set_param(p::kSpread, 0.5f);
    Stereo half = run(device, impulse(1.2f, kRate, 0.4f));
    EXPECT(half.left[b] > 1.5 * half.right[b] && half.right[b] > 0.02, "Spread 0.5: half way out");
    EXPECT_NEAR(half.left[b] * half.left[b] + half.right[b] * half.right[b], 2.0 * share * share, 1.0e-6,
                "at the same power");
  }

  // A loop is mono and hears the middle of the input and half of its sides,
  // from the side it stands on: a sound on one side is louder in the loop on
  // that side, and an input that is all sides does not vanish.
  {
    const size_t n = expected_period(0.5, 10.0, 0);
    const size_t m = expected_period(0.5, 10.0, 1);
    const std::vector<float> click = impulse(1.2f, kRate, 0.4f);
    const std::vector<float> nothing(click.size(), 0.0f);
    std::vector<float> turned = click;
    for (float& v : turned) v = -v;
    apart(device, 0.5f, 10.0f, 0.0f);
    Stereo one_side = run(device, click, nothing);
    EXPECT_NEAR(one_side.left[n], 0.3, 1.0e-6, "the loop on the left hears three quarters of a sound on the left");
    EXPECT_NEAR(one_side.right[m], 0.1, 1.0e-6, "and the loop on the right a quarter of it");
    apart(device, 0.5f, 10.0f, 0.0f);
    Stereo sides = run(device, click, turned);
    EXPECT_NEAR(sides.left[n], 0.2, 1.0e-6, "an input that is all sides comes back: half of it in the left loop");
    EXPECT_NEAR(sides.right[m], -0.2, 1.0e-6, "and half of it, as the right had it, in the right loop");
    clean(device, 3, 0.5f, 20.0f, 0.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo three = run(device, click, turned);
    EXPECT(std::fabs(three.left[expected_period(0.5, 20.0, 0)]) < 1.0e-9, "the loop in the middle hears the middle alone");
    EXPECT(std::fabs(three.left[expected_period(0.5, 20.0, 1)]) > 0.1 &&
               std::fabs(three.right[expected_period(0.5, 20.0, 2)]) > 0.1,
           "and the loops either side of it have the sides");
  }

  // 11. Length and Offset move the taps. A short way is wound like tape:
  // no click, the pitch bent by half an octave at most while the tap moves.
  // A long way is cut over: no click and no bend at all. Afterwards a pass
  // takes the new period to the sample.
  {
    const double own_step = 0.2 * 2.0 * kPi * 220.0 / kRate;
    const std::vector<float> tone = sine(220.0f, 6.0f, kRate, 0.2f);
    // Wound: 0.2 s of tape either way. (The wet is the tape under the tap.)
    apart(device, 1.0f, 10.0f, 0.5f);
    run(device, sine(220.0f, 4.0f, kRate, 0.2f));
    device.set_param(p::kLength, 1.2f);
    Stereo longer = run(device, tone);
    device.set_param(p::kLength, 1.0f);
    Stereo shorter = run(device, tone);
    device.set_param(p::kOffset, 25.0f);
    Stereo wider = run(device, tone);
    const double down = dominant_frequency(longer.left, kRate, 60.0, 1000.0, 4800, 16800);
    const double up = dominant_frequency(shorter.left, kRate, 60.0, 1000.0, 2400, 9600);
    std::printf("orbits: a tap wound 0.2 s: 220 Hz plays at %.1f Hz while the loop grows, %.1f Hz while it shrinks\n",
                down, up);
    std::printf("orbits: largest step while the taps are wound: %.4f longer, %.4f shorter, %.4f offset (steady tone %.4f)\n",
                max_step(longer.left), max_step(shorter.left), max_step(wider.right), own_step);
    // Summed passes of a 0.2 tone reach 0.4, and the tape runs at 1.41 at most.
    EXPECT(max_step(longer.left) < 3.0 * own_step, "lengthening the loops a little does not click");
    EXPECT(max_step(shorter.left) < 4.5 * own_step, "shortening the loops a little does not click");
    EXPECT(max_step(wider.right) < 3.0 * own_step, "moving Offset does not click");
    EXPECT(max_step(wider.left) < 3.0 * own_step, "and leaves the first loop alone");
    EXPECT(down > 220.0 * 0.70 && down < 220.0 * 0.75, "a growing loop plays half an octave down and no further");
    EXPECT(up > 220.0 * 1.36 && up < 220.0 * 1.42, "a shrinking loop plays half an octave up and no further");
    EXPECT_NEAR(dominant_frequency(longer.left, kRate, 100.0, 1000.0, 240000, 288000), 220.0, 0.5,
                "and the pitch comes back when the tap stops");

    // Cut over: from 2 s to a quarter of a second, to 4 s, to half a second,
    // with a tone in the loops (233 Hz, so the two taps of a cut are out of
    // step with each other). Nothing but that tone is heard: wound at four
    // times the speed it would be two octaves up for seconds.
    const std::vector<float> other = sine(233.0f, 6.0f, kRate, 0.2f);
    const double other_step = 0.2 * 2.0 * kPi * 233.0 / kRate;
    apart(device, 2.0f, 10.0f, 0.9f);
    Stereo before = run(device, other);
    const double usual = energy_above(before.left, 600.0, kRate, 4 * 48000, 5 * 48000);
    double worst_step = 0.0, furthest = 0.0, brightest = 0.0, thinnest = 1.0e9;
    double level_before = rms(before.left, before.size() - 4800, before.size());
    for (float length : {0.25f, 4.0f, 0.5f}) {
      device.set_param(p::kLength, length);
      Stereo cut = run(device, other);
      worst_step = std::max(worst_step, std::max(max_step(cut.left), max_step(cut.right)));
      for (size_t at = 0; at + 9600 <= 96000; at += 4800) {
        furthest = std::max(furthest,
                            std::fabs(dominant_frequency(cut.left, kRate, 60.0, 2000.0, at, at + 9600) - 233.0));
        brightest = std::max(brightest, energy_above(cut.left, 600.0, kRate, at, at + 9600));
        brightest = std::max(brightest, energy_above(cut.right, 600.0, kRate, at, at + 9600));
      }
      // The 100 ms that hold the crossfade, against the 100 ms before it.
      // (Later the level is the new loop's own: a tone and a loop that is
      // not a whole number of its cycles long partly cancel.)
      thinnest = std::min(thinnest, rms(cut.left, 0, 4800) / level_before);
      level_before = rms(cut.left, cut.size() - 4800, cut.size());
    }
    std::printf("orbits: three cuts with a 233 Hz tone in the loops: furthest from it %.2f Hz, share above 600 Hz at most %.3f (the tone alone %.3f), largest step %.4f (the tone's %.4f), level across a cut at least %.2f of before\n",
                furthest, brightest, usual, worst_step, other_step, thinnest);
    EXPECT(worst_step < 3.0 * other_step, "a long move of Length does not click");
    EXPECT(furthest < 12.0, "a long move of Length does not bend the pitch: the tone stays the tone");
    EXPECT(brightest < 1.5 * usual, "and nothing higher is heard while it cuts over");
    EXPECT(thinnest > 0.5, "nor a hole where it cuts");

    clean(device, 3, 1.0f, 10.0f, 0.0f);
    run(device, sine(220.0f, 0.5f, kRate, 0.2f));
    device.set_param(p::kLength, 0.6f);
    device.set_param(p::kOffset, 5.0f);
    render(device, 8.0f, kRate);
    Stereo out = run(device, impulse(1.0f, kRate, 0.4f));
    bool lands = true;
    for (int k = 0; k < 3; ++k) {
      if (std::fabs(out.left[expected_period(0.6, 5.0, k)] - 0.4 / std::sqrt(3.0)) > 1.0e-6) lands = false;
    }
    EXPECT(lands, "after Length and Offset move, each loop returns at its new period exactly");
  }

  // 12. Nothing clicks when it is handled: every event arrives gradually.
  {
    struct Event {
      int param;
      float value;
      const char* what;
    };
    const Event events[] = {
        {p::kHold, 1.0f, "Hold switched on starts gradually"},
        {p::kLoops, 5.0f, "Loops turned up starts gradually"},
        {p::kLoops, 2.0f, "Loops turned down starts gradually"},
        {p::kLength, 0.25f, "Length pulled down starts gradually"},
        {p::kLength, 12.0f, "Length pushed up starts gradually"},
        {p::kOffset, 30.0f, "Offset pushed up starts gradually"},
        {p::kFeedback, 0.0f, "Feedback pulled down starts gradually"},
        {p::kFeedback, 1.0f, "Feedback pushed up starts gradually"},
        {p::kMix, 0.0f, "Mix pulled down starts gradually"},
        {p::kMix, 1.0f, "Mix pushed up starts gradually"},
        {p::kSpread, 0.0f, "Spread pulled in starts gradually"},
        {p::kWear, 1.0f, "Wear pushed up starts gradually"},
        {p::kDrift, 1.0f, "Drift pushed up starts gradually"},
    };
    for (const Event& event : events) {
      const double sudden = suddenness(false, [&](Orbits& d) { d.set_param(event.param, event.value); });
      if (!(sudden < 0.15)) std::printf("orbits: %s: %.3f of it is there after 8 samples\n", event.what, sudden);
      EXPECT(sudden < 0.15, event.what);
    }
    const double let_go = suddenness(true, [](Orbits& d) { d.set_param(p::kHold, 0.0f); });
    EXPECT(let_go < 0.15, "Hold switched off starts gradually");
  }

  // 13. Mix 0 is the input, sample for sample; at defaults the device is not
  // louder than what goes in by more than a few dB.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xD00Du;
    std::vector<float> left = noise(2.5f, kRate, 0.9f);
    std::vector<float> right = sine(440.0f, 2.5f, kRate, 0.5f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 passes the input through, sample for sample");

    device.init(kRate);
    rng_state() = 0xABCDu;
    std::vector<float> pink = noise(30.0f, kRate, 0.25f);
    Stereo loud = run(device, pink);
    const double over = db(rms(loud.left, 20 * 48000) / rms(pink, 20 * 48000));
    std::printf("orbits: at defaults, 30 s of noise comes out %.1f dB over the input\n", over);
    EXPECT(over > -1.0 && over < 4.0, "defaults: within a few dB of the input");
  }

  // 14. Bad input: samples that are not numbers or are absurd do not stay in
  // the loops, and the device works as before once good input returns.
  {
    apart(device, 0.25f, 10.0f, 0.5f);
    std::vector<float> bad(24000, 0.0f);
    for (size_t i = 0; i < bad.size(); ++i) {
      bad[i] = i % 3 == 0 ? std::nanf("") : i % 3 == 1 ? std::numeric_limits<float>::infinity() : -1.0e30f;
    }
    Stereo during = run(device, bad);
    Stereo after = render(device, 12.0f, kRate);
    EXPECT(finite(during) && peak(during.left) <= 4.0 && peak(during.right) <= 4.0,
           "bad input: what comes out is a number and bounded");
    EXPECT(finite(after), "bad input: finite afterwards");
    EXPECT(peak(after.left, 0, 12000) > 0.3, "bad input: the loop took it as a loud sample, levelled");
    EXPECT(peak(after.left, 10 * 48000) == 0.0, "bad input: and it fades to rest like any other, not stuck");
    Stereo again = run(device, impulse(0.6f, kRate, 0.4f));
    EXPECT_NEAR(again.left[12000], 0.4, 1.0e-6, "bad input: a loop returns an impulse as before");
    EXPECT_NEAR(again.left[24000], 0.2, 1.0e-6, "bad input: at Feedback per pass as before");
  }

  // 15. Rest. Loops that have faded go to exact zero and start blank; a loop
  // that holds sound keeps the device awake for as long as it is left.
  {
    apart(device, 0.5f, 10.0f, 0.3f);
    run(device, noise(0.2f, kRate, 0.5f));
    Stereo fade = render(device, 12.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "at rest once the loops have faded");
    size_t last = 0;
    for (size_t i = 0; i < fade.size(); ++i) {
      if (fade.left[i] != 0.0f || fade.right[i] != 0.0f) last = i;
    }
    // Thirteen passes to fall under -140 dB, then one more period of blank tape.
    EXPECT(last > 6 * 48000 && last < 9 * 48000, "it rests a period after the last pass, not before");
    for (int index = 0; index < 5; ++index) {
      EXPECT(device.meter(index) == -1.0f && device.meter(index + 5) == 0.0f,
             "at rest the display's readings are at rest");
    }
    Stereo woken = run(device, impulse(1.2f, kRate, 0.4f));
    EXPECT(peak(woken.left, 1, 23990) == 0.0, "it starts again with blank loops");
    EXPECT_NEAR(woken.left[24000], 0.4, 1.0e-6, "and loops again");
    EXPECT_NEAR(device.meter(0), 0.4, 1.0e-4, "the first loop's head is where 1.2 s of 0.5 s turns puts it");
    EXPECT(device.meter(2) == -1.0f && device.meter(1) >= 0.0f, "a loop that is off reads off");

    apart(device, 12.0f, 30.0f, 1.0f);
    run(device, tone_at(330.0f, 0.0f, 0.3f, 1.0f, 0.3f));
    Stereo quiet = render(device, 10.0f, kRate);
    Stereo back = render(device, 3.0f, kRate);
    EXPECT(peak(quiet.left) == 0.0, "a 12 s loop is silent between passes of a short note");
    EXPECT_NEAR(rms(back.left, 48000, 62400), 0.3 / std::sqrt(2.0), 0.01,
                "and has not gone to rest: the note returns after 12 s");
    render(device, 180.0f, kRate);
    Stereo much_later = render(device, 16.0f, kRate);
    EXPECT(rms(much_later.left) > 0.01 && rms(much_later.right) > 0.01,
           "held loops are still turning minutes later");
  }

  // The readings a display draws. What a loop holds is on its third
  // reading for as long as it holds it, whoever was watching when it was
  // played; the level at its record head falls to nothing, not to a number
  // too small to be a number.
  {
    apart(device, 12.0f, 30.0f, 1.0f);
    run(device, tone_at(330.0f, 0.2f, 0.3f, 1.0f, 0.5f));
    EXPECT_NEAR(device.meter(10), 0.5, 0.01, "a loop's third reading is the highest level on it");
    EXPECT_NEAR(device.meter(11), 0.5, 0.01, "for every loop that turns");
    EXPECT(device.meter(12) == 0.0f, "and nothing for a loop that is off");
    EXPECT(device.meter(5) < 1.0e-3f, "while the level at the record head has fallen");
    render(device, 6.0f, kRate);
    const float head = device.meter(5);
    EXPECT(head == 0.0f || std::fpclassify(head) == FP_NORMAL,
           "the record head's level between notes is nothing or a number, not a denormal");
    render(device, 24.0f, kRate);
    EXPECT_NEAR(device.meter(10), 0.5, 0.01, "half a minute on, the loop still holds it and still says so");
    device.set_param(p::kFeedback, 0.0f);
    render(device, 12.0f, kRate);
    EXPECT(device.meter(10) == 0.0f && device.meter(0) == -1.0f, "a loop that has let go reads empty, at rest");
    EXPECT(device.meter(-1) == 0.0f && device.meter(15) == 0.0f, "there are fifteen readings");
  }

  // 16. Block size, across a rest. A phrase, a silence that ends before,
  // at and after the moment the loops come to rest, a knob moved inside
  // the silence, the phrase again: the same at every block size.
  {
    rng_state() = 0x5EEDu;
    std::vector<float> phrase = noise(0.3f, kRate, 0.4f);
    double worst = 0.0;
    bool rested_some = false, awake_some = false;
    for (int gap = 0; gap < 9; ++gap) {
      // Twelve passes of 0.25 s at Feedback 0.3 reach -140 dB: rest comes near 3.3 s.
      const size_t silent = static_cast<size_t>((2.9 + 0.1 * gap) * kRate);
      Stereo reference;
      for (int block : {128, 1, 2048, 37}) {
        device.init(kRate);
        device.set_param(p::kLength, 0.25f);
        device.set_param(p::kFeedback, 0.3f);
        device.set_param(p::kDrift, 1.0f);
        device.set_param(p::kMix, 0.6f);
        Stereo out = run(device, phrase, block);
        out = concat(out, run(device, std::vector<float>(silent - 100, 0.0f), block));
        device.set_param(p::kLength, 0.4f);
        device.set_param(p::kLoops, 5.0f);
        device.set_param(p::kMix, 0.9f);
        device.set_param(p::kSpread, 0.2f);
        out = concat(out, run(device, std::vector<float>(100, 0.0f), block));
        const bool rested = device.meter(0) == -1.0f;
        std::vector<float> again = phrase;
        again.resize(static_cast<size_t>(1.5f * kRate), 0.0f);
        out = concat(out, run(device, again, block));
        if (block == 128) {
          reference = out;
          (rested ? rested_some : awake_some) = true;
        } else {
          worst = std::max(worst, worst_difference(out, reference));
        }
      }
    }
    std::printf("orbits: block sizes 1, 37, 128 and 2048 across a rest differ by at most %g\n", worst);
    EXPECT(rested_some && awake_some, "the silences straddle the moment the loops come to rest");
    EXPECT(worst < 1.0e-6, "output does not depend on block size, across a rest and a knob moved in it");
  }

  // 17. A knob moved while the device rests is there when sound returns: it
  // does not glide in.
  {
    clean(device, 2, 0.5f, 10.0f, 0.5f);
    run(device, impulse(0.1f, kRate, 0.4f));
    render(device, 30.0f, kRate);
    EXPECT(device.meter(0) == -1.0f, "the device is at rest");
    device.set_param(p::kLength, 0.25f);
    device.set_param(p::kSpread, 1.0f);
    device.set_param(p::kFeedback, 0.25f);
    Stereo out = run(device, impulse(0.8f, kRate, 0.4f));
    EXPECT_NEAR(out.left[12000], 0.4, 1.0e-6, "the first return is at the new Length and Spread");
    EXPECT_NEAR(out.left[24000], 0.1, 1.0e-6, "and the second at the new Feedback");
    EXPECT(std::fabs(out.right[12000]) < 1.0e-9, "with nothing gliding there");
  }

  // 18. Where the longest loop would not fit its ring the ratio comes down
  // and the loops stay evenly spaced: 96 kHz, 12 s, 30 %, five loops.
  {
    const double rate = 96000.0;
    double periods[5];
    for (int k = 0; k < 5; ++k) periods[k] = Orbits::period(k, 5, 12.0, 30.0, rate);
    EXPECT(periods[0] == 12.0 * rate, "the first loop keeps Length");
    EXPECT(periods[4] <= Orbits::longest(rate) && periods[4] > 0.99 * Orbits::longest(rate),
           "the longest loop fills its ring and no more");
    bool even = true;
    for (int k = 1; k < 5; ++k) {
      if (std::fabs(periods[k] / periods[k - 1] - periods[1] / periods[0]) > 1.0e-5) even = false;
    }
    EXPECT(even && periods[1] > periods[0] * 1.05, "and the loops stay evenly spaced, each longer than the last");
    EXPECT(Orbits::period(4, 5, 10.0, 25.0, 48000.0) == std::floor(480000.0 * std::pow(1.25, 4) + 0.5),
           "at 48 kHz, 10 s and 25 % fit as they are");
    clean(device, 5, 12.0f, 30.0f, 0.0f, 96000.0f);
    Stereo out = run(device, impulse(15.2f, 96000.0f, 0.4f));
    bool lands = true;
    for (int k = 0; k < 5; ++k) {
      if (std::fabs(out.left[static_cast<size_t>(periods[k])] - 0.4 / std::sqrt(5.0)) > 1.0e-6) lands = false;
    }
    EXPECT(lands, "96 kHz: every loop returns at the period it was given");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("orbits", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kLoops, 5.0f);
  device.set_param(p::kWear, 1.0f);
  device.set_param(p::kDrift, 1.0f);
  device.set_param(p::kFeedback, 1.0f);
  report_cost("orbits five loops, wear and drift", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kLoops, 5.0f);
  device.set_param(p::kWear, 1.0f);
  device.set_param(p::kDrift, 1.0f);
  device.set_param(p::kLength, 6.0f);
  run(device, noise(0.5f, kRate, 0.25f));
  report_cost("orbits five loops with every tap wound", 10.0f, kRate, [&] {
    for (int n = 0; n < 10; ++n) {
      device.set_param(p::kLength, n % 2 == 0 ? 5.8f : 6.0f);
      run(device, std::vector<float>(input.begin() + n * 48000, input.begin() + (n + 1) * 48000));
    }
  });
  report_cost("orbits five loops cutting over all the time", 10.0f, kRate, [&] {
    for (int n = 0; n < 250; ++n) {
      device.set_param(p::kLength, n % 2 == 0 ? 3.0f : 6.0f);
      run(device, std::vector<float>(input.begin() + n * 1920, input.begin() + (n + 1) * 1920));
    }
  });

  return finish("orbits");
}
