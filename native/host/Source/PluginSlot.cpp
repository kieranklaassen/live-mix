#include "PluginSlot.h"

#include <juce_gui_basics/juce_gui_basics.h>

namespace livemix
{

namespace
{
    /** A discrete parameter with at most this many steps reports a label per step. */
    constexpr int maxChoiceSteps = 64;
    constexpr int maxTextLength = 64;

    juce::String parameterId (juce::AudioProcessorParameter& parameter, int index)
    {
        if (auto* hosted = dynamic_cast<juce::HostedAudioProcessorParameter*> (&parameter))
        {
            const auto id = hosted->getParameterID();
            if (id.isNotEmpty())
                return id;
        }
        return "#" + juce::String (index);
    }

    /**
        VST3 has no MIDI controller input, so plug-in frameworks publish one
        proxy parameter per controller and channel (2048 of them) and mark them
        hidden. JUCE does not pass that flag on, so they are told by name.
    */
    bool isMidiControllerProxy (const juce::String& name)
    {
        return name.startsWith ("MIDI CC") || name.startsWith ("MIDI Ch.");
    }
}

//==============================================================================
class PluginSlot::EditorWindow final : public juce::DocumentWindow
{
public:
    EditorWindow (PluginSlot& slotToUse, juce::AudioProcessorEditor* editor)
        : juce::DocumentWindow (slotToUse.plugin->getName(),
                                juce::Colours::darkgrey,
                                juce::DocumentWindow::closeButton | juce::DocumentWindow::minimiseButton),
          slot (slotToUse)
    {
        setUsingNativeTitleBar (true);
        setContentOwned (editor, true);
        setResizable (editor->isResizable(), false);
        // The host has no window of its own to stay behind: keep the editor
        // above the shell's window, which belongs to another process.
        setAlwaysOnTop (true);
        centreWithSize (getWidth(), getHeight());
        setVisible (true);
        toFront (true);
    }

    ~EditorWindow() override
    {
        // The editor must go before the processor it edits.
        clearContentComponent();
    }

    void closeButtonPressed() override
    {
        slot.editorClosed = true;
        juce::MessageManager::callAsync ([weak = juce::Component::SafePointer<EditorWindow> (this)]
        {
            if (weak != nullptr)
                weak->slot.hideEditor();
        });
    }

private:
    PluginSlot& slot;
};

//==============================================================================
PluginSlot::PluginSlot (juce::String slotId,
                        std::unique_ptr<juce::AudioPluginInstance> instance,
                        juce::PluginDescription descriptionToUse,
                        double sampleRateToUse,
                        int maxBlockSizeToUse)
    : id (std::move (slotId)),
      plugin (std::move (instance)),
      description (std::move (descriptionToUse)),
      sampleRate (sampleRateToUse),
      maxBlockSize (juce::jmax (16, maxBlockSizeToUse))
{
    configureLayout();

    plugin->setProcessingPrecision (juce::AudioProcessor::singlePrecision);
    plugin->setPlayHead (this);
    plugin->setNonRealtime (false);
    plugin->prepareToPlay (sampleRate, maxBlockSize);

    pluginInputs = plugin->getTotalNumInputChannels();
    pluginOutputs = plugin->getTotalNumOutputChannels();
    buffer.setSize (juce::jmax (1, pluginInputs, pluginOutputs), maxBlockSize);
    midi.ensureSize (2048);
    pendingMidi.ensureSize (2048);

    numParameters = plugin->getParameters().size();
    dirty.reset (new std::atomic<uint8_t>[static_cast<size_t> (juce::jmax (1, numParameters))]);
    for (int i = 0; i < numParameters; ++i)
        dirty[static_cast<size_t> (i)] = 0;

    plugin->addListener (this);
}

PluginSlot::~PluginSlot()
{
    shutdown();
}

void PluginSlot::configureLayout()
{
    // Stereo on the main buses, side chains and extra outputs off. A plug-in
    // that refuses (mono only, fixed layouts) keeps its own default and
    // `process` adapts the channel count.
    auto layout = plugin->getBusesLayout();
    for (int bus = 0; bus < layout.inputBuses.size(); ++bus)
        layout.inputBuses.getReference (bus) = bus == 0 ? juce::AudioChannelSet::stereo() : juce::AudioChannelSet::disabled();
    for (int bus = 0; bus < layout.outputBuses.size(); ++bus)
        layout.outputBuses.getReference (bus) = bus == 0 ? juce::AudioChannelSet::stereo() : juce::AudioChannelSet::disabled();

    if (! plugin->checkBusesLayoutSupported (layout) || ! plugin->setBusesLayout (layout))
        plugin->disableNonMainBuses();

    plugin->setRateAndBufferSizeDetails (sampleRate, maxBlockSize);
}

void PluginSlot::shutdown()
{
    window.reset();

    std::unique_ptr<juce::AudioPluginInstance> released;
    {
        const juce::ScopedLock lock (processLock);
        released = std::move (plugin);
    }
    if (released != nullptr)
    {
        released->removeListener (this);
        released->setPlayHead (nullptr);
        released->releaseResources();
    }
}

//==============================================================================
void PluginSlot::process (const float* input, int inputChannels, int frames, float* output, int outputChannels)
{
    const juce::ScopedLock lock (processLock);

    if (plugin == nullptr)
    {
        juce::FloatVectorOperations::clear (output, frames * outputChannels);
        return;
    }

    {
        const juce::SpinLock::ScopedLockType midiGuard (midiLock);
        midi.swapWith (pendingMidi);
        pendingMidi.clear();
    }

    int done = 0;
    while (done < frames)
    {
        const int count = juce::jmin (frames - done, maxBlockSize);
        buffer.setSize (buffer.getNumChannels(), count, false, false, true);

        for (int channel = 0; channel < buffer.getNumChannels(); ++channel)
        {
            auto* destination = buffer.getWritePointer (channel);
            if (channel >= pluginInputs || inputChannels == 0)
            {
                juce::FloatVectorOperations::clear (destination, count);
            }
            else if (pluginInputs == 1 && inputChannels > 1)
            {
                // A mono plug-in on a stereo strip hears the sum at unity for centred material.
                juce::FloatVectorOperations::copy (destination, input + done, count);
                for (int source = 1; source < inputChannels; ++source)
                    juce::FloatVectorOperations::add (destination, input + source * frames + done, count);
                juce::FloatVectorOperations::multiply (destination, 1.0f / static_cast<float> (inputChannels), count);
            }
            else
            {
                const int source = juce::jmin (channel, inputChannels - 1);
                juce::FloatVectorOperations::copy (destination, input + source * frames + done, count);
            }
        }

        {
            const juce::ScopedLock callbackLock (plugin->getCallbackLock());
            if (plugin->isSuspended())
                buffer.clear();
            else
                plugin->processBlock (buffer, midi);
        }
        midi.clear();

        for (int channel = 0; channel < outputChannels; ++channel)
        {
            auto* destination = output + channel * frames + done;
            if (pluginOutputs == 0)
                juce::FloatVectorOperations::clear (destination, count);
            else
                juce::FloatVectorOperations::copy (destination, buffer.getReadPointer (juce::jmin (channel, pluginOutputs - 1)), count);
        }

        done += count;
        positionSamples += count;
    }
}

void PluginSlot::addMidi (const uint8_t* bytes, int numBytes)
{
    if (numBytes <= 0)
        return;
    const juce::SpinLock::ScopedLockType guard (midiLock);
    pendingMidi.addEvent (bytes, numBytes, 0);
}

//==============================================================================
juce::var PluginSlot::describeParameters() const
{
    juce::Array<juce::var> list;
    if (plugin == nullptr)
        return list;

    const auto& parameters = plugin->getParameters();
    const auto* bypass = plugin->getBypassParameter();
    for (int index = 0; index < parameters.size(); ++index)
    {
        auto* parameter = parameters.getUnchecked (index);
        const auto name = parameter->getName (maxTextLength);
        if (isMidiControllerProxy (name))
            continue;
        auto* entry = new juce::DynamicObject();
        const auto value = parameter->getValue();
        const bool discrete = parameter->isDiscrete();
        const int steps = parameter->getNumSteps();

        entry->setProperty ("index", index);
        entry->setProperty ("id", parameterId (*parameter, index));
        entry->setProperty ("name", name);
        entry->setProperty ("label", parameter->getLabel());
        entry->setProperty ("value", value);
        entry->setProperty ("default", parameter->getDefaultValue());
        entry->setProperty ("text", parameter->getText (value, maxTextLength));
        entry->setProperty ("discrete", discrete);
        entry->setProperty ("boolean", parameter->isBoolean());
        entry->setProperty ("automatable", parameter->isAutomatable());
        entry->setProperty ("bypass", parameter == bypass);
        entry->setProperty ("steps", discrete ? steps : 0);

        if (discrete && steps >= 2 && steps <= maxChoiceSteps)
        {
            juce::Array<juce::var> choices;
            for (int step = 0; step < steps; ++step)
                choices.add (parameter->getText (static_cast<float> (step) / static_cast<float> (steps - 1), maxTextLength));
            entry->setProperty ("choices", choices);
        }

        list.add (juce::var (entry));
    }
    return list;
}

juce::var PluginSlot::describe() const
{
    auto* result = new juce::DynamicObject();
    result->setProperty ("slot", id);
    result->setProperty ("plugin", description.createIdentifierString());
    result->setProperty ("name", description.name);
    result->setProperty ("vendor", description.manufacturerName);
    result->setProperty ("format", description.pluginFormatName);
    result->setProperty ("isInstrument", description.isInstrument);
    result->setProperty ("inputs", pluginInputs);
    result->setProperty ("outputs", pluginOutputs);
    result->setProperty ("sampleRate", sampleRate);
    result->setProperty ("blockSize", maxBlockSize);
    result->setProperty ("latencySamples", latencySamples());
    result->setProperty ("tailSeconds", plugin != nullptr ? juce::jmin (plugin->getTailLengthSeconds(), 3600.0) : 0.0);
    result->setProperty ("hasEditor", plugin != nullptr && plugin->hasEditor());
    result->setProperty ("acceptsMidi", plugin != nullptr && plugin->acceptsMidi());
    result->setProperty ("params", describeParameters());
    return juce::var (result);
}

int PluginSlot::latencySamples() const
{
    return plugin != nullptr ? juce::jmax (0, plugin->getLatencySamples()) : 0;
}

void PluginSlot::setParameter (int index, float normalised)
{
    if (plugin == nullptr || index < 0 || index >= numParameters)
        return;
    auto* parameter = plugin->getParameters().getUnchecked (index);
    parameter->setValue (juce::jlimit (0.0f, 1.0f, normalised));
    dirty[static_cast<size_t> (index)] = static_cast<uint8_t> (Origin::client);
}

juce::String PluginSlot::getState() const
{
    // Read beside the audio connection's thread, as every host does: waiting
    // for it here would hold up a block of live sound on each save or export.
    if (plugin == nullptr)
        return {};
    juce::MemoryBlock state;
    plugin->getStateInformation (state);
    return juce::Base64::toBase64 (state.getData(), state.getSize());
}

bool PluginSlot::setState (const juce::String& base64)
{
    if (plugin == nullptr)
        return false;
    juce::MemoryOutputStream decoded;
    if (! juce::Base64::convertFromBase64 (decoded, base64))
        return false;
    // The audio connection's thread may be inside processBlock. Suspending
    // waits for that block to end and has `process` write silence until the
    // new state is in, without holding the audio thread for the whole load.
    plugin->suspendProcessing (true);
    plugin->setStateInformation (decoded.getData(), static_cast<int> (decoded.getDataSize()));
    plugin->suspendProcessing (false);
    markAllDirty (Origin::plugin);
    return true;
}

void PluginSlot::setTransport (std::optional<double> newBpm, std::optional<bool> isPlaying)
{
    if (newBpm.has_value() && *newBpm > 0.0)
        bpm = *newBpm;
    if (isPlaying.has_value())
        playing = *isPlaying;
}

void PluginSlot::markAllDirty (Origin origin)
{
    for (int i = 0; i < numParameters; ++i)
        dirty[static_cast<size_t> (i)] = static_cast<uint8_t> (origin);
}

bool PluginSlot::collectChanges (const ParameterChange& onChange)
{
    if (plugin != nullptr)
    {
        const auto& parameters = plugin->getParameters();
        const int count = juce::jmin (numParameters, parameters.size());
        for (int index = 0; index < count; ++index)
        {
            const auto origin = static_cast<Origin> (dirty[static_cast<size_t> (index)].exchange (0));
            if (origin == Origin::none)
                continue;
            auto* parameter = parameters.getUnchecked (index);
            const auto value = parameter->getValue();
            onChange (index, value, parameter->getText (value, maxTextLength), origin);
        }
    }
    return latencyDirty.exchange (false);
}

//==============================================================================
bool PluginSlot::showEditor()
{
    if (plugin == nullptr)
        return false;
    if (window != nullptr)
    {
        window->toFront (true);
        return true;
    }

    juce::AudioProcessorEditor* editor = plugin->hasEditor() ? plugin->createEditorAndMakeActive() : nullptr;
    if (editor == nullptr)
        editor = new juce::GenericAudioProcessorEditor (*plugin);

    juce::Process::makeForegroundProcess();
    window = std::make_unique<EditorWindow> (*this, editor);
    return true;
}

void PluginSlot::hideEditor()
{
    window.reset();
}

//==============================================================================
void PluginSlot::audioProcessorParameterChanged (juce::AudioProcessor*, int parameterIndex, float)
{
    if (parameterIndex >= 0 && parameterIndex < numParameters)
    {
        // A client write still waiting to be echoed keeps its origin.
        uint8_t expected = 0;
        dirty[static_cast<size_t> (parameterIndex)].compare_exchange_strong (expected, static_cast<uint8_t> (Origin::plugin));
    }
}

void PluginSlot::audioProcessorChanged (juce::AudioProcessor*, const ChangeDetails& details)
{
    if (details.latencyChanged)
        latencyDirty = true;
    if (details.parameterInfoChanged || details.programChanged)
        markAllDirty (Origin::plugin);
}

juce::Optional<juce::AudioPlayHead::PositionInfo> PluginSlot::getPosition() const
{
    PositionInfo info;
    const auto samples = positionSamples.load();
    const auto seconds = static_cast<double> (samples) / sampleRate;
    const auto tempo = bpm.load();
    info.setTimeInSamples (samples);
    info.setTimeInSeconds (seconds);
    info.setBpm (tempo);
    info.setTimeSignature (juce::AudioPlayHead::TimeSignature { 4, 4 });
    info.setPpqPosition (seconds * tempo / 60.0);
    info.setIsPlaying (playing.load());
    info.setIsRecording (false);
    info.setIsLooping (false);
    return info;
}

} // namespace livemix
