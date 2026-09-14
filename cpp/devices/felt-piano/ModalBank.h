#pragma once

#include <array>
#include <cstring>

// Structure-of-arrays bank of complex one-pole (phasor / Gold-Rader) resonators.
//
// Per mode: complex coefficient a = r * e^(j*theta) stored as (aRe, aIm), complex
// state s. Update per sample: s' = a * s (+ excitation injected into the imaginary
// part). Output is Im(s) weighted per mode into two accumulators (even/odd modes)
// for the odd/even stereo spread.
//
// The coupled form keeps uniform numerical precision across the z-plane (stable
// for A0 at 27.5 Hz in float32) and is unconditionally stable for r < 1.
//
// Layout rules (performance-load-bearing, see plan U2):
// - fixed-capacity 64-byte-aligned member arrays, no heap
// - mode-strip-outer / sample-inner loop, state held in locals across the block
// - runtime damping applied as a radius scale on the *base* coefficients
//   (non-destructive: repedaling restores the original decay exactly)
class ModalBank
{
public:
    static constexpr int kCapacity = 200; // padded mode capacity (SoA arrays)
    static constexpr int kStride = 8;     // strip width (SIMD lanes)

    alignas(64) float aRe[kCapacity] = {};    // base coefficient: r * cos(theta)
    alignas(64) float aIm[kCapacity] = {};    // base coefficient: r * sin(theta)
    alignas(64) float sRe[kCapacity] = {};    // resonator state (real)
    alignas(64) float sIm[kCapacity] = {};    // resonator state (imag)
    alignas(64) float gainA[kCapacity] = {};  // output gain, even-index modes (0 for odd)
    alignas(64) float gainB[kCapacity] = {};  // output gain, odd-index modes (0 for even)
    alignas(64) float inGain[kCapacity] = {}; // excitation injection gain per mode
    alignas(64) int expiry[kCapacity] = {};   // sample count after which this mode is inaudible

    int activeModes = 0; // multiple of kStride; shrunk over the note's life

    void reset() noexcept
    {
        std::memset(sRe, 0, sizeof(sRe));
        std::memset(sIm, 0, sizeof(sIm));
        activeModes = 0;
    }

    void clearStates() noexcept
    {
        std::memset(sRe, 0, sizeof(sRe));
        std::memset(sIm, 0, sizeof(sIm));
    }

    void copyFrom(const ModalBank& other) noexcept
    {
        std::memcpy(this, &other, sizeof(ModalBank));
    }

    // Shrink the active strip count as short-lived (high-index) modes expire.
    // Modes are ordered by partial number so expiry is roughly descending;
    // this is a contiguous counter decrement in stride steps, O(strips) per block.
    void shrinkExpired(int elapsedSamples) noexcept
    {
        while (activeModes > kStride && elapsedSamples > expiry[activeModes - 1])
            activeModes -= kStride;
    }

    // Render numSamples, accumulating into outA (even modes) and outB (odd modes).
    // burst: optional excitation input (nullptr when the hammer burst is exhausted).
    // dampScale: per-sample radius multiplier (1 = natural decay). Applied to the
    // base coefficients on strip load — the bases themselves are never modified.
    //
    // NOTE: the two inner loop bodies below are deliberately duplicated (the
    // only difference is the burst injection term) to keep the hot loop
    // branch-free for SIMD. Any change to the resonator update must be applied
    // to BOTH bodies.
    void process(float* outA, float* outB, const float* burst, int numSamples, float dampScale) noexcept
    {
        for (int m = 0; m < activeModes; m += kStride)
        {
            float cr[kStride], ci[kStride], xr[kStride], xi[kStride];
            float ga[kStride], gb[kStride], gi[kStride];

            for (int k = 0; k < kStride; ++k)
            {
                cr[k] = aRe[m + k] * dampScale;
                ci[k] = aIm[m + k] * dampScale;
                xr[k] = sRe[m + k];
                xi[k] = sIm[m + k];
                ga[k] = gainA[m + k];
                gb[k] = gainB[m + k];
                gi[k] = inGain[m + k];
            }

            if (burst != nullptr)
            {
                for (int s = 0; s < numSamples; ++s)
                {
                    const float x = burst[s];
                    float sumA = 0.0f, sumB = 0.0f;
                    for (int k = 0; k < kStride; ++k)
                    {
                        const float nr = cr[k] * xr[k] - ci[k] * xi[k];
                        const float ni = ci[k] * xr[k] + cr[k] * xi[k] + x * gi[k];
                        xr[k] = nr;
                        xi[k] = ni;
                        sumA += ni * ga[k];
                        sumB += ni * gb[k];
                    }
                    outA[s] += sumA;
                    outB[s] += sumB;
                }
            }
            else
            {
                for (int s = 0; s < numSamples; ++s)
                {
                    float sumA = 0.0f, sumB = 0.0f;
                    for (int k = 0; k < kStride; ++k)
                    {
                        const float nr = cr[k] * xr[k] - ci[k] * xi[k];
                        const float ni = ci[k] * xr[k] + cr[k] * xi[k];
                        xr[k] = nr;
                        xi[k] = ni;
                        sumA += ni * ga[k];
                        sumB += ni * gb[k];
                    }
                    outA[s] += sumA;
                    outB[s] += sumB;
                }
            }

            for (int k = 0; k < kStride; ++k)
            {
                sRe[m + k] = xr[k];
                sIm[m + k] = xi[k];
            }
        }
    }
};
