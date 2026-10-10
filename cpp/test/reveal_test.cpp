// Native harness for Reveal (cpp/devices/reveal). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it an upward compressor of the spectrum: what
// is quiet under something loud comes up by Amount of its deficit, never by
// more than Range, never from under Floor, over the time Rise says, with the
// overall level held and the dry path in step.

#include "../devices/reveal/reveal.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Reveal;
namespace p = livemix::reveal;

static Reveal device;

static const float kRate = 48000.0f;
static const size_t kLate = Reveal::kLatency;

// The constants the device's comment states, for the sums below.
static const double kAroundDbPerOctave = 3.0;

static std::vector<float> add(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(std::max(a.size(), b.size()), 0.0f);
  for (size_t i = 0; i < a.size(); ++i) out[i] += a[i];
  for (size_t i = 0; i < b.size(); ++i) out[i] += b[i];
  return out;
}

// What the device does to the tone at `hz`, in dB, over [from, to) of the
// input (the output read a latency later).
static double change_db(const std::vector<float>& in, const std::vector<float>& out, double hz, size_t from,
                        size_t to) {
  return db(tone_level(out, hz, kRate, from + kLate, to + kLate) / tone_level(in, hz, kRate, from, to));
}

struct Setting {
  int id;
  float value;
};

static void set_up(Reveal& d, std::initializer_list<Setting> settings, float rate = kRate) {
  d.init(rate);
  for (const Setting& s : settings) d.set_param(s.id, s.value);
}

// A loud sine and a quiet one `below_db` under it, `seconds` long.
static std::vector<float> two_tones(double loud_hz, double quiet_hz, double below_db, float seconds,
                                    float loud = 0.5f) {
  return add(sine(static_cast<float>(loud_hz), seconds, kRate, loud),
             sine(static_cast<float>(quiet_hz), seconds, kRate,
                  loud * static_cast<float>(std::pow(10.0, -below_db / 20.0))));
}

// The largest lift among the bands, read back out of the display's readings
// as the display reads them.
static double packed_lift(const Reveal& d, int band) {
  long packed = std::lround(d.meter(2 + band / Reveal::kBandsPerReading));
  for (int i = 0; i < band % Reveal::kBandsPerReading; ++i) packed /= Reveal::kSteps;
  return (packed % Reveal::kSteps) * Reveal::kLiftStepDb;
}
static double packed_level(const Reveal& d, int band) {
  long packed = std::lround(d.meter(2 + Reveal::kReadings + band / Reveal::kBandsPerReading));
  for (int i = 0; i < band % Reveal::kBandsPerReading; ++i) packed /= Reveal::kSteps;
  return Reveal::kLevelFootDb + (packed % Reveal::kSteps) * Reveal::kLevelStepDb;
}
static int band_of(const Reveal& d, double hz) {
  int best = 0;
  for (int b = 1; b < d.bands(); ++b) {
    if (std::fabs(std::log(d.band_hz(b) / hz)) < std::fabs(std::log(d.band_hz(best) / hz))) best = b;
  }
  return best;
}

int main() {
  Conformance spec;
  spec.name = "reveal";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // --- The bands -----------------------------------------------------------------------
  {
    device.init(kRate);
    std::printf("bands at 48 kHz: %d, from %.1f Hz to %.1f Hz\n", device.bands(), device.band_hz(0),
                device.band_hz(device.bands() - 1));
    EXPECT(device.bands() == 85, "85 bands at 48 kHz");
    EXPECT_NEAR(device.band_hz(0), 46.875, 0.01, "the first band is the bin at 46.9 Hz");
    bool rising = true;
    for (int b = 1; b < device.bands(); ++b) rising = rising && device.band_hz(b) > device.band_hz(b - 1);
    EXPECT(rising, "band centres rise");
    for (float rate : {22050.0f, 32000.0f, 44100.0f, 88200.0f, 96000.0f, 192000.0f}) {
      device.init(rate);
      EXPECT(device.bands() >= 40 && device.bands() <= Reveal::kMaxBands, "the bands fit at every sample rate");
      EXPECT(device.band_hz(device.bands() - 1) <= 20000.0f, "and stop at 20 kHz");
    }
  }

  // --- A loud sine and a quiet one 40 dB under it, four octaves away ---------------------
  // The deficit is 40 dB less 3 dB an octave: 28 dB. Amount 0.5 lifts the
  // quiet one by 14 dB and leaves the loud one where it is.
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 40.0, 6.0f);
    const size_t from = 4 * 48000, to = 5 * 48000;
    for (float amount : {0.25f, 0.5f, 1.0f}) {
      set_up(device, {{p::kAmount, amount}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      const double quiet = change_db(in, out.left, 3520.0, from, to);
      const double loud = change_db(in, out.left, 220.0, from, to);
      const double expected = amount * (40.0 - 4.0 * kAroundDbPerOctave);
      std::printf("amount %.2f: quiet %+.2f dB (expected %+.2f), loud %+.2f dB, lift meter %.2f, hold %.3f dB\n",
                  amount, quiet, expected, loud, device.meter(0), device.meter(1));
      EXPECT_NEAR(quiet, expected, 0.6, "the quiet sine is lifted by Amount of its deficit");
      EXPECT(std::fabs(loud) < 0.5, "the loud sine stays within 0.5 dB");
      EXPECT_NEAR(device.meter(0), expected, 0.5, "the lift meter reads the lift");
      const int band = band_of(device, 3520.0);
      EXPECT_NEAR(packed_lift(device, band), device.lift_db(band), 0.26, "the display's reading is the band's lift");
      EXPECT_NEAR(packed_level(device, band_of(device, 220.0)), db(0.5), 2.6, "and its level the band's level");
    }
  }

  // --- One sine alone, at any pitch: there is nothing under it to lift -------------------
  // What its window spills into the bins around it is not a quiet sound.
  {
    double most = 0.0, worst = 0.0;
    for (int n = 0; n < 60; ++n) {
      const double hz = 55.0 * std::pow(2.0, n / 7.3);  // 55 Hz to 14.9 kHz, on no grid
      const std::vector<float> in = sine(static_cast<float>(hz), 1.5f, kRate, 0.9f);
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -96.0f}, {p::kDetail, 1.0f},
                      {p::kRise, 20.0f}});
      const Stereo out = run(device, in);
      most = std::max(most, static_cast<double>(device.meter(0)));
      worst = std::max(worst, std::fabs(change_db(in, out.left, hz, 36000, 60000)));
    }
    std::printf("one sine alone, 60 pitches, everything up: most lift %.2f dB, worst change %.3f dB\n", most, worst);
    EXPECT(most == 0.0, "one sine alone is lifted nowhere, at any pitch");
    EXPECT(worst < 0.05, "and comes out as it went in");
  }

  // --- The lift never exceeds Range ------------------------------------------------------
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 60.0, 4.0f);
    for (float range : {0.0f, 6.0f, 12.0f, 30.0f}) {
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, range}, {p::kFloor, -96.0f}, {p::kDetail, 1.0f},
                      {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      const double quiet = change_db(in, out.left, 3520.0, 2 * 48000, 3 * 48000);
      std::printf("range %4.1f dB: a sine 60 dB down is lifted %+.2f dB, meter %.2f\n", range, quiet, device.meter(0));
      EXPECT(quiet < range + 0.1 && device.meter(0) <= range + 1.0e-4, "the lift never exceeds Range");
      EXPECT(quiet > range - 0.5, "and reaches it when the deficit is large");
    }
  }

  // --- Under Floor nothing is lifted -----------------------------------------------------
  {
    // The quiet sine stands at -66 dBFS: over a floor of -80, under one of -55.
    const std::vector<float> in = two_tones(220.0, 3520.0, 60.0, 4.0f);
    double lifted[2];
    int n = 0;
    for (float floor : {-80.0f, -55.0f}) {
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, floor}, {p::kDetail, 1.0f},
                      {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      lifted[n++] = change_db(in, out.left, 3520.0, 2 * 48000, 3 * 48000);
    }
    std::printf("a sine at -66 dBFS: lifted %+.2f dB over a floor of -80, %+.2f dB under one of -55\n", lifted[0],
                lifted[1]);
    EXPECT(lifted[0] > 20.0, "over Floor it is lifted");
    EXPECT(std::fabs(lifted[1]) < 0.05, "under Floor it is left where it is");

    // The fade over the 6 dB above Floor: half way up it, half the lift.
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 12.0f}, {p::kFloor, -69.0f}, {p::kDetail, 1.0f},
                    {p::kRise, 100.0f}});
    const Stereo knee = run(device, in);
    const double half = change_db(in, knee.left, 3520.0, 2 * 48000, 3 * 48000);
    std::printf("3 dB over Floor: lifted %+.2f dB of 12\n", half);
    EXPECT_NEAR(half, 6.0, 1.0, "3 dB over Floor it gets half the lift");

    // Noise at -90 dBFS stays there, at every setting that could raise it.
    rng_state() = 4242;
    const std::vector<float> hiss = noise(3.0f, kRate, 5.4772e-5f);  // uniform: rms is 0.577 of the peak
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -96.0f}, {p::kDetail, 1.0f},
                    {p::kRise, 20.0f}});
    const Stereo out = run(device, hiss);
    const double in_db = db(rms(hiss, 48000, 96000));
    const double out_db = db(rms(out.left, 48000 + kLate, 96000 + kLate));
    std::printf("noise at %.1f dBFS comes out at %.1f dBFS, lift meter %.2f\n", in_db, out_db, device.meter(0));
    EXPECT(std::fabs(in_db + 90.0) < 0.2, "the noise is at -90 dBFS");
    EXPECT(std::fabs(out_db - in_db) < 0.05 && device.meter(0) == 0.0, "noise at -90 dBFS stays there");

    // Silence stays silent, to the last bit.
    device.init(kRate);
    const Stereo quiet = render(device, 1.0f, kRate);
    EXPECT(peak(quiet.left) == 0.0 && peak(quiet.right) == 0.0, "silence in, silence out");
  }

  // --- Rise sets the time the lift takes ---------------------------------------------------
  // The lift comes up in dB as 1 - exp(-t / Rise): 63 % of the way after Rise.
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 40.0, 8.0f);
    for (float rise : {100.0f, 400.0f, 1600.0f}) {
      set_up(device, {{p::kAmount, 0.5f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, rise}});
      const Stereo out = run(device, in);
      const double full = change_db(in, out.left, 3520.0, 7 * 48000 - 2400, 7 * 48000);
      double reached = -1.0;
      const size_t window = 2400, hop = 240;
      for (size_t at = 0; at + window < 6 * 48000; at += hop) {
        if (change_db(in, out.left, 3520.0, at, at + window) >= 0.632 * full) {
          reached = (at + window / 2) / 48000.0;
          break;
        }
      }
      std::printf("rise %6.0f ms: the lift reaches 63 %% of %.2f dB after %.0f ms\n", rise, full, reached * 1000.0);
      EXPECT_NEAR(reached * 1000.0, rise, 0.12 * rise + 40.0, "Rise is the time the lift takes to come up");
    }
  }

  // --- It comes down at once -----------------------------------------------------------------
  // The quiet sine stands lifted; then a loud one starts in its own band, and
  // the lift held there has to be gone before it is thrown forward.
  {
    std::vector<float> in = two_tones(220.0, 3520.0, 40.0, 6.0f);
    const std::vector<float> strike = sine(3520.0f, 2.0f, kRate, 0.4f);
    const size_t at = 4 * 48000;
    for (size_t i = 0; i < strike.size(); ++i) in[at + i] += strike[i];
    set_up(device, {{p::kAmount, 0.5f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 600.0f}});
    const Stereo out = run(device, in);
    const double before = change_db(in, out.left, 3520.0, at - 4800, at);
    const double first = db(peak(out.left, at + kLate, at + kLate + 4800) / 0.9);
    const double later = change_db(in, out.left, 3520.0, at + 24000, at + 48000);
    std::printf("a loud note starts where %.1f dB of lift stood: its first 100 ms peak %+.2f dB over itself, "
                "then %+.2f dB\n",
                before, first, later);
    EXPECT(before > 12.0, "the quiet sine stood lifted");
    EXPECT(first < 1.0, "a note that starts where a lift was is not thrown forward");
    EXPECT(std::fabs(later) < 0.3, "and then stands where it came in");
  }

  // --- No pumping on a held chord, and the level is held -------------------------------------
  {
    // Four notes with partials falling 12 dB an octave, and a bed of noise 50 dB down.
    std::vector<float> chord(10 * 48000, 0.0f);
    for (double note : {110.0, 164.81, 220.0, 277.18}) {
      for (int h = 1; h <= 12; ++h) {
        const float gain = 0.12f / static_cast<float>(h * h);
        const std::vector<float> partial = sine(static_cast<float>(note * h), 10.0f, kRate, gain);
        for (size_t i = 0; i < chord.size(); ++i) chord[i] += partial[i];
      }
    }
    rng_state() = 777;
    const std::vector<float> bed = noise(10.0f, kRate, 0.002f);
    const std::vector<float> in = add(chord, bed);
    for (int setting = 0; setting < 3; ++setting) {
      if (setting == 0) set_up(device, {});
      if (setting == 1) set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -96.0f}, {p::kDetail, 1.0f}});
      if (setting == 2) set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -96.0f}, {p::kDetail, 0.0f}, {p::kRise, 20.0f}});
      const Stereo out = run(device, in);
      const size_t window = 4800;
      double low = 1.0e9, high = -1.0e9, in_low = 1.0e9, in_high = -1.0e9;
      for (size_t at = 5 * 48000; at + window <= 9 * 48000; at += window) {
        const double level = db(rms(out.left, at + kLate, at + kLate + window));
        const double came = db(rms(in, at, at + window));
        low = std::min(low, level);
        high = std::max(high, level);
        in_low = std::min(in_low, came);
        in_high = std::max(in_high, came);
      }
      const double held = db(rms(out.left, 5 * 48000 + kLate, 9 * 48000 + kLate) / rms(in, 5 * 48000, 9 * 48000));
      std::printf("held chord, setting %d: level moves %.3f dB (the input %.3f dB), out %+.2f dB against in, "
                  "lift %.1f dB, hold %.2f dB\n",
                  setting, high - low, in_high - in_low, held, device.meter(0), device.meter(1));
      EXPECT(high - low < in_high - in_low + (setting == 2 ? 0.5 : 0.2), "a held chord does not pump");
      EXPECT(std::fabs(held) < 0.5, "the overall level is held within half a dB");
      if (setting > 0) EXPECT(device.meter(0) > 20.0 && device.meter(1) < -3.0, "while a great deal is lifted");
    }
  }

  // --- What was loud is remembered: the quiet left behind stays lifted, then lets go --------
  // The loud sine stops; the quiet one goes on. At Rise 300 ms the memory
  // falls 10 dB a second, so the lift (half the deficit) falls 5 dB a second.
  {
    std::vector<float> in = sine(3520.0f, 8.0f, kRate, 0.005f);
    const std::vector<float> loud = sine(220.0f, 3.0f, kRate, 0.5f);
    for (size_t i = 0; i < loud.size(); ++i) in[i] += loud[i] * std::min(1.0f, (loud.size() - i) / 480.0f);
    set_up(device, {{p::kAmount, 0.5f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 300.0f}});
    const Stereo out = run(device, in);
    const double with = change_db(in, out.left, 3520.0, 2 * 48000, 3 * 48000 - 4800);
    const double soon = change_db(in, out.left, 3520.0, 3 * 48000 + 9600, 3 * 48000 + 14400);
    const double after = change_db(in, out.left, 3520.0, 4 * 48000 + 9600, 4 * 48000 + 14400);
    const double gone = change_db(in, out.left, 3520.0, 7 * 48000, 7 * 48000 + 24000);
    std::printf("the loud sine stops: the quiet one stands %+.2f dB with it, %+.2f dB 0.25 s after, %+.2f dB "
                "1.25 s after, %+.2f dB at the end\n",
                with, soon, after, gone);
    EXPECT(soon > with - 2.5, "the quiet that is left stays lifted when the loud stops");
    EXPECT_NEAR(soon - after, 5.0, 1.0, "and lets go as the memory of the loud fades, 5 dB a second here");
    EXPECT(std::fabs(gone) < 0.1, "until it stands at its own level");
  }

  // --- Latency, the dry path and Mix -----------------------------------------------------
  {
    rng_state() = 77;
    const std::vector<float> in = noise(1.0f, kRate, 0.5f);
    set_up(device, {{p::kMix, 0.0f}, {p::kAmount, 1.0f}, {p::kOutput, 12.0f}});
    const Stereo dry = run(device, in);
    bool same = true;
    for (size_t i = 0; i + kLate < in.size(); ++i) same = same && dry.left[i + kLate] == in[i];
    EXPECT(same, "mix 0 is the input, 2304 samples late, bit for bit");
    EXPECT(peak(dry.left, 0, kLate) == 0.0, "and nothing before that");

    // Part-way Mix: a quiet held tone anywhere on the piano, under a loud one
    // two octaves and a fifth off, comes out between its dry and its wet
    // level, never under the dry one.
    double worst_dip = 0.0, worst_off = 0.0, least_wet = 100.0;
    for (int key = 12; key < 88; key += 3) {
      const double hz = 27.5 * std::pow(2.0, key / 12.0);
      const double other = hz < 700.0 ? hz * 5.993 : hz / 5.993;
      const std::vector<float> tones = two_tones(other, hz, 30.0, 3.0f);
      double lifts[2];
      int n = 0;
      for (float mix : {1.0f, 0.5f}) {
        set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 12.0f}, {p::kDetail, 1.0f}, {p::kRise, 50.0f}, {p::kMix, mix}});
        const Stereo out = run(device, tones);
        lifts[n++] = change_db(tones, out.left, hz, 96000, 120000);
      }
      const double expected = db(0.5 + 0.5 * std::pow(10.0, lifts[0] / 20.0));
      least_wet = std::min(least_wet, lifts[0]);
      worst_dip = std::min(worst_dip, lifts[1]);
      worst_off = std::max(worst_off, std::fabs(lifts[1] - expected));
    }
    std::printf("mix 0.5 over the piano: worst dip %.3f dB, worst distance from the plain crossfade %.3f dB\n",
                worst_dip, worst_off);
    std::printf("  (the wet lift of those tones is %.2f dB at the least)\n", least_wet);
    EXPECT(least_wet > 8.0, "every one of those tones is lifted at Mix 1");
    EXPECT(worst_dip > -0.1, "part-way Mix never takes a held tone down");
    EXPECT(worst_off < 0.3, "and is the plain crossfade of two signals in phase");
  }

  // --- Left and right take the same gains --------------------------------------------------
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 40.0, 3.0f);
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 50.0f}});
    const Stereo mono = run(device, in);
    EXPECT(mono.left == mono.right, "mono in, mono out, bit for bit");

    // Opposite phase: the same lift, the same level, still opposite.
    std::vector<float> flipped(in.size());
    for (size_t i = 0; i < in.size(); ++i) flipped[i] = -in[i];
    device.init(kRate);
    device.set_param(p::kAmount, 1.0f);
    device.set_param(p::kRange, 30.0f);
    device.set_param(p::kDetail, 1.0f);
    device.set_param(p::kRise, 50.0f);
    const Stereo anti = run(device, in, flipped);
    bool opposite = true;
    for (size_t i = 0; i < in.size(); ++i) opposite = opposite && anti.left[i] == -anti.right[i];
    EXPECT(opposite && anti.left == mono.left, "left and right in opposite phase come out as they would in phase");

    // The loud sine on the left only, the quiet one on the right at half the
    // level it has on the left: the balance of the quiet one is kept.
    std::vector<float> left = two_tones(220.0, 3520.0, 40.0, 3.0f);
    std::vector<float> right = sine(3520.0f, 3.0f, kRate, 0.0025f);
    device.init(kRate);
    device.set_param(p::kAmount, 1.0f);
    device.set_param(p::kRange, 30.0f);
    device.set_param(p::kDetail, 1.0f);
    device.set_param(p::kRise, 50.0f);
    const Stereo wide = run(device, left, right);
    const double on_left = change_db(left, wide.left, 3520.0, 96000, 120000);
    const double on_right = change_db(right, wide.right, 3520.0, 96000, 120000);
    std::printf("stereo: the quiet sine is lifted %+.2f dB on the left and %+.2f dB on the right\n", on_left, on_right);
    EXPECT(on_left > 15.0 && std::fabs(on_left - on_right) < 0.05, "both sides take the same lift: the image stays");
  }

  // --- Detail: single partials, or regions ---------------------------------------------------
  // A loud sine at 1 kHz and a quiet one 30 dB under it at 1.2 kHz, 0.263 of
  // an octave apart. At Detail 1 only the quiet one is lifted, by Amount of
  // its deficit. Under that the lift is the mean over the sounding bands
  // within (1 - Detail)² octaves, nearer ones counting more: at Detail 0 the
  // other sine counts 0.737 against 1 for the band itself.
  {
    const std::vector<float> in = two_tones(1000.0, 1200.0, 30.0, 4.0f);
    double quiet[4], loud[4];
    int n = 0;
    for (float detail : {1.0f, 0.6f, 0.3f, 0.0f}) {
      set_up(device, {{p::kAmount, 0.5f}, {p::kRange, 30.0f}, {p::kDetail, detail}, {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      const double hold = device.meter(1);
      quiet[n] = change_db(in, out.left, 1200.0, 2 * 48000, 3 * 48000) - hold;
      loud[n] = change_db(in, out.left, 1000.0, 2 * 48000, 3 * 48000) - hold;
      std::printf("detail %.1f: the quiet sine %+.2f dB, the loud one %+.2f dB (before the level hold of %.2f dB)\n",
                  detail, quiet[n], loud[n], hold);
      ++n;
    }
    const double own = 0.5 * (30.0 - kAroundDbPerOctave * std::log2(1.2));
    EXPECT_NEAR(quiet[0], own, 0.7, "at Detail 1 the quiet partial gets its own lift");
    EXPECT(std::fabs(loud[0]) < 0.1, "and the loud one none");
    EXPECT_NEAR(quiet[1], own, 0.7, "at Detail 0.6 the two are still apart");
    EXPECT(quiet[2] < quiet[1] - 1.0 && quiet[3] < quiet[2] - 1.0, "less Detail shares the lift out");
    EXPECT(loud[2] > 1.0 && loud[3] > loud[2] + 1.0, "so that the loud partial beside it comes up too");
    EXPECT_NEAR(quiet[3], own / 1.737, 0.8, "at Detail 0 the quiet one keeps 1 part in 1.737 of the lift");
    EXPECT_NEAR(loud[3], own * 0.737 / 1.737, 0.8, "and the loud one takes the rest");
  }

  // --- Focus: which end is revealed ----------------------------------------------------------
  // A loud sine at 1 kHz with a quiet one three octaves under it and one
  // three over, each 30 dB down: a deficit of 21 dB each.
  {
    const std::vector<float> in = add(two_tones(1000.0, 125.0, 30.0, 4.0f), sine(8000.0f, 4.0f, kRate, 0.5f * 0.031623f));
    double low[3], high[3];
    int n = 0;
    for (float focus : {-1.0f, 0.0f, 1.0f}) {
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 100.0f},
                      {p::kFocus, focus}});
      const Stereo out = run(device, in);
      const double hold = device.meter(1);
      low[n] = change_db(in, out.left, 125.0, 2 * 48000, 3 * 48000) - hold;
      high[n] = change_db(in, out.left, 8000.0, 2 * 48000, 3 * 48000) - hold;
      std::printf("focus %+.0f: 125 Hz %+.2f dB, 8 kHz %+.2f dB\n", focus, low[n], high[n]);
      ++n;
    }
    // Focus takes the lift away in proportion to the distance from its end, 60 Hz to 12 kHz.
    const double at_low = std::log2(125.0 / 60.0) / std::log2(200.0);
    const double at_high = std::log2(8000.0 / 60.0) / std::log2(200.0);
    EXPECT_NEAR(low[1], 21.0, 1.0, "Focus in the middle: the low sine gets all its lift");
    EXPECT_NEAR(high[1], 21.0, 1.0, "and the high one");
    EXPECT_NEAR(low[0], 21.0 * (1.0 - at_low), 1.0, "Focus down keeps the low end");
    EXPECT_NEAR(high[0], 21.0 * (1.0 - at_high), 1.0, "and lets go of the top");
    EXPECT_NEAR(low[2], 21.0 * at_low, 1.0, "Focus up lets go of the low end");
    EXPECT_NEAR(high[2], 21.0 * at_high, 1.0, "and keeps the top");
  }

  // --- Listen: only what is added ------------------------------------------------------------
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 40.0, 4.0f);
    set_up(device, {{p::kAmount, 0.5f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 100.0f},
                    {p::kListen, 1.0f}, {p::kMix, 0.3f}});
    const Stereo out = run(device, in);
    const double loud = change_db(in, out.left, 220.0, 2 * 48000, 3 * 48000);
    const double quiet = change_db(in, out.left, 3520.0, 2 * 48000, 3 * 48000);
    // 13.85 dB of lift is a gain of 4.93: what is added is 3.93 times the quiet sine.
    std::printf("listen: the loud sine %+.1f dB, the quiet one %+.2f dB (what is added: %+.2f dB)\n", loud, quiet,
                db(std::pow(10.0, 13.85 / 20.0) - 1.0));
    EXPECT(loud < -60.0, "Listen leaves out what is not lifted");
    EXPECT_NEAR(quiet, db(std::pow(10.0, 13.85 / 20.0) - 1.0), 0.5, "and plays what is added, whatever Mix says");
  }

  return finish("reveal");
}
