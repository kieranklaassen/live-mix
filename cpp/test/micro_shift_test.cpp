// Native harness for Micro Shift (cpp/devices/micro-shift). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a micro pitch shift: two
// copies at exact, opposite detunes, each a steady note (no tremolo, no
// sidebands), late by what Delay says, with the bass left alone.

#include "../devices/micro-shift/micro_shift.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::MicroShift;
namespace p = livemix::micro_shift;

static MicroShift device;
static livemix::kit::Fft<32768> fft;
static float fft_re[32768];
static float fft_im[32768];

static const float kRate = 48000.0f;

// Only the copies: no drift, nothing held back as bass, no treble cut.
static void wet_only(MicroShift& d, float detune) {
  d.init(kRate);
  d.set_param(p::kDetune, detune);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kFocus, 20.0f);
  d.set_param(p::kTone, 18000.0f);
  d.set_param(p::kMix, 1.0f);
}

static double cents_between(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// The strongest frequency within ±`span` cents of `near`: a 0.5 cent Goertzel
// scan with a parabola through the top three points.
static double peak_frequency(const std::vector<float>& x, double near, double span, size_t from,
                             size_t to) {
  const int steps = static_cast<int>(span * 2.0);
  std::vector<double> level(static_cast<size_t>(2 * steps + 1));
  int best = 0;
  for (int i = 0; i <= 2 * steps; ++i) {
    const double hz = near * std::pow(2.0, (i - steps) * 0.5 / 1200.0);
    level[static_cast<size_t>(i)] = tone_level(x, hz, kRate, from, to);
    if (level[static_cast<size_t>(i)] > level[static_cast<size_t>(best)]) best = i;
  }
  double offset = 0.0;
  if (best > 0 && best < 2 * steps) {
    const double a = level[static_cast<size_t>(best - 1)];
    const double b = level[static_cast<size_t>(best)];
    const double c = level[static_cast<size_t>(best + 1)];
    offset = 0.5 * (a - c) / (a - 2.0 * b + c);
  }
  return near * std::pow(2.0, (best - steps + offset) * 0.5 / 1200.0);
}

// Highest and lowest RMS over windows of `window` samples, as a ratio in dB:
// the depth of any amplitude modulation.
static double ripple_db(const std::vector<float>& x, size_t from, size_t to, size_t window) {
  double low = 1.0e9, high = 0.0;
  for (size_t start = from; start + window <= to; start += window / 4) {
    const double level = rms(x, start, start + window);
    low = std::min(low, level);
    high = std::max(high, level);
  }
  return db(high) - db(low);
}

// The largest spectral component more than `guard` bins from the strongest
// one, relative to it, in dB (Blackman-Harris window, 32768 points).
static double worst_spur_db(const std::vector<float>& x, size_t from, int guard) {
  const int n = 32768;
  for (int i = 0; i < n; ++i) {
    const double t = 2.0 * kPi * i / n;
    const double window =
        0.35875 - 0.48829 * std::cos(t) + 0.14128 * std::cos(2.0 * t) - 0.01168 * std::cos(3.0 * t);
    fft_re[i] = static_cast<float>(window * x[from + static_cast<size_t>(i)]);
    fft_im[i] = 0.0f;
  }
  fft.forward(fft_re, fft_im);
  int carrier = 1;
  double carrier_power = 0.0;
  for (int i = 1; i < n / 2; ++i) {
    const double power = static_cast<double>(fft_re[i]) * fft_re[i] + static_cast<double>(fft_im[i]) * fft_im[i];
    if (power > carrier_power) {
      carrier_power = power;
      carrier = i;
    }
  }
  double spur_power = 0.0;
  for (int i = 2; i < n / 2; ++i) {
    if (std::abs(i - carrier) <= guard) continue;
    const double power = static_cast<double>(fft_re[i]) * fft_re[i] + static_cast<double>(fft_im[i]) * fft_im[i];
    spur_power = std::max(spur_power, power);
  }
  return 10.0 * std::log10(std::max(spur_power, 1.0e-30) / carrier_power);
}

// Pink noise (Paul Kellet's filter), RMS near 0.1.
static std::vector<float> pink_noise(float seconds) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate));
  double b0 = 0.0, b1 = 0.0, b2 = 0.0;
  for (float& v : out) {
    const double w = white();
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    v = static_cast<float>((b0 + b1 + b2 + w * 0.1848) * 0.06);
  }
  return out;
}

// A 1 ms burst of 3 kHz added at `at`.
static void add_click(std::vector<float>& x, size_t at, float gain) {
  const size_t length = static_cast<size_t>(0.001f * kRate);
  for (size_t i = 0; i < length && at + i < x.size(); ++i) {
    const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(length));
    x[at + i] += static_cast<float>(gain * window * std::sin(2.0 * kPi * 3000.0 * static_cast<double>(i) / kRate));
  }
}

// First sample in [from, to) whose magnitude passes `threshold`, or `to`.
static size_t first_above(const std::vector<float>& x, size_t from, size_t to, double threshold) {
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > threshold) return i;
  }
  return to;
}

int main() {
  fft.init();

  Conformance spec;
  spec.name = "micro-shift";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 2.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  char label[200];

  // The left copy is the input raised by Detune and the right copy lowered by
  // it, to within a cent, from the bass to the top of the keyboard.
  for (float hz : {110.0f, 440.0f, 1000.0f, 4000.0f}) {
    for (float detune : {9.0f, 50.0f}) {
      if (detune > 10.0f && hz != 1000.0f) continue;
      wet_only(device, detune);
      Stereo out = run(device, sine(hz, 5.0f, kRate, 0.5f));
      const size_t from = static_cast<size_t>(kRate), to = out.size();
      const double up = hz * std::pow(2.0, detune / 1200.0);
      const double down = hz * std::pow(2.0, -detune / 1200.0);
      const double left = cents_between(peak_frequency(out.left, up, 4.0, from, to), up);
      const double right = cents_between(peak_frequency(out.right, down, 4.0, from, to), down);
      std::snprintf(label, sizeof label,
                    "%.0f Hz, %.0f ct: left is sharp and right flat by Detune (errors %+.3f, %+.3f ct)",
                    hz, detune, left, right);
      EXPECT(std::fabs(left) < 1.0 && std::fabs(right) < 1.0, label);
    }
  }

  // A steady note comes back steady: no tremolo from the splices (under
  // 0.5 dB of amplitude modulation) and nothing but the shifted note in the
  // spectrum (spurs 50 dB down), with several splices inside the measurement.
  for (float hz : {220.0f, 1000.0f, 4000.0f}) {
    wet_only(device, 50.0f);
    Stereo out = run(device, sine(hz, 4.0f, kRate, 0.5f));
    const size_t from = static_cast<size_t>(kRate), to = out.size();
    const double up = hz * std::pow(2.0, 50.0 / 1200.0);
    // A whole number of periods per window, about 20 ms.
    const size_t window = static_cast<size_t>(std::round(0.02 * up) * kRate / up + 0.5);
    const double left = ripple_db(out.left, from, to, window);
    const double right = ripple_db(out.right, from, to, window);
    const int splices = device.shifter(0).splices();
    std::snprintf(label, sizeof label,
                  "%.0f Hz: copies hold a steady level through %d splices (ripple %.3f, %.3f dB)", hz,
                  splices, left, right);
    EXPECT(splices >= 4 && left < 0.5 && right < 0.5, label);
    if (hz >= 1000.0f) {
      const double spur_left = worst_spur_db(out.left, from, 8);
      const double spur_right = worst_spur_db(out.right, from, 8);
      std::snprintf(label, sizeof label, "%.0f Hz: spurious components 50 dB down (%.1f, %.1f dB)", hz,
                    spur_left, spur_right);
      EXPECT(spur_left < -50.0 && spur_right < -50.0, label);
    }
  }

  // With no detune the copies are plain delays: Delay on the left, 1.4 times
  // Delay on the right.
  for (float ms : {14.0f, 40.0f}) {
    wet_only(device, 0.0f);
    device.set_param(p::kDelay, ms);
    Stereo out = run(device, impulse(0.25f, kRate, 0.5f));
    const double left = static_cast<double>(first_above(out.left, 1, out.size(), 0.25)) * 1000.0 / kRate;
    const double right = static_cast<double>(first_above(out.right, 1, out.size(), 0.25)) * 1000.0 / kRate;
    std::snprintf(label, sizeof label, "Delay %.0f ms, no detune: copies arrive at %.2f and %.2f ms", ms,
                  left, right);
    EXPECT(std::fabs(left - ms) < 0.05 && std::fabs(right - 1.4 * ms) < 0.05, label);
  }

  // Detuned, each copy sweeps a few milliseconds either side of Delay: every
  // click arrives within the sweep, and on average at the Delay setting.
  double click_peak_low = 1.0e9;
  int clicks_once = 0, clicks_total = 0;
  for (float ms : {14.0f, 40.0f}) {
    wet_only(device, 50.0f);
    device.set_param(p::kDelay, ms);
    std::vector<float> in = sine(220.0f, 12.0f, kRate, 0.03f);
    std::vector<size_t> clicks;
    for (float t = 0.5f; t < 11.8f; t += 0.11f) {
      clicks.push_back(static_cast<size_t>(t * kRate));
      add_click(in, clicks.back(), 0.8f);
    }
    Stereo out = run(device, in);
    for (int side = 0; side < 2; ++side) {
      const std::vector<float>& wet = side == 0 ? out.left : out.right;
      const double centre = side == 0 ? ms : 1.4 * ms;
      const size_t span = static_cast<size_t>(0.105f * kRate);
      double sum = 0.0, earliest = 1.0e9, latest = 0.0;
      for (size_t at : clicks) {
        const double arrival = static_cast<double>(first_above(wet, at, at + span, 0.2) - at) * 1000.0 / kRate;
        sum += arrival;
        earliest = std::min(earliest, arrival);
        latest = std::max(latest, arrival);
        // The same click must not come out twice (a splice replaying it) or
        // not at all (a splice skipping it): count bursts 2 ms apart.
        int bursts = 0;
        size_t last = 0;
        double loudest = 0.0;
        for (size_t i = at; i < at + span; ++i) {
          const double magnitude = std::fabs(wet[i]);
          loudest = std::max(loudest, magnitude);
          if (magnitude > 0.2) {
            if (bursts == 0 || i - last > 96) ++bursts;
            last = i;
          }
        }
        clicks_once += bursts == 1 ? 1 : 0;
        ++clicks_total;
        click_peak_low = std::min(click_peak_low, loudest);
      }
      const double average = sum / static_cast<double>(clicks.size());
      std::snprintf(label, sizeof label,
                    "Delay %.1f ms, 50 ct: copy arrives %.1f to %.1f ms late, %.2f ms on average",
                    centre, earliest, latest, average);
      EXPECT(std::fabs(average - centre) < 3.0 && earliest > centre - 11.5 && latest < centre + 19.5,
             label);
    }
  }
  std::snprintf(label, sizeof label,
                "every transient comes out once per copy, never doubled or dropped (%d of %d, weakest %.2f)",
                clicks_once, clicks_total, click_peak_low);
  EXPECT(clicks_once == clicks_total && click_peak_low > 0.6, label);

  // Below Focus the sound is left alone: a 60 Hz tone at the default patch
  // comes out the same on both sides and equal to the dry tone, while a tone
  // well above Focus is spread.
  {
    device.init(kRate);
    std::vector<float> low = sine(60.0f, 4.0f, kRate, 0.5f);
    Stereo out = run(device, low);
    const size_t from = static_cast<size_t>(kRate), to = out.size();
    const double sides = correlation(out.left, out.right, from, to);
    const double with_dry = correlation(out.left, low, from, to);
    const double level = db(rms(out.left, from, to) / rms(low, from, to));
    std::snprintf(label, sizeof label,
                  "60 Hz under Focus: sides correlate %.4f, with the dry tone %.4f, level %+.2f dB", sides,
                  with_dry, level);
    EXPECT(sides > 0.99 && with_dry > 0.98 && std::fabs(level) < 0.5, label);

    device.init(kRate);
    Stereo high = run(device, sine(1500.0f, 4.0f, kRate, 0.5f));
    const double spread = correlation(high.left, high.right, from, to);
    std::snprintf(label, sizeof label, "1500 Hz above Focus: sides correlate only %.2f", spread);
    EXPECT(spread < 0.8, label);
  }

  // Default patch on pink noise: each side as loud as the dry sound, wide but
  // not out of phase, and the mono sum keeps its level.
  {
    device.init(kRate);
    rng_state() = 0xC0FFEEu;
    std::vector<float> dry = pink_noise(8.0f);
    Stereo out = run(device, dry);
    const size_t from = static_cast<size_t>(kRate), to = out.size();
    std::vector<float> mono(out.size());
    for (size_t i = 0; i < mono.size(); ++i) mono[i] = 0.5f * (out.left[i] + out.right[i]);
    const double left = db(rms(out.left, from, to) / rms(dry, from, to));
    const double right = db(rms(out.right, from, to) / rms(dry, from, to));
    const double sum = db(rms(mono, from, to) / rms(dry, from, to));
    const double sides = correlation(out.left, out.right, from, to);
    std::snprintf(label, sizeof label,
                  "pink noise at defaults: sides %+.2f and %+.2f dB of dry, mono sum %+.2f dB, correlation %.2f",
                  left, right, sum, sides);
    EXPECT(std::fabs(left) < 1.5 && std::fabs(right) < 1.5 && std::fabs(sum) < 2.0 && sides > 0.0 &&
               sides < 0.9,
           label);

    // White noise with nothing held back as bass and Mix at half: equal power
    // keeps the level, and half of each side is shared with the other.
    device.init(kRate);
    device.set_param(p::kFocus, 20.0f);
    device.set_param(p::kTone, 18000.0f);
    device.set_param(p::kMix, 0.5f);
    rng_state() = 0xC0FFEEu;
    std::vector<float> bright = noise(6.0f, kRate, 0.2f);
    Stereo wide = run(device, bright);
    const double white_sides = correlation(wide.left, wide.right, from, wide.size());
    const double white_level = db(rms(wide.left, from, wide.size()) / rms(bright, from, bright.size()));
    std::snprintf(label, sizeof label,
                  "white noise, Mix 0.5, everything spread: correlation %.2f (half dry, half copies), level %+.2f dB",
                  white_sides, white_level);
    EXPECT(white_sides > 0.3 && white_sides < 0.7 && std::fabs(white_level) < 1.0, label);
  }

  // Mix 0 is the input, bit for bit.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kFeedback, 0.7f);
    rng_state() = 0xFACEu;
    std::vector<float> dry = noise(1.0f, kRate, 0.5f);
    Stereo out = run(device, dry);
    bool same = true;
    for (size_t i = 0; i < dry.size(); ++i) same = same && out.left[i] == dry[i] && out.right[i] == dry[i];
    EXPECT(same, "Mix 0 passes the input through bit for bit");
  }

  // Width 0 puts both copies in the centre: left equals right, and the level holds.
  {
    device.init(kRate);
    device.set_param(p::kWidth, 0.0f);
    rng_state() = 0xC0FFEEu;
    std::vector<float> dry = pink_noise(4.0f);
    Stereo out = run(device, dry);
    double worst = 0.0;
    for (size_t i = 0; i < out.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - out.right[i]));
    }
    const double level = db(rms(out.left, 48000) / rms(dry, 48000));
    std::snprintf(label, sizeof label, "Width 0: left equals right (max difference %g), level %+.2f dB",
                  worst, level);
    EXPECT(worst < 1.0e-6 && std::fabs(level) < 1.5, label);
  }

  // Turning Detune or Delay while a note sounds bends or crossfades; it
  // never clicks. The yardstick is the steepest step of the note itself.
  {
    std::vector<float> tone = sine(330.0f, 3.0f, kRate, 0.5f);
    const double natural = max_step(tone);
    device.init(kRate);
    run(device, sine(330.0f, 0.5f, kRate, 0.5f));
    Stereo out;
    out.left.reserve(tone.size());
    out.right.reserve(tone.size());
    // Detune swept 0 → 50 → 0 in 60 steps, then Delay jumped about.
    const size_t chunk = tone.size() / 80;
    for (int step = 0; step < 80; ++step) {
      if (step < 60) {
        device.set_param(p::kDetune, 50.0f * (step < 30 ? step : 60 - step) / 30.0f);
      } else {
        const float delays[5] = {60.0f, 12.0f, 33.0f, 15.0f, 48.0f};
        if (step % 4 == 0) device.set_param(p::kDelay, delays[(step - 60) / 4]);
      }
      std::vector<float> piece(tone.begin() + static_cast<long>(step * chunk),
                               tone.begin() + static_cast<long>((step + 1) * chunk));
      out = concat(out, run(device, piece));
    }
    const double moved = std::max(max_step(out.left), max_step(out.right));
    std::snprintf(label, sizeof label,
                  "sweeping Detune and jumping Delay under a note: steepest step %.4f (the note alone %.4f)",
                  moved, natural);
    EXPECT(moved < 1.6 * natural, label);
    EXPECT(device.shifter(0).splices() >= 4, "a Delay jump is made by splicing");
  }

  // Mix, Width, Feedback, Focus and Tone moved under a note do not click either.
  {
    std::vector<float> tone = sine(330.0f, 2.0f, kRate, 0.5f);
    const double natural = max_step(tone);
    device.init(kRate);
    run(device, sine(330.0f, 0.5f, kRate, 0.5f));
    Stereo out;
    const size_t chunk = tone.size() / 40;
    for (int step = 0; step < 40; ++step) {
      const float t = static_cast<float>(step % 8) / 7.0f;
      const float edge = step % 2 == 0 ? 1.0f : 0.0f;
      switch (step / 8) {
        case 0: device.set_param(p::kMix, edge); break;
        case 1: device.set_param(p::kWidth, edge); break;
        case 2: device.set_param(p::kFeedback, 0.7f * edge); break;
        case 3: device.set_param(p::kFocus, 20.0f * std::pow(50.0f, t)); break;
        default: device.set_param(p::kTone, 18000.0f * std::pow(1.0f / 18.0f, t)); break;
      }
      std::vector<float> piece(tone.begin() + static_cast<long>(step * chunk),
                               tone.begin() + static_cast<long>((step + 1) * chunk));
      out = concat(out, run(device, piece));
    }
    const double moved = std::max(max_step(out.left), max_step(out.right));
    std::snprintf(label, sizeof label,
                  "stepping Mix, Width, Feedback, Focus and Tone under a note: steepest step %.4f (the note alone %.4f)",
                  moved, natural);
    EXPECT(moved < 1.6 * natural, label);
  }

  // Feedback detunes each pass again: a held note comes back as a stack of
  // copies one Detune apart, climbing on the left and sinking on the right,
  // each quieter than the last by the Feedback amount. Levels are averaged
  // over short windows: a splice can only line up the strongest copy, so the
  // weaker ones change phase there.
  {
    wet_only(device, 50.0f);
    device.set_param(p::kFeedback, 0.6f);
    Stereo out = run(device, sine(1000.0f, 5.0f, kRate, 0.25f));
    auto average_level = [&](const std::vector<float>& x, double cents) {
      const double hz = 1000.0 * std::pow(2.0, cents / 1200.0);
      double sum = 0.0;
      for (int w = 0; w < 20; ++w) {
        const size_t from = static_cast<size_t>((1.0f + 0.2f * w) * kRate);
        const double level = tone_level(x, hz, kRate, from, from + 9600);
        sum += level * level;
      }
      return std::sqrt(sum / 20.0);
    };
    double left[4], right[4];
    for (int pass = 0; pass < 4; ++pass) {
      left[pass] = average_level(out.left, 50.0 * (pass + 1));
      right[pass] = average_level(out.right, -50.0 * (pass + 1));
    }
    const double wrong_way = average_level(out.left, -50.0);
    std::snprintf(label, sizeof label,
                  "Feedback 0.6: copies at +50, +100, +150, +200 ct fall by %.2f, %.2f, %.2f per pass (right, sinking: %.2f, %.2f, %.2f)",
                  left[1] / left[0], left[2] / left[1], left[3] / left[2], right[1] / right[0],
                  right[2] / right[1], right[3] / right[2]);
    bool stacked = left[0] > 0.1 && right[0] > 0.1;
    for (int pass = 1; pass < 4; ++pass) {
      stacked = stacked && std::fabs(left[pass] / left[pass - 1] - 0.6) < 0.1 &&
                std::fabs(right[pass] / right[pass - 1] - 0.6) < 0.1;
    }
    EXPECT(stacked, label);
    std::snprintf(label, sizeof label, "Feedback: the left side only climbs (%.1f dB at -50 ct)",
                  db(wrong_way / left[0]));
    EXPECT(wrong_way < 0.01 * left[0], label);
  }

  // Feedback at its maximum under full-scale input stays bounded, and dies
  // away once the input stops.
  {
    device.init(kRate);
    device.set_param(p::kFeedback, 0.7f);
    device.set_param(p::kDetune, 50.0f);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kTone, 18000.0f);
    rng_state() = 0xABCDu;
    Stereo loud = run(device, noise(3.0f, kRate, 1.0f));
    Stereo tail = render(device, 6.0f, kRate);
    const double top = std::max(peak(loud.left), peak(loud.right));
    const double ring = rt60(tail.left, kRate, 0.1, 0.1, -100.0);
    std::snprintf(label, sizeof label, "Feedback 0.7 with full-scale noise: peak %.2f, then decays in %.2f s",
                  top, ring);
    EXPECT(finite(loud.left) && finite(loud.right) && top < 4.0 && ring > 0.3 && ring < 3.0, label);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the feedback tail");
    Stereo woken = run(device, impulse(0.25f, kRate, 0.5f));
    EXPECT(peak(woken.left) > 0.1, "wakes on new input");
  }

  // Tone takes the treble off the copies only.
  {
    double share[2];
    for (int pass = 0; pass < 2; ++pass) {
      wet_only(device, 9.0f);
      device.set_param(p::kTone, pass == 0 ? 18000.0f : 2000.0f);
      rng_state() = 0x7007u;
      Stereo out = run(device, noise(2.0f, kRate, 0.3f));
      share[pass] = energy_above(out.left, 5000.0, kRate, 24000);
    }
    std::snprintf(label, sizeof label, "Tone 2 kHz: share of energy above 5 kHz falls from %.2f to %.3f",
                  share[0], share[1]);
    EXPECT(share[0] > 0.2 && share[1] < 0.2 * share[0], label);
  }

  // Drift makes the tuning of each side wander slowly, each on its own
  // curve; with Drift and Detune at zero the copies do not move at all.
  {
    double range[2][2];
    double track[2][18];
    for (int pass = 0; pass < 2; ++pass) {
      wet_only(device, 0.0f);
      device.set_param(p::kDrift, pass == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, sine(1000.0f, 10.0f, kRate, 0.5f));
      for (int side = 0; side < 2; ++side) {
        double low = 1.0e9, high = -1.0e9;
        for (int w = 0; w < 18; ++w) {
          const size_t from = static_cast<size_t>((1.0f + 0.5f * w) * kRate);
          const double hz = peak_frequency(side == 0 ? out.left : out.right, 1000.0, 16.0, from, from + 24000);
          const double offset = cents_between(hz, 1000.0);
          if (pass == 1) track[side][w] = offset;
          low = std::min(low, offset);
          high = std::max(high, offset);
        }
        range[pass][side] = high - low;
      }
    }
    double together = 0.0, left_power = 0.0, right_power = 0.0;
    for (int w = 0; w < 18; ++w) {
      together += track[0][w] * track[1][w];
      left_power += track[0][w] * track[0][w];
      right_power += track[1][w] * track[1][w];
    }
    const double alike = together / std::sqrt(left_power * right_power);
    std::snprintf(label, sizeof label,
                  "Drift: tuning wanders over %.1f ct (left) and %.1f ct (right), sides alike by %.2f; none at zero (%.3f ct)",
                  range[1][0], range[1][1], alike, std::max(range[0][0], range[0][1]));
    EXPECT(range[0][0] < 0.05 && range[0][1] < 0.05 && range[1][0] > 4.0 && range[1][0] < 24.0 &&
               range[1][1] > 4.0 && range[1][1] < 24.0 && std::fabs(alike) < 0.8,
           label);
  }

  // CHECKS

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("micro-shift", 10.0f, kRate, [&] { run(device, input); });

  return finish("micro-shift");
}
