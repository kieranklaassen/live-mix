// Native harness for Late Vibrato (cpp/devices/late-vibrato). The conformance
// pass covers stability, silence when idle, block-size independence on noise
// and parameter abuse; the rest measures what makes it a vibrato that waits:
// how far a held tone's pitch bends, and when.

#include "../devices/late-vibrato/late_vibrato.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::LateVibrato;
namespace p = livemix::late_vibrato;

static LateVibrato device;
static LateVibrato other;

static const float kRate = 48000.0f;
static const size_t kLatency = static_cast<size_t>(LateVibrato::kLatency);

// --- measuring --------------------------------------------------------------------------

// How far the pitch of a tone at `hz` is bent, in cents, sample by sample:
// the tone is mixed down against its own frequency, averaged twice over
// `periods` whole periods (which must be a whole number of samples; twice, so
// that what is left of the image at twice the frequency is a few parts in a
// hundred thousand), and the phase that remains is differenced over 4 ms.
// Where there is no tone the answer is 0.
static std::vector<double> bend_cents(const std::vector<float>& y, double hz, double rate,
                                      int periods = 2) {
  const size_t n = y.size();
  const size_t window = static_cast<size_t>(std::llround(periods * rate / hz));
  std::vector<double> re(n), im(n);
  for (size_t i = 0; i < n; ++i) {
    const double w = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    re[i] = y[i] * std::cos(w);
    im[i] = -y[i] * std::sin(w);
  }
  auto average = [&](std::vector<double>& x) {
    std::vector<double> sum(n + 1, 0.0);
    for (size_t i = 0; i < n; ++i) sum[i + 1] = sum[i] + x[i];
    for (size_t i = 0; i < n; ++i) {
      const size_t from = i >= window / 2 ? i - window / 2 : 0;
      const size_t to = std::min(n, from + window);
      x[i] = sum[to] - sum[from];
    }
  };
  for (int pass = 0; pass < 2; ++pass) {
    average(re);
    average(im);
  }
  std::vector<double> phase(n, 0.0);
  double turns = 0.0, last = 0.0;
  for (size_t i = 0; i < n; ++i) {
    double angle = (re[i] * re[i] + im[i] * im[i]) > 1.0e-6 ? std::atan2(im[i], re[i]) + turns : last;
    while (angle - last > kPi) {
      angle -= 2.0 * kPi;
      turns -= 2.0 * kPi;
    }
    while (angle - last < -kPi) {
      angle += 2.0 * kPi;
      turns += 2.0 * kPi;
    }
    last = angle;
    phase[i] = last;
  }
  const size_t h = static_cast<size_t>(0.002 * rate);
  std::vector<double> cents(n, 0.0);
  for (size_t i = h; i + h < n; ++i) {
    const double df = (phase[i + h] - phase[i - h]) * rate / (2.0 * kPi * 2.0 * static_cast<double>(h));
    cents[i] = 1200.0 * std::log2(std::max(1.0e-6, 1.0 + df / hz));
  }
  return cents;
}

static size_t at(double seconds, double rate = kRate) {
  return static_cast<size_t>(std::llround(seconds * rate));
}

static double most(const std::vector<double>& x, size_t from, size_t to) {
  double m = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) m = std::max(m, std::fabs(x[i]));
  return m;
}

// Half the distance between the highest and the lowest value: the depth of a
// sway over a stretch that holds a whole cycle of it.
static double swing(const std::vector<double>& x, size_t from, size_t to) {
  double hi = -1.0e9, lo = 1.0e9;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    hi = std::max(hi, x[i]);
    lo = std::min(lo, x[i]);
  }
  return 0.5 * (hi - lo);
}

// The places where a signal rises through zero, between samples.
static std::vector<double> risings(const std::vector<double>& x, size_t from, size_t to) {
  std::vector<double> found;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0 && x[i] >= 0.0) {
      found.push_back(static_cast<double>(i - 1) + x[i - 1] / (x[i - 1] - x[i]));
    }
  }
  return found;
}

// The mean rate of a sway in Hz over [from, to), from its rising crossings.
static double sway_rate(const std::vector<double>& x, size_t from, size_t to, double rate = kRate) {
  const std::vector<double> up = risings(x, from, to);
  if (up.size() < 2) return 0.0;
  return static_cast<double>(up.size() - 1) * rate / (up.back() - up.front());
}

// The largest difference between what came out and what went in `kLatency`
// samples before, over [from, to) of the output.
static double from_delayed(const std::vector<float>& out, const std::vector<float>& in, size_t from,
                           size_t to) {
  double worst = 0.0;
  for (size_t i = std::max(from, kLatency); i < to && i < out.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(out[i]) - in[i - kLatency]));
  }
  return worst;
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

static std::vector<float> scaled(std::vector<float> x, size_t from, size_t to, float gain) {
  for (size_t i = from; i < to && i < x.size(); ++i) x[i] *= gain;
  return x;
}

static std::vector<float> added(std::vector<float> x, const std::vector<float>& y, size_t from) {
  for (size_t i = 0; i < y.size() && from + i < x.size(); ++i) x[from + i] += y[i];
  return x;
}

// --- settings ---------------------------------------------------------------------------

// A plain vibrato to measure: nothing that wanders, quickens, swells or
// spreads, all of it wet.
static void plain(LateVibrato& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWait, 400.0f);
  d.set_param(p::kGrow, 800.0f);
  d.set_param(p::kDepth, 30.0f);
  d.set_param(p::kRate, 5.0f);
  d.set_param(p::kQuicken, 0.0f);
  d.set_param(p::kSwell, 0.0f);
  d.set_param(p::kHuman, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// The S the sway rises along (`sway_` in late_vibrato.h).
static double rise(double u) {
  u = std::min(1.0, std::max(0.0, u));
  return u * u * (3.0 - 2.0 * u);
}

// Runs `in` through `d` at one block size, or raggedly with 0.
static Stereo run_blocks(LateVibrato& d, const std::vector<float>& in, int block) {
  if (block > 0) return run(d, in, block);
  Stereo out;
  out.left.resize(in.size());
  out.right.resize(in.size());
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  size_t done = 0;
  int which = 0;
  while (done < in.size()) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), in.size() - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = in[done + i];
      d.in_right()[i] = in[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// A tone that starts on a sample where it is not zero, so that its first
// sample is sound whatever the frequency.
static std::vector<float> tone(float hz, float seconds, float gain, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    out[i] = gain * static_cast<float>(std::cos(2.0 * kPi * hz * static_cast<double>(i) / rate));
  }
  return out;
}

int main() {
  Conformance spec;
  spec.name = "late-vibrato";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  const double began = static_cast<double>(kLatency) / kRate;

  // The delay is kLatency samples and no more: at Mix 0 the output is the
  // input that many samples late, sample for sample; an impulse comes out
  // there at any Mix.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xA11CEu;
    std::vector<float> in = noise(1.0f, kRate, 0.5f);
    Stereo out = run(device, in);
    EXPECT(peak(out.left, 0, kLatency) == 0.0, "nothing comes out before the latency has passed");
    EXPECT(from_delayed(out.left, in, 0, in.size()) == 0.0 &&
               from_delayed(out.right, in, 0, in.size()) == 0.0,
           "Mix 0 is the input, kLatency samples late, sample for sample");
    device.init(kRate);
    Stereo click = run(device, impulse(0.5f, kRate, 0.5f));
    size_t where = 0;
    for (size_t i = 0; i < click.size(); ++i) {
      if (std::fabs(click.left[i]) > std::fabs(click.left[where])) where = i;
    }
    EXPECT(where == kLatency && click.left[where] == 0.5f, "an impulse comes out kLatency samples late");
  }

  // A held tone is straight for Wait, then its bend grows to Depth over Grow
  // along the S, at Rate.
  {
    plain(device);
    std::vector<float> in = sine(1000.0f, 4.0f, kRate, 0.5f);
    Stereo out = run(device, in);
    std::vector<double> bend = bend_cents(out.left, 1000.0, kRate);
    // The note is heard from kLatency on; Wait ends 400 ms after it began.
    const double straight = most(bend, at(began + 0.01), at(began + 0.39));
    std::printf("held tone: bend during Wait %.5f cents\n", straight);
    EXPECT(straight < 0.01, "a held tone is straight for Wait (a hundredth of a cent)");
    EXPECT(from_delayed(out.left, in, 0, at(began + 0.39)) == 0.0,
           "during Wait the output is the input itself, kLatency samples late");
    const double full = swing(bend, at(1.5), at(2.5));
    std::printf("held tone: bend at full %.3f cents\n", full);
    EXPECT_NEAR(full, 30.0, 0.15, "the bend reaches Depth, in cents");
    EXPECT_NEAR(most(bend, at(1.5), at(2.5)), 30.0, 0.15, "the bend is as far sharp as flat");
    const double hz = sway_rate(bend, at(1.5), at(3.9));
    std::printf("held tone: sway rate %.4f Hz\n", hz);
    EXPECT_NEAR(hz, 5.0, 0.01, "the sway runs at Rate");
    // The crests of the sway, walked back from the full stretch a half cycle
    // at a time: each stands on the S. The rise starts when the detector lets
    // go of the attack, 15 to 30 ms after the note began.
    const std::vector<double> up = risings(bend, at(2.0), at(2.5));
    double worst = 0.0;
    int crests = 0;
    if (!up.empty()) {
      for (double crest = up[0] / kRate + 0.05; crest > 0.45; crest -= 0.1) {
        const double depth = std::fabs(bend[at(crest)]);
        const double low = 30.0 * rise((crest - 0.4 - 0.03) / 0.8);
        const double high = 30.0 * rise((crest - 0.4 - 0.015) / 0.8);
        worst = std::max(worst, std::max(low - depth, depth - high));
        ++crests;
      }
    }
    std::printf("held tone: %d crests, furthest %.3f cents off the S\n", crests, worst);
    EXPECT(crests >= 14 && worst < 0.35, "the bend grows along the S over Grow");
  }

  // Quicken raises the rate with the sway: by half at Quicken 1, fully open.
  {
    plain(device);
    device.set_param(p::kQuicken, 1.0f);
    Stereo out = run(device, sine(1000.0f, 4.0f, kRate, 0.5f));
    std::vector<double> bend = bend_cents(out.left, 1000.0, kRate);
    const double open = sway_rate(bend, at(1.5), at(3.9));
    // Half way up the S the sway is half open: the rate is a quarter up.
    const std::vector<double> up = risings(bend, at(0.6), at(1.1));
    double half = 0.0;
    for (size_t i = 1; i < up.size(); ++i) {
      const double middle = 0.5 * (up[i] + up[i - 1]) / kRate;
      if (std::fabs(middle - 0.823) < 0.09) half = kRate / (up[i] - up[i - 1]);
    }
    std::printf("quicken: %.4f Hz fully open, %.3f Hz half open\n", open, half);
    EXPECT_NEAR(open, 7.5, 0.02, "Quicken 1 raises the rate by half once the sway is open");
    EXPECT(half > 5.8 && half < 6.7, "the rate rises with the sway, not at once");
    EXPECT_NEAR(swing(bend, at(1.5), at(2.5)), 30.0, 0.15, "a quicker sway is as deep, in cents");
  }

  // Notes shorter than Wait never sway: they leave as they came.
  {
    device.init(kRate);  // the defaults: Wait 350 ms, all of it wet
    std::vector<float> in(at(4.0), 0.0f);
    // Plucks 250 ms apart, each ringing on under the next.
    for (int note = 0; note < 14; ++note) {
      const size_t from = at(0.25 * note);
      const double hz = 220.0 * std::pow(2.0, (note * 5 % 12) / 12.0);
      for (size_t i = from; i < in.size(); ++i) {
        const double t = static_cast<double>(i - from) / kRate;
        in[i] += static_cast<float>(0.3 * std::exp(-t * 6.0) * std::sin(2.0 * kPi * hz * t));
      }
    }
    Stereo out = run(device, in);
    const double worst = from_delayed(out.left, in, 0, at(3.5));
    std::printf("short notes: furthest from the input %.3g\n", worst);
    EXPECT(worst == 0.0, "notes shorter than Wait pass untouched, sample for sample");
    EXPECT(from_delayed(out.right, in, 0, at(3.5)) == 0.0, "on both sides");
    // The same phrase with the last note left to ring does sway in the end.
    std::vector<float> rung = in;
    rung.resize(at(7.0), 0.0f);
    for (size_t i = at(3.25); i < rung.size(); ++i) {
      rung[i] += static_cast<float>(0.3 * std::sin(2.0 * kPi * 1000.0 * static_cast<double>(i) / kRate));
    }
    device.init(kRate);
    Stereo late = run(device, rung);
    EXPECT(from_delayed(late.left, rung, at(5.5), at(6.5)) > 0.05, "a note held on after them sways");
  }

  // A new attack takes the sway back down, and the read is spliced back to
  // the centre: from 60 ms after it the output is the input again.
  LateVibrato reference;
  std::vector<double> uninterrupted;
  {
    plain(device);
    std::vector<float> in = sine(1000.0f, 7.0f, kRate, 0.25f);
    in = scaled(in, at(3.0), in.size(), 2.8f);  // 9 dB up at 3 s
    Stereo out = run(device, in);
    std::vector<double> bend = bend_cents(out.left, 1000.0, kRate);
    const double before = swing(bend, at(2.6), at(2.95));
    const double after = most(bend, at(3.06), at(3.38));
    const double exact = from_delayed(out.left, in, at(3.06), at(3.38));
    const double again = swing(bend, at(4.5), at(5.5));
    std::printf("new attack: bend %.2f before, %.4f after, %.2f again; %.3g from the input\n", before,
                after, again, exact);
    EXPECT_NEAR(before, 30.0, 0.2, "the tone sways before the attack");
    EXPECT(after < 0.01, "a new attack takes the bend back to nothing within 60 ms");
    EXPECT(exact == 0.0, "after the splice the output is the input itself again");
    EXPECT_NEAR(again, 30.0, 0.2, "and the sway opens again after Wait and Grow");

    // The cycle is never reset: after the attack it is where it would have
    // been without one.
    plain(reference);
    Stereo steady = run(reference, sine(1000.0f, 7.0f, kRate, 0.25f));
    uninterrupted = bend_cents(steady.left, 1000.0, kRate);
    double apart = 0.0;
    for (size_t i = at(4.6); i < at(6.9); ++i) apart = std::max(apart, std::fabs(bend[i] - uninterrupted[i]));
    std::printf("free cycle: bends at most %.3f cents apart after the attack\n", apart);
    EXPECT(apart < 0.6, "an attack does not reset the cycle");
  }

  // Nor does a silence: the cycle runs on while the device rests.
  {
    plain(device);
    std::vector<float> in = sine(1000.0f, 7.0f, kRate, 0.25f);
    for (size_t i = at(2.0); i < at(2.5); ++i) in[i] = 0.0f;
    Stereo out = run(device, in);
    EXPECT(peak(out.left, at(2.2), at(2.5)) == 0.0, "it rests in the silence");
    std::vector<double> bend = bend_cents(out.left, 1000.0, kRate);
    double apart = 0.0;
    for (size_t i = at(4.1); i < at(6.9); ++i) apart = std::max(apart, std::fabs(bend[i] - uninterrupted[i]));
    std::printf("free cycle: bends at most %.3f cents apart after a rest\n", apart);
    EXPECT(apart < 0.6, "a rest does not reset the cycle");
  }

  // Sense: a 4 dB rise is a new note at the default and not at 0.3.
  {
    for (float sense : {0.6f, 0.3f}) {
      plain(device);
      device.set_param(p::kSense, sense);
      std::vector<float> in = sine(1000.0f, 4.0f, kRate, 0.25f);
      in = scaled(in, at(3.0), in.size(), 1.585f);
      Stereo out = run(device, in);
      std::vector<double> bend = bend_cents(out.left, 1000.0, kRate);
      const double after = swing(bend, at(3.1), at(3.35));
      std::printf("sense %.1f: bend %.2f cents after a 4 dB rise\n", sense, after);
      if (sense > 0.5f) {
        EXPECT(after < 0.01, "at the default a 4 dB rise is a new note");
      } else {
        EXPECT_NEAR(after, 30.0, 0.2, "at Sense 0.3 a 4 dB rise is not");
      }
    }
  }

  // A quiet high note over a loud low one is a new note; as quiet a tone
  // beside the low one is not.
  {
    for (float hz : {2000.0f, 187.5f}) {
      plain(device);
      std::vector<float> in = sine(125.0f, 4.0f, kRate, 0.5f);
      in = added(in, sine(hz, 1.0f, kRate, 0.06f), at(3.0));
      Stereo out = run(device, in);
      // Two periods of 125 Hz, twice, is an average 32 ms long: it takes 2 %
      // off a 5 Hz sway (30 cents read as 29.3), and takes out the tone
      // beside the drone, which lies 62.5 Hz from it.
      std::vector<double> bend = bend_cents(out.left, 125.0, kRate, 2);
      const double before = swing(bend, at(2.6), at(2.95));
      const double after = swing(bend, at(3.1), at(3.35));
      std::printf("over a drone: +%.1f Hz, 18 dB down: bend %.2f before, %.3f after\n", hz, before, after);
      EXPECT_NEAR(before, 29.3, 0.3, "the drone sways");
      if (hz > 1000.0f) {
        EXPECT(after < 0.05, "a quiet high note over it is a new note");
      } else {
        EXPECT_NEAR(after, 29.3, 0.5, "a quiet tone beside it is not");
      }
    }
  }

  // Two notes beating against each other are not new notes, however slowly
  // and however deeply they beat: the sway opens over them all the same.
  {
    for (float beat : {0.5f, 1.0f, 1.5f, 2.0f, 2.5f, 3.0f, 4.0f, 6.0f, 9.0f, 14.0f, 25.0f}) {
      for (float second : {0.15f, 0.3f}) {
        plain(device);
        std::vector<float> in =
            added(sine(1000.0f, 5.0f, kRate, 0.3f), sine(1000.0f + beat, 5.0f, kRate, second), 0);
        Stereo out = run(device, in);
        const float depth = device.meter(1);
        const float age = device.meter(0);
        std::printf("beating at %.1f Hz, second note %.2f: depth %.2f cents, note %.2f s old\n", beat,
                    second, depth, age);
        EXPECT(depth > 29.9f && age > 4.9f, "beating notes are one note, and it sways");
      }
    }
  }

  // Width: none, the two sides are one; all of it, they bend opposite ways.
  {
    plain(device);
    std::vector<float> in = sine(1000.0f, 3.0f, kRate, 0.5f);
    Stereo one = run(device, in);
    EXPECT(one.left == one.right, "Width 0: both sides are the same");
    plain(device);
    device.set_param(p::kWidth, 1.0f);
    Stereo two = run(device, in);
    std::vector<double> left = bend_cents(two.left, 1000.0, kRate);
    std::vector<double> right = bend_cents(two.right, 1000.0, kRate);
    double worst = 0.0;
    for (size_t i = at(1.5); i < at(2.9); ++i) worst = std::max(worst, std::fabs(left[i] + right[i]));
    std::printf("width 1: left and right bends sum to at most %.3f cents\n", worst);
    EXPECT(worst < 0.5, "Width 1: the right side bends the opposite way");
    EXPECT_NEAR(swing(right, at(1.5), at(2.5)), 30.0, 0.15, "and as far");
    bool same = true;
    for (size_t i = 0; i < at(began + 0.39); ++i) same = same && two.left[i] == two.right[i];
    EXPECT(same, "while the note is straight the two sides are one, whatever Width");
    plain(device);
    device.set_param(p::kWidth, 0.5f);
    Stereo half = run(device, in);
    std::vector<double> ahead = bend_cents(half.right, 1000.0, kRate);
    const std::vector<double> a = risings(left, at(1.5), at(2.5));
    const std::vector<double> b = risings(ahead, at(1.5), at(2.5));
    const double lead = (a.empty() || b.empty()) ? 0.0 : std::fmod((a[0] - b[0]) / kRate * 5.0 + 4.0, 1.0);
    std::printf("width 0.5: the right side leads by %.4f of a cycle\n", lead);
    EXPECT_NEAR(lead, 0.25, 0.01, "Width 0.5: the right side leads by a quarter cycle");
  }

  // Swell: level and brightness rise with the sway and pulse with the cycle.
  {
    double held[2][2] = {};
    int which = 0;
    for (float hz : {200.0f, 3000.0f}) {
      for (float swell : {0.0f, 1.0f}) {
        plain(device);
        device.set_param(p::kSwell, swell);
        Stereo out = run(device, sine(hz, 3.0f, kRate, 0.25f));
        const double straight = rms(out.left, at(0.1), at(0.4));
        const double open = rms(out.left, at(1.6), at(2.6));  // five whole cycles
        held[which][swell > 0.5f ? 1 : 0] = db(open / straight);
        if (swell > 0.5f && hz < 1000.0f) {
          // Loudest where the pitch is sharpest, quietest where it is flattest.
          std::vector<double> bend = bend_cents(out.left, hz, kRate, 4);
          const std::vector<double> up = risings(bend, at(1.6), at(2.2));
          const size_t crest = up.empty() ? 0 : static_cast<size_t>(up[0]) + at(0.05);
          const double loud = rms(out.left, crest - 240, crest + 240);
          const double soft = rms(out.left, crest + at(0.1) - 240, crest + at(0.1) + 240);
          // From late_vibrato.h: the level is 1 + 0.18 ± 0.12, and the shelf
          // adds 0.5 ± 0.3 of what a one-pole high-pass at 1.5 kHz lets
          // through, which at 200 Hz is 0.0175 + 0.131 j.
          const double sharp = 1.30 * std::hypot(1.0 + 0.8 * 0.0175, 0.8 * 0.131);
          const double flat = 1.06 * std::hypot(1.0 + 0.2 * 0.0175, 0.2 * 0.131);
          std::printf("swell 1 at %.0f Hz: %.2f dB between sharp and flat (%.2f by the formula)\n", hz,
                      db(loud / soft), db(sharp / flat));
          EXPECT_NEAR(db(loud / soft), db(sharp / flat), 0.1, "the level pulses with the cycle, loudest sharp");
        }
      }
      std::printf("swell at %.0f Hz: %.3f dB with none, %.2f dB with all of it\n", hz, held[which][0],
                  held[which][1]);
      ++which;
    }
    EXPECT(std::fabs(held[0][0]) < 0.02 && std::fabs(held[1][0]) < 0.02, "no Swell: the sway leaves the level alone");
    EXPECT_NEAR(held[0][1], 1.5, 0.2, "Swell 1 lifts a low tone by 1.5 dB as it opens");
    EXPECT(held[1][1] > held[0][1] + 2.5 && held[1][1] < 6.0, "and a high one by 2.5 dB more: it brightens");
  }

  // Part way up Mix a held note opens from one voice into two: no comb while
  // it is straight, a chorus once it sways.
  {
    plain(device);
    device.set_param(p::kMix, 0.5f);
    std::vector<float> in = sine(1000.0f, 3.0f, kRate, 0.5f);
    Stereo out = run(device, in);
    EXPECT(from_delayed(out.left, in, 0, at(began + 0.39)) == 0.0,
           "Mix 0.5: straight, the output is still the input");
    // Two voices up to a millisecond apart: the level now beats.
    double low = 1.0e9, high = 0.0;
    for (size_t i = at(1.6); i + 480 < at(2.6); i += 240) {
      const double level = rms(out.left, i, i + 480);
      low = std::min(low, level);
      high = std::max(high, level);
    }
    std::printf("mix 0.5: level moves %.2f dB as the two voices part\n", db(high / low));
    EXPECT(db(high / low) > 3.0, "Mix 0.5: swaying, the two voices beat as a chorus does");
  }

  // Slow rates hold less Depth: 53.9 cents for each Hz. The read point never
  // runs out of room, whatever moment of the cycle the sway opens at: were it
  // to, the pitch would stand still against the wall, and it never does for
  // longer than a crossing takes.
  {
    double least = 1.0e9, greatest = 0.0;
    size_t stood = 0;
    for (int start = 0; start < 8; ++start) {
      plain(device);
      device.set_param(p::kWait, 10.0f);
      device.set_param(p::kGrow, 20.0f);
      device.set_param(p::kRate, 0.5f);
      device.set_param(p::kDepth, 100.0f);
      // The cycle runs on through the silence before the note: an eighth of
      // it later each time.
      render(device, 0.25f * static_cast<float>(start), kRate);
      Stereo out = run(device, sine(1000.0f, 8.5f, kRate, 0.5f));
      std::vector<double> bend = bend_cents(out.left, 1000.0, kRate);
      // The first cycles lean up to a twentieth of the depth to one side
      // while the read point finds its centre; then they are even.
      EXPECT(most(bend, at(0.3), at(4.3)) < 27.0 * 1.07, "a sway opened all at once leans a twentieth at the most");
      const double depth = swing(bend, at(6.3), at(8.3));
      least = std::min(least, depth);
      greatest = std::max(greatest, depth);
      size_t run_now = 0;
      for (size_t i = at(0.2); i < at(8.3); ++i) {
        run_now = std::fabs(bend[i]) < 0.2 ? run_now + 1 : 0;
        stood = std::max(stood, run_now);
      }
    }
    std::printf("slow and deep: bend between %.2f and %.2f cents over eight starts; straight for %.1f ms at the most\n",
                least, greatest, 1000.0 * static_cast<double>(stood) / kRate);
    EXPECT(least > 26.6 && greatest < 27.2, "at 0.5 Hz, 100 cents are held to 27");
    EXPECT(stood < at(0.03), "the read point never stands against the end of its room");
  }

  // Human: the rate and the depth wander, within their bounds.
  {
    double spread[2] = {};
    double depths[2] = {};
    int which = 0;
    for (float human : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kHuman, human);
      Stereo out = run(device, sine(1000.0f, 30.0f, kRate, 0.5f));
      std::vector<double> bend = bend_cents(out.left, 1000.0, kRate);
      const std::vector<double> up = risings(bend, at(2.0), at(29.9));
      double shortest = 1.0e9, longest = 0.0;
      for (size_t i = 1; i < up.size(); ++i) {
        shortest = std::min(shortest, up[i] - up[i - 1]);
        longest = std::max(longest, up[i] - up[i - 1]);
      }
      double shallow = 1.0e9, deep = 0.0;
      for (size_t i = 1; i < up.size(); ++i) {
        const double depth = swing(bend, static_cast<size_t>(up[i - 1]), static_cast<size_t>(up[i]) + 1);
        shallow = std::min(shallow, depth);
        deep = std::max(deep, depth);
      }
      spread[which] = longest / shortest;
      depths[which] = deep / shallow;
      std::printf("human %.0f: cycles %.4f to %.4f s, depth %.2f to %.2f cents\n", human, shortest / kRate,
                  longest / kRate, shallow, deep);
      if (human > 0.5f) {
        EXPECT(kRate / longest > 5.0 * 0.87 && kRate / shortest < 5.0 * 1.13, "the rate wanders within 12 %");
        EXPECT(shallow > 30.0 * 0.74 && deep < 30.0 * 1.26, "the depth wanders within 25 %");
      }
      ++which;
    }
    EXPECT(spread[0] < 1.002 && depths[0] < 1.01, "Human 0: every cycle is the same");
    EXPECT(spread[1] > 1.08 && depths[1] > 1.2, "Human 1: no two cycles are quite alike");
  }

  // The same at other sample rates: the wait, the depth and the rate.
  {
    for (float rate : {44100.0f, 96000.0f}) {
      plain(device, rate);
      const float hz = rate / (rate > 50000.0f ? 96.0f : 49.0f);
      Stereo out = run(device, sine(hz, 3.0f, rate, 0.5f));
      std::vector<double> bend = bend_cents(out.left, hz, rate);
      const double start = static_cast<double>(kLatency) / rate;
      const double straight = most(bend, at(start + 0.01, rate), at(start + 0.39, rate));
      const double full = swing(bend, at(1.5, rate), at(2.5, rate));
      const double cycles = sway_rate(bend, at(1.5, rate), at(2.9, rate), rate);
      const double half = most(bend, at(0.72, rate), at(0.92, rate));
      std::printf("at %.0f Hz: %.5f cents in Wait, %.3f at full, %.2f half way, %.4f Hz\n", rate,
                  straight, full, half, cycles);
      EXPECT(straight < 0.01, "straight for Wait at another sample rate");
      EXPECT_NEAR(full, 30.0, 0.15, "the same Depth at another sample rate");
      EXPECT_NEAR(cycles, 5.0, 0.01, "the same Rate at another sample rate");
      EXPECT(half > 12.0 && half < 21.0, "the same Grow at another sample rate");
    }
  }

  // The read does not flutter the treble: a 10 kHz tone keeps its level
  // through the sway. The level of a tone whose pitch moves is taken from
  // three neighbouring samples and the pitch measured above:
  // y[n]² − y[n−1]·y[n+1] = A²·sin²(ω).
  {
    plain(device);
    device.set_param(p::kDepth, 60.0f);
    Stereo out = run(device, sine(10000.0f, 3.0f, kRate, 0.5f));
    std::vector<double> bend = bend_cents(out.left, 10000.0, kRate, 5);
    double low = 1.0e9, high = 0.0;
    for (size_t i = at(1.6); i + 48 < at(2.6); i += 48) {
      double sum = 0.0;
      for (size_t k = i; k < i + 48; ++k) {
        const double w = 2.0 * kPi * 10000.0 * std::pow(2.0, bend[k] / 1200.0) / kRate;
        const double energy = static_cast<double>(out.left[k]) * out.left[k] -
                              static_cast<double>(out.left[k - 1]) * out.left[k + 1];
        sum += energy / (std::sin(w) * std::sin(w));
      }
      const double level = std::sqrt(std::max(0.0, sum / 48.0));
      low = std::min(low, level);
      high = std::max(high, level);
    }
    std::printf("10 kHz tone under a 60 cent sway: level between %.4f and %.4f dB of the tone\n",
                db(low / 0.5), db(high / 0.5));
    EXPECT(db(high / low) < 0.03, "the treble does not flutter under the sway");
    EXPECT(std::fabs(db(high / 0.5)) < 0.03 && std::fabs(db(low / 0.5)) < 0.03, "nor lose or gain level");
  }

  // Block size, across a rest: a phrase with a silence stepped over the
  // moment the device falls to rest is the same at every block size, and the
  // cycle carries on the same.
  {
    double worst = 0.0;
    for (float gap : {0.05f, 0.07f, 0.08f, 0.09f, 0.095f, 0.10f, 0.11f, 0.13f, 0.6f}) {
      std::vector<float> in = tone(440.0f, 0.7f, 0.4f);
      std::vector<float> rest = silence(gap, kRate);
      in.insert(in.end(), rest.begin(), rest.end());
      std::vector<float> more = tone(330.0f, 0.9f, 0.4f);
      in.insert(in.end(), more.begin(), more.end());
      auto set = [](LateVibrato& d) {
        d.init(kRate);
        d.set_param(p::kWait, 100.0f);
        d.set_param(p::kGrow, 200.0f);
        d.set_param(p::kHuman, 1.0f);
        d.set_param(p::kQuicken, 1.0f);
      };
      set(device);
      Stereo normal = run_blocks(device, in, 128);
      for (int block : {1, 2048, 0}) {
        set(other);
        Stereo out = run_blocks(other, in, block);
        worst = std::max(worst, worst_difference(out, normal));
      }
    }
    std::printf("block size across a rest: at most %.3g apart\n", worst);
    EXPECT(worst < 1.0e-6, "the output does not depend on the block size across a rest");
  }

  // Knobs moved while it rests have arrived when the next note comes.
  {
    std::vector<float> first = tone(440.0f, 0.5f, 0.4f);
    std::vector<float> second = tone(330.0f, 1.5f, 0.4f);
    auto set = [](LateVibrato& d) {
      d.init(kRate);
      d.set_param(p::kWait, 100.0f);
      d.set_param(p::kGrow, 200.0f);
    };
    auto move = [](LateVibrato& d) {
      d.set_param(p::kDepth, 70.0f);
      d.set_param(p::kSwell, 0.9f);
      d.set_param(p::kWidth, 0.8f);
      d.set_param(p::kMix, 0.6f);
    };
    set(device);
    run(device, first);
    device.process(13);  // off the beat of the control clock
    render(device, 0.4f, kRate);
    move(device);
    render(device, 0.1f, kRate);
    Stereo moved = run(device, second);
    set(other);
    move(other);
    run(other, first);
    other.process(13);
    render(other, 0.5f, kRate);
    Stereo there = run(other, second);
    const double apart = worst_difference(moved, there);
    std::printf("knobs moved at rest: at most %.3g from a device set that way from the start\n", apart);
    EXPECT(apart < 1.0e-6, "knobs moved at rest snap: nothing glides under the next note");
    EXPECT(rms(moved.left, at(0.6), at(1.4)) > 0.1, "(and the note sounds)");
  }

  // Moving a knob while the note sways does not click: against the same
  // render with the knob left alone.
  {
    struct Move {
      int id;
      float from, to;
      const char* name;
    };
    const Move moves[] = {{p::kDepth, 28.0f, 100.0f, "Depth"}, {p::kDepth, 80.0f, 0.0f, "Depth down"},
                          {p::kMix, 1.0f, 0.3f, "Mix"},        {p::kWidth, 0.0f, 1.0f, "Width"},
                          {p::kSwell, 0.0f, 1.0f, "Swell"},    {p::kRate, 5.0f, 10.0f, "Rate"},
                          {p::kWait, 400.0f, 4000.0f, "Wait"}, {p::kGrow, 800.0f, 20.0f, "Grow"},
                          {p::kSense, 0.6f, 1.0f, "Sense"},    {p::kHuman, 0.0f, 1.0f, "Human"},
                          {p::kQuicken, 0.0f, 1.0f, "Quicken"}};
    // A low tone: its own steps are small, so a click stands out.
    std::vector<float> in = sine(110.0f, 3.0f, kRate, 0.5f);
    for (const Move& move : moves) {
      plain(device);
      device.set_param(move.id, move.from);
      plain(other);
      other.set_param(move.id, move.from);
      run(device, std::vector<float>(in.begin(), in.begin() + at(2.0)));
      run(other, std::vector<float>(in.begin(), in.begin() + at(2.0)));
      device.set_param(move.id, move.to);
      std::vector<float> rest(in.begin() + at(2.0), in.end());
      Stereo moved = run(device, rest);
      Stereo still = run(other, rest);
      // And with the knob where it was going from the start.
      plain(other);
      other.set_param(move.id, move.to);
      run(other, std::vector<float>(in.begin(), in.begin() + at(2.0)));
      Stereo there = run(other, rest);
      const double step = std::max(max_step(moved.left), max_step(moved.right));
      const double plain_step = std::max(std::max(max_step(still.left), max_step(still.right)),
                                         std::max(max_step(there.left), max_step(there.right)));
      std::printf("moving %s: largest step %.5f against %.5f with it left alone or there already\n",
                  move.name, step, plain_step);
      char label[96];
      std::snprintf(label, sizeof label, "moving %s while the note sways does not click", move.name);
      EXPECT(step < plain_step * 1.1 + 0.0002, label);
    }
  }

  // The sway being cut by a new note does not click either: a quiet high
  // note over a drone cuts it, and the drone's own steps stay as they were.
  {
    plain(device);
    std::vector<float> in = sine(125.0f, 4.0f, kRate, 0.5f);
    Stereo steady = run(device, in);
    plain(device);
    std::vector<float> with = added(in, sine(2000.0f, 1.0f, kRate, 0.0f), at(3.0));
    // The high note itself is left out of what is measured: the sway is cut
    // by hand, as the detector would, by a jump of Sense and Wait.
    Stereo first = run(device, std::vector<float>(with.begin(), with.begin() + at(3.0)));
    device.set_param(p::kWait, 4000.0f);
    Stereo cut = run(device, std::vector<float>(with.begin() + at(3.0), with.end()));
    std::vector<double> bend = bend_cents(cut.left, 125.0, kRate);
    EXPECT(most(bend, at(0.1), at(0.9)) < 0.05, "a longer Wait than the note is old cuts the sway");
    const double step = max_step(cut.left);
    const double plain_step = max_step(steady.left);
    std::printf("cutting the sway: largest step %.5f against %.5f\n", step, plain_step);
    EXPECT(step < plain_step * 1.3, "the fall and the splice do not click");
  }

  // Bad input: samples that are not numbers, infinite or absurd do not lodge
  // anywhere. Good input after them comes out as it would have.
  {
    plain(device);
    std::vector<float> in = sine(1000.0f, 5.0f, kRate, 0.25f);
    std::vector<float> bad = in;
    bad[at(0.5)] = std::nanf("");
    bad[at(0.5) + 1] = INFINITY;
    bad[at(0.5) + 2] = -INFINITY;
    bad[at(0.5) + 3] = 1.0e30f;
    bad[at(0.5) + 4] = -1.0e30f;
    Stereo left_only;
    left_only.left.resize(bad.size());
    left_only.right.resize(bad.size());
    {
      // The bad samples on one side only, so the other is checked as well.
      size_t done = 0;
      while (done < bad.size()) {
        const int frames = static_cast<int>(std::min(static_cast<size_t>(kBlock), bad.size() - done));
        for (int i = 0; i < frames; ++i) {
          device.in_left()[i] = bad[done + i];
          device.in_right()[i] = in[done + i];
        }
        device.process(frames);
        for (int i = 0; i < frames; ++i) {
          left_only.left[done + i] = device.out_left()[i];
          left_only.right[done + i] = device.out_right()[i];
        }
        done += frames;
      }
    }
    EXPECT(finite(left_only.left) && finite(left_only.right), "bad input: the output stays finite");
    EXPECT(peak(left_only.left) <= 16.0 * 1.5 && peak(left_only.right) < 0.5, "and bounded");
    std::vector<double> bend = bend_cents(left_only.right, 1000.0, kRate);
    const double after = swing(bend, at(3.5), at(4.5));
    std::printf("bad input: bend %.2f cents on the good side three seconds on\n", after);
    EXPECT_NEAR(after, 30.0, 0.2, "bad input: the sway opens again after it");
    // And after a rest it is the device it was.
    render(device, 0.5f, kRate);
    Stereo again = run(device, in);
    plain(other);
    run(other, bad.size() > 0 ? in : in);
    render(other, 0.5f, kRate);
    Stereo clean = run(other, in);
    EXPECT(worst_difference(again, clean) < 1.0e-6, "bad input: nothing of it is left after a rest");
  }

  // It rests: exact zeros after the delay has emptied, and it wakes.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    Stereo tail = render(device, 0.2f, kRate);
    EXPECT(peak(tail.left, at(0.1), at(0.2)) == 0.0 && peak(tail.right, at(0.1), at(0.2)) == 0.0,
           "at rest 93 ms after the input stops");
    EXPECT(device.meter(0) == 0.0f && device.meter(1) == 0.0f, "at rest the readings are at rest");
    const float phase = device.meter(2);
    render(device, 0.05f, kRate);
    EXPECT(device.meter(2) != phase, "but the cycle runs on");
    Stereo woken = run(device, impulse(0.5f, kRate, 0.5f));
    EXPECT(woken.left[kLatency] == 0.5f, "it wakes on new input");
  }

  // Cost: straight (a note younger than Wait every time) and at its worst
  // (both sides swaying apart, swelling, part way up Mix).
  {
    device.init(kRate);
    device.set_param(p::kWait, 4000.0f);
    std::vector<float> in = sine(330.0f, 10.0f, kRate, 0.3f);
    report_cost("late-vibrato, straight", 10.0f, kRate, [&] { run(device, in); });
    device.init(kRate);
    report_cost("late-vibrato, defaults", 10.0f, kRate, [&] { run(device, in); });
    device.init(kRate);
    device.set_param(p::kWait, 10.0f);
    device.set_param(p::kGrow, 20.0f);
    device.set_param(p::kDepth, 100.0f);
    device.set_param(p::kRate, 10.0f);
    device.set_param(p::kQuicken, 1.0f);
    device.set_param(p::kSwell, 1.0f);
    device.set_param(p::kHuman, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kMix, 0.5f);
    rng_state() = 0xBEEFu;
    std::vector<float> busy = added(noise(10.0f, kRate, 0.2f), in, 0);
    report_cost("late-vibrato, at its worst", 10.0f, kRate, [&] { run(device, busy); });
  }

  return finish("late-vibrato");
}
