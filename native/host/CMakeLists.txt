# The live-mix plug-in host: a small JUCE application that loads VST3 (and, on
# macOS, Audio Unit) plug-ins and processes audio for a browser engine over a
# local WebSocket. See docs/native.md for the protocol and native/host/README.md
# for building.

cmake_minimum_required(VERSION 3.22)

project(LiveMixPluginHost VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_OSX_DEPLOYMENT_TARGET "11.0" CACHE STRING "Minimum macOS version")

option(LIVE_MIX_HOST_BUILD_TEST_PLUGINS "Build the plug-ins and the Link peer the host's own tests use" OFF)
# Ableton Link is GPL v2 or later: a host built with it is covered by that
# licence (cmake/LiveMixLink.cmake). OFF leaves Link out; the host then says
# it has none and pages carry on without it.
option(LIVE_MIX_HOST_LINK "Build Ableton Link and Link Audio into the host" ON)

include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/LiveMixJUCE.cmake)
live_mix_add_juce()

include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/LiveMixLink.cmake)
if(LIVE_MIX_HOST_LINK)
    live_mix_add_link()
endif()

juce_add_gui_app(LiveMixPluginHost
    PRODUCT_NAME                    "live-mix-plugin-host"
    COMPANY_NAME                    "KKFonie"
    BUNDLE_ID                       com.kkfonie.livemix.pluginhost
    PLUGINHOST_AU                   TRUE
    NEEDS_WEB_BROWSER               FALSE
    NEEDS_CURL                      FALSE
    # The host is a helper of the desktop shell: no Dock icon, no menu bar of
    # its own. Plug-in editor windows still show. macOS asks before a program
    # may find others on the local network, which is what Link does.
    PLIST_TO_MERGE                  "<plist version=\"1.0\"><dict><key>LSUIElement</key><true/><key>NSLocalNetworkUsageDescription</key><string>Ableton Link finds other music programs on your network to play in time with them.</string></dict></plist>")

target_sources(LiveMixPluginHost PRIVATE
    Source/HostServer.cpp
    Source/LinkSession.cpp
    Source/Main.cpp
    Source/PluginSlot.cpp
    Source/ScanWorker.cpp
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
    LIVE_MIX_HOST_JUCE_VERSION="${LIVE_MIX_JUCE_VERSION}"
    LIVE_MIX_HOST_LINK=$<BOOL:${LIVE_MIX_HOST_LINK}>
    LIVE_MIX_HOST_LINK_VERSION="${LIVE_MIX_LINK_VERSION}")

target_link_libraries(LiveMixPluginHost PRIVATE
    juce::juce_audio_processors
    juce::juce_gui_basics
    juce::juce_recommended_config_flags
    juce::juce_recommended_warning_flags)

if(LIVE_MIX_HOST_LINK)
    target_link_libraries(LiveMixPluginHost PRIVATE Ableton::Link)
    if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
        # GCC reports a field of Link's own packet buffer as uninitialised
        # once it has inlined the encoder into this file.
        set_source_files_properties(Source/LinkSession.cpp PROPERTIES COMPILE_OPTIONS "-Wno-uninitialized;-Wno-maybe-uninitialized")
    endif()
endif()

if(LIVE_MIX_HOST_BUILD_TEST_PLUGINS)
    add_subdirectory(test/plugins)
    add_subdirectory(test/trouble)
    if(LIVE_MIX_HOST_LINK)
        add_subdirectory(test/link)
    endif()
endif()
