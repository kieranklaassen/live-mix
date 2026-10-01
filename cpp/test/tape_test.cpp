// Native harness for Tape (cpp/devices/tape). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest measures the machine: saturation and its aliasing, wow and
// flutter, each speed's equalisation, dropouts, hiss, and the latency.

#include "../devices/tape/tape.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Tape;
namespace p = livemix::tape;

static Tape device;

static const float kRate = 48000.0f;
static const size_t kLatency = Tape::kLatency;
enum { k15 = 0, k7 = 1, k3 = 2, kCassette = 3 };

// A machine in perfect order: nothing moving, nothing worn, no hiss, no
// bump, at the given speed. Each check turns on the one thing it measures.
static void pristine(Tape& d, int speed = k15) {
  d.init(kRate);
  d.set_param(p::kDrive, 0.0f);
  d.set_param(p::kWow, 0.0f);
  d.set_param(p::kFlutter, 0.0f);
  d.set_param(p::kSpeed, static_cast<float>(speed));
  d.set_param(p::kAge, 0.0f);
  d.set_param(p::kHiss, 0.0f);
  d.set_param(p::kBump, 0.0f);
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
static double median(std::vector<float> x) {
  std::sort(x.begin(), x.end());
  return x.empty() ? 0.0 : x[x.size() / 2];
}
static std::vector<float> centred(const std::vector<float>& x) {
  const double m = mean(x);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = static_cast<float>(x[i] - m);
  return out;
}

// Pitch deviation of a steady tone as a share of its frequency, one value
// per `group` cycles, from the rising zero crossings after `from`.
static std::vector<float> deviation(const std::vector<float>& x, double hz, size_t from,
                                    int group) {
  std::vector<double> crossings;
  for (size_t i = from + 1; i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      crossings.push_back(
          (static_cast<double>(i - 1) + (0.0 - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1])) /
          kRate);
    }
  }
  std::vector<float> out;
  for (size_t i = static_cast<size_t>(group); i < crossings.size();
       i += static_cast<size_t>(group)) {
    const double measured = group / (crossings[i] - crossings[i - static_cast<size_t>(group)]);
    out.push_back(static_cast<float>(measured / hz - 1.0));
  }
  return out;
}

static double largest(const std::vector<float>& x) { return std::max(highest(x), -lowest(x)); }

// Magnitude of an impulse response at `hz`.
static double response(const std::vector<float>& h, double hz) {
  double re = 0.0, im = 0.0;
  for (size_t i = 0; i < h.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    re += h[i] * std::cos(phase);
    im -= h[i] * std::sin(phase);
  }
  return std::sqrt(re * re + im * im);
}

// The frequency above 1 kHz where the response has fallen 3 dB below 1 kHz.
static double bandwidth(const std::vector<float>& h) {
  const double reference = response(h, 1000.0);
  for (double hz = 1000.0; hz < 23500.0; hz *= 1.01) {
    if (response(h, hz) < reference * 0.70711) return hz;
  }
  return 24000.0;
}

// The strongest frequency between 30 and 250 Hz, and its gain over 1 kHz in dB.
static void find_bump(const std::vector<float>& h, double* hz, double* gain_db) {
  double best = 0.0, best_hz = 0.0;
  for (double f = 30.0; f <= 250.0; f += 0.5) {
    const double level = response(h, f);
    if (level > best) {
      best = level;
      best_hz = f;
    }
  }
  *hz = best_hz;
  *gain_db = db(best / response(h, 1000.0));
}

// A small impulse through the wet path: small enough to be in the linear part.
static std::vector<float> impulse_response() {
  return run(device, impulse(0.5f, kRate, 0.01f)).left;
}

// Level of everything a 5 kHz tone can fold back to at 48 kHz: every
// multiple of 1 kHz that is not one of its harmonics. Up to 19 kHz: the
// oversampler's filter is clean below 0.42 of the sample rate, and the top
// 4 kHz is its transition band.
static double folded(const std::vector<float>& x, size_t from) {
  double sum = 0.0;
  for (int k = 1; k <= 19; ++k) {
    if (k % 5 == 0) continue;
    const double level = tone_level(x, 1000.0 * k, kRate, from);
    sum += level * level;
  }
  return std::sqrt(sum);
}

int main() {
  Conformance spec;
  spec.name = "tape";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 4.0f;  // a second of hiss, its fade, and the filters
  spec.max_peak = 6.0f;      // Output adds up to 12 dB
  check_effect(device, spec, kRate);

  // Latency: Mix 0 is the input delayed by exactly the reported count, and
  // the tape path arrives at the same moment.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = noise(0.5f, kRate, 0.5f);
    Stereo out = run(device, in);
    double worst = 0.0;
    for (size_t i = kLatency; i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i - kLatency]));
    }
    EXPECT(worst < 1.0e-6, "Mix 0 is the input, delayed by the latency");
    EXPECT(peak(out.left, 0, kLatency) == 0.0, "nothing before the latency");

    pristine(device);
    device.set_param(p::kTone, 1.0f);
    const std::vector<float> h = impulse_response();
    size_t at = 0;
    for (size_t i = 0; i < h.size(); ++i) {
      if (std::fabs(h[i]) > std::fabs(h[at])) at = i;
    }
    // The playback roll-off, like any minimum-phase filter, leans half a sample late.
    EXPECT(at == kLatency || at == kLatency + 1, "the tape path's impulse lands on the latency");
    EXPECT_NEAR(db(response(h, 1000.0) / 0.01), 0.0, 0.3, "a quiet signal passes at unity gain");
  }

  // Drive: odd harmonics and some even ones, and the peaks are held back.
  {
    auto harmonics = [&](float drive, double* second, double* third) {
      pristine(device);
      device.set_param(p::kDrive, drive);
      Stereo out = run(device, sine(220.0f, 1.0f, kRate, 0.5f));
      const double first = tone_level(out.left, 220.0, kRate, 24000);
      *second = db(tone_level(out.left, 440.0, kRate, 24000) / first);
      *third = db(tone_level(out.left, 660.0, kRate, 24000) / first);
    };
    double second, third;
    harmonics(0.0f, &second, &third);
    EXPECT(third < -38.0 && second < -30.0, "Drive 0: tape running cool, harmonics well down");
    harmonics(1.0f, &second, &third);
    EXPECT(third > -20.0, "Drive 1: a strong third harmonic");
    EXPECT(second > -45.0 && second < third, "Drive 1: some second harmonic, less than the third");

    auto growth = [&](float drive) {
      pristine(device);
      device.set_param(p::kDrive, drive);
      const double quiet = peak(run(device, sine(220.0f, 0.5f, kRate, 0.05f)).left, 12000);
      pristine(device);
      device.set_param(p::kDrive, drive);
      const double loud = peak(run(device, sine(220.0f, 0.5f, kRate, 0.8f)).left, 12000);
      return db(loud / quiet);
    };
    EXPECT(growth(0.0f) > 21.5, "Drive 0: 24 dB more input is nearly 24 dB more output");
    EXPECT(growth(1.0f) < 12.0, "Drive 1: 24 dB more input is under 12 dB more output");
  }

  // Loud highs are dulled, quiet ones are not, and the lows keep their level.
  {
    auto gain = [&](float hz, float level) {
      pristine(device);
      device.set_param(p::kTone, 1.0f);
      device.set_param(p::kDrive, 0.5f);
      Stereo out = run(device, sine(hz, 0.5f, kRate, level));
      return tone_level(out.left, hz, kRate, 12000) / level;
    };
    const double low_loss = db(gain(200.0f, 0.5f) / gain(200.0f, 0.01f));
    const double high_loss = db(gain(8000.0f, 0.5f) / gain(8000.0f, 0.01f));
    EXPECT_NEAR(db(gain(8000.0f, 0.01f) / gain(200.0f, 0.01f)), 0.0, 1.0,
                "quiet: highs and lows pass alike");
    EXPECT(high_loss < low_loss - 4.0, "loud: 8 kHz loses at least 4 dB more than 200 Hz");
  }

  // Aliasing: a 5 kHz tone driven hard, and then as hard as it goes, folds
  // back far less than the same curve applied sample by sample.
  {
    auto fold_back = [&](float drive, float level, double* ours, double* naive) {
      pristine(device);
      device.set_param(p::kTone, 1.0f);
      device.set_param(p::kDrive, drive);
      const std::vector<float> in = sine(5000.0f, 1.0f, kRate, level);
      Stereo out = run(device, in);
      std::vector<float> bare(in.size());
      const float gain = std::exp2(4.0f * drive - 1.0f), bias = 0.05f + 0.25f * drive;
      for (size_t i = 0; i < in.size(); ++i) {
        const float u = gain * in[i] + bias;
        bare[i] = u / std::sqrt(1.0f + u * u);
      }
      *ours = db(folded(out.left, 24000) / tone_level(out.left, 5000.0, kRate, 24000));
      *naive = db(folded(bare, 24000) / tone_level(bare, 5000.0, kRate, 24000));
      return db(tone_level(out.left, 15000.0, kRate, 24000) /
                tone_level(out.left, 5000.0, kRate, 24000));
    };
    double ours, naive;
    const double third = fold_back(0.75f, 0.5f, &ours, &naive);
    EXPECT(third > -20.0, "the driven tone has a strong third harmonic at 15 kHz");
    EXPECT(ours < -58.0, "Drive 0.75: fold-back is 58 dB under the tone");
    EXPECT(ours < naive - 25.0, "Drive 0.75: and 25 dB under a bare shaper's");
    fold_back(1.0f, 0.9f, &ours, &naive);
    EXPECT(ours < -42.0, "Drive 1, full scale: fold-back is still 42 dB under the tone");
    EXPECT(ours < naive - 22.0, "Drive 1, full scale: and 22 dB under a bare shaper's");
  }

  // Wow: ±0.8 % at 1, at the speed's rate, and it scales with the control.
  {
    const std::vector<float> in = sine(3000.0f, 40.0f, kRate, 0.25f);
    pristine(device, k7);
    device.set_param(p::kWow, 1.0f);
    const std::vector<float> full = deviation(run(device, in).left, 3000.0, 4800, 30);
    EXPECT(largest(full) > 0.0062 && largest(full) < 0.0084, "Wow 1: pitch wanders up to ±0.8 %");
    EXPECT_NEAR(dominant_frequency(centred(full), 100.0, 0.2, 4.0), 0.8, 0.04,
                "7.5 ips: wow centres on 0.8 Hz");

    pristine(device, k7);
    device.set_param(p::kWow, 0.5f);
    const std::vector<float> half = deviation(run(device, in).left, 3000.0, 4800, 30);
    EXPECT_NEAR(rms(half) / rms(full), 0.5, 0.03, "Wow 0.5 is half the deviation");

    pristine(device, kCassette);
    device.set_param(p::kWow, 1.0f);
    const std::vector<float> slow = deviation(run(device, in).left, 3000.0, 4800, 30);
    EXPECT_NEAR(dominant_frequency(centred(slow), 100.0, 0.2, 4.0), 0.5, 0.03,
                "Cassette: wow centres on 0.5 Hz");
    EXPECT(largest(slow) > 0.0062 && largest(slow) < 0.0084,
           "the deviation is the same size at any speed");

    pristine(device, k7);
    const std::vector<float> still =
        deviation(run(device, sine(3000.0f, 4.0f, kRate, 0.25f)).left, 3000.0, 4800, 30);
    EXPECT(largest(still) < 0.00002, "Wow 0 and Flutter 0: the pitch is steady");
  }

  // Flutter: ±0.3 % at 1, at the speed's rate, and never quite regular.
  {
    const std::vector<float> in = sine(3000.0f, 20.0f, kRate, 0.25f);
    pristine(device, k7);
    device.set_param(p::kFlutter, 1.0f);
    const std::vector<float> full = deviation(run(device, in).left, 3000.0, 4800, 15);
    EXPECT(largest(full) > 0.0024 && largest(full) < 0.0035,
           "Flutter 1: pitch shakes by up to ±0.3 %");
    const double rate = dominant_frequency(centred(full), 200.0, 3.0, 20.0);
    EXPECT_NEAR(rate, 8.0, 1.0, "7.5 ips: flutter sits near 8 Hz");
    // Its depth wanders: the largest swing in each quarter second (two cycles) differs.
    std::vector<float> per_quarter;
    for (size_t i = 0; i + 50 <= full.size(); i += 50) {
      per_quarter.push_back(static_cast<float>(largest(std::vector<float>(
          full.begin() + static_cast<long>(i), full.begin() + static_cast<long>(i) + 50))));
    }
    EXPECT(highest(per_quarter) > 1.2 * lowest(per_quarter), "flutter's depth is not constant");

    pristine(device, k15);
    device.set_param(p::kFlutter, 1.0f);
    const std::vector<float> fast = deviation(run(device, in).left, 3000.0, 4800, 15);
    EXPECT_NEAR(dominant_frequency(centred(fast), 200.0, 3.0, 20.0), 9.5, 1.2,
                "15 ips: flutter sits near 9.5 Hz");
  }

  // Each speed: its bandwidth and its head bump.
  {
    const double bandwidths[4] = {18000.0, 13000.0, 8000.0, 5500.0};
    const double bumps[4] = {60.0, 70.0, 85.0, 100.0};
    static const char* names[4] = {"15 ips", "7.5 ips", "3.75 ips", "Cassette"};
    double previous = 1.0e9;
    for (int speed = 0; speed < 4; ++speed) {
      char label[96];
      pristine(device, speed);
      device.set_param(p::kBump, 1.0f);
      const std::vector<float> h = impulse_response();
      const double edge = bandwidth(h);
      std::snprintf(label, sizeof label, "%s: -3 dB at %.1f kHz", names[speed],
                    bandwidths[speed] * 0.001);
      EXPECT_NEAR(edge, bandwidths[speed], 0.07 * bandwidths[speed], label);
      std::snprintf(label, sizeof label, "%s: narrower than the speed above", names[speed]);
      EXPECT(edge < previous, label);
      previous = edge;
      double hz, gain;
      find_bump(h, &hz, &gain);
      std::snprintf(label, sizeof label, "%s: head bump at %.0f Hz", names[speed], bumps[speed]);
      EXPECT_NEAR(hz, bumps[speed], 0.08 * bumps[speed], label);
      // 5 dB of peak, less the low cut that sits under it.
      std::snprintf(label, sizeof label, "%s: Head Bump 1 lifts it about 4.5 dB", names[speed]);
      EXPECT_NEAR(gain, 4.5, 0.8, label);
      std::snprintf(label, sizeof label, "%s: the lows roll off under the bump", names[speed]);
      EXPECT(db(response(h, 0.2 * bumps[speed]) / response(h, 1000.0)) < -12.0, label);
    }

    pristine(device, k7);
    const std::vector<float> flat = impulse_response();
    EXPECT_NEAR(db(response(flat, 70.0) / response(flat, 1000.0)), -0.6, 0.6,
                "Head Bump 0: no lift at 70 Hz");

    // Tone moves the bandwidth an octave either way; Age takes an octave off.
    pristine(device, k3);
    device.set_param(p::kTone, 0.0f);
    EXPECT_NEAR(bandwidth(impulse_response()), 4000.0, 300.0, "Tone 0: half the bandwidth");
    pristine(device, k3);
    device.set_param(p::kTone, 1.0f);
    EXPECT_NEAR(bandwidth(impulse_response()), 16000.0, 1200.0, "Tone 1: twice the bandwidth");
    pristine(device, k3);
    device.set_param(p::kAge, 1.0f);
    EXPECT_NEAR(bandwidth(impulse_response()), 4000.0, 300.0, "Age 1: an octave of treble gone");
  }

  // Age: dropouts. The level of a steady tone starts to dip, briefly, the
  // treble further than the bass, more often the older the tape.
  {
    std::vector<float> in = sine(400.0f, 30.0f, kRate, 0.2f);
    const std::vector<float> high = sine(6000.0f, 30.0f, kRate, 0.2f);
    for (size_t i = 0; i < in.size(); ++i) in[i] += high[i];
    double spread[3], deepest_low[3], deepest_high[3], dipped[3];
    int count[3];
    int which = 0;
    for (float age : {0.0f, 0.5f, 1.0f}) {
      pristine(device);
      device.set_param(p::kAge, age);
      Stereo out = run(device, in);
      std::vector<float> low_level, high_level;
      for (size_t i = 48000; i + 480 <= out.size(); i += 480) {
        low_level.push_back(static_cast<float>(tone_level(out.left, 400.0, kRate, i, i + 480)));
        high_level.push_back(static_cast<float>(tone_level(out.left, 6000.0, kRate, i, i + 480)));
      }
      const double usual = median(low_level);
      spread[which] = rms(centred(low_level)) / mean(low_level);
      deepest_low[which] = lowest(low_level) / usual;
      deepest_high[which] = lowest(high_level) / median(high_level);
      size_t under = 0;
      count[which] = 0;
      bool down = false;
      for (float level : low_level) {
        if (level < 0.9 * usual) ++under;
        if (!down && level < 0.85 * usual) {
          down = true;
          ++count[which];
        } else if (down && level > 0.95 * usual) {
          down = false;
        }
      }
      dipped[which] = static_cast<double>(under) / static_cast<double>(low_level.size());
      ++which;
    }
    EXPECT(spread[0] < 0.002 && count[0] == 0, "Age 0: the level is steady, no dropouts");
    EXPECT(spread[2] > 0.05, "Age 1: the short-term level varies");
    EXPECT(deepest_low[2] < 0.5, "Age 1: the deepest dropout takes more than half the level");
    EXPECT(deepest_high[2] < 0.6 * deepest_low[2],
           "a dropout takes the treble further down than the bass");
    EXPECT(dipped[2] < 0.35, "dropouts are brief: most of the time the level is whole");
    EXPECT(count[2] >= 35 && count[2] <= 80, "Age 1: about two dropouts a second");
    EXPECT(count[1] >= 5 && count[1] < count[2] / 2, "Age 0.5: far fewer");
  }

  // Hiss follows its control, carries on for a second after the signal, and
  // then stops: an idle device is exactly silent.
  {
    std::vector<float> in = sine(440.0f, 0.2f, kRate, 0.2f);
    in.resize(static_cast<size_t>(3.5f * kRate), 0.0f);
    const size_t end = static_cast<size_t>(0.2f * kRate) + kLatency;
    double level[3];
    int which = 0;
    for (float hiss : {1.0f, 0.5f, 0.0f}) {
      pristine(device);
      device.set_param(p::kHiss, hiss);
      Stereo out = run(device, in);
      level[which++] = rms(out.left, end + 19200, end + 43200);
      if (hiss == 1.0f) {
        EXPECT(rms(out.left, 0, 9600) > 0.1, "the signal passes over the hiss");
        EXPECT(peak(out.left, end + 110400, out.size()) == 0.0 &&
                   peak(out.right, end + 110400, out.size()) == 0.0,
               "2.3 s after the signal the hiss has faded and the output is exactly zero");
        EXPECT(correlation(out.left, out.right, end + 19200, end + 43200) < 0.1,
               "each channel has its own hiss");
        EXPECT(energy_above(out.left, 3000.0, kRate, end + 19200, end + 43200) > 0.5,
               "hiss is mostly treble");
      }
    }
    EXPECT_NEAR(db(level[0]), -40.0, 1.5, "Hiss 1 at 15 ips is -40 dBFS");
    EXPECT_NEAR(db(level[0] / level[1]), 12.0, 1.0, "Hiss 0.5 is 12 dB quieter");
    EXPECT(level[2] < 1.0e-6, "Hiss 0 adds nothing");

    pristine(device);
    device.set_param(p::kHiss, 1.0f);
    Stereo idle = render(device, 1.0f, kRate);
    EXPECT(peak(idle.left) == 0.0 && peak(idle.right) == 0.0,
           "no input, no hiss: an idle track is silent");
  }

  // Output is a plain trim.
  {
    pristine(device);
    const double plain = rms(run(device, sine(440.0f, 0.5f, kRate, 0.1f)).left, 12000);
    pristine(device);
    device.set_param(p::kOutput, 6.0f);
    const double up = rms(run(device, sine(440.0f, 0.5f, kRate, 0.1f)).left, 12000);
    EXPECT_NEAR(db(up / plain), 6.0, 0.05, "Output +6 dB is 6 dB");
    device.init(kRate);
    const double stock = rms(run(device, sine(440.0f, 2.0f, kRate, 0.25f)).left, 48000);
    EXPECT_NEAR(db(stock / (0.25 * 0.7071)), 0.0, 1.5,
                "the default patch keeps a tone within 1.5 dB");
  }

  // Changing speed and moving controls while sounding does not click: the
  // largest step during each change is no more than the settings before or
  // after it make on their own.
  {
    const std::vector<float> tone = sine(220.0f, 0.4f, kRate, 0.5f);  // whole cycles: runs join up
    pristine(device);
    device.set_param(p::kWow, 0.5f);
    run(device, tone);
    double settled = max_step(run(device, tone).left);
    auto change = [&](int id, float value, const char* what) {
      device.set_param(id, value);
      const double during = max_step(run(device, tone).left);
      const double after = max_step(run(device, tone).left);
      EXPECT(during < 1.25 * std::max(settled, after) + 0.002, what);
      settled = after;
    };
    change(p::kSpeed, static_cast<float>(kCassette), "Speed to Cassette glides");
    change(p::kWow, 1.0f, "Wow up glides");
    change(p::kFlutter, 1.0f, "Flutter up glides");
    change(p::kDrive, 1.0f, "Drive up glides");
    change(p::kBump, 1.0f, "Head Bump up glides");
    change(p::kTone, 0.0f, "Tone down glides");
    change(p::kSpeed, static_cast<float>(k15), "Speed to 15 ips glides");
    change(p::kDrive, 0.2f, "Drive down glides");
    change(p::kOutput, -6.0f, "Output down glides");
    change(p::kMix, 0.5f, "Mix glides");
    change(p::kWow, 0.0f, "Wow off glides");
    change(p::kHiss, 1.0f, "Hiss up glides");
    change(p::kAge, 0.3f, "Age up glides");
  }

  // The device sleeps and wakes.
  {
    device.init(kRate);
    run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    render(device, 4.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the hiss has faded");
    Stereo woken = run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    EXPECT(peak(woken.left, kLatency) > 0.2, "wakes on new input");
  }

  device.init(kRate);
  device.set_param(p::kAge, 0.6f);
  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("tape", 10.0f, kRate, [&] { run(device, input); });

  return finish("tape");
}
