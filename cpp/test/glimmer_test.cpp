// Native harness for Glimmer (cpp/devices/glimmer). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest measures the flicker: that each partial of a comb moves at
// about Rate and by Depth, apart from its neighbours on Scatter and in order
// on the waves, that the level of the whole holds, and that the clock keeps
// its place through silence.

#include "../devices/glimmer/glimmer.h"
#include "support/test_kit.h"

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

  device.init(kRate);
  rng_state() = 5;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("glimmer", 10.0f, kRate, [&] { run(device, input); });
  return finish("glimmer");
}
