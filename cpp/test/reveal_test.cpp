// Native harness for Reveal (cpp/devices/reveal). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it an upward compressor of the spectrum: what
// is quiet under something loud comes up by Amount of its deficit, never by
// more than Range, never from under Floor (counted down from the loudest
// sound of late), over the time Rise says, with the overall level held, the
// crests under a ceiling and the dry path in step. And what it must not do:
// lift anything towards a sound that has stopped, hold a bed of noise up
// through a pause, or behave otherwise at another level, block size or
// sample rate.

#include "../devices/reveal/reveal.h"
#include "support/test_kit.h"

#include <limits>

using namespace testkit;
using livemix::Reveal;
namespace p = livemix::reveal;

static Reveal device;

static const float kRate = 48000.0f;
static const size_t kLate = Reveal::kLatency;

// The constants the device's comment states, for the sums below.
static const double kAroundDbPerOctave = 3.0;
static const float kLowest = -72.0f;  // Floor all the way down

static std::vector<float> add(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(std::max(a.size(), b.size()), 0.0f);
  for (size_t i = 0; i < a.size(); ++i) out[i] += a[i];
  for (size_t i = 0; i < b.size(); ++i) out[i] += b[i];
  return out;
}

// What the device does to the tone at `hz`, in dB, over [from, to) of the
// input (the output read a latency later).
static double change_db(const std::vector<float>& in, const std::vector<float>& out, double hz, size_t from,
                        size_t to, float rate = kRate) {
  return db(tone_level(out, hz, rate, from + kLate, to + kLate) / tone_level(in, hz, rate, from, to));
}

struct Setting {
  int id;
  float value;
};

static void set_up(Reveal& d, const std::vector<Setting>& settings, float rate = kRate) {
  d.init(rate);
  for (const Setting& s : settings) d.set_param(s.id, s.value);
}

// A loud sine and a quiet one `below_db` under it, `seconds` long.
static std::vector<float> two_tones(double loud_hz, double quiet_hz, double below_db, float seconds,
                                    float loud = 0.5f, float rate = kRate) {
  return add(sine(static_cast<float>(loud_hz), seconds, rate, loud),
             sine(static_cast<float>(quiet_hz), seconds, rate,
                  loud * static_cast<float>(std::pow(10.0, -below_db / 20.0))));
}

// A band's lift and level, read back out of the display's readings as the
// display reads them. The level is counted down from the loudest band of late.
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

// --- Material for what a musician plays ------------------------------------------------------

// One struck, ringing note: partials a little sharp of whole, the upper ones
// weaker and dying sooner, 2 ms of attack, damped over 80 ms when it ends.
static void strike(std::vector<float>& x, float rate, double hz, double at, double seconds, double amp) {
  const size_t start = static_cast<size_t>(at * rate), n = static_cast<size_t>((seconds + 0.1) * rate);
  if (x.size() < start + n) x.resize(start + n, 0.0f);
  for (int k = 1; k <= 60; ++k) {
    const double f = hz * k * std::sqrt(1.0 + 0.0004 * k * k);
    if (f > 0.42 * rate) break;
    const double a = amp * std::pow(k, -1.2);
    const double tau = 2.2 / (1.0 + 0.45 * (k - 1)) * std::sqrt(220.0 / hz);
    for (size_t i = 0; i < n; ++i) {
      const double t = i / static_cast<double>(rate);
      double env = std::exp(-t / tau);
      if (t < 0.002) env *= 0.5 - 0.5 * std::cos(kPi * t / 0.002);
      if (t > seconds) env *= std::max(0.0, 1.0 - (t - seconds) / 0.08);
      x[start + i] += static_cast<float>(a * env * std::sin(2.0 * kPi * f * t + k));
    }
  }
}

// Six such notes with gaps between them, the last damped at 7.58 s, in
// `seconds` of signal: what follows is the pause.
static std::vector<float> phrase(float rate, double amp, float seconds) {
  std::vector<float> x(static_cast<size_t>(seconds * rate), 0.0f);
  strike(x, rate, 220.00, 0.5, 0.8, amp);
  strike(x, rate, 261.63, 1.6, 0.6, amp);
  strike(x, rate, 329.63, 2.5, 0.9, amp);
  strike(x, rate, 110.00, 4.0, 1.2, amp);
  strike(x, rate, 164.81, 6.0, 0.7, amp);
  strike(x, rate, 392.00, 7.0, 0.5, amp);
  x.resize(static_cast<size_t>(seconds * rate));
  return x;
}

// White noise of the given rms in dBFS (the kit's noise is uniform: its rms is 0.577 of its peak).
static std::vector<float> hiss(float seconds, float rate, double dbfs, uint32_t seed) {
  rng_state() = seed;
  return noise(seconds, rate, static_cast<float>(std::pow(10.0, dbfs / 20.0) / 0.57735));
}

// A room: noise falling towards the top, a rumble, mains hum at 50, 100 and
// 150 Hz, wandering slowly; its rms `dbfs`.
static std::vector<float> room_tone(float seconds, float rate, double dbfs, uint32_t seed) {
  rng_state() = seed;
  std::vector<float> x(static_cast<size_t>(seconds * rate));
  double b0 = 0.0, b1 = 0.0, b2 = 0.0, low = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    const double w = white();
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    low += (w - low) * (2.0 * kPi * 60.0 / rate);
    const double t = i / static_cast<double>(rate);
    const double hum = 0.5 * std::sin(2.0 * kPi * 50.0 * t) + 0.25 * std::sin(2.0 * kPi * 100.0 * t + 1.0) +
                       0.12 * std::sin(2.0 * kPi * 150.0 * t + 2.0);
    const double wander = 1.0 + 0.2 * std::sin(2.0 * kPi * 0.13 * t) + 0.1 * std::sin(2.0 * kPi * 0.31 * t + 1.0);
    x[i] = static_cast<float>(((b0 + b1 + b2 + w * 0.1848) * 0.25 + 6.0 * low + 0.35 * hum) * wander);
  }
  const float gain = static_cast<float>(std::pow(10.0, dbfs / 20.0) / rms(x));
  for (float& v : x) v *= gain;
  return x;
}

// A bed's own gain under a phrase. The device is not linear, so the bed is
// told from the notes by rendering twice, with the bed added and with it
// taken away: half the difference of the two is what became of the bed.
struct Bed {
  std::vector<float> through;  // the bed as it came out
  std::vector<float> came;     // the bed as it went in, a latency late
  float rate = kRate;
  // Its gain in dB over [from, to) seconds.
  double gain(double from, double to) const {
    const size_t a = static_cast<size_t>(from * rate), b = static_cast<size_t>(to * rate);
    return db(rms(through, a, b) / rms(came, a, b));
  }
};
static Bed bed_under(Reveal& d, const std::vector<Setting>& settings, const std::vector<float>& notes,
                     const std::vector<float>& bed, float rate = kRate) {
  std::vector<float> with = notes, without = notes;
  for (size_t i = 0; i < bed.size() && i < notes.size(); ++i) {
    with[i] += bed[i];
    without[i] -= bed[i];
  }
  set_up(d, settings, rate);
  const Stereo a = run(d, with);
  set_up(d, settings, rate);
  const Stereo b = run(d, without);
  Bed out;
  out.rate = rate;
  out.through.resize(notes.size());
  out.came.assign(notes.size(), 0.0f);
  for (size_t i = 0; i < notes.size(); ++i) out.through[i] = 0.5f * (a.left[i] - b.left[i]);
  for (size_t i = kLate; i < notes.size() && i - kLate < bed.size(); ++i) out.came[i] = bed[i - kLate];
  return out;
}

// A held chord: notes with partials falling off, and a bed of noise under it.
static std::vector<float> held_chord(float rate, float seconds, float amp, float bed_gain, uint32_t seed) {
  std::vector<float> chord(static_cast<size_t>(seconds * rate), 0.0f);
  for (double note : {110.0, 164.81, 220.0, 277.18}) {
    for (int h = 1; h <= 12; ++h) {
      const std::vector<float> partial = sine(static_cast<float>(note * h), seconds, rate, amp / (h * h));
      for (size_t i = 0; i < chord.size(); ++i) chord[i] += partial[i];
    }
  }
  rng_state() = seed;
  return add(chord, noise(seconds, rate, bed_gain));
}

// The presets, as "presets" in device.json has them.
struct Preset {
  const char* name;
  std::vector<Setting> settings;
};
static const std::vector<Preset>& presets() {
  static const std::vector<Preset> table = {
      {"Reveal", {}},
      {"Gentle opening", {{p::kAmount, 0.4f}, {p::kRange, 10.0f}, {p::kRise, 700.0f}, {p::kFocus, 0.3f}, {p::kDetail, 0.15f}}},
      {"Air", {{p::kAmount, 0.9f}, {p::kRange, 24.0f}, {p::kFloor, -58.0f}, {p::kFocus, 1.0f}, {p::kDetail, 0.5f}}},
      {"Warm body", {{p::kAmount, 0.9f}, {p::kRange, 24.0f}, {p::kFocus, -1.0f}, {p::kDetail, 0.3f}}},
      {"Slow bloom", {{p::kAmount, 0.8f}, {p::kRange, 24.0f}, {p::kRise, 2000.0f}}},
      {"Cling", {{p::kAmount, 0.6f}, {p::kRange, 15.0f}, {p::kRise, 20.0f}, {p::kDetail, 0.9f}}},
      {"Overtones", {{p::kAmount, 0.75f}, {p::kRange, 24.0f}, {p::kFloor, -54.0f}, {p::kRise, 200.0f}, {p::kDetail, 1.0f}}},
      {"Broad lift", {{p::kAmount, 0.7f}, {p::kRange, 12.0f}, {p::kDetail, 0.0f}}},
      {"Room forward", {{p::kAmount, 0.7f}, {p::kRange, 24.0f}, {p::kFloor, -66.0f}, {p::kRise, 800.0f}, {p::kDetail, 0.7f}}},
      {"Even glow", {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -60.0f}, {p::kRise, 400.0f}, {p::kDetail, 0.5f}}},
      {"Everything level", {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -72.0f}, {p::kRise, 150.0f}, {p::kDetail, 1.0f}}},
      {"Touch", {{p::kAmount, 0.3f}, {p::kRange, 5.0f}, {p::kRise, 60.0f}, {p::kDetail, 1.0f}}},
      {"Breath", {{p::kAmount, 0.6f}, {p::kRange, 20.0f}, {p::kFloor, -60.0f}, {p::kRise, 80.0f}, {p::kFocus, 0.5f}, {p::kDetail, 0.9f}}},
      {"Half lit", {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -64.0f}, {p::kMix, 0.5f}}},
      {"Glass top", {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kRise, 60.0f}, {p::kFocus, 1.0f}, {p::kDetail, 1.0f}}},
      {"Slow and deep", {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -66.0f}, {p::kRise, 4000.0f}, {p::kDetail, 0.3f}}},
  };
  return table;
}

// --- What it does at one sample rate ---------------------------------------------------------
// The whole behaviour in short, for the rates the frame is not sized for:
// the frame is 2048 samples at every rate, so everything stated in time or
// in frequency has to be worked out from the rate.
static void behaves_at(float rate) {
  const size_t second = static_cast<size_t>(rate);
  std::printf("---- at %.0f Hz: %d ms of latency ----\n", rate, static_cast<int>(1000.0f * kLate / rate + 0.5f));

  // Amount, Range and Floor on a loud sine and a quiet one four octaves over it.
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 40.0, 4.0f, 0.5f, rate);
    set_up(device, {{p::kAmount, 0.5f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 100.0f}}, rate);
    const Stereo out = run(device, in);
    const double quiet = change_db(in, out.left, 3520.0, 2 * second, 3 * second, rate);
    const double loud = change_db(in, out.left, 220.0, 2 * second, 3 * second, rate);
    const std::vector<float> deep = two_tones(220.0, 3520.0, 60.0, 4.0f, 0.5f, rate);
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 6.0f}, {p::kFloor, kLowest}, {p::kDetail, 1.0f}, {p::kRise, 100.0f}}, rate);
    const Stereo capped = run(device, deep);
    const double at_range = change_db(deep, capped.left, 3520.0, 2 * second, 3 * second, rate);
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -48.0f}, {p::kDetail, 1.0f}, {p::kRise, 100.0f}}, rate);
    const Stereo under = run(device, deep);
    const double under_floor = change_db(deep, under.left, 3520.0, 2 * second, 3 * second, rate);
    std::printf("  amount 0.5: quiet %+.2f dB, loud %+.2f dB; range 6: %+.2f dB; 60 dB down under a Floor of -48: %+.2f dB\n",
                quiet, loud, at_range, under_floor);
    EXPECT_NEAR(quiet, 14.0, 0.6, "at every rate the quiet sine is lifted by Amount of its deficit");
    EXPECT(std::fabs(loud) < 0.5, "and the loud one stays");
    EXPECT_NEAR(at_range, 6.0, 0.3, "at every rate Range is the most");
    EXPECT(std::fabs(under_floor) < 0.05, "at every rate nothing under Floor is lifted");
  }
  // Rise.
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 40.0, 4.0f, 0.5f, rate);
    set_up(device, {{p::kAmount, 0.5f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 400.0f}}, rate);
    const Stereo out = run(device, in);
    const double full = change_db(in, out.left, 3520.0, 3 * second, 4 * second - second / 10, rate);
    double reached = -1.0;
    const size_t window = second / 20, hop = second / 200;
    for (size_t at = 0; at + window < 3 * second; at += hop) {
      if (change_db(in, out.left, 3520.0, at, at + window, rate) >= 0.632 * full) {
        reached = (at + window / 2) / static_cast<double>(rate);
        break;
      }
    }
    std::printf("  rise 400 ms: 63 %% of %.2f dB after %.0f ms\n", full, reached * 1000.0);
    EXPECT_NEAR(reached * 1000.0, 400.0, 90.0, "at every rate Rise is the time the lift takes");
  }
  // The dry path, and the level of a held chord with everything up.
  {
    rng_state() = 77;
    const std::vector<float> in = noise(1.0f, rate, 0.5f);
    set_up(device, {{p::kMix, 0.0f}, {p::kAmount, 1.0f}}, rate);
    const Stereo dry = run(device, in);
    bool same = true;
    for (size_t i = 0; i + kLate < in.size(); ++i) same = same && dry.left[i + kLate] == in[i];
    EXPECT(same, "at every rate mix 0 is the input 2304 samples late, bit for bit");
    const std::vector<float> chord = held_chord(rate, 8.0f, 0.12f, 0.002f, 777);
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kDetail, 1.0f}}, rate);
    const Stereo out = run(device, chord);
    double low = 1.0e9, high = -1.0e9;
    for (size_t at = 4 * second; at + second / 10 <= 7 * second; at += second / 10) {
      const double level = db(rms(out.left, at + kLate, at + kLate + second / 10) / rms(chord, at, at + second / 10));
      low = std::min(low, level);
      high = std::max(high, level);
    }
    std::printf("  held chord, everything up: out against in %+.2f to %+.2f dB, lift %.1f dB, peak %+.2f dB over the input's\n",
                low, high, device.meter(0), db(peak(out.left) / peak(chord)));
    EXPECT(low > -0.5 && high < 0.5, "at every rate the level of a held chord is held");
    EXPECT(peak(out.left) < Reveal::kCeilingTop * peak(chord), "and its crests stay under the ceiling");
  }
  // A phrase over hiss: the bed in the pause, and the rest after it.
  {
    const std::vector<float> notes = phrase(rate, 0.3, 10.0f);
    const Bed bed = bed_under(device, {}, notes, hiss(10.0f, rate, -50.0, 7), rate);
    std::printf("  hiss at -50 dBFS under a phrase: %+.2f dB 0.1 to 0.3 s into the pause, %+.2f dB after 0.5 s\n",
                bed.gain(7.7, 7.9), bed.gain(8.1, 8.6));
    EXPECT(bed.gain(7.7, 7.9) < 2.0 && bed.gain(8.1, 8.6) < 0.5, "at every rate the bed is not held up in the pause");
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kRise, 4000.0f}}, rate);
    run(device, notes);
    render(device, 1.5f, rate);
    const Stereo after = render(device, 0.25f, rate);
    EXPECT(device.asleep() && peak(after.left) == 0.0, "at every rate it is asleep 1.5 s after the sound");
  }
  // The same at every block size, across a silence it falls asleep in, with a knob moved in the silence.
  {
    double worst = 0.0;
    bool slept = false, woke = false;
    for (float gap : {0.3f, 0.65f, 0.75f, 0.8f, 0.85f, 0.9f, 1.6f}) {
      rng_state() = 99;
      std::vector<float> head = add(noise(0.3f, rate, 0.05f), sine(330.0f, 0.3f, rate, 0.4f));
      const std::vector<float> quiet = silence(gap, rate);
      head.insert(head.end(), quiet.begin(), quiet.end());
      const std::vector<float> again = add(noise(0.4f, rate, 0.05f), sine(495.0f, 0.4f, rate, 0.4f));
      Stereo reference;
      for (int block : {128, 1, 2048, 37}) {
        set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kRise, 20.0f}, {p::kMix, 0.8f}}, rate);
        std::vector<float> first(head.begin(), head.end() - 3);
        std::vector<float> rest(head.end() - 3, head.end());
        rest.insert(rest.end(), again.begin(), again.end());
        const Stereo a = run(device, first, block);
        if (block == 128) (device.asleep() ? slept : woke) = true;
        device.set_param(p::kOutput, 9.0f);  // three samples before the sound returns
        const Stereo render = concat(a, run(device, rest, block));
        if (block == 128) {
          reference = render;
          continue;
        }
        for (size_t i = 0; i < render.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(render.left[i]) - reference.left[i]));
        }
      }
    }
    std::printf("  block sizes 1, 37, 128, 2048 across a silence, Output moved in it: worst difference %.3g\n", worst);
    EXPECT(slept && woke, "the silences reach from before it sleeps to after");
    EXPECT(worst < 1.0e-6, "at every rate the same at every block size across a sleep");
  }
}

int main() {
  Conformance spec;
  spec.name = "reveal";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
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
      std::printf("  at %.0f Hz: %d bands\n", rate, device.bands());
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
      // The levels the display reads are counted down from the loudest band of late.
      EXPECT_NEAR(device.meter(Reveal::kTopMeter), db(0.5), 0.3, "the loudest band of late is the loud sine");
      EXPECT_NEAR(packed_level(device, band_of(device, 220.0)), 0.0, 0.76, "which reads at the top");
      EXPECT_NEAR(packed_level(device, band), -40.0, 0.76, "and the quiet sine 40 dB under it");
    }
  }

  // --- One sine alone, at any pitch: there is nothing under it to lift -------------------
  // What its window spills into the bins around it is not a quiet sound.
  {
    double most = 0.0, worst = 0.0;
    for (int n = 0; n < 60; ++n) {
      const double hz = 55.0 * std::pow(2.0, n / 7.3);  // 55 Hz to 14.9 kHz, on no grid
      const std::vector<float> in = sine(static_cast<float>(hz), 1.5f, kRate, 0.9f);
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kDetail, 1.0f},
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
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, range}, {p::kFloor, kLowest}, {p::kDetail, 1.0f},
                      {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      const double quiet = change_db(in, out.left, 3520.0, 2 * 48000, 3 * 48000);
      std::printf("range %4.1f dB: a sine 60 dB down is lifted %+.2f dB, meter %.2f\n", range, quiet, device.meter(0));
      EXPECT(quiet < range + 0.1 && device.meter(0) <= range + 1.0e-4, "the lift never exceeds Range");
      EXPECT(quiet > range - 0.5, "and reaches it when the deficit is large");
    }
  }

  // --- Floor is counted down from the loudest sound of late ------------------------------
  {
    // The quiet sine stands 60 dB under the loud one: over a Floor of -72, under one of -50.
    const std::vector<float> in = two_tones(220.0, 3520.0, 60.0, 4.0f);
    double lifted[2];
    int n = 0;
    for (float floor : {-72.0f, -50.0f}) {
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, floor}, {p::kDetail, 1.0f},
                      {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      lifted[n++] = change_db(in, out.left, 3520.0, 2 * 48000, 3 * 48000);
      EXPECT_NEAR(device.floor_db(), db(0.5) + floor, 0.3, "Floor stands that far under the loud sine");
    }
    std::printf("a sine 60 dB under the loud one: lifted %+.2f dB over a Floor of -72, %+.2f dB under one of -50\n",
                lifted[0], lifted[1]);
    EXPECT(lifted[0] > 20.0, "over Floor it is lifted");
    EXPECT(std::fabs(lifted[1]) < 0.05, "under Floor it is left where it is");

    // The fade over the 6 dB above Floor: half way up it, half the lift.
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 12.0f}, {p::kFloor, -63.0f}, {p::kDetail, 1.0f},
                    {p::kRise, 100.0f}});
    const Stereo knee = run(device, in);
    const double half = change_db(in, knee.left, 3520.0, 2 * 48000, 3 * 48000);
    std::printf("3 dB over Floor: lifted %+.2f dB of 12\n", half);
    EXPECT_NEAR(half, 6.0, 1.0, "3 dB over Floor it gets half the lift");

    // The same sound 30 dB quieter is treated the same: Floor goes down with it.
    double at_level[2];
    n = 0;
    for (float loud : {0.5f, 0.5f * 0.031623f}) {
      const std::vector<float> tones = two_tones(220.0, 3520.0, 40.0, 4.0f, loud);
      set_up(device, {{p::kDetail, 1.0f}, {p::kRise, 100.0f}});
      const Stereo out = run(device, tones);
      at_level[n++] = change_db(tones, out.left, 3520.0, 2 * 48000, 3 * 48000);
    }
    std::printf("the default on a sine 40 dB under a loud one: %+.2f dB; the same 30 dB quieter: %+.2f dB\n",
                at_level[0], at_level[1]);
    EXPECT(at_level[0] > 10.0, "the default lifts it");
    EXPECT_NEAR(at_level[1], at_level[0], 0.2, "and lifts it the same when everything is 30 dB quieter");

    // Floor keeps its place through the gaps of a phrase: 2 s after the loud
    // sine stops (a fainter one goes on) it is where it was, and 24 s later
    // it has come down to what sounds.
    std::vector<float> stops = sine(880.0f, 26.0f, kRate, 0.005f);
    const std::vector<float> first = sine(220.0f, 2.0f, kRate, 0.5f);
    for (size_t i = 0; i < first.size(); ++i) stops[i] += first[i];
    set_up(device, {});
    run(device, std::vector<float>(stops.begin(), stops.begin() + 4 * 48000));
    const double held = device.top_db();
    run(device, std::vector<float>(stops.begin() + 4 * 48000, stops.end()), 2048);
    std::printf("the loudest of late: %.1f dB 2 s after the loud sine stopped, %.1f dB 24 s after\n", held, device.top_db());
    EXPECT_NEAR(held, db(0.5), 0.3, "the loudest of late is held through a gap");
    EXPECT_NEAR(device.top_db(), db(0.005), 3.5, "and comes down to what sounds once the loud sound is long gone");

    // Noise at -90 dBFS stays there, at every setting that could raise it.
    rng_state() = 4242;
    const std::vector<float> faint = noise(3.0f, kRate, 5.4772e-5f);  // uniform: rms is 0.577 of the peak
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kDetail, 1.0f},
                    {p::kRise, 20.0f}});
    const Stereo out = run(device, faint);
    const double in_db = db(rms(faint, 48000, 96000));
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
    const std::vector<float> strike_in = sine(3520.0f, 2.0f, kRate, 0.4f);
    const size_t at = 4 * 48000;
    for (size_t i = 0; i < strike_in.size(); ++i) in[at + i] += strike_in[i];
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
    const std::vector<float> in = held_chord(kRate, 10.0f, 0.12f, 0.002f, 777);
    for (int setting = 0; setting < 3; ++setting) {
      if (setting == 0) set_up(device, {});
      if (setting == 1) set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kDetail, 1.0f}});
      if (setting == 2) set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kDetail, 0.0f}, {p::kRise, 20.0f}});
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

  // --- Nothing is lifted towards a sound that has stopped ------------------------------------
  // The loud sine stops; the quiet one goes on alone. Alone there is nothing
  // over it, so nothing is asked: the lift it holds falls back (10 dB a second
  // at Rise 300 ms) while the level hold takes it down at the same pace, and
  // at no moment does it stand higher than it did while the loud one sounded.
  {
    std::vector<float> in = sine(3520.0f, 8.0f, kRate, 0.005f);
    const std::vector<float> loud = sine(220.0f, 3.0f, kRate, 0.5f);
    for (size_t i = 0; i < loud.size(); ++i) in[i] += loud[i] * std::min(1.0f, (loud.size() - i) / 480.0f);
    for (float rise : {300.0f, 4000.0f}) {
      set_up(device, {{p::kAmount, 0.5f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, rise}});
      const Stereo out = run(device, in);
      const double with = change_db(in, out.left, 3520.0, 3 * 48000 - 2880, 3 * 48000 - 480);
      double highest = -100.0;
      for (size_t at = 3 * 48000; at + 4800 <= 7 * 48000; at += 2400) {
        highest = std::max(highest, change_db(in, out.left, 3520.0, at, at + 4800));
      }
      const double soon = change_db(in, out.left, 3520.0, 3 * 48000 + 9600, 3 * 48000 + 14400);
      const double after = change_db(in, out.left, 3520.0, 4 * 48000 + 9600, 4 * 48000 + 14400);
      const double gone = change_db(in, out.left, 3520.0, 7 * 48000, 7 * 48000 + 24000);
      std::printf("rise %.0f ms, the loud sine stops: the quiet one stands %+.2f dB with it, %+.2f dB at the most "
                  "after, %+.2f dB 0.25 s after, %+.2f dB 1.25 s after, %+.2f dB at the end\n",
                  rise, with, highest, soon, after, gone);
      EXPECT(with > 5.0, "the quiet sine stood lifted while the loud one sounded");
      EXPECT(highest < with + 0.5, "once the loud sound has stopped the quiet one never rises");
      EXPECT(std::fabs(gone) < 0.1, "and it comes back to its own level");
      if (rise == 300.0f) {
        EXPECT(soon < with - 3.0 && soon > 0.5, "it glides down, 20 dB a second here, and does not drop");
        EXPECT(std::fabs(after) < 0.3, "and is at its own level within a second and a quarter");
      } else {
        EXPECT(after < with - 3.0, "also at the longest Rise");
      }
    }
  }

  // --- What follows a louder sound is not lifted towards it -----------------------------------
  // A loud note stops; 0.3 s later a quiet sound begins, 40 dB under it. It
  // is lifted no more than it would be alone, and its own loudest part not at all.
  {
    std::vector<float> alone(6 * 48000, 0.0f);
    const std::vector<float> body = sine(880.0f, 3.5f, kRate, 0.005f);
    const std::vector<float> faint = sine(3520.0f, 3.5f, kRate, 0.0005f);
    const size_t begins = static_cast<size_t>(2.3 * 48000);
    for (size_t i = 0; i < body.size(); ++i) alone[begins + i] = body[i] + faint[i];
    std::vector<float> after_loud = alone;
    const std::vector<float> loud = sine(220.0f, 2.0f, kRate, 0.5f);
    for (size_t i = 0; i < loud.size(); ++i) after_loud[i] += loud[i] * std::min(1.0f, (loud.size() - i) / 480.0f);
    double worst_body = 0.0, worst_more = -100.0, lifted_alone = 0.0;
    for (int setting = 0; setting < 2; ++setting) {
      const std::vector<Setting> settings = setting == 0 ? std::vector<Setting>{{p::kDetail, 1.0f}}
                                                         : std::vector<Setting>{{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kRise, 150.0f}, {p::kDetail, 1.0f}};
      set_up(device, settings);
      const Stereo by_itself = run(device, alone);
      set_up(device, settings);
      const Stereo followed = run(device, after_loud);
      for (size_t at = begins + 9600; at + 9600 <= begins + 3 * 48000; at += 9600) {
        const double own = change_db(alone, by_itself.left, 3520.0, at, at + 9600);
        const double then = change_db(after_loud, followed.left, 3520.0, at, at + 9600);
        worst_more = std::max(worst_more, then - own);
        worst_body = std::max(worst_body, std::fabs(change_db(after_loud, followed.left, 880.0, at, at + 9600)));
        lifted_alone = std::max(lifted_alone, own);
      }
    }
    std::printf("a quiet sound 0.3 s after a loud one: its loudest part moves %.2f dB at the most, its faint part is "
                "lifted %+.2f dB more than alone at the most (alone: %+.2f dB)\n",
                worst_body, worst_more, lifted_alone);
    EXPECT(lifted_alone > 5.0, "alone, its faint part is lifted");
    EXPECT(worst_body < 0.3, "after a loud sound the loudest part of what follows stays where it is");
    EXPECT(worst_more < 0.3, "and nothing in it is lifted more than it would be alone");
  }

  // --- A bed of noise is not held up through the pauses ---------------------------------------
  // A phrase of six struck notes over hiss at -60, -50 and -40 dBFS and over
  // a room tone; the last note is damped at 7.58 s. The bed's own gain, in the
  // gap between two notes (3.55 to 3.95 s) and in the pause after.
  {
    const std::vector<float> notes = phrase(kRate, 0.3, 11.0f);
    struct Under {
      const char* name;
      std::vector<float> bed;
    };
    const Under beds[] = {{"hiss -60", hiss(11.0f, kRate, -60.0, 7)},
                          {"hiss -50", hiss(11.0f, kRate, -50.0, 7)},
                          {"hiss -40", hiss(11.0f, kRate, -40.0, 7)},
                          {"room -45", room_tone(11.0f, kRate, -45.0, 11)}};
    struct Case {
      const char* name;
      std::vector<Setting> settings;
      double soon, later;  // the most the bed may stand up 0.1 to 0.3 s into the pause, and from 0.5 s
    };
    const Case cases[] = {
        {"default", {}, 1.0, 0.3},
        {"Rise 4 s", {{p::kRise, 4000.0f}}, 1.0, 0.3},
        {"Slow bloom", {{p::kAmount, 0.8f}, {p::kRange, 24.0f}, {p::kRise, 2000.0f}}, 2.0, 0.3},
    };
    for (const Case& c : cases) {
      for (const Under& under : beds) {
        const Bed bed = bed_under(device, c.settings, notes, under.bed);
        const double gap = bed.gain(3.55, 3.95), soon = bed.gain(7.7, 7.9), later = bed.gain(8.1, 8.6),
                     last = bed.gain(9.6, 10.6);
        std::printf("%-10s over %s: the bed %+.2f dB in a gap, %+.2f dB 0.1 to 0.3 s into the pause, %+.2f dB "
                    "from 0.5 s, %+.2f dB from 2 s\n",
                    c.name, under.name, gap, soon, later, last);
        EXPECT(gap < c.soon && soon < c.soon, "the bed is not held up when the notes stop");
        EXPECT(later < c.later && last < 0.3, "and stands at its own level half a second into the pause");
        EXPECT(later > -0.3 && last > -0.3, "without being turned down either");
      }
    }
  }

  // --- Nor does it come up when the pause is long --------------------------------------------
  // Floor is counted from the loudest band of late, and twenty seconds into
  // a pause that is the bed itself. A bed of noise, or of noise with hum and
  // rumble, has no part far enough under the rest to be lifted much: its
  // level and its bright end (the second difference, which the hiss rules)
  // stay where they were, at the default and with everything up.
  {
    const std::vector<float> notes = phrase(kRate, 0.3, 34.0f);
    const std::vector<float> beds[] = {hiss(34.0f, kRate, -50.0, 7), room_tone(34.0f, kRate, -45.0, 11)};
    auto bright = [](const std::vector<float>& x, size_t from, size_t to) {
      double sum = 0.0;
      for (size_t i = from; i < to; ++i) {
        const double d = static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2];
        sum += d * d;
      }
      return std::sqrt(sum / static_cast<double>(to - from));
    };
    const std::vector<Setting> long_cases[] = {
        {}, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kRise, 150.0f}, {p::kDetail, 1.0f}}};
    double worst_whole = 0.0, worst_bright = 0.0;
    for (const std::vector<Setting>& settings : long_cases) {
      for (const std::vector<float>& bed : beds) {
        const std::vector<float> in = add(notes, bed);
        set_up(device, settings);
        const Stereo out = run(device, in);
        const size_t from = 28 * 48000, to = 33 * 48000;
        const double whole = db(rms(out.left, from + kLate, to + kLate) / rms(in, from, to));
        const double top = db(bright(out.left, from + kLate, to + kLate) / bright(in, from, to));
        if (std::fabs(whole) > std::fabs(worst_whole)) worst_whole = whole;
        if (std::fabs(top) > std::fabs(worst_bright)) worst_bright = top;
      }
    }
    std::printf("twenty seconds into a pause, hiss and room tone, default and everything up: the bed's level "
                "%+.2f dB at worst, its bright end %+.2f dB\n",
                worst_whole, worst_bright);
    EXPECT(std::fabs(worst_whole) < 0.5, "a bed alone for twenty seconds stays at its level");
    EXPECT(std::fabs(worst_bright) < 1.0, "and its hiss is not brought up");
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

    // The level is held with Mix part-way too: a great deal lifted, half of
    // it mixed in, and the chord comes out at the level it went in at.
    const std::vector<float> chord = held_chord(kRate, 8.0f, 0.12f, 0.002f, 777);
    double furthest = 0.0;
    for (float mix : {0.25f, 0.5f, 0.75f, 1.0f}) {
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kDetail, 1.0f}, {p::kMix, mix}});
      const Stereo out = run(device, chord);
      const double level = db(rms(out.left, 4 * 48000 + kLate, 7 * 48000 + kLate) / rms(chord, 4 * 48000, 7 * 48000));
      std::printf("mix %.2f, everything up, a held chord: %+.3f dB against the input, hold %.2f dB\n", mix, level,
                  device.meter(1));
      if (std::fabs(level) > std::fabs(furthest)) furthest = level;
    }
    EXPECT(std::fabs(furthest) < 0.2, "the level is held at every Mix");
  }

  // --- Left and right take the same gains --------------------------------------------------
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 40.0, 3.0f);
    const std::vector<Setting> up = {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 50.0f}};
    set_up(device, up);
    const Stereo mono = run(device, in);
    EXPECT(mono.left == mono.right, "mono in, mono out, bit for bit");

    // Opposite phase: the same lift, the same level, still opposite.
    std::vector<float> flipped(in.size());
    for (size_t i = 0; i < in.size(); ++i) flipped[i] = -in[i];
    set_up(device, up);
    const Stereo anti = run(device, in, flipped);
    bool opposite = true;
    for (size_t i = 0; i < in.size(); ++i) opposite = opposite && anti.left[i] == -anti.right[i];
    EXPECT(opposite && anti.left == mono.left, "left and right in opposite phase come out as they would in phase");

    // The loud sine on the left only, the quiet one on the right at half the
    // level it has on the left: the balance of the quiet one is kept.
    std::vector<float> left = two_tones(220.0, 3520.0, 40.0, 3.0f);
    std::vector<float> right = sine(3520.0f, 3.0f, kRate, 0.0025f);
    set_up(device, up);
    const Stereo wide = run(device, left, right);
    const double on_left = change_db(left, wide.left, 3520.0, 96000, 120000);
    const double on_right = change_db(right, wide.right, 3520.0, 96000, 120000);
    std::printf("stereo: the quiet sine is lifted %+.2f dB on the left and %+.2f dB on the right\n", on_left, on_right);
    EXPECT(on_left > 15.0 && std::fabs(on_left - on_right) < 0.05, "both sides take the same lift: the image stays");

    // One side only: the silent side stays silent, the other is as it would be on both.
    set_up(device, up);
    const Stereo one = run(device, in, silence(3.0f, kRate));
    EXPECT(peak(one.right) == 0.0, "a silent side stays silent");
    EXPECT_NEAR(change_db(in, one.left, 3520.0, 96000, 120000), change_db(in, mono.left, 3520.0, 96000, 120000), 0.1,
                "and the side that sounds is lifted as it would be on both");
  }

  // --- Detail: single partials, or regions ---------------------------------------------------
  // A loud sine at 1 kHz and a quiet one 30 dB under it at 1.2 kHz, 0.263 of
  // an octave apart. At Detail 1 only the quiet one is lifted, by Amount of
  // its deficit. Under that the lift is the mean over the sounding bands
  // within 12^-Detail octaves either way (an octave at 0, a twelfth at 1),
  // nearer ones counting more: a band at distance d counts 1 - d / reach.
  {
    const std::vector<float> in = two_tones(1000.0, 1200.0, 30.0, 4.0f);
    const double own = 0.5 * (30.0 - kAroundDbPerOctave * std::log2(1.2));
    // The two sines' bands, as the device lays them out.
    device.init(kRate);
    const double apart = std::log2(device.band_hz(band_of(device, 1200.0)) / device.band_hz(band_of(device, 1000.0)));
    double last_quiet = 100.0, last_loud = -1.0;
    for (float detail : {1.0f, 0.75f, 0.5f, 0.25f, 0.0f}) {
      set_up(device, {{p::kAmount, 0.5f}, {p::kRange, 30.0f}, {p::kDetail, detail}, {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      const double hold = device.meter(1);
      const double quiet = change_db(in, out.left, 1200.0, 2 * 48000, 3 * 48000) - hold;
      const double loud = change_db(in, out.left, 1000.0, 2 * 48000, 3 * 48000) - hold;
      const double reach = std::pow(12.0, -static_cast<double>(detail));
      const double counts = std::max(0.0, 1.0 - apart / reach);
      std::printf("detail %.2f: the quiet sine %+.2f dB (expected %+.2f), the loud one %+.2f dB (expected %+.2f)\n",
                  detail, quiet, own / (1.0 + counts), loud, own * counts / (1.0 + counts));
      EXPECT_NEAR(quiet, own / (1.0 + counts), 0.8, "the quiet partial keeps its share of the lift");
      EXPECT_NEAR(loud, own * counts / (1.0 + counts), 0.8, "and the loud one beside it takes the rest");
      EXPECT(quiet <= last_quiet + 0.05 && loud >= last_loud - 0.05, "less Detail shares more of it out");
      last_quiet = quiet;
      last_loud = loud;
    }
    EXPECT(last_loud > 5.0, "at Detail 0 the two move nearly as one region");
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

  // --- Clicks: a knob moved while it sounds --------------------------------------------------
  // The reference is the same render with the knob where it ends up or
  // starts, which has no event in it: the largest step of the moved render
  // may not be much over the larger of the two.
  {
    std::vector<float> in(4 * 48000, 0.0f);
    for (double note : {110.0, 164.81, 220.0}) {
      for (int h = 1; h <= 10; ++h) {
        const std::vector<float> partial = sine(static_cast<float>(note * h), 4.0f, kRate, 0.15f / (h * h));
        for (size_t i = 0; i < in.size(); ++i) in[i] += partial[i];
      }
    }
    struct Move {
      const char* name;
      int id;
      float from, to;
    };
    const Move moves[] = {
        {"amount", p::kAmount, 0.0f, 1.0f},  {"amount back", p::kAmount, 1.0f, 0.0f},
        {"range", p::kRange, 30.0f, 0.0f},   {"floor", p::kFloor, -72.0f, -24.0f},
        {"floor back", p::kFloor, -24.0f, -72.0f}, {"rise", p::kRise, 20.0f, 4000.0f},
        {"focus", p::kFocus, -1.0f, 1.0f},   {"detail", p::kDetail, 0.0f, 1.0f},
        {"output", p::kOutput, -12.0f, 12.0f}, {"mix", p::kMix, 0.0f, 1.0f},
        {"mix back", p::kMix, 1.0f, 0.0f},   {"listen on", p::kListen, 0.0f, 1.0f},
        {"listen off", p::kListen, 1.0f, 0.0f},
    };
    for (const Move& move : moves) {
      double steps[3];
      std::vector<float> kept[3];
      const size_t at = 2 * 48000 + 37;
      for (int which = 0; which < 3; ++which) {
        set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -66.0f}, {p::kRise, 50.0f},
                        {p::kMix, 0.5f}});
        device.set_param(move.id, which == 1 ? move.to : move.from);
        std::vector<float> head(in.begin(), in.begin() + at), rest(in.begin() + at, in.end());
        const Stereo a = run(device, head);
        if (which == 2) device.set_param(move.id, move.to);
        const Stereo b = run(device, rest);
        const Stereo whole = concat(a, b);
        steps[which] = max_step(whole.left, at - 4800, at + 48000);
        kept[which] = whole.left;
      }
      // What the move changed (the moved render less the one it was not
      // made in) against what it changes in the end (the two unmoved renders,
      // one less the other): it comes in no rougher than that.
      std::vector<float> changed(kept[0].size()), apart(kept[0].size());
      for (size_t i = 0; i < changed.size(); ++i) {
        changed[i] = kept[2][i] - kept[0][i];
        apart[i] = kept[1][i] - kept[0][i];
      }
      const double jump = max_step(changed, at - 2, at + 48000);
      const double texture = max_step(apart, at - 2, at + 48000);
      EXPECT(peak(changed, 0, at) == 0.0, "the two renders are the same until the knob moves");
      if (move.id != p::kRise) EXPECT(peak(changed, at, at + 48000) > 0.003, "and the move is heard");
      EXPECT(jump < 1.25 * texture + 0.003, "what a moved knob changes comes in without a jump");
      const double reference = std::max(steps[0], steps[1]);
      std::printf("click, %-11s: largest step %.4f moved, %.4f and %.4f unmoved; of the change %.4f, of what "
                  "it changes %.4f\n",
                  move.name, steps[2], steps[0], steps[1], jump, texture);
      EXPECT(steps[2] < 1.25 * reference + 0.003, "a knob moved while it sounds does not click");
    }
  }

  // --- Bad input ---------------------------------------------------------------------------
  {
    rng_state() = 99;
    const std::vector<float> good = add(noise(2.0f, kRate, 0.05f), sine(330.0f, 2.0f, kRate, 0.4f));
    std::vector<float> bad = good;
    bad[30000] = std::nanf("");
    bad[30001] = std::numeric_limits<float>::infinity();
    bad[30002] = -1.0e30f;
    bad[30003] = 1.0e30f;
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kRise, 20.0f}});
    const Stereo clean_out = run(device, good);
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kRise, 20.0f}});
    const Stereo bad_out = run(device, bad);
    double off = 0.0;
    for (size_t i = 30004 + kLate + 2048 + 9600; i < good.size(); ++i) {
      off = std::max(off, std::fabs(static_cast<double>(bad_out.left[i]) - clean_out.left[i]));
    }
    std::printf("bad input: finite %d, and 0.2 s after it the output is within %.2g of what it would have been\n",
                finite(bad_out.left) && finite(bad_out.right), off);
    EXPECT(finite(bad_out.left) && finite(bad_out.right), "NaN, infinity and 1e30 in: finite out");
    EXPECT(off < 1.0e-3, "and the device is itself again a fifth of a second later");
    EXPECT(rms(bad_out.left, 60000, 90000) > 0.1, "not stuck silent");

    // A burst 36 dB over full scale, just under what the frames take as
    // nothing: it remembers no level, so a second later the sound is no
    // louder than it would have been. (Floor, counted from the loudest of
    // late, stands higher for a while: less is lifted, never more.)
    rng_state() = 99;
    const std::vector<float> longer = add(noise(16.0f, kRate, 0.05f), sine(330.0f, 16.0f, kRate, 0.4f));
    std::vector<float> burst = longer;
    for (int i = 0; i < 3000; ++i) burst[48000 + i] = (i & 1) ? -63.9f : 63.9f;
    for (int setting = 0; setting < 2; ++setting) {
      const std::vector<Setting> settings = setting == 0 ? std::vector<Setting>{}
                                                         : std::vector<Setting>{{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kRise, 150.0f}, {p::kDetail, 1.0f}};
      set_up(device, settings);
      const Stereo clean = run(device, longer);
      set_up(device, settings);
      const Stereo burst_out = run(device, burst);
      const size_t back = 48000 + 3000 + kLate + 2048;
      const double louder = db(rms(burst_out.left, back + 4800, back + 48000) / rms(clean.left, back + 4800, back + 48000));
      const double next = db(rms(burst_out.left, back + 48000, back + 96000) / rms(clean.left, back + 48000, back + 96000));
      double off_late = 0.0;
      for (size_t i = back + 14 * 48000 + 14400; i < longer.size(); ++i) {
        off_late = std::max(off_late, std::fabs(static_cast<double>(burst_out.left[i]) - clean.left[i]));
      }
      std::printf("a burst of +36 dBFS, setting %d: 0.1 to 1 s after it the output is %+.2f dB against what it would "
                  "have been, %+.2f dB in the second after, and 14.3 s after within %.2g\n",
                  setting, louder, next, off_late);
      EXPECT(finite(burst_out.left), "a burst far over full scale: finite out");
      EXPECT(louder < 0.5 && next < 0.2, "what follows a burst is no louder than it would have been");
      EXPECT(off_late < 2.0e-3, "and once the loudest of late has come down again the device is itself");
    }
  }

  // --- The same at every block size, across a sleep ------------------------------------------
  // It holds nothing 1.2 s after the sound and sleeps 0.1 s later: the
  // silence is stepped across that moment, and a knob is moved in it three
  // samples before the sound returns.
  {
    double worst = 0.0;
    int slept = 0, woke = 0;
    for (float gap = 0.9f; gap < 1.7f; gap += 0.0137f) {
      rng_state() = 99;
      std::vector<float> head = add(noise(0.3f, kRate, 0.05f), sine(330.0f, 0.3f, kRate, 0.4f));
      const std::vector<float> quiet = silence(gap, kRate);
      head.insert(head.end(), quiet.begin(), quiet.end());
      std::vector<float> rest(head.end() - 3, head.end());
      head.resize(head.size() - 3);
      const std::vector<float> again = add(noise(0.4f, kRate, 0.05f), sine(495.0f, 0.4f, kRate, 0.4f));
      rest.insert(rest.end(), again.begin(), again.end());
      Stereo reference;
      const int moved = static_cast<int>(gap * 1000.0f) % 3;  // Output, Mix or nothing
      for (int block : {128, 1, 2048, 37}) {
        set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kRise, 20.0f}, {p::kFloor, kLowest}, {p::kMix, 0.8f}});
        const Stereo a = run(device, head, block);
        if (block == 128) ++(device.asleep() ? slept : woke);
        if (moved == 0) device.set_param(p::kOutput, 9.0f);
        if (moved == 1) device.set_param(p::kMix, 0.3f);
        const Stereo render = concat(a, run(device, rest, block));
        if (block == 128) {
          reference = render;
          continue;
        }
        for (size_t i = 0; i < render.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(render.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(render.right[i]) - reference.right[i]));
        }
      }
    }
    std::printf("block sizes 1, 37, 128 and 2048 across a silence with a knob moved in it: worst difference %.3g "
                "(%d silences it slept in, %d it did not)\n",
                worst, slept, woke);
    EXPECT(slept > 5 && woke > 5, "the silences reach from before it sleeps to after");
    EXPECT(worst < 1.0e-6, "the same at every block size across a sleep");
  }

  // --- It comes to rest after every control move ---------------------------------------------
  // Sound, a knob thrown from one end to the other while it sounds, then
  // silence: a second and a half later it holds nothing and has stopped working.
  {
    rng_state() = 5;
    const std::vector<float> sound = add(noise(1.0f, kRate, 0.05f), sine(330.0f, 1.0f, kRate, 0.5f));
    bool all = true;
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int way = 0; way < 2; ++way) {
        device.init(kRate);
        device.set_param(id, way == 0 ? p::kParamMin[id] : p::kParamMax[id]);
        run(device, sound);
        device.set_param(id, way == 0 ? p::kParamMax[id] : p::kParamMin[id]);
        run(device, sound);
        render(device, 1.5f, kRate, 2048);
        const Stereo after = render(device, 0.25f, kRate);
        const bool rests = device.asleep() && peak(after.left) == 0.0 && peak(after.right) == 0.0 &&
                           device.meter(0) == 0.0f && device.meter(1) == 0.0f && device.meter(2) == 0.0f &&
                           device.meter(2 + Reveal::kReadings) == 0.0f && device.meter(Reveal::kTopMeter) == 0.0f;
        if (!rests) std::printf("param %d, way %d: does not come to rest\n", id, way);
        all = all && rests;
      }
    }
    EXPECT(all, "1.5 s after the sound, whatever knob was thrown across its range: asleep, silent, every reading at rest");
  }

  // --- The frame before a sharp attack ---------------------------------------------------------
  // A frame is 43 ms long and the one that first holds an attack begins before
  // it. A pluck over hiss at -50 dBFS: in the 45 ms before the pluck the bed
  // may not come up towards it by more than a decibel or two, and the first
  // 5 ms of the pluck come out near the level they went in at (the top of an
  // attack is quiet beside its body, so a little of it is lifted).
  {
    const size_t at = 3 * 48000;
    std::vector<float> pluck(static_cast<size_t>(4.5 * 48000), 0.0f);
    for (int k = 1; k <= 40; ++k) {
      const double a = 0.5 / k * std::fabs(std::sin(kPi * k * 0.23)) * 1.5, tau = 0.6 / (1.0 + 0.3 * (k - 1));
      for (size_t i = 0; at + i < pluck.size(); ++i) {
        const double t = i / 48000.0;
        pluck[at + i] += static_cast<float>(a * std::exp(-t / tau) * std::min(1.0, t / 0.0003) * std::sin(2.0 * kPi * 196.0 * k * t));
      }
    }
    const std::vector<float> bed = hiss(4.5f, kRate, -50.0, 7);
    const std::vector<float> with = add(bed, pluck);
    for (int setting = 0; setting < 2; ++setting) {
      const std::vector<Setting> settings = setting == 0 ? std::vector<Setting>{}
                                                         : std::vector<Setting>{{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kRise, 150.0f}, {p::kDetail, 1.0f}};
      set_up(device, settings);
      const Stereo a = run(device, with);
      set_up(device, settings);
      const Stereo b = run(device, bed);
      const size_t on = at + kLate, ahead = on - 2160, until = on - 48;
      const double before = db(rms(a.left, ahead, until) / rms(b.left, ahead, until));
      const double first = db(rms(a.left, on, on + 240) / rms(with, at, at + 240));
      const double crest = db(peak(a.left, on, on + 240) / peak(with, at, at + 240));
      std::printf("a pluck over hiss, setting %d: the bed %+.2f dB in the 45 ms before it; its first 5 ms %+.2f dB "
                  "(peak %+.2f dB) against the input\n",
                  setting, before, first, crest);
      EXPECT(before < (setting == 0 ? 1.5 : 3.0), "the bed does not swell ahead of an attack");
      EXPECT(std::fabs(first) < 1.5 && crest < 2.5, "and the attack comes out within a decibel and a half of what went in");
    }
  }

  // --- The level does not sag after an attack ------------------------------------------------
  // A struck note over a held chord, everything up: the note takes the lift
  // away from the bands it fills, and the level hold has to let go with it.
  // A quarter of a second after the attack the whole comes out at the level
  // it went in at, not a decibel or two under it.
  {
    std::vector<float> pad = held_chord(kRate, 6.0f, 0.1f, 0.0005f, 41);
    std::vector<float> struck(pad.size(), 0.0f);
    strike(struck, kRate, 392.0, 3.0, 1.5, 0.5);
    struck.resize(pad.size());
    const std::vector<float> in = add(pad, struck);
    double worst_after = 0.0;
    for (int setting = 0; setting < 2; ++setting) {
      set_up(device, setting == 0 ? std::vector<Setting>{}
                                  : std::vector<Setting>{{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kRise, 150.0f}, {p::kDetail, 1.0f}});
      const Stereo out = run(device, in);
      for (double from : {0.05, 0.15, 0.25, 0.4}) {
        const size_t a0 = static_cast<size_t>((3.0 + from) * 48000), a1 = a0 + 4800;
        const double after = db(rms(out.left, a0 + kLate, a1 + kLate) / rms(in, a0, a1));
        if (std::fabs(after) > std::fabs(worst_after)) worst_after = after;
      }
    }
    std::printf("a struck note over a held chord, default and everything up: the level %+.2f dB at worst in the "
                "half second after the attack\n",
                worst_after);
    EXPECT(std::fabs(worst_after) < 0.75, "the level does not sag after an attack over a held sound");
  }

  // --- A full-scale held chord for a minute, at every end of every control -------------------
  // Three notes with their partials and a bed of noise 46 dB under them,
  // peaking at full scale. It never grows, never peaks more than 6 dB over
  // what came in, and (Output apart) comes out at the level it went in at.
  std::vector<float> minute_chord(60 * 48000, 0.0f);
  {
    for (double note : {110.0, 164.81, 277.18}) {
      for (int h = 1; h <= 14; ++h) {
        const float gain = 1.0f / static_cast<float>(h * std::sqrt(static_cast<double>(h)));
        const double step = 2.0 * kPi * note * h / kRate;
        for (size_t i = 0; i < minute_chord.size(); ++i) minute_chord[i] += gain * static_cast<float>(std::sin(step * i + h));
      }
    }
    rng_state() = 31;
    for (float& v : minute_chord) v += 0.02f * white();
    const float scale = 1.0f / static_cast<float>(peak(minute_chord));
    for (float& v : minute_chord) v *= scale;
  }
  const double came = db(rms(minute_chord, 10 * 48000, 20 * 48000));
  {
    double worst_peak = 0.0, worst_growth = -100.0, worst_level = 0.0;
    auto minute = [&](const char* what, double trim_db) {
      const Stereo out = run(device, minute_chord, 2048);
      const double top = db(std::max(peak(out.left), peak(out.right))) - trim_db;
      const double early = db(rms(out.left, 10 * 48000, 20 * 48000));
      const double late = db(rms(out.left, 50 * 48000, 60 * 48000));
      const double level = late - came - trim_db;
      if (top > 6.0 || late - early > 0.2 || std::fabs(level) > 1.0) {
        std::printf("a minute of full scale, %s: peak %+.2f dB, grows %+.2f dB, level %+.2f dB\n", what, top,
                    late - early, level);
      }
      worst_peak = std::max(worst_peak, top);
      worst_growth = std::max(worst_growth, late - early);
      if (std::fabs(level) > std::fabs(worst_level)) worst_level = level;
      return finite(out.left) && finite(out.right);
    };
    bool sound = true;
    char what[64];
    for (int id = 0; id < p::kNumParams; ++id) {
      if (id == p::kListen) continue;  // what is added is not the sound: held to its own bound below
      for (int way = 0; way < 2; ++way) {
        device.init(kRate);
        const float value = way == 0 ? p::kParamMin[id] : p::kParamMax[id];
        device.set_param(id, value);
        std::snprintf(what, sizeof what, "param %d at its %s", id, way == 0 ? "minimum" : "maximum");
        sound = minute(what, id == p::kOutput ? value : 0.0) && sound;
      }
    }
    // Everything that lifts, all the way up.
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kRise, 20.0f}, {p::kDetail, 1.0f}});
    sound = minute("everything up, Detail 1", 0.0) && sound;
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kRise, 4000.0f}, {p::kDetail, 0.0f}});
    sound = minute("everything up, Detail 0, slowest", 0.0) && sound;
    std::printf("a minute of a full-scale chord, 18 settings: worst peak %+.2f dB over full scale, worst growth "
                "%+.3f dB, level furthest from the input %+.2f dB\n",
                worst_peak, worst_growth, worst_level);
    EXPECT(sound, "a minute of full scale stays finite");
    EXPECT(worst_peak < 6.0, "and never peaks more than 6 dB over what came in");
    EXPECT(worst_growth < 0.2, "and never grows");
    EXPECT(std::fabs(worst_level) < 1.0, "and comes out within 1 dB of the level it went in at");

    // Listen plays only what is added, which is never more than the sound itself.
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, kLowest}, {p::kListen, 1.0f}});
    std::vector<float> ten(minute_chord.begin(), minute_chord.begin() + 10 * 48000);
    const Stereo added = run(device, ten);
    std::printf("listen, everything up: peak %+.2f dB, level %+.2f dB against the input\n", db(peak(added.left)),
                db(rms(added.left, 5 * 48000, 10 * 48000)) - came);
    EXPECT(peak(added.left) < 2.0 && db(rms(added.left, 5 * 48000, 10 * 48000)) < came + 1.0,
           "what Listen plays is no louder than the sound");
  }

  // --- One bright held note, its partials in step, levelled right out ------------------------
  // The hardest sound there is for the crests: twenty-four partials that all
  // cross zero together. Levelled out they make a train of spikes that would
  // stand 8 dB over the input's own crests. The ceiling holds them under
  // 6 dB, and what that costs the level is kept under a decibel.
  {
    std::vector<float> note(4 * 48000, 0.0f);
    for (int k = 1; k <= 24; ++k) {
      const double gain = 0.25 * std::pow(static_cast<double>(k), -1.6);
      const double step = 2.0 * kPi * 220.0 * k / kRate;
      for (size_t i = 0; i < note.size(); ++i) note[i] += static_cast<float>(gain * std::sin(step * i + k));
    }
    const double in_peak = peak(note);
    const double in_level = db(rms(note, 48000, 3 * 48000));
    double worst_note_peak = -100.0, worst_note_level = 0.0;
    for (const Preset& preset : presets()) {
      set_up(device, preset.settings);
      const Stereo out = run(device, note);
      const double top = db(peak(out.left) / in_peak);
      const double level = db(rms(out.left, 48000 + kLate, 3 * 48000 + kLate)) - in_level;
      if (top > worst_note_peak) worst_note_peak = top;
      if (std::fabs(level) > std::fabs(worst_note_level)) worst_note_level = level;
    }
    std::printf("one bright held note, sixteen presets: worst peak %+.2f dB over the note's own, level furthest "
                "from the input %+.2f dB\n",
                worst_note_peak, worst_note_level);
    EXPECT(worst_note_peak < 6.0, "one bright note levelled out peaks no more than 6 dB over its own crests");
    EXPECT(std::fabs(worst_note_level) < 1.0, "and comes out within 1 dB of the level it went in at");
  }

  // --- Every preset: a minute of the full-scale chord, a phrase, a swell, and Mix part-way ----
  // The table is "presets" in device.json. Each preset holds the chord's
  // level, never grows and never peaks 6 dB over what came in, on any of
  // three kinds of sound; with Mix part-way a held tone is the plain
  // crossfade of its dry and its wet level; and it rests when the sound has gone.
  {
    EXPECT(presets().size() == 16, "sixteen presets");
    // A phrase over a faint bed, and a bright dense swell: twelve notes a
    // little apart, every partial up to the top, in and out again.
    std::vector<float> played = phrase(kRate, 0.45, 9.0f);
    const std::vector<float> faint = hiss(9.0f, kRate, -62.0, 2);
    for (size_t i = 0; i < played.size(); ++i) played[i] += faint[i];
    std::vector<float> swell(6 * 48000, 0.0f);
    for (int n = 0; n < 12; ++n) {
      const double hz = 98.0 * std::pow(2.0, (n * 3.1) / 12.0);
      for (int k = 1; k * hz < 0.4 * kRate && k <= 80; ++k) {
        const double step = 2.0 * kPi * hz * k / kRate, a = 0.08 / k;
        for (size_t i = 0; i < swell.size(); ++i) swell[i] += static_cast<float>(a * std::sin(step * i + 2.1 * n + 0.9 * k));
      }
    }
    for (size_t i = 0; i < swell.size(); ++i) {
      const double e = std::sin(kPi * i / static_cast<double>(swell.size()));
      swell[i] *= static_cast<float>(e * e);
    }
    const float swell_scale = 1.0f / static_cast<float>(peak(swell));
    for (float& v : swell) v *= swell_scale;

    double worst_peak = -100.0, worst_growth = -100.0, worst_level = 0.0, worst_mix = 0.0, worst_dip = 0.0;
    double worst_crest = -100.0, worst_played = 0.0;
    bool all_rest = true;
    for (const Preset& preset : presets()) {
      set_up(device, preset.settings);
      const Stereo out = run(device, minute_chord, 2048);
      const double top = db(std::max(peak(out.left), peak(out.right)));
      const double early = db(rms(out.left, 10 * 48000, 20 * 48000));
      const double late = db(rms(out.left, 50 * 48000, 60 * 48000));
      EXPECT(finite(out.left) && finite(out.right), "a preset stays finite on a minute of full scale");
      worst_peak = std::max(worst_peak, top);
      worst_growth = std::max(worst_growth, late - early);
      if (std::fabs(late - came) > std::fabs(worst_level)) worst_level = late - came;
      const float lift = device.meter(0), hold = device.meter(1);

      // The phrase and the swell: the crests against the input's, the level, and the rest after.
      set_up(device, preset.settings);
      const Stereo phrase_out = run(device, played);
      const double phrase_crest = db(peak(phrase_out.left) / peak(played));
      const double phrase_level = db(rms(phrase_out.left, kLate, played.size()) / rms(played, 0, played.size() - kLate));
      render(device, 1.5f, kRate);
      const Stereo after = render(device, 0.25f, kRate);
      all_rest = all_rest && device.asleep() && peak(after.left) == 0.0;
      set_up(device, preset.settings);
      const Stereo swell_out = run(device, swell);
      const double swell_crest = db(peak(swell_out.left) / peak(swell));
      worst_crest = std::max(worst_crest, std::max(phrase_crest, swell_crest));
      if (std::fabs(phrase_level) > std::fabs(worst_played)) worst_played = phrase_level;
      std::printf("preset %-17s a minute of full scale: peak %+.2f dB, level %+.2f dB, grows %+.3f dB, lift %.1f dB, "
                  "hold %.1f dB; a phrase: peak %+.2f dB, level %+.2f dB; a swell: peak %+.2f dB\n",
                  preset.name, top, late - came, late - early, lift, hold, phrase_crest, phrase_level, swell_crest);

      // A quiet held tone under a loud one, over the piano: wet, then half way.
      for (int key = 15; key < 88; key += 8) {
        const double hz = 27.5 * std::pow(2.0, key / 12.0);
        const double other = hz < 700.0 ? hz * 5.993 : hz / 5.993;
        const std::vector<float> tones = two_tones(other, hz, 30.0, 2.5f);
        double lifts[2];
        int n = 0;
        for (float mix : {1.0f, 0.5f}) {
          set_up(device, preset.settings);
          device.set_param(p::kMix, mix);
          device.set_param(p::kRise, 50.0f);
          const Stereo mixed = run(device, tones);
          lifts[n++] = change_db(tones, mixed.left, hz, 72000, 96000);
        }
        worst_mix = std::max(worst_mix, std::fabs(lifts[1] - db(0.5 + 0.5 * std::pow(10.0, lifts[0] / 20.0))));
        worst_dip = std::min(worst_dip, lifts[1]);
      }
    }
    std::printf("sixteen presets: worst peak %+.2f dB, worst growth %+.3f dB, level furthest from the input %+.2f dB; "
                "a phrase and a swell: worst peak %+.2f dB over the input's, level furthest %+.2f dB; Mix 0.5 on held "
                "tones: %.3f dB from the plain crossfade at worst, deepest dip %.3f dB\n",
                worst_peak, worst_growth, worst_level, worst_crest, worst_played, worst_mix, worst_dip);
    // The level is held and the crests are bent under the ceiling, 5.9 dB
    // over the loudest sample that came in.
    EXPECT(worst_peak < 6.0, "no preset peaks more than 6 dB over a full-scale chord");
    EXPECT(worst_crest < 20.0 * std::log10(Reveal::kCeilingTop), "nor more than the ceiling over a phrase or a swell");
    EXPECT(worst_growth < 0.2, "no preset grows");
    EXPECT(std::fabs(worst_level) < 1.0, "every preset holds the level within 1 dB");
    EXPECT(std::fabs(worst_played) < 1.5, "also of a played phrase");
    // (But for the level hold, which has less to hold with half of it mixed in: 0.27 dB at the most.)
    EXPECT(worst_mix < 0.4, "at every preset part-way Mix is the plain crossfade");
    EXPECT(worst_dip > -0.5, "and no held tone dips by half a dB");
    EXPECT(all_rest, "every preset is asleep and silent 1.5 s after the phrase");
  }

  // --- The same behaviour at the other sample rates ------------------------------------------
  for (float rate : {44100.0f, 88200.0f, 96000.0f}) behaves_at(rate);

  // --- Cost: the average, and the block a frame lands in -------------------------------------
  {
    rng_state() = 5;
    std::vector<float> busy = noise(10.0f, kRate, 0.1f);
    for (double note : {110.0, 164.81, 220.0, 277.18}) {
      for (int h = 1; h <= 12; ++h) {
        const std::vector<float> partial = sine(static_cast<float>(note * h), 10.0f, kRate, 0.1f / h);
        for (size_t i = 0; i < busy.size(); ++i) busy[i] += partial[i];
      }
    }
    for (int setting = 0; setting < 2; ++setting) {
      const char* label = setting == 0 ? "reveal, defaults" : "reveal, everything up, Detail 0";
      auto prepare = [&] {
        device.init(kRate);
        if (setting == 1) {
          device.set_param(p::kAmount, 1.0f);
          device.set_param(p::kRange, 30.0f);
          device.set_param(p::kFloor, kLowest);
          device.set_param(p::kDetail, 0.0f);
          device.set_param(p::kRise, 20.0f);
        }
      };
      prepare();
      report_cost(label, 10.0f, kRate, [&] { run(device, busy); });
      // Block by block, five passes: every block's fastest pass (the machine
      // is shared), then the mean of those and the slowest of them, which is
      // the block a frame's work lands in.
      std::vector<double> micros(busy.size() / 128, 1.0e18);
      for (int pass = 0; pass < 5; ++pass) {
        prepare();
        for (size_t block = 0; block < micros.size(); ++block) {
          for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = busy[block * 128 + i];
          const auto start = std::chrono::steady_clock::now();
          device.process(128);
          const double took =
              std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
          micros[block] = std::min(micros[block], took);
        }
      }
      double sum = 0.0, slowest = 0.0;
      for (double took : micros) {
        sum += took;
        slowest = std::max(slowest, took);
      }
      std::printf("%s: %.1f us a block on average (%.2f%%), the slowest block %.1f us (%.2f%%) (native, fastest of "
                  "five passes for each block)\n",
                  label, sum / micros.size(), 100.0 * sum / micros.size() / 2666.7, slowest, 100.0 * slowest / 2666.7);
    }
  }

  // --- what the second reading found ---------------------------------------------------------------------

  // The loudest sample and the loudest band of late are remembered with the frame they came in, and their age
  // is counted on a clock that comes round after 2^32 samples (24.9 hours at 48 kHz, 6.2 at 192). One a whole
  // round old read as new: a quiet note that came back just then, after a day asleep, was measured against the
  // loud one of the day before (the loudest band -6 dB where -66 is meant, the ceiling 0.67 where 0.0008 is)
  // and was not lifted at all for the nine seconds it took the old one to fall. What has fallen is now
  // forgotten. A loud note, a sleep of one round, then the same note 60 dB down, against a device that has
  // only heard the quiet one.
  {
    const std::vector<float> loud = two_tones(330.0, 660.0, 6.0, 1.0f);
    std::vector<float> quiet = two_tones(330.0, 660.0, 6.0, 0.5f);
    for (float& x : quiet) x *= 0.001f;
    device.init(kRate);
    run(device, quiet);
    const float fresh_top = device.meter(Reveal::kTopMeter), fresh_lift = device.meter(0);
    device.init(kRate);
    run(device, loud);
    const uint64_t until = 4294967296ull + 2176;  // the quiet note then starts on a frame, as the fresh one does
    for (uint64_t n = 0; n < until;) {
      const int frames = until - n > 2048 ? 2048 : static_cast<int>(until - n);
      device.process(frames);  // silent in: asleep, and the clock runs on
      n += static_cast<uint64_t>(frames);
    }
    run(device, quiet);
    const float top = device.meter(Reveal::kTopMeter), lift = device.meter(0);
    std::printf("a quiet note one round of the clock after a loud one: the loudest band of late %.1f dB and the most lift"
                " %.1f dB (%.1f and %.1f with no loud one before)\n", top, lift, fresh_top, fresh_lift);
    EXPECT_NEAR(top, fresh_top, 0.1, "a loud note of a day ago is not the loudest of late");
    EXPECT_NEAR(lift, fresh_lift, 0.1, "and the quiet note is lifted as it would have been without it");
  }

  return finish("reveal");
}
