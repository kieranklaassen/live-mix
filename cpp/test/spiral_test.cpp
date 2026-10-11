// Native harness for Spiral (cpp/devices/spiral). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a tail that climbs without arriving.

#include "../devices/spiral/spiral.h"
#include "support/test_kit.h"

#include <complex>
#include <ctime>

using namespace testkit;
using livemix::Spiral;
namespace p = livemix::spiral;

static Spiral device;

static const float kRate = 48000.0f;

// The bell of spiral.h: the level of a voice at the share x of the range.
static double bell_at(double x, double spread) {
  if (!(x > 0.0 && x < 1.0)) return 0.0;
  return std::pow(std::sin(kPi * x), 2.0 * 4.0 * std::pow(0.5 / 4.0, spread));
}

// The levels of the six voices at glide position `glide` (octaves), each
// with its shift in octaves, as control() of spiral.h makes them.
struct Stack {
  double shift[6];
  double level[6];
};
static Stack stack_at(double glide, int voices, double spread) {
  Stack s;
  const double lowest = 3.0 - (voices + 1) / 2;
  double total = 0.0;
  for (int v = 0; v < 6; ++v) {
    const double u = std::fmod(glide + v, 6.0);
    s.shift[v] = u - 3.0;
    s.level[v] = bell_at((u - lowest) / voices, spread);
    total += s.level[v] * s.level[v];
  }
  for (int v = 0; v < 6; ++v) s.level[v] /= std::sqrt(total);
  return s;
}

// A device set for measuring the wet path alone: no blur, an open tone.
static void wet_only(Spiral& d) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kBlur, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kDecay, 3.0f);
}

// A held note as the bank's: three partials (1, 1/2 and 1/4 at f, 2f and
// 3f) for each MIDI note, the whole at -20 dBFS RMS, faded in over 20 ms.
static std::vector<float> held_notes(const std::vector<int>& notes, float seconds, float rate = kRate) {
  const size_t frames = static_cast<size_t>(seconds * rate + 0.5f);
  std::vector<double> sum(frames, 0.0);
  for (int note : notes) {
    const double hz = 440.0 * std::pow(2.0, (note - 69) / 12.0);
    for (int part = 1; part <= 3; ++part) {
      const double w = 2.0 * kPi * hz * part / rate;
      const double level = 1.0 / std::pow(2.0, part - 1);
      const double phase = note * 0.7 + part;
      for (size_t i = 0; i < frames; ++i) sum[i] += level * std::sin(w * static_cast<double>(i) + phase);
    }
  }
  double power = 0.0;
  for (double v : sum) power += v * v;
  const double scale = 0.1 / std::sqrt(power / static_cast<double>(frames));
  const double fade = 0.02 * rate;
  std::vector<float> out(frames);
  for (size_t i = 0; i < frames; ++i) {
    out[i] = static_cast<float>(sum[i] * scale * std::min(1.0, static_cast<double>(i) / fade));
  }
  return out;
}

// What the two sides of `out` hold, in quarter-second windows from 1 s: the
// level of the two sides together against `dry` (mean and lowest window),
// their sum to mono under that (lowest window), the larger difference in
// level between the two sides, and the lowest correlation between them.
struct Fold {
  double level = 0.0, level_low = 100.0, fold_low = 100.0, sides_apart = 0.0, correlation_low = 1.0;
  double side_under_middle = 0.0;
};
static Fold fold_of(const std::vector<float>& dry, const Stereo& out, float rate = kRate) {
  Fold f;
  const size_t window = static_cast<size_t>(0.25f * rate);
  double side = 0.0, middle = 0.0;
  int count = 0;
  for (size_t at = static_cast<size_t>(rate); at + window <= dry.size(); at += window) {
    double dd = 0.0, ll = 0.0, rr = 0.0, lr = 0.0;
    for (size_t i = at; i < at + window; ++i) {
      const double l = out.left[i], r = out.right[i];
      dd += static_cast<double>(dry[i]) * dry[i];
      ll += l * l;
      rr += r * r;
      lr += l * r;
    }
    const double both = 0.5 * (ll + rr);
    const double mono = 0.25 * (ll + rr + 2.0 * lr);
    const double level = 10.0 * std::log10(std::max(both, 1.0e-20) / dd);
    f.level += level;
    f.level_low = std::min(f.level_low, level);
    f.fold_low = std::min(f.fold_low, 10.0 * std::log10(std::max(mono, 1.0e-20) / std::max(both, 1.0e-20)));
    f.sides_apart = std::max(f.sides_apart, std::fabs(10.0 * std::log10(std::max(ll, 1.0e-20) / std::max(rr, 1.0e-20))));
    f.correlation_low = std::min(f.correlation_low, lr / std::sqrt(std::max(ll * rr, 1.0e-30)));
    side += 0.25 * (ll + rr - 2.0 * lr);
    middle += mono;
    ++count;
  }
  f.level /= count;
  f.side_under_middle = 10.0 * std::log10(std::max(side, 1.0e-20) / std::max(middle, 1.0e-20));
  return f;
}

// The slowest Climb that is not the centre (where the clock goes home to a
// whole octave): the clock all but stands, a thousandth of an octave a second.
static const float kCreep = 0.06f;

// Run the glide clock on to `octaves` with no sound: asleep, at 12 octaves
// a minute, then leave Climb at `after`.
static void turn_to(Spiral& d, float octaves, float after) {
  d.set_param(p::kClimb, 12.0f);
  render(d, octaves * 5.0f, kRate);
  d.set_param(p::kClimb, after);
}

// RMS in dB of consecutive windows of `x` from `from` seconds: the highest
// less the lowest.
static double level_swing(const std::vector<float>& x, double from, double window) {
  const size_t n = static_cast<size_t>(window * kRate);
  double lo = 1.0e9, hi = -1.0e9;
  for (size_t at = static_cast<size_t>(from * kRate); at + n <= x.size(); at += n) {
    const double level = db(rms(x, at, at + n));
    lo = std::min(lo, level);
    hi = std::max(hi, level);
  }
  return hi - lo;
}

// A chord held at full scale: three notes whose sum peaks at 1.
static std::vector<float> chord(float seconds, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / kRate;
    out[i] = gain * static_cast<float>((std::sin(2.0 * kPi * 220.0 * t) + std::sin(2.0 * kPi * 277.18 * t) +
                                        std::sin(2.0 * kPi * 329.63 * t)) / 3.0);
  }
  return out;
}

// A plain FFT (in place, a power of two) for the spectrum checks.
static void fft(std::vector<std::complex<double>>& a) {
  const size_t n = a.size();
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> turn(std::cos(-2.0 * kPi / len), std::sin(-2.0 * kPi / len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w(1.0, 0.0);
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= turn;
      }
    }
  }
}

// The power in each bin of `n` samples of `x` from `from`, under a Hann window.
static std::vector<double> power_of(const std::vector<float>& x, size_t from, size_t n) {
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    a[i] = x[from + i] * (0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n)));
  }
  fft(a);
  std::vector<double> out(n / 2);
  for (size_t k = 0; k < n / 2; ++k) out[k] = std::norm(a[k]);
  return out;
}

// The power in sixth-octave bands from 40 Hz to 16 kHz of 4096 samples from `from`.
static std::vector<double> band_powers(const std::vector<float>& x, size_t from) {
  const std::vector<double> power = power_of(x, from, 4096);
  std::vector<double> out(52, 0.0);
  for (size_t k = 1; k < power.size(); ++k) {
    const int band = static_cast<int>(std::floor(6.0 * std::log2(static_cast<double>(k) * kRate / 4096.0 / 40.0)));
    if (band >= 0 && band < 52) out[band] += power[k];
  }
  return out;
}

int main() {
  Conformance spec;
  spec.name = "spiral";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 30.0f;
  spec.max_peak = 2.0f;
  check_effect(device, spec, kRate);

  // 1. The glide. A held 440 Hz sine comes out as a partial at 440 x 2^(u - 3)
  // for the voice at u = P + v, and P moves at Climb octaves a minute from
  // where the clock stood: up for one sign, down for the other, still at 0.
  // Two voices under a narrow bell, so one partial leads.
  for (float climb : {6.0f, -6.0f, kCreep}) {
    wet_only(device);
    device.set_param(p::kVoices, 2.0f);
    device.set_param(p::kSpread, 0.0f);
    const float start = climb < 0.0f ? 1.2f : 0.8f;
    turn_to(device, start, climb);
    Stereo out = run(device, sine(440.0f, 6.2f, kRate, 0.25f));
    double worst = 0.0;
    double first = 0.0, last = 0.0;
    for (float t : {2.0f, 4.0f, 6.0f}) {
      const size_t from = static_cast<size_t>((t - 0.1f) * kRate);
      const double found = dominant_frequency(out.left, kRate, 300.0, 650.0, from, from + 9600);
      // P at time t, and the voice that stands in the middle octave.
      const double glide = start + climb / 60.0 * t;
      const double expected = 440.0 * std::exp2(glide - 1.0);
      worst = std::max(worst, std::fabs(1200.0 * std::log2(found / expected)));
      if (t == 2.0f) first = found;
      last = found;
    }
    std::printf("glide at %+.2f oct/min: partial moved %.1f cents in 4 s (%.1f expected), worst error %.1f cents\n",
                climb, 1200.0 * std::log2(last / first), 1200.0 * climb / 15.0, worst);
    EXPECT(worst < 12.0, "a partial of the tail stands where the glide clock says");
    const double moved = 12.0 * std::log2(last / first);
    if (climb == 6.0f) EXPECT_NEAR(moved, 4.8, 0.2, "the tail climbs at Climb octaves a minute");
    if (climb < 0.0f) EXPECT_NEAR(moved, -4.8, 0.2, "the tail sinks at Climb octaves a minute");
    if (climb == kCreep) EXPECT_NEAR(moved, 0.048, 0.05, "the tail all but stands at the slowest Climb");
  }

  // 2. The bell. With the clock at 0.5 and four voices, the partials of a
  // held sine stand at -1.5, -0.5, +0.5 and +1.5 octaves, as loud against
  // each other as sin(pi x)^(2q) says, at a wide and at a middle Spread; a
  // fifth and a sixth voice are silent.
  for (float spread : {1.0f, 0.5f}) {
    wet_only(device);
    device.set_param(p::kVoices, 4.0f);
    device.set_param(p::kSpread, spread);
    turn_to(device, 0.5f, kCreep);
    Stereo out = run(device, sine(440.0f, 4.0f, kRate, 0.25f));
    // The clock creeps on: read half a second about 3.25 s, where it stands at 0.50325.
    const Stack stack = stack_at(0.5 + kCreep / 60.0 * 3.25, 4, spread);
    const size_t from = static_cast<size_t>(3.0f * kRate), to = static_cast<size_t>(3.5f * kRate);
    double level[6];
    for (int v = 0; v < 6; ++v) {
      level[v] = tone_level(out.left, 440.0 * std::exp2(stack.shift[v]), kRate, from, to);
    }
    // Voice 3 stands at +0.5 octaves: the others against it.
    for (int v = 0; v < 6; ++v) {
      if (v == 3) continue;
      const double measured = db(level[v] / level[3]);
      if (stack.level[v] > 0.0) {
        const double expected = db(stack.level[v] / stack.level[3]);
        std::printf("bell at Spread %.1f: voice at %+.1f oct is %.2f dB against the one at +0.5 (%.2f by the formula)\n",
                    spread, stack.shift[v], measured, expected);
        EXPECT_NEAR(measured, expected, 1.5, "a voice is as loud as the bell says");
      } else {
        EXPECT(measured < -50.0, "a voice outside the octaves that sound is silent");
      }
    }
  }

  // The same all the way round the clock: at each of its six octaves the
  // four voices that should sound do, at the bell's levels, and the other
  // two are silent. (A sinking tail starts at the top of the clock.)
  for (int octave = 0; octave < 6; ++octave) {
    wet_only(device);
    device.set_param(p::kVoices, 4.0f);
    device.set_param(p::kSpread, 1.0f);
    turn_to(device, octave + 0.5f, kCreep);
    Stereo out = run(device, sine(440.0f, 4.0f, kRate, 0.25f));
    const Stack stack = stack_at(octave + 0.5 + kCreep / 60.0 * 3.25, 4, 1.0);
    const size_t from = static_cast<size_t>(3.0f * kRate), to = static_cast<size_t>(3.5f * kRate);
    double level[6], total = 0.0;
    for (int v = 0; v < 6; ++v) {
      level[v] = tone_level(out.left, 440.0 * std::exp2(stack.shift[v]), kRate, from, to);
      total += level[v] * level[v];
    }
    double worst = 0.0;
    for (int v = 0; v < 6; ++v) {
      const double share = level[v] / std::sqrt(total);
      worst = std::max(worst, std::fabs(share - stack.level[v]));
    }
    std::printf("clock at %d.5 octaves: the six voices are within %.3f of the bell's shares\n", octave, worst);
    EXPECT(worst < 0.05, "the stack is the bell's at every octave of the clock");
  }

  // 3. Through a wrap. Steady noise in, the clock running at 12 octaves a
  // minute: a voice leaves at the top and one enters at the bottom every
  // five seconds, and the level of the tail does not move by a dB.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kClimb, 12.0f);
    device.set_param(p::kDecay, 2.0f);
    device.set_param(p::kTone, 16000.0f);
    // Noise in the band a played sound is in (200 Hz to 1.2 kHz): white
    // noise would lose to Tone and to the top of the band whatever a voice
    // carries up there, and that is the pitch shift, not the bell.
    rng_state() = 0xA11CEu;
    std::vector<float> band = noise(17.0f, kRate, 1.0f);
    double low = 0.0, high = 0.0;
    for (float& v : band) {
      high += 0.145 * (v - high);
      low += 0.026 * (high - low);
      v = static_cast<float>(high - low);
    }
    Stereo out = run(device, band);
    const double swing = level_swing(out.left, 2.0, 0.5);
    std::printf("through three wraps, band noise: the tail's level moves by %.2f dB (0.5 s windows)\n", swing);
    // Noise is the hard case for the voices, not for the bell: their heads
    // agree near unison and not far from it, which is up to 3 dB.
    EXPECT(swing < 2.5, "the level of a noise tail keeps within the shifter's 3 dB while voices wrap");
    EXPECT(device.meter(0) > 3.3f && device.meter(0) < 3.5f, "the clock went through three wraps");
  }
  // The same for a held sine, whose partials are the bell itself.
  {
    wet_only(device);
    device.set_param(p::kClimb, 12.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo out = run(device, sine(330.0f, 17.0f, kRate, 0.25f));
    const double swing = level_swing(out.left, 2.0, 0.5);
    std::printf("through three wraps, a held sine: the tail's level moves by %.2f dB\n", swing);
    EXPECT(swing < 1.0, "the partials of a held note keep their sum while voices wrap");
    wet_only(device);
    device.set_param(p::kClimb, 12.0f);
    device.set_param(p::kBlur, 0.5f);
    Stereo held = run(device, chord(17.0f, 0.5f));
    const double chord_swing = level_swing(held.left, 2.0, 0.5);
    std::printf("through three wraps, a held chord: the tail's level moves by %.2f dB\n", chord_swing);
    EXPECT(chord_swing < 3.0, "a held chord keeps its level while voices wrap");
  }

  // 4. Decay sets RT60, at every glide rate: the voices move the pitch of
  // the tail and leave its length alone.
  for (float decay : {1.5f, 6.0f}) {
    for (float climb : {0.0f, 12.0f}) {
      wet_only(device);
      device.set_param(p::kDecay, decay);
      device.set_param(p::kClimb, climb);
      rng_state() = 0xD0D0u;
      std::vector<float> burst = noise(0.3f, kRate, 0.5f);
      burst.resize(static_cast<size_t>(kRate * (decay * 1.3f + 1.0f)), 0.0f);
      Stereo out = run(device, burst);
      const double measured = rt60(out.left, kRate, 0.6, 0.1, -80.0);
      std::printf("Decay %.1f s at %+.0f oct/min: RT60 %.2f s\n", decay, climb, measured);
      EXPECT(measured > decay * 0.8 && measured < decay * 1.25, "Decay sets the RT60 of the tail");
    }
  }

  // 5. Mix 0 is the input, sample for sample, while the tail rings unheard.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0x5EEDu;
    std::vector<float> in = noise(1.0f, kRate, 0.5f);
    Stereo out = run(device, in);
    bool same = true;
    for (size_t i = 0; i < in.size(); ++i) same = same && out.left[i] == in[i] && out.right[i] == in[i];
    EXPECT(same, "Mix 0 passes the input sample for sample");
  }

  // 6. Level. A held chord at full scale for a minute, at the defaults and
  // at the ends of every control: never more than 6 dB over the input, and
  // no louder in its last ten seconds than in its second ten. And Decay is
  // not a volume knob: the held chord is as loud at 1 s as at 60 s.
  {
    const std::vector<float> held = chord(60.0f, 1.0f);
    double worst_peak = 0.0, worst_growth = -100.0;
    for (int which = -1; which < 2 * p::kNumParams; ++which) {
      device.init(kRate);
      if (which >= 0) {
        const int id = which / 2;
        device.set_param(id, which % 2 ? p::kParamMax[id] : p::kParamMin[id]);
      }
      Stereo out = run(device, held);
      const double high = std::max(peak(out.left), peak(out.right));
      const double growth = db(rms(out.left, 50 * 48000, 60 * 48000) / rms(out.left, 10 * 48000, 20 * 48000));
      worst_peak = std::max(worst_peak, high);
      worst_growth = std::max(worst_growth, growth);
    }
    std::printf("held full-scale chord, 60 s, every control at each end: peak %.2f (%.1f dB), growth %.2f dB\n",
                worst_peak, db(worst_peak), worst_growth);
    EXPECT(worst_peak < 2.0, "a held full-scale chord stays within 6 dB of the input");
    EXPECT(worst_growth < 1.0, "a held chord does not pile up");

    double level[2];
    int n = 0;
    for (float decay : {1.0f, 60.0f}) {
      wet_only(device);
      device.set_param(p::kDecay, decay);
      device.set_param(p::kBlur, 0.5f);
      Stereo out = run(device, chord(40.0f, 0.1f));
      level[n++] = db(rms(out.left, 30 * 48000, 40 * 48000) / (0.1 * 0.408));
    }
    std::printf("held chord, wet alone against the input: %.1f dB at Decay 1 s, %.1f dB at 60 s\n", level[0], level[1]);
    EXPECT(std::fabs(level[0] - level[1]) < 2.5, "Decay does not change the level of a held sound");
    EXPECT(level[0] > -4.0 && level[0] < 3.0 && level[1] > -4.0 && level[1] < 3.0,
           "the wet path of a held chord is about as loud as the chord");
  }

  // 7. Part-way Mix. Held tones over the keyboard through the default: the
  // output is never far under the input (the wet path is at other pitches,
  // so it cannot cancel the dry one for long).
  {
    double worst = 100.0, highest = -100.0;
    for (int note = 28; note <= 100; ++note) {
      const float hz = 440.0f * std::exp2((note - 69) / 12.0f);
      device.init(kRate);
      Stereo out = run(device, sine(hz, 8.0f, kRate, 0.25f));
      for (int w = 4; w < 16; ++w) {
        const double level = db(rms(out.left, w * 24000, (w + 1) * 24000) / (0.25 * 0.7071));
        worst = std::min(worst, level);
        highest = std::max(highest, level);
      }
    }
    std::printf("held tones, MIDI 28 to 100, default: output between %.1f and %+.1f dB of the input\n", worst, highest);
    EXPECT(worst > -3.0, "a held tone does not drop out at the default Mix");
    EXPECT(highest < 3.5, "a held tone is not thrown up at the default Mix");
  }

  // 8. Bad input: samples that are not numbers, infinite or absurd go
  // through the dry path only; when good input returns the output is finite
  // at once, the tail is not stuck, and the device still comes to rest.
  {
    device.init(kRate);
    std::vector<float> bad = sine(220.0f, 0.5f, kRate, 0.25f);
    for (size_t i = 1000; i < 3000; ++i) bad[i] = (i % 3 == 0) ? std::nanf("") : (i % 3 == 1 ? INFINITY : 1.0e30f);
    run(device, bad);
    Stereo good = run(device, sine(220.0f, 1.0f, kRate, 0.25f));
    EXPECT(finite(good.left) && finite(good.right), "finite again as soon as good input returns");
    EXPECT(peak(good.left) < 1.0 && rms(good.left, 24000, 48000) > 0.05, "and sounding, at an ordinary level");
    render(device, 30.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "and at rest after its tail");
  }

  // 9. Block size and silence: the same at 1, 128 and 2048 frames across a
  // sleep long enough for the clock to have moved, bit for bit.
  {
    rng_state() = 0xB10Cu;
    std::vector<float> in = noise(0.4f, kRate, 0.3f);
    in.resize(static_cast<size_t>(kRate * 4.0f), 0.0f);
    std::vector<float> again = noise(0.4f, kRate, 0.3f);
    in.insert(in.end(), again.begin(), again.end());
    in.resize(static_cast<size_t>(kRate * 5.0f), 0.0f);
    Stereo reference;
    for (int block : {128, 1, 2048}) {
      device.init(kRate);
      device.set_param(p::kDecay, 0.5f);
      device.set_param(p::kClimb, 12.0f);
      Stereo out = run(device, in, block);
      if (block == 128) {
        reference = out;
        EXPECT(peak(out.left, 3 * 48000 + 24000, 4 * 48000) == 0.0, "asleep between the two sounds");
        EXPECT(rms(out.left, 4 * 48000, 5 * 48000) > 0.01, "awake for the second");
      } else {
        EXPECT(out.left == reference.left && out.right == reference.right,
               "the same output at every block size across a sleep");
      }
    }
  }

  // 10. The glide runs by the clock: through sound, silence and sleep alike,
  // and nothing in the audio moves it.
  {
    device.init(kRate);
    device.set_param(p::kClimb, 9.0f);
    run(device, sine(330.0f, 1.0f, kRate, 0.5f));
    render(device, 19.0f, kRate);
    const float with_sound = device.meter(0);
    device.init(kRate);
    device.set_param(p::kClimb, 9.0f);
    render(device, 20.0f, kRate);
    const float asleep = device.meter(0);
    EXPECT_NEAR(asleep, 3.0, 0.001, "20 s at 9 octaves a minute is 3 octaves of glide, asleep");
    EXPECT(with_sound == asleep, "the clock stands at the same place whatever was played");
  }

  // 11. Clicks: a control moved while a low tone rings makes no step larger
  // than the same passage with nothing moved. Voices is a count, Climb and
  // Mix are what a hand is on while it sounds. Blur taken away is given
  // more room: its lines shorten as it goes, which bends what is in them up
  // in pitch, and a higher pitch has larger steps without any click (the
  // second build, one side against itself at rest: 1.81 times, with the
  // largest change of slope the same as at rest; it passed at 1.5 on the
  // louder of its two unequal sides).
  {
    struct Move { int id; float from, to; const char* what; double room = 1.5; };
    const Move moves[] = {
        {p::kVoices, 2.0f, 6.0f, "Voices 2 to 6 does not click"},
        {p::kVoices, 6.0f, 3.0f, "Voices 6 to 3 does not click"},
        {p::kClimb, 12.0f, -12.0f, "Climb turned over does not click"},
        {p::kMix, 0.1f, 0.9f, "Mix does not click"},
        {p::kSpread, 0.0f, 1.0f, "Spread does not click"},
        {p::kBlur, 0.0f, 1.0f, "Blur does not click"},
        {p::kBlur, 1.0f, 0.0f, "Blur taken away does not click", 2.0},
        {p::kTone, 500.0f, 16000.0f, "Tone thrown open does not click"},
        {p::kTone, 16000.0f, 500.0f, "Tone thrown shut does not click"},
        {p::kClimb, -12.0f, 0.0f, "Climb put on its centre does not click"},
        {p::kWidth, 1.0f, 0.0f, "Width does not click"},
        {p::kWidth, 0.0f, 1.0f, "Width opened does not click"},
        {p::kSize, 0.2f, 0.8f, "Size does not click"},
        {p::kDecay, 1.0f, 30.0f, "Decay does not click"},
    };
    const std::vector<float> tone = sine(110.0f, 1.0f, kRate, 0.5f);
    for (const Move& move : moves) {
      // Three passes: at rest where it starts, moved, and at rest where it ends.
      double step[3];
      for (int pass = 0; pass < 3; ++pass) {
        device.init(kRate);
        device.set_param(p::kMix, 1.0f);
        device.set_param(move.id, pass == 2 ? move.to : move.from);
        turn_to(device, 0.37f, move.id == p::kClimb ? (pass == 2 ? move.to : move.from) : 3.0f);
        run(device, tone);
        if (pass == 1) device.set_param(move.id, move.to);
        Stereo out = run(device, tone);
        step[pass] = std::max(max_step(out.left), max_step(out.right));
      }
      const double rest = std::max(step[0], step[2]);
      if (step[1] > rest * move.room + 0.002) {
        std::printf("%s: step %.4f moved, %.4f and %.4f at rest\n", move.what, step[1], step[0], step[2]);
      }
      EXPECT(step[1] <= rest * move.room + 0.002, move.what);
    }
  }

  // 12. The wet path keeps the two sides apart: an input in anti-phase is
  // not lost (its tail comes through the side's own tank), the tail of a
  // sound that is the same on both sides is wide but never opposed (for
  // noise the two sides correlate at 0.41: a phase between them that swings
  // with pitch up to a quarter turn each way), and Width 0 makes the tail
  // the same on both sides, sample for sample.
  {
    rng_state() = 0x57E0u;
    const std::vector<float> in = noise(3.0f, kRate, 0.25f);
    std::vector<float> flipped = in;
    for (float& v : flipped) v = -v;
    wet_only(device);
    Stereo same = run(device, in, in);
    wet_only(device);
    Stereo anti = run(device, in, flipped);
    const double ratio = db(rms(anti.left, 48000, 144000) / rms(same.left, 48000, 144000));
    std::printf("anti-phase input: the tail is %.1f dB against the same input in phase\n", ratio);
    EXPECT(ratio > -3.0, "an anti-phase input keeps its tail");
    const double alike = correlation(same.left, same.right, 48000, 144000);
    std::printf("the tail of noise that is the same on both sides: the two sides correlate at %.2f\n", alike);
    EXPECT(alike < 0.6, "the tail of a mono input is wide");
    EXPECT(alike > 0.25, "and its two sides are not opposed");
    wet_only(device);
    device.set_param(p::kWidth, 0.0f);
    Stereo mono = run(device, in, in);
    double apart = 0.0;
    for (size_t i = 0; i < in.size(); ++i) apart = std::max(apart, std::fabs((double)mono.left[i] - mono.right[i]));
    EXPECT(apart == 0.0, "Width 0 is a mono tail, sample for sample");
  }

  // 13. Tone, Blur and Size each do their own thing. Tone takes highs off;
  // Blur leaves the level alone and smears a click over more time; Size
  // makes the tank answer later.
  {
    auto energy_of = [](const std::vector<float>& x, size_t from, size_t to) {
      double sum = 0.0;
      for (size_t i = from; i < to; ++i) sum += static_cast<double>(x[i]) * x[i];
      return sum;
    };
    // The time a click's first 5 % of energy takes to come out.
    auto onset_of = [](const std::vector<float>& x) {
      double total = 0.0;
      for (float v : x) total += static_cast<double>(v) * v;
      double sum = 0.0;
      for (size_t i = 0; i < x.size(); ++i) {
        sum += static_cast<double>(x[i]) * x[i];
        if (sum >= 0.05 * total) return static_cast<double>(i) / kRate;
      }
      return 0.0;
    };
    rng_state() = 0x70E0u;
    const std::vector<float> in = noise(3.0f, kRate, 0.25f);
    double bright[2], level[2], centre[2], answer[2];
    for (int which = 0; which < 2; ++which) {
      wet_only(device);
      device.set_param(p::kTone, which ? 800.0f : 16000.0f);
      Stereo a = run(device, in);
      bright[which] = energy_above(a.left, 3000.0, kRate, 48000, 144000);

      wet_only(device);
      device.set_param(p::kBlur, which ? 1.0f : 0.0f);
      Stereo b = run(device, in);
      level[which] = db(rms(b.left, 48000, 144000));
      wet_only(device);
      device.set_param(p::kBlur, which ? 1.0f : 0.0f);
      device.set_param(p::kDecay, 0.5f);
      Stereo click = run(device, impulse(3.0f, kRate, 0.5f));
      centre[which] = onset_of(click.left);

      wet_only(device);
      device.set_param(p::kSize, which ? 1.0f : 0.0f);
      device.set_param(p::kDecay, 0.5f);
      Stereo space = run(device, impulse(3.0f, kRate, 0.5f));
      // The early sound is the same at every Size and is out by 70 ms: what
      // Size moves is when the tank first answers (by 70 ms when small,
      // after 110 ms when large).
      answer[which] = energy_of(space.left, 5280, 7200) / energy_of(space.left, 3360, 5280);
    }
    std::printf("Tone 16 kHz to 800 Hz: energy above 3 kHz %.4f to %.5f\n", bright[0], bright[1]);
    std::printf("Blur 0 to 1: level %+.2f dB, a click's first twentieth is out after %.0f ms and %.0f ms\n",
                level[1] - level[0], centre[0] * 1000.0, centre[1] * 1000.0);
    std::printf("Size 0 to 1: a click's energy from 110 to 150 ms is %.2f and %.2f of that from 70 to 110 ms\n", answer[0],
                answer[1]);
    EXPECT(bright[1] < bright[0] * 0.2, "Tone takes the highs off the tail");
    EXPECT(std::fabs(level[1] - level[0]) < 1.0, "Blur does not change the level");
    EXPECT(centre[0] < 0.03, "with no Blur the tail of a click starts within 30 ms");
    EXPECT(centre[1] > centre[0] + 0.015, "Blur smears a click over more time");
    EXPECT(answer[1] > 2.0 * answer[0], "a larger Size brings the tank's first return later");
  }

  // 14. Voices and Spread. With the clock at a whole octave the partials of
  // a held sine stand on octaves of it: Voices says how many sound, and a
  // narrow Spread gives nearly all the power to the one in the middle.
  {
    for (int voices : {2, 3, 4, 5, 6}) {
      wet_only(device);
      device.set_param(p::kVoices, static_cast<float>(voices));
      device.set_param(p::kSpread, 1.0f);
      turn_to(device, 0.5f, kCreep);
      Stereo out = run(device, sine(440.0f, 3.0f, kRate, 0.25f));
      const Stack stack = stack_at(0.5 + kCreep / 60.0 * 2.75, voices, 1.0);
      int sounding = 0, expected = 0;
      double strongest = 0.0, level[6];
      for (int v = 0; v < 6; ++v) {
        level[v] = tone_level(out.left, 440.0 * std::exp2(stack.shift[v]), kRate, 120000, 144000);
        strongest = std::max(strongest, level[v]);
        if (stack.level[v] > 0.0) ++expected;
      }
      for (int v = 0; v < 6; ++v) {
        if (level[v] > strongest * 0.05) ++sounding;
      }
      EXPECT(sounding == voices && expected == voices, "Voices is the number of octaves that sound");
    }
    double share[2];
    for (int which = 0; which < 2; ++which) {
      wet_only(device);
      device.set_param(p::kSpread, which ? 1.0f : 0.0f);
      turn_to(device, 1.0f, 0.0f);  // the centre: the clock rests on the whole octave
      Stereo out = run(device, sine(440.0f, 3.0f, kRate, 0.25f));
      double total = 0.0, middle = 0.0;
      for (int octave = -3; octave <= 2; ++octave) {
        const double level = tone_level(out.left, 440.0 * std::exp2(octave), kRate, 96000, 144000);
        total += level * level;
        if (octave == 0) middle = level * level;
      }
      share[which] = middle / total;
    }
    std::printf("Spread: the middle voice holds %.1f %% of the power when narrow, %.1f %% when wide\n",
                100.0 * share[0], 100.0 * share[1]);
    EXPECT(share[0] > 0.95, "a narrow Spread lets one voice lead");
    EXPECT(share[1] > 0.4 && share[1] < 0.6, "a wide Spread lets the octaves sound together");
  }

  // 15. At rest after every control move: a control moved to either end
  // while the tail rings leaves nothing gliding that would keep the device
  // awake, and a knob moved while it sleeps snaps on waking.
  {
    for (int which = 0; which < 2 * p::kNumParams; ++which) {
      const int id = which / 2;
      device.init(kRate);
      device.set_param(p::kDecay, 1.0f);
      rng_state() = 0xFACEu;
      run(device, noise(0.3f, kRate, 0.5f));
      float value = which % 2 ? p::kParamMax[id] : p::kParamMin[id];
      if (id == p::kDecay) value = which % 2 ? 2.0f : p::kParamMin[id];
      device.set_param(id, value);
      render(device, 10.0f, kRate);
      Stereo rest = render(device, 0.5f, kRate);
      char label[96];
      std::snprintf(label, sizeof label, "at rest after param %d went to its %s", id, which % 2 ? "maximum" : "minimum");
      EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, label);
    }
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 30.0f, kRate);
    device.set_param(p::kMix, 0.0f);
    const std::vector<float> tone = sine(440.0f, 0.1f, kRate, 0.5f);
    Stereo out = run(device, tone);
    bool same = true;
    for (size_t i = 0; i < tone.size(); ++i) same = same && out.left[i] == tone[i];
    EXPECT(same, "Mix moved while asleep is there on the first sample");
  }

  // 16. Every preset (the table is device.json's, written out). A held chord
  // at full scale for a minute stays within 6 dB of the input and does not
  // pile up. Held tones over the keyboard: at a part-way Mix the output is
  // never far under what the dry path alone gives at that Mix (the wet path
  // does not cancel it), and never far over the input. "On a send" is the
  // tail alone, where a pure tone is as loud as the tank's modes at its
  // pitch make it, as in any reverb: its range is printed and held to wide
  // bounds only.
  {
    struct Preset {
      const char* name;
      float value[p::kNumParams];
    };
    static const Preset presets[] = {
      {"Slow ascent", {3.0f, 8.0f, 0.5f, 4.0f, 0.5f, 6000.0f, 0.5f, 1.0f, 0.4f}},
      {"Slow descent", {-3.0f, 9.0f, 0.5f, 4.0f, 0.5f, 4500.0f, 0.5f, 1.0f, 0.4f}},
      {"Held still", {0.0f, 6.0f, 0.5f, 3.0f, 1.0f, 6000.0f, 0.6f, 1.0f, 0.35f}},
      {"Rising hall", {1.5f, 20.0f, 0.9f, 5.0f, 0.7f, 5000.0f, 0.75f, 1.0f, 0.45f}},
      {"Siren of light", {12.0f, 4.0f, 0.5f, 6.0f, 0.8f, 12000.0f, 0.3f, 1.0f, 0.35f}},
      {"Sinking fast", {-10.0f, 5.0f, 0.5f, 5.0f, 0.6f, 3500.0f, 0.5f, 1.0f, 0.4f}},
      {"Pure glide", {4.0f, 6.0f, 0.5f, 2.0f, 0.0f, 8000.0f, 0.15f, 1.0f, 0.35f}},
      {"Faint lift", {2.0f, 3.0f, 0.5f, 3.0f, 0.3f, 6000.0f, 0.4f, 1.0f, 0.15f}},
      {"Endless wash", {1.0f, 60.0f, 1.0f, 6.0f, 1.0f, 4000.0f, 1.0f, 1.0f, 0.5f}},
      {"Deep below", {-1.5f, 14.0f, 0.8f, 6.0f, 0.9f, 1200.0f, 0.9f, 1.0f, 0.45f}},
      {"Glass stair", {6.0f, 2.5f, 0.2f, 4.0f, 0.35f, 16000.0f, 0.0f, 1.0f, 0.35f}},
      {"Small room rise", {5.0f, 0.8f, 0.1f, 3.0f, 0.5f, 6000.0f, 0.3f, 1.0f, 0.3f}},
      {"Mono column", {3.0f, 10.0f, 0.5f, 5.0f, 0.5f, 6000.0f, 0.7f, 0.0f, 0.4f}},
      {"Wide drone bed", {0.5f, 40.0f, 1.0f, 5.0f, 1.0f, 2500.0f, 1.0f, 1.0f, 0.6f}},
      {"Two falling", {-7.0f, 3.0f, 0.35f, 2.0f, 1.0f, 9000.0f, 0.0f, 1.0f, 0.5f}},
      {"On a send", {2.0f, 12.0f, 0.5f, 4.0f, 0.6f, 6000.0f, 0.6f, 1.0f, 1.0f}},
    };
    const std::vector<float> held = chord(60.0f, 1.0f);
    double worst_peak = 0.0, worst_growth = -100.0, worst_dip = 100.0, worst_lift = -100.0;
    double send_low = 100.0, send_high = -100.0;
    for (const Preset& preset : presets) {
      device.init(kRate);
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.value[id]);
      Stereo out = run(device, held);
      const double high = std::max(peak(out.left), peak(out.right));
      const double growth = db(rms(out.left, 50 * 48000, 60 * 48000) / rms(out.left, 10 * 48000, 20 * 48000));
      double dip = 100.0, lift = -100.0;
      for (int note = 28; note <= 100; note += 6) {
        const float hz = 440.0f * std::exp2((note - 69) / 12.0f);
        device.init(kRate);
        for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.value[id]);
        Stereo tone = run(device, sine(hz, 6.0f, kRate, 0.25f));
        for (int w = 4; w < 12; ++w) {
          const double level = db(rms(tone.left, w * 24000, (w + 1) * 24000) / (0.25 * 0.7071));
          dip = std::min(dip, level);
          lift = std::max(lift, level);
        }
      }
      const float mix = preset.value[p::kMix];
      const bool send = mix >= 1.0f;
      const double dry = send ? 0.0 : db(std::cos(1.5707963 * mix));
      std::printf("preset %-16s held chord peak %.2f, growth %+.2f dB; held tones %+.1f to %+.1f dB of the input", preset.name,
                  high, growth, dip, lift);
      if (send) std::printf(" (the tail alone)\n");
      else std::printf(", lowest %+.1f dB against the dry path alone\n", dip - dry);
      worst_peak = std::max(worst_peak, high);
      worst_growth = std::max(worst_growth, growth);
      if (send) {
        send_low = dip;
        send_high = lift;
      } else {
        worst_dip = std::min(worst_dip, dip - dry);
        worst_lift = std::max(worst_lift, lift);
      }
    }
    EXPECT(worst_peak < 2.0, "a held full-scale chord stays within 6 dB of the input at every preset");
    EXPECT(worst_growth < 1.0, "a held chord does not pile up at any preset");
    EXPECT(worst_dip > -4.0, "the wet path does not cancel a held tone at any preset's Mix");
    EXPECT(worst_lift < 7.0, "a held tone is not thrown up at any preset");
    EXPECT(send_low > -7.0 && send_high < 5.0, "the tail alone holds a tone at every pitch (check 21 has every semitone)");
  }

  // 17. The level hold. The tail alone never passes full scale, however hard
  // the tank is driven: full-scale noise and a chord at twice full scale, at
  // the shortest Decay (where the level law gives the tank most) and the
  // longest (where it rings up most), under the widest bell.
  {
    rng_state() = 0xF00Du;
    const std::vector<float> loud = noise(20.0f, kRate, 1.0f);
    const std::vector<float> over = chord(20.0f, 2.0f);
    double highest = 0.0;
    for (float decay : {0.5f, 60.0f}) {
      for (int which = 0; which < 2; ++which) {
        device.init(kRate);
        device.set_param(p::kMix, 1.0f);
        device.set_param(p::kDecay, decay);
        device.set_param(p::kVoices, 6.0f);
        device.set_param(p::kSpread, 1.0f);
        device.set_param(p::kTone, 16000.0f);
        Stereo out = run(device, which ? over : loud);
        highest = std::max(highest, static_cast<double>(std::max(peak(out.left), peak(out.right))));
      }
    }
    std::printf("the tail alone, driven by full-scale noise and a chord at twice full scale: peak %.3f\n", highest);
    EXPECT(highest <= 1.0, "the tail alone never passes full scale");
  }

  // 18. Voices and Spread are not volume knobs: the tail of the same band
  // noise, averaged over two wraps, is as loud with two voices under a
  // narrow bell as with six under a wide one.
  {
    rng_state() = 0xA11CEu;
    std::vector<float> band = noise(16.0f, kRate, 0.5f);
    double low = 0.0, high = 0.0;
    for (float& v : band) {
      high += 0.145 * (v - high);
      low += 0.026 * (high - low);
      v = static_cast<float>(high - low);
    }
    const float set[5][2] = {{2.0f, 0.0f}, {2.0f, 1.0f}, {4.0f, 0.5f}, {6.0f, 0.0f}, {6.0f, 1.0f}};
    double least = 100.0, most = -100.0;
    for (const float* s : set) {
      wet_only(device);
      device.set_param(p::kClimb, 12.0f);
      device.set_param(p::kVoices, s[0]);
      device.set_param(p::kSpread, s[1]);
      Stereo out = run(device, band);
      const double level = db(rms(out.left, 5 * 48000, 15 * 48000));
      std::printf("band noise, the tail alone, %g voices at Spread %g: %.1f dB\n", s[0], s[1], level);
      least = std::min(least, level);
      most = std::max(most, level);
    }
    EXPECT(most - least < 1.5, "Voices and Spread leave the level of the tail alone");
  }

  // --- The second check's tests: each of these fails on the device as it was first built. ---

  // 19. Climb at its centre. The clock goes to the nearest whole octave and
  // rests there, asleep or awake, so a tail that holds still is in tune
  // with what is played and "Held still" is one sound whenever it is
  // loaded: after 7.3 s of climbing at the default (the clock at 0.365) the
  // partials of a held 440 Hz stand on 440 and its octaves, as loud as on a
  // device fresh from init.
  {
    const std::vector<float> tone = sine(440.0f, 3.0f, kRate, 0.25f);
    double level[2][3];
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      if (which) {
        run(device, sine(330.0f, 7.3f, kRate, 0.2f));
        EXPECT_NEAR(device.meter(0), 0.365, 0.001, "7.3 s at 3 octaves a minute is 0.365 octaves");
      }
      device.set_param(p::kClimb, 0.0f);
      device.set_param(p::kVoices, 3.0f);
      device.set_param(p::kSpread, 1.0f);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kDecay, 2.0f);
      render(device, 30.0f, kRate);
      EXPECT(device.meter(0) == 0.0f, "with Climb at its centre the clock rests on a whole octave");
      Stereo out = run(device, tone);
      for (int octave = -1; octave <= 1; ++octave) {
        level[which][octave + 1] = db(tone_level(out.left, 440.0 * std::exp2(octave), kRate, 96000, 144000));
      }
    }
    std::printf("Climb at its centre: 220 and 440 Hz of a held 440 are %.1f and %.1f dB fresh, %.1f and %.1f dB after climbing\n",
                level[0][0], level[0][1], level[1][0], level[1][1]);
    EXPECT_NEAR(level[1][0], level[0][0], 1.5, "the octave below is as loud whenever the centre is reached");
    EXPECT_NEAR(level[1][1], level[0][1], 1.5, "the played pitch is as loud whenever the centre is reached");
    EXPECT(level[0][1] > -20.0 && level[0][2] < level[0][1] - 40.0, "three voices at rest: the pitch and the octave below");
    // And it goes there by the clock: from 0.365 the nearest is 0, at 12 octaves a minute, 1.825 s.
    device.init(kRate);
    device.set_param(p::kClimb, 12.0f);
    render(device, 1.825f, kRate);  // 0.365 octaves, asleep
    device.set_param(p::kClimb, 0.0f);
    render(device, 0.9125f, kRate);
    EXPECT_NEAR(device.meter(0), 0.1825, 0.001, "half way home after half the time");
    render(device, 1.0f, kRate);
    EXPECT(device.meter(0) == 0.0f, "home, and no further");
    device.set_param(p::kClimb, 12.0f);
    render(device, 3.0f, kRate);  // 0.6: the nearest whole octave is 1
    device.set_param(p::kClimb, 0.0f);
    render(device, 3.0f, kRate);
    EXPECT(device.meter(0) == 1.0f, "from past the half the clock goes up to the next octave");
  }

  // 20. The clock to the sample. It is a function of the time and of Climb
  // as it was set, and of nothing else: the same through sound, silence and
  // sleep, at every block size, with Climb changed while asleep and while
  // sounding (the first build smoothed Climb while awake and not asleep, so
  // a change of Climb moved the clock by a different amount awake).
  {
    rng_state() = 0xC10Cu;
    std::vector<float> in(static_cast<size_t>(4.0f * kRate), 0.0f);
    for (size_t i = 0; i < 9600; ++i) in[i] = 0.3f * white();
    for (size_t i = 0; i < 24000; ++i) in[3 * 48000 + i] = 0.3f * white();
    float clock[2] = {0.0f, 0.0f};
    Stereo reference;
    const int patterns[5][4] = {{128, 128, 128, 128}, {1, 1, 1, 1}, {2048, 2048, 2048, 2048}, {32, 512, 7, 2048}, {2048, 1, 300, 64}};
    for (int which = 0; which < 5; ++which) {
      device.init(kRate);
      device.set_param(p::kDecay, 0.5f);
      device.set_param(p::kClimb, 9.0f);
      Stereo out;
      out.left.resize(in.size());
      out.right.resize(in.size());
      size_t done = 0, turn = 0;
      while (done < in.size()) {
        size_t frames = std::min<size_t>(patterns[which][turn++ % 4], in.size() - done);
        // Climb changed at 2 s, asleep, and at 3.2 s, sounding: on the same samples whatever the block.
        for (size_t edge : {static_cast<size_t>(96000), static_cast<size_t>(153600)}) {
          if (done < edge && done + frames > edge) frames = edge - done;
        }
        if (done == 96000) device.set_param(p::kClimb, -4.0f);
        if (done == 153600) device.set_param(p::kClimb, 7.0f);
        for (size_t i = 0; i < frames; ++i) {
          device.in_left()[i] = in[done + i];
          device.in_right()[i] = in[done + i];
        }
        device.process(static_cast<int>(frames));
        for (size_t i = 0; i < frames; ++i) {
          out.left[done + i] = device.out_left()[i];
          out.right[done + i] = device.out_right()[i];
        }
        done += frames;
      }
      if (which == 0) {
        reference = out;
        clock[0] = device.meter(0);
        EXPECT(peak(out.left, 96000, 144000) == 0.0, "asleep when Climb was changed");
      } else {
        EXPECT(out.left == reference.left && out.right == reference.right,
               "the same output at every block size, with Climb changed asleep and awake");
        EXPECT(device.meter(0) == clock[0], "the clock stands on the same sample's place at every block size");
      }
    }
    // 2 s at 9, 1.2 s at -4, 0.8 s at 7 octaves a minute: 0.3 - 0.08 + 0.0933.
    EXPECT_NEAR(clock[0], 0.3 - 0.08 + 7.0 / 60.0 * 0.8, 2.0e-5, "the clock is the sum of Climb over the time, to the sample");
    // The same Climb history with no sound at all.
    device.init(kRate);
    device.set_param(p::kClimb, 9.0f);
    render(device, 2.0f, kRate);
    device.set_param(p::kClimb, -4.0f);
    render(device, 1.2f, kRate);
    device.set_param(p::kClimb, 7.0f);
    render(device, 0.8f, kRate);
    clock[1] = device.meter(0);
    EXPECT(clock[1] == clock[0], "and the same with nothing played at all");
  }

  // 21. Even over pitch. The tail alone ("On a send": Decay 12 s, Mix 1) of
  // a pure held tone, at every semitone of the keyboard, both sides: no
  // note is lost and none is thrown up (the first build: -20.8 to +7.5 dB,
  // 5.7 dB about the mean), and each is steady in time.
  {
    double low = 100.0, high = -100.0, sum = 0.0, squares = 0.0, swing = 0.0;
    int count = 0;
    for (int note = 28; note <= 100; ++note) {
      device.init(kRate);
      device.set_param(p::kClimb, 2.0f);
      device.set_param(p::kDecay, 12.0f);
      device.set_param(p::kSpread, 0.6f);
      device.set_param(p::kBlur, 0.6f);
      device.set_param(p::kMix, 1.0f);
      Stereo out = run(device, sine(440.0f * std::exp2((note - 69) / 12.0f), 10.0f, kRate, 0.25f));
      auto both = [&](size_t from, size_t to) {
        const double l = rms(out.left, from, to), r = rms(out.right, from, to);
        return db(std::sqrt(0.5 * (l * l + r * r)) / (0.25 * 0.7071));
      };
      const double level = both(6 * 48000, 10 * 48000);
      double least = 100.0, most = -100.0;
      for (size_t at = 6 * 48000; at + 24000 <= out.size(); at += 24000) {
        least = std::min(least, both(at, at + 24000));
        most = std::max(most, both(at, at + 24000));
      }
      swing = std::max(swing, most - least);
      low = std::min(low, level);
      high = std::max(high, level);
      sum += level;
      squares += level * level;
      ++count;
    }
    const double mean_level = sum / count;
    const double spread = std::sqrt(squares / count - mean_level * mean_level);
    std::printf("the tail alone, held tones at every semitone 28..100: %+.1f to %+.1f dB of the input, mean %+.1f, %.1f dB about it; steady to %.1f dB\n",
                low, high, mean_level, spread, swing);
    EXPECT(low > -7.0, "no pitch is lost in the tail alone");
    EXPECT(high < 5.0, "no pitch is thrown up in the tail alone");
    EXPECT(spread < 2.5, "the tail alone is even over the keyboard");
    EXPECT(swing < 3.5, "and steady in time on a held tone");
  }

  // 22. A held tone through unison at the default Mix. Every 20 s a voice
  // glides through the played pitch and beats against the dry sound, slowly
  // at the moment it passes: the tail being as loud as the note, the two
  // can all but cancel on one side for a twentieth of a second. That is
  // what a voice gliding through a held pitch is; it is bounded here, in
  // 50 ms windows, so that it cannot grow into a note dropping out.
  {
    double low = 100.0, high = -100.0;
    for (int note : {45, 57, 69, 81}) {
      device.init(kRate);
      turn_to(device, 0.9f, 3.0f);
      Stereo out = run(device, sine(440.0f * std::exp2((note - 69) / 12.0f), 5.0f, kRate, 0.25f));
      for (size_t at = 24000; at + 2400 <= out.size(); at += 1200) {
        const double level = db(rms(out.left, at, at + 2400) / (0.25 * 0.7071));
        low = std::min(low, level);
        high = std::max(high, level);
      }
    }
    std::printf("held tones through unison at the default Mix, 50 ms windows: %+.1f to %+.1f dB of the input\n", low, high);
    EXPECT(low > -10.5 && high < 5.0, "a voice passing the played pitch does not take the note away");
  }

  // 23. A hit. The tail of a drum hit, alone, at the defaults: it starts at
  // once (the first build: nothing for 80 ms with no Blur, then the hit
  // again) and its highest moment is its first, within a tenth of a second,
  // not a repeat that comes later.
  {
    std::vector<float> hit(static_cast<size_t>(0.8f * kRate));
    rng_state() = 0xD12u;
    for (size_t i = 0; i < hit.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      hit[i] = static_cast<float>(0.7 * std::exp(-t * 40.0) * std::sin(2.0 * kPi * 70.0 * t) +
                                  (t < 0.03 ? 0.5 * white() * std::exp(-t * 150.0) : 0.0));
    }
    for (float blur : {0.0f, 0.5f}) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kBlur, blur);
      Stereo out = run(device, hit);
      double top = 0.0;
      size_t top_at = 0, first = 0;
      std::vector<double> envelope;
      for (size_t at = 0; at + 240 <= static_cast<size_t>(0.4f * kRate); at += 240) {
        envelope.push_back(rms(out.left, at, at + 240));
        if (envelope.back() > top) {
          top = envelope.back();
          top_at = envelope.size() - 1;
        }
      }
      while (first < envelope.size() && envelope[first] < 0.1 * top) ++first;
      std::printf("a drum hit, the tail alone, Blur %.1f: within 20 dB of its highest after %zu ms, highest at %zu ms\n", blur,
                  first * 5, top_at * 5);
      EXPECT(first * 5 <= 40, "the tail of a hit starts within 40 ms");
      EXPECT(top_at * 5 <= 100, "the hit's highest moment in the tail is its first, not a later repeat");
    }
  }

  // 24. Through a wrap, in spectrum. The level is steady (check 3); here
  // the sixth-octave band spectrum in 85 ms windows, for a held chord and
  // for band noise, with two voices under the narrowest bell (one voice
  // leads, so a step would show most) and with six under the widest: the
  // change from one window to the next is no larger about the instants a
  // voice leaves at one end and enters at the other than anywhere else.
  {
    rng_state() = 0xA11CEu;
    std::vector<float> band = noise(17.0f, kRate, 0.5f);
    double lowpass = 0.0, highpass = 0.0;
    for (float& v : band) {
      highpass += 0.145 * (v - highpass);
      lowpass += 0.026 * (highpass - lowpass);
      v = static_cast<float>(highpass - lowpass);
    }
    const std::vector<float> held = chord(17.0f, 0.5f);
    for (int which = 0; which < 4; ++which) {
      wet_only(device);
      device.set_param(p::kDecay, 2.0f);
      device.set_param(p::kClimb, 12.0f);
      device.set_param(p::kVoices, which < 2 ? 2.0f : 6.0f);
      device.set_param(p::kSpread, which < 2 ? 0.0f : 1.0f);
      device.set_param(p::kBlur, 0.15f);
      Stereo out = run(device, (which & 1) ? band : held);
      // Band powers every 1024 samples from 3 s on.
      std::vector<std::vector<double>> frames;
      for (size_t at = 3 * 48000; at + 4096 <= out.size(); at += 1024) frames.push_back(band_powers(out.left, at));
      std::vector<double> near, far;
      for (size_t f = 4; f < frames.size(); ++f) {
        double change = 0.0, total = 0.0;
        for (size_t b = 0; b < frames[f].size(); ++b) {
          change += std::fabs(frames[f][b] - frames[f - 4][b]);
          total += frames[f][b] + frames[f - 4][b];
        }
        // The middle of the pair of windows, and how far that is from a wrap (every 5 s).
        const double t = 3.0 + static_cast<double>(f) * 1024.0 / kRate;
        const double phase = std::fmod(t, 5.0);
        (phase < 0.2 || phase > 4.8 ? near : far).push_back(change / (total + 1.0e-20));
      }
      std::sort(near.begin(), near.end());
      std::sort(far.begin(), far.end());
      const double near_mid = near[near.size() / 2], far_mid = far[far.size() / 2];
      const double near_top = near.back(), far_top = far.back();
      std::printf("through wraps, %s, %s: spectrum change in 85 ms about a wrap %.3f (most %.3f), elsewhere %.3f (most %.3f)\n",
                  which < 2 ? "2 voices, narrowest bell" : "6 voices, widest bell", (which & 1) ? "band noise" : "a held chord",
                  near_mid, near_top, far_mid, far_top);
      EXPECT(near_mid < far_mid * 1.25 + 0.01, "the spectrum does not step where a voice wraps");
      EXPECT(near_top < far_top * 1.25 + 0.01, "nor once in a while");
    }
  }

  // 25. What is in the tail that is not one of the six octaves of a held
  // tone (splices, and what a voice reading faster than real time folds
  // back): the part further than 2.5 % from every octave, six voices under
  // the widest bell, Tone open. The clock creeps, so the partials stand.
  {
    for (float hz : {1000.0f, 6000.0f, 10000.0f}) {
      device.init(kRate);
      device.set_param(p::kVoices, 6.0f);
      device.set_param(p::kSpread, 1.0f);
      device.set_param(p::kBlur, 0.0f);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kDecay, 1.0f);
      device.set_param(p::kTone, 16000.0f);
      turn_to(device, 0.5f, kCreep);
      Stereo out = run(device, sine(hz, 4.0f, kRate, 0.25f));
      double stray = 0.0, total = 0.0;
      for (size_t at = 2 * 48000; at + 32768 <= out.size(); at += 32768) {
        const double glide = 0.5 + kCreep / 60.0 * (static_cast<double>(at + 16384) / kRate);
        const std::vector<double> power = power_of(out.left, at, 32768);
        for (size_t k = 2; k < power.size(); ++k) {
          const double f = static_cast<double>(k) * kRate / 32768.0;
          bool wanted = false;
          for (int v = 0; v < 6 && !wanted; ++v) {
            const double at_hz = hz * std::exp2(std::fmod(glide + v, 6.0) - 3.0);
            wanted = std::fabs(f - at_hz) < 0.025 * at_hz + 4.5;
          }
          total += power[k];
          if (!wanted) stray += power[k];
        }
      }
      const double share = 10.0 * std::log10(stray / total + 1.0e-20);
      std::printf("a held %.0f Hz, six voices, Tone open: %.1f dB of the tail is not at one of its octaves\n", hz, share);
      EXPECT(share < (hz > 3000.0f ? -27.0 : -45.0), "what the voices add that is not the glide stays small");
    }
  }

  // 26. Summed to mono (the third pass). The tail alone of held notes and
  // chords as the bank plays them, at Width 1 and half way, under the
  // narrowest, the default and the widest bell: in every quarter second the
  // two sides summed stay within 3 dB of the two sides apart for a single
  // note (a quarter turn of phase between them at the most) and within
  // about 2 dB for a chord; the two sides hold the same level; and they are
  // never opposed. (Before: the sides stood anywhere from in step to
  // opposite at any one pitch, and A2 lost 17 dB summed, a chord 7 dB.)
  {
    const int notes[] = {45, 48, 52, 55, 57, 60, 64, 67, 69, 72, 76, 79, 81};
    const std::vector<std::vector<int>> chords = {{45, 52, 57, 60, 64}, {62, 69, 74, 77, 81}};
    struct Setting { float width, spread; };
    const Setting settings[] = {{1.0f, 0.6f}, {1.0f, 0.0f}, {1.0f, 1.0f}, {0.5f, 0.6f}};
    for (const Setting& setting : settings) {
      auto through = [&](const std::vector<int>& which) {
        const std::vector<float> dry = held_notes(which, 6.0f);
        device.init(kRate);
        device.set_param(p::kClimb, 2.0f);
        device.set_param(p::kDecay, 12.0f);
        device.set_param(p::kSpread, setting.spread);
        device.set_param(p::kBlur, 0.6f);
        device.set_param(p::kWidth, setting.width);
        device.set_param(p::kMix, 1.0f);
        return fold_of(dry, run(device, dry));
      };
      double note_fold = 100.0, chord_fold = 100.0, apart = 0.0, opposed = 1.0;
      for (int note : notes) {
        const Fold f = through({note});
        note_fold = std::min(note_fold, f.fold_low);
        apart = std::max(apart, f.sides_apart);
        opposed = std::min(opposed, f.correlation_low);
      }
      for (const std::vector<int>& which : chords) {
        const Fold f = through(which);
        chord_fold = std::min(chord_fold, f.fold_low);
        apart = std::max(apart, f.sides_apart);
        opposed = std::min(opposed, f.correlation_low);
      }
      std::printf("summed to mono, the tail alone, Width %.1f Spread %.1f: a held note %+.1f dB at its worst quarter second, a chord %+.1f dB;"
                  " the two sides within %.2f dB of each other, their correlation never under %+.2f\n",
                  setting.width, setting.spread, note_fold, chord_fold, apart, opposed);
      EXPECT(note_fold > (setting.width > 0.75f ? -3.3 : -1.0), "a held note summed to mono stays within 3 dB of itself in stereo");
      EXPECT(chord_fold > (setting.width > 0.75f ? -2.4 : -0.8), "a held chord summed to mono stays within about 2 dB of itself in stereo");
      EXPECT(apart < 1.0, "the two sides of the tail hold the same level");
      EXPECT(opposed > -0.05, "the two sides of the tail are never opposed");
    }
  }

  // 27. Width along its travel, the tail alone. At 0 a sound that is the
  // same on both sides comes out the same on both sides (check 12), and as
  // loud as the two sides are at Width 1: Width turns the phase between the
  // sides and does nothing to their level (before: at 0 the tail was the
  // sum of two sides that could be opposed, and A2 fell 15.6 dB). The side
  // rises at every step of the knob and stays under the middle.
  {
    auto through = [&](const std::vector<float>& dry, float width) {
      device.init(kRate);
      device.set_param(p::kClimb, 2.0f);
      device.set_param(p::kDecay, 12.0f);
      device.set_param(p::kSpread, 0.6f);
      device.set_param(p::kBlur, 0.6f);
      device.set_param(p::kWidth, width);
      device.set_param(p::kMix, 1.0f);
      return fold_of(dry, run(device, dry));
    };
    double mean_apart = 0.0, low_apart = 0.0;
    for (int note : {45, 55, 64, 72, 81}) {
      const std::vector<float> dry = held_notes({note}, 6.0f);
      const Fold narrow = through(dry, 0.0f), wide = through(dry, 1.0f);
      mean_apart = std::max(mean_apart, std::fabs(narrow.level - wide.level));
      low_apart = std::max(low_apart, wide.level_low - narrow.level_low);
    }
    std::printf("Width 0 against Width 1, held notes: the level differs by %.2f dB at the most, the worst quarter second is %.2f dB lower at the most\n",
                mean_apart, low_apart);
    EXPECT(mean_apart < 0.5, "Width does not change the level of the tail");
    EXPECT(low_apart < 1.0, "Width 0 does not lose a held note");

    rng_state() = 0x51DEu;
    std::vector<float> band = noise(6.0f, kRate, 0.3f);
    double lowpass = 0.0, highpass = 0.0;
    for (float& v : band) {
      highpass += 0.145 * (v - highpass);
      lowpass += 0.026 * (highpass - lowpass);
      v = static_cast<float>(highpass - lowpass);
    }
    const std::vector<float> chord_dry = held_notes({62, 69, 74, 77, 81}, 6.0f);
    for (int which = 0; which < 2; ++which) {
      const std::vector<float>& dry = which ? chord_dry : band;
      double last = -1000.0, level_at_zero = 0.0, level_apart = 0.0;
      bool rising = true;
      std::printf("Width 0, 0.25, 0.5, 0.75, 1, %s: the side under the middle", which ? "a held chord" : "band noise");
      for (float width : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
        const Fold f = through(dry, width);
        if (width == 0.0f) level_at_zero = f.level;
        level_apart = std::max(level_apart, std::fabs(f.level - level_at_zero));
        rising = rising && f.side_under_middle > last + 1.0;
        last = f.side_under_middle;
        std::printf(" %.1f", f.side_under_middle);
      }
      std::printf(" dB; the level moves by %.2f dB\n", level_apart);
      EXPECT(rising, "the side rises at every step of Width");
      EXPECT(last > -7.0 && last < -2.5, "at Width 1 the side stands 3 to 7 dB under the middle");
      EXPECT(level_apart < 0.3, "Width leaves the level of the tail where it is");
    }
  }

  // 28. The two sides of the input, each with its own. A note on the left
  // and a chord on the right go through the middle's tank and the side's
  // (and the turning of their doors, which runs on the control clock): the
  // same twice over from a fresh start, bit for bit, the same at every
  // block size, and at Width 0 the same on both sides. A sound on one side
  // only keeps its tail on that side more than on the other.
  {
    const std::vector<float> left = held_notes({57}, 3.0f);
    const std::vector<float> right = held_notes({62, 69, 74}, 3.0f);
    auto through = [&](int block, float width) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kDecay, 4.0f);
      device.set_param(p::kWidth, width);
      return run(device, left, right, block);
    };
    const Stereo first = through(128, 1.0f);
    const Stereo second = through(128, 1.0f);
    EXPECT(first.left == second.left && first.right == second.right, "two fresh starts give the same output, bit for bit");
    for (int block : {1, 2048}) {
      const Stereo other = through(block, 1.0f);
      EXPECT(other.left == first.left && other.right == first.right, "a stereo input gives the same output at every block size");
    }
    const Stereo narrow = through(128, 0.0f);
    EXPECT(narrow.left == narrow.right, "at Width 0 a stereo input's tail is the same on both sides");

    // The side's half of the device rests while the input has no side and
    // wakes when one comes: a sound the same on both sides, then one on the
    // left only, a silence long enough for the side to come to rest, and
    // both again, the same at every block size.
    rng_state() = 0x51DE5u;
    std::vector<float> a = noise(0.4f, kRate, 0.3f);
    std::vector<float> b = a;
    const std::vector<float> only = noise(0.4f, kRate, 0.3f);
    a.insert(a.end(), only.begin(), only.end());
    b.resize(a.size(), 0.0f);
    a.resize(static_cast<size_t>(kRate * 4.0f), 0.0f);
    b.resize(a.size(), 0.0f);
    const std::vector<float> again = noise(0.4f, kRate, 0.3f);
    a.insert(a.end(), again.begin(), again.end());
    b.insert(b.end(), again.begin(), again.end());
    a.insert(a.end(), only.begin(), only.end());
    b.resize(a.size(), 0.0f);
    a.resize(static_cast<size_t>(kRate * 6.0f), 0.0f);
    b.resize(a.size(), 0.0f);
    Stereo reference;
    for (int block : {128, 1, 2048}) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kDecay, 0.5f);
      const Stereo out = run(device, a, b, block);
      if (block == 128) {
        reference = out;
        // With no side the two sides of the tail hold the same level; with
        // one, the side the sound is on holds more.
        const size_t from = static_cast<size_t>(4.4f * kRate), to = static_cast<size_t>(5.0f * kRate);
        EXPECT(db(rms(out.left, from, to) / rms(out.right, from, to)) > 1.5, "the side wakes for a sound on one side");
      } else {
        EXPECT(out.left == reference.left && out.right == reference.right,
               "the same output at every block size while the side rests and wakes");
      }
    }

    rng_state() = 0x1EF7u;
    const std::vector<float> hiss = noise(3.0f, kRate, 0.25f);
    const std::vector<float> nothing(hiss.size(), 0.0f);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    const Stereo one = run(device, hiss, nothing);
    const double lean = db(rms(one.left, 48000, 144000) / rms(one.right, 48000, 144000));
    std::printf("noise on the left only, the tail alone: the left is %.1f dB over the right\n", lean);
    EXPECT(lean > 1.5, "a sound on one side keeps its tail more on that side");
  }

  // 29. Bad input on one side: numbers that are not, infinite and absurd
  // ones on the right while a tone holds on the left, then numbers too
  // small to be normal and a standing level. The tail is finite as soon as
  // good input returns, at an ordinary level, and the device comes to rest.
  {
    device.init(kRate);
    const std::vector<float> tone = sine(220.0f, 0.5f, kRate, 0.25f);
    std::vector<float> bad = tone;
    for (size_t i = 1000; i < 3000; ++i) bad[i] = (i % 3 == 0) ? std::nanf("") : (i % 3 == 1 ? INFINITY : 1.0e30f);
    run(device, tone, bad);
    const std::vector<float> tiny(24000, 1.0e-39f);
    const std::vector<float> standing(24000, 0.5f);
    run(device, tiny, standing);
    const std::vector<float> good_in = sine(220.0f, 1.0f, kRate, 0.25f);
    Stereo good = run(device, good_in, good_in);
    EXPECT(finite(good.left) && finite(good.right), "finite again after bad input on one side");
    EXPECT(peak(good.left) < 1.0 && peak(good.right) < 1.0 && rms(good.left, 24000, 48000) > 0.05 &&
               rms(good.right, 24000, 48000) > 0.05,
           "and sounding on both sides, at an ordinary level");
    render(device, 30.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "and at rest after its tail");
  }

  // 30. Other sample rates: the width is the same effect at 44.1 and 96 kHz
  // as at 48: the same bounds summed to mono, and the same side under the
  // middle for a chord, within 1 dB.
  {
    double side_at_48 = 0.0;
    for (float rate : {48000.0f, 44100.0f, 96000.0f}) {
      auto through = [&](const std::vector<int>& which) {
        const std::vector<float> dry = held_notes(which, 5.0f, rate);
        device.init(rate);
        device.set_param(p::kClimb, 2.0f);
        device.set_param(p::kDecay, 12.0f);
        device.set_param(p::kSpread, 0.6f);
        device.set_param(p::kBlur, 0.6f);
        device.set_param(p::kMix, 1.0f);
        return fold_of(dry, run(device, dry), rate);
      };
      double note_fold = 100.0;
      for (int note : {45, 57, 64, 76}) note_fold = std::min(note_fold, through({note}).fold_low);
      const Fold chord_fold = through({62, 69, 74, 77, 81});
      if (rate == 48000.0f) side_at_48 = chord_fold.side_under_middle;
      std::printf("at %.1f kHz, summed to mono: a held note %+.1f dB at its worst, a chord %+.1f dB, its side %.1f dB under the middle\n",
                  rate / 1000.0f, note_fold, chord_fold.fold_low, chord_fold.side_under_middle);
      EXPECT(note_fold > -3.3 && chord_fold.fold_low > -2.4, "the same bounds summed to mono at every sample rate");
      EXPECT(std::fabs(chord_fold.side_under_middle - side_at_48) < 1.0, "the same width at every sample rate");
    }
  }

  // Cost, as CPU time over many blocks (the wall clock is not to be trusted
  // on a busy machine): the defaults, and six voices under a wide bell at
  // the fastest climb.
  for (int worst = 0; worst < 2; ++worst) {
    rng_state() = 0xBEEFu;
    const std::vector<float> input = noise(10.0f, kRate, 0.25f);
    double best = 1.0e9;
    for (int pass = 0; pass < 3; ++pass) {
      device.init(kRate);
      if (worst) {
        device.set_param(p::kVoices, 6.0f);
        device.set_param(p::kSpread, 1.0f);
        device.set_param(p::kClimb, 12.0f);
      }
      const std::clock_t start = std::clock();
      run(device, input);
      best = std::min(best, 1.0e6 * static_cast<double>(std::clock() - start) / CLOCKS_PER_SEC);
    }
    std::printf("spiral %s: %.1f us of CPU per 128-frame stereo block, %.2f%% of real time at 48 kHz (native)\n",
                worst ? "worst setting" : "defaults", best / 3750.0, best / 1.0e5);
  }
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("spiral", 10.0f, kRate, [&] { run(device, input); });

  return finish("spiral");
}
