#include "MacWindows.h"

#import <AppKit/AppKit.h>
#include <dispatch/dispatch.h>

namespace livemix
{

static void takeWindowsOffScreen()
{
    for (NSWindow* window in [NSApp windows])
        if ([window isVisible])
            [window orderOut: nil];
}

void keepWindowsOffScreen()
{
    static bool keeping = false;
    if (keeping)
        return;
    keeping = true;

    // Never the program in front: a dialog does not take the keyboard from
    // what the person is doing in the moment before it is gone.
    [NSApp setActivationPolicy: NSApplicationActivationPolicyProhibited];

    // As a window comes up. Everything goes by the main queue, which the main
    // thread also serves while a dialog waits for an answer, so a plug-in that
    // blocks in one is reached too.
    static NSMutableArray* observers = [[NSMutableArray alloc] init];
    for (NSNotificationName name in @[ NSWindowDidBecomeKeyNotification,
                                       NSWindowDidBecomeMainNotification,
                                       NSWindowDidChangeOcclusionStateNotification ])
    {
        id observer = [[NSNotificationCenter defaultCenter] addObserverForName: name
                                                                        object: nil
                                                                         queue: nil
                                                                    usingBlock: ^(NSNotification*) {
            dispatch_async (dispatch_get_main_queue(), ^{ takeWindowsOffScreen(); });
        }];
        [observers addObject: observer];
    }

    // And ten times a second for the one that came up unannounced. Seldom
    // enough that a thread waiting in a dialog still counts as waiting: the
    // scanner ends itself over a plug-in whose thread uses no processor.
    static dispatch_source_t timer = dispatch_source_create (DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_main_queue());
    dispatch_source_set_timer (timer, dispatch_time (DISPATCH_TIME_NOW, 0), 100 * NSEC_PER_MSEC, 20 * NSEC_PER_MSEC);
    dispatch_source_set_event_handler (timer, ^{ takeWindowsOffScreen(); });
    dispatch_resume (timer);
}

void bringWindowToFront (void* nativeView)
{
    NSView* view = (__bridge NSView*) nativeView;
    if (view == nil || [view window] == nil)
        return;

    [NSApp activateIgnoringOtherApps: YES];
    [[view window] orderFrontRegardless];
}

} // namespace livemix
