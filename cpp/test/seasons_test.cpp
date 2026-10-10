// Native harness for Seasons (cpp/devices/seasons). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a year: each season's signature at
// its centre, a blend with no step in it anywhere round the dial, a clock
// that turns the year at the stated speed whatever the sound does, and a
// level that holds. Run it with any argument to print every figure.

#include <complex>
#include <string>

#include "../devices/seasons/seasons.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Seasons;
namespace p = livemix::seasons;

static Seasons device;

static const float kRate = 48000.0f;
static bool g_print = false;

// The four season centres on the Year dial.
static const char* const kSeasonName[4] = {"spring", "summer", "autumn", "winter"};

// --- measuring ------------------------------------------------------------------------------

static void fft(std::vector<std::complex<double>>& a) {
  const size_t n = a.size();
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const double angle = -2.0 * kPi / static_cast<double>(len);
    const std::complex<double> root(std::cos(angle), std::sin(angle));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w(1.0);
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= root;
      }
    }
  }
}

// Mean power spectrum over Hann frames of 4096 samples in [from, to).
static std::vector<double> spectrum(const std::vector<float>& x, size_t from, size_t to) {
  const size_t frame = 4096;
  std::vector<double> power(frame / 2 + 1, 0.0);
  to = std::min(to, x.size());
  int frames = 0;
  for (size_t s = from; s + frame <= to; s += frame / 2) {
    std::vector<std::complex<double>> a(frame);
    for (size_t i = 0; i < frame; ++i) {
      a[i] = x[s + i] * (0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / frame));
    }
    fft(a);
    for (size_t k = 0; k <= frame / 2; ++k) power[k] += std::norm(a[k]);
    ++frames;
  }
  for (double& v : power) v /= std::max(1, frames);
  return power;
}

// Spectral centroid in Hz over [from, to).
static double centroid(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  const std::vector<double> power = spectrum(x, from, to);
  double weighted = 0.0, total = 0.0;
  for (size_t k = 1; k < power.size(); ++k) {
    weighted += power[k] * static_cast<double>(k) * kRate / 4096.0;
    total += power[k];
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// K-weighting (ITU-R BS.1770) at 48 kHz: a high shelf, then a high pass.
static std::vector<float> k_weighted(const std::vector<float>& x) {
  const double b1[3] = {1.53512485958697, -2.69169618940638, 1.19839281085285};
  const double a1[2] = {-1.69065929318241, 0.73248077421585};
  const double a2[2] = {-1.99004745483398, 0.99007225036621};
  std::vector<float> out(x.size());
  double z1 = 0, z2 = 0, y1 = 0, y2 = 0, u1 = 0, u2 = 0, v1 = 0, v2 = 0;
  for (size_t i = 0; i < x.size(); ++i) {
    const double in = x[i];
    const double s = b1[0] * in + b1[1] * z1 + b1[2] * z2 - a1[0] * y1 - a1[1] * y2;
    z2 = z1;
    z1 = in;
    y2 = y1;
    y1 = s;
    const double t = s - 2.0 * u1 + u2 - a2[0] * v1 - a2[1] * v2;
    u2 = u1;
    u1 = s;
    v2 = v1;
    v1 = t;
    out[i] = static_cast<float>(t);
  }
  return out;
}

// Loudness of a stereo render in LUFS, ungated, from `from` on.
static double loudness(const Stereo& s, size_t from = 0) {
  const double left = rms(k_weighted(s.left), from), right = rms(k_weighted(s.right), from);
  return -0.691 + 10.0 * std::log10(std::max(1.0e-20, left * left + right * right));
}

// RMS of both sides together over [from, to).
static double level(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  const double left = rms(s.left, from, to), right = rms(s.right, from, to);
  return std::sqrt(0.5 * (left * left + right * right));
}

// RMS in consecutive windows of `window` samples from `from`.
static std::vector<float> windows(const std::vector<float>& x, size_t from, size_t window) {
  std::vector<float> out;
  for (size_t s = from; s + window <= x.size(); s += window) {
    out.push_back(static_cast<float>(rms(x, s, s + window)));
  }
  return out;
}

// Where the energy between `lo` and `hi` Hz lies over [from, to): its mean
// frequency. (A ring that has been shifted on every pass is a row of lines,
// and the strongest of them jumps about; their centre does not.)
static double band_centre(const std::vector<float>& x, double lo, double hi, size_t from, size_t to) {
  double weighted = 0.0, total = 0.0;
  for (double hz = lo; hz <= hi; hz += 1.0) {
    const double amplitude = tone_level(x, hz, kRate, from, to);
    weighted += amplitude * amplitude * hz;
    total += amplitude * amplitude;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

static double largest_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// --- material --------------------------------------------------------------------------------

// Pink-ish noise at an RMS of `gain`.
static std::vector<float> pink(float seconds, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate));
  double b0 = 0, b1 = 0, b2 = 0;
  for (float& v : out) {
    const double w = white();
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    v = static_cast<float>((b0 + b1 + b2 + w * 0.1848) * 0.25);
  }
  const double r = rms(out);
  for (float& v : out) v = static_cast<float>(v * gain / r);
  return out;
}

// Pink noise with a side to it (left and right correlate at 0.6).
static Stereo wide_pink(float seconds, float gain) {
  rng_state() = 0x777u;
  const std::vector<float> a = pink(seconds, gain), b = pink(seconds, gain);
  Stereo out;
  out.left.resize(a.size());
  out.right.resize(a.size());
  for (size_t i = 0; i < a.size(); ++i) {
    out.left[i] = a[i] + 0.5f * b[i];
    out.right[i] = a[i] - 0.5f * b[i];
  }
  return out;
}

// A played phrase: soft struck keys of six harmonics falling as 1/k², single
// notes and chords, peaking at `gain`. Its centroid is near 330 Hz, like the
// electric piano the preset bench plays.
static std::vector<float> keys(float seconds, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate), 0.0f);
  const int notes[16] = {48, 55, 60, 64, 67, 72, 62, 57, 53, 60, 65, 69, 50, 59, 62, 67};
  int which = 0;
  for (float at = 0.0f; at < seconds - 0.5f; at += 0.45f) {
    const int count = (which % 4 == 3) ? 3 : 1;
    for (int c = 0; c < count; ++c) {
      const double hz = 440.0 * std::pow(2.0, (notes[(which + c * 2) % 16] - 69) / 12.0);
      const size_t start = static_cast<size_t>(at * kRate);
      for (size_t i = start; i < out.size(); ++i) {
        const double t = static_cast<double>(i - start) / kRate;
        if (t > 3.0) break;
        const double envelope = (1.0 - std::exp(-t / 0.004)) * std::exp(-t / 0.9);
        double v = 0.0;
        for (int k = 1; k <= 6; ++k) {
          v += std::sin(2.0 * kPi * hz * k * t) / (k * k) * std::exp(-t * 0.8 * (k - 1));
        }
        out[i] += static_cast<float>(envelope * v);
      }
    }
    ++which;
  }
  const double top = peak(out);
  for (float& v : out) v = static_cast<float>(v * gain / top);
  return out;
}

// A held pad: four notes of detuned saws (harmonics as 1/k under 7 kHz) that
// swell in over half a second, the two sides differing. Peak about `gain`.
static Stereo pad(float seconds, float gain) {
  Stereo out;
  const size_t n = static_cast<size_t>(seconds * kRate);
  out.left.assign(n, 0.0f);
  out.right.assign(n, 0.0f);
  const double notes[4] = {130.81, 164.81, 196.0, 261.63};
  for (int v = 0; v < 8; ++v) {
    const double hz = notes[v / 2] * (v % 2 ? 1.004 : 0.997);
    std::vector<float>& side = (v % 2) ? out.right : out.left;
    std::vector<float>& other = (v % 2) ? out.left : out.right;
    for (int k = 1; hz * k < 7000.0; ++k) {
      const double w = 2.0 * kPi * hz * k / kRate, phase = 0.7 * v + 1.3 * k;
      for (size_t i = 0; i < n; ++i) {
        const float s = static_cast<float>(std::sin(w * static_cast<double>(i) + phase) / k);
        side[i] += s;
        other[i] += 0.4f * s;
      }
    }
  }
  const double top = std::max(peak(out.left), peak(out.right));
  for (size_t i = 0; i < n; ++i) {
    const double envelope = std::min(1.0, static_cast<double>(i) / (0.5 * kRate)) * gain / top;
    out.left[i] = static_cast<float>(out.left[i] * envelope);
    out.right[i] = static_cast<float>(out.right[i] * envelope);
  }
  return out;
}

// Four held sines (A2, E3, A3, C#4) peaking near `gain`.
static std::vector<float> chord(float seconds, float gain) {
  const float hz[4] = {110.0f, 164.81f, 220.0f, 277.18f};
  std::vector<float> out(static_cast<size_t>(seconds * kRate), 0.0f);
  for (float f : hz) {
    const std::vector<float> s = sine(f, seconds, kRate, gain * 0.25f);
    for (size_t i = 0; i < out.size(); ++i) out[i] += s[i];
  }
  return out;
}

// --- settings --------------------------------------------------------------------------------

// A year that stands still at `year`, as far into the season as it goes.
static void still(Seasons& d, float year, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kTurn, 0.0f);
  d.set_param(p::kYear, year);
  d.set_param(p::kDepth, 1.0f);
}

struct Preset {
  std::string name;
  std::vector<std::pair<int, float>> values;
};

// A reader for exactly what device.json holds: the parameter keys in order,
// then "presets": { "Name": { "key": number, ... }, ... }.
static std::vector<Preset> load_presets() {
  std::vector<Preset> presets;
  std::vector<std::string> names;
  std::string text;
  if (std::FILE* file = std::fopen("cpp/devices/seasons/device.json", "rb")) {
    char buffer[4096];
    size_t got;
    while ((got = std::fread(buffer, 1, sizeof buffer, file)) > 0) text.append(buffer, got);
    std::fclose(file);
  }
  const size_t params_at = text.find("\"params\"");
  const size_t presets_at = text.find("\"presets\"");
  const size_t origin_at = text.find("\"origin\"");
  if (params_at == std::string::npos || presets_at == std::string::npos || origin_at == std::string::npos) {
    return presets;
  }
  const auto quoted = [&](size_t from, size_t* end) {
    const size_t open = text.find('"', from);
    const size_t close = text.find('"', open + 1);
    *end = close + 1;
    return text.substr(open + 1, close - open - 1);
  };
  for (size_t pos = text.find("\"key\"", params_at); pos != std::string::npos && pos < presets_at;
       pos = text.find("\"key\"", pos + 1)) {
    size_t end;
    names.push_back(quoted(pos + 5, &end));
  }
  size_t pos = text.find('{', presets_at) + 1;
  while (true) {
    const size_t name_at = text.find('"', pos);
    const size_t close_at = text.find('}', pos);
    if (name_at == std::string::npos || name_at > origin_at || close_at < name_at) break;
    Preset preset;
    size_t end;
    preset.name = quoted(name_at, &end);
    const size_t open = text.find('{', end);
    const size_t close = text.find('}', open);
    pos = open + 1;
    while (true) {
      const size_t key_at = text.find('"', pos);
      if (key_at == std::string::npos || key_at > close) break;
      const std::string key = quoted(key_at, &end);
      const size_t colon = text.find(':', end);
      const float value = std::strtof(text.c_str() + colon + 1, nullptr);
      int id = -1;
      for (size_t k = 0; k < names.size(); ++k) {
        if (names[k] == key) id = static_cast<int>(k);
      }
      preset.values.push_back({id, value});
      pos = text.find_first_of(",}", colon);
    }
    presets.push_back(preset);
    pos = close + 1;
  }
  return presets;
}

static void load(Seasons& d, const Preset& preset) {
  d.init(kRate);
  for (const auto& value : preset.values) d.set_param(value.first, value.second);
}

int main(int argc, char**) {
  g_print = argc > 1;
  Conformance spec;
  spec.name = "seasons";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 2.01f;
  check_effect(device, spec, kRate);

  const Stereo noise_in = wide_pink(7.0f, 0.1f);
  const std::vector<float> phrase = keys(10.0f, 0.3f);
  const Stereo pad_in = pad(8.0f, 0.3f);
  const size_t second = static_cast<size_t>(kRate);

  // --- nothing at nothing ----------------------------------------------------------------
  // Mix 0 is the input sample for sample, and so is Depth 0 at Mix 1 (under
  // full scale, where the output ceiling is exactly linear), with every
  // other knob up and the year turning.
  {
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.set_param(p::kYear, 0.4f);
      device.set_param(p::kTurning, 10.0f);
      device.set_param(p::kSpace, 1.0f);
      device.set_param(p::kMotion, 1.0f);
      device.set_param(p::kGrit, 1.0f);
      device.set_param(p::kTail, 1.0f);
      device.set_param(which == 0 ? p::kMix : p::kDepth, 0.0f);
      const Stereo out = run(device, noise_in.left, noise_in.right);
      EXPECT(out.left == noise_in.left && out.right == noise_in.right,
             which == 0 ? "Mix 0 is the input, sample for sample" : "Depth 0 is the input, sample for sample");
    }
  }

  // --- the dial is a circle ---------------------------------------------------------------
  // Year 1 is Year 0: the same samples.
  {
    still(device, 0.0f);
    const Stereo first = run(device, noise_in.left, noise_in.right);
    still(device, 1.0f);
    const Stereo last = run(device, noise_in.left, noise_in.right);
    EXPECT(first.left == last.left && first.right == last.right, "Year 1 is Year 0, sample for sample");
  }

  // --- each season is what it claims ------------------------------------------------------
  double tilt[4], body[4], presence[4], bright[4], decay[4], width[4];
  const double bright_in = centroid(noise_in.left, second);
  for (int s = 0; s < 4; ++s) {
    const float year = 0.25f * static_cast<float>(s);
    // Tone alone: no room, no movement, no texture.
    const auto tone_only = [&] {
      still(device, year);
      device.set_param(p::kSpace, 0.0f);
      device.set_param(p::kMotion, 0.0f);
      device.set_param(p::kGrit, 0.0f);
    };
    // The gain of a held tone, in dB.
    const auto gain_at = [&](float hz) {
      tone_only();
      const Stereo out = run(device, sine(hz, 1.0f, kRate, 0.25f));
      return db(tone_level(out.left, hz, kRate, second / 2) / 0.25);
    };
    const double low = gain_at(100.0f), middle = gain_at(1000.0f);
    tilt[s] = gain_at(8000.0f) - low;
    body[s] = low - middle;
    presence[s] = gain_at(3000.0f) - middle;
    tone_only();
    const Stereo coloured = run(device, noise_in.left, noise_in.right);
    bright[s] = centroid(coloured.left, second);

    // The room as it comes: how long it rings and how wide the whole is.
    still(device, year);
    rng_state() = 0x55u;
    std::vector<float> burst = noise(0.3f, kRate, 0.5f);
    burst.resize(static_cast<size_t>(kRate * 14.0f), 0.0f);
    const Stereo rung = run(device, burst);
    decay[s] = rt60(rung.left, kRate, 0.45, 0.05, -80.0);
    still(device, year);
    const Stereo spread = run(device, noise_in.left, noise_in.right);
    width[s] = correlation(spread.left, spread.right, second);
    if (g_print) {
      std::printf("%s: 8 kHz against 100 Hz %+.1f dB; against 1 kHz, 100 Hz %+.1f dB and 3 kHz %+.1f dB; "
                  "centroid %.0f Hz (in %.0f), decay %.2f s, left to right %.3f\n",
                  kSeasonName[s], tilt[s], body[s], presence[s], bright[s], bright_in, decay[s], width[s]);
    }
  }
  EXPECT(tilt[0] > 4.5 && tilt[0] < 9.0, "spring is bright and light");
  EXPECT(tilt[1] < -3.0 && tilt[1] > -7.0, "summer is warm and full");
  EXPECT(tilt[2] < -8.0 && tilt[2] > -14.0, "autumn is dark with a low warmth");
  EXPECT(tilt[3] > 4.5 && tilt[3] < 9.5, "winter is thin and glassy");
  EXPECT(body[3] < body[0] - 3.0 && body[3] < -5.0 && body[1] > 2.0 && body[2] > 2.0,
         "winter has the least body of the four, summer and autumn the most");
  EXPECT(presence[0] > presence[3] + 1.0 && presence[0] > 1.5,
         "spring is clear (it lifts 3 kHz), winter glassy (only the very top)");
  EXPECT(bright[0] > 1.4 * bright_in && bright[3] > 1.3 * bright_in, "spring and winter brighten noise");
  EXPECT(bright[1] < 0.75 * bright_in && bright[2] < 0.45 * bright_in && bright[2] < 0.7 * bright[1],
         "summer darkens noise and autumn darkens it most");
  EXPECT(decay[0] > 0.3 && decay[0] < 0.6, "spring's room is short (half a second)");
  EXPECT(decay[1] > 2.2 && decay[1] < 3.6, "summer's haze rings for about three seconds");
  EXPECT(decay[2] > 0.55 && decay[2] < 1.1, "autumn's room is short and dry");
  EXPECT(decay[3] > 4.5 && decay[3] < 8.5, "winter's tail is the longest by far");
  EXPECT(decay[3] > 1.5 * decay[1] && decay[1] > 2.5 * decay[2] && decay[2] > 1.3 * decay[0],
         "the four rooms are four lengths");
  EXPECT(width[1] < 0.3 && width[1] < width[0] - 0.2, "summer is the widest");
  EXPECT(width[3] > 0.8 && width[3] > width[2] + 0.15, "winter is the narrowest");

  // Movement and texture, each with its own knob full up and the other at
  // nothing, the room out of the way.
  double shimmer[4], sway[4], tumble[4], stir[4], dips[4], sparks[4], spark_top[4], warm[4];
  for (int s = 0; s < 4; ++s) {
    const float year = 0.25f * static_cast<float>(s);
    const auto with = [&](float motion, float grit) {
      still(device, year);
      device.set_param(p::kSpace, 0.0f);
      device.set_param(p::kMotion, motion);
      device.set_param(p::kGrit, grit);
    };
    // Shimmer: the top of the sound trembles at 5.3 Hz. A 6 kHz tone's level
    // in 10 ms windows, and how much of it moves at that rate.
    with(1.0f, 0.0f);
    const Stereo top = run(device, sine(6000.0f, 8.0f, kRate, 0.25f));
    const std::vector<float> top_level = windows(top.left, second, 480);
    shimmer[s] = tone_level(top_level, 5.3, 100.0) / mean(top_level);
    // Sway and tumble: the balance of a 440 Hz tone in 50 ms windows.
    with(1.0f, 0.0f);
    const Stereo mid = run(device, sine(440.0f, 24.0f, kRate, 0.25f));
    const std::vector<float> left = windows(mid.left, second, 2400), right = windows(mid.right, second, 2400);
    std::vector<float> balance(left.size());
    for (size_t i = 0; i < left.size(); ++i) balance[i] = (left[i] - right[i]) / (left[i] + right[i]);
    sway[s] = tone_level(balance, 0.19, 20.0);
    tumble[s] = tone_level(balance, 0.83, 20.0);
    stir[s] = rms(balance) * std::sqrt(2.0);
    // Crumble: how often a 6 kHz tone's level (2 ms windows) falls under 0.7
    // of where it mostly stands.
    with(0.0f, 1.0f);
    const Stereo broken = run(device, sine(6000.0f, 8.0f, kRate, 0.25f));
    const std::vector<float> fine = windows(broken.left, second, 96);
    std::vector<float> sorted = fine;
    std::sort(sorted.begin(), sorted.end());
    const float whole = sorted[sorted.size() * 9 / 10];
    int count = 0;
    bool under = false;
    for (float v : fine) {
      const bool now = v < 0.7f * whole;
      if (now && !under) ++count;
      under = now;
    }
    dips[s] = count / 7.0;
    // Glitter: bursts of the octave, the twelfth and the double octave over a
    // 500 Hz tone, in 20 ms windows.
    with(0.0f, 1.0f);
    const Stereo lit = run(device, sine(500.0f, 8.0f, kRate, 0.25f));
    int bursts = 0;
    bool on = false;
    spark_top[s] = 0.0;
    for (size_t at = second; at + 960 <= lit.size(); at += 960) {
      const double over = tone_level(lit.left, 1000.0, kRate, at, at + 960) +
                          tone_level(lit.left, 1500.0, kRate, at, at + 960) +
                          tone_level(lit.left, 2000.0, kRate, at, at + 960);
      const bool now = over > 0.01;
      if (now && !on) ++bursts;
      on = now;
      spark_top[s] = std::max(spark_top[s], over);
    }
    sparks[s] = bursts / 7.0;
    // Warmth: the third harmonic a 220 Hz tone gains, in dB under the tone.
    with(0.0f, 1.0f);
    const Stereo pressed = run(device, sine(220.0f, 3.0f, kRate, 0.25f));
    warm[s] = db(tone_level(pressed.left, 660.0, kRate, second) / tone_level(pressed.left, 220.0, kRate, second));
    if (g_print) {
      std::printf("%s: shimmer %.3f, sway %.3f, tumble %.3f, stir %.3f; %.1f dips a second, %.1f sparks a "
                  "second (loudest %.3f), third harmonic %.1f dB\n",
                  kSeasonName[s], shimmer[s], sway[s], tumble[s], stir[s], dips[s], sparks[s], spark_top[s],
                  warm[s]);
    }
  }
  EXPECT(shimmer[0] > 0.25 && shimmer[1] < 0.08 && shimmer[2] < 0.01 && shimmer[3] < 0.01,
         "spring shimmers at 5.3 Hz and the others do not");
  EXPECT(sway[1] > 0.2 && sway[0] < 0.06 && sway[2] < 0.06 && sway[3] < 0.06,
         "summer sways from side to side at 0.19 Hz");
  EXPECT(tumble[2] > 0.05 && tumble[0] < 0.01 && tumble[1] < 0.03 && tumble[3] < 0.01,
         "autumn tumbles at 0.83 Hz");
  EXPECT(stir[3] > 0.02 && stir[3] < 0.07 && stir[3] < stir[2] && stir[3] < 0.25 * stir[1],
         "winter barely stirs");
  EXPECT(dips[2] > 12.0 && dips[2] < 35.0 && dips[0] == 0.0 && dips[1] == 0.0 && dips[3] < 1.0,
         "autumn's top end crumbles and no other season's does");
  EXPECT(sparks[3] > 3.0 && sparks[0] > 2.0 && sparks[1] < 0.5 && sparks[2] < 0.5,
         "winter and spring glitter");
  EXPECT(spark_top[3] > 2.0 * spark_top[0], "winter's sparks are louder than spring's");
  EXPECT(warm[1] > -28.0 && warm[1] > warm[2] + 3.0 && warm[2] > -36.0 && warm[3] < -37.0 && warm[0] < -37.0,
         "summer is warmed most, autumn a little, winter and spring not");

  // The tail climbs in spring and sinks in autumn: a 300 Hz burst (low, where
  // a shift of a few Hz is far more than the room's slow wander), then where
  // the ring stands early and late.
  double climb[4];
  for (int s = 0; s < 4; ++s) {
    still(device, 0.25f * static_cast<float>(s));
    device.set_param(p::kSpace, 1.0f);
    device.set_param(p::kMotion, 1.0f);
    device.set_param(p::kGrit, 0.0f);
    device.set_param(p::kTail, 1.0f);
    std::vector<float> burst = sine(300.0f, 0.4f, kRate, 0.5f);
    burst.resize(static_cast<size_t>(kRate * 2.0f), 0.0f);
    const Stereo rung = run(device, burst);
    const size_t stop = static_cast<size_t>(0.42f * kRate);
    const double early = band_centre(rung.left, 260.0, 340.0, stop, stop + 9600);
    const double late = band_centre(rung.left, 260.0, 340.0, stop + 14400, stop + 33600);
    climb[s] = late - early;
    if (g_print) std::printf("%s: the tail of a 300 Hz burst moves %+.2f Hz (%.2f to %.2f)\n", kSeasonName[s], climb[s], early, late);
  }
  EXPECT(climb[0] > 3.0, "spring's tail climbs");
  EXPECT(climb[2] < -3.0, "autumn's tail sinks");
  EXPECT(std::fabs(climb[1]) < 2.0 && std::fabs(climb[3]) < 2.0,
         "summer's and winter's tails keep their pitch (but for the sway)");

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("seasons", 10.0f, kRate, [&] { run(device, input); });

  (void)phrase;
  (void)pad_in;
  return finish("seasons");
}
