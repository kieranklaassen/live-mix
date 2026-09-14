#include "FeltReverb.h"
#include <cmath>

void FeltReverb::prepare(double sampleRate)
{
    fs = sampleRate;
    const float ratio = static_cast<float>(sampleRate) / 44100.0f;

    float totalDelay = 0.0f;
    for (int i = 0; i < kChannels; ++i)
    {
        baseDelays[i] = static_cast<int>(static_cast<float>(kOriginalDelays[i]) * ratio);
        if (baseDelays[i] > kMaxDelay - 64)
            baseDelays[i] = kMaxDelay - 64;
        totalDelay += static_cast<float>(baseDelays[i]);

        // Free-running LFOs, golden-ratio phase spacing (anti-metallic, never reset).
        lfoPhases[i] = std::fmod(static_cast<float>(i) * 0.618033988f, 1.0f);
        const float rate = 0.1f + static_cast<float>(i) * 0.025f; // 0.1-0.275 Hz
        lfoIncrements[i] = rate / static_cast<float>(sampleRate);
    }
    avgDelaySeconds = (totalDelay / static_cast<float>(kChannels)) / static_cast<float>(sampleRate);

    for (int i = 0; i < kNumInputAP; ++i)
    {
        inputApDelays[i] = static_cast<int>(static_cast<float>(kOriginalApDelays[i]) * ratio);
        if (inputApDelays[i] > 2047)
            inputApDelays[i] = 2047;
    }

    reset();
    setSize(0.3f);
    feedbackGain = targetFeedbackGain;
}

void FeltReverb::reset()
{
    for (auto& b : delayBuffers)
        b.fill(0.0f);
    for (auto& b : inputApBuffers)
        b.fill(0.0f);
    writeIndices.fill(0);
    inputApWriteIdx.fill(0);
    lpState.fill(0.0f);
    dcX1.fill(0.0f);
    dcY1.fill(0.0f);
    interpState.fill(0.0f);
}

void FeltReverb::setSize(float size01) noexcept
{
    size01 = size01 < 0.0f ? 0.0f : (size01 > 1.0f ? 1.0f : size01);
    if (std::abs(size01 - lastSize) < 1.0e-4f)
        return; // skip the per-block pow when the knob hasn't moved
    lastSize = size01;
    currentRt60 = 0.2f + 2.8f * size01;
    // feedback^(rt60/avgDelay) = 0.001 (-60 dB)
    targetFeedbackGain = std::pow(0.001f, avgDelaySeconds / currentRt60);
}

float FeltReverb::processAllpass(float input, float* buffer, int bufferSize,
                                 int& writeIdx, int delayLength, float coeff) noexcept
{
    int readIdx = writeIdx - delayLength;
    if (readIdx < 0)
        readIdx += bufferSize;
    const float delayed = buffer[readIdx];
    const float output = -coeff * input + delayed;
    buffer[writeIdx] = input + coeff * delayed;
    if (++writeIdx >= bufferSize)
        writeIdx = 0;
    return output;
}

float FeltReverb::readDelayInterpolated(int channel, float delaySamples) noexcept
{
    const int intDelay = static_cast<int>(delaySamples);
    const float frac = delaySamples - static_cast<float>(intDelay);

    const int readIdx = (writeIndices[channel] - intDelay + kMaxDelay) & kDelayMask;
    const int readIdxM1 = (readIdx - 1 + kMaxDelay) & kDelayMask;

    const float y0 = delayBuffers[channel][static_cast<size_t>(readIdx)];
    const float y1 = delayBuffers[channel][static_cast<size_t>(readIdxM1)];

    // Thiran first-order allpass interpolation — avoids chorusing artifacts.
    const float coeff = (1.0f - frac) / (1.0f + frac);
    const float output = y1 + coeff * (y0 - interpState[channel]);
    interpState[channel] = output;
    return output;
}

void FeltReverb::applyHadamard8(const std::array<float, kChannels>& in,
                                std::array<float, kChannels>& out) noexcept
{
    const float a0 = in[0] + in[4], a1 = in[1] + in[5];
    const float a2 = in[2] + in[6], a3 = in[3] + in[7];
    const float a4 = in[0] - in[4], a5 = in[1] - in[5];
    const float a6 = in[2] - in[6], a7 = in[3] - in[7];

    const float b0 = a0 + a2, b1 = a1 + a3;
    const float b2 = a0 - a2, b3 = a1 - a3;
    const float b4 = a4 + a6, b5 = a5 + a7;
    const float b6 = a4 - a6, b7 = a5 - a7;

    constexpr float scale = 0.353553391f; // 1/sqrt(8)
    out[0] = (b0 + b1) * scale;
    out[1] = (b0 - b1) * scale;
    out[2] = (b2 + b3) * scale;
    out[3] = (b2 - b3) * scale;
    out[4] = (b4 + b5) * scale;
    out[5] = (b4 - b5) * scale;
    out[6] = (b6 + b7) * scale;
    out[7] = (b6 - b7) * scale;
}

void FeltReverb::processSample(float& left, float& right, float mix) noexcept
{
    // Smooth feedback-gain moves (exponential, no per-sample pow).
    feedbackGain = feedbackGain * 0.999f + targetFeedbackGain * 0.001f;

    const float inL = left;
    const float inR = right;
    const float monoIn = (inL + inR) * 0.5f;

    // Input diffusion: 4 allpasses for density.
    float diffused = monoIn;
    for (int i = 0; i < kNumInputAP; ++i)
    {
        const float coeff = (i < 2) ? kInputDiffusion1 : kInputDiffusion2;
        diffused = processAllpass(diffused, inputApBuffers[static_cast<size_t>(i)].data(),
                                  2048, inputApWriteIdx[i], inputApDelays[i], coeff);
    }

    // Modulated delay reads.
    std::array<float, kChannels> delayOut{};
    for (int ch = 0; ch < kChannels; ++ch)
    {
        lfoPhases[ch] += lfoIncrements[ch];
        if (lfoPhases[ch] >= 1.0f)
            lfoPhases[ch] -= 1.0f;
        const float mod = std::sin(lfoPhases[ch] * 6.2831853f) * kModDepthSamples;
        delayOut[ch] = readDelayInterpolated(ch, static_cast<float>(baseDelays[ch]) + mod);
    }

    // Hadamard mixing for maximum diffusion.
    std::array<float, kChannels> mixed{};
    applyHadamard8(delayOut, mixed);

    // Feedback path: damping, DC blocking, rational-tanh limiting, write.
    for (int ch = 0; ch < kChannels; ++ch)
    {
        float fb = diffused + mixed[ch] * feedbackGain;

        lpState[ch] = (1.0f - lpCoeff) * fb + lpCoeff * lpState[ch];
        fb = lpState[ch];

        const float dcBlocked = fb - dcX1[ch] + dcR * dcY1[ch];
        dcX1[ch] = fb;
        dcY1[ch] = dcBlocked;

        // Safety limiter (new vs Bloom; Tides-style placement). Near-identity
        // at normal levels, bounded under FDN energy accumulation.
        fb = FeltMath::rationalTanh(dcBlocked);

        delayBuffers[ch][static_cast<size_t>(writeIndices[ch])] = fb;
        writeIndices[ch] = (writeIndices[ch] + 1) & kDelayMask;
    }

    // Stereo taps: even channels left, odd right.
    const float wetL = (delayOut[0] + delayOut[2] + delayOut[4] + delayOut[6]) * 0.25f;
    const float wetR = (delayOut[1] + delayOut[3] + delayOut[5] + delayOut[7]) * 0.25f;

    // Equal-power wet/dry with wet headroom.
    const float dryGain = std::cos(mix * 1.5707963f);
    const float wetGain = std::sin(mix * 1.5707963f) * kOutputHeadroom;

    left = inL * dryGain + wetL * wetGain;
    right = inR * dryGain + wetR * wetGain;
}
