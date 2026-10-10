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

// The largest second difference: what a click of size s adds s to, where a smooth sound has next to none.
static double max_bend(const std::vector<float>& x, size_t start = 0) {
  double worst = 0.0;
  for (size_t i = start + 2; i < x.size(); ++i)
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  return worst;
}

static const int kWindow = 1024;  // the envelope's two boxes: nulls every 46.9 Hz
static const int kHop = 256;
static const double kEnvRate = kRate / kHop;
// Skip what the device and the boxes need to settle: the latency, a frame, the boxes.
static const size_t kSettled = static_cast<size_t>((kLatency + 2 * kFrame) / kHop);

// The presets of device.json, for the level checks: each lists what it changes from the defaults.
struct Preset {
  const char* name;
  std::vector<Setting> settings;
};
static const std::vector<Preset> kPresets = {
    {"Light on water", {}},
    {"Faint sheen", {{p::kDepth, 0.35f}, {p::kRate, 5.0f}, {p::kGrain, 0.9f}, {p::kLean, 0.6f}, {p::kSoft, 0.9f}, {p::kVary, 0.2f}, {p::kApart, 0.7f}}},
    {"Slow weather", {{p::kDepth, 0.85f}, {p::kRate, 0.12f}, {p::kGrain, 0.25f}, {p::kLean, 0.0f}, {p::kSoft, 1.0f}, {p::kVary, 0.5f}, {p::kApart, 0.6f}}},
    {"Rising ripple", {{p::kDepth, 0.8f}, {p::kRate, 0.6f}, {p::kGrain, 0.55f}, {p::kPattern, 1.0f}, {p::kLean, 0.0f}, {p::kSoft, 0.8f}, {p::kVary, 0.0f}, {p::kApart, 0.2f}}},
    {"Falling ripple", {{p::kDepth, 0.75f}, {p::kRate, 0.35f}, {p::kGrain, 0.4f}, {p::kPattern, 2.0f}, {p::kLean, 0.2f}, {p::kSoft, 0.9f}, {p::kVary, 0.1f}, {p::kApart, 0.3f}}},
    {"Rings outward", {{p::kDepth, 0.7f}, {p::kRate, 1.1f}, {p::kGrain, 0.6f}, {p::kPattern, 3.0f}, {p::kLean, 0.0f}, {p::kSoft, 0.5f}, {p::kVary, 0.15f}, {p::kApart, 0.4f}}},
    {"Sudden glints", {{p::kDepth, 0.9f}, {p::kRate, 1.4f}, {p::kGrain, 0.85f}, {p::kLean, 0.5f}, {p::kSoft, 0.0f}, {p::kVary, 0.7f}, {p::kApart, 0.8f}}},
    {"Glitter on top", {{p::kDepth, 1.0f}, {p::kRate, 6.0f}, {p::kGrain, 1.0f}, {p::kLean, 1.0f}, {p::kSoft, 0.3f}, {p::kVary, 0.5f}, {p::kApart, 1.0f}}},
    {"Stirring lows", {{p::kDepth, 0.8f}, {p::kRate, 0.4f}, {p::kGrain, 0.3f}, {p::kLean, -1.0f}, {p::kSoft, 1.0f}, {p::kVary, 0.3f}, {p::kApart, 0.3f}}},
    {"Fast shimmer", {{p::kDepth, 0.5f}, {p::kRate, 9.0f}, {p::kGrain, 0.8f}, {p::kLean, 0.2f}, {p::kSoft, 1.0f}, {p::kVary, 0.2f}, {p::kApart, 0.6f}}},
    {"Wide twinkle", {{p::kDepth, 0.8f}, {p::kRate, 3.0f}, {p::kGrain, 0.75f}, {p::kLean, 0.1f}, {p::kSoft, 0.4f}, {p::kVary, 0.6f}, {p::kApart, 1.0f}}},
    {"Moving as one", {{p::kDepth, 0.7f}, {p::kRate, 1.5f}, {p::kGrain, 0.5f}, {p::kLean, 0.0f}, {p::kSoft, 0.7f}, {p::kVary, 0.2f}, {p::kApart, 0.0f}}},
    {"Broad swells", {{p::kDepth, 0.9f}, {p::kRate, 0.25f}, {p::kGrain, 0.0f}, {p::kLean, 0.0f}, {p::kSoft, 1.0f}, {p::kVary, 0.3f}, {p::kApart, 0.5f}}},
    {"Half shade", {{p::kDepth, 0.8f}, {p::kRate, 0.8f}, {p::kGrain, 0.6f}, {p::kSoft, 0.8f}, {p::kMix, 0.5f}}},
    {"Strobe rising", {{p::kDepth, 0.9f}, {p::kRate, 8.0f}, {p::kGrain, 0.6f}, {p::kPattern, 1.0f}, {p::kLean, 0.0f}, {p::kSoft, 0.1f}, {p::kVary, 0.0f}, {p::kApart, 0.5f}}},
    {"Long tide", {{p::kDepth, 0.9f}, {p::kRate, 0.05f}, {p::kGrain, 0.2f}, {p::kPattern, 3.0f}, {p::kLean, 0.0f}, {p::kSoft, 1.0f}, {p::kVary, 0.0f}, {p::kApart, 0.5f}}},
};

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

    // Apart: the right side's wave runs Apart/3 of a cycle off the left's (kWaveApart: a half would
    // leave nothing of the ripple in a mono sum, which the second check's section measures).
    const std::vector<float> left = wave_env({});
    for (float apart : {0.0f, 0.5f, 1.0f}) {
      const std::vector<float> right = wave_env({{p::kApart, apart}}, true);
      const double off = turn(phase_at(right, slow, kEnvRate) - phase_at(left, slow, kEnvRate));
      const double together = alike(left, right);
      std::printf("apart %.1f on a wave: the right side is %.3f of a cycle off, correlation %+.3f\n", apart, off, together);
      EXPECT_NEAR(std::fabs(off), Glimmer::kWaveApart * apart, 0.01, "Apart moves the right side's wave off the left's");
      EXPECT_NEAR(together, std::cos(2.0 * kPi * Glimmer::kWaveApart * apart), 0.03, "and their envelopes part");
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

  // --- Clicks ------------------------------------------------------------------------------------
  // A 110 Hz sine at half scale steps by 0.0072 a sample, and by twice that at the full lift. Every
  // control is thrown from one end to the other while it sounds, and every Pattern switched to and
  // from every other: the largest step is held to what the same sound steps by with no event in it
  // (the two settings each run on their own), and a little for the turn between them.
  {
    const std::vector<float> tone = sine(110.0f, 2.0f, kRate, 0.5f);
    const std::vector<float> first(tone.begin(), tone.begin() + 48000 + 77);
    const std::vector<float> second(tone.begin() + 48000 + 77, tone.end());
    struct Move {
      int id;
      float from, to;
    };
    std::vector<Move> moves;
    for (int id = 0; id < p::kNumParams; ++id) {
      if (id == p::kPattern) continue;
      moves.push_back({id, p::kParamMin[id], p::kParamMax[id]});
      moves.push_back({id, p::kParamMax[id], p::kParamMin[id]});
    }
    for (int a = 0; a < 4; ++a)
      for (int b = 0; b < 4; ++b)
        if (a != b) moves.push_back({p::kPattern, static_cast<float>(a), static_cast<float>(b)});
    const size_t onset = kLatency + 2 * kFrame;  // past the tone's own start, which is a corner
    double worst_ratio = 0.0, worst_bend = 0.0;
    int worst_id = -1, worst_bend_id = -1;
    for (const Move& move : moves) {
      double plain = 0.0, plain_bend = 0.0;
      for (float value : {move.from, move.to}) {
        set(kRate, {{p::kDepth, 1.0f}, {p::kGrain, 0.5f}, {move.id, value}});
        const Stereo out = run(device, tone);
        plain = std::max(plain, std::max(max_step(out.left, onset), max_step(out.right, onset)));
        plain_bend = std::max(plain_bend, std::max(max_bend(out.left, onset), max_bend(out.right, onset)));
      }
      set(kRate, {{p::kDepth, 1.0f}, {p::kGrain, 0.5f}, {move.id, move.from}});
      Stereo out = run(device, first);
      device.set_param(move.id, move.to);
      out = concat(out, run(device, second));
      const double ratio = std::max(max_step(out.left, onset), max_step(out.right, onset)) / std::max(plain, 0.0072);
      // The sine's own bend at full lift is 0.0001; the turn of a 5 ms glide of Mix adds its slope's start.
      const double bend = std::max(max_bend(out.left, onset), max_bend(out.right, onset)) - plain_bend;
      if (ratio > worst_ratio) {
        worst_ratio = ratio;
        worst_id = move.id;
      }
      if (bend > worst_bend) {
        worst_bend = bend;
        worst_bend_id = move.id;
      }
    }
    std::printf("moves while sounding: the worst step is %.3f of the same sound's own (control %d); "
                "the worst bend added is %.6f (control %d)\n",
                worst_ratio, worst_id, worst_bend, worst_bend_id);
    EXPECT(worst_ratio < 1.05, "no control clicks when it is thrown across its range while sounding");
    EXPECT(worst_bend < 0.001, "nor leaves a corner in the wave");
  }

  // --- Rest --------------------------------------------------------------------------------------
  // After the sound stops and any control is moved, the device comes to rest: exact silence.
  {
    rng_state() = 12;
    const std::vector<float> burst = noise(0.3f, kRate, 0.5f);
    bool rests = true;
    for (int id = 0; id < p::kNumParams; ++id) {
      for (float value : {p::kParamMin[id], p::kParamMax[id]}) {
        set(kRate, {});
        run(device, burst);
        render(device, 0.02f, kRate);
        device.set_param(id, value);
        render(device, 0.5f, kRate);
        const Stereo after = render(device, 0.25f, kRate);
        rests = rests && peak(after.left) == 0.0 && peak(after.right) == 0.0;
      }
    }
    EXPECT(rests, "the device comes to rest after every control move");
  }

  // --- Other sample rates ------------------------------------------------------------------------
  // Hertz and seconds are worked out again: at 44.1 and 96 kHz the same partials (on bands 3, 5, 7
  // and 9 at Grain 0.2, where a band is 100 Hz wide at the bottom at every rate) move at Rate and
  // follow one another by the same sixths of a cycle.
  {
    const Bands wide(0.2f);
    std::vector<double> four;
    for (int j = 3; j <= 9; j += 2) four.push_back(wide.centre(j));
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      const std::vector<float> tones = comb(four, 16.0f, 0.1f, rate);
      set(rate, {{p::kDepth, 0.8f}, {p::kRate, 2.0f}, {p::kGrain, 0.2f}, {p::kPattern, kUpward},
                 {p::kLean, 0.0f},  {p::kSoft, 1.0f}, {p::kVary, 0.0f},  {p::kApart, 0.0f}});
      const Stereo out = run(device, tones);
      const double env_rate = rate / kHop;
      std::vector<double> phases;
      double worst_hz = 0.0, least_dip = 1.0;
      for (double hz : four) {
        const std::vector<float> env = from(partial(out.left, hz, kWindow, kHop, rate), 2 * kSettled);
        worst_hz = std::max(worst_hz, std::fabs(dominant_frequency(centred(env), env_rate, 1.0, 4.0) - 2.0));
        least_dip = std::min(least_dip, 1.0 - lowest(env) / highest(env));
        phases.push_back(phase_at(env, 2.0, env_rate));
      }
      double worst = 0.0;
      for (size_t h = 1; h < four.size(); ++h) worst = std::max(worst, std::fabs(turn(phases[h] - phases[0] + 2.0 * h / 6.0)));
      std::printf("%.0f Hz: the partials move within %.3f Hz of Rate, dip by %.3f at the least, and keep their order to %.4f cycles\n",
                  rate, worst_hz, least_dip, worst);
      EXPECT(worst_hz < 0.04, "the flicker's rate is in Hz at every sample rate");
      EXPECT(least_dip > 0.76, "its depth is the same");
      EXPECT(worst < 0.02, "and the bands lie at the same frequencies");
    }
  }

  // --- Level ---------------------------------------------------------------------------------------
  // A held chord at full scale (four notes of four harmonics each, the loudest sample 1.0) for a
  // minute, through every preset and with every control at each end: the peak is never more than
  // 6 dB over the input's, the last twenty seconds are no louder than the first, and the level of
  // the whole minute is within 3 dB of the input's (within 7 where the lift stops, which only the
  // far ends of Depth, Soft and Vary together reach).
  {
    std::vector<float> chord(60 * 48000, 0.0f);
    const double notes[] = {110.0, 164.81, 220.0, 277.18};
    for (int note = 0; note < 4; ++note)
      for (int harmonic = 1; harmonic <= 4; ++harmonic)
        for (size_t i = 0; i < chord.size(); ++i)
          chord[i] += static_cast<float>(std::sin(note * 1.3 + harmonic * 0.4 +
                                                  2.0 * kPi * notes[note] * harmonic * static_cast<double>(i) / kRate) /
                                         harmonic);
    const double top = peak(chord);
    for (float& v : chord) v = static_cast<float>(v / top);
    const double in_rms = rms(chord);
    double worst_peak = 0.0, loudest = -99.0, quietest = 99.0, most_growth = -99.0;
    const auto hold = [&](const char* what, bool report) {
      const Stereo out = run(device, chord);
      const double high = std::max(peak(out.left), peak(out.right));
      const double level = db(rms(out.left) / in_rms);
      const double growth = db(rms(out.left, 40 * 48000, 60 * 48000) / rms(out.left, 48000, 21 * 48000));
      worst_peak = std::max(worst_peak, high);
      loudest = std::max(loudest, level);
      quietest = std::min(quietest, level);
      most_growth = std::max(most_growth, growth);
      if (report) std::printf("  %-18s peak %.3f, level %+.2f dB, last 20 s against first %+.2f dB\n", what, high, level, growth);
      EXPECT(finite(out.left) && finite(out.right), "a held chord at full scale stays finite");
    };
    std::printf("a full-scale chord held for a minute:\n");
    for (const Preset& preset : kPresets) {
      device.init(kRate);
      for (const Setting& s : preset.settings) device.set_param(s.id, s.value);
      hold(preset.name, true);
    }
    EXPECT(worst_peak <= 2.0 * 1.02, "no preset peaks more than 6 dB over a full-scale chord");
    EXPECT(loudest < 3.0 && quietest > -3.0, "every preset holds the chord's level within 3 dB");
    for (int id = 0; id < p::kNumParams; ++id) {
      for (float value : {p::kParamMin[id], p::kParamMax[id]}) {
        set(kRate, {{id, value}});
        hold("", false);
      }
    }
    set(kRate, {{p::kDepth, 1.0f}, {p::kSoft, 0.0f}, {p::kVary, 1.0f}, {p::kGrain, 1.0f}, {p::kRate, 12.0f}});
    hold("deep, sudden, varied", true);
    std::printf("  over presets and extremes: peak %.3f, level %+.2f to %+.2f dB, most growth %+.2f dB\n", worst_peak,
                quietest, loudest, most_growth);
    EXPECT(worst_peak <= 2.0 * 1.02, "nothing peaks more than 6 dB over a full-scale chord");
    EXPECT(loudest < 3.0 && quietest > -7.0, "the level holds, and falls by no more than the lift is short of");
    EXPECT(most_growth < 2.0, "and nothing grows");
  }

  // --- Part-way Mix ------------------------------------------------------------------------------
  // The wet sound is the dry one times a gain that is never negative, in step with it: at Mix 0.5
  // no held tone over the piano's range can fall under half (6 dB), whatever the preset, and with
  // Depth 0 it is the input at any Mix. Twenty-two tones from A0 to C8, four seconds each.
  {
    double least = 9.0, most = 0.0, plain = 0.0;
    for (int key = 0; key < 88; key += 4) {
      const double hz = 27.5 * std::pow(2.0, key / 12.0);
      const std::vector<float> tone = sine(static_cast<float>(hz), 4.0f, kRate, 0.5f);
      const size_t span = static_cast<size_t>(4.0 * kRate / hz);  // four periods
      for (const Preset& preset : kPresets) {
        device.init(kRate);
        for (const Setting& s : preset.settings) device.set_param(s.id, s.value);
        device.set_param(p::kMix, 0.5f);
        const Stereo out = run(device, tone);
        for (size_t at = kLatency + 2 * kFrame; at + span <= tone.size(); at += span) {
          for (const std::vector<float>* side : {&out.left, &out.right}) {
            const double ratio = rms(*side, at, at + span) / rms(tone, at - kLatency, at - kLatency + span);
            least = std::min(least, ratio);
            most = std::max(most, ratio);
          }
        }
      }
      set(kRate, {{p::kDepth, 0.0f}, {p::kMix, 0.5f}});
      const Stereo flat = run(device, tone);
      for (size_t i = 0; i + kLatency < tone.size(); ++i)
        plain = std::max(plain, std::fabs(static_cast<double>(flat.left[i + kLatency]) - tone[i]));
    }
    std::printf("mix 0.5, every preset, tones A0 to C8: a tone's level is %.3f to %.3f of its input; "
                "depth 0 differs from the input by %.3g\n", least, most, plain);
    EXPECT(least > 0.49, "at mix 0.5 no tone dips by more than 6 dB: the wet never cancels the dry");
    EXPECT(most < 1.52, "nor rises by more than half the lift");
    EXPECT(plain < 1.0e-6, "depth 0 is the input at any mix");
  }
  // And through the device as it starts, the long-term level of every one of those tones.
  {
    double low = 99.0, high = -99.0;
    for (int key = 0; key < 88; key += 4) {
      const double hz = 27.5 * std::pow(2.0, key / 12.0);
      const std::vector<float> tone = sine(static_cast<float>(hz), 24.0f, kRate, 0.5f);
      set(kRate, {});
      const Stereo out = run(device, tone);
      const double level = db(rms(out.left, 48000, tone.size()) / rms(tone, 48000, tone.size()));
      low = std::min(low, level);
      high = std::max(high, level);
    }
    std::printf("as it starts, tones A0 to C8 over 23 s: level %+.2f to %+.2f dB of the input\n", low, high);
    EXPECT(low > -1.5 && high < 1.5, "as it starts, every held tone keeps its level over time");
  }

  // --- What the frames do to an attack (printed, and held) ------------------------------------------
  // A gain per bin is a filter as long as the frame: a click through the flicker alone kept most of
  // its energy in its own sample and spread the rest over the frame about it, ahead of it as well as
  // behind, the more the finer the bands (−20.7 dB of it ahead as the device started, −16 dB at
  // Grain 1). Attacks now pass round the flicker, so a click comes out with next to none of that.
  {
    std::vector<float> click(48000, 0.0f);
    click[20000] = 1.0f;
    for (float grain : {0.0f, 0.7f, 1.0f}) {
      set(kRate, {{p::kGrain, grain}, {p::kApart, 0.0f}});
      const Stereo out = run(device, click);
      const size_t at = 20000 + kLatency;
      double before = 0.0, after = 0.0, all = 0.0;
      for (size_t i = at - kFrame; i < at + kFrame; ++i) {
        const double power = static_cast<double>(out.left[i]) * out.left[i];
        all += power;
        if (i + 48 < at) before += power;
        if (i > at + 48) after += power;
      }
      const double beyond = std::max(peak(out.left, 0, at - kFrame), peak(out.left, at + kFrame));
      std::printf("a click at grain %.1f: %.1f dB of its energy lands more than 1 ms ahead of it, %.1f dB behind; "
                  "beyond a frame either way %.3g\n",
                  grain, 10.0 * std::log10(before / all + 1e-12), 10.0 * std::log10(after / all + 1e-12), beyond);
      EXPECT(before / all < 1.0e-4, "a click keeps its energy at its own time: under −40 dB of it ahead");
      EXPECT(beyond == 0.0, "and none of it lies further off than a frame");
    }
  }

  // ================================================================================================
  // The second check. Each of these failed on the device as it was first built.
  // ================================================================================================

  // --- Attacks pass round the flicker ---------------------------------------------------------------
  // Twenty-four plucked notes 1.5 s apart (so the clock stands differently at each), short enough that
  // none rings into the next. Ahead of each: the largest sample in the 45 ms before it is heard against
  // the attack's own peak, and the energy there against that of the 45 ms after. As first built a note
  // came out with a fifth of its peak ahead of itself (−15.2 dB as the device started, −6.1 dB on a deep
  // fast wave) and −28.9 dB of the energy; the attack's own peak was down by up to 3.7 dB.
  const auto pluck_at = [](std::vector<float>& into, double start_s, double hz, double gain, double decay_s) {
    const size_t from = static_cast<size_t>(start_s * kRate);
    for (size_t i = from; i < into.size(); ++i) {
      const double t = static_cast<double>(i - from) / kRate;
      if (t > 8.0 * decay_s) break;
      double v = 0.0;
      for (int h = 1; h <= 12; ++h) v += std::sin(2.0 * kPi * hz * h * t) * std::exp(-t * h / decay_s) / h;
      into[i] += static_cast<float>(gain * std::min(1.0, t / 0.0003) * v);
    }
  };
  {
    const int notes = 24;
    std::vector<float> phrase(static_cast<size_t>((notes * 1.5 + 2.0) * kRate), 0.0f);
    const double pitches[] = {220.0, 329.63, 523.25, 146.83, 880.0, 261.63};
    for (int i = 0; i < notes; ++i) pluck_at(phrase, 0.5 + 1.5 * i, pitches[i % 6], 0.35, 0.15);
    struct Case {
      const char* what;
      std::vector<Setting> settings;
    };
    const Case cases[] = {
        {"as it starts", {}},
        {"finest, full depth, sudden", {{p::kGrain, 1.0f}, {p::kDepth, 1.0f}, {p::kSoft, 0.0f}}},
        {"a deep fast wave", {{p::kDepth, 0.9f}, {p::kRate, 8.0f}, {p::kGrain, 0.6f}, {p::kPattern, kUpward}, {p::kLean, 0.0f}, {p::kSoft, 0.1f}, {p::kVary, 0.0f}}},
    };
    const size_t window = static_cast<size_t>(0.045 * kRate), guard = 48, five = 240;
    for (const Case& c : cases) {
      device.init(kRate);
      for (const Setting& setting : c.settings) device.set_param(setting.id, setting.value);
      const Stereo out = run(device, phrase);
      double ahead = 0.0, after = 0.0, worst = 0.0, kept = 0.0, dry_peaks = 0.0;
      for (int i = 0; i < notes; ++i) {
        const size_t on = static_cast<size_t>((0.5 + 1.5 * i) * kRate) + static_cast<size_t>(kLatency);
        const double dry_peak = peak(phrase, on - kLatency, on - kLatency + five);
        for (size_t k = on - window; k < on - guard; ++k) ahead += static_cast<double>(out.left[k]) * out.left[k];
        for (size_t k = on; k < on + window; ++k) after += static_cast<double>(out.left[k]) * out.left[k];
        worst = std::max(worst, peak(out.left, on - window, on - guard) / dry_peak);
        kept += peak(out.left, on, on + five);
        dry_peaks += dry_peak;
      }
      std::printf("plucked notes, %s: ahead of the attack %.1f dB of its peak and %.1f dB of its energy; the attack's peak %+.2f dB\n",
                  c.what, db(worst), 10.0 * std::log10(ahead / after + 1e-30), db(kept / dry_peaks));
      EXPECT(db(worst) < -40.0, "nothing over −40 dB of a plucked note's peak comes out ahead of it");
      EXPECT(10.0 * std::log10(ahead / after + 1e-30) < -50.0, "and under −50 dB of its energy");
      EXPECT_NEAR(db(kept / dry_peaks), 0.0, 0.1, "the attack itself keeps its peak");
    }
  }
  // The pass opens for attacks alone. Meter 1 (how far the output has turned to the dry sound) read
  // every 32 samples from one second in: never open on a held chord, a chord of beating pairs, noise,
  // a tone under a fast tremolo or a low sine; open once for each of eighteen plucks, over a chord too,
  // and for a twentieth of the time at the most. With the notes eight a second, under a third of it.
  {
    const auto opened = [&](const std::vector<float>& x, double* share) {
      device.init(kRate);
      size_t open = 0, total = 0;
      int times = 0;
      bool was = false;
      for (size_t done = 0; done + 32 <= x.size(); done += 32) {
        for (int i = 0; i < 32; ++i) device.in_left()[i] = device.in_right()[i] = x[done + i];
        device.process(32);
        if (done < 48000) continue;
        const bool is = device.meter(1) > 0.0f;
        open += is ? 1 : 0;
        ++total;
        if (is && !was) ++times;
        was = is;
      }
      *share = static_cast<double>(open) / static_cast<double>(total);
      return times;
    };
    const size_t n = 20 * 48000;
    std::vector<float> held(n, 0.0f), beating(n, 0.0f), hiss(n), wobble(n), low(n), plucks(n, 0.0f), fast(n, 0.0f);
    rng_state() = 777u;
    for (size_t i = 0; i < n; ++i) {
      const double t = static_cast<double>(i) / kRate;
      for (double hz : {110.0, 164.81, 220.0, 277.18, 329.63, 415.3}) {
        for (int h = 1; h <= 10; ++h) held[i] += static_cast<float>(0.12 * std::sin(2.0 * kPi * hz * h * t + h * h) / std::pow(h, 1.5));
        beating[i] += static_cast<float>(0.1 * (std::sin(2.0 * kPi * hz * t) + std::sin(2.0 * kPi * hz * 1.004 * t)));
      }
      hiss[i] = 0.3f * white();
      wobble[i] = static_cast<float>(0.4 * std::sin(2.0 * kPi * 440.0 * t) * (0.5 - 0.5 * std::cos(2.0 * kPi * 8.0 * t)));
      low[i] = static_cast<float>(0.5 * std::sin(2.0 * kPi * 27.5 * t));
    }
    std::vector<float> over = held;
    for (int i = 0; i < 18; ++i) {
      pluck_at(plucks, 1.5 + i, 220.0 * (1 + i % 3), 0.3, 0.3);
      pluck_at(over, 1.5 + i, 440.0 * (1 + i % 3), 0.3, 0.3);
    }
    for (int i = 0; i < 148; ++i) pluck_at(fast, 1.5 + 0.125 * i, 220.0 * (1 + i % 4), 0.25, 0.2);
    double share = 0.0;
    for (const std::vector<float>* x : {&held, &beating, &hiss, &wobble, &low}) {
      EXPECT(opened(*x, &share) == 0, "held sound, noise, a tremolo and a low note never open the attack pass");
    }
    const int alone = opened(plucks, &share);
    const double alone_share = share;
    const int on_chord = opened(over, &share);
    std::printf("the attack pass: %d of 18 plucks open it (%.1f %% of the time), %d of 18 over a held chord (%.1f %%)", alone,
                100.0 * alone_share, on_chord, 100.0 * share);
    EXPECT(alone == 18 && on_chord == 18, "every pluck opens the pass, over a held chord too");
    EXPECT(alone_share < 0.05 && share < 0.05, "and for under a twentieth of the time at a note a second");
    opened(fast, &share);
    std::printf("; notes eight a second: open %.1f %% of the time\n", 100.0 * share);
    EXPECT(share < 0.33, "with notes eight a second the flicker still has two thirds of the time");
  }

  // --- Summed to mono, a wave keeps its ripple ------------------------------------------------------
  // The flicker itself is out − dry (a gain turns no phase). Its power in (L+R)/2 against its power in
  // one side, on a held comb through the Upward wave. With the sides half a cycle apart at Apart 1 (as
  // first built) each side's flicker was the other's opposite and the sum had lost it: −13.4 dB here.
  // A third of a cycle keeps a quarter of the power (−6 dB); Scatter keeps more.
  {
    for (int pattern : {kUpward, kScatter}) {
      set(kRate, {{p::kPattern, static_cast<float>(pattern)}, {p::kApart, 1.0f}, {p::kSoft, 1.0f}, {p::kLean, 0.0f}, {p::kGrain, 0.5f}});
      const Stereo out = run(device, steady);
      double one = 0.0, mono = 0.0;
      for (size_t i = 48000; i < out.left.size(); ++i) {
        const double dry = steady[i - kLatency];
        one += (out.left[i] - dry) * (out.left[i] - dry);
        mono += (0.5 * (out.left[i] + out.right[i]) - dry) * (0.5 * (out.left[i] + out.right[i]) - dry);
      }
      std::printf("apart 1, %s: the flicker left in a mono sum is %.1f dB of one side's\n", pattern == kUpward ? "a wave" : "scatter",
                  10.0 * std::log10(mono / one));
      EXPECT(10.0 * std::log10(mono / one) > -7.5, "summed to mono with the sides fully apart, the flicker is still there");
    }
  }

  // --- A partial between two bands keeps its level too ------------------------------------------------
  // Five partials on bands' centres against five half way between two bands (Grain 0.5, full Depth,
  // Soft 1, where the lift is not capped), over 58 s. As first built the ones between sat 0.8 dB under
  // on Scatter and 0.4 dB on a wave: the join of two gains that move apart has less power than either.
  {
    std::vector<double> on, between;
    for (int j = 5; j <= 21; j += 4) {
      on.push_back(half.centre(j));
      between.push_back(half.centre(j + 0.5));
    }
    const std::vector<float> on_comb = comb(on, 60.0f, 0.1f), between_comb = comb(between, 60.0f, 0.1f);
    for (int pattern : {kScatter, kUpward, kOutward}) {
      double level[2];
      for (int which = 0; which < 2; ++which) {
        const std::vector<float>& x = which == 0 ? on_comb : between_comb;
        set(kRate, {{p::kDepth, 1.0f}, {p::kRate, 2.0f}, {p::kGrain, 0.5f}, {p::kPattern, static_cast<float>(pattern)},
                    {p::kLean, 0.0f},  {p::kSoft, 1.0f}, {p::kVary, 0.0f},  {p::kApart, 0.0f}});
        const Stereo out = run(device, x);
        level[which] = db(rms(out.left, 48000, 59 * 48000) / rms(x, 48000, 59 * 48000));
      }
      std::printf("pattern %d, full depth: partials on bands' centres %+.2f dB of the input, half way between two bands %+.2f dB\n",
                  pattern, level[0], level[1]);
      EXPECT_NEAR(level[0], 0.0, 0.3, "a partial on a band's centre keeps its level");
      EXPECT_NEAR(level[1], 0.0, 0.4, "and so does one half way between two bands");
    }
  }

  // --- Grain is read between the frames ---------------------------------------------------------------
  // Laying the bands out again is a logarithm per bin. It is done 128 samples before the left side's
  // frame, in a block that holds neither side's transforms. So a Grain moved 64 samples before a frame
  // is not in that frame: the output is the untouched run's, bit for bit, until the next frame is heard
  // (512 + 256 samples after the first), and differs from there.
  {
    const size_t frame_at = 100 * 512;
    double same = 0.0, changed = 0.0;
    Stereo runs[2];
    for (int moved = 0; moved < 2; ++moved) {
      set(kRate, {{p::kGrain, 0.3f}});
      const Stereo head = run(device, std::vector<float>(steady.begin(), steady.begin() + static_cast<long>(frame_at - 64)));
      if (moved) device.set_param(p::kGrain, 0.9f);
      const Stereo tail = run(device, std::vector<float>(steady.begin() + static_cast<long>(frame_at - 64),
                                                         steady.begin() + static_cast<long>(frame_at + 48000)));
      runs[moved] = concat(head, tail);
    }
    for (size_t i = 0; i < runs[0].left.size(); ++i) {
      const double d = std::max(std::fabs(runs[0].left[i] - runs[1].left[i]), std::fabs(runs[0].right[i] - runs[1].right[i]));
      if (i < frame_at + 512 + 256) same = std::max(same, d);
      else changed = std::max(changed, d);
    }
    EXPECT(same == 0.0, "Grain moved 64 samples before a frame is not laid out in that frame's block");
    EXPECT(changed > 1.0e-3, "and is there from the next");
  }

  // --- As it starts, a held note moves calmly ------------------------------------------------------------
  // A held 220 Hz sine as the device starts: its level over 50 ms, every 10 ms, for 36 s. How far that
  // travels in a second is how restless one note is. At the first default (2.2 Hz, Soft 0.6) it was
  // 23.3 dB a second; a chord's loudness second by second was as steady either way (1.2 LU).
  {
    std::vector<float> note(40 * 48000);
    for (size_t i = 0; i < note.size(); ++i) note[i] = 0.3f * static_cast<float>(std::sin(2.0 * kPi * 220.0 * static_cast<double>(i) / kRate));
    device.init(kRate);
    const Stereo out = run(device, note);
    double travel = 0.0, last = 0.0, low = 99.0, high = -99.0;
    int count = 0;
    for (size_t at = 2 * 48000; at + 2400 <= 38 * 48000; at += 480, ++count) {
      const double level = db(rms(out.left, at, at + 2400) / rms(note, at, at + 2400));
      if (count > 0) travel += std::fabs(level - last);
      last = level;
      low = std::min(low, level);
      high = std::max(high, level);
    }
    std::printf("as it starts, a held 220 Hz note: level from %+.2f to %+.2f dB, %.1f dB of travel a second\n", low, high, travel / 36.0);
    EXPECT(travel / 36.0 < 14.0, "as it starts, one held note's level travels under 14 dB a second");
    EXPECT(high - low > 3.0, "and still moves by 3 dB and more");
  }

  // --- The top of Rate ------------------------------------------------------------------------------
  // A frame lasts 43 ms and a gain is read once a frame, so the fastest flickers are rounded off. One
  // partial on a band's centre, Upward (every band at Rate), Depth 0.8, Soft 1: how far it dips at
  // 1 Hz and at 12 Hz. Rate's description says "a little shallower at the very top"; this is how little.
  {
    const std::vector<double> one = {partials[2]};
    const std::vector<float> tone = comb(one, 12.0f, 0.25f);
    double dip[2];
    int n = 0;
    for (float rate : {1.0f, 12.0f}) {
      set(kRate, {{p::kDepth, 0.8f}, {p::kRate, rate}, {p::kGrain, 0.5f}, {p::kPattern, kUpward},
                  {p::kLean, 0.0f},  {p::kSoft, 1.0f}, {p::kVary, 0.0f},  {p::kApart, 0.0f}});
      const Stereo out = run(device, tone);
      // Two boxes of 120 samples (5 ms): short against a cycle of 12 Hz, long against the partial's own.
      const std::vector<float> env = from(partial(out.left, partials[2], 120, 16), 2 * 3000);
      dip[n++] = 1.0 - lowest(env) / highest(env);
    }
    std::printf("the top of Rate: a partial dips by %.3f of its crest at 1 Hz and %.3f at 12 Hz (0.8 asked): %.0f %% is left\n", dip[0],
                dip[1], 100.0 * dip[1] / dip[0]);
    EXPECT_NEAR(dip[0], 0.8, 0.02, "at 1 Hz a partial dips by Depth");
    EXPECT(dip[1] > 0.8 * dip[0] && dip[1] < 0.97 * dip[0], "at 12 Hz it is a little shallower, by under a fifth");
  }

  // --- Mix part way is less Depth -------------------------------------------------------------------
  // Why Mix is the ninth control and not among the eight an upright plate shows. With L the lift, the
  // gain at Mix μ is 1 − μ + μ·L·(1 − d) + μ·L·d·m: a floor and a swing, as Depth alone gives. Depth
  // 0.8 at Mix 0.5 is Depth 0.481 at Mix 1 but for one level, 0.2 dB (Lean 0; with Lean it is nearly so).
  {
    const float mixed_depth = 0.8f, mix = 0.5f;
    const double lift = 1.0 / std::sqrt((1.0 - mixed_depth) * (1.0 - mixed_depth) + mixed_depth * (1.0 - mixed_depth) + 0.375 * mixed_depth * mixed_depth);
    const double floor_part = 1.0 - mix + mix * lift * (1.0 - mixed_depth), swing = mix * lift * mixed_depth;
    const double same_depth = swing / (floor_part + swing);
    const double same_lift = 1.0 / std::sqrt((1.0 - same_depth) * (1.0 - same_depth) + same_depth * (1.0 - same_depth) + 0.375 * same_depth * same_depth);
    const double scale = floor_part / (same_lift * (1.0 - same_depth));
    Stereo outs[2];
    for (int which = 0; which < 2; ++which) {
      set(kRate, {{p::kDepth, which == 0 ? mixed_depth : static_cast<float>(same_depth)}, {p::kMix, which == 0 ? mix : 1.0f},
                  {p::kRate, 2.0f}, {p::kGrain, 0.5f}, {p::kLean, 0.0f}, {p::kSoft, 1.0f}, {p::kVary, 0.0f}});
      outs[which] = run(device, steady);
    }
    double apart_power = 0.0, power = 0.0;
    for (size_t i = 48000; i < outs[0].left.size(); ++i) {
      const double d = outs[0].left[i] - scale * outs[1].left[i];
      apart_power += d * d;
      power += static_cast<double>(outs[0].left[i]) * outs[0].left[i];
    }
    std::printf("depth 0.8 at mix 0.5 against depth %.3f at mix 1 (%+.2f dB): they differ by %.1f dB of the sound\n", same_depth,
                db(scale), 10.0 * std::log10(apart_power / power));
    EXPECT(10.0 * std::log10(apart_power / power) < -40.0, "Mix part way is the flicker of less Depth");
    EXPECT(db(scale) > -0.5 && db(scale) <= 0.0, "at under half a dB less level");
  }

  // --- Block sizes, with attacks in the sound and Grain moved awake and asleep ------------------------
  // Plucks (which open the attack pass), four seconds of silence (the device sleeps), plucks again;
  // Grain moved in the sound, in the silence, and 100 samples after the sound returns. The attack
  // detector and the moment Grain is read both count samples: every block size gives the same floats,
  // and a mono input comes out as two identical sides (the pass is one for both).
  {
    std::vector<float> x(10 * 48000, 0.0f);
    for (int i = 0; i < 5; ++i) pluck_at(x, 0.1 + 0.37 * i, 220.0 * (1 + i % 3), 0.3, 0.2);
    for (int i = 0; i < 5; ++i) pluck_at(x, 7.0 + 0.29 * i, 330.0 * (1 + i % 2), 0.3, 0.2);
    const size_t cuts[] = {0, 30000 + 77, 5 * 48000 + 1, 7 * 48000 + 4800 + 100, x.size()};
    const float grains[] = {0.7f, 0.2f, 0.95f, 0.4f};
    Stereo reference;
    for (int block : {128, 1, 37, 2048}) {
      device.init(kRate);
      device.set_param(p::kApart, 0.0f);
      Stereo out;
      for (int part = 0; part < 4; ++part) {
        device.set_param(p::kGrain, grains[part]);
        const Stereo piece = run(device, std::vector<float>(x.begin() + static_cast<long>(cuts[part]), x.begin() + static_cast<long>(cuts[part + 1])), block);
        out = part == 0 ? piece : concat(out, piece);
      }
      if (block == 128) {
        reference = out;
        double sides = 0.0;
        for (size_t i = 0; i < out.left.size(); ++i) sides = std::max(sides, static_cast<double>(std::fabs(out.left[i] - out.right[i])));
        EXPECT(sides == 0.0, "with attacks passing, a mono input at Apart 0 is still two identical sides");
        EXPECT(peak(out.left, 7 * 48000) > 0.1, "the sound comes back after the sleep");
        continue;
      }
      double worst = 0.0;
      for (size_t i = 0; i < out.left.size(); ++i)
        worst = std::max({worst, static_cast<double>(std::fabs(out.left[i] - reference.left[i])),
                          static_cast<double>(std::fabs(out.right[i] - reference.right[i]))});
      std::printf("plucks, a sleep and Grain moved: blocks of %d differ from blocks of 128 by %.3g\n", block, worst);
      EXPECT(worst == 0.0, "attacks and a moved Grain come out the same at every block size, across a sleep");
    }
  }

  // --- Cost: the average, and the worst block (one with a frame in it) -----------------------------
  rng_state() = 5;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  const auto blocks = [&](const char* what, bool turning) {
    std::vector<double> micros;
    double total = 0.0;
    for (size_t done = 0; done + 128 <= input.size(); done += 128) {
      for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
      // The dearest thing a hand can do: Grain turned all the while, which lays the bands out again every frame.
      if (turning) device.set_param(p::kGrain, 0.5f + 0.5f * static_cast<float>((done / 128) % 100) / 100.0f);
      const auto start = std::chrono::steady_clock::now();
      device.process(128);
      const double took = std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
      micros.push_back(took);
      total += took;
    }
    std::sort(micros.begin(), micros.end());
    // Every other block holds a frame, of one side or the other: the 95th percentile is one of them.
    const double p95 = micros[micros.size() * 95 / 100];
    std::printf("glimmer %s: median block %.1f us, mean %.1f us (%.2f%% of real time), worst block (95th percentile) %.1f us, "
                "%.2f%% of its 2667 us (native)\n",
                what, micros[micros.size() / 2], total / static_cast<double>(micros.size()),
                100.0 * total / static_cast<double>(micros.size()) / 2666.7, p95, 100.0 * p95 / 2666.7);
  };
  device.init(kRate);
  report_cost("glimmer", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  blocks("as it starts", false);
  set(kRate, {{p::kGrain, 1.0f}, {p::kApart, 1.0f}, {p::kVary, 1.0f}, {p::kSoft, 0.5f}, {p::kDepth, 1.0f}});
  blocks("at its dearest (160 bands, two sides, varied)", false);
  blocks("at its dearest with Grain turning", true);
  return finish("glimmer");
}
