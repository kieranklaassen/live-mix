// Test instrument: one sine per held MIDI note at velocity times a level
// parameter, no envelope. The host's tests play a note and measure the pitch.

#include <juce_audio_utils/juce_audio_utils.h>

namespace
{

class TestSineProcessor final : public juce::AudioProcessor
{
public:
    TestSineProcessor()
        : juce::AudioProcessor (BusesProperties().withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
          state (*this, nullptr, "state", createLayout())
    {
        level = state.getRawParameterValue ("level");
    }

    static juce::AudioProcessorValueTreeState::ParameterLayout createLayout()
    {
        juce::AudioProcessorValueTreeState::ParameterLayout layout;
        layout.add (std::make_unique<juce::AudioParameterFloat> (juce::ParameterID { "level", 1 }, "Level",
                                                                juce::NormalisableRange<float> (0.0f, 1.0f), 0.5f));
        return layout;
    }

    const juce::String getName() const override { return "LiveMix Test Sine"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}
    bool hasEditor() const override { return false; }
    juce::AudioProcessorEditor* createEditor() override { return nullptr; }

    bool isBusesLayoutSupported (const BusesLayout& layouts) const override
    {
        return layouts.getMainOutputChannelSet() == juce::AudioChannelSet::stereo();
    }

    void prepareToPlay (double newSampleRate, int) override
    {
        sampleRate = newSampleRate;
        for (auto& voice : voices)
            voice = {};
    }

    void releaseResources() override {}

    using juce::AudioProcessor::processBlock;

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) override
    {
        juce::ScopedNoDenormals noDenormals;
        buffer.clear();

        for (const auto metadata : midi)
        {
            const auto message = metadata.getMessage();
            if (message.isNoteOn())
            {
                auto& voice = voices[static_cast<size_t> (message.getNoteNumber())];
                voice.active = true;
                voice.phase = 0.0;
                voice.amplitude = message.getFloatVelocity();
            }
            else if (message.isNoteOff())
            {
                voices[static_cast<size_t> (message.getNoteNumber())].active = false;
            }
            else if (message.isAllNotesOff() || message.isAllSoundOff())
            {
                for (auto& voice : voices)
                    voice.active = false;
            }
        }

        const float scale = level->load();
        for (size_t note = 0; note < voices.size(); ++note)
        {
            auto& voice = voices[note];
            if (! voice.active)
                continue;
            const double increment = juce::MathConstants<double>::twoPi
                                   * juce::MidiMessage::getMidiNoteInHertz (static_cast<int> (note)) / sampleRate;
            for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
            {
                const auto value = static_cast<float> (std::sin (voice.phase)) * voice.amplitude * scale;
                voice.phase += increment;
                for (int channel = 0; channel < buffer.getNumChannels(); ++channel)
                    buffer.addSample (channel, sample, value);
            }
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
    struct Voice
    {
        bool active = false;
        double phase = 0.0;
        float amplitude = 0.0f;
    };

    juce::AudioProcessorValueTreeState state;
    std::atomic<float>* level = nullptr;
    std::array<Voice, 128> voices {};
    double sampleRate = 48000.0;
};

} // namespace

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new TestSineProcessor();
}
