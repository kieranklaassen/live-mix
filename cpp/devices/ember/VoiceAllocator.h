#pragma once

#include <cstddef>
#include <cstdint>

namespace tatami::dsp
{

/**
    Fixed-size voice bookkeeping shared by the instruments: which voice plays which note,
    age ordering, and quietest-voice stealing. The owner supplies per-voice levels because
    only it knows the envelope/velocity product. No allocation, no virtuals.
*/
template <int MaxVoices>
class VoiceAllocator
{
public:
    static constexpr int kMaxVoices = MaxVoices;
    static constexpr int kNoVoice = -1;

    void reset() noexcept
    {
        for (int i = 0; i < MaxVoices; ++i)
        {
            notes[i] = -1;
            active[i] = false;
            releasing[i] = false;
            stamps[i] = 0;
        }
        counter = 0;
    }

    /**
        Picks a voice for a new note: a free voice first (the oldest free one), otherwise
        the quietest releasing voice, otherwise the quietest voice overall. `levels` are the
        current audible levels per voice.
    */
    int allocate (int note, const float* levels, int numVoices) noexcept
    {
        int best = kNoVoice;
        uint32_t oldest = UINT32_MAX;
        for (int i = 0; i < numVoices; ++i)
            if (! active[i] && stamps[i] < oldest)
            {
                oldest = stamps[i];
                best = i;
            }
        if (best == kNoVoice)
            best = quietest (levels, numVoices, true);
        if (best == kNoVoice)
            best = quietest (levels, numVoices, false);
        start (best, note);
        return best;
    }

    void start (int voice, int note) noexcept
    {
        notes[voice] = note;
        active[voice] = true;
        releasing[voice] = false;
        stamps[voice] = ++counter;
    }

    void release (int voice) noexcept { releasing[voice] = true; }

    void free (int voice) noexcept
    {
        active[voice] = false;
        releasing[voice] = false;
        notes[voice] = -1;
    }

    bool isActive (int voice) const noexcept { return active[voice]; }
    bool isReleasing (int voice) const noexcept { return releasing[voice]; }
    int noteOf (int voice) const noexcept { return notes[voice]; }

    /** The most recently started active, non-releasing voice for `note`, or kNoVoice. */
    int findHeld (int note, int numVoices) const noexcept
    {
        int best = kNoVoice;
        uint32_t newest = 0;
        for (int i = 0; i < numVoices; ++i)
            if (active[i] && ! releasing[i] && notes[i] == note && stamps[i] >= newest)
            {
                newest = stamps[i];
                best = i;
            }
        return best;
    }

    /** The most recently started active voice regardless of release state (mono/legato). */
    int newest (int numVoices) const noexcept
    {
        int best = kNoVoice;
        uint32_t newestStamp = 0;
        for (int i = 0; i < numVoices; ++i)
            if (active[i] && stamps[i] >= newestStamp)
            {
                newestStamp = stamps[i];
                best = i;
            }
        return best;
    }

    int countActive (int numVoices) const noexcept
    {
        int n = 0;
        for (int i = 0; i < numVoices; ++i)
            n += active[i] ? 1 : 0;
        return n;
    }

private:
    int quietest (const float* levels, int numVoices, bool onlyReleasing) const noexcept
    {
        int best = kNoVoice;
        float lowest = 1.0e9f;
        for (int i = 0; i < numVoices; ++i)
        {
            if (onlyReleasing && ! releasing[i])
                continue;
            if (levels[i] < lowest || (levels[i] <= lowest && best != kNoVoice && stamps[i] < stamps[best]))
            {
                lowest = levels[i];
                best = i;
            }
        }
        return best;
    }

    static constexpr size_t kSlots = static_cast<size_t> (MaxVoices);
    int notes[kSlots] {};
    bool active[kSlots] {};
    bool releasing[kSlots] {};
    uint32_t stamps[kSlots] {};
    uint32_t counter = 0;
};

} // namespace tatami::dsp
