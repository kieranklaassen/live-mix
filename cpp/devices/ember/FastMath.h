#pragma once

#include <cmath>
#include <cstdint>
#include <cstring>

namespace tatami::dsp
{

/**
    2^x with a degree-6 polynomial on the fraction and an exponent-field shift: relative
    error < 3e-7, i.e. below 0.001 cents when used for pitch, exact at integers. Valid for
    x in [-126, 127].
*/
inline float fastExp2 (float x) noexcept
{
    x = x < -126.0f ? -126.0f : (x > 127.0f ? 127.0f : x);
    const auto fl = std::floor (x);
    // Integers (unison centre, octaves, the root note) come out exact.
    const auto g = x - fl - 0.5f;
    const auto p = g <= -0.5f
                     ? 1.0f
                     // Taylor series of 2^g around g = 0 for g = f - 0.5 in [-0.5, 0.5), scaled by sqrt(2):
                     // truncation error below 1.3e-7.
                     : 1.41421356f * (1.0f + g * (0.69314718f + g * (0.24022651f + g * (0.055504109f + g * (0.0096181291f + g * (0.0013333558f + g * 0.00015403530f))))));
    uint32_t bits;
    std::memcpy (&bits, &p, sizeof (bits));
    bits += (uint32_t) ((int32_t) fl << 23);
    float result;
    std::memcpy (&result, &bits, sizeof (result));
    return result;
}

/** Exact float comparison without the -Wfloat-equal noise (intentional for flags such as "amount is off"). */
inline bool isZero (float x) noexcept { return ! (x < 0.0f || x > 0.0f); }

inline bool sameFloat (float a, float b) noexcept { return ! (a < b || a > b); }

inline float semitonesToRatio (float semitones) noexcept { return fastExp2 (semitones * (1.0f / 12.0f)); }

inline float midiNoteToHz (float note) noexcept { return 440.0f * fastExp2 ((note - 69.0f) * (1.0f / 12.0f)); }

inline float dbToGain (float db) noexcept { return fastExp2 (db * 0.16609640f); }

/** Symmetric soft clip: linear below 0.5, tanh-like knee to 1.0. */
inline float softClip (float x) noexcept
{
    const auto a = x < 0.0f ? -x : x;
    if (a <= 0.5f)
        return x;
    const auto t = (a - 0.5f) * 2.0f;                 // 0..∞ past the knee
    const auto shaped = 0.5f + 0.5f * (t < 3.0f ? t * (27.0f + t * t) / (27.0f + 9.0f * t * t) : 1.0f);
    return x < 0.0f ? -shaped : shaped;
}

/** Tiny xorshift for noise sources; never allocates, deterministic per seed. */
struct XorShift32
{
    uint32_t state = 0x2545F491u;

    void seed (uint32_t s) noexcept { state = s == 0 ? 0x2545F491u : s; }

    uint32_t nextU32() noexcept
    {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        return state;
    }

    /** Uniform in [-1, 1). */
    float nextBipolar() noexcept { return (float) (nextU32() & 0xFFFFFFu) / 8388608.0f - 1.0f; }
};

} // namespace tatami::dsp
