#pragma once

#include <array>
#include "FeltMath.h"

// 8-channel FDN room reverb — the Bloom core extracted as a standalone class.
// Carries over: coprime delays {4799..7789} (44.1k reference, SR-scaled),
// 4 input-diffusion allpasses (Dattorro 0.75/0.625), per-channel free-running
// LFO delay modulation with allpass-interpolated reads, in-loop one-pole LP
// damping, DC blockers, and -9 dB wet headroom.
//
// Deliberately excluded from the extraction (Bloom features, not FDN core):
// SpectralDrifter, channelAge tracking, StereoWidener.
//
// Added for Felt: a rational-tanh limiter in the feedback write path — NEW code
// (Bloom's feedback is linear at fixed gain; Tides' FDN uses std::tanh in the
// same position, which is the structural precedent). Verified bounded and
// monotonic by construction (see FeltMath::rationalTanh).
class FeltReverb
{
public:
    void prepare(double sampleRate);
    void reset();

    // size 0..1 -> RT60 ~0.2..3.0 s. Dark, small-room default lives in the
    // processor's parameter mapping.
    void setSize(float size01) noexcept;

    // Process one stereo sample in place. mix 0..1, equal-power wet/dry
    // (caller smooths mix per sample).
    void processSample(float& left, float& right, float mix) noexcept;

    float getRt60Seconds() const noexcept { return currentRt60; }

private:
    static constexpr int kChannels = 8;
    static constexpr int kMaxDelay = 32768; // power of 2; 7789 * (96k/44.1k) ~ 16960 + mod depth fits
    static constexpr int kDelayMask = kMaxDelay - 1;
    static constexpr int kNumInputAP = 4;
    static constexpr std::array<int, kChannels> kOriginalDelays = {4799, 5399, 5801, 6199,
                                                                   6599, 6997, 7393, 7789};
    static constexpr std::array<int, kNumInputAP> kOriginalApDelays = {142, 107, 379, 277};
    static constexpr float kInputDiffusion1 = 0.75f;
    static constexpr float kInputDiffusion2 = 0.625f;
    static constexpr float kModDepthSamples = 18.0f;
    static constexpr float kOutputHeadroom = 0.35f;

    float processAllpass(float input, float* buffer, int bufferSize,
                         int& writeIdx, int delayLength, float coeff) noexcept;
    float readDelayInterpolated(int channel, float delaySamples) noexcept;
    static void applyHadamard8(const std::array<float, kChannels>& in,
                               std::array<float, kChannels>& out) noexcept;

    std::array<std::array<float, kMaxDelay>, kChannels> delayBuffers{};
    std::array<int, kChannels> baseDelays{};
    std::array<int, kChannels> writeIndices{};
    std::array<float, kChannels> lfoPhases{};
    std::array<float, kChannels> lfoIncrements{};
    std::array<float, kChannels> lpState{};
    std::array<float, kChannels> dcX1{}, dcY1{};
    std::array<float, kChannels> interpState{};
    std::array<std::array<float, 2048>, kNumInputAP> inputApBuffers{};
    std::array<int, kNumInputAP> inputApDelays{};
    std::array<int, kNumInputAP> inputApWriteIdx{};

    float lpCoeff = 0.45f;
    float dcR = 0.995f;
    float feedbackGain = 0.7f;
    float targetFeedbackGain = 0.7f;
    float avgDelaySeconds = 0.13f;
    float currentRt60 = 0.4f;
    float lastSize = -1.0f;
    double fs = 48000.0;
};
