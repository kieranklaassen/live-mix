#pragma once

#include <cmath>
#include "FeltMath.h"

// Sparse-impulse (velvet) noise burst, bandpass-shaped via two one-pole lowpasses.
// Used for the three mechanical layers: hammer thump (~80-400 Hz, voice-scoped),
// key action ticks (faint, wider band, voice-scoped), and damper/pedal felt
// (darker, longer, processor-owned). Computationally trivial, fully parametric —
// the mechanical character is the parameter set, not samples.
class VelvetBurst
{
public:
    void prepare(double sampleRate) noexcept
    {
        fs = static_cast<float>(sampleRate);
        active = false;
        lpLow = lpHigh = lpHigh2 = 0.0f;
    }

    void seed(uint32_t s) noexcept { rng.seed(s); }

    // durationMs: burst length. densityHz: impulses per second.
    // amp: peak impulse amplitude. lowHz/highHz: bandpass corners (lowHz < highHz).
    // highEndHz (optional): sweep the high corner toward this over the burst —
    // a real strike splash starts bright (~8-10 kHz) and darkens to ~1 kHz
    // within ~30 ms (STN attack analysis).
    void trigger(float durationMs, float densityHz, float ampIn,
                 float lowHz, float highHz, float highEndHz = 0.0f) noexcept
    {
        totalSamples = static_cast<int>(durationMs * 0.001f * fs);
        if (totalSamples < 8)
            totalSamples = 8;
        elapsed = 0;
        amp = ampIn;
        envCoeff = std::exp(-3.0f / static_cast<float>(totalSamples));
        env = 1.0f;

        gridSamples = fs / densityHz;
        if (gridSamples < 2.0f)
            gridSamples = 2.0f;
        countdown = static_cast<int>(gridSamples * rng.nextUnipolar());

        // One-pole coefficients: y += c * (x - y). Bandpass = LP(high)^2 - LP(low):
        // the high edge is a two-pole cascade (12 dB/oct) so the perceived band
        // stays sample-rate consistent — a single pole's skirt leaks ultrasonics
        // at 96 kHz and brightens the layer.
        coeffHigh = onePoleCoeff(highHz);
        coeffLow = onePoleCoeff(lowHz);

        // Compensate the cascade's impulse attenuation so ampIn reads as the
        // perceived peak (double one-pole impulse response peaks ~ 0.37 * c),
        // then normalize per-impulse in-band energy across sample rates (the
        // compensation alone doubles velvet energy at 96 kHz).
        const float c = coeffHigh < 0.02f ? 0.02f : coeffHigh;
        amp /= (0.37f * c);
        amp *= std::sqrt(48000.0f / fs);

        // Short attack ramp (first ~18% of the burst): a real strike's noise
        // builds with the contact, it doesn't step on — and an instant-on
        // splash out-peaks the tone and reads as a click.
        attackSamples = totalSamples / 6 + 1;

        // Optional darkening sweep of the high corner over the burst.
        if (highEndHz > 0.0f && highEndHz < highHz)
        {
            const float coeffEnd = onePoleCoeff(highEndHz);
            coeffHighRate = std::pow(coeffEnd / coeffHigh, 1.0f / static_cast<float>(totalSamples));
        }
        else
        {
            coeffHighRate = 1.0f;
        }
        active = true;
    }

    inline float process() noexcept
    {
        float x = 0.0f;
        if (active)
        {
            if (--countdown <= 0)
            {
                float a = (rng.next() & 1u ? amp : -amp) * env;
                if (elapsed < attackSamples)
                    a *= static_cast<float>(elapsed) / static_cast<float>(attackSamples);
                x = a;
                countdown = static_cast<int>(gridSamples * (0.5f + rng.nextUnipolar()));
            }
            env *= envCoeff;
            coeffHigh *= coeffHighRate; // brightness sweep (1.0 = static)
            if (++elapsed >= totalSamples)
                active = false;
        }
        // Bandpass shaping runs even after the burst ends so the filters ring out.
        lpHigh += coeffHigh * (x - lpHigh);
        lpHigh2 += coeffHigh * (lpHigh - lpHigh2);
        lpLow += coeffLow * (lpHigh2 - lpLow);
        return lpHigh2 - lpLow;
    }

    bool isActive() const noexcept { return active || std::abs(lpHigh2 - lpLow) > 1.0e-7f; }

private:
    float onePoleCoeff(float hz) const noexcept
    {
        const float c = 1.0f - std::exp(-6.2831853f * hz / fs);
        return c > 1.0f ? 1.0f : c;
    }

    FeltMath::XorShift32 rng;
    float fs = 48000.0f;
    float amp = 0.0f, env = 1.0f, envCoeff = 0.999f;
    float gridSamples = 100.0f;
    float coeffHigh = 0.1f, coeffLow = 0.01f;
    float coeffHighRate = 1.0f;
    float lpHigh = 0.0f, lpHigh2 = 0.0f, lpLow = 0.0f;
    int countdown = 0, elapsed = 0, totalSamples = 0, attackSamples = 1;
    bool active = false;
};
