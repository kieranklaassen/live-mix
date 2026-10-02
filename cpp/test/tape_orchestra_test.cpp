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

// Level of the component at `hz` in the 0.1 s from `from` seconds. The
// window is short on purpose: a key sits a cent or two from its note, and a
// long window would miss its upper harmonics.
static double partial(const Stereo& out, double hz, double from) {
  return tone_level(out.left, hz, kRate, at(from), at(from + 0.1));
}

// Level in dB of harmonic `h` of `hz`, 0.1 s from `from` seconds.
static double harmonic_db(const Stereo& out, double hz, int h, double from) {
  return db(partial(out, hz * h, from));
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

// Where the spectrum balances, in Hz, 0.1 s from `from` seconds: the mean of
// the first forty harmonics of `hz` weighted by their power.
static double centroid(const Stereo& out, double hz, double from) {
  double weighted = 0.0, total = 0.0;
  for (int h = 1; h <= 40 && hz * h < 12000.0; ++h) {
    const double level = partial(out, hz * h, from);
    weighted += hz * h * level * level;
    total += level * level;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// Largest second difference: a jump shows here even under a loud low note
// (a smooth 700 Hz sine of amplitude 0.4 reaches 0.003, a step of 0.05 gives 0.05).
static double max_bend(const std::vector<float>& x) {
  double worst = 0.0;
  for (size_t i = 2; i < x.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  }
  return worst;
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
    const double h1 = harmonic_db(out, 440.0, 1, 1.0);
    const double h2 = harmonic_db(out, 440.0, 2, 1.0);
    const double h3 = harmonic_db(out, 440.0, 3, 1.0);
    SHOW("flutes at 440 Hz: h2 %.1f dB, h3 %.1f dB under the fundamental", h1 - h2, h1 - h3);
    EXPECT(h1 - h3 > 15.0, "flutes: the fundamental is 15 dB over the third harmonic");
    EXPECT(h1 - h2 > 10.0, "flutes: the second harmonic is weak");
  }

  // Reeds: in the low register the odd harmonics stand well over the even.
  {
    plain(device, kReeds);
    device.note_on(1, 146.83f, 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    const double h2 = harmonic_db(out, 146.83, 2, 1.0);
    const double h3 = harmonic_db(out, 146.83, 3, 1.0);
    const double h4 = harmonic_db(out, 146.83, 4, 1.0);
    const double h5 = harmonic_db(out, 146.83, 5, 1.0);
    SHOW("reeds at 147 Hz: h3 over h2 by %.1f dB, h5 over h4 by %.1f dB", h3 - h2, h5 - h4);
    EXPECT(h3 - h2 > 8.0 && h5 - h4 > 6.0 && h3 - h4 > 8.0,
           "reeds: odd harmonics well over even in the low register");
    // Higher up the oboe takes over: the even harmonics are back.
    plain(device, kReeds);
    device.note_on(1, 587.33f, 0.7f);
    Stereo high = render(device, 2.0f, kRate);
    const double up2 = harmonic_db(high, 587.33, 2, 1.0);
    const double up3 = harmonic_db(high, 587.33, 3, 1.0);
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
        const double level = partial(out, 196.0 * h, 1.0);
        sum += level * level;
      }
      return 10.0 * std::log10(sum / (to - from + 1));
    };
    const double fundamental = harmonic_db(out, 196.0, 1, 1.0);
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
    const double strings_centre = centroid(strings, 220.0, 2.0);
    const double horns_centre = centroid(horns, 220.0, 2.0);
    const double horns_early = centroid(horns, 220.0, 0.02);
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
    const double strings_centre = centroid(strings, 146.83, 1.0);
    const double cellos_centre = centroid(cellos, 146.83, 1.0);
    auto share_below = [&](const Stereo& out, double hz) {
      double low = 0.0, all = 0.0;
      for (int h = 1; h <= 40; ++h) {
        const double level = partial(out, 146.83 * h, 1.0);
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
  // stand over the valley near 1.9 kHz and over the fundamental, whatever
  // the key.
  {
    plain(device, kChoir);
    device.note_on(1, 110.0f, 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    auto region = [&](double from, double to) {
      double best = -200.0;
      for (int h = 1; h <= 60; ++h) {
        if (110.0 * h < from || 110.0 * h > to) continue;
        best = std::max(best, db(partial(out, 110.0 * h, 1.0)));
      }
      return best;
    };
    const double first = region(650.0, 1250.0);
    const double valley = region(1700.0, 2000.0);
    const double low = region(100.0, 250.0);
    SHOW("choir at 110 Hz: formants %.1f dB over the valley above them, %.1f dB over the fundamental",
         first - valley, first - low);
    EXPECT(first > valley + 12.0, "choir: the vowel's formants stand over the valley above them");
    EXPECT(first > low + 2.0, "choir: the formants, not the fundamental, carry the vowel");
    // The same vowel on another key: the formants stay where they are.
    plain(device, kChoir);
    device.note_on(1, 164.81f, 0.7f);
    Stereo other = render(device, 2.0f, kRate);
    double best = 0.0, best_hz = 0.0;
    for (int h = 1; h <= 20; ++h) {
      const double level = partial(other, 164.81 * h, 1.0);
      if (level > best) {
        best = level;
        best_hz = 164.81 * h;
      }
    }
    SHOW("choir at 165 Hz: the strongest harmonic is at %.0f Hz", best_hz);
    EXPECT(best_hz > 600.0 && best_hz < 1300.0, "choir: the strongest harmonic sits in the vowel's formants");
  }

  // Section: with the players apart a key is several slightly detuned
  // voices (its harmonics beat) that come in at different moments; at zero
  // they play as one.
  {
    auto swing = [&](float section) {
      plain(device, kStrings);
      device.set_param(p::kPlayers, section);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 9.0f, kRate);
      // The fifth harmonic over time, in 0.1 s windows.
      double lo = 1.0e9, hi = 0.0;
      for (double t = 1.0; t < 8.9; t += 0.05) {
        const double level = tone_level(out.left, 1100.0, kRate, at(t), at(t + 0.1));
        lo = std::min(lo, level);
        hi = std::max(hi, level);
      }
      return db(hi / lo);
    };
    const double tight = swing(0.0f);
    const double loose = swing(1.0f);
    SHOW("section: the 5th harmonic swings %.2f dB as one, %.1f dB apart", tight, loose);
    EXPECT(tight < 0.5, "Section 0: the players are one steady voice");
    EXPECT(loose > 6.0, "Section 1: detuned players beat against each other");

    // Onset: the time between a quarter and three quarters of the level.
    auto onset = [&](float section) {
      plain(device, kStrings);
      device.set_param(p::kPlayers, section);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 1.0f, kRate);
      const double full = rms(out.left, at(0.5), at(1.0));
      double quarter = -1.0, most = -1.0;
      for (size_t from = 0; from + 240 <= out.size(); from += 24) {
        const double level = rms(out.left, from, from + 240) / full;
        if (quarter < 0.0 && level > 0.25) quarter = static_cast<double>(from) / kRate;
        if (most < 0.0 && level > 0.75) most = static_cast<double>(from) / kRate;
      }
      return most - quarter;
    };
    const double together = onset(0.0f);
    const double scattered = onset(1.0f);
    SHOW("section: the note rises in %.0f ms as one, %.0f ms scattered", 1000.0 * together, 1000.0 * scattered);
    EXPECT(scattered > together + 0.008, "Section 1: the players come in at different moments");
  }

  // The tape under a key: wow and flutter follow Age.
  {
    auto wobble = [&](float age, float hz, std::vector<double>* keep) {
      plain(device, kFlutes);
      device.set_param(p::kAge, age);
      device.note_on(1, hz, 0.7f);
      Stereo out = render(device, 8.0f, kRate);
      std::vector<double> track = cents_track(out.left, hz);
      if (keep) *keep = track;
      double lo = 1.0e9, hi = -1.0e9;
      for (size_t i = 100; i < track.size(); ++i) {
        lo = std::min(lo, track[i]);
        hi = std::max(hi, track[i]);
      }
      return 0.5 * (hi - lo);
    };
    std::vector<double> track_a, track_b;
    const double fresh = wobble(0.0f, 880.0f, nullptr);
    const double middle = wobble(0.5f, 880.0f, nullptr);
    const double worn = wobble(1.0f, 880.0f, &track_a);
    SHOW("wow and flutter: +-%.2f cents new, +-%.1f at Age 0.5, +-%.1f worn out", fresh, middle, worn);
    EXPECT(fresh < 2.0, "Age 0: the tape runs nearly true");
    EXPECT(middle > 2.5 * fresh && worn > 1.6 * middle, "wow and flutter grow with Age");
    EXPECT(worn > 9.0 && worn < 25.0, "Age 1: about a sixth of a semitone of wobble");

    // Flutter is there too: the pitch moves between 6 and 10 times a second.
    double fastest = 0.0;
    for (size_t i = 100; i + 20 < track_a.size(); ++i) {
      // Remove the wow with a 0.1 s mean; what is left is flutter.
      fastest = std::max(fastest, std::fabs(track_a[i + 10] - mean_of(track_a, i, i + 20)));
    }
    SHOW("flutter at Age 1: +-%.1f cents around the wow", fastest);
    EXPECT(fastest > 1.5 && fastest < 8.0, "Age 1: a few cents of flutter on top of the wow");

    // Another key has its own tape: its wobble goes its own way.
    wobble(1.0f, 987.77f, &track_b);
    const size_t n = std::min(track_a.size(), track_b.size());
    const double mean_a = mean_of(track_a, 100, n), mean_b = mean_of(track_b, 100, n);
    double ab = 0.0, aa = 0.0, bb = 0.0;
    for (size_t i = 100; i < n; ++i) {
      ab += (track_a[i] - mean_a) * (track_b[i] - mean_b);
      aa += (track_a[i] - mean_a) * (track_a[i] - mean_a);
      bb += (track_b[i] - mean_b) * (track_b[i] - mean_b);
    }
    const double together = ab / std::sqrt(aa * bb);
    SHOW("two keys: their pitch tracks correlate %.2f", together);
    EXPECT(std::fabs(together) < 0.5, "each key has its own wow and flutter");
  }

  // The lurch: a note starts flat as the tape is gripped and has settled
  // within 0.1 s. A quarter-tone on a worn machine, a few cents on a new one.
  {
    // Returns how flat the first 25 ms are against the pitch between 0.1 and
    // 0.2 s; `climb` is the fastest the pitch rises during the lurch and
    // `after` the fastest it moves once it should be over (cents per 5 ms).
    auto lurch = [&](float age, double* climb, double* after) {
      plain(device, kFlutes);
      device.set_param(p::kAge, age);
      device.note_on(1, 880.0f, 0.7f);
      Stereo out = render(device, 0.4f, kRate);
      std::vector<double> track = cents_track(out.left, 880.0);
      *climb = 0.0;
      *after = 0.0;
      for (size_t i = 2; i < 14; ++i) *climb = std::max(*climb, track[i + 1] - track[i]);
      for (size_t i = 20; i < 40; ++i) *after = std::max(*after, std::fabs(track[i + 1] - track[i]));
      return mean_of(track, 0, 2) - mean_of(track, 20, 40);
    };
    double worn_climb = 0.0, worn_after = 0.0, fresh_climb = 0.0, fresh_after = 0.0;
    const double worn = lurch(1.0f, &worn_climb, &worn_after);
    const double fresh = lurch(0.0f, &fresh_climb, &fresh_after);
    SHOW("lurch: starts %.1f cents flat worn, %.1f cents flat new; climbs %.1f cents per 5 ms, then moves %.1f",
         -worn, -fresh, worn_climb, worn_after);
    EXPECT(worn < -25.0 && worn > -60.0, "Age 1: the note starts around a quarter-tone flat");
    EXPECT(fresh < -1.5 && fresh > -6.0, "Age 0: the note starts a few cents flat");
    EXPECT(worn_climb > 3.0 && worn_after < 0.5 * worn_climb,
           "the lurch is over within 0.1 s: after it the pitch only wobbles");
  }

  // Half speed: an octave lower, half the bandwidth, a slower attack.
  {
    auto take = [&](float speed) {
      plain(device, kStrings);
      device.set_param(p::kSpeed, speed);
      device.note_on(1, 440.0f, 0.7f);
      return render(device, 3.0f, kRate);
    };
    Stereo normal = take(0.0f);
    Stereo half = take(1.0f);
    const double pitch = mean_of(cents_track(half.left, 220.0), 200, 560);
    SHOW("half speed: the 440 Hz key sounds %.1f cents from 220 Hz", pitch);
    EXPECT(std::fabs(pitch) < 12.0, "Half: the key sounds one octave lower");
    EXPECT(partial(half, 220.0, 1.0) > 20.0 * partial(normal, 220.0, 1.0),
           "Half: the octave below was not there at full speed");
    // The highest harmonic within 40 dB of the strongest.
    auto reach = [&](const Stereo& out, double hz) {
      double strongest = 0.0;
      for (int h = 1; h * hz < 16000.0; ++h) {
        strongest = std::max(strongest, partial(out, hz * h, 1.0));
      }
      double top = 0.0;
      for (int h = 1; h * hz < 16000.0; ++h) {
        if (partial(out, hz * h, 1.0) > 0.01 * strongest) top = hz * h;
      }
      return top;
    };
    const double normal_reach = reach(normal, 440.0);
    const double half_reach = reach(half, 220.0);
    SHOW("bandwidth (-40 dB): %.0f Hz at full speed, %.0f Hz at half", normal_reach, half_reach);
    EXPECT(half_reach > 0.4 * normal_reach && half_reach < 0.62 * normal_reach,
           "Half: the bandwidth is about halved");
    auto rise = [&](const Stereo& out) {
      const double full = rms(out.left, at(1.0), at(2.0));
      for (size_t from = 0; from + 480 <= out.size(); from += 48) {
        if (rms(out.left, from, from + 480) > 0.5 * full) return static_cast<double>(from) / kRate;
      }
      return 9.0;
    };
    SHOW("time to half level: %.0f ms at full speed, %.0f ms at half", 1000.0 * rise(normal), 1000.0 * rise(half));
    EXPECT(rise(half) > 1.5 * rise(normal), "Half: the attack is slower");
  }

  // Length: a key has that much tape. The note fades over the last half
  // second and is gone; fully up the tape never ends.
  {
    plain(device, kStrings);
    device.set_param(p::kLength, 8.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 9.0f, kRate);
    const double held = rms(out.left, at(3.0), at(4.0));
    const double late = rms(out.left, at(7.0), at(7.4));
    const double fading = rms(out.left, at(7.7), at(7.9));
    const double gone = peak(out.left, at(8.6), at(9.0));
    SHOW("length 8: %.1f dB at 7.2 s, %.1f dB at 7.8 s, peak %g after 8.6 s (re the held note)",
         db(late / held), db(fading / held), gone);
    EXPECT(late > 0.7 * held, "Length 8: the note is still there after 7 s");
    EXPECT(fading < 0.6 * held && fading > 0.01 * held, "Length 8: it fades over the last half second");
    EXPECT(gone < 0.001 * held, "Length 8: at least 60 dB down by 8.6 s with the key still held");
    EXPECT(gone == 0.0, "Length 8: in fact silent, and the instrument sleeps");
    // The key has to be struck again.
    device.note_on(1, 220.0f, 0.7f);
    Stereo again = render(device, 1.0f, kRate);
    EXPECT(rms(again.left, at(0.5), at(1.0)) > 0.7 * held, "a key that ran out plays again when struck");

    plain(device, kStrings);
    device.note_on(1, 220.0f, 0.7f);
    Stereo endless = render(device, 30.0f, kRate);
    const double end = rms(endless.left, at(29.0), at(30.0));
    SHOW("endless: %.1f dB after 30 s", db(end / rms(endless.left, at(3.0), at(4.0))));
    EXPECT(end > 0.7 * rms(endless.left, at(3.0), at(4.0)), "Length fully up: the note holds for 30 s");

    // Half speed makes the same tape last twice as long.
    plain(device, kStrings);
    device.set_param(p::kLength, 2.0f);
    device.set_param(p::kSpeed, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo slow = render(device, 5.0f, kRate);
    EXPECT(rms(slow.left, at(2.5), at(2.9)) > 0.5 * rms(slow.left, at(1.5), at(2.0)),
           "Half: two seconds of tape are still playing after 2.5 s");
    EXPECT(peak(slow.left, at(4.3), at(5.0)) == 0.0, "Half: and have run out by 4 s");
  }

  // Hiss: only while notes sound, more with more keys down, and exact
  // silence once they are gone. Measured above 11 kHz, where the tape has
  // nothing of its own.
  {
    auto air = [&](const Stereo& out, double from) {
      double sum = 0.0;
      for (double hz = 11000.0; hz < 15000.0; hz += 250.0) {
        const double level = tone_level(out.left, hz, kRate, at(from), at(from + 0.5));
        sum += level * level;
      }
      return std::sqrt(sum);
    };
    auto take = [&](float hiss, int keys) {
      plain(device, kFlutes);
      device.set_param(p::kHiss, hiss);
      for (int n = 0; n < keys; ++n) device.note_on(n, 220.0f * std::pow(2.0f, n * 4 / 12.0f), 0.7f);
      Stereo out = render(device, 2.0f, kRate);
      for (int n = 0; n < keys; ++n) device.note_off(n);
      return concat(out, render(device, 1.5f, kRate));
    };
    Stereo clean = take(0.0f, 1);
    Stereo hissy = take(1.0f, 1);
    Stereo chord = take(1.0f, 4);
    Stereo some = take(0.2f, 1);
    SHOW("hiss above 11 kHz: %.1f dB over a clean note at Hiss 1, %.1f dB at 0.2; four keys add %.1f dB",
         db(air(hissy, 1.0) / air(clean, 1.0)), db(air(some, 1.0) / air(clean, 1.0)),
         db(air(chord, 1.0) / air(hissy, 1.0)));
    SHOW("hiss level at Hiss 1: %.1f dB under the note", db(rms(clean.left, at(1.0), at(2.0)) /
         std::sqrt(std::max(1e-20, rms(hissy.left, at(1.0), at(2.0)) * rms(hissy.left, at(1.0), at(2.0)) -
                                   rms(clean.left, at(1.0), at(2.0)) * rms(clean.left, at(1.0), at(2.0))))));
    EXPECT(air(hissy, 1.0) > 10.0 * air(clean, 1.0), "Hiss 1: clearly there while a note sounds");
    EXPECT(air(some, 1.0) > 1.5 * air(clean, 1.0) && air(some, 1.0) < 0.3 * air(hissy, 1.0),
           "Hiss follows its knob");
    const double grown = air(chord, 1.0) / air(hissy, 1.0);
    EXPECT(grown > 1.5 && grown < 2.6, "four keys hiss about 6 dB more than one");
    EXPECT(peak(hissy.left, at(3.0), at(3.5)) == 0.0 && peak(hissy.right, at(3.0), at(3.5)) == 0.0,
           "no hiss once the notes are gone: exact silence");
    device.init(kRate);
    device.set_param(p::kHiss, 1.0f);
    Stereo idle = render(device, 0.5f, kRate);
    EXPECT(peak(idle.left) == 0.0, "no hiss before a note is played");
  }

  // Levels: one key sits at a sane level on every tape, velocity changes
  // it, and ten held keys stay under the knee of the clipper.
  {
    double quietest = 0.0, loudest = -200.0, tallest = 0.0;
    for (int tape = 0; tape < 6; ++tape) {
      for (float hz : {110.0f, 261.63f, 523.25f}) {
        device.init(kRate);
        device.set_param(p::kTape, static_cast<float>(tape));
        device.note_on(1, hz, 0.7f);
        Stereo out = render(device, 3.0f, kRate);
        const double level = db(std::max(peak(out.left), peak(out.right)));
        quietest = std::min(quietest, level);
        loudest = std::max(loudest, level);
      }
      device.init(kRate);
      device.set_param(p::kTape, static_cast<float>(tape));
      for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
      Stereo pile = render(device, 4.0f, kRate);
      tallest = std::max(tallest, std::max(peak(pile.left), peak(pile.right)));
    }
    SHOW("one key at gain 0.7 peaks between %.1f and %.1f dBFS; ten keys peak at %.2f", quietest, loudest, tallest);
    EXPECT(quietest > -24.0 && loudest < -10.0, "one key at gain 0.7 peaks between -24 and -10 dBFS on every tape");
    EXPECT(tallest < 0.5, "ten held keys stay under the clip knee on every tape");

    plain(device, kStrings);
    device.note_on(1, 220.0f, 1.0f);
    Stereo hard = render(device, 1.0f, kRate);
    plain(device, kStrings);
    device.note_on(1, 220.0f, 0.1f);
    Stereo soft = render(device, 1.0f, kRate);
    SHOW("velocity: gain 0.1 is %.1f dB under gain 1", db(rms(hard.left, at(0.5)) / rms(soft.left, at(0.5))));
    EXPECT(rms(soft.left, at(0.5)) < 0.6 * rms(hard.left, at(0.5)), "soft keys are quieter");
  }

  // No clicks: Tone swept through its range while a chord sounds, Speed
  // switched, Tape switched, and Volume and Spread thrown about. The largest
  // sample-to-sample step stays near that of the untouched chord.
  {
    auto chord = [&]() {
      device.init(kRate);
      device.set_param(p::kHiss, 0.0f);
      device.note_on(1, 146.83f, 0.8f);
      device.note_on(2, 220.0f, 0.8f);
      device.note_on(3, 369.99f, 0.8f);
      render(device, 1.0f, kRate);
    };
    chord();
    const double still = max_step(render(device, 2.0f, kRate).left);
    // Tone fully up is brighter, so its steps are larger without any click.
    device.init(kRate);
    device.set_param(p::kHiss, 0.0f);
    device.set_param(p::kTone, 1.0f);
    device.note_on(1, 146.83f, 0.8f);
    device.note_on(2, 220.0f, 0.8f);
    device.note_on(3, 369.99f, 0.8f);
    render(device, 1.0f, kRate);
    const double bright = max_step(render(device, 2.0f, kRate).left);

    chord();
    Stereo swept;
    for (int i = 0; i < 400; ++i) {
      // Down and up the whole range four times in two seconds, in steps as a
      // host sends them.
      device.set_param(p::kTone, static_cast<float>(std::sin(2.0 * kPi * i / 100.0)));
      swept = concat(swept, render(device, 0.005f, kRate));
    }
    SHOW("clicks: still chord %.4f (%.4f with Tone up), Tone swept %.4f", still, bright, max_step(swept.left));
    EXPECT(max_step(swept.left) < 1.25 * bright + 0.002, "sweeping Tone makes no clicks");

    chord();
    Stereo thrown;
    for (int i = 0; i < 40; ++i) {
      device.set_param(p::kVolume, (i & 1) ? -9.0f : -20.0f);
      device.set_param(p::kSpread, (i & 1) ? 0.0f : 1.0f);
      device.set_param(p::kPlayers, (i & 2) ? 0.1f : 1.0f);
      device.set_param(p::kAge, (i & 1) ? 0.0f : 1.0f);
      thrown = concat(thrown, render(device, 0.05f, kRate));
    }
    SHOW("clicks: Volume, Spread, Section and Age thrown about %.4f", max_step(thrown.left));
    EXPECT(max_step(thrown.left) < 2.0 * still + 0.002, "jumping Volume, Spread, Section and Age makes no clicks");

    chord();
    Stereo slowed;
    for (int i = 0; i < 6; ++i) {
      device.set_param(p::kSpeed, (i & 1) ? 0.0f : 1.0f);
      slowed = concat(slowed, render(device, 0.6f, kRate));
    }
    SHOW("clicks: Speed switched %.4f", max_step(slowed.left));
    EXPECT(max_step(slowed.left) < 2.0 * still + 0.002, "switching Speed makes no clicks");

    chord();
    Stereo switched;
    for (int i = 0; i < 12; ++i) {
      device.set_param(p::kTape, static_cast<float>((i * 5 + 2) % 6));
      switched = concat(switched, render(device, i < 6 ? 0.3f : 0.013f, kRate));
    }
    SHOW("clicks: Tape switched %.4f", max_step(switched.left));
    EXPECT(max_step(switched.left) < 2.5 * still + 0.002, "switching Tape makes no clicks");

    // More keys than voices, struck fast: stolen voices fade, they do not jump.
    device.init(kRate);
    device.set_param(p::kHiss, 0.0f);
    device.set_param(p::kTape, static_cast<float>(kFlutes));
    Stereo pile;
    for (int n = 0; n < 40; ++n) {
      device.note_on(n, 220.0f * std::pow(2.0f, static_cast<float>(n % 20) / 12.0f), 0.5f);
      pile = concat(pile, render(device, 0.03f, kRate));
    }
    SHOW("clicks: 40 keys on 16 voices, largest bend %.4f (peak %.2f)", max_bend(pile.left), peak(pile.left));
    EXPECT(max_bend(pile.left) < 0.008, "stealing voices makes no clicks");
  }

  // A switched tape is the new instrument within a fifth of a second, on
  // the keys that were already down.
  {
    plain(device, kStrings);
    device.note_on(1, 440.0f, 0.7f);
    Stereo before = render(device, 1.0f, kRate);
    device.set_param(p::kTape, static_cast<float>(kFlutes));
    Stereo after = render(device, 1.0f, kRate);
    const double strings_third = harmonic_db(before, 440.0, 3, 0.8) - harmonic_db(before, 440.0, 1, 0.8);
    const double flutes_third = harmonic_db(after, 440.0, 3, 0.2) - harmonic_db(after, 440.0, 1, 0.2);
    SHOW("tape switch: third harmonic %.1f dB before, %.1f dB 0.2 s after (re the fundamental)", strings_third,
         flutes_third);
    EXPECT(flutes_third < strings_third - 8.0 && flutes_third < -15.0, "a held key crosses over to the new tape");
    EXPECT(rms(after.left, at(0.5), at(1.0)) > 0.3 * rms(before.left, at(0.5), at(1.0)), "and keeps sounding");
  }

  // Stereo: the players of a key sit apart. Spread 0 is mono; at the
  // default the image is wide but the channels still agree, and the mono
  // sum loses nothing.
  {
    device.init(kRate);
    device.set_param(p::kSpread, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    device.note_on(2, 329.63f, 0.7f);
    Stereo mono = render(device, 2.0f, kRate);
    EXPECT(mono.left == mono.right, "Spread 0 is mono, hiss included");

    auto image = [&](float spread, int tape, double* sum_loss) {
      device.init(kRate);
      device.set_param(p::kTape, static_cast<float>(tape));
      device.set_param(p::kSpread, spread);
      device.note_on(1, 146.83f, 0.7f);
      device.note_on(2, 220.0f, 0.7f);
      device.note_on(3, 369.99f, 0.7f);
      Stereo out = render(device, 8.0f, kRate);
      std::vector<float> mid(out.size());
      for (size_t i = 0; i < out.size(); ++i) mid[i] = 0.5f * (out.left[i] + out.right[i]);
      const double left = rms(out.left, at(1.0)), right = rms(out.right, at(1.0));
      *sum_loss = db(std::sqrt(0.5 * (left * left + right * right)) / rms(mid, at(1.0)));
      return correlation(out.left, out.right, at(1.0));
    };
    double loss = 0.0, wide_loss = 0.0, worst_loss = 0.0;
    const double usual = image(0.7f, kStrings, &loss);
    const double wide = image(1.0f, kStrings, &wide_loss);
    double least = 1.0;
    for (int tape = 0; tape < 6; ++tape) {
      double tape_loss = 0.0;
      least = std::min(least, image(1.0f, tape, &tape_loss));
      worst_loss = std::max(worst_loss, tape_loss);
    }
    SHOW("stereo: correlation %.2f at the default spread (mono sum loses %.1f dB), %.2f at Spread 1 (%.1f dB)",
         usual, loss, wide, wide_loss);
    SHOW("stereo: over all tapes at Spread 1 the correlation is at least %.2f, the mono loss at most %.1f dB",
         least, worst_loss);
    EXPECT(usual > 0.3 && usual < 0.95, "the default patch is wide and its channels agree");
    EXPECT(wide < usual, "Spread widens the image");
    EXPECT(least > 0.0, "the channels never oppose each other, on any tape");
    EXPECT(worst_loss < 3.0, "the mono sum keeps its level on every tape");
  }

  // Attack and Release are the times they say, on top of the tape's own.
  {
    plain(device, kFlutes);
    device.set_param(p::kAttack, 2.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, 440.0f, 0.7f);
    Stereo rise = render(device, 4.0f, kRate);
    const double full = rms(rise.left, at(3.0), at(4.0));
    SHOW("attack 2 s: %.1f dB at 0.2 s, %.1f dB at 2.2 s", db(rms(rise.left, at(0.15), at(0.25)) / full),
         db(rms(rise.left, at(2.15), at(2.25)) / full));
    EXPECT(rms(rise.left, at(0.15), at(0.25)) < 0.3 * full, "a 2 s attack is still quiet after 0.2 s");
    EXPECT(rms(rise.left, at(2.15), at(2.25)) > 0.85 * full, "and has arrived shortly after 2 s");
    device.note_off(1);
    Stereo fall = render(device, 3.0f, kRate);
    SHOW("release 1 s: %.1f dB at 0.45 s, %.1f dB at 1.05 s", db(rms(fall.left, at(0.4), at(0.5)) / full),
         db(rms(fall.left, at(1.0), at(1.1)) / full));
    EXPECT(rms(fall.left, at(0.4), at(0.5)) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall.left, at(1.0), at(1.1)) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, at(2.0), at(3.0)) == 0.0, "and is exactly silent soon after");
  }

  // Vibrato: late, at about six a second, as deep as the knob says.
  {
    auto shake = [&](float amount, double* early) {
      plain(device, kStrings);
      device.set_param(p::kVibrato, amount);
      device.note_on(1, 440.0f, 0.7f);
      Stereo out = render(device, 3.0f, kRate);
      std::vector<double> track = cents_track(out.left, 440.0);
      double lo = 1.0e9, hi = -1.0e9;
      for (size_t i = 240; i < track.size(); ++i) {
        lo = std::min(lo, track[i]);
        hi = std::max(hi, track[i]);
      }
      double early_lo = 1.0e9, early_hi = -1.0e9;
      for (size_t i = 24; i < 44; ++i) {  // 0.12 .. 0.22 s: after the lurch, before the vibrato
        early_lo = std::min(early_lo, track[i]);
        early_hi = std::max(early_hi, track[i]);
      }
      *early = 0.5 * (early_hi - early_lo);
      // Rate: upward crossings of the mean between 1.2 and 3 s.
      const double centre = mean_of(track, 240, track.size());
      int crossings = 0;
      for (size_t i = 241; i < track.size(); ++i) {
        if (track[i - 1] < centre && track[i] >= centre) ++crossings;
      }
      return std::pair<double, double>(0.5 * (hi - lo),
                                       crossings / (static_cast<double>(track.size() - 241) * 0.005));
    };
    double early_full = 0.0, early_none = 0.0, early_half = 0.0;
    const std::pair<double, double> full = shake(1.0f, &early_full);
    const std::pair<double, double> half = shake(0.5f, &early_half);
    const std::pair<double, double> none = shake(0.0f, &early_none);
    SHOW("vibrato on strings: +-%.1f cents at %.1f Hz fully up (+-%.1f in the first 0.2 s), +-%.1f at half, +-%.1f off",
         full.first, full.second, early_full, half.first, none.first);
    EXPECT(full.first > 16.0 && full.first < 32.0, "Vibrato 1: about a quarter of a semitone either way");
    EXPECT(full.second > 4.5 && full.second < 7.5, "at about six a second");
    EXPECT(half.first > 0.35 * full.first && half.first < 0.65 * full.first, "Vibrato follows its knob");
    EXPECT(none.first < 2.5, "Vibrato 0: a straight tone");
    EXPECT(early_full < 0.3 * full.first, "the vibrato comes in after the note has begun");
  }

  // Dropouts: none on a tape in fair shape, brief dips in level at fixed
  // places on a worn one.
  {
    auto deepest = [&](float age) {
      plain(device, kFlutes);
      device.set_param(p::kAge, age);
      device.note_on(1, 440.0f, 0.7f);
      Stereo out = render(device, 8.0f, kRate);
      std::vector<double> levels;
      for (size_t from = at(1.0); from + 960 <= out.size(); from += 480) levels.push_back(rms(out.left, from, from + 960));
      std::vector<double> sorted = levels;
      std::sort(sorted.begin(), sorted.end());
      return db(sorted[sorted.size() / 2] / sorted[0]);
    };
    const double fair = deepest(0.4f);
    const double worn = deepest(1.0f);
    SHOW("dropouts: the deepest dip is %.1f dB at Age 0.4, %.1f dB at Age 1", fair, worn);
    EXPECT(fair < 1.0, "Age 0.4: no dropouts");
    EXPECT(worn > 3.0 && worn < 20.0, "Age 1: the level dips by several dB here and there");
  }

  // The same audio whatever the host's block size (the control clock, the
  // note starts and the steal fades all count samples, not blocks).
  {
    auto session = [&](int block) {
      device.init(kRate);
      device.set_param(p::kAge, 0.8f);
      Stereo out;
      for (int n = 0; n < 20; ++n) {
        device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n % 10) * 3.0f / 12.0f), 0.7f);
        if (n == 12) device.set_param(p::kTape, static_cast<float>(kChoir));
        if (n == 15) device.set_param(p::kSpeed, 1.0f);
        if (n >= 3) device.note_off(n - 3);
        out = concat(out, render(device, 0.064f, kRate, block));
      }
      return out;
    };
    Stereo usual = session(128);
    double worst = 0.0;
    for (int block : {1, 32, 96, 2048}) {
      Stereo other = session(block);
      for (size_t i = 0; i < usual.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(usual.left[i]) - other.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(usual.right[i]) - other.right[i]));
      }
    }
    SHOW("block size: largest difference between 128-frame blocks and 1, 32, 96, 2048: %g", worst);
    EXPECT(worst < 1.0e-5, "the output does not depend on the block size");
  }


  // Cost with eight keys held on the heaviest tape (the choir has four
  // players a key) and on the default one.
  device.init(kRate);
  device.set_param(p::kTape, static_cast<float>(kChoir));
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("tape-orchestra (8 keys, choir)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("tape-orchestra (8 keys, strings)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("tape-orchestra");
}
