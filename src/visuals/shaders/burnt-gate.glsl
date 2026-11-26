// name: Burnt gate
// a: Through the heat
// b: Melted sheet
// what: A frame of old amber and rose film has stopped in the gate and burns: gold halos, bubbles, black crusts, and holes where the bare lamp comes through; or a creased sheet of white plastic before a grey wall melts from the heat behind it, its holes sagging into drops with glossy, charred rims, torn films and threads.
// follows: Strokes burn where they lie, more as they sound; pads open two big holes, a phrase a line; the drone browns the border or the foot. Texture boils the film or blisters the sheet; bands swell bubbles or the heat. The loop carries the heat; a hit burns at the playing place, a cue in the middle; keys prick pinholes, a voice lights rims or folds.
vec2 bgG;      // which way leads away from the nearest hole
vec3 bgHue;    // the colour of the sound that burns here
float bgHitD;  // how far the hole of a hit is
// One spot of heat joins the field: it opens as r grows past 0; in the sheet it sags into a drop.
void bgJoin(inout float d, vec2 v, float r, vec3 hue, float k) {
  if (uVar > 0.5) {
    v.x *= 0.95 + 0.6 * smoothstep(-0.9, 1.5, v.y / (abs(r) + 0.05));
    v.y = 0.64 * v.y + 0.02;
  }
  float l = length(v), di = l - r, h = sat(0.5 + 0.5 * (di - d) / k);
  vec2 g = v / (l + 0.012);
  d = mix(di, d, h) - k * h * (1.0 - h);
  bgG = mix(g, bgG, h); bgHue = mix(hue, bgHue, h);
}
// A soft step from a to b, whichever is larger.
float bgS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float bgEase(float x) { return x * x * (3.0 - 2.0 * x); }
// How far a place is from the nearest hole (below 0 is inside it).
float bgField(vec2 p, float X) {
  vec2 cell = vec2(0.25, uVar < 0.5 ? 0.25 : 0.31), id0 = floor(p / cell);
  float d = 0.3; bgG = vec2(0.0, 1.0); bgHue = vec3(0.6, 0.35, 0.15);
  // the piece: a jittered scatter of spots, each as hot as the sound at its place
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j)), h = hash22(id + 3.7);
    vec2 c = (id + 0.5 + 0.62 * (h - 0.5)) * cell, uv = vec2(0.5 + 0.5 * c.x / X, 0.5 - 0.95 * c.y), far = (p - c) * vec2(1.0, uVar < 0.5 ? 1.0 : 0.64);
    if (dot(far, far) > 0.17) continue;
    vec4 m = piece(uv);
    if (m.a < 0.004) continue;
    float w = abs(fract(uv.x - uLoop + 0.5) - 0.5), k = fract(h.x * 7.3 + h.y * 3.1);
    float a = m.a * (0.62 + 0.4 * exp(-w * w * 26.0) + 0.3 * uEnergy);
    float r = -0.22 + 0.16 * smoothstep(0.0, 0.2, a) + (0.07 + 0.1 * k * k) * smoothstep(0.05 + 0.25 * h.x, 0.7 + 0.3 * h.x, a);
    bgJoin(d, p - c, r + 0.003 * sin(uTime * 0.23 + h.y * 40.0), m.rgb / m.a, 0.05);
  }
  float s = X / 0.89;
  // pads: two large slow holes
  if (uPad > 0.0) {
    float e = bgEase(uPad), side = uVar < 0.5 ? s : -s;
    bgJoin(d, p - vec2(-0.4 * side, 0.12), -0.22 + 0.37 * e, uKind[1], 0.07);
    bgJoin(d, p - vec2(0.47 * side, -0.17), -0.22 + 0.31 * e, uKind[1], 0.07);
  }
  // a phrase: a burnt line
  if (uPhrase > 0.0) {
    float y = p.y - 0.3 - 0.045 * sin(p.x * 3.4 + 0.8) - 0.02 * sin(p.x * 9.0), x = p.x / s + 0.15;
    if (uVar > 0.5) y = p.y - 0.17 - 0.55 * x * x - 0.02 * sin(p.x * 8.0);
    bgJoin(d, vec2(max(abs(p.x - 0.12 * s) - 0.46 * s, 0.0), y * 1.3), -0.22 + (0.19 + 0.06 * noise(vec2(p.x * 11.0, 3.0))) * bgEase(uPhrase), uKind[3], 0.04);
  }
  // the keys: four pinholes
  if (uKeys > 0.0) for (int i = 0; i < 4; i++) {
    float fi = float(i);
    bgJoin(d, p - vec2((0.62 - 0.37 * fi) * s, 0.04 + 0.19 * sin(fi * 2.4 + 0.7)), -0.22 + 0.232 * uKeys, uKind[3], 0.03);
  }
  // a hit: one hole at the playing place; a cue: a great one from the middle
  float ring = 1.94 * X;
  vec2 at = p - vec2((uLoop - 0.5) * ring, 0.04);
  at.x -= ring * floor(at.x / ring + 0.5);
  float t = 1.0 - uHits;
  bgHitD = length(at);
  if (uHits > 0.0) bgJoin(d, at, -0.22 + 0.33 * smoothstep(0.0, 0.35, t) * bgS(1.0, 0.6, t), uKind[4], 0.05);
  if (uCue > 0.0) bgJoin(d, p, -0.22 + 0.43 * 4.0 * uCue * (1.0 - uCue), uKind[4], 0.07);
  return d;
}
// Bubbles packed side by side: xy leads from the middle of the nearest (1 at its rim), z is its number.
vec3 bgFoam(vec2 q, float swell) {
  vec2 id0 = floor(q); float a = 9.0; vec3 o = vec3(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j)), h = hash22(id + 11.3);
    vec2 v = q - id - 0.5 - 0.8 * (h - 0.5) - 0.06 * vec2(sin(uTime * 0.31 + h.y * 30.0), cos(uTime * 0.27 + h.x * 30.0));
    float r = 0.16 + 0.34 * h.x * h.y + swell * (0.16 + 0.1 * sin(uTime * (0.4 + 0.4 * h.x) + h.y * 20.0)), f = length(v) - r;
    if (f < a) { a = f; o = vec3(v / r, h.y); }
  }
  return o;
}
// How a bubble of melted film bends the lamp: x its dark wall, y what shines through, z a glint. soft is how flat it lies.
vec3 bgLens(vec2 v, float soft) {
  float e = length(v), in_ = bgS(1.04, 0.96, e);
  float dirn = dot(v, vec2(-0.55, 0.83)) / (e + 1e-3);
  float wall = smoothstep(mix(0.55, 0.8, soft), 1.0, e) * bgS(1.16, 1.0, e) * (0.75 + 0.3 * dirn);
  float light = in_ * (0.3 * (1.0 - e * e) + smoothstep(0.3, 0.75, e) * bgS(0.98, 0.8, e) * bgS(0.1, -1.0, dirn));
  vec2 k = v - vec2(-0.32, 0.45);
  return vec3(wall, light, in_ * exp(-dot(k, k) * 60.0) * (1.0 - soft));
}
// a: the frame stopped in the gate
vec3 bgFilm(vec2 p, float px, float X) {
  float A = 0.5 * uRes.x / uRes.y, s = X / 0.89;
  vec2 o = rot(0.5) * p;
  float creep = uTravel * 0.012;
  vec2 n1 = vec2(noise(o * 5.0 + vec2(creep, 1.7)), noise(o * 5.0 + vec2(8.3, -creep))) - 0.5;
  vec2 n2 = vec2(noise(o * 19.0 + 3.1), noise(o * 19.0 + vec2(17.0, creep * 3.0))) - 0.5;
  float d = bgField(p + n1 * 0.1 + n2 * 0.03, X);
  // the gate: a rounded opening
  vec2 b = abs(p) - vec2(A - 0.03, 0.472) + 0.05;
  float gate = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.05;
  // the picture on the film: old orange under rose, out of focus
  float u = sat(p.y + 0.5 + 0.1 * p.x + 0.2 * (noise(p * 1.6 + 4.0) - 0.5));
  vec3 film = mix(vec3(0.55, 0.07, 0.005), vec3(1.1, 0.34, 0.025), smoothstep(0.0, 0.4, u));
  film = mix(film, vec3(0.78, 0.17, 0.075), smoothstep(0.36, 0.72, u));
  film = mix(film, vec3(0.3, 0.05, 0.06), smoothstep(0.66, 1.08, u));
  film *= 0.75 + 0.6 * noise(p * 2.6 + 9.0) * noise(p * 1.3);
  // tired film: fine upright scratches
  for (int i = 0; i < 3; i++) {
    float fi = float(i), x = p.x - s * (-0.63 + 0.55 * fi) - 0.004 * sin(p.y * 2.0 + fi * 2.0);
    if (abs(x) < px) film += vec3(0.55, 0.3, 0.12) * 0.2 * bgS(px, 0.0, abs(x)) * smoothstep(0.35, 0.75, noise(vec2(fi * 7.0, p.y * 5.0)));
  }
  film = mix(film, film * (0.3 + 1.3 * bgHue), 0.5 * bgS(0.2, 0.0, d));
  vec2 lp = (p - vec2(-0.42 * X * cos(TAU * uLoop), 0.03)) * vec2(0.8, 1.15);
  float lamp = 0.5 + 1.15 * exp(-dot(lp, lp) * 3.4);
  // heat before the burn: the dyes fade to gold, then brown; the drone browns the border
  float w = 0.7 + 0.6 * uSpace;
  film = mix(film, vec3(1.3, 0.4, 0.035), 0.4 * bgS(0.18 * w, 0.05 * w, d));
  float rim = (-gate + 0.06 * noise(p * 6.0) + 0.03 * n2.y) / (0.06 + 0.4 * uDrone);
  float border = exp(-max(rim, 0.0) * 1.6) * (0.25 + 0.75 * sat(uDrone * 2.4)), brown = bgS(0.085 * w, 0.015, d);
  film *= mix(vec3(1.0), vec3(0.15, 0.045, 0.025), max(brown, border));
  // bubbles
  float bx = band(0.5 + 0.5 * p.x / X);
  float heat = d < 0.17 ? bgS(0.1 + 0.06 * uTexture, 0.01, d) * (0.55 + 0.9 * noise(p * 7.0 + 2.0)) : 0.0;
  vec3 f1 = vec3(2.0, 0.0, 0.0), f2 = f1;
  if (d < 0.17) f1 = bgFoam((p + n1 * 0.03 + n2 * 0.008) * 18.0, 0.1 + 0.7 * bx + 0.5 * uTexture);
  if (d < 0.08) f2 = bgFoam(p * 46.0 + n1 * 3.0 + n2, 0.4 + 0.5 * bx);
  float big = smoothstep(0.15, 0.5, heat - 0.35 * f1.z), small = bgS(0.055 + 0.02 * uTexture, 0.01, d);
  vec3 l1 = bgLens(f1.xy, 0.8 - 0.6 * f1.z) * big, l2 = bgLens(f2.xy, 0.3) * small;
  vec3 gold = mix(vec3(1.3, 0.4, 0.03), vec3(0.75, 0.15, 0.01), brown) * (0.3 + 0.7 * lamp);
  film *= (1.0 - 0.7 * l1.x) * (1.0 - 0.75 * l2.x);
  film += gold * (0.6 * l1.y + 0.4 * l2.y) + vec3(0.9, 0.6, 0.3) * (0.5 * l1.z + 0.5 * l2.z);
  // three blisters that swell and sink under the skin, always
  for (int i = 0; i < 3; i++) {
    float fi = float(i), sw = 0.5 + 0.5 * sin(uTime * (0.16 + 0.03 * fi) + fi * 2.2 + 0.6);
    vec2 c = vec2((0.33 - 0.17 * fi * fi + 0.09 * fi) * s, -0.14 + 0.27 * fi - 0.16 * fi * fi);
    if (dot(p - c, p - c) > 0.004) continue;
    vec3 l = bgLens((p - c + n2 * 0.006) / ((0.034 - 0.007 * fi) * (0.75 + 0.25 * sw)), 0.2) * (0.4 + 0.6 * sw) * smoothstep(0.02, 0.09, d);
    film *= 1.0 - 0.75 * l.x;
    film += gold * l.y * 0.6 + vec3(0.9, 0.7, 0.4) * l.z * 0.4;
  }
  // the crust and the hole, its rim bitten by burst bubbles
  float bite = max(0.5 - length(f1.xy) * 0.5, 0.0) * 0.03 + max(0.5 - length(f2.xy) * 0.5, 0.0) * 0.018;
  float hole = d - bite + 0.006;
  float crust = bgS(0.034 + 0.05 * max(n2.x + 0.1, 0.0) + 0.03 * n1.y, 0.006, hole);
  film *= 1.0 - 0.97 * crust * (1.0 - 0.5 * l2.y - 0.4 * l1.y);
  vec3 col = film * lamp;
  // light spills from the hole over the crust and into the film
  col += vec3(0.75, 0.16, 0.015) * (0.5 * exp(-max(hole, 0.0) * 110.0) + 0.1 * exp(-max(hole, 0.0) * 8.0)) * bgS(0.2, 0.0, d) * (0.6 + 0.6 * uMic);
  // the hole: a lip of clear melted base, strands of it, then the bare lamp
  vec3 white = mix(vec3(1.0, 0.84, 0.55), vec3(0.97, 0.95, 0.9), uTone) * 2.2 * (0.62 + 0.28 * lamp);
  float lip = exp(min(hole, 0.0) * (90.0 + 160.0 * n2.y)), deep = bgS(-0.005, -0.07, hole);
  float str = hole < px ? abs(noise(p * 13.0 + n2 * 1.5) - 0.5) : 1.0;
  float web = bgS(0.035, 0.015, str) * smoothstep(-0.045, -0.004, hole);
  vec3 through = mix(white * vec3(1.0, 0.86, 0.66), white, deep);
  through *= mix(vec3(1.0), vec3(1.0, 0.36, 0.05), sat(lip));
  through *= mix(vec3(1.0), vec3(0.5, 0.16, 0.03), web * 0.9);
  col = mix(col, through, bgS(px, -px, hole));
  // flame: the first instant of a hit and of a cue
  col += (vec3(1.6, 0.6, 0.1) + uKind[4] * 0.5) * uHits * ((1.0 + 2.2 * pow(uHits, 4.0)) * exp(-bgHitD * bgHitD * 120.0) + 0.8 * exp(-abs(hole) * 50.0) * bgS(0.3, 0.1, bgHitD));
  col += vec3(1.3, 0.5, 0.1) * uCue * exp(-dot(p, p) * 30.0);
  // the gate, and a hair caught in it
  vec2 hp = p - vec2(0.56 * s, -0.472);
  float hair = abs(hp.x + 0.05 * sin(hp.y * 26.0) - hp.y * 0.6) / 1.35;
  col *= 1.0 - 0.8 * bgS(0.0022 + px, 0.0012, hair) * bgS(0.13, 0.11, hp.y);
  col *= bgS(0.004, -0.01, gate + 0.006 * n2.x);
  return screenOf(col + vec3(0.006, 0.004, 0.003));
}
// Noise with its slope: x the value, yz the slope.
vec3 bgN(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash21(i), b = hash21(i + vec2(1, 0)) - a, c = hash21(i + vec2(0, 1)) - a, k = hash21(i + vec2(1, 1)) - a - b - c;
  return vec3(a + b * u.x + c * u.y + k * u.x * u.y, du * (vec2(b, c) + k * u.yx));
}
// A crease where the noise is in its middle, with its slope.
vec3 bgRidge(float n, vec2 g, float soft) { n = 2.0 * n - 1.0; float r = sqrt(n * n + soft); return vec3(1.0 - r, -2.0 * n / r * g); }
// The folds of the sheet at a place, with their slope: long hanging ones and a fine crumple.
vec3 bgFold(vec2 q) {
  mat2 Ru = rot(0.6), Rk = rot(1.9), Rw = rot(0.35), Rc = rot(-0.7), Re = rot(1.1);
  vec3 bend = bgN(Ru * q * 2.3 + 3.0), kink = bgN(Rk * q * 6.0);
  bend.yz = bend.yz * Ru * 2.3; kink.yz = kink.yz * Rk * 6.0;
  vec2 w = Rw * q + vec2(0.3 * bend.x + 0.05 * kink.x, 0.0);
  vec2 push = 0.3 * bend.yz + 0.05 * kink.yz, wx = vec2(1, 0) * Rw + push, wy = vec2(0, 1) * Rw;
  vec3 a = bgN(vec2(w.x * 4.2, w.y * 1.1 + 2.0 * bend.x)), b = bgN(vec2(w.x * 8.5 + 4.0, w.y * 1.9 + bend.x));
  a.yz = a.y * 4.2 * wx + a.z * (1.1 * wy + 2.0 * bend.yz);
  b = bgRidge(b.x, b.y * 8.5 * wx + b.z * (1.9 * wy + bend.yz), 0.004);
  vec2 k = Rc * q * 9.0 + 2.8 * bend.x + 0.6 * kink.x;
  push = 2.8 * bend.yz + 0.6 * kink.yz;
  vec2 kx = vec2(9, 0) * Rc + push, ky = vec2(0, 9) * Rc + push;
  vec3 c = bgN(vec2(k.x, k.y * 0.5)), e = bgN(Re * k.yx * 1.9 + 1.7 * kink.x);
  c = bgRidge(c.x, c.y * kx + c.z * 0.5 * ky, 0.004);
  vec2 eg = e.yz * Re * 1.9;
  e = bgRidge(e.x, eg.x * ky + eg.y * kx + (e.y + e.z) * 1.7 * kink.yz, 0.01);
  float b2 = b.x * b.x, c2 = c.x * c.x, m = 0.4 + bend.x;
  return vec3(a.x * 0.06 + b2 * b.x * 0.034 + c2 * c.x * 0.014 * m + e.x * e.x * 0.0034,
              a.yz * 0.06 + 0.102 * b2 * b.yz + 0.042 * c2 * m * c.yz + 0.014 * c2 * c.x * bend.yz + 0.0068 * e.x * e.yz);
}
// b: a sheet of white plastic hung before a grey wall, melting
vec3 bgSheet(vec2 p, float px, float X) {
  float s = X / 0.89, creep = uTravel * 0.01;
  vec2 o = rot(0.5) * p;
  vec2 n1 = vec2(noise(o * 5.5 + vec2(creep, 1.7)), noise(o * 5.5 + vec2(8.3, -creep))) - 0.5;
  vec2 n2 = vec2(noise(o * 16.0 + 3.1), noise(o * 16.0 + vec2(17.0, creep))) - 0.5;
  float d = bgField(p + n1 * 0.09 + n2 * 0.018, X);
  vec2 g = bgG;
  vec3 heat = mix(vec3(1.0, 0.4, 0.1), bgHue * 1.3, 0.35);
  vec2 L2 = vec2(-0.62, 0.64);
  // relief: folds turn aside round a hole, creases run out from it
  vec2 q = p + g * exp(-max(d, 0.0) * 9.0) * 0.07 * bgS(0.15, 0.04, d);
  vec3 fold = bgFold(q);
  vec2 slope = fold.yz;
  float ang = atan(g.y, g.x + 1e-4), dd = max(d, 0.0);
  float cr = 0.6 * sin(ang * 7.0 + n1.x * 9.0 + n2.y * 2.0) + 0.5 * sin(ang * 16.0 + n1.y * 14.0);
  slope += vec2(-g.y, g.x) * cr * exp(-dd * 14.0) * (1.0 - exp(-dd * 60.0)) * 1.2 * bgS(0.125, 0.06, d);
  // texture: the plastic boils into small blisters where it is hot
  if (uTexture > 0.0 && d > 0.0 && d < 0.13) {
    vec3 f = bgFoam(p * 27.0 + n1 * 2.5, 0.2 + 0.5 * uTexture);
    slope -= f.xy * bgS(1.05, 0.8, length(f.xy)) * 1.5 * uTexture * bgS(0.13, 0.03, d) * smoothstep(0.1, 0.5, f.z);
  }
  // slow dents that come and go
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 v = p - vec2((-0.5 + 0.47 * fi) * s, 0.1 - 0.26 * fi + 0.17 * fi * fi);
    slope += v * 6.0 * (0.3 + 0.5 * sin(uTime * (0.13 + 0.04 * fi) + fi * 2.0)) * exp(-dot(v, v) * 70.0);
  }
  // rims that have run back and folded over, thick here and thin there
  float rw = 0.006 + 0.03 * sat(n1.y + 0.35 + 0.4 * n2.x) * sat(0.65 - 0.5 * g.y), x1 = d / rw - 1.0, x2 = (d - rw * 2.6) / (rw * 1.3);
  float roll = bgS(1.1, 0.7, abs(x1)), roll2 = bgS(1.2, 0.5, abs(x2)) * smoothstep(-0.15, 0.25, n1.x + n2.y);
  slope = mix(slope, slope * 0.6 - g * x1 * 2.6, roll) - g * x2 * 1.3 * roll2;
  vec3 n = normalize(vec3(-slope, 1.0)), L = normalize(vec3(L2, 0.62));
  float dif = sat(dot(n, L)), spec = pow(sat(dot(n, normalize(L + vec3(0.0, 0.0, 1.0)))), 70.0), low = pow(sat(dot(n, normalize(vec3(0.55, -0.3, 0.8)))), 20.0);
  // milk-white where it is thick, grey where the wall shows through
  float thick = smoothstep(0.25, 0.8, noise(rot(0.7) * p * 2.3 + 6.0) + 0.4 * n1.x + 2.0 * (fold.x - 0.05));
  vec3 skin = mix(vec3(0.36, 0.365, 0.37), vec3(0.97, 0.95, 0.9), 0.35 + 0.65 * thick);
  float light = 1.15 - 0.55 * length((p - vec2(-0.5 * s, 0.3)) * vec2(0.8 / s, 0.9));
  vec3 sh = skin * (0.06 + 1.25 * dif * sqrt(dif)) * light;
  // heat behind: it shines through, stains amber, then chars; the drone stains the foot
  float hot = bgS(0.17, 0.0, d), foot = sat(uDrone * 1.8) * smoothstep(0.0, 0.6, -p.y + 0.25 * n1.x + 0.06 * n2.x);
  sh += heat * skin * ((0.12 + 0.4 * band(0.5 + 0.5 * p.x / X)) * hot * hot + 0.4 * foot * (0.3 + uEnergy));
  float sc = bgS(0.075, 0.0, d + 0.09 * n2.x + 0.07 * n1.x);
  sh *= mix(vec3(1.0), vec3(0.5, 0.22, 0.06), max(sc * 0.85, 0.7 * foot));
  sh *= 1.0 - 0.93 * bgS(0.028, 0.0, d + 0.05 * n2.y + 0.04 * n1.y);
  sh += vec3(1.0, 0.97, 0.92) * (spec * (0.65 + 0.6 * roll) + low * (0.04 + 0.25 * uMic)) * (0.6 + 0.8 * uTone) * (0.5 + 0.5 * light);
  // through the hole: a grey wall, and on it the sheet's shadow
  vec3 wall = vec3(0.07, 0.072, 0.077) * (0.8 + 0.4 * noise(p * 3.0)) * (0.85 + 0.3 * noise(p * 70.0)) * light;
  float shade = smoothstep(-0.085, -0.045, d + (0.05 + 0.08 * uSpace) * dot(g, L2) + 0.02 * n1.x);
  vec3 back = wall * (1.0 - 0.92 * shade) * (0.6 + 0.4 * bgS(0.0, -0.05, d)) + heat * 0.04 * exp(d * 30.0) * (0.5 + uLevel);
  // a torn film of it left inside the rim, and threads drawn across
  float df = d + (0.1 * sat(n1.x + 0.3) + 0.12 * sat(n1.y + 0.1)) * sat(0.15 + g.y + 0.5 * n2.x) + 0.006 * n2.y;
  float film = smoothstep(-px, px, df) * step(d, 0.0);
  back = mix(back, skin * mix(vec3(0.85, 0.5, 0.22), vec3(0.8, 0.75, 0.7), sat(df * 18.0)) * (0.03 + 0.5 * dif * dif) * light * (0.5 + noise(vec2(p.x * 42.0, p.y * 9.0) + 4.0 * n1)), film * 0.6);
  back += vec3(1.0, 0.9, 0.75) * film * light * (0.7 * spec + 0.12 * exp(-abs(df) * 500.0));
  for (int i = 0; i < 2; i++) {
    float fi = float(i), n = 15.0 - 5.0 * fi;
    vec2 c = rot(0.22 - 0.75 * fi) * p;
    c.x = (c.x + 0.014 * sin(c.y * 9.0 + fi * 2.0) + 0.004 * n2.x) * n;
    float at = hash11(floor(c.x) + 31.0 * fi), w = 0.0005 + 0.005 * exp(min(d, 0.0) * 90.0);
    float l = abs(fract(c.x) - 0.3 - 0.4 * at) / n;
    float on = bgS(w + 0.8 * px, w - 0.4 * px, l) * step(0.5 + 0.2 * fi, at);
    back = mix(back, skin * (0.1 + 0.6 * fract(at * 9.0)) * light * vec3(1.0, 0.88, 0.74), on * (0.3 + 0.6 * uTexture));
  }
  vec3 col = mix(back, sh, smoothstep(-px, px, d));
  // flame: the first instant of a hit and of a cue
  col += (vec3(1.5, 0.55, 0.1) + uKind[4] * 0.5) * uHits * ((0.8 + 1.2 * pow(uHits, 4.0)) * exp(-bgHitD * bgHitD * 120.0) + 0.9 * exp(-abs(d) * 60.0) * bgS(0.3, 0.1, bgHitD));
  col += vec3(1.1, 0.42, 0.1) * uCue * exp(-dot(p, p) * 30.0) * 0.6;
  return screenOf(col * 2.1);
}
vec3 render(vec2 p) {
  float px = 1.0 / uRes.y, X = clamp(0.5 * uRes.x / uRes.y, 0.28, 1.2);
  return uVar < 0.5 ? bgFilm(p, px, X) : bgSheet(p, px, X);
}
