// Native harness for Bow (cpp/devices/bowed-string). The conformance pass
// covers silence, voice stealing, parameter abuse and other sample rates;
// the rest asserts what makes it a string: tuning in every mode, the decay
// and damping of a plucked string, the pick-point comb, the ebow's bloom and
// hold, the bow's pressure, vibrato, detune and release.

#include "../devices/bowed-string/bowed_string.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::BowedString;
namespace p = livemix::bowed_string;

static BowedString device;

static const float kRate = 48000.0f;

// One plain string: no second string, body, vibrato or slow envelope.
static void plain(BowedString& d, int mode, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMode, static_cast<float>(mode));
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kBody, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// Level of the `hz` component over n samples from `from`: a Hann-windowed
// DFT bin by a rotating phasor (no trig per sample, so sweeps stay fast).
static double bin_level(const std::vector<float>& x, double rate, double hz, size_t from, size_t n) {
  const double w = 2.0 * kPi * hz / rate, ww = 2.0 * kPi / static_cast<double>(n);
  const double cr = std::cos(w), ci = std::sin(w), wr = std::cos(ww), wi = std::sin(ww);
  double pr = 1.0, pi = 0.0, hr = 1.0, hi = 0.0, re = 0.0, im = 0.0, sum = 0.0;
  for (size_t i = 0; i < n && from + i < x.size(); ++i) {
    const double window = 0.5 - 0.5 * hr;
    re += window * x[from + i] * pr;
    im -= window * x[from + i] * pi;
    sum += window;
    double t = pr * cr - pi * ci;
    pi = pr * ci + pi * cr;
    pr = t;
    t = hr * wr - hi * wi;
    hi = hr * wi + hi * wr;
    hr = t;
  }
  return 2.0 * std::sqrt(re * re + im * im) / sum;
}

// The frequency of the strongest component within 4 % of `guess`, to a
// small fraction of a cent: scan, then narrow the span as the window grows.
static double fine_pitch(const std::vector<float>& x, double rate, double guess, size_t from, size_t to) {
  to = std::min(to, x.size());
  const size_t total = to - from;
  double f = guess, span = guess * 0.04;
  for (int stage = 0; stage < 12 && span > guess * 2.0e-6; ++stage) {
    const size_t n = std::min(total, static_cast<size_t>(3.0 * rate / span));
    double best = -1.0, best_f = f;
    for (int i = -10; i <= 10; ++i) {
      const double hz = f + span * i / 10.0;
      const double level = bin_level(x, rate, hz, from, n);
      if (level > best) {
        best = level;
        best_f = hz;
      }
    }
    f = best_f;
    span *= n == total ? 0.2 : 0.3;
  }
  return f;
}

// Ring time (to -60 dB) of the `hz` component between two moments.
static double ring_time(const std::vector<float>& x, double rate, double hz, double t0, double t1, double window) {
  const size_t n = static_cast<size_t>(window * rate);
  const double a = bin_level(x, rate, hz, static_cast<size_t>(t0 * rate), n);
  const double b = bin_level(x, rate, hz, static_cast<size_t>(t1 * rate), n);
  return b < a ? 60.0 * (t1 - t0) / (db(a) - db(b)) : 1.0e9;
}

static const char* kModeNames[3] = {"Pluck", "Ebow", "Bow"};

int main() {
  Conformance spec;
  spec.name = "bowed-string";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  char label[160];

  // Tuning, the hard part of a waveguide: every mode, five octaves, within
  // 3 cents (the delay lines are trimmed by the bridge filter's phase delay,
  // and the driver locks to the string rather than to a clock).
  for (int mode = 0; mode < 3; ++mode) {
    double worst = 0.0;
    for (float hz : {55.0f, 77.78f, 110.0f, 220.0f, 311.13f, 440.0f, 880.0f, 1244.5f, 1760.0f}) {
      plain(device, mode);
      device.note_on(1, hz, 0.7f);
      Stereo out = render(device, 3.0f, kRate);
      const double error = cents(fine_pitch(out.left, kRate, hz, 48000, 144000), hz);
      worst = std::max(worst, std::fabs(error));
    }
    std::snprintf(label, sizeof label, "%s is within 3 cents from 55 to 1760 Hz (worst %.2f)", kModeNames[mode], worst);
    EXPECT(worst < 3.0, label);
    std::printf("tuning %s: worst %.2f cents\n", kModeNames[mode], worst);
  }
  // Dark, bright, hard-pressed, near the bridge and at other sample rates.
  {
    double worst = 0.0;
    for (int mode = 0; mode < 3; ++mode) {
      for (int corner = 0; corner < 5; ++corner) {
        for (float hz : {55.0f, 440.0f, 1760.0f}) {
          const float rate = corner == 3 ? 44100.0f : (corner == 4 ? 96000.0f : kRate);
          plain(device, mode, rate);
          if (corner == 0) device.set_param(p::kBrightness, 0.0f);
          if (corner == 1) device.set_param(p::kBrightness, 1.0f);
          if (corner == 2) device.set_param(p::kPosition, 0.04f);
          device.set_param(p::kPressure, corner == 1 ? 0.75f : 0.4f);
          device.note_on(1, hz, 0.7f);
          Stereo out = render(device, 3.0f, rate);
          const size_t second = static_cast<size_t>(rate);
          const double error = cents(fine_pitch(out.left, rate, hz, second, 3 * second), hz);
          worst = std::max(worst, std::fabs(error));
        }
      }
    }
    std::snprintf(label, sizeof label, "tuning holds dark, bright, near the bridge and at 44.1 and 96 kHz (worst %.2f)", worst);
    EXPECT(worst < 3.0, label);
    std::printf("tuning at the corners: worst %.2f cents\n", worst);
  }

  // A plucked string rings for `decay` at its fundamental, at any pitch.
  for (float decay : {2.0f, 8.0f}) {
    for (float hz : {110.0f, 440.0f}) {
      plain(device, BowedString::kPluck);
      device.set_param(p::kDecay, decay);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 4.0f, kRate);
      const double measured = ring_time(out.left, kRate, hz, 0.5, 3.0, 0.5);
      std::snprintf(label, sizeof label, "Pluck at %.0f Hz rings for the %.0f s Decay asks (%.2f s)", hz, decay, measured);
      EXPECT(std::fabs(measured - decay) < 0.06 * decay, label);
    }
  }

  // Brightness is damping: the high partials of a dark string die sooner,
  // and the fundamental is not touched.
  {
    double high[2], low[2], early[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device, BowedString::kPluck);
      device.set_param(p::kBrightness, pass == 0 ? 0.25f : 0.9f);
      device.set_param(p::kPosition, 0.13f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 3.0f, kRate);
      high[pass] = ring_time(out.left, kRate, 9.0 * 220.0, 0.1, 0.5, 0.2);
      low[pass] = ring_time(out.left, kRate, 220.0, 0.5, 2.5, 0.5);
      early[pass] = bin_level(out.left, kRate, 9.0 * 220.0, 2400, 9600);
    }
    std::printf("pluck 220 Hz: partial 9 rings %.2f s dark, %.2f s bright; fundamental %.2f and %.2f s\n", high[0],
                high[1], low[0], low[1]);
    EXPECT(high[0] < 0.25 * high[1], "a dark string loses its upper partials several times faster");
    EXPECT(high[1] > 2.0, "a bright string keeps them ringing for seconds");
    EXPECT(std::fabs(low[0] - low[1]) < 0.06 * low[1], "Brightness leaves the ring time of the fundamental alone");
    EXPECT(early[0] < 0.7 * early[1], "and a dark string is picked more softly");
  }

  // The pick point is a comb: plucked at the middle the even partials are
  // gone; at a fifth of the string, every fifth one.
  {
    plain(device, BowedString::kPluck);
    device.set_param(p::kPosition, 0.5f);
    device.set_param(p::kBrightness, 0.9f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo middle = render(device, 1.0f, kRate);
    plain(device, BowedString::kPluck);
    device.set_param(p::kPosition, 0.2f);
    device.set_param(p::kBrightness, 0.9f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo fifth = render(device, 1.0f, kRate);
    double level_middle[7], level_fifth[7];
    for (int h = 1; h <= 6; ++h) {
      level_middle[h] = bin_level(middle.left, kRate, 220.0 * h, 4800, 24000);
      level_fifth[h] = bin_level(fifth.left, kRate, 220.0 * h, 4800, 24000);
    }
    std::printf("pluck at 1/2: partials 2 and 4 at %.0f and %.0f dB re the fundamental; at 1/5: partial 5 at %.0f dB re partial 4\n",
                db(level_middle[2] / level_middle[1]), db(level_middle[4] / level_middle[1]),
                db(level_fifth[5] / level_fifth[4]));
    EXPECT(level_middle[2] < 0.01 * level_middle[1] && level_middle[4] < 0.01 * level_middle[1] &&
               level_middle[6] < 0.01 * level_middle[1],
           "plucked at the middle, the even partials are 40 dB down");
    EXPECT(level_middle[3] > 0.1 * level_middle[1] && level_middle[5] > 0.05 * level_middle[1],
           "and the odd ones are all there");
    EXPECT(level_fifth[5] < 0.02 * level_fifth[4] && level_fifth[2] > 0.3 * level_fifth[1],
           "plucked at a fifth, partial 5 is gone and partial 2 is not");
  }

  // The shortest attack leaves the pick alone; a long one is a volume swell.
  {
    plain(device, BowedString::kPluck);
    device.note_on(1, 220.0f, 0.8f);
    Stereo picked = render(device, 2.0f, kRate);
    plain(device, BowedString::kPluck);
    device.set_param(p::kAttack, 1.5f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo swell = render(device, 2.0f, kRate);
    EXPECT(peak(picked.left, 0, 2400) > 0.5 * peak(picked.left), "a pluck speaks within 50 ms");
    EXPECT(rms(swell.left, 0, 4800) < 0.12 * rms(picked.left, 0, 4800),
           "with Attack up, the pick is hidden (a volume swell)");
    EXPECT(rms(swell.left, 72000, 81600) > 0.6 * rms(picked.left, 72000, 81600), "and arrives at the string's own level");
  }

  // Ebow: from silence, up over `attack`, then held with no decay for as
  // long as the key is down.
  {
    plain(device, BowedString::kEbow);
    device.set_param(p::kAttack, 2.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 12.0f, kRate);
    const double full = rms(out.left, 3 * 48000, 4 * 48000);
    const double late = rms(out.left, 11 * 48000, 12 * 48000);
    std::printf("ebow: rms %.4f at 0.1 s, %.4f at 1 s, %.4f at 3 s, %.4f at 11 s\n", rms(out.left, 2400, 7200),
                rms(out.left, 45600, 50400), full, late);
    EXPECT(peak(out.left, 0, 480) < 0.01 * full, "the ebow starts from (near) silence");
    EXPECT(rms(out.left, 9600, 14400) < 0.3 * full, "a 2 s attack is still quiet at 0.25 s");
    EXPECT(rms(out.left, 45600, 50400) > 0.4 * full && rms(out.left, 45600, 50400) < 0.85 * full,
           "is on its way at 1 s");
    EXPECT(rms(out.left, 100800, 110400) > 0.93 * full, "and has arrived just after 2 s");
    EXPECT(std::fabs(late - full) < 0.01 * full, "the ebow holds its level for 10 s without decay");
    double lo = 1.0e9, hi = 0.0;
    for (size_t from = 3 * 48000; from + 4800 <= out.size(); from += 4800) {
      const double level = rms(out.left, from, from + 4800);
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    EXPECT(hi < 1.02 * lo, "and the held level does not wander");
  }
  // A short attack is as fast as the string allows: tens of periods.
  {
    plain(device, BowedString::kEbow);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    EXPECT(rms(out.left, 14400, 19200) > 0.9 * rms(out.left, 72000, 96000), "at the shortest attack the ebow is up within 0.3 s");
  }

  // Ebow against Bow: the ebow sings with few upper partials, the bow is a
  // full ramp. Pressed hard the ebow tips into the octave.
  {
    double upper[3] = {0.0, 0.0, 0.0}, first[3], second[3];
    for (int which = 0; which < 3; ++which) {
      plain(device, which == 2 ? BowedString::kBow : BowedString::kEbow);
      device.set_param(p::kPressure, which == 1 ? 1.0f : 0.4f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 5.0f, kRate);
      first[which] = bin_level(out.left, kRate, 220.0, 144000, 96000);
      second[which] = bin_level(out.left, kRate, 440.0, 144000, 96000);
      for (int h = 4; h <= 20; ++h) {
        const double level = bin_level(out.left, kRate, 220.0 * h, 144000, 96000);
        upper[which] += level * level;
      }
      upper[which] = std::sqrt(upper[which]);
    }
    std::printf("partials 4 to 20 re the fundamental: ebow %.0f dB, bow %.0f dB; ebow octave re fundamental %.0f dB, pressed hard %+.0f dB\n",
                db(upper[0] / first[0]), db(upper[2] / first[2]), db(second[0] / first[0]), db(second[1] / first[1]));
    EXPECT(upper[0] < 0.01 * first[0], "the ebow's partials above the third are 40 dB under its fundamental");
    EXPECT(upper[2] > 0.1 * first[2], "the bow's are within 20 dB of it");
    EXPECT(second[0] < 0.25 * first[0], "at normal drive the ebow sits on the fundamental");
    EXPECT(second[1] > 3.0 * first[1], "driven hard it tips into the octave");
  }

  // The driven partials are set open loop from a model of the string, so the
  // model has to hold where the string is at its most resonant: high notes,
  // longest decay, brightest setting. The same recipe must come out at every
  // pitch (bow: partial 2 at 2^-0.85 = -5.1 dB; ebow pressed hard: +15 dB).
  {
    const float pitches[3] = {110.0f, 440.0f, 1760.0f};
    for (int mode = BowedString::kEbow; mode <= BowedString::kBow; ++mode) {
      for (float pitch : pitches) {
        plain(device, mode);
        device.set_param(p::kPressure, 1.0f);
        device.set_param(p::kBrightness, 1.0f);
        device.set_param(p::kDecay, 30.0f);
        device.note_on(1, pitch, 0.8f);
        Stereo out = render(device, 4.0f, kRate);
        const double one = bin_level(out.left, kRate, pitch, 96000, 96000);
        const double two = bin_level(out.left, kRate, 2.0 * pitch, 96000, 96000);
        const double ratio = db(two / one);
        std::printf("%s %.0f Hz at full pressure, brightness and decay: partial 2 at %+.1f dB re the fundamental\n",
                    kModeNames[mode], pitch, ratio);
        if (mode == BowedString::kBow) {
          EXPECT(ratio > -7.5 && ratio < -3.0, "the bow's second partial is where the recipe puts it at every pitch");
        } else {
          EXPECT(ratio > 12.0 && ratio < 18.0, "the hard-driven ebow's octave is where the recipe puts it at every pitch");
        }
      }
    }
  }

  // Bow: sustains, and Pressure is the tone, from flautando to rosin.
  {
    double upper[3], first[3], hiss[3];
    for (int which = 0; which < 3; ++which) {
      plain(device, BowedString::kBow);
      device.set_param(p::kPressure, which * 0.5f);
      device.note_on(1, 146.83f, 0.8f);
      Stereo out = render(device, 8.0f, kRate);
      first[which] = bin_level(out.left, kRate, 146.83, 96000, 96000);
      upper[which] = 0.0;
      for (int h = 6; h <= 30; ++h) {
        const double level = bin_level(out.left, kRate, 146.83 * h, 96000, 96000);
        upper[which] += level * level;
      }
      upper[which] = std::sqrt(upper[which]);
      // Rosin: what is left a third of the way between partials.
      hiss[which] = 0.0;
      for (int h = 4; h <= 23; ++h) {
        const double level = bin_level(out.left, kRate, 146.83 * (h + 0.33), 96000, 96000);
        hiss[which] += level * level;
      }
      hiss[which] = std::sqrt(hiss[which]);
      if (which == 1) {
        const double early = rms(out.left, 96000, 144000), late = rms(out.left, 336000, 384000);
        std::printf("bow: rms %.4f at 2 to 3 s, %.4f at 7 to 8 s\n", early, late);
        EXPECT(std::fabs(late - early) < 0.05 * early, "a bowed note holds its level for as long as it is bowed");
      }
    }
    std::printf("bow partials 6 to 30 re the fundamental: %.0f dB light, %.0f dB medium, %.0f dB heavy; rosin %.0f, %.0f, %.0f dB\n",
                db(upper[0] / first[0]), db(upper[1] / first[1]), db(upper[2] / first[2]), db(hiss[0] / first[0]),
                db(hiss[1] / first[1]), db(hiss[2] / first[2]));
    EXPECT(upper[1] > 1.8 * upper[0] && upper[2] > 1.8 * upper[1], "bow pressure brightens the tone, step by step");
    EXPECT(std::fabs(first[2] - first[0]) < 0.05 * first[0], "without moving the fundamental");
    EXPECT(hiss[2] > 2.0 * hiss[0] && hiss[2] > 1.0e-4 * first[2], "and brings rosin noise with it");
  }

  // Vibrato: nothing for the first 0.3 s, then in over 0.6 s to the depth
  // (40 cents at full) and rate asked for. Measured as the turning of the
  // fundamental's phase against a fixed reference, 100 times a second (at
  // 480 Hz, so every window holds whole periods).
  for (int mode = 1; mode < 3; ++mode) {
    plain(device, mode);
    device.set_param(p::kVibrato, 0.5f);
    device.set_param(p::kVibratoRate, 6.0f);
    device.note_on(1, 480.0f, 0.8f);
    Stereo out = render(device, 3.5f, kRate);
    // 500-sample hops: whole periods of 480 Hz, 96 readings a second.
    std::vector<double> deviation;  // cents
    for (size_t from = 0; from + 1500 <= out.size(); from += 500) {
      double turn = tone_phase(out.left, 480.0, kRate, from + 500, from + 1500) -
                    tone_phase(out.left, 480.0, kRate, from, from + 1000);
      while (turn > kPi) turn -= 2.0 * kPi;
      while (turn < -kPi) turn += 2.0 * kPi;
      deviation.push_back(cents(480.0 + turn * 96.0 / (2.0 * kPi), 480.0));
    }
    double early = 0.0, deep = 0.0;
    int crossings = 0;
    for (size_t i = 10; i < 26; ++i) early = std::max(early, std::fabs(deviation[i]));  // 0.1 to 0.27 s
    for (size_t i = 144; i < 336; ++i) {                                                // 1.5 to 3.5 s
      deep = std::max(deep, std::fabs(deviation[i]));
      if ((deviation[i] > 0.0) != (deviation[i - 1] > 0.0)) ++crossings;
    }
    std::vector<float> settled(deviation.begin() + 144, deviation.begin() + 336);
    const double turns = dominant_frequency(settled, 96.0, 2.0, 12.0);
    std::printf("vibrato (%s): %.2f cents before 0.27 s, then %.1f cents deep at %.2f Hz\n", kModeNames[mode], early, deep,
                turns);
    EXPECT(early < 1.5, "vibrato waits before it starts");
    EXPECT(std::fabs(deep - 20.0) < 2.5, "half Vibrato is 20 cents deep");
    EXPECT(std::fabs(turns - 6.0) < 0.1 && crossings >= 22 && crossings <= 26, "and turns at Vibrato Rate");
    double mid = 0.0;
    for (size_t i = 53; i < 67; ++i) mid = std::max(mid, std::fabs(deviation[i]));  // 0.55 to 0.7 s
    EXPECT(mid > 3.0 && mid < 16.0, "fading in between");
  }

  // Detune: a second string a few cents away, so the note beats with itself
  // at the rate the cents say, and spreads left and right.
  {
    plain(device, BowedString::kEbow);
    device.note_on(1, 480.0f, 0.8f);
    Stereo one = render(device, 4.0f, kRate);
    EXPECT(one.left == one.right, "one string and no body: mono");
    plain(device, BowedString::kEbow);
    device.set_param(p::kDetune, 10.0f);
    device.note_on(1, 480.0f, 0.8f);
    Stereo two = render(device, 6.0f, kRate);
    std::vector<float> envelope_one, envelope_two;
    for (size_t from = 96000; from + 500 <= one.size(); from += 500) {
      envelope_one.push_back(static_cast<float>(rms(one.left, from, from + 500)));
    }
    for (size_t from = 96000; from + 500 <= two.size(); from += 500) {
      std::vector<float> sum(500);
      for (size_t i = 0; i < 500; ++i) sum[i] = two.left[from + i] + two.right[from + i];
      envelope_two.push_back(static_cast<float>(rms(sum)));
    }
    const double steady = *std::max_element(envelope_one.begin(), envelope_one.end()) /
                          *std::min_element(envelope_one.begin(), envelope_one.end());
    const double swing = *std::max_element(envelope_two.begin(), envelope_two.end()) /
                         *std::min_element(envelope_two.begin(), envelope_two.end());
    const double mean_level = mean(envelope_two);
    for (float& v : envelope_two) v -= static_cast<float>(mean_level);
    const double beat = dominant_frequency(envelope_two, 96.0, 0.5, 10.0);
    const double expected = 480.0 * (std::pow(2.0, 10.0 / 1200.0) - 1.0);
    std::printf("detune 10 ct at 480 Hz: beats at %.2f Hz (expected %.2f), level swings %.1fx; one string swings %.3fx\n",
                beat, expected, swing, steady);
    EXPECT(steady < 1.02, "one string does not beat");
    EXPECT(swing > 3.0, "two detuned strings beat deeply in the sum");
    EXPECT_NEAR(beat, expected, 0.1, "at the difference of their frequencies");
    EXPECT(correlation(two.left, two.right, 48000) < 0.95, "and the two strings sit apart in the stereo field");
  }

  // Release: a released string is damped to ring for `release`, or for
  // `decay` when that is shorter, and then the voice is gone.
  for (int mode = 0; mode < 3; ++mode) {
    for (int pass = 0; pass < 2; ++pass) {
      plain(device, mode);
      device.set_param(p::kRelease, pass == 0 ? 1.0f : 6.0f);
      device.set_param(p::kDecay, pass == 0 ? 8.0f : 2.0f);
      device.note_on(1, 220.0f, 0.8f);
      render(device, 1.0f, kRate);
      device.note_off(1);
      Stereo tail = render(device, 8.0f, kRate);
      const double expected = pass == 0 ? 1.0 : 2.0;
      const double measured = ring_time(tail.left, kRate, 220.0, 0.1, 0.1 + 0.5 * expected, 0.1);
      std::snprintf(label, sizeof label, "%s: a released string rings %.0f s (%.2f s)", kModeNames[mode], expected, measured);
      EXPECT(std::fabs(measured - expected) < 0.08 * expected, label);
      EXPECT(peak(tail.left, 7 * 48000) == 0.0, "and is exactly silent afterwards");
    }
  }

  // Nothing blows up: every mode with pressure, brightness and decay at
  // their maxima, at both ends of the string, a full pool at full velocity.
  for (int mode = 0; mode < 3; ++mode) {
    for (float position : {0.02f, 0.5f}) {
      device.init(kRate);
      device.set_param(p::kMode, static_cast<float>(mode));
      device.set_param(p::kPressure, 1.0f);
      device.set_param(p::kBrightness, 1.0f);
      device.set_param(p::kDecay, 30.0f);
      device.set_param(p::kAttack, 0.005f);
      device.set_param(p::kPosition, position);
      device.set_param(p::kDetune, 0.0f);  // or the low notes beat for longer than this lasts
      device.set_param(p::kVolume, -12.0f);
      for (int n = 0; n < 12; ++n) device.note_on(n, 41.2f * std::pow(2.0f, n * 5 / 12.0f), 1.0f);
      Stereo out = render(device, 10.0f, kRate);
      const double early = rms(out.left, 3 * 48000, 4 * 48000), late = rms(out.left, 9 * 48000, 10 * 48000);
      std::snprintf(label, sizeof label, "%s at position %.2f, everything at maximum: bounded and settled (peak %.2f, rms %.3f then %.3f)",
                    kModeNames[mode], position, std::max(peak(out.left), peak(out.right)), early, late);
      EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < 0.98 && peak(out.right) < 0.98 &&
                 late < 1.1 * early,
             label);
    }
  }
  // One driven string on its own never runs away from the level it is asked for.
  for (int mode = 1; mode < 3; ++mode) {
    double highest = 0.0;
    for (float hz : {30.0f, 110.0f, 987.77f, 3520.0f}) {
      for (float position : {0.02f, 0.21f, 0.5f}) {
        plain(device, mode);
        device.set_param(p::kPressure, 1.0f);
        device.set_param(p::kBrightness, 1.0f);
        device.set_param(p::kDecay, 30.0f);
        device.set_param(p::kPosition, position);
        device.note_on(1, hz, 1.0f);
        Stereo out = render(device, 6.0f, kRate);
        highest = std::max(highest, peak(out.left));
      }
    }
    std::snprintf(label, sizeof label, "%s: one string at full drive peaks at %.2f whatever the pitch and position", kModeNames[mode], highest);
    EXPECT(highest < 0.95 && highest > 0.2, label);
    std::printf("%s\n", label);
  }

  // Levels: one note at the default patch, in each mode; velocity; a chord.
  // (The default attack is a slow swell; a pluck is measured picked.)
  for (int mode = 0; mode < 3; ++mode) {
    device.init(kRate);
    device.set_param(p::kMode, static_cast<float>(mode));
    if (mode == BowedString::kPluck) device.set_param(p::kAttack, 0.005f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo loud = render(device, 4.0f, kRate);
    device.init(kRate);
    device.set_param(p::kMode, static_cast<float>(mode));
    if (mode == BowedString::kPluck) device.set_param(p::kAttack, 0.005f);
    device.note_on(1, 220.0f, 0.1f);
    Stereo soft = render(device, 4.0f, kRate);
    const double level_db = db(std::max(peak(loud.left), peak(loud.right)));
    std::snprintf(label, sizeof label, "%s: one note at the default patch peaks at %.1f dBFS (-24 to -10)", kModeNames[mode], level_db);
    EXPECT(level_db > -24.0 && level_db < -10.0, label);
    std::printf("%s\n", label);
    EXPECT(rms(soft.left) < 0.65 * rms(loud.left) && rms(soft.left) > 0.2 * rms(loud.left), "soft notes are quieter, not gone");

    device.init(kRate);
    device.set_param(p::kMode, static_cast<float>(mode));
    for (int n = 0; n < 10; ++n) device.note_on(n, 82.4f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo chord = render(device, 5.0f, kRate);
    std::snprintf(label, sizeof label, "%s: ten held notes stay under the clip knee region (peak %.2f)", kModeNames[mode],
                  std::max(peak(chord.left), peak(chord.right)));
    EXPECT(peak(chord.left) < 0.9 && peak(chord.right) < 0.9, label);
  }

  // Knobs moved under a held bow do not click: the largest sample-to-sample
  // step during a sweep of pressure, position and brightness stays near the
  // steepest slope the two end states have anyway.
  {
    auto sweep = [&](bool move) {
      plain(device, BowedString::kBow);
      device.set_param(p::kPressure, 0.8f);
      device.set_param(p::kBrightness, 0.8f);
      device.note_on(1, 164.81f, 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      for (int step = 0; step < 150; ++step) {
        if (move) {
          const float t = static_cast<float>(step % 50) / 49.0f;
          device.set_param(p::kPressure, 0.8f - 0.7f * t);
          device.set_param(p::kPosition, 0.14f + 0.2f * t);
          device.set_param(p::kBrightness, 0.8f - 0.5f * t);
        }
        out = concat(out, render(device, 0.01f, kRate, 64));
      }
      return out;
    };
    Stereo still = sweep(false);
    Stereo moved = sweep(true);
    const double steady = max_step(still.left, 96000);
    const double worst = max_step(moved.left, 96000);
    std::printf("bow sweep: largest step %.4f moving, %.4f held\n", worst, steady);
    EXPECT(worst < 1.5 * steady, "sweeping pressure, position and brightness under a bow does not click");
    EXPECT(rms(moved.left, 96000) > 0.5 * rms(still.left, 96000), "and the note is still there");
  }

  // The body: a few fixed resonances. A note on one of them is lifted, the
  // channels hear slightly different bodies, and Body 0 is the bare string.
  {
    double level[2];
    Stereo with_body;
    for (int pass = 0; pass < 2; ++pass) {
      plain(device, BowedString::kEbow);
      device.set_param(p::kBody, pass == 0 ? 0.0f : 1.0f);
      device.note_on(1, 196.0f, 0.8f);
      Stereo out = render(device, 3.0f, kRate);
      level[pass] = bin_level(out.left, kRate, 196.0, 96000, 48000);
      if (pass == 1) with_body = out;
    }
    plain(device, BowedString::kEbow);
    device.set_param(p::kBody, 1.0f);
    device.note_on(1, 150.0f, 0.8f);
    Stereo between = render(device, 3.0f, kRate);
    const double off_mode = bin_level(between.left, kRate, 150.0, 96000, 48000);
    std::printf("body: a note on the 196 Hz mode is at %.1f dB re the bare string, one between modes at %.1f dB\n",
                db(level[1] / level[0]), db(off_mode / level[0]));
    EXPECT(level[1] > 1.25 * level[0], "the body lifts a note that sits on one of its modes");
    EXPECT(off_mode < 0.8 * level[1], "more than one between them");
    EXPECT(!(with_body.left == with_body.right), "and left and right hear it from different places");
  }

  // The other modes keep the instrument rules too: block-size independence
  // and exact silence after release with a bow, voice stealing with a pick.
  {
    plain(device, BowedString::kBow);
    device.set_param(p::kDetune, 6.0f);
    device.set_param(p::kVibrato, 0.3f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo a = render(device, 1.0f, kRate, 128);
    plain(device, BowedString::kBow);
    device.set_param(p::kDetune, 6.0f);
    device.set_param(p::kVibrato, 0.3f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo b = render(device, 0.5f, kRate, 1);
    b = concat(b, render(device, 0.5f, kRate, 2048));
    double worst = 0.0;
    for (size_t i = 0; i < a.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    std::snprintf(label, sizeof label, "a bowed note does not depend on the block size (max diff %g)", worst);
    EXPECT(worst < 1.0e-5, label);

    for (int mode = 0; mode < 3; mode += 2) {
      device.init(kRate);
      device.set_param(p::kMode, static_cast<float>(mode));
      device.set_param(p::kAttack, 0.005f);
      bool bounded = true;
      for (int n = 0; n < 60; ++n) {
        device.note_on(n, 65.4f * std::pow(2.0f, static_cast<float>(n % 37) / 12.0f), 1.0f);
        if (n % 3 == 0) device.note_on(n, 65.4f * std::pow(2.0f, static_cast<float>(n % 37) / 12.0f), 1.0f);
        Stereo out = render(device, 0.03f, kRate);
        bounded = bounded && finite(out.left) && peak(out.left) < 1.01 && peak(out.right) < 1.01;
      }
      for (int n = 0; n < 60; ++n) device.note_off(n);
      render(device, 8.0f, kRate);
      Stereo after = render(device, 0.5f, kRate);
      std::snprintf(label, sizeof label, "%s: 60 notes over 12 voices stay bounded and every voice is freed", kModeNames[mode]);
      EXPECT(bounded && peak(after.left) == 0.0 && peak(after.right) == 0.0, label);
    }

    // A plucked string that has rung out while held frees its voice.
    plain(device, BowedString::kPluck);
    device.set_param(p::kDecay, 0.3f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 2.0f, kRate);
    Stereo quiet = render(device, 0.5f, kRate);
    EXPECT(peak(quiet.left) == 0.0, "a held pluck that has rung out leaves exact silence");
  }

  // Cost with every voice sounding (two strings each), in each mode.
  for (int mode = 0; mode < 3; ++mode) {
    device.init(kRate);
    device.set_param(p::kMode, static_cast<float>(mode));
    for (int n = 0; n < 12; ++n) device.note_on(n, 55.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label, "bowed-string (%s, 12 notes)", kModeNames[mode]);
    report_cost(label, 5.0f, kRate, [&] { render(device, 5.0f, kRate); });
  }

  return finish("bowed-string");
}
