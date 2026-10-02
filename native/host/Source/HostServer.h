// The host's control surface: a WebSocket server on the loopback interface, a
// plug-in list, and the loaded slots. Requests arrive as JSON on a `/control`
// connection and are answered on the message thread; each slot's audio runs on
// its own `/audio` connection. A `/link-audio` connection is one Link Audio
// channel the page sends. docs/native.md and docs/link.md have the message
// reference.

#pragma once

#include "LinkSession.h"
#include "PluginSlot.h"
#include "WebSocket.h"

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_events/juce_events.h>

#include <map>
#include <memory>

namespace livemix
{

constexpr int protocolVersion = 1;

class HostServer final : private juce::Timer
{
public:
    struct Options
    {
        int port = 0;
        juce::String token;
        juce::File dataDirectory;
    };

    explicit HostServer (Options optionsToUse);
    ~HostServer() override;

    bool start();
    int port() const noexcept { return server.port(); }
    const juce::String& token() const noexcept { return options.token; }

private:
    using Connection = std::shared_ptr<WsConnection>;

    struct ScanJob;

    // Connection threads.
    void serve (Connection connection, const juce::String& path, const juce::StringPairArray& query);
    void serveControl (Connection connection);
    void serveAudio (Connection connection, const juce::String& slotId, int outputChannels);
    void serveLinkAudio (Connection connection, const juce::String& channelName);

    // Message thread.
    void handleRequest (const Connection& connection, const juce::var& request);
    void controlClosed (const Connection& connection);
    void reply (const Connection& connection, const juce::var& id, const juce::var& result);
    void fail (const Connection& connection, const juce::var& id, const juce::String& message);
    void emit (const Connection& connection, const juce::String& event, juce::DynamicObject* fields);

    juce::var hello() const;
    juce::var pluginList() const;
    void startScan (const Connection& connection, const juce::var& id, const juce::var& params);
    void stepScan();
    void load (const Connection& connection, const juce::var& id, const juce::var& params);
    void unload (const juce::String& slotId);
    std::shared_ptr<PluginSlot> findSlot (const juce::String& slotId) const;
    std::shared_ptr<PluginSlot> requireSlot (const Connection& connection, const juce::var& id, const juce::var& params);

    // Link. The session is made the first time a page asks for it.
    LinkSession& linkSession();
    void handleLink (const Connection& connection, const juce::var& id, const juce::String& method, const juce::var& params);
    void followLink (const Connection& connection);
    void announceLink();

    void loadPluginCache();
    void savePluginCache() const;
    void timerCallback() override;

    const Options options;
    juce::AudioPluginFormatManager formats;
    juce::KnownPluginList knownPlugins;
    std::unique_ptr<ScanJob> scan;

    juce::CriticalSection slotLock;
    std::map<juce::String, std::shared_ptr<PluginSlot>> slots;
    /** Open audio connections by slot, so unloading a slot can end them. */
    std::multimap<juce::String, std::weak_ptr<WsConnection>> audioConnections;
    int nextSlot = 1;

    juce::CriticalSection linkLock;
    std::unique_ptr<LinkSession> link;
    /** Control connections that asked about Link: they are told when the session changes. */
    std::vector<std::weak_ptr<WsConnection>> linkFollowers;

    WsServer server;

    JUCE_DECLARE_WEAK_REFERENCEABLE (HostServer)
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (HostServer)
};

} // namespace livemix
