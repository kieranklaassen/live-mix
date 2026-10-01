#pragma once

#include <algorithm>
#include <cmath>

// live-mix copy of kkfonie's Thesis/Source/ThesisTransform.h (808719d), made
// JUCE-free and allocation-free. The transform itself is unchanged. Deviations:
// - <juce_core/juce_core.h>, <array>, <vector> -> <algorithm>.
// - juce::jlimit(lo, hi, x) -> the local limit() (same clamp).
// - scaleNotes: std::vector<int> rebuilt (and reallocated) on every
//   setScale/setRoot -> a fixed int[kMaxScaleNotes] with a count; the largest
//   table is the chromatic scale from MIDI 24 to 96, 73 notes.
// - getScaleIntervals(): function-local static std::vector<int> tables -> a
//   constexpr table of {intervals, size} rows returned as an Intervals view.
// - setScale clamps an out-of-range enum to Major (the source's switch
//   default did the same on lookup).

/**
 * ThesisTransform - Geometric voice transformations in scale-degree space
 *
 * Ported from Kieran Klaassen's thesis.js Max4Live device.
 * All transformations stay perfectly in key by working with scale indices.
 *
 * 6 voices:
 * - Original: input snapped to scale
 * - Mirror: same distance, opposite direction from center
 * - Octaflip: original shifted by octave to opposite side
 * - Middle: midpoint between original and center
 * - MirrorMiddle: mirror of the middle
 * - Center: the center note itself
 */
class ThesisTransform
{
public:
    enum class Scale
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
        Pentatonic,
        Blues,
        WholeTone,
        Chromatic,
        NumScales
    };

    struct VoiceFrequencies
    {
        float original;      // 0: Input snapped to scale
        float mirror;        // 1: Same distance, opposite direction from center
        float octaflip;      // 2: Original shifted by octave to opposite side
        float middle;        // 3: Midpoint between original and center
        float mirrorMiddle;  // 4: Mirror of the middle
        float center;        // 5: The center note itself
    };

    ThesisTransform()
    {
        setScale(Scale::Major);
        setRoot(0);  // C
        setCenterNote(62);  // D4 - offset center, not the root
    }

    void setScale(Scale newScale)
    {
        currentScale = newScale;
        rebuildScaleNotes();
    }

    void setRoot(int newRoot)  // 0-11 (C=0, C#=1, etc.)
    {
        rootNote = limit(0, 11, newRoot);
        rebuildScaleNotes();
    }

    void setCenterNote(int midiNote)
    {
        centerNote = limit(24, 96, midiNote);
        centerScaleIndex = midiToScaleIndex(centerNote);
    }

    int getCenterNote() const { return centerNote; }

    VoiceFrequencies transform(int inputMidi) const
    {
        VoiceFrequencies result;

        // Snap input to nearest scale note
        int inputIdx = midiToScaleIndex(inputMidi);
        int snappedMidi = scaleIndexToMidi(inputIdx);

        // Original: input snapped to scale
        result.original = midiToFrequency(snappedMidi);

        // Distance in scale degrees from center
        int distance = inputIdx - centerScaleIndex;

        // Mirror: same distance, opposite direction from center
        int mirrorIdx = centerScaleIndex - distance;
        int mirrorMidi = scaleIndexToMidi(mirrorIdx);
        result.mirror = midiToFrequency(mirrorMidi);

        // Octaflip: Original shifted by octave to opposite side of center
        int scaleSize = getScaleIntervals().size;
        int octaflipIdx = inputIdx;
        int centerMidi = scaleIndexToMidi(centerScaleIndex);

        if (snappedMidi > centerMidi)
        {
            // Shift down by one octave (in scale degrees)
            octaflipIdx = inputIdx - scaleSize;
        }
        else if (snappedMidi < centerMidi)
        {
            // Shift up by one octave (in scale degrees)
            octaflipIdx = inputIdx + scaleSize;
        }

        octaflipIdx = limit(0, scaleNoteCount - 1, octaflipIdx);
        int octaflipMidi = scaleIndexToMidi(octaflipIdx);
        result.octaflip = midiToFrequency(octaflipMidi);

        // Middle: midpoint between original and center (in scale degrees)
        int middleIdx = (inputIdx + centerScaleIndex) / 2;
        int middleMidi = scaleIndexToMidi(middleIdx);
        result.middle = midiToFrequency(middleMidi);

        // MirrorMiddle: mirror of the middle
        int middleDistance = middleIdx - centerScaleIndex;
        int mirrorMiddleIdx = centerScaleIndex - middleDistance;
        int mirrorMiddleMidi = scaleIndexToMidi(mirrorMiddleIdx);
        result.mirrorMiddle = midiToFrequency(mirrorMiddleMidi);

        // Center: the center note itself
        result.center = midiToFrequency(centerMidi);

        return result;
    }

    static float midiToFrequency(int midiNote)
    {
        return 440.0f * std::pow(2.0f, (midiNote - 69) / 12.0f);
    }

    static const char* getScaleName(Scale scale)
    {
        switch (scale)
        {
            case Scale::Major:         return "Major";
            case Scale::NaturalMinor:  return "Natural Minor";
            case Scale::HarmonicMinor: return "Harmonic Minor";
            case Scale::MelodicMinor:  return "Melodic Minor";
            case Scale::Dorian:        return "Dorian";
            case Scale::Phrygian:      return "Phrygian";
            case Scale::Lydian:        return "Lydian";
            case Scale::Mixolydian:    return "Mixolydian";
            case Scale::Locrian:       return "Locrian";
            case Scale::Pentatonic:    return "Pentatonic";
            case Scale::Blues:         return "Blues";
            case Scale::WholeTone:     return "Whole Tone";
            case Scale::Chromatic:     return "Chromatic";
            default:                   return "Unknown";
        }
    }

    static const char* getNoteName(int noteIndex)  // 0-11
    {
        static const char* names[] = {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"};
        return names[noteIndex % 12];
    }

private:
    Scale currentScale = Scale::Major;
    int rootNote = 0;  // C
    int centerNote = 62;  // D4
    int centerScaleIndex = 0;
    static constexpr int kMaxScaleNotes = 73;  // Chromatic, MIDI 24..96
    int scaleNotes[kMaxScaleNotes] = {};  // All MIDI notes in scale (24-96)
    int scaleNoteCount = 0;

    static int limit(int lo, int hi, int value)
    {
        return value < lo ? lo : (value > hi ? hi : value);
    }

    struct Intervals
    {
        const int* data;
        int size;
        const int* begin() const { return data; }
        const int* end() const { return data + size; }
    };

    static constexpr int kIntervalTable[static_cast<int>(Scale::NumScales)][12] = {
        {0, 2, 4, 5, 7, 9, 11},                    // Major
        {0, 2, 3, 5, 7, 8, 10},                    // Natural Minor
        {0, 2, 3, 5, 7, 8, 11},                    // Harmonic Minor
        {0, 2, 3, 5, 7, 9, 11},                    // Melodic Minor
        {0, 2, 3, 5, 7, 9, 10},                    // Dorian
        {0, 1, 3, 5, 7, 8, 10},                    // Phrygian
        {0, 2, 4, 6, 7, 9, 11},                    // Lydian
        {0, 2, 4, 5, 7, 9, 10},                    // Mixolydian
        {0, 1, 3, 5, 6, 8, 10},                    // Locrian
        {0, 2, 4, 7, 9},                           // Pentatonic
        {0, 3, 5, 6, 7, 10},                       // Blues
        {0, 2, 4, 6, 8, 10},                       // Whole Tone
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11},    // Chromatic
    };
    static constexpr int kIntervalCount[static_cast<int>(Scale::NumScales)] = {7, 7, 7, 7, 7, 7, 7,
                                                                               7, 7, 5, 6, 6, 12};

    Intervals getScaleIntervals() const
    {
        int index = static_cast<int>(currentScale);
        if (index < 0 || index >= static_cast<int>(Scale::NumScales))
            index = 0;
        return {kIntervalTable[index], kIntervalCount[index]};
    }

    void rebuildScaleNotes()
    {
        scaleNoteCount = 0;
        const Intervals intervals = getScaleIntervals();

        // Build all scale notes from MIDI 24 (C1) to 96 (C7)
        for (int octave = 2; octave <= 7; ++octave)
        {
            int octaveBase = octave * 12;
            for (int interval : intervals)
            {
                int midiNote = octaveBase + rootNote + interval;
                if (midiNote >= 24 && midiNote <= 96 && scaleNoteCount < kMaxScaleNotes)
                {
                    scaleNotes[scaleNoteCount++] = midiNote;
                }
            }
        }

        // Sort and remove duplicates
        std::sort(scaleNotes, scaleNotes + scaleNoteCount);
        scaleNoteCount = static_cast<int>(std::unique(scaleNotes, scaleNotes + scaleNoteCount) - scaleNotes);

        // Update center scale index
        centerScaleIndex = midiToScaleIndex(centerNote);
    }

    int midiToScaleIndex(int midiNote) const
    {
        if (scaleNoteCount == 0)
            return 0;

        // Find closest scale note
        int closestIdx = 0;
        int closestDist = std::abs(scaleNotes[0] - midiNote);

        for (int i = 1; i < scaleNoteCount; ++i)
        {
            int dist = std::abs(scaleNotes[i] - midiNote);
            if (dist < closestDist)
            {
                closestDist = dist;
                closestIdx = i;
            }
            else if (dist > closestDist)
            {
                // Scale notes are sorted, so we can stop
                break;
            }
        }

        return closestIdx;
    }

    int scaleIndexToMidi(int scaleIndex) const
    {
        if (scaleNoteCount == 0)
            return 60;

        int clampedIdx = limit(0, scaleNoteCount - 1, scaleIndex);
        return scaleNotes[clampedIdx];
    }
};
