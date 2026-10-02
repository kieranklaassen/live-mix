#pragma once

// Auto Gain: the make-up after each circuit, in dB, that returns pink noise
// at -18 dBFS RMS to the level it came in at, for Drive 0, 1/12 ... 1, with
// Push off and on; the device interpolates between the points. Static:
// nothing here follows the signal.
//
// To measure it again after a change to a circuit: build the device with
// LIVEMIX_ANALOG_DRIVE_RAW_MAKEUP defined (the make-up is then a constant
// 12.04 dB, the headroom), run 8 s of pink noise at -18 dBFS RMS through
// each circuit, Push state and Drive point at 48 kHz with every other
// control at its default, and enter 12.04 + input RMS - output RMS (in dB,
// skipping the first second). The harness checks the result with another
// noise: within 1 dB everywhere.

namespace livemix {
namespace analog_drive_dsp {

constexpr int kGainPoints = 13;

// [circuit][push][point]
inline constexpr float kMakeupDb[5][2][kGainPoints] = {
    // tape
    {{12.43f, 9.49f, 6.58f, 3.72f, 0.94f, -1.72f, -4.18f, -6.39f, -8.26f, -9.76f, -10.87f, -11.66f, -12.18f},
     {-5.71f, -7.69f, -9.31f, -10.55f, -11.43f, -12.03f, -12.41f, -12.65f, -12.79f, -12.87f, -12.92f, -12.95f, -12.96f}},
    // console
    {{12.28f, 9.29f, 6.30f, 3.32f, 0.37f, -2.55f, -5.38f, -8.05f, -10.45f, -12.40f, -13.85f, -14.86f, -15.56f},
     {-7.19f, -9.69f, -11.81f, -13.42f, -14.56f, -15.35f, -15.89f, -16.24f, -16.47f, -16.60f, -16.69f, -16.74f, -16.77f}},
    // transformer
    {{12.60f, 9.66f, 6.77f, 3.94f, 1.23f, -1.31f, -3.60f, -5.60f, -7.28f, -8.67f, -9.80f, -10.70f, -11.40f},
     {-4.97f, -6.76f, -8.24f, -9.45f, -10.43f, -11.19f, -11.76f, -12.17f, -12.44f, -12.63f, -12.74f, -12.82f, -12.86f}},
    // triode
    {{12.64f, 9.69f, 6.76f, 3.86f, 1.02f, -1.74f, -4.37f, -6.83f, -9.06f, -11.00f, -12.62f, -13.89f, -14.85f},
     {-6.26f, -8.56f, -10.57f, -12.25f, -13.59f, -14.62f, -15.37f, -15.89f, -16.25f, -16.48f, -16.62f, -16.71f, -16.76f}},
    // pentode
    {{12.87f, 9.95f, 7.05f, 4.20f, 1.41f, -1.31f, -3.92f, -6.35f, -8.48f, -10.23f, -11.57f, -12.51f, -13.15f},
     {-5.58f, -7.82f, -9.70f, -11.17f, -12.24f, -12.97f, -13.45f, -13.75f, -13.94f, -14.06f, -14.13f, -14.17f, -14.19f}},
};

}  // namespace analog_drive_dsp
}  // namespace livemix
