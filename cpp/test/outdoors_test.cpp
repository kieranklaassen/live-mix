// Native harness for Outdoors (cpp/devices/outdoors). The conformance pass
// covers silence before and after notes, voice stealing, parameter abuse,
// other sample rates and that two renders after init() match (every random
// source is seeded there); the rest measures each scene: where its energy
// sits, how its events are timed and what the key and the knobs do to it.

#include "../devices/outdoors/outdoors.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::Outdoors;
namespace p = livemix::outdoors;

static Outdoors device;

static const float kRate = 48000.0f;

static const char* const kNames[Outdoors::kKinds] = {"Birds",  "Crickets", "Frogs",
                                                     "Stream", "Thunder",  "Chimes"};

// A plain patch of one type: near, steady, fast envelopes, unity volume.
static void plain(Outdoors& d, int type, float density = 0.5f) {
  d.init(kRate);
  d.set_param(p::kType, static_cast<float>(type));
  d.set_param(p::kDensity, density);
  d.set_param(p::kDistance, 0.0f);
  d.set_param(p::kMovement, 0.0f);
  d.set_param(p::kTone, 0.5f);
  d.set_param(p::kAttack, 0.01f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kWidth, 1.0f);
  d.set_param(p::kVolume, 0.0f);
}

static Stereo hold(Outdoors& d, float hz, float seconds, float velocity = 1.0f) {
  d.note_on(1, hz, velocity);
  return render(d, seconds, kRate);
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> m(s.size());
  for (size_t i = 0; i < m.size(); ++i) m[i] = 0.5f * (s.left[i] + s.right[i]);
  return m;
}

// The louder side's RMS per window of `seconds`, rendered in blocks without
// keeping the audio: minutes of a scene fit in a few kilobytes.
static std::vector<float> envelope(Outdoors& d, float seconds, float window_seconds) {
  std::vector<float> out;
  const long window = static_cast<long>(window_seconds * kRate);
  const long total = static_cast<long>(seconds * kRate);
  double left = 0.0, right = 0.0;
  long filled = 0;
  for (long done = 0; done < total; done += kBlock) {
    d.process(kBlock);
    for (int i = 0; i < kBlock; ++i) {
      left += static_cast<double>(d.out_left()[i]) * d.out_left()[i];
      right += static_cast<double>(d.out_right()[i]) * d.out_right()[i];
      if (++filled == window) {
        out.push_back(static_cast<float>(std::sqrt(std::max(left, right) / static_cast<double>(window))));
        left = right = 0.0;
        filled = 0;
      }
    }
  }
  return out;
}

static double highest(const std::vector<float>& x) { return *std::max_element(x.begin(), x.end()); }

// Share of the windows that are within 30 dB of the loudest one.
static double duty(const std::vector<float>& env) {
  const double floor = 0.0316 * highest(env);
  int on = 0;
  for (float v : env) on += v > floor ? 1 : 0;
  return static_cast<double>(on) / static_cast<double>(env.size());
}

// How many times the track rises through `threshold` after at least
// `quiet` windows under it.
static int count_rises(const std::vector<float>& env, double threshold, int quiet = 1) {
  int count = 0, below = quiet;
  for (float v : env) {
    if (v > threshold) {
      if (below >= quiet) ++count;
      below = 0;
    } else {
      ++below;
    }
  }
  return count;
}

// The largest autocorrelation of a track (mean removed) at lags from
// `from` windows up to half its length.
static double repeats(const std::vector<float>& env, size_t from) {
  const double m = mean(env);
  double var = 0.0;
  for (float v : env) var += (v - m) * (v - m);
  double worst = 0.0;
  for (size_t lag = from; lag < env.size() / 2; ++lag) {
    double sum = 0.0;
    for (size_t i = 0; i + lag < env.size(); ++i) sum += (env[i] - m) * (env[i + lag] - m);
    sum *= static_cast<double>(env.size()) / static_cast<double>(env.size() - lag);
    worst = std::max(worst, sum / var);
  }
  return worst;
}

// Averaged power spectrum (Hann, 8192 points, half overlap).
static livemix::kit::Fft<8192> fft;
static const int kBins = 4096;
static const double kBinHz = 48000.0 / 8192.0;
static std::vector<double> spectrum(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
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

// Share of the power between lo and hi.
static double share(const std::vector<double>& power, double lo, double hi) {
  return band_power(power, lo, hi) / band_power(power, 0.0, 24000.0);
}

static double centroid(const std::vector<double>& power) {
  double weighted = 0.0, total = 0.0;
  for (int k = 1; k < kBins; ++k) {
    weighted += power[k] * k * kBinHz;
    total += power[k];
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// MORE HELPERS


int main() {
  Conformance spec;
  spec.name = "outdoors";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  fft.init();
  char label[200];

  // Every random source is seeded in init(): each type renders the same
  // twice, and something comes with the key at once.
  for (int type = 0; type < Outdoors::kKinds; ++type) {
    plain(device, type);
    Stereo first = hold(device, 220.0f, 3.0f);
    plain(device, type);
    Stereo second = hold(device, 220.0f, 3.0f);
    std::snprintf(label, sizeof label, "%s: deterministic after init, and sounding within the first second",
                  kNames[type]);
    EXPECT(first.left == second.left && first.right == second.right && rms(first.left, 0, 48000) > 1.0e-4,
           label);
  }

  // Nothing repeats: over two minutes the envelope of a held key has no
  // strong autocorrelation beyond five seconds. (Thunder is too sparse for
  // two minutes to say anything: ten minutes of it, beyond thirty seconds.)
  for (int type = 0; type < Outdoors::kKinds; ++type) {
    const bool storm = type == Outdoors::kThunder;
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(type));
    device.set_param(p::kAttack, 0.01f);
    device.note_on(1, 261.63f, 0.7f);
    const std::vector<float> env = envelope(device, storm ? 600.0f : 120.0f, storm ? 0.5f : 0.05f);
    const double worst = repeats(env, storm ? 60 : 100);
    std::printf("outdoors: %s envelope autocorrelation beyond %d s is at most %.2f\n", kNames[type],
                storm ? 30 : 5, worst);
    std::snprintf(label, sizeof label, "%s: no pattern repeats within the measured span", kNames[type]);
    EXPECT(worst < 0.5, label);
  }

  // Two keys at the same pitch are two scenes, not one scene doubled.
  for (int type = 0; type < Outdoors::kKinds; ++type) {
    const float skip = type == Outdoors::kThunder ? 8.0f : 0.5f;
    const float span = type == Outdoors::kThunder ? 240.0f : 30.0f;
    plain(device, type);
    device.note_on(1, 220.0f, 1.0f);
    envelope(device, skip, 0.05f);
    const std::vector<float> one = envelope(device, span, 0.05f);
    plain(device, type);
    device.note_on(1, 220.0f, 0.0f);  // takes the first voice, silently
    device.note_on(2, 220.0f, 1.0f);
    envelope(device, skip, 0.05f);
    const std::vector<float> other = envelope(device, span, 0.05f);
    std::vector<float> a = one, b = other;
    const double ma = mean(a), mb = mean(b);
    for (float& v : a) v -= static_cast<float>(ma);
    for (float& v : b) v -= static_cast<float>(mb);
    const double alike = correlation(a, b);
    std::printf("outdoors: %s, two keys at one pitch: their envelopes correlate %.2f\n", kNames[type], alike);
    std::snprintf(label, sizeof label, "%s: a second key is another scene, not the same one again", kNames[type]);
    EXPECT(one != other && alike < 0.5 && highest(other) > 1.0e-4, label);
  }

  // Density is how much goes on: more sound in a minute at every step up.
  for (int type = 0; type < Outdoors::kKinds; ++type) {
    const float span = type == Outdoors::kThunder ? 400.0f : 60.0f;
    double energy[3] = {}, busy[3] = {};
    for (int step = 0; step < 3; ++step) {
      plain(device, type, 0.5f * static_cast<float>(step));
      device.note_on(1, 261.63f, 1.0f);
      const std::vector<float> env = envelope(device, span, 0.02f);
      for (float v : env) energy[step] += static_cast<double>(v) * v / static_cast<double>(env.size());
      busy[step] = duty(env);
    }
    std::printf("outdoors: %s at Density 0 / 0.5 / 1: rms %.1f / %.1f / %.1f dB, sounding %.0f / %.0f / %.0f %% of the time\n",
                kNames[type], 0.5 * db(energy[0]), 0.5 * db(energy[1]), 0.5 * db(energy[2]),
                100.0 * busy[0], 100.0 * busy[1], 100.0 * busy[2]);
    std::snprintf(label, sizeof label, "%s: Density raises the amount of sound and how often it sounds",
                  kNames[type]);
    EXPECT(energy[1] > 1.1 * energy[0] && energy[2] > 1.1 * energy[1] && busy[1] > busy[0] &&
               busy[2] >= busy[1],
           label);
  }

  // BEHAVIOUR

  // Cost with eight keys held at full Density, per type.
  for (int type = 0; type < Outdoors::kKinds; ++type) {
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(type));
    device.set_param(p::kDensity, 1.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
    render(device, 2.0f, kRate);
    char label[64];
    std::snprintf(label, sizeof label, "outdoors (8 keys, full Density, %s)", kNames[type]);
    report_cost(label, 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  }

  return finish("outdoors");
}
