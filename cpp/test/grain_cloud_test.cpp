// Native harness for Cloud (cpp/devices/grain-cloud). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a live granular processor.

#include "../devices/grain-cloud/grain_cloud.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::GrainCloud;
namespace p = livemix::grain_cloud;

static GrainCloud device;

static const float kRate = 48000.0f;

// The plainest cloud: newest audio, no randomisation beyond the built-in
// 30 ms, forward grains, centred, wet only.
static void clean(GrainCloud& d) {
  d.init(kRate);
  d.set_param(p::kPosition, 0.0f);
  d.set_param(p::kSize, 200.0f);
  d.set_param(p::kDensity, 20.0f);
  d.set_param(p::kPitch, 0.0f);
  d.set_param(p::kSpray, 0.0f);
  d.set_param(p::kScatter, 0.0f);
  d.set_param(p::kTexture, 0.0f);
  d.set_param(p::kReverse, 0.0f);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kFreeze, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

// RMS in consecutive windows of `window` samples from `from`.
static std::vector<float> envelope(const std::vector<float>& x, size_t window, size_t from = 0) {
  std::vector<float> out;
  for (size_t at = from; at + window <= x.size(); at += window) {
    out.push_back(static_cast<float>(rms(x, at, at + window)));
  }
  return out;
}

// Power near `hz`: grains are not phase-locked to each other, so the energy
// of a partial is spread over a few hertz; this sums it over ±`span`.
static double band_power(const std::vector<float>& x, double hz, double span, size_t from, size_t to) {
  double sum = 0.0;
  for (double offset = -span; offset <= span; offset += 1.0) {
    const double level = tone_level(x, hz + offset, kRate, from, to);
    sum += level * level;
  }
  return sum;
}

// Share of the energy above 1.5 kHz (a fourth-order split: energy_above's
// single pole lets too much of a low tone through to see grain edges).
static double splatter(const std::vector<float>& x, size_t from) {
  const double a = std::exp(-2.0 * kPi * 1500.0 / kRate);
  double low[4] = {0.0, 0.0, 0.0, 0.0}, high_energy = 0.0, total = 0.0;
  for (size_t i = from; i < x.size(); ++i) {
    double v = x[i];
    for (double& state : low) {
      state = v + (state - v) * a;
      v -= state;
    }
    high_energy += v * v;
    total += static_cast<double>(x[i]) * x[i];
  }
  return total > 0.0 ? high_energy / total : 0.0;
}

// Frequency from the zero crossings in [from, to).
static double crossing_frequency(const std::vector<float>& x, size_t from, size_t to) {
  double first = -1.0, last = -1.0;
  int count = 0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double at = static_cast<double>(i - 1) + x[i - 1] / (static_cast<double>(x[i - 1]) - x[i]);
      if (first < 0.0) first = at;
      last = at;
      ++count;
    }
  }
  return count > 1 ? (count - 1) * kRate / (last - first) : 0.0;
}

int main() {
  Conformance spec;
  spec.name = "grain-cloud";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The buffer is eight seconds long: the device may not sleep until all of
  // it has been overwritten with silence.
  spec.tail_seconds = 18.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // Pitch: +12 st doubles the frequency of a held tone, -12 halves it.
  {
    const float settings[3] = {0.0f, 12.0f, -12.0f};
    const double expected[3] = {440.0, 880.0, 220.0};
    for (int k = 0; k < 3; ++k) {
      clean(device);
      device.set_param(p::kSize, 400.0f);
      device.set_param(p::kPitch, settings[k]);
      Stereo out = run(device, sine(440.0f, 5.0f, kRate, 0.5f));
      // Grains start at unrelated phases, so the spectral peak wanders inside
      // the grain's bandwidth; the zero-crossing rate is the mean frequency.
      const double found = crossing_frequency(out.left, 96000, 240000);
      EXPECT_NEAR(found, expected[k], expected[k] * 0.003, "Pitch transposes a held tone by the set interval");
      const double wanted = band_power(out.left, expected[k], 8.0, 96000, 240000);
      const double original = band_power(out.left, k == 0 ? 880.0 : 440.0, 8.0, 96000, 240000);
      EXPECT(original < wanted * 0.01, "the transposed cloud holds nothing at the other pitch");
    }
  }

  // Freeze holds what is in the buffer: steady for 30 s after the input
  // stops, deaf to new input, and it lets go when released. The source is a
  // cluster of eight partials: a cloud of one pure tone fluctuates like any
  // sum of equal sines at random phases, whatever the device does.
  {
    const float partials[8] = {220.0f, 277.0f, 330.0f, 415.0f, 494.0f, 587.0f, 740.0f, 880.0f};
    std::vector<float> chord(static_cast<size_t>(3.2f * kRate), 0.0f);
    for (float hz : partials) {
      std::vector<float> partial = sine(hz, 3.2f, kRate, 0.15f);
      for (size_t i = 0; i < chord.size(); ++i) chord[i] += partial[i];
    }
    const double source = rms(chord);
    std::vector<float> start(chord.begin(), chord.begin() + 144000);
    std::vector<float> rest(chord.begin() + 144000, chord.end());

    clean(device);
    device.set_param(p::kSpray, 0.3f);
    run(device, start);
    device.set_param(p::kFreeze, 1.0f);
    run(device, rest);
    Stereo held = render(device, 30.0f, kRate);
    std::vector<float> level = envelope(held.left, 144000);  // 3 s windows
    double lowest = 1.0e9, highest = 0.0;
    for (float v : level) {
      lowest = std::min(lowest, static_cast<double>(v));
      highest = std::max(highest, static_cast<double>(v));
    }
    std::printf("grain-cloud: frozen level over 30 s between %.1f and %.1f dB re source\n", db(lowest / source),
                db(highest / source));
    EXPECT(db(lowest / source) > -3.0, "Freeze: still at the source level 30 s after the input stopped");
    EXPECT(db(highest / lowest) < 3.0, "Freeze: the held cloud keeps a steady level");
    const double early = rms(held.left, 0, 10 * 48000), late = rms(held.left, 20 * 48000, 30 * 48000);
    EXPECT(std::fabs(db(late / early)) < 1.0, "Freeze: no decay between the first and the last ten seconds");
    double weakest = 1.0e9;
    for (float hz : partials) weakest = std::min(weakest, band_power(held.left, hz, 6.0, 0, 480000));
    EXPECT(weakest > 1.0e-5, "Freeze: every partial of the recorded sound is held");

    Stereo deaf = run(device, sine(1500.0f, 3.0f, kRate, 0.5f));
    Stereo after = render(device, 3.0f, kRate);
    EXPECT(band_power(deaf.left, 1500.0, 10.0, 0, 144000) < 1.0e-6, "Freeze: with Mix at 1 new input is not heard");
    EXPECT(band_power(after.left, 1500.0, 10.0, 0, 144000) < 1.0e-6, "Freeze: new input is not recorded");
    EXPECT(std::fabs(db(rms(after.left) / early)) < 2.0, "Freeze: the held cloud is unchanged by new input");

    device.set_param(p::kFreeze, 0.0f);
    Stereo released = render(device, 12.0f, kRate);
    EXPECT(rms(released.left, 0, 24000) > 0.05, "released: the cloud is still there at first");
    EXPECT(peak(released.left, 10 * 48000) == 0.0, "released: the buffer empties and the device goes silent");

    // Never frozen: the same input is gone once the newest audio has aged out.
    clean(device);
    device.set_param(p::kSpray, 0.3f);
    run(device, chord);
    Stereo gone = render(device, 12.0f, kRate);
    EXPECT(rms(gone.left, 3 * 48000, 4 * 48000) < 1.0e-4, "Freeze off: the cloud dies away after the input");
    EXPECT(peak(gone.left, 10 * 48000) == 0.0, "Freeze off: exact silence after the tail");
  }

  // Density: once grains overlap, more of them is thicker, not louder.
  {
    for (int source = 0; source < 2; ++source) {
      double lowest = 1.0e9, highest = 0.0, sparse = 0.0;
      double reference = 0.0;
      for (float density : {3.0f, 15.0f, 30.0f, 60.0f, 100.0f}) {
        clean(device);
        device.set_param(p::kDensity, density);
        device.set_param(p::kSpray, 0.2f);
        rng_state() = 0xABCDu;
        std::vector<float> input = source == 0 ? sine(330.0f, 6.0f, kRate, 0.4f) : noise(6.0f, kRate, 0.4f);
        reference = rms(input);
        Stereo out = run(device, input);
        const double level = rms(out.left, 96000);
        if (density < 10.0f) {
          sparse = level;
        } else {
          lowest = std::min(lowest, level);
          highest = std::max(highest, level);
        }
      }
      std::printf("grain-cloud: %s, density 15..100: %.1f to %.1f dB re input; density 3: %.1f dB\n",
                  source == 0 ? "tone" : "noise", db(lowest / reference), db(highest / reference),
                  db(sparse / reference));
      EXPECT(db(highest / lowest) < 3.0, "Density: RMS stays within 3 dB from 15 to 100 grains per second");
      EXPECT(std::fabs(db(highest / reference)) < 3.0 && std::fabs(db(lowest / reference)) < 3.0,
             "Density: an overlapping cloud plays at the level of its source");
      EXPECT(db(sparse / lowest) < -3.0, "Density: below overlap the grains separate and the level thins out");
    }
  }

  // Size is the length of each grain: in a sparse cloud of a held tone, the
  // bursts last half the grain (a Hann bell at half height).
  {
    for (float size : {40.0f, 160.0f, 640.0f}) {
      clean(device);
      device.set_param(p::kSize, size);
      device.set_param(p::kDensity, 0.7f);
      Stereo out = run(device, sine(1000.0f, 40.0f, kRate, 0.5f));
      std::vector<float> level = envelope(out.left, 96, 96000);  // 2 ms steps
      const float half = 0.5f * 0.5f * 0.7071f;                  // half the RMS of a full-height grain
      int above = 0, bursts = 0;
      for (size_t i = 1; i < level.size(); ++i) {
        if (level[i] > half) ++above;
        if (level[i] > half && level[i - 1] <= half) ++bursts;
      }
      const double burst_ms = bursts > 0 ? 2.0 * above / bursts : 0.0;
      EXPECT(bursts >= 15, "Size: a sparse cloud is a series of separate bursts");
      EXPECT_NEAR(burst_ms, size * 0.5, size * 0.1 + 2.0, "Size: each burst lasts half the grain size");
    }
  }

  // Spread pans grains apart; with Spray they also hold different audio.
  {
    double corr[3];
    for (int k = 0; k < 3; ++k) {
      clean(device);
      device.set_param(p::kSpread, k == 0 ? 0.0f : 1.0f);
      device.set_param(p::kSpray, k == 2 ? 0.5f : 0.0f);
      Stereo out = run(device, sine(330.0f, 8.0f, kRate, 0.4f));
      corr[k] = correlation(out.left, out.right, 96000);
    }
    std::printf("grain-cloud: L/R correlation centred %.3f, spread %.3f, spread and spray %.3f\n", corr[0], corr[1],
                corr[2]);
    EXPECT(corr[0] > 0.999, "Spread 0: a mono source stays mono");
    EXPECT(corr[1] < 0.6, "Spread 1 decorrelates left and right");
    EXPECT(corr[2] < 0.6, "Spread 1 with Spray decorrelates left and right");
  }

  // Position and Spray choose what the grains read: the buffer holds four
  // seconds of 300 Hz followed by four of 900 Hz, frozen.
  {
    auto frozen = [&](float position, float spray, double* low, double* high) {
      clean(device);
      device.set_param(p::kPosition, position);
      device.set_param(p::kSpray, spray);
      run(device, join(sine(300.0f, 4.0f, kRate, 0.4f), sine(900.0f, 4.0f, kRate, 0.4f)));
      device.set_param(p::kFreeze, 1.0f);
      render(device, 0.5f, kRate);
      Stereo out = render(device, 8.0f, kRate);
      *low = band_power(out.left, 300.0, 6.0, 0, out.size());
      *high = band_power(out.left, 900.0, 6.0, 0, out.size());
    };
    double low, high;
    frozen(0.1f, 0.0f, &low, &high);
    EXPECT(high > 1000.0 * low, "Position near 0 plays the newest audio");
    frozen(0.85f, 0.0f, &low, &high);
    EXPECT(low > 1000.0 * high, "Position near 1 plays the oldest audio");
    frozen(0.1f, 1.0f, &low, &high);
    EXPECT(low > 0.2 * high && high > 0.2 * low, "Spray reaches across the whole buffer from any Position");
  }

  // Scatter: nothing, then a few cents, then octaves and fifths.
  {
    double side[3], octave[3], fifth[3], centre[3];
    const float settings[3] = {0.0f, 0.45f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      clean(device);
      device.set_param(p::kSize, 500.0f);
      device.set_param(p::kScatter, settings[k]);
      Stereo out = run(device, sine(2000.0f, 12.0f, kRate, 0.4f));
      const size_t from = 96000, to = out.size();
      centre[k] = band_power(out.left, 2000.0, 3.0, from, to);
      side[k] = band_power(out.left, 2011.0, 3.0, from, to);  // 9.5 cents up
      octave[k] = band_power(out.left, 4000.0, 30.0, from, to) + band_power(out.left, 1000.0, 30.0, from, to);
      fifth[k] = band_power(out.left, 2996.6, 30.0, from, to) + band_power(out.left, 1498.3, 30.0, from, to);
    }
    EXPECT(side[0] < 0.01 * centre[0] && octave[0] < 1.0e-4 * centre[0], "Scatter 0: every grain is at pitch");
    EXPECT(side[1] > 0.1 * centre[1], "Scatter mid: grains are detuned by a few cents");
    EXPECT(octave[1] < 1.0e-3 * centre[1], "Scatter mid: no interval jumps yet");
    EXPECT(octave[2] > 0.1 * centre[2], "Scatter high: grains jump by octaves");
    EXPECT(fifth[2] > 0.05 * centre[2], "Scatter high: grains jump by fifths");
  }

  // Reverse plays grains backwards: a rising sweep falls inside each grain.
  {
    for (int reversed = 0; reversed < 2; ++reversed) {
      clean(device);
      device.set_param(p::kDensity, 0.7f);
      device.set_param(p::kReverse, static_cast<float>(reversed));
      std::vector<float> sweep(static_cast<size_t>(30.0f * kRate));
      double phase = 0.0;
      for (size_t i = 0; i < sweep.size(); ++i) {
        // 500 Hz to 2 kHz and back, every 6 s: about 500 Hz per second.
        const double t = std::fmod(static_cast<double>(i) / kRate, 6.0);
        const double hz = 500.0 + 500.0 * (t < 3.0 ? t : 6.0 - t);
        phase += hz / kRate;
        sweep[i] = 0.5f * static_cast<float>(std::sin(2.0 * kPi * phase));
      }
      Stereo out = run(device, sweep);
      // The source alternates between rising and falling; compare each burst
      // with the direction the source had where the burst came from.
      std::vector<float> level = envelope(out.left, 96);
      int agree = 0, total = 0;
      for (size_t i = 1000; i + 200 < level.size(); ++i) {
        if (!(level[i] > 0.05f && level[i - 1] <= 0.05f)) continue;
        const size_t start = i * 96;
        const double early = crossing_frequency(out.left, start + 960, start + 3360);
        const double late = crossing_frequency(out.left, start + 4320, start + 6720);
        // The grain read audio from about 0.25 s before it started.
        const double t = std::fmod((start - 12000.0) / kRate, 6.0);
        if (t < 0.5 || (t > 2.5 && t < 3.5) || t > 5.5) continue;  // near a turn of the sweep
        const bool source_rising = t < 3.0;
        const bool grain_rising = late > early;
        if (std::fabs(late - early) > 15.0) {
          ++total;
          if (grain_rising == source_rising) ++agree;
        }
      }
      EXPECT(total >= 8, "Reverse: enough separate grains to judge");
      if (reversed) {
        EXPECT(agree == 0, "Reverse 1: every grain plays backwards");
      } else {
        EXPECT(agree == total, "Reverse 0: every grain plays forwards");
      }
    }
  }

  // Texture: a hard window splatters, a soft one does not.
  {
    double bright[2], step[2];
    for (int hard = 0; hard < 2; ++hard) {
      clean(device);
      device.set_param(p::kSize, 30.0f);
      device.set_param(p::kDensity, 30.0f);
      device.set_param(p::kTexture, static_cast<float>(hard));
      Stereo out = run(device, sine(110.0f, 6.0f, kRate, 0.5f));
      bright[hard] = splatter(out.left, 48000);
      step[hard] = max_step(out.left, 48000);
    }
    std::printf("grain-cloud: energy above 1.5 kHz, soft %.1f dB, hard %.1f dB; max step soft %.4f, hard %.4f\n",
                10.0 * std::log10(bright[0] + 1.0e-20), 10.0 * std::log10(bright[1] + 1.0e-20), step[0], step[1]);
    EXPECT(bright[1] > 100.0 * bright[0], "Texture: hard windows are brighter");
    EXPECT(step[1] > 3.0 * step[0], "Texture: hard windows have steeper edges");
  }

  // Grains never click: a low tone through a soft cloud, with Freeze toggled
  // and every grain control moved while it sounds, stays as smooth as a tone
  // an octave and a fifth higher would be.
  {
    clean(device);
    device.set_param(p::kSpray, 0.3f);
    device.set_param(p::kReverse, 0.5f);
    device.set_param(p::kSpread, 0.7f);
    std::vector<float> tone = sine(80.0f, 0.5f, kRate, 0.5f);
    double worst = 0.0;
    for (int step = 0; step < 24; ++step) {
      device.set_param(p::kFreeze, static_cast<float>((step / 3) % 2));
      device.set_param(p::kPosition, (step % 5) * 0.2f);
      device.set_param(p::kSize, step % 2 ? 60.0f : 400.0f);
      device.set_param(p::kDensity, step % 3 ? 40.0f : 8.0f);
      Stereo out = run(device, tone);
      worst = std::max(worst, std::max(max_step(out.left), max_step(out.right)));
    }
    const double tone_step = 0.5 * 2.0 * kPi * 80.0 / kRate;
    std::printf("grain-cloud: max step %.4f (the 80 Hz tone alone: %.4f)\n", worst, tone_step);
    EXPECT(worst < 3.0 * tone_step, "soft grains, Freeze and parameter moves never click");
  }

  // Feedback writes the cloud back: it outlasts the input, and at maximum
  // with every grain an octave up it stays bounded.
  {
    double late[2];
    for (int fed = 0; fed < 2; ++fed) {
      clean(device);
      device.set_param(p::kFeedback, fed ? 0.8f : 0.0f);
      run(device, sine(330.0f, 2.0f, kRate, 0.4f));
      Stereo tail = render(device, 4.0f, kRate);
      late[fed] = rms(tail.left, 2 * 48000, 3 * 48000);
    }
    EXPECT(late[0] < 1.0e-6, "Feedback 0: the cloud ends with the audio it read");
    EXPECT(late[1] > 0.02, "Feedback: the cloud is recorded again and carries on");

    device.init(kRate);
    device.set_param(p::kFeedback, 0.95f);
    device.set_param(p::kPitch, 12.0f);
    device.set_param(p::kDensity, 100.0f);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0x5EEDu;
    Stereo loud = run(device, noise(6.0f, kRate, 0.9f));
    Stereo ringing = render(device, 20.0f, kRate);
    EXPECT(finite(loud.left) && finite(ringing.left), "maximum feedback stays finite");
    EXPECT(peak(loud.left) <= 2.0 && peak(loud.right) <= 2.0 && peak(ringing.left) <= 2.0,
           "maximum feedback stays under the limiter's ceiling");
  }

  // Mix 0 is the dry signal untouched.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i) worst = std::max(worst, std::fabs(out.left[i] - (double)tone[i]));
    EXPECT(worst < 1.0e-6, "Mix 0 passes the input through");
  }

  // A NaN, an infinity or an absurd sample in the input does not stay in
  // the device: the next sound is clean and the tail still ends in silence.
  {
    device.init(kRate);
    std::vector<float> bad = sine(330.0f, 0.5f, kRate, 0.5f);
    bad[1000] = std::nanf("");
    bad[2000] = 1.0e30f;
    bad[3000] = -HUGE_VALF;
    run(device, bad);
    Stereo next = run(device, sine(330.0f, 2.0f, kRate, 0.5f));
    Stereo tail = render(device, 20.0f, kRate);
    EXPECT(finite(next.left) && finite(next.right) && peak(next.left, 48000) < 2.5,
           "recovers from non-finite input samples");
    EXPECT(finite(tail.left) && peak(tail.left, tail.size() - 4800) == 0.0, "and still falls silent afterwards");
  }

  // The device sleeps once the buffer is empty, and wakes on new input.
  {
    device.init(kRate);
    run(device, noise(0.5f, kRate, 0.5f));
    render(device, 18.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    device.set_param(p::kMix, 1.0f);
    Stereo woken = run(device, sine(330.0f, 2.0f, kRate, 0.5f));
    EXPECT(rms(woken.left, 48000) > 0.05, "wakes on new input");
  }

  // Cost at the default patch, and with the pool full.
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("grain-cloud", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kDensity, 100.0f);
  device.set_param(p::kSize, 2000.0f);
  run(device, input);
  report_cost("grain-cloud (pool full)", 10.0f, kRate, [&] { run(device, input); });

  return finish("grain-cloud");
}
