#pragma once

#include <array>
#include "FeltMath.h"

// Global bus-level sympathetic resonance: a fixed bank of Karplus-Strong
// strings (Thiran fractional delay, in-loop damping, DC blocker, rational-tanh
// safety clip — the validated Sympathetic/TunedCombFilter design) fed by the
// summed voice output at low gain.
//
// Contract (plan R9): processes ADDITIVELY in place — the dry bus always passes
// through untouched; the bank only adds its return scaled by the resonance
// amount, so amount = 0 is bit-transparent. Pedal state opens string damping:
// long ring when down, heavily damped (faint struck-string coupling) when up.
// One bank regardless of voice count — cost is constant.
class SympatheticBank
{
public:
    static constexpr int kNumStrings = 12;
    static constexpr int kMaxDelay = 4096; // lowest string A1 (55 Hz) at 96 kHz
    static constexpr int kDelayMask = kMaxDelay - 1;

    void prepare(double sampleRate);
    void reset();

    // cc64 normalized 0..1 (continuous); amount 0..1.
    void setPedal(float cc64Norm) noexcept { cc64 = cc64Norm; }
    void setAmount(float amountNorm) noexcept { amount = amountNorm; }

    // Call once per block before processing samples: updates per-string decay
    // coefficients only when the pedal value actually moved (todos/006 lesson:
    // never per-sample, and cache on change).
    void updateBlockRate();

    // Adds the bank's stereo return to left/right. inMono is the bus mono sum.
    inline void processAdd(float inMono, float& left, float& right) noexcept
    {
        if (amount <= 0.0001f)
        {
            // Gated: clear ringing state once so a stale ring can't replay
            // ("zombie resonance") when the amount is raised again later.
            if (statesLive)
            {
                clearStringStates();
                statesLive = false;
            }
            return;
        }
        statesLive = true;

        const float drive = inMono * 0.22f;
        float sumL = 0.0f, sumR = 0.0f;

        for (int i = 0; i < kNumStrings; ++i)
        {
            auto& s = strings[i];

            const int readIndex = (s.writeIndex - s.delayLength + kMaxDelay) & kDelayMask;
            const int readIndexM1 = (readIndex - 1 + kMaxDelay) & kDelayMask;
            const float y0 = s.buffer[readIndex];
            const float y1 = s.buffer[readIndexM1];

            // Thiran first-order allpass interpolation (sub-sample tuning).
            const float interpolated = s.allpassCoeff * y0 + y1 - s.allpassCoeff * s.allpassState;
            s.allpassState = interpolated;

            // In-loop one-pole damping (coefficient SR-derived in prepare —
            // a fixed per-sample constant would double the cutoff at 96 kHz).
            s.dampState = dampCoeff * interpolated + (1.0f - dampCoeff) * s.dampState;

            // Feedback with rational-tanh safety clip (bounded loop energy).
            float fb = drive + s.dampState * s.feedback;
            fb = FeltMath::rationalTanh(fb);

            // DC blocker.
            const float dcBlocked = fb - s.dcX1 + 0.995f * s.dcY1;
            s.dcX1 = fb;
            s.dcY1 = dcBlocked;

            s.buffer[s.writeIndex] = dcBlocked;
            s.writeIndex = (s.writeIndex + 1) & kDelayMask;

            sumL += interpolated * s.panL;
            sumR += interpolated * s.panR;
        }

        const float g = amount * 0.5f;
        left += sumL * g;
        right += sumR * g;
    }

private:
    struct KString
    {
        std::array<float, kMaxDelay> buffer{};
        int writeIndex = 0;
        int delayLength = 100;
        float allpassCoeff = 0.0f;
        float allpassState = 0.0f;
        float dampState = 0.0f;
        float feedback = 0.0f;
        float dcX1 = 0.0f, dcY1 = 0.0f;
        float panL = 0.7f, panR = 0.7f;
    };

    void clearStringStates() noexcept
    {
        for (auto& s : strings)
        {
            s.buffer.fill(0.0f);
            s.allpassState = 0.0f;
            s.dampState = 0.0f;
            s.dcX1 = s.dcY1 = 0.0f;
        }
    }

    std::array<KString, kNumStrings> strings;
    float sampleRate = 48000.0f;
    float dampCoeff = 0.35f; // SR-derived in prepare (~3.3 kHz one-pole)
    float cc64 = 0.0f;
    float amount = 0.5f;
    float lastAppliedCc64 = -1.0f;
    bool statesLive = false;
};
