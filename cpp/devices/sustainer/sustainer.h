#pragma once

// Sustain: catches what is played and holds it as an endless, even pad.
//
//   in ──┬───────────────────────────────────────────────────────► dry ─┐
//        │                                                              ├─► out
//        ├─► onset detector ─► wait for the attack to pass ─┐           │
//        │                                                  ▼           │
//        └─► ring ─► two frames ─► peaks, turn per hop ─► layer         │
//                                                           │           │
//            up to six layers ─► lobes × phase ─► tone ─► IFFT ─► overlap-add ─► wet
//
// The dry signal is never delayed or touched. The held sound is a new
// voice, so Mix is an equal-power balance.
//
// - Listening. A short frame (21 ms) every 11 ms gives a spectral flux on
//   log-compressed magnitudes with a maximum filter over neighbouring bins
//   (Böck and Widmer, "Maximum filter vibrato suppression for onset
//   detection", 2013), against a threshold that rises with the recent
//   average. Sensitivity sets the level below which nothing counts and the
//   fixed part of the threshold.
//   Sound with no attack (a pad that swells in, a chord faded in over the
//   last) makes no onset: it is caught when a good share of the averaged
//   spectrum has stood above what was caught last for a moment (watch()).
// - Catching. Once an onset is 96 ms old, two Blackman-windowed frames of
//   85 ms that both lie after the attack are transformed. Each spectral peak
//   becomes a region that reaches to the valleys beside it; the phase the
//   peak gained between the two frames is its exact frequency (the phase
//   vocoder's estimate: Flanagan and Golden 1966, Dolson 1986), and from
//   then on the whole region turns by that amount every hop as one rigid
//   piece (identity phase locking: Laroche and Dolson, "Improved phase
//   vocoder time-scale modification of audio", 1999). A partial's lobe is
//   therefore replayed exactly, which is why a held sine has no sideband at
//   the frame rate and no amplitude ripple. Each region starts in step with
//   the note it was caught from, so the held partial adds to the one still
//   ringing in the dry signal instead of meeting it at a chance angle.
//   Where the peaks do not have a partial's shape the sound is noise
//   (breath, hiss): those regions get a new random phase every hop and an
//   evened level, and are held as noise instead of ringing as chance notes.
//   Blackman, not Hann: its side
//   lobes are 58 dB down, so what one partial leaks into its neighbours'
//   regions (where it turns at the wrong rate) stays inaudible; and the
//   product Blackman × Hann still overlap-adds to an exact constant at 75 %.
// - The second look. 85 ms cannot separate partials closer than 35 Hz, which
//   is every low chord. A third of a second into the note, the partials
//   under 550 Hz are measured again from frames four times as long and
//   rebuilt as clean lobes of their own (the inverse-FFT synthesis of Rodet
//   and Depalle, "Spectral envelopes and inverse FFT synthesis", 1992); the
//   regions caught below 550 Hz hand all their bins over. If the note has
//   ended or another has begun by then, the first look stands.
// - Holding. Every hop (21 ms) each region's phase is turned and its bins
//   are added to one spectrum per channel; one inverse transform per channel
//   and a Hann window give the next frame. Motion adds to each region a slow
//   random wander of pitch, of level and of the phase between left and right
//   (none below 150 Hz). Ensemble adds two copies turning a few cents faster
//   and slower, panned apart. Tone and Low Cut are gains per bin. Layers are
//   scaled by their envelopes here, so fades are as smooth as the window.
// - Modes. Auto: a new catch replaces the layer over Glide (or over Attack
//   when that is longer, so no hole opens between chords); it stays while
//   you play and falls by 60 dB per Decay time once you stop. Layer: a new
//   catch is added and the older ones fall. Latch: Hold catches and lets go.
//
// At 96 kHz the frames are twice as long in samples, the same in time.
// Latency of the held sound: it begins about 140 ms after the note.

#include <cstring>

#include "../../kit/kit.h"
#include "params.gen.h"
#include "real_fft.h"

namespace livemix {

class Sustainer : public kit::DeviceBase<sustainer::kNumParams> {
 public:
  static constexpr int kMaxFrame = 8192;  // the frame at 96 kHz
  static constexpr int kMaxHalf = kMaxFrame / 2;
  static constexpr int kMaxLongFrame = 32768;  // the long frame for the lows at 96 kHz
  static constexpr int kSlots = 6;
  static constexpr int kMaxRegions = 1400;  // peaks are at least three bins apart
  static constexpr int kMaxLow = 96;        // partials below the crossover, from the long frame
  static constexpr int kLobe = 9;           // bins a rebuilt partial covers
  static constexpr int kLowBins = 320;      // bins of the long frame that are kept
  static constexpr int kPool = kMaxHalf + 1 + kMaxLow * kLobe;
  static constexpr int kAllRegions = kMaxRegions + kMaxLow;

  void init(float sample_rate) {
    using namespace sustainer;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    frame_ = sr > 64000.0f ? 8192 : 4096;
    long_frame_ = 4 * frame_;
    half_ = frame_ / 2;
    hop_ = frame_ / 4;
    hop_seconds_ = static_cast<float>(hop_) / sr;
    fft_.init();
    for (int n = 0; n < frame_; ++n) {
      const double angle = 2.0 * 3.14159265358979323846 * n / frame_;
      window_[n] = static_cast<float>(0.5 - 0.5 * std::cos(angle));
      analysis_window_[n] = static_cast<float>(0.42 - 0.5 * std::cos(angle) + 0.08 * std::cos(2.0 * angle));
    }
    // What a copy loses when it turns `turn` cycles per hop away from the
    // lobe it is built from: the transform of the product of the two windows,
    // 0.335 + 0.48 cos + 0.165 cos 2 + 0.02 cos 3 about its middle, read
    // 4 x turn bins off centre.
    for (int i = 0; i <= kCompSteps; ++i) {
      const double x = 4.0 * kMaxDetuneTurn * i / kCompSteps;
      auto sinc = [](double v) {
        const double pv = 3.14159265358979323846 * v;
        return std::fabs(v) < 1.0e-9 ? 1.0 : std::sin(pv) / pv;
      };
      const double g = 0.335 * sinc(x) + 0.24 * (sinc(x - 1) + sinc(x + 1)) + 0.0825 * (sinc(x - 2) + sinc(x + 2)) +
                       0.01 * (sinc(x - 3) + sinc(x + 3));
      comp_[i] = static_cast<float>(0.335 / g);
    }
    // What the bin below a partial reads against the partial's own bin, in
    // dB, for a partial that lies d bins above its bin, d from -1 to 1.
    for (int i = 0; i <= kLobeSteps; ++i) {
      const float d = 2.0f * static_cast<float>(i) / static_cast<float>(kLobeSteps) - 1.0f;
      lobe_db_[i] = 8.6858896f * std::log(std::fabs(lobe(-1.0f - d) / lobe(-d)) + 1.0e-9f);
    }
    for (int i = 0; i < kRing; ++i) {
      output_[0][i] = 0.0f;
      output_[1][i] = 0.0f;
    }
    for (int i = 0; i < kInputRing; ++i) input_[i] = 0.0f;
    position_ = 0;
    mix_.set_time(kSmoothingSeconds, sr);
    mix_seen_ = -1.0f;
    dry_gain_ = 1.0f;
    wet_gain_ = 0.0f;
    reset_engine();
    // Once the last layer has gone, the frames in flight still play out.
    idle_.reset(sr, static_cast<float>(frame_ + 4 * hop_) / sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace sustainer;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || engine_busy())) {
      silence_output(frames);
      return;
    }
    const uint32_t hop_mask = static_cast<uint32_t>(hop_ - 1);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A NaN or runaway sample must not reach the analysis, nor pass through
      // the dry path: not-a-number becomes silence, the rest is held to ±64.
      in[0] = sane(in[0]);
      in[1] = sane(in[1]);
      input_[position_ & kInputMask] = 0.5f * (in[0] + in[1]);

      const uint32_t phase = position_ & hop_mask;
      on_sample(phase);

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      float wet[2];
      for (int c = 0; c < 2; ++c) {
        float& slot = output_[c][position_ & kRingMask];
        // Linear up to ±1, never past ±2.
        wet[c] = 2.0f * kit::soft_clip(0.5f * slot);
        slot = 0.0f;
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
      ++position_;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // For the harness: onsets detected so far and layers sounding now.
  int onsets() const { return onsets_; }
  int layers() const {
    int count = 0;
    for (int s = 0; s < kSlots; ++s) count += slots_[s].state != kFree ? 1 : 0;
    return count;
  }

 private:
  static constexpr int kRing = 16384;       // output: a frame and a hop
  static constexpr uint32_t kRingMask = kRing - 1;
  static constexpr int kInputRing = 65536;  // input: the long frame and what is waiting behind it
  static constexpr uint32_t kInputMask = kInputRing - 1;

  void apply(int id) {
    using namespace sustainer;
    switch (id) {
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read on the frame clock
    }
  }

  enum Mode : int { kModeAuto = 0, kModeLayer, kModeLatch };
  static constexpr float kHeldGain = 0.75f;     // the held sound sits 2.5 dB under what was caught
  static constexpr float kNeverDecay = 59.0f;   // Decay from here up does not fade
  static constexpr float kGone = 1.0e-5f;       // a layer 100 dB down is freed
  static constexpr float kMaxPower = 0.125f;    // ceiling for the pile: a sine of amplitude 0.5
  static constexpr float kMinCents = 3.0f;      // detune of the ensemble pair at Ensemble 0 ...
  static constexpr float kMaxCents = 8.0f;      // ... and at 1
  // A copy may turn at most this far (cycles per hop) away from the lobe it
  // is built from: 0.19 is 9 Hz at 48 kHz. Past that the overlapping frames
  // would stop adding up evenly, so the beating of the highest partials is
  // capped instead.
  static constexpr float kMaxDetuneTurn = 0.19f;
  static constexpr int kCompSteps = 32;
  static constexpr float kPanNear = 0.9239f;    // each copy leans to its side: 7.7 dB louder there
  static constexpr float kPanFar = 0.3827f;
  static constexpr float kTurnPerCentHz = 0.00057779f;  // one cent of a hertz: 2^(1/1200) - 1
  static constexpr float kDriftCents = 3.0f;    // Motion 1: pitch wander of a partial (rms) ...
  static constexpr float kDriftMaxHz = 1.5f;    // ... but no more than this
  static constexpr float kSideCycles = 0.18f;   // Motion 1: left/right phase difference (rms)
  static constexpr float kSwellDepth = 0.22f;   // Motion 1: level wander of a partial (rms, in nepers: 1.9 dB)
  static constexpr float kTiltPivotHz = 600.0f;
  static constexpr float kCrossHz = 550.0f;     // the long frame takes over the regions caught below here
  static constexpr float kCrossHighHz = 650.0f; // ... and is not searched above here
  static constexpr float kMovedCents = 6.0f;    // the two looks are this far apart, on average ...
  static constexpr float kMovedTogether = 0.7f; // ... and this much of it is one way: the pitch is moving
  static constexpr float kDeepFromDb = 20.0f;   // valleys this deep on both sides: less likely noise ...
  static constexpr float kDeepToDb = 30.0f;     // ... and this deep: a partial for certain
  static constexpr float kUnsteady = 1.035f;    // partials of one region change this unlike in a hop (0.3 dB) ...
  static constexpr float kWobbleShare = 0.25f;  // ... in this much of the low power: the pitch is moving
  static constexpr float kFluxAtZero = 20.0f;   // fixed part of the onset threshold at Sensitivity 0 ...
  static constexpr float kFluxAtOne = 9.0f;     // ... and at 1
  static constexpr float kFluxAdapt = 2.0f;     // plus this many times the recent average flux
  static constexpr float kFluxMeanRate = 0.03f;
  static constexpr float kRefractorySeconds = 0.05f;
  static constexpr float kPlayingHangSeconds = 0.15f;
  static constexpr float kMaxPostponeSeconds = 0.2f;
  // Sound that arrives without an attack (a pad that swells in, a bowed or
  // sung note, a chord faded in) never makes an onset. It is caught when a
  // good share of what sounds now is not in what was caught last ...
  static constexpr float kSoftSmoothSeconds = 0.1f;   // the spectrum is averaged over this long
  static constexpr float kSoftMargin = 1.26f;         // a bin is new when it is 1 dB over the reference
  static constexpr float kSoftShare = 0.25f;          // ... and this share of the power is new
  static constexpr float kSoftSeconds = 0.1f;         // ... for this long, with no onset
  static constexpr float kSoftOverGate = 2.0f;        // ... and the level is this far over the gate (6 dB):
                                                      // a steady hiss just above it is not a pad
  static constexpr float kSoftSpacingSeconds = 0.3f;  // and no more often than this
  static constexpr float kSettleSeconds = 0.2f;       // after a catch the reference takes in what still rises
  // Breath, hiss and other noise have no partials to hold: frozen as it was
  // caught, each chance peak of the frame would ring on as a note of its
  // own. Where the bins beside the peaks do not fit the window's lobe, the
  // sound is noise, and its regions are given a new random phase every hop
  // instead of a steady turn. The misfit is judged over about a hundred
  // peaks together: measured on this code, close chords, clusters and
  // detuned pads read 0.2 to 1.4 dB, white noise and breath 2.0 to 2.7 dB.
  static constexpr float kNoisyFromDb = 1.5f;         // noise begins here ...
  static constexpr float kNoisySpanDb = 0.5f;         // ... and is complete this much further on
  static constexpr float kNoisyOwnFromDb = 3.0f;      // a single peak is judged on its own only when it is
  static constexpr float kNoisyOwnSpanDb = 3.0f;      // far off: close partials bend each other's lobes
  static constexpr int kNoisyBlock = 32;              // peaks that are judged together
  static constexpr int kNoisyReach = 2;               // peaks either side that a partial must stand above
  static constexpr int kMaxBlocks = (kMaxRegions + kNoisyBlock - 1) / kNoisyBlock;
  static constexpr float kProminent = 8.0f;           // ... by this many times in power
  static constexpr float kSmearMakeup = 0.365f;       // frames that no longer add up in phase lose 2.7 dB
  static constexpr int kLobeSteps = 64;

  static constexpr float kInputLimit = 64.0f;
  static float sane(float v) {
    if (v > -kInputLimit && v < kInputLimit) return v;
    return v >= kInputLimit ? kInputLimit : (v <= -kInputLimit ? -kInputLimit : 0.0f);
  }

  int mode() const { return kit::clamp_int(static_cast<int>(param(sustainer::kMode) + 0.5f), 0, 2); }
  bool hold_on() const { return param(sustainer::kHold) >= 0.5f; }

  // Variance gain of white noise through one and through two equal one-poles.
  static float one_pole_norm(float a) { return std::sqrt(3.0f * (2.0f - a) / a); }
  static float two_pole_norm(float a) {
    const float b = 1.0f - a;
    const float d = 1.0f - b * b;
    return std::sqrt(3.0f * d * d * d / (a * a * a * a * (1.0f + b * b)));
  }

  // Gain per bin from Tone and Low Cut, rebuilt when either moves.
  void update_shape() {
    using namespace sustainer;
    const float tone = param(kTone);
    const float low_cut = param(kLowCut);
    if (tone == shape_tone_ && low_cut == shape_low_cut_) return;
    shape_tone_ = tone;
    shape_low_cut_ = low_cut;
    // Tone, about the pivot. Dark takes the top off (up to 6 dB per octave)
    // and leaves the lows alone; bright leans the whole sound upwards by up
    // to 3 dB per octave, lifting the top by no more than 9 dB.
    const float bin_hz = sample_rate() / static_cast<float>(frame_);
    const float cut_octave = std::log2(low_cut / kTiltPivotHz);
    for (int k = 0; k <= half_; ++k) {
      const float octave = std::log2(static_cast<float>(k > 0 ? k : 1) * bin_hz / kTiltPivotHz);
      float db = 0.0f;
      if (tone < 0.0f) {
        db = octave > 0.0f ? 6.0f * tone * octave : 0.0f;
      } else {
        db = kit::clamp(3.0f * tone * octave, -18.0f, 9.0f);
      }
      // The cut is a raised-cosine step one octave wide, -6 dB at Low Cut.
      const float x = k == 0 ? 0.0f : kit::clamp(octave - cut_octave + 0.5f, 0.0f, 1.0f);
      shape_[k] = std::exp(db * 0.11512925f) * x * x * (3.0f - 2.0f * x);
    }
  }

  // One held sound: the spectrum of the frame it was caught in, cut into
  // regions (one per spectral peak) that each turn as a rigid whole.
  enum SlotState : int { kFree = 0, kHeld, kLeaving };
  struct Slot {
    // The spectrum of the caught frame, and behind it the lobes of the
    // partials rebuilt from the long frame.
    float c_re[kPool], c_im[kPool];
    uint16_t start[kAllRegions + 1];                 // region r is c[start[r], start[r+1])
    int16_t shift[kAllRegions];                      // ... and lands on bins start + shift
    float u_re[kAllRegions], u_im[kAllRegions];      // running phase of the region
    float rot_re[kAllRegions], rot_im[kAllRegions];  // its turn per hop
    float cent_turn[kAllRegions];                    // cycles per hop that one cent of detune adds
    float det_phase[kAllRegions];                    // phase of the detuned pair, cycles
    float part[kAllRegions];                         // how far left and right may part (0 in the bass)
    float drift_v[kAllRegions], drift[kAllRegions];  // common phase wander: velocity, phase (cycles)
    float side_a[kAllRegions], side[kAllRegions];    // left/right phase difference (two-pole noise)
    float swell_a[kAllRegions], swell[kAllRegions];  // slow level wander (two-pole noise)
    float noisy[kAllRegions];                        // 0 a partial .. 1 noise, whose phase is redrawn every hop
    bool low_noisy;  // the lows are noise: no second look
    int regions;
    int state;
    int serial;      // the onset count when it was caught
    float delay;     // samples by which the held sound runs behind the input
    bool newest;     // the layer the player's last note made
    bool soft;       // caught without an onset (a swell)
    float rise;      // 0..1 along the attack
    float fall;      // 1..0: the decay
    float leave;     // 1..0: giving way to a newer layer
    float leave_rate;
    float power;     // mean square of the sound it holds
    float gain;      // what the last frame used
    kit::Rng rng;
  };

  void reset_engine() {
    for (int s = 0; s < kSlots; ++s) {
      Slot& slot = slots_[s];
      slot.regions = 0;
      slot.serial = 0;
      slot.delay = 0.0f;
      slot.state = kFree;
      slot.newest = false;
      slot.soft = false;
      slot.low_noisy = false;
      slot.rise = 0.0f;
      slot.fall = 1.0f;
      slot.leave = 1.0f;
      slot.leave_rate = 0.0f;
      slot.power = 0.0f;
      slot.gain = 0.0f;
      slot.rng.seed(0x9E3779B9u + 0x7F4A7C15u * static_cast<uint32_t>(s + 1));
    }
    for (int k = 0; k <= kMaxHalf; ++k) {
      shape_[k] = 1.0f;
      now_re_[k] = now_im_[k] = 0.0f;
      last_re_[k] = last_im_[k] = 0.0f;
    }
    shape_tone_ = shape_low_cut_ = -1.0e9f;
    playing_ = false;
    capture_due_ = -1;
    hold_seen_ = false;
    refine_slot_ = -1;
    refine_stage_ = 0;
    refine_due_ = 0;
    frame_any_ = false;
    for (int s = 0; s < kSlots; ++s) frame_gain_[s] = 0.0f;
    flux_mean_ = 0.0f;
    since_onset_ = 1.0f;
    quiet_for_ = 1.0f;
    postponed_ = 0.0f;
    onsets_ = 0;
    gate_ = 0.0f;
    for (int k = 0; k <= kMaxFrame / 8; ++k) det_a_[k] = det_b_[k] = 0.0f;
    for (int k = 0; k <= kMaxHalf / 2; ++k) slow_[k] = ref_[k] = 0.0f;
    soft_a_ = 1.0f - std::exp(-2.0f * hop_seconds_ / kSoftSmoothSeconds);
    soft_for_ = 0.0f;
    level_ = 0.0f;
    settle_ = 0.0f;
    soft_capture_ = false;
    for (int k = 0; k <= kMaxHalf; ++k) mag_[k] = 0.0f;
    drift_a_ = hop_seconds_ / 1.0f;
    side_a_ = hop_seconds_ / 0.8f;
    swell_a_ = hop_seconds_ / 1.2f;
    drift_norm_ = one_pole_norm(drift_a_);
    side_norm_ = two_pole_norm(side_a_);
    swell_norm_ = two_pole_norm(swell_a_);
  }

  bool engine_busy() const {
    for (int s = 0; s < kSlots; ++s) {
      if (slots_[s].state != kFree) return true;
    }
    return false;
  }

  static float loudness(const Slot& slot) { return slot.gain * slot.gain * slot.power; }

  void on_sample(uint32_t phase) {
    // Eight steps to a hop (a step is 128 samples at 48 kHz): the detector
    // on steps 0 and 4, the frame on 1, 2, 3 and 5, the watch for sound
    // without an attack on step 2 of every other hop, a capture on 0, 4, 6
    // or 7, the second look at the lows on 6 and 7.
    const uint32_t step = static_cast<uint32_t>(hop_ / 8);
    if ((phase & (step - 1u)) == 0u) {
      const uint32_t ahead = static_cast<uint32_t>(hop_) - phase;
      switch (phase / step) {
        case 0:
          detect();
          frame_tick();
          break;
        case 1:
          begin_frame();
          build_layers(0, kSlots / 2);
          break;
        case 2:
          build_layers(kSlots / 2, kSlots);
          if (((position_ / static_cast<uint32_t>(hop_)) & 1u) == 0u) watch();
          break;
        case 3:
          finish_channel(0, ahead);
          break;
        case 4:
          detect();
          frame_tick();
          break;
        case 5:
          finish_channel(1, ahead);
          break;
        case 6:
          frame_tick();
          refine_step(0);
          break;
        case 7:
          frame_tick();
          refine_step(1);
          break;
        default:
          break;
      }
    }
    if (capture_due_ > 0) --capture_due_;
    if (refine_due_ > 0) --refine_due_;
  }

  // log2 to about 0.005, for x > 0 (the detector's level compression): the
  // exponent plus a parabola through the ends of the mantissa's range.
  static float fast_log2(float x) {
    uint32_t bits;
    std::memcpy(&bits, &x, sizeof bits);
    const float exponent = static_cast<float>(static_cast<int>(bits >> 23) - 127);
    bits = (bits & 0x007FFFFFu) | 0x3F800000u;  // the mantissa in [1, 2)
    float mantissa;
    std::memcpy(&mantissa, &bits, sizeof mantissa);
    return exponent + (2.0f - mantissa * (1.0f / 3.0f)) * mantissa - (5.0f / 3.0f);
  }

  // The onset detector: a short frame (a quarter of the long one) every half
  // frame, about every 11 ms. Its measure is spectral flux on log-compressed
  // magnitudes, counting only what rises above the two frames before and
  // their neighbouring bins (the maximum filter of Böck and Widmer's
  // SuperFlux, which keeps vibrato and beating from looking like new notes).
  // An onset is a flux above a fixed part set by Sensitivity plus a multiple
  // of the recent average, so busy or noisy material raises its own bar.
  void detect() {
    using namespace sustainer;
    const int size = frame_ / 4;
    const int bins = size / 2;
    const uint32_t first = position_ + 1u - static_cast<uint32_t>(size);
    float sum = 0.0f;
    for (int n = 0; n < size; ++n) {
      const float x = input_[(first + static_cast<uint32_t>(n)) & kInputMask];
      sum += x * x;
      scratch_[n] = x * window_[4 * n];
    }
    fft_.forward(scratch_, det_re_, det_im_, size);
    const float sensitivity = param(kSensitivity);
    // Below this level nothing counts as playing: -30 dBFS at 0, -66 at 1.
    const float gate = std::exp(-0.11512925f * (30.0f + 36.0f * sensitivity));
    gate_ = gate;
    const float level = std::sqrt(sum / static_cast<float>(size));
    // A bin of a sine at the gate level reads 1 before compression.
    const float unit = 4.0f / (static_cast<float>(size) * gate);
    float flux = 0.0f;
    float before = det_b_[0];
    for (int k = 0; k <= bins; ++k) {
      const float re = det_re_[k];
      const float im = det_im_[k];
      const float value = fast_log2(1.0f + unit * std::sqrt(re * re + im * im));
      const float here = det_b_[k];
      const float after = k < bins ? det_b_[k + 1] : here;
      const float reference = kit::max(kit::max(before, here), after);
      if (value > reference) flux += value - reference;
      det_b_[k] = det_a_[k];
      det_a_[k] = value;
      before = here;
    }
    const float fixed = kFluxAtZero * std::pow(kFluxAtOne / kFluxAtZero, sensitivity);
    const bool onset = flux > fixed + kFluxAdapt * flux_mean_ && level > gate && since_onset_ >= kRefractorySeconds;
    flux_mean_ += kFluxMeanRate * (kit::min(flux, 3.0f * flux_mean_ + fixed) - flux_mean_);
    const float step = static_cast<float>(size / 2) / sample_rate();
    since_onset_ = kit::min(since_onset_ + step, 100.0f);
    // "Playing" lasts a little past the last frame above half the gate level.
    quiet_for_ = level > 0.5f * gate ? 0.0f : kit::min(quiet_for_ + step, 100.0f);
    playing_ = quiet_for_ < kPlayingHangSeconds;
    level_ = level;
    if (!onset) return;
    since_onset_ = 0.0f;
    soft_for_ = 0.0f;
    ++onsets_;
    if (mode() == kModeLatch || hold_on()) return;
    soft_capture_ = false;
    // Wait until both frames of the capture lie after the attack. Further
    // onsets (a strum, a roll) push the capture back, but not for ever.
    const int wait = frame_ + hop_ / 2;
    if (capture_due_ < 0) {
      capture_due_ = wait;
      postponed_ = 0.0f;
    } else if (postponed_ < kMaxPostponeSeconds) {
      postponed_ += static_cast<float>(wait - capture_due_) / sample_rate();
      capture_due_ = wait;
    }
  }

  // The second way in, for sound that has no attack. The averaged spectrum
  // is held against what it was when the newest layer was caught (scaled by
  // how far that layer has since died away), and a catch is asked for once
  // a good share of the power has stood above that reference for a moment.
  // A decaying note never does; a swell does again and again, so the layer
  // follows it up; a new chord faded in over the old one does; steady noise
  // does not, because the reference took in its scatter while it settled.
  //
  // It looks every other hop (43 ms) through the long frame, whose bins are
  // 12 Hz apart: the detector's short frame cannot tell a chord from the
  // one a tone below it.
  void watch() {
    if (mode() == kModeLatch || hold_on()) {
      soft_for_ = 0.0f;
      return;
    }
    const float step = 2.0f * hop_seconds_;
    analyse(0, now_re_, now_im_);
    float held = 0.0f;
    for (int s = 0; s < kSlots; ++s) {
      if (slots_[s].state == kHeld && slots_[s].newest) held = slots_[s].fall * slots_[s].fall;
    }
    const bool settling = settle_ > 0.0f;
    settle_ = kit::max(0.0f, settle_ - step);
    const float covered = kSoftMargin * held;
    const int bins = half_ / 2;
    float fresh = 0.0f, total = 0.0f;
    for (int k = 1; k <= bins; ++k) {
      const float now = slow_[k] + soft_a_ * (now_re_[k] * now_re_[k] + now_im_[k] * now_im_[k] - slow_[k]);
      slow_[k] = now;
      if (settling && now > ref_[k]) ref_[k] = now;
      total += now;
      const float known = covered * ref_[k];
      if (now > known) fresh += now - known;
    }
    const bool loud = level_ > kSoftOverGate * gate_;
    soft_for_ = (loud && fresh > kSoftShare * total) ? soft_for_ + step : 0.0f;
    if (soft_for_ < kSoftSeconds || capture_due_ >= 0 || since_onset_ < kSoftSpacingSeconds) return;
    // Caught like a note, but there is no attack to wait out.
    since_onset_ = 0.0f;
    soft_for_ = 0.0f;
    ++onsets_;
    soft_capture_ = true;
    capture_due_ = hop_ / 2;
    postponed_ = 0.0f;
  }

  // A layer has been caught: the reference is the spectrum as it is now. A
  // catch without an onset continues the sound before it, so half of the
  // old reference stands: partials that beat (a detuned pad) are then
  // caught near their loudest and, after a few catches, left alone.
  void mark_reference(bool soft) {
    const int bins = half_ / 2;
    for (int k = 0; k <= bins; ++k) ref_[k] = soft ? kit::max(0.5f * ref_[k], slow_[k]) : slow_[k];
    settle_ = kSettleSeconds;
  }

  // Once per analysis frame: act on Hold and on a capture that has come due.
  void frame_tick() {
    const bool hold = hold_on();
    const bool latch = mode() == kModeLatch;
    if (latch && hold && !hold_seen_) capture_due_ = 0;  // Latch: catch this moment
    // Latch with Hold switched On in silence caught nothing: it then waits,
    // and the first sound that comes is the moment (once its attack is over).
    if (latch && hold && capture_due_ < 0 && level_ > gate_ && !engine_busy()) capture_due_ = frame_ + hop_ / 2;
    if (hold && !latch) capture_due_ = -1;               // Auto and Layer: Hold stops listening
    hold_seen_ = hold;
    if (capture_due_ < 0) return;
    if (capture_due_ > 0) return;
    capture_due_ = -1;
    start_layer();
  }

  // Put what is sounding now into a free layer; what the others do depends
  // on the mode.
  void start_layer() {
    using namespace sustainer;
    int chosen = -1;
    for (int s = 0; s < kSlots && chosen < 0; ++s) {
      if (slots_[s].state == kFree) chosen = s;
    }
    if (chosen < 0) return;
    Slot& slot = slots_[chosen];
    capture(slot);
    const bool soft = soft_capture_;
    soft_capture_ = false;
    // A capture that finds nothing (the click of a note being cut off, a
    // touch on the strings) must not push out what is held.
    // (Latch takes whatever there is, but not plain silence.)
    if (slot.power < (mode() == kModeLatch ? 1.0e-12f : gate_ * gate_)) return;
    mark_reference(soft);
    slot.soft = soft;
    const bool layering = mode() == kModeLayer;
    // The old layer gives way over Glide, but never faster than the new one
    // rises (Attack): otherwise a long Attack leaves a hole between chords.
    const float glide_rate = hop_seconds_ / kit::max(param(kGlide), param(kAttack));
    int held = 0;
    for (int s = 0; s < kSlots; ++s) {
      Slot& other = slots_[s];
      if (other.state == kFree || s == chosen) continue;
      // In Layer, a swell that is caught again replaces its own earlier
      // catch instead of piling up on it.
      const bool same_swell = soft && other.newest && other.soft;
      other.newest = false;
      if (other.state == kHeld && (!layering || same_swell)) {
        other.state = kLeaving;
        other.leave_rate = glide_rate;
      }
      if (other.state == kHeld) ++held;
    }
    slot.state = kHeld;
    slot.serial = onsets_;
    // The first frame built from it is the caught frame one hop on.
    slot.delay = static_cast<float>(static_cast<int32_t>(next_landing() - position_)) - static_cast<float>(hop_) +
                 static_cast<float>(frame_) - 1.0f;
    // That frame is `delay` samples old by the time it sounds. Turn every
    // region forward by what its partial has turned since, so that the held
    // sound starts in step with the note still ringing in the dry signal and
    // adds to it. Left as caught, each partial met the dry one at whatever
    // angle the delay gave it, and those that met in opposition were notched
    // out of the played note (by up to 12 dB) for as long as it rang.
    const double delay_seconds = static_cast<double>(slot.delay) / sample_rate();
    for (int r = 0; r < slot.regions; ++r) {
      const double hz = static_cast<double>(slot.cent_turn[r]) / (kTurnPerCentHz * static_cast<double>(hop_seconds_));
      double turns = hz * delay_seconds;
      turns -= std::floor(turns);
      slot.u_re[r] = kit::SineTable::cos_lookup(static_cast<float>(turns));
      slot.u_im[r] = kit::SineTable::lookup(static_cast<float>(turns));
    }
    // Look again at the lows once a long frame of the note has gone by.
    refine_slot_ = chosen;
    refine_stage_ = 0;
    const int since = static_cast<int>(kit::min(since_onset_, 10.0f) * sample_rate());
    refine_due_ = long_frame_ + hop_ > since ? long_frame_ + hop_ - since : 0;
    slot.newest = true;
    slot.rise = 0.0f;
    slot.fall = 1.0f;
    slot.leave = 1.0f;
    slot.gain = 0.0f;
    // Keep a layer free for the next note: when the pile is full, the
    // quietest of the old ones gives way.
    int busy = 0;
    for (int s = 0; s < kSlots; ++s) busy += slots_[s].state != kFree ? 1 : 0;
    if (busy >= kSlots && held > 0) {
      int quietest = -1;
      for (int s = 0; s < kSlots; ++s) {
        if (s == chosen || slots_[s].state != kHeld) continue;
        if (quietest < 0 || loudness(slots_[s]) < loudness(slots_[quietest])) quietest = s;
      }
      if (quietest >= 0) {
        slots_[quietest].state = kLeaving;
        slots_[quietest].leave_rate = kit::max(glide_rate, hop_seconds_ / 0.25f);
      }
    }
  }

  // A long analysis frame: the `frame_` samples that end `back` samples ago,
  // under a Blackman window.
  void analyse(int back, float* re, float* im) {
    const uint32_t first = position_ + 1u - static_cast<uint32_t>(frame_ + back);
    for (int n = 0; n < frame_; ++n) {
      scratch_[n] = input_[(first + static_cast<uint32_t>(n)) & kInputMask] * analysis_window_[n];
    }
    fft_.forward(scratch_, re, im, frame_);
  }

  // Where the frame that is built next will be added to the output: the
  // start of the hop after the one it is built in (step 1 of each hop).
  uint32_t next_landing() const {
    const uint32_t phase = position_ & static_cast<uint32_t>(hop_ - 1);
    return position_ - phase + static_cast<uint32_t>(phase < static_cast<uint32_t>(hop_ / 8) ? hop_ : 2 * hop_);
  }

  // The second look comes due: the older long frame on one step, the newer
  // one and the rebuild on the next. It is dropped when the layer has been
  // replaced, the note has ended, or a newer note has begun since.
  void refine_step(int stage) {
    if (refine_slot_ < 0) return;
    Slot& slot = slots_[refine_slot_];
    // (Nor is noise looked at again: it has no partials to measure.)
    if (slot.state != kHeld || slot.serial != onsets_ || !playing_ || slot.low_noisy) {
      refine_slot_ = -1;
      return;
    }
    if (stage == 0) {
      if (refine_due_ > 0) return;
      // This frame ends a hop before the one the next step takes.
      analyse_long(hop_ - hop_ / 8, 0);
      refine_stage_ = 1;
    } else if (refine_stage_ == 1) {
      analyse_long(0, 1);
      refine(slot, position_);
      refine_slot_ = -1;
    }
  }

  // The transform of the Blackman window about its middle, per sample of the
  // frame, x bins from its centre: 0.42 at 0, the main lobe out to ±3.
  static float lobe(float x) {
    auto sinc = [](float v) {
      return v > -1.0e-4f && v < 1.0e-4f ? 1.0f : std::sin(kit::kPi * v) / (kit::kPi * v);
    };
    return 0.42f * sinc(x) + 0.25f * (sinc(x - 1.0f) + sinc(x + 1.0f)) + 0.04f * (sinc(x - 2.0f) + sinc(x + 2.0f));
  }

  // The bin below a partial against the partial's own bin, dB, for a partial
  // d bins above its bin (the bin above it reads lobe_db(-d)).
  float lobe_db(float d) const {
    const float at = (d + 1.0f) * (0.5f * static_cast<float>(kLobeSteps));
    const int index = kit::clamp_int(static_cast<int>(at), 0, kLobeSteps - 1);
    return lobe_db_[index] + (lobe_db_[index + 1] - lobe_db_[index]) * (at - static_cast<float>(index));
  }

  // The long frame (four times the usual one, 341 ms at 48 kHz): the
  // `long_frame_` samples that end `back` samples ago, under a Blackman
  // window, and only its lowest bins.
  void analyse_long(int back, int which) {
    const uint32_t first = position_ + 1u - static_cast<uint32_t>(long_frame_ + back);
    for (int n = 0; n < long_frame_; ++n) {
      // The window is the short one stretched by four.
      const int at = n >> 2;
      const float a = analysis_window_[at];
      const float b = at + 1 < frame_ ? analysis_window_[at + 1] : 0.0f;
      const float w = a + (b - a) * 0.25f * static_cast<float>(n & 3);
      long_scratch_[n] = input_[(first + static_cast<uint32_t>(n)) & kInputMask] * w;
    }
    fft_.forward(long_scratch_, long_re_[which], long_im_[which], long_frame_, kLowBins + 1);
  }

  // The second look at a layer, a third of a second after the first. A frame
  // of 85 ms cannot tell two partials apart that are closer than 35 Hz: the
  // notes of a low chord, or a semitone anywhere below 600 Hz, come out as
  // one partial at the wrong pitch. The long frame can (down to 9 Hz), so
  // once enough of the note has gone by, every partial under the crossover
  // is measured again from two long frames a hop apart (frequency from the
  // phase turn, level from the peak, phase from the newer frame) and rebuilt
  // as a clean lobe of its own; the caught frame gives up its bins there.
  // `end` is the position at which the newer long frame ended.
  void refine(Slot& slot, uint32_t end) {
    const float sr = sample_rate();
    const float long_bin = sr / static_cast<float>(long_frame_);
    const float short_bin = sr / static_cast<float>(frame_);
    const int top = kit::clamp_int(static_cast<int>(kCrossHighHz / long_bin), 8, kLowBins - 3);
    const float* now_re = long_re_[1];
    const float* now_im = long_im_[1];
    const float* last_re = long_re_[0];
    const float* last_im = long_im_[0];
    float strongest = 0.0f;
    for (int k = 0; k <= top + 2; ++k) {
      mag_[k] = std::sqrt(now_re[k] * now_re[k] + now_im[k] * now_im[k]);
      if (mag_[k] > strongest) strongest = mag_[k];
    }
    // The frame that will be built next lands where the hop after it begins;
    // the layer's phase starts one hop behind that frame's middle.
    // The caught regions were started in step with the input (start_layer),
    // and so are these.
    const double from_middle = static_cast<double>(static_cast<int32_t>(next_landing() - end)) + 0.5 * frame_ - hop_ -
                               1.0 + 0.5 * long_frame_;
    // A partial counts when it is within 60 dB of the strongest low one and
    // within 80 dB of the level of the whole layer.
    const float whole = std::sqrt(slot.power) * 0.21f * static_cast<float>(long_frame_);
    const float floor = kit::max(kit::max(strongest * 1.0e-3f, whole * 1.0e-4f), 1.0e-9f);
    // The hand-over is by whole regions: those caught below the crossing
    // give up all their bins, and partials are rebuilt only where they
    // stood. Shared out bin by bin instead, a partial near the crossing was
    // held twice, at two estimates of its pitch that could differ by a
    // fraction of a hertz, and beat with itself (up to 12 dB, slowly).
    int edge = half_ + 1;
    for (int i = 0; i < slot.regions; ++i) {
      if (slot.cent_turn[i] >= kCrossHz * kTurnPerCentHz * hop_seconds_) {
        edge = slot.start[i];
        break;
      }
    }
    int r = slot.regions;
    int pool = half_ + 1;
    int at = 0;
    // Is this a note whose pitch moves (vibrato, a bend)? Two signs of it,
    // gathered over the partials the long frame finds in each caught region.
    // One partial there, where the first look saw a partial too: the long
    // frame, which averages a third of a second, reads it elsewhere than
    // the short one, which caught an instant, and every such partial is off
    // the same way (close notes pull each other's first reading up and down
    // alike, which is not this). Several partials there: they are the
    // sidebands of a vibrato if, from one long frame to the next, some grow
    // while others shrink; the partials of close notes keep their levels,
    // or fall together.
    int group = 0, group_at = -1;
    float group_hz = 0.0f, group_power = 0.0f, least = 0.0f, most = 0.0f;
    float moved = 0.0f, apart = 0.0f, weighed = 0.0f, wobble = 0.0f, low_power = 0.0f;
    const auto close_group = [&]() {
      if (group == 1) {
        const float first = slot.cent_turn[group_at] / (kTurnPerCentHz * hop_seconds_);
        if (slot.noisy[group_at] < 0.5f && first > 15.0f) {
          const float cents = group_power * kit::clamp((first / group_hz - 1.0f) / kTurnPerCentHz, -50.0f, 50.0f);
          moved += cents;
          apart += std::fabs(cents);
          weighed += group_power;
        }
      } else if (group > 1 && most > kUnsteady * least) {
        wobble += group_power;
      }
      group = 0;
      group_power = 0.0f;
    };
    for (int k = 2; k <= top && r < slot.regions + kMaxLow; ++k) {
      const float m = mag_[k];
      if (!(m > floor && m > mag_[k - 1] && m >= mag_[k + 1] && m > mag_[k - 2] && m >= mag_[k + 2])) continue;
      float tr = 0.0f, ti = 0.0f;
      for (int j = k - 1; j <= k + 1; ++j) {
        tr += now_re[j] * last_re[j] + now_im[j] * last_im[j];
        ti += now_im[j] * last_re[j] - now_re[j] * last_im[j];
      }
      // The frames are a hop apart, a sixteenth of the long frame.
      float deviation = std::atan2(ti, tr) - 0.25f * kit::kHalfPi * static_cast<float>(k & 15);
      deviation -= kit::kTwoPi * std::floor(deviation / kit::kTwoPi + 0.5f);
      const float offset = deviation * (8.0f / kit::kPi);  // bins of the long frame
      if (offset < -1.5f || offset > 1.5f) continue;       // not a steady partial
      const float hz = (static_cast<float>(k) + offset) * long_bin;
      if (hz < 15.0f || hz >= (static_cast<float>(edge) - 0.5f) * short_bin) continue;
      // The partials found within one caught region are judged together.
      while (at + 1 < slot.regions && static_cast<float>(slot.start[at + 1]) * short_bin <= hz) ++at;
      if (at != group_at) {
        close_group();
        group_at = at;
      }
      const float change = m / (std::sqrt(last_re[k] * last_re[k] + last_im[k] * last_im[k]) + 1.0e-30f);
      if (group == 0 || change < least) least = change;
      if (group == 0 || change > most) most = change;
      if (group == 0) group_hz = hz;
      group_power += m * m;
      ++group;
      low_power += m * m;
      // A partial of amplitude A puts A/2 × N × lobe(k - b) into bin k, with
      // its phase at the middle of the frame and a sign that alternates.
      const float amplitude = 2.0f * m / (static_cast<float>(long_frame_) * lobe(-offset));
      double turns = std::atan2(now_im[k], now_re[k]) / (2.0 * 3.14159265358979323846) + ((k & 1) ? 0.5 : 0.0);
      turns += static_cast<double>(hz) * from_middle / sr;
      turns -= std::floor(turns);
      const float pr = kit::SineTable::cos_lookup(static_cast<float>(turns));
      const float pi = kit::SineTable::lookup(static_cast<float>(turns));
      const float position = hz / short_bin;
      const int nearest = static_cast<int>(position + 0.5f);
      const float scale = 0.5f * amplitude * static_cast<float>(frame_);
      const int lowest = nearest - kLobe / 2 < 0 ? 0 : nearest - kLobe / 2;
      for (int j = 0; j < kLobe; ++j) {
        const int bin = lowest + j;
        const float value = bin < 1 ? 0.0f : scale * lobe(static_cast<float>(bin) - position) * ((bin & 1) ? -1.0f : 1.0f);
        slot.c_re[pool + j] = value * pr;
        slot.c_im[pool + j] = value * pi;
      }
      slot.start[r] = static_cast<uint16_t>(pool);
      slot.shift[r] = static_cast<int16_t>(lowest - pool);
      start_region(slot, r, kit::kTwoPi * hz * hop_seconds_, hz);
      pool += kLobe;
      ++r;
    }
    close_group();
    // Then the lows are not rebuilt: they would end up some tens of cents
    // away from their own overtones, or flutter as a pair of sidebands. The
    // first look stands, and the held note is at least in tune with itself.
#ifdef RV_DEBUG
    std::fprintf(stderr, "  moved %+.2f cents, apart %.2f, wobble share %.2f\n", moved / (weighed + 1e-20f), apart / (weighed + 1e-20f), wobble / (low_power + 1e-20f));
#endif
    if (std::fabs(moved) > kMovedCents * weighed && std::fabs(moved) > kMovedTogether * apart) return;
    if (wobble > kWobbleShare * low_power) return;
    slot.start[r] = static_cast<uint16_t>(pool);
    slot.regions = r;
    for (int k = 0; k < edge && k <= half_; ++k) {
      slot.c_re[k] = 0.0f;
      slot.c_im[k] = 0.0f;
    }
  }

  // A region begins: its turn per hop (radians), its frequency, and its
  // motion at rest.
  void start_region(Slot& slot, int r, float angle, float hz) {
    slot.rot_re[r] = std::cos(angle);
    slot.rot_im[r] = std::sin(angle);
    slot.u_re[r] = 1.0f;
    slot.u_im[r] = 0.0f;
    slot.cent_turn[r] = hz * kTurnPerCentHz * hop_seconds_;
    slot.det_phase[r] = slot.rng.uniform();
    // Left and right stay together below 150 Hz and part freely above 400 Hz.
    const float x = kit::clamp(std::log2(kit::max(hz, 1.0f) / 150.0f) / 1.415f, 0.0f, 1.0f);
    slot.part[r] = x * x * (3.0f - 2.0f * x);
    slot.drift_v[r] = 0.0f;
    slot.drift[r] = 0.0f;
    slot.side_a[r] = 0.0f;
    slot.side[r] = 0.0f;
    slot.swell_a[r] = 0.0f;
    slot.swell[r] = 0.0f;
    slot.noisy[r] = 0.0f;
  }

  // Catch what is sounding now into `slot`, from two frames half a hop apart:
  // the one that ends now and the one before it.
  //
  // Magnitudes are the mean of the two frames; phases are those of the newer
  // one. The spectrum is cut at the valleys between its peaks, and every
  // region is given the turn per hop measured at its peak (the phase the
  // peak gained between the two frames: a phase vocoder's frequency
  // estimate, kept as a rotation so nothing is unwrapped). All bins of a
  // region then turn together, which keeps the lobe of a partial intact
  // (identity phase locking) and its frequency exact.
  void capture(Slot& slot) {
    const float sr = sample_rate();
    analyse(hop_ / 2, last_re_, last_im_);
    analyse(0, now_re_, now_im_);
    float top = 0.0f;
    for (int k = 0; k <= half_; ++k) {
      const float now = std::sqrt(now_re_[k] * now_re_[k] + now_im_[k] * now_im_[k]);
      const float last = std::sqrt(last_re_[k] * last_re_[k] + last_im_[k] * last_im_[k]);
      // The mean of the two, but never more than the newer frame has: what
      // is dying away fast (the attack) is not part of the held sound.
      const float mean = 0.5f * (now + kit::min(now, last));
      mag_[k] = mean;
      const float scale = now > 1.0e-20f ? mean / now : 0.0f;
      slot.c_re[k] = now_re_[k] * scale;
      slot.c_im[k] = now_im_[k] * scale;
      if (mean > top) top = mean;
    }
    // Peaks: the largest of five bins, and within 90 dB of the strongest.
    const float floor = kit::max(top * 3.0e-5f, 1.0e-9f);
    int regions = 0;
    int valley = 0;
    float valley_mag = 0.0f;
    slot.start[0] = 0;
    for (int k = 2; k <= half_ - 2 && regions < kMaxRegions; ++k) {
      const float m = mag_[k];
      const bool is_peak = m > floor && m > mag_[k - 1] && m >= mag_[k + 1] && m > mag_[k - 2] && m >= mag_[k + 2];
      if (is_peak) {
        if (regions > 0) slot.start[regions] = static_cast<uint16_t>(valley);
        peak_[regions++] = static_cast<uint16_t>(k);
        valley = k;
        valley_mag = m;
      } else if (m < valley_mag) {
        valley = k;
        valley_mag = m;
      }
    }
    if (regions == 0) {
      peak_[0] = 1;
      regions = 1;
    }
    slot.start[regions] = static_cast<uint16_t>(half_ + 1);
    slot.regions = regions;

    const float bin_hz = sr / static_cast<float>(frame_);
    for (int r = 0; r < regions; ++r) {
      const int p = peak_[r];
      // The turn between the two frames, summed over the peak's three bins.
      float tr = 0.0f, ti = 0.0f;
      for (int k = p - 1; k <= p + 1; ++k) {
        if (k < 0 || k > half_) continue;
        tr += now_re_[k] * last_re_[k] + now_im_[k] * last_im_[k];
        ti += now_im_[k] * last_re_[k] - now_re_[k] * last_im_[k];
      }
      // What a partial exactly on the bin would turn by in half a hop: p
      // eighths of a turn.
      const float centre_angle = 0.5f * kit::kHalfPi * static_cast<float>(p & 7);
      float deviation = 0.0f;
      const float size = tr * tr + ti * ti;
      if (size > 1.0e-30f) {
        deviation = std::atan2(ti, tr) - centre_angle;
        deviation -= kit::kTwoPi * std::floor(deviation / kit::kTwoPi + 0.5f);
      }
      const float angle = 2.0f * (centre_angle + deviation);  // per hop
      // Half a hop is an eighth of the frame, so a full turn of deviation is
      // eight bins.
      const float hz = kit::max(0.0f, (static_cast<float>(p) + deviation * (4.0f / kit::kPi)) * bin_hz);
      slot.shift[r] = 0;
      start_region(slot, r, angle, hz);
      // How far the bins beside the peak are from where a steady partial at
      // that frequency would put them.
      const float d = kit::clamp(deviation * (4.0f / kit::kPi), -1.0f, 1.0f);
      const float own = mag_[p] + 1.0e-30f;
      const float below = 6.0206f * fast_log2((mag_[p - 1] + 1.0e-30f) / own) - lobe_db(d);
      const float above = 6.0206f * fast_log2((mag_[p + 1] + 1.0e-30f) / own) - lobe_db(-d);
      misfit_[r] = std::sqrt(0.5f * (below * below + above * above));
      weight_[r] = mag_[p] * mag_[p];
    }
    // Partial or noise, region by region. A peak that stands far above the
    // two peaks either side of it is a partial in its own right (a note in
    // breath, or over the hiss of a recording) and goes by its own fit. The rest
    // go by the fit of the block and its two neighbours as a whole, so a
    // chance fit among noise is still noise and a poor fit in a close chord
    // is still a partial.
    const float cross = kCrossHighHz / bin_hz;
    const int blocks = (regions + kNoisyBlock - 1) / kNoisyBlock;
    float block_power[kMaxBlocks], block_misfit[kMaxBlocks];
    for (int r = 0; r < regions; ++r) {
      float tallest = 0.0f;
      const int to = r + kNoisyReach < regions ? r + kNoisyReach : regions - 1;
      for (int i = r - kNoisyReach < 0 ? 0 : r - kNoisyReach; i <= to; ++i) {
        if (i != r && weight_[i] > tallest) tallest = weight_[i];
      }
      stands_[r] = weight_[r] > kProminent * tallest;
    }
    for (int b = 0; b < blocks; ++b) {
      const int from = b * kNoisyBlock;
      const int count = regions - from < kNoisyBlock ? regions - from : kNoisyBlock;
      block_power[b] = 0.0f;
      block_misfit[b] = 0.0f;
      for (int i = from; i < from + count; ++i) {
        if (stands_[i]) continue;
        // Weighted by magnitude: by power, the few tall peaks of a frame of
        // noise (which fit best, as chance has it) would speak for all.
        const float w = std::sqrt(weight_[i]);
        block_power[b] += w;
        block_misfit[b] += w * misfit_[i];
      }
    }
    float low_noise = 0.0f, low_all = 0.0f;
    for (int r = 0; r < regions; ++r) {
      const int b = r / kNoisyBlock;
      float around = 0.0f, around_misfit = 0.0f;
      for (int i = b > 0 ? b - 1 : 0; i <= b + 1 && i < blocks; ++i) {
        around += block_power[i];
        around_misfit += block_misfit[i];
      }
      float noisy = (misfit_[r] - kNoisyOwnFromDb) / kNoisyOwnSpanDb;
      if (!stands_[r] && around > 0.0f) {
        noisy = kit::max(noisy, (around_misfit / around - kNoisyFromDb) / kNoisySpanDb);
      }
      // A peak between two deep valleys is a partial however poorly it
      // fits: one whose pitch is moving (vibrato widens the lobe). The
      // valleys of noise are shallow, 8 dB as a rule and hardly ever 25.
      const int next = slot.start[r + 1] > half_ ? half_ : slot.start[r + 1];
      const float edge = kit::max(mag_[slot.start[r]], mag_[next]);
      const float depth = 6.0206f * fast_log2((mag_[peak_[r]] + 1.0e-30f) / (edge + 1.0e-30f));
      noisy = kit::min(noisy, (kDeepToDb - depth) / (kDeepToDb - kDeepFromDb));
      slot.noisy[r] = regions > 1 ? kit::clamp(noisy, 0.0f, 1.0f) : 0.0f;
#ifdef RV_DEBUG
      {
        const int e = slot.start[r + 1] > half_ ? half_ : slot.start[r + 1];
        const float edge_mag = kit::max(mag_[slot.start[r]], mag_[e]);
        std::fprintf(stderr, "R %d hz %.1f db %.1f misfit %.2f stands %d depth %.1f width %d noisy %.2f block %.2f\n", r, peak_[r] * bin_hz,
                     10.0f * std::log10(weight_[r] / (top * top) + 1e-30f), misfit_[r], stands_[r] ? 1 : 0,
                     20.0f * std::log10(mag_[peak_[r]] / (edge_mag + 1e-30f)), slot.start[r + 1] - slot.start[r], slot.noisy[r],
                     around > 0.0f ? around_misfit / around : 0.0f);
      }
#endif
      if (static_cast<float>(peak_[r]) < cross) {
        low_noise += weight_[r] * slot.noisy[r];
        low_all += weight_[r];
      }
    }
    slot.low_noisy = low_noise > 0.5f * low_all;
    // A single frame of noise is all chance peaks and holes, which would be
    // heard as a fixed, hollow colour. The bins of noisy regions are evened
    // out to the level of the noise around them (about 90 Hz either way;
    // partials are left out of that average and are not touched).
    for (int r = 0; r < regions; ++r) {
      for (int k = slot.start[r]; k < slot.start[r + 1]; ++k) last_re_[k] = slot.noisy[r];
    }
    const int reach = 8;
    float noise_power = 0.0f, noise_count = 0.0f;
    for (int k = 0; k < reach && k <= half_; ++k) {
      noise_power += last_re_[k] * mag_[k] * mag_[k];
      noise_count += last_re_[k];
    }
    for (int k = 0; k <= half_; ++k) {
      if (k + reach <= half_) {
        noise_power += last_re_[k + reach] * mag_[k + reach] * mag_[k + reach];
        noise_count += last_re_[k + reach];
      }
      if (k - reach - 1 >= 0) {
        noise_power -= last_re_[k - reach - 1] * mag_[k - reach - 1] * mag_[k - reach - 1];
        noise_count -= last_re_[k - reach - 1];
      }
      last_im_[k] = noise_count > 0.5f ? std::sqrt(kit::max(noise_power, 0.0f) / noise_count) : mag_[k];
    }
    for (int k = 0; k <= half_; ++k) {
      if (last_re_[k] <= 0.0f || mag_[k] <= 1.0e-20f) continue;
      const float even = mag_[k] + last_re_[k] * (last_im_[k] - mag_[k]);
      const float scale = even / mag_[k];
      slot.c_re[k] *= scale;
      slot.c_im[k] *= scale;
      mag_[k] = even;
    }
    double sum = 0.0;
    for (int k = 0; k <= half_; ++k) sum += static_cast<double>(mag_[k]) * mag_[k];
    // The positive bins hold N²/2 × 0.3046 × the mean square (0.3046 is the
    // mean of the squared Blackman window).
    slot.power = static_cast<float>(sum * 2.0 / (0.3046 * static_cast<double>(frame_) * frame_));
  }

  // One step of a layer's envelope (once per hop); returns its gain, and
  // frees the layer when it has gone.
  float envelope(Slot& slot) {
    using namespace sustainer;
    const bool latch = mode() == kModeLatch;
    const bool hold = hold_on();
    slot.rise = kit::min(1.0f, slot.rise + hop_seconds_ / param(kAttack));
    if (slot.state == kLeaving) {
      slot.leave -= slot.leave_rate;
    } else {
      const float decay = param(kDecay);
      const bool never = !latch && decay >= kNeverDecay;
      const bool letting_go = latch ? !hold : (!hold && !never && (!slot.newest || !playing_));
      if (letting_go) slot.fall *= std::exp(-6.9077553f * hop_seconds_ / decay);
    }
    if (slot.leave <= 0.0f || slot.fall < kGone) {
      slot.state = kFree;
      slot.newest = false;
      slot.gain = 0.0f;
      return 0.0f;
    }
    // The rise is an S-curve (half way at half the Attack time), the leave a
    // quarter sine.
    const float swell = slot.rise * slot.rise * (3.0f - 2.0f * slot.rise);
    slot.gain = swell * slot.fall * kit::SineTable::lookup(0.25f * slot.leave);
    return slot.gain;
  }

  // Build the next frame of every layer in the frequency domain, transform
  // once per channel and overlap-add.
  //
  // The work of one frame is spread over the hop so that no single 128-sample
  // block carries all of it: the envelopes and the first three layers, the
  // other three layers, the left transform, the right transform. The frame
  // is added to the output where the next hop begins.
  void begin_frame() {
    float total = 0.0f;
    frame_any_ = false;
    for (int s = 0; s < kSlots; ++s) {
      frame_gain_[s] = slots_[s].state == kFree ? 0.0f : envelope(slots_[s]);
      total += frame_gain_[s] * frame_gain_[s] * slots_[s].power;
      frame_any_ = frame_any_ || slots_[s].state != kFree;
    }
    if (!frame_any_) return;
    update_shape();
    // Stacked layers are held to a common ceiling so a pile cannot run away.
    const float limit = total > kMaxPower ? std::sqrt(kMaxPower / total) : 1.0f;
    for (int s = 0; s < kSlots; ++s) frame_gain_[s] *= limit;
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k <= half_; ++k) {
        acc_re_[c][k] = 0.0f;
        acc_im_[c][k] = 0.0f;
      }
    }
  }

  void build_layers(int from, int to) {
    using namespace sustainer;
    if (!frame_any_) return;
    const float motion = param(kMotion);
    const float ensemble = param(kEnsemble);
    const float cents = kMinCents + (kMaxCents - kMinCents) * ensemble;
    const float norm = 1.0f / std::sqrt(1.0f + ensemble * ensemble);
    const float centre = norm;
    const float copies = ensemble * norm;
    const float drift_scale = motion * drift_norm_;
    const float drift_cap = kDriftMaxHz * hop_seconds_;
    const float side_depth = motion * kSideCycles * side_norm_;
    const float swell_depth = motion * kSwellDepth * swell_norm_;
    for (int s = from; s < to; ++s) {
      Slot& slot = slots_[s];
      const float gain = frame_gain_[s];
      if (gain == 0.0f) continue;
      for (int r = 0; r < slot.regions; ++r) {
        // The region's own turn.
        float ur = slot.u_re[r] * slot.rot_re[r] - slot.u_im[r] * slot.rot_im[r];
        float ui = slot.u_re[r] * slot.rot_im[r] + slot.u_im[r] * slot.rot_re[r];
        const float keep = 1.5f - 0.5f * (ur * ur + ui * ui);  // back to unit length
        ur *= keep;
        ui *= keep;
        slot.u_re[r] = ur;
        slot.u_im[r] = ui;
        // Motion: three slow random walks per region.
        slot.drift_v[r] += drift_a_ * (slot.rng.bipolar() - slot.drift_v[r]);
        slot.side_a[r] += side_a_ * (slot.rng.bipolar() - slot.side_a[r]);
        slot.side[r] += side_a_ * (slot.side_a[r] - slot.side[r]);
        slot.swell_a[r] += swell_a_ * (slot.rng.bipolar() - slot.swell_a[r]);
        slot.swell[r] += swell_a_ * (slot.swell_a[r] - slot.swell[r]);
        const float wander = kit::min(kDriftCents * slot.cent_turn[r], drift_cap);
        float drift = slot.drift[r] + drift_scale * wander * slot.drift_v[r];
        // Noise: a new phase every hop (anywhere on the circle when it is
        // all noise), so the region sounds as a band of noise, not a note.
        const float noisy = slot.noisy[r];
        if (noisy > 0.0f) drift += 0.5f * noisy * slot.rng.bipolar();
        drift -= std::floor(drift);
        slot.drift[r] = drift;
        const float side = side_depth * slot.part[r] * slot.side[r];
        // exp(y) for |y| < 0.8 by its series: the wander is even in dB.
        const float y = kit::clamp(swell_depth * slot.swell[r], -0.8f, 0.8f);
        const float level = gain * (1.0f + kSmearMakeup * noisy) * (1.0f + y * (1.0f + y * (0.5f + y * (1.0f / 6.0f))));
        // The detuned pair: one copy up, one down, by the same amount.
        const float turn = kit::min(slot.cent_turn[r] * cents, kMaxDetuneTurn);
        float det = slot.det_phase[r] + turn;
        det -= std::floor(det);
        slot.det_phase[r] = det;
        // A copy turning `turn` away from its lobe adds up a little low; undo it.
        const float at = turn * (static_cast<float>(kCompSteps) / kMaxDetuneTurn);
        const int index = kit::clamp_int(static_cast<int>(at), 0, kCompSteps - 1);
        const float pair = copies * (comp_[index] + (comp_[index + 1] - comp_[index]) * (at - static_cast<float>(index)));
        const float even = centre + pair * (kPanNear + kPanFar) * kit::SineTable::cos_lookup(det);
        const float odd = pair * (kPanNear - kPanFar) * kit::SineTable::lookup(det);
        float w_re[2], w_im[2];
        for (int c = 0; c < 2; ++c) {
          const float angle = drift + (c == 0 ? side : -side);
          const float er = kit::SineTable::cos_lookup(angle);
          const float ei = kit::SineTable::lookup(angle);
          const float tr = level * (ur * er - ui * ei);
          const float ti = level * (ur * ei + ui * er);
          const float o = c == 0 ? odd : -odd;
          w_re[c] = tr * even - ti * o;
          w_im[c] = tr * o + ti * even;
        }
        const int end = slot.start[r + 1];
        const int shift = slot.shift[r];
        for (int i = slot.start[r]; i < end; ++i) {
          const float cr = slot.c_re[i];
          const float ci = slot.c_im[i];
          const int k = i + shift;
          acc_re_[0][k] += cr * w_re[0] - ci * w_im[0];
          acc_im_[0][k] += cr * w_im[0] + ci * w_re[0];
          acc_re_[1][k] += cr * w_re[1] - ci * w_im[1];
          acc_im_[1][k] += cr * w_im[1] + ci * w_re[1];
        }
      }
    }
  }

  // Tone and Low Cut, the inverse transform, the synthesis window, and the
  // overlap-add `ahead` samples from now (where the next hop begins).
  void finish_channel(int c, uint32_t ahead) {
    if (!frame_any_) return;
    // Blackman x Hann frames at 75 % overlap sum to exactly 1.34 (the product
    // has no component past the third harmonic); the inverse returns N/2 × x.
    const float scale = kHeldGain * 2.0f / (1.34f * static_cast<float>(frame_));
    for (int k = 0; k <= half_; ++k) {
      acc_re_[c][k] *= shape_[k];
      acc_im_[c][k] *= shape_[k];
    }
    acc_im_[c][0] = 0.0f;
    acc_im_[c][half_] = 0.0f;
    fft_.inverse(acc_re_[c], acc_im_[c], scratch_, frame_);
    const uint32_t start = position_ + ahead;
    for (int n = 0; n < frame_; ++n) {
      output_[c][(start + static_cast<uint32_t>(n)) & kRingMask] += scratch_[n] * window_[n] * scale;
    }
  }

  Slot slots_[kSlots];
  float shape_[kMaxHalf + 1];                           // tone and low cut, per bin
  float now_re_[kMaxHalf + 1], now_im_[kMaxHalf + 1];   // the newest analysis frame
  float last_re_[kMaxHalf + 1], last_im_[kMaxHalf + 1]; // the one a hop before it
  float acc_re_[2][kMaxHalf + 1], acc_im_[2][kMaxHalf + 1];
  float scratch_[kMaxFrame];
  float long_scratch_[kMaxLongFrame];
  float long_re_[2][kLowBins + 1], long_im_[2][kLowBins + 1];
  int refine_slot_ = -1;   // the layer waiting for its second look
  int refine_stage_ = 0;
  int refine_due_ = 0;
  float shape_tone_ = 0.0f;
  float shape_low_cut_ = 0.0f;
  float drift_a_ = 0.0f, side_a_ = 0.0f, swell_a_ = 0.0f;
  float drift_norm_ = 1.0f, side_norm_ = 1.0f, swell_norm_ = 1.0f;
  bool playing_ = false;
  bool hold_seen_ = false;
  int capture_due_ = -1;   // samples until the next capture; negative when none is waiting
  float mag_[kMaxHalf + 1];
  uint16_t peak_[kMaxRegions];
  float det_a_[kMaxFrame / 8 + 1], det_b_[kMaxFrame / 8 + 1];  // the detector's last two frames
  float det_re_[kMaxFrame / 8 + 1], det_im_[kMaxFrame / 8 + 1];
  float slow_[kMaxHalf / 2 + 1];   // the power spectrum of the input, averaged over a tenth of a second
  float ref_[kMaxHalf / 2 + 1];    // ... and what it was when the newest layer was caught
  float level_ = 0.0f;             // the level of the detector's last frame
  float soft_a_ = 0.1f;
  float soft_for_ = 0.0f;          // how long new sound has stood above the reference
  float settle_ = 0.0f;            // what is left of the settling time after a catch
  bool soft_capture_ = false;      // the capture that is waiting was asked for without an onset
  float frame_gain_[kSlots] = {};
  bool frame_any_ = false;
  float flux_mean_ = 0.0f;
  float since_onset_ = 1.0f, quiet_for_ = 1.0f, postponed_ = 0.0f;
  int onsets_ = 0;
  float gate_ = 0.0f;      // the level under which nothing counts as playing

  sustainer_detail::RealFft<kMaxLongFrame> fft_;
  float window_[kMaxFrame];           // Hann: synthesis, and the detector's frame
  float analysis_window_[kMaxFrame];  // Blackman: the capture's frames
  float comp_[kCompSteps + 1];
  float lobe_db_[kLobeSteps + 1];
  float misfit_[kMaxRegions];   // per caught peak: how badly its neighbours fit a partial's lobe, dB
  float weight_[kMaxRegions];   // ... and its power
  bool stands_[kMaxRegions];    // ... and whether it towers over the peaks around it
  float input_[kInputRing];
  float output_[2][kRing];
  kit::Smoother mix_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  float hop_seconds_ = 0.0f;
  uint32_t position_ = 0;
  int frame_ = 4096;
  int long_frame_ = 16384;
  int half_ = 2048;
  int hop_ = 1024;
};

}  // namespace livemix
