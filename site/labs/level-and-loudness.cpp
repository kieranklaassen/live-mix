// Level and loudness: four ways of saying how big a sound is, read off one
// loop as it plays, and a fader that any of them can set.
//
//   in ──► × gain ──┬─────────────────────────────────────────────────────► out
//            ▲      ├──► peak hold ───────────────────────────► peak
//            │      ├──► wave between the samples ──► hold ───► true peak
//          fader    ├──► squares ──► two 30 ms poles ──► dB ──► level
//         (Set by)  └──► weighting ──► 400 ms blocks ──► gate ► loudness
//
// What runs, and whose code it is:
//
// - The peak is read from a running Ambient Limiter
//   (cpp/devices/ambient-limiter): its own peak hold, the largest sample of
//   the last 40 ms, which is its detector.
// - The peak between the samples is the detector of the limiter that device
//   ends in (cpp/devices/true-peak-limiter, TruePeakLimiter::detect), called
//   on its own for every sample of the loop: the wave worked out at four
//   places a sample from the twelve samples around them. The largest of its
//   readings over 40 ms is kept by a second copy of the limiter's peak hold.
// - The level is the detector of a running Ambient Compressor
//   (cpp/devices/ambient-comp) at a ratio of 1, so that it turns nothing
//   down: the mean of the two channels' squares through two 30 ms one-poles.
//   The device keeps that power; the decibels are a local of its control
//   step and are not kept, so the lab takes them again from the stored power
//   with the device's own expression ("lesson"), runs them through the
//   device's one-second follower, and reports how far that lands from the
//   follower the device stored (the "levelRebuilt" check). What the first of
//   the two one-poles holds is read too, for how far one filter alone moves
//   over the loop (the "firstPole" check).
// - Frequency weighting, the 400 ms blocks and the gate are not in the
//   engine's C++. The library measures loudness in TypeScript only
//   (src/core/analysis/loudness.ts). They are written here for the lesson
//   ("lesson"): the filters are the kit's own biquad with the coefficients
//   that file works out, and the blocks and the gate are that file's sums.
//   The lab's test holds each of them to that file on the same sound.
// - The whole-loop numbers (the checks) are lab.h's own peak and rms.
//
// The fader is a gain in decibels (the kit's db_to_gain). "Set by" lets one
// of the readings set it: the loop is measured once, before it plays, and
// the gain is whatever brings that reading to a fixed aim. The Fader is then
// added on top. "Silence" mutes the end of the loop, for what a pause does
// to an average.
//
// Beside the loop runs a tone made here: a sine at the Tone's frequency
// whose tallest sample is exactly as tall as the tallest sample of the
// output. It is measured with the same meters, so one render holds two sounds
// with equal peaks and whatever else they turn out to have.
//
// Pictures that are not the loop: the gain a fader makes at each decibel;
// what the weighting does to each frequency; the first samples of the tone
// with the wave that runs through them.
//
// The build part puts a meter together a piece at a time (lab::Build in
// lab.h), on a path of its own, and lets the meter so far set the fader:
// the tallest sample; the mean square over a window; decibels; the peaks
// between the samples; frequency weighting; gating. The step that is held to
// the engine is the fourth: the wave between the samples as the build works
// it out, with the engine's table of weights, against the engine's detector
// on the same sound. The two after it are the lesson's own, as above.

#include "lab.h"

#include "../../cpp/devices/ambient-comp/ambient_comp.h"
#include "../../cpp/devices/ambient-limiter/ambient_limiter.h"

using namespace livemix;

namespace {

// What a reading says when there is nothing to read.
constexpr float kSilentDb = -100.0f;

// The aims of "Set by": where each reading is brought to.
constexpr float kPeakAim = 0.5f;          // the tallest sample, as a height: half of full scale
constexpr float kMeanSquareAim = 0.005f;  // the mean square of a sine 0.1 tall
constexpr float kLoudnessAim = -20.0f;    // loudness units: where that sine reads at 1 kHz
constexpr float kMostGain = 100.0f;       // "Set by" never turns up by more than 40 dB

lab::Control fader{"fader", "Fader", "dB", -60.0f, 12.0f, 0.0f};
lab::Control set_by{"setBy", "Set by", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "Hand|Peak|Level|Loudness"};
lab::Control tone_hz{"toneHz", "Tone", "Hz", 30.0f, 12000.0f, 1000.0f, lab::kLog};
lab::Control window_ms{"window", "Window", "ms", 1.0f, 3000.0f, 400.0f, lab::kLog};
lab::Control silence{"silence", "Silence", "%", 0.0f, 75.0f, 0.0f};

lab::Tap in_tap{"in", "The loop", lab::kAudio, lab::kSource, 2};
lab::Tap tone{"tone", "A tone as tall as the output", lab::kAudio, lab::kLesson, 1};
lab::Tap weighted{"weighted", "What the loudness meter hears", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kLesson, 2};
lab::Tap peak_tap{"peak", "Peak, held 40 ms", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap true_peak{"truePeak", "Peak between the samples", lab::kControl, lab::kCalled, 1, "dB"};
lab::Tap between_tap{"between", "The wave over its samples", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level{"level", "Level", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap windowed{"windowed", "Level over the window", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap momentary{"momentary", "Loudness of the last 400 ms", lab::kControl, lab::kLesson, 1, "LUFS"};
lab::Tap gate_tap{"gate", "The gate", lab::kControl, lab::kLesson, 1, "LUFS"};
lab::Tap loudness{"loudness", "Loudness so far", lab::kControl, lab::kLesson, 1, "LUFS"};
lab::Tap law{"law", "Gain", lab::kCurve, lab::kKit, 1};
lab::Tap weighting{"weighting", "What the weighting does to each frequency", lab::kSpectrum, lab::kLesson, 1,
                   "dB"};
lab::Tap tone_wave{"toneWave", "The tone's wave", lab::kCurve, lab::kLesson, 1};
lab::Tap tone_samples{"toneSamples", "The tone's samples", lab::kCurve, lab::kLesson, 1};

lab::Check sample_peak{"samplePeak", "The output's tallest sample", "dB"};
lab::Check whole_true_peak{"wavePeak", "The output's tallest point between the samples", "dB"};
lab::Check whole_level{"loopLevel", "The output's level over the whole loop", "dB"};
lab::Check whole_loudness{"loopLoudness", "The output's loudness", "LUFS"};
lab::Check whole_plain{"plainLoudness", "The output's loudness with every block counted", "LUFS"};
lab::Check left_out{"leftOut", "Blocks the gate left out", ""};
lab::Check tone_peak{"tonePeak", "The tone's tallest sample", "dB"};
lab::Check tone_true_peak{"toneWavePeak", "The tone's tallest point between the samples", "dB"};
lab::Check tone_level{"toneLevel", "The tone's level", "dB"};
lab::Check tone_loudness{"toneLoudness", "The tone's loudness", "LUFS"};
lab::Check gain_check{"gain", "The gain the output is multiplied by", "dB"};
lab::Check level_rebuilt{"levelRebuilt", "The level taken again, against the compressor's own follower", "dB"};
lab::Check first_pole{"firstPole", "How far the compressor's first filter alone moves over the loop", "dB"};

lab::Tap built{"built", "The loop, set by the meter so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_peak{"builtPeak", "Tallest sample of each tenth of a second", lab::kControl, lab::kLesson, 1};
lab::Tap built_rms{"builtRms", "Root of the mean square", lab::kControl, lab::kLesson, 1};
lab::Tap built_peak_db{"builtPeakDb", "Peak, as built", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_level{"builtLevel", "Level, as built", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_over{"builtOver", "The wave over its samples, as built", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_momentary{"builtMomentary", "Weighted level of the last 400 ms", lab::kControl, lab::kLesson, 1,
                         "LUFS"};
lab::Tap built_gate{"builtGate", "The gate, as built", lab::kControl, lab::kLesson, 1, "LUFS"};
lab::Tap built_loudness{"builtLoudness", "Loudness so far, as built", lab::kControl, lab::kLesson, 1, "LUFS"};

// Decibels from a height (a peak, a gain) and from a power (a mean square).
// Twenty and ten: a power is a height squared, and the logarithm of a square
// is twice the logarithm.
float height_db(float height) { return height > 1.0e-5f ? 20.0f * std::log10(height) : kSilentDb; }
float power_db(double power) {
  return power > 1.0e-10 ? static_cast<float>(10.0 * std::log10(power)) : kSilentDb;
}

// ---------------------------------------------------------------------------
// The pieces of a meter. The build part adds them one at a time, and the main
// path runs the lesson's own (the window, the weighting, the blocks and the
// gate) beside the engine's.

constexpr int kTenth = 4800;  // samples in a tenth of a second

// The mean square over a window: every sample squared, the squares of the
// last `length` samples added up and divided by how many there are. The two
// channels' squares are averaged first, as the compressor's detector does.
constexpr int kMostWindow = 144000;  // 3 s

struct Window {
  double squares[kMostWindow];
  double sum = 0.0;
  double mean = 0.0;
  int length = 1;
  int at = 0;
  int since = 0;

  void start(float milliseconds) {
    length = static_cast<int>(milliseconds * 0.001f * lab::kSampleRate + 0.5f);
    if (length < 1) length = 1;
    if (length > kMostWindow) length = kMostWindow;
    for (int n = 0; n < length; ++n) squares[n] = 0.0;
    sum = 0.0;
    mean = 0.0;
    at = 0;
    since = 0;
  }

  void add(float left, float right) {
    const double square = 0.5 * (static_cast<double>(left) * left + static_cast<double>(right) * right);
    sum += square - squares[at];  // the newest square comes in, the oldest goes out
    squares[at] = square;
    at = at + 1 == length ? 0 : at + 1;
    // Adding and taking away for ever lets rounding creep in: add the window up afresh now and then.
    if (++since >= length) {
      since = 0;
      sum = 0.0;
      for (int n = 0; n < length; ++n) sum += squares[n];
    }
    mean = sum > 0.0 ? sum / length : 0.0;
  }
};

// The wave between the samples. Twelve samples in a row say where the wave
// that runs through them stands at any point between the middle two: each
// such point is a sum of the twelve, each times a weight. The engine keeps
// four rows of weights, for four points a sample apart in steps of a quarter
// (TruePeakLimiter::kFirCoefficients), and this is its sum, written out.
constexpr int kTaps = TruePeakLimiter::kFirTaps;
constexpr int kPhases = TruePeakLimiter::kFirPhases;
constexpr int kBack = TruePeakLimiter::kInterpolatorDelay;

struct Between {
  float left[kTaps * 2] = {};
  float right[kTaps * 2] = {};
  int at = 0;
  float samples = 0.0f;  // the taller of the two channels' samples, six samples back
  float wave = 0.0f;     // the tallest of that sample and the four points worked out beside it

  void start() {
    for (int n = 0; n < kTaps * 2; ++n) left[n] = right[n] = 0.0f;
    at = 0;
    samples = 0.0f;
    wave = 0.0f;
  }

  float look(float l, float r) {
    at = at + 1 == kTaps ? 0 : at + 1;
    left[at] = left[at + kTaps] = l;  // kept twice, so the last twelve always lie in a row
    right[at] = right[at + kTaps] = r;
    const int newest = at + kTaps;
    samples = kit::max(std::fabs(left[newest - kBack]), std::fabs(right[newest - kBack]));
    wave = samples;
    for (int p = 0; p < kPhases; ++p) {
      const float* weights = TruePeakLimiter::kFirCoefficients[p];
      float point_left = 0.0f;
      float point_right = 0.0f;
      for (int n = 0; n < kTaps; ++n) {
        point_left += weights[n] * left[newest - n];
        point_right += weights[n] * right[newest - n];
      }
      wave = kit::max(wave, kit::max(std::fabs(point_left), std::fabs(point_right)));
    }
    return wave;
  }
};

// Loudness, as the engine's TypeScript meter works it out
// (src/core/analysis/loudness.ts): the sound through two filters, the squares
// of what comes out averaged over blocks of 400 ms that start every 100 ms,
// and the blocks that pass a gate averaged again.
constexpr double kShelfHz = 1681.974450955533;
constexpr double kShelfDb = 3.999843853973347;
constexpr double kShelfQ = 0.7071752369554196;
constexpr double kHighpassHz = 38.13547087602444;
constexpr double kHighpassQ = 0.5003270373238773;

// The two filters' coefficients, by that file's formulas (kWeightingCoefficients).
void set_weighting(kit::Biquad& shelf, kit::Biquad& highpass) {
  const double k = std::tan(lab::kPi * kShelfHz / lab::kSampleRate);
  const double vh = std::pow(10.0, kShelfDb / 20.0);
  const double vb = std::pow(vh, 0.4996667741545416);
  const double a0 = 1.0 + k / kShelfQ + k * k;
  shelf.b0 = static_cast<float>((vh + vb * k / kShelfQ + k * k) / a0);
  shelf.b1 = static_cast<float>(2.0 * (k * k - vh) / a0);
  shelf.b2 = static_cast<float>((vh - vb * k / kShelfQ + k * k) / a0);
  shelf.a1 = static_cast<float>(2.0 * (k * k - 1.0) / a0);
  shelf.a2 = static_cast<float>((1.0 - k / kShelfQ + k * k) / a0);
  shelf.reset();

  const double k2 = std::tan(lab::kPi * kHighpassHz / lab::kSampleRate);
  const double a02 = 1.0 + k2 / kHighpassQ + k2 * k2;
  highpass.b0 = 1.0f;
  highpass.b1 = -2.0f;
  highpass.b2 = 1.0f;
  highpass.a1 = static_cast<float>(2.0 * (k2 * k2 - 1.0) / a02);
  highpass.a2 = static_cast<float>((1.0 - k2 / kHighpassQ + k2 * k2) / a02);
  highpass.reset();
}

struct Loudness {
  static constexpr int kBlockTenths = 4;   // a block is 400 ms
  static constexpr int kMostBlocks = 256;  // 8 s twice over is 164
  static constexpr double kOffset = -0.691;
  static constexpr double kAbsoluteGate = -70.0;
  static constexpr double kRelativeGate = -10.0;

  kit::Biquad shelf[2];
  kit::Biquad highpass[2];
  float heard[2] = {0.0f, 0.0f};  // the sound as the meter hears it
  double tenth_sum = 0.0;
  int tenth_count = 0;
  double tenths[kBlockTenths] = {};  // the mean square of each of the last four tenths
  int tenth_at = 0;
  int tenths_seen = 0;
  double block = 0.0;         // the mean square of the last 400 ms
  double blocks[kMostBlocks];  // every block that passed the absolute gate
  int block_count = 0;
  double all_sum = 0.0;  // every block there has been, gate or no gate
  int all_count = 0;
  int kept = 0;                    // blocks that pass both gates
  float momentary = kSilentDb;     // the last block, in loudness units
  float plain = kSilentDb;         // every block averaged
  float threshold = kSilentDb;     // the relative gate: 10 under the average of what the absolute gate passed
  float gated = kSilentDb;         // the blocks over the threshold averaged

  static float units(double mean_square) {
    return mean_square > 1.0e-10 ? static_cast<float>(kOffset + 10.0 * std::log10(mean_square)) : kSilentDb;
  }

  void start() {
    for (int c = 0; c < 2; ++c) set_weighting(shelf[c], highpass[c]);
    heard[0] = heard[1] = 0.0f;
    tenth_sum = 0.0;
    tenth_count = 0;
    for (double& tenth : tenths) tenth = 0.0;
    tenth_at = 0;
    tenths_seen = 0;
    block = 0.0;
    block_count = 0;
    all_sum = 0.0;
    all_count = 0;
    kept = 0;
    momentary = plain = threshold = gated = kSilentDb;
  }

  // Frequency weighting: the shelf lifts what is above it by 4 dB and the
  // high-pass turns down what is below it, before anything is squared.
  void weigh(float left, float right) {
    heard[0] = highpass[0].process(shelf[0].process(left));
    heard[1] = highpass[1].process(shelf[1].process(right));
  }

  // The blocks: the two channels' squares added, averaged over each tenth of
  // a second, and the last four tenths averaged. True when a block is done.
  bool collect() {
    tenth_sum += static_cast<double>(heard[0]) * heard[0] + static_cast<double>(heard[1]) * heard[1];
    if (++tenth_count < kTenth) return false;
    tenths[tenth_at] = tenth_sum / kTenth;
    tenth_at = tenth_at + 1 == kBlockTenths ? 0 : tenth_at + 1;
    tenth_sum = 0.0;
    tenth_count = 0;
    if (++tenths_seen < kBlockTenths) return false;
    double sum = 0.0;
    int index = tenth_at;
    for (int n = 0; n < kBlockTenths; ++n) {
      index = index == 0 ? kBlockTenths - 1 : index - 1;
      sum += tenths[index];
    }
    block = sum / kBlockTenths;
    momentary = units(block);
    all_sum += block;
    ++all_count;
    plain = units(all_sum / all_count);
    return true;
  }

  // Gating: a block of silence is not part of the piece. A block at or under
  // -70 is dropped. The rest are averaged, a line is drawn 10 under that
  // average, and only the blocks over the line are averaged for the answer.
  void gate() {
    if (momentary > kAbsoluteGate && block_count < kMostBlocks) blocks[block_count++] = block;
    if (block_count == 0) return;
    double passed = 0.0;
    for (int n = 0; n < block_count; ++n) passed += blocks[n];
    threshold = units(passed / block_count) + static_cast<float>(kRelativeGate);
    double sum = 0.0;
    kept = 0;
    for (int n = 0; n < block_count; ++n) {
      if (units(blocks[n]) > threshold) {
        sum += blocks[n];
        ++kept;
      }
    }
    gated = kept > 0 ? units(sum / kept) : kSilentDb;
  }

  void run(float left, float right) {
    weigh(left, right);
    if (collect()) gate();
  }
};

// The loop, measured once before it plays: what "Set by" and the build's
// steps set the fader from.
struct Whole {
  float peak = 0.0f;         // the tallest sample of either channel
  float mean_square = 0.0f;  // of both channels
  float plain = kSilentDb;   // weighted, every block counted
  float loudness = kSilentDb;
};

Loudness measuring;

Whole measure(const float* left, const float* right, int frames) {
  Whole whole;
  whole.peak = kit::max(lab::peak(left, frames), lab::peak(right, frames));
  const float rms_left = lab::rms(left, frames);
  const float rms_right = lab::rms(right, frames);
  whole.mean_square = 0.5f * (rms_left * rms_left + rms_right * rms_right);
  // The loudness meter hears the loop twice from rest, as every meter here does.
  measuring.start();
  for (int i = 0; i < 2 * frames; ++i) measuring.run(left[i % frames], right[i % frames]);
  whole.plain = measuring.plain;
  whole.loudness = measuring.gated;
  return whole;
}

// The gain that brings a reading to its aim: a ratio for heights, the root of
// a ratio for mean squares, a difference for anything in decibels.
float gain_for_peak(const Whole& whole) { return whole.peak > 0.0f ? kPeakAim / whole.peak : 1.0f; }
float gain_for_level(const Whole& whole) {
  return whole.mean_square > 0.0f ? std::sqrt(kMeanSquareAim / whole.mean_square) : 1.0f;
}
float gain_for_units(float reading) {
  return reading > kSilentDb ? std::pow(10.0f, (kLoudnessAim - reading) / 20.0f) : 1.0f;
}
float capped(float gain) { return gain > kMostGain ? kMostGain : gain; }

// The Fader's decibels as a number to multiply by: the kit's own function.
// At the bottom of its travel the fader is shut, as the engine's channel
// fader is (utilityGain in src/core/devices/native/Utility.ts).
float fader_gain() { return fader.value <= fader.min ? 0.0f : kit::db_to_gain(fader.value); }

// ---------------------------------------------------------------------------
// The build part: a meter put together a piece at a time, and the fader it sets.

struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kPeak = 0, kMeanSquare, kDecibels, kBetween, kWeighting, kGating };

  int pieces = kPeak;
  int count = 0;            // samples into this tenth of a second
  float tallest = 0.0f;     // the tallest sample of this tenth so far
  float peak = 0.0f;        // the tallest sample of the last whole tenth
  Window window;
  Between between;
  float wave_tallest = 0.0f;
  float samples_tallest = 0.0f;
  float over = 0.0f;        // how far the wave stood over its samples in the last whole tenth, in dB
  Loudness loud;

  // Peak: a sample's height is how far it lies from zero, on either side.
  // The peak of a stretch of sound is the tallest sample in it.
  void look(float left, float right) {
    const float height = kit::max(std::fabs(left), std::fabs(right));
    if (height > tallest) tallest = height;
  }

  // The gain that brings the loop's reading to its aim, by the newest piece
  // that can set one. From the decibels on there is a Fader, which is added.
  float gain(const Whole& whole) const {
    float set = gain_for_peak(whole);
    if (pieces >= kMeanSquare) set = gain_for_level(whole);
    if (pieces >= kWeighting) set = gain_for_units(whole.plain);
    if (pieces >= kGating) set = gain_for_units(whole.loudness);
    set = capped(set);
    if (pieces >= kDecibels) set *= fader.value <= fader.min ? 0.0f : times(fader.value);
    return set;
  }

  // Decibels: twenty times the logarithm of a height, and the way back, ten
  // to the power of a twentieth of them. A reading under a hundred-thousandth
  // of full scale is called silence.
  static float decibels(float height) { return height > 1.0e-5f ? 20.0f * std::log10(height) : kSilentDb; }
  static float times(float db) { return std::pow(10.0f, db / 20.0f); }

  // One sample through the pieces built so far.
  void run(float left, float right) {
    look(left, right);
    if (pieces >= kMeanSquare) window.add(left, right);
    if (pieces >= kBetween) {
      between.look(left, right);
      wave_tallest = kit::max(wave_tallest, between.wave);
      samples_tallest = kit::max(samples_tallest, between.samples);
    }
    if (pieces >= kWeighting) {
      loud.weigh(left, right);
      if (loud.collect() && pieces >= kGating) loud.gate();
    }
    if (++count == kTenth) {
      peak = tallest;
      over = samples_tallest > 1.0e-5f ? 20.0f * std::log10(wave_tallest / samples_tallest) : 0.0f;
      tallest = wave_tallest = samples_tallest = 0.0f;
      count = 0;
    }
  }

  void start(int pieces_) {
    pieces = pieces_;
    count = 0;
    tallest = peak = 0.0f;
    window.start(window_ms.value);
    between.start();
    wave_tallest = samples_tallest = over = 0.0f;
    loud.start();
  }
};

lab::Build build{"The tallest sample|Mean square over a window|Decibels|Peaks between the samples|"
                 "Frequency weighting|Gating",
                 Built::kBetween, -120.0f,
                 "The wave between the samples as built, against the engine's own detector on the same sound"};

Built shown;         // at the step the reader chose: what the built taps hold
Between held;        // the fourth piece alone: what is compared with the engine
TruePeakLimiter held_engine;  // the engine's detector on the built sound

// ---------------------------------------------------------------------------
// The main path.

AmbientLimiter limiter;      // for its peak hold
AmbientComp comp;            // for its level detector
TruePeakLimiter detector;    // for its detect(): the wave between the samples
TruePeakLimiter tone_detector;
AmbientLimiter::PeakHold wave_hold;     // the limiter's own hold, on the detector's readings
AmbientLimiter::PeakHold samples_hold;  // and on the samples the detector compared them with
Window main_window;
Loudness out_meter;
Loudness tone_meter;

// The part of the loop that sounds: 1, and 0 over the last `silence` per cent
// of it, with 10 ms of fade at each edge so that nothing clicks.
constexpr int kEdge = 480;

float sounding(int n, int frames, int muted) {
  if (muted < 2 * kEdge) return 1.0f;
  const int into = n - (frames - muted);
  if (into < 0) return 1.0f;
  if (into < kEdge) return 0.5f + 0.5f * std::cos(static_cast<float>(lab::kPi) * into / kEdge);
  const int left = frames - 1 - n;
  if (left < kEdge) return 0.5f + 0.5f * std::cos(static_cast<float>(lab::kPi) * (left + 1) / kEdge);
  return 0.0f;
}

// The gain a fader makes at each decibel, by the kit's own function.
constexpr int kLawPoints = 145;

void draw_law() {
  if (!law.open(kLawPoints)) return;
  law.x0 = fader.min;
  law.x1 = fader.max;
  for (int p = 0; p < kLawPoints; ++p) {
    const float db = fader.min + (fader.max - fader.min) * static_cast<float>(p) / (kLawPoints - 1);
    law.set(p, p == 0 ? 0.0f : kit::db_to_gain(db));
  }
}

// What the weighting does to each frequency: one unit sample through the two
// filters, and the level of what rings out at each frequency.
constexpr int kRing = 16384;
float ring[kRing];

void draw_weighting() {
  kit::Biquad shelf, highpass;
  set_weighting(shelf, highpass);
  for (int n = 0; n < kRing; ++n) ring[n] = highpass.process(shelf.process(n == 0 ? 1.0f : 0.0f));
  lab::response_tap(weighting, ring, kRing);
}

// The first 24 samples of the tone, and the wave that runs through them at
// sixteen points a sample.
constexpr int kToneSamples = 24;
constexpr int kTonePoints = 16;

void draw_tone(double step, double start, float height) {
  if (!tone_samples.open(kToneSamples + 1) || !tone_wave.open(kToneSamples * kTonePoints + 1)) return;
  tone_samples.x0 = tone_wave.x0 = 0.0f;
  tone_samples.x1 = tone_wave.x1 = static_cast<float>(kToneSamples);
  for (int n = 0; n <= kToneSamples; ++n) {
    tone_samples.set(n, height * static_cast<float>(std::sin(start + step * n)));
  }
  for (int p = 0; p <= kToneSamples * kTonePoints; ++p) {
    tone_wave.set(p, height * static_cast<float>(std::sin(start + step * p / kTonePoints)));
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  using lab::kSampleRate;
  const int total = lab::total();

  // The sound that is measured: the loop, with its end muted by Silence.
  float* sound[2] = {lab::take(frames), lab::take(frames)};
  float* unit = lab::take(frames);
  if (!sound[0] || !sound[1] || !unit) return;
  const int muted = static_cast<int>(silence.value * 0.01f * static_cast<float>(frames) + 0.5f);
  for (int n = 0; n < frames; ++n) {
    const float part = sounding(n, frames, muted);
    sound[0][n] = lab::in(0)[n] * part;
    sound[1][n] = lab::in(1)[n] * part;
  }

  // Measured once, before it plays.
  const Whole whole = measure(sound[0], sound[1], frames);

  // The fader: what "Set by" asks for, and the Fader's decibels on top.
  float set = 1.0f;
  if (set_by.choice() == 1) set = gain_for_peak(whole);
  if (set_by.choice() == 2) set = gain_for_level(whole);
  if (set_by.choice() == 3) set = gain_for_units(whole.loudness);
  const float gain = capped(set) * fader_gain();
  gain_check.value = kit::gain_to_db(gain);

  // The tone: a whole number of cycles in the loop, starting an eighth of a
  // turn in, as tall at its tallest sample as the output is at its own.
  const double seconds = static_cast<double>(frames) / kSampleRate;
  double cycles = std::floor(static_cast<double>(tone_hz.value) * seconds + 0.5);
  if (cycles < 1.0) cycles = 1.0;
  const double step = 2.0 * lab::kPi * cycles / frames;
  const double start = 0.25 * lab::kPi;
  for (int n = 0; n < frames; ++n) unit[n] = static_cast<float>(std::sin(start + step * n));
  const float unit_peak = lab::peak(unit, frames);
  const float tone_height = unit_peak > 0.0f ? whole.peak * gain / unit_peak : 0.0f;

  // The devices, each as it starts by itself but for what is said here.
  limiter.init(kSampleRate);
  comp.init(kSampleRate);
  comp.set_param(ambient_comp::kRatio, 1.0f);      // nothing is turned down: only its detector is wanted
  comp.set_param(ambient_comp::kScLowCut, 20.0f);  // "Ignore below" as low as it goes
  detector.prepare(kSampleRate);
  tone_detector.prepare(kSampleRate);
  held_engine.prepare(kSampleRate);
  wave_hold.set(AmbientLimiter::kHoldSeconds, kSampleRate);
  wave_hold.reset();
  samples_hold.set(AmbientLimiter::kHoldSeconds, kSampleRate);
  samples_hold.reset();
  main_window.start(window_ms.value);
  out_meter.start();
  tone_meter.start();

  // The compressor's level, taken again from its stored power.
  float level_now = AmbientComp::kFloorDb;
  float slow = AmbientComp::kFloorDb;
  float worst = 0.0f;
  bool was_resting = true;
  // What the first of its two filters holds, at its least and its most over the pass that is kept.
  float pole_least = 0.0f;
  float pole_most = 0.0f;
  bool pole_read = false;

  // The build part.
  shown.start(build.at());
  held.start();
  const float built_gain = shown.gain(whole);
  double built_apart = 0.0, built_whole = 0.0;

  // The peaks need 41 ms of the pass that is thrown away, not all of it.
  const int peaks_from = frames > 12000 ? frames - 12000 : 0;
  float top_wave = 0.0f;
  float top_tone_wave = 0.0f;

  for (int i = 0; i < total; ++i) {
    const int n = i % frames;
    const float left = sound[0][n] * gain;
    const float right = sound[1][n] * gain;
    const float sine = tone_height * unit[n];

    in_tap.put(i, lab::in_at(0, i), lab::in_at(1, i));
    tone.put(i, sine);
    out_tap.put(i, left, right);

    // Peak, and the peak between the samples.
    float held_peak = 0.0f;
    if (i >= peaks_from) {
      limiter.in_left()[0] = left;
      limiter.in_right()[0] = right;
      limiter.process(1);
      held_peak = limiter.hold_.level();

      const float reading = detector.detect(left, right);
      const int newest = detector.fir_index_ + kTaps;
      wave_hold.process(reading);
      samples_hold.process(
          kit::max(std::fabs(detector.fir_left_[newest - kBack]), std::fabs(detector.fir_right_[newest - kBack])));
      const float tone_reading = tone_detector.detect(sine, sine);
      if (i >= frames && i < 2 * frames) {
        top_wave = kit::max(top_wave, reading);
        top_tone_wave = kit::max(top_tone_wave, tone_reading);
      }
    }

    // Level: the compressor's detector.
    comp.in_left()[0] = left;
    comp.in_right()[0] = right;
    const bool ticks = comp.clock_.counter == 0;  // the device reads its level on this sample
    comp.process(1);
    if (i >= frames && !comp.resting_) {
      const float first = comp.rms_[0].state;
      pole_least = pole_read ? kit::min(pole_least, first) : first;
      pole_most = pole_read ? kit::max(pole_most, first) : first;
      pole_read = true;
    }
    if (comp.resting_) {
      level_now = AmbientComp::kFloorDb;
      slow = AmbientComp::kFloorDb;
      was_resting = true;
    } else if (ticks || was_resting) {
      was_resting = false;
      const float power = comp.rms_[1].state;
      level_now = power > AmbientComp::kFloorPower ? 10.0f * std::log10(power) : AmbientComp::kFloorDb;
      slow = flush_denormal(level_now + (slow - level_now) * comp.slow_coeff_);
      if (slow < level_now - AmbientComp::kDyingDb) slow = level_now - AmbientComp::kDyingDb;
      const float apart = slow > comp.slow_level_ ? slow - comp.slow_level_ : comp.slow_level_ - slow;
      if (i >= frames && apart > worst) worst = apart;
    }

    // Level over the Window, and loudness.
    main_window.add(left, right);
    out_meter.run(left, right);
    tone_meter.run(sine, sine);
    weighted.put(i, out_meter.heard[0], out_meter.heard[1]);

    // The build part, on the loop at the gain its meter so far sets.
    const float built_left = sound[0][n] * built_gain;
    const float built_right = sound[1][n] * built_gain;
    shown.run(built_left, built_right);
    built.put(i, built_left, built_right);
    if (i >= peaks_from) {
      const float mine = held.look(built_left, built_right);
      const float engines = held_engine.detect(built_left, built_right);
      if (i >= frames) {
        built_apart += (static_cast<double>(mine) - engines) * (static_cast<double>(mine) - engines);
        built_whole += static_cast<double>(engines) * engines;
      }
    }

    if (i % lab::kControlPeriod == 0) {
      const float wave_db = height_db(wave_hold.level());
      const float samples_db = height_db(samples_hold.level());
      peak_tap.put(i, kit::max(kSilentDb, kit::gain_to_db(held_peak)));
      true_peak.put(i, wave_db);
      between_tap.put(i, wave_db - samples_db);
      level.put(i, level_now);
      windowed.put(i, power_db(main_window.mean));
      momentary.put(i, out_meter.momentary);
      gate_tap.put(i, out_meter.threshold);
      loudness.put(i, out_meter.gated);

      const int step = shown.pieces;
      built_peak.put(i, shown.peak);
      built_rms.put(i, step >= Built::kMeanSquare ? static_cast<float>(std::sqrt(shown.window.mean)) : 0.0f);
      built_peak_db.put(i, step >= Built::kDecibels ? Built::decibels(shown.peak) : kSilentDb);
      built_level.put(i, step >= Built::kDecibels
                                ? Built::decibels(static_cast<float>(std::sqrt(shown.window.mean)))
                                : kSilentDb);
      built_over.put(i, shown.over);
      built_momentary.put(i, shown.loud.momentary);
      built_gate.put(i, shown.loud.threshold);
      built_loudness.put(i, shown.loud.gated);
    }

    // The loop has now been heard twice: what the meters read is the answer.
    if (i == 2 * frames - 1) {
      whole_loudness.value = out_meter.gated;
      whole_plain.value = out_meter.plain;
      left_out.value = static_cast<float>(out_meter.all_count - out_meter.kept);
      tone_loudness.value = tone_meter.gated;
    }
  }

  // The whole-loop numbers, by lab.h's own peak and rms on the taps as they will be heard.
  if (out_tap.data) {
    sample_peak.value = lab::to_db(lab::peak(out_tap.data, 2 * out_tap.length));
    whole_level.value = lab::to_db(lab::rms(out_tap.data, 2 * out_tap.length));
  }
  if (tone.data) {
    tone_peak.value = lab::to_db(lab::peak(tone.data, tone.length));
    tone_level.value = lab::to_db(lab::rms(tone.data, tone.length));
  }
  whole_true_peak.value = lab::to_db(top_wave);
  tone_true_peak.value = lab::to_db(top_tone_wave);
  level_rebuilt.value = worst;
  first_pole.value = pole_read && pole_least > AmbientComp::kFloorPower
                         ? 10.0f * std::log10(pole_most / pole_least)
                         : 0.0f;
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  draw_law();
  draw_weighting();
  draw_tone(step, start, tone_height);
}
