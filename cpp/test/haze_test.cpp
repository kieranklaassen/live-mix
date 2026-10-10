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
    EXPECT(bright[1] > bright[0] * 1.5 && bright[2] > bright[1] * 1.3,
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

  // BEHAVIOUR CHECKS GO HERE

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("haze", 10.0f, kRate, [&] { run(device, input); });

  return finish("haze");
}
