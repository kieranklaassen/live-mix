#pragma once

#include <cmath>

#include "../../common/dsp_util.h"

// Ported from kkfonie Tatami/Source/Shared/DSP/SvfTptTone.h (see device.json
// for the commit and the deviations: JUCE constants replaced by plain C++,
// denormals flushed in the integrators, a cheaper way to the same tanh).
//
// Topology-preserving-transform state variable filter (Zavalishin; the Simper/Cytomic
// arrangement). One stage yields low/band/high simultaneously; notch and peak are linear
// combinations. Coefficients are separate from the state so a modulated cutoff costs one
// tan() per sample and both channels share it. `magnitude()` is the analog prototype
// evaluated at the prewarped frequency, i.e. exactly what the digital filter does.

namespace tatami::dsp
{

constexpr float kPi = 3.14159265358979323846f;
constexpr double kPiDouble = 3.14159265358979323846;

/**
    tanh as 1 - 2 / (e^(2|x|) + 1), with its series below |x| = 0.3 where that form would lose
    the low bits. Within 2e-7 of std::tanh everywhere and exactly odd; in WebAssembly it costs
    half as much as the library call, and a driven 24 dB filter needs sixteen per sample.
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

enum class SvfMode : int
{
    LowPass = 0,
    HighPass,
    BandPass,
    Notch,
    Peak,
};

constexpr int kNumSvfModes = 5;

struct SvfToneCoeffs
{
    float g = 0.0f;
    float k = 1.0f;
    float a1 = 1.0f;
    float a2 = 0.0f;
    float a3 = 0.0f;

    static SvfToneCoeffs make (float cutoffHz, float q, double sampleRate) noexcept
    {
        SvfToneCoeffs c;
        c.g = std::tan (kPi * cutoffHz / (float) sampleRate);
        c.k = 1.0f / q;
        c.a1 = 1.0f / (1.0f + c.g * (c.g + c.k));
        c.a2 = c.g * c.a1;
        c.a3 = c.g * c.a2;
        return c;
    }
};

struct SvfOutputs
{
    float low, band, high;
};

class SvfTptTone
{
public:
    SvfOutputs process (float x, const SvfToneCoeffs& c) noexcept
    {
        const auto v3 = x - ic2;
        const auto v1 = c.a1 * ic1 + c.a2 * v3;
        const auto v2 = ic2 + c.a2 * ic1 + c.a3 * v3;
        ic1 = livemix::flush_denormal (2.0f * v1 - ic1);
        ic2 = livemix::flush_denormal (2.0f * v2 - ic2);
        return { v2, v1, x - c.k * v1 - v2 };
    }

    /** Bounded nonlinearity on the integrator states: filter drive and a self-oscillation ceiling. */
    void saturateStates (float amount) noexcept
    {
        ic1 += (tanhExp (ic1) - ic1) * amount;
        ic2 += (tanhExp (ic2) - ic2) * amount;
    }

    void reset() noexcept { ic1 = ic2 = 0.0f; }

    /** A NaN or runaway state (inf input) restarts the filter. */
    void sanitize() noexcept
    {
        if (! (std::abs (ic1) < 1.0e6f && std::abs (ic2) < 1.0e6f))
            reset();
    }

    /** Mode output; band is normalised to 0 dB at the peak, peak has gain 2Q at the cutoff. */
    static float select (SvfMode mode, float x, const SvfOutputs& o, float k) noexcept
    {
        switch (mode)
        {
            case SvfMode::LowPass:  return o.low;
            case SvfMode::HighPass: return o.high;
            case SvfMode::BandPass: return k * o.band;
            case SvfMode::Notch:    return x - k * o.band;
            case SvfMode::Peak:     return o.low - o.high;
        }
        return x;
    }

    /** |H| of one stage at `freqHz` for a filter running at `sampleRate` (linear gain). */
    static double magnitude (SvfMode mode, double freqHz, double cutoffHz, double q, double sampleRate) noexcept
    {
        const auto g = std::tan (kPiDouble * cutoffHz / sampleRate);
        const auto w = std::tan (kPiDouble * freqHz / sampleRate) / g;
        const auto k = 1.0 / q;
        const auto w2 = w * w;
        const auto denom = std::sqrt ((1.0 - w2) * (1.0 - w2) + k * k * w2);
        switch (mode)
        {
            case SvfMode::LowPass:  return 1.0 / denom;
            case SvfMode::HighPass: return w2 / denom;
            case SvfMode::BandPass: return k * w / denom;
            case SvfMode::Notch:    return std::abs (1.0 - w2) / denom;
            case SvfMode::Peak:     return (1.0 + w2) / denom;
        }
        return 1.0;
    }

private:
    float ic1 = 0.0f;
    float ic2 = 0.0f;
};

inline SvfMode svfModeFromIndex (int index) noexcept
{
    return static_cast<SvfMode> (index < 0 ? 0 : (index > kNumSvfModes - 1 ? kNumSvfModes - 1 : index));
}

} // namespace tatami::dsp
