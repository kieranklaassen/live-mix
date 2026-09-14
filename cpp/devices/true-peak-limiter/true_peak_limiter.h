#pragma once

// Lookahead true-peak brickwall limiter for the master bus (live-mix U16).
// Header-only, allocation-free, no dependencies beyond <cmath>, so the same
// source serves the WASM device (true_peak_limiter_device.cpp) and a native
// host.
//
// Signal path, per sample, stereo-linked:
//
//   x ─┬─ true-peak detector (BS.1770-4 Annex 2 four-phase FIR) ─ tp
//      │      g_req = min(1, ceiling / tp)
//      │      r     = release-smoothed g_req (falls instantly, recovers exp.)
//      │      m     = min(r) over the last L+1 samples          (lookahead)
//      │      s     = mean(m) over the last L samples           (smooth attack)
//      └─ delay D = L + 5 ──────────────────────────► × s ► clip(±ceiling) ► y
//
// The window sizes are chosen so that both s[n] and s[n+1] are guaranteed to be
// at most the required gain for the inter-sample interval that y[n] starts:
// with a sliding minimum of length W and a box of length B, every window
// contributing to s[n] and s[n+1] contains index j = n + 1 − B iff W = B + 1.
// The FIR phases at input index j describe the waveform between raw samples
// j − 6 and j − 5.25, so j − 6 = n − D gives D = L + 5. The result never
// exceeds the ceiling on the BS.1770 4×-oversampled measure (what a
// compliance meter reads), and the final clip keeps every sample under it.
// Against a 16× windowed-sinc reference the residual over-read is the 4×
// detector's own under-estimate: negligible on music, ~0.75 dB on full-band
// white noise — still under −0.1 dBTP at the default −1 dBTP ceiling.
//
// Attack: the box filter turns the required reduction into a linear ramp over
// L samples ending exactly when the peak arrives. Release: exponential toward
// unity with the configured time constant; a new peak resets it instantly.

#include <cmath>

namespace livemix {

class TruePeakLimiter {
 public:
  static constexpr float kLookaheadSeconds = 0.0015f;
  static constexpr int kMinLookaheadFrames = 8;
  static constexpr int kMaxLookaheadFrames = 512;  // 1.5 ms up to 192 kHz is 288
  static constexpr int kFirTaps = 12;
  static constexpr int kFirPhases = 4;
  // Raw sample index the FIR phases line up with (their group delay, floored).
  static constexpr int kInterpolatorDelay = 6;
  static constexpr int kDelayCapacity = 1024;  // > kMaxLookaheadFrames + kInterpolatorDelay
  static constexpr int kDequeCapacity = 1024;  // power of two > kMaxLookaheadFrames + 1
  static constexpr float kSmoothingSeconds = 0.005f;

  static constexpr float kDefaultCeilingDb = -1.0f;
  static constexpr float kDefaultReleaseMs = 100.0f;
  static constexpr float kDefaultInputGainDb = 0.0f;

  void prepare(float sample_rate) {
    sample_rate_ = sample_rate > 1.0f ? sample_rate : 48000.0f;
    int lookahead = static_cast<int>(std::lround(kLookaheadSeconds * sample_rate_));
    if (lookahead < kMinLookaheadFrames) lookahead = kMinLookaheadFrames;
    if (lookahead > kMaxLookaheadFrames) lookahead = kMaxLookaheadFrames;
    box_frames_ = lookahead;
    min_frames_ = lookahead + 1;
    delay_frames_ = lookahead + kInterpolatorDelay - 1;
    smoothing_coefficient_ = 1.0f - std::exp(-1.0f / (kSmoothingSeconds * sample_rate_));
    setCeilingDb(ceiling_db_);
    setReleaseMs(release_ms_);
    setInputGainDb(input_gain_db_);
    reset();
  }

  // Clears every delay line and envelope; parameters and their smoothers snap to target.
  void reset() {
    for (int i = 0; i < kDelayCapacity; ++i) {
      delay_left_[i] = 0.0f;
      delay_right_[i] = 0.0f;
    }
    for (int i = 0; i < kFirTaps * 2; ++i) {
      fir_left_[i] = 0.0f;
      fir_right_[i] = 0.0f;
    }
    for (int i = 0; i < kDequeCapacity; ++i) box_ring_[i] = 1.0f;
    write_index_ = 0;
    fir_index_ = 0;
    release_state_ = 1.0f;
    deque_head_ = 0;
    deque_tail_ = 0;
    sample_index_ = 0;
    box_index_ = 0;
    box_sum_ = static_cast<double>(box_frames_);
    box_since_recompute_ = 0;
    envelope_ = 1.0f;
    ceiling_ = ceiling_target_;
    input_gain_ = input_gain_target_;
  }

  // Gains ramp over 5 ms while audio is running; before the first sample they
  // snap, so initial parameters are exact from the first frame.
  void setCeilingDb(float db) {
    ceiling_db_ = db;
    ceiling_target_ = dbToGain(db);
    if (sample_index_ == 0) ceiling_ = ceiling_target_;
  }

  void setReleaseMs(float ms) {
    release_ms_ = ms;
    const float seconds = ms * 0.001f;
    release_coefficient_ = 1.0f - std::exp(-1.0f / (seconds * sample_rate_));
  }

  void setInputGainDb(float db) {
    input_gain_db_ = db;
    input_gain_target_ = dbToGain(db);
    if (sample_index_ == 0) input_gain_ = input_gain_target_;
  }

  float ceilingDb() const { return ceiling_db_; }
  float releaseMs() const { return release_ms_; }
  float inputGainDb() const { return input_gain_db_; }

  // Samples from input to output (plugin delay compensation).
  int latencyFrames() const { return delay_frames_; }
  float latencySeconds() const { return static_cast<float>(delay_frames_) / sample_rate_; }

  // Gain currently applied, 0..1 (1 = no reduction).
  float envelope() const { return envelope_; }
  float gainReductionDb() const { return 20.0f * std::log10(envelope_ > 1.0e-9f ? envelope_ : 1.0e-9f); }

  // One stereo frame, in place.
  void process(float& left, float& right) {
    // Parameter smoothing (5 ms one-pole; snaps when it gets close).
    input_gain_ = smooth(input_gain_, input_gain_target_);
    ceiling_ = smooth(ceiling_, ceiling_target_);

    const float in_left = left * input_gain_;
    const float in_right = right * input_gain_;

    // Delay line: write now, read D samples back.
    delay_left_[write_index_] = in_left;
    delay_right_[write_index_] = in_right;
    int read_index = write_index_ - delay_frames_;
    if (read_index < 0) read_index += kDelayCapacity;
    const float delayed_left = delay_left_[read_index];
    const float delayed_right = delay_right_[read_index];
    if (++write_index_ == kDelayCapacity) write_index_ = 0;

    // True-peak detector, stereo-linked, aligned to raw sample n − 6.
    const float true_peak = detect(in_left, in_right);
    const float required = true_peak > ceiling_ ? ceiling_ / true_peak : 1.0f;

    // Release: instant down, exponential up.
    release_state_ += (1.0f - release_state_) * release_coefficient_;
    if (release_state_ > 1.0f - 1.0e-7f) release_state_ = 1.0f;
    if (required < release_state_) release_state_ = required;

    // Sliding minimum over the last min_frames_ values (monotonic deque).
    const float minimum = pushMinimum(release_state_);

    // Box average over the last box_frames_ minima: the attack ramp.
    const float leaving = box_ring_[box_index_];
    box_ring_[box_index_] = minimum;
    if (++box_index_ == box_frames_) box_index_ = 0;
    box_sum_ += static_cast<double>(minimum) - static_cast<double>(leaving);
    if (++box_since_recompute_ >= box_frames_) {
      box_since_recompute_ = 0;
      double sum = 0.0;
      for (int i = 0; i < box_frames_; ++i) sum += box_ring_[i];
      box_sum_ = sum;
    }
    float gain = static_cast<float>(box_sum_ / box_frames_);
    if (gain > 1.0f) gain = 1.0f;
    envelope_ = gain;

    left = clip(delayed_left * gain);
    right = clip(delayed_right * gain);
  }

 private:
  static float dbToGain(float db) { return std::pow(10.0f, db / 20.0f); }

  float smooth(float current, float target) const {
    const float next = current + (target - current) * smoothing_coefficient_;
    return std::fabs(next - target) < 1.0e-7f ? target : next;
  }

  float clip(float x) const {
    if (x > ceiling_) return ceiling_;
    if (x < -ceiling_) return -ceiling_;
    return x;
  }

  // Pushes one stereo frame into the FIR histories and returns the largest
  // magnitude among the raw frame six samples back and the interpolated
  // phases around it.
  float detect(float left, float right) {
    fir_index_ = fir_index_ + 1 == kFirTaps ? 0 : fir_index_ + 1;
    fir_left_[fir_index_] = left;
    fir_left_[fir_index_ + kFirTaps] = left;
    fir_right_[fir_index_] = right;
    fir_right_[fir_index_ + kFirTaps] = right;
    const int newest = fir_index_ + kFirTaps;

    float peak = std::fabs(fir_left_[newest - kInterpolatorDelay]);
    const float raw_right = std::fabs(fir_right_[newest - kInterpolatorDelay]);
    if (raw_right > peak) peak = raw_right;
    for (int p = 0; p < kFirPhases; ++p) {
      const float* h = kFirCoefficients[p];
      float yl = 0.0f;
      float yr = 0.0f;
      for (int i = 0; i < kFirTaps; ++i) {
        yl += h[i] * fir_left_[newest - i];
        yr += h[i] * fir_right_[newest - i];
      }
      yl = std::fabs(yl);
      yr = std::fabs(yr);
      if (yl > peak) peak = yl;
      if (yr > peak) peak = yr;
    }
    return peak;
  }

  // Monotonic deque: values increase from head to tail; the head is the
  // window minimum. Indices are absolute sample counts.
  float pushMinimum(float value) {
    while (deque_tail_ != deque_head_) {
      const int back = (deque_tail_ - 1) & (kDequeCapacity - 1);
      if (deque_values_[back] < value) break;
      deque_tail_ = back;
    }
    deque_values_[deque_tail_] = value;
    deque_indices_[deque_tail_] = sample_index_;
    deque_tail_ = (deque_tail_ + 1) & (kDequeCapacity - 1);
    const long long oldest_allowed = sample_index_ - static_cast<long long>(min_frames_) + 1;
    while (deque_indices_[deque_head_] < oldest_allowed) {
      deque_head_ = (deque_head_ + 1) & (kDequeCapacity - 1);
    }
    ++sample_index_;
    return deque_values_[deque_head_];
  }

  // BS.1770-4 Annex 2, Figure 4 — identical to TRUE_PEAK_FIR_PHASES in
  // src/core/analysis/loudness.ts so the limiter and the meter agree.
  static constexpr float kFirCoefficients[kFirPhases][kFirTaps] = {
      {0.001708984375f, 0.010986328125f, -0.0196533203125f, 0.033203125f, -0.0594482421875f,
       0.1373291015625f, 0.97216796875f, -0.102294921875f, 0.047607421875f, -0.026611328125f,
       0.014892578125f, -0.00830078125f},
      {-0.0291748046875f, 0.029296875f, -0.0517578125f, 0.089111328125f, -0.16650390625f,
       0.465087890625f, 0.77978515625f, -0.2003173828125f, 0.1015625f, -0.0582275390625f,
       0.0330810546875f, -0.0189208984375f},
      {-0.0189208984375f, 0.0330810546875f, -0.0582275390625f, 0.1015625f, -0.2003173828125f,
       0.77978515625f, 0.465087890625f, -0.16650390625f, 0.089111328125f, -0.0517578125f,
       0.029296875f, -0.0291748046875f},
      {-0.00830078125f, 0.014892578125f, -0.026611328125f, 0.047607421875f, -0.102294921875f,
       0.97216796875f, 0.1373291015625f, -0.0594482421875f, 0.033203125f, -0.0196533203125f,
       0.010986328125f, 0.001708984375f},
  };

  float sample_rate_ = 48000.0f;
  int box_frames_ = 72;
  int min_frames_ = 73;
  int delay_frames_ = 77;
  float smoothing_coefficient_ = 0.004f;

  float ceiling_db_ = kDefaultCeilingDb;
  float release_ms_ = kDefaultReleaseMs;
  float input_gain_db_ = kDefaultInputGainDb;
  float ceiling_target_ = 0.891250938f;
  float ceiling_ = 0.891250938f;
  float input_gain_target_ = 1.0f;
  float input_gain_ = 1.0f;
  float release_coefficient_ = 0.0002f;

  float delay_left_[kDelayCapacity] = {};
  float delay_right_[kDelayCapacity] = {};
  int write_index_ = 0;

  float fir_left_[kFirTaps * 2] = {};
  float fir_right_[kFirTaps * 2] = {};
  int fir_index_ = 0;

  float release_state_ = 1.0f;

  float deque_values_[kDequeCapacity] = {};
  long long deque_indices_[kDequeCapacity] = {};
  int deque_head_ = 0;
  int deque_tail_ = 0;
  long long sample_index_ = 0;

  float box_ring_[kDequeCapacity] = {};
  int box_index_ = 0;
  double box_sum_ = 72.0;
  int box_since_recompute_ = 0;

  float envelope_ = 1.0f;
};

}  // namespace livemix
