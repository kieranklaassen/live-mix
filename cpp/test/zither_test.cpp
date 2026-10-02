// Native harness for Zither (cpp/devices/zither). The conformance pass covers
// silence before and after notes, a pile of keys, parameter abuse and other
// sample rates; the rest asserts what makes it a box of strings.

#include "../devices/zither/zither.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Zither;
namespace p = livemix::zither;

static Zither device;

static const float kRate = 48000.0f;

// One bare string per key: no second string, no sympathetic strings, no chord.
static void plain(Zither& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kCourses, 0.0f);
  d.set_param(p::kSympathy, 0.0f);
  d.set_param(p::kChord, 0.0f);
  d.set_param(p::kRoll, 0.0f);
}

static std::vector<float> mono(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// Amplitude-weighted mean frequency of x[from, to), by Goertzel on a 20 Hz grid up to 12 kHz.
static double spectral_centroid(const std::vector<float>& x, size_t from, size_t to) {
  double weighted = 0.0, total = 0.0;
  for (double hz = 40.0; hz <= 12000.0; hz += 20.0) {
    const double level = tone_level(x, hz, kRate, from, to);
    weighted += hz * level * level;
    total += level * level;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// How long the first edge of a blow takes from 5 % to 50 % of the largest sample, in ms.
static double rise_ms(const std::vector<float>& x) {
  const double most = peak(x);
  double start = -1.0;
  for (size_t i = 0; i < x.size(); ++i) {
    const double size = std::fabs(static_cast<double>(x[i]));
    if (start < 0.0 && size > 0.05 * most) start = static_cast<double>(i);
    if (size > 0.5 * most) return (static_cast<double>(i) - start) * 1000.0 / kRate;
  }
  return 0.0;
}

// When the component at `hz` first reaches a third of the most it reaches, in
// seconds (the window puts every onset early by the same few milliseconds).
static double onset(const std::vector<float>& x, double hz, double rate = kRate) {
  const size_t window = at(0.06, rate), hop = at(0.002, rate);
  // Silence in front, so a string that starts at once is timed like the others.
  std::vector<float> padded(window, 0.0f);
  padded.insert(padded.end(), x.begin(), x.end());
  std::vector<double> level;
  double most = 0.0;
  for (size_t from = 0; from + window <= padded.size(); from += hop) {
    level.push_back(tone_level(padded, hz, rate, from, from + window));
    most = std::max(most, level.back());
  }
  for (size_t i = 0; i < level.size(); ++i) {
    if (level[i] > most / 3.0) return (static_cast<double>(i * hop + window / 2) - static_cast<double>(window)) / rate;
  }
  return -1.0;
}

int main() {
  Conformance spec;
  spec.name = "zither";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 30.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // 1. Tuning: within 3 cents from 65 Hz to 2 kHz, at any brightness (the
  // loss filter's delay is taken off the string) and at the other rates.
  {
    const float notes[9] = {65.41f, 98.0f, 146.83f, 220.0f, 329.63f, 493.88f, 783.99f, 1318.5f, 2093.0f};
    double worst = 0.0;
    for (int n = 0; n < 9; ++n) {
      const float rate = n % 3 == 0 ? 44100.0f : (n % 3 == 1 ? 48000.0f : 96000.0f);
      plain(device, rate);
      device.set_param(p::kBrightness, n % 2 == 0 ? 0.1f : 0.9f);
      device.note_on(1, notes[n], 0.8f);
      Stereo out = render(device, 1.2f, rate);
      const double hz = dominant_frequency(out.left, rate, notes[n] * 0.97, notes[n] * 1.03, at(0.2, rate));
      worst = std::max(worst, std::fabs(1200.0 * std::log2(hz / notes[n])));
    }
    std::printf("tuning: worst error %.3f cents over nine notes, 65 Hz to 2.1 kHz\n", worst);
    EXPECT(worst < 3.0, "every string is within 3 cents of the pitch asked for");
  }

  // 2. Courses: the second string is tuned so the pair beats at
  // courses x (1.2 Hz + 0.0035 x pitch).
  {
    plain(device);
    device.set_param(p::kCourses, 1.0f);
    device.set_param(p::kDecay, 20.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    std::vector<float> sum = mono(out);
    // The envelope of the pair, sampled every 10 ms.
    std::vector<float> envelope;
    for (size_t from = at(0.5); from + 480 <= sum.size(); from += 480) {
      envelope.push_back(static_cast<float>(rms(sum, from, from + 480)));
    }
    const double average = mean(envelope);
    for (float& value : envelope) value -= static_cast<float>(average);
    const double beat = dominant_frequency(envelope, 100.0, 0.5, 8.0);
    std::printf("courses: beat %.3f Hz at 440 Hz (stated %.3f Hz)\n", beat, 1.2 + 0.0035 * 440.0);
    EXPECT_NEAR(beat, 1.2 + 0.0035 * 440.0, 0.12, "the two strings of a course beat at the stated rate");

    plain(device);
    device.set_param(p::kDecay, 20.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo single = render(device, 3.0f, kRate);
    std::vector<float> one = mono(single);
    double lo = 1.0e9, hi = 0.0;
    for (size_t from = at(0.5); from + 4800 <= one.size(); from += 4800) {
      const double level = rms(one, from, from + 4800) * std::exp(6.908 * from / kRate / 16.3);
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    EXPECT(hi < 1.25 * lo, "at Courses 0 a note is one string: no beating");
  }

  // 3. Decay is the ring time of a held string (at 220 Hz, where the lean
  // with pitch is nil), and low strings ring longer than high ones.
  {
    const float settings[3] = {1.0f, 4.0f, 12.0f};
    for (float seconds : settings) {
      plain(device);
      device.set_param(p::kDecay, seconds);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, std::min(seconds, 5.0f) + 0.5f, kRate);
      const double measured = rt60(out.left, kRate, 0.3, 0.1, -110.0);
      std::printf("decay %.0f s: T60 %.2f s\n", seconds, measured);
      EXPECT_NEAR(measured, seconds, 0.12 * seconds, "Decay sets the ring time of a held string");
    }
    double ring[2];
    const float pitches[2] = {82.41f, 1318.5f};
    for (int n = 0; n < 2; ++n) {
      plain(device);
      device.note_on(1, pitches[n], 0.8f);
      Stereo out = render(device, 3.0f, kRate);
      ring[n] = rt60(out.left, kRate, 0.5, 0.1, -110.0);
    }
    std::printf("decay 6 s: T60 %.2f s at 82 Hz, %.2f s at 1.3 kHz\n", ring[0], ring[1]);
    EXPECT(ring[0] > 1.5 * ring[1], "low strings ring longer than high ones");
  }

  // 4. Release: a hand on the string damps it in the stated time; at the
  // top the string is not damped at all.
  {
    plain(device);
    device.set_param(p::kRelease, 0.3f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo held = render(device, 0.5f, kRate);
    const double before = rms(held.left, at(0.4), at(0.5));
    device.note_off(1);
    Stereo fall = render(device, 1.0f, kRate);
    const double measured = rt60(fall.left, kRate, 0.02, 0.02, -100.0);
    std::printf("release 0.3 s: T60 %.3f s after the key is let go\n", measured);
    EXPECT_NEAR(measured, 0.3, 0.06, "Release sets how fast a released string is damped");
    EXPECT(rms(fall.left, at(0.35), at(0.45)) < 0.002 * before, "and it is 54 dB down just after that time");
    EXPECT(peak(fall.left, at(0.9)) == 0.0, "and exactly silent soon after");

    plain(device);
    device.set_param(p::kRelease, 20.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo open = render(device, 2.0f, kRate);
    plain(device);
    device.note_on(1, 220.0f, 0.8f);
    Stereo kept = render(device, 2.5f, kRate);
    const double let_go = rms(open.left, at(1.5), at(2.0)), down = rms(kept.left, at(2.0), at(2.5));
    std::printf("release at its top: %.2f dB against a held key two seconds on\n", db(let_go / down));
    EXPECT(std::fabs(db(let_go / down)) < 0.5, "at the top of Release the string rings on as if held");
  }

  // 5. Where and with what the string is played. In the middle of the
  // string every second partial is missing; Brightness raises the centroid;
  // the three exciters differ in how fast the blow rises and how bright it is.
  {
    plain(device);
    device.set_param(p::kPosition, 0.5f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo middle = render(device, 0.6f, kRate);
    double worst = 1.0e9;
    for (int even = 2; even <= 8; even += 2) {
      const double odd = std::min(tone_level(middle.left, 220.0 * (even - 1), kRate, at(0.05), at(0.45)),
                                  tone_level(middle.left, 220.0 * (even + 1), kRate, at(0.05), at(0.45)));
      worst = std::min(worst, db(odd / tone_level(middle.left, 220.0 * even, kRate, at(0.05), at(0.45))));
    }
    std::printf("position 0.5: even partials at least %.1f dB under their odd neighbours\n", worst);
    EXPECT(worst > 20.0, "played in the middle, the even partials are missing");

    plain(device);
    device.set_param(p::kPosition, 0.2f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo fifth = render(device, 0.6f, kRate);
    const double null5 = db(tone_level(fifth.left, 880.0, kRate, at(0.05), at(0.45)) /
                            tone_level(fifth.left, 1100.0, kRate, at(0.05), at(0.45)));
    std::printf("position 0.2: partial 5 is %.1f dB under partial 4\n", null5);
    EXPECT(null5 > 20.0, "played a fifth of the way along, the fifth partial is missing");

    double centre[3];
    const float settings[3] = {0.1f, 0.55f, 0.95f};
    for (int n = 0; n < 3; ++n) {
      plain(device);
      device.set_param(p::kBrightness, settings[n]);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      centre[n] = spectral_centroid(out.left, 0, at(0.4));
    }
    std::printf("brightness 0.1 / 0.55 / 0.95: centroid %.0f / %.0f / %.0f Hz\n", centre[0], centre[1], centre[2]);
    EXPECT(centre[1] > 1.3 * centre[0] && centre[2] > 1.3 * centre[1], "Brightness raises the centroid");

    double rise[3], bright[3];
    for (int exciter = 0; exciter < 3; ++exciter) {
      plain(device);
      device.set_param(p::kExciter, static_cast<float>(exciter));
      device.set_param(p::kBrightness, 0.25f);  // wide enough blows to time at 48 kHz
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      rise[exciter] = rise_ms(out.left);
      bright[exciter] = spectral_centroid(out.left, 0, at(0.4));
    }
    std::printf("finger / pick / hammer: rise %.2f / %.2f / %.2f ms, centroid %.0f / %.0f / %.0f Hz\n", rise[0], rise[1],
                rise[2], bright[0], bright[1], bright[2]);
    EXPECT(rise[1] < 0.6 * rise[0], "a pick rises faster than a finger");
    EXPECT(rise[2] > 2.0 * rise[0], "a hammer's blow is the widest");
    EXPECT(bright[1] > 1.25 * bright[0], "a pick is brighter than a finger");
    EXPECT(bright[2] < bright[1], "a hammer is rounder than a pick");
  }

  // 6. Chord and strum. One key at 110 Hz: the chord's own strings are
  // there (and the other chord's third is not), and a strum crosses them in
  // the stated time and direction.
  {
    const double fifth = 164.81, major = 277.18, minor = 261.63;
    auto chord = [&](int which) {
      plain(device);
      device.set_param(p::kChord, static_cast<float>(which));
      device.set_param(p::kStrum, 0.0f);
      device.note_on(1, 110.0f, 0.8f);
      return mono(render(device, 0.6f, kRate));
    };
    auto level = [&](const std::vector<float>& x, double hz) { return db(tone_level(x, hz, kRate, at(0.1), at(0.5))); };
    const std::vector<float> one = chord(0), open = chord(2), maj = chord(3), min = chord(4);
    std::printf("chord: fifth %.0f dB (single %.0f), major third %.0f / minor third %.0f dB in Major, %.0f / %.0f in Minor, %.0f / %.0f in Fifth and octave\n",
                level(open, fifth), level(one, fifth), level(maj, major), level(maj, minor), level(min, major),
                level(min, minor), level(open, major), level(open, minor));
    EXPECT(level(one, fifth) < -80.0 && level(open, fifth) > -45.0, "Fifth and octave adds the fifth");
    EXPECT(level(open, major) < -80.0 && level(open, minor) < -80.0, "and no third");
    EXPECT(level(maj, major) > -45.0 && level(maj, minor) < level(maj, major) - 30.0, "Major has the major third");
    EXPECT(level(min, minor) > -45.0 && level(min, major) < level(min, minor) - 30.0, "Minor has the minor third");
    EXPECT(level(chord(5), 246.94) > -45.0 && level(chord(7), 246.94) > -45.0 && level(maj, 246.94) < -80.0,
           "Sus 2 and Add 9 have the ninth");
    EXPECT(level(chord(6), 293.66) > -45.0 && level(maj, 293.66) < -80.0, "Sus 4 has the fourth");

    // Strings 0, 1 and 3 of the six (the others share partials with them).
    auto strum = [&](int direction, int keys, double* first, double* second, double* fourth) {
      plain(device);
      device.set_param(p::kChord, 3.0f);
      device.set_param(p::kStrum, 300.0f);
      device.set_param(p::kDirection, static_cast<float>(direction));
      for (int k = 1; k < keys; ++k) {  // earlier keys, to turn Alternate round
        device.note_on(k, 110.0f, 0.8f);
        render(device, 0.4f, kRate);
        device.note_off(k);
        device.set_param(p::kRelease, 0.05f);
        render(device, 1.0f, kRate);
      }
      device.note_on(9, 110.0f, 0.8f);
      const std::vector<float> x = mono(render(device, 0.8f, kRate));
      *first = onset(x, 110.0);
      *second = onset(x, fifth);
      *fourth = onset(x, major);
    };
    double a, b, c;
    strum(0, 1, &a, &b, &c);
    std::printf("strum 300 ms up: strings 1, 2, 4 of 6 at %.0f, %.0f, %.0f ms\n", a * 1000, b * 1000, c * 1000);
    EXPECT(a < b && b < c, "an upward strum sounds the low string first");
    EXPECT_NEAR(b - a, 0.06, 0.015, "a 300 ms strum reaches the second of six strings after 60 ms");
    EXPECT_NEAR(c - a, 0.18, 0.02, "and the fourth after 180 ms");
    strum(1, 1, &a, &b, &c);
    std::printf("strum 300 ms down: strings 1, 2, 4 of 6 at %.0f, %.0f, %.0f ms\n", a * 1000, b * 1000, c * 1000);
    EXPECT(c < b && b < a, "a downward strum sounds the high strings first");
    EXPECT_NEAR(a - c, 0.18, 0.02, "over the same time");
    strum(2, 1, &a, &b, &c);
    const bool first_up = a < c;
    strum(2, 2, &a, &b, &c);
    EXPECT(first_up && c < a, "Alternate strums up on one key and down on the next");
  }

  // CHECKS

  return finish("zither");
}
