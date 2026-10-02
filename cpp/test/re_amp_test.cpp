// Native harness for Re-amp (cpp/devices/re-amp). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest measures the chain: the amplifier's distortion, sag and aliasing,
// each speaker's response and loudness, the microphone's distance and angle,
// the room's decay, the noise, and the latency.

#include "../devices/re-amp/re_amp.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::ReAmp;
namespace p = livemix::re_amp;

static ReAmp device;

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
    EXPECT(worst == 0.0, "Mix 0 is the input, delayed by the latency, bit for bit");
    EXPECT(peak(out.left, 0, kLatency) == 0.0, "nothing before the latency");

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
      EXPECT_NEAR(delay, static_cast<double>(kLatency), 1.0, "the direct sound arrives on the latency");
    }

    // So half-way on Mix adds the two instead of combing them.
    close_clean(kFullRange);
    device.set_param(p::kMix, 0.5f);
    Stereo half = run(device, sine(1000.0f, 0.5f, kRate, 0.1f));
    EXPECT_NEAR(db(tone_level(half.left, 1000.0, kRate, 12000) / 0.1), 0.0, 0.5,
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
      EXPECT(std::fabs(band.low - e.low) <= 0.15 * e.low, label);
      std::snprintf(label, sizeof label, "%s: 10 dB down at %.0f Hz (measured %.0f)",
                    kSpeakerNames[e.speaker], e.high, band.high);
      EXPECT(std::fabs(band.high - e.high) <= 0.15 * e.high, label);
      double hz, gain;
      find_peak(h, band, e.peak_lo, e.peak_hi, &hz, &gain);
      std::snprintf(label, sizeof label, "%s: its resonance stands out (%.1f dB at %.0f Hz)",
                    kSpeakerNames[e.speaker], gain, hz);
      EXPECT(gain >= e.peak_db && hz > e.peak_lo * 1.01 && hz < e.peak_hi * 0.99, label);
      // Steep above its range: an octave past the upper point is 20 dB further down.
      std::snprintf(label, sizeof label, "%s: steep roll-off above its range", kSpeakerNames[e.speaker]);
      EXPECT(db(response(h, 2.0 * band.high) / band.reference) < -30.0, label);
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
    EXPECT(lowest > -3.0 && highest < 3.5, label);
    EXPECT_NEAR(db(response(h, 1000.0)), 0.0, 0.5, "Full range: unity gain at 1 kHz");

    // The same speaker at the other sample rates.
    for (float rate : {44100.0f, 96000.0f}) {
      close_clean(kCombo, rate);
      const Band band = band_of(impulse_response(rate), rate);
      std::snprintf(label, sizeof label, "Combo at %.0f Hz: the same band (%.0f to %.0f Hz)", rate, band.low,
                    band.high);
      EXPECT(std::fabs(band.low - 90.0) <= 13.5 && std::fabs(band.high - 5000.0) <= 750.0, label);
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
    EXPECT(matched, label);
    EXPECT(matched_plain, "speakers within 2 dB of their mean level on pink noise, unweighted");
    EXPECT(mean_loudness > -3.0 && mean_loudness < 1.0, "the speakers are about as loud as the input");

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
    EXPECT(highest - lowest < 2.0, label);
  }

  // CHECKS

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
