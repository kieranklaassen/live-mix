// Native harness for Tape Loop (cpp/devices/tape-loop). After the
// conformance pass it asserts what makes it a tape loop: a pass takes exactly
// Length and costs Feedback and Wear, the play head can run at half or double
// speed or backwards, and nothing clicks when the machine is handled.

#include "../devices/tape-loop/tape_loop.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::TapeLoop;
namespace p = livemix::tape_loop;

static TapeLoop device;

static const float kRate = 48000.0f;

// Wet only, a pristine tape, a steady transport, nothing crossed.
static void clean(TapeLoop& d, float length_seconds, float feedback) {
  d.init(kRate);
  d.set_param(p::kLength, length_seconds);
  d.set_param(p::kFeedback, feedback);
  d.set_param(p::kWear, 0.0f);
  d.set_param(p::kWow, 0.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

static size_t peak_index(const std::vector<float>& x, size_t from, size_t to) {
  size_t best = from;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

// `total_seconds` of silence holding a tone from `at_seconds` for `seconds`
// (10 ms fades). The first sample is a -100 dB tick: the device wakes on it,
// so its tape starts at sample 0 whatever comes later.
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
  out[0] = 1.0e-5f;
  return out;
}

// Seconds between the points where 5 % and 95 % of the energy of [from, to)
// have gone by: how long a burst lasts.
static double extent(const std::vector<float>& x, size_t from, size_t to) {
  double total = 0.0;
  for (size_t i = from; i < to; ++i) total += static_cast<double>(x[i]) * x[i];
  double sum = 0.0;
  size_t first = from, last = from;
  bool started = false;
  for (size_t i = from; i < to; ++i) {
    sum += static_cast<double>(x[i]) * x[i];
    if (!started && sum >= 0.05 * total) {
      first = i;
      started = true;
    }
    if (sum <= 0.95 * total) last = i;
  }
  return static_cast<double>(last - first) / kRate;
}

// Where the energy of [from, to) sits, 0 at the start and 1 at the end.
static double centroid(const std::vector<float>& x, size_t from, size_t to) {
  double weighted = 0.0, total = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    const double e = static_cast<double>(x[i]) * x[i];
    weighted += e * static_cast<double>(i - from);
    total += e;
  }
  return total > 0.0 ? weighted / (total * static_cast<double>(to - from)) : 0.5;
}

int main() {
  Conformance spec;
  spec.name = "tape-loop";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 80.0f;
  spec.max_peak = 2.5f;
  check_effect(device, spec, kRate);

  // How long the default patch really rings (keeps tail_seconds honest).
  {
    device.init(kRate);
    rng_state() = 0x1234567u;
    run(device, noise(1.0f, kRate, 0.5f));
    Stereo tail = render(device, 200.0f, kRate);
    size_t last = 0;
    for (size_t i = 0; i < tail.size(); ++i) {
      if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
    }
    const double seconds = static_cast<double>(last) / kRate;
    std::printf("tape-loop: default patch silent %.1f s after the input stops (%.1f dB after 8 s)\n",
                seconds, db(rms(tail.left, 7 * 48000, 9 * 48000)));
    EXPECT(seconds > 40.0 && seconds < 80.0, "the default tail ends within tail_seconds, not instantly");
  }

  // A sound comes back after exactly Length, and again after twice that,
  // scaled by Feedback each time.
  for (float length : {1.0f, 2.5f}) {
    clean(device, length, 0.5f);
    const size_t n = static_cast<size_t>(length * kRate);
    Stereo out = run(device, impulse(3.6f * length, kRate, 0.4f));
    const size_t first = peak_index(out.left, n / 2, n + n / 2);
    const size_t second = peak_index(out.left, n + n / 2, 2 * n + n / 2);
    const size_t third = peak_index(out.left, 2 * n + n / 2, 3 * n + n / 2);
    EXPECT(first == n, "the first pass returns exactly Length later");
    EXPECT(second == 2 * n && third == 3 * n, "and again exactly every Length");
    EXPECT_NEAR(std::fabs(out.left[first]), 0.4, 0.002, "the first pass is at the recorded level");
    EXPECT_NEAR(std::fabs(out.left[second]) / std::fabs(out.left[first]), 0.5, 0.001,
                "each pass is scaled by Feedback");
    EXPECT_NEAR(std::fabs(out.left[third]) / std::fabs(out.left[second]), 0.5, 0.001, "pass after pass");
    EXPECT(peak(out.left, 1, n - 1) < 1.0e-6 && peak(out.left, n + 2400, 2 * n - 1) < 1.0e-4,
           "the tape is silent between the passes");
  }

  // Speed: Half returns a note an octave down and twice as long, Double an
  // octave up and half as long. (Length 2 s, a 440 Hz note from 1.0 to 1.5 s.)
  {
    std::vector<float> input = tone_at(440.0f, 1.0f, 0.5f, 4.0f, 0.4f);
    const double played = extent(input, 24000, 96000);

    clean(device, 2.0f, 0.0f);
    Stereo normal = run(device, input);
    EXPECT_NEAR(dominant_frequency(normal.left, kRate, 100.0, 2000.0, 146400, 163200), 440.0, 2.0,
                "Normal: the note returns at its pitch, one Length later");
    EXPECT_NEAR(extent(normal.left, 96000, 192000), played, 0.01, "and as long as it was");

    // The half-speed head falls behind the record head by half a second per
    // second: tape recorded at s is played at 2 s.
    clean(device, 2.0f, 0.0f);
    device.set_param(p::kSpeed, 0.0f);
    Stereo half = run(device, input);
    EXPECT_NEAR(dominant_frequency(half.left, kRate, 100.0, 2000.0, 100800, 139200), 220.0, 2.0,
                "Half: the note returns an octave down");
    EXPECT_NEAR(extent(half.left, 48000, 168000) / played, 2.0, 0.05, "and twice as long");
    EXPECT_NEAR(rms(half.left, 100800, 139200), 0.4 / std::sqrt(2.0), 0.01, "at the recorded level");

    // The double-speed head closes on the record head from a loop away:
    // tape recorded at s is played at (s + Length) / 2.
    clean(device, 2.0f, 0.0f);
    device.set_param(p::kSpeed, 2.0f);
    Stereo twice = run(device, input);
    EXPECT_NEAR(dominant_frequency(twice.left, kRate, 100.0, 2000.0, 73200, 82800), 880.0, 4.0,
                "Double: the note returns an octave up");
    EXPECT_NEAR(extent(twice.left, 48000, 96000) / played, 0.5, 0.03, "and half as long");
  }

  // Direction: Reverse returns it backwards. A pluck (instant attack at
  // 0.2 s, 100 ms decay) comes back as a swell that ends dead at Length - 0.2 s.
  {
    std::vector<float> input(static_cast<size_t>(3.0f * kRate), 0.0f);
    input[0] = 1.0e-5f;
    for (size_t i = 9600; i < 48000; ++i) {
      const double t = static_cast<double>(i - 9600) / kRate;
      input[i] = static_cast<float>(0.4 * std::cos(2.0 * kPi * 500.0 * t) * std::exp(-t / 0.1));
    }
    clean(device, 2.0f, 0.0f);
    device.set_param(p::kDirection, 1.0f);
    Stereo out = run(device, input);
    const double in_centre = centroid(input, 9600, 38400);
    const double out_centre = centroid(out.left, 57600, 86400);
    EXPECT(in_centre < 0.1, "the test pluck is front-loaded");
    EXPECT_NEAR(out_centre, 1.0 - in_centre, 0.01, "Reverse: its envelope comes back mirrored");
    const size_t top = peak_index(out.left, 48000, 96000);
    // The reversed head passes two samples of tape per sample.
    EXPECT(std::labs(static_cast<long>(top) - 86400) <= 4,
           "the attack lands at Length minus where it was played");
    EXPECT_NEAR(std::fabs(out.left[top]), 0.4, 0.004, "at the level it was played");
    EXPECT(rms(out.left, 86400 + 48, 86400 + 4800) < 0.002 * rms(out.left, 81600, 86400),
           "and nothing follows it");
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 100.0, 2000.0, 72000, 86400), 500.0, 3.0,
                "at the pitch it was played");
  }

  // Record Off: the loop keeps turning and fading, and new input stays off the tape.
  {
    std::vector<float> first = tone_at(330.0f, 0.0f, 0.3f, 1.5f, 0.4f);
    std::vector<float> later = sine(1000.0f, 4.0f, kRate, 0.4f);
    Stereo heard[3];
    for (int which = 0; which < 3; ++which) {
      clean(device, 1.0f, 0.8f);
      run(device, first);
      device.set_param(p::kRecord, which == 0 ? 0.0f : 1.0f);
      render(device, 0.5f, kRate);  // the record gate closes over 20 ms
      heard[which] = which == 2 ? render(device, 4.0f, kRate) : run(device, later);
    }
    // Each render starts 2 s in: passes of the note begin at 0, 1, 2, 3 s.
    const Stereo& off = heard[1];
    const double pass2 = tone_level(off.left, 330.0, kRate, 1200, 13200);
    const double pass3 = tone_level(off.left, 330.0, kRate, 49200, 61200);
    const double pass4 = tone_level(off.left, 330.0, kRate, 97200, 109200);
    EXPECT(pass2 > 0.2, "Record Off: the loop keeps turning");
    EXPECT_NEAR(pass3 / pass2, 0.8, 0.01, "and keeps fading by Feedback");
    EXPECT_NEAR(pass4 / pass3, 0.8, 0.01, "pass after pass");
    double worst = 0.0;
    for (size_t i = 0; i < off.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(off.left[i]) - heard[2].left[i]));
    }
    EXPECT(worst < 1.0e-12, "Record Off: the tape is the same whether or not anything is played");
    EXPECT(tone_level(heard[0].left, 1000.0, kRate, 96000, 192000) > 0.3,
           "Record On: the same input is recorded");
  }

  // Wear: every pass has less treble than the one before; without it they
  // all have the same.
  {
    rng_state() = 0xC0FFEEu;
    std::vector<float> burst = noise(0.2f, kRate, 0.3f);
    burst.resize(static_cast<size_t>(9.0f * kRate), 0.0f);
    double share[2][3];
    int row = 0;
    for (float wear : {0.0f, 0.6f}) {
      clean(device, 1.0f, 0.9f);
      device.set_param(p::kWear, wear);
      Stereo out = run(device, burst);
      int column = 0;
      for (size_t pass : {1u, 4u, 8u}) {
        share[row][column++] = energy_above(out.left, 3000.0, kRate, pass * 48000, pass * 48000 + 9600);
      }
      ++row;
    }
    EXPECT(std::fabs(share[0][2] / share[0][0] - 1.0) < 0.01, "Wear 0: a pass does not change the tone");
    EXPECT(share[1][1] < 0.6 * share[1][0] && share[1][2] < 0.6 * share[1][1],
           "Wear: treble falls pass after pass");
    EXPECT(share[1][0] < share[0][0], "Wear: already on the first pass");
  }

  // Wear also wears the level of loud layers down (saturation) and lets the
  // two channels drift apart.
  {
    std::vector<float> tone = tone_at(800.0f, 0.0f, 0.6f, 8.5f, 0.45f);
    clean(device, 1.0f, 1.0f);
    Stereo pristine = run(device, tone);
    clean(device, 1.0f, 1.0f);
    device.set_param(p::kWear, 1.0f);
    Stereo worn = run(device, tone);
    EXPECT(correlation(pristine.left, pristine.right, 7 * 48000, 7 * 48000 + 28800) > 0.99999,
           "Wear 0: a mono layer stays mono");
    EXPECT(correlation(worn.left, worn.right, 7 * 48000, 7 * 48000 + 28800) < 0.95,
           "Wear: the channels drift apart with age");
    EXPECT(rms(worn.left, 7 * 48000, 7 * 48000 + 28800) <
               0.9 * rms(pristine.left, 7 * 48000, 7 * 48000 + 28800),
           "Wear: a loud layer is pressed down pass after pass");
  }

  // Feedback 1 with no wear holds: 60 passes later the layer is where it
  // was, and at no point is it louder. With wear it only ever fades.
  {
    std::vector<float> tone = tone_at(330.0f, 0.0f, 0.6f, 61.5f, 0.25f);
    clean(device, 1.0f, 1.0f);
    Stereo held = run(device, tone);
    const double first = rms(held.left, 48000, 96000);
    double lowest = 1.0e9, highest = 0.0;
    for (size_t pass = 1; pass <= 60; ++pass) {
      const double level = rms(held.left, pass * 48000, (pass + 1) * 48000);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    EXPECT(first > 0.1, "the held layer is there");
    EXPECT(db(lowest / first) > -1.0, "Feedback 1, Wear 0: level within 1 dB over 60 passes");
    EXPECT(highest <= first * 1.000001, "and it never grows");
    std::printf("tape-loop: after 60 passes at Feedback 1 the layer is at %.4f dB\n",
                db(lowest / first));

    clean(device, 1.0f, 1.0f);
    device.set_param(p::kWear, 0.5f);
    device.set_param(p::kSpread, 0.5f);
    Stereo fading = run(device, tone);
    bool grew = false;
    for (size_t pass = 2; pass <= 60; ++pass) {
      if (rms(fading.left, pass * 48000, (pass + 1) * 48000) +
              rms(fading.right, pass * 48000, (pass + 1) * 48000) >
          1.0001 * (rms(fading.left, (pass - 1) * 48000, pass * 48000) +
                    rms(fading.right, (pass - 1) * 48000, pass * 48000))) {
        grew = true;
      }
    }
    EXPECT(!grew, "Feedback 1 with wear and crossing: no pass is louder than the last");
  }

  // Playing into a loop at Feedback 1 for a minute stays bounded: the record
  // limiter holds the tape at full scale.
  {
    clean(device, 1.0f, 1.0f);
    device.set_param(p::kLowCut, 800.0f);
    Stereo out = run(device, sine(110.0f, 60.0f, kRate, 1.0f));
    EXPECT(finite(out.left) && peak(out.left) < 2.0, "a full-scale tone into a held loop stays bounded");
    EXPECT(rms(out.left, 59 * 48000) > 0.05, "and keeps sounding");
  }

  // Length glides like tape: no click, the pitch bends while the decks
  // move, and the loop settles at the new length.
  {
    const double own_step = 0.4 * 2.0 * kPi * 220.0 / kRate;
    clean(device, 2.0f, 0.5f);
    run(device, sine(220.0f, 6.0f, kRate, 0.2f));
    device.set_param(p::kLength, 2.5f);
    Stereo longer = run(device, sine(220.0f, 8.0f, kRate, 0.2f));
    device.set_param(p::kLength, 2.0f);
    Stereo shorter = run(device, sine(220.0f, 8.0f, kRate, 0.2f));
    std::printf(
        "tape-loop: largest step while Length moves: %.4f longer, %.4f shorter (steady tone %.4f)\n",
        max_step(longer.left), max_step(shorter.left), own_step);
    EXPECT(max_step(longer.left) < 3.0 * own_step, "lengthening the loop does not click");
    // Closing the decks plays the tape up to four times faster for a moment.
    EXPECT(max_step(shorter.left) < 6.0 * own_step, "shortening the loop does not click");
    EXPECT(tone_level(longer.left, 220.0, kRate, 0, 9600) <
               0.5 * tone_level(longer.left, 220.0, kRate, 336000, 384000),
           "the pitch bends away while the decks move");
    EXPECT_NEAR(dominant_frequency(longer.left, kRate, 100.0, 1000.0, 336000, 384000), 220.0, 0.5,
                "and comes back when they stop");
  }
  {
    // After the move a pass takes the new Length, to the sample.
    clean(device, 1.0f, 0.5f);
    run(device, sine(220.0f, 0.5f, kRate, 0.2f));
    device.set_param(p::kLength, 1.5f);
    render(device, 40.0f, kRate);
    Stereo out = run(device, impulse(4.0f, kRate, 0.4f));
    EXPECT(peak_index(out.left, 36000, 108000) == 72000,
           "after a Length change a pass takes the new Length");
    EXPECT(peak_index(out.left, 108000, 180000) == 144000, "exactly");
  }

  // Speed and Direction change like a tape machine: the pitch bends through
  // the change (through a standstill for a reversal) and nothing clicks, and
  // a moving head crosses the record head without a click.
  {
    const double own_step = 0.4 * 2.0 * kPi * 220.0 / kRate;
    clean(device, 1.0f, 0.5f);
    Stereo all = run(device, sine(220.0f, 4.0f, kRate, 0.2f));
    const float moves[6][2] = {{0, 0}, {2, 0}, {1, 1}, {0, 1}, {2, 1}, {1, 0}};
    double worst = 0.0;
    for (const float* move : moves) {
      device.set_param(p::kSpeed, move[0]);
      device.set_param(p::kDirection, move[1]);
      Stereo out = run(device, sine(220.0f, 5.0f, kRate, 0.2f));
      worst = std::max(worst, max_step(out.left));
      EXPECT(rms(out.left, 144000) > 0.1, "the loop keeps playing at every speed and direction");
    }
    std::printf("tape-loop: largest step over speed and direction changes %.4f (steady tone %.4f)\n",
                worst, own_step);
    // At Double the 220 Hz on tape plays at 440 Hz: twice the step.
    EXPECT(worst < 3.0 * own_step, "speed and direction changes and head crossings do not click");
  }
  {
    clean(device, 1.0f, 0.0f);
    run(device, sine(440.0f, 3.0f, kRate, 0.3f));
    device.set_param(p::kSpeed, 0.0f);
    Stereo slowing = run(device, sine(440.0f, 3.0f, kRate, 0.3f));
    EXPECT_NEAR(dominant_frequency(slowing.left, kRate, 100.0, 1000.0, 96000, 144000), 220.0, 1.0,
                "switching to Half lands an octave down");
    const double early = dominant_frequency(slowing.left, kRate, 100.0, 1000.0, 2400, 7200);
    EXPECT(early > 240.0 && early < 420.0, "by way of a glide, not a jump");
  }

  // Wow bends the played pitch: a steady tone comes back frequency-modulated.
  {
    clean(device, 1.0f, 0.0f);
    Stereo steady = run(device, sine(1000.0f, 6.0f, kRate, 0.25f));
    clean(device, 1.0f, 0.0f);
    device.set_param(p::kWow, 1.0f);
    Stereo wobbly = run(device, sine(1000.0f, 6.0f, kRate, 0.25f));
    const double still = tone_level(steady.left, 1000.0, kRate, 96000);
    const double moved = tone_level(wobbly.left, 1000.0, kRate, 96000);
    EXPECT_NEAR(still, 0.25, 0.005, "without wow the tape plays a tone as that tone");
    EXPECT(moved < still * 0.9, "Wow spreads the tone's energy away from its frequency");
    EXPECT_NEAR(rms(wobbly.left, 96000), rms(steady.left, 96000), 0.005, "without changing its level");
  }

  // Ping Pong: a centred note is recorded on the left and changes sides on
  // every pass.
  {
    std::vector<float> note = tone_at(330.0f, 0.0f, 0.3f, 3.5f, 0.3f);
    clean(device, 1.0f, 0.8f);
    device.set_param(p::kSpread, 1.0f);
    Stereo out = run(device, note);
    const double l1 = rms(out.left, 48000, 62400), r1 = rms(out.right, 48000, 62400);
    const double l2 = rms(out.left, 96000, 110400), r2 = rms(out.right, 96000, 110400);
    const double l3 = rms(out.left, 144000, 158400), r3 = rms(out.right, 144000, 158400);
    EXPECT(l1 > 100.0 * r1 && r2 > 100.0 * l2 && l3 > 100.0 * r3,
           "Ping Pong: passes alternate left, right, left");
    EXPECT_NEAR(r2 / l1, 0.8, 0.01, "Ping Pong: crossing costs nothing beyond Feedback");
    clean(device, 1.0f, 0.8f);
    Stereo centred = run(device, note);
    EXPECT(correlation(centred.left, centred.right, 48000) > 0.99999,
           "Ping Pong 0: a centred note stays centred");
    EXPECT_NEAR(l1 * l1, 2.0 * rms(centred.left, 48000, 62400) * rms(centred.left, 48000, 62400), 0.002,
                "Ping Pong keeps the loudness");
  }

  // Low Cut thins what the play head gives.
  {
    clean(device, 1.0f, 0.0f);
    Stereo full = run(device, sine(60.0f, 3.0f, kRate, 0.4f));
    clean(device, 1.0f, 0.0f);
    device.set_param(p::kLowCut, 800.0f);
    Stereo thin = run(device, sine(60.0f, 3.0f, kRate, 0.4f));
    EXPECT(tone_level(full.left, 60.0, kRate, 72000) > 0.35, "Low Cut at 20 Hz keeps a 60 Hz tone");
    EXPECT(tone_level(thin.left, 60.0, kRate, 72000) < 0.1 * tone_level(full.left, 60.0, kRate, 72000),
           "Low Cut at 800 Hz removes it");
  }

  // Mix 0 is the dry signal untouched.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i)
      worst = std::max(worst, std::fabs(out.left[i] - (double)tone[i]));
    EXPECT(worst < 1.0e-6, "Mix 0 passes the input through");
  }

  // Sleep. A fading loop goes to exact zero once a whole loop of tape is
  // blank, and wakes with a blank tape; a held loop never sleeps.
  {
    clean(device, 1.0f, 0.3f);
    run(device, noise(0.2f, kRate, 0.5f));
    Stereo fade = render(device, 18.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep once the loop has faded");
    size_t last = 0;
    for (size_t i = 0; i < fade.size(); ++i) {
      if (fade.left[i] != 0.0f) last = i;
    }
    // Twelve passes to fall 126 dB, then one more loop of blank tape.
    EXPECT(last > 11 * 48000 && last < 16 * 48000,
           "it sleeps a loop after the last audible pass, not before");
    Stereo woken = run(device, impulse(2.5f, kRate, 0.4f));
    EXPECT(peak(woken.left, 1, 47990) < 1.0e-9, "it wakes with a blank tape");
    EXPECT(peak_index(woken.left, 24000, 72000) == 48000, "and loops again");

    clean(device, 30.0f, 1.0f);
    run(device, tone_at(330.0f, 0.0f, 0.3f, 1.0f, 0.3f));
    Stereo quiet = render(device, 28.0f, kRate);
    Stereo back = render(device, 3.0f, kRate);
    EXPECT(peak(quiet.left) < 1.0e-6, "a 30 s loop is silent between passes of a short note");
    EXPECT_NEAR(rms(back.left, 48000, 62400), 0.3 / std::sqrt(2.0), 0.01,
                "and has not gone to sleep: the note returns after 30 s");
    render(device, 120.0f, kRate);
    Stereo much_later = render(device, 31.0f, kRate);
    EXPECT(rms(much_later.left) > 0.01, "a held loop is still turning minutes later");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("tape-loop", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kLength, 1.0f);
  device.set_param(p::kSpeed, 2.0f);
  device.set_param(p::kDirection, 1.0f);
  device.set_param(p::kWear, 1.0f);
  report_cost("tape-loop reversed at double speed", 10.0f, kRate, [&] { run(device, input); });

  return finish("tape-loop");
}
