#include "HostServer.h"

#include <cstring>
#include <optional>

namespace livemix
{

namespace
{
    constexpr uint32_t messageProcess = 1;
    constexpr uint32_t messageMidi = 2;
    constexpr size_t audioHeaderBytes = 16;
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
        const auto bpm = params.hasProperty ("bpm") ? static_cast<double> (params["bpm"]) : 0.0;
        // Both fields are optional: a tempo-only update must not start the play head.
        const auto playing = params.hasProperty ("playing")
                                 ? std::optional<bool> (static_cast<bool> (params["playing"]))
                                 : std::nullopt;
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
    else
    {
        fail (connection, id, "unknown method \"" + method + "\"");
    }
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
    }
}

} // namespace livemix
