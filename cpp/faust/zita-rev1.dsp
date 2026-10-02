// Zita-Rev1 stereo reverb (Fons Adriaensen's FDN design, Faust port by Julius
// O. Smith III) as a live-mix device: stereo in, stereo out, a linear dry/wet
// balance (`dry*(1-mix) + wet*mix`, the Dattorro device's) that is then
// levelled so the output stays as loud as the input wherever Mix stands.
//
// The reverb's own output runs about 7 dB under what goes in, so the plain
// balance lost level as Mix rose: 4 dB at 0.35, 7 dB fully wet. Dry and wet
// add in power (the tail is not correlated with the note that made it), which
// makes the sum `sqrt((1-mix)^2 + wetPower * mix^2)` of the input; dividing by
// that leaves the balance at every Mix value where it was and takes the level
// drop out. At Mix 0 the gain is exactly 1.
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

// Power of the fully wet signal over the dry one: -7 dB.
wetPower = 0.2;
level = 1 / sqrt((1 - mix) * (1 - mix) + wetPower * mix * mix);
wetGain = mix * level;
dryGain = (1 - mix) * level;

process = _,_ <: (wet : *(wetGain), *(wetGain)), (*(dryGain), *(dryGain)) :> _,_;
