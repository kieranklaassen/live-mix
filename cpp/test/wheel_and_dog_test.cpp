// Native harness of Wheel and Dog: the conformance pass, then what makes it a
// wheel with five strings and a loose bridge, each a measurement of a render.

#include <algorithm>
#include <cstring>
#include <initializer_list>

#include "../devices/wheel-and-dog/wheel_and_dog.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::WheelAndDog;
namespace p = livemix::wheel_and_dog;

namespace {

constexpr float kRate = 48000.0f;
WheelAndDog device;

struct Set {
  int id;
  float value;
};
using Sets = std::initializer_list<Set>;

float hz(float midi) { return 440.0f * std::pow(2.0f, (midi - 69.0f) / 12.0f); }
size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate + 0.5); }

void fresh(Sets sets, float rate = kRate) {
  device.init(rate);
  for (const Set& s : sets) device.set_param(s.id, s.value);
}

void key(int midi, float gain = 0.7f) { device.note_on(midi, hz(static_cast<float>(midi)), gain); }

double stereo_rms(const Stereo& x, size_t from, size_t to) {
  const double l = rms(x.left, from, to), r = rms(x.right, from, to);
  return std::sqrt(0.5 * (l * l + r * r));
}
double stereo_peak(const Stereo& x, size_t from = 0) { return std::max(peak(x.left, from), peak(x.right, from)); }

std::vector<float> mono(const Stereo& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (x.left[i] + x.right[i]);
  return out;
}

double difference(const Stereo& a, const Stereo& b, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < std::min(a.size(), b.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// Levels in dB of windows of `seconds`.
std::vector<double> levels(const Stereo& x, double seconds, double from, double rate = kRate) {
  std::vector<double> out;
  const size_t n = at(seconds, rate);
  for (size_t i = at(from, rate); i + n <= x.size(); i += n) out.push_back(db(stereo_rms(x, i, i + n)));
  return out;
}
double range(const std::vector<double>& v) {
  return *std::max_element(v.begin(), v.end()) - *std::min_element(v.begin(), v.end());
}

// The envelope of the band 2 to 6 kHz, one value a millisecond.
std::vector<double> bark_envelope(const std::vector<float>& x, double rate = kRate) {
  livemix::kit::Svf high[2], low[2];
  for (auto& f : high) {
    f.reset();
    f.set(2000.0f, 0.7071f, static_cast<float>(rate));
  }
  for (auto& f : low) {
    f.reset();
    f.set(6000.0f, 0.7071f, static_cast<float>(rate));
  }
  std::vector<double> out;
  const size_t n = at(0.001, rate);
  double sum = 0.0, smooth = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    float y = x[i];
    for (auto& f : high) y = f.highpass(y);
    for (auto& f : low) y = f.lowpass(y);
    sum += static_cast<double>(y) * y;
    if ((i + 1) % n == 0) {
      smooth += (sum / static_cast<double>(n) - smooth) * 0.2;
      out.push_back(std::sqrt(smooth));
      sum = 0.0;
    }
  }
  return out;
}

// Times in seconds where the envelope rises over `ratio` times its median.
std::vector<double> onsets(const std::vector<double>& envelope, double from, double ratio) {
  std::vector<double> sorted(envelope.begin() + static_cast<long>(from * 1000.0), envelope.end());
  std::sort(sorted.begin(), sorted.end());
  const double floor = sorted[sorted.size() / 2];
  std::vector<double> out;
  bool over = envelope[static_cast<size_t>(from * 1000.0)] > floor * ratio;
  for (size_t i = static_cast<size_t>(from * 1000.0); i < envelope.size(); ++i) {
    if (!over && envelope[i] > floor * ratio) {
      over = true;
      out.push_back(static_cast<double>(i) * 0.001);
    } else if (over && envelope[i] < floor * ratio * 0.75) {
      over = false;
    }
  }
  return out;
}

void conformance() {
  Conformance spec;
  spec.name = "wheel-and-dog";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 2.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
}

// Example 1: one key D2 and no accents is D2, D3 and A3 and nothing else, held
// for sixteen seconds with no seam.
void steady_drone() {
  fresh({{p::kSpeed, 0.5f}, {p::kAccents, 0.0f}, {p::kRosin, 0.4f}, {p::kNoise, 0.0f}});
  key(38);
  const Stereo x = render(device, 18.0f, kRate);
  const double moved = range(levels(x, 0.1, 2.0));
  std::printf("  D2 held: level moves %.2f dB over 16 s\n", moved);
  EXPECT(moved < 1.0, "a held drone stays within 1 dB for 16 s");
  EXPECT(device.meter(2) == 0.0f, "a drone key plays no melody");

  const std::vector<float> m = mono(x);
  const size_t from = at(2.0);
  for (double f : {73.416, 146.832, 220.255}) {
    const double level = db(tone_level(m, f, kRate, from));
    std::printf("  partial %.1f Hz: %.1f dB\n", f, level);
    EXPECT(level > -50.0, "the drones' own notes are there");
    EXPECT_NEAR(1200.0 * std::log2(dominant_frequency(m, kRate, f * 0.99, f * 1.01, from, at(5.0)) / f), 0.0, 1.0,
                "a drone is in tune to a cent");
  }
  // Between the partials of 73.4 Hz there is nothing: not a melody, not a seam.
  const double tone = db(tone_level(m, 146.832, kRate, from));
  for (double f : {110.0, 183.5, 256.9, 330.0, 293.66 * 1.06}) {
    EXPECT(db(tone_level(m, f, kRate, from)) < tone - 50.0, "no other note sounds");
  }
  // With the hiss off nothing repeats and nothing clicks: the largest third
  // difference is of one size throughout.
  auto kink = [&](size_t a, size_t b) {
    double worst = 0.0;
    for (size_t i = a + 3; i < b; ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(m[i]) - 3.0 * m[i - 1] + 3.0 * m[i - 2] - m[i - 3]));
    }
    return worst;
  };
  const double reference = kink(at(2.0), at(6.0));
  double worst = 0.0;
  for (int s = 6; s < 18; ++s) worst = std::max(worst, kink(at(s), at(s + 1)));
  EXPECT(worst < 1.25 * reference, "a held note has no seam");
}

// Example 2: accents, dog and threshold.
void barks() {
  auto held = [](Sets sets, float seconds, int note = 38) {
    fresh(sets);
    key(note);
    return render(device, seconds, kRate);
  };
  const Stereo three = held({{p::kSpeed, 0.5f}, {p::kAccents, 2.0f}, {p::kDepth, 0.3f}, {p::kDog, 0.7f}}, 22.0f);
  const std::vector<double> times = onsets(bark_envelope(three.left), 2.0, 2.0);
  EXPECT(times.size() >= 28 && times.size() <= 31, "three barks a turn over 20 s");
  if (times.size() > 2) {
    const double rate = static_cast<double>(times.size() - 1) / (times.back() - times.front());
    double uneven = 0.0;
    for (size_t i = 1; i < times.size(); ++i) uneven = std::max(uneven, std::fabs(times[i] - times[i - 1] - 1.0 / 1.5));
    std::printf("  three a turn at 0.5 turns a second: %zu barks, %.4f a second, gaps within %.0f ms\n", times.size(), rate,
                1000.0 * uneven);
    EXPECT_NEAR(rate, 1.5, 0.015, "three barks a turn at 1.5 Hz");
    EXPECT(uneven < 0.02, "even accents bark evenly");
  }
  const Stereo tame = held({{p::kDepth, 0.3f}, {p::kDog, 0.0f}}, 6.0f);
  EXPECT(onsets(bark_envelope(tame.left), 2.0, 2.0).empty(), "with the dog down nothing barks");
  const Stereo under = held({{p::kDepth, 0.07f}, {p::kDog, 0.7f}}, 6.0f);
  const Stereo under_tame = held({{p::kDepth, 0.07f}, {p::kDog, 0.0f}}, 6.0f);
  EXPECT(difference(under, under_tame) == 0.0, "a push under the threshold leaves the dog asleep, to the sample");
  const Stereo none = held({{p::kAccents, 0.0f}, {p::kDepth, 1.0f}, {p::kDog, 1.0f}, {p::kSpin, 2.0f}}, 6.0f);
  const Stereo none_tame = held({{p::kAccents, 0.0f}, {p::kDepth, 1.0f}, {p::kDog, 0.0f}, {p::kSpin, 2.0f}}, 6.0f);
  EXPECT(difference(none, none_tame) == 0.0, "an even wheel does not move the loosest dog");

  // The threshold falls as Dog rises: at a push of 0.25 it opens in between.
  double before = -200.0;
  int climbed = 0;
  for (float dog : {0.1f, 0.4f, 0.6f, 0.8f, 1.0f}) {
    const Stereo with = held({{p::kDepth, 0.25f}, {p::kDog, dog}}, 5.0f);
    const Stereo without = held({{p::kDepth, 0.25f}, {p::kDog, 0.0f}}, 5.0f);
    Stereo bark = with;
    for (size_t i = 0; i < bark.size(); ++i) {
      bark.left[i] -= without.left[i];
      bark.right[i] -= without.right[i];
    }
    const double level = db(stereo_rms(bark, at(2.0), at(5.0)));
    std::printf("  push 0.25, dog %.1f: bark %.1f dB\n", dog, level);
    if (level > before) ++climbed;
    before = level;
  }
  EXPECT(climbed >= 4, "a looser dog barks more");

  // Never dominates: at the loosest dog and the hardest push, the bark in its
  // loudest 20 ms against the drones in theirs.
  for (float depth : {0.5f, 1.0f}) {
    const Stereo with = held({{p::kDepth, depth}, {p::kDog, 1.0f}}, 8.0f);
    const Stereo without = held({{p::kDepth, depth}, {p::kDog, 0.0f}}, 8.0f);
    Stereo bark = with;
    for (size_t i = 0; i < bark.size(); ++i) {
      bark.left[i] -= without.left[i];
      bark.right[i] -= without.right[i];
    }
    const std::vector<double> b = levels(bark, 0.02, 2.0), d = levels(without, 0.02, 2.0);
    const double over = *std::max_element(b.begin(), b.end()) - *std::max_element(d.begin(), d.end());
    std::printf("  dog 1, depth %.1f: loudest bark %.1f dB against the drones\n", depth, over);
    EXPECT(over > -6.0 && over < 0.5, "the bark is heard and never dominates");
  }

  // Long short: the second of each pair is late by a third of a gap.
  const Stereo limp = held({{p::kAccents, 1.0f}, {p::kPattern, 1.0f}, {p::kDepth, 0.4f}, {p::kDog, 0.7f}}, 14.0f);
  const std::vector<double> steps = onsets(bark_envelope(limp.left), 2.0, 2.0);
  double longest = 0.0, shortest = 10.0;
  for (size_t i = 1; i < steps.size(); ++i) {
    longest = std::max(longest, steps[i] - steps[i - 1]);
    shortest = std::min(shortest, steps[i] - steps[i - 1]);
  }
  std::printf("  long short, two a turn: gaps %.3f and %.3f s\n", longest, shortest);
  EXPECT_NEAR(longest / shortest, 2.0, 0.1, "long short is two to one");
  // First strong: the dog hears only the first when the others are half.
  const Stereo strong = held({{p::kPattern, 2.0f}, {p::kDepth, 0.3f}, {p::kDog, 0.6f}}, 14.0f);
  const std::vector<double> firsts = onsets(bark_envelope(strong.left), 3.0, 2.0);
  EXPECT(firsts.size() >= 5 && firsts.size() <= 6, "first strong barks once a turn at a push in between");
}

// Example 3: six small pushes a turn are an even trembling.
void trembling() {
  fresh({{p::kAccents, 4.0f}, {p::kDepth, 0.15f}, {p::kDog, 0.0f}, {p::kSpeed, 0.5f}});
  key(38);
  const Stereo x = render(device, 12.0f, kRate);
  std::vector<float> level;
  for (double v : levels(x, 0.0272, 2.0)) level.push_back(static_cast<float>(v));
  const double average = mean(level);
  for (float& v : level) v -= static_cast<float>(average);
  const double rate = 1.0 / 0.0272;
  const double at_six = tone_level(level, 3.0, rate), at_turn = tone_level(level, 0.5, rate);
  std::printf("  six a turn, depth 0.15: %.2f dB at 3 Hz, %.2f dB at a turn\n", at_six, at_turn);
  EXPECT_NEAR(dominant_frequency(level, rate, 1.0, 5.0), 3.0, 0.03, "the trembling is at six times the turn");
  EXPECT(at_six > 0.3 && at_turn < 0.6 * at_six, "and even");
}

// Example 4: the melody's pitches, with the drones unmoved underneath.
void melody_line() {
  fresh({{p::kAccents, 0.0f}, {p::kTangents, 0.0f}, {p::kNoise, 0.0f}, {p::kSpread, 0.0f}});
  key(38);
  Stereo x = render(device, 2.0f, kRate);
  const double alone = db(tone_level(mono(x), 73.416, kRate, at(1.0)));
  int before = -1;
  for (int note : {62, 65, 64, 69}) {
    key(note);
    if (before >= 0) device.note_off(before);
    before = note;
    const Stereo part = render(device, 1.5f, kRate);
    const std::vector<float> m = mono(part);
    const double heard = dominant_frequency(m, kRate, hz(note) * 0.97, hz(note) * 1.03, at(0.6), at(1.4));
    const double cents = 1200.0 * std::log2(heard / hz(note));
    const double drone = db(tone_level(m, 73.416, kRate, at(0.5)));
    std::printf("  melody %d: %.2f ct off, drone %+.2f dB\n", note, cents, drone - alone);
    EXPECT_NEAR(cents, 0.0, 2.5, "the melody is in tune");
    EXPECT_NEAR(drone, alone, 1.0, "the drone is unchanged under it");
    EXPECT(device.meter(2) == 1.0f, "the melody is on");
  }
  device.note_off(before);
  const Stereo gone = render(device, 1.5f, kRate);
  const double left = db(tone_level(mono(gone), 440.0 * 1.0, kRate, at(0.7)));
  (void)left;
  EXPECT(device.meter(2) == 0.0f, "the last melody key lifts the string");
  EXPECT_NEAR(db(tone_level(mono(gone), 73.416, kRate, at(0.7))), alone, 0.3, "and the drones go on");
}

double line_at(const Stereo& x, float note, double from, double to) {
  return db(tone_level(mono(x), hz(note), kRate, at(from), at(to)));
}

void melody_rules() {
  // Bare strings with no drones: what the melody does is all there is.
  const Sets bare = {{p::kAccents, 0.0f}, {p::kDrones, 0.0f},   {p::kTrompette, 0.0f}, {p::kTangents, 0.0f},
                     {p::kNoise, 0.0f},   {p::kMelody, 0.0f}, {p::kSplit, 0.0f},     {p::kBody, 0.0f}};
  // Last note priority, and back to a key still held.
  fresh(bare);
  key(62);
  render(device, 1.0f, kRate);
  key(66);
  Stereo x = render(device, 0.6f, kRate);
  EXPECT(line_at(x, 66, 0.2, 0.6) > line_at(x, 62, 0.2, 0.6) + 40.0, "the newest key plays");
  device.note_off(66);
  x = render(device, 0.6f, kRate);
  EXPECT(line_at(x, 62, 0.2, 0.6) > line_at(x, 66, 0.2, 0.6) + 40.0, "and lets go to the one still held");

  // Legato: no attack of its own. The level through a change never dips.
  fresh(bare);
  key(62);
  render(device, 1.5f, kRate);
  const Stereo steady = render(device, 0.5f, kRate);
  key(64);
  x = render(device, 0.3f, kRate);
  const std::vector<double> through = levels(x, 0.02, 0.0);
  const double dip = db(stereo_rms(steady, 0, steady.size())) - *std::min_element(through.begin(), through.end());
  std::printf("  a key change on a turning wheel dips %.2f dB\n", dip);
  EXPECT(dip < 1.5, "a key change does not start the note again");

  // Duo: the two newest keys, both there.
  fresh(bare);
  device.set_param(p::kMelody, 2.0f);
  key(62);
  render(device, 0.5f, kRate);
  key(66);
  render(device, 0.3f, kRate);
  key(69);
  x = render(device, 0.8f, kRate);
  const double a = line_at(x, 66, 0.2, 0.8), b = line_at(x, 69, 0.2, 0.8), gone = line_at(x, 62, 0.2, 0.8);
  std::printf("  duo: %.1f and %.1f dB, the oldest key %.1f dB\n", a, b, gone);
  EXPECT(a > gone + 30.0 && b > gone + 30.0 && std::fabs(a - b) < 6.0, "duo plays the two newest keys");
  // Octave: the second string an octave lower.
  fresh(bare);
  device.set_param(p::kMelody, 1.0f);
  key(69);
  x = render(device, 1.5f, kRate);
  EXPECT(line_at(x, 57, 0.8, 1.5) > line_at(x, 69, 0.8, 1.5) - 12.0, "octave adds the octave below");
  fresh(bare);
  key(69);
  x = render(device, 1.5f, kRate);
  EXPECT(line_at(x, 57, 0.8, 1.5) < line_at(x, 69, 0.8, 1.5) - 50.0, "unison has nothing below the key");

  // Two strings back on one note lean together: whatever their phases were,
  // the unison ends at the level it has from the start.
  fresh(bare);
  key(62);
  render(device, 2.0f, kRate);
  const double plain = line_at(render(device, 1.0f, kRate), 62, 0.0, 1.0);
  double worst = 0.0;
  for (int k = 0; k < 6; ++k) {
    fresh(bare);
    device.set_param(p::kMelody, 2.0f);
    key(62);
    render(device, 0.7f, kRate);
    key(69);
    render(device, 0.31f + 0.037f * static_cast<float>(k), kRate);
    device.note_off(69);
    render(device, 3.0f, kRate);
    worst = std::max(worst, std::fabs(line_at(render(device, 1.0f, kRate), 62, 0.0, 1.0) - plain));
  }
  std::printf("  unison after a duo: within %.2f dB of a plain one\n", worst);
  EXPECT(worst < 0.5, "a unison never stands cancelled");

  // Tangents: a knock at the change of note and not between.
  auto knock = [&](float amount) {
    fresh(bare);
    device.set_param(p::kTangents, amount);
    key(62);
    render(device, 1.0f, kRate);
    key(64);
    return render(device, 0.2f, kRate);
  };
  const Stereo quiet = knock(0.0f), knocked = knock(1.0f);
  Stereo only = knocked;
  for (size_t i = 0; i < only.size(); ++i) {
    only.left[i] -= quiet.left[i];
    only.right[i] -= quiet.right[i];
  }
  const double first = db(stereo_rms(only, 0, at(0.02))), tone = db(stereo_rms(quiet, 0, at(0.02)));
  std::printf("  tangent at 1: %.1f dB against the string in its first 20 ms\n", first - tone);
  EXPECT(first > tone - 14.0 && first < tone + 6.0, "the tangent is heard");
  EXPECT(stereo_rms(only, at(0.15), at(0.2)) < 1.0e-4, "and over in a tenth of a second");
}

// Example 5: five cents at A3 beat at 0.6 Hz against the melody's A.
void beating() {
  fresh({{p::kAccents, 0.0f}, {p::kDrones, 0.0f}, {p::kTrompette, 1.0f}, {p::kDetune, 5.0f}, {p::kNoise, 0.0f},
         {p::kSpread, 0.0f}});
  key(38);
  key(57);
  const Stereo x = render(device, 22.0f, kRate);
  const std::vector<float> m = mono(x);
  std::vector<float> envelope;
  for (size_t i = at(2.0); i + at(0.1) <= m.size(); i += at(0.1)) {
    envelope.push_back(static_cast<float>(tone_level(m, 220.3, kRate, i, i + at(0.1))));
  }
  const double average = mean(envelope);
  for (float& v : envelope) v -= static_cast<float>(average);
  const double beat = dominant_frequency(envelope, 10.0, 0.3, 1.5);
  std::printf("  five cents at A3 beat at %.3f Hz, %.0f %% deep\n", beat, 100.0 * tone_level(envelope, beat, 10.0) / average);
  EXPECT_NEAR(beat, 0.636, 0.03, "five cents beat at 0.6 Hz");
  EXPECT(tone_level(envelope, beat, 10.0) > 0.2 * average, "and can be heard to");
}

void drone_notes() {
  const Sets plain = {{p::kAccents, 0.0f}, {p::kNoise, 0.0f}, {p::kDetune, 0.0f}, {p::kSpread, 0.0f}, {p::kBody, 0.0f}};
  auto level = [](const Stereo& x, float note) { return line_at(x, note, 1.0, 2.0); };
  // With no drone key yet the drones stand on D.
  fresh(plain);
  key(60);
  Stereo x = render(device, 2.0f, kRate);
  EXPECT(level(x, 38) > -50.0 && device.meter(2) == 1.0f, "a melody key alone has D under it");
  // The lowest drone key held, and the next one up when it is let go.
  key(43);
  x = render(device, 2.0f, kRate);
  EXPECT(level(x, 43) > level(x, 38) + 40.0, "the first drone key takes the drones");
  key(40);
  x = render(device, 2.0f, kRate);
  EXPECT(level(x, 40) > level(x, 43) + 40.0, "a lower one takes them down");
  key(45);
  x = render(device, 2.0f, kRate);
  EXPECT(level(x, 40) > -50.0 && level(x, 45) < level(x, 40) - 40.0, "a higher one does not");
  device.note_off(40);
  x = render(device, 2.0f, kRate);
  EXPECT(level(x, 43) > level(x, 40) + 40.0, "let go, the drones go to the lowest left");
  device.note_off(43);
  device.note_off(45);
  x = render(device, 2.0f, kRate);
  EXPECT(level(x, 45) > level(x, 38) + 40.0, "with none left they stay");
  // A fixed note, whatever is held, and each tuning.
  const float steps[4][2] = {{12, 19}, {12, 17}, {12, 24}, {7, 12}};
  for (int t = 0; t < 4; ++t) {
    fresh(plain);
    device.set_param(p::kDrone, 8.0f);  // G
    device.set_param(p::kTuning, static_cast<float>(t));
    key(38);
    x = render(device, 2.0f, kRate);
    EXPECT(level(x, 43) > -50.0 && level(x, 43 + steps[t][0]) > -50.0 && level(x, 43 + steps[t][1]) > -50.0,
           "a fixed drone note in each tuning");
    EXPECT(level(x, 38) < level(x, 43) - 40.0, "and not the key's own");
  }
  // Split: where the two kinds of key meet.
  fresh(plain);
  key(47);
  render(device, 0.5f, kRate);
  EXPECT(device.meter(2) == 0.0f, "B2 holds the drones");
  key(48);
  render(device, 0.1f, kRate);
  EXPECT(device.meter(2) == 1.0f, "C3 plays the melody");
  // A held key keeps its kind when Split moves.
  device.note_off(48);
  render(device, 0.1f, kRate);
  device.set_param(p::kSplit, 0.0f);
  render(device, 0.1f, kRate);
  EXPECT(device.meter(2) == 0.0f, "a held drone key stays one");
}

// Example 6: little rosin and much hiss is a cotton whisper.
void cotton() {
  auto share = [](float rosin, float noise) {
    fresh({{p::kAccents, 0.0f}, {p::kRosin, rosin}, {p::kNoise, noise}});
    key(38);
    const Stereo with = render(device, 5.0f, kRate);
    fresh({{p::kAccents, 0.0f}, {p::kRosin, rosin}, {p::kNoise, 0.0f}});
    key(38);
    const Stereo without = render(device, 5.0f, kRate);
    Stereo hiss = with;
    for (size_t i = 0; i < hiss.size(); ++i) {
      hiss.left[i] -= without.left[i];
      hiss.right[i] -= without.right[i];
    }
    const double h = stereo_rms(hiss, at(1.0), hiss.size()), t = stereo_rms(without, at(1.0), without.size());
    return h * h / (h * h + t * t);
  };
  const double firm = share(0.4f, 0.18f), whisper = share(0.1f, 0.5f);
  std::printf("  hiss is %.2f %% of the energy at the defaults, %.1f %% as cotton\n", 100.0 * firm, 100.0 * whisper);
  EXPECT(whisper > 10.0 * firm && whisper > 0.05, "cotton is far more hiss");
  // Rosin: thin when there is little (less fundamental against the octave), raw when there is much.
  auto shape = [](float rosin, double* thin, double* bright, double* loud) {
    fresh({{p::kAccents, 0.0f}, {p::kNoise, 0.0f}, {p::kRosin, rosin}, {p::kDrones, 0.0f}, {p::kTrompette, 0.0f}});
    key(60);
    const Stereo x = render(device, 3.0f, kRate);
    const std::vector<float> m = mono(x);
    *thin = db(tone_level(m, hz(60), kRate, at(1.0))) - db(tone_level(m, hz(72), kRate, at(1.0)));
    *bright = energy_above(m, 2000.0, kRate, at(1.0));
    *loud = db(rms(m, at(1.0)));
  };
  double thin[3], bright[3], loud[3];
  const float rosins[3] = {0.1f, 0.4f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    shape(rosins[i], &thin[i], &bright[i], &loud[i]);
    std::printf("  rosin %.1f: fundamental %.1f dB over its octave, %.3f above 2 kHz, %.1f dB\n", rosins[i], thin[i],
                bright[i], loud[i]);
  }
  EXPECT(thin[0] < thin[1] - 5.0, "little rosin is thin");
  EXPECT(bright[2] > 1.3 * bright[1], "much rosin is raw");
  EXPECT(loud[0] < loud[1] && loud[1] - loud[0] < 9.0 && std::fabs(loud[2] - loud[1]) < 4.0, "and no jump of level");
}

// The dog's contact on a steady string: what folds back.
void contact_folding() {
  for (double rate : {44100.0, 48000.0, 96000.0}) {
    for (double tone : {220.0, 246.94, 587.33}) {
      livemix::wheel_and_dog_detail::Contact contact;
      contact.init(static_cast<float>(2.0 * rate));
      // Put the tone where the images of its high harmonics fall between its
      // own: the rate is (n + 0.37) times the tone.
      const double f = rate / (std::floor(rate / tone) + 0.37);
      const double step = f / (2.0 * rate);
      double phase = 0.0;
      std::vector<float> out(at(2.0, rate));
      for (float& y : out) {
        float half[2];
        for (float& h : half) {
          phase += step;
          if (phase >= 1.0) phase -= 1.0;
          h = contact.beat(livemix::wheel_and_dog_detail::ramp(phase, step), 1.0f);
        }
        y = contact.down.down(half[0], half[1]);
      }
      const size_t from = at(0.2, rate);
      double whole = 0.0, folded = 0.0;
      const int top = static_cast<int>(0.499 * rate / f);
      for (int n = 1; n <= top; ++n) whole = std::max(whole, tone_level(out, n * f, rate, from));
      // Images lie at 0.37 of the way between the harmonics.
      for (int n = 0; n < top; ++n) folded = std::max(folded, tone_level(out, (n + 0.37) * f, rate, from));
      for (int n = 0; n < top; ++n) folded = std::max(folded, tone_level(out, (n + 0.63) * f, rate, from));
      std::printf("  contact at %.0f Hz, %.0f Hz string: strongest image %.1f dB\n", rate, f, db(folded / whole));
      EXPECT(folded < whole * 1.0e-3, "what the contact folds back is 60 dB down");
    }
  }
}


// --- the wheel's end, sleep and block sizes ----------------------------------------------------

void run_down() {
  // Four accents at two turns a second, let go over four seconds.
  fresh({{p::kSpeed, 2.0f}, {p::kAccents, 2.0f}, {p::kDepth, 0.5f}, {p::kDog, 0.8f}, {p::kSpin, 4.0f}});
  key(38);
  render(device, 6.0f, kRate);
  device.note_off(38);
  Stereo down;
  std::vector<double> times;
  bool over = device.meter(1) > 0.2f;
  for (int k = 0; k < 800; ++k) {
    down = concat(down, render(device, 0.005f, kRate));
    const bool now = device.meter(1) > 0.2f;
    if (now && !over) times.push_back(0.005 * k);
    over = now;
  }
  const std::vector<double> level = levels(down, 0.5, 0.0);
  int falls = 0;
  for (size_t i = 1; i < level.size(); ++i) falls += level[i] < level[i - 1] + 0.3 ? 1 : 0;
  std::printf("  run down: %.1f dB at first, %.1f at 2 s, %.1f at 3.5 s\n", level[0], level[4], level.back());
  EXPECT(falls == static_cast<int>(level.size()) - 1 && level[0] - level.back() > 20.0, "the drones fade as the wheel slows");

  EXPECT(times.size() >= 4, "it barks on the way down");
  if (times.size() >= 4) {
    const double first = times[1] - times[0], last = times[times.size() - 1] - times[times.size() - 2];
    std::printf("  barks on the way down: %zu, gaps from %.3f to %.3f s, the last at %.2f s\n", times.size(), first, last,
                times.back());
    EXPECT(last > 1.3 * first, "further and further apart");
    EXPECT(times.back() < 3.6, "and the dog is silent before the strings");
  }
  render(device, 0.05f, kRate);
  EXPECT(device.meter(3) == 0.0f, "the wheel stands");
  render(device, 0.7f, kRate);
  const Stereo after = render(device, 0.5f, kRate);
  EXPECT(stereo_peak(after) == 0.0, "exact zero after the tail");
  for (int m = 0; m < 4; ++m) EXPECT(device.meter(m) == 0.0f, "at rest every meter reads nothing");
  // Spin up: the level arrives in the time it says.
  for (float spin : {0.1f, 1.0f, 4.0f}) {
    fresh({{p::kAccents, 0.0f}, {p::kSpin, spin}, {p::kTangents, 0.0f}});
    key(38);
    const Stereo up = render(device, spin + 2.0f, kRate);
    const std::vector<double> l = levels(up, 0.02, 0.0);
    const double full = l.back();
    size_t there = 0;
    while (there < l.size() && l[there] < full - 1.5) ++there;
    EXPECT(0.02 * static_cast<double>(there) > 0.55 * spin - 0.04 && 0.02 * static_cast<double>(there) < spin + 0.12,
           "the wheel comes up to speed over Spin");
  }
}

// The same phrase whatever the block size, with silences that end around the
// moment the device falls asleep and a knob moved in each.
void block_sizes() {
  auto phrase = [](int block, double silence) {
    fresh({{p::kSpin, 0.1f}, {p::kDog, 0.8f}, {p::kMelody, 2.0f}});
    Stereo out;
    const int ragged[] = {1, 7, 64, 128, 33, 512, 2048, 5};
    int which = 0;
    auto play = [&](double seconds) {
      size_t left = at(seconds);
      while (left > 0) {
        const int size = block > 0 ? block : ragged[which++ % 8];
        const int n = static_cast<int>(std::min(left, static_cast<size_t>(size)));
        device.process(n);
        out.left.insert(out.left.end(), device.out_left(), device.out_left() + n);
        out.right.insert(out.right.end(), device.out_right(), device.out_right() + n);
        left -= static_cast<size_t>(n);
      }
    };
    key(38);
    key(62);
    play(0.4003);
    key(66, 0.9f);
    play(0.2);
    for (int k : {38, 62, 66}) device.note_off(k);
    play(silence);
    device.set_param(p::kBrightness, 0.9f);
    device.set_param(p::kDepth, 1.0f);
    device.set_param(p::kVolume, -9.0f);
    device.set_param(p::kDetune, 11.0f);
    device.set_param(p::kRosin, 0.8f);
    play(0.003);
    key(40);
    key(64);
    play(0.5);
    device.note_off(64);
    play(0.2);
    return out;
  };
  double worst = 0.0;
  for (double silence : {0.05, 0.09, 0.0985, 0.11, 0.4, 0.66, 0.68, 0.69, 0.6965, 0.7, 0.72, 0.75, 1.3}) {
    const Stereo reference = phrase(128, silence);
    for (int block : {1, 2048, 0}) worst = std::max(worst, difference(phrase(block, silence), reference));
  }
  std::printf("  block sizes 1, 128, 2048 and ragged: %g apart\n", worst);
  EXPECT(worst < 1.0e-6, "the block size does not matter, across a sleep too");

  // The first key after a silence starts as from init: the wheel at phase 0,
  // the knobs moved in the silence arrived.
  fresh({});
  key(38);
  key(65);
  render(device, 3.137f, kRate);
  device.note_off(38);
  device.note_off(65);
  render(device, 3.0f, kRate);
  device.set_param(p::kRosin, 0.9f);
  device.set_param(p::kVolume, -10.0f);
  device.set_param(p::kDrone, 6.0f);
  device.set_param(p::kMelody, 1.0f);
  device.set_param(p::kBody, 1.0f);
  key(62);
  const Stereo second = render(device, 2.0f, kRate);
  fresh({{p::kRosin, 0.9f}, {p::kVolume, -10.0f}, {p::kDrone, 6.0f}, {p::kMelody, 1.0f}, {p::kBody, 1.0f}});
  key(62);
  const Stereo first = render(device, 2.0f, kRate);
  EXPECT(difference(first, second) == 0.0, "a note after a silence is the first note, to the sample");
}

// --- keys ----------------------------------------------------------------------------------------

void keys_let_go() {
  auto silent_after = [](const char* what) {
    render(device, 2.0f, kRate);
    const Stereo after = render(device, 0.3f, kRate);
    EXPECT(stereo_peak(after) == 0.0, what);
  };
  // One id at A, at B and at A again, in one block and apart: one note off ends it.
  for (float gap : {0.0f, 0.01f, 0.5f}) {
    fresh({});
    for (float note : {62.0f, 67.0f, 62.0f}) {
      device.note_on(1, hz(note), 0.7f);
      if (gap > 0.0f) render(device, gap, kRate);
    }
    device.note_off(1);
    silent_after("an id sent at A, B and A is one key");
    fresh({});
    for (float note : {38.0f, 62.0f, 40.0f}) device.note_on(1, hz(note), 0.7f);
    device.note_off(1);
    silent_after("also across the split");
  }
  // Two ids at one pitch: one let go, the other plays on at the same level.
  fresh({{p::kAccents, 0.0f}, {p::kTangents, 0.0f}});
  device.note_on(1, hz(62), 0.7f);
  render(device, 1.5f, kRate);
  const double one = stereo_rms(render(device, 1.0f, kRate), 0, at(1.0));
  device.note_on(2, hz(62), 0.7f);
  render(device, 0.5f, kRate);
  const double two = stereo_rms(render(device, 1.0f, kRate), 0, at(1.0));
  device.note_off(1);
  render(device, 0.5f, kRate);
  const double back = stereo_rms(render(device, 1.0f, kRate), 0, at(1.0));
  EXPECT_NEAR(db(two / one), 0.0, 0.2, "two ids at one pitch neither cancel nor double");
  EXPECT_NEAR(db(back / one), 0.0, 0.2, "and the one left plays on");
  device.note_off(2);
  silent_after("and ends");
  // Struck again and again nothing stacks.
  fresh({{p::kAccents, 0.0f}, {p::kTangents, 0.0f}});
  for (int k = 0; k < 40; ++k) {
    device.note_on(1, hz(62), 0.7f);
    render(device, 0.05f, kRate);
  }
  render(device, 0.5f, kRate);
  EXPECT_NEAR(db(stereo_rms(render(device, 1.0f, kRate), 0, at(1.0)) / one), 0.0, 0.2, "a key struck again does not stack");
  // Nonsense.
  fresh({});
  device.note_on(1, std::nanf(""), 0.7f);
  EXPECT(stereo_peak(render(device, 0.2f, kRate)) == 0.0, "a note that is no number is not played");
  device.note_on(2, hz(62), std::nanf(""));
  device.note_on(3, 1.0e30f, 1.0e30f);
  device.note_on(4, -1.0e30f, -1.0f);
  device.note_on(5, INFINITY, 0.5f);
  for (int k = 0; k < 64; ++k) device.in_left()[k] = std::nanf("");
  const Stereo mad = render(device, 0.5f, kRate);
  EXPECT(finite(mad.left) && finite(mad.right) && stereo_peak(mad) < 1.01, "nonsense stays finite");
  for (int k = 1; k <= 5; ++k) device.note_off(k);
  silent_after("and ends");
  // An id struck at another pitch has left the first: duo hears one key.
  fresh({{p::kAccents, 0.0f}, {p::kMelody, 2.0f}, {p::kDrones, 0.0f}, {p::kTrompette, 0.0f}, {p::kNoise, 0.0f}});
  device.note_on(1, hz(62), 0.7f);
  device.note_on(1, hz(68), 0.7f);
  render(device, 1.0f, kRate);
  const Stereo moved = render(device, 1.0f, kRate);
  EXPECT(line_at(moved, 62, 0.0, 1.0) < line_at(moved, 68, 0.0, 1.0) - 50.0, "a key struck elsewhere leaves where it was");
  // And does not push others off the list however often it is struck.
  fresh({});
  device.note_on(2, hz(38), 0.7f);
  for (int k = 0; k < 500; ++k) device.note_on(1, hz(static_cast<float>(60 + k % 9)), 0.7f);
  device.note_off(1);
  render(device, 2.0f, kRate);
  EXPECT(stereo_peak(render(device, 0.5f, kRate)) > 0.01, "a held drone outlasts five hundred strikes of another key");
  device.note_off(2);
  silent_after("and ends when it is let go");
  // init in the middle of a bark leaves nothing of it.
  fresh({{p::kDepth, 1.0f}, {p::kDog, 1.0f}, {p::kSpin, 0.05f}, {p::kSpeed, 3.0f}, {p::kNoise, 1.0f}});
  key(38);
  key(62);
  const Stereo cold = render(device, 0.4037f, kRate);
  for (int k = 0; k < 40 && device.meter(1) < 0.5f; ++k) render(device, 0.004f, kRate);
  fresh({{p::kDepth, 1.0f}, {p::kDog, 1.0f}, {p::kSpin, 0.05f}, {p::kSpeed, 3.0f}, {p::kNoise, 1.0f}});
  key(38);
  key(62);
  EXPECT(difference(cold, render(device, 0.4037f, kRate)) == 0.0, "init leaves nothing of what sounded");
  // More keys than the list holds.
  fresh({});
  for (int k = 0; k < 300; ++k) device.note_on(k, hz(static_cast<float>(30 + k % 60)), 0.8f);
  render(device, 0.2f, kRate);
  for (int k = 0; k < 300; ++k) device.note_off(k);
  silent_after("three hundred keys all let go");
}

// --- level -----------------------------------------------------------------------------------------

void level() {
  for (int note : {38, 50, 60, 72, 84}) {
    fresh({});
    key(note);
    const double top = db(stereo_peak(render(device, 4.0f, kRate)));
    EXPECT(top > -24.0 && top < -10.0, "one key at 0.7 peaks between -24 and -10 dBFS");
    std::printf("  one key %d at 0.7: %.1f dBFS\n", note, top);
  }
  // Every key there is, on a chord and on one pitch, at full gain and the
  // default patch: what goes into the clip, read 30 dB down.
  double worst = 0.0;
  for (int mode = 0; mode < 3; ++mode) {
    for (int one_pitch = 0; one_pitch < 2; ++one_pitch) {
      fresh({{p::kVolume, -42.0f}, {p::kMelody, static_cast<float>(mode)}});
      for (int k = 0; k < 24; ++k) device.note_on(k, hz(one_pitch ? 62.0f : 38.0f + 3.0f * static_cast<float>(k)), 1.0f);
      worst = std::max(worst, stereo_peak(render(device, 10.0f, kRate)) * std::pow(10.0, 1.5));
    }
  }
  std::printf("  a full pool at gain 1 and the default patch: %.2f into the clip\n", worst);
  EXPECT(worst < 0.5, "a full pool stays under the knee at the default patch");
  // Adding melody keys does not turn the drones down.
  fresh({{p::kAccents, 0.0f}, {p::kSpread, 0.0f}});
  key(38);
  render(device, 1.0f, kRate);
  const double alone = line_at(render(device, 2.0f, kRate), 38, 0.0, 2.0);
  for (int k = 60; k < 76; ++k) key(k, 1.0f);
  render(device, 1.0f, kRate);
  EXPECT_NEAR(line_at(render(device, 2.0f, kRate), 38, 0.0, 2.0), alone, 0.5, "held drones do not duck");
  // A key's touch.
  auto touched = [](int note, float gain) {
    fresh({{p::kAccents, 0.0f}});
    key(note, gain);
    render(device, 1.0f, kRate);
    return db(stereo_rms(render(device, 1.0f, kRate), 0, at(1.0)));
  };
  EXPECT(touched(62, 1.0f) > touched(62, 0.3f) + 2.0 && touched(38, 1.0f) > touched(38, 0.3f) + 2.0,
         "a harder touch is louder, gently");

  // One level at every rate: tone, hiss, bark and knock apart.
  const Sets parts[4] = {{{p::kAccents, 0.0f}, {p::kNoise, 0.0f}, {p::kTangents, 0.0f}},
                         {{p::kAccents, 0.0f}, {p::kNoise, 1.0f}, {p::kDrones, 0.3f}, {p::kTangents, 0.0f}},
                         {{p::kAccents, 4.0f}, {p::kSpeed, 2.0f}, {p::kDepth, 1.0f}, {p::kDog, 1.0f}, {p::kDrones, 0.0f}, {p::kTrompette, 1.0f}},
                         {{p::kTangents, 1.0f}, {p::kSpin, 8.0f}}};
  const char* names[4] = {"tone", "hiss", "bark", "knock"};
  for (int part = 0; part < 4; ++part) {
    double found[4];
    const float rates[4] = {44100.0f, 48000.0f, 96000.0f, 192000.0f};
    for (int r = 0; r < 4; ++r) {
      fresh(parts[part], rates[r]);
      key(38);
      if (part == 3) key(62);
      Stereo x = render(device, part == 3 ? 0.06f : 5.0f, rates[r]);
      found[r] = db(stereo_rms(x, part == 3 ? 0 : at(1.0, rates[r]), x.size()));
    }
    std::printf("  %s at 44.1, 48, 96, 192 kHz: %.2f %.2f %.2f %.2f dB\n", names[part], found[0], found[1], found[2], found[3]);
    const double allowed = part == 3 ? 2.0 : 0.5;
    for (double f : found) EXPECT_NEAR(f, found[1], allowed, "the level does not move with the sample rate");
  }
}

// --- clicks and knobs ------------------------------------------------------------------------------

// How much of an event's change is there in its first eight samples, the
// worst of six moments (docs/solutions, click checks).
template <typename Event>
double suddenness(Sets sets, Event event) {
  double worst = 0.0;
  for (int moment = 0; moment < 6; ++moment) {
    Stereo renders[2];
    for (int with = 0; with < 2; ++with) {
      fresh(sets);
      key(38);
      key(62);
      render(device, 0.7f + 0.00371f * static_cast<float>(moment), kRate);
      if (with) event();
      renders[with] = render(device, 0.02f, kRate);
    }
    double early = 0.0, all = 0.0;
    for (size_t i = 0; i < renders[0].size(); ++i) {
      const double d = std::fabs(static_cast<double>(renders[0].left[i]) - renders[1].left[i]);
      all = std::max(all, d);
      if (i < 8) early = std::max(early, d);
    }
    if (all > 1.0e-5) worst = std::max(worst, early / all);
  }
  return worst;
}

void clicks() {
  const Sets plain = {{p::kAccents, 0.0f}, {p::kNoise, 0.0f}, {p::kTangents, 0.0f}};
  struct Jump {
    const char* name;
    int id;
    float to;
  };
  for (const Jump& jump : {Jump{"speed", p::kSpeed, 3.0f}, Jump{"drones", p::kDrones, 1.0f}, Jump{"third drone", p::kTrompette, 0.0f},
                           Jump{"rosin up", p::kRosin, 1.0f}, Jump{"rosin down", p::kRosin, 0.0f},
                           Jump{"brightness", p::kBrightness, 1.0f}, Jump{"body", p::kBody, 1.0f},
                           Jump{"spread", p::kSpread, 1.0f}, Jump{"volume", p::kVolume, -48.0f},
                           Jump{"detune", p::kDetune, 12.0f}, Jump{"tuning", p::kTuning, 3.0f}, Jump{"drone", p::kDrone, 8.0f}}) {
    const double s = suddenness(plain, [&] { device.set_param(jump.id, jump.to); });
    if (s > 0.1) std::printf("  %s: %.3f of the change in eight samples\n", jump.name, s);
    EXPECT(s < 0.25, jump.name);
  }
  EXPECT(suddenness(plain, [] { device.note_off(62); }) < 0.15, "a melody key up is gradual");
  EXPECT(suddenness(plain, [] { key(65); }) < 0.25, "a key change keeps the string's phase");
  EXPECT(suddenness(plain, [] { key(36); }) < 0.15, "a new drone root keeps it too");
  // Knobs that set the pushes, moved under sound: the dog is not set off by a hand on a knob.
  fresh({{p::kAccents, 2.0f}, {p::kDepth, 0.0f}, {p::kDog, 1.0f}, {p::kNoise, 0.0f}});
  key(38);
  render(device, 0.71f, kRate);
  device.set_param(p::kDepth, 0.02f);
  for (int k = 0; k < 10; ++k) {
    device.set_param(p::kDepth, k % 2 ? 0.0f : 0.015f);
    render(device, 0.013f, kRate);
    EXPECT(device.meter(1) < 0.05f, "Depth turned under the threshold does not bark");
  }
}

void meters() {
  fresh({{p::kSpeed, 0.5f}, {p::kSpin, 0.05f}, {p::kDepth, 0.6f}, {p::kDog, 0.8f}});
  for (int m = 0; m < 4; ++m) EXPECT(device.meter(m) == 0.0f, "before a note every meter reads nothing");
  key(38);
  render(device, 1.0f, kRate);
  EXPECT_NEAR(device.meter(0), 0.4875, 0.005, "the wheel's place after a second at half a turn a second");
  float top = 0.0f, low = 1.0f;
  for (int k = 0; k < 400; ++k) {
    render(device, 0.005f, kRate);
    top = std::max(top, device.meter(1));
    low = std::min(low, device.meter(1));
    EXPECT(device.meter(0) >= 0.0f && device.meter(0) < 1.0f, "the place stays in a turn");
  }
  EXPECT(top > 0.5f && top <= 1.0f && low < 0.01f, "the bark's meter opens and shuts");
}

void cost() {
  fresh({{p::kDog, 1.0f}, {p::kDepth, 1.0f}, {p::kRosin, 1.0f}, {p::kMelody, 2.0f}});
  for (int k = 0; k < 8; ++k) key(38 + 5 * k);
  report_cost("wheel-and-dog", 10.0f, kRate, [] { render(device, 10.0f, kRate); });
}

}  // namespace

int main() {
  conformance();
  steady_drone();
  barks();
  trembling();
  melody_line();
  melody_rules();
  beating();
  drone_notes();
  cotton();
  contact_folding();
  run_down();
  block_sizes();
  keys_let_go();
  level();
  clicks();
  meters();
  cost();
  return finish("wheel-and-dog");
}
