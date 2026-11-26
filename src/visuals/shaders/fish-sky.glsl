// name: Fish's sky
// a: Open water
// b: Under ice
// what: Lying on the bottom of a lake and looking up: the world squeezed into one bright round window, trees, reeds and a wading bird leaning in from its rim, lily pads and weed in the dark green water about it; or the same window frozen over, milky, with white cracks, stacked flat bubbles and one clear round hole.
// follows: Once round the rim is the loop: trees, reeds and bubbles grow and take colour where the piece is loud. Drone swells the water or lights the deep ice, pad the sky, texture brings ripples and silt, a phrase sends birds, tints leaves or cracks, the spectrum shivers the rim or lights the cracks; a hit drops one ring, a cue passes a shadow over, keys rain.
// A soft step from a to b, whichever is the larger.
float fsS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
vec2 fsSun = vec2(-0.3, 0.46);
float fsPx;     // how wide a pixel is on the water, in windows
float fsBlur;   // how soft the world is drawn
// The colours of the sounds, made into those of stained glass.
vec3 fsGlass(vec4 m) { vec3 h = m.rgb / max(m.a, 0.02); return h * h * 1.1 + h * 0.12; }
float fsSeg(vec2 p, vec2 a, vec2 b, float r0, float r1) {
 vec2 d = b - a; float t = sat(dot(p - a, d) / dot(d, d));
 return length(p - a - d * t) - mix(r0, r1, t);
}
float fsInk(float d) { return fsS(fsBlur, -fsBlur, d); }
// The slope of a ring that has run out to R.
vec2 fsRing(vec2 u, vec2 c, float R, float k) {
 vec2 d = u - c; float r = length(d) + 1e-3, x = (r - R) * k;
 return d / r * sin(x * 2.2) * exp(-x * x * 0.45);
}
// How the water tips at a place.
vec2 fsSlope(vec2 u, float t) {
 float big = 0.011 + 0.021 * uDrone, fine = 0.004 + 0.009 * uTexture + 0.003 * uHigh;
 vec2 s = vec2(0.86, 0.5) * cos(dot(u, vec2(3.1, 1.8)) + t * 0.43) * big
    + vec2(-0.42, 0.9) * cos(dot(u, vec2(-2.4, 5.2)) - t * 0.37 + 1.0) * big;
 vec2 w = u + 0.05 * vec2(sin(u.y * 7.0 + t * 0.3), sin(u.x * 6.0 - t * 0.26));
 s += vec2(0.7, -0.7) * cos(dot(w, vec2(13.0, -12.0)) + t * 0.9) * fine;
 s += vec2(0.2, 1.0) * cos(dot(w, vec2(5.0, 23.0)) - t * 1.1 + 2.0) * fine;
 return s;
}
// The sky over the lake: pale, a soft sun behind cloud.
vec3 fsSky(vec2 q, float r) {
 vec2 c = q * (1.0 + 1.3 * r * r) * 1.5;
 vec2 go = vec2(0.016, 0.007) * uTravel + vec2(0.003 * uTime, 0.0);
 float a = fbm(c + go), b = noise(c * 1.1 - go * 0.6 + 8.0);
 float cloud = fsS(0.38, 0.6, a + 0.2 * (b - 0.5));
 float thick = fsS(0.44, 0.72, a + 0.15 * (b - 0.5));
 float sun = exp(-dot(q - fsSun, q - fsSun) * 5.0);
 vec3 sky = mix(vec3(0.2, 0.4, 0.47), vec3(0.5, 0.6, 0.54), fsS(0.1, 1.0, r));
 vec3 white = mix(vec3(0.9, 0.92, 0.86), vec3(0.36, 0.46, 0.5), thick * (1.0 - 0.7 * sun));
 sky = mix(sky, white, cloud * 0.85);
 sky += vec3(1.0, 0.78, 0.44) * sun * (0.45 + 0.5 * uPad);
 return sky * (0.86 + 0.4 * uPad + 0.16 * (uTone - 0.5));
}
// One tree, drawn by folding: how far from its wood, and from the tips where leaves hang.
vec2 fsTree(vec2 x, float H, vec2 h) {
 vec2 q = x / H;
 q.x += (h.x - 0.5) * 0.6 * q.y * q.y + 0.02 * sin(q.y * 9.0 + h.y * 20.0);
 float s = 1.0, d = 9.0;
 mat2 turn = rot(-0.36 - 0.22 * h.y);
 float len = 0.34 + 0.16 * h.x, tip = 9.0;
 for (int i = 0; i < 6; i++) {
  float t = sat(q.y / len);
  d = min(d, (length(vec2(q.x, q.y - t * len)) - 0.026 + 0.007 * t) / s);
  q = 1.36 * turn * vec2(abs(q.x + 0.05 * sin(h.x * 40.0 + float(i) * 2.0)), q.y - len);
  s *= 1.36;
  if (i > 2) tip = min(tip, (length(q - vec2(0.0, 0.1)) - 0.18) / s);
 }
 return vec2(d, tip) * H;
}
// The wading bird: feet at 0, head near 1.
float fsWader(vec2 x) {
 float nod = 0.03 * sin(uTime * 0.31);
 float d = fsSeg(x, vec2(-0.02, 0.0), vec2(-0.03, 0.46), 0.01, 0.012);
 d = min(d, fsSeg(x, vec2(0.08, 0.0), vec2(0.06, 0.22), 0.01, 0.01));
 d = min(d, fsSeg(x, vec2(0.06, 0.22), vec2(0.0, 0.46), 0.01, 0.012));
 d = min(d, fsSeg(x, vec2(-0.26, 0.42), vec2(0.06, 0.56), 0.014, 0.085));
 vec2 n1 = vec2(0.16, 0.68), n2 = vec2(0.09 + nod, 0.84), n3 = vec2(0.17 + nod, 0.97);
 d = min(d, fsSeg(x, vec2(0.08, 0.57), n1, 0.06, 0.03));
 d = min(d, fsSeg(x, n1, n2, 0.03, 0.023));
 d = min(d, fsSeg(x, n2, n3, 0.023, 0.034));
 d = min(d, fsSeg(x, n3, n3 + vec2(0.24, -0.05 - nod), 0.026, 0.002));
 return d;
}
// All that stands round the rim.
vec3 fsBank(vec3 sky, vec2 q, float r, float az, float lit) {
 vec3 col = sky;
 float y = 1.0 - r, turn = fract(0.25 - az / TAU);
 if (y > 0.86) return col;
 vec2 dir = q / max(r, 1e-3);
 // the far wood, its foot in mist
 float clear = fsS(0.03, 0.075, abs(turn - 0.541)), crown = noise(dir * 44.0 + y * 24.0); // the gap where the bird stands
 float far = (0.09 + 0.14 * noise(dir * 3.4 + 4.0) + 0.045 * noise(dir * 15.0) + 0.03 * crown) * (0.4 + 0.6 * clear);
 vec3 wood = mix(vec3(0.008, 0.04, 0.016), vec3(0.04, 0.12, 0.05), crown * crown + 0.5 * lit * crown);
 wood = mix(wood, vec3(0.3, 0.4, 0.28) * (0.45 + 0.7 * lit), fsS(0.15, 0.0, y) * (0.35 + 0.5 * uSpace));
 col = mix(col, wood, fsS(0.008 + fsBlur, -fsBlur, y - far) * 0.97);
 // the trees
 const float N = 14.0;
 float g = turn * N, id0 = floor(g);
 float leafy = noise(q * 46.0) * 0.6 + noise(q * 88.0 + 3.0) * 0.4;
 for (int k = -1; k <= 1; k++) {
  float id = mod(id0 + float(k), N);
  vec2 h = hash22(vec2(id, 3.0));
  float at = id0 + float(k) + 0.25 + h.x * 0.5;
  float uvx = fract(at / N);
  vec4 a = piece(vec2(uvx, 0.18)), b = piece(vec2(uvx, 0.31)), c = piece(vec2(uvx, 0.47));
  float loud = max(a.a, max(b.a, c.a)), kin = mod(id, 3.0); // each takes after one depth
  vec4 m = a * (kin < 0.5 ? 6.0 : 1.0) + b * (kin > 0.5 && kin < 1.5 ? 6.0 : 1.0) + c * (kin > 1.5 ? 6.0 : 1.0);
  float H = (0.17 + 0.2 * h.y * h.y + (0.13 + 0.16 * uEnergy) * loud) * (0.2 + 0.8 * fsS(0.05, 0.14, abs(uvx - 0.541)));
  vec2 x = vec2((at - g) / N * TAU * mix(r, 1.0, 0.4), y - 0.01);
  if (abs(x.x) > H * 1.25 || y > H * 1.9) continue;
  vec2 t = fsTree(x, H, h) + vec2(0.3, 0.8) * max(abs(x.x) - 0.28, 0.0);
  float leaf = fsS(0.012 + fsBlur, -0.012 - fsBlur, t.y + (leafy - 0.6) * 0.16);
  vec3 green = mix(vec3(0.012, 0.045, 0.016), vec3(0.2, 0.25, 0.03), lit * lit * leafy);
  vec3 tint = fsGlass(m) * (0.08 + 0.92 * leafy * leafy) * 1.25;
  col = mix(col, mix(green, tint * (0.35 + 0.65 * sky.g), sat(loud * 3.0)), leaf * 0.94);
  col = mix(col, vec3(0.012, 0.02, 0.016) + 0.05 * lit * vec3(1.0, 0.7, 0.4), fsInk(t.x - 0.0012));
 }
 // the wading bird
 vec2 bx = vec2((az + 1.83) * mix(r, 1.0, 0.5), y - 0.012) / 0.36;
 if (abs(bx.x) < 0.6 && bx.y < 1.1) col = mix(col, vec3(0.02, 0.03, 0.03), fsInk(fsWader(bx) * 0.36));
 // the reeds
 const float M = 132.0;
 float gm = turn * M, im = floor(gm), bed = fsS(0.35, 0.75, noise(dir * 2.1 + 9.0));
 for (int k = -2; k <= 2; k++) {
  float id = mod(im + float(k), M);
  vec2 h = hash22(vec2(id, 11.0)), h2 = hash22(vec2(id, 23.0));
  float at = im + float(k) + h.x;
  vec4 m = piece(vec2(fract(at / M), h2.x > 0.5 ? 0.69 : 0.86));
  float H = (0.06 + 0.18 * h.y) * (0.45 + 0.75 * bed) + 0.3 * uEnergy * m.a * (0.4 + 0.6 * h2.y);
  float v = y / H;
  float bend = (h2.y - 0.5) * 0.6 * v * v * H + 0.006 * sin(uTime * 0.5 + id) * v;
  float x = (at - gm) / M * TAU * r + bend, d = max(abs(x) - 0.0055 * (1.0 - v * 0.92), y - H);
  vec3 ink = mix(vec3(0.015, 0.035, 0.02), fsGlass(m), sat(m.a * 1.1) * fsS(0.35, 1.0, v));
  col = mix(col, ink, fsInk(d) * 0.95);
  if (h2.x > 0.72) { // a seed head
   vec2 e = vec2(x, y - H * 0.88) / vec2(0.0075, 0.026);
   col = mix(col, vec3(0.05, 0.03, 0.02) + ink, fsInk((length(e) - 1.0) * 0.0075));
  }
 }
 // the foot of the bank
 col = mix(col, vec3(0.02, 0.04, 0.025), fsInk(y - 0.018 - 0.02 * noise(dir * 30.0)) * 0.9);
 return col;
}
// Stones of the bottom, one layer.
vec3 fsStones(vec3 col, vec2 b, float cell, float seed, float soft) {
 vec2 g = b / cell, id = floor(g);
 vec2 h = hash22(id + seed), h2 = hash22(id + seed + 7.7);
 vec2 q = rot(h2.x * 6.0) * (fract(g) - 0.5 - (h - 0.5) * 0.24) / ((0.15 + 0.23 * h.x) * vec2(1.0, 0.62 + 0.38 * h2.y));
 float d = length(q) * (1.0 + 0.1 * sin(atan(q.y, q.x + 1e-5) * 3.0 + h.y * 9.0)), dome = sqrt(max(1.0 - d * d, 0.0));
 vec3 tone = mix(vec3(0.06, 0.105, 0.07), vec3(0.24, 0.215, 0.12), h2.y * h2.y) * (0.55 + 0.8 * h.y * h.y);
 col *= 1.0 - 0.55 * fsS(1.6, 0.9, d);
 tone *= (0.2 + 0.8 * dome) * (0.7 + 0.6 * noise(g * 11.0));
 return mix(col, tone, fsS(1.0 + soft, 0.9 - soft, d) * (0.45 + 0.55 * fsS(0.1, 0.4, h2.x)));
}
// The dark mirror outside the window: the bottom upside down in green water.
vec3 fsMirror(vec2 u, vec2 slope, float ru) {
 vec2 b = rot(0.6) * (u - slope * 1.3) * 1.9 + 3.0;
 float n = noise(b * 1.3), soft = 0.06 + 0.07 * ru;
 vec3 bed = vec3(0.045, 0.065, 0.04) * (0.4 + 0.8 * n);
 bed = mix(bed, fsStones(bed, b + 5.0, 0.19, 4.0, soft), fsS(0.2, 0.6, n));
 bed = fsStones(bed, b, 0.43, 1.0, soft * 0.5);
 float far = exp(-max(ru - 1.0, 0.0) * mix(2.0, 1.1, uSpace));
 return mix(vec3(0.004, 0.02, 0.013), bed * vec3(0.75, 1.15, 0.8), far * 0.95);
}
// Lily pads from beneath, with the stems that run down past the eye.
const vec3 fsP[6] = vec3[6](vec3(-0.66, 0.74, 0.17), vec3(-0.93, 0.5, 0.12), vec3(-0.92, 0.84, 0.2), vec3(-1.18, 0.63, 0.13), vec3(-0.5, 1.04, 0.14), vec3(-1.3, 0.98, 0.17));
vec3 fsPads(vec3 col, vec2 u, vec2 slope, float inWin) {
 for (int i = 0; i < 6; i++) {
  vec3 P = fsP[i]; float fi = float(i);
  vec2 c = P.xy + 0.012 * vec2(sin(uTime * 0.23 + fi * 2.0), cos(uTime * 0.19 + fi * 3.0)), l = u - c;
  float rc = length(c); vec2 o = c / rc;
  float along = dot(u, o) - rc, side = dot(u, vec2(-o.y, o.x)) + 0.1 * along * along * (fi * 0.4 - 1.0);
  float w = 0.009 * (1.0 + along * 0.9);
  if (along > 0.0) col = mix(col, vec3(0.012, 0.03, 0.016) + vec3(0.05, 0.08, 0.03) * sat(side / w) / (1.0 + 2.0 * along), fsS(fsPx, -fsPx, abs(side) - w) * sat(along * 25.0));
  l -= slope * 0.4;
  float d = length(l), a = atan(l.y, l.x + 1e-5) + fi * 2.1;
  a = mod(a + PI, TAU) - PI;
  float edge = min(P.z * (1.0 + 0.03 * sin(a * 5.0 + fi)) - d, (abs(a) - 0.12) * d);
  if (edge < -0.02) continue;
  float f = d / P.z, vein = pow(abs(cos(a * 7.0)), 18.0) * fsS(1.0, 0.1, f);
  vec3 through = mix(vec3(0.3, 0.34, 0.07), vec3(0.26, 0.1, 0.05), fsS(0.35, 1.0, f + 0.25 * sin(fi * 4.0)));
  vec3 pad = through * (0.1 + (0.16 + 0.5 * exp(-dot(u - fsSun, u - fsSun) * 1.4)) * inWin) * (1.0 - 0.55 * vein) * (0.8 + 0.4 * noise(l * 40.0));
  col = mix(col, pad, fsS(-fsPx, fsPx, edge));
 }
 return col;
}
// Ribbons of weed that rise from the bottom and lean in to the light.
vec3 fsWeed(vec3 col, vec2 u, float ru) {
 if (ru < 0.97) return col;
 float W = 56.0, g = fract(atan(u.y, u.x + 1e-5) / TAU + 1.0) * W, id0 = floor(g);
 for (int k = -2; k <= 2; k++) {
  float id = mod(id0 + float(k), W);
  vec2 h = hash22(vec2(id, 5.0));
  float at = id0 + float(k) + 0.1 + h.x * 0.8, th = at / W * TAU;
  float bed = fsS(0.72, 0.97, cos(th + 0.62)) + fsS(0.86, 0.99, cos(th - 3.75));
  if (bed < 0.1) continue;
  float tip = 0.98 + 0.9 * h.y + 1.0 - min(bed, 1.0), v = ru - tip;
  float sway = 0.07 * sin(ru * 3.4 - uTravel * 0.35 - uTime * 0.12 + h.x * 20.0) * sat(1.2 - 0.3 * v);
  float x = (g - at) / W * TAU * ru + sway;
  float w = (0.03 + 0.03 * h.x) * fsS(0.0, 0.5, v) * (0.7 + 0.35 * v) * (1.0 + 0.18 * sin(v * 24.0 + h.y * 9.0));
  vec3 tone = mix(vec3(0.035, 0.085, 0.03), vec3(0.075, 0.085, 0.02), h.y) * (0.25 + 1.5 * exp(-max(ru - 1.0, 0.0) * 1.1));
  float fold = x / max(w, 1e-3);
  tone *= (0.62 + 0.5 * fold * sign(h.x - 0.5)) * (0.65 + 0.35 * fsS(0.0, 0.3, abs(fold)));
  col = mix(col, tone, fsS(fsPx, -fsPx, abs(x) - w) * step(0.0, v) * 0.94);
 }
 return col;
}
// Small rings where the keys rain. The slope of the water.
vec2 fsRain(vec2 u) {
 vec2 g = u / 0.36, id = floor(g), l = fract(g) - 0.5; float h = hash21(id + 3.0), c = fract(uTime * 0.55 + h);
 vec2 o = (hash22(id + mod(floor(uTime * 0.55 + h), 61.0) * 1.7) - 0.5) * 0.3;
 return fsRing(l, o, c * 0.32, 26.0) * (1.0 - c) * c * fsS(0.5, 0.35, max(abs(l.x), abs(l.y))) * uKeys * 0.28;
}
// Birds while a phrase sounds, and leaves afloat that take its colour.
vec3 fsPassing(vec3 col, vec2 q, vec2 u, vec2 slope) {
 float c = fract(uTime / 26.0);
 for (int i = 0; i < 3; i++) {
  float fi = float(i);
  vec2 at = vec2(mix(-1.3, 1.3, fract(c + fi * 0.035)), 0.16 - 0.15 * fi + 0.2 * c);
  vec2 x = rot(-0.2) * (q - at) / (0.15 - 0.025 * fi);
  float ax = abs(x.x), wing = (0.1 + 0.22 * sin(uTime * 1.7 + fi * 2.0)) * ax * (1.3 - ax) + 0.22 * ax * ax;
  float d = max(abs(x.y + wing) - 0.12 * (1.0 - ax), ax - 1.0);
  d = min(d, length(x * vec2(2.4, 1.0) - vec2(0.0, 0.05)) - 0.24);
  col = mix(col, vec3(0.07, 0.09, 0.1), fsS(fsPx, -fsPx, d * 0.09) * sat(uPhrase * 2.2));
 }
 for (int i = 0; i < 3; i++) {
  float fi = float(i);
  vec2 at = vec2(0.02 + 0.5 * sin(uTime * 0.017 + fi * 2.4), -0.06 + 0.42 * cos(uTime * 0.013 + fi * 1.7)) - slope * 0.5;
  vec2 x = rot(fi * 2.0 + uTime * 0.02) * (u - at) / (0.074 - 0.012 * fi);
  if (dot(x, x) > 4.0) continue;
  x.y += 0.14 * x.x * x.x - 0.07;
  float in_ = sat(1.0 - x.x * x.x), half_ = 0.44 * in_ * (1.0 + 0.4 * x.x), d = (abs(x.y) - half_) * 0.06;
  col *= 1.0 - 0.35 * fsS(0.02, 0.0, d) * in_;
  col += 0.18 * fsS(0.006, 0.0, abs(d - 0.012)) * in_;
  vec3 leaf = mix(vec3(0.42, 0.2, 0.03), uKind[3] * uKind[3] + 0.06, 0.25 + 0.7 * uPhrase) * (0.55 + 0.5 * x.y + 0.5 * uPhrase);
  if (abs(x.x) < 1.0) col = mix(col, leaf * (1.0 - 0.5 * fsS(0.06, 0.02, abs(x.y))), fsS(fsPx, -fsPx, d));
 }
 return col;
}
// Silt in the water, caught by the light.
float fsSilt(vec2 p, float cell, float seed) {
 vec2 g = (p + vec2(0.004, 0.0025) * uTime) / cell, id = floor(g), h = hash22(mod(id, 97.0) + seed);
 float d = length((fract(g) - 0.5 - (h - 0.5) * 0.7) * cell), w = 0.0003 + 0.0022 * h.y * h.y * h.x;
 return fsS(w + 1.0 / uRes.y, 0.0, d) * h.x * h.x * 0.8;
}
float fsZig(float x, float s) { float i = floor(x); return mix(hash11(i + s), hash11(i + 1.0 + s), x - i) - 0.5; }
// The ice: milk, cracks and stacked flat bubbles. glow is the daylight in it.
vec3 fsIce(vec3 col, vec2 u, vec3 glow, float ring) {
 float a = noise(u * 1.7 + 3.0), b = noise(u * vec2(5.0, 4.0) + 9.0), c = noise(u * 19.0);
 float milk = sat(0.22 + 0.66 * a + 0.22 * (b - 0.5) + 0.1 * (c - 0.5));
 col = mix(col, vec3(0.80, 0.93, 0.87) * glow * (0.8 + 0.3 * b), milk * 0.5);
 // snow that lies on top and keeps the light out
 col *= 1.0 - 0.42 * fsS(0.5, 0.72, noise(rot(0.5) * u * vec2(1.1, 2.6) + 20.0) * 0.8 + 0.2 * b);
 // cracks: a bright line and, to one side, the wall that slants up through the ice
 for (int i = 0; i < 7; i++) {
  float fi = float(i), h = hash11(fi + 1.3), h2 = hash11(fi + 31.7);
  float th = fi * 1.94 + h * 0.6; vec2 n = vec2(cos(th), sin(th));
  float x = dot(u, vec2(-n.y, n.x)), o = (h2 - 0.5) * 1.9;
  float d = dot(u, n) - o - 0.13 * fsZig(x * 1.9, fi * 37.0) - 0.028 * fsZig(x * 8.0, fi * 37.0 + 200.0);
  if (d < -0.02 || d > 0.4) continue;
  float lives = fsS(0.0, 0.5, noise(vec2(x * 0.9 + fi * 3.0, 40.0 + fi)) * 1.5 - 0.35);
  float shade = noise(vec2(x * 34.0 + d * 20.0, d * 5.0 + fi));
  float wall = fsS(-fsPx, fsPx, d) * exp(-d * (6.0 + 12.0 * h)) * lives * (0.25 + 0.75 * shade);
  float w = 0.0012 + 0.0024 * (0.5 + 0.5 * sin(x * 5.0 + fi * 3.0)) * lives;
  float line = fsS(w + fsPx, w - fsPx, abs(d)) * lives;
  float say = 0.8 + 0.7 * band(fi / 6.0) + 3.0 * ring;
  vec3 hue = mix(vec3(0.75, 0.88, 0.83), 0.1 + 1.6 * uKind[3] * uKind[3], sat(1.4 * uPhrase) * step(0.5, fract(fi * 0.5 + 0.25)));
  col = mix(col, hue * glow * say, wall * 0.6);
  col = mix(col, hue * glow * say * 1.2, line * 0.85);
 }
 // bubbles that rose, were caught, and lie flat one under the other
 vec2 g = u / 0.23, id = floor(g), h = hash22(id + 2.0), h3 = hash22(id + 12.0);
 vec2 k = (id + 0.5 + (h - 0.5) * 0.42) * 0.23; float rk = length(k);
 vec4 m = piece(vec2(fract(0.25 - atan(k.y, k.x + 1e-5) / TAU), sat(0.12 + 0.62 * rk)));
 float some = fsS(0.56, 0.66, h3.x * 0.75 + 0.25 * m.a + 0.5 * (noise(id * 0.45 + 5.0) - 0.5));
 if (some > 0.0) {
  vec2 o = k / max(rk, 0.05);
  float big = (0.03 + 0.04 * h3.y * h3.y) * (0.8 + 0.4 * m.a);
  for (int i = 0; i < 6; i++) {
   float fi = float(i);
   vec2 l = u - k - o * (fi - 2.5) * 0.014 - (hash22(id + fi * 3.1) - 0.5) * 0.016;
   float R = big * (0.35 + 0.75 * hash11(h.x * 9.0 + fi)), d = length(l) - R, face = fsS(fsPx, -fsPx, d) * some;
   vec3 hue = mix(vec3(0.82, 0.95, 0.9), fsGlass(m) * 1.3, sat(m.a) * 0.4) * glow;
   col *= 1.0 - 0.45 * fsS(0.014, 0.0, d) * (1.0 - face) * some;
   col = mix(col, hue * (0.5 + 0.1 * fi + 0.8 * ring), face * 0.42);
   col = mix(col, hue * 1.3, fsS(0.006, 0.0, -d) * face * 0.75);
  }
 }
 return col;
}
vec3 render(vec2 p) {
 float wide = uRes.x / uRes.y, R = min(0.365, 0.47 * wide), t = uTime;
 // looking up, tipped a little
 vec2 s = p - vec2(0.09 * min(wide, 1.6) / 1.6, 0.085);
 float f = R / 1.134;
 vec3 rd = vec3(s.x, s.y * 0.985 + f * 0.174, f * 0.985 - s.y * 0.174);
 vec2 u = rd.xy / max(rd.z, 0.02) / 1.134;
 fsBlur = fsPx = length(fwidth(u)) * 0.6 + 1e-4;
 float ru = length(u), hole = 1.0, hd = 0.0;
 vec2 slope = fsSlope(u, t), holeAt = vec2(0.36, -0.22);
 // in the ice, one round hole
 bool ice = uVar > 0.5;
 if (ice) {
  vec2 l = u - holeAt;
  hd = length(l) - 0.235 - 0.012 * sin(atan(l.y, l.x + 1e-5) * 3.0 + 1.0) - 0.012 * noise(u * 14.0);
  hole = fsS(0.004, -0.004, hd);
 }
 vec2 drop = 0.12 * vec2(sin(t * 0.13), cos(t * 0.17)) + (ice ? holeAt : vec2(0.02, 0.06));
 float R1 = 0.17 + (1.0 - uHits) * 1.1, ring = length(u - drop) - R1;
 float wave = cos(34.0 * ring);
 ring = uHits * exp(-ring * ring * 60.0);
 slope += fsRing(u, drop, R1, 9.0) * uHits * 0.1 + fsRain(u);
 slope += fsRing(u, vec2(-0.5, 0.2), (1.0 - uCue) * 1.7, 4.0) * 4.0 * uCue * (1.0 - uCue) * 0.07;
 if (ice) {
  vec2 bulge = 0.05 * vec2(noise(u * 3.0) - 0.5, noise(u * 3.0 + 40.0) - 0.5);
  slope = mix(bulge, slope * 0.6, hole);
  fsBlur = mix(0.026, fsPx, hole);
 }
 vec2 q = u - slope * mix(0.45, 1.25, sat(ru));
 float az = atan(q.y, q.x + 1e-5);
 // sixteen sectors of the rim shiver with the bands
 float sec = fract(0.25 - az / TAU) * 16.0; int bi = int(min(sec, 15.0)); float sf = sin(PI * fract(sec));
 float shiver = uBands[bi] * sf * sf * (0.5 + 0.5 * sin(az * 14.0 - t * 0.5));
 if (!ice) q *= 1.0 + shiver * 0.014 * sin(az * 64.0 + t * 1.6) * fsS(0.6, 1.0, ru);
 float r = length(q), lit = exp(-dot(q - fsSun, q - fsSun) * 1.6), soft = fsBlur * 1.5;
 vec3 col = fsMirror(u, slope, ru);
 // light of the window in the water
 col += vec3(0.035, 0.1, 0.06) * exp(-max(r - 1.0, 0.0) * 4.5) * (0.4 + 0.3 * uPad);
 float inWin = fsS(soft, -soft, r - 1.0);
 if (r < 1.06) {
  vec3 win = fsSky(q, r);
  if (!ice || hole > 0.0) win = fsPassing(win, q, u, slope);
  win = fsBank(win, q, r, az, lit);
  float c = dot(q, vec2(0.95, 0.3)) - mix(1.4, -0.8, uCue);
  win *= 1.0 - 0.62 * uCue * exp(-c * c * 3.0);
  float edge = fsS(0.016, 0.0, 1.0 - r) * (ice ? 0.4 : 1.0), here = 0.5 + 0.5 * cos(az - TAU * (0.25 - uLoop));
  win = mix(win, vec3(0.85, 0.95, 0.8) * (0.28 + 0.6 * lit + 0.2 * uPad + 0.5 * uMic + 0.6 * pow(here, 14.0)), edge);
  col = mix(col, win, vec3(fsS(soft, -soft, r - 1.0045), inWin, fsS(soft, -soft, r - 0.9955)));
 }
 if (ice) {
  vec3 glow = mix(vec3(0.05, 0.13, 0.095) * (0.85 + 0.5 * uDrone), vec3(1.0), fsS(1.3, 0.8, ru)) * (0.8 + 0.3 * uPad + 0.45 * lit);
  col = mix(fsIce(col, u, glow, ring), col, hole);
  col = mix(col, vec3(0.92, 1.0, 0.95) * glow, fsS(0.01 + fsPx, 0.01 - fsPx, abs(hd - 0.006)) * 0.55);
  col *= 1.0 - 0.5 * exp(-abs(hd) * 60.0) * hole;
 } else {
  col = fsPads(col, u, slope, inWin);
  col = fsWeed(col, u, ru);
 }
 col *= 1.0 + mix(0.45, 0.75, hole) * ring * wave;
 float silt = fsSilt(p, 0.045, 3.0) + fsSilt(rot(0.6) * p, 0.085, 9.0);
 col += vec3(0.45, 0.6, 0.42) * silt * (0.1 + 0.6 * uTexture) * (0.15 + exp(-max(ru - 1.0, 0.0) * 1.3)) * (1.0 - 0.8 * inWin);
 return screenOf(col * 1.25);
}
