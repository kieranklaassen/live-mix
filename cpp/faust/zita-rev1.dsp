// Zita-Rev1 stereo reverb (Fons Adriaensen's FDN design, Faust port by Julius
// O. Smith III) as a live-mix device: stereo in, stereo out, dry/wet mix with
// the same law as the Dattorro device (`dry*(1-mix) + wet*mix`).
//
// scripts/build-faust.sh compiles this to cpp/faust/generated/zita-rev1.h and
// src/dsp/devices/faust/zita-rev1.ts. Parameter ids are the `[N]` order below.

declare name "ZitaRev1";
declare author "live-mix (device), Fons Adriaensen (algorithm), Julius O. Smith III (Faust port)";
declare license "MIT";

import("stdfaust.lib");

// Delay lines are sized at compile time for this sample rate; higher context
// rates still run but clamp the longest delays.
fsmax = 96000;

// 5 ms time constant, sample-rate independent: audible knob moves land at once.
smooth = si.smooth(ba.tau2pole(0.005));

preDelay = hslider("[0] Pre-delay [unit:ms]", 60, 20, 100, 1);
crossover = hslider("[1] Crossover [unit:Hz] [scale:log]", 200, 50, 1000, 1);
lowDecay = hslider("[2] Low decay [unit:s]", 3, 1, 8, 0.1);
midDecay = hslider("[3] Mid decay [unit:s]", 2, 1, 8, 0.1);
damping = hslider("[4] Damping [unit:Hz] [scale:log]", 6000, 1500, 23520, 1);
mix = hslider("[5] Mix", 0.35, 0, 1, 0.001) : smooth;

wet = re.zita_rev1_stereo(preDelay, crossover, damping, lowDecay, midDecay, fsmax);

process = _,_ <: (wet : *(mix), *(mix)), (*(1 - mix), *(1 - mix)) :> _,_;
