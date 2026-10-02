// Native harness for Swarm Reverb (cpp/devices/swarm-reverb). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a swarm of echoes on a
// tape whose speed can be changed.

#include "../devices/swarm-reverb/swarm_reverb.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::SwarmReverb;
namespace p = livemix::swarm_reverb;

static SwarmReverb device;

static const float kRate = 48000.0f;

// Wet only, nothing moving, nothing filtered: the bare swarm.
static void bare(SwarmReverb& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kBlur, 0.0f);
  d.set_param(p::kModulation, 0.0f);
  d.set_param(p::kHighCut, 16000.0f);
  d.set_param(p::kLowCut, 20.0f);
}

// Sample indices of the separate arrivals in an impulse response: local
// maxima of the magnitude above `floor`, at least 1 ms apart.
static std::vector<size_t> arrivals(const std::vector<float>& x, double floor, float rate = kRate) {
  std::vector<size_t> found;
  const size_t gap = static_cast<size_t>(0.001f * rate);
  for (size_t i = 1; i + 1 < x.size(); ++i) {
    const double m = std::fabs(x[i]);
    if (m < floor || m < std::fabs(x[i - 1]) || m <= std::fabs(x[i + 1])) continue;
    if (!found.empty() && i - found.back() < gap) {
      if (m > std::fabs(x[found.back()])) found.back() = i;
      continue;
    }
    found.push_back(i);
  }
  return found;
}

// Share of the 5 ms windows in [from, to) seconds that carry more than a
// hundredth of the loudest window's energy: how much of the time is filled.
static double occupied(const std::vector<float>& x, double from, double to) {
  const size_t window = static_cast<size_t>(0.005 * kRate);
  std::vector<double> energy;
  for (size_t i = static_cast<size_t>(from * kRate); i + window <= static_cast<size_t>(to * kRate); i += window) {
    double sum = 0.0;
    for (size_t k = 0; k < window; ++k) sum += static_cast<double>(x[i + k]) * x[i + k];
    energy.push_back(sum);
  }
  const double loudest = *std::max_element(energy.begin(), energy.end());
  int count = 0;
  for (double e : energy) count += e > 0.01 * loudest;
  return static_cast<double>(count) / static_cast<double>(energy.size());
}

int main() {
  Conformance spec;
  spec.name = "swarm-reverb";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 24.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // At Blur 0 an impulse comes back as fourteen separate arrivals per
  // side, the last one at Length x the Stretch scale; left and right differ.
  {
    bare(device);
    Stereo out = run(device, impulse(1.0f, kRate, 1.0f));
    std::vector<size_t> left = arrivals(out.left, 0.02);
    std::vector<size_t> right = arrivals(out.right, 0.02);
    EXPECT(left.size() == 14 && right.size() == 14, "Blur 0: fourteen arrivals on each side");
    EXPECT_NEAR(left.back() / kRate, 0.5, 0.001, "the last arrival is at Length");
    EXPECT(left.front() / kRate > 0.02 && left.front() / kRate < 0.08,
           "the first arrival is a few hundredths of Length in");
    int shared = 0;
    for (size_t l : left) {
      for (size_t r : right) shared += std::llabs(static_cast<long long>(l) - static_cast<long long>(r)) < 48;
    }
    EXPECT(shared <= 2, "left and right taps sit at different times");

    // Stretch scales every arrival together: a quarter of the way down is half
    // an octave of time, three quarters up is half an octave the other way.
    bare(device);
    device.set_param(p::kStretch, 0.25f);
    Stereo shorter = run(device, impulse(1.5f, kRate, 1.0f));
    std::vector<size_t> near = arrivals(shorter.left, 0.02);
    bare(device);
    device.set_param(p::kStretch, 1.0f);
    Stereo longer = run(device, impulse(1.5f, kRate, 1.0f));
    std::vector<size_t> far = arrivals(longer.left, 0.02);
    EXPECT(near.size() == 14 && far.size() == 14, "Stretch keeps the fourteen arrivals");
    EXPECT_NEAR(near.back() / kRate, 0.5 * std::pow(2.0, -0.5), 0.001, "Stretch 0.25: last arrival at Length / sqrt 2");
    EXPECT_NEAR(far.back() / kRate, 1.0, 0.001, "Stretch 1: last arrival at twice Length");
    EXPECT_NEAR(static_cast<double>(near[3]) / left[3], std::pow(2.0, -0.5), 0.005,
                "Stretch moves the inner arrivals by the same ratio");
    std::printf("arrivals: 14 + 14, first %.1f ms, last %.1f ms; Stretch 0.25 last %.1f ms, Stretch 1 last %.1f ms\n",
                1000.0 * left.front() / kRate, 1000.0 * left.back() / kRate, 1000.0 * near.back() / kRate,
                1000.0 * far.back() / kRate);
  }

  // Blur smears the swarm: more of the time between the first and the last
  // arrival carries sound, and the response is less spiky.
  {
    double filled[3], spikiness[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      bare(device);
      device.set_param(p::kBlur, settings[k]);
      Stereo out = run(device, impulse(1.0f, kRate, 1.0f));
      filled[k] = occupied(out.left, 0.03, 0.5);
      spikiness[k] = peak(out.left) / rms(out.left, 1440, 24000);
    }
    EXPECT(filled[0] < 0.2 && filled[1] > 2.0 * filled[0] && filled[2] >= filled[1] && filled[2] > 0.8,
           "echo density rises with Blur");
    EXPECT(spikiness[2] < 0.6 * spikiness[0], "Blur turns separate echoes into a wash");
    std::printf("blur 0 / 0.5 / 1: occupied %.2f / %.2f / %.2f, peak over rms %.1f / %.1f / %.1f\n",
                filled[0], filled[1], filled[2], spikiness[0], spikiness[1], spikiness[2]);
  }

  // Feedback sets the decay: the loop takes about 0.47 s at the default
  // Length (0.5 s on the left line, 0.44 s on the right) and loses Feedback on
  // every trip.
  {
    const float settings[3] = {0.3f, 0.6f, 0.9f};
    double decay[3];
    for (int k = 0; k < 3; ++k) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kFeedback, settings[k]);
      rng_state() = 0x5EEDu;
      std::vector<float> burst = noise(0.1f, kRate, 0.5f);
      burst.resize(static_cast<size_t>(kRate * 30.0f), 0.0f);
      Stereo out = run(device, burst);
      decay[k] = rt60(out.left, kRate, 0.7, 0.2, -80.0);
      const double expected = -3.0 * 0.47 / std::log10(settings[k]);
      char label[96];
      std::snprintf(label, sizeof label, "Feedback %.1f: RT60 %.2f s, expected about %.2f s", settings[k],
                    decay[k], expected);
      EXPECT(decay[k] > 0.75 * expected && decay[k] < 1.3 * expected, label);
    }
    EXPECT(decay[0] < decay[1] && decay[1] < decay[2], "the decay time rises with Feedback");
    std::printf("RT60 at Feedback 0.3 / 0.6 / 0.9: %.2f / %.2f / %.2f s\n", decay[0], decay[1], decay[2]);
  }

  // Feedback at its top: the cave feeds on itself, holds a steady level and
  // does not grow a bright edge (the return is not clipped on every trip).
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kFeedback, 1.05f);
    run(device, sine(330.0f, 1.0f, kRate, 0.5f));
    Stereo late = render(device, 60.0f, kRate);
    const size_t n = late.left.size();
    const double level = rms(late.left, n - 96000, n);
    const double earlier = rms(late.left, n - 480000, n - 384000);
    const double top = energy_above(late.left, 4000.0, kRate, n - 96000, n);
    EXPECT(finite(late.left) && finite(late.right), "Feedback 1.05 stays finite");
    EXPECT(peak(late.left) < 1.5 && peak(late.right) < 1.5, "Feedback 1.05 is bounded");
    EXPECT(level > 0.03, "Feedback 1.05 sustains on its own");
    EXPECT(level < 2.0 * earlier, "Feedback 1.05 settles at a level instead of climbing");
    EXPECT(top < 0.02, "Feedback 1.05 is not harsh: under 2 % of its energy above 4 kHz");
    std::printf("Feedback 1.05 after 60 s: rms %.1f dB, peak %.2f, energy above 4 kHz %.4f\n", db(level),
                std::max(peak(late.left), peak(late.right)), top);
  }

  // Stretch bends pitch. A 440 Hz tone rings in the swarm; the input stops and
  // Stretch moves down, so the tape speeds up and what is on it comes back
  // higher by the ratio of the speeds. The faster the move, the larger the
  // bend heard in the first quarter second.
  {
    const float times[3] = {0.02f, 0.6f, 3.0f};
    double bent[3];
    for (int k = 0; k < 3; ++k) {
      bare(device);
      device.set_param(p::kGlide, times[k]);
      run(device, sine(440.0f, 2.0f, kRate, 0.25f));
      device.set_param(p::kStretch, 0.25f);
      Stereo out = render(device, 0.5f, kRate);
      bent[k] = dominant_frequency(out.left, kRate, 400.0, 700.0, 2400, 12000);
    }
    EXPECT_NEAR(bent[0] / 440.0, std::sqrt(2.0), 0.02 * std::sqrt(2.0),
                "a fast Stretch move of half an octave bends the swarm up by half an octave");
    EXPECT(bent[0] > bent[1] + 20.0 && bent[1] > bent[2] + 5.0 && bent[2] > 441.0,
           "the bend is smaller the slower Glide is");
    std::printf("Stretch 0.5 -> 0.25, wet pitch in the next 250 ms at Glide 0.02 / 0.6 / 3 s: %.1f / %.1f / %.1f Hz\n",
                bent[0], bent[1], bent[2]);

    // With the tone still playing the pitch comes back to 440 Hz once the old
    // sound has left the line.
    bare(device);
    device.set_param(p::kGlide, 0.02f);
    run(device, sine(440.0f, 2.0f, kRate, 0.25f));
    device.set_param(p::kStretch, 0.25f);
    Stereo out = run(device, sine(440.0f, 3.0f, kRate, 0.25f));
    const double after = dominant_frequency(out.left, kRate, 300.0, 700.0, 96000, 144000);
    EXPECT_NEAR(after, 440.0, 0.5, "the pitch returns to 440 Hz after the move");
  }

  // Steps: Stretch lands on sizes a fourth, a fifth or an octave apart, and a
  // move between them is heard as that interval.
  {
    struct Move {
      float stretch;
      double ratio;
      const char* name;
    };
    const Move moves[4] = {{0.3f, 4.0 / 3.0, "a fourth up (size 3/4)"},
                           {0.2f, 3.0 / 2.0, "a fifth up (size 2/3)"},
                           {0.0f, 2.0, "an octave up (size 1/2)"},
                           {0.72f, 3.0 / 4.0, "a fourth down (size 4/3)"}};
    for (const Move& move : moves) {
      bare(device);
      device.set_param(p::kSteps, 1.0f);
      device.set_param(p::kGlide, 0.02f);
      run(device, sine(440.0f, 2.0f, kRate, 0.25f));
      device.set_param(p::kStretch, move.stretch);
      Stereo out = render(device, 0.4f, kRate);
      const double heard = dominant_frequency(out.left, kRate, 250.0, 1000.0, 2400, 9600);
      char label[96];
      std::snprintf(label, sizeof label, "Steps: %s, heard %.2f Hz", move.name, heard);
      EXPECT_NEAR(heard / 440.0, move.ratio, 0.02 * move.ratio, label);
      std::printf("Steps, Stretch to %.2f: %.2f Hz, ratio %.4f (expected %.4f)\n", move.stretch, heard,
                  heard / 440.0, move.ratio);
    }
    // And the knob snaps: anywhere near the middle is the nominal size.
    bare(device);
    device.set_param(p::kSteps, 1.0f);
    device.set_param(p::kStretch, 0.56f);
    Stereo out = run(device, impulse(1.0f, kRate, 1.0f));
    EXPECT_NEAR(arrivals(out.left, 0.02).back() / kRate, 0.5, 0.001, "Steps snaps Stretch to the nearest size");
  }

  // Wander moves the echo times on its own. One impulse every 1.5 s for a
  // minute; the last arrival after each is the size of the cave then.
  {
    const auto sizes = [&](float steps, float wander) {
      bare(device);
      device.set_param(p::kSteps, steps);
      device.set_param(p::kWander, wander);
      device.set_param(p::kGlide, 0.02f);
      std::vector<double> found;
      const size_t hop = static_cast<size_t>(1.5f * kRate);
      std::vector<float> train(hop * 40, 0.0f);
      for (int k = 0; k < 40; ++k) train[k * hop] = 1.0f;
      Stereo out = run(device, train);
      for (int k = 0; k < 40; ++k) {
        std::vector<float> slice(out.left.begin() + k * hop, out.left.begin() + (k + 1) * hop);
        std::vector<size_t> hits = arrivals(slice, 0.03);
        found.push_back(hits.empty() ? 0.0 : hits.back() / kRate);
      }
      return found;
    };
    const auto range = [](const std::vector<double>& v) {
      return *std::max_element(v.begin(), v.end()) / *std::min_element(v.begin(), v.end());
    };
    const auto largest_change = [](const std::vector<double>& v) {
      double worst = 1.0;
      for (size_t i = 1; i < v.size(); ++i) worst = std::max(worst, std::max(v[i] / v[i - 1], v[i - 1] / v[i]));
      return worst;
    };
    const double grid[7] = {0.5, 2.0 / 3.0, 0.75, 1.0, 4.0 / 3.0, 1.5, 2.0};
    const auto on_grid = [&](double seconds) {
      for (int g = 0; g < 7; ++g) {
        if (std::fabs(seconds / (0.5 * grid[g]) - 1.0) < 0.01) return g;
      }
      return -1;
    };

    std::vector<double> still = sizes(0.0f, 0.0f);
    EXPECT(range(still) < 1.001, "Wander 0: the echo times stay where they are");

    std::vector<double> smooth = sizes(0.0f, 0.5f);
    EXPECT(range(smooth) > 1.2, "Wander moves the echo times (Steps off)");
    EXPECT(largest_change(smooth) < 1.15, "Steps off: the echo times drift smoothly");
    int landed = 0;
    for (double s : smooth) landed += on_grid(s) >= 0;
    EXPECT(landed < 12, "Steps off: the drift does not sit on the step sizes");

    std::vector<double> stepped = sizes(1.0f, 0.6f);
    bool visited[7] = {};
    int on = 0, kinds = 0;
    for (double s : stepped) {
      const int g = on_grid(s);
      if (g >= 0) {
        ++on;
        visited[g] = true;
      }
    }
    for (bool v : visited) kinds += v;
    EXPECT(on >= 34, "Steps on: the echo times sit on the step sizes between jumps");
    EXPECT(kinds >= 3, "Steps on: Wander visits several sizes");
    EXPECT(largest_change(stepped) > 1.1, "Steps on: the echo times jump");
    std::printf("Wander over 60 s: smooth range x%.2f, largest change in 1.5 s x%.3f, %d of 40 on a step size; "
                "stepped %d of 40 on a step size, %d sizes visited, largest jump x%.2f\n",
                range(smooth), largest_change(smooth), landed, on, kinds, largest_change(stepped));
  }

  // High Cut takes the top off the echoes and Low Cut the bottom, and each
  // trip round the loop takes more.
  {
    const auto wet_noise = [&](float high_cut, float low_cut, float feedback) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kFeedback, feedback);
      device.set_param(p::kHighCut, high_cut);
      device.set_param(p::kLowCut, low_cut);
      rng_state() = 0xD00Du;
      std::vector<float> burst = noise(0.3f, kRate, 0.3f);
      burst.resize(static_cast<size_t>(kRate * 4.0f), 0.0f);
      return run(device, burst);
    };
    Stereo bright = wet_noise(16000.0f, 20.0f, 0.8f);
    Stereo dark = wet_noise(1000.0f, 20.0f, 0.8f);
    const double bright_top = energy_above(bright.left, 3000.0, kRate, 4800, 28800);
    const double dark_top = energy_above(dark.left, 3000.0, kRate, 4800, 28800);
    const double dark_later = energy_above(dark.left, 3000.0, kRate, 120000, 168000);
    EXPECT(dark_top < 0.25 * bright_top, "High Cut removes treble from the swarm");
    EXPECT(dark_later < 0.5 * dark_top, "each trip round the loop is duller");

    const auto low_tone = [&](float low_cut) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kFeedback, 0.0f);
      device.set_param(p::kLowCut, low_cut);
      Stereo out = run(device, sine(80.0f, 3.0f, kRate, 0.5f));
      return rms(out.left, 96000, 144000) + rms(out.right, 96000, 144000);
    };
    const double open = low_tone(20.0f), cut = low_tone(400.0f);
    EXPECT(db(cut / open) < -24.0, "Low Cut 400 Hz takes an 80 Hz tone down by more than 24 dB");
    std::printf("energy above 3 kHz: High Cut 16 kHz %.3f, 1 kHz %.4f, later %.4f; 80 Hz at Low Cut 400 Hz: %.1f dB\n",
                bright_top, dark_top, dark_later, db(cut / open));
  }

  // Stereo: from a mono input the swarm is decorrelated at Width 1 and exactly
  // mono at Width 0; the bass stays in the middle at any Width.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0xFACEu;
    std::vector<float> input = noise(6.0f, kRate, 0.2f);
    Stereo wide = run(device, input);
    const double wide_corr = correlation(wide.left, wide.right, 48000, wide.size());
    EXPECT(std::fabs(wide_corr) < 0.4, "Width 1: left and right are decorrelated");
    const double balance = db(rms(wide.left, 48000, wide.size()) / rms(wide.right, 48000, wide.size()));
    EXPECT(std::fabs(balance) < 1.5, "Width 1: the two sides are equally loud");

    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kWidth, 0.0f);
    Stereo mono = run(device, input);
    double apart = 0.0;
    for (size_t i = 0; i < mono.size(); ++i) apart = std::max(apart, std::fabs(static_cast<double>(mono.left[i]) - mono.right[i]));
    EXPECT(apart < 1.0e-6, "Width 0: the swarm is mono");
    EXPECT(db(rms(mono.left, 48000, mono.size()) / rms(wide.left, 48000, wide.size())) > -6.0,
           "Width 0 keeps the swarm's level (within 6 dB)");

    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo bass = run(device, sine(55.0f, 4.0f, kRate, 0.3f));
    const double bass_corr = correlation(bass.left, bass.right, 96000, bass.size());
    EXPECT(bass_corr > 0.85, "the bass of the swarm stays in the middle");

    // The default patch (dry and wet) keeps a mono input mostly in phase.
    device.init(kRate);
    Stereo patch = run(device, input);
    const double patch_corr = correlation(patch.left, patch.right, 48000, patch.size());
    EXPECT(patch_corr > 0.3, "default patch: positive correlation on mono input");
    std::printf("correlation: wet at Width 1 %+.3f (balance %+.2f dB), 55 Hz %+.3f, default patch %+.3f; Width 0 L-R %.1e\n",
                wide_corr, balance, bass_corr, patch_corr, apart);
  }

  // Mix 0 is the input, bit for bit.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xABCDu;
    std::vector<float> input = noise(1.0f, kRate, 0.5f);
    Stereo out = run(device, input);
    EXPECT(out.left == input && out.right == input, "Mix 0 passes the input through untouched");
  }

  // Moving Stretch while the cave rings bends it without a click, at the
  // fastest Glide, free or stepped; so do Length, Blur and Steps.
  {
    std::vector<float> tone = sine(220.0f, 0.25f, kRate, 0.25f);
    const auto worst_step = [&](int moving) {
      device.init(kRate);
      device.set_param(p::kGlide, 0.02f);
      run(device, sine(220.0f, 2.0f, kRate, 0.25f));
      const float stretches[8] = {0.1f, 0.9f, 0.35f, 0.0f, 1.0f, 0.5f, 0.75f, 0.2f};
      double worst = 0.0;
      for (int k = 0; k < 16; ++k) {
        if (moving == 1) device.set_param(p::kStretch, stretches[k % 8]);
        if (moving == 2) {
          device.set_param(p::kSteps, 1.0f);
          device.set_param(p::kStretch, stretches[k % 8]);
        }
        if (moving == 3) device.set_param(p::kLength, k % 2 ? 0.05f : 1.2f);
        if (moving == 4) device.set_param(p::kBlur, k % 2 ? 0.0f : 1.0f);
        if (moving == 5) device.set_param(p::kSteps, k % 2 ? 0.0f : 1.0f), device.set_param(p::kStretch, 0.4f);
        if (moving == 6) device.set_param(p::kFeedback, k % 2 ? 0.0f : 1.05f);
        Stereo out = run(device, tone);
        worst = std::max(worst, std::max(max_step(out.left), max_step(out.right)));
      }
      return worst;
    };
    const double resting = worst_step(0);
    const double free_stretch = worst_step(1), stepped_stretch = worst_step(2), length = worst_step(3);
    const double blur = worst_step(4), steps = worst_step(5), feedback = worst_step(6);
    EXPECT(free_stretch < 0.08, "Stretch moves glide without a click");
    EXPECT(stepped_stretch < 0.08, "stepped Stretch moves glide without a click");
    EXPECT(length < 0.08, "Length moves glide without a click");
    EXPECT(blur < 2.0 * resting + 0.01, "Blur moves without a click");
    EXPECT(steps < 0.08, "switching Steps does not click");
    EXPECT(feedback < 2.0 * resting + 0.01, "Feedback moves without a click");
    std::printf("largest sample step on a 220 Hz tone: at rest %.4f, Stretch %.4f, stepped Stretch %.4f, Length %.4f, "
                "Blur %.4f, Steps switch %.4f, Feedback %.4f\n",
                resting, free_stretch, stepped_stretch, length, blur, steps, feedback);
  }

  // The same audio whatever the block size, with everything moving.
  {
    const auto moving = [&](int block) {
      device.init(kRate);
      device.set_param(p::kWander, 0.7f);
      device.set_param(p::kModulation, 1.0f);
      device.set_param(p::kFeedback, 0.9f);
      device.set_param(p::kStretch, 0.3f);
      rng_state() = 0x7777u;
      return run(device, noise(3.0f, kRate, 0.3f), block);
    };
    Stereo a = moving(128), b = moving(1), c = moving(2048);
    double worst = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - c.right[i]));
    }
    EXPECT(worst < 1.0e-6, "blocks of 1, 128 and 2048 frames give the same audio");
    std::printf("block sizes 1 / 128 / 2048: largest difference %.2e\n", worst);
  }

  // The device sleeps after the tail and wakes on new input.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 24.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, impulse(1.0f, kRate, 0.5f));
    EXPECT(peak(woken.left, 960, 24000) > 0.01, "wakes on new input");
  }

  // Levels: the default patch sits within 3 dB of the dry signal on a held
  // chord, and a long Feedback is not much louder than a short one.
  {
    const size_t n = static_cast<size_t>(6.0f * kRate);
    std::vector<float> held(n, 0.0f);
    const double notes[4] = {146.83, 220.0, 277.18, 369.99};
    for (size_t i = 0; i < n; ++i) {
      double sum = 0.0;
      for (int k = 0; k < 4; ++k) {
        for (int h = 1; h <= 4; ++h) sum += std::sin(2.0 * kPi * notes[k] * h * i / kRate + k) / (h * h);
      }
      held[i] = static_cast<float>(0.1 * sum * std::min(1.0, i / (0.3 * kRate)));
    }
    const double dry = rms(held, 96000, n);
    device.init(kRate);
    Stereo out = run(device, held);
    const double patch = std::sqrt(0.5 * (std::pow(rms(out.left, 96000, n), 2) + std::pow(rms(out.right, 96000, n), 2)));
    EXPECT(std::fabs(db(patch / dry)) < 3.0, "default patch within 3 dB of dry on a held chord");
    double wet_level[2];
    const float feedbacks[2] = {0.2f, 0.95f};
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kFeedback, feedbacks[k]);
      Stereo wet = run(device, held);
      wet_level[k] = rms(wet.left, 192000, n);
    }
    EXPECT(std::fabs(db(wet_level[1] / wet_level[0])) < 7.0, "Feedback is not a volume knob");
    EXPECT(peak(out.left) < 1.0 && peak(out.right) < 1.0, "default patch does not clip on a held chord");
    std::printf("held chord: default patch %+.2f dB re dry, peak %.2f; wet at Feedback 0.95 against 0.2: %+.2f dB\n",
                db(patch / dry), std::max(peak(out.left), peak(out.right)), db(wet_level[1] / wet_level[0]));
  }

  // A held note keeps its level at the default patch. The swarm on a steady
  // tone is a sum of taps, and sweeping them moves that sum; at the default
  // Modulation the sweeps are a few hundredths of a millisecond, so the
  // level stays put instead of fading in and out over seconds.
  {
    // The widest the level strays (100 ms windows, either side) from 4 s on.
    const auto strays = [&](const std::vector<float>& in) {
      device.init(kRate);
      Stereo out = run(device, in);
      double worst = 0.0;
      for (const std::vector<float>* side : {&out.left, &out.right}) {
        double lowest = 1.0e9, highest = -1.0e9;
        for (size_t i = 192000; i + 4800 <= side->size(); i += 2400) {
          const double level = db(rms(*side, i, i + 4800));
          lowest = std::min(lowest, level);
          highest = std::max(highest, level);
        }
        worst = std::max(worst, highest - lowest);
      }
      return worst;
    };
    const auto note = [&](double hz, int harmonics, double gain) {
      std::vector<float> out(static_cast<size_t>(24.0f * kRate));
      for (size_t i = 0; i < out.size(); ++i) {
        double sum = 0.0;
        for (int h = 1; h <= harmonics; ++h) sum += std::sin(2.0 * kPi * hz * h * i / kRate + 0.7 * h) / h;
        out[i] = static_cast<float>(gain * sum * std::min(1.0, i / (0.05 * kRate)));
      }
      return out;
    };
    std::vector<double> sines;
    for (double hz : {110.0, 164.81, 220.0, 329.63, 440.0, 659.26, 880.0}) sines.push_back(strays(note(hz, 1, 0.2)));
    const double worst_sine = *std::max_element(sines.begin(), sines.end());
    std::sort(sines.begin(), sines.end());
    const double rich = strays(note(220.0, 8, 0.15));
    std::vector<float> chord = note(146.83, 4, 0.07);
    for (double hz : {220.0, 277.18, 369.99}) {
      const std::vector<float> more = note(hz, 4, 0.07);
      for (size_t i = 0; i < chord.size(); ++i) chord[i] += more[i];
    }
    const double held_chord = strays(chord);
    EXPECT(sines[3] < 2.5, "held sines: the level strays by under 2.5 dB on the median note");
    EXPECT(worst_sine < 6.0, "held sines: no note fades by 6 dB");
    EXPECT(rich < 3.0, "a held note with harmonics keeps its level within 3 dB");
    EXPECT(held_chord < 3.0, "a held chord keeps its level within 3 dB");
    std::printf("held notes, default patch, level range over 20 s: sines median %.1f dB, worst %.1f dB; "
                "note with harmonics %.1f dB; chord %.1f dB\n",
                sines[3], worst_sine, rich, held_chord);
  }

  // Feedback 1 holds what it was given. A chord is played for 6 s into a
  // long cave and left for 90 s: the level stays, and the low notes are
  // still there at the end (the filters on the return open up towards
  // Feedback 1; left at the knobs they would thin the cave to a narrow band).
  // And a chord held for a minute does not build up on one of its partials
  // (the loop reads are stirred more as Feedback rises).
  {
    const double low[5] = {146.83, 220.0, 277.18, 293.66, 369.99};
    const double high[9] = {440.0, 554.36, 587.32, 660.0, 739.98, 831.54, 880.0, 1109.3, 1479.96};
    // Mean power of one partial over [from, to) seconds, both sides, in half-second windows.
    const auto partial = [&](const Stereo& out, double hz, double from, double to) {
      double sum = 0.0;
      int count = 0;
      for (double t = from; t + 0.5 <= to; t += 0.5, ++count) {
        const size_t a = static_cast<size_t>(t * kRate), b = a + 24000;
        sum += std::pow(tone_level(out.left, hz, kRate, a, b), 2) + std::pow(tone_level(out.right, hz, kRate, a, b), 2);
      }
      return sum / count;
    };
    const auto low_share = [&](const Stereo& out, double from, double to) {
      double below = 0.0, above = 0.0;
      for (double hz : low) below += partial(out, hz, from, to);
      for (double hz : high) above += partial(out, hz, from, to);
      return below / (below + above);
    };
    const auto cave = [&](float chord_seconds, float total_seconds) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kLength, 0.8f);
      device.set_param(p::kBlur, 0.8f);
      device.set_param(p::kFeedback, 1.0f);
      device.set_param(p::kHighCut, 4000.0f);
      device.set_param(p::kLowCut, 150.0f);
      const double notes[4] = {146.83, 220.0, 277.18, 369.99};
      std::vector<float> in(static_cast<size_t>(total_seconds * kRate), 0.0f);
      const size_t n = static_cast<size_t>(chord_seconds * kRate);
      for (size_t i = 0; i < n; ++i) {
        double sum = 0.0;
        for (int k = 0; k < 4; ++k) {
          for (int h = 1; h <= 4; ++h) sum += std::sin(2.0 * kPi * notes[k] * h * i / kRate + 0.7 * h) / h;
        }
        const double fade = std::min(1.0, std::min(i / (0.05 * kRate), (n - i) / (0.05 * kRate)));
        in[i] = static_cast<float>(0.07 * sum * fade);
      }
      return run(device, in);
    };
    Stereo left_alone = cave(6.0f, 96.0f);
    const double early = rms(left_alone.left, 960000, 1440000), late = rms(left_alone.left, 4128000, 4608000);
    const double share_early = low_share(left_alone, 20.0, 30.0), share_late = low_share(left_alone, 86.0, 96.0);
    EXPECT(std::fabs(db(late / early)) < 2.0, "Feedback 1: the cave holds its level for 90 s (within 2 dB)");
    EXPECT(share_late > 0.6 * share_early && share_late > 0.2, "Feedback 1: the low notes of the chord are still there after 90 s");

    Stereo held = cave(60.0f, 60.0f);
    double all = 0.0;
    for (double hz : low) all += partial(held, hz, 40.0, 60.0);
    for (double hz : high) all += partial(held, hz, 40.0, 60.0);
    // The two partials above 1 kHz are 4 % of the chord's power as played.
    const double top = partial(held, 1109.3, 40.0, 60.0) + partial(held, 1479.96, 40.0, 60.0);
    EXPECT(top < 0.15 * all, "Feedback 1: a held chord does not build up on its top partials");
    std::printf("Feedback 1, chord left alone: level at 20..30 s %.1f dB, at 86..96 s %.1f dB; share of the low notes "
                "%.2f then %.2f. Chord held 60 s: the partials above 1 kHz are %.0f %% of the swarm\n",
                db(early), db(late), share_early, share_late, 100.0 * top / all);
  }

  // One bad input sample (not a number, infinite, absurdly large) in the
  // middle of a tone, at Feedback 0.9: the output stays finite and bounded,
  // the level is back to normal two seconds later, and the device still
  // dies away to exact zeros.
  {
    const std::vector<float> tone = sine(330.0f, 4.0f, kRate, 0.25f);
    const auto after_bad = [&](float bad, double* largest, bool* asleep) {
      device.init(kRate);
      device.set_param(p::kFeedback, 0.9f);
      std::vector<float> spoiled = tone;
      spoiled[96000] = bad;
      Stereo out = run(device, spoiled, spoiled);
      Stereo next = run(device, tone);
      *largest = finite(out.left) && finite(out.right) && finite(next.left) && finite(next.right)
                     ? std::max(std::max(peak(out.left), peak(out.right)), std::max(peak(next.left), peak(next.right)))
                     : 1.0e30;
      Stereo rest = render(device, 120.0f, kRate);
      *asleep = peak(rest.left, rest.size() - 48000) == 0.0 && peak(rest.right, rest.size() - 48000) == 0.0;
      return rms(next.left, 96000, next.size());
    };
    double largest = 0.0;
    bool asleep = false;
    const double clean = after_bad(0.25f, &largest, &asleep);
    const float bads[3] = {std::nanf(""), std::numeric_limits<float>::infinity(), -1.0e30f};
    const char* names[3] = {"a NaN", "an infinite", "a 1e30"};
    for (int k = 0; k < 3; ++k) {
      const double level = after_bad(bads[k], &largest, &asleep);
      char label[96];
      std::snprintf(label, sizeof label, "%s input sample: output finite, peak %.2f, level after %+.2f dB", names[k],
                    largest, db(level / clean));
      EXPECT(largest < 4.0 && std::fabs(db(level / clean)) < 1.0, label);
      std::snprintf(label, sizeof label, "%s input sample: the device still falls silent and sleeps", names[k]);
      EXPECT(asleep, label);
    }
  }

  // With Mix at 0 the output is silent while the cave still rings. The
  // device must not fall asleep then with the sound still in its lines: a
  // device that had Mix at 0 through a note and a long silence gives the same
  // output afterwards as one that had Mix at 1 all along.
  {
    Stereo after[2];
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      device.set_param(p::kMix, k == 0 ? 0.0f : 1.0f);
      run(device, sine(330.0f, 2.0f, kRate, 0.25f));
      render(device, 6.0f, kRate);
      device.set_param(p::kMix, 1.0f);
      render(device, 0.1f, kRate);
      after[k] = run(device, impulse(3.0f, kRate, 1.0e-4f));
    }
    const double quiet = rms(after[1].left), hidden = rms(after[0].left);
    EXPECT(std::fabs(db(hidden / quiet)) < 1.0, "Mix 0 does not put the device to sleep with sound still in its lines");
    std::printf("after a note and 6 s of silence: Mix 1 all along %.1f dB, Mix 0 until then %.1f dB\n", db(quiet), db(hidden));
  }

  // The same cave at 44.1 and 96 kHz: times are seconds, not samples.
  for (float rate : {44100.0f, 96000.0f}) {
    bare(device, rate);
    Stereo out = run(device, impulse(1.0f, rate, 1.0f));
    std::vector<size_t> hits = arrivals(out.left, 0.02, rate);
    char label[96];
    std::snprintf(label, sizeof label, "%.0f Hz: fourteen arrivals, the last at Length (%.1f ms)", rate,
                  hits.empty() ? 0.0 : 1000.0 * hits.back() / rate);
    EXPECT(hits.size() == 14 && std::fabs(hits.back() / rate - 0.5) < 0.001, label);

    device.init(rate);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0x5EEDu;
    std::vector<float> burst = noise(0.1f, rate, 0.5f);
    burst.resize(static_cast<size_t>(rate * 12.0f), 0.0f);
    Stereo tail = run(device, burst);
    const double decay = rt60(tail.left, rate, 0.7, 0.2, -80.0);
    std::snprintf(label, sizeof label, "%.0f Hz: RT60 at the default Feedback is %.2f s", rate, decay);
    EXPECT(decay > 5.2 && decay < 7.0, label);

    bare(device, rate);
    device.set_param(p::kSteps, 1.0f);
    device.set_param(p::kGlide, 0.02f);
    run(device, sine(440.0f, 2.0f, rate, 0.25f));
    device.set_param(p::kStretch, 0.3f);
    Stereo bent = render(device, 0.4f, rate);
    const double heard = dominant_frequency(bent.left, rate, 250.0, 1000.0, static_cast<size_t>(0.05f * rate),
                                            static_cast<size_t>(0.2f * rate));
    std::snprintf(label, sizeof label, "%.0f Hz: a step of a fourth is heard as %.2f Hz", rate, heard);
    EXPECT_NEAR(heard / 440.0, 4.0 / 3.0, 0.02 * 4.0 / 3.0, label);
    std::printf("%.0f Hz: last arrival %.1f ms, RT60 %.2f s, fourth %.2f Hz\n", rate,
                hits.empty() ? 0.0 : 1000.0 * hits.back() / rate, decay, heard);
  }

  device.init(kRate);
  device.set_param(p::kFeedback, 0.9f);
  device.set_param(p::kWander, 0.5f);
  device.set_param(p::kModulation, 1.0f);
  device.set_param(p::kBlur, 1.0f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("swarm-reverb", 10.0f, kRate, [&] { run(device, input); });

  return finish("swarm-reverb");
}
