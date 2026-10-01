// Native harness for Tine (cpp/devices/tine-piano). The conformance pass
// covers silence, determinism, voice stealing and parameter abuse; the rest
// measures the instrument: pitch, the bell on the attack, how the pickup
// turns touch into harmonics, how long notes last across the keyboard, the
// damper, and the suitcase tremolo.

#include "../devices/tine-piano/tine_piano.h"
#include "support/test_kit.h"

#include <complex>

using namespace testkit;
using livemix::TinePiano;
namespace p = livemix::tine_piano;

static TinePiano device;

static const float kRate = 48000.0f;

// The bare instrument: no bell, no tremolo, a clean and open amplifier.
static void bare(TinePiano& d) {
  d.init(kRate);
  d.set_param(p::kBell, 0.0f);
  d.set_param(p::kTremolo, 0.0f);
  d.set_param(p::kDrive, 0.0f);
  d.set_param(p::kTone, 1.0f);
  d.set_param(p::kHardness, 1.0f);
  d.set_param(p::kVolume, 0.0f);
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

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// Level of harmonic `k` of `hz` over [from, to).
static double harmonic(const std::vector<float>& x, double hz, int k, size_t from, size_t to) {
  return tone_level(x, hz * k, kRate, from, to);
}

// Harmonics 2 to 10 against the fundamental.
static double distortion(const std::vector<float>& x, double hz, size_t from, size_t to) {
  double sum = 0.0;
  for (int k = 2; k <= 10; ++k) {
    const double level = harmonic(x, hz, k, from, to);
    sum += level * level;
  }
  return std::sqrt(sum) / harmonic(x, hz, 1, from, to);
}

// The tremolo's gain over time: the level of consecutive `hop`-sample
// windows of a render, against the same windows of the same note rendered
// without tremolo (renders are deterministic, so the note itself divides out).
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

int main() {
  Conformance spec;
  spec.name = "tine-piano";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.5f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // In tune from the bottom of the keyboard to the top, soft and hard.
  for (float hz : {55.0f, 110.0f, 220.0f, 440.0f, 880.0f, 1760.0f}) {
    for (float gain : {0.3f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kTremolo, 0.0f);
      device.note_on(1, hz, gain);
      Stereo out = render(device, 2.5f, kRate);
      const double found = dominant_frequency(out.left, kRate, hz * 0.8, hz * 1.25, 4800, 100800);
      char label[96];
      std::snprintf(label, sizeof label, "%.0f Hz at gain %.1f: %.2f cents off", hz, gain, cents(found, hz));
      EXPECT(std::fabs(cents(found, hz)) < 3.0, label);
    }
  }

  // The bell: the tine's second mode at 6.27 times the note, there on the
  // attack, gone within a second, louder for a harder strike, and absent
  // with Bell at 0.
  {
    const double hz = 440.0, bell_hz = hz * TinePiano::kBellRatio;
    auto strike = [&](float bell, float gain) {
      bare(device);
      device.set_param(p::kBell, bell);
      device.note_on(1, 440.0f, gain);
      return render(device, 1.5f, kRate);
    };
    Stereo hard = strike(1.0f, 1.0f);
    const double early = tone_level(hard.left, bell_hz, kRate, 0, 2400) / tone_level(hard.left, hz, kRate, 0, 2400);
    const double late = tone_level(hard.left, bell_hz, kRate, 48000, 57600) /
                        tone_level(hard.left, hz, kRate, 48000, 57600);
    std::printf("  bell partial against the fundamental: %.3f in the first 50 ms, %.5f after 1 s\n", early, late);
    EXPECT(early > 0.15, "the bell partial is strong in the first 50 ms");
    EXPECT(late < 0.01 * early, "and gone after a second");
    // It is its own partial, not a harmonic: nothing like it at 6 f or 7 f.
    EXPECT(tone_level(hard.left, bell_hz, kRate, 0, 2400) > 4.0 * tone_level(hard.left, 6.6 * hz, kRate, 0, 2400),
           "the bell is a narrow inharmonic partial");

    Stereo none = strike(0.0f, 1.0f);
    EXPECT(tone_level(none.left, bell_hz, kRate, 0, 2400) < 0.1 * tone_level(hard.left, bell_hz, kRate, 0, 2400),
           "Bell 0 removes it");
    Stereo soft = strike(1.0f, 0.3f);
    const double soft_early =
        tone_level(soft.left, bell_hz, kRate, 0, 2400) / tone_level(soft.left, hz, kRate, 0, 2400);
    EXPECT(soft_early < 0.4 * early, "a soft strike rings the bell much less than a hard one");
    // The bell rings for bell_seconds: 60 dB in that time.
    const double a = tone_level(hard.left, bell_hz, kRate, 1200, 3600);
    const double b = tone_level(hard.left, bell_hz, kRate, 1200 + 4800, 3600 + 4800);
    EXPECT_NEAR(20.0 * std::log10(b / a) / 0.1, -60.0 / TinePiano::bell_seconds(440.0f), 12.0,
                "the bell decays at its own fast rate");
  }

  // The pickup: a soft note is close to a sine, a hard one barks.
  {
    auto strike = [&](float bark, float hardness, float gain) {
      bare(device);
      device.set_param(p::kBark, bark);
      device.set_param(p::kHardness, hardness);
      device.note_on(1, 220.0f, gain);
      return render(device, 0.5f, kRate);
    };
    Stereo soft = strike(0.35f, 1.0f, 0.15f);
    Stereo hard = strike(0.35f, 1.0f, 1.0f);
    const double soft_thd = distortion(soft.left, 220.0, 2400, 12000);
    const double hard_thd = distortion(hard.left, 220.0, 2400, 12000);
    std::printf("  harmonics against the fundamental at the default Bark: soft %.3f, hard %.3f\n", soft_thd,
                hard_thd);
    EXPECT(soft_thd < 0.06, "a soft note is nearly sinusoidal");
    EXPECT(hard_thd > 0.1 && hard_thd > 5.0 * soft_thd, "a hard note has markedly more harmonics");
    EXPECT(rms(hard.left, 2400, 12000) > 4.0 * rms(soft.left, 2400, 12000), "and is much louder");
    // Every note grows purer as it dies away.
    Stereo ringing = strike(0.35f, 1.0f, 1.0f);
    ringing = concat(ringing, render(device, 4.0f, kRate));
    EXPECT(distortion(ringing.left, 220.0, 192000, 211200) < 0.5 * hard_thd,
           "the bark fades faster than the note");

    // Where the tine rests on the pickup curve decides which harmonics.
    Stereo centred = strike(0.0f, 1.0f, 1.0f);
    Stereo offset = strike(1.0f, 1.0f, 1.0f);
    const double c1 = harmonic(centred.left, 220.0, 1, 2400, 12000);
    const double c2 = harmonic(centred.left, 220.0, 2, 2400, 12000) / c1;
    const double c3 = harmonic(centred.left, 220.0, 3, 2400, 12000) / c1;
    const double o1 = harmonic(offset.left, 220.0, 1, 2400, 12000);
    const double o2 = harmonic(offset.left, 220.0, 2, 2400, 12000) / o1;
    const double o3 = harmonic(offset.left, 220.0, 3, 2400, 12000) / o1;
    std::printf("  Bark 0: 2nd %.4f, 3rd %.4f of the fundamental.  Bark 1: 2nd %.3f, 3rd %.3f\n", c2, c3, o2, o3);
    EXPECT(c3 > 3.0 * c2, "Bark 0, the symmetric position: odd harmonics, almost no second");
    EXPECT(o2 > 0.4 && o2 > 1.5 * o3, "Bark 1: a strong second harmonic leads");
    EXPECT(distortion(offset.left, 220.0, 2400, 12000) > 3.0 * distortion(centred.left, 220.0, 2400, 12000),
           "Bark raises the harmonic content of a hard note");

    // Hardness 0: touch is loudness only.
    Stereo flat_soft = strike(0.6f, 0.0f, 0.15f);
    Stereo flat_hard = strike(0.6f, 0.0f, 1.0f);
    EXPECT_NEAR(distortion(flat_hard.left, 220.0, 2400, 12000) / distortion(flat_soft.left, 220.0, 2400, 12000),
                1.0, 0.03, "Hardness 0: a hard note has the tone of a soft one");
    EXPECT(rms(flat_hard.left, 2400, 12000) > 4.0 * rms(flat_soft.left, 2400, 12000),
           "Hardness 0: but is still louder");
  }

  // The pickup's harmonics do not fold back: with no bell every partial is a
  // harmonic of the note, so anything between the harmonics is aliasing.
  // Hardest strike, most Bark, notes tuned off the grid.
  {
    double worst = 0.0;
    for (int step = 0; step < 16; ++step) {
      const float hz = 207.0f * std::pow(2.0f, static_cast<float>(step) * (4.6f / 16.0f));
      bare(device);
      device.set_param(p::kBark, 1.0f);
      device.set_param(p::kVolume, -6.0f);
      device.note_on(1, hz, 1.0f);
      Stereo out = render(device, 0.45f, kRate);
      const std::vector<double> power = power_spectrum(out.left, 2400, 16384);
      const double bin = kRate / 16384.0;
      double off = 0.0, total = 0.0;
      for (size_t i = 12; i < power.size(); ++i) {
        const double f = static_cast<double>(i) * bin;
        const double k = std::round(f / hz);
        total += power[i];
        if (k < 1.0 || std::fabs(f - k * hz) > 16.0 * bin) off += power[i];
      }
      worst = std::max(worst, off / total);
    }
    std::printf("  worst folded energy, 207 Hz to 5 kHz: %.1f dB\n", 10.0 * std::log10(worst));
    EXPECT(worst < 1.0e-7, "the pickup's harmonics stay under Nyquist: -70 dB between the harmonics");
  }

  // Low notes sing for a long time, high notes are short; Decay scales both.
  {
    auto ring = [&](float hz, float decay, float seconds) {
      bare(device);
      device.set_param(p::kDecay, decay);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, seconds, kRate);
      return rt60(out.left, kRate, 0.1, 0.1, -70.0);
    };
    const double low = ring(110.0f, 1.0f, 18.0f);
    const double high = ring(1760.0f, 1.0f, 7.0f);
    const double low_short = ring(110.0f, 0.5f, 10.0f);
    std::printf("  time to -60 dB: %.2f s at 110 Hz, %.2f s at 1760 Hz, %.2f s at 110 Hz with Decay 0.5\n", low,
                high, low_short);
    EXPECT(low > 2.5 * high, "a low note lasts much longer than a high one");
    EXPECT_NEAR(low / TinePiano::sustain_seconds(110.0f), 1.0, 0.3, "about the time the key-scaling law gives");
    EXPECT_NEAR(high / TinePiano::sustain_seconds(1760.0f), 1.0, 0.3, "at both ends of the keyboard");
    EXPECT_NEAR(low_short / low, 0.5, 0.05, "Decay scales the time");

    // Two stages: the tine's prompt decay, then the tone bar's slower one.
    bare(device);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 14.0f, kRate);
    const double prompt = rt60(out.left, kRate, 0.1, 0.1, db(rms(out.left, 4800, 9600)) - 12.0);
    const double after = rt60(out.left, kRate, 9.0, 0.1, -90.0);
    std::printf("  220 Hz: decays at %.1f s per 60 dB at first, %.1f s later\n", prompt, after);
    EXPECT(after > 1.5 * prompt, "the tone bar carries the sustain after the tine has faded");
  }

  // Key up: the damper takes the note away in the Release time.
  {
    for (float release : {0.1f, 0.6f}) {
      bare(device);
      device.set_param(p::kRelease, release);
      device.note_on(1, 220.0f, 0.8f);
      Stereo held = render(device, 0.5f, kRate);
      const double before = rms(held.left, 19200, 24000);
      device.note_off(1);
      Stereo fall = render(device, 2.0f, kRate);
      const size_t at = static_cast<size_t>(release * kRate);
      char label[120];
      std::snprintf(label, sizeof label, "Release %.1f s: %.1f dB down half way, %.1f dB down at the set time",
                    release, -db(rms(fall.left, at / 2 - 240, at / 2 + 240) / before),
                    -db(rms(fall.left, at - 240, at + 240) / before));
      EXPECT(rms(fall.left, at / 2 - 240, at / 2 + 240) > 0.015 * before &&
                 rms(fall.left, at - 240, at + 240) < 0.0025 * before,
             label);
      EXPECT(peak(fall.left, at * 2 + 9600) == 0.0, "and the voice is freed: exact silence after");
    }
    bare(device);
    device.note_on(1, 220.0f, 0.8f);
    Stereo held = render(device, 1.1f, kRate);
    EXPECT(rms(held.left, 48000, 52800) > 0.35 * rms(held.left, 19200, 24000), "a held note keeps ringing");
  }

  // Tremolo: rate, depth, and the two channels in opposite phase with Pan up.
  {
    auto play = [&](float depth, float rate, float pan) {
      bare(device);
      device.set_param(p::kTremolo, depth);
      device.set_param(p::kTremoloRate, rate);
      device.set_param(p::kPan, pan);
      device.set_param(p::kDecay, 4.0f);
      device.note_on(1, 200.0f, 0.5f);  // 240 samples per cycle: whole cycles per window
      return render(device, 6.0f, kRate);
    };
    const Stereo plain = play(0.0f, 2.0f, 0.0f);
    EXPECT(plain.left == plain.right, "Tremolo 0: mono");
    EXPECT(play(0.0f, 7.0f, 1.0f).left == plain.left, "Tremolo 0: Rate and Pan do nothing");
    const size_t from = 24000, to = 264000;  // 5 s: whole cycles at every rate used

    for (float rate : {2.0f, 6.0f}) {
      Stereo out = play(0.5f, rate, 0.0f);
      const std::vector<float> trace = centred(gain_trace(out.left, plain.left, from, to, 240));
      EXPECT_NEAR(dominant_frequency(trace, 200.0, 0.5, 12.0), rate, 0.02, "the tremolo runs at the set rate");
    }
    for (float depth : {0.25f, 0.5f, 0.8f}) {
      Stereo out = play(depth, 2.0f, 0.0f);
      const std::vector<float> trace = gain_trace(out.left, plain.left, from, to, 240);
      EXPECT_NEAR(lowest(trace) / highest(trace), 1.0 - depth, 0.01,
                  "the gain swings between full and (1 - depth)");
      // Loudness is held: the mean square gain is 1.
      double power = 0.0;
      for (float g : trace) power += static_cast<double>(g) * g;
      EXPECT_NEAR(power / static_cast<double>(trace.size()), 1.0, 0.02, "depth leaves the loudness alone");
      EXPECT(out.left == out.right, "Pan 0: both channels move together");
    }

    Stereo panned = play(0.8f, 2.0f, 1.0f);
    const std::vector<float> left = gain_trace(panned.left, plain.left, from, to, 240);
    const std::vector<float> right = gain_trace(panned.right, plain.left, from, to, 240);
    const double opposite = correlation(centred(left), centred(right));
    std::printf("  Pan 1: left and right gains correlate %.4f\n", opposite);
    EXPECT(opposite < -0.999, "Pan 1: left and right move in opposite phase");
    EXPECT_NEAR(lowest(left) / highest(left), 0.2, 0.01, "each channel still swings by the depth");
    double sum_lo = 1.0e9, sum_hi = 0.0;
    for (size_t i = 0; i < left.size(); ++i) {
      sum_lo = std::min(sum_lo, static_cast<double>(left[i] + right[i]));
      sum_hi = std::max(sum_hi, static_cast<double>(left[i] + right[i]));
    }
    EXPECT(sum_hi < 1.01 * sum_lo, "and what one channel loses the other gains");

    Stereo half = play(0.8f, 2.0f, 0.5f);
    const double quarter = correlation(centred(gain_trace(half.left, plain.left, from, to, 240)),
                                       centred(gain_trace(half.right, plain.left, from, to, 240)));
    EXPECT(std::fabs(quarter) < 0.05, "Pan 0.5: the right channel lags by a quarter cycle");
  }

  // Tone and Drive: the amplifier.
  {
    auto chord = [&](float tone, float drive, float gain) {
      bare(device);
      device.set_param(p::kBell, 1.0f);
      device.set_param(p::kTone, tone);
      device.set_param(p::kDrive, drive);
      device.note_on(1, 220.0f, gain);
      return render(device, 0.5f, kRate);
    };
    // The bell partial (1379 Hz for this note) is the bright thing to listen to.
    const double bell_hz = 220.0 * TinePiano::kBellRatio;
    Stereo open = chord(1.0f, 0.0f, 1.0f);
    Stereo dark = chord(0.0f, 0.0f, 1.0f);
    const double open_high = tone_level(open.left, bell_hz, kRate, 0, 2400);
    const double dark_high = tone_level(dark.left, bell_hz, kRate, 0, 2400);
    std::printf("  bell partial: %.4f with Tone open, %.4f with Tone down\n", open_high, dark_high);
    EXPECT(open_high > 0.02 && dark_high < 0.2 * open_high, "Tone down takes the top away");
    EXPECT(harmonic(dark.left, 220.0, 1, 2400, 12000) > 0.85 * harmonic(open.left, 220.0, 1, 2400, 12000),
           "and leaves the fundamental");
    Stereo half = chord(0.5f, 0.0f, 1.0f);
    const double half_high = tone_level(half.left, bell_hz, kRate, 0, 2400);
    EXPECT(half_high > 1.5 * dark_high && half_high < open_high * 1.05, "Tone is a continuous control");

    bare(device);
    device.set_param(p::kBark, 0.0f);
    device.set_param(p::kHardness, 0.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo clean = render(device, 0.5f, kRate);
    bare(device);
    device.set_param(p::kBark, 0.0f);
    device.set_param(p::kHardness, 0.0f);
    device.set_param(p::kDrive, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo driven = render(device, 0.5f, kRate);
    const double clean_thd = distortion(clean.left, 220.0, 2400, 12000);
    const double driven_thd = distortion(driven.left, 220.0, 2400, 12000);
    std::printf("  amplifier: harmonics %.3f clean, %.3f at full Drive\n", clean_thd, driven_thd);
    EXPECT(driven_thd > 3.0 * clean_thd && driven_thd > 0.1, "Drive adds the amplifier's own harmonics");
    EXPECT(peak(driven.left) < peak(clean.left) * 1.02, "by squashing peaks, not by adding level");
  }

  // Moving Bark, Volume, Tone or the tremolo under a held bass note does not
  // click (the pickup's derivative would make a thump of any step).
  {
    bare(device);
    device.set_param(p::kBark, 0.5f);
    device.set_param(p::kVolume, -6.0f);
    device.note_on(1, 55.0f, 1.0f);
    Stereo steady = render(device, 0.5f, kRate);
    const double reference = max_step(steady.left, 4800);
    Stereo moving;
    for (int block = 0; block < 100; ++block) {
      const bool odd = block % 2 == 1;
      device.set_param(p::kBark, odd ? 0.1f : 0.9f);
      device.set_param(p::kVolume, odd ? -18.0f : -6.0f);
      device.set_param(p::kTone, odd ? 0.2f : 1.0f);
      device.set_param(p::kTremolo, odd ? 0.0f : 0.8f);
      device.set_param(p::kPan, odd ? 0.0f : 1.0f);
      moving = concat(moving, render(device, 0.01f, kRate));
    }
    std::printf("  largest step: %.4f steady, %.4f with five parameters jumping\n", reference,
                max_step(moving.left));
    EXPECT(max_step(moving.left) < 1.5 * reference, "parameter jumps are smoothed");
  }

  // Levels: one key, and ten.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 2.0f, kRate);
    const double level_db = db(std::max(peak(one.left), peak(one.right)));
    std::printf("  one key at the default volume peaks at %.1f dBFS\n", level_db);
    EXPECT(level_db > -24.0 && level_db < -10.0, "one key at the default volume peaks between -24 and -10 dBFS");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo ten = render(device, 3.0f, kRate);
    const double ten_peak = std::max(peak(ten.left), peak(ten.right));
    std::printf("  ten keys peak at %.3f\n", ten_peak);
    EXPECT(ten_peak < 0.9, "ten keys stay under the clip knee region");
  }

  // Cost with every voice sounding.
  device.init(kRate);
  for (int n = 0; n < TinePiano::kMaxVoices; ++n) {
    device.note_on(n, 55.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  }
  report_cost("tine-piano (20 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("tine-piano");
}
