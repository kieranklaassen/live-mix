#pragma once

// Imprint: a filter made by playing. It learns the tone colour of what it
// hears (the broad shape of the spectrum, not the notes), holds it, and
// presses it on everything that comes after.
//
//   in ─┬─────────────────────── delay 2304 (Stft::dry) ───────────────► dry ─┐
//       │                                                                      ├─► out
//       └─► kit::Stft 2048/512 ─► × gain per bin × level hold ─► resynthesis ─► wet ─┘
//                │                      ▲
//                └─► power per band ────┤ (both channels together)
//                      │                │
//                      ├─► Capture: average while On ──► captured colour ─┐
//                      ├─► the sound's own colour, 80 ms (for Replace)    ├─► curve
//                      └─► the sound's own level, 0.6 s (for the hold)    │
//                                     built-in shapes (Shape) ────────────┘
//
// Everything about colour lives on one grid: 217 points, 24 to the octave,
// from 40 Hz to 20.48 kHz, in decibels. It does not depend on the sample
// rate; the bins are laid on it in init().
//
// - A colour is a shape S on the grid: the captured one (the average power
//   in each band while Capture was On) or one of six built-in ones (bells in
//   dB at fixed frequencies on a slope). Smooth averages it over a width in
//   octaves (0.04 at 0, which is every bump the grid has, to 2 at 1). The
//   straight line that fits it best is its tilt; what is left is its colour
//   C, which is what the stamp is made of: a dark recording pressed on a
//   bright sound gives its formants and not its darkness.
// - The curve, in dB at grid point g:
//
//     H = Amount × C(g − Shift) + Replace × w × (tilt(g) − own(g)),   w = min(1, |Amount|)
//
//   Amount below zero turns the colour inside out. Shift moves it along the
//   grid, two points to the semitone. `own` is the incoming sound's own
//   shape (smoothed alike, its mean taken off): with Replace at 1 and Amount
//   at 1 the curve is S − own, so what comes out has the shape S whatever
//   went in. H is held to ±30 dB.
// - Level hold. A stamp must not be a volume knob. The curve is weighed
//   against the last 0.6 s of the input, band by band, and one gain for all
//   bins makes what comes out as strong as what went in; no frame may leave
//   more than 3 dB stronger than it came. So a held tone is never louder
//   than itself, and nothing piles up: there is no feedback anywhere.
// - Both channels share one curve and one hold (worked out when the left
//   frame comes, from the left frame and the right one before it), each is
//   filtered on its own: a mono sound stays mono bit for bit, the picture
//   between the channels is kept, and nothing is summed to mono.
// - Capture starts afresh each time it is switched On, with the first frame
//   loud enough to hear (-70 dBFS); until Learn seconds have been heard it is
//   a plain average, after that the newest Learn seconds count. Frames of
//   silence teach nothing, so what was learned survives rests and sleep, and
//   only init() forgets it.
// - Nothing is smoothed in time but Mix: a gain per bin that changes between
//   two frames is crossfaded by the overlap, over one frame (43 ms).
//
// Latency: 2304 samples (kit::Stft<2048, 512>::kLatency); the dry path is
// delayed alike, so Mix does not comb and Mix 0 is the input 2304 late.
// Storage: two Stft channels (88 KB each), two channels of bin powers and a
// few grid tables: under 220 KB in all. No delay line of its own.

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
  static constexpr float kSmoothSpan = 50.0f;
  static constexpr float kMaxGainDb = 30.0f;      // the curve is held to ± this
  static constexpr float kRangeDb = 48.0f;        // a shape reaches this far under its strongest band
  static constexpr float kFollowSeconds = 0.08f;  // the sound's own colour, for Replace
  static constexpr float kSteadySeconds = 0.6f;   // the sound's own level, for the hold
  static constexpr float kCeiling = 1.4125375f;   // +3 dB: no frame leaves stronger than this
  static constexpr float kMaxMakeup = 31.622777f; // the hold never gives or takes more than 30 dB
  // A frame under this teaches nothing: -70 dBFS of noise summed over the
  // bins (noise of RMS 1 reads 3/8 × Frame of power a bin, two channels).
  static constexpr float kGatePower = 2.0f * 0.375f * Stft::kFrame * kBins * 1.0e-7f;

  // What meter() carries to the display: the captured colour at every fourth
  // grid point, four points to a reading.
  static constexpr int kDisplayStep = 4;
  static constexpr int kDisplayPoints = (kPoints - 1) / kDisplayStep + 1;  // 55
  static constexpr int kPerReading = 4;
  static constexpr int kReadings = 14;
  static constexpr int kLevels = 64;  // whole dB from -32 to +31
  static_assert(kReadings * kPerReading >= kDisplayPoints, "every point needs a place in a reading");

  static constexpr int kBuiltIn = 6;
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
  // the tube is a pipe closed at one end (odd multiples of 170 Hz); the bell
  // is a struck bar's partials (1, 2.4, 4, 5.9, 8.9, 12.1 times 587 Hz); the
  // box is three low resonances and little above them.
  static constexpr BuiltIn kBuiltInShapes[kBuiltIn] = {
      {-3.0f, {{730.0f, 14.0f, 0.11f}, {1090.0f, 11.0f, 0.10f}, {2440.0f, 9.0f, 0.09f}, {3400.0f, 5.0f, 0.09f}}},
      {-5.0f, {{300.0f, 14.0f, 0.13f}, {870.0f, 9.0f, 0.10f}, {2240.0f, 4.0f, 0.09f}}},
      {-2.0f, {{270.0f, 12.0f, 0.13f}, {2290.0f, 12.0f, 0.08f}, {3010.0f, 10.0f, 0.08f}}},
      {-3.0f,
       {{170.0f, 12.0f, 0.05f},
        {510.0f, 11.0f, 0.05f},
        {850.0f, 10.0f, 0.05f},
        {1190.0f, 9.0f, 0.05f},
        {1530.0f, 8.0f, 0.05f},
        {1870.0f, 7.0f, 0.05f}}},
      {2.0f,
       {{587.0f, 6.0f, 0.04f},
        {1408.0f, 9.0f, 0.04f},
        {2350.0f, 11.0f, 0.04f},
        {3460.0f, 12.0f, 0.04f},
        {5220.0f, 12.0f, 0.04f},
        {7100.0f, 10.0f, 0.04f}}},
      {-7.0f, {{95.0f, 10.0f, 0.20f}, {210.0f, 12.0f, 0.14f}, {390.0f, 8.0f, 0.12f}, {640.0f, 5.0f, 0.10f}}},
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
    }
    for (int s = 0; s < kBuiltIn; ++s) {
      for (int g = 0; g < kPoints; ++g) built_in_[s][g] = built_in_db(s, static_cast<float>(g) / kPerOctave);
    }

    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kBins; ++k) power_[c][k] = 0.0f;
      for (int g = 0; g < kPoints; ++g) band_[c][g] = 0.0f;
      total_[c] = 0.0f;
    }
    for (int g = 0; g < kPoints; ++g) {
      captured_[g] = 0.0f;
      follow_[g] = 0.0f;
      steady_[g] = 0.0f;
      captured_colour_[g] = 0.0f;
      built_colour_[g] = 0.0f;
      grid_gain_[g] = 1.0f;
    }
    for (int k = 0; k < kBins; ++k) gain_[k] = 1.0f;
    for (float& value : reading_) value = 0.0f;
    captured_frames_ = 0;
    follow_frames_ = 0;
    steady_frames_ = 0;
    captured_slope_ = 0.0f;
    built_slope_ = 0.0f;
    makeup_ = 1.0f;
    capture_restart_ = false;
    captured_dirty_ = true;
    built_dirty_ = true;
    curve_dirty_ = true;
    mix_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    // What is in flight when the input stops: a latency and a frame.
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
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
        break;
      case kSmooth:
        built_dirty_ = true;
        captured_dirty_ = true;
        curve_dirty_ = true;
        break;
      case kMix:
        mix_.set(param(kMix), primed());
        break;
      case kLearn:
        captured_dirty_ = true;  // the "heard" reading is a share of it
        break;
      default:
        curve_dirty_ = true;
        break;
    }
  }

  // A built-in shape in dB at `octave` octaves above kLowHz, before Smooth:
  // bells in dB over the octaves, on a slope through the middle of the grid.
  static float built_in_db(int shape, float octave) {
    const BuiltIn& built = kBuiltInShapes[shape];
    float db = built.slope * (octave - kMidOctave);
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
  // 0 to 13: the captured colour (after Smooth, its tilt taken off, before
  // Shift and Amount) at every fourth grid point, each the mean of the four
  // grid steps around it, in whole dB from -32 to +31 as one digit of a number
  // in base 64, four points to a reading and the lowest point in the lowest
  // digit (64^4 is 2^24: a float holds it exactly). 14: the captured tilt in
  // dB per octave. 15: how much of the Learn time has been heard since
  // Capture was switched on, 0 (nothing captured) to 1. All are worked out
  // when a frame is learned; here they are only handed over.
  float meter(int index) const {
    if (index < 0 || index >= kReadings + 2) return 0.0f;
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
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // The stamp and the sound stay in step and in phase: a linear crossfade.
      const float mix = mix_.next();
      const float wet_left = stft_[0].process(in[0], [this](float* re, float* im) { lead_frame(re, im); });
      const float wet_right = stft_[1].process(in[1], [this](float* re, float* im) { second_frame(re, im); });
      out_left_[i] = stft_[0].dry() * (1.0f - mix) + wet_left * mix;
      out_right_[i] = stft_[1].dry() * (1.0f - mix) + wet_right * mix;
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
    if (heard > kGatePower) learn();
    if (captured_dirty_) refresh_captured();
    if (built_dirty_) refresh_built();
    const float replace = param(kReplace) * kit::min(1.0f, std::fabs(param(kAmount)));
    if (curve_dirty_ || (replace > 0.0f && heard > kGatePower)) compose(replace);
    hold_level();
    apply(re, im);
  }

  // The right channel's frame: the same curve and the same hold.
  void second_frame(float* re, float* im) {
    measure(1, re, im);
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

  // A frame loud enough to hear: the three things that listen take it in.
  void learn() {
    using namespace imprint;
    average(follow_, &follow_frames_, kFollowSeconds);
    average(steady_, &steady_frames_, kSteadySeconds);
    if (!capturing()) return;
    if (capture_restart_) {
      capture_restart_ = false;
      captured_frames_ = 0;
    }
    average(captured_, &captured_frames_, param(kLearn));
    captured_dirty_ = true;
  }

  // Band powers as a shape in dB, no deeper than kRangeDb under the strongest
  // band. False (and all zeros) when there is nothing in them.
  static bool to_db(const float* power, float* db) {
    float most = 0.0f;
    for (int g = 0; g < kPoints; ++g) most = kit::max(most, power[g]);
    if (!(most > 0.0f)) {
      for (int g = 0; g < kPoints; ++g) db[g] = 0.0f;
      return false;
    }
    const float least = most * 1.5848932e-5f;  // -48 dB
    for (int g = 0; g < kPoints; ++g) db[g] = 4.3429448f * std::log(kit::max(power[g], least));
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

  // Takes the straight line that fits a shape best off it: what is left is
  // the colour, the line's steepness in dB per octave the tilt.
  static void detrend(float* data, float* slope) {
    float mean = 0.0f;
    for (int g = 0; g < kPoints; ++g) mean += data[g];
    mean *= 1.0f / kPoints;
    float along = 0.0f;
    float square = 0.0f;
    for (int g = 0; g < kPoints; ++g) {
      const float octave = static_cast<float>(g) * (1.0f / kPerOctave) - kMidOctave;
      along += octave * (data[g] - mean);
      square += octave * octave;
    }
    *slope = along / square;
    for (int g = 0; g < kPoints; ++g) {
      const float octave = static_cast<float>(g) * (1.0f / kPerOctave) - kMidOctave;
      data[g] -= mean + *slope * octave;
    }
  }

  // The captured colour from what has been learned, and the display's
  // readings of it.
  void refresh_captured() {
    using namespace imprint;
    captured_dirty_ = false;
    captured_slope_ = 0.0f;
    if (to_db(captured_, captured_colour_)) {
      smooth_grid(captured_colour_, smooth_reach());
      detrend(captured_colour_, &captured_slope_);
    }
    for (int r = 0; r < kReadings; ++r) {
      int packed = 0;
      for (int j = kPerReading - 1; j >= 0; --j) {
        const int point = r * kPerReading + j;
        int level = kLevels / 2;
        if (point < kDisplayPoints) {
          const int g = point * kDisplayStep;
          float db = 0.0f;
          for (int o = -2; o <= 2; ++o) {
            db += (o == -2 || o == 2 ? 0.125f : 0.25f) * captured_colour_[kit::clamp_int(g + o, 0, kPoints - 1)];
          }
          level = kit::clamp_int(static_cast<int>(std::floor(db + 0.5f)) + kLevels / 2, 0, kLevels - 1);
        }
        packed = packed * kLevels + level;
      }
      reading_[r] = static_cast<float>(packed);
    }
    reading_[kReadings] = captured_slope_;
    const float listened = static_cast<float>(captured_frames_) * Stft::kHop / sample_rate();
    reading_[kReadings + 1] = kit::min(1.0f, listened / param(kLearn));
    if (param(kShape) < 0.5f) curve_dirty_ = true;
  }

  // The built-in colour Shape names, after Smooth.
  void refresh_built() {
    built_dirty_ = false;
    const int shape = kit::clamp_int(static_cast<int>(param(imprint::kShape) + 0.5f), 0, kBuiltIn) - 1;
    if (shape < 0) return;
    for (int g = 0; g < kPoints; ++g) built_colour_[g] = built_in_[shape][g];
    smooth_grid(built_colour_, smooth_reach());
    detrend(built_colour_, &built_slope_);
  }

  // The curve on the grid and then on the bins. `replace` is Replace × w.
  void compose(float replace) {
    using namespace imprint;
    curve_dirty_ = false;
    const bool captured = param(kShape) < 0.5f;
    const float* colour = captured ? captured_colour_ : built_colour_;
    const float slope = captured ? captured_slope_ : built_slope_;
    // Captured with nothing captured yet is no stamp at all: the sound passes.
    const bool stamp = !captured || captured_frames_ > 0;
    if (!stamp) replace = 0.0f;
    if (replace > 0.0f) {
      // The sound's own shape, smoothed like the stamp, its mean taken off.
      if (to_db(follow_, own_)) {
        smooth_grid(own_, smooth_reach());
        float mean = 0.0f;
        for (int g = 0; g < kPoints; ++g) mean += own_[g];
        mean *= 1.0f / kPoints;
        for (int g = 0; g < kPoints; ++g) own_[g] -= mean;
      } else {
        replace = 0.0f;
      }
    }
    const float amount = stamp ? param(kAmount) : 0.0f;
    const float shift = param(kShift) * (kPerOctave / 12.0f);  // in grid points
    for (int g = 0; g < kPoints; ++g) {
      const float at = kit::clamp(static_cast<float>(g) - shift, 0.0f, static_cast<float>(kPoints - 1));
      const int index = kit::clamp_int(static_cast<int>(at), 0, kPoints - 2);
      const float fraction = at - static_cast<float>(index);
      float db = amount * (colour[index] + fraction * (colour[index + 1] - colour[index]));
      if (replace > 0.0f) {
        const float octave = static_cast<float>(g) * (1.0f / kPerOctave) - kMidOctave;
        db += replace * (slope * octave - own_[g]);
      }
      grid_gain_[g] = std::exp(0.11512925f * kit::clamp(db, -kMaxGainDb, kMaxGainDb));
    }
    for (int k = 0; k < kBins; ++k) {
      const float* at = grid_gain_ + bin_index_[k];
      gain_[k] = at[0] + bin_fraction_[k] * (at[1] - at[0]);
    }
  }

  // The level hold: one gain for every bin that makes the last 0.6 s of the
  // input, under the curve as it is now, as strong as it was without it; and
  // this frame (with the right channel's last) may not leave more than
  // kCeiling stronger than it came.
  void hold_level() {
    float before = 0.0f;
    float after = 0.0f;
    for (int g = 0; g < kPoints; ++g) {
      const float weighed = band_weight_[g] * steady_[g];
      before += weighed;
      after += weighed * grid_gain_[g] * grid_gain_[g];
    }
    float makeup = 1.0f;
    if (before > 1.0e-20f && after > 1.0e-20f) {
      makeup = kit::clamp(std::sqrt(before / after), 1.0f / kMaxMakeup, kMaxMakeup);
    }
    const float came = total_[0] + total_[1];
    const float* left = power_[0];
    const float* right = power_[1];
    float leaves = 0.0f;
    for (int k = 0; k < kBins; ++k) leaves += gain_[k] * gain_[k] * (left[k] + right[k]);
    if (leaves > 1.0e-20f && came > 0.0f) makeup = kit::min(makeup, kCeiling * std::sqrt(came / leaves));
    makeup_ = makeup;
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
  float built_in_[kBuiltIn][kPoints] = {};  // the built-in shapes in dB, before Smooth
  // What the frames leave behind.
  float power_[2][kBins] = {};   // each channel's newest frame, bin by bin
  float band_[2][kPoints] = {};  // and band by band
  float total_[2] = {0.0f, 0.0f};
  float captured_[kPoints] = {};  // band powers learned while Capture was On
  float follow_[kPoints] = {};    // the sound's own, over 80 ms
  float steady_[kPoints] = {};    // and over 0.6 s
  int captured_frames_ = 0;
  int follow_frames_ = 0;
  int steady_frames_ = 0;
  bool capture_restart_ = false;
  // The colours (dB, after Smooth, tilt taken off) and what is made of them.
  float captured_colour_[kPoints] = {};
  float built_colour_[kPoints] = {};
  float captured_slope_ = 0.0f;
  float built_slope_ = 0.0f;
  float grid_gain_[kPoints] = {};
  float gain_[kBins] = {};
  float makeup_ = 1.0f;
  bool captured_dirty_ = true;
  bool built_dirty_ = true;
  bool curve_dirty_ = true;
  float reading_[kReadings + 2] = {};
  // Work space.
  float running_[kBins + 1] = {};
  float sum_[kPoints + 2 * kPad + 1] = {};
  float work_[kPoints] = {};
  float own_[kPoints] = {};
  kit::Smoother mix_;
  kit::IdleGate idle_;
};

}  // namespace livemix
