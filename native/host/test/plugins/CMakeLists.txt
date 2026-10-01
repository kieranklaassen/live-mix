# Two small plug-ins the host's tests scan, load and play. They exist so the
# tests never depend on what happens to be installed on the machine.

set(LIVE_MIX_TEST_PLUGIN_FORMATS VST3)
if(APPLE)
    list(APPEND LIVE_MIX_TEST_PLUGIN_FORMATS AU)
endif()

function(live_mix_add_test_plugin target product code source is_synth)
    juce_add_plugin(${target}
        PRODUCT_NAME                "${product}"
        COMPANY_NAME                "KKFonie"
        BUNDLE_ID                   "com.kkfonie.livemix.${target}"
        PLUGIN_MANUFACTURER_CODE    KKFo
        PLUGIN_CODE                 ${code}
        FORMATS                     ${LIVE_MIX_TEST_PLUGIN_FORMATS}
        IS_SYNTH                    ${is_synth}
        NEEDS_MIDI_INPUT            ${is_synth}
        NEEDS_MIDI_OUTPUT           FALSE
        IS_MIDI_EFFECT              FALSE
        COPY_PLUGIN_AFTER_BUILD     FALSE
        NEEDS_WEB_BROWSER           FALSE
        NEEDS_CURL                  FALSE)

    target_sources(${target} PRIVATE ${source})

    target_compile_definitions(${target} PUBLIC
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0)

    target_link_libraries(${target}
        PRIVATE
            juce::juce_audio_utils
        PUBLIC
            juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
endfunction()

live_mix_add_test_plugin(LiveMixTestGain "LiveMix Test Gain" Lmtg TestGain.cpp FALSE)
live_mix_add_test_plugin(LiveMixTestSine "LiveMix Test Sine" Lmts TestSine.cpp TRUE)

add_custom_target(LiveMixTestPlugins DEPENDS LiveMixTestGain_VST3 LiveMixTestSine_VST3)
if(APPLE)
    add_dependencies(LiveMixTestPlugins LiveMixTestGain_AU LiveMixTestSine_AU)
endif()
