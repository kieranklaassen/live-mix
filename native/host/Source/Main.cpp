// live-mix-plugin-host: loads VST3 and Audio Unit plug-ins for a browser
// engine. The desktop shell starts it, reads one line of JSON from its
// standard output (the port and the token) and hands both to the page, which
// talks to it over a WebSocket on the loopback interface.
//
//   live-mix-plugin-host [--port N] [--token T] [--data-dir DIR] [--stay-alive]
//
// Without --stay-alive the host exits when its standard input closes, so it
// never outlives the shell that started it.
//
// The host starts itself a second time with --scan-worker to scan plug-ins
// outside its own process (ScanWorker.h).

#include "HostServer.h"
#include "ScanWorker.h"

#include <juce_gui_basics/juce_gui_basics.h>

#include <csignal>
#include <cstdio>
#include <iostream>
#include <thread>

#if JUCE_WINDOWS
 #include <io.h>
#else
 #include <unistd.h>
#endif

namespace livemix
{

/**
    Quits the application when standard input reaches its end. The thread is
    detached: it sits in a blocking read and ends with the process.
*/
void quitWhenStandardInputCloses()
{
    std::thread ([]
    {
        char discard[256];
        for (;;)
        {
           #if JUCE_WINDOWS
            const auto count = _read (0, discard, sizeof (discard));
           #else
            const auto count = ::read (0, discard, sizeof (discard));
           #endif
            if (count <= 0)
                break;
        }
        juce::MessageManager::callAsync ([] { juce::JUCEApplicationBase::quit(); });
    }).detach();
}

class HostApplication final : public juce::JUCEApplication
{
public:
    const juce::String getApplicationName() override { return JUCE_APPLICATION_NAME_STRING; }
    const juce::String getApplicationVersion() override { return JUCE_APPLICATION_VERSION_STRING; }
    bool moreThanOneInstanceAllowed() override { return true; }

    void initialise (const juce::String&) override
    {
       #if ! JUCE_WINDOWS
        // A page that goes away mid-write must not take the host with it.
        std::signal (SIGPIPE, SIG_IGN);
       #endif

        const auto arguments = getCommandLineParameterArray();

        if (auto job = ScanWorker::Job::fromCommandLine (arguments))
        {
            scanWorker = std::make_unique<ScanWorker> (std::move (*job));
            return;
        }

        // `--name value` or `--name=value`; empty when the option is absent.
        const auto valueOf = [&arguments] (const juce::String& name) -> juce::String
        {
            for (int index = 0; index < arguments.size(); ++index)
            {
                if (arguments[index] == name)
                    return index + 1 < arguments.size() ? arguments[index + 1] : juce::String();
                if (arguments[index].startsWith (name + "="))
                    return arguments[index].fromFirstOccurrenceOf ("=", false, false);
            }
            return {};
        };

        HostServer::Options options;
        options.port = valueOf ("--port").getIntValue();
        options.token = valueOf ("--token");
        if (options.token.isEmpty())
            options.token = juce::Uuid().toString() + juce::Uuid().toString();

        const auto dataDirectory = valueOf ("--data-dir");
        options.dataDirectory = dataDirectory.isNotEmpty()
                                    ? juce::File::getCurrentWorkingDirectory().getChildFile (dataDirectory)
                                    : juce::File::getSpecialLocation (juce::File::userApplicationDataDirectory)
                                         #if JUCE_MAC
                                          .getChildFile ("Application Support")
                                         #endif
                                          .getChildFile ("live-mix-plugin-host");

        server = std::make_unique<HostServer> (options);
        if (! server->start())
        {
            std::cerr << "live-mix-plugin-host: could not listen on 127.0.0.1:" << options.port << std::endl;
            setApplicationReturnValue (1);
            quit();
            return;
        }

        auto* ready = new juce::DynamicObject();
        ready->setProperty ("ready", true);
        ready->setProperty ("protocol", protocolVersion);
        ready->setProperty ("port", server->port());
        ready->setProperty ("token", server->token());
        std::cout << juce::JSON::toString (juce::var (ready), true) << std::endl;

        if (! arguments.contains ("--stay-alive"))
            quitWhenStandardInputCloses();
    }

    void shutdown() override
    {
        scanWorker.reset();
        server.reset();
    }

    void systemRequestedQuit() override { quit(); }
    void anotherInstanceStarted (const juce::String&) override {}

private:
    std::unique_ptr<HostServer> server;
    std::unique_ptr<ScanWorker> scanWorker;
};

} // namespace livemix

START_JUCE_APPLICATION (livemix::HostApplication)
