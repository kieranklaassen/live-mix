// Native harness for Ridge Lines: conformance, what makes it the instrument
// it is (a pitch that stands still under overtones that slide), no clicks,
// no note left behind, the same sound at every block size.

#include "../devices/ridge-lines/ridge_lines.h"
#include "support/test_kit.h"

using namespace testkit;
using Device = livemix::RidgeLines;
namespace rl = livemix::ridge_lines;

namespace {

Device device;
constexpr float kRate = 48000.0f;
constexpr float kChord[5] = {146.83f, 220.0f, 349.23f, 523.25f, 659.26f};

struct Set {
  int id;
  float value;
};

void patch(std::initializer_list<Set> sets, float rate = kRate) {
  device.init(rate);
  for (const Set& s : sets) device.set_param(s.id, s.value);
}

Stereo play(std::initializer_list<Set> sets, float hz, float seconds, float gain = 0.7f, float rate = kRate) {
  patch(sets, rate);
  device.note_on(1, hz, gain);
  return render(device, seconds, rate);
}

size_t at(float seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

// Everything but the thing being looked at, stilled.
const std::initializer_list<Set> kPlain = {{rl::kCompany, 0}, {rl::kVibrato, 0}, {rl::kWind, 0}, {rl::kSustain, 1}};

void bare(std::initializer_list<Set> more) {
  patch(kPlain);
  for (const Set& s : more) device.set_param(s.id, s.value);
}

Stereo bare_note(std::initializer_list<Set> more, float hz, float seconds) {
  bare(more);
  device.note_on(1, hz, 0.7f);
  return render(device, seconds, kRate);
}

double cents(double a, double b) { return 1200.0 * std::log2(a / b); }

// Levels in dB of harmonics 2 to 13, less the loudest's.
std::vector<double> colour(const std::vector<float>& x, double hz, size_t from, size_t to) {
  std::vector<double> out;
  for (int h = 2; h <= 13; ++h) out.push_back(db(tone_level(x, hz * h, kRate, from, to)));
  const double top = *std::max_element(out.begin(), out.end());
  for (double& v : out) v = std::max(-50.0, v - top);
  return out;
}
double apart(const std::vector<double>& a, const std::vector<double>& b) {
  double sum = 0.0;
  for (size_t i = 0; i < a.size(); ++i) sum += std::fabs(a[i] - b[i]);
  return sum / static_cast<double>(a.size());
}

// The largest second difference: a click stands over an event-free stretch.
double bend(const std::vector<float>& x, size_t from, size_t to) {
  double worst = 0.0;
  for (size_t i = from + 2; i < std::min(to, x.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  }
  return worst;
}

void test_pitch() {
  // The rows slide, the note does not: in tune at rest, and while they run.
  for (float travel : {0.0f, 0.4f, 0.8f}) {
    for (float hz : {65.41f, 220.0f, 1046.5f}) {
      const Stereo out = bare_note({{rl::kTravel, travel}, {rl::kFar, 2}, {rl::kHeight, 0.8f}}, hz, 4.0f);
      const double f = dominant_frequency(out.left, kRate, hz * 0.985, hz * 1.015, at(1.0f), at(4.0f));
      EXPECT(std::fabs(cents(f, hz)) < 1.0, "the fundamental stands still while the rows slide");
      EXPECT_NEAR(tone_level(out.left, hz, kRate, at(1.0f), at(1.5f)) / tone_level(out.right, hz, kRate, at(1.0f), at(1.5f)),
                  1.0, 0.02, "both eyes hear one fundamental");
    }
  }
  // As played, with company and waver at their defaults.
  for (float hz : kChord) {
    const Stereo out = play({}, hz, 4.0f);
    const double f = dominant_frequency(out.left, kRate, hz * 0.98, hz * 1.02, at(0.5f), at(4.0f));
    EXPECT(std::fabs(cents(f, hz)) < 3.0, "in tune at the defaults");
  }
}

void test_sliding() {
  // Overtones move with Travel, and stand with it at zero.
  const Stereo still = bare_note({{rl::kTravel, 0}}, 220.0f, 4.0f);
  const Stereo moving = bare_note({{rl::kTravel, 0.45f}}, 220.0f, 4.0f);
  const double at_rest = apart(colour(still.left, 220.0, at(1.5f), at(1.9f)), colour(still.left, 220.0, at(3.2f), at(3.6f)));
  const double at_speed = apart(colour(moving.left, 220.0, at(1.5f), at(1.9f)), colour(moving.left, 220.0, at(3.2f), at(3.6f)));
  std::printf("colour moves %.2f dB still, %.2f dB sliding\n", at_rest, at_speed);
  EXPECT(at_rest < 0.6, "with Travel at zero the picture stands");
  EXPECT(at_speed > 2.0, "with Travel up the overtones glide");
  // Parallax: at zero the two rows behind come round together once a turn.
  const auto after_a_turn = [](float parallax) {
    bare({{rl::kTravel, 0.45f}, {rl::kParallax, parallax}, {rl::kEyes, 0}});
    device.note_on(1, 220.0f, 0.7f);
    const Stereo out = render(device, 9.0f, kRate);
    double best = 1.0e9;
    for (float lag = 2.0f; lag < 3.6f; lag += 0.1f) {
      double sum = 0.0;
      for (float t = 1.5f; t < 4.6f; t += 0.5f) {
        sum += apart(colour(out.left, 220.0, at(t), at(t + 0.3f)), colour(out.left, 220.0, at(t + lag), at(t + lag + 0.3f)));
      }
      best = std::min(best, sum / 7.0);
    }
    return best;
  };
  const double same = after_a_turn(0.0f), other = after_a_turn(0.5f);
  std::printf("after one turn the picture is %.2f dB off without parallax, %.2f with\n", same, other);
  EXPECT(other > same + 0.5, "parallax parts the two rows");
}

void test_band() {
  // Nothing between the harmonics at rest, up the keyboard, at its brightest.
  for (float hz : {110.0f, 440.0f, 1046.5f, 2093.0f}) {
    const Stereo out = bare_note({{rl::kTravel, 0}, {rl::kTone, 1}, {rl::kPenumbra, 0}, {rl::kJag, 1}, {rl::kBody, 0}, {rl::kNear, 3}}, hz, 2.0f);
    const double tone = tone_level(out.left, hz, kRate, at(1.0f), at(2.0f));
    double worst = 0.0;
    for (double f = hz * 0.5; f < 20000.0; f += hz) worst = std::max(worst, tone_level(out.left, f, kRate, at(1.0f), at(2.0f)));
    for (double f : {21000.0, 22300.0}) worst = std::max(worst, tone_level(out.left, f, kRate, at(1.0f), at(2.0f)));
    EXPECT(db(worst / tone) < -55.0, "nothing folds back between the harmonics");
  }
}

void test_colours() {
  const auto above = [](std::initializer_list<Set> sets, double hz) {
    const Stereo out = bare_note(sets, 220.0f, 4.0f);
    return energy_above(out.left, hz, kRate, at(1.0f), at(4.0f));
  };
  const auto thirtieth = [](float tone) {
    const Stereo out = bare_note({{rl::kTone, tone}, {rl::kJag, 0.5f}}, 220.0f, 4.0f);
    return tone_level(out.left, 6600.0, kRate, at(1.0f), at(4.0f));
  };
  EXPECT(thirtieth(0.9f) > 4.0 * thirtieth(0.4f), "Tone opens the overtones");
  EXPECT(above({{rl::kPenumbra, 0}}, 1500) > 1.5 * above({{rl::kPenumbra, 1}}, 1500), "a hard edge is brighter");
  EXPECT(above({{rl::kJag, 1}}, 1500) > 1.5 * above({{rl::kJag, 0}}, 1500), "Jag glitters");
  EXPECT(above({{rl::kRepeats, 9}}, 1500) > 1.3 * above({{rl::kRepeats, 1}}, 1500), "more repeats whistle higher");
  // Ground against everything else.
  const auto first = [](float ground) {
    const Stereo out = bare_note({{rl::kGround, ground}}, 220.0f, 3.0f);
    return db(tone_level(out.left, 220.0, kRate, at(1.0f), at(3.0f)) / rms(out.left, at(1.0f), at(3.0f)));
  };
  EXPECT(first(1.0f) > first(0.25f) + 3.0, "Ground raises the fundamental");
  EXPECT(first(0.0f) < -60.0, "Ground at zero leaves none of it");
  // Sun at its lowest throws a shadow of half a cycle: even harmonics go.
  const Stereo reed = bare_note({{rl::kSun, 1}, {rl::kTravel, 0}, {rl::kHeight, 0}}, 220.0f, 2.0f);
  const Stereo noon = bare_note({{rl::kSun, 0}, {rl::kTravel, 0}, {rl::kHeight, 0}}, 220.0f, 2.0f);
  const auto even = [](const Stereo& x) {
    return db(tone_level(x.left, 880.0, kRate, at(1.0f), at(2.0f)) / tone_level(x.left, 660.0, kRate, at(1.0f), at(2.0f)));
  };
  EXPECT(even(reed) < even(noon) - 10.0, "a long shadow hollows the tone");
  // Velocity: timbre as well as level.
  const Stereo soft = play({}, 220.0f, 2.0f, 0.2f), hard = play({}, 220.0f, 2.0f, 1.0f);
  EXPECT(db(rms(hard.left) / rms(soft.left)) > 6.0, "a hard touch is louder");
  EXPECT(energy_above(hard.left, 1500, kRate) > 1.3 * energy_above(soft.left, 1500, kRate), "and brighter");
  // Two Eyes: one ear at zero, two at the top, and one fold to mono still.
  const Stereo mono = play({{rl::kEyes, 0}, {rl::kWind, 0}}, 220.0f, 2.0f), wide = play({{rl::kEyes, 1}}, 220.0f, 2.0f);
  EXPECT(correlation(mono.left, mono.right) > 0.9999, "with one eye the two ears are one");
  EXPECT(correlation(wide.left, wide.right) < 0.93, "two eyes see two pictures");
  EXPECT(correlation(wide.left, wide.right) > 0.0, "which fold to mono");
  // Wind fills the gaps between harmonics.
  const auto gap = [](float wind) {
    const Stereo out = play({{rl::kWind, wind}, {rl::kCompany, 0}}, 440.0f, 2.0f);
    return tone_level(out.left, 440.0 * 5.5, kRate, at(0.5f), at(2.0f));
  };
  EXPECT(gap(1.0f) > 8.0 * gap(0.05f), "Wind is air between the overtones");
  // Vibrato moves the pitch, after a moment.
  const Stereo waver = bare_note({{rl::kVibrato, 1}, {rl::kTravel, 0}}, 440.0f, 3.0f);
  double low = 1.0e9, high = 0.0;
  for (float t = 1.5f; t < 2.5f; t += 0.02f) {
    const double f = dominant_frequency(waver.left, kRate, 415.0, 466.0, at(t), at(t + 0.06f));
    low = std::min(low, f);
    high = std::max(high, f);
  }
  EXPECT(cents(high, low) > 25.0 && cents(high, low) < 90.0, "Vibrato bends by a part of a semitone");
}

// Level in dB of every fifth of a second.
std::vector<double> course(const std::vector<float>& x, float from, float to) {
  std::vector<double> out;
  for (float t = from; t + 0.2f <= to; t += 0.2f) out.push_back(db(rms(x, at(t), at(t + 0.2f))));
  return out;
}
double span(const std::vector<double>& v) {
  return *std::max_element(v.begin(), v.end()) - *std::min_element(v.begin(), v.end());
}

void test_land() {
  // The band of the rows behind moves inside three seconds, at the defaults:
  // where the middle of the overtones lies, in octaves over the note.
  const Stereo glide = bare_note({{rl::kEyes, 0}}, 220.0f, 3.2f);
  std::vector<double> middle;
  for (float t = 0.4f; t < 3.0f; t += 0.2f) {
    double sum = 0.0, all = 0.0;
    for (int h = 2; h <= 24; ++h) {
      const double level = tone_level(glide.left, 220.0 * h, kRate, at(t), at(t + 0.2f));
      sum += level * std::log2(static_cast<double>(h));
      all += level;
    }
    middle.push_back(sum / all);
  }
  std::printf("the middle of the overtones moves by %.2f octaves\n", span(middle));
  EXPECT(span(middle) > 0.2, "the overtones glide within three seconds");
  // Cliffs behind: each note swells, and a chord does not swell as one.
  const Stereo one = bare_note({{rl::kFar, 2}, {rl::kTravel, 0.6f}}, 220.0f, 5.0f);
  bare({{rl::kFar, 2}, {rl::kTravel, 0.6f}});
  for (int n = 0; n < 5; ++n) device.note_on(n, kChord[n], 0.7f);
  const Stereo many = render(device, 5.0f, kRate);
  const double alone = span(course(one.left, 0.6f, 5.0f)), together = span(course(many.left, 0.6f, 5.0f));
  std::printf("cliffs: one note spans %.1f dB, a chord %.1f\n", alone, together);
  EXPECT(alone > 5.0 && alone < 14.0, "a note swells with the cliffs");
  EXPECT(together < 0.75 * alone, "and a chord does not swell as one");
  // At the defaults a chord holds its level.
  patch(kPlain);
  for (int n = 0; n < 5; ++n) device.note_on(n, kChord[n], 0.7f);
  EXPECT(span(course(render(device, 6.0f, kRate).left, 1.0f, 6.0f)) < 5.0, "the default chord does not pump");
  // Pines are seen wide, hills narrow.
  const auto width = [](float far) {
    const Stereo x = bare_note({{rl::kFar, far}, {rl::kCompany, 0}}, 220.0f, 3.0f);
    return correlation(x.left, x.right);
  };
  std::printf("the ears agree by %.2f over hills, %.2f over pines\n", width(0.0f), width(1.0f));
  EXPECT(width(1.0f) < width(0.0f) - 0.3, "pines are wider than hills");
  // A knob is heard at once.
  bare({{rl::kTone, 0.1f}, {rl::kTravel, 0}});
  device.note_on(1, 220.0f, 0.7f);
  render(device, 1.0f, kRate);
  device.set_param(rl::kTone, 1.0f);
  const Stereo opened = render(device, 1.0f, kRate);
  const double soon = db(tone_level(opened.left, 2200.0, kRate, at(0.03f), at(0.06f)) / tone_level(opened.left, 2200.0, kRate, at(0.5f), at(1.0f)));
  std::printf("a twentieth of a second after Tone is opened the top stands at %.1f dB\n", soon);
  EXPECT(soon > -6.0, "a knob is heard within a twentieth of a second");
  // Towers have no even harmonics of their own.
  const auto octave = [](float near) {
    const Stereo x = bare_note({{rl::kNear, near}, {rl::kHeight, 0}, {rl::kTravel, 0}}, 220.0f, 2.0f);
    return db(tone_level(x.left, 880.0, kRate, at(1.0f), at(2.0f)) / tone_level(x.left, 1100.0, kRate, at(1.0f), at(2.0f)));
  };
  EXPECT(octave(3.0f) < octave(2.0f) - 8.0, "towers are hollow");
  // Near stretches or cuts the fall.
  const auto left_over = [](float near) {
    bare({{rl::kNear, near}, {rl::kRelease, 1.6f}});
    device.note_on(1, 220.0f, 0.7f);
    const double held = rms(render(device, 1.0f, kRate).left, at(0.6f));
    device.note_off(1);
    return db(rms(render(device, 1.0f, kRate).left, at(0.4f), at(0.6f)) / held);
  };
  EXPECT(left_over(0.0f) > left_over(2.0f) + 4.0 && left_over(1.0f) < left_over(2.0f) - 10.0, "hills ring on, pines stop");
  // With Travel at zero a key sounds the same every time.
  bare({{rl::kTravel, 0}});
  std::vector<double> first;
  for (int n = 0; n < 2; ++n) {
    device.note_on(1, 220.0f, 0.7f);
    const Stereo x = render(device, 1.0f, kRate);
    const std::vector<double> now = colour(x.left, 220.0, at(0.5f), at(1.0f));
    if (n == 1) EXPECT(apart(first, now) < 0.3, "a still picture is the same for every stroke");
    first = now;
    device.note_off(1);
    render(device, 4.0f, kRate);
  }
  // Glow: a note that has fallen is darker.
  const auto dark = [](float glow) {
    const Stereo x = bare_note({{rl::kGlow, glow}, {rl::kSustain, 0.2f}, {rl::kDecay, 1.0f}, {rl::kAttack, 0.01f}, {rl::kTravel, 0}}, 220.0f, 2.5f);
    return db(tone_level(x.left, 2200.0, kRate, at(1.8f), at(2.5f)) / tone_level(x.left, 220.0, kRate, at(1.8f), at(2.5f)));
  };
  EXPECT(dark(1.0f) < dark(0.0f) - 10.0, "Glow closes as a note falls");
  // Body lifts and sinks fixed bands.
  const auto box = [](float body) {
    const Stereo x = bare_note({{rl::kBody, body}, {rl::kTravel, 0}}, 205.0f, 2.0f);
    return db(tone_level(x.left, 820.0, kRate, at(1.0f), at(2.0f)) / tone_level(x.left, 1025.0, kRate, at(1.0f), at(2.0f)));
  };
  EXPECT(box(1.0f) < box(0.0f) - 6.0, "Body is a box with bands of its own");
}

void test_level() {
  for (float hz : {65.41f, 130.81f, 261.63f, 523.25f, 1046.5f}) {
    const Stereo out = play({}, hz, 3.0f);
    const double p = db(std::max(peak(out.left), peak(out.right)));
    EXPECT(p > -24.0 && p < -10.0, "one note peaks where it should");
    EXPECT(std::fabs(mean(out.left, at(0.5f))) < 1.0e-3, "no steady offset");
  }
  for (int near = 0; near < 4; ++near) {
    patch({{rl::kNear, static_cast<float>(near)}, {rl::kFar, static_cast<float>(near % 3)}});
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 4.0f / 12.0f), 1.0f);
    const Stereo out = render(device, 3.0f, kRate);
    EXPECT(std::max(peak(out.left), peak(out.right)) < 0.5, "ten keys stay under the clip's knee");
  }
}

void test_envelope() {
  const Stereo slow = play({{rl::kAttack, 2.0f}}, 220.0f, 2.5f), quick = play({{rl::kAttack, 0.004f}}, 220.0f, 2.5f);
  EXPECT(rms(slow.left, at(0.1f), at(0.3f)) < 0.5 * rms(slow.left, at(1.8f), at(2.2f)), "a slow attack swells");
  EXPECT(rms(quick.left, at(0.02f), at(0.1f)) > 1.5 * rms(quick.left, at(1.0f), at(1.4f)), "a quick one is a stroke");
  patch({{rl::kSustain, 0}, {rl::kDecay, 0.6f}});
  device.note_on(1, 220.0f, 0.7f);
  const Stereo plucked = render(device, 4.0f, kRate);
  EXPECT(peak(plucked.left, at(3.0f), at(4.0f)) == 0.0, "with no sustain a held note dies and sleeps");
}

// A dark patch bends so little by itself that any step shows.
const std::initializer_list<Set> kDark = {{rl::kNear, 0},    {rl::kFar, 0},     {rl::kTone, 0.25f}, {rl::kWind, 0},   {rl::kJag, 0},
                                          {rl::kSun, 0},     {rl::kCompany, 0}, {rl::kVibrato, 0},  {rl::kBody, 0},   {rl::kPenumbra, 0.6f},
                                          {rl::kAttack, 0.02f}};

void test_clicks() {
  // Each knob and choice jumps, up and down, against the patches on either
  // side of the jump as they hold by themselves.
  for (int id = 0; id < rl::kNumParams; ++id) {
    if (id == rl::kWind) continue;  // noise is all bends
    for (bool up : {false, true}) {
      patch(kDark);
      device.set_param(id, up ? rl::kParamMin[id] : rl::kParamMax[id]);
      device.note_on(1, 220.0f, 0.7f);
      device.note_on(2, 330.0f, 0.7f);
      Stereo x = render(device, 1.0f, kRate);
      const double before = bend(x.left, at(0.6f), at(1.0f));
      const double edge = std::fabs(x.left.back());
      device.set_param(id, up ? rl::kParamMax[id] : rl::kParamMin[id]);
      x = render(device, 0.5f, kRate);
      const double event = std::max(bend(x.left, 0, at(0.1f)), std::fabs(x.left[0] - edge) > 0.2 ? 1.0 : 0.0);
      const double reference = std::max(before, bend(x.left, at(0.3f), at(0.5f)));
      if (event > 1.8 * reference + 5.0e-5) std::printf("param %d %s: bend %g against %g\n", id, up ? "up" : "down", event, reference);
      EXPECT(event <= 1.8 * reference + 5.0e-5, "a knob jumped while sounding does not click");
    }
  }
  // A key struck again, plucked: in its hold and in its release.
  for (bool released : {false, true}) {
    patch(kDark);
    device.set_param(rl::kAttack, 0.004f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo x = render(device, 1.0f, kRate);
    const double reference = bend(x.left, 0, at(1.0f));
    if (released) {
      device.note_off(1);
      render(device, 0.05f, kRate);
    }
    device.note_on(1, 220.0f, 0.9f);
    x = render(device, 0.2f, kRate);
    EXPECT(bend(x.left, 0, at(0.2f)) < 2.0 * reference, "a stroke on a sounding key has no step in it");
  }
  // A steal.
  patch(kDark);
  for (int n = 0; n < 12; ++n) device.note_on(n, 150.0f + 20.0f * n, 0.5f);
  Stereo x = render(device, 1.0f, kRate);
  const double crowd = bend(x.left, at(0.3f), at(1.0f));
  for (int n = 0; n < 6; ++n) {
    device.note_on(50 + n, 150.0f + 33.0f * n, 0.5f);
    x = render(device, 0.1f, kRate);
    EXPECT(bend(x.left, 0, at(0.012f)) < 1.5 * crowd, "a stolen voice does not click");
  }
}

void expect_silent(const char* what) {
  render(device, 9.0f, kRate);
  const Stereo rest = render(device, 0.5f, kRate);
  EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, what);
}

void test_keys() {
  patch(kPlain);
  device.note_on(1, 220.0f, 0.7f);
  render(device, 0.5f, kRate);
  device.note_on(1, 330.0f, 0.7f);
  EXPECT(tone_level(render(device, 2.5f, kRate).left, 220.0, kRate, at(2.0f), at(2.5f)) < 1.0e-4, "one id at another pitch lets the first go");
  patch({});
  device.note_on(1, 220.0f, 0.7f);
  render(device, 0.05f, kRate);
  device.note_on(1, 330.0f, 0.7f);
  render(device, 0.05f, kRate);
  device.note_on(1, 220.0f, 0.7f);
  render(device, 0.3f, kRate);
  device.note_off(1);
  expect_silent("one id at A, at B and at A again, then one off, leaves nothing");
  // A full house, a steal, the stolen-for key struck twice inside the fade.
  patch({});
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f + 11.0f * n, 0.7f);
  render(device, 0.3f, kRate);
  device.note_on(40, 500.0f, 0.7f);
  render(device, 0.002f, kRate);
  device.note_on(40, 500.0f, 0.9f);
  render(device, 0.1f, kRate);
  for (int n = 0; n < 12; ++n) device.note_off(n);
  device.note_off(40);
  expect_silent("struck twice inside a steal's fade, let go once");
  // Let go before the fade is over: it still ends.
  patch({});
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f + 11.0f * n, 0.7f);
  render(device, 0.3f, kRate);
  device.note_on(40, 500.0f, 0.7f);
  device.note_off(40);
  for (int n = 0; n < 12; ++n) device.note_off(n);
  expect_silent("let go inside a steal's fade");
  // The second note of a chord does not steal the first.
  patch({{rl::kAttack, 4.0f}});
  for (int n = 0; n < 12; ++n) device.note_on(n, kChord[n % 5] * (n < 5 ? 1.0f : 2.0f + 0.13f * n), 0.7f);
  render(device, 0.01f, kRate);
  device.note_on(30, 1000.0f, 0.1f);
  Stereo x = render(device, 3.0f, kRate);
  int heard = 0;
  for (int n = 0; n < 5; ++n) heard += db(tone_level(x.left, kChord[n], kRate, at(2.0f), at(3.0f))) > -70.0;
  EXPECT(heard >= 4, "a young voice is worth as much as it is about to be");
}

void test_bad_input() {
  for (float hz : {0.0f, 5.0f, 20000.0f, 1.0e9f, -3.0f, std::nanf(""), INFINITY}) {
    for (float gain : {0.0f, 2.0f, -1.0f, std::nanf(""), INFINITY}) {
      patch({});
      device.note_on(1, hz, gain);
      const Stereo out = render(device, 0.1f, kRate);
      EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < 1.0, "an absurd note is survived");
    }
  }
  // Every knob swept while a chord sounds.
  patch({});
  for (int n = 0; n < 5; ++n) device.note_on(n, kChord[n], 0.8f);
  double worst = 0.0;
  for (int id = 0; id < rl::kNumParams; ++id) {
    for (int step = 0; step <= 24; ++step) {
      const float t = static_cast<float>(step <= 12 ? step : 24 - step) / 12.0f;
      device.set_param(id, rl::kParamMin[id] + (rl::kParamMax[id] - rl::kParamMin[id]) * t);
      const Stereo out = render(device, 0.02f, kRate);
      EXPECT(finite(out.left) && finite(out.right), "finite while every knob is swept");
      worst = std::max(worst, std::max(peak(out.left), peak(out.right)));
    }
    device.set_param(id, rl::kParamDefault[id]);
  }
  EXPECT(worst < 1.01, "and bounded");
}

void test_blocks_and_rates() {
  const auto story = [](int block) {
    device.init(kRate);
    device.set_param(rl::kWind, 0.5f);
    Stereo out;
    const auto go = [&](float seconds) { out = concat(out, run(device, silence(seconds, kRate), block)); };
    device.note_on(1, 220.0f, 0.7f);
    device.note_on(2, 277.0f, 0.7f);
    go(0.4096f);
    device.note_off(1);
    device.note_off(2);
    go(6.1440f);  // into sleep
    device.set_param(rl::kTone, 0.4f);
    device.set_param(rl::kNear, 3.0f);
    device.note_on(3, 330.0f, 0.7f);
    go(0.6144f);
    for (int n = 0; n < 14; ++n) device.note_on(20 + n, 200.0f + 17.0f * n, 0.6f);
    go(0.6144f);
    return out;
  };
  const Stereo whole = story(128);
  for (int block : {1, 7, 2048}) {
    const Stereo other = story(block);
    double worst = 0.0;
    for (size_t i = 0; i < std::min(whole.size(), other.size()); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(whole.left[i]) - other.left[i]));
    }
    std::printf("block %d: differs by %g\n", block, worst);
    EXPECT(worst < 1.0e-6, "the same sound at every block size, across a sleep");
  }
  double levels[3];
  int i = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    const Stereo out = play({{rl::kWind, 0.4f}}, 220.0f, 3.0f, 0.7f, rate);
    levels[i++] = db(rms(out.left, at(0.5f, rate), at(3.0f, rate)));
  }
  EXPECT(std::fabs(levels[0] - levels[1]) < 0.7 && std::fabs(levels[2] - levels[1]) < 0.7, "one level at every sample rate");
}

}  // namespace

int main() {
  Conformance spec;
  spec.name = "ridge-lines";
  spec.num_params = rl::kNumParams;
  spec.mins = rl::kParamMin;
  spec.maxs = rl::kParamMax;
  spec.defaults = rl::kParamDefault;
  spec.tail_seconds = 4.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  test_pitch();
  test_sliding();
  test_band();
  test_colours();
  test_land();
  test_level();
  test_envelope();
  test_clicks();
  test_keys();
  test_bad_input();
  test_blocks_and_rates();
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 3.0f / 12.0f), 0.7f);
  report_cost("ridge-lines (8 notes)", 5.0f, kRate, [] { render(device, 5.0f, kRate); });
  return finish("ridge-lines");
}
