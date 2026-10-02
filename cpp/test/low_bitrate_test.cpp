// Native harness for Low Bitrate (cpp/devices/low-bitrate). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a starving codec.

#include "../devices/low-bitrate/low_bitrate.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::LowBitrate;
namespace p = livemix::low_bitrate;

static LowBitrate device;

static const float kRate = 48000.0f;
static const size_t kLatency = LowBitrate::kLatency;

// The transform alone: nothing lost, no packet events, wet only.
static void clean(LowBitrate& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kLoss, 0.0f);
  d.set_param(p::kMode, 0.0f);
  d.set_param(p::kDropouts, 0.0f);
  d.set_param(p::kStutter, 0.0f);
  d.set_param(p::kSmear, 0.0f);
  d.set_param(p::kStereo, 1.0f);
  d.set_param(p::kHighCut, 20000.0f);
  d.set_param(p::kMix, 1.0f);
}

// RMS of (out delayed by the latency − in), relative to in, in dB.
static double error_db(const std::vector<float>& in, const std::vector<float>& out, size_t from) {
  double error = 0.0, reference = 0.0;
  for (size_t i = from; i + kLatency < out.size(); ++i) {
    const double diff = out[i + kLatency] - static_cast<double>(in[i]);
    error += diff * diff;
    reference += static_cast<double>(in[i]) * in[i];
  }
  return 10.0 * std::log10(error / reference + 1.0e-30);
}

int main() {
  Conformance spec;
  spec.name = "low-bitrate";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // Loss 0, no packet events, Smear 0: the wet path is the input, late by
  // the reported latency, at every Frame setting and sample rate.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (int frame = 0; frame < 3; ++frame) {
      clean(device, rate);
      device.set_param(p::kFrame, static_cast<float>(frame));
      rng_state() = 0x51DEu + frame;
      std::vector<float> left = noise(1.5f, rate, 0.4f), right = noise(1.5f, rate, 0.4f);
      Stereo out = run(device, left, right);
      const double l = error_db(left, out.left, 0), r = error_db(right, out.right, 0);
      std::printf("low-bitrate: %.0f Hz, frame %d: reconstruction error %.1f dB left, %.1f dB right\n", rate, frame,
                  l, r);
      EXPECT(l < -80.0 && r < -80.0, "Loss 0 reconstructs the input after the latency");
      EXPECT(peak(out.left, 0, kLatency) < 1.0e-6, "nothing comes out before the latency");
    }
  }

  // Mix 0 is the input, late by the latency, bit for bit.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0x77u;
    std::vector<float> left = noise(1.0f, kRate, 0.5f), right = noise(1.0f, kRate, 0.5f);
    Stereo out = run(device, left, right);
    double worst = 0.0;
    for (size_t i = 0; i + kLatency < left.size(); ++i) {
      worst = std::max(worst, std::fabs(out.left[i + kLatency] - static_cast<double>(left[i])));
      worst = std::max(worst, std::fabs(out.right[i + kLatency] - static_cast<double>(right[i])));
    }
    EXPECT(worst == 0.0, "Mix 0 is the input delayed by latencySamples, bit for bit");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("low-bitrate", 10.0f, kRate, [&] { run(device, input); });

  return finish("low-bitrate");
}
