// Native harness for Echo Memory (cpp/devices/echo-memory). After the
// conformance pass it asserts what makes it an echo with a memory: the echo
// voice is a plain delay, the memory voice reaches back past a silence but
// never past Reach, prefers moments with sound, plays them back cleanly at
// half speed or backwards, and the whole device comes to rest.

#include "../devices/echo-memory/echo_memory.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::EchoMemory;
namespace p = livemix::echo_memory;

static EchoMemory device;

static const float kRate = 48000.0f;

// Sample index of the largest magnitude in [from, to).
static size_t peak_index(const std::vector<float>& x, size_t from, size_t to) {
  size_t best = from;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

// Echo voice only, wet only, nothing crossed, loop wide open.
static void echo_only(EchoMemory& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMemory, 0.0f);
  d.set_param(p::kEcho, 1.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kMix, 1.0f);
}

// CHECK-HELPERS

int main() {
  Conformance spec;
  spec.name = "echo-memory";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // Default Reach (20 s) plus Size (2 s) plus a block of the activity map.
  spec.tail_seconds = 23.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // Memory 0 is a plain delay: repeats at Time, each down by Feedback.
  {
    echo_only(device);
    device.set_param(p::kTime, 250.0f);
    device.set_param(p::kFeedback, 0.5f);
    Stereo out = run(device, impulse(1.0f, kRate, 0.25f));
    const size_t first = peak_index(out.left, 6000, 18000);
    const size_t second = peak_index(out.left, 18000, 30000);
    std::printf("echo: first repeat at %zu, second at %zu, ratio %.3f\n", first, second,
                std::fabs(out.left[second]) / std::fabs(out.left[first]));
    EXPECT(std::llabs(static_cast<long long>(first) - 12000) <= 2, "first repeat lands at Time");
    EXPECT(std::llabs(static_cast<long long>(second) - 24000) <= 3, "second repeat lands at 2x Time");
    const double ratio = std::fabs(out.left[second]) / std::fabs(out.left[first]);
    EXPECT(ratio > 0.38 && ratio < 0.52, "each repeat is scaled by Feedback");
  }

  // CHECKS

  return finish("echo-memory");
}
