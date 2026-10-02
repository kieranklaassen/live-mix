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
    {{12.53f, 8.95f, 5.41f, 1.96f, -1.18f, -4.07f, -6.57f, -8.56f, -9.99f, -10.93f, -11.50f, -11.82f, -12.00f},
     {-5.41f, -7.71f, -9.47f, -10.70f, -11.36f, -11.75f, -11.96f, -12.07f, -12.13f, -12.16f, -12.18f, -12.19f, -12.19f}},
    // console
    {{11.89f, 8.23f, 4.59f, 0.97f, -2.42f, -5.68f, -8.63f, -11.04f, -12.77f, -13.91f, -14.62f, -15.05f, -15.30f},
     {-7.34f, -10.09f, -12.18f, -13.64f, -14.45f, -14.95f, -15.24f, -15.41f, -15.50f, -15.55f, -15.58f, -15.60f, -15.60f}},
    // transformer
    {{12.58f, 8.98f, 5.42f, 1.96f, -1.17f, -4.05f, -6.52f, -8.49f, -9.91f, -10.88f, -11.50f, -11.90f, -12.15f},
     {-5.37f, -7.65f, -9.39f, -10.64f, -11.35f, -11.80f, -12.09f, -12.26f, -12.37f, -12.43f, -12.46f, -12.48f, -12.49f}},
    // triode
    {{12.39f, 8.79f, 5.22f, 1.71f, -1.55f, -4.65f, -7.47f, -9.87f, -11.77f, -13.17f, -14.16f, -14.82f, -15.24f},
     {-6.43f, -9.11f, -11.28f, -12.93f, -13.99f, -14.70f, -15.16f, -15.45f, -15.61f, -15.70f, -15.75f, -15.78f, -15.79f}},
    // pentode
    {{12.67f, 9.09f, 5.56f, 2.08f, -1.14f, -4.23f, -7.03f, -9.35f, -11.08f, -12.27f, -13.04f, -13.50f, -13.77f},
     {-5.79f, -8.43f, -10.49f, -12.00f, -12.87f, -13.40f, -13.71f, -13.88f, -13.98f, -14.03f, -14.05f, -14.06f, -14.07f}},
};

}  // namespace analog_drive_dsp
}  // namespace livemix
