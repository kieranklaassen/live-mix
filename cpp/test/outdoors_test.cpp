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

// RMS per window of `samples`.
static std::vector<float> frames(const std::vector<float>& x, size_t samples) {
  std::vector<float> out;
  for (size_t at = 0; at + samples <= x.size(); at += samples)
    out.push_back(static_cast<float>(rms(x, at, at + samples)));
  return out;
}

// Pitch of [from, to) by counting zero crossings (for one clean tone).
static double crossing_hz(const std::vector<float>& x, size_t from, size_t to) {
  int crossings = 0;
  for (size_t i = from + 1; i < to; ++i) crossings += (x[i] > 0.0f) != (x[i - 1] > 0.0f) ? 1 : 0;
  return 0.5 * crossings * kRate / static_cast<double>(to - from);
}

// Power per hertz between lo and hi.
static double level_in(const std::vector<double>& power, double lo, double hi) {
  return band_power(power, lo, hi) / (hi - lo);
}

// Bubbles: find blips that start out of quiet and compare the spacing of
// their first zero crossings with their later ones. Returns the ratios
// (first third over last third; above 1 is a pitch that rises).
static std::vector<double> blip_rises(const std::vector<float>& x) {
  std::vector<double> ratios;
  const std::vector<float> env = frames(x, 48);  // 1 ms
  const double loud = 0.08 * highest(env);
  for (size_t f = 4; f + 16 < env.size(); ++f) {
    const double before = (env[f - 1] + env[f - 2] + env[f - 3]) / 3.0;
    if (env[f] < loud || env[f] < 5.0 * before) continue;
    // Zero crossings (interpolated) over the next 12 ms.
    std::vector<double> at;
    for (size_t i = f * 48 + 1; i < f * 48 + 576 && at.size() < 18; ++i) {
      if ((x[i] > 0.0f) != (x[i - 1] > 0.0f)) {
        at.push_back(static_cast<double>(i - 1) + x[i - 1] / (static_cast<double>(x[i - 1]) - x[i]));
      }
    }
    if (at.size() >= 10) {
      const size_t n = at.size() - 1, third = n / 3;
      const double first = (at[third] - at[0]) / static_cast<double>(third);
      const double last = (at[n] - at[n - third]) / static_cast<double>(third);
      ratios.push_back(first / last);
    }
    f += 12;
  }
  return ratios;
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

  // Crickets: one individual is a tone near 4.5 kHz in pulses of about
  // 10 ms, three or four to a chirp, two to four chirps a second.
  {
    plain(device, Outdoors::kCrickets, 0.0f);
    Stereo one = hold(device, 261.63f, 30.0f);
    const std::vector<float> m = mid(one);
    const std::vector<double> power = spectrum(m);
    const double carrier = dominant_frequency(m, kRate, 3000.0, 6500.0, 0, 96000);
    const std::vector<float> env = frames(m, 48);  // 1 ms
    const double gate = 0.2 * highest(env);
    const int pulses = count_rises(env, gate, 2);
    const int chirps = count_rises(env, gate, 60);
    int above = 0;
    for (float v : env) above += v > gate ? 1 : 0;
    std::printf("outdoors: one cricket: carrier %.0f Hz, %.1f %% of the power in 3.5 to 5.5 kHz, "
                "%.2f chirps a second of %.2f pulses, each %.1f ms above 20 %%\n",
                carrier, 100.0 * share(power, 3500.0, 5500.0), chirps / 30.0,
                static_cast<double>(pulses) / chirps, static_cast<double>(above) / pulses);
    EXPECT(share(power, 3500.0, 5500.0) > 0.97, "Crickets: the energy sits between 3.5 and 5.5 kHz");
    EXPECT(carrier > 4200.0 && carrier < 5000.0, "Crickets: a tone near 4.5 kHz");
    EXPECT(chirps / 30.0 > 2.0 && chirps / 30.0 < 4.0, "Crickets: two to four chirps a second");
    EXPECT(static_cast<double>(pulses) / chirps > 2.8 && static_cast<double>(pulses) / chirps < 4.2,
           "Crickets: three or four pulses to a chirp");
    EXPECT(static_cast<double>(above) / pulses > 5.0 && static_cast<double>(above) / pulses < 12.0,
           "Crickets: pulses of about 10 ms");

    // The key is the temperature: a higher key is a higher, quicker cricket.
    plain(device, Outdoors::kCrickets, 0.0f);
    const std::vector<float> low = mid(hold(device, 130.81f, 20.0f));
    plain(device, Outdoors::kCrickets, 0.0f);
    const std::vector<float> high = mid(hold(device, 523.25f, 20.0f));
    const double low_hz = dominant_frequency(low, kRate, 3000.0, 6500.0, 0, 96000);
    const double high_hz = dominant_frequency(high, kRate, 3000.0, 6500.0, 0, 96000);
    const std::vector<float> low_env = frames(low, 48), high_env = frames(high, 48);
    const int low_chirps = count_rises(low_env, 0.2 * highest(low_env), 60);
    const int high_chirps = count_rises(high_env, 0.2 * highest(high_env), 60);
    std::printf("outdoors: cricket at C3 / C5: carrier %.0f / %.0f Hz, %.2f / %.2f chirps a second\n", low_hz,
                high_hz, low_chirps / 20.0, high_chirps / 20.0);
    EXPECT_NEAR(high_hz / low_hz, std::pow(2.0, 0.4), 0.03, "Crickets: two octaves of key move the carrier by 0.4 octave");
    EXPECT(high_chirps > 1.15 * low_chirps, "Crickets: and the chirps come quicker");
  }

  // Birds: tonal, sweeping, between 2 and 7 kHz, and mostly silence when sparse.
  {
    plain(device, Outdoors::kBirds, 0.0f);
    const std::vector<float> one = mid(hold(device, 261.63f, 60.0f));
    const std::vector<float> env = frames(one, 480);  // 10 ms
    const double gate = 0.3 * highest(env);
    double crest_sum = 0.0;
    std::vector<double> pitches;
    for (size_t f = 0; f < env.size(); ++f) {
      if (env[f] <= gate) continue;
      crest_sum += peak(one, f * 480, f * 480 + 480) / env[f];
      pitches.push_back(crossing_hz(one, f * 480, f * 480 + 480));
    }
    const double crest = crest_sum / static_cast<double>(pitches.size());
    double moved = 0.0;
    for (size_t i = 1; i < pitches.size(); ++i) moved += std::fabs(std::log2(pitches[i] / pitches[i - 1]));
    moved /= static_cast<double>(pitches.size());
    std::sort(pitches.begin(), pitches.end());
    const double lowest_hz = pitches[pitches.size() / 20], highest_hz = pitches[pitches.size() * 19 / 20];
    const double sounding = duty(env);
    std::printf("outdoors: one bird: crest factor of its loud 10 ms frames %.2f (a sine is 1.41), pitch from "
                "%.0f to %.0f Hz, moving %.3f octaves per frame, sounding %.0f %% of the time\n",
                crest, lowest_hz, highest_hz, moved, 100.0 * sounding);
    EXPECT(crest < 1.6, "Birds: one bird is one tone at a time");
    EXPECT(highest_hz > 1.5 * lowest_hz && moved > 0.01, "Birds: whose pitch sweeps");
    EXPECT(sounding < 0.3, "Birds: a sparse scene is mostly silence");

    plain(device, Outdoors::kBirds, 0.5f);
    const std::vector<double> power = spectrum(mid(hold(device, 261.63f, 120.0f)));
    std::printf("outdoors: a chorus has %.0f %% of its power between 2 and 7 kHz\n", 100.0 * share(power, 2000.0, 7000.0));
    EXPECT(share(power, 2000.0, 7000.0) > 0.9, "Birds: the chorus sits between 2 and 7 kHz");

    // The key shifts the register: a third of an octave per octave, within half an octave.
    plain(device, Outdoors::kBirds, 0.5f);
    const double low = centroid(spectrum(mid(hold(device, 65.41f, 60.0f))));
    plain(device, Outdoors::kBirds, 0.5f);
    const double high = centroid(spectrum(mid(hold(device, 1046.5f, 60.0f))));
    std::printf("outdoors: birds for C2 / C6: spectral centroid %.0f / %.0f Hz\n", low, high);
    EXPECT(high > 1.6 * low && high < 2.2 * low, "Birds: a high key brings higher birds");
  }

  // Frogs: pulse trains through formants, in bouts with gaps; a second
  // croaker answers the first; a peeper whistles above.
  {
    plain(device, Outdoors::kFrogs, 0.0f);
    const std::vector<float> one = mid(hold(device, 261.63f, 90.0f));
    const std::vector<double> power = spectrum(one);
    const double f1 = level_in(power, 580.0, 760.0), dip = level_in(power, 950.0, 1150.0);
    const double f2 = level_in(power, 1300.0, 1700.0), dip2 = level_in(power, 1850.0, 2100.0);
    const double f3 = level_in(power, 2200.0, 2650.0);
    std::printf("outdoors: one frog: formants near 670 / 1500 / 2400 Hz stand %.1f / %.1f / %.1f dB over the "
                "dips at 1050 / 1050 / 1975 Hz\n",
                0.5 * db(f1 / dip) * 2.0, 0.5 * db(f2 / dip) * 2.0, 0.5 * db(f3 / dip2) * 2.0);
    EXPECT(f1 > 4.0 * dip && f2 > 1.5 * dip && f3 > 1.2 * dip2, "Frogs: three formants between 500 Hz and 2.6 kHz");
    // The pulse rate: the strongest ripple of the rectified croak.
    std::vector<float> rectified(one.size());
    for (size_t i = 0; i < one.size(); ++i) rectified[i] = std::fabs(one[i]);
    const std::vector<float> env = frames(one, 480);
    const size_t loudest = static_cast<size_t>(std::max_element(env.begin(), env.end()) - env.begin());
    const size_t from = loudest * 480 > 2400 ? loudest * 480 - 2400 : 0;
    const double pulse_hz = dominant_frequency(rectified, kRate, 40.0, 140.0, from, from + 4800);
    const int calls = count_rises(env, 0.1 * highest(env), 3);
    const int bouts = count_rises(env, 0.1 * highest(env), 150);
    std::printf("outdoors: one frog: %.0f pulses a second in its loudest croak; %d croaks in %d bouts in 90 s, "
                "sounding %.0f %% of the time\n",
                pulse_hz, calls, bouts, 100.0 * duty(env));
    EXPECT(pulse_hz > 55.0 && pulse_hz < 110.0, "Frogs: a croak is 60 to 100 pulses a second");
    EXPECT(bouts >= 4 && calls > 4 * bouts && duty(env) < 0.4, "Frogs: croaks come in bouts with gaps between");

    plain(device, Outdoors::kFrogs, 0.25f);
    const std::vector<float> two = mid(hold(device, 261.63f, 90.0f));
    const std::vector<float> two_env = frames(two, 480);
    const int answered = count_rises(two_env, 0.1 * highest(two_env), 3);
    plain(device, Outdoors::kFrogs, 0.5f);
    const std::vector<double> three = spectrum(mid(hold(device, 261.63f, 90.0f)));
    const std::vector<double> pair = spectrum(two);
    std::printf("outdoors: a second croaker makes it %d calls; with the peeper %.1f %% of the power is in 2.2 to 3.8 kHz (%.1f %% without)\n",
                answered, 100.0 * share(three, 2200.0, 3800.0), 100.0 * share(pair, 2200.0, 3800.0));
    EXPECT(answered > 1.4 * calls, "Frogs: the second croaker answers in the gaps");
    EXPECT(share(three, 2200.0, 3800.0) > 2.0 * share(pair, 2200.0, 3800.0), "Frogs: the peeper is a high whistle near 3 kHz");

    plain(device, Outdoors::kFrogs, 0.0f);
    const double low = centroid(spectrum(mid(hold(device, 65.41f, 60.0f))));
    plain(device, Outdoors::kFrogs, 0.0f);
    const double high = centroid(spectrum(mid(hold(device, 1046.5f, 60.0f))));
    std::printf("outdoors: frog for C2 / C6: spectral centroid %.0f / %.0f Hz\n", low, high);
    EXPECT(high > 1.5 * low, "Frogs: a low key is a bigger frog");
  }

  // Stream: bubbles whose pitch rises, adding up to a broad band that is not white.
  {
    plain(device, Outdoors::kStream, 0.0f);
    const std::vector<double> ratios = blip_rises(mid(hold(device, 261.63f, 60.0f)));
    std::vector<double> sorted = ratios;
    std::sort(sorted.begin(), sorted.end());
    int rising = 0;
    for (double r : ratios) rising += r > 1.0 ? 1 : 0;
    const double median = sorted.empty() ? 0.0 : sorted[sorted.size() / 2];
    std::printf("outdoors: of %zu bubbles caught alone, %.0f %% rise in pitch; the median one by %.1f %% over its first 12 ms\n",
                ratios.size(), 100.0 * rising / std::max<size_t>(ratios.size(), 1), 100.0 * (median - 1.0));
    EXPECT(ratios.size() > 100 && rising > 0.7 * ratios.size() && median > 1.01,
           "Stream: a bubble's pitch rises as it decays");

    plain(device, Outdoors::kStream, 0.5f);
    const std::vector<double> power = spectrum(mid(hold(device, 261.63f, 60.0f)));
    const double octave[5] = {share(power, 250.0, 500.0), share(power, 500.0, 1000.0), share(power, 1000.0, 2000.0),
                              share(power, 2000.0, 4000.0), share(power, 4000.0, 8000.0)};
    const double slope = level_in(power, 6000.0, 10000.0) / level_in(power, 700.0, 1500.0);
    std::printf("outdoors: stream power by octave from 250 Hz: %.0f / %.0f / %.0f / %.0f / %.0f %%; per hertz, "
                "6 to 10 kHz is %.1f dB under 0.7 to 1.5 kHz\n",
                100.0 * octave[0], 100.0 * octave[1], 100.0 * octave[2], 100.0 * octave[3], 100.0 * octave[4],
                -0.5 * db(slope) * 2.0);
    EXPECT(octave[1] > 0.08 && octave[2] > 0.08 && octave[3] > 0.08 && octave[1] < 0.65 && octave[2] < 0.65,
           "Stream: a broad band, three octaves each carrying a share");
    EXPECT(slope < 0.03, "Stream: not white: the top is well under the middle");

    plain(device, Outdoors::kStream, 0.5f);
    const double low = centroid(spectrum(mid(hold(device, 65.41f, 30.0f))));
    plain(device, Outdoors::kStream, 0.5f);
    const double high = centroid(spectrum(mid(hold(device, 1046.5f, 30.0f))));
    std::printf("outdoors: stream for C2 / C6: spectral centroid %.0f / %.0f Hz\n", low, high);
    EXPECT(high > 1.8 * low, "Stream: a low key is deeper water");
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
