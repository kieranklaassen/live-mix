// name: Tiny crowd
// a: Cockle beach
// b: Sledge hill
// what: A wide beach at low water from high up, with a creek, pools of sky and some two hundred tiny people with long shadows gathering cockles, and one white kite, past a grassy dune; or a broad white hill of sledge tracks under a low sun, strings of people climbing, one red sledge, a smoking hut and a bare near tree.
// follows: The piece dyes coats and land where it sounds. Drone sets people walking and fills the smoke; pads tint sky and shadows; textures raise ripples or tracks; a phrase sends a line across. Bands lift sixteen kites or the wood. A hit throws up gulls or snow and a group leaps; a cue draws all one way and runs light. Keys bring dogs, voice window or sun.
// own: 0 night with lanterns at -1, a red evening at 1; 1 a lonely few at -1, a throng on trodden ground at 1; 2 fog at -1, a hard blue day at 1; 3 black sand (a) or green showing through (b) at -1, rose sand (a) or a slope of straw (b) at 1; 4 a low eye and big people at -1, a higher eye at 1; 5 a nearly dry beach or a slope falling to the right at -1, half under water or a hollow valley at 1; 6 striped tents among them at -1, everyone under an umbrella in the sounds' colours at 1; 7 a frozen lake at -1, fields in flower in the sounds' colours at 1, or a town along the top at -1, snow peaks beyond at 1
float tcNight, tcEve, tcFog, tcClear, tcPx, tcHop, tcPull, tcSize, tcGlow;
vec2 tcHitAt, tcTo, tcShade;
vec3 tcUmb;
vec3 tcSh, tcMist;
const float TCR = .16, TCW = .17;
// under umbrellas they stand further apart, so that none is cut
#define TCO (1. + .5*max(uOwn[6], 0.))
#define TCQ (1. - .5*max(uOwn[6], 0.))
float tcSeg(vec2 p, vec2 a, vec2 b) { b -= a; p -= a; return length(p - b*sat(dot(p, b)/max(dot(b, b), 1e-8))); }
float tcIn(float d, float e) { return 1. - smoothstep(-e, e, d); }
float tcBell(float x) { return exp(-x*x); }
vec3 tcHour(vec3 day, vec3 eve, vec3 night) { return mix(mix(day, eve, tcEve), night, tcNight); }
vec3 tcDim(vec3 c) { return c*mix(vec3(1.), vec3(.2,.26,.4), tcNight); }
void tcLay(inout vec3 col, vec3 c, float d, float show) { col = mix(col, tcDim(c), show*tcIn(d, .8*tcPx)); }
void tcShadow(inout vec3 col, vec2 q, float len, float wide, float e, float show) {
float t = sat(dot(q, tcShade)/(len*dot(tcShade, tcShade)));
col *= mix(vec3(1.), tcSh, show*tcIn(length(q - len*t*tcShade) - wide*(1. - .4*t), e + .12*t)*(1. - .35*t));
}
void tcOne(inout vec3 col, vec2 q, float H, float hop, float bend, float gait, float sit, vec3 coat, vec3 cap, float show) {
float e = .75*tcPx/H;
q /= H;
tcShadow(col, q, .95,.16, e, show);
if (uOwn[6] > 0.) {
vec2 s = q - tcShade*.95*vec2(1.,.9);
col *= mix(vec3(1.), tcSh, .85*show*uOwn[6]*(1. - sit)*tcIn(length(s*vec2(.8,1.4)) - .6*uOwn[6], e + .1));
}
vec2 l = q - vec2(.2,.35);
if (tcNight > 0.) tcGlow += show*(.9*exp(-dot(l, l)*24.) + .3*exp(-length(l*vec2(.8,1.5))*1.7));
q.y -= hop;
if (abs(q.x) > .7 + .25*max(uOwn[6], 0.) + e || abs(q.y - .5) > .7 + .35*max(uOwn[6], 0.) + e) return;
coat = tcDim(coat);
vec2 hip = vec2(0.,.3), sh = vec2(.3*bend, mix(.72 - .18*bend*bend, .5, sit));
float leg = max(abs(abs(q.x) - (.07 + .22*gait)*(1. - q.y*1.8)) - .05, max(q.y - .45,-q.y)), lit = smoothstep(-.16,.16,.3*(q.y - .5) - q.x*sign(tcShade.x));
col = mix(col, coat*.3, show*tcIn(mix(leg, max(abs(q.y - .09) - .06, abs(q.x) - .42), sit), e));
col = mix(col, coat*(.62 + .62*lit), show*tcIn(tcSeg(q, hip, sh) - .15 + .06*sat(q.y), e));
col = mix(col, tcDim(cap)*(.7 + .45*lit), show*tcIn(length(q - sh - vec2(.17*bend, .18 - .07*abs(bend))) - .115, e));
if (uOwn[6] > 0.) {
vec2 u = q - vec2(.12*bend + .05,.8);
float r = .85*uOwn[6]*(1. - sit), hem = u.y - .05*abs(sin(u.x*14.))*r;
col = mix(col, tcDim(vec3(.2)), show*(1. - sit)*tcIn(max(abs(u.x) - .02, abs(u.y + .1) - .4), e));
col = mix(col, tcDim(tcUmb)*(.62 + .5*lit + .25*smoothstep(0.,.5, u.y)), show*step(.05, r)*tcIn(max(length(u*vec2(1.,1.22)) - r, -hem), e));
}
}
void tcTents(inout vec3 col, float x, float dd, float ax, float haze, float wet) {
const float R = .36, W = .5;
float v = log(.8/dd)/R, s = (x - ax)/dd/W;
for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) {
float ri = floor(v) - float(i), cj = floor(s - .5) + float(j), h = hash21(vec2(cj + 5.3, ri + 40.)), h2 = fract(h*71.3), vf = ri + .5 + .3*(h2 - .5), df = .8*exp(-vf*R);
if (df > .78 || df < .045) continue;
float H = (.1 + .07*h2)*df*(1. - .3*uOwn[4])*(.3 - .7*uOwn[6]), there = sat(-4.*uOwn[6])*step(.32, h);
vec2 q = vec2(x - ax - (cj + .5 + .3*(fract(h*37.) - .5))*W*df, df - dd)/H;
if (max(abs(q.x), abs(q.y)) > 3.2) continue;
float show = there*haze*smoothstep(.05,.08, df)*(1. - .6*wet), e = .8*tcPx/H;
tcShadow(col, q, .85,.42,.06 + e, show);
float hw = q.y < .36 ? .5 - .04*q.y : .58*(1.02 - q.y)/.66, d = max(max(abs(q.x) - hw, -q.y), q.y - 1.);
float u = q.x/max(hw, .05), st = smoothstep(-.06,.06, sin(asin(clamp(u, -1.,1.))*9.));
vec3 a = kindColour(mod(cj + 2.*ri + 50.,5.)), c = mix(vec3(.96,.93,.86), a*.85 + .05, st)*(u*sign(tcShade.x) > 0. ? .74 : 1.05)*(q.y < .36 ? .86 : 1.);
c = mix(c, vec3(.16,.13,.12), tcIn(max(abs(q.x - .05) - .1, q.y - .28), e));
col = mix(col, tcDim(c), show*tcIn(d, e));
tcGlow += .35*show*exp(-dot(q - vec2(0.,.15), q - vec2(0.,.15))*7.);
vec2 f = q - vec2(0.,1.);
col = mix(col, tcDim(a), show*tcIn(max(abs(f.y - .18 + .25*f.x) - .09 + .25*f.x, max(-f.x, f.x - .34)), e));
col = mix(col, vec3(.2), show*tcIn(max(abs(f.x) - .012, abs(f.y - .12) - .13), e));
}
}
float tcWarp(float v) { return uVar*(.35*sin(v*.31 + .6) + .12*sin(v*.83)); }
void tcCrowd(inout vec3 col, float x, float dd, float ax, float wet, float haze) {
float v = log(.8/dd)/TCR/TCO, s = ((x - ax)/dd + tcWarp(v*TCO))/TCW, many = .34 + (uOwn[1] < 0. ? .28 : .42)*uOwn[1];
for (int i = 0; i < 2; i++) {
float ci = floor(s) + (1. - 2.*uVar)*float(1 - i), kind = hash11(ci + 91.3), run = uVar < .5 || kind > .66 ? 0. : kind < .45 ? 1. : 2.;
float fl = fract(kind*37.) + mod(uTravel*(run < .5 ? 0. : run < 1.5 ? .07 : -.42 - .5*kind), 509.), ri = floor(v - fl), rw = mod(ri, 509.);
float h = hash21(vec2(ci + 3.7, rw)), h2 = fract(h*91.7), clump = .5 + .5*sin(ci*.83 + rw*.31)*sin(rw*.71 - ci*.29 + 1.3);
float there = smoothstep(h, h + .02, many*(run > 1.5 ? .9 : run > .5 ? .3 + 2.4*clump*clump : (.2 + 1.7*clump)*(uVar < .5 ? .4 + .8*smoothstep(.1,.45, dd) : .8)));
if (there <= 0.) continue;
for (int k = 0; k < 2; k++) {
float fk = float(k), g = fract(h*917. + h2*13. + fk*.37), g2 = fract(g*57.31);
float pair = fk < .5 ? 1. : run > 1.5 ? 0. : smoothstep(g2, g2 + .1,.5 + .3*clump + .4*run + .4*uOwn[1]);
if (pair <= 0.) continue;
float a1 = uTravel*(.11 + .16*g) + g2*40., w1 = sin(a1), move = run > .5 ? .2 : .35 + .65*uDrone;
float vf = ri + fl + (run == 1. ? .28 + .46*fk : .47 + .18*(h2 - .5) + .14*(g - .5)) + .04*move*sin(a1*.7 + 2.);
float sf = ci + .5 + (run > .5 ? .3*(h2 - .5) : .36*(fract(h2*31.7) - .5) + (.36*fk - .18)*(h2 > .5 ? 1. : -1.))*TCQ + .1*move*w1*w1*w1*TCQ;
float df = .8*exp(-vf*TCR*TCO), H = tcSize*df*(fk > 0. && fract(h*33.) > .6 ? .62 : 1.)*(.9 + .2*g);
vec2 f = vec2(ax + (sf*TCW - tcWarp(vf*TCO))*df, df), way = tcTo - f, nr = (f - tcHitAt)*vec2(1.,1.4);
f.x += .03*df*tcPull*way.x/(length(way) + .05);
vec2 q = vec2(x - f.x, f.y - dd);
if (length(q) > 3.6*H) continue;
float show = haze*there*pair*smoothstep(.035,.075, df)*sat(H/tcPx), hop = tcHop*.6*exp(-dot(nr, nr)*70.);
if (uVar > .5) show *= smoothstep(.098,.125, df)*(run > .5 ? 1. - smoothstep(.92,1., df) : 1.);
if (wet > 0.) col *= 1. - .3*wet*show*tcIn(length((q/H + vec2(0.,.55))*vec2(1.,.24)) - .13,.1);
float c = fract(g*23.7 + h2);
vec3 coat = c < .6 ? mix(vec3(.12,.14,.2), vec3(.28,.19,.14), c*1.6) : c < .78 ? vec3(.58,.17,.12) : vec3(.66,.48,.2);
coat = mix(coat, kindColour(floor(c*4.))*.8,.4*(c < .25 ? uDrone : c < .5 ? uPad : c < .75 ? uTexture : uPhrase));
vec4 m = piece(vec2(sat(f.x/1.7 + .5), sat(df/.8)));
coat = mix(coat, m.rgb/max(m.a, .2)*.85,.75*sat(m.a*(.7 + .9*uEnergy)));
tcUmb = kindColour(floor(c*4.99))*.95 + .03;
float bend = run > 1.5 ? -.3 : uVar < .5 && g2 > .6 ? sign(g - .5)*(.75 + .25*sin(uTime*.5 + g*30.)) : .22*(g - .5);
float gait = abs(sin(a1*9.))*(run > .5 ? .6 : move*abs(cos(a1))*w1*w1);
tcOne(col, q, H, hop, bend, gait, step(1.5, run), coat, g2 < .5 ? vec3(.16,.13,.13) : g2 < .85 ? vec3(.8,.7,.62) : vec3(.62,.15,.1), show);
}
}
}
float tcPath(float x) { return mix(.3 - .07*x + .02*sin(x*5.), .36 + .2*x + .03*sin(x*4.), uVar); }
void tcLives(inout vec3 col, float x, float dd, float ax, float wet, float haze) {
if (uOwn[6] < 0.) tcTents(col, x, dd, ax, haze, wet);
tcUmb = uKind[3];
float way = mod(uTravel*.016,6.33), n0 = floor((x - way)/.03);
if (abs(dd - tcPath(x)) < .07) for (int i = 0; i < 2; i++) {
float n = n0 + float(1 - i)*(1. - 2.*uVar), h = hash11(mod(n, 211.) + 5.1), xf = (n + .5 + .6*(h - .5))*.03 + way, df = tcPath(xf) + .02*(fract(h*9.7) - .5);
tcOne(col, vec2(x - xf, df - dd), tcSize*max(df, .1)*.95,0.,.1,.6*abs(sin(uTravel*1.7 + h*20.)), 0., mix(vec3(.16,.14,.17), uKind[3]*.85,.5*uPhrase*h), vec3(.6,.46,.38),
smoothstep(h*.8, h*.8 + .2,.06 + 1.1*uPhrase)*(1. - smoothstep(.7,.9, abs(xf))));
}
tcCrowd(col, x, dd, ax, wet, haze);
vec2 q;
for (int k = 0; k < 2; k++) {
float fk = float(k), w = uTravel*(.25 - .06*fk) + 2.*fk, at = .5 + .11*fk + .03*sin(w), H = tcSize*at*.8, leg = .06*sin(uTravel*2.6 + fk), show = sat(uKeys*2.);
q = vec2(x + .12 - .34*fk - .1*cos(w), at - dd)/H;
if (show <= 0. || max(abs(q.x), abs(q.y)) > 3.) continue;
tcShadow(col, q, .6,.3,.1, show);
if (sin(w) > 0.) q.x = -q.x;
float d = min(tcSeg(q, vec2(-.4,.62), vec2(.36,.64)) - .17, tcSeg(q, vec2(.36,.7), vec2(.74,.98)) - .11);
tcLay(col, vec3(.2,.13,.1), H*min(d, max(abs(abs(q.x) - .33 - leg) - .06, max(-q.y, q.y - .5))), show);
}
q = vec2(x - tcHitAt.x, 1.5*(tcHitAt.y - dd));
float r = length(q), go = 1. - uHits;
if (r > .5 || uHits < .01) return;
float a = atan(q.y, q.x + 1e-5)/TAU*17., rr = .012 + (.04 + .12*hash11(mod(floor(a), 17.) + 2.))*go, on = tcIn(length(vec2((fract(a) - .5)*.37*rr, r - rr)) - .0042, tcPx);
col = mix(col, tcDim(mix(vec3(1.), uKind[4], .6*uVar)), uHits*.3*tcBell(r*5.));
col = mix(col, tcDim(vec3(1.)), uHits*sat(on + .45*tcBell((r - .02 - .14*go)/.014)));
}
void tcBirds(inout vec3 col, vec2 p, vec3 c) {
if (abs(p.x) > .35 || abs(p.y) > .12) return;
for (int k = 0; k < 6; k++) {
float fk = float(k), w = uTime*(.07 + .012*fk) + fk*1.9, fl = .5 + .3*sin(uTime*1.7 + fk*2.);
vec2 q = p - vec2(.07*fk - .17 + .13*sin(w), .035*cos(w*1.3) - .012*fk);
q.x = abs(q.x);
tcLay(col, c, abs(q.y - fl*q.x + (2. + 24.*fl)*q.x*q.x) + max(q.x - .012,0.) - .0011,1.);
}
}
vec3 tcSky(vec2 u) {
float w = uVar*smoothstep(-.7,.75, u.x);
vec3 low = tcHour(mix(vec3(.96,.89,.77), vec3(.8,.85,.9), w), mix(vec3(1.,.64,.39), vec3(.7,.56,.66), w), vec3(.18,.25,.37));
vec3 c = mix(low, tcHour(mix(mix(vec3(.5,.63,.74), vec3(.7,.78,.87), uVar), vec3(.3,.55,.8), tcClear), vec3(.44,.39,.55), vec3(.035,.06,.14)), smoothstep(-.02,.35, u.y));
c = mix(c, c*(.62 + .6*uKind[1]), .4*uPad);
vec2 cq = vec2(u.x*1.7 - uTime*.004, u.y*9. + 2.);
float n = .66*noise(cq) + .34*noise(cq*2.7 + 7.), r = length(u - mix(vec2(.72,.3), vec2(-.6,.075 + .012*cos(TAU*uLoop)), uVar));
c = mix(c, tcHour(vec3(.98,.96,.92), vec3(1.,.72,.56), vec3(.26,.31,.42)), .7*smoothstep(.47 + .12*tcClear, .73, n));
return mix(c, tcHour(vec3(1.,.95,.82), vec3(1.,.75,.45), vec3(.85,.9,1.)), sat((.25 + .2*uLevel + .2*uCue + .2*uMic)*exp(-r*5.) + uVar*tcIn(r - .026, tcPx*1.5)*(1. - .8*tcFog)));
}
vec3 tcLand(vec3 c, float x, float dd, float dry, vec2 w) {
vec4 m = piece(vec2(sat(x/1.7 + .5), sat(dd/.8)));
c = mix(c, c*(.5 + .75*m.rgb/max(m.a, .2)), sat(m.a)*(.2 + .3*uEnergy)*(1. - .5*uVar));
return uOwn[1] > 0. ? c*(1. - uOwn[1]*dry*(.07 + .16*smoothstep(.45,.75, noise(w))*smoothstep(.15,.5, dd))) : c;
}
float tcDuneY(float x) { return -.53 + .47*pow(sat((-.2 - x)/.74), .85) + .012*sin(x*23.)*sat(-.3 - x); }
float tcDuneX(float x) { return x - .7*max(0.,.89 - .5*uRes.x*tcPx); }
void tcDune(inout vec3 col, vec2 p, vec3 sand) {
float x = tcDuneX(p.x), b = tcDuneY(x) - p.y;
if (b < -.16 || x > 0.) return;
tcLay(col, 1.1*sand*(1. - .3*smoothstep(0.,.3, b) - .16*smoothstep(.4,.75, noise(vec2(x*7. + b*4., b*16.)))), -b, 1.);
for (int k = 0; k < 6; k++) {
float fk = float(k), fr = 92. - 7.*fk, lean = -.05 - .01*fk + .025*(.4 + uLow)*sin(uTime*.5 + fk*1.3 + x*5.), u = x, t = 0., bx = 0., h = 0.;
for (int r = 0; r < 2; r++) {
float c = floor(u*fr); h = hash21(vec2(c, fk + 3.)); bx = (c + .5 + .5*(h - .5))/fr;
t = (p.y - tcDuneY(bx) + .015 + .06*fk)/((.08 + .016*fk)*(.35 + .8*fract(h*7.7)));
u = x - lean*t*abs(t)*(.4 + h);
}
if (t < 0. || t > 1.) continue;
vec3 g = mix(vec3(.24,.25,.15), mix(vec3(.74,.67,.42), uKind[2], .3*uTexture), t*(.4 + .7*fract(h*3.3)));
tcLay(col, g, abs(u - bx) - .0026*(1. - t), .92*smoothstep(.36,.5, noise(vec2(bx*11., fk*2.3))));
}
}
void tcDiamond(inout vec3 col, vec2 q, float r, vec3 c) {
tcLay(col, c*(q.x > 0. ? 1. : .86), .6*(abs(q.x)*1.35 + abs(q.y + .18*r) - r - .22*q.y), 1.);
}
void tcKites(inout vec3 col, vec2 p, float hy) {
if (p.y > hy - .3) for (int i = 0; i < 2; i++) {
float fk = ceil((p.x + .665)/.1) + float(i);
if (fk < 0. || fk > 15.) continue;
float h = hash11(fk + 1.7), h2 = hash11(fk*3.1 + 8.), g = .085 + .2*h2*h2, lift = uBands[int(fk)];
vec2 a = vec2(-.72 + .1*fk + .09*(h - .5), hy - g), b = a + vec2(-.02 - .05*h, .03 + .06*h + .15*lift + .003*sin(uTime*.9 + fk*2.));
tcLay(col, vec3(.3), tcSeg(p, a, b) - .0002,.4);
tcDiamond(col, p - b, .006 + .026*g, mix(mix(vec3(.62,.2,.14), vec3(.16,.24,.36), step(.5, h2)), kindColour(floor(fk/4.))*.9,.3 + .5*lift));
}
if (abs(p.x - .2) > .3 || p.y < hy - .45) return;
vec2 foot = vec2(tcTo.x, hy - tcTo.y + .01), K = vec2(.27 + .012*sin(uTime*.37), hy - .16 + .01*sin(uTime*.53 + 1.) + .02*tcPull), q = p - K;
tcLay(col, vec3(.2), tcSeg(p, foot, K) - .0003,.55);
if (dot(q, q) > .03) return;
float up = mix(-2.35,.5*PI, smoothstep(0.,1., tcPull));
vec2 d = vec2(cos(up), sin(up));
for (int k = 1; k < 9; k++) {
float fk = float(k);
vec2 e = abs(q - d*(.03 + .0125*fk) - vec2(-d.y, d.x)*.0021*(1. - tcPull)*sin(fk*.9 - uTime*1.1)*fk);
tcLay(col, vec3(.76,.14,.1), e.x*.9 + e.y*1.4 - .0048,1.);
}
tcDiamond(col, rot(-.42 + .06*sin(uTime*.41))*q, .036, mix(vec3(1.,.995,.97), vec3(3.6,3.,2.2), tcNight));
col += vec3(.2,.19,.16)*exp(-dot(q, q)*300.)*uCue;
}
vec3 tcBeach(vec2 p) {
float hy = .3 + .16*uOwn[4], d = hy - p.y, px = tcPx, tide = .5 - .5*cos(TAU*uLoop), dd = max(d, .004), z = .8/dd;
vec3 sand = mix(mix(vec3(.75,.68,.58), vec3(.2,.2,.215), sat(-uOwn[3])), vec3(.9,.74,.66), sat(uOwn[3]))*mix(vec3(1.), vec3(1.02,.82,.74), tcEve), col;
float ice = sat(-uOwn[7]), bloom = sat(uOwn[7]), far7 = abs(uOwn[7]);
sand = mix(mix(sand, vec3(.86,.89,.92)*mix(vec3(1.), vec3(1.02,.82,.78), tcEve), ice), vec3(.46,.5,.26)*mix(vec3(1.), vec3(1.1,.8,.66), tcEve), .8*bloom);
tcSh = mix(tcHour(mix(vec3(.5,.51,.58), vec3(.42,.4,.5), tcClear), vec3(.5,.44,.52), vec3(.62,.65,.75)), vec3(.82), .85*tcFog);
tcTo = vec2(.02,.42);
vec2 w = vec2(p.x*z, z);
float dx = tcDuneX(p.x);
if (dx < 0. && tcDuneY(dx) - p.y > 2.*px) col = sand;
else if (d < 0.) {
col = tcSky(vec2(p.x, -d));
float hl = (.034 + .003*sin(p.x*31.))*smoothstep(.18,.75,-p.x);
col = mix(col, tcHour(vec3(.5,.56,.6), vec3(.5,.36,.42), vec3(.06,.085,.13)), .8*tcIn(-d - hl, px));
if (far7 > 0.) {
float u = p.x*mix(70.,46., bloom), c = floor(u), h = hash11(c + 3.), t = (.01 + .03*h*h*(.5 + .5*sin(c*.21)) + .012*bloom*h)*far7, f = abs(fract(u) - .5);
float tree = -d - t*(ice > 0. ? 1. - f*f*2.6 : sqrt(max(1. - f*f*4.,0.)));
col = mix(col, tcHour(mix(vec3(.5,.52,.56), vec3(.3,.4,.34), bloom), vec3(.46,.3,.34), vec3(.04,.06,.09)), .85*far7*tcIn(min(tree, -d - .006*far7 - .004*noise(vec2(p.x*9.,1.))), px));
u = p.x*17. + .3; c = floor(u); h = hash11(c + 11.); f = abs(fract(u) - .5)/17.;
vec2 w = vec2(fract(u)/17. - .03,-d - .006);
col = mix(col, tcDim(vec3(.62,.4,.32)), far7*step(.62, h)*tcIn(max(f - .011,-d - .011), px));
col = mix(col, tcDim(mix(vec3(.93,.93,.94), vec3(.45,.22,.16), bloom)), far7*step(.62, h)*tcIn(max(f*.8 - d - .02, d + .0105), px));
tcGlow += step(.62, h)*.6*far7*exp(-dot(w, w)*30000.);
}
col = mix(col, tcMist, tcFog*exp(d*5.)*.95);
} else {
float far = 1. - smoothstep(2.5,9., z), big = noise(w*vec2(.9,1.3) + 3.1), mid = noise(w*vec2(3.1,5.) + 8.), fine = far > 0. ? noise(w*vec2(17.,30.)) : .5, low = big*.68 + mid*.32;
col = sand*(.86 + .26*smoothstep(.35,.75, low) + .1*(fine - .5)*far);
col *= 1. + (.08 + .2*uTexture)*(.6 - abs(sin(w.y*34. + 5.*mid + 4.*big + w.x*5. + 1.2*fine)))*(1. - smoothstep(1.3,3.4, z))*smoothstep(.3,.6, low);
float cx = .62 + .95*sin(z*.62 + .15) + .28*sin(z*1.55 + 1.), cr = abs(w.x - cx + .5*(mid - .5)) - .22 - .07*sin(z*3.1) - .015*z;
float lvl = .035*tide + .17*uOwn[5], pool = min(cr*.6 - .5*lvl, .7*noise(w*vec2(1.6,4.4) + vec2(0.,31.)) + .3*mid - .31 - lvl) + .035*(fine - .5)*far;
float rv = abs(noise(w*vec2(2.3,1.1) + vec2(.5*mid + .1*fine, 50.)) - .5) - .007 - .05*uOwn[5] + .08*smoothstep(.42,.6, low), soft = .005 + .004*z, wet = (1. - smoothstep(-soft, soft, min(pool, rv)))*(1. - ice)*(1. - bloom);
col *= mix(vec3(1.), vec3(.76,.77,.8), max(1. - smoothstep(0.,.16, pool), .5 - .5*smoothstep(0.,.03, rv)))*(1. - .1*tcBell((pool - .012)/.01)*far);
if (ice > 0.) {
float drift = smoothstep(.46,.62, low + .06*(fine - .5)), k1 = abs(noise(w*vec2(1.4,2.2) + 20.) - .5), k2 = abs(noise(w*vec2(3.7,5.3) + 60.) - .5);
vec2 sk = w*vec2(6.,9.) + vec2(2.*mid, 2.*big);
float line = abs(fract(noise(sk)*7.) - .5), line2 = abs(fract(noise(sk.yx*1.3 + 30.)*6.) - .5);
vec3 c = mix(mix(vec3(.42,.57,.64), vec3(.55,.68,.73), mid), tcSky(vec2(p.x, d*.6)), .42)*(.86 + .22*low);
c += (.1 + .16*uTexture)*far*(1. - smoothstep(0.,.07 + .02*z, min(line, line2)));
c = mix(c, vec3(.9,.95,.97)*mix(vec3(1.), vec3(1.02,.8,.74), tcEve), .75*(1. - smoothstep(.002,.006 + .004*z, min(k1, k2 + .004)))*(1. - smoothstep(3.,8., z)));
c = mix(c, vec3(.93,.95,.97)*mix(vec3(1.), vec3(1.04,.8,.72), tcEve)*(.9 + .14*mid), drift*.9);
col = mix(col, c, ice);
}
if (bloom > 0.) {
float r = w.x*.92 - w.y*.16 + .4, b = r*1.15, bi = floor(b), bf = fract(b), h = hash11(bi + 7.), cross = abs(fract(w.y*.21 + .13) - .5)/.21, wd = 1.15*z*px*(1.2 + .5*abs(p.x)*z + .2*z);
float path = max(1. - smoothstep(.06 + wd, .075 + 2.*wd, min(bf, 1. - bf)), 1. - smoothstep(.035 + .02*z*.1,.05 + .03*z*.1, cross)), row = .5 + .5*sin(bf*TAU*9.), thin = (1. - smoothstep(.03,.12, wd));
vec3 fl = kindColour(mod(bi*2. + 20.,5.))*(.85 + .3*hash11(bi*1.7 + floor(w.y*.21 + .63)));
vec2 fc = w*vec2(62.,40.);
float dot_ = thin*(1. - smoothstep(.3,.46, length(fract(fc) - .5)))*step(.2, hash21(floor(fc)));
vec3 c = mix(mix(vec3(.24,.32,.14), fl, .62), mix(vec3(.2,.28,.12), fl*1.12 + .04, dot_), thin*(.35 + .5*row));
c = mix(c, vec3(.27,.34,.15), thin*.65*(1. - smoothstep(.1,.4, row)));
c = mix(c, mix(vec3(.72,.66,.5), vec3(.55,.6,.36), step(.5, h)), path)*(.88 + .2*big);
col = mix(col, c*mix(vec3(1.), vec3(1.05,.78,.68), tcEve), bloom);
}
col = mix(col, col*vec3(.22,.28,.4), tcNight);
float road = tcBell((p.x - .62 - .1*d)*2.6);
if (wet > 0.) {
float lap = (noise(vec2(w.x*5., w.y*42. - uTime*.25)) - .5)*far;
col = mix(col, tcSky(vec2(p.x, d*.52) + .015*lap)*.95 + (.03 + .12*uTexture)*lap + mix(vec3(.14,.11,.06), vec3(.06), tcNight)*road*(.6 + uMic + 1.6*uCue), wet*.94);
}
col = tcLand(col, p.x, dd, 1. - wet, w*vec2(65.,110.));
float in_ = .05 + .012*sin(p.x*3.1 + .6) + .006*tide + .003*sin(p.x*23.) + .02*sat(uOwn[5]) - d;
in_ -= .2*far7;
if (in_ > -.01) {
vec3 sea = tcHour(mix(vec3(.46,.55,.57), vec3(.22,.47,.58), tcClear), vec3(.4,.37,.46), vec3(.05,.085,.14));
col = mix(col, sea*(.92 + .2*noise(vec2(p.x*26., d*420. - uTime*.2))), smoothstep(-px, px, in_));
for (int k = 0; k < 3; k++) {
float fk = float(k), n = noise(vec2(p.x*7. + fk*5., uTime*.04));
tcLay(col, vec3(.96,.95,.91), abs(in_ - .002 - .013*fk - .0035*n) - .0026 + .0006*fk, (.9 - .2*fk)*smoothstep(.2,.6, n + (k == 0 ? .5 : 0.)));
}
}
col = mix(col, tcMist, (1. - exp(-z*(.025 + .04*uSpace + .35*tcFog)))*(.8 + .2*tcFog));
tcLives(col, p.x, dd, 0., wet, exp(-z*.3*tcFog));
}
tcBirds(col, p - vec2(-.2, hy - .08), vec3(.97,.97,.95));
tcKites(col, p, hy);
tcDune(col, p, sand);
return col;
}
float tcCrest(float x) {
float o = uOwn[5], u = x - .04;
return .185 + .11*uOwn[4] + (.34*max(o, 0.) - .2)*u*u + .17*min(o, 0.)*x - .07*max(o, 0.) + .006*sin(x*9.);
}
float tcTree(vec2 p) {
float s = clamp(uRes.x*tcPx*.62,.45,1.);
vec2 q = (p - vec2(.5*uRes.x*tcPx, -.5))/s;
if (q.x < -.5) return 1.;
q.x += .008*sin(q.y*11.) - .022;
float d = max(-q.x - mix(.095,.05, sat(q.y*1.4)), q.x - .1);
for (int k = 0; k < 8; k++) {
float fk = float(k), h = hash11(fk + 4.), len = .42 - .022*fk - .12*h;
vec2 dir = normalize(vec2(-1.,.15 + .8*h)), v = q - vec2(-.035,.33 + .085*fk);
float al = dot(v, dir), u = al/len, n = dot(v, vec2(-dir.y, dir.x)) + .35*al*(u - 1.)*(h - .2) + .01*sin(al*23. + fk*2.);
if (u < 0. || u > 1.) continue;
d = min(d, abs(n) - mix(.012,.002, u));
float an = abs(n), sd = step(0., n), base = al - an*.8 - 3.*an*an, ci = base*24. + .5*sd, hh = hash21(vec2(floor(ci), fk*2. + sd)), tl = (.03 + .1*hh)*(1.15 - u);
if (base > .03) d = min(d, max(abs(fract(ci) - .5 - .3*(hh - .5) - 8.*an*(hh - .5))*.03 - .0017*(1. - an/max(tl, 1e-3)), an - tl));
}
return d*s;
}
vec3 tcHill(vec2 p) {
float px = tcPx, crest = tcCrest(p.x), b = crest - p.y, dd = max(b + .1,.07), ax = -.06, hx = -.31, hc = tcCrest(hx) - .004, winter = 1. - abs(uOwn[3]);
vec3 col = vec3(0.);
tcSh = mix(tcHour(mix(vec3(.54,.66,.9), vec3(.46,.6,.92), tcClear), vec3(.6,.52,.8), vec3(.6,.66,.8)), vec3(.85), .7*tcFog);
tcSh = mix(tcSh, tcSh*(.5 + .55*uKind[1]), .52*uPad);
tcTo = vec2(.14,.5);
vec2 q = p - vec2(hx, hc);
if (b < .02) {
col = tcSky(vec2(p.x, -b));
tcBirds(col, p - vec2(.25,.33), vec3(.2,.2,.24));
float sy = (q.y - .05)/.34;
if (sy > 0.) {
float sx = (q.x - .017 - .2*(1. - .9*tcPull)*sy*sqrt(sy) - .018*sy*sin(sy*9. - uTime*.25))/(.004 + .035*sy);
float m = tcBell(sx)*(1. - smoothstep(.1,1., sy))*(.6 + .8*noise(vec2(p.x*40., p.y*26. - uTime*.5)));
col = mix(col, tcDim(mix(mix(vec3(.97,.92,.86), vec3(.6,.6,.67), sat(.5 + .5*sx)), uKind[0], .35*uDrone)), sat(m)*(.6 + .35*uDrone));
}
if (uOwn[7] > 0.) {
float u = p.x, a = 1. - abs(sin(u*4.1 + .75)), m = 1. - abs(sin(u*9.3 + 2.1)), top = (.055 + .16*a*(.62 + .38*sin(u*3.3 + 1.2)) + .06*m*(.4 + .6*a) + .02*noise(vec2(u*23.,1.)) + .007*noise(vec2(u*61.,1.)))*uOwn[7], y = p.y - crest;
vec2 r = vec2(p.x*7. - .9*y, y*10. + p.x*2.);
float n = noise(r) + .5*noise(r*2.3) + .3*noise(r*5.1), n2 = noise(r + vec2(.3,-.12)) + .5*noise(r*2.3 + vec2(.5,-.2)) + .3*noise(r*5.1 + vec2(.6,-.3));
float lit = sat(.5 + 1.5*(n - n2)), lie = smoothstep(.0,.06, y - .07*uOwn[7] + .07*(n - .9))*smoothstep(-.2,.05, lit - .2);
vec3 rock = tcHour(mix(vec3(.3,.36,.46), vec3(.56,.58,.62), lit), mix(vec3(.46,.36,.48), vec3(.85,.55,.5), lit), mix(vec3(.05,.07,.13), vec3(.11,.15,.23), lit));
vec3 sn = tcHour(mix(vec3(.66,.76,.9), vec3(1.,.98,.95), lit), mix(vec3(.68,.56,.74), vec3(1.,.8,.68), lit), mix(vec3(.16,.22,.34), vec3(.34,.42,.55), lit));
col = mix(col, mix(mix(rock, sn, lie), tcMist, .3*(1. - smoothstep(0.,.12, y)) + .05), tcIn(y - top, px*1.5));
}
float gap = smoothstep(.03,.12, abs(q.x - .02))*(.35 + .65*smoothstep(0.,.2, abs(p.x + .02)));
if (b > -.16) for (int k = 0; k < 3; k++) {
float fk = float(k), fr = 46. + 17.*fk, u = p.x*fr + fk*.3, c = floor(u), h = hash21(vec2(c, fk + 9.)), f = u - c - .5 + .25*(h - .5), cx = (c + .5)/fr;
float tall = (.052 - .011*fk + .035*h + .045*band(sat(cx*.6 + .5)))*(.45 + .55*noise(vec2(cx*5., fk*3.)))*gap*(1. - sat(-uOwn[7]))*(1. - .45*sat(uOwn[7])), y = (p.y - crest + .004)/max(tall, 1e-4), tier = fract(h - y*6.), wide = .62*(1. - y)*(.72 + .28*tier);
vec3 tree = mix(mix(vec3(.36,.4,.47), vec3(.12,.15,.17), .5*fk), vec3(.85,.82,.82), winter*.55*(1. - smoothstep(-.7,.2, f/max(wide, .05)))*smoothstep(.35,.8, tier));
tcLay(col, tree, (abs(f) - wide)/fr, step(.004, tall));
}
if (uOwn[7] < 0. && b > -.2) for (int k = 0; k < 3; k++) {
float fk = float(k), fr = 15. + 5.*fk, u = p.x*fr + .37*fk, c = floor(u), h = hash21(vec2(c, fk + 4.)), h2 = fract(h*53.), f = (u - c - .5)/fr, cx = (c + .5)/fr;
float hw = (.36 + .13*h2)/fr, wall = (.072 - .02*fk + .035*h + .05*band(sat(cx*.6 + .5)))*-uOwn[7]*(.55 + .45*sin(cx*2. + 2.)*sin(cx*2. + 2.)), y = p.y - crest + .004, roof = hw*(.8 + .7*fract(h*19.)), spire = step(.86, fract(h*31.));
vec3 hue = mix(mix(vec3(.82,.72,.56), vec3(.66,.4,.32), step(.5, h2)), kindColour(floor(h*4.99)), .4)*mix(vec3(1.), vec3(1.05,.78,.74), tcEve);
hue = mix(hue, tcMist, .3 - .13*fk)*(f > 0. ? .9 : 1.);
tcLay(col, hue, max(abs(f) - hw, y - wall), 1.);
tcLay(col, mix(vec3(.42,.22,.18), vec3(.96,.95,.95), winter*.9)*(f > 0. ? .82 : 1.), max(.7*(abs(f)*roof/hw*1. + y - wall - roof), wall - y), 1.);
tcLay(col, vec3(.36,.3,.3), max(abs(f) - hw*.3*(1. - sat((y - wall)/.07)), max(wall - y, y - wall - .07)), spire);
vec2 g = vec2(f, y)*95., gi = floor(g), gf = abs(fract(g) - .5);
float on = step(max(abs(f) - hw + .004, y - wall + .006), 0.)*step(.005, y)*step(.35, hash21(gi + fk*7.)), lamp = step(.45, hash21(gi + 31.))*max(tcNight, .5*uKeys + .6*tcEve);
col = mix(col, mix(tcDim(vec3(.25,.27,.33)), vec3(1.,.76,.38), lamp), on*tcIn(max(gf.x - .2, gf.y - .3)/95., px));
}
col = mix(col, tcMist, tcFog*.75);
}
float v = log(.8/dd)/TCR, s = (p.x - ax)/dd + tcWarp(v), z = .8/dd;
if (b > -2.*px) {
vec2 g = vec2(s*1.5, v*.5);
float n0 = noise(g) + .45*noise(g*2.3 + 5.), n1 = noise(g + vec2(.22,.05)) + .45*noise(g*2.3 + vec2(5.5,5.1));
float lit = sat(.72 + (.75 + .2*uTexture)*(n1 - n0) - .28*smoothstep(-.2,.9, p.x - .25*b) + .15*exp(-b*14.));
vec3 hi = mix(vec3(.985,.955,.9), vec3(1.,.8,.66), tcEve), lo = mix(mix(vec3(.7,.78,.9), vec3(.6,.72,.92), tcClear), vec3(.6,.54,.76), tcEve);
vec3 snow = mix(mix(lo, lo*(.55 + .55*uKind[1]), .52*uPad), hi, smoothstep(.2,.95, lit));
if (winter < 1.) {
float turf = noise(vec2(s*60., v*11.));
snow = mix(snow, mix(vec3(.26,.34,.16), vec3(.62,.66,.32), lit)*(.8 + .4*turf), smoothstep(0.,.16, n0*.7 - 1. + .8*sat(-uOwn[3]) + .1*turf)*sat(-9.*uOwn[3]));
snow = mix(snow, mix(vec3(.5,.36,.2), vec3(.92,.76,.44), lit)*(.9 + .2*turf), sat(uOwn[3]));
}
float slant = length(vec2(1., (p.x - ax)/dd));
for (int k = 0; k < 3; k++) {
float m = 1. + .97*float(k), u = s*3.2*m, c = floor(u), h = hash21(vec2(c, m)), pu = 3.2*m*px*slant/dd;
float a = abs(u - c - .5 - .4*(h - .5) - .1*sin(v*(.5 + h) + h*30.)) - .028*m, on = smoothstep(-.2,.4, sin(v*.23 + h*40.))*step(.2, h)*(1. - smoothstep(1.3,2.6, abs(s)))*sat(.096*m/pu)*sat(.75 + uOwn[1]);
snow *= mix(vec3(1.), mix(tcSh, vec3(1.), .25 - .25*uTexture), tcIn(abs(a) - .0085*m, pu)*on*.85);
}
float x0 = p.x + .9;
if (x0 < 1. && p.y < 0.) for (int k = 0; k < 4; k++) {
float fk = float(k), yl = p.y + .3 + .031*fk*(1. + .4*fk) + .21*x0 + .006*sin(p.x*17. + fk);
snow *= mix(vec3(1.), tcSh, .75*tcIn(abs(yl) - (.011 + .002*fk)*(1. - smoothstep(-.2,.95 - .12*fk, x0)), px + .006*max(x0,0.))*(1. - smoothstep(.7,1., x0))*(1. - tcFog));
}
snow = tcLand(snow, p.x, dd, 1., vec2(s*65., v*20.)) + vec3(.16,.12,.06)*uCue*tcBell((b - .75 + .75*uCue)*9.);
snow = mix(snow, snow*vec3(.24,.31,.48), tcNight);
snow = mix(snow, tcMist, (1. - exp(-max(z - 1.,0.)*(.01 + .03*uSpace + .3*tcFog)))*(.8 + .2*tcFog));
col = mix(col, snow, smoothstep(-px, px, b));
}
if (abs(q.x) < .2 && abs(q.y) < .11) {
vec2 wi = q - .012;
tcShadow(col, (q - vec2(.02,0.))/.05,1.,.26,.05,1.);
tcLay(col, vec3(.34,.24,.2), max(abs(q.x - .017) - .0045, abs(q.y - .043) - .011), 1.);
tcLay(col, mix(vec3(.42,.27,.2), vec3(.2,.15,.16), smoothstep(-.02,0., q.x)), max(abs(q.x) - .03, abs(q.y - .009) - .015), 1.);
tcLay(col, mix(vec3(.45,.2,.15), mix(vec3(.98,.94,.88), vec3(.72,.78,.9), step(0., q.x)), winter), max(abs(q.x)*.62 + q.y - .048,.02 - q.y), 1.);
col = mix(col, vec3(1.,.74,.34), tcIn(max(abs(wi.x), abs(wi.y)) - .005, px)*(.55 + .45*max(uMic, tcNight)));
tcGlow += .5*exp(-dot(wi, wi)*1400.);
}
if (b > -.03) {
tcLives(col, p.x, dd, ax, 0., exp(-z*.2*tcFog));
float go = fract(uTravel*.021 + .12), df = mix(.14,.95, go*(.6 + .4*go)), vf = log(.8/df)/TCR, show = smoothstep(0.,.05, go)*(1. - smoothstep(.9,.98, go)), H = tcSize*1.5*df, back = v - vf;
col *= mix(vec3(1.), tcSh, smoothstep(0.,.3, back)*exp(-max(back, 0.)*.3)*show*tcIn(abs(abs(s - .42 - .2*sin(v*.55 + .4)) - .012) - .0045, px/dd));
q = vec2(p.x - ax - (.42 + .2*sin(vf*.55 + .4) - tcWarp(vf))*df, df - dd);
tcOne(col, q, H, .12,-.3,0.,1., vec3(.15,.14,.2), vec3(.88,.85,.8), show);
q /= H;
tcLay(col, vec3(.86,.1,.07)*(1. + tcNight), H*min(tcSeg(q, vec2(-.62,.16), vec2(.5,.12)) - .1, tcSeg(q, vec2(-.62,.16), vec2(-.78,.36)) - .06), show);
}
tcLay(col, mix(vec3(.17,.14,.15), tcMist, .2*tcFog), tcTree(p) + .45*abs(uOwn[7]), 1.);
return col;
}
vec3 render(vec2 p) {
tcNight = sat(-uOwn[0]); tcEve = sat(uOwn[0]); tcFog = sat(-uOwn[2]); tcClear = sat(uOwn[2]);
tcPx = 1./uRes.y; tcGlow = 0.;
tcHop = 4.*uHits*(1. - uHits); tcPull = 4.*uCue*(1. - uCue);
tcSize = .04*(1. - .32*uOwn[4]);
tcShade = mix(vec2(-1.35,-.8), vec2(2.3,-.5), uVar)*(1. + .4*tcEve);
tcHitAt = vec2(.22 + .12*sin(uTime*.05), .42);
tcMist = tcHour(vec3(.85,.855,.855), vec3(.93,.71,.57), vec3(.12,.155,.23));
vec3 col = uVar < .5 ? tcBeach(p) : tcHill(p);
col += vec3(1.,.62,.25)*tcGlow*tcNight;
return sat(mix(vec3(.5), col, .94 + .12*uTone));
}
