// Native harness for Seasons (cpp/devices/seasons). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a year: each season's signature at
// its centre, a blend with no step in it anywhere round the dial, a clock
// that turns the year at the stated speed whatever the sound does, and a
// level that holds. Run it with any argument to print every figure.

#include <complex>
#include <functional>
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

// The largest second difference of a signal: a step of size c from one
// sample to the next shows as c, a smooth tone as far less than its largest
// step, so it sees a click that hides under a tone's own slope.
static double sharpest(const std::vector<float>& x) {
  double worst = 0.0;
  for (size_t i = 2; i < x.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  }
  return worst;
}

// The sharpest corner (largest second difference) in the second after
// `change`, on a tone of 220 Hz and 1.1 kHz that has been sounding for two
// seconds under `before`. With a `change` that does nothing it is the
// setting's own.
template <typename Before, typename Change>
static double step_after(Before before, Change change) {
  static std::vector<float> first, then;
  if (first.empty()) {
    const size_t split = static_cast<size_t>(2.0f * kRate), all = static_cast<size_t>(3.0f * kRate);
    std::vector<float> tone(all);
    for (size_t i = 0; i < all; ++i) {
      const double t = static_cast<double>(i) / kRate;
      tone[i] = static_cast<float>(0.25 * std::sin(2.0 * kPi * 220.0 * t) + 0.1 * std::sin(2.0 * kPi * 1100.0 * t));
    }
    first.assign(tone.begin(), tone.begin() + split);
    then.assign(tone.begin() + split, tone.end());
  }
  before();
  run(device, first);
  change();
  const Stereo out = run(device, then);
  return std::max(sharpest(out.left), sharpest(out.right));
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

  // --- the blend has no step in it ---------------------------------------------------------
  // Sixty-four places round the dial on the same noise: the level and the
  // centroid of neighbours, and of the last place against the first.
  {
    const int places = 64;
    std::vector<double> loud(places), colour(places);
    const Stereo material = wide_pink(3.0f, 0.1f);
    for (int k = 0; k < places; ++k) {
      still(device, static_cast<float>(k) / places);
      const Stereo out = run(device, material.left, material.right);
      loud[k] = db(level(out, second));
      colour[k] = centroid(out.left, second);
    }
    double level_step = 0.0, colour_step = 0.0;
    for (int k = 0; k < places; ++k) {
      const int next = (k + 1) % places;
      level_step = std::max(level_step, std::fabs(loud[next] - loud[k]));
      colour_step = std::max(colour_step, std::fabs(std::log2(colour[next] / colour[k])));
    }
    if (g_print) {
      std::printf("round the dial in 64 places: largest step %.2f dB in level, %.2f octaves in centroid\n",
                  level_step, colour_step);
    }
    EXPECT(level_step < 0.6, "no step in level between neighbours anywhere round the dial");
    EXPECT(colour_step < 0.45, "no step in colour between neighbours anywhere round the dial");
    // Across the join at 1 to 0, and where the colour moves fastest (autumn
    // into winter), in steps of a thousandth of the dial: a real step would
    // not shrink with the spacing.
    double fine_level = 0.0, fine_colour = 0.0;
    for (float around : {0.0f, 0.625f}) {
      double last_loud = 0.0, last_colour = 0.0;
      for (int k = -3; k <= 3; ++k) {
        float year = around + static_cast<float>(k) / 1024.0f;
        if (year < 0.0f) year += 1.0f;
        still(device, year);
        const Stereo out = run(device, material.left, material.right);
        const double here = db(level(out, second)), tint = centroid(out.left, second);
        if (k > -3) {
          fine_level = std::max(fine_level, std::fabs(here - last_loud));
          fine_colour = std::max(fine_colour, std::fabs(std::log2(tint / last_colour)));
        }
        last_loud = here;
        last_colour = tint;
      }
    }
    if (g_print) {
      std::printf("in steps of 1/1024 across the join and through autumn into winter: %.3f dB, %.3f octaves\n",
                  fine_level, fine_colour);
    }
    EXPECT(fine_level < 0.05 && fine_colour < 0.04, "the blend is continuous across the join at 1 to 0");
  }

  // --- loudness holds round the year ------------------------------------------------------
  // Sixteen places, on a played phrase and on a held pad (LU against the
  // input). Noise is printed too: a tilt cannot hold the loudness of every
  // spectrum, and noise is where the tilt weighs most.
  {
    Stereo phrase_in;
    phrase_in.left = phrase;
    phrase_in.right = phrase;
    const double phrase_lufs = loudness(phrase_in), pad_lufs = loudness(pad_in, second),
                 noise_lufs = loudness(noise_in, second);
    double keys_low = 99, keys_high = -99, pad_low = 99, pad_high = -99, noise_low = 99, noise_high = -99;
    for (int k = 0; k < 16; ++k) {
      const float year = static_cast<float>(k) / 16.0f;
      still(device, year);
      const double on_keys = loudness(run(device, phrase)) - phrase_lufs;
      still(device, year);
      const double on_pad = loudness(run(device, pad_in.left, pad_in.right), second) - pad_lufs;
      still(device, year);
      const double on_noise = loudness(run(device, noise_in.left, noise_in.right), second) - noise_lufs;
      keys_low = std::min(keys_low, on_keys);
      keys_high = std::max(keys_high, on_keys);
      pad_low = std::min(pad_low, on_pad);
      pad_high = std::max(pad_high, on_pad);
      noise_low = std::min(noise_low, on_noise);
      noise_high = std::max(noise_high, on_noise);
    }
    if (g_print) {
      std::printf("round the year at Depth 1: keys %+.2f to %+.2f LU, pad %+.2f to %+.2f LU, noise %+.2f to "
                  "%+.2f LU\n",
                  keys_low, keys_high, pad_low, pad_high, noise_low, noise_high);
    }
    EXPECT(keys_low > -1.5 && keys_high < 1.5, "a played phrase keeps its loudness round the year");
    EXPECT(pad_low > -1.5 && pad_high < 1.5, "a held pad keeps its loudness round the year");
    EXPECT(noise_low > -4.5 && noise_high < 3.5, "noise stays within the tilt's reach");
  }

  // --- the year turns by the clock --------------------------------------------------------
  {
    // Forward at ten seconds a year: after 2.5 s the year reads a quarter on.
    const auto year_after = [&](float turn, float turning, float from, float seconds) {
      device.init(kRate);
      device.set_param(p::kTurn, turn);
      device.set_param(p::kTurning, turning);
      device.set_param(p::kYear, from);
      run(device, std::vector<float>(static_cast<size_t>(seconds * kRate), 0.01f));
      return static_cast<double>(device.meter(0));
    };
    const double forward = year_after(1.0f, 10.0f, 0.1f, 2.5f);
    const double backward = year_after(2.0f, 10.0f, 0.1f, 2.5f);
    const double stood = year_after(0.0f, 10.0f, 0.1f, 2.5f);
    const double slow = year_after(1.0f, 1800.0f, 0.1f, 18.0f);
    if (g_print) {
      std::printf("the year after 2.5 s from 0.1: forward %.4f, backward %.4f, still %.4f; 18 s at half an "
                  "hour a year %.4f\n",
                  forward, backward, stood, slow);
    }
    EXPECT_NEAR(forward, 0.35, 1.0e-3, "Forward at 10 s a year: a quarter of a year in 2.5 s");
    EXPECT_NEAR(backward, 0.85, 1.0e-3, "Backward goes the other way, through the join");
    EXPECT_NEAR(stood, 0.1, 1.0e-6, "Still holds the year");
    EXPECT_NEAR(slow, 0.11, 1.0e-4, "Turning at its longest: a hundredth of a year in 18 s");

    // The sound follows: turning from spring at ten seconds a year, the
    // colour at each quarter is that season's own (against a year stood there).
    device.init(kRate);
    device.set_param(p::kTurning, 10.0f);
    device.set_param(p::kDepth, 1.0f);
    const Stereo long_noise = wide_pink(10.5f, 0.1f);
    const Stereo turned = run(device, long_noise.left, long_noise.right);
    for (int s = 1; s < 4; ++s) {
      const size_t at = static_cast<size_t>(2.5f * static_cast<float>(s) * kRate);
      const double heard = centroid(turned.left, at - 12000, at + 12000);
      still(device, 0.25f * static_cast<float>(s));
      const Stereo there = run(device, long_noise.left, long_noise.right);
      const double expected = centroid(there.left, at - 12000, at + 12000);
      if (g_print) std::printf("turning, at %s: centroid %.0f Hz, standing there %.0f Hz\n", kSeasonName[s], heard, expected);
      EXPECT(std::fabs(std::log2(heard / expected)) < 0.2, "a turning year passes through each season's colour");
    }

    // Through silence and sleep the year goes on as a clock would, and reads
    // the same whatever the block size.
    double read[3];
    const int blocks[3] = {1, 128, 2048};
    for (int b = 0; b < 3; ++b) {
      device.init(kRate);
      device.set_param(p::kTurning, 40.0f);
      rng_state() = 0x99u;
      run(device, noise(0.5f, kRate, 0.2f), blocks[b]);
      const Stereo quiet = run(device, silence(19.5f, kRate), blocks[b]);
      EXPECT(peak(quiet.left, quiet.size() - second) == 0.0 && device.asleep(), "asleep in the silence");
      read[b] = device.meter(0);
    }
    if (g_print) std::printf("after 20 s, 19.5 of them silent, at 40 s a year: %.5f %.5f %.5f\n", read[0], read[1], read[2]);
    EXPECT_NEAR(read[1], 0.5, 1.0e-3, "the year turns on through silence and sleep");
    EXPECT(read[0] == read[1] && read[1] == read[2], "and stands in the same place at every block size");

    // The Year knob places the year, and a turning year carries on from there.
    device.init(kRate);
    device.set_param(p::kTurning, 10.0f);
    run(device, std::vector<float>(static_cast<size_t>(3.0f * kRate), 0.01f));  // now at 0.3
    device.set_param(p::kYear, 0.75f);
    run(device, std::vector<float>(static_cast<size_t>(1.0f * kRate), 0.01f));
    EXPECT_NEAR(device.meter(0), 0.85, 2.0e-3, "the Year knob places a turning year, which carries on from there");
    // Still stops it where it has got to; it does not go back to the knob.
    device.set_param(p::kTurn, 0.0f);
    const float stopped = device.meter(0);
    run(device, std::vector<float>(static_cast<size_t>(2.0f * kRate), 0.01f));
    EXPECT_NEAR(device.meter(0), stopped, 1.0e-6, "Still holds the year where it has got to");
    // A new Turning time carries on from where the year is.
    device.set_param(p::kTurn, 1.0f);
    device.set_param(p::kTurning, 20.0f);
    run(device, std::vector<float>(static_cast<size_t>(2.0f * kRate), 0.01f));
    EXPECT_NEAR(device.meter(0), stopped + 0.1f, 2.0e-3, "a new Turning time carries on from where the year is");
  }

  // --- nothing clicks ---------------------------------------------------------------------
  // Each control jumped while a tone sounds, against the larger of what the
  // two settings do by themselves (a run with no event in it).
  {
    struct Jump {
      const char* name;
      int id;
      float from, to;
      float year;
    };
    const Jump jumps[] = {
        {"Year from spring to autumn", p::kYear, 0.0f, 0.5f, 0.0f},
        {"Year across the join", p::kYear, 0.95f, 0.05f, 0.95f},
        {"Year from summer to winter", p::kYear, 0.25f, 0.75f, 0.25f},
        {"Depth to nothing", p::kDepth, 1.0f, 0.0f, 0.25f},
        {"Space to nothing", p::kSpace, 1.0f, 0.0f, 0.75f},
        {"Space full up", p::kSpace, 0.0f, 1.0f, 0.25f},
        {"Motion to nothing", p::kMotion, 1.0f, 0.0f, 0.0f},
        {"Grit to nothing in autumn", p::kGrit, 1.0f, 0.0f, 0.5f},
        {"Grit full up in summer", p::kGrit, 0.0f, 1.0f, 0.25f},
        {"Tails to nothing", p::kTail, 1.0f, 0.0f, 0.75f},
        {"Width to mono", p::kWidth, 2.0f, 0.0f, 0.25f},
        {"Mix to dry", p::kMix, 1.0f, 0.0f, 0.5f},
        {"Mix to wet", p::kMix, 0.0f, 1.0f, 0.5f},
    };
    for (const Jump& jump : jumps) {
      const auto at = [&](float value) {
        return [&jump, value] {
          still(device, jump.year);
          device.set_param(p::kSpace, 1.0f);
          device.set_param(p::kMotion, 1.0f);
          device.set_param(p::kGrit, jump.id == p::kGrit ? 1.0f : 0.0f);
          device.set_param(jump.id, value);
        };
      };
      const double own = std::max(step_after(at(jump.from), [] {}), step_after(at(jump.to), [] {}));
      const double moved = step_after(at(jump.from), [&] { device.set_param(jump.id, jump.to); });
      if (g_print) std::printf("%s: sharpest corner %.5f, the settings' own %.5f\n", jump.name, moved, own);
      char label[120];
      std::snprintf(label, sizeof label, "%s does not click (corner %.5f against %.5f)", jump.name, moved, own);
      EXPECT(moved < 1.5 * own + 0.001, label);
    }
    // Turn switched through its three choices, and Turning from its slowest
    // to its fastest, while the year is turning under the tone.
    const auto turning = [](float turn, float seconds) {
      return [turn, seconds] {
        device.init(kRate);
        device.set_param(p::kYear, 0.4f);
        device.set_param(p::kDepth, 1.0f);
        device.set_param(p::kSpace, 1.0f);
        device.set_param(p::kGrit, 0.0f);
        device.set_param(p::kTurn, turn);
        device.set_param(p::kTurning, seconds);
      };
    };
    const double own = std::max(step_after(turning(1.0f, 10.0f), [] {}), step_after(turning(0.0f, 10.0f), [] {}));
    for (int from = 0; from < 3; ++from) {
      for (int to = 0; to < 3; ++to) {
        if (from == to) continue;
        const double moved = step_after(turning(static_cast<float>(from), 10.0f),
                                        [&] { device.set_param(p::kTurn, static_cast<float>(to)); });
        if (g_print) std::printf("Turn %d to %d: sharpest corner %.5f, the settings' own %.5f\n", from, to, moved, own);
        EXPECT(moved < 1.5 * own + 0.001, "a change of Turn does not click");
      }
    }
    const double sped = step_after(turning(1.0f, 1800.0f), [&] { device.set_param(p::kTurning, 10.0f); });
    EXPECT(sped < 1.5 * own + 0.001, "a change of Turning does not click");

    // The Year knob goes the shorter way round: from just before the join to
    // just after it the year never passes through autumn.
    still(device, 0.95f);
    run(device, std::vector<float>(4800, 0.01f));
    device.set_param(p::kYear, 0.05f);
    bool short_way = true;
    for (int k = 0; k < 40; ++k) {
      run(device, std::vector<float>(240, 0.01f));
      const float now = device.meter(0);
      if (now > 0.06f && now < 0.94f) short_way = false;
    }
    EXPECT(short_way, "Year crosses the join the shorter way");
    run(device, std::vector<float>(24000, 0.01f));
    EXPECT_NEAR(device.meter(0), 0.05, 1.0e-4, "and lands where the knob says");
  }

  // --- bad input is survivable -----------------------------------------------------------
  // A tenth of a second of each kind of bad sample in the middle of a tone, in
  // winter with the room full up (the longest memory there is). Afterwards
  // the output is finite, comes back to what a clean run gives, and the
  // device still falls silent.
  {
    const float bad[] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f, 1.0e-42f};
    const char* const names[] = {"not a number", "infinity", "minus infinity", "1e30", "minus 1e30", "denormals"};
    const std::vector<float> tone = sine(330.0f, 6.0f, kRate, 0.25f);
    const auto winter = [&] {
      still(device, 0.75f);
      device.set_param(p::kSpace, 1.0f);
      device.set_param(p::kGrit, 1.0f);
    };
    winter();
    const Stereo clean = run(device, tone);
    for (int k = 0; k < 6; ++k) {
      std::vector<float> spoiled = tone;
      for (size_t i = second; i < second + 4800; ++i) spoiled[i] = bad[k];
      winter();
      const Stereo out = run(device, spoiled);
      const Stereo rest = render(device, 40.0f, kRate);
      const bool is_finite = finite(out.left) && finite(out.right) && finite(rest.left) && finite(rest.right);
      // From two seconds after the bad stretch the sound is the clean run's
      // again, but for what the long tail still remembers of the burst.
      const double after = db(level(out, 4 * second, 6 * second) / level(clean, 4 * second, 6 * second));
      const double top = std::max(peak(out.left), peak(out.right));
      const double left_over = std::max(peak(rest.left, rest.size() - second), peak(rest.right, rest.size() - second));
      if (g_print) std::printf("%s: peak %.2f, level 3 s later %+.2f dB against a clean run, then silence %g\n", names[k], top, after, left_over);
      char label[120];
      std::snprintf(label, sizeof label, "survives %s and recovers", names[k]);
      EXPECT(is_finite && top <= 2.0 && std::fabs(after) < 1.5 && left_over == 0.0, label);
    }
  }

  // --- the same at every block size, asleep or awake ---------------------------------------
  // A phrase, a silence long enough to sleep, knobs moved in the silence, and
  // sound again from the middle of a block: blocks of 1, 32, 128, 512 and 2048
  // and a ragged pattern must agree, and the knobs must have snapped.
  {
    rng_state() = 0xA11CEu;
    std::vector<float> material = noise(0.6f, kRate, 0.3f);
    material.resize(static_cast<size_t>(6.2f * kRate) + 777, 0.0f);  // asleep about 4 s in
    const size_t woken = material.size();
    const std::vector<float> more = sine(523.25f, 1.0f, kRate, 0.3f);
    material.insert(material.end(), more.begin(), more.end());
    const size_t moved_at = static_cast<size_t>(5.5f * kRate);
    const auto play = [&](const int* sizes, int count) {
      device.init(kRate);
      device.set_param(p::kTurning, 10.0f);
      device.set_param(p::kDepth, 1.0f);
      device.set_param(p::kSpace, 0.8f);
      device.set_param(p::kMotion, 1.0f);
      device.set_param(p::kGrit, 1.0f);
      Stereo out;
      out.left.resize(material.size());
      out.right.resize(material.size());
      size_t done = 0;
      int which = 0;
      bool moved = false;
      while (done < material.size()) {
        if (!moved && done >= moved_at) {
          // In the silence: every glide there is gets something to do.
          device.set_param(p::kYear, 0.6f);
          device.set_param(p::kDepth, 0.5f);
          device.set_param(p::kSpace, 0.3f);
          device.set_param(p::kWidth, 1.7f);
          device.set_param(p::kMix, 0.6f);
          moved = true;
        }
        size_t frames = static_cast<size_t>(sizes[which++ % count]);
        frames = std::min(frames, material.size() - done);
        if (!moved) frames = std::min(frames, moved_at - done);  // the knobs move at the same sample
        for (size_t i = 0; i < frames; ++i) {
          device.in_left()[i] = material[done + i];
          device.in_right()[i] = material[done + i];
        }
        device.process(static_cast<int>(frames));
        for (size_t i = 0; i < frames; ++i) {
          out.left[done + i] = device.out_left()[i];
          out.right[done + i] = device.out_right()[i];
        }
        done += frames;
      }
      return out;
    };
    const int one[] = {1}, small[] = {32}, usual[] = {128}, big[] = {512}, biggest[] = {2048};
    const int ragged[] = {1, 7, 64, 128, 33, 512, 2048, 5};
    const Stereo reference = play(usual, 1);
    EXPECT(peak(reference.left, woken - 4800, woken) == 0.0, "silent (asleep) before the sound returns");
    EXPECT(rms(reference.left, woken, woken + second) > 0.01, "awake again when it does");
    const double differ = std::max({largest_difference(reference, play(one, 1)), largest_difference(reference, play(small, 1)),
                                    largest_difference(reference, play(big, 1)), largest_difference(reference, play(biggest, 1)),
                                    largest_difference(reference, play(ragged, 8))});
    if (g_print) std::printf("blocks of 1, 32, 512, 2048 and ragged against 128, across a sleep: differ by %g\n", differ);
    EXPECT(differ < 1.0e-6, "the output is the same at every block size, across a sleep and a wake inside a block");

    // Knobs moved while asleep have snapped: the first 20 ms after the wake
    // are what a device set that way from the start gives at that moment of
    // the clock (same year, same movement, same texture), with no glide.
    device.init(kRate);
    device.set_param(p::kTurning, 10.0f);
    device.set_param(p::kMotion, 1.0f);
    device.set_param(p::kGrit, 1.0f);
    device.set_param(p::kDepth, 0.5f);
    device.set_param(p::kSpace, 0.3f);
    device.set_param(p::kWidth, 1.7f);
    device.set_param(p::kMix, 0.6f);
    run(device, silence(static_cast<float>(moved_at) / kRate, kRate));
    device.set_param(p::kYear, 0.6f);  // placed at the same moment of the clock
    Stereo fresh = run(device, std::vector<float>(material.begin() + moved_at, material.end()));
    double snapped = 0.0;
    for (size_t i = woken; i < woken + 960; ++i) {
      snapped = std::max(snapped, std::fabs(static_cast<double>(reference.left[i]) - fresh.left[i - moved_at]));
    }
    if (g_print) std::printf("woken with knobs moved in the silence, against a device set so from the start: %g\n", snapped);
    EXPECT(snapped < 1.0e-5, "knobs moved in a sleep snap on waking, and the clock has kept its place");
  }

  // --- movement and texture run by the clock, not by the sound ----------------------------
  // One device sleeps through six seconds of silence; another is kept awake
  // through them by a whisper (noise at -100 dBFS). With no room to remember
  // anything, what they then do to the same tone is the same: the shimmer,
  // the sway, the dropouts and the sparks stand where the clock put them.
  {
    const std::vector<float> tone = sine(1500.0f, 2.0f, kRate, 0.25f);
    for (float year : {0.0f, 0.125f, 0.5f}) {
      Stereo heard[2];
      for (int awake = 0; awake < 2; ++awake) {
        still(device, year);
        device.set_param(p::kSpace, 0.0f);
        device.set_param(p::kMotion, 1.0f);
        device.set_param(p::kGrit, 1.0f);
        run(device, tone);
        rng_state() = 0x5EEDu;
        run(device, awake ? noise(6.0f, kRate, 1.0e-5f) : silence(6.0f, kRate));
        EXPECT(device.asleep() == !awake, "one sleeps in the gap, the other is kept awake");
        heard[awake] = run(device, tone);
      }
      // Past the first 0.35 s, which the sparks fill from what came before
      // (silence for one, the whisper for the other).
      double differ = 0.0;
      for (size_t i = 16800; i < heard[0].size(); ++i) {
        differ = std::max(differ, std::fabs(static_cast<double>(heard[0].left[i]) - heard[1].left[i]));
        differ = std::max(differ, std::fabs(static_cast<double>(heard[0].right[i]) - heard[1].right[i]));
      }
      if (g_print) std::printf("year %.2f: slept against kept awake, differ by %g\n", year, differ);
      EXPECT(differ < 2.0e-4, "movement and texture keep their place through a sleep, as a clock would");
    }
  }

  // --- other sample rates: the same effect -------------------------------------------------
  {
    for (float rate : {44100.0f, 96000.0f}) {
      const size_t rate_second = static_cast<size_t>(rate);
      // Winter's tail is as long.
      still(device, 0.75f, rate);
      rng_state() = 0x55u;
      std::vector<float> burst = noise(0.3f, rate, 0.5f);
      burst.resize(static_cast<size_t>(rate * 14.0f), 0.0f);
      const double ring = rt60(run(device, burst).left, rate, 0.45, 0.05, -80.0);
      // Spring shimmers at 5.3 Hz.
      still(device, 0.0f, rate);
      device.set_param(p::kSpace, 0.0f);
      device.set_param(p::kMotion, 1.0f);
      device.set_param(p::kGrit, 0.0f);
      const Stereo top = run(device, sine(6000.0f, 6.0f, rate, 0.25f));
      const std::vector<float> top_level = windows(top.left, rate_second, rate_second / 100);
      const double tremble = tone_level(top_level, 5.3, 100.0) / mean(top_level);
      // Autumn's dropouts come as often.
      still(device, 0.5f, rate);
      device.set_param(p::kSpace, 0.0f);
      device.set_param(p::kMotion, 0.0f);
      device.set_param(p::kGrit, 1.0f);
      const Stereo broken = run(device, sine(6000.0f, 8.0f, rate, 0.25f));
      const std::vector<float> fine = windows(broken.left, rate_second, rate_second / 500);
      std::vector<float> sorted = fine;
      std::sort(sorted.begin(), sorted.end());
      int count = 0;
      bool under = false;
      for (float v : fine) {
        const bool now = v < 0.7f * sorted[sorted.size() * 9 / 10];
        if (now && !under) ++count;
        under = now;
      }
      // The year takes as many seconds.
      device.init(rate);
      device.set_param(p::kTurning, 10.0f);
      run(device, std::vector<float>(static_cast<size_t>(2.5f * rate), 0.01f));
      const double year = device.meter(0);
      if (g_print) {
        std::printf("at %.0f Hz: winter rings %.2f s (%.2f at 48 kHz), spring shimmers %.3f (%.3f), autumn "
                    "%.1f dips a second (%.1f), the year after 2.5 s %.4f\n",
                    rate, ring, decay[3], tremble, shimmer[0], count / 7.0, dips[2], year);
      }
      EXPECT(std::fabs(ring / decay[3] - 1.0) < 0.12, "winter's tail is as long at another sample rate");
      EXPECT(std::fabs(tremble / shimmer[0] - 1.0) < 0.15, "spring shimmers as much and as fast at another sample rate");
      EXPECT(std::fabs(count / 7.0 / dips[2] - 1.0) < 0.2, "autumn crumbles as often at another sample rate");
      EXPECT_NEAR(year, 0.25, 1.0e-3, "the year takes as many seconds at another sample rate");
    }
  }

  // --- left and right stay left and right --------------------------------------------------
  // Nothing in the wet path sums the two sides: a signal that is all side
  // (left the inverse of right) comes through spring as loud as one that is
  // all middle. Winter narrows, which takes 7 dB off the side; Width at
  // nothing is mono, and only there does it vanish.
  {
    const std::vector<float> one = pink(4.0f, 0.1f);
    std::vector<float> inverse(one.size());
    for (size_t i = 0; i < one.size(); ++i) inverse[i] = -one[i];
    still(device, 0.0f);
    const double middle = level(run(device, one), second);
    still(device, 0.0f);
    const double side = level(run(device, one, inverse), second);
    still(device, 0.75f);
    const double narrow = level(run(device, one, inverse), second);
    still(device, 0.0f);
    device.set_param(p::kWidth, 0.0f);
    const Stereo summed = run(device, one, inverse);
    const double mono = level(summed, second);
    if (g_print) {
      std::printf("all side against all middle: spring %+.2f dB, winter %+.2f dB, Width 0 %+.1f dB\n",
                  db(side / middle), db(narrow / middle), db(mono / middle));
    }
    EXPECT(std::fabs(db(side / middle)) < 1.0, "a signal that is all side keeps its level in spring");
    EXPECT(db(narrow / middle) < -4.0 && db(narrow / middle) > -10.0, "winter narrows: the side loses about 7 dB");
    double apart = 0.0;
    for (size_t i = 0; i < summed.size(); ++i) {
      apart = std::max(apart, std::fabs(static_cast<double>(summed.left[i]) - summed.right[i]));
    }
    EXPECT(apart < 1.0e-6 && db(mono / middle) < -9.0,
           "Width at nothing is mono: the sides are the same samples, and little is left of an all-side signal");
  }

  // --- it comes to rest after every control move -------------------------------------------
  // Each control moved while a phrase sounds, then silence: exact silence
  // within six seconds (spring's room, the hold of two seconds, and room to
  // spare), so no glide is left running.
  {
    for (int id = 0; id < p::kNumParams; ++id) {
      still(device, 0.0f);
      rng_state() = 0x77u;
      run(device, noise(0.3f, kRate, 0.2f));
      device.set_param(id, id == p::kYear ? 0.1f : 0.37f * p::kParamMin[id] + 0.63f * p::kParamMax[id]);
      run(device, noise(0.05f, kRate, 0.2f));
      device.set_param(id, id == p::kYear ? 0.05f : p::kParamDefault[id]);
      const Stereo rest = render(device, 6.0f, kRate);
      char label[100];
      std::snprintf(label, sizeof label, "at rest after param %d was moved", id);
      EXPECT(device.asleep() && peak(rest.left, rest.size() - 4800) == 0.0 && peak(rest.right, rest.size() - 4800) == 0.0, label);
    }
  }

  // --- level: held sound never piles up ---------------------------------------------------
  // A full-scale chord held for a minute through every preset, and at each
  // end of every control with the room, the movement and the texture full
  // up: the output never passes its ceiling of 6 dB over full scale, and the
  // last ten seconds are no louder than the ten after the first five.
  const std::vector<Preset> presets = load_presets();
  EXPECT(presets.size() == 16, "the manifest has sixteen presets");
  EXPECT(!presets.empty() && presets[0].values.empty(), "the first preset is the effect as it starts");
  {
    const std::vector<float> held = chord(60.0f, 1.0f);
    const double in_rms = rms(held);
    double worst_peak = 0.0, worst_growth = -99.0, loudest = -99.0;
    // `set` loads the settings. Where the year turns, "the start" is a year
    // stood still where the turning one is five seconds before the end: a
    // turning year changes level with the season, which is not growth.
    const auto hold = [&](const char* what, const std::function<void()>& set) {
      set();
      const float turn = device.param(p::kTurn), turning = device.param(p::kTurning);
      const Stereo out = run(device, held);
      const size_t n = out.size();
      const double top = std::max(peak(out.left), peak(out.right));
      const double last = level(out, n - 10 * second);
      double start = level(out, 5 * second, 15 * second);
      if (turn > 0.5f) {
        float there = device.meter(0) - (turn < 1.5f ? 5.0f : -5.0f) / turning;
        there -= std::floor(there);
        set();
        device.set_param(p::kTurn, 0.0f);
        device.set_param(p::kYear, there);
        const Stereo stood = run(device, std::vector<float>(held.begin(), held.begin() + 15 * second));
        start = level(stood, 5 * second, 15 * second);
      }
      const double growth = db(last / start), over = db(last / in_rms);
      worst_peak = std::max(worst_peak, top);
      worst_growth = std::max(worst_growth, growth);
      loudest = std::max(loudest, over);
      if (g_print) {
        std::printf("held chord, %s: peak %.3f, last ten seconds %+.2f dB against the input, %+.2f dB against "
                    "the start\n",
                    what, top, over, growth);
      }
      char label[160];
      std::snprintf(label, sizeof label, "a held full-scale chord stays under the ceiling and does not grow: %s", what);
      EXPECT(finite(out.left) && finite(out.right) && top <= 2.0 && growth < 1.0, label);
    };
    for (const Preset& preset : presets) {
      hold(preset.name.c_str(), [&] { load(device, preset); });
    }
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int end = 0; end < 2; ++end) {
        char what[60];
        std::snprintf(what, sizeof what, "param %d at its %s, the rest up, turning", id, end == 0 ? "least" : "most");
        hold(what, [&] {
          still(device, 0.3f);
          device.set_param(p::kSpace, 1.0f);
          device.set_param(p::kMotion, 1.0f);
          device.set_param(p::kGrit, 1.0f);
          device.set_param(p::kTail, 1.0f);
          device.set_param(p::kTurn, 1.0f);
          device.set_param(p::kTurning, 30.0f);
          device.set_param(id, end == 0 ? p::kParamMin[id] : p::kParamMax[id]);
        });
      }
    }
    if (g_print) std::printf("held chord over all: peak %.3f (input %.3f), loudest %+.2f dB, most growth %+.2f dB\n", worst_peak, peak(held), loudest, worst_growth);
  }

  // Every preset on the played phrase sits within 3 LU of the phrase itself.
  {
    Stereo phrase_in;
    phrase_in.left = phrase;
    phrase_in.right = phrase;
    const double dry = loudness(phrase_in);
    for (const Preset& preset : presets) {
      load(device, preset);
      const double wet = loudness(run(device, phrase)) - dry;
      if (g_print) std::printf("%-16s %+.2f LU on the phrase\n", preset.name.c_str(), wet);
      char label[120];
      std::snprintf(label, sizeof label, "preset \"%s\" is within 3 LU of the dry phrase (%+.2f)", preset.name.c_str(), wet);
      EXPECT(std::fabs(wet) < 3.0, label);
    }
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("seasons", 10.0f, kRate, [&] { run(device, input); });

  (void)phrase;
  (void)pad_in;
  return finish("seasons");
}
