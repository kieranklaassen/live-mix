#pragma once

// Sift: a running three-way split of a sound into its tones, its attacks and
// its air, with a level and a blur for each part.
//
//   in ─► Stft ─► keep 9 frames ─► split the middle one ─┬─ tones ─► hold ────► × Tones ─┐
//    │    2048/512                 (4 frames ago)        ├─ air ───► scatter ─► × Air ───┴─► resynthesis ──────────┐
//    │                                                   └─ attacks ► soften ─► × Attacks ─► resynthesis ─► late ─┴─► limit ─► wet
//    └─► delay 4352 ───────────────────────────────────────────────────────────────────────────────────────────────► dry
//
// The split is made per bin on the frame that came four frames ago, so that
// it can look as far ahead as behind:
//
// - steady[k] is the median of the bin's magnitude over nine frames, four
//   either side: what has stayed put in frequency for at least five frames
//   (53 ms at 48 kHz). A click is in four frames at the most and is not in it.
// - sudden[k] is the third smallest of nine magnitudes across frequency, at
//   every second bin up to eight either side: what is there over at least two
//   thirds of a band 17 bins wide (400 Hz at 48 kHz). A partial is four bins
//   wide and up to three of them in the band are not in it. It is raised by
//   kAcrossBias so that steady noise reads the same both ways.
// - tones   = 1 / (1 + (kMargin × sudden / steady)^slope)
//   attacks = 1 / (1 + (kMargin × steady / sudden)^slope)
//   air     = 1 - tones - attacks: what is neither by a margin of 6 dB.
//   Sharpness is the slope, 1.5 to 12: low shares a doubtful bin between the
//   parts, high gives each its own. The three always add up to one, so with
//   the three levels at unity and no blur the output is the input (to 2e-6).
//
// Each channel is split on its own, by the same arithmetic: a mono input
// stays mono while Scatter is down, and one side's click is not taken out of
// the other side's tone.
//
// - Edge: the first moment of a tone goes with the attacks. A bin's tone is
//   new by how far it stands over what the bin held before (the second
//   largest of the four frames before): that share of it, times Edge, is
//   moved from the tones to the attacks. At Edge 0 an attack is only what is
//   everywhere in frequency for a moment; at 1 it is also the first 30 ms or
//   so of every note, and the tones begin without their start.
// - Hold: a tone bin the input lets go of rings on at the level it had,
//   falling 60 dB in 12 s × Hold^1.5, and goes on turning by the turn it was
//   last measured to make, so a held partial stays at its pitch.
// - Soften: each attack bin's power runs through two one-pole smoothers
//   (0.1 s × Soften² each), which keeps its energy and turns its edge into a
//   rise and a fall; what sounds beyond the frame's own share is given fresh
//   random phase, so the puff is diffuse and never a frame replayed.
// - Late: the attacks are resynthesised apart and delayed in time, 0 to
//   300 ms; a change crossfades between the old delay and the new in 20 ms.
// - Scatter: the air's phase is turned by a fresh random angle each frame,
//   up to a quarter turn one way on the left and the other way on the right,
//   so the two sides agree by sinc(Scatter).
//
// Latency: the Stft's 2304 samples and the four frames the split looks
// ahead, 2048: 4352 samples ("latencySamples"). The dry path is delayed by
// as much, so Mix (a linear crossfade) does not comb and at Mix 0 the output
// is the input 4352 samples late, bit for bit.
//
// Storage, per channel: two Stfts (88 KB each), eight frames of spectrum
// (66 KB) and nine of magnitudes (37 KB), seven floats a bin of state (29 KB),
// the attacks' delay (32768 samples, 300 ms at 96 kHz) and the dry path's
// (4096): about 0.8 MB for both.
//
// Cost: the two medians are sorting networks of minimum and maximum over nine
// values, without a branch, a sort or any state: 19 exchanges for the middle
// of nine along time, and the 25 of a full sort along frequency, of which the
// compiler keeps the ones the third smallest depends on. They run on the
// bits of the magnitudes (see bits_of), about 20 ns a bin each in WASM.
// At 96 kHz the frame is half as long in time and the bins twice as wide; the
// split is the same in frames and bins.

#include <cstring>

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Sift : public kit::DeviceBase<sift::kNumParams> {
 public:
  using Stft = kit::Stft<2048, 512>;
  static constexpr int kBins = Stft::kBins;
  // Frames the split looks ahead, and the frames the median along time reads.
  static constexpr int kLook = 4;
  static constexpr int kSpan = 2 * kLook + 1;
  static constexpr int kLookSamples = kLook * Stft::kHop;
  static constexpr int kLatency = Stft::kLatency + kLookSamples;  // 4352: "latencySamples"

  // The gain a level in dB gives its part: decibels, taken down to nothing at
  // the bottom of the range (-30 dB) and exactly 1 at 0 dB.
  static float level_gain(float db) {
    const float floor = kit::db_to_gain(sift::kParamMin[sift::kTones]);
    return kit::max(0.0f, (kit::db_to_gain(db) - floor) / (1.0f - floor));
  }

  // A magnitude as the whole number its bits spell, and back. Magnitudes are
  // never negative, and floats that are not negative stand in the order of
  // their bits: the medians are taken on the bits, where the smaller and the
  // larger of two are each one instruction and a float's are a branch (in
  // WASM under V8 the same networks on floats cost three times as much).
  static int32_t bits_of(float magnitude) {
    int32_t bits;
    std::memcpy(&bits, &magnitude, sizeof bits);
    return bits;
  }
  static float magnitude_of(int32_t bits) {
    float magnitude;
    std::memcpy(&magnitude, &bits, sizeof magnitude);
    return magnitude;
  }

  // The middle of nine values: 19 exchanges, no branch.
  template <typename T>
  static T median9(T a, T b, T c, T d, T e, T f, T g, T h, T i) {
    order(b, c), order(e, f), order(h, i);
    order(a, b), order(d, e), order(g, h);
    order(b, c), order(e, f), order(h, i);
    order(a, d), order(f, i), order(e, h);
    order(d, g), order(b, e), order(c, f);
    order(e, h), order(e, c), order(g, e);
    order(e, c);
    return e;
  }

  // The third smallest of nine values: a sort of nine in 25 exchanges (three
  // columns of three sorted, then merged), read at its third place.
  template <typename T>
  static T third9(T a, T b, T c, T d, T e, T f, T g, T h, T i) {
    order(a, b), order(d, e), order(g, h);
    order(b, c), order(e, f), order(h, i);
    order(a, b), order(d, e), order(g, h);
    order(a, d), order(d, g), order(a, d);
    order(b, e), order(e, h), order(b, e);
    order(c, f), order(f, i), order(c, f);
    order(b, d), order(f, h), order(c, g);
    order(e, g), order(c, e);
    order(c, d), order(f, g);
    return c;
  }

  // The second largest of four values.
  template <typename T>
  static T second4(T a, T b, T c, T d) {
    order(a, b), order(c, d);
    const T lower = b < d ? b : d;
    const T higher = a < c ? c : a;
    return lower < higher ? higher : lower;
  }

  // How much of a bin's tone is new, 0 to 1, by what the bin held before as
  // a share of what it holds now: a smooth step down from kEdgeAll to kEdgeNone.
  static constexpr float kEdgeAll = 0.25f;
  static constexpr float kEdgeNone = 0.75f;
  static float newness(float held_before) {
    const float t = kit::clamp((kEdgeNone - held_before) / (kEdgeNone - kEdgeAll), 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
  }

  // Hold as the time a let-go tone takes to fall 60 dB, in seconds.
  static float hold_seconds(float hold) { return kMaxHoldSeconds * hold * std::sqrt(hold); }
  static constexpr float kMaxHoldSeconds = 12.0f;

  void init(float sample_rate) {
    using namespace sift;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int i = 0; i < kAngles; ++i) {
      const double angle = 2.0 * 3.14159265358979323846 * i / kAngles;
      angle_cos_[i] = static_cast<float>(std::cos(angle));
      angle_sin_[i] = static_cast<float>(std::sin(angle));
    }
    // What fresh phase within ±spread half turns costs in level, undone: the
    // share sinc(spread) of a bin stays in step from frame to frame, the rest
    // adds as power and comes back 6 dB down at a quarter hop.
    for (int i = 0; i <= kSpreadSteps; ++i) {
      const float c = sinc(static_cast<float>(i) / kSpreadSteps);
      spread_gain_[i] = 1.0f / std::sqrt(c * c + 0.25f * (1.0f - c * c));
    }
    for (int c = 0; c < 2; ++c) {
      Channel& channel = channel_[c];
      // Left works as soon as a frame is whole, right half a hop later.
      const int stagger = c == 0 ? 0 : Stft::kMaxStagger;
      channel.body.init(stagger);
      channel.strikes.init(stagger);
      channel.late.clear();
      channel.dry.clear();
      for (int k = 0; k < kBins; ++k) {
        for (int n = 0; n < kKeep; ++n) {
          channel.re[n][k] = 0.0f;
          channel.im[n][k] = 0.0f;
        }
        for (int n = 0; n < kSpan; ++n) channel.magnitude[n][k] = 0;
        channel.held[k] = 0.0f;
        channel.phase_re[k] = 1.0f;
        channel.phase_im[k] = 0.0f;
        channel.turn_re[k] = 1.0f;
        channel.turn_im[k] = 0.0f;
        channel.rise[k] = 0.0f;
        channel.puff[k] = 0.0f;
      }
      channel.row = 0;
      channel.slot = 0;
      channel.silent = kSpan + 1;
      channel.ringing = false;
      channel.puffing = false;
      channel.alive = false;
      for (int part = 0; part < kParts; ++part) {
        for (int n = 0; n < kMeterFrames; ++n) channel.power[part][n] = 0.0f;
        channel.level[part] = 0.0f;
      }
      channel.meter_at = 0;
    }
    for (int k = 0; k < kBins; ++k) {
      steady_[k] = 0.0f;
      sudden_[k] = 0.0f;
      tone_[k] = 0.0f;
      strike_[k] = 0.0f;
      strike_re_[k] = 0.0f;
      strike_im_[k] = 0.0f;
    }
    for (int k = 0; k < kBins + 2 * kReach; ++k) padded_[k] = 0;
    mask_dirty_ = true;
    mix_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    fade_step_ = 1.0f / (kLateFadeSeconds * sr);
    fade_ = 0.0f;
    fading_ = false;
    // What is in flight once the last bin has gone: the frames kept, a
    // latency and a frame of each Stft, and the longest the attacks are late.
    idle_.reset(sr, static_cast<float>(kLatency + Stft::kFrame + 2 * Stft::kHop) / sr +
                        kParamMax[kLate] * 0.001f + 0.02f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    late_now_ = late_next_ = late_target_;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display: how
  // strong each part is now as the split finds it and its blur leaves it
  // (Hold on the tones, Soften on the attacks), before its level and before
  // Late: the root mean square over both sides, 0.707 for a full-scale sine,
  // the highest of the newest four frames so that a reading taken thirty
  // times a second does not miss a click. 0 tones, 1 attacks, 2 air. Asleep
  // they read nothing.
  float meter(int index) const {
    if (index < 0 || index >= kParts || idle_.asleep()) return 0.0f;
    return std::sqrt(0.5f * (channel_[0].level[index] + channel_[1].level[index]) * kPowerScale);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || channel_[0].alive || channel_[1].alive)) {
      silence_output(frames);
      for (Channel& channel : channel_) {
        channel.body.skip(frames);  // the frame clocks run on through the sleep
        channel.strikes.skip(frames);
      }
      // Knobs moved while asleep snap: nothing glides in under the next note.
      mix_.snap(mix_.target);
      late_now_ = late_next_ = late_target_;
      fading_ = false;
      fade_ = 0.0f;
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float mix = mix_.next();
      // Late: one delay at rest, two crossfaded while it changes.
      if (fading_) {
        fade_ += fade_step_;
        if (fade_ >= 1.0f) {
          late_now_ = late_next_;
          fading_ = false;
          fade_ = 0.0f;
        }
      } else if (late_target_ != late_now_) {
        late_next_ = late_target_;
        fading_ = true;
        fade_ = 0.0f;
      }
      float out[2];
      for (int c = 0; c < 2; ++c) {
        Channel& channel = channel_[c];
        const float body = channel.body.process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        // The attacks of the same frame, left in strike_re_ and strike_im_ by frame().
        const float strikes = channel.strikes.process(0.0f, [this](float* re, float* im) {
          for (int k = 0; k < kBins; ++k) {
            re[k] = strike_re_[k];
            im[k] = strike_im_[k];
          }
        });
        channel.late.write(strikes);
        float struck = channel.late.read(late_now_ + 1);
        if (fading_) struck += (channel.late.read(late_next_ + 1) - struck) * fade_;
        channel.dry.write(channel.body.dry());
        const float dry = channel.dry.read(kLookSamples + 1);
        // Linear up to ±1, never past ±2.
        const float wet = 2.0f * kit::soft_clip(0.5f * (body + struck));
        out[c] = dry * (1.0f - mix) + wet * mix;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kKeep = 8;  // frames of spectrum kept: the one split, the one before it, and the look ahead
  static constexpr int kReach = 8;  // bins either side the median along frequency reads, at every second one
  static constexpr int kParts = 3;  // tones, attacks, air
  static constexpr int kMeterFrames = 4;
  static constexpr int kMaskSteps = 256;
  static constexpr int kAngles = 2048;  // steps per turn of the angle table
  static constexpr int kSpreadSteps = 64;
  static constexpr int kLateSize = 32768;  // 300 ms at 96 kHz is 28800
  static constexpr int kDrySize = 4096;
  // A part has a bin when it is this many times the other (6 dB), and the
  // slope of that step runs from kSoftSlope to kSoftSlope × kSlopeRange.
  static constexpr float kMargin = 2.0f;
  static constexpr float kSoftSlope = 1.5f;
  static constexpr float kSlopeRange = 8.0f;
  // The third smallest of nine across frequency reads steady noise this much
  // under what the middle of nine along time reads it (measured: 3.26 dB).
  static constexpr float kAcrossBias = 1.455f;
  static constexpr float kMaxSoftenSeconds = 0.1f;
  // The furthest Scatter turns the air's phase, in half turns either way:
  // from here on the two sides have nothing left in common (measured 0.03).
  static constexpr float kScatterReach = 0.75f;
  static constexpr float kLateFadeSeconds = 0.02f;
  // A bin under this holds nothing: -174 dBFS (a full-scale sine reads 512).
  static constexpr float kFloor = 1.0e-6f;
  static constexpr float kPowerFloor = kFloor * kFloor;
  // The mean square of a signal from the sum of its bins' powers: a
  // full-scale sine (0.5) reads 1.5 × kFullScale² over its three bins.
  static constexpr float kPowerScale = 1.0f / (3.0f * Stft::kFullScale * Stft::kFullScale);

  struct Channel {
    Stft body;     // analysis, and the tones and the air resynthesised
    Stft strikes;  // the attacks resynthesised, fed silence
    kit::DelayLine<kLateSize> late;
    kit::DelayLine<kDrySize> dry;
    float re[kKeep][kBins];          // the newest frames' spectra
    float im[kKeep][kBins];
    int32_t magnitude[kSpan][kBins];  // and the magnitudes of the newest nine, as bits_of() gives them
    float held[kBins];               // Hold: what each tone bin holds
    float phase_re[kBins], phase_im[kBins];  // its phase as a unit vector
    float turn_re[kBins], turn_im[kBins];    // its phase advance per frame
    float rise[kBins], puff[kBins];  // Soften: the attack power after one smoother and after two
    int row;                         // where the next frame's magnitudes go
    int slot;                        // where the next frame's spectrum goes
    int silent;                      // frames of silence in a row, up to kSpan + 1
    bool ringing;                    // any tone bin held
    bool puffing;                    // any attack bin still fading
    bool alive;                      // anything kept that is not zero
    float power[kParts][kMeterFrames];  // each part's power in the newest frames, for meter()
    float level[kParts];             // the highest of them
    int meter_at;
  };

  template <typename T>
  static void order(T& low, T& high) {
    const T a = low;
    const T b = high;
    low = a < b ? a : b;
    high = a < b ? b : a;
  }

  // sin(πx) / (πx): how far a bin stays in step when its phase is turned by
  // a random angle within ±x half turns.
  static float sinc(float x) {
    if (x < 1.0e-4f) return 1.0f;
    return std::sin(kit::kPi * x) / (kit::kPi * x);
  }

  void apply(int id) {
    using namespace sift;
    switch (id) {
      case kTones:
        gain_[0] = level_gain(param(id));
        break;
      case kAttacks:
        gain_[1] = level_gain(param(id));
        break;
      case kAir:
        gain_[2] = level_gain(param(id));
        break;
      case kSharpness:
        mask_dirty_ = true;
        break;
      case kLate:
        late_target_ = kit::clamp_int(static_cast<int>(param(id) * 0.001f * sample_rate() + 0.5f), 0, kLateSize - 8);
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the blurs are read once per frame
    }
  }

  // The share of a bin the tones get, by where steady / (steady + sudden)
  // stands from 0 to 1; the attacks' share is the same curve read from the
  // other end.
  void update_mask() {
    const float slope = kSoftSlope * std::pow(kSlopeRange, param(sift::kSharpness));
    mask_[0] = 0.0f;
    mask_[kMaskSteps] = 1.0f;
    for (int i = 1; i < kMaskSteps; ++i) {
      const float q = static_cast<float>(i) / kMaskSteps;
      mask_[i] = 1.0f / (1.0f + std::pow(kMargin * (1.0f - q) / q, slope));
    }
    mask_dirty_ = false;
  }

  // One frame of channel c: the newest spectrum comes in, and the one of
  // kLook frames ago goes out in its place, split and put together again:
  // tones and air in re and im, the attacks in strike_re_ and strike_im_.
  // Every setting is read here, once per frame: the overlap crossfades a change.
  void frame(int c, float* re, float* im) {
    using namespace sift;
    Channel& channel = channel_[c];
    if (mask_dirty_) update_mask();

    // Keep the frame and its magnitudes.
    {
      float* keep_re = channel.re[channel.slot];
      float* keep_im = channel.im[channel.slot];
      int32_t* now = channel.magnitude[channel.row];
      float loudest = 0.0f;
      for (int k = 0; k < kBins; ++k) {
        const float a = re[k];
        const float b = im[k];
        keep_re[k] = a;
        keep_im[k] = b;
        const float size = std::sqrt(a * a + b * b);
        now[k] = bits_of(size);
        loudest = size > loudest ? size : loudest;
      }
      channel.silent = loudest > 0.0f ? 0 : (channel.silent < kSpan ? channel.silent + 1 : kSpan);
    }
    // rows[j] is the magnitudes of j frames ago; the frame split is rows[kLook].
    const int32_t* rows[kSpan];
    for (int j = 0; j < kSpan; ++j) rows[j] = channel.magnitude[(channel.row + kSpan - j) % kSpan];
    const int32_t* level = rows[kLook];
    const int32_t* before = rows[kLook + 1];
    const float* xr = channel.re[(channel.slot - kLook) & (kKeep - 1)];
    const float* xi = channel.im[(channel.slot - kLook) & (kKeep - 1)];
    const float* pr = channel.re[(channel.slot - kLook - 1) & (kKeep - 1)];
    const float* pi = channel.im[(channel.slot - kLook - 1) & (kKeep - 1)];
    channel.row = (channel.row + 1) % kSpan;
    channel.slot = (channel.slot + 1) & (kKeep - 1);

    float power[kParts] = {0.0f, 0.0f, 0.0f};
    if (channel.silent >= kSpan && !channel.ringing && !channel.puffing) {
      // Nothing kept and nothing held: silence out, exactly.
      for (int k = 0; k < kBins; ++k) {
        re[k] = 0.0f;
        im[k] = 0.0f;
        strike_re_[k] = 0.0f;
        strike_im_[k] = 0.0f;
      }
    } else {
      split(rows, level);
      power[0] = tones(channel, level, before, xr, xi, pr, pi, re, im);
      power[2] = air(c, channel.body.frame(), xr, xi, re, im);
      power[1] = attacks(channel, channel.body.frame(), level, xr, xi);
    }

    for (int part = 0; part < kParts; ++part) {
      channel.power[part][channel.meter_at] = power[part];
      float highest = 0.0f;
      for (int n = 0; n < kMeterFrames; ++n) highest = kit::max(highest, channel.power[part][n]);
      channel.level[part] = highest;
    }
    channel.meter_at = (channel.meter_at + 1) % kMeterFrames;
    channel.alive = channel.silent < kSpan || channel.ringing || channel.puffing;
  }

  // The shares of the frame split: tone_[k] and strike_[k]; the air is the rest.
  void split(const int32_t* const* rows, const int32_t* level) {
    for (int k = 0; k < kBins; ++k) {
      steady_[k] = magnitude_of(median9(rows[0][k], rows[1][k], rows[2][k], rows[3][k], rows[4][k], rows[5][k],
                                        rows[6][k], rows[7][k], rows[8][k]));
    }
    // The spectrum of a real signal mirrors itself about 0 Hz and about the
    // top bin, and so does what the median reads past either end.
    for (int k = 0; k < kBins; ++k) padded_[kReach + k] = level[k];
    for (int j = 1; j <= kReach; ++j) {
      padded_[kReach - j] = level[j];
      padded_[kReach + kBins - 1 + j] = level[kBins - 1 - j];
    }
    for (int k = 0; k < kBins; ++k) {
      const int32_t* w = padded_ + k;
      sudden_[k] = kAcrossBias * magnitude_of(third9(w[0], w[2], w[4], w[6], w[8], w[10], w[12], w[14], w[16]));
    }
    for (int k = 0; k < kBins; ++k) {
      const float sum = steady_[k] + sudden_[k];
      if (!(sum > 1.0e-20f)) {
        // Neither steady nor sudden here: whatever there is, is air.
        tone_[k] = 0.0f;
        strike_[k] = 0.0f;
        continue;
      }
      const float q = steady_[k] / sum * kMaskSteps;
      int i = static_cast<int>(q);
      if (i > kMaskSteps - 1) i = kMaskSteps - 1;
      const float f = q - static_cast<float>(i);
      const int j = kMaskSteps - 1 - i;
      tone_[k] = mask_[i] + (mask_[i + 1] - mask_[i]) * f;
      strike_[k] = mask_[j + 1] + (mask_[j] - mask_[j + 1]) * f;
    }
    // Edge: the first moment of a tone goes with the attacks. A bin's tone is
    // new by how far it stands over what the bin held before, the second
    // largest of the four frames before this one: all of it is new under a
    // quarter of the bin's level now, none of it from three quarters up.
    const float edge = param(sift::kEdge);
    if (edge > 0.0f) {
      for (int k = 0; k < kBins; ++k) {
        const float now = magnitude_of(level[k]);
        const float before = magnitude_of(second4(rows[kLook + 1][k], rows[kLook + 2][k], rows[kLook + 3][k], rows[kLook + 4][k]));
        if (before >= kEdgeNone * now) continue;
        const float moved = tone_[k] * edge * newness(before / now);
        tone_[k] -= moved;
        strike_[k] += moved;
      }
    }
  }

  // The tones into re and im, at their level; returns their power.
  float tones(Channel& channel, const int32_t* level, const int32_t* before, const float* xr, const float* xi,
              const float* pr, const float* pi, float* re, float* im) {
    using namespace sift;
    const float gain = gain_[0];
    const float hold = param(kHold);
    float power = 0.0f;
    if (!(hold > 0.0f)) {
      if (channel.ringing) {
        for (int k = 0; k < kBins; ++k) channel.held[k] = 0.0f;
        channel.ringing = false;
      }
      for (int k = 0; k < kBins; ++k) {
        const float share = tone_[k];
        const float size = share * magnitude_of(level[k]);
        power += size * size;
        re[k] = gain * share * xr[k];
        im[k] = gain * share * xi[k];
      }
      return power;
    }
    // -60 dB after hold_seconds(), per frame.
    const float decay = std::exp(-6.9077553f * Stft::kHop / (hold_seconds(hold) * sample_rate()));
    bool ringing = false;
    for (int k = 0; k < kBins; ++k) {
      const float a = xr[k];
      const float b = xi[k];
      const float size = magnitude_of(level[k]);
      const float want = tone_[k] * size;
      float held = channel.held[k] * decay;
      // The turn since the frame before, measured only while the bin's input
      // holds up: the frames in which a sound is cut off have the phase of
      // the cut, not of the sound. Kept unnormalised until needed.
      const float was = magnitude_of(before[k]);
      if (size > 0.1f * held && size * size >= 0.8f * was * was) {
        const float tr = a * pr[k] + b * pi[k];
        const float ti = b * pr[k] - a * pi[k];
        if (tr * tr + ti * ti > 1.0e-24f) {
          channel.turn_re[k] = tr;
          channel.turn_im[k] = ti;
        }
      }
      float ur, ui;
      if (want >= held) {
        // Driven by the input: its own level and its own phase.
        held = want;
        if (size > 1.0e-12f) {
          const float inverse = 1.0f / size;
          ur = a * inverse;
          ui = b * inverse;
        } else {
          ur = 1.0f;
          ui = 0.0f;
        }
      } else {
        // Let go of: what it held, turned on by the turn it last made.
        float tr = channel.turn_re[k];
        float ti = channel.turn_im[k];
        const float length = tr * tr + ti * ti;
        if (length < 0.999f || length > 1.001f) {
          const float inverse = 1.0f / std::sqrt(length);
          tr *= inverse;
          ti *= inverse;
          channel.turn_re[k] = tr;
          channel.turn_im[k] = ti;
        }
        ur = channel.phase_re[k] * tr - channel.phase_im[k] * ti;
        ui = channel.phase_re[k] * ti + channel.phase_im[k] * tr;
        const float keep = 1.5f - 0.5f * (ur * ur + ui * ui);  // back to unit length
        ur *= keep;
        ui *= keep;
      }
      if (held < kFloor) held = 0.0f;
      channel.held[k] = held;
      channel.phase_re[k] = ur;
      channel.phase_im[k] = ui;
      ringing = ringing || held > 0.0f;
      power += held * held;
      re[k] = gain * held * ur;
      im[k] = gain * held * ui;
    }
    channel.ringing = ringing;
    return power;
  }

  // The air added to re and im, at its level; returns its power.
  float air(int c, uint32_t number, const float* xr, const float* xi, float* re, float* im) {
    using namespace sift;
    const float scatter = param(kScatter);
    float power = 0.0f;
    if (!(scatter > 0.0f)) {
      const float gain = gain_[2];
      for (int k = 0; k < kBins; ++k) {
        const float share = kit::max(0.0f, 1.0f - tone_[k] - strike_[k]);
        const float a = share * xr[k];
        const float b = share * xi[k];
        power += a * a + b * b;
        re[k] += gain * a;
        im[k] += gain * b;
      }
      return power;
    }
    // The same angles for both sides and for this frame whatever was slept
    // through; the left turns one way by them and the right the other, by up
    // to `reach` half turns each: the square root of Scatter, so that the
    // two sides agree by about 1 - Scatter (see the header).
    kit::Rng rng;
    rng.seed(0x9E3779B9u ^ (number * 2654435761u));
    for (int warm = 0; warm < 4; ++warm) rng.next_u32();
    const float reach = kScatterReach * std::sqrt(scatter);
    const float steps = (c == 0 ? 0.5f : -0.5f) * reach * kAngles;
    const float gain = gain_[2] * spread_gain_[static_cast<int>(reach * kSpreadSteps + 0.5f)];
    for (int k = 0; k < kBins; ++k) {
      const float share = kit::max(0.0f, 1.0f - tone_[k] - strike_[k]);
      const float a = share * xr[k];
      const float b = share * xi[k];
      power += a * a + b * b;
      const int index = static_cast<int>(rng.bipolar() * steps + static_cast<float>(kAngles)) & (kAngles - 1);
      const float qr = angle_cos_[index];
      const float qi = angle_sin_[index];
      re[k] += gain * (a * qr - b * qi);
      im[k] += gain * (a * qi + b * qr);
    }
    return power;
  }

  // The attacks into strike_re_ and strike_im_, at their level; returns their power.
  float attacks(Channel& channel, uint32_t number, const int32_t* level, const float* xr, const float* xi) {
    using namespace sift;
    const float gain = gain_[1];
    const float soften = param(kSoften);
    float power = 0.0f;
    if (!(soften > 0.0f)) {
      if (channel.puffing) {
        for (int k = 0; k < kBins; ++k) {
          channel.rise[k] = 0.0f;
          channel.puff[k] = 0.0f;
        }
        channel.puffing = false;
      }
      for (int k = 0; k < kBins; ++k) {
        const float share = strike_[k];
        const float size = share * magnitude_of(level[k]);
        power += size * size;
        strike_re_[k] = gain * share * xr[k];
        strike_im_[k] = gain * share * xi[k];
      }
      return power;
    }
    // Two smoothers of 0.1 s × Soften² each on the bin's power: the sum of it
    // over time is what it was, so the attack keeps its energy.
    const float pole = 1.0f - std::exp(-static_cast<float>(Stft::kHop) / (kMaxSoftenSeconds * soften * soften * sample_rate()));
    // The same angles for both sides: a mono attack stays in the middle.
    kit::Rng rng;
    rng.seed(0x7F4A7C15u ^ (number * 2246822519u));
    for (int warm = 0; warm < 4; ++warm) rng.next_u32();
    const float half_turn = 0.5f * kAngles;
    bool puffing = false;
    for (int k = 0; k < kBins; ++k) {
      const float size = magnitude_of(level[k]);
      const float own = strike_[k] * size;
      const float now = own * own;
      float rise = channel.rise[k];
      float puff = channel.puff[k];
      rise += pole * (now - rise);
      puff += pole * (rise - puff);
      if (rise < kPowerFloor) rise = 0.0f;
      if (puff < kPowerFloor) puff = 0.0f;
      channel.rise[k] = rise;
      channel.puff[k] = puff;
      puffing = puffing || rise > 0.0f || puff > 0.0f;
      power += puff;
      const float out = std::sqrt(puff);
      // How much of what sounds is this frame's own. That share keeps the
      // frame's phase, turned by up to ±Soften half turns; the rest, which
      // is the past still fading, has no phase of its own and gets any.
      const float share = (now >= puff || !(puff > 0.0f)) ? 1.0f : own / out;
      const float spread = 1.0f - share * (1.0f - soften);
      float ur = 1.0f;
      float ui = 0.0f;
      if (size > 1.0e-12f) {
        const float inverse = 1.0f / size;
        ur = xr[k] * inverse;
        ui = xi[k] * inverse;
      }
      const int index = static_cast<int>(rng.bipolar() * spread * half_turn + static_cast<float>(kAngles)) & (kAngles - 1);
      const float qr = angle_cos_[index];
      const float qi = angle_sin_[index];
      const float scaled = gain * out * spread_gain_[static_cast<int>(spread * kSpreadSteps + 0.5f)];
      strike_re_[k] = scaled * (ur * qr - ui * qi);
      strike_im_[k] = scaled * (ur * qi + ui * qr);
    }
    channel.puffing = puffing;
    return power;
  }

  Channel channel_[2];
  // One frame's work, shared by the two channels (their frames never meet).
  float steady_[kBins];
  float sudden_[kBins];
  float tone_[kBins];    // the tones' share of each bin
  float strike_[kBins];  // the attacks' share
  int32_t padded_[kBins + 2 * kReach];
  float strike_re_[kBins];
  float strike_im_[kBins];
  float mask_[kMaskSteps + 1];
  float spread_gain_[kSpreadSteps + 1];
  float angle_cos_[kAngles];
  float angle_sin_[kAngles];
  float gain_[kParts] = {1.0f, 1.0f, 1.0f};
  kit::Smoother mix_;
  kit::IdleGate idle_;
  int late_target_ = 0;  // where Late stands, in samples
  int late_now_ = 0;     // the delay that sounds
  int late_next_ = 0;    // the one it is crossfading to
  float fade_ = 0.0f;
  float fade_step_ = 0.0f;
  bool fading_ = false;
  bool mask_dirty_ = true;
};

}  // namespace livemix
