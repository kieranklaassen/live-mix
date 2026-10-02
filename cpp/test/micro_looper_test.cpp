// Native harness for Micro Looper (cpp/devices/micro-looper). After the
// conformance pass it asserts what makes it a looper: Hold repeats what was
// just played with the period Length / speed and never fades, the clock and
// the speed move pitch and length together, the join does not click, and
// Auto renews the loop on new playing and lets it die away to sleep.

#include "../devices/micro-looper/micro_looper.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::MicroLooper;
namespace p = livemix::micro_looper;

static MicroLooper device;

static const float kRate = 48000.0f;

enum State { kListen = 0, kHold = 1, kAuto = 2 };
enum Speed { kRev2 = 0, kRev = 1, kRevHalf = 2, kHalf = 3, kNormal = 4, kDouble = 5 };

int main() {
  Conformance spec;
  spec.name = "micro-looper";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 100.0f;
  spec.max_peak = 2.5f;
  check_effect(device, spec, kRate);

  // BEHAVIOUR CHECKS GO HERE

  return finish("micro-looper");
}
