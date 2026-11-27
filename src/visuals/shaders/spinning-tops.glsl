// name: Spinning tops
// a: On the table
// b: On the rail
// what: Five painted wooden tops of unlike shape, a saucer, a pear, three tiers, a spindle and an acorn, turn and lean on pale boards in a low window light, with long shadows; or turned bobbins roll slowly along a wooden rail before a blue-green wall where the same window falls.
// follows: Each kind of sound is one form: as it sounds its top stands up straighter or its bobbin draws apart, its paint deepens and its colour falls nearby. The bands light the inlaid rings, low notes the window, keys the knobs. A hit lights the small one and runs over the boards or along the rail; a cue leans them all. The rail's inlay shows the piece.
// own: 0 1 drawn up tall, -1 pressed flat as plates; 1 1 fluted like gourds, -1 cut four-sided; 2 1 a crowd, -1 one great one and the small one; 3 1 pale ground in open daylight, -1 black polish, dim; 4 the ground in the drone's colour: 1 rings raked round each (b: a hung cloth), -1 tiles; 5 1 lamps in a dark room, -1 polished metal; 6 1 bare clay in one colour each, -1 fine rings all over; 7 1 the eye straight above (b: along the rail), -1 low under a sky (b: square on)
const bool ldDim = uOwn[3] < 0., ldMany = uOwn[2] > 0., ldSized = uOwn[0] != 0. || uOwn[2] != 0., ldOther = ldSized || uOwn[1] != 0.;
const float ldMn = max(uOwn[2], 0.), ldOne = max(-uOwn[2], 0.);
const int LD_N = ldMany ? 10 : 6; // how many there are
#define LI(n) min(n,LD_N - 1)
#define LD_6(x,v0,v1,v2,v3,v4,v5) x[0] = v0; x[1] = v1; x[2] = v2; x[3] = v3; x[4] = v4; x[5] = v5;
#define LD_4(x,v6,v7,v8,v9) if (ldMany) { x[LI(6)] = v6; x[LI(7)] = v7; x[LI(8)] = v8; x[LI(9)] = v9; }
vec3 ldC[LD_N]; // where each stands
vec3 ldA[LD_N]; // its axis
vec4 ldW[LD_N]; // its disc's height and radius, its stem's, its top
vec3 ldG[LD_N]; // the colour it lays near
vec2 ldH[5]; // where each top lives
int ldK[LD_N]; // its kind
vec2 ldQ[LD_N]; // scales
vec2 ldSc = vec2(1.); float ldMs = 1.; vec3 ldBx, ldBy; // the form in hand: scale, sides as it has turned
float ldV[5]; // how loud each kind is
vec3 ldL; // towards the light
float ldPx, ldSoft; // a pixel one unit away; a shadow's softness

// Ten turned forms: three discs (height, radius, half thickness, roundness), a foot and a stem (from, to, both radii),
// a knob (height, radius, how softly all join).
vec4 LD_F[60] = vec4[60](
 vec4(.5,.75,.06,.055),vec4(.72,.12,.022,.02),vec4(1.1,.08,.03,.03),vec4(.02,.4,.02,.17),vec4(.55,1.08,.085,.04),vec4(1.15,.075,.1,0),
 vec4(.56,.43,.45,.43),vec4(.9,.12,.028,.028),vec4(.9,.12,.028,.028),vec4(.02,.5,.02,.36),vec4(.8,1.16,.1,.045),vec4(1.22,.085,.13,0),
 vec4(.34,.52,.055,.05),vec4(.51,.37,.05,.045),vec4(.665,.24,.045,.04),vec4(.02,.3,.025,.14),vec4(.3,.95,.12,.035),vec4(.98,.06,.06,0),
 vec4(.7,.275,.03,.028),vec4(1,.095,.03,.03),vec4(.89,.12,.035,.035),vec4(.02,.68,.015,.23),vec4(.86,1.34,.05,.035),vec4(1.4,.07,.12,0),
 vec4(.27,.25,.06,.055),vec4(.32,.1,.03,.03),vec4(.32,.1,.03,.03),vec4(.02,.2,.015,.15),vec4(.3,.56,.06,.03),vec4(.58,.05,.06,0),
 vec4(0,.2,.32,.01),vec4(.29,.56,.06,.05),vec4(.41,.3,.06,.03),vec4(0,.1,.05,.05),vec4(.42,.56,.1,.07),vec4(.6,.07,.01,0),
 vec4(0,.16,.32,.01),vec4(.26,.36,.035,.03),vec4(.43,.29,.3,.29),vec4(0,.1,.05,.05),vec4(.6,.72,.08,.06),vec4(.76,.07,.01,0),
 vec4(0,.14,.4,.01),vec4(.28,.42,.07,.05),vec4(.42,.25,.11,.04),vec4(0,.1,.05,.05),vec4(.48,.58,.1,.06),vec4(.6,.07,.01,0),
 vec4(0,.11,.32,.01),vec4(.25,.3,.03,.025),vec4(.29,.26,.03,.03),vec4(.3,.72,.24,.05),vec4(.6,.72,.05,.05),vec4(.79,.065,.01,0),
 vec4(0,.1,.3,.01),vec4(.23,.21,.045,.04),vec4(.32,.11,.11,.11),vec4(0,.1,.05,.05),vec4(.38,.42,.06,.05),vec4(.45,.045,.01,0));
// Their paint: four bands (from, to, with 0 the kind's colour, 1 bone, 2 black, 3 stripes, 4 marks), then how many
// stripes, their twist, 1 to measure out from the axis.
const vec3 LD_O = vec3(8,9,0), LD_INK = vec3(.04,.035,.036);
vec3 LD_P[50] = vec3[50](
 vec3(.12,.34,0),vec3(.375,.51,3),vec3(.54,.675,0),LD_O,vec3(7,21,1),
 vec3(.2,.3,2),vec3(.36,.6,0),vec3(.63,.71,3),vec3(.74,.86,0),vec3(8,0,0),
 vec3(.27,.41,4),vec3(.43,.58,1),vec3(.6,.77,2),LD_O,vec3(9,0,0),
 vec3(.2,.56,3),vec3(.6,.82,0),vec3(.96,1.05,0),vec3(.665,.735,2),vec3(2,16,0),
 vec3(.06,.2,0),vec3(.225,.365,3),LD_O,LD_O,vec3(7,0,0),
 vec3(-1,.285,0),vec3(.31,.39,3),vec3(.415,.51,0),LD_O,vec3(9,28,1),
 vec3(.31,.4,0),vec3(.43,.5,3),vec3(.53,.66,0),vec3(.69,9,0),vec3(6,0,0),
 vec3(.2,.37,4),vec3(.39,.44,1),vec3(.46,.55,2),vec3(.6,9,0),vec3(9,0,0),
 vec3(.2,.315,2),vec3(.345,.66,3),vec3(.73,9,0),LD_O,vec3(2,16,0),
 vec3(.18,.3,0),vec3(.325,.37,3),vec3(.4,9,0),LD_O,vec3(6,0,0));
float ldOff(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
#define ldOn smoothstep
int ldSp(int i) { return ldK[i] + (uVar > .5 ? 5 : 0); }
// Its side, and how far round it is.
vec3 ldSide(int i) { vec3 x = uVar > .5 ? vec3(1,0,0) : vec3(0,0,1); return normalize(x - ldA[i] * dot(x, ldA[i])); }
float ldSpin(int i) { return uVar > .5 ? -mod(uTravel * .12 / ldC[i].y, TAU) : mod(uTime * (.35 + .11 * float(ldK[i])), TAU); }
vec4 ldF[6]; // the form in hand
float ldS; // how far its halves have drawn apart
void ldTake(int i) { int k = 6 * ldSp(i); ldF = vec4[6](LD_F[k], LD_F[k + 1], LD_F[k + 2], LD_F[k + 3], LD_F[k + 4], LD_F[k + 5]); ldS = .1 * ldV[ldK[i]];
 if (ldSized) { ldSc = ldQ[i]; ldMs = min(ldSc.x, ldSc.y); }
 if (uOwn[1] != 0.) {
 vec3 x = ldSide(i), y = cross(ldA[i], x); float sp = ldSpin(i), c = cos(sp), n = sin(sp);
 ldBx = x * c - y * n; ldBy = x * n + y * c;
 }
}
float ldDisc(vec2 q, vec4 f) { vec2 d = abs(vec2(q.x, q.y - f.x)) - f.yz + f.w; return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - f.w; }
float ldCone(vec2 q, vec4 f) { float h = sat((q.y - f.x) / (f.y - f.x)); return length(vec2(q.x, q.y - mix(f.x, f.y, h))) - mix(f.z, f.w, h); }
// How far the form in hand is: q.x out from the axis, q.y along it.
float ldProf(vec2 q) {
 if (uVar > .5) q.y = abs(q.y) - ldS;
 float k = ldF[5].z;
 float d = smin(smin(ldCone(q, ldF[3]), ldDisc(q, ldF[0]), k), ldCone(q, ldF[4]), k);
 return min(min(d, ldDisc(q, ldF[1])), min(ldDisc(q, ldF[2]), length(vec2(q.x, q.y - ldF[5].x)) - ldF[5].y));
}
// The same scaled, and how far in a fluted or four-sided one goes, a way round.
float ldAll(vec2 q) { return ldSized ? ldProf(q / ldSc) * ldMs : ldProf(q); }
float ldRim(vec2 c, float r) {
 vec2 s = abs(c); float d = max(max(s.x, s.y), .64 * (s.x + s.y)) / .842, x2 = c.x * c.x - c.y * c.y, x4 = 2. * x2 * x2 - 1., x8 = 2. * x4 * x4 - 1.;
 r = ldOn(.03,.2, r) * abs(uOwn[1]);
 return uOwn[1] < 0. ? mix(1., d, r) : 1. + r * .34 * (1. - sqrt(max(.5 + .5 * x8,0.) + .012));
}
vec3 ldRich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(.3,.59,.11))), c, k), 0.); }
// The line each wanders: a ring of five lobes.
float ldLobe(float wide, float c) { float d = c * c; return wide + .035 * c * (16. * d * d - 20. * d + 5.); }
// A top: where its point has wandered, and how it leans, thrice for each time round.
void ldTop(vec2 home,vec2 w,float wide,float lean,vec3 gust,out vec3 C,out vec3 A) {
 float c = w.x, s = w.y, r = ldLobe(wide, c);
 C = vec3(home.x + r * c, 0., home.y + r * s);
 A = normalize(vec3(lean * c * (4. * c * c - 3.), 1., lean * s * (3. - 4. * s * s)) + gust);
}
vec3 ldLaid(vec3 c, float l) { c = ldRich(c, 1.5); return c * c * l; }
// The size of kind k on the rail (b) or the table, one of the crowd (x) or of the five: known beforehand.
#define LD_ZB(b) mix(vec2(1.),uOwn[0] > 0. ? b ? vec2(.8,1.6) : vec2(.62,1.55) : vec2(1.2,b ? .45 : .32),abs(uOwn[0]))
#define LD_Z(k,b,x) (mix(LD_ZB(b),vec2(1.),k == 4 ? .4 : 0.) * (x ? max(ldMn,.001) * (b ? .62 : .8) : mix(1.,.76,ldMn)) * (k == (b ? 0 : 2) ? 1. + (b ? .35 : .95) * ldOn(.3,1.,ldOne) : (k == 4 || x ? 1. : max(1. - ldOn(0.,1.,(ldOne - (k == 1 ? .5 : k == 3 ? 0. : .2)) / .45),.001)) * (k == 1 ? 1. + .4 * ldOn(0.,.5,ldOne) : 1.)))
#define LD_X5(k,v) uOwn[5] * ldLaid(uKind[k],.8 + 1.2 * v)
vec2 ldE; // the rail's ends, out of the picture
vec3 ldRoll(float x, float y) { float w = ldE.y - ldE.x; return vec3(ldE.x + mod(x * w / 7.42 + uTravel * .12, w), y, 0.); }
void ldPlace(bool b) {
 ldV = float[5](uDrone, uPad, uTexture, uPhrase, 0.);
 vec3 g1 = ldLaid(uKind[1], uPad), g3 = ldLaid(uKind[3], uPhrase), g4 = ldLaid(uKind[4], uHits * 1.5);
 LD_6(ldG,ldLaid(uKind[0],uDrone),b ? g3 : g1,ldLaid(uKind[2],uTexture),b ? g4 : g3,b ? g1 : g4,g3) LD_4(ldG,g1,g3,g1,g3)
 float gust = 4. * uCue * (1. - uCue);
 if (!b) {
 float s = clamp(uRes.x / uRes.y / 1.24,.55,1.), m = 1. - s, th = mod(uTime * .06, TAU);
 vec2 w = vec2(cos(th), sin(th)), w1 = vec2(w.x, -w.y); mat2 on = mat2(-.5048,.8632,-.8632,-.5048);
 ldH = vec2[5](vec2(-1.2 * s, -.4), vec2(.95 * s + .1 * m, .95 - m), vec2(1.62 * s, -.5 - 2.6 * m), vec2(-.3 * s, 1.25 + m), vec2(.38 - 1.7 * m, -.22 - 3.2 * m));
 LD_6(ldK,0,1,2,3,4,3) LD_4(ldK,1,2,0,3)
 const vec4 w0 = vec4(.5,.75,.055,1.21), wp = vec4(.56,.43,.055,1.28), w2 = vec4(.34,.52,.055,1.04), w3 = vec4(.7,.275,.055,1.46);
 LD_6(ldW,w0,wp,w2,w3,vec4(.27,.25,.055,.64),w3) LD_4(ldW,wp,w2,w0,w3)
 vec3 g = gust * vec3(.12,0,-.08);
 if (uOwn[2] < 0.) { ldH[2] = mix(ldH[2], vec2(.05,.2), ldOn(.4,1., -uOwn[2])); ldH[1] = mix(ldH[1], vec2(-1.,.5), ldOn(0.,.6, -uOwn[2])); ldH[4] = mix(ldH[4], vec2(1.35,-.9), -uOwn[2]); }
 if (ldMany) {
 ldTop(vec2(-2.35,1.1),w,.15,.2,g,ldC[5],ldA[5]);
 ldTop(vec2(-1.5,2.5),w1,.15,.2,g,ldC[LI(6)],ldA[LI(6)]);
 ldTop(vec2(.35,-1.45),on * w,.15,.2,g,ldC[LI(7)],ldA[LI(7)]);
 ldTop(vec2(2.35,2.3),w,.15,.2,g,ldC[LI(8)],ldA[LI(8)]);
 ldTop(vec2(2.6,.55),w1,.15,.2,g,ldC[LI(9)],ldA[LI(9)]);
 }
 ldTop(ldH[0],w,.24,.2 - .14 * uDrone,g,ldC[0],ldA[0]);
 ldTop(ldH[1],on * w1,.24,.27 - .16 * uPad,g,ldC[1],ldA[1]);
 ldTop(ldH[2],on * (on * w),.24,.27 - .16 * uTexture,g,ldC[2],ldA[2]);
 ldTop(ldH[3],w1,.24,.27 - .16 * uPhrase,g,ldC[3],ldA[3]);
 ldTop(ldH[4],on * w,.16,.24,g,ldC[4],ldA[4]);
 }
 if (b) {
 float wd = min(uRes.x / uRes.y, 4.), ha = atan(max(.5 * wd, min(.62,.825 * wd)) / 3.1);
 ldE = vec2(6.5 * tan(.38 - ha) - 3.65,7.9 * tan(.42 + ha) - 2.3);
 if (uOwn[7] > 0.) ldE += vec2(-.9,4.) * uOwn[7];
 if (uOwn[7] < 0.) ldE = mix(ldE, vec2(-1.,1.) * (7.6 * tan(ha) + .7), -uOwn[7]);
 ldE.x = min(ldE.x, ldE.y - 6.4);
 LD_6(ldK,0,3,2,4,1,3) LD_4(ldK,1,2,3,1)
 const vec4 w3 = vec4(.25,.3,.11,.855), w1 = vec4(.26,.36,.16,.83), w2 = vec4(.28,.42,.14,.67);
 LD_6(ldW,vec4(.29,.56,.2,.67),w3,w2,vec4(.23,.21,.1,.495),w1,w3) LD_4(ldW,w1,w2,w3,w1)
 vec3 A = normalize(vec3(.03 + .12 * gust, .06 * gust, -1.));
 LD_6(ldA,A,A,A,A,A,A) LD_4(ldA,A,A,A,A)
 LD_6(ldC,ldRoll(2.,.2),ldRoll(3.25,.11),ldRoll(4.45,.14),ldRoll(5.55,.1),ldRoll(6.65,.16),ldRoll(7.9,.11)) LD_4(ldC,ldRoll(2.7,.16),ldRoll(3.85,.14),ldRoll(5.02,.11),ldRoll(6.1,.16))
 }
 if (ldSized) {
 #define LD_SIZE(n,ka,kb) ldQ[LI(n)] = b ? LD_Z(kb,true,n > 5) : LD_Z(ka,false,n > 4); ldW[LI(n)] *= ldQ[LI(n)].yxxy; if (b) ldC[LI(n)].y *= ldQ[LI(n)].x;
 LD_SIZE(0,0,0) LD_SIZE(1,1,3) LD_SIZE(2,2,2) LD_SIZE(3,3,4) LD_SIZE(4,4,1) LD_SIZE(5,3,3)
 if (ldMany) { LD_SIZE(6,1,1) LD_SIZE(7,2,2) LD_SIZE(8,0,3) LD_SIZE(9,3,1) }
 if (b && uOwn[2] < 0.) ldC[0].x = mix(ldC[0].x, sin(uTravel * .05), ldOne);
 }
 if (uOwn[5] > 0.) {
 vec3 x0 = LD_X5(0, uDrone), x1 = LD_X5(1, uPad), x2 = LD_X5(2, uTexture), x3 = LD_X5(3, uPhrase), x4 = LD_X5(4,0.);
 ldG[0] += x0; ldG[1] += b ? x3 : x1; ldG[2] += x2; ldG[3] += b ? x4 : x3; ldG[4] += b ? x1 : x4; ldG[5] += x3;
 if (ldMany) { ldG[LI(6)] += x1; ldG[LI(7)] += x2; ldG[LI(8)] += b ? x3 : x0; ldG[LI(9)] += b ? x1 : x3; }
 }
}
vec3 ldRo, ldRd, ldN0, ldN1; // the ray; the two nearest it may meet: from, to, which
void ldCross(float i, vec3 C, vec3 A, vec4 W, float far) {
 vec3 v = ldRo - C;
 float ya = dot(v, A), yd = dot(ldRd, A), vd = dot(v, ldRd) - ya * yd, a = 1. - yd * yd + 1e-4, R = W.y + .02;
 float h = vd * vd - a * (dot(v, v) - ya * ya - R * R), inv = 1. / (abs(yd) < 1e-3 ? 1e-3 : yd), top = W.w + .12, hh = sqrt(max(h, 0.));
 float s0 = ((uVar > .5 ? -top : -.02) - ya) * inv, s1 = (top - ya) * inv;
 vec3 e = vec3(max((-hh - vd) / a, min(s0, s1)), min((hh - vd) / a, max(s0, s1)), i);
 if (h > 0. && e.x < min(e.y, far)) { if (e.x < ldN0.x) { ldN1 = ldN0; ldN0 = e; } else if (e.x < ldN1.x) ldN1 = e; }
}
// Along the ray to one of them: how far, or 1e3; and where it was just missed.
vec2 ldMarch(int i, float t, float t1, inout vec4 near) {
 if (t < t1) ldTake(i);
 vec3 v = ldRo - ldC[i];
 float ya = dot(v, ldA[i]), yd = dot(ldRd, ldA[i]), vv = dot(v, v), vd = dot(v, ldRd), best = 1e3, tb = t; vec2 hit = vec2(1e3,0.);
 vec2 c0 = vec2(0.), c1 = c0;
 if (uOwn[1] != 0.) { c0 = vec2(dot(v, ldBx), dot(v, ldBy)); c1 = vec2(dot(ldRd, ldBx), dot(ldRd, ldBy)); }
 for (int s = 0; s < (uOwn[0] != 0. || uOwn[1] != 0. ? 46 : 36) && t < t1; s++) {
 float y = ya + yd * t, rr = sqrt(max(vv + t * (2. * vd + t) - y * y, 0.));
 if (uOwn[1] != 0.) rr *= ldRim((c0 + c1 * t) / max(rr, 1e-4), rr);
 float d = ldAll(vec2(rr, y)), e;
 if (uOwn[1] != 0.) d *= .78;
 e = d / (ldPx * t);
 if (e < best) { best = e; tb = t; }
 if (e < .4) { hit = vec2(t, d); t1 = 0.; }
 t += d * .93;
 }
 if (hit.x > 9e2 && best < 1. && tb < near.y) near = vec4(best, tb, float(i), best * ldPx * tb);
 return hit;
}
vec3 ldP, ldNo, ldGp, ldGa, ldBl; // the place to light, its way, the ground, its colour, what is laid
float ldSh, ldAo, ldGw; // the light there, how open it is
// What one does to a place: shadow, colour, the line drawn on the wood.
void ldCast(int i, bool b, bool me, vec3 L, vec3 C, vec3 A, vec4 W) {
 vec3 o = ldP - C, e = o - A * (b ? 0. : W.x);
 float oy = dot(o, A), ly = dot(ldL, A), e2 = dot(e, e), other = float(!me);
 vec3 vv = o - A * oy, lr = ldL - A * ly;
 vec3 t = vec3((vec2(W.x, b ? -W.x : W.x) - oy) / max(ly, .05), max(-dot(vv, lr) / (dot(lr, lr) + 1e-4), 0.)), pen = .015 + max(t, 0.) * ldSoft;
 float ys = oy + ly * t.z;
 vec3 rr = vec3(W.yy, b ? (abs(ys) < W.x ? W.z : .06) : ys < W.x ? min(.6 * W.y, .23) * max(ys, 0.) / W.x : W.z);
 vec3 w0 = vv + lr * t.x, w1 = vv + lr * t.y, w2 = vv + lr * t.z, lo = rr + pen;
 vec3 dk = sat((lo * lo - vec3(dot(w0, w0), dot(w1, w1), dot(w2, w2))) / (4. * rr * pen + 1e-4)) * sat(t * 25. - .5);
 dk.z *= sat(.5 - (abs(ys - (b ? 0. : .5 * W.w)) - (b ? W.w : .5 * W.w)) / (2. * pen.z)) * sat(.3 + rr.z / pen.z);
 if (!b && (i == 1 || ldMany && i == 6) && uOwn[0] == 0.) { // the pear is round
 float ee = dot(e, ldL), pe = .02 + max(-ee, 0.) * ldSoft;
 dk.x = dk.y = other * step(ee, 0.) * ldOff(W.y - pe, W.y + pe, length(e - ldL * ee));
 }
 float f = ldSized && ldQ[LI(i)].x < .02 ? 0. : b ? ldOn(ldE.x, ldE.x + .7, C.x) * ldOff(ldE.y - .7, ldE.y, C.x) : 1., dark = f * max(max(dk.x, dk.y), dk.z), open = 1. + e2 / (W.y * W.y);
 ldSh *= 1. - dark * dark * (3. - 2. * dark);
 ldAo *= 1. - .75 * f / (open * open);
 ldBl += f * other * L * sat(.35 - .65 * dot(ldNo, e) * inversesqrt(e2 + 1e-4)) * (W.y + .3) / (e2 * e2 * 2.5 + .6);
 if (!b && i < 5 && (!ldSized || ldQ[LI(i)].x > .05)) {
 int j = min(i, 4); vec2 d = ldGp.xz - ldH[j]; float dl = length(d) + 1e-4;
 ldGa = mix(ldGa, uKind[j] * uKind[j] * .45, ldOff(.004,.014 + ldGw, abs(dl - ldLobe(i == 4 ? .16 : .24, d.x / dl))) * (.3 + .65 * ldV[j]) * (1. - max(uOwn[4], 0.)) * (1. + min(uOwn[3], 0.)));
 }
}
// The other grounds. tilt: how it leans to the light.
vec3 ldLay(vec3 ga, vec3 gp, bool b, bool wall, float gw, inout vec2 tilt) {
 vec3 k = uKind[0]; k *= k;
 vec2 q = wall ? gp.xy : gp.xz;
 bool rail = b && !wall;
 if (uOwn[3] > 0.) ga = mix(ga, (rail ? vec3(.6,.55,.48) : vec3(.8,.785,.76)) * (.95 + .07 * noise(q * 2.3)), uOwn[3]);
 if (ldDim) ga = mix(ga, (vec3(.011) + .02 * k) * (rail ? 3. : 1.), min(-1.2 * uOwn[3], 1.));
 if (uOwn[4] > 0. && !rail) {
 vec3 c = k * (.86 + .2 * noise(q * 1.1) + .12 * (noise(q * 46.) - .5) * ldOff(.01,.03, gw));
 if (wall) { float f = gp.x * 5. + 1.3 * sin(gp.x * 1.7 + 1.) + .25 * gp.y; tilt = vec2(.55 * cos(f), 0.) * uOwn[4]; c *= .62 + .38 * sin(f); }
 else {
 float d = 1e3, d2 = d; vec2 at = vec2(0.);
 #define LD_RAKE(i) if (!ldSized || ldQ[LI(i)].x > .05) { vec2 e = q - ldC[LI(i)].xz; float l = length(e) - .25 * ldW[LI(i)].y; if (l < d) { d2 = d; d = l; at = e; } else d2 = min(d2,l); }
 LD_RAKE(0) LD_RAKE(1) LD_RAKE(2) LD_RAKE(3) LD_RAKE(4)
 if (ldMany) { LD_RAKE(5) LD_RAKE(6) LD_RAKE(7) LD_RAKE(8) LD_RAKE(9) }
 float see = ldOff(.02,.07, gw) * ldOn(0.,.3, d2 - d);
 tilt = at / (length(at) + 1e-3) * .42 * cos(d * 34.) * see * uOwn[4] * ldOn(0.,.12, d) * (.35 + .65 * ldOff(.4,3., d));
 c *= 1. - .1 * see * sin(d * 34. + 1.5);
 }
 ga = mix(ga, c, min(1.,1.3 * uOwn[4]));
 }
 if (uOwn[4] < 0. && !rail) {
 vec2 u = (wall ? q : rot(.62) * q) / (wall ? .42 : .74), id = floor(u), f = abs(u - id - .5);
 float aa = gw * 1.6 + .006, odd = mod(id.x + id.y, 2.), edge = max(f.x, f.y), h = hash21(id);
 vec3 c = mix(k * .75, vec3(.7,.67,.6) * (1. + .75 * min(uOwn[3], 0.)), odd) * (.84 + .28 * h);
 c *= .92 + .16 * noise(u * 5. + h * 9.);
 c = mix(c, vec3(.2,.18,.16), ldOn(.49 - aa, .49, edge) * ldOff(.02,.1, gw) * .8);
 ga = mix(ga, c, min(1.,-1.2 * uOwn[4]));
 }
 return ga;
}
float ldIn(float x, float a, float b, float w) { return sat((x - a) / (2. * w) + .5) * sat((b - x) / (2. * w) + .5); }
// Where the window's light falls.
float ldPool(vec3 pos, bool b) {
 vec2 q = b ? pos.xy - ldL.xy / ldL.z * (pos.z - 1.7) : pos.xz - ldL.xz / ldL.y * pos.y, d = normalize(ldL.xz);
 float so = mix(.2,.5, uSpace), u = b ? q.x + .5 * q.y - .5 : dot(q, vec2(-d.y, d.x));
 float pool = ldOn(-2.4 - so, -2.1 + so, u) * ldOff(1.9 - so, 2.2 + so, u);
 pool *= 1. - .72 * ldOff(0.,.2 + so * .5, abs(u - (b ? .75 : 1.02)) - .02);
 float was = b ? .16 + .84 * pool * ldOff(.4 - so, .7 + so, q.y) : .1 + .9 * pool;
 return uOwn[3] > 0. ? mix(was, 1., uOwn[3]) : was;
}

vec3 render(vec2 p) {
 bool b = uVar > .5;
 ldPlace(b);
 float zoom = clamp(1.24 * uRes.y / uRes.x, 1.,1.65), foc = b ? 3.1 : 2.1;
 p *= zoom; ldPx = zoom / (uRes.y * foc);
 ldSoft = mix(.047,.107, uSpace);
 ldL = normalize(b ? vec3(-.5,.5,-.8) : vec3(-.82,.44,.5 + .06 * sin(TAU * uLoop)));
 float yaw = b ? .02 * sin(uTime * .05) - .4 : .1 + .03 * sin(uTime * .04);
 vec3 ta = b ? vec3(.1,-.15,0) : vec3(.1,.46,.2);
 float co = cos(yaw), si = sin(yaw);
 vec3 fw = b ? vec3(-si * .975,-.22, co * .975) : vec3(-si * .87,-.493, co * .87), ro = ta - fw * (b ? 8. : 6.6);
 if (uOwn[7] != 0.) {
 if (b) { yaw = uOwn[7] > 0. ? yaw - .28 * uOwn[7] : yaw * (1. + uOwn[7]); co = cos(yaw); si = sin(yaw); fw = vec3(-si * .975,-.22, co * .975); if (uOwn[7] < 0.) ta.x = mix(ta.x, 0., -uOwn[7]); }
 else { float s = uOwn[7] > 0. ? mix(.493,.97, uOwn[7]) : mix(.493,.1, -uOwn[7]), c = sqrt(1. - s * s); fw = vec3(-si * c, -s, co * c); ta.y -= uOwn[7] * (uOwn[7] > 0. ? .25 : .35); }
 ro = ta - fw * (b ? 8. : 6.6 + 1.2 * max(uOwn[7], 0.));
 }
 vec3 rt = vec3(co, 0., si), up = cross(fw, rt);
 vec3 rd = normalize(fw * foc + rt * p.x + up * p.y);

 // the ground: a table, or a wall with a rail before it
 float tg = b ? (1.7 - ro.z) / max(rd.z, .1) : ro.y / max(-rd.y, .02), rail = 0.;
 vec3 gn = b ? vec3(0,0,-1) : vec3(0,1,0);
 if (b) {
 float tt = ro.y / max(-rd.y, .01), tf = (-.13 - ro.z) / max(rd.z, .1), z = ro.z + rd.z * tt, y = ro.y + rd.y * tf;
 float px = ldPx * tf, onTop = step(rd.y, -.01) * step(-.13, z) * ldOff(0., px, (z - .13) * -rd.y), front = step(y, 0.) * ldOn(-.15 - px, -.15, y);
 rail = max(onTop, front);
 if (onTop > .5) { tg = tt; gn = vec3(0,1,0); } else if (front > 0.) tg = tf;
 }
 vec4 near = vec4(1.,1e3,0.,0.), was = near;
 ldRo = ro; ldRd = rd; ldN0 = ldN1 = vec3(1e3,0.,0.);
 #define LD_CROSS(n) ldCross(float(n),ldC[LI(n)],ldA[LI(n)],ldW[LI(n)],lim);
 #define LD_ALL LD_CROSS(0) LD_CROSS(1) LD_CROSS(2) LD_CROSS(3) LD_CROSS(4) if (b || ldMany) { LD_CROSS(5) } if (ldMany) { LD_CROSS(6) LD_CROSS(7) LD_CROSS(8) LD_CROSS(9) }
 float lim = tg;
 LD_ALL
 vec3 gp = ro + rd * tg, e0 = ldN0, e1 = ldN1, e = e0, rf = reflect(rd, vec3(0,1,0)), gu = gp + vec3(0,.004,0);
 if (ldDim) { ldN0 = ldN1 = vec3(1e3,0.,0.); ldRo = gu; ldRd = rf; lim = 40.; LD_ALL ldRo = ro; ldRd = rd; }
 // the nearest, the next, and what a black ground mirrors
 vec2 h0 = vec2(1e3,0.), hh = h0; int id = -1, ri = int(ldN0.z); bool mir = false;
 for (int n = 0; n < 3; n++) {
 if (ldDim) was = near;
 vec2 h = ldMarch(int(e.z), e.x, ldDim && mir ? e.y : min(e.y, min(h0.x, tg)), near);
 if (ldDim && mir) { hh = h; near = was; break; }
 if (h.x < h0.x) { h0 = h; id = int(e.z); }
 e = e1;
 if (n > 0 || e.x >= min(e.y, min(h0.x, tg))) {
 if (ldDim && !b && h0.x > 9e2 && ldN0.x < 40.) { mir = true; e = vec3(max(ldN0.x, .01), ldN0.yz); ldRo = gu; ldRd = rf; }
 else break;
 }
 }
 float tb = h0.x, d0 = h0.y;
 float cover = id >= 0 ? 1. : sat((1. - near.x) / .7);
 if (near.y < tb && near.x < .65 || id < 0) { id = int(near.z); tb = near.y; d0 = near.w; }
 bool on = cover > .5;
 vec3 op = ro + rd * min(tb, 60.);
 float gw = tg * ldPx;

 // the grain
 bool wall = b && rail < .5;
 vec2 x = b ? (wall ? gp.xy * vec2(1,.25) : vec2(gp.x, gp.y * 1.4 + gp.z)) : rot(.42) * gp.xz + vec2(3,7.3);
 float board = b ? 3. : floor(x.y / 1.35), bh = fract(board * .618), seam = (.5 - abs(fract(x.y / 1.35) - .5)) * 1.35;
 x.x += b ? 0. : bh * 9.;
 float bend = noise(vec2(x.x * .42 + board * 5.3, x.y * 1.1 + board)), soft = b ? bend : .5 + .5 * sin(x.y * 19. + bend * 17. + board * 4.);
 float fib = noise(vec2(x.x * 2.5, x.y * 70. + board * 11.)) * ldOff(.006,.02, gw), ring = fract(x.y * 9. + 5. * bend);
 float gr = .27 * ldOn(0.,.75, ring) * ldOff(.9,1., ring) + .36 * fib + .32 * soft;
 vec2 tilt = vec2(0.);
 vec3 ga = mix(vec3(.72,.55,.37), vec3(.5,.345,.2), gr) * (.9 + .16 * bh) * (1. - .5 * ldOff(0.,.016 + gw, seam)), glow = vec3(0);
 if (b) {
 float u = (gp.x + 2.6) / 5.2, strip = ldIn(gp.y, -.11,-.04, gw) * rail, now = (u - uLoop) * 5.2;
 vec3 m = vec3(0);
 for (int n = strip > 0. ? 1 : 0; n > 0; n--) { m = piece(vec2(u, .5 + (gp.y + .075) * 5.)).rgb; m = ldRich(m * m, 1.4); }
 ga = mix(mix(vec3(.075,.165,.185), vec3(.115,.205,.21), bend * .6 + soft * .4), mix(vec3(.3,.18,.09) * (.7 + .5 * gr), vec3(.04) + m * .9, strip), rail);
 glow = strip * (m * .5 * uEnergy + vec3(1,.8,.5) * exp(-now * now * 60.) * .4 * ldOn(0.,.05, uLoop) * ldOff(.95,1., uLoop));
 }

 if (uOwn[3] != 0. || uOwn[4] != 0.) { float strip = b ? ldIn(gp.y, -.11,-.04, gw) * rail : 0.; ga = mix(ldLay(ga, gp, b, wall, gw, tilt), ga, strip); }
 // the turned thing and its paint
 ldTake(id);
 int kd = ldK[id], pk = 5 * ldSp(id);
 float lv = kd == 4 ? uHits : ldV[kd], hit = kd == 4 ? uHits : 0.;
 vec3 A = ldA[id], v = op - ldC[id];
 float y = dot(v, A); vec3 vr = v - A * y; float r = length(vr) + 1e-4;
 vec3 ra = vr / r, T = cross(A, ra);
 vec2 q = vec2(r, y);
 float turn = 0.;
 if (uOwn[1] != 0.) {
 vec2 c0 = vec2(dot(ra, ldBx), dot(ra, ldBy)), c1 = normalize(c0 + .02 * vec2(-c0.y, c0.x));
 float r0 = ldRim(c0, r);
 turn = (ldRim(c1, r) - r0) / .02; q.x *= r0; d0 /= .78;
 }
 if (ldOther && uOwn[5] < 0.) d0 = ldAll(q);
 vec2 g = normalize(vec2(ldAll(q + vec2(.003,0)), ldAll(q + vec2(0,.003))) - d0 + 1e-6);
 vec3 n = ra * g.x + A * g.y;
 if (uOwn[1] != 0.) n = normalize(n + T * turn * g.x);
 float oao = .4 + .6 * sat(ldAll(q + g * .11) / .11);
 if (ldOther) { r = q.x / ldSc.x; y /= ldSc.y; }
 vec3 bx = ldSide(id);
 float cx = dot(ra, bx), cy = dot(ra, cross(A, bx)), ang = atan(cy, cx + (abs(cx) + abs(cy) < 1e-4 ? 1. : 0.)) + ldSpin(id);
 float w = tb * ldPx / max(sat(-dot(n, rd)), .2), yy = b ? abs(y) - ldS : y;
 vec3 l = vec3(r * cos(ang), y, r * sin(ang));
 float wr = fract((length(l.xz - vec2(.31,.17) - l.y * vec2(.06,-.04))) * 12.);
 vec3 wood = vec3(.52,.32,.165) * (.84 + .2 * ldOn(0.,.8, wr) * ldOff(.88,1., wr));
 vec3 kc = ldRich(uKind[kd], .95 + .45 * lv), hue = kc * kc * (.68 + .38 * lv) + vec3(.03,.026,.02), bone = vec3(.66,.6,.48);
 vec3 how = LD_P[pk + 4], alb = wood, oglow = vec3(0);
 float along = how.z > .5 ? r : yy, painted = b ? ldOn(.21 - w, .21 + w, yy) : how.z > .5 ? ldIn(yy, .42,.62,.01) : 1.;
 float turns = (ang * how.x + along * how.y) / TAU, st = sat((.25 - abs(fract(turns) - .5)) * 6. / (w * (how.x / r + how.y)) + .5);
 for (int j = cover > 0. ? 0 : 4; j < 4; j++) {
 vec3 bd = LD_P[pk + j];
 vec3 c = bd.z < .5 ? hue : bd.z < 1.5 ? bone : bd.z < 2.5 ? LD_INK : mix(hue, bd.z < 3.5 ? bone : hue * .6, st);
 alb = mix(alb, c, ldIn(along, bd.x, bd.y, w) * painted);
 float m = j < 3 ? ldIn(along, bd.y - .002, bd.y + .02, max(w, .002)) * painted : 0.;
 alb = mix(alb, vec3(.62,.45,.2), m);
 oglow += m * vec3(1,.72,.36) * (uBands[kd * 3 + j] * (.4 + 1.6 * uEnergy) + 2. * hit);
 }
 if (uOwn[6] < 0.) { float f = (r + yy) * 13., e = fwidth(f) + .01; alb = mix(alb, mix(hue, bone, ldOn(-e, e, abs(fract(f) - .5) - .27 + .12 * sin(floor(f) * 2.4))), -uOwn[6]); oglow *= 1. + uOwn[6]; }
 if (uOwn[6] > 0.) { alb = mix(alb, hue * (.82 + .3 * noise(l * 6.)) + .02, uOwn[6]); oglow *= 1. - .85 * uOwn[6]; }
 if (kd == 2) alb = mix(alb, uOwn[6] != 0. ? mix(wood, alb, abs(uOwn[6])) : wood, ldOn(.75,.95, g.x) * painted);
 float knob = ldOn(0.,.02, yy - ldF[5].x + ldF[5].y * .6);
 alb = mix(alb, b ? hue : uOwn[6] > 0. ? mix(LD_INK, hue, uOwn[6]) : LD_INK, knob);
 oglow += hue * hit * .7 + vec3(1,.7,.4) * .35 * uKeys * knob;
 if (b && kd == 0) alb *= 1. - .4 * ldOn(.4,.44, yy);
 alb *= (.91 + .12 * abs(fract((r - y) * 24.) * 2. - 1.) * ldOff(.006,.02, w)) * (1. + .07 * sin(l.x * 19. + l.y * 13.) * sin(l.z * 17. - l.y * 9.)); // marks of the chisel

 // shadows
 bool flatWall = wall && !on;
 ldP = on ? op + n * .006 : gp; ldNo = on ? n : gn; ldGp = gp; ldGa = ga; ldGw = gw; ldSh = 1.; ldAo = 1.; ldBl = vec3(0);
 if (flatWall) ldSoft = .2;
 #define LD_CAST(n) ldCast(n,b,on && id == n,ldG[LI(n)],ldC[LI(n)],ldA[LI(n)],ldW[LI(n)]);
 LD_CAST(0) LD_CAST(1) LD_CAST(2) LD_CAST(3) LD_CAST(4)
 if (b || ldMany) { LD_CAST(5) }
 if (ldMany) { LD_CAST(6) LD_CAST(7) LD_CAST(8) LD_CAST(9) }
 float sh = ldSh, gao = b ? .7 + .3 * ldAo : ldAo; ga = ldGa;
 vec3 bleed = ldBl * (.3 + .7 * uEnergy);
 if (flatWall) sh = .25 + .75 * sh * (1. - .6 * ldOff(0.,.5, abs(gp.y - ldL.y / ldL.z * 1.7 + .07)));

 // light
 vec3 warm = mix(vec3(1,.72,.46), vec3(1,.9,.78), uTone);
 vec3 key = warm * (b ? 3.4 : 4.) * (.8 + .35 * uLow + .15 * uLevel) * ldPool(ldP, b);
 vec3 sky = vec3(.3,.38,.5) * (.32 + .12 * uMid + .1 * uMic), under = b ? vec3(.1) : vec3(.4,.27,.16);
 if (ldDim) { key *= 1. + .25 * uOwn[3]; sky *= 1. + .6 * uOwn[3]; under *= 1. + uOwn[3]; }
 if (uOwn[3] > 0.) { sky *= 1. + .9 * uOwn[3]; key *= 1. - .22 * uOwn[3]; }
 if (uOwn[5] > 0.) { key *= 1. - .9 * uOwn[5]; sky *= 1. - .62 * uOwn[5]; bleed *= 1. + 2.2 * uOwn[5]; }
 if (uOwn[4] != 0.) gn = normalize(gn + (wall ? vec3(tilt, 0.) : vec3(tilt.x, 0., tilt.y)));
 float ndl = dot(n, ldL), fr = 1. - sat(-dot(n, rd)), gf = 1. - sat(-dot(gn, rd));
 vec3 gl = key * sat(dot(gn, ldL)) * sh + sky * (.6 + .4 * gn.y) * gao + under * (.5 - .5 * gn.y) + bleed;
 vec3 ol = key * sat(ndl) * sh + (sky * (.6 + .4 * n.y) + under * (.5 - .5 * n.y)) * oao + bleed;
 // a hit runs out
 float run = (b ? abs(gp.x + 2.6 - 5.2 * uLoop) : length(gp.xz - ldC[4].xz)) - .12 - (b ? 2.6 : 1.3) * (1. - uHits);
 glow += (b ? uKind[4] * mix(.5 * exp(-6. * (gp.y + .4) * (gp.y + .4)), 1., rail) : ga * warm) * uHits * uHits * exp(-run * run * (b ? 9. : 160.)) * 1.8;
 if (uOwn[3] > 0.) { glow *= 1. - .8 * uOwn[3]; ga *= mix(vec3(1.), uKind[4] * uKind[4] + .1, uOwn[3] * uHits * exp(-run * run * (b ? 9. : 60.))); }
 vec3 col = ga * gl + (wall ? .05 : .25) * (.04 + .5 * gf * gf * gf) * gao * vec3(.5,.56,.64) + glow;
 if (ldDim && !wall) {
 vec3 c = vec3(.02,.022,.026);
 if (!on && hh.x < 9e2) {
 vec3 a = ldA[ri], o = ldRo + rf * hh.x - ldC[ri]; float oy = dot(o, a); vec3 v2 = o - a * oy; float rl = length(v2) + 1e-4; vec3 n2 = normalize(v2 / rl * .8 + a * (oy - ldW[ri].x));
 int k2 = ldK[ri]; float l2 = k2 == 4 ? uHits : ldV[k2], bd = .55 + .45 * ldOn(-.3,.3, sin((rl / ldQ[ri].x + oy / ldQ[ri].y) * 26.));
 vec3 h2 = uKind[k2] * uKind[k2] * (.68 + .38 * l2);
 c = (h2 * mix(bd, 1., max(uOwn[6], 0.)) * (key * sat(dot(n2, ldL)) + sky * 1.6) + h2 * bd * max(uOwn[5], 0.) * (.5 + 1.2 * l2) * (.15 + .85 * abs(dot(n2, rf)))) * exp(-.7 * (ldRo + rf * hh.x).y);
 }
 col += uOwn[3] * (.2 * (.04 + .5 * gf * gf * gf) * gao * vec3(.5,.56,.64) - c * (.2 + .8 * gf * gf * gf));
 }
 // satin lacquer
 vec3 H = normalize(ldL - rd);
 float th = dot(T, H), an = max(1. - th * th, 0.), nh = sat(dot(n, H)), n8 = nh * nh; n8 *= n8; n8 *= n8;
 an *= an; an *= an; an *= an; an *= an; an *= an; an *= an;
 float hi = n8 * n8; hi *= hi; hi *= hi; hi *= hi;
 vec3 oc = alb * ol + key * sat(ndl * 4.) * sh * (.025 * an * n8 + (.3 + .45 * uHigh) * hi);
 oc += .5 * (.04 + .5 * fr * fr * fr) * oao * mix(vec3(.3,.2,.12), vec3(.62,.72,.85), ldOn(-.1,.5, reflect(rd, n).y)) + oglow * (.35 + .65 * sh);
 if (uOwn[6] > 0.) oc = mix(oc, alb * ol + oglow * .5,.75 * uOwn[6]);
 if (uOwn[5] > 0.) { float face = sat(-dot(n, rd)); oc = mix(oc, oc * .5 + (alb * .75 + hue * .55) * (.2 + .7 * lv + 1.4 * hit) * (.3 + .8 * face * face) + oglow, uOwn[5]); }
 if (uOwn[5] < 0.) {
 vec3 rr = reflect(rd, n); float up5 = ldOn(-.12,.1, rr.y), win = ldOn(.25,.7, dot(rr, normalize(ldL + vec3(0,.25,0))));
 vec3 env = mix(ga * (key * .2 + sky * .6), sky * .5 + warm * .9 * exp(-14. * abs(rr.y - .16)), up5) + warm * win * (.8 + 1.8 * sh) * (1. + .4 * min(uOwn[3], 0.));
 vec3 tint = mix(alb, hue, .6); tint = tint * 1.7 + .1 * dot(tint, vec3(.6));
 oc = mix(oc, tint * (env + .06) * (.3 + .7 * oao) + oglow * .5 + key * sh * .6 * hi + hue * lv * .1, -uOwn[5]);
 }
 if (!b && uOwn[7] < 0.) {
 vec3 far = (uKind[1] * uKind[1] * .85 + warm * .16) * (1. - .75 * max(uOwn[5], 0.)) * (1. + .5 * min(uOwn[3], 0.));
 far *= mix(1.,.3, ldOn(0.,.4, rd.y));
 col = mix(col, far, ldOff(0.,.13, -rd.y) * ldOn(0.,.35, -uOwn[7]));
 }
 // a cue's light goes over
 float cq = ldP.x * .8 + ldP.y * .3 + 2.6 - 5.2 * (1. - uCue);
 vec3 c = mix(col, oc, cover) + mix(ga, alb, cover) * warm * uCue * exp(-cq * cq * 1.6) * (uOwn[3] > 0. ? .9 - .55 * uOwn[3] : .9);
 return screenOf(c);
}
