// Test effect that goes wrong when it is told to. With LIVE_MIX_TEST_TROUBLE
// set to "abort" it ends the process that makes it; with "hang" it never
// comes back from being made, sitting still; with "spin" it never comes back
// either, and keeps a processor busy; with "window" it puts a dialog up and
// waits there for an answer that never comes, as a plug-in asking for its
// licence does. The ways a plug-in spoils a scan. Without the variable it
// passes its input through.

#include <juce_audio_utils/juce_audio_utils.h>

#include <atomic>
#include <chrono>
#include <cstdlib>
#include <thread>

namespace
{

class TestTroubleProcessor final : public juce::AudioProcessor
{
public:
    TestTroubleProcessor()
        : juce::AudioProcessor (BusesProperties()
                                    .withInput ("Input", juce::AudioChannelSet::stereo(), true)
                                    .withOutput ("Output", juce::AudioChannelSet::stereo(), true))
    {
        const auto trouble = juce::SystemStats::getEnvironmentVariable ("LIVE_MIX_TEST_TROUBLE", {});
        if (trouble == "abort")
            std::abort();
        while (trouble == "hang")
            std::this_thread::sleep_for (std::chrono::seconds (1));
        for (std::atomic<int> turns { 0 }; trouble == "spin";)
            ++turns;
        if (trouble == "window")
            waitInAWindow();
    }

    /**
        A dialog of the system's own, waiting for an answer that never comes:
        what a plug-in asking for its licence puts up. Its thread sits in the
        dialog's event loop, which is not the same as sitting still.
    */
    [[noreturn]] static void waitInAWindow()
    {
        juce::NativeMessageBox::showMessageBox (juce::MessageBoxIconType::WarningIcon,
                                                "Authorization Required",
                                                "LiveMix Test Trouble");
        // Answered after all, or a system without such a dialog: still never back.
        for (;;)
            std::this_thread::sleep_for (std::chrono::seconds (1));
    }

    const juce::String getName() const override { return "LiveMix Test Trouble"; }
    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}
    bool hasEditor() const override { return false; }
    juce::AudioProcessorEditor* createEditor() override { return nullptr; }

    void prepareToPlay (double, int) override {}
    void releaseResources() override {}

    using juce::AudioProcessor::processBlock;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override {}

    void getStateInformation (juce::MemoryBlock&) override {}
    void setStateInformation (const void*, int) override {}
};

} // namespace

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new TestTroubleProcessor();
}
