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

  // BEHAVIOUR CHECKS 2

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
