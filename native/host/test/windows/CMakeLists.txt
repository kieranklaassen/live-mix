# Counts a process's windows on the screen, for the test of a scan that keeps
# its windows off it. Only a Mac has the dialogs that test is about.

add_executable(LiveMixWindowCount WindowCount.cpp)
set_target_properties(LiveMixWindowCount PROPERTIES OUTPUT_NAME "live-mix-window-count")
target_link_libraries(LiveMixWindowCount PRIVATE "-framework CoreGraphics" "-framework CoreFoundation")

add_dependencies(LiveMixTestPlugins LiveMixWindowCount)
