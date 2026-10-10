// Native harness for Scale Filter (cpp/devices/scale-filter). The conformance pass covers stability, silence
// when idle, block-size independence and parameter abuse; the rest asserts what makes it a scale filter: the
// notes it opens at, how deep it cuts between them, how wide each opening is in cents, the ring, the make-up,
// the latency and the dry path.

#include "../devices/scale-filter/scale_filter.h"
#include "support/test_kit.h"

#include <limits>

using namespace testkit;
using livemix::ScaleFilter;
namespace p = livemix::scale_filter;

static ScaleFilter device;

static const int kLatency = ScaleFilter::kLatency;

enum Scale { kMajor, kNaturalMinor, kHarmonicMinor, kDorian, kPhrygian, kLydian, kMixolydian, kMajorPenta, kMinorPenta, kWholeTone, kChromatic };
enum Chord { kWholeScale, kTriad, kFifths, kRootOnly };

static double note_hz(double midi) { return 440.0 * std::pow(2.0, (midi - 69.0) / 12.0); }

// The filter alone: no ring, no make-up, the whole range open, all wet.
static void plain(ScaleFilter& d, float rate) {
  d.init(rate);
  d.set_param(p::kRing, p::kParamMin[p::kRing]);
  d.set_param(p::kGlow, 0.0f);
  d.set_param(p::kLow, 20.0f);
  d.set_param(p::kHigh, 20000.0f);
  d.set_param(p::kMix, 1.0f);
}

// The level of a narrow band at `hz`, as the root of the mean power of Hann-windowed stretches of `length`
// samples: steady for noise, where one stretch alone is not.
static double band_level(const std::vector<float>& x, double hz, double rate, size_t from, size_t length = 16384) {
  double sum = 0.0;
  int count = 0;
  for (size_t at = from; at + length <= x.size(); at += length) {
    const double level = tone_level(x, hz, rate, at, at + length);
    sum += level * level;
    ++count;
  }
  return count > 0 ? std::sqrt(sum / count) : 0.0;
}

// What the device does to a steady sine at `hz`, in dB: the level that comes out over the level that went in,
// once the frames are full.
static double sine_gain_db(ScaleFilter& d, double hz, float rate, float seconds = 1.5f) {
  const std::vector<float> tone = sine(static_cast<float>(hz), seconds, rate, 0.5f);
  const Stereo out = run(d, tone);
  const size_t from = static_cast<size_t>(0.6f * seconds * rate);
  return db(tone_level(out.left, hz, rate, from) / tone_level(tone, hz, rate, from));
}

static const float kRate = 48000.0f;

static void check_conformance() {
  Conformance spec;
  spec.name = "scale-filter";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 2.01f;
  check_effect(device, spec, kRate);
}

// The input as it comes out with nothing done to it: kLatency late.
static std::vector<float> late(const std::vector<float>& in) {
  std::vector<float> out(in.size(), 0.0f);
  for (size_t i = kLatency; i < in.size(); ++i) out[i] = in[i - kLatency];
  return out;
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < a.size() && i < b.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i]));
  return worst;
}

// The latency is the one the manifest states, the dry path is in step with the wet one, and a mono sound
// stays mono.
static void check_latency_and_dry() {
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    rng_state() = 77;
    const std::vector<float> in = noise(1.0f, rate, 0.5f);
    const std::vector<float> delayed = late(in);
    device.init(rate);
    device.set_param(p::kMix, 0.0f);
    const Stereo dry = run(device, in);
    EXPECT(dry.left == delayed && dry.right == delayed, "Mix 0 is the input 9216 samples late, bit for bit");

    // Depth 0 opens every bin: the wet signal is the input too, so any Mix is, and nothing combs.
    for (float mix : {0.5f, 1.0f}) {
      plain(device, rate);
      device.set_param(p::kDepth, 0.0f);
      device.set_param(p::kMix, mix);
      const Stereo open = run(device, in);
      const double off = worst_difference(open.left, delayed);
      EXPECT(off < 2.0e-6, "Depth 0 is the input, the same 9216 samples late, at any Mix");
    }

    device.init(rate);
    device.set_param(p::kRing, 2.0f);
    device.set_param(p::kGlow, 1.0f);
    const Stereo both = run(device, in);
    EXPECT(both.left == both.right, "mono in, mono out, bit for bit, with the ring and the make-up on");
  }
}

// White noise in gives openings at the scale's notes and a floor of Depth between them: three roots, three
// scales, three sample rates, read where a semitone is ten bins or more (the octave from C6, from C7 at
// 96 kHz, where the bins are twice as wide).
// Width is 50 cents here, so a note a semitone outside the scale is two widths off: the bell adds 0.4 % to
// the floor, and at Depth 30 the gap reads -29.0 dB.
static void check_notes_on_noise() {
  const int roots[3] = {0, 6, 9};
  const int scales[3] = {kMajor, kMinorPenta, kWholeTone};
  double worst_note = 0.0, worst_gap = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    rng_state() = 7;
    const std::vector<float> in = noise(6.0f, rate, 0.25f);
    const std::vector<float> delayed = late(in);
    const size_t from = static_cast<size_t>(rate);
    const size_t length = rate > 50000.0f ? 16384 : 8192;
    const int base = rate > 50000.0f ? 96 : 84;
    double before[12][3];
    for (int r = 0; r < 3; ++r)
      for (int s = 0; s < 12; ++s) before[s][r] = band_level(delayed, note_hz(base + roots[r] + s), rate, from, length);
    for (int r = 0; r < 3; ++r) {
      for (int scale : scales) {
        plain(device, rate);
        device.set_param(p::kRoot, static_cast<float>(roots[r]));
        device.set_param(p::kScale, static_cast<float>(scale));
        device.set_param(p::kWidth, 50.0f);
        const Stereo out = run(device, in);
        const uint16_t notes = ScaleFilter::chord_notes(scale, kWholeScale);
        for (int s = 0; s < 12; ++s) {
          const double gain = db(band_level(out.left, note_hz(base + roots[r] + s), rate, from, length) / before[s][r]);
          if (notes & (1u << s)) {
            worst_note = std::max(worst_note, std::fabs(gain));
          } else {
            worst_gap = std::max(worst_gap, std::fabs(gain + 29.0));
          }
        }
      }
    }
  }
  std::printf("noise through three roots and three scales at three rates: notes within %.2f dB of the input, gaps within %.2f dB of -29.0\n",
              worst_note, worst_gap);
  EXPECT(worst_note < 1.0, "noise comes through at every note of the scale");
  EXPECT(worst_gap < 1.5, "and is down by Depth at every note that is not in it");

  // The floor is Depth.
  rng_state() = 8;
  const std::vector<float> in = noise(6.0f, kRate, 0.25f);
  const std::vector<float> delayed = late(in);
  for (float depth : {12.0f, 48.0f}) {
    plain(device, kRate);
    device.set_param(p::kDepth, depth);
    const Stereo out = run(device, in);
    const double hz = note_hz(85);  // C#6, not in C major
    const double gap = db(band_level(out.left, hz, kRate, 48000) / band_level(delayed, hz, kRate, 48000));
    EXPECT_NEAR(gap, -depth, 1.0, "the gap between two notes is as deep as Depth says");
  }
}

// A played note is placed by its own frequency, so the bins being wide in the bass does not matter: a sine on
// a note of the scale passes, one a semitone off (and not in the scale) is down by Depth, from A1 to A6 and at
// three rates. And the Chord choices keep the notes they say.
static void check_notes_on_sines() {
  double worst_on = 0.0, worst_off = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (int midi : {33, 45, 57, 69, 81, 93}) {
      plain(device, rate);
      worst_on = std::max(worst_on, std::fabs(sine_gain_db(device, note_hz(midi), rate, 1.0f)));
      plain(device, rate);
      worst_off = std::max(worst_off, std::fabs(sine_gain_db(device, note_hz(midi + 1), rate, 1.0f) + 30.0));
    }
  }
  std::printf("a sine on A, A1 to A6 at three rates: within %.3f dB; on A#: within %.3f dB of -30\n", worst_on, worst_off);
  EXPECT(worst_on < 0.2, "a sine on a note of the scale passes (asked: within 1 dB)");
  EXPECT(worst_off < 0.5, "a sine a semitone off, not in the scale, is down by Depth");

  // Chord: which of the twelve notes over the root pass (within 0.1 dB) and which are at the floor.
  struct Case {
    int scale, chord;
    uint16_t open;
    const char* what;
  };
  const Case cases[] = {
      {kMajor, kTriad, 0b000010010001, "Major, Triad: root, major third, fifth"},
      {kNaturalMinor, kTriad, 0b000010001001, "Natural Minor, Triad: root, minor third, fifth"},
      {kWholeTone, kTriad, 0b000100010001, "Whole Tone, Triad: root, major third, augmented fifth"},
      {kDorian, kFifths, 0b000010000001, "Dorian, Fifths: root and fifth"},
      {kLydian, kRootOnly, 0b000000000001, "Lydian, Root only"},
      {kPhrygian, kWholeScale, 0b010110101011, "Phrygian, Whole scale"},
      {kHarmonicMinor, kWholeScale, 0b100110101101, "Harmonic Minor, Whole scale"},
      {kMixolydian, kWholeScale, 0b011010110101, "Mixolydian, Whole scale"},
      {kMajorPenta, kWholeScale, 0b001010010101, "Major Pentatonic, Whole scale"},
  };
  for (const Case& c : cases) {
    bool right = true;
    for (int s = 0; s < 12; ++s) {
      plain(device, kRate);
      device.set_param(p::kRoot, 2.0f);  // D
      device.set_param(p::kScale, static_cast<float>(c.scale));
      device.set_param(p::kChord, static_cast<float>(c.chord));
      const double gain = sine_gain_db(device, note_hz(62 + s), kRate, 0.8f);
      const bool open = (c.open >> s) & 1u;
      right = right && (open ? std::fabs(gain) < 0.1 : std::fabs(gain + 30.0) < 0.5);
    }
    EXPECT(right, c.what);
  }
}

// The offset in cents (to the sharp side for +1, the flat side for -1) at which a sine is 3 dB down, with one
// note open in the octave so the next opening is far off.
static double half_width_cents(ScaleFilter& d, int midi, float width, int side) {
  double lo = 0.0, hi = 2.0 * width;
  for (int step = 0; step < 12; ++step) {
    const double mid = 0.5 * (lo + hi);
    plain(d, kRate);
    d.set_param(p::kRoot, static_cast<float>(midi % 12));
    d.set_param(p::kChord, static_cast<float>(kRootOnly));
    d.set_param(p::kDepth, 48.0f);
    d.set_param(p::kWidth, width);
    const double gain = sine_gain_db(d, note_hz(midi + side * mid / 100.0), kRate, 0.8f);
    if (gain > -3.0103) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return 0.5 * (lo + hi);
}

// Width is the opening's width in cents between its two -3 dB points, at 196 Hz (G3) as at 1976 Hz (B6).
static void check_width() {
  for (float width : {10.0f, 40.0f, 150.0f}) {
    const double low = half_width_cents(device, 55, width, 1) + half_width_cents(device, 55, width, -1);
    const double high = half_width_cents(device, 95, width, 1) + half_width_cents(device, 95, width, -1);
    std::printf("Width %.0f ct: %.2f ct at 196 Hz, %.2f ct at 1976 Hz\n", width, low, high);
    EXPECT_NEAR(low, width, 0.04 * width, "the opening is Width cents wide at 196 Hz");
    EXPECT_NEAR(high, width, 0.04 * width, "and at 1976 Hz");
    EXPECT_NEAR(low, high, 0.03 * width, "the same in the bass as in the treble");
  }
}

// Chromatic with Width all the way up is nearly the input: every note open and the bells meeting 0.75 dB down.
static void check_chromatic_wide() {
  // Noise with little over 20 kHz, where the range ends whatever High says: two low passes at 4 kHz.
  rng_state() = 21;
  std::vector<float> in = noise(4.0f, kRate, 0.5f);
  {
    const float a = std::exp(-2.0f * 3.14159265f * 4000.0f / kRate);
    float one = 0.0f, two = 0.0f;
    for (float& v : in) {
      one = v + (one - v) * a;
      two = one + (two - one) * a;
      v = two;
    }
  }
  const std::vector<float> delayed = late(in);
  plain(device, kRate);
  device.set_param(p::kScale, static_cast<float>(kChromatic));
  device.set_param(p::kWidth, 200.0f);
  const Stereo out = run(device, in);
  const double level = db(rms(out.left, 48000) / rms(delayed, 48000));
  std::vector<float> rest(in.size());
  for (size_t i = 0; i < in.size(); ++i) rest[i] = out.left[i] - delayed[i];
  const double apart = db(rms(rest, 48000) / rms(delayed, 48000));
  std::printf("Chromatic, Width 200: %.2f dB against the input, what differs is %.1f dB under it\n", level, apart);
  EXPECT(std::fabs(level) < 1.0, "Chromatic at a wide Width is the input to within 1 dB");
  EXPECT(apart < -18.0, "and what it changes is 18 dB under the sound");
  double worst = 0.0;
  for (double midi = 40.0; midi < 100.0; midi += 6.37) {
    plain(device, kRate);
    device.set_param(p::kScale, static_cast<float>(kChromatic));
    device.set_param(p::kWidth, 200.0f);
    worst = std::max(worst, std::fabs(sine_gain_db(device, note_hz(midi), kRate, 0.8f)));
  }
  EXPECT(worst < 0.8, "no tone, on a note or between two, loses more than 0.8 dB");
}

// Ring: a burst's decay to -60 dB takes Ring seconds, at the bottom of the knob nothing rings on, a note let
// go of stays on its own frequency, and a held note is not changed by it.
static void check_ring() {
  for (float ring : {0.4f, 1.0f, 3.0f, 8.0f}) {
    plain(device, kRate);
    device.set_param(p::kRing, ring);
    rng_state() = 9;
    std::vector<float> burst = noise(0.5f, kRate, 0.25f);
    burst.resize(static_cast<size_t>(kRate * (1.5f + 1.2f * ring)), 0.0f);
    const Stereo out = run(device, burst);
    const double measured = rt60(out.left, kRate, 0.9, 0.05, -100.0);
    std::printf("Ring %.1f s: a burst decays by 60 dB in %.2f s\n", ring, measured);
    EXPECT_NEAR(measured, ring, 0.1 * ring, "a burst's decay follows Ring");
  }
  {
    plain(device, kRate);
    rng_state() = 9;
    std::vector<float> burst = noise(0.5f, kRate, 0.25f);
    burst.resize(static_cast<size_t>(kRate * 1.5f), 0.0f);
    const Stereo out = run(device, burst);
    const size_t gone = static_cast<size_t>(0.5f * kRate) + kLatency + ScaleFilter::Stft::kFrame;
    EXPECT(peak(out.left, gone) == 0.0, "Ring at the bottom: silence a latency and a frame after the sound");
    EXPECT(rms(out.left, 24000 + kLatency - 4800, 24000 + kLatency) > 0.01, "(and sound until then)");
  }
  {
    // A (440 Hz) held, then let go: the tail is that note, steady, with nothing beside it.
    plain(device, kRate);
    device.set_param(p::kRing, 6.0f);
    std::vector<float> note = sine(440.0f, 1.0f, kRate, 0.5f);
    const std::vector<float> same = note;
    note.resize(static_cast<size_t>(kRate * 3.0f), 0.0f);
    const Stereo out = run(device, note);
    const size_t held_from = 28800, held_to = 43200;  // 0.6 to 0.9 s: the note as it is held
    EXPECT_NEAR(db(tone_level(out.left, 440.0, kRate, held_from, held_to) / tone_level(same, 440.0, kRate, held_from, held_to)),
                0.0, 0.05, "a held note comes out at its own level with the ring on");
    // 1.5 to 2.5 s, well after it was let go, with the fall of 10 dB a second taken out.
    const size_t from = 72000, to = 120000;
    std::vector<float> tail(out.left.begin() + from, out.left.begin() + to);
    for (size_t i = 0; i < tail.size(); ++i) tail[i] *= static_cast<float>(std::pow(10.0, 0.5 * static_cast<double>(i) / kRate));
    const double hz = dominant_frequency(tail, kRate, 400.0, 480.0);
    EXPECT_NEAR(hz, 440.0, 0.1, "a note let go of rings on at its own frequency");
    const double tone = tone_level(tail, hz, kRate);
    const double all = rms(tail) * std::sqrt(2.0);
    std::printf("the ring of a 440 Hz note: %.3f Hz, and all but %.2f dB of the tail is that tone\n", hz, -db(tone / all));
    EXPECT(db(tone / all) > -0.3, "and the tail is that one tone, not a buzz at the frame rate");
    const double first = rms(out.left, 72000, 81600), second = rms(out.left, 120000, 129600);
    EXPECT_NEAR(db(second / first), -10.0, 1.0, "falling by 10 dB a second at Ring 6 s");
  }
}

// A note off the scale that begins all at once: its first frames cannot be placed and come in on the gain of
// their bins as a whole, which is high where a note of the scale lies in the same bin. With the longest ring
// that guess must not ring on at the note's own pitch: half a second in, the note is at the floor. And what
// did come in as a placed partial still rings: a glide through a note of the scale leaves that note sounding.
static void check_onsets_off_the_scale() {
  for (double hz : {108.11, 214.36, 323.22, 1108.09}) {
    plain(device, kRate);
    device.set_param(p::kRoot, 9.0f);
    device.set_param(p::kScale, static_cast<float>(kHarmonicMinor));
    device.set_param(p::kWidth, 10.0f);
    device.set_param(p::kDepth, 44.0f);
    device.set_param(p::kRing, 12.0f);
    const double gain = sine_gain_db(device, hz, kRate, 0.8f);
    char label[160];
    std::snprintf(label, sizeof label, "a %.2f Hz note off the scale, begun at once under a 12 s ring, is at %.2f dB half a second in", hz, gain);
    std::printf("%s\n", label);
    EXPECT(gain < -44.0 + 1.5, label);
  }
  plain(device, kRate);
  device.set_param(p::kRoot, 9.0f);
  device.set_param(p::kChord, static_cast<float>(kRootOnly));
  device.set_param(p::kWidth, 20.0f);
  device.set_param(p::kRing, 3.0f);
  // A semitone under A4 to a semitone over it in a second, then nothing: A is passed half-way.
  std::vector<float> glide(static_cast<size_t>(kRate * 1.0f));
  double phase = 0.0;
  for (size_t i = 0; i < glide.size(); ++i) {
    const double hz = 415.30 * std::pow(466.16 / 415.30, static_cast<double>(i) / glide.size());
    phase += 2.0 * 3.141592653589793 * hz / kRate;
    glide[i] = 0.5f * static_cast<float>(std::sin(phase));
  }
  glide.resize(static_cast<size_t>(kRate * 3.0f), 0.0f);
  const Stereo out = run(device, glide);
  // From 0.3 s after the glide has ended (the output is late by the latency): 0.8 s after A went by.
  const size_t from = static_cast<size_t>(kRate * 1.3f) + ScaleFilter::kLatency;
  const std::vector<float> tail(out.left.begin() + from, out.left.begin() + from + 16384);
  const double at = dominant_frequency(tail, kRate, 400.0, 480.0);
  const double level = db(tone_level(tail, at, kRate) / 0.5);
  std::printf("a glide through A4 at a semitone in half a second, 0.8 s after A went by: the tail is at %.2f Hz, %.1f dB under the glide\n",
              at, -level);
  EXPECT(std::fabs(at - 440.0) < 5.0 && level > -40.0, "a glide through a note of the scale leaves that note ringing");
}

// --- The second check's: the ring on played material, in the bass above all ---------------------------------

// A struck note: `harmonics` partials falling off as 1/h, begun in 4 ms, dying by 60 dB in `t60` seconds, held
// `length` seconds and let go of over 10 ms, from `at` seconds.
static void strike(std::vector<float>& out, double at, double midi, double length, double t60, int harmonics, double gain) {
  const size_t from = static_cast<size_t>(at * kRate), n = static_cast<size_t>(length * kRate);
  for (size_t i = 0; i < n && from + i < out.size(); ++i) {
    const double t = static_cast<double>(i) / kRate;
    double env = std::min(1.0, t / 0.004) * std::pow(10.0, -3.0 * t / t60) * std::min(1.0, (length - t) / 0.01);
    double v = 0.0;
    for (int h = 1; h <= harmonics; ++h) v += std::sin(2.0 * kPi * note_hz(midi) * h * t) / h;
    out[from + i] += static_cast<float>(gain * env * v);
  }
}

// C major with nothing but the ring: Width 30, Depth 30, no make-up, the whole range open.
static void ringing(ScaleFilter& d, float ring) {
  plain(d, kRate);
  d.set_param(p::kRing, ring);
}

// The level of the tone at `midi` in the wet tail, `after` seconds past `end`, in dB against `reference`.
static double tail_db(const Stereo& out, double midi, double end, double reference, double after = 0.4) {
  const size_t from = static_cast<size_t>((end + after) * kRate) + kLatency;
  return db(tone_level(out.left, note_hz(midi), kRate, from, from + 16384) / reference);
}

// A struck note off the scale does not ring on under the longest Ring, however fast it dies and however low
// it lies: its first frames cannot be placed and come in on the gain of their bins, which in the bass is
// high for every bin, and that guess is weighed again once the note is placed. (The builder's mend took a
// guess back only from a note that held its level, so a struck one rang on at -20 to -30 dB of its first
// level under 150 Hz, where the note on the scale beside it rings at -15.) A note on the scale keeps its
// ring. A held note off the scale that is let go of leaves no more than its floor: the frames it is cut off
// in keep the gain it was placed with. What is left is the limit of the bins: in a chord struck in the
// bass a note off the scale that lies within a bin of one on it (F#2 under G2, 0.9 of a bin) cannot be told
// from it, and rings on with it, 6 dB under it (measured, and bounded here, not mended).
static void check_struck_notes_off_the_scale() {
  double worst_off = -200.0, least_on = 0.0;
  for (int midi : {25, 30, 37, 42, 46, 49, 61}) {  // C#1 to C#4: each a semitone under a note of C major
    for (double t60 : {0.3, 1.2}) {
      for (int harmonics : {1, 10}) {
        std::vector<float> off(static_cast<size_t>(3.0f * kRate), 0.0f), on = off;
        strike(off, 0.5, midi, 0.5, t60, harmonics, 0.3);
        strike(on, 0.5, midi + 1, 0.5, t60, harmonics, 0.3);
        ringing(device, 12.0f);
        worst_off = std::max(worst_off, tail_db(run(device, off), midi, 1.0, 0.3));
        if (t60 > 1.0) {
          ringing(device, 12.0f);
          least_on = std::min(least_on, tail_db(run(device, on), midi + 1, 1.0, 0.3));
        }
      }
    }
  }
  std::printf("struck notes under a 12 s ring, C#1 to C#4: off the scale the tail is %.1f dB under the note at the most, on it %.1f at the least\n",
              -worst_off, -least_on);
  EXPECT(worst_off < -38.0, "a struck note off the scale leaves no tail over its floor, in the bass as in the treble");
  EXPECT(least_on > -21.0, "and one on the scale keeps its ring");

  double worst_let_go = -200.0;
  for (int midi : {25, 30, 37, 42, 46}) {
    std::vector<float> held(static_cast<size_t>(3.5f * kRate), 0.0f);
    strike(held, 0.5, midi, 1.0, 1000.0, 1, 0.3);  // (a decay of 1000 s: held)
    ringing(device, 12.0f);
    worst_let_go = std::max(worst_let_go, tail_db(run(device, held), midi, 1.5, 0.3));
  }
  std::printf("a held bass note off the scale, let go of: its tail is %.1f dB under it at the most (the floor is 30)\n", -worst_let_go);
  EXPECT(worst_let_go < -25.0, "a held bass note off the scale leaves only its floor when it is let go of");

  std::vector<float> chord_in(static_cast<size_t>(3.0f * kRate), 0.0f);
  for (int midi : {36, 42, 43}) strike(chord_in, 0.5, midi, 0.5, 1.2, 6, 0.2);  // C2 and G2 on the scale, F#2 off it
  ringing(device, 12.0f);
  const Stereo chord_out = run(device, chord_in);
  const double c2 = tail_db(chord_out, 36, 1.0, 0.2), fs2 = tail_db(chord_out, 42, 1.0, 0.2), g2 = tail_db(chord_out, 43, 1.0, 0.2);
  std::printf("a chord struck in the bass: C2 rings at %.1f dB, G2 at %.1f, F#2 (off the scale, a bin from G2) at %.1f\n", c2, g2, fs2);
  EXPECT(c2 > -20.0 && g2 > -25.0, "a chord struck in the bass rings as its notes on the scale");
  EXPECT(fs2 < g2 - 3.0 && fs2 < -24.0, "and a note off the scale within a bin of one on it rings under that one");
}

// A note ON the scale that is let go of rings as that one note. The frame it is cut off in throws sound
// into the bins beside it, which they cannot place; where another note of the scale lies within a bin of
// them (F3 over E3, B2 under C3) that skirt must ring with its own note and not be brought onto the next
// one: 75 to 100 cents off, the tail is 38 dB under the note or lower. (Brought there, as every unplaced
// tail first was in the second check, it stood at -19 to -24 dB: a second tone 12 dB under the ring.)
static void check_let_go_rings_as_one_note() {
  double least_ring = 0.0, worst_beside = -200.0;
  for (int midi : {45, 48, 52, 64}) {
    for (int fade : {24, 480}) {
      std::vector<float> in = sine(static_cast<float>(note_hz(midi)), 1.0f, kRate, 0.5f);
      for (int i = 0; i < fade; ++i) in[in.size() - 1 - static_cast<size_t>(i)] *= static_cast<float>(i) / static_cast<float>(fade);
      const size_t end = in.size();
      in.resize(end + static_cast<size_t>(1.5f * kRate), 0.0f);
      ringing(device, 6.0f);
      const Stereo out = run(device, in);
      const size_t from = end + static_cast<size_t>(0.3f * kRate) + kLatency;
      const auto level = [&](double cents) {
        return db(tone_level(out.left, note_hz(midi) * std::pow(2.0, cents / 1200.0), kRate, from, from + 32768) / 0.5);
      };
      least_ring = std::min(least_ring, level(0.0));
      for (double cents : {-100.0, -75.0, 75.0, 100.0}) worst_beside = std::max(worst_beside, level(cents));
    }
  }
  std::printf("a note on the scale let go of rings at %.1f dB of its level at the least; 75 to 100 cents either side there is %.1f dB at the most\n",
              least_ring, worst_beside);
  EXPECT(least_ring > -10.0, "a note on the scale that is let go of rings on");
  EXPECT(worst_beside < -38.0, "and as that one note: nothing a semitone from it");
}

// The tail of noise is in the key down to the lowest octave. Under about 130 Hz a bin is wider than the gap
// between two notes, so while the noise runs it can only be turned down evenly there; but what rings on
// after it is brought into the openings. (Left where each bin's sound had lain, the tail of octaves 1 and 2
// was as strong between the notes as on them.)
static void check_noise_tail_is_in_the_key() {
  rng_state() = 2024;
  std::vector<float> in = noise(6.0f, kRate, 0.25f);
  const size_t stop = in.size();
  in.resize(stop + static_cast<size_t>(5.0f * kRate), 0.0f);
  ringing(device, 6.0f);
  const Stereo out = run(device, in);
  const size_t from = stop + kLatency + static_cast<size_t>(0.3f * kRate), length = 65536;  // 0.73 Hz apart
  const int on[7] = {0, 2, 4, 5, 7, 9, 11}, off[5] = {1, 3, 6, 8, 10};
  for (int octave = 1; octave <= 3; ++octave) {
    double notes = 0.0, between = 0.0;
    for (int s : on) notes += std::pow(band_level(out.left, note_hz(12 * (octave + 1) + s), kRate, from, length), 2.0) / 7.0;
    for (int s : off) between += std::pow(band_level(out.left, note_hz(12 * (octave + 1) + s), kRate, from, length), 2.0) / 5.0;
    const double apart = 10.0 * std::log10(notes / std::max(between, 1.0e-30));
    std::printf("the tail of noise, octave %d (from %.0f Hz): the notes of the scale stand %.1f dB over what lies between them\n", octave,
                note_hz(12 * (octave + 1)), apart);
    // Octave 3 is printed only: there a bin is narrower than the gaps, a bin more than one bin from every
    // opening keeps its own pitch at the floor's gain, and the figure moves 30 dB from one noise to the next.
    if (octave <= 2) EXPECT(apart > 15.0, "the tail of noise is the notes of the scale, in the bass too");
  }
}

// Low and High: a note under Low or over High is at the floor, one inside the range passes; Tune moves every
// opening by so many cents.
static void check_range_and_tune() {
  plain(device, kRate);
  device.set_param(p::kLow, 200.0f);
  EXPECT_NEAR(sine_gain_db(device, note_hz(45), kRate, 0.8f), -30.0, 0.5, "A2 is under a Low of 200 Hz: down by Depth");
  plain(device, kRate);
  device.set_param(p::kLow, 200.0f);
  EXPECT_NEAR(sine_gain_db(device, note_hz(57), kRate, 0.8f), 0.0, 0.1, "A3 is over it: let through");
  plain(device, kRate);
  device.set_param(p::kHigh, 1000.0f);
  EXPECT_NEAR(sine_gain_db(device, note_hz(81), kRate, 0.8f), 0.0, 0.1, "A5 is under a High of 1 kHz: let through");
  plain(device, kRate);
  device.set_param(p::kHigh, 1000.0f);
  EXPECT_NEAR(sine_gain_db(device, note_hz(93), kRate, 0.8f), -30.0, 0.5, "A6 is over it: down by Depth");
  // Low above High: no note is let through.
  plain(device, kRate);
  device.set_param(p::kLow, 2000.0f);
  device.set_param(p::kHigh, 200.0f);
  EXPECT_NEAR(sine_gain_db(device, note_hz(69), kRate, 0.8f), -30.0, 0.5, "Low over High shuts every note");

  for (float tune : {-50.0f, 30.0f}) {
    plain(device, kRate);
    device.set_param(p::kTune, tune);
    const double on = sine_gain_db(device, note_hz(69.0 + tune / 100.0), kRate, 0.8f);
    plain(device, kRate);
    device.set_param(p::kTune, tune);
    const double off = sine_gain_db(device, note_hz(69.0), kRate, 0.8f);
    plain(device, kRate);
    device.set_param(p::kDepth, 48.0f);
    device.set_param(p::kTune, tune);
    const double edge = sine_gain_db(device, note_hz(69.0 + tune / 100.0 + 0.15), kRate, 0.8f);
    EXPECT_NEAR(on, 0.0, 0.1, "Tune moves the opening: a tone so many cents off the note passes");
    EXPECT(off < -10.0, "and the note at concert pitch no longer does");
    EXPECT_NEAR(edge, -3.01, 0.15, "the opening is as wide where Tune has moved it");
  }
}

// Glow lifts what the mask leaves of noise, by a share of what it took, never over the level that came in;
// a chord in the key is not lifted at all, and a wrong note alone stays down.
static void check_glow() {
  rng_state() = 31;
  const std::vector<float> in = noise(6.0f, kRate, 0.25f);
  double levels[3];
  int index = 0;
  for (float glow : {0.0f, 0.5f, 1.0f}) {
    plain(device, kRate);
    device.set_param(p::kGlow, glow);
    const Stereo out = run(device, in);
    levels[index++] = db(rms(out.left, 96000) / rms(in, 96000));
  }
  std::printf("noise through C major: %.2f dB at Glow 0, %.2f at 0.5, %.2f at 1\n", levels[0], levels[1], levels[2]);
  EXPECT(levels[0] < -7.0, "the mask takes 7 dB or more from noise");
  EXPECT_NEAR(levels[1] - levels[0], 0.5 * (levels[2] - levels[0]), 0.3, "Glow lifts in dB as it is turned");
  EXPECT(levels[2] - levels[0] > 6.0, "by 6 dB or more at the top");
  EXPECT(levels[2] < 0.3, "and never over the level that came in");
  // The narrowest mask there is asks for more than the input's own level: it is held to it.
  plain(device, kRate);
  device.set_param(p::kChord, static_cast<float>(kRootOnly));
  device.set_param(p::kWidth, 5.0f);
  device.set_param(p::kDepth, 48.0f);
  device.set_param(p::kGlow, 1.0f);
  const Stereo narrow = run(device, in);
  const double narrow_db = db(rms(narrow.left, 96000) / rms(in, 96000));
  std::printf("noise through one note an octave, Width 5, Depth 48, Glow 1: %.2f dB\n", narrow_db);
  EXPECT(narrow_db < 0.3 && narrow_db > -8.0, "the narrowest mask with Glow up comes out near the input's level, not over it");

  for (float glow : {0.0f, 1.0f}) {
    plain(device, kRate);
    device.set_param(p::kGlow, glow);
    EXPECT_NEAR(sine_gain_db(device, note_hz(64), kRate, 0.8f), 0.0, 0.1, "a note in the key is not lifted by Glow");
  }
  plain(device, kRate);
  device.set_param(p::kGlow, 1.0f);
  EXPECT(sine_gain_db(device, note_hz(63), kRate, 0.8f) < -20.0, "a wrong note alone stays 20 dB down with Glow all the way up");
}

// A chord of sines, for the checks that need something held: the notes at equal level, `gain` each.
static std::vector<float> chord(std::initializer_list<double> notes, float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (double note : notes) {
    const std::vector<float> one = sine(static_cast<float>(note_hz(note)), seconds, rate, gain);
    for (size_t i = 0; i < out.size(); ++i) out[i] += one[i];
  }
  return out;
}

// Moving a control while a chord sounds does not click: the largest step between two samples is no more than
// in the same render with nothing moved (and a hair), for every choice and for the knobs most likely to be
// turned while it sounds.
static void check_clicks() {
  const std::vector<float> held = chord({48, 55, 61, 64, 70, 76}, 2.0f, kRate, 0.15f);
  struct Move {
    int param;
    float from, to;
    const char* what;
  };
  const Move moves[] = {
      {p::kRoot, 0.0f, 1.0f, "Root changed while sounding does not click"},
      {p::kScale, 0.0f, 8.0f, "Scale changed while sounding does not click"},
      {p::kChord, 0.0f, 3.0f, "Chord changed while sounding does not click"},
      {p::kWidth, 30.0f, 200.0f, "Width moved while sounding does not click"},
      {p::kDepth, 30.0f, 0.0f, "Depth moved while sounding does not click"},
      {p::kRing, 0.4f, 0.05f, "Ring moved while sounding does not click"},
      {p::kGlow, 0.0f, 1.0f, "Glow moved while sounding does not click"},
      {p::kTune, 0.0f, 50.0f, "Tune moved while sounding does not click"},
      {p::kLow, 40.0f, 2000.0f, "Low moved while sounding does not click"},
      {p::kMix, 1.0f, 0.0f, "Mix moved while sounding does not click"},
  };
  const std::vector<float> first(held.begin(), held.begin() + 48000);
  const std::vector<float> second(held.begin() + 48000, held.end());
  double most = 0.0;
  for (const Move& move : moves) {
    device.init(kRate);
    device.set_param(move.param, move.from);
    Stereo reference = run(device, first);
    reference = concat(reference, run(device, second));
    device.init(kRate);
    device.set_param(move.param, move.from);
    Stereo moved = run(device, first);
    device.set_param(move.param, move.to);
    moved = concat(moved, run(device, second));
    const double still = std::max(max_step(reference.left, 24000), max_step(held, 0));
    const double step = max_step(moved.left, 24000);
    most = std::max(most, step / still);
    EXPECT(step < 1.1 * still + 0.002, move.what);
    // (Glow does not lift a chord in the key and Ring does not change a held one: see below for Ring.)
    EXPECT(worst_difference(moved.left, reference.left, 48000 + kLatency) > 1.0e-3 || move.param == p::kGlow ||
               move.param == p::kRing,
           "(and the move was heard)");
  }
  {
    // Ring turned down while the chord rings on after it was let go: the tail stops over a frame, not at once.
    std::vector<float> let_go = first;
    let_go.resize(96000, 0.0f);
    device.init(kRate);
    device.set_param(p::kRing, 6.0f);
    Stereo reference = run(device, first);
    reference = concat(reference, run(device, std::vector<float>(48000, 0.0f)));
    device.init(kRate);
    device.set_param(p::kRing, 6.0f);
    Stereo moved = run(device, first);
    run(device, std::vector<float>(14400, 0.0f));
    device.set_param(p::kRing, 0.05f);
    const Stereo stopped = run(device, std::vector<float>(33600, 0.0f));
    EXPECT(max_step(stopped.left) < 1.1 * max_step(reference.left, 24000) + 0.002, "Ring turned down under a ringing chord does not click");
    EXPECT(rms(reference.left, 86400) > 0.05 && peak(stopped.left, 24000) == 0.0, "(and the ring was there, and stopped)");
  }
  std::printf("controls moved under a held chord: the largest step is %.2f of the unmoved render's at the most\n", most);
}

// NaN, infinity and 1e30 in the input: the output stays finite, and a latency and a frame later the device is
// as if they had never come (no ring), or sounding and falling as before (with the ring).
static void check_bad_input() {
  rng_state() = 41;
  const std::vector<float> good = noise(2.0f, kRate, 0.5f);
  std::vector<float> bad = good;
  bad[30000] = std::nanf("");
  bad[30001] = std::numeric_limits<float>::infinity();
  bad[30002] = -1.0e30f;
  bad[30003] = -std::numeric_limits<float>::infinity();
  plain(device, kRate);
  const Stereo good_out = run(device, good);
  plain(device, kRate);
  const Stereo bad_out = run(device, bad);
  // (A frame is compared with the one before it, so one more hop.)
  const size_t clear = 30004 + kLatency + ScaleFilter::Stft::kFrame + ScaleFilter::Stft::kHop;
  EXPECT(finite(bad_out.left) && finite(bad_out.right), "NaN, infinity and 1e30 in: finite out");
  // (A partial that is dying away keeps the gain it was placed with, so what the bad frames held can leave a
  // trace a few frames longer than the frames themselves: under -80 dB, and gone within a second.)
  EXPECT(worst_difference(bad_out.left, good_out.left, clear) < 1.0e-3, "and as if they had never come, a latency and a frame later");
  EXPECT(worst_difference(bad_out.left, good_out.left, clear + 48000) < 1.0e-6, "and the same to the last digit a second after that");

  device.init(kRate);
  device.set_param(p::kRing, 3.0f);
  device.set_param(p::kGlow, 1.0f);
  const Stereo ringing = run(device, bad);
  const Stereo after = render(device, 4.0f, kRate);
  EXPECT(finite(ringing.left) && finite(after.left) && finite(after.right), "with the ring and the make-up on: finite");
  EXPECT(rms(ringing.left, 84000) > 0.02 && peak(ringing.left) < 2.01, "still sounding once good input is back, and bounded");
  EXPECT(rms(after.left, 144000) < 0.1 * rms(after.left, 0, 48000), "and the ring falls away: nothing is stuck");
}

// The same output at block sizes 1, 37, 128 and 2048 across a silence, with the ring and the make-up on and a
// knob moved while the device sleeps. The silence is stepped across the moment it falls asleep: at Ring
// 0.3 s the last bin lets go about 0.9 s after the sound, and the device sleeps 0.4 s after that.
static void check_block_sizes() {
  double worst = 0.0;
  for (float gap = 0.0f; gap < 0.7f; gap += 0.047f) {
    rng_state() = 99;
    const std::vector<float> phrase = noise(0.3f, kRate, 0.5f);
    const std::vector<float> quiet = silence(1.0f + gap, kRate);
    const std::vector<float> again = noise(0.4f, kRate, 0.5f);
    Stereo reference;
    for (int block : {128, 1, 2048, 37}) {
      device.init(kRate);
      device.set_param(p::kRing, 0.3f);
      device.set_param(p::kGlow, 1.0f);
      device.set_param(p::kMix, 0.8f);
      Stereo out = run(device, phrase, block);
      out = concat(out, run(device, quiet, block));
      device.set_param(p::kGlow, 0.2f);
      device.set_param(p::kMix, 0.3f);
      device.set_param(p::kRoot, 5.0f);
      out = concat(out, run(device, again, block));
      if (block == 128) {
        reference = out;
        continue;
      }
      worst = std::max(worst, worst_difference(out.left, reference.left));
      worst = std::max(worst, worst_difference(out.right, reference.right));
    }
  }
  std::printf("block sizes 1, 37, 128 and 2048 across a silence: worst difference %.3g\n", worst);
  EXPECT(worst < 1.0e-6, "the same at every block size across a sleep, with knobs moved while asleep");
}

// After any control is moved while it sounds, the device comes to rest: exact silence once the ring has
// fallen away, and asleep (it wakes on the next sound).
static void check_rest() {
  rng_state() = 51;
  const std::vector<float> burst = noise(0.4f, kRate, 0.5f);
  bool rests = true;
  for (int id = 0; id < p::kNumParams; ++id) {
    for (float value : {p::kParamMin[id], p::kParamMax[id]}) {
      if (id == p::kRing && value == p::kParamMax[id]) continue;  // 35 s of tail: below
      device.init(kRate);
      run(device, burst);
      device.set_param(id, value);
      run(device, burst);
      render(device, 4.0f, kRate);
      const Stereo after = render(device, 0.5f, kRate);
      rests = rests && peak(after.left) == 0.0 && peak(after.right) == 0.0;
    }
  }
  EXPECT(rests, "exact silence 4 s after the sound, whichever control was moved while it sounded");
  device.init(kRate);
  device.set_param(p::kRing, 12.0f);
  run(device, burst);
  const Stereo long_tail = render(device, 30.0f, kRate);
  render(device, 10.0f, kRate);
  const Stereo after = render(device, 0.5f, kRate);
  EXPECT(rms(long_tail.left, 0, 48000) > 1.0e-3 && peak(long_tail.left) < 1.0, "Ring at the top rings on");
  EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "and is silent 40 s later: -60 dB in 12 s, to the floor in 35");
  const Stereo woken = run(device, burst);
  EXPECT(rms(woken.left, kLatency) > 0.01, "it wakes on new sound");
}

// The readings for the display: a note's level going in and coming out, in whole dB from 63 under a
// full-scale tone, as in + 64 × out, under the pitch class it lies in.
static void check_meters() {
  plain(device, kRate);
  run(device, sine(static_cast<float>(note_hz(69)), 1.0f, kRate, 0.5f));  // A, in C major: let through
  int in = static_cast<int>(device.meter(9)) % 64, out = static_cast<int>(device.meter(9)) / 64;
  EXPECT(in == 57 && out == 57, "A at -6 dBFS reads 57 going in and 57 coming out, under A");
  bool apart = device.meter(12) == 0.0f && device.meter(-1) == 0.0f;
  for (int n = 0; n < 12; ++n) apart = apart && (n == 9 || static_cast<int>(device.meter(n)) % 64 <= 57 - 40);
  EXPECT(apart, "and 40 dB less or nothing under the other notes (the window's own skirts)");
  // A bass note is four bins wide and its bins lie under three notes: it is still read under its own.
  plain(device, kRate);
  run(device, sine(static_cast<float>(note_hz(48)), 1.0f, kRate, 0.5f));  // C3, 130.8 Hz
  EXPECT(static_cast<int>(device.meter(0)) % 64 == 57 && static_cast<int>(device.meter(1)) % 64 <= 17 &&
             static_cast<int>(device.meter(11)) % 64 <= 17,
         "C3 reads under C, not under B and C# beside it");
  // And while it rings on after it is let go of: a bin that rings is no longer measured, and read under
  // the note of its own centre a ringing A2 stood under G#, A and A# at 45, 48 and 40 (the second check).
  for (int midi : {45, 52, 57}) {
    ringing(device, 6.0f);
    std::vector<float> note = sine(static_cast<float>(note_hz(midi)), 1.0f, kRate, 0.5f);
    for (size_t i = 0; i < 480; ++i) note[note.size() - 1 - i] *= static_cast<float>(i) / 480.0f;
    note.resize(note.size() + static_cast<size_t>(0.5f * kRate), 0.0f);
    run(device, note);
    const int own = static_cast<int>(device.meter(midi % 12)) / 64;
    const int under = static_cast<int>(device.meter((midi + 11) % 12)) / 64;
    const int over = static_cast<int>(device.meter((midi + 1) % 12)) / 64;
    char label[160];
    std::snprintf(label, sizeof label, "half a second into its ring, note %d reads %d coming out, the notes beside it %d and %d", midi, own,
                  under, over);
    EXPECT(own >= 45 && under <= own - 20 && over <= own - 20, label);
    std::printf("%s\n", label);
  }
  plain(device, kRate);
  run(device, sine(static_cast<float>(note_hz(70)), 1.0f, kRate, 0.5f));  // A#: not in C major
  in = static_cast<int>(device.meter(10)) % 64;
  out = static_cast<int>(device.meter(10)) / 64;
  EXPECT(in == 57 && out == 27, "A# reads 57 going in and 27 coming out: down by Depth");
  // What comes out is read after Mix: half dry and half of a tone 30 dB down is 5.75 dB under the tone.
  plain(device, kRate);
  device.set_param(p::kMix, 0.5f);
  run(device, sine(static_cast<float>(note_hz(70)), 1.0f, kRate, 0.5f));
  EXPECT(static_cast<int>(device.meter(10)) % 64 == 57 && static_cast<int>(device.meter(10)) / 64 == 51,
         "at Mix 0.5 A# reads 57 going in and 51 coming out");
  render(device, 2.0f, kRate);
  EXPECT(device.meter(10) == 0.0f, "asleep, every reading is 0");
}

// Ordinary material for the checks that are not about a test tone: four notes with eight harmonics each (two
// of them outside C major) over a bed of noise, in bursts with gaps between.
static std::vector<float> phrase(float seconds, float rate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  rng_state() = 61;
  const double notes[4] = {50.0, 57.0, 61.0, 66.0};
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    const double beat = std::fmod(t, 0.6);
    const double gate = beat < 0.35 ? std::min(1.0, std::min(beat, 0.35 - beat) * 100.0) : 0.0;
    double v = 0.08 * white();
    for (double note : notes)
      for (int h = 1; h <= 8; ++h) v += 0.05 / h * std::sin(2.0 * kPi * note_hz(note) * h * t);
    out[i] = static_cast<float>(gate * v);
  }
  return out;
}

// How unlike two renders are: what differs between them, in dB under the louder of the two.
static double unlike_db(const Stereo& a, const Stereo& b) {
  std::vector<float> rest(a.size());
  for (size_t i = 0; i < a.size(); ++i) rest[i] = a.left[i] - b.left[i];
  return db(rms(rest, kLatency) / std::max(rms(a.left, kLatency), rms(b.left, kLatency)));
}

// No control has a dead part: on ordinary material each third of every knob's travel, and every step of
// every choice, changes what comes out by more than 36 dB under the sound (the last third of Depth takes
// away what was already 32 dB down, which is the least of them).
static void check_every_control_works() {
  const std::vector<float> in = phrase(2.4f, kRate);
  double least = 0.0;
  const char* least_name = "";
  static const char* const names[p::kNumParams] = {"Root", "Scale", "Chord", "Width", "Ring", "Depth",
                                                    "Low",  "High",  "Tune",  "Glow",  "Mix"};
  for (int id = 0; id < p::kNumParams; ++id) {
    const float lo = p::kParamMin[id], hi = p::kParamMax[id];
    const bool choice = id == p::kRoot || id == p::kScale || id == p::kChord;
    const bool log = id == p::kWidth || id == p::kRing || id == p::kLow || id == p::kHigh;
    const int steps = choice ? static_cast<int>(hi - lo + 0.5f) : 3;
    Stereo before;
    for (int step = 0; step <= steps; ++step) {
      const float t = static_cast<float>(step) / static_cast<float>(steps);
      const float value = choice ? lo + static_cast<float>(step) : (log ? lo * std::pow(hi / lo, t) : lo + (hi - lo) * t);
      device.init(kRate);
      if (id == p::kMix) device.set_param(p::kDepth, 40.0f);
      device.set_param(id, value);
      const Stereo out = run(device, in);
      if (step > 0) {
        const double apart = unlike_db(out, before);
        if (apart < least) {
          least = apart;
          least_name = names[id];
        }
        char label[96];
        std::snprintf(label, sizeof label, "%s: step %d of %d changes the sound (%.1f dB)", names[id], step, steps, apart);
        EXPECT(apart > -36.0, label);
      }
      before = out;
    }
  }
  std::printf("every part of every control changes ordinary material: the least by %.1f dB under the sound (%s)\n", least, least_name);
}

// A held tone anywhere on the keyboard, through one setting: the worst loss and the worst gain, in dB.
template <typename Apply>
static void tone_range(Apply apply, double* lowest, double* highest) {
  *lowest = 0.0;
  *highest = -200.0;
  for (double midi = 21.0; midi <= 108.0; midi += 2.37) {
    device.init(kRate);
    apply();
    const double gain = sine_gain_db(device, note_hz(midi), kRate, 0.8f);
    *lowest = std::min(*lowest, gain);
    *highest = std::max(*highest, gain);
  }
}

// Part-way Mix does not comb: the dry path is as late as the wet one and the gains are real, so a held tone
// anywhere on the keyboard loses no more than the dry share leaves, and never gains.
static void check_mix() {
  for (float mix : {0.25f, 0.5f, 0.75f}) {
    double lowest, highest;
    tone_range([mix] { device.set_param(p::kMix, mix); }, &lowest, &highest);
    const double floor = db((1.0 - mix) + mix * std::pow(10.0, -30.0 / 20.0));
    std::printf("Mix %.2f: a held tone, A0 to C8, comes out between %.2f and %.2f dB (the dry share alone is %.2f)\n", mix,
                lowest, highest, floor);
    EXPECT(lowest > floor - 0.2, "at part-way Mix no tone falls under what the dry share and the floor leave");
    EXPECT(highest < 0.1, "and none comes out over its own level");
  }
}

// A full-scale chord held for a minute, two notes of it in the key and two out: the output peaks no more
// than 1 dB over the input's own peak (a chord of sines loses partials and gains none; the 6 dB of room the
// brief allows is used only by noise and square waves through the narrowest masks, measured in the second
// check at +5.0 dB), and is no louder at the end than at the start.
template <typename Apply>
static void held_chord(Apply apply, const char* what) {
  const std::vector<float> in = chord({48, 64, 66, 73}, 60.0f, kRate, 0.25f);
  device.init(kRate);
  apply();
  const Stereo out = run(device, in);
  const double top = std::max(peak(out.left), peak(out.right));
  const double came_in = peak(in);
  const double early = rms(out.left, 240000, 480000), end = rms(out.left, in.size() - 240000);
  char label[200];
  std::snprintf(label, sizeof label,
                "%s: a full-scale chord held for a minute peaks at %.3f (it came in at %.3f) and ends %.2f dB from where it began", what,
                top, came_in, db(end / std::max(early, 1.0e-9)));
  EXPECT(finite(out.left) && top <= 1.122 * came_in && end <= early * 1.02 + 1.0e-6, label);
}

static void check_level() {
  held_chord([] {}, "as it starts");
  char what[64];
  for (int id = 0; id < p::kNumParams; ++id) {
    for (int end = 0; end < 2; ++end) {
      const float value = end == 0 ? p::kParamMin[id] : p::kParamMax[id];
      std::snprintf(what, sizeof what, "param %d at its %s", id, end == 0 ? "minimum" : "maximum");
      held_chord([id, value] { device.set_param(id, value); }, what);
    }
  }
  // The loudest corner: every note open and wide, the longest ring, the make-up all the way up.
  held_chord(
      [] {
        device.set_param(p::kScale, static_cast<float>(kChromatic));
        device.set_param(p::kWidth, 200.0f);
        device.set_param(p::kRing, 12.0f);
        device.set_param(p::kGlow, 1.0f);
      },
      "chromatic, wide, longest ring, Glow up");
  held_chord(
      [] {
        device.set_param(p::kChord, static_cast<float>(kRootOnly));
        device.set_param(p::kWidth, 5.0f);
        device.set_param(p::kDepth, 48.0f);
        device.set_param(p::kRing, 12.0f);
        device.set_param(p::kGlow, 1.0f);
      },
      "one note, narrowest, deepest, longest ring, Glow up");
}

// The sixteen presets as cpp/devices/scale-filter/device.json has them, every parameter in the order of
// params.gen.h (root, scale, chord, width, ring, depth, low, high, tune, glow, mix).
struct Preset {
  const char* name;
  float values[p::kNumParams];
};
static const Preset kPresets[] = {
    {"In a major key", {0.0f, 0.0f, 0.0f, 30.0f, 0.4f, 30.0f, 40.0f, 12000.0f, 0.0f, 0.5f, 1.0f}},
    {"Minor triad", {9.0f, 1.0f, 1.0f, 24.0f, 1.2f, 36.0f, 40.0f, 12000.0f, 0.0f, 0.5f, 1.0f}},
    {"Open fifths", {9.0f, 0.0f, 2.0f, 18.0f, 2.2f, 40.0f, 40.0f, 12000.0f, 0.0f, 0.7f, 1.0f}},
    {"One note drone", {9.0f, 0.0f, 3.0f, 14.0f, 5.0f, 42.0f, 40.0f, 12000.0f, 0.0f, 1.0f, 1.0f}},
    {"Lean to the key", {0.0f, 0.0f, 0.0f, 70.0f, 0.05f, 9.0f, 40.0f, 12000.0f, 0.0f, 0.0f, 1.0f}},
    {"Wide and gentle", {4.0f, 8.0f, 0.0f, 120.0f, 0.2f, 18.0f, 40.0f, 12000.0f, 0.0f, 0.3f, 1.0f}},
    {"Hairline chord", {5.0f, 0.0f, 1.0f, 6.0f, 0.8f, 48.0f, 40.0f, 12000.0f, 0.0f, 1.0f, 1.0f}},
    {"Long glass", {0.0f, 7.0f, 0.0f, 12.0f, 9.0f, 40.0f, 40.0f, 12000.0f, 0.0f, 0.8f, 1.0f}},
    {"High bells", {0.0f, 7.0f, 0.0f, 16.0f, 3.0f, 42.0f, 300.0f, 12000.0f, 0.0f, 0.8f, 1.0f}},
    {"Low chord only", {9.0f, 1.0f, 0.0f, 40.0f, 0.6f, 36.0f, 40.0f, 420.0f, 0.0f, 0.5f, 1.0f}},
    {"Half and half", {9.0f, 8.0f, 0.0f, 20.0f, 2.5f, 44.0f, 40.0f, 12000.0f, 0.0f, 0.6f, 0.5f}},
    {"Whole tone haze", {0.0f, 9.0f, 0.0f, 45.0f, 4.0f, 30.0f, 40.0f, 12000.0f, 0.0f, 0.6f, 1.0f}},
    {"Between the keys", {0.0f, 10.0f, 0.0f, 10.0f, 0.3f, 9.0f, 40.0f, 12000.0f, 50.0f, 1.0f, 1.0f}},
    {"Dark triad", {2.0f, 1.0f, 1.0f, 30.0f, 1.5f, 40.0f, 40.0f, 1500.0f, 0.0f, 0.7f, 1.0f}},
    {"Twelve tones", {0.0f, 10.0f, 0.0f, 10.0f, 0.6f, 40.0f, 40.0f, 12000.0f, 0.0f, 0.5f, 1.0f}},
    {"Slow harmonic minor", {9.0f, 2.0f, 0.0f, 10.0f, 12.0f, 44.0f, 40.0f, 12000.0f, 0.0f, 0.9f, 0.8f}},
};

// Every preset holds its level and keeps every tone: the full-scale chord for a minute, and a held tone
// anywhere on the keyboard, which loses no more than the preset's own floor and dry share leave and never
// comes out over its own level.
static void check_presets() {
  for (const Preset& preset : kPresets) {
    auto apply = [&preset] {
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.values[id]);
    };
    held_chord(apply, preset.name);
    double lowest, highest;
    tone_range(apply, &lowest, &highest);
    const double mix = preset.values[p::kMix];
    const double floor = db((1.0 - mix) + mix * std::pow(10.0, -preset.values[p::kDepth] / 20.0));
    std::printf("%s: a held tone, A0 to C8, comes out between %.2f and %.2f dB (its floor and dry share: %.2f)\n", preset.name,
                lowest, highest, floor);
    char label[160];
    std::snprintf(label, sizeof label, "%s: no tone falls under its floor and dry share, none comes out over its level", preset.name);
    EXPECT(lowest > floor - 0.2 && highest < 0.1, label);
  }
}

// Cost: the average over ten seconds of noise, and the worst block (the one a frame's work lands in), as it
// starts and at the dearest setting: every bin held by the ring, the narrowest opening (the most places read
// when a knob moves) and the make-up on.
static void check_cost() {
  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  for (int worst = 0; worst < 2; ++worst) {
    const char* label = worst ? "scale-filter, ring 12 s and Glow up" : "scale-filter";
    auto settings = [worst] {
      device.init(kRate);
      if (worst) {
        device.set_param(p::kRing, 12.0f);
        device.set_param(p::kGlow, 1.0f);
        device.set_param(p::kWidth, 5.0f);
      }
    };
    settings();
    report_cost(label, 10.0f, kRate, [&] { run(device, input); });
    settings();
    std::vector<double> micros;
    for (size_t done = 0; done + 128 <= input.size(); done += 128) {
      for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
      const auto start = std::chrono::steady_clock::now();
      device.process(128);
      micros.push_back(std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count());
    }
    std::sort(micros.begin(), micros.end());
    // One block in eight holds a frame of one channel, so the 97th percentile is one of them without the
    // scheduler's noise.
    const double p97 = micros[micros.size() * 97 / 100];
    std::printf("%s worst block: %.0f us at the 97th percentile, %.0f us maximum, of %.0f us a block (%.1f%%)\n", label, p97,
                micros.back(), 128.0e6 / kRate, 100.0 * p97 / (128.0e6 / kRate));
  }
}

int main() {
  check_conformance();
  check_latency_and_dry();
  check_notes_on_noise();
  check_notes_on_sines();
  check_width();
  check_chromatic_wide();
  check_ring();
  check_onsets_off_the_scale();
  check_struck_notes_off_the_scale();
  check_let_go_rings_as_one_note();
  check_noise_tail_is_in_the_key();
  check_range_and_tune();
  check_glow();
  check_clicks();
  check_bad_input();
  check_block_sizes();
  check_rest();
  check_meters();
  check_every_control_works();
  check_mix();
  check_level();
  check_presets();
  check_cost();
  return finish("scale-filter");
}
