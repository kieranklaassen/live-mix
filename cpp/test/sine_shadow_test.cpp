// Native harness for Sine Shadow (cpp/devices/sine-shadow). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a shadow of sines: which
// partials are followed, at what pitch and level, how they swell and linger,
// and that sound and shadow never cancel.

#include "../devices/sine-shadow/sine_shadow.h"
#include "../kit/fft.h"
#include "support/test_kit.h"

#include <limits>

using namespace testkit;
using livemix::SineShadow;
namespace p = livemix::sine_shadow;

static SineShadow device;

static const float kRate = 48000.0f;

// The device with the shadow alone, every sine in the middle, no wait.
static void wet_only(SineShadow& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kSteady, 0.0f);
}

// A sum of sines: frequencies and gains, phases from a fixed sequence.
static std::vector<float> tones(const std::vector<double>& hz, const std::vector<double>& gain, float seconds,
                                float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (size_t t = 0; t < hz.size(); ++t) {
    const double start = 0.37 * static_cast<double>(t * t + 1);
    for (size_t i = 0; i < out.size(); ++i) {
      out[i] += static_cast<float>(gain[t] * std::sin(2.0 * kPi * hz[t] * static_cast<double>(i) / rate + start));
    }
  }
  return out;
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// A harmonic tone: `count` harmonics of f0, harmonic h at gain / h^fall.
static std::vector<float> harmonics(double f0, int count, double gain, double fall, float seconds, float rate = kRate) {
  std::vector<double> hz, level;
  for (int h = 1; h <= count; ++h) {
    hz.push_back(f0 * h);
    level.push_back(gain / std::pow(static_cast<double>(h), fall));
  }
  return tones(hz, level, seconds, rate);
}

// The sines in a stretch of sound: the peaks of a Hann-windowed spectrum of 32768 points from `from`, at or
// above `floor` (1 is a full-scale sine), strongest first. The frequency is from a parabola through the log of
// three bins (good to 0.1 cent for a steady sine), the level from their power (a Hann lobe leaves 98 % of its
// power or more in three bins: good to 0.1 dB).
struct Tone {
  double hz;
  double level;
};
static livemix::kit::Fft<32768> spectrum_fft;
static float spectrum_re[32768], spectrum_im[32768];
static std::vector<Tone> tones_in(const std::vector<float>& x, size_t from, double rate, double floor) {
  const int n = 32768;
  spectrum_fft.init();
  for (int i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * i / n);
    spectrum_re[i] = from + i < x.size() ? static_cast<float>(x[from + i] * w) : 0.0f;
    spectrum_im[i] = 0.0f;
  }
  spectrum_fft.forward(spectrum_re, spectrum_im);
  std::vector<double> size(n / 2);
  for (int k = 0; k < n / 2; ++k) {
    size[k] = std::sqrt(static_cast<double>(spectrum_re[k]) * spectrum_re[k] +
                        static_cast<double>(spectrum_im[k]) * spectrum_im[k]) / (n / 4.0);
  }
  std::vector<Tone> out;
  for (int k = 2; k < n / 2 - 2; ++k) {
    if (size[k] < floor * 0.7 || size[k] <= size[k - 1] || size[k] < size[k + 1]) continue;
    const double a = std::log(size[k - 1] + 1.0e-30), b = std::log(size[k]), c = std::log(size[k + 1] + 1.0e-30);
    const double off = 0.5 * (a - c) / (a - 2.0 * b + c);
    const double level = std::sqrt((size[k - 1] * size[k - 1] + size[k] * size[k] + size[k + 1] * size[k + 1]) / 1.5);
    if (level >= floor) out.push_back({(k + off) * rate / n, level});
  }
  std::sort(out.begin(), out.end(), [](const Tone& p, const Tone& q) { return p.level > q.level; });
  return out;
}

// The tone nearest `hz` among `found`, or one of level 0.
static Tone nearest(const std::vector<Tone>& found, double hz) {
  Tone best{0.0, 0.0};
  for (const Tone& tone : found) {
    if (best.level == 0.0 || std::fabs(cents(tone.hz, hz)) < std::fabs(cents(best.hz, hz))) best = tone;
  }
  return best;
}

// The power of both channels together over a stretch, as a level.
static double both(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  const double l = rms(s.left, from, to), r = rms(s.right, from, to);
  return std::sqrt(0.5 * (l * l + r * r));
}

// The largest second difference: a step in the sound of size s reads s, a sine of amplitude a at f reads
// a (2 pi f / rate)^2. A click detector that a bright steady tone does not hide a small click from.
static double max_bend(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 2; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  }
  return worst;
}

static size_t at(double seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

// The level of a sine over time: the RMS of 10 ms stretches, as an amplitude.
static std::vector<double> envelope(const std::vector<float>& x, float rate = kRate) {
  const size_t step = static_cast<size_t>(0.01f * rate);
  std::vector<double> out;
  for (size_t from = 0; from + step <= x.size(); from += step) out.push_back(rms(x, from, from + step) * std::sqrt(2.0));
  return out;
}

// The frequency of a lone sine cycle by cycle, from its rising zero crossings: the time of each crossing in
// seconds and the frequency of the cycle that ends there.
static void cycles(const std::vector<float>& x, size_t from, std::vector<double>* when, std::vector<double>* hz,
                   float rate = kRate) {
  double last = -1.0;
  for (size_t i = from + 1; i < x.size(); ++i) {
    if (!(x[i - 1] < 0.0f && x[i] >= 0.0f)) continue;
    const double crossing = (static_cast<double>(i - 1) + x[i - 1] / (static_cast<double>(x[i - 1]) - x[i])) / rate;
    if (last >= 0.0) {
      when->push_back(crossing);
      hz->push_back(1.0 / (crossing - last));
    }
    last = crossing;
  }
}

int main() {
  Conformance spec;
  spec.name = "sine-shadow";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Two sines in, two sines out, at the same frequencies and levels, and nothing else: not while they hold,
  // and not while they come in (the splash of a sudden start is many peaks that do not last).
  const std::vector<float> pair = tones({440.0, 660.5}, {0.5, 0.25}, 4.0f);
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    const Stereo out = run(device, pair);
    const std::vector<Tone> held = tones_in(out.left, at(3.0), kRate, 1.0e-3);
    EXPECT(held.size() == 2, "two sines in: two sines out and no others above -60 dB");
    const Tone low = nearest(held, 440.0), high = nearest(held, 660.5);
    std::printf("two sines: %.3f Hz %.2f dB, %.3f Hz %.2f dB\n", low.hz, db(low.level), high.hz, db(high.level));
    EXPECT(std::fabs(cents(low.hz, 440.0)) < 1.0 && std::fabs(cents(high.hz, 660.5)) < 1.0,
           "each within a cent of its partial");
    EXPECT_NEAR(db(low.level), db(0.5), 0.2, "the stronger sine at its partial's level");
    EXPECT_NEAR(db(high.level), db(0.25), 0.2, "the weaker sine at its partial's level");
    const std::vector<Tone> start = tones_in(out.left, 0, kRate, 3.0e-3);
    EXPECT(start.size() <= 2, "nothing else above -50 dB while they come in");
    double apart = 0.0;
    for (size_t i = 0; i < out.size(); ++i) apart = std::max(apart, std::fabs(out.left[i] - (double)out.right[i]));
    EXPECT(apart < 1.0e-6, "a mono sound with no Spread: the same shadow on both sides");
  }

  // Partials 1 follows the stronger of the two and leaves the other.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kPartials, 1.0f);
    const Stereo out = run(device, pair);
    const std::vector<Tone> held = tones_in(out.left, at(3.0), kRate, 1.0e-4);
    EXPECT(held.size() == 1 && std::fabs(cents(held[0].hz, 440.0)) < 1.0,
           "Partials 1: only the stronger sine, nothing else above -80 dB");
  }

  // A followed partial keeps its sine against one that is only a little stronger (kKeep): two sines whose
  // levels cross twice a second, 1 dB either way, and Partials 1 stays on the one it took. One that is clearly
  // stronger takes the sine over.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kPartials, 1.0f);
    device.set_param(p::kAttack, 20.0f);
    device.set_param(p::kRelease, 0.1f);
    std::vector<float> in(at(6.0));
    for (size_t i = 0; i < in.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      const double sway = 1.0 + 0.12 * std::sin(2.0 * kPi * 1.0 * t);
      in[i] = static_cast<float>(0.3 * std::sin(2.0 * kPi * 440.0 * t) + 0.3 * sway * std::sin(2.0 * kPi * 660.0 * t));
    }
    const Stereo out = run(device, in);
    int low = 0, high = 0, other = 0;
    for (double t = 1.5; t < 5.0; t += 0.25) {
      const std::vector<Tone> held = tones_in(out.left, at(t), kRate, 3.0e-3);
      for (const Tone& tone : held) {
        if (std::fabs(cents(tone.hz, 440.0)) < 5.0) ++low;
        else if (std::fabs(cents(tone.hz, 660.0)) < 5.0) ++high;
        else ++other;
      }
    }
    std::printf("two sines crossing by 1 dB, Partials 1: the sine was on 440 Hz %d times, on 660 Hz %d times\n", low,
                high);
    EXPECT(other == 0 && low + high == 14 && (low == 0 || high == 0),
           "a followed partial keeps its sine against one a little stronger");
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kPartials, 1.0f);
    device.set_param(p::kRelease, 0.4f);
    std::vector<float> late = tones({440.0}, {0.2}, 6.0f);
    for (size_t i = at(2.0); i < late.size(); ++i) {
      late[i] += static_cast<float>(0.4 * std::sin(2.0 * kPi * 660.0 * static_cast<double>(i) / kRate));
    }
    const Stereo moved = run(device, late);
    const std::vector<Tone> first = tones_in(moved.left, at(1.0), kRate, 1.0e-3);
    const std::vector<Tone> then = tones_in(moved.left, at(5.0), kRate, 1.0e-3);
    EXPECT(first.size() == 1 && std::fabs(cents(first[0].hz, 440.0)) < 1.0, "Partials 1: the only sine is followed");
    EXPECT(then.size() == 1 && std::fabs(cents(then[0].hz, 660.0)) < 1.0,
           "a partial twice as strong comes in: the sine goes to it and the first one's is let go");
  }

  // A tone of 20 harmonics comes out with exactly Partials of them: the strongest.
  for (int count : {1, 5, 12, 24}) {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kPartials, static_cast<float>(count));
    const Stereo out = run(device, harmonics(220.0, 20, 0.3, 1.0, 4.0f));
    const std::vector<Tone> held = tones_in(out.left, at(3.0), kRate, 1.0e-3);
    const size_t expected = static_cast<size_t>(count < 20 ? count : 20);
    bool strongest = held.size() == expected;
    for (size_t h = 1; strongest && h <= expected; ++h) {
      const Tone tone = nearest(held, 220.0 * h);
      strongest = std::fabs(cents(tone.hz, 220.0 * h)) < 2.0 && std::fabs(db(tone.level) - db(0.3 / h)) < 0.3;
    }
    char label[96];
    std::snprintf(label, sizeof label, "20 harmonics, Partials %d: the %zu strongest, at their levels (found %zu)",
                  count, expected, held.size());
    EXPECT(strongest, label);
  }

  // Transpose moves every sine by its semitones and leaves its level.
  for (int semitones : {-12, -5, 7, 12, 24}) {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kTranspose, static_cast<float>(semitones));
    const Stereo out = run(device, tones({196.0, 311.13}, {0.4, 0.3}, 4.0f));
    const std::vector<Tone> held = tones_in(out.left, at(3.0), kRate, 1.0e-3);
    const double ratio = std::pow(2.0, semitones / 12.0);
    const Tone low = nearest(held, 196.0 * ratio), high = nearest(held, 311.13 * ratio);
    char label[96];
    std::snprintf(label, sizeof label, "Transpose %d: both sines moved by it (%.2f and %.2f cents off), levels kept",
                  semitones, cents(low.hz, 196.0 * ratio), cents(high.hz, 311.13 * ratio));
    EXPECT(held.size() == 2 && std::fabs(cents(low.hz, 196.0 * ratio)) < 1.0 &&
               std::fabs(cents(high.hz, 311.13 * ratio)) < 1.0 && std::fabs(db(low.level) - db(0.4)) < 0.2 &&
               std::fabs(db(high.level) - db(0.3)) < 0.2,
           label);
  }

  // Snap pulls a tone 40 cents sharp onto the note; half way leaves it 20 cents sharp.
  for (float snap : {0.0f, 0.5f, 1.0f}) {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kSnap, snap);
    const double sharp = 440.0 * std::pow(2.0, 40.0 / 1200.0);
    const Stereo out = run(device, sine(static_cast<float>(sharp), 4.0f, kRate, 0.4f));
    const std::vector<Tone> held = tones_in(out.left, at(3.0), kRate, 1.0e-3);
    const double off = held.empty() ? 1.0e9 : cents(held[0].hz, 440.0);
    char label[96];
    std::snprintf(label, sizeof label, "Snap %.1f: a tone 40 cents sharp comes out %.2f cents sharp", snap, off);
    EXPECT(held.size() == 1 && std::fabs(off - 40.0 * (1.0 - snap)) < 0.5, label);
  }

  // Attack is the time a sine takes from nothing to nine tenths of its partial's level.
  for (float attack : {60.0f, 400.0f, 3000.0f}) {
    wet_only(device);
    device.set_param(p::kAttack, attack);
    const Stereo out = run(device, sine(440.0f, 3.0f * attack * 0.001f + 1.0f, kRate, 0.5f));
    const std::vector<double> level = envelope(out.left);
    size_t first = 0, nine = 0;
    while (first < level.size() && level[first] < 0.005) ++first;
    while (nine < level.size() && level[nine] < 0.45) ++nine;
    const double swell = 10.0 * static_cast<double>(nine - first);
    char label[96];
    std::snprintf(label, sizeof label, "Attack %.0f ms: the sine swells to nine tenths in %.0f ms", attack, swell);
    // The partial's own level is still rising for its first 60 ms, which a short attack shows.
    EXPECT(swell > 0.85 * attack && swell < 1.15 * attack + 70.0, label);
  }

  // Release is the time a sine takes to fall 60 dB once its partial has gone.
  for (float release : {0.4f, 3.0f, 12.0f}) {
    wet_only(device);
    device.set_param(p::kRelease, release);
    run(device, sine(440.0f, 1.5f, kRate, 0.5f));
    const Stereo tail = render(device, release + 1.0f, kRate);
    const double fall = rt60(tail.left, kRate, 0.2, 0.05, -100.0);
    char label[96];
    std::snprintf(label, sizeof label, "Release %.1f s: the sine falls 60 dB in %.2f s", release, fall);
    EXPECT(fall > 0.93 * release && fall < 1.07 * release, label);
  }

  // No clicks when partials are dropped and picked up: Partials 12 to 3 and back under a held tone, with the
  // fastest attack and release, against the same tone with nothing moved. A sine cut off at the level of the
  // weakest partial would bend the wave by 0.025; an envelope that starts or ends bends it by 0.0007.
  {
    const std::vector<float> tone = harmonics(220.0, 20, 0.3, 1.0, 1.0f);
    Stereo moved, still;
    for (int pass = 0; pass < 2; ++pass) {
      wet_only(device);
      device.set_param(p::kAttack, 20.0f);
      device.set_param(p::kRelease, 0.1f);
      device.set_param(p::kPartials, 12.0f);
      run(device, tone);
      run(device, tone);
      Stereo& out = pass == 0 ? moved : still;
      for (int step = 0; step < 4; ++step) {
        if (pass == 0) device.set_param(p::kPartials, step % 2 == 0 ? 3.0f : 12.0f);
        out = concat(out, run(device, tone));
      }
    }
    const double with = max_bend(moved.left), without = max_bend(still.left);
    std::printf("partials dropped and picked up: bend %.5f, nothing moved %.5f\n", with, without);
    EXPECT(with < without + 0.0015, "no click when partials are dropped and picked up");
    EXPECT(tone_level(moved.left, 880.0, kRate, at(0.5), at(1.0)) <
               0.01 * tone_level(still.left, 880.0, kRate, at(0.5), at(1.0)),
           "and the dropped ones did go (the check above is not of nothing)");
  }

  // Transpose moved under a held chord glides: no click at the fastest Glide or at the default, against the
  // chord held at either setting.
  for (float glide : {5.0f, 40.0f}) {
    // Whole numbers of hertz and of seconds: the chord runs on unbroken from one stretch to the next.
    const std::vector<float> chord = tones({196.0, 311.0, 466.0}, {0.3, 0.25, 0.2}, 1.0f);
    double bend[3] = {0.0, 0.0, 0.0};
    for (int pass = 0; pass < 3; ++pass) {
      wet_only(device);
      device.set_param(p::kGlide, glide);
      if (pass == 2) device.set_param(p::kTranspose, 7.0f);
      run(device, chord);
      run(device, chord);
      if (pass == 0) device.set_param(p::kTranspose, 7.0f);
      Stereo out = run(device, chord);
      if (pass == 0) device.set_param(p::kTranspose, 0.0f);
      out = concat(out, run(device, chord));
      bend[pass] = max_bend(out.left);
    }
    char label[112];
    std::snprintf(label, sizeof label, "Transpose moved at Glide %.0f ms: bend %.5f, held at 0 %.5f, held at 7 %.5f",
                  glide, bend[0], bend[1], bend[2]);
    EXPECT(bend[0] < 1.05 * std::max(bend[1], bend[2]) + 0.0005, label);
  }

  // Mix moved under a held chord is smoothed: no step much larger than the chord's own (sound and shadow
  // together can step 1.41 times as far; a Mix that jumped would step by a good part of 0.75).
  {
    const std::vector<float> chord = tones({196.0, 311.0, 466.0}, {0.3, 0.25, 0.2}, 1.0f);
    device.init(kRate);
    run(device, chord);
    run(device, chord);
    Stereo moved;
    for (float mix : {1.0f, 0.0f, 0.5f, 1.0f, 0.0f}) {
      device.set_param(p::kMix, mix);
      moved = concat(moved, run(device, chord));
    }
    std::printf("Mix moved: largest step %.4f, the chord's own %.4f\n", max_step(moved.left), max_step(chord));
    EXPECT(max_step(moved.left) < 1.5 * max_step(chord), "a Mix change is smoothed, no click");
  }

  // Steady: noise casts no shadow at the default and a cloud of flickering sines at zero; a held tone waits
  // the time Steady asks for and then gets its sine.
  {
    rng_state() = 0x5EEDu;
    const std::vector<float> hiss = noise(6.0f, kRate, 0.25f);
    double shadow[3];
    int which = 0;
    for (float steady : {0.0f, 0.1f, 0.2f}) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kSteady, steady);
      const Stereo out = run(device, hiss);
      shadow[which++] = db(both(out, at(2.0)) / rms(hiss));
    }
    std::printf("noise in, shadow against it: Steady 0 %.1f dB, 0.1 %.1f dB, 0.2 %.1f dB\n", shadow[0], shadow[1],
                shadow[2]);
    EXPECT(shadow[0] > -20.0, "Steady 0: noise casts a shadow of flickering sines");
    EXPECT(shadow[1] < shadow[0] - 4.0 && shadow[1] > shadow[2] + 4.0, "Steady thins it by degrees");
    EXPECT(shadow[2] < -35.0, "Steady at its default: noise casts no shadow to speak of");
    for (float steady : {0.5f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kSpread, 0.0f);
      device.set_param(p::kSteady, steady);
      device.set_param(p::kAttack, 20.0f);
      const Stereo out = run(device, sine(440.0f, 3.0f, kRate, 0.5f));
      const std::vector<double> level = envelope(out.left);
      size_t first = 0;
      while (first < level.size() && level[first] < 0.005) ++first;
      const double wait = 0.01 * static_cast<double>(first), asked = 1.5 * steady * steady;
      char label[112];
      std::snprintf(label, sizeof label, "Steady %.1f asks a partial to last %.2f s: the sine begins %.2f s in", steady,
                    asked, wait);
      // The tone is a partial from its fourth frame (85 ms), and holds from the one after.
      EXPECT(wait > asked + 0.05 && wait < asked + 0.2, label);
      EXPECT_NEAR(db(level[level.size() - 1]), db(0.5), 0.2, "and reaches its level");
    }
  }

  // Glide: after Transpose jumps an octave, the sine is 63 % of the way there (in hertz) one Glide later.
  for (float glide : {20.0f, 500.0f}) {
    wet_only(device);
    device.set_param(p::kGlide, glide);
    const std::vector<float> tone = sine(330.0f, 1.0f, kRate, 0.4f);
    run(device, tone);
    run(device, tone);
    device.set_param(p::kTranspose, 12.0f);
    Stereo out = run(device, tone);
    out = concat(out, run(device, tone));
    std::vector<double> when, hz;
    cycles(out.left, 0, &when, &hz);
    double reached = -1.0;
    for (size_t i = 0; i < hz.size() && reached < 0.0; ++i) {
      if (hz[i] >= 330.0 + 0.632 * 330.0) reached = when[i] - 0.5 / hz[i];  // the middle of that cycle
    }
    char label[96];
    std::snprintf(label, sizeof label, "Glide %.0f ms: 63 %% of an octave jump after %.1f ms", glide, 1000.0 * reached);
    EXPECT(reached > 0.001 * glide * 0.85 - 0.002 && reached < 0.001 * glide * 1.15 + 0.003, label);
    EXPECT_NEAR(hz.back(), 660.0 - 330.0 * std::exp(-2000.0 / glide), 0.3, "and it goes on to arrive");
  }

  // Glide: a new sine starts at the pitch of the nearest one still sounding. A tone at 330 Hz, then one at
  // 440 Hz: with a long Glide the second sine is still on its way from 330 a quarter of a second in.
  {
    double early[2], late = 0.0;
    int which = 0;
    for (float glide : {5.0f, 1500.0f}) {
      wet_only(device);
      device.set_param(p::kGlide, glide);
      device.set_param(p::kAttack, 20.0f);
      device.set_param(p::kRelease, 0.4f);
      run(device, sine(330.0f, 1.0f, kRate, 0.4f));
      const Stereo out = run(device, sine(440.0f, 6.0f, kRate, 0.4f));
      early[which++] = tone_level(out.left, 440.0, kRate, at(0.25), at(0.5));
      // By the end the first sine has gone and the second is alone: its pitch, cycle by cycle.
      std::vector<double> when, hz;
      cycles(out.left, at(5.9), &when, &hz);
      late = hz.back();
    }
    std::printf("a new sine beside one at 330 Hz: at 440 Hz after 0.25 s, Glide 5 ms %.3f, Glide 1500 ms %.3f;"
                " after 6 s at %.2f Hz\n", early[0], early[1], late);
    EXPECT(early[0] > 0.3 && early[1] < 0.1 * early[0], "a long Glide: the new sine slides in from its neighbour");
    // 110 Hz to go, and four Glides gone by.
    EXPECT(late > 440.0 - 110.0 * std::exp(-5.7 / 1.5) - 0.3 && late < 440.0, "and goes on to its partial");
  }

  // Glide smooths vibrato out of the shadow: a tone that sways 30 cents either way, five times a second.
  {
    std::vector<float> sway(at(4.0));
    double phase = 0.0;
    for (size_t i = 0; i < sway.size(); ++i) {
      phase += 440.0 * std::pow(2.0, 0.3 / 12.0 * std::sin(2.0 * kPi * 5.0 * static_cast<double>(i) / kRate)) / kRate;
      sway[i] = static_cast<float>(0.4 * std::sin(2.0 * kPi * phase));
    }
    double depth[2];
    int which = 0;
    for (float glide : {5.0f, 2000.0f}) {
      wet_only(device);
      device.set_param(p::kGlide, glide);
      const Stereo out = run(device, sway);
      std::vector<double> when, hz;
      cycles(out.left, at(3.0), &when, &hz);
      double low = 1.0e9, high = 0.0;
      for (double f : hz) {
        low = std::min(low, f);
        high = std::max(high, f);
      }
      depth[which++] = 0.5 * cents(high, low);
    }
    std::printf("a tone swaying 30 cents: the sine sways %.1f cents at Glide 5 ms, %.1f at 2 s\n", depth[0], depth[1]);
    EXPECT(depth[0] > 20.0 && depth[0] < 36.0, "a short Glide follows the vibrato");
    EXPECT(depth[1] < 0.1 * depth[0], "a long Glide smooths it out");
  }

  // Spread: with none a mono sound's shadow is in the middle and a one-sided sound's on its side; with all
  // of it every sine has a place of its own, and the shadow's power is what it was.
  {
    const std::vector<float> chord = tones({220.0, 277.18, 329.63, 415.3}, {0.2, 0.2, 0.2, 0.2}, 4.0f);
    const std::vector<float> none(chord.size(), 0.0f);
    wet_only(device);
    const Stereo middle = run(device, chord);
    wet_only(device);
    device.set_param(p::kSpread, 1.0f);
    const Stereo wide = run(device, chord);
    const size_t from = at(3.0);
    EXPECT(correlation(middle.left, middle.right, from) > 0.9999, "no Spread: a mono sound's shadow is mono");
    EXPECT(correlation(wide.left, wide.right, from) < 0.7, "full Spread: the two sides differ");
    EXPECT_NEAR(db(both(wide, from) / both(middle, from)), 0.0, 0.1, "Spread moves the sines and keeps their power");
    double widest = 0.0;
    for (double hz : {220.0, 277.18, 329.63, 415.3}) {
      const double l = tone_level(wide.left, hz, kRate, from), r = tone_level(wide.right, hz, kRate, from);
      widest = std::max(widest, std::fabs(db(l / std::max(r, 1.0e-9))));
      EXPECT_NEAR(std::sqrt(0.5 * (l * l + r * r)), 0.2, 0.01, "each sine keeps its power wherever it is put");
    }
    EXPECT(widest > 9.0, "full Spread: some sine is well to one side");
    wet_only(device);
    const Stereo sided = run(device, chord, none);
    EXPECT(rms(sided.right, from) < 0.001 * rms(sided.left, from), "no Spread: a left-only sound's shadow is on the left");
    EXPECT_NEAR(db(rms(sided.left, from) / rms(chord, from)), 0.0, 0.2, "at the level it has there");
  }

  // A sound that is out of phase between the sides casts the same shadow as one that is not (the spectrum is
  // measured side by side, never from their sum).
  {
    const std::vector<float> chord = tones({220.0, 277.18, 329.63}, {0.25, 0.25, 0.25}, 3.0f);
    std::vector<float> turned(chord.size());
    for (size_t i = 0; i < chord.size(); ++i) turned[i] = -chord[i];
    wet_only(device);
    const Stereo plain = run(device, chord);
    wet_only(device);
    const Stereo across = run(device, chord, turned);
    EXPECT_NEAR(db(both(across, at(2.0)) / both(plain, at(2.0))), 0.0, 0.05, "an anti-phase input keeps its shadow");
  }

  // Tone leans the shadow: dark takes 6 dB an octave off the partials above 300 Hz, bright off those below
  // 2500 Hz, the centre leaves all of them, and none is ever raised. Twelve equal harmonics of 220 Hz.
  {
    const std::vector<float> flat = harmonics(220.0, 12, 0.06, 0.0, 4.0f);
    double low[3], high[3];
    int which = 0;
    for (float tone : {0.0f, 0.5f, 1.0f}) {
      wet_only(device);
      device.set_param(p::kPartials, 24.0f);
      device.set_param(p::kTone, tone);
      const Stereo out = run(device, flat);
      low[which] = db(tone_level(out.left, 220.0, kRate, at(3.0)) / 0.06);
      high[which] = db(tone_level(out.left, 2640.0, kRate, at(3.0)) / 0.06);
      ++which;
    }
    std::printf("Tone dark, centre, bright: the partial at 220 Hz %.1f %.1f %.1f dB, at 2640 Hz %.1f %.1f %.1f dB\n",
                low[0], low[1], low[2], high[0], high[1], high[2]);
    EXPECT_NEAR(low[1], 0.0, 0.2, "Tone at the centre leaves the low partial");
    EXPECT_NEAR(high[1], 0.0, 0.2, "and the high one");
    EXPECT_NEAR(low[0], 0.0, 0.2, "dark leaves the low partial");
    EXPECT_NEAR(high[0], -20.0 * std::log10(2640.0 / 300.0), 0.5, "dark takes 6 dB an octave off above 300 Hz");
    EXPECT_NEAR(high[2], 0.0, 0.2, "bright leaves the high partial");
    EXPECT_NEAR(low[2], -20.0 * std::log10(2500.0 / 220.0), 0.5, "bright takes 6 dB an octave off below 2500 Hz");
    // And it decides which are followed: of twelve equal partials, dark keeps the three lowest and bright the
    // three highest.
    for (float tone : {0.0f, 1.0f}) {
      wet_only(device);
      device.set_param(p::kPartials, 3.0f);
      device.set_param(p::kTone, tone);
      const Stereo out = run(device, flat);
      const std::vector<Tone> held = tones_in(out.left, at(3.0), kRate, 1.0e-3);
      bool right = held.size() == 3;
      for (const Tone& found : held) right = right && (tone == 0.0f ? found.hz < 700.0 : found.hz > 2100.0);
      EXPECT(right, tone == 0.0f ? "dark: the three lowest partials are followed" : "bright: the three highest");
    }
  }

  // Mix 0 is the input, sample for sample and with no delay; Mix 1 has none of it.
  {
    rng_state() = 77;
    const std::vector<float> in = noise(1.0f, kRate, 0.5f);
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    const Stereo dry = run(device, in);
    EXPECT(dry.left == in && dry.right == in, "Mix 0 is the input, bit for bit, with no latency");
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSteady, 1.0f);
    const Stereo wet = run(device, in);
    EXPECT(peak(wet.left) == 0.0 && peak(wet.right) == 0.0, "Mix 1 has nothing of the input in it");
  }

  // Part-way Mix: sound and shadow add as powers, because every sine keeps a quarter turn from its partial.
  // Held tones over the piano's range (A0 to C8, a third apart, and the same a quarter tone sharp) at three
  // settings of Mix: what comes out is as loud as what went in, with no dip and no doubling at any pitch.
  {
    double dip = 0.0, rise = 0.0, dip_hz = 0.0, rise_hz = 0.0;
    for (float mix : {0.25f, 0.5f, 0.75f}) {
      for (int note = 21; note <= 108; note += 3) {
        for (double sharp : {0.0, 0.5}) {
          const double hz = 440.0 * std::pow(2.0, (note + sharp - 69.0) / 12.0);
          const std::vector<float> tone = sine(static_cast<float>(hz), 3.0f, kRate, 0.5f);
          device.init(kRate);
          device.set_param(p::kMix, mix);
          const Stereo out = run(device, tone);
          const double change = db(both(out, at(2.0)) / rms(tone, at(2.0)));
          if (change < dip) {
            dip = change;
            dip_hz = hz;
          }
          if (change > rise) {
            rise = change;
            rise_hz = hz;
          }
        }
      }
    }
    std::printf("held tones A0 to C8 at Mix 0.25, 0.5, 0.75: worst dip %.2f dB (%.1f Hz), worst rise %.2f dB (%.1f Hz)\n",
                dip, dip_hz, rise, rise_hz);
    EXPECT(dip > -0.5, "no held tone dips against its shadow at a part-way Mix");
    EXPECT(rise < 0.5, "and none doubles with it");
  }

  // Level. A full-scale chord held for a minute at the defaults: the peak stays within 6 dB of the input's
  // and nothing grows.
  const std::vector<float> full = tones({220.0, 277.18, 329.63, 415.3}, {0.25, 0.25, 0.25, 0.25}, 60.0f);
  {
    device.init(kRate);
    const Stereo out = run(device, full);
    const double in_peak = peak(full);
    const double early = std::max(peak(out.left, at(5.0), at(15.0)), peak(out.right, at(5.0), at(15.0)));
    const double late = std::max(peak(out.left, at(50.0)), peak(out.right, at(50.0)));
    std::printf("a full-scale chord for a minute: input peak %.3f, output peak %.3f early and %.3f late, level %+.2f dB\n",
                in_peak, early, late, db(both(out, at(50.0)) / rms(full, at(50.0))));
    EXPECT(std::max(early, late) < 2.0 * in_peak, "a held full-scale chord peaks within 6 dB of the input");
    EXPECT(late < 1.02 * early, "and does not grow over a minute");
    EXPECT_NEAR(db(both(out, at(50.0)) / rms(full, at(50.0))), 0.0, 0.3, "and comes out as loud as it went in");
  }
  // The same at each end of every control: 20 s each.
  {
    double worst = 0.0, growth = 0.0;
    int worst_param = -1;
    const std::vector<float> chord(full.begin(), full.begin() + static_cast<long>(at(20.0)));
    const double in_peak = peak(chord);
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int end = 0; end < 2; ++end) {
        device.init(kRate);
        device.set_param(id, end == 0 ? p::kParamMin[id] : p::kParamMax[id]);
        const Stereo out = run(device, chord);
        const double top = std::max(peak(out.left), peak(out.right));
        if (top > worst) {
          worst = top;
          worst_param = id;
        }
        const double mid = std::max(peak(out.left, at(8.0), at(12.0)), peak(out.right, at(8.0), at(12.0)));
        const double last = std::max(peak(out.left, at(16.0)), peak(out.right, at(16.0)));
        // Release at 30 s and Attack at 8 s are still on their way at 12 s: they may rise to the level, not past it.
        growth = std::max(growth, last / std::max(mid, in_peak));
      }
    }
    std::printf("a full-scale chord at each end of every control: worst peak %.3f (param %d), input %.3f\n", worst,
                worst_param, in_peak);
    EXPECT(worst < 2.0 * in_peak, "at each end of every control the chord peaks within 6 dB of the input");
    EXPECT(growth < 1.5, "and never grows");
  }
  // A full-scale saw: its 24 strongest partials would sum to 2.4 if they all came to a head at once, as they
  // do in the saw itself a quarter turn on. Every note keeps to its own side of the phase, so they do not.
  for (float mix : {0.5f, 1.0f}) {
    std::vector<float> saw(at(4.0));
    for (size_t i = 0; i < saw.size(); ++i) {
      const double phase = std::fmod(110.0 * static_cast<double>(i) / kRate, 1.0);
      saw[i] = static_cast<float>(2.0 * phase - 1.0);
    }
    device.init(kRate);
    device.set_param(p::kMix, mix);
    device.set_param(p::kPartials, 24.0f);
    device.set_param(p::kSpread, 0.0f);
    const Stereo out = run(device, saw);
    char label[96];
    std::snprintf(label, sizeof label, "a full-scale saw at Mix %.1f, 24 partials: peak %.3f", mix, peak(out.left, at(2.0)));
    EXPECT(peak(out.left, at(2.0)) < 1.5, label);
  }
  // Sines that linger cannot pile up without end: forty full-scale notes, each left to linger for 30 s under
  // the next. The ceiling holds the sum of the sines' levels, and with it the shadow's peak, at kCeiling.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kSteady, 0.0f);
    device.set_param(p::kAttack, 20.0f);
    device.set_param(p::kRelease, 30.0f);
    device.set_param(p::kPartials, 24.0f);
    Stereo out;
    for (int note = 0; note < 40; ++note) {
      const double hz = 110.0 * std::pow(2.0, ((note * 7) % 36) / 12.0 + 0.013 * note);
      out = concat(out, run(device, sine(static_cast<float>(hz), 0.25f, kRate, 1.0f)));
    }
    const double top = std::max(peak(out.left), peak(out.right));
    std::printf("forty full-scale notes left to linger: the shadow peaks at %.3f, level %.3f\n", top, both(out, at(8.0)));
    EXPECT(top <= SineShadow::kCeiling * 1.0001, "the shadow's peak is held at the ceiling however many sines linger");
    EXPECT(top > 1.2, "and the ceiling was reached (the check above is not of nothing)");
  }

  // Bad input: not-a-number, infinity and 1e30 go in as silence, on the dry side too. The output stays finite,
  // and the device is itself again once they have left the frame.
  {
    std::vector<float> good = tones({220.0, 330.0}, {0.3, 0.2}, 4.0f);
    std::vector<float> bad = good;
    bad[at(1.0)] = std::nanf("");
    bad[at(1.0) + 1] = std::numeric_limits<float>::infinity();
    bad[at(1.0) + 2] = -1.0e30f;
    bad[at(1.0) + 3] = 1.0e30f;
    device.init(kRate);
    const Stereo clean = run(device, good);
    device.init(kRate);
    const Stereo hurt = run(device, bad);
    EXPECT(finite(hurt.left) && finite(hurt.right), "NaN, infinity and 1e30 in: finite out");
    EXPECT(peak(hurt.left) < 1.5, "and bounded");
    double off = 0.0;
    for (size_t i = at(3.0); i < good.size(); ++i) off = std::max(off, std::fabs(hurt.left[i] - (double)clean.left[i]));
    std::printf("bad input: two seconds on, the output is within %.2g of what it would have been\n", off);
    EXPECT(off < 0.01, "and two seconds on the device is as if they had never come");
    EXPECT_NEAR(db(both(hurt, at(3.0)) / both(clean, at(3.0))), 0.0, 0.05, "at the level it would have had");
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    const Stereo dry = run(device, bad);
    bool same = true;
    for (size_t i = 0; i < bad.size(); ++i) {
      const bool hit = i >= at(1.0) && i < at(1.0) + 4;
      same = same && dry.left[i] == (hit ? 0.0f : good[i]);
    }
    EXPECT(same, "Mix 0 with bad samples: silence for those four and the input for the rest");
  }

  // Block sizes across a silence. A burst, a silence stepped across the moment the device falls asleep (with
  // the shortest Release the last sine is over 0.3 s after the sound and the device sleeps 0.17 s later),
  // and a burst again, at block sizes 128, 1, 2048 and 37.
  {
    double worst = 0.0;
    const std::vector<float> burst = tones({196.0, 311.13, 466.16}, {0.3, 0.25, 0.2}, 0.4f);
    for (float gap = 0.2f; gap < 0.8f; gap += 0.011f) {
      std::vector<float> phrase = burst;
      const std::vector<float> quiet = silence(gap, kRate);
      phrase.insert(phrase.end(), quiet.begin(), quiet.end());
      phrase.insert(phrase.end(), burst.begin(), burst.end());
      Stereo reference;
      for (int block : {128, 1, 2048, 37}) {
        device.init(kRate);
        device.set_param(p::kRelease, 0.1f);
        device.set_param(p::kAttack, 20.0f);
        device.set_param(p::kSteady, 0.1f);
        const Stereo out = run(device, phrase, block);
        if (block == 128) {
          reference = out;
          continue;
        }
        for (size_t i = 0; i < out.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
        }
      }
    }
    std::printf("block sizes across a silence: worst difference %.3g\n", worst);
    EXPECT(worst < 1.0e-6, "the same at block sizes 1, 37, 128 and 2048 across a sleep");
  }

  // Sleep: exact zeros once the last sine is over, and a knob moved in its sleep snaps (it does not glide in
  // under the first sound).
  {
    device.init(kRate);
    run(device, tones({220.0, 330.0}, {0.3, 0.2}, 1.0f));
    render(device, 14.0f, kRate);
    const Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    for (int m = 0; m < 2 * SineShadow::kShown; ++m) EXPECT(device.meter(m) == 0.0f, "asleep: every meter reads 0");
    device.set_param(p::kMix, 0.0f);
    const std::vector<float> tone = sine(440.0f, 0.1f, kRate, 0.5f);
    const Stereo woken = run(device, tone);
    EXPECT(woken.left == tone, "Mix moved to 0 while asleep: the input from the first sample, no glide");
  }

  // A sine that lingers takes its partial up again when the note comes back: one sine, not a second beside
  // it, and it finds its quarter turn again (sound and shadow add as powers within half a second).
  {
    device.init(kRate);
    device.set_param(p::kSpread, 0.0f);
    run(device, sine(440.0f, 1.0f, kRate, 0.5f));
    render(device, 0.6f, kRate);
    std::vector<float> again(at(2.5));
    for (size_t i = 0; i < again.size(); ++i) {
      again[i] = static_cast<float>(0.5 * std::sin(2.0 * kPi * 440.0 * static_cast<double>(i) / kRate + 2.1));
    }
    const Stereo out = run(device, again);
    EXPECT(device.meter(0) > 439.9f && device.meter(0) < 440.1f && device.meter(2) == 0.0f,
           "the note played again: the lingering sine follows it, and no second sine is made");
    const double change = db(both(out, at(1.5)) / rms(again, at(1.5)));
    std::printf("a note played again under its lingering sine: out against in %+.2f dB\n", change);
    EXPECT_NEAR(change, 0.0, 0.3, "and sound and shadow add as powers again");
  }

  // The meters: the sines as they sound, loudest first, a frequency and a level each; reading them changes
  // nothing.
  {
    device.init(kRate);
    device.set_param(p::kSpread, 0.0f);
    const Stereo plain = run(device, pair);
    device.init(kRate);
    device.set_param(p::kSpread, 0.0f);
    Stereo read;
    for (size_t done = 0; done < pair.size(); done += 480) {
      const std::vector<float> piece(pair.begin() + static_cast<long>(done), pair.begin() + static_cast<long>(done + 480));
      read = concat(read, run(device, piece));
      for (int m = 0; m < 2 * SineShadow::kShown; ++m) device.meter(m);
    }
    EXPECT(read.left == plain.left && read.right == plain.right, "reading the meters does not change the sound");
    EXPECT_NEAR(device.meter(0), 440.0, 0.05, "meter 0: the loudest sine's frequency");
    EXPECT_NEAR(device.meter(1), 0.5, 0.005, "meter 1: its level");
    EXPECT_NEAR(device.meter(2), 660.5, 0.05, "meter 2: the next sine's frequency");
    EXPECT_NEAR(device.meter(3), 0.25, 0.005, "meter 3: its level");
    EXPECT(device.meter(4) == 0.0f && device.meter(5) == 0.0f, "no third sine: its meters read 0");
    EXPECT(device.meter(-1) == 0.0f && device.meter(2 * SineShadow::kShown) == 0.0f, "a meter there is not reads 0");
  }

  // Other sample rates: the same sines, in tune and at their levels (at 96 kHz on the longer frame).
  for (float rate : {44100.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    const Stereo out = run(device, tones({440.0, 660.5}, {0.5, 0.25}, 4.0f, rate));
    const std::vector<Tone> held = tones_in(out.left, at(3.0, rate), rate, 1.0e-3);
    const Tone low = nearest(held, 440.0), high = nearest(held, 660.5);
    char label[96];
    std::snprintf(label, sizeof label, "at %.0f Hz: two sines out, in tune and at their levels (%zu found)", rate,
                  held.size());
    EXPECT(held.size() == 2 && std::fabs(cents(low.hz, 440.0)) < 1.0 && std::fabs(cents(high.hz, 660.5)) < 1.0 &&
               std::fabs(db(low.level) - db(0.5)) < 0.2 && std::fabs(db(high.level) - db(0.25)) < 0.2,
           label);
    const Stereo tail = render(device, 14.0f, rate);
    EXPECT(peak(tail.left, at(13.0, rate)) == 0.0, "and it comes to rest");
  }

  // The device comes to rest after any control is moved under a lingering shadow: to its top and then to its
  // bottom, and exact zeros within a minute and a half (Release at its top is 30 s to -60 dB).
  for (int id = 0; id < p::kNumParams; ++id) {
    device.init(kRate);
    run(device, tones({220.0, 330.0, 495.0}, {0.3, 0.2, 0.2}, 1.0f));
    device.set_param(id, p::kParamMax[id]);
    render(device, 0.3f, kRate);
    device.set_param(id, p::kParamMin[id]);
    render(device, 90.0f, kRate);
    const Stereo rest = render(device, 0.5f, kRate);
    char label[96];
    std::snprintf(label, sizeof label, "param %d moved under a lingering shadow: the device comes to rest", id);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, label);
  }

  // Cost. At the defaults on a chord with a little noise in it; and at the worst setting: 24 partials of
  // noise with no wait and the longest release, which keeps all 48 oscillators sounding and gives the frame
  // the most peaks to sort. A frame's work lands in one block, so the worst block is reported too: of 128-frame
  // blocks timed one by one, the 99th percentile (the fastest of three runs, to leave the scheduler out).
  {
    rng_state() = 0xBEEFu;
    std::vector<float> chord = harmonics(110.0, 16, 0.2, 1.0, 10.0f);
    const std::vector<float> hiss = noise(10.0f, kRate, 0.25f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += 0.02f * hiss[i];
    device.init(kRate);
    report_cost("sine-shadow at the defaults", 10.0f, kRate, [&] { run(device, chord); });
    auto worst_setting = [&] {
      device.init(kRate);
      device.set_param(p::kPartials, 24.0f);
      device.set_param(p::kSteady, 0.0f);
      device.set_param(p::kAttack, 20.0f);
      device.set_param(p::kRelease, 30.0f);
    };
    worst_setting();
    report_cost("sine-shadow at its worst (48 sines)", 10.0f, kRate, [&] { run(device, hiss); });
    double best_mean = 1.0e9, best_tail = 1.0e9;
    for (int pass = 0; pass < 3; ++pass) {
      worst_setting();
      std::vector<double> micros;
      for (size_t done = 0; done + 128 <= hiss.size(); done += 128) {
        for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = hiss[done + i];
        const auto start = std::chrono::steady_clock::now();
        device.process(128);
        micros.push_back(std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count());
      }
      double sum = 0.0;
      for (double m : micros) sum += m;
      std::sort(micros.begin(), micros.end());
      best_mean = std::min(best_mean, sum / static_cast<double>(micros.size()));
      best_tail = std::min(best_tail, micros[micros.size() * 99 / 100]);
    }
    std::printf("sine-shadow at its worst, block by block: mean %.1f us (%.2f%%), 99th percentile %.1f us (%.2f%% of a"
                " block's 2667 us) (native)\n", best_mean, 100.0 * best_mean / 2666.7, best_tail, 100.0 * best_tail / 2666.7);
  }

  return finish("sine-shadow");
}
