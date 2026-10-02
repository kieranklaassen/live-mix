#include "HostServer.h"

#include <cmath>
#include <cstring>
#include <optional>

namespace livemix
{

namespace
{
    constexpr uint32_t messageProcess = 1;
    constexpr uint32_t messageMidi = 2;
    constexpr uint32_t messageLinkAudio = 3;
    constexpr size_t audioHeaderBytes = 16;
    /** A Link Audio block: the 16 bytes above (type, frames, channels, sample rate), then when it is heard. */
    constexpr size_t linkAudioHeaderBytes = audioHeaderBytes + sizeof (double);
    constexpr uint32_t maxFramesPerMessage = 16384;
    constexpr uint32_t maxChannels = 8;
    constexpr int changeTimerHz = 30;

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

struct HostServer::ScanJob
{
    Connection connection;
    juce::var id;
    juce::Array<juce::AudioPluginFormat*> pending;
    juce::FileSearchPath extraPaths;
    bool useDefaultPaths = true;
    std::unique_ptr<juce::PluginDirectoryScanner> scanner;
    juce::String format;
    juce::StringArray failed;
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
    result->setProperty ("link", LinkSession::available());
    if (LinkSession::available())
        result->setProperty ("linkVersion", LinkSession::version());
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
        result->setProperty ("plugins", pluginList());
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
        scan.reset();

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
    }

    stepScan();
}

void HostServer::stepScan()
{
    if (scan == nullptr)
        return;

    if (scan->scanner == nullptr)
    {
        if (scan->pending.isEmpty())
        {
            savePluginCache();
            juce::Array<juce::var> failed;
            for (const auto& file : scan->failed)
                failed.add (file);
            auto* result = new juce::DynamicObject();
            result->setProperty ("plugins", pluginList());
            result->setProperty ("failed", failed);
            const auto finished = std::move (scan);
            reply (finished->connection, finished->id, juce::var (result));
            return;
        }

        auto* format = scan->pending.removeAndReturn (0);
        auto paths = scan->useDefaultPaths ? format->getDefaultLocationsToSearch() : juce::FileSearchPath();
        paths.addPath (scan->extraPaths);
        scan->format = format->getName();
        scan->scanner = std::make_unique<juce::PluginDirectoryScanner> (
            knownPlugins, *format, paths, true,
            options.dataDirectory.getChildFile ("scan-in-progress.txt"), true);
    }

    const auto file = scan->scanner->getNextPluginFileThatWillBeScanned();
    if (file.isNotEmpty())
    {
        auto* progress = new juce::DynamicObject();
        progress->setProperty ("format", scan->format);
        progress->setProperty ("file", file);
        progress->setProperty ("progress", scan->scanner->getProgress());
        emit (scan->connection, "scanProgress", progress);
    }

    juce::String scanned;
    if (! scan->scanner->scanNextFile (true, scanned))
    {
        scan->failed.addArray (scan->scanner->getFailedFiles());
        scan->scanner.reset();
    }

    juce::MessageManager::callAsync ([weak = juce::WeakReference<HostServer> (this)]
    {
        if (weak != nullptr)
            weak->stepScan();
    });
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
        knownPlugins.recreateFromXml (*xml);
}

void HostServer::savePluginCache() const
{
    if (options.dataDirectory == juce::File())
        return;
    options.dataDirectory.createDirectory();
    if (auto xml = knownPlugins.createXml())
        xml->writeTo (options.dataDirectory.getChildFile ("plugins.xml"));
}

void HostServer::timerCallback()
{
    announceLink();

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
