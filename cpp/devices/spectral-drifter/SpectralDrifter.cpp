#include "SpectralDrifter.h"

void SpectralDrifter::prepare(double sr)
{
    sampleRate = sr;
    reset();

    // Initialize lookup tables (once)
    initHannTable();
    initPitchTable();

    // Calculate filter coefficients based on sample rate
    // Low-pass for Winter/Autumn (cutoff ~2kHz)
    float lpCutoff = 2000.0f;
    lpCoeff = std::exp(-2.0f * kPi * lpCutoff / static_cast<float>(sampleRate));

    // High-pass for removing DC (cutoff ~20Hz)
    hpCoeff = 0.995f;

    // Initialize grains with staggered phases
    for (int i = 0; i < NUM_GRAINS; ++i)
    {
        grains[i].phase = static_cast<float>(i) / NUM_GRAINS;
        grains[i].targetPitchRatio = 1.0f;
        grains[i].smoothedPitchRatio = 1.0f;
        grains[i].readPos = 0.0f;
        grains[i].assignedInterval = 0;
    }

    // Calculate output smoothing coefficient based on sample rate (~4kHz cutoff)
    outputSmoothCoeff = 1.0f - std::exp(-2.0f * kPi * 4000.0f / static_cast<float>(sampleRate));

    // Pitch smoothing coefficient (~20ms smoothing time)
    pitchSmoothCoeff = std::exp(-1.0f / (0.02f * static_cast<float>(sampleRate)));
}

void SpectralDrifter::reset()
{
    std::fill(delayBuffer.begin(), delayBuffer.end(), 0.0f);
    writePos = 0;
    lpState = 0.0f;
    hpState = 0.0f;
    bpState1 = 0.0f;
    bpState2 = 0.0f;
    outputSmoothState = 0.0f;
    outputSmoothState2 = 0.0f;
    currentDrift = 0.0f;

    for (auto& grain : grains)
    {
        grain.readPos = 0.0f;
        grain.targetPitchRatio = 1.0f;
        grain.smoothedPitchRatio = 1.0f;
        grain.assignedInterval = 0;
    }
}

float SpectralDrifter::calculatePitchRatio(float driftAmount, int grainIndex) const
{
    // Maximum pitch shift: +/- 1 octave at full drift
    // driftAmount is 0-1, representing the age-scaled bloom effect
    // Only used for Atonal mode (continuous smooth drift)
    float maxSemitones = 12.0f * driftAmount;  // Up to 1 octave

    float semitones = 0.0f;

    switch (direction)
    {
        case Direction::Up:
            semitones = maxSemitones;
            break;

        case Direction::Down:
            semitones = -maxSemitones;
            break;

        case Direction::Scatter:
            // Alternate grains go up and down
            if (grainIndex % 2 == 0)
                semitones = maxSemitones * 0.7f;  // Slightly less than full
            else
                semitones = -maxSemitones * 0.5f; // Less down than up for brightness
            break;
    }

    // Use lookup table instead of pow() (10x faster)
    return semitonesToRatio(semitones);
}

float SpectralDrifter::applySeasonFilter(float input)
{
    float output = input;

    switch (season)
    {
        case Season::Spring:
            // Bright opening: subtle high shelf boost
            // High-pass to emphasize brightness + slight boost
            {
                float hp = input - hpState;
                hpState = livemix::flush_denormal(input * 0.05f + hpState * 0.95f);
                output = input + hp * 0.3f;  // Add some HF emphasis
            }
            break;

        case Season::Summer:
            // Warm sustain: rich mids, full frequency
            // Gentle bandpass emphasis around 500-2000Hz
            {
                // Simple mid boost using state variable approach
                float mid = input - lpState;
                lpState = livemix::flush_denormal(input * 0.1f + lpState * 0.9f);
                output = input + mid * 0.15f;  // Subtle warmth
            }
            break;

        case Season::Autumn:
            // Gradual cooling: gentle HF roll-off
            {
                lpState = livemix::flush_denormal((1.0f - lpCoeff * 0.7f) * input + lpCoeff * 0.7f * lpState);
                output = lpState;
            }
            break;

        case Season::Winter:
            // Dark closing: strong LF emphasis, heavy HF cut
            {
                lpState = livemix::flush_denormal((1.0f - lpCoeff) * input + lpCoeff * lpState);
                // Additional LF emphasis
                bpState1 = livemix::flush_denormal(bpState1 * 0.99f + lpState * 0.01f);
                output = lpState + bpState1 * 0.3f;
            }
            break;
    }

    return output;
}

float SpectralDrifter::applySeedFilter(float input)
{
    // Seed-based harmonic emphasis using resonant filtering
    // This is a simplified approach - for true harmonic selection,
    // you'd need pitch tracking + comb filtering

    float output = input;

    switch (seed)
    {
        case Seed::Fundamental:
            // Emphasize low frequencies (fundamental tends to be lower)
            {
                float lp = livemix::flush_denormal(bpState2 * 0.9f + input * 0.1f);
                bpState2 = lp;
                output = input * 0.7f + lp * 0.3f;
            }
            break;

        case Seed::OddHarmonics:
            // Odd harmonics create hollow/clarinet-like sound
            // Soft clip to add odd harmonics
            {
                float saturated = std::tanh(input * 1.5f);
                output = input * 0.6f + saturated * 0.4f;
            }
            break;

        case Seed::EvenHarmonics:
            // Even harmonics create warm/rounded sound
            // Asymmetric saturation adds even harmonics
            {
                float asymmetric = input + 0.2f * input * input;
                output = input * 0.7f + std::tanh(asymmetric) * 0.3f;
            }
            break;
    }

    return output;
}

float SpectralDrifter::process(float input, float ageNormalized)
{
    // Write input to delay buffer
    delayBuffer[writePos] = input;

    // Bloom controls intensity, age affects how much older audio is shifted
    // Use smoother curve for more gradual effect
    float intensityFactor = bloom * (0.3f + ageNormalized * 0.7f);  // Smoother blend
    currentDrift = intensityFactor;

    // Granular pitch shifting with overlapping grains
    float output = 0.0f;
    float grainSize = static_cast<float>(GRAIN_SIZE);

    for (int i = 0; i < NUM_GRAINS; ++i)
    {
        auto& grain = grains[i];

        // Advance grain phase
        grain.phase += 1.0f / grainSize;

        // When grain resets, assign FIXED pitch ratio based on interval mode
        if (grain.phase >= 1.0f)
        {
            grain.phase -= 1.0f;
            grain.readPos = static_cast<float>(writePos);

            // Determine target interval based on mode (FIXED, not dynamic)
            int semitones = 0;

            switch (interval)
            {
                case Interval::Fifth:
                    semitones = (direction == Direction::Down) ? -7 : 7;
                    break;

                case Interval::Octave:
                    semitones = (direction == Direction::Down) ? -12 : 12;
                    break;

                case Interval::FifthOctave:
                    // Alternate grains between 5th and octave for richness
                    if (i % 2 == 0)
                        semitones = (direction == Direction::Down) ? -12 : 12;
                    else
                        semitones = (direction == Direction::Down) ? -7 : 7;
                    break;

                case Interval::Atonal:
                    // Continuous smooth drift based on bloom (no fixed interval)
                    grain.targetPitchRatio = calculatePitchRatio(intensityFactor, i);
                    grain.assignedInterval = 0;
                    break;
            }

            // For tonal modes, set fixed target ratio
            if (interval != Interval::Atonal)
            {
                // Scatter mode: some grains go opposite direction
                if (direction == Direction::Scatter && i % 3 == 0)
                    semitones = -semitones;

                grain.assignedInterval = semitones;
                grain.targetPitchRatio = semitonesToRatio(static_cast<float>(semitones));
            }
        }

        // === KEY FIX: Blend from unison toward target based on bloom ===
        // This makes the bloom control smooth - no jumps!
        float targetRatio = grain.targetPitchRatio;
        float blendedRatio = 1.0f + (targetRatio - 1.0f) * intensityFactor;

        // Extra smooth pitch transitions (prevents metallic artifacts)
        grain.smoothedPitchRatio = grain.smoothedPitchRatio * 0.997f + blendedRatio * 0.003f;

        // Calculate read position with smoothed pitch ratio
        grain.readPos -= grain.smoothedPitchRatio;
        if (grain.readPos < 0.0f)
            grain.readPos += static_cast<float>(MAX_DELAY);
        if (grain.readPos >= static_cast<float>(MAX_DELAY))
            grain.readPos -= static_cast<float>(MAX_DELAY);

        // Interpolated read from delay buffer
        int readIdx = static_cast<int>(grain.readPos);
        float frac = grain.readPos - static_cast<float>(readIdx);
        int nextIdx = (readIdx + 1) % MAX_DELAY;

        float sample = delayBuffer[readIdx] * (1.0f - frac) + delayBuffer[nextIdx] * frac;

        // Apply Hann window envelope
        float envelope = hannWindow(grain.phase);

        // Accumulate to output
        output += sample * envelope;
    }

    // Normalize by number of overlapping grains
    output *= (2.0f / NUM_GRAINS);

    // Apply season-based character shaping
    output = applySeasonFilter(output);

    // Apply seed-based harmonic emphasis
    output = applySeedFilter(output);

    // === Analog warmth processing ===
    // 1. Gentle saturation for analog character
    output = saturate(output);

    // 2. Two-stage smoothing for silky texture (removes grainy artifacts)
    outputSmoothState = livemix::flush_denormal(outputSmoothState * (1.0f - outputSmoothCoeff) + output * outputSmoothCoeff);
    outputSmoothState2 = livemix::flush_denormal(outputSmoothState2 * 0.92f + outputSmoothState * 0.08f);  // Second stage LP
    output = outputSmoothState * 0.4f + outputSmoothState2 * 0.6f;  // Blend: more smoothed

    // Advance write position
    writePos = (writePos + 1) % MAX_DELAY;

    return output;
}

bool SpectralDrifter::hasDenormalState() const
{
    const auto inFlushRange = [](float value) {
        const float magnitude = std::abs(value);
        return magnitude != 0.0f && magnitude < livemix::kDenormalThreshold;
    };
    return inFlushRange(lpState) || inFlushRange(hpState) || inFlushRange(bpState1) ||
           inFlushRange(bpState2) || inFlushRange(outputSmoothState) || inFlushRange(outputSmoothState2);
}

bool SpectralDrifter::isSilentState() const
{
    if (lpState != 0.0f || hpState != 0.0f || bpState1 != 0.0f || bpState2 != 0.0f ||
        outputSmoothState != 0.0f || outputSmoothState2 != 0.0f)
        return false;
    return std::all_of(delayBuffer.begin(), delayBuffer.end(), [](float v) { return v == 0.0f; });
}
