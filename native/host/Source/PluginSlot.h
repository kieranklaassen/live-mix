// One loaded plug-in: its instance, its audio buffers, the MIDI waiting for
// the next block, and its editor window. The instance is created, changed and
// destroyed on the message thread; `process` and `addMidi` run on the slot's
// audio connection thread.

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>

#include <atomic>
#include <functional>
#include <memory>
#include <optional>

namespace livemix
{

class WsConnection;

class PluginSlot final : private juce::AudioProcessorListener,
                         private juce::AudioPlayHead
{
public:
    /** What changed a parameter since the last `collectChanges`. */
    enum class Origin : uint8_t
    {
        none = 0,
        plugin = 1,
        client = 2
    };

    PluginSlot (juce::String slotId,
                std::unique_ptr<juce::AudioPluginInstance> instance,
                juce::PluginDescription description,
                double sampleRate,
                int maxBlockSize);
    ~PluginSlot() override;

    const juce::String id;
    /** The control connection that loaded the slot; its events go there. */
    std::weak_ptr<WsConnection> owner;

    //==============================================================================
    // Audio connection thread.

    /**
        Runs `frames` frames through the plug-in. `input` and `output` are
        planar: one run of `frames` samples per channel. A slot that has been
        shut down writes silence.
    */
    void process (const float* input, int inputChannels, int frames, float* output, int outputChannels);
    /** One MIDI message for the start of the next block. */
    void addMidi (const uint8_t* bytes, int numBytes);

    //==============================================================================
    // Message thread.

    /** Name, layout, latency and the parameter table, as the `load` result. */
    juce::var describe() const;
    juce::var describeParameters() const;
    void setParameter (int index, float normalised);
    juce::String getState() const;
    bool setState (const juce::String& base64);
    /** Tempo and run state for the play head; a field left out keeps its value. */
    void setTransport (std::optional<double> bpm, std::optional<bool> playing);
    int latencySamples() const;

    bool showEditor();
    void hideEditor();
    bool editorShowing() const noexcept { return window != nullptr; }

    /** Releases the plug-in. After this `process` writes silence. */
    void shutdown();

    using ParameterChange = std::function<void (int index, float value, const juce::String& text, Origin origin)>;
    /** Reports and clears every parameter marked changed; returns whether the latency changed too. */
    bool collectChanges (const ParameterChange& onChange);
    /** True once after the user closed the editor window. */
    bool takeEditorClosed() noexcept { return editorClosed.exchange (false); }

private:
    class EditorWindow;

    void configureLayout();
    void markAllDirty (Origin origin);

    void audioProcessorParameterChanged (juce::AudioProcessor*, int parameterIndex, float newValue) override;
    void audioProcessorChanged (juce::AudioProcessor*, const ChangeDetails& details) override;
    juce::Optional<PositionInfo> getPosition() const override;

    std::unique_ptr<juce::AudioPluginInstance> plugin;
    const juce::PluginDescription description;
    const double sampleRate;
    const int maxBlockSize;
    int pluginInputs = 0;
    int pluginOutputs = 0;

    juce::CriticalSection processLock;
    juce::AudioBuffer<float> buffer;
    juce::MidiBuffer midi;
    juce::MidiBuffer pendingMidi;
    juce::SpinLock midiLock;

    std::unique_ptr<std::atomic<uint8_t>[]> dirty;
    int numParameters = 0;
    std::atomic<bool> latencyDirty { false };
    std::atomic<bool> editorClosed { false };

    std::atomic<double> bpm { 120.0 };
    std::atomic<bool> playing { true };
    std::atomic<int64_t> positionSamples { 0 };

    std::unique_ptr<EditorWindow> window;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PluginSlot)
};

} // namespace livemix
