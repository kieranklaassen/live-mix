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
      if (spread == 0.0f) EXPECT(out.left == out.right, "Spread 0: both sides are the same");
    }
    // Bass: a 60 Hz tone (30 Hz slowed... keep it audible: 160 Hz in, 80 out)
    // is the same on both sides at full Spread, while 2 kHz is not.
    plain(device);
    device.set_param(p::kSpread, 1.0f);
    device.set_param(p::kSmooth, 0.3f);
    device.set_param(p::kJitter, 0.5f);
    std::vector<float> in = sine(163.0f, 8.0f, kRate, 0.3f);
    const std::vector<float> top = sine(4111.0f, 8.0f, kRate, 0.3f);
    for (size_t i = 0; i < in.size(); ++i) in[i] += top[i];
    Stereo out = run(device, in);
    std::vector<float> low_left(out.size()), low_right(out.size()), mid(out.size());
    double a = 0.0, b = 0.0, c = 0.0, e = 0.0;
    const double pole = std::exp(-2.0 * kPi * 400.0 / kRate);
    for (size_t i = 0; i < out.size(); ++i) {
      a = out.left[i] + (a - out.left[i]) * pole;
      b = a + (b - a) * pole;
      c = out.right[i] + (c - out.right[i]) * pole;
      e = c + (e - c) * pole;
      low_left[i] = static_cast<float>(b);
      low_right[i] = static_cast<float>(e);
      mid[i] = 0.5f * (out.left[i] + out.right[i]);
    }
    const double bass = correlation(low_left, low_right, 48000);
    const double fold = db(tone_level(mid, 81.5, kRate, 48000) / tone_level(out.left, 81.5, kRate, 48000));
    std::printf("  spread 1: bass correlation %.3f, bass in mono %+.2f dB, whole signal correlation %.2f\n",
                bass, fold, correlation(out.left, out.right, 48000));
    EXPECT(bass > 0.95, "Spread 1: the bass is the same on both sides");
    EXPECT(std::fabs(fold) < 0.5, "Spread 1: the bass survives a mono fold-down");
    EXPECT(correlation(out.left, out.right, 48000) < 0.9, "Spread 1: the sides differ above the bass");
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

  // BEHAVIOUR CHECKS

  plain(device);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("half-speed", 10.0f, kRate, [&] { run(device, input); });

  return finish("half-speed");
}
