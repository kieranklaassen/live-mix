// Native harness for Atmosphere (cpp/devices/atmosphere). The conformance
// pass covers silence before and after notes, voice stealing, parameter
// abuse, other sample rates and that two renders after init() match (every
// random source is seeded there); the rest measures each texture: what moves,
// how fast, how impulsive it is and where its pitch sits.

#include "../devices/atmosphere/atmosphere.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::Atmosphere;
namespace p = livemix::atmosphere;

static Atmosphere device;

static const float kRate = 48000.0f;

static const char* const kNames[Atmosphere::kKinds] = {"Wind", "Rain", "Sea", "Fire", "Vinyl", "Hum"};

// A plain patch of one type: near, unpitched, fast envelopes, unity volume.
static void plain(Atmosphere& d, int type) {
  d.init(kRate);
  d.set_param(p::kType, static_cast<float>(type));
  d.set_param(p::kDensity, 0.5f);
  d.set_param(p::kMovement, 0.0f);
  d.set_param(p::kTone, 0.5f);
  d.set_param(p::kResonance, 0.0f);
  d.set_param(p::kSize, 0.0f);
  d.set_param(p::kAttack, 0.01f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kWidth, 1.0f);
  d.set_param(p::kVolume, 0.0f);
}

static Stereo hold(Atmosphere& d, float hz, float seconds, float velocity = 1.0f) {
  d.note_on(1, hz, velocity);
  return render(d, seconds, kRate);
}

// The louder side at each sample: an event shows whichever side it lands on.
static std::vector<float> louder_side(const Stereo& s) {
  std::vector<float> m(s.size());
  for (size_t i = 0; i < m.size(); ++i) m[i] = std::max(std::fabs(s.left[i]), std::fabs(s.right[i]));
  return m;
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> m(s.size());
  for (size_t i = 0; i < m.size(); ++i) m[i] = 0.5f * (s.left[i] + s.right[i]);
  return m;
}

// RMS per window of `seconds`, starting at `from_seconds`.
static std::vector<float> levels(const std::vector<float>& x, double seconds,
                                 double from_seconds = 0.5) {
  std::vector<float> out;
  const size_t window = static_cast<size_t>(seconds * kRate);
  for (size_t at = static_cast<size_t>(from_seconds * kRate); at + window <= x.size(); at += window) {
    out.push_back(static_cast<float>(rms(x, at, at + window)));
  }
  return out;
}

static std::vector<float> centred(std::vector<float> x) {
  const double m = mean(x);
  for (float& v : x) v -= static_cast<float>(m);
  return x;
}

static double lowest(const std::vector<float>& x) { return *std::min_element(x.begin(), x.end()); }
static double highest(const std::vector<float>& x) { return *std::max_element(x.begin(), x.end()); }

static double deviation(const std::vector<float>& x) {
  const double m = mean(x);
  double sum = 0.0;
  for (float v : x) sum += (v - m) * (v - m);
  return std::sqrt(sum / static_cast<double>(x.size())) / m;
}

// How often a track crosses its own mean, per second of track.
static double crossings_per_second(const std::vector<float>& x, double window_seconds) {
  const double m = mean(x);
  int count = 0;
  for (size_t i = 1; i < x.size(); ++i) count += (x[i] > m) != (x[i - 1] > m) ? 1 : 0;
  return count / (static_cast<double>(x.size()) * window_seconds);
}

// Averaged power spectrum (Hann, 8192 points, half overlap) from `from`.
static livemix::kit::Fft<8192> fft;
static const int kBins = 4096;
static const double kBinHz = 48000.0 / 8192.0;
static std::vector<double> spectrum(const std::vector<float>& x, size_t from = 24000,
                                    size_t to = SIZE_MAX) {
  std::vector<double> power(kBins, 0.0);
  static std::vector<float> re(8192), im(8192);
  to = std::min(to, x.size());
  int frames = 0;
  for (size_t at = from; at + 8192 <= to; at += 4096) {
    for (int i = 0; i < 8192; ++i) {
      re[i] = x[at + i] * static_cast<float>(0.5 - 0.5 * std::cos(2.0 * kPi * i / 8192));
      im[i] = 0.0f;
    }
    fft.forward(re.data(), im.data());
    for (int k = 0; k < kBins; ++k)
      power[k] += static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
    ++frames;
  }
  for (double& v : power) v /= std::max(frames, 1);
  return power;
}

static double band_power(const std::vector<double>& power, double lo, double hi) {
  double sum = 0.0;
  for (int k = std::max(1, static_cast<int>(lo / kBinHz)); k < kBins && k * kBinHz < hi; ++k)
    sum += power[k];
  return sum;
}

// Power per hertz in [lo, hi].
static double density(const std::vector<double>& power, double lo, double hi) {
  return band_power(power, lo, hi) / (hi - lo);
}

static double centroid(const std::vector<double>& power) {
  double weighted = 0.0, total = 0.0;
  for (int k = 1; k < kBins; ++k) {
    weighted += power[k] * k * kBinHz;
    total += power[k];
  }
  return total > 0.0 ? weighted / total : 0.0;
}

static double centroid(const std::vector<float>& x, size_t from = 24000, size_t to = SIZE_MAX) {
  return centroid(spectrum(x, from, to));
}

static double crest(const std::vector<float>& x, size_t from = 24000) {
  return peak(x, from) / rms(x, from);
}

// First-order high-pass, to look at events apart from rumble and hum.
static std::vector<float> above(const std::vector<float>& x, double hz) {
  std::vector<float> out(x.size());
  const double a = std::exp(-2.0 * kPi * hz / kRate);
  double low = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    low = x[i] + (low - x[i]) * a;
    out[i] = static_cast<float>(x[i] - low);
  }
  return out;
}

// Events: excursions past `threshold`, counted once each (2 ms hold).
static int count_events(const std::vector<float>& x, double threshold, size_t from = 24000) {
  int count = 0;
  size_t quiet_until = 0;
  for (size_t i = from; i < x.size(); ++i) {
    if (std::fabs(x[i]) > threshold) {
      if (i >= quiet_until) ++count;
      quiet_until = i + 96;
    }
  }
  return count;
}

int main() {
  fft.init();

  Conformance spec;
  spec.name = "atmosphere";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // Every type is reproducible: the same render twice after init().
  for (int type = 0; type < Atmosphere::kKinds; ++type) {
    plain(device, type);
    device.set_param(p::kMovement, 0.8f);
    Stereo first = hold(device, 220.0f, 3.0f);
    plain(device, type);
    device.set_param(p::kMovement, 0.8f);
    Stereo second = hold(device, 220.0f, 3.0f);
    char label[96];
    std::snprintf(label, sizeof label, "%s: two renders after init() are identical", kNames[type]);
    EXPECT(first.left == second.left && first.right == second.right && rms(first.left) > 1.0e-4, label);
  }

  // ---- Wind ---------------------------------------------------------------------------
  {
    // The level gusts by the depth Movement sets.
    double depth[3] = {0.0, 0.0, 0.0};
    const float amounts[3] = {0.0f, 0.4f, 0.8f};
    for (int i = 0; i < 3; ++i) {
      plain(device, Atmosphere::kWind);
      device.set_param(p::kMovement, amounts[i]);
      Stereo out = hold(device, 220.0f, 150.0f);
      std::vector<float> level = levels(mid(out), 0.5);
      depth[i] = 1.0 - lowest(level) / highest(level);
    }
    std::printf("atmosphere: Wind level depth %.2f / %.2f / %.2f at Movement 0 / 0.4 / 0.8\n", depth[0],
                depth[1], depth[2]);
    EXPECT(depth[0] < 0.25, "Wind: with Movement 0 the level is as steady as noise is");
    EXPECT_NEAR(depth[1], 0.45, 0.12,
                "Wind: Movement 0.4 gusts the level by about 0.4 of the way to silence");
    EXPECT_NEAR(depth[2], 0.82, 0.1, "Wind: Movement 0.8 by about 0.8");

    // The band moves with the gust, and slowly.
    plain(device, Atmosphere::kWind);
    device.set_param(p::kMovement, 1.0f);
    Stereo moving = hold(device, 220.0f, 120.0f);
    plain(device, Atmosphere::kWind);
    Stereo fixed = hold(device, 220.0f, 60.0f);
    double lo = 1.0e9, hi = 0.0, fixed_lo = 1.0e9, fixed_hi = 0.0;
    for (size_t at = 48000; at + 96000 <= moving.left.size(); at += 96000) {
      const double c = centroid(moving.left, at, at + 96000);
      lo = std::min(lo, c);
      hi = std::max(hi, c);
    }
    for (size_t at = 48000; at + 96000 <= fixed.left.size(); at += 96000) {
      const double c = centroid(fixed.left, at, at + 96000);
      fixed_lo = std::min(fixed_lo, c);
      fixed_hi = std::max(fixed_hi, c);
    }
    std::printf(
        "atmosphere: Wind centroid wanders %.0f..%.0f Hz with Movement 1, %.0f..%.0f Hz with 0\n", lo,
        hi, fixed_lo, fixed_hi);
    EXPECT(hi > 1.7 * lo, "Wind: the spectral peak moves with the gusts");
    EXPECT(fixed_hi < 1.2 * fixed_lo, "Wind: and stands still without Movement");

    // Density is the gust rate.
    double pace[2];
    const float rates[2] = {0.15f, 0.9f};
    for (int i = 0; i < 2; ++i) {
      plain(device, Atmosphere::kWind);
      device.set_param(p::kMovement, 1.0f);
      device.set_param(p::kDensity, rates[i]);
      Stereo out = hold(device, 220.0f, 120.0f);
      pace[i] = crossings_per_second(levels(mid(out), 0.25), 0.25);
    }
    std::printf(
        "atmosphere: Wind level crosses its mean %.2f times a second at Density 0.15, %.2f at 0.9\n",
        pace[0], pace[1]);
    EXPECT(pace[1] > 3.0 * pace[0] && pace[0] < 0.5, "Wind: Density sets how often it gusts");

    // Resonance: a whistle on the key.
    for (float hz : {440.0f, 1318.5f}) {
      plain(device, Atmosphere::kWind);
      device.set_param(p::kResonance, 1.0f);
      device.set_param(p::kMovement, 0.5f);
      Stereo whistle = hold(device, hz, 30.0f);
      std::vector<double> power = spectrum(whistle.left);
      const double on = density(power, hz * 0.97, hz * 1.03);
      const double below = density(power, hz * 0.45, hz * 0.55);
      const double above_it = density(power, hz * 1.8, hz * 2.2);
      char label[120];
      std::snprintf(label, sizeof label,
                    "Wind: with Resonance up it whistles at %.0f Hz (%.0f dB over the octaves around)",
                    hz, 10.0 * std::log10(on / std::max(below, above_it)));
      EXPECT(on > 100.0 * below && on > 100.0 * above_it, label);
      plain(device, Atmosphere::kWind);
      Stereo broad = hold(device, hz, 30.0f);
      std::vector<double> flat = spectrum(broad.left);
      EXPECT(density(flat, hz * 0.97, hz * 1.03) < 10.0 * density(flat, hz * 0.45, hz * 0.55) &&
                 density(flat, hz * 0.97, hz * 1.03) < 30.0 * density(flat, hz * 1.8, hz * 2.2),
             "Wind: and without Resonance there is no peak there");
      EXPECT_NEAR(rms(whistle.left, 48000) / rms(broad.left, 48000), 1.0, 0.5,
                  "Wind: the whistle is about as loud");
    }
  }

  // ---- Rain ---------------------------------------------------------------------------
  {
    plain(device, Atmosphere::kWind);
    Stereo steady = hold(device, 220.0f, 20.0f);
    const double noise_crest = crest(steady.left);
    plain(device, Atmosphere::kRain);
    device.set_param(p::kDensity, 0.2f);
    Stereo sparse = hold(device, 220.0f, 20.0f);
    std::printf("atmosphere: crest factor %.1f for light Rain, %.1f for steady Wind\n",
                crest(sparse.left), noise_crest);
    EXPECT(crest(sparse.left) > 3.0 * noise_crest && crest(sparse.left) > 12.0,
           "Rain: droplets are impulsive (crest factor far above steady noise)");

    // Drops per second follow Density: 3 * 200^density.
    const float settings[3] = {0.1f, 0.35f, 0.55f};
    for (float setting : settings) {
      plain(device, Atmosphere::kRain);
      device.set_param(p::kDensity, setting);
      Stereo out = hold(device, 220.0f, 30.5f);
      std::vector<float> both = louder_side(out);
      const double expected = 3.0 * std::pow(200.0, setting);
      const double counted = count_events(both, 0.3 * peak(both)) / 30.0;
      char label[120];
      std::snprintf(label, sizeof label, "Rain: Density %.2f gives %.1f drops a second (expected %.1f)",
                    setting, counted, expected);
      EXPECT(counted > 0.75 * expected && counted < 1.2 * expected, label);
    }

    // A downpour is dense enough to stop being countable: it turns to noise.
    plain(device, Atmosphere::kRain);
    device.set_param(p::kDensity, 1.0f);
    Stereo heavy = hold(device, 220.0f, 10.0f);
    EXPECT(crest(heavy.left) < 0.5 * crest(sparse.left) &&
               rms(heavy.left, 24000) > 3.0 * rms(sparse.left, 24000),
           "Rain: at full Density the drops merge into a loud wash");

    // Movement swells the intensity.
    plain(device, Atmosphere::kRain);
    device.set_param(p::kDensity, 0.7f);
    Stereo even = hold(device, 220.0f, 90.0f);
    plain(device, Atmosphere::kRain);
    device.set_param(p::kDensity, 0.7f);
    device.set_param(p::kMovement, 1.0f);
    Stereo swelling = hold(device, 220.0f, 90.0f);
    EXPECT(deviation(levels(mid(swelling), 2.0)) > 2.0 * deviation(levels(mid(even), 2.0)),
           "Rain: Movement makes the shower swell and ease");
  }

  // ---- Sea ----------------------------------------------------------------------------
  {
    const float settings[3] = {0.0f, 0.4f, 1.0f};
    for (float setting : settings) {
      plain(device, Atmosphere::kSea);
      device.set_param(p::kDensity, setting);
      device.set_param(p::kMovement, 0.9f);
      Stereo out = hold(device, 220.0f, 240.0f);
      const double expected = 0.08 * std::pow(2.5, setting);
      const double hz = dominant_frequency(centred(levels(mid(out), 0.5)), 2.0, 0.03, 0.6);
      char label[120];
      std::snprintf(label, sizeof label, "Sea: Density %.1f swells every %.1f s (expected %.1f s)",
                    setting, 1.0 / hz, 1.0 / expected);
      EXPECT(hz > 0.9 * expected && hz < 1.1 * expected && hz > 0.075 && hz < 0.21, label);
    }

    plain(device, Atmosphere::kSea);
    device.set_param(p::kMovement, 1.0f);
    Stereo waves = hold(device, 220.0f, 120.0f);
    std::vector<float> level = levels(waves.left, 0.5);
    std::vector<float> bright;
    for (size_t at = 24000; at + 24000 <= waves.left.size(); at += 24000) {
      bright.push_back(static_cast<float>(centroid(waves.left, at, at + 24000)));
    }
    bright.resize(level.size());
    std::printf("atmosphere: Sea swells between %.4f and %.4f rms, centroid %.0f..%.0f Hz\n",
                lowest(level), highest(level), lowest(bright), highest(bright));
    EXPECT(lowest(level) < 0.25 * highest(level), "Sea: with Movement up the swell is deep");
    EXPECT(highest(bright) > 2.5 * lowest(bright), "Sea: the wave is brighter where it breaks");
    EXPECT(correlation(centred(level), centred(bright)) > 0.6,
           "Sea: and the bright part is the loud part");

    plain(device, Atmosphere::kSea);
    Stereo calm = hold(device, 220.0f, 60.0f);
    std::vector<float> calm_level = levels(calm.left, 1.0);
    EXPECT(lowest(calm_level) > 0.6 * highest(calm_level), "Sea: with Movement 0 it is a steady wash");
  }

  // ---- Fire ---------------------------------------------------------------------------
  {
    plain(device, Atmosphere::kFire);
    Stereo fire = hold(device, 220.0f, 60.5f);
    std::vector<double> power = spectrum(fire.left);
    const double low_share = band_power(power, 10.0, 300.0) / band_power(power, 10.0, 24000.0);
    std::printf("atmosphere: Fire has %.0f %% of its power under 300 Hz\n", 100.0 * low_share);
    EXPECT(low_share > 0.5, "Fire: a low rumble carries most of the power");

    std::vector<float> top = above(mid(fire), 1500.0);
    std::printf("atmosphere: Fire above 1.5 kHz has a crest factor of %.1f\n", crest(top));
    EXPECT(crest(top) > 12.0, "Fire: with crackles standing far out of it");
    const double expected = 0.6 * std::pow(80.0, 0.5);
    const double counted = count_events(top, 0.2 * peak(top)) / 60.0;
    char label[120];
    std::snprintf(label, sizeof label, "Fire: %.1f crackles a second at Density 0.5 (expected %.1f)",
                  counted, expected);
    EXPECT(counted > 0.7 * expected && counted < 1.2 * expected, label);

    plain(device, Atmosphere::kFire);
    device.set_param(p::kDensity, 0.9f);
    Stereo busy = hold(device, 220.0f, 30.5f);
    std::vector<float> busy_top = above(mid(busy), 1500.0);
    EXPECT(count_events(busy_top, 0.2 * peak(busy_top)) / 30.0 > 3.0 * counted,
           "Fire: Density raises the crackle rate");

    // Movement makes the flame flicker: the rumble's level is less even.
    plain(device, Atmosphere::kFire);
    device.set_param(p::kDensity, 0.0f);
    Stereo still_fire = hold(device, 220.0f, 60.0f);
    plain(device, Atmosphere::kFire);
    device.set_param(p::kDensity, 0.0f);
    device.set_param(p::kMovement, 1.0f);
    Stereo flickering = hold(device, 220.0f, 60.0f);
    const double even = deviation(levels(still_fire.left, 0.1));
    const double uneven = deviation(levels(flickering.left, 0.1));
    std::printf("atmosphere: Fire rumble level varies by %.0f %% still, %.0f %% flickering\n",
                100.0 * even, 100.0 * uneven);
    EXPECT(uneven > 1.3 * even, "Fire: Movement makes the rumble flicker");
  }

  // ---- Vinyl --------------------------------------------------------------------------
  {
    const float settings[2] = {0.5f, 0.8f};
    for (float setting : settings) {
      plain(device, Atmosphere::kVinyl);
      device.set_param(p::kDensity, setting);
      Stereo out = hold(device, 220.0f, 90.5f);
      std::vector<float> top = above(mid(out), 800.0);
      const double expected = 0.3 * std::pow(100.0, setting);
      const double counted = count_events(top, 0.2 * peak(top)) / 90.0;
      char label[120];
      std::snprintf(label, sizeof label,
                    "Vinyl: Density %.1f gives %.2f clicks a second (expected %.2f)", setting, counted,
                    expected);
      EXPECT(counted > 0.75 * expected && counted < 1.25 * expected, label);
    }

    // Sparse: between clicks there is only hiss, and the hiss is steady.
    plain(device, Atmosphere::kVinyl);
    device.set_param(p::kDensity, 0.3f);
    Stereo record = hold(device, 220.0f, 60.5f);
    std::vector<float> top = above(record.left, 800.0);
    std::vector<float> level = levels(top, 0.05);
    std::vector<float> peaks;
    for (size_t at = 24000; at + 2400 <= top.size(); at += 2400)
      peaks.push_back(static_cast<float>(peak(top, at, at + 2400)));
    std::sort(level.begin(), level.end());
    std::sort(peaks.begin(), peaks.end());
    const double quiet = level[level.size() / 10], typical = level[level.size() / 2];
    std::printf(
        "atmosphere: Vinyl hiss %.5f rms (10th percentile %.5f); 50 ms peaks: median %.4f, highest "
        "%.4f\n",
        typical, quiet, peaks[peaks.size() / 2], peaks.back());
    EXPECT(quiet > 0.85 * typical, "Vinyl: the hiss is steady");
    EXPECT(peaks.back() > 8.0 * peaks[peaks.size() / 2], "Vinyl: clicks stand out of it");
    EXPECT(crest(top) > 15.0, "Vinyl: and they are sparse (high crest factor)");

    // The rumble turns with the record: 33 1/3 rpm is 0.556 Hz.
    plain(device, Atmosphere::kVinyl);
    device.set_param(p::kDensity, 0.0f);
    device.set_param(p::kMovement, 1.0f);
    Stereo turning = hold(device, 220.0f, 180.0f);
    std::vector<double> power = spectrum(turning.left);
    EXPECT(band_power(power, 5.0, 90.0) > 3.0 * band_power(power, 90.0, 400.0),
           "Vinyl: there is a low rumble");
    std::vector<float> low(turning.left.size());
    {
      const double a = std::exp(-2.0 * kPi * 100.0 / kRate);
      double state = 0.0;
      for (size_t i = 0; i < low.size(); ++i) {
        state = turning.left[i] + (state - turning.left[i]) * a;
        low[i] = static_cast<float>(state);
      }
    }
    const double turn = dominant_frequency(centred(levels(low, 0.1)), 10.0, 0.2, 2.0);
    char label[96];
    std::snprintf(label, sizeof label, "Vinyl: the rumble swells once per revolution (%.3f Hz)", turn);
    EXPECT(std::fabs(turn - 0.5556) < 0.03, label);
  }

  // ---- Hum ----------------------------------------------------------------------------
  {
    for (float hz : {60.0f, 110.0f}) {
      plain(device, Atmosphere::kHum);
      Stereo hum = hold(device, hz, 4.0f);
      const double one = tone_level(hum.left, hz, kRate, 48000);
      char label[120];
      std::snprintf(label, sizeof label, "Hum: a %.0f Hz key hums at %.0f Hz", hz, hz);
      EXPECT_NEAR(dominant_frequency(hum.left, kRate, 30.0, 2000.0, 48000), hz, 0.2, label);
      EXPECT(tone_level(hum.left, 3.0 * hz, kRate, 48000) > 0.05 * one &&
                 tone_level(hum.left, 5.0 * hz, kRate, 48000) > 0.01 * one &&
                 tone_level(hum.left, 7.0 * hz, kRate, 48000) > 0.004 * one,
             "Hum: with its 3rd, 5th and 7th harmonics");
      EXPECT(tone_level(hum.left, 2.0 * hz, kRate, 48000) < 0.003 * one &&
                 tone_level(hum.left, 4.0 * hz, kRate, 48000) < 0.003 * one,
             "Hum: and no even ones");
    }
    // Density is how far up the harmonics reach.
    plain(device, Atmosphere::kHum);
    device.set_param(p::kDensity, 0.0f);
    device.set_param(p::kTone, 1.0f);
    Stereo pure = hold(device, 110.0f, 3.0f);
    plain(device, Atmosphere::kHum);
    device.set_param(p::kDensity, 1.0f);
    device.set_param(p::kTone, 1.0f);
    Stereo buzzy = hold(device, 110.0f, 3.0f);
    auto third = [&](const Stereo& s) {
      return tone_level(s.left, 330.0, kRate, 48000) / tone_level(s.left, 110.0, kRate, 48000);
    };
    EXPECT_NEAR(third(pure), std::pow(3.0, -2.6), 0.01,
                "Hum: Density 0 is nearly a sine (3rd harmonic 3^-2.6)");
    EXPECT_NEAR(third(buzzy), std::pow(3.0, -0.6), 0.03,
                "Hum: Density 1 is a buzz (3rd harmonic 3^-0.6)");

    // Slightly unsteady with Movement, rock steady without.
    plain(device, Atmosphere::kHum);
    Stereo firm = hold(device, 110.0f, 40.0f);
    plain(device, Atmosphere::kHum);
    device.set_param(p::kMovement, 1.0f);
    Stereo sagging = hold(device, 110.0f, 40.0f);
    std::vector<float> firm_level = levels(firm.left, 0.5);
    std::vector<float> sag_level = levels(sagging.left, 0.5);
    EXPECT(highest(firm_level) < 1.002 * lowest(firm_level), "Hum: steady with Movement 0");
    EXPECT(highest(sag_level) > 1.15 * lowest(sag_level) && highest(sag_level) < 2.0 * lowest(sag_level),
           "Hum: slightly unsteady with Movement up");
    double low_hz = 1.0e9, high_hz = 0.0;
    for (size_t at = 48000; at + 96000 <= sagging.left.size(); at += 96000) {
      const double hz = dominant_frequency(sagging.left, kRate, 107.0, 113.0, at, at + 96000);
      low_hz = std::min(low_hz, hz);
      high_hz = std::max(high_hz, hz);
    }
    EXPECT(high_hz > low_hz * 1.0005 && high_hz < 110.0 * 1.006 && low_hz > 110.0 / 1.006,
           "Hum: its pitch drifts by a few cents, no more than ten");
    EXPECT(!(sagging.left == sagging.right) && correlation(sagging.left, sagging.right, 48000) < 0.999,
           "Hum: left and right are not the same signal");
  }

  // ---- Shared controls ----------------------------------------------------------------
  // Tone moves the brightness of every type.
  for (int type = 0; type < Atmosphere::kKinds; ++type) {
    plain(device, type);
    device.set_param(p::kTone, 0.1f);
    device.set_param(p::kDensity, 0.7f);
    Stereo dark = hold(device, 220.0f, 20.0f);
    plain(device, type);
    device.set_param(p::kTone, 0.9f);
    device.set_param(p::kDensity, 0.7f);
    Stereo bright = hold(device, 220.0f, 20.0f);
    // Fire and Vinyl: look above the rumble, which Tone leaves alone.
    const bool rumbling = type == Atmosphere::kFire || type == Atmosphere::kVinyl;
    const double lo = rumbling ? centroid(above(dark.left, 500.0)) : centroid(dark.left);
    const double hi = rumbling ? centroid(above(bright.left, 500.0)) : centroid(bright.left);
    char label[120];
    std::snprintf(label, sizeof label, "%s: Tone moves the spectral centroid (%.0f Hz to %.0f Hz)",
                  kNames[type], lo, hi);
    // A hum's power is mostly its fundamental, which Tone leaves where it is.
    EXPECT(hi > (type == Atmosphere::kHum ? 1.2 : 1.5) * lo, label);
  }

  // Left and right are separate noise, not one noise panned; Width folds them.
  for (int type = 0; type < Atmosphere::kKinds; ++type) {
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(type));
    device.set_param(p::kAttack, 0.01f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo wide = render(device, 30.0f, kRate);
    const double side = correlation(wide.left, wide.right, 24000);
    char label[120];
    std::snprintf(label, sizeof label, "%s: left/right correlation at the default patch is %.2f",
                  kNames[type], side);
    if (type == Atmosphere::kHum) {
      EXPECT(side < 0.98, label);
    } else {
      EXPECT(std::fabs(side) < 0.25, label);
    }
    std::snprintf(label, sizeof label, "%s: the sides are balanced (left/right %.2f)", kNames[type],
                  rms(wide.left, 24000) / rms(wide.right, 24000));
    EXPECT_NEAR(rms(wide.left, 24000) / rms(wide.right, 24000), 1.0, 0.2, label);

    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(type));
    device.set_param(p::kAttack, 0.01f);
    device.set_param(p::kWidth, 0.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo mono = render(device, 10.0f, kRate);
    std::snprintf(label, sizeof label, "%s: Width 0 is mono", kNames[type]);
    EXPECT(mono.left == mono.right, label);
    if (type != Atmosphere::kHum) {
      std::snprintf(label, sizeof label, "%s: and as loud as wide (%.2f of it)", kNames[type],
                    rms(mono.left, 24000) / rms(wide.left, 24000));
      EXPECT_NEAR(rms(mono.left, 24000) / rms(wide.left, 24000), 1.0, 0.25, label);
    }
  }

  // Size: further away is darker, less impulsive and more diffuse.
  {
    plain(device, Atmosphere::kRain);
    device.set_param(p::kDensity, 0.3f);
    Stereo near = hold(device, 220.0f, 30.0f);
    plain(device, Atmosphere::kRain);
    device.set_param(p::kDensity, 0.3f);
    device.set_param(p::kSize, 1.0f);
    Stereo far = hold(device, 220.0f, 30.0f);
    std::printf(
        "atmosphere: Rain near/far: centroid %.0f / %.0f Hz, crest %.1f / %.1f, correlation %.2f / "
        "%.2f\n",
        centroid(near.left), centroid(far.left), crest(near.left), crest(far.left),
        correlation(near.left, near.right, 24000), correlation(far.left, far.right, 24000));
    EXPECT(centroid(far.left) < 0.4 * centroid(near.left), "Size closes a low-pass");
    EXPECT(crest(far.left) < 0.6 * crest(near.left), "Size smears the droplets");
    EXPECT(std::fabs(correlation(far.left, far.right, 24000)) <
               0.6 * std::fabs(correlation(near.left, near.right, 24000)),
           "Size decorrelates what the two sides share");
  }

  // Resonance rings the key's pitch into the unpitched types.
  for (int type : {Atmosphere::kRain, Atmosphere::kSea, Atmosphere::kFire, Atmosphere::kVinyl}) {
    plain(device, type);
    device.set_param(p::kDensity, 0.7f);
    device.set_param(p::kResonance, 1.0f);
    Stereo ringing = hold(device, 440.0f, 30.0f);
    plain(device, type);
    device.set_param(p::kDensity, 0.7f);
    Stereo flat = hold(device, 440.0f, 30.0f);
    std::vector<double> with = spectrum(ringing.left), without = spectrum(flat.left);
    auto prominence = [&](const std::vector<double>& power) {
      return density(power, 427.0, 453.0) /
             std::max(density(power, 300.0, 380.0), density(power, 520.0, 660.0));
    };
    char label[120];
    std::snprintf(label, sizeof label,
                  "%s: Resonance raises a peak on the key (%.0f dB; %.0f dB without)", kNames[type],
                  10.0 * std::log10(prominence(with)), 10.0 * std::log10(prominence(without)));
    EXPECT(prominence(with) > 10.0 && prominence(without) < 2.5, label);
  }

  // On a hum, Resonance leaves the fundamental and thins the harmonics.
  {
    plain(device, Atmosphere::kHum);
    Stereo buzz = hold(device, 110.0f, 3.0f);
    plain(device, Atmosphere::kHum);
    device.set_param(p::kResonance, 1.0f);
    Stereo pure = hold(device, 110.0f, 3.0f);
    EXPECT_NEAR(tone_level(pure.left, 110.0, kRate, 48000) / tone_level(buzz.left, 110.0, kRate, 48000),
                1.0, 0.1, "Hum: Resonance keeps the fundamental's level");
    EXPECT(tone_level(pure.left, 330.0, kRate, 48000) < 0.2 * tone_level(buzz.left, 330.0, kRate, 48000),
           "Hum: and takes the 3rd harmonic down by more than 14 dB");
  }

  // Heavy rain on every voice stays out of the clipper.
  {
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(Atmosphere::kRain));
    device.set_param(p::kDensity, 1.0f);
    device.set_param(p::kMovement, 1.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
    Stereo storm = render(device, 30.0f, kRate);
    std::printf("atmosphere: eight keys of a downpour peak at %.2f\n",
                std::max(peak(storm.left), peak(storm.right)));
    EXPECT(peak(storm.left) < 0.9 && peak(storm.right) < 0.9,
           "eight keys of a downpour stay under full scale");
  }

  // The key leans the colour: a high key is brighter than a low one.
  {
    plain(device, Atmosphere::kWind);
    Stereo low_key = hold(device, 110.0f, 20.0f);
    plain(device, Atmosphere::kWind);
    Stereo high_key = hold(device, 880.0f, 20.0f);
    EXPECT(centroid(high_key.left) > 1.8 * centroid(low_key.left),
           "a high key is brighter than a low key");
  }

  // Velocity is the level, and keys layer.
  {
    plain(device, Atmosphere::kWind);
    Stereo loud = hold(device, 220.0f, 20.0f, 1.0f);
    plain(device, Atmosphere::kWind);
    Stereo soft = hold(device, 220.0f, 20.0f, 0.25f);
    EXPECT_NEAR(rms(soft.left, 24000) / rms(loud.left, 24000), 0.25, 0.03, "velocity is the level");
    plain(device, Atmosphere::kWind);
    device.set_param(p::kVolume, -20.0f);
    Stereo quiet = hold(device, 220.0f, 20.0f);
    EXPECT_NEAR(rms(quiet.left, 24000) / rms(loud.left, 24000), 0.1, 0.002, "Volume is in decibels");
    plain(device, Atmosphere::kWind);
    device.note_on(1, 220.0f, 1.0f);
    device.note_on(2, 220.0f, 1.0f);
    device.note_on(3, 220.0f, 1.0f);
    device.note_on(4, 220.0f, 1.0f);
    Stereo four = render(device, 20.0f, kRate);
    EXPECT_NEAR(rms(four.left, 24000) / rms(loud.left, 24000), 2.0, 0.25,
                "four keys layer as four separate winds (twice the level, not four times)");
  }

  // Attack and release, and exact silence afterwards.
  {
    plain(device, Atmosphere::kHum);
    device.set_param(p::kAttack, 2.0f);
    device.set_param(p::kRelease, 2.0f);
    device.note_on(1, 110.0f, 1.0f);
    Stereo rise = render(device, 4.0f, kRate);
    const double full = rms(rise.left, 144000, 192000);
    EXPECT(rms(rise.left, 0, 9600) < 0.3 * full, "a 2 s attack is still quiet after 200 ms");
    EXPECT(rms(rise.left, 100800, 110400) > 0.95 * full, "and has arrived shortly after 2 s");
    device.note_off(1);
    Stereo fall = render(device, 5.0f, kRate);
    EXPECT(rms(fall.left, 43200, 48000) > 0.02 * full, "a 2 s release is still audible at 0.95 s");
    EXPECT(rms(fall.left, 96000, 100800) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, 192000, 240000) == 0.0 && peak(fall.right, 192000, 240000) == 0.0,
           "and is exactly silent soon after");

    for (int type = 0; type < Atmosphere::kKinds; ++type) {
      device.init(kRate);
      device.set_param(p::kType, static_cast<float>(type));
      device.set_param(p::kSize, 1.0f);
      device.note_on(1, 220.0f, 1.0f);
      render(device, 3.0f, kRate);
      device.note_off(1);
      render(device, 8.0f, kRate);
      Stereo after = render(device, 0.5f, kRate);
      char label[96];
      std::snprintf(label, sizeof label, "%s: exact silence after release, even at full Size",
                    kNames[type]);
      EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, label);
    }
  }

  // Changing type under a held key dips rather than clicks.
  {
    plain(device, Atmosphere::kSea);
    Stereo before = hold(device, 110.0f, 1.0f);
    device.set_param(p::kType, static_cast<float>(Atmosphere::kHum));
    Stereo change = render(device, 0.1f, kRate);
    Stereo after = render(device, 3.0f, kRate);
    EXPECT(max_step(change.left) <
               1.5 * std::max(max_step(before.left, 24000), max_step(after.left, 48000)),
           "changing Type does not click");
    std::vector<float> level = levels(after.left, 0.25, 1.0);
    EXPECT(tone_level(after.left, 110.0, kRate, 48000) > 0.1 && highest(level) < 1.005 * lowest(level),
           "and the new type is what sounds afterwards (a steady hum, no noise)");
  }

  // Levels: one key of each type sits at a sane level; eight keys stay
  // under the clip knee.
  for (int type = 0; type < Atmosphere::kKinds; ++type) {
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(type));
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 60.0f, kRate);
    const double level_db = db(std::max(peak(one.left, 4 * 48000), peak(one.right, 4 * 48000)));
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(type));
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
    Stereo eight = render(device, 30.0f, kRate);
    const double many = std::max(peak(eight.left), peak(eight.right));
    std::printf("atmosphere: %s peaks at %.1f dBFS (rms %.1f dBFS) with one key, %.2f with eight\n",
                kNames[type], level_db, db(rms(one.left, 4 * 48000)), many);
    char label[96];
    std::snprintf(label, sizeof label, "%s: one key at velocity 0.7 peaks between -24 and -10 dBFS",
                  kNames[type]);
    EXPECT(level_db > -24.0 && level_db < -10.0, label);
    std::snprintf(label, sizeof label, "%s: eight keys stay under the clip knee", kNames[type]);
    EXPECT(many < 0.5, label);
  }

  // Cost with eight keys held, per type.
  for (int type = 0; type < Atmosphere::kKinds; ++type) {
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(type));
    device.set_param(p::kResonance, 0.5f);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
    char label[64];
    std::snprintf(label, sizeof label, "atmosphere (8 keys, %s)", kNames[type]);
    report_cost(label, 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  }

  return finish("atmosphere");
}
