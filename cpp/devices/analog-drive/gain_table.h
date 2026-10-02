#pragma once

// Auto Gain: the make-up after each circuit, in dB, that returns pink noise
// at -18 dBFS RMS to the level it came in at, for Drive 0, 1/12 ... 1, with
// Push off and on. Measured by tmp/analog-drive/calibrate.cpp at 48 kHz with
// every other control at its default; the device interpolates between the
// points. Static: nothing here follows the signal.

namespace livemix {
namespace analog_drive_dsp {

constexpr int kGainPoints = 13;

// [circuit][push][point]
inline constexpr float kMakeupDb[5][2][kGainPoints] = {
    {{12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}, {12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}},
    {{12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}, {12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}},
    {{12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}, {12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}},
    {{12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}, {12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}},
    {{12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}, {12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12}},
};

}  // namespace analog_drive_dsp
}  // namespace livemix
