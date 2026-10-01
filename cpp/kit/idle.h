#pragma once

namespace livemix {
namespace kit {

// Lets a device stop working when it has nothing to say. With thirty devices
// in a session most are idle most of the time; an idle one should cost a
// buffer clear, and its output must be exact zero rather than a tail that
// decays forever at -200 dB.
//
//   frames = begin_block(frames);
//   if (!idle_.wake(input_present(frames) || voices_sounding)) {
//     silence_output(frames);          // also consumes the (silent) input
//     return;
//   }
//   ... render ...
//   idle_.settle(output_peak(frames), frames);
//
// The device falls asleep once nothing excites it and its output has stayed
// under -140 dBFS for `hold_seconds`. Choose a hold longer than the longest
// silent gap the device can produce on its own (its longest delay or
// pre-delay, plus a margin): the gate cannot see sound that is still
// travelling down a delay line. State is left as it is; what remains is
// below the floor.
class IdleGate {
 public:
  static constexpr float kFloor = 1.0e-7f;

  void reset(float sample_rate, float hold_seconds) {
    hold_ = static_cast<long>(hold_seconds * sample_rate);
    if (hold_ < 1) hold_ = 1;
    quiet_ = hold_;
  }

  // True when the block has to be rendered.
  bool wake(bool excited) {
    if (excited) quiet_ = 0;
    return quiet_ < hold_;
  }

  void settle(float peak, int frames) {
    if (peak > kFloor) {
      quiet_ = 0;
    } else if (quiet_ < hold_) {
      quiet_ += frames;
    }
  }

  bool asleep() const { return quiet_ >= hold_; }

 private:
  long hold_ = 1;
  long quiet_ = 1;
};

}  // namespace kit
}  // namespace livemix
