// Native harness for Sift (cpp/devices/sift). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a three-way split: what each part keeps and
// what it gives up, that the parts add back up, and what each blur does to
// its own part and to no other.

#include "../devices/sift/sift.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Sift;
namespace p = livemix::sift;

static Sift device;

static const float kRate = 48000.0f;
static const size_t kLatency = Sift::kLatency;

int main() {
  Conformance spec;
  spec.name = "sift";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 2.01f;
  check_effect(device, spec, kRate);
  return finish("sift");
}
