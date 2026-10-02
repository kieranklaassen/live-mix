// Native harness for Re-amp (cpp/devices/re-amp). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest measures the chain: the amplifier's distortion, sag and aliasing,
// each speaker's response and loudness, the microphone's distance and angle,
// the room's decay, the noise, and the latency.

#include "../devices/re-amp/re_amp.h"
#include "support/test_kit.h"

#include <cstdlib>

using namespace testkit;
using livemix::ReAmp;
namespace p = livemix::re_amp;

static ReAmp device;

// EXPECT, and with RE_AMP_VERBOSE set every label is printed with what was
// measured, which is how the numbers in the device's notes were read off.
static const bool kVerbose = std::getenv("RE_AMP_VERBOSE") != nullptr;
#define CHECK(condition, message)                                                  \
  do {                                                                             \
    const bool ok_ = (condition);                                                  \
    if (kVerbose) std::printf("  %s  %s\n", ok_ ? "ok  " : "FAIL", message);       \
    EXPECT(ok_, message);                                                          \
  } while (0)
#define CHECK_NEAR(actual, expected, tolerance, message)                                      \
  do {                                                                                        \
    const double a_ = static_cast<double>(actual);                                            \
    const double e_ = static_cast<double>(expected);                                          \
    char near_[240];                                                                          \
    std::snprintf(near_, sizeof near_, "%s (%.3f, expected %.3f within %.3f)", message, a_,   \
                  e_, static_cast<double>(tolerance));                                        \
    CHECK(std::fabs(a_ - e_) <= static_cast<double>(tolerance), near_);                       \
  } while (0)

static const float kRate = 48000.0f;
static const size_t kLatency = ReAmp::kLatency;
enum { kSmall = 0, kCombo = 1, kStack = 2, kHorn = 3, kFullRange = 4 };
static const char* const kSpeakerNames[5] = {"Small", "Combo", "Stack", "Horn", "Full range"};

// The microphone on the cone of the given speaker, the amplifier clean and
// quiet. Each check turns on the one thing it measures.
static void close_clean(int speaker, float rate = kRate) {
  device.init(rate);
  device.set_param(p::kSpeaker, static_cast<float>(speaker));
  device.set_param(p::kDrive, 0.0f);
  device.set_param(p::kDistance, 0.0f);
  device.set_param(p::kAngle, 0.0f);
  device.set_param(p::kNoise, 0.0f);
}

// Magnitude of an impulse response at `hz`.
static double response(const std::vector<float>& h, double hz, double rate = kRate) {
  double re = 0.0, im = 0.0;
  for (size_t i = 0; i < h.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    re += h[i] * std::cos(phase);
    im -= h[i] * std::sin(phase);
  }
  return std::sqrt(re * re + im * im);
}

// A small impulse through the wet path: small enough to stay in the linear
// part of the amplifier and the speaker. Returned at unit scale.
static std::vector<float> impulse_response(float rate = kRate, float seconds = 1.0f) {
  std::vector<float> h = run(device, impulse(seconds, rate, 0.01f)).left;
  for (float& v : h) v *= 100.0f;
  return h;
}

// Pink noise (Paul Kellet's filter) at a given RMS.
static std::vector<float> pink(float seconds, float rate, float level) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  double b[7] = {0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0};
  for (float& v : out) {
    const double w = white();
    b[0] = 0.99886 * b[0] + w * 0.0555179;
    b[1] = 0.99332 * b[1] + w * 0.0750759;
    b[2] = 0.96900 * b[2] + w * 0.1538520;
    b[3] = 0.86650 * b[3] + w * 0.3104856;
    b[4] = 0.55000 * b[4] + w * 0.5329522;
    b[5] = -0.7616 * b[5] - w * 0.0168980;
    v = static_cast<float>(b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362);
    b[6] = w * 0.115926;
  }
  const double scale = level / rms(out);
  for (float& v : out) v = static_cast<float>(v * scale);
  return out;
}

// Loudness weighting in the manner of ITU-R BS.1770: a +4 dB shelf above
// 1.7 kHz and a high-pass at 38 Hz.
static std::vector<float> weighted(const std::vector<float>& x, float rate = kRate) {
  livemix::kit::Biquad shelf, rumble;
  shelf.set_high_shelf(1682.0f, 4.0f, rate);
  rumble.set_highpass(38.1f, 0.5f, rate);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = rumble.process(shelf.process(x[i]));
  return out;
}

// The speaker's passband level (rms of the response, 500 Hz to 2 kHz) and the
// two frequencies where the response is 10 dB under it.
struct Band {
  double reference, low, high;
};
static Band band_of(const std::vector<float>& h, double rate = kRate) {
  Band band = {0.0, 0.0, 0.0};
  int count = 0;
  for (double hz = 500.0; hz <= 2000.0; hz *= 1.05, ++count) {
    const double level = response(h, hz, rate);
    band.reference += level * level;
  }
  band.reference = std::sqrt(band.reference / count);
  for (double hz = 15.0; hz < 0.47 * rate; hz *= 1.005) {
    if (response(h, hz, rate) > band.reference * 0.3162) {
      if (band.low == 0.0) band.low = hz;
      band.high = hz;
    }
  }
  return band;
}

// The strongest frequency in [lo, hi] and its level over the passband, in dB.
static void find_peak(const std::vector<float>& h, const Band& band, double lo, double hi, double* hz,
                      double* gain_db) {
  double best = 0.0, best_hz = lo;
  for (double f = lo; f <= hi; f *= 1.003) {
    const double level = response(h, f);
    if (level > best) {
      best = level;
      best_hz = f;
    }
  }
  *hz = best_hz;
  *gain_db = db(best / band.reference);
}

// Total harmonic distortion of a tone at `hz`, harmonics 2 to 9, in dB.
static double thd_db(const std::vector<float>& x, double hz, size_t from) {
  const double first = tone_level(x, hz, kRate, from);
  double sum = 0.0;
  for (int k = 2; k <= 9; ++k) {
    const double level = tone_level(x, hz * k, kRate, from);
    sum += level * level;
  }
  return db(std::sqrt(sum) / first);
}

int main() {
  Conformance spec;
  spec.name = "re-amp";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;  // a second of noise, its fade, and the room
  spec.max_peak = 4.5f;      // the limiter after Output holds 4
  check_effect(device, spec, kRate);

  // Latency: Mix 0 is the input delayed by exactly the reported count, and
  // the direct sound of the wet path arrives with it.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = noise(0.5f, kRate, 0.5f);
    Stereo out = run(device, in);
    double worst = 0.0;
    for (size_t i = kLatency; i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i - kLatency]));
    }
    CHECK(worst == 0.0, "Mix 0 is the input, delayed by the latency, bit for bit");
    CHECK(peak(out.left, 0, kLatency) == 0.0, "nothing before the latency");

    for (double hz : {300.0, 1000.0, 3000.0}) {
      close_clean(kFullRange);
      const std::vector<float> tone = sine(static_cast<float>(hz), 1.0f, kRate, 0.05f);
      Stereo wet = run(device, tone);
      double delay = (tone_phase(tone, hz, kRate, 24000, 48000) -
                      tone_phase(wet.left, hz, kRate, 24000, 48000)) /
                     (2.0 * kPi * hz) * kRate;
      const double period = kRate / hz;
      while (delay < kLatency - 0.5 * period) delay += period;
      while (delay > kLatency + 0.5 * period) delay -= period;
      CHECK_NEAR(delay, static_cast<double>(kLatency), 1.0, "the direct sound arrives on the latency");
    }

    // So half-way on Mix adds the two instead of combing them.
    close_clean(kFullRange);
    device.set_param(p::kMix, 0.5f);
    Stereo half = run(device, sine(1000.0f, 0.5f, kRate, 0.1f));
    CHECK_NEAR(db(tone_level(half.left, 1000.0, kRate, 12000) / 0.1), 0.0, 0.5,
                "Mix 0.5 through the flat speaker keeps a 1 kHz tone at its level");
  }

  // Each speaker's response with the microphone on the cone and the amplifier
  // clean: where it is 10 dB down at either end, and its own resonance.
  {
    struct Expected {
      int speaker;
      double low, high;        // -10 dB points, Hz
      double peak_lo, peak_hi; // where its resonance is looked for
      double peak_db;          // and the least it stands over the passband
    };
    const Expected expected[] = {
        {kSmall, 250.0, 4000.0, 450.0, 800.0, 1.5},   // the box
        {kCombo, 90.0, 5000.0, 2200.0, 2800.0, 3.0},  // the presence peak
        {kStack, 60.0, 5000.0, 95.0, 135.0, 4.0},     // the thump
        {kHorn, 400.0, 3500.0, 850.0, 1050.0, 3.0},   // the honk
    };
    char label[160];
    for (const Expected& e : expected) {
      close_clean(e.speaker);
      const std::vector<float> h = impulse_response();
      const Band band = band_of(h);
      std::snprintf(label, sizeof label, "%s: 10 dB down at %.0f Hz (measured %.0f)",
                    kSpeakerNames[e.speaker], e.low, band.low);
      CHECK(std::fabs(band.low - e.low) <= 0.15 * e.low, label);
      std::snprintf(label, sizeof label, "%s: 10 dB down at %.0f Hz (measured %.0f)",
                    kSpeakerNames[e.speaker], e.high, band.high);
      CHECK(std::fabs(band.high - e.high) <= 0.15 * e.high, label);
      double hz, gain;
      find_peak(h, band, e.peak_lo, e.peak_hi, &hz, &gain);
      std::snprintf(label, sizeof label, "%s: its resonance stands out (%.1f dB at %.0f Hz)",
                    kSpeakerNames[e.speaker], gain, hz);
      CHECK(gain >= e.peak_db && hz > e.peak_lo * 1.01 && hz < e.peak_hi * 0.99, label);
      // Steep above its range: an octave past the upper point is 20 dB further down.
      std::snprintf(label, sizeof label, "%s: steep roll-off above its range", kSpeakerNames[e.speaker]);
      CHECK(db(response(h, 2.0 * band.high) / band.reference) < -30.0, label);
    }
    // The monitor is there to be flat (the close microphone adds its 3 dB of
    // proximity at the bottom).
    close_clean(kFullRange);
    const std::vector<float> h = impulse_response();
    double lowest = 100.0, highest = -100.0;
    for (double hz = 40.0; hz <= 16000.0; hz *= 1.02) {
      const double level = db(response(h, hz) / response(h, 1000.0));
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    std::snprintf(label, sizeof label, "Full range: flat from 40 Hz to 16 kHz (%+.1f to %+.1f dB)", lowest,
                  highest);
    CHECK(lowest > -3.0 && highest < 3.5, label);
    CHECK_NEAR(db(response(h, 1000.0)), 0.0, 0.5, "Full range: unity gain at 1 kHz");

    // The same speaker at the other sample rates.
    for (float rate : {44100.0f, 96000.0f}) {
      close_clean(kCombo, rate);
      const Band band = band_of(impulse_response(rate), rate);
      std::snprintf(label, sizeof label, "Combo at %.0f Hz: the same band (%.0f to %.0f Hz)", rate, band.low,
                    band.high);
      CHECK(std::fabs(band.low - 90.0) <= 13.5 && std::fabs(band.high - 5000.0) <= 750.0, label);
    }
  }

  // The five speakers are as loud as each other on pink noise, and Drive
  // changes the texture, not the level.
  {
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = pink(6.0f, kRate, 0.125f);
    const double in_loudness = rms(weighted(in), 48000);
    double loudness[5], plain[5], mean_loudness = 0.0, mean_plain = 0.0;
    for (int s = 0; s < 5; ++s) {
      close_clean(s);
      device.set_param(p::kDrive, 0.25f);
      Stereo out = run(device, in);
      loudness[s] = db(rms(weighted(out.left), 48000) / in_loudness);
      plain[s] = db(rms(out.left, 48000) / rms(in, 48000));
      mean_loudness += loudness[s] / 5.0;
      mean_plain += plain[s] / 5.0;
    }
    char label[200];
    std::snprintf(label, sizeof label,
                  "speakers within 2 dB of their mean loudness on pink noise (%+.1f %+.1f %+.1f %+.1f %+.1f dB re input)",
                  loudness[0], loudness[1], loudness[2], loudness[3], loudness[4]);
    bool matched = true, matched_plain = true;
    for (int s = 0; s < 5; ++s) {
      matched = matched && std::fabs(loudness[s] - mean_loudness) < 2.0;
      matched_plain = matched_plain && std::fabs(plain[s] - mean_plain) < 2.0;
    }
    CHECK(matched, label);
    CHECK(matched_plain, "speakers within 2 dB of their mean level on pink noise, unweighted");
    CHECK(mean_loudness > -3.0 && mean_loudness < 1.0, "the speakers are about as loud as the input");

    double lowest = 100.0, highest = -100.0;
    for (float drive : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      close_clean(kCombo);
      device.set_param(p::kDrive, drive);
      Stereo out = run(device, in);
      const double level = db(rms(weighted(out.left), 48000) / in_loudness);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    std::snprintf(label, sizeof label, "Drive holds the loudness of pink noise (%+.1f to %+.1f dB)", lowest,
                  highest);
    CHECK(highest - lowest < 2.0, label);
  }

  // Drive: distortion rises all the way up the control, with even harmonics
  // as well as odd (the valve's bias).
  {
    double last = -200.0;
    bool rising = true;
    double clean = 0.0, pushed = 0.0, second = 0.0;
    for (float drive : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      close_clean(kFullRange);
      device.set_param(p::kDrive, drive);
      Stereo out = run(device, sine(220.0f, 1.0f, kRate, 0.25f));
      const double thd = thd_db(out.left, 220.0, 24000);
      rising = rising && thd > last + 2.0;
      last = thd;
      if (drive == 0.0f) clean = thd;
      if (drive == 1.0f) pushed = thd;
      if (drive == 0.5f) {
        second = db(tone_level(out.left, 440.0, kRate, 24000) / tone_level(out.left, 220.0, kRate, 24000));
      }
    }
    char label[160];
    std::snprintf(label, sizeof label, "THD rises with Drive (%.1f dB clean, %.1f dB flat out)", clean, pushed);
    CHECK(rising, label);
    CHECK(clean < -36.0, "Drive 0: a -12 dBFS tone is nearly clean");
    CHECK(pushed > -16.0, "Drive 1: heavy distortion");
    CHECK(second > -32.0, "the valve stage makes a second harmonic");
  }

  // No audible fold-back: a 5 kHz tone at 44.1 kHz through the flat speaker
  // with Drive flat out, at half scale and at full scale. Everything that is
  // not a harmonic of 5 kHz is an alias.
  {
    char label[160];
    const float cases[2][2] = {{1.0f, 0.5f}, {1.0f, 1.0f}};  // Drive, level
    for (const float* test : cases) {
      close_clean(kFullRange, 44100.0f);
      device.set_param(p::kDrive, test[0]);
      Stereo out = run(device, sine(5000.0f, 1.0f, 44100.0f, test[1]));
      double worst = 0.0, worst_hz = 0.0;
      for (double hz = 100.0; hz < 20000.0; hz += 100.0) {
        if (std::fmod(hz, 5000.0) == 0.0) continue;
        const double found = tone_level(out.left, hz, 44100.0, 22050);
        if (found > worst) {
          worst = found;
          worst_hz = hz;
        }
      }
      std::snprintf(label, sizeof label, "5 kHz at %.1f, Drive %.1f, 44.1 kHz: worst alias %.1f dBFS at %.0f Hz",
                    test[1], test[0], db(worst), worst_hz);
      CHECK(db(worst) < -75.0, label);
      CHECK(db(tone_level(out.left, 5000.0, 44100.0, 22050)) > -20.0, "the tone itself comes through");
    }
  }

  // Sag: hit hard, the amplifier gives over the first tenth of a second and
  // has recovered after a short rest. Clean, it does not move.
  {
    auto burst_levels = [&](float drive, double* start, double* settled, double* again) {
      close_clean(kFullRange);
      device.set_param(p::kDrive, drive);
      std::vector<float> in = silence(0.1f, kRate);
      const std::vector<float> tone = sine(330.0f, 0.5f, kRate, 0.8f);
      in.insert(in.end(), tone.begin(), tone.end());
      in.resize(in.size() + static_cast<size_t>(0.5f * kRate), 0.0f);
      in.insert(in.end(), tone.begin(), tone.end());
      Stereo out = run(device, in);
      const size_t first = 4800 + kLatency, next = first + 48000, cycle = 291;  // two periods of 330 Hz
      *start = db(rms(out.left, first + 2 * cycle, first + 4 * cycle));
      *settled = db(rms(out.left, first + 19200, first + 19200 + 4 * cycle));
      *again = db(rms(out.left, next + 2 * cycle, next + 4 * cycle));
    };
    double start, settled, again;
    burst_levels(0.8f, &start, &settled, &again);
    char label[160];
    std::snprintf(label, sizeof label, "sag: a hard burst starts %.2f dB over where it settles", start - settled);
    CHECK(start - settled > 0.6 && start - settled < 3.0, label);
    CHECK_NEAR(again, start, 0.25, "sag: recovered after half a second of rest");
    burst_levels(0.0f, &start, &settled, &again);
    CHECK(std::fabs(start - settled) < 0.5, "Drive 0: next to no sag");
  }

  // Bass and Treble are the amplifier's shelves.
  {
    auto gain_at = [&](int param, float value, double hz) {
      close_clean(kFullRange);
      const double flat = response(impulse_response(kRate, 0.5f), hz);
      close_clean(kFullRange);
      device.set_param(param, value);
      return db(response(impulse_response(kRate, 0.5f), hz) / flat);
    };
    CHECK_NEAR(gain_at(p::kBass, 1.0f, 60.0), 9.5, 1.5, "Bass up lifts the lows");
    CHECK_NEAR(gain_at(p::kBass, -1.0f, 60.0), -9.5, 1.5, "Bass down cuts the lows");
    CHECK_NEAR(gain_at(p::kBass, 1.0f, 2000.0), 0.0, 0.5, "Bass leaves the highs alone");
    CHECK_NEAR(gain_at(p::kTreble, 1.0f, 9000.0), 9.5, 1.5, "Treble up lifts the highs");
    CHECK_NEAR(gain_at(p::kTreble, -1.0f, 9000.0), -9.5, 1.5, "Treble down cuts the highs");
    CHECK_NEAR(gain_at(p::kTreble, 1.0f, 200.0), 0.0, 0.5, "Treble leaves the lows alone");
  }

  // The speaker's own breakup: lows the cone has to travel for modulate the
  // highs (sidebands at twice the low frequency either side of a high tone).
  // The little speaker does it most, the monitor hardly at all.
  {
    auto sidebands = [&](int speaker) {
      close_clean(speaker);
      std::vector<float> in = sine(80.0f, 1.0f, kRate, 0.3f);
      const std::vector<float> high = sine(2000.0f, 1.0f, kRate, 0.05f);
      for (size_t i = 0; i < in.size(); ++i) in[i] += high[i];
      Stereo out = run(device, in);
      return db(tone_level(out.left, 2160.0, kRate, 24000) / tone_level(out.left, 2000.0, kRate, 24000));
    };
    const double small = sidebands(kSmall), combo = sidebands(kCombo), monitor = sidebands(kFullRange);
    char label[160];
    std::snprintf(label, sizeof label,
                  "cone excursion modulates the highs: Small %.1f, Combo %.1f, Full range %.1f dBc", small,
                  combo, monitor);
    CHECK(small > -26.0 && combo > -38.0 && combo < small - 6.0 && monitor < combo - 6.0, label);
  }

  // Distance: on the cone there is only the direct sound and the two sides
  // are one signal. Pulling back, the room rises against the direct sound
  // step after step, the image widens, and the level stays where it was.
  {
    const float distances[] = {0.0f, 0.2f, 0.4f, 0.6f, 0.8f, 1.0f};
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = pink(5.0f, kRate, 0.125f);
    double last_ratio = -300.0, last_correlation = 2.0, close_level = 0.0;
    bool ratio_rises = true, image_widens = true, level_holds = true;
    double far_ratio = 0.0, far_correlation = 0.0, close_ratio = 0.0;
    for (float distance : distances) {
      // In the hall the first reflection is at least 4 ms behind the direct
      // sound, so the first 3 ms of the impulse response are the speaker.
      close_clean(kFullRange);
      device.set_param(p::kRoom, 1.0f);
      device.set_param(p::kDistance, distance);
      const std::vector<float> h = impulse_response(kRate, 3.0f);
      const size_t split = kLatency + 144;
      const double direct = rms(h, 0, split) * std::sqrt(static_cast<double>(split));
      const double room = rms(h, split, h.size()) * std::sqrt(static_cast<double>(h.size() - split));
      const double ratio = db(room / direct);
      ratio_rises = ratio_rises && ratio > last_ratio + 3.0;
      last_ratio = ratio;

      close_clean(kCombo);
      device.set_param(p::kDistance, distance);
      Stereo out = run(device, in);
      const double corr = correlation(out.left, out.right, 48000);
      image_widens = image_widens && corr < last_correlation - 0.02 * (distance > 0.0f);
      last_correlation = corr;
      const double level = db(rms(out.left, 48000));
      if (distance == 0.0f) {
        close_level = level;
        close_ratio = ratio;
        CHECK(corr > 0.9999, "on the cone the two sides are the same signal");
        double difference = 0.0;
        for (size_t i = 0; i < out.size(); ++i) {
          difference = std::max(difference, std::fabs(static_cast<double>(out.left[i]) - out.right[i]));
        }
        CHECK(difference == 0.0, "on the cone a mono source stays mono");
      }
      level_holds = level_holds && std::fabs(level - close_level) < 1.5 &&
                    std::fabs(db(rms(out.right, 48000)) - close_level) < 1.5;
      far_ratio = ratio;
      far_correlation = corr;
    }
    char label[200];
    std::snprintf(label, sizeof label, "room over direct sound rises with Distance (%.1f dB close, %+.1f dB far)",
                  close_ratio, far_ratio);
    CHECK(ratio_rises && close_ratio < -20.0 && far_ratio > 10.0, label);
    std::snprintf(label, sizeof label, "the image widens with Distance (correlation %.2f at the far wall)",
                  far_correlation);
    CHECK(image_widens && far_correlation > 0.0 && far_correlation < 0.4, label);
    CHECK(level_holds, "the level holds within 1.5 dB over the whole of Distance");

    // Far away, a mono fold-down loses under 3 dB and the bass stays in phase.
    close_clean(kCombo);
    device.set_param(p::kDistance, 1.0f);
    Stereo out = run(device, in);
    livemix::kit::Biquad low[2];
    std::vector<float> bass[2] = {out.left, out.right};
    for (int c = 0; c < 2; ++c) {
      low[c].set_lowpass(200.0f, 0.7f, kRate);
      for (float& v : bass[c]) v = low[c].process(v);
    }
    std::vector<float> mono(out.size());
    for (size_t i = 0; i < mono.size(); ++i) mono[i] = 0.5f * (out.left[i] + out.right[i]);
    CHECK(db(rms(mono, 48000) / rms(out.left, 48000)) > -3.2, "far: the mono fold-down keeps its level");
    CHECK(correlation(bass[0], bass[1], 48000) > 0.15, "far: the bass of the two sides stays in phase");
  }

  // A stereo source keeps its sides at the cone (two amplifiers, two
  // speakers) and shares one room.
  {
    rng_state() = 0xFACEu;
    const std::vector<float> left = pink(2.0f, kRate, 0.125f);
    const std::vector<float> nothing = silence(2.0f, kRate);
    close_clean(kCombo);
    Stereo near = run(device, left, nothing);
    CHECK(rms(near.left, 24000) > 0.05 && peak(near.right) == 0.0,
          "on the cone a left-only source stays on the left");
    close_clean(kCombo);
    device.set_param(p::kDistance, 1.0f);
    Stereo far = run(device, left, nothing);
    CHECK_NEAR(db(rms(far.right, 24000) / rms(far.left, 24000)), 0.0, 3.0,
               "from the far wall it fills both sides");
  }

  // Room sets the decay: a cupboard, a room, a hall.
  {
    const float rooms[] = {0.0f, 0.5f, 1.0f};
    const double expected[] = {0.12, 0.38, 1.2};
    char label[160];
    double measured[3];
    for (int k = 0; k < 3; ++k) {
      close_clean(kFullRange);
      device.set_param(p::kDistance, 1.0f);
      device.set_param(p::kRoom, rooms[k]);
      rng_state() = 0xBEEFu;
      std::vector<float> burst = noise(0.3f, kRate, 0.3f);
      burst.resize(static_cast<size_t>(4.0f * kRate), 0.0f);
      Stereo out = run(device, burst);
      measured[k] = rt60(out.left, kRate, 0.33, 0.02, -80.0);
      std::snprintf(label, sizeof label, "Room %.1f decays in %.2f s (measured %.3f)", rooms[k], expected[k],
                    measured[k]);
      CHECK(std::fabs(measured[k] - expected[k]) < 0.15 * expected[k], label);
    }
    // The same hall at 96 kHz.
    close_clean(kFullRange, 96000.0f);
    device.set_param(p::kDistance, 1.0f);
    device.set_param(p::kRoom, 1.0f);
    rng_state() = 0xBEEFu;
    std::vector<float> burst = noise(0.3f, 96000.0f, 0.3f);
    burst.resize(static_cast<size_t>(4.0f * 96000.0f), 0.0f);
    Stereo out = run(device, burst);
    CHECK_NEAR(rt60(out.left, 96000.0, 0.33, 0.02, -80.0), measured[2], 0.12, "the hall is the same at 96 kHz");
  }

  // Angle: off the axis the direct sound loses its top and the presence peak
  // softens; the body stays.
  {
    close_clean(kCombo);
    const std::vector<float> on = impulse_response(kRate, 0.5f);
    close_clean(kCombo);
    device.set_param(p::kAngle, 1.0f);
    const std::vector<float> off = impulse_response(kRate, 0.5f);
    close_clean(kCombo);
    device.set_param(p::kAngle, 0.5f);
    const std::vector<float> part = impulse_response(kRate, 0.5f);
    const double top = db(response(off, 4000.0) / response(on, 4000.0));
    const double presence = db(response(off, 2500.0) / response(on, 2500.0));
    char label[160];
    std::snprintf(label, sizeof label, "Angle 1: %.1f dB at 4 kHz, %.1f dB at the presence peak", top, presence);
    CHECK(top < -9.0 && presence < -4.0, label);
    CHECK_NEAR(db(response(off, 300.0) / response(on, 300.0)), 0.0, 0.7, "Angle leaves the body alone");
    const double half = db(response(part, 4000.0) / response(on, 4000.0));
    CHECK(half < -2.5 && half > top + 2.5, "Angle works progressively");
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = pink(2.0f, kRate, 0.125f);
    close_clean(kCombo);
    const double bright = energy_above(run(device, in).left, 3000.0, kRate, 24000);
    close_clean(kCombo);
    device.set_param(p::kAngle, 1.0f);
    const double dull = energy_above(run(device, in).left, 3000.0, kRate, 24000);
    CHECK(dull < 0.4 * bright, "Angle lowers the energy above 3 kHz");
  }

  // Noise: hiss and hum that follow the control, are louder with Drive, are
  // made only while signal passes and for a moment after, and are different
  // in the two channels (two amplifiers on one mains supply).
  {
    auto floor_after = [&](float amount, float drive, Stereo* captured) {
      close_clean(kCombo);
      device.set_param(p::kNoise, amount);
      device.set_param(p::kDrive, drive);
      run(device, sine(330.0f, 0.5f, kRate, 0.1f));
      Stereo out = render(device, 0.9f, kRate);
      if (captured != nullptr) *captured = out;
      return db(rms(out.left, 9600, 40000));  // after the speaker has rung out
    };
    Stereo full;
    const double loud = floor_after(1.0f, 0.25f, &full);
    const double usual = floor_after(0.1f, 0.25f, nullptr);
    const double none = floor_after(0.0f, 0.25f, nullptr);
    const double driven = floor_after(1.0f, 1.0f, nullptr);
    char label[200];
    std::snprintf(label, sizeof label,
                  "noise floor: %.1f dBFS at Noise 1, %.1f at 0.1, %.1f at 0, %.1f at Noise 1 with Drive 1",
                  loud, usual, none, driven);
    CHECK(loud > -54.0 && loud < -42.0, label);
    CHECK_NEAR(usual, loud - 30.0, 1.5, "Noise 0.1 is 30 dB under Noise 1");
    CHECK(none < -120.0, "Noise 0 is silent between notes");
    CHECK(driven > loud + 5.0, "Drive brings the noise up");
    const double hum = db(tone_level(full.left, 100.0, kRate, 9600, 40000));
    std::snprintf(label, sizeof label, "mains hum at 100 Hz: %.1f dBFS", hum);
    CHECK(hum > loud - 8.0 && hum < loud, label);
    const double shared = correlation(full.left, full.right, 9600, 40000);
    CHECK(shared > 0.1 && shared < 0.8, "the hum is shared, the hiss is not");

    // A second after the signal the noise fades, and then there is nothing.
    close_clean(kCombo);
    device.set_param(p::kNoise, 1.0f);
    run(device, sine(330.0f, 0.5f, kRate, 0.1f));
    Stereo after = render(device, 6.0f, kRate);
    CHECK(rms(after.left, 24000, 43200) > 1.0e-3, "noise carries on for a second after the signal");
    CHECK(peak(after.left, 96000, 288000) < 1.0e-5, "then it fades");
    CHECK(peak(after.left, 240000) == 0.0 && peak(after.right, 240000) == 0.0, "and the device is silent");
    device.init(kRate);
    device.set_param(p::kNoise, 1.0f);
    Stereo untouched = render(device, 1.0f, kRate);
    CHECK(peak(untouched.left) == 0.0 && peak(untouched.right) == 0.0, "no noise before anything is played");
  }

  // Nothing clicks: changing Speaker under a note, and throwing each knob
  // from one end to the other, is no rougher than the note itself.
  {
    const std::vector<float> note = sine(150.0f, 0.5f, kRate, 0.5f);
    char label[160];
    device.init(kRate);
    device.set_param(p::kNoise, 0.0f);
    run(device, note);
    const double steady = max_step(run(device, note).left);
    double worst = 0.0;
    for (int speaker : {kSmall, kStack, kHorn, kFullRange, kCombo}) {
      device.set_param(p::kSpeaker, static_cast<float>(speaker));
      worst = std::max(worst, max_step(run(device, note).left));
    }
    std::snprintf(label, sizeof label, "changing Speaker: largest step %.4f against %.4f for the note", worst,
                  steady);
    CHECK(worst < 2.0 * steady + 0.005, label);

    const int knobs[] = {p::kDrive, p::kBass, p::kTreble, p::kDistance, p::kRoom, p::kAngle, p::kOutput, p::kMix};
    const char* const names[] = {"Drive", "Bass", "Treble", "Distance", "Room", "Angle", "Output", "Mix"};
    for (int k = 0; k < 8; ++k) {
      const int knob = knobs[k];
      device.init(kRate);
      device.set_param(p::kNoise, 0.0f);
      device.set_param(p::kDistance, 0.6f);
      device.set_param(knob, p::kParamMin[knob]);
      run(device, note);
      double rough = max_step(run(device, note).left);
      device.set_param(knob, p::kParamMax[knob]);
      Stereo up = run(device, note);
      const double settled_up = max_step(up.left, 12000);
      device.set_param(knob, p::kParamMin[knob]);
      Stereo down = run(device, note);
      rough = std::max(rough, settled_up);
      const double moved = std::max(max_step(up.left), max_step(down.left));
      std::snprintf(label, sizeof label, "%s thrown end to end: largest step %.4f against %.4f settled",
                    names[k], moved, rough);
      CHECK(moved < 1.6 * rough + 0.004, label);
    }
  }

  // The device sleeps after the room has rung out and wakes on new input.
  {
    device.init(kRate);
    device.set_param(p::kDistance, 1.0f);
    device.set_param(p::kRoom, 1.0f);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 6.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    CHECK(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the hall has rung out");
    // Settings changed while asleep apply at once on waking.
    device.set_param(p::kSpeaker, static_cast<float>(kFullRange));
    device.set_param(p::kDistance, 0.0f);
    device.set_param(p::kDrive, 0.0f);
    device.set_param(p::kNoise, 0.0f);
    device.set_param(p::kAngle, 0.0f);
    Stereo woken = run(device, sine(1000.0f, 0.25f, kRate, 0.1f));
    CHECK_NEAR(db(tone_level(woken.left, 1000.0, kRate, 2400)), -20.0, 0.5, "wakes on new input with the new settings");
  }

  // Loud input at every extreme is held by the limiter after Output.
  {
    device.init(kRate);
    device.set_param(p::kOutput, 12.0f);
    device.set_param(p::kBass, 1.0f);
    device.set_param(p::kSpeaker, static_cast<float>(kStack));
    Stereo out = run(device, sine(118.0f, 1.0f, kRate, 1.0f));
    char label[160];
    std::snprintf(label, sizeof label, "full scale into the thump with +12 dB of Output peaks at %.2f",
                  peak(out.left));
    CHECK(peak(out.left) <= 4.0 && peak(out.left) > 1.0, label);
  }

  device.init(kRate);
  device.set_param(p::kDistance, 1.0f);
  device.set_param(p::kRoom, 1.0f);
  device.set_param(p::kNoise, 1.0f);
  device.set_param(p::kDrive, 0.6f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("re-amp", 10.0f, kRate, [&] { run(device, input); });

  return finish("re-amp");
}
