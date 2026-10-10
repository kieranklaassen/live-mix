// Native harness for Sine Shadow (cpp/devices/sine-shadow). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a shadow of sines: which
// partials are followed, at what pitch and level, how they swell and linger,
// and that sound and shadow never cancel.

#include "../devices/sine-shadow/sine_shadow.h"
#include "../kit/fft.h"
#include "support/test_kit.h"

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
    for (float steady : {0.0f, 0.15f, 0.3f}) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kSteady, steady);
      const Stereo out = run(device, hiss);
      shadow[which++] = db(both(out, at(2.0)) / rms(hiss));
    }
    std::printf("noise in, shadow against it: Steady 0 %.1f dB, 0.15 %.1f dB, 0.3 %.1f dB\n", shadow[0], shadow[1],
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

  // PART 5

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("sine-shadow", 10.0f, kRate, [&] { run(device, input); });

  return finish("sine-shadow");
}
