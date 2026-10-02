// Ableton Link in the host: tempo, beat and start/stop shared with every other
// Link program on the local network, and Link Audio channels that carry the
// page's sound to them. A page cannot reach the network Link uses (multicast
// UDP), so the host joins the session for it and tells it where the beat is on
// a clock both can read.
//
// This wraps Ableton's own library (cmake/LiveMixLink.cmake). In a host built
// without it (`-DLIVE_MIX_HOST_LINK=OFF`) `available()` is false and nothing
// here does anything. docs/link.md has the message reference.

#pragma once

#include <juce_core/juce_core.h>

#include <cstdint>
#include <memory>
#include <optional>

namespace livemix
{

class LinkSession
{
public:
    /** Whether this host was built with Link. */
    static bool available() noexcept;
    /** The Link release the host was built with, or empty. */
    static juce::String version();
    /**
        The clock Link keeps time on, in microseconds. Every time in this
        class is on it. A page finds its offset from its own clock by asking
        for this value and halving the round trip.
    */
    static int64_t micros() noexcept;

    LinkSession();
    ~LinkSession();

    /**
        Changes whichever of `enabled`, `name`, `bpm`, `quantum`,
        `startStopSync` and `audio` the object names; the rest stay.
    */
    void apply (const juce::var& settings);

    /** The session as it stands: tempo, peers, and the beat at `micros`. */
    juce::var describe();

    /**
        Asks for `beat` to fall at `atMicros`. Alone in the session that is
        what happens; with peers the beat is put at the next time after
        `atMicros` that has its phase, so nobody else's beat moves. With
        `playing` the transport state the session shares is set as well.
        Returns the time `beat` falls at.
    */
    int64_t requestBeat (double beat, int64_t atMicros, std::optional<bool> playing);

    /**
        After a peer started the shared transport: puts `beat` where that
        start falls for this program and returns the time.
    */
    int64_t followStart (double beat);

    /** Tells the session this program's transport stopped at `atMicros`. */
    void stop (int64_t atMicros);

    /**
        True once after anything in `describe()` changed by more than time
        passing: tempo, peers, start/stop, channels, or the beat moving under
        this program as a session is joined.
    */
    bool takeChanged();

    /** One Link Audio channel this program sends. */
    class Sink
    {
    public:
        virtual ~Sink() = default;

        /**
            Sends interleaved samples that are heard here at `atMicros`. They
            only leave the machine while some peer listens to the channel.
            Returns false when nobody does, or when the session is busy.
        */
        virtual bool write (const float* interleaved, uint32_t frames, uint32_t channels,
                            uint32_t sampleRate, int64_t atMicros) = 0;
    };

    /** Announces a channel called `name` for as long as the sink lives; null without Link. */
    std::unique_ptr<Sink> openSink (const juce::String& name);

private:
    struct Impl;
    std::unique_ptr<Impl> impl;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (LinkSession)
};

} // namespace livemix
