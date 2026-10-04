#pragma once

// Tape Loop: the long two-deck tape delay of Frippertronics and Discreet
// Music. The record deck writes; a loop length later the tape reaches the
// playback deck, and what it plays goes back to the record deck quieter and
// a little more worn, so layers pile up and slowly fade.
//
//   in ─► record gate ─► ping pong ─(+)─► limit ─► tape ─┬─► play head ─► wear ─► low cut ─► wet
//                                    ▲                   │   (varispeed, either way)
//                                    │                   │
//                                    └── feedback ◄─ wear ◄┴── feedback tap, one Length downstream
//
// - The loop itself always runs at normal speed: the feedback tap sits
//   exactly Length behind the record head, on a whole sample, so with Wear at
//   0 and Feedback at 1 a pass is a bit-exact copy and the loop holds for
//   ever. The limiter is exactly linear below -6 dBFS and never has gain.
// - The play head is a second, movable reader of the same tape. At Normal and
//   Forward it rests on the feedback tap (the first repeat comes Length after
//   the note). Speed and Direction set how fast it travels round the loop:
//   Half plays the loop an octave down and twice as long, Double an octave
//   up, Reverse backwards. The motor has a lag, so a change bends the pitch
//   the way a tape machine does, and a change of direction slows to a stop
//   and runs back up. Afterwards the head stays where it stopped on the loop.
// - A moving play head is lapped by the record head (or laps it). Across that
//   join the tape jumps by one pass, so the head crossfades over 40 ms of
//   tape between the pass it is leaving and the one it is entering.
// - Length is the distance between the decks. Changing it glides (a 0.25 s
//   lag, at most three seconds of tape per second), bending everything on
//   the loop while it moves; a longer loop finds older tape again.
// - Wear is what playing the tape back costs, at either head: a one-pole
//   low-pass (16 kHz down to 2 kHz) and soft saturation, so the first return
//   has one generation of it and every later pass one more. The feedback tap
//   also drifts slowly, differently in each channel, so old layers blur and
//   widen. Wow is the play head's own speed drift and does not accumulate.
// - Record Off stops new input reaching the tape; the loop keeps turning and
//   fading. Ping Pong records the input on the left and crosses the feedback,
//   so layers change sides on every pass.
// - Sleep: the gate watches what the record head writes. Only when a whole
//   loop (plus the join) of tape is below -140 dBFS, and nothing is coming
//   in, does the device stop; it wakes with a blank tape.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "ring.h"

namespace livemix {

class TapeLoop : public kit::DeviceBase<tape_loop::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace tape_loop;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    feedback_.set_time(kSmoothingSeconds, sr);
    wear_.set_time(kSmoothingSeconds, sr);
    wow_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    record_.set_time(0.02f, sr);
    velocity_.set_time(kMotorLagSeconds, sr);
    margin_ = kMarginSeconds * sr;
    seam_ = kSeamSeconds * sr;
    glide_ = 1.0 - std::exp(-1.0 / (static_cast<double>(kLengthLagSeconds) * sr));
    wow_drift_.seed(0x51ED270Bu);
    wow_drift_.set_rate(0.5f, sr);
    flutter_.reset();
    flutter_.seed(0x9E3779B9u);
    flutter_.set_rate(7.1f, sr);
    blur_drift_[0].seed(0x7F4A7C15u);
    blur_drift_[0].set_rate(0.31f, sr);
    blur_drift_[1].seed(0x2C1B3C6Du);
    blur_drift_[1].set_rate(0.37f, sr);
    asleep_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // the level the record head has just written (the highest sample of the
  // last 40 ms of tape, 0 while asleep, when the tape is blank), how far
  // behind the record head the play head is as a share of the loop, the
  // distance between the decks in seconds as it glides, the play head's speed
  // as the motor has it (1 forwards, negative backwards), and how long the
  // tape has run, in seconds, going round at 64: it moves on with every block
  // the device works, so a display can tell a tape that runs from one that
  // stands, and it is -1 while asleep. All of it is worked out here, when a
  // display asks: nothing is kept for it while the sound is made.
  float meter(int index) const {
    switch (index) {
      case 0:
        return asleep_ ? 0.0f : ring_.peak(static_cast<int>(kLevelSeconds * sample_rate()));
      case 1:
        return static_cast<float>(phase_);
      case 2:
        return static_cast<float>(length_ / sample_rate());
      case 3:
        return velocity_.value;
      case 4: {
        if (asleep_) return -1.0f;
        const double lap = static_cast<double>(kClockSeconds) * sample_rate();
        const double frames = ring_.written();
        return static_cast<float>((frames - lap * std::floor(frames / lap)) / sample_rate());
      }
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace tape_loop;
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      asleep_ = false;
      ring_.forget();
      restart();
    }
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) control();

      // The decks: distance between them, and where the play head is.
      if (length_ != length_target_) {
        length_ +=
            kit::clamp(static_cast<float>((length_target_ - length_) * glide_), -kMaxSlew, kMaxSlew);
        if (std::fabs(length_target_ - length_) < 1.0e-3) length_ = length_target_;
      }
      const float velocity = velocity_.next();
      if (velocity != 1.0f) phase_ += (1.0 - velocity) / length_;
      double delay = phase_ * length_;
      if (delay < margin_ + seam_) {
        phase_ += 1.0;
        delay = phase_ * length_;
      } else if (delay >= length_ + margin_ + seam_) {
        phase_ -= 1.0;
        delay = phase_ * length_;
      }

      // Play head. Within `seam_` of the join it blends the pass it reads
      // with the same place one pass newer.
      const double now = ring_.written();
      const double wobble = wow_.next() * sr * wobble_.next();
      float play[2];
      const double past_join = delay - length_ - margin_;
      ring_.read(now - delay - wobble, &play[0], &play[1]);
      if (past_join > 0.0) {
        float newer[2];
        ring_.read(now - (delay - length_) - wobble, &newer[0], &newer[1]);
        const float blend = kit::min(1.0f, static_cast<float>(past_join / seam_));
        play[0] += (newer[0] - play[0]) * blend;
        play[1] += (newer[1] - play[1]) * blend;
      }
      // Playing the tape back is where a pass costs its wear, for the play
      // head and the feedback tap alike.
      const float wear = wear_.next();
      for (int c = 0; c < 2; ++c) {
        const float dulled = play_dull_[c].lowpass(play[c]);
        play[c] = dulled + wear * (kit::fast_tanh(dulled * kDrive) * (1.0f / kDrive) - dulled);
      }
      const float wet_left = low_cut_[0].highpass(play[0]);
      const float wet_right = low_cut_[1].highpass(play[1]);

      // Feedback tap, one Length downstream.
      const float drift_left = blur_[0].next();
      const float drift_right = blur_[1].next();
      float old[2];
      if (wear > 0.0f) {
        const double depth = static_cast<double>(wear) * kBlurSeconds * sr;
        float other;
        ring_.read(now - length_ - depth * drift_left, &old[0], &other);
        ring_.read(now - length_ - depth * drift_right, &other, &old[1]);
      } else {
        ring_.read(now - length_, &old[0], &old[1]);
      }
      for (int c = 0; c < 2; ++c) {
        const float dulled = dull_[c].lowpass(old[c]);
        old[c] = dulled + wear * (kit::fast_tanh(dulled * kDrive) * (1.0f / kDrive) - dulled);
      }

      // Record head.
      const float spread = spread_.next();
      const float feedback = feedback_.next();
      const float record = record_.next();
      const float in_left = record * (in[0] + spread * in[1]) * kit::lerp(1.0f, kit::kSqrtHalf, spread);
      const float in_right = record * in[1] * (1.0f - spread);
      const float left =
          flush_denormal(kit::soft_clip(in_left + feedback * kit::lerp(old[0], old[1], spread)));
      const float right =
          flush_denormal(kit::soft_clip(in_right + feedback * kit::lerp(old[1], old[0], spread)));
      ring_.write(left, right);
      const float floor = kit::IdleGate::kFloor;
      if (left > floor || left < -floor || right > floor || right < -floor) {
        blank_ = 0;
      } else if (blank_ < kLongEnough) {
        ++blank_;
      }

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
        wet_gain_ = kit::SineTable::lookup(0.25f * mix);
      }
      out_left_[i] = in[0] * dry_gain_ + wet_left * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet_right * wet_gain_;
    }
    // Everything either head can reach is blank tape.
    const double reach = (length_ > length_target_ ? length_ : length_target_) + margin_ + seam_ + 64.0;
    if (!excited && static_cast<double>(blank_) > reach &&
        output_peak(frames) <= kit::IdleGate::kFloor) {
      asleep_ = true;
    }
  }

 private:
  // 30 s at 96 kHz plus the join.
  static constexpr int kRingFrames = 2886000;
  static constexpr long kLongEnough = 1L << 30;
  static constexpr float kMotorLagSeconds = 0.15f;
  static constexpr float kLengthLagSeconds = 0.25f;
  // Fastest the decks move apart or together, in samples of tape per sample.
  static constexpr float kMaxSlew = 3.0f;
  // The heads never come closer to the record head than the margin, which
  // covers the largest wow excursion; the join is crossfaded over the seam.
  static constexpr float kMarginSeconds = 0.004f;
  static constexpr float kSeamSeconds = 0.04f;
  // Play head: ±0.5 % pitch at 0.5 Hz and ±0.3 % at 7 Hz with Wow at 1.
  static constexpr float kWowSeconds = 0.0016f;
  static constexpr float kFlutterSeconds = 0.00007f;
  // Per pass at Wear 1: the tap wanders ±0.8 ms (about ±0.15 % pitch).
  static constexpr float kBlurSeconds = 0.0008f;
  static constexpr float kDrive = 1.5f;
  static constexpr float kSpeeds[3] = {0.5f, 1.0f, 2.0f};
  static constexpr int kControlPeriod = 16;
  // For a display (see meter): how much of the newest tape its level is taken
  // from, a little more than the time between two readings, and where its
  // clock goes round.
  static constexpr float kLevelSeconds = 0.04f;
  static constexpr float kClockSeconds = 64.0f;

  // A slow modulator worked out on the control clock and joined by straight
  // lines: these move at 7 Hz at most, and a sine per sample is not free.
  struct Line {
    float value = 0.0f;
    float step = 0.0f;
    void aim(float target, bool jump) {
      if (jump) value = target;
      step = (target - value) * (1.0f / kControlPeriod);
    }
    float next() {
      const float now = value;
      value += step;
      return now;
    }
  };

  // Play head home on the feedback tap, everything settled (init and wake).
  void restart() {
    for (int c = 0; c < 2; ++c) {
      low_cut_[c].reset();
      dull_[c].reset();
      play_dull_[c].reset();
    }
    clock_.reset(kControlPeriod);
    moving_ = false;
    low_cut_hz_ = -1.0f;
    wear_seen_ = -1.0f;
    mix_seen_ = -1.0f;
    phase_ = 1.0;
    length_ = length_target_;
    velocity_.snap(velocity_.target);
    feedback_.snap(feedback_.target);
    record_.snap(record_.target);
    wear_.snap(wear_.target);
    wow_.snap(wow_.target);
    spread_.snap(spread_.target);
    mix_.snap(mix_.target);
    blank_ = 0;
  }

  void control() {
    using namespace tape_loop;
    const float sr = sample_rate();
    if (param(kLowCut) != low_cut_hz_) {
      low_cut_hz_ = param(kLowCut);
      for (int c = 0; c < 2; ++c) low_cut_[c].set_cutoff(low_cut_hz_, sr);
    }
    if (param(kWear) != wear_seen_) {
      wear_seen_ = param(kWear);
      for (int c = 0; c < 2; ++c) {
        // Wear 0 is no filter at all, so that a pass can be an exact copy.
        if (wear_seen_ > 0.0f) {
          dull_[c].set_cutoff(16000.0f * std::pow(0.125f, wear_seen_), sr);
        } else {
          dull_[c].a = 0.0f;
        }
        play_dull_[c].a = dull_[c].a;
      }
    }
    // Where the modulators will be one control period from now.
    wobble_.aim(kWowSeconds * wow_drift_.next(kControlPeriod) +
                    kFlutterSeconds * flutter_.next_block(kit::Lfo::kSine, kControlPeriod),
                !moving_);
    blur_[0].aim(blur_drift_[0].next(kControlPeriod), !moving_);
    blur_[1].aim(blur_drift_[1].next(kControlPeriod), !moving_);
    moving_ = true;
  }

  void apply(int id) {
    using namespace tape_loop;
    const float value = param(id);
    // Nothing sounds while asleep, so a value set then has nothing to glide from.
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kLength: {
        const double longest =
            kRingFrames - (kMarginSeconds + kSeamSeconds + 0.004) * sample_rate() - 64.0;
        length_target_ = std::floor(static_cast<double>(value) * sample_rate() + 0.5);
        if (length_target_ > longest) length_target_ = std::floor(longest);
        if (!glide) length_ = length_target_;
        break;
      }
      case kFeedback:
        feedback_.set(value, glide);
        break;
      case kSpeed:
      case kDirection: {
        const float speed = kSpeeds[kit::clamp_int(static_cast<int>(param(kSpeed) + 0.5f), 0, 2)];
        velocity_.set(param(kDirection) < 0.5f ? speed : -speed, glide);
        break;
      }
      case kRecord:
        record_.set(value < 0.5f ? 1.0f : 0.0f, glide);
        break;
      case kWear:
        wear_.set(value, glide);
        break;
      case kWow:
        wow_.set(value, glide);
        break;
      case kSpread:
        spread_.set(value, glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;  // Low Cut is read on the control clock
    }
  }

  tape_loop::StereoRing<kRingFrames> ring_;
  kit::OnePole low_cut_[2];
  kit::OnePole dull_[2];
  kit::OnePole play_dull_[2];
  kit::Smoother feedback_, wear_, wow_, spread_, mix_, record_, velocity_;
  kit::Drift wow_drift_, blur_drift_[2];
  kit::Lfo flutter_;
  Line wobble_, blur_[2];
  kit::ControlClock clock_;
  bool moving_ = false;
  float low_cut_hz_ = -1.0f, wear_seen_ = -1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  double length_ = 48000.0;
  double length_target_ = 48000.0;
  double phase_ = 1.0;
  double glide_ = 0.0;
  float margin_ = 192.0f;
  float seam_ = 1920.0f;
  long blank_ = 0;
  bool asleep_ = true;
};

}  // namespace livemix
