// live-mix-link-peer: one Ableton Link peer behind a console, for the host's
// tests. It is Ableton's library and nothing else, so what the host says to a
// Link session is checked against the implementation Live itself uses.
//
// Commands, one per line on standard input:
//
//   enable 0|1        join or leave the session
//   tempo <bpm>       set the session tempo
//   play <beat>       start the shared transport with <beat> now
//   stop              stop the shared transport
//   sync 0|1          start/stop sync
//   audio 0|1         Link Audio
//   listen <name>     receive the channel called <name>
//   unlisten          stop receiving
//   send <rate> <channels> <name>
//                     announce a channel called <name> and send it: silence,
//                     with one sample at 0.9 on the left on every beat and one
//                     at -0.9 on the right (stereo) on the first beat of a bar
//   unsend            stop sending
//   state             print the state now
//   quit
//
// Every answer is one line of JSON on standard output: `{"state":{…}}` after
// a command and whenever the session changes, `{"impulse":{…}}` for every
// sample of a received channel louder than 0.5 (where on the beat grid it
// fell), and `{"received":{…}}` once a second while audio arrives.

#include <ableton/LinkAudio.hpp>

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <memory>
#include <mutex>
#include <optional>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

namespace
{

constexpr double quantum = 4.0;

std::mutex outputLock;

void print (const std::string& line)
{
    const std::lock_guard<std::mutex> lock (outputLock);
    std::cout << line << std::endl;
}

std::string quoted (const std::string& text)
{
    std::ostringstream out;
    out << '"';
    for (const char c : text)
    {
        if (c == '"' || c == '\\')
            out << '\\' << c;
        else if (static_cast<unsigned char> (c) < 0x20)
            out << ' ';
        else
            out << c;
    }
    out << '"';
    return out.str();
}

/**
    A channel this peer sends, in step with the clock as an audio device
    would ask for it: blocks of a hundredth of a second, each stamped with the
    beat its first frame is heard on.
*/
class Sender
{
public:
    Sender (ableton::LinkAudio& linkToUse, const std::string& name, std::uint32_t sampleRateToUse, std::size_t channelsToUse)
        : link (linkToUse),
          sampleRate (sampleRateToUse),
          channels (channelsToUse),
          frames (sampleRateToUse / 100),
          sink (linkToUse, name, frames * channelsToUse),
          thread ([this] { run(); })
    {
    }

    ~Sender()
    {
        running = false;
        thread.join();
    }

private:
    void run()
    {
        using Micros = std::chrono::microseconds;
        const auto start = link.clock().micros();
        std::vector<std::int16_t> samples (frames * channels);
        auto previous = std::floor (link.captureAppSessionState().beatAtTime (start, quantum));

        for (std::uint64_t block = 0; running; ++block)
        {
            const auto microsAt = [&] (std::uint64_t frame)
            {
                return start + Micros (std::llround (1.0e6 * static_cast<double> (block * frames + frame) / sampleRate));
            };

            const auto begins = microsAt (0);
            const auto wait = begins - link.clock().micros();
            if (wait.count() > 0)
                std::this_thread::sleep_for (wait);

            const auto state = link.captureAppSessionState();
            std::fill (samples.begin(), samples.end(), std::int16_t { 0 });
            for (std::size_t frame = 0; frame < frames; ++frame)
            {
                // The first frame at or past a beat carries it.
                const auto beat = std::floor (state.beatAtTime (microsAt (frame), quantum));
                if (beat != previous)
                {
                    samples[frame * channels] = 29491;
                    if (channels > 1 && std::fmod (std::fmod (beat, quantum) + quantum, quantum) == 0.0)
                        samples[frame * channels + 1] = -29491;
                }
                previous = beat;
            }

            // Nobody listening: nothing to write into, and the clock goes on.
            ableton::LinkAudioSink::BufferHandle buffer (sink);
            if (! buffer || buffer.maxNumSamples < samples.size())
                continue;
            std::copy (samples.begin(), samples.end(), buffer.samples);
            buffer.commit (state, state.beatAtTime (begins, quantum), quantum, frames, channels, sampleRate);
        }
    }

    ableton::LinkAudio& link;
    const std::uint32_t sampleRate;
    const std::size_t channels;
    const std::size_t frames;
    ableton::LinkAudioSink sink;
    std::atomic<bool> running { true };
    std::thread thread;
};

struct Peer
{
    explicit Peer (const std::string& name) : link (120.0, name)
    {
        link.setNumPeersCallback ([this] (std::size_t) { printState(); });
        link.setTempoCallback ([this] (double) { printState(); });
        link.setStartStopCallback ([this] (bool) { printState(); });
        link.setChannelsChangedCallback ([this] { printState(); });
    }

    ~Peer()
    {
        sender.reset();
        source.reset();
        link.setNumPeersCallback ([] (std::size_t) {});
        link.setTempoCallback ([] (double) {});
        link.setStartStopCallback ([] (bool) {});
        link.setChannelsChangedCallback ([] {});
    }

    void printState()
    {
        const auto state = link.captureAppSessionState();
        const auto now = link.clock().micros();
        std::ostringstream out;
        out << std::setprecision (15);
        out << "{\"state\":{\"enabled\":" << (link.isEnabled() ? "true" : "false")
            << ",\"peers\":" << link.numPeers()
            << ",\"bpm\":" << state.tempo()
            << ",\"beat\":" << state.beatAtTime (now, quantum)
            << ",\"phase\":" << state.phaseAtTime (now, quantum)
            << ",\"micros\":" << now.count()
            << ",\"playing\":" << (state.isPlaying() ? "true" : "false")
            << ",\"playingAtMicros\":" << state.timeForIsPlaying().count()
            << ",\"startStopSync\":" << (link.isStartStopSyncEnabled() ? "true" : "false")
            << ",\"audio\":" << (link.isLinkAudioEnabled() ? "true" : "false")
            << ",\"channels\":[";
        bool first = true;
        if (link.isLinkAudioEnabled())
        {
            for (const auto& channel : link.channels())
            {
                out << (first ? "" : ",") << "{\"name\":" << quoted (channel.name)
                    << ",\"peerName\":" << quoted (channel.peerName) << "}";
                first = false;
            }
        }
        out << "]}}";
        print (out.str());
    }

    bool listen (const std::string& name)
    {
        for (const auto& channel : link.channels())
        {
            if (channel.name != name)
                continue;
            source = std::make_unique<ableton::LinkAudioSource> (
                link, channel.id,
                [this] (ableton::LinkAudioSource::BufferHandle buffer) { received (buffer); });
            return true;
        }
        return false;
    }

    void received (const ableton::LinkAudioSource::BufferHandle& buffer)
    {
        const auto& info = buffer.info;
        const auto state = link.captureAppSessionState();
        const auto begin = info.beginBeats (state, quantum);
        const auto beatsPerFrame = info.tempo / 60.0 / static_cast<double> (info.sampleRate);

        buffers += 1;
        frames += info.numFrames;

        for (std::size_t frame = 0; frame < info.numFrames; ++frame)
        {
            for (std::size_t channel = 0; channel < info.numChannels; ++channel)
            {
                const auto sample = buffer.samples[frame * info.numChannels + channel];
                if (std::abs (static_cast<int> (sample)) <= 16384)
                    continue;
                std::ostringstream out;
                out << std::setprecision (15);
                out << "{\"impulse\":{\"channel\":" << channel
                    << ",\"value\":" << static_cast<double> (sample) / 32768.0
                    << ",\"sampleRate\":" << info.sampleRate
                    << ",\"channels\":" << info.numChannels
                    << ",\"tempo\":" << info.tempo;
                if (begin.has_value())
                {
                    const auto beat = *begin + static_cast<double> (frame) * beatsPerFrame;
                    out << ",\"beat\":" << beat
                        << ",\"phase\":" << std::fmod (std::fmod (beat, quantum) + quantum, quantum);
                }
                out << "}}";
                print (out.str());
            }
        }

        const auto now = std::chrono::steady_clock::now();
        if (now - lastReport >= std::chrono::seconds (1))
        {
            lastReport = now;
            std::ostringstream out;
            out << "{\"received\":{\"buffers\":" << buffers << ",\"frames\":" << frames
                << ",\"sampleRate\":" << info.sampleRate << ",\"channels\":" << info.numChannels
                << ",\"sameSession\":" << (begin.has_value() ? "true" : "false") << "}}";
            print (out.str());
        }
    }

    ableton::LinkAudio link;
    std::unique_ptr<ableton::LinkAudioSource> source;
    std::unique_ptr<Sender> sender;
    // Touched on Link's thread only.
    std::uint64_t buffers = 0;
    std::uint64_t frames = 0;
    std::chrono::steady_clock::time_point lastReport {};
};

} // namespace

int main (int argc, char** argv)
{
    Peer peer (argc > 1 ? argv[1] : "live-mix-link-peer");
    print ("{\"ready\":true}");

    std::string line;
    while (std::getline (std::cin, line))
    {
        std::istringstream words (line);
        std::string command;
        words >> command;

        if (command == "quit")
            break;

        if (command == "enable")
        {
            int on = 0;
            words >> on;
            peer.link.enable (on != 0);
        }
        else if (command == "tempo")
        {
            double bpm = 120.0;
            words >> bpm;
            auto state = peer.link.captureAppSessionState();
            state.setTempo (bpm, peer.link.clock().micros());
            peer.link.commitAppSessionState (state);
        }
        else if (command == "play")
        {
            double beat = 0.0;
            words >> beat;
            auto state = peer.link.captureAppSessionState();
            state.setIsPlayingAndRequestBeatAtTime (true, peer.link.clock().micros(), beat, quantum);
            peer.link.commitAppSessionState (state);
        }
        else if (command == "stop")
        {
            auto state = peer.link.captureAppSessionState();
            state.setIsPlaying (false, peer.link.clock().micros());
            peer.link.commitAppSessionState (state);
        }
        else if (command == "sync")
        {
            int on = 0;
            words >> on;
            peer.link.enableStartStopSync (on != 0);
        }
        else if (command == "audio")
        {
            int on = 0;
            words >> on;
            peer.link.enableLinkAudio (on != 0);
        }
        else if (command == "listen")
        {
            std::string name;
            std::getline (words >> std::ws, name);
            print (std::string ("{\"listening\":") + (peer.listen (name) ? "true" : "false") + "}");
        }
        else if (command == "unlisten")
        {
            peer.source.reset();
        }
        else if (command == "send")
        {
            std::uint32_t sampleRate = 48000;
            std::size_t channels = 2;
            std::string name;
            words >> sampleRate >> channels;
            std::getline (words >> std::ws, name);
            peer.sender.reset();
            if (sampleRate >= 8000 && (channels == 1 || channels == 2) && ! name.empty())
                peer.sender = std::make_unique<Sender> (peer.link, name, sampleRate, channels);
        }
        else if (command == "unsend")
        {
            peer.sender.reset();
        }

        peer.printState();
    }

    return 0;
}
