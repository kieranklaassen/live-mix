// The short-time Fourier transform: the kit's own frame-by-frame
// transform (cpp/kit/stft.h) run on the loop, and Glimmer (cpp/devices/glimmer),
// a device built on it, run beside it one sample at a time.
//
//   in ─┬─► Hann ─► FFT ─► (nothing) ─► IFFT ─► Hann ─► overlap-add ─► through
//       │             └─► the bins of every frame: the picture
//       └─► Glimmer: Hann ─► FFT ─► × gain per bin ─► IFFT ─► Hann ─► overlap-add ─► wet ─► out
//
// Computed by the kit: the frames it cuts (read from its ring), its window,
// the bins it hands over, what it overlap-adds back when nothing is altered,
// and the same transform of Glimmer's output. Read from the device: the sound
// its altered frames add up to (taken from its Stft's output ring before the
// attack pass mixes the dry sound in), how far that pass has turned to the dry
// sound, and its output; and the same two for one unit sample put into a
// second device at rest.
//
// Written for the lesson: the frame times the window (the kit multiplies as it
// transforms and keeps no copy; the "transformed" check holds the product to
// the bins the kit handed over), overlap-add by hand at any hop (the kit
// refuses a hop over a quarter of the frame; "byHand" holds it to the kit),
// and Glimmer's gain for every bin, which is a local of its frame function:
// worked out again from the device's own band gains and held to the ratio of
// the bins the device left to the bins the kit made of the same frame
// ("gainRebuilt").
//
// The build part puts the transform together a piece at a time, on a path of
// its own beside the device (lab::Build in lab.h), at Glimmer's own frame of
// 2,048 samples. It has five pieces, each a function of `Built` below, in the
// order the steps add them: one frame cut, transformed by the kit's plain
// transform, transformed back and laid down where it came from; a window on
// the way in; a hop of a quarter of a frame; the window a second time and the
// scale that makes four frames add up to one (overlap and add); and Glimmer's
// gain on every bin. The path writes the "built" taps and leaves every other
// tap as it was. Two copies of it run: one at the step the reader chose, which
// is what the taps show, and one with all five pieces, whose output is compared
// on every render with what the device's own frames add up to (its Stft's
// output ring: the "builtDifference" check). The gain for a bin is not built
// again: it is the device's own, read from its tables frame by frame, as the
// "gains" picture reads it. A step before the last is the lesson's own: frames
// with a piece missing, which the kit's class never is. Where the device
// sleeps through a silence, the build takes silence in with it.
//
// One more thing is written for the lesson with the build's pieces: one unit
// sample through the same frames and the same gains as the second device's,
// once with the window on the way out ("clickRebuilt" holds that to the
// device's own frames) and once without it, which is what the second window
// is there to prevent.

#include "lab.h"

#include <cstring>

#include "../../cpp/kit/stft.h"
#include "../../cpp/devices/glimmer/glimmer.h"

using namespace livemix;

namespace {

// --- controls ----------------------------------------------------------------------------------

lab::Control size{"size", "Frame", "samples", 0.0f, 3.0f, 2.0f, lab::kLinear, "512|1024|2048|4096"};
lab::Control at{"at", "Frame at", "s", 0.0f, 4.0f, 1.1f};
lab::Control hop{"hop", "Hop", "of a frame", 0.0f, 2.0f, 1.0f, lab::kLinear, "A half|A quarter|An eighth"};
lab::Control depth{"depth", "Depth", "", 0.0f, 1.0f, 1.0f};
lab::Control rate{"rate", "Rate", "Hz", 0.03f, 12.0f, 1.0f, lab::kLog};
lab::Control grain{"grain", "Grain", "", 0.0f, 1.0f, 0.7f};
lab::Control pattern{"pattern", "Pattern", "", 0.0f, 3.0f, 1.0f, lab::kLinear, "Scatter|Upward|Downward|Outward"};
lab::Control lean{"lean", "Lean", "", -1.0f, 1.0f, 0.0f};
lab::Control soft{"soft", "Soft", "", 0.0f, 1.0f, 0.75f};
lab::Control vary{"vary", "Vary", "", 0.0f, 1.0f, 0.0f};
lab::Control apart{"apart", "Apart", "", 0.0f, 1.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};

// --- taps --------------------------------------------------------------------------------------

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap frame_raw{"frameRaw", "One frame, as cut", lab::kCurve, lab::kKit, 1};
lab::Tap window_tap{"window", "The Hann window, at the frame's height", lab::kCurve, lab::kKit, 1};
lab::Tap frame_tap{"frame", "The frame, windowed", lab::kCurve, lab::kLesson, 1};
lab::Tap bins{"bins", "That frame's spectrum", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap picture{"picture", "Every frame's spectrum", lab::kFrames, lab::kKit, 1, "dB"};
lab::Tap windows{"windows", "Each frame's two windows", lab::kFrames, lab::kLesson, 1};
lab::Tap window_sum{"windowSum", "All of them added and scaled", lab::kCurve, lab::kLesson, 1};
lab::Tap through{"through", "Overlap-added, nothing altered", lab::kAudio, lab::kKit, 1};
lab::Tap added{"added", "Overlap-added by hand at this hop", lab::kAudio, lab::kLesson, 1};
lab::Tap loudest{"loudest", "The centre of the loudest bin", lab::kControl, lab::kLesson, 1, "Hz"};
lab::Tap turning{"turning", "Frequency from the phase's turn", lab::kControl, lab::kKit, 1, "Hz"};
lab::Tap gains{"gains", "Glimmer's gain for every bin", lab::kFrames, lab::kLesson, 1, "dB"};
lab::Tap wet{"wet", "Glimmer's frames, overlap-added", lab::kAudio, lab::kDevice, 2};
lab::Tap pass{"pass", "How far the output has turned to the dry sound", lab::kControl, lab::kDevice, 1};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap click_wet{"clickWet", "One unit sample through Glimmer's frames", lab::kCurve, lab::kDevice, 1};
lab::Tap click_out{"clickOut", "And as Glimmer puts it out", lab::kCurve, lab::kDevice, 1};
lab::Tap click_bare{"clickBare", "The same sample and gains, with no window on the way out", lab::kCurve, lab::kLesson, 1};
lab::Tap picture_out{"pictureOut", "Every frame's spectrum, of the output", lab::kFrames, lab::kKit, 1, "dB"};

// --- checks ------------------------------------------------------------------------------------

lab::Check transformed{"transformed", "The lesson's windowed frame, transformed, against the bins the kit handed over",
                       "dB"};
lab::Check returned{"returned", "What overlap-add returns, late by the latency, against what went in", "dB"};
lab::Check by_hand{"byHand", "Overlap-add by hand at this hop, against the kit's", "dB"};
lab::Check gain_rebuilt{"gainRebuilt", "The gain per bin worked out from Glimmer's bands, against what its frames show",
                        "dB"};
lab::Check click_rebuilt{"clickRebuilt", "One unit sample through the build's frames, against Glimmer's own frames", "dB"};

// --- the build part's taps -----------------------------------------------------------------------

lab::Tap built{"built", "The frames so far, laid back down", lab::kAudio, lab::kLesson, 1};
lab::Tap built_frame{"builtFrame", "The frame that is transformed", lab::kCurve, lab::kLesson, 1};
lab::Tap built_bins{"builtBins", "That frame's bins", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap built_changed{"builtChanged", "The bins as they go back", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap built_picture{"builtPicture", "A column for every frame so far", lab::kFrames, lab::kLesson, 1, "dB"};
lab::Tap built_windows{"builtWindows", "Each frame's share of what comes back", lab::kFrames, lab::kLesson, 1};
lab::Tap built_window_sum{"builtWindowSum", "The shares added", lab::kCurve, lab::kLesson, 1};

// --- the device, and the kit's frames of its size ------------------------------------------------

Glimmer device;
Glimmer probe;                                    // a second device, for what it makes of one unit sample
using DeviceStft = Glimmer::Stft;                 // kit::Stft<2048, 512>
DeviceStft reference;                             // the frames Glimmer's left side cuts, analysed only
float reference_re[DeviceStft::kBins];            // the newest of them
float reference_im[DeviceStft::kBins];
float earlier_re[DeviceStft::kBins];              // and the one before
float earlier_im[DeviceStft::kBins];
unsigned char filled[lab::kMaxFrames / 64 + 1];   // which columns of a picture were written
unsigned char built_filled[lab::kMaxFrames / 64 + 1];  // and of the build part's picture

// Where the frame that ends at sample `end` of the render stands in the loop:
// the place of its middle, 0 to frames - 1. A frame near the start reaches
// back into the loop's end, as the loop itself does.
int middle_of(int end, int frame) {
  const int frames = lab::frames();
  return ((end - frame / 2) % frames + frames) % frames;
}

// A picture with a column for every hop of the loop, rows from 0 Hz to half the rate.
int open_picture(lab::Tap& tap, int hop_samples, int rows) {
  const int columns = lab::frames() / hop_samples;
  if (columns <= 0 || !tap.open(columns * rows)) return 0;
  tap.columns = columns;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(columns * hop_samples) / lab::kSampleRate;
  return columns;
}

void begin_columns(int columns, unsigned char* written = filled) {
  for (int c = 0; c < columns; ++c) written[c] = 0;
}

// The loop's length is not always a whole number of hops: a column no frame
// fell in takes the one before it.
void close_columns(lab::Tap& tap, int columns, int rows, const unsigned char* written = filled) {
  if (!tap.data) return;
  for (int c = 0; c < columns; ++c) {
    if (written[c]) continue;
    const int from = c > 0 ? c - 1 : columns - 1;
    for (int k = 0; k < rows; ++k) tap.data[c * rows + k] = tap.data[from * rows + k];
  }
}

// The column of the frame that ends at `end`, in the second pass only; -1 otherwise.
int column_of(int end, int frame, int hop_samples, int columns) {
  if (end < lab::frames() || end >= 2 * lab::frames() || columns <= 0) return -1;
  const int column = middle_of(end, frame) / hop_samples;
  return column < columns ? column : columns - 1;
}

// 10 log10(power) for a picture, where a million of them are wanted on every
// render: the float's own exponent, and for what is left of it the series
// ln m = 2 (z + z³/3 + z⁵/5 + z⁷/7), z = (m - 1) / (m + 1), good to 0.0001 dB.
// The numbers the lesson states come from lab::power_to_db, not from this.
float picture_db(float power) {
  if (!(power > 1.0e-14f)) return lab::kFloorDb;
  uint32_t bits;
  std::memcpy(&bits, &power, sizeof bits);
  const float exponent = static_cast<float>(static_cast<int>(bits >> 23) - 127);
  bits = (bits & 0x007FFFFFu) | 0x3F800000u;
  float m;
  std::memcpy(&m, &bits, sizeof m);  // 1 to 2
  const float z = (m - 1.0f) / (m + 1.0f);
  const float z2 = z * z;
  const float ln = 2.0f * z * (1.0f + z2 * (1.0f / 3.0f + z2 * (0.2f + z2 * (1.0f / 7.0f))));
  return 3.0102999566f * exponent + 4.3429448190f * ln;
}

// One column: the level of every bin, in dB where a full-scale sine on a bin reads 0.
void write_column(lab::Tap& tap, int column, const float* re, const float* im, int rows, float full_scale,
                  unsigned char* written = filled) {
  if (column < 0 || !tap.data) return;
  float* out = tap.data + column * rows;
  const float scale = 1.0f / (full_scale * full_scale);
  for (int k = 0; k < rows; ++k) out[k] = picture_db((re[k] * re[k] + im[k] * im[k]) * scale);
  written[column] = 1;
}

// --- Glimmer, one sample at a time --------------------------------------------------------------

// Glimmer's gain for bin k of its left side, as its frame() works it out, from
// the tables the device keeps.
float gain_of(const Glimmer& glimmer, int k) {
  const int j = glimmer.cell_[k];
  const float under = glimmer.gain_[0][j];
  return kit::min(Glimmer::kMaxLift, (under + glimmer.blend_[k] * (glimmer.gain_[0][j + 1] - under)) *
                                         (1.0f + glimmer.hump_[k] * glimmer.raise_[j]));
}
float device_gain(int k) { return gain_of(device, k); }

// The reader's settings. The lesson starts three of them plain: every band
// flickers as deeply as the next (Lean 0), every flash is as tall as the last
// (Vary 0), and the two sides move as one (Apart 0).
void configure(Glimmer& glimmer) {
  using namespace glimmer;
  glimmer.init(lab::kSampleRate);
  glimmer.set_param(kDepth, depth.value);
  glimmer.set_param(kRate, rate.value);
  glimmer.set_param(kGrain, grain.value);
  glimmer.set_param(kPattern, static_cast<float>(pattern.choice()));
  glimmer.set_param(kLean, lean.value);
  glimmer.set_param(kSoft, soft.value);
  glimmer.set_param(kVary, vary.value);
  glimmer.set_param(kApart, apart.value);
  glimmer.set_param(kMix, mix.value);
}

// --- the build part: frames, a piece at a time ---------------------------------------------------

constexpr int kBuildFrame = DeviceStft::kFrame;      // 2,048 samples, as Glimmer's
constexpr int kBuildHop = DeviceStft::kHop;          // a quarter of it
constexpr int kBuildBins = DeviceStft::kBins;
constexpr int kBuildOverlap = DeviceStft::kOverlap;  // frames over any one sample, at that hop
constexpr int kBuildWait = DeviceStft::kMaxStagger;  // a frame goes out half a hop after it is whole
constexpr uint32_t kBuildMask = 2 * kBuildFrame - 1;

kit::Fft<kBuildFrame> build_fft;  // the kit's plain transform
float hann[kBuildFrame];          // the kit's window: its own table, copied in lab_setup

// The transform so far: one function a piece, and run() to take a sample
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kFrame = 0, kWindow, kHops, kOverlapAdd, kChange };

  int pieces = kFrame;
  float ring[2 * kBuildFrame] = {};  // the last two frames' worth of what came in
  float sum[2 * kBuildFrame] = {};   // the frames laid back down, waiting to go out
  float re[kBuildFrame] = {};        // the frame in hand: samples, then bins, then samples again
  float im[kBuildFrame] = {};

  // One frame: the newest 2,048 samples, cut out as they are.
  void cut(int i) {
    for (int n = 0; n < kBuildFrame; ++n) {
      re[n] = ring[static_cast<uint32_t>(i - kBuildFrame + n) & kBuildMask];
      im[n] = 0.0f;
    }
  }

  // The frame as bins, and the bins as a frame again. The kit's inverse is
  // unscaled, so the way back divides by the frame's length.
  void transform() { build_fft.forward(re, im); }
  void back() {
    build_fft.inverse(re, im);
    for (int n = 0; n < kBuildFrame; ++n) re[n] *= 1.0f / kBuildFrame;
  }

  // Laid back down where it was cut from, a frame and half a hop later, on
  // top of whatever other frames lie there.
  void lay(int i) {
    for (int n = 0; n < kBuildFrame; ++n) sum[static_cast<uint32_t>(i + kBuildWait + n) & kBuildMask] += re[n];
  }

  // A window: the frame swells from nothing and dies back to nothing.
  void window() {
    for (int n = 0; n < kBuildFrame; ++n) re[n] *= hann[n];
  }

  // Hops: how far the window moves on before the next frame is cut. A whole
  // frame at first, so the frames lie end to end; then a quarter of one, so
  // every sample is in four.
  int hop() const { return pieces >= kHops ? kBuildHop : kBuildFrame; }

  // Overlap and add: the window a second time on the way out, and the scale
  // that makes the four squared windows over a sample add up to 1.
  void again() {
    const float scale = 8.0f / (3.0f * kBuildOverlap);
    for (int n = 0; n < kBuildFrame; ++n) re[n] *= hann[n] * scale;
  }

  // Change the bins: each one times a gain. The upper half of the bins
  // mirrors the lower, and is kept its mirror.
  void change(const float* gain) {
    for (int k = 0; k < kBuildBins; ++k) {
      re[k] *= gain[k];
      im[k] *= gain[k];
    }
    for (int k = 1; k < kBuildFrame / 2; ++k) {
      re[kBuildFrame - k] = re[k];
      im[kBuildFrame - k] = -im[k];
    }
  }

  // Where a frame stands on its way through run(): what the lab's pictures
  // of it are taken at.
  enum Stage : int { kAsCut, kAsBins, kAsChanged };

  // One sample through the pieces built so far, in the order it meets them.
  // On a sample a frame is cut at, `watch` is shown the frame three times:
  // as samples, as bins, and as the bins that go back.
  template <typename Watch>
  float run(int i, float x, const float* gain, Watch&& watch) {
    if (i % hop() == 0) {
      cut(i);
      if (pieces >= kWindow) window();
      watch(kAsCut);
      transform();
      watch(kAsBins);
      if (pieces >= kChange) change(gain);
      watch(kAsChanged);
      back();
      if (pieces >= kOverlapAdd) again();
      lay(i);
    }
    return pass(i, x);
  }

  // One sample into the ring the frames are cut from, and one out of what
  // the frames have laid down.
  float pass(int i, float x) {
    ring[static_cast<uint32_t>(i) & kBuildMask] = DeviceStft::guarded(x);
    const float y = sum[static_cast<uint32_t>(i) & kBuildMask];
    sum[static_cast<uint32_t>(i) & kBuildMask] = 0.0f;
    return y;
  }

  void start(int pieces_) {
    pieces = pieces_;
    for (float& sample : ring) sample = 0.0f;
    for (float& sample : sum) sample = 0.0f;
  }
};

lab::Build build{"One frame|A window|Hops|Overlap and add|Change the bins", Built::kChange, -130.0f,
                 "The frames as built, all five pieces, against what Glimmer's own frames add up to"};

Built shown;       // at the step the reader chose: what the built taps hold
Built held;        // with every piece: what is compared with the device
Built click_whole; // one unit sample through every piece
Built click_plain; // and with no window on the way out
float bin_gain[kBuildBins];  // Glimmer's gain for every bin of the frame in hand

// One unit sample into a second device at rest, and the stretch around the
// moment it comes out, a latency later: the frames' own sum (from the Stft's
// ring) and the device's output. Beside it the same sample goes through the
// build's pieces with the second device's gains: every piece, which is held
// to the device's frames, and every piece but the window on the way out.
void render_click() {
  constexpr uint32_t kMask = DeviceStft::kMask;
  constexpr int kLatency = DeviceStft::kLatency;
  constexpr int kClickAt = 4480;  // after two frames of silence, and not on a hop
  constexpr int kReach = DeviceStft::kFrame;  // a whole frame either side of where it comes out: as far as a frame reaches
  const int points = 2 * kReach + 1;
  if (!click_wet.open(points) || !click_out.open(points) || !click_bare.open(points)) return;
  click_wet.x0 = click_out.x0 = click_bare.x0 = -1000.0f * kReach / lab::kSampleRate;
  click_wet.x1 = click_out.x1 = click_bare.x1 = 1000.0f * kReach / lab::kSampleRate;
  float* whole = lab::take(points);
  configure(probe);
  click_whole.start(Built::kChange);
  click_plain.start(Built::kChange);
  const int first = kClickAt + kLatency - kReach;
  for (int i = 0; i < first + points; ++i) {
    const float sum = probe.stft_[0].output_[probe.stft_[0].position_ & kMask];
    const float x = i == kClickAt ? 1.0f : 0.0f;
    probe.in_left()[0] = probe.in_right()[0] = x;
    probe.process(1);
    if (i % kBuildHop == 0) {
      for (int k = 0; k < kBuildBins; ++k) bin_gain[k] = probe.asleep_ ? 1.0f : gain_of(probe, k);
      // No window on the way out: four windows over a sample add up to 2, so half of each frame.
      click_plain.cut(i);
      click_plain.window();
      click_plain.transform();
      click_plain.change(bin_gain);
      click_plain.back();
      for (float& sample : click_plain.re) sample *= 2.0f / kBuildOverlap;
      click_plain.lay(i);
    }
    const float rebuilt = click_whole.run(i, x, bin_gain, [](int) {});
    const float bare = click_plain.pass(i, x);
    if (i >= first) {
      click_wet.set(i - first, sum);
      click_out.set(i - first, probe.out_left()[0]);
      click_bare.set(i - first, bare);
      if (whole) whole[i - first] = rebuilt;
    }
  }
  if (whole) click_rebuilt.value = lab::difference_db(whole, click_wet.data, points);
}

// Runs the device over the loop and leaves its left output in `kept`.
void render_device(float* kept) {
  constexpr int kFrame = DeviceStft::kFrame;
  constexpr int kHop = DeviceStft::kHop;
  constexpr int kBins = DeviceStft::kBins;
  constexpr uint32_t kMask = DeviceStft::kMask;

  configure(device);
  reference.clear();
  for (int k = 0; k < kBins; ++k) reference_re[k] = reference_im[k] = earlier_re[k] = earlier_im[k] = 0.0f;

  const int columns = open_picture(gains, kHop, kBins);
  begin_columns(columns);

  // The build part: the chosen step, and the whole build that is held to the device.
  Built& front = build.at() == build.compared_step ? held : shown;
  front.start(build.at());
  held.start(build.compared_step);
  const int built_columns = open_picture(built_picture, front.hop(), kBuildBins);
  begin_columns(built_columns, built_filled);
  const bool pictured = built_frame.open(kBuildFrame) && built_bins.open(kBuildBins) && built_changed.open(kBuildBins);
  built_bins.x0 = built_changed.x0 = 0.0f;
  built_bins.x1 = built_changed.x1 = 0.5f * lab::kSampleRate;
  int wanted = static_cast<int>(at.value * lab::kSampleRate);
  if (wanted > lab::frames() - 1) wanted = lab::frames() - 1;
  int nearest = lab::frames();
  bool chosen = false;  // the frame in hand is the one under "Frame at"
  double built_apart = 0.0, built_whole = 0.0;

  float worst = 0.0f;
  float loudest_hz = 0.0f;
  float turning_hz = 0.0f;

  const int total = lab::total();
  const int first_kept = lab::frames();
  const float* source_left = lab::in(0);
  const float* source_right = lab::in(1);
  for (int i = 0, at_source = 0; i < total; ++i, ++at_source) {
    if (at_source == first_kept) at_source = 0;
    const float left = source_left[at_source];
    const float right = source_right[at_source];
    // What the device's two Stfts are about to return: the altered frames added up.
    const float wet_left = device.stft_[0].output_[device.stft_[0].position_ & kMask];
    const float wet_right = device.stft_[1].output_[device.stft_[1].position_ & kMask];
    device.in_left()[0] = left;
    device.in_right()[0] = right;
    device.process(1);
    const bool awake = !device.asleep_;

    // The same frame, unaltered, by the same class on the same samples.
    bool framed = false;
    reference.analyse(left, [&](const float* re, const float* im) {
      framed = true;
      for (int k = 0; k < kBins; ++k) {
        earlier_re[k] = reference_re[k];
        earlier_im[k] = reference_im[k];
        reference_re[k] = re[k];
        reference_im[k] = im[k];
      }
    });

    if (framed) {
      // The loudest bin, and the frequency its phase turned at since the frame before.
      int top = 1;
      float top_power = 0.0f;
      for (int k = 1; k < kBins - 1; ++k) {
        const float power = reference_re[k] * reference_re[k] + reference_im[k] * reference_im[k];
        if (power > top_power) {
          top_power = power;
          top = k;
        }
      }
      const float floor_power = 1.0e-8f * DeviceStft::kFullScale * DeviceStft::kFullScale;  // -80 dB
      if (top_power > floor_power) {
        const float now = kit::fast_atan2(reference_im[top], reference_re[top]);
        const float before = kit::fast_atan2(earlier_im[top], earlier_re[top]);
        loudest_hz = DeviceStft::bin_to_hz(static_cast<float>(top), lab::kSampleRate);
        turning_hz = DeviceStft::advance_to_hz(top, now - before, lab::kSampleRate);
      } else {
        loudest_hz = 0.0f;
        turning_hz = 0.0f;
      }

      const int column = column_of(i, kFrame, kHop, columns);
      if (column >= 0 && gains.data) {
        float* out = gains.data + column * kBins;
        for (int k = 0; k < kBins; ++k) {
          const float gain = awake ? device_gain(k) : 1.0f;
          out[k] = picture_db(gain * gain);
          // The bins the device left, against the bins it was handed: how far
          // the ratio of their powers stands from the gain squared.
          const float before = reference_re[k] * reference_re[k] + reference_im[k] * reference_im[k];
          if (awake && before > floor_power && gain > 1.0e-3f) {
            const float after = device.stft_[0].re_[k] * device.stft_[0].re_[k] + device.stft_[0].im_[k] * device.stft_[0].im_[k];
            const float off = after / (before * gain * gain) - 1.0f;
            worst = kit::max(worst, off < 0.0f ? -off : off);
          }
        }
        filled[column] = 1;
      }
    }

    // The build part, beside the device, on the same frames with the gains the
    // device has just worked out. Asleep, the device takes in silence.
    if (i % kBuildHop == 0) {
      for (int k = 0; k < kBuildBins; ++k) bin_gain[k] = awake ? device_gain(k) : 1.0f;
    }
    const float heard = awake ? left : 0.0f;
    // The first time round is only there to be dropped, and a frame reaches no
    // further than a frame and half a hop past where it was cut: until the
    // frames reach what is kept, the build only takes its samples in.
    const bool reaches = i >= first_kept - 2 * kBuildFrame;
    const auto watch = [&](int stage) {
      if (i < first_kept || i >= 2 * first_kept) return;
      if (stage == Built::kAsCut) {
        const int middle = middle_of(i, kBuildFrame);
        int distance = middle > wanted ? middle - wanted : wanted - middle;
        if (lab::frames() - distance < distance) distance = lab::frames() - distance;
        chosen = pictured && distance < nearest;
        if (!chosen) return;
        nearest = distance;
        const float start_seconds = static_cast<float>(middle - kBuildFrame / 2) / lab::kSampleRate;
        built_frame.x0 = start_seconds;
        built_frame.x1 = start_seconds + static_cast<float>(kBuildFrame - 1) / lab::kSampleRate;
        for (int n = 0; n < kBuildFrame; ++n) built_frame.set(n, front.re[n]);
        return;
      }
      if (chosen) {
        lab::Tap& tap = stage == Built::kAsBins ? built_bins : built_changed;
        const float scale = 1.0f / (DeviceStft::kFullScale * DeviceStft::kFullScale);
        for (int k = 0; k < kBuildBins; ++k) {
          tap.set(k, lab::power_to_db((front.re[k] * front.re[k] + front.im[k] * front.im[k]) * scale));
        }
      }
      if (stage == Built::kAsChanged) {
        write_column(built_picture, column_of(i, kBuildFrame, front.hop(), built_columns), front.re, front.im,
                     kBuildBins, DeviceStft::kFullScale, built_filled);
      }
    };
    const float so_far = reaches ? front.run(i, heard, bin_gain, watch) : front.pass(i, heard);
    float whole = so_far;
    if (&front != &held) whole = reaches ? held.run(i, heard, bin_gain, [](int) {}) : held.pass(i, heard);

    if (kept) kept[i] = device.out_left()[0];
    if (i < first_kept) continue;  // the first time round is only there to be dropped
    if (i < 2 * first_kept) {
      built_apart += (static_cast<double>(whole) - wet_left) * (static_cast<double>(whole) - wet_left);
      built_whole += static_cast<double>(wet_left) * wet_left;
    }
    built.put(i, so_far);
    in_tap.put(i, left, right);
    wet.put(i, wet_left, wet_right);
    out_tap.put(i, device.out_left()[0], device.out_right()[0]);
    if (i % lab::kControlPeriod == 0) {
      pass.put(i, device.meter(1));
      loudest.put(i, loudest_hz);
      turning.put(i, turning_hz);
    }
  }
  close_columns(gains, columns, kBins);
  gain_rebuilt.value = 10.0f * std::log10(1.0f + worst);  // the worst of them, in dB
  close_columns(built_picture, built_columns, kBuildBins, built_filled);
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  // Each frame's share of what comes back, over two frames' length of time,
  // and the shares added: the frames end to end or a hop apart, each as it is
  // cut, times the window, or times the window twice and the scale.
  constexpr int kPoints = 512;
  const int step = 2 * kBuildFrame / kPoints;
  const int overlap = kBuildFrame / front.hop();
  const int first = -(overlap - 1);  // the earliest frame that reaches into the stretch
  const int count = 3 * overlap - 1;
  if (built_windows.open(count * kPoints) && built_window_sum.open(kPoints)) {
    built_windows.columns = count;
    built_windows.x0 = built_window_sum.x0 = 0.0f;
    built_windows.x1 = built_window_sum.x1 = 1000.0f * static_cast<float>(2 * kBuildFrame - step) / lab::kSampleRate;
    for (int p = 0; p < kPoints; ++p) {
      float sum = 0.0f;
      for (int m = 0; m < count; ++m) {
        const int n = p * step - (first + m) * front.hop();  // where in frame m this instant is
        float share = 0.0f;
        if (n >= 0 && n < kBuildFrame) {
          share = front.pieces < Built::kWindow ? 1.0f : hann[n];
          if (front.pieces >= Built::kOverlapAdd) share *= hann[n] * 8.0f / (3.0f * kBuildOverlap);
        }
        built_windows.data[m * kPoints + p] = share;
        sum += share;
      }
      built_window_sum.set(p, sum);
    }
  }
}

// --- the kit's frames at the size the reader chose -----------------------------------------------

template <int Frame>
struct Frames {
  using Stft = kit::Stft<Frame, Frame / 4>;
  Stft plain;                 // overlap-add with nothing altered
  Stft looking;               // analysis only: the device's output
  kit::Fft<Frame> fft;        // the kit's plain transform, for the "transformed" check
  float ring[Frame] = {};     // overlap-add by hand: the last frame's worth of input
  float sum[2 * Frame] = {};  // and the frames added up, waiting to go out
  float cut[Frame] = {};      // the frame under "Frame at", as cut
  float re[Frame] = {};
  float im[Frame] = {};
  float seen_re[Frame / 2 + 1] = {};  // the bins the kit handed over for it
  float seen_im[Frame / 2 + 1] = {};
};

Frames<512> frames_512;
Frames<1024> frames_1024;
Frames<2048> frames_2048;
Frames<4096> frames_4096;

template <int Frame>
void render_frames(Frames<Frame>& f, const float* device_out) {
  using Stft = typename Frames<Frame>::Stft;
  constexpr int kHop = Stft::kHop;
  constexpr int kBins = Stft::kBins;
  constexpr int kLatency = Stft::kLatency;
  constexpr uint32_t kMask = Stft::kMask;
  const int frames = lab::frames();
  const int total = lab::total();

  f.plain.clear();
  f.looking.clear();
  for (int n = 0; n < Frame; ++n) f.ring[n] = f.cut[n] = 0.0f;
  for (int n = 0; n < 2 * Frame; ++n) f.sum[n] = 0.0f;

  const int columns = open_picture(picture, kHop, kBins);
  open_picture(picture_out, kHop, kBins);

  // The frame the reader looks at: the one whose middle is nearest "Frame at".
  int wanted = static_cast<int>(at.value * lab::kSampleRate);
  if (wanted > frames - 1) wanted = frames - 1;
  int nearest = frames;
  int cut_middle = 0;

  // Overlap-add by hand: frames every `own_hop`, each times the window twice,
  // with the kit's scale for as many frames as cover a sample.
  const int overlap = 2 << hop.choice();  // 2, 4 or 8 frames over any one sample
  const int own_hop = Frame / overlap;
  const float own_scale = 8.0f / (3.0f * static_cast<float>(overlap));

  double null_diff = 0.0, null_ref = 0.0, hand_diff = 0.0, hand_ref = 0.0;

  const float* source = lab::in(0);
  begin_columns(columns);
  for (int i = 0, at_source = 0; i < total; ++i, ++at_source) {
    if (at_source == frames) at_source = 0;
    const float x = source[at_source];
    const float y = f.plain.process(x, [&](float* re, float* im) {
      write_column(picture, column_of(i, Frame, kHop, columns), re, im, kBins, Stft::kFullScale);
      if (i < frames || i >= 2 * frames) return;
      const int middle = middle_of(i, Frame);
      int distance = middle > wanted ? middle - wanted : wanted - middle;
      if (frames - distance < distance) distance = frames - distance;
      if (distance >= nearest) return;
      nearest = distance;
      cut_middle = middle;
      // The frame is the last `Frame` samples the kit took in, still in its ring.
      const uint32_t start = f.plain.position_ - Frame;
      for (int n = 0; n < Frame; ++n) f.cut[n] = f.plain.input_[(start + static_cast<uint32_t>(n)) & kMask];
      for (int k = 0; k < kBins; ++k) {
        f.seen_re[k] = re[k];
        f.seen_im[k] = im[k];
      }
    });

    // By hand. With nothing altered the transform and its inverse undo one
    // another, so a frame comes back as itself: times the window going in,
    // times the window coming out, added where it came from.
    if (i % own_hop == 0) {
      for (int n = 0; n < Frame; ++n) {
        const float sample = f.ring[(i + n) & (Frame - 1)];  // oldest first
        const float twice = f.plain.window_[n] * f.plain.window_[n];
        f.sum[(i + Stft::kMaxStagger + n) & (2 * Frame - 1)] += sample * twice * own_scale;
      }
    }
    f.ring[i & (Frame - 1)] = Stft::guarded(x);
    const float hand = f.sum[i & (2 * Frame - 1)];
    f.sum[i & (2 * Frame - 1)] = 0.0f;

    if (i < frames) continue;  // the first time round is only there to be dropped
    through.put(i, y);
    added.put(i, hand);

    if (i < 2 * frames && i >= kLatency) {
      const double was = lab::in_at(0, i - kLatency);
      null_diff += (y - was) * (y - was);
      null_ref += was * was;
      hand_diff += (static_cast<double>(hand) - y) * (static_cast<double>(hand) - y);
      hand_ref += static_cast<double>(y) * y;
    }
  }
  close_columns(picture, columns, kBins);
  returned.value = lab::ratio_db(null_diff, null_ref);
  by_hand.value = lab::ratio_db(hand_diff, hand_ref);

  // The device's output through the same transform.
  begin_columns(columns);
  for (int i = 0; i < total; ++i) {
    f.looking.analyse(device_out ? device_out[i] : 0.0f, [&](const float* re, const float* im) {
      write_column(picture_out, column_of(i, Frame, kHop, columns), re, im, kBins, Stft::kFullScale);
    });
  }
  close_columns(picture_out, columns, kBins);

  // The frame under "Frame at": as cut, the window, and the two multiplied.
  if (frame_raw.open(Frame) && window_tap.open(Frame) && frame_tap.open(Frame) && bins.open(kBins)) {
    const float start_seconds = static_cast<float>(cut_middle - Frame / 2) / lab::kSampleRate;
    frame_raw.x0 = window_tap.x0 = frame_tap.x0 = start_seconds;
    frame_raw.x1 = window_tap.x1 = frame_tap.x1 = start_seconds + static_cast<float>(Frame - 1) / lab::kSampleRate;
    const float height = lab::peak(f.cut, Frame);
    for (int n = 0; n < Frame; ++n) {
      frame_raw.set(n, f.cut[n]);
      window_tap.set(n, f.plain.window_[n] * (height > 0.0f ? height : 1.0f));
      f.re[n] = f.cut[n] * f.plain.window_[n];
      f.im[n] = 0.0f;
      frame_tap.set(n, f.re[n]);
    }
    bins.x0 = 0.0f;
    bins.x1 = 0.5f * lab::kSampleRate;
    for (int k = 0; k < kBins; ++k) {
      const float power = f.seen_re[k] * f.seen_re[k] + f.seen_im[k] * f.seen_im[k];
      bins.set(k, lab::power_to_db(power / (Stft::kFullScale * Stft::kFullScale)));
    }
    // The lesson's product through the kit's plain transform, against the kit's bins.
    f.fft.forward(f.re, f.im);
    double diff = 0.0, ref = 0.0;
    for (int k = 0; k < kBins; ++k) {
      const double dr = static_cast<double>(f.re[k]) - f.seen_re[k];
      const double di = (k == 0 || k == Frame / 2) ? 0.0 : static_cast<double>(f.im[k]) - f.seen_im[k];
      diff += dr * dr + di * di;
      ref += static_cast<double>(f.seen_re[k]) * f.seen_re[k] + static_cast<double>(f.seen_im[k]) * f.seen_im[k];
    }
    transformed.value = lab::ratio_db(diff, ref);
  }

  // The windows of the frames that lie over two frames' length of time, each
  // squared (in and out), and all of them added with the scale above.
  constexpr int kPoints = 512;
  const int step = 2 * Frame / kPoints;
  const int first = -(overlap - 1);  // the earliest frame that reaches into the stretch
  const int count = 3 * overlap - 1;
  if (windows.open(count * kPoints) && window_sum.open(kPoints)) {
    windows.columns = count;
    windows.x0 = window_sum.x0 = 0.0f;
    windows.x1 = window_sum.x1 = 1000.0f * static_cast<float>(2 * Frame - step) / lab::kSampleRate;
    for (int p = 0; p < kPoints; ++p) {
      float sum = 0.0f;
      for (int m = 0; m < count; ++m) {
        const int n = p * step - (first + m) * own_hop;  // where in frame m this instant is
        const float w = n >= 0 && n < Frame ? f.plain.window_[n] : 0.0f;
        windows.data[m * kPoints + p] = w * w;
        sum += w * w;
      }
      window_sum.set(p, sum * own_scale);
    }
  }
}

}  // namespace

void lab_setup() {
  reference.init();
  build_fft.init();
  for (int n = 0; n < kBuildFrame; ++n) hann[n] = reference.window_[n];
  frames_512.plain.init();
  frames_512.looking.init();
  frames_512.fft.init();
  frames_1024.plain.init();
  frames_1024.looking.init();
  frames_1024.fft.init();
  frames_2048.plain.init();
  frames_2048.looking.init();
  frames_2048.fft.init();
  frames_4096.plain.init();
  frames_4096.looking.init();
  frames_4096.fft.init();
}

void lab_render(int frames) {
  (void)frames;
  float* kept = lab::take(lab::total());
  render_device(kept);
  render_click();
  switch (size.choice()) {
    case 0:
      render_frames(frames_512, kept);
      break;
    case 1:
      render_frames(frames_1024, kept);
      break;
    case 3:
      render_frames(frames_4096, kept);
      break;
    default:
      render_frames(frames_2048, kept);
      break;
  }
}
