// Native harness for Swarm Reverb (cpp/devices/swarm-reverb). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a swarm of echoes on a
// tape whose speed can be dragged.

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
  d.set_param(p::kReflect, 0.0f);
  d.set_param(p::kDiffuse, 0.0f);
  d.set_param(p::kModulation, 0.0f);
  d.set_param(p::kDampen, 16000.0f);
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

  // At Diffuse 0 an impulse comes back as fourteen separate arrivals per
  // side, the last one at Length x the Drag scale; left and right differ.
  {
    bare(device);
    Stereo out = run(device, impulse(1.0f, kRate, 1.0f));
    std::vector<size_t> left = arrivals(out.left, 0.02);
    std::vector<size_t> right = arrivals(out.right, 0.02);
    EXPECT(left.size() == 14 && right.size() == 14, "Diffuse 0: fourteen arrivals on each side");
    EXPECT_NEAR(left.back() / kRate, 0.5, 0.001, "the last arrival is at Length");
    EXPECT(left.front() / kRate > 0.02 && left.front() / kRate < 0.08,
           "the first arrival is a few hundredths of Length in");
    int shared = 0;
    for (size_t l : left) {
      for (size_t r : right) shared += std::llabs(static_cast<long long>(l) - static_cast<long long>(r)) < 48;
    }
    EXPECT(shared <= 2, "left and right taps sit at different times");

    // Drag scales every arrival together: a quarter of the way down is half
    // an octave of time, three quarters up is half an octave the other way.
    bare(device);
    device.set_param(p::kDrag, 0.25f);
    Stereo shorter = run(device, impulse(1.5f, kRate, 1.0f));
    std::vector<size_t> near = arrivals(shorter.left, 0.02);
    bare(device);
    device.set_param(p::kDrag, 1.0f);
    Stereo longer = run(device, impulse(1.5f, kRate, 1.0f));
    std::vector<size_t> far = arrivals(longer.left, 0.02);
    EXPECT(near.size() == 14 && far.size() == 14, "Drag keeps the fourteen arrivals");
    EXPECT_NEAR(near.back() / kRate, 0.5 * std::pow(2.0, -0.5), 0.001, "Drag 0.25: last arrival at Length / sqrt 2");
    EXPECT_NEAR(far.back() / kRate, 1.0, 0.001, "Drag 1: last arrival at twice Length");
    EXPECT_NEAR(static_cast<double>(near[3]) / left[3], std::pow(2.0, -0.5), 0.005,
                "Drag moves the inner arrivals by the same ratio");
    std::printf("arrivals: 14 + 14, first %.1f ms, last %.1f ms; Drag 0.25 last %.1f ms, Drag 1 last %.1f ms\n",
                1000.0 * left.front() / kRate, 1000.0 * left.back() / kRate, 1000.0 * near.back() / kRate,
                1000.0 * far.back() / kRate);
  }

  // Diffuse blurs the swarm: more of the time between the first and the last
  // arrival carries sound, and the response is less spiky.
  {
    double filled[3], spikiness[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      bare(device);
      device.set_param(p::kDiffuse, settings[k]);
      Stereo out = run(device, impulse(1.0f, kRate, 1.0f));
      filled[k] = occupied(out.left, 0.03, 0.5);
      spikiness[k] = peak(out.left) / rms(out.left, 1440, 24000);
    }
    EXPECT(filled[0] < 0.2 && filled[1] > 2.0 * filled[0] && filled[2] >= filled[1] && filled[2] > 0.8,
           "echo density rises with Diffuse");
    EXPECT(spikiness[2] < 0.6 * spikiness[0], "Diffuse turns separate echoes into a wash");
    std::printf("diffuse 0 / 0.5 / 1: occupied %.2f / %.2f / %.2f, peak over rms %.1f / %.1f / %.1f\n",
                filled[0], filled[1], filled[2], spikiness[0], spikiness[1], spikiness[2]);
  }

  // Reflect sets the decay: the loop takes about 0.47 s at the default
  // Length (0.5 s on the left line, 0.44 s on the right) and loses Reflect on
  // every trip.
  {
    const float settings[3] = {0.3f, 0.6f, 0.9f};
    double decay[3];
    for (int k = 0; k < 3; ++k) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kReflect, settings[k]);
      rng_state() = 0x5EEDu;
      std::vector<float> burst = noise(0.1f, kRate, 0.5f);
      burst.resize(static_cast<size_t>(kRate * 30.0f), 0.0f);
      Stereo out = run(device, burst);
      decay[k] = rt60(out.left, kRate, 0.7, 0.2, -80.0);
      const double expected = -3.0 * 0.47 / std::log10(settings[k]);
      char label[96];
      std::snprintf(label, sizeof label, "Reflect %.1f: RT60 %.2f s, expected about %.2f s", settings[k],
                    decay[k], expected);
      EXPECT(decay[k] > 0.75 * expected && decay[k] < 1.3 * expected, label);
    }
    EXPECT(decay[0] < decay[1] && decay[1] < decay[2], "the decay time rises with Reflect");
    std::printf("RT60 at Reflect 0.3 / 0.6 / 0.9: %.2f / %.2f / %.2f s\n", decay[0], decay[1], decay[2]);
  }

  // Reflect at its top: the cave feeds on itself, holds a steady level and
  // stays dark (the loop's own filters decide what survives).
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kReflect, 1.05f);
    run(device, sine(330.0f, 1.0f, kRate, 0.5f));
    Stereo late = render(device, 60.0f, kRate);
    const size_t n = late.left.size();
    const double level = rms(late.left, n - 96000, n);
    const double earlier = rms(late.left, n - 480000, n - 384000);
    const double top = energy_above(late.left, 4000.0, kRate, n - 96000, n);
    EXPECT(finite(late.left) && finite(late.right), "Reflect 1.05 stays finite");
    EXPECT(peak(late.left) < 1.5 && peak(late.right) < 1.5, "Reflect 1.05 is bounded");
    EXPECT(level > 0.03, "Reflect 1.05 sustains on its own");
    EXPECT(level < 2.0 * earlier, "Reflect 1.05 settles at a level instead of climbing");
    EXPECT(top < 0.02, "Reflect 1.05 is not harsh: under 2 % of its energy above 4 kHz");
    std::printf("Reflect 1.05 after 60 s: rms %.1f dB, peak %.2f, energy above 4 kHz %.4f\n", db(level),
                std::max(peak(late.left), peak(late.right)), top);
  }

  // Drag bends pitch. A 440 Hz tone rings in the swarm; the input stops and
  // Drag moves down, so the tape speeds up and what is on it comes back
  // higher by the ratio of the speeds. The faster the move, the larger the
  // bend heard in the first quarter second.
  {
    const float times[3] = {0.02f, 0.6f, 3.0f};
    double bent[3];
    for (int k = 0; k < 3; ++k) {
      bare(device);
      device.set_param(p::kDragTime, times[k]);
      run(device, sine(440.0f, 2.0f, kRate, 0.25f));
      device.set_param(p::kDrag, 0.25f);
      Stereo out = render(device, 0.5f, kRate);
      bent[k] = dominant_frequency(out.left, kRate, 400.0, 700.0, 2400, 12000);
    }
    EXPECT_NEAR(bent[0] / 440.0, std::sqrt(2.0), 0.02 * std::sqrt(2.0),
                "a fast Drag move of half an octave bends the swarm up by half an octave");
    EXPECT(bent[0] > bent[1] + 20.0 && bent[1] > bent[2] + 5.0 && bent[2] > 441.0,
           "the bend is smaller the slower Drag Time is");
    std::printf("Drag 0.5 -> 0.25, wet pitch in the next 250 ms at Drag Time 0.02 / 0.6 / 3 s: %.1f / %.1f / %.1f Hz\n",
                bent[0], bent[1], bent[2]);

    // With the tone still playing the pitch comes back to 440 Hz once the old
    // sound has left the line.
    bare(device);
    device.set_param(p::kDragTime, 0.02f);
    run(device, sine(440.0f, 2.0f, kRate, 0.25f));
    device.set_param(p::kDrag, 0.25f);
    Stereo out = run(device, sine(440.0f, 3.0f, kRate, 0.25f));
    const double after = dominant_frequency(out.left, kRate, 300.0, 700.0, 96000, 144000);
    EXPECT_NEAR(after, 440.0, 0.5, "the pitch returns to 440 Hz after the move");
  }

  // Steps: Drag lands on sizes a fourth, a fifth or an octave apart, and a
  // move between them is heard as that interval.
  {
    struct Move {
      float drag;
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
      device.set_param(p::kDragTime, 0.02f);
      run(device, sine(440.0f, 2.0f, kRate, 0.25f));
      device.set_param(p::kDrag, move.drag);
      Stereo out = render(device, 0.4f, kRate);
      const double heard = dominant_frequency(out.left, kRate, 250.0, 1000.0, 2400, 9600);
      char label[96];
      std::snprintf(label, sizeof label, "Steps: %s, heard %.2f Hz", move.name, heard);
      EXPECT_NEAR(heard / 440.0, move.ratio, 0.02 * move.ratio, label);
      std::printf("Steps, Drag to %.2f: %.2f Hz, ratio %.4f (expected %.4f)\n", move.drag, heard,
                  heard / 440.0, move.ratio);
    }
    // And the knob snaps: anywhere near the middle is the nominal size.
    bare(device);
    device.set_param(p::kSteps, 1.0f);
    device.set_param(p::kDrag, 0.56f);
    Stereo out = run(device, impulse(1.0f, kRate, 1.0f));
    EXPECT_NEAR(arrivals(out.left, 0.02).back() / kRate, 0.5, 0.001, "Steps snaps Drag to the nearest size");
  }

  // BEHAVIOUR CHECKS 3

  device.init(kRate);
  device.set_param(p::kReflect, 0.9f);
  device.set_param(p::kWander, 0.5f);
  device.set_param(p::kModulation, 1.0f);
  device.set_param(p::kDiffuse, 1.0f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("swarm-reverb", 10.0f, kRate, [&] { run(device, input); });

  return finish("swarm-reverb");
}
