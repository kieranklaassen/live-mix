#include "StereoWidener.h"
#include <algorithm>

void StereoWidener::prepare(double sr) {
    sampleRate = static_cast<float>(sr);

    // Bass crossover filter coefficient (1-pole lowpass)
    // fc = 200Hz, coefficient = exp(-2*pi*fc/sr)
    bassLpCoeff = std::exp(-2.0f * 3.14159265f * BASS_CROSSOVER_HZ / sampleRate);

    // Setup allpass filters with prime-number delays for good decorrelation
    // Left channel delays (shorter, odd primes)
    const int leftDelays[NUM_ALLPASS] = {7, 19, 37, 67};
    // Right channel delays (longer, different primes)
    const int rightDelays[NUM_ALLPASS] = {11, 29, 47, 79};
    // Allpass coefficients (varied for richer decorrelation)
    const float coeffs[NUM_ALLPASS] = {0.5f, 0.6f, 0.55f, 0.65f};

    for (int i = 0; i < NUM_ALLPASS; ++i) {
        allpassL[i].delaySamples = leftDelays[i];
        allpassR[i].delaySamples = rightDelays[i];
        allpassL[i].coeff = coeffs[i];
        allpassR[i].coeff = coeffs[i];
    }

    // Haas delay: ~0.8ms at max width for subtle spaciousness
    // (too long creates phasing, too short has no effect)
    haasDelaySamples = static_cast<int>(0.0008f * sampleRate);  // 0.8ms
    haasDelaySamples = std::min(haasDelaySamples, MAX_HAAS_DELAY - 1);

    reset();
    updateParameters();
}

void StereoWidener::reset() {
    bassLpStateL = 0.0f;
    bassLpStateR = 0.0f;

    for (auto& ap : allpassL) ap.reset();
    for (auto& ap : allpassR) ap.reset();

    std::fill(haasDelayBuffer.begin(), haasDelayBuffer.end(), 0.0f);
    haasWriteIdx = 0;
}

void StereoWidener::setWidth(float w) {
    width = std::clamp(w, 0.0f, 1.0f);
    updateParameters();
}

void StereoWidener::updateParameters() {
    // M/S Side Gain Calculation
    // width 0.0 = mono (sideGain = 0)
    // width 0.5 = normal (sideGain = 1)
    // width 0.75 = +50% side boost (sideGain = 1.5)
    // width 1.0 = +100% side boost (sideGain = 2.0)

    if (width <= 0.5f) {
        // 0-0.5: Interpolate from mono to normal
        // At 0: sideGain = 0 (mono)
        // At 0.5: sideGain = 1 (normal)
        sideGain = width * 2.0f;
    } else {
        // 0.5-1.0: Boost side beyond normal
        // At 0.5: sideGain = 1
        // At 1.0: sideGain = 2.5 (dramatic widening)
        float extraWidth = (width - 0.5f) * 2.0f;  // 0-1 range
        sideGain = 1.0f + extraWidth * 1.5f;       // 1.0 to 2.5
    }

    // Compensate mid to maintain overall level (constant power)
    // When boosting side, reduce mid slightly
    midGain = 1.0f / std::sqrt(0.5f * (1.0f + sideGain * sideGain));

    // Allpass decorrelation: kicks in above 75% width
    if (width <= 0.75f) {
        decorrelationAmount = 0.0f;
    } else {
        // 0.75-1.0 maps to 0-1 decorrelation
        decorrelationAmount = (width - 0.75f) * 4.0f;  // 0-1
    }

    // Haas effect: kicks in above 85% width
    if (width <= 0.85f) {
        haasAmount = 0.0f;
    } else {
        // 0.85-1.0 maps to 0-1 Haas blend
        haasAmount = (width - 0.85f) * (1.0f / 0.15f);  // 0-1
    }
}

void StereoWidener::process(float& left, float& right) {
    // 1. Split into bass (to keep narrow) and everything else
    float bassL = bassLpStateL = bassLpCoeff * bassLpStateL + (1.0f - bassLpCoeff) * left;
    float bassR = bassLpStateR = bassLpCoeff * bassLpStateR + (1.0f - bassLpCoeff) * right;
    float highL = left - bassL;
    float highR = right - bassR;

    // 2. M/S processing on high frequencies only
    // Convert to M/S
    float mid = (highL + highR) * 0.5f;
    float side = (highL - highR) * 0.5f;

    // Apply width (boost side, adjust mid for level compensation)
    mid *= midGain;
    side *= sideGain;

    // Convert back to L/R
    highL = mid + side;
    highR = mid - side;

    // 3. Allpass decorrelation (for extreme widths)
    if (decorrelationAmount > 0.001f) {
        float decorL = highL;
        float decorR = highR;

        // Process through cascaded allpass filters
        for (int i = 0; i < NUM_ALLPASS; ++i) {
            decorL = allpassL[i].process(decorL);
            decorR = allpassR[i].process(decorR);
        }

        // Blend decorrelated signal
        highL = highL * (1.0f - decorrelationAmount) + decorL * decorrelationAmount;
        highR = highR * (1.0f - decorrelationAmount) + decorR * decorrelationAmount;
    }

    // 4. Micro Haas delay on right channel (for extreme widths)
    if (haasAmount > 0.001f && haasDelaySamples > 0) {
        // Write current right to delay buffer
        haasDelayBuffer[haasWriteIdx] = highR;

        // Read delayed sample
        int readIdx = (haasWriteIdx - haasDelaySamples + MAX_HAAS_DELAY) % MAX_HAAS_DELAY;
        float delayedR = haasDelayBuffer[readIdx];

        // Blend original and delayed
        highR = highR * (1.0f - haasAmount) + delayedR * haasAmount;

        haasWriteIdx = (haasWriteIdx + 1) % MAX_HAAS_DELAY;
    }

    // 5. Recombine: bass stays narrow, highs get the width treatment
    // Bass M/S: keep mostly mid (narrow)
    float bassMid = (bassL + bassR) * 0.5f;
    float bassSide = (bassL - bassR) * 0.5f;
    float bassNarrowFactor = std::max(0.3f, 1.0f - width * 0.7f);  // Keep bass at least 30% side
    bassSide *= bassNarrowFactor;
    bassL = bassMid + bassSide;
    bassR = bassMid - bassSide;

    // Final output
    left = bassL + highL;
    right = bassR + highR;
}
