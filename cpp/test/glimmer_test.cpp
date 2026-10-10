// Native harness for Glimmer (cpp/devices/glimmer). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest measures the flicker: that each partial of a comb moves at
// about Rate and by Depth, apart from its neighbours on Scatter and in order
// on the waves, that the level of the whole holds, and that the clock keeps
// its place through silence.

#include "../devices/glimmer/glimmer.h"
#include "support/test_kit.h"

#include <limits>

using namespace testkit;
using livemix::Glimmer;
namespace p = livemix::glimmer;

static Glimmer device;

static const float kRate = 48000.0f;
enum { kScatter = 0, kUpward, kDownward, kOutward };
static const int kLatency = Glimmer::kLatency;
static const int kFrame = Glimmer::Stft::kFrame;

// Every control as the device starts, then the ones named.
struct Setting {
  int id;
  float value;
};
static void set(float rate, std::initializer_list<Setting> settings) {
  device.init(rate);
  for (const Setting& s : settings) device.set_param(s.id, s.value);
}

// The centre of band j, in Hz, at a Grain: the layout of glimmer.h (W, K and p(f) in its header).
struct Bands {
  double width, knee, scale;
  explicit Bands(float grain, float rate = kRate) {
    const double bin = rate / kFrame;
    width = std::max(2.0 * bin, static_cast<double>(Glimmer::kBroadHz * std::pow(Glimmer::kFineHz / Glimmer::kBroadHz, grain)));
    knee = Glimmer::kBroadKneeHz * std::pow(Glimmer::kFineKneeHz / Glimmer::kBroadKneeHz, grain);
    scale = knee / width;
  }
  double centre(double j) const { return knee * (std::exp(j / scale) - 1.0); }
  double place(double hz) const { return scale * std::log(1.0 + hz / knee); }
};

// Steady sines of one amplitude at the frequencies given, each starting at its own phase.
static std::vector<float> comb(const std::vector<double>& hz, float seconds, float amplitude, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (size_t h = 0; h < hz.size(); ++h) {
    const double start = 0.7 * static_cast<double>(h * h);
    for (size_t i = 0; i < out.size(); ++i)
      out[i] += amplitude * static_cast<float>(std::sin(start + 2.0 * kPi * hz[h] * static_cast<double>(i) / rate));
  }
  return out;
}

// The level of the partial at `hz` as it moves: brought down to 0 Hz and
// averaged over two boxes of `window` samples, one value every `hop`
// samples. A steady sine of amplitude 1 reads 1. Value i stands for the
// time i·hop + window samples.
static std::vector<float> partial(const std::vector<float>& x, double hz, int window, int hop, float rate = kRate) {
  const size_t n = x.size();
  std::vector<double> re(n + 1, 0.0), im(n + 1, 0.0);
  const double step = 2.0 * kPi * hz / rate;
  for (size_t i = 0; i < n; ++i) {
    re[i + 1] = re[i] + x[i] * std::cos(step * static_cast<double>(i));
    im[i + 1] = im[i] - x[i] * std::sin(step * static_cast<double>(i));
  }
  const size_t w = static_cast<size_t>(window);
  if (n < 2 * w) return {};
  const size_t m = n - w + 1;
  std::vector<double> re2(m + 1, 0.0), im2(m + 1, 0.0);
  for (size_t i = 0; i < m; ++i) {
    re2[i + 1] = re2[i] + (re[i + w] - re[i]);
    im2[i + 1] = im2[i] + (im[i + w] - im[i]);
  }
  std::vector<float> out;
  const double scale = 2.0 / (static_cast<double>(w) * static_cast<double>(w));
  for (size_t i = 0; i + w <= m; i += static_cast<size_t>(hop)) {
    out.push_back(static_cast<float>(scale * std::hypot(re2[i + w] - re2[i], im2[i + w] - im2[i])));
  }
  return out;
}

static std::vector<float> centred(const std::vector<float>& x) {
  const double m = mean(x);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = static_cast<float>(x[i] - m);
  return out;
}
static double lowest(const std::vector<float>& x) { return *std::min_element(x.begin(), x.end()); }
static double highest(const std::vector<float>& x) { return *std::max_element(x.begin(), x.end()); }
static std::vector<float> from(const std::vector<float>& x, size_t start) {
  return std::vector<float>(x.begin() + static_cast<long>(std::min(start, x.size())), x.end());
}
// How alike two envelopes move, -1..1, about their own means.
static double alike(const std::vector<float>& a, const std::vector<float>& b) {
  return correlation(centred(a), centred(b));
}
// The phase in cycles (0..1) of the component at `hz` in an envelope sampled at `env_rate`.
static double phase_at(const std::vector<float>& envelope, double hz, double env_rate) {
  const double turn = tone_phase(centred(envelope), hz, env_rate, 0, envelope.size()) / (2.0 * kPi);
  return turn - std::floor(turn);
}
// The difference of two phases in cycles, brought into -0.5..0.5.
static double turn(double cycles) { return cycles - std::floor(cycles + 0.5); }

static const int kWindow = 1024;  // the envelope's two boxes: nulls every 46.9 Hz
static const int kHop = 256;
static const double kEnvRate = kRate / kHop;
// Skip what the device and the boxes need to settle: the latency, a frame, the boxes.
static const size_t kSettled = static_cast<size_t>((kLatency + 2 * kFrame) / kHop);

int main() {
  Conformance spec;
  spec.name = "glimmer";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // --- The latency and the dry path ------------------------------------------------------------
  // Mix 0 is the input, a latency late, bit for bit. Depth 0 at full Mix is the same to 1e-6 (the
  // transforms' own rounding). Apart 0 keeps a mono input mono, bit for bit.
  {
    rng_state() = 77;
    const std::vector<float> in = noise(1.0f, kRate, 0.5f);
    set(kRate, {{p::kMix, 0.0f}});
    const Stereo dry = run(device, in);
    bool same = true;
    for (size_t i = 0; i + kLatency < in.size(); ++i) same = same && dry.left[i + kLatency] == in[i];
    EXPECT(same, "mix 0 is the input, 2304 samples late, bit for bit");
    EXPECT(peak(dry.left, 0, kLatency) == 0.0, "and nothing comes before the latency");

    set(kRate, {{p::kDepth, 0.0f}});
    const Stereo still = run(device, in);
    double worst = 0.0;
    for (size_t i = 0; i + kLatency < in.size(); ++i)
      worst = std::max(worst, std::fabs(static_cast<double>(still.left[i + kLatency]) - in[i]));
    std::printf("depth 0, mix 1: worst difference from the delayed input %.3g\n", worst);
    EXPECT(worst < 1.0e-6, "depth 0 is the input, a latency late");

    set(kRate, {{p::kApart, 0.0f}});
    const Stereo mono = run(device, in);
    EXPECT(mono.left == mono.right, "apart 0: mono in, mono out, bit for bit");
    set(kRate, {});
    const Stereo wide = run(device, in);
    EXPECT(!(wide.left == wide.right), "apart at its default sets the sides apart");
  }

  // --- A comb of steady sines ------------------------------------------------------------------
  // Six partials on the centres of bands 4, 8 .. 24 at Grain 0.5 (356 Hz to 5.8 kHz, 400 Hz and
  // more apart). Scatter: each one's level moves at its own speed, 45/64 to 91/64 of Rate, between
  // the lift and the lift × (1 − Depth), and no two move together.
  const Bands half(0.5f);
  std::vector<double> partials;
  std::vector<int> bands;
  for (int j = 4; j <= 24; j += 4) {
    bands.push_back(j);
    partials.push_back(half.centre(j));
  }
  const std::vector<float> steady = comb(partials, 30.0f, 0.1f);
  {
    const float depth = 0.6f;
    const float rate = 2.0f;
    set(kRate, {{p::kDepth, depth}, {p::kRate, rate},  {p::kGrain, 0.5f}, {p::kLean, 0.0f},
                {p::kSoft, 1.0f},   {p::kVary, 0.0f},  {p::kApart, 0.0f}});
    const Stereo out = run(device, steady);
    const double lift = 1.0 / std::sqrt(1.0 - depth + 0.375 * depth * depth);
    std::vector<std::vector<float>> moves;
    std::vector<float> speeds;
    for (size_t h = 0; h < partials.size(); ++h) {
      const std::vector<float> env = from(partial(out.left, partials[h], kWindow, kHop), kSettled);
      const double hz = dominant_frequency(centred(env), kEnvRate, 0.5, 8.0);
      const double low = lowest(env) / 0.1, high = highest(env) / 0.1;
      std::printf("scatter: partial %.0f Hz moves at %.3f Hz, from %.3f to %.3f of its input (law: %.3f to %.3f)\n",
                  partials[h], hz, low, high, lift * (1.0 - depth), lift);
      EXPECT(hz > rate * 45.0 / 64.0 * 0.97 && hz < rate * 91.0 / 64.0 * 1.03, "scatter: a partial moves at about Rate");
      EXPECT_NEAR(high, lift, 0.04 * lift, "scatter: a partial's crest is the lift");
      EXPECT_NEAR(low / high, 1.0 - depth, 0.04, "scatter: a partial dips by Depth");
      moves.push_back(env);
      speeds.push_back(static_cast<float>(hz));
    }
    double together = 0.0;
    int pairs = 0;
    for (size_t a = 0; a < moves.size(); ++a)
      for (size_t b = a + 1; b < moves.size(); ++b, ++pairs) together += std::fabs(alike(moves[a], moves[b]));
    std::printf("scatter: mean |correlation| of two partials' levels %.3f\n", together / pairs);
    EXPECT(together / pairs < 0.25, "scatter: the partials do not move together");
    EXPECT(highest(speeds) - lowest(speeds) > 0.2,
           "scatter: the partials have speeds of their own");
  }

  // The waves: every partial at Rate itself, each band a sixth of a cycle behind the one under it
  // on Upward, ahead of it on Downward, and behind by its distance from 800 Hz on Outward.
  for (int pattern : {kUpward, kDownward, kOutward}) {
    const float rate = 1.0f;
    set(kRate, {{p::kDepth, 0.6f}, {p::kRate, rate},  {p::kGrain, 0.5f}, {p::kPattern, static_cast<float>(pattern)},
                {p::kLean, 0.0f},  {p::kSoft, 1.0f},  {p::kVary, 0.0f},  {p::kApart, 0.0f}});
    const Stereo out = run(device, steady);
    std::vector<double> phases;
    for (size_t h = 0; h < partials.size(); ++h) {
      const std::vector<float> env = from(partial(out.left, partials[h], kWindow, kHop), kSettled);
      const double hz = dominant_frequency(centred(env), kEnvRate, 0.3, 4.0);
      EXPECT_NEAR(hz, rate, 0.02, "a wave: every partial moves at Rate");
      phases.push_back(phase_at(env, rate, kEnvRate));
    }
    const double middle = half.place(Glimmer::kMidHz);
    double worst = 0.0;
    for (size_t h = 1; h < partials.size(); ++h) {
      const double behind = pattern == kUpward     ? (bands[h] - bands[0]) / 6.0
                            : pattern == kDownward ? -(bands[h] - bands[0]) / 6.0
                                                   : (std::fabs(bands[h] - middle) - std::fabs(bands[0] - middle)) / 6.0;
      worst = std::max(worst, std::fabs(turn(phases[h] - phases[0] + behind)));
    }
    std::printf("pattern %d: worst error of a partial's place in the wave %.4f cycles\n", pattern, worst);
    EXPECT(worst < 0.02, "a wave: the partials follow one another in order, six bands to a cycle");
  }

  // --- The level of the whole holds --------------------------------------------------------------
  // The lift keeps each band's power over a cycle at its input's. One partial on Upward at 2 Hz
  // (every cycle whole): its mean power over 28 s against the input's, where the lift asked for is
  // under 6 dB; and where it is not (Depth 1, Soft 0, Vary 1 asks for 12 dB) what is missing.
  {
    struct Case {
      float depth, soft, vary;
      double expect_db;  // of the mean power against the input
      const char* what;
    };
    const Case cases[] = {
        {0.65f, 0.6f, 0.35f, 0.0, "as it starts"},
        {1.0f, 1.0f, 0.0f, 0.0, "full depth, soft"},
        {0.6f, 0.0f, 0.0f, 0.0, "sudden"},
        {0.5f, 0.5f, 1.0f, 0.0, "varied"},
        {1.0f, 0.0f, 1.0f, 10.0 * std::log10(4.0 * 0.18 / 3.0), "deep, sudden and varied: the lift stops at 6 dB"},
    };
    const std::vector<double> one = {partials[2]};
    const std::vector<float> tone = comb(one, 30.0f, 0.25f);
    for (const Case& c : cases) {
      set(kRate, {{p::kDepth, c.depth}, {p::kRate, 2.0f},   {p::kGrain, 0.5f},  {p::kPattern, kUpward},
                  {p::kLean, 0.0f},     {p::kSoft, c.soft}, {p::kVary, c.vary}, {p::kApart, 0.0f}});
      const Stereo out = run(device, tone);
      // 28 s is 56 cycles: from 1 s to 29 s.
      const double level = db(rms(out.left, 48000, 29 * 48000) / rms(tone, 48000, 29 * 48000));
      std::printf("one partial, %s: mean power %+.2f dB of the input (law %+.2f), peak %.3f of the input's\n", c.what,
                  level, c.expect_db, peak(out.left) / 0.25);
      EXPECT_NEAR(level, c.expect_db, c.vary > 0.0f ? 0.6 : 0.15, "a band's power over its cycles is the input's");
      EXPECT(peak(out.left) <= 0.25 * Glimmer::kMaxLift * 1.01, "a band is never lifted by more than 6 dB");
    }
  }
  // Twenty-four partials, one on every band from 3 to 26, as the device starts but for Lean 0:
  // the summed level over 30 s is the input's, and no quarter second of it strays far.
  {
    std::vector<double> many;
    for (int j = 3; j <= 26; ++j) many.push_back(half.centre(j));
    const std::vector<float> chord = comb(many, 31.0f, 0.03f);
    for (int pattern : {kScatter, kUpward}) {
      set(kRate, {{p::kGrain, 0.5f}, {p::kLean, 0.0f}, {p::kPattern, static_cast<float>(pattern)}, {p::kApart, 0.0f}});
      const Stereo out = run(device, chord);
      const double whole = db(rms(out.left, 48000, 30 * 48000) / rms(chord, 48000, 30 * 48000));
      double low = 99.0, high = -99.0;
      for (size_t at = 48000; at + 12000 <= 30 * 48000; at += 12000) {
        const double level = db(rms(out.left, at, at + 12000) / rms(chord, at - kLatency, at - kLatency + 12000));
        low = std::min(low, level);
        high = std::max(high, level);
      }
      std::printf("24 partials, pattern %d: summed level %+.2f dB of the input; quarter seconds from %+.2f to %+.2f dB\n",
                  pattern, whole, low, high);
      EXPECT(std::fabs(whole) < 0.4, "the summed level of a comb is the input's");
      EXPECT(low > -3.0 && high < 3.0, "and no quarter second of it is 3 dB off");
    }
  }

  // --- Depth and Lean ----------------------------------------------------------------------------
  // The dip follows Depth; Lean takes it away from one end: to the right the lowest partial
  // (356 Hz, 0.31 of the way from 100 Hz to 6.4 kHz) keeps that share of the depth, to the left the
  // highest (5.8 kHz, 0.98 of the way) loses that share of it.
  {
    const auto dip = [&](float depth, float lean, size_t which) {
      set(kRate, {{p::kDepth, depth}, {p::kRate, 2.0f}, {p::kGrain, 0.5f}, {p::kPattern, kUpward},
                  {p::kLean, lean},   {p::kSoft, 1.0f}, {p::kVary, 0.0f},  {p::kApart, 0.0f}});
      const Stereo out = run(device, steady, steady);
      const std::vector<float> env = from(partial(out.left, partials[which], kWindow, kHop), kSettled);
      return 1.0 - lowest(env) / highest(env);
    };
    for (float depth : {0.1f, 0.35f, 0.8f, 1.0f}) {
      const double measured = dip(depth, 0.0f, 3);
      std::printf("depth %.2f: a partial dips by %.3f of its crest\n", depth, measured);
      EXPECT_NEAR(measured, depth, 0.03, "the dip is Depth");
    }
    const double low_place = std::log2(partials.front() / 100.0) / 6.0;
    const double high_place = std::log2(partials.back() / 100.0) / 6.0;
    const double right_low = dip(0.8f, 1.0f, 0), right_high = dip(0.8f, 1.0f, partials.size() - 1);
    const double left_low = dip(0.8f, -1.0f, 0), left_high = dip(0.8f, -1.0f, partials.size() - 1);
    std::printf("lean +1: lows dip %.3f, highs %.3f; lean -1: lows %.3f, highs %.3f (law %.3f %.3f %.3f %.3f)\n",
                right_low, right_high, left_low, left_high, 0.8 * low_place, 0.8 * high_place, 0.8 * (1.0 - low_place),
                0.8 * (1.0 - high_place));
    EXPECT_NEAR(right_low, 0.8 * low_place, 0.03, "lean right: the lows keep still");
    EXPECT_NEAR(right_high, 0.8 * high_place, 0.03, "lean right: the highs flicker");
    EXPECT_NEAR(left_low, 0.8 * (1.0 - low_place), 0.03, "lean left: the lows flicker");
    EXPECT_NEAR(left_high, 0.8 * (1.0 - high_place), 0.03, "lean left: the highs keep still");
  }

  // --- Soft, Vary, Apart ---------------------------------------------------------------------------
  // On Upward at 0.9375 Hz a cycle is 200 values of the envelope exactly.
  const float slow = 0.9375f;
  const size_t cycle = 200;
  const auto wave_env = [&](std::initializer_list<Setting> more, bool right = false) {
    set(kRate, {{p::kDepth, 1.0f}, {p::kRate, slow},  {p::kGrain, 0.5f}, {p::kPattern, kUpward},
                {p::kLean, 0.0f},  {p::kSoft, 1.0f},  {p::kVary, 0.0f},  {p::kApart, 0.0f}});
    for (const Setting& s : more) device.set_param(s.id, s.value);
    const Stereo out = run(device, steady);
    return from(partial(right ? out.right : out.left, partials[3], kWindow, kHop), kSettled);
  };
  {
    // Soft: the share of a cycle a band spends above half its crest is a + b: half at Soft 1,
    // a fifth at Soft 0.
    for (float soft : {1.0f, 0.5f, 0.0f}) {
      const std::vector<float> env = wave_env({{p::kSoft, soft}});
      const double half_way = 0.5 * highest(env);
      size_t lit = 0;
      const size_t whole = (env.size() / cycle) * cycle;
      for (size_t i = 0; i < whole; ++i) lit += env[i] > half_way ? 1 : 0;
      const double share = static_cast<double>(lit) / static_cast<double>(whole);
      const double law = 0.06 * (1.0 - soft) + 0.14 + 0.36 * soft;
      std::printf("soft %.1f: a band is above half its crest for %.3f of a cycle (law %.3f)\n", soft, share, law);
      EXPECT_NEAR(share, law, 0.02, "Soft sets how long a flash lasts");
    }
    // Vary: the height of each flash. The crest of every cycle, taken from trough to trough.
    const auto crests = [&](const std::vector<float>& env) {
      size_t start = 0;
      for (size_t i = 1; i < cycle; ++i)
        if (env[i] < env[start]) start = i;
      std::vector<float> heights;
      for (size_t at = start; at + cycle <= env.size(); at += cycle)
        heights.push_back(static_cast<float>(peak(env, at, at + cycle)) / 0.1f);
      return heights;
    };
    const std::vector<float> even = crests(wave_env({}));
    const std::vector<float> varied = crests(wave_env({{p::kVary, 1.0f}}));
    const std::vector<float> some = crests(wave_env({{p::kVary, 0.4f}}));
    std::printf("vary 0: %zu flashes from %.3f to %.3f; vary 0.4: %.3f to %.3f; vary 1: %.3f to %.3f, mean %.3f\n",
                even.size(), lowest(even), highest(even), lowest(some), highest(some), lowest(varied), highest(varied),
                mean(varied));
    EXPECT(highest(even) - lowest(even) < 0.01, "vary 0: every flash is as bright as the last");
    // At Vary 0.4 a flash is 0.6 to 1 of the lift, which stops at 2 there as at Vary 1.
    const double lift_some = std::min(2.0, 1.0 / std::sqrt(0.375 * (1.0 - 0.4 + 0.16 / 3.0)));
    EXPECT(lowest(some) > 0.58 * lift_some && highest(some) < 1.01 * lift_some && highest(some) - lowest(some) > 0.4,
           "vary 0.4: the flashes are 0.6 to 1 of the tallest");
    EXPECT(lowest(varied) < 0.25 && highest(varied) > 1.7 && highest(varied) < 2.02,
           "vary 1: the flashes are anything from nothing to the whole lift");
    EXPECT_NEAR(mean(varied), 1.0, 0.25, "vary 1: and half of it on the whole");

    // Apart: the right side's wave runs Apart/2 of a cycle off the left's.
    const std::vector<float> left = wave_env({});
    for (float apart : {0.0f, 0.5f, 1.0f}) {
      const std::vector<float> right = wave_env({{p::kApart, apart}}, true);
      const double off = turn(phase_at(right, slow, kEnvRate) - phase_at(left, slow, kEnvRate));
      const double together = alike(left, right);
      std::printf("apart %.1f on a wave: the right side is %.3f of a cycle off, correlation %+.3f\n", apart, off, together);
      EXPECT_NEAR(std::fabs(off), 0.5 * apart, 0.01, "Apart moves the right side's wave off the left's");
      EXPECT_NEAR(together, std::cos(kPi * apart), 0.03, "and their envelopes part");
    }
  }
  // On Scatter every band's right side is off by its own amount: over the six partials the two
  // sides' envelopes agree less and less.
  {
    double apart_mean[3] = {0.0, 0.0, 0.0};
    int at = 0;
    for (float apart : {0.0f, 0.5f, 1.0f}) {
      set(kRate, {{p::kDepth, 0.8f}, {p::kRate, 2.0f}, {p::kGrain, 0.5f}, {p::kLean, 0.0f},
                  {p::kSoft, 1.0f},  {p::kVary, 0.0f}, {p::kApart, apart}});
      const Stereo out = run(device, steady);
      for (double hz : partials)
        apart_mean[at] += alike(from(partial(out.left, hz, kWindow, kHop), kSettled),
                                from(partial(out.right, hz, kWindow, kHop), kSettled)) / static_cast<double>(partials.size());
      ++at;
    }
    std::printf("apart on scatter: mean correlation of the sides' envelopes %.3f, %.3f, %.3f at 0, 0.5, 1\n",
                apart_mean[0], apart_mean[1], apart_mean[2]);
    EXPECT(apart_mean[0] > 0.9999, "apart 0: the sides flicker as one");
    EXPECT(apart_mean[1] < 0.9 && apart_mean[2] < apart_mean[1] - 0.2, "apart: the sides' flicker parts");
  }

  // --- Grain and Rate ------------------------------------------------------------------------------
  // Two partials 110 Hz apart about 1 kHz. At Grain 0 a band is 720 Hz wide there and level over
  // its middle half: both lie in it and move as one. At Grain 1 a band is 59 Hz wide and they are
  // two bands apart: each moves on its own.
  {
    const double centre = Bands(0.0f).centre(3);  // 1010 Hz
    const std::vector<double> pair = {centre - 55.0, centre + 55.0};
    const std::vector<float> two = comb(pair, 30.0f, 0.2f);
    double together[2];
    int at = 0;
    for (float grain : {0.0f, 1.0f}) {
      set(kRate, {{p::kDepth, 0.8f}, {p::kRate, 1.0f}, {p::kGrain, grain}, {p::kLean, 0.0f},
                  {p::kSoft, 1.0f},  {p::kVary, 0.0f}, {p::kApart, 0.0f}});
      const Stereo out = run(device, two);
      const size_t settled = static_cast<size_t>((kLatency + 3 * kFrame) / kHop);
      together[at++] = alike(from(partial(out.left, pair[0], 2048, kHop), settled),
                             from(partial(out.left, pair[1], 2048, kHop), settled));
    }
    std::printf("two partials 110 Hz apart: correlation of their levels %.3f at grain 0, %.3f at grain 1\n", together[0],
                together[1]);
    EXPECT(together[0] > 0.98, "grain 0: neighbouring partials flicker as one region");
    EXPECT(std::fabs(together[1]) < 0.3, "grain 1: neighbouring partials flicker on their own");
  }
  // Rate over its range, on a wave (every band at Rate itself). The frames are 43 ms long and
  // overlap, which rounds a fast flicker off: the dip that is left at 10 Hz is printed and held.
  {
    for (float rate : {0.2f, 2.0f, 10.0f}) {
      set(kRate, {{p::kDepth, 0.8f}, {p::kRate, rate}, {p::kGrain, 0.5f}, {p::kPattern, kUpward},
                  {p::kLean, 0.0f},  {p::kSoft, 1.0f}, {p::kVary, 0.0f},  {p::kApart, 0.0f}});
      const Stereo out = run(device, steady);
      // A shorter box for the fast one: 512 samples, nulls every 93.75 Hz.
      const int window = rate > 5.0f ? 512 : kWindow;
      const std::vector<float> env = from(partial(out.left, partials[3], window, 64), 4 * kSettled);
      const double hz = dominant_frequency(centred(env), kRate / 64.0, rate * 0.5, rate * 2.0);
      const double dip = 1.0 - lowest(env) / highest(env);
      std::printf("rate %.1f Hz: the partial moves at %.3f Hz and dips by %.3f of its crest\n", rate, hz, dip);
      EXPECT_NEAR(hz, rate, 0.03 * rate, "the flicker runs at Rate");
      EXPECT(dip > (rate > 5.0f ? 0.7 : 0.77), "and keeps its depth");
    }
  }

  // --- The clock ---------------------------------------------------------------------------------
  // It runs by the sample count and never starts again from the sound: a comb that stops for four
  // seconds (the device sleeps after a tenth of one) comes back to the very gains a comb that never
  // stopped has by then.
  {
    const std::vector<float> whole = comb(partials, 8.0f, 0.1f);
    std::vector<float> gapped = whole;
    for (size_t i = 2 * 48000; i < 6 * 48000; ++i) gapped[i] = 0.0f;
    set(kRate, {});
    const Stereo straight = run(device, whole);
    set(kRate, {});
    const Stereo across = run(device, gapped);
    double worst = 0.0;
    for (size_t i = 6 * 48000 + kLatency + kFrame; i < whole.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(across.left[i]) - straight.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(across.right[i]) - straight.right[i]));
    }
    std::printf("after 4 s of silence: worst difference from the comb that never stopped %.3g\n", worst);
    EXPECT(peak(across.left, 3 * 48000, 5 * 48000) == 0.0, "the device is silent in the gap");
    EXPECT(worst < 1.0e-6, "the flicker keeps its place through silence and sleep");

    // And a change of Rate carries the phase on: no jump in a partial's level.
    set(kRate, {{p::kPattern, kUpward}, {p::kSoft, 1.0f}, {p::kVary, 0.0f}, {p::kRate, 0.5f}, {p::kGrain, 0.5f}});
    const Stereo before = run(device, std::vector<float>(whole.begin(), whole.begin() + 4 * 48000));
    device.set_param(p::kRate, 4.0f);
    const Stereo after = run(device, std::vector<float>(whole.begin() + 4 * 48000, whole.end()));
    const Stereo both = concat(before, after);
    const std::vector<float> env = partial(both.left, partials[3], kWindow, 64);
    double jump = 0.0;
    for (size_t i = (3 * 48000) / 64; i + 1 < env.size(); ++i)
      jump = std::max(jump, std::fabs(static_cast<double>(env[i + 1]) - env[i]));
    // At 4 Hz and Depth 0.65 a level of 0.1 moves by 0.0011 a step at its fastest.
    std::printf("rate 0.5 to 4 Hz: the largest step of a partial's level %.4f\n", jump);
    EXPECT(jump < 0.003, "a change of Rate carries the phase on");
  }

  // --- Block sizes, across a sleep ---------------------------------------------------------------
  // A burst, a silence, a burst, at block sizes 128, 1, 2048 and 37. The silence is stepped across
  // the moment the device falls asleep (0.19 s after the burst: a latency and a frame to play out,
  // then a hold of a tenth of a second), and in every second run Rate, Depth, Pattern and Mix are
  // moved in the middle of it.
  {
    double worst = 0.0;
    int step = 0;
    for (float gap = 0.05f; gap < 0.5f; gap += 0.0137f, ++step) {
      rng_state() = 99;
      std::vector<float> phrase = noise(0.2f, kRate, 0.5f);
      const size_t change = phrase.size() + static_cast<size_t>(0.5f * gap * kRate);
      const std::vector<float> quiet = silence(gap, kRate);
      const std::vector<float> again = noise(0.3f, kRate, 0.5f);
      phrase.insert(phrase.end(), quiet.begin(), quiet.end());
      phrase.insert(phrase.end(), again.begin(), again.end());
      const std::vector<float> head(phrase.begin(), phrase.begin() + static_cast<long>(change));
      const std::vector<float> rest(phrase.begin() + static_cast<long>(change), phrase.end());
      Stereo reference;
      for (int block : {128, 1, 2048, 37}) {
        set(kRate, {});
        Stereo render = run(device, head, block);
        if (step % 2 == 1) {
          device.set_param(p::kRate, 7.0f);
          device.set_param(p::kDepth, 1.0f);
          device.set_param(p::kPattern, kOutward);
          device.set_param(p::kMix, 0.6f);
        }
        render = concat(render, run(device, rest, block));
        if (block == 128) {
          reference = render;
          continue;
        }
        for (size_t i = 0; i < render.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(render.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(render.right[i]) - reference.right[i]));
        }
      }
    }
    std::printf("block sizes across a silence, %d gaps: worst difference %.3g\n", step, worst);
    EXPECT(worst < 1.0e-6, "the same at block sizes 1, 37, 128 and 2048 across a sleep, knobs moved in it or not");
  }
  // Knobs moved while asleep snap: Mix set to 0 in a silence gives the dry sound from the first
  // sample after it, with no glide from the wet.
  {
    rng_state() = 31;
    const std::vector<float> burst = noise(0.3f, kRate, 0.5f);
    set(kRate, {});
    run(device, burst);
    render(device, 1.0f, kRate);
    device.set_param(p::kMix, 0.0f);
    const Stereo woken = run(device, burst);
    bool same = true;
    for (size_t i = 0; i + kLatency < burst.size(); ++i) same = same && woken.left[i + kLatency] == burst[i];
    EXPECT(same, "mix moved while asleep snaps on wake");
  }

  // --- Bad input ---------------------------------------------------------------------------------
  // A NaN, an infinity and 1e30 in the input: finite out, and a latency and a frame later the very
  // sound there would have been without them.
  {
    rng_state() = 77;
    const std::vector<float> good = noise(1.5f, kRate, 0.5f);
    std::vector<float> bad = good;
    bad[20000] = std::nanf("");
    bad[20001] = std::numeric_limits<float>::infinity();
    bad[20002] = -1.0e30f;
    bad[20003] = 1.0e30f;
    set(kRate, {});
    const Stereo good_out = run(device, good);
    set(kRate, {});
    const Stereo bad_out = run(device, bad);
    const size_t clear = 20004 + kLatency + kFrame;
    double off = 0.0;
    for (size_t i = clear; i < good.size(); ++i) {
      off = std::max(off, std::fabs(static_cast<double>(bad_out.left[i]) - good_out.left[i]));
      off = std::max(off, std::fabs(static_cast<double>(bad_out.right[i]) - good_out.right[i]));
    }
    EXPECT(finite(bad_out.left) && finite(bad_out.right), "NaN, infinity and 1e30 in: finite out");
    EXPECT(peak(bad_out.left) < 4.0, "and bounded");
    EXPECT(off < 1.0e-6, "and the same as if they had never come, a latency and a frame later");
    EXPECT(rms(bad_out.left, clear, good.size()) > 0.1, "and the sound is back");
    // A stretch of nothing but bad samples, then silence: the device still comes to rest.
    set(kRate, {});
    run(device, std::vector<float>(4800, std::nanf("")));
    render(device, 0.5f, kRate);
    const Stereo after = render(device, 0.25f, kRate);
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "exact silence after bad input");
  }

  device.init(kRate);
  rng_state() = 5;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("glimmer", 10.0f, kRate, [&] { run(device, input); });
  return finish("glimmer");
}
