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

// When the component at `hz` first reaches a third of the most it reaches, in seconds.
static double onset(const std::vector<float>& x, double hz, double rate = kRate) {
  const size_t window = at(0.03, rate), hop = at(0.002, rate);
  std::vector<double> level;
  double most = 0.0;
  for (size_t from = 0; from + window <= x.size(); from += hop) {
    level.push_back(tone_level(x, hz, rate, from, from + window));
    most = std::max(most, level.back());
  }
  for (size_t i = 0; i < level.size(); ++i) {
    if (level[i] > most / 3.0) return static_cast<double>(i * hop + window / 2) / rate;
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

  // CHECKS

  return finish("zither");
}
