// 1176-style peak limiter (`co.limiter_1176_R4_stereo`: 4:1, -6 dB threshold,
// 0.8 ms attack, 0.5 s release, level detected on |L|+|R|) as a live-mix
// device. Input gain drives the fixed threshold like the hardware's INPUT knob;
// output gain is the make-up stage.
//
// scripts/build-faust.sh compiles this to cpp/faust/generated/limiter-1176.h
// and src/dsp/devices/faust/limiter-1176.ts. Parameter ids are the `[N]` order.

declare name "Limiter1176";
declare author "live-mix (device), Julius O. Smith III (compressor)";
declare license "MIT";

import("stdfaust.lib");

// 5 ms time constant, sample-rate independent: audible knob moves land at once.
smooth = si.smooth(ba.tau2pole(0.005));

inputGain = hslider("[0] Input gain [unit:dB]", 0, 0, 40, 0.1) : ba.db2linear : smooth;
outputGain = hslider("[1] Output gain [unit:dB]", 0, -24, 24, 0.1) : ba.db2linear : smooth;

process = *(inputGain), *(inputGain) : co.limiter_1176_R4_stereo : *(outputGain), *(outputGain);
