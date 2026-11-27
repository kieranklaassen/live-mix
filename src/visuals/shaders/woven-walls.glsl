// name: Woven walls
// a: Basket half made
// b: Fish trap
// what: Small, inside a great basket still being woven: a coiled cane floor, a wall of light and dark strands rising to a ragged edge, bare uprights against a blue sky with one cloud, the sun in stripes over floor and wall; or inside a long bamboo trap in green water, hoops running to a bright toothed mouth, fish and bubbles.
// follows: The edge rises and sinks with the loop; the piece dyes the strands where it sounds. The drone moves the sun, the pad opens the weave or thickens the beams, texture is dust or bubbles, a phrase winds a bright strand, bands bend uprights or thicken bars. A hit flicks the loose end or scatters fish and runs as light, a cue floods the gaps, keys light crossings.
// own: 0 moonlight at -1, red evening or rust brown water at 1; 1 peeled white cane at -1, dark bark at 1; 2 few broad strands or bars at -1, many fine ones at 1; 3 upright walls or a narrowing trap at -1, a wide bowl or a flaring trap at 1; 4 a low wall just begun, or a long trap, at -1, a high wall, or a short trap with a wide mouth, at 1; 5 low down looking up, or far back, at -1, high up looking down on the floor, or close to the mouth, at 1
// What both share: the way to the sun, the light, the cane, the hour.
vec3 wwL, wwSunC, wwSky, wwCane, wwBark;
float wwPx, wwNight, wwEve, wwN, wwH, wwGap, wwS, wwE;
// What the last look at the weave found: the strand's row, place and thickness, the upright's place and width.
float wwJ, wwF, wwTh, wwDs, wwWs, wwV0, wwV, wwWeave, wwUp, wwIdx;

vec3 wwInk(vec3 c) { return c*c*sqrt(c)*1.15 + .012; }
vec3 wwDye(vec4 c) { return wwInk(c.rgb/max(c.a, .05)); }
float wwIn(float w, float d) { return sat(.5 - d/w); }
vec3 wwHour(vec3 day, vec3 eve, vec3 night) { return mix(mix(day, eve, wwEve), night, wwNight); }
// The way a round rod faces at x across it, -1 to 1: I is towards us, T along its width.
vec3 wwRound(vec3 I, vec3 T, float x) { return normalize(I*sqrt(max(1. - x*x, 0.)) + T*x + 1e-4); }
float wwBell(float x) { return exp(-x*x); }
float wwOff(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
float wwWrap(float a) { return a - TAU*floor(a/TAU + .5); }
// How far to a cone round the y axis from inside it or its wall; r is its radius at y 0, s how it widens.
float wwCone(vec3 o, vec3 d, float r, float s) {
 float R = r + s*o.y, a = dot(d.xz, d.xz) - s*s*d.y*d.y, b = dot(o.xz, d.xz) - s*R*d.y, c = dot(o.xz, o.xz) - R*R;
 float q = b*b - a*c;
 if (q < 0.) return 1e3;
 q = sqrt(q);
 if (b < 0.) return a > 1e-5 ? min((q - b)/a, 1e3) : 1e3;
 return b + q > 1e-5 ? min(max(-c, 0.)/(b + q), 1e3) : 1e3;
}

// The two places where a line meets such a cone; none is the far side of it.
vec2 wwPair(vec3 o, vec3 d, float R, float s) {
 float a = dot(d.xz, d.xz) - s*s*d.y*d.y, b = dot(o.xz, d.xz) - s*R*d.y, q = b*b - a*(dot(o.xz, o.xz) - R*R);
 if (q <= 0. || abs(a) < 1e-5) return vec2(-1.);
 q = sqrt(q);
 return vec2(-b - q, q - b)/a;
}
// The eye: where it looks, and where it sees a place (x, y on the picture, z how far).
vec3 wwEye, wwFwd, wwRgt, wwTop;
float wwLens;
void wwLook(float yaw, float pitch) {
 wwFwd = vec3(sin(yaw)*cos(pitch), sin(pitch), cos(yaw)*cos(pitch));
 wwRgt = vec3(cos(yaw), 0., -sin(yaw)); wwTop = cross(wwFwd, wwRgt);
}
vec3 wwRay(vec2 p) { return normalize(wwFwd*wwLens + wwRgt*p.x + wwTop*p.y); }
vec3 wwProj(vec3 q) { q -= wwEye; float z = dot(q, wwFwd); return vec3(vec2(dot(q, wwRgt), dot(q, wwTop))*wwLens/max(z, .05), z); }

float wwBearing() { return wwWrap(TAU*(uLoop - .42)); }
// The weave of the wall at a round it and y up it, seen w soft: how much is open. 1 is a gap or the sky.
float wwOpen(float a, float y, float w) {
 float R = 1. + wwS*y;
 wwV0 = wwE + .8*sin(a*2.3 + 1.) + .5*sin(a*6.1 + 4.) + .3*sin(a*15. + 2.*sin(a*3.));
 wwV = wwV0 + smoothstep(0., .25, uPhrase*2.4 - abs(wwWrap(a - wwBearing())));
 float v = y/wwH - a/TAU, rise = max(y - wwV0*wwH, 0.);
 wwJ = floor(v); wwF = v - wwJ - .5;
 // an upright: one of sixteen bands bends it where it stands free
 float k = wwN/TAU, i = floor(a*k + .5), hi = hash11(i + 3.);
 wwIdx = i;
 float lean = ((hi - .5)*.25 + uBands[min(int(abs(mod(i + 16., 32.) - 16.)), 15)]*.55*(hi > .5 ? 1. : -1.))*min(rise*rise, .6)/k;
 float tip = (.35 + .6*hash11(i + 140.))*(1. + .3*uSpace);
 wwDs = (a - i/k - lean)*R;
 wwWs = (.075 + .02*hi)/k*(1. - .7*sat(rise/tip)) + .002;
 wwUp = wwIn(w, abs(wwDs) - wwWs)*wwIn(max(w, .004), rise - tip);
 // the strand of this row: thin where there is light between it and the next, tapered at its end
 float st = .5 + .5*cos(a*wwN);
 float live = sat((wwV - wwJ - .5 - a/TAU)*3.);
 float n = noise(vec2(a*2.3 + wwJ*3.7, wwJ*1.37 + .5)), loose = wwOff(0., 7., wwV - wwJ);
 float gap = wwGap*(.1 + 1.6*n*n + .28*loose)*(1. - .55*st*st)*(.7 + .4*smoothstep(0., 1., y));
 wwTh = (.49 - min(gap, .4))*sqrt(live);
 wwF += (n - .5)*.12;
 wwWeave = live > 0. ? mix(wwIn(w, (abs(wwF) - wwTh)*wwH), max(.02 + 2.*wwTh, .1), smoothstep(.5, 1.6, w/wwH)) : 0.;
 return (1. - wwUp)*(1. - wwWeave);
}
// How much sun comes to q: the same weave, looked at from q towards the sun.
float wwSunAt(vec3 q) {
 float t = wwCone(q, wwL, 1., wwS);
 if (t > 20.) return 1.;
 vec3 s = q + wwL*t;
 return mix(wwOpen(atan(s.x, s.z), s.y, .004 + t*mix(.018, .006, uTone)), 1., .5*uCue);
}
vec3 wwOutside(vec3 rd, bool cloud) {
 float y = rd.y;
 vec3 c = mix(vec3(.75, .88, .97), vec3(.2, .46, .84), smoothstep(0., .7, y))*1.4;
 c = mix(c, mix(vec3(1.9, .85, .36), vec3(.45, .36, .55), smoothstep(0., .7, y)), wwEve);
 c = mix(c, mix(vec3(.07, .1, .17), vec3(.015, .025, .06), smoothstep(0., .8, y)), wwNight);
 if (cloud && y > .05) {
  // one cloud
  vec2 q = rd.xz/(y + .35) - vec2(.52 + .1*sin(uTime*.011), 1.02);
  q *= vec2(1., 1.5);
  float m = fbm(q*3.2 + 4. + vec2(uTime*.004, 0.)), d = length(q*vec2(1., 1.4));
  float k = smoothstep(0., .35, m - .1 - 1.1*d*d*1.6);
  vec3 cc = wwHour(vec3(2.6, 2.5, 2.3), vec3(2.3, 1., .55), vec3(.16, .19, .27));
  c = mix(c, cc*(.75 + .4*m), k*.9);
 }
 vec3 land = wwHour(vec3(1.15, 1.05, .45), vec3(1.2, .5, .22), vec3(.05, .07, .11));
 float far = rd.z > 0. ? rd.x/rd.z : 0., wood = .02 + .05*noise(vec2(far*4., 2.5));
 c = mix(c, mix(land*vec3(.25, .4, .35), c, .3), wwOff(-.006, .006, y - wood)*smoothstep(0., .2, rd.z));
 return mix(land*(.8 + .2*smoothstep(-.3, 0., y)), c, smoothstep(-.04, .02, y));
}
vec3 wwBasket(vec2 p) {
 float t0 = uTime;
 wwS = .3 + .45*uOwn[3];
 wwN = 43.*exp2(.6*uOwn[2]); wwH = .044*exp2(-.7*uOwn[2]);
 float yE = 1.02 + .5*uOwn[4];
 wwE = yE/wwH + 3.*(.5 - .5*cos(TAU*uLoop)) - 1.5;
 wwGap = .13 + .1*uPad;
 float el = .35 + .13*uDrone - .14*max(uOwn[0], 0.), az = -1.25 + .05*sin(t0*.017);
 wwL = vec3(sin(az)*cos(el), sin(el), cos(az)*cos(el));
 float ey = .5 + .3*uOwn[5];
 wwEye = vec3(.1, ey, -.86*(1. + wwS*ey));
 wwLens = .72; wwLook(.16*sin(uTravel*.013) + .03*sin(t0*.021) - .1, -.05 - .32*uOwn[5]);
 vec3 rd = wwRay(p);
 vec3 col = vec3(0.);
 float tw = wwCone(wwEye, rd, 1., wwS), tf = rd.y < -1e-4 ? -wwEye.y/rd.y : 1e3;
 vec3 sun = wwSunC*(.85 + .35*uLevel);
 bool onFloor = tf < tw, wall = !onFloor && tw < 20.;
 vec3 q = wwEye + rd*min(min(tw, tf), 20.);
 float a = length(q.xz) > 1e-3 ? atan(q.x, q.z) : 0., px = tw*wwPx, open = wwOpen(a, q.y, px*1.3);
 if (!wall) open = 1.;
 float up = wwUp, weave = wwWeave, f = wwF, th = wwTh, j = wwJ, ds = wwDs, ws = wwWs, ix = wwIdx, v0 = wwV0, v1 = wwV;
 vec3 T = vec3(cos(a), 0., -sin(a)), I = normalize(vec3(-sin(a), wwS, -cos(a)));
 float sh = wwSunAt(onFloor ? q : q + I*.01);
 if (onFloor) {
  // the floor: a coil of split cane on spokes
  float r = length(q.xz), c = wwH*1.05, v = r/c - a/TAU;
  px = tf*wwPx/max(-rd.y, .1); j = floor(v); f = v - j - .5;
  float w = j + .5 + a/TAU, run = PI*c*w*w, ph = (w*c > .5 ? 22.5 : 11.5)*a + PI*j, dsp = cos(ph);
  float near = wwOff(.4, 1.3, px/c);
  float n = noise(vec2(run*7., 1.5));
  vec3 alb = mix(wwCane, wwBark, smoothstep(.45, .75, noise(vec2(w*1.3, 4.5)))*.6)*(.72 + .35*n + .2*(noise(vec2(run*26., f*9.)) - .5)*near);
  vec4 pc = piece(vec2(.5 + a/4.4, .5 - .45*r));
  alb = mix(alb, wwDye(pc)*.7, .35*sat(pc.a)*step(abs(a), 2.2));
  vec3 nn = normalize(vec3(0., 1., 0.) + near*(vec3(sin(a), 0., cos(a))*f*1.5 + T*sin(ph)*.35));
  float ao = mix(.75, (1. - .6*smoothstep(.3, .5, abs(f)))*(.62 + .38*smoothstep(-1., .4, dsp)), near);
  col = alb*ao*(sun*sh*sat(dot(nn, wwL))*1.7 + wwSky*(.55 + .3*nn.z)*(.26 + .49*smoothstep(0., .5, 1. - r)));
 } else {
  if (open < .998) {
   vec3 U = cross(T, I);
   if (U.y < 0.) U = -U;
   float ph = .5*wwN*a + PI*j, dsp = cos(ph), st = .5 + .5*cos(a*wwN);
   float near = wwOff(.35, 1.2, px/wwH);
   float high = sat(q.y/max(yE, .2)), amb = .08 + .36*high*high;
   vec3 bounce = sun*wwCane*(.09 + .05*uCue)*(1.2 - high);
   // the strand
   float s = clamp(f/max(th, .05), -1., 1.);
   vec3 nn = normalize(I + near*(U*s*.85 + T*sin(ph)*.75));
   vec3 alb = mix(wwCane, wwBark, smoothstep(.62, .8, hash11(j + 11.))*.75)*(.7 + .3*hash11(j*1.7) + .4*(noise(vec2(a*34., q.y/wwH*5.)) - .5)*near);
   vec4 pc = piece(vec2(.5 + a/3.6, 1. - .95*high));
   float dye = sat(pc.a*1.5)*(.45 + .55*hash11(j + 5.));
   alb = mix(alb, wwDye(pc)*.8, dye*.92);
   float edge = wwBell(wwWrap(a - wwBearing())*2.6)*wwOff(.6, 2.6, v1 - j - .5 - a/TAU);
   float newS = step(v0 - .5, j + a/TAU)*uPhrase;
   alb = mix(alb, wwInk(uKind[3])*1.1, newS);
   float ao = mix(.75, (1. - .7*smoothstep(.55, 1., abs(s)))*mix(1., .2 + .8*smoothstep(-.9, .6, dsp), st), near);
   vec3 light = sun*sh*sat(dot(nn, wwL))*1.5 + wwSky*amb*(.75 + .45*nn.y) + bounce + sun*sat(-dot(I, wwL))*.2*(1. + uCue);
   vec3 cs = alb*ao*light;
   cs += (alb + .15)*(edge*(.35 + uEnergy) + newS*.4)*(.5 + .5*ao)*mix(1., .4, wwNight);
   cs += (alb*2.5 + .2*uKind[4])*uHits*wwBell(wwWrap(a - .62 + 2.2*(1. - uHits))*2.2)*smoothstep(v1 - 14., v1, q.y/wwH);
   cs += vec3(1., .85, .6)*uKeys*step(.93, hash21(vec2(floor(a*wwN/TAU + .5), j)))*st*st*st*(1. - s*s)*1.5;
   // the upright
   float x = clamp(ds/ws, -1., 1.);
   vec3 nu = wwRound(I, T, x);
   float free = smoothstep(-.5, 1.5, q.y/wwH - v0);
   vec3 au = mix(wwBark, wwCane, .35 + .3*hash11(ix))*(.8 + .3*noise(vec2(ix*3., q.y*9.)));
   vec3 cu = au*(sun*mix(sh, 1., free)*sat(dot(nu, wwL))*1.5 + wwSky*(amb + .4*free)*(.5 + .3*nu.y) + bounce);
   col = mix(cs, cu, sat(up*(1. - smoothstep(-.2, .25, dsp)*weave)/max(1. - open, .01)));
  }
  if (open > .002) {
   vec3 beyond = wwOutside(rd, !wall || q.y > (v0 + 1.)*wwH);
   if (wall && q.y < v0*wwH) beyond *= mix(vec3(1.2), vec3(1.9, 1.6, 1.1), pow(sat(dot(rd, wwL)), 2.))*(1. + 1.2*uCue);
   col = mix(col, beyond, open);
  }
 }
 // dust
 vec2 g = p*18. + vec2(.05, .03)*t0, h = hash22(floor(g));
 float d = length(fract(g) - .2 - .6*h)/18., rad = .0009 + (.001 + .002*uTexture)*h.x, z = .5 + 1.1*h.y;
 vec3 dq = wwEye + rd*z;
 if (d < rad*2.5 && z < min(tw, tf) && q.y < yE) col += (sun*wwSunAt(dq) + wwNight*vec3(1., .7, .2))*wwBell(d/rad)*(.5 + .5*sin(t0*.4 + h.x*40.))*(.1 + 1.2*uTexture);
 // the loose strand: it bends in over the edge, and a hit flicks its end
 float la = .72, flick = 4.*uHits*(1. - uHits), sway = .03*sin(t0*.23) + .02*sin(t0*.37);
 vec3 lI = vec3(-sin(la), 0., -cos(la)), lT = vec3(cos(la), 0., -sin(la)), l0 = -lI*(1. + wwS*yE) + vec3(0., yE - .02, 0.);
 vec3 b0 = wwProj(l0), b1 = wwProj(l0 + lI*.1 + lT*.18 + vec3(0., .38, 0.)), b2 = wwProj(l0 + lI*(.55 + sway) + lT*(.1 + sway) + vec3(0., .5 + .3*flick, 0.)),
  b3 = wwProj(l0 + lI*(.62 + 2.*sway) - lT*(.12 + .35*flick) + vec3(0., -.42 + .35*flick, 0.));
 if (length(p - .5*(b0.xy + b2.xy)) < length(b1.xy - b3.xy) + .05) {
  float best = 1., at = 0., side = 0.;
  vec2 last = b0.xy;
  for (int i = 1; i <= 16; i++) {
   float u = float(i)/16., m = 1. - u;
   vec2 c = m*m*m*b0.xy + 3.*m*m*u*b1.xy + 3.*m*u*u*b2.xy + u*u*u*b3.xy, e = c - last, w = p - last;
   float k = sat(dot(w, e)/max(dot(e, e), 1e-7)), d = length(w - e*k);
   if (d < best) { best = d; at = (float(i) - 1. + k)/16.; side = sign(e.x*w.y - e.y*w.x); }
   last = c;
  }
  float wd = .0135*wwLens/mix(b0.z, b3.z, at)*(1. - .45*at), x = clamp(side*best/wd, -1., 1.);
  vec3 c = wwCane*(sun*(.25 + .75*sat(.5 + .7*x))*.75 + wwSky*.5)*(1. - .5*x*x);
  c += ((.5 + .5*uKind[4])*uHits*2.*at + wwCane*uPhrase*.3)*(1. - x*x);
  col = mix(col, c, wwIn(wwPx, best - wd));
 }
 return screenOf(col*(.95 + .25*uTone));
}

// The trap: here y runs along it and z is up.
float wwR0, wwSt, wwMouthS, wwMouthR, wwEnd, wwFk;
const float WWB = 40., WWZ = .64;
// The wall of the trap at a round it and s along it, seen w soft: how much is open.
float wwBars(float a, float s, float w) {
 float R = wwR0 + wwSt*s, k = WWB/TAU, more = max(uOwn[2], 0.), few = max(-uOwn[2], 0.);
 float i = floor(a*k + .5);
 wwIdx = mod(i + 80., 40.);
 float h = hash11(wwIdx + 5.), bnd = uBands[int(abs(wwIdx - 20.)*.75)], wob = (h - .5)*.3 + .1*sin(s*1.3 + h*40.);
 wwDs = (a - (i + wob)/k)*R;
 float own = mod(wwIdx, 2.) > .5 ? max(1. - 1.25*few, 0.) : 1. + .5*few;
 wwF = abs(fract(s*1.9 + h*7.) - .5);
 wwWs = R/k*(.2 + .07*h + .06*bnd - .05*more)*own + .004*wwOff(0., .06, wwF)*own;
 float bar = own > 0. ? wwIn(w, abs(wwDs) - wwWs) : 0.;
 float gone = wwOff(wwEnd, wwEnd + .02, s);
 if (more > 0.) {
  float e = (a - (floor(a*k) + .5)/k)*R, ew = R/k*.15*more, b2 = wwIn(w, abs(e) - ew);
  if (b2 > bar) { wwDs = e; wwWs = ew; }
  bar = max(bar, b2);
 }
 wwUp = bar*gone;
 // twining
 float j = floor(s/WWZ), hz = (s/WWZ - j - .5)*WWZ;
 wwJ = floor(hz/.034 + .5); wwTh = (hz/.034 - wwJ)*2.;
 wwWeave = wwIn(w, abs(hz) - .119)*wwIn(w, (abs(wwTh) - .94)*.017)*gone;
 wwV = cos(.5*WWB*a + PI*(wwJ + j));
 return (1. - wwUp)*(1. - wwWeave);
}
// How much sun comes through the wall t away from q.
float wwThrough(vec3 q, float t) {
 vec3 s = q + wwL*t;
 return wwBars(atan(s.x, s.z), s.y, .01 + t*mix(.03, .012, uTone));
}
float wwTrapSun(vec3 q) {
 float t = wwPair(q, wwL, wwR0 + wwSt*q.y, wwSt).y;
 return t > 0. ? mix(wwThrough(q, t), 1., .3*uCue) : 1.;
}
// The broad beams that stand in the water.
float wwBeam(vec3 q) {
 vec2 u = q.xy - wwL.xy/wwL.z*q.z;
 float b = .5 + .25*sin(u.x*11. + .1*uTime) + .25*sin(u.x*23. + 2.);
 return b*b*(.3 + .7*smoothstep(.1, .25, abs(fract(u.y/WWZ) - .5)));
}
vec3 wwDay, wwBright;
vec3 wwWater(vec3 rd) {
 float u = rd.z*.5 + .5, sp = sat(dot(rd, wwL));
 vec3 c = mix(vec3(.008, .03, .022), vec3(.045, .16, .09), smoothstep(.1, .6, u));
 c = mix(c, vec3(.62, .86, .42), smoothstep(.6, 1., u)*.75) + vec3(.9, 1., .5)*pow(sp, 10.)*(.6 + .6*uLow + uCue);
 c = mix(c, c.ggg*vec3(1.35, .72, .25), .9*wwEve);
 return mix(c, c*vec3(.06, .16, .3)*1.2, wwNight);
}
float wwNet(vec2 x) {
 x += .35*sin(x.yx*1.7 + vec2(uTime*.31, -uTime*.27));
 float n = abs(sin(x.x*2.1 + sin(x.y*1.9 + uTime*.23)))*abs(sin(x.y*2.3 + sin(x.x*1.6 - uTime*.29)));
 return pow(1. - n, 5.);
}
vec3 wwBed(vec3 q, vec3 sun) {
 vec2 x = q.xy*2.2, g = floor(x), f = x - g;
 float d1 = 9., d2 = 9., id = 0.; vec2 off = vec2(0.);
 for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
  vec2 o = vec2(i, j), h = hash22(g + o), r = o + .15 + .7*h - f;
  float d = dot(r, r)*(.8 + .8*h.y);
  if (d < d1) { d2 = d1; d1 = d; id = h.x; off = r; } else if (d < d2) d2 = d;
 }
 float rd = smoothstep(.02, .5, sqrt(d2) - sqrt(d1));
 vec3 n = normalize(vec3(-off*(1.1 - .4*rd), .75));
 vec3 alb = mix(vec3(.2, .22, .17), mix(vec3(.42, .36, .25), vec3(.3, .34, .32), step(.6, id)), smoothstep(.1, .6, id))*(.6 + .7*noise(q.xy*13.));
 vec4 pc = piece(vec2(q.y/4.2, .5 + q.x*.2));
 alb = mix(alb, wwDye(pc)*.6, .6*sat(pc.a*1.3));
 vec2 t = wwPair(q, wwL, wwR0 + wwSt*q.y, wwSt);
 float sh = t.y > 0. ? mix(wwThrough(q, t.x)*wwThrough(q, t.y), 1., .3*uCue) : 1.;
 return alb*(.15 + .85*rd)*(sun*sh*sat(dot(n, wwL))*(.75 + 1.3*wwNet(q.xy*1.6)) + wwDay*.22);
}
vec3 wwTrap(vec2 p) {
 float t0 = uTime;
 wwSt = .16*uOwn[3]; wwR0 = 1. - .1*uOwn[3];
 wwEnd = 3.1*exp2(-.55*uOwn[4]); wwMouthS = wwEnd - 1.05; wwMouthR = .27 + .12*uOwn[4];
 wwFk = (wwR0 + wwSt*wwEnd - wwMouthR)/(wwEnd - wwMouthS);
 wwL = normalize(vec3(-.5 + .3*uDrone, .25 + .05*sin(t0*.019) + .12*uDrone, .95));
 vec3 sun = wwSunC*vec3(.85, 1.05, .65)*(.9 + .4*uLevel + .5*uCue);
 vec3 eye = vec3(.22 + .03*sin(t0*.023), .05 + .58*uOwn[5], .1 + .05*sin(t0*.031) - .5*uOwn[5]*abs(uOwn[5]));
 wwEye = eye; wwLens = .6; wwLook(.2 + .06*sin(uTravel*.011), .25*uOwn[5] - .14);
 wwFwd = wwFwd.xzy; wwRgt = wwRgt.xzy; wwTop = wwTop.xzy;
 vec2 pr = rot(.1 + .02*sin(t0*.027))*p;
 vec3 rd = wwRay(pr);
 vec3 water = wwWater(rd), col = water;
 wwDay = wwWater(vec3(0., 0., 1.)); wwBright = wwWater(wwL);
 float fogk = .13*(1. + .6*uSpace);
 float tw = wwCone(eye, rd, wwR0, wwSt);
 // the wall
 float open = 1.;
 if (tw < 30.) {
  vec3 q = eye + rd*tw;
  float a = length(q.xz) > 1e-3 ? atan(q.x, q.z) : 0., px = tw*wwPx/.6;
  open = wwBars(a, q.y, px*1.3);
  float upm = wwUp, we = wwWeave, ds = wwDs, ws = wwWs, idx = wwIdx, knot = wwF, v = wwTh, dsp = wwV, ring = floor(q.y/WWZ), row = wwJ;
  if (open < .998) {
   vec3 T = vec3(cos(a), 0., -sin(a)), I = -vec3(sin(a), 0., cos(a));
   float sh = dot(I, wwL) > -.5 ? wwTrapSun(q + I*.03) : 0., go = q.y - .5 - (wwEnd - .8)*uHits;
   float x = clamp(ds/max(ws, 1e-3), -1., 1.), hb = hash11(idx + 9.);
   vec3 n = wwRound(I, T, x);
   vec3 alb = mix(wwCane, wwBark, hb*.6)*vec3(.85, 1.05, .8)*(.75 + .35*noise(vec2(q.y*5., idx*3.1)))*mix(.5, 1., smoothstep(0., .05, knot));
   float net = .65 + (.6 + .7*uTexture)*wwNet(vec2(a*1.6, q.y*2.6));
   vec3 amb = wwDay*(.02 + .15*sat(n.z)) + water*.08;
   vec3 c = alb*(sun*sh*sat(dot(n, wwL))*net*1.7 + amb) + alb*wwBright*pow(abs(x), 4.)*sat(.16 - .24*I.z);
   // the twining over it
   float st = cos(WWB*a)*.5 + .5;
   vec3 nw = normalize(I + vec3(0., v*.8, 0.) + T*.5*sin(.5*WWB*a + PI*(row + ring)));
   vec4 pc = piece(vec2(q.y/wwEnd, .5 + a/TAU*.96));
   vec3 wa = mix(wwBark*1.3, wwCane*1.35, .55 + .35*hash11(ring + row))*vec3(1., .98, .75);
   wa = mix(wa, wwDye(pc)*.8, .6*sat(pc.a*1.4))*(.7 + .5*noise(vec2(a*30., v*3. + row*5.)));
   float ao = (1. - .55*v*v)*mix(1., .45 + .55*smoothstep(-.8, .5, dsp), st);
   vec3 cw = wa*ao*(sun*sh*sat(dot(nw, wwL))*net*1.7 + amb);
   float near = wwBell(wwWrap(a - TAU*uLoop)*2.2);
   cw += (wa + .1)*ao*near*(.1 + .4*uEnergy)*(1. + pc.a)*mix(1., .4, wwNight);
   cw += wwInk(uKind[3])*ao*uPhrase*.7*wwOff(0., .2, abs(q.y - WWZ*2.5))*smoothstep(0., .3, uPhrase*3.2 - abs(wwWrap(a - TAU*uLoop)));
   c += alb*(sun + 2.*uKind[4])*uHits*exp(-go*go*14.)*(1. - .8*x*x);
   cw += vec3(.9, 1., .6)*uKeys*step(.8, hash21(vec2(idx, ring*3. + row)))*st*st*(1. - v*v);
   vec3 wall = mix(c, cw, sat(we*smoothstep(-.25, .25, dsp + 2. - 2.*upm)/max(1. - open, .01)));
   col = mix(water, wall, exp(-tw*fogk));
  }
 }
 // the bed of the river, between the bars
 if (open > .002) {
  float tb = (eye.z + 1.45)/max(-rd.z, .02), near = exp(-tb*fogk*1.3)*wwOff(6., 9., tb);
  col = mix(col, near > 0. ? mix(water, wwBed(eye + rd*tb, sun), near) : water, open);
 }
 // the funnel of slats that points in, and its mouth
 {
  vec3 o = eye - vec3(0., wwMouthS, 0.);
  vec2 h2 = wwPair(o, rd, wwMouthR + wwFk*o.y, wwFk), hs = o.y + rd.y*h2;
  float t = 1e3, len = wwEnd - wwMouthS, low = max(-.1, .02 - wwMouthR/wwFk);
  if (h2.x > 0. && hs.x > low && hs.x < len) t = h2.x;
  if (h2.y > 0. && h2.y < t && hs.y > low && hs.y < len) t = h2.y;
  // the bright water beyond the mouth
  float ax = (wwEnd - eye.y)/max(rd.y, .05);
  vec2 far = eye.xz + rd.xz*ax;
  float lit = exp(-dot(far, far)*.9);
  vec3 glow = vec3(.5, .8, .36)*(1.1 + .5*uMid + .8*uCue)*wwHour(vec3(1.), vec3(1.4, .7, .3), vec3(.1, .2, .36));
  float beyond = wwOff(-.02, .02, length(far) - wwR0 - wwSt*wwEnd);
  if (tw > ax && rd.y > .05) col = mix(col, glow*(.25 + .95*lit), beyond);
  if (t < tw) {
   vec3 q = eye + rd*t;
   float s = q.y - wwMouthS, ang = length(q.xz) > 1e-3 ? atan(q.x, q.z) : 0., r = wwMouthR + wwFk*s;
   float k = 26./TAU, i = floor(ang*k + .5), h = hash11(mod(i + 52., 26.) + 21.);
   float e = (ang - (i + .25*(h - .5))/k)*r, tipS = -.07 + .55*h*h;
   float w = r/k*mix(.2, .4, smoothstep(0., .9, s))*smoothstep(tipS - .02, tipS + .16, s), px = t*wwPx/.6;
   float tie = wwIn(px, abs(s - .62) - .022), cov = max(wwIn(px*1.4, abs(e) - w)*step(.0005, w), tie);
   vec3 T = vec3(cos(ang), 0., -sin(ang)), O = normalize(vec3(sin(ang), -wwFk, cos(ang)));
   float x = clamp(e/max(w, 1e-3), -1., 1.);
   vec3 n = wwRound(O, T, x);
   float sh = wwTrapSun(q);
   vec3 alb = mix(wwCane*1.1, wwBark, h*.35 + .5*tie)*vec3(.9, 1., .75)*(.75 + .4*noise(vec2(s*14., i*2.3)));
   vec3 cc = alb*(sun*sh*sat(dot(n, wwL))*1.2 + wwDay*(.12 + .22*sat(n.z)) + glow*(.1 + .5*wwOff(0., .5, s)));
   vec3 behind = glow*(.25 + .95*lit)*mix(1., .35, smoothstep(.2, .9, s));
   col = mix(behind, mix(water, cc, exp(-t*fogk)), cov);
   tw = t;
  }
 }
 // beams
 float beam = 0.;
 for (int i = 0; i < 2; i++) {
  float t = .6 + .9*float(i);
  vec3 q = eye + rd*t;
  beam += smoothstep(0., .12, tw - t)*exp(-t*.35)*wwBeam(q)*wwOff(.3, 1.1, length(q.xz));
 }
 col += sun*vec3(.45, .75, .35)*beam*(.03 + .04*uPad + .06*uCue);
 // fish
 float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, 0.);
 for (int i = 0; i < 5; i++) {
  float fi = float(i), h = hash11(fi + 2.), h2 = hash11(fi + 31.), th = t0*(.09 + .07*h) + h*TAU + .5*sin(t0*.13 + fi);
  vec3 fc = vec3(.2*h2 - .1 + .45*cos(th)*(.6 + .5*h2), (.95 + .75*h2 + .2*sin(th))*min(wwEnd*.33, 1.2), -.06 + .5*(h - .5) + .06*sin(th + h2*6.));
  fc.xz += vec2(cos(fi*2.4), sin(fi*2.4))*.88*uHits*(1. - uHits);
  vec3 c = wwProj(fc); float z = c.z;
  float sc = .6/max(z, .1)*(.11 + .05*h), face = -sin(th);
  vec2 x = (pr - c.xy)/sc; x.x /= (.35 + .65*abs(face))*(face < 0. ? -1. : 1.);
  if (abs(x.x) > 1.6 || abs(x.y) > .8 || z > tw) continue;
  x.y += .06*sin(x.x*2.6 + t0*3.1 + fi*2.)*(1. - x.x)*.5;
  float u = sat((x.x + 1.)*.5), body = .52*pow(u, .6)*sqrt(1. - u) - abs(x.y) - max(abs(x.x) - 1., 0.);
  float tl = sat((-.78 - x.x)/.4), tail = min(.05 + .26*tl - abs(x.y), x.x + 1.06 + .4*abs(x.y)) - step(-.78, x.x);
  float dd = max(body, (tail + .04)*abs(face) - .04), cov = sat(.5 + dd*sc/wwPx);
  if (cov <= 0.) continue;
  float lvl = i < 3 ? 1. : smoothstep(.02, .3, lv[i % 5]);
  vec3 fcol = mix(vec3(.05, .08, .05), mix(vec3(.55, .62, .5), wwInk(uKind[i % 5]) + .1, .55), wwOff(-.05, .2, x.y));
  fcol *= sun*(.15 + .7*wwBeam(fc) + 1.6*uHits)*(1. - .3*wwOff(-.2, .12, x.y)) + wwDay*.3;
  fcol *= 1. - sat(.5 - (length(x - vec2(.68, .05)) - .065*abs(face))*sc/wwPx);
  col = mix(col, mix(water, fcol, exp(-z*fogk)), cov*lvl);
 }
 // bubbles
 for (int i = 0; i < 8; i++) {
  float fi = float(i), h = hash11(fi*3.3 + 1.), h2 = hash11(fi + 77.), u = fract(t0*(.035 + .03*h) + h2);
  float a = (i < 5 ? -1. : 1.)*(2.6 - 1.9*u);
  vec3 b = vec3(sin(a)*.93 + .02*sin(t0*1.3 + fi), .6 + 1.6*h, cos(a)*.93);
  vec3 c = wwProj(b);
  float z = max(c.z, .15), rad = (.01 + .014*h2)*.6/z, r = length(pr - c.xy)/rad;
  if (r > 1.3 || c.z < .15) continue;
  float fade = smoothstep(0., .1, u)*wwOff(.85, 1., u)*(i % 3 == 0 ? .8 : smoothstep(.02, .3, uTexture)), in_ = sat(.5 + (1. - r)*rad/wwPx);
  vec2 e = (pr - c.xy)/rad - vec2(-.3, .35);
  vec3 bc = wwBright*(.1 + .7*pow(sat(r), 4.)) + vec3(1.2)*exp(-dot(e, e)*14.)*mix(1., .3, wwNight);
  col = mix(col, col*.7 + bc, in_*fade);
 }
 return screenOf(col*(1.05 + .3*uTone + .15*uMic));
}

vec3 render(vec2 p) {
 wwPx = 1./uRes.y;
 wwNight = max(-uOwn[0], 0.); wwEve = max(uOwn[0], 0.);
 wwSunC = wwHour(vec3(2.6, 2.2, 1.55), vec3(2.9, 1.15, .4), vec3(.42, .56, .85));
 wwSky = wwHour(vec3(.42, .5, .6), vec3(.42, .28, .36), vec3(.045, .065, .12));
 float pale = max(-uOwn[1], 0.), dark = max(uOwn[1], 0.);
 wwCane = mix(mix(vec3(.6, .37, .14), vec3(.8, .77, .7), pale), vec3(.2, .1, .07), dark);
 wwBark = mix(mix(vec3(.3, .15, .07), vec3(.5, .46, .4), pale), vec3(.07, .05, .05), dark);
 vec3 c = vec3(0.);
 if (uVar < .5) c = wwBasket(p);
 if (uVar >= .5) c = wwTrap(p);
 return c;
}
