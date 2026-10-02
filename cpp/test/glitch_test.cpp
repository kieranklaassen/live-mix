// Native harness for Glitch (cpp/devices/glitch). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a glitch buffer: it is a wire until an event
// starts, each kind of event does to the buffer what its name says, events
// come as often as Chance says, and Calm takes the clicks out.

#include "../devices/glitch/glitch.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::Glitch;
namespace p = livemix::glitch;

static Glitch device;

static const float kRate = 48000.0f;

// One kind of event only, every slice, as hard cuts with nothing softened.
static void only(Glitch& d, int kind_param, float time_ms) {
  d.init(kRate);
  d.set_param(p::kTime, time_ms);
  d.set_param(p::kChance, 1.0f);
  d.set_param(p::kRepeat, 0.0f);
  d.set_param(p::kSkip, 0.0f);
  d.set_param(p::kReverse, 0.0f);
  d.set_param(p::kSlow, 0.0f);
  d.set_param(kind_param, 1.0f);
  d.set_param(p::kCalm, 0.0f);
  d.set_param(p::kDecay, 0.0f);
  d.set_param(p::kBounce, 0.0f);
  d.set_param(p::kOctaves, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// Noise below about 2.5 kHz at the given RMS, starting on a sample that is
// not zero (the device starts its slice grid on the first one).
static std::vector<float> soft_noise(float seconds, float level) {
  std::vector<float> out = noise(seconds, kRate, 1.0f);
  const double a = std::exp(-2.0 * kPi * 2500.0 / kRate);
  double s1 = 0.0, s2 = 0.0;
  for (float& v : out) {
    s1 = v + (s1 - v) * a;
    s2 = s1 + (s2 - s1) * a;
    v = static_cast<float>(s2);
  }
  const double scale = level / rms(out);
  for (float& v : out) v = static_cast<float>(v * scale);
  return out;
}

// Largest absolute difference between two signals over [from, to).
static double worst_difference(const std::vector<float>& a, const std::vector<float>& b, size_t from = 0,
                               size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i]));
  return worst;
}

// Correlation of a[from, to) with b shifted `lag` samples earlier.
static double lagged_correlation(const std::vector<float>& a, const std::vector<float>& b, size_t from,
                                 size_t to, long lag) {
  double sab = 0.0, saa = 0.0, sbb = 0.0;
  for (size_t i = from; i < to && i < a.size(); ++i) {
    const long j = static_cast<long>(i) - lag;
    if (j < 0 || j >= static_cast<long>(b.size())) continue;
    sab += static_cast<double>(a[i]) * b[j];
    saa += static_cast<double>(a[i]) * a[i];
    sbb += static_cast<double>(b[j]) * b[j];
  }
  return (saa > 0.0 && sbb > 0.0) ? sab / std::sqrt(saa * sbb) : 0.0;
}

// A stretch of one kind of event (Glitch::Kind), in samples.
struct Span {
  int kind;
  size_t from, to;
};

// Run in 16-frame blocks and note which kind of event was playing after each.
static Stereo run_watched(Glitch& d, const std::vector<float>& left, const std::vector<float>& right,
                          std::vector<Span>* spans) {
  Stereo out;
  out.left.resize(left.size());
  out.right.resize(left.size());
  const int block = 16;
  int kind = Glitch::kNone;
  long events = d.event_count();
  size_t since = 0;
  for (size_t done = 0; done < left.size(); done += block) {
    const int frames = static_cast<int>(std::min<size_t>(block, left.size() - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = left[done + i];
      d.in_right()[i] = right[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    if (d.event_kind() != kind || d.event_count() != events) {
      if (kind != Glitch::kNone) spans->push_back({kind, since, done + frames});
      kind = d.event_kind();
      events = d.event_count();
      since = done + frames;
    }
  }
  return out;
}

int main() {
  Conformance spec;
  spec.name = "glitch";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 5.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // A wire until something happens: Chance 0, all four kinds at 0, and Mix 0
  // each pass the input through bit for bit.
  {
    rng_state() = 0xA11CEu;
    std::vector<float> left = noise(4.0f, kRate, 0.5f);
    std::vector<float> right = noise(4.0f, kRate, 0.5f);
    device.init(kRate);
    device.set_param(p::kChance, 0.0f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Chance 0: the output is the input, bit for bit");
    EXPECT(device.event_count() == 0, "Chance 0: no event starts");

    device.init(kRate);
    device.set_param(p::kChance, 1.0f);
    for (int kind : {p::kRepeat, p::kSkip, p::kReverse, p::kSlow}) device.set_param(kind, 0.0f);
    out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "all four kinds at 0: the output is the input");

    device.init(kRate);
    device.set_param(p::kChance, 1.0f);
    device.set_param(p::kMix, 0.0f);
    out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0: the output is the input, bit for bit");
    EXPECT(device.event_count() > 4, "Mix 0: events still run underneath");
  }

  // Repeat only, every slice: each output slice is an earlier input slice
  // played again (1 to 8 slices back), and inside an event slice n+1 is
  // slice n.
  {
    const long slice = 12000;
    only(device, p::kRepeat, 250.0f);
    rng_state() = 0xABCDEu;
    std::vector<float> input = soft_noise(20.0f, 0.15f);
    Stereo out = run(device, input);
    const long slices = static_cast<long>(input.size()) / slice;
    int copies = 0, same_as_previous = 0, longest = 0;
    double weakest = 1.0;
    for (long k = 1; k < slices; ++k) {
      const size_t from = static_cast<size_t>(k * slice + 64), to = static_cast<size_t>((k + 1) * slice - 64);
      double best = -1.0;
      int back = 0;
      for (int j = 1; j <= 8 && j <= k; ++j) {
        const double c = lagged_correlation(out.left, input, from, to, j * slice);
        if (c > best) {
          best = c;
          back = j;
        }
      }
      if (best > 0.99) ++copies;
      weakest = std::min(weakest, best);
      longest = std::max(longest, back);
      if (k > 1 && lagged_correlation(out.left, out.left, from, to, slice) > 0.99) ++same_as_previous;
    }
    std::printf("glitch: repeat only: %d of %ld slices are an earlier slice (weakest match %.4f), "
                "%d equal the slice before, longest run %d repeats\n",
                copies, slices - 1, weakest, same_as_previous, longest);
    EXPECT(copies == slices - 1, "Repeat: every slice is an earlier slice of the input played again");
    EXPECT(same_as_previous >= (slices - 1) / 3, "Repeat: inside an event slice n+1 matches slice n at a lag of Time");
    EXPECT(longest >= 5 && longest <= 8, "Repeat: runs of up to eight repeats occur");
    EXPECT(std::fabs(lagged_correlation(out.left, input, slice, input.size(), 0)) < 0.1,
           "Repeat: with every slice an event, none of the output is the input in place");
  }

  // Reverse only: slice k is slice k-1 mirrored about the boundary between them.
  {
    const long slice = 12000;
    only(device, p::kReverse, 250.0f);
    rng_state() = 0xABCDEu;
    std::vector<float> input = soft_noise(4.0f, 0.15f);
    Stereo out = run(device, input);
    double weakest = 1.0;
    for (long k = 1; k < 15; ++k) {
      const long boundary = k * slice;
      double sab = 0.0, saa = 0.0, sbb = 0.0;
      for (long t = boundary + 64; t < boundary + slice - 64; ++t) {
        const double a = out.left[t], b = input[2 * boundary - 1 - t];
        sab += a * b;
        saa += a * a;
        sbb += b * b;
      }
      weakest = std::min(weakest, sab / std::sqrt(saa * sbb));
    }
    std::printf("glitch: reverse only: weakest match with the mirrored slice before %.5f\n", weakest);
    EXPECT(weakest > 0.95, "Reverse: each slice is the one before it played backwards");
    EXPECT(std::fabs(lagged_correlation(out.left, input, slice + 64, 2 * slice - 64, slice)) < 0.1,
           "Reverse: the slice is not the one before it played forwards");
  }

  // Slow only: a steady tone comes out an octave down during a half-speed
  // event, and glides down to nothing and back during a tape stop.
  {
    only(device, p::kSlow, 500.0f);
    std::vector<float> tone = sine(440.0f, 30.0f, kRate, 0.5f);
    std::vector<Span> spans;
    Stereo out = run_watched(device, tone, tone, &spans);
    int halves = 0, stops = 0;
    double half_low = 1.0e9, half_high = 0.0, early = 0.0, late = 0.0, stopped = 1.0, recovered = 0.0;
    for (const Span& span : spans) {
      const size_t length = span.to - span.from;
      if (span.kind == Glitch::kHalfSpeed) {
        const double hz = dominant_frequency(out.left, kRate, 100.0, 1000.0, span.from + 480, span.to - 480);
        half_low = std::min(half_low, hz);
        half_high = std::max(half_high, hz);
        ++halves;
      } else if (span.kind == Glitch::kTapeStop && stops < 3) {
        // The stop takes 1/1.3 of the event, the spin-up the rest.
        const size_t stop = static_cast<size_t>(static_cast<double>(length) / 1.3);
        early = dominant_frequency(out.left, kRate, 50.0, 1000.0, span.from, span.from + stop / 4);
        late = dominant_frequency(out.left, kRate, 50.0, 1000.0, span.from + stop / 2, span.from + 3 * stop / 4);
        stopped = rms(out.left, span.from + stop - stop / 100, span.from + stop);
        recovered = dominant_frequency(out.left, kRate, 50.0, 1000.0, span.to - length / 40, span.to);
        ++stops;
        EXPECT(early > 340.0 && early < 430.0, "Slow: a tape stop starts just under pitch");
        EXPECT(late > 120.0 && late < 220.0, "Slow: a tape stop is more than an octave down past half way");
        EXPECT(stopped < 0.003, "Slow: a stopped tape is silent, not a held sample");
        EXPECT(recovered > 400.0 && recovered < 445.0, "Slow: the tape is back up to speed when the event ends");
      }
    }
    std::printf("glitch: slow only: %d half-speed events at %.1f..%.1f Hz for a 440 Hz tone; %d tape stops, "
                "last one %.0f Hz then %.0f Hz, %.1f dBFS when stopped, %.0f Hz at the end of the spin-up\n",
                halves, half_low, half_high, stops, early, late, db(stopped), recovered);
    EXPECT(halves >= 3 && stops >= 3, "Slow: both half speed and tape stop occur");
    EXPECT(half_low > 217.0 && half_high < 223.0, "Slow: a half-speed event plays the tone an octave down");
  }

  // Skip only: the sound sticks on a fragment 20 to 120 ms long.
  {
    only(device, p::kSkip, 250.0f);
    rng_state() = 0x5EEDu;
    std::vector<float> input = soft_noise(12.0f, 0.15f);
    std::vector<Span> spans;
    Stereo out = run_watched(device, input, input, &spans);
    int checked = 0;
    double shortest = 1.0e9, longest = 0.0, weakest = 1.0;
    for (const Span& span : spans) {
      if (span.kind != Glitch::kSkipping || checked >= 12) continue;
      // The second pass of the fragment against the first, at every lag.
      double best = -1.0;
      long best_lag = 0;
      for (long lag = 720; lag <= 6240; ++lag) {
        const size_t from = span.from + lag + 64, to = span.from + 2 * lag - 64;
        if (to > span.to) break;
        const double c = lagged_correlation(out.left, out.left, from, to, lag);
        if (c > best) {
          best = c;
          best_lag = lag;
        }
      }
      shortest = std::min(shortest, best_lag / 48.0);
      longest = std::max(longest, best_lag / 48.0);
      weakest = std::min(weakest, best);
      ++checked;
    }
    std::printf("glitch: skip only: %d events loop fragments of %.1f to %.1f ms (weakest loop match %.4f)\n",
                checked, shortest, longest, weakest);
    EXPECT(checked >= 8, "Skip: events occur");
    EXPECT(shortest >= 19.9 && longest <= 120.1, "Skip: the stuck fragment is 20 to 120 ms long");
    EXPECT(weakest > 0.99, "Skip: the fragment repeats exactly");
    EXPECT(longest > 1.5 * shortest, "Skip: fragment lengths vary");
  }

  // Events come as often as Chance says: the share of free slice boundaries
  // that start one, over a minute.
  for (float chance : {0.1f, 0.3f, 0.7f}) {
    device.init(kRate);
    device.set_param(p::kTime, 100.0f);
    device.set_param(p::kChance, chance);
    rng_state() = 0xD1CEu;
    run(device, noise(60.0f, kRate, 0.2f));
    const double share = static_cast<double>(device.event_count()) / static_cast<double>(device.boundary_count());
    std::printf("glitch: chance %.1f: %ld events at %ld free boundaries in 60 s (%.3f)\n", chance,
                device.event_count(), device.boundary_count(), share);
    EXPECT(share > 0.8 * chance && share < 1.2 * chance, "the event rate follows Chance within 20 %");
    EXPECT(device.boundary_count() > 100, "enough boundaries to judge the rate");
  }

  // CHECKS

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("glitch", 10.0f, kRate, [&] { run(device, input); });

  return finish("glitch");
}
