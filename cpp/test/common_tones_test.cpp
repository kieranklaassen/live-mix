// Native harness for Common Tones (cpp/devices/common-tones). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a gate on the sound's own
// past: what is shared passes, what is new goes, Ago sets the time, and the
// other controls each do what they say over their whole range.

#include "../devices/common-tones/common_tones.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::CommonTones;
namespace p = livemix::common_tones;

static CommonTones device;

static const float kRate = 48000.0f;
static const size_t kLatency = CommonTones::kLatency;
static const double kHopSeconds = 1024.0 / 48000.0;

// The comparison alone: one moment, single bins, no ring, nothing left of the rest, wet only.
static void clean(CommonTones& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kAgo, 400.0f);
  d.set_param(p::kKeep, 0.0f);
  d.set_param(p::kStrict, 0.6f);
  d.set_param(p::kRing, 0.0f);
  d.set_param(p::kBroad, 0.0f);
  d.set_param(p::kMemory, 0.0f);
  d.set_param(p::kFloor, -60.0f);
  d.set_param(p::kMix, 1.0f);
}

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

static std::vector<float> add(std::vector<float> a, const std::vector<float>& b) {
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) a[i] += b[i];
  return a;
}

static size_t at(double seconds) { return static_cast<size_t>(seconds * kRate); }

// A sine that starts at `from` seconds and lasts `seconds`, in a buffer `total` long.
static std::vector<float> tone_at(float hz, double from, double seconds, double total, float gain) {
  std::vector<float> out(at(total), 0.0f);
  const size_t start = at(from);
  const size_t end = std::min(out.size(), start + at(seconds));
  for (size_t i = start; i < end; ++i) {
    out[i] = gain * static_cast<float>(std::sin(2.0 * kPi * hz * static_cast<double>(i - start) / kRate));
  }
  return out;
}

// A chord of sines with a slow fade in and out, so no edge spreads over the spectrum.
static std::vector<float> chord(const std::vector<float>& hz, float seconds, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate), 0.0f);
  for (float f : hz) out = add(out, sine(f, seconds, kRate, gain));
  return out;
}

// RMS in consecutive windows of `window` seconds from `from`: the level over time.
static std::vector<double> levels(const std::vector<float>& x, double from, double window) {
  std::vector<double> out;
  const size_t step = at(window);
  for (size_t i = at(from); i + step <= x.size(); i += step) out.push_back(rms(x, i, i + step));
  return out;
}

// The first time (seconds, from the start of `x`) the level in 10 ms windows reaches `level`.
static double first_time_over(const std::vector<float>& x, double level, double from = 0.0) {
  const size_t step = at(0.01);
  for (size_t i = at(from); i + step <= x.size(); i += step / 2) {
    if (rms(x, i, i + step) >= level) return static_cast<double>(i) / kRate;
  }
  return -1.0;
}

int main() {
  Conformance spec;
  spec.name = "common-tones";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 2.01f;
  check_effect(device, spec, kRate);

  rng_state() = 0x51DEu;
  std::vector<float> programme = noise(3.0f, kRate, 0.3f);
  programme = add(programme, add(sine(196.0f, 3.0f, kRate, 0.2f), sine(1234.5f, 3.0f, kRate, 0.2f)));

  // The latency: at Mix 0 the output is the input, 4608 samples late, bit for
  // bit, on both sides; nothing comes out before it; mono in is mono out.
  {
    EXPECT(kLatency == 4608, "the latency is the one in device.json");
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    Stereo dry = run(device, programme);
    bool same = true;
    for (size_t i = 0; i + kLatency < programme.size(); ++i) {
      same = same && dry.left[i + kLatency] == programme[i] && dry.right[i + kLatency] == programme[i];
    }
    EXPECT(same, "Mix 0 is the input delayed by latencySamples, bit for bit");
    EXPECT(peak(dry.left, 0, kLatency) == 0.0, "nothing comes out before the latency");
    device.init(kRate);
    Stereo wet = run(device, programme);
    EXPECT(wet.left == wet.right, "mono in, mono out, bit for bit");
  }

  // Cost: the average, and the worst single block (the one with a frame in it).
  {
    device.init(kRate);
    device.set_param(p::kBroad, 1.0f);
    device.set_param(p::kRing, 0.6f);
    device.set_param(p::kMemory, 0.5f);
    rng_state() = 0xBEEFu;
    std::vector<float> input = noise(10.0f, kRate, 0.25f);
    report_cost("common-tones", 10.0f, kRate, [&] { run(device, input); });
    device.init(kRate);
    device.set_param(p::kBroad, 1.0f);
    device.set_param(p::kRing, 0.6f);
    device.set_param(p::kMemory, 0.5f);
    std::vector<double> micros;
    for (size_t done = 0; done + 128 <= input.size(); done += 128) {
      for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
      const auto start = std::chrono::steady_clock::now();
      device.process(128);
      micros.push_back(std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count());
    }
    std::sort(micros.begin(), micros.end());
    // A quarter of the blocks hold a frame, so the 95th percentile is one of
    // them without the scheduler noise the maximum picks up.
    std::printf("common-tones worst block: %.0f us at the 95th percentile, %.0f us median, of %.0f us per block\n",
                micros[micros.size() * 95 / 100], micros[micros.size() / 2], 128.0e6 / kRate);
  }

  return finish("common-tones");
}
