// Native harness for Constellation (cpp/devices/constellation). After the
// conformance pass it asserts what makes it a sky of echoes: a sound comes
// back at each pattern's times, sides and levels; one star is one echo;
// Stars lights places without moving the others; Again plays the whole sky
// again a span later and the passes share the level; Fade, Tone, Width and
// Drift do what they say; a sound on one side or in opposite phase on the two
// comes back; a Span thrown far crosses to the new sky and never reads the
// line backwards; and the device handles a moved knob, a bad sample, a rest
// and any block size.

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

// What the all-passes in front of the line (kit::Hilbert, the in-phase chain
// the middle of the two sides goes down) delay a burst by: where the energy
// of the burst is centred after them, less where it was.
static double turn_lag(float rate, float hz, float seconds) {
  std::vector<float> burst = silence(0.25f, rate);
  add_burst(burst, 0, rate, hz, seconds, 0.5f);
  livemix::kit::Hilbert turn;
  turn.reset();
  double before = 0.0, after = 0.0, energy_before = 0.0, energy_after = 0.0;
  for (size_t i = 0; i < burst.size(); ++i) {
    float in_phase, quadrature;
    turn.process(burst[i], &in_phase, &quadrature);
    before += static_cast<double>(i) * burst[i] * burst[i];
    energy_before += static_cast<double>(burst[i]) * burst[i];
    after += static_cast<double>(i) * in_phase * in_phase;
    energy_after += static_cast<double>(in_phase) * in_phase;
  }
  return after / energy_after - before / energy_before;
}

// The largest share, over 100 ms windows of [from, to), of the energy of the
// two sides that lies under `hz` (or above it): what two two-pole filters in
// a row let through, so a tone two octaves on the other side counts for
// nothing.
static double worst_share(const Stereo& out, float hz, bool above, size_t from, size_t to) {
  const size_t window = 4800;
  const size_t lead = from > 48000 ? from - 48000 : 0;
  std::vector<double> kept((to - from) / window, 0.0), total((to - from) / window, 0.0);
  for (int side = 0; side < 2; ++side) {
    const std::vector<float>& x = side ? out.right : out.left;
    livemix::kit::Svf one, two;
    one.set(hz, 0.7071f, kRate);
    two.set(hz, 0.7071f, kRate);
    for (size_t i = lead; i < to && i < x.size(); ++i) {
      const float y = above ? two.highpass(one.highpass(x[i])) : two.lowpass(one.lowpass(x[i]));
      if (i < from || (i - from) / window >= kept.size()) continue;
      kept[(i - from) / window] += static_cast<double>(y) * y;
      total[(i - from) / window] += static_cast<double>(x[i]) * x[i];
    }
  }
  double worst = 0.0;
  for (size_t w = 0; w < kept.size(); ++w) {
    if (total[w] > 1.0e-9) worst = std::max(worst, kept[w] / total[w]);
  }
  return worst;
}

// A steady broad sound at `level` rms: noise through two low-passes at 3 kHz
// and a low cut at 150 Hz, so no comb decides a level measured on it.
static std::vector<float> broad_noise(float seconds, uint32_t seed, float level) {
  rng_state() = seed;
  std::vector<float> x = noise(seconds, kRate, 1.0f);
  float one = 0.0f, two = 0.0f, low = 0.0f;
  for (float& v : x) {
    one += 0.3f * (v - one);
    two += 0.3f * (one - two);
    low += 0.02f * (two - low);
    v = two - low;
  }
  const float gain = level / static_cast<float>(rms(x));
  for (float& v : x) v *= gain;
  return x;
}

// The steepest the wander of `star` gets over its whole period with Drift at
// 1, as a share of the speed of the read (seconds of delay a second): the
// pitch it bends the star's echo by.
static double steepest_wander(int star) {
  const int steps = p::kDriftPeriodSeconds * 200;
  double worst = 0.0, before = p::drift_at(star, 0.0);
  for (int i = 1; i <= steps; ++i) {
    const double now = p::drift_at(star, static_cast<double>(i) / steps);
    worst = std::max(worst, std::fabs(now - before) * 200.0 * p::kDriftSeconds);
    before = now;
  }
  return worst;
}

static double rms_both(const Stereo& out, size_t from, size_t to = SIZE_MAX) {
  const double l = rms(out.left, from, to), r = rms(out.right, from, to);
  return std::sqrt(0.5 * (l * l + r * r));
}

// Run `input` in blocks whose sizes cycle through `sizes`, calling `change`
// once, before sample `change_at` (a block ends there whatever the sizes).
// The right side is `right` times the left (-1: the two in opposite phase).
template <typename Change>
static Stereo run_blocks(Constellation& d, const std::vector<float>& input, const std::vector<int>& sizes,
                         size_t change_at, Change change, float right = 1.0f) {
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
      d.in_right()[i] = right * input[done + i];
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

  // What the all-passes in front of the line delay the 3 ms burst at 2 kHz
  // that most of the timings below are taken with.
  const double turn = turn_lag(kRate, 2000.0f, 0.003f);
  std::printf("the all-passes in front of the line delay a 3 ms burst at 2 kHz by %.2f samples\n", turn);

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
    int ladders_across = 0, same_sides = 0, same_brightness = 0;
    double least_side_move = 10.0, least_brightness_move = 10.0;
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
              !(sky.mag[k] >= 0.3f && sky.mag[k] <= 1.0f)) {
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
          // The walk across the sides: straight to the last star's side, or
          // out to the other side and back; and a coarser rung is brighter
          // than a finer one whatever chance did to each.
          bool across = true, there_and_back = true;
          for (int k = 1; k < p::kPlaces; ++k) {
            if (std::fabs(sky.time[k] / std::pow(rungs[k], warp) - 1.0) > 1.0e-4) ++shape_faults;
            if (std::fabs(sky.pan[k] - sky.pan[0] * (2.0 * rungs[k] - 1.0)) > 1.0e-5) across = false;
            if (std::fabs(sky.pan[k] - sky.pan[0] * (4.0 * std::fabs(rungs[k] - 0.5) - 1.0)) > 1.0e-5) there_and_back = false;
          }
          if (!across && !there_and_back) ++shape_faults;
          if (across) ++ladders_across;
          const int depth_of[p::kPlaces] = {0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4};
          for (int k = 1; k < p::kPlaces; ++k) {
            for (int j = 1; j < p::kPlaces; ++j) {
              if (depth_of[k] < depth_of[j] && sky.mag[k] <= sky.mag[j]) ++shape_faults;
            }
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
      // Shuffle is another sky in all of time, side and brightness: over the
      // pairs of seeds of a pattern, how far a star moves to the side and in
      // brightness on average, and how many pairs keep every star's
      // brightness, or every star's side but for a mirror.
      double side_move = 0.0, brightness_move = 0.0;
      int pairs = 0;
      for (int a = 1; a <= 16; ++a) {
        for (int b = a + 1; b <= 16; ++b) {
          double side = 0.0, brightness = 0.0, most_brightness = 0.0, straight = 0.0, mirrored = 0.0;
          for (int k = 1; k < p::kPlaces; ++k) {
            side += std::fabs(skies[a].pan[k] - skies[b].pan[k]) / (p::kPlaces - 1);
            brightness += std::fabs(skies[a].mag[k] - skies[b].mag[k]) / (p::kPlaces - 1);
            most_brightness = std::max(most_brightness, static_cast<double>(std::fabs(skies[a].mag[k] - skies[b].mag[k])));
            straight = std::max(straight, static_cast<double>(std::fabs(skies[a].pan[k] - skies[b].pan[k])));
            mirrored = std::max(mirrored, static_cast<double>(std::fabs(skies[a].pan[k] + skies[b].pan[k])));
          }
          side_move += side;
          brightness_move += brightness;
          ++pairs;
          if (most_brightness < 0.01) ++same_brightness;
          // Ladder has four walks (two ways, each mirrored), so some of its seeds share one.
          if (pattern != p::kLadder && std::min(straight, mirrored) < 0.01) ++same_sides;
        }
      }
      std::printf("shuffle, %s: between two seeds a star moves %.3f to the side and %.3f in brightness on average\n",
                  kPatternNames[pattern], side_move / pairs, brightness_move / pairs);
      least_side_move = std::min(least_side_move, side_move / pairs);
      least_brightness_move = std::min(least_brightness_move, brightness_move / pairs);
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
    EXPECT(ladders_across >= 4 && ladders_across <= 12, "Ladder walks straight across for some seeds and there and back for others");
    EXPECT(same_brightness == 0, "no two seeds of a pattern give every star the same brightness");
    EXPECT(same_sides == 0, "no two seeds of a pattern give every star the same side, mirrored or not");
    EXPECT(least_side_move > 0.3 && least_brightness_move > 0.02,
           "Shuffle moves the stars to the side and in brightness in every pattern");
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
        {0, 512.401678, {0.749341f, -0.966851f, 0.958515f, 0.236264f, 0.996547f, 0.619501f, 0.041829f, -0.178527f, 0.478726f,
                         0.585409f, -0.544575f, 0.951159f, 0.068754f, 0.390160f, 0.720743f, 0.002767f, -0.990467f, 0.520446f}},
        {1, 701.651893, {0.294104f, -0.806443f, 0.873956f, 0.265455f, -0.607987f, 0.667465f, 0.722944f, 0.787971f, 0.470923f,
                         0.265477f, -0.383804f, 0.872619f, 0.235544f, -0.387271f, 0.604190f, 0.703009f, 0.179602f, 0.517274f}},
        {2, 699.133699, {0.888462f, 0.084019f, 0.696795f, 0.404371f, 0.459075f, 0.663106f, 0.151972f, -0.015692f, 0.583238f,
                         0.219364f, 0.082833f, 0.842265f, 0.659768f, 0.052814f, 0.683452f, 0.389212f, 0.171392f, 0.793168f}},
        {3, 499.253298, {0.550059f, -0.000000f, 0.825372f, 0.666775f, -0.200000f, 0.533036f, 0.836059f, -0.500000f, 0.369353f,
                         0.578848f, -0.000000f, 0.803996f, 0.690242f, -0.200000f, 0.469233f, 0.848934f, -0.500000f, 0.388544f}},
        {4, 817.134477, {0.267721f, 0.042091f, 0.543261f, 0.789436f, -0.738468f, 0.591657f, 0.967533f, -0.796758f, 0.908001f,
                         0.231653f, -0.435943f, 0.544487f, 0.732214f, -0.543852f, 0.641995f, 0.944902f, -0.810714f, 0.751839f}},
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
    const double lag = lag_seconds(16000.0) * kRate + turn;
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
                    a.at - 71.5 - turn - 24000.0, a.level, outside);
      }
      std::snprintf(label, sizeof label, "%s: Stars 1 is one echo at Span, at unity", kPatternNames[pattern]);
      EXPECT(std::fabs(a.at - 71.5 - turn - 24000.0) < 1.5 && std::fabs(a.level - 1.0) < 0.02 && outside < 1.0e-6, label);
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
          worst_time = std::max(worst_time, std::fabs(a.at - 71.5 - turn - delay - lag_seconds(16000.0) * kRate));
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

    // The first sky is quieter by Again's share (sky.h), so that all the
    // passes together are as loud as one sky with none.
    plain(device);
    device.set_param(p::kSpan, span_seconds * 1000.0f);
    device.set_param(p::kStars, 1.0f);
    device.set_param(p::kAgain, 0.8f);
    Stereo shared = run(device, input);
    const long at_span = static_cast<long>(span_seconds * kRate) - 40;
    const double first_pass = arrival(shared, at_span, at_span + 264, energy_in).level;
    std::printf("again 0.8: the first pass of one star is at %.4f of the level it went in (the share is %.4f)\n",
                first_pass, p::again_share(0.8f));
    EXPECT(std::fabs(first_pass / p::again_share(0.8f) - 1.0) < 0.02 && first_pass < 0.7,
           "Again 0.8: the first pass is quieter by the passes' share");
  }

  // The passes share the level: a held broad noise comes back about as loud
  // as it went in whatever Again is. (Unscaled, the passes of a held sound
  // pile up: 6 dB and more over the input at 0.93, 12 dB at the top.) At the
  // very top, with the low-pass wide open as here, the loop loses next to
  // nothing a pass and the level stands 3 dB over.
  {
    std::vector<float> input = broad_noise(30.0f, 0xA6A12u, 0.1f);
    const size_t from = 20 * 48000;
    const double dry = rms(input, from);
    double gain[4];
    int n = 0;
    for (float again : {0.0f, 0.6f, 0.93f, 1.0f}) {
      plain(device);
      device.set_param(p::kSpan, 300.0f);
      device.set_param(p::kStars, 7.0f);
      device.set_param(p::kAgain, again);
      Stereo out = run(device, input);
      gain[n++] = db(rms_both(out, from) / dry);
    }
    std::printf("level: a held noise comes back at %+.2f dB with Again 0, %+.2f dB at 0.6, %+.2f dB at 0.93, "
                "%+.2f dB at 1\n",
                gain[0], gain[1], gain[2], gain[3]);
    EXPECT(std::fabs(gain[0]) < 1.0 && std::fabs(gain[1]) < 1.5 && std::fabs(gain[2]) < 1.5,
           "the wet level of a held sound does not pile up with Again");
    EXPECT(gain[3] > -1.5 && gain[3] < 3.5, "and at the top of Again it stays within 3.5 dB");
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

  // The line is one signal, and whatever is on the two sides goes into it at
  // the mean of their powers: a held noise comes back as loud when the two
  // sides are the same, unrelated, or in opposite phase (a plain sum of the
  // sides loses 3 dB of the second and all of the third), and a sound on one
  // side alone comes back 3 dB under the same sound on both.
  {
    const std::vector<float> a = broad_noise(8.0f, 0x57E2E0u, 0.1f);
    const std::vector<float> b = broad_noise(8.0f, 0x0B0E5u, 0.1f);
    const std::vector<float> none = silence(8.0f, kRate);
    std::vector<float> flipped = a;
    for (float& v : flipped) v = -v;
    const std::vector<float>* sides[5][2] = {{&a, &a}, {&a, &b}, {&a, &flipped}, {&a, &none}, {&none, &a}};
    const size_t from = 2 * 48000;
    double level[5];
    for (int n = 0; n < 5; ++n) {
      plain(device);
      device.set_param(p::kSpan, 600.0f);
      Stereo out = run(device, *sides[n][0], *sides[n][1]);
      level[n] = db(rms_both(out, from) / 0.1);
    }
    std::printf("two sides: a held noise comes back at %+.2f dB the same on both, %+.2f dB unrelated, %+.2f dB in "
                "opposite phase, %+.2f dB on the left alone, %+.2f dB on the right alone\n",
                level[0], level[1], level[2], level[3], level[4]);
    EXPECT(std::fabs(level[0]) < 1.0, "a sound in the middle comes back as loud as it went in");
    EXPECT(std::fabs(level[1] - level[0]) < 0.75, "two unrelated sides come back as loud as a sound in the middle");
    EXPECT(std::fabs(level[2] - level[0]) < 0.75, "two sides in opposite phase come back as loud as a sound in the middle");
    EXPECT(std::fabs(level[3] - level[0] + 3.0) < 0.75 && std::fabs(level[4] - level[0] + 3.0) < 0.75,
           "a sound on one side comes back 3 dB under the same sound on both");

    // And at every pitch: a tone on one side through one star, against the
    // same tone on both.
    double least = 0.0, most = -100.0;
    for (float hz : {40.0f, 100.0f, 1000.0f, 5000.0f, 12000.0f}) {
      const std::vector<float> tone = sine(hz, 3.0f, kRate, 0.25f);
      const std::vector<float> quiet = silence(3.0f, kRate);
      double heard[2];
      for (int one_side = 0; one_side < 2; ++one_side) {
        plain(device);
        device.set_param(p::kSpan, 100.0f);
        device.set_param(p::kStars, 1.0f);
        device.set_param(p::kTone, 16000.0f);
        Stereo out = run(device, tone, one_side ? quiet : tone);
        heard[one_side] = rms_both(out, 72000);
      }
      least = std::min(least, db(heard[1] / heard[0]));
      most = std::max(most, db(heard[1] / heard[0]));
    }
    std::printf("two sides: a tone on one side comes back %+.2f to %+.2f dB re the same tone on both, 40 Hz to 12 kHz\n",
                least, most);
    EXPECT(least > -3.4 && most < -2.6, "a tone on one side goes in at half the power from 40 Hz to 12 kHz");

    // Opposite phase is a sound: an echo of a burst that is on the two sides
    // in opposite phase is as loud as the burst.
    std::vector<float> click = silence(1.0f, kRate);
    add_burst(click, 0, kRate, 2000.0f, 0.003f, 0.5f);
    std::vector<float> turned = click;
    for (float& v : turned) v = -v;
    plain(device);
    device.set_param(p::kSpan, 500.0f);
    device.set_param(p::kStars, 1.0f);
    Stereo out = run(device, click, turned);
    const Arrival echo = arrival(out, 24000 - 200, 24000 + 464, energy(click));
    std::printf("two sides: one echo of a burst in opposite phase is at %.3f of the level it went in\n", echo.level);
    EXPECT(std::fabs(echo.level - 1.0) < 0.03, "a burst in opposite phase on the two sides has its echo");
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
        const double measured = a.at - 71.5 - turn - lag_seconds(16000.0) * kRate - b * 9 * kRate - delay;
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
        const double measured = a.at - 71.5 - turn - lag_seconds(16000.0) * kRate - second - delay;
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

  // Drift is slow: the steepest any star's wander gets, over the whole of its
  // period with Drift at 1, bends that star's echo by under 10 cents.
  {
    double worst = 0.0;
    for (int k = 0; k < p::kPlaces; ++k) worst = std::max(worst, steepest_wander(k));
    std::printf("drift: at 1 the wander bends the last star by up to %.1f cents and the fastest star by %.1f\n",
                1200.0 * std::log2(1.0 + steepest_wander(0)), 1200.0 * std::log2(1.0 + worst));
    EXPECT(1200.0 * std::log2(1.0 + worst) < 10.0, "Drift 1 never bends a star by 10 cents");
    EXPECT(1200.0 * std::log2(1.0 + worst) > 4.0, "Drift 1 does bend a star by some cents");
  }

  // Drift detunes: a steady tone through one star comes back moved off its
  // frequency by no more than the wander's steepest slope allows (0.21 % for
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
    EXPECT(moved > 0.25 * steepest_wander(0) && moved < 1.05 * steepest_wander(0),
           "Drift 1 bends the last star by up to 0.21 % and no more");
  }

  // A Span reached by turning the knob is the Span set before the first
  // block, at 48 and at 96 kHz: thrown there from far off (a new sky at the
  // new span crosses in, and the span stands there at once) or nudged there
  // from 40 ms away (the span glides, and 60 ms on it is part of the way).
  for (float rate : {48000.0f, 96000.0f}) {
    std::vector<float> input = silence(12.0f, rate);
    add_tone(input, 97.0f, 0.0f, 12.0f, 1.0e-4f, rate);  // keeps the device from resting
    const size_t hit = static_cast<size_t>(5.0f * rate);
    add_burst(input, hit, rate, 2000.0f, 0.003f, 0.5f);
    std::vector<float> one = silence(0.01f, rate);
    add_burst(one, 0, rate, 2000.0f, 0.003f, 0.5f);
    const size_t head = static_cast<size_t>(0.5f * rate);
    const size_t soon = head + static_cast<size_t>(0.06f * rate);
    const std::vector<float> first(input.begin(), input.begin() + head);
    const std::vector<float> next(input.begin() + head, input.begin() + soon);
    const std::vector<float> rest(input.begin() + soon, input.end());
    const float from_ms[3] = {6000.0f, 700.0f, 5960.0f};
    Arrival landed[3];
    float on_the_way[3];
    for (int moved = 0; moved < 3; ++moved) {
      plain(device, rate);
      device.set_param(p::kStars, 1.0f);
      device.set_param(p::kSpan, from_ms[moved]);
      Stereo out = run(device, first);
      device.set_param(p::kSpan, 6000.0f);
      out = concat(out, run(device, next));
      on_the_way[moved] = device.meter(0);
      out = concat(out, run(device, rest));
      const long from = static_cast<long>(hit + 6.0f * rate) - 60;
      landed[moved] = arrival(out, from, from + static_cast<long>(0.003f * rate) + 200, energy(one));
    }
    std::printf("span at %.0f kHz: the echo is centred %.3f samples after the note set at load, %.3f thrown there "
                "from 700 ms, %.3f nudged there from 5960 ms; 60 ms after the move the span stands at %.2f ms "
                "thrown and %.2f ms nudged\n",
                rate / 1000.0, landed[0].at - hit, landed[1].at - hit, landed[2].at - hit, on_the_way[1], on_the_way[2]);
    EXPECT(std::fabs(landed[0].at - hit - 6.0 * rate - (0.0015 + lag_seconds(16000.0)) * rate -
                     turn_lag(rate, 2000.0f, 0.003f)) < 1.5,
           "Span set at load is the time of the last star");
    EXPECT(std::fabs(landed[1].at - landed[0].at) < 0.01 && std::fabs(landed[1].level / landed[0].level - 1.0) < 1e-3,
           "a Span thrown from far off lands on the same time");
    EXPECT(std::fabs(landed[2].at - landed[0].at) < 0.01 && std::fabs(landed[2].level / landed[0].level - 1.0) < 1e-3,
           "a Span nudged there lands on the same time");
    EXPECT(std::fabs(on_the_way[1] - 6000.0f) < 0.01f, "a Span thrown far stands at the new span at once: a new sky, no glide");
    EXPECT(on_the_way[2] > 5968.0f && on_the_way[2] < 5990.0f, "a Span nudged by 40 ms glides there");
  }

  // Span thrown far while a chord is held. A read that ran to a longer span
  // would stand still on the line or run backwards for seconds (the chord
  // slides down under its own pitch: more than half the energy under 60 Hz),
  // and one that ran to a shorter span would play the line at several times
  // its speed (the chord slides up, above its highest note). Neither happens:
  // the worst 100 ms after the throw holds no more under 60 Hz or above
  // 1.5 kHz than the chord left alone, and steps no harder.
  {
    std::vector<float> input = silence(21.0f, kRate);
    for (float hz : {196.0f, 246.94f, 293.66f, 392.0f}) add_tone(input, hz, 0.0f, 21.0f, 0.12f);
    const size_t at = 14 * 48000;
    const size_t to = at + 6 * 48000;
    const std::vector<float> before(input.begin(), input.begin() + at);
    const std::vector<float> after(input.begin() + at, input.end());
    struct Throw {
      float from_ms, to_ms;
      bool above;
      float hz;
    };
    const Throw throws[4] = {{300.0f, 3000.0f, false, 60.0f}, {150.0f, 8000.0f, false, 60.0f},
                             {2400.0f, 300.0f, true, 1500.0f}, {8000.0f, 100.0f, true, 1500.0f}};
    for (const Throw& thrown : throws) {
      double share[2], step[2];
      for (int moved = 0; moved < 2; ++moved) {
        device.init(kRate);
        device.set_param(p::kMix, 1.0f);
        device.set_param(p::kDrift, 0.0f);
        device.set_param(p::kSpan, thrown.from_ms);
        Stereo out = run(device, before);
        if (moved) device.set_param(p::kSpan, thrown.to_ms);
        out = concat(out, run(device, after));
        share[moved] = worst_share(out, thrown.hz, thrown.above, at, to);
        step[moved] = std::max(max_step(out.left, at, to), max_step(out.right, at, to));
      }
      std::printf("span thrown from %.0f to %.0f ms under a held chord: the worst 100 ms has %.4f %% of its energy "
                  "%s %.0f Hz (%.4f %% left alone); largest step %.4f (%.4f left alone)\n",
                  thrown.from_ms, thrown.to_ms, 100.0 * share[1], thrown.above ? "above" : "under", thrown.hz,
                  100.0 * share[0], step[1], step[0]);
      std::snprintf(label, sizeof label, "Span thrown from %.0f to %.0f ms does not slide the chord %s", thrown.from_ms,
                    thrown.to_ms, thrown.above ? "up" : "down");
      EXPECT(share[1] < share[0] + 0.005, label);
      std::snprintf(label, sizeof label, "Span thrown from %.0f to %.0f ms does not click", thrown.from_ms, thrown.to_ms);
      EXPECT(step[1] < 1.5 * step[0] + 0.004, label);
    }
  }

  // A new sky crosses in without a dip. Under a held noise: Pattern, Shuffle
  // or a far Span changed every 750 ms, forty times; the power in the middle
  // of the crossing (20 to 40 ms after the change) against the power before
  // and after it. (Two skies are different moments of the line: crossed in a
  // straight line they lose 3 dB half way.)
  {
    const std::vector<float> input = broad_noise(34.5f, 0xC2055u, 0.1f);
    const size_t first = 4 * 48000, every = 36000;
    const char* names[3] = {"Pattern", "Shuffle", "Span"};
    for (int what = 0; what < 3; ++what) {
      plain(device);
      device.set_param(p::kStars, 12.0f);
      device.set_param(p::kSpan, 1500.0f);
      Stereo out;
      int n = 0;
      for (size_t done = 0; done < input.size();) {
        const size_t chunk = std::min(done < first ? first : every, input.size() - done);
        if (done >= first) {
          if (what == 0) device.set_param(p::kPattern, static_cast<float>((n + 1) % 5));
          if (what == 1) device.set_param(p::kShuffle, static_cast<float>(1 + (n * 5 + 3) % 16));
          if (what == 2) device.set_param(p::kSpan, 400.0f + 300.0f * static_cast<float>((n * 7) % 11));
          ++n;
        }
        const std::vector<float> part(input.begin() + done, input.begin() + done + chunk);
        out = concat(out, run(device, part));
        done += chunk;
      }
      double middle = 0.0, around = 0.0;
      int changes = 0;
      for (size_t at = first; at + 9600 <= out.size(); at += every) {
        middle += std::pow(rms_both(out, at + 960, at + 1920), 2.0);
        around += 0.5 * (std::pow(rms_both(out, at - 4800, at - 960), 2.0) +
                         std::pow(rms_both(out, at + 4800, at + 8640), 2.0));
        ++changes;
      }
      const double dip = 10.0 * std::log10(middle / around);
      std::printf("crossing: over %d changes of %s under a held noise the power half way is %+.2f dB of before and after\n",
                  changes, names[what], dip);
      std::snprintf(label, sizeof label, "a new %s crosses in without a dip or a bump", names[what]);
      EXPECT(std::fabs(dip) < 0.6, label);
    }
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
      worst_time = std::max(worst_time, std::fabs(a.at - centre_in - delay - lag_seconds(16000.0) * rate -
                                                  turn_lag(rate, 2000.0f, 0.003f)));
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

  // One sound after a rest is one start, whether it begins on a sample that
  // has not reached the line yet (the all-passes hold the middle back by a
  // sample) or not, in the middle or in opposite phase on the two sides.
  {
    std::vector<float> note = silence(3.0f, kRate);
    add_tone(note, 330.0f, 0.5f, 1.0f, 0.4f);
    std::vector<float> turned = note;
    for (float& v : turned) v = -v;
    device.init(kRate);
    run(device, impulse(1.0f, kRate, 0.5f));
    const int after_click = device.starts();
    device.init(kRate);
    run(device, note);
    const int after_note = device.starts();
    device.init(kRate);
    run(device, note, turned);
    const int after_turned = device.starts();
    std::printf("starts: %d after init and a click, %d after init and a note, %d after init and a note in opposite phase\n",
                after_click, after_note, after_turned);
    EXPECT(after_click == 2 && after_note == 2, "one sound after a rest is one start");
    EXPECT(after_turned == 2, "a sound in opposite phase on the two sides starts the device too");
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
  // (8.5 s after the last of the first note has passed the all-passes into
  // the line, 50 to 150 ms after it ends) in 20 ms steps, every knob is thrown
  // 5 ms before the second note, and the first block is an odd one so the
  // sleep begins off the beat of the control clock. Against 128-frame blocks.
  // Every other step has the two sides in opposite phase: their sum is
  // silence, and the device must take it for a sound all the same.
  {
    const std::vector<std::vector<int>> blockings = {{128}, {1}, {2048}, {13, 1, 7, 64, 128, 33, 512, 2048, 5}};
    double worst = 0.0;
    int restarted = 0, carried = 0;
    for (int step = 0; step <= 11; ++step) {
      const float gap = step == 11 ? 12.0f : 8.52f + 0.02f * step;
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
        }, step % 2 ? -1.0f : 1.0f);
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
    std::vector<float> turned = second;
    for (float& v : turned) v = -v;
    for (int opposite = 0; opposite < 2; ++opposite) {
      const std::vector<float>& right = opposite ? turned : second;
      device.init(kRate);
      device.set_param(p::kAgain, 0.0f);
      device.process(13);
      run(device, first);
      throw_knobs(device);
      Stereo moved = run(device, second, right);
      // The other device is as old (the wander's clock counts through a sleep)
      // and has heard nothing.
      fresh.init(kRate);
      fresh.process(13);
      render(fresh, 10.0f, kRate);
      throw_knobs(fresh);
      Stereo from_start = run(fresh, second, right);
      double worst = 0.0;
      for (size_t i = 0; i < moved.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(moved.left[i]) - from_start.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(moved.right[i]) - from_start.right[i]));
      }
      // The dry of the note's first sounding sample is at the Mix thrown to
      // (0.9: cos of 0.45 pi of itself), not on its way there from 0.4.
      size_t sounding = 0;
      while (sounding < second.size() && std::fabs(second[sounding]) < 1.0e-3f) ++sounding;
      const double dry_share = moved.left[sounding] / second[sounding];
      std::printf("knobs moved at rest: the next note%s differs from a device set that way from the start by %.2g; "
                  "its first sample is at %.4f of itself (Mix 0.9 leaves %.4f)\n",
                  opposite ? ", in opposite phase on the two sides," : "", worst, dry_share, std::cos(0.45 * kPi));
      EXPECT(std::fabs(dry_share - std::cos(0.45 * kPi)) < 0.003,
             opposite ? "Mix thrown at rest has arrived when a sound in opposite phase returns"
                      : "Mix thrown at rest has arrived when sound returns");
      EXPECT(worst < 1.0e-6, opposite ? "knobs moved while it rests snap when a sound in opposite phase returns"
                                      : "knobs moved while it rests snap when sound returns");
    }
  }

  // Handling it while it sounds. Against the same render with nothing moved:
  // Stars, Pattern and Shuffle changed ten times a second, the smooth knobs
  // thrown about, Span thrown from end to end twice a second (a new sky
  // crosses in), and Span nudged by 40 ms ten times a second (it glides, and
  // bends the echoes: the read runs at up to 1.42 times the speed, so up to
  // that many times the step of the tone).
  {
    std::vector<float> input = sine(110.0f, 12.0f, kRate, 0.4f);
    const char* names[7] = {"nothing", "Stars", "Pattern", "Shuffle", "the smooth knobs", "Span far", "Span a little"};
    double steps[7];
    for (int moved = 0; moved < 7; ++moved) {
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
          if (moved == 6) device.set_param(p::kSpan, n % 2 ? 900.0f : 940.0f);
        }
        std::vector<float> part(input.begin() + done, input.begin() + done + chunk);
        out = concat(out, run(device, part));
      }
      steps[moved] = std::max(max_step(out.left, 4 * 48000), max_step(out.right, 4 * 48000));
    }
    std::printf("handling: largest step %.4f left alone", steps[0]);
    for (int moved = 1; moved < 7; ++moved) std::printf(", %.4f moving %s", steps[moved], names[moved]);
    std::printf("\n");
    for (int moved = 1; moved < 7; ++moved) {
      std::snprintf(label, sizeof label, "moving %s while it sounds does not click", names[moved]);
      EXPECT(steps[moved] < 1.5 * steps[0] + 0.004, label);
    }
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
