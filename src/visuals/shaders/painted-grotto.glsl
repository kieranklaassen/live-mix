// name: Painted grotto
// a: Through the tank
// b: Cloud rails
// what: Through a tank with three large goldfish, wet and round in the light, a painted grotto of grey rock, cloth weed, a paper sun and a giant clam with pearls; or a painted sky tacked to a batten, rows of cut cotton clouds on rails, a hung cloud and its foil rain.
// follows: Drone brightens the limelight, pad sways the weed or rolls the clouds, texture is bubbles or foil glitter, a phrase steers fish or hung cloud, bands raise weed or clouds. A hit lets go a puff of smoke and the clam gapes, a cue runs a second tint over all, the loop moves the sun, keys light pearls or gilt edges.
// own: 0 moonlight at -1, embers at 1; 1 one great fish or huge clouds at -1, five fish or small ones at 1; 2 slim fish or flat clouds at -1, veil-tailed fish or heaped clouds at 1; 3 narrow cave or sky right across at -1, wide cave or the workings bare at 1; 4 an untinted print at -1, full hand colour at 1; 5 further back, or a dry sky, at -1, close, or foil rain right across, at 1
float pgPx, pgFit, pgHand; // a pixel; the picture's width; how much hand colour
vec3 pgLime, pgShade;        // the limelight, and the light in the shadows
float pgBy(float low, float mid, float high, float q) { return q < 0.0 ? mix(mid, low, -q) : mix(mid, high, q); }
vec3 pgBy(vec3 low, vec3 mid, vec3 high, float q) { return q < 0.0 ? mix(mid, low, -q) : mix(mid, high, q); }
vec3 pgInk(int k) { vec3 c = uKind[k]; return c * c * 1.5 + c * 0.1; }
float pgDn(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); }
float pgIn(float d, float s) { return pgDn(s, -s, d); }
float pgIn(float d) { return pgDn(pgPx, -pgPx, d); }
float pgLum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
vec3 pgDye(vec3 c, vec3 dye, float k) { return mix(c, pgLum(c) * dye / max(pgLum(dye), 0.02), k); }
// Grey distemper with colour laid over by hand.
vec3 pgPaint(float t, vec3 dye) {
  t = sat(t);
  return pgDye(mix(mix(vec3(0.02, 0.017, 0.021), vec3(0.19, 0.16, 0.14), smoothstep(0.0, 0.5, t)), vec3(0.74, 0.67, 0.53), smoothstep(0.4, 1.0, t)), dye, pgHand);
}
vec3 pgPiece(vec3 c, vec2 uv) {
  vec4 m = piece(uv);
  return pgDye(c, m.rgb / max(m.a, 0.05), sat(m.a * 1.3) * 0.65) * (1.0 + 0.5 * m.a);
}
float pgBrush(vec2 q, float along, float over) { q *= vec2(along, over); return 0.6 * noise(q) + 0.4 * noise(q * 2.7 + 5.0); }
vec3 pgWood(vec2 q) { return vec3(0.34, 0.19, 0.085) * (0.4 + pgBrush(q, 50.0, 3.0)); }
// A puff of stage smoke.
void pgSmoke(inout vec3 col, vec2 q, vec3 light) {
  if (uHits < 0.01 || length(q) > 0.45) return;
  float open = 1.0 - uHits, thick = 0.0, lit = 0.5;
  for (int k = 0; k < 7; k++) {
    float fk = float(k);
    vec2 o = (q / 0.24 - vec2(sin(fk * 2.4), 0.2 + 0.23 * fk) * (0.3 + 0.3 * open)) / (0.34 + 0.16 * open);
    float m = pgDn(1.0, 0.35, length(o) + 0.7 * (noise(q * 30.0 + fk) - 0.5));
    lit = mix(lit, 0.5 + 0.5 * dot(o, vec2(-0.6, 0.8)), m);
    thick = max(thick, m);
  }
  col = mix(col, mix(0.3, 1.1, sat(lit)) * light + pgInk(4) * 0.2, thick * sqrt(uHits));
}

// ---- a: the set behind the tank
vec3 pgRock(vec2 q, float seed, vec3 wash) {
  vec2 w = rot(0.5) * q * vec2(7.0, 3.4) + seed * 7.3 + 0.9 * noise(q * 5.0 + seed), i = floor(w - 0.5), near = vec2(0.0);
  float d1 = 9.0, d2 = 9.0, h = 0.0;
  for (int k = 0; k < 4; k++) {
    vec2 g = i + vec2(k % 2, k / 2);
    float o = hash21(g);
    vec2 r = w - g - 0.25 - 0.5 * vec2(o, fract(o * 57.3));
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; near = r; h = o; } else d2 = min(d2, d);
  }
  float brush = noise(rot(0.5 + 1.3 * h) * q * vec2(13.0, 80.0)) - 0.5;
  float t = 0.42 + 0.6 * dot(near, vec2(-0.75, 0.62)) + 0.25 * (h - 0.5) + 0.5 * brush;
  t = mix(t, (floor(t * 5.0) + smoothstep(0.3, 0.7, fract(t * 5.0))) / 5.0, 0.7);
  return pgPaint(t * (0.35 + 0.65 * smoothstep(0.0, 0.14, sqrt(d2) - sqrt(d1) + 0.1 * brush)), mix(vec3(1.0), wash, 0.4 + h));
}
// Two flats, the floor and the cave's mouth: below 0 inside.
float pgFlat(int i, vec2 q) {
  float tooth = abs(2.0 * fract(q.x * 4.6 + 0.2) - 1.0);
  if (i == 0) return 0.8 * (q.y + 0.39 - 0.05 * tooth - 0.02 * sin(q.x * 41.0) - 0.16 * smoothstep(0.35, 0.85, abs(q.x / pgFit + 0.1)));
  vec2 c = q - vec2(-0.14 + 0.05 * sin(q.y * 6.0), -0.12);
  float a = atan(c.y, c.x + 1e-5);
  tooth *= (0.4 + 0.6 * hash11(floor(q.x * 4.6 + 0.7))) * smoothstep(0.0, 0.3, c.y) * pgDn(0.5, 0.2, abs(c.x));
  return 0.36 * (pgBy(0.62, 1.0, 1.45, uOwn[3]) + 0.3 * (noise(vec2(a * 4.0, 2.0)) - 0.5) - length(c / vec2(0.56 * pgFit, 0.36)) - 0.42 * tooth);
}
vec2 pgShell;
// A giant clam.
vec4 pgClam(vec2 q) {
  vec2 c = (q - pgShell) / 0.25;
  if (abs(c.x) > 1.3 || abs(c.y) > 1.1) return vec4(0.0);
  float e = pgPx * 5.0;
  // the raised half
  vec2 d = c + vec2(0.0, 0.26); d.y /= 0.8 + 0.2 * (4.0 * uHits * (1.0 - uHits) + 0.3 * uLow + 0.1 * sin(uTime * 0.23));
  float r = length(d), a = atan(d.x, d.y + 1e-5), ph = TAU * a * 2.35, R = 1.08 - 0.06 * a * a + 0.05 * cos(ph), deep = smoothstep(0.1, 1.0, r / R);
  float fan = max(r - R, (abs(a) - 1.42) * r);
  float t = 0.16 + 0.6 * deep + 0.17 * sin(ph + 0.9) * deep + 0.2 * (noise(vec2(a * 22.0, r * 4.0)) - 0.5);
  vec4 o = vec4(pgPaint(t + 0.4 * pgDn(0.05, 0.03, abs(fan + 0.035)), vec3(1.0, 0.65, 0.5)), pgIn(fan, e));
  // flesh
  d = c + vec2(0.0, 0.2);
  float frill = length(d * vec2(1.0, 2.5)) - 0.8 - 0.05 * sin(atan(d.y, d.x + 1e-5) * 24.0);
  vec3 flesh = pgPaint(0.36 + 1.2 * frill + 0.3 * noise(c * 30.0), vec3(0.2, 0.72, 0.75)) * smoothstep(-0.36, -0.1, frill);
  o = mix(o, vec4(flesh, 1.0), pgIn(frill, e));
  for (int k = 0; k < 5; k++) {
    vec2 b = (d - vec2(-0.42 + 0.21 * float(k), -0.035 + 0.025 * float((k * 2) % 3))) / 0.09;
    float pearl = 0.12 + 0.6 * sat(0.5 + 0.5 * dot(b, vec2(-0.6, 0.8))) + 0.9 * pgDn(0.35, 0.1, length(b - vec2(-0.3, 0.4)));
    o.rgb = mix(o.rgb, pearl * vec3(1.0, 0.92, 0.85) * (0.75 + 2.0 * uKeys * (0.5 + 0.5 * sin(float(k) * 2.0 + uTime))), pgIn(length(b) - 1.0, 10.0 * e));
  }
  // the lower half
  float x = c.x / 1.04, turn = TAU * (2.2 + 0.4 * abs(x)), lip = -0.27 + 0.085 * cos(x * turn) + 0.12 * x * x, down = sat((lip - c.y) / 0.6);
  turn *= x / max(1.0 - 0.55 * down, 0.3);
  t = 0.56 + 0.28 * cos(turn + 0.8) - 0.5 * down - 0.2 * x + 0.22 * (noise(vec2(turn * 2.0, down * 7.0)) - 0.5);
  float dish = max(c.y - lip, -0.27 - 0.6 * pow(max(1.0 - x * x, 0.0), 0.4) - c.y + 0.2 * x * x);
  return mix(o, vec4(pgPaint(t + 0.5 * pgDn(0.055, 0.04, lip - c.y), vec3(1.0, 0.83, 0.63)), 1.0), pgIn(dish, e) * step(abs(x), 1.0));
}
vec3 pgSet(vec2 q) {
  // one round pool of limelight on the shell
  vec2 l = rot(-0.5) * (q - pgShell - vec2(-0.02, 0.1));
  float pool = pgDn(0.5, 0.26, length(l * vec2(1.15, 0.8)));
  vec3 light = pgShade * (0.9 + 0.5 * uLevel) + pgLime * (pool * (1.5 + (0.3 + uEnergy) * uDrone + 0.6 * uHits) + 0.07);
  vec4 clam = pgClam(q);
  vec3 col = clam.rgb * light * clam.a;
  float left = 1.0 - clam.a, shadow = 1.0 - 0.8 * pgDn(1.15, 0.75, length((q - pgShell - vec2(0.06, -0.03)) * vec2(3.8, 4.6)));
  for (int i = 0; i < 2 && left > 0.02; i++) {
    float d = pgFlat(i, q), a = left * pgIn(d);
    if (a > 0.0) {
      vec3 c = pgPiece(pgRock(q, float(i) + 1.0, i == 0 ? vec3(1.0, 0.7, 0.4) : vec3(0.42, 0.6, 0.74)), vec2(0.5 + 0.52 * q.x / pgFit, 0.5 - q.y));
      col += a * c * 0.8 * light * shadow;
      left -= a;
    }
    if (left > 0.02) shadow = min(shadow, 0.25 + 0.75 * smoothstep(-0.02, 0.035, pgFlat(i, q + vec2(-0.03, 0.03))));
  }
  if (left > 0.02) {
    // the far cloth: rays and a paper sun
    vec2 v = q - vec2((0.02 + 0.2 * sin(TAU * uLoop)) * pgFit, 0.06 + 0.06 * cos(TAU * uLoop));
    float r = length(v), a = atan(v.y, v.x + 1e-5), br = noise(vec2(a * 70.0, r * 7.0)) - 0.5;
    float t = 0.72 - 0.55 * smoothstep(0.1, 0.65, r) + 0.12 * sin(a * 18.0 + 0.6 * sin(a * 5.0)) * smoothstep(0.1, 0.2, r) + 0.2 * br;
    vec3 c = mix(pgPaint(t, vec3(0.44, 0.7, 0.78)), 1.4 * pgPaint(0.88 - 0.3 * br, vec3(1.0, 0.5, 0.05)), pgIn(r - 0.085, 0.002));
    col += left * c * (pgShade + pgLime * (0.27 + 0.25 * uLevel) + 0.42 * light) * mix(shadow, 1.0, 0.3);
  }
  return col;
}
// Strips of cloth weed on strings.
void pgWeed(vec2 q, inout vec3 col) {
  float y = q.y + 0.46, turn = q.y * 5.0 + q.x * 4.0 + uTime * 0.4, x = (q.x - (0.02 + 0.05 * uPad) * sin(turn) * smoothstep(0.0, 0.4, y)) / pgFit;
  float n = x < 0.0 ? (x + 0.94) * 10.0 : (x - 0.4) * 8.0, k = floor(n), dx = (n - k - 0.5) * (x < 0.0 ? 0.1 : 0.125);
  if (k < 0.0 || k > 3.0) return;
  k += x < 0.0 ? 0.0 : 4.0;
  float h = fract(k * 0.618), u = y / (0.3 + 0.28 * h + (0.2 + 0.4 * uEnergy) * uBands[int(k) * 2 + 1]);
  float s = fract(q.y * 11.0 + (dx < 0.0 ? 0.0 : 0.5) + h), w = u > 1.0 ? 0.0006 : 0.005 + 0.042 * (1.0 - s) * smoothstep(0.0, 0.16, s) * (1.0 - u * u * u);
  float t = (0.36 + 0.26 * cos(turn) * sign(dx) + 0.2 * (1.0 - s)) * (0.5 + 0.5 * smoothstep(0.0, 0.006, abs(dx)));
  vec3 c = pgPaint(t, mix(vec3(0.46, 0.6, 0.3), pgInk(1) + 0.05, 0.75 * uPad)) * (pgShade * 1.5 + pgLime * 0.3 + pgInk(1) * uPad * uEnergy);
  col = mix(col, c, pgIn(abs(dx) - w) * (u > 1.0 ? 0.4 : 1.0));
}

// ---- the fish: they are real
vec3 pgFlesh, pgThin;
void pgLay(inout vec4 o, vec3 c, float a) { o.rgb = mix(o.rgb, c, a); o.a += a * (1.0 - o.a); }
// A fin opened from one point.
void pgFan(inout vec4 o, vec2 d, vec2 dir, float spread, float R, float e) {
  float r = length(d);
  if (r < R * 1.05 + 2.0 * e) {
    dir = normalize(dir); d = vec2(dot(d, dir), dir.x * d.y - dir.y * d.x);
    float x = max(d.x, 1e-4), a = x * d.y / (x * x + 0.28 * d.y * d.y) / spread, w = (e + 0.004) / max(r, 0.03) / spread;
    float out_ = r / (R * (1.0 - 0.3 * a * a)), ray = 0.5 + 0.5 * cos(a * 46.0), thin = smoothstep(0.0, 0.8, out_);
    pgLay(o, mix(pgFlesh, pgThin * (0.7 + 0.5 * ray), thin) * (0.85 + 0.2 * a), pgIn((out_ - 1.0) * R, e + 0.01) * pgDn(1.0 + w, 1.0 - w, abs(a)) * step(abs(d.y), 1.2 * d.x) * (1.0 - thin * (0.4 - 0.15 * ray)));
  }
}
// go: facing, turned, tipped.
void pgFish(inout vec3 col, vec2 p, vec2 at, float size, vec3 go, float t, float coat, float soft) {
  vec2 q = (p - at) / size;
  if (dot(q, q) > (uOwn[2] > 0.0 ? 2.8 : 2.1)) return;
  float e = pgPx / size + soft, stout = pgBy(0.66, 1.0, 1.2, uOwn[2]), veil = pgBy(0.65, 1.0, 1.4, uOwn[2]), turned = cos(go.y), beat = sin(t * 1.3);
  q.x *= go.x; q = rot(-go.z) * q;
  if (q.x > 0.65 || abs(q.y) > 0.72 * max(veil, 1.0)) return;
  vec3 hot = vec3(0.84, 0.085, 0.006), gold = vec3(1.0, 0.31, 0.022), pale = vec3(1.0, 0.66, 0.28);
  pgFlesh = hot * (pgLime * 0.55 + pgShade);
  pgThin = mix(gold, pale, 0.2) * (pgLime * 0.8 + 0.1) * mix(vec3(1.0), 0.5 + pgInk(3), 0.6 * uPhrase);
  vec4 o = vec4(pgFlesh, 0.0);
  // the tail, swung from side to side
  float bx = q.x / turned;
  vec2 f = vec2(bx, q.y), d = vec2((bx + 0.5) * turned / mix(max(cos(go.y + 0.75 * beat), 0.3), 1.0, 0.3), q.y - 0.015);
  float far = max(-d.x, 0.0);
  d.y += 0.1 * far * sin(far * 5.0 - t * 1.3) + 0.22 * veil * far * far;
  pgFan(o, d, vec2(-0.89, 0.46), 0.44, 0.74 * veil, e);
  pgFan(o, d, vec2(-0.94, 0.05 * beat - 0.35), 0.5, 0.8 * veil, e);
  // the body's height along it
  float ux = (bx + 0.6) / 1.2, u = sat(ux), k = max(2.0 * u - 1.0, 0.0), y = q.y + 0.02 - 0.03 * sin(u * 3.0);
  float h = (0.07 + 0.26 * smoothstep(-0.02, 0.62, u)) * sqrt(max(1.0 - pow(k, 2.3), 0.0)) * stout * (y > 0.0 ? 1.0 : 1.12);
  float hp = u < 0.62 ? 4.2 * u * (0.62 - u) : -1.1 * k * k;
  pgFan(o, f - vec2(0.12, 0.12 * stout), vec2(-0.76, 0.64), 0.75, 0.48 * veil, e);
  float sway = 0.18 * sin(t * 0.9);
  pgFan(o, f - vec2(0.04, -0.25 * stout), vec2(-0.66, 0.7 * sway - 0.75), 0.34, 0.38 * veil, e);
  float a = pgIn((abs(y) - h) * 0.8, e) * smoothstep(0.0, 0.03, ux) * step(ux, 1.0);
  if (a > 0.0) {
    float v = clamp(y / max(h, 0.001), -1.0, 1.0), s = sqrt(1.0 - v * v), head = smoothstep(-0.06, 0.06, bx - 0.25 + 0.9 * v * v * h);
    float row = asin(v) * 5.0 + 20.0, j = floor(row), ff = row - j - 0.5, sc = fract(bx * 17.0 + 0.5 * mod(j, 2.0) + 2.0 * ff * ff);
    float fine = pgDn(0.05, 0.012, e) * (1.0 - head) * smoothstep(0.0, 0.5, s);
    vec3 n = normalize(vec3(-hp + (sc - 0.45) * 0.5 * fine, v + ff * 0.35 * fine, s / 0.62 + 0.02));
    n.xz = rot(go.y) * n.xz; n.x *= go.x;
    vec3 L = normalize(vec3(-0.5, 0.76, 0.45)), alb = mix(mix(hot, gold, pgDn(0.7, -0.4, v)), pale, 0.6 * pgDn(0.0, -0.9, v));
    alb = mix(alb, vec3(0.92, 0.84, 0.72), coat * smoothstep(0.5, 0.58, noise(vec2(bx * 3.4 + 9.0, v * 1.3 + 4.0))));
    alb *= mix(1.0, 0.62 + 0.5 * smoothstep(0.0, 0.7, sc) - 0.4 * smoothstep(0.84, 1.0, sc), fine);
    float dif = sat(0.12 + 0.88 * dot(n, L)), spec = pow(sat(dot(n, normalize(L + vec3(0.0, 0.0, 1.0)))), 30.0);
    vec3 c = alb * (pgLime * (1.5 * dif * dif + 0.6 * pow(sat(n.y), 5.0)) + pgShade * (0.6 + 0.4 * n.y) + vec3(0.06, 0.13, 0.12) * sat(-n.y));
    c += pgLime * spec * (0.6 + 0.6 * uTone) * (0.5 + 0.5 * fine + 0.4 * head);
    float gill = length(vec2(bx - 0.43, q.y + 0.02) * vec2(0.9, 0.75)) - 0.19;
    c *= 1.0 - 0.5 * pgDn(0.45, 0.33, bx) * pgDn(0.035, 0.0, gill) * smoothstep(-0.006, 0.004, gill);
    c *= 1.0 - 0.7 * pgIn(abs(y + 0.05 - 0.2 * (bx - 0.56)) - 0.004, e + 0.004) * smoothstep(0.5, 0.54, bx);
    vec2 ey = (f - vec2(0.44, 0.065 * stout)) * vec2(turned, 1.0); float er = length(ey);
    c = mix(c, gold * (0.4 + sat(0.5 + 10.0 * ey.y)) * pgLime, pgIn(er - 0.046, e));
    c = mix(c, vec3(0.006), pgIn(er - 0.034, e + 0.003)) + 1.2 * pgIn(length(ey - vec2(-0.011 * go.x, 0.015)) - 0.009, e);
    pgLay(o, c, a);
  }
  pgFan(o, f - vec2(0.17, -0.11 * stout), vec2(-0.76, -0.64 - 1.5 * sway), 0.42, 0.3 * veil, e);
  col = mix(col, pgDye(o.rgb, vec3(0.9, 1.0, 1.1), max(-uOwn[4], 0.0)) * (1.0 + max(-uOwn[4], 0.0)), o.a);
}
void pgBubbles(inout vec3 col, vec2 p) {
  vec2 sc = vec2(12.0, 6.0), g = p * sc - vec2(0.0, mod(uTime * 0.2, 256.0)), id = floor(g), key = vec2(id.x, mod(id.y, 256.0)), h = hash22(key);
  float often = 0.15 + 0.6 * uTexture, on = pgDn(often + 0.1, often, hash21(key + 5.5)), r = on * (0.07 + 0.24 * h.y * h.y * h.y) / sc.x;
  if (on <= 0.0) return;
  vec2 w = (g - id - 0.5 + (h - 0.5) * 0.4) / sc / r;
  float b = length(w), shine = 0.5 * smoothstep(0.55, 0.96, b) + 1.2 * pgDn(0.35, 0.1, length(w - vec2(-0.4, 0.45)));
  col = mix(col, col * 0.7 + (pgLime * 0.3 + 0.1) * mix(vec3(0.8), pgInk(2) + 0.3, 0.6) * shine * (0.5 + 0.7 * uTexture), pgIn(b * r - r));
}
vec3 pgTank(vec2 p) {
  float zoom = pgBy(1.3, 1.0, 0.76, uOwn[5]);
  p = p * zoom - vec2(0.0, 0.05 * max(uOwn[5], 0.0));
  pgPx *= zoom;
  pgShell = vec2(-0.3 * pgFit, -0.19);
  float front = 0.425 + 0.004 * sin(p.x * 7.0 + uTime * 0.5) + 0.003 * uMic * sin(p.x * 60.0 + uTime * 2.0);
  float back = front - 0.035;
  bool wet = p.y < back;
  vec2 q = wet ? p * 0.97 + 0.004 * sin(p.yx * vec2(13.0, 11.0) + uTime * 0.3 + 2.0 * sin(p * 5.0)) : p;
  vec3 col = pgSet(q);
  pgWeed(q, col);
  pgSmoke(col, q - pgShell - vec2(0.27, -0.16), pgLime * 0.6 + pgShade);
  if (wet) {
    col = col * vec3(0.93, 0.98, 0.95) + 0.012 * uSpace;
    float many = max(uOwn[1], 0.0), alone = max(-uOwn[1], 0.0);
    for (int i = 0; i < 5; i++) {
      if (i > 2 && many <= 0.0) break;
      float fi = float(i), ph = i == 1 ? -uPhrase : uPhrase;
      vec4 f = i == 0 ? vec4(0.33, 0.09, 0.35, -1) : i == 1 ? vec4(-0.56, 0.2, 0.21, 1) : i == 2 ? vec4(0.7, -0.33, 0.43, -1) : i == 3 ? vec4(-0.02, 0.3, 0.13, -1) : vec4(-0.66, -0.03, 0.19, 1);
      vec4 s = sin(uTime * vec4(0.11, 0.17, 0.09, 0.13) + fi * 2.1 + 0.6);
      float size = f.z * (0.75 + 0.25 * min(pgFit, 1.0)) * (i > 2 ? many : i == 0 ? 1.0 + 0.5 * alone - 0.25 * many : 1.0 - 0.15 * fi * many);
      vec2 at = f.xy * vec2(pgFit, 1.0) + vec2(0.022, 0.014) * s.xy + vec2(0.0, 0.04 * ph);
      at.x += alone * (i == 1 ? -0.9 : sign(fi));
      vec3 go = vec3(f.w, 0.3 * s.z + 0.35 * ph * cos(fi), 0.1 * s.w + 0.14 * ph + (i == 1 ? -0.16 : 0.1));
      pgFish(col, p, at, size, go, uTime + fi * 2.3, i == 1 ? 1.0 : 0.0, i == 2 ? 0.012 : 0.0);
    }
    pgBubbles(col, p);
  } else {
    // the skin of the water
    float st = pgBrush(p + sin(0.04 * uTime), 9.0, 70.0);
    col = mix(col, pgLime * (0.05 + 0.7 * st * st * st), 0.85 * pgIn(p.y - front));
  }
  col += pgLime * (pgDn(0.005, 0.0, abs(p.y - front)) * (0.6 + 0.4 * uLevel) + 0.3 * pgDn(0.003, 0.0, abs(p.y - back)));
  // the brass foot
  float m = -10.1 - 22.2 * p.y;
  vec3 brass = vec3(0.17, 0.1, 0.04) * (1.0 - smoothstep(0.0, 0.5, abs(m - 0.4))) * pgLime;
  return mix(col, brass + pgWood(p.yx) * pgLime * 0.14 * step(1.0, m), smoothstep(-0.02, 0.02, m));
}

// ---- b: cut cotton clouds on rails before a painted sky
vec3 pgForm; // wide, tall, heaped
vec2 pgPuff; // where in its tuft this point lies
const vec3 PG_TUFT[8] = vec3[8](vec3(0, 0.58, 0.36), vec3(0.371, 0.456, 0.36), vec3(-0.548, 0.31, 0.36), vec3(0.437, 0.408, 0.36), vec3(-0.64, 0.1, 0.26), vec3(-0.2, 0.1, 0.26), vec3(0.24, 0.1, 0.26), vec3(0.68, 0.1, 0.26));
// One cloud, its tufts laid back to front: below 0 inside.
void pgCloud(vec2 q, float size, float seed, inout float d) {
  q /= pgForm.xy * size;
  if (abs(q.x) > 1.35 || q.y > 1.35 * pgForm.z) return;
  float m = 9.0;
  for (int j = 0; j < 8; j++) {
    vec3 t = PG_TUFT[j];
    float h = fract(seed * 0.37 + float(j) * 0.618);
    vec2 o = (q - vec2(t.x + 0.14 * (h - 0.5), t.y * pgForm.z)) / (t.z * (0.8 + 0.45 * h));
    float l = dot(o, o);
    if (l < 1.0) pgPuff = o;
    m = min(m, l);
  }
  d = min(d, (sqrt(m) - 1.0) * 0.35 * size);
}
float pgRow(int i, vec2 q, float size) {
  float fi = float(i), W = size * 2.1, dir = i % 2 == 0 ? 1.0 : -1.0, d = 1.0;
  float x = q.x + dir * (0.06 * uPad - mod(uTime * (0.004 + 0.007 * fract(fi * 0.618 + 0.9)), W * 64.0)) + fi * 0.37 + 9.0, c = floor(x / W);
  for (int k = -1; k <= 1; k++) {
    float id = mod(c + float(k), 64.0), h = hash21(vec2(id, fi + 2.0));
    float lift = (0.15 + 0.4 * uEnergy) * uBands[int(mod(id * 5.0 + fi * 3.0, 16.0))] + 0.02 * sin(uTime * 0.21 + id * 2.0);
    pgCloud(vec2(x - (c + float(k) + 0.3 + 0.4 * h) * W, q.y / (1.0 + lift)), size * (0.75 + 0.5 * h), id * 1.7 + fi * 13.0, d);
  }
  return d;
}
// Cotton wool.
vec3 pgCotton(vec2 q, float d, float body, vec3 lit, vec3 under) {
  float wool = pgBrush(q + 0.03 * pgPuff, 70.0, 130.0) - 0.5, rim = smoothstep(0.2, 1.0, length(pgPuff)) * sat(0.25 + dot(pgPuff, vec2(-0.45, 0.85)));
  float t = body + 0.16 * pgPuff.y + 0.6 * rim * rim + 0.2 * wool;
  vec3 c = pgPaint(t, mix(vec3(0.4, 0.42, 0.85), vec3(1.0, 0.76, 0.52), smoothstep(0.25, 0.8, t))) * (pgShade + lit);
  c += lit * vec3(1.0, 0.66, 0.28) * pgDn(0.012, 0.0, -d) * (0.4 + 1.5 * uKeys);
  return c + under * sat(0.6 - 0.6 * pgPuff.y) * (0.7 + 0.8 * wool);
}
// Strips of foil under y: x light, y cover.
vec2 pgFoil(vec2 p, float y) {
  float n = p.x * 62.0, id = floor(n), h = hash11(id + 4.0), dry = max(-uOwn[5], 0.0), all = max(uOwn[5], 0.0);
  float on = sat(3.0 * (pgIn(abs(p.x / pgFit - 0.32) - 0.2, 0.04) * (1.0 - dry) + 1.2 * all - 0.75 * hash11(id + 9.0))) * step(0.4 * h * h - 0.2, p.y) * step(p.y, mix(y, 0.6, all));
  if (on <= 0.0) return vec2(0.0);
  float turn = p.y * (14.0 + 22.0 * h) + h * 40.0 + 1.5 * sin(uTime * 0.35 + h * 9.0), x = n - id - 0.3 - 0.4 * h;
  return vec2(0.1 + 0.25 * abs(sin(turn)) + pow(0.5 + 0.5 * sin(turn * 2.0 + 1.0), 7.0) * (0.6 + 1.8 * uTexture), on * pgIn(abs(x) / 62.0 - 0.0007 - 0.0034 * abs(cos(turn))));
}
vec3 pgSky(vec2 p, vec3 lit, vec2 v) {
  float r = length(v), a = atan(v.y, v.x + 1e-5), br = pgBrush(p, 5.0, 42.0) - 0.5, ray = smoothstep(-0.35, 0.35, sin(a * 15.0 + 0.5 * sin(a * 4.0) + 1.5 * br));
  float t = 0.62 - 0.5 * p.y + 0.18 * ray * exp(-r * 2.0) + 0.3 * br + 0.25 * exp(-r * 4.0);
  vec3 c = pgPiece(pgPaint(t, mix(vec3(1.0, 0.72, 0.42), vec3(0.26, 0.54, 0.8), smoothstep(0.15, 0.6, p.y + 0.6 * r))), vec2(0.5 + 0.55 * p.x / pgFit, 0.75 - 1.3 * p.y));
  c = mix(c, pgPaint(0.9 - 0.2 * br, vec3(1.0, 0.66, 0.22)) * (1.0 + 0.3 * uMic), pgIn(r - 0.12));
  return c * (pgShade + lit / (0.75 + 0.35 * pgLum(lit)));
}
// Past the cloth.
vec3 pgWing(vec2 p, float x, vec3 lit) {
  vec3 c = mix(lit * 0.08 * exp(-x * 7.0) + 0.006, vec3(0.2, 0.14, 0.08) * lit, pgIn(abs(abs(x - 0.16) - 0.03) - 0.004));
  c = mix(c, pgWood(vec2(x, p.y)) * (0.35 + 1.2 * pgDn(0.045, 0.004, x)) * (lit + pgShade), pgIn(x - 0.046));
  return mix(c, 0.6 * lit, pgIn(length(vec2(x - 0.01, (fract(p.y * 8.0) - 0.5) / 8.0)) - 0.0045));
}
vec3 pgRails(vec2 p) {
  float x = p.x - pgBy(1.35, 0.6, 0.12, uOwn[3]) * pgFit, many = pgBy(1.5, 1.0, 0.65, uOwn[1]), shadow = 1.0, d = 1.0;
  vec2 v = p - vec2((-0.3 + 0.16 * sin(TAU * uLoop)) * pgFit, 0.18 + 0.06 * cos(TAU * uLoop));
  vec3 lit = pgLime * (0.16 + 0.95 * exp(-2.6 * dot(v, v))) * (0.95 + (0.25 + 0.6 * uEnergy) * uDrone + 0.25 * uLevel);
  pgPuff = vec2(0.0);
  pgForm = vec3(pgBy(1.5, 1.0, 0.94, uOwn[2]), pgBy(0.5, 0.85, 0.9, uOwn[2]), 1.0 + 0.28 * max(uOwn[2], 0.0));
  // the cloud let down from above
  vec2 q = p - vec2(0.32 * pgFit + 0.012 * sin(0.13 * uTime), 0.27 + 0.006 * sin(0.21 * uTime) - 0.04 * uPhrase);
  pgCloud(q, 0.24, 5.0, d);
  float hung = pgIn(d + 0.012 * (noise(p * 80.0) - 0.5), 0.003) * step(0.0, q.y), hang = smoothstep(-0.02, 0.07, max(d, -q.y)), left = 1.0 - hung, a;
  vec3 col = vec3(0.0);
  if (hung > 0.0) col = hung * pgCotton(p, d, 0.34, pgLime * 0.45, pgInk(3) * uPhrase * 0.5);
  for (int i = 0; i < 5 && left > 0.03; i++) {
    if (i == 3) { vec2 fo = pgFoil(p, p.y - q.y); a = fo.y * left; col += a * fo.x * (lit + 0.2) * mix(vec3(1.0), pgInk(2) + 0.3, 0.5 * uTexture) * 1.5; left -= a; }
    float fi = float(i), far = fi / 4.0, size = (0.31 - 0.066 * fi + 0.0034 * fi * fi) * many, h = p.y + 0.465 - 0.125 * fi + 0.006 * fi * fi;
    int kd = (i + 4) % 5;
    vec3 under = pgInk(kd) * (0.1 + 0.8 * uEnergy) * (kd == 0 ? uDrone : kd == 1 ? uPad : kd == 2 ? uTexture : kd == 3 ? uPhrase : uHits);
    d = 1.0; pgPuff = vec2(0.0);
    if (h > 0.0 && h < size * 1.9 * pgForm.y * pgForm.z) {
      d = pgRow(i, vec2(p.x, h), size);
      if (abs(d + 0.006) < 0.1 * size + 0.006) d += size * 0.09 * (pgBrush(p, 14.0 / size, 14.0 / size) - 0.5);
      a = left * pgIn(d, pgPx + size * 0.006);
      if (a > 0.0) { col += a * pgCotton(p, d, mix(0.16, 0.6, far) + 0.2 * h / size, lit * mix(0.5, 1.0, far), under) * (0.3 + 0.7 * shadow); left -= a; }
    } else if (h <= 0.0) {
      // the rail, and the cloth that hangs from it
      float rail = 0.01 - 0.006 * far;
      vec3 c = pgPaint(0.34 + 0.3 * far + 0.3 * (pgBrush(p + far, 7.0, 60.0) - 0.5), vec3(0.34, 0.44, 0.85)) * (pgShade + lit * 0.7) * smoothstep(-0.02, 0.03, -h - rail);
      vec3 w = pgWood(p.yx) * (pgShade + lit) * (0.35 + 1.1 * pgDn(rail * 0.5, 0.0, -h));
      col += left * mix(c, w, pgIn(-h - rail)) * (0.3 + 0.7 * shadow);
      left = 0.0;
    }
    shadow = (0.3 + 0.7 * smoothstep(-0.02, 0.2, d / size)) * (0.7 + 0.3 * smoothstep(0.0, 0.07, h));
  }
  if (left > 0.03) {
    vec3 c = pgSky(p, lit, v) * (0.4 + 0.6 * shadow) * (0.65 + 0.35 * hang);
    col += left * (x > -pgPx ? mix(c, pgWing(p, x, lit), pgIn(-x)) : c);
  }
  pgSmoke(col, p - vec2(-0.12 * pgFit, -0.3), lit + pgShade);
  return col;
}
vec3 render(vec2 p) {
  pgPx = 1.0 / uRes.y;
  pgFit = clamp(uRes.x / uRes.y / 1.78, 0.42, 1.3);
  pgHand = pgBy(0.0, 0.36 + 0.34 * uVar, 1.0, uOwn[4]);
  pgLime = pgBy(vec3(0.4, 0.62, 1.05), vec3(1.2, 0.98, 0.66), vec3(1.4, 0.56, 0.2), uOwn[0]);
  pgShade = pgBy(vec3(0.03, 0.06, 0.14), vec3(0.125, 0.11, 0.12), vec3(0.14, 0.05, 0.06), uOwn[0]);
  pgLime *= mix(vec3(1.0), 0.5 + pgInk(0), 0.3 * uDrone);
  vec3 col;
  if (uVar < 0.5) col = pgTank(p); else col = pgRails(p);
  // a second hand tint
  float run = uCue * pgDn(1.6, 1.3, length(p + vec2(0.3 * pgFit, 0.1)) + 1.1 * uCue);
  col = pgDye(col, mix(pgInk(4), vec3(0.9, 0.35, 0.5), 0.4), 0.75 * run);
  return screenOf(col * 1.6 * (1.0 - 0.45 * smoothstep(0.45, 1.1, length(p * vec2(0.8 / max(pgFit, 0.6), 1.15)))));
}
