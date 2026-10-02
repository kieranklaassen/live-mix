// Native harness for Ambient Compressor (cpp/devices/ambient-comp). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest measures what makes it a
// compressor for sustained sound: the curve, the two times, a tail left
// alone, rumble ignored, a drone left clean, and the meter. Levels are RMS in
// dBFS as the detector reads them; each check prints what it measured.

#include "../devices/ambient-comp/ambient_comp.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::AmbientComp;
namespace p = livemix::ambient_comp;

static AmbientComp device;

static const float kRate = 48000.0f;
static const double kThreshold = p::kParamDefault[p::kThreshold];
// One cycle of the 1 kHz test tone: the window the gain is read over.
static const size_t kCycle = 48;

static size_t at(double seconds) { return static_cast<size_t>(seconds * kRate + 0.5); }

// Peak amplitude of a sine whose RMS level is `dbfs`.
static double amp(double dbfs) { return std::sqrt(2.0) * std::pow(10.0, dbfs / 20.0); }

// `seconds` of a tone appended to `x`, falling by `db_per_second` from `gain`.
// The phase is counted from the start of `x`, so a change of level between
// two calls does not jump.
static void add_tone(std::vector<float>& x, double hz, double seconds, double gain,
                     double db_per_second = 0.0) {
  const size_t start = x.size();
  const size_t n = at(seconds);
  for (size_t i = 0; i < n; ++i) {
    const double t = static_cast<double>(i) / kRate;
    const double level = gain * std::pow(10.0, -db_per_second * t / 20.0);
    x.push_back(static_cast<float>(
        level * std::sin(2.0 * kPi * hz * static_cast<double>(start + i) / kRate)));
  }
}

// The gain the device applied over [from, to), in dB: output over input.
static double gain_db(const Stereo& out, const std::vector<float>& in, size_t from, size_t to) {
  return db(rms(out.left, from, to) / rms(in, from, to));
}

// Seconds after `start` at which the gain, read a cycle at a time, crosses
// `level` dB. -1 when it never does.
static double crossing(const Stereo& out, const std::vector<float>& in, size_t start,
                       double level) {
  double previous = gain_db(out, in, start, start + kCycle);
  for (size_t i = start + kCycle; i + kCycle <= in.size(); i += kCycle) {
    const double now = gain_db(out, in, i, i + kCycle);
    if ((previous - level) * (now - level) <= 0.0 && now != previous) {
      const double centre = static_cast<double>(i - start) + 0.5 * kCycle;
      return (centre - kCycle * (now - level) / (now - previous)) / kRate;
    }
    previous = now;
  }
  return -1.0;
}

// The reduction the curve asks for, in dB (the formula of the device's brief).
static double curve(double over, double ratio, double knee) {
  const double slope = 1.0 / ratio - 1.0;
  if (2.0 * over < -knee) return 0.0;
  if (knee > 0.0 && 2.0 * std::fabs(over) <= knee) {
    return slope * (over + 0.5 * knee) * (over + 0.5 * knee) / (2.0 * knee);
  }
  return slope * over;
}

// What the design gives, worked out apart from the device in continuous
// time: seconds until the reduction has covered 63 % of the way after the
// level steps from `from` to `to` dB over the threshold (ratio 4, hard knee).
// The power is read through two 30 ms poles in cascade, whose step response
// is 1 - (1 + t/T)·exp(-t/T); the curve turns that into a target; one pole of
// `seconds` follows it. The answer is `seconds` plus the detector's lag.
static double design_time(double from, double to, double seconds) {
  const double before = std::pow(10.0, from / 10.0), after = std::pow(10.0, to / 10.0);
  const double start = curve(from, 4.0, 0.0), end = curve(to, 4.0, 0.0);
  const double dt = 1.0 / (8.0 * kRate);
  const double pole = std::exp(-dt / seconds);
  double reduction = start;
  for (double t = dt; t < 60.0; t += dt) {
    const double x = t / 0.03;
    const double power = after + (before - after) * (1.0 + x) * std::exp(-x);
    const double target = curve(10.0 * std::log10(power), 4.0, 0.0);
    reduction = target + (reduction - target) * pole;
    if ((reduction - start) / (end - start) >= 1.0 - std::exp(-1.0)) return t;
  }
  return -1.0;
}

static double worst_difference(const Stereo& out, const std::vector<float>& in) {
  double worst = 0.0;
  for (size_t i = 0; i < in.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - in[i]));
  }
  return worst;
}

// Ratio 4 with a hard knee at the default threshold: a tone 12 dB over it
// settles 9 dB down.
static void hard(AmbientComp& d, float attack_ms, float release_s) {
  d.init(kRate);
  d.set_param(p::kRatio, 4.0f);
  d.set_param(p::kKnee, 0.0f);
  d.set_param(p::kAttack, attack_ms);
  d.set_param(p::kRelease, release_s);
}

int main() {
  // 1. Conformance. The gain is never above unity, so the ceiling is Make-up
  // at its maximum (+24 dB, 15.85) on a full-scale input the gain has not
  // come down on yet.
  Conformance spec;
  spec.name = "ambient-comp";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;  // no tail; it rests after half a second of silence
  spec.max_peak = 16.0f;
  check_effect(device, spec, kRate);

  // 2. The static curve: the settled output level is the one the formula gives.
  {
    const double threshold = -30.0;
    double worst = 0.0;
    for (float ratio : {2.0f, 4.0f}) {
      for (float knee : {0.0f, 12.0f}) {
        std::printf("curve, ratio %.0f knee %2.0f, reduction measured (formula):", ratio, knee);
        for (double over : {-12.0, 0.0, 6.0, 12.0, 24.0}) {
          device.init(kRate);
          device.set_param(p::kThreshold, static_cast<float>(threshold));
          device.set_param(p::kRatio, ratio);
          device.set_param(p::kKnee, knee);
          device.set_param(p::kAttack, 50.0f);
          device.set_param(p::kRelease, 0.2f);
          std::vector<float> in;
          add_tone(in, 1000.0, 2.0, amp(threshold + over));
          Stereo out = run(device, in);
          const double measured = gain_db(out, in, at(1.5), at(2.0));
          const double expected = curve(over, ratio, knee);
          std::printf("  %+.0f: %.3f (%.3f)", over, measured, expected);
          worst = std::max(worst, std::fabs(measured - expected));
        }
        std::printf("\n");
      }
    }
    std::printf("curve: worst departure from the formula %.4f dB (limit 0.3)\n", worst);
    EXPECT(worst < 0.3, "the settled level follows the soft-knee formula within 0.3 dB");
  }

  // 3. Attack: after a step from 20 dB under the threshold to 12 dB over it
  // the reduction is 63 % of the way to -9 dB in the time set plus what the
  // detector's two poles take to read the new level, which is 41 to 45 ms on
  // this step. Then, free of the detector, the last decibel shrinks to 1 / e
  // of itself in the time set. 13. The meter reads the settled reduction.
  for (float attack : {100.0f, 1000.0f}) {
    hard(device, attack, 2.0f);
    std::vector<float> in;
    add_tone(in, 1000.0, 0.5, amp(kThreshold - 20.0));
    const size_t step = in.size();
    add_tone(in, 1000.0, attack * 0.008 + 1.0, amp(kThreshold + 12.0));
    Stereo out = run(device, in);
    const double seconds = crossing(out, in, step, -9.0 * (1.0 - std::exp(-1.0)));
    const double design = design_time(-20.0, 12.0, attack * 0.001);
    const double constant =
        crossing(out, in, step, -9.0 + std::exp(-1.0)) - crossing(out, in, step, -8.0);
    const double settled = gain_db(out, in, in.size() - at(0.1), in.size());
    const double meter = device.meter(0);
    std::printf("attack %.0f ms: 63 %% of the way after %.1f ms (the design gives %.1f: the "
                "detector adds %.1f); time constant %.1f ms; settled %.3f dB, meter %.3f dB\n",
                attack, seconds * 1000.0, design * 1000.0, design * 1000.0 - attack,
                constant * 1000.0, settled, meter);
    char label[112];
    std::snprintf(label, sizeof label,
                  "Attack %.0f ms: 63 %% of the way in that time plus the detector's lag", attack);
    EXPECT_NEAR(seconds, design, 0.01 * attack * 0.001 + 0.001, label);
    std::snprintf(label, sizeof label, "Attack %.0f ms is the time constant of the approach",
                  attack);
    EXPECT_NEAR(constant * 1000.0, attack, 0.03 * attack, label);
    EXPECT_NEAR(settled, -9.0, 0.1, "12 dB over the threshold at ratio 4 settles 9 dB down");
    EXPECT_NEAR(meter, -9.0, 0.3, "the meter reads the settled reduction");
    EXPECT_NEAR(meter, settled, 0.05, "the meter agrees with the gain measured from the audio");
  }

  // 4. Release (Tails "Release"): from that settled state a step down to 6 dB
  // under the threshold recovers 63 % of the reduction in the time set, plus
  // the detector's lag.
  for (float release : {0.5f, 4.0f}) {
    hard(device, 100.0f, release);
    device.set_param(p::kTails, 1.0f);
    std::vector<float> in;
    add_tone(in, 1000.0, 1.5, amp(kThreshold + 12.0));
    const size_t step = in.size();
    add_tone(in, 1000.0, release * 3.0 + 1.0, amp(kThreshold - 6.0));
    Stereo out = run(device, in);
    const double before = gain_db(out, in, step - at(0.1), step);
    const double seconds = crossing(out, in, step, -9.0 * std::exp(-1.0));
    // Once the detector has arrived the recovery is a pure exponential: from
    // -6 dB to 1 / e of that is the time constant with no lag in it.
    const double constant =
        crossing(out, in, step, -6.0 * std::exp(-1.0)) - crossing(out, in, step, -6.0);
    const double design = design_time(12.0, -6.0, release);
    std::printf("release %.1f s: 63 %% recovered after %.3f s (the design gives %.3f: the "
                "detector adds %.0f ms); time constant %.3f s\n",
                release, seconds, design, (design - release) * 1000.0, constant);
    char label[112];
    EXPECT_NEAR(before, -9.0, 0.1, "the release starts from the settled 9 dB");
    std::snprintf(label, sizeof label,
                  "Release %.1f s: 63 %% recovered in that time plus the detector's lag", release);
    EXPECT_NEAR(seconds, design, 0.01 * release + 0.001, label);
    std::snprintf(label, sizeof label, "Release %.1f s is the time constant of the recovery",
                  release);
    EXPECT_NEAR(constant, release, 0.03 * release, label);
  }

  // 5. A tail under Tails "Hold" keeps its own shape: a tone 12 dB over the
  // threshold, then the input dying at 6 dB a second. The gain stays put, so
  // the output falls at the input's rate; Tails "Release" lifts the same tail.
  // 6. Hold lets go once the sound settles at a level that stays.
  {
    std::vector<float> in;
    add_tone(in, 1000.0, 4.0, amp(kThreshold + 12.0));
    const size_t decay = in.size();
    add_tone(in, 1000.0, 6.0, amp(kThreshold + 12.0), 6.0);
    const size_t steady = in.size();
    add_tone(in, 1000.0, 8.0, amp(kThreshold - 30.0));
    const size_t window = 10 * kCycle;
    // The furthest the gain gets from where it was when the tail began, over
    // the tail's first three seconds.
    auto moved = [&](const Stereo& out, const std::vector<float>& x, size_t from) {
      const double start = gain_db(out, x, from - window, from);
      double furthest = 0.0;
      for (size_t i = from; i + window <= from + at(3.0); i += window) {
        const double change = gain_db(out, x, i, i + window) - start;
        if (std::fabs(change) > std::fabs(furthest)) furthest = change;
      }
      return furthest;
    };
    double slope[2], travel[2], start[2], waiting = 0.0, end = 0.0, meter = 0.0;
    for (int tails = 1; tails >= 0; --tails) {
      hard(device, 100.0f, 1.0f);
      device.set_param(p::kTails, static_cast<float>(tails));
      Stereo out = run(device, in);
      start[tails] = gain_db(out, in, decay - window, decay);
      travel[tails] = moved(out, in, decay);
      slope[tails] = (db(rms(out.left, decay, decay + window)) -
                      db(rms(out.left, decay + at(3.0), decay + at(3.0) + window))) /
                     3.0;
      waiting = gain_db(out, in, steady + at(1.0), steady + at(1.0) + window);
      end = gain_db(out, in, in.size() - at(0.1), in.size());
      meter = device.meter(0);
    }
    std::printf("tail at 6 dB/s, first 3 s: Hold falls at %.3f dB/s (gain moved %+.3f dB); "
                "Release falls at %.3f dB/s (gain moved %+.3f dB)\n",
                slope[0], travel[0], slope[1], travel[1]);
    EXPECT_NEAR(start[0], -9.0, 0.1, "the tail starts from the settled 9 dB of reduction");
    EXPECT_NEAR(slope[0], 6.0, 0.3, "Tails Hold: the output falls at the input's 6 dB a second");
    EXPECT(std::fabs(travel[0]) < 0.5, "Tails Hold: the gain moves less than 0.5 dB under a tail");
    EXPECT(travel[1] > 4.0, "Tails Release: the gain comes up more than 4 dB under the same tail");

    std::printf("Hold, then steady 30 dB under the threshold: reduction %.3f dB after 1 s, "
                "%.3f dB after 8 s (meter %.3f dB)\n",
                waiting, end, meter);
    EXPECT(waiting < -8.0, "Hold: a second into the steady level the gain is still held");
    EXPECT_NEAR(end, 0.0, 0.5, "Hold: once the level stays, the reduction is released");
    EXPECT_NEAR(meter, 0.0, 0.5, "Hold: and the meter has come back with it");

    // A tail is held as well when it begins a second after the sound did, or
    // at the top of a swell: the follower has not been left behind by the rise.
    std::vector<float> note;
    add_tone(note, 1000.0, 1.0, amp(kThreshold + 12.0));
    const size_t note_decay = note.size();
    add_tone(note, 1000.0, 4.0, amp(kThreshold + 12.0), 6.0);
    hard(device, 100.0f, 1.0f);
    Stereo out = run(device, note);
    const double after_onset = moved(out, note, note_decay);

    std::vector<float> swell;
    add_tone(swell, 1000.0, 2.0, amp(kThreshold - 12.0));
    add_tone(swell, 1000.0, 4.0, amp(kThreshold - 12.0), -6.0);
    const size_t swell_decay = swell.size();
    add_tone(swell, 1000.0, 4.0, amp(kThreshold + 12.0), 6.0);
    hard(device, 100.0f, 1.0f);
    out = run(device, swell);
    const double after_swell = moved(out, swell, swell_decay);
    std::printf("Hold, a tail 1 s after the onset: gain moved %+.3f dB; a tail at the top of a "
                "6 dB/s swell: gain moved %+.3f dB\n",
                after_onset, after_swell);
    EXPECT(std::fabs(after_onset) < 0.5, "Tails Hold: a tail right after the onset is left alone");
    EXPECT(std::fabs(after_swell) < 0.5, "Tails Hold: a tail at the top of a swell is left alone");
  }

  // 7. Rumble under Ignore below does not drive it: 45 Hz, 12 dB over the
  // threshold, is 20.9 dB down after a 150 Hz high-pass and 0.2 dB down after
  // a 20 Hz one.
  {
    double reduction[2];
    int which = 0;
    for (float low_cut : {150.0f, 20.0f}) {
      hard(device, 100.0f, 2.0f);
      device.set_param(p::kScLowCut, low_cut);
      std::vector<float> in;
      add_tone(in, 45.0, 4.0, amp(kThreshold + 12.0));
      Stereo out = run(device, in);
      reduction[which++] = db(tone_level(out.left, 45.0, kRate, at(2.0), at(4.0)) /
                              tone_level(in, 45.0, kRate, at(2.0), at(4.0)));
    }
    std::printf("45 Hz at 12 dB over: reduction %.3f dB with Ignore below at 150 Hz, %.3f dB "
                "with it at 20 Hz\n",
                reduction[0], reduction[1]);
    EXPECT(std::fabs(reduction[0]) < 0.5, "45 Hz under a 150 Hz Ignore below is not compressed");
    EXPECT_NEAR(reduction[1], -9.0, 1.0, "45 Hz over a 20 Hz Ignore below is compressed in full");
  }

  // 8. A drone stays clean at the fastest settings: the gain does not follow
  // the wave, so 55 Hz grows no harmonics and no sidebands 110 Hz away.
  {
    hard(device, 10.0f, 0.1f);
    device.set_param(p::kScLowCut, 20.0f);
    std::vector<float> in;
    add_tone(in, 55.0, 4.0, amp(kThreshold + 12.0));
    Stereo out = run(device, in);
    const size_t from = at(2.0), to = at(4.0);
    const double fundamental = tone_level(out.left, 55.0, kRate, from, to);
    const double reduction = db(fundamental / tone_level(in, 55.0, kRate, from, to));
    double worst = -200.0;
    std::printf("55 Hz drone, attack 10 ms, release 0.1 s, %.3f dB of reduction:", reduction);
    for (double hz : {110.0, 165.0, 220.0, 275.0}) {
      const double level = db(tone_level(out.left, hz, kRate, from, to) / fundamental);
      std::printf("  %.0f Hz %.1f dB", hz, level);
      worst = std::max(worst, level);
    }
    std::printf("; worst %.1f dB (limit -60)\n", worst);
    EXPECT_NEAR(reduction, -9.0, 0.5, "the drone is being compressed while it is measured");
    EXPECT(worst < -60.0, "harmonics and sidebands of a compressed 55 Hz drone are 60 dB down");
  }

  // 9. Stereo link: a loud tone on the left alone turns a quiet one on the
  // right down by the same amount. One channel alone reads 3 dB lower, so
  // 11 dB over the threshold on the left is 8 dB over at the detector.
  {
    hard(device, 100.0f, 2.0f);
    std::vector<float> left, right;
    add_tone(left, 1000.0, 3.0, amp(kThreshold + 11.0));
    add_tone(right, 3000.0, 3.0, amp(-60.0));
    Stereo out = run(device, left, right);
    const size_t from = at(2.0), to = at(3.0);
    const double loud = db(tone_level(out.left, 1000.0, kRate, from, to) /
                           tone_level(left, 1000.0, kRate, from, to));
    const double quiet = db(tone_level(out.right, 3000.0, kRate, from, to) /
                            tone_level(right, 3000.0, kRate, from, to));
    std::printf("stereo link: left tone %.4f dB, quiet right tone %.4f dB\n", loud, quiet);
    EXPECT_NEAR(loud, -6.0, 0.2, "a tone on the left alone reads 3 dB lower: 6 dB of reduction");
    EXPECT_NEAR(quiet, loud, 0.1, "the right channel is turned down by the same amount");
  }

  // 10. Below the threshold nothing happens.
  {
    device.init(kRate);
    std::vector<float> in;
    add_tone(in, 1000.0, 2.0, amp(kThreshold - 30.0));
    Stereo out = run(device, in);
    const double worst = worst_difference(out, in);
    std::printf("30 dB under the threshold at defaults: worst difference from the input %g\n",
                worst);
    EXPECT(worst < 1.0e-6, "a tone under the threshold comes out as it went in");
    EXPECT(device.meter(0) == 0.0f, "and the meter stays on 0");
  }

  // 11. Mix 0 is the input whatever else is set; Make-up is plain gain.
  {
    device.init(kRate);
    device.set_param(p::kThreshold, -60.0f);
    device.set_param(p::kRatio, 10.0f);
    device.set_param(p::kAttack, 10.0f);
    device.set_param(p::kMakeup, 24.0f);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> in;
    add_tone(in, 1000.0, 1.0, 0.5);
    Stereo out = run(device, in);
    const double worst = worst_difference(out, in);
    EXPECT(worst < 1.0e-6, "Mix 0 passes the input through");
    EXPECT(device.meter(0) < -30.0f, "while the compressor behind it is hard at work");

    device.init(kRate);
    device.set_param(p::kMakeup, 6.0f);
    std::vector<float> quiet;
    add_tone(quiet, 1000.0, 1.0, amp(kThreshold - 30.0));
    out = run(device, quiet);
    const double lift = gain_db(out, quiet, at(0.5), at(1.0));
    std::printf("Mix 0: worst difference from the input %g; Make-up +6 dB lifts a quiet tone "
                "%.4f dB\n",
                worst, lift);
    EXPECT_NEAR(lift, 6.0, 0.05, "Make-up +6 dB raises a tone under the threshold by 6 dB");
  }

  // 12. No clicks: Make-up swept across its range, and Threshold swept down
  // through a tone at the fastest attack, a decibel every 128-frame block.
  // The largest jump between two samples stays within 1.5 times the one the
  // 220 Hz tone makes by itself at the loudest gain reached.
  {
    const double own_step = 2.0 * std::sin(kPi * 220.0 / kRate);  // of a unit sine
    auto sweep = [&](int id, float from, float to, const char* name) {
      std::vector<float> in;
      add_tone(in, 220.0, 0.5, 0.5);
      device.set_param(id, from);
      run(device, in);
      Stereo out;
      const float direction = to > from ? 1.0f : -1.0f;
      for (float value = from; (to - value) * direction >= 0.0f; value += direction) {
        device.set_param(id, value);
        std::vector<float> block;
        for (int i = 0; i < kBlock; ++i) {
          block.push_back(static_cast<float>(
              0.5 * std::sin(2.0 * kPi * 220.0 * static_cast<double>(in.size() + out.size() + i) /
                             kRate)));
        }
        out = concat(out, run(device, block));
      }
      const double limit = 1.5 * own_step * peak(out.left);
      std::printf("%s swept %g to %g: largest step %.5f, %.2f of the tone's own at its loudest "
                  "(peak %.3f)\n",
                  name, from, to, max_step(out.left), max_step(out.left) / (limit / 1.5),
                  peak(out.left));
      return max_step(out.left) <= limit;
    };
    device.init(kRate);
    EXPECT(sweep(p::kMakeup, -12.0f, 24.0f, "Make-up"), "sweeping Make-up up does not click");
    EXPECT(sweep(p::kMakeup, 24.0f, -12.0f, "Make-up"), "sweeping Make-up down does not click");
    device.init(kRate);
    device.set_param(p::kRatio, 10.0f);
    device.set_param(p::kKnee, 0.0f);
    device.set_param(p::kAttack, 10.0f);
    EXPECT(sweep(p::kThreshold, 0.0f, -60.0f, "Threshold"), "sweeping Threshold does not click");
    EXPECT(device.meter(0) < -30.0f, "the Threshold sweep took the gain down 30 dB or more");

    // The gain itself, read sample by sample off a small DC probe on the
    // right channel (the detector's high-pass does not see it), during the
    // fastest attack there is: 21.6 dB to go at Attack 10 ms (the tone is on
    // one channel, which reads 3 dB lower, so it is 27 dB over). A control
    // tick can close 1 - exp(-16 / 480) of the distance, 0.71 dB at most, and
    // the ramp spreads that over the tick's 16 samples instead of stepping.
    device.init(kRate);
    device.set_param(p::kThreshold, -30.0f);
    device.set_param(p::kRatio, 10.0f);
    device.set_param(p::kKnee, 0.0f);
    device.set_param(p::kAttack, 10.0f);
    std::vector<float> left;
    add_tone(left, 1000.0, 0.5, amp(-30.0 + 24.0 + 10.0 * std::log10(2.0)));
    const std::vector<float> probe(left.size(), 0.001f);
    Stereo out = run(device, left, probe);
    const double tick = 1.0 - std::pow(10.0, -21.6 * (1.0 - std::exp(-16.0 / 480.0)) / 20.0);
    double fastest = 0.0;
    for (size_t i = 1; i < probe.size(); ++i) {
      fastest = std::max(fastest, std::fabs(static_cast<double>(out.right[i]) - out.right[i - 1]));
    }
    fastest /= 0.001;
    const double arrived = db(out.right[probe.size() - 1] / 0.001);
    std::printf("fastest attack: the gain moves %.5f a sample at most (a tick may move it %.5f, "
                "a sixteenth is %.5f) on its way to %.2f dB\n",
                fastest, tick, tick / 16.0, arrived);
    EXPECT_NEAR(arrived, -21.6, 0.1, "the probe saw the whole attack");
    EXPECT(fastest <= tick / 16.0, "the gain is ramped between control ticks, not stepped at them");
  }

  // 13. Rest: after silence the meter is on 0 exactly and the next sound is
  // met at unity gain; a gap shorter than the half second keeps the gain; and
  // where the rest falls does not depend on the block size.
  {
    std::vector<float> loud;
    add_tone(loud, 1000.0, 1.5, amp(kThreshold + 12.0));
    hard(device, 100.0f, 20.0f);
    device.set_param(p::kTails, 1.0f);
    run(device, loud);
    const float before = device.meter(0);
    Stereo gap = render(device, 0.25f, kRate);
    const float kept = device.meter(0);
    Stereo again = run(device, loud);
    const double resumed = gain_db(again, loud, 0, kCycle);
    Stereo rest = render(device, 1.0f, kRate);
    const float asleep = device.meter(0);
    Stereo woken = run(device, loud);
    const double fresh = gain_db(woken, loud, 0, kCycle);
    std::printf("meter %.3f dB while compressing, %.3f dB after a 0.25 s gap (next sound met at "
                "%.3f dB), %g dB after 1 s of silence (next sound met at %.4f dB)\n",
                before, kept, resumed, asleep, fresh);
    EXPECT(peak(gap.left) == 0.0 && peak(rest.left) == 0.0 && peak(rest.right) == 0.0,
           "silence in is exact silence out");
    EXPECT(kept < -8.5f && resumed < -8.0, "a quarter second of silence keeps the gain");
    EXPECT(asleep == 0.0f, "the meter reads exactly 0 once the device rests");
    EXPECT_NEAR(fresh, 0.0, 0.01, "the first sound after a silence is met at unity gain");

    std::vector<float> phrase = loud;
    phrase.resize(phrase.size() + at(0.52), 0.0f);
    add_tone(phrase, 1000.0, 0.5, amp(kThreshold + 12.0));
    double worst = 0.0;
    Stereo reference;
    for (int block : {128, 2048, 1, 77}) {
      hard(device, 100.0f, 20.0f);
      Stereo out = run(device, phrase, block);
      if (block == 128) reference = out;
      for (size_t i = 0; i < phrase.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
      }
    }
    std::printf("a rest between two sounds in blocks of 128, 2048, 1 and 77: worst difference %g\n",
                worst);
    EXPECT(worst < 1.0e-6, "the rest falls on the same sample whatever the block size");
  }

  // A NaN or an infinite sample in the input passes as it came and does not
  // stay in the detector: every other sample is finite and the gain is right.
  {
    hard(device, 100.0f, 2.0f);
    std::vector<float> in;
    add_tone(in, 1000.0, 3.0, amp(kThreshold + 12.0));
    const size_t bad[2] = {at(0.5), at(0.6)};
    in[bad[0]] = std::nanf("");
    in[bad[1]] = HUGE_VALF;
    Stereo out = run(device, in);
    bool clean = true;
    for (size_t i = 0; i < in.size(); ++i) {
      if (i != bad[0] && i != bad[1]) clean = clean && std::isfinite(out.left[i]);
    }
    EXPECT(clean, "a NaN or infinite input sample does not spread to the samples after it");
    EXPECT_NEAR(gain_db(out, in, at(2.5), at(3.0)), -9.0, 0.1,
                "and the reduction settles where it should afterwards");
  }

  // 14. Cost, on noise that keeps it compressing.
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> load = noise(10.0f, kRate, 0.25f);
  report_cost("ambient-comp", 10.0f, kRate, [&] { run(device, load); });
  std::printf("the noise is held %.2f dB down\n", device.meter(0));
  EXPECT(device.meter(0) < -2.0f, "the cost is measured while it compresses");

  return finish("ambient-comp");
}
