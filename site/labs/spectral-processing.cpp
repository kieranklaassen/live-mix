// Spectral processing: what is done to the bins between the way in and the
// way out. Three of the engine's devices run on the loop, one sample at a
// time, and each is read as it runs.
//
//   in ─┬─► Spectral Blur: frames ─► sizes and angles ─► hold, fall, turn, smear,
//       │                            octave, gain per bin ─► frames added ─► limit ─► mix ─► out
//       ├─► Sift: frames ─► nine kept ─► a share of every bin ─► frames added ─► sifted
//       └─► Sustain: caught at one moment ─► regions turned every hop ─► frames added ─► sustained
//
// Read from Spectral Blur (cpp/devices/spectral-blur): the sizes of the frame
// it had in hand at "Frame at", the sizes it holds two seconds later and
// the sizes that come in then, one bin's size coming in and as held, the
// frequency that bin comes in at and goes out at (the kit's arithmetic on the
// device's own angles), its reading of how much of a band is held, its gain
// for every bin, what its frames add up to before the limiter, and its
// output. Freeze is switched on in the device just after the frame at "Frame
// at" has been taken, in every pass of the loop, and off where the loop
// starts again, so that the frame it holds is the one the bars show.
//
// Read from Sift (cpp/devices/sift): the frame it split at "Frame at", its two
// readings of every bin, the share it gave the part that is kept, and its
// output. Read from Sustain (cpp/devices/sustainer): its output, with Hold
// switched on at "Frame at".
//
// Written for the lesson: one frame of the wave repeated end to end
// ("looped"), and the frame laid down again and again with its bins exactly
// as they were, angles and all ("stuck"). Neither is in the engine. The
// repeated frame is the build's second step worked out without a transform,
// and the lab's test holds the two together. Each of the two has a spectrum
// of its own beside it, from one long transform, fine enough to show its
// lines ("linesLooped", "linesStuck", and "linesIn" for the input). The windows of the frames that lie over a
// stretch of time, each squared, and their sum, are worked out from the
// device's own window table. And the bins as they go back into the inverse
// transform ("sent") are the build's, with every piece: the device transforms
// them where they lie and keeps no copy.
//
// The build part puts Spectral Blur's frame together a piece at a time, on a
// path of its own beside the device (lab::Build in lab.h): one channel, the
// left. It has seven pieces, each a function of `Built` below, in the order
// the steps add them: a frame split into sizes and angles and joined again;
// the sizes held while Freeze is on; the turn of every bin measured and kept
// up; the random angle of Smear; the fall of Blur; the octave of Shimmer; and
// the gain for every bin of Tilt and the cuts. Two copies of it run: one at
// the step the reader chose, which is what the "built" taps show, and one with
// every piece, compared on every render with what the device's own left
// frames add up to (the "builtDifference" check). The build runs on the
// device's clock: where the device sleeps through a silence, so does the
// build.
//
// A loop is rendered twice and only the second pass is kept (lab.h). Sift and
// Sustain, whose memory is short at these settings, and the build sit out
// most of the first pass; each says where it starts.

#include "lab.h"

#include <cstring>

#include "../../cpp/kit/stft.h"
#include "../../cpp/devices/spectral-blur/spectral_blur.h"
#include "../../cpp/devices/sift/sift.h"
#include "../../cpp/devices/sustainer/sustainer.h"

using namespace livemix;

namespace {

// --- controls ----------------------------------------------------------------------------------

lab::Control at{"at", "Frame at", "s", 0.0f, 4.0f, 0.3f};
lab::Control freeze{"freeze", "Freeze", "", 0.0f, 1.0f, 1.0f, lab::kLinear, "Off|On"};
lab::Control blur{"blur", "Blur", "", 0.0f, 1.0f, 0.0f};
lab::Control smear{"smear", "Smear", "", 0.0f, 1.0f, 0.0f};
lab::Control shimmer{"shimmer", "Shimmer", "", 0.0f, 1.0f, 0.0f};
lab::Control tilt{"tilt", "Tilt", "dB/oct", -6.0f, 6.0f, 0.0f};
lab::Control low_cut{"lowCut", "Low Cut", "Hz", 20.0f, 2000.0f, 20.0f, lab::kLog};
lab::Control high_cut{"highCut", "High Cut", "Hz", 500.0f, 20000.0f, 20000.0f, lab::kLog};
lab::Control width{"width", "Width", "", 0.0f, 1.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};
lab::Control keep{"keep", "Keep", "", 0.0f, 3.0f, 1.0f, lab::kLinear, "Everything|Tones|Attacks|Air"};
lab::Control sharpness{"sharpness", "Sharpness", "", 0.0f, 1.0f, 0.5f};
lab::Control edge{"edge", "Edge", "", 0.0f, 1.0f, 0.0f};
lab::Control motion{"motion", "Motion", "", 0.0f, 1.0f, 0.0f};

// --- taps --------------------------------------------------------------------------------------

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap picture{"picture", "Every frame's spectrum, of the input", lab::kFrames, lab::kKit, 1, "dB"};
lab::Tap looped{"looped", "One frame of the wave, repeated end to end", lab::kAudio, lab::kLesson, 1};
lab::Tap stuck{"stuck", "One frame's bins repeated, angles and all", lab::kAudio, lab::kLesson, 1};
lab::Tap lines_in{"linesIn", "The input's spectrum", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap lines_looped{"linesLooped", "The repeated slice's spectrum", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap lines_stuck{"linesStuck", "The repeated frame's spectrum", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap caught{"caught", "The picked frame, bin by bin", lab::kCurve, lab::kDevice, 1};
lab::Tap later{"later", "The bins coming in two seconds later", lab::kCurve, lab::kDevice, 1};
lab::Tap held{"held", "What the bins hold two seconds later", lab::kCurve, lab::kDevice, 1};
lab::Tap sent{"sent", "The bins as they go back, two seconds later", lab::kCurve, lab::kLesson, 1};
lab::Tap bin_in{"binIn", "One bin, coming in", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap bin_held{"binHeld", "The same bin, as held", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap pitch_in{"pitchIn", "The frequency that bin comes in at", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap pitch_out{"pitchOut", "The frequency it goes out at", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap hang{"hang", "Held share, 200 to 630 Hz", lab::kControl, lab::kDevice, 1};
lab::Tap shape_tap{"shape", "The gain for every bin", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap windows{"windows", "Each frame's two windows, multiplied", lab::kFrames, lab::kLesson, 1};
lab::Tap window_sum{"windowSum", "All of them added", lab::kCurve, lab::kLesson, 1};
lab::Tap wet{"wet", "The frames, added up", lab::kAudio, lab::kDevice, 2};
lab::Tap gate_sizes{"gateSizes", "The bins of the frame Sift splits", lab::kCurve, lab::kDevice, 1};
lab::Tap gate_steady{"gateSteady", "Each bin's steady reading", lab::kCurve, lab::kDevice, 1};
lab::Tap gate_sudden{"gateSudden", "Each bin's sudden reading", lab::kCurve, lab::kDevice, 1};
lab::Tap gate_share{"gateShare", "The share of each bin that is kept", lab::kCurve, lab::kDevice, 1};
lab::Tap gate_kept{"gateKept", "The bins that go on", lab::kCurve, lab::kDevice, 1};
lab::Tap sifted{"sifted", "Sift's output", lab::kAudio, lab::kDevice, 2};
lab::Tap sustained{"sustained", "Sustain's output", lab::kAudio, lab::kDevice, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap picture_out{"pictureOut", "Every frame's spectrum, of the output", lab::kFrames, lab::kKit, 1, "dB"};
lab::Tap picture_sifted{"pictureSifted", "Every frame's spectrum, of what Sift keeps", lab::kFrames, lab::kKit, 1, "dB"};

// --- the build part's taps -----------------------------------------------------------------------

lab::Tap built{"built", "The frames so far, added up", lab::kAudio, lab::kLesson, 1};
lab::Tap built_sent{"builtSent", "The bins the build sends back, two seconds later", lab::kCurve, lab::kLesson, 1};
lab::Tap built_angles{"builtAngles", "The angle each of them goes back at", lab::kCurve, lab::kLesson, 1, "turns"};
lab::Tap built_bin{"builtBin", "One bin, as the build holds it", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_pitch{"builtPitch", "The frequency the build sends it out at", lab::kControl, lab::kLesson, 1, "Hz"};

// --- sizes shared by the device and the build ------------------------------------------------------

using Blur = SpectralBlur;
using Frames = kit::Stft<Blur::kFrame, Blur::kHop>;  // for its arithmetic on bins and angles only

constexpr int kFrame = Blur::kFrame;  // 2,048 samples
constexpr int kHop = Blur::kHop;      // a quarter of it
constexpr int kHalf = kFrame / 2;
constexpr int kBins = kHalf + 1;
constexpr int kRing = Blur::kRing;
constexpr uint32_t kMask = Blur::kRingMask;
constexpr float kFull = Frames::kFullScale;  // the size of a bin a full-scale sine lies on: 512
constexpr int kBars = 65;                    // the bins the bar pictures show: 0 to 64, 0 Hz to 1.5 kHz
constexpr int kLaterSamples = 96000;         // two seconds
constexpr float kQuiet = 1.0e-4f * kFull;    // -80 dB: under this a bin's frequency is not read

Blur device;
Sift gate;
Sustainer sustain;

kit::Fft<kFrame> build_fft;  // the kit's transform, for the build's frames
float hann[kFrame];          // the device's own window table, copied in lab_setup
float octave[kBins];         // octaves from 1 kHz, per bin, as the device works them out

float to_bar(float size) { return size * (1.0f / kFull); }

// A spectrum fine enough to tell the lines of part 1 apart: the last 32,768
// samples of the loop through a Hann window and one transform of the kit's,
// a point every 1.46 Hz from 0 Hz to 1 kHz, in dB where a full-scale sine
// reads 0. The page's ordinary spectrum averages frames of 4,096 samples,
// whose points stand 11.7 Hz apart, and lines 23.4 Hz apart run together in it.
constexpr int kLong = 32768;
constexpr int kLines = 684;  // 0 Hz to 1,000.5 Hz
kit::Fft<kLong> long_fft;
float long_re[kLong];
float long_im[kLong];
bool long_ready = false;

void fine_spectrum(lab::Tap& tap, const float* x, int frames) {
  if (!tap.open(kLines)) return;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(kLines - 1) * lab::kSampleRate / kLong;
  if (x == nullptr || frames < kLong) {
    for (int k = 0; k < kLines; ++k) tap.set(k, lab::kFloorDb);
    return;
  }
  if (!long_ready) {
    long_fft.init();
    long_ready = true;
  }
  const float* last = x + (frames - kLong);
  for (int n = 0; n < kLong; ++n) {
    const float window = 0.5f - 0.5f * static_cast<float>(std::cos(2.0 * lab::kPi * n / kLong));
    long_re[n] = last[n] * window;
    long_im[n] = 0.0f;
  }
  long_fft.forward(long_re, long_im);
  // A Hann window passes half of a sine's amplitude, half of it in this bin
  // and half in its mirror: a quarter of the length for a full-scale sine.
  const float full = (0.25f * kLong) * (0.25f * kLong);
  for (int k = 0; k < kLines; ++k) {
    tap.set(k, lab::power_to_db((long_re[k] * long_re[k] + long_im[k] * long_im[k]) / full));
  }
}

void open_bars(lab::Tap& tap) {
  if (!tap.open(kBars)) return;
  tap.x0 = 0.0f;
  tap.x1 = Frames::bin_to_hz(static_cast<float>(kBars - 1), lab::kSampleRate);
}

// The frequency a bin sounds at, from how far its angle turned between two
// frames a hop apart: the kit's arithmetic (cpp/kit/stft.h).
float turned_hz(int bin, float re, float im, float before_re, float before_im) {
  const float advance = kit::fast_atan2(im, re) - kit::fast_atan2(before_im, before_re);
  return Frames::advance_to_hz(bin, advance, lab::kSampleRate);
}

// --- the build part: one frame of Spectral Blur, a piece at a time -----------------------------------

// What the device read from its controls for the frame in hand.
struct Settings {
  bool freeze;    // Freeze is on
  float blur;     // Blur, 0 to 1
  float smear;    // Smear, 0 to 1
  float shimmer;  // Shimmer, 0 to 1
  uint32_t frame; // the number of the frame, which seeds its random angles
};

float bin_gain[kBins];  // the gain for every bin, from Tilt and the two cuts

// The gain for every bin: Tilt leans the spectrum about 1 kHz, so many dB an
// octave, and each cut is a step half an octave wide.
void shape_bins(float tilt_db, float low_hz, float high_hz) {
  using namespace spectral_blur;
  const bool low_on = low_hz > kParamMin[kLowCut] * 1.02f;
  const bool high_on = high_hz < kParamMax[kHighCut] * 0.98f;
  const float low_octave = std::log2(low_hz / Blur::kTiltPivotHz);
  const float high_octave = std::log2(high_hz / Blur::kTiltPivotHz);
  for (int k = 0; k < kBins; ++k) {
    const float db = kit::clamp(tilt_db * octave[k], -60.0f, Blur::kMaxTiltBoostDb);
    float gain = tilt_db == 0.0f ? 1.0f : std::exp(db * 0.11512925f);
    if (low_on) {
      const float x = k == 0 ? 0.0f : kit::clamp((octave[k] - low_octave) * 2.0f + 0.5f, 0.0f, 1.0f);
      gain *= x * x * (3.0f - 2.0f * x);
    }
    if (high_on) {
      const float x = kit::clamp((high_octave - octave[k]) * 2.0f + 0.5f, 0.0f, 1.0f);
      gain *= x * x * (3.0f - 2.0f * x);
    }
    bin_gain[k] = gain;
  }
}

// The frame so far: one function a piece, and frame() to take one frame
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kSplit = 0, kHold, kTurn, kSmear, kFall, kOctave, kShape };

  int pieces = kSplit;
  float ring[kRing] = {};     // what came in
  float sum[kRing] = {};      // the frames laid back down, waiting to go out
  float re[kFrame] = {};      // the frame in hand: samples, then bins, then samples again
  float im[kFrame] = {};
  float in_re[kBins] = {};    // each bin as it came in
  float in_im[kBins] = {};
  float level[kBins] = {};    // its size
  float unit_re[kBins] = {};  // its angle, as a vector one unit long
  float unit_im[kBins] = {};
  float size[kBins] = {};     // the size the bin holds
  float fallen[kBins] = {};   // what it held before this frame, after its fall
  bool driven[kBins] = {};    // the input reaches what the bin holds
  float angle_re[kBins] = {}; // the angle the bin goes out at, as a unit vector
  float angle_im[kBins] = {};
  float turn_re[kBins] = {};  // how far its angle turns from one frame to the next
  float turn_im[kBins] = {};
  float last_re[kBins] = {};  // the bin as it came in one frame ago
  float last_im[kBins] = {};
  float out[kBins] = {};      // the size it goes out at
  float* watch = nullptr;     // where the lab wants the sizes of the bins that go back, for a picture

  // Analyse: the newest 2,048 samples times the window, as 1,025 bins. The
  // kit's transform of a real signal packs the imaginary parts from the top
  // of `re` down.
  void analyse(uint32_t now) {
    const uint32_t start = now - kFrame;
    const float* input = ring;
    build_fft.forward_real([input, start](int n) { return input[(start + n) & kMask] * hann[n]; }, re);
    for (int k = 0; k < kBins; ++k) {
      in_re[k] = re[k];
      in_im[k] = (k == 0 || k == kHalf) ? 0.0f : re[kFrame - k];
    }
  }

  // Sizes and angles: a bin is a vector. Its length is its size, and the
  // vector over its length, which is one unit long, is its angle.
  void measure() {
    for (int k = 0; k < kBins; ++k) {
      level[k] = std::sqrt(in_re[k] * in_re[k] + in_im[k] * in_im[k]);
      const float inverse = level[k] > 1.0e-12f ? 1.0f / level[k] : 0.0f;
      unit_re[k] = level[k] > 1.0e-12f ? in_re[k] * inverse : 1.0f;
      unit_im[k] = level[k] > 1.0e-12f ? in_im[k] * inverse : 0.0f;
    }
  }

  // Join: size times angle is a bin again. The two gains undo what random
  // angles cost in level where four frames overlap.
  void join(float driven_gain, float held_gain) {
    for (int k = 0; k < kBins; ++k) {
      out[k] = size[k] * (driven[k] ? driven_gain : held_gain);
      re[k] = out[k] * angle_re[k];
      im[k] = out[k] * angle_im[k];
    }
  }

  // Rebuild: the upper half of the bins mirrors the lower, the kit's
  // transform runs backwards, and the frame is windowed a second time and
  // added where it came from, a frame and half a hop late. Four frames lie
  // over every sample and their squared windows add up to 1.5; the inverse
  // transform is unscaled, which is the 2,048.
  void rebuild(uint32_t now) {
    im[0] = 0.0f;
    im[kHalf] = 0.0f;
    for (int k = 1; k < kHalf; ++k) {
      re[kFrame - k] = re[k];
      im[kFrame - k] = -im[k];
    }
    build_fft.inverse(re, im);
    const uint32_t out_start = now + Blur::kStagger;
    for (int n = 0; n < kFrame; ++n) sum[(out_start + n) & kMask] += re[n] * hann[n] * (1.0f / (1.5f * kFrame));
  }

  // What each bin holds. A bin is driven while the input reaches what it
  // holds, and then it follows the input, at once or by a share of the way.
  // A bin that is not driven keeps its size, less the fall. With no fall
  // every bin is driven; with Freeze none is.
  void hold(bool frozen, float fall, float rise) {
    for (int k = 0; k < kBins; ++k) {
      float kept = size[k] * fall;
      fallen[k] = kept;
      driven[k] = !frozen && level[k] >= kept;
      if (driven[k]) kept += rise * (level[k] - kept);
      if (kept < Blur::kMagnitudeFloor) kept = 0.0f;
      size[k] = kept;
    }
  }

  // The turn: this frame's bin times the conjugate of the last one's is a
  // vector whose angle is how far the bin turned in one hop. Measured only
  // while the bin's input is holding up.
  void measure_turn() {
    for (int k = 0; k < kBins; ++k) {
      const float xr = in_re[k], xi = in_im[k];
      const float lr = last_re[k], li = last_im[k];
      if (level[k] > 0.1f * fallen[k] && xr * xr + xi * xi >= 0.8f * (lr * lr + li * li)) {
        const float tr = xr * lr + xi * li;
        const float ti = xi * lr - xr * li;
        if (tr * tr + ti * ti > 1.0e-24f) {
          turn_re[k] = tr;
          turn_im[k] = ti;
        }
      }
    }
  }

  // Angles: a driven bin goes out at the angle it came in at. A held bin has
  // no input to take one from: it keeps the angle it went out at last, turned
  // on by its turn once that is measured.
  void angles() {
    for (int k = 0; k < kBins; ++k) {
      float pr = angle_re[k];
      float pi = angle_im[k];
      if (driven[k]) {
        pr = unit_re[k];
        pi = unit_im[k];
      } else if (pieces >= kTurn) {
        float tr = turn_re[k];
        float ti = turn_im[k];
        const float length = tr * tr + ti * ti;
        if (length < 0.999f || length > 1.001f) {
          const float inverse = 1.0f / std::sqrt(length);
          tr *= inverse;
          ti *= inverse;
          turn_re[k] = tr;
          turn_im[k] = ti;
        }
        const float turned = angle_re[k] * tr - angle_im[k] * ti;
        pi = angle_re[k] * ti + angle_im[k] * tr;
        pr = turned;
        const float keep = 1.5f - 0.5f * (pr * pr + pi * pi);  // back to unit length
        pr *= keep;
        pi *= keep;
      }
      angle_re[k] = pr;
      angle_im[k] = pi;
      last_re[k] = in_re[k];
      last_im[k] = in_im[k];
    }
  }

  // Smear: every bin's angle is turned by a random amount, up to half a turn
  // either way at Smear 1. A driven bin starts from the input's angle each
  // frame; a held bin's angles add up, and it wanders. While Freeze is on the
  // held bins get at least a little of it.
  void scatter(const Settings& s, float held_smear) {
    kit::Rng random;
    random.seed(0x9E3779B9u ^ (s.frame * 2654435761u));
    for (int warm = 0; warm < 4; ++warm) random.next_u32();
    const float driven_steps = 0.5f * s.smear * Blur::kAngles;
    const float held_steps = 0.5f * held_smear * Blur::kAngles;
    for (int k = 0; k < kBins; ++k) {
      const float angle = random.bipolar();
      const float steps = angle * (driven[k] ? driven_steps : held_steps);
      const int index = static_cast<int>(steps + static_cast<float>(Blur::kAngles)) & (Blur::kAngles - 1);
      const float qr = device.angle_cos_[index];
      const float qi = device.angle_sin_[index];
      const float rotated = angle_re[k] * qr - angle_im[k] * qi;
      angle_im[k] = angle_re[k] * qi + angle_im[k] * qr;
      angle_re[k] = rotated;
    }
  }

  // Shimmer: bin 2a takes bin a's size and twice its angle, which is a's
  // unit vector squared. The odd bins between take two neighbours' product.
  void octave_up(float amount) {
    const float* ur = angle_re;
    const float* ui = angle_im;
    for (int a = 1; 2 * a <= kHalf; ++a) {
      const float even = amount * out[a];
      re[2 * a] += even * (ur[a] * ur[a] - ui[a] * ui[a]);
      im[2 * a] += even * (2.0f * ur[a] * ui[a]);
      if (2 * a + 1 > kHalf) break;
      const float odd = amount * std::sqrt(out[a] * out[a + 1]);
      re[2 * a + 1] += odd * (ur[a] * ur[a + 1] - ui[a] * ui[a + 1]);
      im[2 * a + 1] += odd * (ur[a] * ui[a + 1] + ui[a] * ur[a + 1]);
    }
  }

  // A gain for every bin.
  void shape() {
    for (int k = 0; k < kBins; ++k) {
      re[k] *= bin_gain[k];
      im[k] *= bin_gain[k];
    }
  }

  // One frame through the pieces built so far, in the order it meets them.
  void frame(uint32_t now, const Settings& s) {
    analyse(now);
    measure();

    const bool frozen = pieces >= kHold && s.freeze;
    const float seconds = Blur::kMaxDecaySeconds * s.blur * s.blur * s.blur;  // 60 dB down after this long
    float fall = 0.0f;
    float rise = 1.0f;
    if (pieces >= kFall) {
      fall = seconds > 0.0f ? std::exp(-6.9077553f * kHop / (seconds * lab::kSampleRate)) : 0.0f;
      rise = 1.0f - Blur::kAttackSoftening * s.blur;
    }
    hold(frozen, frozen ? 1.0f : fall, rise);

    if (pieces >= kTurn) measure_turn();
    angles();

    float driven_gain = 1.0f;
    float held_gain = 1.0f;
    if (pieces >= kSmear) {
      const float held_smear = frozen ? kit::max(s.smear, Blur::kFreezeDrift) : s.smear;
      if (held_smear > 0.0f) scatter(s, held_smear);
      const float c_driven = Blur::sinc(s.smear);
      driven_gain = 1.0f / std::sqrt(c_driven * c_driven + 0.25f * (1.0f - c_driven * c_driven));
      const float c_held = Blur::sinc(held_smear);
      const float held_full = std::sqrt(6.0f / (1.5f + 2.0f * c_held + 0.5f * c_held * c_held));
      held_gain = 1.0f + (held_full - 1.0f) * kit::min(1.0f, held_smear * 20.0f);
    }
    join(driven_gain, held_gain);

    if (pieces >= kOctave && s.shimmer > 0.0f) octave_up(s.shimmer);
    if (pieces >= kShape) shape();
    if (watch) {
      for (int k = 0; k < kBars; ++k) watch[k] = to_bar(std::sqrt(re[k] * re[k] + im[k] * im[k]));
    }
    rebuild(now);
  }

  // One sample in, and one out of what the frames have laid down. The
  // device keeps what comes in within ±64.
  float pass(uint32_t now, float x) {
    ring[now & kMask] = (x > -64.0f && x < 64.0f) ? x : 0.0f;
    const float y = sum[now & kMask];
    sum[now & kMask] = 0.0f;
    return y;
  }

  // The first time round the loop is only there to be dropped, so the build
  // sits most of it out, and then takes over what the device has by then:
  // the samples that came in, what each bin holds, and the frames still on
  // their way out. A step with pieces missing lets go of what it does not
  // use within a frame or two, as long as it is not holding a frame; so a
  // step that holds one differently from the device starts before the frame
  // is caught, and the others two frames before what is kept.
  void adopt(const Blur::Channel& channel) {
    for (int i = 0; i < kRing; ++i) {
      ring[i] = channel.input[i];
      sum[i] = channel.output[i];
    }
    for (int k = 0; k < kBins; ++k) {
      size[k] = channel.magnitude[k];
      angle_re[k] = channel.phase_re[k];
      angle_im[k] = channel.phase_im[k];
      turn_re[k] = channel.turn_re[k];
      turn_im[k] = channel.turn_im[k];
      last_re[k] = channel.last_re[k];
      last_im[k] = channel.last_im[k];
    }
  }

  void start(int pieces_) {
    pieces = pieces_;
    for (float& sample : ring) sample = 0.0f;
    for (float& sample : sum) sample = 0.0f;
    for (int k = 0; k < kBins; ++k) {
      size[k] = 0.0f;
      angle_re[k] = 1.0f;
      angle_im[k] = 0.0f;
      // Until measured, a bin turns by its centre frequency: k quarter turns.
      turn_re[k] = Blur::kQuarterTurn[k & 3][0];
      turn_im[k] = Blur::kQuarterTurn[k & 3][1];
      last_re[k] = 0.0f;
      last_im[k] = 0.0f;
    }
  }
};

lab::Build build{"Sizes and angles|Hold a frame|Keep the bins turning|Smear the angles|Let the sizes fall|"
                 "An octave above|A gain for every bin",
                 Built::kShape, -100.0f,
                 "The frames as built, all seven pieces, against what Spectral Blur's own left frames add up to"};

Built shown;  // at the step the reader chose: what the built taps hold
Built whole;  // with every piece: what is compared with the device

// --- Spectral Blur, one sample at a time, and the build beside it -----------------------------------

// A sample of the left source by its place in the loop, whatever its sign.
float source_at(int index) {
  const int frames = lab::frames();
  return lab::in(0)[((index % frames) + frames) % frames];
}

// The sample the frame at "Frame at" has its middle on, kept clear of the
// loop's end by `room` samples so that the frame is whole within one pass.
int wanted_sample(int room) {
  const int last = lab::frames() - room;
  const int wanted = static_cast<int>(at.value * lab::kSampleRate);
  return wanted > last ? (last > 0 ? last : 0) : wanted;
}

float stuck_frame[kFrame];  // the last frame taken while Freeze was off, windowed
float stuck_sum[kRing];     // and laid down again, frame after frame

void render_blur() {
  using namespace spectral_blur;
  const int frames = lab::frames();
  const int total = lab::total();

  device.init(lab::kSampleRate);
  device.set_param(kBlur, blur.value);
  device.set_param(kSmear, smear.value);
  device.set_param(kFreeze, 0.0f);
  device.set_param(kTilt, tilt.value);
  device.set_param(kLowCut, low_cut.value);
  device.set_param(kHighCut, high_cut.value);
  device.set_param(kShimmer, shimmer.value);
  device.set_param(kWidth, width.value);
  device.set_param(kMix, mix.value);
  shape_bins(device.param(kTilt), device.param(kLowCut), device.param(kHighCut));

  // The build part: the chosen step, and the whole build that is held to the device.
  Built& front = build.at() == build.compared_step ? whole : shown;
  front.start(build.at());
  whole.start(build.compared_step);
  double built_apart = 0.0, built_ref = 0.0;
  const int wanted = wanted_sample(kFrame);
  // Where each copy of the build takes over from the device (Built::adopt).
  const int build_from = frames > 2 * kFrame ? frames - 2 * kFrame : 0;
  const bool own_catch = freeze.on() && front.pieces >= Built::kHold && front.pieces < Built::kFall;
  const int front_from = !own_catch ? build_from : (wanted > 2 * kFrame ? wanted - 2 * kFrame : 0);
  bool front_on = front_from == 0;
  bool whole_on = &front == &whole ? front_on : build_from == 0;

  open_bars(caught);
  open_bars(later);
  open_bars(held);
  open_bars(sent);
  open_bars(built_sent);
  open_bars(built_angles);
  for (float& sample : stuck_frame) sample = 0.0f;
  for (float& sample : stuck_sum) sample = 0.0f;

  const int later_at = wanted + kLaterSamples > frames - kFrame ? (frames > kFrame ? frames - kFrame : 0)
                                                                : wanted + kLaterSamples;

  bool taken = false;   // the frame at "Frame at" has gone by in this pass
  bool looked = false;  // and the one two seconds after it
  int arm = 0;          // samples until Freeze is switched on
  int bin = -1;         // the bin the lanes follow: the loudest of the first frame taken
  int loop_from = -1;   // where the wave's own loop starts, and the sample of the source it starts at
  int loop_base = 0;
  int fade_from = -1;   // where the last pass's loop gives way to the sound again
  int fade_loop = 0;
  int fade_base = 0;

  float in_db = lab::kFloorDb, held_db = lab::kFloorDb, built_db = lab::kFloorDb;
  float in_hz = 0.0f, out_hz = 0.0f, built_hz = 0.0f, share = 0.0f;
  float was_in[2] = {1.0f, 0.0f}, was_out[2] = {1.0f, 0.0f}, was_built[2] = {1.0f, 0.0f};

  for (int i = 0; i < total; ++i) {
    const int in_pass = i % frames;
    const bool kept_pass = i >= frames && i < 2 * frames;
    if (in_pass == 0) {
      // The loop comes round: Freeze lets go, and the frame is taken again.
      device.set_param(kFreeze, 0.0f);
      taken = looked = false;
      arm = 0;
      fade_from = loop_from >= 0 ? i : -1;
      fade_loop = loop_from;
      fade_base = loop_base;
      loop_from = -1;
    }
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);

    // What the device's frames have added up to for this sample, before the limiter.
    const uint32_t now = device.position_;
    float wet_left = device.channel_[0].output[now & kMask];
    float wet_right = device.channel_[1].output[now & kMask];
    device.in_left()[0] = left;
    device.in_right()[0] = right;
    device.process(1);
    const bool ran = device.position_ != now;         // asleep, the device's clock stands still
    const bool framed = ran && (now & (kHop - 1)) == 0;  // it took a frame of the left side on this sample
    if (!ran) wet_left = wet_right = 0.0f;

    if (framed) {
      const Blur::Channel& channel = device.channel_[0];
      const bool frozen = device.param(kFreeze) >= 0.5f;
      const int middle = in_pass - kFrame / 2;  // of the frame, in this pass
      bool looked_now = false;

      if (!taken && middle >= wanted) {
        taken = true;
        if (bin < 0) {
          float loudest = 0.0f;
          bin = 1;
          for (int k = 1; k < kHalf; ++k) {
            const float power = channel.last_re[k] * channel.last_re[k] + channel.last_im[k] * channel.last_im[k];
            if (power > loudest) {
              loudest = power;
              bin = k;
            }
          }
        }
        if (freeze.on()) {
          arm = kHop / 2 + 44;  // after the right side has taken its frame of the same stretch
          loop_from = i + Blur::kStagger;
          loop_base = i - kFrame;
        }
        if (kept_pass) {
          for (int k = 0; k < kBars; ++k) {
            caught.set(k, to_bar(std::sqrt(channel.last_re[k] * channel.last_re[k] +
                                           channel.last_im[k] * channel.last_im[k])));
          }
        }
      }
      if (taken && !looked && middle >= later_at) {
        looked = looked_now = true;
        if (kept_pass) {
          for (int k = 0; k < kBars; ++k) {
            later.set(k, to_bar(std::sqrt(channel.last_re[k] * channel.last_re[k] +
                                          channel.last_im[k] * channel.last_im[k])));
            held.set(k, to_bar(channel.magnitude[k]));
          }
        }
      }

      // The lesson's own: the newest frame taken while Freeze was off, laid
      // down again with nothing about it changed.
      if (!frozen) {
        const uint32_t start = now - kFrame;
        for (int n = 0; n < kFrame; ++n) stuck_frame[n] = channel.input[(start + n) & kMask] * hann[n];
      }
      if (i >= build_from) {  // the first time round is only there to be dropped
        for (int n = 0; n < kFrame; ++n) {
          stuck_sum[(now + Blur::kStagger + n) & kMask] += stuck_frame[n] * hann[n] * (1.0f / 1.5f);
        }
      }

      // The build, on the same samples with the same settings.
      const Settings settings{frozen, device.param(kBlur), device.param(kSmear), device.param(kShimmer),
                              device.frame_index_};
      {
        // The frame two seconds on is the one the bar pictures of what goes back are taken of.
        front.watch = looked_now && kept_pass ? built_sent.data : nullptr;
        whole.watch = looked_now && kept_pass ? sent.data : nullptr;
        if (front_on) front.frame(now, settings);
        if (&front != &whole) {
          if (whole_on) whole.frame(now, settings);
        } else if (whole.watch && built_sent.data) {
          for (int k = 0; k < kBars; ++k) built_sent.data[k] = sent.data[k];
        }
      }

      if (bin >= 0) {
        const float xr = channel.last_re[bin], xi = channel.last_im[bin];
        const float size_in = std::sqrt(xr * xr + xi * xi);
        in_db = lab::to_db(to_bar(size_in));
        held_db = lab::to_db(to_bar(channel.magnitude[bin]));
        in_hz = size_in > kQuiet ? turned_hz(bin, xr, xi, was_in[0], was_in[1]) : 0.0f;
        out_hz = channel.magnitude[bin] > kQuiet
                     ? turned_hz(bin, channel.phase_re[bin], channel.phase_im[bin], was_out[0], was_out[1])
                     : 0.0f;
        was_in[0] = xr;
        was_in[1] = xi;
        was_out[0] = channel.phase_re[bin];
        was_out[1] = channel.phase_im[bin];
        built_db = lab::to_db(to_bar(front.size[bin]));
        built_hz = front.size[bin] > kQuiet
                       ? turned_hz(bin, front.angle_re[bin], front.angle_im[bin], was_built[0], was_built[1])
                       : 0.0f;
        was_built[0] = front.angle_re[bin];
        was_built[1] = front.angle_im[bin];
      }
      share = device.meter(2);
      if (looked_now && kept_pass) {
        for (int k = 0; k < kBars; ++k) {
          built_angles.set(k, kit::fast_atan2(front.angle_im[k], front.angle_re[k]) * (1.0f / kit::kTwoPi));
        }
      }
    }

    float so_far = 0.0f, all = 0.0f, stuck_now = 0.0f;
    if (ran && front_on) so_far = front.pass(now, left);
    if (&front == &whole) {
      all = so_far;
    } else if (ran && whole_on) {
      all = whole.pass(now, left);
    }
    if (!front_on && i == front_from) {
      front.adopt(device.channel_[0]);
      front_on = true;
    }
    if (&front == &whole) {
      whole_on = front_on;
    } else if (!whole_on && i == build_from) {
      whole.adopt(device.channel_[0]);
      whole_on = true;
    }
    if (ran) {
      stuck_now = stuck_sum[now & kMask];
      stuck_sum[now & kMask] = 0.0f;
    }
    if (arm > 0 && --arm == 0) device.set_param(kFreeze, 1.0f);

    // The lesson's own: the sound as it is, a latency late, until the frame
    // at "Frame at" has played once; from then on those 2,048 samples again
    // and again. Where the loop comes round it gives way over one frame.
    float loop_now = i >= Blur::kLatency ? lab::in_at(0, i - Blur::kLatency) : 0.0f;
    if (loop_from >= 0 && i >= loop_from) {
      loop_now = source_at(loop_base + (i - loop_from) % kFrame);
    } else if (fade_from >= 0 && i < fade_from + kFrame) {
      const float old = source_at(fade_base + (i - fade_loop) % kFrame);
      const float way = 0.5f - 0.5f * static_cast<float>(std::cos(lab::kPi * (i - fade_from) / kFrame));
      loop_now = old + (loop_now - old) * way;
    }

    if (i < frames) continue;  // the first time round is only there to be dropped
    if (kept_pass) {
      built_apart += (static_cast<double>(all) - wet_left) * (static_cast<double>(all) - wet_left);
      built_ref += static_cast<double>(wet_left) * wet_left;
    }
    in_tap.put(i, left, right);
    looped.put(i, loop_now);
    stuck.put(i, stuck_now);
    wet.put(i, wet_left, wet_right);
    out_tap.put(i, device.out_left()[0], device.out_right()[0]);
    built.put(i, so_far);
    if (i % lab::kControlPeriod == 0) {
      bin_in.put(i, in_db);
      bin_held.put(i, held_db);
      pitch_in.put(i, in_hz);
      pitch_out.put(i, out_hz);
      hang.put(i, share);
      built_bin.put(i, built_db);
      built_pitch.put(i, built_hz);
    }
  }
  build.difference.value = lab::ratio_db(built_apart, built_ref);

  // Part 1's three sounds as fine lines, up to 1 kHz.
  fine_spectrum(lines_in, in_tap.channel(0), frames);
  fine_spectrum(lines_looped, looped.channel(0), frames);
  fine_spectrum(lines_stuck, stuck.channel(0), frames);

  // The gain the device gives every bin, from 0 Hz to half the sample rate.
  if (shape_tap.open(kBins)) {
    shape_tap.x0 = 0.0f;
    shape_tap.x1 = 0.5f * lab::kSampleRate;
    for (int k = 0; k < kBins; ++k) shape_tap.set(k, lab::to_db(device.shape_[k]));
  }

  // The windows of the frames that lie over two frames' length of time, each
  // squared (once on the way in, once on the way out), and all of them added.
  constexpr int kPoints = 512;
  constexpr int kOverlap = kFrame / kHop;
  const int step = 2 * kFrame / kPoints;
  const int first = -(kOverlap - 1);  // the earliest frame that reaches into the stretch
  const int count = 3 * kOverlap - 1;
  if (windows.open(count * kPoints) && window_sum.open(kPoints)) {
    windows.columns = count;
    windows.x0 = window_sum.x0 = 0.0f;
    windows.x1 = window_sum.x1 = 1000.0f * static_cast<float>(2 * kFrame - step) / lab::kSampleRate;
    for (int p = 0; p < kPoints; ++p) {
      float sum = 0.0f;
      for (int m = 0; m < count; ++m) {
        const int n = p * step - (first + m) * kHop;  // where in frame m this instant is
        const float w = n >= 0 && n < kFrame ? device.window_[n] : 0.0f;
        windows.data[m * kPoints + p] = w * w;
        sum += w * w;
      }
      window_sum.set(p, sum);
    }
  }
}

// --- Sift: a share of every bin ------------------------------------------------------------------

void render_sift() {
  using namespace sift;
  const int frames = lab::frames();
  const int total = lab::total();
  const int part = keep.choice();  // 0 everything, 1 the tones, 2 the attacks, 3 the air

  gate.init(lab::kSampleRate);
  gate.set_param(kTones, part == 0 || part == 1 ? 0.0f : kParamMin[kTones]);
  gate.set_param(kAttacks, part == 0 || part == 2 ? 0.0f : kParamMin[kAttacks]);
  gate.set_param(kAir, part == 0 || part == 3 ? 0.0f : kParamMin[kAir]);
  gate.set_param(kHold, 0.0f);
  gate.set_param(kSharpness, sharpness.value);
  gate.set_param(kSoften, 0.0f);
  gate.set_param(kScatter, 0.0f);
  gate.set_param(kMix, 1.0f);
  gate.set_param(kEdge, edge.value);
  gate.set_param(kLate, 0.0f);

  open_bars(gate_sizes);
  open_bars(gate_steady);
  open_bars(gate_sudden);
  open_bars(gate_share);
  open_bars(gate_kept);

  // The frame Sift splits is the one of four frames ago.
  const int wanted = wanted_sample(Sift::kLookSamples + kFrame);
  bool taken = false;

  // With its blurs down Sift remembers nine frames and no more, so it sits
  // out most of the first time round, which is only there to be dropped.
  const int from = frames > 8 * kFrame ? frames - 8 * kFrame : 0;
  for (int i = from; i < total; ++i) {
    const Sift::Channel& channel = gate.channel_[0];
    const int row = channel.row;
    gate.in_left()[0] = lab::in_at(0, i);
    gate.in_right()[0] = lab::in_at(1, i);
    gate.process(1);

    // A frame of the left side was split on this sample: its shares are
    // still in the device's scratch until the right side's frame, half a hop on.
    if (!taken && i >= frames && channel.row != row) {
      const int middle = i - frames - Sift::kLookSamples - kFrame / 2;
      if (middle >= wanted) {
        taken = true;
        const int32_t* level = channel.magnitude[(row + Sift::kSpan - Sift::kLook) % Sift::kSpan];
        for (int k = 0; k < kBars; ++k) {
          const float size = Sift::magnitude_of(level[k]);
          const float tone = channel.alive ? gate.tone_[k] : 0.0f;
          const float strike = channel.alive ? gate.strike_[k] : 0.0f;
          const float kept = part == 0 ? 1.0f : part == 1 ? tone : part == 2 ? strike : 1.0f - tone - strike;
          gate_sizes.set(k, to_bar(size));
          gate_steady.set(k, to_bar(channel.alive ? gate.steady_[k] : 0.0f));
          gate_sudden.set(k, to_bar(channel.alive ? gate.sudden_[k] : 0.0f));
          gate_share.set(k, kept);
          gate_kept.set(k, to_bar(size * kept));
        }
      }
    }
    if (i < frames) continue;
    sifted.put(i, gate.out_left()[0], gate.out_right()[0]);
  }
}

// --- Sustain: caught at one moment -----------------------------------------------------------------

void render_sustain() {
  using namespace sustainer;
  const int frames = lab::frames();
  const int total = lab::total();

  sustain.init(lab::kSampleRate);
  sustain.set_param(kMode, 2.0f);  // Latch: Hold catches and lets go
  sustain.set_param(kHold, 0.0f);
  sustain.set_param(kAttack, kParamMin[kAttack]);
  sustain.set_param(kDecay, kParamMin[kDecay]);
  sustain.set_param(kGlide, kParamMin[kGlide]);
  sustain.set_param(kMotion, motion.value);
  sustain.set_param(kEnsemble, 0.0f);
  sustain.set_param(kTone, 0.0f);
  sustain.set_param(kLowCut, kParamMin[kLowCut]);
  sustain.set_param(kMix, 1.0f);

  // Hold goes on where the frame at "Frame at" ends, and off a quarter of a
  // second before the loop comes round, which is time enough for what it held
  // to die away: the loop then begins with nothing held, as it began the
  // time before, and the first time round, which is only there to be dropped,
  // is sat out but for its last third of a second.
  const int catch_at = wanted_sample(kFrame) + kFrame / 2;
  const int let_go_at = frames - 12000;
  const int from = frames > 16384 ? frames - 16384 : 0;
  for (int i = from; i < total; ++i) {
    const int in_pass = i % frames;
    if (in_pass == 0 || in_pass == let_go_at) sustain.set_param(kHold, 0.0f);
    if (i >= frames && in_pass == catch_at && catch_at < let_go_at) sustain.set_param(kHold, 1.0f);
    sustain.in_left()[0] = lab::in_at(0, i);
    sustain.in_right()[0] = lab::in_at(1, i);
    sustain.process(1);
    if (i < frames) continue;
    sustained.put(i, sustain.out_left()[0], sustain.out_right()[0]);
  }
}

}  // namespace

void lab_setup() {
  device.init(lab::kSampleRate);
  build_fft.init();
  for (int n = 0; n < kFrame; ++n) hann[n] = device.window_[n];
  for (int k = 0; k < kBins; ++k) {
    const float hz = static_cast<float>(k > 0 ? k : 1) * lab::kSampleRate / kFrame;
    octave[k] = std::log2(hz / Blur::kTiltPivotHz);
  }
}

void lab_render(int frames) {
  render_sift();
  render_sustain();
  render_blur();
  // The kit's transform of what went in, of what came out and of what Sift kept, left side.
  lab::spectrogram_tap(picture, in_tap.channel(0), frames);
  lab::spectrogram_tap(picture_out, out_tap.channel(0), frames);
  lab::spectrogram_tap(picture_sifted, sifted.channel(0), frames);
}
