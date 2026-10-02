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
    // tape
    {{12.44f, 9.51f, 6.61f, 3.77f, 1.03f, -1.58f, -3.97f, -6.09f, -7.89f, -9.33f, -10.45f, -11.27f, -11.85f},
     {-5.44f, -7.34f, -8.90f, -10.12f, -11.03f, -11.69f, -12.14f, -12.45f, -12.65f, -12.78f, -12.86f, -12.91f, -12.94f}},
    // console
    {{12.29f, 9.29f, 6.31f, 3.33f, 0.38f, -2.52f, -5.33f, -7.99f, -10.37f, -12.32f, -13.76f, -14.78f, -15.48f},
     {-7.14f, -9.63f, -11.73f, -13.33f, -14.48f, -15.28f, -15.82f, -16.18f, -16.42f, -16.57f, -16.66f, -16.72f, -16.75f}},
    // transformer
    {{12.62f, 9.70f, 6.85f, 4.10f, 1.49f, -0.91f, -3.04f, -4.89f, -6.44f, -7.73f, -8.81f, -9.69f, -10.39f},
     {-4.31f, -5.95f, -7.33f, -8.48f, -9.42f, -10.18f, -10.76f, -11.20f, -11.51f, -11.73f, -11.88f, -11.98f, -12.04f}},
    // triode
    {{12.63f, 9.67f, 6.73f, 3.81f, 0.93f, -1.87f, -4.54f, -7.00f, -9.18f, -11.03f, -12.53f, -13.71f, -14.62f},
     {-6.31f, -8.56f, -10.48f, -12.08f, -13.35f, -14.34f, -15.08f, -15.63f, -16.03f, -16.30f, -16.49f, -16.62f, -16.70f}},
    // pentode
    {{12.87f, 9.94f, 7.05f, 4.19f, 1.39f, -1.35f, -4.01f, -6.57f, -8.97f, -11.15f, -12.98f, -14.41f, -15.42f},
     {-5.73f, -8.20f, -10.47f, -12.43f, -14.00f, -15.14f, -15.94f, -16.47f, -16.82f, -17.03f, -17.16f, -17.24f, -17.29f}},
};

}  // namespace analog_drive_dsp
}  // namespace livemix
