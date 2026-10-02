#pragma once

// Auto Gain: the make-up after each circuit, in dB, that returns pink noise
// at -18 dBFS RMS to the level it came in at, for 13 points evenly spaced
// over the gain range (0, 3.5 ... 42 dB into the curve: the tapered Drive,
// not the knob), with Push off and on; the device interpolates between the
// points. Static: nothing here follows the signal.
//
// Noise is compressed by a curve more than a held note or a chord is (its
// peaks stand further above its level), so a table that puts the noise back
// exactly leaves everything tonal a little louder. The entries therefore sit
// up to half a dB under the measurement (kTonalBiasDb: nothing at point 0,
// all of it from a quarter of the way up the range, and all of it at every
// point with Push on): the noise comes back between 0 and 0.75 dB quieter
// and tonal material that much nearer to where it went in.
//
// To measure it again after a change to a circuit: build the device with
// LIVEMIX_ANALOG_DRIVE_RAW_MAKEUP defined (the make-up is then a constant
// 12.04 dB, the headroom), run 8 s of pink noise at -18 dBFS RMS through
// each circuit, Push state and point at 48 kHz (the knob position for a
// point s is (9^s - 1) / 8, the inverse of AnalogDrive::drive_taper) with
// every other control at its default, and enter 12.04 + input RMS - output
// RMS (in dB, skipping the first second), less the bias. The harness checks
// the result with another noise: within 1 dB everywhere.

namespace livemix {
namespace analog_drive_dsp {

constexpr int kGainPoints = 13;
constexpr float kTonalBiasDb = 0.5f;

// [circuit][push][point]
inline constexpr float kMakeupDb[5][2][kGainPoints] = {
    // tape
    {{12.61f, 9.02f, 5.48f, 2.03f, -1.11f, -4.00f, -6.52f, -8.57f, -10.10f, -11.14f, -11.79f, -12.17f, -12.38f},
     {-5.85f, -8.04f, -9.71f, -10.89f, -11.64f, -12.08f, -12.33f, -12.46f, -12.54f, -12.57f, -12.59f, -12.60f, -12.60f}},
    // console
    {{12.05f, 8.39f, 4.75f, 1.13f, -2.26f, -5.53f, -8.57f, -11.17f, -13.16f, -14.56f, -15.50f, -16.12f, -16.50f},
     {-7.74f, -10.48f, -12.66f, -14.21f, -15.27f, -15.97f, -16.41f, -16.68f, -16.83f, -16.92f, -16.97f, -16.99f, -17.01f}},
    // transformer
    {{12.12f, 8.51f, 4.95f, 1.49f, -1.64f, -4.52f, -7.02f, -9.09f, -10.73f, -11.99f, -12.92f, -13.58f, -14.02f},
     {-6.35f, -8.55f, -10.30f, -11.66f, -12.68f, -13.41f, -13.91f, -14.23f, -14.42f, -14.54f, -14.60f, -14.63f, -14.65f}},
    // triode
    {{12.37f, 8.76f, 5.19f, 1.68f, -1.58f, -4.69f, -7.58f, -10.18f, -12.39f, -14.16f, -15.47f, -16.40f, -17.01f},
     {-7.00f, -9.67f, -11.96f, -13.80f, -15.20f, -16.20f, -16.88f, -17.31f, -17.58f, -17.73f, -17.82f, -17.87f, -17.89f}},
    // pentode
    {{12.51f, 8.93f, 5.39f, 1.91f, -1.32f, -4.43f, -7.26f, -9.59f, -11.32f, -12.52f, -13.30f, -13.78f, -14.06f},
     {-6.50f, -8.99f, -10.89f, -12.23f, -13.12f, -13.67f, -14.00f, -14.19f, -14.29f, -14.35f, -14.37f, -14.39f, -14.40f}},
};

}  // namespace analog_drive_dsp
}  // namespace livemix
