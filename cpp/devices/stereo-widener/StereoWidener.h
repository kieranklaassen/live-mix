#pragma once
#include <array>
#include <cmath>

/**
 * StereoWidener - Waves S1 inspired stereo enhancement
 *
 * Techniques used (progressively applied as width increases):
 *
 * 0.0-0.5: Normal stereo (passthrough with some M/S narrowing)
 * 0.5-0.75: M/S side boost (classic stereo widening)
 * 0.75-1.0: Allpass decorrelation + micro Haas delay (super wide)
 *
 * Bass is kept narrower for mono compatibility.
 */
class StereoWidener {
public:
    static constexpr int NUM_ALLPASS = 4;
    static constexpr int MAX_HAAS_DELAY = 64;  // ~1.5ms @ 44.1kHz

    void prepare(double sampleRate);
    void reset();

    // Set width 0-1 (0=mono, 0.5=normal, 1.0=super wide)
    void setWidth(float width);

    // Process stereo pair in-place
    void process(float& left, float& right);

private:
    float sampleRate = 44100.0f;
    float width = 0.5f;

    // M/S processing
    float sideGain = 1.0f;      // 1.0 = normal, >1.0 = wider
    float midGain = 1.0f;       // Compensate to maintain level

    // Bass crossover for mono-compatible low end
    float bassLpCoeff = 0.0f;   // 1-pole lowpass coefficient
    float bassLpStateL = 0.0f;
    float bassLpStateR = 0.0f;
    static constexpr float BASS_CROSSOVER_HZ = 200.0f;

    // Allpass decorrelation (different delays for L and R)
    struct AllpassFilter {
        std::array<float, 512> buffer{};
        int writeIdx = 0;
        int delaySamples = 1;
        float coeff = 0.5f;

        float process(float input) {
            int readIdx = (writeIdx - delaySamples + 512) % 512;
            float delayed = buffer[readIdx];
            float output = -coeff * input + delayed + coeff * buffer[writeIdx];
            buffer[writeIdx] = input;
            writeIdx = (writeIdx + 1) % 512;
            return output;
        }

        void reset() {
            std::fill(buffer.begin(), buffer.end(), 0.0f);
            writeIdx = 0;
        }
    };

    std::array<AllpassFilter, NUM_ALLPASS> allpassL;
    std::array<AllpassFilter, NUM_ALLPASS> allpassR;
    float decorrelationAmount = 0.0f;

    // Micro Haas delay (creates spatial width perception)
    std::array<float, MAX_HAAS_DELAY> haasDelayBuffer{};
    int haasWriteIdx = 0;
    int haasDelaySamples = 0;  // Only applied to one channel
    float haasAmount = 0.0f;

    void updateParameters();
};
