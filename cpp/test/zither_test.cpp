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
      rise[exciter] = rise_ms(render(device, 0.1f, kRate).left);
      plain(device);
      device.set_param(p::kExciter, static_cast<float>(exciter));
      device.note_on(1, 220.0f, 0.8f);
      bright[exciter] = spectral_centroid(render(device, 0.5f, kRate).left, 0, at(0.4));
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

  // 7. Roll: while the key is held the string is struck again and again at
  // the stated rate, a little unevenly, and the level settles.
  {
    plain(device);
    device.set_param(p::kExciter, 2.0f);
    device.set_param(p::kRoll, 8.0f);
    device.set_param(p::kDecay, 12.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 8.0f, kRate);
    // A blow brings fresh upper partials: it shows as a jump in the level of
    // the sample-to-sample difference, taken over two periods at a time.
    const double hop = 2.0 * kRate / 220.0;
    std::vector<float> edge;
    for (size_t k = 0; at((k + 1) * hop, 1.0) <= out.left.size(); ++k) {
      double sum = 0.0;
      const size_t from = std::max<size_t>(1, at(k * hop, 1.0)), to = at((k + 1) * hop, 1.0);
      for (size_t i = from; i < to; ++i) {
        const double step = static_cast<double>(out.left[i]) - out.left[i - 1];
        sum += step * step;
      }
      edge.push_back(static_cast<float>(std::sqrt(sum / (to - from))));
    }
    // A stroke is a peak of that level standing over the hops around it.
    std::vector<double> strikes;
    const size_t skip = static_cast<size_t>(0.5 * kRate / hop);  // from 0.5 s: the roll alone
    for (size_t i = skip; i + 3 < edge.size(); ++i) {
      bool top = true;
      float floor = edge[i];
      for (int j = -3; j <= 3; ++j) top = top && edge[i + j] <= edge[i];
      for (int j = 1; j <= 6; ++j) floor = std::min(floor, edge[i - j]);
      if (top && edge[i] > 1.1f * floor) strikes.push_back(i * hop / kRate);
    }
    double total = 0.0, squares = 0.0;
    const size_t gaps = strikes.size() > 1 ? strikes.size() - 1 : 0;
    for (size_t i = 0; i < gaps; ++i) total += strikes[i + 1] - strikes[i];
    const double gap = gaps > 0 ? total / gaps : 0.0;
    for (size_t i = 0; i < gaps; ++i) squares += (strikes[i + 1] - strikes[i] - gap) * (strikes[i + 1] - strikes[i] - gap);
    const double jitter = gaps > 0 ? std::sqrt(squares / gaps) / gap : 1.0;
    std::vector<float> envelope(edge.begin() + skip, edge.end());
    const double average = mean(envelope);
    for (float& value : envelope) value -= static_cast<float>(average);
    const double wobble = dominant_frequency(envelope, kRate / hop, 2.0, 20.0);
    const double early = rms(out.left, at(1.0), at(3.0)), mid = rms(out.left, at(3.0), at(5.5)),
                 late = rms(out.left, at(5.5), at(8.0));
    plain(device);
    device.set_param(p::kExciter, 2.0f);
    device.set_param(p::kDecay, 12.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo once = render(device, 2.0f, kRate);
    std::printf("roll 8 Hz: %zu strikes in 7.5 s, %.2f a second, jitter %.1f %%, envelope at %.2f Hz; level %.1f, %.1f, %.1f dB over 1-3, 3-5.5, 5.5-8 s (one blow: %.1f dB at once, %.1f dB at 1.5 s)\n",
                strikes.size(), gap > 0.0 ? 1.0 / gap : 0.0, 100.0 * jitter, wobble, db(early), db(mid), db(late),
                db(rms(once.left, 0, at(0.5))), db(rms(once.left, at(1.0), at(2.0))));
    EXPECT_NEAR(1.0 / gap, 8.0, 0.4, "the roll strikes at the stated rate");
    EXPECT_NEAR(wobble, 8.0, 0.5, "which is the rate the level moves at");
    EXPECT(jitter > 0.01 && jitter < 0.2, "the strokes are uneven by less than a fifth");
    EXPECT(std::fabs(db(late / mid)) < 1.5 && std::fabs(db(mid / early)) < 1.5, "the level settles instead of growing");

    EXPECT(late > 1.5 * rms(once.left, at(1.0), at(2.0)), "a rolled string is kept louder than one struck once");
    EXPECT(late < 1.5 * rms(once.left, 0, at(0.5)), "but no louder than the first blow");
  }

  // 8. Sympathetic strings: after a short note is damped they ring on at its
  // pitch (the A two octaves below has it as its fourth partial) and fade
  // slowly; at Sympathy 0 nothing is left.
  {
    plain(device);
    device.set_param(p::kSympathy, 0.6f);
    device.set_param(p::kRelease, 0.05f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo played = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo after = render(device, 4.0f, kRate);
    const std::vector<float> rest = mono(after);
    const double sung = dominant_frequency(rest, kRate, 300.0, 600.0, at(0.5), at(1.5));
    const double first = tone_level(rest, 440.0, kRate, at(0.5), at(1.0)), later = tone_level(rest, 440.0, kRate, at(3.0), at(3.5));
    const double ring = rt60(rest, kRate, 0.5, 0.25, -120.0);
    std::printf("sympathy 0.6: %.1f dB at %.1f Hz half a second after the damping (the note was %.1f dB), T60 %.1f s\n",
                db(first), sung, db(tone_level(mono(played), 440.0, kRate, at(0.5), at(1.0))), ring);
    EXPECT_NEAR(sung, 440.0, 2.0, "the sympathetic strings ring at the pitch that was played");
    EXPECT(db(first) > -75.0, "and are heard after the played string is damped");
    EXPECT(db(later / first) > -25.0 && ring > 4.0, "and fade slowly");

    plain(device);
    device.set_param(p::kRelease, 0.05f);
    device.note_on(1, 440.0f, 0.8f);
    render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo bare = render(device, 4.0f, kRate);
    EXPECT(peak(bare.left, at(0.5)) == 0.0 && peak(bare.right, at(0.5)) == 0.0, "with Sympathy 0 nothing rings on");
  }

  // 9. No clicks from running out of strings or from plucking a string that
  // is still ringing: soft, dark plucks have no fast edges of their own, so
  // a string cut off would show as a larger sample-to-sample step.
  {
    auto soft = [&]() {
      plain(device);
      device.set_param(p::kBrightness, 0.15f);
      device.set_param(p::kChord, 3.0f);
      device.set_param(p::kStrum, 20.0f);
      device.set_param(p::kDecay, 12.0f);
    };
    // One strum: what the plucks themselves do.
    soft();
    device.note_on(1, 110.0f, 0.8f);
    Stereo one = render(device, 1.0f, kRate);
    const double reference = std::max(max_step(one.left), max_step(one.right));

    // Fourteen chords a semitone apart, 70 ms apart, none above the first
    // strum's top string: 38 pitches for 24 strings.
    soft();
    Stereo pile;
    for (int k = 0; k < 14; ++k) {
      device.note_on(k, 110.0f * std::pow(2.0f, static_cast<float>(k - 13) / 12.0f), 0.8f);
      pile = concat(pile, render(device, 0.07f, kRate));
    }
    pile = concat(pile, render(device, 0.5f, kRate));
    const double stolen = std::max(max_step(pile.left), max_step(pile.right));

    // The same chord strummed eight times, 90 ms apart: every string plucked while it rings.
    soft();
    Stereo again;
    for (int k = 0; k < 8; ++k) {
      device.note_on(k, 110.0f, 0.8f);
      again = concat(again, render(device, 0.09f, kRate));
    }
    const double replucked = std::max(max_step(again.left), max_step(again.right));
    std::printf("clicks: largest step %.4f for one strum, %.4f stealing strings (peak %.2f), %.4f plucking ringing strings\n",
                reference, stolen, std::max(peak(pile.left), peak(pile.right)), replucked);
    EXPECT(stolen < 2.5 * reference, "taking a string that is in use does not click");
    EXPECT(replucked < 1.6 * reference, "plucking a string that is still ringing does not click");
    EXPECT(peak(pile.left) < 1.0 && peak(pile.right) < 1.0, "and the pile stays bounded");
  }

  // 10. Velocity and level: soft keys are quieter and rounder; one key at
  // the default settings sits at a sane level and ten held keys stay clean.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo normal = render(device, 1.0f, kRate);
    const double level = db(std::max(peak(normal.left), peak(normal.right)));
    std::printf("level: one key at velocity 0.7 peaks at %.1f dBFS at the default settings\n", level);
    EXPECT(level > -24.0 && level < -10.0, "one key peaks between -24 and -10 dBFS");

    double loud[2], bright[2];
    const float velocity[2] = {0.2f, 1.0f};
    for (int n = 0; n < 2; ++n) {
      plain(device);
      device.note_on(1, 220.0f, velocity[n]);
      Stereo out = render(device, 0.5f, kRate);
      loud[n] = rms(out.left, 0, at(0.4));
      bright[n] = spectral_centroid(out.left, 0, at(0.4));
    }
    std::printf("velocity 0.2 against 1.0: %.1f dB, centroid %.0f against %.0f Hz\n", db(loud[0] / loud[1]), bright[0], bright[1]);
    EXPECT(loud[0] < 0.35 * loud[1], "soft keys are quieter");
    EXPECT(bright[0] < bright[1], "and rounder");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo ten = render(device, 3.0f, kRate);
    std::printf("level: ten held keys peak at %.2f\n", std::max(peak(ten.left), peak(ten.right)));
    EXPECT(peak(ten.left) < 0.9 && peak(ten.right) < 0.9, "ten keys stay under the clip knee region");
  }

  // 11. Moving the controls under a ringing chord does not click: Decay,
  // Release, Sympathy, Volume and Body all act on what is sounding.
  {
    auto ringing = [&](int sweep) {
      device.init(kRate);
      device.set_param(p::kBrightness, 0.15f);
      device.set_param(p::kChord, 3.0f);
      device.set_param(p::kDecay, 12.0f);
      device.note_on(1, 110.0f, 0.8f);
      render(device, 0.5f, kRate);
      Stereo out;
      const int blocks = static_cast<int>(2.0f * kRate / kBlock);
      for (int b = 0; b < blocks; ++b) {
        const float t = static_cast<float>(b) / static_cast<float>(blocks);
        const float there_and_back = t < 0.5f ? 2.0f * t : 2.0f - 2.0f * t;
        if (sweep == 1) device.set_param(p::kDecay, 20.0f * std::pow(0.5f / 20.0f, there_and_back));
        if (sweep == 2) device.set_param(p::kSympathy, there_and_back);
        if (sweep == 3) device.set_param(p::kVolume, -9.0f - 30.0f * there_and_back);
        if (sweep == 4 && b % 40 == 0) device.set_param(p::kBody, static_cast<float>((b / 40) % 4));
        if (sweep == 5 && b == 10) device.note_off(1);
        if (sweep == 5) device.set_param(p::kRelease, 20.0f * std::pow(0.05f / 20.0f, there_and_back));
        out = concat(out, render(device, static_cast<float>(kBlock) / kRate, kRate));
      }
      return std::max(max_step(out.left), max_step(out.right));
    };
    const double still = ringing(0);
    const double decay = ringing(1), sympathy = ringing(2), volume = ringing(3), body = ringing(4), release = ringing(5);
    std::printf("moving controls: largest step %.4f at rest; Decay %.4f, Sympathy %.4f, Volume %.4f, Body %.4f, Release %.4f\n",
                still, decay, sympathy, volume, body, release);
    EXPECT(decay < 1.3 * still, "sweeping Decay under a ringing chord does not click");
    EXPECT(sympathy < 1.5 * still, "sweeping Sympathy does not click");
    EXPECT(volume < 1.3 * still, "sweeping Volume does not click");
    EXPECT(body < 3.0 * still, "switching Body crossfades");
    EXPECT(release < 1.3 * still, "sweeping Release over released strings does not click");
  }

  // 12. Stereo: strings and courses are spread, the bass stays in the
  // middle, and the mono sum loses nothing.
  {
    device.init(kRate);
    device.set_param(p::kChord, 3.0f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo chord = render(device, 3.0f, kRate);
    const double spread = correlation(chord.left, chord.right);
    const std::vector<float> sum = mono(chord);
    const double folded = db(rms(sum) / std::sqrt(0.5 * (rms(chord.left) * rms(chord.left) + rms(chord.right) * rms(chord.right))));
    device.init(kRate);
    device.note_on(1, 55.0f, 0.8f);
    Stereo bass = render(device, 2.0f, kRate);
    const double low = correlation(bass.left, bass.right);
    std::printf("stereo: a strummed chord correlates %.2f left to right (mono sum %.1f dB), a 55 Hz string %.2f\n", spread,
                folded, low);
    EXPECT(spread > 0.3 && spread < 0.97, "a chord is spread but stays mono compatible");
    EXPECT(folded > -1.5, "the mono sum keeps the level");
    EXPECT(low > 0.9, "the bass stays in the middle");
  }

  // 13. The four bodies are four different boxes.
  {
    double top[4], thin[4];
    for (int b = 0; b < 4; ++b) {
      plain(device);
      device.set_param(p::kBody, static_cast<float>(b));
      device.set_param(p::kExciter, 1.0f);
      device.note_on(1, 110.0f, 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      top[b] = db(energy_above(out.left, 1500.0, kRate, 0, at(0.4)));
      thin[b] = db(energy_above(out.left, 300.0, kRate, 0, at(0.4)));
    }
    std::printf("bodies (harp, zither, dulcimer, koto): share of energy above 1.5 kHz %.1f, %.1f, %.1f, %.1f dB; above 300 Hz %.1f, %.1f, %.1f, %.1f dB\n",
                top[0], top[1], top[2], top[3], thin[0], thin[1], thin[2], thin[3]);
    EXPECT(top[1] > top[0] + 3.0, "the zither is brighter than the harp");
    EXPECT(thin[3] > thin[1] + 1.5 && thin[3] > thin[0] + 3.0, "the koto is the thinnest below");
    EXPECT(std::fabs(top[2] - top[1]) + std::fabs(thin[2] - thin[1]) > 1.0, "and the dulcimer is not the zither");
  }

  // Cost: eight keys held on a six-string chord with a roll, every string
  // in use, both strings of every course and the sympathetic strings.
  device.init(kRate);
  device.set_param(p::kChord, 3.0f);
  device.set_param(p::kRoll, 9.0f);
  device.set_param(p::kExciter, 2.0f);
  device.set_param(p::kDecay, 20.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  render(device, 1.0f, kRate);
  report_cost("zither (8 keys, six-string chord, roll 9)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("zither");
}
