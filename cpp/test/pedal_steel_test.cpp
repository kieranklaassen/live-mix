// Native harness for Pedal Steel (cpp/devices/pedal-steel). The conformance
// pass covers silence before and after notes, a pile of keys, parameter abuse
// and other sample rates; the rest asserts what makes it a steel: the string
// (tuning, harmonic partials, a note that darkens as it rings), the pickup's
// comb, the volume pedal (swell and ride), and above all the gesture: an
// overlapping neighbour bends the sounding string with no new pick, the rest
// of the chord stands still, and one bar vibrato moves every string as one.

#include "../devices/pedal-steel/pedal_steel.h"

#include <complex>

#include "support/test_kit.h"

using namespace testkit;
using livemix::PedalSteel;
namespace p = livemix::pedal_steel;

static PedalSteel device;

static const float kRate = 48000.0f;

static char label[256];
// EXPECT with a printf-style message.
#define CHECK(condition, ...)                        \
  do {                                               \
    std::snprintf(label, sizeof label, __VA_ARGS__); \
    EXPECT(condition, label);                        \
  } while (0)

static float note_hz(float midi) { return livemix::kit::midi_to_hz(midi); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// A bare string: no swell, vibrato or bending in the way.
static void bare(PedalSteel& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kSwell, 0.0f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kRange, 0.0f);
}

// A hard pick by the bridge on the brightest amplifier, ringing long: every
// partial the instrument can make, for as long as it can.
static void bright(PedalSteel& d) {
  d.set_param(p::kPick, 1.0f);
  d.set_param(p::kTone, 6000.0f);
  d.set_param(p::kSustain, 40.0f);
}

// One voice that bends: no swell or vibrato, and a long ring unless a
// shorter one is asked for.
static void bending(PedalSteel& d, float glide_ms = 180.0f, float range = 2.0f, float sustain = 40.0f) {
  d.init(kRate);
  d.set_param(p::kSwell, 0.0f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kSustain, sustain);
  d.set_param(p::kGlide, glide_ms);
  d.set_param(p::kRange, range);
}

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

// The pitch of the component near `reference` as it moves: one reading per
// `hop` seconds between t0 and t1, each the turning of that component's
// phase from one Hann window (`window` seconds long) to the next. The
// window must be long enough to keep the neighbouring partials out.
static std::vector<double> pitch_track(const std::vector<float>& x, double reference, double t0, double t1,
                                       double hop, double window, double rate = kRate) {
  const size_t n = at(window, rate), step = at(hop, rate);
  std::vector<std::complex<double>> turns;
  for (size_t from = at(t0, rate); from + n <= x.size() && from < at(t1, rate); from += step) {
    std::complex<double> sum = 0.0;
    for (size_t i = 0; i < n; ++i) {
      const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
      sum += w * x[from + i] * std::polar(1.0, -2.0 * kPi * reference * static_cast<double>(from + i) / rate);
    }
    turns.push_back(sum);
  }
  std::vector<double> hz;
  for (size_t k = 0; k + 1 < turns.size(); ++k) {
    hz.push_back(reference +
                 std::arg(turns[k + 1] * std::conj(turns[k])) * rate / (2.0 * kPi * static_cast<double>(step)));
  }
  return hz;
}

// When a rising (or falling) track first passes `value`, in hops, between
// readings by a straight line. -1 when it never does.
static double crossing(const std::vector<double>& track, double value, bool rising) {
  for (size_t k = 0; k + 1 < track.size(); ++k) {
    const bool passed =
        rising ? (track[k] < value && track[k + 1] >= value) : (track[k] > value && track[k + 1] <= value);
    if (passed) return static_cast<double>(k) + (value - track[k]) / (track[k + 1] - track[k]);
  }
  return -1.0;
}

// Hann-windowed magnitude spectrum in dBFS (a full-scale sine reads 0 dB).
static std::vector<double> spectrum_db(const std::vector<float>& x, size_t from, int order) {
  const size_t n = static_cast<size_t>(1) << order;
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    a[i] = (0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n))) * x[from + i];
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> step = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w = 1.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= step;
      }
    }
  }
  std::vector<double> out(n / 2);
  for (size_t i = 0; i < n / 2; ++i) out[i] = db(std::abs(a[i]) * 4.0 / static_cast<double>(n));
  return out;
}

// The strongest bin of a spectrum between two frequencies, in dB.
static double strongest(const std::vector<double>& spectrum, double bin_hz, double from_hz, double to_hz) {
  double best = -300.0;
  for (size_t bin = static_cast<size_t>(from_hz / bin_hz); bin < spectrum.size() && bin * bin_hz <= to_hz; ++bin) {
    best = std::max(best, spectrum[bin]);
  }
  return best;
}

// Level in dB of `seconds` of signal from `t`.
static double level_db(const std::vector<float>& x, double t, double seconds, double rate = kRate) {
  return db(rms(x, at(t, rate), at(t + seconds, rate)));
}

// How sharp the signal's edges are between two moments: the loudest 5 ms of
// its second difference, in dB. A string keeps the edges its pick gave it
// for as long as its upper partials ring, so a new pick stands out of an old
// note by as much as that note has darkened: the tests that look for a pick
// use a short Sustain.
static double edge_db(const std::vector<float>& x, double t0, double t1) {
  double loudest = 0.0;
  const size_t n = at(0.005);
  for (size_t from = std::max(at(t0), static_cast<size_t>(2)); from + n <= std::min(at(t1), x.size());
       from += n / 2) {
    double sum = 0.0;
    for (size_t i = from; i < from + n; ++i) {
      const double d = static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2];
      sum += d * d;
    }
    loudest = std::max(loudest, std::sqrt(sum / static_cast<double>(n)));
  }
  return db(loudest);
}

// Share of the harmonics' energy that lies between two frequencies, in dB.
static double band_share_db(const std::vector<float>& x, double f0, double lo, double hi, double t0,
                            double seconds, double rate = kRate) {
  double in_band = 0.0, total = 0.0;
  for (int n = 1; n * f0 < 0.45 * rate; ++n) {
    const double level = bin_level(x, rate, n * f0, at(t0, rate), at(seconds, rate));
    total += level * level;
    if (n * f0 >= lo && n * f0 < hi) in_band += level * level;
  }
  return 10.0 * std::log10(std::max(in_band, 1.0e-30) / std::max(total, 1.0e-30));
}

// Partial `n` of a note, in dB, over one second from 0.1 s.
static double partial_db(const std::vector<float>& x, double f0, int n) {
  return db(bin_level(x, kRate, f0 * n, at(0.1), at(1.0)));
}

static void test_string();
static void test_pickup_and_amplifier();
static void test_volume_pedal();
static void test_levels_and_clicks();
static void test_bend();
static void test_vibrato();
static void test_moving_pitch_is_clean();
static void test_bookkeeping();

int main() {
  Conformance spec;
  spec.name = "pedal-steel";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 4.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_string();
  test_pickup_and_amplifier();
  test_volume_pedal();
  test_levels_and_clicks();
  test_bend();
  test_vibrato();
  test_moving_pitch_is_clean();
  test_bookkeeping();

  // Ten strings, the bar shaking, one of them bending.
  report_cost("pedal-steel (ten strings)", 4.0f, kRate, [] {
    device.init(kRate);
    device.set_param(p::kVibrato, 20.0f);
    for (int n = 0; n < 10; ++n) device.note_on(n, note_hz(40.0f + 5.0f * static_cast<float>(n)), 0.7f);
    render(device, 2.0f, kRate);
    device.note_on(10, note_hz(42.0f), 0.7f);
    render(device, 2.0f, kRate);
  });
  return finish("pedal-steel");
}

// --- the string ------------------------------------------------------------------------------

static void test_string() {
  // Tuning: C2 to C6 at the three sample rates.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double worst = 0.0;
    for (int midi = 36; midi <= 84; midi += 4) {
      bare(device, rate);
      device.note_on(1, note_hz(midi), 0.7f);
      Stereo out = render(device, 3.0f, rate);
      const double error =
          cents(fine_pitch(out.left, rate, note_hz(midi), at(0.5, rate), at(3.0, rate)), note_hz(midi));
      worst = std::max(worst, std::fabs(error));
    }
    std::printf("tuning at %.1f kHz, C2 to C6: worst %.2f cents\n", rate / 1000.0, worst);
    CHECK(worst < 3.0, "in tune within 3 cents from C2 to C6 at %.0f Hz (worst %.2f)", rate, worst);
  }
  // And wherever the knobs that shape the string and its tone stand.
  {
    double worst = 0.0;
    const int knobs[6] = {p::kTone, p::kTone, p::kSustain, p::kSustain, p::kPick, p::kPick};
    for (int corner = 0; corner < 6; ++corner) {
      for (int midi : {36, 60, 84}) {
        bare(device);
        const int knob = knobs[corner];
        device.set_param(knob, corner % 2 == 0 ? p::kParamMin[knob] : p::kParamMax[knob]);
        device.note_on(1, note_hz(midi), 0.7f);
        Stereo out = render(device, 2.0f, kRate);
        const double error = cents(fine_pitch(out.left, kRate, note_hz(midi), at(0.3), at(2.0)), note_hz(midi));
        worst = std::max(worst, std::fabs(error));
      }
    }
    std::printf("tuning at the ends of Tone, Sustain and Pick: worst %.2f cents\n", worst);
    CHECK(worst < 3.0, "tuning holds at the ends of Tone, Sustain and Pick (worst %.2f cents)", worst);
  }

  // The partials are harmonic: a steel string under a bar, no stiffness modelled.
  {
    bare(device);
    bright(device);
    device.note_on(1, 110.0f, 0.7f);
    Stereo out = render(device, 3.0f, kRate);
    const double f1 = fine_pitch(out.left, kRate, 110.0, at(0.5), at(3.0));
    double worst = 0.0;
    for (int n = 2; n <= 10; ++n) {
      const double hz = fine_pitch(out.left, kRate, n * f1, at(0.5), at(3.0));
      worst = std::max(worst, std::fabs(cents(hz, n * f1)));
    }
    std::printf("partials 2 to 10 of A2: worst %.2f cents from harmonic\n", worst);
    CHECK(worst < 3.0, "partials 2 to 10 are harmonic within 3 cents (worst %.2f)", worst);
  }

  // A note darkens as it rings: once the pedal has given all it has, the
  // fundamental dies in Sustain seconds, and a partial near 3 kHz falls away
  // from it some 35 dB a second faster (a fifth of the ring time).
  {
    bare(device);
    device.set_param(p::kSustain, 6.0f);
    device.set_param(p::kTone, 6000.0f);
    const double f0 = note_hz(55);  // G3
    device.note_on(1, static_cast<float>(f0), 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    const double late = db(bin_level(out.left, kRate, f0, at(2.5), at(0.5))) -
                        db(bin_level(out.left, kRate, f0, at(5.0), at(0.5)));
    const double ring = 60.0 * 2.5 / late;
    const auto colour = [&](double t) {
      return db(bin_level(out.left, kRate, 15.0 * f0, at(t), at(0.2))) -
             db(bin_level(out.left, kRate, f0, at(t), at(0.2)));
    };
    const double darkening = colour(0.2) - colour(1.2);
    std::printf("Sustain 6 s: the fundamental rings %.2f s; partial 15 falls %.1f dB/s faster\n", ring, darkening);
    EXPECT_NEAR(ring, 6.0, 0.9, "the fundamental rings for Sustain seconds once the pedal is fully open");
    CHECK(darkening > 20.0 && darkening < 50.0,
          "a partial near 3 kHz dies about 35 dB a second faster than the fundamental (%.1f)", darkening);
  }

  // Key up lays a hand on the string: 30 dB gone in half a second, and
  // nothing jumps when it lands.
  {
    bare(device);
    device.note_on(1, 220.0f, 0.8f);
    Stereo held = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 1.0f, kRate);
    const double drop = level_db(held.left, 0.9, 0.1) - level_db(tail.left, 0.5, 0.1);
    std::printf("release: %.1f dB down after 0.5 s\n", drop);
    CHECK(drop > 30.0, "a released note is 30 dB down in half a second (%.1f)", drop);
    CHECK(max_step(tail.left, 0, at(0.05)) < 1.2 * max_step(held.left, at(0.9), at(1.0)),
          "key up makes no click (step %.5f after, %.5f before)", max_step(tail.left, 0, at(0.05)),
          max_step(held.left, at(0.9), at(1.0)));
  }
}

// --- pickup, amplifier, speaker --------------------------------------------------------------

// A soft pick near the bridge on a bright amplifier: the softest pick keeps
// the pickup and the amplifier in their linear part, so a null stays a null.
static Stereo comb_note(float midi, float bend_to = 0.0f) {
  device.init(kRate);
  device.set_param(p::kSwell, 0.0f);
  device.set_param(p::kVibrato, 0.0f);
  device.set_param(p::kRange, bend_to > 0.0f ? 2.0f : 0.0f);
  device.set_param(p::kGlide, 20.0f);
  bright(device);
  device.note_on(1, note_hz(midi), 0.0f);
  if (bend_to > 0.0f) {
    render(device, 0.3f, kRate);
    device.note_on(2, note_hz(bend_to), 0.0f);
    render(device, 0.3f, kRate);
  }
  return render(device, 1.5f, kRate);
}

static void test_pickup_and_amplifier() {
  // Where the pickup sits: on the highest string of the E9 neck that keeps
  // the bar at the third fret or above, 1/15 of the open string from the bridge.
  EXPECT_NEAR(PedalSteel::pickup_fraction(50.0f), std::pow(2.0, 3.0 / 12.0) / 15.0, 1.0e-4,
              "D3 is the third fret of the B2 string");
  EXPECT_NEAR(PedalSteel::pickup_fraction(51.0f), std::pow(2.0, 4.0 / 12.0) / 15.0, 1.0e-4,
              "D#3 is the fourth fret of the B2 string");
  EXPECT_NEAR(PedalSteel::pickup_fraction(53.0f), std::pow(2.0, 3.0 / 12.0) / 15.0, 1.0e-4,
              "F3 is the third fret of the D3 string");
  EXPECT_NEAR(PedalSteel::pickup_fraction(75.0f), std::pow(2.0, 7.0 / 12.0) / 15.0, 1.0e-4,
              "D#5 is the seventh fret of the top string");
  EXPECT_NEAR(PedalSteel::pickup_fraction(36.0f), std::pow(2.0, 3.0 / 12.0) / 15.0, 1.0e-4,
              "below the neck a note is played as a third fret");
  EXPECT(PedalSteel::pickup_fraction(120.0f) <= 0.45f, "and the pickup never passes the middle of the string");

  // The comb: a partial with a node over the pickup is not heard. At the
  // fourth fret that is the 12th partial (12 x 2^(4/12) / 15 = 1.008).
  for (float midi : {51.0f, 70.0f}) {
    Stereo out = comb_note(midi);
    const double f0 = note_hz(midi);
    const double below = partial_db(out.left, f0, 11), null = partial_db(out.left, f0, 12),
                 above = partial_db(out.left, f0, 13);
    std::printf("pickup comb, note %.0f: partials 11, 12, 13 at %.1f, %.1f, %.1f dB\n", midi, below, null, above);
    CHECK(null < below && null < above && null < 0.5 * (below + above) - 12.0,
          "fourth fret, note %.0f: partial 12 lies over the pickup, 12 dB under the line through its neighbours "
          "(%.1f)",
          midi, 0.5 * (below + above) - null);
  }
  // At the seventh fret it is the 10th, up where the speaker is already
  // falling: it lies well under the line through its neighbours.
  {
    Stereo out = comb_note(75.0f);
    const double f0 = note_hz(75.0f);
    const double dip =
        0.5 * (partial_db(out.left, f0, 9) + partial_db(out.left, f0, 11)) - partial_db(out.left, f0, 10);
    std::printf("pickup comb, note 75: partial 10 is %.1f dB under the line through 9 and 11\n", dip);
    CHECK(dip > 6.0, "seventh fret: partial 10 lies over the pickup (%.1f dB under its neighbours' line)", dip);
  }
  // A pedal changes the string's tension, not its length: a string bent up a
  // tone keeps its null on the 12th partial, where the same note picked on
  // its own string (a third fret) has it between the 12th and the 13th.
  {
    Stereo bent = comb_note(51.0f, 53.0f);
    Stereo picked = comb_note(53.0f);
    const double f0 = note_hz(53.0f);
    const double bent_gap = partial_db(bent.left, f0, 13) - partial_db(bent.left, f0, 12);
    const double picked_gap = partial_db(picked.left, f0, 13) - partial_db(picked.left, f0, 12);
    std::printf("partial 13 over partial 12 at F3: %.1f dB bent up from D#3, %.1f dB picked\n", bent_gap,
                picked_gap);
    CHECK(bent_gap > 10.0, "a bent string keeps its pickup null where it was (partial 12 is %.1f dB under 13)",
          bent_gap);
    CHECK(picked_gap < 0.0, "and the same note picked has it elsewhere (%.1f dB)", picked_gap);
  }

  // Pick: from soft and over the neck to hard and by the bridge.
  {
    double share[2], top[2];
    for (int hard = 0; hard < 2; ++hard) {
      bare(device);
      device.set_param(p::kPick, static_cast<float>(hard));
      device.note_on(1, note_hz(52), 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      share[hard] = band_share_db(out.left, note_hz(52), 2000.0, 8000.0, 0.02, 0.3);
      top[hard] = level_db(out.left, 0.1, 0.4);
    }
    std::printf("Pick: energy above 2 kHz %.1f dB soft, %.1f dB hard; levels %.1f and %.1f dB\n", share[0],
                share[1], top[0], top[1]);
    CHECK(share[1] > share[0] + 8.0, "a hard pick by the bridge has 8 dB more above 2 kHz than a soft one (%.1f)",
          share[1] - share[0]);
    CHECK(std::fabs(top[1] - top[0]) < 3.0, "and is not a volume knob (%.1f and %.1f dB)", top[0], top[1]);
  }
  // A soft touch is darker as well as quieter.
  {
    double share[2], top[2];
    for (int loud = 0; loud < 2; ++loud) {
      bare(device);
      device.note_on(1, note_hz(52), loud ? 1.0f : 0.1f);
      Stereo out = render(device, 0.5f, kRate);
      share[loud] = band_share_db(out.left, note_hz(52), 2000.0, 8000.0, 0.02, 0.3);
      top[loud] = db(peak(out.left));
    }
    std::printf("touch: soft %.1f dB peak, %.1f dB above 2 kHz; hard %.1f dB, %.1f dB\n", top[0], share[0], top[1],
                share[1]);
    CHECK(top[1] > top[0] + 6.0, "a hard touch is at least 6 dB louder than a soft one (%.1f)", top[1] - top[0]);
    CHECK(share[1] > share[0] + 2.0, "and brighter (%.1f dB more above 2 kHz)", share[1] - share[0]);
  }

  // Tone moves the pickup's resonance: a peak of a few dB where it sits and
  // 12 dB an octave above it. The same pick twice, so the ratio is the filter.
  {
    double low[2], high[2];
    for (int bright = 0; bright < 2; ++bright) {
      bare(device);
      device.set_param(p::kTone, bright ? 6000.0f : 2000.0f);
      device.note_on(1, 500.0f, 0.3f);
      Stereo out = render(device, 1.0f, kRate);
      low[bright] = db(bin_level(out.left, kRate, 2000.0, at(0.1), at(0.5)));
      high[bright] = db(bin_level(out.left, kRate, 5500.0, at(0.1), at(0.5)));
    }
    std::printf("Tone at 2 kHz against 6 kHz: %+.1f dB at 2 kHz, %+.1f dB at 5.5 kHz\n", low[0] - low[1],
                high[0] - high[1]);
    CHECK(low[0] - low[1] > 1.5 && low[0] - low[1] < 5.5, "Tone lifts a few dB where it sits (%.1f dB at 2 kHz)",
          low[0] - low[1]);
    CHECK(high[0] - high[1] < -12.0, "and cuts above it (%.1f dB at 5.5 kHz)", high[0] - high[1]);
  }

  // The speaker: next to nothing above 10 kHz, however hard and bright.
  {
    bare(device);
    device.set_param(p::kPick, 1.0f);
    device.set_param(p::kTone, 6000.0f);
    device.note_on(1, 110.0f, 1.0f);
    Stereo out = render(device, 0.5f, kRate);
    const double share = band_share_db(out.left, 110.0, 10000.0, 21000.0, 0.0, 0.3);
    std::printf("speaker: energy above 10 kHz %.1f dB\n", share);
    CHECK(share < -40.0, "the speaker leaves under -40 dB above 10 kHz (%.1f)", share);
  }

  // Aliasing: the highest notes, hard and bright. Whatever is not a harmonic
  // of the note is a fold.
  for (float rate : {44100.0f, 48000.0f}) {
    for (int midi : {84, 96}) {
      bare(device, rate);
      bright(device);
      device.set_param(p::kVolume, 0.0f);
      device.note_on(1, note_hz(midi), 1.0f);
      Stereo out = render(device, 2.0f, rate);
      const double f0 = fine_pitch(out.left, rate, note_hz(midi), at(0.3, rate), at(1.5, rate));
      const std::vector<double> spectrum = spectrum_db(out.left, at(0.3, rate), 15);
      const double bin_hz = rate / 32768.0;
      double fold = -300.0, top = -300.0;
      for (size_t bin = static_cast<size_t>(60.0 / bin_hz); bin < spectrum.size(); ++bin) {
        const double hz = static_cast<double>(bin) * bin_hz;
        top = std::max(top, spectrum[bin]);
        if (std::fabs(hz - std::round(hz / f0) * f0) >= 30.0) fold = std::max(fold, spectrum[bin]);
      }
      std::printf("aliasing, note %d at %.1f kHz: %.1f dB under the strongest partial\n", midi, rate / 1000.0,
                  top - fold);
      CHECK(top - fold > 60.0, "note %d at %.0f Hz: folds are 60 dB under the strongest partial (%.1f)", midi,
            rate, top - fold);
    }
  }
}

// --- the volume pedal ------------------------------------------------------------------------

// The level of a note in 20 ms steps of 5 ms.
static std::vector<double> envelope(const std::vector<float>& x) {
  std::vector<double> out;
  for (size_t from = 0; from + at(0.02) <= x.size(); from += at(0.005))
    out.push_back(rms(x, from, from + at(0.02)));
  return out;
}

static void test_volume_pedal() {
  // Swell: the note comes in over Swell seconds (10 % to 90 %), and the pick
  // is not heard.
  for (float swell : {0.3f, 1.0f, 2.0f}) {
    bare(device);
    device.set_param(p::kSwell, swell);
    device.set_param(p::kSustain, 40.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    const std::vector<double> env = envelope(out.left);
    const double plateau = *std::max_element(env.begin(), env.end());
    const double rise = (crossing(env, 0.9 * plateau, true) - crossing(env, 0.1 * plateau, true)) * 0.005;
    const double pick = db(peak(out.left, 0, at(0.03))) - db(peak(out.left));
    std::printf("Swell %.1f s: rises in %.3f s, the first 30 ms peak %.1f dB under the note's\n", swell, rise,
                pick);
    EXPECT_NEAR(rise, swell, 0.2 * swell, "10 % to 90 % of the rise takes Swell seconds");
    CHECK(pick < -30.0, "Swell %.1f s hides the pick (%.1f dB)", swell, pick);
  }
  // At zero the pick is heard as it is.
  {
    bare(device);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    const double pick = db(peak(out.left, 0, at(0.03))) - db(peak(out.left));
    CHECK(pick > -3.0, "with Swell at zero the note is at its loudest in the first 30 ms (%.1f dB)", pick);
  }

  // Sustain. At its longest the note holds: 4 s after the peak it is within 6 dB.
  {
    device.init(kRate);
    device.set_param(p::kVibrato, 0.0f);
    device.set_param(p::kSustain, 40.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    const std::vector<double> env = envelope(out.left);
    const size_t top = static_cast<size_t>(std::max_element(env.begin(), env.end()) - env.begin());
    const double drop = db(env[top]) - db(env[top + 800]);
    std::printf("Sustain 40 s: peak at %.2f s, %.1f dB down 4 s later\n", top * 0.005, drop);
    CHECK(drop < 6.0, "at the longest Sustain a note is within 6 dB of its peak 4 s later (%.1f)", drop);
  }
  // At its shortest it is gone in 3 s.
  {
    bare(device);
    device.set_param(p::kSustain, 2.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 3.5f, kRate);
    const double drop = db(peak(out.left)) - db(peak(out.left, at(3.0), at(3.5)));
    std::printf("Sustain 2 s: %.1f dB down after 3 s\n", drop);
    CHECK(drop > 30.0, "at the shortest Sustain a note is 30 dB down after 3 s (%.1f)", drop);
  }
  // The ride: while the foot still has pedal left the note falls at well
  // under half the string's own rate (60 dB in Sustain seconds), and no more
  // than 12 dB is given in all.
  {
    bare(device);  // Sustain 14 s: the string alone loses 4.3 dB a second
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 10.0f, kRate);
    const auto fundamental = [&](double t) { return db(bin_level(out.left, kRate, 220.0, at(t), at(0.5))); };
    const double riding = (fundamental(0.5) - fundamental(3.0)) / 2.5;
    const double after = (fundamental(5.5) - fundamental(9.5)) / 4.0;
    const double given = (fundamental(5.5) + 60.0 / 14.0 * 5.0) - fundamental(0.5);
    std::printf("the ride at Sustain 14 s: %.2f dB/s while riding, %.2f dB/s after, %.1f dB given\n", riding,
                after, given);
    CHECK(riding > 0.6 && riding < 2.1, "the pedal makes good most of the string's decay (%.2f dB/s of 4.29)",
          riding);
    EXPECT_NEAR(after, 60.0 / 14.0, 0.15 * 60.0 / 14.0, "then the note dies at the string's own rate");
    CHECK(given > 8.5 && given < 12.5, "the pedal has 12 dB to give and no more (%.1f dB after the first second)",
          given);
  }
}

// --- levels, clicks, the output --------------------------------------------------------------

static void test_levels_and_clicks() {
  // One note at the default patch, C2 to C6.
  {
    double lo7 = 0.0, hi7 = -200.0, lo8 = 0.0, hi8 = -200.0, soft = -200.0;
    for (int midi = 36; midi <= 84; midi += 6) {
      for (float gain : {0.7f, 0.8f, 0.2f}) {
        device.init(kRate);
        device.note_on(1, note_hz(midi), gain);
        Stereo out = render(device, 6.0f, kRate);
        const double top = db(peak(out.left));
        if (gain == 0.7f) lo7 = std::min(lo7, top), hi7 = std::max(hi7, top);
        if (gain == 0.8f) lo8 = std::min(lo8, top), hi8 = std::max(hi8, top);
        if (gain == 0.2f) soft = std::max(soft, top);
      }
    }
    std::printf(
        "one note, C2 to C6: gain 0.7 peaks %.1f to %.1f dBFS, gain 0.8 %.1f to %.1f, gain 0.2 at most %.1f\n",
        lo7, hi7, lo8, hi8, soft);
    CHECK(lo7 > -24.0 && hi7 < -10.0, "one note at gain 0.7 peaks between -24 and -10 dBFS (%.1f to %.1f)", lo7,
          hi7);
    CHECK(lo8 > -22.0 && hi8 < -16.0, "one note at gain 0.8 peaks between -22 and -16 dBFS (%.1f to %.1f)", lo8,
          hi8);
    CHECK(soft < lo8 - 3.0, "a soft note is quieter than any loud one (%.1f dBFS)", soft);
  }
  // Ten held notes stay under the soft clip's knee; left and right are the
  // same signal, and it carries no DC.
  {
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, note_hz(40.0f + 4.0f * static_cast<float>(n)), 0.8f);
    Stereo out = render(device, 8.0f, kRate);
    std::printf("ten notes at gain 0.8: peak %.1f dBFS\n", db(peak(out.left)));
    CHECK(peak(out.left) < 0.5, "ten held notes stay under the clip knee (peak %.3f)", peak(out.left));
    EXPECT(out.left == out.right, "one pickup, one speaker: left and right are the same");
    CHECK(std::fabs(mean(out.left, at(1.0), at(8.0))) < 1.0e-4, "the output carries no DC (%.6f)",
          mean(out.left, at(1.0), at(8.0)));
  }

  // The eleventh note takes the quietest string, without a click: the old
  // note fades over 2 ms, the new one comes in under the swell.
  {
    device.init(kRate);
    device.set_param(p::kRange, 0.0f);
    device.set_param(p::kVibrato, 0.0f);
    for (int n = 0; n < 10; ++n) device.note_on(n, note_hz(48.0f + 3.0f * static_cast<float>(n)), 0.8f);
    Stereo before = render(device, 2.0f, kRate);
    device.note_on(10, note_hz(80.0f), 0.8f);
    Stereo after = render(device, 0.1f, kRate);
    const double steady = max_step(before.left, at(1.8), at(2.0));
    std::printf("stealing: step %.5f, steady %.5f\n", max_step(after.left), steady);
    CHECK(max_step(after.left) < 1.5 * steady, "stealing a string makes no click (step %.5f against %.5f)",
          max_step(after.left), steady);
    Stereo later = render(device, 3.0f, kRate);
    CHECK(bin_level(later.left, kRate, note_hz(80.0f), at(1.0), at(1.0)) > 0.003, "and the new note sounds (%.4f)",
          bin_level(later.left, kRate, note_hz(80.0f), at(1.0), at(1.0)));
  }
  // The same key again: its string is picked again after a 15 ms fade, not
  // stacked on itself.
  {
    device.init(kRate);
    device.set_param(p::kVibrato, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo before = render(device, 2.0f, kRate);
    device.note_on(1, 220.0f, 0.8f);
    Stereo after = render(device, 0.1f, kRate);
    const double steady = max_step(before.left, at(1.8), at(2.0));
    CHECK(max_step(after.left) < 1.5 * steady, "striking a held key again makes no click (step %.5f against %.5f)",
          max_step(after.left), steady);

    bare(device);
    device.note_on(1, 220.0f, 0.8f);
    Stereo first = render(device, 1.0f, kRate);
    device.note_on(1, 220.0f, 0.8f);
    Stereo second = render(device, 1.0f, kRate);
    const double rise = db(peak(second.left)) - db(peak(first.left));
    std::printf("the same key again: second peak %+.1f dB against the first\n", rise);
    CHECK(std::fabs(rise) < 3.0, "the second pick is as loud as the first, not piled on it (%+.1f dB)", rise);
  }
  // A struck note always sounds, however short. A key that goes up while its
  // string is still fading for the pick (15 ms after a second strike, 2 ms
  // on a stolen string) is picked all the same and then damped, like the
  // same short note on a free string.
  {
    const double hz = note_hz(80.0f);
    const auto heard = [&](const Stereo& out) { return db(bin_level(out.left, kRate, hz, at(0.03), at(0.1))); };
    device.init(kRate);
    device.set_param(p::kSwell, 0.0f);
    device.set_param(p::kVibrato, 0.0f);
    device.set_param(p::kRange, 0.0f);
    device.note_on(10, static_cast<float>(hz), 0.8f);
    device.note_off(10);
    const double free_string = heard(render(device, 0.2f, kRate));

    device.init(kRate);
    device.set_param(p::kSwell, 0.0f);
    device.set_param(p::kVibrato, 0.0f);
    device.set_param(p::kRange, 0.0f);
    for (int n = 0; n < 10; ++n) device.note_on(n, note_hz(48.0f + 3.0f * static_cast<float>(n)), 0.8f);
    render(device, 2.0f, kRate);
    device.note_on(10, static_cast<float>(hz), 0.8f);
    render(device, 0.0005f, kRate);
    device.note_off(10);
    const double stolen = heard(render(device, 0.2f, kRate));

    bare(device);
    device.note_on(1, static_cast<float>(hz), 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(1, static_cast<float>(hz), 0.8f);
    render(device, 0.005f, kRate);
    device.note_off(1);
    Stereo again = render(device, 0.8f, kRate);
    const double restruck = heard(again);
    const double damped = level_db(again.left, 0.02, 0.1) - level_db(again.left, 0.6, 0.1);
    std::printf("a key let go before its pick: %.1f dB on a stolen string, %.1f dB struck again, %.1f dB on a free "
                "one; %.1f dB down half a second on\n",
                stolen, restruck, free_string, damped);
    CHECK(std::fabs(stolen - free_string) < 6.0,
          "a note let go 0.5 ms after it stole a string still sounds (%.1f dB against %.1f on a free string)", stolen,
          free_string);
    CHECK(std::fabs(restruck - free_string) < 6.0,
          "a key struck again and let go 5 ms later is still picked (%.1f dB against %.1f on a free string)",
          restruck, free_string);
    CHECK(damped > 30.0, "and then damped (%.1f dB down half a second on)", damped);
  }
  // Tone and Volume move without a click.
  {
    device.init(kRate);
    device.set_param(p::kVibrato, 0.0f);
    device.set_param(p::kTone, 1500.0f);
    for (int n = 0; n < 3; ++n) device.note_on(n, note_hz(52.0f + 7.0f * static_cast<float>(n)), 0.8f);
    Stereo before = render(device, 1.5f, kRate);
    device.set_param(p::kTone, 6000.0f);
    Stereo sweep = render(device, 0.2f, kRate);
    Stereo bright = render(device, 0.2f, kRate);
    const double bound = std::max(max_step(before.left, at(1.3), at(1.5)), max_step(bright.left));
    std::printf("Tone sweep: step %.5f, steady %.5f\n", max_step(sweep.left), bound);
    CHECK(max_step(sweep.left) < 1.5 * bound, "a Tone jump makes no click (step %.5f against %.5f)",
          max_step(sweep.left), bound);
    device.set_param(p::kVolume, -40.0f);
    Stereo quiet = render(device, 0.1f, kRate);
    CHECK(max_step(quiet.left) < 1.2 * max_step(bright.left),
          "a Volume jump makes no click (step %.5f against %.5f)", max_step(quiet.left), max_step(bright.left));
  }
}

// --- the bend --------------------------------------------------------------------------------

static const float kC4 = 261.626f, kD4 = 293.665f, kE4 = 329.628f, kG4 = 391.995f;

// The largest fall (or rise, for a falling track) from one reading to the next.
static double worst_backstep(const std::vector<double>& track, bool rising) {
  double worst = 0.0;
  for (size_t k = 0; k + 1 < track.size(); ++k) {
    worst = std::max(worst, rising ? track[k] - track[k + 1] : track[k + 1] - track[k]);
  }
  return worst;
}

// The loudest and quietest 20 ms between two moments, against `reference` dB.
static void level_swing(const std::vector<float>& x, double t0, double t1, double reference, double* lowest,
                        double* highest) {
  *lowest = 200.0;
  *highest = -200.0;
  for (double t = t0; t + 0.02 <= t1; t += 0.01) {
    const double level = level_db(x, t, 0.02) - reference;
    *lowest = std::min(*lowest, level);
    *highest = std::max(*highest, level);
  }
}

static void test_bend() {
  // Hold C4 and add D4 over it: the string that is sounding bends up a tone.
  // Its pitch climbs without a step back, takes Glide (10 % to 90 %), lands
  // in tune, and nothing is picked: no edge, no dip.
  for (float glide : {100.0f, 180.0f, 400.0f, 800.0f}) {
    bending(device, glide);
    device.note_on(1, kC4, 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    device.note_on(2, kD4, 0.8f);
    const float settle = std::max(1.5f, 0.005f * glide);
    out = concat(out, render(device, settle + 0.6f, kRate));

    std::vector<double> track = pitch_track(out.left, std::sqrt(kC4 * kD4), 0.8, 1.0 + settle, 0.005, 0.03);
    for (double& hz : track) hz = cents(hz, kC4);
    const double took = (crossing(track, 180.0, true) - crossing(track, 20.0, true)) * 5.0;
    const double landed = cents(fine_pitch(out.left, kRate, kD4, at(1.0 + settle), at(1.6 + settle)), kD4);
    const double backstep = worst_backstep(track, true);
    std::printf("bend C4 to D4, Glide %.0f ms: takes %.0f ms, lands %+.2f cents off, worst step back %.2f cents\n",
                glide, took, landed, backstep);
    EXPECT_NEAR(took, glide, 0.2 * glide, "10 % to 90 % of a bend takes Glide");
    CHECK(std::fabs(landed) < 3.0, "the bend lands on D4 within 3 cents (%+.2f)", landed);
    CHECK(std::fabs(track.front()) < 3.0, "and started on C4 (%+.2f cents)", track.front());
    CHECK(backstep < 1.0, "the pitch climbs all the way (worst step back %.2f cents)", backstep);

    if (glide == 180.0f) {
      const double edge = edge_db(out.left, 1.0, 1.15) - edge_db(out.left, 0.85, 1.0);
      const double left = db(bin_level(out.left, kRate, kC4, at(2.0), at(0.5))) -
                          db(bin_level(out.left, kRate, kD4, at(2.0), at(0.5)));
      double lowest, highest;
      level_swing(out.left, 1.0, 2.0, level_db(out.left, 0.9, 0.1), &lowest, &highest);
      std::printf(
          "  no pick: edges %+.1f dB against before, level between %+.1f and %+.1f dB, %.1f dB left at C4\n", edge,
          lowest, highest, left);
      CHECK(edge < 3.0, "a bend picks nothing: no new edge in the sound (%+.1f dB)", edge);
      CHECK(lowest > -3.0 && highest < 3.0, "and the level neither dips nor jumps (%+.1f to %+.1f dB)", lowest,
            highest);
      CHECK(left < -30.0, "it is one string: nothing stays at C4 (%.1f dB)", left);

      // Let D4 go with C4 still down: the pedal comes up and the string returns.
      device.note_off(2);
      Stereo back = render(device, 2.0f, kRate);
      std::vector<double> down = pitch_track(back.left, std::sqrt(kC4 * kD4), 0.0, 1.4, 0.005, 0.03);
      for (double& hz : down) hz = cents(hz, kC4);
      const double returned = cents(fine_pitch(back.left, kRate, kC4, at(1.4), at(2.0)), kC4);
      const double fell = (crossing(down, 20.0, false) - crossing(down, 180.0, false)) * 5.0;
      std::printf("  return bend: takes %.0f ms, lands %+.2f cents off C4\n", fell, returned);
      CHECK(std::fabs(returned) < 3.0, "releasing D4 returns the string to C4 within 3 cents (%+.2f)", returned);
      EXPECT_NEAR(fell, glide, 0.2 * glide, "the return takes Glide too");
      CHECK(worst_backstep(down, false) < 1.0, "and falls all the way (worst step back %.2f cents)",
            worst_backstep(down, false));
      CHECK(edge_db(back.left, 0.0, 0.15) - edge_db(out.left, 2.4, 2.55) < 3.0, "with no pick (%+.1f dB)",
            edge_db(back.left, 0.0, 0.15) - edge_db(out.left, 2.4, 2.55));
    }
  }

  // The same two keys on a note that has darkened (Sustain 6 s), bent and
  // then with Range at zero, where D4 is picked on a string of its own: the
  // pick is what the bend does not have.
  {
    double edge[2], c = 0.0, d = 0.0;
    for (int picked = 0; picked < 2; ++picked) {
      bending(device, 180.0f, picked ? 0.0f : 2.0f, 6.0f);
      device.note_on(1, kC4, 0.8f);
      Stereo out = render(device, 1.0f, kRate);
      device.note_on(2, kD4, 0.8f);
      out = concat(out, render(device, 1.0f, kRate));
      edge[picked] = edge_db(out.left, 1.0, 1.15) - edge_db(out.left, 0.85, 1.0);
      c = db(bin_level(out.left, kRate, kC4, at(1.4), at(0.5)));
      d = db(bin_level(out.left, kRate, kD4, at(1.4), at(0.5)));
    }
    std::printf(
        "on a darkened note: a bend's edges %+.1f dB, a pick's %+.1f dB; picked, C4 at %.1f dB and D4 at %.1f "
        "dB\n",
        edge[0], edge[1], c, d);
    CHECK(edge[0] < 3.0, "a bend on a darkened note still shows no edge (%+.1f dB)", edge[0]);
    CHECK(edge[1] > 15.0, "with Range at zero the second note is picked (%+.1f dB of edge)", edge[1]);
    CHECK(std::fabs(c - d) < 10.0, "and both strings sound (%.1f and %.1f dB)", c, d);
  }

  // A bend does not start the swell again.
  {
    bending(device);
    device.set_param(p::kSwell, 1.0f);
    device.note_on(1, kC4, 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    device.note_on(2, kD4, 0.8f);
    out = concat(out, render(device, 1.0f, kRate));
    double lowest, highest;
    level_swing(out.left, 3.0, 4.0, level_db(out.left, 2.9, 0.1), &lowest, &highest);
    CHECK(lowest > -3.0, "a bent note keeps its swell (the level dips %.1f dB)", lowest);
  }

  // Let go of the older key: the string stays where it was bent to, held by
  // the newer one, and is released with it.
  {
    bending(device);
    device.note_on(1, kC4, 0.8f);
    render(device, 0.5f, kRate);
    device.note_on(2, kD4, 0.8f);
    Stereo before = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo held = render(device, 1.0f, kRate);
    const double stayed = cents(fine_pitch(held.left, kRate, kD4, at(0.1), at(1.0)), kD4);
    const double level = level_db(held.left, 0.5, 0.1) - level_db(before.left, 0.9, 0.1);
    CHECK(std::fabs(stayed) < 3.0, "releasing the older key leaves the string on D4 (%+.2f cents)", stayed);
    CHECK(level > -3.0, "still held (%+.1f dB)", level);
    device.note_off(2);
    Stereo tail = render(device, 1.0f, kRate);
    CHECK(level_db(tail.left, 0.5, 0.1) < level_db(held.left, 0.9, 0.1) - 30.0,
          "until the newer key goes too (%.1f dB)", level_db(tail.left, 0.5, 0.1) - level_db(held.left, 0.9, 0.1));
  }

  // One voice of a chord bends and the others stand still: within 2 cents
  // while it goes up and while it comes back.
  {
    bending(device);
    const double low = 110.0, high = 400.0;
    device.note_on(1, static_cast<float>(low), 0.8f);
    device.note_on(2, kC4, 0.8f);
    device.note_on(3, static_cast<float>(high), 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    device.note_on(4, kD4, 0.8f);
    out = concat(out, render(device, 1.0f, kRate));
    const double bent = db(bin_level(out.left, kRate, kD4, at(1.5), at(0.5))) -
                        db(bin_level(out.left, kRate, kC4, at(1.5), at(0.5)));
    device.note_off(4);
    out = concat(out, render(device, 1.0f, kRate));
    double worst = 0.0;
    for (double hz : {low, high}) {
      const double centre = fine_pitch(out.left, kRate, hz, at(0.3), at(1.0));
      for (double reading : pitch_track(out.left, hz, 0.5, 2.8, 0.02, 0.12)) {
        worst = std::max(worst, std::fabs(cents(reading, centre)));
      }
    }
    std::printf("a bend inside a chord: the other strings move at most %.2f cents\n", worst);
    CHECK(bent > 20.0, "the C4 string went to D4 (%.1f dB more at D4)", bent);
    CHECK(worst < 2.0, "the rest of the chord stands still within 2 cents (%.2f)", worst);
  }

  // Between two held notes as near as each other, the lower string is raised.
  {
    bending(device);
    device.note_on(1, kC4, 0.8f);
    device.note_on(2, kE4, 0.8f);
    render(device, 0.5f, kRate);
    device.note_on(3, kD4, 0.8f);
    Stereo out = render(device, 1.5f, kRate);
    const double c = db(bin_level(out.left, kRate, kC4, at(0.8), at(0.5))),
                 d = db(bin_level(out.left, kRate, kD4, at(0.8), at(0.5))),
                 e = db(bin_level(out.left, kRate, kE4, at(0.8), at(0.5)));
    CHECK(c < d - 20.0 && std::fabs(e - d) < 10.0,
          "D4 between held C4 and E4 raises the C4 string (C %.1f, D %.1f, E %.1f dB)", c, d, e);
  }

  // Two neighbours struck together are a chord, each on its own string;
  // only a note that comes in over one already ringing bends it.
  for (float gap : {0.0f, 0.02f, 0.1f}) {
    bending(device);
    device.note_on(1, kC4, 0.8f);
    if (gap > 0.0f) render(device, gap, kRate);
    device.note_on(2, kD4, 0.8f);
    Stereo out = render(device, 1.5f, kRate);
    const double c = db(bin_level(out.left, kRate, kC4, at(0.8), at(0.5))),
                 d = db(bin_level(out.left, kRate, kD4, at(0.8), at(0.5)));
    if (gap < 0.05f) {
      CHECK(std::fabs(c - d) < 10.0, "C4 and D4 struck %.0f ms apart are two strings (%.1f and %.1f dB)",
            1000.0 * gap, c, d);
    } else {
      CHECK(c < d - 30.0, "C4 and D4 %.0f ms apart are one string, bent (%.1f dB at C4, %.1f dB at D4)",
            1000.0 * gap, c, d);
    }
  }

  // So are two keys struck together over a note that is already ringing: the
  // first bends its string, and the second, landing in the same moment, is
  // picked on a string of its own instead of bending the same one again.
  for (float range : {2.0f, 12.0f}) {
    bending(device, 180.0f, range);
    device.note_on(1, kC4, 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(2, kD4, 0.8f);
    device.note_on(3, kE4, 0.8f);
    Stereo out = render(device, 1.5f, kRate);
    const double c = db(bin_level(out.left, kRate, kC4, at(0.8), at(0.5))),
                 d = db(bin_level(out.left, kRate, kD4, at(0.8), at(0.5))),
                 e = db(bin_level(out.left, kRate, kE4, at(0.8), at(0.5)));
    std::printf("Range %.0f, D4 and E4 struck together over a held C4: C %.1f, D %.1f, E %.1f dB\n", range, c, d, e);
    CHECK(std::fabs(d - e) < 10.0 && c < d - 30.0,
          "Range %.0f: D4 and E4 struck over a held C4 both sound, one bent and one picked (C %.1f, D %.1f, E %.1f "
          "dB)",
          range, c, d, e);
  }

  // Further away than Range, a note is picked on its own string.
  {
    bending(device, 180.0f, 2.0f, 6.0f);
    device.note_on(1, kC4, 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    device.note_on(2, kG4, 0.8f);
    out = concat(out, render(device, 1.0f, kRate));
    const double edge = edge_db(out.left, 1.0, 1.15) - edge_db(out.left, 0.85, 1.0);
    const double stayed = cents(fine_pitch(out.left, kRate, kC4, at(1.2), at(2.0)), kC4);
    const double c = db(bin_level(out.left, kRate, kC4, at(1.4), at(0.5))),
                 g = db(bin_level(out.left, kRate, kG4, at(1.4), at(0.5)));
    CHECK(edge > 15.0, "a fifth away is picked, not bent to (%+.1f dB of edge)", edge);
    CHECK(std::fabs(stayed) < 2.0 && std::fabs(c - g) < 10.0, "and C4 stays (%+.2f cents; C %.1f dB, G %.1f dB)",
          stayed, c, g);
  }
  // So is a note played after the first was let go: no overlap, no bend.
  {
    bending(device, 180.0f, 2.0f, 6.0f);
    device.note_on(1, kC4, 0.8f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo out = render(device, 0.4f, kRate);
    device.note_on(2, kD4, 0.8f);
    out = concat(out, render(device, 0.6f, kRate));
    const double edge = edge_db(out.left, 0.4, 0.55) - edge_db(out.left, 0.25, 0.4);
    double worst = 0.0;
    for (double reading : pitch_track(out.left, kD4, 0.43, 0.6, 0.005, 0.02)) {
      worst = std::max(worst, std::fabs(cents(reading, kD4)));
    }
    CHECK(edge > 15.0, "a note after a release is picked (%+.1f dB of edge)", edge);
    CHECK(worst < 5.0, "and is on its pitch at once, with no glide from the old one (%.2f cents)", worst);
  }

  // Range at twelve: an octave is one slide of one string.
  {
    bending(device, 220.0f, 12.0f);
    device.note_on(1, kC4, 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    device.note_on(2, 2.0f * kC4, 0.8f);
    out = concat(out, render(device, 2.0f, kRate));
    const double landed = cents(fine_pitch(out.left, kRate, 2.0 * kC4, at(2.2), at(3.0)), 2.0 * kC4);
    const double edge = edge_db(out.left, 1.0, 1.1) - edge_db(out.left, 0.9, 1.0);
    const double left = db(bin_level(out.left, kRate, kC4, at(2.2), at(0.5))) -
                        db(bin_level(out.left, kRate, 2.0 * kC4, at(2.2), at(0.5)));
    std::printf("an octave slide: lands %+.2f cents off, edges %+.1f dB, %.1f dB left at C4\n", landed, edge,
                left);
    CHECK(std::fabs(landed) < 3.0, "an octave slide lands in tune (%+.2f cents)", landed);
    CHECK(edge < 6.0, "with no pick (%+.1f dB)", edge);
    CHECK(left < -30.0, "and nothing stays behind at C4 (%.1f dB)", left);
  }
}

// --- the bar's vibrato -----------------------------------------------------------------------

static void test_vibrato() {
  // Three strings with no partial of one near the fundamental of another.
  const double notes[3] = {233.08, 349.23, 587.33};
  device.init(kRate);
  device.set_param(p::kSwell, 0.0f);
  device.set_param(p::kSustain, 40.0f);
  device.set_param(p::kVibrato, 20.0f);
  device.set_param(p::kRate, 5.0f);
  for (int n = 0; n < 3; ++n) device.note_on(n, static_cast<float>(notes[n]), 0.8f);
  Stereo out = render(device, 5.0f, kRate);
  device.note_on(3, 880.0f, 0.8f);  // a fourth string is picked at 5 s
  out = concat(out, render(device, 4.0f, kRate));

  // Each string's pitch in cents, 100 readings a second; reading k is at
  // 0.075 + k / 100 seconds.
  std::vector<float> track[3];
  for (int n = 0; n < 3; ++n) {
    for (double hz : pitch_track(out.left, notes[n], 0.05, 8.9, 0.01, 0.04)) {
      track[n].push_back(static_cast<float>(cents(hz, notes[n])));
    }
  }
  const auto index = [](double t) { return static_cast<size_t>((t - 0.075) * 100.0 + 0.5); };
  const auto swing = [&](int n, double t0, double t1, double* centre) {
    float lo = 1.0e9f, hi = -1.0e9f;
    for (size_t k = index(t0); k < index(t1); ++k) lo = std::min(lo, track[n][k]), hi = std::max(hi, track[n][k]);
    if (centre) *centre = 0.5 * (hi + lo);
    return 0.5 * (hi - lo);
  };
  const auto largest = [&](int n, double t0, double t1) {
    float worst = 0.0f;
    for (size_t k = index(t0); k < index(t1); ++k) worst = std::max(worst, std::fabs(track[n][k]));
    return static_cast<double>(worst);
  };

  double phase[3];
  for (int n = 0; n < 3; ++n) {
    double centre = 0.0;
    const double depth = swing(n, 2.5, 4.5, &centre);
    std::vector<float> steady(track[n].begin() + static_cast<long>(index(2.5)),
                              track[n].begin() + static_cast<long>(index(4.5)));
    for (float& v : steady) v -= static_cast<float>(centre);
    const double rate = dominant_frequency(steady, 100.0, 3.0, 7.0);
    phase[n] = tone_phase(track[n], 5.0, 100.0, index(2.5), index(4.5));
    const double early = largest(n, 0.12, 0.33), stilled = largest(n, 5.17, 5.33);
    std::printf(
        "vibrato on %.0f Hz: %.2f cents at %.2f Hz around %+.2f cents; %.2f cents early, %.2f after a new pick\n",
        notes[n], depth, rate, centre, early, stilled);
    EXPECT_NEAR(depth, 20.0, 3.0, "the vibrato is as deep as the Vibrato knob says");
    EXPECT_NEAR(rate, 5.0, 0.2, "and as fast as the Rate knob says");
    CHECK(std::fabs(centre) < 1.5, "around the note itself (%+.2f cents)", centre);
    CHECK(early < 2.0, "a picked note starts still (%.2f cents in its first third of a second)", early);
    CHECK(stilled < 2.0, "and a new pick stills the bar under every string (%.2f cents)", stilled);
  }
  // One bar: the three move as one.
  for (int n = 1; n < 3; ++n) {
    const double together = correlation(track[0], track[n], index(2.5), index(4.5));
    double apart = std::fabs(phase[n] - phase[0]) * 180.0 / kPi;
    if (apart > 180.0) apart = 360.0 - apart;
    std::printf("strings 1 and %d: pitch tracks correlate %.4f, %.1f degrees apart\n", n + 1, together, apart);
    CHECK(together > 0.95, "strings 1 and %d share the vibrato (correlation %.4f)", n + 1, together);
    CHECK(apart < 20.0, "in phase (%.1f degrees)", apart);
  }
  // The bar's phase runs on through the pick: when the vibrato returns it is
  // where it would have been.
  {
    double jump = std::fabs(tone_phase(track[0], 5.0, 100.0, index(7.5), index(8.7)) - phase[0]) * 180.0 / kPi;
    if (jump > 180.0) jump = 360.0 - jump;
    const double depth = swing(0, 7.5, 8.7, nullptr);
    std::printf(
        "after the fourth pick the vibrato is back at %.2f cents, %.1f degrees from where it would have been\n",
        depth, jump);
    CHECK(depth > 17.0, "the vibrato comes back after a pick (%.2f cents)", depth);
    CHECK(jump < 20.0, "and a note does not reset its phase (%.1f degrees)", jump);
  }
  // Vibrato at zero is none.
  {
    bare(device);
    device.set_param(p::kSustain, 40.0f);
    device.note_on(1, 349.23f, 0.8f);
    Stereo still = render(device, 3.0f, kRate);
    double worst = 0.0;
    for (double hz : pitch_track(still.left, 349.23, 1.0, 2.9, 0.01, 0.04))
      worst = std::max(worst, std::fabs(cents(hz, 349.23)));
    CHECK(worst < 1.0, "with Vibrato at zero the pitch stands still (%.2f cents)", worst);
  }
}

// --- moving pitch is clean -------------------------------------------------------------------

static void test_moving_pitch_is_clean() {
  // No step in the waveform, however fast or slow the string moves.
  struct Move {
    float glide, range, from, to, seconds;
  };
  for (const Move& move : {Move{20.0f, 12.0f, 48.0f, 60.0f, 0.1f}, Move{400.0f, 2.0f, 60.0f, 62.0f, 0.8f}}) {
    bending(device, move.glide, move.range);
    device.note_on(1, note_hz(move.from), 0.8f);
    Stereo before = render(device, 1.0f, kRate);
    device.note_on(2, note_hz(move.to), 0.8f);
    Stereo moving = render(device, move.seconds, kRate);
    Stereo after = render(device, 0.2f, kRate);
    const double bound = std::max(max_step(before.left, at(0.8), at(1.0)), max_step(after.left));
    std::printf("bend of %.0f semitones in %.0f ms: step %.5f, the notes' own %.5f\n", move.to - move.from,
                move.glide, max_step(moving.left), bound);
    CHECK(max_step(moving.left) < 1.5 * bound, "a %.0f ms bend makes no step (%.5f against %.5f)", move.glide,
          max_step(moving.left), bound);
  }

  // No zipper. The pitch is worked out once per control tick (3 kHz, or
  // 2756 Hz at 44.1 kHz), so anything that tick left in the sound would
  // stand that far from each partial. The note is tuned so those places fall
  // half-way between its harmonics.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    const double tick = rate / (rate > 60000.0f ? 32.0 : 16.0);
    const double f0 = tick / 6.5;
    const double bin_hz = rate / 32768.0;

    // Under the deepest, fastest vibrato.
    device.init(rate);
    device.set_param(p::kSwell, 0.0f);
    device.set_param(p::kRange, 0.0f);
    device.set_param(p::kVibrato, 40.0f);
    device.set_param(p::kRate, 7.0f);
    bright(device);
    device.note_on(1, static_cast<float>(f0), 0.8f);
    Stereo shaken = render(device, 3.0f, rate);
    std::vector<double> spectrum = spectrum_db(shaken.left, at(1.5, rate), 15);
    double vibrato = -300.0;
    for (int n = 1; n <= 4; ++n) {
      vibrato = std::max(vibrato, strongest(spectrum, bin_hz, n * f0 + tick - 60.0, n * f0 + tick + 60.0));
    }
    vibrato -= strongest(spectrum, bin_hz, 60.0, 0.45 * rate);

    // And during a slow glide of a little over half a semitone.
    const double f1 = f0 * std::pow(2.0, 0.6 / 12.0);
    device.init(rate);
    device.set_param(p::kSwell, 0.0f);
    device.set_param(p::kVibrato, 0.0f);
    device.set_param(p::kGlide, 800.0f);
    bright(device);
    device.note_on(1, static_cast<float>(f0), 0.8f);
    render(device, 1.0f, rate);
    device.note_on(2, static_cast<float>(f1), 0.8f);
    Stereo gliding = render(device, 1.0f, rate);
    spectrum = spectrum_db(gliding.left, at(0.1, rate), 15);
    double glide = -300.0;
    for (int n = 1; n <= 3; ++n) {
      glide = std::max(glide, strongest(spectrum, bin_hz, n * f0 + tick - 30.0, n * f1 + tick + 30.0));
    }
    glide -= strongest(spectrum, bin_hz, 60.0, 0.45 * rate);

    std::printf(
        "zipper at %.1f kHz: %.1f dB under vibrato, %.1f dB during a glide (against the strongest partial)\n",
        rate / 1000.0, vibrato, glide);
    CHECK(vibrato < -60.0, "vibrato leaves no zipper at %.0f Hz (%.1f dB)", rate, vibrato);
    CHECK(glide < -60.0, "a glide leaves no zipper at %.0f Hz (%.1f dB)", rate, glide);
  }
}

// --- keys and voices -------------------------------------------------------------------------

// A phrase with every kind of event in it, rendered in blocks of `block`.
static Stereo phrase(int block) {
  device.init(kRate);
  device.note_on(1, kC4, 0.8f);
  device.note_on(2, kG4, 0.7f);
  Stereo out = render(device, 0.25f, kRate, block);
  device.note_on(3, kD4, 0.8f);  // bends the C4 string
  out = concat(out, render(device, 0.25f, kRate, block));
  device.note_off(3);
  out = concat(out, render(device, 0.25f, kRate, block));
  device.note_on(2, kG4, 0.9f);  // the same key again
  out = concat(out, render(device, 0.25f, kRate, block));
  device.note_off(1);
  device.note_off(2);
  return concat(out, render(device, 0.25f, kRate, block));
}

static void test_bookkeeping() {
  // A string follows the keys that claim it, newest first, and remembers
  // four of them: walk up five whole tones, then let go from the top.
  {
    bending(device, 50.0f);
    for (int n = 0; n < 6; ++n) {
      device.note_on(n, note_hz(60.0f + 2.0f * static_cast<float>(n)), 0.8f);
      render(device, 0.3f, kRate);
    }
    double worst = 0.0;
    for (int n = 5; n >= 2; --n) {
      Stereo out = render(device, 0.6f, kRate);
      const double hz = note_hz(60.0f + 2.0f * static_cast<float>(n));
      worst = std::max(worst, std::fabs(cents(fine_pitch(out.left, kRate, hz, at(0.3), at(0.6)), hz)));
      if (n == 5) {
        const double left = db(bin_level(out.left, kRate, kC4, at(0.3), at(0.3))) -
                            db(bin_level(out.left, kRate, hz, at(0.3), at(0.3)));
        CHECK(left < -30.0, "five bends in a row are still one string (%.1f dB left at C4)", left);
      }
      if (n == 2) {
        device.note_off(0);  // forgotten keys: nothing happens
        device.note_off(1);
        Stereo same = render(device, 0.4f, kRate);
        worst = std::max(worst, std::fabs(cents(fine_pitch(same.left, kRate, hz, at(0.1), at(0.4)), hz)));
      }
      device.note_off(n);
    }
    Stereo tail = render(device, 1.0f, kRate);
    std::printf("a string walked up five tones and let go key by key: worst %.2f cents off\n", worst);
    CHECK(worst < 3.0, "each release bends the string back to the key before (worst %.2f cents)", worst);
    CHECK(level_db(tail.left, 0.6, 0.1) < -60.0, "and the last release lets it go (%.1f dB)",
          level_db(tail.left, 0.6, 0.1));
  }

  // The host's block size is not heard: the same phrase one sample at a
  // time, in odd blocks and in the largest block is the same audio.
  {
    const Stereo reference = phrase(128);
    for (int block : {1, 100, 2048}) {
      const Stereo other = phrase(block);
      double worst = 0.0;
      for (size_t i = 0; i < reference.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(reference.left[i]) - other.left[i]));
      }
      CHECK(worst == 0.0, "blocks of %d frames give the same audio as blocks of 128 (max diff %g)", block, worst);
    }
    // And after it has slept, whenever the sleep began. (Not to the bit: the
    // speaker's filters wake from a different whisper under the idle floor,
    // and float rounding carries that at about -100 dB.)
    Stereo woken[2];
    for (int which = 0; which < 2; ++which) {
      const int block = which == 0 ? 128 : 1000;
      phrase(block);
      render(device, 4.0f, kRate, block);
      device.note_on(5, kE4, 0.8f);
      woken[which] = render(device, 0.5f, kRate, block);
    }
    double worst = 0.0;
    for (size_t i = 0; i < woken[0].size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(woken[0].left[i]) - woken[1].left[i]));
    }
    CHECK(rms(woken[0].left) > 1.0e-3 && worst < 1.0e-4,
          "a note after a sleep does not depend on the block size (max diff %g)", worst);
  }
}
