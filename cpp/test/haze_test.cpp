// Native harness for Haze (cpp/devices/haze). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a reverb into a fuzz into a reverb.

#include "../devices/haze/haze.h"
#include "../devices/haze/quadrature.h"
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

// The wall colours each note its own way (a still tank answers each pitch
// differently, and one gain serves all of a note's partials), so what the
// fuzz does to a sine is read over six notes and as the power of the two
// sides: the third harmonic under the note, and the level, both in dB.
static const float kFuzzNotes[6] = {196.0f, 220.0f, 246.94f, 261.63f, 293.66f, 329.63f};
static void fuzz_of(Haze& d, float haze, float gain, float seconds, double* third, double* level) {
  *third = 0.0;
  *level = 0.0;
  for (float hz : kFuzzNotes) {
    plain(d);
    d.set_param(p::kDecay, 0.5f);
    d.set_param(p::kBlur, 0.0f);
    d.set_param(p::kTone, 1.0f);
    d.set_param(p::kHaze, haze);
    Stereo out = run(d, sine(hz, seconds, kRate, gain));
    const size_t from = static_cast<size_t>((seconds - 2.0f) * kRate), to = static_cast<size_t>(seconds * kRate);
    const double l3 = tone_level(out.left, 3.0 * hz, kRate, from, to), l1 = tone_level(out.left, hz, kRate, from, to);
    const double r3 = tone_level(out.right, 3.0 * hz, kRate, from, to), r1 = tone_level(out.right, hz, kRate, from, to);
    *third += 10.0 * std::log10((l3 * l3 + r3 * r3) / (l1 * l1 + r1 * r1)) / 6.0;
    const double l = rms(out.left, from, to), r = rms(out.right, from, to);
    *level += 10.0 * std::log10(0.5 * (l * l + r * r)) / 6.0;
  }
}

// The bank's held notes: three partials (1, 1/2, 1/4) at -20 dBFS RMS, the
// same on both sides, with a 20 ms fade in.
static std::vector<float> held_note(int note, float seconds, float sample_rate) {
  const size_t frames = static_cast<size_t>(seconds * sample_rate);
  std::vector<double> wave(frames, 0.0);
  const double hz = 440.0 * std::pow(2.0, (note - 69) / 12.0);
  for (int k = 1; k <= 3; ++k) {
    const double w = 2.0 * kPi * hz * k / sample_rate;
    const double a = 1.0 / std::pow(2.0, k - 1);
    for (size_t i = 0; i < frames; ++i) wave[i] += a * std::sin(w * static_cast<double>(i) + note * 0.7 + k);
  }
  double sum = 0.0;
  for (double v : wave) sum += v * v;
  const double scale = 0.1 / std::sqrt(sum / static_cast<double>(frames));
  const double fade = 0.02 * sample_rate;
  std::vector<float> out(frames);
  for (size_t i = 0; i < frames; ++i) out[i] = static_cast<float>(wave[i] * scale * std::min(1.0, i / fade));
  return out;
}
static const int kHeldNotes[13] = {45, 48, 52, 55, 57, 60, 64, 67, 69, 72, 76, 79, 81};

// What a held note does over time: the output by quarter seconds from one
// second in, as the power of the two sides and as the fold to mono, both
// against the dry note (dB), and the left against the right.
struct Steady {
  double lowest = 1.0e9, highest = -1.0e9;            // the two sides
  double mono_lowest = 1.0e9, mono_highest = -1.0e9;  // the fold
  double lean = 0.0;                                  // the furthest the left stands from the right
  void take(const std::vector<float>& dry, const Stereo& out, float sample_rate) {
    const size_t window = static_cast<size_t>(0.25f * sample_rate);
    for (size_t from = static_cast<size_t>(sample_rate); from + window <= dry.size(); from += window) {
      double dd = 0.0, ll = 0.0, rr = 0.0, mm = 0.0;
      for (size_t i = from; i < from + window; ++i) {
        dd += static_cast<double>(dry[i]) * dry[i];
        ll += static_cast<double>(out.left[i]) * out.left[i];
        rr += static_cast<double>(out.right[i]) * out.right[i];
        const double m = 0.5 * (static_cast<double>(out.left[i]) + out.right[i]);
        mm += m * m;
      }
      const double both = 10.0 * std::log10(std::max(0.5 * (ll + rr), 1.0e-20) / dd);
      const double fold = 10.0 * std::log10(std::max(mm, 1.0e-20) / dd);
      lowest = std::min(lowest, both);
      highest = std::max(highest, both);
      mono_lowest = std::min(mono_lowest, fold);
      mono_highest = std::max(mono_highest, fold);
      lean = std::max(lean, std::fabs(10.0 * std::log10(std::max(ll, 1.0e-20) / std::max(rr, 1.0e-20))));
    }
  }
};

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
  // rises with Haze over the whole of the knob while the RMS stays put, and
  // at the bottom of the knob there is no fuzz. (What is left there, 80 dB
  // under the note, is the ripple of the level the fuzz works under. One note
  // on one side once read 99: the swept wall smeared a harmonic's power out
  // of the bin it was measured in, the higher the more.)
  {
    double third[5], level[5];
    const float settings[5] = {0.0f, 0.25f, 0.5f, 0.75f, 1.0f};
    for (int k = 0; k < 5; ++k) fuzz_of(device, settings[k], 0.25f, 5.0f, &third[k], &level[k]);
    EXPECT(third[1] > third[0] + 30.0 && third[2] > third[1] + 8.0 && third[3] > third[2] + 5.0 &&
               third[4] > third[3] + 1.0,
           "a sine's third harmonic rises with Haze over the whole knob");
    EXPECT(third[0] < -70.0 && third[4] > -15.0, "Haze goes from clean to a driven wave");
    double low = level[0], high = level[0];
    for (double v : level) {
      low = std::min(low, v);
      high = std::max(high, v);
    }
    std::printf("haze: sine in at %.1f dB, out %.1f to %.1f dB over Haze; third harmonic %.1f, %.1f, %.1f, %.1f, %.1f dB under the note (six notes)\n",
                db(0.25 / std::sqrt(2.0)), low, high, third[0], third[1], third[2], third[3], third[4]);
    EXPECT(high - low < 1.5, "the level holds within 1.5 dB as Haze is turned");
    EXPECT(std::fabs(level[2] - db(0.25 / std::sqrt(2.0))) < 3.0, "a held sine leaves about as loud as it came");
  }

  // The fuzz follows the playing: a softer note is given less drive, so its
  // overtones stand further under it, at every Haze; and at Haze 0 a note of
  // any loudness leaves clean. (The first version held the push whatever the
  // level: the third harmonic of a note 30 dB softer was 7 dB lower, and at
  // Haze 0 it stood 42 dB under the note, most of it the level follower's own
  // ripple reaching the gain 39 samples early.)
  {
    const float levels[4] = {-36.0f, -24.0f, -12.0f, -6.0f};
    for (float haze : {0.0f, 0.55f, 1.0f}) {
      double third[4], level;
      for (int k = 0; k < 4; ++k) fuzz_of(device, haze, std::pow(10.0f, levels[k] / 20.0f), 4.0f, &third[k], &level);
      std::printf("haze: Haze %.2f, a sine at -36, -24, -12 and -6 dBFS: third harmonic %.1f, %.1f, %.1f, %.1f dB under the note (six notes)\n",
                  haze, third[0], third[1], third[2], third[3]);
      if (haze == 0.0f) {
        for (double v : third) EXPECT(v < -70.0, "at Haze 0 a note of any loudness leaves clean");
      } else {
        EXPECT(third[0] < third[3] - 9.0 && third[1] < third[3] - 1.0 && third[0] < third[1] - 6.0,
               "soft playing is cleaner than loud playing");
        // The curve is all but full by -12 dBFS at the top of Haze: the last step may stand still.
        EXPECT(third[0] < third[1] && third[1] < third[2] && third[2] < third[3] + 0.3, "the overtones grow with the playing");
      }
    }
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
    EXPECT(off[1] > off[0] * 1.25 && off[2] > off[1] * 0.98, "a chord's intermodulation grows with Haze and does not fall at the top");
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
  // full Blur does not leave a tail of its own (it left 1.1 s while its
  // lengths stood whatever Decay was; they shrink with a Decay under 1 s).
  {
    plain(device);
    device.set_param(p::kBlur, 1.0f);
    device.set_param(p::kDecay, 0.5f);
    Stereo out = run(device, impulse(3.0f, kRate, 0.9f));
    const double measured = rt60(out.left, kRate, 0.3, 0.05, -100.0);
    std::printf("haze: RT60 at Decay 0.5 s and full Blur: %.2f s\n", measured);
    EXPECT(measured < 0.65, "full Blur does not outlast the shortest Decay by more than a third");
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

  // Octave adds the octave above: energy at twice a sine's frequency. One
  // note's level in the wall is the wall's own answer at that pitch, so the
  // octave is held against the note over five notes.
  {
    double second[3] = {0.0, 0.0, 0.0}, first[3] = {0.0, 0.0, 0.0};
    const float settings[3] = {0.0f, 0.3f, 1.0f};
    const float notes[5] = {196.0f, 220.0f, 246.94f, 261.63f, 293.66f};
    for (int k = 0; k < 3; ++k) {
      for (float hz : notes) {
        plain(device);
        device.set_param(p::kBlur, 0.0f);
        device.set_param(p::kDecay, 0.5f);
        device.set_param(p::kTone, 1.0f);
        device.set_param(p::kOctave, settings[k]);
        Stereo out = run(device, sine(hz, 4.0f, kRate, 0.25f));
        second[k] += db(tone_level(out.left, 2.0 * hz, kRate, 2 * 48000, 4 * 48000)) / 5.0;
        first[k] += db(tone_level(out.left, hz, kRate, 2 * 48000, 4 * 48000)) / 5.0;
      }
    }
    std::printf("haze: the octave of a sine (five notes) at Octave 0, 0.3, 1: %.1f, %.1f, %.1f dB; the note itself %.1f, %.1f, %.1f dB\n",
                second[0], second[1], second[2], first[0], first[1], first[2]);
    EXPECT(second[0] < -100.0, "without Octave a sine has no second harmonic");
    EXPECT(second[1] > -40.0 && second[2] > second[1] + 6.0, "Octave adds energy at twice the frequency");
    EXPECT(second[2] > first[2] + 6.0, "at full Octave the octave is louder than the note");
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
  // the downsampler's transition band and is measured apart. Each is held
  // against the level of the whole output, as the power of the two sides (one
  // partial on one side is the wall's own colour at that pitch). With no fold
  // there is nothing to find; at full Octave the fold's harmonics fold back
  // 76 dB under the output. (The swept wall read 85 there against its loudest
  // partial: its sweeps spread a high tone's power out of the bin.)
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
      const auto both = [&](double hz) {
        const double l = tone_level(out.left, hz, kRate, from, to), r = tone_level(out.right, hz, kRate, from, to);
        return std::sqrt(0.5 * (l * l + r * r));
      };
      const double l = rms(out.left, from, to), r = rms(out.right, from, to);
      const double whole = std::sqrt(l * l + r * r);  // as a sine's peak
      double folded = 0.0;
      for (double hz : {1700.0, 3900.0, 6100.0, 8300.0, 10500.0, 12700.0, 18300.0, 16100.0, 13900.0, 11700.0,
                        9500.0, 7300.0, 5100.0, 2900.0, 700.0}) {
        folded = std::max(folded, both(hz));
      }
      const double edge = both(20500.0);
      std::printf("haze: aliasing of a 1.1 kHz sine at full Haze, Octave %.0f: %.1f dB under the output (%.1f dB at 20.5 kHz)\n",
                  octave, -db(folded / whole), -db(edge / whole));
      if (octave == 0.0f) {
        EXPECT(folded < whole * 0.00001, "with no fold, what folds back under 19 kHz is 100 dB under the output");
        EXPECT(edge < whole * 0.00003, "with no fold, what folds back at 20.5 kHz is 90 dB under the output");
      } else {
        EXPECT(folded < whole * 0.0003, "at full Octave, what folds back under 19 kHz is 70 dB under the output");
        EXPECT(edge < whole * 0.001, "at full Octave, what folds back at 20.5 kHz is 60 dB under the output");
      }
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
  // 2048 give the same output (the shift and the control tick run by a count
  // of samples), and the sleep is exact zeros.
  {
    const auto sequence = [&](int block) {
      device.init(kRate);
      device.set_param(p::kDecay, 0.5f);
      rng_state() = 0x51EE9u;
      Stereo out = run(device, noise(0.3f, kRate, 0.5f), block);
      out = concat(out, render(device, 8.0007f, kRate, block));  // the wake lands off a control tick
      device.set_param(p::kHaze, 0.9f);
      device.set_param(p::kBlur, 0.2f);
      device.set_param(p::kDecay, 3.0f);
      device.set_param(p::kSize, 0.15f);
      device.set_param(p::kTone, 0.8f);
      device.set_param(p::kOctave, 0.6f);
      device.set_param(p::kFeed, 0.8f);
      device.set_param(p::kWidth, 0.3f);
      device.set_param(p::kMix, 0.8f);
      // The wake is 0.1 s into a block at 2048 and one sample past a control tick.
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
    // Exactly: the device sleeps and wakes on the sample, and what holds the
    // wall starts afresh on waking wherever in a control tick that falls.
    EXPECT(worst == 0.0, "the output is the same to the last bit at every block size across a sleep");
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

  // No clicks, held tighter: a low sine (whose own curve is nearly straight
  // from sample to sample) and each control thrown from one end to the other
  // and back. The largest bend in the output, y[n] - 2 y[n-1] + y[n-2] on
  // either side, over the second and a half after the throw, against the
  // largest in a run that rests at either end. (Decay thrown was 8 times the
  // resting bend: the lines' gains moved by the control tick, and the first
  // tick took a line from 0.44 to 0.75. Size thrown was 6 times, 1.2 s after
  // the throw: the float it glided in stalled short and was landed, two or
  // three samples of every line at once.)
  {
    auto low_sine = [](double seconds, double from) {
      std::vector<float> x(static_cast<size_t>(seconds * 48000.0));
      const size_t at = static_cast<size_t>(from * 48000.0);
      for (size_t i = 0; i < x.size(); ++i) {
        x[i] = static_cast<float>(0.5 * std::sin(2.0 * kPi * 110.0 * static_cast<double>(i + at) / 48000.0));
      }
      return x;
    };
    auto bend = [](const Stereo& o, size_t from) {
      double most = 0.0;
      for (size_t i = from + 2; i < o.left.size(); ++i) {
        most = std::max(most, std::fabs(double(o.left[i]) - 2.0 * o.left[i - 1] + o.left[i - 2]));
        most = std::max(most, std::fabs(double(o.right[i]) - 2.0 * o.right[i - 1] + o.right[i - 2]));
      }
      return most;
    };
    // Blur and Size move delays, so a thrown one bends the pitch while it
    // glides (their descriptions say so), and a note bent up has more bend in
    // its wave by the square of how far: thrown down, they are given 6 times
    // the resting bend where the others are given 3.5. (A thrown Size was a
    // corner, at the first sample, while its glide set off at full speed: it
    // sets off from rest now.)
    double worst = 0.0, worst_glide = 0.0;
    int worst_id = 0;
    for (int id = 0; id < p::kNumParams; ++id) {
      const float ends[2] = {id == p::kDecay ? 0.5f : 0.0f, id == p::kDecay ? 30.0f : 1.0f};
      double rest = 0.0, thrown = 0.0;
      for (int k = 0; k < 2; ++k) {
        device.init(kRate);
        device.set_param(id, ends[k]);
        rest = std::max(rest, bend(run(device, low_sine(6.0, 0.0)), 3 * 48000));
        device.init(kRate);
        device.set_param(id, ends[k]);
        run(device, low_sine(3.0, 0.0));
        device.set_param(id, ends[1 - k]);
        thrown = std::max(thrown, bend(run(device, low_sine(1.5, 3.0)), 0));
      }
      if (id == p::kBlur || id == p::kSize) {
        worst_glide = std::max(worst_glide, thrown / rest);
      } else if (thrown / rest > worst) {
        worst = thrown / rest;
        worst_id = id;
      }
    }
    std::printf("haze: each control thrown end to end under a low sine: the bend at most %.1f times the resting one (control %d), %.1f times for Blur and Size\n",
                worst, worst_id, worst_glide);
    EXPECT(worst < 3.5, "no control thrown from end to end leaves a jump in the wave");
    EXPECT(worst_glide < 6.0, "Blur and Size thrown bend the pitch and leave no jump");
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

  // At a longer Decay the return is not held under kFeedMost, and the top of
  // Feed is the share kFeedShare of what the wall loses: the tail is half as
  // long again (1.4 times, measured; the swept wall made it 1.9), not ten
  // times as long (a share of 0.95 would be twenty).
  {
    double times[2];
    for (int k = 0; k < 2; ++k) {
      plain(device);
      device.set_param(p::kDecay, 6.0f);
      device.set_param(p::kFeed, k == 0 ? 0.0f : 1.0f);
      rng_state() = 0xFEEDu;
      std::vector<float> burst = soft_noise(0.5f, 0.3f);
      burst.resize(static_cast<size_t>(kRate * 60.0f), 0.0f);
      Stereo out = run(device, burst);
      times[k] = rt60(out.left, kRate, 1.0, 0.25, -110.0);
    }
    std::printf("haze: RT60 at Decay 6 s with Feed 0 and 1: %.2f, %.2f s\n", times[0], times[1]);
    EXPECT(times[1] > times[0] * 1.3 && times[1] < times[0] * 3.4, "the top of Feed at a long Decay is half as long again to three times the tail");
  }

  // The top of Feed at every corner of the other controls: Tone, Haze,
  // Octave, Blur and Size each at both ends, Decay at 2 s. After a burst the
  // wall falls 60 dB in a time that ends (Tone's tilt once added 6 dB inside
  // the loop, and at the top of Tone and Feed the tail never fell), and a
  // full-scale chord held into the same corner at the longest Decay stays
  // under the ceiling and does not grow.
  {
    double longest = 0.0, shortest = 1.0e9;
    int longest_corner = 0;
    for (int corner = 0; corner < 32; ++corner) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kDecay, 2.0f);
      device.set_param(p::kFeed, 1.0f);
      device.set_param(p::kTone, (corner & 1) ? 1.0f : 0.0f);
      device.set_param(p::kHaze, (corner & 2) ? 1.0f : 0.0f);
      device.set_param(p::kOctave, (corner & 4) ? 1.0f : 0.0f);
      device.set_param(p::kBlur, (corner & 8) ? 1.0f : 0.0f);
      device.set_param(p::kSize, (corner & 16) ? 1.0f : 0.0f);
      rng_state() = 0xFEEDu;
      std::vector<float> burst = soft_noise(1.0f, 0.3f);
      burst.resize(static_cast<size_t>(kRate * 26.0f), 0.0f);
      Stereo out = run(device, burst);
      const double start = db(rms(out.left, 43200, 48000));
      double seconds = 25.0;
      for (int window = 0; window < 250; ++window) {
        const size_t from = 48000 + static_cast<size_t>(window) * 4800;
        if (db(rms(out.left, from, from + 4800)) < start - 60.0) {
          seconds = 0.1 * window + 0.05;
          break;
        }
      }
      if (seconds > longest) {
        longest = seconds;
        longest_corner = corner;
      }
      shortest = std::min(shortest, seconds);
      char label[160];
      std::snprintf(label, sizeof label, "top of Feed, corner %d (Tone, Haze, Octave, Blur, Size by bit): the wall falls 60 dB in %.1f s", corner, seconds);
      EXPECT(finite(out.left) && seconds < 12.0, label);
    }
    std::printf("haze: top of Feed at Decay 2 s over 32 corners of Tone, Haze, Octave, Blur and Size: 60 dB down in %.1f to %.1f s (the longest at corner %d)\n",
                shortest, longest, longest_corner);
    const std::vector<float> held = chord(60.0f, 0.333f);
    for (int corner = 0; corner < 4; ++corner) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kDecay, 30.0f);
      device.set_param(p::kFeed, 1.0f);
      device.set_param(p::kHaze, 1.0f);
      device.set_param(p::kTone, (corner & 1) ? 1.0f : 0.0f);
      device.set_param(p::kBlur, (corner & 2) ? 1.0f : 0.0f);
      Stereo out = run(device, held);
      const double top = std::max(peak(out.left), peak(out.right));
      const auto both = [&out](size_t from, size_t to) {
        const double left = rms(out.left, from, to), right = rms(out.right, from, to);
        return 10.0 * std::log10(0.5 * (left * left + right * right));
      };
      const double early = both(20 * 48000, 30 * 48000);
      const double late = both(50 * 48000, 60 * 48000);
      char label[160];
      std::snprintf(label, sizeof label, "held chord, Feed, Haze and Decay at the top, corner %d of Tone and Blur: peak %.2f, %+.1f dB over 30 s", corner, top, late - early);
      EXPECT(finite(out.left) && top < 2.0 && late - early < 1.0, label);
    }
  }

  // Level: a full-scale chord held for a minute at the default and at each
  // end of every control. The peak stays under 6 dB over full scale, the
  // last ten seconds are no louder than ten seconds from the first half, and
  // the wall alone is within a few dB of what was played into it. The level
  // is the power of the two sides.
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
        const auto both = [&out](size_t from, size_t to) {
          const double left = rms(out.left, from, to), right = rms(out.right, from, to);
          return 10.0 * std::log10(0.5 * (left * left + right * right));
        };
        const double early = both(20 * 48000, 30 * 48000);
        const double late = both(50 * 48000, 60 * 48000);
        hottest = std::max(hottest, top);
        most_growth = std::max(most_growth, late - early);
        if (!(id == p::kMix && end == 0)) {
          loudest = std::max(loudest, late - in_level);
          quietest = std::min(quietest, late - in_level);
        }
        char label[120];
        std::snprintf(label, sizeof label, "held chord, param %d at its %s: peak %.2f, %+.1f dB against the input, %+.1f dB over 30 s",
                      id, end == 0 ? "minimum" : "maximum", top, late - in_level, late - early);
        EXPECT(finite(out.left) && top < 2.0 && late - early < 1.0 && late - in_level < 2.0 && late - in_level > -2.0, label);
      }
    }
    std::printf("haze: full-scale chord for a minute over every control's ends: peak at most %.2f, level %+.1f to %+.1f dB against the input, growth at most %+.1f dB\n",
                hottest, quietest, loudest, most_growth);
  }

  // Part-way Mix: held tones on every semitone of the piano through the
  // default, the power of the two sides against the tone's own. The wall is
  // turned a quarter from the dry tone, so no tone's wall stands against it
  // or with it: the two add in power at every pitch. (The dry share alone is
  // 2.4 dB under the input at the default Mix, and the top octave, where the
  // wall is dark, comes near it. The swept wall stood from 4.5 dB under to
  // 2.7 dB over; the first version from 5.6 under to 7.9 over.)
  {
    double worst = 0.0, most = 0.0, sum = 0.0;
    float worst_hz = 0.0f, most_hz = 0.0f;
    int count = 0;
    for (int note = 21; note <= 108; ++note) {
      const float hz = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
      device.init(kRate);
      const std::vector<float> tone = sine(hz, 4.0f, kRate, 0.25f);
      Stereo out = run(device, tone);
      const double left = rms(out.left, 2 * 48000, 4 * 48000), right = rms(out.right, 2 * 48000, 4 * 48000);
      const double change = 10.0 * std::log10(0.5 * (left * left + right * right)) - db(rms(tone, 2 * 48000, 4 * 48000));
      sum += change;
      ++count;
      if (change < worst) {
        worst = change;
        worst_hz = hz;
      }
      if (change > most) {
        most = change;
        most_hz = hz;
      }
    }
    std::printf("haze: held tones A0 to C8 by the semitone at the default: %+.1f dB on average, %+.1f dB at %.0f Hz to %+.1f dB at %.0f Hz\n",
                sum / count, worst, worst_hz, most, most_hz);
    EXPECT(worst > -3.0, "no held tone drops more than 3 dB at the default Mix");
    EXPECT(most < 1.5, "no held tone stands over the input at the default Mix");
    EXPECT(sum / count > -1.5 && sum / count < 1.5, "held tones leave the default as loud as they came");
  }

  // The meters are the device's own numbers: the push is the drive times the
  // level's share of level + floor (kDriveMax, kDriveCurve, kFollowLevel and
  // kFloor in haze.h), the
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
      // kDriveMax (c^Haze - 1) / (c - 1), times the share of it this level is given.
      const double drive = 8.0 * (std::pow(24.0, haze) - 1.0) / 23.0 * std::sqrt(1.25 * level / (level + 0.25));
      const double expected = drive * level / (level + 0.01);
      EXPECT_NEAR(device.meter(0), expected, expected * 0.05, "the push meter is the drive this level is given x level / (level + floor)");
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

  // Every preset (the table is device.json's, in the order of its params:
  // haze, blur, decay, mix, size, tone, octave, feed, width): a full-scale
  // chord held for a minute stays under 6 dB over full scale, does not grow,
  // and leaves within a few dB of what came; held tones over the piano's
  // range do not fall far under the input at the preset's own Mix. A preset
  // with Mix at 1 has no dry tone for the wall to stand against: there a
  // tone's level is the wall's own answer at that pitch, and under 90 Hz its
  // low cut, so it is bounded apart and from E1 up.
  {
    struct Preset {
      const char* name;
      float values[p::kNumParams];
    };
    static const Preset presets[] = {
    {"Glowing wall", {0.55f, 0.6f, 6.0f, 0.45f, 0.6f, 0.5f, 0.2f, 0.25f, 1.0f}},
    {"Faint warmth", {0.3f, 0.4f, 2.0f, 0.15f, 0.6f, 0.4f, 0.0f, 0.0f, 1.0f}},
    {"Wool blanket", {0.7f, 0.8f, 8.0f, 0.45f, 0.6f, 0.1f, 0.0f, 0.3f, 1.0f}},
    {"Bright glare", {0.85f, 0.5f, 5.0f, 0.5f, 0.6f, 0.9f, 0.35f, 0.25f, 1.0f}},
    {"Octave glow", {0.5f, 0.7f, 7.0f, 0.38f, 0.6f, 0.65f, 0.7f, 0.25f, 1.0f}},
    {"Endless wall", {0.75f, 0.9f, 30.0f, 0.45f, 1.0f, 0.5f, 0.2f, 0.7f, 1.0f}},
    {"Small room fuzz", {0.8f, 0.15f, 0.8f, 0.4f, 0.1f, 0.5f, 0.2f, 0.0f, 1.0f}},
    {"Wall alone", {0.6f, 0.9f, 8.0f, 1.0f, 0.6f, 0.5f, 0.2f, 0.25f, 0.9f}},
    {"Slow bloom", {0.45f, 1.0f, 10.0f, 0.6f, 0.8f, 0.4f, 0.2f, 0.25f, 1.0f}},
    {"Feedback cloud", {0.65f, 0.6f, 4.0f, 0.5f, 0.6f, 0.45f, 0.2f, 1.0f, 1.0f}},
    {"Thin veil", {0.15f, 0.7f, 4.0f, 0.3f, 0.6f, 0.6f, 0.0f, 0.25f, 1.0f}},
    {"Low rumble", {0.9f, 0.9f, 14.0f, 0.35f, 1.0f, 0.0f, 0.0f, 0.25f, 1.0f}},
    {"Glass halo", {0.25f, 0.3f, 12.0f, 0.2f, 0.3f, 1.0f, 1.0f, 0.0f, 1.0f}},
    {"Narrow beam", {0.7f, 0.6f, 3.0f, 0.4f, 0.3f, 0.55f, 0.2f, 0.25f, 0.0f}},
    {"Drone bed", {0.6f, 1.0f, 20.0f, 0.55f, 1.0f, 0.3f, 0.2f, 0.35f, 1.0f}},
    {"Bite and tail", {0.9f, 0.0f, 3.5f, 0.4f, 0.6f, 0.6f, 0.1f, 0.25f, 1.0f}},
    };
    const std::vector<float> held = chord(60.0f, 0.333f);
    const double in_level = db(rms(held));
    double hottest = 0.0, loudest = -200.0, quietest = 200.0, most_growth = -200.0, worst = 0.0;
    double worst_alone = 0.0, lowest_alone = 0.0;
    const char* worst_at = "";
    float worst_hz = 0.0f, worst_alone_hz = 0.0f;
    for (const Preset& preset : presets) {
      device.init(kRate);
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.values[id]);
      Stereo out = run(device, held);
      const double top = std::max(peak(out.left), peak(out.right));
      const auto both = [&out](size_t from, size_t to) {
        const double left = rms(out.left, from, to), right = rms(out.right, from, to);
        return 10.0 * std::log10(0.5 * (left * left + right * right));
      };
      const double early = both(20 * 48000, 30 * 48000);
      const double late = both(50 * 48000, 60 * 48000);
      hottest = std::max(hottest, top);
      most_growth = std::max(most_growth, late - early);
      loudest = std::max(loudest, late - in_level);
      quietest = std::min(quietest, late - in_level);
      char label[160];
      std::snprintf(label, sizeof label, "held chord through %s: peak %.2f, %+.1f dB against the input, %+.1f dB over 30 s",
                    preset.name, top, late - in_level, late - early);
      EXPECT(finite(out.left) && top < 2.0 && late - early < 1.0 && late - in_level < 2.0 && late - in_level > -2.0, label);
      for (float note = 21.0f; note <= 108.0f; note += 6.0f) {
        const float hz = 440.0f * std::pow(2.0f, (note - 69.0f) / 12.0f);
        device.init(kRate);
        for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.values[id]);
        const std::vector<float> tone = sine(hz, 3.0f, kRate, 0.25f);
        Stereo held_tone = run(device, tone);
        const double change = db(rms(held_tone.left, 3 * 24000, 3 * 48000) / rms(tone, 3 * 24000, 3 * 48000));
        if (preset.values[p::kMix] >= 1.0f) {
          if (note < 27.0f) lowest_alone = change;
          else if (change < worst_alone) {
            worst_alone = change;
            worst_alone_hz = hz;
          }
        } else if (change < worst) {
          worst = change;
          worst_at = preset.name;
          worst_hz = hz;
        }
      }
    }
    std::printf("haze: full-scale chord for a minute through every preset: peak at most %.2f, level %+.1f to %+.1f dB against the input, growth at most %+.1f dB\n",
                hottest, quietest, loudest, most_growth);
    std::printf("haze: held tones A0 to A7 through every preset: the worst %+.1f dB at %.0f Hz in %s\n", worst, worst_hz, worst_at);
    std::printf("haze: held tones through the wall alone (Mix 1): %+.1f dB at A0, from E1 up the worst %+.1f dB at %.0f Hz\n",
                lowest_alone, worst_alone, worst_alone_hz);
    // The lowest of them are the top octaves, where a dark wall adds nothing
    // to the dry share (5.6 dB under at a Mix of 0.65) and the wall alone has
    // its own top.
    EXPECT(worst > -6.5, "no held tone drops more than 6.5 dB through any preset with the dry in it");
    EXPECT(worst_alone > -8.0, "the wall alone answers every tone from E1 up within 8 dB");
  }

  // The top of Feed keeps the pitch: a note held for three seconds, then the
  // tail, with the power near the note weighed by its distance from it in
  // cents once the tail is 40 dB down. Each time round, the way back moves
  // everything a few hertz, so a tail that lives on what came back leans
  // flat; the share that comes back is held to kFeedShare, which keeps the
  // lean near two thirds of a semitone by the time the tail is 40 dB down
  // (about a quarter of one at 20 dB down). At a share of 0.95 the tail of
  // A4 stood 150 cents flat by then. Halving the shift does not halve the
  // lean (the tail then goes round more often before it is gone); the share
  // is what sets it.
  {
    for (float hz : {440.0f, 220.0f}) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kFeed, 1.0f);
      device.set_param(p::kDecay, 4.0f);
      std::vector<float> note(40 * 48000, 0.0f);
      for (size_t i = 0; i < 3 * 48000; ++i) {
        const double edge = std::min(1.0, std::min(i / 2400.0, (3 * 48000 - i) / 2400.0));
        note[i] = static_cast<float>(0.4 * edge * std::sin(2.0 * kPi * hz * static_cast<double>(i) / kRate));
      }
      Stereo out = run(device, note);
      const double held = db(rms(out.left, 2 * 48000, 3 * 48000));
      size_t from = 3 * 48000;
      const size_t span = 2 * 48000;
      while (from + span + 4800 < out.left.size() && db(rms(out.left, from, from + span)) > held - 40.0) from += 4800;
      double power = 0.0, lean = 0.0;
      for (int cents = -300; cents <= 300; cents += 10) {
        const double level = tone_level(out.left, hz * std::pow(2.0, cents / 1200.0), kRate, from, from + span);
        power += level * level;
        lean += level * level * cents;
      }
      lean /= power;
      std::printf("haze: top of Feed, Decay 4 s, a %.0f Hz note's tail 40 dB down (%.1f s after the note): %+.0f cents from the note\n",
                  hz, from / 48000.0 - 3.0, lean);
      EXPECT(std::fabs(lean) < 90.0, "the top of Feed leaves the tail within a semitone of the note");
    }
  }

  // Blur 0 keeps the attack: a plucked note through the wall alone with Haze
  // high and Blur at nothing. The wall reaches half of its own peak within a
  // few hundredths of a second of the pluck, and its first hundredth is not
  // far under a clean wall's. (The level under the fuzz was read over 25 ms
  // and nothing else, so the gain stood high through the attack and the fuzz
  // flattened it: half of the peak came 144 ms after the pluck.)
  {
    std::vector<float> pluck(48000, 0.0f);
    for (size_t i = 4800; i < pluck.size(); ++i) {
      const double t = (i - 4800) / 48000.0;
      double wave = 0.0;
      for (int k = 1; k <= 6; ++k) wave += std::sin(2.0 * kPi * 220.0 * k * t) / k * std::exp(-t * k * 0.8);
      pluck[i] = static_cast<float>(0.36 * std::min(1.0, t / 0.002) * std::exp(-t / 0.5) * wave);
    }
    double half[2] = {0.0, 0.0}, first[2] = {0.0, 0.0};
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kBlur, 0.0f);
      device.set_param(p::kDecay, 3.5f);
      device.set_param(p::kOctave, 0.0f);
      device.set_param(p::kHaze, k == 0 ? 0.9f : 0.0f);
      Stereo out = run(device, pluck);
      const double most = peak(out.left, 4800, 4800 + 19200);
      half[k] = 400.0;
      for (size_t at = 4800; at < 4800 + 19200; at += 24) {
        if (peak(out.left, at, at + 96) >= 0.5 * most) {
          half[k] = (at - 4800) / 48.0;
          break;
        }
      }
      first[k] = db(peak(out.left, 4800, 4800 + 480));
    }
    std::printf("haze: a plucked note through the wall alone at Blur 0: half of the wall's peak %.1f ms after the pluck at Haze 0.9 (%.1f ms clean); the first 10 ms %+.1f dB against a clean wall's\n",
                half[0], half[1], first[0] - first[1]);
    EXPECT(half[0] < 60.0, "Blur 0 keeps the attack through the fuzz");
    EXPECT(first[0] - first[1] > -14.0, "the fuzz does not swallow the first hundredth of a second");
  }

  // The very front of an attack: a sample that stands far over the 25 ms
  // level is divided by itself (to kAttackReach on the curve) and not by the
  // level, which has not caught up. A high plucked note through the wall
  // alone at Haze 0.9, Blur 0: the wall's first 3 ms against a clean wall's.
  // (Divided by the level alone, the curve flattens the front to the level of
  // what came before it: 9 dB lower.)
  {
    std::vector<float> pluck(24000, 0.0f);
    for (size_t i = 4800; i < pluck.size(); ++i) {
      const double t = (i - 4800) / 48000.0;
      double wave = 0.0;
      for (int k = 1; k <= 6; ++k) wave += std::sin(2.0 * kPi * 880.0 * k * t) / k * std::exp(-t * k * 0.8);
      pluck[i] = static_cast<float>(0.18 * std::min(1.0, t / 0.002) * std::exp(-t / 0.3) * wave);
    }
    double front[2] = {0.0, 0.0};
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kBlur, 0.0f);
      device.set_param(p::kOctave, 0.0f);
      device.set_param(p::kHaze, k == 0 ? 0.9f : 0.0f);
      Stereo out = run(device, pluck);
      front[k] = db(peak(out.left, 4800, 4800 + 144));
    }
    std::printf("haze: the first 3 ms of a high plucked note through the wall alone at Blur 0: %+.1f dB at Haze 0.9 against a clean wall's\n",
                front[0] - front[1]);
    EXPECT(front[0] - front[1] > -12.5, "the front of an attack is not flattened to the level before it");
  }

  // The wall answers at once at a part-way Mix too: the fuzz itself is part
  // of the wall, so what the device adds to the dry sound begins with the
  // sound, not with the lines' first return 45 ms later. A click at Mix 0.5,
  // clean: the output less the dry share, in the 20 ms after the click,
  // against the click.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.5f);
    device.set_param(p::kHaze, 0.0f);
    device.set_param(p::kBlur, 0.0f);
    device.set_param(p::kOctave, 0.0f);
    std::vector<float> click(24000, 0.0f);
    for (size_t i = 0; i < 48; ++i) click[4800 + i] = static_cast<float>(0.5 * std::sin(kPi * i / 48.0));
    Stereo out = run(device, click);
    double most = 0.0;
    for (size_t i = 4800; i < 4800 + 960; ++i) {
      most = std::max(most, std::fabs(double(out.left[i]) - std::sqrt(0.5) * click[i]));
    }
    std::printf("haze: at Mix 0.5 the wall's part in the 20 ms after a click: %.1f dB against the click\n", db(most / 0.5));
    EXPECT(db(most / 0.5) > -30.0, "the wall answers at once at a part-way Mix");
  }

  // The wall alone answers every note: held sines on every semitone of the
  // piano up to C7, Mix 1 and the rest as the device starts, the power of the
  // two sides over three seconds against the note's own. (The first version
  // stood from 35 dB under to 9 dB over by the note, 18 dB down at A0, with a
  // spread of 6.5 dB: its first reverb was mixed with the sound itself, which
  // combs, and its bass had only the lines' few resonances to stand on.)
  {
    double lowest = 1.0e9, highest = -1.0e9, sum = 0.0, squares = 0.0, bass = 1.0e9;
    int lowest_note = 0, highest_note = 0, count = 0;
    for (int note = 21; note <= 96; ++note) {
      const float hz = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      Stereo out = run(device, sine(hz, 5.0f, kRate, 0.25f));
      const double left = rms(out.left, 2 * 48000, 5 * 48000), right = rms(out.right, 2 * 48000, 5 * 48000);
      const double level = 10.0 * std::log10(0.5 * (left * left + right * right)) - db(0.25 / std::sqrt(2.0));
      if (note < 28) bass = std::min(bass, level);
      if (level < lowest) {
        lowest = level;
        lowest_note = note;
      }
      if (level > highest) {
        highest = level;
        highest_note = note;
      }
      sum += level;
      squares += level * level;
      ++count;
    }
    const double mean_level = sum / count;
    const double spread = std::sqrt(squares / count - mean_level * mean_level);
    std::printf("haze: the wall alone, held notes A0 to C7 by the semitone: %+.1f dB (note %d) to %+.1f dB (note %d), mean %+.1f, spread %.2f dB; A0 to D#1 no lower than %+.1f dB\n",
                lowest, lowest_note, highest, highest_note, mean_level, spread, bass);
    // (The swept wall: 5.3 dB under to 2.2 dB over, a spread of 1.95 dB, the
    // bottom notes 5.3 dB under.)
    EXPECT(lowest > -3.0 && highest < 2.0, "the wall alone answers every semitone within 3 dB");
    EXPECT(spread < 1.0, "the wall alone is even over the notes");
    EXPECT(bass > -3.0, "the wall alone keeps the bottom octave");
    EXPECT(mean_level > -1.5 && mean_level < 1.5, "the wall alone is as loud as the note");
  }

  // Blur is flat too: the same over two octaves of semitones at full Blur and
  // at a quarter, where the first version's crossfade combed most.
  {
    for (float blur : {0.25f, 1.0f}) {
      double lowest = 1.0e9, highest = -1.0e9;
      for (int note = 45; note <= 69; ++note) {
        const float hz = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
        device.init(kRate);
        device.set_param(p::kMix, 1.0f);
        device.set_param(p::kBlur, blur);
        Stereo out = run(device, sine(hz, 5.0f, kRate, 0.25f));
        const double left = rms(out.left, 2 * 48000, 5 * 48000), right = rms(out.right, 2 * 48000, 5 * 48000);
        const double level = 10.0 * std::log10(0.5 * (left * left + right * right)) - db(0.25 / std::sqrt(2.0));
        lowest = std::min(lowest, level);
        highest = std::max(highest, level);
      }
      std::printf("haze: the wall alone at Blur %.2f, A2 to A4 by the semitone: %+.1f to %+.1f dB\n", blur, lowest, highest);
      EXPECT(lowest > -1.5 && highest < 2.0, "Blur does not comb the notes");
    }
  }

  // Tone is not a volume knob on a held chord: the wall alone at Tone 0 and 1
  // against the middle. (With the tilt adding 3 dB of lows at Tone 0 a chord
  // under 1 kHz left 2.7 dB louder.)
  {
    double level[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kTone, settings[k]);
      Stereo out = run(device, chord(20.0f, 0.2f));
      const double left = rms(out.left, 8 * 48000, 20 * 48000), right = rms(out.right, 8 * 48000, 20 * 48000);
      level[k] = 10.0 * std::log10(0.5 * (left * left + right * right));
    }
    std::printf("haze: a held chord through the wall alone at Tone 0, 0.5, 1: %.1f, %.1f, %.1f dB\n", level[0], level[1], level[2]);
    EXPECT(std::fabs(level[0] - level[1]) < 1.5, "a dark wall is not a louder one");
    EXPECT(level[2] - level[1] < 1.0 && level[2] - level[1] > -3.0, "a bright wall is not a louder one");
  }

  // A held note holds. The bank's thirteen notes of three partials, each held
  // for eight seconds: the output by quarter seconds, as the power of the two
  // sides and folded to mono, against the dry note; and the left against the
  // right. (The swept wall at the default: 7.3 dB down at the worst quarter
  // second, 9.1 in mono, and up to 9.0 dB to one side.)
  {
    struct Setting {
      const char* name;
      float mix, size, decay, width;
      double low, high, mono_low, mono_high, lean;
    };
    const Setting settings[] = {{"the default", 0.45f, 0.6f, 6.0f, 1.0f, -2.0, 2.0, -2.5, 1.5, 2.0},
                                {"the wall alone", 1.0f, 0.6f, 6.0f, 1.0f, -2.5, 2.5, -4.0, 1.5, 2.5},
                                {"a small wall and a long Decay at Mix 0.7", 0.7f, 0.0f, 20.0f, 1.0f, -2.5, 2.5, -4.0, 1.5, 2.5},
                                {"a mono wall at Mix 0.7", 0.7f, 0.6f, 6.0f, 0.0f, -2.5, 2.0, -2.5, 2.0, 0.01}};
    for (const Setting& setting : settings) {
      Steady steady;
      for (int note : kHeldNotes) {
        device.init(kRate);
        device.set_param(p::kMix, setting.mix);
        device.set_param(p::kSize, setting.size);
        device.set_param(p::kDecay, setting.decay);
        device.set_param(p::kWidth, setting.width);
        const std::vector<float> dry = held_note(note, 8.0f, kRate);
        steady.take(dry, run(device, dry), kRate);
      }
      std::printf("haze: held notes A2 to A5 through %s: the two sides %+.1f to %+.1f dB by the quarter second, the fold to mono %+.1f to %+.1f dB, left against right within %.1f dB\n",
                  setting.name, steady.lowest, steady.highest, steady.mono_lowest, steady.mono_highest, steady.lean);
      char label[160];
      std::snprintf(label, sizeof label, "a held note holds through %s, in stereo", setting.name);
      EXPECT(steady.lowest > setting.low && steady.highest < setting.high, label);
      std::snprintf(label, sizeof label, "a held note holds through %s, folded to mono", setting.name);
      EXPECT(steady.mono_lowest > setting.mono_low && steady.mono_highest < setting.mono_high, label);
      std::snprintf(label, sizeof label, "a held note in the middle stays in the middle through %s", setting.name);
      EXPECT(steady.lean < setting.lean, label);
    }
  }

  // The same at 44.1 and 96 kHz (four of the notes): what holds the wall goes
  // by seconds, not samples.
  {
    for (float rate : {44100.0f, 96000.0f}) {
      Steady steady;
      for (int note : {45, 57, 64, 76}) {
        device.init(rate);
        const std::vector<float> dry = held_note(note, 8.0f, rate);
        steady.take(dry, run(device, dry), rate);
      }
      std::printf("haze: held notes at %.0f Hz: the two sides %+.1f to %+.1f dB, the fold to mono %+.1f to %+.1f dB, left against right within %.1f dB\n",
                  rate, steady.lowest, steady.highest, steady.mono_lowest, steady.mono_highest, steady.lean);
      EXPECT(steady.lowest > -2.5 && steady.highest < 2.0 && steady.mono_lowest > -3.5 && steady.mono_highest < 1.5 &&
                 steady.lean < 2.0,
             "a held note holds at 44.1 and 96 kHz as at 48");
    }
  }

  // The top of Feed under a held note ("Feedback cloud"): what has been round
  // comes back a few hertz flat and beats against the note, which is Feed's
  // own movement; it stays a few dB. (The swept wall: 11 dB down in mono.)
  {
    const float values[p::kNumParams] = {0.65f, 0.6f, 4.0f, 0.5f, 0.6f, 0.45f, 0.2f, 1.0f, 1.0f};
    Steady steady;
    for (int note : kHeldNotes) {
      device.init(kRate);
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, values[id]);
      const std::vector<float> dry = held_note(note, 8.0f, kRate);
      steady.take(dry, run(device, dry), kRate);
    }
    std::printf("haze: held notes at the top of Feed: the two sides %+.1f to %+.1f dB, the fold to mono %+.1f to %+.1f dB\n",
                steady.lowest, steady.highest, steady.mono_lowest, steady.mono_highest);
    EXPECT(steady.lowest > -4.5 && steady.highest < 4.5, "the top of Feed moves a held note by a few dB and no more");
    EXPECT(steady.mono_lowest > -6.5, "the top of Feed does not empty the fold to mono");
  }

  // A played line stays in the middle: the thirteen notes one after another,
  // half a second each, through a dark wall with Feed ("Wool blanket"); the
  // left against the right over the whole. (With the wall's side filled by
  // the quarter turn of its middle and nothing more, the whole line sat 3 dB
  // to the right: that quarter turn is the dry sound over again.)
  {
    const float values[p::kNumParams] = {0.7f, 0.8f, 8.0f, 0.45f, 0.6f, 0.1f, 0.0f, 0.3f, 1.0f};
    std::vector<float> line;
    for (int note : kHeldNotes) {
      std::vector<float> one = held_note(note, 0.5f, kRate);
      for (size_t i = 0; i < 480; ++i) one[one.size() - 1 - i] *= static_cast<float>(i) / 480.0f;
      line.insert(line.end(), one.begin(), one.end());
    }
    line.resize(line.size() + 72000, 0.0f);
    device.init(kRate);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, values[id]);
    Stereo out = run(device, line);
    const double lean = db(rms(out.left) / rms(out.right));
    std::printf("haze: a played line through a dark wall with Feed: the left %+.2f dB against the right\n", lean);
    EXPECT(std::fabs(lean) < 0.7, "a played line in the middle stays in the middle");
  }

  // The wall hangs: each of the thirteen notes held three seconds through the
  // wall alone and let go; a quarter to a half second later the wall is still
  // within a few dB of the note, and it goes on falling. (The swept wall hung
  // 7.2 dB under on average, 13.7 under at the worst note.)
  {
    double hang = 0.0, later = 0.0, lowest = 1.0e9;
    for (int note : kHeldNotes) {
      std::vector<float> dry = held_note(note, 3.0f, kRate);
      const double held = rms(dry, 2 * 48000, 3 * 48000);
      for (size_t i = 0; i < 480; ++i) dry[dry.size() - 1 - i] *= static_cast<float>(i) / 480.0f;
      dry.resize(6 * 48000, 0.0f);
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      Stereo out = run(device, dry);
      const auto both = [&](size_t from, size_t to) {
        const double l = rms(out.left, from, to), r = rms(out.right, from, to);
        return 0.5 * (l * l + r * r) / (held * held);
      };
      const double now = both(3 * 48000 + 12000, 3 * 48000 + 24000);
      hang += now / 13.0;
      later += both(4 * 48000, 5 * 48000) / 13.0;
      lowest = std::min(lowest, 10.0 * std::log10(now));
    }
    std::printf("haze: the wall alone a quarter to a half second after a held note is let go: %.1f dB against the note (%.1f at the worst note), %.1f dB a second later\n",
                10.0 * std::log10(hang), lowest, 10.0 * std::log10(later));
    EXPECT(10.0 * std::log10(hang) > -6.0 && lowest > -12.0, "the wall hangs when a held note is let go");
    EXPECT(later < hang * 0.3, "and goes on falling");
  }

  // The quarter-turn pair the wall is turned by: its two outputs stand a
  // quarter turn apart, and as loud as each other, from 20 Hz to the same
  // distance under half the rate, at 44.1, 48 and 96 kHz.
  {
    double worst = 0.0, uneven = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (double hz : {20.0, 27.5, 41.2, 82.4, 220.0, 1000.0, 5000.0, 15000.0, 0.5 * rate - 20.0}) {
        livemix::haze_dsp::Quadrature pair;
        pair.init(rate);
        const int frames = static_cast<int>(rate * 3.0f);
        double ss = 0.0, qq = 0.0, sq = 0.0;
        for (int i = 0; i < frames; ++i) {
          float same, quarter;
          pair.process(static_cast<float>(0.5 * std::sin(2.0 * kPi * hz * i / rate)), &same, &quarter);
          if (i < frames / 3) continue;
          ss += static_cast<double>(same) * same;
          qq += static_cast<double>(quarter) * quarter;
          sq += static_cast<double>(same) * quarter;
        }
        worst = std::max(worst, std::fabs(std::asin(sq / std::sqrt(ss * qq))) * 180.0 / kPi);
        uneven = std::max(uneven, std::fabs(std::sqrt(qq / ss) - 1.0));
      }
    }
    std::printf("haze: the quarter-turn pair, 20 Hz to 20 Hz under half the rate at 44.1, 48 and 96 kHz: within %.2f degrees, levels within %.3f %%\n",
                worst, uneven * 100.0);
    EXPECT(worst < 2.0, "the pair is a quarter turn within two degrees at every rate");
    EXPECT(uneven < 0.01, "and its two outputs are as loud as each other");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("haze", 10.0f, kRate, [&] { run(device, input); });

  return finish("haze");
}
