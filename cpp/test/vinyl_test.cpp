// Native harness for Vinyl (cpp/devices/vinyl). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest measures the record: that it adds nothing when everything is off,
// the warp once per turn, crackle, the scratch that comes round, the surface,
// the worn groove, shellac's band, and the platter stopping and starting.

#include "../devices/vinyl/vinyl.h"
#include "support/test_kit.h"

#include <cstdlib>

using namespace testkit;
using livemix::Vinyl;
namespace p = livemix::vinyl;

static Vinyl device;

static const float kRate = 48000.0f;
enum { k33 = 0, k45 = 1, k78 = 2 };

// A new record on a perfect deck: no warp, no noise, no wear. Each check
// turns on the one thing it measures.
static void bare(Vinyl& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWarp, 0.0f);
  d.set_param(p::kCrackle, 0.0f);
  d.set_param(p::kPops, 0.0f);
  d.set_param(p::kSurface, 0.0f);
  d.set_param(p::kWear, 0.0f);
}

static size_t at(double seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(a.size());
  for (size_t i = 0; i < a.size(); ++i) out[i] = a[i] - b[i];
  return out;
}

static std::vector<float> slice(const std::vector<float>& x, size_t from, size_t to) {
  return std::vector<float>(x.begin() + static_cast<long>(from), x.begin() + static_cast<long>(to));
}

static std::vector<float> centred(const std::vector<float>& x) {
  const double m = mean(x);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = static_cast<float>(x[i] - m);
  return out;
}

static double largest(const std::vector<float>& x) { return peak(x); }

// The worst difference between two signals over [from, to).
static double worst_difference(const std::vector<float>& a, const std::vector<float>& b,
                               size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i]));
  }
  return worst;
}

// A tone too quiet to matter that keeps the noise running; it passes
// unchanged when everything else is off, so it subtracts out exactly.
static std::vector<float> carrier(float seconds, float rate = kRate) {
  return sine(100.0f, seconds, rate, 1.0e-4f);
}

// Pitch deviation of a steady tone as a share of its frequency, one value
// per `group` cycles, from the rising zero crossings after `from`.
static std::vector<float> deviation(const std::vector<float>& x, double hz, size_t from, int group,
                                    float rate = kRate) {
  std::vector<double> crossings;
  for (size_t i = from + 1; i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      crossings.push_back(
          (static_cast<double>(i - 1) + (0.0 - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1])) /
          rate);
    }
  }
  std::vector<float> out;
  for (size_t i = static_cast<size_t>(group); i < crossings.size();
       i += static_cast<size_t>(group)) {
    const double measured = group / (crossings[i] - crossings[i - static_cast<size_t>(group)]);
    out.push_back(static_cast<float>(measured / hz - 1.0));
  }
  return out;
}

// The frequency of a tone over [from, to), from its rising zero crossings.
static double pitch(const std::vector<float>& x, size_t from, size_t to) {
  double first = -1.0, last = -1.0;
  int count = 0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double t = static_cast<double>(i - 1) + (0.0 - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
      if (first < 0.0) first = t;
      last = t;
      ++count;
    }
  }
  return count > 1 ? (count - 1) * kRate / (last - first) : 0.0;
}

// Events in a click train: runs of max(|L|, |R|) above `threshold`, a new
// one starting once the level has stayed under it for `gap` samples.
static int count_events(const std::vector<float>& left, const std::vector<float>& right,
                        double threshold, size_t gap, size_t from) {
  int count = 0;
  size_t last = 0;
  bool any = false;
  for (size_t i = from; i < left.size(); ++i) {
    if (std::max(std::fabs(left[i]), std::fabs(right[i])) > threshold) {
      if (!any || i - last > gap) ++count;
      any = true;
      last = i;
    }
  }
  return count;
}

// The largest magnitude in each `bin` samples: where the clicks are.
static std::vector<float> click_envelope(const std::vector<float>& x, size_t from, size_t bin) {
  std::vector<float> out;
  for (size_t i = from; i + bin <= x.size(); i += bin) out.push_back(static_cast<float>(peak(x, i, i + bin)));
  return out;
}

// Normalised autocorrelation at `lag` bins.
static double autocorrelation(const std::vector<float>& x, size_t lag) {
  const double m = mean(x);
  double shifted = 0.0, total = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    total += (x[i] - m) * (x[i] - m);
    if (i + lag < x.size()) shifted += (x[i] - m) * (x[i + lag] - m);
  }
  return total > 0.0 ? shifted / total : 0.0;
}

// With VINYL_REPORT set, print what was measured (for tuning; quiet otherwise).
static void note(const char* what, double value) {
  if (std::getenv("VINYL_REPORT") != nullptr) std::printf("  measured: %s = %.4g\n", what, value);
}

// RMS under and over `hz` by a one-pole split, over [from, end).
static void split_rms(const std::vector<float>& x, double hz, size_t from, double* under, double* over) {
  const double a = std::exp(-2.0 * kPi * hz / kRate);
  double low = 0.0, low_sum = 0.0, high_sum = 0.0;
  for (size_t i = from; i < x.size(); ++i) {
    low = x[i] + (low - x[i]) * a;
    low_sum += low * low;
    high_sum += (x[i] - low) * (x[i] - low);
  }
  *under = std::sqrt(low_sum / static_cast<double>(x.size() - from));
  *over = std::sqrt(high_sum / static_cast<double>(x.size() - from));
}

// The part of `x` over `hz` (one pole).
static std::vector<float> over(const std::vector<float>& x, double hz) {
  const double a = std::exp(-2.0 * kPi * hz / kRate);
  double low = 0.0;
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) {
    low = x[i] + (low - x[i]) * a;
    out[i] = static_cast<float>(x[i] - low);
  }
  return out;
}

// Gain in dB of a quiet tone through the device as it is set now.
static double gain_db(Vinyl& d, float hz, float level = 0.05f) {
  Stereo out = run(d, sine(hz, 0.6f, kRate, level));
  return db(tone_level(out.left, hz, kRate, at(0.2)) / level);
}

// A held five-note chord with ten partials a note; `detune` sets the right
// side apart from the left (the two then beat slowly: a wide pad).
static std::vector<float> chord(float seconds, double detune) {
  const double notes[5] = {110.0, 164.81, 220.0, 277.18, 329.63};
  std::vector<float> out(at(seconds), 0.0f);
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / kRate;
    double sum = 0.0;
    for (int k = 0; k < 5; ++k) {
      for (int h = 1; h <= 10; ++h) {
        sum += std::sin(2.0 * kPi * notes[k] * detune * h * t + 1.7 * k) / std::pow(h, 1.6);
      }
    }
    out[i] = static_cast<float>(0.075 * sum);
  }
  return out;
}

static std::vector<float> half_sum(const std::vector<float>& a, const std::vector<float>& b, float sign) {
  std::vector<float> out(a.size());
  for (size_t i = 0; i < a.size(); ++i) out[i] = 0.5f * (a[i] + sign * b[i]);
  return out;
}

int main() {
  Conformance spec;
  spec.name = "vinyl";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.0f;  // four seconds of surface noise, its fade, and the filters
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // With nothing switched on the record adds nothing: the output is the
  // input, at every sample rate, and at any Mix.
  {
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      bare(device, rate);
      rng_state() = 0xC0FFEEu;
      const std::vector<float> left = noise(1.0f, rate, 0.5f), right = noise(1.0f, rate, 0.5f);
      Stereo out = run(device, left, right);
      char label[96];
      std::snprintf(label, sizeof label, "everything off at %.0f Hz: the output is the input", rate);
      EXPECT(worst_difference(out.left, left) < 1.0e-6 && worst_difference(out.right, right) < 1.0e-6,
             label);
    }
    bare(device);
    device.set_param(p::kSpeed, static_cast<float>(k45));
    device.set_param(p::kMix, 0.5f);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> left = noise(1.0f, kRate, 0.5f), right = noise(1.0f, kRate, 0.5f);
    Stereo half = run(device, left, right);
    EXPECT(worst_difference(half.left, left) < 1.0e-6 && worst_difference(half.right, right) < 1.0e-6,
           "everything off at 45, Mix 0.5: still the input (the record is in time with the dry signal)");

    // Mix 0 with the default patch (warp, wear and noise all on) is the dry signal, exactly.
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    Stereo dry = run(device, left, right);
    EXPECT(dry.left == left && dry.right == right, "Mix 0 is the input, bit for bit");
  }

  // Warp: the pitch rises and falls once per turn, at each speed's rate, by
  // an amount that follows the control (its square), up to 3 %.
  {
    const std::vector<float> in = sine(1000.0f, 40.0f, kRate, 0.25f);
    const double turns[3] = {33.3333 / 60.0, 0.75, 1.3};
    static const char* names[3] = {"33", "45", "78"};
    std::vector<float> full;
    for (int speed = 0; speed < 3; ++speed) {
      bare(device);
      device.set_param(p::kSpeed, static_cast<float>(speed));
      device.set_param(p::kWarp, 1.0f);
      // One value every 20 cycles: 50 a second.
      const std::vector<float> wobble = deviation(run(device, in).left, 1000.0, at(0.5), 20);
      char label[96];
      std::snprintf(label, sizeof label, "%s rpm: the warp comes round at %.3f Hz", names[speed], turns[speed]);
      EXPECT_NEAR(dominant_frequency(centred(wobble), 50.0, 0.2, 5.0), turns[speed], 0.03 * turns[speed],
                  label);
      std::snprintf(label, sizeof label, "%s rpm, Warp 1: pitch swings by 2.4 to 3 %% at its widest", names[speed]);
      EXPECT(largest(wobble) > 0.024 && largest(wobble) < 0.0305, label);
      if (speed == k33) full = wobble;
    }
    EXPECT(1200.0 * std::log2(1.0 + largest(full)) > 40.0, "Warp 1 is more than 40 cents");

    bare(device);
    device.set_param(p::kWarp, 0.5f);
    const std::vector<float> half = deviation(run(device, in).left, 1000.0, at(0.5), 20);
    EXPECT_NEAR(rms(centred(half)) / rms(centred(full)), 0.25, 0.02, "Warp 0.5 is a quarter of the deviation");

    device.init(kRate);
    device.set_param(p::kCrackle, 0.0f);
    device.set_param(p::kPops, 0.0f);
    device.set_param(p::kSurface, 0.0f);
    device.set_param(p::kWear, 0.0f);
    const std::vector<float> stock = deviation(run(device, in).left, 1000.0, at(0.5), 20);
    EXPECT(largest(stock) > 0.001 && largest(stock) < 0.0025,
           "the default warp is a good pressing: between 0.1 and 0.25 % at its widest");

    bare(device);
    const std::vector<float> still = deviation(run(device, sine(1000.0f, 4.0f, kRate, 0.25f)).left, 1000.0, at(0.5), 20);
    EXPECT(largest(still) < 0.00002, "Warp 0: the pitch is steady");

    // The read keeps its treble while the head moves: a 15 kHz tone at
    // 44.1 kHz holds its level, and does not flutter as the fraction turns.
    bare(device, 44100.0f);
    device.set_param(p::kWarp, 0.5f);
    Stereo high = run(device, sine(15000.0f, 4.0f, 44100.0f, 0.25f));
    double quietest = 1.0e9, loudest = 0.0;
    for (size_t i = 44100; i + 88 <= high.size(); i += 88) {
      const double level = rms(high.left, i, i + 88);
      quietest = std::min(quietest, level);
      loudest = std::max(loudest, level);
    }
    note("15 kHz through the warp at 44.1 kHz: level (dB)", db(rms(high.left, 44100) / (0.25 * 0.70711)));
    note("15 kHz through the warp at 44.1 kHz: ripple (dB)", db(loudest / quietest));
    EXPECT_NEAR(db(rms(high.left, 44100) / (0.25 * 0.70711)), 0.0, 0.2, "the warped read keeps 15 kHz at its level");
    EXPECT(db(loudest / quietest) < 0.4, "and steady within 0.4 dB as the read point moves");

    // The same at 96 kHz.
    bare(device, 96000.0f);
    device.set_param(p::kWarp, 1.0f);
    const std::vector<float> fast =
        deviation(run(device, sine(1000.0f, 20.0f, 96000.0f, 0.25f)).left, 1000.0, at(0.5, 96000.0f), 20, 96000.0f);
    EXPECT_NEAR(dominant_frequency(centred(fast), 50.0, 0.2, 5.0), turns[0], 0.03 * turns[0],
                "96 kHz: the warp still comes round at 0.556 Hz");
    EXPECT(largest(fast) > 0.024 && largest(fast) < 0.0305, "96 kHz: and is as deep");
  }

  // Crackle: a Poisson stream whose rate follows the control, with a few
  // events standing far above the rest, and no fixed place in the image.
  {
    const std::vector<float> in = carrier(40.0f);
    double counted[3];
    int which = 0;
    for (float crackle : {0.1f, 0.2f, 0.5f}) {
      bare(device);
      device.set_param(p::kCrackle, crackle);
      Stereo out = run(device, in);
      const std::vector<float> left = minus(out.left, in), right = minus(out.right, in);
      // Every event shows on one wall or the other at 0.7 of its size or more.
      counted[which] = count_events(left, right, 0.3 * Vinyl::crackle_floor(crackle), 12, at(1.0)) / 39.0;
      char label[96];
      std::snprintf(label, sizeof label, "Crackle %.1f: about %.0f events a second", crackle,
                    Vinyl::crackle_rate(crackle));
      EXPECT_NEAR(counted[which], Vinyl::crackle_rate(crackle), 0.15 * Vinyl::crackle_rate(crackle), label);
      if (crackle == 0.5f) {
        // Heavy tailed: the median event is near the floor, the loudest 20 dB above it
        // (30 dB at Crackle 1, below: the spread opens with the control).
        EXPECT(peak(left, at(1.0)) > 10.0 * Vinyl::crackle_floor(crackle),
               "the loudest tick is 20 dB above the dust");
        EXPECT(std::max(peak(left, at(1.0)), peak(right, at(1.0))) < 1.15 * Vinyl::crackle_ceiling(crackle),
               "and none is over the ceiling for that setting");
        EXPECT(rms(left, at(1.0)) < 2.0 * Vinyl::crackle_floor(crackle),
               "and most of the time there is almost nothing: the level is under twice the smallest tick");
        EXPECT(peak(left, at(1.0)) < 0.2, "the loudest tick at Crackle 0.5 stays under -14 dBFS");
      }
      ++which;
    }
    EXPECT(counted[0] < counted[1] && counted[1] < counted[2], "more Crackle, more ticks");

    bare(device);
    device.set_param(p::kCrackle, 1.0f);
    Stereo out = run(device, in);
    const std::vector<float> left = minus(out.left, in), right = minus(out.right, in);
    EXPECT(std::fabs(correlation(left, right, at(1.0))) < 0.25,
           "ticks fall anywhere between the walls: left and right are uncorrelated");
    EXPECT(rms(left, at(1.0)) > 0.3 * rms(right, at(1.0)) && rms(right, at(1.0)) > 0.3 * rms(left, at(1.0)),
           "and both sides get their share");
    EXPECT(peak(left) < 0.5 && peak(right) < 0.5, "Crackle 1: no tick over -6 dBFS");
    EXPECT(peak(left, at(1.0)) > 30.0 * Vinyl::crackle_floor(1.0f), "Crackle 1: the loudest tick is 30 dB above the dust");

    // Low on the control the crackle is a bed, not a string of loud ticks:
    // at the default setting nothing is over -37 dBFS, and the sizes thin
    // out towards the largest instead of piling up there.
    {
      const float stock = p::kParamDefault[p::kCrackle];
      bare(device);
      device.set_param(p::kCrackle, stock);
      Stereo bed = run(device, in);
      const std::vector<float> bed_left = minus(bed.left, in), bed_right = minus(bed.right, in);
      const double ceiling = Vinyl::crackle_ceiling(stock);
      const double loudest = std::max(peak(bed_left, at(1.0)), peak(bed_right, at(1.0)));
      note("default Crackle: loudest tick in 39 s (dB)", db(loudest));
      EXPECT(ceiling < 0.0142 && loudest < 1.15 * ceiling, "default Crackle: no tick over -37 dBFS");
      EXPECT(loudest > 4.0 * Vinyl::crackle_floor(stock), "default Crackle: but some stand 12 dB over the dust");
      const int near_top = count_events(bed_left, bed_right, 0.8 * ceiling, 12, at(1.0));
      const int upper = count_events(bed_left, bed_right, 0.4 * ceiling, 12, at(1.0));
      note("default Crackle: events over 0.8 of the ceiling", near_top);
      note("default Crackle: events over 0.4 of the ceiling", upper);
      EXPECT(upper > 40 && near_top < 0.25 * upper,
             "default Crackle: the largest ticks are the rarest (no pile of them at one size)");
    }
    EXPECT(energy_above(left, 1000.0, kRate, at(1.0)) > 0.7, "ticks are short: their energy is above 1 kHz");

    bare(device);
    Stereo none = run(device, carrier(2.0f));
    EXPECT(worst_difference(none.left, carrier(2.0f)) == 0.0, "Crackle 0, Pops 0, Surface 0: nothing added");
  }

  // Pops: a scratch comes round at the same place on every turn, so the
  // click train repeats at the turn's period and at no other.
  {
    const std::vector<float> in = carrier(40.0f);
    const double period[3] = {1.8, 4.0 / 3.0, 1.0 / 1.3};
    static const char* names[3] = {"33", "45", "78"};
    for (int speed = 0; speed < 3; ++speed) {
      bare(device);
      device.set_param(p::kSpeed, static_cast<float>(speed));
      device.set_param(p::kPops, 0.6f);
      Stereo out = run(device, in);
      const std::vector<float> clicks = click_envelope(minus(out.left, in), at(1.0), 240);  // 5 ms bins
      auto lag = [&](double seconds) { return static_cast<size_t>(seconds / 0.005 + 0.5); };
      const double on = autocorrelation(clicks, lag(period[speed]));
      const double off = std::max({std::fabs(autocorrelation(clicks, lag(0.62 * period[speed]))),
                                   std::fabs(autocorrelation(clicks, lag(0.8 * period[speed]))),
                                   std::fabs(autocorrelation(clicks, lag(1.25 * period[speed])))});
      if (speed == 0) note("scratch: click-train autocorrelation at one turn, 33", on);
      if (speed == 0) note("scratch: largest autocorrelation off the turn, 33", off);
      char label[96];
      std::snprintf(label, sizeof label, "%s rpm: the clicks repeat every %.3f s (autocorrelation %.2f)",
                    names[speed], period[speed], on);
      EXPECT(on > 0.25, label);
      std::snprintf(label, sizeof label, "%s rpm: and at no other spacing (%.2f)", names[speed], off);
      EXPECT(off < 0.1 && off < 0.3 * on, label);
    }

    // A pop has a thump under it, and is bigger than any tick of the dust.
    bare(device);
    device.set_param(p::kPops, 1.0f);
    Stereo out = run(device, in);
    const std::vector<float> left = minus(out.left, in), right = minus(out.right, in);
    EXPECT(peak(left) > 0.12 && peak(left) < 0.4, "Pops 1: the largest pop is between -18 and -8 dBFS");
    EXPECT(energy_above(left, 300.0, kRate, at(1.0)) < 0.9, "a pop carries a low thump: a tenth of its energy or more is under 300 Hz");
    EXPECT(correlation(left, right, at(1.0)) > 0.3, "the thump sits in the middle");
  }

  // Surface: hiss at -40 dBFS at the top of the control, each wall its own,
  // swishing once per turn, over a rumble the walls mostly share.
  {
    const std::vector<float> in = carrier(30.0f);
    double hiss[3], rumble[3];
    int which = 0;
    for (float surface : {1.0f, 0.5f}) {
      bare(device);
      device.set_param(p::kSurface, surface);
      Stereo out = run(device, in);
      const std::vector<float> left = minus(out.left, in), right = minus(out.right, in);
      split_rms(left, 150.0, at(1.0), &rumble[which], &hiss[which]);
      if (surface == 1.0f) {
        const std::vector<float> high_left = over(left, 150.0), high_right = over(right, 150.0);
        EXPECT(std::fabs(correlation(high_left, high_right, at(1.0))) < 0.1, "each wall has its own hiss");
        const std::vector<float> low_left = minus(left, high_left), low_right = minus(right, high_right);
        EXPECT(correlation(low_left, low_right, at(1.0)) > 0.3, "the rumble is mostly shared");
        EXPECT(rms(low_left, at(1.0)) > 0.0 && tone_level(left, 8.0, kRate, at(1.0)) < 0.25 * rumble[which],
               "the rumble is cut under 20 Hz");
        // The hiss's level in 50 ms steps: it rises and falls once per turn.
        std::vector<float> level;
        for (size_t i = at(1.0); i + 2400 <= high_left.size(); i += 2400) {
          level.push_back(static_cast<float>(rms(high_left, i, i + 2400)));
        }
        EXPECT_NEAR(dominant_frequency(centred(level), 20.0, 0.2, 3.0), 33.3333 / 60.0, 0.02,
                    "the hiss swishes once per turn");
        const double swing = tone_level(centred(level), 33.3333 / 60.0, 20.0) / mean(level);
        note("hiss swish depth", swing);
        EXPECT(swing > 0.2 && swing < 0.4, "by about 30 % either way");
      }
      ++which;
    }
    note("hiss at Surface 1 (dB)", db(hiss[0]));
    note("rumble at Surface 1 (dB)", db(rumble[0]));
    EXPECT_NEAR(db(hiss[0]), -40.5, 1.5, "Surface 1: hiss near -40 dBFS");
    EXPECT_NEAR(db(rumble[0]), -45.0, 2.0, "Surface 1: rumble near -45 dBFS");
    EXPECT_NEAR(db(hiss[0] / hiss[1]), 12.0, 0.5, "Surface 0.5 is 12 dB quieter");

    bare(device);
    device.set_param(p::kSurface, 1.0f);
    device.set_param(p::kSpeed, static_cast<float>(k78));
    Stereo shellac = run(device, in);
    split_rms(minus(shellac.left, in), 150.0, at(1.0), &rumble[2], &hiss[2]);
    note("hiss at 78 over 33 (dB)", db(hiss[2] / hiss[0]));
    EXPECT(db(hiss[2] / hiss[0]) > 3.0, "shellac is noisier: 3 dB more hiss or better, band limited as it is");
    double deep[2], rest;
    bare(device);
    device.set_param(p::kSurface, 1.0f);
    Stereo vinyl = run(device, in);
    split_rms(minus(vinyl.left, in), 50.0, at(1.0), &deep[0], &rest);
    split_rms(minus(shellac.left, in), 50.0, at(1.0), &deep[1], &rest);
    note("deep rumble at 78 over 33 (dB)", db(deep[1] / deep[0]));
    EXPECT(deep[1] < 0.5 * deep[0], "and has no deep rumble: 6 dB less under 50 Hz, for all its extra hiss");
  }

  // The noise belongs to the record, not the room: it runs while there is
  // signal and for four seconds after, then fades and the device sleeps.
  {
    device.init(kRate);
    device.set_param(p::kSurface, 1.0f);
    device.set_param(p::kCrackle, 1.0f);
    Stereo idle = render(device, 1.0f, kRate);
    EXPECT(peak(idle.left) == 0.0 && peak(idle.right) == 0.0, "no input, no noise: an idle track is silent");

    std::vector<float> in = sine(440.0f, 0.5f, kRate, 0.2f);
    in.resize(at(8.0), 0.0f);
    Stereo out = run(device, in);
    EXPECT(rms(out.left, at(3.5), at(4.4)) > 0.003, "3 to 3.9 s after the last note the surface is still there");
    EXPECT(rms(out.left, at(5.3), at(5.6)) < 0.5 * rms(out.left, at(3.5), at(4.4)), "by 5 s after it, it is fading");
    EXPECT(peak(out.left, at(6.3)) == 0.0 && peak(out.right, at(6.3)) == 0.0,
           "5.8 s after it the output is exactly zero");
    Stereo woken = run(device, sine(440.0f, 1.0f, kRate, 0.2f));
    EXPECT(tone_level(woken.left, 440.0, kRate, at(0.3)) > 0.1, "wakes on new input");
    EXPECT(rms(minus(woken.left, sine(440.0f, 1.0f, kRate, 0.2f)), at(0.5)) > 0.003, "and the surface comes back with it");
  }

  // Wear: the top goes, the bass folds to the middle, the image narrows.
  {
    rng_state() = 0xBEEFu;
    const std::vector<float> hiss = noise(2.0f, kRate, 0.25f);
    double bright[3];
    int which = 0;
    for (float wear : {0.0f, 0.5f, 1.0f}) {
      bare(device);
      device.set_param(p::kWear, wear);
      bright[which++] = energy_above(run(device, hiss).left, 8000.0, kRate, at(0.5));
    }
    note("energy above 8 kHz, Wear 0", bright[0]);
    note("energy above 8 kHz, Wear 1", bright[2]);
    EXPECT(bright[1] < 0.8 * bright[0] && bright[2] < 0.6 * bright[1] && bright[2] < 0.3 * bright[0],
           "more Wear, less energy above 8 kHz: under a third of it at Wear 1");
    bare(device);
    device.set_param(p::kWear, 1.0f);
    EXPECT_NEAR(gain_db(device, 12000.0f), -17.8, 1.0, "Wear 1: 12 kHz is down 18 dB");
    bare(device);
    device.set_param(p::kWear, 1.0f);
    EXPECT_NEAR(gain_db(device, 500.0f), 0.0, 0.2, "and 500 Hz is where it was");

    const std::vector<float> low = sine(60.0f, 1.0f, kRate, 0.25f), mid = sine(1000.0f, 1.0f, kRate, 0.25f);
    std::vector<float> low_flipped(low.size()), mid_flipped(mid.size());
    for (size_t i = 0; i < low.size(); ++i) {
      low_flipped[i] = -low[i];
      mid_flipped[i] = -mid[i];
    }
    bare(device);
    device.set_param(p::kWear, 1.0f);
    Stereo out = run(device, low, low_flipped);
    note("60 Hz out of phase, Wear 1 (dB)", db(tone_level(out.left, 60.0, kRate, at(0.5)) / 0.25));
    EXPECT(db(tone_level(out.left, 60.0, kRate, at(0.5)) / 0.25) < -15.0,
           "Wear 1: 60 Hz out of phase between the sides is taken down 15 dB");
    bare(device);
    device.set_param(p::kWear, 1.0f);
    out = run(device, low, silence(1.0f, kRate));
    EXPECT(correlation(out.left, out.right, at(0.5)) > 0.95, "60 Hz on the left alone comes out in the middle");
    EXPECT_NEAR(db(tone_level(out.left, 60.0, kRate, at(0.5)) / tone_level(out.right, 60.0, kRate, at(0.5))), 0.0, 2.5,
                "at nearly the same level on both sides");
    bare(device);
    device.set_param(p::kWear, 1.0f);
    out = run(device, mid, mid_flipped);
    note("1 kHz out of phase, Wear 1 (dB)", db(tone_level(out.left, 1000.0, kRate, at(0.5)) / 0.25));
    EXPECT_NEAR(db(tone_level(out.left, 1000.0, kRate, at(0.5)) / 0.25), -3.8, 0.7,
                "1 kHz out of phase loses under 5 dB: the image narrows a little, it does not fold");
    bare(device);
    out = run(device, low, low_flipped);
    EXPECT(worst_difference(out.left, low) < 1.0e-6, "Wear 0 leaves the bass where it was");
  }

  // Tracing distortion: the walls push the tip opposite ways, so a tone in
  // the middle grows a second harmonic on the difference channel and a
  // third in the middle, both rising with level and with frequency.
  {
    auto harmonics = [&](float wear, float hz, float level, double* second, double* third, float rate = kRate) {
      bare(device, rate);
      device.set_param(p::kWear, wear);
      Stereo out = run(device, sine(hz, 1.0f, rate, level));
      const size_t from = static_cast<size_t>(0.5f * rate);
      const double first = tone_level(half_sum(out.left, out.right, 1.0f), hz, rate, from);
      *second = db(tone_level(half_sum(out.left, out.right, -1.0f), 2.0 * hz, rate, from) / first);
      *third = db(tone_level(half_sum(out.left, out.right, 1.0f), 3.0 * hz, rate, from) / first);
      return correlation(out.left, out.right, from);
    };
    double second, third, second_quiet, third_quiet, second_low, third_low;
    const double together = harmonics(1.0f, 1000.0f, 0.5f, &second, &third);
    note("Wear 1, 1 kHz at -6 dBFS: second harmonic on the difference (dB)", second);
    note("Wear 1, 1 kHz at -6 dBFS: third harmonic in the middle (dB)", third);
    EXPECT(second > -32.0 && second < -20.0, "Wear 1: 1 kHz at -6 dBFS has a second harmonic 20 to 32 dB down");
    EXPECT(third > -40.0 && third < -26.0, "and a third 26 to 40 dB down");
    EXPECT(together > 0.99, "the sides still agree: correlation over 0.99");
    harmonics(1.0f, 1000.0f, 0.125f, &second_quiet, &third_quiet);
    EXPECT_NEAR(second - second_quiet, 12.0, 1.0, "12 dB less level, 12 dB less second harmonic");
    EXPECT_NEAR(third - third_quiet, 24.0, 2.0, "and 24 dB less third");
    harmonics(1.0f, 300.0f, 0.5f, &second_low, &third_low);
    EXPECT(second_low < second - 7.0, "a 300 Hz tone distorts 7 dB less than 1 kHz: it is the highs that smear");
    harmonics(0.0f, 1000.0f, 0.5f, &second, &third);
    EXPECT(second < -100.0 && third < -100.0, "Wear 0 is clean");

    // What the squares and cubes make above half the sample rate is kept
    // out: the worst fold-back of a loud high tone at 44.1 kHz.
    double worst = -200.0;
    for (float hz : {7600.0f, 9000.0f, 11500.0f, 13000.0f}) {
      bare(device, 44100.0f);
      device.set_param(p::kWear, 1.0f);
      Stereo out = run(device, sine(hz, 1.0f, 44100.0f, 0.5f));
      const double first = 0.5;  // against the tone as it went in
      const double folded_second = 44100.0 - 2.0 * hz, folded_third = 44100.0 - 3.0 * hz;
      if (2.0 * hz > 22050.0) worst = std::max(worst, db(tone_level(out.left, folded_second, 44100.0, 22050) / first));
      if (3.0 * hz > 22050.0 && folded_third > 0.0) {
        worst = std::max(worst, db(tone_level(out.left, folded_third, 44100.0, 22050) / first));
      }
    }
    note("worst fold-back at 44.1 kHz, Wear 1 (dB under the input tone)", worst);
    EXPECT(worst < -60.0, "fold-back of the distortion stays 60 dB under a loud high tone");
  }

  // 78: shellac's band, 150 Hz to 6 kHz, and nearly one channel.
  {
    auto response = [&](float hz) {
      bare(device);
      device.set_param(p::kSpeed, static_cast<float>(k78));
      return gain_db(device, hz);
    };
    const double centre = response(1000.0f);
    note("78: 1 kHz (dB)", centre);
    EXPECT_NEAR(centre, 2.0, 1.0, "78: a small lift at 1 kHz");
    EXPECT_NEAR(response(150.0f) - response(400.0f), -3.0, 1.5, "78: 3 dB down at 150 Hz");
    EXPECT_NEAR(response(6000.0f) - response(3000.0f), -3.0, 1.5, "78: 3 dB down at 6 kHz");
    EXPECT(response(50.0f) < -15.0, "78: 50 Hz is gone");
    EXPECT(response(12000.0f) < -25.0, "78: 12 kHz is gone");
    bare(device);
    device.set_param(p::kSpeed, static_cast<float>(k78));
    Stereo out = run(device, sine(1000.0f, 1.0f, kRate, 0.25f), silence(1.0f, kRate));
    note("78: left-only tone, right over left (dB)", db(rms(out.right, at(0.5)) / rms(out.left, at(0.5))));
    EXPECT(db(rms(out.right, at(0.5)) / rms(out.left, at(0.5))) > -6.0 && correlation(out.left, out.right, at(0.5)) > 0.95,
           "78: a tone on the left alone comes out on both sides, within 6 dB");
    bare(device);
    device.set_param(p::kSpeed, static_cast<float>(k45));
    EXPECT_NEAR(gain_db(device, 12000.0f), 0.0, 0.01, "45 is as wide as 33");
  }

  // Tone tilts the playback about 800 Hz.
  {
    auto response = [&](float tone, float hz) {
      bare(device);
      device.set_param(p::kTone, tone);
      return gain_db(device, hz);
    };
    EXPECT_NEAR(response(1.0f, 8000.0f), 6.0, 0.5, "Tone 1: 8 kHz up 6 dB");
    EXPECT_NEAR(response(1.0f, 80.0f), -3.5, 0.5, "Tone 1: 80 Hz down 3.5 dB");
    EXPECT_NEAR(response(-1.0f, 8000.0f), -6.0, 0.5, "Tone -1: 8 kHz down 6 dB");
    EXPECT_NEAR(response(-1.0f, 80.0f), 3.5, 0.5, "Tone -1: 80 Hz up 3.5 dB");
    EXPECT_NEAR(response(1.0f, 800.0f), 0.0, 0.5, "the middle stays put");
    EXPECT_NEAR(response(0.5f, 8000.0f), 3.0, 0.4, "Tone 0.5 is half of it");
  }

  // Platter: Stop lets the pitch and the level fall together to nothing
  // over Spin Time; Play brings them back in half that, and then the
  // output is the live input again. Nothing clicks.
  {
    const float hz = 440.0f;
    const std::vector<float> tone = sine(hz, 14.0f, kRate, 0.5f);
    const double steady = 0.5 * 2.0 * kPi * hz / kRate;  // the tone's own largest step
    for (float spin : {0.2f, 1.5f, 6.0f}) {
      char label[128];
      bare(device);
      device.set_param(p::kSpin, spin);
      const size_t stop_at = at(1.0), start_at = stop_at + at(spin + 1.0);
      run(device, slice(tone, 0, stop_at));
      device.set_param(p::kPlatter, 1.0f);
      Stereo down = run(device, slice(tone, stop_at, start_at));
      device.set_param(p::kPlatter, 0.0f);
      Stereo up = run(device, slice(tone, start_at, tone.size()));

      const size_t window = std::max(at(0.03), at(0.05 * spin));
      const double early = pitch(down.left, at(0.20 * spin), at(0.20 * spin) + window);
      const double late = pitch(down.left, at(0.50 * spin), at(0.50 * spin) + window);
      std::snprintf(label, sizeof label, "Spin %.1f s, Stop: the pitch falls (%.0f Hz a fifth of the way, %.0f Hz half way)",
                    spin, early, late);
      EXPECT(early < 0.8 * hz && early > 0.5 * hz && late < 0.5 * hz && late > 0.2 * hz, label);
      std::snprintf(label, sizeof label, "Spin %.1f s, Stop: the level falls with it", spin);
      EXPECT(rms(down.left, at(0.5 * spin), at(0.5 * spin) + window) < 0.75 * 0.3536 &&
                 rms(down.left, at(0.9 * spin), at(0.95 * spin)) < 0.25 * 0.3536,
             label);
      std::snprintf(label, sizeof label, "Spin %.1f s, Stop: silent once the platter has stopped", spin);
      EXPECT(peak(down.left, at(spin) + 2) == 0.0 && peak(down.right, at(spin) + 2) == 0.0, label);
      std::snprintf(label, sizeof label, "Spin %.1f s, Stop: no click (largest step %.4f, the tone's own %.4f)", spin,
                    max_step(down.left), steady);
      EXPECT(max_step(down.left) < 1.05 * steady, label);

      const float rise = 0.5f * spin;
      const double quarter = pitch(up.left, at(0.25 * rise), at(0.25 * rise) + window / 2);
      const double most = pitch(up.left, at(0.75 * rise), at(0.75 * rise) + window / 2);
      std::snprintf(label, sizeof label, "Spin %.1f s, Play: the pitch climbs back (%.0f Hz, then %.0f Hz)", spin,
                    quarter, most);
      EXPECT(quarter > 0.25 * hz && quarter < 0.6 * hz && most > 0.75 * hz && most < 0.97 * hz, label);
      // Back at speed, a 50 ms fade puts the head on the live input.
      const std::vector<float> live = slice(tone, start_at, tone.size());
      std::snprintf(label, sizeof label, "Spin %.1f s, Play: live again %.2f s after the switch", spin, rise + 0.06f);
      EXPECT(worst_difference(up.left, live, at(rise + 0.06)) < 1.0e-6, label);
      std::snprintf(label, sizeof label, "Spin %.1f s, Play: no click (largest step %.4f)", spin, max_step(up.left));
      EXPECT(max_step(up.left) < 1.05 * steady, label);
    }

    // The same times at 96 kHz.
    {
      const float rate = 96000.0f;
      const std::vector<float> fast = sine(hz, 4.0f, rate, 0.5f);
      bare(device, rate);
      device.set_param(p::kSpin, 1.0f);
      run(device, slice(fast, 0, at(0.5, rate)));
      device.set_param(p::kPlatter, 1.0f);
      Stereo down = run(device, slice(fast, at(0.5, rate), at(2.0, rate)));
      device.set_param(p::kPlatter, 0.0f);
      Stereo up = run(device, slice(fast, at(2.0, rate), fast.size()));
      EXPECT(peak(down.left, at(1.0, rate) + 2) == 0.0 && peak(down.left, at(0.9, rate), at(0.99, rate)) > 0.0,
             "96 kHz: the platter stops in Spin Time, not sooner or later");
      EXPECT(worst_difference(up.left, slice(fast, at(2.0, rate), fast.size()), at(0.56, rate)) < 1.0e-6,
             "96 kHz: and is live again half of it (and the fade) after Play");
    }

    // The noise goes down with the platter, and the dry signal does not.
    bare(device);
    device.set_param(p::kSurface, 1.0f);
    device.set_param(p::kCrackle, 1.0f);
    device.set_param(p::kPops, 1.0f);
    device.set_param(p::kSpin, 0.5f);
    run(device, slice(tone, 0, at(1.0)));
    device.set_param(p::kPlatter, 1.0f);
    Stereo stopped = run(device, slice(tone, at(1.0), at(3.0)));
    EXPECT(peak(stopped.left, at(0.5) + 2) == 0.0, "a stopped record makes no noise either");
    bare(device);
    device.set_param(p::kMix, 0.5f);
    device.set_param(p::kPlatter, 1.0f);
    Stereo both = run(device, slice(tone, 0, at(3.0)));
    EXPECT_NEAR(tone_level(both.left, hz, kRate, at(2.0)), 0.25, 0.001, "Mix 0.5 with the platter stopped: half the dry signal");

    // Switched at random moments for five minutes, with the warp at its
    // widest and Spin Time changing: finite, bounded, and never a click.
    for (float spin : {-1.0f, 6.0f}) {
      bare(device);
      device.set_param(p::kWarp, 1.0f);
      if (spin > 0.0f) device.set_param(p::kSpin, spin);
      rng_state() = 0xABCDEu;
      const std::vector<float> longer = sine(hz, 300.0f, kRate, 0.5f);
      size_t done = 0;
      double worst_step = 0.0, worst_peak = 0.0;
      bool ok = true;
      for (int k = 0; done + at(2.0) < longer.size(); ++k) {
        device.set_param(p::kPlatter, static_cast<float>((k & 1) == 0 ? 1 : 0));
        if (spin < 0.0f && k % 7 == 0) device.set_param(p::kSpin, 0.2f + 5.8f * (0.5f + 0.5f * white()));
        // At 6 s the platter is switched every half second and never reaches speed.
        const size_t length = spin > 0.0f ? at(0.5) : at(0.02 + 1.5 * (0.5 + 0.5 * white()) * (0.5 + 0.5 * white()));
        Stereo out = run(device, slice(longer, done, done + length));
        done += length;
        ok = ok && finite(out.left) && finite(out.right);
        worst_step = std::max(worst_step, max_step(out.left));
        worst_peak = std::max(worst_peak, peak(out.left));
      }
      note("stop/start abuse: largest step over the tone's own", worst_step / steady);
      EXPECT(ok && worst_peak < 0.6, spin > 0.0f ? "hovering below speed for five minutes: finite and bounded"
                                                : "random stops and starts for five minutes: finite and bounded");
      EXPECT(worst_step < 1.1 * steady, spin > 0.0f ? "hovering: the head skips back to the live input without a click"
                                                    : "random stops and starts: never a click");
    }
  }

  // Moving controls while a tone sounds does not click: the largest step
  // during each change is no more than the settings before or after it
  // make on their own. (The noise is off: clicks are its business.)
  {
    const std::vector<float> tone = sine(220.0f, 0.4f, kRate, 0.5f);  // whole cycles: runs join up
    bare(device);
    device.set_param(p::kWarp, 0.5f);
    device.set_param(p::kWear, 0.3f);
    run(device, tone);
    double settled = max_step(run(device, tone).left);
    auto change = [&](int id, float value, const char* what) {
      device.set_param(id, value);
      const double during = max_step(run(device, tone).left);
      run(device, tone);
      const double after = max_step(run(device, tone).left);
      EXPECT(during < 1.25 * std::max(settled, after) + 0.002, what);
      settled = after;
    };
    change(p::kSpeed, static_cast<float>(k78), "Speed to 78 fades across");
    change(p::kSpeed, static_cast<float>(k33), "Speed to 33 fades across");
    change(p::kSpeed, static_cast<float>(k45), "Speed to 45 glides");
    change(p::kWarp, 1.0f, "Warp up glides");
    change(p::kWarp, 0.0f, "Warp off glides");
    change(p::kWear, 1.0f, "Wear up glides");
    change(p::kTone, 1.0f, "Tone up glides");
    change(p::kTone, -1.0f, "Tone down glides");
    change(p::kWear, 0.0f, "Wear off glides");
    change(p::kMix, 0.5f, "Mix glides");
    change(p::kTone, 0.0f, "Tone to centre glides");
    change(p::kSurface, 0.0f, "Surface stays off");
    change(p::kMix, 1.0f, "Mix back glides");

    // Warp swept end to end, a hundred steps a second, with the record
    // against the dry signal: no step larger than the tone's own.
    bare(device);
    device.set_param(p::kMix, 0.5f);
    const std::vector<float> held = sine(220.0f, 4.0f, kRate, 0.5f);
    double worst = 0.0;
    for (int k = 0; k < 400; ++k) {
      device.set_param(p::kWarp, k < 200 ? k / 200.0f : (400 - k) / 200.0f);
      worst = std::max(worst, max_step(run(device, slice(held, k * 480u, (k + 1) * 480u)).left));
    }
    note("Warp sweep: largest step over the tone's own", worst / (0.5 * 2.0 * kPi * 220.0 / kRate));
    EXPECT(worst < 1.1 * 0.5 * 2.0 * kPi * 220.0 / kRate, "sweeping Warp never clicks or zips");
  }

  // The default patch: a clean record with a little life in it.
  {
    device.init(kRate);
    const std::vector<float> tone = sine(440.0f, 6.0f, kRate, 0.25f);
    Stereo out = run(device, tone);
    note("default patch, 440 Hz: level against dry (dB)", db(rms(out.left, at(1.0)) / rms(tone, at(1.0))));
    EXPECT_NEAR(db(rms(out.left, at(1.0)) / rms(tone, at(1.0))), 0.0, 0.3, "default: a tone keeps its level");
    EXPECT(correlation(out.left, out.right, at(1.0)) > 0.98, "default: a mono source stays in the middle");
    EXPECT(std::fabs(mean(out.left, at(1.0))) < 1.0e-4, "default: no DC");

    // A wide pad (the sides detuned against each other) loses a little: its
    // bass is pulled to the middle and its image narrowed.
    device.init(kRate);
    const std::vector<float> left = chord(5.0f, 1.0007), right = chord(5.0f, 0.9993);
    Stereo wide = run(device, left, right);
    note("default patch, wide pad: level against dry (dB)", db(rms(wide.left, at(1.0)) / rms(left, at(1.0))));
    note("default patch, wide pad: correlation, dry", correlation(left, right, at(1.0)));
    note("default patch, wide pad: correlation, record", correlation(wide.left, wide.right, at(1.0)));
    EXPECT_NEAR(db(rms(wide.left, at(1.0)) / rms(left, at(1.0))), -1.0, 1.5,
                "default: a wide pad keeps its level within 2.5 dB");
    EXPECT(correlation(wide.left, wide.right, at(1.0)) > correlation(left, right, at(1.0)),
           "default: and comes out a little narrower than it went in");
    EXPECT(peak(wide.left) < 1.2 * peak(left), "default: peaks no more than 1.6 dB over the dry signal's");
    // Folded to mono, the pad is where it was: the wear works on the
    // difference between the sides, and the warp moves both alike.
    const std::vector<float> mono_in = half_sum(left, right, 1.0f), mono_out = half_sum(wide.left, wide.right, 1.0f);
    note("default patch, wide pad: mono sum against dry (dB)", db(rms(mono_out, at(1.0)) / rms(mono_in, at(1.0))));
    EXPECT_NEAR(db(rms(mono_out, at(1.0)) / rms(mono_in, at(1.0))), 0.0, 0.5,
                "default: the mono sum of a wide pad keeps its level");
    // The surface on its own, in the gap after a note.
    device.init(kRate);
    std::vector<float> note_then_gap = sine(440.0f, 0.5f, kRate, 0.25f);
    note_then_gap.resize(at(4.0), 0.0f);
    Stereo gap = run(device, note_then_gap);
    note("default patch: surface noise in a gap (dB RMS)", db(rms(gap.left, at(1.0), at(4.0))));
    note("default patch: loudest tick in a gap (dB)", db(peak(gap.left, at(1.0), at(4.0))));
    EXPECT(db(rms(gap.left, at(1.0), at(4.0))) > -72.0 && db(rms(gap.left, at(1.0), at(4.0))) < -56.0,
           "default: the surface sits between -72 and -56 dBFS");
    EXPECT(peak(gap.left, at(1.0), at(4.0)) < 0.025, "default: no tick over -32 dBFS");

    // Two minutes of the default surface under music too quiet to hide it
    // (the carrier is at -80 dBFS): a bed, with nothing that jumps out.
    device.init(kRate);
    Stereo bed = run(device, carrier(120.0f));
    const double loudest = std::max(peak(bed.left, at(1.0)), peak(bed.right, at(1.0)));
    note("default patch: loudest event in two minutes (dB)", db(loudest));
    note("default patch: surface over two minutes (dB RMS)", db(rms(bed.left, at(1.0))));
    EXPECT(loudest < 0.025, "default: nothing over -32 dBFS in two minutes");
    EXPECT(db(loudest / rms(bed.left, at(1.0))) < 36.0,
           "default: the loudest event stands less than 36 dB over the bed");
    // Pops at the default are rare: a few a minute, scratch included.
    bare(device);
    device.set_param(p::kPops, p::kParamDefault[p::kPops]);
    const std::vector<float> under = carrier(120.0f);
    Stereo pops = run(device, under);
    const int popped = count_events(minus(pops.left, under), minus(pops.right, under), 0.002, at(0.2), at(1.0));
    note("default Pops: pops in two minutes", popped);
    EXPECT(popped >= 2 && popped <= 24, "default Pops: between one and twelve a minute");
    EXPECT(std::max(peak(minus(pops.left, under)), peak(minus(pops.right, under))) < 0.025,
           "default Pops: none over -32 dBFS");
  }

  // Everything on, the platter switched part way: the same audio whatever
  // the block size, and the same again after init.
  {
    rng_state() = 0xFACEu;
    const std::vector<float> left = noise(3.0f, kRate, 0.25f), right = noise(3.0f, kRate, 0.25f);
    auto render_all = [&](int block) {
      device.init(kRate);
      device.set_param(p::kSpeed, static_cast<float>(k78));
      device.set_param(p::kWarp, 1.0f);
      device.set_param(p::kCrackle, 1.0f);
      device.set_param(p::kPops, 1.0f);
      device.set_param(p::kSurface, 1.0f);
      device.set_param(p::kWear, 1.0f);
      device.set_param(p::kTone, 0.5f);
      device.set_param(p::kSpin, 0.5f);
      Stereo a = run(device, slice(left, 0, at(1.0)), slice(right, 0, at(1.0)), block);
      device.set_param(p::kPlatter, 1.0f);
      Stereo b = run(device, slice(left, at(1.0), at(2.0)), slice(right, at(1.0), at(2.0)), block);
      device.set_param(p::kPlatter, 0.0f);
      Stereo c = run(device, slice(left, at(2.0), at(3.0)), slice(right, at(2.0), at(3.0)), block);
      return concat(concat(a, b), c);
    };
    const Stereo usual = render_all(128), tiny = render_all(48), again = render_all(128);
    EXPECT(worst_difference(usual.left, tiny.left) < 1.0e-5 && worst_difference(usual.right, tiny.right) < 1.0e-5,
           "everything on: the output does not depend on block size");
    EXPECT(usual.left == again.left && usual.right == again.right, "everything on: init() gives the same record again");
    EXPECT(peak(usual.left) < 2.0 && peak(usual.right) < 2.0, "everything on: bounded");
  }

  device.init(kRate);
  device.set_param(p::kSpeed, static_cast<float>(k78));
  device.set_param(p::kWarp, 1.0f);
  device.set_param(p::kCrackle, 1.0f);
  device.set_param(p::kPops, 1.0f);
  device.set_param(p::kSurface, 1.0f);
  device.set_param(p::kWear, 1.0f);
  device.set_param(p::kTone, 0.5f);
  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("vinyl (everything at its heaviest)", 10.0f, kRate, [&] { run(device, input); });

  return finish("vinyl");
}
