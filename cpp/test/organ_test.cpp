// Native harness for Reed Organ (cpp/devices/organ). The conformance pass
// covers silence, determinism, voice stealing and parameter abuse; the rest
// measures the organ: what each rank adds and where, the flute-to-reed morph,
// the celeste's beat, the wind (noise, bellows, tremulant), speech and levels.

#include "../devices/organ/organ.h"
#include "support/test_kit.h"

#include <complex>

using namespace testkit;
using livemix::Organ;
namespace p = livemix::organ;

static Organ device;

static const float kRate = 48000.0f;

// The 8' flute alone on steady wind, speaking and stopping at once.
static void dry(Organ& d) {
  d.init(kRate);
  d.set_param(p::kSub, 0.0f);
  d.set_param(p::kOctave, 0.0f);
  d.set_param(p::kTwelfth, 0.0f);
  d.set_param(p::kFifteenth, 0.0f);
  d.set_param(p::kReed, 0.0f);
  d.set_param(p::kCeleste, 0.0f);
  d.set_param(p::kBreath, 0.0f);
  d.set_param(p::kBellows, 0.0f);
  d.set_param(p::kTremulant, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kTone, 12000.0f);
  d.set_param(p::kVolume, 0.0f);
}

// Keys sit a little to one side; most measurements want the sum.
static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(a.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = a[i] - b[i];
  return out;
}

// Power spectrum (Hann) of n samples from `from`; n is a power of two.
static std::vector<double> power_spectrum(const std::vector<float>& x, size_t from, size_t n) {
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    a[i] = from + i < x.size() ? w * x[from + i] : 0.0;
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> step = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w = 1.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= step;
      }
    }
  }
  std::vector<double> power(n / 2);
  for (size_t i = 0; i < n / 2; ++i) power[i] = std::norm(a[i]);
  return power;
}

// Share of the power in [lo, hi) Hz.
static double band_share(const std::vector<double>& power, double lo, double hi) {
  const double bin = kRate / (2.0 * static_cast<double>(power.size()));
  double inside = 0.0, total = 0.0;
  for (size_t i = 0; i < power.size(); ++i) {
    const double hz = static_cast<double>(i) * bin;
    total += power[i];
    if (hz >= lo && hz < hi) inside += power[i];
  }
  return total > 0.0 ? inside / total : 0.0;
}

// Share of the power further than 16 bins from every multiple of `hz`.
static double off_grid_share(const std::vector<float>& x, double hz, size_t from, size_t n = 16384) {
  const std::vector<double> power = power_spectrum(x, from, n);
  const double bin = kRate / static_cast<double>(n);
  double off = 0.0, total = 0.0;
  for (size_t i = 8; i < power.size(); ++i) {
    const double f = static_cast<double>(i) * bin;
    const double k = std::round(f / hz);
    total += power[i];
    if (k < 1.0 || std::fabs(f - k * hz) > 16.0 * bin) off += power[i];
  }
  return total > 0.0 ? off / total : 0.0;
}

// Gain over time of `with` against `without` (the same keys rendered without
// the modulation under test), in `hop`-sample windows.
static std::vector<float> gain_trace(const std::vector<float>& with, const std::vector<float>& without,
                                     size_t from, size_t to, size_t hop) {
  std::vector<float> trace;
  for (size_t at = from; at + hop <= to; at += hop) {
    trace.push_back(static_cast<float>(rms(with, at, at + hop) / rms(without, at, at + hop)));
  }
  return trace;
}

static std::vector<float> centred(std::vector<float> x) {
  const float centre = static_cast<float>(mean(x));
  for (float& v : x) v -= centre;
  return x;
}

static double highest(const std::vector<float>& x) { return *std::max_element(x.begin(), x.end()); }
static double lowest(const std::vector<float>& x) { return *std::min_element(x.begin(), x.end()); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// Beat rate: the strongest frequency in the squared-level envelope.
static double beat_rate(const std::vector<float>& x, size_t from, size_t hop) {
  std::vector<float> envelope;
  for (size_t at = from; at + hop <= x.size(); at += hop) {
    const double level = rms(x, at, at + hop);
    envelope.push_back(static_cast<float>(level * level));
  }
  return dominant_frequency(centred(envelope), kRate / static_cast<double>(hop), 0.2, 8.0);
}

int main() {
  Conformance spec;
  spec.name = "organ";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 2.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // The 8' flute: the played pitch, and nothing else.
  for (float hz : {55.0f, 220.0f, 880.0f, 3520.0f}) {
    dry(device);
    device.note_on(1, hz, 0.8f);
    const std::vector<float> out = mid(render(device, 1.5f, kRate));
    const double found = dominant_frequency(out, kRate, hz * 0.7, hz * 1.4, 12000, 60000);
    EXPECT(std::fabs(cents(found, hz)) < 1.0, "the 8' rank sounds at the played pitch");
    double others = 0.0;
    for (double k : {0.5, 2.0, 3.0, 4.0, 5.0}) others = std::max(others, tone_level(out, hz * k, kRate, 12000, 60000));
    EXPECT(others < 2.0e-4 * tone_level(out, hz, kRate, 12000, 60000),
           "a flute rank is a sine: nothing at any other footage or harmonic");
  }

  // Each stop adds its own footage, at the level set, and nothing at 0.
  {
    const double f = 220.0;
    struct Stop {
      int param;
      double multiple;
      const char* name;
    };
    const Stop stops[4] = {{p::kSub, 0.5, "Sub: 16', half the 8' frequency"},
                           {p::kOctave, 2.0, "Octave: 4', twice"},
                           {p::kTwelfth, 3.0, "Twelfth: 2 2/3', three times"},
                           {p::kFifteenth, 4.0, "Fifteenth: 2', four times"}};
    for (const Stop& stop : stops) {
      for (float level : {0.25f, 1.0f}) {
        dry(device);
        device.set_param(stop.param, level);
        device.note_on(1, 220.0f, 0.8f);
        const std::vector<float> out = mid(render(device, 1.5f, kRate));
        const double eight = tone_level(out, f, kRate, 12000, 60000);
        EXPECT_NEAR(tone_level(out, f * stop.multiple, kRate, 12000, 60000) / eight, level, 0.01 * level, stop.name);
        for (const Stop& other : stops) {
          if (other.param == stop.param) continue;
          EXPECT(tone_level(out, f * other.multiple, kRate, 12000, 60000) < 2.0e-4 * eight,
                 "a stop at 0 adds nothing at its footage");
        }
      }
    }
    // Registration is partly compensated: all stops out is about 2 dB up.
    dry(device);
    device.note_on(1, 220.0f, 0.8f);
    const double alone = rms(mid(render(device, 1.0f, kRate)), 12000, 48000);
    dry(device);
    for (int id : {p::kSub, p::kOctave, p::kTwelfth, p::kFifteenth}) device.set_param(id, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    const double full = rms(mid(render(device, 1.0f, kRate)), 12000, 48000);
    EXPECT_NEAR(db(full / alone), 2.2, 0.5, "drawing every stop makes a key about 2 dB louder");
  }

  // The ranks of a key are locked to one phase: the same relation between
  // them for every key-down (each starts anywhere in its cycle), and no drift
  // over a long held note.
  {
    double relation[3][2];
    for (int note = 0; note < 3; ++note) {
      if (note == 0) {
        dry(device);
        device.set_param(p::kOctave, 1.0f);
        device.set_param(p::kTwelfth, 1.0f);
      } else {
        device.note_off(note);
        render(device, 0.5f, kRate);
      }
      device.note_on(note + 1, 220.0f, 0.8f);
      const std::vector<float> out = mid(render(device, 1.5f, kRate));
      const double eight = tone_phase(out, 220.0, kRate, 12000, 60000);
      relation[note][0] = tone_phase(out, 440.0, kRate, 12000, 60000) - 2.0 * eight;
      relation[note][1] = tone_phase(out, 660.0, kRate, 12000, 60000) - 3.0 * eight;
    }
    double worst = 0.0;
    for (int note = 1; note < 3; ++note) {
      for (int r = 0; r < 2; ++r) {
        worst = std::max(worst, std::fabs(std::remainder(relation[note][r] - relation[0][r], 2.0 * kPi)));
      }
    }
    std::printf("  phase of the 4' and 2 2/3' against the 8' over three key-downs: within %.5f rad\n", worst);
    EXPECT(worst < 0.01, "every key-down has the same phase relation between its ranks");

    const std::vector<float> late = mid(render(device, 40.0f, kRate));
    const size_t at = late.size() - 48000;
    const double eight = tone_phase(late, 220.0, kRate, at, at + 48000);
    const double drift = std::remainder(tone_phase(late, 660.0, kRate, at, at + 48000) - 3.0 * eight - relation[2][1],
                                        2.0 * kPi);
    EXPECT(std::fabs(drift) < 0.01, "and the ranks have not drifted 40 s later");
  }

  // Reed: from a sine to the pulse of a free reed.
  {
    const double f = 220.0;
    double last = -1.0, lowest_fundamental = 1.0e9, flute_fundamental = 0.0;
    bool rises = true;
    std::vector<float> reed_wave;
    for (int step = 0; step <= 4; ++step) {
      dry(device);
      device.set_param(p::kReed, 0.25f * static_cast<float>(step));
      device.note_on(1, 220.0f, 0.8f);
      const std::vector<float> out = mid(render(device, 1.5f, kRate));
      double upper = 0.0;
      for (int k = 4; k <= 30; ++k) {
        const double level = tone_level(out, f * k, kRate, 12000, 60000);
        upper += level * level;
      }
      const double fundamental = tone_level(out, f, kRate, 12000, 60000);
      if (step == 0) flute_fundamental = fundamental;
      lowest_fundamental = std::min(lowest_fundamental, fundamental);
      const double share = upper / (fundamental * fundamental);
      if (share <= last) rises = false;
      last = share;
      if (step == 4) reed_wave = out;
    }
    EXPECT(rises, "Reed raises the upper-harmonic energy at every step");
    EXPECT(last > 0.1, "a full reed has a strong upper spectrum");
    EXPECT(lowest_fundamental > 0.6 * flute_fundamental, "the fundamental gives way a little, never vanishes");
    // A full reed: each harmonic kReedMost of the one below, all of them there.
    const double h1 = tone_level(reed_wave, f, kRate, 12000, 60000);
    for (int k : {2, 3, 5, 8, 12}) {
      const double expected = std::pow(Organ::kReedMost, k - 1);
      EXPECT_NEAR(tone_level(reed_wave, f * k, kRate, 12000, 60000) / h1, expected, 0.02 * expected,
                  "the reed's harmonics fall by a fixed ratio");
    }
    // Reed changes colour, not loudness.
    dry(device);
    device.note_on(1, 220.0f, 0.8f);
    const double flute_level = rms(mid(render(device, 1.0f, kRate)), 12000, 48000);
    EXPECT_NEAR(db(rms(reed_wave, 12000, 48000) / flute_level), 0.0, 0.3, "flute and reed are equally loud");

    // Small pipes are flutes: the reed is withdrawn up the keyboard, and what
    // is left does not fold back (partials are multiples of the 16' pitch).
    double worst = 0.0;
    for (int step = 0; step < 12; ++step) {
      const float hz = 207.0f * std::pow(2.0f, static_cast<float>(step) * (4.4f / 12.0f));
      dry(device);
      for (int id : {p::kSub, p::kOctave, p::kTwelfth, p::kFifteenth, p::kReed}) device.set_param(id, 1.0f);
      device.set_param(p::kVolume, -12.0f);
      device.note_on(1, hz, 0.8f);
      const std::vector<float> out = mid(render(device, 0.6f, kRate));
      worst = std::max(worst, off_grid_share(out, 0.5 * hz, 9600));
    }
    std::printf("  worst folded energy, full reed, every stop, 207 Hz to 4.4 kHz: %.1f dB\n",
                10.0 * std::log10(std::max(worst, 1e-20)));
    EXPECT(worst < 1.0e-6, "the reed does not alias: under -60 dB between the partials");
    auto brightness = [&](float hz) {
      dry(device);
      device.set_param(p::kReed, 1.0f);
      device.note_on(1, hz, 0.8f);
      const std::vector<float> out = mid(render(device, 0.6f, kRate));
      return tone_level(out, 2.0 * hz, kRate, 9600, 28800) / tone_level(out, hz, kRate, 9600, 28800);
    };
    const double low = brightness(220.0f), high = brightness(3520.0f);
    std::printf("  second harmonic of a full reed: %.3f at 220 Hz, %.3f at 3520 Hz\n", low, high);
    EXPECT(high < 0.55 * low && high > 0.2, "high pipes keep some reed but less of it");
  }

  // Celeste: a second 8' tuned sharp, beating at the rate its tuning implies.
  {
    for (float hz : {220.0f, 880.0f}) {
      dry(device);
      device.set_param(p::kCeleste, 1.0f);
      device.note_on(1, hz, 0.8f);
      const std::vector<float> out = mid(render(device, 12.0f, kRate));
      const size_t hop = hz < 500.0f ? 1200 : 600;
      EXPECT_NEAR(beat_rate(out, 4800, hop), Organ::celeste_beat_hz(hz), 0.02, "the celeste beats at its tuned rate");
      double lo = 1.0e9, hi = 0.0;
      for (size_t at = 4800; at + hop <= out.size(); at += hop) {
        const double level = rms(out, at, at + hop);
        lo = std::min(lo, level);
        hi = std::max(hi, level);
      }
      EXPECT(lo < 0.1 * hi, "Celeste 1: equal ranks cancel completely at the bottom of the beat");
    }
    dry(device);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> plain = mid(render(device, 6.0f, kRate));
    double lo = 1.0e9, hi = 0.0;
    for (size_t at = 4800; at + 2400 <= plain.size(); at += 2400) {
      const double level = rms(plain, at, at + 2400);
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    EXPECT(hi < 1.002 * lo, "Celeste 0: a perfectly steady note");

    // It stands on the other side of the case from its 8'.
    dry(device);
    device.set_param(p::kCeleste, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo both = render(device, 6.0f, kRate);
    const double sharp = 220.0 + Organ::celeste_beat_hz(220.0f);
    // 4 s resolves two tones 0.92 Hz apart.
    const double left_sharp = tone_level(both.left, sharp, kRate, 48000, 240000);
    const double right_sharp = tone_level(both.right, sharp, kRate, 48000, 240000);
    const double left_main = tone_level(both.left, 220.0, kRate, 48000, 240000);
    const double right_main = tone_level(both.right, 220.0, kRate, 48000, 240000);
    EXPECT((left_sharp > right_sharp) != (left_main > right_main), "the celeste leans the other way from its 8'");
  }

  // Breath: wind noise that is not there at 0, follows the keys, and stops.
  {
    auto play = [&](float breath, int keys, float reed) {
      dry(device);
      device.set_param(p::kBreath, breath);
      device.set_param(p::kReed, reed);
      device.set_param(p::kAttack, 0.1f);
      device.set_param(p::kRelease, 0.3f);
      for (int n = 0; n < keys; ++n) device.note_on(n, 220.0f * std::pow(2.0f, n * 4 / 12.0f), 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      for (int n = 0; n < keys; ++n) device.note_off(n);
      return concat(out, render(device, 1.5f, kRate));
    };
    const Stereo none = play(0.0f, 1, 0.0f);
    const Stereo full = play(1.0f, 1, 0.0f);
    const double clean = off_grid_share(none.left, 220.0, 24000), windy = off_grid_share(full.left, 220.0, 24000);
    std::printf("  energy between the partials: %.1f dB at Breath 0, %.1f dB at Breath 1\n",
                10.0 * std::log10(std::max(clean, 1e-20)), 10.0 * std::log10(windy));
    EXPECT(clean < 1.0e-7 && windy > 1.0e-3, "Breath 0: nothing between the partials; Breath 1: noise there");
    // Everything else being deterministic, the difference is the wind alone.
    const std::vector<float> wind = minus(full.left, none.left);
    const double steady = rms(wind, 48000, 96000);
    const double note = rms(none.left, 48000, 96000);
    std::printf("  wind noise at Breath 1: %.1f dB against the pipe\n", db(steady / note));
    EXPECT(steady > 0.02 * note && steady < 0.5 * note, "Breath 1 adds audible wind under the note");
    const std::vector<double> power = power_spectrum(wind, 48000, 32768);
    EXPECT(band_share(power, 250.0, 6000.0) > 0.8, "the wind is band-limited: mostly 250 Hz to 6 kHz");
    EXPECT(band_share(power, 10000.0, 24000.0) < 0.03 && band_share(power, 0.0, 80.0) < 0.03,
           "with little hiss and no rumble");
    EXPECT_NEAR(rms(minus(play(0.5f, 1, 0.0f).left, none.left), 48000, 96000) / steady, 0.5, 0.02,
                "Breath scales it");
    // Chiff: the pipe coughs as it speaks.
    std::printf("  chiff: %.2f times the steady wind in the first 40 ms\n", rms(wind, 240, 1920) / steady);
    EXPECT(rms(wind, 240, 1920) > 1.5 * steady, "a puff of noise at the start of the note");
    EXPECT(band_share(power_spectrum(wind, 0, 2048), 440.0, 990.0) > 0.6 &&
               band_share(power, 440.0, 990.0) < 0.4,
           "pitched around the pipe's third harmonic, unlike the steady wind");
    // It follows the keys: gone with the release, exactly silent after.
    EXPECT(rms(wind, 96000 + 7200, 96000 + 9600) < 0.4 * steady, "the wind falls with the note");
    EXPECT(peak(full.left, 96000 + 48000) == 0.0 && peak(full.right, 96000 + 48000) == 0.0,
           "and stops when no key sounds");
    // More keys do not mean a gale.
    const std::vector<float> many = minus(play(1.0f, 6, 0.0f).left, play(0.0f, 6, 0.0f).left);
    EXPECT(rms(many, 48000, 96000) < 1.3 * steady, "six keys make no more wind than one");
    // Left and right wind are different noise.
    const std::vector<float> wind_right = minus(full.right, none.right);
    EXPECT(std::fabs(correlation(wind, wind_right, 48000, 96000)) < 0.2, "the wind is wide");
  }

  // Bellows: a slow pump that moves level and pitch together.
  {
    auto play = [&](float bellows) {
      dry(device);
      device.set_param(p::kBellows, bellows);
      device.note_on(1, 800.0f, 0.8f);  // 60 samples per cycle
      return mid(render(device, 40.0f, kRate));
    };
    const std::vector<float> still = play(0.0f);
    const std::vector<float> pumped = play(1.0f);
    const std::vector<float> trace = gain_trace(pumped, still, 4800, pumped.size(), 2400);
    std::printf("  bellows at 1: gain between %.3f and %.3f\n", lowest(trace), highest(trace));
    EXPECT(highest(trace) > 1.15 && highest(trace) <= 1.0 + Organ::kBellowsDepth + 0.01 &&
               lowest(trace) < 0.85 && lowest(trace) >= 1.0 - Organ::kBellowsDepth - 0.01,
           "Bellows 1 moves the level by about 2 dB each way");
    EXPECT_NEAR(dominant_frequency(centred(trace), 20.0, 0.05, 3.0), Organ::kBellowsHz, 0.02,
                "at the pace of a pump, about once every three seconds");
    double fastest = 0.0;
    for (size_t i = 1; i < trace.size(); ++i) fastest = std::max(fastest, std::fabs(static_cast<double>(trace[i] - trace[i - 1])));
    EXPECT(fastest < 0.03, "slowly: under 3 % in any 50 ms");
    // Pitch follows pressure: sharp at the top of the stroke, flat at the bottom.
    const size_t top = 4800 + 2400 * static_cast<size_t>(std::max_element(trace.begin(), trace.end()) - trace.begin());
    const size_t bottom =
        4800 + 2400 * static_cast<size_t>(std::min_element(trace.begin(), trace.end()) - trace.begin());
    const double high_hz = dominant_frequency(pumped, kRate, 780.0, 820.0, top - 4800, top + 7200);
    const double low_hz = dominant_frequency(pumped, kRate, 780.0, 820.0, bottom - 4800, bottom + 7200);
    const double expected = cents(1.0 + Organ::kPitchPerPressure * (highest(trace) - 1.0),
                                  1.0 + Organ::kPitchPerPressure * (lowest(trace) - 1.0));
    std::printf("  pitch from the bottom to the top of the stroke: %.2f cents (pressure implies %.2f)\n",
                cents(high_hz, low_hz), expected);
    EXPECT_NEAR(cents(high_hz, low_hz), expected, 1.0, "the pitch rises and falls with the level, very slightly");

    const std::vector<float> half = gain_trace(play(0.5f), still, 4800, pumped.size(), 2400);
    EXPECT_NEAR((highest(half) - lowest(half)) / (highest(trace) - lowest(trace)), 0.5, 0.03, "Bellows sets the depth");
  }

  // Tremulant: 5.5 Hz, level and pitch.
  {
    auto play = [&](float depth) {
      dry(device);
      device.set_param(p::kTremulant, depth);
      device.note_on(1, 800.0f, 0.8f);
      return mid(render(device, 6.0f, kRate));
    };
    const std::vector<float> still = play(0.0f);
    const std::vector<float> shaken = play(1.0f);
    const std::vector<float> trace = gain_trace(shaken, still, 4800, shaken.size(), 240);
    EXPECT_NEAR(dominant_frequency(centred(trace), 200.0, 1.0, 20.0), Organ::kTremulantHz, 0.03,
                "the tremulant beats at 5.5 Hz");
    EXPECT_NEAR(highest(trace), 1.0 + Organ::kTremulantDepth, 0.01, "Tremulant 1: 30 % up");
    EXPECT_NEAR(lowest(trace), 1.0 - Organ::kTremulantDepth, 0.01, "and 30 % down");
    const std::vector<float> half = gain_trace(play(0.5f), still, 4800, shaken.size(), 240);
    EXPECT_NEAR(highest(half) - lowest(half), Organ::kTremulantDepth, 0.01, "Tremulant sets the depth");
    // The pitch shakes with it: sidebands at 5.5 Hz from frequency modulation
    // would be there without any level change; check the vibrato directly by
    // the frequency at the crest and the trough.
    const size_t crest = 4800 + 240 * static_cast<size_t>(std::max_element(trace.begin(), trace.begin() + 100) -
                                                         trace.begin());
    const size_t half_cycle = static_cast<size_t>(kRate / Organ::kTremulantHz / 2.0f);
    const double up = dominant_frequency(shaken, kRate, 780.0, 820.0, crest - 960, crest + 1200);
    const double down = dominant_frequency(shaken, kRate, 780.0, 820.0, crest + half_cycle - 960,
                                           crest + half_cycle + 1200);
    std::printf("  tremulant vibrato: %.1f cents from trough to crest\n", cents(up, down));
    EXPECT(cents(up, down) > 3.0 && cents(up, down) < 14.0, "the tremulant bends the pitch a few cents with the level");
  }

  // Speech: pipes do not start or stop at once.
  {
    dry(device);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    std::vector<float> rise = mid(render(device, 2.0f, kRate));
    const double full = rms(rise, 72000, 96000);
    EXPECT(rms(rise, 0, 4800) < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise, 52800, 57600) > 0.9 * full, "and has arrived shortly after 1 s");
    device.note_off(1);
    std::vector<float> fall = mid(render(device, 3.0f, kRate));
    EXPECT(rms(fall, 19200, 24000) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall, 48000, 52800) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall, 110400, 144000) == 0.0, "and is exactly silent soon after");

    device.init(kRate);
    device.set_param(p::kBreath, 0.0f);
    device.set_param(p::kBellows, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    std::vector<float> soft = mid(render(device, 1.0f, kRate));
    EXPECT(rms(soft, 0, 960) < 0.3 * rms(soft, 24000, 48000), "the default patch speaks softly: quiet for the first 20 ms");
  }

  // Tone darkens.
  {
    auto play = [&](float tone) {
      dry(device);
      device.set_param(p::kReed, 1.0f);
      device.set_param(p::kTone, tone);
      device.note_on(1, 220.0f, 0.8f);
      return mid(render(device, 1.0f, kRate));
    };
    const std::vector<float> bright = play(12000.0f);
    const std::vector<float> dark = play(500.0f);
    EXPECT(tone_level(dark, 220.0 * 9, kRate, 12000, 36000) < 0.1 * tone_level(bright, 220.0 * 9, kRate, 12000, 36000),
           "Tone takes the upper harmonics of the reeds away");
    EXPECT(tone_level(dark, 220.0, kRate, 12000, 36000) > 0.85 * tone_level(bright, 220.0, kRate, 12000, 36000),
           "and leaves the fundamental");
  }

  // Adjacent semitones stand on opposite sides of the chest.
  {
    double lean[2];
    const float keys[2] = {220.0f, 233.08f};
    for (int k = 0; k < 2; ++k) {
      dry(device);
      device.note_on(1, keys[k], 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      lean[k] = db(rms(out.left, 12000) / rms(out.right, 12000));
    }
    EXPECT(lean[0] * lean[1] < 0.0, "neighbouring keys lean opposite ways");
    EXPECT(std::fabs(lean[0]) > 1.0 && std::fabs(lean[0]) < 4.0, "by a few dB, not hard left and right");
  }

  // Pulling stops, turning the reed or moving the tone under a held key does
  // not click.
  {
    dry(device);
    for (int id : {p::kSub, p::kOctave, p::kFifteenth}) device.set_param(id, 0.8f);
    device.set_param(p::kVolume, -6.0f);
    device.note_on(1, 110.0f, 0.8f);
    const std::vector<float> steady = mid(render(device, 0.5f, kRate));
    const double reference = max_step(steady, 4800);
    std::vector<float> moving;
    for (int block = 0; block < 100; ++block) {
      const bool odd = block % 2 == 1;
      device.set_param(p::kSub, odd ? 0.0f : 0.8f);
      device.set_param(p::kOctave, odd ? 0.1f : 0.8f);
      device.set_param(p::kFifteenth, odd ? 0.0f : 0.8f);
      device.set_param(p::kCeleste, odd ? 0.0f : 0.5f);
      device.set_param(p::kTone, odd ? 800.0f : 12000.0f);
      device.set_param(p::kVolume, odd ? -18.0f : -6.0f);
      device.set_param(p::kBellows, odd ? 0.0f : 1.0f);
      device.set_param(p::kTremulant, odd ? 0.0f : 1.0f);
      const std::vector<float> piece = mid(render(device, 0.01f, kRate));
      moving.insert(moving.end(), piece.begin(), piece.end());
    }
    std::printf("  largest step: %.4f steady, %.4f with eight parameters jumping\n", reference, max_step(moving));
    EXPECT(max_step(moving) < 1.6 * reference, "parameter jumps are smoothed");
  }

  // Levels: one key, and a ten-note chord under the clip knee.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 2.0f, kRate);
    const double level_db = db(std::max(peak(one.left), peak(one.right)));
    std::printf("  one key at the default volume peaks at %.1f dBFS\n", level_db);
    EXPECT(level_db > -24.0 && level_db < -10.0, "one key at the default volume peaks between -24 and -10 dBFS");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo ten = render(device, 12.0f, kRate);
    const double ten_peak = std::max(peak(ten.left), peak(ten.right));
    std::printf("  ten held keys peak at %.3f over 12 s\n", ten_peak);
    EXPECT(ten_peak < 0.5, "a ten-note chord stays under the clip knee");
  }

  // Cost with every voice sounding.
  device.init(kRate);
  for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  report_cost("organ (16 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("organ");
}
