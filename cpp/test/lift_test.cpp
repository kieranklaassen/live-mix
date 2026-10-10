// Native harness for Lift (cpp/devices/lift). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it an upward compressor for sustained sound:
// the curve, the times, the lookahead, the split, and that it never lifts
// silence or anything loud.

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
  d.set_param(p::kFall, 3.0f);
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
// carried Amount of the way up between the floor and the threshold, capped by
// Limit, and let go again within 12 dB under the floor.
static void check_curve() {
  struct Point {
    float level;
    float lift;
  };
  // Threshold -30, Amount 0.5, Floor -70, Limit 30.
  const Point points[] = {{-6.0f, 0.0f},   {-12.0f, 0.0f},  {-20.0f, 0.0f}, {-29.0f, 0.0f},
                          {-36.0f, 3.0f},  {-45.0f, 7.5f},  {-55.0f, 12.5f}, {-65.0f, 17.5f},
                          {-70.0f, 20.0f}, {-76.0f, 10.0f}, {-82.0f, 0.0f},  {-90.0f, 0.0f}};
  char label[160];
  for (const Point& point : points) {
    plain(device);
    const double gain = settled_gain(device, 440.0f, point.level);
    const double tolerance = point.level >= -30.0f ? 0.1 : 0.2;
    std::snprintf(label, sizeof label, "curve: a tone at %.0f dB is lifted by %.1f dB (got %.2f)",
                  point.level, point.lift, gain);
    EXPECT(std::fabs(gain - point.lift) < tolerance, label);
    EXPECT(std::fabs(Lift::curve(point.level, -30.0f, 0.5f, -70.0f, 30.0f) - point.lift) < 1.0e-4,
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
  device.set_param(p::kThreshold, -6.0f);
  device.set_param(p::kSplit, 1.0f);
  Stereo nothing = render(device, 2.0f, kRate);
  EXPECT(peak(nothing.left) == 0.0 && peak(nothing.right) == 0.0, "silence in is silence out");
  rng_state() = 0x5EEDu;
  const std::vector<float> hiss = noise(3.0f, kRate, static_cast<float>(std::pow(10.0, -90.0 / 20.0) * std::sqrt(3.0)));
  Stereo out = run(device, hiss);
  const size_t from = static_cast<size_t>(kRate);
  const double added = db(rms(out.left, from) / rms(hiss, from - kLatency, hiss.size() - kLatency));
  EXPECT(std::fabs(added) < 0.01, "noise at -90 dB is not lifted");
  // The same hiss just over the floor is, so the check above is the floor's doing.
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kFloor, -90.0f);
  Stereo lifted = run(device, hiss);
  EXPECT(db(rms(lifted.left, from) / rms(hiss, from)) > 10.0, "with the floor under it the hiss is lifted");
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

// Rise and Fall: each is the time the lift takes to cover 99 % of the way.
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
  // Fall: a loud tone after a quiet one. The lift is 99 % gone at Fall.
  for (float fall : {3.0f, 100.0f}) {
    plain(device);
    device.set_param(p::kFall, fall);
    const std::vector<float> quiet = tone(440.0f, -55.0f, 1.0f);
    Traced traced = trace(device, join(quiet, tone(440.0f, -12.0f, 0.5f)));
    const double before = traced.at(0.999);
    // One tick to see the note and one to ramp.
    const double slack = 32.0 / kRate;
    const double half = traced.at(1.0 + slack + fall * 0.0005), gone = traced.at(1.0 + slack + fall * 0.001);
    std::snprintf(label, sizeof label, "Fall %.0f ms: from %.2f dB, %.2f at half the time, %.3f at the time",
                  fall, before, half, gone);
    EXPECT(before > 12.3 && half < 0.13 * before && half > 0.03 * before && gone < 0.012 * before, label);
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
  // With a long Fall the lift lingers into the note, as the control says.
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kRise, 0.2f);
  device.set_param(p::kFall, 200.0f);
  Stereo slow = run(device, in);
  EXPECT(db(rms(slow.left, onset, onset + 960) / rms(dry, onset, onset + 960)) > 6.0,
         "Fall 200 ms: the note's first 20 ms carry the lift");
  EXPECT(std::fabs(db(rms(slow.left, onset + 14400, onset + 19200) / rms(dry, onset + 14400, onset + 19200))) < 0.1,
         "and 300 ms in it is gone");
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
  EXPECT_NEAR(wet_time - dry_time, 20.0 / rate_db, 0.04, "the lifted tail is longer by the predicted 0.67 s");
  // And it falls half as fast while it is lifted: 15 dB a second, 4 s to 60 dB.
  const double decay = rt60(out.left, kRate, 1.0, 0.05, -48.0);
  EXPECT_NEAR(decay, 60.0 / (0.5 * rate_db), 0.25, "the lifted tail decays at half the rate");
  // Amount 1 holds it level: the stretch from threshold to floor comes out flat.
  plain(device);
  device.set_param(p::kAmount, 1.0f);
  device.set_param(p::kFloor, -80.0f);
  Stereo held = run(device, tail);
  const double early = db(rms(held.left, 48000, 52800)), late_on = db(rms(held.left, 72000, 76800));
  EXPECT(std::fabs(early - late_on) < 0.6 && std::fabs(early + 30.0) < 1.0,
         "Amount 1: the tail is held at the threshold from 1 s to 1.5 s");
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
    EXPECT(high > 4.0 && high - low < (rise > 1.0f ? 0.05f : 0.3f), label);
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
  EXPECT(least_default > -0.01 && most_default < 0.1, "and under 0.1 dB at the defaults");
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
                        {"Threshold", p::kThreshold, -6.0f, -60.0f}, {"Limit", p::kLimit, 30.0f, 0.0f},
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

// --- main ---
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
  // --- calls ---

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.05f);
  report_cost("lift", 10.0f, kRate, [&] { run(device, input); });

  return finish("lift");
}
