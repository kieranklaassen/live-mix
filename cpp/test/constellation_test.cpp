// Native harness for Constellation (cpp/devices/constellation). After the
// conformance pass it asserts what makes it a sky of echoes: a sound comes
// back at each pattern's times, sides and levels; one star is one echo;
// Stars lights places without moving the others; Again plays the whole sky
// again a span later; Fade, Tone, Width and Drift do what they say; and the
// device handles a moved knob, a bad sample, a rest and any block size.

#include "../devices/constellation/constellation.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::Constellation;
namespace p = livemix::constellation;

static Constellation device;
static Constellation fresh;

static const float kRate = 48000.0f;

// Wet only, every star as the pattern made it: nothing wandering, nothing
// fed back, no fade, the low-passes wide open, the sides at their widest.
static void plain(Constellation& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kAgain, 0.0f);
  d.set_param(p::kFade, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kWidth, 1.0f);
  d.set_param(p::kMix, 1.0f);
}

// A tone burst under a Hann window, added at `at`.
static void add_burst(std::vector<float>& x, size_t at, float rate, float hz, float seconds, float gain) {
  const size_t length = static_cast<size_t>(seconds * rate);
  for (size_t i = 0; i < length && at + i < x.size(); ++i) {
    const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * (static_cast<double>(i) + 0.5) / length);
    x[at + i] += static_cast<float>(gain * window * std::sin(2.0 * kPi * hz * static_cast<double>(i) / rate));
  }
}

// `total` seconds with a tone from `at` for `seconds` (10 ms fades).
static void add_tone(std::vector<float>& x, float hz, float at, float seconds, float gain, float rate = kRate) {
  const size_t start = static_cast<size_t>(at * rate);
  const size_t length = static_cast<size_t>(seconds * rate);
  const size_t fade = static_cast<size_t>(0.01f * rate);
  for (size_t i = 0; i < length && start + i < x.size(); ++i) {
    float g = gain;
    if (i < fade) g *= static_cast<float>(i) / fade;
    if (length - i <= fade) g *= static_cast<float>(length - i) / fade;
    x[start + i] += g * static_cast<float>(std::sin(2.0 * kPi * hz * static_cast<double>(i) / rate));
  }
}

static double energy(const std::vector<float>& x, long from = 0, long to = 1L << 40) {
  double sum = 0.0;
  for (long i = std::max(from, 0L); i < to && i < static_cast<long>(x.size()); ++i) {
    sum += static_cast<double>(x[i]) * x[i];
  }
  return sum;
}

// What arrived in [from, to): where its energy is centred, how loud it is
// against a burst of energy `energy_in` played once in the centre (a star at
// unity reads 1), and the right side's share of its power.
struct Arrival {
  double at = -1.0;
  double level = 0.0;
  double right_share = 0.5;
  double energy = 0.0;
};

static Arrival arrival(const Stereo& out, long from, long to, double energy_in) {
  double left = 0.0, right = 0.0, moment = 0.0;
  for (long i = std::max(from, 0L); i < to && i < static_cast<long>(out.size()); ++i) {
    const double l = static_cast<double>(out.left[i]) * out.left[i];
    const double r = static_cast<double>(out.right[i]) * out.right[i];
    left += l;
    right += r;
    moment += static_cast<double>(i) * (l + r);
  }
  Arrival result;
  result.energy = left + right;
  if (result.energy > 0.0) {
    result.at = moment / result.energy;
    result.right_share = right / result.energy;
  }
  result.level = std::sqrt(result.energy / (2.0 * energy_in));
  return result;
}

// The right side's share of a star's power at `pan` (constant power).
static double right_share_of(double pan) {
  const double s = std::sin((pan + 1.0) * kPi / 4.0);
  return s * s;
}

// What a star's low-pass and the loop's delay a narrow burst by, in seconds,
// well under their corner at `corner_hz`: 1 / (Q w0), the group delay of a
// two-pole low-pass at the bottom of its band.
static double lag_seconds(double corner_hz) { return 1.0 / (0.6 * 2.0 * kPi * corner_hz); }

// Run `input` in blocks whose sizes cycle through `sizes`, calling `change`
// once, before sample `change_at` (a block ends there whatever the sizes).
template <typename Change>
static Stereo run_blocks(Constellation& d, const std::vector<float>& input, const std::vector<int>& sizes,
                         size_t change_at, Change change) {
  Stereo out;
  out.left.resize(input.size());
  out.right.resize(input.size());
  size_t done = 0;
  size_t which = 0;
  bool changed = false;
  while (done < input.size()) {
    if (!changed && done == change_at) {
      change();
      changed = true;
    }
    size_t frames = std::min(static_cast<size_t>(sizes[which++ % sizes.size()]), input.size() - done);
    if (!changed && done + frames > change_at) frames = change_at - done;
    for (size_t i = 0; i < frames; ++i) {
      d.in_left()[i] = input[done + i];
      d.in_right()[i] = input[done + i];
    }
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// Seconds after `from` at which the output last was not exact zero.
static double rings_for(const Stereo& out, size_t from, float rate = kRate) {
  size_t last = from;
  for (size_t i = from; i < out.size(); ++i) {
    if (out.left[i] != 0.0f || out.right[i] != 0.0f) last = i;
  }
  return static_cast<double>(last - from) / rate;
}

static const char* kPatternNames[p::kPatterns] = {"Spiral", "Cluster", "Scatter", "Ladder", "Gather"};

int main() {
  Conformance spec;
  spec.name = "constellation";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // Fifteen passes of the default span until Again 0.35 has it under the
  // floor, and then the rest of the longest span before it may sleep.
  spec.tail_seconds = 52.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  char label[200];

  // What a pattern is, for every seed: the last star at the end of the span
  // on its side, every star inside the span and apart from its neighbours,
  // each pattern in its own shape, no two seeds the same sky, and no sky on a
  // pulse (for every count of equal steps in the span, some star stands at
  // least 0.15 of a step off it).
  {
    const double rungs[p::kPlaces] = {1.0,       1.0 / 2,  1.0 / 4,  3.0 / 4,  1.0 / 8,  5.0 / 8,
                                      3.0 / 8,   7.0 / 8,  1.0 / 16, 9.0 / 16, 5.0 / 16, 13.0 / 16};
    double closest = 1.0, least_off_pulse = 1.0, least_scatter_gap = 1.0;
    double ratio_low = 1.0, ratio_high = 0.0, warp_nearest_one = 1.0;
    int shape_faults = 0, range_faults = 0, twins = 0, three_groups = 0, four_groups = 0;
    int pulse_pattern = 0, pulse_seed = 0, pulse_steps = 0;
    for (int pattern = 0; pattern < p::kPatterns; ++pattern) {
      p::Sky skies[17];
      for (int seed = 1; seed <= 16; ++seed) {
        p::Sky& sky = skies[seed];
        p::lay_out(pattern, seed, &sky);
        if (sky.time[0] != 1.0f || std::fabs(std::fabs(sky.pan[0]) - 0.8f) > 1.0e-6f || sky.mag[0] != 1.0f) {
          ++range_faults;
        }
        for (int k = 0; k < p::kPlaces; ++k) {
          if (!(sky.time[k] > 0.0f && sky.time[k] <= 1.0f) || std::fabs(sky.pan[k]) > 1.0f ||
              !(sky.mag[k] >= 0.35f && sky.mag[k] <= 1.0f)) {
            ++range_faults;
          }
          for (int j = 0; j < k; ++j) {
            closest = std::min(closest, static_cast<double>(std::fabs(sky.time[k] - sky.time[j])));
          }
        }
        for (int steps = 2; steps <= 32; ++steps) {
          double furthest = 0.0;
          for (int k = 1; k < p::kPlaces; ++k) {
            const double place = static_cast<double>(sky.time[k]) * steps;
            furthest = std::max(furthest, std::fabs(place - std::round(place)));
          }
          if (furthest < least_off_pulse) {
            least_off_pulse = furthest;
            pulse_pattern = pattern;
            pulse_seed = seed;
            pulse_steps = steps;
          }
        }
        if (pattern == p::kSpiral || pattern == p::kGather) {
          const double ratio = pattern == p::kSpiral ? sky.time[1] : 1.0 - sky.time[1];
          ratio_low = std::min(ratio_low, ratio);
          ratio_high = std::max(ratio_high, ratio);
          for (int k = 1; k < p::kPlaces; ++k) {
            const double gap = pattern == p::kSpiral ? sky.time[k] : 1.0 - sky.time[k];
            if (std::fabs(gap / std::pow(ratio, k) - 1.0) > 1.0e-4) ++shape_faults;
          }
        } else if (pattern == p::kLadder) {
          const double warp = std::log(static_cast<double>(sky.time[1])) / std::log(0.5);
          warp_nearest_one = std::min(warp_nearest_one, std::fabs(warp - 1.0));
          for (int k = 1; k < p::kPlaces; ++k) {
            if (std::fabs(sky.time[k] / std::pow(rungs[k], warp) - 1.0) > 1.0e-4) ++shape_faults;
            if (std::fabs(sky.pan[k] - sky.pan[0] * (2.0 * rungs[k] - 1.0)) > 1.0e-5) ++shape_faults;
          }
        } else if (pattern == p::kScatter) {
          std::vector<double> sorted(sky.time + 1, sky.time + p::kPlaces);
          sorted.push_back(0.0);
          sorted.push_back(1.0);
          std::sort(sorted.begin(), sorted.end());
          for (size_t k = 1; k < sorted.size(); ++k) {
            least_scatter_gap = std::min(least_scatter_gap, sorted[k] - sorted[k - 1]);
          }
        } else {
          // Cluster: three or four heads about evenly apart, and every other
          // star a little before its head, 2.2 to 5 % behind the one before.
          int groups = 0;
          for (int candidate : {3, 4}) {
            bool fits = true;
            for (int g = 1; g < candidate; ++g) {
              if (std::fabs(sky.time[g] - static_cast<double>(g) / candidate) > 0.25 / candidate + 1.0e-6) {
                fits = false;
              }
            }
            for (int k = candidate; k < p::kPlaces && fits; ++k) {
              const double behind = sky.time[k - candidate] - sky.time[k];
              if (behind < 0.022 - 1.0e-6 || behind > 0.05 + 1.0e-6) fits = false;
            }
            if (fits) groups = candidate;
          }
          if (groups == 0) ++shape_faults;
          if (groups == 3) ++three_groups;
          if (groups == 4) ++four_groups;
        }
        for (int other = 1; other < seed; ++other) {
          double apart = 0.0;
          for (int k = 0; k < p::kPlaces; ++k) {
            apart = std::max(apart, static_cast<double>(std::fabs(sky.time[k] - skies[other].time[k])));
            apart = std::max(apart, static_cast<double>(std::fabs(sky.pan[k] - skies[other].pan[k])));
          }
          if (apart < 5.0e-3) {
            ++twins;
            std::printf("twins: %s seeds %d and %d are %.4f apart\n", kPatternNames[pattern], other, seed, apart);
          }
        }
      }
    }
    std::printf("patterns: closest two stars %.4f of the span; least a sky is off a pulse %.3f of a step "
                "(%s, seed %d, %d steps); "
                "Scatter's smallest gap %.4f; ratios %.3f to %.3f; Ladder's bend at least %.3f from even; "
                "Cluster in threes %d times and fours %d\n",
                closest, least_off_pulse, kPatternNames[pulse_pattern], pulse_seed, pulse_steps, least_scatter_gap, ratio_low, ratio_high, warp_nearest_one,
                three_groups, four_groups);
    EXPECT(range_faults == 0, "every sky: the last star at the end of the span, every star inside it");
    EXPECT(shape_faults == 0, "every sky has its pattern's shape");
    EXPECT(twins == 0, "no two seeds of a pattern are the same sky");
    EXPECT(closest >= 0.0015, "no two stars of a sky share a moment");
    EXPECT(least_off_pulse >= 0.15, "no sky lines up on a pulse of equal steps");
    EXPECT(least_scatter_gap >= 0.025, "Scatter never puts two stars close together");
    EXPECT(ratio_low >= 0.58 && ratio_high <= 0.78 && ratio_high - ratio_low > 0.1,
           "Spiral and Gather wind by a ratio of 0.58 to 0.78, by the seed");
    EXPECT(warp_nearest_one >= 0.12, "Ladder's rungs are bent off the even grid");
    EXPECT(three_groups > 0 && four_groups > 0, "Cluster comes in threes and in fours");
  }

  // The skies themselves, as numbers. The plate's display works the same sums
  // in TypeScript (src/react/components/displays/constellation.ts) and its
  // test holds it to this table: a sum over every place of all sixteen seeds
  // of each pattern, and places 1, 5 and 11 of seeds 1 and 11 (time, side,
  // brightness). A change to sky.h that moves a star shows here and there.
  {
    struct Golden {
      int pattern;
      double sum;
      float stars[18];
    };
    const Golden table[p::kPatterns] = {
        {0, 567.049052, {0.749341f, 0.184601f, 0.960000f, 0.236264f, -0.352969f, 0.800000f, 0.041829f, -0.811925f, 0.560000f,
                         0.585409f, -0.184601f, 0.960000f, 0.068754f, 0.352969f, 0.800000f, 0.002767f, 0.811925f, 0.560000f}},
        {1, 735.433734, {0.294104f, -0.806443f, 0.900000f, 0.265455f, -0.607987f, 0.700000f, 0.722944f, 0.787971f, 0.550000f,
                         0.265477f, -0.383804f, 0.900000f, 0.235544f, -0.387271f, 0.700000f, 0.703009f, 0.179602f, 0.550000f}},
        {2, 699.133699, {0.888462f, 0.084019f, 0.696795f, 0.404371f, 0.459075f, 0.663106f, 0.151972f, -0.015692f, 0.583238f,
                         0.219364f, 0.082833f, 0.842265f, 0.659768f, 0.052814f, 0.683452f, 0.389212f, 0.171392f, 0.793168f}},
        {3, 524.990436, {0.550059f, 0.000000f, 0.850000f, 0.666775f, -0.200000f, 0.550000f, 0.836059f, -0.500000f, 0.400000f,
                         0.578848f, 0.000000f, 0.850000f, 0.690242f, -0.200000f, 0.550000f, 0.848934f, -0.500000f, 0.400000f}},
        {4, 913.721244, {0.267721f, -0.078997f, 0.600000f, 0.789436f, -0.705871f, 0.760000f, 0.967533f, -0.800387f, 1.000000f,
                         0.231653f, -0.043484f, 0.600000f, 0.732214f, -0.680291f, 0.760000f, 0.944902f, -0.800657f, 1.000000f}},
    };
    double worst = 0.0;
    for (const Golden& golden : table) {
      double sum = 0.0;
      for (int seed = 1; seed <= 16; ++seed) {
        p::Sky sky;
        p::lay_out(golden.pattern, seed, &sky);
        for (int k = 0; k < p::kPlaces; ++k) {
          sum += (k + 1) * (sky.time[k] + 2.0 * sky.pan[k] + 3.0 * sky.mag[k]) / seed;
        }
      }
      worst = std::max(worst, std::fabs(sum - golden.sum));
      int n = 0;
      for (int seed : {1, 11}) {
        p::Sky sky;
        p::lay_out(golden.pattern, seed, &sky);
        for (int k : {1, 5, 11}) {
          worst = std::max(worst, static_cast<double>(std::fabs(sky.time[k] - golden.stars[n++])));
          worst = std::max(worst, static_cast<double>(std::fabs(sky.pan[k] - golden.stars[n++])));
          worst = std::max(worst, static_cast<double>(std::fabs(sky.mag[k] - golden.stars[n++])));
        }
      }
    }
    // The wander, the same way: three stars at three moments of the clock.
    const double wander[9] = {-0.197614, -0.333074, -0.055763, -0.191359, 0.034105,
                              -0.880695, 0.190407,  -0.530805, -0.356252};
    int n = 0;
    double worst_wander = 0.0;
    for (int star : {0, 5, 11}) {
      for (double clock : {0.0, 0.1234, 0.9}) {
        worst_wander = std::max(worst_wander, std::fabs(p::drift_at(star, clock) - wander[n++]));
      }
    }
    EXPECT(worst < 2.0e-6, "the skies are the ones written down beside the display's");
    EXPECT(worst_wander < 2.0e-6, "the wander is the one written down beside the display's");
  }

  // A sound comes back at the pattern's times, sides and levels: a 3 ms burst
  // at 2 kHz through all twelve stars of every pattern, for two seeds. Each
  // star's echo is centred on its share of the span (plus what its wide-open
  // low-pass delays it by), as loud as the pattern made it with the powers of
  // the twelve adding to one, on the side the pattern gave it, and nothing
  // sounds between the stars.
  {
    const float span_seconds = 8.0f;
    const float burst_seconds = 0.003f;
    std::vector<float> input = silence(8.3f, kRate);
    add_burst(input, 0, kRate, 2000.0f, burst_seconds, 0.5f);
    const long length = static_cast<long>(burst_seconds * kRate);
    const double energy_in = energy(input);
    Stereo straight;
    straight.left = input;
    straight.right = input;
    const double centre_in = arrival(straight, 0, length, energy_in).at;
    const double lag = lag_seconds(16000.0) * kRate;
    for (int pattern = 0; pattern < p::kPatterns; ++pattern) {
      for (int seed : {1, 11}) {
        plain(device);
        device.set_param(p::kSpan, span_seconds * 1000.0f);
        device.set_param(p::kStars, 12.0f);
        device.set_param(p::kPattern, static_cast<float>(pattern));
        device.set_param(p::kShuffle, static_cast<float>(seed));
        Stereo out = run(device, input);
        p::Sky sky;
        p::lay_out(pattern, seed, &sky);
        double power = 0.0;
        for (int k = 0; k < p::kPlaces; ++k) power += static_cast<double>(sky.mag[k]) * sky.mag[k];
        double worst_time = 0.0, worst_level = 0.0, worst_side = 0.0, inside = 0.0;
        for (int k = 0; k < p::kPlaces; ++k) {
          const double delay = static_cast<double>(sky.time[k]) * span_seconds * kRate;
          const long from = static_cast<long>(delay) - 40;
          const Arrival a = arrival(out, from, from + length + 120, energy_in);
          worst_time = std::max(worst_time, std::fabs(a.at - centre_in - delay - lag));
          worst_level = std::max(worst_level, std::fabs(a.level / (sky.mag[k] / std::sqrt(power)) - 1.0));
          worst_side = std::max(worst_side, std::fabs(a.right_share - right_share_of(sky.pan[k])));
          inside += a.energy;
        }
        const double outside = 1.0 - inside / (energy(out.left) + energy(out.right));
        std::printf("%s, seed %d: worst star %.2f samples from its time, %.2f %% from its level, "
                    "%.4f from its side; %.1e of the energy between the stars\n",
                    kPatternNames[pattern], seed, worst_time, 100.0 * worst_level, worst_side, outside);
        std::snprintf(label, sizeof label, "%s, seed %d: every star sounds at its time", kPatternNames[pattern], seed);
        EXPECT(worst_time < 0.75, label);
        std::snprintf(label, sizeof label, "%s, seed %d: every star sounds at its level", kPatternNames[pattern], seed);
        EXPECT(worst_level < 0.03, label);
        std::snprintf(label, sizeof label, "%s, seed %d: every star sounds on its side", kPatternNames[pattern], seed);
        EXPECT(worst_side < 0.01, label);
        std::snprintf(label, sizeof label, "%s, seed %d: nothing sounds between the stars", kPatternNames[pattern], seed);
        EXPECT(outside < 1.0e-6, label);
      }
    }

    // The device plays the sky it says it does.
    plain(device);
    device.set_param(p::kPattern, 2.0f);
    device.set_param(p::kShuffle, 5.0f);
    run(device, impulse(0.01f, kRate, 0.5f));
    p::Sky want;
    p::lay_out(p::kScatter, 5, &want);
    bool same = true;
    for (int k = 0; k < p::kPlaces; ++k) same = same && device.sky().time[k] == want.time[k];
    EXPECT(same, "the lit sky is the pattern's and the seed's");
  }

  // Stars 1 is one echo, at Span, at the level it went in.
  {
    std::vector<float> input = silence(1.5f, kRate);
    add_burst(input, 0, kRate, 2000.0f, 0.003f, 0.5f);
    const double energy_in = energy(input);
    for (int pattern = 0; pattern < p::kPatterns; ++pattern) {
      plain(device);
      device.set_param(p::kSpan, 500.0f);
      device.set_param(p::kStars, 1.0f);
      device.set_param(p::kPattern, static_cast<float>(pattern));
      Stereo out = run(device, input);
      const Arrival a = arrival(out, 24000 - 40, 24000 + 264, energy_in);
      const double outside = 1.0 - a.energy / (energy(out.left) + energy(out.right));
      if (pattern == 0) {
        std::printf("one star: an echo centred %.2f samples after Span, at %.3f of the level it went in; "
                    "%.1e of the energy elsewhere\n",
                    a.at - 71.5 - 24000.0, a.level, outside);
      }
      std::snprintf(label, sizeof label, "%s: Stars 1 is one echo at Span, at unity", kPatternNames[pattern]);
      EXPECT(std::fabs(a.at - 71.5 - 24000.0) < 1.5 && std::fabs(a.level - 1.0) < 0.02 && outside < 1.0e-6, label);
    }
  }

  // Stars lights places and moves none: with three and with seven stars the
  // lit ones sound where they do among twelve, the unlit ones are silent, and
  // the lit ones share the power.
  {
    const float span_seconds = 4.0f;
    std::vector<float> input = silence(4.3f, kRate);
    add_burst(input, 0, kRate, 2000.0f, 0.003f, 0.5f);
    const double energy_in = energy(input);
    p::Sky sky;
    p::lay_out(p::kScatter, 1, &sky);
    for (int stars : {3, 7}) {
      plain(device);
      device.set_param(p::kSpan, span_seconds * 1000.0f);
      device.set_param(p::kPattern, static_cast<float>(p::kScatter));
      device.set_param(p::kStars, static_cast<float>(stars));
      Stereo out = run(device, input);
      double power = 0.0;
      for (int k = 0; k < stars; ++k) power += static_cast<double>(sky.mag[k]) * sky.mag[k];
      double worst_time = 0.0, worst_level = 0.0, unlit = 0.0;
      for (int k = 0; k < p::kPlaces; ++k) {
        const double delay = static_cast<double>(sky.time[k]) * span_seconds * kRate;
        const long from = static_cast<long>(delay) - 40;
        const Arrival a = arrival(out, from, from + 264, energy_in);
        if (k < stars) {
          worst_time = std::max(worst_time, std::fabs(a.at - 71.5 - delay - lag_seconds(16000.0) * kRate));
          worst_level = std::max(worst_level, std::fabs(a.level / (sky.mag[k] / std::sqrt(power)) - 1.0));
        } else {
          unlit = std::max(unlit, a.level);
        }
      }
      std::printf("%d stars: worst lit star %.2f samples from its time and %.2f %% from its level; "
                  "loudest unlit place %.1e\n",
                  stars, worst_time, 100.0 * worst_level, unlit);
      std::snprintf(label, sizeof label, "%d stars sound where they do among twelve, sharing the power", stars);
      EXPECT(worst_time < 0.75 && worst_level < 0.03, label);
      std::snprintf(label, sizeof label, "%d stars: the other places are silent", stars);
      EXPECT(unlit < 1.0e-6, label);
    }
  }

  // The stars share the power: a held noise comes back as loud through one
  // star, four or twelve. The noise is kept under 1 kHz or so (two one-pole
  // low-passes at 600 Hz), so the stars' own low-passes take nothing of it.
  {
    rng_state() = 0x57A25u;
    std::vector<float> input = noise(12.0f, kRate, 1.0f);
    {
      const float k = 1.0f - std::exp(-2.0f * static_cast<float>(kPi) * 600.0f / kRate);
      float one = 0.0f, two = 0.0f;
      for (float& x : input) {
        one += k * (x - one);
        two += k * (one - two);
        x = 2.0f * two;
      }
    }
    const size_t from = static_cast<size_t>(4.0f * kRate);
    const double dry = rms(input, from);
    double gains[3];
    int n = 0;
    for (int stars : {1, 4, 12}) {
      plain(device);
      device.set_param(p::kSpan, 1000.0f);
      device.set_param(p::kPattern, static_cast<float>(p::kScatter));
      device.set_param(p::kStars, static_cast<float>(stars));
      Stereo out = run(device, input);
      const double l = rms(out.left, from), r = rms(out.right, from);
      gains[n++] = db(std::sqrt(0.5 * (l * l + r * r)) / dry);
    }
    std::printf("level: a held noise comes back at %+.2f dB with one star, %+.2f dB with four, %+.2f dB with twelve\n",
                gains[0], gains[1], gains[2]);
    EXPECT(std::fabs(gains[0]) < 0.5 && std::fabs(gains[1]) < 0.75 && std::fabs(gains[2]) < 0.75,
           "the wet level of a held sound does not depend on Stars");
  }

  // Again plays the whole sky again a span later, and again after that, each
  // pass down by Again and by what the loop's filters take at 2 kHz (0.7 %).
  {
    const float span_seconds = 2.0f;
    std::vector<float> input = silence(6.3f, kRate);
    add_burst(input, 0, kRate, 2000.0f, 0.003f, 0.5f);
    const double energy_in = energy(input);
    p::Sky sky;
    p::lay_out(p::kCluster, 1, &sky);
    plain(device);
    device.set_param(p::kSpan, span_seconds * 1000.0f);
    device.set_param(p::kPattern, static_cast<float>(p::kCluster));
    device.set_param(p::kStars, 5.0f);
    device.set_param(p::kAgain, 0.5f);
    Stereo out = run(device, input);
    double low[2] = {10.0, 10.0}, high[2] = {0.0, 0.0}, worst_time = 0.0;
    for (int k = 0; k < 5; ++k) {
      const double delay = static_cast<double>(sky.time[k]) * span_seconds * kRate;
      const long from = static_cast<long>(delay) - 40;
      const Arrival first = arrival(out, from, from + 264, energy_in);
      for (int pass = 1; pass <= 2; ++pass) {
        const long later = from + pass * static_cast<long>(span_seconds * kRate);
        const Arrival again = arrival(out, later, later + 264, energy_in);
        const double ratio = again.level / first.level;
        low[pass - 1] = std::min(low[pass - 1], ratio);
        high[pass - 1] = std::max(high[pass - 1], ratio);
        worst_time = std::max(worst_time, std::fabs(again.at - first.at - pass * span_seconds * kRate -
                                                    pass * lag_seconds(16000.0) * kRate));
      }
    }
    std::printf("again: the second sky is %.4f to %.4f of the first, the third %.4f to %.4f; "
                "worst star %.2f samples from a whole span later\n",
                low[0], high[0], low[1], high[1], worst_time);
    EXPECT(low[0] > 0.485 && high[0] < 0.505, "Again 0.5: the sky sounds again a span later at half the level");
    EXPECT(low[1] > 0.235 && high[1] < 0.255, "and a third time at a quarter");
    EXPECT(worst_time < 1.0, "each pass is a whole span after the last");

    // With no Again nothing follows the first sky.
    plain(device);
    device.set_param(p::kSpan, span_seconds * 1000.0f);
    device.set_param(p::kStars, 5.0f);
    Stereo once = run(device, input);
    const size_t after = static_cast<size_t>((span_seconds + 0.05f) * kRate);
    EXPECT(peak(once.left, after) < 1.0e-6 && peak(once.right, after) < 1.0e-6, "Again 0: one sky and no more");
  }

  // Fade makes the later stars quieter and darker: 2^(-3 Fade time) on the
  // level and on the low-pass corner. Bursts at 300 Hz (under every corner)
  // and at 5 kHz through four rungs of a ladder at full Fade.
  {
    const float span_seconds = 4.0f;
    p::Sky sky;
    p::lay_out(p::kLadder, 1, &sky);
    double level[2][4];
    for (int high = 0; high < 2; ++high) {
      std::vector<float> input = silence(4.3f, kRate);
      add_burst(input, 0, kRate, high ? 5000.0f : 300.0f, high ? 0.003f : 0.02f, 0.5f);
      const long length = static_cast<long>((high ? 0.003f : 0.02f) * kRate);
      const double energy_in = energy(input);
      plain(device);
      device.set_param(p::kSpan, span_seconds * 1000.0f);
      device.set_param(p::kPattern, static_cast<float>(p::kLadder));
      device.set_param(p::kStars, 4.0f);
      device.set_param(p::kFade, 1.0f);
      Stereo out = run(device, input);
      for (int k = 0; k < 4; ++k) {
        const long from = static_cast<long>(static_cast<double>(sky.time[k]) * span_seconds * kRate) - 40;
        level[high][k] = arrival(out, from, from + length + 400, energy_in).level;
      }
    }
    double power = 0.0, want[4];
    for (int k = 0; k < 4; ++k) {
      want[k] = sky.mag[k] * std::pow(2.0, -3.0 * sky.time[k]);
      power += want[k] * want[k];
    }
    double worst = 0.0;
    for (int k = 0; k < 4; ++k) {
      worst = std::max(worst, std::fabs(level[0][k] / (want[k] / std::sqrt(power)) - 1.0));
    }
    // Star 2 is the earliest of the four (time 0.14 or so), star 0 the last.
    int earliest = 0;
    for (int k = 1; k < 4; ++k) {
      if (sky.time[k] < sky.time[earliest]) earliest = k;
    }
    const double dark_last = level[1][0] / level[0][0];
    const double dark_first = level[1][earliest] / level[0][earliest];
    std::printf("fade: at 1 the levels are within %.2f %% of 2^(-3 time); the last star is %.1f dB under the "
                "earliest; of 5 kHz the last star keeps %.3f and the earliest %.3f\n",
                100.0 * worst, db(level[0][0] / level[0][earliest]), dark_last, dark_first);
    EXPECT(worst < 0.04, "Fade 1: each star is quieter by 2^(-3 time)");
    EXPECT(level[0][0] < 0.4 * level[0][earliest], "Fade 1: the last star is much quieter than the earliest");
    EXPECT(dark_last < 0.25 && dark_first > 0.6, "Fade 1: the last star is much darker than the earliest");
  }

  // Tone darkens every star.
  {
    rng_state() = 0x70E5u;
    std::vector<float> input = noise(6.0f, kRate, 0.3f);
    double bright = 0.0, dark = 0.0;
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kSpan, 500.0f);
      device.set_param(p::kTone, pass == 0 ? 16000.0f : 800.0f);
      Stereo out = run(device, input);
      (pass == 0 ? bright : dark) = energy_above(out.left, 3000.0, kRate, 2 * 48000);
    }
    std::printf("tone: share of the energy above 3 kHz %.3f at 16 kHz, %.4f at 800 Hz\n", bright, dark);
    EXPECT(dark < bright * 0.1, "Tone darkens the stars");
  }

  // Width: at none a mono sound stays mono; half way a star sits half as far
  // out; at full the two sides differ.
  {
    rng_state() = 0x51DE5u;
    std::vector<float> input = noise(4.0f, kRate, 0.3f);
    plain(device);
    device.set_param(p::kSpan, 500.0f);
    device.set_param(p::kStars, 12.0f);
    device.set_param(p::kWidth, 0.0f);
    Stereo centred = run(device, input);
    double apart = 0.0;
    for (size_t i = 0; i < centred.size(); ++i) {
      apart = std::max(apart, std::fabs(static_cast<double>(centred.left[i]) - centred.right[i]));
    }
    plain(device);
    device.set_param(p::kSpan, 500.0f);
    device.set_param(p::kStars, 12.0f);
    Stereo wide = run(device, input);
    const double corr = correlation(wide.left, wide.right, 48000);

    std::vector<float> click = silence(1.0f, kRate);
    add_burst(click, 0, kRate, 2000.0f, 0.003f, 0.5f);
    plain(device);
    device.set_param(p::kSpan, 500.0f);
    device.set_param(p::kStars, 1.0f);
    device.set_param(p::kWidth, 0.5f);
    Stereo half = run(device, click);
    const Arrival a = arrival(half, 24000 - 40, 24000 + 264, energy(click));
    const double want = right_share_of(0.5 * device.sky().pan[0]);
    std::printf("width: at 0 the sides differ by %.2g; at 1 their correlation is %.2f; at 0.5 the last star "
                "has %.4f of its power on the right (its place says %.4f)\n",
                apart, corr, a.right_share, want);
    EXPECT(apart < 1.0e-6, "Width 0 keeps a mono sound mono");
    EXPECT(corr < 0.7, "Width 1 spreads the stars over the two sides");
    EXPECT(std::fabs(a.right_share - want) < 0.005, "Width 0.5 puts a star half as far out");
  }

  // Drift: each star's time wanders on its own, by exactly what sky.h says of
  // a clock that counts samples from init. Three bursts nine seconds apart
  // through twelve stars over eight seconds, with a tone at -80 dB under
  // them.
  {
    const float span_seconds = 8.0f;
    std::vector<float> input = silence(27.0f, kRate);
    add_tone(input, 97.0f, 0.0f, 27.0f, 1.0e-4f);
    for (int b = 0; b < 3; ++b) add_burst(input, static_cast<size_t>(b * 9 * kRate), kRate, 2000.0f, 0.003f, 0.5f);
    std::vector<float> one = silence(0.01f, kRate);
    add_burst(one, 0, kRate, 2000.0f, 0.003f, 0.5f);
    const double energy_in = energy(one);
    plain(device);
    device.set_param(p::kSpan, span_seconds * 1000.0f);
    device.set_param(p::kPattern, static_cast<float>(p::kScatter));
    device.set_param(p::kStars, 12.0f);
    device.set_param(p::kDrift, 1.0f);
    Stereo out = run(device, input);
    p::Sky sky;
    p::lay_out(p::kScatter, 1, &sky);
    const double reach = p::kDriftSeconds * kRate;
    const double period = static_cast<double>(p::kDriftPeriodSeconds) * kRate;
    double worst = 0.0, widest = 0.0, least_alike = 1.0;
    double wander[3][p::kPlaces];
    for (int b = 0; b < 3; ++b) {
      for (int k = 0; k < p::kPlaces; ++k) {
        const double delay = static_cast<double>(sky.time[k]) * span_seconds * kRate;
        const long from = static_cast<long>(b * 9 * kRate + delay - reach) - 60;
        const Arrival a = arrival(out, from, from + static_cast<long>(2.0 * reach) + 300, energy_in);
        const double measured = a.at - 71.5 - lag_seconds(16000.0) * kRate - b * 9 * kRate - delay;
        const double most = std::min(reach, p::kDriftShare * delay);
        const double expected = most * p::drift_at(k, a.at / period);
        wander[b][k] = measured / most;
        worst = std::max(worst, std::fabs(measured - expected));
        widest = std::max(widest, std::fabs(measured));
      }
    }
    // Two stars do not wander alike: over the three bursts, how far apart
    // their wanders are at their closest pair.
    for (int k = 0; k < p::kPlaces; ++k) {
      for (int j = 0; j < k; ++j) {
        double apart = 0.0;
        for (int b = 0; b < 3; ++b) apart = std::max(apart, std::fabs(wander[b][k] - wander[b][j]));
        least_alike = std::min(least_alike, apart);
      }
    }
    std::printf("drift: at 1 a star is up to %.1f samples from its place (%.2f ms), within %.2f samples of "
                "what the clock says; the two most alike stars are %.2f of the reach apart\n",
                widest, 1000.0 * widest / kRate, worst, least_alike);
    EXPECT(worst < 1.0, "Drift 1: every star is where the wander of the clock puts it");
    EXPECT(widest > 0.4 * reach && widest <= reach + 1.0, "Drift 1 moves a star by up to 6 ms");
    EXPECT(least_alike > 0.05, "no two stars wander alike");

    // Nothing the sound does sets the clock back: after a silence long enough
    // for the device to rest and sleep, a second burst finds every star where
    // a clock that counted through the sleep puts it, which is not where a
    // clock started again by the burst would.
    {
      const float gap_seconds = 14.0f;
      const float short_span = 2.0f;
      std::vector<float> twice = silence(gap_seconds + short_span + 0.3f, kRate);
      add_burst(twice, 0, kRate, 2000.0f, 0.003f, 0.5f);
      const size_t second = static_cast<size_t>(gap_seconds * kRate);
      add_burst(twice, second, kRate, 2000.0f, 0.003f, 0.5f);
      plain(device);
      device.set_param(p::kSpan, short_span * 1000.0f);
      device.set_param(p::kPattern, static_cast<float>(p::kScatter));
      device.set_param(p::kStars, 12.0f);
      device.set_param(p::kDrift, 1.0f);
      Stereo after = run(device, twice);
      double worst_free = 0.0, worst_reset = 0.0;
      for (int k = 0; k < p::kPlaces; ++k) {
        const double delay = static_cast<double>(sky.time[k]) * short_span * kRate;
        const long from = static_cast<long>(second + delay - reach) - 60;
        const Arrival a = arrival(after, from, from + static_cast<long>(2.0 * reach) + 300, energy_in);
        const double measured = a.at - 71.5 - lag_seconds(16000.0) * kRate - second - delay;
        const double most = std::min(reach, p::kDriftShare * delay);
        worst_free = std::max(worst_free, std::fabs(measured - most * p::drift_at(k, a.at / period)));
        worst_reset = std::max(worst_reset, std::fabs(measured - most * p::drift_at(k, (a.at - second) / period)));
      }
      std::printf("drift after a rest: the stars are within %.2f samples of a clock that ran through the sleep, "
                  "and up to %.0f samples from one started again by the sound\n",
                  worst_free, worst_reset);
      EXPECT(device.starts() == 3, "the silence between the two bursts was a rest");
      EXPECT(worst_free < 1.0, "the wander's clock runs through a rest and a sleep");
      EXPECT(worst_reset > 50.0, "and is not started again by the sound");
    }

    // A star close to the note wanders by no more than half its own time.
    plain(device);
    device.set_param(p::kSpan, 100.0f);
    device.set_param(p::kPattern, static_cast<float>(p::kSpiral));
    device.set_param(p::kStars, 12.0f);
    device.set_param(p::kDrift, 1.0f);
    rng_state() = 0xD21F7u;
    Stereo close = run(device, noise(8.0f, kRate, 0.3f));
    EXPECT(finite(close.left) && peak(close.left) < 3.0, "Drift on a span of 100 ms stays in the line");
  }

  // Drift detunes: a steady tone through one star comes back moved off its
  // frequency by no more than the wander's steepest slope allows (0.73 % for
  // the last star), and by nothing with Drift at 0.
  {
    std::vector<float> input = sine(1000.0f, 24.0f, kRate, 0.25f);
    double steady = 0.0, moved = 0.0, furthest = 0.0;
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kSpan, 500.0f);
      device.set_param(p::kStars, 1.0f);
      device.set_param(p::kDrift, static_cast<float>(pass));
      Stereo out = run(device, input);
      // The phase of the tone in each tenth of a second is the star's delay.
      double before = 0.0, swing = 0.0;
      for (int w = 10; w < 240; ++w) {
        const double phase = tone_phase(out.right, 1000.0, kRate, w * 4800, (w + 1) * 4800);
        if (w > 10) {
          double step = phase - before;
          while (step > kPi) step -= 2.0 * kPi;
          while (step < -kPi) step += 2.0 * kPi;
          // Radians in a tenth of a second, as a share of the tone's frequency.
          swing = std::max(swing, std::fabs(step) / (2.0 * kPi * 1000.0 * 0.1));
        }
        before = phase;
      }
      (pass == 0 ? steady : moved) = swing;
      if (pass == 1) furthest = swing;
    }
    std::printf("drift: a 1 kHz tone through the last star is off by at most %.4f %% at Drift 0 and %.3f %% at 1\n",
                100.0 * steady, 100.0 * furthest);
    EXPECT(steady < 1.0e-5, "Drift 0: the echo of a tone is that tone");
    EXPECT(moved > 0.002 && moved < 0.0075, "Drift 1 bends the last star by up to 0.73 %");
  }

  // A Span reached by turning the knob is the Span set before the first
  // block: the glide lands exactly, at 48 and at 96 kHz.
  for (float rate : {48000.0f, 96000.0f}) {
    std::vector<float> input = silence(12.0f, rate);
    add_tone(input, 97.0f, 0.0f, 12.0f, 1.0e-4f, rate);  // keeps the device from resting
    const size_t hit = static_cast<size_t>(5.0f * rate);
    add_burst(input, hit, rate, 2000.0f, 0.003f, 0.5f);
    std::vector<float> one = silence(0.01f, rate);
    add_burst(one, 0, rate, 2000.0f, 0.003f, 0.5f);
    const size_t head = static_cast<size_t>(0.5f * rate);
    const std::vector<float> first(input.begin(), input.begin() + head);
    const std::vector<float> rest(input.begin() + head, input.end());
    Arrival landed[2];
    for (int glided = 0; glided < 2; ++glided) {
      plain(device, rate);
      device.set_param(p::kStars, 1.0f);
      device.set_param(p::kSpan, glided ? 700.0f : 6000.0f);
      Stereo out = run(device, first);
      device.set_param(p::kSpan, 6000.0f);
      out = concat(out, run(device, rest));
      const long from = static_cast<long>(hit + 6.0f * rate) - 60;
      landed[glided] = arrival(out, from, from + static_cast<long>(0.003f * rate) + 200, energy(one));
    }
    std::printf("span at %.0f kHz: the echo is centred %.3f samples after the note set at load, %.3f after a glide\n",
                rate / 1000.0, landed[0].at - hit, landed[1].at - hit);
    EXPECT(std::fabs(landed[0].at - hit - 6.0 * rate - (0.0015 + lag_seconds(16000.0)) * rate) < 1.5,
           "Span set at load is the time of the last star");
    EXPECT(std::fabs(landed[1].at - landed[0].at) < 0.01 && std::fabs(landed[1].level / landed[0].level - 1.0) < 1e-3,
           "a Span reached by gliding lands on the same time");
  }

  // Other sample rates: the stars keep their times, in seconds, and levels.
  for (float rate : {44100.0f, 96000.0f}) {
    const float span_seconds = 2.0f;
    std::vector<float> input = silence(2.2f, rate);
    add_burst(input, 0, rate, 2000.0f, 0.003f, 0.5f);
    const long length = static_cast<long>(0.003f * rate);
    const double energy_in = energy(input);
    Stereo straight;
    straight.left = input;
    straight.right = input;
    const double centre_in = arrival(straight, 0, length, energy_in).at;
    plain(device, rate);
    device.set_param(p::kSpan, span_seconds * 1000.0f);
    device.set_param(p::kPattern, static_cast<float>(p::kLadder));
    device.set_param(p::kStars, 6.0f);
    Stereo out = run(device, input);
    p::Sky sky;
    p::lay_out(p::kLadder, 1, &sky);
    double power = 0.0;
    for (int k = 0; k < 6; ++k) power += static_cast<double>(sky.mag[k]) * sky.mag[k];
    double worst_time = 0.0, worst_level = 0.0;
    for (int k = 0; k < 6; ++k) {
      const double delay = static_cast<double>(sky.time[k]) * span_seconds * rate;
      const long from = static_cast<long>(delay) - 60;
      const Arrival a = arrival(out, from, from + length + 200, energy_in);
      worst_time = std::max(worst_time, std::fabs(a.at - centre_in - delay - lag_seconds(16000.0) * rate));
      worst_level = std::max(worst_level, std::fabs(a.level / (sky.mag[k] / std::sqrt(power)) - 1.0));
    }
    std::printf("%.1f kHz: worst star %.2f samples from its time, %.2f %% from its level\n", rate / 1000.0,
                worst_time, 100.0 * worst_level);
    std::snprintf(label, sizeof label, "the stars keep their times and levels at %.0f Hz", rate);
    EXPECT(worst_time < 1.0 && worst_level < 0.04, label);
  }

  // Mix 0 is the input, bit for bit, with everything else at work.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kStars, 12.0f);
    device.set_param(p::kDrift, 1.0f);
    device.set_param(p::kAgain, 1.0f);
    rng_state() = 0xD1CEu;
    std::vector<float> left = noise(3.0f, kRate, 0.5f);
    std::vector<float> right = noise(3.0f, kRate, 0.5f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 is the input, bit for bit");
  }

  // Level and stereo at the defaults, on a held chord from a mono source.
  {
    std::vector<float> input = silence(24.0f, kRate);
    for (float hz : {196.0f, 246.94f, 293.66f, 392.0f}) add_tone(input, hz, 0.0f, 24.0f, 0.12f);
    device.init(kRate);
    Stereo out = run(device, input);
    const size_t from = static_cast<size_t>(8.0f * kRate);
    const double gain = db(0.5 * (rms(out.left, from) + rms(out.right, from)) / rms(input, from));
    const double corr = correlation(out.left, out.right, from);
    std::vector<float> mid(out.size());
    for (size_t i = 0; i < out.size(); ++i) mid[i] = 0.5f * (out.left[i] + out.right[i]);
    const double mono = db(rms(mid, from) / (0.5 * (rms(out.left, from) + rms(out.right, from))));
    std::printf("defaults: %+.2f dB re dry on a held chord, peak %.2f; L/R correlation %.2f, mono sum %+.2f dB\n",
                gain, std::max(peak(out.left), peak(out.right)), corr, mono);
    EXPECT(gain > -3.0 && gain < 3.0, "the default patch is within 3 dB of the dry level");
    EXPECT(corr > 0.3, "the default patch keeps a mono source mostly correlated");
    EXPECT(mono > -2.0, "the default patch folds to mono without a hole");
  }

  // Again at the top: bounded by the line's limiter under full-scale noise,
  // and afterwards the sky hangs on, dying slowly by what the loop's filters
  // take each pass.
  {
    device.init(kRate);
    device.set_param(p::kAgain, 1.0f);
    device.set_param(p::kStars, 12.0f);
    device.set_param(p::kSpan, 300.0f);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0xABCDu;
    Stereo loud = run(device, noise(20.0f, kRate, 1.0f));
    Stereo tail = render(device, 31.0f, kRate);
    const double start = rms(tail.left, 0, 48000);
    const double later = rms(tail.left, 30 * 48000, 31 * 48000);
    std::printf("again 1: peak %.2f under full-scale noise; thirty seconds (a hundred passes) after it stops "
                "the sky is at %.1f dB of where it was\n",
                std::max(peak(loud.left), peak(loud.right)), db(later / start));
    EXPECT(finite(loud.left) && finite(loud.right) && peak(loud.left) < 2.01 && peak(loud.right) < 2.01,
           "Again 1 with full-scale input stays bounded");
    EXPECT(later > 0.02 * start, "Again 1 hangs on");
    EXPECT(later < 0.9 * start, "Again 1 still dies away");
  }

  // It comes to rest: the default patch rings for its fifteen passes, is then
  // exact zero and asleep, and wakes on new input.
  {
    device.init(kRate);
    std::vector<float> input = silence(60.0f, kRate);
    add_tone(input, 330.0f, 0.0f, 1.0f, 0.4f);
    Stereo out = run(device, input);
    const double tail = rings_for(out, 48000);
    std::printf("rest: the default patch rings for %.1f s after the input stops, and sleeps\n", tail);
    EXPECT(tail > 10.0 && tail < 52.0, "the default patch rings on and then is exact zero");
    EXPECT(device.asleep(), "asleep once it has come to rest");
    Stereo woken = run(device, impulse(3.0f, kRate, 0.5f));
    EXPECT(peak(woken.left, 4800) > 0.01, "wakes on new input");
  }

  // The same output at any block size, across a rest. A note, a silence, a
  // note: the silence is stepped across the moment the device comes to rest
  // (8.5 s after the first note ends) in 20 ms steps, every knob is thrown
  // 5 ms before the second note, and the first block is an odd one so the
  // sleep begins off the beat of the control clock. Against 128-frame blocks.
  {
    const std::vector<std::vector<int>> blockings = {{128}, {1}, {2048}, {13, 1, 7, 64, 128, 33, 512, 2048, 5}};
    double worst = 0.0;
    int restarted = 0, carried = 0;
    for (int step = 0; step <= 11; ++step) {
      const float gap = step == 11 ? 12.0f : 8.40f + 0.02f * step;
      std::vector<float> input = silence(0.3f + gap + 1.5f, kRate);
      add_tone(input, 220.0f, 0.0f, 0.3f, 0.3f);
      add_tone(input, 277.0f, 0.3f + gap, 0.6f, 0.3f);
      const size_t change_at = static_cast<size_t>((0.3f + gap - 0.005f) * kRate);
      Stereo reference;
      for (size_t b = 0; b < blockings.size(); ++b) {
        device.init(kRate);
        device.set_param(p::kAgain, 0.0f);
        device.set_param(p::kDrift, 1.0f);
        Stereo out = run_blocks(device, input, blockings[b], change_at, [&] {
          device.set_param(p::kMix, 0.9f);
          device.set_param(p::kWidth, 0.2f);
          device.set_param(p::kTone, 2000.0f);
          device.set_param(p::kFade, 0.9f);
          device.set_param(p::kSpan, 300.0f);
          device.set_param(p::kStars, 12.0f);
          device.set_param(p::kPattern, 2.0f);
          device.set_param(p::kShuffle, 5.0f);
        });
        if (b == 0) {
          reference = out;
          // Whether this silence was a rest: it started three times (at init,
          // on the first note and on the second) and not two.
          if (device.starts() >= 3) {
            ++restarted;
          } else {
            ++carried;
          }
          continue;
        }
        for (size_t i = 0; i < out.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
        }
      }
    }
    std::printf("block sizes: across %d silences that were a rest and %d that were not, 1-frame, 2048-frame "
                "and ragged blocks differ from 128-frame ones by at most %.2g\n",
                restarted, carried, worst);
    EXPECT(restarted >= 3 && carried >= 3, "the silences straddle the moment of rest");
    EXPECT(worst < 1.0e-6, "the output does not depend on the block size across a rest");
  }

  // A knob moved while the device rests has arrived when sound returns: the
  // second note is the one a device set that way from the start plays.
  {
    std::vector<float> first = silence(10.0f, kRate);
    add_tone(first, 220.0f, 0.0f, 0.3f, 0.3f);
    std::vector<float> second = silence(2.0f, kRate);
    add_tone(second, 277.0f, 0.0f, 0.6f, 0.3f);
    auto throw_knobs = [](Constellation& d) {
      d.set_param(p::kMix, 0.9f);
      d.set_param(p::kWidth, 0.2f);
      d.set_param(p::kTone, 2000.0f);
      d.set_param(p::kFade, 0.9f);
      d.set_param(p::kSpan, 300.0f);
      d.set_param(p::kStars, 12.0f);
      d.set_param(p::kPattern, 2.0f);
      d.set_param(p::kShuffle, 5.0f);
      d.set_param(p::kDrift, 1.0f);
      d.set_param(p::kAgain, 0.6f);
    };
    device.init(kRate);
    device.set_param(p::kAgain, 0.0f);
    device.process(13);
    run(device, first);
    throw_knobs(device);
    Stereo moved = run(device, second);
    // The other device is as old (the wander's clock counts through a sleep)
    // and has heard nothing.
    fresh.init(kRate);
    fresh.process(13);
    render(fresh, 10.0f, kRate);
    throw_knobs(fresh);
    Stereo from_start = run(fresh, second);
    double worst = 0.0;
    for (size_t i = 0; i < moved.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(moved.left[i]) - from_start.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(moved.right[i]) - from_start.right[i]));
    }
    std::printf("knobs moved at rest: the next note differs from a device set that way from the start by %.2g\n",
                worst);
    EXPECT(worst < 1.0e-6, "knobs moved while it rests snap when sound returns");
  }

  // Handling it while it sounds. Against the same render with nothing moved:
  // Stars, Pattern and Shuffle changed ten times a second, the smooth knobs
  // thrown about, and Span jumping (which bends the echoes: up to three
  // times the speed, so up to three times the step of the tone).
  {
    std::vector<float> input = sine(110.0f, 12.0f, kRate, 0.4f);
    const char* names[6] = {"nothing", "Stars", "Pattern", "Shuffle", "the smooth knobs", "Span"};
    double steps[6];
    for (int moved = 0; moved < 6; ++moved) {
      device.init(kRate);
      device.set_param(p::kMix, 0.7f);
      device.set_param(p::kStars, 9.0f);
      device.set_param(p::kSpan, 900.0f);
      Stereo out;
      const size_t chunk = 4800;
      for (size_t done = 0, n = 0; done < input.size(); done += chunk, ++n) {
        if (done >= 4 * 48000) {
          if (moved == 1) device.set_param(p::kStars, n % 2 ? 2.0f : 12.0f);
          if (moved == 2) device.set_param(p::kPattern, static_cast<float>(n % 5));
          if (moved == 3) device.set_param(p::kShuffle, static_cast<float>(1 + (n * 7) % 16));
          if (moved == 4) {
            const float t = static_cast<float>(n % 7) / 6.0f;
            device.set_param(p::kMix, 0.2f + 0.8f * t);
            device.set_param(p::kFade, 1.0f - t);
            device.set_param(p::kAgain, n % 2 ? 0.9f : 0.0f);
            device.set_param(p::kTone, n % 2 ? 900.0f : 12000.0f);
            device.set_param(p::kDrift, n % 3 ? 1.0f : 0.0f);
            device.set_param(p::kWidth, n % 2 ? 1.0f : 0.0f);
          }
          if (moved == 5 && n % 5 == 0) device.set_param(p::kSpan, n % 2 ? 150.0f : 3000.0f);
        }
        std::vector<float> part(input.begin() + done, input.begin() + done + chunk);
        out = concat(out, run(device, part));
      }
      steps[moved] = std::max(max_step(out.left, 4 * 48000), max_step(out.right, 4 * 48000));
    }
    std::printf("handling: largest step %.4f left alone", steps[0]);
    for (int moved = 1; moved < 6; ++moved) std::printf(", %.4f moving %s", steps[moved], names[moved]);
    std::printf("\n");
    for (int moved = 1; moved < 5; ++moved) {
      std::snprintf(label, sizeof label, "moving %s while it sounds does not click", names[moved]);
      EXPECT(steps[moved] < 1.5 * steps[0] + 0.004, label);
    }
    EXPECT(steps[5] < 3.0 * steps[0] + 0.004, "a Span change glides without a click");
  }

  // Bad input. A NaN, an infinity and a sample of 1e30 on each side for a
  // quarter of a second each never reach the line: from the first good
  // sample on, the output is exactly what it is when those samples were
  // silence, and the device still comes to rest.
  {
    std::vector<float> good = silence(8.0f, kRate);
    add_tone(good, 330.0f, 0.0f, 0.25f, 0.4f);
    add_tone(good, 440.0f, 1.0f, 1.0f, 0.4f);
    std::vector<float> bad = good;
    const size_t quarter = 12000;
    for (size_t i = 0; i < quarter; ++i) {
      bad[quarter + i] = std::nanf("");
      bad[2 * quarter + i] = i % 2 ? HUGE_VALF : -HUGE_VALF;
      bad[3 * quarter + i] = i % 2 ? 1.0e30f : -1.0e30f;
    }
    device.init(kRate);
    device.set_param(p::kAgain, 0.9f);
    device.set_param(p::kStars, 12.0f);
    Stereo out = run(device, bad);
    fresh.init(kRate);
    fresh.set_param(p::kAgain, 0.9f);
    fresh.set_param(p::kStars, 12.0f);
    Stereo clean = run(fresh, good);
    bool all_finite = true;
    double worst = 0.0;
    for (size_t i = 4 * quarter; i < out.size(); ++i) {
      all_finite = all_finite && std::isfinite(out.left[i]) && std::isfinite(out.right[i]);
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - clean.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - clean.right[i]));
    }
    std::printf("bad input: after NaN, infinity and 1e30 the output differs from a render that had silence "
                "there by %.2g\n",
                worst);
    EXPECT(all_finite, "the output is finite again from the first good sample");
    EXPECT(worst == 0.0, "bad samples leave nothing behind");
    EXPECT(rms(out.left, 5 * 48000, 6 * 48000) > 1.0e-3, "and it is not stuck: the echoes of the good sound play");
    device.set_param(p::kAgain, 0.0f);
    render(device, 12.0f, kRate);
    Stereo after = render(device, 0.5f, kRate);
    EXPECT(device.asleep() && peak(after.left) == 0.0, "and it still comes to rest");
  }

  // Cost: the defaults, then twelve stars all wandering with the loop full,
  // then the same with a new sky crossing in all the time (two skies read).
  {
    rng_state() = 0xBEEFu;
    std::vector<float> input = noise(20.0f, kRate, 0.25f);
    device.init(kRate);
    run(device, input);
    report_cost("constellation (defaults)", 20.0f, kRate, [&] { run(device, input); });
    device.init(kRate);
    device.set_param(p::kStars, 12.0f);
    device.set_param(p::kDrift, 1.0f);
    device.set_param(p::kAgain, 0.9f);
    device.set_param(p::kSpan, 8000.0f);
    run(device, input);
    report_cost("constellation (twelve stars)", 20.0f, kRate, [&] { run(device, input); });
    report_cost("constellation (twelve stars, a sky crossing in)", 20.0f, kRate, [&] {
      const size_t chunk = 2880;
      for (size_t done = 0, n = 0; done + chunk <= input.size(); done += chunk, ++n) {
        device.set_param(p::kShuffle, static_cast<float>(1 + n % 16));
        std::vector<float> part(input.begin() + done, input.begin() + done + chunk);
        run(device, part);
      }
    });
  }

  return finish("constellation");
}
