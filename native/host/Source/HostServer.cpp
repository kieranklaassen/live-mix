#include "HostServer.h"

#include "ScanWorker.h"

#include <cmath>
#include <condition_variable>
#include <cstring>
#include <deque>
#include <mutex>
#include <optional>
#include <thread>

#if ! JUCE_WINDOWS
 #include <unistd.h>
#endif

namespace livemix
{

namespace
{
    constexpr uint32_t messageProcess = 1;
    constexpr uint32_t messageMidi = 2;
    constexpr uint32_t messageLinkAudio = 3;
    constexpr uint32_t messageLinkAudioIn = 4;
    constexpr size_t audioHeaderBytes = 16;
    /** A Link Audio block: the 16 bytes above (type, frames, channels, sample rate), then when it is heard. */
    constexpr size_t linkAudioHeaderBytes = audioHeaderBytes + sizeof (double);
    /** A received Link Audio block: the same, then the sender's count of the block. */
    constexpr size_t linkAudioInHeaderBytes = linkAudioHeaderBytes + sizeof (double);
    /** Received blocks waiting for the page above which new ones are dropped: about a second. */
    constexpr size_t linkAudioInMaxQueued = 128;
    constexpr uint32_t maxFramesPerMessage = 16384;
    constexpr uint32_t maxChannels = 8;
    constexpr int changeTimerHz = 30;
    /** How long one plug-in may take to be scanned before the scan goes on without it. */
    constexpr double scanSecondsPerPlugin = 120.0;
    /** How long a plug-in may keep its scan waiting, using no processor: for something that never comes. */
    constexpr double scanSecondsIdle = 10.0;
    /** How often a scan in progress is saved, so a host that is quit keeps what it found. */
    constexpr juce::uint32 scanSaveMillis = 5000;
    /**
        How many plug-ins one scan worker takes before the next is started.
        Plug-ins leave threads and memory behind in the process that loaded
        them, and enough of them end it whichever one comes next.
    */
    constexpr int scanPluginsPerWorker = 40;
    /** Scan workers in a row that may end without taking up a plug-in before the scan gives up. */
    constexpr int scanEmptyWorkers = 3;

    juce::var describePlugin (const juce::PluginDescription& description)
    {
        auto* entry = new juce::DynamicObject();
        entry->setProperty ("id", description.createIdentifierString());
        entry->setProperty ("name", description.name);
        entry->setProperty ("vendor", description.manufacturerName);
        entry->setProperty ("format", description.pluginFormatName);
        entry->setProperty ("category", description.category);
        entry->setProperty ("version", description.version);
        entry->setProperty ("file", description.fileOrIdentifier);
        entry->setProperty ("isInstrument", description.isInstrument);
        entry->setProperty ("inputs", description.numInputChannels);
        entry->setProperty ("outputs", description.numOutputChannels);
        return juce::var (entry);
    }

    juce::String originName (PluginSlot::Origin origin)
    {
        return origin == PluginSlot::Origin::client ? "client" : "plugin";
    }
}

/**
    One `scan` request. The plug-ins are scanned by a worker, the host started
    a second time (ScanWorker.h), so one that crashes or never answers ends
    the worker and not the host: the scan leaves it out and goes on with a new
    worker.
*/
struct HostServer::ScanJob
{
    ~ScanJob()
    {
        endWorker();
        list.deleteFile();
        results.deleteFile();
    }

    void endWorker()
    {
        if (worker == nullptr)
            return;
        if (worker->isRunning())
            worker->kill();
        // Collects the ended process, so none is left behind for each crash.
        worker->waitForProcessToFinish (2000);
        worker.reset();
    }

    Connection connection;
    juce::var id;
    juce::Array<juce::AudioPluginFormat*> pending;
    juce::FileSearchPath extraPaths;
    bool useDefaultPaths = true;
    double secondsPerPlugin = scanSecondsPerPlugin;
    double secondsIdle = scanSecondsIdle;
    int pluginsPerWorker = scanPluginsPerWorker;

    /** The format being scanned, and what of it is neither known nor left out. */
    juce::String format;
    juce::StringArray queue;
    /** How many of the queue are settled: found, failed or left out. */
    int settled = 0;

    std::unique_ptr<juce::ChildProcess> worker;
    /** The queue as the worker reads it, and what the worker writes back. */
    juce::File list, results;
    juce::int64 resultsRead = 0;
    /** The plug-in the worker is in (its place in the queue), or -1 between two. */
    int current = -1;
    /** When the worker was started or last wrote a line, whichever is later. */
    juce::uint32 lastWord = 0;
    /** How many plug-ins the running worker has taken up, and how many it is through. */
    int workerBegan = 0, workerDone = 0;
    int emptyWorkers = 0;
    /** A plug-in a worker crashed in after others, given one more go at the head of a worker of its own. */
    int secondGo = -1;

    juce::uint32 lastSaved = 0;
};

//==============================================================================
HostServer::HostServer (Options optionsToUse)
    : options (std::move (optionsToUse)),
      server ([this] (const juce::String&, const juce::StringPairArray& query)
              {
                  return options.token.isNotEmpty() && query["token"] == options.token;
              },
              [this] (Connection connection, const juce::String& path, const juce::StringPairArray& query)
              {
                  serve (std::move (connection), path, query);
              })
{
    juce::addDefaultFormatsToManager (formats);
    loadPluginCache();
}

HostServer::~HostServer()
{
    stopTimer();
    // Join every connection thread before anything they use goes away.
    server.stop();
    scan.reset();

    std::map<juce::String, std::shared_ptr<PluginSlot>> remaining;
    {
        const juce::ScopedLock lock (slotLock);
        remaining.swap (slots);
    }
    for (auto& [id, slot] : remaining)
        slot->shutdown();
}

bool HostServer::start()
{
    if (! server.start (options.port))
        return false;
    startTimerHz (changeTimerHz);
    return true;
}

//==============================================================================
void HostServer::serve (Connection connection, const juce::String& path, const juce::StringPairArray& query)
{
    if (path == "/control")
        serveControl (std::move (connection));
    else if (path == "/audio")
        serveAudio (std::move (connection), query["slot"], juce::jlimit (1, static_cast<int> (maxChannels), query.getValue ("out", "2").getIntValue()));
    else if (path == "/link-audio")
        serveLinkAudio (std::move (connection), query.getValue ("name", "Main"));
    else if (path == "/link-audio-in")
        serveLinkAudioIn (std::move (connection), query["channel"]);
    else
        connection->close();
}

void HostServer::serveControl (Connection connection)
{
    juce::WeakReference<HostServer> weak (this);
    WsMessage message;

    while (connection->read (message))
    {
        if (message.binary)
            continue;
        auto request = juce::JSON::parse (message.data.toString());
        // Answered here, on the connection's own thread: the page halves the
        // round trip to find its clock's offset from Link's, and a wait for
        // the message thread would be counted as distance.
        if (request["method"].toString() == "linkPing")
        {
            auto* result = new juce::DynamicObject();
            result->setProperty ("micros", static_cast<juce::int64> (LinkSession::micros()));
            reply (connection, request["id"], juce::var (result));
            continue;
        }
        juce::MessageManager::callAsync ([weak, connection, request = std::move (request)]
        {
            if (weak != nullptr)
                weak->handleRequest (connection, request);
        });
    }

    juce::MessageManager::callAsync ([weak, connection]
    {
        if (weak != nullptr)
            weak->controlClosed (connection);
    });
}

void HostServer::serveAudio (Connection connection, const juce::String& slotId, int outputChannels)
{
    const auto slot = findSlot (slotId);
    if (slot == nullptr)
    {
        connection->close();
        return;
    }

    {
        const juce::ScopedLock lock (slotLock);
        // Unloaded between the lookup and here: nobody is left to close us.
        if (slots.find (slotId) == slots.end())
        {
            connection->close();
            return;
        }
        audioConnections.emplace (slotId, connection);
    }

    const struct Forget
    {
        HostServer& server;
        const juce::String& slotId;
        const Connection& connection;

        ~Forget()
        {
            const juce::ScopedLock lock (server.slotLock);
            const auto range = server.audioConnections.equal_range (slotId);
            for (auto entry = range.first; entry != range.second;)
                entry = entry->second.lock() == connection ? server.audioConnections.erase (entry) : std::next (entry);
        }
    } forget { *this, slotId, connection };

    std::vector<float> reply;
    WsMessage message;

    while (connection->read (message))
    {
        const auto size = message.data.getSize();
        if (! message.binary || size < audioHeaderBytes)
            continue;

        uint32_t header[4];
        std::memcpy (header, message.data.getData(), audioHeaderBytes);
        const auto* payload = static_cast<const uint8_t*> (message.data.getData()) + audioHeaderBytes;

        if (header[0] == messageMidi)
        {
            slot->addMidi (payload, static_cast<int> (juce::jmin (static_cast<size_t> (header[1]), size - audioHeaderBytes)));
            continue;
        }
        if (header[0] != messageProcess)
            continue;

        const auto frames = header[1];
        const auto inputChannels = header[2];
        if (frames == 0 || frames > maxFramesPerMessage || inputChannels > maxChannels
            || size != audioHeaderBytes + static_cast<size_t> (frames) * inputChannels * sizeof (float))
        {
            connection->close();
            break;
        }

        const auto headerFloats = audioHeaderBytes / sizeof (float);
        reply.resize (headerFloats + static_cast<size_t> (frames) * static_cast<size_t> (outputChannels));
        const uint32_t replyHeader[4] = { messageProcess, frames, static_cast<uint32_t> (outputChannels), header[3] };
        std::memcpy (reply.data(), replyHeader, audioHeaderBytes);

        slot->process (reinterpret_cast<const float*> (payload), static_cast<int> (inputChannels),
                       static_cast<int> (frames), reply.data() + headerFloats, outputChannels);

        if (! connection->sendBinary (reply.data(), reply.size() * sizeof (float)))
            break;
    }
}

void HostServer::serveLinkAudio (Connection connection, const juce::String& channelName)
{
    if (! LinkSession::available())
    {
        connection->close();
        return;
    }

    // The channel is in the session for as long as this connection is open.
    const auto sink = linkSession().openSink (channelName);
    WsMessage message;

    while (sink != nullptr && connection->read (message))
    {
        const auto size = message.data.getSize();
        if (! message.binary || size < linkAudioHeaderBytes)
            continue;

        uint32_t header[4];
        double atMicros = 0.0;
        std::memcpy (header, message.data.getData(), audioHeaderBytes);
        std::memcpy (&atMicros, static_cast<const uint8_t*> (message.data.getData()) + audioHeaderBytes, sizeof (double));
        if (header[0] != messageLinkAudio)
            continue;

        const auto frames = header[1];
        const auto channels = header[2];
        const auto sampleRate = header[3];
        if (frames == 0 || frames > maxFramesPerMessage || channels < 1 || channels > 2
            || sampleRate < 8000 || sampleRate > 768000 || ! std::isfinite (atMicros)
            || size != linkAudioHeaderBytes + static_cast<size_t> (frames) * channels * sizeof (float))
        {
            connection->close();
            break;
        }

        const auto* samples = static_cast<const uint8_t*> (message.data.getData()) + linkAudioHeaderBytes;
        sink->write (reinterpret_cast<const float*> (samples), frames, channels, sampleRate,
                     static_cast<int64_t> (std::llround (atMicros)));
    }
}

void HostServer::serveLinkAudioIn (Connection connection, const juce::String& channelId)
{
    if (! LinkSession::available())
    {
        connection->close();
        return;
    }

    // Blocks arrive on Link's thread, which must not wait for a page that is
    // slow to read: they are queued here and written by a thread of their own.
    struct Outbox
    {
        std::mutex lock;
        std::condition_variable ready;
        std::deque<juce::MemoryBlock> blocks;
        bool finished = false;
    };
    const auto outbox = std::make_shared<Outbox>();

    auto source = linkSession().openSource (channelId, [outbox] (const float* interleaved, uint32_t frames, uint32_t channels,
                                                                  uint32_t sampleRate, int64_t atMicros, uint64_t count)
    {
        const auto sampleBytes = static_cast<size_t> (frames) * channels * sizeof (float);
        juce::MemoryBlock block (linkAudioInHeaderBytes + sampleBytes);
        const uint32_t header[4] = { messageLinkAudioIn, frames, channels, sampleRate };
        const double times[2] = { static_cast<double> (atMicros), static_cast<double> (count) };
        auto* bytes = static_cast<uint8_t*> (block.getData());
        std::memcpy (bytes, header, audioHeaderBytes);
        std::memcpy (bytes + audioHeaderBytes, times, sizeof (times));
        std::memcpy (bytes + linkAudioInHeaderBytes, interleaved, sampleBytes);

        {
            const std::lock_guard<std::mutex> lock (outbox->lock);
            // A page that has stopped reading gets what is new when it reads again, not a backlog.
            if (outbox->finished || outbox->blocks.size() >= linkAudioInMaxQueued)
                return;
            outbox->blocks.push_back (std::move (block));
        }
        outbox->ready.notify_one();
    });

    // No such channel in the session (it went, or Link Audio is off).
    if (source == nullptr)
    {
        connection->close();
        return;
    }

    std::thread writer ([outbox, connection]
    {
        for (;;)
        {
            juce::MemoryBlock block;
            {
                std::unique_lock<std::mutex> lock (outbox->lock);
                outbox->ready.wait (lock, [&outbox] { return outbox->finished || ! outbox->blocks.empty(); });
                if (outbox->finished)
                    return;
                block = std::move (outbox->blocks.front());
                outbox->blocks.pop_front();
            }
            if (! connection->sendBinary (block.getData(), block.getSize()))
                return;
        }
    });

    // The page says nothing on this connection; reading it is how its going is noticed.
    WsMessage message;
    while (connection->read (message))
    {
    }

    // The peer is told nobody listens before the queue is let go.
    source.reset();
    {
        const std::lock_guard<std::mutex> lock (outbox->lock);
        outbox->finished = true;
    }
    outbox->ready.notify_one();
    writer.join();
}

//==============================================================================
void HostServer::reply (const Connection& connection, const juce::var& id, const juce::var& result)
{
    if (id.isVoid())
        return;
    auto* message = new juce::DynamicObject();
    message->setProperty ("id", id);
    message->setProperty ("result", result);
    connection->sendText (juce::JSON::toString (juce::var (message), true));
}

void HostServer::fail (const Connection& connection, const juce::var& id, const juce::String& text)
{
    if (id.isVoid())
        return;
    auto* error = new juce::DynamicObject();
    error->setProperty ("message", text);
    auto* message = new juce::DynamicObject();
    message->setProperty ("id", id);
    message->setProperty ("error", juce::var (error));
    connection->sendText (juce::JSON::toString (juce::var (message), true));
}

void HostServer::emit (const Connection& connection, const juce::String& event, juce::DynamicObject* fields)
{
    const juce::var holder (fields);
    if (connection == nullptr || ! connection->isOpen())
        return;
    fields->setProperty ("event", event);
    connection->sendText (juce::JSON::toString (holder, true));
}

juce::var HostServer::hello() const
{
    juce::Array<juce::var> formatNames;
    for (auto* format : formats.getFormats())
        formatNames.add (format->getName());

    auto* result = new juce::DynamicObject();
    result->setProperty ("protocol", protocolVersion);
    result->setProperty ("name", "live-mix-plugin-host");
    result->setProperty ("version", JUCE_APPLICATION_VERSION_STRING);
    result->setProperty ("juce", LIVE_MIX_HOST_JUCE_VERSION);
    result->setProperty ("formats", formatNames);
    result->setProperty ("scanUnfinished", scanUnfinished);
    result->setProperty ("link", LinkSession::available());
    if (LinkSession::available())
    {
        result->setProperty ("linkVersion", LinkSession::version());
        // A page can listen to a peer's Link Audio channel (`/link-audio-in`).
        result->setProperty ("linkAudioReceive", true);
    }
   #if JUCE_MAC
    result->setProperty ("platform", "mac");
   #elif JUCE_WINDOWS
    result->setProperty ("platform", "windows");
   #else
    result->setProperty ("platform", "linux");
   #endif
    return juce::var (result);
}

juce::var HostServer::pluginList() const
{
    juce::Array<juce::var> list;
    for (const auto& description : knownPlugins.getTypes())
        list.add (describePlugin (description));
    return list;
}

std::shared_ptr<PluginSlot> HostServer::findSlot (const juce::String& slotId) const
{
    const juce::ScopedLock lock (slotLock);
    const auto found = slots.find (slotId);
    return found == slots.end() ? nullptr : found->second;
}

std::shared_ptr<PluginSlot> HostServer::requireSlot (const Connection& connection, const juce::var& id, const juce::var& params)
{
    auto slot = findSlot (params["slot"].toString());
    if (slot == nullptr)
        fail (connection, id, "unknown slot \"" + params["slot"].toString() + "\"");
    return slot;
}

void HostServer::handleRequest (const Connection& connection, const juce::var& request)
{
    const auto id = request["id"];
    const auto method = request["method"].toString();
    const auto params = request["params"];

    if (method == "hello")
    {
        reply (connection, id, hello());
    }
    else if (method == "plugins")
    {
        auto* result = new juce::DynamicObject();
        describeKnown (*result);
        reply (connection, id, juce::var (result));
    }
    else if (method == "scan")
    {
        startScan (connection, id, params);
    }
    else if (method == "load")
    {
        load (connection, id, params);
    }
    else if (method == "unload")
    {
        unload (params["slot"].toString());
        reply (connection, id, juce::var (new juce::DynamicObject()));
    }
    else if (method == "setParam")
    {
        if (auto slot = findSlot (params["slot"].toString()))
            slot->setParameter (static_cast<int> (params["index"]), static_cast<float> (static_cast<double> (params["value"])));
        reply (connection, id, juce::var (new juce::DynamicObject()));
    }
    else if (method == "getParams")
    {
        if (auto slot = requireSlot (connection, id, params))
        {
            auto* result = new juce::DynamicObject();
            result->setProperty ("params", slot->describeParameters());
            reply (connection, id, juce::var (result));
        }
    }
    else if (method == "getState")
    {
        if (auto slot = requireSlot (connection, id, params))
        {
            auto* result = new juce::DynamicObject();
            result->setProperty ("state", slot->getState());
            reply (connection, id, juce::var (result));
        }
    }
    else if (method == "setState")
    {
        if (auto slot = requireSlot (connection, id, params))
        {
            if (! slot->setState (params["state"].toString()))
            {
                fail (connection, id, "state is not valid base64");
                return;
            }
            auto* result = new juce::DynamicObject();
            result->setProperty ("params", slot->describeParameters());
            result->setProperty ("latencySamples", slot->latencySamples());
            reply (connection, id, juce::var (result));
        }
    }
    else if (method == "showEditor")
    {
        if (auto slot = requireSlot (connection, id, params))
        {
            auto* result = new juce::DynamicObject();
            result->setProperty ("showing", slot->showEditor());
            reply (connection, id, juce::var (result));
        }
    }
    else if (method == "hideEditor")
    {
        if (auto slot = requireSlot (connection, id, params))
        {
            slot->hideEditor();
            reply (connection, id, juce::var (new juce::DynamicObject()));
        }
    }
    else if (method == "setTransport")
    {
        // Each field is its own: a tempo change must not start a stopped transport.
        const auto bpm = params.hasProperty ("bpm") ? std::optional<double> (static_cast<double> (params["bpm"])) : std::nullopt;
        const auto playing = params.hasProperty ("playing") ? std::optional<bool> (static_cast<bool> (params["playing"])) : std::nullopt;
        std::vector<std::shared_ptr<PluginSlot>> all;
        {
            const juce::ScopedLock lock (slotLock);
            for (auto& [slotId, slot] : slots)
                all.push_back (slot);
        }
        for (auto& slot : all)
            slot->setTransport (bpm, playing);
        reply (connection, id, juce::var (new juce::DynamicObject()));
    }
    else if (method == "link" || method == "linkStart" || method == "linkStop")
    {
        handleLink (connection, id, method, params);
    }
    else
    {
        fail (connection, id, "unknown method \"" + method + "\"");
    }
}

//==============================================================================
LinkSession& HostServer::linkSession()
{
    const juce::ScopedLock lock (linkLock);
    if (link == nullptr)
        link = std::make_unique<LinkSession>();
    return *link;
}

void HostServer::followLink (const Connection& connection)
{
    for (const auto& follower : linkFollowers)
        if (follower.lock() == connection)
            return;
    linkFollowers.push_back (connection);
}

void HostServer::handleLink (const Connection& connection, const juce::var& id, const juce::String& method, const juce::var& params)
{
    if (! LinkSession::available())
    {
        // Asking is not an error: the answer says there is none.
        if (method == "link" && (params.getDynamicObject() == nullptr || params.getDynamicObject()->getProperties().isEmpty()))
            reply (connection, id, LinkSession().describe());
        else
            fail (connection, id, "this host was built without Ableton Link");
        return;
    }

    auto& session = linkSession();
    followLink (connection);

    if (method == "link")
    {
        session.apply (params);
        reply (connection, id, session.describe());
        return;
    }

    if (method == "linkStop")
    {
        session.stop (params.hasProperty ("atMicros") ? static_cast<int64_t> (static_cast<double> (params["atMicros"])) : LinkSession::micros());
        reply (connection, id, session.describe());
        return;
    }

    // linkStart
    const auto beat = static_cast<double> (params["beat"]);
    if (! std::isfinite (beat))
    {
        fail (connection, id, "linkStart needs a beat");
        return;
    }
    int64_t at = 0;
    if (static_cast<bool> (params["follow"]))
    {
        at = session.followStart (beat);
    }
    else
    {
        const auto atMicros = params.hasProperty ("atMicros") ? static_cast<int64_t> (static_cast<double> (params["atMicros"])) : LinkSession::micros();
        const auto playing = params.hasProperty ("playing") ? std::optional<bool> (static_cast<bool> (params["playing"])) : std::nullopt;
        at = session.requestBeat (beat, atMicros, playing);
    }
    auto state = session.describe();
    state.getDynamicObject()->setProperty ("atMicros", static_cast<juce::int64> (at));
    reply (connection, id, state);
}

void HostServer::announceLink()
{
    LinkSession* session = nullptr;
    {
        const juce::ScopedLock lock (linkLock);
        session = link.get();
    }
    if (session == nullptr)
        return;

    std::vector<Connection> open;
    for (const auto& follower : linkFollowers)
        if (auto connection = follower.lock(); connection != nullptr && connection->isOpen())
            open.push_back (std::move (connection));

    if (! session->takeChanged())
        return;

    const auto state = session->describe();
    for (const auto& connection : open)
        emit (connection, "link", state.getDynamicObject()->clone().release());
}

void HostServer::controlClosed (const Connection& connection)
{
    if (scan != nullptr && scan->connection == connection)
    {
        // What it found so far is kept; the list says it is not all of it.
        scan.reset();
        savePluginCache();
    }

    juce::StringArray owned;
    {
        const juce::ScopedLock lock (slotLock);
        for (auto& [slotId, slot] : slots)
            if (slot->owner.lock() == connection)
                owned.add (slotId);
    }
    for (const auto& slotId : owned)
        unload (slotId);

    // The last page that followed Link is gone: leave the session, so a
    // closed page does not keep a silent peer in everybody's count.
    const auto before = linkFollowers.size();
    std::erase_if (linkFollowers, [&connection] (const std::weak_ptr<WsConnection>& follower)
    {
        const auto held = follower.lock();
        return held == nullptr || held == connection;
    });
    if (before > 0 && linkFollowers.empty())
    {
        auto* leave = new juce::DynamicObject();
        leave->setProperty ("enabled", false);
        leave->setProperty ("audio", false);
        linkSession().apply (juce::var (leave));
    }
}

//==============================================================================
void HostServer::startScan (const Connection& connection, const juce::var& id, const juce::var& params)
{
    if (scan != nullptr)
    {
        fail (connection, id, "a scan is already running");
        return;
    }

    scan = std::make_unique<ScanJob>();
    scan->connection = connection;
    scan->id = id;
    scan->useDefaultPaths = ! params.hasProperty ("defaultPaths") || static_cast<bool> (params["defaultPaths"]);
    if (auto* paths = params["paths"].getArray())
        for (const auto& path : *paths)
            scan->extraPaths.add (juce::File (path.toString()));
    if (const auto seconds = static_cast<double> (params["timeout"]); seconds > 0.0)
        scan->secondsPerPlugin = seconds;
    if (const auto seconds = static_cast<double> (params["idle"]); seconds > 0.0)
        scan->secondsIdle = seconds;
    if (const auto count = static_cast<int> (params["perProcess"]); count > 0)
        scan->pluginsPerWorker = count;
    for (auto* format : formats.getFormats())
    {
        // Audio Units are registered with the system rather than found in
        // folders, so a scan of named folders only leaves them out.
        if (! scan->useDefaultPaths && format->getName() == "AudioUnit")
            continue;
        scan->pending.add (format);
    }

    if (static_cast<bool> (params["rescan"]))
    {
        knownPlugins.clear();
        knownPlugins.clearBlacklistedFiles();
        couldNotLoad.clear();
    }

    // Plug-ins to give another go: no longer held against them, so this scan
    // meets them again like any it has not seen.
    if (auto* again = params["retry"].getArray())
    {
        for (const auto& entry : *again)
        {
            knownPlugins.removeFromBlacklist (entry.toString());
            couldNotLoad.removeString (entry.toString());
        }
    }

    const auto scratch = juce::File::getSpecialLocation (juce::File::tempDirectory);
    const auto stamp = juce::Uuid().toString();
    scan->list = scratch.getChildFile ("live-mix-scan-" + stamp + ".list");
    scan->results = scratch.getChildFile ("live-mix-scan-" + stamp + ".results");
    scan->lastSaved = juce::Time::getMillisecondCounter();
    scanUnfinished = true;

    stepScan();
}

void HostServer::stepScan()
{
    if (scan == nullptr)
        return;
    auto& job = *scan;

    if (job.worker != nullptr)
    {
        // Asked before the results are read, so nothing a worker wrote on its
        // way out is missed.
        const auto running = job.worker->isRunning();
        takeScanResults();

        // A plug-in, or the worker itself, that has taken too long is ended.
        const auto quiet = juce::Time::getMillisecondCounter() - job.lastWord;
        const auto late = quiet >= static_cast<juce::uint32> (job.secondsPerPlugin * 1000.0);
        if (running && job.settled < job.queue.size() && ! late)
            return;

        // Zero when the worker ended by itself after the list, or was ended
        // here with the list done; the worker's own word for a plug-in that
        // only waited is 71 (ScanWorker.cpp).
        const auto crashed = ! running && job.worker->getExitCode() != 71;
        job.endWorker();

        if (job.current >= 0 && crashed && job.workerDone > 0 && job.secondGo != job.current)
        {
            // It crashed after other plug-ins in the same worker, and one of
            // those may have left the process in a bad way. It gets a worker
            // to itself before it is held against it.
            job.secondGo = job.current;
            job.settled = job.current;
            job.current = -1;
        }
        else if (job.current >= 0)
        {
            // The worker ended inside a plug-in. It is left out of this scan
            // and of the ones after it, until a scan is asked to start over.
            const auto identifier = job.queue[job.current];
            knownPlugins.addToBlacklist (identifier);
            job.settled = job.current + 1;
            job.current = -1;
            savePluginCache();
            job.lastSaved = juce::Time::getMillisecondCounter();
        }

        job.emptyWorkers = job.workerBegan > 0 ? 0 : job.emptyWorkers + 1;
        if (job.settled < job.queue.size() && job.emptyWorkers >= scanEmptyWorkers)
        {
            savePluginCache();
            const auto finished = std::move (scan);
            fail (finished->connection, finished->id, "the plug-in scanner ended before it scanned anything");
            return;
        }
    }

    for (;;)
    {
        if (job.settled < job.queue.size())
        {
            if (! startScanWorker())
            {
                savePluginCache();
                const auto finished = std::move (scan);
                fail (finished->connection, finished->id, "the plug-in scanner could not be started");
            }
            return;
        }

        if (job.pending.isEmpty())
            break;

        // The next format: what it has that is neither known, left out, nor
        // found earlier to hold no plug-in.
        // The ones that are made asynchronously are in, version 3 Audio Units
        // among them; the worker asks those from a thread of its own.
        auto* format = job.pending.removeAndReturn (0);
        auto paths = job.useDefaultPaths ? format->getDefaultLocationsToSearch() : juce::FileSearchPath();
        paths.addPath (job.extraPaths);
        job.format = format->getName();
        job.queue.clear();
        job.settled = 0;
        job.emptyWorkers = 0;
        job.secondGo = -1;
        for (const auto& identifier : format->searchPathsForPlugins (paths, true, true))
            if (! knownPlugins.getBlacklistedFiles().contains (identifier)
                && ! couldNotLoad.contains (identifier)
                && ! knownPlugins.isListingUpToDate (identifier, *format))
                job.queue.add (identifier);
        job.list.replaceWithText (job.queue.joinIntoString ("\n"));
    }

    scanUnfinished = false;
    savePluginCache();
    auto* result = new juce::DynamicObject();
    describeKnown (*result);
    const auto finished = std::move (scan);
    reply (finished->connection, finished->id, juce::var (result));
}

void HostServer::describeKnown (juce::DynamicObject& result) const
{
    juce::Array<juce::var> failed;
    juce::Array<juce::var> crashed;
    // What to call each of them: an Audio Unit is found by a code, not a file.
    auto* names = new juce::DynamicObject();
    for (const auto& file : couldNotLoad)
    {
        failed.add (file);
        names->setProperty (file, pluginName (file));
    }
    for (const auto& file : knownPlugins.getBlacklistedFiles())
    {
        crashed.add (file);
        names->setProperty (file, pluginName (file));
    }
    result.setProperty ("plugins", pluginList());
    result.setProperty ("failed", failed);
    result.setProperty ("crashed", crashed);
    result.setProperty ("names", juce::var (names));
}

juce::String HostServer::pluginName (const juce::String& identifier) const
{
    for (auto* format : formats.getFormats())
    {
        if (! format->fileMightContainThisPluginType (identifier))
            continue;
        const auto name = format->getNameOfPluginFromIdentifier (identifier);
        // A format that knows a plug-in by its file gives the path back.
        if (name.isNotEmpty() && name != identifier)
            return name;
        break;
    }
    return juce::File::isAbsolutePath (identifier) ? juce::File (identifier).getFileNameWithoutExtension()
                                                    : identifier;
}

bool HostServer::startScanWorker()
{
    auto& job = *scan;
    job.results.deleteFile();
    job.resultsRead = 0;
    job.current = -1;
    job.workerBegan = job.workerDone = 0;
    job.lastWord = juce::Time::getMillisecondCounter();

    ScanWorker::Job work;
    work.format = job.format;
    work.list = job.list;
    work.results = job.results;
    work.from = job.settled;
    work.count = job.pluginsPerWorker;
    work.idleSeconds = job.secondsIdle;
   #if ! JUCE_WINDOWS
    work.parent = static_cast<int> (::getpid());
   #endif

    auto command = work.toCommandLine();
    command.insert (0, juce::File::getSpecialLocation (juce::File::currentExecutableFile).getFullPathName());
    job.worker = std::make_unique<juce::ChildProcess>();
    // Neither output is read: what a plug-in prints is not the host's to keep.
    if (job.worker->start (command, 0))
        return true;
    job.worker.reset();
    return false;
}

void HostServer::takeScanResults()
{
    auto& job = *scan;
    juce::FileInputStream in (job.results);
    if (! in.openedOk() || ! in.setPosition (job.resultsRead))
        return;

    juce::MemoryBlock fresh;
    in.readIntoMemoryBlock (fresh);
    // Only whole lines: the worker may be in the middle of the last one.
    auto whole = fresh.getSize();
    while (whole > 0 && fresh[whole - 1] != '\n')
        --whole;
    job.resultsRead += static_cast<juce::int64> (whole);
    const auto text = juce::String::fromUTF8 (static_cast<const char*> (fresh.getData()), static_cast<int> (whole));

    for (const auto& written : juce::StringArray::fromLines (text))
    {
        auto line = ScanWorker::parse (written);
        if (! line || ! juce::isPositiveAndBelow (line->index, job.queue.size()))
            continue;
        const auto identifier = job.queue[line->index];
        job.lastWord = juce::Time::getMillisecondCounter();

        if (! line->done)
        {
            job.current = line->index;
            ++job.workerBegan;
            auto* progress = new juce::DynamicObject();
            progress->setProperty ("format", job.format);
            progress->setProperty ("file", identifier);
            progress->setProperty ("name", pluginName (identifier));
            progress->setProperty ("progress", static_cast<double> (line->index) / static_cast<double> (job.queue.size()));
            emit (job.connection, "scanProgress", progress);
            continue;
        }

        for (const auto* type : line->types)
            knownPlugins.addType (*type);
        if (line->types.isEmpty())
            couldNotLoad.addIfNotAlreadyThere (identifier);
        job.settled = line->index + 1;
        job.current = -1;
        ++job.workerDone;
    }

    if (juce::Time::getMillisecondCounter() - job.lastSaved > scanSaveMillis)
    {
        savePluginCache();
        job.lastSaved = juce::Time::getMillisecondCounter();
    }
}

void HostServer::load (const Connection& connection, const juce::var& id, const juce::var& params)
{
    std::unique_ptr<juce::PluginDescription> description;

    if (params.hasProperty ("plugin"))
    {
        description = knownPlugins.getTypeForIdentifierString (params["plugin"].toString());
        if (description == nullptr)
        {
            fail (connection, id, "unknown plug-in \"" + params["plugin"].toString() + "\"; scan first or load by file");
            return;
        }
    }
    else if (params.hasProperty ("file"))
    {
        const auto file = params["file"].toString();
        juce::OwnedArray<juce::PluginDescription> found;
        for (auto* format : formats.getFormats())
            if (format->fileMightContainThisPluginType (file))
                format->findAllTypesForFile (found, file);
        const auto wanted = params["name"].toString();
        for (auto* candidate : found)
        {
            if (wanted.isEmpty() || candidate->name == wanted)
            {
                description = std::make_unique<juce::PluginDescription> (*candidate);
                break;
            }
        }
        if (description == nullptr)
        {
            fail (connection, id, "no plug-in found in \"" + file + "\"");
            return;
        }
        knownPlugins.addType (*description);
    }
    else
    {
        fail (connection, id, "load needs \"plugin\" (an id from scan) or \"file\"");
        return;
    }

    const auto sampleRate = params.hasProperty ("sampleRate") ? static_cast<double> (params["sampleRate"]) : 48000.0;
    const auto blockSize = params.hasProperty ("blockSize") ? static_cast<int> (params["blockSize"]) : 1024;
    const auto state = params["state"].toString();
    if (sampleRate < 8000.0 || sampleRate > 768000.0 || blockSize < 16 || blockSize > static_cast<int> (maxFramesPerMessage))
    {
        fail (connection, id, "sampleRate or blockSize out of range");
        return;
    }

    juce::WeakReference<HostServer> weak (this);
    const auto chosen = *description;
    formats.createPluginInstanceAsync (chosen, sampleRate, blockSize,
        [weak, connection, id, chosen, sampleRate, blockSize, state] (std::unique_ptr<juce::AudioPluginInstance> instance, const juce::String& error)
        {
            if (weak == nullptr)
                return;
            if (instance == nullptr)
            {
                weak->fail (connection, id, error.isNotEmpty() ? error : "the plug-in could not be created");
                return;
            }
            // The control connection went away while the plug-in was loading:
            // `controlClosed` never saw this slot, so let the instance go here
            // rather than leave it loaded for the life of the process.
            if (connection == nullptr || ! connection->isOpen())
                return;

            const auto slotId = "s" + juce::String (weak->nextSlot++);
            auto slot = std::make_shared<PluginSlot> (slotId, std::move (instance), chosen, sampleRate, blockSize);
            slot->owner = connection;
            if (state.isNotEmpty())
                slot->setState (state);
            // Nothing to echo yet: the load result carries every value.
            slot->collectChanges ([] (int, float, const juce::String&, PluginSlot::Origin) {});
            {
                const juce::ScopedLock lock (weak->slotLock);
                weak->slots[slotId] = slot;
            }
            weak->reply (connection, id, slot->describe());
        });
}

void HostServer::unload (const juce::String& slotId)
{
    std::shared_ptr<PluginSlot> slot;
    std::vector<Connection> audio;
    {
        const juce::ScopedLock lock (slotLock);
        const auto found = slots.find (slotId);
        if (found == slots.end())
            return;
        slot = found->second;
        slots.erase (found);

        const auto range = audioConnections.equal_range (slotId);
        for (auto entry = range.first; entry != range.second; ++entry)
            if (auto connection = entry->second.lock())
                audio.push_back (std::move (connection));
    }
    // The audio connection may still hold the slot; the plug-in itself goes now, here.
    slot->shutdown();
    // Its pump has nothing left to talk to: closing tells it so.
    for (const auto& connection : audio)
        connection->close();
}

//==============================================================================
void HostServer::loadPluginCache()
{
    const auto file = options.dataDirectory.getChildFile ("plugins.xml");
    if (auto xml = juce::parseXML (file))
    {
        knownPlugins.recreateFromXml (*xml);
        scanUnfinished = xml->getBoolAttribute ("scanUnfinished");
        couldNotLoad.clear();
        for (auto* entry : xml->getChildWithTagNameIterator ("COULDNOTLOAD"))
            couldNotLoad.addIfNotAlreadyThere (entry->getStringAttribute ("id"));
    }

    // A host from before scans had a process of their own noted here which
    // plug-in it was in, and that plug-in took it down. Those stay left out.
    const auto noted = options.dataDirectory.getChildFile ("scan-in-progress.txt");
    if (noted.existsAsFile())
    {
        juce::PluginDirectoryScanner::applyBlacklistingsFromDeadMansPedal (knownPlugins, noted);
        scanUnfinished = true;
        savePluginCache();
        noted.deleteFile();
    }
}

void HostServer::savePluginCache() const
{
    if (options.dataDirectory == juce::File())
        return;
    options.dataDirectory.createDirectory();
    if (auto xml = knownPlugins.createXml())
    {
        // Saved while a scan runs, the list is not all there is yet.
        if (scanUnfinished)
            xml->setAttribute ("scanUnfinished", true);
        // Beside the list's own entries, which is all the list reads back.
        for (const auto& file : couldNotLoad)
            xml->createNewChildElement ("COULDNOTLOAD")->setAttribute ("id", file);
        xml->writeTo (options.dataDirectory.getChildFile ("plugins.xml"));
    }
}

void HostServer::timerCallback()
{
    announceLink();
    stepScan();

    std::vector<std::shared_ptr<PluginSlot>> all;
    {
        const juce::ScopedLock lock (slotLock);
        for (auto& [slotId, slot] : slots)
            all.push_back (slot);
    }

    for (auto& slot : all)
    {
        const auto owner = slot->owner.lock();
        juce::Array<juce::var> changes;
        const bool latencyChanged = slot->collectChanges ([&changes] (int index, float value, const juce::String& text, PluginSlot::Origin origin)
        {
            auto* change = new juce::DynamicObject();
            change->setProperty ("index", index);
            change->setProperty ("value", value);
            change->setProperty ("text", text);
            change->setProperty ("origin", originName (origin));
            changes.add (juce::var (change));
        });

        if (! changes.isEmpty())
        {
            auto* event = new juce::DynamicObject();
            event->setProperty ("slot", slot->id);
            event->setProperty ("changes", changes);
            emit (owner, "params", event);
        }
        if (latencyChanged)
        {
            auto* event = new juce::DynamicObject();
            event->setProperty ("slot", slot->id);
            event->setProperty ("latencySamples", slot->latencySamples());
            emit (owner, "latency", event);
        }
        if (slot->takeEditorClosed())
        {
            auto* event = new juce::DynamicObject();
            event->setProperty ("slot", slot->id);
            emit (owner, "editorClosed", event);
        }
        if (slot->takeStateChanged())
        {
            auto* event = new juce::DynamicObject();
            event->setProperty ("slot", slot->id);
            emit (owner, "stateChanged", event);
        }
    }
}

} // namespace livemix
