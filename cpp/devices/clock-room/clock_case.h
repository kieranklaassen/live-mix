#pragma once

// The case the clocks stand in: a low shelf, a peak and a high shelf on each
// channel, and beside them a short box of four reflections that cross into
// each other. Moving from one case to the next glides every setting of both
// over a fifth of a second, so it can be turned under a ringing chord.

#include <initializer_list>

#include "../../kit/delay.h"
#include "../../kit/filters.h"
#include "../../kit/fdn.h"
#include "../../kit/smooth.h"
#include "gong_tables.h"

namespace livemix {

class ClockCase {
 public:
  static constexpr int kLines = 4;
  enum Setting : int {
    kLowHz = 0, kLowDb, kMidHz, kMidQ, kMidDb, kHighHz, kHighDb, kSend, kFeedback, kDampHz, kTickHz, kTickQ, kTickGain, kGain, kRing,
    kNumSettings
  };

  void init(float sample_rate, float tick_seconds) {
    sample_rate_ = sample_rate;
    clear();
    for (int l = 0; l < kLines; ++l) {
      static constexpr float kSeconds[kLines] = {0.00307f, 0.00461f, 0.00619f, 0.00797f};
      length_[l] = kit::clamp_int(static_cast<int>(kSeconds[l] * sample_rate + 0.5f), 2, Line::kSize - 2);
    }
    for (kit::Smoother& setting : setting_) setting.set_time(0.08f, 1.0f / tick_seconds);
    blocker_[0].set_cutoff(14.0f, sample_rate);
    blocker_[1].set_cutoff(14.0f, sample_rate);
    choose(0, false);
    retune();
    now_ = next_ = levels();
    step_ = Levels();
  }

  void clear() {
    for (kit::Biquad* filter : {&low_[0], &low_[1], &mid_[0], &mid_[1], &high_[0], &high_[1]}) filter->reset();
    for (Line& line : line_) line.clear();
    for (float& damp : damp_) damp = 0.0f;
    for (kit::DcBlocker& blocker : blocker_) blocker.reset();
  }

  // Sends every setting to the case `which`, or puts it there at once.
  void choose(int which, bool glide) {
    const clock_room_tables::Case& to = clock_room_tables::room_case(which);
    const float values[kNumSettings] = {to.low_hz, to.low_db,  to.mid_hz,   to.mid_q,   to.mid_db,  to.high_hz, to.high_db,
                                        to.send,   to.feedback, to.damp_hz, to.tick_hz, to.tick_q, to.tick_gain, to.gain, to.ring};
    for (int s = 0; s < kNumSettings; ++s) setting_[s].set(values[s], glide);
    moved_ = true;
  }

  // Once a control tick of `samples`.
  void control(int samples) {
    now_ = next_;
    if (!moved_) {
      step_ = Levels();
      return;
    }
    moved_ = false;
    for (kit::Smoother& setting : setting_) {
      setting.next();
      if (!setting.settled()) moved_ = true;
    }
    retune();
    next_ = levels();
    const float share = 1.0f / static_cast<float>(samples);
    step_.send = (next_.send - now_.send) * share;
    step_.gain = (next_.gain - now_.gain) * share;
    step_.feedback = (next_.feedback - now_.feedback) * share;
  }
  // Where the settings point, with no glide.
  void snap(int which) {
    choose(which, false);
    moved_ = false;
    retune();
    now_ = next_ = levels();
    step_ = Levels();
  }

  float tick_hz() const { return setting_[kTickHz].value; }
  float tick_q() const { return setting_[kTickQ].value; }
  float ring() const { return setting_[kRing].target; }
  float tick_gain() const { return setting_[kTickGain].value; }

  // Near enough what the case it points to does to a tone at `hz`, as a gain.
  float lift(float hz) const {
    const float low = hz * hz / sq(setting_[kLowHz].target), high = hz * hz / sq(setting_[kHighHz].target);
    const float off = 1.5f * std::log2(hz / setting_[kMidHz].target) * setting_[kMidQ].target;
    const float db = setting_[kLowDb].target / (1.0f + low * low) + setting_[kMidDb].target / (1.0f + off * off) +
                     setting_[kHighDb].target * high * high / (1.0f + high * high);
    // What the box makes of it, over all.
    const float boxed = 1.0f + 2.0f * sq(setting_[kSend].target) * sq(sq(setting_[kFeedback].target));
    return setting_[kGain].target * boxed * kit::db_to_gain(db);
  }

  void process(float* left, float* right, float width) {
    float x[2] = {blocker_[0].process(*left), blocker_[1].process(*right)};
    float v[kLines];
    for (int l = 0; l < kLines; ++l) v[l] = line_[l].read(length_[l]);
    const float middle = 0.5f * (v[0] + v[1] - v[2] - v[3]), side = 0.5f * (v[0] - v[3] - v[1] + v[2]) * width;
    const float wet_left = middle + side, wet_right = middle - side;
    kit::hadamard<kLines>(v);
    const float in[kLines] = {x[0], x[1], 0.7f * x[0] + 0.3f * x[1], 0.3f * x[0] + 0.7f * x[1]};
    for (int l = 0; l < kLines; ++l) {
      damp_[l] = flush_denormal(v[l] + (damp_[l] - v[l]) * damping_);
      line_[l].write(flush_denormal(in[l] + now_.feedback * damp_[l]));
    }
    const float wet[2] = {wet_left, wet_right};
    for (int c = 0; c < 2; ++c) {
      x[c] = high_[c].process(mid_[c].process(low_[c].process(x[c] + now_.send * wet[c]))) * now_.gain;
    }
    now_.send += step_.send;
    now_.gain += step_.gain;
    now_.feedback += step_.feedback;
    *left = x[0];
    *right = x[1];
  }

 private:
  static float sq(float x) { return x * x; }
  using Line = kit::DelayLine<2048>;
  struct Levels {
    float send = 0.0f, gain = 0.0f, feedback = 0.0f;
  };
  Levels levels() const { return {setting_[kSend].value, setting_[kGain].value, setting_[kFeedback].value}; }

  void retune() {
    for (int c = 0; c < 2; ++c) {
      low_[c].set_low_shelf(setting_[kLowHz].value, setting_[kLowDb].value, sample_rate_);
      mid_[c].set_peak(setting_[kMidHz].value, setting_[kMidQ].value, setting_[kMidDb].value, sample_rate_);
      high_[c].set_high_shelf(setting_[kHighHz].value, setting_[kHighDb].value, sample_rate_);
    }
    damping_ = std::exp(-kit::kTwoPi * kit::min(setting_[kDampHz].value, 0.45f * sample_rate_) / sample_rate_);
  }

  kit::Smoother setting_[kNumSettings];
  kit::Biquad low_[2], mid_[2], high_[2];
  kit::DcBlocker blocker_[2];
  Line line_[kLines];
  float damp_[kLines] = {};
  int length_[kLines] = {};
  float damping_ = 0.0f;
  Levels now_, next_, step_;
  float sample_rate_ = 48000.0f;
  bool moved_ = false;
};

}  // namespace livemix
