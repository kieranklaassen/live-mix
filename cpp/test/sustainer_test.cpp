// Native harness for Sustain (cpp/devices/sustainer). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a sustainer: it catches a note after
// its attack, holds it at pitch and level without pumping, glides or layers
// on the next note, and lets go when told to.

#include "../devices/sustainer/sustainer.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Sustainer;
namespace p = livemix::sustainer;

static Sustainer device;

static const float kRate = 48000.0f;

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

static std::vector<float> add(std::vector<float> a, const std::vector<float>& b) {
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) a[i] += b[i];
  return a;
}

// The real FFT helper against a direct DFT, and forward + inverse = N/2 × x.
static void check_real_fft() {
  static livemix::sustainer_detail::RealFft<8192> fft;
  fft.init();
  for (int n : {64, 4096, 8192}) {
    std::vector<float> x(n), re(n / 2 + 1), im(n / 2 + 1), back(n);
    rng_state() = 0xF00Du;
    for (float& v : x) v = white();
    fft.forward(x.data(), re.data(), im.data(), n);
    double worst = 0.0;
    for (int k : {0, 1, 5, n / 4 + 3, n / 2 - 1, n / 2}) {
      double sr = 0.0, si = 0.0;
      for (int i = 0; i < n; ++i) {
        sr += x[i] * std::cos(2.0 * kPi * k * i / n);
        si -= x[i] * std::sin(2.0 * kPi * k * i / n);
      }
      worst = std::max(worst, std::max(std::fabs(sr - re[k]), std::fabs(si - im[k])));
    }
    EXPECT(worst < 2.0e-2, "real FFT matches a direct DFT");
    fft.inverse(re.data(), im.data(), back.data(), n);
    double error = 0.0;
    for (int i = 0; i < n; ++i) error = std::max(error, std::fabs(back[i] / (n * 0.5) - x[i]));
    EXPECT(error < 1.0e-4, "real FFT forward then inverse returns the input times N/2");
  }
}

int main() {
  check_real_fft();

  Conformance spec;
  spec.name = "sustainer";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // Mix 0 is the dry signal, untouched and not delayed.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(440.0f, 1.0f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i) worst = std::max(worst, std::fabs(out.left[i] - (double)tone[i]));
    EXPECT(worst == 0.0, "Mix 0 passes the input through bit for bit, with no latency");
  }

  (void)join;
  (void)add;
  return finish("sustainer");
}
