// Native harness for Choir (cpp/devices/choir). The conformance pass covers
// silence before and after notes, voice stealing under a pile of notes,
// parameter abuse and other sample rates; the rest asserts what makes it a
// choir: vowels where the tables say, a morph that does not click, singers
// that drift, shake and beat, and breath that takes the vowel's shape.

#include "../devices/choir/choir.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Choir;
namespace p = livemix::choir;

static Choir device;

static const float kRate = 48000.0f;

// One steady singer per note on a male tract: no section, vibrato, breath or
// drifting vowel in the way, fast envelope, tone filter open.
static void solo(Choir& d, float vowel) {
  d.init(kRate);
  d.set_param(p::kVowel, vowel);
  d.set_param(p::kVoice, 1.0f);
  d.set_param(p::kMotion, 0.0f);
  d.set_param(p::kBreath, 0.0f);
  d.set_param(p::kEnsemble, 0.0f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kAttack, 0.01f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kTone, 12000.0f);
  d.set_param(p::kVolume, 0.0f);
}

static const float kAh = 0.0f, kEe = 0.5f, kOo = 1.0f;

// Level of the harmonics of `f0` that fall in [lo, hi) Hz, over the window.
static double band(const std::vector<float>& x, double f0, double lo, double hi, size_t from, size_t to) {
  double sum = 0.0;
  for (int h = 1; h * f0 < hi; ++h) {
    if (h * f0 < lo) continue;
    const double level = tone_level(x, h * f0, kRate, from, to);
    sum += level * level;
  }
  return std::sqrt(sum);
}

// The same for sound with no harmonics: components every 10 Hz.
static double noise_band(const std::vector<float>& x, double lo, double hi, size_t from, size_t to) {
  double sum = 0.0;
  for (double hz = lo; hz < hi; hz += 10.0) {
    const double level = tone_level(x, hz, kRate, from, to);
    sum += level * level;
  }
  return std::sqrt(sum);
}

// The pitch of the fundamental over time in cents from `f0`, one value per
// millisecond (so entry m is the pitch at m ms, and the track's sample rate
// is kTrackRate). The signal is shifted down by f0 and averaged twice over
// two whole periods, which nulls every other harmonic; how fast the phase
// of what is left turns is the deviation.
static const double kTrackRate = 1000.0;
static std::vector<float> pitch_track(const std::vector<float>& x, double f0, std::vector<float>* power = nullptr) {
  const size_t n = x.size();
  const size_t box = static_cast<size_t>(std::lround(2.0 * kRate / f0));
  const size_t hop = static_cast<size_t>(kRate / kTrackRate);
  std::vector<double> re(n), im(n);
  for (size_t i = 0; i < n; ++i) {
    const double phase = 2.0 * kPi * f0 * static_cast<double>(i) / kRate;
    re[i] = x[i] * std::cos(phase);
    im[i] = -x[i] * std::sin(phase);
  }
  for (int pass = 0; pass < 2; ++pass) {
    for (std::vector<double>* part : {&re, &im}) {
      std::vector<double>& v = *part;
      std::vector<double> sum(n + 1, 0.0);
      for (size_t i = 0; i < n; ++i) sum[i + 1] = sum[i] + v[i];
      for (size_t i = 0; i < n; ++i) v[i] = i + 1 >= box ? sum[i + 1] - sum[i + 1 - box] : 0.0;
    }
  }
  // Both averages together lag by box - 1 samples.
  std::vector<float> track;
  for (size_t centre = 0; centre + box - 1 + hop < n; centre += hop) {
    const size_t i = centre + box - 1;
    float cents = 0.0f;
    if (centre >= box) {
      const double turn = std::atan2(im[i + hop] * re[i] - re[i + hop] * im[i], re[i + hop] * re[i] + im[i + hop] * im[i]);
      const double hz = f0 + turn * kRate / (2.0 * kPi * static_cast<double>(hop));
      cents = static_cast<float>(1200.0 * std::log2(std::max(hz, 1.0) / f0));
    }
    track.push_back(cents);
    if (power) power->push_back(static_cast<float>(re[i] * re[i] + im[i] * im[i]));
  }
  return track;
}

// The pitch a listener would name, in cents from `f0`: the track averaged
// by power, which is the centre of gravity of the fundamental's spectrum
// (so three singers a few cents apart count equally).
static double mean_pitch(const std::vector<float>& x, double f0, size_t from_ms) {
  std::vector<float> power;
  const std::vector<float> track = pitch_track(x, f0, &power);
  double sum = 0.0, weight = 0.0;
  for (size_t i = from_ms; i < track.size(); ++i) {
    sum += static_cast<double>(power[i]) * track[i];
    weight += power[i];
  }
  return weight > 0.0 ? sum / weight : 0.0;
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

// Standard deviation of a stretch of a track.
static double spread(const std::vector<float>& x, size_t from, size_t to) {
  const double m = mean(x, from, to);
  double sum = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) sum += (x[i] - m) * (x[i] - m);
  return std::sqrt(sum / static_cast<double>(to - from));
}

// Lowest and highest level of the `hz` component over consecutive windows.
static void level_range(const std::vector<float>& x, double hz, size_t from, size_t window, double* lo, double* hi) {
  *lo = 1.0e9;
  *hi = 0.0;
  for (size_t start = from; start + window <= x.size(); start += window / 2) {
    const double level = tone_level(x, hz, kRate, start, start + window);
    *lo = std::min(*lo, level);
    *hi = std::max(*hi, level);
  }
}

// Frequency of the strongest harmonic of `f0` in [lo, hi] Hz.
static double peak_harmonic(const std::vector<float>& x, double f0, double lo, double hi, size_t from, size_t to) {
  double best = -1.0, best_hz = 0.0;
  for (int h = 1; h * f0 <= hi; ++h) {
    if (h * f0 < lo) continue;
    const double level = tone_level(x, h * f0, kRate, from, to);
    if (level > best) {
      best = level;
      best_hz = h * f0;
    }
  }
  return best_hz;
}

int main() {
  Conformance spec;
  spec.name = "choir";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  const size_t kSecond = static_cast<size_t>(kRate);

  // The source on its own: a glottal pulse with no DC whose harmonics fall
  // 6 dB per octave, and band-limited: at a soprano's top notes what folds
  // back under 6 kHz (where the formants would amplify it) is 60 dB down,
  // against about 30 dB for the same waveform sampled naively.
  {
    livemix::choir_dsp::GlottalPulse pulse;
    pulse.reset(0.0f, 0.66f);
    std::vector<float> low(kSecond);
    for (float& v : low) {
      pulse.advance(110.0f / kRate);
      v = pulse.derivative(110.0f / kRate);
    }
    EXPECT(std::fabs(mean(low)) < 1.0e-3, "the pulse carries no DC");
    double flattest = 1.0e9, steepest = 0.0;
    for (int h = 1; h <= 40; ++h) {
      const double scaled = h * tone_level(low, 110.0 * h, kRate);
      flattest = std::min(flattest, scaled);
      steepest = std::max(steepest, scaled);
    }
    EXPECT(db(steepest / flattest) < 5.0, "the pulse's harmonics fall 6 dB per octave");

    for (float f0 : {1318.5f, 2637.0f}) {
      pulse.reset(0.0f, 0.66f);
      std::vector<float> high(kSecond / 2), naive(kSecond / 2);
      float phase = 0.0f;
      for (size_t i = 0; i < high.size(); ++i) {
        pulse.advance(f0 / kRate);
        high[i] = pulse.derivative(f0 / kRate);
        phase += f0 / kRate;
        if (phase >= 1.0f) phase -= 1.0f;
        const float x = phase / 0.66f;
        naive[i] = phase < 0.66f ? x * (2.0f - 3.0f * x) : 0.0f;
      }
      double folded = 0.0, naive_folded = 0.0;
      for (double hz = 60.0; hz < 6000.0; hz += 11.0) {
        if (std::fabs(hz - std::round(hz / f0) * f0) < 60.0) continue;
        folded = std::max(folded, tone_level(high, hz, kRate));
        naive_folded = std::max(naive_folded, tone_level(naive, hz, kRate));
      }
      const double fundamental = tone_level(high, f0, kRate);
      EXPECT(db(folded / fundamental) < -60.0, "the pulse is band-limited: aliases under 6 kHz are 60 dB down");
      EXPECT(db(naive_folded / fundamental) > -40.0, "(and the alias measurement does see a naive pulse)");
    }
  }

  // Vowels sit where the tables say. A 55 Hz note puts a harmonic within
  // 27.5 Hz of anything; the strongest one near each formant marks it.
  // Peterson and Barney's men: Ah 730 and 1090 Hz, Ee 270 and 2290 Hz.
  {
    solo(device, kAh);
    device.note_on(1, 55.0f, 0.8f);
    Stereo ah = render(device, 2.0f, kRate);
    solo(device, kEe);
    device.note_on(1, 55.0f, 0.8f);
    Stereo ee = render(device, 2.0f, kRate);
    const size_t from = kSecond, to = 2 * kSecond;
    EXPECT_NEAR(peak_harmonic(ah.left, 55.0, 450.0, 900.0, from, to), 730.0, 40.0, "Ah: first formant near 730 Hz");
    EXPECT_NEAR(peak_harmonic(ah.left, 55.0, 950.0, 1500.0, from, to), 1090.0, 40.0, "Ah: second formant near 1090 Hz");
    EXPECT_NEAR(peak_harmonic(ah.left, 55.0, 1900.0, 2900.0, from, to), 2440.0, 60.0, "Ah: third formant near 2440 Hz");
    EXPECT_NEAR(peak_harmonic(ee.left, 55.0, 100.0, 700.0, from, to), 270.0, 40.0, "Ee: first formant near 270 Hz");
    EXPECT_NEAR(peak_harmonic(ee.left, 55.0, 1500.0, 2650.0, from, to), 2290.0, 50.0, "Ee: second formant near 2290 Hz");
    EXPECT_NEAR(peak_harmonic(ee.left, 55.0, 2700.0, 3250.0, from, to), 3010.0, 60.0, "Ee: third formant near 3010 Hz");

    // Where the energy is, and that it changes places between the vowels:
    // low is Ee's first formant, middle is Ah's pair, high is Ee's upper pair.
    const double ah_low = band(ah.left, 55.0, 150.0, 450.0, from, to);
    const double ah_middle = band(ah.left, 55.0, 600.0, 1300.0, from, to);
    const double ah_high = band(ah.left, 55.0, 2000.0, 3200.0, from, to);
    const double ee_low = band(ee.left, 55.0, 150.0, 450.0, from, to);
    const double ee_middle = band(ee.left, 55.0, 600.0, 1300.0, from, to);
    const double ee_high = band(ee.left, 55.0, 2000.0, 3200.0, from, to);
    EXPECT(ah_middle > 2.0 * ah_low && ah_middle > 10.0 * ah_high, "Ah: the energy is in the 600 to 1300 Hz band");
    EXPECT(ee_low > 10.0 * ee_middle, "Ee: the first formant is low and the middle is empty");
    EXPECT(ee_high > 2.0 * ee_middle, "Ee: more energy around 2 to 3 kHz than in Ah's band, the reverse of Ah");
    // The upper formants are at the heights measured for speech (Peterson
    // and Barney give F3 28 dB under F1 for Ah and F2 20 dB under for Ee).
    const double ah_f1 = tone_level(ah.left, 715.0, kRate, from, to);
    const double ah_f3 = tone_level(ah.left, 2420.0, kRate, from, to);
    EXPECT(db(ah_f3 / ah_f1) > -38.0 && db(ah_f3 / ah_f1) < -20.0, "Ah: the third formant is 20 to 38 dB under the first");
  }

  // Voice scales every formant by the factor it shows: 1.2 moves Ee's
  // second formant from 2290 to 2748 Hz and Ah's first from 730 to 876 Hz.
  {
    const size_t from = kSecond, to = 2 * kSecond;
    double f2[2], f1[2];
    const float scales[2] = {1.0f, 1.2f};
    for (int i = 0; i < 2; ++i) {
      solo(device, kEe);
      device.set_param(p::kVoice, scales[i]);
      device.note_on(1, 55.0f, 0.8f);
      Stereo ee = render(device, 2.0f, kRate);
      f2[i] = peak_harmonic(ee.left, 55.0, 1500.0, 3100.0 * scales[i] - 500.0, from, to);
      solo(device, kAh);
      device.set_param(p::kVoice, scales[i]);
      device.note_on(1, 55.0f, 0.8f);
      Stereo ah = render(device, 2.0f, kRate);
      f1[i] = peak_harmonic(ah.left, 55.0, 450.0, 1000.0, from, to);
    }
    EXPECT_NEAR(f2[1], 2290.0 * 1.2, 55.0, "Voice 1.2 puts Ee's second formant at 2748 Hz");
    EXPECT_NEAR(f2[1] / f2[0], 1.2, 0.04, "Voice scales the second formant by its factor");
    EXPECT_NEAR(f1[1], 730.0 * 1.2, 40.0, "Voice 1.2 puts Ah's first formant at 876 Hz");
  }

  // The vowel can be moved while a chord sounds: a jump from Ah to Oo (past
  // Eh, Ee and Oh) glides, and neither it nor a slow sweep makes a step
  // larger than the vowels themselves do.
  {
    double steady = 0.0;
    for (int step = 0; step <= 32; ++step) {
      solo(device, static_cast<float>(step) / 32.0f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo held = render(device, 0.5f, kRate);
      steady = std::max(steady, max_step(held.left, kSecond / 4));
    }
    solo(device, kAh);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 1.0f, kRate);
    Stereo unmoved = render(device, 1.0f, kRate);
    solo(device, kAh);
    device.note_on(1, 220.0f, 0.8f);
    Stereo before = render(device, 1.0f, kRate);
    device.set_param(p::kVowel, 1.0f);
    Stereo jump = render(device, 1.0f, kRate);
    Stereo sweep;
    for (int block = 0; block < 375; ++block) {
      device.set_param(p::kVowel, 1.0f - static_cast<float>(block) / 374.0f);
      sweep = concat(sweep, render(device, 128.0f / kRate, kRate));
    }
    EXPECT(max_step(jump.left) < 1.2 * steady, "a vowel jump mid-note does not click");
    EXPECT(max_step(sweep.left) < 1.2 * steady, "a vowel sweep mid-note does not click");
    EXPECT(peak(jump.left) < 1.5 * peak(before.left, kSecond / 2), "a vowel jump does not thump");
    // ... and it did change the vowel: Oo has almost nothing at Ah's F2.
    const double f2_before = band(before.left, 220.0, 1000.0, 1400.0, kSecond / 2, kSecond);
    const double f2_after = band(jump.left, 220.0, 1000.0, 1400.0, kSecond / 2, kSecond);
    EXPECT(f2_after < 0.1 * f2_before, "after the jump the vowel is Oo");
    // The change grows out of the note as it was: against the same note
    // left alone, nothing differs in the first millisecond and everything
    // does a tenth of a second later.
    std::vector<float> change(jump.left.size());
    for (size_t i = 0; i < change.size(); ++i) change[i] = jump.left[i] - unmoved.left[i];
    EXPECT(peak(change, 0, 48) < 0.05 * peak(unmoved.left), "the vowel glides away from where it was");
    EXPECT(rms(change, 4800, 9600) > 0.5 * rms(unmoved.left), "and has left within a tenth of a second");
  }

  // Pitch. One singer holds the note asked for, with the small unsteadiness
  // of a voice: slow drift and cycle-to-cycle jitter, a few cents in all.
  {
    for (float hz : {110.0f, 220.0f, 523.25f}) {
      solo(device, kOo);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 5.0f, kRate);
      const double cents = mean_pitch(out.left, hz, 300);
      const std::vector<float> track = pitch_track(out.left, hz);
      EXPECT(std::fabs(cents) < 2.0, "one singer averages within 2 cents of the note");
      EXPECT(spread(track, 300, 4900) > 0.2 && spread(track, 300, 4900) < 4.0,
             "a voice is unsteady by a fraction of a cent to a few cents, with vibrato off");
    }
    // A full section still centres on the note (the sharp singer stands on
    // one side and the flat one on the other, so listen to the middle).
    solo(device, kOo);
    device.set_param(p::kEnsemble, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo section = render(device, 8.0f, kRate);
    EXPECT(std::fabs(mean_pitch(mid(section), 220.0, 500)) < 5.0, "a section of three averages within 5 cents of the note");
    device.init(kRate);
    device.set_param(p::kVibrato, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo defaults = render(device, 8.0f, kRate);
    EXPECT(std::fabs(mean_pitch(mid(defaults), 220.0, 1500)) < 5.0, "the default patch is in tune with vibrato off");
  }

  // Vibrato: the depth and rate asked for, and none at the start of a note
  // (a singer settles on the pitch first).
  {
    const float depths[2] = {30.0f, 60.0f};
    const float rates[2] = {5.5f, 4.0f};
    for (int i = 0; i < 2; ++i) {
      solo(device, kOo);
      device.set_param(p::kVibrato, depths[i]);
      device.set_param(p::kVibratoRate, rates[i]);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 4.5f, kRate);
      const std::vector<float> track = pitch_track(out.left, 220.0);
      const double rate = dominant_frequency(track, kTrackRate, 2.0, 12.0, 1500, 4400);
      const double depth = tone_level(track, rate, kTrackRate, 1500, 4400);
      EXPECT_NEAR(rate, rates[i], 0.1, "vibrato runs at the rate asked for");
      EXPECT_NEAR(depth, depths[i], 0.08 * depths[i], "vibrato swings by the depth asked for");
      EXPECT(spread(track, 30, 250) < 0.15 * spread(track, 1500, 4400), "no vibrato in the first quarter second");
      EXPECT(spread(track, 250, 600) > 2.0 * spread(track, 30, 250) &&
                 spread(track, 250, 600) < 0.6 * spread(track, 1500, 4400),
             "vibrato comes in gradually");
      EXPECT(std::fabs(mean(track, 1500, 4400)) < 5.0, "vibrato swings around the note");
    }
  }

  // Ensemble. One singer is mono and steady; a section beats (the level of
  // a partial comes and goes as the singers drift past each other), is
  // spread across the image, and comes in one after another.
  {
    solo(device, kOo);
    device.note_on(1, 220.0f, 0.8f);
    Stereo one = render(device, 8.0f, kRate);
    EXPECT(one.left == one.right, "one singer with no breath is mono");
    double lo, hi;
    level_range(one.left, 220.0, kSecond, 4800, &lo, &hi);
    EXPECT(hi < 1.15 * lo, "one singer's fundamental is steady");

    solo(device, kOo);
    device.set_param(p::kEnsemble, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo three = render(device, 8.0f, kRate);
    const std::vector<float> centre = mid(three);
    level_range(centre, 220.0, kSecond, 4800, &lo, &hi);
    EXPECT(hi > 2.5 * lo, "a section beats: the fundamental's level comes and goes");
    EXPECT(correlation(three.left, three.right, kSecond) < 0.7, "a section is spread between left and right");
    const double total = std::sqrt(0.5 * (rms(three.left, kSecond) * rms(three.left, kSecond) +
                                          rms(three.right, kSecond) * rms(three.right, kSecond)));
    EXPECT(total > 0.7 * rms(one.left, kSecond) && total < 1.4 * rms(one.left, kSecond),
           "a section is about as loud as one singer");
    // The second and third singer come in tens of milliseconds late.
    EXPECT(rms(centre, 240, 1200) < 0.8 * rms(one.left, 240, 1200), "the section does not start all at once");

    solo(device, kOo);
    device.set_param(p::kEnsemble, 1.0f);
    device.set_param(p::kBreath, 0.5f);
    device.set_param(p::kWidth, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo narrow = render(device, 2.0f, kRate);
    EXPECT(narrow.left == narrow.right, "Width 0 folds the section and its breath to the centre");
  }

  // Breath is noise, not pitch; it takes the shape of the vowel, as loud at
  // Breath 1 as the voice itself, and it rushes in time with the folds. The
  // singer is the same with and without, so the difference is the breath.
  {
    const size_t from = kSecond, to = 2 * kSecond;
    std::vector<float> breath[2];
    double voice_rms[2];
    const float vowels[2] = {kAh, kEe};
    for (int i = 0; i < 2; ++i) {
      solo(device, vowels[i]);
      device.note_on(1, 55.0f, 0.8f);
      Stereo dry = render(device, 2.0f, kRate);
      solo(device, vowels[i]);
      device.set_param(p::kBreath, 1.0f);
      device.note_on(1, 55.0f, 0.8f);
      Stereo wet = render(device, 2.0f, kRate);
      breath[i].resize(dry.size());
      for (size_t n = 0; n < dry.size(); ++n) breath[i][n] = wet.left[n] - dry.left[n];
      voice_rms[i] = rms(dry.left, from, to);
      if (i == 0) {
        // Between the harmonics the singer has nothing and the breath has
        // as much as on them.
        double on = 0.0, off = 0.0, breath_on = 0.0, breath_off = 0.0;
        for (int h = 11; h <= 23; ++h) {
          on += tone_level(dry.left, 55.0 * h, kRate, from, to);
          off += tone_level(dry.left, 55.0 * h + 27.5, kRate, from, to);
          breath_on += tone_level(breath[0], 55.0 * h, kRate, from, to);
          breath_off += tone_level(breath[0], 55.0 * h + 27.5, kRate, from, to);
        }
        EXPECT(off < 0.02 * on, "the voice is harmonic");
        EXPECT(breath_off > 0.5 * breath_on && breath_off < 2.0 * breath_on, "the breath is noise");
      }
    }
    for (int i = 0; i < 2; ++i) {
      const double ratio = rms(breath[i], from, to) / voice_rms[i];
      EXPECT(ratio > 0.6 && ratio < 1.6, "Breath 1 is about as loud as the voice, whatever the vowel");
    }
    // Per hertz: Ah's breath lives at 600 to 1300 Hz, Ee's around 250 Hz and
    // 2 to 3.2 kHz with the middle empty, as their voices do.
    const double ah_middle = noise_band(breath[0], 600.0, 1300.0, from, to) / std::sqrt(700.0);
    const double ah_valley = noise_band(breath[0], 1500.0, 2100.0, from, to) / std::sqrt(600.0);
    const double ah_high = noise_band(breath[0], 2000.0, 3200.0, from, to) / std::sqrt(1200.0);
    const double ee_low = noise_band(breath[1], 150.0, 450.0, from, to) / std::sqrt(300.0);
    const double ee_middle = noise_band(breath[1], 600.0, 1300.0, from, to) / std::sqrt(700.0);
    const double ee_high = noise_band(breath[1], 2000.0, 3200.0, from, to) / std::sqrt(1200.0);
    EXPECT(ah_middle > 5.0 * ah_valley && ah_middle > 5.0 * ah_high, "Ah's breath is shaped by Ah's formants");
    EXPECT(ee_low > 5.0 * ee_middle && ee_high > 3.0 * ee_middle, "Ee's breath is shaped by Ee's formants");

    // Breath 0.5 is a quarter of that (the knob is squared).
    solo(device, kAh);
    device.note_on(1, 55.0f, 0.8f);
    Stereo dry = render(device, 2.0f, kRate);
    solo(device, kAh);
    device.set_param(p::kBreath, 0.5f);
    device.note_on(1, 55.0f, 0.8f);
    Stereo half = render(device, 2.0f, kRate);
    std::vector<float> quarter(dry.size());
    for (size_t n = 0; n < dry.size(); ++n) quarter[n] = half.left[n] - dry.left[n];
    EXPECT_NEAR(rms(quarter, from, to) / rms(breath[0], from, to), 0.25, 0.02, "Breath 0.5 is 12 dB under Breath 1");

    // The rush follows the glottal cycle: the breath's envelope has a
    // component at the note's frequency.
    std::vector<float> envelope(breath[0].size());
    for (size_t n = 0; n < envelope.size(); ++n) envelope[n] = std::fabs(breath[0][n]);
    const double pulsing = tone_level(envelope, 55.0, kRate, from, to) / mean(envelope, from, to);
    const double elsewhere = tone_level(envelope, 71.0, kRate, from, to) / mean(envelope, from, to);
    EXPECT(pulsing > 0.15 && pulsing > 4.0 * elsewhere, "the breath pulses with the voice");
  }

  // Attack and release are the times they say, up to the long ones a pad
  // lives in.
  {
    solo(device, kOo);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo rise = render(device, 2.0f, kRate);
    const double full = rms(rise.left, 72000, 96000);
    EXPECT(rms(rise.left, 0, 4800) < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise.left, 52800, 57600) > 0.9 * full, "and has arrived shortly after 1 s");
    device.note_off(1);
    Stereo fall = render(device, 3.0f, kRate);
    EXPECT(rms(fall.left, 19200, 24000) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall.left, 48000, 52800) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, 96000, 144000) == 0.0, "and is exactly silent soon after");

    solo(device, kOo);
    device.set_param(p::kAttack, 10.0f);
    device.set_param(p::kRelease, 15.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo slow = render(device, 11.0f, kRate);
    const double arrived = rms(slow.left, 10 * kSecond + 24000, 11 * kSecond);
    const double third = rms(slow.left, 3 * kSecond - 4800, 3 * kSecond + 4800) / arrived;
    device.note_off(1);
    Stereo fade = render(device, 16.0f, kRate);
    const double at_five = rms(fade.left, 5 * kSecond - 4800, 5 * kSecond + 4800) / arrived;
    EXPECT(third > 0.3 && third < 0.6, "a 10 s attack is half way up at 3 s");
    EXPECT(rms(slow.left, 9 * kSecond + 24000, 10 * kSecond) < 0.995 * arrived, "and still rising in its last second");
    EXPECT(at_five > 0.05 && at_five < 0.2, "a 15 s release is 20 dB down after 5 s");
    EXPECT(rms(fade.left, 15 * kSecond, 15 * kSecond + 9600) < 0.002 * arrived, "and 60 dB down after 15 s");
  }

  // Tone darkens everything above it and leaves the fundamental.
  {
    solo(device, kAh);
    device.note_on(1, 110.0f, 0.8f);
    Stereo bright = render(device, 1.0f, kRate);
    solo(device, kAh);
    device.set_param(p::kTone, 800.0f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo dark = render(device, 1.0f, kRate);
    const size_t from = kSecond / 2, to = kSecond;
    EXPECT(band(dark.left, 110.0, 2000.0, 3200.0, from, to) < 0.15 * band(bright.left, 110.0, 2000.0, 3200.0, from, to),
           "Tone at 800 Hz takes the third formant away");
    EXPECT(tone_level(dark.left, 110.0, kRate, from, to) > 0.9 * tone_level(bright.left, 110.0, kRate, from, to),
           "and leaves the fundamental");
  }

  // Motion lets the vowel drift: held still, the balance of a partial near
  // Ah's second formant does not move; with Motion it wanders slowly as the
  // formant slides away towards Eh and back.
  {
    double lo, hi;
    solo(device, 0.1f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo still = render(device, 30.0f, kRate);
    level_range(still.left, 1100.0, kSecond, 12000, &lo, &hi);
    // (The singer's own drift of a cent or two moves it a little.)
    EXPECT(hi < 1.25 * lo, "with Motion 0 the vowel stays put");

    solo(device, 0.1f);
    device.set_param(p::kMotion, 1.0f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo moving = render(device, 30.0f, kRate);
    level_range(moving.left, 1100.0, kSecond, 12000, &lo, &hi);
    // Slow: from one eighth of a second to the next the partial barely
    // changes; the drift takes seconds.
    double fastest = 0.0;
    for (size_t start = kSecond; start + 18000 <= moving.size(); start += 6000) {
      const double a = tone_level(moving.left, 1100.0, kRate, start, start + 12000);
      const double b = tone_level(moving.left, 1100.0, kRate, start + 6000, start + 18000);
      fastest = std::max(fastest, std::fabs(db(b / a)));
    }
    EXPECT(hi > 4.0 * lo, "with Motion the vowel moves");
    EXPECT(fastest < 0.3 * db(hi / lo), "and it moves slowly: an eighth of a second covers little of the way");
    // The loudness does not ride up and down with it.
    double quietest = 1.0e9, loudest = 0.0;
    for (size_t start = kSecond; start + 24000 <= moving.size(); start += 12000) {
      const double level = rms(moving.left, start, start + 24000);
      quietest = std::min(quietest, level);
      loudest = std::max(loudest, level);
    }
    EXPECT(loudest < 1.3 * quietest, "a drifting vowel keeps its loudness");
  }

  // Every note is sung at the same loudness: without levelling a harmonic
  // on a formant would be 10 dB louder than its neighbour, and Ee above
  // the staff 30 dB weaker than Ah.
  {
    double quietest = 1.0e9, loudest = 0.0;
    for (int vowel = 0; vowel <= 4; ++vowel) {
      for (float hz : {82.41f, 110.0f, 146.83f, 220.0f, 311.13f, 440.0f, 587.33f, 880.0f}) {
        solo(device, 0.25f * static_cast<float>(vowel));
        device.note_on(1, hz, 0.8f);
        Stereo out = render(device, 1.0f, kRate);
        const double level = rms(out.left, kSecond / 2);
        quietest = std::min(quietest, level);
        loudest = std::max(loudest, level);
      }
    }
    EXPECT(db(loudest / quietest) < 3.0, "every vowel and pitch from E2 to A5 is within 3 dB");
  }

  // Loudness and brightness follow velocity: a soft note is quieter and
  // has less of its upper formants.
  {
    const size_t from = kSecond / 2, to = kSecond;
    solo(device, kAh);
    device.note_on(1, 110.0f, 1.0f);
    Stereo loud = render(device, 1.0f, kRate);
    solo(device, kAh);
    device.note_on(1, 110.0f, 0.1f);
    Stereo soft = render(device, 1.0f, kRate);
    const double loud_tilt = band(loud.left, 110.0, 2000.0, 3200.0, from, to) / band(loud.left, 110.0, 600.0, 1300.0, from, to);
    const double soft_tilt = band(soft.left, 110.0, 2000.0, 3200.0, from, to) / band(soft.left, 110.0, 600.0, 1300.0, from, to);
    EXPECT(rms(soft.left, from, to) < 0.5 * rms(loud.left, from, to), "soft notes are quieter");
    EXPECT(soft_tilt < 0.7 * loud_tilt, "and darker");
  }

  // Levels at the default patch: one note sits near -20 dBFS and ten held
  // notes stay under the soft clip's knee at 0.5, where it is still exactly
  // linear.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 6.0f, kRate);
    const double level_db = db(std::max(peak(one.left), peak(one.right)));
    EXPECT(level_db > -24.0 && level_db < -10.0, "one note at gain 0.7 peaks between -24 and -10 dBFS");
    EXPECT(correlation(one.left, one.right, 2 * kSecond) < 0.9, "the default patch is wide");

    device.init(kRate);
    device.note_on(1, 220.0f, 0.8f);
    Stereo louder = render(device, 6.0f, kRate);
    EXPECT_NEAR(db(std::max(peak(louder.left), peak(louder.right))), -20.0, 3.0, "one note at gain 0.8 peaks near -20 dBFS");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo chord = render(device, 8.0f, kRate);
    EXPECT(peak(chord.left) < 0.5 && peak(chord.right) < 0.5, "ten held notes stay under the clip knee");
  }

  // The same chord whatever the host's block size (the control clock, not
  // the block, paces the drift, the vibrato and the formants).
  {
    Stereo renders[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kMotion, 1.0f);
      device.set_param(p::kVibrato, 30.0f);
      device.set_param(p::kBreath, 0.5f);
      device.note_on(1, 146.83f, 0.7f);
      device.note_on(2, 220.0f, 0.7f);
      device.note_on(3, 277.18f, 0.7f);
      if (pass == 0) {
        renders[0] = render(device, 1.0f, kRate, 128);
        device.set_param(p::kVowel, 0.7f);
        renders[0] = concat(renders[0], render(device, 1.0f, kRate, 128));
      } else {
        const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
        int which = 0;
        size_t done = 0;
        while (done < 2 * kSecond) {
          // The vowel moves at the same sample in both renders.
          const size_t limit = done < kSecond ? kSecond : 2 * kSecond;
          const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), limit - done));
          renders[1] = concat(renders[1], run(device, std::vector<float>(frames, 0.0f), frames));
          done += frames;
          if (done == kSecond) device.set_param(p::kVowel, 0.7f);
        }
      }
    }
    double worst = 0.0;
    for (size_t i = 0; i < renders[0].size() && i < renders[1].size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(renders[0].left[i]) - renders[1].left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(renders[0].right[i]) - renders[1].right[i]));
    }
    EXPECT(renders[0].size() == renders[1].size() && worst < 1.0e-5, "output does not depend on block size");
  }

  // A knob turned while nothing sounds has simply moved: the next note
  // starts on the new vowel instead of gliding to it.
  {
    device.init(kRate);
    device.set_param(p::kVowel, 0.5f);
    device.set_param(p::kVoice, 1.3f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo direct = render(device, 0.5f, kRate);
    device.init(kRate);
    render(device, 0.3f, kRate);
    device.set_param(p::kVowel, 0.5f);
    device.set_param(p::kVoice, 1.3f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo later = render(device, 0.5f, kRate);
    EXPECT(direct.left == later.left && direct.right == later.right, "a vowel set while idle is there at the next note");
  }

  // Cost with every voice sounding.
  device.init(kRate);
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  report_cost("choir (12 notes)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("choir");
}
