// Native harness for Sustain (cpp/devices/sustainer). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a sustainer: it catches a note after
// its attack, holds it at pitch and level without pumping, glides or layers
// on the next note, and lets go when told to.

#include "../devices/sustainer/sustainer.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Sustainer;
namespace p = livemix::sustainer;

static Sustainer device;

static const float kRate = 48000.0f;

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

static std::vector<float> add(std::vector<float> a, const std::vector<float>& b) {
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) a[i] += b[i];
  return a;
}

// The held sound alone and at rest: wet only, no motion, no ensemble, flat,
// quick to rise.
static void still(Sustainer& d) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kMotion, 0.0f);
  d.set_param(p::kEnsemble, 0.0f);
  d.set_param(p::kTone, 0.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kAttack, 0.05f);
}

// Spread of the RMS level over consecutive windows of `window` samples, in dB.
static double level_spread_db(const std::vector<float>& x, size_t from, size_t to, size_t window) {
  double lowest = 1.0e9, highest = 0.0;
  for (size_t at = from; at + window <= to; at += window) {
    const double level = rms(x, at, at + window);
    lowest = std::min(lowest, level);
    highest = std::max(highest, level);
  }
  return db(highest / std::max(lowest, 1.0e-12));
}

// A plucked or struck note: decaying harmonics (the higher ones die sooner)
// behind a short burst of noise for the pick or hammer.
static std::vector<float> pluck(float hz, float seconds, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate), 0.0f);
  for (int h = 1; h <= 14; ++h) {
    const double f = hz * h * std::sqrt(1.0 + 0.0002 * h * h);
    if (f > 0.45 * kRate) break;
    const double amp = gain * 0.6 * std::pow(h, -1.1);
    const double tau = 2.2 / std::pow(h, 0.8);
    for (size_t i = 0; i < out.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      out[i] += static_cast<float>(amp * (1.0 - std::exp(-t / 0.0015)) * std::exp(-t / tau) *
                                   std::sin(2.0 * kPi * f * t + h));
    }
  }
  const size_t fade = static_cast<size_t>(0.05 * kRate);
  for (size_t i = 0; i < fade && i < out.size(); ++i) out[out.size() - 1 - i] *= static_cast<float>(i) / fade;
  double low = 0.0;
  for (size_t i = 0; i < out.size() && i < static_cast<size_t>(0.03 * kRate); ++i) {
    const double n = white();
    low = 0.7 * low + 0.3 * n;
    out[i] += static_cast<float>(gain * 0.5 * (n - low) * std::exp(-static_cast<double>(i) / (0.006 * kRate)));
  }
  return out;
}

// Add `src` into `dest` starting at `at_seconds`, growing `dest` as needed.
static void mix_at(std::vector<float>& dest, const std::vector<float>& src, float at_seconds) {
  const size_t at = static_cast<size_t>(at_seconds * kRate);
  if (dest.size() < at + src.size()) dest.resize(at + src.size(), 0.0f);
  for (size_t i = 0; i < src.size(); ++i) dest[at + i] += src[i];
}

// RMS of what lies above `hz` in x[from, to): four second-order highpasses in
// a row (48 dB per octave), so that strong low partials do not leak into the
// reading the way they do through energy_above's single pole.
static double rms_above(const std::vector<float>& x, double hz, size_t from, size_t to) {
  const double w = 2.0 * kPi * hz / kRate, alpha = std::sin(w) / std::sqrt(2.0), c = std::cos(w);
  const double b0 = (1.0 + c) / 2.0 / (1.0 + alpha), b1 = -(1.0 + c) / (1.0 + alpha), b2 = b0;
  const double a1 = -2.0 * c / (1.0 + alpha), a2 = (1.0 - alpha) / (1.0 + alpha);
  double z1[4] = {0, 0, 0, 0}, z2[4] = {0, 0, 0, 0}, sum = 0.0;
  to = std::min(to, x.size());
  for (size_t i = from; i < to; ++i) {
    double v = x[i];
    for (int stage = 0; stage < 4; ++stage) {
      const double y = b0 * v + z1[stage];
      z1[stage] = b1 * v - a1 * y + z2[stage];
      z2[stage] = b2 * v - a2 * y;
      v = y;
    }
    sum += v * v;
  }
  return to > from ? std::sqrt(sum / static_cast<double>(to - from)) : 0.0;
}

// The real FFT helper against a direct DFT, and forward + inverse = N/2 × x.
static void check_real_fft() {
  static livemix::sustainer_detail::RealFft<8192> fft;
  fft.init();
  for (int n : {64, 4096, 8192}) {
    std::vector<float> x(n), re(n / 2 + 1), im(n / 2 + 1), back(n);
    rng_state() = 0xF00Du;
    for (float& v : x) v = white();
    fft.forward(x.data(), re.data(), im.data(), n);
    double worst = 0.0;
    for (int k : {0, 1, 5, n / 4 + 3, n / 2 - 1, n / 2}) {
      double sr = 0.0, si = 0.0;
      for (int i = 0; i < n; ++i) {
        sr += x[i] * std::cos(2.0 * kPi * k * i / n);
        si -= x[i] * std::sin(2.0 * kPi * k * i / n);
      }
      worst = std::max(worst, std::max(std::fabs(sr - re[k]), std::fabs(si - im[k])));
    }
    EXPECT(worst < 2.0e-2, "real FFT matches a direct DFT");
    fft.inverse(re.data(), im.data(), back.data(), n);
    double error = 0.0;
    for (int i = 0; i < n; ++i) error = std::max(error, std::fabs(back[i] / (n * 0.5) - x[i]));
    EXPECT(error < 1.0e-4, "real FFT forward then inverse returns the input times N/2");
  }
}

// A sound with no attack: `hz` partials (each with two weaker overtones)
// that fade in over `swell` seconds and stay.
static std::vector<float> swell_chord(std::initializer_list<float> notes, float seconds, float gain, float swell) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate), 0.0f);
  int index = 0;
  for (float hz : notes) {
    for (int h = 1; h <= 3; ++h) {
      ++index;
      for (size_t i = 0; i < out.size(); ++i) {
        out[i] += static_cast<float>(gain / (h * h) * std::sin(2.0 * kPi * hz * h * i / kRate + 0.7 * index));
      }
    }
  }
  const size_t fade = static_cast<size_t>(0.2f * kRate);
  for (size_t i = 0; i < out.size(); ++i) {
    double env = std::min(1.0, static_cast<double>(i) / (swell * kRate));
    env = env * env * (3.0 - 2.0 * env);
    if (out.size() - i < fade) env *= static_cast<double>(out.size() - i) / fade;
    out[i] *= static_cast<float>(env);
  }
  return out;
}

// How many peaks of the averaged spectrum of x[from, to) stand more than
// `over_db` above the median of the 24 bins around them (12 Hz bins, 200 Hz
// to 6 kHz): the lines of a sound that rings. Steady noise has none.
static int ringing_lines(const std::vector<float>& x, size_t from, size_t to, double over_db) {
  static livemix::sustainer_detail::RealFft<4096> fft;
  static float frame[4096], re[2049], im[2049];
  fft.init();
  std::vector<double> power(2049, 0.0);
  for (size_t at = from; at + 4096 <= to && at + 4096 <= x.size(); at += 2048) {
    for (int n = 0; n < 4096; ++n) frame[n] = x[at + n] * static_cast<float>(0.5 - 0.5 * std::cos(2.0 * kPi * n / 4096.0));
    fft.forward(frame, re, im, 4096);
    for (int k = 0; k <= 2048; ++k) power[k] += re[k] * re[k] + im[k] * im[k];
  }
  int lines = 0;
  for (int k = 17; k < 512; ++k) {
    if (!(power[k] > power[k - 1] && power[k] >= power[k + 1])) continue;
    std::vector<double> near;
    for (int j = k - 12; j <= k + 12; ++j) {
      if (j != k) near.push_back(power[j]);
    }
    std::sort(near.begin(), near.end());
    if (10.0 * std::log10(power[k] / std::max(near[12], 1.0e-30)) > over_db) ++lines;
  }
  return lines;
}

static void check_review_fixes();

int main() {
  check_real_fft();

  Conformance spec;
  spec.name = "sustainer";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // Mix 0 is the dry signal, untouched and not delayed.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(440.0f, 1.0f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i) worst = std::max(worst, std::fabs(out.left[i] - (double)tone[i]));
    EXPECT(worst == 0.0, "Mix 0 passes the input through bit for bit, with no latency");
  }

  // A 440 Hz tone for 1 s, then nothing. With Decay at the top the held tone
  // goes on at 440 Hz, at the level it was caught at, for as long as you like.
  {
    still(device);
    device.set_param(p::kDecay, 60.0f);
    Stereo out = run(device, join(sine(440.0f, 1.0f, kRate, 0.25f), silence(21.0f, kRate)));
    const size_t s = static_cast<size_t>(kRate);
    const double hz = dominant_frequency(out.left, kRate, 400.0, 480.0, 19 * s, 21 * s);
    const double early = db(tone_level(out.left, 440.0, kRate, 2 * s, 3 * s) / 0.25);
    const double late = db(tone_level(out.left, 440.0, kRate, 20 * s, 21 * s) / 0.25);
    std::printf("sustainer: held 440 Hz tone: %.3f Hz after 20 s, level %.2f dB at 2 s and %.2f dB at 20 s re the input\n",
                hz, early, late);
    EXPECT_NEAR(hz, 440.0, 0.2, "the held tone stays at 440 Hz");
    EXPECT_NEAR(early, -2.5, 0.5, "the held tone sits 2.5 dB under the tone it caught");
    EXPECT_NEAR(late, early, 0.1, "held for ever: no fade and no growth over 20 s");
    EXPECT(device.layers() == 1, "one layer is held and keeps the device awake");
    // No pumping at the frame rate (47 Hz) or anywhere else: the level of the
    // held sine, taken over one period of 440 Hz at a time, is flat.
    const double pump = level_spread_db(out.left, 2 * s, 20 * s, 1200);
    std::printf("sustainer: level spread of the held sine %.3f dB\n", pump);
    EXPECT(pump < 0.2, "the held sine has a constant envelope (under 0.2 dB)");
    // And nothing else in it: the strongest component away from 440 Hz.
    double spur = 0.0;
    for (double q = 30.0; q < 20000.0; q *= 1.01) {
      if (std::fabs(q - 440.0) < 60.0) continue;
      spur = std::max(spur, tone_level(out.left, q, kRate, 4 * s, 6 * s));
    }
    std::printf("sustainer: strongest spurious component %.1f dB re the held tone\n", db(spur / 0.25) - early);
    EXPECT(db(spur / 0.25) - early < -70.0, "no spurious component above -70 dB");
  }

  // Decay is the time the held sound takes to fall 60 dB once the playing
  // has stopped (counted from the end of the input; the device takes 0.15 s
  // to decide that it has stopped).
  for (float decay : {1.0f, 2.0f, 4.0f}) {
    still(device);
    device.set_param(p::kDecay, decay);
    Stereo out = run(device, join(sine(440.0f, 1.0f, kRate, 0.25f), silence(decay * 2.0f + 2.0f, kRate)));
    const size_t s = static_cast<size_t>(kRate);
    const double held = rms(out.left, s / 2, s);
    double fell = 0.0;
    for (size_t at = s; at + 480 <= out.left.size(); at += 480) {
      if (rms(out.left, at, at + 480) < held * 1.0e-3) {
        fell = static_cast<double>(at - s) / kRate;
        break;
      }
    }
    std::printf("sustainer: Decay %.0f s: 60 dB down %.2f s after the input stops\n", decay, fell);
    EXPECT(fell > decay * 0.95 && fell < decay * 1.05 + 0.3, "Decay sets the time to fall 60 dB");
    Stereo rest = render(device, decay + 1.0f, kRate);
    EXPECT(peak(rest.left, rest.left.size() - 4800) == 0.0, "after the decay the output is exact silence");
  }

  // A chord is held as it was: three notes at different levels, none of them
  // on a bin centre, keep their pitch to 2 cents and their balance to 2 dB.
  {
    still(device);
    device.set_param(p::kDecay, 60.0f);
    const float hz[3] = {220.0f, 277.18f, 329.63f};
    const float gain[3] = {0.2f, 0.12f, 0.08f};
    std::vector<float> chord = silence(1.0f, kRate);
    for (int n = 0; n < 3; ++n) chord = add(chord, sine(hz[n], 1.0f, kRate, gain[n]));
    Stereo out = run(device, join(chord, silence(7.0f, kRate)));
    const size_t s = static_cast<size_t>(kRate);
    double level[3];
    for (int n = 0; n < 3; ++n) {
      const double found = dominant_frequency(out.left, kRate, hz[n] * 0.97, hz[n] * 1.03, 2 * s, 8 * s);
      const double cents = 1200.0 * std::log2(found / hz[n]);
      level[n] = db(tone_level(out.left, found, kRate, 2 * s, 8 * s) / gain[n]);
      std::printf("sustainer: chord note %.2f Hz held at %.3f Hz (%+.2f cents), %.2f dB re its input level\n", hz[n],
                  found, cents, level[n]);
      EXPECT(std::fabs(cents) < 2.0, "each note of a held chord is within 2 cents of its pitch");
    }
    EXPECT(std::fabs(level[1] - level[0]) < 2.0 && std::fabs(level[2] - level[0]) < 2.0,
           "the notes of a held chord keep their balance to 2 dB");
  }

  // A low, close chord: C3 E3 G3 B3 C4, whose notes are 15 to 50 Hz apart.
  // The 85 ms frame cannot separate them; the second look with the long
  // frame, a third of a second into the chord, can. Every note is then held
  // at its pitch and level, with nothing at the frame rate beside it.
  {
    still(device);
    device.set_param(p::kDecay, 60.0f);
    const float hz[5] = {130.81f, 164.81f, 196.0f, 246.94f, 261.63f};
    const float gain[5] = {0.12f, 0.08f, 0.1f, 0.06f, 0.1f};
    std::vector<float> chord = silence(1.5f, kRate);
    for (int n = 0; n < 5; ++n) chord = add(chord, sine(hz[n], 1.5f, kRate, gain[n]));
    Stereo out = run(device, join(chord, silence(8.5f, kRate)));
    const size_t s = static_cast<size_t>(kRate);
    double worst_cents = 0.0, worst_level = 0.0, worst_side = -200.0;
    for (int n = 0; n < 5; ++n) {
      const double found = dominant_frequency(out.left, kRate, hz[n] - 4.0, hz[n] + 4.0, 2 * s, 10 * s);
      const double cents = 1200.0 * std::log2(found / hz[n]);
      const double level = db(tone_level(out.left, found, kRate, 2 * s, 10 * s) / gain[n]);
      double side = 0.0;
      for (int m = -2; m <= 2; ++m) {
        if (m != 0) side = std::max(side, tone_level(out.left, found + 46.875 * m, kRate, 2 * s, 10 * s));
      }
      std::printf("sustainer: close chord: %.2f Hz held at %.3f Hz (%+.2f cents), %.2f dB re its input, frame-rate "
                  "sidebands %.1f dB\n",
                  hz[n], found, cents, level, db(side / gain[n]) - level);
      worst_cents = std::max(worst_cents, std::fabs(cents));
      worst_level = std::max(worst_level, std::fabs(level + 2.5));
      worst_side = std::max(worst_side, db(side / gain[n]) - level);
    }
    EXPECT(worst_cents < 2.0, "close chord: every note within 2 cents");
    EXPECT(worst_level < 2.0, "close chord: every note within 2 dB of its level");
    EXPECT(worst_side < -50.0, "close chord: nothing at the frame rate above -50 dB");
    // The hand-over from the first look to the second is smooth.
    const double before = rms(out.left, static_cast<size_t>(0.25 * kRate), static_cast<size_t>(0.33 * kRate));
    const double after = rms(out.left, static_cast<size_t>(0.6 * kRate), static_cast<size_t>(1.4 * kRate));
    std::printf("sustainer: close chord: level %.2f dB before the second look, %.2f dB after (dBFS)\n", db(before), db(after));
  }

  // Auto: a new note takes over, and the old one is 30 dB down within three
  // Glide times. Layer: both stay.
  for (int mode = 0; mode < 2; ++mode) {
    still(device);
    device.set_param(p::kMode, static_cast<float>(mode));
    device.set_param(p::kDecay, 60.0f);
    device.set_param(p::kGlide, 0.3f);
    Stereo out = run(device, join(join(sine(440.0f, 1.5f, kRate, 0.25f), sine(660.0f, 1.5f, kRate, 0.25f)),
                                  silence(2.0f, kRate)));
    const size_t s = static_cast<size_t>(kRate);
    const double before = tone_level(out.left, 440.0, kRate, s, s + s / 2);
    // The second note is caught about 0.15 s after it starts.
    const size_t later = static_cast<size_t>((1.5 + 0.15 + 3 * 0.3) * kRate);
    const double old_note = db(tone_level(out.left, 440.0, kRate, later, later + s / 4) / before);
    const double new_note = db(tone_level(out.left, 660.0, kRate, 4 * s, 5 * s) / before);
    const double old_at_end = db(tone_level(out.left, 440.0, kRate, 4 * s, 5 * s) / before);
    std::printf("sustainer: %s: old note %.1f dB after three Glide times, %.1f dB at the end; new note %.1f dB\n",
                mode == 0 ? "Auto" : "Layer", old_note, old_at_end, new_note);
    EXPECT(std::fabs(new_note) < 1.0, "the new note is held at the level the old one was");
    if (mode == 0) {
      EXPECT(old_note < -30.0, "Auto: the old note is 30 dB down within three Glide times");
      EXPECT(old_at_end < -90.0 && device.layers() == 1, "Auto: the old layer has gone");
    } else {
      EXPECT(std::fabs(old_at_end) < 1.0 && device.layers() == 2, "Layer: the old note stays under the new one");
    }
  }

  // Sensitivity: at the default, room noise at -50 dBFS is never caught and a
  // note at -20 dBFS is. A quiet note needs more Sensitivity.
  {
    still(device);
    device.set_param(p::kSensitivity, 0.5f);
    rng_state() = 0xA5A5u;
    Stereo hiss = run(device, noise(4.0f, kRate, 0.00548f));  // -50 dBFS rms
    EXPECT(device.onsets() == 0 && device.layers() == 0 && peak(hiss.left) < 1.0e-8,
           "noise at -50 dBFS is not caught at the default Sensitivity");
    still(device);
    run(device, sine(330.0f, 1.0f, kRate, 0.1414f));  // -20 dBFS rms
    EXPECT(device.layers() == 1, "a note at -20 dBFS is caught at the default Sensitivity");
    for (float sensitivity : {0.0f, 1.0f}) {
      still(device);
      device.set_param(p::kSensitivity, sensitivity);
      run(device, sine(330.0f, 1.0f, kRate, 0.0056f));  // -48 dBFS rms
      EXPECT(device.layers() == (sensitivity > 0.5f ? 1 : 0),
             "a note at -48 dBFS is caught at full Sensitivity and ignored at none");
    }
  }

  // The attack is not caught: the pick noise of a plucked note is in its
  // first 30 ms, and the held sound has none of it.
  {
    still(device);
    device.set_param(p::kDecay, 60.0f);
    rng_state() = 0x9001u;
    std::vector<float> note = pluck(196.0f, 2.0f, 0.4f);
    Stereo out = run(device, join(note, silence(2.0f, kRate)));
    const size_t s = static_cast<size_t>(kRate);
    const double pick_level = rms_above(note, 5000.0, 0, static_cast<size_t>(0.03 * kRate));
    const double held_level = rms_above(out.left, 5000.0, 2 * s, 4 * s);
    std::printf("sustainer: above 5 kHz: the pick is at %.1f dBFS, the held sound at %.1f dBFS\n", db(pick_level),
                db(held_level));
    EXPECT(rms(out.left, 2 * s, 4 * s) > 0.01, "the plucked note is held");
    EXPECT(db(held_level) < db(pick_level) - 25.0, "the pick noise is not in the held sound (25 dB down above 5 kHz)");
  }

  // Attack is the time the held sound takes to rise: half way after half the
  // Attack time (plus the 40 ms the overlapping frames need).
  for (float attack : {0.25f, 1.0f, 3.0f}) {
    still(device);
    device.set_param(p::kDecay, 60.0f);
    device.set_param(p::kAttack, attack);
    Stereo out = run(device, sine(440.0f, attack + 2.0f, kRate, 0.25f));
    const double full = rms(out.left, out.left.size() - 9600);
    size_t begins = 0, half = 0;
    for (size_t at = 0; at + 480 <= out.left.size(); at += 480) {
      const double level = rms(out.left, at, at + 480);
      if (begins == 0 && level > full * 0.01) begins = at;
      if (level > full * 0.5) {
        half = at;
        break;
      }
    }
    const double took = static_cast<double>(half - begins) / kRate;
    std::printf("sustainer: Attack %.2f s: caught %.2f s after the note began, half level %.2f s later\n", attack,
                static_cast<double>(begins) / kRate, took);
    EXPECT(took > 0.4 * attack && took < 0.6 * attack + 0.06, "Attack sets the rise time of the held sound");
  }

  // The catch comes after the attack has passed: the held sound begins 100
  // to 170 ms after the note does, whatever the block size.
  {
    still(device);
    device.set_param(p::kAttack, 0.01f);
    Stereo out = run(device, sine(440.0f, 1.0f, kRate, 0.25f));
    size_t begins = 0;
    while (begins < out.left.size() && std::fabs(out.left[begins]) < 1.0e-3f) ++begins;
    std::printf("sustainer: the held sound begins %.0f ms after the note\n", 1000.0 * begins / kRate);
    EXPECT(begins > static_cast<size_t>(0.10 * kRate) && begins < static_cast<size_t>(0.17 * kRate),
           "the catch comes 100 to 170 ms after the note begins");
  }

  // Latch: silent until Hold goes On, constant while it is On, gone after Off.
  {
    still(device);
    device.set_param(p::kMode, 2.0f);
    device.set_param(p::kDecay, 1.0f);
    std::vector<float> tone = sine(523.25f, 2.0f, kRate, 0.25f);
    const size_t s = static_cast<size_t>(kRate);
    Stereo before = run(device, std::vector<float>(tone.begin(), tone.begin() + s));
    EXPECT(peak(before.left) < 1.0e-7 && device.layers() == 0, "Latch: nothing is caught while Hold is Off");
    device.set_param(p::kHold, 1.0f);
    run(device, std::vector<float>(tone.begin() + s, tone.end()));
    Stereo held = render(device, 10.0f, kRate);
    const double first = rms(held.left, s, 2 * s), last = rms(held.left, 9 * s, 10 * s);
    std::printf("sustainer: Latch: held %.2f dB re the tone, %.3f dB change over 9 s\n", db(first * std::sqrt(2.0) / 0.25),
                db(last / first));
    EXPECT(first > 0.1 && std::fabs(db(last / first)) < 0.05, "Latch: the moment is held, unchanged, while Hold is On");
    device.set_param(p::kHold, 0.0f);
    Stereo released = render(device, 3.0f, kRate);
    EXPECT(rms(released.left, s + s / 2, 2 * s) < first * 1.0e-3, "Latch: Hold Off lets it go over the Decay time");
    EXPECT(peak(released.left, 2 * s + s / 2) == 0.0 && device.layers() == 0, "Latch: then silence");
  }

  // Motion. At 0 the held sound is the same left and right and does not
  // move at all. At 1 every partial drifts on its own, differently on each
  // side: the channels decorrelate and the level of a partial wanders slowly,
  // with nothing at the frame rate (46.9 Hz). Below 150 Hz the sides stay
  // together.
  {
    const size_t s = static_cast<size_t>(kRate);
    still(device);
    device.set_param(p::kDecay, 60.0f);
    run(device, sine(1000.0f, 1.0f, kRate, 0.25f));
    Stereo flat = render(device, 10.0f, kRate);
    EXPECT(flat.left == flat.right, "Motion 0, Ensemble 0: left and right are identical");

    still(device);
    device.set_param(p::kDecay, 60.0f);
    device.set_param(p::kMotion, 1.0f);
    run(device, sine(1000.0f, 1.0f, kRate, 0.25f));
    Stereo moving = render(device, 30.0f, kRate);
    const double apart = correlation(moving.left, moving.right, 2 * s, 30 * s);
    const double wander = level_spread_db(moving.left, 2 * s, 30 * s, 4800);
    const double level = db(rms(moving.left, 2 * s, 30 * s) / rms(flat.left, 2 * s, 10 * s));
    const double hz = dominant_frequency(moving.left, kRate, 950.0, 1050.0, 2 * s, 30 * s);
    double flutter = 0.0;
    for (int m = 1; m <= 4; ++m) {
      flutter = std::max(flutter, tone_level(moving.left, 1000.0 + 46.875 * m, kRate, 2 * s, 30 * s));
      flutter = std::max(flutter, tone_level(moving.left, 1000.0 - 46.875 * m, kRate, 2 * s, 30 * s));
    }
    const double flutter_db = db(flutter / (rms(moving.left, 2 * s, 30 * s) * std::sqrt(2.0)));
    std::printf("sustainer: Motion 1: left/right correlation %.2f, level wanders %.1f dB, mean level %+.2f dB, "
                "centre %.2f Hz, frame-rate sidebands %.1f dB\n",
                apart, wander, level, hz, flutter_db);
    EXPECT(apart < 0.4, "Motion 1 decorrelates left and right");
    EXPECT(wander > 2.0 && wander < 12.0, "Motion 1: the level of a partial wanders by some dB, slowly");
    EXPECT(std::fabs(level) < 1.0, "Motion does not change the mean level");
    EXPECT_NEAR(hz, 1000.0, 2.0, "Motion 1: the partial stays at its pitch");
    EXPECT(flutter_db < -50.0, "Motion 1: nothing at the frame rate (sidebands under -50 dB)");

    still(device);
    device.set_param(p::kDecay, 60.0f);
    device.set_param(p::kMotion, 1.0f);
    device.set_param(p::kEnsemble, 1.0f);
    run(device, sine(110.0f, 1.0f, kRate, 0.25f));
    Stereo bass = render(device, 20.0f, kRate);
    const double bass_together = correlation(bass.left, bass.right, 2 * s, 20 * s);
    std::printf("sustainer: Motion 1, Ensemble 1 at 110 Hz: left/right correlation %.3f\n", bass_together);
    EXPECT(bass_together > 0.8, "the bass of the held sound stays mono-compatible");
  }

  // Ensemble adds a copy 8 cents up, mostly on the left, and one 8 cents
  // down, mostly on the right, without changing the level.
  {
    const size_t s = static_cast<size_t>(kRate);
    const double up = 1000.0 * std::pow(2.0, 8.0 / 1200.0), down = 1000.0 / std::pow(2.0, 8.0 / 1200.0);
    double total[2] = {0.0, 0.0};
    for (int on = 0; on < 2; ++on) {
      still(device);
      device.set_param(p::kDecay, 60.0f);
      device.set_param(p::kEnsemble, static_cast<float>(on));
      run(device, sine(1000.0f, 1.0f, kRate, 0.25f));
      Stereo out = render(device, 22.0f, kRate);
      const double centre = tone_level(out.left, 1000.0, kRate, 2 * s, 22 * s);
      const double up_left = db(tone_level(out.left, up, kRate, 2 * s, 22 * s) / centre);
      const double up_right = db(tone_level(out.right, up, kRate, 2 * s, 22 * s) / centre);
      const double down_left = db(tone_level(out.left, down, kRate, 2 * s, 22 * s) / centre);
      const double down_right = db(tone_level(out.right, down, kRate, 2 * s, 22 * s) / centre);
      total[on] = rms(out.left, 2 * s, 22 * s);
      std::printf("sustainer: Ensemble %d: copy at +8 cents %.1f dB left, %.1f dB right; at -8 cents %.1f dB left, "
                  "%.1f dB right (re the centre voice)\n",
                  on, up_left, up_right, down_left, down_right);
      if (on == 0) {
        EXPECT(up_left < -60.0 && down_right < -60.0, "Ensemble 0: no detuned copies");
      } else {
        EXPECT_NEAR(up_left, -0.7, 1.5, "Ensemble 1: the upper copy is as loud as the centre on the left");
        EXPECT_NEAR(down_right, -0.7, 1.5, "Ensemble 1: the lower copy is as loud as the centre on the right");
        EXPECT(up_left - up_right > 5.0 && down_right - down_left > 5.0, "Ensemble spreads the copies left and right");
        const double width = correlation(out.left, out.right, 2 * s, 22 * s);
        EXPECT(width > 0.5 && width < 0.95, "Ensemble widens the held sound and keeps it mono-compatible");
      }
    }
    std::printf("sustainer: Ensemble 1 changes the level by %+.2f dB\n", db(total[1] / total[0]));
    EXPECT(std::fabs(db(total[1] / total[0])) < 0.5, "Ensemble does not change the level");
  }

  // No clicks. A held 110 Hz sine at this level never steps by more than
  // 0.0027 from one sample to the next (three times that when Ensemble and
  // Motion stack their voices in phase); moving every control while it
  // sounds, switching modes and toggling Hold must not add a step.
  {
    still(device);
    device.set_param(p::kDecay, 60.0f);
    run(device, sine(110.0f, 1.0f, kRate, 0.25f));
    Stereo quiet = render(device, 1.0f, kRate);
    const double natural = max_step(quiet.left);
    Stereo swept;
    for (int block = 0; block < 1500; ++block) {
      const float t = static_cast<float>(block) / 1500.0f;
      const float zig = std::fabs(std::fmod(t * 6.0f, 2.0f) - 1.0f);
      device.set_param(p::kTone, 2.0f * zig - 1.0f);
      device.set_param(p::kMix, 1.0f - 0.7f * zig);
      device.set_param(p::kMotion, zig);
      device.set_param(p::kEnsemble, 1.0f - zig);
      device.set_param(p::kLowCut, 20.0f + 300.0f * zig);
      device.set_param(p::kAttack, 0.01f + zig);
      device.set_param(p::kGlide, 0.02f + zig);
      device.set_param(p::kSensitivity, zig);
      if (block % 200 == 100) device.set_param(p::kMode, static_cast<float>((block / 200) % 2));
      if (block % 300 == 150) device.set_param(p::kHold, static_cast<float>((block / 300) % 2));
      swept = concat(swept, render(device, 128.0f / kRate, kRate));
    }
    std::printf("sustainer: largest step of the held sine %.4f at rest, %.4f while every control moves\n", natural,
                max_step(swept.left));
    EXPECT(max_step(swept.left) < 0.009 && max_step(swept.right) < 0.009, "moving the controls while a sound is held does not click");

    // A new note gliding over the old one, and a layer let go in Latch.
    still(device);
    device.set_param(p::kGlide, 0.02f);
    device.set_param(p::kAttack, 0.01f);
    Stereo change = run(device, join(sine(440.0f, 1.0f, kRate, 0.25f), sine(660.0f, 1.0f, kRate, 0.25f)));
    std::printf("sustainer: largest step when a new note takes over at the shortest Attack and Glide %.4f\n",
                max_step(change.left));
    EXPECT(max_step(change.left) < 0.03, "a new note takes over without a click, even at the shortest Attack and Glide");
  }

  // Mix is an equal-power balance, and the dry signal is never touched.
  {
    device.init(kRate);
    device.set_param(p::kMode, 2.0f);  // Latch with Hold off: nothing is ever held
    device.set_param(p::kMix, 0.5f);
    std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 4800; i < tone.size(); ++i) {
      worst = std::max(worst, std::fabs(out.left[i] - std::sqrt(0.5) * static_cast<double>(tone[i])));
    }
    EXPECT(worst < 1.0e-6, "Mix 0.5 passes the dry signal at -3 dB, in time");
  }

  // A pile of loud layers is held to a ceiling: ten notes in Layer mode at
  // -6 dBFS each stay under -10 dBFS in sum and never reach the clipper.
  {
    still(device);
    device.set_param(p::kMode, 1.0f);
    device.set_param(p::kDecay, 60.0f);
    std::vector<float> notes;
    for (int n = 0; n < 10; ++n) notes = join(notes, sine(220.0f * std::pow(2.0f, n * 5.0f / 12.0f), 0.4f, kRate, 0.5f));
    Stereo out = run(device, join(notes, silence(3.0f, kRate)));
    const size_t n = out.left.size();
    const double level = db(rms(out.left, n - 96000, n));
    std::printf("sustainer: ten loud layers: %d held, %.1f dBFS rms, peak %.2f\n", device.layers(), level,
                std::max(peak(out.left), peak(out.right)));
    EXPECT(device.layers() >= 4 && device.layers() <= Sustainer::kSlots, "Layer keeps the most recent notes");
    EXPECT(level < -10.0 && level > -16.0, "a pile of layers is held to a common ceiling");
    EXPECT(peak(out.left) < 0.9 && peak(out.right) < 0.9, "a pile of layers stays below the clipper");
    Stereo later = render(device, 20.0f, kRate);
    EXPECT_NEAR(db(rms(later.left, later.left.size() - 96000)), level, 0.2, "held layers neither grow nor fade");
  }

  // The same at 44.1 and 96 kHz (the frame is twice as long at 96 kHz): the
  // held tone is at pitch and at level.
  for (float rate : {44100.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kMotion, 0.0f);
    device.set_param(p::kEnsemble, 0.0f);
    device.set_param(p::kLowCut, 20.0f);
    device.set_param(p::kDecay, 60.0f);
    Stereo out = run(device, join(sine(440.0f, 1.0f, rate, 0.25f), silence(5.0f, rate)));
    const size_t s = static_cast<size_t>(rate);
    const double hz = dominant_frequency(out.left, rate, 400.0, 480.0, 2 * s, 6 * s);
    const double level = db(tone_level(out.left, 440.0, rate, 2 * s, 6 * s) / 0.25);
    size_t begins = 0;
    while (begins < out.left.size() && std::fabs(out.left[begins]) < 1.0e-3f) ++begins;
    std::printf("sustainer: at %.1f kHz: held %.3f Hz at %.2f dB, beginning %.0f ms after the note\n", rate / 1000.0, hz,
                level, 1000.0 * begins / rate);
    EXPECT_NEAR(hz, 440.0, 0.2, "the held tone is at pitch at every sample rate");
    EXPECT_NEAR(level, -2.5, 0.5, "the held tone is at level at every sample rate");
    EXPECT(begins > static_cast<size_t>(0.10 * rate) && begins < static_cast<size_t>(0.19 * rate),
           "the catch comes at the same time at every sample rate");
    // The second look resolves a semitone at B3 and C4 at this rate too.
    device.init(rate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kMotion, 0.0f);
    device.set_param(p::kEnsemble, 0.0f);
    device.set_param(p::kLowCut, 20.0f);
    device.set_param(p::kDecay, 60.0f);
    Stereo pair = run(device, join(add(sine(246.94f, 1.5f, rate, 0.1f), sine(261.63f, 1.5f, rate, 0.15f)), silence(6.5f, rate)));
    const double b3 = db(tone_level(pair.left, 246.94, rate, 2 * s, 8 * s) / 0.1);
    const double c4 = db(tone_level(pair.left, 261.63, rate, 2 * s, 8 * s) / 0.15);
    std::printf("sustainer: at %.1f kHz: B3 held at %.2f dB, C4 at %.2f dB re their inputs\n", rate / 1000.0, b3, c4);
    EXPECT(std::fabs(b3 + 2.5) < 1.0 && std::fabs(c4 + 2.5) < 1.0, "a semitone in the low register is held as two notes");
  }

  // The default patch on a played phrase: three plucked notes and a chord.
  // The output stays within 3 dB of the dry phrase while it is played, the
  // held sound is mono-compatible, and once the playing stops it dies away
  // to exact silence, after which a new note wakes the device again.
  {
    device.init(kRate);
    rng_state() = 0x77u;
    std::vector<float> phrase;
    mix_at(phrase, pluck(196.0f, 2.0f, 0.3f), 0.25f);
    mix_at(phrase, pluck(293.66f, 2.0f, 0.3f), 1.25f);
    mix_at(phrase, pluck(246.94f, 2.0f, 0.3f), 2.25f);
    for (float hz : {130.81f, 196.0f, 261.63f, 329.63f}) mix_at(phrase, pluck(hz, 3.0f, 0.18f), 3.5f);
    const size_t s = static_cast<size_t>(kRate);
    Stereo out = run(device, phrase);
    const double change = db(rms(out.left, s / 2, 6 * s) / rms(phrase, s / 2, 6 * s));
    const double width = correlation(out.left, out.right, s / 2, 6 * s);
    std::vector<float> mono(out.left.size());
    for (size_t i = 0; i < mono.size(); ++i) mono[i] = 0.5f * (out.left[i] + out.right[i]);
    const double folded = db(rms(mono, s / 2, 6 * s) / rms(out.left, s / 2, 6 * s));
    const double offset = std::fabs(mean(out.left, s, 6 * s));
    std::printf("sustainer: default patch on a phrase: %+.1f dB re the dry phrase, left/right correlation %.2f, "
                "mono fold-down %+.2f dB, peak %.2f, DC %.5f\n",
                change, width, folded, std::max(peak(out.left), peak(out.right)), offset);
    EXPECT(std::fabs(change) < 3.0, "default patch: within 3 dB of the dry phrase while it is played");
    EXPECT(width > 0.3 && folded > -1.5, "default patch: wide but mono-compatible");
    EXPECT(std::max(peak(out.left), peak(out.right)) < 1.0 && offset < 1.0e-3, "default patch: no clipping, no DC");
    Stereo tail = render(device, 14.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(rms(tail.left, 0, s) > 0.01, "default patch: the last chord hangs on after the playing stops");
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0 && device.layers() == 0, "asleep after the tail");
    device.set_param(p::kMix, 1.0f);
    Stereo woken = run(device, pluck(220.0f, 1.0f, 0.3f));
    EXPECT(device.layers() == 1 && rms(woken.left, s / 2, s) > 0.01, "a new note wakes it and is caught");
  }

  check_review_fixes();

  // Cost: Layer mode with all six layers sounding, Motion and Ensemble up,
  // and a new chord caught twice a second.
  {
    device.init(kRate);
    device.set_param(p::kMode, 1.0f);
    device.set_param(p::kDecay, 60.0f);
    device.set_param(p::kMotion, 1.0f);
    device.set_param(p::kEnsemble, 1.0f);
    rng_state() = 0xBEEFu;
    std::vector<float> input;
    for (int n = 0; n < 20; ++n) {
      for (int voice = 0; voice < 3; ++voice) {
        mix_at(input, pluck(110.0f * std::pow(2.0f, ((n * 5 + voice * 4) % 30) / 12.0f), 0.5f, 0.15f), 0.5f * n);
      }
    }
    input.resize(static_cast<size_t>(10.0f * kRate), 0.0f);
    report_cost("sustainer", 10.0f, kRate, [&] { run(device, input); });
    EXPECT(device.layers() >= 4, "the cost run keeps the layers busy");
  }

  return finish("sustainer");
}

// Checks added in review, one for each defect that was found and fixed.
static void check_review_fixes() {
  const size_t s = static_cast<size_t>(kRate);

  // The held sound adds to the note it was caught from. Three steady
  // partials (one of them under the 550 Hz crossing, none on a bin), Mix at
  // the centre, no Motion: each comes out at dry + held in phase, which is
  // 0.707 x (1 + 0.75) = +1.87 dB re its input. Caught at whatever angle the
  // delay gave them, they came out anywhere from -15 dB (notched) to +1.87.
  {
    device.init(kRate);
    device.set_param(p::kMotion, 0.0f);
    device.set_param(p::kEnsemble, 0.0f);
    device.set_param(p::kLowCut, 20.0f);
    const float hz[3] = {329.63f, 831.3f, 2217.9f};
    std::vector<float> chord = silence(3.0f, kRate);
    for (float f : hz) chord = add(chord, sine(f, 3.0f, kRate, 0.1f));
    Stereo out = run(device, chord);
    for (float f : hz) {
      const double level = db(tone_level(out.left, f, kRate, 3 * s / 2, 3 * s) / 0.1);
      std::printf("sustainer: dry + held at Mix 0.5, %.1f Hz: %+.2f dB re the dry partial\n", f, level);
      EXPECT_NEAR(level, 1.87, 0.4, "the held partial is in phase with the note still sounding");
    }
  }

  // A long Attack does not leave a hole between chords: with Attack 2 s and
  // Glide 0.4 s the old note left in 0.4 s while the new one took 2 s to
  // arrive (a dip of 17 dB). The old layer now leaves no faster than the
  // new one rises.
  {
    still(device);
    device.set_param(p::kDecay, 60.0f);
    device.set_param(p::kAttack, 2.0f);
    device.set_param(p::kGlide, 0.4f);
    std::vector<float> input = join(sine(440.0f, 4.0f, kRate, 0.25f), sine(660.0f, 4.0f, kRate, 0.25f));
    Stereo out = run(device, input);
    const double before = rms(out.left, 3 * s, 4 * s);
    double lowest = 1.0e9;
    for (size_t at = 4 * s; at + s / 10 <= 8 * s; at += s / 20) lowest = std::min(lowest, rms(out.left, at, at + s / 10));
    std::printf("sustainer: Attack 2 s, Glide 0.4 s: the level dips %.1f dB between two notes\n", db(lowest / before));
    EXPECT(db(lowest / before) > -3.0, "a long Attack leaves no hole between chords");
  }

  // Sound with no attack is caught too. A chord that swells in over a
  // second never made an onset, so the default patch did nothing on a pad;
  // now the layer follows the swell up and ends within a few dB of the
  // chord at full level. A second chord faded in as the first one ends (no
  // onset either) takes over; what it is caught with is what sounds at that
  // moment, so the first chord is made to end while the second still rises.
  // A chord that just stands is caught once or twice and then left alone.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kMotion, 0.0f);
    device.set_param(p::kEnsemble, 0.0f);
    std::vector<float> first = swell_chord({220.0f, 277.18f, 329.63f}, 5.2f, 0.08f, 1.0f);
    std::vector<float> input = first;
    mix_at(input, swell_chord({196.0f, 246.94f, 293.66f}, 6.0f, 0.08f, 1.5f), 4.8f);
    Stereo early = run(device, std::vector<float>(input.begin(), input.begin() + 4 * s));
    const int catches = device.onsets();
    const double held_a = db(tone_level(early.left, 220.0, kRate, 3 * s, 4 * s) / 0.08);
    Stereo late = run(device, std::vector<float>(input.begin() + 4 * s, input.end()));
    const double a_after = db(tone_level(late.left, 220.0, kRate, 5 * s, 6 * s) / 0.08);
    const double g_after = db(tone_level(late.left, 196.0, kRate, 5 * s, 6 * s) / 0.08);
    std::printf("sustainer: a chord swelling in over 1 s: %d catches, held at %.1f dB re the chord; "
                "after a second chord fades in: %d catches, old %.1f dB, new %.1f dB\n",
                catches, held_a, device.onsets(), a_after, g_after);
    EXPECT(catches >= 1 && catches <= 4, "a swell is caught, a few times at most");
    EXPECT(held_a > -6.5 && held_a < -1.5, "the held swell ends within 4 dB of where a struck chord would be held");
    EXPECT(a_after < -40.0 && g_after > -8.0, "a chord faded in over the old one takes its place");

    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, swell_chord({220.0f, 277.18f, 329.63f}, 12.0f, 0.08f, 0.5f));
    std::printf("sustainer: a chord that stands for 12 s is caught %d times\n", device.onsets());
    EXPECT(device.onsets() >= 1 && device.onsets() <= 3, "a standing chord is not caught over and over");
  }

  // Noise is held as noise. A second of noise used to freeze into some
  // twenty steady lines standing up to 20 dB above their surroundings: a
  // ringing cluster. Its regions now get a new phase every hop and an
  // evened level, at the same loudness. A note keeps its lines.
  {
    still(device);
    device.set_param(p::kDecay, 60.0f);
    rng_state() = 0xA11CEu;
    std::vector<float> hiss = noise(1.0f, kRate, 0.17f);
    Stereo out = run(device, join(hiss, silence(8.0f, kRate)));
    const int lines = ringing_lines(out.left, 3 * s, 8 * s, 12.0);
    const double level = db(rms(out.left, 3 * s, 8 * s) / rms(hiss, s / 4, s));
    std::printf("sustainer: held noise: %d lines more than 12 dB above their surroundings, %.1f dB re the noise\n", lines, level);
    EXPECT(lines <= 3, "held noise does not ring as a cluster of steady lines");
    EXPECT_NEAR(level, -2.5, 2.0, "held noise is as loud as a held note would be");

    still(device);
    device.set_param(p::kDecay, 60.0f);
    rng_state() = 0x51u;
    Stereo note = run(device, join(pluck(220.0f, 1.5f, 0.3f), silence(8.0f, kRate)));
    const double first_h = level_spread_db(note.left, 3 * s, 9 * s, s / 4);
    std::printf("sustainer: a held plucked note: level spread %.3f dB, %d lines\n", first_h, ringing_lines(note.left, 3 * s, 8 * s, 12.0));
    EXPECT(first_h < 0.3 && ringing_lines(note.left, 3 * s, 8 * s, 12.0) >= 8, "a held note stays a set of steady partials");
  }

  // Partials near the 550 Hz crossing are held once, not twice. A low note
  // (55 Hz, partials 55 Hz apart) has several between 450 and 650 Hz; each
  // used to be held both by the caught frame and by the second look, at two
  // estimates of its pitch, and beat with itself by up to 12 dB.
  {
    still(device);
    device.set_param(p::kDecay, 60.0f);
    rng_state() = 0x55u;
    Stereo out = run(device, join(pluck(55.0f, 3.0f, 0.4f), silence(21.0f, kRate)));
    double worst = 0.0;
    for (int h = 8; h <= 12; ++h) {
      const double f = 55.0 * h * std::sqrt(1.0 + 0.0002 * h * h);
      double lowest = 1.0e9, highest = 0.0;
      for (size_t at = 4 * s; at + s / 2 <= 24 * s; at += s / 2) {
        const double level = tone_level(out.left, f, kRate, at, at + s / 2);
        lowest = std::min(lowest, level);
        highest = std::max(highest, level);
      }
      worst = std::max(worst, db(highest / std::max(lowest, 1.0e-12)));
    }
    std::printf("sustainer: a held 55 Hz note: partials between 440 and 670 Hz swing by at most %.2f dB over 20 s\n", worst);
    EXPECT(worst < 0.5, "partials near the crossing do not beat with themselves");
  }

  // Bad input samples do not get through: not-a-number, infinity and 1e30
  // in the middle of a phrase leave the output finite and bounded, the
  // level afterwards as it was, and the device still falls asleep.
  {
    const float bad[3] = {std::nanf(""), INFINITY, 1.0e30f};
    for (float value : bad) {
      device.init(kRate);
      device.set_param(p::kDecay, 1.0f);
      rng_state() = 0x99u;
      std::vector<float> phrase;
      for (int n = 0; n < 5; ++n) mix_at(phrase, pluck(196.0f * (1.0f + 0.25f * n), 1.0f, 0.3f), 0.6f * n);
      std::vector<float> clean = phrase;
      phrase[static_cast<size_t>(1.3f * kRate)] = value;
      phrase[static_cast<size_t>(1.3f * kRate) + 600] = -value;
      Stereo out = run(device, phrase);
      Stereo tail = render(device, 4.0f, kRate);
      const double after = db(rms(out.left, 2 * s, 3 * s) / rms(clean, 2 * s, 3 * s));
      EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < 65.0, "a bad input sample leaves the output finite and bounded");
      EXPECT(std::fabs(after) < 4.0, "the level is back to normal after a bad input sample");
      EXPECT(peak(tail.left, 3 * s) == 0.0 && device.layers() == 0, "asleep again after a bad input sample");
    }
  }

  // Latch with Hold switched On in silence used to stay empty for as long
  // as Hold stayed On. It now waits and takes the first sound that comes.
  {
    still(device);
    device.set_param(p::kMode, 2.0f);
    render(device, 0.5f, kRate);
    device.set_param(p::kHold, 1.0f);
    Stereo quiet = render(device, 0.5f, kRate);
    Stereo out = run(device, join(sine(330.0f, 1.0f, kRate, 0.25f), silence(3.0f, kRate)));
    const double held = db(rms(out.left, 3 * s, 4 * s) / (0.25 / std::sqrt(2.0)));
    std::printf("sustainer: Latch, Hold On before the note: %d layer, held %.2f dB re the note\n", device.layers(), held);
    EXPECT(peak(quiet.left) == 0.0 && device.layers() == 1, "Latch armed in silence takes the first sound");
    EXPECT_NEAR(held, -2.5, 0.5, "and holds it at level");
  }
}
