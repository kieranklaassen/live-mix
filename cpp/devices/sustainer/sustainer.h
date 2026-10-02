#pragma once

// Sustain: catches what is played and holds it as an endless pad.
// (Signal path and method notes: see the end of this comment block, filled
// in as the device grows.)

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
      auto sinc = [](double v) { return std::fabs(v) < 1.0e-9 ? 1.0 : std::sin(3.14159265358979323846 * v) / (3.14159265358979323846 * v); };
      const double g = 0.335 * sinc(x) + 0.24 * (sinc(x - 1) + sinc(x + 1)) + 0.0825 * (sinc(x - 2) + sinc(x + 2)) +
                       0.01 * (sinc(x - 3) + sinc(x + 3));
      comp_[i] = static_cast<float>(0.335 / g);
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
      const float mono = 0.5f * (in[0] + in[1]);
      // A NaN or runaway sample must not reach the analysis.
      input_[position_ & kInputMask] = (mono > -64.0f && mono < 64.0f) ? mono : 0.0f;

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

  // For the harness: what the detector saw and how many layers sound.
  float flux() const { return flux_; }
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
  static constexpr float kPanNear = 0.9239f;    // each copy sits 45° off centre
  static constexpr float kPanFar = 0.3827f;
  static constexpr float kDriftCents = 3.0f;    // Motion 1: pitch wander of a partial (rms) ...
  static constexpr float kDriftMaxHz = 1.5f;    // ... but no more than this
  static constexpr float kSideCycles = 0.18f;   // Motion 1: left/right phase difference (rms)
  static constexpr float kSwellDepth = 0.3f;    // Motion 1: level wander of a partial (rms)
  static constexpr float kTiltPivotHz = 600.0f;
  static constexpr float kCrossLowHz = 450.0f;  // the long frame takes over below here ...
  static constexpr float kCrossHighHz = 650.0f; // ... and has no part above here
  static constexpr float kFluxAtZero = 20.0f;   // fixed part of the onset threshold at Sensitivity 0 ...
  static constexpr float kFluxAtOne = 9.0f;     // ... and at 1
  static constexpr float kFluxAdapt = 2.0f;     // plus this many times the recent average flux
  static constexpr float kFluxMeanRate = 0.03f;
  static constexpr float kRefractorySeconds = 0.05f;
  static constexpr float kPlayingHangSeconds = 0.15f;
  static constexpr float kMaxPostponeSeconds = 0.2f;

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
    int regions;
    int state;
    int serial;      // the onset count when it was caught
    float delay;     // samples by which the held sound runs behind the input
    bool newest;     // the layer the player's last note made
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
    flux_ = 0.0f;
    flux_mean_ = 0.0f;
    since_onset_ = 1.0f;
    quiet_for_ = 1.0f;
    postponed_ = 0.0f;
    onsets_ = 0;
    gate_ = 0.0f;
    for (int k = 0; k <= kMaxFrame / 8; ++k) det_a_[k] = det_b_[k] = 0.0f;
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
    // on steps 0 and 4, the frame on 1, 2, 3 and 5, a capture on 0, 4, 6 or
    // 7, the second look at the lows on 6 and 7.
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
    flux_ = flux;
    const float fixed = kFluxAtZero * std::pow(kFluxAtOne / kFluxAtZero, sensitivity);
    const bool onset = flux > fixed + kFluxAdapt * flux_mean_ && level > gate && since_onset_ >= kRefractorySeconds;
    flux_mean_ += kFluxMeanRate * (kit::min(flux, 3.0f * flux_mean_ + fixed) - flux_mean_);
    const float step = static_cast<float>(size / 2) / sample_rate();
    since_onset_ += step;
    // "Playing" lasts a little past the last frame above half the gate level.
    quiet_for_ = level > 0.5f * gate ? 0.0f : quiet_for_ + step;
    playing_ = quiet_for_ < kPlayingHangSeconds;
    if (!onset) return;
    since_onset_ = 0.0f;
    ++onsets_;
    if (mode() == kModeLatch || hold_on()) return;
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

  // Once per analysis frame: act on Hold and on a capture that has come due.
  void frame_tick() {
    const bool hold = hold_on();
    const bool latch = mode() == kModeLatch;
    if (latch && hold && !hold_seen_) capture_due_ = 0;  // Latch: catch this moment
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
    // A capture that finds nothing (the click of a note being cut off, a
    // touch on the strings) must not push out what is held.
    if (mode() != kModeLatch && slot.power < gate_ * gate_) return;
    const bool layering = mode() == kModeLayer;
    const float glide_rate = hop_seconds_ / param(kGlide);
    int held = 0;
    for (int s = 0; s < kSlots; ++s) {
      Slot& other = slots_[s];
      if (other.state == kFree) continue;
      other.newest = false;
      if (other.state == kHeld && !layering) {
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
    // Look again at the lows once a long frame of the note has gone by (in
    // Latch at once: the moment is whatever has been sounding).
    refine_slot_ = chosen;
    refine_stage_ = 0;
    const int since = static_cast<int>(since_onset_ * sample_rate());
    refine_due_ = mode() == kModeLatch ? 0 : (long_frame_ + hop_ > since ? long_frame_ + hop_ - since : 0);
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
    const bool latch = mode() == kModeLatch;
    if (slot.state != kHeld || (!latch && (slot.serial != onsets_ || !playing_))) {
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

  // Where the lows are handed from the caught frame to the rebuilt partials:
  // 0 below 450 Hz, 1 above 650 Hz.
  static float crossover(float hz) {
    const float x = kit::clamp((hz - kCrossLowHz) / (kCrossHighHz - kCrossLowHz), 0.0f, 1.0f);
    return x * x * (3.0f - 2.0f * x);
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
    // The held sound runs `delay` samples behind the input, and so must they.
    const double from_middle = static_cast<double>(static_cast<int32_t>(next_landing() - end)) + 0.5 * frame_ - hop_ -
                               1.0 + 0.5 * long_frame_ - slot.delay;
    const float floor = kit::max(strongest * 1.0e-3f, 1.0e-9f);
    int r = slot.regions;
    int pool = half_ + 1;
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
      const float weight = 1.0f - crossover(hz);
      if (hz < 15.0f || weight < 1.0e-3f) continue;
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
      const float scale = 0.5f * amplitude * weight * static_cast<float>(frame_);
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
    slot.start[r] = static_cast<uint16_t>(pool);
    slot.regions = r;
    for (int k = 0; k <= half_; ++k) {
      const float hz = static_cast<float>(k) * short_bin;
      if (hz >= kCrossHighHz) break;
      const float keep = crossover(hz);
      slot.c_re[k] *= keep;
      slot.c_im[k] *= keep;
    }
  }

  // A region begins: its turn per hop (radians), its frequency, and its
  // motion at rest.
  void start_region(Slot& slot, int r, float angle, float hz) {
    slot.rot_re[r] = std::cos(angle);
    slot.rot_im[r] = std::sin(angle);
    slot.u_re[r] = 1.0f;
    slot.u_im[r] = 0.0f;
    slot.cent_turn[r] = hz * 0.00057779f * hop_seconds_;
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
    slot.gain = slot.rise * slot.fall * kit::SineTable::lookup(0.25f * slot.leave);
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
        drift -= std::floor(drift);
        slot.drift[r] = drift;
        const float side = side_depth * slot.part[r] * slot.side[r];
        const float level = gain * kit::clamp(1.0f + swell_depth * slot.swell[r], 0.25f, 2.0f);
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
  float frame_gain_[kSlots] = {};
  bool frame_any_ = false;
  float flux_ = 0.0f, flux_mean_ = 0.0f;
  float since_onset_ = 1.0f, quiet_for_ = 1.0f, postponed_ = 0.0f;
  int onsets_ = 0;
  float gate_ = 0.0f;      // the level under which nothing counts as playing

  sustainer_detail::RealFft<kMaxLongFrame> fft_;
  float window_[kMaxFrame];           // Hann: synthesis, and the detector's frame
  float analysis_window_[kMaxFrame];  // Blackman: the capture's frames
  float comp_[kCompSteps + 1];
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
