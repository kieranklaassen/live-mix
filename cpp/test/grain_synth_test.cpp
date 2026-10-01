// Native harness for Grain (cpp/devices/grain-synth). The conformance pass
// runs on the built-in sound; the rest loads sines, sweeps and noise through
// the three sample entry points and asserts what makes it a granular synth.

#include "../devices/grain-synth/grain_synth.h"
#include "support/test_kit.h"

#include <cstdlib>

using namespace testkit;
using livemix::GrainSynth;
namespace p = livemix::grain_synth;

static GrainSynth device;

static const float kRate = 48000.0f;
static const float kMiddleC = 261.6256f;

// Hand the device a sound the way the host does.
static void load(GrainSynth& d, const std::vector<float>& left, const std::vector<float>& right,
                 float rate) {
  const int capacity = d.sample_capacity();
  const int frames = std::min(static_cast<int>(left.size()), capacity);
  float* buffer = d.sample_buffer();
  for (int i = 0; i < frames; ++i) {
    buffer[i] = left[i];
    buffer[capacity + i] = right.empty() ? 0.0f : right[i];
  }
  d.sample_commit(frames, right.empty() ? 1 : 2, rate);
}
static void load(GrainSynth& d, const std::vector<float>& mono, float rate) {
  load(d, mono, std::vector<float>(), rate);
}

// A plain, steady cloud: no randomness, fast envelope, open filter.
static void plain(GrainSynth& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kPosition, 0.0f);
  d.set_param(p::kScan, 0.0f);
  d.set_param(p::kSize, 100.0f);
  d.set_param(p::kDensity, 4.0f);
  d.set_param(p::kSpray, 0.0f);
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kOctaves, 0.0f);
  d.set_param(p::kShape, 0.0f);
  d.set_param(p::kReverse, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kTone, 18000.0f);
  d.set_param(p::kVolume, 0.0f);
}

// A linear sweep from `from` to `to` Hz over `seconds`.
static std::vector<float> sweep(float from, float to, float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  double phase = 0.0;
  for (size_t i = 0; i < out.size(); ++i) {
    const double hz = from + (to - from) * static_cast<double>(i) / static_cast<double>(out.size());
    out[i] = gain * static_cast<float>(std::sin(phase));
    phase += 2.0 * kPi * hz / rate;
  }
  return out;
}

// A cloud of grains with random phases has no single spectral line: its
// energy sits in a band as wide as one grain's spectrum. So pitch is the
// power-weighted mean frequency in [lo, hi] and level is the RMS in a band.
static double centroid(const std::vector<float>& x, double rate, double lo, double hi, size_t from = 0,
                       size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  const double step = 0.5 * rate / static_cast<double>(to - from);
  double weighted = 0.0, total = 0.0;
  for (double hz = lo; hz <= hi; hz += step) {
    const double level = tone_level(x, hz, rate, from, to);
    weighted += hz * level * level;
    total += level * level;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// Energy between lo and hi Hz by Goertzel bins (sharp edges, unlike band_rms).
static double band_energy(const std::vector<float>& x, double rate, double lo, double hi, size_t from = 0,
                          size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  const double step = 0.5 * rate / static_cast<double>(to - from);
  double total = 0.0;
  for (double hz = lo; hz <= hi; hz += step) {
    const double level = tone_level(x, hz, rate, from, to);
    total += level * level;
  }
  return total;
}

// RMS of `x` through a two-pole band-pass at `hz` (unity gain at the centre).
static double band_rms(const std::vector<float>& x, double rate, double hz, double q, size_t from = 0,
                       size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  const double w = 2.0 * kPi * hz / rate;
  const double alpha = std::sin(w) / (2.0 * q);
  const double b0 = alpha / (1.0 + alpha), a1 = -2.0 * std::cos(w) / (1.0 + alpha),
               a2 = (1.0 - alpha) / (1.0 + alpha);
  double x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0, sum = 0.0;
  for (size_t i = 0; i < to; ++i) {
    const double y = b0 * (x[i] - x2) - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = y;
    if (i >= from) sum += y * y;
  }
  return to > from ? std::sqrt(sum / static_cast<double>(to - from)) : 0.0;
}

int main() {
  Conformance spec;
  spec.name = "grain-synth";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  const bool verbose = std::getenv("GRAIN_VERBOSE") != nullptr;

  // The built-in sound: tuned to middle C, at a sane level, evolving with
  // Position, and loopable.
  {
    plain(device);
    device.set_param(p::kSize, 400.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo dark = render(device, 2.0f, kRate);
    EXPECT_NEAR(centroid(dark.left, kRate, 220.0, 310.0, 24000), 261.63, 1.0,
                "the built-in sound plays middle C at middle C");
    plain(device);
    device.set_param(p::kSize, 400.0f);
    device.set_param(p::kPosition, 0.5f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo bright = render(device, 2.0f, kRate);
    // The eighth partial against the fundamental.
    const double dark_share = band_rms(dark.left, kRate, 8.0 * 261.63, 12.0, 24000) / band_rms(dark.left, kRate, 261.63, 12.0, 24000);
    const double bright_share =
        band_rms(bright.left, kRate, 8.0 * 261.63, 12.0, 24000) / band_rms(bright.left, kRate, 261.63, 12.0, 24000);
    if (verbose) std::printf("built-in: 8th partial dark %.4f bright %.4f\n", dark_share, bright_share);
    EXPECT(bright_share > 0.2 && bright_share > 8.0 * dark_share,
           "Position moves through the built-in sound's brightening");
    if (verbose) {
      std::vector<float> stored(device.sample_buffer(), device.sample_buffer() + 127938);
      std::printf("built-in store: rms %.3f peak %.3f\n", rms(stored), peak(stored));
    }

    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo note = render(device, 3.0f, kRate);
    const double level_db = db(std::max(peak(note.left), peak(note.right)));
    if (verbose) std::printf("default note: peak %.1f dBFS, rms %.1f dB\n", level_db, db(rms(note.left, 48000)));
    EXPECT(level_db > -24.0 && level_db < -10.0, "one key at the defaults peaks between -24 and -10 dBFS");

    // The built-in sound is a loop: scanning over its end is seamless.
    plain(device);
    device.set_param(p::kPosition, 0.95f);
    device.set_param(p::kScan, 1.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo seam = render(device, 0.6f, kRate);
    const double fundamental_before = band_rms(seam.left, kRate, 261.63, 6.0, 2400, 8600);
    const double fundamental_across = band_rms(seam.left, kRate, 261.63, 6.0, 8600, 14400);
    if (verbose) std::printf("built-in seam: %.4f before, %.4f across\n", fundamental_before, fundamental_across);
    EXPECT(fundamental_across > 0.7 * fundamental_before && fundamental_across < 1.4 * fundamental_before,
           "the built-in sound loops without a dip at its seam");
  }

  // The scan wraps at the end of any sound without a click: grains near the
  // end are pulled back inside rather than cut.
  {
    plain(device);
    load(device, sine(440.0f, 1.0f, kRate, 0.5f), kRate);
    device.set_param(p::kPosition, 0.5f);
    device.set_param(p::kScan, 1.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    const double steady = max_step(out.left, 4800, 16800);
    const double seam = max_step(out.left, 19200, 33600);  // the scan passes the end at 0.5 s
    if (verbose) std::printf("scan wrap: step %.4f steady, %.4f across the end\n", steady, seam);
    EXPECT(seam < 1.6 * steady, "the scan wraps over the end of the sound without a click");
    EXPECT(rms(out.left, 19200, 33600) > 0.5 * rms(out.left, 4800, 16800), "and keeps sounding");
  }

  // Pitch: the key transposes the sound, middle C being its own pitch.
  {
    std::vector<float> tone = sine(220.0f, 2.0f, kRate, 0.5f);
    plain(device);
    load(device, tone, kRate);
    device.set_param(p::kPosition, 0.3f);
    device.set_param(p::kSpray, 0.2f);
    device.set_param(p::kSize, 400.0f);
    device.note_on(1, 2.0f * kMiddleC, 1.0f);
    Stereo up = render(device, 4.0f, kRate);
    EXPECT_NEAR(centroid(up.left, kRate, 400.0, 480.0, 24000), 440.0, 1.0,
                "a 220 Hz sound an octave above middle C sounds at 440 Hz");
    plain(device);
    load(device, tone, kRate);
    device.set_param(p::kPosition, 0.3f);
    device.set_param(p::kSpray, 0.2f);
    device.set_param(p::kSize, 400.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo home = render(device, 4.0f, kRate);
    EXPECT_NEAR(centroid(home.left, kRate, 180.0, 260.0, 24000), 220.0, 1.0,
                "and at 220 Hz on middle C");

    // The same sound stored at 44.1 kHz, played by a 48 kHz device.
    plain(device);
    load(device, sine(220.0f, 2.0f, 44100.0f, 0.5f), 44100.0f);
    device.set_param(p::kPosition, 0.3f);
    device.set_param(p::kSpray, 0.2f);
    device.set_param(p::kSize, 400.0f);
    device.note_on(1, 2.0f * kMiddleC, 1.0f);
    Stereo other = render(device, 4.0f, kRate);
    EXPECT_NEAR(centroid(other.left, kRate, 400.0, 480.0, 24000), 440.0, 1.0,
                "a sound stored at 44.1 kHz plays at the right pitch at 48 kHz");
    // And a 96 kHz device playing a 48 kHz sound.
    plain(device, 96000.0f);
    load(device, tone, kRate);
    device.set_param(p::kPosition, 0.3f);
    device.set_param(p::kSpray, 0.2f);
    device.set_param(p::kSize, 400.0f);
    device.note_on(1, 2.0f * kMiddleC, 1.0f);
    Stereo fast = render(device, 4.0f, 96000.0f);
    EXPECT_NEAR(centroid(fast.left, 96000.0, 400.0, 480.0, 48000), 440.0, 1.0,
                "and a 48 kHz sound at the right pitch in a 96 kHz device");
  }

  // Scan 0 freezes a moment: the output stays where Position points, and
  // follows Position when it moves.
  {
    // 300 to 1500 Hz over 8 s: 150 Hz per second of sound.
    std::vector<float> slow = sweep(300.0f, 1500.0f, 8.0f, kRate, 0.5f);
    plain(device);
    load(device, slow, kRate);
    device.set_param(p::kPosition, 0.25f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    // A 100 ms grain starting at 2 s covers 600 to 615 Hz.
    const double early = centroid(out.left, kRate, 400.0, 800.0, 9600, 48000);
    const double late = centroid(out.left, kRate, 400.0, 800.0, 57600, 96000);
    if (verbose) std::printf("frozen at 0.25: %.1f Hz then %.1f Hz\n", early, late);
    EXPECT_NEAR(early, 607.5, 8.0, "Scan 0 plays the moment Position points at");
    EXPECT_NEAR(late, early, 4.0, "and holds it still");
    device.set_param(p::kPosition, 0.75f);
    Stereo moved = render(device, 1.5f, kRate);
    const double after = centroid(moved.left, kRate, 900.0, 1500.0, 24000, 72000);
    if (verbose) std::printf("moved to 0.75: %.1f Hz\n", after);
    EXPECT_NEAR(after, 1207.5, 8.0, "moving Position moves the frozen moment");
    EXPECT(band_rms(moved.left, kRate, 607.5, 30.0, 24000) < 0.05 * band_rms(out.left, kRate, 607.5, 30.0, 24000),
           "and leaves the old one behind");
  }

  // Scan 1 plays the sound through in its own duration whatever the key:
  // pitch and time are independent.
  {
    std::vector<float> ramp = sweep(400.0f, 1200.0f, 4.0f, kRate, 0.5f);
    const float ratios[] = {0.5f, 1.0f, 1.5f};
    for (float ratio : ratios) {
      plain(device);
      load(device, ramp, kRate);
      device.set_param(p::kScan, 1.0f);
      device.set_param(p::kSize, 60.0f);
      device.set_param(p::kDensity, 8.0f);
      device.note_on(1, ratio * kMiddleC, 1.0f);
      Stereo out = render(device, 5.0f, kRate);
      // At time t the scan is t seconds into the sound (200 Hz per second).
      // A grain that started d ago is reading ratio · d past where it
      // started, so on average the cloud is (ratio - 1) · 30 ms ahead.
      const double lead = (ratio - 1.0) * 0.03 * 200.0;
      const double at1 = centroid(out.left, kRate, ratio * 400.0, ratio * 1200.0, 38400, 57600);
      const double at3 = centroid(out.left, kRate, ratio * 400.0, ratio * 1200.0, 134400, 153600);
      if (verbose) std::printf("scan 1, ratio %.1f: %.1f Hz at 1 s, %.1f Hz at 3 s\n", ratio, at1, at3);
      EXPECT_NEAR(at1, ratio * (600.0 + lead), ratio * 12.0, "Scan 1: one second in after one second");
      EXPECT_NEAR(at3, ratio * (1000.0 + lead), ratio * 12.0, "Scan 1: three seconds in after three seconds");
      // After the sound's 4 s the scan wraps to the start.
      const double wrapped = centroid(out.left, kRate, ratio * 300.0, ratio * 1300.0, 206400, 225600);
      if (verbose) std::printf("   wrapped: %.1f Hz at 4.5 s\n", wrapped);
      EXPECT_NEAR(wrapped, ratio * (500.0 + lead), ratio * 15.0, "Scan wraps at the end of the sound");
    }
    // Scan -1 runs backwards from Position.
    plain(device);
    load(device, ramp, kRate);
    device.set_param(p::kScan, -1.0f);
    device.set_param(p::kPosition, 0.75f);
    device.set_param(p::kSize, 60.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo back = render(device, 2.5f, kRate);
    const double at2 = centroid(back.left, kRate, 400.0, 1200.0, 91200, 100800);
    EXPECT_NEAR(at2, 606.0, 15.0, "Scan -1 moves backwards through the sound");
  }

  // Density thickens the cloud without changing its level.
  {
    rng_state() = 0xD15EA5Eu;
    std::vector<float> hiss = noise(2.0f, kRate, 0.3f);
    std::vector<float> tone = sine(330.0f, 2.0f, kRate, 0.5f);
    const float densities[] = {1.0f, 2.0f, 4.0f, 8.0f, 16.0f};
    for (int source = 0; source < 2; ++source) {
      double lo = 1.0e9, hi = 0.0;
      for (float density : densities) {
        plain(device);
        load(device, source == 0 ? hiss : tone, kRate);
        device.set_param(p::kPosition, 0.4f);
        device.set_param(p::kSpray, 0.5f);
        device.set_param(p::kDensity, density);
        device.note_on(1, kMiddleC, 1.0f);
        Stereo out = render(device, 6.0f, kRate);
        const double level = rms(out.left, 24000);
        if (verbose) std::printf("%s, density %.0f: %.1f dB\n", source == 0 ? "noise" : "sine", density, db(level));
        lo = std::min(lo, level);
        hi = std::max(hi, level);
      }
      EXPECT(lo > 0.01, "every density sounds");
      EXPECT(db(hi) - db(lo) < 3.0, "the level stays within 3 dB from 1 to 16 grains");
    }
    // More grains at once means a steadier level: one grain at a time leaves
    // the window audible, sixteen overlap into a wash.
    double ripple[2];
    for (int which = 0; which < 2; ++which) {
      plain(device);
      load(device, hiss, kRate);
      device.set_param(p::kPosition, 0.4f);
      device.set_param(p::kSpray, 0.5f);
      device.set_param(p::kDensity, which == 0 ? 1.0f : 16.0f);
      device.note_on(1, kMiddleC, 1.0f);
      Stereo out = render(device, 4.0f, kRate);
      double lo = 1.0e9, hi = 0.0;
      for (size_t from = 24000; from + 480 <= out.left.size(); from += 480) {
        const double level = rms(out.left, from, from + 480);
        lo = std::min(lo, level);
        hi = std::max(hi, level);
      }
      ripple[which] = db(hi) - db(lo);
    }
    if (verbose) std::printf("level ripple: %.1f dB at density 1, %.1f dB at 16\n", ripple[0], ripple[1]);
    EXPECT(ripple[0] > 20.0 && ripple[1] < 12.0, "Density 1 pulses, Density 16 is a wash");
  }

  // Spread pans each grain; Spray makes the grains differ. Together they
  // decorrelate the channels; a mono sound with Spread 0 stays mono.
  {
    rng_state() = 0xFEEDu;
    std::vector<float> hiss = noise(2.0f, kRate, 0.3f);
    auto cloud = [&](float spray, float spread, float scan) {
      plain(device);
      load(device, hiss, kRate);
      device.set_param(p::kPosition, 0.3f);
      device.set_param(p::kSpray, spray);
      device.set_param(p::kSpread, spread);
      device.set_param(p::kScan, scan);
      device.set_param(p::kDensity, 8.0f);
      device.note_on(1, kMiddleC, 1.0f);
      return render(device, 1.5f, kRate);
    };
    Stereo centre = cloud(0.5f, 0.0f, 0.0f);
    EXPECT(centre.left == centre.right, "Spread 0 on a mono sound is mono");
    Stereo wide = cloud(0.5f, 1.0f, 0.0f);
    const double wide_corr = correlation(wide.left, wide.right, 12000);
    // Scan 1 on middle C with no Spray: every grain reads the same audio at
    // the same time, so panning them cannot decorrelate anything.
    Stereo same = cloud(0.0f, 1.0f, 1.0f);
    const double same_corr = correlation(same.left, same.right, 12000);
    Stereo sprayed = cloud(0.5f, 1.0f, 1.0f);
    const double sprayed_corr = correlation(sprayed.left, sprayed.right, 12000);
    if (verbose) std::printf("correlation: wide %.3f, aligned %.3f, aligned + spray %.3f\n", wide_corr, same_corr, sprayed_corr);
    // Independent grains at uniformly random pans give 2/pi = 0.64.
    EXPECT(wide_corr < 0.75, "Spread decorrelates left and right");
    EXPECT(same_corr > 0.85, "identical grains stay correlated however they are panned");
    EXPECT(sprayed_corr < 0.75 && sprayed_corr < same_corr - 0.15,
           "Spray makes them differ, and the channels with them");
    const double balance = db(rms(wide.left, 12000)) - db(rms(wide.right, 12000));
    EXPECT(std::fabs(balance) < 3.0, "the spread cloud is balanced");
  }

  // Octaves sends grains an octave up or down; Detune scatters their pitch.
  {
    std::vector<float> tone = sine(440.0f, 2.0f, kRate, 0.5f);
    auto cloud = [&](float octaves, float detune) {
      plain(device);
      load(device, tone, kRate);
      device.set_param(p::kPosition, 0.3f);
      device.set_param(p::kSpray, 0.3f);
      device.set_param(p::kSize, 300.0f);
      device.set_param(p::kDensity, 8.0f);
      device.set_param(p::kOctaves, octaves);
      device.set_param(p::kDetune, detune);
      device.note_on(1, kMiddleC, 1.0f);
      return render(device, 6.0f, kRate);
    };
    Stereo none = cloud(0.0f, 0.0f);
    Stereo half = cloud(0.5f, 0.0f);
    Stereo all = cloud(1.0f, 0.0f);
    const double base = band_rms(none.left, kRate, 440.0, 10.0, 24000);
    auto share = [&](const Stereo& out, double hz) { return band_rms(out.left, kRate, hz, 10.0, 24000) / base; };
    if (verbose) {
      std::printf("octaves 0:   220 %.3f  440 %.3f  880 %.3f\n", share(none, 220), share(none, 440), share(none, 880));
      std::printf("octaves 0.5: 220 %.3f  440 %.3f  880 %.3f\n", share(half, 220), share(half, 440), share(half, 880));
      std::printf("octaves 1:   220 %.3f  440 %.3f  880 %.3f\n", share(all, 220), share(all, 440), share(all, 880));
    }
    EXPECT(share(none, 220.0) < 0.1 && share(none, 880.0) < 0.1, "Octaves 0: nothing at half or twice the pitch");
    EXPECT(share(half, 220.0) > 0.3 && share(half, 880.0) > 0.3, "Octaves 0.5 adds energy an octave down and up");
    EXPECT(share(half, 440.0) > 0.5, "and keeps the original pitch");
    EXPECT(share(all, 220.0) > 0.5 && share(all, 880.0) > 0.5 && share(all, 440.0) < 0.15,
           "Octaves 1: every grain is an octave away");

    Stereo scattered = cloud(0.0f, 100.0f);
    // 50 to 100 cents sharp of 440 Hz, against the 20 Hz around it.
    const double off_plain =
        band_energy(none.left, kRate, 453.0, 466.0, 24000) / band_energy(none.left, kRate, 430.0, 450.0, 24000);
    const double off_scattered = band_energy(scattered.left, kRate, 453.0, 466.0, 24000) /
                                 band_energy(scattered.left, kRate, 430.0, 450.0, 24000);
    if (verbose) std::printf("detune: energy 50..100 ct sharp %.4f plain, %.4f at 100 ct\n", off_plain, off_scattered);
    EXPECT(off_plain < 0.01 && off_scattered > 0.2, "Detune spreads the grains' pitch");
    EXPECT_NEAR(centroid(scattered.left, kRate, 380.0, 500.0, 24000), 440.0, 4.0, "around the played pitch");
  }

  // Shape: a bell at 0, a flat top with short fades at 1. Looked at inside
  // one grain (Density 1, so nothing overlaps it).
  {
    std::vector<float> tone = sine(440.0f, 2.0f, kRate, 0.5f);
    double edge_level[2], top_level[2], steps[2];
    for (int which = 0; which < 2; ++which) {
      plain(device);
      load(device, tone, kRate);
      device.set_param(p::kPosition, 0.3f);
      device.set_param(p::kSize, 400.0f);
      device.set_param(p::kDensity, 1.0f);
      device.set_param(p::kShape, static_cast<float>(which));
      device.set_param(p::kAttack, 0.005f);
      device.note_on(1, kMiddleC, 1.0f);
      Stereo out = render(device, 0.3f, kRate);
      edge_level[which] = rms(out.left, 1680, 2160);   // 35 to 45 ms: a tenth of the way in
      top_level[which] = rms(out.left, 8640, 10560);   // 180 to 220 ms: the middle
      steps[which] = max_step(out.left);
    }
    if (verbose)
      std::printf("shape 0: edge/top %.3f; shape 1: edge/top %.3f\n", edge_level[0] / top_level[0],
                  edge_level[1] / top_level[1]);
    EXPECT(edge_level[0] < 0.2 * top_level[0], "Shape 0: a tenth of the way in the grain is still faint");
    EXPECT(edge_level[1] > 0.95 * top_level[1], "Shape 1: a tenth of the way in the grain is at full level");
    EXPECT(steps[1] < 1.5 * steps[0], "and its short fades still do not click");
  }

  // Reverse plays the same stretch backwards: a rising sweep falls.
  {
    // 300 to 1500 Hz over 2 s: 600 Hz per second. One 400 ms grain from
    // 0.5 s covers 600 to 840 Hz.
    std::vector<float> ramp = sweep(300.0f, 1500.0f, 2.0f, kRate, 0.5f);
    double first[2], second[2];
    for (int which = 0; which < 2; ++which) {
      plain(device);
      load(device, ramp, kRate);
      device.set_param(p::kPosition, 0.25f);
      device.set_param(p::kSize, 400.0f);
      device.set_param(p::kDensity, 1.0f);
      device.set_param(p::kShape, 1.0f);
      device.set_param(p::kReverse, static_cast<float>(which));
      device.note_on(1, kMiddleC, 1.0f);
      Stereo out = render(device, 0.4f, kRate);
      first[which] = centroid(out.left, kRate, 500.0, 950.0, 1920, 8640);     // 40 to 180 ms
      second[which] = centroid(out.left, kRate, 500.0, 950.0, 10560, 17280);  // 220 to 360 ms
    }
    if (verbose)
      std::printf("forward %.0f -> %.0f Hz, reversed %.0f -> %.0f Hz\n", first[0], second[0], first[1], second[1]);
    EXPECT_NEAR(first[0], 666.0, 15.0, "a forward grain starts low");
    EXPECT_NEAR(second[0], 774.0, 15.0, "and rises");
    EXPECT_NEAR(first[1], 774.0, 15.0, "a reversed grain starts where the forward one ends");
    EXPECT_NEAR(second[1], 666.0, 15.0, "and falls");

    // Reverse is a probability: at 0.5 about half the grains are backwards.
    // Count them by the direction of the sweep inside each 100 ms grain.
    plain(device);
    load(device, sweep(300.0f, 4300.0f, 2.0f, kRate, 0.5f), kRate);
    device.set_param(p::kPosition, 0.25f);
    device.set_param(p::kSize, 100.0f);
    device.set_param(p::kDensity, 1.0f);
    device.set_param(p::kShape, 1.0f);
    device.set_param(p::kReverse, 0.5f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo mixed = render(device, 12.0f, kRate);
    int rising = 0, falling = 0;
    // A grain's first 20 ms are near 1320 Hz forwards and near 1480 Hz backwards.
    for (size_t from = 0; from + 4800 <= mixed.left.size(); from += 240) {
      const bool onset = rms(mixed.left, from, from + 240) > 0.02 &&
                         (from < 240 || rms(mixed.left, from - 240, from) < 0.005);
      if (!onset) continue;
      const double low = band_energy(mixed.left, kRate, 1280.0, 1380.0, from + 96, from + 1056);
      const double high = band_energy(mixed.left, kRate, 1420.0, 1520.0, from + 96, from + 1056);
      (low > high ? rising : falling) += 1;
    }
    if (verbose) std::printf("reverse 0.5: %d forward grains, %d reversed\n", rising, falling);
    // Only grains that start after a gap are counted (the ±15 % timing
    // jitter leaves one before about a quarter of them).
    EXPECT(rising + falling > 20, "enough grains can be told apart");
    EXPECT(rising > (rising + falling) / 4 && falling > (rising + falling) / 4,
           "Reverse 0.5 turns about half the grains around");
  }

  // Attack and Release are the envelope's times, not the grain window's.
  {
    plain(device);
    load(device, sine(330.0f, 2.0f, kRate, 0.5f), kRate);
    device.set_param(p::kPosition, 0.3f);
    device.set_param(p::kSpray, 0.3f);
    device.set_param(p::kSize, 50.0f);
    device.set_param(p::kDensity, 12.0f);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo rise = render(device, 2.0f, kRate);
    const double full = rms(rise.left, 72000, 96000);
    EXPECT(rms(rise.left, 0, 4800) < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise.left, 52800, 62400) > 0.8 * full, "and has arrived shortly after 1 s");
    device.note_off(1);
    Stereo fall = render(device, 3.0f, kRate);
    EXPECT(rms(fall.left, 19200, 24000) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall.left, 48000, 52800) < 0.004 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, 96000, 144000) == 0.0, "and is exactly silent soon after");

    // A fast attack is fast even with long, soft grains: the key starts
    // with grains already mid-window. (Noise, so that the level of a
    // short stretch does not hang on how eight sines happen to add up.)
    plain(device);
    rng_state() = 0xA77ACu;
    load(device, noise(4.0f, kRate, 0.3f), kRate);
    device.set_param(p::kPosition, 0.1f);
    device.set_param(p::kSpray, 0.3f);
    device.set_param(p::kSize, 1500.0f);
    device.set_param(p::kDensity, 8.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo quick = render(device, 4.0f, kRate);
    if (verbose)
      std::printf("fast attack, 1.5 s grains: %.1f dB in the first 100 ms against steady\n",
                  db(rms(quick.left, 480, 4800)) - db(rms(quick.left, 96000, 192000)));
    EXPECT(rms(quick.left, 480, 4800) > 0.5 * rms(quick.left, 96000, 192000),
           "a 5 ms attack with 1.5 s grains sounds at once");
  }

  // Tone is a low-pass on the whole cloud.
  {
    rng_state() = 0x70E5u;
    std::vector<float> hiss = noise(2.0f, kRate, 0.3f);
    double highs[2], lows[2];
    for (int which = 0; which < 2; ++which) {
      plain(device);
      load(device, hiss, kRate);
      device.set_param(p::kSpray, 0.5f);
      device.set_param(p::kPosition, 0.4f);
      device.set_param(p::kTone, which == 0 ? 18000.0f : 500.0f);
      device.note_on(1, kMiddleC, 1.0f);
      Stereo out = render(device, 2.0f, kRate);
      highs[which] = band_rms(out.left, kRate, 5000.0, 2.0, 24000);
      lows[which] = band_rms(out.left, kRate, 200.0, 2.0, 24000);
    }
    EXPECT(highs[1] < 0.03 * highs[0], "Tone at 500 Hz removes the highs");
    EXPECT(lows[1] > 0.8 * lows[0], "and leaves the lows");
  }

  // Loudness follows velocity; ten held keys stay under the clip knee region.
  {
    double level[2];
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.note_on(1, 220.0f, which == 0 ? 1.0f : 0.1f);
      Stereo out = render(device, 3.0f, kRate);
      level[which] = rms(out.left, 48000);
    }
    EXPECT(level[1] < 0.6 * level[0] && level[1] > 0.2 * level[0], "soft keys are quieter, not silent");
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo out = render(device, 4.0f, kRate);
    if (verbose) std::printf("ten keys: peak %.2f\n", std::max(peak(out.left), peak(out.right)));
    EXPECT(peak(out.left) < 0.9 && peak(out.right) < 0.9, "ten keys stay under the clip knee region");
  }

  // A new sound committed while a key is held: the grains reading the old
  // one are dropped without a click and the new sound is what plays.
  {
    plain(device);
    load(device, sine(220.0f, 2.0f, kRate, 0.5f), kRate);
    device.set_param(p::kPosition, 0.3f);
    device.set_param(p::kSpray, 0.2f);
    device.set_param(p::kDensity, 8.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo before = render(device, 0.5f, kRate);
    // Commit at a moment when the output is far from zero.
    const double loud = 0.7 * peak(before.left, 12000);
    for (int i = 0; i < 48000; ++i) {
      Stereo one = render(device, 1.01f / kRate, kRate, 1);
      before = concat(before, one);
      if (std::fabs(one.left[0]) > loud) break;
    }
    const size_t at = before.size();
    load(device, sine(660.0f, 2.0f, kRate, 0.5f), kRate);
    Stereo after = render(device, 1.0f, kRate);
    Stereo all = concat(before, after);
    const double step_before = max_step(all.left, 12000, at);
    // The first millisecond after the commit: the old sound's last value
    // fading, the new sound barely in.
    const double step_across = max_step(all.left, at - 2, at + 48);
    const double step_after = max_step(all.left, at + 4800);
    if (verbose)
      std::printf("commit at %.3f (|out| %.3f): step %.4f before, %.4f across, %.4f after\n", at / kRate,
                  std::fabs(all.left[at - 1]), step_before, step_across, step_after);
    EXPECT(std::fabs(all.left[at - 1]) > 0.1, "the commit lands on a loud sample");
    EXPECT(step_across < 1.2 * step_before, "a commit mid-note does not click");
    EXPECT(max_step(all.left, at, at + 960) < 1.2 * step_after, "nor does the new sound coming in");
    const double new_level = band_rms(after.left, kRate, 660.0, 10.0, 9600);
    const double old_level = band_rms(after.left, kRate, 220.0, 10.0, 9600);
    EXPECT(new_level > 0.1 && old_level < 0.1 * new_level, "the new sound is what plays");
    EXPECT(rms(after.left, 960, 2400) > 0.3 * rms(after.left, 24000), "and it is there within 20 ms");

    // An empty commit: silence, not a crash; keys do nothing until a sound
    // arrives, and a held key picks the next one up.
    device.sample_commit(0, 2, kRate);
    Stereo emptied = render(device, 0.5f, kRate);
    EXPECT(finite(emptied.left) && max_step(emptied.left) < 1.2 * step_after, "an empty commit fades out without a click");
    EXPECT(peak(emptied.left, 960) == 0.0 && peak(emptied.right, 960) == 0.0, "and is silent within 20 ms");
    device.note_on(2, 440.0f, 1.0f);
    device.note_off(2);
    device.sample_commit(-5, 0, -1.0f);
    device.sample_commit(3, 1, std::nanf(""));
    Stereo nothing = render(device, 0.5f, kRate);
    EXPECT(finite(nothing.left) && peak(nothing.left) == 0.0, "keys on an empty store are silent");
    rng_state() = 0xB0B0u;
    std::vector<float> burst = noise(0.05f, kRate, 0.5f);
    load(device, burst, burst, 22050.0f);
    Stereo revived = render(device, 0.5f, kRate);
    EXPECT(rms(revived.left, 4800) > 0.01, "the held key plays the next sound that is committed");
    // More than fits: the store takes what it can hold.
    device.sample_commit(device.sample_capacity() + 1000, 2, 1.0e9f);
    Stereo big = render(device, 0.25f, kRate);
    EXPECT(finite(big.left) && peak(big.left) < 1.01, "an oversized commit with an absurd rate is survivable");
    EXPECT(device.sample_capacity() >= 20 * 48000, "the store holds at least 20 s at 48 kHz");
  }

  // The ninth key steals a voice without a click.
  {
    plain(device);
    load(device, sine(220.0f, 2.0f, kRate, 0.5f), kRate);
    device.set_param(p::kSpray, 0.2f);
    device.set_param(p::kPosition, 0.3f);
    device.set_param(p::kVolume, -12.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, kMiddleC * std::pow(2.0f, n / 12.0f), 0.8f);
    Stereo held = render(device, 1.0f, kRate);
    device.note_on(8, kMiddleC * 2.0f, 0.2f);
    Stereo stolen = render(device, 0.5f, kRate);
    if (verbose) std::printf("steal: step %.4f before, %.4f after\n", max_step(held.left, 24000), max_step(stolen.left));
    EXPECT(max_step(stolen.left) < 1.5 * max_step(held.left, 24000), "stealing a voice does not click");
  }

  // Cost: eight keys at the defaults, and the worst case (the grain budget full).
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("grain-synth (8 keys, defaults)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  device.set_param(p::kDensity, 16.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("grain-synth (8 keys, density 16)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("grain-synth");
}
