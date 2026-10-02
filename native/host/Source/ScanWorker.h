// A scan in a process of its own. A plug-in that crashes or never answers
// while it is being scanned takes this process with it and not the host: the
// host starts it (the same binary, with `--scan-worker`), reads what it
// found from a file as it goes, and starts another after the plug-in that
// ended this one.
//
//   live-mix-plugin-host --scan-worker --format NAME --list FILE --from N
//                        --count N --results FILE --parent PID --idle SECONDS
//
// `--list` names the plug-ins of one format, one per line; the worker scans
// `--count` of them from line `--from` on and ends, so what plug-ins leave
// behind in a process (threads, memory) never adds up over a long list: the
// host starts the next worker where this one stopped. To `--results` it adds
// one line of JSON before each plug-in
// (`{"begin":N}`) and one after it (`{"done":N,"types":[…]}`, each type a
// plug-in description as XML). A `begin` without its `done` is the plug-in
// the worker ended in.
//
// A plug-in that keeps the thread it is scanned on waiting for `--idle`
// seconds (for something that never comes) ends the worker too: the worker
// sees to that itself, by the processor time that thread has used. One made
// asynchronously, a version 3 Audio Unit among them, is put together away
// from that thread and so is left to the host's own time limit.

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_events/juce_events.h>

#include <optional>

namespace livemix
{

class ScanWorker final : private juce::Thread
{
public:
    struct Job
    {
        juce::String format;
        juce::File list;
        juce::File results;
        int from = 0;
        /** How many plug-ins this worker scans before it ends; 0 for the rest of the list. */
        int count = 0;
        /** The host that started this worker; 0 when nobody said. */
        int parent = 0;
        /** How long a plug-in may sit still before the worker ends in it; 0 for as long as it likes. */
        double idleSeconds = 0.0;

        /** What `--scan-worker` and its options ask for, or nothing when this is not a worker. */
        static std::optional<Job> fromCommandLine (const juce::StringArray& arguments);
        /** The options that start a worker for this job, after the binary. */
        juce::StringArray toCommandLine() const;
    };

    /** Starts scanning; the process ends when the list is done. */
    explicit ScanWorker (Job jobToRun);
    ~ScanWorker() override;

    /** One line the worker wrote: which plug-in, and what it found once it is through. */
    struct Line
    {
        int index = -1;
        bool done = false;
        juce::OwnedArray<juce::PluginDescription> types;
    };

    /** Reads a line of the results file; nothing when it is not one. */
    static std::optional<Line> parse (const juce::String& text);

private:
    void run() override;
    void scan (const juce::String& identifier, juce::OwnedArray<juce::PluginDescription>& found, int index);
    void write (const juce::var& line) const;

    const Job job;
    juce::AudioPluginFormatManager formats;
    juce::AudioPluginFormat* format = nullptr;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (ScanWorker)
};

} // namespace livemix
