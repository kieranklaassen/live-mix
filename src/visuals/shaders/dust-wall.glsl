// name: Dust wall
// a: Leaning wall
// b: Saffron inside
// what: A wall of dust a mile high leans over a straw plain, burnt orange above and brown-violet at its foot, pale turquoise sky still ahead; a small white van with lit lamps drives out from under it past telegraph poles; or inside: saffron above, rust below, a small pale blue sun, a gate, poles, a water tower, grit, a weed rolling by.
// follows: A fuller mix raises the wall and leans it further, the low end swells its folds, bands from foot to top; the drone warms the dust, each kind tints a fold or a bank, texture is the grit, the piece lies as light on the plain or in the air. A hit is dry lightning inside, a cue a gust that lays the grass, keys spark on the wires, a voice brightens lamps or sun.
// own: 0 red evening at -1, moonlit night at 1; 1 black soil in the air at -1, white dust at 1; 2 green wheat before the wall, thin air inside, at -1; snow before it, thick air inside, at 1; 3 smooth folds, still air at -1; boiling folds, hard driven grit at 1; 4 from low down, the gate near, at -1; from a height, the gate far, at 1; 5 the wall far off, the sun a high speck, at -1; the wall over us, the sun large, at 1; 6 no road, van, poles, gate or tower, but a: a row of bent trees, b: one bare tree, at -1; all stands in still water and is doubled in it at 1; 7 a: the wall square across the whole horizon at -1, a canyon of dust on both sides with a gap of sky at 1, b: the dust in clear ridges one behind another at -1, pillars of whirling dust at 1
float dwPx, dwHor, dwGl, dwLv[5];  // a pixel, the horizon, the five kinds
vec3 dwHi, dwMid, dwLo, dwSkyA, dwSkyB, dwSun;  // dust in light, between, in shade; sky above and low down; light on the land
float dwE(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float dwG(float x) { return exp(-x * x); }
float dwIn(float d, float px) { return sat(.5 - d / px); }
vec2 dwPair(vec2 p) { vec3 q = fract(p.xyx * vec3(.1031, .103, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
// Noise that keeps its grain far out, where a day of wind has carried it.
float dwN(vec2 p) {
 vec2 i = floor(p), f = p - i; f = f * f * (3. - 2. * f);
 return mix(mix(dwPair(i).x, dwPair(i + vec2(1, 0)).x, f.x), mix(dwPair(i + vec2(0, 1)).x, dwPair(i + vec2(1, 1)).x, f.x), f.y);
}
vec3 dwHour(vec3 c, vec3 eve, vec3 night) { return mix(mix(c, c * eve, max(-uOwn[0], 0.)), dot(c, vec3(.3, .59, .11)) * night, max(uOwn[0], 0.)); }
vec3 dwStuff(vec3 c, vec3 black, vec3 white) { return mix(mix(c, black, max(-uOwn[1], 0.)), white, max(uOwn[1], 0.)); }
// The hour and what the dust is made of.
void dwLight() {
 dwLv = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
 dwGl = .3 + .55 * uEnergy;
 float w = .05 * uDrone + .04 * (.5 - uTone);
 dwHi = dwHour(dwStuff(vec3(.97, .69, .36), vec3(.6, .55, .5), vec3(1., .97, .91)), vec3(1.02, .66, .52), vec3(.66, .8, 1.));
 dwMid = dwHour(dwStuff(vec3(.74, .39, .17), vec3(.25, .225, .22), vec3(.79, .75, .71)), vec3(.95, .56, .56), vec3(.36, .46, .68));
 dwLo = dwHour(dwStuff(vec3(.23, .13, .135), vec3(.055, .05, .06), vec3(.42, .43, .48)), vec3(.9, .65, .9), vec3(.36, .4, .62));
 dwHi *= vec3(1. + w, 1., 1. - 2. * w); dwMid *= vec3(1. + 2. * w, 1. + .4 * w, 1. - 2. * w);
 dwSkyA = dwHour(vec3(.46, .69, .7), vec3(.65, .39, .58), vec3(.07, .1, .19));
 dwSkyB = dwHour(vec3(.83, .88, .78), vec3(1.16, .68, .52), vec3(.18, .25, .37));
 dwSun = dwHour(vec3(1., .95, .82), vec3(1., .66, .5), vec3(.36, .48, .72));
}
// Round heads of dust: how high the nearest stands and where we are on it. They sway as t runs.
float dwHeads(vec2 q, float t, out vec2 on) {
 vec2 id = floor(q - .5), f = q - id; float best = -9.; on = vec2(0.);
 for (int j = 0; j < 4; j++) {
  vec2 o = vec2(float(j & 1), float(j >> 1)), h = dwPair(id + o), w = f - o - .5, g = max(abs(w) - .64, 0.), v = w + .37 - .74 * abs(fract(t + h) * 2. - 1.);
  float e = 1. - .5 * h.y - dot(v, v) - 5. * dot(g, g), m = sat(.5 + .5 * (e - best) / .2);
  best = mix(best, e, m) + .2 * m * (1. - m); on = mix(on, v, m);
 }
 return best;
}
const mat2 dwTurn = mat2(.8, .6, -.6, .8);
#define dwBare max(-uOwn[6], 0.)
#define dwWet max(uOwn[6], 0.)
#define dwFlat max(-uOwn[7], 0.)
#define dwGap max(uOwn[7], 0.)
#define dwV (1.22 - 1.2 * dwGap)
const float dwVx = -.2;   // where the wall runs out on the horizon, and the road
// Folds along a line that runs away to the right, the near ones in front.
vec4 dwWall(vec2 p, float size, float lean) {
 vec3 acc = vec3(0.); float left = 1., ahead = -1.;
 float side = 0.;
 if (dwGap > 0. && p.x > dwV) { side = 1.; p.x = dwV - (p.x - dwV) * (1. + .18 * dwGap); }
 float d = max(dwV - p.x, .02), kc = floor(log(d / 1.25) / .31 + .5);
 if (dwFlat > 0.) kc = floor(mix(log(d / 1.25) / .31, -p.x / .36, dwFlat) + .5);
 float boil = uOwn[3], sc = 2. * exp(.4 * boil), roll = uTime * .0075 + uTravel * .004;
 vec3 L = normalize(vec3(-.45, .8, .4));
 for (int n = 0; n < 6; n++) {
  float k = kc + 3. - float(n); if (left < .02) break;
  float D = 1.25 * exp(.31 * k), x0 = dwV - D, big = pow(D, 1.55);
  if (dwFlat > 0.) { x0 = mix(x0, -k * .36, dwFlat); big = mix(big, 1.05 + .35 * sin(k * 2.4) + .2 * sin(k * .9 + 1.), dwFlat); D = mix(D, 1.5, dwFlat); }
  if (dwGap > 0.) k += 23. * side;
  float H = (.31 + .07 * hash11(k + 41.3)) * big * size, W = .215 * D * (1. + .1 * uLow) * (1. + .55 * dwGap), y = p.y - dwHor + .022 * big, t = y / H;
  if (dwGap > 0.) { H *= 1. + 1.3 * dwGap; t = y / H; }
  if (t < -.2 || t > 1.4) continue;
  float ax = x0 + H / (1. + 1.3 * dwGap) * t * (lean * t * (1. - dwFlat * .7) - .1), ww = W * (1.02 + .22 * dwE(.2, .75, t) + .12 * band(t) - .12 * dwE(.75, 1., t));
  float dx = (p.x - ax) / ww, dome = max(t - .62, 0.) / .44, f = 1. - dx * dx - dome * dome;
  if (f < -.9) continue;
  float lod = dwE(.004, .03, W) * (.85 + .25 * boil);
  vec2 q = vec2(p.x - mix(x0, ax, .4), y) / W, o = vec2(k * 7.3 - roll * .6, k * 3.1 - roll * 3.), v1, v2, v3;
  q *= sc; q += .25 * sin(q.yx * 1.6 + k * 2.);
  float h1 = dwHeads(dwTurn * q + o, uTime * .006, v1);
  v1 = v1 * dwTurn;
  // no puff may come loose of the fold it belongs to
  float held = (f + .26) * 1.4;
  f += .66 * (h1 - .5);
  float over = dwE(-.55, .1, ahead); ahead = max(ahead, f);
  if (f < -.25) continue;
  float h2 = dwHeads(q * 2.1 + o * 2.1 + v1 * .6, 0., v2), h3 = dwHeads(dwTurn * (q * 4.7 + v2 * .5) + o * 4.7, 0., v3);
  v3 = v3 * dwTurn;
  // the finest of it is only dust
  float gr = dwN(q * 11. + o * 11.) - .5;
  f += (.3 * (h2 - .5) + .14 * (h3 - .5) + .05 * gr) * lod - 2.5 * dwE(.02, -.07, t);
  f = min(f, held);
  float fw = dwPx * 1.5 / W + mix(.2, .04, dwE(.4, .95, t)), a = dwE(-fw * .4, fw, f);
  if (a > .003) {
   vec2 nx = vec2(dx, dome * 1.1 - .5 * dwE(.6, .1, t)) * .42 + v1 * .72 + (v2 * .5 + v3 * .24 + .14 * gr) * lod;
   float r = dot(nx, nx); if (r > .96) nx *= sqrt(.96 / r);
   float lit = sat(dot(vec3(nx, sqrt(1. - min(r, .96))), L) * .78 + .24), ao = (.55 + .45 * dwE(-.1, .75, h1)) * (.72 + .28 * dwE(0., .7, h2)) * (.94 + .16 * gr * lod);
   float v = lit * ao * mix(1., .42, over) * mix(.45, 1.2, dwE(-.1, .9, t));
   // dust hangs in the hollows
   v = mix(v, .34 + .2 * t, .3 * dwE(.6, 0., h1));
   vec3 c = mix(mix(dwLo, dwMid, sat(v * 2.1)), dwHi, dwE(.4, 1., v));
   c = mix(c, dwLo * vec3(1.25, 1.05, 1.2), .5 * dwE(.4, 0., t));
   int ki = int(mod(k + 11., 5.)); float lv = dwLv[ki] * dwE(.05, .5, t); vec3 kc = uKind[ki];
   c = mix(c, c * (.65 + kc), lv * dwGl * .6) + kc * lv * dwGl * .16 * dwE(.8, .2, h1);
   c = mix(c, mix(dwSkyB, dwMid, .4), .85 * exp(-D * (1.9 - .6 * uSpace)));
   acc += left * a * c; left *= 1. - a;
  }
 }
 return vec4(acc, 1. - left);
}
float dwSeg(vec2 p, vec2 a, vec2 b) { vec2 d = b - a, v = p - a; return length(v - d * sat(dot(v, d) / dot(d, d))); }
float dwBox(vec2 p, vec2 c, vec2 b) { p = abs(p - c) - b; return max(p.x, p.y); }
// Dry lightning inside the dust: x its fine lines, y its wide light.
vec2 dwBolt(vec2 p, vec2 at, float s) {
 vec2 u = (p - at) / s; float r = dot(u, u);
 if (uHits < .01 || r > 6.) return vec2(0.);
 u += .22 * (vec2(noise(u * 3. + 4.), noise(u * 3. + 19.)) - .5) + .1 * (vec2(noise(u * 9.), noise(u * 9. + 31.)) - .5);
 vec2 m = vec2(.1, 0.), n = vec2(0., .8);
 float d = min(min(dwSeg(u, n, m), dwSeg(u, m, -n)), min(dwSeg(u, m, vec2(.6, -.5)), dwSeg(u, n, vec2(-.55, .5))) + .02);
 return uHits * dwE(6., 2.5, r) * vec2(exp(-d * 24.), exp(-d * 2.2));
}
// The small white van, from in front and a little from its side.
vec3 dwVan(vec3 c, vec2 p, float cam, float z) {
 vec2 q = (p - vec2(dwVx + 1.83 / z, dwHor - cam / z)) * z; float px = dwPx * z;
 if (abs(q.x) > 3. || abs(q.y) > 2.2) return c;
 vec3 white = vec3(.74, .72, .7) * mix(dwSun, vec3(1.), .4);
 c *= 1. - .6 * dwG(q.x * 1.6 + .4) * dwG(q.y * 5.);
 float zs = 1.47 / max(p.x - dwVx, .02), Y = cam - (dwHor - p.y) * zs;
 vec3 side = mix(white * .7, vec3(.1), dwIn(dwBox(vec2(zs - z, Y), vec2(1., .64), vec2(.75, .1)), px) * .85);
 c = mix(c, side, dwIn(max(dwBox(vec2(zs - z, Y), vec2(.95, .48), vec2(.95, .36)), q.x), px * 1.5));
 c = mix(c, vec3(.03), dwIn(dwBox(vec2(abs(q.x), q.y), vec2(.25, .08), vec2(.065, .09)), px));
 vec2 b = abs(q - vec2(0., .45)) - vec2(.36 - .05 * dwE(.45, .85, q.y), .37) + .1;
 vec3 f = mix(white * (.8 + .25 * q.y), mix(vec3(.08, .1, .12), dwSkyA * .5, dwE(.5, .8, q.y + q.x * .4)), dwIn(dwBox(q, vec2(0., .62), vec2(.27, .12)), px));
 c = mix(c, mix(f, vec3(.1), .8 * dwIn(dwBox(q, vec2(0., .2), vec2(.17, .035)), px)), dwIn(length(max(b, 0.)) + min(max(b.x, b.y), 0.) - .1, px));
 vec2 l = vec2(abs(q.x) - .23, q.y - .33); float d = length(l);
 c += vec3(1., .84, .5) * (.7 * dwG(d * 5.5) + .16 * exp(-d * 2.6) + .3 * exp(-abs(l.y) * 26. - d * 1.8)) * (.75 + .7 * uMic);
 return mix(c, vec3(1., .97, .86), dwIn(d - .075, px)) + vec3(.22, .16, .08) * dwG(q.x * 1.3) * dwG(q.y * 2. + 1.1) * dwE(.2, -.1, q.y);
}
vec3 dwA(vec2 p) {
 float hi = uOwn[4], near = uOwn[5], sn = max(uOwn[2], 0.), gr = max(-uOwn[2], 0.);
 dwHor = -.21 + (hi > 0. ? .2 : .13) * hi;
 float cam = exp(.55 * hi), over = p.x - dwVx, size = (1. + .13 * uLevel) * exp(near > 0. ? .42 * near : .95 * near);
 vec3 col = mix(dwSkyB, dwSkyA, dwE(dwHor - .04, dwHor + .6, p.y)) + .04 * (noise(vec2(p.x * 2. + p.y * 3. - uTime * .004, p.y * 14.)) - .5);
 float ex = p.x;
 if (dwGap > 0. && p.x > dwV) ex = dwV - (p.x - dwV) * (1. + .18 * dwGap);
 float D = max(dwV - ex, .02), big = pow(D, 1.55) * min(size, 1.2);
 if (dwFlat > 0.) { D = mix(D, 1.5, dwFlat); big = mix(big, 1.05, dwFlat); }
 float foot = dwHor - .022 * big;
 vec2 pw = p;
 bool wet = dwWet > 0. && p.y < foot;
 if (wet) { float rh = foot - p.y; pw.y = foot + rh * (1. - .06 * dwWet); pw.x += dwWet * (.02 + rh * .12) * (noise(vec2(p.x * 7. + uTime * .05, 2.4 / (rh + .03) + uTime * .16)) - .5) * (.6 + .8 * uLow); }
 vec4 w = dwWall(pw, size, (.3 + .12 * uLevel) * (1. + .3 * max(near, 0.)));
 // thin dust blown across the face of it
 w.rgb = mix(w.rgb, w.a * mix(dwMid, dwHi, .15 + .2 * p.y), .36 * dwE(.45, .85, noise(vec2(p.x * 2.6 - p.y - uTime * .02, p.y * 4.6 - p.x * 1.5 - uTime * .008))));
 vec2 bo = dwBolt(p, vec2(-.3 + .1 * sin(uTime * .05), dwHor + .36 * size), .15);
 w.rgb += w.a * ((w.rgb + .1) * mix(vec3(.9, .75, .8), uKind[4], .3) * bo.y + vec3(.5, .42, .5) * bo.x);
float h = dwHor - p.y, gust = -.75 + 2.3 * (1. - uCue);
 float T = uTravel * .12;
 if (h > .0008) {
  // the plain: straw in rows that run to where the road ends
  float z = cam / h, wx = over * z, wz = z - T, pz = z * dwPx * (1. + abs(wx) / cam), n1 = dwN(vec2(wx * 1.7, wz * .5));
  float n2 = dwN(vec2(wx * 22., wz * 4.)) - .5, n4 = dwN(vec2(wx * 60., wz * 9.)) - .5; n2 *= dwG(pz * 12.); n4 *= dwG(pz * 32.);
  float tex = .5 + .2 * cos(TAU * wx * 2.6) * dwG(pz * 8.) + .3 * n1 + .4 * n2 + .5 * n4 + .5 * (dwN(vec2(wx * .11, wz * .05)) - .5);
  vec3 lit = mix(mix(mix(vec3(.64, .48, .22), vec3(.95, .84, .53), tex), mix(vec3(.28, .4, .13), vec3(.66, .74, .33), tex), gr), mix(vec3(.74, .78, .82), vec3(.99, .98, .96), tex), sn) * dwSun;
  // the road
  float rx = abs(wx - 1.83), rd = dwE(.48 + pz, .38 - pz, rx + .06 * n1) * (1. - dwE(.3, .9, dwBare)) * (1. - dwWet), keep = dwG(pz * 6.), rt = .6 + .4 * n2 + .4 * n4 + .2 * n1 - .18 * dwG((rx - .2) / .07) * keep;
  lit = mix(lit, mix(vec3(.66, .52, .38), vec3(.99, .9, .75), rt) * dwSun, rd * (1. - .5 * sn)) * (1. - .3 * dwG((rx - .6) / .09) * keep * (1. - dwBare));
  vec3 dim = lit * mix(vec3(.47, .39, .42), vec3(.55, .56, .68), sn);
  // the wall's shadow, and the piece as light let through
  float edge = .84 - 2.3 * h - .1 * near + .16 * (noise(vec2(h * 22., 3. + uTime * .006)) - .5);
  float sh = dwE(edge + .02 + .25 * h, edge - .02 - .35 * h, p.x);
  if (dwFlat > 0.) sh = mix(sh, dwE(.2, .1, h + .5 * (edge - .84 + 2.3 * h)), dwFlat);
  if (dwGap > 0.) sh = mix(sh, dwE(.1, .3 + h, abs(p.x - dwV - .3 * h + .4 * (edge - .84))), dwGap);
  vec2 uv = vec2(p.x * .52 + .5, h / (dwHor + .5)); vec4 pm = piece(clamp(uv, .002, .998)) * dwE(0., .06, uv.x) * dwE(1., .94, uv.x);
  vec3 g = mix(mix(lit, dim, sh), lit * (.6 + .8 * pm.rgb), min(pm.a, 1.) * (dwGl - .05) * (.4 + .5 * sh) * dwE(0., .05, h));
  g = mix(g, lit * 1.08, uCue * dwG((p.x - .3 * h - gust) / .28) * (.35 + .5 * dwN(vec2(wx * 1.2 - uTime * .4, z * .7))));
  g = mix(g, mix(mix(dwSkyB, lit, .4), mix(dwLo, dwMid, .6), dwE(.75, -.1, p.x - 1.2 * max(dwFlat, dwGap))), exp(-h * mix(60., 24., uSpace)) * .85);
  if (dwWet > 0.) {
   // the plain under water: sky and wall again, a little darker, and the bottom near by
   vec3 sky = mix(dwSkyB, dwSkyA, dwE(-.04, .6, h));
   vec3 m = mix(sky, w.rgb / max(w.a, 1e-3), wet ? w.a : 0.) * .9;
   m = mix(m, g * .55, .12 + .5 * dwE(.1, .6, h / cam)) + .05 * sky * dwN(vec2(p.x * 3., 3. / (h + .03) + uTime * .2));
   g = mix(g, m, dwWet * .92); if (wet) w.a *= 1. - dwWet;
  }
  // dust running ahead of the foot
  float gt = dwN(vec2(p.x * 5. - uTime * .22 - h * 9., h * 70.)) * dwN(vec2(p.x * 2. - uTime * .13, h * 24. + 7.));
  col = mix(g, mix(dwMid, dwHi, .35), sat((gt - .22) * 2.6) * (.16 + .7 * uTexture + .2 * max(uOwn[3], 0.)) * dwE(.27, .02, h) * dwE(.8, .1, p.x));
 }
 if (!wet) col = mix(col, w.rgb / max(w.a, 1e-3), w.a * dwE(foot - .012, foot + .004, p.y));
 // the foot boils along the ground and throws tongues ahead
 float sk = (p.y - foot) / (.09 * big);
 if (abs(sk - .5) < 2.) {
  vec2 q = vec2(mix(-log(D) * 4.5, p.x * 4.5, dwFlat) - sk * .2 - uTime * .012, sk * .8 - uTime * .015), v1, v2;
  float h1 = dwHeads(dwTurn * q * 1.5, uTime * .01, v1), h2 = dwHeads(q * 3.8 + v1, 0., v2), top = .55 + 1.3 * (h1 - .4) + .4 * (h2 - .5) - sk;
  float v = sat(.3 + .5 * v1.y + .18 * v2.y - .2 * v1.x) * (.75 + .3 * dwE(1.2, 0., sk));
  vec3 c = mix(mix(mix(dwLo, dwMid, .25), mix(dwMid, dwHi, .3), v), mix(dwSkyB, dwMid, .4), .7 * exp(-D * 2.));
  col = mix(col, c, dwE(0., .55, top) * dwE(-.8, -.05, sk + .5 * h1 - .3) * .9 * dwE(.05, .3, D));
 }
 // the wires, then the poles, each a little aslant
 const float z0 = 1.3, S = 3.1, Xp = 3.3, Hp = 2.95;
 float ph = fract(T / S); vec3 ink = mix(vec3(.12, .085, .075), dwLo * .6, .5);
 if (dwBare < .7 && over > .012 && h < 0.) for (int s = -1; s <= 1; s += 2) {
  float z = (Xp + .24 * float(s)) / over, u = fract((z - z0) / S - ph), y = dwHor + (Hp - cam - .75 * u * (1. - u)) / z;
  float sl = (Hp - cam - .75 * u * (1. - u)) / (z * over) + .75 * (1. - 2. * u) / (S * over), dd = abs(p.y - y) / sqrt(1. + sl * sl);
  col = mix(col, ink + uKeys * vec3(.6, .66, .7) * dwG((fract(u * 2. + .3) - .5) * 7.), dwIn(dd - max(.011 / z, dwPx * .55), dwPx * 1.4) * .75 * (1. - dwE(.2, .7, dwBare)) * exp(-z * .03) * min(1., .015 / z / dwPx + .35));
 }
 for (int i = 11; i >= 0; i--) {
  float z = z0 + S * (float(i) + ph), fy = dwHor - cam / z, x = over - Xp / z;
  if (abs(x) > (.5 + 2.1 * dwBare) / z) continue;
  float id = hash11(mod(float(i) - floor(T / S), 64.) + 3.), px = dwPx * z;
  vec2 q = vec2(x - (id - .5) * .05 * (p.y - fy), p.y - fy) * z, a;
  float deep = 1.;
  if (dwWet > 0. && q.y < 0.) { deep = 1. - .35 * dwWet; q.x += .12 * dwWet * (noise(vec2(p.x * 5., q.y * 9. + uTime * .9)) - .5); q.y = mix(q.y, -q.y, dwWet); }
  a = vec2(abs(q.x), q.y);
  float e = min(dwBox(q, vec2(0., 1.53), vec2(.05 - .004 * q.y, 1.53)), dwBox(q, vec2(0., Hp - .06), vec2(.31, .03)));
  e = min(e, min(dwBox(a, vec2(.24, Hp + .02), vec2(.022, .06)), dwSeg(a, vec2(0., Hp - .38), vec2(.2, Hp - .08)) - .014));
  if (dwBare > 0.) {
   // a tree the wind has bent, its crown streaming away from the wall
   vec2 u = q - vec2(.12 * q.y * q.y * dwBare * .4, 0.), v = u - vec2(.5, 1.75 + .5 * id);
   v += (.34 * (vec2(noise(q * 3.3 + id * 40.), noise(q * 3.3 + 9. + id * 40.)) - .5) + .2 * (vec2(noise(q * 9. + id * 9.), noise(q * 9. + 30.)) - .5));
   float crown = length(v * vec2(.66, 1.12)) - .7 * dwBare;
   e = mix(e, min(dwBox(u, vec2(0., .9), vec2(.08 - .02 * u.y, .95)), crown), dwE(0., .6, dwBare));
   ink = mix(ink, (vec3(.16, .17, .08) * (.5 + 1.5 * dwE(-.35, .55, v.x * .7 + v.y + .4 * dwN(q * 8. + id * 9.))) ) * mix(dwSun, vec3(1.), .2) + dwLo * .12 + .5 * sn * dwSun * dwE(-.1, .5, v.y + .3 * (dwN(q * 11. + id * 9.) - .5)), dwBare * step(.5, q.y) * .9);
  }
  vec3 c = mix(ink, vec3(.5, .36, .24) * dwSun, dwE(.01, .05, q.x) * dwE(6.5, 3., z) * .75 * (1. - dwBare));
  col = mix(col, mix(c, mix(dwLo, dwMid, .5), 1. - exp(-z * .022)), dwIn(e, px * 1.2) * dwE(36., 24., z) * deep);
 }
 if (max(dwBare, dwWet) < .6) col = mix(dwVan(col, p, cam, 9. + .7 * sin(uTime * .05)), col, dwE(.1, .6, max(dwBare, dwWet)));
 // the grass at our feet, laid by a gust
 float up = p.y + .53;
 if (up < .17 && dwWet < .8) {
  float gx = p.x - (.4 + .4 * sin(uTime * .5 + p.x * 4.) + 16. * uCue * (1. - uCue) * dwG((p.x - gust) / .3)) * up * up, c0 = floor(gx * 84.);
  for (int j = -1; j <= 1; j++) {
   float id = c0 + float(j), a = hash11(id), b = fract(a * 57.31), tall = .14 * (.35 + .65 * b) * (.55 + .6 * noise(vec2(id * .035, 1.))), s = sat(up / tall);
   float al = dwIn(abs(gx - (id + .5 + (a - .5) * .8) / 84. - (b - .5) * .05 * s * s) - .0027 * (1. - s * s) * (.7 + .5 * a), dwPx * 1.3) * dwE(tall, tall * .93, up);
   vec3 g = mix(vec3(.6, .45, .25), vec3(.98, .86, .55), b) * mix(.38, 1., dwE(.05, .3, p.x)) * (.55 + .45 * s) * dwSun;
   col = mix(col, mix(mix(g, g * vec3(.62, .85, .5), gr), g * .6 + .2, sn), al * (1. - dwE(.5, .9, hi)) * (1. - dwE(.2, .8, dwWet)));
  }
 }
 return col;
}
// Grit: short streaks going by, row by row.
float dwGrit(vec2 p, vec2 sc, float sp, float len, float seed) {
 vec2 g = p * sc; float row = floor(g.y), hr = hash11(row + seed);
 g.x -= uTime * sp * (.7 + .6 * hr) - hr * 37.;
 float id = floor(g.x); vec2 h = dwPair(vec2(id, row + seed)), f = fract(g);
 return dwE(1., 0., abs(f.x - .5) / (len * (.3 + .7 * h.x))) * dwG((f.y - .3 - .4 * h.y) * 6.) * dwE(.45, .9, fract(h.x * 7.7 + h.y * 3.3));
}
vec3 dwB(vec2 p) {
 float wl = -.31 + .06 * uOwn[4], wet = dwWet * dwE(wl + .004, wl - .004, p.y);
 if (dwWet > 0. && p.y < wl) { float rh = wl - p.y; p.y = wl + rh * (1. - .1 * dwWet); p.x += dwWet * (.004 + rh * .1) * (noise(vec2(p.x * 6. + uTime * .04, 1.8 / (rh + .03) + uTime * .15)) - .5); }
 float den = exp(.8 * uOwn[2] + .4 * (.5 - uSpace)), z = exp((uOwn[4] > 0. ? .4 : .55) * uOwn[4]), big = exp(.95 * uOwn[5]), slow = uTime * .011 + uTravel * .008;
 vec3 top = mix(dwHi, dwMid, .12) * vec3(1., 1.02, .88), mid = dwMid * 1.13, bot = mix(dwLo, dwMid, .38) * vec3(1., .8, .68);
 float wob = noise(p * vec2(1.3, 2.2) + vec2(-slow * 2., slow)) - .5, y = p.y + .16 * wob + .5 + .06 * uLevel;
 vec3 col = mix(mix(bot, mid, dwE(0., .48, y)), top, dwE(.4, 1.02, y));
 // the sun, small and blue, seen when the dust lets it
 float sr = .03 * big, sd = length(p - vec2(-.25, -.03 - .04 * uOwn[5] + .2 * max(-uOwn[5], 0.) + .4 * dwFlat)), veil = .62 + .55 * noise(p * 3.1 + vec2(-slow * 5., 2.));
 vec3 blue = dwHour(vec3(.8, .91, .96), vec3(1.2, .93, .75), vec3(.9, .98, 1.1)) * (1. - .22 * max(uOwn[1], 0.));
 col = mix(col, blue, (.3 * exp(-sd * 7. / big) + .22 * exp(-sd * 2.2)) * veil * (.75 + .4 * uPhrase + .6 * uMic) * (1.2 - .2 * den));
 col = mix(col, blue, dwE(sr + .004, sr - .004 - dwPx, sd) * sat(1.35 * veil + .05 - .2 * den));
 vec4 pm = piece(vec2(sat(p.x * .52 + .5), sat(.5 - p.y))) * dwE(.95, .8, abs(p.x));
 col = mix(col, col * (.8 + .6 * pm.rgb) + .08 * pm.rgb, min(pm.a, 1.) * dwGl);
 // far to near: five banks of dust and what stands between them
 vec2 q = (p - vec2(.06, -.3)) * z + vec2(.06, -.3); float px = dwPx * z;
 vec3 ink = bot * .24 + vec3(.018, .009, .009);
 for (int k = 0; k < 5; k++) {
  float fk = float(k), d = 9., see = 1.;
  if (k == 1) { // water tower
   vec2 u = q - vec2(.04, -.15); see = exp(-1.6 * den) * (1. - dwFlat);
   if (abs(u.x) < .2 && dwBare < .8) {
    u.x = abs(u.x); d = min(dwBox(u, vec2(0., .18), vec2(.077, .068)), max(u.y - .335 + .75 * u.x, .243 - u.y));
    d = min(d, dwSeg(u, vec2(.056, .12), vec2(.09, -.18)) - .0055);
    d = min(d, min(dwBox(u, vec2(0., -.035), vec2(.075, .003)), dwBox(u, vec2(0.), vec2(.006, .13))));
    d = min(d, abs(dwSeg(vec2(abs(u.y - .035) - .07, u.x), vec2(-.07, 0.), vec2(0., .068))) - .0025);
   }
  }
  if ((k == 2 || k == 3) && dwBare < .8) { // two poles and their wire
   bool n = k == 3; float s = n ? 1. : .62; vec2 u = (q - (n ? vec2(-.58, -.27) : vec2(-.13, -.2))) / s; see = exp((n ? -.62 : -1.15) * den); u.x -= (n ? .03 : -.02) * u.y;
   vec2 a = vec2(abs(u.x), u.y);
   d = min(dwBox(u, vec2(0., .2), vec2(.0105 - .004 * u.y, .42)), dwBox(u, vec2(0., .55), vec2(.075, .007)));
   d = s * min(d, min(dwBox(a, vec2(.06, .567), vec2(.005, .014)), dwSeg(a, vec2(0., .48), vec2(.05, .545)) - .003));
   if (n) { float x = (q.x + .58) / .45, wy = x < 0. ? .283 + .12 * x * x - .12 * x : mix(.283, .146, x) - .1 * x * (1. - x); d = min(d, max(abs(q.y - wy) - max(.0015, px * .4), x - 1.)); }
  }
  if (k == 2 && dwGap > 0.) for (int c = 0; c < 4; c++) {
   // pillars of whirling dust, flared at the head
   float fc = float(c), ds = .55 + .3 * fract(fc * .618 + .2), y0 = p.y + .34 - .05 * fc, u = y0 + .04 * sin(uTime * .11 + fc * 2.);
   float cx = -.62 + .46 * fc + .09 * sin(fc * 5.) + .07 * sin(y0 * 4. + uTime * .13 + fc * 1.7) + .03 * sin(y0 * 11. - uTime * .21 + fc) + .04 * sin(uTime * .037 + fc * 3.);
   float ww = ds * (.018 + .05 * y0 + .28 * max(y0, 0.) * max(y0, 0.)) * (1. + .12 * uLow), x = (p.x - cx) / max(ww, .004);
   float tw = dwN(vec2(asin(clamp(x, -1., 1.)) * 1.6 + y0 * 9. / ds - uTime * .5 * (.6 + .3 * ds), y0 * 5. - uTime * .06 + fc * 7.)) + .5 * dwN(vec2(x * 3. + y0 * 23. - uTime * .9, y0 * 17. + fc * 5.)) - .75;
   float body = dwE(1.25, .55, abs(x) + .3 * tw) * dwE(-.02, .05, y0) * dwE(1.1, .5, y0 + .25 * tw);
   float skirt = dwG(length((vec2(p.x - cx, y0 + .01)) / vec2(.13 * ds, .04)));
   vec3 pc = mix(mix(bot * .8, mid, dwE(-1., .6, -x + tw)), top, .75 * dwE(.1, 1.1, -x + 1.2 * tw)) ; float lvc = dwLv[c];
   pc = mix(pc, pc * (.65 + .75 * uKind[c]) , lvc * dwGl);
   col = mix(col, pc, dwGap * max(body * (.55 + .4 * ds), .5 * skirt) * exp(-.25 * den));
  }
  if (k == 4 && dwBare > 0.) {
   // one bare tree, its boughs all gone the way of the wind
   vec2 u = q - vec2(.3, -.42); see = exp(-.2 * den) * dwE(.05, .4, dwBare);
   u.x -= .35 * u.y * u.y + .03 * sin(u.y * 9.);
   float sc = 1., L = .2 * (.5 + .5 * dwBare), th = .02;
   for (int b = 0; b < 8; b++) {
    float s = sat(u.y / L);
    d = min(d, (length(u - vec2(0., s * L)) - th * (1. - .36 * s)) / sc);
    u.y -= L * .96; 
    float sd2 = u.x < 0. ? -1. : 1.;
    u.x = abs(u.x); u = rot(-(.42 + .16 * sin(float(b) * 2.3) - .2 * sd2)) * u;
    float gw = 1.3 - .17 * sd2; u *= gw; sc *= gw; L *= 1.02; th *= .98;
   }
  }
  if (k == 4 && dwBare >= .8) {
   float gy = -.4 + .035 * (noise(vec2(p.x * 2.3, 4.)) - .5), g = dwE(gy + .1, gy - .12, q.y);
   col = mix(col, bot * .55, .6 * see * g);
  }
  if (k == 4 && dwBare < .8) { // gate and fence
   vec2 u = q - vec2(.16, -.33); see = exp(-.2 * den);
   d = min(dwBox(u - vec2(.02 * u.y, 0.), vec2(-.02, -.02), vec2(.0135, .22)), dwBox(u + vec2(.05 * u.y, 0.), vec2(.47, -.03), vec2(.0145, .23)));
   vec2 v = vec2(u.x, u.y + .03 * u.x), m = vec2(abs(u.x - .215), v.y); float r = v.y + .1; r -= clamp(floor(r / .058 + .5), 0., 4.) * .058;
   d = min(d, min(max(abs(r) - .0072, m.x - .215), min(dwBox(m, vec2(.21, .016), vec2(.007, .13)), dwSeg(m, vec2(.205, -.09), vec2(0., .13)) - .0055)));
   // the fence going off to the left, and near to the right
   bool away = u.x < 0.;
   if (away || u.x > .47) {
    float fx = away ? -u.x : u.x - .47, sc = away ? 1. / (1. + fx * 2.2) : 1. + fx * .9, n = away ? -log(sc) * 4.3 : fx * 4.6, i = floor(n + .5);
    float cx = away ? (exp(i / 4.3) - 1.) / 2.2 : i / 4.6, yb = away ? -.1 - .1 * sc : -.22 - .06 * fx;
    if (i > .5) d = min(d, max(abs(fx - cx - (hash11(i + (away ? 5. : 60.)) - .5) * .12 * (u.y - yb)) - .009 * sc, max(u.y - yb - .34 * sc, yb - .2 - u.y)));
    for (int s = 0; s < 3; s++) {
     float b = 2. * fract(n) - 1., ws = abs(u.y - yb - sc * (.114 + .085 * float(s) + .016 * b * b)); d = min(d, ws - max(.0016 * sc, px * .4));
     col += vec3(.6, .8, 1.) * uKeys * dwG(ws * 200.) * dwG((fract(n * 2. + float(s) * .37) - .5) * 14.) * .7;
    }
    if (away) see *= exp(-fx * 1.5 * den);
   }
   // the ground, no more than a darkening
   float gy = -.4 + .035 * (noise(vec2(p.x * 2.3, 4.)) - .5), g = dwE(gy + .1, gy - .12, q.y);
   col = mix(col, bot * .55, .6 * see * g) + (top - bot) * .16 * g * sat(noise(vec2(p.x * 3. - uTime * .05 - q.y * 8., q.y * 60.)) * 2. - .9);
  }
  if (dwBare > 0. && dwBare < .8) see *= 1. - dwE(.3, .8, dwBare) * (k == 4 ? 0. : 1.);
  if (d < px * 4.) col = mix(col, ink, dwIn(d, px * (1.2 + .7 * (4. - fk))) * see * (.8 + .35 * wob));
  // the bank in front of it: lit along its crest, dark under it
  float e = .33 - .17 * fk - p.y + (.2 + .1 * uLow) * (noise(vec2(p.x * 1.5 - slow * (1.5 + fk) + fk * 9.7, fk + slow * .5)) - .5) + .07 * (noise(vec2(p.x * 4.6 - slow * (3. + fk) + fk * 5., fk * 3.)) - .5) + .05 * (band((fk + .5) / 5.) - .2);
  e += .05 * (noise(p * vec2(9., 13.) + vec2(-slow * 9., fk * 7. + slow * 3.)) - .5);
  float body = dwE(-.07, .05, e), lv = dwLv[k];
  if (dwFlat > 0.) {
   float e2 = e - .2 * (1. - .25 * fk) + (fk > 3.5 ? .07 : .2) * (dwN(vec2(p.x * (1.9 + .5 * fk) + fk * 13., 2.)) - .5) + .06 * (dwN(vec2(p.x * 8. + fk * 5., 4.)) - .5) + .015 * dwN(vec2(p.x * 34., fk));
   vec3 rc = mix(mix(top, mid, dwE(0., 3., fk)), bot * (1.1 - .55 * dwE(2., 4.5, fk)), dwE(.8, 4., fk));
   rc = mix(rc, rc * (.62 + .75 * uKind[k]) + .05 * uKind[k], dwLv[k] * dwGl * .8);
   rc = mix(rc, mix(top, mid, .3), .75 * dwE(0., .26, e2));
   col = mix(col, rc, dwFlat * dwE(-dwPx * (1. + 3. * (4. - fk)) - .002, dwPx, e2) * .96);
  }
  col *= mix(vec3(1.), vec3(.8, .77, .76), body * (.2 + .4 * uTone) * dwE(0., .22, e));
  vec3 lt = mix(top, mid, .12 + .16 * fk); lt = mix(lt, lt * (.62 + .75 * uKind[k]) + .05 * uKind[k], lv * dwGl);
  col = mix(col, lt, body * exp(-max(e, 0.) * 7.) * (.2 + .25 * lv * dwGl * 1.6) * (.6 + .4 * den));
 }
 if (wet > 0.) col = mix(col * vec3(.8, .8, .82), bot * .5, .1 * wet) + .04 * top * dwN(vec2(p.x * 3., 2. / (p.y - wl + .03) + uTime * .2));
 // a gust, and a hit inside the dust
 col = mix(col, mix(top, vec3(1.), .12), dwG((p.x - .5 * p.y + .8 - 2.4 * (1. - uCue)) / .33) * uCue * (.3 + .6 * dwN(p * vec2(4., 9.) - vec2(uTime * .8, 0.))));
 vec2 bo = dwBolt(p, vec2(.42 + .1 * sin(uTime * .05), .2), .2);
 col += (col * .6 + .1) * (vec3(1., .9, .85) * bo.x * .5 + mix(vec3(1., .85, .7), uKind[4], .3) * bo.y * .6) * (.7 + .6 * wob);
 // the weed, going over and over
 float wx = -1.4 + 2.8 * fract(uTime / 47. + .05), hop = fract(wx * 1.7); vec2 u = (p - vec2(wx, -.39 + .28 * hop * (1. - hop))) / .068;
 if (dot(u, u) < 1.6) {
  u = rot(wx * 12.) * u; float dk = 0., r = length(u); u += .12 * (vec2(noise(u * 4. + 3.), noise(u * 4. + 11.)) - .5);
  for (int i = 0; i < 11; i++) {
   float fi = float(i); vec2 v = rot(fi * 1.37) * (u + .1 * (hash11(fi + 4.) - .5)); v.x *= 1. + .9 * hash11(fi + 2.); v.y -= .25 * (hash11(fi + 9.) - .5);
   dk = max(dk, dwIn(abs(length(v) - .55 - .38 * hash11(fi + 5.)) - .018, dwPx * 20.) * (.45 + .55 * hash11(fi)));
  }
  col = mix(col, ink * 1.15, max(dk, dwE(1., .2, r) * (.15 + .35 * noise(u * 9.))) * .95 * dwE(1.15, .95, r) * exp(-.25 * den));
 }
 // grit
 vec2 gp = rot(.1) * p; float hard = max(uOwn[3], 0.), am = (.22 + .6 * uTexture + .7 * hard) * (1. - .9 * max(-uOwn[3], 0.)), ln = .22 + .24 * hard;
 col *= 1. + hard * .2 * (dwN(vec2(gp.x * 1.4 - uTime * .3, gp.y * 24.)) + dwN(vec2(gp.x * 3. - uTime * .5, gp.y * 70.)) - 1.);
 col = mix(col, mix(top, vec3(1.), .25), dwGrit(gp, vec2(7., 150.), .9, ln, 3.) * .45 * am);
 col = mix(col, bot * .8, dwGrit(gp + .3, vec2(3.4, 80.), .7, ln, 40.) * .35 * am);
 return mix(col, mix(mid, top, .6), dwGrit(gp + .7, vec2(1.7, 24.), .5, ln * 1.4, 90.) * .3 * am);
}
vec3 render(vec2 p) {
 dwPx = 1. / max(uRes.y, 1.);
 dwLight();
 return sat(uVar > .5 ? dwB(p) : dwA(p));
}
