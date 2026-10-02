#include "WhyNoPlugin.h"

#if JUCE_MAC
 #include <CoreFoundation/CoreFoundation.h>
#endif

#if ! JUCE_WINDOWS
 #include <dlfcn.h>
#endif

#if JUCE_LINUX || JUCE_BSD
 #include <sys/utsname.h>
#endif

namespace livemix
{

namespace
{
    constexpr int longestReason = 400;

   #if ! JUCE_WINDOWS
    /** What the system says when it is asked to load `program`; empty when it loads. */
    juce::String loadError (const juce::File& program)
    {
        // Loaded for good if it loads: the scan has had the same program in
        // this process a moment ago, and the process ends with the list.
        if (dlopen (program.getFullPathName().toRawUTF8(), RTLD_LAZY | RTLD_LOCAL) != nullptr)
            return {};
        const auto* said = dlerror();
        auto text = juce::String::fromUTF8 (said != nullptr ? said : "no reason given")
                        .replaceCharacters ("\r\n\t", "   ")
                        .trim();
        while (text.contains ("  "))
            text = text.replace ("  ", " ");
        return text.length() > longestReason ? text.substring (0, longestReason) + "…" : text;
    }
   #endif

   #if JUCE_MAC
    constexpr int thisProcessor =
       #if defined (__arm64__) || defined (__aarch64__)
        kCFBundleExecutableArchitectureARM64;
       #else
        kCFBundleExecutableArchitectureX86_64;
       #endif

    juce::String processorName (int architecture)
    {
        if (architecture == kCFBundleExecutableArchitectureARM64)   return "Apple silicon";
        if (architecture == kCFBundleExecutableArchitectureX86_64)  return "Intel";
        if (architecture == kCFBundleExecutableArchitectureI386)    return "32-bit Intel";
        if (architecture == kCFBundleExecutableArchitecturePPC
            || architecture == kCFBundleExecutableArchitecturePPC64) return "PowerPC";
        return "another processor";
    }

    /** The program inside a bundle, and the processors it is built for (none when that cannot be told). */
    juce::File programOf (const juce::File& file, juce::Array<int>& processors)
    {
        if (! file.isDirectory())
            return file;

        juce::File program;
        const auto path = file.getFullPathName().toCFString();
        const auto url = CFURLCreateWithFileSystemPath (kCFAllocatorDefault, path, kCFURLPOSIXPathStyle, true);
        CFRelease (path);
        if (url == nullptr)
            return program;

        if (const auto bundle = CFBundleCreate (kCFAllocatorDefault, url))
        {
            if (const auto executable = CFBundleCopyExecutableURL (bundle))
            {
                if (const auto absolute = CFURLCopyAbsoluteURL (executable))
                {
                    if (const auto found = CFURLCopyFileSystemPath (absolute, kCFURLPOSIXPathStyle))
                    {
                        program = juce::File (juce::String::fromCFString (found));
                        CFRelease (found);
                    }
                    CFRelease (absolute);
                }
                CFRelease (executable);
            }
            if (const auto built = CFBundleCopyExecutableArchitectures (bundle))
            {
                for (CFIndex index = 0; index < CFArrayGetCount (built); ++index)
                {
                    auto architecture = 0;
                    const auto number = static_cast<CFNumberRef> (CFArrayGetValueAtIndex (built, index));
                    if (CFNumberGetValue (number, kCFNumberIntType, &architecture))
                        processors.add (architecture);
                }
                CFRelease (built);
            }
            CFRelease (bundle);
        }
        CFRelease (url);
        // A bundle that says nothing about itself has its program under its own name.
        if (program == juce::File())
            program = file.getChildFile ("Contents/MacOS").getChildFile (file.getFileNameWithoutExtension());
        return program;
    }
   #elif JUCE_LINUX || JUCE_BSD
    /** The program inside a VST3 bundle: `Contents/<machine>-linux/<name>.so`. */
    juce::File programOf (const juce::File& file, juce::Array<int>&)
    {
        if (! file.isDirectory())
            return file;
        // The machine the folder is named after is the one `uname` gives, the
        // same as the scan looks for: a bundle built for more than one machine
        // holds programs this system cannot load beside the one it can.
        utsname machine;
        if (uname (&machine) != 0)
            return {};
        return file.getChildFile ("Contents")
                   .getChildFile (juce::String::fromUTF8 (machine.machine) + "-linux")
                   .getChildFile (file.getFileNameWithoutExtension() + ".so");
    }
   #endif
}

juce::String whyNoPlugin (const juce::String& identifier)
{
   #if JUCE_WINDOWS
    juce::ignoreUnused (identifier);
    return {};
   #else
    if (! juce::File::isAbsolutePath (identifier))
        return {};
    const juce::File file (identifier);
    if (! file.exists())
        return "The file is not there any more.";

    juce::Array<int> processors;
    const auto program = programOf (file, processors);
    if (! program.existsAsFile())
        return "The bundle holds no program for this system.";

   #if JUCE_MAC
    if (! processors.isEmpty() && ! processors.contains (thisProcessor))
    {
        juce::StringArray built;
        for (const auto architecture : processors)
            built.addIfNotAlreadyThere (processorName (architecture));
        return "It is built for " + built.joinIntoString (" and ") + " only, and this app runs as "
             + processorName (thisProcessor) + ". It needs a version of the plug-in for " + processorName (thisProcessor) + ".";
    }
   #endif

    const auto refused = loadError (program);
   #if JUCE_MAC
    // The bundle did not say what it is built for, and the system does.
    if (refused.contains ("incompatible architecture"))
        return "It is built for another processor than this app runs on (" + processorName (thisProcessor)
             + "). It needs a version of the plug-in for " + processorName (thisProcessor) + ".";
   #endif
    if (refused.isNotEmpty())
        return "The system would not load it: " + refused;
    return "It loads, and gave the scan no plug-in.";
   #endif
}

} // namespace livemix
