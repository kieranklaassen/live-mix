// What the host asks of a Mac's window system directly. Nothing on other
// systems, where both calls do nothing.

#pragma once

namespace livemix
{

/**
    From now on every window this process opens is taken off the screen again
    at once, and the process cannot become the one in front. For the process a
    scan runs in: a plug-in that asks for its licence in a dialog would put
    that dialog over whatever the person is doing, once for every plug-in of
    the product.
*/
#if defined (__APPLE__)
void keepWindowsOffScreen();
#else
inline void keepWindowsOffScreen() {}
#endif

/**
    Puts the window that holds `nativeView` (an NSView) in front of the other
    programs' windows, whether or not this program is the active one. A window
    ordered to the front by a program that is not active stays behind the
    active program's windows.
*/
#if defined (__APPLE__)
void bringWindowToFront (void* nativeView);
#else
inline void bringWindowToFront (void*) {}
#endif

} // namespace livemix
