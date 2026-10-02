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
    {{12.33f, 8.91f, 5.54f, 2.26f, -0.88f, -3.77f, -6.27f, -8.25f, -9.67f, -10.59f, -11.15f, -11.47f, -11.64f},
     {-5.61f, -7.74f, -9.32f, -10.37f, -11.02f, -11.39f, -11.60f, -11.71f, -11.77f, -11.80f, -11.81f, -11.82f, -11.82f}},
    // console
    {{11.89f, 8.40f, 4.92f, 1.47f, -1.92f, -5.18f, -8.13f, -10.54f, -12.27f, -13.41f, -14.12f, -14.55f, -14.80f},
     {-7.34f, -9.92f, -11.85f, -13.14f, -13.95f, -14.45f, -14.74f, -14.91f, -15.00f, -15.05f, -15.08f, -15.10f, -15.10f}},
    // transformer
    {{12.58f, 9.15f, 5.76f, 2.46f, -0.67f, -3.55f, -6.02f, -7.99f, -9.41f, -10.38f, -11.00f, -11.40f, -11.65f},
     {-5.37f, -7.48f, -9.06f, -10.14f, -10.85f, -11.30f, -11.59f, -11.76f, -11.87f, -11.93f, -11.96f, -11.98f, -11.99f}},
    // triode
    {{12.33f, 8.88f, 5.47f, 2.10f, -1.16f, -4.28f, -7.10f, -9.49f, -11.36f, -12.73f, -13.70f, -14.34f, -14.75f},
     {-6.53f, -9.04f, -11.03f, -12.49f, -13.53f, -14.23f, -14.68f, -14.95f, -15.11f, -15.20f, -15.25f, -15.28f, -15.29f}},
    // pentode
    {{12.67f, 9.26f, 5.89f, 2.58f, -0.64f, -3.73f, -6.53f, -8.85f, -10.58f, -11.77f, -12.54f, -13.00f, -13.27f},
     {-5.79f, -8.26f, -10.16f, -11.50f, -12.37f, -12.90f, -13.21f, -13.38f, -13.48f, -13.53f, -13.55f, -13.56f, -13.57f}},
};

}  // namespace analog_drive_dsp
}  // namespace livemix
