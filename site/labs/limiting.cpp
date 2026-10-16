// Limiting: the True Peak Limiter (cpp/devices/true-peak-limiter), the limiter
// of the engine's master bus, run one sample at a time, so every stage of its
// gain can be read out of the device itself as it works.
//
//   in × push ─┬─ detector ─ required ─ release ─ lowest of 73 ─ mean of 72 ─┐
//              └─ delay, 77 samples ────────────────────────────────────── × gain ─ clip ─► out
//
// Read from the device: the pushed input and the delayed copy (its delay
// line), the gain after the release, the lowest of the window, the gain it
// multiplies by, the output, and the latency it reports. The detector's
// reading and the gain that reading asks for are locals of the device's
// process() and are not kept, so the lab works them out again from the
// device's own filter history, coefficients and ceiling ("lesson"), carries
// them through the release, the minimum and the mean as the lesson's
// equations write them, and reports how far that lands from the gain the
// device stored (the "rebuilt" check).
//
// Two taps are sums of the lesson's own on the device's sound: the pushed
// input cut off at the ceiling, which is the answer a limiter is there to
// better, and what the limiter took away, the delayed copy less the output.
//
// The same limiter is the last stage of the Ambient Limiter
// (cpp/devices/ambient-limiter), the device the library ships it in, behind
// a slow gain that rides a sustained over down first. That device runs here
// too, on the same loop at the same Push and Ceiling and otherwise as it
// starts by itself, and three taps are read from it: its slow gain, the gain
// its own limiter is left to make, and its output. Ride is that device's own
// control and reaches those three taps only.
//
// Beside the loop there are pictures that are not the loop: one click through
// a second device, the loop's largest peak close to, the wave between the
// samples, what the detector's filter keeps of each frequency, and the static
// curve.
//
// The build part puts a limiter together a piece at a time, on a path of its
// own beside the device (lab::Build in lab.h). It has seven pieces, each a
// function of `Built` below, in the order the steps add them: turn it up;
// clip; the gain needed; release; look ahead and hold; ramp; the peaks
// between the samples. The path writes the "built" taps and leaves every
// other tap as it was. Two copies of it run: one at the step the reader
// chose, which is what the taps show, and one with all seven pieces, whose
// output is compared on every render with the device's own output (the
// "builtDifference" check). With all seven the build does to a sample what
// the device does, in the same order, so the two are the same sample for
// sample. A step before the last is the lesson's own: a limiter with a piece
// missing, which the device never is. A third copy takes one click, for the
// close view of the steps.
//
// lab-sources: cpp/devices/true-peak-limiter/true_peak_limiter_device.cpp

#include "lab.h"

#include <cstring>

#include "../../cpp/devices/ambient-limiter/ambient_limiter.h"
#include "../../cpp/devices/true-peak-limiter/true_peak_limiter_device.h"

using namespace livemix;

namespace {

using Limiter = TruePeakLimiter;
using Param = TruePeakLimiterParam;

constexpr int kTaps = Limiter::kFirTaps;
constexpr int kPhases = Limiter::kFirPhases;
constexpr int kBack = Limiter::kInterpolatorDelay;
constexpr int kDelayMask = Limiter::kDelayCapacity - 1;

// A close view: 3 ms before a peak comes out to 2 ms after, a point a sample.
constexpr int kBefore = 144;
constexpr int kAfter = 96;
constexpr int kViewPoints = kBefore + kAfter + 1;

void open_view(lab::Tap& tap) {
  tap.open(kViewPoints);
  tap.x0 = -1000.0f * kBefore / lab::kSampleRate;
  tap.x1 = 1000.0f * kAfter / lab::kSampleRate;
}

TruePeakLimiterDevice device;
TruePeakLimiterDevice probe;  // a second device, for the static curve and the single click
AmbientLimiter ambient;       // the device the library ships the limiter in

lab::Control push{"push", "Push", "dB", -12.0f, 24.0f, 12.0f};
lab::Control ceiling{"ceiling", "Ceiling", "dB", -20.0f, 0.0f, -1.0f};
lab::Control release{"release", "Release", "ms", 10.0f, 2000.0f, 100.0f, lab::kLog};
// The Ambient Limiter's own control: how much of a sound that stays over the
// ceiling its slow gain takes. It reaches that device's three taps and no other.
lab::Control ride{"ride", "Ride", "", 0.0f, 1.0f, 1.0f};

// The loop, stage by stage.
lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap pushed{"pushed", "Pushed", lab::kAudio, lab::kDevice, 2};
lab::Tap clip_only{"clipOnly", "Pushed, and cut off at the ceiling", lab::kAudio, lab::kLesson, 2};
lab::Tap peak_tap{"peak", "True peak", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap required{"required", "Gain the peak asks for", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap released{"released", "After the release", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap minimum{"minimum", "Lowest in the window", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap gain{"gain", "Gain", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap delayed{"delayed", "Delayed", lab::kAudio, lab::kDevice, 2};
lab::Tap removed{"removed", "What was taken away: delayed less output", lab::kAudio, lab::kLesson, 2};

// The same loop through the Ambient Limiter: its slow gain, what that leaves
// for the limiter behind it, and what comes out.
lab::Tap ride_gain{"rideGain", "The slow gain in front", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap wall_gain{"wallGain", "The limiter's gain behind it", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap ambient_out{"ambient", "Through the Ambient Limiter", lab::kAudio, lab::kDevice, 2};

// The last sound of the main path: what a card plays when it names no tap.
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap out_peak{"outPeak", "True peak of the output", lab::kControl, lab::kLesson, 1, "dB"};

// One click, four times the ceiling, through a second device: the gain it
// makes, sample by sample, from 3 ms before the click comes out to 2 ms after.
lab::Tap click_required{"clickRequired", "Gain the click asks for", lab::kCurve, lab::kLesson, 1};
lab::Tap click_released{"clickReleased", "After the release", lab::kCurve, lab::kDevice, 1};
lab::Tap click_minimum{"clickMinimum", "Lowest in the window", lab::kCurve, lab::kDevice, 1};
lab::Tap click_gain{"clickGain", "Gain", lab::kCurve, lab::kDevice, 1};

// The loop's largest peak over the same five milliseconds.
lab::Tap near_released{"nearReleased", "After the release", lab::kCurve, lab::kDevice, 1};
lab::Tap near_minimum{"nearMinimum", "Lowest in the window", lab::kCurve, lab::kDevice, 1};
lab::Tap near_gain{"nearGain", "Gain", lab::kCurve, lab::kDevice, 1};
lab::Tap near_pushed{"nearPushed", "Pushed, as it goes in", lab::kCurve, lab::kDevice, 1};
lab::Tap near_delayed{"nearDelayed", "Delayed", lab::kCurve, lab::kDevice, 1};
lab::Tap near_out{"nearOut", "Output", lab::kCurve, lab::kDevice, 1};
lab::Tap near_clipped{"nearClipped", "Delayed, and cut off at the ceiling", lab::kCurve, lab::kLesson, 1};
lab::Tap near_ceiling{"nearCeiling", "Ceiling", lab::kCurve, lab::kLesson, 1};

// Between the samples: where the loop's wave stands furthest over its
// samples, and a sine at a quarter of the sample rate.
lab::Tap between{"between", "Between the samples", lab::kCurve, lab::kLesson, 1};
lab::Tap samples{"samples", "The samples", lab::kCurve, lab::kDevice, 1};
lab::Tap tone_between{"toneBetween", "Between the samples", lab::kCurve, lab::kLesson, 1};
lab::Tap tone_samples{"toneSamples", "The samples", lab::kCurve, lab::kLesson, 1};

// How much of a tone the detector's points keep, against the tone's frequency.
lab::Tap response_outer{"responseOuter", "The points nearest a sample", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap response_inner{"responseInner", "The points in the middle of the gap", lab::kCurve, lab::kLesson, 1, "dB"};

// The static curve: a steady tone at each level, peak out against peak in.
lab::Tap curve{"curve", "Peak out against peak in", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap curve_formula{"curveFormula", "The curve as written", lab::kCurve, lab::kLesson, 1, "dB"};

lab::Check rebuilt{"rebuilt", "The gain worked out again, against the device's gain", "dB"};
lab::Check curve_error{"curveError", "The measured curve against the curve as written", "dB"};
lab::Check latency{"latency", "The latency the device reports", "samples"};
lab::Check overshoot{"overshoot", "The wave over the largest of the four samples around it, at the spot shown", "dB"};
lab::Check clipped{"clipped", "Samples the last clip changed", "samples"};
lab::Check clip_depth{"clipDepth", "The most the last clip took off", "dB"};

// The build part's taps: the sound so far, the lanes a step draws, and one
// click through the pieces so far, a point a sample.
lab::Tap built{"built", "The limiter so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_peak{"builtPeak", "Highest sample so far", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_gain{"builtGain", "Gain, as built", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_click_gain{"builtClickGain", "Gain, as built, around one click", lab::kCurve, lab::kLesson, 1};
lab::Tap built_click_out{"builtClickOut", "The click, as it comes out", lab::kCurve, lab::kLesson, 1};

void configure(TruePeakLimiterDevice& d, float push_db, float ceiling_db, float release_ms) {
  d.init(lab::kSampleRate);
  // Before the first sample, so each snaps to its value (true_peak_limiter.h).
  d.set_param(Param::kInputGainDb, push_db);
  d.set_param(Param::kCeilingDb, ceiling_db);
  d.set_param(Param::kReleaseMs, release_ms);
}

float magnitude(float x) { return x < 0.0f ? -x : x; }

// One of the filter's four points between two samples, as detect() in
// true_peak_limiter.h sums it: `history[newest]` is the latest sample.
float phase(const float* history, int newest, int p) {
  const float* h = Limiter::kFirCoefficients[p];
  float y = 0.0f;
  for (int i = 0; i < kTaps; ++i) y += h[i] * history[newest - i];
  return y;
}

// What the detector sees of one channel: the sample six back, the largest of
// the four points between it and the next, and (for the lesson's close view
// only) the largest of the two samples on either side of that gap.
struct Seen {
  float sample;
  float between;
  float around;
};

Seen see(const float* history, int newest) {
  Seen seen{magnitude(history[newest - kBack]), 0.0f, 0.0f};
  for (int p = 0; p < kPhases; ++p) seen.between = kit::max(seen.between, magnitude(phase(history, newest, p)));
  for (int k = -1; k <= 2; ++k) seen.around = kit::max(seen.around, magnitude(history[newest - kBack + k]));
  return seen;
}

// A control tap keeps one point in sixteen, and a peak can be two samples
// wide. Each point is the extreme of its sixteen samples, so none is missed.
struct Extreme {
  bool most;
  float value;
  explicit Extreme(bool most_) : most(most_), value(most_ ? 0.0f : 1.0f) {}
  void see(float x) {
    if (most ? x > value : x < value) value = x;
  }
  void put(lab::Tap& tap, int i) {
    if (i % lab::kControlPeriod != 0) return;
    tap.put(i, lab::to_db(value));
    value = most ? 0.0f : 1.0f;
  }
};

// The limiter so far: one function a piece, and run() to take a sample
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kPush = 0, kClip, kGain, kRelease, kHold, kRamp, kBetween };

  static constexpr int kLook = 72;           // the look-ahead: 1.5 ms at the lab's 48,000 samples a second
  static constexpr int kWindow = kLook + 1;  // the hold is one sample longer
  static constexpr int kLine = 128;          // room for the sound to wait in: a power of two over 77

  int pieces = kPush;
  float push_gain = 1.0f;  // Push, as a number to multiply by
  float top = 1.0f;        // Ceiling, as the largest size a sample may have
  float share = 0.0f;      // Release, as the share of the way back to 1 the gain covers in a sample
  int wait = 0;            // how many samples the sound waits
  float line[2][kLine] = {};
  int line_at = 0;
  float history[2][2 * kTaps] = {};  // the last twelve samples of each channel, kept twice over
  int history_at = 0;
  float released = 1.0f;
  float recent[kWindow] = {};  // the last 73 values of the released gain
  int recent_at = 0;
  float floors[kLook] = {};    // the last 72 of their lowest
  int floors_at = 0;
  int since = 0;
  double sum = kLook;
  float gain = 1.0f;
  float out[2] = {0.0f, 0.0f};

  // Turn it up: Push is in decibels, and a sound is turned up by multiplying
  // every sample by one number. This is that number.
  static float as_gain(float db) { return std::pow(10.0f, db / 20.0f); }

  // Clip: whatever stands over the ceiling is cut off at the ceiling, and
  // whatever stands under it is left alone.
  float clip(float x) const {
    if (x > top) return top;
    if (x < -top) return -top;
    return x;
  }

  // The gain needed: for a peak over the ceiling, the number that puts it
  // exactly on the ceiling. For a peak under it, 1: no change.
  float needed(float peak) const { return peak > top ? top / peak : 1.0f; }

  // Release: down at once, back slowly. Each sample the gain covers a fixed
  // share of what is left of the way back to 1, and a peak that asks for
  // less than that takes it down in one step.
  float release(float asked) {
    released += (1.0f - released) * share;
    if (released > 1.0f - 1.0e-7f) released = 1.0f;
    if (asked < released) released = asked;
    return released;
  }

  // Look ahead: the sound waits in a ring, and what comes out now went in
  // `wait` samples ago. The gain is worked out from the sound as it goes in.
  void wait_in_line(const float* now, float* then) {
    for (int c = 0; c < 2; ++c) {
      line[c][line_at] = now[c];
      then[c] = line[c][(line_at - wait) & (kLine - 1)];
    }
    line_at = (line_at + 1) & (kLine - 1);
  }

  // And hold: the lowest of the last 73 gains. A dip one sample long becomes
  // a floor that lasts from the moment a peak is seen until it has come out.
  float hold(float newest) {
    recent[recent_at] = newest;
    recent_at = recent_at + 1 == kWindow ? 0 : recent_at + 1;
    float lowest = newest;
    for (float one : recent) lowest = kit::min(lowest, one);
    return lowest;
  }

  // Ramp: the mean of the last 72 of those floors. When the floor drops, one
  // more of the 72 is low at each sample, so the mean walks down a straight
  // line and arrives as the peak does. The sum is kept running, and added up
  // afresh every 72 samples so that rounding does not build up in it.
  float ramp(float lowest) {
    sum += static_cast<double>(lowest) - static_cast<double>(floors[floors_at]);
    floors[floors_at] = lowest;
    floors_at = floors_at + 1 == kLook ? 0 : floors_at + 1;
    if (++since == kLook) {
      since = 0;
      sum = 0.0;
      for (float one : floors) sum += one;
    }
    const float mean = static_cast<float>(sum / kLook);
    return mean > 1.0f ? 1.0f : mean;
  }

  // Peaks between samples: the height of the wave, not of its samples. Four
  // points in each gap, each a weighted sum of the twelve samples around it,
  // from the device's own table; the reading is the largest of them and of
  // the sample itself, on either channel. It is about the gap after the
  // sample six back, so the sound waits five samples longer.
  float true_peak(float left, float right) {
    history_at = history_at + 1 == kTaps ? 0 : history_at + 1;
    history[0][history_at] = history[0][history_at + kTaps] = left;
    history[1][history_at] = history[1][history_at + kTaps] = right;
    const int newest = history_at + kTaps;
    float peak = kit::max(std::fabs(history[0][newest - kBack]), std::fabs(history[1][newest - kBack]));
    for (int p = 0; p < kPhases; ++p) {
      const float* h = Limiter::kFirCoefficients[p];
      float between_left = 0.0f;
      float between_right = 0.0f;
      for (int i = 0; i < kTaps; ++i) {
        between_left += h[i] * history[0][newest - i];
        between_right += h[i] * history[1][newest - i];
      }
      peak = kit::max(peak, kit::max(std::fabs(between_left), std::fabs(between_right)));
    }
    return peak;
  }

  // One sample through the pieces built so far, in the order it meets them.
  void run(float left, float right) {
    const float now[2] = {left * push_gain, right * push_gain};
    float sound[2] = {now[0], now[1]};
    if (pieces >= kHold) wait_in_line(now, sound);
    gain = 1.0f;
    if (pieces >= kGain) {
      // One gain for both channels: the larger of the two decides.
      const float peak =
          pieces >= kBetween ? true_peak(now[0], now[1]) : kit::max(std::fabs(now[0]), std::fabs(now[1]));
      gain = needed(peak);
      if (pieces >= kRelease) gain = release(gain);
      if (pieces >= kHold) gain = hold(gain);
      if (pieces >= kRamp) gain = ramp(gain);
    }
    for (int c = 0; c < 2; ++c) out[c] = pieces >= kClip ? clip(sound[c] * gain) : sound[c];
  }

  // The three controls as the numbers the pieces use, and everything that
  // remembers a sound cleared.
  void start(int pieces_) {
    pieces = pieces_;
    push_gain = as_gain(push.value);
    top = as_gain(ceiling.value);
    share = 1.0f - std::exp(-1.0f / (::release.value * 0.001f * lab::kSampleRate));
    wait = pieces >= kBetween ? kLook + kBack - 1 : kLook;
    std::memset(line, 0, sizeof line);
    std::memset(history, 0, sizeof history);
    line_at = history_at = recent_at = floors_at = since = 0;
    released = 1.0f;
    for (float& one : recent) one = 1.0f;
    for (float& one : floors) one = 1.0f;
    sum = kLook;
    gain = 1.0f;
    out[0] = out[1] = 0.0f;
  }
};

lab::Build build{"Turn it up|Clip|The gain needed|Release|Look ahead and hold|Ramp|Peaks between samples",
                 Built::kBetween, -120.0f,
                 "The limiter as built, all seven pieces, against the device's own output"};

Built shown;    // at the step the reader chose: what the built taps hold
Built held;     // with every piece: what is compared with the device
Built clicked;  // at the step the reader chose, for one click

// The static curve as it was last measured, and the two settings that reach
// it. It is measured again only when one of them has moved.
constexpr int kCurvePoints = 37;
float curve_measured[kCurvePoints];
float curve_written[kCurvePoints];
float curve_worst = 0.0f;
float curve_settings[2];
bool curve_kept = false;

// The static curve, measured: a steady 1 kHz sine at each level through a
// second device with no push, read once the gain has settled.
void measure_curve() {
  constexpr int kRun = 960;      // 20 ms, twenty cycles
  constexpr int kMeasure = 480;  // the last ten of them
  if (!curve.open(kCurvePoints) || !curve_formula.open(kCurvePoints)) return;
  curve.x0 = curve_formula.x0 = -24.0f;
  curve.x1 = curve_formula.x1 = 12.0f;
  const float settings[2] = {ceiling.value, release.value};
  if (!curve_kept || std::memcmp(settings, curve_settings, sizeof settings) != 0) {
    const float step = kit::kTwoPi * 1000.0f / lab::kSampleRate;
    curve_worst = 0.0f;
    for (int p = 0; p < kCurvePoints; ++p) {
      const float level_db = -24.0f + static_cast<float>(p);
      const float amplitude = kit::db_to_gain(level_db);
      configure(probe, 0.0f, ceiling.value, release.value);
      float top = 0.0f;
      for (int i = 0; i < kRun; i += 16) {
        for (int j = 0; j < 16; ++j) {
          const float x = amplitude * std::sin(step * static_cast<float>(i + j));
          probe.in_left()[j] = x;
          probe.in_right()[j] = x;
        }
        probe.process(16);
        if (i >= kRun - kMeasure) top = kit::max(top, lab::peak(probe.out_left(), 16));
      }
      curve_measured[p] = lab::to_db(top);
      curve_written[p] = level_db < ceiling.value ? level_db : ceiling.value;
      curve_worst = kit::max(curve_worst, magnitude(curve_measured[p] - curve_written[p]));
    }
    std::memcpy(curve_settings, settings, sizeof settings);
    curve_kept = true;
  }
  for (int p = 0; p < kCurvePoints; ++p) {
    curve.set(p, curve_measured[p]);
    curve_formula.set(p, curve_written[p]);
  }
  curve_error.value = curve_worst;
}

// A sine at a quarter of the sample rate, sampled 45 degrees from its crests:
// every sample is 0.707 of the crest. Five cycles, with the device's filter
// putting four points between each pair of samples.
void draw_tone() {
  constexpr int kShown = 20;
  constexpr int kLead = 16;
  static float tone[kLead + kShown + kTaps];
  for (int n = 0; n < kLead + kShown + kTaps; ++n) {
    tone[n] = std::sin(kit::kTwoPi * (0.25f * static_cast<float>(n) + 0.125f));
  }
  if (!tone_samples.open(kShown + 1) || !tone_between.open(kShown * kPhases)) return;
  tone_samples.x0 = 0.0f;
  tone_samples.x1 = static_cast<float>(kShown);
  tone_between.x0 = 0.125f;
  tone_between.x1 = static_cast<float>(kShown) - 0.125f;
  for (int n = 0; n <= kShown; ++n) tone_samples.set(n, tone[kLead + n]);
  for (int n = 0; n < kShown; ++n) {
    for (int p = 0; p < kPhases; ++p) {
      tone_between.set(n * kPhases + p, phase(tone, kLead + n + kBack, p));
    }
  }
}

// The textbook case: silence, then one sample four times the ceiling, through
// a second device at the page's ceiling and release. Its gains are read out
// of it at every sample; the gain the click asks for is the ceiling over the
// detector's reading, as in the loop.
void draw_click() {
  constexpr int kClickAt = 80;
  constexpr int kOutAt = kClickAt + 77;  // checked against the device below
  configure(probe, 0.0f, ceiling.value, release.value);
  Limiter& limiter = probe.limiter_;
  if (limiter.latencyFrames() != kOutAt - kClickAt) return;
  open_view(click_required);
  open_view(click_released);
  open_view(click_minimum);
  open_view(click_gain);
  const float size = 4.0f * limiter.ceiling_;
  for (int n = 0; n <= kOutAt + kAfter; ++n) {
    probe.in_left()[0] = n == kClickAt ? size : 0.0f;
    probe.in_right()[0] = probe.in_left()[0];
    probe.process(1);
    const int p = n - (kOutAt - kBefore);
    if (p < 0) continue;
    const int newest = limiter.fir_index_ + kTaps;
    const Seen seen = see(limiter.fir_left_, newest);
    const float reading = kit::max(seen.sample, seen.between);
    click_required.set(p, reading > limiter.ceiling_ ? limiter.ceiling_ / reading : 1.0f);
    click_released.set(p, limiter.release_state_);
    click_minimum.set(p, limiter.deque_values_[limiter.deque_head_]);
    click_gain.set(p, limiter.envelope_);
  }
}

// The same click through the build so far, with nothing pushed: the gain the
// pieces make and what comes out, a point a sample, from 1 ms before the
// click goes in to 3 ms after.
void draw_built_click() {
  constexpr int kLead = 48;
  constexpr int kPoints = kLead + 144 + 1;
  if (!built_click_gain.open(kPoints) || !built_click_out.open(kPoints)) return;
  built_click_gain.x0 = built_click_out.x0 = -1000.0f * kLead / lab::kSampleRate;
  built_click_gain.x1 = built_click_out.x1 = 1000.0f * (kPoints - 1 - kLead) / lab::kSampleRate;
  clicked.start(build.at());
  clicked.push_gain = 1.0f;
  const float size = 4.0f * clicked.top;
  for (int n = 0; n < kPoints; ++n) {
    const float x = n == kLead ? size : 0.0f;
    clicked.run(x, x);
    built_click_gain.set(n, clicked.gain);
    built_click_out.set(n, clicked.out[0]);
  }
}

// The gain of a row of the filter's table at each frequency: the size of the
// sum the Fourier transform is, of its twelve coefficients. Rows 0 and 3 are
// the points an eighth of a gap from a sample, rows 1 and 2 the two in the
// middle; each pair is one row and its mirror, so one of each is drawn.
void draw_response() {
  constexpr int kPoints = 97;  // every 250 Hz up to half the sample rate
  if (!response_outer.open(kPoints) || !response_inner.open(kPoints)) return;
  response_outer.x0 = response_inner.x0 = 0.0f;
  response_outer.x1 = response_inner.x1 = 24.0f;  // kHz
  lab::Tap* taps[] = {&response_outer, &response_inner};
  for (int row = 0; row < 2; ++row) {
    const float* h = Limiter::kFirCoefficients[row];
    for (int p = 0; p < kPoints; ++p) {
      const double w = 2.0 * lab::kPi * 250.0 * p / lab::kSampleRate;
      double re = 0.0, im = 0.0;
      for (int i = 0; i < kTaps; ++i) {
        re += h[i] * std::cos(w * i);
        im -= h[i] * std::sin(w * i);
      }
      taps[row]->set(p, lab::power_to_db(static_cast<float>(re * re + im * im)));
    }
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  configure(device, push.value, ceiling.value, release.value);
  Limiter& limiter = device.limiter_;
  const int look = limiter.box_frames_;
  const int window = limiter.min_frames_;
  latency.value = static_cast<float>(limiter.latencyFrames());

  // The Ambient Limiter at the same Push and Ceiling, with its own Ride, and
  // otherwise as it starts by itself: its release at a second and a half.
  // Its Ceiling stops at -12 dB, so under that it stays there (set_param
  // holds a value to the device's range) while the limiter alone goes on down.
  ambient.init(lab::kSampleRate);
  ambient.set_param(ambient_limiter::kGain, push.value);
  ambient.set_param(ambient_limiter::kCeiling, ceiling.value);
  ambient.set_param(ambient_limiter::kRide, ride.value);

  // The build part: the chosen step, and the whole build that is held to the device.
  shown.start(build.at());
  const bool whole = build.at() == build.compared_step;
  if (!whole) held.start(build.compared_step);
  Built& compared = whole ? shown : held;
  double built_apart = 0.0, built_whole = 0.0;

  // The second pass, sample by sample, for the close views.
  float* keep_pushed[2] = {lab::take(frames), lab::take(frames)};
  float* keep_delayed[2] = {lab::take(frames), lab::take(frames)};
  float* keep_out[2] = {lab::take(frames), lab::take(frames)};
  float* keep_released = lab::take(frames);
  float* keep_minimum = lab::take(frames);
  float* keep_gain = lab::take(frames);
  if (!keep_gain) return;

  // The lesson's own copy of the gain: the release, the lowest of the last 73
  // and the mean of the last 72, each written as its equation.
  // It starts 512 samples before the pass that is kept, from the device's own
  // gain at that moment, so both windows are full of its own values by then.
  constexpr int kRing = 128;
  float ring_released[kRing];
  float ring_minimum[kRing];
  float own_released = 1.0f;
  bool own_started = false;
  int own_steps = 0;
  const int rebuild_from = frames > 512 ? frames - 512 : 0;
  float worst = 0.0f;

  // The output's own history, for measuring its true peak with the same filter.
  float out_history[2][2 * kTaps] = {};
  int out_index = 0;

  Extreme top_peak(true), low_required(false), low_released(false), low_minimum(false), low_gain(false),
      top_out(true), low_ride(false), low_wall(false), top_built(true), low_built(false);
  float loop_peak = -1.0f;  // the largest reading of the kept pass, and when
  int loop_peak_at = 0;
  float spot_excess = -1.0f;  // where the wave stands furthest over its samples
  int spot_at = 0;
  int spot_channel = 0;
  float spot_db = 0.0f;
  int clip_count = 0;
  double clip_most = 0.0;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    device.in_left()[0] = left;
    device.in_right()[0] = right;
    const long long before = limiter.sample_index_;
    const float released_before = limiter.release_state_;
    device.process(1);
    const bool ran = limiter.sample_index_ != before;  // asleep, the device only clears its output

    float now_pushed[2] = {0.0f, 0.0f};
    float now_delayed[2] = {0.0f, 0.0f};
    float now_peak = 0.0f;
    float now_required = 1.0f;
    if (ran) {
      const int written = (limiter.write_index_ - 1) & kDelayMask;
      const int read = (written - limiter.delay_frames_) & kDelayMask;
      now_pushed[0] = limiter.delay_left_[written];
      now_pushed[1] = limiter.delay_right_[written];
      now_delayed[0] = limiter.delay_left_[read];
      now_delayed[1] = limiter.delay_right_[read];
    }
    // The first pass only settles the device: nothing of it is kept.
    if (ran && i >= rebuild_from) {
      // The detector again, from the device's own history and coefficients.
      const int newest = limiter.fir_index_ + kTaps;
      const Seen seen[2] = {see(limiter.fir_left_, newest), see(limiter.fir_right_, newest)};
      now_peak = kit::max(kit::max(seen[0].sample, seen[1].sample), kit::max(seen[0].between, seen[1].between));
      now_required = now_peak > limiter.ceiling_ ? limiter.ceiling_ / now_peak : 1.0f;

      if (i >= frames && i < 2 * frames) {
        if (now_peak > loop_peak) {
          loop_peak = now_peak;
          loop_peak_at = i - frames;
        }
        for (int c = 0; c < 2; ++c) {
          const float excess = seen[c].between - seen[c].around;
          if (excess > spot_excess && seen[c].around > 0.0f) {
            spot_excess = excess;
            spot_at = i - frames - kBack;
            spot_channel = c;
            spot_db = lab::to_db(seen[c].between / seen[c].around);
          }
        }
        // What the last clip did: the output against the delayed copy times the gain.
        const float unclipped[2] = {now_delayed[0] * limiter.envelope_, now_delayed[1] * limiter.envelope_};
        const float sent[2] = {device.out_left()[0], device.out_right()[0]};
        for (int c = 0; c < 2; ++c) {
          if (unclipped[c] == sent[c]) continue;
          ++clip_count;
          const double over = 20.0 * std::log10(static_cast<double>(magnitude(unclipped[c])) / limiter.ceiling_);
          if (over > clip_most) clip_most = over;
        }
      }

      {
        if (!own_started) {
          own_started = true;
          own_released = released_before;
          for (int k = 0; k < kRing; ++k) ring_released[k] = ring_minimum[k] = released_before;
        }
        // r[n] = min(required[n], r[n-1] + (1 - r[n-1]) k)
        own_released += (1.0f - own_released) * limiter.release_coefficient_;
        if (own_released > 1.0f - 1.0e-7f) own_released = 1.0f;
        if (now_required < own_released) own_released = now_required;
        const int n = ++own_steps;  // the device's steps, not the loop's: asleep, it takes none
        ring_released[n & (kRing - 1)] = own_released;
        // m[n] = the lowest of r[n - L] ... r[n]
        float lowest = own_released;
        for (int k = 1; k < window; ++k) {
          const float r = ring_released[(n - k) & (kRing - 1)];
          if (r < lowest) lowest = r;
        }
        ring_minimum[n & (kRing - 1)] = lowest;
        // s[n] = the mean of m[n - L + 1] ... m[n]
        double sum = 0.0;
        for (int k = 0; k < look; ++k) sum += ring_minimum[(n - k) & (kRing - 1)];
        const float own_gain = static_cast<float>(sum / look);
        if (i >= frames && own_gain != limiter.envelope_) {
          worst = kit::max(worst, magnitude(lab::to_db(own_gain) - lab::to_db(limiter.envelope_)));
        }
      }
    }

    const float now_out[2] = {device.out_left()[0], device.out_right()[0]};
    out_index = out_index + 1 == kTaps ? 0 : out_index + 1;
    for (int c = 0; c < 2; ++c) {
      out_history[c][out_index] = now_out[c];
      out_history[c][out_index + kTaps] = now_out[c];
    }
    if (i >= frames - 2 * kTaps) {
      const Seen seen[2] = {see(out_history[0], out_index + kTaps), see(out_history[1], out_index + kTaps)};
      top_out.see(kit::max(kit::max(seen[0].sample, seen[1].sample), kit::max(seen[0].between, seen[1].between)));
    }

    // The Ambient Limiter, beside it on the same sample.
    ambient.in_left()[0] = left;
    ambient.in_right()[0] = right;
    ambient.process(1);
    low_ride.see(kit::db_to_gain(ambient.ride_db_));
    low_wall.see(ambient.wall_.envelope_);

    // The build part, beside the device.
    shown.run(left, right);
    if (!whole) held.run(left, right);
    if (i >= frames) {
      const double apart_left = static_cast<double>(compared.out[0]) - now_out[0];
      const double apart_right = static_cast<double>(compared.out[1]) - now_out[1];
      built_apart += apart_left * apart_left + apart_right * apart_right;
      built_whole += static_cast<double>(now_out[0]) * now_out[0] + static_cast<double>(now_out[1]) * now_out[1];
    }
    top_built.see(kit::max(magnitude(shown.out[0]), magnitude(shown.out[1])));
    low_built.see(shown.gain);

    top_peak.see(now_peak);
    low_required.see(now_required);
    low_released.see(limiter.release_state_);
    low_minimum.see(ran ? limiter.deque_values_[limiter.deque_head_] : limiter.envelope_);
    low_gain.see(limiter.envelope_);

    in_tap.put(i, left, right);
    pushed.put(i, now_pushed[0], now_pushed[1]);
    clip_only.put(i, kit::clamp(now_pushed[0], -limiter.ceiling_, limiter.ceiling_),
                  kit::clamp(now_pushed[1], -limiter.ceiling_, limiter.ceiling_));
    delayed.put(i, now_delayed[0], now_delayed[1]);
    removed.put(i, now_delayed[0] - now_out[0], now_delayed[1] - now_out[1]);
    ambient_out.put(i, ambient.out_left()[0], ambient.out_right()[0]);
    out_tap.put(i, now_out[0], now_out[1]);
    built.put(i, shown.out[0], shown.out[1]);
    top_peak.put(peak_tap, i);
    low_required.put(required, i);
    low_released.put(released, i);
    low_minimum.put(minimum, i);
    low_gain.put(gain, i);
    top_out.put(out_peak, i);
    low_ride.put(ride_gain, i);
    low_wall.put(wall_gain, i);
    top_built.put(built_peak, i);
    low_built.put(built_gain, i);

    if (i >= frames && i < 2 * frames) {
      const int k = i - frames;
      for (int c = 0; c < 2; ++c) {
        keep_pushed[c][k] = now_pushed[c];
        keep_delayed[c][k] = now_delayed[c];
        keep_out[c][k] = now_out[c];
      }
      keep_released[k] = limiter.release_state_;
      keep_minimum[k] = ran ? limiter.deque_values_[limiter.deque_head_] : limiter.envelope_;
      keep_gain[k] = limiter.envelope_;
    }
  }
  rebuilt.value = worst;
  clipped.value = static_cast<float>(clip_count);
  clip_depth.value = static_cast<float>(clip_most);
  overshoot.value = spot_excess > 0.0f ? spot_db : 0.0f;
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  const auto wrap = [frames](int k) { return ((k % frames) + frames) % frames; };

  // The largest peak, close to. The reading at step j is of the wave after
  // sample j - 6, which comes out at j - 6 + 77: time 0 of this view.
  {
    const int centre = loop_peak_at - kBack + limiter.delay_frames_;
    lab::Tap* views[] = {&near_released, &near_minimum, &near_gain,    &near_pushed,
                         &near_delayed,  &near_out,     &near_clipped, &near_ceiling};
    for (lab::Tap* view : views) open_view(*view);
    if (near_ceiling.data) {
      // The channel the peak is on, turned so that the peak points up.
      const float at_left =
          kit::max(magnitude(keep_delayed[0][wrap(centre)]), magnitude(keep_delayed[0][wrap(centre + 1)]));
      const float at_right =
          kit::max(magnitude(keep_delayed[1][wrap(centre)]), magnitude(keep_delayed[1][wrap(centre + 1)]));
      const int c = at_right > at_left ? 1 : 0;
      const float a = keep_delayed[c][wrap(centre)];
      const float b = keep_delayed[c][wrap(centre + 1)];
      const float turn = (magnitude(a) > magnitude(b) ? a : b) < 0.0f ? -1.0f : 1.0f;
      for (int p = 0; p < kViewPoints; ++p) {
        const int k = wrap(centre - kBefore + p);
        near_released.set(p, keep_released[k]);
        near_minimum.set(p, keep_minimum[k]);
        near_gain.set(p, keep_gain[k]);
        near_pushed.set(p, turn * keep_pushed[c][k]);
        near_delayed.set(p, turn * keep_delayed[c][k]);
        near_out.set(p, turn * keep_out[c][k]);
        near_clipped.set(p, kit::clamp(turn * keep_delayed[c][k], -limiter.ceiling_, limiter.ceiling_));
        near_ceiling.set(p, limiter.ceiling_);
      }
    }
  }

  // Where the wave stands furthest over its samples: eight samples either
  // side, and the filter's four points between each pair.
  {
    constexpr int kSide = 8;
    constexpr int kShown = 2 * kSide;
    static float stretch[kShown + 2 * kTaps];
    const int first = spot_at - kSide;  // the kept sample the view starts on
    for (int n = 0; n < kShown + 2 * kTaps; ++n) stretch[n] = keep_pushed[spot_channel][wrap(first - kTaps + n)];
    if (samples.open(kShown + 1) && between.open(kShown * kPhases)) {
      samples.x0 = -static_cast<float>(kSide);
      samples.x1 = static_cast<float>(kSide);
      between.x0 = -static_cast<float>(kSide) + 0.125f;
      between.x1 = static_cast<float>(kSide) - 0.125f;
      for (int n = 0; n <= kShown; ++n) samples.set(n, stretch[kTaps + n]);
      for (int n = 0; n < kShown; ++n) {
        for (int p = 0; p < kPhases; ++p) between.set(n * kPhases + p, phase(stretch, kTaps + n + kBack, p));
      }
    }
  }

  draw_tone();
  draw_click();
  draw_built_click();
  draw_response();
  measure_curve();
}
