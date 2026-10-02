// Native harness for Ladder Bass (cpp/devices/ladder-bass). The conformance
// pass covers silence before and after notes, a pile of keys, parameter abuse
// and other sample rates; the rest measures what makes it a ladder-filter mono
// bass: one voice with last-note priority and glide, two beating oscillators
// and a sub, a 24 dB filter that loses its bass to resonance, drive that
// compresses, and one contour that plucks or holds.
//
// Nobody has listened to this instrument: every claim below is a number.

#include "../devices/ladder-bass/ladder_bass.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::LadderBass;
namespace p = livemix::ladder_bass;

static LadderBass device;

static const float kRate = 48000.0f;
static const double kC0 = 16.3516, kC1 = 32.7032, kC2 = 65.40639, kC4 = 261.6256, kC5 = 523.2511, kC6 = 1046.502;
static const double kA1 = 55.0, kA2 = 110.0;

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// A steady, plain voice: one sawtooth pitch held with the filter open, no
// sub, no contour, no drive. Each check changes only what it is about.
static void steady(LadderBass& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWave, 0.0f);
  d.set_param(p::kBeat, 0.0f);
  d.set_param(p::kSub, 0.0f);
  d.set_param(p::kCutoff, 12000.0f);
  d.set_param(p::kEmphasis, 0.0f);
  d.set_param(p::kContour, 0.0f);
  d.set_param(p::kDecay, 10.0f);  // hold
  d.set_param(p::kDrive, 0.0f);
  d.set_param(p::kGlide, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

// The strongest frequency in [lo, hi] over [from, to). The same idea as
// dominant_frequency, but its first pass steps by half the window's
// resolution instead of 600 times, which is what a narrow band around a
// known pitch needs and many times cheaper on a long window.
static double peak_frequency(const std::vector<float>& x, double rate, double lo, double hi, size_t from,
                             size_t to) {
  double span = 0.5 * rate / static_cast<double>(to - from);
  double best_hz = lo, best = -1.0;
  for (double hz = lo; hz <= hi; hz += span) {
    const double level = tone_level(x, hz, rate, from, to);
    if (level > best) {
      best = level;
      best_hz = hz;
    }
  }
  for (int pass = 0; pass < 4; ++pass) {
    const double centre = best_hz;
    for (int i = -5; i <= 5; ++i) {
      const double hz = centre + span * i / 5.0;
      const double level = tone_level(x, hz, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = hz;
      }
    }
    span /= 5.0;
  }
  return best_hz;
}

// Hann-weighted mean: the DC a window that is not a whole number of cycles
// would otherwise invent.
static double dc_offset(const std::vector<float>& x, size_t from, size_t to) {
  double sum = 0.0, weights = 0.0;
  const size_t n = to - from;
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    sum += w * x[from + i];
    weights += w;
  }
  return sum / weights;
}

// Amplitude-weighted mean frequency of the harmonics of `f0` up to 12 kHz.
static double centroid(const std::vector<float>& x, double f0, size_t from, size_t to) {
  double weighted = 0.0, total = 0.0;
  for (int n = 1; n * f0 < 12000.0; ++n) {
    const double level = tone_level(x, n * f0, kRate, from, to);
    weighted += n * f0 * level;
    total += level;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// How often the `hz` component of `x` passes through a minimum, in Hz: its
// level in 200 ms windows every 50 ms, and the mean spacing of the dips.
static double dip_rate(const std::vector<float>& x, double hz, int* dips) {
  std::vector<double> level;
  for (size_t from = 0; from + 9600 <= x.size(); from += 2400) {
    level.push_back(tone_level(x, hz, kRate, from, from + 9600));
  }
  double top = 0.0;
  for (double v : level) top = std::max(top, v);
  double first = -1.0, last = -1.0;
  *dips = 0;
  for (size_t i = 1; i + 1 < level.size(); ++i) {
    if (level[i] < level[i - 1] && level[i] <= level[i + 1] && level[i] < 0.3 * top) {
      const double at = 0.05 * static_cast<double>(i);
      if (*dips == 0) first = at;
      last = at;
      ++*dips;
    }
  }
  return *dips > 1 ? (*dips - 1) / (last - first) : 0.0;
}

// The loudest component of `x` that is not a harmonic of `f0`, relative to
// the fundamental. A 100 ms Hann window is 40 Hz wide at its foot, so a scan
// every 10 Hz misses nothing (it reads a component between two steps at most
// 1.5 dB low), and 60 Hz either side of a harmonic keeps that harmonic's own
// skirt, 80 dB down by then, out of the reading.
static double stray_level(const std::vector<float>& x, double f0, double rate, size_t from) {
  const size_t to = from + static_cast<size_t>(rate / 10.0);
  double worst = 0.0;
  for (double hz = 20.0; hz < 20000.0; hz += 10.0) {
    if (std::fabs(hz - std::round(hz / f0) * f0) < 60.0) continue;
    worst = std::max(worst, tone_level(x, hz, rate, from, to));
  }
  return worst / tone_level(x, f0, rate, from, to);
}

int main() {
  char label[200];

  Conformance spec;
  spec.name = "ladder-bass";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // Pitch: within 3 cents from C1 to C6 at every sample rate (the pair's
  // slow common drift is under one cent and is inside that).
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (double hz : {kC1, kC2, kC4, kC6}) {
      steady(device, rate);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 1.5f, rate);
      const double found =
          peak_frequency(out.left, rate, hz * 0.97, hz * 1.03, static_cast<size_t>(rate * 0.5f), out.size());
      std::snprintf(label, sizeof label, "%.1f Hz at %.0f Hz sample rate is %.2f cents off", hz, rate,
                    cents(found, hz));
      EXPECT(std::fabs(cents(found, hz)) < 3.0, label);
    }
  }

  // The two oscillators sit either side of the played pitch, Beat apart.
  {
    steady(device);
    device.set_param(p::kBeat, 12.0f);
    device.note_on(1, static_cast<float>(kC6), 0.8f);
    Stereo out = render(device, 2.5f, kRate);
    const double below = peak_frequency(out.left, kRate, kC6 * std::pow(2.0, -11.0 / 1200.0),
                                        kC6 * std::pow(2.0, -1.5 / 1200.0), 24000, out.size());
    const double above = peak_frequency(out.left, kRate, kC6 * std::pow(2.0, 1.5 / 1200.0),
                                        kC6 * std::pow(2.0, 11.0 / 1200.0), 24000, out.size());
    EXPECT_NEAR(cents(below, kC6), -6.0, 2.0, "Beat 12: one oscillator 6 cents under the note");
    EXPECT_NEAR(cents(above, kC6), 6.0, 2.0, "Beat 12: the other 6 cents over it");
    EXPECT_NEAR(cents(above, below), 12.0, 1.5, "Beat is the distance between the two oscillators");
  }

  // Beating: 6 cents apart on A1 the fundamental swells and fades at
  // 55 x (2^(6/1200) - 1) = 0.191 Hz, and the third harmonic three times as often.
  {
    steady(device);
    device.set_param(p::kBeat, 6.0f);
    device.note_on(1, static_cast<float>(kA1), 0.8f);
    Stereo out = render(device, 24.0f, kRate);
    const double expected = kA1 * (std::pow(2.0, 6.0 / 1200.0) - 1.0);
    int dips = 0;
    const double rate = dip_rate(out.left, kA1, &dips);
    std::snprintf(label, sizeof label, "Beat 6 on A1 beats at %.3f Hz (expected %.3f, %d dips)", rate, expected,
                  dips);
    EXPECT(dips >= 4 && std::fabs(rate - expected) < 0.15 * expected, label);
    const double third = dip_rate(out.left, 3.0 * kA1, &dips);
    std::snprintf(label, sizeof label, "the third harmonic beats at %.3f Hz (expected %.3f)", third,
                  3.0 * expected);
    EXPECT(std::fabs(third - 3.0 * expected) < 0.2 * 3.0 * expected, label);

    // With Beat at 0 the pair is one steady oscillator: no dip in 24 s.
    steady(device);
    device.note_on(1, static_cast<float>(kA1), 0.8f);
    Stereo still = render(device, 24.0f, kRate);
    dip_rate(still.left, kA1, &dips);
    EXPECT(dips == 0, "Beat 0 does not beat");
  }

  // Sub adds a pure tone an octave under the note; Wave turns the sawtooth
  // into a square (no even harmonics).
  {
    steady(device);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    Stereo saw = render(device, 1.0f, kRate);
    steady(device);
    device.set_param(p::kSub, 1.0f);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    Stereo sub = render(device, 1.0f, kRate);
    const double fundamental = tone_level(saw.left, kA2, kRate, 12000);
    EXPECT(tone_level(saw.left, kA1, kRate, 12000) < 0.003 * fundamental,
           "Sub 0: nothing an octave below the note");
    EXPECT(tone_level(sub.left, kA1, kRate, 12000) > 0.8 * fundamental, "Sub 1: a strong tone an octave below");
    EXPECT(tone_level(sub.left, 1.5 * kA2, kRate, 12000) < 0.01 * tone_level(sub.left, kA1, kRate, 12000),
           "the sub is a pure tone: no third harmonic of its own");

    steady(device);
    device.set_param(p::kWave, 1.0f);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    Stereo square = render(device, 1.0f, kRate);
    const double saw_even = tone_level(saw.left, 2.0 * kA2, kRate, 12000) / fundamental;
    const double square_even =
        tone_level(square.left, 2.0 * kA2, kRate, 12000) / tone_level(square.left, kA2, kRate, 12000);
    const double square_odd =
        tone_level(square.left, 3.0 * kA2, kRate, 12000) / tone_level(square.left, kA2, kRate, 12000);
    EXPECT_NEAR(db(saw_even), -6.0, 1.5, "Wave 0 is a sawtooth: second harmonic 6 dB under the first");
    EXPECT(db(square_even) < db(saw_even) - 20.0, "Wave 1 is a square: the second harmonic is gone");
    EXPECT_NEAR(db(square_odd), -9.5, 1.5, "and the third is a third of the first");
  }

  // The filter is four poles: 24 dB per octave well above the cutoff.
  // Measured on C2 (where Cutoff is the cutoff) as what a 200 Hz setting
  // takes from the 12th and 24th harmonics.
  {
    steady(device);
    device.note_on(1, static_cast<float>(kC2), 0.8f);
    Stereo open = render(device, 2.0f, kRate);
    steady(device);
    device.set_param(p::kCutoff, 200.0f);
    device.note_on(1, static_cast<float>(kC2), 0.8f);
    Stereo dark = render(device, 2.0f, kRate);
    const double at_785 =
        db(tone_level(dark.left, 12 * kC2, kRate, 24000) / tone_level(open.left, 12 * kC2, kRate, 24000));
    const double at_1570 =
        db(tone_level(dark.left, 24 * kC2, kRate, 24000) / tone_level(open.left, 24 * kC2, kRate, 24000));
    std::snprintf(label, sizeof label, "the filter falls %.1f dB per octave above the cutoff (24 +- 3)",
                  at_785 - at_1570);
    EXPECT(std::fabs((at_785 - at_1570) - 24.0) < 3.0, label);
    EXPECT(db(tone_level(dark.left, kC2, kRate, 24000) / tone_level(open.left, kC2, kRate, 24000)) > -2.5,
           "and takes under 2.5 dB from a fundamental at a third of the cutoff");

    // The cutoff follows the keyboard by half: two octaves up, the same
    // setting sits one octave higher.
    steady(device);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo open_c4 = render(device, 2.0f, kRate);
    steady(device);
    device.set_param(p::kCutoff, 200.0f);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo dark_c4 = render(device, 2.0f, kRate);
    const double at_1570_c4 =
        db(tone_level(dark_c4.left, 6 * kC4, kRate, 24000) / tone_level(open_c4.left, 6 * kC4, kRate, 24000));
    std::snprintf(label, sizeof label,
                  "at C4 the same Cutoff takes %.1f dB at 1570 Hz, what it took at 785 Hz on C2 (%.1f)", at_1570_c4,
                  at_785);
    EXPECT(std::fabs(at_1570_c4 - at_785) < 3.0, label);
  }

  // Emphasis thins the bass: nothing gives back what resonance takes from
  // the passband. And the resonance sits on the cutoff.
  {
    double level[3];
    const float settings[3] = {0.0f, 0.4f, 0.8f};
    for (int i = 0; i < 3; ++i) {
      steady(device);
      device.set_param(p::kCutoff, 1000.0f);
      device.set_param(p::kEmphasis, settings[i]);
      device.note_on(1, static_cast<float>(kA1), 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      level[i] = db(tone_level(out.left, kA1, kRate, 24000));
    }
    std::snprintf(label, sizeof label, "Emphasis 0.8 takes %.1f dB from a 55 Hz fundamental (at least 6, about 12)",
                  level[0] - level[2]);
    EXPECT(level[0] - level[2] > 9.0 && level[0] - level[2] < 16.0, label);
    EXPECT(level[0] - level[1] > 4.0 && level[1] > level[2] + 2.0, "and it thins steadily on the way there");

    // Full Emphasis rings at the cutoff. C0's harmonics are 16 Hz apart, a
    // fine comb to find the peak with; on C0 the keyboard tracking puts the
    // cutoff an octave under the setting.
    steady(device);
    device.set_param(p::kEmphasis, 1.0f);
    device.set_param(p::kCutoff, static_cast<float>(2.0 * 54.0 * kC0));
    device.note_on(1, static_cast<float>(kC0), 0.8f);
    Stereo ring = render(device, 2.0f, kRate);
    const double found = peak_frequency(ring.left, kRate, 54.0 * kC0 * 0.8, 54.0 * kC0 * 1.25, 48000, ring.size());
    std::snprintf(label, sizeof label, "full Emphasis rings %.1f cents from the cutoff (within 25)",
                  cents(found, 54.0 * kC0));
    EXPECT(std::fabs(cents(found, 54.0 * kC0)) < 25.0, label);
    EXPECT(tone_level(ring.left, 54.0 * kC0, kRate, 48000) > 10.0 * tone_level(ring.left, 40.0 * kC0, kRate, 48000),
           "and that ring stands 20 dB over the harmonics beside it");
  }

  // Drive saturates rather than amplifies: 24 dB more level into the filter
  // moves the output by a few dB, flattens the swell of two beating
  // sawtooths, and takes the even harmonics out of a sawtooth.
  {
    double level[2], swing[2], even[2];
    for (int i = 0; i < 2; ++i) {
      steady(device);
      device.set_param(p::kDrive, static_cast<float>(i));
      device.note_on(1, static_cast<float>(kA1), 0.8f);
      Stereo one = render(device, 2.0f, kRate);
      level[i] = db(rms(one.left, 24000));
      even[i] = db(tone_level(one.left, 2 * kA1, kRate, 24000) / tone_level(one.left, 3 * kA1, kRate, 24000));

      steady(device);
      device.set_param(p::kDrive, static_cast<float>(i));
      device.set_param(p::kBeat, 6.0f);
      device.note_on(1, static_cast<float>(kA1), 0.8f);
      Stereo pair = render(device, 12.0f, kRate);
      double lo = 1.0e9, hi = 0.0;
      for (size_t from = 24000; from + 9600 <= pair.left.size(); from += 2400) {
        const double value = rms(pair.left, from, from + 9600);
        lo = std::min(lo, value);
        hi = std::max(hi, value);
      }
      swing[i] = db(hi / lo);
    }
    std::snprintf(label, sizeof label, "full Drive changes the level by %.1f dB (under 6)", level[1] - level[0]);
    EXPECT(std::fabs(level[1] - level[0]) < 6.0, label);
    std::snprintf(label, sizeof label, "beating sawtooths swing %.1f dB clean and %.1f dB driven", swing[0],
                  swing[1]);
    EXPECT(swing[0] > 4.5 && swing[1] < 2.0, label);
    std::snprintf(label, sizeof label, "second against third harmonic: %.1f dB clean, %.1f dB driven", even[0],
                  even[1]);
    EXPECT(even[0] > 2.0 && even[1] < even[0] - 10.0, label);
  }

  // The contour plucks: each note starts bright and closes, and it is
  // 60 dB down after the Decay time.
  {
    steady(device);
    device.set_param(p::kCutoff, 500.0f);
    device.set_param(p::kEmphasis, 0.3f);
    device.set_param(p::kContour, 0.6f);
    device.set_param(p::kDecay, 0.18f);
    device.note_on(1, static_cast<float>(kC2), 0.8f);
    Stereo pluck = render(device, 0.5f, kRate);
    const double early = centroid(pluck.left, kC2, 240, 1680);
    const double late = centroid(pluck.left, kC2, 8160, 9600);
    std::snprintf(label, sizeof label,
                  "a pluck's centroid falls from %.0f Hz to %.0f Hz in 200 ms (an octave or more)", early, late);
    EXPECT(early > 2.0 * late, label);

    steady(device);
    device.set_param(p::kCutoff, 500.0f);
    device.set_param(p::kDecay, 0.18f);
    device.note_on(1, static_cast<float>(kC2), 0.8f);
    Stereo flat = render(device, 0.5f, kRate);
    EXPECT(centroid(flat.left, kC2, 240, 1680) < 1.2 * centroid(flat.left, kC2, 8160, 9600),
           "Contour 0 leaves the brightness where Cutoff put it");

    for (float decay : {0.18f, 2.0f}) {
      steady(device);
      device.set_param(p::kDecay, decay);
      device.note_on(1, static_cast<float>(kA2), 0.8f);
      Stereo out = render(device, decay * 1.2f + 0.2f, kRate);
      const double measured = rt60(out.left, kRate, 0.01, decay / 20.0, -80.0);
      std::snprintf(label, sizeof label, "Decay %.2f s: 60 dB down after %.3f s", decay, measured);
      EXPECT(std::fabs(measured - decay) < 0.2 * decay, label);
    }
    // A decayed note is exact silence even though the key is still down.
    render(device, 2.0f, kRate);
    Stereo spent = render(device, 0.5f, kRate);
    EXPECT(peak(spent.left) == 0.0, "a note that has decayed is exact silence while its key is held");
  }

  // Decay at the top holds: a drone for as long as the key is down, then a
  // release to exact silence.
  {
    steady(device);
    device.set_param(p::kBeat, 0.0f);
    device.note_on(1, static_cast<float>(kA1), 0.8f);
    Stereo drone = render(device, 21.0f, kRate);
    const double start = rms(drone.left, 24000, 72000);
    const double end = rms(drone.left, 20 * 48000 - 24000, 20 * 48000 + 24000);
    std::snprintf(label, sizeof label, "a held note is %.2f dB from where it started after 20 s", db(end / start));
    EXPECT(std::fabs(db(end / start)) < 0.5, label);
    device.note_off(1);
    Stereo tail = render(device, 2.0f, kRate);
    EXPECT(rms(tail.left, 0, 4800) > 0.1 * start, "the release is a fade, not a cut");
    EXPECT(rms(tail.left, 38400, 43200) < 0.003 * start, "that is 60 dB down in under a second");
    EXPECT(peak(tail.left, 72000) == 0.0, "and then exact silence");
  }

  // One voice, last-note priority, glide between overlapping keys.
  {
    steady(device);
    device.set_param(p::kGlide, 0.4f);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo first = render(device, 0.5f, kRate);
    EXPECT_NEAR(dominant_frequency(first.left, kRate, 200.0, 600.0, 0, 2400), kC4, 3.0,
                "a key struck from silence starts on pitch, Glide or not");

    device.note_on(2, static_cast<float>(kC5), 0.8f);
    Stereo slide = render(device, 1.0f, kRate);
    const double middle = dominant_frequency(slide.left, kRate, 240.0, 560.0, 9600 - 480, 9600 + 480);
    std::snprintf(label, sizeof label,
                  "half way through a 0.4 s glide over an octave the pitch is %.0f cents up (600)",
                  cents(middle, kC4));
    EXPECT(std::fabs(cents(middle, kC4) - 600.0) < 120.0, label);
    const double arrived = dominant_frequency(slide.left, kRate, 240.0, 560.0, 21600, 24000);
    std::snprintf(label, sizeof label, "50 ms after the Glide time the pitch is %.1f cents from the new key",
                  cents(arrived, kC5));
    EXPECT(std::fabs(cents(arrived, kC5)) < 20.0, label);
    const double before_end = dominant_frequency(slide.left, kRate, 240.0, 560.0, 14400 - 480, 14400 + 480);
    EXPECT(cents(before_end, kC5) < -200.0, "and it had not arrived at three quarters of the time");
    // Monophonic: once it has arrived only the newer key sounds.
    EXPECT(tone_level(slide.left, kC4, kRate, 28800) < 0.003 * tone_level(slide.left, kC5, kRate, 28800),
           "two keys held: only the newer one sounds");

    // Letting the newer key go returns to the one still held, without a new
    // strike; letting an older key go changes nothing.
    device.note_off(2);
    Stereo back = render(device, 1.0f, kRate);
    EXPECT_NEAR(dominant_frequency(back.left, kRate, 200.0, 600.0, 28800), kC4, 1.0,
                "releasing the newer key returns to the older one");
    EXPECT(rms(back.left, 28800) > 0.9 * rms(first.left, 12000), "which is still sounding at full level");
    device.note_on(3, static_cast<float>(kC5), 0.8f);
    render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo kept = render(device, 0.5f, kRate);
    EXPECT_NEAR(dominant_frequency(kept.left, kRate, 200.0, 600.0, 0), kC5, 1.0,
                "releasing an older key leaves the playing one alone");
    device.note_off(3);
    render(device, 2.0f, kRate);
    Stereo silent = render(device, 0.25f, kRate);
    EXPECT(peak(silent.left) == 0.0, "the last key up ends the note");

    // Keys played apart do not slide.
    device.note_on(4, static_cast<float>(kC4), 0.8f);
    Stereo apart = render(device, 0.2f, kRate);
    EXPECT_NEAR(dominant_frequency(apart.left, kRate, 200.0, 600.0, 240, 2640), kC4, 3.0,
                "a key played after the last was released starts on pitch");

    // Keys that land together (a chord in a score) do not slide either:
    // nothing has sounded yet to slide from.
    device.note_off(4);
    render(device, 2.0f, kRate);
    device.note_on(5, static_cast<float>(kC4), 0.8f);
    device.note_on(6, static_cast<float>(kC5), 0.8f);
    Stereo chord = render(device, 0.2f, kRate);
    EXPECT_NEAR(dominant_frequency(chord.left, kRate, 200.0, 600.0, 240, 2640), kC5, 6.0,
                "two keys in the same instant: the newer one sounds at once, without a slide");

    // A held key that has died away is still a key to slide from: whether a
    // sequence step slides must not depend on how far the last one had faded.
    device.note_off(5);
    device.note_off(6);
    render(device, 2.0f, kRate);
    device.set_param(p::kDecay, 0.3f);
    device.note_on(7, static_cast<float>(kC4), 0.8f);
    render(device, 1.0f, kRate);
    Stereo faded = render(device, 0.1f, kRate);
    EXPECT(peak(faded.left) == 0.0, "a held key with a 0.3 s Decay is silent after a second");
    device.note_on(8, static_cast<float>(kC5), 0.8f);
    Stereo late = render(device, 0.2f, kRate);
    const double early = dominant_frequency(late.left, kRate, 240.0, 560.0, 480, 2880);
    std::snprintf(label, sizeof label,
                  "a key over a held, faded one still slides: %.0f cents below it 35 ms in (about 1100)",
                  -cents(early, kC5));
    EXPECT(cents(early, kC5) < -900.0 && cents(early, kC5) > -1200.0, label);
  }

  // No clicks. The yardstick is the largest sample-to-sample step of the
  // steady tone itself.
  {
    steady(device);
    device.set_param(p::kCutoff, 800.0f);
    device.set_param(p::kGlide, 0.1f);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    Stereo held = render(device, 1.0f, kRate);
    const double yardstick = max_step(held.left, 24000);
    const double level = rms(held.left, 24000);

    device.note_on(2, 164.81f, 0.8f);
    Stereo second = render(device, 0.5f, kRate);
    device.note_on(2, 164.81f, 0.8f);
    Stereo again = render(device, 0.5f, kRate);
    device.note_off(2);
    Stereo back = render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo release = render(device, 1.5f, kRate);
    std::snprintf(label, sizeof label,
                  "steps: steady %.4f, second key %.4f, same key again %.4f, back %.4f, release %.4f", yardstick,
                  max_step(second.left), max_step(again.left), max_step(back.left), max_step(release.left));
    EXPECT(max_step(second.left) < 1.5 * yardstick && max_step(again.left) < 1.5 * yardstick &&
               max_step(back.left) < 1.5 * yardstick && max_step(release.left) < 1.5 * yardstick,
           label);
    // Held overlap gives no new attack: with the contour holding, the level
    // does not dip or bump when the second key lands.
    double lo = 1.0e9, hi = 0.0;
    for (size_t from = 0; from + 480 <= 4800; from += 240) {
      const double value = rms(second.left, from, from + 480);
      lo = std::min(lo, value);
      hi = std::max(hi, value);
    }
    std::snprintf(label, sizeof label, "a second key on a held note keeps the level within %.2f..%.2f of it",
                  lo / level, hi / level);
    EXPECT(lo > 0.8 * level && hi < 1.25 * level, label);

    // A decaying note is struck again by every key, overlapping or not: an
    // overlapping step in a sequence must not be silent.
    steady(device);
    device.set_param(p::kDecay, 0.3f);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    Stereo one = render(device, 0.25f, kRate);
    device.note_on(2, 164.81f, 0.8f);
    Stereo two = render(device, 0.25f, kRate);
    EXPECT(rms(two.left, 240, 1200) > 0.8 * rms(one.left, 240, 1200) &&
               rms(one.left, 10800, 12000) < 0.05 * rms(one.left, 240, 1200),
           "an overlapping key strikes a decaying note again");
    EXPECT(max_step(two.left) < 1.5 * max_step(one.left), "and that strike does not step");

    // A strike never steps, wherever in the cycle it lands and whatever is
    // left of the note before. A dark filter makes the waveform smooth, so a
    // jump in the contour would stand out of it.
    steady(device);
    device.set_param(p::kCutoff, 300.0f);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    Stereo smooth = render(device, 0.5f, kRate);
    steady(device);
    device.set_param(p::kCutoff, 300.0f);
    device.set_param(p::kDecay, 0.25f);
    Stereo strikes;
    for (int n = 0; n < 16; ++n) {
      device.note_on(n, static_cast<float>(kA2), 0.8f);
      strikes = concat(strikes, render(device, 0.05f + 0.007f * static_cast<float>(n), kRate));
      if (n % 2 == 0) device.note_off(n);
    }
    std::snprintf(label, sizeof label, "sixteen strikes on a dying note: step %.4f against %.4f for the held tone",
                  max_step(strikes.left), max_step(smooth.left, 12000));
    EXPECT(max_step(strikes.left) < 1.5 * max_step(smooth.left, 12000), label);
  }

  // Moving a knob while a note sounds does not step: Volume and Drive are
  // the ones that could, Cutoff the one most moved.
  {
    steady(device);
    device.set_param(p::kCutoff, 2000.0f);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    Stereo bright = render(device, 1.0f, kRate);
    const double yardstick = max_step(bright.left, 24000);
    Stereo swept;
    for (int i = 0; i < 100; ++i) {
      device.set_param(p::kCutoff, i % 2 == 0 ? 200.0f : 2000.0f);
      swept = concat(swept, render(device, 0.03f, kRate));
    }
    std::snprintf(label, sizeof label, "Cutoff jumping 200..2000 Hz: step %.4f against %.4f steady",
                  max_step(swept.left), yardstick);
    EXPECT(max_step(swept.left) < 1.3 * yardstick, label);

    device.set_param(p::kCutoff, 2000.0f);
    render(device, 0.5f, kRate);
    Stereo levels;
    for (int i = 0; i < 100; ++i) {
      device.set_param(p::kVolume, i % 2 == 0 ? -24.0f : 0.0f);
      device.set_param(p::kDrive, i % 2 == 0 ? 0.0f : 1.0f);
      levels = concat(levels, render(device, 0.03f, kRate));
    }
    std::snprintf(label, sizeof label, "Volume and Drive jumping: step %.4f against %.4f steady",
                  max_step(levels.left), yardstick);
    EXPECT(max_step(levels.left) < 1.5 * yardstick, label);
  }

  // C0: the 16 Hz fundamental and the 8 Hz sub are there (nothing filters
  // the bottom away), the level is steady, and it stays far from the clip.
  {
    steady(device);
    device.set_param(p::kSub, 1.0f);
    device.set_param(p::kCutoff, 2000.0f);
    device.set_param(p::kVolume, p::kParamDefault[p::kVolume]);
    device.note_on(1, static_cast<float>(kC0), 0.8f);
    Stereo low = render(device, 9.0f, kRate);
    steady(device);
    device.set_param(p::kSub, 1.0f);
    device.set_param(p::kCutoff, 2000.0f);
    device.set_param(p::kVolume, p::kParamDefault[p::kVolume]);
    device.note_on(1, static_cast<float>(kC2), 0.8f);
    Stereo reference = render(device, 9.0f, kRate);
    const double fundamental =
        db(tone_level(low.left, kC0, kRate, 48000) / tone_level(reference.left, kC2, kRate, 48000));
    const double sub =
        db(tone_level(low.left, kC0 / 2, kRate, 48000) / tone_level(reference.left, kC2 / 2, kRate, 48000));
    std::snprintf(label, sizeof label,
                  "at C0 the fundamental is %.1f dB and the sub %.1f dB from their level at C2", fundamental, sub);
    EXPECT(std::fabs(fundamental) < 1.5 && std::fabs(sub) < 1.5, label);
    const double early = rms(low.left, 48000, 192000), late = rms(low.left, 240000, 384000);
    std::snprintf(label, sizeof label, "C0 with the sub up peaks at %.3f and holds its level (%.2f dB over 4 s)",
                  peak(low.left), db(late / early));
    EXPECT(peak(low.left) < 0.5 && std::fabs(db(late / early)) < 0.5, label);
  }

  // What does not belong: at C5 with full Drive anything that is not a
  // harmonic is 50 dB under the fundamental, and nothing carries DC.
  for (float rate : {44100.0f, 48000.0f}) {
    for (float wave : {0.0f, 1.0f}) {
      steady(device, rate);
      device.set_param(p::kDrive, 1.0f);
      device.set_param(p::kWave, wave);
      device.note_on(1, static_cast<float>(kC5), 1.0f);
      Stereo out = render(device, 1.0f, rate);
      const double down = -db(stray_level(out.left, kC5, rate, static_cast<size_t>(rate * 0.5f)));
      std::snprintf(label, sizeof label,
                    "C5, full Drive, Wave %.0f at %.0f Hz: the loudest stray component is %.1f dB down (50)", wave,
                    rate, down);
      EXPECT(down > 50.0, label);
    }
  }
  for (float wave : {0.0f, 0.5f, 1.0f}) {
    for (float drive : {0.0f, 1.0f}) {
      steady(device);
      device.set_param(p::kWave, wave);
      device.set_param(p::kDrive, drive);
      device.set_param(p::kBeat, 6.0f);
      device.set_param(p::kSub, 0.5f);
      device.note_on(1, static_cast<float>(kA1), 0.8f);
      Stereo out = render(device, 4.0f, kRate);
      std::snprintf(label, sizeof label, "Wave %.1f Drive %.0f: DC %.5f against rms %.3f", wave, drive,
                    dc_offset(out.left, 48000, 192000), rms(out.left, 48000));
      EXPECT(std::fabs(dc_offset(out.left, 48000, 192000)) < 0.001, label);
    }
  }

  // Level: one note sits where the mixer expects it, ten keys are still one
  // voice, and the loudest patch stays under the soft clip's knee at the
  // default volume.
  {
    device.init(kRate);
    device.note_on(1, static_cast<float>(kA2), 0.7f);
    Stereo soft = render(device, 1.0f, kRate);
    device.init(kRate);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    Stereo app = render(device, 1.0f, kRate);
    std::snprintf(label, sizeof label, "one default note peaks at %.1f dBFS at gain 0.7 and %.1f at 0.8",
                  db(peak(soft.left)), db(peak(app.left)));
    EXPECT(db(peak(soft.left)) > -24.0 && db(peak(soft.left)) < -10.0 && db(peak(app.left)) > -22.0 &&
               db(peak(app.left)) < -16.0,
           label);
    device.init(kRate);
    device.note_on(1, static_cast<float>(kA2), 1.0f);
    Stereo loud = render(device, 1.0f, kRate);
    EXPECT(rms(soft.left, 0, 4800) < 0.9 * rms(loud.left, 0, 4800), "softer keys are quieter");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo ten = render(device, 3.0f, kRate);
    EXPECT(peak(ten.left) < 0.5 && peak(ten.left) < 1.6 * peak(app.left),
           "ten held keys are one voice, under the clip knee");

    device.init(kRate);
    device.set_param(p::kWave, 1.0f);
    device.set_param(p::kSub, 1.0f);
    device.set_param(p::kDrive, 1.0f);
    device.set_param(p::kCutoff, 12000.0f);
    device.set_param(p::kEmphasis, 0.0f);
    device.set_param(p::kDecay, 10.0f);
    device.note_on(1, static_cast<float>(kA1), 1.0f);
    Stereo most = render(device, 6.0f, kRate);
    std::snprintf(label, sizeof label, "the loudest patch peaks at %.3f at the default volume (knee at 0.5)",
                  peak(most.left));
    EXPECT(peak(most.left) < 0.5, label);
  }

  // A bass is mono, and the audio does not depend on the block size.
  {
    device.init(kRate);
    device.set_param(p::kDecay, 10.0f);
    device.note_on(1, static_cast<float>(kA1), 0.8f);
    Stereo blocks = render(device, 1.0f, kRate, 128);
    EXPECT(blocks.left == blocks.right, "left and right are the same signal");
    for (int size : {1, 2048}) {
      device.init(kRate);
      device.set_param(p::kDecay, 10.0f);
      device.note_on(1, static_cast<float>(kA1), 0.8f);
      Stereo other = render(device, 1.0f, kRate, size);
      double worst = 0.0;
      for (size_t i = 0; i < blocks.left.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(other.left[i]) - blocks.left[i]));
      }
      std::snprintf(label, sizeof label, "blocks of %d frames differ from blocks of 128 by %g", size, worst);
      EXPECT(worst < 1.0e-4, label);
    }
  }

  // Cost of the one voice, held (the default patch decays and goes to sleep,
  // which would time nothing).
  steady(device);
  device.set_param(p::kBeat, 6.0f);
  device.set_param(p::kSub, 0.5f);
  device.set_param(p::kDrive, 0.5f);
  device.set_param(p::kContour, 0.5f);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  report_cost("ladder-bass (held drone)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("ladder-bass");
}
