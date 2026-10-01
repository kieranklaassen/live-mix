#pragma once
#include <array>
#include <cmath>

#include "../../common/dsp_util.h"

namespace lattice
{

/**
 * Simple feedback delay for one harmony voice. Fixed storage: 65536 samples,
 * which holds the 500 ms the Delay control reaches at 96 kHz with room to spare.
 *
 * Ported from kkfonie Lattice/Source/VoiceDelay.h; see device.json for the
 * differences (fixed ring instead of a vector, denormal flush on the write).
 */
class VoiceDelay
{
public:
    static constexpr int kBufferSize = 65536;      // power of two
    static constexpr int kMask = kBufferSize - 1;

    void prepare(double sampleRate, double maxSeconds)
    {
        const double wanted = sampleRate * maxSeconds;
        maxDelay = wanted < static_cast<double>(kBufferSize - 3) ? static_cast<float>(wanted)
                                                                 : static_cast<float>(kBufferSize - 3);
        feedbackFadeSamples = static_cast<float>(sampleRate * 0.005);
        reset();
    }

    void reset()
    {
        buffer.fill(0.0f);
        writePos = 0;
    }

    /**
     * @param delaySamples  delay in samples (fractional). Below one sample the line is a pass-through.
     * @param feedback      0..1, faded out below 5 ms of delay so a near-zero delay cannot turn into a DC resonator.
     */
    float process(float input, float delaySamples, float feedback)
    {
        const float d = clampDelay(delaySamples);
        const float out = read(input, d);
        const float fb = feedback * effectiveFeedbackScale(d);
        buffer[static_cast<size_t>(writePos)] = livemix::flush_denormal(input + out * fb);
        writePos = (writePos + 1) & kMask;
        return out;
    }

    /** How much of the feedback setting is in effect at this delay (0 at 0 ms, 1 from 5 ms up). */
    float effectiveFeedbackScale(float delaySamples) const
    {
        const float d = clampDelay(delaySamples);
        const float scale = d / feedbackFadeSamples;
        return scale < 1.0f ? scale : 1.0f;
    }

private:
    float clampDelay(float delaySamples) const
    {
        return delaySamples < 0.0f ? 0.0f : (delaySamples > maxDelay ? maxDelay : delaySamples);
    }

    float read(float input, float d) const
    {
        if (d < 1.0f)
            return input;
        // x[n - d], linear between the two neighbours.
        const int whole = static_cast<int>(d);
        const float frac = d - static_cast<float>(whole);
        const float newer = buffer[static_cast<size_t>((writePos - whole) & kMask)];
        const float older = buffer[static_cast<size_t>((writePos - whole - 1) & kMask)];
        return newer + (older - newer) * frac;
    }

    std::array<float, kBufferSize> buffer{};
    int writePos = 0;
    float maxDelay = 48000.0f;
    float feedbackFadeSamples = 240.0f;
};

}  // namespace lattice
