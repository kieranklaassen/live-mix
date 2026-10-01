#pragma once

#include <cmath>

#include "../../common/dsp_util.h"

// Ported from kkfonie Tatami/Source/Shared/DSP/Waveshapers.h (see device.json
// for the commit and the deviations: JUCE helpers replaced by plain C++, a
// cheaper way to the same tanh, denormals flushed in the filters, the DC
// blocker's state held in double).
//
// Memoryless saturation curves (with the antiderivatives ADAA needs) plus the small
// companion filters a saturation stage always ends up wanting: a DC blocker for asymmetric
// curves, a first-order tilt for "tone" and a one-pole low-pass for tape-style HF loss.
// Every curve passes through the origin with unit slope so drive = 0 dB is transparent at low
// level, and every curve is bounded to [-1, 1].

namespace tatami::dsp::shapers
{

enum class Curve : int
{
    Soft = 0,   // tanh
    Hard,       // clip
    Tube,       // asymmetric tanh (negative half saturates earlier -> even harmonics)
    Tape,       // x / sqrt(1 + x^2), gentle knee; HF roll-off is applied by the device
    Fold,       // triangle wave-fold
};

constexpr int kNumCurves = 5;
constexpr float kTubeNegativeKnee = 1.5f;

/**
    tanh as 1 - 2 / (e^(2|x|) + 1), with its series below |x| = 0.3 where that form would lose
    the low bits. Within 2e-7 of std::tanh everywhere and exactly odd; in WebAssembly it costs
    half as much as the library call, and the curves run four times per sample.
*/
inline float tanhExp (float x) noexcept
{
    const auto a = std::abs (x);
    if (a < 0.3f)
    {
        const auto x2 = x * x;
        return x * (1.0f + x2 * (-0.33333333f + x2 * (0.13333333f + x2 * (-0.053968254f + x2 * 0.021869489f))));
    }
    const auto t = 1.0f - 2.0f / (std::exp (2.0f * a) + 1.0f);
    return x < 0.0f ? -t : t;
}

struct Soft
{
    static float shape (float x) noexcept { return tanhExp (x); }
    // ln(cosh x) = |x| + ln(1 + e^(-2|x|)) - ln 2, written so it does not overflow for large |x|.
    static double antiderivative (double x) noexcept
    {
        const auto a = std::abs (x);
        return a + std::log1p (std::exp (-2.0 * a)) - 0.6931471805599453;
    }
};

struct Hard
{
    static float shape (float x) noexcept { return x < -1.0f ? -1.0f : (x > 1.0f ? 1.0f : x); }
    static double antiderivative (double x) noexcept
    {
        const auto a = std::abs (x);
        return a <= 1.0 ? 0.5 * x * x : a - 0.5;
    }
};

struct Tube
{
    static float shape (float x) noexcept
    {
        return x >= 0.0f ? tanhExp (x) : tanhExp (x * kTubeNegativeKnee) / kTubeNegativeKnee;
    }
};

struct Tape
{
    static float shape (float x) noexcept { return x / std::sqrt (1.0f + x * x); }
};

struct Fold
{
    static float shape (float x) noexcept
    {
        const auto t = (x + 1.0f) * 0.25f;
        return 4.0f * std::abs (t - std::floor (t + 0.5f)) - 1.0f;
    }
};

inline float shape (Curve curve, float x) noexcept
{
    switch (curve)
    {
        case Curve::Soft: return Soft::shape (x);
        case Curve::Hard: return Hard::shape (x);
        case Curve::Tube: return Tube::shape (x);
        case Curve::Tape: return Tape::shape (x);
        case Curve::Fold: return Fold::shape (x);
    }
    return x;
}

inline Curve curveFromIndex (int index) noexcept
{
    return static_cast<Curve> (index < 0 ? 0 : (index > kNumCurves - 1 ? kNumCurves - 1 : index));
}

} // namespace tatami::dsp::shapers

namespace tatami::dsp
{

constexpr float kTwoPi = 6.28318530717958647692f;

/** One-pole low-pass, y[n] = y[n-1] + a (x - y[n-1]). */
struct OnePoleLowpass
{
    void setCutoff (float cutoffHz, double sampleRate) noexcept
    {
        a = 1.0f - std::exp (-kTwoPi * cutoffHz / (float) sampleRate);
    }

    float process (float x) noexcept
    {
        state = livemix::flush_denormal (state + a * (x - state));
        return state;
    }

    void reset() noexcept { state = 0.0f; }

    float a = 1.0f;
    float state = 0.0f;
};

/**
    DC blocker: the input minus its one-pole low-pass (exact complement, so highs pass untouched).
    The state is a double: in float the low-pass stalls about 2e-5 short of a constant input
    (a (x - state) falls under half a step of the state), which would leave that much DC
    behind for good.
*/
struct DcBlocker
{
    void prepare (double sampleRate, float cutoffHz = 10.0f) noexcept
    {
        a = 1.0 - std::exp (-6.283185307179586 * (double) cutoffHz / sampleRate);
    }

    /** The low-pass part: what `process` subtracts. */
    float lowpass (float x) noexcept
    {
        state += a * ((double) x - state);
        if (state > -1.0e-30 && state < 1.0e-30)
            state = 0.0;
        return (float) state;
    }

    float process (float x) noexcept { return x - lowpass (x); }
    void reset() noexcept { state = 0.0; }

    double a = 1.0;
    double state = 0.0;
};

/**
    First-order tilt: -tilt dB below the pivot, +tilt dB above, exactly 0 dB at the pivot.
    H(s) = k (s + w0/k) / (s + w0 k) with k = 10^(tilt/20), bilinear-discretised with the
    pivot prewarped so the 0 dB crossing lands on `pivotHz` at any sample rate.
*/
struct TiltFilter
{
    void set (float tiltDb, float pivotHz, double sampleRate) noexcept
    {
        const auto k = std::pow (10.0f, tiltDb / 20.0f);
        const auto w0 = kTwoPi * pivotHz;
        const auto c = w0 / std::tan (w0 / (2.0f * (float) sampleRate));
        const auto a = w0 / k;
        const auto b = w0 * k;
        const auto norm = 1.0f / (c + b);
        b0 = k * (c + a) * norm;
        b1 = k * (a - c) * norm;
        a1 = (b - c) * norm;
    }

    float process (float x) noexcept
    {
        const auto y = livemix::flush_denormal (b0 * x + b1 * x1 - a1 * y1);
        x1 = x;
        y1 = y;
        return y;
    }

    void reset() noexcept { x1 = y1 = 0.0f; }

    float b0 = 1.0f, b1 = 0.0f, a1 = 0.0f;
    float x1 = 0.0f, y1 = 0.0f;
};

} // namespace tatami::dsp
