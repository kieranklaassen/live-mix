// FET-style peak limiter (Faust's `co.limiter_1176_R4_stereo`: 4:1, -6 dB threshold,
// 0.8 ms attack, 0.5 s release, level detected on |L|+|R|) as a live-mix
// device. Input gain drives the fixed threshold like the hardware's INPUT knob;
// output gain is the make-up stage.
//
// The compressor alone is a levelling stage: its attack lets a transient
// through at whatever height the input gain gave it (a click at -6 dBFS left
// at +18 dBFS with 24 dB of drive). The ceiling after it is the part that
// limits: linear up to half scale, where the compressor holds a steady
// signal, then a tanh knee that approaches full scale and never passes it.
// With output gain at 0 dB nothing leaves above 0 dBFS.
//
// scripts/build-faust.sh compiles this to cpp/faust/generated/fet-limiter.h
// and src/dsp/devices/faust/fet-limiter.ts. Parameter ids are the `[N]` order.

declare name "FetLimiter";
declare author "live-mix (device), Julius O. Smith III (compressor)";
declare license "MIT";

import("stdfaust.lib");

// 5 ms time constant, sample-rate independent: audible knob moves land at once.
smooth = si.smooth(ba.tau2pole(0.005));

inputGain = hslider("[0] Input gain [unit:dB]", 0, 0, 40, 0.1) : ba.db2linear : smooth;
outputGain = hslider("[1] Output gain [unit:dB]", 0, -24, 24, 0.1) : ba.db2linear : smooth;

knee = 0.5;
ceiling(x) = ba.if(abs(x) > knee, ma.signum(x) * (knee + (1 - knee) * ma.tanh((abs(x) - knee) / (1 - knee))), x);

process = *(inputGain), *(inputGain) : co.limiter_1176_R4_stereo : ceiling, ceiling : *(outputGain), *(outputGain);
