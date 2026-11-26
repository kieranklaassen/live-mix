// name: Lake ice
// a: Bubble stacks
// b: Skate marks
// what: Clear bottle-green lake ice looked down into, with stacks of flat white bubbles frozen one under another, cracks that are pale walls going down, fine pearls, and dry snow drifted over one side; or grey evening ice from higher up, crossed by long skate strokes of fine white powder, one lantern low over it and a reed edge.
// follows: Each kind swells and whitens the bubbles at its own depth, or its own strokes; the piece says which stacks are full, or where powder is bright. The mix is the daylight or the lamp, bands brighten single bubbles or strokes. A hit runs a hairline crack or throws powder; a cue lights one long crack, or the lamp and one stroke. The loop skates a circle.
float liPx, liHit; // a pixel, and a hit that is no cue
// A smooth step that may also run downward.
float liS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float liLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : uPhrase; }
vec3 liHue(int k) { vec3 c = uKind[k]; return c * c * .9 + c * .25 + .05; }
float liH(float n) { n = fract(n * .1031 + .37); n *= n + 33.33; n *= n + n; return fract(n); }
vec2 liUV(vec2 w) { return vec2(w.x / 1.78 + .5, .5 - w.y); }
// A jagged line: straight runs between hashed heights. x is its height, y its slope.
vec2 liJag(float s, float seed) {
 float i = floor(s), f = s - i, a = liH(i + seed), b = liH(i + 1. + seed);
 return vec2(mix(a, b, f), b - a);
}
// ---------- a: looking down into the ice ----------
const vec3 LI_AB = vec3(3.4, .62, .8); // what a depth of one takes out of the light
const vec2 LI_VP = vec2(.1, -.8); // the place under your feet, where every upright line leads
vec2 liCam; float liDeep; // where the eye is, and how deep the stacks go
// What is seen of a colour so deep in the ice.
vec3 liDepth(vec3 c, float z) { return mix(vec3(.002, .026, .026), c, exp(-z * 1.1)) * exp(-z * LI_AB); }
// The stacks of flat bubbles, far ones first: where each stands, its width, its seed.
const vec4 LI_S[8] = vec4[8](vec4(-.2, .33, .075, 5.), vec4(1.02, .3, .1, 9.), vec4(.53, .24, .11, 12.), vec4(.2, .18, .05, 14.), vec4(-.02, .02, .135, 18.), vec4(.78, -.02, .085, 21.), vec4(-.36, -.16, .08, 24.), vec4(.36, -.14, .07, 27.));
vec3 liStack(vec3 col, vec2 p, vec4 st, float fine) {
 float R = st.z, seed = st.w, K = 1. / 1.02 - 1. / (1. + liDeep);
 vec2 d0 = st.xy - liCam - LI_VP, top = LI_VP + d0 / 1.02, ax = -d0 * K;
 float al = length(ax), along = dot(p - top, ax) / (al * al), reach = R * 1.2 / al;
 float far = length(p - top - ax * sat(along));
 if (far < R * 1.4) {
  vec4 pc = piece(clamp(liUV(st.xy), .03, .97));
  float on = sat((R > .1 ? .65 : .12) + .9 * pc.a);
  vec3 ph = pc.rgb / max(pc.a, .05);
  // only the bubbles that can reach this place
  vec2 zz = 1. / (1. / 1.02 - sat(along + vec2(reach, -reach)) * K) - 1.;
  vec2 kk = clamp(8. * (1. - (zz - .015) / (.96 * liDeep)) + vec2(-.7, .7), .0, 7.);
  int k1 = int(kk.y);
  for (int k = int(kk.x); k <= k1; k++) {
   float fk = float(k), h = liH(seed + fk * 1.7), h2 = liH(seed * 1.3 + fk * 2.9 + 5.);
   int kind = k / 2; float lv = liLv(kind);
   float z = liDeep * (1. - (fk + .35 * h) / 8.) * .96 + .015;
   vec2 c = LI_VP + (d0 + (vec2(h, h2) - .5) * R * .55) / (1. + z);
   float swell = .62 + .2 * on + .26 * lv * on;
   float r = R * (.45 + .35 * h2 + .3 * sin(.36 * fk + .55)) * swell / (1. + z);
   vec2 q = (p - c) / r; q.y *= 1.3;
   float d = length(q);
   if (d < 1.4) {
    float white = .2 + .35 * on + lv * (.25 + .75 * on) * (.45 + .55 * uEnergy) + .35 * uBands[k * 2] * on;
    d += .3 * (noise(q * 1.6 + seed * 7. + fk * 3.) - .5);
    float aa = 1.6 * liPx / r;
    // the dark it throws on what lies below
    col *= 1. - .5 * liS(1.2, .75, length(q + vec2(.16, .22))) * (.5 + .5 * on);
    float m = liS(1. + aa, 1. - aa, d);
    float side = dot(q, vec2(.62, .78));
    float frost = noise(q * 3.2 + seed + fk * 11.);
    float thin = liS(.62, .3, frost) * liS(.95, .3, d);
    float body = (.77 + .15 * sin(d * 13. + frost * 6.) + .2 * fine) * (1. - (.8 - .2 * white) * thin);
    float rim = liS(.1 + aa, .0, abs(d - .93));
    float lens = liS(.1, .0, abs(d - .7)) * liS(.3, .7, side);
    float alpha = m * sat(body * (.5 + .6 * white) + rim * .35 + lens * .4);
    vec3 tint = mix(vec3(.86, .97, 1.), liHue(kind) * 1.8, .28 * lv);
    tint = mix(tint, ph, .2 * sat(pc.a));
    float light = (.3 + .75 * white) * (.7 + .45 * side) * (.75 + .35 * fine) + rim * (.15 + .45 * sat(.3 + side)) + lens * (.5 + .7 * uTone);
    col = mix(col, liDepth(tint * light * 1.5, z), alpha);
   }
  }
 }
 return col;
}
// A crack is a wall going down from a jagged line. lit is how much light stands in it.
vec3 liCrack(vec3 col, vec2 p, vec2 at, vec2 e, float seed, float depth, float slant, float from, float to, float lit) {
 vec2 n = vec2(-e.y, e.x), w = p + liCam - at, v = p - LI_VP;
 float s0 = dot(w, e), g = dot(w, n);
 float rate = dot(v, n) + slant; rate = rate < .0 ? min(rate, -.06) : max(rate, .06);
#define LIW(s) (.11 * (liJag((s) * 2.3, seed).x - .5) + .035 * (liJag((s) * 8., seed + 40.).x - .5))
 float w0 = LIW(s0);
 float z = (w0 - g) / rate;
 if (z > -.02 && z < depth + .25) {
  float s = s0 + z * dot(v, e);
  z = (LIW(s) - g) / rate; s = s0 + z * dot(v, e);
  float ends = liS(from, from + .25, s) * liS(to, to - .25, s);
  float face = liJag(s * 8., seed + 40.).y * .5 + liJag(s * 2.3, seed).y * .4;
  float f1 = s * 11. + 1.5 * z, i1 = floor(f1), e1 = liS(.0, .05, f1 - i1);
  float fac = mix(liH(i1 - 1. + seed), liH(i1 + seed), e1); // each flat piece of the wall has its own light
  float D = depth * (.35 + .65 * fac) * ends;
  if (z > .0 && z < D) {
   float t = z / max(D, .001);
   float comb = noise(vec2(s * 75. + z * 30., z * 3. + seed)), bow = noise(vec2(s * 5., 34. * z + 7. * sin(s * 7. + seed)));
   float fade = exp(-2.6 * t);
   float a = (.12 + .5 * fac * fac + .5 * face) * fade;
   a += .35 * liS(.5, .95, comb) * fade * (.3 + fac) + .22 * liS(.6, .85, bow) * (1. - t) * (.3 + comb);
   a = max(a, .0) + .3 * exp(-z * 170.);
   a *= liS(1., .6, t) * (.8 + .9 * lit);
   col = mix(col, max(col, liDepth(vec3(.7, 1., 1.03) * (1.3 + 1.1 * lit), z)), min(a, .92));
  }
 }
 if (abs(g - w0) < 5. * liPx) {
  float ragged = liJag(s0 * 24., seed + 5.).x, away = abs(g - w0) / liPx;
  float line = liS(1.5, .2, away / (.7 + 2.2 * ragged * ragged)) * (.55 + .45 * ragged);
  float es = liS(from, from + .1, s0) * liS(to, to - .1, s0);
  col = mix(col, vec3(1.5, 1.7, 1.75) * (.8 + lit), line * es);
 }
 return col;
}
// A hairline on the face of the ice, from at along e for a length; returns how white it is, y how far along.
vec2 liHair(vec2 p, vec2 at, vec2 e, float seed, float len, float wide) {
 vec2 w = p + liCam - at;
 float s = dot(w, e), g = dot(w, vec2(-e.y, e.x));
 vec2 o = vec2(.0);
 if (s > .0 && s < len && abs(g) < .05) {
  float wob = (.05 * (liJag(s * 5. + .5, seed).x - .5) + .02 * (liJag(s * 17., seed + 9.).x - .5)) * liS(.0, .1, s);
  o = vec2(liS(1.4, .2, abs(g - wob) / (liPx * wide)) * liS(.0, .01, s) * liS(len, len * .6, s), s / len);
 }
 return o;
}
// The snow's height.
float liDrift(vec2 w) {
 vec2 r = rot(.55) * w;
 float big = noise(r * vec2(2.4, 4.2) + 4.), rip = noise(r * vec2(4., 15.) + vec2(2., 3.) * big);
 return .55 * big + .16 * rip + .03 * noise(r * vec2(16., 29.) + 3. * rip);
}
vec3 liDown(vec2 p) {
 liCam = vec2(.07 * sin(uTravel * .023), .05 * sin(uTravel * .017 + 1.)) + vec2(.006 * sin(uTime * .11), .005 * cos(uTime * .087));
 liDeep = .62 + .3 * uSpace;
 // the body of the ice: pale under the sky, bottle green where it is deep
 vec2 w1 = p + liCam, w2 = LI_VP + liCam + (p - LI_VP) * 1.35, w3 = LI_VP + liCam + (p - LI_VP) * 1.8;
 float m2 = noise(w2 * 2.1 + 7.) * .65 + noise(w2 * 5.3) * .35, m3 = noise(w3 * 1.5 + 3.);
 vec2 sd = p - vec2(.62, .5);
 float sun = exp(-dot(sd, sd) * 2.4);
 vec3 col = vec3(.0004, .006, .0058) + vec3(.0006, .018, .014) * liS(.35, .8, m3) * (.5 + .6 * uLow);
 col += liHue(0) * uDrone * .05 * liS(.2, .8, m3);
 col += vec3(.002, .105, .105) * (sun * 1.5 + .1 * liS(.45, .85, m2)) * (.5 + .7 * uLevel);
 // pearls
 for (int k = 0; k < 2; k++) {
  float fk = float(k), z = .55 - .22 * fk, cell = .016 + .008 * fk;
  vec2 w = LI_VP + liCam + (p - LI_VP) * (1. + z), g = rot(.4 + fk) * w / cell, id = floor(g);
  vec2 h = hash22(id + fk * 17.);
  float some = step(1.02 - .75 * liS(.55, .85, noise(id * cell * 5. + fk * 9.)), h.x);
  float r = (.05 + .17 * h.y * h.y * h.y) * some;
  vec2 q = fract(g) - .5 - (h.yx - .5) * .4;
  float d = length(q) / max(r, .001), aa = liPx * (1. + z) / cell / max(r, .01);
  float dot_ = liS(1. + aa, 1. - aa, d) * step(.001, r);
  col = mix(col, liDepth(vec3(.8, .95, 1.) * (.6 + 1.2 * uKeys + .5 * uHigh), z), dot_ * (.35 + .4 * h.y));
 }
 col = liCrack(col, p, vec2(.62, -.3), vec2(.97, .2431), 30., .2, .2, -1.4, .9, .1 + .4 * uLow);
 float fine = noise(w2 * 110.);
 for (int i = 0; i < 8; i++) col = liStack(col, p, LI_S[i], fine);
 float lit = .15 + .25 * uLevel + 1.3 * uCue;
 col = liCrack(col, p, vec2(.0, .14), vec2(.8575, .5145), 3., .4, .2, -1.1, 1.3, lit);
 col = liCrack(col, p, vec2(.33, .34), vec2(.47, -.8827), 63., .5, .05, .02, 1.2, .1 + .2 * uMid);
 // hairlines; a hit opens one beside the great stack, which heals
 float hair = .5 * liHair(p, vec2(.33, .3), vec2(.9701, -.2425), 4., .75, .8).x;
 hair += .4 * liHair(p, vec2(.47, .04), vec2(-.6402, -.7682), 19., .6, .7).x;
 col = mix(col, vec3(.5, .75, .78), hair * .6);
 if (liHit > .002) {
  float run = .0, at = .3 + .9 * (1. - liHit);
  for (int k = 0; k < 3; k++) {
   float fk = float(k), a = fk - 1.4 + .3 * sin(uTime * .017 + fk * 2.3) + .3 * sin(uTime * .011);
   vec2 hb = liHair(p, vec2(.075, .0), vec2(cos(a), sin(a)), 23. + fk * 7., .34 + .07 * fk, 1. + .7 * liHit);
   run += hb.x * liS(at, at - .12, hb.y * (1. + .2 * fk));
  }
  vec2 hv = p + liCam - vec2(.075, .0);
  col += vec3(.5, .75, .8) * liHit * exp(-dot(hv, hv) * 160.) * .8;
  col = mix(col, vec3(1.6, 1.75, 1.8) * (.7 + .5 * liHit), sat(run) * sat(liHit * 1.6));
 }
 col += vec3(.16, .24, .26) * sun * sun * (.12 + .25 * uLevel);
 // snow
 float edge = -.3 + .5 * p.y - w1.x;
 vec3 day = mix(vec3(.5, .62, .8), vec3(1.5, 1.3, 1.08), sat(.2 + .8 * uLevel)) * (.85 + .3 * uTone);
 if (edge > -.3) {
  float e = .01, h0 = liDrift(w1), shown = liS(-.3, -.18, edge);
  float thick = edge * 2.2 + (h0 - .42) * 1.3;
  float grain = hash21(floor((w1 + 3.) * 420.)), wisp = noise(rot(.75) * w1 * vec2(5., 44.) + 2. * h0);
  float cover = liS(-.02, .16, thick + .12 * (wisp - .5) + .03 * (grain - .5));
  cover = max(cover, .42 * liS(-.5, .0, thick) * liS(.5, .95, wisp) * (.7 + .5 * grain)) * shown;
  vec2 sl = vec2(liDrift(w1 + vec2(e, .0)) - h0, liDrift(w1 + vec2(.0, e)) - h0) / e * .48;
  sl.x -= .45 * liS(.3, .0, thick);
  float rake = sat(.36 - dot(sl, vec2(.85, .5)) * .6);
  vec3 snow = vec3(.1, .17, .27) * (.7 + .5 * h0) + day * rake * (.5 + rake) * 1.2;
  col = mix(col, snow * (.9 + .2 * grain), cover);
 }
 return col;
}
// ---------- b: the skated ice ----------
// each long stroke: a place on it and its way there; then its bend and its length to each side
const vec4 LI_A[14] = vec4[14](vec4(.05, .02, .877, .479), vec4(-.20, .30, .939, -.342), vec4(.30, .35, -.801, .598), vec4(-.10, -.22, .988, .149), vec4(.45, .10, -.323, .946), vec4(-.45, .15, .540, .841), vec4(.00, .55, .995, .099), vec4(.15, -.10, -.924, .381), vec4(-.35, .60, .696, -.717), vec4(.70, .50, -.588, .808), vec4(.10, .18, .315, .949), vec4(.35, -.25, .581, .813), vec4(.50, .85, .980, -.198), vec4(-.15, .08, .988, -.149));
const vec3 LI_B[14] = vec3[14](vec3(1.5, .95, .806), vec3(1.1, .8, .747), vec3(-.9, .8, .630), vec3(-.8, .5, .811), vec3(.75, .6, .696), vec3(-1.3, .8, .816), vec3(2.2, .9, .917), vec3(1.7, .8, .891), vec3(.8, .5, .811), vec3(1.4, .7, .877), vec3(-.55, .6, .461), vec3(1., .4, .921), vec3(1.2, .6, .877), vec3(.6, .55, .608));
// How near a stroke is to w: small when its powder may lie here.
float liNear(vec2 w, vec4 a, vec3 b) {
 vec2 n = vec2(-a.w, a.z), v = w - a.xy - b.x * n;
 float r = length(v), d = r - abs(b.x);
 return (d > .0 ? d : -2.5 * d) + step(-sign(b.x) * dot(v, n), b.z * r) * 9.;
}
// The powder of one stroke at w. x how much, y how far along (0 to 1), z which way its bank faces the lamp.
vec3 liMark(vec2 w, vec4 a, vec3 b, float px, float seed, vec2 toLamp, float g) {
 vec2 c = a.xy + b.x * vec2(-a.w, a.z), v = w - c;
 float R = abs(b.x), r = length(v), d = r - R;
 vec2 u = v / max(r, .001), u0 = sign(b.x) * vec2(a.w, -a.z);
 float s = sign(b.x) * R * atan(u0.x * u.y - u0.y * u.x, dot(u0, u));
 float x = s / b.y * .5 + .5, taper = liS(.0, .2, x) * liS(1., .9, x), clump = noise(vec2(s * 13., seed));
 float wd = .0035 + .02 * x * x * clump;
 float bank = d > .0 ? exp(-d / wd) : exp(d / (.0012 + .4 * px)); // thrown outward, sharp on the inside
 float d2 = d + .012 - .004 * x; // the other blade, lighter
 float m = bank * (.2 + 1. * g) * (.5 + .7 * clump) + .5 * liS(1.3 * px + .0006, .0, abs(d2)) * (.4 + g) + .35 * liS(.014, .0, abs(d + .005)) * clump * g;
 return vec3(m * taper, x, dot(u, toLamp));
}
// Faint old marks: short arcs about one far place.
float liOld(vec2 w, vec2 c, vec2 to, float gap, float px) {
 vec2 v = w - c; float r = length(v), n = floor(r / gap), h = liH(n + c.x * 31.);
 float d = abs(fract(r / gap) - .15 - .7 * h) * gap;
 float h2 = liH(n * 1.7 + 3.), off = dot(v, vec2(-to.y, to.x)) / max(r, .001) - 1.3 * (h2 - .5);
 return liS(1.3 * px, .0, d) * liS(.3 * h + .05, .0, abs(off)) * step(.0, dot(v, to)) * h * h2;
}
float liSeg(vec2 p, vec2 a, vec2 b) { vec2 d = b - a; return length(p - a - d * sat(dot(p - a, d) / dot(d, d))); }
vec3 liSkate(vec2 p) {
 vec2 p0 = p;
 p += vec2(.018 * sin(uTravel * .019), .012 * sin(uTravel * .013));
 float D = 1. / (1.1 - .85 * min(p.y, 1.1));
 vec2 w = vec2(p.x, 1.5 * p.y) * D;
 float px = liPx * D * 1.25;
 // the lamp: over this place on the ice, so high
 vec2 lampP = vec2(.2, .275), tl = vec2(.2, .17) - w;
 float r2 = dot(tl, tl), r1 = sqrt(r2) + .001;
 float lamp = .6 + .4 * uLevel + .9 * uCue, fall = 1. / (1. + r2 * mix(9., 4.5, uSpace));
 float I = lamp * (fall * fall + .06 * fall);
 vec3 warm = mix(vec3(1.9, .8, .24), vec3(1.7, 1.05, .55), uTone);
 vec3 dusk = vec3(.2, .27, .4) * (.75 + .4 * uLevel);
 // the ice: clear and milky, and the last of the sky on its far side
 float m1 = noise(w * 1.6 + 3.), m2 = noise(rot(.5) * w * vec2(3., 8.) + 1.);
 float milk = liS(.3, .75, .6 * m1 + .4 * m2);
 vec3 col = mix(vec3(.006, .012, .018), vec3(.04, .056, .075), milk);
 float far = liS(-.15, .6, p.y);
 col += (vec3(.05, .07, .11) + vec3(.14, .07, .07) * far * liS(.9, -.6, p.x)) * far * far * 1.6 * (.7 + .4 * uLevel);
 col += warm * I * (.012 + .075 * milk);
 // dry snow blown thin over it, and the marks of other days
 vec2 wr = rot(.35) * w;
 float gr = noise(w * 270.), gm = noise(w * 70.);
 float dust = liS(.52, .8, .55 * noise(wr * vec2(1.8, 6.) + 8.) + .3 * noise(wr * vec2(9., 40.)) + .15 * gr);
 float P = .3 * dust * (.7 + .5 * uTexture);
 P += .5 * (liOld(w, vec2(-1.6, -.7), vec2(.9, .44), .021, px) + liOld(w, vec2(.5, 2.4), vec2(-.1, -.99), .034, px) + liOld(w, vec2(.15, -1.7), vec2(.0, 1.), .027, px));
 // the long strokes
 vec2 toLamp = tl / r1;
 vec4 pc = piece(clamp(liUV(p0), .0, 1.));
 vec3 glow = vec3(.0);
 vec2 best = vec2(9.); ivec2 who = ivec2(0);
 for (int i = 0; i < 14; i++) {
  float n = liNear(w, LI_A[i], LI_B[i]);
  if (n < best.x) { best.y = best.x; who.y = who.x; best.x = n; who.x = i; } else if (n < best.y) { best.y = n; who.y = i; }
 }
 for (int j = 0; j < 2; j++) {
  int i = j == 0 ? who.x : who.y;
  float n = j == 0 ? best.x : best.y;
  vec3 st = liMark(w, LI_A[i], LI_B[i], px, float(i) * 3.1, toLamp, gr) * step(n, 1.);
  int k = i % 4;
  float on = liLv(k);
  P += st.x * (.5 + .55 * on + .5 * uBands[i] + .4 * pc.a) * (.85 + .5 * st.z);
  glow += mix(liHue(k), pc.rgb, .4 * sat(pc.a)) * st.x * (.5 * on + .4 * pc.a) * (.3 + .9 * uEnergy);
  if (i == 0) { float run = st.y - 1.1 + uCue * 1.2; glow += warm * st.x * 2.5 * uCue * exp(-run * run * 30.); }
 }
 // a circle skated round and round with the loop
 vec2 v = w - vec2(-.2, -.04); float r = length(v), d = r - .2;
 if (d > -.012 && d < .04) {
  float behind = fract(uLoop - atan(v.y, v.x) / TAU);
  float body = (d > .0 ? exp(-d / .006) : exp(d / (.0015 + .4 * px))) * (.2 + gr);
  float fresh = exp(-behind * 4.) * liS(.0, .03, behind) * liS(1., .9, behind);
  P += body * (.45 + 1.2 * fresh * (.4 + .6 * uPhrase)) * (.85 + .5 * dot(v / r, toLamp));
 }
 // a hit: a hard stop, and a fan of powder thrown across the ice
 v = w - vec2(.1, -.19); r = length(v);
 if (r < .36) {
  float fan = liS(.2, .95, dot(v / max(r, .001), vec2(-.75, .66)));
  float place = .2 + .15 * (1. - liHit);
  P += liHit * fan * liS(place, place * .3, r) * liS(.0, .04, r) * (.7 + 3. * gm * gr);
  P += .7 * fan * exp(-abs(r - .05 - .02 * gm) * 200.) * (.2 + gr);
 }
 P *= 1. + 4. * (uKeys + .3 * uHigh) * liS(.8, .95, gr);
 vec3 powder = dusk * 1.5 + warm * I * 1.3;
 col = mix(col, powder, sat(P * .8)) + powder * max(P - 1.1, .0) * .25 + glow * (.45 + I);
 // the lamp mirrored down the ice
 float mx = (p.x - lampP.x) / (.014 + .05 * sat(.3 - p.y));
 float rough = .35 + 1.1 * noise(vec2(w.x * 30., w.y * 13.));
 col += warm * lamp * .6 * exp(-mx * mx) * liS(.07, -.02, p.y) * liS(-.36, .02, p.y) * rough * (1. - .7 * sat(P));
 // pole, arm and lantern
 float pole = min(liSeg(p, vec2(.258, .105), vec2(.25, .345)), liSeg(p, vec2(.25, .345), vec2(.2, .325)));
 pole = min(pole, liSeg(p, vec2(.2, .325), vec2(.2, .3)) + .0018);
 col = mix(col, vec3(.006, .006, .008) + warm * .03 * liS(.15, .33, p.y), liS(.0032 + liPx, .0032 - liPx, pole));
 vec2 q = p - lampP;
 float hl = length(q), wide = .0105 - .1 * q.y;
 col += warm * lamp * (.15 * exp(-hl * 9.) + .6 * exp(-hl * 36.));
 float body = max(abs(q.x) - wide, abs(q.y) - .016), roof = max(abs(q.x) - .4 * (.034 - q.y), abs(q.y - .02) - .006);
 col = mix(col, vec3(3.6, 2.3, 1.) * lamp * (.6 + .5 * exp(-hl * 90.)), liS(liPx, -liPx, body));
 col = mix(col, vec3(.02, .014, .01), liS(liPx, -liPx, min(min(roof, max(abs(q.x) - .011, abs(q.y + .018) - .0025)), max(abs(q.x) - .0008, abs(q.y) - .016))));
 // the reed edge, near the eye, with snow at its feet
 if (p0.x < .15 && p0.y + .5 * p0.x < -.1) {
  float lump = noise(p0 * 9.), bank = -.46 - .5 * (p0.x + .5) + .1 * lump - p0.y;
  float crust = noise(rot(.5) * p0 * vec2(30., 90.));
  col = mix(col, dusk * (.25 + .9 * lump * liS(.2, .0, bank) + .25 * crust) + warm * I * liS(.1, .0, bank), liS(-.01, .02, bank + .02 * (crust - .5)));
  for (int k = 0; k < 2; k++) {
   float fk = float(k), cell = .03 + .012 * fk, bx = floor(p0.x / cell + .37 * fk);
   for (int j = -1; j <= 1; j++) {
    float id = bx + float(j), h = liH(id + 60. + fk * 37.), h2 = liH(id * 1.7 + 80. + fk * 11.);
    float cx = (id + .5 - .37 * fk + (h - .5) * .5) * cell;
    float by = -.48 - .5 * (cx + .5) + .07 * h2, top = by + (.2 + .36 * h) * liS(.1, -.6, cx), tt = (p0.y - by) / max(top - by, .01);
    if (tt > .0 && tt < 1.) {
     float sway = .003 * sin(uTime * .5 + id * .7) * (.5 + uLow);
     float off = p0.x - cx - ((h2 - .25) * .05 + sway) * tt * tt, half_ = mix(.0028, .0007, tt);
     if (h2 > .62) half_ = max(half_, .0062 * liS(.7, .73, tt) * liS(.93, .89, tt));
     vec3 reed = mix(vec3(.004, .005, .007), vec3(.022, .016, .012), h) + warm * (.015 + I) * liS(.1, 1., off / half_);
     col = mix(col, reed, liS(half_ + liPx, half_ - liPx, abs(off)) * liS(.0, .1, tt));
    }
   }
  }
 }
 return col;
}
vec3 render(vec2 p) {
 liPx = 1. / uRes.y;
 liHit = uHits * (1. - sat(2. * uCue));
 vec3 col = uVar < .5 ? liDown(p) : liSkate(p);
 // a voice: breath on the cold air at your feet
 vec2 b = (p - vec2(.1, -.52)) * vec2(1.7, 2.6);
 col = mix(col, vec3(.42, .5, .56), .55 * uMic * exp(-dot(b, b) * 2.));
 return screenOf(col);
}
