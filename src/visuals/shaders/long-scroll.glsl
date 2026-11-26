// name: Long scroll
// a: Handscroll
// b: Folding screen
// what: A paper scroll lies open on a pale table between two thick rolls; on it a mountain river in a few tones of ink, its mist left as bare paper; or a folding screen of six leaves stands zigzag on a dark floor, dull gold in squares, and the river runs over the folds in blue, green and ink, one leaf in light and the next in shade.
// follows: The loop winds the scroll out and back, one roll thins as the other fattens, or moves the lamp. Drones darken the far ridges, pads let the mist in, texture the reeds, phrases ink the branch and its blossom, bands raise the peaks. The piece tints the paper. A hit drops ink on the rocks, a cue lays a wet stroke, keys darken the birds, a voice warms the light.
const vec3 LSI = vec3(.085, .083, .095), LSK = vec3(.2, .215, .235); // ink; light from the sky
vec3 lsSun, lsC, lsG, lsMul = vec3(1), lsAdd = vec3(0); // the painting so far, the bare ground under it, the light on it
vec2 lsAt; bool lsOn = false, lsLeaf;             // where in the painting we are, if in it; on gold leaf or on paper
float lsPx, lsMid = 0., lsBody = 0.;              // a pixel; the middle of the view; the near rocks
float lsS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float lsN(float x, float y) { return noise(vec2(x, y)); }
float lsIn(float d) { return lsS(-lsPx, lsPx, d); }
// Ink goes into the paper: it takes light away.
void lsLay(vec3 ink, float a) { lsC *= mix(vec3(1.), ink, sat(a)); }
// A pigment: opaque on leaf, thin on paper.
void lsPut(vec3 c, float a) { if (lsLeaf) lsC = mix(lsC, c, sat(a * 1.8)); else lsLay(c, a); }
vec3 lsTint(int k, float a) { return mix(LSI * 1.4, uKind[k] * uKind[k] * .8 + .03, a); }
// A brush line of half width w; one finer than a pixel goes pale instead of breaking.
float lsLine(float d, float w) { float e = .75 * lsPx; return lsS(w + e, max(w - e, 0.), d) * min(1., .35 + w / (2. * lsPx)); }
float lsSeg(vec2 p, vec4 e, float wa, float wb) {
 vec2 d = e.zw - e.xy, q = p - e.xy;
 float h = sat(dot(q, d) / dot(d, d));
 return lsLine(length(q - d * h), mix(wa, wb, h));
}
// Dabs of the tip of the brush, one in a cell, loose in it.
float lsDab(vec2 q, float many, float size) {
 vec2 id = floor(q), j = hash22(id + .5);
 float r = size * (.5 + .5 * j.y);
 return step(fract(j.x * 7.3), many) * (.35 + .65 * fract(j.y * 5.1)) * lsS(r + .1, r - .1, length(q - id - mix(vec2(r), vec2(1. - r), j)));
}
// A mountain or rock: bare paper, a brush line round its top, a shoulder, falling lines, a wash
// on the shaded side, dots of moss; all of it thins to nothing downward.
void lsHill(vec2 s, float xi, float wi, float base, float hi, float seed, float tone, float thin, vec3 hue) {
 float t = (s.x - xi) / wi, lean = .5 * fract(seed * .731) - .25;
 t /= t < 0. ? 1. + lean : 1. - lean;
 float m = 1. - abs(t);
 if (m <= 0. || s.y > base + hi * 1.3 + .05) return;
 float n = lsN(s.x * 2.7 + seed, s.y * 1.6 + seed) - .5, rag = abs(2. * lsN(s.x * 7.5 + seed, s.y * 1.5) - 1.);
 float sharp = .25 + .5 * fract(seed * .37), near = lsS(0., .3, m);
 float d = base + hi * mix(m * m * (3. - 2. * m), m, sharp) + (.42 * hi * n - .15 * hi * rag * rag) * near - s.y;
 if (d < -.05) return;
 float dd = max(d, 0.), deep = dd / hi, up = length(vec2(1., hi / wi * mix(6. * m * (1. - m), 1., sharp)));
 float body = lsIn(d) * near, fade = body * tone * exp(-dd * thin) * lsS(1.15, .75, deep);
 lsC = mix(lsC, lsG, body * lsS(1., .3, deep));
 if (s.y < -.45) lsBody = max(lsBody, body);
 float m2 = 1. - abs(t - (fract(seed * 1.93) < .5 ? -.34 : .34)) / .55;
 float d2 = m2 > 0. ? base + hi * m2 * (1.05 - .35 * m2) * (.8 + .5 * n - .35 * rag) - s.y : -1.;
 float side = lsS(-.45, .75, t + n * 1.8 + .5 * lsS(0., -.12, d2) * lsS(-.3, -.12, d2));
 lsPut(hue, fade * (.14 + .8 * side) * (.65 + .7 * lsN(s.x * 25. + seed, s.y * 31.)));
 float far = .35 + .9 * deep;
 float hair = .25 * rag + .75 * lsN((t + .3 * n) * 21. / far + seed * 3., deep * 7. + seed);
 lsLay(LSI, .75 * fade * lsS(.5, .68, hair) * (.15 + .85 * side));
 float dry = lsN(s.x * 9. + seed, s.y * 9.), w = (.003 + .013 * dry * rag) * (.7 + .6 * tone);
 dry = lsS(.25, .45, dry);
 lsLay(LSI, lsLine(abs(d) / up, w) * min(1., 1.15 * tone + .08) * (.2 + .8 * dry) * near);
 lsLay(LSI, lsLine(abs(d2) / up, w * .8) * sqrt(tone * fade) * (.1 + .8 * dry) * lsS(.02, .35, m2));
 lsLay(LSI, 1.3 * tone * exp(-dd * 8.) * body * lsDab(vec2(s.x * 22. + seed, d * 24.), .4, .36));
}
// The far peaks, each one band, the even ones in front; low down, the rocks of the near bank.
void lsLand(vec2 s, int i, float k, float mid, float r3) {
 int bi = (lsLeaf ? 2 * i : i) & 15;
 float fi = float(i), front = float(1 - (i & 1)), r = hash11(fi + 3.3), r2 = hash11(fi * 1.7 + 9.1), many = lsS(-.5, .6, sin(fi * .83 + 1.) + .4 * sin(fi * 2.1)), lv = .7 * uBands[bi] + .3 * uBands[(bi + 1) & 15];
 vec4 e = vec4((fi + .3 + .4 * r) * .56, .35 + .33 * r2, -.14 - .16 * front, .14 + many * (.16 + .34 * r) + (.2 + .45 * r2) * lv);
 vec3 f = vec3(r * 91., (.1 + many * (.16 + .3 * r2) + .55 * lv) * (.65 + .5 * front), 4.), hue = lsLeaf ? mix(r2 > .5 ? vec3(.05, .13, .27) : vec3(.08, .27, .20), lsTint(1, .8), .2) : mix(vec3(.15, .16, .2), lsTint(1, .7), .35);
 if (s.y < -.45) {
  e = vec4(mid - 1.35 + .62 * k, .75 - .1 * k, -1.1, .48 - .12 * k + .06 * r3);
  f = vec3(13. + 29. * k + r3 * 40., .75 + .06 * k, 2.6 + .6 * k);
  hue = lsLeaf ? vec3(.07, .22, .15) : LSI * 1.3;
 }
 lsHill(s, e.x, e.y, e.z, e.w, f.x, f.y, f.z, hue);
}
// Trunk and twigs, in hundredths: the bare tree, then the branch that comes in over the top.
const vec4 LST[18] = vec4[18](vec4(0, -10, 5, 20), vec4(5, 20, -3, 50), vec4(-3, 50, 7, 78), vec4(5, 22, 28, 42), vec4(28, 42, 44, 44), vec4(20, 35, 27, 60), vec4(-1, 46, -26, 62), vec4(-15, 55, -20, 74), vec4(2, 60, 20, 70),
 vec4(0, 10, -30, -13), vec4(-30, -13, -75, -20), vec4(-75, -20, -105, -42), vec4(-105, -42, -145, -46), vec4(-40, -15, -62, -50), vec4(-62, -50, -60, -68), vec4(-85, -27, -115, -20), vec4(-105, -42, -120, -62), vec4(-20, -5, -12, -35));
// The mountain river: s.x along the paper, s.y from -1 to 1, g the bare paper or leaf there.
vec3 lsPaint(vec2 s, vec3 g) {
 lsC = lsG = g;
 float x = s.x, y = s.y, t = uTime;
 float mist = .62 * lsN(x * .7 + t * .011, y * 2.4 + t * .006) + .38 * lsN(x * 1.9 - t * .014, y * 6.);
 float open = lsS(1., -1., (mist - (lsLeaf ? .7 : .64) + .17 * uPad + .1 * (uSpace - .5)) / (lsLeaf ? .03 : .16));
 // two far ridges, only wash
 vec2 e2 = vec2(.32, .19) - .12 + .5 * vec2(lsN(x * .55, 3.), lsN(x * .75 + 7., 3.)) + .13 * lsN(x * 2.1, 1.) + .025 * sin(x * 4. + 2. * sin(x * 2.7)) + .06 * uDrone - y;
 vec2 soft = .008 + vec2(.012, .008), wash = smoothstep(-soft, soft, e2) * exp(-3. * max(e2, 0.)) * (vec2(.2, .29) + uDrone * (.24 + .16 * uEnergy));
 lsLay(mix(vec3(.34, .37, .43), lsTint(0, .75), .4), (wash.x + wash.y) * (.7 + .6 * lsN(x * 9. + y * 5., y * 16.)) * (.3 + .7 * open));
 // what stands by the water comes again along the paper
 float cell = floor(x / 4.4), mid = cell * 4.4 + 2.2, r = hash11(cell + 5.7), cx = x - mid;
 int b = int(floor(x / .56)), odd = b & 1;
 lsLand(s, b - 1 + odd, 0., mid, r); lsLand(s, b + 1 - 2 * odd, 1., mid, r); lsLand(s, b + odd, 2., mid, r);
 lsC = mix(lsC, g, (1. - open) * .85 * lsS(.75, .2, y) * lsS(-.5, -.15, y));
 // a far bank of small trees, dabbed
 float clump = lsN(x * 1.3, 21.) - .42;
 if (clump > 0. && abs(y + .16) < .2) {
  float on = lsS(.03, -.03, y + .27 - .55 * clump - .05 * lsN(x * 9., 2.)) * lsS(-.31, -.2, y) * (.35 + .65 * open);
  lsLay(LSI * 2.5, on * (.2 + .2 * uTexture + .4 * lsN(x * 11., y * 15.)));
  lsLay(LSI, on * (.45 + .4 * uTexture) * max(lsDab(rot(.5) * s * 29., .5, .4), .6 * lsDab(rot(1.1) * s * 21., .6, .45)));
 }
 // the river, and a few level strokes that drift
 if (y < -.2) {
  float yy = y + .05 * sin(x * 1.7 + uTravel * .06) * (.6 + uLow), row = floor(yy * 14.), run = lsN(x * 1.5 - uTravel * (.06 + .02 * sin(row * 5.)), row * 3.7), wet = lsS(.03, -.12, y + .27 - .06 * lsN(x * 1.6, 7.)) * (1. - lsBody);
  if (lsLeaf) lsC = mix(lsC, mix(vec3(.035, .10, .17), lsTint(0, .7), .15), wet * (.7 + .25 * lsN(x * 1.2 - uTravel * .03, yy * 9.)) * (.92 + .08 * open));
  wet *= lsLine(abs(fract(yy * 14.) - .5 + .2 * sin(x * 3.1 + row * 2. - uTravel * .2)) / 14., .007 * run) * lsS(.6, .8, run);
  lsPut(lsLeaf ? g * 1.1 : LSI * 1.6, wet * .4);
 }
 vec2 q = vec2(cx, y), o = q - vec2(.75 + .5 * r + .03 * sin(t * .06 + r * 9.), -.36 + .006 * sin(t * .5 + r * 6.));
 // a boat
 if (abs(o.x) < .25 && abs(o.y) < .2) {
  float a = o.x * o.x * 34.6, roof = .045 - 10. * (o.x + .02) * (o.x + .02) - o.y;
  lsLay(LSI, .85 * lsIn(.045 * a - .012 - o.y) * lsIn(o.y - .03 * a + .035) * lsS(1.2, 1., a));
  lsPut(lsLeaf ? g * .8 : LSI, lsIn(roof) * lsIn(o.y + .012) * (.45 + .4 * lsS(.012, 0., roof)));
  lsLay(LSI, .8 * max(lsSeg(o, vec4(.06, .12, .17, -.1), .004, .003), lsSeg(o, vec4(.1, 0, .105, .065), .011, .007)));
 }
 // two trees on the rocks; high up, the branch that comes in over the top edge
 bool high = y > .2;
 o = q - (high ? vec2(1.1, 1.05 - .012 * sin(t * .33 + cell)) : vec2(.3 * r - .95, -.72)) + .014 * sin(q.yx * vec2(17., 13.) + vec2(cell, 2.)) + .007 * sin(q.yx * vec2(41., 37.));
 float k = 0., l;
 bool by = high ? o.x > -1.6 && o.x < .5 : o.x > -.45 && o.x < .6;
 if (by) for (int i = 0; i < 9; i++) {
  vec4 e = .01 * LST[high ? i + 9 : i];
  vec2 th = high ? 1. + .62 * e.xz : 1.05 - 1.2 * e.yw;
  th *= i < (high ? 4 : 3) ? .032 : .0155;
  if (i > (high ? 3 : 1)) th.y *= .33;
  k = max(k, lsSeg(o, e, th.x, th.y));
 }
 float foot = lsS(-.14, .0, o.y);
 lsLay(LSI, k * .85 * (high ? .5 + .6 * uPhrase : foot));
 if (high && by) {
  // the blossom
  vec3 u = vec3(1);
  for (int i = 0; i < 9; i++) {
   vec4 e = .01 * LST[i < 3 ? 14 : i < 6 ? 12 : 16];
   float h = fract(float(i) * .618 + .2);
   vec2 f = o - mix(e.xy, e.zw, .5 * float(i % 3)) - .05 * vec2(h - .5, fract(h * 7.) - .5);
   if (dot(f, f) < dot(u.xy, u.xy)) u = vec3(f, h);
  }
  l = length(u.xy); k = (.014 + .022 * u.z) * (.75 + .6 * uPhrase);
  float petal = lsIn(k * (.8 + .25 * sin(5. * atan(u.y, u.x + 1e-5) + 6. * u.z)) - l);
  lsC = mix(lsC, g, .8 * petal);
  lsLay(mix(vec3(.3), uKind[3], .8), petal * (.35 + .65 * uPhrase) * (.5 + .5 * lsS(0., k, l)));
 } else if (!high && o.x > -.9 && o.x < .25) {
  o.x += .28;
  lsLay(LSI, .85 * foot * max(lsSeg(o, vec4(.04, -.1, -.02, .3), .024, .014), max(lsSeg(o, vec4(-.02, .3, .03, .55), .014, .004), lsSeg(o, vec4(-.01, .25, -.22, .4), .01, .003))));
  k = min(min(length((o - vec2(.02, .58)) / vec2(.21, .13)), length((o - vec2(-.22, .4)) / vec2(.18, .09))), length((o - vec2(.15, .38)) / vec2(.16, .08)));
  k = lsS(1.25, .75, k + .5 * lsN(x * 17., y * 17.) - .25);
  lsLay(lsLeaf ? vec3(.1, .3, .18) : LSI * 3., .45 * k);
  lsLay(lsTint(2, .3), k * .9 * max(lsDab(rot(.5) * o * 30., .75, .42), lsDab(rot(1.6) * o * 36., .6, .4)));
 }
 // reeds
 if (cx > .2 && y < -.2) for (int k = -2; k < 3; k++) {
  float i = floor(cx / .055) + float(k), h = hash11(i + cell * 13.), h2 = hash11(i * 3.1 + cell), root = (i + .25 + .5 * h) * .055;
  float v = (y + 1.02) / max((.18 + .34 * h2) * (.5 + .6 * uTexture) * lsS(.3, .9, root) * lsS(2.3, 1.7, root), .01);
  if (v < 1.) lsPut(lsLeaf ? mix(g * .7, uKind[2] * .6, .3) : lsTint(2, .35), lsLine(abs(cx - root - v * v * (.24 * h - .11 + .035 * sin(t * .45 + root * 3.))), .0085 - .0075 * v) * (.3 + .45 * h2 + .3 * uTexture));
 }
 // birds, two short strokes each
 if (y > .3) for (int i = 0; i < 4; i++) {
  float fi = float(i);
  vec2 u = q - vec2(-1.5 + .13 * fi, .52 + .2 * fract(fi * .37) + .03 * fi);
  u.x = abs(u.x + .2 * u.y);
  lsLay(LSI, (.25 + .75 * uKeys) * lsLine(abs(u.y - .3 * u.x + 5. * u.x * u.x), max(.009 - .18 * u.x, 0.)) * step(u.x, .05));
 }
 // a hit: dots of dark ink on the rocks, that bleed as they dry
 float gone = 1. - uHits, rag = .1 * (noise(s * 18.) - .5);
 if (uHits > .003) for (int i = 0; i < 2; i++) {
  float fi = float(i), rr = .115 - .035 * fi;
  l = length(q - vec2(.5 * fi - 1.3, -.64 - .08 * fi)) + rag * (gone + .6);
  lsLay(mix(LSI, uKind[4] * .45, .45), sqrt(uHits) * (.95 * lsS(rr + .02 + .1 * gone, rr - .03 - .03 * gone, l) + .45 * lsS(.6, .05, l)));
 }
 // a cue: one broad wet stroke laid along the river
 if (uCue > .003) {
  float u = (x - lsMid + 2.1) / 4.2, v = (y + (lsLeaf ? -.5 : .5) - .05 * sin(u * 5.)) / .19, hair = lsN(u * 6., v * 11. + 5.), end = 1.15 - .6 * uCue * uCue - .06 * hair;
  lsLay(mix(vec3(.13, .14, .17), uKind[1] * .3, .25), .9 * lsS(0., .5, uCue) * lsS(1.05, .9, abs(v) + .12 * hair) * lsS(0., .015, u - .02 * hair) * lsS(end, end - .012, u)
   * (.4 + .35 * lsS(.6, 1., abs(v)) + .2 * hair) * mix(1., lsS(.25, .5, hair), lsS(.3, .9, u)));
 }
 // a seal of plain red, at the head of the picture
 o = abs(s - vec2(2.2, -.72));
 return mix(lsC, vec3(.66, .12, .08), lsIn(.06 - max(o.x, o.y)) * .9);
}
// A roll lying along y, or the rod in it: laid over what is there.
void lsRoll(vec3 ro, vec3 rd, vec2 at, float r, float hy, bool rod, vec3 L, float key, inout float tb) {
 vec2 o = ro.xz - at, d = rd.xz;
 float a = dot(d, d), b = dot(o, d), h = b * b - a * (dot(o, o) - r * r);
 if (h <= 0.) return;
 float t = (-b - sqrt(h)) / a, y = ro.y + rd.y * t, px = 1.2 / uRes.y, in_ = min(r - abs(o.x * d.y - o.y * d.x) / sqrt(a), hy - y);
 bool end = y < -hy;
 if (end) t = (-hy - ro.y) / rd.y;
 o += d * t;
 if (end) in_ = o.y > 0. ? px * step(length(o), r) : r - length(o);
 if (t > tb || in_ <= 0.) return;
 tb = t;
 vec3 n = end ? vec3(0, -1, 0) : vec3(o.x, 0, o.y) / r, c = vec3(.17, .085, .06);
 if (!rod) c = end ? vec3(.92, .83, .7) * (.75 + .25 * lsS(.1, .4, fract(length(o) / .0065 + atan(o.y, o.x + 1e-6) / TAU)))
  : vec3(.86, .81, .72) * (1. + .025 * sin(n.x * r * 210. + 3. * sin(y * 17.)) * sin(y * 29. + n.x * 5.) - .09 * lsS(.034, .03, hy - abs(y)));
 else c += .4 * pow(sat(dot(reflect(normalize(rd), n), L)), 24.);
 c *= lsSun * key * sat(dot(n, L)) / L.z + LSK * (.5 + .5 * lsS(-.9, .8, n.z) + sat(-n.y));
 in_ = sat(in_ / px);
 lsMul *= 1. - in_; lsAdd = mix(lsAdd, c, in_);
}
vec3 lsHand(vec2 p) {
 const float H = .235, HB = .272, S = 3.8;
 float A = .5 * uRes.x / uRes.y, w = .5 - .5 * cos(TAU * uLoop), fat = min(1., .4 + A * .7), px = 1. / uRes.y;
 vec2 X = clamp(A * .68, .16, .78) * vec2(-1, 1), R = fat * sqrt(.0011 + .0095 * vec2(1. - w, w));
 // the eye, and the scroll a little turned on the table
 vec3 f = vec3(0, .62, -.785), ro = vec3(0, -.02, 0) - f * 2.7, rd = vec3(p.x, p.y * .785, p.y * .62) + f * 2.7, L = normalize(vec3(-.62, .42, .62)), q, col;
 float t = -ro.z / rd.z;
 vec2 tb = (ro + rd * t).xy;
 mat2 tu = rot(.1);
 ro.xy = tu * ro.xy; rd.xy = tu * rd.xy; L.xy = tu * L.xy;
 q = ro + rd * t;
 // the window's light, and the shadows of the two rolls
 float wx = tb.x + .35 * tb.y, win = .43 + .07 * uLevel + .38 * lsS(-1.2, -.5, wx) * lsS(1., .3, wx) * (1. - .4 * lsS(.12, 0., abs(wx - .5))), key = win, occ = 1.;
 for (int k = 0; k < 2; k++) {
  vec2 to = vec2(X[k], R[k]) - q.xz;
  float ss = dot(to, L.xz) / dot(L.xz, L.xz), e = max(.16 * ss, 0.) + .004;
  if (ss > 0.) key *= 1. - lsS(R[k] + e, R[k] - e, length(to - ss * L.xz)) * lsS(HB + e, HB - e, abs(q.y + ss * L.y));
 }
 vec2 s = vec2(q.x / H - S * w, q.y / H);
 float edge = abs(s.y) - 1., off = abs(q.x) < X.y + .01 ? abs(q.y) - HB : 1.;
 bool sheet = off < 0.;
 vec2 gq = sheet ? s * vec2(60., 130.) : tb * vec2(2.2, 46.), con = abs(q.x - X) / R;
 float gr = .65 * noise(gq) + .35 * noise(gq * vec2(3.1, 3.3));
 lsPx = 1.15 * px / H; lsMid = -S * w; lsAt = s; lsOn = sheet && edge < 0.;
 // the table's boards, darker along the paper; then the silk border; then the paper, tinted by the piece
 col = mix(vec3(.69, .685, .665), vec3(.76, .755, .735), gr) * (1. - .22 * lsS(.004, 0., .155 - abs(fract((tb.y + .06) / .31) - .5) * .31)) * (1. - .35 * exp(-max(max(abs(q.x) - X.y, abs(q.y) - HB), 0.) * 55.) * step(q.y, 0.));
 col = mix(col, vec3(.67, .68, .59), lsS(px, -px, off));
 if (lsOn) {
  vec4 m = piece(vec2((3.2 - s.x) / (S + 6.4), .5 - .5 * s.y));
  col = vec3(.955, .92, .84) * (.965 + .06 * gr) * mix(vec3(1), m.rgb / max(m.a, .02) * .7 + .3, .34 * m.a);
 }
 if (sheet) occ = (1. - .5 * lsLine(abs(edge), .004)) * (1. - .5 * exp(-3. * min(con.x, con.y)));
 lsMul = (lsSun * key + LSK) * occ;
 for (int k = 0; k < 2; k++) {
  lsRoll(ro, rd, vec2(X[k], R[k]), R[k], HB, false, L, win, t);
  lsRoll(ro, rd, vec2(X[k], R[k]), .02 * fat, HB + .045, true, L, win, t);
 }
 return col;
}
// Where a ray meets the six leaves; at: the leaf or -1, place along it, height.
float lsZig(vec3 ro, vec3 rd, float W, out vec3 at) {
 float dx = W / 3., best = 1e5; at = vec3(-1, 0, 0);
 for (int k = 0; k < 6; k++) {
  float z0 = ((k & 1) == 0 ? -.27 : .27) * dx;
  vec2 o = vec2(-W + dx * float(k), z0) - ro.xz, e = vec2(dx, -2. * z0);
  float det = rd.x * e.y - rd.z * e.x;
  if (abs(det) < 1e-5) continue;
  float t = (o.x * e.y - o.y * e.x) / det, a = (o.x * rd.z - o.y * rd.x) / det, y = ro.y + rd.y * t + .17;
  if (t > 0. && t < best && a >= 0. && a <= 1. && y >= 0. && y <= .64) { best = t; at = vec3(float(k), a, y); }
 }
 return best;
}
vec3 lsFold(vec2 p) {
 float hh = .32, W = clamp(.435 * uRes.x / uRes.y, .25, .97), dx = W / 3., full = .9 + .2 * uLevel;
 vec3 ro = vec3(0, .17, 2.5), rd = vec3(p.x, p.y - .06, -2.5), at, fl, q, lamp = vec3(-1. + .3 * sin(TAU * uLoop), .5, 1.5), sun = lsSun * vec3(.94, .9, .8);
 float t = lsZig(ro, rd, W, at);
 bool mirror = at.x < 0.;
 // the wall, or the dark boards that hold the screen's light
 q = ro + rd * 1.3;
 vec3 wall = vec3(.185, .155, .13) * (.4 + 2. * exp(-1.1 * length(vec3(q.x - lamp.x * .6, q.y - .6, .5)))) * full;
 if (mirror) {
  if (q.y > -.17) return wall;
  ro += rd * (-.17 - ro.y) / rd.y;
  float gr = lsN(ro.x * 3., ro.z * 60.);
  fl = vec3(.07, .05, .039) * (.7 + .6 * gr) * (1. + 2.6 * exp(-1.6 * length(ro.xz - lamp.xz * vec2(.7, .8)))) * full;
  rd.y = -rd.y; rd.x += .02 * (gr - .5);
  t = lsZig(ro, rd, W, at);
  if (at.x < 0.) return fl;
 }
 q = ro + rd * t;
 float sg = mod(at.x, 2.) < .5 ? 1. : -1.;
 vec3 n = normalize(vec3(-sg * .54, 0, 1)), l = lamp - q;
 float far = dot(l, l);
 l /= sqrt(far);
 vec2 s = vec2((at.x + at.y - 3.) * dx * 1.13 / hh, at.z / hh - 1.), gq = s / .26, id = floor(gq);
 lsPx = 1.1 / (uRes.y * hh);
 // gold leaf laid in squares, each a little different, worn through to the red clay in places
 float r = hash21(id + 3.);
 gq -= id;
 vec3 g = vec3(.72, .59, .36) * (.9 + .17 * r);
 g = mix(g, vec3(.83, .71, .47), .5 * lsS(.05, .03, min(gq.x, gq.y)));
 g = mix(g, vec3(.42, .24, .14), .11 * lsS(.55, .95, noise(s * 23.)));
 vec4 m = piece(vec2(.5 + .5 * q.x / W, .5 - .5 * s.y));
 g *= mix(vec3(1.), m.rgb / max(m.a, .02) * .8 + .2, .3 * m.a);
 float spec = pow(sat(dot(reflect(normalize(rd), normalize(n + vec3(.1 * r - .05, .03 - .06 * r, 0))), l)), 5.);
 // the dark of the fold, and black lacquer round the whole screen
 float fold = min(at.y, 1. - at.y) * dx, rim = min(min(at.z, .64 - at.z), min(at.x + at.y, 6. - at.x - at.y) * dx), k = lsS(.01, .0115, rim), k2 = 1. - .7 * lsS(.0115, .013, rim) * lsS(.0215, .02, rim);
 lsMul = vec3(.36, .34, .33) + sun * (2. * full * sat(dot(n, l)) / (.45 + .45 * far) + .35 * spec);
 lsMul *= k * k2 * (1. - ((at.y < .5) == (sg > 0.) ? .45 * exp(-fold * 22.) : .15 * exp(-fold * 60.))) * (.4 + .6 * lsS(.0006, .0022, fold));
 lsAdd = (vec3(.03, .024, .022) + .1 * spec * sun) * (1. - k) * k2 + vec3(.2, .1, .06) * (1. - k2);
 lsAt = s; lsOn = !mirror;
 if (lsOn && rim < at.z) lsAdd = mix(wall, lsAdd, sat(rim * uRes.y));
 if (mirror) { gq.x = .22 * exp(-3.4 * at.z); lsMul *= .85 * gq.x; lsAdd = fl + lsAdd * gq.x; }
 return g;
}
vec3 render(vec2 p) {
 lsLeaf = uVar > .5;
 lsSun = vec3(1.06, 1. - .04 * uMic, .92 - .1 * uMic);
 vec3 c = lsLeaf ? lsFold(p) : lsHand(p);
 if (lsOn) c = lsPaint(lsAt, c);
 c = (c * lsMul + lsAdd) * (.94 + .12 * uTone);
 return lsLeaf ? 1.25 - 1.25 * exp(-c) : c;
}
