// Native harness for Spectral Blur (cpp/devices/spectral-blur). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest asserts what makes it a
// spectral blur and freeze.

#include "../devices/spectral-blur/spectral_blur.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::SpectralBlur;
namespace p = livemix::spectral_blur;

static SpectralBlur device;

static const float kRate = 48000.0f;
static const size_t kLatency = SpectralBlur::kLatency;

// The transform alone: nothing held, phases kept, flat, wet only.
static void clean(SpectralBlur& d) {
  d.init(kRate);
  d.set_param(p::kBlur, 0.0f);
  d.set_param(p::kSmear, 0.0f);
  d.set_param(p::kFreeze, 0.0f);
  d.set_param(p::kTilt, 0.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kHighCut, 20000.0f);
  d.set_param(p::kShimmer, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

// Power within about ±`span` Hz of `hz`: the mean square of the component
// measured over consecutive windows 2 / span seconds long (a steady sine of
// amplitude A gives A²). Smeared partials are narrow bands of noise, not
// lines, so one long measurement would miss them.
static double band_power(const std::vector<float>& x, double hz, double span, size_t from, size_t to) {
  const size_t window = static_cast<size_t>(2.0 * kRate / span);
  to = std::min(to, x.size());
  double sum = 0.0;
  int count = 0;
  for (size_t at = from; at + window <= to; at += window) {
    const double level = tone_level(x, hz, kRate, at, at + window);
    sum += level * level;
    ++count;
  }
  return count > 0 ? sum / count : 0.0;
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

// RMS of (out delayed by the latency − gain × in), relative to gain × in, in dB.
static double error_db(const std::vector<float>& in, const std::vector<float>& out, double gain, size_t from) {
  double error = 0.0, reference = 0.0;
  for (size_t i = from; i + kLatency < out.size(); ++i) {
    const double want = gain * in[i];
    const double diff = out[i + kLatency] - want;
    error += diff * diff;
    reference += want * want;
  }
  return 10.0 * std::log10(error / reference + 1.0e-30);
}

// Spread of the levels in consecutive windows, in dB.
static double level_spread_db(const std::vector<float>& x, size_t window, size_t from = 0) {
  double lowest = 1.0e9, highest = 0.0;
  for (size_t at = from; at + window <= x.size(); at += window) {
    const double level = rms(x, at, at + window);
    lowest = std::min(lowest, level);
    highest = std::max(highest, level);
  }
  return db(highest / std::max(lowest, 1.0e-12));
}

int main() {
  Conformance spec;
  spec.name = "spectral-blur";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  rng_state() = 0x51DEu;
  std::vector<float> programme = noise(3.0f, kRate, 0.3f);
  {
    std::vector<float> a = sine(196.0f, 3.0f, kRate, 0.2f), b = sine(1234.5f, 3.0f, kRate, 0.2f);
    for (size_t i = 0; i < programme.size(); ++i) programme[i] += a[i] + b[i];
  }

  // Blur 0, Smear 0: analysis and resynthesis give the input back, late by
  // the reported latency.
  {
    clean(device);
    Stereo out = run(device, programme);
    const double left = error_db(programme, out.left, 1.0, 4096), right = error_db(programme, out.right, 1.0, 4096);
    std::printf("spectral-blur: reconstruction error %.1f dB left, %.1f dB right\n", left, right);
    EXPECT(left < -40.0 && right < -40.0, "Blur 0, Smear 0 reconstructs the input after the latency");
    EXPECT(peak(out.left, 0, kLatency - 1) < 1.0e-6, "nothing comes out before the latency");
  }

  // The dry path is delayed by the same latency: Mix 0 is the input, late,
  // and half way the two paths add up instead of combing.
  {
    clean(device);
    device.set_param(p::kMix, 0.0f);
    Stereo dry = run(device, programme);
    double worst = 0.0;
    for (size_t i = 0; i + kLatency < programme.size(); ++i) {
      worst = std::max(worst, std::fabs(dry.left[i + kLatency] - static_cast<double>(programme[i])));
    }
    EXPECT(worst < 1.0e-6, "Mix 0 is the input delayed by latencySamples");
    clean(device);
    device.set_param(p::kMix, 0.5f);
    Stereo half = run(device, programme);
    EXPECT(error_db(programme, half.left, std::sqrt(2.0), 4096) < -40.0, "Mix 0.5: dry and wet are in phase");
  }

  // Blur is a decay time per bin: RT60 = 20 s × Blur³.
  {
    for (int smeared = 0; smeared < 2; ++smeared) {
      for (float blur : {0.4f, 0.55f, 0.7f}) {
        clean(device);
        device.set_param(p::kBlur, blur);
        device.set_param(p::kSmear, static_cast<float>(smeared));
        rng_state() = 0xB1u;
        const double expected = 20.0 * blur * blur * blur;
        Stereo out = run(device, join(noise(0.3f, kRate, 0.5f), silence(static_cast<float>(expected) + 1.0f, kRate)));
        const double measured = rt60(out.left, kRate, 0.5, 0.1, -70.0);
        EXPECT_NEAR(measured, expected, expected * 0.1, "Blur sets the decay time of what hangs in the spectrum");
      }
    }
    clean(device);
    Stereo none = run(device, join(noise(0.3f, kRate, 0.5f), silence(1.0f, kRate)));
    EXPECT(rms(none.left, 24000, 48000) < 1.0e-6, "Blur 0: nothing hangs");
  }

  // What hangs keeps its frequency, not its bin's: 440 Hz sits between bins
  // 18 (421.9 Hz) and 19 (445.3 Hz).
  {
    clean(device);
    device.set_param(p::kBlur, 0.8f);
    Stereo out = run(device, join(sine(440.0f, 1.0f, kRate, 0.4f), silence(3.0f, kRate)));
    const size_t from = 72000, to = 168000;
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 380.0, 500.0, from, to), 440.0, 0.3,
                "a held partial stays at its own frequency");
    EXPECT(rms(out.left, from, from + 24000) > 0.1, "the held partial starts at the level of the tone");
    Stereo during = run(device, sine(440.0f, 2.0f, kRate, 0.4f));
    EXPECT_NEAR(tone_level(during.left, 440.0, kRate, 48000, 96000), 0.4, 0.02, "Blur leaves a steady tone as it is");
  }

  // Freeze, with Smear on: the tone is held at its frequency and level for
  // 30 s, new input is ignored, and nothing repeats at the frame rate.
  {
    clean(device);
    device.set_param(p::kSmear, 1.0f);
    run(device, sine(440.0f, 1.5f, kRate, 0.4f));
    device.set_param(p::kFreeze, 1.0f);
    run(device, sine(440.0f, 0.2f, kRate, 0.4f));
    Stereo held = render(device, 30.0f, kRate);
    const double level = rms(held.left);
    // One partial with fresh random phase every frame is a narrow band of
    // noise: its level is steady over seconds, not over milliseconds.
    std::printf("spectral-blur: frozen tone at %.1f dB re the source, 3 s windows within %.2f dB\n",
                db(level / (0.4 * 0.7071)), level_spread_db(held.left, 144000));
    EXPECT(std::fabs(db(level / (0.4 * 0.7071))) < 1.5, "Freeze: the held tone is at the source level");
    EXPECT(level_spread_db(held.left, 144000) < 1.5, "Freeze: steady level for 30 s");
    EXPECT(std::fabs(db(rms(held.left, 0, 480000) / rms(held.left, 960000, 1440000))) < 0.5,
           "Freeze: the last ten seconds are as loud as the first");
    EXPECT_NEAR(crossing_frequency(held.left, 0, held.size()), 440.0, 2.0, "Freeze: the tone stays at 440 Hz");
    // A frame replayed every hop would put lines at 440 ± 93.75 Hz as strong
    // as the tone. Random phase leaves only the window's skirt there.
    const double frame_rate = kRate / 512.0;
    const double centre = band_power(held.left, 440.0, 30.0, 0, 480000);
    const double line = band_power(held.left, 440.0 + frame_rate, 3.0, 0, 480000) +
                        band_power(held.left, 440.0 - frame_rate, 3.0, 0, 480000);
    const double beside = band_power(held.left, 440.0 + frame_rate * 0.85, 3.0, 0, 480000) +
                          band_power(held.left, 440.0 - frame_rate * 0.85, 3.0, 0, 480000);
    std::printf("spectral-blur: frame-rate sidebands %.1f dB re the tone, %.1f dB re their surroundings\n",
                10.0 * std::log10(line / centre), 10.0 * std::log10(line / beside));
    EXPECT(line < centre * 0.003, "Freeze: no sidebands at the frame rate");
    EXPECT(line < beside * 2.0, "Freeze: the spectrum has no line at the frame rate");

    Stereo deaf = run(device, sine(1500.0f, 2.0f, kRate, 0.5f));
    EXPECT(band_power(deaf.left, 1500.0, 30.0, 0, deaf.size()) < 1.0e-6, "Freeze: new input is ignored");
    EXPECT(std::fabs(db(rms(deaf.left) / level)) < 1.0, "Freeze: the drone carries on under new input");

    device.set_param(p::kFreeze, 0.0f);
    render(device, 1.0f, kRate);
    Stereo released = render(device, 0.5f, kRate);
    EXPECT(peak(released.left) == 0.0, "released with Blur 0: silence");
  }

  // Freeze without Smear still drifts: a chord is held at a steady level and
  // every partial stays where it was.
  {
    const float partials[6] = {220.0f, 277.2f, 329.6f, 440.0f, 554.4f, 880.0f};
    std::vector<float> chord(static_cast<size_t>(1.5f * kRate), 0.0f);
    for (float hz : partials) {
      std::vector<float> partial = sine(hz, 1.5f, kRate, 0.12f);
      for (size_t i = 0; i < chord.size(); ++i) chord[i] += partial[i];
    }
    clean(device);
    run(device, chord);
    device.set_param(p::kFreeze, 1.0f);
    Stereo held = render(device, 30.0f, kRate);
    std::printf("spectral-blur: frozen chord, Smear 0: %.1f dB re the source, 3 s windows within %.2f dB\n",
                db(rms(held.left) / rms(chord)), level_spread_db(held.left, 144000));
    EXPECT(std::fabs(db(rms(held.left) / rms(chord))) < 2.0, "Freeze, Smear 0: held at the source level");
    EXPECT(level_spread_db(held.left, 144000) < 3.0, "Freeze, Smear 0: steady level for 30 s");
    double weakest = 1.0e9;
    for (float hz : partials) weakest = std::min(weakest, band_power(held.left, hz, 10.0, 0, 480000));
    EXPECT(weakest > 0.5 * 0.12 * 0.12, "Freeze, Smear 0: every partial is held");
    // It moves: two stretches of the drone are not the same signal.
    double same = 0.0;
    for (size_t lag = 0; lag < 512; lag += 8) {
      std::vector<float> a(held.left.begin() + 48000, held.left.begin() + 96000);
      std::vector<float> b(held.left.begin() + 960000 + lag, held.left.begin() + 1008000 + lag);
      same = std::max(same, std::fabs(correlation(a, b)));
    }
    EXPECT(same < 0.8, "Freeze, Smear 0: the drone is alive, not a loop");
  }

  // Smear: an impulse comes back as a burst as long as a frame, at the same
  // energy; a steady sound keeps its level.
  {
    double energy[3], near[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      clean(device);
      device.set_param(p::kSmear, settings[k]);
      std::vector<float> click = silence(0.5f, kRate);
      click[4800] = 0.8f;
      Stereo out = run(device, click);
      const size_t at = 4800 + kLatency;
      energy[k] = 0.0;
      near[k] = 0.0;
      for (size_t i = 0; i < out.size(); ++i) {
        const double e = static_cast<double>(out.left[i]) * out.left[i];
        energy[k] += e;
        if (i + 8 >= at && i <= at + 8) near[k] += e;
      }
    }
    EXPECT(near[0] > 0.999 * energy[0], "Smear 0: an impulse stays an impulse");
    std::printf("spectral-blur: share of an impulse left in place at Smear 0, 0.5, 1: %.3f, %.3f, %.3f\n",
                near[0] / energy[0], near[1] / energy[1], near[2] / energy[2]);
    EXPECT(near[1] < 0.9 * energy[1] && near[1] > 0.3 * energy[1], "Smear 0.5: part of the impulse is spread out");
    EXPECT(near[2] < 0.03 * energy[2], "Smear 1: an impulse becomes a spread-out burst");
    EXPECT(std::fabs(10.0 * std::log10(energy[2] / energy[0])) < 1.5, "Smear keeps the energy of an impulse");

    double level[3];
    for (int k = 0; k < 3; ++k) {
      clean(device);
      device.set_param(p::kSmear, settings[k]);
      rng_state() = 0x77u;
      Stereo out = run(device, noise(4.0f, kRate, 0.3f));
      level[k] = rms(out.left, 48000);
    }
    std::printf("spectral-blur: noise level at Smear 0.5 %+.2f dB, at Smear 1 %+.2f dB\n", db(level[1] / level[0]),
                db(level[2] / level[0]));
    EXPECT(std::fabs(db(level[1] / level[0])) < 1.0 && std::fabs(db(level[2] / level[0])) < 1.0,
           "Smear keeps the level of a steady sound");
  }

  // Shimmer adds the octave: 880 Hz from 440 Hz, at the exact double.
  {
    double octave[2];
    for (int on = 0; on < 2; ++on) {
      clean(device);
      device.set_param(p::kShimmer, static_cast<float>(on));
      Stereo out = run(device, sine(440.0f, 2.0f, kRate, 0.4f));
      octave[on] = tone_level(out.left, 880.0, kRate, 48000, 96000);
      EXPECT_NEAR(tone_level(out.left, 440.0, kRate, 48000, 96000), 0.4, 0.02, "Shimmer leaves the source partial");
      if (on) {
        EXPECT_NEAR(dominant_frequency(out.left, kRate, 600.0, 1300.0, 48000, 96000), 880.0, 0.5,
                    "Shimmer: the copy is at exactly twice the frequency");
      }
    }
    EXPECT(octave[0] < 0.001, "Shimmer 0: nothing at the octave");
    EXPECT_NEAR(octave[1], 0.4, 0.08, "Shimmer 1: the octave is as strong as the source");
  }

  // Tilt is a slope in dB per octave around 1 kHz; the cuts remove bins.
  {
    std::vector<float> tones = sine(250.0f, 2.0f, kRate, 0.1f);
    for (float hz : {1000.0f, 4000.0f, 100.0f, 9000.0f}) {
      std::vector<float> more = sine(hz, 2.0f, kRate, 0.1f);
      for (size_t i = 0; i < tones.size(); ++i) tones[i] += more[i];
    }
    auto level_db = [&](const Stereo& out, double hz) {
      return db(tone_level(out.left, hz, kRate, 48000, 96000) / 0.1);
    };
    clean(device);
    device.set_param(p::kTilt, 6.0f);
    Stereo bright = run(device, tones);
    EXPECT_NEAR(level_db(bright, 250.0), -12.0, 0.5, "Tilt +6: two octaves under the pivot is 12 dB down");
    EXPECT_NEAR(level_db(bright, 1000.0), 0.0, 0.5, "Tilt: 1 kHz is the pivot");
    EXPECT_NEAR(level_db(bright, 4000.0), 12.0, 0.5, "Tilt +6: two octaves over the pivot is 12 dB up");
    clean(device);
    device.set_param(p::kTilt, -3.0f);
    Stereo dark = run(device, tones);
    EXPECT_NEAR(level_db(dark, 250.0), 6.0, 0.5, "Tilt -3: lows come up 3 dB per octave");
    EXPECT_NEAR(level_db(dark, 4000.0), -6.0, 0.5, "Tilt -3: highs go down 3 dB per octave");

    clean(device);
    device.set_param(p::kLowCut, 500.0f);
    device.set_param(p::kHighCut, 6000.0f);
    Stereo cut = run(device, tones);
    EXPECT(level_db(cut, 100.0) < -60.0 && level_db(cut, 250.0) < -60.0, "Low Cut removes what is under it");
    EXPECT(level_db(cut, 9000.0) < -60.0, "High Cut removes what is over it");
    EXPECT_NEAR(level_db(cut, 1000.0), 0.0, 0.3, "the cuts leave the band between them");
    EXPECT_NEAR(level_db(cut, 4000.0), 0.0, 0.3, "the cuts leave the band between them (4 kHz)");
  }

  // Width: the same random angles on both sides, or each side its own.
  {
    double corr[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      clean(device);
      device.set_param(p::kSmear, 1.0f);
      device.set_param(p::kWidth, settings[k]);
      rng_state() = 0x99u;
      Stereo out = run(device, noise(4.0f, kRate, 0.3f));
      corr[k] = correlation(out.left, out.right, 24000);
    }
    std::printf("spectral-blur: L/R correlation at Width 0, 0.5, 1: %.3f, %.3f, %.3f\n", corr[0], corr[1], corr[2]);
    EXPECT(corr[0] > 0.999, "Width 0: a mono input stays mono");
    EXPECT(corr[1] < 0.6 && corr[1] > 0.2, "Width 0.5: partly decorrelated");
    EXPECT(std::fabs(corr[2]) < 0.05, "Width 1: left and right are decorrelated");
    // Without Smear there is no random phase to differ in.
    clean(device);
    device.set_param(p::kWidth, 1.0f);
    Stereo plain = run(device, noise(2.0f, kRate, 0.3f));
    EXPECT(correlation(plain.left, plain.right, 24000) > 0.999, "Width needs Smear: clean sound stays as it was");
    // A frozen sound always drifts, so Width opens it up as well.
    clean(device);
    device.set_param(p::kWidth, 1.0f);
    run(device, noise(1.0f, kRate, 0.3f));
    device.set_param(p::kFreeze, 1.0f);
    render(device, 2.0f, kRate);
    Stereo frozen = render(device, 6.0f, kRate);
    EXPECT(std::fabs(correlation(frozen.left, frozen.right)) < 0.2, "Width: a frozen sound is wide");
  }

  // Everything that adds level at once, loud input: under the limiter's ceiling.
  {
    device.init(kRate);
    device.set_param(p::kBlur, 1.0f);
    device.set_param(p::kSmear, 1.0f);
    device.set_param(p::kTilt, 6.0f);
    device.set_param(p::kShimmer, 1.0f);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0xAAu;
    Stereo out = run(device, noise(6.0f, kRate, 0.9f));
    EXPECT(finite(out.left) && peak(out.left) <= 2.0 && peak(out.right) <= 2.0, "bounded with everything at maximum");
    // How much louder than its input the default patch gets on noise.
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0xABu;
    Stereo wet = run(device, noise(6.0f, kRate, 0.3f));
    std::printf("spectral-blur: default patch, wet only, noise in: %+.1f dB re the input\n",
                db(rms(wet.left, 96000) / (0.3 / std::sqrt(3.0))));
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
    Stereo tail = render(device, 14.0f, kRate);
    EXPECT(finite(next.left) && finite(next.right) && peak(next.left, 48000) < 2.5,
           "recovers from non-finite input samples");
    EXPECT(finite(tail.left) && peak(tail.left, tail.size() - 4800) == 0.0, "and still falls silent afterwards");
  }

  // The device sleeps after the tail, wakes on input, and a frozen sound
  // keeps it awake.
  {
    device.init(kRate);
    run(device, noise(0.5f, kRate, 0.5f));
    render(device, 12.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, sine(330.0f, 1.0f, kRate, 0.5f));
    EXPECT(rms(woken.left, 24000) > 0.1, "wakes on new input");
    device.set_param(p::kFreeze, 1.0f);
    render(device, 40.0f, kRate);
    Stereo still = render(device, 1.0f, kRate);
    EXPECT(rms(still.left) > 0.05, "a frozen sound never goes to sleep");
  }

  // Cost: the average, and the worst single block (the one with a transform).
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("spectral-blur", 10.0f, kRate, [&] { run(device, input); });
  {
    device.init(kRate);
    std::vector<double> micros;
    for (size_t done = 0; done + 128 <= input.size(); done += 128) {
      for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
      const auto start = std::chrono::steady_clock::now();
      device.process(128);
      micros.push_back(std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count());
    }
    std::sort(micros.begin(), micros.end());
    // Half the blocks hold a transform, so the 95th percentile is one of
    // them without the scheduler noise the maximum picks up.
    std::printf("spectral-blur worst block: %.0f us at the 95th percentile, %.0f us maximum, of %.0f us per block\n",
                micros[micros.size() * 95 / 100], micros.back(), 128.0e6 / kRate);
  }

  return finish("spectral-blur");
}
