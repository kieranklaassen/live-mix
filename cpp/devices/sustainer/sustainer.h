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
  static constexpr int kSlots = 6;
  static constexpr int kMaxRegions = 1400;  // peaks are at least three bins apart

  void init(float sample_rate) {
    using namespace sustainer;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    frame_ = sr > 64000.0f ? 8192 : 4096;
    half_ = frame_ / 2;
    hop_ = frame_ / 4;
    hop_seconds_ = static_cast<float>(hop_) / sr;
    fft_.init();
    for (int n = 0; n < frame_; ++n) {
      window_[n] = 0.5f - 0.5f * static_cast<float>(std::cos(2.0 * 3.14159265358979323846 * n / frame_));
    }
    for (int i = 0; i < kRing; ++i) {
      input_[i] = 0.0f;
      output_[0][i] = 0.0f;
      output_[1][i] = 0.0f;
    }
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
      input_[position_ & kRingMask] = (mono > -64.0f && mono < 64.0f) ? mono : 0.0f;

      const uint32_t phase = position_ & hop_mask;
      if (phase == 0) synthesise();
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
  static constexpr int kRing = 16384;
  static constexpr uint32_t kRingMask = kRing - 1;

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
  static constexpr float kPanNear = 0.9239f;    // each copy sits 45° off centre
  static constexpr float kPanFar = 0.3827f;
  static constexpr float kDriftCents = 3.0f;    // Motion 1: pitch wander of a partial (rms) ...
  static constexpr float kDriftMaxHz = 1.5f;    // ... but no more than this
  static constexpr float kSideCycles = 0.18f;   // Motion 1: left/right phase difference (rms)
  static constexpr float kSwellDepth = 0.3f;    // Motion 1: level wander of a partial (rms)
  static constexpr float kTiltPivotHz = 800.0f;
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
    // Tone: up to 4.5 dB per octave either way about the pivot.
    const float slope = 4.5f * tone;
    const float bin_hz = sample_rate() / static_cast<float>(frame_);
    const float cut_octave = std::log2(low_cut / kTiltPivotHz);
    for (int k = 0; k <= half_; ++k) {
      const float octave = std::log2(static_cast<float>(k > 0 ? k : 1) * bin_hz / kTiltPivotHz);
      const float db = kit::clamp(slope * octave, -48.0f, 12.0f);
      // The cut is a raised-cosine step one octave wide, -6 dB at Low Cut.
      const float x = k == 0 ? 0.0f : kit::clamp(octave - cut_octave + 0.5f, 0.0f, 1.0f);
      shape_[k] = std::exp(db * 0.11512925f) * x * x * (3.0f - 2.0f * x);
    }
  }

  // One held sound: the spectrum of the frame it was caught in, cut into
  // regions (one per spectral peak) that each turn as a rigid whole.
  enum SlotState : int { kFree = 0, kHeld, kLeaving };
  struct Slot {
    float c_re[kMaxHalf + 1], c_im[kMaxHalf + 1];
    uint16_t start[kMaxRegions + 1];                 // region r is bins [start[r], start[r+1])
    float u_re[kMaxRegions], u_im[kMaxRegions];      // running phase of the region
    float rot_re[kMaxRegions], rot_im[kMaxRegions];  // its turn per hop
    float cent_turn[kMaxRegions];                    // cycles per hop that one cent of detune adds
    float det_phase[kMaxRegions];                    // phase of the detuned pair, cycles
    float part[kMaxRegions];                         // how far left and right may part (0 in the bass)
    float drift_v[kMaxRegions], drift[kMaxRegions];  // common phase wander: velocity, phase (cycles)
    float side_a[kMaxRegions], side[kMaxRegions];    // left/right phase difference (two-pole noise)
    float swell_a[kMaxRegions], swell[kMaxRegions];  // slow level wander (two-pole noise)
    int regions;
    int state;
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
    if (phase == static_cast<uint32_t>(hop_ / 2)) {
      analyse();
      frame_tick();
    }
    const uint32_t detector_hop = static_cast<uint32_t>(frame_ / 8);
    if ((position_ & (detector_hop - 1u)) == detector_hop / 4u) detect();
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
      const float x = input_[(first + static_cast<uint32_t>(n)) & kRingMask];
      sum += x * x;
      scratch_[n] = x * window_[4 * n];
    }
    fft_.forward(scratch_, acc_re_[0], acc_im_[0], size);
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
      const float re = acc_re_[0][k];
      const float im = acc_im_[0][k];
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
    const int wait = frame_ + hop_;
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
    capture_due_ -= hop_;
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

  // The long analysis frame: the last `frame_` samples, Hann-windowed. The
  // frame before it (one hop earlier) is kept for the phase turn.
  void analyse() {
    for (int k = 0; k <= half_; ++k) {
      last_re_[k] = now_re_[k];
      last_im_[k] = now_im_[k];
    }
    const uint32_t first = position_ + 1u - static_cast<uint32_t>(frame_);
    for (int n = 0; n < frame_; ++n) {
      scratch_[n] = input_[(first + static_cast<uint32_t>(n)) & kRingMask] * window_[n];
    }
    fft_.forward(scratch_, now_re_, now_im_, frame_);
  }

  // Catch the sound of the last two analysis frames into `slot`.
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
    float top = 0.0f;
    for (int k = 0; k <= half_; ++k) {
      const float now = std::sqrt(now_re_[k] * now_re_[k] + now_im_[k] * now_im_[k]);
      const float last = std::sqrt(last_re_[k] * last_re_[k] + last_im_[k] * last_im_[k]);
      const float mean = 0.5f * (now + last);
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
      // What a partial exactly on the bin would turn by: p quarter turns.
      const float centre_angle = kit::kHalfPi * static_cast<float>(p & 3);
      float deviation = 0.0f;
      const float size = tr * tr + ti * ti;
      if (size > 1.0e-30f) {
        deviation = std::atan2(ti, tr) - centre_angle;
        deviation -= kit::kTwoPi * std::floor(deviation / kit::kTwoPi + 0.5f);
      }
      const float angle = centre_angle + deviation;
      slot.rot_re[r] = std::cos(angle);
      slot.rot_im[r] = std::sin(angle);
      slot.u_re[r] = 1.0f;
      slot.u_im[r] = 0.0f;
      // hop = frame / 4, so a full turn of deviation is four bins.
      const float hz = kit::max(0.0f, (static_cast<float>(p) + deviation * (2.0f / kit::kPi)) * bin_hz);
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
    double sum = 0.0;
    for (int k = 0; k <= half_; ++k) sum += static_cast<double>(mag_[k]) * mag_[k];
    // A sine of amplitude A leaves 3 N² A² / 32 in the positive bins.
    slot.power = static_cast<float>(sum * 16.0 / (3.0 * static_cast<double>(frame_) * frame_));
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
  void synthesise() {
    using namespace sustainer;
    float gains[kSlots];
    float total = 0.0f;
    bool any = false;
    for (int s = 0; s < kSlots; ++s) {
      gains[s] = slots_[s].state == kFree ? 0.0f : envelope(slots_[s]);
      total += gains[s] * gains[s] * slots_[s].power;
      any = any || slots_[s].state != kFree;
    }
    if (!any) return;
    update_shape();
    // Stacked layers are held to a common ceiling so a pile cannot run away.
    const float limit = total > kMaxPower ? std::sqrt(kMaxPower / total) : 1.0f;

    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k <= half_; ++k) {
        acc_re_[c][k] = 0.0f;
        acc_im_[c][k] = 0.0f;
      }
    }
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
    for (int s = 0; s < kSlots; ++s) {
      Slot& slot = slots_[s];
      if (slot.state == kFree) continue;
      const float gain = gains[s] * limit;
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
        const float pair = copies * 1.5f / (1.0f + 0.5f * kit::SineTable::cos_lookup(turn));
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
        for (int k = slot.start[r]; k < end; ++k) {
          const float cr = slot.c_re[k];
          const float ci = slot.c_im[k];
          acc_re_[0][k] += cr * w_re[0] - ci * w_im[0];
          acc_im_[0][k] += cr * w_im[0] + ci * w_re[0];
          acc_re_[1][k] += cr * w_re[1] - ci * w_im[1];
          acc_im_[1][k] += cr * w_im[1] + ci * w_re[1];
        }
      }
    }
    // Hann² frames at 75 % overlap sum to 1.5; the inverse returns N/2 × x.
    const float scale = kHeldGain * 4.0f / (3.0f * static_cast<float>(frame_));
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k <= half_; ++k) {
        acc_re_[c][k] *= shape_[k];
        acc_im_[c][k] *= shape_[k];
      }
      acc_im_[c][0] = 0.0f;
      acc_im_[c][half_] = 0.0f;
      fft_.inverse(acc_re_[c], acc_im_[c], scratch_, frame_);
      for (int n = 0; n < frame_; ++n) {
        output_[c][(position_ + static_cast<uint32_t>(n)) & kRingMask] += scratch_[n] * window_[n] * scale;
      }
    }
  }

  Slot slots_[kSlots];
  float shape_[kMaxHalf + 1];                           // tone and low cut, per bin
  float now_re_[kMaxHalf + 1], now_im_[kMaxHalf + 1];   // the newest analysis frame
  float last_re_[kMaxHalf + 1], last_im_[kMaxHalf + 1]; // the one a hop before it
  float acc_re_[2][kMaxHalf + 1], acc_im_[2][kMaxHalf + 1];
  float scratch_[kMaxFrame];
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
  float flux_ = 0.0f, flux_mean_ = 0.0f;
  float since_onset_ = 1.0f, quiet_for_ = 1.0f, postponed_ = 0.0f;
  int onsets_ = 0;
  float gate_ = 0.0f;      // the level under which nothing counts as playing

  sustainer_detail::RealFft<kMaxFrame> fft_;
  float window_[kMaxFrame];
  float input_[kRing];
  float output_[2][kRing];
  kit::Smoother mix_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  float hop_seconds_ = 0.0f;
  uint32_t position_ = 0;
  int frame_ = 4096;
  int half_ = 2048;
  int hop_ = 1024;
};

}  // namespace livemix
