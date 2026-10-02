# A plug-in that goes wrong on purpose, for the test of a scan that meets one.
# It sits in a folder of its own so no other scan finds it, and has no
# manifest beside it, so a scan has to load it to learn what it is.

juce_add_plugin(LiveMixTestTrouble
    PRODUCT_NAME                "LiveMix Test Trouble"
    COMPANY_NAME                "KKFonie"
    BUNDLE_ID                   "com.kkfonie.livemix.LiveMixTestTrouble"
    PLUGIN_MANUFACTURER_CODE    KKFo
    PLUGIN_CODE                 Lmtt
    FORMATS                     VST3
    IS_SYNTH                    FALSE
    NEEDS_MIDI_INPUT            FALSE
    NEEDS_MIDI_OUTPUT           FALSE
    IS_MIDI_EFFECT              FALSE
    COPY_PLUGIN_AFTER_BUILD     FALSE
    VST3_AUTO_MANIFEST          FALSE
    NEEDS_WEB_BROWSER           FALSE
    NEEDS_CURL                  FALSE)

target_sources(LiveMixTestTrouble PRIVATE TestTrouble.cpp)

# JUCE_MODAL_LOOPS_PERMITTED: the plug-in serves events itself while its window is up.
target_compile_definitions(LiveMixTestTrouble PUBLIC
    JUCE_MODAL_LOOPS_PERMITTED=1
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0)

target_link_libraries(LiveMixTestTrouble
    PRIVATE
        juce::juce_audio_utils
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_warning_flags)

add_dependencies(LiveMixTestPlugins LiveMixTestTrouble_VST3)
