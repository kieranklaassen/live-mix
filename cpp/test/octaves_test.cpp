// Native harness for Octaves (cpp/devices/octaves). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a polyphonic octave generator: each
// voice lands on its octave and nowhere else, chords come out as chords, the
// voices start with the note and do not warble.

#include "../devices/octaves/octaves.h"
#include "support/test_kit.h"

#include <algorithm>

using namespace testkit;
using livemix::Octaves;
namespace p = livemix::octaves;

static Octaves device;
static livemix::kit::Fft<32768> fft;

static const float kRate = 48000.0f;

// One voice alone: nothing else sounding, no dry signal.
static void solo(Octaves& d, int voice, float level = 1.0f) {
  d.init(kRate);
  d.set_param(p::kSub2, 0.0f);
  d.set_param(p::kSub1, 0.0f);
  d.set_param(p::kUp1, 0.0f);
  d.set_param(p::kUp2, 0.0f);
  d.set_param(p::kDry, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kAttack, 0.0f);
  d.set_param(p::kFilter, 16000.0f);
  d.set_param(p::kResonance, 0.0f);
  if (voice >= 0) d.set_param(voice, level);
}

struct Peak {
  double hz, level;
};

// Spectral peaks of the last 32768 samples (0.68 s) of x, Hann window,
// strongest first; level is the amplitude of a sine there.
static std::vector<Peak> peaks(const std::vector<float>& x) {
  const int n = 32768;
  static float re[32768], im[32768];
  double window_sum = 0.0;
  for (int i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * i / n);
    re[i] = static_cast<float>(x[x.size() - n + i] * w);
    im[i] = 0.0f;
    window_sum += w;
  }
  fft.forward(re, im);
  std::vector<double> mag(n / 2);
  for (int i = 0; i < n / 2; ++i) {
    mag[i] = 2.0 * std::sqrt(static_cast<double>(re[i]) * re[i] + static_cast<double>(im[i]) * im[i]) / window_sum;
  }
  std::vector<Peak> out;
  for (int i = 2; i < n / 2 - 2; ++i) {
    if (mag[i] > mag[i - 1] && mag[i] >= mag[i + 1] && mag[i] > mag[i - 2] && mag[i] > mag[i + 2] && mag[i] > 1.0e-6) {
      out.push_back({i * static_cast<double>(kRate) / n, mag[i]});
    }
  }
  std::sort(out.begin(), out.end(), [](const Peak& a, const Peak& b) { return a.level > b.level; });
  return out;
}

// The strongest component of x that is not within 4 Hz of a multiple (up to
// `harmonics`) of one of `allowed`.
static Peak strongest_other(const std::vector<float>& x, const std::vector<double>& allowed, int harmonics = 1) {
  for (const Peak& q : peaks(x)) {
    bool wanted = false;
    for (double hz : allowed) {
      for (int h = 1; h <= harmonics; ++h) {
        if (std::fabs(q.hz - hz * h) < 4.0) wanted = true;
      }
    }
    if (!wanted) return q;
  }
  return {0.0, 1.0e-6};
}

// `notes`, each with `harmonics` partials falling as 1/h, peak about `gain`.
static std::vector<float> chord(const std::vector<double>& notes, int harmonics, float seconds, float gain) {
  std::vector<float> x(static_cast<size_t>(seconds * kRate), 0.0f);
  double norm = 0.0;
  for (int h = 1; h <= harmonics; ++h) norm += 1.0 / h;
  const double a = gain / (norm * static_cast<double>(notes.size()));
  for (size_t n = 0; n < notes.size(); ++n) {
    for (int h = 1; h <= harmonics; ++h) {
      const double phase = 0.7 * static_cast<double>(n) + 1.3 * h;
      for (size_t i = 0; i < x.size(); ++i) {
        x[i] += static_cast<float>(a / h * std::sin(2.0 * kPi * notes[n] * h * static_cast<double>(i) / kRate + phase));
      }
    }
  }
  return x;
}

static const int kVoiceParam[4] = {p::kSub2, p::kSub1, p::kUp1, p::kUp2};
static const double kVoiceRatio[4] = {0.25, 0.5, 2.0, 4.0};
static const char* kVoiceName[4] = {"two down", "one down", "one up", "two up"};

int main() {
  fft.init();
  char label[200];

  Conformance spec;
  spec.name = "octaves";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 2.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Each voice alone on a 220 Hz sine is one sine, on its octave, at the
  // level of the input, with everything else at least 40 dB under it.
  for (int v = 0; v < 4; ++v) {
    solo(device, kVoiceParam[v]);
    Stereo out = run(device, sine(220.0f, 2.0f, kRate, 0.5f));
    const double want_hz = 220.0 * kVoiceRatio[v];
    const size_t from = out.left.size() - 32768;
    const double level = tone_level(out.left, want_hz, kRate, from);
    const double found = dominant_frequency(out.left, kRate, 30.0, 4000.0, from);
    const Peak other = strongest_other(out.left, {want_hz});
    std::printf("220 Hz, %s: %.2f Hz at %+.2f dB re input; next %.0f Hz, %.1f dB under\n", kVoiceName[v], found,
                db(level / 0.5), other.hz, db(level / other.level));
    std::snprintf(label, sizeof label, "%s of 220 Hz is %.0f Hz", kVoiceName[v], want_hz);
    EXPECT(std::fabs(found - want_hz) < 0.3, label);
    std::snprintf(label, sizeof label, "%s comes out at the level of the input", kVoiceName[v]);
    EXPECT(std::fabs(db(level / 0.5)) < 0.5, label);
    std::snprintf(label, sizeof label, "%s: every other component is 40 dB down", kVoiceName[v]);
    EXPECT(db(level / other.level) > 40.0, label);
  }

  // Polyphony: a three-note chord comes out as the same chord an octave
  // away, note for note, not as the mush a single-voice octaver makes of
  // it. Sines first: whatever is not one of the three notes is
  // intermodulation.
  const std::vector<double> notes = {196.0, 246.94, 293.66};
  for (int v = 1; v <= 2; ++v) {
    solo(device, kVoiceParam[v]);
    Stereo out = run(device, chord(notes, 1, 2.5f, 0.6f));
    std::vector<double> wanted;
    double weakest = 1.0;
    for (double hz : notes) {
      wanted.push_back(hz * kVoiceRatio[v]);
      const double level = tone_level(out.left, hz * kVoiceRatio[v], kRate, out.left.size() - 32768);
      weakest = std::min(weakest, level);
      std::snprintf(label, sizeof label, "chord, %s: the %.0f Hz note comes out at %.0f Hz at its level", kVoiceName[v],
                    hz, hz * kVoiceRatio[v]);
      EXPECT(std::fabs(db(level / 0.2)) < 1.0, label);
    }
    const Peak other = strongest_other(out.left, wanted);
    std::printf("sine chord, %s: strongest intermodulation %.0f Hz, %.1f dB under the notes\n", kVoiceName[v],
                other.hz, db(weakest / other.level));
    std::snprintf(label, sizeof label, "chord of sines, %s: intermodulation is 30 dB under the notes", kVoiceName[v]);
    EXPECT(db(weakest / other.level) > 30.0, label);
  }
  // Then notes with twelve harmonics each. The upper harmonics of three
  // notes fall closer together than any channel is wide, and two partials in
  // one channel do intermodulate: that is the method's limit.
  {
    solo(device, p::kUp1);
    Stereo out = run(device, chord(notes, 12, 2.5f, 0.6f));
    std::vector<double> wanted;
    double weakest = 1.0;
    for (double hz : notes) {
      wanted.push_back(hz * 2.0);
      weakest = std::min(weakest, tone_level(out.left, hz * 2.0, kRate, out.left.size() - 32768));
    }
    const Peak other = strongest_other(out.left, wanted, 12);
    std::printf("harmonic-rich chord, one up: strongest intermodulation %.0f Hz, %.1f dB under the notes\n", other.hz,
                db(weakest / other.level));
    EXPECT(db(weakest / other.level) > 10.0, "harmonic-rich chord: intermodulation stays 10 dB under the notes");
  }

  // Nearly latency-free: a note that starts abruptly has its octave at half
  // its final level within 10 ms (a 220 Hz channel is 48 Hz wide when it
  // opens, and that is its rise time), sooner higher up, and the first of it
  // within 6 ms.
  {
    const float hz[3] = {220.0f, 440.0f, 880.0f};
    const double limit[3] = {10.0, 8.0, 6.0};
    for (int n = 0; n < 3; ++n) {
      solo(device, p::kUp1);
      Stereo out = run(device, sine(hz[n], 0.3f, kRate, 0.5f));
      double first = -1.0, half = -1.0;
      for (size_t i = 0; i < out.left.size() && half < 0.0; ++i) {
        const double a = std::fabs(out.left[i]);
        if (first < 0.0 && a > 0.05) first = 1000.0 * static_cast<double>(i) / kRate;
        if (a > 0.25) half = 1000.0 * static_cast<double>(i) / kRate;
      }
      std::printf("onset, %.0f Hz one up: -20 dB after %.1f ms, half level after %.1f ms\n", hz[n], first, half);
      std::snprintf(label, sizeof label, "the octave of a %.0f Hz note is at half level within %.0f ms", hz[n], limit[n]);
      EXPECT(half > 0.0 && half < limit[n], label);
      std::snprintf(label, sizeof label, "the octave of a %.0f Hz note starts within 6 ms", hz[n]);
      EXPECT(first > 0.0 && first < 6.0, label);
    }
  }

  // No warble: on a steady sine every voice holds its level to within
  // 0.5 dB, wherever the sine sits between two channels.
  {
    double worst = 0.0;
    const float hz[5] = {110.0f, 207.0f, 311.0f, 554.0f, 1245.0f};
    for (float f : hz) {
      device.init(kRate);
      device.set_param(p::kDry, 0.0f);
      device.set_param(p::kSpread, 0.0f);
      for (int v = 0; v < 4; ++v) device.set_param(kVoiceParam[v], 1.0f);
      Stereo out = run(device, sine(f, 3.0f, kRate, 0.3f));
      for (int v = 0; v < 4; ++v) {
        if (f * kVoiceRatio[v] < 40.0) continue;
        // 100 ms windows, at least five periods of the lowest voice heard here.
        double lo = 1.0e9, hi = 0.0;
        for (size_t from = 24000; from + 4800 <= out.left.size(); from += 1200) {
          const double level = tone_level(out.left, f * kVoiceRatio[v], kRate, from, from + 4800);
          lo = std::min(lo, level);
          hi = std::max(hi, level);
        }
        worst = std::max(worst, db(hi / lo));
      }
    }
    std::printf("steadiness: the level of a voice on a held sine moves by at most %.2f dB\n", worst);
    EXPECT(worst < 0.5, "voices hold their level on a steady sine (no warble)");
  }

  // Attack is the time the voices take to reach nine tenths of their level.
  {
    const float seconds[3] = {0.1f, 0.5f, 1.5f};
    for (float attack : seconds) {
      solo(device, p::kUp1);
      device.set_param(p::kAttack, attack);
      Stereo out = run(device, sine(330.0f, attack * 3.0f + 0.5f, kRate, 0.5f));
      double reached = -1.0;
      for (size_t from = 0; from + 960 <= out.left.size() && reached < 0.0; from += 240) {
        if (peak(out.left, from, from + 960) > 0.45) reached = (static_cast<double>(from) + 480.0) / kRate;
      }
      std::printf("attack %.1f s: the octave reaches nine tenths after %.2f s\n", attack, reached);
      std::snprintf(label, sizeof label, "Attack %.1f s takes about that long", attack);
      EXPECT(reached > 0.75 * attack && reached < 1.25 * attack, label);
    }
  }

  // Filter is a low-pass on the voices: 3 dB down at its frequency, 12 dB
  // per octave above. Resonance puts a peak there.
  {
    double level[3];
    const float cutoff[3] = {16000.0f, 1000.0f, 500.0f};
    for (int n = 0; n < 3; ++n) {
      solo(device, p::kUp1);
      device.set_param(p::kFilter, cutoff[n]);
      Stereo out = run(device, sine(500.0f, 1.0f, kRate, 0.2f));
      level[n] = tone_level(out.left, 1000.0, kRate, 24000);
    }
    std::printf("filter: a 1 kHz voice is %.1f dB down with Filter at 1 kHz, %.1f dB at 500 Hz\n",
                -db(level[1] / level[0]), -db(level[2] / level[0]));
    EXPECT(std::fabs(db(level[1] / level[0]) + 3.0) < 0.7, "the voices are 3 dB down at the Filter frequency");
    EXPECT(std::fabs(db(level[2] / level[0]) + 12.3) < 1.5, "and 12 dB down an octave above it");
    solo(device, p::kUp1);
    device.set_param(p::kFilter, 1000.0f);
    device.set_param(p::kResonance, 1.0f);
    Stereo out = run(device, sine(500.0f, 1.0f, kRate, 0.02f));
    const double peaked = tone_level(out.left, 1000.0, kRate, 24000) / (level[0] * 0.1);
    std::printf("resonance: full Resonance lifts the Filter frequency by %.1f dB\n", db(peaked));
    EXPECT(db(peaked) > 15.0 && db(peaked) < 24.0, "Resonance puts a peak at the Filter frequency");
  }

  // Detune pulls each voice its own way: at full, 5 cents up, 8 down,
  // 11 up and 15 down, wherever the note sits in its channel.
  {
    const double cents[4] = {5.0, -8.0, 11.0, -15.0};
    const float hz[2] = {440.0f, 453.0f};
    double worst = 0.0;
    for (float f : hz) {
      for (int v = 0; v < 4; ++v) {
        solo(device, kVoiceParam[v]);
        device.set_param(p::kDetune, 1.0f);
        Stereo out = run(device, sine(f, 3.0f, kRate, 0.5f));
        const double nominal = f * kVoiceRatio[v];
        const double found = dominant_frequency(out.left, kRate, nominal * 0.97, nominal * 1.03, 48000);
        const double measured = 1200.0 * std::log2(found / nominal);
        worst = std::max(worst, std::fabs(measured - cents[v]));
        if (f == hz[0]) std::printf("detune, %s: %+.2f cents (set %+.0f)\n", kVoiceName[v], measured, cents[v]);
      }
    }
    EXPECT(worst < 0.5, "full Detune moves the voices by 5, 8, 11 and 15 cents");
    solo(device, p::kUp1);
    device.set_param(p::kDetune, 0.5f);
    Stereo out = run(device, sine(440.0f, 3.0f, kRate, 0.5f));
    const double half = 1200.0 * std::log2(dominant_frequency(out.left, kRate, 860.0, 900.0, 48000) / 880.0);
    EXPECT(std::fabs(half - 5.5) < 0.5, "half Detune is half as far");
  }

  // MORE CHECKS

  device.init(kRate);
  device.set_param(p::kSub2, 1.0f);
  device.set_param(p::kSub1, 1.0f);
  device.set_param(p::kUp1, 1.0f);
  device.set_param(p::kUp2, 1.0f);
  device.set_param(p::kDetune, 1.0f);
  device.set_param(p::kAttack, 0.3f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("octaves (all four voices, detuned, noise)", 10.0f, kRate, [&] { run(device, input); });

  return finish("octaves");
}
