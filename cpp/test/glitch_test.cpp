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

  // Calm: on a full-scale 200 Hz sine with every kind of event going, Calm 1
  // leaves the steepest step close to the sine's own, and the splatter above
  // 10 kHz is far below what the hard cuts of Calm 0 make.
  {
    std::vector<float> tone = sine(200.0f, 20.0f, kRate, 1.0f);
    const double own_step = 2.0 * kPi * 200.0 / kRate;
    double step[2], high_db[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kTime, 120.0f);
      device.set_param(p::kChance, 1.0f);
      device.set_param(p::kCalm, pass == 0 ? 0.0f : 1.0f);
      device.set_param(p::kDecay, 0.0f);
      device.set_param(p::kSpread, 0.0f);
      Stereo out = run(device, tone);
      step[pass] = max_step(out.left);
      livemix::kit::Biquad high[3];
      for (auto& stage : high) stage.set_highpass(10000.0f, 0.7071f, kRate);
      std::vector<float> top(out.left.size());
      for (size_t i = 0; i < top.size(); ++i) {
        top[i] = high[2].process(high[1].process(high[0].process(out.left[i])));
      }
      high_db[pass] = db(rms(top, 4800));
      EXPECT(device.event_count() > 40, "Calm: events are happening");
    }
    std::printf("glitch: 200 Hz sine, steepest step: Calm 0 %.4f, Calm 1 %.4f (the sine's own %.4f); "
                "above 10 kHz: Calm 0 %.1f dB, Calm 1 %.1f dB\n",
                step[0], step[1], own_step, high_db[0], high_db[1]);
    EXPECT(step[0] > 10.0 * own_step, "Calm 0: events are hard cuts");
    EXPECT(step[1] < 1.3 * own_step, "Calm 1: no clicks, the steepest step stays close to the sine's own");
    EXPECT(high_db[1] < high_db[0] - 20.0, "Calm 1: at least 20 dB less energy above 10 kHz than Calm 0");
  }

  // The same input gives the same output: on a second run, and whatever the
  // block size (1, 128, 2048), with all kinds of event and octaves going.
  {
    rng_state() = 0xFACEu;
    std::vector<float> input = soft_noise(6.0f, 0.2f);
    Stereo renders[4];
    const int blocks[4] = {128, 128, 1, 2048};
    for (int pass = 0; pass < 4; ++pass) {
      device.init(kRate);
      device.set_param(p::kTime, 90.0f);
      device.set_param(p::kChance, 0.6f);
      device.set_param(p::kOctaves, 0.5f);
      device.set_param(p::kBounce, 0.5f);
      device.set_param(p::kSpread, 1.0f);
      renders[pass] = run(device, input, input, blocks[pass]);
    }
    EXPECT(renders[1].left == renders[0].left && renders[1].right == renders[0].right,
           "two runs give the same output, bit for bit");
    const double by_one = std::max(worst_difference(renders[2].left, renders[0].left),
                                   worst_difference(renders[2].right, renders[0].right));
    const double by_2048 = std::max(worst_difference(renders[3].left, renders[0].left),
                                    worst_difference(renders[3].right, renders[0].right));
    std::printf("glitch: block size 1 against 128: max difference %g; 2048 against 128: %g\n", by_one, by_2048);
    EXPECT(by_one < 1.0e-6 && by_2048 < 1.0e-6, "the output does not depend on the block size");
    EXPECT(worst_difference(renders[0].left, input) > 0.05, "and events did happen in it");
  }

  // After the input stops, the device plays out what it had started and goes
  // exactly silent: within reach of the last slice plus the longest event.
  for (float time_ms : {250.0f, 2000.0f}) {
    device.init(kRate);
    device.set_param(p::kTime, time_ms);
    device.set_param(p::kChance, 1.0f);
    rng_state() = 0x7A11u;
    run(device, noise(4.0f, kRate, 0.3f));
    Stereo tail = render(device, 12.0f, kRate);
    size_t last = 0;
    for (size_t i = 0; i < tail.size(); ++i) {
      if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
    }
    const double seconds = static_cast<double>(last) / kRate;
    // Reach: Time + 0.3 s. Longest event: 8 repeats, at most 7 s.
    const double limit = time_ms * 0.001 + 0.3 + std::min(7.0, 8.0 * time_ms * 0.001) + 0.1;
    std::printf("glitch: Time %.0f ms, Chance 1: silent %.2f s after the input stops (limit %.2f s)\n",
                time_ms, seconds, limit);
    EXPECT(seconds > 0.0 && seconds < limit, "the tail ends within the last slice plus the longest event");
    Stereo woken = run(device, noise(1.0f, kRate, 0.3f));
    EXPECT(rms(woken.left) > 0.1, "wakes on new input");
  }

  // Decay: each repeat is quieter and darker than the one before.
  {
    only(device, p::kRepeat, 200.0f);
    device.set_param(p::kDecay, 1.0f);
    rng_state() = 0xDECAu;
    std::vector<float> input = noise(20.0f, kRate, 0.2f);
    std::vector<Span> spans;
    Stereo out = run_watched(device, input, input, &spans);
    auto low_rms = [](const std::vector<float>& x, size_t from, size_t to) {
      const double a = std::exp(-2.0 * kPi * 600.0 / kRate);
      double s = 0.0, sum = 0.0;
      for (size_t i = from; i < to; ++i) {
        s = x[i] + (s - x[i]) * a;
        sum += s * s;
      }
      return std::sqrt(sum / static_cast<double>(to - from));
    };
    int judged = 0;
    double drop1 = 0.0, drop2 = 0.0, bright0 = 0.0, bright2 = 0.0;
    for (const Span& span : spans) {
      if (span.to - span.from < 3 * 9600 - 64) continue;
      const size_t a = span.from + 480, n = 9600 - 960;
      const double level0 = low_rms(out.left, a, a + n);
      drop1 += db(low_rms(out.left, a + 9600, a + 9600 + n) / level0);
      drop2 += db(low_rms(out.left, a + 19200, a + 19200 + n) / level0);
      bright0 += energy_above(out.left, 4000.0, kRate, a, a + n);
      bright2 += energy_above(out.left, 4000.0, kRate, a + 19200, a + 19200 + n);
      ++judged;
    }
    drop1 /= judged;
    drop2 /= judged;
    std::printf("glitch: Decay 1 over %d events: second repeat %.1f dB, third %.1f dB below the first (under 600 Hz); "
                "share of energy above 4 kHz %.3f then %.3f\n",
                judged, drop1, drop2, bright0 / judged, bright2 / judged);
    EXPECT(judged >= 5, "Decay: events of three repeats or more occur");
    EXPECT(drop1 < -5.0 && drop1 > -7.5, "Decay 1: each repeat is about 6 dB quieter");
    EXPECT(drop2 < -11.0 && drop2 > -14.5, "Decay 1: and the next one 6 dB quieter again");
    EXPECT(bright2 < 0.5 * bright0, "Decay 1: later repeats are darker");
  }

  // Octaves: every repeat of a 440 Hz tone comes out at 880 or 220 Hz, in
  // the same time; and a tone in the top octave does not fold down when it
  // is played at double speed.
  {
    only(device, p::kRepeat, 400.0f);
    device.set_param(p::kOctaves, 1.0f);
    std::vector<float> tone = sine(440.0f, 30.0f, kRate, 0.5f);
    std::vector<Span> spans;
    Stereo out = run_watched(device, tone, tone, &spans);
    int ups = 0, downs = 0, others = 0;
    for (const Span& span : spans) {
      for (size_t at = span.from; at + 19200 <= span.to + 64; at += 19200) {
        const double hz = dominant_frequency(out.left, kRate, 100.0, 2000.0, at + 480, at + 19200 - 480);
        if (std::fabs(hz - 880.0) < 3.0) {
          ++ups;
        } else if (std::fabs(hz - 220.0) < 3.0) {
          ++downs;
        } else {
          ++others;
        }
      }
    }
    std::printf("glitch: Octaves 1: %d repeats at 880 Hz, %d at 220 Hz, %d elsewhere\n", ups, downs, others);
    EXPECT(ups >= 8 && downs >= 8 && others == 0, "Octaves 1: every repeat is an octave up or an octave down");

    only(device, p::kRepeat, 400.0f);
    device.set_param(p::kOctaves, 1.0f);
    std::vector<float> top = sine(17000.0f, 30.0f, kRate, 0.5f);
    out = run(device, top);
    double folded = 0.0;
    for (size_t at = 19200; at + 9600 <= out.size(); at += 9600) {
      folded = std::max(folded, tone_level(out.left, 14000.0, kRate, at, at + 9600));
    }
    std::printf("glitch: a 17 kHz tone at double speed folds to 14 kHz at %.1f dB re the tone\n", db(folded / 0.5));
    EXPECT(db(folded / 0.5) < -40.0, "Octave up: the top octave is filtered out, not aliased");
  }

  // Spread: with a mono input, Spread 0 keeps the two channels identical;
  // Spread 1 lands events on both sides; the default patch stays well
  // correlated and loses little when summed to mono.
  {
    rng_state() = 0x5EAu;
    std::vector<float> input = soft_noise(30.0f, 0.15f);
    only(device, p::kRepeat, 200.0f);
    Stereo centred = run(device, input);
    EXPECT(centred.left == centred.right, "Spread 0: a mono input stays mono");

    only(device, p::kRepeat, 200.0f);
    device.set_param(p::kSpread, 1.0f);
    std::vector<Span> spans;
    Stereo wide = run_watched(device, input, input, &spans);
    int lefts = 0, rights = 0;
    double furthest = 0.0, nearest = 100.0;
    for (const Span& span : spans) {
      const double tilt = db(rms(wide.right, span.from + 96, span.to - 96) / rms(wide.left, span.from + 96, span.to - 96));
      (tilt < 0.0 ? lefts : rights) += 1;
      furthest = std::max(furthest, std::fabs(tilt));
      nearest = std::min(nearest, std::fabs(tilt));
    }
    std::printf("glitch: Spread 1: %d events to the left, %d to the right, level difference %.1f to %.1f dB\n",
                lefts, rights, nearest, furthest);
    EXPECT(lefts >= 10 && rights >= 10, "Spread 1: events land on both sides");
    EXPECT(nearest > 3.0 && furthest > 20.0, "Spread 1: from clearly off centre to hard over");

    device.init(kRate);
    Stereo normal = run(device, input);
    std::vector<float> mono(input.size());
    for (size_t i = 0; i < mono.size(); ++i) mono[i] = 0.5f * (normal.left[i] + normal.right[i]);
    const double together = correlation(normal.left, normal.right);
    const double mono_db = db(rms(mono) / rms(input));
    const double side_db = db(rms(normal.left) / rms(input));
    std::printf("glitch: default patch on a mono input: L/R correlation %.3f, left %.2f dB, mono sum %.2f dB re input\n",
                together, side_db, mono_db);
    EXPECT(together > 0.8, "default patch: the channels stay correlated");
    EXPECT(mono_db > -3.0 && mono_db < 1.0, "default patch: little is lost in mono");
    EXPECT(side_db > -3.0 && side_db < 3.0, "default patch: within 3 dB of the dry level");
  }

  // Bounce: each repeat is shorter than the last by the same ratio. A click
  // near the start of every slice comes back at shrinking intervals.
  {
    only(device, p::kRepeat, 400.0f);
    device.set_param(p::kBounce, 1.0f);
    std::vector<float> clicks(static_cast<size_t>(40.0f * kRate), 0.0f);
    clicks[0] = 1.0e-3f;  // starts the slice grid
    for (size_t at = 100; at < clicks.size(); at += 19200) clicks[at] = 0.5f;
    std::vector<Span> spans;
    Stereo out = run_watched(device, clicks, clicks, &spans);
    int judged = 0;
    double low = 10.0, high = 0.0;
    for (const Span& span : spans) {
      std::vector<size_t> hits;
      for (size_t i = span.from > 16 ? span.from - 16 : 0; i < span.to && i < out.size(); ++i) {
        if (std::fabs(out.left[i]) > 0.25f) hits.push_back(i);
      }
      // Gaps follow 0.55 until the repeats reach their 8 ms floor.
      for (size_t k = 2; k < hits.size(); ++k) {
        const double before = static_cast<double>(hits[k - 1] - hits[k - 2]);
        const double gap = static_cast<double>(hits[k] - hits[k - 1]);
        if (gap < 0.012 * kRate) break;
        low = std::min(low, gap / before);
        high = std::max(high, gap / before);
        ++judged;
      }
    }
    std::printf("glitch: Bounce 1: %d gaps between repeats, each %.3f to %.3f of the one before\n", judged, low, high);
    EXPECT(judged >= 15, "Bounce: runs of shrinking repeats occur");
    EXPECT(low > 0.53 && high < 0.57, "Bounce 1: each repeat is 0.55 of the last");
  }

  // Moving Mix or Time while events play does not click (Calm 1, 200 Hz sine).
  {
    std::vector<float> tone = sine(200.0f, 0.25f, kRate, 1.0f);
    const double own_step = 2.0 * kPi * 200.0 / kRate;
    device.init(kRate);
    device.set_param(p::kTime, 120.0f);
    device.set_param(p::kChance, 1.0f);
    device.set_param(p::kCalm, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    Stereo all = run(device, sine(200.0f, 1.0f, kRate, 1.0f));
    double phase = 2.0 * kPi * 200.0;  // the tone carries on in phase
    for (int move = 0; move < 60; ++move) {
      device.set_param(p::kMix, move % 2 == 0 ? 0.0f : 1.0f);
      device.set_param(p::kTime, move % 3 == 0 ? 40.0f : (move % 3 == 1 ? 700.0f : 150.0f));
      for (size_t i = 0; i < tone.size(); ++i) {
        tone[i] = static_cast<float>(std::sin(phase));
        phase += 2.0 * kPi * 200.0 / kRate;
      }
      all = concat(all, run(device, tone));
    }
    std::printf("glitch: Mix and Time jumping every 250 ms, Calm 1: steepest step %.4f (the sine's own %.4f)\n",
                max_step(all.left), own_step);
    EXPECT(max_step(all.left) < 1.5 * own_step, "Mix and Time changes do not click");
    EXPECT(device.event_count() > 30, "events were playing while the controls moved");
  }

  // Times are in seconds, not samples: at 44.1 and 96 kHz a 250 ms slice
  // comes back 250 ms later, and a tape stop takes as long.
  for (float rate : {44100.0f, 96000.0f}) {
    const long slice = static_cast<long>(0.25f * rate + 0.5f);
    device.init(rate);
    for (int kind : {p::kSkip, p::kReverse, p::kSlow}) device.set_param(kind, 0.0f);
    device.set_param(p::kChance, 1.0f);
    device.set_param(p::kCalm, 0.0f);
    device.set_param(p::kDecay, 0.0f);
    device.set_param(p::kSpread, 0.0f);
    rng_state() = 0x96000u;
    std::vector<float> input = noise(1.0f, rate, 0.2f);
    Stereo out = run(device, input);
    const double match = lagged_correlation(out.left, input, slice + 64, 2 * slice - 64, slice);
    std::printf("glitch: at %.1f kHz the first repeat matches the input %ld samples earlier: %.5f\n",
                rate / 1000.0f, slice, match);
    EXPECT(match > 0.999, "the slice length follows the sample rate");
  }

  // CHECKS

  // Cost with an event always playing, long fades (two readers at once, both
  // filtered) and half the fragments read through the half-band filter.
  device.init(kRate);
  device.set_param(p::kTime, 60.0f);
  device.set_param(p::kChance, 1.0f);
  device.set_param(p::kCalm, 1.0f);
  device.set_param(p::kOctaves, 1.0f);
  device.set_param(p::kSpread, 1.0f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("glitch", 10.0f, kRate, [&] { run(device, input); });

  return finish("glitch");
}
