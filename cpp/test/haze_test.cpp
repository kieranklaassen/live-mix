// Native harness for Haze (cpp/devices/haze). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a reverb into a fuzz into a reverb.

#include "../devices/haze/haze.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Haze;
namespace p = livemix::haze;

static Haze device;

static const float kRate = 48000.0f;

// The wall alone, with nothing fed back and no fold, so one stage can be
// measured at a time.
static void plain(Haze& d) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kFeed, 0.0f);
  d.set_param(p::kOctave, 0.0f);
}

// A chord of three sines, each at `gain`.
static std::vector<float> chord(float seconds, float gain, float a = 220.0f, float b = 277.18f,
                                float c = 329.63f) {
  std::vector<float> out = sine(a, seconds, kRate, gain);
  const std::vector<float> second = sine(b, seconds, kRate, gain);
  const std::vector<float> third = sine(c, seconds, kRate, gain);
  for (size_t i = 0; i < out.size(); ++i) out[i] += second[i] + third[i];
  return out;
}

// White noise through a one-pole low-pass at 800 Hz: a spectrum that falls
// as music's does, at an RMS near `gain`.
static std::vector<float> soft_noise(float seconds, float gain) {
  std::vector<float> x = noise(seconds, kRate, 1.0f);
  const double a = std::exp(-2.0 * kPi * 800.0 / kRate);
  double y = 0.0;
  for (float& v : x) {
    y = v + (y - v) * a;
    v = static_cast<float>(y * gain * 5.5);
  }
  return x;
}

int main() {
  Conformance spec;
  spec.name = "haze";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 24.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Mix 0 is the input, sample for sample.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0x51DEu;
    const std::vector<float> left = noise(1.0f, kRate, 0.7f);
    const std::vector<float> right = noise(1.0f, kRate, 0.7f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");
  }

  // Haze grows overtones and holds the level: a sine in, its third harmonic
  // rises with Haze over the whole of the knob while the RMS stays put.
  {
    double third[5], level[5];
    const float settings[5] = {0.0f, 0.25f, 0.5f, 0.75f, 1.0f};
    for (int k = 0; k < 5; ++k) {
      plain(device);
      device.set_param(p::kDecay, 0.5f);
      device.set_param(p::kBlur, 0.0f);
      device.set_param(p::kTone, 1.0f);
      device.set_param(p::kHaze, settings[k]);
      Stereo out = run(device, sine(220.0f, 5.0f, kRate, 0.25f));
      const size_t from = 3 * 48000, to = 5 * 48000;
      third[k] = db(tone_level(out.left, 660.0, kRate, from, to));
      level[k] = db(rms(out.left, from, to));
    }
    EXPECT(third[1] > third[0] + 8.0 && third[2] > third[1] + 8.0 && third[3] > third[2] + 2.0 &&
               third[4] > third[3],
           "a sine's third harmonic rises with Haze over the whole knob");
    EXPECT(third[0] < -50.0 && third[4] > -26.0, "Haze goes from nearly clean to a driven wave");
    double low = level[0], high = level[0];
    for (double v : level) {
      low = std::min(low, v);
      high = std::max(high, v);
    }
    std::printf("haze: sine in at %.1f dB, out %.1f to %.1f dB over Haze; third harmonic %.1f to %.1f dB\n",
                db(0.25 / std::sqrt(2.0)), low, high, third[0], third[4]);
    EXPECT(high - low < 1.5, "the level holds within 1.5 dB as Haze is turned");
    EXPECT(std::fabs(level[2] - db(0.25 / std::sqrt(2.0))) < 3.0, "a held sine leaves about as loud as it came");
  }

  // The top of Haze is not dead on ordinary material: a chord's
  // intermodulation (energy that is on none of its three notes) keeps rising.
  {
    double off[3], bright[3];
    const float settings[3] = {0.5f, 0.75f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      plain(device);
      device.set_param(p::kDecay, 0.5f);
      device.set_param(p::kTone, 1.0f);
      device.set_param(p::kHaze, settings[k]);
      Stereo out = run(device, chord(5.0f, 0.2f));
      const size_t from = 3 * 48000, to = 5 * 48000;
      // 2a - b, 2b - a, 2b - c and 2c - b: the third-order products nearest the chord.
      off[k] = tone_level(out.left, 2 * 220.0 - 277.18, kRate, from, to) +
               tone_level(out.left, 2 * 277.18 - 220.0, kRate, from, to) +
               tone_level(out.left, 2 * 277.18 - 329.63, kRate, from, to) +
               tone_level(out.left, 2 * 329.63 - 277.18, kRate, from, to);
      bright[k] = energy_above(out.left, 1500.0, kRate, from, to);
    }
    std::printf("haze: a chord's nearest products at Haze 0.5, 0.75, 1: %.1f, %.1f, %.1f dB; share above 1.5 kHz %.4f, %.4f, %.4f\n",
                db(off[0]), db(off[1]), db(off[2]), bright[0], bright[1], bright[2]);
    EXPECT(off[1] > off[0] * 1.25 && off[2] > off[1] * 1.1, "a chord's intermodulation grows to the top of Haze");
    EXPECT(bright[1] > bright[0] * 1.3 && bright[2] > bright[1] * 1.3,
           "a chord's overtones above 1.5 kHz grow to the top of Haze");
  }

  // An impulse gives a tail with the RT60 Decay says (nothing fed back, and
  // no first reverb to add its own).
  {
    double measured[3];
    const float settings[3] = {1.5f, 4.0f, 12.0f};
    for (int k = 0; k < 3; ++k) {
      plain(device);
      device.set_param(p::kBlur, 0.0f);
      device.set_param(p::kDecay, settings[k]);
      Stereo out = run(device, impulse(settings[k] * 1.1f + 1.0f, kRate, 0.9f));
      measured[k] = rt60(out.left, kRate, 0.3, 0.1, -100.0);
    }
    std::printf("haze: RT60 at Decay 1.5, 4 and 12 s: %.2f, %.2f, %.2f s\n", measured[0], measured[1], measured[2]);
    for (int k = 0; k < 3; ++k) {
      EXPECT(measured[k] > settings[k] * 0.85 && measured[k] < settings[k] * 1.1, "the tail's RT60 is what Decay says");
    }
  }

  // The first reverb rings no longer than the wall: at the shortest Decay,
  // full Blur does not leave a tail of its own.
  {
    plain(device);
    device.set_param(p::kBlur, 1.0f);
    device.set_param(p::kDecay, 0.5f);
    Stereo out = run(device, impulse(3.0f, kRate, 0.9f));
    const double measured = rt60(out.left, kRate, 0.3, 0.05, -100.0);
    std::printf("haze: RT60 at Decay 0.5 s and full Blur: %.2f s\n", measured);
    EXPECT(measured < 1.3, "full Blur does not leave a long tail of its own under a short Decay");
  }

  // The blur comes before the fuzz: a train of clicks leaves no burst. The
  // loudest sample of the wall is compared with the wall's own level, with
  // Blur at nothing and at full.
  {
    double crest[2], top[2];
    for (int k = 0; k < 2; ++k) {
      plain(device);
      device.set_param(p::kHaze, 1.0f);
      device.set_param(p::kDecay, 1.0f);
      device.set_param(p::kBlur, k == 0 ? 0.0f : 1.0f);
      std::vector<float> clicks(static_cast<size_t>(kRate * 6.0f), 0.0f);
      for (size_t i = 0; i < clicks.size(); i += 12000) clicks[i] = 0.9f;
      Stereo out = run(device, clicks);
      const size_t from = 2 * 48000, to = 6 * 48000;
      top[k] = peak(out.left, from, to);
      crest[k] = top[k] / rms(out.left, from, to);
    }
    std::printf("haze: clicks at 0.9, wall peak %.3f (crest %.1f) at Blur 0 and %.3f (crest %.1f) at Blur 1\n", top[0],
                crest[0], top[1], crest[1]);
    EXPECT(top[0] < 0.05 && top[1] < 0.05, "a click never leaves the fuzz as a burst");
    EXPECT(crest[1] < crest[0] * 0.6 && crest[1] < 5.0, "with Blur up the clicks are gone into the wall's own level");
  }

  // Octave adds the octave above: energy at twice a sine's frequency.
  {
    double second[3];
    const float settings[3] = {0.0f, 0.3f, 1.0f};
    double first_at_full = 0.0;
    for (int k = 0; k < 3; ++k) {
      plain(device);
      device.set_param(p::kBlur, 0.0f);
      device.set_param(p::kDecay, 0.5f);
      device.set_param(p::kTone, 1.0f);
      device.set_param(p::kOctave, settings[k]);
      Stereo out = run(device, sine(220.0f, 5.0f, kRate, 0.25f));
      second[k] = db(tone_level(out.left, 440.0, kRate, 3 * 48000, 5 * 48000));
      first_at_full = db(tone_level(out.left, 220.0, kRate, 3 * 48000, 5 * 48000));
    }
    std::printf("haze: 440 Hz from a 220 Hz sine at Octave 0, 0.3, 1: %.1f, %.1f, %.1f dB (220 Hz at Octave 1: %.1f dB)\n",
                second[0], second[1], second[2], first_at_full);
    EXPECT(second[0] < -100.0, "without Octave a sine has no second harmonic");
    EXPECT(second[1] > -40.0 && second[2] > second[1] + 6.0, "Octave adds energy at twice the frequency");
    EXPECT(second[2] > first_at_full + 6.0, "at full Octave the octave is louder than the note");
  }

  // Tone tilts the wall from dark to bright over the whole knob.
  {
    double bright[3], level[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      plain(device);
      device.set_param(p::kDecay, 1.0f);
      device.set_param(p::kTone, settings[k]);
      rng_state() = 0x70E5u;
      Stereo out = run(device, soft_noise(6.0f, 0.2f));
      bright[k] = energy_above(out.left, 2000.0, kRate, 2 * 48000, 6 * 48000);
      level[k] = db(rms(out.left, 2 * 48000, 6 * 48000));
    }
    std::printf("haze: share of the wall above 2 kHz at Tone 0, 0.5, 1: %.4f, %.4f, %.4f; level %.1f, %.1f, %.1f dB\n",
                bright[0], bright[1], bright[2], level[0], level[1], level[2]);
    EXPECT(bright[1] > bright[0] * 2.5 && bright[2] > bright[1] * 1.7, "Tone goes from dark to bright");
    EXPECT(std::fabs(level[0] - level[1]) < 3.0 && std::fabs(level[2] - level[1]) < 3.0,
           "Tone is not a volume knob (within 3 dB)");
  }

  // Size is the second space: the wall's lines answer later in a larger one.
  // After an impulse, the stretch from 40 to 58 ms holds three lines' first
  // returns at Size 0 and only the tail of the input allpasses at Size 1.
  {
    double early[2];
    for (int k = 0; k < 2; ++k) {
      plain(device);
      device.set_param(p::kBlur, 0.0f);
      device.set_param(p::kHaze, 0.0f);
      device.set_param(p::kDecay, 2.0f);
      device.set_param(p::kSize, k == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, impulse(0.5f, kRate, 0.9f));
      early[k] = rms(out.left, 1920, 2784);
    }
    std::printf("haze: the wall 40 to 58 ms after an impulse, Size 0 against Size 1: %.1f dB\n", db(early[0] / early[1]));
    EXPECT(early[0] > early[1] * 4.0, "a small Size answers sooner than a large one");
  }

  // Width: the wall is mono at 0 and wide at 1, and as loud either way.
  {
    double together[2], level[2];
    for (int k = 0; k < 2; ++k) {
      plain(device);
      device.set_param(p::kDecay, 2.0f);
      device.set_param(p::kWidth, k == 0 ? 0.0f : 1.0f);
      rng_state() = 0x3117u;
      Stereo out = run(device, soft_noise(8.0f, 0.2f));
      together[k] = correlation(out.left, out.right, 2 * 48000, 8 * 48000);
      level[k] = db(rms(out.left, 2 * 48000, 8 * 48000));
    }
    std::printf("haze: left against right %.3f at Width 0 and %.3f at Width 1; level %.1f and %.1f dB\n", together[0],
                together[1], level[0], level[1]);
    EXPECT(together[0] > 0.999, "Width 0 is a mono wall");
    EXPECT(together[1] < 0.5, "Width 1 is a wide wall from a mono source");
    EXPECT(std::fabs(level[0] - level[1]) < 1.5, "the wall is as loud narrow as wide");
  }

  // The wet path keeps the two sides apart: a sound that is out of phase
  // between left and right does not vanish, at any Width.
  {
    for (float width : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kDecay, 2.0f);
      device.set_param(p::kWidth, width);
      rng_state() = 0x3117u;
      const std::vector<float> left = soft_noise(6.0f, 0.2f);
      Stereo same = run(device, left, left);
      plain(device);
      device.set_param(p::kDecay, 2.0f);
      device.set_param(p::kWidth, width);
      std::vector<float> right = left;
      for (float& v : right) v = -v;
      Stereo opposed = run(device, left, right);
      const double ratio = db(rms(opposed.left, 2 * 48000, 6 * 48000) / rms(same.left, 2 * 48000, 6 * 48000));
      std::printf("haze: an out-of-phase source against an in-phase one at Width %.0f: %+.1f dB\n", width, ratio);
      EXPECT(std::fabs(ratio) < 3.0, "an out-of-phase source does not vanish in the wall");
    }
  }

  // Aliasing: what a hard-driven 1.1 kHz sine folds back lands on none of
  // its own harmonics: from above four times the sample rate at
  // 192 - 1.1 n kHz (1.7, 3.9, 6.1 kHz and so on), and from between one and
  // two times the rate at 48 - 1.1 n kHz (18.3, 16.1 kHz and so on down to
  // 0.7 kHz). The first of those, 20.5 kHz from the 25th harmonic, lies in
  // the downsampler's transition band and is measured apart.
  {
    for (float octave : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kBlur, 0.0f);
      device.set_param(p::kDecay, 0.5f);
      device.set_param(p::kTone, 1.0f);
      device.set_param(p::kHaze, 1.0f);
      device.set_param(p::kOctave, octave);
      Stereo out = run(device, sine(1100.0f, 5.0f, kRate, 0.5f));
      const size_t from = 2 * 48000, to = 5 * 48000;
      const double note = std::max(tone_level(out.left, 1100.0, kRate, from, to),
                                   tone_level(out.left, 2200.0, kRate, from, to));
      double folded = 0.0;
      for (double hz : {1700.0, 3900.0, 6100.0, 8300.0, 10500.0, 12700.0, 18300.0, 16100.0, 13900.0, 11700.0,
                        9500.0, 7300.0, 5100.0, 2900.0, 700.0}) {
        folded = std::max(folded, tone_level(out.left, hz, kRate, from, to));
      }
      const double edge = tone_level(out.left, 20500.0, kRate, from, to);
      std::printf("haze: aliasing of a 1.1 kHz sine at full Haze, Octave %.0f: %.1f dB under the note (%.1f dB at 20.5 kHz)\n",
                  octave, -db(folded / note), -db(edge / note));
      EXPECT(folded < note * 0.0001, "what folds back under 19 kHz is 80 dB under the note");
      EXPECT(edge < note * 0.003, "what folds back at 20.5 kHz is 50 dB under the note");
    }
  }

  // Bad input is survived: NaN, infinities and 1e30 for a tenth of a second,
  // then a tone. The output is finite again and is the tone's own wall.
  {
    const float bad_values[5] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f};
    std::vector<float> bad(4800);
    for (size_t i = 0; i < bad.size(); ++i) bad[i] = bad_values[i % 5];
    device.init(kRate);
    device.set_param(p::kDecay, 1.0f);
    device.set_param(p::kFeed, 1.0f);
    run(device, bad);
    Stereo after = run(device, sine(330.0f, 8.0f, kRate, 0.25f));
    device.init(kRate);
    device.set_param(p::kDecay, 1.0f);
    device.set_param(p::kFeed, 1.0f);
    run(device, silence(0.1f, kRate));
    Stereo clean = run(device, sine(330.0f, 8.0f, kRate, 0.25f));
    EXPECT(finite(after.left) && finite(after.right), "the output is finite once good input returns");
    const double ratio = db(rms(after.left, 7 * 48000, 8 * 48000) / rms(clean.left, 7 * 48000, 8 * 48000));
    std::printf("haze: seven seconds after bad input the output is %+.2f dB from a clean run's, peak %.2f\n", ratio,
                peak(after.left));
    EXPECT(std::fabs(ratio) < 1.0, "the device is not stuck after bad input");
    EXPECT(peak(after.left) < 4.0, "bad input does not leave a burst");
  }

  // Block size and sleep: a burst, a silence long enough to fall asleep in,
  // every knob moved while asleep, then sound again. Blocks of 1, 128 and
  // 2048 give the same output (the sweeps and the shift run by a count of
  // samples), and the sleep is exact zeros.
  {
    const auto sequence = [&](int block) {
      device.init(kRate);
      device.set_param(p::kDecay, 0.5f);
      rng_state() = 0x51EE9u;
      Stereo out = run(device, noise(0.3f, kRate, 0.5f), block);
      out = concat(out, render(device, 8.0f, kRate, block));
      device.set_param(p::kHaze, 0.9f);
      device.set_param(p::kBlur, 0.2f);
      device.set_param(p::kDecay, 3.0f);
      device.set_param(p::kSize, 0.15f);
      device.set_param(p::kTone, 0.8f);
      device.set_param(p::kOctave, 0.6f);
      device.set_param(p::kFeed, 0.8f);
      device.set_param(p::kWidth, 0.3f);
      device.set_param(p::kMix, 0.8f);
      // 0.37 s into the silence's last block at 2048: the wake is not on a control tick.
      return concat(out, run(device, soft_noise(2.0f, 0.2f), block));
    };
    const Stereo a = sequence(128);
    const Stereo b = sequence(1);
    const Stereo c = sequence(2048);
    double worst = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - c.right[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - c.left[i]));
    }
    std::printf("haze: blocks of 1, 128 and 2048 across a sleep differ by at most %.2g\n", worst);
    EXPECT(worst < 1.0e-4, "the output is the same at every block size across a sleep");
    EXPECT(peak(a.left, 7 * 48000, 8 * 48000) == 0.0, "the device was asleep before the knobs moved");
  }

  // Knobs moved while asleep snap on wake. Mix to 0 while asleep: the first
  // sample out is the first sample in. Size and Haze moved while asleep: the
  // output is that of a device that had them there all along.
  {
    device.init(kRate);
    device.set_param(p::kDecay, 0.5f);
    run(device, noise(0.3f, kRate, 0.5f));
    render(device, 8.0f, kRate);
    device.set_param(p::kMix, 0.0f);
    const std::vector<float> tone = sine(440.0f, 0.2f, kRate, 0.5f);
    Stereo out = run(device, tone);
    EXPECT(out.left == tone, "Mix moved to 0 while asleep is 0 from the first sample");

    const auto wake = [&](bool before) {
      device.init(kRate);
      device.set_param(p::kDecay, 0.5f);
      device.set_param(p::kMix, 1.0f);
      if (before) device.set_param(p::kSize, 0.1f);
      if (before) device.set_param(p::kHaze, 1.0f);
      rng_state() = 0x51EE9u;
      run(device, noise(0.3f, kRate, 0.5f));
      render(device, 8.0f, kRate);
      if (!before) device.set_param(p::kSize, 0.1f);
      if (!before) device.set_param(p::kHaze, 1.0f);
      return run(device, sine(330.0f, 0.5f, kRate, 0.3f));
    };
    const Stereo moved = wake(false);
    const Stereo there = wake(true);
    double worst = 0.0;
    for (size_t i = 0; i < moved.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(moved.left[i]) - there.left[i]));
    }
    std::printf("haze: Size and Haze moved while asleep, against a device that had them there: %.2g\n", worst);
    EXPECT(worst < 1.0e-3, "Size and Haze moved while asleep snap, they do not glide");
  }

  // No clicks: each control is stepped across its range while a chord
  // sounds, and the largest sample-to-sample jump is held against runs with
  // no event in them at the setting before and the setting after.
  {
    struct Move {
      const char* name;
      int id;
      float from, to;
    };
    const Move moves[] = {{"Haze", p::kHaze, 0.1f, 1.0f},   {"Blur", p::kBlur, 0.0f, 1.0f},
                          {"Mix", p::kMix, 0.2f, 1.0f},     {"Octave", p::kOctave, 0.0f, 1.0f},
                          {"Tone", p::kTone, 0.1f, 0.9f},   {"Width", p::kWidth, 1.0f, 0.0f},
                          {"Feed", p::kFeed, 0.0f, 1.0f},   {"Decay", p::kDecay, 1.0f, 20.0f},
                          {"Size", p::kSize, 0.2f, 0.9f}};
    const std::vector<float> input = chord(3.0f, 0.2f);
    const std::vector<float> first(input.begin(), input.begin() + 72000);
    const std::vector<float> second(input.begin() + 72000, input.end());
    for (const Move& move : moves) {
      const auto steady = [&](float value) {
        device.init(kRate);
        device.set_param(move.id, value);
        return max_step(run(device, input).left, 48000, 144000);
      };
      const double reference = std::max(steady(move.from), steady(move.to));
      device.init(kRate);
      device.set_param(move.id, move.from);
      run(device, first);
      device.set_param(move.id, move.to);
      const double moved = max_step(run(device, second).left);
      char label[96];
      std::snprintf(label, sizeof label, "%s moved while sounding does not click (%.4f against %.4f)", move.name,
                    moved, reference);
      EXPECT(moved < reference * 1.5, label);
    }
  }

  // Feed is bounded and never grows: a full-scale chord held for a minute
  // at the top of Feed, Haze and Decay.
  {
    device.init(kRate);
    device.set_param(p::kFeed, 1.0f);
    device.set_param(p::kHaze, 1.0f);
    device.set_param(p::kDecay, 30.0f);
    device.set_param(p::kMix, 1.0f);
    Stereo out = run(device, chord(60.0f, 0.333f));
    const double early = rms(out.left, 20 * 48000, 30 * 48000);
    const double late = rms(out.left, 50 * 48000, 60 * 48000);
    std::printf("haze: full-scale chord, Feed, Haze and Decay at the top: peak %.2f, %.1f dB at 20 to 30 s, %.1f dB at 50 to 60 s\n",
                std::max(peak(out.left), peak(out.right)), db(early), db(late));
    EXPECT(finite(out.left) && peak(out.left) < 2.0 && peak(out.right) < 2.0, "Feed at its top stays under 6 dB over full scale");
    EXPECT(late < early * 1.2, "Feed at its top does not grow over a minute");
  }

  // Feed makes the tail longer, never endless, and never a howl: after a
  // burst the wall falls away at every Feed, at the top it is still a band
  // of sound and not one tone, and in the end the device sleeps.
  {
    double times[3], tonal[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      plain(device);
      device.set_param(p::kDecay, 2.0f);
      device.set_param(p::kFeed, settings[k]);
      rng_state() = 0xFEEDu;
      std::vector<float> burst = soft_noise(0.5f, 0.3f);
      burst.resize(static_cast<size_t>(kRate * 45.0f), 0.0f);
      Stereo out = run(device, burst);
      times[k] = rt60(out.left, kRate, 1.0, 0.25, -110.0);
      // Where the tail has fallen about 40 dB: one second of it.
      const size_t from = static_cast<size_t>((0.5 + times[k] * 0.66) * kRate), to = from + 48000;
      const double hz = dominant_frequency(out.left, kRate, 80.0, 4000.0, from, to);
      tonal[k] = tone_level(out.left, hz, kRate, from, to) / (rms(out.left, from, to) * std::sqrt(2.0));
      if (k == 2) {
        EXPECT(peak(out.left, 44 * 48000, 45 * 48000) == 0.0, "at the top of Feed the device still comes to rest");
      }
    }
    std::printf("haze: RT60 at Decay 2 s with Feed 0, 0.5, 1: %.2f, %.2f, %.2f s\n", times[0], times[1], times[2]);
    EXPECT(times[1] > times[0] * 1.1 && times[2] > times[1] * 1.5, "Feed makes the tail longer over the whole knob");
    EXPECT(times[2] < times[0] * 4.5, "Feed at its top is still a tail that ends");
    // A howl is one tone and nothing else (measured without the shift: 0.9
    // and more). Any reverb's late tail leans on its few slowest resonances;
    // Feed must not make it lean much further.
    std::printf("haze: the loudest tone's share of the late tail with Feed 0, 0.5, 1: %.2f, %.2f, %.2f\n", tonal[0],
                tonal[1], tonal[2]);
    EXPECT(tonal[2] < 0.45, "the tail at the top of Feed is not one tone");
  }

  // Level: a full-scale chord held for a minute at the default and at each
  // end of every control. The peak stays under 6 dB over full scale, the
  // last ten seconds are no louder than ten seconds from the first half, and
  // the wall alone is within a few dB of what was played into it.
  {
    const std::vector<float> held = chord(60.0f, 0.333f);
    const double in_level = db(rms(held));
    double hottest = 0.0, loudest = -200.0, quietest = 200.0, most_growth = -200.0;
    for (int id = -1; id < p::kNumParams; ++id) {
      for (int end = 0; end < (id < 0 ? 1 : 2); ++end) {
        device.init(kRate);
        if (id >= 0) device.set_param(id, end == 0 ? p::kParamMin[id] : p::kParamMax[id]);
        Stereo out = run(device, held);
        const double top = std::max(peak(out.left), peak(out.right));
        const double early = db(rms(out.left, 20 * 48000, 30 * 48000));
        const double late = db(rms(out.left, 50 * 48000, 60 * 48000));
        hottest = std::max(hottest, top);
        most_growth = std::max(most_growth, late - early);
        if (!(id == p::kMix && end == 0)) {
          loudest = std::max(loudest, late - in_level);
          quietest = std::min(quietest, late - in_level);
        }
        char label[120];
        std::snprintf(label, sizeof label, "held chord, param %d at its %s: peak %.2f, %+.1f dB against the input, %+.1f dB over 30 s",
                      id, end == 0 ? "minimum" : "maximum", top, late - in_level, late - early);
        EXPECT(finite(out.left) && top < 2.0 && late - early < 1.5 && late - in_level < 4.0 && late - in_level > -6.0, label);
      }
    }
    std::printf("haze: full-scale chord for a minute over every control's ends: peak at most %.2f, level %+.1f to %+.1f dB against the input, growth at most %+.1f dB\n",
                hottest, quietest, loudest, most_growth);
  }

  // Part-way Mix: held tones over the piano's range through the default.
  // The wall is a reverb, so a tone's own wall may stand against the dry tone
  // at some pitch; the dry share alone is 2.4 dB under the input at the
  // default Mix, and no tone may fall far under that.
  {
    double worst = 0.0, sum = 0.0;
    float worst_hz = 0.0f;
    int count = 0;
    for (float note = 21.0f; note <= 108.0f; note += 3.0f) {
      const float hz = 440.0f * std::pow(2.0f, (note - 69.0f) / 12.0f);
      device.init(kRate);
      const std::vector<float> tone = sine(hz, 4.0f, kRate, 0.25f);
      Stereo out = run(device, tone);
      const double change = db(rms(out.left, 2 * 48000, 4 * 48000) / rms(tone, 2 * 48000, 4 * 48000));
      sum += change;
      ++count;
      if (change < worst) {
        worst = change;
        worst_hz = hz;
      }
    }
    std::printf("haze: held tones A0 to C8 at the default: %+.1f dB on average, the worst %+.1f dB at %.0f Hz\n",
                sum / count, worst, worst_hz);
    EXPECT(worst > -6.0, "no held tone drops more than 6 dB at the default Mix");
    EXPECT(sum / count > -3.0 && sum / count < 3.0, "held tones leave the default about as loud as they came");
  }

  // The meters are the device's own numbers: the push is the drive times the
  // level's share of level + floor (0.25 x 24^Haze and 0.01 in haze.h), the
  // wall is the peak that left, and both rest at 0 asleep.
  {
    device.init(kRate);
    EXPECT(device.meter(0) == 0.0f && device.meter(1) == 0.0f, "the meters rest at 0 before any sound");
    for (float haze : {0.2f, 0.9f}) {
      plain(device);
      device.set_param(p::kBlur, 0.0f);
      device.set_param(p::kHaze, haze);
      Stereo out = run(device, sine(220.0f, 2.0f, kRate, 0.25f));
      const double level = 0.25 * 0.999;  // a 220 Hz sine after the 5 kHz low-pass
      const double expected = 0.25 * std::pow(24.0, haze) * level / (level + 0.01);
      EXPECT_NEAR(device.meter(0), expected, expected * 0.05, "the push meter is drive x level / (level + floor)");
      const double left = peak(out.left, 96000 - 4800, 96000), right = peak(out.right, 96000 - 4800, 96000);
      EXPECT(device.meter(1) <= std::max(left, right) * 1.001 && device.meter(1) > std::max(left, right) * 0.5,
             "the wall meter is the peak that just left");
    }
    device.set_param(p::kDecay, 0.5f);
    render(device, 12.0f, kRate);
    EXPECT(device.meter(0) == 0.0f && device.meter(1) == 0.0f, "the meters rest at 0 asleep");
  }

  // The device comes to rest after every control move: a burst, each knob to
  // its top and its foot while the tail rings, and then exact silence.
  {
    for (int id = 0; id < p::kNumParams; ++id) {
      device.init(kRate);
      device.set_param(p::kDecay, 1.0f);
      rng_state() = 0xA51EE9u;
      run(device, noise(0.5f, kRate, 0.5f));
      device.set_param(id, p::kParamMax[id]);
      render(device, 1.0f, kRate);
      device.set_param(id, p::kParamMin[id]);
      render(device, 1.0f, kRate);
      device.set_param(id, id == p::kDecay ? 1.0f : p::kParamDefault[id]);
      render(device, 25.0f, kRate);
      Stereo rest = render(device, 1.0f, kRate);
      char label[80];
      std::snprintf(label, sizeof label, "asleep after param %d was moved in the tail (peak %g)", id, peak(rest.left));
      EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, label);
    }
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("haze", 10.0f, kRate, [&] { run(device, input); });

  return finish("haze");
}
