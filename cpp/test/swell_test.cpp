// Native harness for Swell (cpp/devices/swell). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a swell: the attack is gone, the rise takes
// the time the control says, and it re-arms.

#include "../devices/swell/swell.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Swell;
namespace p = livemix::swell;

static Swell device;

static const float kRate = 48000.0f;
static const size_t kLatency = Swell::kLatency;

static size_t at(double seconds) { return static_cast<size_t>(seconds * kRate); }

// `seconds` of a tone starting at zero phase, appended to `x`.
static void add_tone(std::vector<float>& x, float hz, float seconds, float gain) {
  const size_t n = at(seconds);
  for (size_t i = 0; i < n; ++i) {
    x.push_back(gain *
                static_cast<float>(std::sin(2.0 * kPi * hz * static_cast<double>(i) / kRate)));
  }
}

static void add_silence(std::vector<float>& x, float seconds) {
  x.resize(x.size() + at(seconds), 0.0f);
}

// Seconds between the first crossing of `from` and the first crossing of `to`
// (shares of `full`) in an envelope taken every `window` samples from `start`.
static double travel_time(const std::vector<float>& x, size_t start, size_t end, double full,
                          double from, double to, size_t window = 48) {
  const bool rising = to > from;
  double t_from = -1.0, t_to = -1.0;
  for (size_t i = start; i + window <= end; i += window) {
    const double level = peak(x, i, i + window) / full;
    const double t = static_cast<double>(i - start) / kRate;
    if (t_from < 0.0 && (rising ? level >= from : level <= from)) t_from = t;
    if (t_to < 0.0 && (rising ? level >= to : level <= to)) {
      t_to = t;
      break;
    }
  }
  return (t_from < 0.0 || t_to < 0.0) ? -1.0 : t_to - t_from;
}

static void plain(Swell& d) {
  d.init(kRate);
  d.set_param(p::kCurve, 0.0f);
  d.set_param(p::kLookahead, 0.0f);
}

int main() {
  Conformance spec;
  spec.name = "swell";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 1.0f;  // it only ever turns the input down
  check_effect(device, spec, kRate);

  // A tone that starts at once comes out as a rise, and the rise takes Attack.
  for (float attack : {50.0f, 400.0f, 2000.0f}) {
    plain(device);
    device.set_param(p::kAttack, attack);
    std::vector<float> in;
    add_tone(in, 1000.0f, attack * 0.001f + 0.5f, 0.5f);
    Stereo out = run(device, in);
    const double seconds = attack * 0.001;
    const double rise = travel_time(out.left, kLatency, out.size(), 0.5, 0.1, 0.9);
    char label[96];
    std::snprintf(label, sizeof label,
                  "Attack %.0f ms: 10 to 90 %% of a straight rise takes 0.8 of it", attack);
    EXPECT_NEAR(rise, 0.8 * seconds, 0.04 * seconds + 0.002, label);
    const double whole = travel_time(out.left, kLatency, out.size(), 0.5, 0.0, 0.995);
    std::snprintf(label, sizeof label, "Attack %.0f ms: unity is reached after the attack time",
                  attack);
    EXPECT_NEAR(whole, seconds, 0.04 * seconds + 0.002, label);
    EXPECT(peak(out.left, kLatency, kLatency + 48) < 0.02,
           "the first millisecond of the note is gone");
  }

  // Curve bends the rise: the exponential is far lower half way and arrives late.
  {
    plain(device);
    device.set_param(p::kAttack, 1000.0f);
    device.set_param(p::kCurve, 1.0f);
    std::vector<float> in;
    add_tone(in, 1000.0f, 1.5f, 0.5f);
    Stereo out = run(device, in);
    const double half = peak(out.left, kLatency + at(0.5), kLatency + at(0.5) + 48) / 0.5;
    EXPECT_NEAR(half, 0.076, 0.01, "Curve 1: the gain half way through the attack is e^2.5 of e^5");
    const double rise = travel_time(out.left, kLatency, out.size(), 0.5, 0.1, 0.9);
    EXPECT_NEAR(rise, 0.428, 0.02,
                "Curve 1: 10 to 90 % is squeezed into the last part of the attack");
  }

  // A held tone passes at unity gain once the attack is over.
  {
    device.init(kRate);
    std::vector<float> in;
    add_tone(in, 440.0f, 2.0f, 0.5f);
    Stereo out = run(device, in);
    double worst = 0.0;
    for (size_t i = at(1.0); i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i - kLatency]));
    }
    EXPECT(worst < 1.0e-6, "after the attack the held tone is the input, delayed by the latency");
  }

  // The pick of a plucked note is removed: 30 dB down over its first 5 ms.
  {
    std::vector<float> pluck;
    for (size_t i = 0; i < at(1.0); ++i) {
      const double t = static_cast<double>(i) / kRate;
      pluck.push_back(
          static_cast<float>(0.8 * std::exp(-t / 0.3) * std::cos(2.0 * kPi * 196.0 * t)));
    }
    device.init(kRate);
    Stereo out = run(device, pluck);
    const double dry = rms(pluck, 0, at(0.005));
    const double wet = rms(out.left, kLatency, kLatency + at(0.005));
    EXPECT(db(wet / dry) < -30.0, "a pluck from silence: first 5 ms at least 30 dB down");
    EXPECT(
        rms(out.left, kLatency + at(0.5), kLatency + at(0.6)) > 0.95 * rms(pluck, at(0.5), at(0.6)),
        "the body of the plucked note comes through");

    // The same pluck over a note that is still ringing: the gain is open, so
    // only the lookahead can get it down in time.
    std::vector<float> over;
    add_tone(over, 330.0f, 1.5f, 0.1f);
    const size_t hit = at(1.0);
    for (size_t i = 0; hit + i < over.size(); ++i) over[hit + i] += pluck[i];
    double first[2];
    int which = 0;
    for (float lookahead : {10.0f, 0.0f}) {
      device.init(kRate);
      device.set_param(p::kLookahead, lookahead);
      Stereo ringing = run(device, over);
      first[which++] = db(rms(ringing.left, hit + kLatency, hit + kLatency + at(0.005)) /
                          rms(over, hit, hit + at(0.005)));
    }
    EXPECT(first[0] < -30.0,
           "over a ringing note, 10 ms of lookahead still takes 30 dB off the pick");
    EXPECT(first[1] > first[0] + 12.0, "without lookahead the pick leaks while the gain dives");
  }

  // After silence a new note swells again.
  {
    plain(device);
    device.set_param(p::kAttack, 200.0f);
    std::vector<float> in;
    add_tone(in, 440.0f, 1.0f, 0.5f);
    add_silence(in, 0.5f);
    const size_t second = in.size();
    add_tone(in, 440.0f, 1.0f, 0.5f);
    Stereo out = run(device, in);
    EXPECT(peak(out.left, kLatency + at(0.9), kLatency + at(1.0)) > 0.49,
           "the first note is fully open");
    EXPECT(peak(out.left, second + kLatency, second + kLatency + at(0.01)) < 0.03,
           "the second note starts from the floor again");
    const double rise = travel_time(out.left, second + kLatency, out.size(), 0.5, 0.1, 0.9);
    EXPECT_NEAR(rise, 0.16, 0.01, "and rises over Attack like the first");
  }

  // Retrigger: a louder note over a held one restarts the swell, or does not.
  {
    std::vector<float> in;
    add_tone(in, 220.0f, 3.0f, 0.15f);
    const size_t second = at(1.5);
    for (size_t i = second; i < in.size(); ++i) {
      in[i] += 0.5f * static_cast<float>(
                          std::sin(2.0 * kPi * 587.0 * static_cast<double>(i - second) / kRate));
    }
    double dip[2], late[2];
    for (int mode = 0; mode < 2; ++mode) {
      plain(device);
      device.set_param(p::kAttack, 500.0f);
      device.set_param(p::kRetrigger, static_cast<float>(mode));
      Stereo out = run(device, in);
      const size_t from = second + kLatency;
      dip[mode] = peak(out.left, from + at(0.01), from + at(0.03));
      late[mode] = peak(out.left, from + at(0.7), from + at(0.8));
    }
    EXPECT(dip[0] < 0.05,
           "On new notes: a louder onset during a held note drops back to the floor");
    EXPECT(late[0] > 0.55, "On new notes: and swells up again");
    EXPECT(dip[1] > 0.5, "Only after silence: the same onset passes untouched");
    EXPECT(late[1] > 0.55, "Only after silence: the level stays up");
  }

  // Release: once the input has died away the gain falls back over Release.
  {
    double fall[2];
    int which = 0;
    for (float release : {100.0f, 800.0f}) {
      plain(device);
      device.set_param(p::kAttack, 20.0f);
      device.set_param(p::kRelease, release);
      std::vector<float> in;
      add_tone(in, 1000.0f, 0.5f, 0.5f);
      const size_t quiet = in.size();
      add_tone(in, 1000.0f, 1.5f, 0.001f);  // far under the threshold, but measurable
      Stereo out = run(device, in);
      fall[which++] = travel_time(out.left, quiet + kLatency, out.size(), 0.001, 0.9, 0.1);
    }
    EXPECT_NEAR(fall[0], 0.08, 0.008, "Release 100 ms: the gain falls back in that time");
    EXPECT_NEAR(fall[1], 0.64, 0.03, "Release 800 ms: the gain falls back in that time");
  }

  // Sensitivity is the level a note has to reach.
  {
    std::vector<float> in;
    add_tone(in, 440.0f, 1.0f, 0.003f);  // -50 dBFS
    device.init(kRate);
    device.set_param(p::kSensitivity, -40.0f);
    Stereo shut = run(device, in);
    device.init(kRate);
    device.set_param(p::kSensitivity, -60.0f);
    Stereo open = run(device, in);
    EXPECT(peak(shut.left) == 0.0, "a note under the threshold does not open the gain");
    EXPECT(peak(open.left, at(0.8), at(1.0)) > 0.0029, "lowering Sensitivity lets it through");
  }

  // Depth sets the floor: 0 is the input untouched, 0.5 leaves the pick 12 dB down.
  {
    std::vector<float> in;
    add_tone(in, 1000.0f, 1.0f, 0.5f);
    device.init(kRate);
    device.set_param(p::kDepth, 0.0f);
    Stereo out = run(device, in);
    double worst = 0.0;
    for (size_t i = kLatency; i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i - kLatency]));
    }
    EXPECT(worst < 1.0e-6, "Depth 0 is the input, delayed by the latency");
    EXPECT(peak(out.left, 0, kLatency) == 0.0, "nothing arrives before the latency");

    plain(device);
    device.set_param(p::kDepth, 0.5f);
    device.set_param(p::kAttack, 2000.0f);
    out = run(device, in);
    EXPECT_NEAR(db(peak(out.left, kLatency, kLatency + 96) / 0.5), -12.0, 0.5,
                "Depth 0.5: the note starts 12 dB down");

    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    out = run(device, in);
    worst = 0.0;
    for (size_t i = kLatency; i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i - kLatency]));
    }
    EXPECT(worst < 1.0e-6, "Mix 0 is the input, delayed by the latency");
    plain(device);
    device.set_param(p::kMix, 0.5f);
    device.set_param(p::kAttack, 2000.0f);
    out = run(device, in);
    EXPECT_NEAR(peak(out.left, kLatency, kLatency + 96) / 0.5, 0.5, 0.02,
                "Mix 0.5: half the dry signal under the swell");
  }

  // No clicks: the gain itself (output over delayed input) never moves faster
  // than its quickest ramp, the 2 ms S-curve of the dive, at any setting. A
  // click would be a jump of a tenth or more in one sample.
  {
    std::vector<float> in;
    add_tone(in, 220.0f, 0.6f, 0.2f);
    const size_t second = at(0.3);
    for (size_t i = second; i < in.size(); ++i) {
      in[i] += 0.6f * static_cast<float>(
                          std::sin(2.0 * kPi * 330.0 * static_cast<double>(i - second) / kRate));
    }
    add_tone(in, 220.0f, 0.3f, 0.001f);
    add_tone(in, 220.0f, 0.3f, 0.7f);
    double worst = 0.0, lowest = 1.0, highest = 0.0;
    for (float lookahead : {0.0f, 20.0f}) {
      for (float curve : {0.0f, 1.0f}) {
        for (float attack : {10.0f, 300.0f}) {
          device.init(kRate);
          device.set_param(p::kLookahead, lookahead);
          device.set_param(p::kCurve, curve);
          device.set_param(p::kAttack, attack);
          device.set_param(p::kRelease, 20.0f);
          Stereo out = run(device, in);
          double previous = -1.0;
          for (size_t i = kLatency; i < in.size(); ++i) {
            const double dry = in[i - kLatency];
            if (std::fabs(dry) < 0.05) {
              previous = -1.0;
              continue;
            }
            const double gain = out.left[i] / dry;
            if (previous >= 0.0) worst = std::max(worst, std::fabs(gain - previous));
            previous = gain;
            lowest = std::min(lowest, gain);
            highest = std::max(highest, gain);
          }
        }
      }
    }
    EXPECT(lowest < 0.01 && highest > 0.999, "the click test exercises the whole gain range");
    EXPECT(worst < 0.02, "the gain never steps: its fastest move is the 2 ms dive");

    device.init(kRate);
    device.set_param(p::kAttack, 300.0f);
    std::vector<float> tone;
    add_tone(tone, 220.0f, 0.1f, 0.7f);
    run(device, tone);
    device.set_param(p::kDepth, 0.0f);
    device.set_param(p::kCurve, 0.0f);
    device.set_param(p::kMix, 0.3f);
    device.set_param(p::kLookahead, 20.0f);
    std::vector<float> rest;
    for (size_t i = 0; i < at(0.3); ++i) {
      rest.push_back(0.7f * static_cast<float>(std::sin(2.0 * kPi * 220.0 *
                                                        static_cast<double>(i + at(0.1)) / kRate)));
    }
    Stereo moved = run(device, rest);
    EXPECT(max_step(moved.left) < 1.3 * max_step(rest),
           "Depth, Curve and Mix moved mid-swell glide");
  }

  // The device sleeps: exact zero after the input stops, and it wakes armed.
  {
    device.init(kRate);
    std::vector<float> in;
    add_tone(in, 440.0f, 0.5f, 0.5f);
    run(device, in);
    render(device, 3.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the input stops");
    Stereo woken = run(device, in);
    EXPECT(peak(woken.left, kLatency, kLatency + 96) < 0.02 &&
               peak(woken.left, at(0.45), at(0.5)) > 0.45,
           "wakes on new input and swells");
  }

  device.init(kRate);
  std::vector<float> load;
  for (int note = 0; note < 20; ++note) {
    add_tone(load, 110.0f * static_cast<float>(1 + note % 5), 0.4f, 0.4f);
    add_silence(load, 0.1f);
  }
  report_cost("swell", 10.0f, kRate, [&] { run(device, load); });

  return finish("swell");
}
