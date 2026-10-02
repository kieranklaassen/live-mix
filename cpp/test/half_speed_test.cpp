// Native harness for Half Speed (cpp/devices/half-speed). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a live half-speed player.

#include "../devices/half-speed/half_speed.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::HalfSpeed;
namespace p = livemix::half_speed;

static HalfSpeed device;

static const float kRate = 48000.0f;

// The plain machine: one steady cycle length, both sides together, full wet.
static void plain(HalfSpeed& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kJitter, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// A tone that grows by 8.69 dB a second (e-fold per second), ending near
// full scale: the level of what a head plays tells how far behind it is.
static std::vector<float> swell(float hz, float seconds, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    out[i] = static_cast<float>(0.8 * std::exp(t - seconds) * std::sin(2.0 * kPi * hz * t));
  }
  return out;
}

// Level in dB every millisecond (RMS of the 2 ms around each point).
static const size_t kHop = 48;
static std::vector<float> level_db(const std::vector<float>& x) {
  std::vector<float> out;
  for (size_t at = kHop; at + kHop <= x.size(); at += kHop) {
    out.push_back(static_cast<float>(db(rms(x, at - kHop, at + kHop))));
  }
  return out;
}

// Where the level jumps up by more than 0.8 dB within 8 ms (a new cycle
// starting from the present), as sample indices, at most one per 60 ms.
static std::vector<size_t> find_seams(const std::vector<float>& x, size_t from_ms = 500) {
  const std::vector<float> level = level_db(x);
  std::vector<size_t> seams;
  for (size_t i = from_ms; i < level.size(); ++i) {
    if (level[i] < -70.0f || level[i] - level[i - 8] < 0.8f) continue;
    if (!seams.empty() && i * kHop - seams.back() < 60 * kHop) continue;
    seams.push_back(i * kHop);
  }
  return seams;
}

// `x[from, to)` with its straight-line trend taken out.
static std::vector<float> detrend(const std::vector<float>& x, size_t from, size_t to) {
  double n = 0, st = 0, sx = 0, stt = 0, stx = 0;
  for (size_t i = from; i < to; ++i) {
    const double t = static_cast<double>(i - from);
    n += 1;
    st += t;
    sx += x[i];
    stt += t * t;
    stx += t * x[i];
  }
  const double slope = (n * stx - st * sx) / (n * stt - st * st);
  const double offset = (sx - slope * st) / n;
  std::vector<float> out;
  for (size_t i = from; i < to; ++i) {
    out.push_back(static_cast<float>(x[i] - offset - slope * static_cast<double>(i - from)));
  }
  return out;
}

// Normalised autocorrelation of `x` at `lag`.
static double autocorrelation(const std::vector<float>& x, size_t lag) {
  double same = 0.0, shifted = 0.0;
  for (size_t i = 0; i + lag < x.size(); ++i) {
    same += static_cast<double>(x[i]) * x[i];
    shifted += static_cast<double>(x[i]) * x[i + lag];
  }
  return same > 0.0 ? shifted / same : 0.0;
}

// Something played: six plucked notes (harmonics that die away faster the
// higher they are), then a held four-note chord of soft sawtooths, then
// silence. Mono, 12 s.
static std::vector<float> phrase() {
  std::vector<float> out(static_cast<size_t>(12.0f * kRate), 0.0f);
  const double plucks[6] = {220.0, 277.18, 329.63, 440.0, 369.99, 329.63};
  for (int k = 0; k < 6; ++k) {
    const size_t start = static_cast<size_t>((0.2 + 0.55 * k) * kRate);
    for (size_t i = 0; i < static_cast<size_t>(3.0f * kRate); ++i) {
      const double t = i / kRate;
      double v = 0.0;
      for (int h = 1; h <= 10; ++h) {
        v += std::sin(2.0 * kPi * plucks[k] * h * t) * std::exp(-t * (1.2 + 0.9 * h)) / h;
      }
      out[start + i] += static_cast<float>(0.25 * v * (1.0 - std::exp(-t * 900.0)));
    }
  }
  const double chord[4] = {110.0, 164.81, 220.66, 277.18};
  for (size_t i = 0; i < static_cast<size_t>(5.5f * kRate); ++i) {
    const double t = i / kRate;
    double v = 0.0;
    for (double hz : chord) {
      for (int h = 1; h <= 12; ++h) v += std::sin(2.0 * kPi * hz * h * t + 0.3 * h) / (h * (1.0 + 0.15 * h));
    }
    const double env = (1.0 - std::exp(-t * 4.0)) * (t > 4.5 ? std::exp(-(t - 4.5) * 5.0) : 1.0);
    out[static_cast<size_t>(4.0f * kRate) + i] += static_cast<float>(0.07 * v * env);
  }
  return out;
}

// A held four-note chord of soft sawtooths (C, E, G, B from `root` up), with
// a short attack: 10 s, mono.
static std::vector<float> held_chord(double root) {
  const double ratios[4] = {1.0, 1.25992, 1.49831, 1.88775};
  std::vector<float> out(static_cast<size_t>(10.0f * kRate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = i / kRate;
    double v = 0.0;
    for (int k = 0; k < 4; ++k) {
      for (int h = 1; h <= 14; ++h) {
        v += std::sin(2.0 * kPi * root * ratios[k] * h * t + 1.3 * h + k) / (h * (1.0 + 0.12 * h));
      }
    }
    out[i] = static_cast<float>(0.06 * v * (1.0 - std::exp(-t / 0.03)));
  }
  return out;
}

int main() {
  Conformance spec;
  spec.name = "half-speed";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Speed sets the pitch: a 440 Hz tone comes out a fourth, a fifth, one
  // octave and two octaves down, whichever layout is playing.
  {
    const double wanted[4] = {330.0, 440.0 * 2.0 / 3.0, 220.0, 110.0};
    const char* names[4] = {"Three quarters gives 330 Hz", "Two thirds gives 293.3 Hz",
                            "Half gives 220 Hz", "Quarter gives 110 Hz"};
    for (float smooth : {0.0f, 0.5f, 1.0f}) {
      for (int speed = 0; speed < 4; ++speed) {
        plain(device);
        device.set_param(p::kSmooth, smooth);
        device.set_param(p::kSpeed, static_cast<float>(speed));
        Stereo out = run(device, sine(440.0f, 4.0f, kRate, 0.5f));
        const double hz = dominant_frequency(out.left, kRate, 80.0, 500.0, 48000, 4 * 48000);
        EXPECT_NEAR(hz, wanted[speed], wanted[speed] * 0.005, names[speed]);
        EXPECT(tone_level(out.left, wanted[speed], kRate, 48000, 4 * 48000) > 0.45,
               "the slowed tone keeps the level of the tone that went in");
      }
    }
  }

  // Smooth 0 is a rhythm at Length: on a tone that keeps getting louder,
  // every cycle starts again from the present, so the level steps up once
  // per cycle. The steps are Length apart, and the level rises between them
  // at Speed times the rate it rose at going in.
  {
    plain(device);
    device.set_param(p::kLength, 400.0f);
    device.set_param(p::kSmooth, 0.0f);
    device.set_param(p::kFade, 0.01f);
    Stereo out = run(device, swell(4000.0f, 9.0f));
    std::vector<size_t> seams = find_seams(out.left);
    EXPECT(seams.size() >= 18, "Smooth 0: one jump forward per cycle");
    double worst = 0.0;
    for (size_t k = 1; k < seams.size(); ++k) {
      worst = std::max(worst, std::fabs((seams[k] - seams[k - 1]) / kRate - 0.4));
    }
    EXPECT(worst < 0.006, "Smooth 0: the jumps are Length apart");
    // Between two jumps: 0.4 s at half the input's 8.69 dB per second.
    const std::vector<float> level = level_db(out.left);
    const size_t a = seams[10] / kHop + 8, b = seams[11] / kHop - 4;
    EXPECT_NEAR((level[b] - level[a]) / ((b - a) * kHop / kRate), 4.34, 0.35,
                "inside a cycle the swell is played at half speed");
    // The level pattern repeats every Length and not every half Length.
    const std::vector<float> ripple = detrend(level, 400, level.size() - 100);
    EXPECT(autocorrelation(ripple, 400) > 0.7, "Smooth 0: the level pattern repeats every Length");
    EXPECT(autocorrelation(ripple, 200) < 0.0, "Smooth 0: and not twice per Length");
  }

  // Smooth 1 is continuous. Two heads cross-fading a tone would cancel
  // whenever they are out of phase; started where the waveforms match, they
  // leave no modulation at the cycle rate (10 Hz here) or its multiples.
  {
    double worst = -200.0;
    for (float hz : {110.0f, 261.63f, 466.16f, 3300.0f}) {
      plain(device);
      device.set_param(p::kLength, 100.0f);
      device.set_param(p::kSmooth, 1.0f);
      Stereo out = run(device, sine(hz, 4.0f, kRate, 0.5f));
      const size_t from = 48000, to = 4 * 48000;
      const double carrier = tone_level(out.left, hz * 0.5, kRate, from, to);
      EXPECT(carrier > 0.4, "Smooth 1: the tone comes through at its level");
      for (int k = 1; k <= 4; ++k) {
        for (int sign = -1; sign <= 1; sign += 2) {
          const double side = tone_level(out.left, hz * 0.5 + sign * 10.0 * k, kRate, from, to);
          worst = std::max(worst, db(side / carrier));
        }
      }
    }
    std::printf("  smooth 1, tones: worst cycle-rate sideband %.1f dB under the tone\n", worst);
    EXPECT(worst < -30.0, "Smooth 1: no cycle-rate modulation on a tone");
  }

  // Smooth 1 on noise: heads that share nothing add in power, and the
  // make-up gain holds the level through the cross-fades. Output power
  // folded on the cycle stays within 1.5 dB; so does Smooth 0.5.
  for (float smooth : {1.0f, 0.5f}) {
    plain(device);
    device.set_param(p::kLength, 500.0f);
    device.set_param(p::kSmooth, smooth);
    livemix::kit::Noise pink;
    pink.seed(1234);
    std::vector<float> in(static_cast<size_t>(60.0f * kRate));
    for (float& v : in) v = pink.pink();
    Stereo out = run(device, in);
    const size_t cycle = 24000;
    double power[20] = {0.0};
    for (size_t i = 2 * cycle; i < out.size(); ++i) {
      power[(i % cycle) * 20 / cycle] += static_cast<double>(out.left[i]) * out.left[i];
    }
    double lo = 1.0e9, hi = -1.0e9;
    for (double value : power) {
      lo = std::min(lo, 10.0 * std::log10(value));
      hi = std::max(hi, 10.0 * std::log10(value));
    }
    std::printf("  smooth %.1f, pink noise: level over the cycle varies %.2f dB\n", smooth, hi - lo);
    EXPECT(hi - lo < 1.5, "slowed noise holds a steady level through the cross-fades");
  }

  // It never falls further behind than Length x (1 - Speed), plus the fade
  // and the 26 ms the splice search may use. A click played at sixteen
  // places in the cycle (over a carrier too quiet to matter, which keeps the
  // cycles turning) is last heard at most that long after it went in.
  {
    const double bound = 0.8 * 0.5 * 1.25 + 0.026 + 0.002;
    double longest = 0.0;
    int heard = 0;
    for (int k = 0; k < 19; ++k) {
      plain(device);
      device.set_param(p::kLength, 800.0f);
      device.set_param(p::kSmooth, 0.0f);
      device.set_param(p::kFade, 0.25f);
      if (k >= 16) device.set_param(p::kJitter, 1.0f);
      // The last three late in a long jittered run: no drift builds up.
      const float seconds = k < 16 ? 4.0f : 24.0f;
      std::vector<float> in = sine(3000.0f, seconds, kRate, 1.0e-4f);
      const size_t at = static_cast<size_t>((k < 16 ? 2.0 + 0.05 * k : 20.0 + 0.31 * (k - 16)) * kRate);
      in[at] = 1.0f;
      Stereo out = run(device, in);
      size_t last = 0;
      for (size_t i = at; i < out.size(); ++i) {
        if (std::fabs(out.left[i]) > 0.02f) last = i;
      }
      if (last == 0) continue;  // skipped: the head jumped over it
      ++heard;
      const double delay = static_cast<double>(last - at) / kRate;
      if (k < 16) longest = std::max(longest, delay);
      EXPECT(delay <= (k < 16 ? bound : bound + 0.25 * 0.8 * 0.5 * 1.25),
             "a sound is never played later than Length x (1 - Speed) plus the fade");
    }
    std::printf("  longest delay heard %.3f s (bound %.3f s), %d of 19 clicks played\n", longest, bound,
                heard);
    EXPECT(longest > 0.24, "the slowed sound does fall behind during a cycle");
    EXPECT(heard >= 8 && heard < 19, "what a cycle has no time for is skipped, not queued");
  }

  // Low Cut and High Cut set the band of the slowed sound: 150 Hz and 5 kHz
  // go in, 75 Hz and 2.5 kHz come out.
  {
    double low[4], high[4];
    const float cuts[4][2] = {{20.0f, 20000.0f}, {600.0f, 20000.0f}, {20.0f, 600.0f}, {20.0f, 2500.0f}};
    for (int k = 0; k < 4; ++k) {
      plain(device);
      device.set_param(p::kSmooth, 1.0f);
      device.set_param(p::kLowCut, cuts[k][0]);
      device.set_param(p::kHighCut, cuts[k][1]);
      std::vector<float> in = sine(150.0f, 4.0f, kRate, 0.3f);
      const std::vector<float> top = sine(5000.0f, 4.0f, kRate, 0.3f);
      for (size_t i = 0; i < in.size(); ++i) in[i] += top[i];
      Stereo out = run(device, in);
      low[k] = db(tone_level(out.left, 75.0, kRate, 48000, 4 * 48000));
      high[k] = db(tone_level(out.left, 2500.0, kRate, 48000, 4 * 48000));
    }
    std::printf("  band: open %.1f / %.1f dB, low cut 600 Hz %.1f / %.1f, high cut 600 Hz %.1f / %.1f, "
                "high cut 2.5 kHz %.1f / %.1f\n",
                low[0], high[0], low[1], high[1], low[2], high[2], low[3], high[3]);
    EXPECT(low[0] > -11.5 && high[0] > -11.5, "open band: both tones at the level they went in");
    EXPECT(low[1] < low[0] - 30.0 && high[1] > high[0] - 1.0, "Low Cut removes the lows only");
    EXPECT(high[2] < high[0] - 20.0 && low[2] > low[0] - 1.0, "High Cut removes the highs only");
    EXPECT_NEAR(high[3] - high[0], -3.0, 1.0, "High Cut is 3 dB down at its setting");
  }

  // Mix 0 is the input, bit for bit; so is Power Off once its fade is over.
  // Switching either way while playing does not click, and switching On
  // starts a cycle at that moment.
  {
    const std::vector<float> tone = sine(440.0f, 3.0f, kRate, 0.5f);
    plain(device);
    device.set_param(p::kMix, 0.0f);
    Stereo dry = run(device, tone);
    EXPECT(dry.left == tone && dry.right == tone, "Mix 0 is the input exactly");

    plain(device);
    const std::vector<float> first(tone.begin(), tone.begin() + 48000);
    const std::vector<float> second(tone.begin() + 48000, tone.begin() + 96000);
    const std::vector<float> third(tone.begin() + 96000, tone.end());
    run(device, first);
    device.set_param(p::kPower, 1.0f);
    Stereo off = run(device, second);
    double residue = 0.0;
    for (size_t i = 2400; i < second.size(); ++i) {
      residue = std::max(residue, std::fabs(static_cast<double>(off.left[i]) - second[i]));
    }
    EXPECT(residue == 0.0, "Power Off is the input exactly, 50 ms after the switch");
    device.set_param(p::kPower, 0.0f);
    Stereo on = run(device, third);
    const double step = std::max(max_step(off.left), max_step(on.left));
    std::printf("  power: largest step while switching %.4f (the input's own %.4f)\n", step,
                max_step(tone));
    EXPECT(step < max_step(tone) * 1.5, "Power switches without a click");
    EXPECT_NEAR(dominant_frequency(on.left, kRate, 100.0, 500.0, 4800, 43200), 220.0, 1.5,
                "Power On slows the sound again");
    // The cycle clock began again at the switch: the first jump forward of
    // a swelling tone comes one Length after it, wherever the old cycle was.
    plain(device);
    device.set_param(p::kLength, 400.0f);
    device.set_param(p::kSmooth, 0.0f);
    device.set_param(p::kFade, 0.01f);
    const std::vector<float> rising = swell(4000.0f, 6.0f);
    const size_t cut = static_cast<size_t>(2.53f * kRate);
    run(device, std::vector<float>(rising.begin(), rising.begin() + 96000));
    device.set_param(p::kPower, 1.0f);
    run(device, std::vector<float>(rising.begin() + 96000, rising.begin() + cut));
    device.set_param(p::kPower, 0.0f);
    Stereo again = run(device, std::vector<float>(rising.begin() + cut, rising.end()));
    const std::vector<size_t> seams = find_seams(again.left, 100);
    EXPECT(!seams.empty(), "Power On: cycles run again");
    if (!seams.empty()) {
      EXPECT_NEAR(seams[0] / kRate, 0.4, 0.008, "Power On starts a cycle at the switch");
    }
  }

  // Jitter makes every cycle up to a quarter longer or shorter (at 1), the
  // same way on every run; at 0 they are all Length.
  {
    double shortest[2] = {9.0, 9.0}, longest[2] = {0.0, 0.0};
    const float amounts[2] = {1.0f, 0.4f};
    for (int k = 0; k < 2; ++k) {
      plain(device);
      device.set_param(p::kLength, 400.0f);
      device.set_param(p::kSmooth, 0.0f);
      device.set_param(p::kFade, 0.01f);
      device.set_param(p::kJitter, amounts[k]);
      Stereo out = run(device, swell(4000.0f, 14.0f));
      const std::vector<size_t> seams = find_seams(out.left);
      EXPECT(seams.size() > 15, "Jitter: cycles keep coming");
      for (size_t s = 1; s < seams.size(); ++s) {
        const double gap = (seams[s] - seams[s - 1]) / kRate;
        shortest[k] = std::min(shortest[k], gap);
        longest[k] = std::max(longest[k], gap);
      }
    }
    std::printf("  jitter 1: cycles of %.3f to %.3f s; jitter 0.4: %.3f to %.3f s (Length 0.4 s)\n",
                shortest[0], longest[0], shortest[1], longest[1]);
    EXPECT(shortest[0] > 0.3 - 0.012 && longest[0] < 0.5 + 0.012, "Jitter 1 stays within a quarter");
    EXPECT(longest[0] - shortest[0] > 0.1, "Jitter 1 uses its range");
    EXPECT(shortest[1] > 0.36 - 0.012 && longest[1] < 0.44 + 0.012, "Jitter 0.4 stays within a tenth");
    EXPECT(longest[1] - shortest[1] > 0.03, "Jitter 0.4 varies the cycles");
  }

  // Spread holds the right side's cycles behind the left's: a quarter of a
  // cycle at 1, together at 0. Below 200 Hz both sides play the same head.
  {
    for (float spread : {0.0f, 0.5f, 1.0f}) {
      plain(device);
      device.set_param(p::kLength, 400.0f);
      device.set_param(p::kSmooth, 0.0f);
      device.set_param(p::kFade, 0.01f);
      device.set_param(p::kSpread, spread);
      Stereo out = run(device, swell(4000.0f, 9.0f));
      const std::vector<size_t> left = find_seams(out.left, 4000);
      const std::vector<size_t> right = find_seams(out.right, 4000);
      EXPECT(left.size() >= 8 && right.size() >= 8, "Spread: both sides cycle");
      if (left.size() < 4 || right.size() < 4) continue;
      // The first right jump after the third left one.
      size_t k = 0;
      while (k + 1 < right.size() && right[k] + 480 < left[2]) ++k;
      const double behind = (static_cast<double>(right[k]) - static_cast<double>(left[2])) / kRate;
      std::printf("  spread %.1f: right side jumps %.3f s after the left\n", spread, behind);
      EXPECT_NEAR(behind, 0.1 * spread, 0.008, "Spread sets how far the right side trails");
      if (spread == 0.0f) {
        double apart = 0.0;
        for (size_t i = 0; i < out.size(); ++i) {
          apart = std::max(apart, std::fabs(static_cast<double>(out.left[i]) - out.right[i]));
        }
        EXPECT(apart < 1.0e-5, "Spread 0: both sides are the same");
      }
    }
    // Bass at full Spread: 163 Hz goes in with noise on top, 81.5 Hz comes
    // out the same on both sides while the noise above it does not.
    plain(device);
    device.set_param(p::kSpread, 1.0f);
    device.set_param(p::kSmooth, 0.3f);
    device.set_param(p::kJitter, 0.5f);
    std::vector<float> in = sine(163.0f, 8.0f, kRate, 0.3f);
    rng_state() = 0xD1CEu;
    const std::vector<float> top = noise(8.0f, kRate, 0.2f);
    for (size_t i = 0; i < in.size(); ++i) in[i] += top[i];
    Stereo out = run(device, in);
    std::vector<float> low_left(out.size()), low_right(out.size()), mid(out.size());
    std::vector<float> high_left(out.size()), high_right(out.size());
    double a = 0.0, b = 0.0, c = 0.0, e = 0.0, f = 0.0, g = 0.0;
    const double high_pole = std::exp(-2.0 * kPi * 800.0 / kRate);
    const double pole = std::exp(-2.0 * kPi * 110.0 / kRate);
    for (size_t i = 0; i < out.size(); ++i) {
      a = out.left[i] + (a - out.left[i]) * pole;
      b = a + (b - a) * pole;
      c = out.right[i] + (c - out.right[i]) * pole;
      e = c + (e - c) * pole;
      low_left[i] = static_cast<float>(b);
      low_right[i] = static_cast<float>(e);
      mid[i] = 0.5f * (out.left[i] + out.right[i]);
      f = out.left[i] + (f - out.left[i]) * high_pole;
      g = out.right[i] + (g - out.right[i]) * high_pole;
      high_left[i] = out.left[i] - static_cast<float>(f);
      high_right[i] = out.right[i] - static_cast<float>(g);
    }
    const double above = correlation(high_left, high_right, 48000);
    const double bass = correlation(low_left, low_right, 48000);
    const double fold = db(tone_level(mid, 81.5, kRate, 48000) / tone_level(out.left, 81.5, kRate, 48000));
    std::printf("  spread 1: bass correlation %.3f, bass in mono %+.2f dB, correlation above 800 Hz %.2f\n",
                bass, fold, above);
    EXPECT(bass > 0.97, "Spread 1: the bass is the same on both sides");
    EXPECT(std::fabs(fold) < 0.5, "Spread 1: the bass survives a mono fold-down");
    EXPECT(std::fabs(above) < 0.3, "Spread 1: the sides differ above the bass");
  }

  // Quiet soon after the playing stops: exact zeros within Length.
  {
    device.init(kRate);
    rng_state() = 0xFACEu;
    run(device, noise(3.0f, kRate, 0.5f));
    Stereo tail = render(device, 2.0f, kRate);
    size_t last = 0;
    for (size_t i = 0; i < tail.size(); ++i) {
      if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
    }
    std::printf("  defaults: last non-zero sample %.3f s after the input stops\n", last / kRate);
    EXPECT(last < 48000, "exact silence within Length of the input stopping");
    // Then a note after the silence is heard at once and at full level.
    Stereo woken = run(device, sine(440.0f, 0.2f, kRate, 0.5f));
    EXPECT(rms(woken.left, 0, 1920) > 0.25, "a note after silence starts at once, not faded in");
  }

  // Every control can be moved while a tone sounds without a click: the
  // largest sample-to-sample step stays near the tone's own.
  {
    struct Move {
      int id;
      float values[3];
      const char* message;
    };
    const Move moves[] = {
        {p::kLength, {90.0f, 2600.0f, 300.0f}, "moving Length does not click"},
        {p::kSpeed, {3.0f, 0.0f, 1.0f}, "switching Speed glides without a click"},
        {p::kFade, {0.5f, 0.01f, 0.3f}, "moving Fade does not click"},
        {p::kSmooth, {0.0f, 1.0f, 0.2f}, "moving Smooth does not click"},
        {p::kJitter, {1.0f, 0.0f, 0.6f}, "moving Jitter does not click"},
        {p::kLowCut, {2000.0f, 20.0f, 300.0f}, "moving Low Cut does not click"},
        {p::kHighCut, {500.0f, 20000.0f, 3000.0f}, "moving High Cut does not click"},
        {p::kSpread, {1.0f, 0.0f, 0.7f}, "moving Spread does not click"},
        {p::kMix, {0.2f, 1.0f, 0.5f}, "moving Mix does not click"},
    };
    const std::vector<float> tone = sine(330.0f, 0.4f, kRate, 0.5f);
    const double own = max_step(tone);
    double worst = 0.0;
    for (const Move& move : moves) {
      device.init(kRate);
      device.set_param(p::kLength, 300.0f);
      device.set_param(p::kMix, 0.7f);
      run(device, sine(330.0f, 1.0f, kRate, 0.5f));
      double step = 0.0;
      for (int k = 0; k < 9; ++k) {
        device.set_param(move.id, move.values[k % 3]);
        // The tone carries on in phase: 0.4 s is a whole number of cycles.
        Stereo out = run(device, tone);
        step = std::max(step, std::max(max_step(out.left), max_step(out.right)));
      }
      worst = std::max(worst, step);
      EXPECT(step < own * 1.5, move.message);
    }
    std::printf("  moving controls: largest step %.4f (the tone's own %.4f)\n", worst, own);
  }

  // Seams on a tone at the tightest splice: no click with Smooth at 0.
  {
    double worst = 0.0;
    for (float hz : {110.0f, 261.63f, 1244.5f}) {
      plain(device);
      device.set_param(p::kLength, 120.0f);
      device.set_param(p::kSmooth, 0.0f);
      device.set_param(p::kFade, 0.01f);
      Stereo out = run(device, sine(hz, 3.0f, kRate, 0.5f));
      // A half-speed sine of the same level steps half as far as the input.
      const double own = 0.5 * 2.0 * kPi * hz * 0.5 / kRate;
      worst = std::max(worst, max_step(out.left, 4800) / own);
    }
    std::printf("  smooth 0 seams on a tone: largest step %.2f x the slowed tone's own\n", worst);
    EXPECT(worst < 1.25, "Smooth 0: the seam does not click on a tone");
  }

  // The same audio whatever the host's block size.
  {
    rng_state() = 0xB10Cu;
    const std::vector<float> in = noise(3.0f, kRate, 0.4f);
    Stereo reference;
    for (int block : {128, 1, 2048}) {
      device.init(kRate);
      device.set_param(p::kLength, 220.0f);
      device.set_param(p::kJitter, 0.7f);
      Stereo out = run(device, in, block);
      if (block == 128) {
        reference = out;
      } else {
        EXPECT(out.left == reference.left && out.right == reference.right,
               "blocks of 1, 128 and 2048 frames give the same samples");
      }
    }
  }

  // Times are in seconds at every sample rate: pitch, cycle length and the
  // continuity of Smooth 1 hold at 44.1 and 96 kHz.
  for (float rate : {44100.0f, 96000.0f}) {
    plain(device, rate);
    device.set_param(p::kLength, 100.0f);
    device.set_param(p::kSmooth, 1.0f);
    Stereo out = run(device, sine(261.63f, 3.0f, rate, 0.5f));
    const size_t from = static_cast<size_t>(rate), to = static_cast<size_t>(3.0f * rate);
    const double carrier = tone_level(out.left, 130.815, rate, from, to);
    double side = 0.0;
    for (double offset : {-20.0, -10.0, 10.0, 20.0}) {
      side = std::max(side, tone_level(out.left, 130.815 + offset, rate, from, to));
    }
    std::printf("  %.1f kHz: tone %.2f, worst cycle-rate sideband %.1f dB under it\n", rate / 1000.0f,
                carrier, db(side / carrier));
    EXPECT(carrier > 0.45 && db(side / carrier) < -30.0, "pitch and continuity hold at this rate");

    plain(device, rate);
    device.set_param(p::kLength, 800.0f);
    device.set_param(p::kSmooth, 0.0f);
    device.set_param(p::kFade, 0.25f);
    std::vector<float> in = sine(3000.0f, 4.0f, rate, 1.0e-4f);
    const size_t at = static_cast<size_t>(1.9f * rate);  // 0.3 s into the third cycle
    in[at] = 1.0f;
    out = run(device, in);
    size_t last = 0;
    for (size_t i = at; i < out.size(); ++i) {
      if (std::fabs(out.left[i]) > 0.02f) last = i;
    }
    EXPECT_NEAR((last - at) / rate, 0.3, 0.03, "a click 0.3 s into a cycle is heard 0.3 s late");
  }

  // The default patch on a played phrase (six plucked notes, then a held
  // four-note chord), mono in: about as loud as the dry phrase, no DC, wide
  // but on the right side of mono, and gone soon after the phrase ends.
  {
    const std::vector<float> in = phrase();
    device.init(kRate);
    Stereo out = run(device, in);
    const size_t a = 5 * 48000, b = 8 * 48000;  // inside the held chord
    const double level = db(rms(out.left, a, b)) - db(rms(in, a, b));
    const double level_right = db(rms(out.right, a, b)) - db(rms(in, a, b));
    std::vector<float> mid(out.size());
    for (size_t i = 0; i < out.size(); ++i) mid[i] = 0.5f * (out.left[i] + out.right[i]);
    const double width = correlation(out.left, out.right);
    const double fold = db(rms(mid)) - db(0.5 * (rms(out.left) + rms(out.right)));
    std::printf("  default patch on a phrase: chord %+.2f dB (left) %+.2f dB (right) against dry, peak %.1f dB "
                "(dry %.1f), correlation %.2f, mono fold-down %+.2f dB, DC %.1e\n",
                level, level_right, db(std::max(peak(out.left), peak(out.right))), db(peak(in)), width,
                fold, std::fabs(mean(out.left)));
    EXPECT(std::fabs(level) < 3.0 && std::fabs(level_right) < 3.0, "defaults: as loud as the dry signal");
    EXPECT(std::max(peak(out.left), peak(out.right)) < peak(in) * 1.26, "defaults: peaks stay near the dry peak");
    EXPECT(width > 0.0 && width < 0.98, "defaults: wide, and positively correlated");
    EXPECT(fold > -3.0, "defaults: survives a mono fold-down");
    EXPECT(std::fabs(mean(out.left)) < 1.0e-4, "defaults: no DC");
    // The chord sustains: its level in 100 ms steps does not pump.
    double lo = 1.0e9, hi = -1.0e9;
    for (size_t at = a; at + 4800 <= b; at += 4800) {
      lo = std::min(lo, db(rms(out.left, at, at + 4800)));
      hi = std::max(hi, db(rms(out.left, at, at + 4800)));
    }
    std::printf("  default patch: held chord level stays within %.2f dB\n", hi - lo);
    EXPECT(hi - lo < 3.0, "defaults: a held chord does not pump");
  }

  // Held chords with the sides apart (Spread): the right side, which takes
  // its bass from the first set of heads and the rest from the second, is as
  // loud as the left, and neither side pumps across the cycle boundaries.
  {
    double worst_balance = 0.0, worst_left = 0.0, worst_right = 0.0;
    for (double root : {130.81, 196.0, 261.63}) {
      const std::vector<float> in = held_chord(root);
      for (float smooth : {0.5f, 1.0f}) {
        device.init(kRate);
        device.set_param(p::kSmooth, smooth);
        Stereo out = run(device, in);
        const size_t a = 2 * 48000, b = 9 * 48000 + 24000;
        const double left = db(rms(out.left, a, b)), right = db(rms(out.right, a, b));
        worst_balance = std::max(worst_balance, std::fabs(right - left));
        EXPECT(std::fabs(left - db(rms(in, a, b))) < 0.5, "a held chord comes out as loud as it went in");
        double lo[2] = {1.0e9, 1.0e9}, hi[2] = {-1.0e9, -1.0e9};
        for (size_t at = a; at + 4800 <= b; at += 1200) {
          const double l = db(rms(out.left, at, at + 4800)), r = db(rms(out.right, at, at + 4800));
          lo[0] = std::min(lo[0], l);
          hi[0] = std::max(hi[0], l);
          lo[1] = std::min(lo[1], r);
          hi[1] = std::max(hi[1], r);
        }
        worst_left = std::max(worst_left, hi[0] - lo[0]);
        worst_right = std::max(worst_right, hi[1] - lo[1]);
      }
    }
    std::printf("  held chords, Smooth 0.5 and 1, Spread 0.3: right within %.2f dB of left; level in 100 ms "
                "steps moves %.2f dB (left) %.2f dB (right)\n",
                worst_balance, worst_left, worst_right);
    EXPECT(worst_balance < 1.0, "Spread: the right side of a held chord is as loud as the left");
    EXPECT(worst_left < 3.2, "a held chord holds steady on the left across cycles");
    EXPECT(worst_right < 4.5, "a held chord does not pump on the right across cycles");
  }

  // Worst case for level: full-scale noise, heads that share nothing, the
  // make-up gain at its largest and dry and wet mixed half and half.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.5f);
    device.set_param(p::kLength, 50.0f);
    device.set_param(p::kFade, 0.5f);
    rng_state() = 0xF00Du;
    Stereo out = run(device, noise(4.0f, kRate, 1.0f));
    std::printf("  worst case: full-scale noise peaks at %.2f\n", std::max(peak(out.left), peak(out.right)));
    EXPECT(std::max(peak(out.left), peak(out.right)) < 3.0, "full-scale input stays bounded");
  }

  // Cost at the heaviest sensible setting: the shortest cycles (forty
  // splice searches a second), both sets of heads, all three heads sounding.
  device.init(kRate);
  device.set_param(p::kLength, 50.0f);
  device.set_param(p::kSpread, 1.0f);
  device.set_param(p::kSmooth, 0.5f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("half-speed (50 ms cycles, full spread)", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  report_cost("half-speed (defaults)", 10.0f, kRate, [&] { run(device, input); });

  return finish("half-speed");
}
