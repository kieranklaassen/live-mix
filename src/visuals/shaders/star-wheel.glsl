// name: Star wheel
// a: Spiral
// b: Pole trails
// what: A galaxy seen at a slant, its disc cut by the frame: two arms of countless small stars with pink knots and brown dust round a warm old core, and a few nearer stars in front; or a long exposure of the night sky, the stars drawn out into arcs round the pole over misty ridges and one dark tree with a small lamp at its foot.
// follows: Stars brighten in the piece's colours where it sounds: round the disc is the loop and outward the room, or across and up the sky. The drone warms the core or the horizon; high sounds twinkle; the arcs grow longer and shorter with the loop; a hit is one new star or a meteor, a cue a wave of light that runs round; the keys light a few more stars, or the lamp.
// own: 0 1 seen straight from above (b: the pole high over the picture), -1 almost from its edge (b: the pole on the horizon); 1 1 many open arms (b: near whole circles), -1 wound up into rings (b: single points); 2 1 fine dust, -1 a few great stars; 3 1 drawn in ink on pale paper, -1 a lit ground in the colours of drone and pad; 4 1 a swollen core (b: a lake in front), -1 hollow in the middle (b: high snow peaks); 5 1 thick dark dust (b: a wood of firs), -1 one lone arm (b: the tree bare, then gone); 6 1 stirred by eddies, -1 broad hard dabs (b: brush strokes); 7 1 nothing but grains (b: a river of stars across), -1 nothing but cloud (b: a sea of cloud over the land)
float swPx; // one pixel
const float swD = 2.5;
float swS, swC; // how far the eye is, and the sine and cosine of how steeply it looks
float swMany;       // how many times as large the grains' cells are
float swHard;       // how far grains are hard dabs
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
  if (swMany != 1.0) { cell *= swMany; size *= swMany > 1.0 ? swMany * swMany : sqrt(swMany); }
  cell *= 1.0 + 0.9 * swHard;
  vec2 q = turn * swDown(s, z), g = q / cell, id = floor(g), f = g - id;
  vec2 h = hash22(id + seed), h2 = hash22(id + seed + 41.7);
  vec2 d = s - swUp(((id + 0.5 + (h - 0.5) * 0.6) * cell) * turn, z);
  float big = h2.x * h2.x; big *= big * h2.x;
  float own = size * (0.55 + 1.0 * big), sg = max(own, 0.72 * swPx);
  float on = smoothstep(0.0, 0.3, dens * 1.3 - h2.y);
  float edge = smoothstep(0.0, 0.12, 0.5 - max(abs(f.x - 0.5), abs(f.y - 0.5)));
  if (swMany > 1.0) sg = min(sg, 0.075 * cell);
  float body = exp(-dot(d, d) / (2.0 * sg * sg));
  if (swHard > 0.0) { // a stroke of a brush, along the way it goes round
    vec2 c = (id + 0.5 + (h - 0.5) * 0.6) * cell;
    vec2 t = swUp((c + 0.01 * vec2(-c.y, c.x) / (length(c) + 0.01)) * turn, z) - swUp(c * turn, z);
    t /= length(t) + 1e-6;
    float al = abs(dot(d, t)) / (0.36 * cell), ac = abs(dot(d, vec2(-t.y, t.x))) / (0.15 * cell);
    body = mix(body, (1.0 - smoothstep(0.75, 1.0, ac + 0.35 * al * al)) * (1.0 - smoothstep(0.85, 1.0, al)) * (0.5 + 0.7 * h2.x) / (0.4 + 2.5 * big) * (0.75 + 0.25 * cos(ac * 9.0 + h.y * 6.0)), swHard);
  }
  return mix(warm, cool, smoothstep(0.25, 0.8, h.x)) * body * on * edge * (0.26 + 2.5 * big) * sat(0.25 + 0.85 * own / sg);
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
// Light c as ink on paper; k is how strong.
vec3 swInk(vec3 c, float k) {
  float m = max(c.r, max(c.g, c.b));
  vec3 hue = c / max(m, 0.0001);
  m = 1.0 - exp(-m * k);
  return vec3(2.1, 1.98, 1.75) * exp(-m * (2.6 - 1.75 * hue * hue));
}
vec2 swEddy(vec2 q, float f) {
  float a = noise(q * f + 5.0), t = mod(uTime * 0.02, 512.0);
  return vec2(noise(q * f + vec2(0.0, 0.35) + t) - noise(q * f - vec2(0.0, 0.35) + t), noise(q * f - vec2(0.35, 0.0) + t) - noise(q * f + vec2(0.35, 0.0) + t)) * (0.6 + a);
}
vec3 swSpiral(vec2 p) {
  float flat1 = max(uOwn[0], 0.0), thin = max(-uOwn[0], 0.0), open = max(uOwn[1], 0.0), rings = max(-uOwn[1], 0.0), hollow = max(-uOwn[4], 0.0);
  float tip = mix(mix(0.45, 0.985, flat1), 0.11, thin);
  if (uOwn[0] != 0.0) { swS = tip; swC = sqrt(1.0 - tip * tip); }
  float haze = 1.0 - max(uOwn[7], 0.0), grain = 1.0 - max(-uOwn[7], 0.0);
  float wide = min(uRes.x / uRes.y / 1.78, 1.0);
  vec2 s = rot(0.42) * (p - vec2(0.19 * wide, 0.07) * (1.0 - flat1)) * (0.95 + 0.1 * uSpace);
  if (uOwn[0] != 0.0) s *= 1.0 + 0.55 * flat1 + 0.25 * thin;
  float spin = mod(uTime * 0.011, TAU) + mod(uTravel * 0.006, TAU);
  mat2 turn = rot(spin);
  vec2 lay = swDown(s, 0.0), q = turn * lay;
  if (uOwn[6] > 0.0) { q += uOwn[6] * 0.3 * swEddy(q, 4.2) * smoothstep(0.02, 0.3, length(q)); q += uOwn[6] * 0.09 * swEddy(q, 11.0); }
  float r = length(q) + 0.0001, lr = log(r + 0.03);
  // the disc with its winding taken out: whatever is drawn there comes out as arms and feathers
  vec2 un = rot(-(2.7 - 1.1 * open + 5.0 * rings) * lr) * q;
  float n1 = noise(un * 4.0 + 3.0), n2 = noise(un * 11.0 + 9.0), n3 = noise(un * 27.0 + 1.0), n4 = noise(q * 42.0), n5 = noise(un * 66.0 + 7.0);
  vec2 w = rot((n1 - 0.5) * 1.0 + (n2 - 0.5) * 0.5) * (un / r);
  float c2 = w.x * w.x - w.y * w.y, s2 = 2.0 * w.x * w.y;
  if (open > 0.0) { float c4 = c2 * c2 - s2 * s2, s4 = 2.0 * c2 * s2; c2 = mix(c2, c4, open); s2 = mix(s2, s4, open); }
  if (rings > 0.0) { float ra = lr * 8.5 + 1.2 + (n1 - 0.5) * 0.5; c2 = mix(c2, cos(ra), rings); s2 = mix(s2, sin(ra), rings); }
  float lop = 0.85 + 0.15 * w.x;
  if (uOwn[5] < 0.0) lop = mix(lop, 1.15 * smoothstep(-0.35, 0.7, w.x), -uOwn[5]);
  float cloud = smoothstep(0.2, 0.8, n2 * 0.4 + n3 * 0.36 + n5 * 0.12 + n4 * 0.12);
  float arm = exp(-(1.0 - c2) * 1.7) * lop;
  float lit = exp(-(1.0 - (c2 * 0.96 + s2 * 0.28)) * 4.0) * lop;
  float lane = exp(-(1.0 - (c2 * 0.64 - s2 * 0.77)) * 3.6);
  float rim = swFall(1.35, 0.5, r), hole = smoothstep(0.06, 0.24, r);
  float eye = 1.0;
  if (hollow > 0.0) { eye = mix(1.0, smoothstep(0.2, 0.34, r), hollow); }
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
  if (uOwn[5] > 0.0) dust += uOwn[5] * 5.0 * smoothstep(0.42, 0.75, n1 * 0.35 + n2 * 0.4 + n3 * 0.25 + 0.16 * lane) * smoothstep(0.02, 0.12, r) * rim;
  if (uOwn[5] < 0.0) dust *= 1.0 + 0.7 * uOwn[5];
  vec3 seen = exp(-vec3(0.6, 0.95, 1.4) * dust);
  vec3 warm = mix(vec3(1.0, 0.64, 0.33), uKind[0], 0.2), cool = mix(vec3(0.36, 0.6, 1.0), uKind[1], 0.22);
  float bright = 0.75 + 0.45 * uLevel;
  // the old core, a round swelling of light through which the disc passes
  float rb = length(s * vec2(1.0, 1.5 - 0.5 * flat1 + 0.2 * thin));
  if (uOwn[4] > 0.0) rb *= 1.0 - 0.58 * uOwn[4];
  float bulge = 0.8 / (1.0 + rb * rb * 420.0) + 0.42 * exp(-rb * 7.5) + 2.0 * exp(-rb * 60.0);
  bulge *= 0.75 + 0.5 * uDrone + 0.2 * uMic;
  if (hollow > 0.0) bulge *= 1.0 - hollow;
  bulge *= mix(0.25, 1.0, haze);
  vec3 col = warm * mix(vec3(1.0, 0.85, 0.72), vec3(1.0, 1.0, 1.0), exp(-rb * 14.0)) * bulge * mix(seen, vec3(1.0), smoothstep(-0.12, 0.18, lay.y));
  // the unresolved light of the disc and of its arms
  vec3 glow = warm * vec3(0.85, 0.72, 0.68) * exp(-r * 3.6) * rim * 0.34 * (0.7 + 0.4 * uDrone);
  glow += cool * (arm * (0.1 + 1.0 * cloud) + lit * cloud * 1.1) * exp(-r * 1.1) * rim * hole * 0.55 * (1.0 + 0.6 * uPad + 0.7 * bnd);
  glow += hue * hue * loud * (0.04 + (arm + lit) * (0.2 + cloud)) * rim * 0.7 + cool * wave * arm * (0.3 + cloud) * 0.8;
  if (uOwn[7] < 0.0) glow *= 1.0 - uOwn[7] * (0.5 + 2.6 * fil * fil);
  if (hollow > 0.0) { float e = (r - 0.3) / 0.07; glow += hollow * warm * exp(-e * e) * (0.25 + 0.6 * cloud) * (0.5 + 0.8 * uDrone); }
  glow *= haze * eye;
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
  if (uOwn[7] != 0.0 || hollow > 0.0) gr *= grain * (1.0 + 0.7 * max(uOwn[7], 0.0)) * eye;
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
    col += (pink * 1.5 + vec3(0.8, 0.6, 0.7) * exp(-dd * dd * 5.0)) * kn * max(tw, 0.1) * (0.5 + 0.6 * uPhrase + 0.9 * loud + wave) * half2 * (haze * eye);
  }
  // a hit: one new star in an arm, with its halo
  for (int k = 0; k < 2; k++) {
    float n, on = swTurn(float(k), n) * uHits;
    if (on < 0.003) continue;
    float rr = 0.2 + 0.36 * hash11(n + 3.0), aa = TAU * hash11(n + 8.0);
    float l = length(s - swUp(rr * vec2(cos(aa), sin(aa)), 0.02));
    vec3 hc = mix(vec3(1.0, 0.95, 0.9), uKind[4], 0.4);
    col += on * (1.0 + 2.5 * max(uOwn[3], 0.0)) * (vec3(9.0) * exp(-l * l / (2.0 * max(0.00002, swPx * swPx * 1.4))) + hc * (1.1 * exp(-l * 42.0) + 0.3 * exp(-l * 11.0)));
  }
  // the sky, not quite black, and the nearer stars in front of it all
  if (uOwn[3] < 0.0) {
    float f = fbm(p * 2.1 + 7.0), far = sat(1.0 - 0.8 * length(p - 0.1));
    col *= 0.75 + 0.25 * grain;
    col += -uOwn[3] * mix(uKind[0] * uKind[0], uKind[1] * uKind[1], smoothstep(0.3, 0.65, f)) * (0.16 + 0.34 * f) * (0.5 + 0.6 * far) * (0.9 + 0.3 * uLevel);
  }
  col += vec3(0.0022, 0.003, 0.0065) * (0.4 + 1.2 * noise(p * 2.3 + 4.0));
  if (uOwn[2] < 0.0) p *= 1.0 + 0.35 * uOwn[2];
  if (uOwn[7] >= 0.0) col += swNear(rot(0.3) * p + 0.31, 0.14, 5.0, 0.2) + swNear(rot(1.1) * p - 0.17, 0.045, 11.0, 0.55) * 0.6;
  else col += grain * (swNear(rot(0.3) * p + 0.31, 0.14, 5.0, 0.2) + swNear(rot(1.1) * p - 0.17, 0.045, 11.0, 0.55) * 0.6);
  if (uOwn[3] > 0.0) col = mix(col, swInk(col * (0.85 + 0.3 * n3), 3.4), uOwn[3]);
  return col;
}
// The arcs the stars draw round the pole; len is how long.
vec3 swTrails(vec2 p, vec2 pole, float len) {
  vec2 d = p - pole;
  if (uOwn[6] > 0.0) { d += uOwn[6] * 0.2 * swEddy(p, 3.1) * smoothstep(0.02, 0.25, length(d)); d += uOwn[6] * 0.05 * swEddy(p + 9.0, 8.0); }
  float stroke = max(-uOwn[6], 0.0), points = max(-uOwn[1], 0.0);
  float spin = mod(uTime * 0.005, TAU) + mod(uTravel * 0.004, TAU);
  float r = length(d), ang = atan(d.y, d.x + 0.00001) - spin;
  float ca = spin + ang - 0.9 - 4.4 * (1.0 - uCue);
  float wave = exp(-(1.0 - cos(ca)) * 5.0) * uCue;
  vec3 sum = vec3(0.0);
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float dr = k == 0 ? 0.041 : k == 1 ? 0.019 : k == 2 ? 0.0113 : 0.0078;
    if (swMany != 1.0) dr *= swMany;
    if (stroke > 0.0) dr *= 1.0 + 0.9 * stroke;
    float ring = floor(r / dr);
    float a = mod(ang + hash11(ring + 17.0 * fk + 1.0) * TAU, TAU) / TAU * 3.0, sec = floor(a);
    vec2 h = hash22(vec2(ring * 1.31 + 3.0, sec + 11.0 * fk)), h2 = hash22(vec2(ring * 0.77 + 41.0, sec + 5.0 + 11.0 * fk));
    float rs = (ring + 0.5 + (h.x - 0.5) * 0.36) * dr;
    float own = len * (0.85 + 0.15 * h2.y), head = 0.56 + 0.41 * h.y;
    if (uOwn[1] > 0.0) { head = mix(head, 0.975 - 0.05 * h.y, uOwn[1]); own = mix(own, head, uOwn[1]); }
    if (points > 0.0) own = mix(own, 0.0025, 1.0 - (1.0 - points) * (1.0 - points) * (1.0 - points));
    float x = (a - sec - head + own) / own;                  // 0 at its tail, 1 at its head
    float m = h2.x * h2.x; m = 0.05 + 1.1 * m * m * m;
    float few = smoothstep(0.0, 0.2, rs * 0.75 + 0.3 - fract(h2.x * 7.0 + h2.y));
    float sg = max((0.0006 + 0.0008 * m) * mix(1.25, 0.8, uTone), 0.55 * swPx);
    if (swMany != 1.0) sg = max(sg * (swMany > 1.0 ? swMany * swMany : swMany), 0.55 * swPx);
    if (stroke > 0.0) sg *= 1.0 + stroke * (3.4 + 2.0 * h2.y) * min(dr / 0.02, 1.2);
    if (points > 0.0) sg *= 1.0 + 0.7 * points;
    float past = max((x - 1.0) * own * 2.094 * r, 0.0);
    float body = exp(-((r - rs) * (r - rs) + past * past) / (2.0 * sg * sg)) * smoothstep(0.0, 0.45, x) * few;
    if (stroke > 0.0) {
      float across = (r - rs) / sg, bristle = noise(vec2(across * 5.0 + ring * 7.0, ang * 14.0 * (0.4 + r) + ring)) * 0.6 + noise(vec2(across * 13.0 + ring * 3.0, ang * 40.0 * (0.3 + r))) * 0.4;
      float lick = (1.0 - smoothstep(1.0, 1.35, abs(across) + 0.6 * (bristle - 0.5))) * (1.0 - smoothstep(0.97, 1.0, x + 0.05 * bristle)) * smoothstep(0.0, 0.35, x - 0.3 * bristle) * few;
      body = mix(body, lick * (0.25 + 0.75 * bristle) * 0.8, stroke);
    }
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
float swWood;
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
  swWood = -t;
  return vec2(max(-t, l), l);
}
// The same tree without its leaves, and at last without itself.
vec2 swBare(vec2 q, vec2 t, float k) {
  float l = t.y - 0.14 * k, w = swWood - 0.1 * max(k * 2.0 - 1.0, 0.0);
  return t.x <= -0.1 ? t : vec2(max(w, l), l);
}
// Firs along a line at height base: how far inside one a place is.
float swFirs(vec2 p, float n, float tall, float seed) {
  float c = -1.0;
  for (int i = -1; i <= 1; i++) {
    float id = floor(p.x * n) + float(i);
    vec2 h = hash22(vec2(id, seed));
    float x = p.x - (id + 0.5 + 0.7 * (h.x - 0.5)) / n, t = tall * (0.45 + 0.55 * h.y), y = p.y / t;
    float st = fract(y * 7.0 + h.x), w = (1.0 - y) * 0.2 * t * (0.75 + 0.5 * (1.0 - st)) * (0.85 + 0.4 * noise(vec2(y * 40.0, x * 60.0 + id)));
    c = max(c, min(min(w - abs(x), p.y + 0.2), (1.0 - y) * t));
    c = max(c, min(0.02 * t * (1.0 - y) - abs(x), t - p.y));
  }
  return c;
}
vec3 swPole(vec2 p) {
  float high = max(uOwn[0], 0.0), low = max(-uOwn[0], 0.0), paper = max(uOwn[3], 0.0), lit = max(-uOwn[3], 0.0), peaks = max(-uOwn[4], 0.0), lake = 0.0;
  if (uOwn[4] > 0.0) {
    float shore = -0.75 + 0.45 * uOwn[4], under = shore - p.y;
    if (under > 0.0) {
      lake = 1.0;
      float deep = 1.0 / (0.05 + under), far = sat(under * 6.0);
      p.y = shore + under * 1.08 + far * 0.012 * (noise(vec2(p.x * 5.0, deep * 7.0 + mod(uTime * 0.35, 1024.0))) - 0.5) * (1.0 + 3.0 * uLow) + 0.005 * far * (noise(vec2(p.x * 24.0, under * 190.0 - mod(uTime * 0.5, 1024.0))) - 0.5);
      p.x += far * 0.008 * (noise(vec2(p.x * 9.0 + 4.0, deep * 11.0 - mod(uTime * 0.3, 1024.0))) - 0.5);
    }
  }
  float wide = min(uRes.x / uRes.y / 1.78, 1.0);
  vec2 pole = vec2(0.2 * wide, 0.045 + 0.2 * (1.0 - wide)), base = vec2(-0.36 * wide, 0.0);
  if (uOwn[0] != 0.0) pole = mix(pole, high > 0.0 ? vec2(-0.1 * wide, 0.62) : vec2(0.16 * wide, -0.23), abs(uOwn[0]));
  vec2 gp = vec2(p.x - base.x - 0.36, p.y);
  base.y = swLine(-0.36) - 0.006;
  float len = 0.5 * mix(0.36, 1.0, 0.5 - 0.5 * cos(TAU * uLoop));
  float up = p.y + 0.3, side = p.x + 0.45;
  vec3 col = mix(vec3(0.022, 0.05, 0.1), vec3(0.0025, 0.006, 0.022), smoothstep(0.0, 0.7, up));
  col += mix(vec3(0.75, 0.26, 0.07), uKind[0], 0.2) * exp(-max(up, 0.0) * 8.5 - side * side * 1.6) * (0.28 + 0.45 * uDrone + 0.2 * uMic);
  float veil = noise(p * vec2(2.2, 4.5) + vec2(mod(uTime * 0.006, 256.0), 0.0)) * 0.6 + noise(p * vec2(5.0, 10.0) + vec2(3.0, -2.0)) * 0.4;
  float ar = (up - 0.2 - 0.05 * p.x) * 6.0, air = exp(-ar * ar) * veil;
  col += mix(vec3(0.05, 0.2, 0.12), uKind[1], 0.3) * air * (0.04 + 0.22 * uPad);
  if (lit > 0.0) {
    vec3 sky = mix(uKind[1] * uKind[1] * 1.15 + uKind[3] * 0.25 * exp(-max(up, 0.0) * 7.0), uKind[0] * uKind[0] * 0.6, smoothstep(-0.02, 0.7, up + 0.06 * (veil - 0.5)));
    col = mix(col, sky * (0.85 + 0.25 * uLevel), lit);
  }
  col *= 0.75 + 0.5 * veil;
  if (uOwn[7] > 0.0) {
    vec2 m = rot(0.75) * (p - vec2(0.1, 0.05));
    float n = fbm(m * 5.0 + 3.0), f = fbm(m * vec2(9.0, 16.0) + 11.0), riv = (m.y + 0.2 * (n - 0.5)) / 0.18;
    riv = exp(-riv * riv);
    col += uOwn[7] * riv * (0.2 + 2.6 * n * n) * (1.0 - smoothstep(0.25, 0.85, f)) * mix(vec3(0.5, 0.58, 0.8), uKind[1], 0.5) * (0.5 + 0.5 * uPad + 0.35 * uLevel);
    vec2 g = m * 190.0, id = floor(g), h = hash22(id + 3.0);
    float gr = length(g - id - 0.2 - 0.6 * h);
    col += uOwn[7] * (1.0 - smoothstep(0.05, 0.22, gr)) * smoothstep(1.02 - 0.5 * riv * n, 1.08 - 0.5 * riv * n, hash21(id + 9.0) + 0.06) * (0.5 + 0.6 * h.x) * smoothstep(0.05, 0.3, up);
  }
  col += swTrails(p * (1.04 - 0.08 * uSpace), pole, len) * (0.45 + 0.8 * (1.0 - veil)) * smoothstep(-0.02, 0.3 - 0.2 * low, up);
  if (uOwn[1] < 0.0) {
    vec2 m = rot(mod(uTime * 0.005, TAU) + mod(uTravel * 0.004, TAU)) * (p - pole) / max(swMany, 1.0);
    col += -uOwn[1] * smoothstep(0.0, 0.25, up) * (swNear(m, 0.06, 5.0, 0.35) + 0.8 * swNear(rot(1.0) * m, 0.023, 11.0, 0.5)) * (0.8 + 0.5 * uTexture);
  }
  if (paper > 0.0) col = mix(col, swInk(col, 2.6), paper);
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
    vec3 mt = on * hc * (tail * 8.0 * exp(-y * y / (2.0 * wd * wd)) + 0.4 * tail * exp(-abs(y) * 80.0) + 0.8 * exp(-length(vec2(back, y)) * 32.0) + 0.1 * exp(-length(vec2(back, y)) * 7.0));
    col = (col + mt * (1.0 - paper)) * exp(-2.0 * paper * mt);
  }
  // two far ridges with mist lying between, then the rise the tree stands on
  float mist = noise(vec2(p.x * 2.5 + mod(uTime * 0.012, 256.0), p.y * 14.0)) * 0.6 + noise(vec2(p.x * 6.0 - mod(uTime * 0.018, 256.0), p.y * 30.0)) * 0.4;
  float f1 = -0.245 + 0.06 * noise(vec2(p.x * 2.4 + 3.0, 1.0)) + 0.02 * noise(vec2(p.x * 7.0, 4.0)) + 0.006 * noise(vec2(p.x * 33.0, 4.0));
  float crag = 0.0;
  if (peaks > 0.0) {
    float px1 = p.x * 1.25 + 0.2, am = 0.5;
    for (int i = 0; i < 5; i++) { crag += am * (1.0 - 2.0 * abs(noise(vec2(px1 + p.y * 0.12 * float(i), 3.0 + float(i) * 7.0)) - 0.5)); px1 *= 2.1; am *= 0.48; }
    f1 += peaks * (1.05 * crag * crag - 0.17) * (0.75 + 0.35 * smoothstep(-0.6, 0.6, p.x));
  }
  float f2 = -0.335 + 0.09 * noise(vec2(p.x * 1.7 + 9.0, 6.0)) + 0.016 * noise(vec2(p.x * 9.0, 8.0));
  float f3 = f2 + 0.026 * noise(vec2(p.x * 150.0, 2.0)) * noise(vec2(p.x * 62.0, 8.0)) * smoothstep(0.3, 0.8, noise(vec2(p.x * 11.0, 7.0)));
  vec3 haze = (vec3(0.03, 0.045, 0.075) + mix(vec3(0.5, 0.2, 0.07), uKind[0], 0.2) * exp(-side * side * 2.5) * (0.06 + 0.15 * uDrone)) * (0.5 + 0.6 * mist) * (0.8 + 0.7 * uLow);
  vec3 near1 = vec3(0.009, 0.015, 0.03), near2 = vec3(0.0045, 0.007, 0.013);
  if (lit > 0.0) { vec3 k = uKind[1] * uKind[1]; haze = mix(haze, k * (0.3 + 0.5 * mist), lit); near1 += lit * k * 0.22; near2 += lit * mix(k, uKind[2] * uKind[2], 0.6) * 0.1; }
  if (paper > 0.0) { near1 = mix(near1, vec3(0.75, 0.76, 0.76), paper); near2 = mix(near2, vec3(0.3, 0.31, 0.32), paper); haze = mix(haze, vec3(1.1, 1.05, 0.92) * (0.6 + 0.6 * mist), paper); }
  if (peaks > 0.0) {
    float dp = f1 - p.y, g = fbm(vec2(p.x * 9.0 + p.y * 5.0, p.y * 7.0 - p.x * 2.0)) - 0.5, slope = noise(vec2(p.x * 7.0 - p.y * 5.0, p.y * 6.0)) * 0.6 + noise(vec2(p.x * 19.0 - p.y * 15.0, p.y * 11.0)) * 0.4;
    float snow = (1.0 - smoothstep(-0.02, 0.3, dp + 0.5 * g)) , face = smoothstep(0.42, 0.6, slope + 0.35 * g);
    vec3 cold = mix(mix(vec3(0.10, 0.14, 0.22), uKind[0] * 0.3, 0.4), mix(vec3(0.5, 0.52, 0.58), uKind[3], 0.3) * (0.7 + 0.6 * uDrone), face);
    cold = mix(cold, mix(vec3(0.8, 0.82, 0.86), vec3(1.8, 1.75, 1.65), face), paper);
    near1 = mix(near1, mix(near1 * 1.6 + 0.02, cold, snow), peaks);
  }
  col = mix(col, near1 + haze * smoothstep(0.0, 0.12 + 0.3 * peaks, f1 - p.y - 0.12 * peaks), smoothstep(-swPx, swPx, f1 - p.y));
  col = mix(col, near2 + haze * 0.8 * smoothstep(0.0, 0.16, f2 - p.y), smoothstep(-swPx, swPx, f3 - p.y));
  float blade = noise(vec2(gp.x * 260.0 + p.y * 60.0, 7.0)) * noise(vec2(gp.x * 41.0, 3.0));
  float line = swLine(gp.x) + 0.004 * noise(vec2(gp.x * 30.0, 2.0)) + 0.016 * blade;
  vec2 lamp = base + vec2(0.05, 0.012);
  float dl = length((p - lamp) * vec2(1.0, 1.4)), fire = 0.16 + 0.8 * uKeys;
  vec3 lampC = vec3(1.0, 0.5, 0.16);
  vec3 ink = vec3(0.0022, 0.003, 0.005);
  if (paper > 0.0) ink = mix(ink, vec3(0.06, 0.062, 0.07), paper);
  if (lit > 0.0) ink += lit * uKind[2] * uKind[2] * 0.035;
  vec3 land = ink + lampC * fire * exp(-dl * 17.0) * 0.16 * (0.3 + noise(vec2(gp.x * 120.0, p.y * 60.0 - gp.x * 10.0)));
  col = mix(col, land, smoothstep(-swPx, swPx, line - p.y));
  float over = 0.0;
  if (uOwn[7] < 0.0) {
    for (int i = 0; i < 3; i++) {
      float fi = float(i), ty = (fi < 0.5 ? -0.14 : fi < 1.5 ? -0.215 : -0.3), dr2 = mod(uTime * (0.006 + 0.006 * fi), 256.0);
      float bump = fbm(vec2(p.x * (2.2 + 1.2 * fi) + dr2, p.y * 5.0 + fi * 7.0)), top = ty + 0.11 * (bump - 0.5) + 0.025 * noise(vec2(p.x * 17.0 + dr2 * 3.0, p.y * 24.0 + fi));
      float in1 = top - p.y;
      vec3 cl = mix(vec3(0.05, 0.065, 0.1), uKind[1] * uKind[1] * 0.45 + 0.02, 0.55) * (1.0 - 0.2 * fi);
      cl = cl * (0.45 + 1.1 * bump) + mix(vec3(0.3), uKind[0], 0.5) * 0.2 * exp(-max(in1, 0.0) * 26.0) * (0.5 + 0.9 * uDrone);
      cl = mix(cl, uKind[1] * uKind[1] * (0.4 + 0.5 * bump) + uKind[3] * 0.25 * exp(-max(in1, 0.0) * 22.0), lit);
      cl = mix(cl, vec3(1.9, 1.82, 1.65) * (0.5 + 0.6 * bump), paper);
      in1 = -uOwn[7] * smoothstep(-0.006, 0.05, in1);
      col = mix(col, cl, in1);
      if (i > 0) over = max(over, in1);
    }
  }
  if (uOwn[5] > 0.0) {
    vec3 wood1 = mix(col, ink, 0.75);
    float fir = swFirs(vec2(p.x + 0.11, p.y - f2 + 0.015), 34.0, 0.13 * uOwn[5], 4.0);
    col = mix(col, mix(mix(wood1, near2 + haze * 0.3, 0.6), ink, 0.2), smoothstep(-swPx, swPx, fir) * step(0.02, uOwn[5]));
    fir = swFirs(vec2(p.x, p.y - swLine(p.x * 0.9 + 0.1) + 0.03), 15.0, 0.36 * uOwn[5] * (0.35 + 0.65 * smoothstep(0.02, 0.5, abs(p.x - 0.16))), 9.0);
    col = mix(col, ink, smoothstep(-swPx, swPx, fir) * step(0.02, uOwn[5]));
  }
  vec2 tree = swTree(p - base);
  if (uOwn[5] < 0.0) { tree = swBare(p - base, tree, -uOwn[5]); }
  if (uOwn[5] > 0.0) tree -= 0.12 * uOwn[5];
  float under = exp(-dl * 8.0);
  vec3 wood = ink + lampC * fire * under * 0.14 * (0.4 + smoothstep(0.0, 0.012, tree.y));
  col = mix(col, wood, smoothstep(-swPx, swPx, tree.x) * (1.0 - over));
  if (lake > 0.5) col = col * mix(vec3(0.62, 0.68, 0.76), vec3(0.9), paper) + vec3(0.002, 0.004, 0.007);
  if (uOwn[5] != 0.0) fire *= 1.0 - 0.8 * abs(uOwn[5]);
  col += lampC * fire * (2.0 * exp(-dl * dl * 60000.0) + 0.35 * exp(-dl * 60.0) + 0.05 * exp(-dl * 14.0));
  return col;
}
vec3 render(vec2 p) {
  swPx = 1.0 / uRes.y;
  swS = 0.45; swC = 0.893;
  swMany = 1.0;
  if (uOwn[2] != 0.0) swMany = exp2(-uOwn[2] * (uOwn[2] > 0.0 ? 1.0 : (uVar < 0.5 ? 1.5 : 1.0)));
  swHard = max(-uOwn[6], 0.0);
  return screenOf(uVar < 0.5 ? swSpiral(p) : swPole(p));
}
