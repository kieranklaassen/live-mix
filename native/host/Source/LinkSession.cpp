#include "LinkSession.h"

#if LIVE_MIX_HOST_LINK

// Link's headers come in as system headers (an imported CMake target), so
// their warnings stay out of this build.
#include <ableton/LinkAudio.hpp>
#include <ableton/util/FloatIntConversion.hpp>

#include <atomic>
#include <chrono>
#include <cmath>
#include <mutex>
#include <vector>

namespace livemix
{

namespace
{
    using Micros = std::chrono::microseconds;

    constexpr double defaultBpm = 120.0;
    constexpr double defaultQuantum = 4.0;
    constexpr double minBpm = 20.0;
    constexpr double maxBpm = 999.0;
    /** Frames of one committed buffer; Link cuts it into packets itself. */
    constexpr uint32_t sinkFrames = 1024;
    /**
        How far the beat may be from where the last description put it before
        the page is told: a tenth of a millisecond at 120 bpm. Time passing
        moves nothing; joining a session, or a peer joining, can.
    */
    constexpr double beatTolerance = 0.0002;

    juce::String hexOf (const ableton::link::NodeId& id)
    {
        return juce::String::toHexString (id.data(), static_cast<int> (id.size()), 0);
    }
}

struct LinkSession::Impl
{
    Impl()
    {
        link.setNumPeersCallback ([this] (std::size_t) { changed = true; });
        link.setTempoCallback ([this] (double) { changed = true; });
        link.setStartStopCallback ([this] (bool) { changed = true; });
        link.setChannelsChangedCallback ([this] { changed = true; });
    }

    ~Impl()
    {
        link.setNumPeersCallback ([] (std::size_t) {});
        link.setTempoCallback ([] (double) {});
        link.setStartStopCallback ([] (bool) {});
        link.setChannelsChangedCallback ([] {});
        link.enableLinkAudio (false);
        link.enable (false);
    }

    ableton::LinkAudio link { defaultBpm, "live-mix" };
    std::atomic<double> quantum { defaultQuantum };
    std::atomic<bool> changed { false };

    // Where the last description said the beat was, to tell a jump from time passing.
    std::mutex describedLock;
    bool described = false;
    double describedBeat = 0.0;
    double describedBpm = defaultBpm;
    int64_t describedMicros = 0;
};

namespace
{
    class AudioSink final : public LinkSession::Sink
    {
    public:
        AudioSink (ableton::LinkAudio& linkToUse, std::atomic<double>& quantumToUse, const juce::String& name)
            : link (linkToUse),
              quantum (quantumToUse),
              sink (linkToUse, name.toStdString(), static_cast<size_t> (sinkFrames) * 2)
        {
        }

        bool write (const float* interleaved, uint32_t frames, uint32_t channels,
                    uint32_t sampleRate, int64_t atMicros) override
        {
            if (channels < 1 || channels > 2 || sampleRate == 0)
                return false;

            bool sent = frames > 0;
            for (uint32_t done = 0; done < frames; done += sinkFrames)
            {
                const auto count = juce::jmin (sinkFrames, frames - done);
                const auto begins = atMicros + static_cast<int64_t> (std::llround (1.0e6 * done / sampleRate));
                sent = writeBlock (interleaved + static_cast<size_t> (done) * channels, count, channels, sampleRate, begins) && sent;
            }
            return sent;
        }

    private:
        bool writeBlock (const float* interleaved, uint32_t frames, uint32_t channels,
                         uint32_t sampleRate, int64_t atMicros)
        {
            ableton::LinkAudioSink::BufferHandle buffer (sink);
            if (! buffer)
                return false;

            const auto samples = static_cast<size_t> (frames) * channels;
            if (buffer.maxNumSamples < samples)
                return false;
            for (size_t index = 0; index < samples; ++index)
                buffer.samples[index] = ableton::util::floatToInt16 (interleaved[index]);

            // The session as it is now, and the beat this block is heard at.
            const auto state = link.captureAppSessionState();
            const auto bars = quantum.load();
            return buffer.commit (state, state.beatAtTime (Micros (atMicros), bars), bars, frames, channels, sampleRate);
        }

        ableton::LinkAudio& link;
        std::atomic<double>& quantum;
        ableton::LinkAudioSink sink;
    };
}

//==============================================================================
bool LinkSession::available() noexcept { return true; }
juce::String LinkSession::version() { return LIVE_MIX_HOST_LINK_VERSION; }

int64_t LinkSession::micros() noexcept
{
    return ableton::Link::Clock().micros().count();
}

LinkSession::LinkSession() : impl (std::make_unique<Impl>()) {}
LinkSession::~LinkSession() = default;

void LinkSession::apply (const juce::var& settings)
{
    auto& link = impl->link;

    if (settings.hasProperty ("name"))
        link.setPeerName (settings["name"].toString().toStdString());

    if (settings.hasProperty ("quantum"))
    {
        const auto quantum = static_cast<double> (settings["quantum"]);
        if (std::isfinite (quantum) && quantum >= 1.0 && quantum <= 64.0)
            impl->quantum = quantum;
    }

    if (settings.hasProperty ("startStopSync"))
        link.enableStartStopSync (static_cast<bool> (settings["startStopSync"]));

    if (settings.hasProperty ("bpm"))
    {
        const auto bpm = static_cast<double> (settings["bpm"]);
        if (std::isfinite (bpm))
        {
            auto state = link.captureAppSessionState();
            state.setTempo (juce::jlimit (minBpm, maxBpm, bpm), link.clock().micros());
            link.commitAppSessionState (state);
        }
    }

    if (settings.hasProperty ("enabled"))
        link.enable (static_cast<bool> (settings["enabled"]));

    if (settings.hasProperty ("audio"))
        link.enableLinkAudio (static_cast<bool> (settings["audio"]));

    // Asking with nothing to change is a read: it announces nothing.
    if (const auto* fields = settings.getDynamicObject(); fields != nullptr && ! fields->getProperties().isEmpty())
        impl->changed = true;
}

juce::var LinkSession::describe()
{
    auto& link = impl->link;
    const auto state = link.captureAppSessionState();
    const auto now = link.clock().micros();
    const auto quantum = impl->quantum.load();
    const auto beat = state.beatAtTime (now, quantum);

    {
        const std::lock_guard<std::mutex> lock (impl->describedLock);
        impl->described = true;
        impl->describedBeat = beat;
        impl->describedBpm = state.tempo();
        impl->describedMicros = now.count();
    }

    juce::Array<juce::var> channels;
    if (link.isLinkAudioEnabled())
    {
        for (const auto& channel : link.channels())
        {
            auto* entry = new juce::DynamicObject();
            entry->setProperty ("id", hexOf (channel.id));
            entry->setProperty ("name", juce::String (channel.name));
            entry->setProperty ("peer", hexOf (channel.peerId));
            entry->setProperty ("peerName", juce::String (channel.peerName));
            channels.add (juce::var (entry));
        }
    }

    auto* result = new juce::DynamicObject();
    result->setProperty ("available", true);
    result->setProperty ("enabled", link.isEnabled());
    result->setProperty ("name", juce::String (link.peerName()));
    result->setProperty ("peers", static_cast<int> (link.numPeers()));
    result->setProperty ("bpm", state.tempo());
    result->setProperty ("quantum", quantum);
    result->setProperty ("beat", beat);
    result->setProperty ("micros", static_cast<juce::int64> (now.count()));
    result->setProperty ("playing", state.isPlaying());
    result->setProperty ("playingAtMicros", static_cast<juce::int64> (state.timeForIsPlaying().count()));
    result->setProperty ("startStopSync", link.isStartStopSyncEnabled());
    result->setProperty ("audio", link.isLinkAudioEnabled());
    result->setProperty ("channels", channels);
    return juce::var (result);
}

int64_t LinkSession::requestBeat (double beat, int64_t atMicros, std::optional<bool> playing)
{
    auto& link = impl->link;
    const auto quantum = impl->quantum.load();
    const Micros at (atMicros);

    auto state = link.captureAppSessionState();
    if (playing.has_value() && *playing)
        state.setIsPlayingAndRequestBeatAtTime (true, at, beat, quantum);
    else
    {
        if (playing.has_value())
            state.setIsPlaying (false, at);
        state.requestBeatAtTime (beat, at, quantum);
    }
    link.commitAppSessionState (state);
    impl->changed = true;

    return link.captureAppSessionState().timeAtBeat (beat, quantum).count();
}

int64_t LinkSession::followStart (double beat)
{
    auto& link = impl->link;
    const auto quantum = impl->quantum.load();

    auto state = link.captureAppSessionState();
    state.requestBeatAtStartPlayingTime (beat, quantum);
    link.commitAppSessionState (state);
    impl->changed = true;

    return link.captureAppSessionState().timeAtBeat (beat, quantum).count();
}

void LinkSession::stop (int64_t atMicros)
{
    auto& link = impl->link;
    auto state = link.captureAppSessionState();
    state.setIsPlaying (false, Micros (atMicros));
    link.commitAppSessionState (state);
    impl->changed = true;
}

bool LinkSession::takeChanged()
{
    if (impl->changed.exchange (false))
        return true;

    auto& link = impl->link;
    const std::lock_guard<std::mutex> lock (impl->describedLock);
    if (! impl->described)
        return false;

    const auto now = link.clock().micros();
    const auto beat = link.captureAppSessionState().beatAtTime (now, impl->quantum.load());
    const auto expected = impl->describedBeat
                          + static_cast<double> (now.count() - impl->describedMicros) * impl->describedBpm / 6.0e7;
    return std::abs (beat - expected) > beatTolerance;
}

std::unique_ptr<LinkSession::Sink> LinkSession::openSink (const juce::String& name)
{
    return std::make_unique<AudioSink> (impl->link, impl->quantum, name);
}

} // namespace livemix

#else // LIVE_MIX_HOST_LINK

namespace livemix
{

struct LinkSession::Impl {};

bool LinkSession::available() noexcept { return false; }
juce::String LinkSession::version() { return {}; }
int64_t LinkSession::micros() noexcept { return juce::Time::getHighResolutionTicks() * 1000000 / juce::Time::getHighResolutionTicksPerSecond(); }

LinkSession::LinkSession() = default;
LinkSession::~LinkSession() = default;

void LinkSession::apply (const juce::var&) {}

juce::var LinkSession::describe()
{
    auto* result = new juce::DynamicObject();
    result->setProperty ("available", false);
    result->setProperty ("enabled", false);
    return juce::var (result);
}

int64_t LinkSession::requestBeat (double, int64_t atMicros, std::optional<bool>) { return atMicros; }
int64_t LinkSession::followStart (double) { return micros(); }
void LinkSession::stop (int64_t) {}
bool LinkSession::takeChanged() { return false; }
std::unique_ptr<LinkSession::Sink> LinkSession::openSink (const juce::String&) { return nullptr; }

} // namespace livemix

#endif
