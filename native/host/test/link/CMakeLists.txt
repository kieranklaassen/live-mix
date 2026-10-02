# A second Link peer for the host's tests: Ableton's own library behind a
# line-based console, so the tests have a session to join that this
# repository did not write. Not part of the host.

add_executable(LiveMixLinkPeer LinkPeer.cpp)
set_target_properties(LiveMixLinkPeer PROPERTIES
    OUTPUT_NAME live-mix-link-peer
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}"
    RUNTIME_OUTPUT_DIRECTORY_RELEASE "${CMAKE_CURRENT_BINARY_DIR}"
    RUNTIME_OUTPUT_DIRECTORY_DEBUG "${CMAKE_CURRENT_BINARY_DIR}")
target_link_libraries(LiveMixLinkPeer PRIVATE Ableton::Link)
link_pin_win32_winnt(LiveMixLinkPeer)

add_dependencies(LiveMixTestPlugins LiveMixLinkPeer)
