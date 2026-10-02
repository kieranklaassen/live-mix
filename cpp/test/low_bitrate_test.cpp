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

// A rich sustained chord: five notes of thirty partials each, a little
// different left and right, over a quiet bed of noise.
static Stereo chord(float seconds, float rate, uint32_t seed = 0xC0DEu) {
  const size_t n = static_cast<size_t>(seconds * rate);
  Stereo s;
  s.left.assign(n, 0.0f);
  s.right.assign(n, 0.0f);
  const double notes[5] = {110.0, 164.81, 220.0, 277.18, 329.63};
  for (int c = 0; c < 5; ++c) {
    for (int h = 1; h <= 30; ++h) {
      const double left_hz = notes[c] * h * 1.0012, right_hz = notes[c] * h * 0.9988;
      if (left_hz > 16000.0) break;
      const double amp = 0.035 / std::pow(h, 0.9);
      for (size_t i = 0; i < n; ++i) {
        const double t = static_cast<double>(i) / rate;
        s.left[i] += static_cast<float>(amp * std::sin(2.0 * kPi * left_hz * t + c + h));
        s.right[i] += static_cast<float>(amp * std::sin(2.0 * kPi * right_hz * t + 2 * c + 1.7 * h));
      }
    }
  }
  rng_state() = seed;
  for (size_t i = 0; i < n; ++i) {
    s.left[i] += 0.0015f * white();
    s.right[i] += 0.0015f * white();
  }
  return s;
}

static livemix::kit::Fft<4096> analyser;

// Energy of x[from, to) between lo and hi Hz, in dB (1.0 = a full-scale
// sine): Hann-windowed 4096-point periodograms, half overlapped, averaged.
static double band_db(const std::vector<float>& x, double rate, double lo, double hi, size_t from, size_t to) {
  static float re[4096], im[4096];
  analyser.init();
  to = std::min(to, x.size());
  double sum = 0.0;
  int frames = 0;
  for (size_t at = from; at + 4096 <= to; at += 2048) {
    for (int i = 0; i < 4096; ++i) {
      re[i] = x[at + i] * static_cast<float>(0.5 - 0.5 * std::cos(2.0 * kPi * i / 4096.0));
      im[i] = 0.0f;
    }
    analyser.forward(re, im);
    for (int k = 0; k <= 2048; ++k) {
      const double hz = k * rate / 4096.0;
      if (hz >= lo && hz < hi) sum += static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
    }
    ++frames;
  }
  // A full-scale sine puts (N/4)² × 1.5 into its main lobe.
  return frames > 0 ? 10.0 * std::log10(sum / frames / (1024.0 * 1024.0 * 1.5) + 1.0e-20) : -200.0;
}

// Share of 256-sample blocks of x from `from` on whose level is under `level`.
static double quiet_share(const std::vector<float>& x, double level, size_t from) {
  int quiet = 0, blocks = 0;
  for (size_t at = from; at + 256 <= x.size(); at += 256, ++blocks) quiet += rms(x, at, at + 256) < level * 0.7071 ? 1 : 0;
  return blocks > 0 ? static_cast<double>(quiet) / blocks : 0.0;
}

// Number of runs of quiet blocks, and their mean length in samples.
static double count_holes(const std::vector<float>& x, double level, size_t from, double* mean_length) {
  int holes = 0, quiet = 0;
  bool inside = false;
  for (size_t at = from; at + 256 <= x.size(); at += 256) {
    const bool is_quiet = rms(x, at, at + 256) < level * 0.7071;
    if (is_quiet && !inside) ++holes;
    quiet += is_quiet ? 1 : 0;
    inside = is_quiet;
  }
  *mean_length = holes > 0 ? 256.0 * quiet / holes : 0.0;
  return holes;
}

static livemix::low_bitrate_dsp::Mdct<2048> grid;

// Share of the MDCT bins of the mid signal that are empty (under -80 dB of
// the frame's largest), on the device's own frame grid: the output of the
// codec analysed this way gives back the coefficients it kept.
static double empty_share(const Stereo& x, int n, size_t from, size_t to) {
  grid.init(n);
  std::vector<float> frame(2 * n), bins(n);
  double empty = 0.0;
  int frames = 0;
  for (size_t at = (from / n + 1) * n; at + 2 * n <= to; at += n) {
    for (int i = 0; i < 2 * n; ++i) frame[i] = 0.5f * (x.left[at + i] + x.right[at + i]) * grid.window()[i];
    grid.forward(frame.data(), bins.data());
    float largest = 0.0f;
    for (float v : bins) largest = std::max(largest, std::fabs(v));
    int count = 0;
    for (float v : bins) count += std::fabs(v) <= 1.0e-4f * largest ? 1 : 0;
    empty += static_cast<double>(count) / n;
    ++frames;
  }
  return frames > 0 ? empty / frames : 0.0;
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

  // Loss empties the spectrum and narrows it, and the level stays put.
  {
    const Stereo in = chord(4.0f, kRate);
    const float settings[6] = {0.0f, 0.2f, 0.4f, 0.6f, 0.8f, 1.0f};
    double empty[6], above[6], top[6], upper[6], level[6];
    for (int k = 0; k < 6; ++k) {
      clean(device);
      device.set_param(p::kLoss, settings[k]);
      Stereo out = run(device, in.left, in.right);
      const size_t from = 48000 + kLatency, to = out.size();
      empty[k] = empty_share(out, 512, from, to);
      above[k] = band_db(out.left, kRate, 8000.0, 24000.0, from, to);
      top[k] = band_db(out.left, kRate, 14000.0, 24000.0, from, to);
      upper[k] = band_db(out.left, kRate, 4500.0, 24000.0, from, to);
      level[k] = db(rms(out.left, from, to) / rms(in.left, 48000, in.size() - kLatency));
      std::printf("low-bitrate: Loss %.1f: %4.1f %% of bins empty, energy above 4.5/8/14 kHz %6.1f %6.1f %6.1f dB, "
                  "level %+.2f dB\n",
                  settings[k], 100.0 * empty[k], upper[k], above[k], top[k], level[k]);
      EXPECT(std::fabs(level[k]) < 3.0, "Standard: the level of a sustained chord stays within 3 dB at every Loss");
      if (k > 0) {
        EXPECT(empty[k] > empty[k - 1], "more Loss leaves more of the spectrum empty");
        EXPECT(above[k] < above[k - 1] + 1.0 && top[k] < top[k - 1] + 1.0 && upper[k] < upper[k - 1] + 1.0,
               "more Loss never widens the band");
      }
    }
    EXPECT(empty[0] < 0.1 && empty[2] > 0.5, "Loss 0 leaves the spectrum full, Loss 0.4 has emptied most of it");
    EXPECT(empty[3] > 0.9 && empty[5] > 0.98, "high Loss leaves a few partials");
    EXPECT(top[2] < top[0] - 10.0, "Loss 0.4 has taken the top above 14 kHz");
    EXPECT(above[4] < above[0] - 40.0, "Loss 0.8 has taken everything above 8 kHz");
    EXPECT(upper[5] < upper[0] - 40.0, "Loss 1 has taken everything above 4.5 kHz");
  }

  // Standard and Inverse split the stream between them: Inverse is the input
  // minus what Standard keeps (quantised), before each mode's own make-up
  // gain. On a steady sound those gains are steady, so two fitted scalars
  // make the two outputs add up to the input.
  {
    const Stereo in = chord(4.0f, kRate);
    Stereo part[2];
    for (int mode = 0; mode < 2; ++mode) {
      clean(device);
      device.set_param(p::kLoss, 0.6f);
      device.set_param(p::kMode, static_cast<float>(mode));
      part[mode] = run(device, in.left, in.right);
    }
    // Least squares for a·standard + b·inverse = input over the last 2 s.
    double ss = 0, si = 0, ii = 0, sx = 0, ix = 0, xx = 0;
    const size_t from = 96000;
    for (size_t i = from; i + kLatency < in.size(); ++i) {
      const double st = part[0].left[i + kLatency], iv = part[1].left[i + kLatency], x = in.left[i];
      ss += st * st; si += st * iv; ii += iv * iv; sx += st * x; ix += iv * x; xx += x * x;
    }
    const double det = ss * ii - si * si;
    const double a = (sx * ii - ix * si) / det, b = (ix * ss - sx * si) / det;
    double error = 0.0;
    for (size_t i = from; i + kLatency < in.size(); ++i) {
      const double d = a * part[0].left[i + kLatency] + b * part[1].left[i + kLatency] - in.left[i];
      error += d * d;
    }
    const double overlap = si / std::sqrt(ss * ii);
    std::printf("low-bitrate: Standard/%.3f + Inverse/%.3f = input to %.1f dB; the two correlate by %+.3f\n",
                1.0 / a, 1.0 / b, 10.0 * std::log10(error / xx), overlap);
    EXPECT(10.0 * std::log10(error / xx) < -40.0, "Standard plus Inverse, each without its make-up gain, is the input");
    EXPECT(1.0 / a >= 0.99 && 1.0 / a <= 2.01 && 1.0 / b >= 0.99 && 1.0 / b <= 8.01, "make-up gains are within their limits");
    EXPECT(rms(part[1].left, from) > 0.1 * rms(in.left, from), "Inverse is audible at Loss 0.6");
  }

  // Jitter: every third octave keeps its level while the waveform stops
  // resembling the input.
  {
    rng_state() = 0x1177u;
    const std::vector<float> in = noise(6.0f, kRate, 0.3f);
    const float settings[4] = {0.0f, 0.25f, 0.5f, 1.0f};
    double alike[4];
    for (int k = 0; k < 4; ++k) {
      clean(device);
      device.set_param(p::kMode, 2.0f);
      device.set_param(p::kLoss, settings[k]);
      Stereo out = run(device, in);
      std::vector<float> late(out.left.begin() + kLatency, out.left.end());
      alike[k] = correlation(in, late, 24000);
      double worst = 0.0;
      for (double hz = 100.0; hz < 16000.0; hz *= std::pow(2.0, 1.0 / 3.0)) {
        const double hi = hz * std::pow(2.0, 1.0 / 3.0);
        const double change = band_db(late, kRate, hz, hi, 24000, late.size()) -
                              band_db(in, kRate, hz, hi, 24000, late.size());
        if (std::fabs(change) > std::fabs(worst)) worst = change;
      }
      std::printf("low-bitrate: Jitter at Loss %.2f: correlation with the input %.3f, worst third octave %+.2f dB\n",
                  settings[k], alike[k], worst);
      EXPECT(std::fabs(worst) < 2.0, "Jitter keeps the long-term spectrum within 2 dB per third octave");
      EXPECT(correlation(out.left, out.right, 24000) > 0.999, "Jitter keeps a mono input mono");
    }
    EXPECT(alike[0] > 0.9999, "Jitter at Loss 0 is the input");
    EXPECT(alike[1] < 0.97 && alike[2] < alike[1] - 0.1 && alike[3] < alike[2] - 0.1,
           "Jitter: the correlation with the input falls as Loss rises");
    EXPECT(std::fabs(alike[3]) < 0.1, "Jitter at full Loss has nothing of the input's waveform left");
  }

  // Dropouts: the share of the stream that goes missing is 0.5 × Dropouts^1.5,
  // Burst sets how long each hole is, and a hole has no click at any Frame.
  {
    const std::vector<float> tone = sine(1000.0f, 40.0f, kRate, 0.5f);
    const float settings[3] = {0.3f, 0.6f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      clean(device);
      device.set_param(p::kDropouts, settings[k]);
      Stereo out = run(device, tone);
      const double expected = 0.5 * std::pow(settings[k], 1.5);
      const double share = quiet_share(out.left, 0.25, kLatency + 4096);
      std::printf("low-bitrate: Dropouts %.1f: %.1f %% of the stream missing (%.1f %% intended)\n", settings[k],
                  100.0 * share, 100.0 * expected);
      EXPECT_NEAR(share, expected, 0.3 * expected, "the share of lost packets follows Dropouts");
    }
    double holes[2], length[2];
    for (int k = 0; k < 2; ++k) {
      clean(device);
      device.set_param(p::kDropouts, 0.6f);
      device.set_param(p::kBurst, k == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, tone);
      holes[k] = count_holes(out.left, 0.25, kLatency + 4096, &length[k]);
      std::printf("low-bitrate: Burst %d: %.0f holes in 40 s, %.0f ms long on average\n", k, holes[k],
                  1000.0 * length[k] / kRate);
    }
    EXPECT(holes[0] > 4.0 * holes[1], "low Burst: many holes; high Burst: few");
    EXPECT(length[0] < 0.045 * kRate && length[1] > 0.3 * kRate && length[1] < 0.7 * kRate,
           "Burst sets the length of a hole from a packet to half a second");

    const std::vector<float> low = sine(100.0f, 20.0f, kRate, 0.5f);
    const double own_step = max_step(low);
    for (int frame = 0; frame < 3; ++frame) {
      clean(device);
      device.set_param(p::kFrame, static_cast<float>(frame));
      device.set_param(p::kDropouts, 0.7f);
      Stereo out = run(device, low);
      double quietest = 1.0;
      for (size_t at = kLatency + 4096; at + 256 <= out.size(); at += 256) {
        quietest = std::min(quietest, rms(out.left, at, at + 256));
      }
      std::printf("low-bitrate: frame %d: largest step through dropouts %.4f (the tone alone %.4f), a hole is %.0f dB\n",
                  frame, max_step(out.left), own_step, db(quietest / 0.3536));
      EXPECT(max_step(out.left) < own_step + 0.004, "a dropout is a hole without a click");
      EXPECT(quietest < 0.3536e-4, "a dropout reaches silence");
    }
  }

  // Stutter: the share of the stream that is stuck is 0.5 × Stutter^1.5, and
  // a stuck stream repeats one packet (21 ms: 1024 samples at 48 kHz, 2048
  // at 96 kHz) a little quieter each time.
  for (float rate : {48000.0f, 96000.0f}) {
    rng_state() = 0x57u;
    const std::vector<float> in = noise(40.0f, rate, 0.3f);
    const size_t packet = rate > 70000.0f ? 2048 : 1024;
    const float settings[3] = {0.3f, 0.6f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      clean(device, rate);
      device.set_param(p::kStutter, settings[k]);
      Stereo out = run(device, in);
      // Where the stream flows the output is the input; where it is stuck it is not.
      int wrong = 0, blocks = 0;
      for (size_t at = 8192; at + 256 + kLatency <= out.size(); at += 256, ++blocks) {
        double error = 0.0, reference = 0.0;
        for (size_t i = at; i < at + 256; ++i) {
          const double d = out.left[i + kLatency] - static_cast<double>(in[i]);
          error += d * d;
          reference += static_cast<double>(in[i]) * in[i];
        }
        wrong += error > reference ? 1 : 0;
      }
      const double share = static_cast<double>(wrong) / blocks, expected = 0.5 * std::pow(settings[k], 1.5);
      std::printf("low-bitrate: %.0f Hz, Stutter %.1f: %.1f %% of the stream stuck (%.1f %% intended)\n", rate,
                  settings[k], 100.0 * share, 100.0 * expected);
      EXPECT_NEAR(share, expected, 0.3 * expected, "the share of stuck packets follows Stutter");
    }
    for (int frame = 0; frame < 3; ++frame) {
      clean(device, rate);
      device.set_param(p::kFrame, static_cast<float>(frame));
      device.set_param(p::kStutter, 0.8f);
      device.set_param(p::kBurst, 1.0f);
      Stereo out = run(device, in);
      // The strongest repetition one packet apart over any quarter second,
      // against the same for a lag that is not the packet.
      double repeat = 0.0, other = 0.0, ratio = 0.0;
      const size_t span = static_cast<size_t>(0.25f * rate);
      for (size_t at = 16384; at + span + 2 * packet <= out.size(); at += span / 2) {
        std::vector<float> a(out.left.begin() + at, out.left.begin() + at + span);
        std::vector<float> b(out.left.begin() + at + packet, out.left.begin() + at + packet + span);
        std::vector<float> c(out.left.begin() + at + packet * 3 / 4, out.left.begin() + at + packet * 3 / 4 + span);
        const double r = correlation(a, b);
        if (r > repeat) {
          repeat = r;
          other = correlation(a, c);
          ratio = rms(b) / rms(a);
        }
      }
      std::printf("low-bitrate: %.0f Hz, frame %d: a stuck stream repeats every %zu samples (correlation %.3f, "
                  "%.3f at 3/4 of that), each round %+.2f dB\n",
                  rate, frame, packet, repeat, other, db(ratio));
      EXPECT(repeat > 0.98 && std::fabs(other) < 0.5, "a stuck stream repeats with the period of one packet");
      EXPECT(db(ratio) < -0.3 && db(ratio) > -0.8, "each replay of a stuck packet is half a decibel quieter");
    }
  }

  // A steady tone through every mode and frame size: no click where frames
  // join, no DC, and the tone is still the loudest thing there.
  {
    const std::vector<float> tone = sine(440.0f, 3.0f, kRate, 0.5f);
    const double own_step = max_step(tone);
    for (int mode = 0; mode < 3; ++mode) {
      for (int frame = 0; frame < 3; ++frame) {
        clean(device);
        device.set_param(p::kLoss, 0.6f);
        device.set_param(p::kMode, static_cast<float>(mode));
        device.set_param(p::kFrame, static_cast<float>(frame));
        Stereo out = run(device, tone);
        const size_t from = 24000;
        const double step = max_step(out.left, from), dc = mean(out.left, from);
        std::printf("low-bitrate: 440 Hz, mode %d, frame %d: largest step %.4f (tone %.4f), DC %+.5f, level %+.1f dB\n",
                    mode, frame, step, own_step, dc, db(rms(out.left, from) / 0.3536));
        // Standard leaves the tone a tone. Inverse and Jitter turn it into
        // something broader, whose own steps are steeper; a click where two
        // frames fail to join would be a jump of the tone's amplitude.
        EXPECT(step < (mode == 0 ? 1.5 * own_step : 0.2 * 0.5), "no click at frame boundaries on a steady tone");
        EXPECT(std::fabs(dc) < 1.0e-3, "no DC");
        if (mode != 1) {
          EXPECT_NEAR(dominant_frequency(out.left, kRate, 200.0, 900.0, from, from + 48000), 440.0, 3.0,
                      "the tone is still at its frequency");
        }
      }
    }
  }

  // Loss swept over its whole range while a chord sounds: no click, and the
  // level holds.
  {
    const Stereo in = chord(6.0f, kRate);
    for (int frame = 0; frame < 3; ++frame) {
      clean(device);
      device.set_param(p::kFrame, static_cast<float>(frame));
      Stereo out;
      double lowest = 1.0e9, highest = 0.0;
      for (int step = 0; step < 6 * 375; ++step) {
        const float t = static_cast<float>(step) / (6 * 375);
        device.set_param(p::kLoss, t < 0.5f ? 2.0f * t : 2.0f - 2.0f * t);
        std::vector<float> l(in.left.begin() + step * 128, in.left.begin() + (step + 1) * 128);
        std::vector<float> r(in.right.begin() + step * 128, in.right.begin() + (step + 1) * 128);
        Stereo piece = run(device, l, r);
        out = concat(out, piece);
      }
      for (size_t at = 24000; at + 12000 <= out.size(); at += 12000) {
        const double level = rms(out.left, at, at + 12000) / rms(in.left, at - kLatency, at - kLatency + 12000);
        lowest = std::min(lowest, level);
        highest = std::max(highest, level);
      }
      std::printf("low-bitrate: frame %d, Loss swept 0 to 1 and back: largest step %.4f (dry %.4f), level %+.2f to %+.2f dB re dry\n",
                  frame, max_step(out.left, 8192), max_step(in.left), db(lowest), db(highest));
      EXPECT(max_step(out.left, 8192) < 1.5 * max_step(in.left), "sweeping Loss does not click");
      EXPECT(db(lowest) > -3.0 && db(highest) < 3.0, "sweeping Loss keeps the level within 3 dB of the dry sound");
    }
  }

  // Smear: what the stream leaves hangs on for 30 s × Smear³ (to -60 dB), a
  // steady tone is left as it is, and at the top nothing fades.
  {
    for (float smear : {0.4f, 0.6f}) {
      clean(device);
      device.set_param(p::kSmear, smear);
      rng_state() = 0xB1u;
      const double expected = 30.0 * smear * smear * smear;
      std::vector<float> burst = noise(0.5f, kRate, 0.4f);
      burst.resize(static_cast<size_t>((expected + 2.0) * kRate), 0.0f);
      Stereo out = run(device, burst);
      const double measured = rt60(out.left, kRate, 0.8, 0.1, -70.0);
      std::printf("low-bitrate: Smear %.1f: what hangs falls 60 dB in %.2f s (%.2f s intended)\n", smear, measured,
                  expected);
      EXPECT_NEAR(measured, expected, 0.15 * expected, "Smear sets how long the spectrum hangs");
    }
    clean(device);
    std::vector<float> burst = noise(0.5f, kRate, 0.4f);
    burst.resize(96000, 0.0f);
    Stereo none = run(device, burst);
    EXPECT(peak(none.left, 24000 + kLatency + 2048) == 0.0, "Smear 0: nothing hangs");

    clean(device);
    device.set_param(p::kSmear, 0.7f);
    Stereo steady = run(device, sine(440.0f, 3.0f, kRate, 0.4f));
    EXPECT_NEAR(db(tone_level(steady.left, 440.0, kRate, 48000, 144000) / 0.4), 0.0, 0.5,
                "Smear leaves a steady tone at its level");

    // Frozen: a chord, then silence. The wash holds its level and is no
    // louder than the chord was; new sound is collected into it.
    const Stereo in = chord(3.0f, kRate);
    clean(device);
    device.set_param(p::kSmear, 1.0f);
    run(device, in.left, in.right);
    Stereo wash = render(device, 30.0f, kRate);
    const double early = rms(wash.left, 48000, 240000), late = rms(wash.left, 1200000, 1440000);
    std::printf("low-bitrate: Smear 1: the wash is %+.1f dB re the chord, %+.2f dB after 25 s more; L/R correlation %.2f\n",
                db(early / rms(in.left)), db(late / early), correlation(wash.left, wash.right, 48000));
    EXPECT(std::fabs(db(late / early)) < 1.0, "Smear 1: the wash does not fade");
    EXPECT(db(early / rms(in.left)) < 1.0 && db(early / rms(in.left)) > -6.0, "Smear 1: the wash is about as loud as its source");
    Stereo more = run(device, sine(3000.0f, 1.0f, kRate, 0.3f));
    Stereo after = render(device, 3.0f, kRate);
    EXPECT(band_db(after.left, kRate, 2800.0, 3200.0, 48000, after.size()) >
               band_db(wash.left, kRate, 2800.0, 3200.0, 48000, 240000) + 10.0,
           "Smear 1: new sound is collected into the wash");
    std::printf("low-bitrate: Smear 1: with a louder tone collected, the wash is %+.1f dB re that tone\n",
                db(rms(after.left, 48000) / (0.3 * 0.7071)));
    EXPECT(peak(more.left) < 1.0 && rms(after.left, 48000) < 1.12 * 0.3 * 0.7071,
           "Smear 1: the wash is never louder than the loudest sound that fed it");
    device.set_param(p::kSmear, 0.0f);
    render(device, 1.0f, kRate);
    Stereo gone = render(device, 0.5f, kRate);
    EXPECT(peak(gone.left) == 0.0 && peak(gone.right) == 0.0, "Smear back to 0: the wash is let go, then silence");
  }

  // Stereo: as Loss rises the side signal is dropped from the top down, as
  // far as Stereo allows; a mono input stays mono; bass keeps its place.
  {
    rng_state() = 0x5E1u;
    const std::vector<float> left = noise(4.0f, kRate, 0.3f), right = noise(4.0f, kRate, 0.3f);
    auto side_db = [&](float stereo, float loss, double lo, double hi) {
      clean(device);
      device.set_param(p::kMode, 2.0f);  // Jitter: all magnitudes kept, so only the collapse acts
      device.set_param(p::kLoss, loss);
      device.set_param(p::kStereo, stereo);
      Stereo out = run(device, left, right);
      std::vector<float> side(out.size()), mid(out.size());
      for (size_t i = 0; i < out.size(); ++i) {
        side[i] = 0.5f * (out.left[i] - out.right[i]);
        mid[i] = 0.5f * (out.left[i] + out.right[i]);
      }
      return band_db(side, kRate, lo, hi, 24000, side.size()) - band_db(mid, kRate, lo, hi, 24000, mid.size());
    };
    const double kept_high = side_db(1.0f, 1.0f, 6000.0, 12000.0);
    const double default_high = side_db(0.7f, 0.5f, 9000.0, 16000.0), default_mid = side_db(0.7f, 0.5f, 300.0, 3000.0);
    const double half_high = side_db(0.5f, 1.0f, 2000.0, 12000.0), half_low = side_db(0.5f, 1.0f, 50.0, 300.0);
    const double none = side_db(0.0f, 1.0f, 20.0, 20000.0);
    std::printf("low-bitrate: side re mid: Stereo 1 %+.1f dB (6 to 12 kHz); defaults %+.1f dB above 9 kHz, %+.1f dB "
                "at 0.3 to 3 kHz; Stereo 0.5 at full Loss %+.1f dB above 2 kHz, %+.1f dB under 300 Hz; Stereo 0 %+.1f dB\n",
                kept_high, default_high, default_mid, half_high, half_low, none);
    EXPECT(std::fabs(kept_high) < 1.0, "Stereo 1 keeps the image at any Loss");
    EXPECT(default_high < -20.0 && std::fabs(default_mid) < 1.0, "defaults: the top is folded to mono, the middle is not");
    EXPECT(half_high < -40.0 && std::fabs(half_low) < 1.5, "Stereo 0.5 at full Loss: mono above 2 kHz, bass image kept");
    EXPECT(none < -60.0, "Stereo 0 at full Loss is mono");

    for (int mode = 0; mode < 3; ++mode) {
      device.init(kRate);
      device.set_param(p::kMode, static_cast<float>(mode));
      device.set_param(p::kSmear, 0.5f);
      device.set_param(p::kStutter, 0.3f);
      Stereo out = run(device, left);
      EXPECT(correlation(out.left, out.right, 24000) > 0.9999, "a mono input stays mono in every mode");
    }
  }

  // High Cut removes what is above it from the wet sound in every mode.
  {
    rng_state() = 0xC07u;
    const std::vector<float> in = noise(3.0f, kRate, 0.3f);
    for (int mode = 0; mode < 3; ++mode) {
      clean(device);
      device.set_param(p::kMode, static_cast<float>(mode));
      device.set_param(p::kLoss, 0.3f);
      device.set_param(p::kHighCut, 3000.0f);
      Stereo out = run(device, in);
      const double above = band_db(out.left, kRate, 3600.0, 24000.0, 24000, out.size());
      const double below = band_db(out.left, kRate, 200.0, 2500.0, 24000, out.size());
      const double dry_below = band_db(in, kRate, 200.0, 2500.0, 24000, in.size());
      std::printf("low-bitrate: mode %d, High Cut 3 kHz: %.1f dB above 3.6 kHz, %+.1f dB re dry below 2.5 kHz\n", mode,
                  above - below, below - dry_below);
      EXPECT(above - below < -50.0, "High Cut removes what is above it");
    }
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("low-bitrate", 10.0f, kRate, [&] { run(device, input); });

  return finish("low-bitrate");
}
