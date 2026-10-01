// A minimal RFC 6455 server: enough for one local client per connection.
// Text frames carry JSON control messages, binary frames carry audio blocks.
// Every connection has its own thread, reads are blocking and exact, and
// writes are serialised so the message thread and a connection thread can
// both send.

#pragma once

#include <juce_core/juce_core.h>

#include <atomic>
#include <functional>
#include <memory>
#include <vector>

namespace livemix
{

struct WsMessage
{
    bool binary = false;
    juce::MemoryBlock data;
};

class WsConnection
{
public:
    explicit WsConnection (std::unique_ptr<juce::StreamingSocket> socketToOwn);
    ~WsConnection();

    /** Reads the upgrade request and fills its path and query; nothing is sent yet. */
    bool handshake (juce::String& path, juce::StringPairArray& query);
    /** Completes the upgrade after `handshake`. */
    bool accept();
    /** Refuses the upgrade with an HTTP status and closes. */
    void reject (int status, const juce::String& reason);

    /** Blocks until one whole message has arrived; false once the peer is gone. */
    bool read (WsMessage& message);

    bool sendText (const juce::String& text);
    bool sendBinary (const void* data, size_t numBytes);
    void close();
    bool isOpen() const noexcept { return open.load(); }

private:
    bool readExact (void* destination, size_t numBytes);
    bool writeAll (const void* source, size_t numBytes);
    bool sendFrame (uint8_t opcode, const void* data, size_t numBytes);

    std::unique_ptr<juce::StreamingSocket> socket;
    juce::CriticalSection writeLock;
    std::atomic<bool> open { true };
    juce::String acceptKey;
    std::vector<uint8_t> frame;
};

/**
    Listens on the loopback interface. A request the authoriser turns down gets
    a 403; every other one is upgraded and handed to the handler on that
    connection's own thread. The handler returns when the connection is finished.
*/
class WsServer : private juce::Thread
{
public:
    using Handler = std::function<void (std::shared_ptr<WsConnection>, const juce::String& path, const juce::StringPairArray& query)>;

    using Authoriser = std::function<bool (const juce::String& path, const juce::StringPairArray& query)>;

    WsServer (Authoriser authoriserToUse, Handler handlerToUse);
    ~WsServer() override;

    /** Port 0 picks a free port; read it back with `port()`. */
    bool start (int portNumber);
    void stop();
    int port() const noexcept { return boundPort; }

private:
    class ConnectionThread;

    void run() override;
    void reap (bool all);

    Authoriser authorise;
    Handler handler;
    juce::StreamingSocket listener;
    int boundPort = 0;
    juce::CriticalSection threadLock;
    std::vector<std::unique_ptr<ConnectionThread>> threads;
};

} // namespace livemix
