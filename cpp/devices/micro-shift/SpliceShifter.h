#pragma once

// The pitch shifter inside Micro Shift: one read head on a delay line,
// moving at (1 - ratio) samples per sample, that is spliced back whenever it
// has drifted too far from where the Delay control wants it.
//
// A delay-line shifter in the usual two-head form (kit::DelayPitchShifter)
// crossfades all the time, so a steady note is amplitude-modulated at the
// window rate: that is the faint chorus sweep a micro shift must not have.
// At a few cents the head only drifts a few milliseconds per second, so here
// one head plays alone for seconds at a time and the rare splice is made
// inaudible instead:
//
//   - WHERE: the jump length is chosen by normalised cross-correlation
//     between the signal at the head and the signal at each candidate
//     landing point (a coarse pass on a decimated copy, then a fine pass at
//     full rate with a parabolic peak), so both heads read the same waveform
//     through the crossfade. This is the autocorrelation splice of the
//     second-generation studio harmonizers (US 4,464,784, expired) and the
//     waveform-similarity rule of WSOLA (Verhelst and Roelands, "An
//     overlap-add technique based on waveform similarity (WSOLA) for high
//     quality time-scale modification of speech", ICASSP 1993).
//   - WHEN: an onset detector remembers where recent attacks sit in the
//     line; a splice waits until the stretch between the two heads holds no
//     attack, so a transient is neither played twice nor skipped. If the
//     head runs out of room first, the splice is forced.
//   - HOW: a raised-cosine crossfade whose gains are scaled by the measured
//     correlation, so the power stays level whether the two heads agree (a
//     held note: plain linear fade) or not (noise: equal-power fade).
//
// Reads use a 16-tap Kaiser-windowed sinc (flat to 0.35 of the sample rate,
// images below -75 dB there): a Hermite read would leave images near -30 dB
// on the top octave, and the feedback loop passes through it again and
// again.
//
// Everything is fixed-size; nothing allocates.

#include <cmath>
#include <cstdint>

#include "../../kit/math.h"

namespace livemix {
namespace micro_shift_parts {

// Windowed-sinc fractional-delay kernel, shared by every shifter instance.
// Rows are phases 0..kPhases (inclusive) of the fractional position; a read
// interpolates linearly between two neighbouring rows.
class SincTable {
 public:
  static constexpr int kTaps = 16;
  static constexpr int kHalf = 8;
  static constexpr int kPhases = 128;

  static void init() {
    if (ready()) return;
    float* table = data();
    const double pi = 3.14159265358979323846;
    const double beta = 7.5;
    const double cutoff = 0.92;
    const double i0_beta = bessel_i0(beta);
    for (int phase = 0; phase <= kPhases; ++phase) {
      const double fraction = static_cast<double>(phase) / kPhases;
      double taps[kTaps];
      double sum = 0.0;
      for (int k = 0; k < kTaps; ++k) {
        // Tap k weights the sample (k - 7) places after the one at floor(position).
        const double t = static_cast<double>(k - (kHalf - 1)) - fraction;
        const double r = t / kHalf;
        const double window =
            r * r < 1.0 ? bessel_i0(beta * std::sqrt(1.0 - r * r)) / i0_beta : 0.0;
        const double x = pi * cutoff * t;
        const double sinc = std::fabs(x) < 1.0e-9 ? 1.0 : std::sin(x) / x;
        taps[k] = cutoff * sinc * window;
        sum += taps[k];
      }
      // Unity gain at DC for every phase.
      for (int k = 0; k < kTaps; ++k) {
        table[phase * kTaps + k] = static_cast<float>(taps[k] / sum);
      }
    }
    ready() = true;
  }

  static const float* row(int phase) { return data() + phase * kTaps; }

 private:
  static double bessel_i0(double x) {
    double sum = 1.0;
    double term = 1.0;
    for (int k = 1; k < 40; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }
  static float* data() {
    static float table[(kPhases + 1) * kTaps];
    return table;
  }
  static bool& ready() {
    static bool is_ready = false;
    return is_ready;
  }
};

class SpliceShifter {
 public:
  // 341 ms at 96 kHz: the longest head position (84 ms plus the sweep) and
  // the correlation window behind it fit several times over.
  static constexpr int kSize = 32768;
  static constexpr int kMask = kSize - 1;
  static constexpr int kDecSize = 8192;
  static constexpr int kDecMask = kDecSize - 1;

  // How far the head may sit from the centre, in milliseconds, and how a
  // splice is shaped. The head travels from kLandMs behind the centre to
  // kSoftMs ahead of it, so its average position is the centre. A jump is 5
  // to 25 ms long: that choice of landing points holds a whole period of
  // anything above 50 Hz, and the common period of most chords.
  static constexpr float kJumpMinMs = 5.0f;
  static constexpr float kJumpRangeMs = 10.0f;  // either side of the jump that reaches the landing point
  static constexpr float kSoftMs = 7.5f;   // this far ahead of the centre: splice at the next clean moment
  static constexpr float kHardMs = 9.5f;   // this far ahead: splice now
  static constexpr float kLandMs = 7.5f;   // a splice aims this far behind the centre
  static constexpr float kFarMs = 19.5f;   // this far away on either side: splice now
  static constexpr float kFadeMs = 12.0f;      // crossfade when the two heads agree
  static constexpr float kLongFadeMs = 30.0f;  // and when they do not
  static constexpr float kWanderRoomMs = 1.6f; // kept free under the lowest head for the caller's wander
  static constexpr float kCoarseWindowMs = 10.0f;
  static constexpr float kFineWindowMs = 5.0f;
  // The Delay control may not ask for a centre closer to the write head.
  static constexpr float kMinCentreMs = 12.0f;

  void prepare(float sample_rate) {
    SincTable::init();
    sample_rate_ = sample_rate;
    const float ms = sample_rate * 0.001f;
    dec_factor_ = clamp_int(static_cast<int>(sample_rate / 12000.0f + 0.5f), 2, 16);
    jump_min_ = kJumpMinMs * ms;
    jump_range_ = kJumpRangeMs * ms;
    soft_ = kSoftMs * ms;
    hard_ = kHardMs * ms;
    land_ = kLandMs * ms;
    far_ = kFarMs * ms;
    fade_short_ = static_cast<int>(kFadeMs * ms);
    fade_long_ = static_cast<int>(kLongFadeMs * ms);
    fade_length_ = fade_short_;
    coarse_window_ = clamp_int(static_cast<int>(kCoarseWindowMs * ms) / dec_factor_, 16, 512);
    fine_window_ = clamp_int(static_cast<int>(kFineWindowMs * ms), 32, 1024);
    min_delay_ = static_cast<double>(SincTable::kHalf + 2);
    floor_ = min_delay_ + static_cast<double>(kWanderRoomMs * ms);
    // Leave the correlation windows behind the farthest head inside both rings.
    const int reach = kSize < kDecSize * dec_factor_ ? kSize : kDecSize * dec_factor_;
    max_delay_ = static_cast<double>(reach - coarse_window_ * dec_factor_ - fine_window_ -
                                     4 * dec_factor_ - 64);
    glide_rate_ = 0.003;  // a small Delay correction bends the pitch by 5 cents at most
    retarget_hold_ = static_cast<int>(30.0f * ms);
    retarget_patience_ = static_cast<int>(60.0f * ms);
    onset_attack_ = kit::time_to_coeff(0.0003f, sample_rate);
    onset_release_ = kit::time_to_coeff(0.020f, sample_rate);
    onset_slow_ = kit::time_to_coeff(0.030f, sample_rate);
    onset_holdoff_ = static_cast<uint32_t>(15.0f * ms);
    onset_guard_ = 2.0f * ms;
    clear();
  }

  void clear() {
    for (int i = 0; i < kSize; ++i) buffer_[i] = 0.0f;
    for (int i = 0; i < kDecSize; ++i) decimated_[i] = 0.0f;
    write_ = 0;
    dec_write_ = 0;
    dec_count_ = 0;
    dec_sum_ = 0.0f;
    written_ = 0x40000000u;
    for (uint32_t& time : onset_time_) time = 0u;
    onset_index_ = 0;
    last_onset_ = 0u;
    fast_ = 0.0f;
    slow_ = 0.0f;
    centre_ = static_cast<double>(kMinCentreMs * 0.001f * sample_rate_);
    head_ = centre_;
    other_ = centre_;
    increment_ = 0.0;
    fading_ = false;
    fade_position_ = 0;
    rho_ = 1.0f;
    glide_ = 0.0;
    pending_ = 0.0;
    retarget_wait_ = 0;
    retarget_age_ = 0;
    splices_ = 0;
  }

  // Where the head should live, in samples behind the write head. `snap`
  // (before the first block) puts it there at once; otherwise it gets there
  // by a splice, or by a slow glide when the move is small.
  void set_centre(float samples, bool snap) {
    const double floor = static_cast<double>(kMinCentreMs * 0.001f * sample_rate_);
    double centre = static_cast<double>(samples);
    if (centre < floor) centre = floor;
    if (centre > max_delay_ - far_) centre = max_delay_ - far_;
    if (snap) {
      centre_ = centre;
      head_ = centre;
      other_ = centre;
      fading_ = false;
      glide_ = 0.0;
      pending_ = 0.0;
      retarget_wait_ = 0;
      return;
    }
    if (centre == centre_) return;
    pending_ += centre - centre_;
    centre_ = centre;
    retarget_wait_ = retarget_hold_;
    retarget_age_ = 0;
  }

  // Before the first block: start the sweep where a splice would have landed,
  // so the first splice is a full sweep away.
  void snap_to_landing(double increment) {
    increment_ = increment;
    head_ = centre_ + landing(increment);
    other_ = head_;
  }

  void write(float x) {
    buffer_[write_] = x;
    write_ = (write_ + 1) & kMask;
    ++written_;

    dec_sum_ += x;
    if (++dec_count_ >= dec_factor_) {
      decimated_[dec_write_] = dec_sum_ / static_cast<float>(dec_factor_);
      dec_write_ = (dec_write_ + 1) & kDecMask;
      dec_sum_ = 0.0f;
      dec_count_ = 0;
    }

    // Onsets: a fast peak follower running well ahead of its own average.
    const float magnitude = x < 0.0f ? -x : x;
    const float coeff = magnitude > fast_ ? onset_attack_ : onset_release_;
    fast_ = flush_denormal(magnitude + (fast_ - magnitude) * coeff);
    if (fast_ > 1.6f * slow_ + 1.0e-4f && written_ - last_onset_ > onset_holdoff_) {
      last_onset_ = written_;
      onset_time_[onset_index_] = written_;
      onset_index_ = (onset_index_ + 1) & (kOnsets - 1);
    }
    slow_ = flush_denormal(fast_ + (slow_ - fast_) * onset_slow_);
  }

  // One output sample. `increment` is 1 - ratio (negative shifts up);
  // `wander` is an extra delay in samples added to the read point only.
  float read(float increment, float wander) {
    increment_ = static_cast<double>(increment);
    head_ += increment_;
    if (!fading_) {
      if (glide_ != 0.0) {
        const double step =
            glide_ > glide_rate_ ? glide_rate_ : (glide_ < -glide_rate_ ? -glide_rate_ : glide_);
        head_ += step;
        glide_ -= step;
      }
      head_ = bound(head_);
      return read_at(head_ + static_cast<double>(wander));
    }
    other_ += increment_;
    head_ = bound(head_);
    other_ = bound(other_);
    const float from = read_at(head_ + static_cast<double>(wander));
    const float to = read_at(other_ + static_cast<double>(wander));
    const float t = static_cast<float>(fade_position_) / static_cast<float>(fade_length_);
    const float rise = 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * t);
    const float fall = 1.0f - rise;
    // Level power for two signals that correlate by rho_.
    const float power = fall * fall + rise * rise + 2.0f * rho_ * fall * rise;
    const float out = (from * fall + to * rise) / std::sqrt(power);
    if (++fade_position_ >= fade_length_) {
      head_ = other_;
      fading_ = false;
    }
    return out;
  }

  // Control-rate housekeeping; `frames` is the number of samples since the
  // last call. Decides whether to splice.
  void tick(int frames) {
    if (fading_) return;
    const double offset = head_ - centre_;
    const double magnitude = offset < 0.0 ? -offset : offset;
    // How far ahead of the centre the head is, in its direction of travel.
    const double lead = increment_ > 1.0e-7 ? offset : (increment_ < -1.0e-7 ? -offset : 0.0);
    if (lead > soft_ || magnitude > far_) {
      const bool forced = lead > hard_ || magnitude > far_;
      // Any splice made from here lands relative to the current centre.
      if (splice(landing(increment_) - offset, jump_range_, jump_min_, forced)) {
        pending_ = 0.0;
        retarget_wait_ = 0;
      }
      return;
    }
    // The Delay control moved and has come to rest: move the head by the
    // same amount, keeping its place in the sweep. A small move glides (a
    // splice between two points a couple of milliseconds apart would comb);
    // a large one is a splice like any other.
    if (retarget_wait_ > 0) {
      retarget_wait_ -= frames;
      if (retarget_wait_ > 0) return;
      retarget_wait_ = 1;  // stay armed until the move is made
      const double delta = pending_;
      const double distance = delta < 0.0 ? -delta : delta;
      if (distance < 0.004 * sample_rate_) {
        glide_ += delta;
        pending_ = 0.0;
        retarget_wait_ = 0;
        return;
      }
      retarget_age_ += frames;
      double range = distance - 0.002 * sample_rate_;
      if (range > jump_range_) range = jump_range_;
      if (splice(delta, range, 0.0, retarget_age_ > retarget_patience_)) {
        pending_ = 0.0;
        retarget_wait_ = 0;
      }
    }
  }

  // Current head position in samples behind the write head (the head being
  // faded to, during a splice). For tests and tuning.
  double head() const { return fading_ ? other_ : head_; }
  bool fading() const { return fading_; }
  int splices() const { return splices_; }
  float last_correlation() const { return rho_; }

 private:
  static constexpr int kOnsets = 8;
  static constexpr int kMaxFineLags = 2 * 16 + 3;

  static int clamp_int(int x, int lo, int hi) { return x < lo ? lo : (x > hi ? hi : x); }

  double bound(double delay) const {
    return delay < min_delay_ ? min_delay_ : (delay > max_delay_ ? max_delay_ : delay);
  }

  // Where a splice aims, relative to the centre: behind the direction of
  // travel, so the sweep that follows is centred on the Delay setting. A
  // head that is not moving sits on the centre.
  double landing(double increment) const {
    if (increment > 1.0e-7) return -land_;
    if (increment < -1.0e-7) return land_;
    return 0.0;
  }

  float read_at(double delay) const {
    if (delay < min_delay_ - 1.0) delay = min_delay_ - 1.0;
    const double position = static_cast<double>(write_ - 1) - delay;
    const double floored = std::floor(position);
    const int index = static_cast<int>(floored);
    const float scaled = static_cast<float>(position - floored) * SincTable::kPhases;
    int phase = static_cast<int>(scaled);
    if (phase >= SincTable::kPhases) phase = SincTable::kPhases - 1;
    const float blend = scaled - static_cast<float>(phase);
    const float* a = SincTable::row(phase);
    const float* b = a + SincTable::kTaps;
    const int first = index - (SincTable::kHalf - 1);
    float sum = 0.0f;
    for (int k = 0; k < SincTable::kTaps; ++k) {
      sum += buffer_[(first + k) & kMask] * (a[k] + (b[k] - a[k]) * blend);
    }
    return sum;
  }

  // True when no remembered onset lies between the two heads (with the
  // crossfade ahead of the nearer one and a guard on both sides).
  bool region_clean(double near, double far) const {
    const double from = near - static_cast<double>(fade_short_) - onset_guard_;
    const double to = far + onset_guard_;
    for (int i = 0; i < kOnsets; ++i) {
      const double age = static_cast<double>(written_ - onset_time_[i]);
      if (age >= from && age <= to) return false;
    }
    return true;
  }

  // Start a crossfade to a head `nominal` ± `range` samples away (positive
  // is a longer delay) and at least `shortest` away, at the best-matching
  // point in that range. False when it should wait (an onset in the way and
  // not `forced`).
  bool splice(double nominal, double range, double shortest, bool forced) {
    double lo = nominal - range;
    double hi = nominal + range;
    if (nominal >= 0.0 && lo < shortest) lo = shortest;
    if (nominal < 0.0 && hi > -shortest) hi = -shortest;
    // The landing point must stay inside the line.
    const double lowest = floor_ - head_;
    const double highest = max_delay_ - head_;
    if (lo < lowest) lo = lowest;
    if (hi > highest) hi = highest;
    if (hi < lo) {
      if (!forced) return false;
      lo = hi = nominal < lowest ? lowest : (nominal > highest ? highest : nominal);
    }
    if (!forced) {
      const double a = head_ + lo;
      const double b = head_ + hi;
      const double near = head_ < a ? head_ : a;
      const double far = head_ > b ? head_ : b;
      if (!region_clean(near, far)) return false;
    }

    double jump = nominal < lo ? lo : (nominal > hi ? hi : nominal);
    float rho = 1.0f;
    search(lo, hi, nominal, range, &jump, &rho);

    other_ = bound(head_ + jump);
    rho_ = rho;
    // Heads that agree fade quickly; heads that do not dissolve slowly.
    const float doubt = kit::clamp((0.95f - rho) * (1.0f / 0.45f), 0.0f, 1.0f);
    fade_length_ = fade_short_ + static_cast<int>(doubt * static_cast<float>(fade_long_ - fade_short_));
    fading_ = true;
    fade_position_ = 0;
    glide_ = 0.0;
    ++splices_;
    return true;
  }

  float dec_at(int back) const { return decimated_[(dec_write_ - 1 - back) & kDecMask]; }
  float full_at(int delay) const { return buffer_[(write_ - 1 - delay) & kMask]; }

  // Normalised cross-correlation search. Leaves *jump and *rho untouched
  // when there is nothing to align (silence).
  void search(double lo, double hi, double nominal, double range, double* jump, float* rho) const {
    const int m = dec_factor_;
    // The decimated entry that holds the sample under the head.
    int back = (static_cast<int>(head_) - dec_count_) / m;
    if (back < 0) back = 0;
    int lag_lo = static_cast<int>(std::ceil(lo / m));
    int lag_hi = static_cast<int>(std::floor(hi / m));
    if (lag_lo < -back) lag_lo = -back;
    const int span = kDecSize - coarse_window_ - back - 2;
    if (lag_hi > span) lag_hi = span;
    if (lag_hi < lag_lo) return;

    float reference_energy = 0.0f;
    for (int n = 0; n < coarse_window_; ++n) {
      const float v = dec_at(back + n);
      reference_energy += v * v;
    }
    if (reference_energy < 1.0e-12f * static_cast<float>(coarse_window_)) return;

    // Coarse: every dec_factor_ samples. A slight pull towards the nominal
    // jump picks the nearest of several equally good periods.
    const float pull = range > 1.0 ? 0.02f / static_cast<float>(range) : 0.0f;
    int best_lag = lag_lo;
    float best_score = -2.0f;
    for (int lag = lag_lo; lag <= lag_hi; ++lag) {
      float dot = 0.0f;
      float energy = 0.0f;
      for (int n = 0; n < coarse_window_; ++n) {
        const float c = dec_at(back + lag + n);
        dot += dec_at(back + n) * c;
        energy += c * c;
      }
      const float distance = static_cast<float>(lag * m) - static_cast<float>(nominal);
      const float score = dot / std::sqrt(reference_energy * energy + 1.0e-20f) -
                          pull * (distance < 0.0f ? -distance : distance);
      if (score > best_score) {
        best_score = score;
        best_lag = lag;
      }
    }

    // Fine: every sample within one coarse step either side, plus one more
    // on each end for the parabola.
    const int base = static_cast<int>(head_);
    const int centre = best_lag * m;
    const int count = 2 * m + 3;
    float value[kMaxFineLags];
    float fine_reference = 0.0f;
    for (int n = 0; n < fine_window_; ++n) {
      const float v = full_at(base + n);
      fine_reference += v * v;
    }
    const int min_delay = static_cast<int>(min_delay_);
    for (int i = 0; i < count; ++i) {
      const int lag = centre - m - 1 + i;
      if (base + lag < min_delay || base + lag + fine_window_ >= kSize - 2) {
        value[i] = -2.0f;
        continue;
      }
      float dot = 0.0f;
      float energy = 0.0f;
      for (int n = 0; n < fine_window_; ++n) {
        const float c = full_at(base + lag + n);
        dot += full_at(base + n) * c;
        energy += c * c;
      }
      value[i] = dot / std::sqrt(fine_reference * energy + 1.0e-20f);
    }
    int best = -1;
    for (int i = 1; i < count - 1; ++i) {
      if (value[i] <= -2.0f) continue;
      if (best < 0 || value[i] > value[best]) best = i;
    }
    if (best < 0) {
      *jump = static_cast<double>(centre);
      *rho = kit::clamp(best_score, 0.0f, 1.0f);
      return;
    }
    double fraction = 0.0;
    const float before = value[best - 1];
    const float after = value[best + 1];
    if (before > -2.0f && after > -2.0f) {
      const float curve = before - 2.0f * value[best] + after;
      if (curve < -1.0e-9f) {
        fraction = static_cast<double>(kit::clamp(0.5f * (before - after) / curve, -0.5f, 0.5f));
      }
    }
    *jump = static_cast<double>(centre - m - 1 + best) + fraction;
    *rho = kit::clamp(value[best], 0.0f, 1.0f);
  }

  float buffer_[kSize] = {};
  float decimated_[kDecSize] = {};
  int write_ = 0;
  int dec_write_ = 0;
  int dec_count_ = 0;
  int dec_factor_ = 4;
  float dec_sum_ = 0.0f;
  uint32_t written_ = 0x40000000u;

  uint32_t onset_time_[kOnsets] = {};
  int onset_index_ = 0;
  uint32_t last_onset_ = 0u;
  uint32_t onset_holdoff_ = 720u;
  float fast_ = 0.0f;
  float slow_ = 0.0f;
  float onset_attack_ = 0.0f;
  float onset_release_ = 0.0f;
  float onset_slow_ = 0.0f;
  float onset_guard_ = 96.0f;

  float sample_rate_ = 48000.0f;
  double centre_ = 480.0;
  double head_ = 480.0;
  double other_ = 480.0;
  double increment_ = 0.0;
  double min_delay_ = 10.0;
  double max_delay_ = 30000.0;
  double jump_min_ = 240.0;
  double floor_ = 87.0;
  double far_ = 936.0;
  double jump_range_ = 240.0;
  double soft_ = 312.0;
  double hard_ = 408.0;
  double land_ = 168.0;
  double glide_ = 0.0;
  double pending_ = 0.0;
  double glide_rate_ = 0.003;
  int fade_length_ = 576;
  int fade_short_ = 576;
  int fade_long_ = 1440;
  int fade_position_ = 0;
  int coarse_window_ = 120;
  int fine_window_ = 240;
  int retarget_wait_ = 0;
  int retarget_hold_ = 1440;
  int retarget_age_ = 0;
  int retarget_patience_ = 2880;
  int splices_ = 0;
  float rho_ = 1.0f;
  bool fading_ = false;
};

}  // namespace micro_shift_parts
}  // namespace livemix
