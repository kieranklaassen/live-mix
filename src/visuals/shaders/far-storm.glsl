// name: Far storm
// a: Over the plain
// b: Over the tops
// what: Night over a wide dark plain: far off a thunderhead stands in faint moonlight, lit softly from inside, its anvil drawn out across the stars, rain under it and one lamp on a thin road; or the same weather from high above, a floor of cloud tops out to the curved edge of the world, with lights blooming under it.
// follows: Each kind of sound is a glow of its own inside the cloud, brighter as it sounds; the low end swells the towers, the high end shimmers in the rain and on the tops; a hit is a branching glow deep inside that spreads and fades, a cue lights the anvil or the far tops slowly; keys brighten windows and stars, a voice the lamp or the rim of air.
vec3 fsInk[5];      // the five kinds' light, as strong as they sound
vec3 fsAt[5];       // where each has its chamber
vec3 fsMoon;        // the way to the moon
float fsPx, fsSoft;  // the size of a pixel; how softly one head of cloud runs into the next
float fsBolt, fsNear;   // the hit's branching glow here: its fine lines, and its wide light
float fsE(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float fsT, fsWet;   // time for the fine shimmer, begun again every eight minutes while the shimmer is eased away
float fsLum(vec3 c) { return dot(c, vec3(.3, .59, .11)); }
void fsLights() {
 float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
 for (int k = 0; k < 5; k++) {
  vec3 c = uKind[k] * uKind[k];
  c = mix(c, vec3(fsLum(c)) * vec3(.95, 1., 1.12), k == 4 ? .6 : .22);
  float br = .8 + .2 * sin(uTime * (.19 + .07 * float(k)) + float(k) * 1.9);
  fsInk[k] = c * lv[k] * (.65 + .35 * lv[k]) * br * (.6 + .9 * uEnergy) * (k == 0 ? 3.1 : 1.9);
 }
}
vec2 fsPair(vec2 p) { vec3 q = fract(p.xyx * vec3(.1031, .103, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
// One size of cloud heads: how high the nearest one stands here (0 to 1) and where we are on it.
float fsHeads(vec2 q, float t, out vec2 on) {
 vec2 id = floor(q), f = q - id; t /= TAU; float best = -9.; on = vec2(.0);
 for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
  vec2 o = vec2(float(i), float(j)), h = fsPair(id + o);
  vec2 u = fract(t + h) * 2. - 1., v = f - o - .5 + 1.44 * u * (1. - abs(u)); // each sways about its place
  float e = .95 - .35 * h.x - dot(v, v), m = sat(.5 + .5 * (e - best) / fsSoft);
  best = mix(best, e, m) + fsSoft * m * (1. - m); on = mix(on, v, m);
 }
 return best;
}
const mat2 fsTurn = mat2(.8, .6, -.6, .8);
// The smaller heads, still, riding on the bigger ones: only the four nearest are asked, each let go before it is out of reach.
float fsTiny(vec2 q, out vec2 on) {
 vec2 id = floor(q - .5), f = q - id; float best = -9.; on = vec2(.0);
 for (int j = 0; j <= 1; j++) for (int i = 0; i <= 1; i++) {
  vec2 o = vec2(float(i), float(j)), h = fsPair(id + o), w = f - o - .5, g = max(abs(w) - .7, .0), v = w + .3 - .6 * h;
  float e = .95 - .35 * h.x - dot(v, v) - 5. * dot(g, g), m = sat(.5 + .5 * (e - best) / fsSoft);
  best = mix(best, e, m) + fsSoft * m * (1. - m); on = mix(on, v, m);
 }
 return best;
}
float fsLine(float x) { float i = floor(x), f = x - i; return mix(hash11(i), hash11(i + 1.), f * f * (3. - 2. * f)); }
vec3 fsFacing(vec2 n) { float r = dot(n, n); if (r > .96) n *= sqrt(.96 / r); return vec3(n, sqrt(1. - min(r, .96))); }
// The big heads of the tower, four shells from front to back.
vec2 fsS; vec3 fsShell[4];  // how deep inside each shell we are, and which way its head bulges
vec3 fsB;
void fsBig(float x, float y, float r) { vec2 v = fsS - vec2(x, y); float e = .5 * (r - dot(v, v) / r); if (e > fsB.z) fsB = vec3(v / r, e); }
void fsShells() {
 fsB = vec3(.0, .0, -1.); fsBig(-.1, .13, .075); fsBig(.015, .12, .085); fsBig(.13, .12, .07); fsBig(-.035, .215, .065); fsBig(.075, .195, .06); fsBig(-.185, .1, .05); fsBig(.205, .095, .045); fsBig(.02, .18, .06); fsShell[0] = fsB;
 fsB = vec3(.0, .0, -1.); fsBig(-.075, .27, .07); fsBig(.04, .29, .085); fsBig(.135, .215, .065); fsBig(-.14, .195, .06); fsBig(-.01, .365, .07); fsBig(.21, .12, .06); fsBig(-.245, .095, .045); fsBig(-.02, .315, .06); fsBig(.02, .165, .085); fsShell[1] = fsB;
 fsB = vec3(.0, .0, -1.); fsBig(-.045, .435, .065); fsBig(.065, .4, .075); fsBig(-.105, .345, .06); fsBig(.135, .31, .06); fsBig(.02, .48, .075); fsBig(-.225, .15, .04); fsBig(-.315, .085, .035); fsShell[2] = fsB;
 fsB = vec3(.0, .0, -1.); fsBig(.0, .545, .075); fsBig(-.085, .46, .07); fsBig(.105, .47, .07); fsBig(.165, .38, .045); fsBig(.035, .585, .05); fsBig(.27, .09, .035); fsBig(.0, .31, .1); fsBig(.02, .17, .1); fsBig(.085, .44, .105); fsBig(.0, .23, .1); fsBig(.1, .17, .09); fsShell[3] = fsB;
}
// Tower, anvil and rain in their own place: y 0 is the horizon.
vec3 fsLit(vec3 P, vec3 N, float f, float crease) {
 vec3 c = vec3(.0); float thin = 2. * exp(-f * 42.) + .18;
 for (int k = 0; k < 4; k++) {
  vec3 L = fsAt[k] - P; if (k == 2) L.x *= .45;
  float d2 = dot(L, L), dl = sqrt(d2 + 1e-5);
  float wrap = sat((dot(N, L) / dl + .45) / 1.45);
  float fall = 1. / (1. + d2 * mix(58., 96., uTone)); fall *= fall;
  c += fsInk[k] * fall * (wrap * wrap * 2.9 + thin);
 }
 return c * crease;
}
// The branching glow of a hit: a bent stem with three limbs, growing outwards as it fades.
void fsBranch(vec2 q, vec2 at, float size) {
 fsBolt = .0; fsNear = .0;
 float grow = .35 + 1. * (1. - uHits), d = 9.;
 vec2 u = (q - at) / size; float out_ = fsE(3.2, 1.2, dot(u, u));
 if (uHits > .01 && dot(u, u) < 3.2) {
 u += .16 * (vec2(noise(u * 3.1 + 4.), noise(u * 3.1 + 19.)) - .5) + .1 * (vec2(noise(u * 8.), noise(u * 8. + 31.)) - .5) + .05 * (vec2(noise(u * 21.), noise(u * 21. + 11.)) - .5);
 const vec4 limb[6] = vec4[6](vec4(.0, .55, .1, -.1), vec4(.1, -.1, -.08, -.75), vec4(.1, -.1, .52, -.5), vec4(.0, .55, -.55, .85), vec4(.0, .55, .5, .95), vec4(.06, .2, -.45, .02));
 for (int i = 0; i < 6; i++) {
  vec2 a = limb[i].xy, b = limb[i].zw - a, v = u - a;
  float h = sat(dot(v, b) / dot(b, b)), l = length(v - b * h);
  float w = .006 + .012 * (1. - h) * (i < 2 ? 1.5 : 1.);
  float on = fsE(grow + .15, grow - .15, length(a + b * h - vec2(.0, .3)));
  fsBolt = max(fsBolt, on * (.9 * exp(-max(l - w, .0) * 30.) + .5 * exp(-l * 8.)));
  d = min(d, l + (1. - on) * .3);
 }
 fsNear = exp(-d * 2.6) * out_ * uHits; fsBolt *= out_ * uHits;
 }
}
vec3 fsRain(vec2 q, vec3 sky) {
 float x = q.x + q.y * .32, w = fsE(.33, .08, abs(x + .03));
 if (w > .0 && q.y < .17) {
 float shaft = fsE(.2, .85, .65 * noise(vec2(x * 11. + uTime * .01, 1.7)) + .35 * noise(vec2(x * 34. + uTime * .013, 4.7)));
 float fine = noise(vec2(x * 210., q.y * 9. + fsT * .6)) * .6 + noise(vec2(x * 90. + 3., q.y * 5. + fsT * .4)) * .4;
 fine = mix(.45, fine, fsWet);
 float hang = fsE(.17, .1, q.y) * mix(.35 + .65 * noise(vec2(x * 23., 7.)), 1., fsE(.0, .07, q.y));
 vec3 lit = vec3(.012, .016, .022);
 lit += fsInk[0] * .16 * exp(-49. * (q.x - fsAt[0].x) * (q.x - fsAt[0].x));
 vec4 m = piece(vec2((x + .26) / .52, .25 + q.y * 4.));
 lit += m.rgb * m.rgb * (.1 + .2 * uEnergy);
 lit += vec3(.3, .36, .42) * .45 * uHigh * fine * fine * fine;
 sky = mix(sky, lit * (.75 + .5 * fine), w * hang * (.15 + .85 * shaft) * .8);
 }
 return sky;
}
float fsStar(vec2 p) {
 vec2 g = p * 30., id = floor(g), h = hash22(id);
 float r = length(g - id - .2 - .6 * h) / (30. * max(fsPx, .0011)), b = hash21(id + 7.7);
 b *= b; b *= b; b *= b; b *= b; b *= b;
 return b * exp(-r * r * (2.2 - 1.2 * b)) * (.8 + .2 * sin(uTime * (.5 + h.x) + h.y * 40.));
}
vec4 fsAnvil(vec2 s) {
 vec4 an = vec4(.0);
 float x = s.x, ax = x < .0 ? -x : x / .36;
 float top = .607 + .012 * x - .045 * ax * ax * ax + .014 * (noise(vec2(x * 9., 2.)) - .5);
 float bot = .42 + .158 * (1. - exp(-ax * 3.4)) - .012 * x + .02 * (noise(vec2(x * 6. + 3., 5.)) - .5);
 if (ax < 1.1 && s.y < top + .02 && s.y > bot - .04) {
 float slow = uTime * .004;
 float str = noise(vec2(x * 5. - slow * 3., s.y * 46. + x * 3.)), thin = noise(vec2(x * 13. - slow * 5., s.y * 120. + x * 9.));
 vec2 v = vec2(.0), w2 = v; float h = .5, h2 = .5;
 if (s.y - bot < .09) { h = fsHeads(vec2(x * 13. - slow * 6., s.y * 21.), uTime * .03, v); h2 = fsTiny(vec2(x * 33. - slow * 9., s.y * 44.) + v, w2); }
 float up = top - s.y + .009 * (str - .5) + .006 * (h2 - .5), dn = s.y - bot + .034 * (h - .5) + .012 * (h2 - .5) + .012 * (str - .5);
 float f = min(up, dn);
 float wisp = fsE(1.02, .55, ax + .35 * (str - .5) + .2 * (thin - .5));
 float a = fsE(-.002, .004 + .03 * fsE(.1, .8, ax), f + .012 * (thin - .6) * fsE(.05, .4, ax)) * wisp * mix(.55 + .45 * thin, 1., fsE(.9, .2, ax));
 float pouch = fsE(.06, .0, dn);
 vec2 nx = v * pouch * .8 + w2 * .4 * pouch + vec2(.0, fsE(.03, .0, up) * .8 - .5 * pouch);
 vec3 N = fsFacing(nx);
 float run = noise(vec2(x * 7. - slow * 4., (s.y - bot) / (max(top - bot, 0.) + .02) * 7. + 2. * str));
 float grain = .45 + .5 * run + .35 * str * (.6 + .4 * thin), crease = mix(1., .4 + .6 * fsE(.1, .7, h), pouch * .8);
 float m = sat(dot(N, fsMoon) * .8 + .2);
 vec3 moonC = vec3(.5, .6, .78);
 vec3 c = vec3(.009, .013, .022) + moonC * .12 * m * m + moonC * .3 * exp(-max(up, .0) * 140.);
 c = c * grain + fsLit(vec3(s, -.06), N, max(f, .0) * .7, 1.) * grain;
 float reach = exp(-ax * 1.6) * (.45 + .55 * fsE(.35, .0, abs(ax - (1. - uCue) * 1.1)));
 c += (vec3(.55, .62, .8) + .5 * fsInk[2]) * uCue * reach * grain * (.45 + .55 * exp(-max(f, .0) * 30.)) * .75;
 c += fsInk[4] * fsNear * .35 * grain;
 an = vec4(c * crease, a);
 }
 return an;
}
vec3 fsStorm(vec2 q, vec3 sky) {
 float t = uTime * .05, rise = uTime * .0016 + uTravel * .0012;
 vec3 acc = vec3(.0); float left = 1., ahead = -1.;
 vec3 moonC = vec3(.5, .6, .78) * .56;
 vec2 s = q; s.x *= 1. - .07 * uLow; s.y *= 1. - .05 * uLow * fsE(.0, .5, q.y);
 vec4 an = vec4(.0);
 if (s.y > .36 && s.y < .66) an = fsAnvil(s);
 bool by = abs(s.x) < mix(.36, .25, fsE(.1, .2, s.y)) && s.y < .68 && s.y > .05;
 if (by) { fsS = s + .034 * (vec2(noise(s * 13.), noise(s * 13. + 41.)) - .5); fsShells(); }
 for (int l = 0; l < 4; l++) {
  if (left < .01 || (!by && an.a <= .0)) break;
  if (l == 3) { acc += left * an.a * an.rgb * (1. - .5 * fsE(-.05, .0, ahead)); left *= 1. - an.a; }
  float fl = float(l), z = .24 - .13 * fl, f = by ? fsShell[l].z : -1.; vec2 bn = by ? fsShell[l].xy : vec2(.0);
  if (f > -.037) {
  vec2 o = vec2(fl * 3.7, fl * 5.1 - rise * 14.), v1, v2, v3;
  float h1 = fsHeads(s * 15. + o, t + fl, v1);
  if (f + .044 * (h1 - .45) > -.015) {
  float h2 = fsTiny(s * 33. + o * 2.2 + v1 * 1.1, v2);
  float h3 = fsTiny(fsTurn * (s * 78. + v2 * 1.1) + o * 5.2, v3); v3 = v3 * fsTurn;
  f += .044 * (h1 - .45) + .019 * (h2 - .5) + .008 * (h3 - .5);
  float foot = s.y - .062 - .03 * h1 - .012 * h2 - .004 * h3 - .02 * noise(vec2(s.x * 11. + fl, 3.));
  f = min(f, foot * 1.3);
  float a = fsE(-fsPx, fsPx * 1.5, f);
   vec2 nx = bn * .5 + v1 * .55 + v2 * .42 + v3 * .26 + vec2(s.x * 1.3, .0);
   vec3 N = fsFacing(nx);
   vec3 P = vec3(q, z + .12 * sat(f * 10.));
   float crease = .45 + .55 * fsE(.1, .75, .5 * h1 + .35 * h2 + .15 * h3);
   float under = fsE(.02, .1, foot);
   float shade = 1. - .55 * fsE(-.045, .0, ahead);
   float m = sat(dot(N, fsMoon) * .88 + .12), high = fsE(.05, .5, q.y);
   vec3 c = vec3(.0035, .006, .011) * (.5 + high) + moonC * m * m * mix(.25, 1., high) * shade * mix(.25, 1., under);
   c = c * crease + fsLit(P, N, max(f, .0), crease);
   c += fsInk[4] * (l > 0 ? fsBolt * (l > 1 ? 3.2 : 1.4) * crease * crease * (.4 + .6 * exp(-max(f, .0) * 18.)) + fsNear * .35 * crease * 1.5 : fsNear * (.12 + 1. * exp(-max(f, .0) * 45.)) * crease);
   c += vec3(.5, .58, .8) * uCue * .22 * crease * fsE(.25, .6, q.y) * (l > 1 ? 1. : .4) * sat(.3 + N.y);
   c = mix(c, sky, (.35 + .3 * uSpace) * exp(-q.y * 14.));
   acc += left * a * c; left *= 1. - a;
  }
  }
  ahead = max(ahead, f);
 }
 return acc + left * sky;
}
vec3 fsPlain(vec2 p) {
 float asp = uRes.x / uRes.y, hz = -.35, cx = .2 * fsE(.7, 1.5, asp);
 vec2 q = p - vec2(cx, hz);
 vec3 spill = vec3(.0);
 for (int k = 0; k < 4; k++) spill += fsInk[k] / (1. + 14. * dot(q - fsAt[k].xy, q - fsAt[k].xy));
 vec3 col = vec3(.0);
 if (q.y > .0) {
  vec2 c = q - vec2(.0, .02);
  fsBranch(q, vec2(.02 + .03 * sin(uTime * .07), .33), .2);
  vec3 sky = mix(vec3(.0075, .0125, .0195), vec3(.0012, .0019, .0045), fsE(.0, .4 + .3 * uSpace, q.y)) + spill * .003;
  if (q.y > .1) sky += vec3(.75, .82, 1.) * fsStar(p) * fsE(.1, .5, q.y) * (.5 + .8 * uKeys);
  // low cloud far off along the horizon
  if (q.y < .09) {
   vec2 v; float h = fsHeads(q * vec2(26., 30.), uTime * .02, v);
   float f = .052 * fsE(.35, .8, noise(vec2(q.x * 4.5 + 3. + uTime * .0015, .5))) - q.y + .018 * (h - .3);
   float m = sat(dot(vec3(v, .5), fsMoon));
   sky = mix(sky, vec3(.008, .012, .019) + vec3(.014, .017, .023) * m * m * fsE(.0, .05, q.y), fsE(-fsPx, fsPx * 2., f) * .85);
  }
  col = fsStorm(c, fsRain(q, sky));
 }
 else {
 float d = -q.y, z = .1 / (d + .004);
 vec2 w = vec2(q.x * z * 10., z * 10.);
 // long strips of field, paler where the rain has left water standing
 float near = fsE(.004, .1, d);
 float row = floor(w.y * .32 + .25 * sin(w.x * .05)), tint = hash11(row + 3.);
 col = vec3(.003, .0045, .0048) * (.5 + .9 * tint);
 col *= .7 + .6 * mix(.5, noise(w * vec2(1.6, 5.)) * .6 + .4 * noise(w * vec2(5., 17.)), near);
 float water = fsE(.5, .75, noise(w * vec2(.1, .42) + 3.) * .75 + .25 * mix(.5, noise(w * vec2(.5, 1.9)), near)) * fsE(.16, .03, d) * fsE(.0, .02, d);
 vec3 glow = vec3(.0);
 for (int k = 0; k < 4; k++) { float x = (q.x - fsAt[k].x * 1.3) * 5. / (1. + 5. * d); x = 1. + x * x; glow += fsInk[k] / (x * sqrt(x)) * exp(-d * 7. - fsAt[k].y); }
 glow += fsInk[4] * .4 / (1. + q.x * q.x * 30.) * exp(-d * 7.);
 vec4 m = piece(vec2(sat(p.x / min(asp, 1.8) + .5), 1. - exp(-d * 9.)));
 col += m.rgb * m.rgb * .012 * (.3 + tint);
 col += glow * (.006 * (.4 + tint) + .2 * water) + vec3(.01, .014, .019) * water / (1. + q.x * q.x * 3.);
 // the road, and the one light on it
 float rx = -.03 - 1.9 * d + d * .75 * sin(.2 / (d + .035)), half_ = .0006 + .022 * d;
 float road = fsE(half_ + fsPx * 1.5, half_ - fsPx, abs(q.x - rx));
 col = mix(col, vec3(.026, .033, .042) + spill * .05 * exp(-d * 5.), road * .8);
 // a few windows far out, for the keys
 float vx = p.x * 24., vi = floor(vx), vh = hash11(vi + 2.);
 vec2 vd = vec2((vx - vi - .2 - .6 * hash11(vi + 8.)) / 24., d - .004 - .02 * vh * vh) / fsPx;
 col += vec3(1., .7, .38) * step(.8, vh) * exp(-dot(vd, vd) * .4) * (.025 + 1.2 * uKeys) * (.5 + hash11(vi + 5.));
 float trip = fract(uTime / 160. + .45), dc = 1. / mix(120., 9., trip) - .004;
 vec2 car = vec2(-.03 - 1.9 * dc + dc * .75 * sin(.2 / (dc + .035)), -dc);
 float seen = fsE(.0, .1, trip) * fsE(1., .9, trip), size = .0011 + .012 * dc;
 vec2 cv = q - car - vec2(.0, size);
 float r = length(cv);
 vec3 lamp = vec3(1., .74, .42) * seen * (.55 + .9 * uMic);
 col += lamp * (exp(-r * r / (size * size)) * 1.3 + .0000022 / (r * r + .00004) * 3. + road * .1 * exp(-abs(cv.y) / (.06 * dc + .003)) * step(cv.y, .0));
 }
 return col;
}
// The tops, from high above: banks of cloud one behind another, out to the curved edge of the world.
vec3 fsTops(vec2 p) {
 float hy = .2 - .12 * p.x * p.x, limb = p.y - hy, al = max(limb, .0);
 vec3 edge = vec3(.006, .015, .021);
 vec3 sky = vec3(.0012, .0018, .0042) + edge * exp(-al * 13.);
 sky += vec3(.02, .046, .034) * exp(-3800. * (limb - .002) * (limb - .002)) * (.7 + .5 * uMic);
 if (limb > .04) sky += vec3(.75, .82, 1.) * fsStar(p) * fsE(.04, .2, limb) * (.5 + .8 * uKeys);
 fsBranch((p - vec2(-.16 + .04 * sin(uTime * .05), .03)) * vec2(.62, 1.3), vec2(.0), .2);
 float go = uTime * .005 + uTravel * .007, at = fract(go), n0 = floor(go), ahead = -1.;
 const float ratio = 1.31;
 vec3 acc = vec3(.0); float left = 1., z = .42 * pow(ratio, -at);
 for (int j = 0; j < 15; j++) {
  if (left < .01 || limb > .06) break;
  z *= ratio;
  float n = n0 + float(j), sd = mod(n, 97.) * 3.17, yb = hy - .5 / z;
  vec2 q = vec2(p.x * z + 36. * fract(sd * .77), (p.y - yb) * z);
  if (q.y < .4) {
  float tower = fsE(.55, .9, fsLine(q.x * 1.3 + sd + 40.));
  float line = (.04 + .1 * fsLine(q.x * 2.2 + sd) + (.105 + .05 * uLow) * tower) * fsE(.36, 1., z), up = line - q.y, h1 = .5, h2 = .5, h3 = .5;
  vec2 v1 = vec2(.0), v2 = v1, v3 = v1;
  if (up > -.08) {
  if (up < .31) h1 = fsHeads((q + .02 * sin(q.yx * vec2(17., 13.) + sd)) * 5.5 + sd, uTime * .03 + n, v1);
  if (up + .1 * (h1 - .4) > -.026) {
  float fine = fsE(7., 4.5, z), some = fsE(10., 6.5, z);
  if (up < .25 && z < 10.) { h2 = mix(.5, fsTiny(q * 13. + sd + v1, v2), some); v2 *= some; }
  if (up < .25 && z < 7.) { h3 = mix(.5, fsTiny(fsTurn * (q * 31. + v2), v3), fine); v3 = v3 * fsTurn * fine; }
  float f = up + .1 * (h1 - .4) + .034 * (h2 - .5) + .017 * (h3 - .5), px = fsPx * z;
  float a = fsE(-px, px * 1.5, f) * (j == 14 ? fsE(24., 19.5, z) : 1.);
   vec2 nx = v1 * .85 + v2 * .45 + v3 * .2 + vec2(.0, .3 * exp(-max(f, .0) * 8.));
   vec3 N = fsFacing(nx);
   float crease = .5 + .5 * fsE(.1, .75, .5 * h1 + .35 * h2 + .15 * h3);
   float shade = 1. - .5 * fsE(-.06, .0, ahead);
   float m = sat(dot(N, fsMoon) * .88 + .12);
   vec3 c = (vec3(.0035, .006, .011) + vec3(.5, .6, .78) * .42 * m * m * shade) * crease;
   vec3 mist = vec3(.007, .0105, .0165);
   // the storms lie between the banks: one ahead of them is dark against the light, the ones behind are lit by it
   float g = floor(n / 3.), in3 = n - 3. * g, cx = floor(p.x * z / 1.3 - .5);
   float thin = 4. * exp(-max(f, .0) * 18.) * (in3 < .5 ? 1. : .3) + .12;
   for (int i = 0; i <= 1; i++) {
    float id = cx + float(i), h = hash21(vec2(id, mod(g, 89.)) + 3.);
    int k = int(mod(id + 2. * g + 400., 4.));
    vec3 L = vec3((id + .2 + .6 * h) * 1.3 - p.x * z, .06 - q.y, in3 < .5 ? -.16 : .2 * in3);
    float d2 = dot(L, L), wrap = sat((dot(N, L) / sqrt(d2 + 1e-4) + .45) / 1.45), fall = (.4 + .6 * hash11(h * 7.)) * fsE(.9, .55, abs(L.x)) / (1. + d2 * mix(12., 19., uTone));
    float own = .55 + .45 * sin(uTime * (.1 + .12 * h) + TAU * h);
    mist += fsInk[k] * fall * own * (.36 + .5 * fall * fall);
    c += fsInk[k] * fall * fall * (wrap * wrap * 7. + thin) * crease * own;
   }
   float back = fsE(2., 2.6, z);
   c += fsInk[4] * crease * (back * (fsBolt * 2.2 * crease + fsNear * .4) + (1. - back) * fsNear * exp(-max(f, .0) * 18.));
   float lz = log(z) - 2.4 * uCue, cs = exp(-lz * lz * 2.5) * uCue;
   c += vec3(.55, .64, .8) * cs * crease * (.25 * N.y + .12 + .5 * exp(-max(f, .0) * 14.)) * exp(-(p.x - .2) * (p.x - .2) * 1.5);
   if (f < .06 && uHigh > .01) c += vec3(.5, .58, .7) * uHigh * .35 * max(exp(-max(f, .0) * 60.) - .03, .0) * mix(.45, noise(q * vec2(30., 8.) + fsT * .3), fsWet);
   vec4 pm = piece(vec2(sat(p.x * .55 + .5), sat(1. / (.7 + z))));
   mist += pm.rgb * pm.rgb * .03;
   c = mix(c, mist * exp(-max(up - .2, 0.) * 5.), fsE(.03, .26, f) * mix(.9, 1., fsE(.17, .25, up)));
   c = mix(c, edge * .7, 1. - exp(-z * (.03 + .04 * uSpace)));
   acc += left * a * c; left *= 1. - a;
  }
  ahead = max(ahead, up);
  }
  }
 }
 return acc + left * sky;
}
vec3 render(vec2 p) {
 fsPx = 1. / max(uRes.y, 1.);
 fsLights();
 fsT = mod(uTime, 480.); fsWet = fsE(.0, 5., fsT) * fsE(480., 475., fsT);
 vec3 c = vec3(.0);
 if (uVar > .5) {
  fsSoft = .19; fsMoon = normalize(vec3(-.55, .8, .1));
  c = fsTops(p);
 }
 else {
  fsSoft = .12; fsMoon = normalize(vec3(-.62, .62, .3));
  fsAt[0] = vec3(.0, .16, .16); fsAt[1] = vec3(-.03, .33, .06); fsAt[2] = vec3(-.25, .53, .0); fsAt[3] = vec3(.1, .43, -.03);
  fsInk[0] += vec3(.018, .026, .038); // a little is always left in the belly
  c = fsPlain(p);
 }
 return screenOf(c);
}
