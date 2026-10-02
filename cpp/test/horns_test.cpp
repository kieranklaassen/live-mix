// Native harness for Horns (cpp/devices/horns). The conformance pass covers
// silence before and after notes, voice stealing under a pile of notes,
// parameter abuse and other sample rates. The rest measures what makes it
// brass, because nobody can listen here: the kernel on its own (the series,
// the oscillator, the band limit, the pipe), then tuning, a tone that gets
// brighter as it gets louder inside one note, highs that arrive late, a
// bell formant that stays put, the mute, the lip settle, a section that
// beats, the harmony interval, breath, vibrato, honest envelopes, aliasing,
// levels, clicks and mono compatibility.

#include <complex>
#include <cstdlib>

#include "../devices/horns/horns.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Horns;
namespace p = livemix::horns;

static Horns device;

static const float kRate = 48000.0f;

enum Type { kFrenchHorn = 0, kFlugelhorn, kTrumpet, kMutedTrumpet, kLowBrass, kTypes };
static const char* const kTypeNames[kTypes] = {"French horn", "Flugelhorn", "Trumpet", "Muted trumpet",
                                                "Low brass"};

// One steady player per note: no section, breath, vibrato or harmony in the
// way, a quick envelope, volume at unity.
static void solo(Horns& d, int type, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kType, static_cast<float>(type));
  d.set_param(p::kBlow, 1.0f);
  d.set_param(p::kBreath, 0.0f);
  d.set_param(p::kSection, 0.0f);
  d.set_param(p::kAttack, 0.02f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kHarmony, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static std::vector<float> side(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] - s.right[i]);
  return out;
}

// The pitch of the fundamental over time in cents from `f0`, one value per
// millisecond (entry m is the pitch at m ms). The signal is shifted down by
// f0 and averaged twice over two whole periods, which nulls every other
// harmonic; how fast the phase of what is left turns is the deviation.
static std::vector<float> pitch_track(const std::vector<float>& x, double f0, double rate = kRate,
                                      std::vector<float>* power = nullptr) {
  const size_t n = x.size();
  const size_t box = static_cast<size_t>(std::lround(2.0 * rate / f0));
  const size_t hop = static_cast<size_t>(rate / 1000.0);
  std::vector<double> re(n), im(n);
  for (size_t i = 0; i < n; ++i) {
    const double phase = 2.0 * kPi * f0 * static_cast<double>(i) / rate;
    re[i] = x[i] * std::cos(phase);
    im[i] = -x[i] * std::sin(phase);
  }
  for (int pass = 0; pass < 2; ++pass) {
    for (std::vector<double>* part : {&re, &im}) {
      std::vector<double>& v = *part;
      std::vector<double> sum(n + 1, 0.0);
      for (size_t i = 0; i < n; ++i) sum[i + 1] = sum[i] + v[i];
      for (size_t i = 0; i < n; ++i) v[i] = i + 1 >= box ? sum[i + 1] - sum[i + 1 - box] : 0.0;
    }
  }
  // Both averages together lag by box - 1 samples.
  std::vector<float> track;
  for (size_t centre = 0; centre + box - 1 + hop < n; centre += hop) {
    const size_t i = centre + box - 1;
    float cents = 0.0f;
    if (centre >= box) {
      const double turn = std::atan2(im[i + hop] * re[i] - re[i + hop] * im[i],
                                     re[i + hop] * re[i] + im[i + hop] * im[i]);
      const double hz = f0 + turn * rate / (2.0 * kPi * static_cast<double>(hop));
      cents = static_cast<float>(1200.0 * std::log2(std::max(hz, 1.0) / f0));
    }
    track.push_back(cents);
    if (power) power->push_back(static_cast<float>(re[i] * re[i] + im[i] * im[i]));
  }
  return track;
}

// The pitch a listener would name, in cents from `f0`: the track averaged
// by power (so players a few cents apart count equally).
static double mean_pitch(const std::vector<float>& x, double f0, size_t from_ms, double rate = kRate) {
  std::vector<float> power;
  const std::vector<float> track = pitch_track(x, f0, rate, &power);
  double sum = 0.0, weight = 0.0;
  for (size_t i = from_ms; i < track.size(); ++i) {
    sum += static_cast<double>(power[i]) * track[i];
    weight += power[i];
  }
  return weight > 0.0 ? sum / weight : 0.0;
}

// Spectral centroid in Hz over the harmonics of `f0`, weighted by amplitude.
static double centroid(const std::vector<float>& x, double f0, size_t from, size_t to, double rate = kRate) {
  double sum = 0.0, weight = 0.0;
  for (int h = 1; h <= 40 && h * f0 < 0.45 * rate; ++h) {
    const double level = tone_level(x, h * f0, rate, from, to);
    sum += level * h * f0;
    weight += level;
  }
  return weight > 0.0 ? sum / weight : 0.0;
}

// Level of the harmonics of `f0` that fall in [lo, hi) Hz, over the window.
static double band(const std::vector<float>& x, double f0, double lo, double hi, size_t from, size_t to,
                   double rate = kRate) {
  double sum = 0.0;
  for (int h = 1; h * f0 < hi; ++h) {
    if (h * f0 < lo) continue;
    const double level = tone_level(x, h * f0, rate, from, to);
    sum += level * level;
  }
  return std::sqrt(sum);
}

// Frequency of the strongest harmonic of `f0`, and its level.
static double strongest_partial(const std::vector<float>& x, double f0, size_t from, size_t to,
                                double* level_out = nullptr, double rate = kRate) {
  double best = -1.0, best_hz = 0.0;
  for (int h = 1; h <= 60 && h * f0 < 0.45 * rate; ++h) {
    const double level = tone_level(x, h * f0, rate, from, to);
    if (level > best) {
      best = level;
      best_hz = h * f0;
    }
  }
  if (level_out) *level_out = best;
  return best_hz;
}

// Lowest and highest level of the `hz` component over consecutive windows.
static void level_range(const std::vector<float>& x, double hz, size_t from, size_t window, double* lo,
                        double* hi) {
  *lo = 1.0e9;
  *hi = 0.0;
  for (size_t start = from; start + window <= x.size(); start += window / 2) {
    const double level = tone_level(x, hz, kRate, start, start + window);
    *lo = std::min(*lo, level);
    *hi = std::max(*hi, level);
  }
}

// Amplitude spectrum of 16384 samples from `from` under a four-term
// Blackman-Harris window (side lobes 92 dB down): entry k is the level at
// k·rate/16384 Hz, 1.0 for a full-scale sine.
static const size_t kSpectrum = 16384;
static std::vector<double> spectrum(const std::vector<float>& x, size_t from) {
  const size_t n = kSpectrum;
  std::vector<std::complex<double>> a(n);
  double window_sum = 0.0;
  for (size_t i = 0; i < n; ++i) {
    const double t = 2.0 * kPi * static_cast<double>(i) / static_cast<double>(n);
    const double w = 0.35875 - 0.48829 * std::cos(t) + 0.14128 * std::cos(2.0 * t) - 0.01168 * std::cos(3.0 * t);
    a[i] = from + i < x.size() ? w * x[from + i] : 0.0;
    window_sum += w;
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> root = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w = 1.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= root;
      }
    }
  }
  std::vector<double> out(n / 2);
  for (size_t k = 0; k < n / 2; ++k) out[k] = 2.0 * std::abs(a[k]) / window_sum;
  return out;
}

// The strongest component that is not a harmonic of `f0` (or of `second`,
// the harmony voice, when given), in dB under the
// strongest that is: what folds back from above Nyquist, or anything else
// that does not belong. Bins beside a harmonic (the window's main lobe and
// a cent or two of drift) are left out.
static double stray_db(const std::vector<float>& x, double f0, double rate, size_t from, double second = 0.0) {
  const std::vector<double> bins = spectrum(x, from);
  const double width = rate / static_cast<double>(kSpectrum);
  double harmonic = 0.0, stray = 0.0;
  for (size_t k = static_cast<size_t>(30.0 / width); k < bins.size(); ++k) {
    const double hz = static_cast<double>(k) * width;
    bool on_harmonic = false;
    for (double root : {f0, second}) {
      if (root <= 0.0) continue;
      const double off = std::fabs(hz - std::round(hz / root) * root);
      on_harmonic = on_harmonic || (hz > 0.5 * root && off < 8.0 * width + 0.002 * hz);
    }
    if (on_harmonic) {
      harmonic = std::max(harmonic, bins[k]);
    } else {
      stray = std::max(stray, bins[k]);
    }
  }
  return db(harmonic) - db(stray);
}

// What the bell of `type` does to a partial at `hz`, as amplitude.
static double bell_gain(int type, double hz, double rate = kRate) {
  p::BellBank bank;
  bank.set(p::voicing(type), static_cast<float>(rate));
  return std::sqrt(bank.power_at(1.0 - std::cos(2.0 * kPi * hz / rate)));
}

// The largest third difference: what a click leaves and a band-limited
// tone does not. A step of size s gives about s; a partial at 1 kHz gives
// two thousandths of its amplitude.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

// HORNS_REPORT=1 prints every measurement, passing or not.
static bool report() {
  static const bool on = std::getenv("HORNS_REPORT") != nullptr;
  return on;
}
#define MEASURED(...)                 \
  do {                                \
    if (report()) {                   \
      std::printf("  measured: ");    \
      std::printf(__VA_ARGS__);       \
      std::printf("\n");              \
    }                                 \
  } while (0)

int main() {
  Conformance spec;
  spec.name = "horns";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 9.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  const size_t kSecond = static_cast<size_t>(kRate);
  char label[200];

  // --- the kernel on its own (driven_pipe.h) ------------------------------------------------

  // The series: neighbouring harmonics stand in the ratio a.
  for (float a : {0.3f, 0.6f}) {
    p::Rotor rotor;
    rotor.tune(110.0f, kRate);
    rotor.start(0.0f);
    std::vector<float> x(kSecond);
    for (size_t i = 0; i < x.size(); ++i) {
      if (i % 32 == 0) rotor.bend(1.0f);
      rotor.tick();
      x[i] = p::series(rotor.c, rotor.s, a);
    }
    double worst = 0.0;
    for (int h = 1; h < 8; ++h) {
      const double fall = db(tone_level(x, 110.0 * (h + 1), kRate)) - db(tone_level(x, 110.0 * h, kRate));
      worst = std::max(worst, std::fabs(fall - db(a)));
    }
    std::snprintf(label, sizeof label, "the series at a = %.1f falls %.1f dB per harmonic (worst error %.2f dB)", a,
                  db(a), worst);
    EXPECT(worst < 0.3, label);
  }

  // The oscillator holds its pitch and its size, and bends by the ratio asked.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (float hz : {65.41f, 440.0f, 4186.0f}) {
      for (float ratio : {1.0f, 1.02f}) {
        p::Rotor rotor;
        rotor.tune(hz, rate);
        rotor.start(0.0f);
        const size_t n = static_cast<size_t>(2.0f * rate);
        double size_error = 0.0;
        for (size_t i = 0; i < n; ++i) {
          if (i % 32 == 0) rotor.bend(ratio);
          rotor.tick();
          size_error = std::max(size_error, std::fabs(std::hypot(rotor.c, rotor.s) - 1.0));
        }
        // Where the phase should be after n turns, against where it is.
        const double turned = 2.0 * kPi * static_cast<double>(hz) * ratio / rate * static_cast<double>(n);
        const double error = std::remainder(std::atan2(rotor.s, rotor.c) - turned, 2.0 * kPi);
        const double cents = 1200.0 * std::log2(1.0 + error / turned);
        std::snprintf(label, sizeof label, "the rotor holds %.2f Hz x %.2f at %.0f Hz (%.4f cents off, size off by %.2g)",
                      hz, ratio, rate, cents, size_error);
        EXPECT(std::fabs(cents) < 0.5 && size_error < 1.0e-3, label);
      }
    }
  }

  // The band limit: at the cap what folds back is 60 dB under the note; the
  // same series at a brass brightness without the cap aliases, and this
  // measurement sees it.
  for (float rate : {44100.0f, 48000.0f}) {
    for (float hz : {1046.5f, 2093.0f}) {
      const float cap = p::brightness_cap(hz, rate);
      double clean = 0.0, dirty = 0.0;
      for (int pass = 0; pass < 2; ++pass) {
        p::Rotor rotor;
        rotor.tune(hz, rate);
        rotor.start(0.0f);
        std::vector<float> x(kSpectrum + 1000);
        for (size_t i = 0; i < x.size(); ++i) {
          if (i % 32 == 0) rotor.bend(1.0f);
          rotor.tick();
          x[i] = p::series(rotor.c, rotor.s, pass == 0 ? cap : 0.88f);
        }
        (pass == 0 ? clean : dirty) = stray_db(x, hz, rate, 500);
      }
      std::snprintf(label, sizeof label,
                    "%.0f Hz at %.0f Hz: capped at a = %.2f the series is clean (%.0f dB), uncapped it aliases (%.0f dB)",
                    hz, rate, cap, clean, dirty);
      EXPECT(clean > 60.0 && dirty < 40.0, label);
    }
  }

  // The pipe: a comb whose first peak sits on the note.
  for (float rate : {48000.0f, 96000.0f}) {
    for (float hz : {65.41f, 220.0f, 1046.5f}) {
      static p::PipeComb<4096> comb;
      comb.clear();
      comb.tune(hz, 0.9f, 4000.0f, rate);
      std::vector<float> x(static_cast<size_t>(rate));
      for (size_t i = 0; i < x.size(); ++i) x[i] = comb.process(i == 0 ? 1.0f : 0.0f);
      const double found = dominant_frequency(x, rate, hz * 0.94, hz * 1.06);
      const double cents = 1200.0 * std::log2(found / hz);
      std::snprintf(label, sizeof label, "the pipe tuned to %.2f Hz at %.0f Hz rings %.2f cents off", hz, rate, cents);
      EXPECT(std::fabs(cents) < 3.0, label);
      EXPECT(finite(x) && peak(x, x.size() - 100) < 1.0e-3, "the pipe rings out");
    }
  }

  // --- tuning (R9) ---------------------------------------------------------------------------

  // One player is on the note from C2 to C6 at every sample rate.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (float hz : {65.41f, 130.81f, 261.63f, 523.25f, 1046.5f}) {
      solo(device, kFrenchHorn, rate);
      device.set_param(p::kBlow, 0.5f);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 1.5f, rate);
      const double cents = mean_pitch(out.left, hz, 300, rate);
      std::snprintf(label, sizeof label, "one player at %.2f Hz, %.0f Hz rate, is %.2f cents off", hz, rate, cents);
      EXPECT(std::fabs(cents) < 3.0, label);
      MEASURED("%s", label);
    }
  }
  // A full section centres on the note.
  for (float hz : {110.0f, 220.0f, 880.0f}) {
    solo(device, kFrenchHorn);
    device.set_param(p::kSection, 1.0f);
    device.note_on(1, hz, 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    const double cents = mean_pitch(mid(out), hz, 500);
    std::snprintf(label, sizeof label, "a section of four at %.0f Hz centres %.2f cents off the note", hz, cents);
    EXPECT(std::fabs(cents) < 3.0, label);
    MEASURED("%s", label);
  }

  // --- brightness follows loudness (R1) ------------------------------------------------------

  // Between notes: a hard-blown loud note is far brighter than a soft one.
  for (int type : {kFrenchHorn, kTrumpet}) {
    double cen[2];
    int which = 0;
    for (float velocity : {0.2f, 1.0f}) {
      solo(device, type);
      device.note_on(1, 220.0f, velocity);
      Stereo out = render(device, 1.0f, kRate);
      cen[which++] = centroid(out.left, 220.0, kSecond / 2, kSecond);
    }
    std::snprintf(label, sizeof label, "%s at Blow 1: centroid %.0f Hz at velocity 0.2, %.0f Hz at 1.0 (x%.2f)",
                  kTypeNames[type], cen[0], cen[1], cen[1] / cen[0]);
    EXPECT(cen[1] > 2.5 * cen[0], label);
    MEASURED("%s", label);
  }
  // The source under the bell: harmonics 1 to 8 with the bell divided out
  // fall steeply at the softest setting and barely at the loudest.
  {
    double slope[2];
    int which = 0;
    for (float setting : {0.0f, 1.0f}) {
      solo(device, kTrumpet);
      device.set_param(p::kBlow, setting);
      device.note_on(1, 110.0f, setting);
      Stereo out = render(device, 1.0f, kRate);
      // Least-squares line through the levels in dB against harmonic number.
      double sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (int h = 1; h <= 8; ++h) {
        const double level = db(tone_level(out.left, 110.0 * h, kRate, kSecond / 2, kSecond) /
                                bell_gain(kTrumpet, 110.0 * h));
        sx += h;
        sy += level;
        sxx += h * h;
        sxy += h * level;
      }
      slope[which++] = (8 * sxy - sx * sy) / (8 * sxx - sx * sx);
    }
    std::snprintf(label, sizeof label, "under the bell the series falls %.1f dB per harmonic at the softest, %.1f at the loudest",
                  slope[0], slope[1]);
    EXPECT(slope[0] < -9.0 && slope[1] > -3.0, label);
    MEASURED("%s", label);
  }
  // Inside one note: a swell is brighter at its peak than at a tenth of its
  // level, on the way up and on the way down.
  for (float hz : {110.0f, 220.0f}) {
    device.init(kRate);
    device.set_param(p::kSection, 0.0f);
    device.set_param(p::kBreath, 0.0f);
    device.set_param(p::kAttack, 2.0f);
    device.set_param(p::kRelease, 2.0f);
    device.note_on(1, hz, 0.8f);
    Stereo out = render(device, 2.6f, kRate);
    device.note_off(1);
    out = concat(out, render(device, 2.0f, kRate));
    const size_t window = static_cast<size_t>(0.06f * kRate);
    const size_t top = static_cast<size_t>(2.4f * kRate);
    const double full = rms(out.left, top, top + window);
    const double bright = centroid(out.left, hz, top, top + window);
    // The first window on the way up, and the first on the way down, at a
    // tenth of the level.
    double rising = 0.0, falling = 0.0;
    for (size_t at = 0; at + window < top; at += window / 4) {
      if (rms(out.left, at, at + window) >= 0.1 * full) {
        rising = centroid(out.left, hz, at, at + window);
        break;
      }
    }
    for (size_t at = static_cast<size_t>(2.6f * kRate); at + window < out.size(); at += window / 4) {
      if (rms(out.left, at, at + window) <= 0.1 * full) {
        falling = centroid(out.left, hz, at, at + window);
        break;
      }
    }
    std::snprintf(label, sizeof label,
                  "the default swell at %.0f Hz: centroid %.0f Hz at its peak, %.0f Hz at a tenth rising, %.0f Hz falling",
                  hz, bright, rising, falling);
    EXPECT(rising > 0.0 && falling > 0.0 && bright > 1.8 * rising && bright > 1.8 * falling, label);
    MEASURED("%s", label);
  }
  // The highs arrive after the lows: harmonics 5 to 8 reach half their
  // steady level well after the fundamental does, by about twice the lag
  // the type's lips have (an envelope alone would put them 15 to 35 ms
  // behind). And they leave first: on a short release they are half gone
  // while the fundamental still stands.
  {
    const int types[2] = {kFrenchHorn, kTrumpet};
    const double behind[2] = {0.060, 0.025};
    const double ahead[2] = {0.004, 0.015};
    for (int which = 0; which < 2; ++which) {
      const int type = types[which];
      solo(device, type);
      device.set_param(p::kRelease, 0.1f);
      device.note_on(1, 220.0f, 1.0f);
      Stereo out = render(device, 1.0f, kRate);
      device.note_off(1);
      Stereo tail = render(device, 0.5f, kRate);
      const size_t window = static_cast<size_t>(0.02f * kRate);
      const double low_steady = tone_level(out.left, 220.0, kRate, kSecond / 2, kSecond / 2 + window);
      const double high_steady = band(out.left, 220.0, 1000.0, 1800.0, kSecond / 2, kSecond / 2 + window);
      double low_at = -1.0, high_at = -1.0;
      for (size_t at = 0; at + window < kSecond / 2; at += 48) {
        const double seconds = static_cast<double>(at + window / 2) / kRate;
        if (low_at < 0.0 && tone_level(out.left, 220.0, kRate, at, at + window) >= 0.5 * low_steady) low_at = seconds;
        if (high_at < 0.0 && band(out.left, 220.0, 1000.0, 1800.0, at, at + window) >= 0.5 * high_steady) high_at = seconds;
        if (low_at >= 0.0 && high_at >= 0.0) break;
      }
      std::snprintf(label, sizeof label, "%s: the fundamental is half way at %.0f ms, harmonics 5 to 8 at %.0f ms",
                    kTypeNames[type], low_at * 1000.0, high_at * 1000.0);
      EXPECT(low_at >= 0.0 && high_at >= low_at + behind[which], label);
      MEASURED("%s", label);

      double low_gone = -1.0, high_gone = -1.0;
      for (size_t at = 0; at + window < tail.size(); at += 48) {
        const double seconds = static_cast<double>(at + window / 2) / kRate;
        if (low_gone < 0.0 && tone_level(tail.left, 220.0, kRate, at, at + window) <= 0.5 * low_steady) low_gone = seconds;
        if (high_gone < 0.0 && band(tail.left, 220.0, 1000.0, 1800.0, at, at + window) <= 0.5 * high_steady) high_gone = seconds;
        if (low_gone >= 0.0 && high_gone >= 0.0) break;
      }
      std::snprintf(label, sizeof label, "%s released: harmonics 5 to 8 are half gone at %.0f ms, the fundamental at %.0f ms",
                    kTypeNames[type], high_gone * 1000.0, low_gone * 1000.0);
      EXPECT(high_gone >= 0.0 && low_gone >= high_gone + ahead[which], label);
      MEASURED("%s", label);
    }
  }
  // The colour of a held note does not stand still: the pressure wanders.
  {
    solo(device, kFrenchHorn);
    device.set_param(p::kBlow, 0.6f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 9.0f, kRate);
    double lowest = 1.0e9, highest = 0.0;
    for (size_t at = kSecond; at + kSecond / 5 <= out.size(); at += kSecond / 5) {
      const double here = centroid(out.left, 220.0, at, at + kSecond / 5);
      lowest = std::min(lowest, here);
      highest = std::max(highest, here);
    }
    std::snprintf(label, sizeof label, "a held note's centroid wanders between %.0f and %.0f Hz", lowest, highest);
    EXPECT(highest > 1.015 * lowest && highest < 1.15 * lowest, label);
    MEASURED("%s", label);
  }

  // --- the bell (R2) -------------------------------------------------------------------------

  // The formant stays put: play a chromatic octave low in each type's range
  // and the octave two octaves above, hard, and take the strongest partial
  // of every note. A bell fixed in hertz keeps the middle of them in one
  // place; a tone that only followed the key would move it two octaves, and
  // a series with no bell would put it on the fundamental.
  {
    const float lowest[kTypes] = {65.41f, 164.81f, 164.81f, 164.81f, 43.65f};
    const double band_lo[kTypes] = {250.0, 600.0, 1000.0, 1500.0, 350.0};
    const double band_hi[kTypes] = {500.0, 1100.0, 1600.0, 2600.0, 650.0};
    for (int type = 0; type < kTypes; ++type) {
      double middle[2];
      for (int octave = 0; octave < 2; ++octave) {
        std::vector<double> tops;
        for (int n = 0; n < 12; ++n) {
          const float hz = lowest[type] * std::pow(2.0f, 2.0f * octave + n / 12.0f);
          solo(device, type);
          device.note_on(1, hz, 1.0f);
          Stereo out = render(device, 0.8f, kRate);
          tops.push_back(strongest_partial(out.left, hz, kSecond * 2 / 5, kSecond * 4 / 5));
        }
        std::sort(tops.begin(), tops.end());
        middle[octave] = std::sqrt(tops[5] * tops[6]);
      }
      const double moved = std::fabs(std::log2(middle[1] / middle[0]));
      std::snprintf(label, sizeof label,
                    "%s: the formant is at %.0f Hz low in its range and %.0f Hz two octaves up (%.2f octave apart)",
                    kTypeNames[type], middle[0], middle[1], moved);
      EXPECT(middle[0] > band_lo[type] && middle[0] < band_hi[type] && middle[1] > band_lo[type] &&
                 middle[1] < band_hi[type] && moved < 1.0 / 3.0,
             label);
      MEASURED("%s", label);
    }
  }

  // The mute: thin and nasal, with almost nothing below 600 Hz, soft or loud.
  for (float blow : {0.0f, 1.0f}) {
    double worst = 1.0e9;
    for (float hz : {164.81f, 220.0f, 329.63f, 440.0f, 587.33f}) {
      solo(device, kMutedTrumpet);
      device.set_param(p::kBlow, blow);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 0.8f, kRate);
      const double lows = band(out.left, hz, 0.0, 600.0, kSecond * 2 / 5, kSecond * 4 / 5);
      const double nasal = band(out.left, hz, 1500.0, 3000.0, kSecond * 2 / 5, kSecond * 4 / 5);
      worst = std::min(worst, db(nasal) - db(lows));
    }
    std::snprintf(label, sizeof label, "the mute at Blow %.0f: 1.5 to 3 kHz stands %.1f dB over everything below 600 Hz",
                  blow, worst);
    EXPECT(worst > 15.0, label);
    MEASURED("%s", label);
  }
  // ... and the open trumpet does not: the same notes keep their low end.
  {
    solo(device, kTrumpet);
    device.set_param(p::kBlow, 0.5f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 0.8f, kRate);
    const double lows = band(out.left, 220.0, 0.0, 600.0, kSecond * 2 / 5, kSecond * 4 / 5);
    const double nasal = band(out.left, 220.0, 1500.0, 3000.0, kSecond * 2 / 5, kSecond * 4 / 5);
    EXPECT(db(lows) > db(nasal), "the open trumpet keeps its low end");
  }

  // --- the players (R3, R4) ------------------------------------------------------------------

  // Lip settle: a player comes in flat and closes in on the note.
  for (float hz : {440.0f, 880.0f}) {
    solo(device, kTrumpet);
    device.note_on(1, hz, 1.0f);
    Stereo out = render(device, 0.5f, kRate);
    const std::vector<float> track = pitch_track(out.left, hz);
    const size_t first = static_cast<size_t>(4000.0 / hz) + 2;  // the tracker's own start-up, ms
    double flattest = 0.0, late = 0.0;
    for (size_t ms = first; ms < 40; ++ms) flattest = std::min(flattest, static_cast<double>(track[ms]));
    for (size_t ms = 100; ms < 400; ++ms) late = std::max(late, std::fabs(static_cast<double>(track[ms])));
    std::snprintf(label, sizeof label, "at %.0f Hz a player starts %.1f cents flat and is within %.2f cents after 100 ms",
                  hz, -flattest, late);
    EXPECT(flattest < -10.0 && flattest > -40.0 && late < 3.0, label);
    MEASURED("%s", label);
  }

  // One player is steady and in the centre; a section beats, spreads across
  // the image, comes in over a few more milliseconds, and is no louder.
  {
    solo(device, kFrenchHorn);
    device.set_param(p::kBlow, 0.5f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo one = render(device, 8.0f, kRate);
    double lo, hi;
    level_range(one.left, 220.0, kSecond, kSecond / 4, &lo, &hi);
    std::snprintf(label, sizeof label, "one player: the fundamental swings %.2f dB", db(hi / lo));
    EXPECT(db(hi / lo) < 0.5, label);
    MEASURED("%s", label);
    EXPECT(one.left == one.right, "one player sits in the centre: left and right are the same");

    solo(device, kFrenchHorn);
    device.set_param(p::kBlow, 0.5f);
    device.set_param(p::kSection, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo four = render(device, 8.0f, kRate);
    const std::vector<float> centre = mid(four);
    level_range(centre, 220.0, kSecond, kSecond / 4, &lo, &hi);
    const double across = correlation(four.left, four.right, kSecond);
    std::snprintf(label, sizeof label, "a section of four: the fundamental swings %.1f dB, left and right correlate %.2f",
                  db(hi / lo), across);
    EXPECT(db(hi / lo) > 2.0 && across < 0.9, label);
    MEASURED("%s", label);

    // Power, both channels, against the one player's.
    const double one_power = rms(one.left, kSecond) * rms(one.left, kSecond) + rms(one.right, kSecond) * rms(one.right, kSecond);
    const double four_power = rms(four.left, kSecond) * rms(four.left, kSecond) + rms(four.right, kSecond) * rms(four.right, kSecond);
    std::snprintf(label, sizeof label, "a section of four is %.1f dB against one player", 0.5 * db(four_power / one_power));
    EXPECT(std::fabs(0.5 * db(four_power / one_power)) < 3.0, label);
    MEASURED("%s", label);

    // Mono compatibility (R13): what cancels when left and right are summed
    // is well under what stays.
    const std::vector<float> apart = side(four);
    const double fold = db(rms(centre, kSecond)) - db(rms(apart, kSecond));
    std::snprintf(label, sizeof label, "a section of four: the side signal is %.1f dB under the mid", fold);
    EXPECT(fold > 6.0, label);
    MEASURED("%s", label);

    // Entries: the last players are still arriving when one player would
    // have been at full level.
    const size_t early = static_cast<size_t>(0.012f * kRate), span = static_cast<size_t>(0.012f * kRate);
    const double one_early = rms(one.left, early, early + span) / rms(one.left, kSecond, 2 * kSecond);
    const double four_early = std::sqrt(rms(four.left, early, early + span) * rms(four.left, early, early + span) +
                                        rms(four.right, early, early + span) * rms(four.right, early, early + span)) /
                              std::sqrt(four_power);
    std::snprintf(label, sizeof label, "12 ms in, one player is at %.2f of its level and the section at %.2f of its own",
                  one_early, four_early * std::sqrt(2.0));
    EXPECT(four_early * std::sqrt(2.0) < 0.8 * one_early, label);
    MEASURED("%s", label);
  }

  // Sections alternate sides from note to note: with two and a half players
  // the odd one sits right on one note and left on the next.
  {
    device.init(kRate);
    device.set_param(p::kSection, 0.5f);
    device.set_param(p::kBreath, 0.0f);
    device.set_param(p::kAttack, 0.05f);
    device.set_param(p::kRelease, 0.05f);
    double lean[4];
    for (int n = 0; n < 4; ++n) {
      device.note_on(n, 220.0f, 0.8f);
      Stereo out = render(device, 3.0f, kRate);
      device.note_off(n);
      render(device, 1.0f, kRate);
      lean[n] = db(rms(out.right, kSecond / 2) / rms(out.left, kSecond / 2));
    }
    std::snprintf(label, sizeof label, "four notes in turn lean %+.2f, %+.2f, %+.2f, %+.2f dB to the right", lean[0], lean[1],
                  lean[2], lean[3]);
    EXPECT(lean[0] > 0.2 && lean[1] < -0.2 && lean[2] > 0.2 && lean[3] < -0.2, label);
    MEASURED("%s", label);
  }

  // --- the harmony voice (R6) ----------------------------------------------------------------

  // A second series a fifth above or a fourth below, as loud under the bell
  // as the note itself at the knob's ends, and gone at centre.
  {
    const double f0 = 220.0, fifth = 220.0 * 1.4983071, fourth = 220.0 * 0.7491535;
    const size_t from = kSecond / 2, to = kSecond;
    for (float harmony : {1.0f, -1.0f}) {
      solo(device, kTrumpet);
      device.set_param(p::kBlow, 0.5f);
      device.set_param(p::kHarmony, harmony);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 1.0f, kRate);
      const double at = harmony > 0.0f ? fifth : fourth;
      // The first and third partials of the copy fall between the note's own.
      const double note = db(tone_level(out.left, f0, kRate, from, to) / bell_gain(kTrumpet, f0));
      const double copy = db(tone_level(out.left, at, kRate, from, to) / bell_gain(kTrumpet, at));
      const double note_fifth = db(tone_level(out.left, 5.0 * f0, kRate, from, to) / bell_gain(kTrumpet, 5.0 * f0));
      const double copy_third = db(tone_level(out.left, 3.0 * at, kRate, from, to) / bell_gain(kTrumpet, 3.0 * at));
      // The fourth below is not there when the fifth above is asked for.
      // (The other way round says nothing: the fifth above is the second
      // partial of the fourth below.)
      const double absent = harmony > 0.0f ? db(tone_level(out.left, fourth, kRate, from, to)) -
                                                 db(tone_level(out.left, f0, kRate, from, to))
                                           : -200.0;
      std::snprintf(label, sizeof label,
                    "Harmony %+.0f: a series at %.1f Hz stands %.2f dB from the note's, with partials of its own (third %.1f dB under its first; the note's fifth is %.1f under its first)",
                    harmony, at, copy - note, copy - copy_third, note - note_fifth);
      EXPECT(std::fabs(copy - note) < 3.0 && copy - copy_third < 40.0 && absent < -70.0, label);
      MEASURED("%s", label);
    }
    solo(device, kTrumpet);
    device.set_param(p::kBlow, 0.5f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    const double note = tone_level(out.left, f0, kRate, from, to);
    const double stray = std::max(tone_level(out.left, fifth, kRate, from, to), tone_level(out.left, fourth, kRate, from, to));
    std::snprintf(label, sizeof label, "Harmony at centre: nothing at either interval (%.0f dB)", db(stray / note));
    EXPECT(db(stray / note) < -70.0, label);
    MEASURED("%s", label);
    // Half way the copy is half as strong.
    solo(device, kTrumpet);
    device.set_param(p::kBlow, 0.5f);
    device.set_param(p::kHarmony, 0.5f);
    device.note_on(1, 220.0f, 0.8f);
    out = render(device, 1.0f, kRate);
    const double half = db(tone_level(out.left, fifth, kRate, from, to) / bell_gain(kTrumpet, fifth)) -
                        db(tone_level(out.left, f0, kRate, from, to) / bell_gain(kTrumpet, f0));
    EXPECT_NEAR(half, -6.0, 1.5, "Harmony at a half puts the copy 6 dB under the note");
  }

  // --- breath (R5) ---------------------------------------------------------------------------

  {
    const double f0 = 220.0;
    Stereo out[2];
    int which = 0;
    for (float breath : {0.0f, 1.0f}) {
      solo(device, kTrumpet);
      device.set_param(p::kBlow, 0.0f);
      device.set_param(p::kBreath, breath);
      device.note_on(1, 220.0f, 0.8f);
      out[which++] = render(device, 4.5f, kRate);
    }
    // Noise between the harmonics, where a tone has nothing; and more of it
    // on the harmonics the soft tone does not reach (the pipe's own peaks)
    // than half way between them.
    double valley[2] = {0.0, 0.0}, on_peak = 0.0;
    int count = 0;
    for (size_t from = kSecond / 2; from + kSecond / 4 <= out[0].size(); from += kSecond / 4) {
      for (int h = 5; h <= 8; ++h) {
        for (int b = 0; b < 2; ++b) {
          const double level = tone_level(out[b].left, (h + 0.5) * f0, kRate, from, from + kSecond / 4);
          valley[b] += level * level;
        }
        const double level = tone_level(out[1].left, h * f0, kRate, from, from + kSecond / 4);
        on_peak += level * level;
        ++count;
      }
    }
    const double tone = tone_level(out[1].left, f0, kRate, kSecond, 2 * kSecond);
    const double dry = db(std::sqrt(valley[0] / count) / tone), wet = db(std::sqrt(valley[1] / count) / tone);
    const double comb = 0.5 * db(on_peak / valley[1]);
    std::snprintf(label, sizeof label,
                  "between the harmonics: %.0f dB under the note without Breath, %.0f dB with it; the pipe's peaks stand %.1f dB over its valleys",
                  dry, wet, comb);
    EXPECT(dry < -80.0 && wet > -60.0 && comb > 6.0, label);
    MEASURED("%s", label);
    EXPECT(out[1].left == out[1].right, "breath sits in the centre");

    // The air pulses with the lips: the power of the noise above the tone
    // swells once a period, in step with the note. Take what lies above
    // 1 kHz (the soft tone has nothing there), square it, and look for the
    // note's own frequency in it against its neighbours.
    livemix::kit::Biquad high[2];
    high[0].set_highpass(1000.0f, 0.7071f, kRate);
    high[1].set_highpass(1000.0f, 0.7071f, kRate);
    std::vector<float> power(out[1].size());
    for (size_t i = 0; i < power.size(); ++i) {
      const float y = high[1].process(high[0].process(out[1].left[i]));
      power[i] = y * y;
    }
    const double pulse = tone_level(power, f0, kRate, kSecond / 2, power.size());
    double beside = 0.0;
    for (double off : {-9.0, -6.0, -3.0, 3.0, 6.0, 9.0}) {
      beside = std::max(beside, tone_level(power, f0 + off, kRate, kSecond / 2, power.size()));
    }
    const double depth = pulse / mean(power, kSecond / 2);
    std::snprintf(label, sizeof label, "the air pulses at the note: depth %.2f of its mean, %.1f dB over the frequencies beside it",
                  depth, db(pulse / beside));
    EXPECT(depth > 0.2 && db(pulse / beside) > 10.0, label);
    MEASURED("%s", label);

    // Beside the pipe's air there is hiss at the lips that the bell does
    // not cover: under the French horn, whose bell passes little above
    // 1.4 kHz, the noise from 6 to 9 kHz stays within 22 dB of the noise
    // from 300 Hz to 1 kHz (the pipe alone leaves it 28 dB under).
    solo(device, kFrenchHorn);
    device.set_param(p::kBlow, 0.0f);
    device.set_param(p::kBreath, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo airy = render(device, 2.0f, kRate);
    const std::vector<double> bins = spectrum(airy.left, kSecond);
    const double width = kRate / static_cast<double>(kSpectrum);
    auto density = [&](double lo, double hi) {
      double sum = 0.0;
      int count = 0;
      for (size_t k = static_cast<size_t>(lo / width); k < static_cast<size_t>(hi / width); ++k) {
        // Leave the note's own partials out.
        const double hz = static_cast<double>(k) * width;
        if (std::fabs(hz - std::round(hz / 220.0) * 220.0) < 20.0) continue;
        sum += bins[k] * bins[k];
        ++count;
      }
      return sum / count;
    };
    const double hiss = 10.0 * std::log10(density(6000.0, 9000.0) / density(300.0, 1000.0));
    std::snprintf(label, sizeof label, "French horn at Breath 1: the noise from 6 to 9 kHz is %.1f dB under the noise below 1 kHz", -hiss);
    EXPECT(hiss > -22.0 && hiss < -10.0, label);
    MEASURED("%s", label);
  }

  // --- vibrato (R7) --------------------------------------------------------------------------

  {
    solo(device, kTrumpet);
    device.set_param(p::kVibrato, 1.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 3.2f, kRate);
    const std::vector<float> track = pitch_track(out.left, 440.0);
    double early = 0.0, top = -1.0e9, bottom = 1.0e9;
    for (size_t ms = 120; ms < 250; ++ms) early = std::max(early, std::fabs(static_cast<double>(track[ms])));
    for (size_t ms = 1500; ms < 3000; ++ms) {
      top = std::max(top, static_cast<double>(track[ms]));
      bottom = std::min(bottom, static_cast<double>(track[ms]));
    }
    const double rate = dominant_frequency(track, 1000.0, 3.0, 9.0, 1500, 3000);
    std::snprintf(label, sizeof label,
                  "vibrato: within %.1f cents in the first quarter second, then %+.0f to %+.0f cents at %.2f Hz",
                  early, bottom, top, rate);
    EXPECT(early < 3.0 && top > 20.0 && bottom < -20.0 && std::fabs(top + bottom) < 6.0 && std::fabs(rate - 5.3) < 0.3, label);
    MEASURED("%s", label);

    solo(device, kTrumpet);
    device.note_on(1, 440.0f, 0.8f);
    out = render(device, 2.0f, kRate);
    const std::vector<float> still = pitch_track(out.left, 440.0);
    double wander = 0.0;
    for (size_t ms = 300; ms < 1900; ++ms) wander = std::max(wander, std::fabs(static_cast<double>(still[ms])));
    EXPECT(wander < 3.0, "without Vibrato a player holds the note");
  }

  // --- envelopes that take the time they say (R11) -------------------------------------------

  // Loudness follows the envelope whatever the colour does: on a bell that
  // keeps the fundamental in, an unlevelled series would come up late and
  // fall away several times too fast.
  for (int type : {kFrenchHorn, kTrumpet, kMutedTrumpet}) {
    const size_t window = static_cast<size_t>(0.03f * kRate);
    // Attack 1 s: the envelope is half way after a third of it (plus the
    // few periods the tube takes to speak).
    solo(device, type);
    device.set_param(p::kBlow, 0.6f);
    device.set_param(p::kAttack, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    const double steady = rms(out.left, static_cast<size_t>(1.6f * kRate), static_cast<size_t>(1.9f * kRate));
    double half_at = -1.0;
    for (size_t at = 0; at + window < out.size(); at += window / 6) {
      if (rms(out.left, at, at + window) >= 0.5 * steady) {
        half_at = static_cast<double>(at + window / 2) / kRate;
        break;
      }
    }
    // Release 3 s: 20 dB down after one second.
    solo(device, type);
    device.set_param(p::kBlow, 0.6f);
    device.set_param(p::kRelease, 3.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo held = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 5.5f, kRate);
    const double before = rms(held.left, held.size() - 4 * window, held.size());
    const double after = rms(tail.left, kSecond - 2 * window, kSecond + 2 * window);
    Stereo gone = render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label,
                  "%s: a 1 s attack is half way at %.2f s; a 3 s release is %.1f dB down after 1 s and ends in silence (%g)",
                  kTypeNames[type], half_at, db(before / after), peak(gone.left));
    EXPECT(half_at > 0.27 && half_at < 0.42 && std::fabs(db(before / after) - 20.0) < 4.0 && peak(gone.left) == 0.0 &&
               peak(gone.right) == 0.0,
           label);
    MEASURED("%s", label);
  }
  // Low notes speak later than high ones at the same Attack.
  {
    double half_at[2];
    int which = 0;
    for (float hz : {65.41f, 1046.5f}) {
      solo(device, kFrenchHorn);
      device.set_param(p::kBlow, 0.5f);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 0.6f, kRate);
      const size_t window = static_cast<size_t>(2.0f * kRate / hz) + 96;
      const double steady = rms(out.left, kSecond * 2 / 5, kSecond / 2);
      half_at[which] = -1.0;
      for (size_t at = 0; at + window < out.size(); at += 24) {
        if (rms(out.left, at, at + window) >= 0.5 * steady) {
          half_at[which] = static_cast<double>(at + window / 2) / kRate;
          break;
        }
      }
      ++which;
    }
    std::snprintf(label, sizeof label, "at the shortest Attack C2 is half way after %.0f ms and C6 after %.0f ms",
                  half_at[0] * 1000.0, half_at[1] * 1000.0);
    EXPECT(half_at[0] > half_at[1] + 0.02, label);
    MEASURED("%s", label);
  }

  // --- nothing that does not belong (R10) ----------------------------------------------------

  // The highest notes at the hardest blow, every type: what folds back from
  // above Nyquist stays 50 dB under the strongest partial.
  for (float rate : {44100.0f, 48000.0f}) {
    double worst = 1.0e9;
    int worst_type = 0;
    float worst_hz = 0.0f;
    for (int type = 0; type < kTypes; ++type) {
      for (float hz : {1046.5f, 1661.2f, 2093.0f}) {
        solo(device, type, rate);
        device.note_on(1, hz, 1.0f);
        Stereo out = render(device, 0.8f, rate);
        const double clean = stray_db(out.left, hz, rate, static_cast<size_t>(0.3f * rate));
        if (clean < worst) {
          worst = clean;
          worst_type = type;
          worst_hz = hz;
        }
      }
    }
    std::snprintf(label, sizeof label, "at %.0f Hz the dirtiest high note (%s, %.0f Hz) keeps stray energy %.0f dB down",
                  rate, kTypeNames[worst_type], worst_hz, worst);
    EXPECT(worst > 50.0, label);
    MEASURED("%s", label);
  }
  // The harmony voice sits a fifth higher and has its own limit.
  {
    double worst = 1.0e9;
    for (int type = 0; type < kTypes; ++type) {
      for (float hz : {1046.5f, 2093.0f, 3135.96f}) {
        for (double interval : {1.4983071, 0.7491535}) {
          solo(device, type);
          device.set_param(p::kHarmony, interval > 1.0 ? 1.0f : -1.0f);
          device.note_on(1, hz, 1.0f);
          Stereo out = render(device, 0.8f, kRate);
          worst = std::min(worst, stray_db(out.left, hz, kRate, static_cast<size_t>(0.3f * kRate), hz * interval));
        }
      }
    }
    std::snprintf(label, sizeof label, "with Harmony at either end the dirtiest high note keeps stray energy %.0f dB down", worst);
    EXPECT(worst > 60.0, label);
    MEASURED("%s", label);
  }

  // --- levels (R11) --------------------------------------------------------------------------

  // The default patch: one note at the gains the app uses, across the range.
  {
    double lo7 = 1.0e9, hi7 = -1.0e9, lo8 = 1.0e9, hi8 = -1.0e9;
    for (float hz : {65.41f, 130.81f, 261.63f, 523.25f, 1046.5f}) {
      for (float gain : {0.7f, 0.8f}) {
        device.init(kRate);
        device.note_on(1, hz, gain);
        Stereo out = render(device, 8.0f, kRate);
        const double level = db(std::max(peak(out.left), peak(out.right)));
        (gain < 0.75f ? lo7 : lo8) = std::min(gain < 0.75f ? lo7 : lo8, level);
        (gain < 0.75f ? hi7 : hi8) = std::max(gain < 0.75f ? hi7 : hi8, level);
      }
    }
    std::snprintf(label, sizeof label,
                  "the default patch from C2 to C6 peaks between %.1f and %.1f dBFS at gain 0.7, %.1f and %.1f at gain 0.8",
                  lo7, hi7, lo8, hi8);
    EXPECT(lo7 > -24.0 && hi7 < -10.0 && lo8 > -22.0 && hi8 < -16.0, label);
    MEASURED("%s", label);

    // Ten keys struck and held (eight sound) stay under the soft clip's knee.
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo out = render(device, 10.0f, kRate);
    const double chord = std::max(peak(out.left), peak(out.right));
    std::snprintf(label, sizeof label, "ten held keys peak at %.2f", chord);
    EXPECT(chord < 0.5, label);
    MEASURED("%s", label);

    // Every type is as loud as every other, on any key and at any Blow:
    // the knobs change the colour, velocity changes the level.
    // The harmony voice shares the note's power rather than adding to it.
    double quietest = 1.0e9, loudest = -1.0e9;
    for (int type = 0; type < kTypes; ++type) {
      for (float hz : {65.41f, 130.81f, 261.63f, 523.25f, 1046.5f}) {
        for (float blow : {0.1f, 0.6f, 1.0f}) {
          for (float harmony : {0.0f, -1.0f, 0.5f, 1.0f}) {
            if (harmony != 0.0f && blow != 0.6f) continue;
            solo(device, type);
            device.set_param(p::kBlow, blow);
            device.set_param(p::kHarmony, harmony);
            device.set_param(p::kVolume, p::kParamDefault[p::kVolume]);
            device.note_on(1, hz, 0.8f);
            Stereo out = render(device, 1.0f, kRate);
            const double level = db(rms(out.left, kSecond / 2));
            quietest = std::min(quietest, level);
            loudest = std::max(loudest, level);
          }
        }
      }
    }
    std::snprintf(label, sizeof label,
                  "across five types, C2 to C6, three Blows and Harmony off and on a note's level runs from %.1f to %.1f dBFS RMS",
                  quietest, loudest);
    EXPECT(loudest - quietest < 2.5, label);
    MEASURED("%s", label);

    solo(device, kFrenchHorn);
    device.note_on(1, 220.0f, 1.0f);
    Stereo loud = render(device, 0.6f, kRate);
    solo(device, kFrenchHorn);
    device.note_on(1, 220.0f, 0.1f);
    Stereo soft = render(device, 0.6f, kRate);
    EXPECT(rms(soft.left, kSecond / 4) < 0.5 * rms(loud.left, kSecond / 4), "soft keys are quieter");

    // The soft clip is last: eight hard notes with the volume all the way
    // up would reach twice full scale without it.
    solo(device, kTrumpet);
    device.set_param(p::kVolume, 6.0f);
    device.set_param(p::kSection, 1.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, 220.0f * std::pow(2.0f, n * 2 / 12.0f), 1.0f);
    Stereo hot = render(device, 3.0f, kRate);
    std::snprintf(label, sizeof label, "eight hard notes at +6 dB peak at %.3f", std::max(peak(hot.left), peak(hot.right)));
    EXPECT(std::max(peak(hot.left), peak(hot.right)) <= 1.0 && rms(hot.left, kSecond) > 0.3, label);
    MEASURED("%s", label);

    // A key outside the range plays the nearest note the instrument has.
    auto apart = [&](float asked, float nearest, float rate) {
      solo(device, kLowBrass, rate);
      device.note_on(1, asked, 0.8f);
      Stereo a = render(device, 0.3f, rate);
      solo(device, kLowBrass, rate);
      device.note_on(1, nearest, 0.8f);
      Stereo b = render(device, 0.3f, rate);
      double worst = 0.0;
      for (size_t i = 0; i < a.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
      return peak(b.left) > 0.01 ? worst : 1.0;
    };
    EXPECT(apart(3.0f, Horns::kMinHz, kRate) == 0.0, "a key below the range plays the lowest note");
    EXPECT(apart(30000.0f, Horns::kMaxHz, kRate) == 0.0, "a key above the range plays the highest note");
    EXPECT(apart(30000.0f, 0.2f * 22050.0f, 22050.0f) == 0.0, "at a low sample rate the highest note is a fifth of the rate");
  }

  // --- no clicks (R12) -----------------------------------------------------------------------

  // Each event is held against the steady sound around it: the largest
  // sample-to-sample step while it happens stays near the largest step the
  // sound makes anyway.
  {
    const size_t tenth = kSecond / 10;
    // A ninth key steals a voice (2 ms fade, then the new note). A chord of
    // beating players makes larger and smaller steps as it goes, so the
    // steal is held against the largest in the two seconds before it.
    device.init(kRate);
    device.set_param(p::kAttack, 0.02f);
    device.set_param(p::kRelease, 0.3f);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo chord = render(device, 3.0f, kRate);
    const double chord_step = max_step(chord.left, kSecond);
    device.note_on(8, 466.16f, 0.8f);
    Stereo stolen = render(device, 0.5f, kRate);
    const size_t steal = kSecond / 50;
    std::snprintf(label, sizeof label, "stealing a voice: step %.4f against %.4f for the chord", max_step(stolen.left, 0, steal),
                  chord_step);
    EXPECT(max_step(stolen.left, 0, steal) < 1.2 * chord_step && max_step(stolen.right, 0, steal) < 1.2 * max_step(chord.right, kSecond),
           label);
    MEASURED("%s", label);
    EXPECT(tone_level(stolen.left, 466.16, kRate, 2 * tenth, 5 * tenth) > 0.3 * tone_level(chord.left, 110.0, kRate, chord.size() - 3 * tenth, chord.size()),
           "the stealing note sounds");
    EXPECT(tone_level(stolen.left, 110.0, kRate, 2 * tenth, 5 * tenth) < 0.01 * tone_level(chord.left, 110.0, kRate, chord.size() - 3 * tenth, chord.size()),
           "the stolen note is gone");

    // The same with soft low notes, which are nearly pure: a voice cut
    // short would stand out of them. Eight steals, each at another moment
    // of the stolen note's period, against the chord before them.
    double steal_step = 0.0, steal_kink = 0.0;
    for (int trial = 0; trial < 8; ++trial) {
      solo(device, kFrenchHorn);
      device.set_param(p::kBlow, 0.0f);
      device.set_param(p::kRelease, 0.3f);
      for (int n = 0; n < 8; ++n) device.note_on(n, 82.41f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
      Stereo low = render(device, 1.0f + 0.0137f * static_cast<float>(trial), kRate);
      device.note_on(8, 233.08f, 0.8f);
      Stereo taken = render(device, 0.3f, kRate);
      const size_t before = low.size() - 5 * tenth;
      steal_step = std::max(steal_step, max_step(taken.left, 0, kSecond / 100) / max_step(low.left, before));
      steal_kink = std::max(steal_kink, kink(taken.left, 0, kSecond / 100) / kink(low.left, before));
    }
    std::snprintf(label, sizeof label, "stealing from soft low notes: step %.2f and third difference %.1f times the chord's",
                  steal_step, steal_kink);
    EXPECT(steal_step < 1.2 && steal_kink < 10.0, label);
    MEASURED("%s", label);

    // A ninth key struck and let go at once, while the voice it took is
    // still fading: it never sounds, and nothing is left hanging.
    solo(device, kFrenchHorn);
    device.set_param(p::kRelease, 0.1f);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo full = render(device, 0.5f, kRate);
    device.note_on(8, 493.88f, 0.8f);
    device.note_off(8);
    Stereo passed = render(device, 0.5f, kRate);
    for (int n = 0; n < 8; ++n) device.note_off(n);
    Stereo rest = render(device, 2.0f, kRate);
    EXPECT(tone_level(passed.left, 493.88, kRate, tenth, 5 * tenth) < 0.01 * tone_level(full.left, 110.0, kRate, 2 * tenth, 5 * tenth),
           "a key released while its voice was being taken never sounds");
    EXPECT(peak(rest.left, kSecond) == 0.0 && peak(rest.right, kSecond) == 0.0, "... and leaves no note hanging");

    // The same key again while it is held, then released.
    device.init(kRate);
    device.set_param(p::kAttack, 0.02f);
    device.set_param(p::kRelease, 0.05f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo held = render(device, 1.5f, kRate);
    const double held_step = max_step(held.left, held.size() - 4 * tenth);
    device.note_on(1, 220.0f, 0.8f);
    Stereo again = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo off = render(device, 0.3f, kRate);
    std::snprintf(label, sizeof label, "striking a held key: step %.4f, releasing it: %.4f, against %.4f held",
                  max_step(again.left, 0, 2 * tenth), max_step(off.left), held_step);
    EXPECT(max_step(again.left, 0, 2 * tenth) < 2.0 * held_step && max_step(off.left) < 1.2 * max_step(again.left, 5 * tenth), label);
    MEASURED("%s", label);

    // The old voice of a key struck again goes in 30 ms: under a slow
    // attack the sound dips to the new note's beginning, it does not carry
    // the old note along for the length of Release.
    solo(device, kFrenchHorn);
    device.set_param(p::kAttack, 2.0f);
    device.set_param(p::kRelease, 4.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo first = render(device, 4.0f, kRate);
    device.note_on(1, 220.0f, 0.8f);
    Stereo second = render(device, 4.0f, kRate);
    const double dip = db(rms(second.left, tenth, 2 * tenth) / rms(first.left, 35 * tenth));
    const double back = db(rms(second.left, 35 * tenth) / rms(first.left, 35 * tenth));
    std::snprintf(label, sizeof label, "a key struck again under a 2 s attack: %.1f dB a tenth of a second later, %.1f dB once it has swelled",
                  dip, back);
    EXPECT(dip < -10.0 && std::fabs(back) < 1.0, label);
    MEASURED("%s", label);

    // Blow swept from nothing to everything under a held note.
    solo(device, kFrenchHorn);
    device.set_param(p::kBlow, 0.0f);
    device.set_param(p::kSection, 0.6f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.5f, kRate);
    Stereo sweep;
    for (int step = 1; step <= 40; ++step) {
      device.set_param(p::kBlow, static_cast<float>(step) / 40.0f);
      sweep = concat(sweep, render(device, 0.01f, kRate));
    }
    Stereo blown = render(device, 1.0f, kRate);
    std::snprintf(label, sizeof label, "sweeping Blow: step %.4f against %.4f at full Blow", max_step(sweep.left),
                  max_step(blown.left, 5 * tenth));
    EXPECT(max_step(sweep.left) < 1.5 * max_step(blown.left, 5 * tenth), label);
    MEASURED("%s", label);

    // Blow dropped at once under a low muted note, where the levelling
    // moves furthest: the third difference stays near the steady sound's.
    solo(device, kMutedTrumpet);
    device.note_on(1, 110.0f, 0.8f);
    Stereo hard = render(device, 0.5f, kRate);
    device.set_param(p::kBlow, 0.0f);
    Stereo drop = render(device, 0.1f, kRate);
    Stereo gentle = render(device, 0.5f, kRate);
    const double level_kink = kink(drop.left) / std::max(kink(hard.left, 3 * tenth), kink(gentle.left, 3 * tenth));
    std::snprintf(label, sizeof label, "dropping Blow under a muted note: third difference %.2f of the steady sound's", level_kink);
    EXPECT(level_kink < 2.0, label);
    MEASURED("%s", label);

    // Type switched under a held note: every pair in turn.
    {
      double worst = 0.0, worst_kink = 0.0;
      for (int from = 0; from < kTypes; ++from) {
        const int to = (from + 2) % kTypes;
        solo(device, from);
        device.set_param(p::kBlow, 0.6f);
        device.set_param(p::kSection, 0.6f);
        device.note_on(1, 220.0f, 0.8f);
        Stereo before = render(device, 1.0f, kRate);
        device.set_param(p::kType, static_cast<float>(to));
        Stereo during = render(device, 0.15f, kRate);
        Stereo after = render(device, 1.0f, kRate);
        const double around = std::max(max_step(before.left, 5 * tenth), max_step(after.left, 5 * tenth));
        worst = std::max(worst, max_step(during.left) / around);
        worst_kink = std::max(worst_kink, kink(during.left) / std::max(kink(before.left, 5 * tenth), kink(after.left, 5 * tenth)));
        // ... and it has become the other instrument, at its own level.
        solo(device, to);
        device.set_param(p::kBlow, 0.6f);
        device.set_param(p::kSection, 0.6f);
        device.note_on(1, 220.0f, 0.8f);
        Stereo fresh = render(device, 2.0f, kRate);
        const double there = centroid(after.left, 220.0, 5 * tenth, 10 * tenth);
        const double wanted = centroid(fresh.left, 220.0, 15 * tenth, 20 * tenth);
        std::snprintf(label, sizeof label, "%s to %s under a held note: centroid %.0f Hz, a fresh note's is %.0f Hz",
                      kTypeNames[from], kTypeNames[to], there, wanted);
        EXPECT(std::fabs(std::log2(there / wanted)) < 0.15 &&
                   std::fabs(db(rms(after.left, 5 * tenth) / rms(fresh.left, 15 * tenth))) < 2.0,
               label);
        MEASURED("%s", label);
      }
      std::snprintf(label, sizeof label, "switching Type: the largest step is %.2f of the steady sound's, the third difference %.2f",
                    worst, worst_kink);
      EXPECT(worst < 1.5 && worst_kink < 3.0, label);
      MEASURED("%s", label);
    }

    // Harmony taken through centre, where the interval changes.
    solo(device, kTrumpet);
    device.set_param(p::kBlow, 0.6f);
    device.set_param(p::kHarmony, -1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo below = render(device, 1.0f, kRate);
    device.set_param(p::kHarmony, 1.0f);
    Stereo flip = render(device, 0.1f, kRate);
    Stereo above = render(device, 1.0f, kRate);
    const double around = std::max(max_step(below.left, 5 * tenth), max_step(above.left, 5 * tenth));
    std::snprintf(label, sizeof label, "flipping Harmony: step %.4f against %.4f around it", max_step(flip.left), around);
    EXPECT(max_step(flip.left) < 1.5 * around, label);
    MEASURED("%s", label);
    EXPECT(tone_level(above.left, 220.0 * 1.4983071, kRate, 5 * tenth, 10 * tenth) > 100.0 * tone_level(above.left, 220.0 * 0.7491535, kRate, 5 * tenth, 10 * tenth),
           "after the flip the copy is a fifth above");

    // Section and Breath brought in under a held note: neither makes a
    // step larger than the sound it leads to.
    solo(device, kFrenchHorn);
    device.set_param(p::kBlow, 0.6f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 1.0f, kRate);
    device.set_param(p::kSection, 1.0f);
    Stereo joining = render(device, 0.2f, kRate);
    Stereo joined = render(device, 2.0f, kRate);
    device.set_param(p::kBreath, 1.0f);
    Stereo airing = render(device, 0.05f, kRate);
    Stereo aired = render(device, 1.0f, kRate);
    std::snprintf(label, sizeof label,
                  "bringing in the section: step %.4f against %.4f once it is there; the breath: %.4f against %.4f",
                  max_step(joining.left), max_step(joined.left), max_step(airing.left), max_step(aired.left));
    EXPECT(max_step(joining.left) < 1.2 * max_step(joined.left) && max_step(airing.left) < 1.2 * max_step(aired.left), label);
    MEASURED("%s", label);

    // The section again under a soft low note, nearly a sine: players
    // brought in by steps on the control clock would show as a buzz.
    solo(device, kFrenchHorn);
    device.set_param(p::kBlow, 0.0f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo alone = render(device, 1.0f, kRate);
    device.set_param(p::kSection, 1.0f);
    Stereo entering = render(device, 0.2f, kRate);
    Stereo together = render(device, 2.0f, kRate);
    const double entry_kink = std::max(kink(entering.left), kink(entering.right)) /
                              std::max(kink(alone.left, 5 * tenth), std::max(kink(together.left), kink(together.right)));
    std::snprintf(label, sizeof label, "the section joining a soft low note: third difference %.2f of the steady sound's", entry_kink);
    EXPECT(entry_kink < 3.0, label);
    MEASURED("%s", label);
  }

  // --- block-size independence, across a sleep and a wake (R14) ------------------------------

  {
    Stereo takes[2];
    for (int take = 0; take < 2; ++take) {
      const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
      int which = 0;
      Stereo& all = takes[take];
      auto play = [&](size_t samples) {
        size_t done = 0;
        while (done < samples) {
          const int frames = static_cast<int>(
              std::min(static_cast<size_t>(take == 0 ? 128 : sizes[which++ % 8]), samples - done));
          device.process(frames);
          all.left.insert(all.left.end(), device.out_left(), device.out_left() + frames);
          all.right.insert(all.right.end(), device.out_right(), device.out_right() + frames);
          done += frames;
        }
      };
      device.init(kRate);
      device.set_param(p::kAttack, 0.05f);
      device.set_param(p::kRelease, 0.05f);
      device.set_param(p::kBreath, 0.5f);
      device.note_on(1, 220.0f, 0.8f);
      play(9000);
      device.set_param(p::kBlow, 0.9f);
      device.set_param(p::kType, static_cast<float>(kTrumpet));
      play(7000);
      device.set_param(p::kHarmony, 0.7f);
      device.set_param(p::kVibrato, 0.5f);
      device.note_on(2, 329.63f, 0.6f);
      play(12000);
      device.note_off(1);
      device.note_off(2);
      play(28800);  // rings out and falls asleep
      device.set_param(p::kSection, 1.0f);
      device.set_param(p::kType, static_cast<float>(kLowBrass));
      device.note_on(3, 146.83f, 0.9f);
      play(9000);
    }
    double worst = 0.0;
    for (size_t i = 0; i < takes[0].size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(takes[0].left[i]) - takes[1].left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(takes[0].right[i]) - takes[1].right[i]));
    }
    std::snprintf(label, sizeof label, "ragged blocks give the same audio as 128-frame blocks (max diff %g)", worst);
    EXPECT(worst < 1.0e-6 && peak(takes[0].left, takes[0].size() - 4000) > 1.0e-3, label);
    MEASURED("%s", label);
  }

  // --- cost ----------------------------------------------------------------------------------

  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  report_cost("horns (8 notes, default patch)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  // The worst case: four players and their harmony copies on every note,
  // with breath.
  device.init(kRate);
  device.set_param(p::kSection, 1.0f);
  device.set_param(p::kHarmony, 1.0f);
  device.set_param(p::kBreath, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  report_cost("horns (8 notes, four players, harmony, breath)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("horns");
}
