#pragma once

// The bodies of Vessel: for each, a short table of resonances (modes) and the
// few laws that turn Size, Material, Opening and Position into each mode's
// frequency, decay, and strength. Everything here is a pure function of the
// knobs, so the harness and the plate's display can hold the device to it.
//
// A mode is one two-pole resonance. Its table row says
//   ratio   its frequency over the body's lowest, at any Size;
//   gain    how strongly the body speaks there;
//   ring    how long it rings against the body's slowest mode (1);
//   lobes, phase   its shape along the body: |sin(pi (lobes x + phase))| is
//           how strongly it is heard at the place x (0 one end or the centre,
//           1 the other end or the rim).
//
// The shapes are the textbook ones where there is one (a tube open at both
// ends: sin(k pi x); stopped at x = 0: cos((2k-1) pi x / 2); a membrane's
// frequencies are the zeros of the Bessel functions over the first, and its
// radial shapes are the cosines and sines with the same count of rings), and
// irregular by design where the real thing is irregular (shell, soundboard).

#include "../../kit/math.h"

namespace livemix {
namespace vessel_dsp {

constexpr int kMaxModes = 16;
constexpr int kNumBodies = 6;

struct Mode {
  float ratio;
  float gain;
  float ring;
  float lobes;
  float phase;
};

struct Body {
  float base_hz;  // the lowest resonance at Size 1
  float far;      // the place Position's far end stands for (see listen_at)
  int count;
  Mode modes[kMaxModes];
};

// Bottle: the cavity's one deep resonance (a Helmholtz resonator: the air in
// the neck bouncing on the air in the belly, the same pressure everywhere
// inside), and far above it the standing waves along the bottle's length.
// Open pipe: every multiple of the lowest. Stopped pipe: the same tube closed
// at one end, an octave lower with only the odd multiples. Shell: a close
// cluster. Drum: an ideal membrane, its lowest mode a short thud. Soundboard:
// many broad resonances close together.
constexpr Body kBodies[kNumBodies] = {
    {110.0f,
     0.5f,
     8,
     {{1.0f, 1.0f, 1.0f, 0.0f, 0.5f},
      {5.3f, 0.5f, 0.6f, 1.0f, 0.5f},
      {8.9f, 0.44f, 0.55f, 2.0f, 0.5f},
      {12.6f, 0.4f, 0.5f, 3.0f, 0.5f},
      {16.1f, 0.36f, 0.45f, 4.0f, 0.5f},
      {19.8f, 0.32f, 0.4f, 5.0f, 0.5f},
      {23.3f, 0.3f, 0.36f, 6.0f, 0.5f},
      {27.0f, 0.28f, 0.33f, 7.0f, 0.5f}}},
    {130.81f,
     0.5f,
     16,
     {{1.0f, 1.0f, 1.0f, 1.0f, 0.0f},
      {2.0f, 0.92f, 1.0f, 2.0f, 0.0f},
      {3.0f, 0.86f, 1.0f, 3.0f, 0.0f},
      {4.0f, 0.82f, 1.0f, 4.0f, 0.0f},
      {5.0f, 0.78f, 1.0f, 5.0f, 0.0f},
      {6.0f, 0.75f, 1.0f, 6.0f, 0.0f},
      {7.0f, 0.72f, 1.0f, 7.0f, 0.0f},
      {8.0f, 0.7f, 1.0f, 8.0f, 0.0f},
      {9.0f, 0.68f, 1.0f, 9.0f, 0.0f},
      {10.0f, 0.66f, 1.0f, 10.0f, 0.0f},
      {11.0f, 0.64f, 1.0f, 11.0f, 0.0f},
      {12.0f, 0.62f, 1.0f, 12.0f, 0.0f},
      {13.0f, 0.61f, 1.0f, 13.0f, 0.0f},
      {14.0f, 0.6f, 1.0f, 14.0f, 0.0f},
      {15.0f, 0.59f, 1.0f, 15.0f, 0.0f},
      {16.0f, 0.58f, 1.0f, 16.0f, 0.0f}}},
    {65.41f,
     0.97f,
     16,
     {{1.0f, 1.0f, 1.0f, 0.5f, 0.5f},
      {3.0f, 0.9f, 1.0f, 1.5f, 0.5f},
      {5.0f, 0.84f, 1.0f, 2.5f, 0.5f},
      {7.0f, 0.8f, 1.0f, 3.5f, 0.5f},
      {9.0f, 0.76f, 1.0f, 4.5f, 0.5f},
      {11.0f, 0.73f, 1.0f, 5.5f, 0.5f},
      {13.0f, 0.7f, 1.0f, 6.5f, 0.5f},
      {15.0f, 0.68f, 1.0f, 7.5f, 0.5f},
      {17.0f, 0.66f, 1.0f, 8.5f, 0.5f},
      {19.0f, 0.64f, 1.0f, 9.5f, 0.5f},
      {21.0f, 0.62f, 1.0f, 10.5f, 0.5f},
      {23.0f, 0.61f, 1.0f, 11.5f, 0.5f},
      {25.0f, 0.6f, 1.0f, 12.5f, 0.5f},
      {27.0f, 0.59f, 1.0f, 13.5f, 0.5f},
      {29.0f, 0.58f, 1.0f, 14.5f, 0.5f},
      {31.0f, 0.57f, 1.0f, 15.5f, 0.5f}}},
    {620.0f,
     0.97f,
     14,
     {{1.0f, 0.8f, 0.8f, 0.6f, 0.5f},
      {1.17f, 1.0f, 1.0f, 1.3f, 0.0f},
      {1.41f, 0.9f, 0.9f, 1.9f, 0.5f},
      {1.58f, 0.75f, 0.7f, 2.7f, 0.0f},
      {1.83f, 1.0f, 1.0f, 3.2f, 0.5f},
      {2.12f, 0.85f, 0.85f, 4.1f, 0.0f},
      {2.37f, 0.7f, 0.65f, 4.6f, 0.5f},
      {2.74f, 0.95f, 0.9f, 5.4f, 0.0f},
      {3.05f, 0.8f, 0.75f, 6.3f, 0.5f},
      {3.48f, 0.7f, 0.8f, 6.9f, 0.0f},
      {3.97f, 0.85f, 0.7f, 7.7f, 0.5f},
      {4.43f, 0.65f, 0.6f, 8.4f, 0.0f},
      {5.12f, 0.7f, 0.6f, 9.3f, 0.5f},
      {5.86f, 0.6f, 0.5f, 10.2f, 0.0f}}},
    {82.41f,
     0.97f,
     16,
     {{1.0f, 1.0f, 0.35f, 0.5f, 0.5f},
      {1.593f, 0.9f, 0.8f, 1.0f, 0.0f},
      {2.136f, 0.85f, 1.0f, 1.0f, 0.0f},
      {2.295f, 0.8f, 0.6f, 1.5f, 0.5f},
      {2.653f, 0.75f, 1.0f, 1.0f, 0.0f},
      {2.917f, 0.72f, 0.8f, 2.0f, 0.0f},
      {3.155f, 0.68f, 0.95f, 1.0f, 0.0f},
      {3.5f, 0.66f, 0.8f, 2.0f, 0.0f},
      {3.598f, 0.64f, 0.6f, 2.5f, 0.5f},
      {3.647f, 0.6f, 0.9f, 1.0f, 0.0f},
      {4.059f, 0.58f, 0.75f, 2.0f, 0.0f},
      {4.132f, 0.56f, 0.85f, 1.0f, 0.0f},
      {4.23f, 0.54f, 0.7f, 3.0f, 0.0f},
      {4.601f, 0.52f, 0.7f, 2.0f, 0.0f},
      {4.61f, 0.5f, 0.8f, 1.0f, 0.0f},
      {4.832f, 0.48f, 0.65f, 3.0f, 0.0f}}},
    {98.0f,
     0.97f,
     16,
     {{1.0f, 0.9f, 0.5f, 0.5f, 0.5f},
      {1.83f, 1.0f, 0.45f, 1.0f, 0.0f},
      {2.27f, 0.85f, 0.4f, 1.6f, 0.5f},
      {2.91f, 0.95f, 0.42f, 2.0f, 0.0f},
      {3.38f, 0.8f, 0.36f, 1.3f, 0.5f},
      {4.07f, 0.9f, 0.4f, 3.0f, 0.0f},
      {4.61f, 0.75f, 0.34f, 2.4f, 0.5f},
      {5.19f, 0.85f, 0.36f, 3.7f, 0.0f},
      {5.94f, 0.7f, 0.32f, 4.0f, 0.0f},
      {6.58f, 0.8f, 0.34f, 2.8f, 0.5f},
      {7.43f, 0.68f, 0.3f, 5.0f, 0.0f},
      {8.21f, 0.74f, 0.32f, 4.3f, 0.5f},
      {9.17f, 0.64f, 0.28f, 6.0f, 0.0f},
      {10.4f, 0.68f, 0.3f, 5.2f, 0.5f},
      {11.8f, 0.6f, 0.26f, 7.0f, 0.0f},
      {13.3f, 0.62f, 0.26f, 6.4f, 0.5f}}},
};

// --- The laws ---------------------------------------------------------------

// Size: every resonance is the table's over Size (a body twice as big sounds
// an octave lower).
inline float mode_hz(const Body& body, int k, float size) {
  return body.base_hz * body.modes[k].ratio / size;
}

// A mode outside what can be heard or made is faded out, not folded: full up
// to 85 % of the ceiling (18 kHz, or 0.45 of the rate if that is lower), gone
// at the ceiling; full from 20 Hz, gone at 12 Hz.
constexpr float kCeilingHz = 18000.0f;
constexpr float kCeilingOfRate = 0.45f;
inline float in_range(float hz, float sample_rate) {
  const float ceiling = kit::min(kCeilingHz, kCeilingOfRate * sample_rate);
  const float top = kit::clamp((ceiling - hz) / (0.15f * ceiling), 0.0f, 1.0f);
  const float bottom = kit::clamp((hz - 12.0f) / 8.0f, 0.0f, 1.0f);
  return top * bottom;
}

// Material: the time the body's slowest mode takes to fall 60 dB, from 40 ms
// (clay: it only colours) to 4 s (metal: it sings on), whatever the Size.
constexpr float kRingMin = 0.04f;
constexpr float kRingMax = 4.0f;
inline float ring_seconds(float material) {
  return kRingMin * std::pow(kRingMax / kRingMin, kit::clamp(material, 0.0f, 1.0f));
}

// The upper modes die sooner, and much sooner in a dead material: a mode at
// `ratio` times the lowest rings ratio^-slope as long.
constexpr float kSlopeDead = 0.9f;
constexpr float kSlopeRinging = 0.3f;
inline float ring_slope(float material) {
  return kit::lerp(kSlopeDead, kSlopeRinging, kit::clamp(material, 0.0f, 1.0f));
}

// One mode's 60 dB time, and the resonance's sharpness that gives it: a
// two-pole resonance at f with sharpness Q falls as exp(-pi f t / Q), so
// Q = pi f T60 / ln(1000). Q is held between 0.7 (below it there is no
// resonance left) and 1500.
constexpr float kQPerHzSecond = 0.45473f;  // pi / ln(1000)
constexpr float kQMin = 0.7f;
constexpr float kQMax = 1500.0f;
inline float mode_seconds(const Mode& mode, float material) {
  return ring_seconds(material) * mode.ring * std::pow(mode.ratio, -ring_slope(material));
}
inline float mode_q(const Mode& mode, float hz, float material) {
  return kit::clamp(kQPerHzSecond * hz * mode_seconds(mode, material), kQMin, kQMax);
}

// Position: the place the sound is heard from, from 3 % in from the near
// end (at the very end of an open tube there is no pressure at all) to the
// body's far place: 3 % from the other end, or the middle for the two bodies
// that are the same from both ends (the bottle's standing waves and the open
// pipe), where going further would only repeat the first half.
constexpr float kEdge = 0.03f;
inline float listen_at(const Body& body, float position) {
  return kEdge + (body.far - kEdge) * kit::clamp(position, 0.0f, 1.0f);
}
inline float mode_shape(const Mode& mode, float x) {
  const float s = kit::SineTable::lookup(0.5f * (mode.lobes * x + mode.phase));
  return s < 0.0f ? -s : s;
}

// Opening: closed, the upper modes are held in (ratio^-1.5, 9 dB an octave);
// open, every mode is at its table strength. Some of the sound itself is
// always heard inside the body beside its resonances, as it is in a real
// one: 0.4 of it closed, 0.7 open. That share is the floor under the body's
// curve: every resonance's answer has a positive real part (see vessel.h), so
// at no frequency does the body pass less than this share, and a note that
// falls between two sharp resonances is still heard.
constexpr float kClosedTilt = 1.5f;
constexpr float kClosedDirect = 0.4f;
constexpr float kOpenDirect = 0.7f;
inline float opening_tilt(float opening) { return kClosedTilt * (1.0f - kit::clamp(opening, 0.0f, 1.0f)); }
inline float opening_direct(float opening) {
  const float o = kit::clamp(opening, 0.0f, 1.0f);
  return kClosedDirect + (kOpenDirect - kClosedDirect) * o * o;
}

// Width: each resonance leans to one side, the odd ones left and the even
// ones right, by up to 90 % of its strength. How far depends on where it
// lies, not on its number: a resonance under 80 Hz stays in the middle and
// one over 250 Hz leans all the way, so the body's bass is the same in both
// ears at any Size. The two sides always add up to the same sound.
constexpr float kLean = 0.9f;
constexpr float kLeanFromHz = 80.0f;
constexpr float kLeanFullHz = 250.0f;
inline float mode_lean(int k, float hz, float width) {
  const float reach = kit::clamp((hz - kLeanFromHz) / (kLeanFullHz - kLeanFromHz), 0.0f, 1.0f);
  return ((k & 1) != 0 ? kLean : -kLean) * reach * kit::clamp(width, 0.0f, 1.0f);
}
// The share of a mode's strength each side hears: channel 0 is the left.
inline float side_gain(int k, float hz, float width, int channel) {
  const float lean = mode_lean(k, hz, width);
  return channel == 0 ? 1.0f + lean : 1.0f - lean;
}

// One mode's strength at its own frequency, before the level trim.
inline float mode_gain(const Mode& mode, float x, float tilt, float hz, float sample_rate) {
  return mode.gain * mode_shape(mode, x) * std::pow(mode.ratio, -tilt) * in_range(hz, sample_rate);
}

// The level trim: the resonances pass a share of a broadband sound that
// falls as they sharpen. For a sound with equal power in every octave from
// 20 Hz to 20 kHz a unit resonance of sharpness Q passes (pi/2) / (Q ln 1000)
// of the power, and (its answer's real part being its power) the same share
// in step with the sound itself. With the resonances at t times their
// strengths s beside a share d of the sound itself, what comes out has the
// power  t^2 A + 2 t d C + d^2,  A = kShare sum(s^2 (1 + lean^2) / Q),
// C = kShare sum(s / Q)  (the two sides' leans are equal and opposite, so
// they add lean^2 to the power and nothing to the part in step). The trim is
// the t that makes this 1: a broadband sound comes out of the body and its
// direct share together about as loud as it went in. It is held under 36 dB.
constexpr float kShare = 0.22740f;  // (pi / 2) / ln(1000)
constexpr float kTrimMax = 63.0f;
inline float level_trim(float power_sum, float step_sum, float direct) {
  const float a = kit::max(kShare * power_sum, 1.0e-9f);
  const float c = kShare * step_sum;
  const float trim = (std::sqrt(direct * direct * c * c + a * (1.0f - direct * direct)) - direct * c) / a;
  return kit::min(trim, kTrimMax);
}

// The level a played line comes out at. A broadband sound comes out as loud
// as it went in (the trim), but notes are not broadband: most fall between
// the resonances, where only the floor and the resonances' skirts pass them,
// and the few that land on one are held at the level hold's ceiling. So the
// body's answer is read at 42 frequencies from 55 Hz up, 8.37 to the octave
// (five octaves; not a whole number to the octave, so a pipe's octaves never
// all sit on a reading at once), and the starting value of the level match
// is the gain g at which their mean power, each held at the ceiling, is 1:
//   mean over i of min(g^2 heard[i], ceiling^2) = 1,
// between kMatchMin and kMatchMax. It is worked out from the knobs alone,
// before any sound, so the first note after the effect is put on, after a
// sleep or after a Body change already comes out at its level.
constexpr int kScanPoints = 42;
constexpr float kScanLowHz = 55.0f;
constexpr float kScanPerOctave = 8.37f;
constexpr float kMatchMin = 0.355f;
constexpr float kMatchMax = 4.0f;
inline float scan_hz(int i) { return kScanLowHz * std::exp2(static_cast<float>(i) / kScanPerOctave); }

// One unit resonance's answer at a frequency whose (tan-warped) ratio to its
// own is x:  H = (j x / Q) / (1 - x^2 + j x / Q).  With a = x / Q and
// b = 1 - x^2 it is (a^2 + j a b) / (a^2 + b^2): the real part is never
// negative.
inline void mode_answer(float x, float inverse_q, float* real, float* imaginary) {
  const float a = x * inverse_q;
  const float b = 1.0f - x * x;
  const float inverse = 1.0f / (a * a + b * b);
  *real = a * a * inverse;
  *imaginary = a * b * inverse;
}

inline float start_gain(const float* heard, float ceiling) {
  const float top = ceiling * ceiling;
  const auto mean_at = [&](float g) {
    float sum = 0.0f;
    for (int i = 0; i < kScanPoints; ++i) sum += kit::min(g * g * heard[i], top);
    return sum * (1.0f / kScanPoints);
  };
  if (mean_at(kMatchMax) <= 1.0f) return kMatchMax;
  if (mean_at(kMatchMin) >= 1.0f) return kMatchMin;
  float low = kMatchMin, high = kMatchMax;
  for (int step = 0; step < 14; ++step) {
    const float middle = std::sqrt(low * high);
    if (mean_at(middle) < 1.0f) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return std::sqrt(low * high);
}

}  // namespace vessel_dsp
}  // namespace livemix
