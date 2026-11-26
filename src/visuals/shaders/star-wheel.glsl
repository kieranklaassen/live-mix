// name: Star wheel
// a: Spiral
// b: Pole trails
// what: A galaxy seen at a slant, its disc cut by the frame: two arms of countless small stars with pink knots and brown dust round a warm old core, and a few nearer stars in front; or a long exposure of the night sky, the stars drawn out into arcs round the pole over misty ridges and one dark tree with a small lamp at its foot.
// follows: Stars brighten in the piece's colours where it sounds: round the disc is the loop and outward the room, or across and up the sky. The drone warms the core or the horizon; high sounds twinkle; the arcs grow longer and shorter with the loop; a hit is one new star or a meteor, a cue a wave of light that runs round; the keys light a few more stars, or the lamp.
float swPx; // one pixel
const float swD = 2.5, swS = 0.45, swC = 0.893; // how far the eye is, and the sine and cosine of how steeply it looks
float swFall(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); } // falls from 1 at b to 0 at a
// Where a place on the picture lies on the disc, at height z over its middle plane.
vec2 swDown(vec2 s, float z) {
  float v = (s.y * (swD - z * swS) - swD * z * swC) / max(swD * swS - s.y * swC, 0.1);
  return vec2(s.x * max(swD + v * swC - z * swS, 0.05) / swD, v);
}
// And back: where a place on the disc is seen.
vec2 swUp(vec2 q, float z) {
  return swD * vec2(q.x, q.y * swS + z * swC) / max(swD + q.y * swC - z * swS, 0.05);
}
// Two places take turns at answering the hits: how much it is the turn of place k, and the number of that turn.
float swTurn(float k, out float n) {
  float t = mod(uTime, 7200.0) / 9.0 + 0.5 * k;
  n = floor(t) * 2.0 + k;
  return swFall(0.29, 0.21, abs(fract(t) - 0.5));
}
// One layer of grains lying at one height; dens says how many of them are there.
vec3 swGrains(vec2 s, float z, mat2 turn, float cell, float seed, float dens, float size, vec3 cool, vec3 warm) {
  vec2 q = turn * swDown(s, z), g = q / cell, id = floor(g), f = g - id;
  vec2 h = hash22(id + seed), h2 = hash22(id + seed + 41.7);
  vec2 d = s - swUp(((id + 0.5 + (h - 0.5) * 0.6) * cell) * turn, z);
  float big = h2.x * h2.x; big *= big * h2.x;
  float own = size * (0.55 + 1.0 * big), sg = max(own, 0.72 * swPx);
  float on = smoothstep(0.0, 0.3, dens * 1.3 - h2.y);
  float edge = smoothstep(0.0, 0.12, 0.5 - max(abs(f.x - 0.5), abs(f.y - 0.5)));
  return mix(warm, cool, smoothstep(0.25, 0.8, h.x)) * exp(-dot(d, d) / (2.0 * sg * sg)) * on * edge * (0.26 + 2.5 * big) * sat(0.25 + 0.85 * own / sg);
}
// The few stars between here and there, fixed to the picture.
vec3 swNear(vec2 p, float cell, float seed, float few) {
  vec2 g = p / cell, id = floor(g);
  vec2 h = hash22(id + seed), h2 = hash22(id + seed + 9.1);
  vec2 d = p - (id + 0.5 + (h - 0.5) * 0.8) * cell;
  float m = step(few, h2.x) * (0.06 + pow(h2.y, 6.0));
  float own = 0.0007 + 0.0013 * m, sg = max(own, 0.7 * swPx), r2 = dot(d, d);
  float win = swFall(0.1, 0.02, length(d) / cell);
  return mix(vec3(1.0, 0.7, 0.45), vec3(0.7, 0.84, 1.0), smoothstep(0.2, 0.7, h.y)) * m * (3.6 * sat(own / sg * 1.2) * exp(-r2 / (2.0 * sg * sg)) + 0.2 * win * exp(-length(d) * 160.0));
}
vec3 swSpiral(vec2 p) {
  float wide = min(uRes.x / uRes.y / 1.78, 1.0);
  vec2 s = rot(0.42) * (p - vec2(0.19 * wide, 0.07)) * (0.95 + 0.1 * uSpace);
  float spin = mod(uTime * 0.011, TAU) + mod(uTravel * 0.006, TAU);
  mat2 turn = rot(spin);
  vec2 lay = swDown(s, 0.0), q = turn * lay;
  float r = length(q) + 0.0001, lr = log(r + 0.03);
  // the disc with its winding taken out: whatever is drawn there comes out as arms and feathers
  vec2 un = rot(-2.7 * lr) * q;
  float n1 = noise(un * 4.0 + 3.0), n2 = noise(un * 11.0 + 9.0), n3 = noise(un * 27.0 + 1.0), n4 = noise(q * 42.0), n5 = noise(un * 66.0 + 7.0);
  vec2 w = rot((n1 - 0.5) * 1.0 + (n2 - 0.5) * 0.5) * (un / r);
  float c2 = w.x * w.x - w.y * w.y, s2 = 2.0 * w.x * w.y;
  float lop = 0.85 + 0.15 * w.x;
  float cloud = smoothstep(0.2, 0.8, n2 * 0.4 + n3 * 0.36 + n5 * 0.12 + n4 * 0.12);
  float arm = exp(-(1.0 - c2) * 1.7) * lop;
  float lit = exp(-(1.0 - (c2 * 0.96 + s2 * 0.28)) * 4.0) * lop;
  float lane = exp(-(1.0 - (c2 * 0.64 - s2 * 0.77)) * 3.6);
  float rim = swFall(1.35, 0.5, r), hole = smoothstep(0.06, 0.24, r);
  // where the piece sounds: round the disc is the loop, outward is the room from front to back
  float ang = fract(atan(q.y, q.x + 0.00001) / TAU + 0.5);
  vec4 pc = piece(vec2(ang, 1.0 - sat((r - 0.1) / 0.95))) * smoothstep(0.0, 0.04, ang) * swFall(1.0, 0.96, ang) * smoothstep(0.06, 0.16, r);
  vec3 hue = pc.rgb / max(pc.a, 0.03);
  float loud = pc.a * (0.4 + 1.1 * uEnergy), bnd = band(sat(r * 0.85));
  // the cue: a swelling of the arms that runs round the disc
  float wa = spin + 2.2 + 4.2 * (1.0 - uCue);
  float wave = exp(-(1.0 - dot(q / r, vec2(cos(wa), sin(wa)))) * 5.0) * uCue * smoothstep(0.08, 0.3, r);
  // dust: along the inner edge of each arm, and in feathers across
  float fil = smoothstep(0.35, 0.72, n2 * 0.4 + n3 * 0.35 + n5 * 0.25 + 0.06 * lane);
  float dust = (lane * (0.5 + 2.4 * fil) * (0.4 + n1) + 0.6 * fil * fil) * smoothstep(0.03, 0.14, r) * swFall(1.25, 0.25, r) * 2.3;
  vec3 seen = exp(-vec3(0.6, 0.95, 1.4) * dust);
  vec3 warm = mix(vec3(1.0, 0.64, 0.33), uKind[0], 0.2), cool = mix(vec3(0.36, 0.6, 1.0), uKind[1], 0.22);
  float bright = 0.75 + 0.45 * uLevel;
  // the old core, a round swelling of light through which the disc passes
  float rb = length(s * vec2(1.0, 1.5));
  float bulge = 0.8 / (1.0 + rb * rb * 420.0) + 0.42 * exp(-rb * 7.5) + 2.0 * exp(-rb * 60.0);
  bulge *= 0.75 + 0.5 * uDrone + 0.2 * uMic;
  vec3 col = warm * mix(vec3(1.0, 0.85, 0.72), vec3(1.0, 1.0, 1.0), exp(-rb * 14.0)) * bulge * mix(seen, vec3(1.0), smoothstep(-0.12, 0.18, lay.y));
  // the unresolved light of the disc and of its arms
  vec3 glow = warm * vec3(0.85, 0.72, 0.68) * exp(-r * 3.6) * rim * 0.34 * (0.7 + 0.4 * uDrone);
  glow += cool * (arm * (0.1 + 1.0 * cloud) + lit * cloud * 1.1) * exp(-r * 1.1) * rim * hole * 0.55 * (1.0 + 0.6 * uPad + 0.7 * bnd);
  glow += hue * hue * loud * (0.04 + (arm + lit) * (0.2 + cloud)) * rim * 0.7 + cool * wave * arm * (0.3 + cloud) * 0.8;
  col += glow * seen * bright;
  // the grains
  vec3 hot = vec3(0.72, 0.86, 1.0), old3 = vec3(1.0, 0.82, 0.6), tint = mix(vec3(1.0), hue * 1.7, sat(pc.a * 1.2));
  float young = sat((arm * 0.8 + lit * 0.6) * (0.25 + 1.0 * cloud) + 0.16 * loud) * exp(-r * 0.5) * rim * hole;
  float old = exp(-r * 2.4) * rim;
  vec3 half2 = mix(vec3(1.0), seen, 0.5);
  float sz = mix(1.2, 0.85, uTone);
  vec3 gr = swGrains(s, 0.0, turn, 0.0085, 3.0, young * 1.1 + 0.5 * old + 0.03 * rim, 0.0006 * sz, hot, old3) * 0.7 * seen * (0.8 + 0.6 * uTexture);
  gr += swGrains(s, -0.01, turn, 0.012, 17.0, young * 1.1 + 0.2 * old, 0.0008 * sz, hot, old3) * 0.9 * seen;
  gr += swGrains(s, 0.01, turn, 0.021, 29.0, young * 0.9, 0.0010 * sz, hot, cool) * 1.1 * half2;
  gr += swGrains(s, 0.005, turn, 0.043, 37.0, sat(lit * (0.4 + cloud) + loud * 0.12) * rim * 0.8, 0.0014 * sz, hot, vec3(1.0)) * (2.0 + 1.5 * uKeys) * half2;
  gr *= tint * (0.95 + 0.4 * uLevel + 0.8 * bnd + 1.5 * loud + 3.0 * wave);
  gr += swGrains(s, 0.03, turn, 0.016, 53.0, old * 0.9, 0.0007 * sz, old3, warm) * 0.36;
  gr += swGrains(s, -0.035, turn, 0.019, 61.0, old * 0.9, 0.0008 * sz, old3, warm) * 0.4 * seen;
  col += gr * swFall(1.4, 0.8, lay.y);
  // knots where new stars light the gas
  for (int k = 0; k < 2; k++) {
    float cell = k == 0 ? 0.07 : 0.037;
    vec2 g = q / cell + float(k) * 5.3, id = floor(g), h = hash22(id + 71.0), h2 = hash22(id + 83.0);
    float dd = length(g - id - 0.5 - (h - 0.5) * 0.4) / (0.07 + 0.11 * h2.x);
    dd = max(dd + (n4 - 0.5) * 1.1 + (n5 - 0.5) * 0.9, 0.0);
    float tw = 1.0 + 1.7 * uHigh * sin(mod(uTime * (0.7 + 0.9 * h2.y), TAU) + h.x * 40.0);
    float kn = exp(-dd * dd * 0.9) * smoothstep(0.0, 0.3, lit * 1.15 - h2.y) * rim * hole * exp(-r * 0.5);
    vec3 pink = mix(vec3(1.0, 0.2, 0.3), uKind[3], 0.25);
    col += (pink * 1.5 + vec3(0.8, 0.6, 0.7) * exp(-dd * dd * 5.0)) * kn * max(tw, 0.1) * (0.5 + 0.6 * uPhrase + 0.9 * loud + wave) * half2;
  }
  // a hit: one new star in an arm, with its halo
  for (int k = 0; k < 2; k++) {
    float n, on = swTurn(float(k), n) * uHits;
    if (on < 0.003) continue;
    float rr = 0.2 + 0.36 * hash11(n + 3.0), aa = TAU * hash11(n + 8.0);
    float l = length(s - swUp(rr * vec2(cos(aa), sin(aa)), 0.02));
    vec3 hc = mix(vec3(1.0, 0.95, 0.9), uKind[4], 0.4);
    col += on * (vec3(9.0) * exp(-l * l / (2.0 * max(0.00002, swPx * swPx * 1.4))) + hc * (1.1 * exp(-l * 42.0) + 0.3 * exp(-l * 11.0)));
  }
  // the sky, not quite black, and the nearer stars in front of it all
  col += vec3(0.0022, 0.003, 0.0065) * (0.4 + 1.2 * noise(p * 2.3 + 4.0));
  col += swNear(rot(0.3) * p + 0.31, 0.14, 5.0, 0.2) + swNear(rot(1.1) * p - 0.17, 0.045, 11.0, 0.55) * 0.6;
  return col;
}
// The arcs the stars draw round the pole; len is how long.
vec3 swTrails(vec2 p, vec2 pole, float len) {
  vec2 d = p - pole;
  float spin = mod(uTime * 0.005, TAU) + mod(uTravel * 0.004, TAU);
  float r = length(d), ang = atan(d.y, d.x + 0.00001) - spin;
  float ca = spin + ang - 0.9 - 4.4 * (1.0 - uCue);
  float wave = exp(-(1.0 - cos(ca)) * 5.0) * uCue;
  vec3 sum = vec3(0.0);
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float dr = k == 0 ? 0.041 : k == 1 ? 0.019 : k == 2 ? 0.0113 : 0.0078;
    float ring = floor(r / dr);
    float a = mod(ang + hash11(ring + 17.0 * fk + 1.0) * TAU, TAU) / TAU * 3.0, sec = floor(a);
    vec2 h = hash22(vec2(ring * 1.31 + 3.0, sec + 11.0 * fk)), h2 = hash22(vec2(ring * 0.77 + 41.0, sec + 5.0 + 11.0 * fk));
    float rs = (ring + 0.5 + (h.x - 0.5) * 0.36) * dr;
    float own = len * (0.85 + 0.15 * h2.y), head = 0.56 + 0.41 * h.y;
    float x = (a - sec - head + own) / own;                  // 0 at its tail, 1 at its head
    float m = h2.x * h2.x; m = 0.05 + 1.1 * m * m * m;
    float few = smoothstep(0.0, 0.2, rs * 0.75 + 0.3 - fract(h2.x * 7.0 + h2.y));
    float sg = max((0.0006 + 0.0008 * m) * mix(1.25, 0.8, uTone), 0.55 * swPx), past = max((x - 1.0) * own * 2.094 * r, 0.0);
    float body = exp(-((r - rs) * (r - rs) + past * past) / (2.0 * sg * sg)) * smoothstep(0.0, 0.45, x) * few;
    body *= swFall(0.5, 0.4, abs(r / dr - ring - 0.5)) * swFall(1.0, 0.985, a - sec);
    // the sound at the place where this star stands
    float sa = ang - (a - sec - head + own * 0.5) * TAU / 3.0 + spin;
    vec2 sp = pole + rs * vec2(cos(sa), sin(sa));
    vec4 pc = piece(vec2(sp.x / 1.7 + 0.5, 0.95 - (sp.y + 0.25) / 0.8));
    vec3 hue = pc.rgb / max(pc.a, 0.03);
    vec3 tone = mix(vec3(1.0, 0.5, 0.2), vec3(1.0, 0.9, 0.75), smoothstep(0.0, 0.3, h2.y));
    tone = mix(tone, vec3(0.4, 0.65, 1.0), smoothstep(0.3, 0.6, h2.y));
    tone = mix(tone, hue * 1.4, sat(pc.a * 1.1) * 0.8);
    float loud = pc.a * (0.4 + 1.2 * uEnergy);
    float kind = k == 0 ? 2.0 + uPhrase : k == 1 ? 1.2 : k == 2 ? 0.9 : 0.6 + 0.5 * uTexture;
    float tip = exp(-(1.0 - x) * (1.0 - x) * own * own * r * r * 12000.0) * (0.5 + uHigh * (0.8 + 0.7 * sin(mod(uTime * (1.0 + h.x), TAU) + h.y * 30.0)));
    sum += tone * body * (m * (0.8 + 0.35 * uLevel) + loud * (0.16 + 1.5 * m) + wave * (0.2 + 2.0 * m)) * kind * (0.6 + 0.4 * sat(x) + tip) * mix(0.85, 1.15, uTone);
  }
  return sum;
}
float swSeg(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 d = b - a; float t = sat(dot(p - a, d) / dot(d, d));
  return length(p - a - d * t) - mix(ra, rb, t);
}
float swClump(float c, vec2 q, float x, float y, float a, float b) { vec2 d = (q - vec2(x, y)) / vec2(a, b); return max(c, 1.1 - dot(d, d)); }
float swLine(float x) { x += 0.36; return -0.3 - 0.11 * x * x / (0.25 + abs(x)) + 0.012 * sin(x * 5.3 + 1.0); }
// The tree: how far inside it a place is, in x; in y the same of its leaves alone.
vec2 swTree(vec2 q) {
  if (q.x < -0.28 || q.x > 0.3 || q.y > 0.5 || q.y < -0.06) return vec2(-0.1);
  vec2 b = q + vec2(0.012 * sin(q.y * 21.0), 0.006 * sin(q.x * 37.0));
  float t = swSeg(b, vec2(0.0, -0.06), vec2(0.006, 0.1), 0.017, 0.010);
  t = min(t, swSeg(b, vec2(0.0, -0.05), vec2(0.0, 0.0), 0.028, 0.010));
  t = min(t, swSeg(b, vec2(0.004, 0.09), vec2(-0.075, 0.21), 0.009, 0.004));
  t = min(t, swSeg(b, vec2(0.004, 0.08), vec2(0.07, 0.19), 0.008, 0.004));
  t = min(t, swSeg(b, vec2(0.07, 0.19), vec2(0.17, 0.25), 0.004, 0.001));
  t = min(t, swSeg(b, vec2(0.05, 0.16), vec2(0.16, 0.18), 0.003, 0.001));
  t = min(t, swSeg(b, vec2(0.006, 0.1), vec2(0.015, 0.34), 0.008, 0.001));
  t = min(t, swSeg(b, vec2(0.01, 0.22), vec2(0.08, 0.31), 0.004, 0.001));
  t = min(t, swSeg(b, vec2(-0.05, 0.17), vec2(-0.15, 0.2), 0.003, 0.001));
  t = min(t, swSeg(b, vec2(-0.075, 0.21), vec2(-0.12, 0.29), 0.004, 0.001));
  vec2 e = q; q += 0.034 * (vec2(noise(q * 19.0), noise(q * 23.0 + 9.0)) - 0.5);
  float c = swClump(-1.0, q, 0.01, 0.36, 0.075, 0.06);
  c = swClump(c, q, -0.075, 0.325, 0.075, 0.05);
  c = swClump(c, q, 0.09, 0.33, 0.07, 0.05);
  c = swClump(c, q, -0.14, 0.265, 0.07, 0.045);
  c = swClump(c, q, 0.165, 0.27, 0.075, 0.042);
  c = swClump(c, q, -0.05, 0.255, 0.065, 0.04);
  c = swClump(c, q, 0.06, 0.25, 0.07, 0.04);
  c = swClump(c, q, -0.175, 0.205, 0.06, 0.03);
  c = swClump(c, q, 0.19, 0.2, 0.055, 0.026);
  c = swClump(c, q, 0.02, 0.2, 0.04, 0.022);
  c = swClump(c, q, 0.115, 0.215, 0.03, 0.016);
  c = swClump(c, q, -0.1, 0.18, 0.03, 0.015);
  q = e;
  mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
  float leaf = noise(m * q * 58.0) * 0.45 + noise(m * m * q * 150.0 + 3.0) * 0.35 + noise(q * m * 340.0) * 0.3;
  float l = (c - 0.25 + (leaf - 0.55) * 2.6) * 0.016;
  return vec2(max(-t, l), l);
}
vec3 swPole(vec2 p) {
  float wide = min(uRes.x / uRes.y / 1.78, 1.0);
  vec2 pole = vec2(0.2 * wide, 0.045 + 0.2 * (1.0 - wide)), base = vec2(-0.36 * wide, 0.0);
  vec2 gp = vec2(p.x - base.x - 0.36, p.y);
  base.y = swLine(-0.36) - 0.006;
  float len = 0.5 * mix(0.36, 1.0, 0.5 - 0.5 * cos(TAU * uLoop));
  float up = p.y + 0.3, side = p.x + 0.45;
  vec3 col = mix(vec3(0.022, 0.05, 0.1), vec3(0.0025, 0.006, 0.022), smoothstep(0.0, 0.7, up));
  col += mix(vec3(0.75, 0.26, 0.07), uKind[0], 0.2) * exp(-max(up, 0.0) * 8.5 - side * side * 1.6) * (0.28 + 0.45 * uDrone + 0.2 * uMic);
  float veil = noise(p * vec2(2.2, 4.5) + vec2(mod(uTime * 0.006, 256.0), 0.0)) * 0.6 + noise(p * vec2(5.0, 10.0) + vec2(3.0, -2.0)) * 0.4;
  float ar = (up - 0.2 - 0.05 * p.x) * 6.0, air = exp(-ar * ar) * veil;
  col += mix(vec3(0.05, 0.2, 0.12), uKind[1], 0.3) * air * (0.04 + 0.22 * uPad);
  col *= 0.75 + 0.5 * veil;
  col += swTrails(p * (1.04 - 0.08 * uSpace), pole, len) * (0.45 + 0.8 * (1.0 - veil)) * smoothstep(-0.02, 0.3, up);
  // a hit: one meteor, falling away from the pole
  for (int k = 0; k < 2; k++) {
    float n, on = swTurn(float(k), n) * uHits;
    if (on < 0.003) continue;
    float aa = mix(0.5, 2.7, hash11(n + 2.0));
    vec2 dir = normalize(vec2(cos(aa) * 1.2, -0.45 - 0.4 * hash11(n + 5.0)));
    vec2 from = pole * 0.5 + vec2(cos(aa) * 0.3 * wide, 0.12 + 0.2 * sin(aa)), dm = p - from;
    float x = dot(dm, dir), y = dot(dm, vec2(-dir.y, dir.x)), go = 0.1 + 0.24 * (1.0 - uHits), back = go - x;
    float wd = max(0.0017 * swFall(0.3, 0.0, back) * (0.35 + 0.65 * smoothstep(-0.003, 0.012, back)), 0.8 * swPx);
    float tail = smoothstep(-0.003, 0.006, back) * exp(-max(back, 0.0) * 9.0) * smoothstep(0.0, 0.06, x);
    vec3 hc = mix(vec3(1.0), uKind[4], 0.3);
    col += on * hc * (tail * 8.0 * exp(-y * y / (2.0 * wd * wd)) + 0.4 * tail * exp(-abs(y) * 80.0) + 0.8 * exp(-length(vec2(back, y)) * 32.0) + 0.1 * exp(-length(vec2(back, y)) * 7.0));
  }
  // two far ridges with mist lying between, then the rise the tree stands on
  float mist = noise(vec2(p.x * 2.5 + mod(uTime * 0.012, 256.0), p.y * 14.0)) * 0.6 + noise(vec2(p.x * 6.0 - mod(uTime * 0.018, 256.0), p.y * 30.0)) * 0.4;
  float f1 = -0.245 + 0.06 * noise(vec2(p.x * 2.4 + 3.0, 1.0)) + 0.02 * noise(vec2(p.x * 7.0, 4.0)) + 0.006 * noise(vec2(p.x * 33.0, 4.0));
  float f2 = -0.335 + 0.09 * noise(vec2(p.x * 1.7 + 9.0, 6.0)) + 0.016 * noise(vec2(p.x * 9.0, 8.0));
  float f3 = f2 + 0.026 * noise(vec2(p.x * 150.0, 2.0)) * noise(vec2(p.x * 62.0, 8.0)) * smoothstep(0.3, 0.8, noise(vec2(p.x * 11.0, 7.0)));
  vec3 haze = (vec3(0.03, 0.045, 0.075) + mix(vec3(0.5, 0.2, 0.07), uKind[0], 0.2) * exp(-side * side * 2.5) * (0.06 + 0.15 * uDrone)) * (0.5 + 0.6 * mist) * (0.8 + 0.7 * uLow);
  col = mix(col, vec3(0.009, 0.015, 0.03) + haze * smoothstep(0.0, 0.12, f1 - p.y), smoothstep(-swPx, swPx, f1 - p.y));
  col = mix(col, vec3(0.0045, 0.007, 0.013) + haze * 0.8 * smoothstep(0.0, 0.16, f2 - p.y), smoothstep(-swPx, swPx, f3 - p.y));
  float blade = noise(vec2(gp.x * 260.0 + p.y * 60.0, 7.0)) * noise(vec2(gp.x * 41.0, 3.0));
  float line = swLine(gp.x) + 0.004 * noise(vec2(gp.x * 30.0, 2.0)) + 0.016 * blade;
  vec2 lamp = base + vec2(0.05, 0.012);
  float dl = length((p - lamp) * vec2(1.0, 1.4)), fire = 0.16 + 0.8 * uKeys;
  vec3 lampC = vec3(1.0, 0.5, 0.16);
  vec3 ink = vec3(0.0022, 0.003, 0.005);
  vec3 land = ink + lampC * fire * exp(-dl * 17.0) * 0.16 * (0.3 + noise(vec2(gp.x * 120.0, p.y * 60.0 - gp.x * 10.0)));
  col = mix(col, land, smoothstep(-swPx, swPx, line - p.y));
  vec2 tree = swTree(p - base);
  float under = exp(-dl * 8.0);
  vec3 wood = ink + lampC * fire * under * 0.14 * (0.4 + smoothstep(0.0, 0.012, tree.y));
  col = mix(col, wood, smoothstep(-swPx, swPx, tree.x));
  col += lampC * fire * (2.0 * exp(-dl * dl * 60000.0) + 0.35 * exp(-dl * 60.0) + 0.05 * exp(-dl * 14.0));
  return col;
}
vec3 render(vec2 p) {
  swPx = 1.0 / uRes.y;
  return screenOf(uVar < 0.5 ? swSpiral(p) : swPole(p));
}
