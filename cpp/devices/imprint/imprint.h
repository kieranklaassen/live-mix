#pragma once

// Imprint: a filter made by playing. It learns the tone colour of what it
// hears (the broad shape of the spectrum, not the notes), holds it, and
// presses it on everything that comes after.
//
//   in ─┬─────────────────────── delay 2304 (Stft::dry) ───────────────► dry ─┐
//       │                                                                      ├─► out
//       └─► kit::Stft 2048/512 ─► × gain per bin × level hold ─► resynthesis ─► peak hold ─► wet ─┘
//                │                      ▲
//                └─► power per band ────┤ (both channels together)
//                      │                │
//                      ├─► Capture: average while On ──► captured colour ─┐
//                      └─► the sound's own colour, 80 ms (for Replace)    ├─► curve
//                                     built-in shapes (Shape) ────────────┘
//
// Everything about colour lives on one grid: 217 points, 24 to the octave,
// from 40 Hz to 20.48 kHz, in decibels. It does not depend on the sample
// rate; the bins are laid on it in init().
//
// - A shape S on the grid is a colour C and a trend T that add up to it.
//   A built-in shape is written down that way: a few bells in dB at fixed
//   frequencies (its colour) on a slope (its trend). A captured one is the
//   average power in each band while Capture was On, split where the sound
//   was into its tilt and broad dome (the trend) and what stands out of
//   them: formants, resonances, partials (the colour, see split()). Smooth
//   averages the shape first, over a width in octaves (0.04 at 0, every
//   bump the grid has, to 1 at 1): a built-in colour in dB, a captured
//   shape as power with the gaps between its partials bridged (to_db()), so
//   that it is the colour and not the notes.
// - The curve, in dB at grid point g:
//
//     H = Amount × C(g − Shift) + Replace × w × (T(g − Shift) − own(g)),   w = min(1, |Amount|)
//
//   The stamp is made of the colour alone: a dark, narrow recording laid
//   over a bright sound gives it its formants and not its darkness. Amount
//   below zero turns the colour inside out. Shift moves the shape along the
//   grid, two points to the semitone. `own` is the incoming sound's own
//   shape over the last 80 ms, smoothed and bridged alike: with Replace and
//   Amount at 1 the curve is S − own, so what comes out has the shape S
//   whatever went in. H is held to ±30 dB.
// - Level hold. A stamp must not be a volume knob, and it must not pump. So
//   the hold has no memory to speak of: every frame leaves as loud as it
//   came, give or take 6 dB. What the frame weighs is worked out exactly, as
//   its windowed samples would add up (Hann on the way out is a three-bin sum
//   of the bins, see low_weight()), before the curve and after it, the bins
//   above 1.7 kHz counting up to 4 dB more, as the ear's loudness does; one
//   gain for all bins makes the two equal, 30 dB either way at most. That
//   gain is allowed 6 dB of slack so that it does not follow every beat of a
//   chorused pad (see hold_level()): within the slack it settles over half a
//   second, and it never lies further off. A frame that is a new sound (most
//   of its power in bands that held little a moment ago: a new note, the
//   first sound after a rest) takes the gain to where it belongs at once, so
//   a note is as loud as it came from its first frame, whatever came before
//   it, and a held chord that beats keeps its gain.
// - Peak hold. A colour pressed on a buzzing sound can leave it as loud as
//   it was and far more peaked (its partials evened out stand up together).
//   The stamped sound is therefore held under a ceiling that follows the
//   input: the loudest input sample of the last 100 ms (every sample the
//   frames in flight were made from). It passes untouched up to 1.5 times
//   that (+3.5 dB) and is rounded off above, never past twice that (+6 dB).
//   There is no feedback anywhere, so nothing piles up.
// - Both channels share one curve and one hold (worked out when the left
//   frame comes, from the left frame and the right one before it), each is
//   filtered on its own: a mono sound stays mono bit for bit, the picture
//   between the channels is kept, and nothing is summed to mono.
// - Capture starts afresh each time it is switched On, with the first frame
//   loud enough to hear (-70 dBFS); until Learn seconds have been heard it is
//   a plain average, after that the newest Learn seconds count. Frames of
//   silence teach nothing, so what was learned survives rests and sleep, and
//   only init() forgets it; nor do frames louder than full scale or holding
//   a sample 6 dB past it, which are not sound. With Shape at Captured and
//   nothing captured (a capture is not saved with a piece) the open vowel
//   stands in, so that the plate does what its knobs say.
// - Nothing is smoothed in time but Mix: a gain per bin that changes between
//   two frames is crossfaded by the overlap, over one frame (43 ms).
//
// Latency: 2304 samples (kit::Stft<2048, 512>::kLatency); the dry path is
// delayed alike, so Mix does not comb and Mix 0 is the input 2304 late.
// Storage: two Stft channels (88 KB each), two channels of bin powers, the
// right channel's last frame and a few grid tables: under 230 KB in all. No
// delay line of its own.

#include <cstring>

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Imprint : public kit::DeviceBase<imprint::kNumParams> {
 public:
  using Stft = kit::Stft<2048, 512>;
  static constexpr int kLatency = Stft::kLatency;  // 2304: "latencySamples" in device.json
  static constexpr int kBins = Stft::kBins;

  // The grid every colour lives on.
  static constexpr int kPerOctave = 24;
  static constexpr int kOctaves = 9;
  static constexpr int kPoints = kPerOctave * kOctaves + 1;  // 217
  static constexpr float kLowHz = 40.0f;                     // point 0; the last is 20480 Hz
  static constexpr float kMidOctave = 0.5f * kOctaves;

  // Smooth 0..1 is a width in octaves, kSmoothLow × kSmoothSpan^Smooth.
  static constexpr float kSmoothLow = 0.04f;
  static constexpr float kSmoothSpan = 25.0f;
  static constexpr float kMaxGainDb = 30.0f;      // the curve is held to ± this
  // How far under its strongest band a shape may reach, as a ratio of
  // powers: 60 dB for what is captured, 90 dB for the sound's own shape that
  // Replace takes away (the curve's own limit keeps what that can raise).
  static constexpr float kBridgeDb = 8.0f;  // see to_db()
  static constexpr float kOccupiedDb = 30.0f;   // see split()
  static constexpr float kTrendOctaves = 2.0f;  // see split()
  static constexpr float kCapturedReach = 1.0e-6f;
  static constexpr float kOwnReach = 1.0e-9f;
  static constexpr float kFollowSeconds = 0.08f;  // the sound's own colour, for Replace
  // The level hold gives or takes as much as the curve can: 30 dB. See
  // hold_level() for the rest.
  static constexpr float kMostHold = 31.622777f;
  static constexpr float kHoldSlack = 1.9952623f;  // 6 dB
  static constexpr float kHoldSlow = 0.5f;         // seconds
  static constexpr float kHoldFast = 0.05f;
  static constexpr float kHoldCatch = 0.15f;
  // A frame is a new sound when this share of its power lies over what its
  // bands have held lately; what a band has held rises to its power over
  // kOnsetRise seconds and falls back over kOnsetFall. See novelty().
  static constexpr float kOnsetShare = 0.4f;
  static constexpr float kOnsetRise = 0.06f;
  static constexpr float kOnsetFall = 2.0f;
  // What the hold weighs a bin by: 1 low down, kLoudnessLift (4 dB as power)
  // high up, half way at kLoudnessHz, the shelf of the loudness weighting.
  static constexpr float kLoudnessLift = 2.5118864f;
  static constexpr float kLoudnessHz = 1682.0f;
  // Under this bin the hold weighs each bin with its neighbours' gains; a
  // grid step (1/24 octave) is four bins wide from bin 137 up, at any rate.
  static constexpr int kExact = 160;
  // The peak hold: the loudest input sample of the last kPeakHops hops and
  // the one in hand (every sample a frame in flight was made from) is the
  // measure; the stamped sound passes as it is up to kPeakKnee times that
  // and never leaves past kPeakMost times it. The ceiling rises over
  // kPeakRise samples and falls over a hop.
  static constexpr int kPeakHops = 9;
  static constexpr float kPeakKnee = 1.5f;
  static constexpr float kPeakMost = 2.0f;
  static constexpr int kPeakRise = 64;
  static constexpr float kInputLimit = 64.0f;  // what kit::Stft lets in
  // A frame under this teaches nothing: -70 dBFS of noise summed over the
  // bins (noise of RMS 1 reads 3/8 × Frame of power a bin, two channels).
  static constexpr float kGatePower = 2.0f * 0.375f * Stft::kFrame * kBins * 1.0e-7f;
  // The loudest frame that teaches anything: full scale on both channels (a
  // square wave; a sine reads half this). Anything louder is not sound
  // (kit::Stft lets samples in up to ±64), and one burst of it would
  // outweigh everything learned for many times the Learn time.
  static constexpr float kLoudest = 2.0f * 0.1875f * Stft::kFrame * Stft::kFrame;
  // And no frame that holds a sample past this teaches anything (6 dB over
  // full scale): a frame that only touches a burst with its edge is under
  // kLoudest, and is the burst's colour all the same.
  static constexpr float kLoudestSample = 2.0f;
  static constexpr int kFrameHops = 4;  // whole hops behind the one in hand that those frames reach into

  // What meter() carries to the display: a curve on the grid at every fourth
  // grid point, four points to a reading; the captured colour is one such
  // set of kReadings, what Replace adds to the curve another.
  static constexpr int kDisplayStep = 4;
  static constexpr int kDisplayPoints = (kPoints - 1) / kDisplayStep + 1;  // 55
  static constexpr int kPerReading = 4;
  static constexpr int kReadings = 14;
  static constexpr int kLevels = 64;  // whole dB from -31 to +31; a digit of 0 is never sent, so a reading of 0 is none
  static_assert(kReadings * kPerReading >= kDisplayPoints, "every point needs a place in a reading");
  // The order of "meters" in device.json.
  static constexpr int kHeardReading = kReadings;          // 14
  static constexpr int kAddedReading = kReadings + 1;      // 15 to 28
  static constexpr int kHoldReading = 2 * kReadings + 1;   // 29
  static constexpr int kNumReadings = 2 * kReadings + 2;

  static constexpr int kBuiltIn = 6;
  static constexpr int kStandIn = 0;  // the built-in shape (the open vowel) that stands in for an empty capture
  static constexpr int kMaxBells = 6;
  struct Bell {
    float hz, db, width;  // width: the bell's sigma in octaves
  };
  struct BuiltIn {
    float slope;  // dB per octave
    Bell bells[kMaxBells];
  };
  // Shape 1 to 6. Each is a few bells on a slope; a bell with no height ends
  // the list. The vowels are textbook formants of a sung "ah", "oo" and "ee";
  // the tube is a pipe closed at one end (odd multiples of 220 Hz); the bell
  // is a struck bar's partials (1, 2.4, 4, 5.9, 8.9, 12.1 times 587 Hz); the
  // box is three low resonances and little above them.
  static constexpr BuiltIn kBuiltInShapes[kBuiltIn] = {
      {-3.0f, {{730.0f, 18.0f, 0.10f}, {1090.0f, 15.0f, 0.09f}, {2440.0f, 13.0f, 0.08f}, {3400.0f, 9.0f, 0.08f}}},
      {-5.0f, {{300.0f, 18.0f, 0.12f}, {870.0f, 13.0f, 0.09f}, {2240.0f, 8.0f, 0.08f}}},
      {-2.0f, {{270.0f, 16.0f, 0.12f}, {2290.0f, 16.0f, 0.08f}, {3010.0f, 14.0f, 0.08f}}},
      {-3.0f,
       {{220.0f, 14.0f, 0.14f},
        {660.0f, 14.0f, 0.07f},
        {1100.0f, 13.0f, 0.06f},
        {1540.0f, 12.0f, 0.05f},
        {1980.0f, 11.0f, 0.05f},
        {2420.0f, 10.0f, 0.05f}}},
      {2.0f,
       {{587.0f, 8.0f, 0.06f},
        {1408.0f, 11.0f, 0.05f},
        {2350.0f, 13.0f, 0.05f},
        {3460.0f, 14.0f, 0.05f},
        {5220.0f, 14.0f, 0.05f},
        {7100.0f, 12.0f, 0.05f}}},
      {-7.0f, {{95.0f, 12.0f, 0.20f}, {210.0f, 14.0f, 0.14f}, {390.0f, 10.0f, 0.12f}, {640.0f, 7.0f, 0.10f}}},
  };

  void init(float sample_rate) {
    using namespace imprint;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();
    stft_[1].init(Stft::kMaxStagger);

    // The bins on the grid, and the grid on the bins. A band is 1/24 octave
    // wide and never narrower than one bin; `edge` counts bins so that bin k
    // covers [k, k + 1), its centre at k + 0.5.
    const float bins_per_hz = static_cast<float>(Stft::kFrame) / sr;
    const float half_band = 0.5f * (std::exp2(0.5f / kPerOctave) - std::exp2(-0.5f / kPerOctave));
    for (int g = 0; g < kPoints; ++g) {
      const float hz = kLowHz * std::exp2(static_cast<float>(g) / kPerOctave);
      const float centre = hz * bins_per_hz + 0.5f;
      const float half = hz * bins_per_hz * half_band;
      const float reach = half > 0.5f ? half : 0.5f;
      band_low_[g] = kit::clamp(centre - reach, 0.0f, static_cast<float>(kBins));
      band_high_[g] = kit::clamp(centre + reach, 0.0f, static_cast<float>(kBins));
      const float width = band_high_[g] - band_low_[g];
      band_scale_[g] = width > 1.0e-3f ? 1.0f / width : 0.0f;
      // What the band weighs in the level: its own width in bins, none past the top.
      band_weight_[g] = centre < static_cast<float>(kBins) ? 2.0f * half : 0.0f;
    }
    for (int k = 0; k < kBins; ++k) {
      const float hz = static_cast<float>(k) / bins_per_hz;
      float at = hz > kLowHz ? std::log2(hz / kLowHz) * kPerOctave : 0.0f;
      if (at > static_cast<float>(kPoints - 1)) at = static_cast<float>(kPoints - 1);
      const int index = kit::clamp_int(static_cast<int>(at), 0, kPoints - 2);
      bin_index_[k] = static_cast<uint16_t>(index);
      bin_fraction_[k] = at - static_cast<float>(index);
      const float x = hz / kLoudnessHz;
      const float x4 = x * x * x * x;
      loudness_[k] = (1.0f + kLoudnessLift * x4) / (1.0f + x4);
    }
    for (int s = 0; s < kBuiltIn; ++s) {
      for (int g = 0; g < kPoints; ++g) built_in_[s][g] = built_in_db(s, static_cast<float>(g) / kPerOctave);
    }

    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kBins; ++k) {
        power_[c][k] = 0.0f;
        weighed_[c][k] = 0.0f;
      }
      for (float& value : right_[c]) value = 0.0f;
      for (int g = 0; g < kPoints; ++g) band_[c][g] = 0.0f;
      total_[c] = 0.0f;
    }
    for (int g = 0; g < kPoints; ++g) {
      captured_[g] = 0.0f;
      follow_[g] = 0.0f;
      captured_colour_[g] = 0.0f;
      captured_trend_[g] = 0.0f;
      built_colour_[g] = 0.0f;
      built_trend_[g] = 0.0f;
      grid_gain_[g] = 1.0f;
      curve_[g] = 0.0f;
    }
    for (int k = 0; k < kBins; ++k) gain_[k] = 1.0f;
    for (float& value : reading_) value = 0.0f;
    captured_frames_ = 0;
    follow_frames_ = 0;
    makeup_ = 1.0f;
    catching_ = 0;
    knob_moved_ = false;
    const float hop_seconds = static_cast<float>(Stft::kHop) / sr;
    hold_slow_ = 1.0f - std::exp(-hop_seconds / kHoldSlow);
    hold_fast_ = 1.0f - std::exp(-hop_seconds / kHoldFast);
    catch_frames_ = static_cast<int>(kHoldCatch / hop_seconds + 0.5f);
    onset_rise_ = 1.0f - std::exp(-hop_seconds / kOnsetRise);
    onset_fall_ = 1.0f - std::exp(-hop_seconds / kOnsetFall);
    for (float& kept : kept_) kept = 0.0f;
    hop_done_ = false;
    rest_peaks();
    capture_restart_ = false;
    captured_dirty_ = true;
    built_dirty_ = true;
    curve_dirty_ = true;
    mix_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    // What is in flight when the input stops: a latency and a frame; and the
    // peak hold's ceiling is back at nothing kPeakHops + 2 hops after it
    // (5632 samples), so that sleep finds it the same at every block size.
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + 4 * Stft::kHop) / sr);
    refresh_captured();  // the readings of an empty capture
    curve_dirty_ = true;
  }

  void set_param(int id, float value) {
    using namespace imprint;
    const bool was_capturing = id == kCapture && capturing();
    if (!store_param(id, value)) return;
    switch (id) {
      case kCapture:
        if (capturing() && !was_capturing) capture_restart_ = true;
        break;
      case kShape:
        built_dirty_ = true;
        curve_dirty_ = true;
        knob_moved_ = true;
        break;
      case kSmooth:
        built_dirty_ = true;
        captured_dirty_ = true;
        curve_dirty_ = true;
        knob_moved_ = true;
        break;
      case kMix:
        mix_.set(param(kMix), primed() && !idle_.asleep());  // moved in the sleep, it snaps
        break;
      case kLearn:
        captured_dirty_ = true;  // the "heard" reading is a share of it
        break;
      default:  // Amount, Shift, Replace
        curve_dirty_ = true;
        knob_moved_ = true;
        break;
    }
  }

  // A built-in shape's colour in dB at `octave` octaves above kLowHz, before
  // Smooth: its bells, each a bell curve in dB over the octaves. Its trend is
  // its slope, a straight line through the middle of the grid.
  static float built_in_db(int shape, float octave) {
    const BuiltIn& built = kBuiltInShapes[shape];
    float db = 0.0f;
    for (const Bell& bell : built.bells) {
      if (bell.db == 0.0f) break;
      const float away = (octave - std::log2(bell.hz / kLowHz)) / bell.width;
      db += bell.db * std::exp(-0.5f * away * away);
    }
    return db;
  }

  // The width Smooth stands for, in octaves.
  static float smooth_octaves(float smooth) { return kSmoothLow * std::pow(kSmoothSpan, smooth); }

  // The readings named by "meters" in device.json, all for the display.
  // 0 to 13: the captured colour (after Smooth, its trend taken off, before
  // Shift and Amount) at every fourth grid point, each the mean of the four
  // grid steps around it, in whole dB from -31 to +31 as one digit of a number
  // in base 64, four points to a reading and the lowest point in the lowest
  // digit (64^4 is 2^24: a float holds it exactly). 14: how much of the
  // Learn time has been heard since Capture was switched on, 0 (nothing
  // captured: the stand-in shape is pressed on) to 1. 15 to 28: what Replace
  // adds to the curve as it stands (before the curve's ±30 dB limit), packed
  // the same way. 29: the level hold's gain on the newest frame, in dB. All
  // are worked out when a frame is made; here they are only handed over.
  float meter(int index) const {
    if (index < 0 || index >= kNumReadings) return 0.0f;
    return reading_[index];
  }

  void process(int frames) {
    using namespace imprint;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock runs on through the sleep
      stft_[1].skip(frames);
      mix_.snap(mix_.target);  // a knob moved while asleep does not glide in
      rest_peaks();            // (they are at rest already: see init())
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // The stamp and the sound stay in step and in phase: a linear crossfade.
      const float mix = mix_.next();
      const float wet_left = stft_[0].process(in[0], [this](float* re, float* im) { lead_frame(re, im); });
      const float wet_right = stft_[1].process(in[1], [this](float* re, float* im) { second_frame(re, im); });
      const float dry_left = stft_[0].dry();
      const float dry_right = stft_[1].dry();
      const float ceiling = next_ceiling(in[0], in[1]);
      out_left_[i] = dry_left * (1.0f - mix) + bound(wet_left, ceiling) * mix;
      out_right_[i] = dry_right * (1.0f - mix) + bound(wet_right, ceiling) * mix;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  bool capturing() const { return param(imprint::kCapture) >= 0.5f; }

  // The left channel's frame, which always comes first: everything the two
  // channels share is worked out here, from this frame and the right
  // channel's frame before it.
  void lead_frame(float* re, float* im) {
    using namespace imprint;
    measure(0, re, im);
    const float heard = total_[0] + total_[1];
    if (heard > kGatePower && heard <= kLoudest && frame_peak() <= kLoudestSample) learn();
    if (captured_dirty_) refresh_captured();
    if (built_dirty_) refresh_built();
    const float replace = param(kReplace) * kit::min(1.0f, std::fabs(param(kAmount)));
    if (curve_dirty_ || (replace > 0.0f && heard > kGatePower)) compose(replace);
    hold_level(re, im, knob_moved_);
    knob_moved_ = false;
    apply(re, im);
    hop_done_ = true;
  }

  // The right channel's frame: the same curve and the same hold. Its low
  // bins are kept as they came, for the hold to weigh with the left frame
  // after it.
  void second_frame(float* re, float* im) {
    measure(1, re, im);
    std::memcpy(right_[0], re, sizeof right_[0]);
    std::memcpy(right_[1], im, sizeof right_[1]);
    apply(re, im);
  }

  void apply(float* re, float* im) const {
    const float makeup = makeup_;
    for (int k = 0; k < kBins; ++k) {
      const float gain = gain_[k] * makeup;
      re[k] *= gain;
      im[k] *= gain;
    }
  }

  // The power of every bin of channel c's frame, and of every band of the
  // grid: the mean over the band's bins, by a running sum read between bins.
  void measure(int c, const float* re, const float* im) {
    float* power = power_[c];
    float sum = 0.0f;
    running_[0] = 0.0f;
    for (int k = 0; k < kBins; ++k) {
      const float p = re[k] * re[k] + im[k] * im[k];
      power[k] = p;
      sum += p;
      running_[k + 1] = sum;
    }
    total_[c] = sum;
    // What each bin above kExact weighs on the way out, as it came: see low_weight().
    float* weighed = weighed_[c];
    for (int k = kExact; k < kBins - 1; ++k) {
      const float xr = re[k] - 0.5f * (re[k - 1] + re[k + 1]);
      const float xi = im[k] - 0.5f * (im[k - 1] + im[k + 1]);
      weighed[k] = loudness_[k] * (xr * xr + xi * xi);
    }
    float* band = band_[c];
    for (int g = 0; g < kPoints; ++g) {
      band[g] = (running_at(band_high_[g], power) - running_at(band_low_[g], power)) * band_scale_[g];
      if (band[g] < 0.0f) band[g] = 0.0f;
    }
  }

  float running_at(float edge, const float* power) const {
    int k = static_cast<int>(edge);
    if (k >= kBins) return running_[kBins];
    return running_[k] + (edge - static_cast<float>(k)) * power[k];
  }

  // One average of the band powers: a plain mean of the first `count`
  // frames, then the newest `seconds` of them.
  void average(float* into, int* count, float seconds) {
    if (*count < 1000000) ++*count;
    const float hop = static_cast<float>(Stft::kHop) / sample_rate();
    const float newest = kit::max(1.0f / static_cast<float>(*count), 1.0f - std::exp(-hop / seconds));
    const float* left = band_[0];
    const float* right = band_[1];
    for (int g = 0; g < kPoints; ++g) into[g] += newest * (left[g] + right[g] - into[g]);
  }

  // A frame loud enough to hear, and no louder than sound is: the two
  // things that listen take it in.
  void learn() {
    using namespace imprint;
    average(follow_, &follow_frames_, kFollowSeconds);
    if (!capturing()) return;
    if (capture_restart_) {
      capture_restart_ = false;
      captured_frames_ = 0;
    }
    average(captured_, &captured_frames_, param(kLearn));
    captured_dirty_ = true;
  }

  // Band powers as a shape in dB: the powers smoothed by Smooth, no deeper
  // than `reach` (a ratio of powers) under the strongest band, and then the
  // gaps between partials bridged: no point lies further under a neighbour
  // than a slope of kBridgeDb per Smooth width allows. A sound with pitch
  // is partials with nothing between them, and its colour is the line over
  // their tops, not the holes; at Smooth 0 the slope is 200 dB an octave
  // and every partial stands, at the default it is 40. False (and all
  // zeros) when there is nothing in the bands.
  bool to_db(const float* power, float* db, float reach) {
    float most = 0.0f;
    for (int g = 0; g < kPoints; ++g) {
      db[g] = power[g];
      most = kit::max(most, power[g]);
    }
    if (!(most > 0.0f)) {
      for (int g = 0; g < kPoints; ++g) db[g] = 0.0f;
      return false;
    }
    smooth_grid(db, smooth_reach());
    const float least = most * reach;
    for (int g = 0; g < kPoints; ++g) db[g] = 4.3429448f * std::log(kit::max(db[g], least));
    const float fall = kBridgeDb / (smooth_octaves(param(imprint::kSmooth)) * kPerOctave);  // dB a grid point
    for (int g = 1; g < kPoints; ++g) db[g] = kit::max(db[g], db[g - 1] - fall);
    for (int g = kPoints - 2; g >= 0; --g) db[g] = kit::max(db[g], db[g + 1] - fall);
    return true;
  }

  // Smooth as half a width in grid points beside the middle one: none under
  // one grid step.
  float smooth_reach() const {
    return kit::max(0.0f, 0.5f * (smooth_octaves(param(imprint::kSmooth)) * kPerOctave - 1.0f));
  }

  // The mean over `reach` points either side, twice over (a triangle twice
  // as wide at its foot), the ends held where the grid stops. A part of a
  // point counts as that part.
  void smooth_grid(float* data, float reach) {
    if (!(reach > 0.0f)) return;
    const int whole = kit::clamp_int(static_cast<int>(reach), 0, kPad - 2);
    const float part = kit::min(reach - static_cast<float>(whole), 1.0f);
    const float scale = 1.0f / (static_cast<float>(2 * whole + 1) + 2.0f * part);
    for (int pass = 0; pass < 2; ++pass) {
      float sum = 0.0f;
      for (int e = 0; e < kPoints + 2 * kPad; ++e) {
        sum_[e] = sum;
        sum += data[kit::clamp_int(e - kPad, 0, kPoints - 1)];
      }
      sum_[kPoints + 2 * kPad] = sum;
      for (int g = 0; g < kPoints; ++g) {
        const float inner = sum_[g + kPad + whole + 1] - sum_[g + kPad - whole];
        const float outer = data[kit::clamp_int(g - whole - 1, 0, kPoints - 1)] +
                            data[kit::clamp_int(g + whole + 1, 0, kPoints - 1)];
        work_[g] = (inner + part * outer) * scale;
      }
      for (int g = 0; g < kPoints; ++g) data[g] = work_[g];
    }
  }

  // A captured shape (in `colour` on the way in) as its colour and its
  // trend, which add up to it. The shape counts where the sound was: from the
  // first to the last point within kOccupiedDb of the strongest. There the
  // trend is the straight line that fits the shape best plus what is left of
  // the rest after a mean over kTrendOctaves, twice: the tilt and the broad
  // dome. The colour is what stands out of that: formants, resonances,
  // partials. Past the ends of the sound the colour runs out to nothing,
  // because where nothing was heard nothing is known: laid over another sound
  // (Replace 0) the stamp leaves that sound's own top and bottom alone, and
  // only Replace, which uses the trend too, takes them away.
  void split(float* colour, float* trend) {
    float most = colour[0];
    for (int g = 1; g < kPoints; ++g) most = kit::max(most, colour[g]);
    int low = 0;
    int high = kPoints - 1;
    while (low < high && colour[low] < most - kOccupiedDb) ++low;
    while (high > low && colour[high] < most - kOccupiedDb) --high;
    float mean = 0.0f;
    for (int g = low; g <= high; ++g) mean += colour[g];
    mean /= static_cast<float>(high - low + 1);
    const float middle = 0.5f * static_cast<float>(low + high);
    float along = 0.0f;
    float square = 0.0f;
    for (int g = low; g <= high; ++g) {
      const float away = static_cast<float>(g) - middle;
      along += away * (colour[g] - mean);
      square += away * away;
    }
    // Under a third of an octave of sound there is no tilt to speak of.
    const float slope = high - low >= kPerOctave / 3 ? along / square : 0.0f;
    for (int g = 0; g < kPoints; ++g) {
      const int held = kit::clamp_int(g, low, high);
      rest_[g] = colour[held] - (mean + slope * (static_cast<float>(held) - middle));
      broad_[g] = rest_[g];
    }
    smooth_grid(broad_, 0.5f * (kTrendOctaves * kPerOctave - 1.0f));
    for (int g = 0; g < kPoints; ++g) {
      trend[g] = colour[g] - (rest_[g] - broad_[g]);
      colour[g] = rest_[g] - broad_[g];
    }
  }

  // The captured colour from what has been learned, and the display's
  // readings of it.
  void refresh_captured() {
    using namespace imprint;
    captured_dirty_ = false;
    if (to_db(captured_, captured_colour_, kCapturedReach)) {
      split(captured_colour_, captured_trend_);
    } else {
      for (int g = 0; g < kPoints; ++g) captured_trend_[g] = 0.0f;
    }
    pack(captured_colour_, reading_);
    const float listened = static_cast<float>(captured_frames_) * Stft::kHop / sample_rate();
    reading_[kHeardReading] = kit::min(1.0f, listened / param(kLearn));
    if (param(kShape) < 0.5f) curve_dirty_ = true;
  }

  // A curve on the grid as kReadings readings for the display.
  static void pack(const float* grid, float* into) {
    for (int r = 0; r < kReadings; ++r) {
      int packed = 0;
      for (int j = kPerReading - 1; j >= 0; --j) {
        const int point = r * kPerReading + j;
        int level = kLevels / 2;
        if (point < kDisplayPoints) {
          const int g = point * kDisplayStep;
          float db = 0.0f;
          for (int o = -2; o <= 2; ++o) {
            db += (o == -2 || o == 2 ? 0.125f : 0.25f) * grid[kit::clamp_int(g + o, 0, kPoints - 1)];
          }
          level = kit::clamp_int(static_cast<int>(std::floor(db + 0.5f)) + kLevels / 2, 1, kLevels - 1);
        }
        packed = packed * kLevels + level;
      }
      into[r] = static_cast<float>(packed);
    }
  }

  // The built-in colour Shape names, after Smooth. With Shape at Captured
  // it is the one that stands in until something has been captured.
  void refresh_built() {
    built_dirty_ = false;
    int shape = kit::clamp_int(static_cast<int>(param(imprint::kShape) + 0.5f), 0, kBuiltIn) - 1;
    if (shape < 0) shape = kStandIn;
    for (int g = 0; g < kPoints; ++g) built_colour_[g] = built_in_[shape][g];
    smooth_grid(built_colour_, smooth_reach());
    const float slope = kBuiltInShapes[shape].slope;
    for (int g = 0; g < kPoints; ++g) {
      built_trend_[g] = slope * (static_cast<float>(g) * (1.0f / kPerOctave) - kMidOctave);
    }
  }

  // The curve on the grid and then on the bins. `replace` is Replace × w.
  void compose(float replace) {
    using namespace imprint;
    curve_dirty_ = false;
    // Captured with nothing captured (a piece just loaded: a capture is not
    // saved with it) is the built-in shape kStandIn, so that the plate does
    // what its knobs say from the first note and not only after a capture.
    const bool captured = param(kShape) < 0.5f && captured_frames_ > 0;
    const float* colour = captured ? captured_colour_ : built_colour_;
    const float* trend = captured ? captured_trend_ : built_trend_;
    if (!to_db(follow_, own_, kOwnReach)) replace = 0.0f;
    const float amount = param(kAmount);
    const float shift = param(kShift) * (kPerOctave / 12.0f);  // in grid points
    // What Replace adds: the stamp's trend less the sound's own shape. Each
    // has a level of its own that means nothing here, so the difference is
    // set to nothing on average where the sound is (weighed by its power).
    float offset = 0.0f;
    if (replace > 0.0f) {
      float weight = 0.0f;
      for (int g = 0; g < kPoints; ++g) {
        const float at = kit::clamp(static_cast<float>(g) - shift, 0.0f, static_cast<float>(kPoints - 1));
        const int index = kit::clamp_int(static_cast<int>(at), 0, kPoints - 2);
        const float fraction = at - static_cast<float>(index);
        own_[g] = trend[index] + fraction * (trend[index + 1] - trend[index]) - own_[g];
        const float power = band_weight_[g] * follow_[g];
        offset += power * own_[g];
        weight += power;
      }
      offset = weight > 0.0f ? offset / weight : 0.0f;
    }
    for (int g = 0; g < kPoints; ++g) {
      const float at = kit::clamp(static_cast<float>(g) - shift, 0.0f, static_cast<float>(kPoints - 1));
      const int index = kit::clamp_int(static_cast<int>(at), 0, kPoints - 2);
      const float fraction = at - static_cast<float>(index);
      float db = amount * (colour[index] + fraction * (colour[index + 1] - colour[index]));
      own_[g] = replace > 0.0f ? replace * (own_[g] - offset) : 0.0f;  // what Replace adds
      db += own_[g];
      curve_[g] = kit::clamp(db, -kMaxGainDb, kMaxGainDb);
      grid_gain_[g] = db_to_gain(curve_[g]);
    }
    pack(own_, reading_ + kAddedReading);
    // Between two grid points the curve is a straight line in dB, so that a
    // curve and the same curve turned over are each other's reciprocal.
    for (int k = 0; k < kBins; ++k) {
      const float* at = curve_ + bin_index_[k];
      gain_[k] = db_to_gain(at[0] + bin_fraction_[k] * (at[1] - at[0]));
    }
  }

  // 10^(dB / 20) for ±40 dB within 3e-6 of itself, without the libm call:
  // two to a whole power from the float's own exponent, times five terms of
  // the series for the rest (half a power either way).
  static float db_to_gain(float db) {
    const float power = db * 0.16609640f;  // log2(10) / 20
    const float whole = std::floor(power + 0.5f);
    const float rest = (power - whole) * 0.69314718f;
    const float series =
        1.0f + rest * (1.0f + rest * (0.5f + rest * (0.16666667f + rest * (0.041666667f + rest * 0.0083333333f))));
    uint32_t bits = static_cast<uint32_t>(static_cast<int>(whole) + 127) << 23;
    float scale;
    std::memcpy(&scale, &bits, sizeof scale);
    return series * scale;
  }

  // What a frame weighs on the way out, as it came (`came`) and under the
  // curve (`leaves`), added to what is there. The output is the frame's
  // samples under the Hann window, and a Hann window in time is, among the
  // bins, each bin less half its two neighbours: Z[k] = Y[k] − (Y[k−1] +
  // Y[k+1]) / 2. So the sum of |Z|² is the energy of what the frame really
  // adds to the output, whether its bins are noise or the three or four bins
  // of one steady partial under a curve that changes between them (where a
  // plain sum of gain² × power is several dB out). Each bin counts
  // loudness_[k] times. With every gain at 1 the two sums are the same sum.
  //
  // Only the bins under kExact are weighed like that, here. Above them the
  // curve hardly changes from one bin to the next (a grid step is four bins
  // and more), so Z[k] is gain[k] times the same sum without the curve, which
  // measure() has kept (weighed_).
  void low_weight(const float* re, const float* im, float* came, float* leaves) const {
    const float* gain = gain_;
    float in = 0.0f;
    float out = 0.0f;
    for (int k = 1; k < kExact; ++k) {
      const float xr = re[k] - 0.5f * (re[k - 1] + re[k + 1]);
      const float xi = im[k] - 0.5f * (im[k - 1] + im[k + 1]);
      const float yr = gain[k] * re[k] - 0.5f * (gain[k - 1] * re[k - 1] + gain[k + 1] * re[k + 1]);
      const float yi = gain[k] * im[k] - 0.5f * (gain[k - 1] * im[k - 1] + gain[k + 1] * im[k + 1]);
      in += loudness_[k] * (xr * xr + xi * xi);
      out += loudness_[k] * (yr * yr + yi * yi);
    }
    *came += in;
    *leaves += out;
  }

  // The level hold: one gain for every bin, made from this frame alone (the
  // left one in hand and the right one before it): `exact` is the gain that
  // makes it leave as loud as it came. Taken as it is, frame by frame, that
  // gain would follow every beat between two partials near a bell (on a
  // chorused pad it moved by 5 to 12 dB a few times a second, and everything
  // off the bell with it; with 3 dB of slack still by 8 dB under the round
  // vowel, with 6 dB by about 3). So the gain in use rests while `exact`
  // stays within kHoldSlack of it, drifting after it over kHoldSlow, and is
  // never further off than the slack. A frame that is a new sound (see
  // novelty()) takes the gain to `exact` at once, and it stays close on
  // `exact` (over kHoldFast) for the next kHoldCatch seconds, while the
  // frames still hold some of the sound before. A
  // knob that changes the curve takes the gain to `exact` at once. A frame
  // of nothing keeps the gain of the one before.
  void hold_level(const float* re, const float* im, bool snap) {
    float came = 0.0f;
    float leaves = 0.0f;
    low_weight(re, im, &came, &leaves);
    low_weight(right_[0], right_[1], &came, &leaves);
    const float* left = weighed_[0];
    const float* right = weighed_[1];
    for (int k = kExact; k < kBins - 1; ++k) {
      const float both = left[k] + right[k];
      came += both;
      leaves += gain_[k] * gain_[k] * both;
    }
    if (came > 1.0e-18f && leaves > 1.0e-30f) {
      const float exact = kit::clamp(std::sqrt(came / leaves), 1.0f / kMostHold, kMostHold);
      const bool fresh = novelty() > kOnsetShare;
      if (fresh) catching_ = catch_frames_;
      if (snap || fresh) {
        makeup_ = exact;
      } else {
        makeup_ = kit::clamp(makeup_, exact * (1.0f / kHoldSlack), exact * kHoldSlack);
        makeup_ += (catching_ > 0 ? hold_fast_ : hold_slow_) * (exact - makeup_);
        if (catching_ > 0) --catching_;
      }
      reading_[kHoldReading] = 8.6858896f * std::log(makeup_);
    }
  }

  // How much of the frames in hand is new: the share of their power that
  // lies over what their bands have held lately. A partial that beats comes
  // back into a band that held it a moment ago and is not new; a note on
  // other pitches is, and so is the first sound after a rest.
  float novelty() {
    const float* left = band_[0];
    const float* right = band_[1];
    float fresh = 0.0f;
    float all = 0.0f;
    for (int g = 0; g < kPoints; ++g) {
      const float now = band_weight_[g] * (left[g] + right[g]);
      const float over = now - kept_[g];
      if (over > 0.0f) fresh += over;
      kept_[g] += (over > 0.0f ? onset_rise_ : onset_fall_) * over;
      all += now;
    }
    return all > 0.0f ? fresh / all : 0.0f;
  }

  // --- the peak hold ---

  void rest_peaks() {
    for (float& peak : peaks_) peak = 0.0f;
    peak_at_ = 0;
    held_peak_ = 0.0f;
    hop_peak_ = 0.0f;
    ceiling_.snap(0.0f);
  }

  // The loudest input sample under the frames now measured: the left's and
  // the right's before it (the frame a hop earlier) reach back 2560 samples,
  // as the hop in hand and the four before it do.
  float frame_peak() const {
    float most = hop_peak_;
    for (int back = 1; back <= kFrameHops; ++back) {
      most = kit::max(most, peaks_[(peak_at_ + kPeakHops - back) % kPeakHops]);
    }
    return most;
  }

  // The ceiling for the sample now leaving: the loudest input sample of the
  // hops in the ring and of the one in hand, taken sample by sample so that
  // it does not depend on the block size. A hop ends when the left frame
  // was made; the newest input sample belongs to the next.
  float next_ceiling(float left, float right) {
    if (hop_done_) {
      hop_done_ = false;
      peaks_[peak_at_] = hop_peak_;
      peak_at_ = (peak_at_ + 1) % kPeakHops;
      hop_peak_ = 0.0f;
      held_peak_ = 0.0f;
      for (float peak : peaks_) held_peak_ = kit::max(held_peak_, peak);
    }
    // What is not a number or is past the limit never reaches the frames.
    const float a = std::fabs(left);
    const float b = std::fabs(right);
    if (a > hop_peak_ && a < kInputLimit) hop_peak_ = a;
    if (b > hop_peak_ && b < kInputLimit) hop_peak_ = b;
    const float target = kit::max(held_peak_, hop_peak_);
    if (target != ceiling_.target) {
      ceiling_.length = target > ceiling_.target ? kPeakRise : Stft::kHop;
      ceiling_.set_target(target);
    }
    return ceiling_.next();
  }

  // The stamped sample under the ceiling: itself up to kPeakKnee times the
  // ceiling, rounded off above and never past kPeakMost times it.
  static float bound(float wet, float ceiling) {
    const float size = std::fabs(wet);
    const float knee = kPeakKnee * ceiling;
    if (size <= knee || !(ceiling > 0.0f)) return wet;
    const float room = (kPeakMost - kPeakKnee) * ceiling;
    const float shaped = knee + room * kit::fast_tanh((size - knee) / room);
    return wet < 0.0f ? -shaped : shaped;
  }

  static constexpr int kPad = 26;  // room past the grid's ends for the widest Smooth

  Stft stft_[2];
  // Laid out in init() from the sample rate.
  float band_low_[kPoints] = {};     // a band's edges among the bins
  float band_high_[kPoints] = {};
  float band_scale_[kPoints] = {};   // one over its width
  float band_weight_[kPoints] = {};  // its share of the level
  uint16_t bin_index_[kBins] = {};   // where a bin lies on the grid
  float bin_fraction_[kBins] = {};
  float loudness_[kBins] = {};       // what a bin weighs in the level hold
  float built_in_[kBuiltIn][kPoints] = {};  // the built-in shapes in dB, before Smooth
  // What the frames leave behind.
  float power_[2][kBins] = {};   // each channel's newest frame, bin by bin
  float band_[2][kPoints] = {};  // and band by band
  float total_[2] = {0.0f, 0.0f};
  float captured_[kPoints] = {};  // band powers learned while Capture was On
  float follow_[kPoints] = {};    // the sound's own, over 80 ms
  float right_[2][kExact + 1] = {};  // the right channel's newest frame as it came, its low bins: real, imaginary
  float weighed_[2][kBins] = {};     // what each bin above them weighs on the way out, as it came
  int captured_frames_ = 0;
  int follow_frames_ = 0;
  bool capture_restart_ = false;
  // The colours (dB, after Smooth, trend taken off) and what is made of them.
  float captured_colour_[kPoints] = {};
  float built_colour_[kPoints] = {};
  float captured_trend_[kPoints] = {};  // the rest of each shape: colour + trend is the shape
  float built_trend_[kPoints] = {};
  float curve_[kPoints] = {};      // the curve in dB on the grid
  float grid_gain_[kPoints] = {};  // and as gains
  float gain_[kBins] = {};
  float makeup_ = 1.0f;     // the level hold's gain in use
  float hold_slow_ = 0.0f;  // how much of the way to the exact gain it goes in a frame, at rest
  float hold_fast_ = 0.0f;  // and while catching up
  float kept_[kPoints] = {};  // what each band has held lately, for novelty()
  float onset_rise_ = 0.0f;
  float onset_fall_ = 0.0f;
  int catch_frames_ = 0;
  int catching_ = 0;        // frames of catching up left
  bool knob_moved_ = false; // a knob changed the curve since the last frame
  bool captured_dirty_ = true;
  bool built_dirty_ = true;
  bool curve_dirty_ = true;
  float reading_[kNumReadings] = {};
  // Work space.
  float running_[kBins + 1] = {};
  float sum_[kPoints + 2 * kPad + 1] = {};
  float work_[kPoints] = {};
  float own_[kPoints] = {};
  float rest_[kPoints] = {};
  float broad_[kPoints] = {};
  // The peak hold: the loudest input sample of each of the last hops, of
  // the hop in hand, and the ceiling made of them.
  float peaks_[kPeakHops] = {};
  int peak_at_ = 0;
  float held_peak_ = 0.0f;
  float hop_peak_ = 0.0f;
  bool hop_done_ = false;
  kit::LinearRamp ceiling_;
  kit::Smoother mix_;
  kit::IdleGate idle_;
};

}  // namespace livemix
