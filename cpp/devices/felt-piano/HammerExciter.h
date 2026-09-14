#pragma once

#include <cmath>
#include <cstring>
#include "FeltMath.h"

// Hammer excitation calibrated against measured piano data.
//
// The excitation is a HALF-SINE pulse (the measured hammer force shape) whose
// duration tracks the physical contact time (Askenfelt & Jansson): ~4 ms at
// A1, ~1.5 ms at A4, ~0.3 ms at C8 at mf; ~20% shorter at ff / longer at pp;
// hardness shortens/extends contact (which is physically what hammer hardness
// does); the felt strip extends it 2-4x. The pulse duration IS the lowpass —
// flat to ~0.45/tau then -12 dB/oct — so velocity brightening and felt
// darkening come out of the physics rather than a fitted filter. The rendered
// pulse is shorter than the force contact time (x0.32) because the injection
// approximates string VELOCITY (force x admittance), whose spectrum is
// flatter; the scale was tuned so A4 at mf measures the published -9..-12
// dB/oct partial profile (p2 ~ -4 dB, p8 ~ -40 dB re p1).
//
// Velocity: level ~ v^1.5 (~35 dB pp->ff, matching a real action; p8 rises
// ~15 dB re p1 from pp to ff per Askenfelt); the felt strip compresses both
// the dynamic range and the achievable ff (a felt piano's fortissimo is a
// normal piano's mezzo-forte).
class HammerExciter
{
public:
    static constexpr int kMaxBurst = 2048; // ~21 ms at 96 kHz

    void prepare(double sampleRate) noexcept
    {
        fs = static_cast<float>(sampleRate);
        remaining = 0;
    }

    void seed(uint32_t s) noexcept { rng.seed(s); }

    void trigger(int midiNote, float velocity, float felt, float hardness, bool softPedal) noexcept
    {
        const float f0 = 440.0f * std::exp2(static_cast<float>(midiNote - 69) / 12.0f);

        // Contact time: tau(f0, mf) ~ 4 ms * sqrt(55/f0); +-20% with velocity
        // (shorter = brighter at ff); HARDNESS shortens/extends contact (that
        // is physically what hammer hardness does); the felt strip extends it
        // 2-4x. The pulse's spectral corner comes out of its duration — there
        // is no separate tone filter; stacking one doubled the rolloff to
        // -30 dB/oct and buried the partials (measured against the -9..-12
        // dB/oct profile of a real mf piano).
        float tauMs = 4.0f * std::sqrt(55.0f / f0);
        // Velocity swing on the EFFECTIVE pulse: measured contact time varies
        // only +-20%, but the nonlinear felt stiffening sharpens the force
        // peak so the ff spectrum is far brighter than duration alone implies.
        // Reference ff layers are near-flat to partial ~7; pp is very dark
        // (research: pp ~ -15 dB/oct, ff ~ -6). 1.45-1.2v spans that range.
        tauMs *= (1.45f - 1.2f * velocity);
        tauMs *= (1.55f - 1.15f * hardness);
        tauMs *= (1.0f + 2.6f * felt);
        if (softPedal)
            tauMs *= 1.25f;
        // The injection approximates string VELOCITY (force x admittance),
        // whose spectrum is flatter than the force pulse — model by rendering
        // a shorter effective pulse than the measured force contact time.
        // The flattening is STRONGER on heavy bass strings (higher impedance):
        // the real C2 ff profile stays near-flat to partial ~11, which pure
        // contact duration cannot produce — scale the effective pulse down
        // with falling f0 below A4.
        float admit = 0.68f;
        if (f0 < 440.0f)
            admit *= std::pow(f0 / 440.0f, 0.35f);
        tauMs *= admit;
        if (tauMs < 0.2f)
            tauMs = 0.2f;
        if (tauMs > 16.0f)
            tauMs = 16.0f;

        int n = static_cast<int>(tauMs * 0.001f * fs);
        if (n < 6)
            n = 6;
        if (n > kMaxBurst)
            n = kMaxBurst;

        // Level: v^1.5 gives ~35 dB of dynamic range; felt compresses the
        // range and caps the top (vEff) and drops overall level.
        const float vEff = velocity * (1.0f - 0.45f * felt) + 0.18f * felt;
        float level = std::pow(vEff, 1.5f - 0.5f * felt) * 4.0f / std::sqrt(static_cast<float>(n));
        // Keep the injected mode amplitude (~ n * level) sample-rate invariant:
        // without this the tone runs ~3 dB hotter at 96 kHz and the
        // tone/noise balance drifts with the session rate.
        level *= std::sqrt(48000.0f / fs);
        if (softPedal)
            level *= 0.75f;

        // HALF-SINE force pulse (the measured hammer pulse shape): -12 dB/oct
        // asymptotic spectral rolloff. (A raised-cosine/Hann pulse falls at
        // -18 dB/oct and measured ~15 dB too dark by partial 8.) Plus a touch
        // of felt-cloth noise, lowpassed by a fixed gentle pole so it stays
        // texture, not hiss — and stays sample-rate consistent.
        // Noise-to-pulse ratio is SR-dependent for per-sample noise (the pulse
        // sum grows with n, the noise sum with sqrt(n)) — rescale to keep the
        // felt texture constant across rates.
        const float noiseAmt = (0.03f + 0.15f * felt) * std::sqrt(fs / 48000.0f);
        const float noiseLpC = 1.0f - std::exp(-6.2831853f * 2500.0f / fs);
        float nlp = 0.0f;
        const float phaseInc = 3.1415927f / static_cast<float>(n);
        float phase = 0.0f;
        // Endpoint taper (~12% each side): the raw half-sine has derivative
        // discontinuities whose aliased tail is sample-rate dependent (48 kHz
        // renders audibly brighter than 96 kHz from fold-back alone). A felt
        // hammer's force pulse has no corners.
        const int taper = n / 8 + 1;
        for (int i = 0; i < n; ++i)
        {
            float win = std::sin(phase);
            phase += phaseInc;
            if (i < taper)
                win *= 0.5f - 0.5f * std::cos(3.1415927f * static_cast<float>(i) / static_cast<float>(taper));
            else if (i >= n - taper)
                win *= 0.5f - 0.5f * std::cos(3.1415927f * static_cast<float>(n - 1 - i) / static_cast<float>(taper));
            nlp += noiseLpC * (rng.nextBipolar() - nlp);
            const float src = 1.0f + nlp * noiseAmt;
            buffer[i] = src * win * level;
        }

        length = n;
        remaining = n;
        readPos = 0;
    }

    // Returns pointer to the next chunk of burst samples (up to numSamples), or
    // nullptr when exhausted. count receives the chunk length.
    const float* nextChunk(int numSamples, int& count) noexcept
    {
        if (remaining <= 0)
        {
            count = 0;
            return nullptr;
        }
        count = remaining < numSamples ? remaining : numSamples;
        const float* p = buffer + readPos;
        readPos += count;
        remaining -= count;
        return p;
    }

    bool isActive() const noexcept { return remaining > 0; }

private:
    FeltMath::XorShift32 rng;
    alignas(64) float buffer[kMaxBurst] = {};
    float fs = 48000.0f;
    int length = 0, remaining = 0, readPos = 0;
};
