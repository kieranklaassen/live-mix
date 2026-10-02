#include "ScanWorker.h"

#include "MacWindows.h"
#include "WhyNoPlugin.h"

#include <atomic>
#include <chrono>
#include <csignal>
#include <cstdlib>
#include <ctime>
#include <thread>

#if ! JUCE_WINDOWS
 #include <pthread.h>
 #include <unistd.h>
#endif

#if JUCE_MAC
 #include <mach/mach.h>
#endif

namespace livemix
{

namespace
{
    /** `--name value`; empty when the option is absent. */
    juce::String valueOf (const juce::StringArray& arguments, const juce::String& name)
    {
        const auto index = arguments.indexOf (name);
        return index >= 0 && index + 1 < arguments.size() ? arguments[index + 1] : juce::String();
    }

   #if ! JUCE_WINDOWS
    /**
        A plug-in that crashes ends the worker at once and without a report:
        the host reads which plug-in it was from the results. Left to the
        system, a Mac writes a crash report for each one first, which takes
        seconds and may put a dialog up.
    */
    void endQuietlyOnACrash()
    {
        for (const auto signal : { SIGSEGV, SIGBUS, SIGILL, SIGFPE, SIGABRT, SIGTRAP })
            std::signal (signal, [] (int) { ::_exit (70); });
    }
   #endif

    /** Which plug-in of the list is being scanned, or -1 between two. One worker to a process. */
    std::atomic<int> scanning { -1 };

   #if ! JUCE_WINDOWS
    /**
        The thread the plug-in is being scanned on, for the watch below, or
        none when the work is not that thread's: a plug-in made asynchronously
        is put together elsewhere while the thread that asked for it waits, so
        there is nothing of its own there to tell work from waiting.
    */
    juce::CriticalSection scanThreadLock;
    pthread_t scanThread {};
    bool hasScanThread = false;

    void noteScanThread (bool worksOnThisThread)
    {
        const juce::ScopedLock lock (scanThreadLock);
        scanThread = pthread_self();
        hasScanThread = worksOnThisThread;
    }

    /**
        How much processor the thread scanning a plug-in has used, in
        milliseconds; negative when the system does not say. A thread that
        waits uses none, whatever the threads other plug-ins left behind do.
    */
    double scanThreadMillis()
    {
        const juce::ScopedLock lock (scanThreadLock);
        if (! hasScanThread)
            return -1.0;
       #if JUCE_MAC
        thread_basic_info_data_t info;
        mach_msg_type_number_t count = THREAD_BASIC_INFO_COUNT;
        if (thread_info (pthread_mach_thread_np (scanThread), THREAD_BASIC_INFO,
                         reinterpret_cast<thread_info_t> (&info), &count) != KERN_SUCCESS)
            return -1.0;
        return 1000.0 * static_cast<double> (info.user_time.seconds + info.system_time.seconds)
             + static_cast<double> (info.user_time.microseconds + info.system_time.microseconds) / 1000.0;
       #else
        clockid_t clock;
        timespec used;
        if (pthread_getcpuclockid (scanThread, &clock) != 0 || clock_gettime (clock, &used) != 0)
            return -1.0;
        return 1000.0 * static_cast<double> (used.tv_sec) + static_cast<double> (used.tv_nsec) / 1.0e6;
       #endif
    }
   #else
    void noteScanThread (bool) {}
    double scanThreadMillis() { return -1.0; }
   #endif

    /** A thread that uses less of a processor than this is waiting, not working. */
    constexpr double idleShare = 0.005;

    /**
        Watches over the scan from a thread of its own, which a plug-in that
        blocks the others cannot stop. It ends the worker when the host is
        gone or has taken the list away, so a worker never outlives the scan
        it was started for, and when the plug-in being scanned has kept its
        thread waiting for too long: one that waits for something that never
        comes would hold the scan for ever, and a plug-in at work uses the
        processor. A plug-in made asynchronously is left to the host's time
        limit, there being no thread of its own to go by. The thread is
        detached: it ends with the process.
    */
    void watchOver (const ScanWorker::Job& job)
    {
        std::thread ([list = job.list, parent = job.parent, idleMillis = job.idleSeconds * 1000.0]
        {
            // Since when the plug-in has been waiting, and what its thread had used by then.
            auto watched = -1;
            auto waitingSince = 0.0;
            auto usedThen = 0.0;

            for (;;)
            {
                std::this_thread::sleep_for (std::chrono::milliseconds (250));

                auto gone = ! list.existsAsFile();
               #if ! JUCE_WINDOWS
                gone = gone || (parent > 0 && ::getppid() != parent);
               #else
                juce::ignoreUnused (parent);
               #endif
                if (gone)
                    std::_Exit (0);

                const auto now = juce::Time::getMillisecondCounterHiRes();
                const auto current = scanning.load();
                const auto used = current >= 0 ? scanThreadMillis() : -1.0;
                const auto waited = now - waitingSince;
                // Between two plug-ins, on to another one, or at work for the last second or more.
                if (used < 0.0 || current != watched || (waited >= 1000.0 && used - usedThen >= idleShare * waited))
                {
                    watched = used < 0.0 ? -1 : current;
                    waitingSince = now;
                    usedThen = used;
                }
                else if (idleMillis > 0.0 && waited >= idleMillis)
                {
                    std::_Exit (71);
                }
            }
        }).detach();
    }
}

//==============================================================================
std::optional<ScanWorker::Job> ScanWorker::Job::fromCommandLine (const juce::StringArray& arguments)
{
    if (! arguments.contains ("--scan-worker"))
        return {};

    Job job;
    job.format = valueOf (arguments, "--format");
    job.list = juce::File::getCurrentWorkingDirectory().getChildFile (valueOf (arguments, "--list"));
    job.results = juce::File::getCurrentWorkingDirectory().getChildFile (valueOf (arguments, "--results"));
    job.from = juce::jmax (0, valueOf (arguments, "--from").getIntValue());
    job.count = juce::jmax (0, valueOf (arguments, "--count").getIntValue());
    job.parent = valueOf (arguments, "--parent").getIntValue();
    job.idleSeconds = valueOf (arguments, "--idle").getDoubleValue();
    return job;
}

juce::StringArray ScanWorker::Job::toCommandLine() const
{
    return { "--scan-worker",
             "--format", format,
             "--list", list.getFullPathName(),
             "--results", results.getFullPathName(),
             "--from", juce::String (from),
             "--count", juce::String (count),
             "--parent", juce::String (parent),
             "--idle", juce::String (idleSeconds) };
}

//==============================================================================
ScanWorker::ScanWorker (Job jobToRun)
    : juce::Thread ("plug-in scan"),
      job (std::move (jobToRun))
{
    juce::addDefaultFormatsToManager (formats);
    for (auto* candidate : formats.getFormats())
        if (candidate->getName() == job.format)
            format = candidate;

   #if ! JUCE_WINDOWS
    endQuietlyOnACrash();
   #endif
    // A scan shows nothing: a plug-in that puts a dialog up while it is
    // looked at would put it over whatever the person is doing. Unless the
    // dialogs are what someone wants to see.
    if (juce::SystemStats::getEnvironmentVariable ("LIVE_MIX_SCAN_WINDOWS", {}).isEmpty())
        keepWindowsOffScreen();
    watchOver (job);
    startThread();
}

ScanWorker::~ScanWorker()
{
    stopThread (2000);
}

void ScanWorker::run()
{
    auto identifiers = juce::StringArray::fromLines (job.list.loadFileAsString());

    const auto end = job.count > 0 ? juce::jmin (identifiers.size(), job.from + job.count) : identifiers.size();

    for (int index = job.from; format != nullptr && index < end && ! threadShouldExit(); ++index)
    {
        const auto identifier = identifiers[index];
        if (identifier.isEmpty())
            continue;

        auto* begin = new juce::DynamicObject();
        begin->setProperty ("begin", index);
        write (juce::var (begin));

        juce::OwnedArray<juce::PluginDescription> found;
        juce::String why;
        scan (identifier, found, why, index);

        juce::Array<juce::var> types;
        for (const auto* type : found)
            if (const auto xml = type->createXml())
                types.add (xml->toString (juce::XmlElement::TextFormat().singleLine()));

        auto* done = new juce::DynamicObject();
        done->setProperty ("done", index);
        done->setProperty ("types", types);
        if (types.isEmpty() && why.isNotEmpty())
            done->setProperty ("why", why);
        write (juce::var (done));
    }

    // Ended here and not by quitting: taking down what the plug-ins left in
    // the process is where one of them may wait for ever, with nothing left
    // to find out.
    std::_Exit (0);
}

void ScanWorker::scan (const juce::String& identifier, juce::OwnedArray<juce::PluginDescription>& found, juce::String& why, int index)
{
    juce::PluginDescription probe;
    probe.fileOrIdentifier = identifier;
    probe.uniqueId = probe.deprecatedUid = 0;

    // Most plug-ins are made on the message thread. A version 3 Audio Unit
    // answers on it, so it has to be asked from another thread.
    const auto asynchronous = format->requiresUnblockedMessageThreadDuringCreation (probe);

    const auto find = [this, &identifier, &found, &why, index, asynchronous]
    {
        noteScanThread (! asynchronous);
        scanning = index;
        try
        {
            format->findAllTypesForFile (found, identifier);
        }
        catch (...)
        {
            // A plug-in that throws has nothing to offer; the scan goes on.
        }
        // Nothing in it: what is the matter with the file, asked where the
        // plug-in was, while it still counts as the one being scanned.
        if (found.isEmpty())
            why = whyNoPlugin (identifier);
        scanning = -1;
    };

    if (asynchronous)
        find();
    else
        juce::MessageManager::callSync (find);
}

void ScanWorker::write (const juce::var& line) const
{
    juce::FileOutputStream out (job.results);
    if (! out.openedOk())
        return;
    out << juce::JSON::toString (line, true) << "\n";
    out.flush();
}

std::optional<ScanWorker::Line> ScanWorker::parse (const juce::String& text)
{
    const auto parsed = juce::JSON::parse (text);
    if (! parsed.isObject())
        return {};

    Line line;
    if (parsed.hasProperty ("begin"))
    {
        line.index = static_cast<int> (parsed["begin"]);
        return line;
    }
    if (! parsed.hasProperty ("done"))
        return {};

    line.index = static_cast<int> (parsed["done"]);
    line.done = true;
    line.why = parsed["why"].toString();
    if (const auto* types = parsed["types"].getArray())
    {
        for (const auto& type : *types)
        {
            const auto xml = juce::parseXML (type.toString());
            auto description = std::make_unique<juce::PluginDescription>();
            if (xml != nullptr && description->loadFromXml (*xml))
                line.types.add (description.release());
        }
    }
    return line;
}

} // namespace livemix
