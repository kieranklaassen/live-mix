#pragma once

#include <cmath>
#include "ModalBank.h"

// Shared pool of fade banks for click-free voice stealing.
//
// JUCE's steal path calls stopNote(0, false) + startNote synchronously with zero
// render time between, so a voice cannot fade itself out before restarting.
// Instead the stolen state is swapped into a pool slot here and rendered by the
// processor with an aggressive radius scale (~3 ms T60), collapsing the tail
// smoothly from its exact sample values. A shared pool (not per-voice banks)
// bounds steal-burst transient cost and survives double-steal of one voice
// within a single ramp.
//
// Timing note: capture happens mid-block inside the synth render; the pool is
// rendered for the full block afterward, so a captured tail can start up to one
// block (< 3 ms) early relative to the steal point. Inaudible on a fading tail.
class GhostPool
{
public:
    static constexpr int kSlots = 8;

    void prepare(double sampleRate) noexcept
    {
        // Radius multiplier giving ~3 ms T60: states fall 60 dB in 3 ms.
        fadeScale = std::exp(-6.907755f / (0.003f * static_cast<float>(sampleRate)));
        lifeSamples = static_cast<int>(0.006 * sampleRate); // render ~6 ms then release the slot
        for (auto& g : ghosts)
            g.active = false;
    }

    void capture(const ModalBank& src, float gainL, float gainR) noexcept
    {
        int slot = -1;
        for (int i = 0; i < kSlots; ++i)
        {
            if (!ghosts[i].active)
            {
                slot = i;
                break;
            }
        }
        if (slot < 0)
        {
            // Evict the ghost furthest through its fade (quietest).
            int oldest = 0;
            for (int i = 1; i < kSlots; ++i)
                if (ghosts[i].elapsed > ghosts[oldest].elapsed)
                    oldest = i;
            slot = oldest;
        }

        auto& g = ghosts[slot];
        g.bank.copyFrom(src);
        g.gainL = gainL;
        g.gainR = gainR;
        g.elapsed = 0;
        g.active = true;
    }

    // Adds fading tails into the stereo bus. Chunks internally so host blocks
    // larger than the scratch size are safe.
    void render(float* left, float* right, int numSamples) noexcept
    {
        static constexpr int kChunk = 2048;
        for (int done = 0; done < numSamples; done += kChunk)
        {
            const int n = (numSamples - done) < kChunk ? (numSamples - done) : kChunk;
            for (auto& g : ghosts)
            {
                if (!g.active)
                    continue;

                std::memset(scratchA, 0, sizeof(float) * static_cast<size_t>(n));
                std::memset(scratchB, 0, sizeof(float) * static_cast<size_t>(n));
                g.bank.process(scratchA, scratchB, nullptr, n, fadeScale);

                for (int s = 0; s < n; ++s)
                {
                    const float v = scratchA[s] + scratchB[s];
                    left[done + s] += v * g.gainL;
                    right[done + s] += v * g.gainR;
                }

                g.elapsed += n;
                if (g.elapsed >= lifeSamples)
                {
                    g.active = false;
                    g.bank.clearStates();
                }
            }
        }
    }

    void reset() noexcept
    {
        for (auto& g : ghosts)
        {
            g.active = false;
            g.bank.clearStates();
        }
    }

private:
    struct Ghost
    {
        ModalBank bank;
        float gainL = 0.0f, gainR = 0.0f;
        int elapsed = 0;
        bool active = false;
    };

    std::array<Ghost, kSlots> ghosts;
    alignas(64) float scratchA[2048] = {};
    alignas(64) float scratchB[2048] = {};
    float fadeScale = 0.95f;
    int lifeSamples = 256;
};
