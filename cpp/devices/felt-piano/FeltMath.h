#pragma once

#include <cmath>
#include <cstdint>

namespace FeltMath
{
// Rational tanh approximation: bounded (|out| <= 1), monotonic, ~identity below |x| ~ 0.3.
// Shared by FDN feedback, sympathetic in-loop limiting, and grit drive.
inline float rationalTanh(float x) noexcept
{
    x = x < -3.0f ? -3.0f : (x > 3.0f ? 3.0f : x);
    return x * (27.0f + x * x) / (27.0f + 9.0f * x * x);
}

// Output safety limiter: EXACTLY linear below |x| = 0.5, smooth bounded soft
// clip above. An always-on tanh is not transparent — its cubic term measured
// as broadband intermodulation 'noise' between the partials at normal levels
// (the -21.6 dB inter-partial floor vs the real piano's -29). Normal playing
// peaks ~0.45 and never touches the knee.
inline float softLimit(float x) noexcept
{
    const float a = x < 0.0f ? -x : x;
    if (a <= 0.5f)
        return x;
    const float over = (a - 0.5f) * 2.0f;
    const float shaped = 0.5f + 0.5f * rationalTanh(over);
    return x < 0.0f ? -shaped : shaped;
}

// exp(-x) for small positive x (radius computation: x = ln(1000)/(T60*fs), typically < 0.05).
// 2nd-order series; relative error < 2e-5 over the working range — no libm call.
inline float fastExpNegSmall(float x) noexcept
{
    return 1.0f - x + 0.5f * x * x;
}

// Tiny deterministic RNG for excitation/velvet noise (note-on and per-sample safe).
struct XorShift32
{
    uint32_t state = 0x9E3779B9u;

    void seed(uint32_t s) noexcept { state = s | 1u; }

    inline uint32_t next() noexcept
    {
        uint32_t x = state;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        state = x;
        return x;
    }

    // Uniform in [-1, 1)
    inline float nextBipolar() noexcept
    {
        return static_cast<float>(static_cast<int32_t>(next())) * (1.0f / 2147483648.0f);
    }

    // Uniform in [0, 1)
    inline float nextUnipolar() noexcept
    {
        return static_cast<float>(next() >> 8) * (1.0f / 16777216.0f);
    }
};
} // namespace FeltMath
