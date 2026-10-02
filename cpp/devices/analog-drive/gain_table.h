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
    {{11.89f, 8.23f, 4.59f, 0.97f, -2.42f, -5.69f, -8.72f, -11.31f, -13.28f, -14.67f, -15.60f, -16.21f, -16.59f},
     {-7.89f, -10.63f, -12.78f, -14.32f, -15.37f, -16.06f, -16.50f, -16.76f, -16.91f, -17.00f, -17.04f, -17.07f, -17.08f}},
    // transformer
    {{12.27f, 8.66f, 5.11f, 1.65f, -1.49f, -4.36f, -6.87f, -8.93f, -10.57f, -11.82f, -12.76f, -13.41f, -13.86f},
     {-6.20f, -8.39f, -10.14f, -11.50f, -12.52f, -13.25f, -13.75f, -14.07f, -14.26f, -14.38f, -14.44f, -14.47f, -14.49f}},
    // triode
    {{12.37f, 8.76f, 5.19f, 1.68f, -1.58f, -4.69f, -7.58f, -10.18f, -12.39f, -14.16f, -15.47f, -16.40f, -17.01f},
     {-7.00f, -9.67f, -11.96f, -13.80f, -15.20f, -16.20f, -16.88f, -17.31f, -17.58f, -17.73f, -17.82f, -17.87f, -17.89f}},
    // pentode
    {{12.66f, 9.09f, 5.55f, 2.08f, -1.15f, -4.25f, -7.08f, -9.45f, -11.27f, -12.55f, -13.39f, -13.91f, -14.21f},
     {-6.32f, -8.84f, -10.82f, -12.24f, -13.19f, -13.79f, -14.14f, -14.35f, -14.46f, -14.52f, -14.55f, -14.57f, -14.58f}},
};

}  // namespace analog_drive_dsp
}  // namespace livemix
