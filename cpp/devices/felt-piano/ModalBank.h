#pragma once

#include <array>
#include <cstring>

#if defined(__wasm_simd128__)
#include <wasm_simd128.h>
#endif

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
    // Where there are vectors the strips go through processVectors below, which
    // does the same operations on the same numbers in the same order: what it
    // puts out is the same to the last bit, and the loop here is what it is
    // held to.
    //
    // NOTE: the two inner loop bodies below are deliberately duplicated (the
    // only difference is the burst injection term) to keep the hot loop
    // branch-free for SIMD. Any change to the resonator update must be applied
    // to BOTH bodies.
    void process(float* outA, float* outB, const float* burst, int numSamples, float dampScale) noexcept
    {
#if defined(__wasm_simd128__)
        processVectors(outA, outB, burst, numSamples, dampScale);
#else
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
#endif
    }

#if defined(__wasm_simd128__)
private:
    static constexpr int kLanes = 4;
    static constexpr int kMaxVectorChunk = 128;
    // The most vectors that go through a chunk together: two strips. One
    // strip's samples wait for each other, two fill the time.
    static constexpr int kMaxTogether = 4;

    template <int kTogether, bool kBurst>
    void runStrips(int m, float* mixed, const float* burst, int numSamples, float dampScale) noexcept
    {
        v128_t cr[kTogether], ci[kTogether], xr[kTogether], xi[kTogether], g[kTogether], gi[kTogether];
        const v128_t scale = wasm_f32x4_splat(dampScale);
        for (int v = 0; v < kTogether; ++v)
        {
            const int at = m + v * kLanes;
            cr[v] = wasm_f32x4_mul(wasm_v128_load(aRe + at), scale);
            ci[v] = wasm_f32x4_mul(wasm_v128_load(aIm + at), scale);
            xr[v] = wasm_v128_load(sRe + at);
            xi[v] = wasm_v128_load(sIm + at);
            // A mode has one gain of the two, and which by its place: even A, odd B.
            g[v] = wasm_f32x4_add(wasm_v128_load(gainA + at), wasm_v128_load(gainB + at));
            gi[v] = wasm_v128_load(inGain + at);
        }
        // Two samples at a time: the sums run over pairs of modes, [A B] of the
        // first sample beside [A B] of the second.
        int s = 0;
        for (; s + 2 <= numSamples; s += 2)
        {
            v128_t first[kTogether], second[kTogether];
            for (int v = 0; v < kTogether; ++v) first[v] = step<kBurst>(cr[v], ci[v], xr[v], xi[v], g[v], gi[v], burst, s);
            for (int v = 0; v < kTogether; ++v) second[v] = step<kBurst>(cr[v], ci[v], xr[v], xi[v], g[v], gi[v], burst, s + 1);
            v128_t total = wasm_v128_load(mixed + 2 * s);
            for (int v = 0; v < kTogether; v += 2)
            {
                const v128_t sum = wasm_f32x4_add(
                    wasm_f32x4_add(wasm_f32x4_add(lows(first[v], second[v]), highs(first[v], second[v])),
                                   lows(first[v + 1], second[v + 1])),
                    highs(first[v + 1], second[v + 1]));
                total = wasm_f32x4_add(total, sum);
            }
            wasm_v128_store(mixed + 2 * s, total);
        }
        if (s < numSamples)
        {
            for (int v = 0; v < kTogether; v += 2)
            {
                const v128_t lo = step<kBurst>(cr[v], ci[v], xr[v], xi[v], g[v], gi[v], burst, s);
                const v128_t hi = step<kBurst>(cr[v + 1], ci[v + 1], xr[v + 1], xi[v + 1], g[v + 1], gi[v + 1], burst, s);
                const v128_t sum = wasm_f32x4_add(
                    wasm_f32x4_add(wasm_f32x4_add(lo, highs(lo, lo)), hi), highs(hi, hi));
                mixed[2 * s] += wasm_f32x4_extract_lane(sum, 0);
                mixed[2 * s + 1] += wasm_f32x4_extract_lane(sum, 1);
            }
        }
        for (int v = 0; v < kTogether; ++v)
        {
            wasm_v128_store(sRe + m + v * kLanes, xr[v]);
            wasm_v128_store(sIm + m + v * kLanes, xi[v]);
        }
    }

    static v128_t lows(v128_t a, v128_t b) noexcept { return wasm_i32x4_shuffle(a, b, 0, 1, 4, 5); }
    static v128_t highs(v128_t a, v128_t b) noexcept { return wasm_i32x4_shuffle(a, b, 2, 3, 6, 7); }

    // One sample of four modes: what they put out.
    template <bool kBurst>
    static v128_t step(v128_t cr, v128_t ci, v128_t& xr, v128_t& xi, v128_t g, v128_t gi,
                       const float* burst, int s) noexcept
    {
        const v128_t nr = wasm_f32x4_sub(wasm_f32x4_mul(cr, xr), wasm_f32x4_mul(ci, xi));
        v128_t ni = wasm_f32x4_add(wasm_f32x4_mul(ci, xr), wasm_f32x4_mul(cr, xi));
        if constexpr (kBurst) ni = wasm_f32x4_add(ni, wasm_f32x4_mul(wasm_v128_load32_splat(burst + s), gi));
        xr = nr;
        xi = ni;
        return wasm_f32x4_mul(ni, g);
    }

    void processVectors(float* outA, float* outB, const float* burst, int numSamples, float dampScale) noexcept
    {
        alignas(16) float mixed[2 * kMaxVectorChunk];
        for (int done = 0; done < numSamples; done += kMaxVectorChunk)
        {
            const int n = numSamples - done < kMaxVectorChunk ? numSamples - done : kMaxVectorChunk;
            for (int s = 0; s < n; ++s)
            {
                mixed[2 * s] = outA[done + s];
                mixed[2 * s + 1] = outB[done + s];
            }
            int m = 0;
            const float* in = burst != nullptr ? burst + done : nullptr;
            for (; m + 2 * kStride <= activeModes; m += 2 * kStride)
            {
                if (in != nullptr) runStrips<kMaxTogether, true>(m, mixed, in, n, dampScale);
                else runStrips<kMaxTogether, false>(m, mixed, in, n, dampScale);
            }
            if (m < activeModes)
            {
                if (in != nullptr) runStrips<2, true>(m, mixed, in, n, dampScale);
                else runStrips<2, false>(m, mixed, in, n, dampScale);
            }
            for (int s = 0; s < n; ++s)
            {
                outA[done + s] = mixed[2 * s];
                outB[done + s] = mixed[2 * s + 1];
            }
        }
    }
#endif
};
