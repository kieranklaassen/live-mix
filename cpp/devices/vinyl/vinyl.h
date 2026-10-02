#pragma once

// Vinyl: what a record and its turntable do to a sound, as an insert.
//
//   in ─► disc (a long delay line) ─► read head ─► × platter gain ─► wear ─►(+)─► 78 band ─► tone ─► mix
//                                     ▲    ▲                                  ▲
//                         warp (once a turn)  platter lag           crackle, pops, hiss, rumble
//
// [[NOTES]]

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Vinyl : public kit::DeviceBase<vinyl::kNumParams> {
 public:
  static constexpr int kNumSpeeds = 3;
  // Turns per second at 33⅓, 45 and 78 rpm.
  static constexpr float kTurnHz[kNumSpeeds] = {33.3333f / 60.0f, 0.75f, 1.3f};
  // Peak pitch deviation at Warp 1 (the control is squared).
  static constexpr float kWarpDeviation = 0.03f;

  // [[PUBLIC]]

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // [[PROCESS]]

 private:
  // [[CONSTANTS]]

  // [[HELPERS]]

  // [[CONTROL]]

  void apply(int id) {
    using namespace vinyl;
    switch (id) {
      case kSpeed:
        speed_ = kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, kNumSpeeds - 1);
        break;
      case kPlatter:
        set_playing(param(id) < 0.5f);
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read on the control clock
    }
  }

  // [[MEMBERS]]
};

}  // namespace livemix
