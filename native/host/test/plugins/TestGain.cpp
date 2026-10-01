// Test effect: a gain with a mode switch and a fixed 64-sample delay it
// reports as latency. Everything about it is predictable, so the host's
// tests can check audio, parameters, state and latency by value.

#include <juce_audio_utils/juce_audio_utils.h>

namespace
{

constexpr int reportedLatency = 64;

class TestGainProcessor final : public juce::AudioProcessor
{
public:
    TestGainProcessor()
        : juce::AudioProcessor (BusesProperties()
                                    .withInput ("Input", juce::AudioChannelSet::stereo(), true)
                                    .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
          state (*this, nullptr, "state", createLayout())
    {
        gain = state.getRawParameterValue ("gain");
        mode = state.getRawParameterValue ("mode");
        setLatencySamples (reportedLatency);
    }

    static juce::AudioProcessorValueTreeState::ParameterLayout createLayout()
    {
        juce::AudioProcessorValueTreeState::ParameterLayout layout;
        layout.add (std::make_unique<juce::AudioParameterFloat> (juce::ParameterID { "gain", 1 }, "Gain",
                                                                juce::NormalisableRange<float> (0.0f, 2.0f), 1.0f));
        layout.add (std::make_unique<juce::AudioParameterChoice> (juce::ParameterID { "mode", 1 }, "Mode",
                                                                 juce::StringArray { "Normal", "Invert", "Mute" }, 0));
        return layout;
    }

    const juce::String getName() const override { return "LiveMix Test Gain"; }
    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}
    bool hasEditor() const override { return true; }
    juce::AudioProcessorEditor* createEditor() override { return new juce::GenericAudioProcessorEditor (*this); }

    bool isBusesLayoutSupported (const BusesLayout& layouts) const override
    {
        return layouts.getMainInputChannelSet() == layouts.getMainOutputChannelSet()
            && (layouts.getMainOutputChannelSet() == juce::AudioChannelSet::stereo()
                || layouts.getMainOutputChannelSet() == juce::AudioChannelSet::mono());
    }

    void prepareToPlay (double, int) override
    {
        for (auto& line : delay)
            line.fill (0.0f);
        position = 0;
    }

    void releaseResources() override {}

    using juce::AudioProcessor::processBlock;

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
    {
        juce::ScopedNoDenormals noDenormals;
        const int choice = juce::roundToInt (mode->load());
        const float factor = choice == 2 ? 0.0f : (choice == 1 ? -gain->load() : gain->load());
        const int channels = juce::jmin (buffer.getNumChannels(), 2);

        for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
        {
            for (int channel = 0; channel < channels; ++channel)
            {
                auto* data = buffer.getWritePointer (channel);
                const float delayed = delay[static_cast<size_t> (channel)][static_cast<size_t> (position)];
                delay[static_cast<size_t> (channel)][static_cast<size_t> (position)] = data[sample];
                data[sample] = delayed * factor;
            }
            position = (position + 1) % reportedLatency;
        }
    }

    void getStateInformation (juce::MemoryBlock& destination) override
    {
        if (auto xml = state.copyState().createXml())
            copyXmlToBinary (*xml, destination);
    }

    void setStateInformation (const void* data, int size) override
    {
        if (auto xml = getXmlFromBinary (data, size))
            state.replaceState (juce::ValueTree::fromXml (*xml));
    }

private:
    juce::AudioProcessorValueTreeState state;
    std::atomic<float>* gain = nullptr;
    std::atomic<float>* mode = nullptr;
    std::array<std::array<float, reportedLatency>, 2> delay {};
    int position = 0;
};

} // namespace

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new TestGainProcessor();
}
