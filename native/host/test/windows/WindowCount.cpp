// Prints how many windows of one process are on the screen, for the test of
// a scan that keeps its windows off it. macOS only.
//
//   live-mix-window-count PID

#include <CoreFoundation/CoreFoundation.h>
#include <CoreGraphics/CoreGraphics.h>

#include <cstdio>
#include <cstdlib>

int main (int argc, char** argv)
{
    if (argc < 2)
        return 2;
    const auto pid = std::atoi (argv[1]);

    auto count = 0;
    if (const auto windows = CGWindowListCopyWindowInfo (kCGWindowListOptionOnScreenOnly, kCGNullWindowID))
    {
        for (CFIndex index = 0; index < CFArrayGetCount (windows); ++index)
        {
            const auto window = static_cast<CFDictionaryRef> (CFArrayGetValueAtIndex (windows, index));
            const auto owner = static_cast<CFNumberRef> (CFDictionaryGetValue (window, kCGWindowOwnerPID));
            auto value = 0;
            if (owner != nullptr && CFNumberGetValue (owner, kCFNumberIntType, &value) && value == pid)
                ++count;
        }
        CFRelease (windows);
    }

    std::printf ("%d\n", count);
    return 0;
}
