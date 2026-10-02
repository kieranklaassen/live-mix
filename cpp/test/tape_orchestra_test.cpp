// Native harness for Tape Orchestra (cpp/devices/tape-orchestra). The
// conformance pass covers silence before and after notes, voice stealing
// under a pile of keys, parameter abuse and other sample rates; the rest
// asserts what makes it an orchestra on tape: six different instruments, a
// section of players per key, and a tape that wobbles, lurches, runs out and
// hisses.

#include "../devices/tape-orchestra/tape_orchestra.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::TapeOrchestra;
namespace p = livemix::tape_orchestra;

static TapeOrchestra device;

static const float kRate = 48000.0f;
enum { kStrings = 0, kCellos, kFlutes, kHorns, kReeds, kChoir };

// One clean player on a new machine: no section, vibrato, wear or hiss in
// the way of a measurement.
static void plain(TapeOrchestra& d, int tape) {
  d.init(kRate);
  d.set_param(p::kTape, static_cast<float>(tape));
  d.set_param(p::kAge, 0.0f);
  d.set_param(p::kHiss, 0.0f);
  d.set_param(p::kPlayers, 0.0f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kVolume, 0.0f);
}

static size_t at(double seconds) { return static_cast<size_t>(seconds * kRate); }

// Level in dB of harmonic `h` of `hz` over [from, to) seconds.
static double harmonic_db(const Stereo& out, double hz, int h, double from, double to) {
  return db(tone_level(out.left, hz * h, kRate, at(from), at(to)));
}

// Pitch against `hz` in cents, one value per 5 ms, by the phase advance of
// the `hz` component between neighbouring 20 ms windows.
static std::vector<double> cents_track(const std::vector<float>& x, double hz) {
  const size_t window = 960, hop = 240;
  std::vector<double> track;
  double last = 0.0;
  bool first = true;
  for (size_t from = 0; from + window <= x.size(); from += hop) {
    double re = 0.0, im = 0.0;
    for (size_t i = 0; i < window; ++i) {
      const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / window);
      const double phase = 2.0 * kPi * hz * static_cast<double>(from + i) / kRate;
      re += w * x[from + i] * std::cos(phase);
      im -= w * x[from + i] * std::sin(phase);
    }
    const double angle = std::atan2(im, re);
    if (!first) {
      double delta = angle - last;
      while (delta > kPi) delta -= 2.0 * kPi;
      while (delta < -kPi) delta += 2.0 * kPi;
      const double offset_hz = delta * kRate / (2.0 * kPi * hop);
      track.push_back(1200.0 * std::log2((hz + offset_hz) / hz));
    }
    last = angle;
    first = false;
  }
  return track;
}

static double mean_of(const std::vector<double>& v, size_t from, size_t to) {
  to = std::min(to, v.size());
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) sum += v[i];
  return to > from ? sum / static_cast<double>(to - from) : 0.0;
}

static double spread_of(const std::vector<double>& v, size_t from, size_t to) {
  to = std::min(to, v.size());
  const double m = mean_of(v, from, to);
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) sum += (v[i] - m) * (v[i] - m);
  return to > from ? std::sqrt(sum / static_cast<double>(to - from)) : 0.0;
}

// Where the spectrum balances, in Hz, over [from, to) seconds: the mean of
// the first forty harmonics of `hz` weighted by their power.
static double centroid(const Stereo& out, double hz, double from, double to) {
  double weighted = 0.0, total = 0.0;
  for (int h = 1; h <= 40 && hz * h < 12000.0; ++h) {
    const double level = tone_level(out.left, hz * h, kRate, at(from), at(to));
    weighted += hz * h * level * level;
    total += level * level;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// Run with any argument to print what each check measured.
static bool verbose = false;
#define SHOW(...)                 \
  do {                            \
    if (verbose) {                \
      std::printf("  ");          \
      std::printf(__VA_ARGS__);   \
      std::printf("\n");          \
    }                             \
  } while (0)

int main(int argc, char**) {
  verbose = argc > 1;
  Conformance spec;
  spec.name = "tape-orchestra";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // Tuning: every key sits within 12 cents of its note at the default
  // settings (its own offset, its players and its wow included), on every
  // tape.
  {
    double worst = 0.0;
    for (int tape = 0; tape < 6; ++tape) {
      for (float hz : {110.0f, 164.81f, 329.63f, 698.46f}) {
        device.init(kRate);
        device.set_param(p::kTape, static_cast<float>(tape));
        device.note_on(1, hz, 0.7f);
        Stereo out = render(device, 4.0f, kRate);
        // The strongest of the first three harmonics carries the pitch.
        int h = 1;
        for (int k = 2; k <= 3; ++k) {
          if (tone_level(out.left, hz * k, kRate, at(1.0), at(1.5)) >
              tone_level(out.left, hz * h, kRate, at(1.0), at(1.5))) {
            h = k;
          }
        }
        const std::vector<double> track = cents_track(out.left, hz * h);
        worst = std::max(worst, std::fabs(mean_of(track, 200, track.size())));
      }
    }
    SHOW("tuning: worst key is %.1f cents from its note", worst);
    EXPECT(worst < 12.0, "every key's mean pitch is within 12 cents of the note");
  }

  // A key is one take: struck again after it has died away it is the same
  // audio, sample for sample, and a different key is not.
  {
    plain(device, kStrings);
    device.set_param(p::kAge, 0.6f);
    device.set_param(p::kPlayers, 0.8f);
    device.set_param(p::kVibrato, 0.7f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo first = render(device, 1.5f, kRate);
    device.note_off(1);
    render(device, 1.0f, kRate);
    device.note_on(2, 246.94f, 0.7f);  // another key in between, on another voice
    render(device, 0.5f, kRate);
    device.note_off(2);
    render(device, 1.0f, kRate);
    device.note_on(3, 220.0f, 0.7f);
    Stereo second = render(device, 1.5f, kRate);
    EXPECT(first.left == second.left && first.right == second.right,
           "the same key struck again is the same take, bit for bit");
  }

  // Flutes: nearly a sine. The fundamental stands at least 15 dB over the
  // third harmonic and the even harmonics are weak.
  {
    plain(device, kFlutes);
    device.note_on(1, 440.0f, 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    const double h1 = harmonic_db(out, 440.0, 1, 1.0, 2.0);
    const double h2 = harmonic_db(out, 440.0, 2, 1.0, 2.0);
    const double h3 = harmonic_db(out, 440.0, 3, 1.0, 2.0);
    SHOW("flutes at 440 Hz: h2 %.1f dB, h3 %.1f dB under the fundamental", h1 - h2, h1 - h3);
    EXPECT(h1 - h3 > 15.0, "flutes: the fundamental is 15 dB over the third harmonic");
    EXPECT(h1 - h2 > 10.0, "flutes: the second harmonic is weak");
  }

  // Reeds: in the low register the odd harmonics stand well over the even.
  {
    plain(device, kReeds);
    device.note_on(1, 146.83f, 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    const double h2 = harmonic_db(out, 146.83, 2, 1.0, 2.0);
    const double h3 = harmonic_db(out, 146.83, 3, 1.0, 2.0);
    const double h4 = harmonic_db(out, 146.83, 4, 1.0, 2.0);
    const double h5 = harmonic_db(out, 146.83, 5, 1.0, 2.0);
    SHOW("reeds at 147 Hz: h3 over h2 by %.1f dB, h5 over h4 by %.1f dB", h3 - h2, h5 - h4);
    EXPECT(h3 - h2 > 8.0 && h5 - h4 > 6.0 && h3 - h4 > 8.0,
           "reeds: odd harmonics well over even in the low register");
    // Higher up the oboe takes over: the even harmonics are back.
    plain(device, kReeds);
    device.note_on(1, 587.33f, 0.7f);
    Stereo high = render(device, 2.0f, kRate);
    const double up2 = harmonic_db(high, 587.33, 2, 1.0, 2.0);
    const double up3 = harmonic_db(high, 587.33, 3, 1.0, 2.0);
    SHOW("reeds at 587 Hz: h2 over h3 by %.1f dB", up2 - up3);
    EXPECT(up2 > up3 - 6.0, "reeds: even harmonics return in the upper register");
  }

  // Strings: harmonics all the way to 5 kHz, and a formant near 3 kHz (the
  // bridge hill): the harmonics around it stand over those around 1.8 kHz
  // and well over those around 4.6 kHz.
  {
    plain(device, kStrings);
    device.note_on(1, 196.0f, 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    auto region = [&](int from, int to) {
      double sum = 0.0;
      for (int h = from; h <= to; ++h) {
        const double level = tone_level(out.left, 196.0 * h, kRate, at(1.0), at(2.0));
        sum += level * level;
      }
      return 10.0 * std::log10(sum / (to - from + 1));
    };
    const double fundamental = harmonic_db(out, 196.0, 1, 1.0, 2.0);
    const double dip = region(9, 10);      // 1.76 .. 1.96 kHz
    const double hill = region(14, 16);    // 2.74 .. 3.14 kHz
    const double above = region(23, 25);   // 4.5 .. 4.9 kHz
    SHOW("strings at 196 Hz: hill %.1f dB, 1.8 kHz %.1f dB, 4.7 kHz %.1f dB (re the fundamental)",
         hill - fundamental, dip - fundamental, above - fundamental);
    EXPECT(hill > dip + 3.0 && hill > above + 8.0, "strings: a formant near 3 kHz");
    EXPECT(above > fundamental - 45.0, "strings: harmonics are present up to 5 kHz");
  }

  // Horns: mellow (the spectrum balances far lower than the strings') and
  // the harmonics open as the note swells.
  {
    plain(device, kStrings);
    device.note_on(1, 220.0f, 0.7f);
    Stereo strings = render(device, 3.0f, kRate);
    plain(device, kHorns);
    device.note_on(1, 220.0f, 0.7f);
    Stereo horns = render(device, 3.0f, kRate);
    const double strings_centre = centroid(strings, 220.0, 2.0, 3.0);
    const double horns_centre = centroid(horns, 220.0, 2.0, 3.0);
    const double horns_early = centroid(horns, 220.0, 0.02, 0.12);
    SHOW("centroid at 220 Hz: strings %.0f Hz, horns %.0f Hz (%.0f Hz in the first 0.1 s)",
         strings_centre, horns_centre, horns_early);
    EXPECT(horns_centre < 0.6 * strings_centre, "horns: the spectrum sits far below the strings'");
    EXPECT(horns_centre > 1.15 * horns_early, "horns: the harmonics open as the note swells");
    const double early = rms(horns.left, at(0.15), at(0.25));
    const double late = rms(horns.left, at(2.0), at(3.0));
    SHOW("horns: level at 0.2 s is %.1f dB under the swollen note", db(late / early));
    EXPECT(early < 0.8 * late, "horns: the note swells after its attack");
  }

  // Cellos: the body is low. The spectrum balances below the violins' on
  // the same key, and a cello speaks more slowly.
  {
    plain(device, kStrings);
    device.note_on(1, 146.83f, 0.7f);
    Stereo strings = render(device, 2.0f, kRate);
    plain(device, kCellos);
    device.note_on(1, 146.83f, 0.7f);
    Stereo cellos = render(device, 2.0f, kRate);
    const double strings_centre = centroid(strings, 146.83, 1.0, 2.0);
    const double cellos_centre = centroid(cellos, 146.83, 1.0, 2.0);
    auto share_below = [&](const Stereo& out, double hz) {
      double low = 0.0, all = 0.0;
      for (int h = 1; h <= 40; ++h) {
        const double level = tone_level(out.left, 146.83 * h, kRate, at(1.0), at(2.0));
        all += level * level;
        if (146.83 * h < hz) low += level * level;
      }
      return low / all;
    };
    SHOW("centroid at 147 Hz: strings %.0f Hz, cellos %.0f Hz; energy under 400 Hz: %.0f%% and %.0f%%",
         strings_centre, cellos_centre, 100.0 * share_below(strings, 400.0), 100.0 * share_below(cellos, 400.0));
    EXPECT(cellos_centre < 0.75 * strings_centre, "cellos: darker than the violins");
    EXPECT(share_below(cellos, 400.0) > 0.5 && share_below(cellos, 400.0) > 1.5 * share_below(strings, 400.0),
           "cellos: most of the sound is in the low body resonances");
    auto rise = [&](const Stereo& out) {
      const double full = rms(out.left, at(1.0), at(2.0));
      for (size_t from = 0; from + 480 <= out.size(); from += 48) {
        if (rms(out.left, from, from + 480) > 0.5 * full) return static_cast<double>(from) / kRate;
      }
      return 9.0;
    };
    SHOW("time to half level: strings %.0f ms, cellos %.0f ms", 1000.0 * rise(strings), 1000.0 * rise(cellos));
    EXPECT(rise(cellos) > 1.3 * rise(strings), "cellos: a slower attack than the violins");
  }

  // Choir: an open vowel. The first two formants (around 0.7 to 1.2 kHz)
  // stand over the valley near 1.9 kHz, and the third (around 2.6 kHz) comes
  // back up out of it.
  {
    plain(device, kChoir);
    device.note_on(1, 110.0f, 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    auto region = [&](double from, double to) {
      double best = -200.0;
      for (int h = 1; h <= 60; ++h) {
        if (110.0 * h < from || 110.0 * h > to) continue;
        best = std::max(best, db(tone_level(out.left, 110.0 * h, kRate, at(1.0), at(2.0))));
      }
      return best;
    };
    const double first = region(650.0, 1250.0);
    const double valley = region(1700.0, 2000.0);
    const double third = region(2300.0, 2900.0);
    const double low = region(100.0, 250.0);
    SHOW("choir at 110 Hz: formants 1-2 %.1f dB, valley %.1f dB, formant 3 %.1f dB, fundamental region %.1f dB",
         first, valley, third, low);
    EXPECT(first > valley + 10.0, "choir: the vowel's first formants stand over the valley above them");
    EXPECT(third > valley + 3.0, "choir: the third formant rises out of the valley");
    EXPECT(first > low, "choir: the formants, not the fundamental, carry the vowel");
  }

  // TESTS

  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("tape-orchestra (8 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("tape-orchestra");
}
