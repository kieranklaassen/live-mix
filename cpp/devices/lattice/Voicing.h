#pragma once

namespace lattice
{

/**
 * Voice roles. Interval is a plain diatonic offset; the rest are Kieran Klaassen's
 * Thesis Voicing transformations around an offset centre, all in scale-degree space.
 * The rules mirror Thesis/Source/ThesisTransform.h and WebUI/src/lib/voicing.ts.
 */
enum class VoiceRole
{
    Off = 0,
    Interval,
    Mirror,
    Middle,
    MirrorMiddle,
    Octaflip,
    Center,
    Count
};

inline int floorDiv2(int a) { return (a >= 0) ? a / 2 : -((-a + 1) / 2); }

/**
 * Returns the target degree index for a voice, or false when the voice is off.
 * @param inputDegree   absolute degree index of the (snapped) input note
 * @param centerDegree  absolute degree index of the centre note
 * @param degreesPerPeriod number of degrees in the scale (one "octave" in degree space)
 * @param offset        extra scale steps added to every role
 */
inline bool targetDegree(VoiceRole role, int inputDegree, int centerDegree, int degreesPerPeriod, int offset, int& out)
{
    const int dist = inputDegree - centerDegree;
    const int middle = floorDiv2(inputDegree + centerDegree);

    switch (role)
    {
        case VoiceRole::Off:
            return false;
        case VoiceRole::Interval:
            out = inputDegree + offset;
            return true;
        case VoiceRole::Mirror:
            out = centerDegree - dist + offset;
            return true;
        case VoiceRole::Middle:
            out = middle + offset;
            return true;
        case VoiceRole::MirrorMiddle:
            out = centerDegree - (middle - centerDegree) + offset;
            return true;
        case VoiceRole::Octaflip:
            if (inputDegree > centerDegree)      out = inputDegree - degreesPerPeriod + offset;
            else if (inputDegree < centerDegree) out = inputDegree + degreesPerPeriod + offset;
            else                                 out = inputDegree + offset;
            return true;
        case VoiceRole::Center:
            out = centerDegree + offset;
            return true;
        case VoiceRole::Count:
            break;
    }
    return false;
}

}  // namespace lattice
