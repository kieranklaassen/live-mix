#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>

#include "../../common/dsp_util.h"

// live-mix copy of kkfonie's Bloom/Source/SpectralDrifter.h (0c4ae88), made
// JUCE-free. Deviations from the source, all otherwise byte-for-byte:
// - <juce_dsp/juce_dsp.h> -> <algorithm>, <cstdint>, dsp_util.h.
// - setBloom: juce::jlimit(0, 1, amount) -> std::clamp(amount, 0, 1).
// - juce::MathConstants<float>::pi (initHannTable, prepare) -> kPi below.
// - The eight filter states (season lp/hp/bp, seed bp, two output smoothing
//   stages) are passed through livemix::flush_denormal when written: WASM has
//   no flush-to-zero, and every one-pole here has a coefficient above 0.5, so
//   a decayed state would otherwise sit at the smallest denormal forever.
// - hasDenormalState() / isSilentState() test hooks.
// The algorithm, its constants and its quirks (fixed 88200-sample buffer and
// 6144-sample grains at any rate, intensity applied twice in Atonal mode) are
// Bloom's.

/**
 * SpectralDrifter - Gradual pitch shifting for evolving reverb tails
 *
 * Unlike shimmer (instant octave up), this creates slow spectral drift
 * where the pitch shift amount increases as audio ages in the feedback loop.
 * Combined with formant/character shaping based on "Season" metaphor.
 *
 * Key concepts:
 * - Granular pitch shifting with 4 overlapping grains
 * - Age tracking: older audio = more drift
 * - Direction: Up, Down, or Scatter (both)
 * - Season: Shapes the tonal character of the transformation
 * - Seed: Emphasizes fundamental, odd, or even harmonics
 */
class SpectralDrifter
{
public:
    // Direction of spectral drift
    enum class Direction
    {
        Up = 0,      // Harmonics drift upward (brighter)
        Down = 1,    // Harmonics drift downward (darker)
        Scatter = 2  // Split: some up, some down
    };

    // Season shapes the character of transformation
    enum class Season
    {
        Spring = 0,  // Bright opening - HF emphasis, expanding
        Summer = 1,  // Warm sustain - rich mids, full
        Autumn = 2,  // Gradual cooling - gentle HF roll-off
        Winter = 3   // Dark closing - strong LF emphasis
    };

    // Seed determines which harmonics are emphasized
    enum class Seed
    {
        Fundamental = 0,  // Emphasize fundamental
        OddHarmonics = 1, // Odd harmonics (1st, 3rd, 5th) - hollow/clarinet
        EvenHarmonics = 2 // Even harmonics (2nd, 4th, 6th) - warm/rounded
    };

    // Interval mode - fixed musical intervals (shimmer-style)
    enum class Interval
    {
        Fifth = 0,      // Perfect 5th up/down
        Octave = 1,     // Octave up/down
        FifthOctave = 2, // Mix of 5th and octave
        Atonal = 3      // Smooth continuous drift
    };

    static constexpr int NUM_GRAINS = 8;     // More grains for smoother overlap
    static constexpr int MAX_DELAY = 88200;  // 2 seconds @ 44.1kHz
    static constexpr int GRAIN_SIZE = 6144;  // ~140ms grain window (larger = smoother, less grainy)
    static constexpr int HANN_TABLE_SIZE = 1024;  // Lookup table for Hann window

    // Musical intervals for Tonal mode (semitones) - consonant intervals only
    static constexpr int TONAL_INTERVALS_UP[] = {0, 7, 12};     // Unison, perfect 5th, octave
    static constexpr int TONAL_INTERVALS_DOWN[] = {0, -5, -12}; // Unison, perfect 4th down, octave down
    static constexpr int NUM_TONAL_INTERVALS = 3;

    static constexpr float kPi = 3.14159265358979323846f;

    SpectralDrifter() = default;

    void prepare(double sampleRate);
    void reset();

    // Set the amount of drift (0 = none, 1 = maximum)
    void setBloom(float amount) { bloom = std::clamp(amount, 0.0f, 1.0f); }
    void setDirection(Direction dir) { direction = dir; }
    void setSeason(Season s) { season = s; }
    void setSeed(Seed s) { seed = s; }
    void setInterval(Interval i) { interval = i; }

    // Process audio through the drifter
    // ageNormalized: 0.0 = fresh input, 1.0 = fully decayed
    float process(float input, float ageNormalized);

    // Get current drift amount for visualization
    float getCurrentDrift() const { return currentDrift; }

    // Test hooks (live-mix): any filter state in the flush range, and whether
    // every state and the whole delay buffer are exactly zero.
    bool hasDenormalState() const;
    bool isSilentState() const;

private:
    struct Grain
    {
        float phase = 0.0f;           // Read position within grain window (0-1)
        float targetPitchRatio = 1.0f; // Target playback speed (assigned at grain start)
        float smoothedPitchRatio = 1.0f; // Smoothed pitch ratio for artifact-free transitions
        float readPos = 0.0f;         // Position in delay buffer
        int assignedInterval = 0;     // Semitone interval assigned to this grain (for tonal mode)
    };

    // Pre-computed Hann window lookup table (avoids cos() per grain per sample)
    std::array<float, HANN_TABLE_SIZE> hannTable{};
    bool hannTableInitialized = false;

    // Lookup Hann window from table with linear interpolation
    float hannWindow(float phase) const
    {
        float idx = phase * static_cast<float>(HANN_TABLE_SIZE - 1);
        int i0 = static_cast<int>(idx);
        int i1 = std::min(i0 + 1, HANN_TABLE_SIZE - 1);
        float frac = idx - static_cast<float>(i0);
        return hannTable[i0] * (1.0f - frac) + hannTable[i1] * frac;
    }

    // Build Hann table once
    void initHannTable()
    {
        if (!hannTableInitialized)
        {
            for (int i = 0; i < HANN_TABLE_SIZE; ++i)
            {
                float phase = static_cast<float>(i) / static_cast<float>(HANN_TABLE_SIZE - 1);
                hannTable[i] = 0.5f * (1.0f - std::cos(2.0f * kPi * phase));
            }
            hannTableInitialized = true;
        }
    }

    // Pre-computed semitone-to-ratio table (avoids pow() in calculatePitchRatio)
    // Covers -12 to +12 semitones at 0.1 semitone resolution = 241 entries
    static constexpr int PITCH_TABLE_SIZE = 241;
    static constexpr float PITCH_TABLE_RANGE = 12.0f;
    std::array<float, PITCH_TABLE_SIZE> pitchTable{};
    bool pitchTableInitialized = false;

    void initPitchTable()
    {
        if (!pitchTableInitialized)
        {
            for (int i = 0; i < PITCH_TABLE_SIZE; ++i)
            {
                float semitones = -PITCH_TABLE_RANGE + (static_cast<float>(i) / static_cast<float>(PITCH_TABLE_SIZE - 1)) * 2.0f * PITCH_TABLE_RANGE;
                pitchTable[i] = std::pow(2.0f, semitones / 12.0f);
            }
            pitchTableInitialized = true;
        }
    }

    // Fast semitone-to-ratio lookup with interpolation
    float semitonesToRatio(float semitones) const
    {
        // Clamp to table range
        semitones = std::max(-PITCH_TABLE_RANGE, std::min(PITCH_TABLE_RANGE, semitones));
        // Map to table index
        float idx = ((semitones + PITCH_TABLE_RANGE) / (2.0f * PITCH_TABLE_RANGE)) * static_cast<float>(PITCH_TABLE_SIZE - 1);
        int i0 = static_cast<int>(idx);
        int i1 = std::min(i0 + 1, PITCH_TABLE_SIZE - 1);
        float frac = idx - static_cast<float>(i0);
        return pitchTable[i0] * (1.0f - frac) + pitchTable[i1] * frac;
    }

    // Calculate pitch ratio based on drift amount and direction
    float calculatePitchRatio(float driftAmount, int grainIndex) const;

    // Apply season-based filtering
    float applySeasonFilter(float input);

    // Apply seed-based harmonic emphasis
    float applySeedFilter(float input);

    // Quantize semitones to pentatonic scale intervals (for tonal mode)
    float quantizeToScale(float semitones) const
    {
        // Pentatonic scale intervals: 0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24...
        // For negative: 0, -2, -3, -5, -7, -9, -10, -12...
        static constexpr float scaleUp[] = {0, 2, 4, 7, 9, 12};
        static constexpr float scaleDown[] = {0, -2, -3, -5, -7, -9, -10, -12};
        static constexpr int numUp = 6;
        static constexpr int numDown = 8;

        if (semitones >= 0)
        {
            // Find octave and degree within octave
            int octave = static_cast<int>(semitones / 12.0f);
            float withinOctave = std::fmod(semitones, 12.0f);

            // Find nearest scale degree
            float nearest = 0;
            float minDist = 999;
            for (int i = 0; i < numUp; ++i)
            {
                float dist = std::abs(withinOctave - scaleUp[i]);
                if (dist < minDist)
                {
                    minDist = dist;
                    nearest = scaleUp[i];
                }
            }
            return nearest + octave * 12.0f;
        }
        else
        {
            float absVal = -semitones;
            int octave = static_cast<int>(absVal / 12.0f);
            float withinOctave = std::fmod(absVal, 12.0f);

            // Find nearest scale degree (using descending intervals)
            float nearest = 0;
            float minDist = 999;
            for (int i = 0; i < numDown; ++i)
            {
                float scaleVal = -scaleDown[i];  // Make positive for comparison
                float dist = std::abs(withinOctave - scaleVal);
                if (dist < minDist)
                {
                    minDist = dist;
                    nearest = scaleDown[i];
                }
            }
            return nearest - octave * 12.0f;
        }
    }

    double sampleRate = 44100.0;
    float bloom = 0.5f;
    Direction direction = Direction::Up;
    Season season = Season::Spring;
    Seed seed = Seed::Fundamental;
    Interval interval = Interval::Octave;  // Default to octave shimmer

    // Grain state
    std::array<Grain, NUM_GRAINS> grains;

    // Delay buffer for granular reading
    std::array<float, MAX_DELAY> delayBuffer{};
    int writePos = 0;

    // Filter states for season shaping
    float lpState = 0.0f;
    float hpState = 0.0f;
    float bpState1 = 0.0f;
    float bpState2 = 0.0f;

    // Coefficients (calculated in prepare)
    float lpCoeff = 0.3f;
    float hpCoeff = 0.995f;

    // Output smoothing filter (gentle lowpass for vintage warmth)
    float outputSmoothState = 0.0f;
    float outputSmoothCoeff = 0.08f;  // ~2kHz cutoff for analog warmth
    float outputSmoothState2 = 0.0f; // Second stage for extra smoothness

    // Pitch ratio smoothing coefficient (prevents abrupt pitch changes)
    float pitchSmoothCoeff = 0.995f;  // Very smooth transitions

    // Soft saturation for analog warmth
    float saturate(float x) const {
        // Gentle tube-style saturation
        return std::tanh(x * 0.8f) * 1.1f;
    }

    // Random number generator for interval selection
    uint32_t rngState = 12345;
    uint32_t simpleRng() { rngState = rngState * 1103515245 + 12345; return rngState; }

    // Current drift for visualization
    float currentDrift = 0.0f;
};
