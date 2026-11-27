// name: Gold on black
// a: Autumn grass
// b: Moon and shell
// what: Black lacquer with gold powder sieved onto it: long grasses bend across a corner with plumes, small round leaves and dew of shell, over a bank of dust that thins to nothing, and the gloss mirrors a window; or a large moon cut from plates of shell over swells in fine gold lines, with chips of shell for its light on the water.
// follows: Dust gathers where the piece sounds. Each kind has its own grasses, or its own swells, and they light up in its tint of gold while it plays; low bends the grass and lifts the swells; high and the keys stir the shell, a voice warms the moon; a hit drops a pinch of powder, a cue draws a band of light across; the lamp drifts and the gold gleams.
// own: 0 the ground: 1 pale leaf with dark strokes, -1 lacquer in the colour of the drone; 1 1 bowed low by wind (b: sharp mountains), -1 upright reeds (b: a flat calm); 2 1 broad leaves (b: few bold lines), -1 threads (b: fine lines); 3 1 a second stand across (b: the swells rise high), -1 a few stems (b: they sink away); 4 the powder: 1 scalloped clouds of it, -1 none; 5 1 all shell, -1 outlines only (b: lines of dots); 6 the moon: 1 great (a: behind the grass), -1 a thin crescent; 7 1 rain in fine lines, -1 round flakes fall
float gbDn(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); } // 1 below b, 0 above a
vec2 gbLamp; // where the lamp shines on the lid
float gbPx, gbFine, gbNow, gbPh, gbPale, gbDeep, gbHol;
float gbIn(float d) { return gbDn(gbPx, -gbPx, d); } // 1 inside an edge

// How strongly the lamp lights the gold at a place; the cue draws one band of light across.
float gbLight(vec2 p) {
  vec2 d = (p - gbLamp) * vec2(0.8, 1.0);
  float s = dot(p, vec2(0.92, 0.39)) + 0.75 - 1.7 * (1.0 - uCue);
  return 0.15 + 1.4 * exp(-dot(d, d) * 5.0) + (1.6 * uCue) * exp(-s * s * 22.0) + 0.2 * uLevel;
}
vec3 gbShell(float ph, float bright) {
  vec3 c = vec3(0.69, 0.75, 0.73) + vec3(0.15, 0.10, 0.11) * cos(TAU * (ph + vec3(0.0, 0.45, 0.66)));
  return c * c * c * bright * 1.5;
}
// Gold under this much light: brown in shade, then yellow, then pale. tint is the alloy.
vec3 gbGold(float l, vec3 tint) {
  l = max(l, 0.0);
  vec3 c = (vec3(0.92, 0.49, 0.125) * l + vec3(0.72, 0.54, 0.26) * l * l) * tint;
  if (uOwn[5] > 0.0) c = mix(c, gbShell(gbPh + 0.35 * l, 1.4 * l) * mix(vec3(1.0), tint, 0.5), uOwn[5]);
  return gbPale > 0.0 ? mix(c, 0.1 * tint * tint * c / (0.12 + c), gbPale) : c;
}
// The alloy of a kind: red, green, grey or yellow gold, more of its colour while it sounds.
vec3 gbAlloy(int k, float on) {
  vec3 c = uKind[k];
  float m = max(c.r, max(c.g, c.b));
  return mix(vec3(1.0), c / max(m, 0.05) * 1.15, 0.16 + 0.36 * sat(on) + 0.4 * gbPale);
}
// One sieve of powder: a flake in each cell, there when the powder lies thick enough. Each lies at its own tilt and
// gleams when the lamp is on its side.
float gbSieve(vec2 p, vec2 q, float dens, float cells, float seed, float l) {
  vec2 g = q * cells, id = floor(g);
  float lie = hash21(id * 1.7 + seed + 31.0), on = sat((dens * 1.05 - lie) * 7.0);
  if (on <= 0.0) return 0.0;
  vec2 h = hash22(id + seed);
  vec2 f = g - id - 0.2 - 0.6 * h;
  f *= vec2(1.0, 1.0 + 0.8 * fract(lie * 57.0));
  float r = 0.12 + 0.14 * h.y * h.y + 0.05 * h.x, px = cells * gbPx, rr = max(r, 0.55 * px);
  float cov = gbDn(rr + 0.5 * px, rr - 0.5 * px, length(f)) * (r * r) / (rr * rr);
  vec2 tilt = (h - 0.5) * 2.0 - (gbLamp - p) * 1.3 + 0.35 * vec2(sin(gbNow * 0.11 + h.x * TAU), cos(gbNow * 0.13 + h.y * TAU));
  float gleam = exp(-dot(tilt, tilt) * (3.0 + 3.0 * uTone));
  return cov * on * (0.28 + 2.6 * gleam * (0.6 + 0.4 * uEnergy)) * l;
}
vec3 gbDust(vec3 c, vec3 pw) { return gbPale > 0.0 ? mix(c + pw, c * exp(-vec3(0.5, 0.9, 1.5) * pw * 16.0) + pw * 0.3, gbPale) : c + pw; }
// All the powder at a place, fine to coarse.
vec3 gbPowder(vec2 p, float dens, float coarse, float l, vec3 tint) {
  if (max(dens, coarse) < 0.01) return vec3(0.0);
  float a = gbSieve(p, rot(0.4) * p, dens, gbFine, 3.0, l);
  a += gbSieve(p, rot(0.9) * p, dens * 0.75, gbFine * 0.67, 11.0, l);
  vec3 c = gbGold(a, tint);
  float b = gbSieve(p, rot(2.1) * p, coarse * 0.6, gbFine * 0.43, 23.0, l);
  return c + gbGold(b * 1.1, tint * vec3(1.0, 0.86, 0.66));
}
float gbGrain(vec2 p) { return 0.6 * hash21(floor(rot(0.3) * p * gbFine * 1.5)) + 0.4 * hash21(floor(rot(0.9) * p * gbFine * 0.9) + 9.0); }
// The shell: colours that turn with the angle, never raw.
// The lacquer: warm black, and the window it mirrors.
vec3 gbLacquer(vec2 p, vec2 w) {
  vec2 q = p - gbLamp;
  vec3 c = vec3(0.0016, 0.0013, 0.0013) + vec3(0.0055, 0.0034, 0.002) * exp(-dot(q, q) * 3.0);
  q = p - w;
  q *= 1.0 + 0.25 * dot(q, q);
  q = rot(-0.16) * q; q.x += 0.34 * q.y;
  vec2 s = vec2(0.21, 0.36), e = abs(q) - s;
  float soft = 0.03 + 0.03 * uSpace;
  float pane = gbDn(soft, -soft, e.x) * gbDn(soft, -soft, e.y);
  vec2 m = abs(fract(q / s * vec2(1.5, 2.0)) - 0.5); // two bars up, three across
  float bars = smoothstep(0.0, 0.11, 0.5 - m.x) * smoothstep(0.0, 0.1, 0.5 - m.y);
  c += vec3(0.0078, 0.0086, 0.0092) * pane * (0.35 + 0.65 * bars) * sat(0.62 + 1.6 * q.y - 0.5 * q.x) * (0.9 + 0.5 * uPad);
  if (uOwn[0] == 0.0) return c;
  vec3 k = uKind[0] * uKind[0];
  q = p - gbLamp;
  float glow = exp(-dot(q, q) * 1.3);
  c += gbDeep * k * (0.1 + 0.3 * glow + 0.05 * noise(p * 3.0)) * (1.0 + 9.0 * c.b);
  if (gbPale > 0.0) {
    vec2 g = (p + 5.0) * 5.2, id = floor(g), f = fract(g);
    float seam = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)), lie = hash21(id);
    c = mix(c, (0.1 + 0.9 * k) * (0.66 + 0.14 * lie + 0.2 * noise(g * 1.3 + lie * 9.0) + 0.28 * glow + 0.12 * uPad) * (1.0 + 0.1 * gbDn(0.035, 0.0, seam)) * (0.93 + 0.14 * hash21(floor(g * 70.0))), gbPale);
  }
  return c;
}
float gbDisc(vec2 q, float big) {
  float d = length(q) - big, n = max(-uOwn[6], 0.0);
  return n > 0.0 ? max(d, big * mix(1.0, 0.94, n) - length(q - big * vec2(0.83, 0.5) * mix(2.2, 0.42, n))) : d;
}
void gbLay(inout vec4 acc, float d, float gap, vec3 col);
float gbX(vec2 a, vec2 b) { return a.x * b.y - a.y * b.x; }
void gbMoonAt(inout vec4 acc, vec2 p, vec2 q, float md, float l) {
  if (md < 0.01) {
    vec2 g = rot(0.45) * q * vec2(5.0, 14.0) + 0.5, id = floor(g), f = fract(g), best = vec2(0.0);
    float d1 = 9.0, d2 = 9.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 c = vec2(i, j), e = c + 0.15 + 0.7 * hash22(id + c + 7.0) - f;
      float dd = dot(e, e);
      if (dd < d1) { d2 = d1; d1 = dd; best = id + c; } else d2 = min(d2, dd);
    }
    vec2 h = hash22(best + 3.0);
    float seam = (sqrt(d2) - sqrt(d1)) / 9.0;
    vec2 dir = rot(0.5 + 1.3 * (h.x - 0.5)) * vec2(1.0, 0.0);
    float grow = noise(vec2(dot(q, dir) * 7.0, gbX(q, dir) * 70.0 + 3.0 * noise(q * 14.0)) + h * 40.0);
    float ph = 0.16 * h.y + 0.75 * noise(q * 4.0 + 3.0) + 0.22 * grow + 0.5 * dot(gbLamp - p, dir) + 0.06 * sin(gbNow * 0.16 + h.x * TAU) + 0.3 * uHigh + 0.12 * uMic;
    float flare = 0.5 + 0.5 * cos(2.4 * dot(gbLamp - p, dir) + 1.8 * (h.y - 0.5) + 5.0 * noise(q * 4.0 + 0.3 * h));
    flare *= flare;
    vec3 c = gbShell(ph, (0.6 + 1.9 * flare) * (0.95 + 0.25 * l) * (1.0 + 1.1 * dot(q, vec2(-0.6, 1.3))) + 0.5 * uMic + 0.3 * uHigh) + 0.35 * flare * flare * vec3(1.0, 0.96, 0.9);
    c *= (0.6 + 0.7 * grow) * (0.5 + 0.5 * smoothstep(0.0, 0.0008 + gbPx, seam));
    gbLay(acc, md, 0.004, c);
  }
}
void gbCloud(vec2 p, inout float dens, inout float coarse) {
  if (uOwn[4] < 0.0) { dens *= 1.0 + uOwn[4]; coarse *= 1.0 + uOwn[4]; return; }
  for (int i = 0; i < 3; i++) {
    float n = float(i), x = p.x + 0.31 * n + 0.012 * sin(gbNow * 0.05 + n), w = 0.17 + 0.05 * n, c = (fract(x / w) - 0.5) * w, h = hash11(floor(x / w) + n * 7.0);
    float way = i == 1 ? -1.0 : 1.0, y = way * (p.y - (i == 0 ? 0.27 : i == 1 ? -0.3 : 0.04)) + 0.1 * (h - 0.5) + 0.6 * sqrt(max(0.25 * w * w - c * c, 0.0));
    float there = i == 2 ? gbDn(0.0, -0.5, p.x + 0.16 * h) : 1.0, e = gbIn(-y) * there, thin = exp(-max(y, 0.0) * (i == 2 ? 16.0 : 8.0));
    dens = mix(dens, max(dens * 0.6, 1.5 * thin + 0.2), uOwn[4] * e); coarse = mix(coarse, 0.5 * thin, uOwn[4] * e);
  }
}

// A bent stroke from A over B to C: x is how far aside (its sign is the side), y how far along. Near enough close to it, cheap far off.
vec2 gbBend(vec2 p, vec2 A, vec2 B, vec2 C, float far, out vec2 T) {
  A -= p; B -= p; C -= p;
  float a = gbX(A, C), b = 2.0 * gbX(B, A), d = 2.0 * gbX(C, B), f = b * d - a * a;
  vec2 u = C - B, v = B - A, w = C - A, g = 2.0 * (b * u + d * v + a * w);
  float gg = dot(g, g) + 1e-12;
  T = vec2(0.0, 1.0);
  if (f * f > far * far * 3.0 * gg) return vec2(9.0, 0.0);
  vec2 q = A + f * vec2(g.y, -g.x) / gg;
  float k = 2.0 * a + b + d, t = sat((gbX(q, w) + 2.0 * gbX(v, q)) / (k < 0.0 ? min(k, -1e-6) : max(k, 1e-6)));
  vec2 e = mix(mix(A, B, t), mix(B, C, t), t);
  T = normalize(mix(v, u, t) + 1e-6);
  return vec2(length(e) * (gbX(T, e) > 0.0 ? 1.0 : -1.0), t);
}
// The strokes of the grasses, laid one after another: what is kept is the one in front at this place.
struct GbLine { vec2 u, T; float len, w, seed; int k; bool open; };
vec4 gbSway;
void gbTry(inout GbLine S, vec2 p, float seed, vec2 A, vec2 B, vec2 C, float w, int k, bool open, float reach) {
  bool plume = reach > 0.03;
  if (uOwn[3] < 0.0) { float few = 1.0 - smoothstep(0.0, 0.25, -1.6 * uOwn[3] * fract(seed * 0.618) - 0.3); C = mix(A, C, few); B = mix(A, B, few); if (few < 0.02) return; }
  if (uOwn[1] != 0.0) {
    float up = max(-uOwn[1], 0.0), bow = max(uOwn[1], 0.0), tall = distance(A, C) * (0.75 + 0.35 * fract(seed * 0.382));
    vec2 D = A + vec2(0.22 * (C.x - A.x) - 0.06, tall);
    B = mix(B, 0.5 * (A + D) + vec2(0.03, 0.0), up); C = mix(C, D, up);
    B += bow * vec2(-0.16, 0.1); C += bow * vec2(-0.3 - 0.2 * fract(seed * 0.755), -0.2);
  }
  if (!plume && uOwn[2] != 0.0) { float m = exp2(uOwn[2] * (uOwn[2] > 0.0 ? 1.9 : 1.5)); w *= m; reach *= max(m, 1.0); }
  vec2 s = vec2(-1.0, -0.5) * (dot(gbSway, fract(vec4(0.618, 0.382, 0.755, 0.57) * seed)) + 0.06 * uLow * (0.6 + 0.4 * fract(seed * 0.618)));
  C += s; B += 0.35 * s;
  vec2 T, u = gbBend(p, A, B, C, reach, T);
  float len = 1.1 * distance(A, C);
  if (plume && u.y >= 1.0 && u.x < 5.0) u = vec2(gbX(T, p - C), 1.0 + dot(p - C, T) / len); // a plume goes on past its tip
  if (u.y > 1.1) return;
  float ww = plume ? min(abs(S.u.x), reach) : w * (0.45 + 0.65 * smoothstep(0.0, 0.45, u.y)) * sqrt(max(1.0 - u.y * u.y, 0.0)) * (1.0 - 0.35 * u.y) + 0.0008;
  if (abs(u.x) < ww + (plume ? 0.0 : 0.0035)) S = GbLine(u, T, len, ww, seed, k, open);
}
float gbOf(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : uPhrase; }
void gbLay(inout vec4 acc, float d, float gap, vec3 col) {
  acc = mix(acc, vec4(0.0), gbDn(gap + gbPx, gap - gbPx, d)); // the line left bare round what lies in front
  acc = mix(acc, vec4(col, 1.0), gbIn(d));
}
// How brightly a stroke shines: the lamp across its length, and the light that climbs it while its kind sounds.
float gbShine(GbLine S, vec2 p, float l, out vec3 alloy, out float run) {
  float on = gbOf(S.k);
  alloy = gbAlloy(S.k, on);
  vec2 ld = gbLamp - p; ld /= length(ld) + 1e-3;
  float an = 1.0 - dot(S.T, ld) * dot(S.T, ld);
  run = on * (0.4 + 0.6 * uEnergy) * gbDn(1.2 * on + 0.1, 1.2 * on - 0.5, S.u.y);
  return l * (0.4 + 0.8 * an * an) + 0.85 * run;
}
// The powder the piece lays down, and the pinch a hit drops at c. Returns its colour.
vec3 gbSound(vec2 p, float x, vec2 c, inout float dens, inout float coarse, inout float l) {
  vec2 n = vec2(noise(p * 5.0), noise(p * 3.0 + 4.0)) - 0.5;
  vec4 m = piece(sat(vec2(0.5 + x / 1.75, 0.5 - p.y * 1.02) + n * vec2(0.09, 0.12)));
  dens += (0.35 + 0.35 * uEnergy) * m.a * (0.4 + 0.8 * noise(p * 9.0));
  c -= p;
  float r = 0.11 + 0.14 * (1.0 - uHits), pinch = uHits * exp(-dot(c, c) / (r * r));
  l += 1.3 * pinch;
  dens += 1.1 * pinch;
  coarse += 0.3 * m.a + 0.9 * pinch;
  return mix(mix(vec3(1.0), m.rgb / max(m.a, 0.05) * 1.2, 0.5 * sat(m.a * 2.0)), uKind[4] * 1.4 + 0.3, 0.4 * sat(pinch));
}
vec3 gbGrass(vec2 p) {
  float shift = clamp(0.5 * uRes.x / uRes.y, 0.34, 0.95) - 0.89;
  vec2 o = p; p.x -= shift; // the grasses keep to their corner
  float l = gbLight(p), gr = gbGrain(p);
  vec4 acc = vec4(0.0);
  // powder: the bank they grow on, a haze across, and what the piece lays down
  float hill = -0.335 + 0.10 * sin(p.x * 2.1 + 0.4) + 0.02 * sin(p.x * 5.3);
  float hd = hill - p.y;
  float dens = hd > 0.0 ? 0.95 * exp(-hd * 7.5) : 0.0;
  dens *= gbIn(-hd);
  float coarse = 0.5 * dens;
  float ax = dot(p - vec2(-0.1, -0.05), vec2(0.93, 0.36)), ay = dot(p - vec2(-0.1, -0.05), vec2(-0.36, 0.93));
  float n = noise(p * vec2(2.3, 3.1) + 4.0);
  float haze = exp(-ay * ay * 30.0) * smoothstep(-0.95, 0.7, ax) * (0.25 + 0.9 * n * n);
  dens += 0.4 * haze;
  coarse += 0.2 * haze;
  coarse += 0.12 * uTexture * haze;
  gbCloud(p, dens, coarse);
  vec3 ptint = gbSound(p, o.x, vec2(-0.16 + 0.2 * sin(gbNow * 0.043), 0.08 + 0.1 * cos(gbNow * 0.057)), dens, coarse, l);
  gbSway = 0.012 * sin(gbNow * vec4(0.31, 0.23, 0.17, 0.27) + vec4(0.0, 1.9, 3.1, 4.7));
  GbLine none = GbLine(vec2(9.0, 0.0), vec2(0.0, 1.0), 1.0, 1.0, 0.0, 0, false), G = none, F = none, R = none;
  const float y0 = -0.62;
  gbTry(G, p, 3.0, vec2(0.80, y0), vec2(0.88, 0.20), vec2(1.02, 0.28), 0.011, 0, false, 0.016);
  gbTry(G, p, 4.0, vec2(0.66, y0), vec2(0.71, 0.60), vec2(0.30, 0.445), 0.011, 2, true, 0.016);
  gbTry(G, p, 5.0, vec2(0.62, y0), vec2(0.48, 0.28), vec2(-0.26, 0.20), 0.0125, 0, false, 0.018);
  gbTry(G, p, 6.0, vec2(0.58, y0), vec2(0.66, 0.08), vec2(0.90, -0.03), 0.011, 2, false, 0.016);
  gbTry(G, p, 7.0, vec2(0.54, y0), vec2(0.28, 0.02), vec2(-0.44, -0.12), 0.013, 0, true, 0.018);
  gbTry(G, p, 8.0, vec2(0.78, y0), vec2(0.84, 0.00), vec2(0.50, 0.11), 0.010, 1, true, 0.016);
  gbTry(G, p, 9.0, vec2(0.66, y0), vec2(0.58, 0.14), vec2(0.12, -0.05), 0.0145, 0, false, 0.019);
  gbTry(G, p, 10.0, vec2(0.50, y0), vec2(0.40, -0.20), vec2(0.00, -0.30), 0.011, 2, false, 0.016);
  gbTry(G, p, 11.0, vec2(0.42, y0), vec2(0.20, -0.32), vec2(-0.22, -0.43), 0.010, 1, true, 0.016);
  gbTry(F, p, 12.0, vec2(0.70, y0), vec2(0.74, 0.60), vec2(0.45, 0.32), 0.0, 3, false, 0.1);
  gbTry(F, p, 13.0, vec2(0.60, y0), vec2(0.46, 0.44), vec2(-0.06, 0.32), 0.0, 3, false, 0.1);
  gbTry(F, p, 14.0, vec2(0.52, y0), vec2(0.32, 0.12), vec2(-0.17, 0.06), 0.0, 3, false, 0.1);
  gbTry(R, p, 15.0, vec2(0.46, y0), vec2(0.10, -0.20), vec2(-0.54, -0.25), 0.0, 1, false, 0.06);
  gbTry(R, p, 16.0, vec2(0.88, y0), vec2(0.98, 0.10), vec2(0.68, 0.12), 0.0, 1, false, 0.06);
  if (uOwn[3] > 0.0) {
    vec2 o2 = vec2(-0.16 - p.x, p.y + 0.5 * (1.0 - uOwn[3]));
    gbTry(G, o2, 17.0, vec2(0.72, y0), vec2(0.66, 0.34), vec2(0.16, 0.30), 0.012, 1, false, 0.018);
    gbTry(G, o2, 18.0, vec2(0.6, y0), vec2(0.6, -0.02), vec2(0.2, -0.12), 0.012, 3, false, 0.018);
    gbTry(G, o2, 19.0, vec2(0.8, y0), vec2(0.86, 0.3), vec2(0.62, 0.42), 0.011, 2, true, 0.017);
    gbTry(G, o2, 20.0, vec2(0.5, y0), vec2(0.4, -0.2), vec2(0.05, -0.32), 0.011, 0, false, 0.017);
    gbTry(F, o2, 21.0, vec2(0.66, y0), vec2(0.66, 0.3), vec2(0.3, 0.16), 0.0, 3, false, 0.1);
  }
  if (uOwn[6] != 0.0) { vec2 q = p + vec2(0.02 + 0.2 * max(-uOwn[6], 0.0), -0.09 - 0.12 * max(-uOwn[6], 0.0)); gbMoonAt(acc, p, q, gbDisc(q, 0.02 + 0.29 * max(uOwn[6], 0.0) + 0.14 * max(-uOwn[6], 0.0)), l); }
  vec3 alloy; float run, gl;
  // plumes: fine hairs that leave the stalk and fall back
  if (F.u.x < 5.0 && abs(F.u.x) < 0.1) {
    gl = gbShine(F, p, l, alloy, run);
    float d = abs(F.u.x), side = F.u.x > 0.0 ? 1.0 : -1.0, len = F.len, from = len * 0.62;
    float s0 = F.u.y * len - (2.35 - 0.35 * side) * d + (9.0 - 2.5 * side) * d * d + 0.005 * side + 0.0012 * sin(d * 120.0 + F.u.y * 50.0), z = (s0 - from) / (len - from);
    if (F.u.y < 1.0) gbLay(acc, d - 0.0015, 0.003, gbGold(gl * (0.6 + 0.8 * gr), alloy));
    if (z > 0.0) {
      float cell = 0.0125, ci = floor(s0 / cell), hh = hash11(ci + F.seed * 13.0 + side * 3.0);
      float lim = (0.02 + 0.06 * sin(PI * sat(z * 0.75 + 0.12))) * (0.5 + 0.65 * hh) * (1.0 + 0.22 * side) * gbDn(1.1, 0.8, z);
      float q = abs(fract(s0 / cell) - 0.35 - 0.3 * hh) * cell * 0.43, x = d / max(lim, 1e-3);
      float wd = 0.0015 * (1.1 - x) * (0.45 + 0.75 * gbDn(0.42, 0.12, abs(fract(d * 150.0 + hh * 7.0) - 0.5)));
      float c = gbDn(gbPx * 1.2, -gbPx * 0.6, q - wd) * gbDn(1.0, 0.8, x) * gbDn(1.04, 0.99, F.u.y);
      acc = mix(acc, vec4(gbGold((gl + 0.6 * run) * (0.5 + 0.8 * gr) * (1.2 - 0.5 * x), alloy), 1.0), c);
    }
  }
  // blades: raised, the rib left bare; some only outlined and sprinkled
  if (abs(G.u.x) < G.w + 0.005) {
    gl = gbShine(G, p, l, alloy, run);
    float d = abs(G.u.x), s = G.u.x / G.w, e = d - G.w + 0.001 * (gr - 0.5), in_ = gbIn(e);
    vec3 g = gbGold(gl * (0.75 + 0.42 * s) * (0.72 + 0.56 * gr), alloy);
    acc = mix(acc, vec4(0.0), gbIn(e - 0.0032));
    if (G.open) {
      dens = mix(dens, 0.1 + 0.8 * sat(0.5 + 0.5 * s) * (0.4 + 0.6 * G.u.y) + 0.4 * run, in_);
      coarse = mix(coarse, 0.45, in_);
      acc = mix(acc, vec4(g * 1.15, 1.0), gbIn(min(abs(e + 0.0012) - 0.001, d - 0.0006)));
    } else {
      float rib = gbDn(0.0011 + gbPx, 0.0011 - gbPx, d) * gbDn(0.95, 0.6, G.u.y);
      acc = mix(acc, vec4(g, 1.0), in_ * (1.0 - 0.85 * rib) * (1.0 - gbHol));
      if (gbHol > 0.0) acc = mix(acc, vec4(g * 1.15, 1.0), gbHol * gbIn(min(abs(e + 0.0012) - 0.001, d - 0.0006)));
      float tc = G.u.y * 7.0 + G.seed * 0.37, dh = hash11(floor(tc) + G.seed * 5.0); // dew, in shell
      vec2 dq = vec2((fract(tc) - 0.5) / 7.0 * G.len, abs(G.u.x + (dh < 0.15 ? 0.6 : -0.6) * G.w));
      if (dh < 0.3 && G.u.y > 0.25) gbLay(acc, length(dq) - 0.0028 - 0.003 * fract(dh * 9.0), 0.0018, gbShell(0.4 + 40.0 * dq.x + dh + 0.8 * gbLamp.x + 0.3 * uHigh, 0.8 + 0.8 * l + 0.8 * uKeys));
    }
  }
  // sprays: small round leaves in pairs, gold, sprinkled or shell
  if (abs(R.u.x) < 0.06) {
    gl = gbShine(R, p, l, alloy, run);
    float d = abs(R.u.x), side = R.u.x > 0.0 ? 1.0 : -1.0, cell = 0.05;
    if (R.u.y < 1.0) gbLay(acc, d - 0.0013, 0.003, gbGold(gl * (0.6 + 0.8 * gr), alloy));
    float a2 = R.u.y * R.len - d * 0.6 + 0.02 * side, ci = floor(a2 / cell), hh = hash11(ci * 1.3 + side * 5.0 + R.seed);
    float size = (0.6 + 0.5 * hh) * smoothstep(0.1, 0.3, ci * cell / R.len) * gbDn(0.98, 0.7, (ci + 1.0) * cell / R.len + 0.08);
    if (size > 0.1) {
      vec2 f = rot(0.5 * (hh - 0.5)) * vec2(a2 - (ci + 0.5) * cell, d - 0.005 - 0.0185 * size);
      float e = (length(f * vec2(1.4 + 12.0 * f.y, 1.0)) - 0.0185 * size) * 0.8, pick = fract(hh * 7.31), in_ = gbIn(e);
      float vein = gbDn(0.0008 + gbPx, 0.0008 - gbPx, abs(f.x)) * gbDn(0.013, 0.005, abs(f.y)) * in_;
      vec3 g = gbGold(gl * (0.5 + 0.8 * gr) * (0.8 + 22.0 * f.x), alloy);
      if (pick > 0.5 && pick < 0.8) {
        acc = mix(acc, vec4(0.0), gbIn(e - 0.0025));
        dens = mix(dens, 0.35 + 18.0 * f.x, in_); coarse = mix(coarse, 0.4, in_);
        acc = mix(acc, vec4(g, 1.0), max(gbIn(abs(e + 0.001) - 0.0009), vein));
      } else {
        if (pick < 0.12) g = gbShell(0.3 * hh + f.x * 12.0 + f.y * 9.0 + 0.6 * gbLamp.x + 0.25 * uHigh, 0.25 + 0.5 * l + 0.5 * uKeys);
        gbLay(acc, e + 0.001 * (gr - 0.5), 0.0025, g);
        acc.rgb *= 1.0 - 0.85 * vein;
      }
    }
  }
  vec3 col = gbLacquer(o, vec2(-0.43 * smoothstep(0.3, 0.8, 0.5 * uRes.x / uRes.y) - 0.06 + 0.02 * sin(gbNow * 0.05), 0.17));
  col = gbDust(col, gbPowder(p, dens, coarse, l, ptint) * (1.0 - acc.a) + vec3(0.075, 0.037, 0.010) * sat(dens) * dens * l * (1.0 - acc.a));
  return col * (1.0 - acc.a) + acc.rgb;
}

vec3 gbMoon(vec2 p) {
  float asp = 0.5 * uRes.x / uRes.y;
  float l = gbLight(p), gr = gbGrain(p);
  vec2 mc = vec2(-0.33 * smoothstep(0.25, 0.85, asp), 0.10);
  float R = 0.245 * (1.0 + 0.6 * max(uOwn[6], 0.0) - 0.15 * max(-uOwn[6], 0.0));
  vec4 acc = vec4(0.0);
  // powder in the sky: two bars of haze, and what the piece lays down
  float n = noise(p * vec2(2.1, 5.0) + 11.0);
  float y1 = p.y - 0.005 - 0.045 * sin(p.x * 2.3 + 0.8), y2 = p.y - 0.23 - 0.03 * sin(p.x * 3.1 + 1.0);
  float h1 = exp(-y1 * y1 * (y1 < 0.0 ? 900.0 : 90.0)) * smoothstep(-0.75, 0.35, p.x); // firm below, thinning upward
  float h2 = exp(-y2 * y2 * (y2 < 0.0 ? 1400.0 : 200.0)) * smoothstep(0.0, 0.5, p.x) * gbDn(1.0, 0.6, p.x);
  float dens = (0.85 * h1 + 0.4 * h2) * (0.35 + n), coarse = 0.4 * dens;
  gbCloud(p, dens, coarse);
  vec3 ptint = gbSound(p, p.x, vec2(0.22 + 0.2 * sin(gbNow * 0.043), 0.12 + 0.08 * cos(gbNow * 0.057)), dens, coarse, l);
  vec2 q = p - mc;
  float md = gbDisc(q, R);
  gbMoonAt(acc, p, q, md, l);
  acc.rgb *= 1.0 - 0.6 * sat(dens * 1.3); // powder drifts across its foot
  // the swells, back to front: the one in front at this place is kept
  float sh = 0.0, dd = -1.0, nrm = 1.0, slope = 0.0, z = 0.0, A = 0.0, fi = -1.0, hide = 0.0, spray = 0.0;
  for (int i = 0; i < 6; i++) {
    float w = float(i), zz = w / 5.0, K = mix(7.0, 2.4, zz), a = mix(0.05, 0.20, zz) * (0.85 + 0.4 * uLow), base = mix(-0.13, -0.56, zz);
    if (uOwn[3] != 0.0) base += (uOwn[3] > 0.0 ? 0.36 * (1.0 - 0.45 * zz) : 0.3 * (1.0 - 0.75 * zz)) * uOwn[3];
    if (uOwn[1] != 0.0) a *= uOwn[1] > 0.0 ? 1.0 + 0.5 * uOwn[1] : 1.0 + 0.9 * uOwn[1];
    float x = p.x * K + w * 2.1 + 0.25 * sin(gbNow * 0.12 + w) + uTravel * mix(0.05, 0.03, zz);
    x += 0.5 * cos(x + 0.6) + 0.4 * sin(0.37 * x + w);
    float h = exp((1.0 + zz) * (sin(x) - 1.0)), sl = a * K * (1.0 + zz) * cos(x) * h, n1, d;
    if (uOwn[1] > 0.0) {
      float t = asin(0.999 * sin(x)) / PI + 0.5, j = noise(vec2(x * 1.9, w)) - 0.5;
      h = mix(h, t * t * (1.25 - 0.4 * t) + t * (0.5 * j + 0.16 * (noise(vec2(x * 7.0, w + 4.0)) - 0.5)), uOwn[1]); sl = mix(sl, a * K * 0.6 * t * sign(cos(x)), uOwn[1]);
    }
    n1 = 1.0 / sqrt(1.0 + sl * sl); d = base + a * h - p.y;
    hide = max(hide, smoothstep(-0.004 - gbPx, -0.004 + gbPx, d * n1));
    spray = max(d < 0.0 ? h * h * exp(d * 45.0) : 0.0, spray * (d < 0.0 ? 1.0 : 0.0));
    if (d * n1 > -0.004) { sh = h; dd = d; nrm = n1; slope = sl; z = zz; A = a; fi = w; }
  }
  acc *= 1.0 - hide;
  dens += 0.55 * spray * noise(p * 14.0); // spray off the crests
  if (fi >= 0.0) {
    int k = fi < 0.5 ? 2 : fi < 1.5 ? 1 : fi < 2.5 ? 3 : fi < 3.5 ? 1 : 0;
    float on = gbOf(k), sp = mix(0.0075, 0.0155, z) * exp2(uOwn[2] * (uOwn[2] > 0.0 ? 1.8 : 0.7)), in_ = gbIn(-dd * nrm);
    float v = dd - 0.65 * A * sh * (1.0 - exp(-max(dd, 0.0) * 2.5));
    float row = max(floor(v / sp), 0.0), fr = v / sp - row, rw = fr < 0.5 ? row : row + 1.0;
    dens = mix(dens, 1.1 * exp(-max(dd, 0.0) / (sp * 2.2)) * (0.08 + 0.92 * sh) * (0.4 + noise(p * 6.0)), in_);
    coarse = mix(coarse, 0.3 * dens, in_);
    float press = noise(vec2(p.x * mix(6.0, 3.5, z) + rw * 3.7, rw * 1.3 + fi * 9.0));
    press = rw < 0.5 ? 1.3 : sat(press * 2.0 - 0.4 - 0.065 * rw + 0.4 * sh); // the brush lifts: lines swell, thin and break off
    float ln = gbIn(min(abs(fr), 1.0 - fr) * sp * nrm - mix(0.0009, 0.0018, z) * press * (1.0 + 3.5 * max(uOwn[2], 0.0))) * smoothstep(0.02, 0.2, press);
    if (gbHol > 0.0) { float u = fract(p.x / sp + 0.5 * mod(rw, 2.0)) - 0.5, fy = min(abs(fr), 1.0 - fr); ln = mix(ln, gbIn((length(vec2(u, fy * nrm)) - 0.1 - 0.2 * press) * sp), gbHol); }
    vec2 T = vec2(nrm, slope * nrm), ld = gbLamp - p; ld /= length(ld) + 1e-3;
    float an = 1.0 - dot(T, ld) * dot(T, ld), under = (p.x - mc.x) * 3.2; under = 0.4 * exp(-under * under);
    float gl = (l + under) * (0.35 + 0.85 * an * an) + on * (0.4 + 0.7 * uEnergy) * (0.25 + 0.75 * band(sat(0.5 + p.x / 1.8))) * (0.2 + 0.8 * sh);
    acc = mix(acc, vec4(gbGold(gl * (0.6 + 0.7 * gr) * (0.3 + 0.8 * exp(-rw * 0.085)), gbAlloy(k, on)), 1.0), ln);
    // chips of shell where the moon lies on the water
    float wx = (p.x - mc.x) / (0.10 + 0.2 * z), wide = sp * 5.0;
    vec2 cg = vec2(p.x / wide + 0.37 * row, row); float ch = hash21(floor(cg) + fi * 17.0);
    if (dd > sp && ch > 0.5 + 0.5 * wx * wx) {
      vec2 f = vec2((fract(cg.x) - 0.5) * wide, (fr - 0.5) * sp);
      float e = abs(f.x) - wide * (0.16 + 0.3 * fract(ch * 9.1));
      e = max(e, abs(f.y) - sp * 0.22 * sqrt(sat(-e / (wide * 0.2))));
      acc = mix(acc, vec4(gbShell(0.5 * ch + 0.8 * gbLamp.x + 5.0 * f.x + 0.35 * uHigh, 0.25 + 1.0 * fract(ch * 5.3) + 0.5 * uKeys), 1.0), gbIn(e));
    }
  }
  vec3 col = gbLacquer(p, vec2(0.5 * smoothstep(0.3, 0.8, asp) + 0.02 * sin(gbNow * 0.05), 0.24));
  vec3 pw = gbPowder(p, dens, coarse, l, ptint);
  if (gbPale > 0.0) pw += vec3(0.07, 0.035, 0.01) * sat(dens) * dens * gbPale;
  col += vec3(0.075, 0.037, 0.010) * sat(dens) * dens * l * (1.0 - gbPale);
  col = col * (1.0 - acc.a) + acc.rgb;
  return gbDust(col, pw * (1.0 - acc.a * (0.32 + 0.48 * hide)));
}

vec3 render(vec2 p) {
  gbPale = max(uOwn[0], 0.0); gbDeep = max(-uOwn[0], 0.0); gbHol = max(-uOwn[5], 0.0); gbPh = noise(p * 5.0) + 0.5 * noise(p * vec2(40.0, 9.0));
  gbPx = 0.75 / uRes.y; gbFine = min(430.0, uRes.y * 0.42); gbNow = uTime;
  gbLamp = vec2(0.12 + 0.42 * sin(uTime * 0.06), 0.12 + 0.16 * sin(uTime * 0.047 + 1.0));
  vec3 c = uVar < 0.5 ? gbGrass(p) : gbMoon(p);
  if (uOwn[7] > 0.0) for (int k = 0; k < 2; k++) {
    float n = 26.0 + 22.0 * float(k);
    vec2 g = rot(-0.14) * p * vec2(n, 2.2); float h = hash11(floor(g.x) + 31.0 * float(k)); g.y += uTime * (0.5 + 0.4 * h) + h * 9.0;
    float m = hash21(vec2(floor(g.x), mod(floor(g.y), 509.0))), y = fract(g.y), ln = gbIn((abs(fract(g.x) - 0.5) / n - 0.0009)) * gbDn(0.5, 0.0, abs(y - 0.5) / (0.4 + 0.6 * m)) * step(0.35, m);
    c = mix(c, mix(gbGold(0.5 + 0.4 * uHigh, vec3(1.0)), vec3(0.45, 0.5, 0.52), 0.5 - 0.3 * gbPale), ln * uOwn[7] * 0.5);
  }
  if (uOwn[7] < 0.0) for (int k = 0; k < 4; k++) {
    float n = 5.0 * exp2(0.6 * float(k));
    vec2 g = p * n + vec2(0.4 * sin(uTime * 0.15 + float(k) + p.y * 2.0) + uTime * 0.07, uTime * 0.22) + float(k) * 7.3, h = hash22(mod(floor(g), 503.0)), v = fract(g) - 0.3 - 0.4 * h;
    v = rot(h.y * 40.0 + uTime * 0.15) * v;
    float d = length(v * vec2(1.0, 1.5 + h.y)) - 0.05 - 0.13 * h.x;
    c = mix(c, mix(uKind[4] * uKind[4], vec3(0.75), 0.5) * (0.45 + 0.35 * fract(h.x * 7.0) + 0.4 * gbLight(p)), -uOwn[7] * gbDn(0.012 + gbPx * n, -0.012, d) * step(0.62, fract(h.y * 9.0)) * 0.9);
  }
  return screenOf(c * 1.5);
}
