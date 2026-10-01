#pragma once

#include <cmath>

namespace tatami::dsp
{

/**
    Zavalishin TPT state-variable filter for the instrument voices: per-sample coefficient
    updates from a cheap tan() polynomial (cutoff < fs/4 after oversampling), 12 or 24 dB
    slopes (two cascaded stages), LP/HP/BP outputs, a tanh drive stage before the filter.
    U7a owns the effect SVF (`SvfTpt.h`); this one is tuned for many voices at 2x.
*/
class SvfTptSynth
{
public:
    enum class Type { lowpass = 0, highpass, bandpass };

    struct Coefficients
    {
        float g = 0.0f, k = 1.0f, a1 = 1.0f, a2 = 0.0f, a3 = 0.0f;
    };

    /**
        `cutoffNormalised` = fc / fs (clamped to < 0.25 so the polynomial tan stays exact
        to 0.2 %), `resonance` in [0, 1] maps to k = 2 (Q 0.5) .. 0.1 (Q 10).
    */
    static Coefficients compute (float cutoffNormalised, float resonance) noexcept
    {
        Coefficients c;
        const auto x = 3.14159265f * (cutoffNormalised < 1.0e-5f ? 1.0e-5f : (cutoffNormalised > 0.245f ? 0.245f : cutoffNormalised));
        const auto x2 = x * x;
        c.g = x * (1.0f + x2 * (0.33333333f + x2 * (0.13333333f + x2 * (0.053968254f + x2 * 0.021869489f))));
        const auto r = resonance < 0.0f ? 0.0f : (resonance > 1.0f ? 1.0f : resonance);
        c.k = 2.0f - 1.9f * r;
        c.a1 = 1.0f / (1.0f + c.g * (c.g + c.k));
        c.a2 = c.g * c.a1;
        c.a3 = c.g * c.a2;
        return c;
    }

    void reset() noexcept
    {
        ic1[0] = ic2[0] = ic1[1] = ic2[1] = 0.0f;
    }

    float process (float in, const Coefficients& c, Type type, bool fourPole) noexcept
    {
        auto out = stage (in, c, type, 0);
        if (fourPole)
            out = stage (out, c, type, 1);
        return out;
    }

private:
    float stage (float in, const Coefficients& c, Type type, int i) noexcept
    {
        const auto v3 = in - ic2[i];
        const auto v1 = c.a1 * ic1[i] + c.a2 * v3;
        const auto v2 = ic2[i] + c.a2 * ic1[i] + c.a3 * v3;
        ic1[i] = 2.0f * v1 - ic1[i];
        ic2[i] = 2.0f * v2 - ic2[i];
        switch (type)
        {
            case Type::lowpass:  return v2;
            case Type::highpass: return in - c.k * v1 - v2;
            case Type::bandpass: return c.k * v1;
        }
        return v2;
    }

    float ic1[2] { 0.0f, 0.0f };
    float ic2[2] { 0.0f, 0.0f };
};

/** Rational tanh, exact within 1 % over the audible drive range; clamps the tails. */
inline float fastTanh (float x) noexcept
{
    x = x < -3.0f ? -3.0f : (x > 3.0f ? 3.0f : x);
    const auto x2 = x * x;
    return x * (27.0f + x2) / (27.0f + 9.0f * x2);
}

} // namespace tatami::dsp
