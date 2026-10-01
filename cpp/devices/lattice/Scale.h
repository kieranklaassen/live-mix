#pragma once
#include <algorithm>
#include <array>
#include <cmath>

namespace lattice
{

constexpr int kMaxDegrees = 12;
constexpr float kA4Cents = 6900.0f;  // MIDI 69 * 100

inline float midiToCents(float midi) { return midi * 100.0f; }
inline float centsToHz(float cents) { return 440.0f * std::exp2((cents - kA4Cents) / 1200.0f); }
inline float hzToCents(float hz) { return kA4Cents + 1200.0f * std::log2(hz / 440.0f); }

inline int floorDiv(int a, int b) { return (a >= 0) ? a / b : -((-a + b - 1) / b); }

enum class ScalePreset
{
    Major = 0,
    NaturalMinor,
    HarmonicMinor,
    MelodicMinor,
    Dorian,
    Phrygian,
    Lydian,
    Mixolydian,
    Locrian,
    MajorPentatonic,
    MinorPentatonic,
    Blues,
    WholeTone,
    Chromatic,
    Custom,
    Count
};

/** A scale is a repeating period (default one octave) holding sorted degree offsets in cents. */
struct Scale
{
    int numDegrees = 7;
    float period = 1200.0f;
    std::array<float, kMaxDegrees> degrees{};

    static Scale fromSemitones(std::initializer_list<int> semis)
    {
        Scale s;
        s.numDegrees = 0;
        for (int st : semis)
            if (s.numDegrees < kMaxDegrees)
                s.degrees[static_cast<size_t>(s.numDegrees++)] = static_cast<float>(st) * 100.0f;
        return s;
    }

    /** Builds a scale from up to 12 (enabled, cents) slots. Degrees are wrapped into [0, period) and sorted. */
    static Scale fromCustom(const std::array<bool, kMaxDegrees>& enabled,
                            const std::array<float, kMaxDegrees>& cents,
                            float periodCents)
    {
        Scale s;
        s.period = std::max(100.0f, periodCents);
        s.numDegrees = 0;
        for (size_t i = 0; i < kMaxDegrees; ++i)
        {
            if (!enabled[i]) continue;
            float c = std::fmod(cents[i], s.period);
            if (c < 0.0f) c += s.period;
            s.degrees[static_cast<size_t>(s.numDegrees++)] = c;
        }
        if (s.numDegrees == 0)
        {
            s.numDegrees = 1;
            s.degrees[0] = 0.0f;
        }
        std::sort(s.degrees.begin(), s.degrees.begin() + s.numDegrees);
        return s;
    }

    static Scale preset(ScalePreset p)
    {
        switch (p)
        {
            case ScalePreset::Major:           return fromSemitones({0, 2, 4, 5, 7, 9, 11});
            case ScalePreset::NaturalMinor:    return fromSemitones({0, 2, 3, 5, 7, 8, 10});
            case ScalePreset::HarmonicMinor:   return fromSemitones({0, 2, 3, 5, 7, 8, 11});
            case ScalePreset::MelodicMinor:    return fromSemitones({0, 2, 3, 5, 7, 9, 11});
            case ScalePreset::Dorian:          return fromSemitones({0, 2, 3, 5, 7, 9, 10});
            case ScalePreset::Phrygian:        return fromSemitones({0, 1, 3, 5, 7, 8, 10});
            case ScalePreset::Lydian:          return fromSemitones({0, 2, 4, 6, 7, 9, 11});
            case ScalePreset::Mixolydian:      return fromSemitones({0, 2, 4, 5, 7, 9, 10});
            case ScalePreset::Locrian:         return fromSemitones({0, 1, 3, 5, 6, 8, 10});
            case ScalePreset::MajorPentatonic: return fromSemitones({0, 2, 4, 7, 9});
            case ScalePreset::MinorPentatonic: return fromSemitones({0, 3, 5, 7, 10});
            case ScalePreset::Blues:           return fromSemitones({0, 3, 5, 6, 7, 10});
            case ScalePreset::WholeTone:       return fromSemitones({0, 2, 4, 6, 8, 10});
            case ScalePreset::Chromatic:       return fromSemitones({0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11});
            case ScalePreset::Custom:
            case ScalePreset::Count:
                break;
        }
        return fromSemitones({0, 2, 4, 5, 7, 9, 11});
    }

    static const char* presetName(int index)
    {
        static const char* names[] = {
            "Major", "Natural Minor", "Harmonic Minor", "Melodic Minor", "Dorian", "Phrygian",
            "Lydian", "Mixolydian", "Locrian", "Major Pentatonic", "Minor Pentatonic", "Blues",
            "Whole Tone", "Chromatic", "Custom"};
        if (index < 0 || index >= static_cast<int>(ScalePreset::Count)) return "Major";
        return names[index];
    }
};

/**
 * Maps between absolute pitch (cents, A4 = 6900) and absolute scale-degree indices.
 * Degree index n = octave * numDegrees + k, so degree arithmetic (mirror, middle, ...)
 * is plain integer arithmetic and never leaves the scale.
 */
struct ScaleMap
{
    Scale scale;
    float rootCents = 0.0f;  // 100 * root pitch class (C = 0)

    float degreeToCents(int n) const
    {
        const int K = scale.numDegrees;
        const int oct = floorDiv(n, K);
        const int k = n - oct * K;
        return rootCents + static_cast<float>(oct) * scale.period + scale.degrees[static_cast<size_t>(k)];
    }

    int nearestDegree(float cents) const
    {
        const int K = scale.numDegrees;
        const float rel = cents - rootCents;
        const int oct = static_cast<int>(std::floor(rel / scale.period));
        const float within = rel - static_cast<float>(oct) * scale.period;

        int bestN = oct * K;
        float bestDist = std::abs(within - scale.degrees[0]);
        for (int k = 1; k < K; ++k)
        {
            const float d = std::abs(within - scale.degrees[static_cast<size_t>(k)]);
            if (d < bestDist) { bestDist = d; bestN = oct * K + k; }
        }
        // First degree of the next period and last degree of the previous period
        const float dNext = std::abs(within - (scale.degrees[0] + scale.period));
        if (dNext < bestDist) { bestDist = dNext; bestN = (oct + 1) * K; }
        const float dPrev = std::abs(within - (scale.degrees[static_cast<size_t>(K - 1)] - scale.period));
        if (dPrev < bestDist) { bestN = oct * K - 1; }
        return bestN;
    }
};

}  // namespace lattice
