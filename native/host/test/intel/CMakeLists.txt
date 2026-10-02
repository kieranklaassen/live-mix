# A VST3 bundle whose program is built for Intel processors only: what an old
# plug-in is to a host on Apple silicon. The scan finds no plug-in in it and
# says why. Only a Mac has two processors to tell apart.

add_library(LiveMixIntelOnly MODULE IntelOnly.cpp)
set_target_properties(LiveMixIntelOnly PROPERTIES
    OSX_ARCHITECTURES "x86_64"
    PREFIX ""
    SUFFIX ""
    OUTPUT_NAME "IntelOnly"
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/IntelOnly.vst3/Contents/MacOS")

add_dependencies(LiveMixTestPlugins LiveMixIntelOnly)

# What tells the system which file in the bundle is its program, as every
# real plug-in bundle has.
file(WRITE "${CMAKE_CURRENT_BINARY_DIR}/IntelOnly.vst3/Contents/Info.plist"
"<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">
<plist version=\"1.0\">
<dict>
    <key>CFBundleExecutable</key>
    <string>IntelOnly</string>
    <key>CFBundleIdentifier</key>
    <string>com.livemix.test.intelonly</string>
    <key>CFBundleName</key>
    <string>IntelOnly</string>
    <key>CFBundlePackageType</key>
    <string>BNDL</string>
</dict>
</plist>
")
