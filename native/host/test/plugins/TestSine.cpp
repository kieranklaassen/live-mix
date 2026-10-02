// Test instrument: one sine per held MIDI note at velocity times a level
// parameter, no envelope. The host's tests play a note and measure the pitch.
//
// It also has a tuning no parameter shows, the way a sampler has its sample:
// controller 20 sets it (64 is in tune, each step a semitone), it lives only
// in the state, and the plug-in tells the host its state changed.

#include <juce_audio_utils/juce_audio_utils.h>

namespace
{

constexpr int tuneController = 20;
constexpr int tuneCentre = 64;

class TestSineProcessor final : public juce::AudioProcessor,
                                private juce::Timer
{
public:
    TestSineProcessor()
        : juce::AudioProcessor (BusesProperties().withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
          state (*this, nullptr, "state", createLayout())
    {
        level = state.getRawParameterValue ("level");
        startTimerHz (30);
    }

    ~TestSineProcessor() override { stopTimer(); }

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
            else if (message.isController() && message.getControllerNumber() == tuneController)
            {
                tune = message.getControllerValue() - tuneCentre;
                tuneChanged = true;
            }
            else if (message.isAllNotesOff() || message.isAllSoundOff())
            {
                for (auto& voice : voices)
                    voice.active = false;
            }
        }

        const float scale = level->load();
        const double detune = std::pow (2.0, tune.load() / 12.0);
        for (size_t note = 0; note < voices.size(); ++note)
        {
            auto& voice = voices[note];
            if (! voice.active)
                continue;
            const double increment = juce::MathConstants<double>::twoPi
                                   * juce::MidiMessage::getMidiNoteInHertz (static_cast<int> (note)) * detune / sampleRate;
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
        auto tree = state.copyState();
        tree.setProperty ("tune", tune.load(), nullptr);
        if (auto xml = tree.createXml())
            copyXmlToBinary (*xml, destination);
    }

    void setStateInformation (const void* data, int size) override
    {
        if (auto xml = getXmlFromBinary (data, size))
        {
            const auto tree = juce::ValueTree::fromXml (*xml);
            tune = static_cast<int> (tree.getProperty ("tune", 0));
            state.replaceState (tree);
        }
    }

private:
    // The audio thread only raises the flag; the host hears of it from here.
    void timerCallback() override
    {
        if (tuneChanged.exchange (false))
            updateHostDisplay (ChangeDetails().withNonParameterStateChanged (true));
    }

    struct Voice
    {
        bool active = false;
        double phase = 0.0;
        float amplitude = 0.0f;
    };

    juce::AudioProcessorValueTreeState state;
    std::atomic<float>* level = nullptr;
    std::atomic<int> tune { 0 };
    std::atomic<bool> tuneChanged { false };
    std::array<Voice, 128> voices {};
    double sampleRate = 48000.0;
};

} // namespace

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new TestSineProcessor();
}
