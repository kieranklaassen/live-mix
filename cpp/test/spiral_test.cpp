// Native harness for Spiral (cpp/devices/spiral). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a tail that climbs without arriving.

#include "../devices/spiral/spiral.h"
#include "support/test_kit.h"

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
  for (float climb : {6.0f, -6.0f, 0.0f}) {
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
    std::printf("glide at %+.0f oct/min: partial moved %.1f cents in 4 s (%.1f expected), worst error %.1f cents\n",
                climb, 1200.0 * std::log2(last / first), 1200.0 * climb / 15.0, worst);
    EXPECT(worst < 12.0, "a partial of the tail stands where the glide clock says");
    const double moved = 12.0 * std::log2(last / first);
    if (climb > 0.0f) EXPECT_NEAR(moved, 4.8, 0.2, "the tail climbs at Climb octaves a minute");
    if (climb < 0.0f) EXPECT_NEAR(moved, -4.8, 0.2, "the tail sinks at Climb octaves a minute");
    if (climb == 0.0f) EXPECT_NEAR(moved, 0.0, 0.05, "the tail holds still at Climb 0");
  }

  // 2. The bell. With the clock at 0.5 and four voices, the partials of a
  // held sine stand at -1.5, -0.5, +0.5 and +1.5 octaves, as loud against
  // each other as sin(pi x)^(2q) says, at a wide and at a middle Spread; a
  // fifth and a sixth voice are silent.
  for (float spread : {1.0f, 0.5f}) {
    wet_only(device);
    device.set_param(p::kVoices, 4.0f);
    device.set_param(p::kSpread, spread);
    turn_to(device, 0.5f, 0.0f);
    Stereo out = run(device, sine(440.0f, 4.0f, kRate, 0.25f));
    const Stack stack = stack_at(0.5, 4, spread);
    const size_t from = static_cast<size_t>(2.0f * kRate), to = static_cast<size_t>(4.0f * kRate);
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
    EXPECT(std::fabs(level[0] - level[1]) < 9.0, "Decay does not change the level of a held sound much");
    EXPECT(level[0] > -10.0 && level[0] < 6.0 && level[1] > -10.0 && level[1] < 6.0,
           "the wet path of a held chord is about as loud as the chord");
  }

  // 7. Part-way Mix. Held tones over the keyboard through the default: the
  // output is never far under the input (the wet path is at other pitches,
  // so it cannot cancel the dry one for long).
  {
    double worst = 100.0, highest = -100.0;
    for (int note = 28; note <= 100; note += 6) {
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
    EXPECT(worst > -4.0, "a held tone does not drop out at the default Mix");
    EXPECT(highest < 6.0, "a held tone is not thrown up at the default Mix");
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
  // Mix are what a hand is on while it sounds.
  {
    struct Move { int id; float from, to; const char* what; };
    const Move moves[] = {
        {p::kVoices, 2.0f, 6.0f, "Voices 2 to 6 does not click"},
        {p::kVoices, 6.0f, 3.0f, "Voices 6 to 3 does not click"},
        {p::kClimb, 12.0f, -12.0f, "Climb turned over does not click"},
        {p::kMix, 0.1f, 0.9f, "Mix does not click"},
        {p::kSpread, 0.0f, 1.0f, "Spread does not click"},
        {p::kBlur, 0.0f, 1.0f, "Blur does not click"},
        {p::kWidth, 1.0f, 0.0f, "Width does not click"},
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
      if (step[1] > rest * 1.5 + 0.002) {
        std::printf("%s: step %.4f moved, %.4f and %.4f at rest\n", move.what, step[1], step[0], step[2]);
      }
      EXPECT(step[1] <= rest * 1.5 + 0.002, move.what);
    }
  }

  // 12. The wet path keeps the two sides apart: an input in anti-phase is
  // not lost, and Width 0 makes the tail the same on both sides.
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
    EXPECT(correlation(same.left, same.right, 48000, 144000) < 0.6, "the tail of a mono input is wide");
    wet_only(device);
    device.set_param(p::kWidth, 0.0f);
    Stereo mono = run(device, in, in);
    double apart = 0.0;
    for (size_t i = 0; i < in.size(); ++i) apart = std::max(apart, std::fabs((double)mono.left[i] - mono.right[i]));
    EXPECT(apart < 1.0e-6, "Width 0 is a mono tail");
  }

  // 13. Tone, Blur and Size each do their own thing. Tone takes highs off;
  // Blur leaves the level alone and smears a click over more time; Size
  // makes the space answer later.
  {
    auto centre_of = [](const std::vector<float>& x) {
      double weight = 0.0, moment = 0.0;
      for (size_t i = 0; i < x.size(); ++i) {
        const double e = static_cast<double>(x[i]) * x[i];
        weight += e;
        moment += e * static_cast<double>(i);
      }
      return weight > 0.0 ? moment / weight / kRate : 0.0;
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
      answer[which] = centre_of(space.left);
    }
    std::printf("Tone 16 kHz to 800 Hz: energy above 3 kHz %.4f to %.5f\n", bright[0], bright[1]);
    std::printf("Blur 0 to 1: level %+.2f dB, a click's first twentieth is out after %.0f ms and %.0f ms\n",
                level[1] - level[0], centre[0] * 1000.0, centre[1] * 1000.0);
    std::printf("Size 0 to 1: a click's energy centred at %.0f ms and %.0f ms\n", answer[0] * 1000.0, answer[1] * 1000.0);
    EXPECT(bright[1] < bright[0] * 0.2, "Tone takes the highs off the tail");
    EXPECT(std::fabs(level[1] - level[0]) < 1.0, "Blur does not change the level");
    EXPECT(centre[1] < centre[0] - 0.02, "Blur smears a click: some of it is out before the plain delays");
    EXPECT(answer[1] > answer[0] + 0.015, "a larger Size answers later");
  }

  // 14. Voices and Spread. With the clock at a whole octave the partials of
  // a held sine stand on octaves of it: Voices says how many sound, and a
  // narrow Spread gives nearly all the power to the one in the middle.
  {
    for (int voices : {2, 3, 4, 5, 6}) {
      wet_only(device);
      device.set_param(p::kVoices, static_cast<float>(voices));
      device.set_param(p::kSpread, 1.0f);
      turn_to(device, 0.5f, 0.0f);
      Stereo out = run(device, sine(440.0f, 3.0f, kRate, 0.25f));
      const Stack stack = stack_at(0.5, voices, 1.0);
      int sounding = 0, expected = 0;
      double strongest = 0.0, level[6];
      for (int v = 0; v < 6; ++v) {
        level[v] = tone_level(out.left, 440.0 * std::exp2(stack.shift[v]), kRate, 96000, 144000);
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
      turn_to(device, 1.0f, 0.0f);
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
      {"Vertigo hall", {1.5f, 20.0f, 0.9f, 5.0f, 0.7f, 5000.0f, 0.8f, 1.0f, 0.45f}},
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
    EXPECT(send_low > -24.0 && send_high < 9.0, "the tail alone holds a tone at every pitch, within a reverb's range");
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
