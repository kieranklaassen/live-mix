// name: Balance
// a: Found plates
// b: Straw frames
// what: A hanging tree of found things on straight rods and thread, slate, oyster shell, birch bark, a brass offcut, a mussel, a pot shard, a pebble and sea glass, turning in window light with one soft shadow each on a plaster wall; or a few gold straw frames on threads against an evening sky, lit from behind.
// follows: Each kind of sound is one thing or one frame: as it sounds it turns, takes a little of its colour and, among the plates, weighs its rod down. Low, mid and high, keys and voice turn or light the small ones. A hit rocks the shard's rod, or runs down the great frame as light; a cue breathes through the whole tree. The loop moves the light.
float baPx, baLoop; vec2 baN;
// A slow swing; a small turn's cosine and sine.
float baSin(float t) { t = fract(t)*2. - 1.; return 4.*t*(abs(t) - 1.); }
vec2 baTurn(float a) { a *= .5; return vec2(1. - a*a, 2.*a)/(1. + a*a); }
float bW(float per, float ph) { return baSin(uTime/per + ph); }
float baS(float a, float b, float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
float baCov(float d) { return sat(.5 - d*.7/baPx); }  // how much of a pixel is covered
float baLen(vec2 v) { return max(length(v), 1e-5); }
vec3 baOwn(vec3 c) { c *= c; return c*.5/max(dot(c, vec3(.3, .59, .11)), .05); }  // a sound's colour, evenly strong
float baSeg(vec2 p, vec2 a, vec2 b) { vec2 v = b - a, w = p - a; return length(w - v*sat(dot(w, v)/max(dot(v, v), 1e-6))); }
// ---- a: found plates
// Slate, oyster, birch, brass, mussel, shard, pebble, sea glass: middle and loudness; cosine and sine of the turn, size, width.
vec4 baC[8], baF[8];
vec2 baK;  // how far a step towards us moves a shadow on the wall
float baGain;  // how strongly sound turns things
const float baWall = -.4;
const vec2 baEye = vec2(0, .1);  // we look up a little
// How each is cut: lean, half width, taper, bow; tilt, half height, ragged edge; two arcs that meet.
const vec4 baCut[8] = vec4[](vec4(.09, .6, .1, 0), vec4(0, 3, .2, .03), vec4(0, .47, 0, .05), vec4(0, .8, 0, 0), vec4(0, 2, .5, .05), vec4(.22, .62, .2, 0), vec4(0, 2, 0, 0), vec4(.1, .54, .24, 0));
const vec4 baEnd[8] = vec4[](vec4(-.2, .9, 5, .07), vec4(0, 3, 6, .14), vec4(.06, .92, 11, .1), vec4(0, .8, 9, .008), vec4(0, 3, 9, .02), vec4(.2, .68, 6, .07), vec4(0, 3, 2, .12), vec4(-.1, .62, 2, .1));
const vec4 baArc[8] = vec4[](vec4(0, .3, .3, 1.5), vec4(0, 1.12, 1, .86), vec4(0, .3, .3, 1.5), vec4(0, 1, 1, 1.6), vec4(.88, 1, 1, 1.33), vec4(0, .3, .3, 1.5), vec4(0, .92, 1.15, .84), vec4(0, 1, 1, .72));
vec3 baDown(vec3 e, float len) { return e - vec3(0, len, 0); }
vec2 baSee(vec3 a) { return (a.xy + baEye*a.z)*(1. + .14*a.z); }
vec2 baFall(vec3 a) { return a.xy + baK*(a.z - baWall); }
float baDrop(vec2 p, float len) { return max(abs(p.x), abs(p.y + .5*len) - .5*len); }
// The nearest rod and thread, their shadows, and the things that may be here or shade it.
vec2 baP, baRa, baRb; float baRs, baRd, baTs, baTd, baSoft; int ba0, ba1, ba2, ba3;
vec3 baTie(vec3 e, float len) {  // a thread hangs plumb
 baTs = min(baTs, baDrop(baP - baFall(e), len)); baTd = min(baTd, baDrop(baP - baSee(e), len));
 return baDown(e, len);
}
// A rod hung by a thread, turned and tipped.
vec3 baLe, baRe;
void bA(vec3 e, float len, float turn, float tip, float l, float r) {
 vec2 t = baTurn(turn); vec3 d = vec3(t.x, tip, t.y); e = baTie(e, len);
 baLe = e - d*l; baRe = e + d*r;
 vec2 a = baSee(baLe), b = baSee(baRe);
 baRs = min(baRs, baSeg(baP, baFall(baLe), baFall(baRe)));
 float s = baSeg(baP, a, b); if (s < baRd) { baRd = s; baRa = a; baRb = b; }
}
void baPut(int k) { ba3 = ba2; ba2 = ba1; ba1 = ba0; ba0 = k; }
void bH(int k, vec3 e, float len, float turn, float sway, float wave, float loud, float size, float top, float wide) {
 e = baTie(e, len) - vec3(0, size*top, 0);
 vec4 f = vec4(baTurn(turn + sway*wave + baGain*loud), size, wide);
 baC[k] = vec4(e, loud); baF[k] = f;
 vec2 d = abs(baP - baSee(e)), g = abs(baP - baFall(e)); float y = size*1.1;
 if (d.x < size*(wide*abs(f.x) + .12) && d.y < y) baPut(k);
 if (g.x < size*(wide*abs(f.x + baK.x*f.y) + .1) + baSoft && g.y < y + baSoft) baPut(k + 8);
}
void baTree(vec2 p) {
 baP = p; baRs = baRd = baTs = baTd = 9.; baRa = vec2(0); baRb = vec2(1);
 ba0 = ba1 = ba2 = ba3 = -1;
 float all = 2.*uCue*(1. - uCue);  // a cue is a breath that turns the whole tree
 float e = .15 + .3*uEnergy, w = .03 + .06*uEnergy;
 baGain = .25 + .5*uEnergy;
 bA(vec3(-.1, 1.4, 0), 1.005, .1 + .26*bW(97., .06) + all, .02 + w*.5*(uPad - uDrone), .46, .22);
 vec3 left = baLe, right = baRe, far;
 // the left side: an oyster and a mussel
 bA(left, .05, -.25 + .4*bW(71., .33) + e*uPad + all*1.2, -.03 + w*(uPad - uMid), .16, .2);
 far = baRe;
 bH(1, baLe, .05, .5, .55, bW(43., .16), uPad, .135, .8, .92);
 bH(4, far, .2, -.5, .7, bW(37., .03), max(uMid, uMic), .09, .92, .62);
 // the right side: slate close in, then birch and brass far out
 bA(right, .06, -.1 + .28*bW(83., .8) + all*1.1, -.05 + w*.6*(uDrone - uTexture), .17, .4);
 far = baRe;
 bH(0, baLe, .05, -.4, .42, bW(61., .41), uDrone, .172, .86, .74);
 bA(far, .05, .3 + .38*bW(59., .27) + e*uTexture + all*1.3, .03 + w*(uPhrase - uTexture), .19, .17);
 far = baLe;
 bH(2, baRe, .04, .35, .6, bW(45., .86), uTexture, .16, .86, .6);
 bH(3, far, .13, -.4, .5, bW(41., .22), uPhrase, .14, .76, .85);
 // under the slate a shard (a hit rocks its rod) and a pebble, under the mussel sea glass
 bA(baDown(baC[0].xyz, .15), .075, .15 + .35*bW(67., .52) + e*uLow + all*1.4, .02 - w*uLow + .25*uHits*baSin(1. - uHits), .14, .2);
 far = baRe;
 bH(5, baLe, .07, .3, .5, bW(39., .35), 0., .085, .64, .86);
 bH(6, far, .07, .2, .6, bW(35., .94), uLow, .062, .74, 1.);
 bH(7, baDown(baC[4].xyz, .08), .06, -.3, .6, bW(31., .6), max(uHigh, uKeys), .064, .62, .8);
}
// How far outside the outline a place is, in the picture's own length, seen or lit along k.
vec2 baQ, baG; float baIn;
float baEdge(int i, vec2 p, vec4 f, vec2 k) {
 vec4 cut = baCut[i], end = baEnd[i], arc = baArc[i];
 float c = f.x + k.x*f.y, sk = k.y*f.y;
 c = c < 0. ? min(c, -.06) : max(c, .06);
 float u = p.x/c;
 vec2 q = vec2(u, p.y - u*sk)/f.z; baQ = q;
 float ta = 1. + cut.z*q.y, x = (q.x + 2.*cut.w*q.y*(1. - q.y*q.y))*ta;
 float y = q.y + end.x*x, xx = x + cut.x*q.y;
 vec2 g = vec2(sign(xx), 0);
 float d = abs(xx) - cut.y, e = abs(y) - end.y;
 if (e > d) { d = e; g = vec2(0, sign(y)); }
 vec2 m = vec2(x, q.y) + (i == 3 ? vec2(.8, -.8) : vec2(0)), a = vec2(abs(m.x) + arc.x, m.y)*arc.yz; float l = baLen(a);
 if (l - arc.w > d) { d = l - arc.w; g = a/l*arc.yz; g.x *= sign(m.x); }
 a = q + vec2(-.78, .78); l = baLen(a); e = (i == 3 ? .78 : -9.) - l;
 if (e > d) { d = e; g = -a/l; }
 d += end.w*(noise(q*end.z + end.z) - .5); baIn = d;
 g.x = (g.x*ta - g.y*sk)/c; e = baLen(g); baG = g/e;
 return d*f.z/e;
}
// What each is made of: its colour, its bulge, its shine (amount, tightness).
vec2 baBulge, baShine;
vec3 baStuff(int k, vec2 q, float d) {
 baBulge = vec2(0); baShine = vec2(.05, 12.);
 float n = noise(q*9. + float(k)*7.);
 float rad = length(q - vec2(0, .88)) + .05*n;  // rings about a shell's hinge
 // one grain, laid the way each thing grew or split
 vec2 gq = k == 0 ? vec2(q.x*2. + n, (q.y + .45*q.x)*6.) : k == 2 ? vec2(q.x*2., q.y*13.) : k == 3 ? vec2(q.x*2., q.y*60.)
  : k == 5 ? vec2(q.x, q.y*20.) : vec2(rad*(k == 1 ? 13. : 20.), .5);
 float g1 = noise(gq), f = noise(k < 2 ? gq*vec2(3.6, 3.1) + 5. : q*31.);
 vec3 c;
 if (k == 0) {  // split faces, each a flat step, and a chipped rim
  float u = g1*3.5 + .5*f, st = floor(u), lip = baS(.8, 1., u - st);
  baBulge = vec2(.14*st - .25, .35*(f - .5) + .2*lip); baShine = vec2(.1, 8);
  c = mix(vec3(.05, .06, .073), vec3(.125, .138, .152), .15*st + .5*f)*(.7 + .4*n + .08*lip);
  c = mix(c, vec3(.17, .185, .195)*(.5 + .8*f), baS(-.06, -.01, d + .06*n)*.6);
 } else if (k == 1) {
  baBulge = (g1 - .5)*vec2(.1, .5) - q*.55; baShine = vec2(.22, 20.);
  c = vec3(.5, .485, .455)*(.8 + .25*g1) + .022*cos(TAU*(vec3(0, .33, .67) + rad*1.2 + .4*q.x));
  c = mix(c, vec3(.27, .23, .24), baS(.24, .17, length((q - vec2(-.2, -.2))*vec2(1., .8)))*.6);
  c = mix(c, mix(vec3(.16, .14, .135), vec3(.4, .37, .33), f), baS(-.2, -.08, d + .16*(n - .5)));
 } else if (k == 2) {
  baBulge = vec2(q.x*1.4, 0.);
  vec2 m = vec2(q.x*2.1, q.y*10.); m.x += 5.*hash11(floor(m.y));  // the dark marks across it
  vec2 id = floor(m), h = hash22(id + 1.7), v = (fract(m) - .5 - vec2(.2, .15)*(h - .5))/vec2(.12 + .34*h.x, .07 + .13*h.y);
  c = mix(vec3(.58, .545, .485), vec3(.68, .66, .61), g1);
  c = mix(c, vec3(.085, .07, .06), baS(1.15, .75, length(v) + .3*f)*step(.36, hash21(id + 9.))*.9);
  c = mix(c, vec3(.5, .33, .2), baS(-.09, -.01, d + .05*f)*.9);
 } else if (k == 3) {
  baBulge = vec2((g1 - .5)*.14, .3*sin(q.x*1.4 + .4)); baShine = vec2(.5, 10.);
  c = vec3(.4, .235, .07)*(.75 + .4*g1);
  c = mix(c, vec3(.15, .125, .075), .6*baS(.5, .8, n)*f + .5*baS(-.05, 0., d));
 } else if (k == 4) {
  baShine = vec2(.4, 26.); baBulge = vec2(q.x*1.8, q.y*.4) + (g1 - .5)*.2;
  c = mix(vec3(.018, .026, .055), vec3(.15, .14, .22), g1*.4 + .6*baS(.7, .1, rad));
 } else if (k == 5) {
  baBulge = vec2(q.x*.7, (g1 - .5)*.5);
  c = mix(vec3(.36, .145, .072), vec3(.44, .2, .11), .6*n + .4*f)*(.85 + .2*g1);
  c = mix(c, vec3(.5, .31, .21)*(.7 + .5*f), baS(-.1, -.02, d + .12*n - .06*q.y - .02));
 } else if (k == 6) {
  baBulge = q*1.1;
  c = mix(vec3(.25, .26, .25)*(.75 + .45*f), vec3(.7, .68, .63), baS(.09, .04, abs(q.y - .5*q.x + .12*sin(q.x*4.)))*.9);
 } else {
  baBulge = q*.9; baShine = vec2(.4, 18.);
  c = vec3(.22, .43, .36)*(.9 + .15*n);
 }
 return c;
}
vec3 baSound(int k) { return k < 4 ? uKind[k] : k == 5 ? uKind[4] : mix(uKind[k & 3], vec3(.8, .72, .6), .5); }
// How much of the sun comes through the window onto the wall.
float baWindow(vec2 p, float so) {
 vec2 q = p*mat2(.914, .407, -.407, .914) - vec2(.02 + .06*baLoop, 0.);
 return baS(-so, so, .41 - abs(q.y))*baS(-so, so, .86 - abs(q.x))*(.2 + .8*baS(.004, .004 + so, abs(q.x - .33) - .012));
}
vec3 baPlates(vec2 p) {
 baK = vec2(.34 + .06*baLoop, -.27 + .04*baLoop)*(.75 + .5*uSpace);
 vec3 sunDir = normalize(vec3(-baK, .8));
 float soft = mix(.016, .006, uTone), win = baWindow(p, soft*3.);
 vec3 sunCol = vec3(1., .9, .75)*(.68 + .14*uLevel), airCol = vec3(.27, .305, .36);
 float h0 = 1.5*baN.x, rake = 1.5*(baN.x - baN.y);
 baSoft = soft*1.5; baTree(p);
 float sh = soft*.5, dark = max(baS(.003 + sh, .003 - sh, baRs)*.55, baS(.001 + sh, 0., baTs)*.2), through = 0.;
 // the things that may shade this place (from 8 on) or be at it, the nearest to us
 float zc = -9., ms = 0., mf = 0., in0 = 0.; int k = -1; vec2 q = vec2(0), at = q;
 for (int j = 0; j < 4; j++) {
  int n = j == 0 ? ba0 : j == 1 ? ba1 : j == 2 ? ba2 : ba3, i = max(n, 0) & 7;
  bool fall = n > 7;
  vec4 C = baC[i], F = baF[i]; if (!fall) F.z *= 1. + .14*C.z;
  vec2 to = p - (fall ? baFall(C.xyz) : baSee(C.xyz)), off = (i == 0 ? .05 : i > 5 ? .2 : i == 5 ? .1 : .03)*F.z*vec2(-F.y, baEye.y*F.x)*(F.x < 0. ? -1. : 1.);
  // the slab it makes, then its face, which is the near side of the slab
  float s = fall ? 1. : clamp(dot(to, off)/max(dot(off, off), 1e-9), -1., 1.), d = baEdge(i, fall ? to : to - off*s, F, fall ? baK : baEye), b = baCov(d);
  if (fall) {
   float e = soft*(.4 + 1.2*max(C.z - baWall, 0.)), m = baS(e, -e, d);
   if (i == 7) { through = m; m *= .85; }
   dark = max(dark, m);
  } else if (n >= 0 && b > 0. && C.z > zc) {
   zc = C.z; ms = b; mf = min(b, baCov(d - (1. - s)*dot(baG, off))); k = i; at = to; in0 = baIn;
   q = baQ - vec2((1. - s)*off.x/(max(abs(F.x), .06)*sign(F.x + 1e-6)*F.z), 0);
  }
  if ((j == 0 ? ba1 : j == 1 ? ba2 : ba3) < 0) break;
 }
 vec2 hp = p - baSee(baC[5].xyz) + vec2(.03, -.01);
 float sun = win*(1. - dark)*(1. + .28*uCue/(1. + 4.*dot(p, p)));
 vec3 light = sunCol*sun*(1. + .16*rake) + (airCol*(1. - .2*p.x) + vec3(.03, .022, .01)*(1. - 2.*p.y))*(1. - .28*dark)*(1. + .06*rake);
 light += sunCol*vec3(.1, .4, .29)*through*win*(1.2 + uKeys);
 light += (baOwn(uKind[4]) + .3)*uHits*.26*exp(-dot(hp, hp)*45.);
 vec3 col = vec3(.72, .685, .63)*(1. + .025*(h0 - .9))*light;
 // the thread and the rod
 float m = baCov(baTd - .0009)*min(1., .0018/baPx);
 col = mix(col, vec3(.16, .13, .1), m);
 vec2 rv = baRb - baRa; float up = dot(p - baRa, vec2(-rv.y, rv.x))/baLen(rv)/.003;
 m = baCov(baRd - .003);
 col = mix(col, vec3(.1, .085, .07)*(.5 + 1.1*baS(-.8, .9, up)) + .2*baS(.45, 0., abs(up - .45))*win, m);
 if (k >= 0) {
  vec4 C = baC[k], F = baF[k]; float f = F.x < 0. ? -1. : 1.;
  vec3 a = baStuff(k, q, in0), own = baOwn(baSound(k));
  vec3 n = normalize(vec3(F.x, 0., F.y)*baBulge.x + vec3(0, baBulge.y, 0) + vec3(-F.y, 0., F.x)*f);
  float in1 = baWindow(baFall(C.xyz) + at, .08), nl = max(dot(n, sunDir), 0.);
  a *= mix(vec3(1), .7 + .7*own, sat(C.w*(.16 + .36*uEnergy)));
  vec3 c = a*(sunCol*1.5*nl*(.15 + .85*in1) + airCol*(.9 + .5*n.y) + vec3(.12, .105, .085)*max(-n.y, 0.));
  float sp = pow(max(dot(n, normalize(vec3(0, -.1, 1) + sunDir)), 0.), baShine.y*(.6 + .8*uTone))*baShine.x;
  c += mix(vec3(1), a*2.2, k == 3 ? .9 : .1)*sp*sunCol*(.25 + .75*in1 + 1.2*uCue);
  // brass mirrors the window in a band that slides as it turns
  if (k == 3) { float u = q.y*.5 + q.x*.45 - 1.6*F.y - .5; c = c*.8 + vec3(.62, .39, .13)*(.75*baS(.42, 0., abs(u)) + .3*baS(.16, .06, abs(u + .7)))*(.75 + .3*uPhrase); }
  if (k == 7) c = mix(c, col*vec3(.55, .95, .8) + vec3(0, .05, .03), .45) + vec3(.07, .12, .1)*baS(-.3, 0., in0) + own*uKeys*.2;
  if (k == 5) c += (own*.5 + .2)*uHits;
  // the cut edge catches the sun
  vec3 edge = a*(airCol*.7 + sunCol*(F.y*f < 0. ? .9 : .15)*in1);
  col = mix(col, mix(edge, c, mf/max(ms, 1e-4)), ms);
 }
 return sat(col);
}
// ---- b: straw
vec4 stT[8];  // where each frame's thread is tied, and its length
vec4 stD[8];  // half its width, its height above and below the waist, how loud
vec2 stA[8];  // its turn
vec2 stSun;
vec3 stSee(vec3 a) { return vec3((a.xy + vec2(0, .13)*a.z)*(1. + .3*a.z), a.z); }
float stTh; int stC0, stC1, stC2;
void stHang(int i, vec3 tie, float len, float w, float h, float turn, float loud) {
 stT[i] = vec4(tie, len); stD[i] = vec4(w, h, h*1.1, loud); stA[i] = baTurn(turn);
 stTh = min(stTh, baDrop(baP - stSee(tie).xy, len));
 vec2 m = abs(baP - stSee(baDown(tie, len + h)).xy); float k = 1.12 + .3*tie.z;
 if (m.x < w*k + .008 && m.x*h*.8 + m.y*w < w*(h*k*1.15 + .012)) { stC2 = stC1; stC1 = stC0; stC0 = i; }
}
void stTree(vec2 p) {
 baP = p; stTh = 9.; stC0 = stC1 = stC2 = -1;
 float all = 2.4*uCue*(1. - uCue), e = .2 + .4*uEnergy;
 // the great frame, one inside it, two at its corners, one under it
 float A = .24 + .2*bW(101., .08) + .5*e*uDrone + all; vec2 c = baTurn(A)*.29;
 vec3 top = vec3(-.15, .42, 0), w = top - vec3(0, .3, 0);
 stHang(0, vec3(-.15, 1.1, 0), .68, .29, .3, A, uDrone);
 stHang(1, top, .17, .11, .12, .5 - A*.7 + .5*bW(57., .3) - e*uPad, uPad);
 stHang(2, w + vec3(c.x, 0, c.y), .05, .065, .075, A + .8*bW(41., 0.) + e*uLow, uLow);
 stHang(3, w - vec3(c.x, 0, c.y), .05, .065, .075, A + .8*bW(51., .6) + e*uMid, uMid);
 stHang(4, top - vec3(0, .63, 0), .035, .05, .06, A*.6 + .6*bW(37., .64), uHits);
 // a second, higher and to the right, and a third, small and far
 float B = .25 + .4*bW(79., .48) + e*uTexture - all;
 stHang(5, vec3(.5, 1.1, -.1), .78, .155, .16, B, uTexture);
 stHang(6, vec3(.5, -.016, -.1), .04, .08, .09, -B + .6*bW(45., .16) + e*uPhrase, max(uPhrase, uKeys));
 stHang(7, vec3(-.66, 1.1, -.3), .86, .085, .09, .4 + .5*bW(63., .4) + all + e*uMic, max(uHigh, uMic));
}
// The nearest straw: how much it covers, its depth, its frame; where it begins and where it goes.
vec3 stM; vec4 stE; float stR;
void stStraw(vec3 a, vec3 b, float id) {
 vec2 v = b.xy - a.xy, w = baP - a.xy;
 float n = inversesqrt(max(dot(v, v), 1e-8)), t = dot(w, v)*n*n, z = mix(a.z, b.z, t), m = baCov(abs(w.x*v.y - w.y*v.x)*n - stR);
 if (m > 0. && t > 0. && t < 1. && z > stM.y - 9.*max(m - stM.x, 0.)) { stM = vec3(m, z, id); stE = vec4(a.xy, v); }
}
// A straw is hollow and lit from behind: amber through its middle, bright along the side that looks at the light.
vec3 stShade(vec2 p, vec3 under) {
 int i = int(stM.z); vec4 D = stD[i]; float r = .0026 + .011*D.x, len = baLen(stE.zw); vec2 v = stE.zw/len, e = p - stE.xy;
 float t = dot(e, v), across = dot(e, vec2(-v.y, v.x)), x = clamp(across/r, -1., 1.), u = min(t, len - t) - min(len*.08, r*1.2);
 vec2 sd = stSun - p; float sl = dot(sd, sd), glow = 1./(1. + 2.6*sl);
 float face = dot(vec2(-v.y, v.x), sd)/sqrt(sl + 1e-4)*x;
 float fib = .5 + .5*sin(5.*x + 2.*sin(t/len*5. + stM.z*50.));
 vec3 c = mix(vec3(.17, .07, .016), vec3(.6, .3, .07), .25 + .6*fib)*(.42 + .95*glow);
 float rim = baS(.1, .95, face) + .35*baS(.6, 1., -face);
 c += vec3(1.3, .8, .33)*rim*(.42 + glow);
 c *= 1. - .5*baS(.004, .001, abs(t - len*(.3 + .35*fract(stM.z*7.7)))) - .4*baS(r*1.5, 0., u);  // a knot, and shade at its ends
 vec3 own = baOwn(uKind[i == 4 ? 4 : i == 5 ? 2 : i == 6 ? 3 : i & 1]);
 c *= 1. + D.w*(.6 + 2.*uEnergy)*(.35 + own*.65);  // it glows in its sound's colour
 float y = p.y - .42 + .66*(1. - uHits);
 if (i == 0) c += vec3(1.3, .85, .42)*uHits*exp(-60.*y*y);  // a hit runs down the great frame
 c = mix(mix(under, c, .75 - .3*uSpace), c, sat(.55 + 2.*stM.y));  // the far ones sink into the air
 float bare = baCov(u);  // bare thread where straws meet
 return mix(under, mix(c, vec3(.1, .06, .04), bare), stM.x*mix(1., baCov(abs(across) - .0012), bare));
}
vec3 baStraw(vec2 p) {
 stSun = vec2(-.42 + .1*baLoop, -.36);
 // the evening sky
 float y = p.y + .5;
 vec3 sky = mix(vec3(.62, .22, .085), vec3(.3, .135, .13), baS(.05, .3, y));
 sky = mix(sky, vec3(.085, .08, .15), baS(.2, .58, y));
 sky = mix(sky, vec3(.014, .024, .062), baS(.45, 1.02, y));
 vec2 sd = (p - stSun)*vec2(.7, 1.2); float sl = dot(sd, sd), glow = exp(-sl*8.);
 sky += vec3(.8, .34, .1)*glow*(.5 + .25*uTone + .4*uLevel + .4*uCue);
 float cl = baS(.42, .72, dot(baN, vec2(.6, .35)))*baS(.08, .25, y)*baS(.85, .35, y);
 sky = mix(sky, sky*.72 + vec3(.34, .11, .08)*exp(-sl*2.) + baOwn(uKind[1])*.18*uPad*uEnergy, cl*.8);
 vec2 hy = p - vec2(-.15, .4 - .62*(1. - uHits));
 sky += vec3(.2, .115, .055)*uHits*exp(-dot(hy, hy)*110.);
 float rid = .085 + .013*sin(p.x*3.1 + 1.) + .006*sin(p.x*7.3), far = .05 + .011*sin(p.x*4.3 + 2.) + .005*sin(p.x*11.) + .009*noise(vec2(p.x*90., 4.));
 sky = mix(sky, sky*.5 + vec3(.06, .03, .035), baS(.003, -.003, y - rid)*.75);
 sky = mix(sky, vec3(.014, .011, .018) + sky*.06, baS(.002, -.002, y - far));
 stTree(p);
 sky = mix(sky, vec3(.05, .035, .04), baCov(stTh - .0008)*min(1., .0016/baPx)*.8);
 stM = vec3(0, -9, 0); stE = vec4(0, 0, 1, 0);
 for (int j = 0; j < 3; j++) {
  int n = j == 0 ? stC0 : j == 1 ? stC1 : stC2, i = max(n, 0);
  vec4 d = stD[i]; vec3 t = baDown(stT[i].xyz, stT[i].w), c = baDown(t, d.y), e = d.x*vec3(stA[i].x, 0, stA[i].y), b = stSee(baDown(c, d.z)), g = stSee(c + e);
  float h = float(i); stR = .0026 + .011*d.x; t = stSee(t);
  for (int s = 0; s < 4; s++) {
   e = vec3(-e.z, 0, e.x); vec3 f = stSee(c + e);
   stStraw(t, g, h); stStraw(g, f, h + .1); stStraw(g, b, h + .2); h += .23;
   if (n < 0 || s > 2) break;
   g = f;
  }
  if ((j == 0 ? stC1 : stC2) < 0) break;
 }
 sky = stShade(p, sky);
 return sky*(1.4 + sky*.35)/(1. + sky*1.4);
}
vec3 render(vec2 p) {
 bool a = uVar < .5; baLoop = sin(TAU*uLoop);
 float k = clamp(1.4*uRes.y/uRes.x, 1., a ? 2.6 : 1.45);  // a tall picture stands further back
 p *= k; if (!a) p += (k - 1.)*vec2(-.29, .5);
 baPx = k/uRes.y;
 // one noise for the two of them: trowelled plaster under a raking light, or thin cloud
 vec2 w = a ? p*mat2(4.21, 4.6, -2.3, 8.42) : vec2(p.x*1.3 + uTravel*.004, p.y*7.);
 baN = vec2(noise(w), noise(a ? w + vec2(-.12, .1) : w*vec2(2.9, 3.1) + 7.));
 vec3 c = sqrt(a ? baPlates(p) : baStraw(p));
 return c*(1.11 - .11*c);
}
