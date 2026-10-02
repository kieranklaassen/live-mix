// Nothing at all, built for Intel processors only: a plug-in bundle a host
// on Apple silicon cannot load, for the test of the reason a scan gives.

extern "C" int liveMixIntelOnly() { return 0; }
