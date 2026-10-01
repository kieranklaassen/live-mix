# The live-mix plug-in host: a small JUCE application that loads VST3 (and, on
# macOS, Audio Unit) plug-ins and processes audio for a browser engine over a
# local WebSocket. See docs/native.md for the protocol and native/host/README.md
# for building.

cmake_minimum_required(VERSION 3.22)

project(LiveMixPluginHost VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_OSX_DEPLOYMENT_TARGET "11.0" CACHE STRING "Minimum macOS version")

option(LIVE_MIX_HOST_BUILD_TEST_PLUGINS "Build the two plug-ins the host's own tests load" OFF)

include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/LiveMixJUCE.cmake)
live_mix_add_juce()

juce_add_gui_app(LiveMixPluginHost
    PRODUCT_NAME                    "live-mix-plugin-host"
    COMPANY_NAME                    "KKFonie"
    BUNDLE_ID                       com.kkfonie.livemix.pluginhost
    PLUGINHOST_AU                   TRUE
    NEEDS_WEB_BROWSER               FALSE
    NEEDS_CURL                      FALSE
    # The host is a helper of the desktop shell: no Dock icon, no menu bar of
    # its own. Plug-in editor windows still show.
    PLIST_TO_MERGE                  "<plist version=\"1.0\"><dict><key>LSUIElement</key><true/></dict></plist>")

target_sources(LiveMixPluginHost PRIVATE
    Source/HostServer.cpp
    Source/Main.cpp
    Source/PluginSlot.cpp
    Source/WebSocket.cpp)

target_compile_definitions(LiveMixPluginHost PRIVATE
    JUCE_PLUGINHOST_VST3=1
    JUCE_PLUGINHOST_VST=0
    JUCE_PLUGINHOST_LADSPA=0
    JUCE_PLUGINHOST_LV2=0
    JUCE_PLUGINHOST_ARA=0
    JUCE_VST3_HOST_CROSS_PLATFORM_UID=1
    JUCE_USE_CURL=0
    JUCE_WEB_BROWSER=0
    JUCE_USE_FLAC=0
    JUCE_USE_OGGVORBIS=0
    JUCE_USE_MP3AUDIOFORMAT=0
    JUCE_DISABLE_CAUTIOUS_PARAMETER_ID_CHECKING=1
    JUCE_MODAL_LOOPS_PERMITTED=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:LiveMixPluginHost,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:LiveMixPluginHost,JUCE_VERSION>"
    LIVE_MIX_HOST_JUCE_VERSION="${LIVE_MIX_JUCE_VERSION}")

target_link_libraries(LiveMixPluginHost PRIVATE
    juce::juce_audio_processors
    juce::juce_gui_basics
    juce::juce_recommended_config_flags
    juce::juce_recommended_warning_flags)

if(LIVE_MIX_HOST_BUILD_TEST_PLUGINS)
    add_subdirectory(test/plugins)
endif()
