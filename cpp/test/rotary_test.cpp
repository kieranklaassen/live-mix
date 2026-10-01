// Native harness for Rotary (cpp/devices/rotary). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest measures the cabinet: how fast each rotor turns, how long it takes
// to change speed, the Doppler, the two microphones and the drive.

#include "../devices/rotary/rotary.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Rotary;
namespace p = livemix::rotary;

static Rotary device;

static const float kRate = 48000.0f;
enum { kSlow = 0, kFast, kBrake };
// One tone for each rotor: well inside the horn's band and the drum's.
static const float kHornTone = 2000.0f;
static const float kDrumTone = 200.0f;

// RMS over whole periods of the test tone: 1 ms for 2 kHz (1000 points per
// second), 5 ms for 200 Hz (200 per second).
static std::vector<float> envelope(const std::vector<float>& x, size_t window, size_t from = 0) {
  std::vector<float> out;
  for (size_t i = from; i + window <= x.size(); i += window) {
    out.push_back(static_cast<float>(rms(x, i, i + window)));
  }
  return out;
}

static double lowest(const std::vector<float>& x) {
  double v = 1.0e9;
  for (float s : x) v = std::min(v, static_cast<double>(s));
  return v;
}
static double highest(const std::vector<float>& x) {
  double v = -1.0e9;
  for (float s : x) v = std::max(v, static_cast<double>(s));
  return v;
}

static std::vector<float> centred(const std::vector<float>& x) {
  const double m = mean(x);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = static_cast<float>(x[i] - m);
  return out;
}

// Frequency of each cycle of a tone from its rising zero crossings.
static std::vector<float> cycle_frequencies(const std::vector<float>& x, size_t from) {
  std::vector<float> out;
  double last = -1.0;
  for (size_t i = from + 1; i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double t =
          (static_cast<double>(i - 1) + (0.0 - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1])) /
          kRate;
      if (last >= 0.0) out.push_back(static_cast<float>(1.0 / (t - last)));
      last = t;
    }
  }
  return out;
}

// The turning rate over time, from an envelope sampled at `rate`: one entry
// per turn, (time the turn ended, turns per second). A Schmitt trigger a
// fifth of the swing wide keeps ripple from counting twice.
struct Turn {
  double time, hz;
};
static std::vector<Turn> turns(const std::vector<float>& env, double rate) {
  const double lo = lowest(env), hi = highest(env);
  const double arm = lo + 0.4 * (hi - lo), fire = lo + 0.6 * (hi - lo);
  std::vector<Turn> out;
  bool armed = false;
  double last = -1.0;
  for (size_t i = 0; i < env.size(); ++i) {
    if (env[i] < arm) armed = true;
    if (armed && env[i] > fire) {
      armed = false;
      const double t = static_cast<double>(i) / rate;
      if (last >= 0.0) out.push_back({t, 1.0 / (t - last)});
      last = t;
    }
  }
  return out;
}

// Seconds after `from` at which the turning rate first reaches `hz`.
static double time_to_reach(const std::vector<Turn>& all, double from, double hz) {
  for (const Turn& turn : all) {
    if (turn.time > from && turn.hz >= hz) return turn.time - from;
  }
  return 1.0e9;
}

// The modulation rate each rotor puts on its tone at a steady speed.
static double steady_rate(int speed, float tone, float seconds, double lo, double hi) {
  device.init(kRate);
  device.set_param(p::kSpeed, static_cast<float>(speed));
  Stereo out = run(device, sine(tone, seconds, kRate, 0.5f));
  const size_t window = tone > 1000.0f ? 48 : 240;
  return dominant_frequency(centred(envelope(out.left, window, 4800)), kRate / window, lo, hi);
}

// Envelope of `tone` while the speed is switched from Slow to Fast at 2 s.
static std::vector<Turn> run_up(float tone, float acceleration) {
  device.init(kRate);
  device.set_param(p::kDistance, 0.0f);
  device.set_param(p::kDrive, 0.0f);
  device.set_param(p::kBalance, tone > 1000.0f ? 1.0f : 0.0f);  // one rotor at a time
  device.set_param(p::kHornDepth, 1.0f);
  device.set_param(p::kDrumDepth, 1.0f);
  device.set_param(p::kAcceleration, acceleration);
  Stereo out = run(device, sine(tone, 2.0f, kRate, 0.5f));
  device.set_param(p::kSpeed, static_cast<float>(kFast));
  out = concat(out, run(device, sine(tone, 9.0f, kRate, 0.5f)));
  const size_t window = tone > 1000.0f ? 48 : 240;
  return turns(envelope(out.left, window), kRate / window);
}

int main() {
  Conformance spec;
  spec.name = "rotary";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // The two rotors at their two speeds.
  {
    EXPECT_NEAR(steady_rate(kSlow, kHornTone, 14.0f, 0.3, 3.0), 0.8, 0.03,
                "Slow: the horn turns at 0.8 Hz");
    EXPECT_NEAR(steady_rate(kFast, kHornTone, 5.0f, 2.0, 20.0), 6.7, 0.1,
                "Fast: the horn turns at 6.7 Hz");
    EXPECT_NEAR(steady_rate(kSlow, kDrumTone, 14.0f, 0.3, 3.0), 0.67, 0.03,
                "Slow: the drum turns at 0.67 Hz");
    EXPECT_NEAR(steady_rate(kFast, kDrumTone, 5.0f, 2.0, 20.0), 5.8, 0.1,
                "Fast: the drum turns at 5.8 Hz");
  }

  // Slow to Fast: the horn is there in well under a second, the drum takes
  // several. "There" is nine tenths of the way.
  {
    const double horn_goal = 0.8 + 0.9 * (6.7 - 0.8), drum_goal = 0.67 + 0.9 * (5.8 - 0.67);
    const std::vector<Turn> horn = run_up(kHornTone, 1.0f);
    const std::vector<Turn> drum = run_up(kDrumTone, 1.0f);
    const double horn_time = time_to_reach(horn, 2.0, horn_goal);
    const double drum_time = time_to_reach(drum, 2.0, drum_goal);
    EXPECT(horn_time > 0.3 && horn_time < 0.9,
           "the horn reaches Fast in under a second, not at once");
    EXPECT(drum_time > 2.8 && drum_time < 4.5, "the drum takes three to four seconds");
    EXPECT(time_to_reach(drum, 2.0, 3.6) > 0.9,
           "a second after the switch the drum is not half way");
    // The last five turns, averaged: one turn is only timed to the envelope's grid.
    auto settled = [](const std::vector<Turn>& all) {
      double sum = 0.0;
      for (size_t i = all.size() - 5; i < all.size(); ++i) sum += all[i].hz;
      return sum / 5.0;
    };
    EXPECT_NEAR(settled(horn), 6.7, 0.07, "the horn settles at its Fast speed");
    EXPECT_NEAR(settled(drum), 5.8, 0.07, "the drum settles at its Fast speed");
    const std::vector<Turn> light = run_up(kDrumTone, 4.0f);
    const double light_time = time_to_reach(light, 2.0, drum_goal);
    EXPECT(light_time > 0.6 && light_time < 1.3,
           "Acceleration 4 gets the drum there four times sooner");
    const std::vector<Turn> heavy = run_up(kHornTone, 0.25f);
    const double heavy_time = time_to_reach(heavy, 2.0, horn_goal);
    EXPECT(heavy_time > 1.8 && heavy_time < 3.0,
           "Acceleration 0.25 makes the horn four times slower");
  }

  // Brake: both rotors come to rest and the sound stops moving.
  {
    for (float tone : {kHornTone, kDrumTone}) {
      device.init(kRate);
      device.set_param(p::kSpeed, static_cast<float>(kFast));
      Stereo turning = run(device, sine(tone, 2.0f, kRate, 0.5f));
      device.set_param(p::kSpeed, static_cast<float>(kBrake));
      run(device, sine(tone, 8.0f, kRate, 0.5f));
      Stereo stopped = run(device, sine(tone, 2.0f, kRate, 0.5f));
      const size_t window = tone > 1000.0f ? 48 : 240;
      const std::vector<float> before = envelope(turning.left, window, 4800);
      const std::vector<float> after = envelope(stopped.left, window);
      EXPECT(highest(before) > 1.15 * lowest(before), "while turning the level swings");
      EXPECT(highest(after) < 1.002 * lowest(after), "Brake: the level stands still");
      const std::vector<float> hz = cycle_frequencies(stopped.left, 0);
      EXPECT(highest(hz) - lowest(hz) < 0.0005 * tone, "Brake: the pitch stands still");
    }
  }

  // Doppler: the horn bends pitch by the speed of its mouth, the drum far less.
  {
    auto bend = [&](float tone, float horn_depth, float drum_depth) {
      device.init(kRate);
      device.set_param(p::kSpeed, static_cast<float>(kFast));
      device.set_param(p::kDistance, 0.0f);
      device.set_param(p::kDrive, 0.0f);
      // Each rotor on its own: where the bands overlap the other one's
      // movement would be measured too.
      device.set_param(p::kBalance, tone > 1000.0f ? 1.0f : 0.0f);
      device.set_param(p::kHornDepth, horn_depth);
      device.set_param(p::kDrumDepth, drum_depth);
      Stereo out = run(device, sine(tone, 2.0f, kRate, 0.5f));
      const std::vector<float> hz = cycle_frequencies(out.left, 24000);
      return 0.5 * (highest(hz) - lowest(hz)) / tone;
    };
    const double full = bend(kHornTone, 1.0f, 1.0f);
    // 2π · 6.7 Hz · 0.55 ms
    EXPECT_NEAR(full, 0.0232, 0.004, "Horn Depth 1 at Fast: ±2.3 % of pitch");
    EXPECT_NEAR(bend(kHornTone, 0.5f, 1.0f) / full, 0.5, 0.08, "Horn Depth scales the Doppler");
    const double low = bend(kDrumTone, 1.0f, 1.0f);
    EXPECT(low > 0.003 && low < 0.4 * full,
           "the drum has a little Doppler, much less than the horn");
    EXPECT(bend(kHornTone, 0.0f, 1.0f) < 0.0005, "Horn Depth 0: no Doppler on the highs");
    EXPECT(bend(kDrumTone, 1.0f, 0.0f) < 0.0015, "Drum Depth 0: no Doppler on the lows");
  }

  // Depth 0 also stills the level of each band.
  {
    device.init(kRate);
    device.set_param(p::kSpeed, static_cast<float>(kFast));
    device.set_param(p::kHornDepth, 0.0f);
    device.set_param(p::kDrumDepth, 0.0f);
    device.set_param(p::kDistance, 0.0f);
    std::vector<float> horn =
        envelope(run(device, sine(kHornTone, 1.5f, kRate, 0.5f)).left, 48, 4800);
    EXPECT(highest(horn) < 1.002 * lowest(horn), "Horn Depth 0: the highs hold still");
    device.init(kRate);
    device.set_param(p::kSpeed, static_cast<float>(kFast));
    device.set_param(p::kHornDepth, 0.0f);
    device.set_param(p::kDrumDepth, 0.0f);
    std::vector<float> drum =
        envelope(run(device, sine(kDrumTone, 1.5f, kRate, 0.5f)).left, 240, 4800);
    EXPECT(highest(drum) < 1.002 * lowest(drum), "Drum Depth 0: the lows hold still");
  }

  // Two microphones: one and the same at Spread 0, on opposite sides at 1.
  {
    device.init(kRate);
    device.set_param(p::kSpeed, static_cast<float>(kFast));
    device.set_param(p::kSpread, 0.0f);
    rng_state() = 0xC0FFEEu;
    Stereo mono = run(device, noise(2.0f, kRate, 0.3f));
    EXPECT(mono.left == mono.right, "Spread 0: left and right are identical");

    device.init(kRate);
    device.set_param(p::kSpeed, static_cast<float>(kFast));
    device.set_param(p::kSpread, 1.0f);
    rng_state() = 0xC0FFEEu;
    Stereo wide = run(device, noise(2.0f, kRate, 0.3f));
    EXPECT(correlation(wide.left, wide.right, 4800) < 0.8,
           "Spread 1: left and right are decorrelated");

    device.init(kRate);
    device.set_param(p::kSpeed, static_cast<float>(kFast));
    device.set_param(p::kSpread, 1.0f);
    device.set_param(p::kDistance, 0.0f);
    device.set_param(p::kBalance, 1.0f);
    Stereo tone = run(device, sine(kHornTone, 2.0f, kRate, 0.5f));
    EXPECT(correlation(centred(envelope(tone.left, 48, 4800)),
                       centred(envelope(tone.right, 48, 4800))) < -0.5,
           "Spread 1: the horn is loud in one microphone while it is quiet in the other");
  }

  // Distance: less swing in level, more of the cabinet.
  {
    double swing[2], late[2];
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.set_param(p::kSpeed, static_cast<float>(kFast));
      device.set_param(p::kHornDepth, 1.0f);
      device.set_param(p::kDistance, static_cast<float>(which));
      device.set_param(p::kBalance, 1.0f);
      // Noise, so the reflections' comb filtering averages out and what is
      // left is the beam passing the microphone: the share of the power
      // that pulses at the horn's 6.7 Hz.
      rng_state() = 0xC0FFEEu;
      Stereo out = run(device, noise(9.0f, kRate, 0.3f));
      std::vector<float> power;
      for (size_t i = 48000; i + 240 <= out.size(); i += 240) {
        const double level = rms(out.left, i, i + 240);
        power.push_back(static_cast<float>(level * level));
      }
      swing[which] = tone_level(centred(power), 6.7, 200.0) / mean(power);

      device.init(kRate);
      device.set_param(p::kSpeed, static_cast<float>(kBrake));
      device.set_param(p::kDrive, 0.0f);
      device.set_param(p::kBalance, 1.0f);
      device.set_param(p::kDistance, static_cast<float>(which));
      Stereo hit = run(device, impulse(0.1f, kRate, 0.5f));
      const double whole = rms(hit.left) * std::sqrt(static_cast<double>(hit.size()));
      const double tail =
          rms(hit.left, 72, hit.size()) * std::sqrt(static_cast<double>(hit.size() - 72));
      late[which] = tail / whole;
    }
    EXPECT(swing[1] < 0.6 * swing[0], "Distance 1: the level swings much less than up close");
    EXPECT(late[0] < 0.02, "Distance 0: the horn arrives once");
    EXPECT(late[1] > 0.5, "Distance 1: reflections arrive after the direct sound");
  }

  // Balance sets the horn against the drum.
  {
    std::vector<float> both = sine(kDrumTone, 2.0f, kRate, 0.25f);
    const std::vector<float> high = sine(kHornTone, 2.0f, kRate, 0.25f);
    for (size_t i = 0; i < both.size(); ++i) both[i] += high[i];
    double low_level[3], high_level[3];
    int which = 0;
    for (float balance : {0.0f, 0.5f, 1.0f}) {
      // Nothing moving, so each tone is one steady line to measure.
      device.init(kRate);
      device.set_param(p::kSpeed, static_cast<float>(kBrake));
      device.set_param(p::kHornDepth, 0.0f);
      device.set_param(p::kDrumDepth, 0.0f);
      device.set_param(p::kDistance, 0.0f);
      device.set_param(p::kDrive, 0.0f);
      device.set_param(p::kBalance, balance);
      Stereo out = run(device, both);
      low_level[which] = tone_level(out.left, kDrumTone, kRate, 48000);
      high_level[which] = tone_level(out.left, kHornTone, kRate, 48000);
      ++which;
    }
    EXPECT_NEAR(db(low_level[1] / 0.25), 0.0, 0.5, "Balance 0.5: the drum band at unity");
    EXPECT_NEAR(db(high_level[1] / 0.25), 0.0, 0.5, "Balance 0.5: the horn band at unity");
    // What is left is the 12 dB per octave crossover's overlap.
    EXPECT(high_level[0] < 0.25 * high_level[1], "Balance 0: the drum alone");
    EXPECT(low_level[2] < 0.12 * low_level[1], "Balance 1: the horn alone");
    EXPECT_NEAR(low_level[0] / low_level[1], 1.414, 0.1, "Balance 0: the drum is 3 dB up");
  }

  // The drive: clean at 0; at 1 it adds odd and even harmonics, holds loud
  // playing back, aliases far less than a bare shaper, and stays bounded.
  {
    auto still = [&](float drive) {
      device.init(kRate);
      device.set_param(p::kSpeed, static_cast<float>(kBrake));
      device.set_param(p::kHornDepth, 0.0f);
      device.set_param(p::kDrumDepth, 0.0f);
      device.set_param(p::kDistance, 0.0f);
      device.set_param(p::kSpread, 0.0f);
      device.set_param(p::kDrive, drive);
    };
    still(0.0f);
    Stereo clean = run(device, sine(300.0f, 1.0f, kRate, 0.5f));
    still(1.0f);
    Stereo hot = run(device, sine(300.0f, 1.0f, kRate, 0.5f));
    const double clean_first = tone_level(clean.left, 300.0, kRate, 24000);
    const double hot_first = tone_level(hot.left, 300.0, kRate, 24000);
    EXPECT(tone_level(clean.left, 900.0, kRate, 24000) < 0.0005 * clean_first,
           "Drive 0 adds no harmonics");
    EXPECT_NEAR(db(clean_first / 0.5), 0.0, 0.5,
                "Drive 0: the cabinet is unity gain when nothing moves");
    EXPECT(tone_level(hot.left, 900.0, kRate, 24000) > 0.1 * hot_first,
           "Drive 1: a strong third harmonic");
    EXPECT(tone_level(hot.left, 600.0, kRate, 24000) > 0.02 * hot_first,
           "Drive 1: a second harmonic too");

    still(1.0f);
    const double quiet = rms(run(device, sine(300.0f, 1.0f, kRate, 0.05f)).left, 24000);
    still(1.0f);
    const double loud = rms(run(device, sine(300.0f, 1.0f, kRate, 0.8f)).left, 24000);
    EXPECT(loud / quiet < 6.0, "Drive 1: 24 dB more input gives under 16 dB more output");
    EXPECT_NEAR(db(quiet / (0.05 * 0.7071)), 4.7, 1.0, "Drive 1: quiet playing comes up 4.7 dB");

    // A 5 kHz tone driven hard: its 9th harmonic (45 kHz) folds to 3 kHz.
    still(1.0f);
    const std::vector<float> high = sine(5000.0f, 1.0f, kRate, 0.9f);
    Stereo folded = run(device, high);
    std::vector<float> bare(high.size());
    for (size_t i = 0; i < high.size(); ++i) {
      const float u = 6.0f * high[i] + 0.2f;
      bare[i] = u / std::sqrt(1.0f + u * u);
    }
    const double ours = tone_level(folded.left, 3000.0, kRate, 24000) /
                        tone_level(folded.left, 5000.0, kRate, 24000);
    const double naive =
        tone_level(bare, 3000.0, kRate, 24000) / tone_level(bare, 5000.0, kRate, 24000);
    EXPECT(db(ours) < db(naive) - 12.0,
           "the drive aliases at least 12 dB less than the same curve applied sample by sample");

    device.init(kRate);
    for (int id = 1; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
    device.set_param(p::kSpeed, static_cast<float>(kFast));
    device.set_param(p::kBalance, 0.5f);
    Stereo slammed = run(device, sine(110.0f, 2.0f, kRate, 1.0f));
    EXPECT(finite(slammed.left) && peak(slammed.left) < 2.0 && peak(slammed.right) < 2.0,
           "everything at maximum with a full-scale tone stays bounded");
    EXPECT(peak(slammed.left) > 0.2, "and still sounds");
  }

  // Levels and clicks: unity through the cabinet, Mix 0 is the input, and
  // switching speed or moving a control mid-note never steps.
  {
    for (float tone : {kHornTone, kDrumTone}) {
      device.init(kRate);
      Stereo out = run(device, sine(tone, 4.0f, kRate, 0.25f));
      EXPECT_NEAR(db(rms(out.left, 48000) / (0.25 * 0.7071)), 0.0, 2.0,
                  "defaults keep a tone within 2 dB");
    }
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = noise(0.5f, kRate, 0.5f);
    Stereo dry = run(device, in);
    double worst = 0.0;
    for (size_t i = 0; i < in.size(); ++i)
      worst = std::max(worst, std::fabs(static_cast<double>(dry.left[i]) - in[i]));
    EXPECT(worst < 1.0e-6, "Mix 0 is the input");

    device.init(kRate);
    const std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    const double own = max_step(tone);
    Stereo moved = run(device, tone);
    device.set_param(p::kSpeed, static_cast<float>(kFast));
    device.set_param(p::kHornDepth, 1.0f);
    device.set_param(p::kDrumDepth, 0.0f);
    moved = concat(moved, run(device, tone));
    device.set_param(p::kSpeed, static_cast<float>(kBrake));
    device.set_param(p::kDistance, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kBalance, 1.0f);
    moved = concat(moved, run(device, tone));
    device.set_param(p::kDrive, 1.0f);
    device.set_param(p::kMix, 0.5f);
    device.set_param(p::kBalance, 0.0f);
    moved = concat(moved, run(device, tone));
    EXPECT(max_step(moved.left) < 2.0 * own && max_step(moved.right) < 2.0 * own,
           "speed switches and control moves do not click");
  }

  // The device sleeps and wakes.
  {
    device.init(kRate);
    run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    render(device, 1.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the input stops");
    Stereo woken = run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    EXPECT(peak(woken.left) > 0.2, "wakes on new input");
  }

  device.init(kRate);
  device.set_param(p::kSpeed, static_cast<float>(kFast));
  device.set_param(p::kDistance, 1.0f);
  device.set_param(p::kDrive, 0.8f);
  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("rotary", 10.0f, kRate, [&] { run(device, input); });

  return finish("rotary");
}
