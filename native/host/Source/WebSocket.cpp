#include "WebSocket.h"

#include "Sha1.h"

namespace livemix
{

namespace
{
    constexpr size_t maxMessageBytes = 256u * 1024u * 1024u;
    constexpr int maxHandshakeBytes = 16 * 1024;
    const char* const websocketGuid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

    enum Opcode : uint8_t
    {
        continuation = 0x0,
        text = 0x1,
        binary = 0x2,
        closeFrame = 0x8,
        ping = 0x9,
        pong = 0xA
    };
}

WsConnection::WsConnection (std::unique_ptr<juce::StreamingSocket> socketToOwn)
    : socket (std::move (socketToOwn))
{
}

WsConnection::~WsConnection()
{
    close();
}

void WsConnection::close()
{
    open = false;
    if (socket != nullptr)
        socket->close();
}

bool WsConnection::readExact (void* destination, size_t numBytes)
{
    auto* bytes = static_cast<char*> (destination);
    size_t done = 0;
    while (done < numBytes)
    {
        if (! open.load())
            return false;
        const auto want = static_cast<int> (juce::jmin (numBytes - done, static_cast<size_t> (1 << 20)));
        const auto got = socket->read (bytes + done, want, true);
        if (got <= 0)
        {
            open = false;
            return false;
        }
        done += static_cast<size_t> (got);
    }
    return true;
}

bool WsConnection::writeAll (const void* source, size_t numBytes)
{
    auto* bytes = static_cast<const char*> (source);
    size_t done = 0;
    while (done < numBytes)
    {
        if (! open.load())
            return false;
        const auto want = static_cast<int> (juce::jmin (numBytes - done, static_cast<size_t> (1 << 20)));
        const auto sent = socket->write (bytes + done, want);
        if (sent <= 0)
        {
            open = false;
            return false;
        }
        done += static_cast<size_t> (sent);
    }
    return true;
}

bool WsConnection::handshake (juce::String& path, juce::StringPairArray& query)
{
    std::string request;
    request.reserve (1024);
    char byte = 0;
    while (request.size() < 4 || request.compare (request.size() - 4, 4, "\r\n\r\n") != 0)
    {
        if (static_cast<int> (request.size()) >= maxHandshakeBytes || ! readExact (&byte, 1))
            return false;
        request.push_back (byte);
    }

    juce::StringArray lines;
    lines.addLines (juce::String::fromUTF8 (request.data(), static_cast<int> (request.size())));
    if (lines.isEmpty())
        return false;

    juce::StringArray requestLine;
    requestLine.addTokens (lines[0], " ", "");
    if (requestLine.size() < 3 || requestLine[0] != "GET")
        return false;

    const auto target = requestLine[1];
    path = target.upToFirstOccurrenceOf ("?", false, false);
    query.clear();
    juce::StringArray pairs;
    pairs.addTokens (target.fromFirstOccurrenceOf ("?", false, false), "&", "");
    for (const auto& pair : pairs)
    {
        if (pair.isEmpty())
            continue;
        query.set (juce::URL::removeEscapeChars (pair.upToFirstOccurrenceOf ("=", false, false)),
                   juce::URL::removeEscapeChars (pair.fromFirstOccurrenceOf ("=", false, false)));
    }

    juce::String key;
    bool upgrade = false;
    for (int i = 1; i < lines.size(); ++i)
    {
        const auto name = lines[i].upToFirstOccurrenceOf (":", false, false).trim();
        const auto value = lines[i].fromFirstOccurrenceOf (":", false, false).trim();
        if (name.equalsIgnoreCase ("Sec-WebSocket-Key"))
            key = value;
        else if (name.equalsIgnoreCase ("Upgrade"))
            upgrade = value.equalsIgnoreCase ("websocket");
    }
    if (! upgrade || key.isEmpty())
        return false;

    const auto digest = sha1 ((key + websocketGuid).toStdString());
    acceptKey = juce::Base64::toBase64 (digest.data(), digest.size());

    return true;
}

bool WsConnection::accept()
{
    const auto response = ("HTTP/1.1 101 Switching Protocols\r\n"
                           "Upgrade: websocket\r\n"
                           "Connection: Upgrade\r\n"
                           "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n").toStdString();
    const juce::ScopedLock lock (writeLock);
    return writeAll (response.data(), response.size());
}

void WsConnection::reject (int status, const juce::String& reason)
{
    const auto response = ("HTTP/1.1 " + juce::String (status) + " " + reason + "\r\n"
                           "Connection: close\r\nContent-Length: 0\r\n\r\n").toStdString();
    {
        const juce::ScopedLock lock (writeLock);
        writeAll (response.data(), response.size());
    }
    close();
}

bool WsConnection::read (WsMessage& message)
{
    message.data.reset();
    bool started = false;

    for (;;)
    {
        uint8_t header[2];
        if (! readExact (header, 2))
            return false;

        const bool fin = (header[0] & 0x80) != 0;
        const auto opcode = static_cast<uint8_t> (header[0] & 0x0f);
        const bool masked = (header[1] & 0x80) != 0;
        uint64_t length = header[1] & 0x7fu;

        if (length == 126)
        {
            uint8_t extended[2];
            if (! readExact (extended, 2))
                return false;
            length = (static_cast<uint64_t> (extended[0]) << 8) | extended[1];
        }
        else if (length == 127)
        {
            uint8_t extended[8];
            if (! readExact (extended, 8))
                return false;
            length = 0;
            for (auto part : extended)
                length = (length << 8) | part;
        }

        uint8_t mask[4] = { 0, 0, 0, 0 };
        if (masked && ! readExact (mask, 4))
            return false;

        const bool control = (opcode & 0x8) != 0;
        if (length > maxMessageBytes || (control && length > 125))
        {
            close();
            return false;
        }

        juce::MemoryBlock controlPayload;
        auto& target = control ? controlPayload : message.data;
        const auto offset = target.getSize();
        target.setSize (offset + static_cast<size_t> (length));
        auto* payload = static_cast<uint8_t*> (target.getData()) + offset;
        if (length > 0 && ! readExact (payload, static_cast<size_t> (length)))
            return false;
        if (masked)
            for (size_t i = 0; i < static_cast<size_t> (length); ++i)
                payload[i] ^= mask[i & 3];

        switch (opcode)
        {
            case closeFrame:
                sendFrame (closeFrame, controlPayload.getData(), juce::jmin (controlPayload.getSize(), static_cast<size_t> (2)));
                close();
                return false;
            case ping:
                sendFrame (pong, controlPayload.getData(), controlPayload.getSize());
                continue;
            case pong:
                continue;
            case text:
            case binary:
                message.binary = opcode == binary;
                started = true;
                break;
            case continuation:
                if (! started)
                {
                    close();
                    return false;
                }
                break;
            default:
                close();
                return false;
        }

        if (fin)
            return true;
    }
}

bool WsConnection::sendFrame (uint8_t opcode, const void* data, size_t numBytes)
{
    const juce::ScopedLock lock (writeLock);
    frame.clear();
    frame.reserve (numBytes + 10);
    frame.push_back (static_cast<uint8_t> (0x80u | opcode));
    if (numBytes < 126)
    {
        frame.push_back (static_cast<uint8_t> (numBytes));
    }
    else if (numBytes <= 0xffffu)
    {
        frame.push_back (126);
        frame.push_back (static_cast<uint8_t> ((numBytes >> 8) & 0xffu));
        frame.push_back (static_cast<uint8_t> (numBytes & 0xffu));
    }
    else
    {
        frame.push_back (127);
        for (int shift = 56; shift >= 0; shift -= 8)
            frame.push_back (static_cast<uint8_t> ((static_cast<uint64_t> (numBytes) >> shift) & 0xffu));
    }
    if (numBytes > 0)
    {
        const auto* bytes = static_cast<const uint8_t*> (data);
        frame.insert (frame.end(), bytes, bytes + numBytes);
    }
    return writeAll (frame.data(), frame.size());
}

bool WsConnection::sendText (const juce::String& textToSend)
{
    const auto utf8 = textToSend.toStdString();
    return sendFrame (text, utf8.data(), utf8.size());
}

bool WsConnection::sendBinary (const void* data, size_t numBytes)
{
    return sendFrame (binary, data, numBytes);
}

//==============================================================================
class WsServer::ConnectionThread : public juce::Thread
{
public:
    ConnectionThread (WsServer& ownerToUse, std::unique_ptr<juce::StreamingSocket> socket)
        : juce::Thread ("live-mix connection"),
          owner (ownerToUse),
          connection (std::make_shared<WsConnection> (std::move (socket)))
    {
    }

    ~ConnectionThread() override
    {
        connection->close();
        stopThread (4000);
    }

    void run() override
    {
        juce::String path;
        juce::StringPairArray query;
        if (connection->handshake (path, query))
        {
            if (! owner.authorise (path, query))
                connection->reject (403, "Forbidden");
            else if (connection->accept())
                owner.handler (connection, path, query);
        }
        connection->close();
        finished = true;
    }

    WsServer& owner;
    std::shared_ptr<WsConnection> connection;
    std::atomic<bool> finished { false };
};

WsServer::WsServer (Authoriser authoriserToUse, Handler handlerToUse)
    : juce::Thread ("live-mix listener"), authorise (std::move (authoriserToUse)), handler (std::move (handlerToUse))
{
}

WsServer::~WsServer()
{
    stop();
}

bool WsServer::start (int portNumber)
{
    if (! listener.createListener (portNumber, "127.0.0.1"))
        return false;
    boundPort = listener.getBoundPort();
    startThread();
    return true;
}

void WsServer::stop()
{
    signalThreadShouldExit();
    listener.close();
    stopThread (4000);
    reap (true);
}

void WsServer::reap (bool all)
{
    std::vector<std::unique_ptr<ConnectionThread>> done;
    {
        const juce::ScopedLock lock (threadLock);
        for (auto it = threads.begin(); it != threads.end();)
        {
            if (all || (*it)->finished.load())
            {
                done.push_back (std::move (*it));
                it = threads.erase (it);
            }
            else
            {
                ++it;
            }
        }
    }
    done.clear();
}

void WsServer::run()
{
    while (! threadShouldExit())
    {
        std::unique_ptr<juce::StreamingSocket> socket (listener.waitForNextConnection());
        if (socket == nullptr)
        {
            if (threadShouldExit())
                break;
            juce::Thread::sleep (10);
            continue;
        }
        reap (false);
        auto thread = std::make_unique<ConnectionThread> (*this, std::move (socket));
        auto* started = thread.get();
        {
            const juce::ScopedLock lock (threadLock);
            threads.push_back (std::move (thread));
        }
        // Audio connections process blocks against a deadline; control ones mostly sleep.
        started->startThread (juce::Thread::Priority::highest);
    }
}

} // namespace livemix
