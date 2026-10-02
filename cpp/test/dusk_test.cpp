// Native harness for Dusk (cpp/devices/dusk). The conformance pass covers
// silence before and after notes, voice stealing under a pile of keys,
// parameter abuse and other sample rates; the rest measures what makes it
// this instrument: one locked, exactly tuned oscillator per key, a four-pole
// filter that follows the keys and sings, one envelope, and above all the
// two-line triangle chorus (rate, detune, opposition, darkness, hiss).
//
// Nobody has listened to this device. Every claim below is a measurement.

#include "../devices/dusk/dusk.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Dusk;
using Chorus = livemix::dusk_detail::TwoLineChorus;
namespace p = livemix::dusk;

static Dusk device;

static const float kRate = 48000.0f;
static const float kMiddleC = Dusk::kKeyFollowHz;

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// A plain, fast, steady voice: one static wave, filter open and still, no
// sub, no chorus, level at unity.
static void plain(Dusk& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWave, Dusk::kSaw);
  d.set_param(p::kSub, 0.0f);
  d.set_param(p::kLowCut, 0.0f);
  d.set_param(p::kCutoff, 18000.0f);
  d.set_param(p::kResonance, 0.0f);
  d.set_param(p::kEnvelope, 0.0f);
  d.set_param(p::kAttack, 0.001f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kChorus, Chorus::kOff);
  d.set_param(p::kVolume, 0.0f);
}

// A mellow voice for click tests: close to a sine, so a step stands out.
static void mellow(Dusk& d) {
  plain(d);
  d.set_param(p::kWave, Dusk::kSquare);
  d.set_param(p::kCutoff, kMiddleC);  // the corner sits on each key's fundamental
  d.set_param(p::kAttack, 0.05f);
  d.set_param(p::kRelease, 0.5f);
}

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b, float scale) {
  std::vector<float> out(a.size());
  for (size_t i = 0; i < a.size(); ++i) out[i] = a[i] - scale * b[i];
  return out;
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static std::vector<float> side(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] - s.right[i]);
  return out;
}

static double mid_over_side_db(const Stereo& s, size_t from) {
  return db(rms(mid(s), from) / rms(side(s), from));
}

// Four keys in major thirds from C3.
static void hold_chord(Dusk& d) {
  for (int n = 0; n < 4; ++n) d.note_on(n, 130.81f * std::pow(2.0f, n * 4 / 12.0f), 0.8f);
}

// Level of the strongest component within ±0.8 % of `hz` (a wet copy sits a
// few cents off the dry partial).
static double level_near(const std::vector<float>& x, double hz, size_t from, size_t to) {
  const double found = dominant_frequency(x, kRate, hz * 0.992, hz * 1.008, from, to);
  return tone_level(x, found, kRate, from, to);
}

// The level of the `hz` component over time: one value per `hop` samples
// from Hann windows of `window` samples.
static std::vector<double> level_track(const std::vector<float>& x, double hz, size_t from, size_t window,
                                       size_t hop) {
  std::vector<double> track;
  for (size_t start = from; start + window <= x.size(); start += hop) {
    track.push_back(tone_level(x, hz, kRate, start, start + window));
  }
  return track;
}

// The lag in [lo, hi] at which a track best matches itself (normalised
// autocorrelation of the track minus its mean).
static size_t best_lag(const std::vector<double>& track, size_t lo, size_t hi) {
  double mean = 0.0;
  for (double v : track) mean += v;
  mean /= static_cast<double>(track.size());
  size_t best = lo;
  double best_score = -2.0;
  for (size_t lag = lo; lag <= hi && lag + 8 < track.size(); ++lag) {
    double ab = 0.0, aa = 0.0, bb = 0.0;
    for (size_t i = 0; i + lag < track.size(); ++i) {
      const double a = track[i] - mean, b = track[i + lag] - mean;
      ab += a * b;
      aa += a * a;
      bb += b * b;
    }
    const double score = ab / std::sqrt(aa * bb + 1.0e-30);
    if (score > best_score) {
      best_score = score;
      best = lag;
    }
  }
  return best;
}

// The worst predicted fold-back component of a harmonic tone at `f0`, in dB
// against the fundamental: every harmonic above Nyquist lands on a known
// frequency that is not a harmonic.
static double worst_alias_db(const std::vector<float>& x, double f0, double rate, size_t from) {
  const double fundamental = tone_level(x, f0, rate, from);
  double worst = -300.0;
  for (int n = static_cast<int>(rate * 0.5 / f0) + 1; n < 200; ++n) {
    double hz = std::fmod(n * f0, rate);
    if (hz > rate * 0.5) hz = rate - hz;
    worst = std::max(worst, db(tone_level(x, hz, rate, from) / fundamental));
  }
  return worst;
}

static Stereo render_ragged(Dusk& d, float seconds) {
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  Stereo out;
  const size_t total = static_cast<size_t>(seconds * kRate);  // as testkit::render counts
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0;
  int which = 0;
  while (done < total) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), total - done));
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

static void test_oscillator();
static void test_filter();
static void test_envelope();
static void test_low_cut();
static void test_chorus();
static void test_hiss_and_sleep();
static void test_clicks();
static void test_levels();

int main() {
  Conformance spec;
  spec.name = "dusk";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_oscillator();
  test_filter();
  test_envelope();
  test_low_cut();
  test_chorus();
  test_hiss_and_sleep();
  test_clicks();
  test_levels();

  // Cost with every voice sounding at the default patch.
  device.init(kRate);
  for (int n = 0; n < Dusk::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  report_cost("dusk (10 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("dusk");
}

// --- one oscillator per key ------------------------------------------------------------------

static void test_oscillator() {
  char label[160];

  // Pitch, C2 to C6, at three sample rates: the default patch with its sub,
  // chorus off. The pulse width is held still, because a moving edge bends
  // the pulse's partials a few cents each way as it travels (it averages to
  // nothing over a sweep, and it is how the originals behave).
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (int midi : {36, 43, 48, 57, 60, 69, 72, 79, 84}) {
      const double hz = 440.0 * std::pow(2.0, (midi - 69) / 12.0);
      device.init(rate);
      device.set_param(p::kChorus, Chorus::kOff);
      device.set_param(p::kWave, Dusk::kSawSquare);
      device.set_param(p::kAttack, 0.001f);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 2.5f, rate);
      const double found = dominant_frequency(out.left, rate, hz * 0.97, hz * 1.03, at(0.4, rate));
      std::snprintf(label, sizeof label, "note %d at %.0f Hz sample rate: %.3f cents off", midi, rate,
                    cents(found, hz));
      EXPECT(std::fabs(cents(found, hz)) < 3.0, label);
    }
  }

  // No drift and no detune: two keys on one pitch do not beat. A pair one
  // cent apart would swing by more than 10 dB within these five seconds.
  {
    plain(device);
    device.set_param(p::kWave, Dusk::kSawSquare);
    device.set_param(p::kSub, 0.35f);
    device.note_on(1, 220.0f, 0.8f);
    device.note_on(2, 220.0f, 0.8f);
    Stereo out = render(device, 5.5f, kRate);
    double lo = 1.0e9, hi = 0.0;
    for (size_t from = at(0.5); from + 4800 <= out.size(); from += 2400) {
      const double level = rms(out.left, from, from + 4800);
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    std::printf("  two keys on one pitch: level moves by %.3f dB in 5 s\n", db(hi / lo));
    EXPECT(db(hi / lo) < 0.5, "two keys on one pitch hold their level: no drift, no detune");
  }

  // The sawtooth: harmonic n at 1/n.
  {
    plain(device);
    device.note_on(1, 220.0f, 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    const double fundamental = tone_level(out.left, 220.0, kRate, 48000);
    double worst = 0.0;
    for (int n = 2; n <= 10; ++n) {
      const double level = db(tone_level(out.left, 220.0 * n, kRate, 48000) / fundamental);
      worst = std::max(worst, std::fabs(level + 20.0 * std::log10(static_cast<double>(n))));
    }
    std::printf("  saw harmonics 2 to 10: within %.2f dB of 1/n\n", worst);
    EXPECT(worst < 1.0, "a sawtooth: harmonic n sits at -20 log10(n) dB");
  }

  // The square: no even harmonics.
  {
    plain(device);
    device.set_param(p::kWave, Dusk::kSquare);
    device.note_on(1, 220.0f, 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    double worst = -300.0;
    for (int n = 2; n <= 8; n += 2) {
      const double even = tone_level(out.left, 220.0 * n, kRate, 48000);
      const double odd = tone_level(out.left, 220.0 * (n - 1), kRate, 48000);
      worst = std::max(worst, db(even / odd));
    }
    std::printf("  square: even harmonics %.1f dB under their odd neighbours at worst\n", worst);
    EXPECT(worst < -30.0, "a square: even harmonics at least 30 dB below the odd ones beside them");
    EXPECT_NEAR(db(tone_level(out.left, 660.0, kRate, 48000) / tone_level(out.left, 220.0, kRate, 48000)),
                -9.54, 1.0, "a square: the third harmonic at a third");
  }

  // The sub is a square one octave down, locked to the oscillator: the same
  // waveform comes round every two cycles, for ever. 200 Hz is 240 samples.
  {
    plain(device);
    device.note_on(1, 200.0f, 1.0f);
    Stereo without = render(device, 1.0f, kRate);
    EXPECT(tone_level(without.left, 100.0, kRate, 24000) < 1.0e-4, "no octave below with Sub at 0");

    plain(device);
    device.set_param(p::kSub, 1.0f);
    device.note_on(1, 200.0f, 1.0f);
    Stereo out = render(device, 6.0f, kRate);
    const double sub = tone_level(out.left, 100.0, kRate, 48000);
    const double fundamental = tone_level(out.left, 200.0, kRate, 48000);
    std::printf("  sub at full: %.1f dB against the saw's fundamental\n", db(sub / fundamental));
    EXPECT(db(sub / fundamental) > -3.0, "Sub adds a strong component at exactly half the frequency");
    // Phase of the sub against the fundamental, window by window.
    double lo = 1.0e9, hi = -1.0e9, level_lo = 1.0e9, level_hi = 0.0;
    for (size_t from = 48000; from + 4800 <= out.size(); from += 24000) {
      double relative = tone_phase(out.left, 200.0, kRate, from, from + 4800) -
                        2.0 * tone_phase(out.left, 100.0, kRate, from, from + 4800);
      relative = std::remainder(relative, 2.0 * kPi);
      lo = std::min(lo, relative);
      hi = std::max(hi, relative);
      const double level = tone_level(out.left, 100.0, kRate, from, from + 4800);
      level_lo = std::min(level_lo, level);
      level_hi = std::max(level_hi, level);
    }
    std::printf("  sub against fundamental over 5 s: phase moves %.5f rad, level %.4f dB\n", hi - lo,
                db(level_hi / level_lo));
    EXPECT(hi - lo < 0.01, "the sub keeps its phase against the oscillator");
    EXPECT(db(level_hi / level_lo) < 0.05, "and its level");
    double worst = 0.0;
    for (size_t i = 48000; i < 96000; ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - out.left[i + 480 * 50]));
    }
    EXPECT(worst < 0.01 * peak(out.left, 48000), "the waveform repeats every two cycles, half a second apart");
  }

  // Moving pulse: the width leaves 50 % and comes back once per sweep, so the
  // second harmonic (absent from a square) rises and returns to nothing at
  // the sweep rate.
  {
    plain(device);
    device.set_param(p::kWave, Dusk::kMovingPulse);
    device.note_on(1, 220.0f, 1.0f);
    Stereo out = render(device, 7.0f, kRate);
    const size_t hop = 480;
    std::vector<double> second = level_track(out.left, 440.0, 0, 2400, hop);
    const double fundamental = tone_level(out.left, 220.0, kRate, 48000);
    // Minima: the lowest point in each stretch under a tenth of the maximum.
    double top = 0.0;
    for (double v : second) top = std::max(top, v);
    std::vector<double> nulls;
    for (size_t i = 0; i < second.size();) {
      if (second[i] > 0.1 * top) {
        ++i;
        continue;
      }
      size_t lowest = i;
      for (; i < second.size() && second[i] <= 0.1 * top; ++i) {
        if (second[i] < second[lowest]) lowest = i;
      }
      nulls.push_back(static_cast<double>(lowest * hop + 1200) / kRate);
    }
    EXPECT(top > 0.3 * fundamental, "Moving pulse: the second harmonic becomes strong");
    EXPECT(nulls.size() >= 4, "Moving pulse: it returns to a square again and again");
    if (nulls.size() >= 4) {
      const double period = (nulls.back() - nulls.front()) / static_cast<double>(nulls.size() - 1);
      std::printf("  moving pulse: one sweep every %.3f s\n", period);
      EXPECT_NEAR(period, 1.0 / Dusk::kPulseLfoHz, 0.05 / Dusk::kPulseLfoHz, "Moving pulse sweeps at its rate");
    }

    plain(device);
    device.set_param(p::kWave, Dusk::kSquare);
    device.note_on(1, 220.0f, 1.0f);
    Stereo still = render(device, 3.0f, kRate);
    double still_top = 0.0;
    for (double v : level_track(still.left, 440.0, 4800, 2400, hop)) still_top = std::max(still_top, v);
    EXPECT(still_top < 0.03 * fundamental, "Square: the width does not move");
  }

  // A sawtooth at C6, filter open: what folds back is at least 50 dB down.
  for (float rate : {44100.0f, 48000.0f}) {
    plain(device, rate);
    const double c6 = 1046.502;
    device.note_on(1, static_cast<float>(c6), 1.0f);
    Stereo out = render(device, 2.0f, rate);
    const double worst = worst_alias_db(out.left, c6, rate, at(1.0, rate));
    std::printf("  C6 saw at %.0f Hz: worst fold-back %.1f dB under the fundamental\n", rate, worst);
    EXPECT(worst < -50.0, "a sawtooth at C6 does not alias: fold-back at least 50 dB down");
  }
}

// --- the filter ------------------------------------------------------------------------------

// Level of harmonic `n` of a note at `hz`, cutoff as given, resonance and
// envelope amount at 0.
static double harmonic_level(float hz, int n, float cutoff, float resonance = 0.0f) {
  plain(device);
  device.set_param(p::kCutoff, cutoff);
  device.set_param(p::kResonance, resonance);
  device.note_on(1, hz, 1.0f);
  Stereo out = render(device, 2.0f, kRate);
  return tone_level(out.left, static_cast<double>(hz) * n, kRate, 48000);
}

static void test_filter() {
  // Four poles: 24 dB per octave between two and four octaves above the
  // corner. Middle C against a 500 Hz corner; harmonics 8 and 31 sit 2.07
  // and 4.02 octaves above it. The open filter is the reference.
  {
    const double low_hz = kMiddleC * 8, high_hz = kMiddleC * 31;
    const double low = db(harmonic_level(kMiddleC, 8, 500.0f) / harmonic_level(kMiddleC, 8, 18000.0f));
    const double high = db(harmonic_level(kMiddleC, 31, 500.0f) / harmonic_level(kMiddleC, 31, 18000.0f));
    const double slope = (high - low) / std::log2(high_hz / low_hz);
    std::printf("  filter: %.1f dB at %.0f Hz, %.1f dB at %.0f Hz: %.1f dB per octave\n", low, low_hz, high,
                high_hz, slope);
    EXPECT_NEAR(slope, -24.0, 3.0, "the low-pass falls 24 dB per octave");
    EXPECT_NEAR(low, -24.0 * std::log2(low_hz / 500.0), 3.0, "and its corner is where Cutoff says, at middle C");
  }

  // Cutoff is a brightness: it follows the keyboard, so the same harmonic is
  // cut by the same amount on a low key and a high one.
  {
    const float low_key = 65.406f, high_key = 1046.5f;
    const double low = db(harmonic_level(low_key, 4, 600.0f) / harmonic_level(low_key, 4, 18000.0f));
    const double high = db(harmonic_level(high_key, 4, 600.0f) / harmonic_level(high_key, 4, 18000.0f));
    std::printf("  key follow: harmonic 4 cut by %.1f dB at C2 and %.1f dB at C6\n", low, high);
    EXPECT(low < -8.0, "the filter cuts the fourth harmonic at this setting");
    EXPECT_NEAR(low, high, 1.5, "and by the same amount at C2 and at C6: it follows the keys");
  }

  // Resonance lifts what sits at the corner. The corner is on harmonic 4.
  {
    const float corner = 4.0f * kMiddleC;
    const double flat_body = harmonic_level(kMiddleC, 1, corner, 0.0f);
    const double peaked_body = harmonic_level(kMiddleC, 1, corner, 0.8f);
    const double flat = harmonic_level(kMiddleC, 4, corner, 0.0f) / flat_body;
    const double peaked = harmonic_level(kMiddleC, 4, corner, 0.8f) / peaked_body;
    std::printf("  resonance 0.8 lifts the harmonic at the corner by %.1f dB against the fundamental\n",
                db(peaked / flat));
    EXPECT(db(peaked / flat) > 12.0, "Resonance emphasises the corner");
    // The pass band keeps about half of what a ladder loses, in decibels.
    const double body = db(peaked_body / flat_body);
    std::printf("  and the fundamental moves by %.1f dB\n", body);
    EXPECT(body > -9.0 && body < 0.0, "the pass band loses some body with resonance, not all of it");
  }

  // At the top the filter sings: a clean tone at the corner, which follows
  // the keys. The corner is set well under each note (0.382 of it), so the
  // oscillator is filtered away and none of its harmonics land on the tone.
  for (float key : {130.813f, kMiddleC, 1046.5f}) {
    const float corner_at_c4 = 100.0f;
    const double expected = corner_at_c4 * key / kMiddleC;
    plain(device);
    device.set_param(p::kCutoff, corner_at_c4);
    device.set_param(p::kResonance, 1.0f);
    device.note_on(1, key, 1.0f);
    Stereo out = render(device, 6.0f, kRate);
    const size_t from = at(3.0);
    const double found = dominant_frequency(out.left, kRate, expected * 0.7, expected * 6.0, from);
    const double tone = tone_level(out.left, found, kRate, from);
    const double second = db(tone_level(out.left, 2.0 * found, kRate, from) / tone);
    const double third = db(tone_level(out.left, 3.0 * found, kRate, from) / tone);
    const double note = db(tone_level(out.left, key, kRate, from) / tone);
    std::printf("  singing filter under a %.0f Hz key: %.2f cents from %.1f Hz, harmonics %.0f and %.0f dB, "
                "the key itself %.0f dB\n",
                key, cents(found, expected), expected, second, third, note);
    EXPECT(std::fabs(cents(found, expected)) < 20.0, "the singing filter is the strongest tone and in tune");
    EXPECT(second < -30.0 && third < -30.0, "and it is a clean sine: harmonics 30 dB down");
    EXPECT(note < -12.0, "with the oscillator filtered away beneath it");

    // Just under the top it rings but does not sing on its own.
    plain(device);
    device.set_param(p::kCutoff, corner_at_c4);
    device.set_param(p::kResonance, 0.85f);
    device.note_on(1, key, 1.0f);
    Stereo quiet = render(device, 6.0f, kRate);
    EXPECT(tone_level(quiet.left, expected, kRate, from) < 0.1 * tone, "below the top the filter does not sing");
  }
}

// --- one envelope ----------------------------------------------------------------------------

static void test_envelope() {
  // The shortest attack is there within 5 ms.
  {
    plain(device);
    device.note_on(1, 440.0f, 1.0f);
    Stereo out = render(device, 0.5f, kRate);
    const double full = peak(out.left, 2400, 12000);
    size_t reached = 0;
    while (reached < out.size() && std::fabs(out.left[reached]) < 0.9 * full) ++reached;
    std::printf("  shortest attack: 90 %% of the level after %.2f ms\n", 1000.0 * reached / kRate);
    EXPECT(reached < at(0.005), "the shortest attack reaches 90 % within 5 ms");
  }

  // Attack is the time it says, and the level then settles to the sustain.
  {
    plain(device);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 0.3f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo rise = render(device, 3.0f, kRate);
    const double top = rms(rise.left, at(0.98), at(1.03));
    EXPECT(rms(rise.left, 0, 4800) < 0.35 * top, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise.left, at(0.5), at(0.55)) < 0.85 * top, "and still rising at half its time");
    const double held = rms(rise.left, at(2.5), at(3.0));
    std::printf("  held level against the peak: %.2f (sustain %.2f)\n", held / top, Dusk::kSustain);
    EXPECT_NEAR(held / top, Dusk::kSustain, 0.04, "a held note settles to the sustain level");
  }

  // The longest release rings for its time, then stops exactly.
  {
    plain(device);
    device.set_param(p::kRelease, 12.0f);
    device.set_param(p::kWave, Dusk::kSquare);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 0.2f, kRate);
    device.note_off(1);
    Stereo fall = render(device, 22.0f, kRate);
    const double time = rt60(fall.left, kRate, 0.2, 0.2, -80.0);
    std::printf("  longest release: %.1f s to -60 dB\n", time);
    EXPECT(time > 8.0, "the longest release takes over 8 s to fall 60 dB");
    EXPECT_NEAR(time, 12.0, 1.5, "and is the time Release says");
    EXPECT(peak(fall.left, at(21.5)) == 0.0 && peak(fall.right, at(21.5)) == 0.0,
           "and the instrument is exactly silent after it");
  }

  // The same envelope moves the filter. Harmonic 6 against the fundamental,
  // early in a half-second attack and at its top.
  {
    auto brightness = [](float cutoff, float amount, double from, double to) {
      plain(device);
      device.set_param(p::kCutoff, cutoff);
      device.set_param(p::kEnvelope, amount);
      device.set_param(p::kAttack, 0.5f);
      device.set_param(p::kRelease, 12.0f);  // decay is slow: the top lasts
      device.note_on(1, 220.0f, 1.0f);
      Stereo out = render(device, 1.0f, kRate);
      return db(tone_level(out.left, 1320.0, kRate, at(from), at(to)) /
                tone_level(out.left, 220.0, kRate, at(from), at(to)));
    };
    const double up_early = brightness(300.0f, 0.5f, 0.02, 0.07);
    const double up_top = brightness(300.0f, 0.5f, 0.5, 0.6);
    const double down_early = brightness(6000.0f, -0.5f, 0.02, 0.07);
    const double down_top = brightness(6000.0f, -0.5f, 0.5, 0.6);
    const double still_early = brightness(300.0f, 0.0f, 0.02, 0.07);
    const double still_top = brightness(300.0f, 0.0f, 0.5, 0.6);
    std::printf("  envelope to filter, harmonic 6: +0.5 %.0f -> %.0f dB, -0.5 %.0f -> %.0f dB, 0 %.0f -> %.0f dB\n",
                up_early, up_top, down_early, down_top, still_early, still_top);
    EXPECT(up_top > up_early + 20.0, "Envelope above zero opens the filter as the note arrives");
    EXPECT(down_top < down_early - 20.0, "Envelope below zero closes it");
    EXPECT_NEAR(still_top, still_early, 2.0, "Envelope at zero leaves the filter still");
  }
}

// --- low cut ---------------------------------------------------------------------------------

static void test_low_cut() {
  auto fundamental = [](float hz, int position) {
    plain(device);
    device.set_param(p::kWave, Dusk::kSquare);
    device.set_param(p::kLowCut, static_cast<float>(position));
    device.note_on(1, hz, 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    return tone_level(out.left, hz, kRate, 48000);
  };
  double at_55[4], at_110[4];
  for (int position = 0; position < 4; ++position) {
    at_55[position] = db(fundamental(55.0f, position));
    at_110[position] = db(fundamental(110.0f, position));
  }
  std::printf("  low cut at 55 Hz: %.1f, %.1f, %.1f dB against Off\n", at_55[1] - at_55[0], at_55[2] - at_55[0],
              at_55[3] - at_55[0]);
  EXPECT(at_55[1] < at_55[0] - 1.5 && at_55[2] < at_55[1] - 4.0 && at_55[3] < at_55[2] - 4.0,
         "Low cut thins a 55 Hz fundamental step by step");
  // One pole: an octave lower loses 6 dB more, well under the corner.
  const double slope = (at_55[3] - at_55[0]) - (at_110[3] - at_110[0]);
  std::printf("  low cut, Deep: %.1f dB per octave under the corner\n", -slope);
  EXPECT_NEAR(slope, -6.0, 1.5, "Low cut falls 6 dB per octave");
  // The corner of each position: -3 dB at its frequency, measured as the
  // loss of a fundamental placed there.
  for (int position = 1; position < 4; ++position) {
    const float corner = Dusk::kLowCutHz[position];
    EXPECT_NEAR(db(fundamental(corner, position)) - db(fundamental(corner, 0)), -3.0, 1.0,
                "each Low cut position has its corner where the design puts it");
  }
}

// --- the chorus ------------------------------------------------------------------------------

// A steady tone close to a sine (a square with the filter's corner on its
// fundamental), dry level at unity, through one chorus mode. The first key
// restarts the chorus, so its sweep starts with the note at time zero.
static Stereo chorus_tone(int mode, float hz, float seconds) {
  plain(device);
  device.set_param(p::kWave, Dusk::kSquare);
  device.set_param(p::kCutoff, kMiddleC);
  device.set_param(p::kRelease, 0.002f);  // the level settles at once
  device.set_param(p::kChorus, static_cast<float>(mode));
  device.note_on(1, hz, 1.0f);
  return render(device, seconds, kRate);
}

// How often the pattern the chorus makes repeats, in seconds: the left
// channel's level of the tone (the wet copy moving against the dry one)
// matched against itself.
static double chorus_period(int mode, double expected) {
  const float hz = 880.0f;
  Stereo out = chorus_tone(mode, hz, static_cast<float>(std::max(1.5, 3.6 * expected)));
  const size_t hop = std::max<size_t>(24, at(expected / 400.0));
  const size_t window = std::max<size_t>(8 * hop, 384);
  std::vector<double> track = level_track(out.left, hz, at(0.1), window, hop);
  const double per_hop = static_cast<double>(hop) / kRate;
  const size_t lag = best_lag(track, static_cast<size_t>(0.6 * expected / per_hop),
                              static_cast<size_t>(1.4 * expected / per_hop));
  return static_cast<double>(lag) * per_hop;
}

// Cents of each side's wet copy against the dry tone in the first and the
// second half of a sweep: {left first, right first, left second, right second}.
static void chorus_detune(int mode, double cents_out[4]) {
  const float hz = 880.0f;
  const double half = 0.5 / Chorus::kSettings[mode].rate_hz;
  Stereo dry = chorus_tone(Chorus::kOff, hz, static_cast<float>(2.0 * half + 0.1));
  Stereo wet = chorus_tone(mode, hz, static_cast<float>(2.0 * half + 0.1));
  // With the chorus on, each side is the sum gain times dry plus wet.
  const std::vector<float> left = minus(wet.left, dry.left, Chorus::kSumGain);
  const std::vector<float> right = minus(wet.right, dry.right, Chorus::kSumGain);
  for (int part = 0; part < 2; ++part) {
    const size_t from = at((part + 0.12) * half), to = at((part + 0.88) * half);
    const double reference = dominant_frequency(dry.left, kRate, hz * 0.98, hz * 1.02, from, to);
    cents_out[2 * part] = cents(dominant_frequency(left, kRate, hz * 0.98, hz * 1.02, from, to), reference);
    cents_out[2 * part + 1] = cents(dominant_frequency(right, kRate, hz * 0.98, hz * 1.02, from, to), reference);
  }
}

static void test_chorus() {
  // Off is mono, sample for sample, on the default patch.
  {
    device.init(kRate);
    device.set_param(p::kChorus, Chorus::kOff);
    hold_chord(device);
    Stereo out = render(device, 3.0f, kRate);
    EXPECT(rms(out.left) > 1.0e-3, "the chord sounds with the chorus off");
    EXPECT(out.left == out.right, "Chorus Off is mono: left equals right sample for sample");
  }

  // Rate of each mode.
  {
    const double one = chorus_period(Chorus::kOne, 1.0 / 0.513);
    const double two = chorus_period(Chorus::kTwo, 1.0 / 0.863);
    const double both = chorus_period(Chorus::kBoth, 1.0 / 9.75);
    std::printf("  chorus period: I %.3f s, II %.3f s, I + II %.4f s (%.2f Hz)\n", one, two, both, 1.0 / both);
    EXPECT_NEAR(one, 1.949, 0.05 * 1.949, "chorus I repeats every 1.95 s");
    EXPECT_NEAR(two, 1.159, 0.05 * 1.159, "chorus II repeats every 1.16 s");
    EXPECT_NEAR(1.0 / both, 9.75, 0.05 * 9.75, "chorus I + II moves at 9.75 Hz");
  }

  // Depth, as detune: a triangle sweep holds each wet copy at a constant
  // offset from the dry tone and flips it twice a cycle. 3.69 ms in half a
  // period is 6.5 cents in mode I and 11 cents in mode II. The two sides are
  // always opposite.
  {
    double one[4], two[4];
    chorus_detune(Chorus::kOne, one);
    chorus_detune(Chorus::kTwo, two);
    std::printf("  chorus I wet copies: left %+.2f right %+.2f cents, then left %+.2f right %+.2f\n", one[0],
                one[1], one[2], one[3]);
    std::printf("  chorus II wet copies: left %+.2f right %+.2f cents, then left %+.2f right %+.2f\n", two[0],
                two[1], two[2], two[3]);
    EXPECT_NEAR(one[0], -6.56, 0.7, "chorus I: the left copy runs 6.5 cents flat while its delay grows");
    EXPECT_NEAR(one[1], 6.54, 0.7, "chorus I: the right copy runs 6.5 cents sharp at the same time");
    EXPECT_NEAR(one[2], 6.54, 0.7, "chorus I: half a cycle later the left copy is sharp");
    EXPECT_NEAR(one[3], -6.56, 0.7, "chorus I: and the right one flat");
    EXPECT_NEAR(two[0], -11.06, 1.1, "chorus II: the left copy runs 11 cents flat");
    EXPECT_NEAR(two[1], 10.99, 1.1, "chorus II: the right copy 11 cents sharp");
    EXPECT_NEAR(two[2], 10.99, 1.1, "chorus II: and they swap");
    EXPECT_NEAR(two[3], -11.06, 1.1, "chorus II: both of them");
  }

  // Dry and wet are summed equally, and switching the chorus on does not
  // change the loudness.
  {
    Stereo dry = chorus_tone(Chorus::kOff, 880.0f, 4.0f);
    Stereo wet = chorus_tone(Chorus::kOne, 880.0f, 4.0f);
    const double copy = rms(minus(wet.left, dry.left, Chorus::kSumGain), at(0.1));
    const double direct = Chorus::kSumGain * rms(dry.left, at(0.1));
    std::printf("  chorus I: wet copy %.2f dB against the dry part\n", db(copy / direct));
    EXPECT_NEAR(db(copy / direct), 0.0, 0.5, "dry and wet are mixed in equal parts");
    // Averaged over whole sweeps so the comb's fringes even out.
    EXPECT_NEAR(db(rms(wet.left, at(0.1), at(0.1 + 1.949)) / rms(dry.left, at(0.1), at(0.1 + 1.949))), 0.0, 1.5,
                "switching the chorus on keeps the level");
  }

  // The wet path is darker than the dry one. A 1 kHz sawtooth, filter open:
  // harmonic 12 against the fundamental, in the wet copy and in the dry tone.
  {
    auto saw = [](int mode) {
      plain(device);
      device.set_param(p::kChorus, static_cast<float>(mode));
      device.note_on(1, 1000.0f, 1.0f);
      return render(device, 1.0f, kRate);
    };
    Stereo dry = saw(Chorus::kOff);
    Stereo wet = saw(Chorus::kOne);
    const std::vector<float> copy = minus(wet.left, dry.left, Chorus::kSumGain);
    const size_t from = at(0.12), to = at(0.85);
    const double dry_tilt = db(tone_level(dry.left, 12000.0, kRate, from, to) / tone_level(dry.left, 1000.0, kRate, from, to));
    const double wet_tilt = db(level_near(copy, 12000.0, from, to) / level_near(copy, 1000.0, from, to));
    std::printf("  12 kHz against 1 kHz: dry %.1f dB, wet copy %.1f dB\n", dry_tilt, wet_tilt);
    EXPECT(wet_tilt < dry_tilt - 12.0, "the wet path is darker: 12 kHz at least 12 dB lower than in the dry signal");
  }

  // Width without cancellation on a held chord of the default patch: the two
  // sides share the dry signal and carry opposite wet copies, so they
  // correlate by about a half, and the mid stays above the side.
  for (int mode : {Chorus::kOne, Chorus::kTwo}) {
    device.init(kRate);
    device.set_param(p::kChorus, static_cast<float>(mode));
    hold_chord(device);
    Stereo out = render(device, 7.0f, kRate);
    const double together = correlation(out.left, out.right, at(1.0));
    const double mid_over_side = mid_over_side_db(out, at(1.0));
    std::printf("  chorus %s on a chord: correlation %.2f, mid %.1f dB over side\n", mode == Chorus::kOne ? "I" : "II",
                together, mid_over_side);
    EXPECT(together < 0.9, "the chorus makes the chord wide: left and right correlate under 0.9");
    EXPECT(together > 0.2, "and they still share the dry signal");
    EXPECT(mid_over_side > 3.0, "mono-compatible: the mid stays at least 3 dB above the side");
  }

  // I + II is in the centre: both wet copies move together, so the side
  // signal holds nothing but the two sides' hiss.
  {
    device.init(kRate);
    device.set_param(p::kChorus, Chorus::kBoth);
    hold_chord(device);
    Stereo out = render(device, 3.0f, kRate);
    const double mid_over_side = mid_over_side_db(out, at(1.0));
    std::printf("  chorus I + II on a chord: mid %.1f dB over side\n", mid_over_side);
    EXPECT(mid_over_side > 35.0, "chorus I + II is in the centre");
    EXPECT(rms(side(out), at(1.0)) > 0.0, "apart from the hiss of its two lines");
  }
}

// --- hiss, sleep and block size --------------------------------------------------------------

static void test_hiss_and_sleep() {
  // The hiss level at the default volume, read from the side signal of mode
  // I + II (the notes are in the centre there). Two uncorrelated sides of
  // equal level h give a side signal of h / sqrt(2).
  {
    device.init(kRate);
    device.set_param(p::kChorus, Chorus::kBoth);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 4.0f, kRate);
    const double hiss = db(rms(side(out), at(1.0)) * std::sqrt(2.0));
    std::printf("  hiss per side at the default volume: %.1f dBFS\n", hiss);
    EXPECT_NEAR(hiss, -72.0, 2.0, "the chorus hisses at its chosen level");
  }

  // The hiss of the two lines is independent, it belongs to the chorus, and
  // it stops: after the last key ends it fades and the device sleeps.
  for (int mode : {Chorus::kOne, Chorus::kOff}) {
    plain(device);
    device.set_param(p::kVolume, p::kParamDefault[p::kVolume]);
    device.set_param(p::kRelease, 0.002f);
    device.set_param(p::kChorus, static_cast<float>(mode));
    device.note_on(1, 1760.0f, 0.7f);
    render(device, 0.3f, kRate);
    device.note_off(1);
    // 100 to 200 ms after the key: the note and everything it left in the
    // filters are gone, and the hiss is part of the way through its fade.
    Stereo tail = render(device, 1.0f, kRate);
    const size_t from = at(0.1), to = at(0.2);
    if (mode == Chorus::kOne) {
      const double level = db(rms(tail.left, from, to));
      const double together = correlation(tail.left, tail.right, from, to);
      std::printf("  after the note, chorus on: noise at %.1f dBFS, left/right correlation %.3f\n", level, together);
      EXPECT(level > -90.0 && level < -72.0, "with the chorus on, hiss outlasts the note for a moment");
      EXPECT(std::fabs(together) < 0.15, "the hiss of the two sides is uncorrelated");
    } else {
      EXPECT(peak(tail.left, from, to) < 1.0e-5 && peak(tail.right, from, to) < 1.0e-5,
             "with the chorus off there is no hiss");
    }
    EXPECT(peak(tail.left, at(0.6)) == 0.0 && peak(tail.right, at(0.6)) == 0.0,
           "the hiss stops and the output reaches exact zero");
  }

  // The output does not depend on the block size, across silences of every
  // length around the moment the device falls asleep (which block that is
  // depends on the block size) and one long after it. A parameter is moved
  // in the silence, 10 ms before the next key: asleep or not, it is there
  // when the key arrives.
  {
    auto phrase = [](int block, float silence) {
      device.init(kRate);
      device.set_param(p::kRelease, 0.05f);
      device.set_param(p::kAttack, 0.01f);
      Stereo out;
      auto run_for = [&](float seconds) {
        Stereo part = block > 0 ? render(device, seconds, kRate, block) : render_ragged(device, seconds);
        out = concat(out, part);
      };
      device.note_on(1, 220.0f, 0.8f);
      device.note_on(2, 329.63f, 0.8f);
      run_for(0.7f);
      device.note_off(1);
      device.note_off(2);
      run_for(silence - 0.01f);
      device.set_param(p::kCutoff, 6000.0f);
      device.set_param(p::kSub, 0.9f);
      run_for(0.01f);
      device.note_on(3, 277.18f, 0.8f);
      run_for(0.6f);
      device.set_param(p::kChorus, Chorus::kTwo);
      device.set_param(p::kCutoff, 900.0f);
      run_for(0.3f);
      return out;
    };
    {
      Stereo asleep = phrase(128, 1.3f);
      EXPECT(peak(asleep.left, at(1.6), at(1.95)) == 0.0, "the phrase holds a silence in which the device sleeps");
      EXPECT(rms(asleep.left, at(2.2)) > 1.0e-3, "and a note after it");
    }
    double worst = 0.0;
    float worst_silence = 0.0f;
    const char* worst_block = "";
    for (float silence : {0.38f, 0.40f, 0.42f, 0.44f, 0.46f, 0.48f, 0.50f, 1.3f}) {
      Stereo reference = phrase(128, silence);
      for (int block : {1, 0, 2048}) {
        Stereo other = phrase(block, silence);
        double diff = 0.0;
        for (size_t i = 0; i < reference.size(); ++i) {
          diff = std::max(diff, std::fabs(static_cast<double>(other.left[i]) - reference.left[i]));
          diff = std::max(diff, std::fabs(static_cast<double>(other.right[i]) - reference.right[i]));
        }
        if (diff > worst) {
          worst = diff;
          worst_silence = silence;
          worst_block = block == 0 ? "ragged" : block == 1 ? "1 frame" : "2048 frames";
        }
      }
    }
    char label[160];
    std::snprintf(label, sizeof label, "output does not depend on block size (worst %g, %s blocks, %.2f s silence)",
                  worst, worst_block, worst_silence);
    EXPECT(worst < 1.0e-6, label);
  }
}

// --- clicks ----------------------------------------------------------------------------------

static void test_clicks() {
  // Stealing: ten mellow keys, then an eleventh. The stolen voice fades over
  // a few milliseconds and the new note starts from silence.
  {
    mellow(device);
    for (int n = 0; n < Dusk::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n / 12.0f), 0.8f);
    Stereo before = render(device, 0.6f, kRate);
    const double steady = max_step(before.left, at(0.4));
    device.note_on(99, 233.08f, 0.8f);
    Stereo after = render(device, 0.4f, kRate);
    Stereo joined = concat(before, after);
    const double stolen = max_step(joined.left, at(0.6) - 2, at(0.7));
    std::printf("  steal: largest step %.5f against %.5f before\n", stolen, steady);
    EXPECT(stolen < 2.0 * steady, "stealing a voice does not click");
    EXPECT(tone_level(after.left, 233.08, kRate, at(0.2)) > 0.01, "and the new note sounds");
    // An eleventh and a twelfth key at once: neither is lost.
    mellow(device);
    for (int n = 0; n < Dusk::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n / 12.0f), 0.8f);
    render(device, 0.6f, kRate);
    device.note_on(98, 233.08f, 0.8f);
    device.note_on(99, 277.18f, 0.8f);
    Stereo both = render(device, 0.4f, kRate);
    EXPECT(tone_level(both.left, 233.08, kRate, at(0.2)) > 0.01 && tone_level(both.left, 277.18, kRate, at(0.2)) > 0.01,
           "two keys that both have to steal both sound");
    // A key let go before its stolen voice has faded never starts, and
    // nothing is left hanging once the others are released.
    mellow(device);
    for (int n = 0; n < Dusk::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n / 12.0f), 0.8f);
    render(device, 0.6f, kRate);
    device.note_on(99, 880.0f, 0.8f);
    device.note_off(99);
    Stereo never = render(device, 0.4f, kRate);
    EXPECT(tone_level(never.left, 880.0, kRate, at(0.1)) < 1.0e-4, "a stolen voice released before it starts stays silent");
    for (int n = 0; n < Dusk::kMaxVoices; ++n) device.note_off(n);
    Stereo rest = render(device, 3.0f, kRate);
    EXPECT(peak(rest.left, at(2.5)) == 0.0, "and every voice ends");
  }

  // Striking a held key again.
  {
    mellow(device);
    device.note_on(1, 220.0f, 0.8f);
    Stereo before = render(device, 0.6f, kRate);
    const double steady = max_step(before.left, at(0.4));
    device.note_on(1, 220.0f, 0.8f);
    Stereo after = render(device, 0.3f, kRate);
    Stereo joined = concat(before, after);
    const double struck = max_step(joined.left, at(0.6) - 2);
    std::printf("  re-strike: largest step %.5f against %.5f held\n", struck, steady);
    EXPECT(struck < 2.5 * steady, "striking a held key again does not click");
    // Releasing it lets the whole key go, and nothing is left hanging.
    device.note_off(1);
    Stereo tail = render(device, 2.5f, kRate);
    Stereo all = concat(joined, tail);
    EXPECT(max_step(all.left, at(0.9) - 2) < 1.5 * steady, "note off does not click");
    EXPECT(peak(tail.left, at(2.0)) == 0.0, "and the key is fully released");
  }

  // Cutoff moved in one step while a note sounds, up and down.
  {
    plain(device);
    device.note_on(1, 110.0f, 0.8f);
    device.set_param(p::kCutoff, 300.0f);
    Stereo dark = render(device, 0.5f, kRate);
    device.set_param(p::kCutoff, 2500.0f);
    Stereo bright = render(device, 0.5f, kRate);
    device.set_param(p::kCutoff, 300.0f);
    Stereo dark_again = render(device, 0.5f, kRate);
    const double bright_steady = max_step(bright.left, at(0.3));
    const double up = max_step(concat(dark, bright).left, at(0.5) - 2, at(0.7));
    const double down = max_step(concat(bright, dark_again).left, at(0.5) - 2, at(0.7));
    std::printf("  cutoff step: up %.5f, down %.5f, the bright note's own %.5f\n", up, down, bright_steady);
    EXPECT(up < 1.2 * bright_steady && down < 1.2 * bright_steady, "moving Cutoff while sounding does not click");
    EXPECT(max_step(dark_again.left, at(0.3)) < 0.5 * bright_steady, "(and the dark note is the smoother one)");
  }

  // Chorus mode changed while a note sounds: the delay time never jumps.
  {
    const int changes[][2] = {{Chorus::kOne, Chorus::kBoth}, {Chorus::kBoth, Chorus::kTwo},
                              {Chorus::kTwo, Chorus::kOff},  {Chorus::kOff, Chorus::kOne}};
    for (const auto& change : changes) {
      mellow(device);
      device.set_param(p::kChorus, static_cast<float>(change[0]));
      device.note_on(1, 220.0f, 0.8f);
      Stereo before = render(device, 0.8f, kRate);
      device.set_param(p::kChorus, static_cast<float>(change[1]));
      Stereo after = render(device, 0.5f, kRate);
      Stereo joined = concat(before, after);
      // The reference is the larger of the two modes' own steps (the hiss
      // of a mode that is on is part of them).
      const double steady = std::max(std::max(max_step(before.left, at(0.4)), max_step(before.right, at(0.4))),
                                     std::max(max_step(after.left, at(0.3)), max_step(after.right, at(0.3))));
      const double moved = std::max(max_step(joined.left, at(0.8) - 2, at(1.1)), max_step(joined.right, at(0.8) - 2, at(1.1)));
      char label[160];
      std::snprintf(label, sizeof label, "chorus mode %d to %d does not click (step %.5f against %.5f)", change[0],
                    change[1], moved, steady);
      EXPECT(moved < 1.3 * steady, label);
    }
  }

  // Wave changed while a note sounds: the waves crossfade.
  {
    mellow(device);
    device.set_param(p::kCutoff, 2.0f * kMiddleC);
    device.note_on(1, 220.0f, 0.8f);
    Stereo before = render(device, 0.5f, kRate);
    device.set_param(p::kWave, Dusk::kSaw);
    Stereo after = render(device, 0.5f, kRate);
    const double steady = std::max(max_step(before.left, at(0.3)), max_step(after.left, at(0.3)));
    EXPECT(max_step(concat(before, after).left, at(0.5) - 2) < 1.3 * steady, "changing Wave while sounding does not click");
  }
}

// --- levels ----------------------------------------------------------------------------------

static void test_levels() {
  char label[160];
  // One key of the default patch: the recipe's range at gain 0.7, and the
  // narrower one the app expects at the gain it plays notes with.
  struct Range {
    float gain;
    double lowest, highest;
  };
  for (float hz : {65.406f, 261.63f, 1046.5f}) {
    for (const Range& range : {Range{0.7f, -24.0, -10.0}, Range{0.8f, -22.0, -16.0}}) {
      device.init(kRate);
      device.note_on(1, hz, range.gain);
      Stereo out = render(device, 4.0f, kRate);
      const double level = db(std::max(peak(out.left), peak(out.right)));
      std::snprintf(label, sizeof label, "one key (%.0f Hz) at gain %.1f peaks between %.0f and %.0f dBFS (%.1f)", hz,
                    range.gain, range.lowest, range.highest, level);
      EXPECT(level > range.lowest && level < range.highest, label);
    }
  }

  // Gain moves the level, gently: the originals have no velocity.
  {
    plain(device);
    device.note_on(1, 220.0f, 1.0f);
    Stereo loud = render(device, 0.5f, kRate);
    plain(device);
    device.note_on(1, 220.0f, 0.1f);
    Stereo soft = render(device, 0.5f, kRate);
    const double range = db(rms(soft.left, 12000) / rms(loud.left, 12000));
    std::printf("  gain 0.1 against gain 1: %.1f dB\n", range);
    EXPECT(range < -3.0 && range > -9.0, "soft keys are a little quieter");
  }

  // Ten held keys stay clean: the soft clip's knee is not reached at the
  // default volume.
  {
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    const double top = std::max(peak(out.left), peak(out.right));
    std::printf("  ten keys at the default volume peak at %.3f\n", top);
    EXPECT(top < 0.5, "ten keys stay under the clip knee");
  }
}
