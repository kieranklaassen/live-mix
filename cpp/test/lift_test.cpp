// Native harness for Lift (cpp/devices/lift). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it an upward compressor for sustained sound:
// the curve, the times, the lookahead, the split, and that it never lifts
// silence or anything loud.

#include <chrono>
#include <cstdlib>
#include <ctime>

#include "../devices/lift/lift.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Lift;
namespace p = livemix::lift;

static Lift device;

static const float kRate = 48000.0f;
static const int kLatency = Lift::kLatency;

// A wide-band lift with short times, so a steady tone settles on the curve.
static void plain(Lift& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kThreshold, -30.0f);
  d.set_param(p::kAmount, 0.5f);
  d.set_param(p::kFloor, -70.0f);
  d.set_param(p::kRise, 0.05f);
  d.set_param(p::kHold, 0.01f);
  d.set_param(p::kSplit, 0.0f);
  d.set_param(p::kFocus, 0.0f);
  d.set_param(p::kLimit, 30.0f);
  d.set_param(p::kHear, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// A sine whose RMS is `level_db` dBFS.
static std::vector<float> tone(float hz, float level_db, float seconds, float rate = kRate) {
  return sine(hz, seconds, rate, static_cast<float>(std::sqrt(2.0) * std::pow(10.0, level_db / 20.0)));
}

// The gain in dB the device settles at for a steady tone: output over input
// at the tone's frequency, over the last quarter of the render.
static double settled_gain(Lift& d, float hz, float level_db, float seconds = 1.5f) {
  const std::vector<float> in = tone(hz, level_db, seconds);
  Stereo out = run(d, in);
  const size_t from = in.size() * 3 / 4;
  return db(tone_level(out.left, hz, kRate, from, in.size()) /
            tone_level(in, hz, kRate, from, in.size()));
}

// `x` delayed by the device's latency, for comparing with its output.
static std::vector<float> late(const std::vector<float>& x) {
  std::vector<float> out(x.size(), 0.0f);
  for (size_t i = kLatency; i < x.size(); ++i) out[i] = x[i - kLatency];
  return out;
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b,
                               size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i]));
  }
  return worst;
}

// --- checks ---

// The static curve, measured with steady tones: unity over the threshold,
// carried Amount of the way up down to 6 dB over the floor, capped by Limit,
// less and less over those 6 dB, and nothing at the floor or under it.
static void check_curve() {
  struct Point {
    float level;
    float lift;
  };
  // Threshold -30, Amount 0.5, Floor -70, Limit 30.
  // In the knee: 6 dB over the floor all of it, 5 dB over it 25/27 of 17.5 dB,
  // half way half of 18.5 dB, 1 dB over it 2/27 of 19.5 dB.
  const Point points[] = {{-6.0f, 0.0f},      {-12.0f, 0.0f},  {-20.0f, 0.0f},   {-29.0f, 0.0f},
                          {-36.0f, 3.0f},     {-45.0f, 7.5f},  {-55.0f, 12.5f},  {-62.0f, 16.0f},
                          {-64.0f, 17.0f},    {-65.0f, 16.2037f}, {-67.0f, 9.25f}, {-69.0f, 1.4444f},
                          {-70.0f, 0.0f},     {-71.0f, 0.0f},  {-76.0f, 0.0f},   {-90.0f, 0.0f}};
  char label[160];
  for (const Point& point : points) {
    plain(device);
    // Four seconds: near the knee the Floor's share comes in at 8 dB a second.
    const double gain = settled_gain(device, 440.0f, point.level, 4.0f);
    // In the knee the curve is steep: up to 4.6 dB of lift for a dB of level.
    const double tolerance = point.level >= -30.0f ? 0.1 : (point.level < -64.0f && point.level > -70.0f ? 0.5 : 0.2);
    std::snprintf(label, sizeof label, "curve: a tone at %.0f dB is lifted by %.1f dB (got %.2f)",
                  point.level, point.lift, gain);
    EXPECT(std::fabs(gain - point.lift) < tolerance, label);
    EXPECT(std::fabs(Lift::curve(point.level, -30.0f, 0.5f, -70.0f, 30.0f) - point.lift) < 1.0e-3,
           "curve: the device's own formula gives the stated lift");
  }
  // Over the threshold the gain is one to the sample, not only to a tenth of a dB.
  plain(device);
  const std::vector<float> loud = tone(440.0f, -20.0f, 1.0f);
  Stereo out = run(device, loud);
  EXPECT(worst_difference(out.left, late(loud), 4800) == 0.0,
         "over the threshold the output is the input, latency late, sample for sample");
  // The first samples: the level passes through the lifted region on its way up.
  std::printf("lift: a tone's onset differs from the input by at most %.2e (peak %.3f)\n",
              worst_difference(out.left, late(loud)), peak(loud));
  EXPECT(worst_difference(out.left, late(loud)) < 2.0e-4, "and its onset is within 0.01 dB of it");

  // Limit caps the lift wherever the curve asks for more.
  plain(device);
  device.set_param(p::kLimit, 6.0f);
  EXPECT_NEAR(settled_gain(device, 440.0f, -60.0f), 6.0, 0.2, "Limit caps the lift at 6 dB");
  plain(device);
  device.set_param(p::kLimit, 0.0f);
  EXPECT_NEAR(settled_gain(device, 440.0f, -60.0f), 0.0, 0.01, "Limit 0 is no lift");
  // Amount 1 carries everything between floor and threshold up to the threshold.
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  EXPECT_NEAR(settled_gain(device, 440.0f, -50.0f), 20.0, 0.2, "Amount 1 lifts to the threshold");
  plain(device);
  device.set_param(p::kAmount, 0.0f);
  EXPECT_NEAR(settled_gain(device, 440.0f, -50.0f), 0.0, 0.01, "Amount 0 is no lift");
  // A floor over the threshold leaves nothing to lift.
  plain(device);
  device.set_param(p::kThreshold, -60.0f);
  device.set_param(p::kFloor, -40.0f);
  EXPECT_NEAR(settled_gain(device, 440.0f, -65.0f), 0.0, 0.01, "a floor over the threshold: no lift");
  // The curve holds over the piano's range, the lowest notes included.
  for (float hz : {41.2f, 110.0f, 1760.0f, 4186.0f}) {
    plain(device);
    std::snprintf(label, sizeof label, "curve: %.0f Hz at -50 dB is lifted by 10 dB", hz);
    EXPECT(std::fabs(settled_gain(device, hz, -50.0f, 2.0f) - 10.0) < 0.25, label);
  }
}

// Silence and noise under the floor: nothing in is exactly nothing out, and
// hiss at -90 dB comes out at -90 dB, at the hardest setting there is.
static void check_quiet_stays_down() {
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kThreshold, -12.0f);
  device.set_param(p::kSplit, 1.0f);
  Stereo nothing = render(device, 2.0f, kRate);
  EXPECT(peak(nothing.left) == 0.0 && peak(nothing.right) == 0.0, "silence in is silence out");
  rng_state() = 0x5EEDu;
  const std::vector<float> hiss = noise(3.0f, kRate, static_cast<float>(std::pow(10.0, -90.0 / 20.0) * std::sqrt(3.0)));
  Stereo out = run(device, hiss);
  const size_t from = static_cast<size_t>(kRate);
  const double added = db(rms(out.left, from) / rms(hiss, from - kLatency, hiss.size() - kLatency));
  EXPECT(std::fabs(added) < 0.01, "noise at -90 dB is not lifted");
  // Hiss 10 dB over the lowest floor is, so the check above is the floor's doing.
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kFloor, -90.0f);
  std::vector<float> louder = hiss;
  for (float& v : louder) v *= 3.1623f;
  Stereo lifted = run(device, louder);
  EXPECT(db(rms(lifted.left, from) / rms(louder, from)) > 10.0, "with the floor 10 dB under it the hiss is lifted");
}

// Runs `in` through the device 16 frames at a time and keeps a reading after
// every block: one per control tick.
struct Traced {
  Stereo out;
  std::vector<float> reading;
  // The reading at a time in seconds.
  float at(double seconds) const {
    const size_t index = static_cast<size_t>(seconds * kRate / 16.0);
    return reading[std::min(index, reading.size() - 1)];
  }
};

static Traced trace(Lift& d, const std::vector<float>& in, int meter = 0) {
  Traced traced;
  traced.out.left.resize(in.size());
  traced.out.right.resize(in.size());
  for (size_t done = 0; done < in.size(); done += 16) {
    const int frames = static_cast<int>(std::min<size_t>(16, in.size() - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = in[done + i];
      d.in_right()[i] = in[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      traced.out.left[done + i] = d.out_left()[i];
      traced.out.right[done + i] = d.out_right()[i];
    }
    traced.reading.push_back(d.meter(meter));
  }
  return traced;
}

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

// Rise is the time the lift takes to cover 99 % of the way up; a loud sound
// takes it down at once, whatever Hold says (Hold itself is checked below).
static void check_times() {
  char label[160];
  // Rise: from rest, a quiet tone asks for 12.5 dB.
  for (float rise : {0.2f, 2.0f}) {
    plain(device);
    device.set_param(p::kRise, rise);
    Traced traced = trace(device, tone(440.0f, -55.0f, rise * 1.5f + 0.2f));
    const double half = traced.at(rise * 0.5), whole = traced.at(rise);
    std::snprintf(label, sizeof label, "Rise %.1f s: 90 %% of 12.5 dB at half the time (%.2f), 99 %% at the time (%.2f)",
                  rise, half, whole);
    EXPECT(std::fabs(half - 11.25) < 0.5 && whole > 12.2 && whole < 12.6, label);
  }
  // A loud tone after a quiet one: whatever Hold says, the lift is gone in 3 ms.
  for (float hold : {0.01f, 2.0f}) {
    plain(device);
    device.set_param(p::kHold, hold);
    // Long enough for the Hold to pass and the lift to come in.
    const float passage = hold + 1.0f;
    const std::vector<float> quiet = tone(440.0f, -55.0f, passage);
    Traced traced = trace(device, join(quiet, tone(440.0f, -12.0f, 0.5f)));
    const double before = traced.at(passage - 0.001);
    // One tick to see the note and one to ramp.
    const double gone = traced.at(passage + 32.0 / kRate + 0.003);
    std::snprintf(label, sizeof label, "Hold %.2f s: a loud note takes the lift from %.2f dB to %.3f dB in 3 ms",
                  hold, before, gone);
    EXPECT(before > 12.3 && gone < 0.012 * before, label);
  }
}

// A loud note after a quiet passage is not overshot: the lift is out of its
// way before it arrives, so the note comes out as it went in.
static void check_attack_untouched() {
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kRise, 0.2f);
  const std::vector<float> quiet = tone(440.0f, -55.0f, 1.0f);
  const std::vector<float> in = join(quiet, tone(660.0f, -12.0f, 0.5f));
  Stereo out = run(device, in);
  const std::vector<float> dry = late(in);
  const size_t onset = quiet.size() + kLatency;
  // The passage before it was lifted by 25 dB.
  EXPECT_NEAR(db(rms(out.left, onset - 9600, onset - 480) / rms(dry, onset - 9600, onset - 480)), 25.0, 0.3,
              "the quiet passage before the note is lifted by 25 dB");
  const double over = worst_difference(out.left, dry, onset);
  std::printf("lift: a loud note after a lifted passage differs from the input by at most %.2e (%.3f dB of its peak)\n",
              over, db(1.0 + over / peak(in)));
  EXPECT(db(1.0 + over / peak(in)) < 0.02, "a loud note after a quiet passage is not overshot");
  EXPECT(peak(out.left, onset, onset + 480) <= peak(dry, onset, onset + 480) * 1.002,
         "its first 10 ms peak no higher than the input's");
  // A note only 8 dB over the threshold: the RMS alone would be 9 ms late for
  // it, the peak reading sees it at once.
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kRise, 0.2f);
  const std::vector<float> near_in = join(quiet, tone(660.0f, -22.0f, 0.5f));
  Stereo near_out = run(device, near_in);
  const double near_over = worst_difference(near_out.left, late(near_in), onset);
  std::printf("lift: a note 8 dB over the threshold after a lifted passage: %.3f dB of its peak\n",
              db(1.0 + near_over / peak(near_in)));
  EXPECT(db(1.0 + near_over / peak(near_in)) < 0.05, "a note 8 dB over the threshold is not overshot either");
  // The same with the longest Hold.
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kRise, 0.2f);
  device.set_param(p::kHold, 0.5f);
  Stereo slow = run(device, in);
  EXPECT(rms(slow.left, onset - 4800, onset - 480) > 10.0 * rms(dry, onset - 4800, onset - 480),
         "Hold 0.5 s: the end of the quiet passage is lifted by 20 dB and more");
  const double slow_over = worst_difference(slow.left, dry, onset);
  EXPECT(db(1.0 + slow_over / peak(in)) < 0.02, "Hold 0.5 s: a loud note is still not overshot");
}

// Under the threshold the lift follows quiet sound that swells in 20 ms
// (kFallSeconds). And the ceiling over it: no lift may carry a sound past the
// threshold.
static void check_swell_and_ceiling() {
  const std::vector<float> quiet = tone(440.0f, -50.0f, 1.0f);
  // -50 dB asks for 10 dB, -40 dB for 5 dB (Threshold -30, Amount 0.5).
  plain(device);
  Traced fast = trace(device, join(quiet, tone(440.0f, -40.0f, 1.0f)));
  EXPECT_NEAR(fast.at(0.99), 10.0, 0.1, "the quiet tone is lifted 10 dB");
  EXPECT_NEAR(fast.at(1.1), 5.0, 0.1, "100 ms after a swell the lift is on the curve");
  // A swell to -33 dB: the curve asks for 1.5 dB, the ceiling is 3 dB. The
  // lift of 10 dB is never over the ceiling once the swell is there.
  plain(device);
  Traced capped = trace(device, join(quiet, tone(440.0f, -33.0f, 1.0f)));
  float most = 0.0f;
  for (size_t i = static_cast<size_t>(1.001 * kRate / 16.0); i < capped.reading.size(); ++i) {
    most = std::max(most, capped.reading[i]);
  }
  std::printf("lift: a swell to 3 dB under the threshold: the lift is %.2f dB at the most from 1 ms on\n", most);
  EXPECT(most < 3.2f && most > 1.4f, "a lingering lift is held to the ceiling: never past the threshold");
  // So a full-scale note after the quietest passage, at the hardest setting
  // (the highest Threshold, every part on its own, the longest Hold), peaks
  // no higher than it went in but for kOverDb.
  double worst = 0.0;
  for (float hz : {55.0f, 130.81f, 523.25f, 2093.0f}) {
    plain(device);
    device.set_param(p::kAmount, 1.0f);
    device.set_param(p::kThreshold, p::kParamMax[p::kThreshold]);
    device.set_param(p::kHold, 5.0f);
    device.set_param(p::kSplit, 1.0f);
    const std::vector<float> hit = join(tone(440.0f, -60.0f, 1.0f), sine(hz, 0.5f, kRate, 1.0f));
    Stereo out = run(device, hit);
    worst = std::max(worst, peak(out.left, 48000 + kLatency));
  }
  std::printf("lift: full scale after a passage lifted 30 dB, hardest setting: peak %.3f\n", worst);
  EXPECT(worst < 1.036, "a full-scale note after a lifted passage peaks under 0.3 dB over full scale");
}

// The level in dB of `x` in 10 ms steps, and the time its level first stays
// under `under` dB, in seconds.
static double time_under(const std::vector<float>& x, double under, size_t from) {
  const size_t window = 480;
  for (size_t at = from; at + window <= x.size(); at += window) {
    if (db(rms(x, at, at + window)) < under) return static_cast<double>(at) / kRate;
  }
  return static_cast<double>(x.size()) / kRate;
}

// A decaying tail comes out longer by what the curve says: between floor and
// threshold the output falls (1 - Amount) dB for every dB the input falls.
static void check_tail() {
  const double rate_db = 30.0;  // dB a second
  std::vector<float> tail = tone(440.0f, -10.0f, 4.0f);
  for (size_t i = 0; i < tail.size(); ++i) {
    tail[i] *= static_cast<float>(std::pow(10.0, -rate_db * static_cast<double>(i) / kRate / 20.0));
  }
  plain(device);
  device.set_param(p::kFloor, -90.0f);
  Stereo out = run(device, tail);
  // The input passes -50 dB after 40 dB of decay. The output is at -50 dB when
  // the input is at -70 dB (-70 + 0.5 x 40): 20 dB, two thirds of a second, later.
  const double dry_time = time_under(tail, -50.0, 0);
  const double wet_time = time_under(out.left, -50.0, 0) - kLatency / kRate;
  std::printf("lift: a 30 dB/s tail reaches -50 dB after %.2f s dry, %.2f s lifted\n", dry_time, wet_time);
  EXPECT_NEAR(dry_time, 40.0 / rate_db, 0.03, "the dry tail reaches -50 dB when it should");
  // Less what the lift trails a tail falling this fast by: the detector reads it 0.75 dB high, and
  // Rise and the shaper are 0.3 dB behind, which at 15 dB a second is 0.04 s.
  EXPECT_NEAR(wet_time - dry_time, 20.0 / rate_db - 0.04, 0.03, "the lifted tail is longer by the predicted 0.67 s less the lag");
  // And it falls half as fast while it is lifted: 15 dB a second, 4 s to 60 dB.
  const double decay = rt60(out.left, kRate, 1.0, 0.05, -48.0);
  EXPECT_NEAR(decay, 60.0 / (0.5 * rate_db), 0.25, "the lifted tail decays at half the rate");
  // Amount 1 holds it level: the stretch from threshold to floor comes out flat.
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kFloor, -80.0f);
  Stereo held = run(device, tail);
  const double early = db(rms(held.left, 48000, 52800)), late_on = db(rms(held.left, 72000, 76800));
  // Level, and under the threshold by what the lift trails a 30 dB a second
  // fall by (the detector 0.75 dB, Rise 0.33 dB, the shaper 0.25 dB).
  EXPECT(std::fabs(early - late_on) < 0.3 && early < -30.0 && early > -31.6,
         "Amount 1: the tail is held level from 1 s to 1.5 s, within 1.6 dB under the threshold");
}

// No pumping on a held chord: the lift on steady sound is steady.
static void check_steady() {
  char label[160];
  std::vector<float> chord = tone(220.0f, -45.0f, 8.0f);
  const std::vector<float> third = tone(277.18f, -45.0f, 8.0f), fifth = tone(329.63f, -45.0f, 8.0f);
  for (size_t i = 0; i < chord.size(); ++i) chord[i] += third[i] + fifth[i];
  for (float rise : {1.2f, 0.05f}) {
    device.init(kRate);
    device.set_param(p::kRise, rise);
    Traced traced = trace(device, chord);
    float low = 1.0e9f, high = -1.0e9f;
    for (size_t i = traced.reading.size() * 3 / 4; i < traced.reading.size(); ++i) {
      low = std::min(low, traced.reading[i]);
      high = std::max(high, traced.reading[i]);
    }
    std::snprintf(label, sizeof label, "a held chord, Rise %.2f s: the lift (%.2f dB) moves by %.3f dB",
                  rise, high, high - low);
    std::printf("lift: %s\n", label);
    // The chord beats at 53 and 57 Hz, which the level reading follows by 0.67 dB.
    EXPECT(high > 4.0 && high - low < (rise > 1.0f ? 0.1f : 0.3f), label);
  }
  // A low tone does not wobble the gain at twice its frequency.
  device.init(kRate);
  device.set_param(p::kRise, 0.05f);
  Traced low_tone = trace(device, tone(41.2f, -45.0f, 4.0f));
  float low = 1.0e9f, high = -1.0e9f;
  for (size_t i = low_tone.reading.size() / 2; i < low_tone.reading.size(); ++i) {
    low = std::min(low, low_tone.reading[i]);
    high = std::max(high, low_tone.reading[i]);
  }
  std::printf("lift: a 41 Hz tone at the shortest Rise moves the lift by %.3f dB\n", high - low);
  EXPECT(high - low < 0.15f, "a low tone does not ripple the lift");
}

// Mix 0 is the input, latency late, to the sample; part way is a plain
// crossfade of two copies of one sound, so no held tone is lost or gained
// beyond the lift itself, anywhere on the keyboard.
static void check_mix() {
  device.init(kRate);
  device.set_param(p::kMix, 0.0f);
  device.set_param(p::kAmount, 1.0f);
  rng_state() = 0xA11CEu;
  const std::vector<float> hush = noise(2.0f, kRate, 0.004f);
  Stereo out = run(device, hush);
  EXPECT(worst_difference(out.left, late(hush)) == 0.0 && worst_difference(out.right, late(hush)) == 0.0,
         "Mix 0 is the input 288 samples late, sample for sample");
  // Held tones over the piano's range at Mix 0.5, loud and quiet: never under
  // the dry level (nothing cancels) and never over the full lift.
  double worst_dip = 0.0, worst_over = 0.0;
  for (float midi = 21.0f; midi <= 108.0f; midi += 3.0f) {
    const float hz = 440.0f * std::pow(2.0f, (midi - 69.0f) / 12.0f);
    for (float level : {-12.0f, -45.0f}) {
      device.init(kRate);
      device.set_param(p::kRise, 0.1f);
      const double full = settled_gain(device, hz, level, 2.0f);
      device.init(kRate);
      device.set_param(p::kRise, 0.1f);
      device.set_param(p::kMix, 0.5f);
      const double half = settled_gain(device, hz, level, 2.0f);
      worst_dip = std::min(worst_dip, half);
      worst_over = std::max(worst_over, half - full);
      // Half way between two gains of one sound: the mean of the two.
      const double expected = db(0.5 + 0.5 * std::pow(10.0, full / 20.0));
      if (std::fabs(half - expected) > 0.15) {
        char label[160];
        std::snprintf(label, sizeof label, "Mix 0.5 at %.0f Hz, %.0f dB: %.2f dB, expected %.2f", hz, level, half, expected);
        EXPECT(false, label);
      }
    }
  }
  std::printf("lift: held tones A0 to C8 at Mix 0.5: worst dip %.3f dB, most over the full lift %.3f dB\n",
              worst_dip, worst_over);
  EXPECT(worst_dip > -0.05 && worst_over < 0.05, "Mix 0.5 neither cancels a held tone nor adds to the lift");
}

// Hear "Lift only" is what was added: the lifted sound less the input. With
// "All" beside it the two add up, and over the threshold it is silent.
static void check_lift_only() {
  const std::vector<float> quiet = tone(440.0f, -50.0f, 1.5f);
  plain(device);
  Stereo all = run(device, quiet);
  plain(device);
  device.set_param(p::kHear, 1.0f);
  Stereo only = run(device, quiet);
  const std::vector<float> dry = late(quiet);
  double worst = 0.0;
  for (size_t i = 0; i < dry.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(all.left[i]) - only.left[i] - dry[i]));
  }
  EXPECT(worst < 1.0e-6, "Lift only is the lifted sound less the input");
  // 10 dB of lift adds 10^(10/20) - 1 = 2.16 times the input: 6.7 dB over it.
  EXPECT_NEAR(db(rms(only.left, 48000) / rms(dry, 48000)), db(std::pow(10.0, 0.5) - 1.0), 0.2,
              "Lift only at 10 dB of lift is 6.7 dB over the input");
  plain(device);
  device.set_param(p::kHear, 1.0f);
  Stereo loud = run(device, tone(440.0f, -12.0f, 1.0f));
  EXPECT(peak(loud.left, 4800) == 0.0, "Lift only is silent while the sound is over the threshold");
}

// The gain in dB at one frequency of a mix of tones, over the last quarter.
static double gain_at(const Stereo& out, const std::vector<float>& in, float hz) {
  const size_t from = in.size() * 3 / 4;
  return db(tone_level(out.left, hz, kRate, from, in.size()) / tone_level(in, hz, kRate, from, in.size()));
}

static std::vector<float> sum(std::vector<float> a, const std::vector<float>& b) {
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) a[i] += b[i];
  return a;
}

// Split: at nothing the sound rises as one; fully up each part rises by its
// own level, so a quiet top comes up under a loud bottom.
static void check_split() {
  const std::vector<float> in = sum(tone(60.0f, -15.0f, 2.0f), tone(6000.0f, -45.0f, 2.0f));
  double top[3], bottom[3];
  const float splits[3] = {0.0f, 0.5f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    plain(device);
    device.set_param(p::kSplit, splits[i]);
    Stereo out = run(device, in);
    top[i] = gain_at(out, in, 6000.0f);
    bottom[i] = gain_at(out, in, 60.0f);
  }
  std::printf("lift: quiet 6 kHz under loud 60 Hz, Split 0 / 0.5 / 1: top %.2f %.2f %.2f dB, bottom %.3f %.3f %.3f dB\n",
              top[0], top[1], top[2], bottom[0], bottom[1], bottom[2]);
  EXPECT(std::fabs(top[0]) < 0.01 && std::fabs(bottom[0]) < 0.01, "Split 0: nothing is lifted under a loud sound");
  EXPECT(top[2] > 4.0 && top[1] > 0.4 * top[2] && top[1] < 0.6 * top[2],
         "Split lifts the quiet top under the loud bottom, half way at half");
  EXPECT(std::fabs(bottom[1]) < 0.1 && std::fabs(bottom[2]) < 0.1, "and the loud bottom stays where it is");

  // A loud tone alone, 6 dB over the threshold, with Split, Amount and Limit
  // all the way up: its skirts in the other parts are lifted, a quarter turn
  // away from it. It may gain a little; it never loses.
  double most = 0.0, least = 0.0, most_default = 0.0, least_default = 0.0;
  for (float midi = 21.0f; midi <= 108.0f; midi += 3.0f) {
    const float hz = 440.0f * std::pow(2.0f, (midi - 69.0f) / 12.0f);
    plain(device);
    device.set_param(p::kSplit, 1.0f);
    device.set_param(p::kAmount, 1.0f);
    const double hard = settled_gain(device, hz, -24.0f, 2.0f);
    most = std::max(most, hard);
    least = std::min(least, hard);
    device.init(kRate);
    device.set_param(p::kRise, 0.1f);
    const double soft = settled_gain(device, hz, -12.0f, 2.0f);
    most_default = std::max(most_default, soft);
    least_default = std::min(least_default, soft);
  }
  std::printf("lift: a tone 6 dB over the threshold, Split and Amount at 1: %.3f to %.3f dB; -12 dB at the defaults: %.3f to %.3f dB\n",
              least, most, least_default, most_default);
  EXPECT(least > -0.02 && most < 3.0, "a loud tone gains under 3 dB from its skirts at the hardest setting");
  EXPECT(least_default > -0.01 && most_default < 0.15, "and under 0.15 dB at the defaults, 12 dB over the threshold");
}

// Focus aims the lift: right at the highs, left at the lows.
static void check_focus() {
  const std::vector<float> in =
      sum(sum(tone(80.0f, -50.0f, 2.0f), tone(800.0f, -50.0f, 2.0f)), tone(8000.0f, -50.0f, 2.0f));
  double low[3], mid[3], high[3];
  const float focus[3] = {-1.0f, 0.0f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    plain(device);
    device.set_param(p::kFocus, focus[i]);
    Stereo out = run(device, in);
    low[i] = gain_at(out, in, 80.0f);
    mid[i] = gain_at(out, in, 800.0f);
    high[i] = gain_at(out, in, 8000.0f);
  }
  std::printf("lift: Focus -1 / 0 / 1: 80 Hz %.1f %.1f %.1f, 800 Hz %.1f %.1f %.1f, 8 kHz %.1f %.1f %.1f dB\n",
              low[0], low[1], low[2], mid[0], mid[1], mid[2], high[0], high[1], high[2]);
  // The three tones together read -45.2 dB: the curve asks for 7.6 dB.
  EXPECT(std::fabs(low[1] - 7.6) < 0.3 && std::fabs(mid[1] - 7.6) < 0.3 && std::fabs(high[1] - 7.6) < 0.3,
         "Focus 0 lifts the whole spectrum alike");
  EXPECT(high[2] > 6.5 && low[2] < 1.5 && mid[2] > low[2] && mid[2] < high[2],
         "Focus 1 lifts the highs, the middle half, the lows hardly");
  EXPECT(low[0] > 6.5 && high[0] < 1.5 && mid[0] > high[0] && mid[0] < low[0],
         "Focus -1 lifts the lows, the middle half, the highs hardly");
}

// Stereo: one gain for both sides, read from their mean power, so the image
// stays put and a sound in opposite phase is lifted like any other.
static void check_stereo() {
  const std::vector<float> left = tone(440.0f, -50.0f, 1.5f);
  std::vector<float> opposite = left, quieter = left, none(left.size(), 0.0f);
  for (float& v : opposite) v = -v;
  for (float& v : quieter) v *= 0.3162f;
  const size_t from = left.size() * 3 / 4;
  plain(device);
  Stereo anti = run(device, left, opposite);
  EXPECT_NEAR(db(rms(anti.left, from) / rms(left, from)), 10.0, 0.2, "a sound in opposite phase is lifted as it should be");
  EXPECT(worst_difference(anti.left, opposite) > 0.0 && rms(anti.right, from) == rms(anti.left, from),
         "and both sides get the same gain");
  plain(device);
  Stereo wide = run(device, left, quieter);
  EXPECT_NEAR(db(rms(wide.right, from) / rms(wide.left, from)), -10.0, 0.01, "the balance between the sides is kept");
  plain(device);
  Stereo one = run(device, left, none);
  // One side only is 3 dB less mean power: -53 dB asks for 11.5 dB.
  EXPECT_NEAR(db(rms(one.left, from) / rms(left, from)), 11.5, 0.2, "a sound on one side reads 3 dB lower");
  EXPECT(peak(one.right) == 0.0, "and the silent side stays silent");
}

// Bad input: samples that are not numbers, or far out of range, are taken as
// silence and leave nothing behind: once good input returns the output is the
// lifted sound again, as if nothing had happened.
static void check_bad_input() {
  const std::vector<float> good = tone(440.0f, -50.0f, 2.0f);
  plain(device);
  Stereo clean = run(device, good);
  for (float bad : {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f}) {
    plain(device);
    std::vector<float> wild = tone(440.0f, -50.0f, 0.25f);
    for (size_t i = 2000; i < 6000; ++i) wild[i] = (i % 3 == 0) ? bad : wild[i];
    Stereo during = run(device, wild);
    EXPECT(finite(during.left) && finite(during.right) && peak(during.left) < 1.0,
           "bad samples never reach the output");
    // After a second of silence the device is at rest again: the same tone gives the same output.
    render(device, 1.0f, kRate);
    Stereo after = run(device, good);
    EXPECT(finite(after.left) && worst_difference(after.left, clean.left) == 0.0,
           "after bad input and a rest the device is as it was");
    // And with no rest: it carries on, finite, and the lift is back within a second.
    plain(device);
    run(device, wild);
    Stereo on = run(device, good);
    EXPECT(finite(on.left) && std::fabs(db(rms(on.left, 72000) / rms(good, 72000)) - 10.0) < 0.2,
           "straight after bad input the lift settles where it should");
  }
}

// Moving a control while a lifted tone sounds does not click: the largest
// step in the output is no larger than the tone's own.
static void check_clicks() {
  char label[160];
  const std::vector<float> held = tone(220.0f, -50.0f, 1.0f);
  struct Move {
    const char* name;
    int id;
    float from, to;
  };
  const Move moves[] = {{"Hear", p::kHear, 0.0f, 1.0f},        {"Hear back", p::kHear, 1.0f, 0.0f},
                        {"Mix", p::kMix, 1.0f, 0.0f},          {"Amount", p::kAmount, 1.0f, 0.0f},
                        {"Threshold", p::kThreshold, -12.0f, -60.0f}, {"Limit", p::kLimit, 30.0f, 0.0f},
                        {"Split", p::kSplit, 0.0f, 1.0f},      {"Focus", p::kFocus, -1.0f, 1.0f},
                        {"Floor", p::kFloor, -90.0f, -40.0f}};
  for (const Move& move : moves) {
    // The reference: the same tone with the control where it starts, no event in it.
    plain(device);
    device.set_param(move.id, move.from);
    run(device, held);
    Stereo reference = run(device, held);
    plain(device);
    device.set_param(move.id, move.from);
    run(device, held);
    device.set_param(move.id, move.to);
    Stereo moved = run(device, held);
    // And where it ends: a jump can be no larger than the louder of the two.
    plain(device);
    device.set_param(move.id, move.to);
    run(device, held);
    Stereo ended = run(device, held);
    // Or, for a control that passes through a louder setting, of its middle.
    plain(device);
    device.set_param(move.id, move.id == p::kHear ? move.to : 0.5f * (move.from + move.to));
    run(device, held);
    Stereo between = run(device, held);
    const double allowed =
        std::max(max_step(between.left), std::max(max_step(reference.left), max_step(ended.left)));
    std::snprintf(label, sizeof label, "%s moved while sounding: largest step %.5f, the tone's own %.5f",
                  move.name, max_step(moved.left), allowed);
    EXPECT(max_step(moved.left) <= allowed * 1.05 + 1.0e-6, label);
  }
}

// Runs `in` in blocks of `block` frames, moving controls at given samples
// (which must fall on block edges of every size used).
struct Event {
  size_t at;
  int id;
  float value;
};

static Stereo run_with_events(Lift& d, const std::vector<float>& in, int block, const std::vector<Event>& events) {
  Stereo out;
  out.left.resize(in.size());
  out.right.resize(in.size());
  size_t done = 0;
  while (done < in.size()) {
    for (const Event& event : events) {
      if (event.at == done) d.set_param(event.id, event.value);
    }
    const int frames = static_cast<int>(std::min<size_t>(static_cast<size_t>(block), in.size() - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = in[done + i];
      d.in_right()[i] = in[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// The same audio at block sizes 1, 128 and 2048, across a silence long
// enough to rest and sleep in, with knobs moved while it sleeps and while it
// sounds. Knobs moved asleep snap: the first sound after is at the new setting.
static void check_blocks_and_sleep() {
  // 2 s of tone, 2 s of silence, 2 s of tone: every event on a 2048-frame edge.
  std::vector<float> in = tone(330.0f, -45.0f, 2.0f);
  in.resize(4096 * 48, 0.0f);
  const std::vector<float> again = tone(330.0f, -45.0f, 2.0f);
  in.insert(in.end(), again.begin(), again.end());
  in.resize(4096 * 72, 0.0f);
  const std::vector<Event> events = {{4096 * 8, p::kAmount, 0.9f},      // while sounding
                                     {4096 * 40, p::kThreshold, -20.0f},  // asleep
                                     {4096 * 40, p::kMix, 0.7f},
                                     {4096 * 60, p::kSplit, 1.0f}};       // sounding again
  Stereo by[3];
  const int blocks[3] = {1, 128, 2048};
  for (int i = 0; i < 3; ++i) {
    device.init(kRate);
    by[i] = run_with_events(device, in, blocks[i], events);
  }
  const double one = std::max(worst_difference(by[0].left, by[1].left), worst_difference(by[0].right, by[1].right));
  const double big = std::max(worst_difference(by[2].left, by[1].left), worst_difference(by[2].right, by[1].right));
  std::printf("lift: blocks of 1 and of 2048 against 128, across a sleep with knobs moved: %.2e and %.2e\n", one, big);
  EXPECT(one < 1.0e-6 && big < 1.0e-6, "the output is the same at block sizes 1, 128 and 2048 across a sleep");
  // It did rest: exact silence from half a second after the tone stopped.
  EXPECT(peak(by[1].left, 96000 + 24000 + 512, 4096 * 48) == 0.0, "half a second after the sound stops the device rests");
  // The knobs moved asleep snapped: what follows equals a device set that way from the start.
  device.init(kRate);
  device.set_param(p::kAmount, 0.9f);
  device.set_param(p::kThreshold, -20.0f);
  device.set_param(p::kMix, 0.7f);
  Stereo fresh = run(device, again);
  double worst = 0.0;
  for (size_t i = 0; i < 4096 * 10; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(fresh.left[i]) - by[1].left[4096 * 48 + i]));
  }
  EXPECT(worst == 0.0, "knobs moved while it sleeps snap: the next sound is as from a fresh start");
  // A meter reads its resting value at rest.
  device.init(kRate);
  run(device, tone(330.0f, -45.0f, 1.0f));
  EXPECT(device.meter(0) > 5.0f && device.meter(4) > -46.0f && device.meter(4) < -44.0f,
         "the readings: lift up, level at -45 dB while the tone sounds");
  render(device, 1.0f, kRate);
  EXPECT(device.meter(0) == 0.0f && device.meter(1) == 0.0f && device.meter(4) == Lift::kRestDb,
         "at rest the lift reads 0 dB and the level its floor");
}

// At 96 kHz and 44.1 kHz the curve and the times are the same; the lookahead
// is the same count of samples.
static void check_rates() {
  char label[160];
  for (float rate : {44100.0f, 96000.0f}) {
    plain(device, rate);
    const std::vector<float> quiet = tone(440.0f, -55.0f, 1.0f, rate);
    Stereo out = run(device, quiet);
    const size_t from = quiet.size() * 3 / 4;
    const double gain = db(tone_level(out.left, 440.0, rate, from, quiet.size()) / tone_level(quiet, 440.0, rate, from, quiet.size()));
    std::snprintf(label, sizeof label, "at %.0f Hz a tone at -55 dB is lifted by 12.5 dB (%.2f)", rate, gain);
    EXPECT(std::fabs(gain - 12.5) < 0.2, label);
    plain(device, rate);
    device.set_param(p::kMix, 0.0f);
    Stereo dry = run(device, quiet);
    double worst = 0.0;
    for (size_t i = kLatency; i < quiet.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(dry.left[i]) - quiet[i - kLatency]));
    }
    std::snprintf(label, sizeof label, "at %.0f Hz the latency is 288 samples", rate);
    EXPECT(worst == 0.0, label);
  }
}

// Sides: at nothing the middle and the sides get one gain and the image
// stays; fully up only the sides rise, and a sound with no sides is left alone.
static void check_sides() {
  // The middle at -50 dB (440 Hz on both sides) with a side part 12 dB under it (660 Hz, opposite).
  const std::vector<float> centre = tone(440.0f, -50.0f, 1.5f), side = tone(660.0f, -62.0f, 1.5f);
  std::vector<float> left = centre, right = centre;
  for (size_t i = 0; i < left.size(); ++i) {
    left[i] += side[i];
    right[i] -= side[i];
  }
  const size_t from = left.size() * 3 / 4, to = left.size();
  double centre_gain[3], side_gain[3];
  const float sides[3] = {0.0f, 0.5f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    plain(device);
    device.set_param(p::kSides, sides[i]);
    Stereo out = run(device, left, right);
    std::vector<float> mid(out.size()), diff(out.size());
    for (size_t n = 0; n < out.size(); ++n) {
      mid[n] = 0.5f * (out.left[n] + out.right[n]);
      diff[n] = 0.5f * (out.left[n] - out.right[n]);
    }
    centre_gain[i] = db(tone_level(mid, 440.0, kRate, from, to) / tone_level(centre, 440.0, kRate, from, to));
    side_gain[i] = db(tone_level(diff, 660.0, kRate, from, to) / tone_level(side, 660.0, kRate, from, to));
  }
  std::printf("lift: Sides 0 / 0.5 / 1: the middle %.2f %.2f %.2f dB, the sides %.2f %.2f %.2f dB\n",
              centre_gain[0], centre_gain[1], centre_gain[2], side_gain[0], side_gain[1], side_gain[2]);
  // Together they read -49.7 dB: the curve asks for 9.86 dB.
  EXPECT(std::fabs(centre_gain[0] - 9.86) < 0.2 && std::fabs(side_gain[0] - 9.86) < 0.2, "Sides 0: one gain for middle and sides");
  EXPECT(std::fabs(centre_gain[1] - 4.93) < 0.2 && std::fabs(side_gain[1] - 9.86) < 0.2, "Sides 0.5: the middle gets half the lift");
  EXPECT(std::fabs(centre_gain[2]) < 0.01 && std::fabs(side_gain[2] - 9.86) < 0.2, "Sides 1: only the sides are lifted");
  // A sound with nothing at the sides, Sides 1: left exactly alone.
  plain(device);
  device.set_param(p::kSides, 1.0f);
  Stereo mono = run(device, centre);
  EXPECT(worst_difference(mono.left, late(centre)) == 0.0, "Sides 1 leaves a sound with no sides alone, to the sample");
}

// A held chord: harmonics of three notes falling `slope` x 6 dB an octave
// (1 is as bright as a saw, 2 as soft as a triangle), scaled to an RMS of
// `level_db`.
static std::vector<float> pad(float level_db, float seconds, float slope) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate), 0.0f);
  for (float root : {110.0f, 164.81f, 220.0f}) {
    for (int h = 1; root * h < 9000.0f; ++h) {
      const double step = 2.0 * kPi * root * h / kRate, phase = 0.7 * h * h;
      const double size = std::pow(static_cast<double>(h), -static_cast<double>(slope));
      for (size_t i = 0; i < out.size(); ++i) out[i] += static_cast<float>(size * std::sin(step * i + phase));
    }
  }
  const float scale = static_cast<float>(std::pow(10.0, level_db / 20.0) / rms(out));
  for (float& v : out) v *= scale;
  return out;
}

// The default is the idea at once, on a held pad too: it is over the
// threshold as a whole and stays where it is, while its quiet top comes up.
static void check_default_on_a_pad() {
  for (float slope : {2.0f, 1.0f}) {
    const std::vector<float> in = pad(-18.0f, 4.0f, slope);
    device.init(kRate);
    Stereo out = run(device, in);
    const size_t from = in.size() / 2;
    const double whole = db(rms(out.left, from) / rms(in, from));
    const double fundamental = db(tone_level(out.left, 110.0, kRate, from, in.size()) / tone_level(in, 110.0, kRate, from, in.size()));
    const double top = db(tone_level(out.left, 6600.0, kRate, from, in.size()) / tone_level(in, 6600.0, kRate, from, in.size()));
    std::printf("lift: a held %s pad at -18 dB, defaults: whole %+.2f dB, 110 Hz %+.2f dB, 6.6 kHz %+.2f dB, peak %.3f (in %.3f)\n",
                slope > 1.5f ? "soft" : "bright", whole, fundamental, top, peak(out.left), peak(in));
    EXPECT(std::fabs(fundamental) < 0.2 && whole < 0.3, "defaults on a held pad: the body stays where it is");
    EXPECT(top > (slope > 1.5f ? 2.0 : 0.8), "and its quiet top comes up: 2 dB on a soft pad, 0.8 dB on a bright one");
    EXPECT(peak(out.left) < peak(in) * 1.06, "without peaking half a dB over the input");
  }
}

// Ordinary material: slow notes that ring and die away, a little different
// on the two sides, with a soft top. Eight seconds, peaking near -10 dB; the
// last two are the last note dying away, from -60 dB down.
static Stereo phrase() {
  Stereo out;
  const size_t length = static_cast<size_t>(8.0f * kRate);
  out.left.assign(length, 0.0f);
  out.right.assign(length, 0.0f);
  const float notes[6] = {220.0f, 277.18f, 329.63f, 164.81f, 246.94f, 196.0f};
  for (int n = 0; n < 6; ++n) {
    const size_t start = static_cast<size_t>(n * 0.9f * kRate);
    for (int h = 1; h <= 12; ++h) {
      const double step = 2.0 * kPi * notes[n] * h / kRate;
      const double size = 0.22 / (h * h), decay = 2.5 + 0.9 * h;  // per second
      for (size_t i = start; i < length; ++i) {
        const double t = static_cast<double>(i - start) / kRate;
        const double v = size * std::exp(-decay * t) * std::sin(step * (i - start));
        out.left[i] += static_cast<float>(v * (h % 2 ? 1.0 : 0.6));
        out.right[i] += static_cast<float>(v * (h % 2 ? 0.6 : 1.0));
      }
    }
  }
  return out;
}

// How far two renders are apart, in dB under the first one's level.
static double apart_db(const Stereo& a, const Stereo& b, size_t from = 0) {
  double difference = 0.0, level = 0.0;
  for (size_t i = from; i < a.size(); ++i) {
    const double dl = static_cast<double>(a.left[i]) - b.left[i], dr = static_cast<double>(a.right[i]) - b.right[i];
    difference += dl * dl + dr * dr;
    level += static_cast<double>(a.left[i]) * a.left[i] + static_cast<double>(a.right[i]) * a.right[i];
  }
  return 10.0 * std::log10(std::max(difference, 1.0e-30) / std::max(level, 1.0e-30));
}

// No dead part of a knob: on ordinary material every control, moved from its
// lowest setting to its middle and from there to its highest with the rest
// at their defaults, changes what comes out.
static void check_controls_alive() {
  char label[200];
  const Stereo in = phrase();
  for (int id = 0; id < p::kNumParams; ++id) {
    Stereo out[3];
    for (int at = 0; at < 3; ++at) {
      device.init(kRate);
      const float low = p::kParamMin[id], high = p::kParamMax[id];
      // Rise and Hold are laid out by ratio, the rest by difference.
      const bool by_ratio = id == p::kRise || id == p::kHold;
      const float middle = by_ratio ? std::sqrt(low * high) : 0.5f * (low + high);
      // Limit is a cap: its upper half is there for an Amount that asks for
      // more than the default's 18 dB, so it is tried with Amount fully up.
      if (id == p::kLimit) device.set_param(p::kAmount, 1.0f);
      device.set_param(id, at == 0 ? low : at == 1 ? middle : high);
      out[at] = run(device, in.left, in.right);
    }
    // Floor works on the quietest sound there is: it is read where that is, in the last two seconds.
    const size_t from = id == p::kFloor ? static_cast<size_t>(6.0f * kRate) : 0;
    const double lower = apart_db(out[1], out[0], from), upper = apart_db(out[1], out[2], from);
    std::snprintf(label, sizeof label, "control %d on a played phrase: its lower half moves the output by %.1f dB, its upper half by %.1f dB",
                  id, lower, upper);
    std::printf("lift: %s\n", label);
    // Hear has two settings: its middle is one of them.
    EXPECT(id == p::kHear ? std::max(lower, upper) > -40.0 : (lower > -40.0 && upper > -40.0), label);
  }
}

// The sixteen presets as device.json has them, every control filled in
// (copied from the manifest; the first is the effect as it starts).
struct Preset {
  const char* name;
  float values[p::kNumParams];
};
// Which control each column of the table is, by key: the table stands in this
// order whatever the order of the controls in device.json.
static const int kColumns[p::kNumParams] = {p::kThreshold, p::kAmount, p::kFloor, p::kRise, p::kHold, p::kSplit,
                                            p::kFocus,     p::kSides,  p::kLimit, p::kHear, p::kMix};
static float value_of(const Preset& preset, int id) {
  for (int column = 0; column < p::kNumParams; ++column) {
    if (kColumns[column] == id) return preset.values[column];
  }
  std::abort();
}
// --- presets begin ---
// threshold, amount, floor, rise, hold, split, focus, sides, limit, hear, mix
static const Preset kPresets[] = {
    {"Quiet end up", {-22.0f, 0.7f, -54.0f, 0.6f, 0.1f, 0.5f, 0.0f, 0.0f, 18.0f, 0.0f, 1.0f}},
    {"Just the ends", {-31.5f, 1.0f, -54.0f, 0.15f, 0.1f, 1.0f, 0.0f, 0.0f, 18.0f, 0.0f, 1.0f}},
    {"Long tails", {-23.0f, 1.0f, -60.0f, 0.3f, 0.05f, 0.2f, 0.0f, 0.0f, 18.0f, 0.0f, 1.0f}},
    {"Slow tide", {-14.0f, 0.9f, -54.0f, 6.0f, 3.0f, 0.5f, 0.0f, 0.0f, 18.0f, 0.0f, 1.0f}},
    {"Air on top", {-21.0f, 1.0f, -54.0f, 0.4f, 0.1f, 1.0f, 1.0f, 0.0f, 14.0f, 0.0f, 1.0f}},
    {"Warm floor", {-22.0f, 0.9f, -54.0f, 0.5f, 0.1f, 1.0f, -1.0f, 0.0f, 10.0f, 0.0f, 1.0f}},
    {"Opens outward", {-18.0f, 1.0f, -54.0f, 0.4f, 0.1f, 0.3f, 0.0f, 1.0f, 18.0f, 0.0f, 1.0f}},
    {"Half open", {-18.0f, 1.0f, -54.0f, 0.2f, 0.1f, 0.0f, 0.0f, 0.6f, 16.0f, 0.0f, 1.0f}},
    {"Fill every gap", {-25.5f, 1.0f, -54.0f, 0.05f, 0.01f, 0.0f, 0.0f, 0.0f, 14.0f, 0.0f, 1.0f}},
    {"Slightly closer", {-19.0f, 1.0f, -54.0f, 0.3f, 0.1f, 0.0f, 0.0f, 0.0f, 3.0f, 0.0f, 1.0f}},
    {"Steady shine", {-17.0f, 0.6f, -54.0f, 0.3f, 0.1f, 1.0f, 1.0f, 0.0f, 10.0f, 0.0f, 1.0f}},
    {"Real pauses only", {-18.0f, 1.0f, -54.0f, 1.0f, 1.5f, 0.0f, 0.0f, 0.0f, 18.0f, 0.0f, 1.0f}},
    {"Only the tails", {-18.0f, 1.0f, -54.0f, 0.3f, 0.1f, 0.0f, 0.0f, 0.0f, 24.0f, 1.0f, 1.0f}},
    {"Top alone", {-20.0f, 1.0f, -54.0f, 0.2f, 0.1f, 1.0f, 1.0f, 0.0f, 24.0f, 1.0f, 1.0f}},
    {"Low breath", {-18.0f, 1.0f, -54.0f, 0.2f, 0.1f, 0.6f, -1.0f, 0.0f, 24.0f, 1.0f, 0.55f}},
    {"Quiet in front", {-18.0f, 1.0f, -54.0f, 0.15f, 0.1f, 0.3f, 0.0f, 0.0f, 24.0f, 1.0f, 0.7f}},
};
// --- presets end ---

static void load(Lift& d, const Preset& preset) {
  d.init(kRate);
  for (int column = 0; column < p::kNumParams; ++column) d.set_param(kColumns[column], preset.values[column]);
}

// Level. A full-scale held chord for a minute, through every preset and with
// every control at each end: it never comes out more than 6 dB over the
// input and never grows. And held tones over the piano's range through every
// preset that plays the whole sound: none is lost.
static void check_levels() {
  char label[200];
  const float seconds = 60.0f;
  std::vector<float> chord = sine(220.0f, seconds, kRate, 1.0f / 3.0f);
  {
    const std::vector<float> third = sine(277.18f, seconds, kRate, 1.0f / 3.0f), fifth = sine(329.63f, seconds, kRate, 1.0f / 3.0f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += third[i] + fifth[i];
  }
  const double in_peak = peak(chord);
  const size_t ten = static_cast<size_t>(10.0f * kRate);
  double worst = 0.0;
  auto hold = [&](const char* what) {
    Stereo out = run(device, chord);
    const double early = std::max(peak(out.left, 0, ten), peak(out.right, 0, ten));
    const double late_on = std::max(peak(out.left, chord.size() - ten), peak(out.right, chord.size() - ten));
    worst = std::max(worst, std::max(early, late_on) / in_peak);
    std::snprintf(label, sizeof label, "a full-scale chord for a minute, %s: peak %.3f early, %.3f late (in %.3f)",
                  what, early, late_on, in_peak);
    EXPECT(finite(out.left) && std::max(early, late_on) < 2.0 * in_peak && late_on <= early * 1.01, label);
  };
  for (const Preset& preset : kPresets) {
    load(device, preset);
    hold(preset.name);
  }
  for (int id = 0; id < p::kNumParams; ++id) {
    for (int end = 0; end < 2; ++end) {
      device.init(kRate);
      device.set_param(id, end == 0 ? p::kParamMin[id] : p::kParamMax[id]);
      std::snprintf(label, sizeof label, "control %d at its %s", id, end == 0 ? "lowest" : "highest");
      hold(label);
    }
  }
  // The hardest there is: the highest threshold, all of the lift, every part on its own.
  device.init(kRate);
  device.set_param(p::kThreshold, p::kParamMax[p::kThreshold]);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kSplit, 1.0f);
  device.set_param(p::kLimit, 30.0f);
  device.set_param(p::kRise, 0.05f);
  hold("the hardest setting");
  std::printf("lift: a full-scale held chord, every preset and every control's ends: at most %.2f dB over the input\n", db(worst));

  double worst_dip = 0.0;
  const char* worst_name = "";
  for (const Preset& preset : kPresets) {
    if (value_of(preset, p::kHear) > 0.5f) continue;  // Lift only takes the loud sound away: that is what it is for
    for (float midi = 21.0f; midi <= 108.0f; midi += 3.0f) {
      const float hz = 440.0f * std::pow(2.0f, (midi - 69.0f) / 12.0f);
      for (float level : {-12.0f, -40.0f}) {
        load(device, preset);
        const double gain = settled_gain(device, hz, level, 1.0f);
        if (gain < worst_dip) {
          worst_dip = gain;
          worst_name = preset.name;
        }
      }
    }
  }
  std::printf("lift: held tones A0 to C8 through every preset that plays the whole sound: worst dip %.3f dB (%s)\n",
              worst_dip, worst_name);
  EXPECT(worst_dip > -0.05, "no preset loses a held tone anywhere on the keyboard");
}

// The cost in CPU time, which a busy machine stretches less than the wall
// clock: thirty seconds in 128-frame blocks of noise that swells through the
// lifted region, different on the two sides, so every detector and every gain
// is at work. The quickest of three passes, and how long its slowest blocks took.
void cpu_cost(const char* label, void (*set)(Lift&)) {
  const float seconds = 30.0f;
  rng_state() = 0xC0FFEEu;
  std::vector<float> left = noise(seconds, kRate, 1.0f);
  std::vector<float> right = noise(seconds, kRate, 1.0f);
  for (size_t i = 0; i < left.size(); ++i) {
    const float swell = livemix::kit::db_to_gain(-40.0f + 22.0f * std::sin(6.2831853f * 0.4f * static_cast<float>(i) / kRate));
    left[i] *= swell;
    right[i] *= swell;
  }
  double best = 1.0e30;
  double slowest = 0.0;
  double nearly = 0.0;
  std::vector<double> each;
  for (int pass = 0; pass < 3; ++pass) {
    Lift device;
    device.init(kRate);
    set(device);
    each.clear();
    const std::clock_t start = std::clock();
    for (size_t done = 0; done + kBlock <= left.size(); done += kBlock) {
      for (int i = 0; i < kBlock; ++i) {
        device.in_left()[i] = left[done + i];
        device.in_right()[i] = right[done + i];
      }
      const auto before = std::chrono::steady_clock::now();
      device.process(kBlock);
      const double took =
          std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - before).count();
      each.push_back(took);
    }
    const double micros = 1.0e6 * static_cast<double>(std::clock() - start) / CLOCKS_PER_SEC;
    std::sort(each.begin(), each.end());
    // The one slowest block on a shared machine is the scheduler's; all but one in a thousand are the device's.
    const double most = each[each.size() - 1 - each.size() / 1000];
    if (micros < best) best = micros;
    if (pass == 0 || most < nearly) {
      nearly = most;
      slowest = each.back();
    }
  }
  const double blocks = seconds * kRate / kBlock;
  std::printf("lift cost in CPU time, %s: %.1f us per 128-frame block, %.2f%% of real time; "
              "999 blocks in 1000 under %.1f us, the slowest %.1f us (wall clock, shared machine)\n",
              label, best / blocks, 100.0 * best / (seconds * 1.0e6), nearly, slowest);
  EXPECT(100.0 * best / (seconds * 1.0e6) < 5.0, "a block costs under 5% of real time natively");
}

void set_defaults(Lift&) {}

// Every part judged apart, all of the lift to the sides, the lift alone, half
// mixed, the quickest times: the most there is to do, which is no more than at
// rest, because nothing in the device is switched by a setting.
void set_most(Lift& device) {
  device.set_param(p::kThreshold, -12.0f);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kFloor, -90.0f);
  device.set_param(p::kRise, 0.05f);
  device.set_param(p::kHold, 0.01f);
  device.set_param(p::kSplit, 1.0f);
  device.set_param(p::kFocus, 0.5f);
  device.set_param(p::kSides, 1.0f);
  device.set_param(p::kLimit, 30.0f);
  device.set_param(p::kHear, 1.0f);
  device.set_param(p::kMix, 0.5f);
}

// --- main ---
// --- the second check's own tests ---

// The hardest setting for what is loud: all the way to the line, every part
// free to rise, the parts judged apart.
static void hardest(Lift& d, float rate, float split) {
  d.init(rate);
  d.set_param(p::kThreshold, -24.0f);
  d.set_param(p::kAmount, 1.0f);
  d.set_param(p::kFloor, -90.0f);
  d.set_param(p::kRise, 0.05f);
  d.set_param(p::kHold, 0.01f);
  d.set_param(p::kSplit, split);
  d.set_param(p::kLimit, 30.0f);
}

// `x` scaled so its RMS is `level_db` dBFS.
static std::vector<float> at_level(std::vector<float> x, double level_db) {
  const float k = static_cast<float>(std::pow(10.0, level_db / 20.0) / rms(x));
  for (float& v : x) v *= k;
  return x;
}

// A held chord of seven partials from 110 Hz up.
static std::vector<float> chord(float seconds, float rate) {
  const double hz[] = {110.0, 164.8, 220.5, 277.2, 329.9, 440.7, 659.1};
  std::vector<float> x(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < x.size(); ++i) {
    double v = 0.0;
    for (int k = 0; k < 7; ++k) v += std::sin(2.0 * kPi * hz[k] * i / rate + k) / (1.0 + 0.5 * k);
    x[i] = static_cast<float>(v);
  }
  return x;
}

// Sound over the threshold leaves as it came at any Split: the lifted skirts
// of the other parts may not add to it. (As built a tone half a dB over the
// line left 7.7 dB louder with Split up, a chord 4.6 dB, noise 5.3 dB.)
static void check_loud_is_left_alone_at_any_split() {
  char label[260];
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double worst_tone = -100.0, worst_chord = -100.0, worst_chord_peak = -100.0;
    double worst_noise = -100.0, worst_noise_peak = -100.0;
    for (float split : {0.5f, 1.0f}) {
      for (float hz : {60.0f, 250.0f, 1000.0f, 2500.0f, 8100.0f}) {
        for (float over : {0.5f, 3.0f}) {
          hardest(device, rate, split);
          const std::vector<float> in = tone(hz, -24.0f + over, 1.5f, rate);
          Stereo out = run(device, in);
          const size_t from = in.size() * 3 / 4;
          worst_tone = std::max(worst_tone, db(tone_level(out.left, hz, rate, from, in.size()) /
                                               tone_level(in, hz, rate, from, in.size())));
        }
      }
      for (int kind = 0; kind < 2; ++kind) {
        hardest(device, rate, split);
        rng_state() = 0x2545f491u;
        const std::vector<float> in = at_level(kind == 0 ? chord(2.0f, rate) : noise(2.0f, rate), -23.0);
        Stereo out = run(device, in);
        const std::vector<float> dry = late(in);
        const size_t from = in.size() / 2;
        const double level = db(rms(out.left, from) / rms(dry, from));
        const double top = db(peak(out.left, from) / peak(dry, from));
        (kind == 0 ? worst_chord : worst_noise) = std::max(kind == 0 ? worst_chord : worst_noise, level);
        (kind == 0 ? worst_chord_peak : worst_noise_peak) = std::max(kind == 0 ? worst_chord_peak : worst_noise_peak, top);
      }
    }
    std::snprintf(label, sizeof label,
                  "at %.0f Hz, Split up: a tone over the line gains %.2f dB, a chord %.2f (peak %.2f), noise %.2f (peak %.2f)",
                  rate, worst_tone, worst_chord, worst_chord_peak, worst_noise, worst_noise_peak);
    std::printf("lift: %s\n", label);
    EXPECT(worst_tone < 0.35 && worst_chord < 0.35 && worst_chord_peak < 0.5 && worst_noise < 0.4 &&
               worst_noise_peak < 0.8,
           label);
  }
}

// A note after a lifted passage peaks no higher than it went in: at every
// rate, at either end of Split, and for a note only just over the line or at
// it, which the RMS alone is 20 ms late for. (As built: 3 dB over the line
// came out 3 dB hotter for 20 ms, 8.5 dB with Split up.)
static void check_notes_after_a_lifted_passage() {
  char label[260];
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (float split : {0.0f, 1.0f}) {
      // Full scale, 3 dB over the line, and at the line itself.
      const float levels[] = {-3.02f, -21.0f, -24.0f};
      // With the parts apart the whole may stand 0.3 dB (kOverDb) over itself.
      const double bounds[] = {0.06, split > 0.0f ? 0.35 : 0.05, 0.4};
      for (int k = 0; k < 3; ++k) {
        hardest(device, rate, split);
        const std::vector<float> quiet = tone(440.0f, -54.0f, 1.0f, rate);
        const std::vector<float> in = join(quiet, tone(660.0f, levels[k], 0.5f, rate));
        Stereo out = run(device, in);
        const std::vector<float> dry = late(in);
        const size_t onset = quiet.size() + kLatency;
        const size_t fifth = static_cast<size_t>(0.2f * rate), fiftieth = static_cast<size_t>(0.02f * rate);
        const double before = db(rms(out.left, onset - fifth, onset - fiftieth) / rms(dry, onset - fifth, onset - fiftieth));
        const size_t to = onset + static_cast<size_t>(0.05f * rate);
        const double over = db(peak(out.left, onset, to) / peak(dry, onset, to));
        std::snprintf(label, sizeof label,
                      "at %.0f Hz, Split %.0f: after %.1f dB of lift a note at %.0f dB peaks %.3f dB over itself",
                      rate, split, before, levels[k], over);
        std::printf("lift: %s\n", label);
        EXPECT(before > 24.0 && over < bounds[k], label);
      }
    }
  }
}

// The lift comes off as a fade inside the lookahead, never as a step: it
// starts 272 samples ahead of the note and is exactly gone on its first
// sample. A tail of DC under the lift shows the gain sample by sample. (As
// built the gain fell in 0.5 ms, 5 ms early, and at 96 kHz 0.2 dB of it was
// still on when the note landed.)
static void check_the_lift_fades_out_before_a_note() {
  char label[260];
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    hardest(device, rate, 0.0f);
    const size_t n = static_cast<size_t>(3.0f * rate), start = static_cast<size_t>(2.0f * rate);
    const double tail = std::sqrt(2.0) * std::pow(10.0, -54.0 / 20.0);
    std::vector<float> in(n);
    for (size_t i = 0; i < n; ++i) {
      in[i] = static_cast<float>(tail + (i >= start ? std::sin(2.0 * kPi * 100.0 * (i - start) / rate) : 0.0));
    }
    Stereo out = run(device, in);
    const size_t onset = start + kLatency;
    const double full = out.left[onset - 600] / tail;
    double steepest = 0.0;
    long at90 = 0, at10 = 0;
    for (long k = -599; k <= 0; ++k) {
      const double gain = out.left[onset + k] / tail, last = out.left[onset + k - 1] / tail;
      steepest = std::max(steepest, std::fabs(gain - last) / (full - 1.0));
      if (at90 == 0 && gain < 1.0 + 0.9 * (full - 1.0)) at90 = k;
      if (at10 == 0 && gain < 1.0 + 0.1 * (full - 1.0)) at10 = k;
    }
    const double landed = out.left[onset] / tail;
    const double ms = 1000.0 * static_cast<double>(at10 - at90) / rate;
    std::snprintf(label, sizeof label,
                  "at %.0f Hz a lift of %.1f dB falls from 90 %% to 10 %% in %.2f ms (%ld to %ld samples before the note), "
                  "by at most %.4f of itself a sample, and is %.5f on the note's first sample",
                  rate, db(full), ms, -at90, -at10, steepest, landed);
    std::printf("lift: %s\n", label);
    EXPECT(db(full) > 26.0 && ms > 1.2 && at90 > -289 && at10 < 0 && steepest < 0.012 && std::fabs(landed - 1.0) < 0.001,
           label);
  }
}

// Hold: after a loud note the lift stays away for as long as Hold says and
// then comes in over Rise. Timed on a quiet tone that follows a loud one:
// the moment half the lift (in dB) is back. (As built the control here was
// Fall, and on played material its two halves were 35 dB under the sound.)
static void check_hold_keeps_the_lift_back() {
  char label[260];
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (float hold : {0.05f, 0.3f, 1.0f, 3.0f}) {
      hardest(device, rate, 0.0f);
      device.set_param(p::kHold, hold);
      const std::vector<float> loud = tone(440.0f, -12.0f, 0.5f, rate);
      const std::vector<float> in = join(loud, tone(440.0f, -54.0f, hold + 1.0f, rate));
      Stereo out = run(device, in);
      const std::vector<float> dry = late(in);
      const size_t step = static_cast<size_t>(0.01f * rate), end = loud.size() + kLatency;
      const double full = db(rms(out.left, in.size() - 10 * step) / rms(dry, in.size() - 10 * step));
      double back = -1.0, early = 0.0;
      for (size_t at = end; at + step <= in.size(); at += step) {
        const double lift = db(rms(out.left, at, at + step) / rms(dry, at, at + step));
        const double seconds = static_cast<double>(at - end) / rate;
        if (seconds > 0.02 && seconds < 0.8 * hold) early = std::max(early, lift);
        if (lift > 0.5 * full) {
          back = seconds;
          break;
        }
      }
      std::snprintf(label, sizeof label,
                    "at %.0f Hz, Hold %.2f s: %.1f dB of lift is half back %.3f s after a loud note, at most %.2f dB before",
                    rate, hold, full, back, early);
      std::printf("lift: %s\n", label);
      EXPECT(full > 29.0 && back > hold && back < hold + 0.15 && early < 0.3, label);
    }
  }
}

// A played phrase for the checks below: three notes of four partials that
// ring down and are let go, with pauses of exact silence (or of hiss alone)
// between them and after the last. `clean` is the same without the hiss.
struct Played {
  std::vector<float> sound, clean;
  // Where each pause is certain: from 0.2 s after a note is let go.
  size_t from[3], to[3];
};

static Played played(float rate, double gain_db, double hiss_db, double more_seconds = 0.0) {
  Played s;
  const double starts[] = {0.2, 3.2, 6.0}, hz[] = {220.0, 330.0, 165.0}, amp[] = {0.25, 0.2, 0.25}, t60[] = {2.0, 1.5, 2.5};
  // `more_seconds` makes the pause after the last note that much longer.
  const size_t n = static_cast<size_t>((9.5 + more_seconds) * rate);
  s.clean.assign(n, 0.0f);
  const double gain = std::pow(10.0, gain_db / 20.0);
  for (int k = 0; k < 3; ++k) {
    const size_t at = static_cast<size_t>(starts[k] * rate);
    for (size_t i = 0; at + i < n; ++i) {
      const double t = static_cast<double>(i) / rate;
      if (t > 1.92) break;
      double shape = t < 0.02 ? 0.5 - 0.5 * std::cos(kPi * t / 0.02) : 1.0;
      shape *= std::pow(10.0, -3.0 * t / t60[k]);
      if (t > 1.9) shape *= 0.5 + 0.5 * std::cos(kPi * (t - 1.9) / 0.02);
      double v = 0.0;
      for (int h = 1; h <= 4; ++h) v += std::sin(2.0 * kPi * hz[k] * h * t + 0.7 * h) / (1 << (h - 1));
      s.clean[at + i] += static_cast<float>(gain * amp[k] * shape * v);
    }
    s.from[k] = static_cast<size_t>((starts[k] + 2.2) * rate);
    s.to[k] = k < 2 ? static_cast<size_t>((starts[k + 1] - 0.05) * rate) : n;
  }
  s.sound = s.clean;
  if (hiss_db > -150.0) {
    rng_state() = 0x9e3779b9u;
    const float a = static_cast<float>(std::pow(10.0, hiss_db / 20.0) * std::sqrt(3.0));
    for (float& v : s.sound) v += a * white();
  }
  return s;
}

// How far the hiss in the pauses of `s` comes up through the device as set,
// in dB: `after`, in the pauses that follow a tail at once (0.2 s after the
// note is let go, for three quarters of a second), where a lift that was on
// the tail is still being let down; `settled`, in the last two seconds of the
// phrase, which wants a last pause of six seconds or more.
struct HissRise {
  double after, settled;
};
static HissRise hiss_rise(Lift& d, const Played& s) {
  Stereo out = run(d, s.sound);
  const std::vector<float> dry = late(s.sound);
  HissRise rise = {-100.0, 0.0};
  for (int k = 0; k < 3; ++k) {
    const size_t end = std::min(s.to[k], s.from[k] + static_cast<size_t>(36000));
    rise.after = std::max(rise.after, db(rms(out.left, s.from[k] + kLatency, end) / rms(dry, s.from[k] + kLatency, end)));
  }
  const size_t n = s.sound.size();
  rise.settled = db(rms(out.left, n - 96000, n) / rms(dry, n - 96000, n));
  return rise;
}

// As it loads, the hiss of a source at -60 dB stays where it is in a pause:
// once the lift that was on the tail before it has been let down, it is not
// up at all, and while that is let down it is up by less than Limit. (As
// built the default raised it by 17 dB for the whole of every pause.)
static void check_hiss_stays_down_at_the_default() {
  char label[220];
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    device.init(rate);
    const HissRise rise = hiss_rise(device, played(rate, 0.0, -60.0, 6.0));
    std::snprintf(label, sizeof label,
                  "at %.0f Hz the default leaves hiss at -60 dB %.2f dB up in a pause, and %.2f dB up right after a tail", rate,
                  rise.settled, rise.after);
    std::printf("lift: %s\n", label);
    EXPECT(rise.settled < 0.5 && rise.after < p::kParamDefault[p::kLimit], label);
  }
}

// The default is heard on played material and leaves a held pad alone: the
// ends of the notes (where the input is between -56 and -30 dB) come up by
// several dB, the notes themselves (over -20 dB) by next to nothing, and a
// chord held at -18 dB passes. (As built this held as well, the ends up by
// 9.7 dB: what was wrong with that default was the hiss, above.)
static void check_the_default_lifts_a_played_phrase() {
  char label[260];
  device.init(kRate);
  const Played s = played(kRate, 0.0, -200.0);
  Stereo out = run(device, s.sound);
  const std::vector<float> dry = late(s.sound);
  const size_t step = static_cast<size_t>(0.05f * kRate);
  double ends = 0.0, notes = 0.0;
  int ends_n = 0, notes_n = 0;
  for (size_t at = kLatency; at + step <= dry.size(); at += step) {
    const double level = db(rms(dry, at, at + step));
    const double lift = db(rms(out.left, at, at + step)) - level;
    if (level > -56.0 && level < -30.0) {
      ends += lift;
      ++ends_n;
    } else if (level > -20.0) {
      notes = std::max(notes, lift);
      ++notes_n;
    }
  }
  ends /= std::max(ends_n, 1);
  const double whole = db(rms(out.left) / rms(dry));
  device.init(kRate);
  const std::vector<float> pad = at_level(chord(3.0f, kRate), -18.0);
  Stereo held = run(device, pad);
  const std::vector<float> pad_dry = late(pad);
  const double pad_level = db(rms(held.left, pad.size() / 2) / rms(pad_dry, pad.size() / 2));
  const double pad_peak = db(peak(held.left, pad.size() / 2) / peak(pad_dry, pad.size() / 2));
  std::snprintf(label, sizeof label,
                "the default on a played phrase: the ends of notes +%.1f dB (%d windows), the notes at most +%.2f dB (%d), "
                "the whole +%.2f dB; a chord held at -18 dB +%.2f dB, peak +%.2f dB",
                ends, ends_n, notes, notes_n, whole, pad_level, pad_peak);
  std::printf("lift: %s\n", label);
  EXPECT(ends_n > 20 && notes_n > 10 && ends > 6.0 && notes < 1.0 && whole < 3.0 && pad_level < 0.3 && pad_peak < 0.4,
         label);
}

// The reading the display's mark stands on: meter 5 is the level of what
// comes out, read as the level going in is. With Sides up a sound with
// nothing at the sides is not lifted, whatever the lift meters say, and the
// reading says so. (As built there was no such reading and the mark stood
// on the lift asked for.)
static void check_the_level_out_is_what_comes_out() {
  char label[200];
  for (float sides : {0.0f, 0.5f, 1.0f}) {
    plain(device);
    device.set_param(p::kSides, sides);
    run(device, tone(440.0f, -55.0f, 1.5f));
    const double in = device.meter(4), out = device.meter(5), lift = device.meter(0);
    std::snprintf(label, sizeof label, "Sides %.1f, a tone in the middle: in %.2f dB, out %.2f dB, lift meter %.2f dB",
                  sides, in, out, lift);
    std::printf("lift: %s\n", label);
    EXPECT(std::fabs(in + 55.0) < 0.2 && std::fabs(lift - 12.5) < 0.2 && std::fabs(out - in - (1.0 - sides) * 12.5) < 0.3,
           label);
  }
}

// Threshold is alive over the whole of its travel on quiet and on loud
// playing: each sixth of the knob changes what comes out. (The knob used to
// go down to -60 dB; with the Floor's default now at -48 dB its lowest
// quarter would do nothing as it loads, so it stops at -48 dB.)
static void check_threshold_is_alive_all_the_way() {
  char label[200];
  for (double gain : {-18.0, 0.0}) {
    const Played s = played(kRate, gain, -200.0);
    std::vector<float> last;
    double least = 0.0;
    const float low = p::kParamMin[p::kThreshold], high = p::kParamMax[p::kThreshold];
    for (int k = 0; k <= 6; ++k) {
      device.init(kRate);
      device.set_param(p::kThreshold, low + (high - low) * static_cast<float>(k) / 6.0f);
      Stereo out = run(device, s.sound);
      if (k > 0) {
        std::vector<float> change(out.left.size());
        for (size_t i = 0; i < change.size(); ++i) change[i] = out.left[i] - last[i];
        const double step = db(rms(change) / rms(out.left));
        least = k == 1 ? step : std::min(least, step);
      }
      last = out.left;
    }
    std::snprintf(label, sizeof label,
                  "a phrase at %+.0f dB: the quietest sixth of Threshold's travel (%.0f to %.0f dB) changes the output by %.1f dB of itself",
                  gain, low, high, least);
    std::printf("lift: %s\n", label);
    // With the Floor's knee now over the Floor, the lowest of Threshold's
    // travel has less under it on loud material than it had: -48 dB of the
    // output where it was -42 dB.
    EXPECT(least > -50.0, label);
  }
}

// With nothing lifted the three parts are the input again, bit for bit, at
// every Split and every rate, 288 samples late.
static void check_parts_are_the_input_at_every_rate() {
  char label[200];
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    const Played s = played(rate, 0.0, -60.0);
    const std::vector<float> dry = late(s.sound);
    double worst = 0.0;
    for (float split : {0.0f, 0.3f, 0.5f, 1.0f}) {
      for (int way = 0; way < 2; ++way) {
        device.init(rate);
        device.set_param(p::kSplit, split);
        device.set_param(way == 0 ? p::kLimit : p::kAmount, 0.0f);
        Stereo out = run(device, s.sound);
        worst = std::max(worst, std::max(worst_difference(out.left, dry), worst_difference(out.right, dry)));
      }
    }
    std::snprintf(label, sizeof label, "at %.0f Hz with nothing lifted the output is the input 288 samples late: differs by %.1e", rate, worst);
    std::printf("lift: %s\n", label);
    EXPECT(worst == 0.0, label);
  }
}

// The same hiss through every preset: in a pause it stays where it was, once
// the lift that was on the tail before it is down, and until then it is up by
// no more than the preset's Limit. No preset has its Floor under the hiss any
// more ("Long tails" had it at -70 dB and held the hiss 24 dB up).
static void check_hiss_through_every_preset() {
  char label[220];
  const Played s = played(kRate, 0.0, -60.0, 6.0);
  double worst = -100.0, worst_after = -100.0;
  for (const Preset& preset : kPresets) {
    load(device, preset);
    const HissRise rise = hiss_rise(device, s);
    worst = std::max(worst, rise.settled);
    // What plays only what was added has no hiss of its own to be held to.
    if (value_of(preset, p::kHear) < 0.5f) worst_after = std::max(worst_after, rise.after);
    std::snprintf(label, sizeof label, "%s leaves hiss at -60 dB %.2f dB up in a pause, %.2f dB right after a tail", preset.name,
                  rise.settled, rise.after);
    EXPECT(rise.settled < 0.5 && rise.after < value_of(preset, p::kLimit) + 0.5, label);
  }
  std::printf("lift: hiss at -60 dB through every preset: at most %+.2f dB in a pause, %+.2f dB right after a tail\n", worst,
              worst_after);
}

// --- the third pass: the Floor and the sides ---

// The level of one channel over [from, to) samples, in dBFS.
static double level_db(const std::vector<float>& x, size_t from, size_t to) { return db(rms(x, from, to)); }

// A tail that beats: three pairs of partials a little apart (beats of 1.3,
// 0.8 and 2.1 Hz, 5 to 7 dB deep together), dying away by `fall` dB a second
// from `start_db`.
static std::vector<float> beating_tail(float seconds, double start_db, double fall, float rate = kRate) {
  const double hz[] = {220.0, 221.3, 330.0, 330.8, 441.0, 443.1}, amp[] = {1.0, 0.45, 0.6, 0.3, 0.35, 0.2};
  std::vector<float> x(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < x.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    double v = 0.0;
    for (int k = 0; k < 6; ++k) v += amp[k] * std::sin(2.0 * kPi * hz[k] * t + 0.9 * k);
    x[i] = static_cast<float>(v * std::pow(10.0, (start_db - fall * t) / 20.0) * std::min(1.0, t / 0.02));
  }
  return x;
}

// The steps between neighbouring windows of a fifth of a second: the largest
// of `out`, the largest of `dry`, and the most a step of `out` is over the
// step of `dry` between the same two windows. Only where the dry is a sound.
struct Steps {
  double out = 0.0, dry = 0.0, over = 0.0;
};
static Steps steps_of(const std::vector<float>& out, const std::vector<float>& dry, float rate = kRate) {
  Steps steps;
  const size_t w = static_cast<size_t>(0.2f * rate);
  for (size_t a = w; a + 2 * w <= out.size(); a += w) {
    const double d0 = level_db(dry, a, a + w), d1 = level_db(dry, a + w, a + 2 * w);
    if (d0 < -95.0 || d1 < -95.0) continue;
    const double o = std::fabs(level_db(out, a + w, a + 2 * w) - level_db(out, a, a + w)), d = std::fabs(d1 - d0);
    steps.out = std::max(steps.out, o);
    steps.dry = std::max(steps.dry, d);
    steps.over = std::max(steps.over, o - d);
  }
  return steps;
}

// A tail that beats across the Floor is not switched on and off. (As it was,
// the lift fell away over 12 dB under the Floor, 2.4 to 3 dB of it for every
// dB the tail sank, and came down in 20 ms: a bowl's ring that beat by 5 dB
// stepped by 10 to 20 dB where it met the Floor.) Through every preset that
// plays the whole sound, and at the hardest setting, the largest step of the
// lifted tail between fifths of a second is no more than the largest of the
// tail alone and 2.5 dB. At the hardest setting no single step is more than
// 2.5 dB over the tail's own between the same two windows either; a preset
// with a slow Rise may be (the lift coming in over Rise while the tail holds
// still is a step of its own, and has nothing to do with the Floor).
static void check_a_beating_tail_is_not_switched_at_the_floor() {
  char label[240];
  const std::vector<float> tail = beating_tail(22.0f, -34.0, 3.0);
  const std::vector<float> dry = late(tail);
  double worst = 0.0, worst_over = 0.0;
  for (int k = 0; k <= static_cast<int>(sizeof kPresets / sizeof kPresets[0]); ++k) {
    const bool hardest = k == static_cast<int>(sizeof kPresets / sizeof kPresets[0]);
    if (hardest) {
      // The most lift there is, the fastest times, the parts judged apart.
      plain(device);
      device.set_param(p::kThreshold, -30.0f);
      device.set_param(p::kAmount, 1.0f);
      device.set_param(p::kFloor, -62.0f);
      device.set_param(p::kSplit, 1.0f);
    } else {
      if (value_of(kPresets[k], p::kHear) > 0.5f) continue;
      load(device, kPresets[k]);
    }
    Stereo out = run(device, tail);
    const Steps steps = steps_of(out.left, dry);
    worst = std::max(worst, steps.out - steps.dry);
    worst_over = std::max(worst_over, steps.over);
    std::snprintf(label, sizeof label,
                  "a beating tail through %s: its largest step is %.1f dB (alone %.1f dB), and no step is more than %.1f dB over the tail's own",
                  hardest ? "the hardest setting" : kPresets[k].name, steps.out, steps.dry, steps.over);
    if (hardest) std::printf("lift: %s\n", label);
    EXPECT(steps.out < steps.dry + 2.5 && (!hardest || steps.over < 2.5), label);
  }
  std::printf("lift: a beating tail through every preset: the largest step at most %.1f dB over the tail's own largest, any step at most %.1f dB over its own\n",
              worst, worst_over);
}

// Hiss that is not flat like `noise` but bell shaped, as a real source's is:
// three uniform samples added, `level_db` RMS.
static std::vector<float> round_hiss(float seconds, double level_db, float rate = kRate) {
  std::vector<float> x(static_cast<size_t>(seconds * rate));
  const float a = static_cast<float>(std::pow(10.0, level_db / 20.0));
  for (float& v : x) v = a * (white() + white() + white());
  return x;
}

// The Floor means what it says: a steady sound at the Floor or under it is
// not lifted, whatever else is set. (As it was the lift was greatest AT the
// Floor and only gone 12 dB under it: hiss 7 dB under the default's Floor
// came up 5.3 dB and hiss 1 dB under any Floor by nearly all of Limit.)
static void check_the_floor_means_what_it_says() {
  char label[220];
  double worst = -100.0;
  for (float floor : {-45.0f, -54.0f, -70.0f}) {
    for (float under : {1.0f, 3.0f, 7.0f, 12.0f}) {
      for (float split : {0.0f, 1.0f}) {
        // The hardest setting: everything carried to a line at -12 dB, at once.
        plain(device);
        device.set_param(p::kThreshold, -12.0f);
        device.set_param(p::kAmount, 1.0f);
        device.set_param(p::kFloor, floor);
        device.set_param(p::kSplit, split);
        rng_state() = 0x5EEDu;
        const std::vector<float> hiss = round_hiss(5.0f, floor - under);
        Stereo out = run(device, hiss);
        const size_t from = static_cast<size_t>(3.0f * kRate);
        const double rise = db(rms(out.left, from) / rms(hiss, from - kLatency, hiss.size() - kLatency));
        worst = std::max(worst, rise);
        std::snprintf(label, sizeof label, "Floor %.0f dB, Split %.0f: hiss %.0f dB under it comes up %.2f dB", floor, split, under, rise);
        EXPECT(rise < 0.5, label);
      }
    }
    // And over the knee it is lifted in full: 8 dB over the Floor, to the line.
    plain(device);
    device.set_param(p::kThreshold, -12.0f);
    device.set_param(p::kAmount, 1.0f);
    device.set_param(p::kFloor, floor);
    rng_state() = 0x5EEDu;
    const std::vector<float> hiss = round_hiss(8.0f, floor + 8.0);
    Stereo out = run(device, hiss);
    const size_t from = static_cast<size_t>(6.0f * kRate);
    const double rise = db(rms(out.left, from) / rms(hiss, from - kLatency, hiss.size() - kLatency));
    std::snprintf(label, sizeof label, "Floor %.0f dB: hiss 8 dB over it comes up %.1f dB (to the line: %.1f dB)", floor, rise,
                  -12.0 - (floor + 8.0));
    EXPECT(rise > std::min(30.0, -12.0 - (floor + 8.0)) - 2.5, label);
  }
  std::printf("lift: steady hiss 1 to 12 dB under the Floor, at the hardest setting: at most %+.2f dB\n", worst);
}

// The lift on a tone of `hz` over a fifth of a second ending at `at` seconds, in dB.
static double lift_at(const Stereo& out, const std::vector<float>& in, float hz, double at, float rate = kRate) {
  const size_t to = static_cast<size_t>(at * rate), from = to - static_cast<size_t>(0.2f * rate);
  return db(tone_level(out.left, hz, rate, from, to) / tone_level(in, hz, rate, from - kLatency, to - kLatency));
}

// What the Floor does to a lift that is there, it does at 8 dB a second, both
// ways. A tone lifted 20 dB drops under the Floor: its lift is let down at
// that rate and not at once. Back over the Floor after a second, the lift
// comes back at that rate and not at Rise. And once it has been let down all
// the way the lift is forgotten: the same tone after a longer pause gets its
// lift by Rise. The same at 96 kHz.
static void check_a_lift_is_let_down_slowly() {
  char label[240];
  for (float rate : {48000.0f, 96000.0f}) {
    // 2 s at -40 dB (20 dB under the line), 1 s at -70 dB, 2 s at -40 dB,
    // 4 s at -70 dB, 1 s at -40 dB. The Floor is at -56 dB.
    const double plan[][2] = {{2.0, -40.0}, {1.0, -70.0}, {2.0, -40.0}, {4.0, -70.0}, {1.0, -40.0}};
    std::vector<float> in;
    for (const auto& part : plan) {
      const size_t from = in.size(), n = static_cast<size_t>(part[0] * rate);
      const double amp = std::sqrt(2.0) * std::pow(10.0, part[1] / 20.0);
      for (size_t i = 0; i < n; ++i) in.push_back(static_cast<float>(amp * std::sin(2.0 * kPi * 440.0 * (from + i) / rate)));
    }
    plain(device, rate);
    device.set_param(p::kThreshold, -20.0f);
    device.set_param(p::kAmount, 1.0f);
    device.set_param(p::kFloor, -56.0f);
    Stereo out = run(device, in);
    // Each reading is a mean over the fifth of a second before it.
    const double up = lift_at(out, in, 440.0f, 2.0, rate);
    const double under = lift_at(out, in, 440.0f, 2.3, rate), later = lift_at(out, in, 440.0f, 2.8, rate);
    const double last = lift_at(out, in, 440.0f, 3.0, rate);
    const double back_soon = lift_at(out, in, 440.0f, 3.4, rate), back_later = lift_at(out, in, 440.0f, 3.65, rate);
    const double back = lift_at(out, in, 440.0f, 4.9, rate);
    const double gone = lift_at(out, in, 440.0f, 8.9, rate), anew = lift_at(out, in, 440.0f, 9.45, rate);
    std::snprintf(label, sizeof label,
                  "at %.0f Hz a lift of %.1f dB stands at %.1f dB once the tone is under the Floor, %.1f dB half a second later and %.1f dB at the end of the second; back over it, it is %.1f dB after 0.3 s, %.1f dB a quarter second on and %.1f dB in the end",
                  rate, up, under, later, last, back_soon, back_later, back);
    std::printf("lift: %s\n", label);
    EXPECT(std::fabs(up - 20.0) < 0.3, "the tone is lifted to the line");
    // On its way down the level asks for more for a moment (Rise is 50 ms here): never more than Limit.
    EXPECT(under < 30.0 && under > 20.0, label);
    EXPECT(std::fabs((under - later) - 8.0 * 0.5) < 0.4 && std::fabs((under - last) - 8.0 * 0.7) < 0.5, label);
    EXPECT(std::fabs((back_later - back_soon) - 8.0 * 0.25) < 0.4 && back_soon < 20.0 - 2.0 && std::fabs(back - 20.0) < 0.5, label);
    std::snprintf(label, sizeof label, "at %.0f Hz after 4 s under the Floor the lift is %.2f dB, and on the tone that follows %.1f dB within 0.45 s",
                  rate, gone, anew);
    std::printf("lift: %s\n", label);
    EXPECT(std::fabs(gone) < 0.05 && anew > 18.0, label);
  }
}

// The sides against the middle of `out` over [from, to), in dB.
static double sides_over_middle(const Stereo& out, size_t from, size_t to) {
  double middle = 0.0, sides = 0.0;
  for (size_t i = from; i < to; ++i) {
    const double m = out.left[i] + out.right[i], d = out.left[i] - out.right[i];
    middle += m * m;
    sides += d * d;
  }
  return 10.0 * std::log10(std::max(sides, 1.0e-30) / std::max(middle, 1.0e-30));
}

// Sides fully up never turns a sound inside out. What the sides get over the
// middle stops 1.5 dB short of the middle, however much lift there is. (As it
// was, a tail whose sides were 9 dB under its middle came out with them 15 dB
// OVER it at Limit 24, the two channels in opposite phase, and a sound on one
// side grew its own opposite on the other side.)
static void check_the_sides_stay_under_the_middle() {
  char label[240];
  // A dying sound: 220 Hz in the middle, 331 Hz at the sides, `under` dB under it.
  for (double under : {9.0, 3.0, 0.0, -6.0}) {
    const size_t n = static_cast<size_t>(4.0f * kRate);
    std::vector<float> left(n), right(n);
    for (size_t i = 0; i < n; ++i) {
      const double t = static_cast<double>(i) / kRate, env = std::pow(10.0, (-26.0 - 8.0 * t) / 20.0) * std::sqrt(2.0);
      const double m = env * std::sin(2.0 * kPi * 220.0 * t), d = env * std::pow(10.0, -under / 20.0) * std::sin(2.0 * kPi * 331.0 * t);
      left[i] = static_cast<float>(m + d);
      right[i] = static_cast<float>(m - d);
    }
    plain(device);
    device.set_param(p::kThreshold, -18.0f);
    device.set_param(p::kAmount, 1.0f);
    device.set_param(p::kFloor, -80.0f);
    device.set_param(p::kSides, 1.0f);
    Stereo out = run(device, left, right);
    double most = -100.0, lowest = 2.0;
    for (size_t at = static_cast<size_t>(1.0f * kRate); at + 4800 <= n; at += 4800) {
      most = std::max(most, sides_over_middle(out, at, at + 4800));
      lowest = std::min(lowest, correlation(out.left, out.right, at, at + 4800));
    }
    // Where there is room the sides do rise, to 1.5 dB under the middle; where
    // there is none (they are as loud as the middle already, or louder) they
    // stay as they came in.
    const double bound = std::max(-1.5, -under);
    std::snprintf(label, sizeof label,
                  "sides %.0f dB under the middle, Sides 1, lifted up to 30 dB: they come out at most %+.2f dB against it (in: %+.1f dB), the channels' correlation at least %+.2f",
                  under, most, -under, lowest);
    std::printf("lift: %s\n", label);
    EXPECT(most < bound + 0.3 && most > bound - 0.5, label);
    if (under > 1.0) EXPECT(lowest > 0.1, label);
  }
  // A sound on the left alone: nothing appears on the right, and the reading
  // of the room at the sides says there is none.
  const std::vector<float> one = beating_tail(4.0f, -30.0, 6.0), none(one.size(), 0.0f);
  plain(device);
  device.set_param(p::kThreshold, -18.0f);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kFloor, -80.0f);
  device.set_param(p::kSides, 1.0f);
  Stereo out = run(device, one, none);
  std::snprintf(label, sizeof label, "a sound on the left alone, Sides 1: the right comes out at %.1f dB of the left (peak %.2e), room %.1f dB",
                db(rms(out.right) / rms(out.left)), peak(out.right), static_cast<double>(device.meter(6)));
  std::printf("lift: %s\n", label);
  EXPECT(peak(out.right) < 1.0e-6 && device.meter(6) == 0.0f, label);
  // The same in the middle has all the room there is, and is lifted where Sides leaves the middle any.
  plain(device);
  device.set_param(p::kSides, 0.5f);
  run(device, one);
  EXPECT(device.meter(6) == Lift::kSideRoomMost && device.meter(0) > 3.0f, "a sound in the middle: room at the sides reads its most");
  render(device, 1.0f, kRate);
  EXPECT(device.meter(6) == Lift::kSideRoomMost, "and at rest it reads its most");
}

int main() {
  Conformance spec;
  spec.name = "lift";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  check_curve();
  check_quiet_stays_down();
  check_times();
  check_attack_untouched();
  check_swell_and_ceiling();
  check_tail();
  check_steady();
  check_mix();
  check_lift_only();
  check_split();
  check_focus();
  check_stereo();
  check_bad_input();
  check_clicks();
  check_blocks_and_sleep();
  check_rates();
  check_sides();
  check_default_on_a_pad();
  check_controls_alive();
  check_levels();
  check_loud_is_left_alone_at_any_split();
  check_notes_after_a_lifted_passage();
  check_the_lift_fades_out_before_a_note();
  check_hold_keeps_the_lift_back();
  check_hiss_stays_down_at_the_default();
  check_hiss_through_every_preset();
  check_a_beating_tail_is_not_switched_at_the_floor();
  check_the_floor_means_what_it_says();
  check_a_lift_is_let_down_slowly();
  check_the_sides_stay_under_the_middle();
  check_the_default_lifts_a_played_phrase();
  check_the_level_out_is_what_comes_out();
  check_threshold_is_alive_all_the_way();
  check_parts_are_the_input_at_every_rate();
  // --- calls ---

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.05f);
  report_cost("lift", 10.0f, kRate, [&] { run(device, input); });
  cpu_cost("defaults", set_defaults);
  cpu_cost("the most to do", set_most);

  return finish("lift");
}
