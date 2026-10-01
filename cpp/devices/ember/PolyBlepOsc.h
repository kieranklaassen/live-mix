#pragma once

#include <cmath>

namespace tatami::dsp
{

/**
    Anti-aliased oscillator: 2-point PolyBLEP for the saw and pulse edges, PolyBLAMP for the
    triangle corners, plain sine. Phase is kept in [0, 1). Hard sync resets the phase to the
    master's fractional overshoot and replaces the wrap BLEP by one sized to the actual jump,
    so the reset itself does not alias. Only the "after the edge" half of the residual can be
    applied without a delay; Ember runs at 2x so the missing half stays inaudible.
    The pulse is centred on zero at every width (the source's is +-1 whatever the width,
    which carries 2 pw - 1 of DC); what is heard is the same wave.
*/
class PolyBlepOsc
{
public:
    enum class Shape { saw = 0, pulse, triangle, sine };

    void reset (float initialPhase = 0.0f) noexcept
    {
        phase = initialPhase;
        wrapped = false;
        wrapFraction = 0.0f;
    }

    /** True if the last `next()` crossed the period boundary; `syncFraction()` says how long ago (0..1 samples). */
    bool didWrap() const noexcept { return wrapped; }
    float syncFraction() const noexcept { return wrapFraction; }

    /**
        Advances by `inc` (frequency / sample rate) and returns the sample. `pulseWidth` in
        (0, 1) shapes the pulse; `hardSyncAt` >= 0 restarts the phase as if it had reset that
        fraction of a sample ago (the master's `syncFraction()`), -1 = no sync.
    */
    float next (float inc, Shape shape, float pulseWidth = 0.5f, float hardSyncAt = -1.0f) noexcept
    {
        inc = inc < 1.0e-7f ? 1.0e-7f : (inc > 0.49f ? 0.49f : inc);

        phase += inc;
        wrapped = false;
        if (phase >= 1.0f)
        {
            phase -= 1.0f;
            wrapped = true;
            wrapFraction = phase / inc;
        }

        // Height of the step at phase 0 in BLEP units (a unit BLEP is a step of 2).
        float edgeAtZero = shape == Shape::saw ? -1.0f : (shape == Shape::pulse ? 1.0f : 0.0f);

        if (hardSyncAt >= 0.0f && shape != Shape::sine)
        {
            const auto before = naive (phase, shape, pulseWidth);
            phase = hardSyncAt * inc;
            const auto after = naive (phase, shape, pulseWidth);
            edgeAtZero = 0.5f * (after - before);
            wrapped = true;
            wrapFraction = hardSyncAt;
        }

        switch (shape)
        {
            case Shape::saw:
                return naive (phase, shape, pulseWidth) + edgeAtZero * blep (phase, inc);
            case Shape::pulse:
                // Less its own mean: a pulse that is high for `pulseWidth` of the cycle sits at
                // 2 pw - 1 on average, a DC offset as soon as the width leaves the middle (and
                // a sub-audio swing when an LFO moves the width).
                return naive (phase, shape, pulseWidth) + edgeAtZero * blep (phase, inc) - blep (wrap (phase + 1.0f - pulseWidth), inc)
                       - (2.0f * pulseWidth - 1.0f);
            case Shape::triangle:
                return naive (phase, shape, pulseWidth)
                       + 8.0f * inc * (blamp (phase, inc) - blamp (wrap (phase + 0.5f), inc))
                       + edgeAtZero * blep (phase, inc);
            case Shape::sine:
                return std::sin (phase * kTwoPi);
        }
        return 0.0f;
    }

    float currentPhase() const noexcept { return phase; }

private:
    static constexpr float kTwoPi = 6.283185307179586f;

    static float wrap (float t) noexcept { return t >= 1.0f ? t - 1.0f : t; }

    static float naive (float t, Shape shape, float pw) noexcept
    {
        switch (shape)
        {
            case Shape::saw:      return 2.0f * t - 1.0f;
            case Shape::pulse:    return t < pw ? 1.0f : -1.0f;
            case Shape::triangle: return t < 0.5f ? 4.0f * t - 1.0f : 3.0f - 4.0f * t;
            case Shape::sine:     return std::sin (t * kTwoPi);
        }
        return 0.0f;
    }

    /** 2-point PolyBLEP residual for a rising step of height 2 at phase 0. */
    static float blep (float t, float dt) noexcept
    {
        if (t < dt)
        {
            t /= dt;
            return t + t - t * t - 1.0f;
        }
        if (t > 1.0f - dt)
        {
            t = (t - 1.0f) / dt;
            return t * t + t + t + 1.0f;
        }
        return 0.0f;
    }

    /** 2-point PolyBLAMP residual for a unit slope increase (per sample) at phase 0. */
    static float blamp (float t, float dt) noexcept
    {
        if (t < dt)
        {
            t = 1.0f - t / dt;
            return t * t * t / 6.0f;
        }
        if (t > 1.0f - dt)
        {
            t = (t - 1.0f) / dt + 1.0f;
            return t * t * t / 6.0f;
        }
        return 0.0f;
    }

    float phase = 0.0f;
    bool wrapped = false;
    float wrapFraction = 0.0f;
};

} // namespace tatami::dsp
