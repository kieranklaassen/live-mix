// Why a plug-in file gave a scan no plug-in, in words for the person whose
// plug-in it is: the scan itself only says that it found nothing.

#pragma once

#include <juce_core/juce_core.h>

namespace livemix
{

/**
    What is wrong with the plug-in file `identifier`, looked at after a scan
    found no plug-in in it: no program in the bundle, a program for another
    processor, or what the system said when it was asked to load it. Empty for
    a plug-in that is not a file (an Audio Unit is known by a code).

    Loads the plug-in's program, so it belongs in the process the scan runs in.
*/
juce::String whyNoPlugin (const juce::String& identifier);

} // namespace livemix
