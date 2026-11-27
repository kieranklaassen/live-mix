// name: Pond
// a: Lilies
// b: Stream
// what: Still water seen from above at a slant, with lily leaves and flowers floating where the piece sounds, trees and sky mirrored between them and light moving on the shallow bottom; or a clear stream over round stones with leaves carried past on top.
// follows: The piece lies on the water (across is the loop, away from you is the room): leaves gather and flowers open where its strokes are, in their colours; a hit or a cue drops a ring that rocks the leaves and breaks the reflection; the high band puts glints on the ripples.
// own: 0 1 small and many, -1 great and few; 1 1 narrow pointed leaves (b: needles), -1 lobed star leaves (b: round petals); 2 1 pale day, the water mirrors a white sky, -1 night with a moon and stars in the water; 3 1 frozen over, frosted and cracked, -1 rain falls on it; 4 the eye: 1 straight above, -1 low along the water to the far bank; 5 1 clear shallows over pale sand, -1 black deep water that only mirrors; 6 1 all dyed in the colours of the sounds, -1 drawn in ink lines; 7 1 leaves crowd everywhere, -1 leaves are few and carp go under in the colours of the sounds
float poH, poSin, poCos; // the eye: how high over the water and how far tipped down
const float poF = 1.1;
float poFar; // how far out the rings fall
vec2 poDrift;
float poM;
float day, night, ice, wet, pale, black, dyed, ink, bare;
const mat2 poR1 = mat2(0.87758, -0.47943, 0.47943, 0.87758), poR2 = mat2(0.62161, 0.78333, -0.78333, 0.62161);
// A slow wave like a sine (one turn in TAU), made without one.
float poSin_(float x) { x = abs(fract(x * 0.159155 - 0.25) - 0.5) * 2.0; return 1.0 - 2.0 * x * x * (3.0 - 2.0 * x); }
// Where a place on the water lies in the piece.
vec2 poUV(vec2 w) {
  float along = poH * poSin + w.y * poCos;
  return vec2(poF * w.x / along / 1.78 + 0.5, 0.5 - poF * (w.y * poSin - poH * poCos) / along);
}
// The rings a hit and a cue drop: returns the slope of the water (x, z) and how high it stands.
vec3 poRing(vec2 w) {
  vec3 s = vec3(0.0);
  vec2 c1 = vec2(1.2 * sin(uTime * 0.21), 3.4 + 0.8 * cos(uTime * 0.17)) * poFar, c2 = vec2(-0.8 + 0.6 * sin(uTime * 0.13), 2.8) * poFar;
  for (int k = 0; k < 2; k++) {
    vec2 c = k == 0 ? c1 : c2;
    float sig = k == 0 ? uHits : uCue;
    float R = ((1.0 - sig) * (k == 0 ? 2.4 : 5.5) + 0.05) * poFar;
    vec2 d = w - c; float r = length(d) + 0.001;
    float x = (r - R) * 7.0 / poFar;
    float env = exp(-x * x * 0.12) * sig * (1.0 - sig * sig * sig) * 1.6 / (0.6 + R);
    s += vec3(d / r * cos(x) * env, sin(x) * env);
  }
  return s;
}
// The rings of falling rain: slope, and how bright.
vec3 poRain(vec2 w) {
  vec3 s = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float cell = k == 0 ? 0.62 : 0.37; vec2 g = (k == 0 ? w : poR1 * w + 3.7) / cell, id = floor(g);
    float h = hash21(id + float(k) * 19.0), ph = uTime * (0.45 + 0.3 * h) + h * 7.0, n = floor(ph); ph -= n;
    vec2 h2 = hash22(id + vec2(mod(n, 61.0) * 1.7, float(k) * 5.0)), d = fract(g) - 0.5 - (h2 - 0.5) * 0.3;
    float r = length(d) + 1e-3, x = (r - 0.32 * ph) * 34.0, env = exp(-x * x * 0.09) * (1.0 - ph) * smoothstep(0.0, 0.08, ph) * step(h2.y, 0.75) * smoothstep(0.5, 0.36, r);
    vec2 dir = d / r * cos(x) * env; if (k == 1) dir = dir * poR1;
    s += vec3(dir, max(sin(x + 0.6), 0.0) * env);
  }
  return s;
}
// How much frost, and where it is cracked.
vec2 poIce(vec2 w) {
  float a = noise(w * 1.1 + 0.6 * noise(w * 2.7)), b = noise(w * 2.3 + 9.0 + 0.5 * noise(w * 6.0 + 2.0));
  float crack = smoothstep(0.018, 0.0, abs(a - 0.5)) + 0.5 * smoothstep(0.02, 0.0, abs(b - 0.45)) + 0.3 * smoothstep(0.09, 0.0, abs(a - 0.5));
  return vec2(smoothstep(0.35, 0.75, fbm(w * 1.7 + 4.0)) * (0.8 + 0.2 * noise(w * 16.0)), crack);
}
// The carp under the water: how much of one is here, and its colour.
float poCarp(vec2 w, float big, vec2 mid, out vec3 c) {
  float all = 0.0; c = vec3(0.0);
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  for (int k = 0; k < 7; k++) {
    float f = float(k), h = hash11(f + 2.0), h2 = hash11(f + 31.0), dir = h2 > 0.5 ? 1.0 : -1.0;
    vec2 R = vec2(0.5 + 1.3 * h, 0.35 + 0.75 * h2) * big, at = mid + vec2((hash11(f + 7.0) - 0.5) * 3.0, (hash11(f + 11.0) - 0.5) * 1.7) * big;
    float ph = uTime * (0.05 + 0.05 * h) * dir + f * 2.4;
    vec2 q = at + R * vec2(cos(ph), sin(ph)), v = normalize(R * vec2(-sin(ph), cos(ph)) * dir + 1e-4);
    vec2 l = vec2(dot(w - q, v), dot(w - q, vec2(-v.y, v.x))) / ((0.42 + 0.22 * h) * big);
    if (dot(l, l) > 1.2) continue;
    l.y += 0.07 * sin(l.x * 5.0 - uTime * 1.3 + f) * smoothstep(0.3, -0.8, l.x);
    float ax = (l.x - 0.06) / 0.6, w2 = 0.165 * sqrt(max(1.0 - ax * ax, 0.0)) * (0.72 + 0.4 * ax) * (1.0 - 0.15 * ax * ax), tail = 0.5 * max(-0.4 - l.x, 0.0) * smoothstep(-0.86, -0.7 - 0.5 * abs(l.y), l.x);
    float fx = (l.x - 0.02 + 0.7 * (abs(l.y) - 0.12)) / 0.1, fin = 0.24 * sqrt(max(1.0 - fx * fx, 0.0));
    float m = smoothstep(0.0, -0.03, abs(l.y) - max(max(w2, tail), fin));
    int i = 1 + k - 4 * (k / 4);
    float patch_ = smoothstep(0.42, 0.55, noise(vec2(l.x * 4.0 + f * 7.0, l.y * 5.0)));
    vec3 kc = uKind[i] * (0.5 + 0.7 * uKind[i]);
    c = mix(c, mix(vec3(0.85, 0.8, 0.72), kc * 1.4, max(patch_, step(0.6, h2) * 0.9)) * (0.6 + 0.5 * lv[i]) * (0.7 + 0.5 * sqrt(max(1.0 - l.y * l.y * 30.0, 0.0))) * (1.0 - 0.6 * tail), m);
    all = max(all, m);
  }
  return all;
}
// The sky and the far bank as the water mirrors them.
vec3 poSky(vec3 r) {
  float el = r.y / max(length(r.xz), 0.001), az = atan(r.x, r.z);
  float toSun = exp(-pow((az + 0.4) * 1.2, 2.0));
  vec3 col = mix(vec3(0.75, 0.27, 0.1) * (0.25 + toSun) * (0.5 + 0.7 * uLevel), vec3(0.05, 0.065, 0.17), smoothstep(0.15, 0.8, el));
  col = mix(col, vec3(0.006, 0.014, 0.055), smoothstep(0.6, 2.4, el));
  if (day > 0.0) col = mix(col, mix(vec3(0.95, 0.92, 0.86), uKind[1] * 0.55 + 0.4, smoothstep(0.1, 1.6, el)) * (1.5 + 0.5 * toSun) * (0.8 + 0.3 * noise(vec2(az * 2.0, el * 3.0 + 4.0))), day);
  if (night > 0.0) {
    vec3 c = vec3(0.004, 0.008, 0.02) + (vec3(0.02, 0.04, 0.085) + uKind[1] * 0.02) * exp(-el * 1.3);
    float md = dot(r, vec3(0.1013, 0.5487, 0.8298));
    c += vec3(1.0, 0.93, 0.78) * (smoothstep(0.9962, 0.9982, md) * 2.4 + 0.12 * pow(sat(md), 60.0) + 0.03 * pow(sat(md), 8.0)) * (0.8 + 0.3 * uLevel);
    vec2 g = vec2(az * 34.0, el * 26.0), id = floor(g), o = fract(g) - 0.3 - 0.4 * hash22(id + 2.0);
    c += vec3(0.8, 0.87, 1.0) * step(0.9, hash21(id)) * exp(-dot(o, o) * 50.0) * 1.2 * (0.4 + 0.6 * uHigh) * smoothstep(0.1, 0.5, el);
    col = mix(col, c, night);
  }
  float line = 0.24 + 0.3 * noise(vec2(az * 2.6 + 1.0, 0.5)) + 0.1 * noise(vec2(az * 9.0, 3.5));
  float leaves = noise(vec2(az * 40.0, el * 40.0));
  float tree = smoothstep(line, line - 0.06, el + 0.06 * leaves);
  vec3 wood = vec3(0.002, 0.007, 0.005) + vec3(1.0, 0.45, 0.14) * toSun * smoothstep(0.62, 0.9, leaves) * (0.25 + 0.7 * uLevel) * smoothstep(0.03, 0.15, el);
  if (day > 0.0) wood = mix(wood, mix(vec3(0.5, 0.54, 0.52), uKind[0] * 0.3, 0.35 * (1.0 - smoothstep(0.0, 0.4, el))) * (0.6 + 0.3 * leaves), day);
  if (night > 0.0) wood = mix(wood, vec3(0.001, 0.003, 0.006), night);
  return mix(col, wood, tree);
}
// One layer of floating leaves. Returns how far inside a leaf the place is (0 at its edge, 1 at its middle; below 0 outside).
vec2 poL; float poA, poR, poLoud, poWin; vec3 poHue; vec2 poRnd;
float poLeaf(vec2 w, float cell, float seed, mat2 turned, vec2 push) {
  cell /= poM;
  w = turned * w; push = turned * push;
  vec2 g = (w + poDrift) / cell, id = floor(g);
  vec2 h = hash22(id + seed), gf = abs(fract(g) - 0.5);
  poWin = smoothstep(0.5, 0.25, max(gf.x, gf.y));
  vec2 c = (id + 0.5 + (h - 0.5) * 0.22) * cell - poDrift;
  vec4 pc = piece(poUV(c * turned));
  float loud = pc.a;
  float some = step(0.62, h.y) * (0.18 + 0.12 * h.x);
  float r = cell * max(some, 0.36 * smoothstep(0.02, 0.5, loud));
  if (uOwn[7] > 0.0) r = max(r, cell * (0.28 + 0.2 * h.x) * smoothstep(0.0, 0.25, uOwn[7] - 0.75 * h.y * (1.0 - uOwn[7])));
  if (bare > 0.0) r *= mix(1.0, smoothstep(0.62, 0.72, fract(h.x * 13.7 + h.y)) * (0.75 + 0.25 * h.y), bare);
  if (uOwn[1] != 0.0) r = mix(r, min(r * 1.25, 0.33 * cell), abs(uOwn[1]));
  vec2 l = w - c - push * (0.5 + h.x);
  float turn = h.x * 30.0 + 0.2 * poSin_(uTime * 0.11 + h.y * 20.0);
  float a = atan(l.y, l.x) - turn;
  a = mod(a + PI, TAU) - PI;
  float d = length(l);
  float rr = r * (1.0 + 0.035 * sin(a * 5.0 + h.x * 20.0));
  if (uOwn[1] < 0.0) rr *= mix(1.0, 0.55 + 0.65 * (1.0 - abs(sin(a * 2.5))), -uOwn[1]);
  poL = l; poA = a; poR = rr; poLoud = loud; poHue = pc.rgb / max(pc.a, 0.02); poRnd = h;
  float notch = (abs(a) - 0.13) * d / max(rr, 0.001) * 2.5;
  float round_ = min(1.0 - d / rr, notch + 0.03);
  if (uOwn[1] != 0.0) round_ = mix(round_, 1.0 - d / max(rr, 1e-3), abs(uOwn[1]));
  if (uOwn[1] > 0.0) {
    float x = d * cos(a) / (rr * 1.25 + 1e-4), y = d * sin(a) / (rr + 1e-4), in_ = sat(1.0 - x * x);
    round_ = mix(round_, (0.36 * in_ * (1.0 + 0.3 * x) - abs(y + 0.12 * x * x * sign(h.x - 0.5))) / 0.36, uOwn[1]);
    poA = mix(a, (y * 3.0 - x * sign(y)) * 1.2, uOwn[1]);
  }
  return r < 0.01 ? -1.0 : round_;
}
float poCaust(vec2 s, float t) {
  float a = noise(s * 1.3 + vec2(t * 0.3, t * 0.17)), b = noise(s * 2.1 - vec2(t * 0.22, -t * 0.26) + 5.0);
  float c = sat(1.0 - abs(a - b) * 2.6);
  return c * c * c;
}
float poWave(vec2 w, float t) { return noise(w * 0.9 + vec2(t * 0.12, t * 0.07)) + 0.4 * noise(w * 2.3 - vec2(t * 0.1, -t * 0.15) + 7.0); }
vec3 poLilies(vec2 p) {
  float t = uTime;
  poH = 2.0; poSin = 0.5646; poCos = 0.8253; poFar = 1.0;
  poDrift = vec2(uTravel * 0.012, uTravel * 0.006);
  if (ice > 0.0) poDrift *= 1.0 - ice;
  if (uOwn[4] != 0.0) { float k = abs(uOwn[4]), up = step(0.0, uOwn[4]), g = mix(0.6, mix(0.385, 1.5, up), k); poSin = sin(g); poCos = cos(g); poH = mix(2.0, mix(1.25, 2.6, up), k); poFar = mix(1.0, mix(0.9, 0.35, up), k); }
  vec3 ro = vec3(0.0, poH, 0.0);
  vec3 rd = normalize(vec3(p.x, p.y * poCos - poF * poSin, p.y * poSin + poF * poCos));
  vec3 rd0 = rd;
  rd.y = min(rd.y, -0.03);
  float dist = poH / -rd.y;
  vec2 w = (ro + rd * dist).xz;
  float aa = 1.6 * dist / uRes.y;
  // the surface: slow swell, the rings, and fine ripples the high band raises
  vec3 ring = poRing(w);
  float e = 0.08;
  float h0 = poWave(w, t);
  vec2 slope = vec2(poWave(w + vec2(e, 0.0), t) - h0, poWave(w + vec2(0.0, e), t) - h0) / e * 0.035;
  slope /= 1.0 + 0.12 * dist;
  slope += ring.xy * 0.5;
  float fineP = w.x * 13.0 + 3.0 * h0 + t * 0.6, fineQ = w.y * 17.0 - 2.0 * h0 - t * 0.45;
  slope += vec2(cos(fineP), cos(fineQ)) * 0.012 * (0.2 + uHigh);
  vec3 rain = vec3(0.0);
  if (wet > 0.0) { rain = poRain(w) * wet; slope += rain.xy * 0.55 / (1.0 + 0.1 * dist); }
  if (night > 0.0) slope += (vec2(noise(w * 7.0 + t * 0.3), noise(w * 7.0 + 9.0 - t * 0.25)) - 0.5) * 0.05 * night;
  if (ice > 0.0) slope = mix(slope, (vec2(noise(w * 3.0), noise(w * 3.0 + 7.0)) - 0.5) * 0.05, ice);
  vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
  float cosV = sat(dot(-rd, n));
  float fres = 0.04 + 0.96 * pow(1.0 - cosV, 2.2);
  if (black > 0.0) fres = mix(fres, 0.35 + 0.65 * fres, black);
  if (pale > 0.0) fres *= 1.0 - 0.45 * pale;
  if (day > 0.0) fres = mix(fres, 0.07 + 0.93 * fres, day);
  vec3 refl = reflect(rd, n); refl.y = abs(refl.y);
  float above = step(-0.03, rd0.y);
  vec3 sky = poSky(above > 0.5 ? vec3(rd0.x, max(rd0.y, 0.0), rd0.z) : refl);
  // the bottom, where it is shallow enough to see
  float deep = 0.2 + 0.3 * max(w.y - 1.0, 0.0);
  if (pale > 0.0) deep = mix(deep, 0.55 + 0.1 * max(w.y - 1.0, 0.0), pale);
  vec2 b = w + (rd.xz / -rd.y * 0.75 - slope * 3.0) * min(deep, 1.5) + poDrift;
  float sand = noise(b * 5.0) * 0.6 + noise(b * 17.0) * 0.4;
  float caust = poCaust(b * 2.2, t) * (0.35 + 0.9 * uLevel);
  vec3 bed = vec3(0.2, 0.13, 0.05) * (0.5 + 0.7 * sand) * (0.25 + 2.2 * caust);
  vec3 under = bed * exp(-deep * vec3(3.6, 1.9, 2.6)) + vec3(0.002, 0.012, 0.012) * (1.0 - exp(-deep * 0.9));
  if (dyed > 0.0) under = mix(under, uKind[2] * (0.25 + 0.6 * uKind[2]) * (0.4 + 0.6 * sand) * (0.12 + 0.6 * caust) * exp(-deep * 1.2) + uKind[0] * uKind[0] * 0.05, dyed * (1.0 - pale));
  if (pale > 0.0) {
    vec3 sandy = mix(vec3(0.62, 0.55, 0.4), uKind[2] * 0.75, 0.4) * (0.72 + 0.4 * sand) * (0.5 + 1.5 * caust + 0.5 * day) * (1.0 - 0.6 * night);
    under = mix(under, sandy * exp(-deep * vec3(1.5, 0.42, 0.34)) + mix(vec3(0.02, 0.2, 0.2), uKind[0] * uKind[0] * 0.5, 0.5) * (1.0 - exp(-deep * 0.9)) * (0.6 + 0.4 * day - 0.5 * night), pale);
  }
  if (day > 0.0) under *= 1.0 + 1.2 * day * (1.0 - pale);
  if (black > 0.0) under *= 1.0 - 0.94 * black;
  if (night > 0.0) under *= mix(vec3(1.0), vec3(0.25, 0.4, 0.6), night);
  if (bare > 0.0) {
    vec3 kc; vec2 at = w + slope * 0.5; vec2 mid = vec2(0.0, mix(3.3, 0.4, max(uOwn[4], 0.0)));
    float sh = poCarp(at + vec2(-0.1, 0.16), 1.15, mid, kc); under *= 1.0 - 0.55 * sh * bare;
    float m = poCarp(at, 1.15, mid, kc);
    under = mix(under, kc * (0.3 + 0.5 * uLevel * 0.6 + 0.35 * caust + 0.35 * day) * mix(vec3(1.0), vec3(0.45, 0.6, 0.9), night), m * bare * exp(-max(dist - 4.0, 0.0) * 0.15));
  }
  // a fish passing under, a soft shadow
  vec2 fc = vec2(2.2 * sin(t * 0.06), 3.2 + 1.3 * sin(t * 0.045 + 1.0));
  vec2 fd = normalize(vec2(2.2 * 0.06 * cos(t * 0.06), 1.3 * 0.045 * cos(t * 0.045 + 1.0)));
  vec2 fl = vec2(dot(w - fc, fd), dot(w - fc, vec2(-fd.y, fd.x)));
  fl.y += 0.05 * sin(fl.x * 6.0 - t * 2.2) * smoothstep(0.2, -0.5, fl.x);
  float body = length(vec2(fl.x * 0.3, fl.y) / (0.11 * smoothstep(-0.62, 0.1, fl.x) * smoothstep(0.42, 0.1, fl.x) + 0.001));
  under *= 1.0 - 0.75 * smoothstep(1.3, 0.3, body) * (1.0 - bare);
  // the shadows the leaves throw down into the water
  float shade = 0.0;
  vec2 off = vec2(0.07, 0.1) * min(deep, 1.0) + slope * 0.6;
  shade = max(shade, smoothstep(-0.05, 0.15, poLeaf(w + off, 0.78, 3.0, poR1, ring.xy * 0.2)));
  shade = max(shade, smoothstep(-0.05, 0.15, poLeaf(w + off, 0.5, 11.0, poR2, ring.xy * 0.2)));
  under *= 1.0 - 0.7 * shade;
  vec3 col = mix(under, sky, fres);
  // glints: the low sun through the trees, broken into sparks by the fine ripples
  vec2 fg = vec2(noise(w * vec2(21.0, 9.0) + vec2(t * 0.35, 0.0)), noise(w * vec2(17.0, 8.0) + vec2(5.0, -t * 0.3))) - 0.5;
  vec3 n2 = normalize(n + vec3(fg.x, 0.0, fg.y) * (0.1 + 0.22 * uHigh));
  vec3 r2 = reflect(rd, n2); r2.y = abs(r2.y);
  float sp = pow(sat(dot(r2, normalize(vec3(-0.37, 0.26, 0.88)))), 260.0);
  if (uOwn[2] != 0.0) sp *= 1.0 - abs(uOwn[2]);
  if (ice > 0.0) sp *= 1.0 - ice;
  if (wet > 0.0) col += mix(vec3(0.35, 0.4, 0.45), sky, 0.5) * rain.z * 1.2 * exp(-dist * 0.06);
  col += vec3(1.0, 0.62, 0.3) * sp * (0.35 + 1.3 * uHigh) * (0.5 + uLevel);
  col += vec3(0.9, 0.95, 1.0) * max(ring.z, 0.0) * 0.12;
  if (ink > 0.0) {                          // paper, with the ripples drawn as a few lines
    float l = h0 * 5.0 + ring.z * 2.0 + rain.z, f = abs(fract(l) - 0.5);
    col = mix(col, vec3(1.45, 1.4, 1.28) * (0.94 + 0.08 * sand) * (1.0 - 0.4 * smoothstep(0.05, 0.0, f) * exp(-dist * 0.12)), ink * 0.95);
  }
  // the leaves, and the flowers that open on them
  for (int k = 0; k < 2; k++) {
    float cell = k == 0 ? 0.78 : 0.5;
    float d = k == 0 ? poLeaf(w, cell, 3.0, poR1, ring.xy * 0.2) : poLeaf(w, cell, 11.0, poR2, ring.xy * 0.2);
    float m = smoothstep(0.0, aa / max(poR, 0.01) * 1.5, d);
    float dn = 1.0 - d;
    float veins = pow(abs(cos(poA * 8.0)), 24.0) * smoothstep(1.0, 0.15, dn) + 0.5 * pow(abs(cos(poA * 24.0 + 2.0 * dn)), 10.0) * smoothstep(0.3, 0.9, dn);
    vec3 green = mix(vec3(0.012, 0.06, 0.028), vec3(0.05, 0.13, 0.03), poRnd.x);
    green = mix(green, vec3(0.1, 0.09, 0.02), smoothstep(0.75, 1.0, poRnd.y * dn) * 0.6);
    float tilt = clamp(dot(poL, vec2(-0.6, 0.8)) / max(poR, 0.01) + dot(ring.xy, vec2(-0.6, 0.8)) * 5.0, -1.2, 1.5);
    vec3 leaf = green * (0.75 + 0.35 * tilt + 0.5 * veins) * (0.7 + 0.5 * smoothstep(0.85, 1.0, dn));
    leaf += sky * (0.06 + 0.35 * pow(1.0 - cosV, 2.0)) * (0.6 + 0.4 * tilt);
    leaf += poHue * poLoud * 0.1 * (0.4 + veins);
    if (uOwn[1] != 0.0 || dyed > 0.0) {
      vec3 dye = mix(mix(uKind[0], uKind[2], poRnd.x), mix(poHue, uKind[0], 0.3), smoothstep(0.02, 0.4, poLoud));
      leaf = mix(leaf, dye * (0.12 + 0.6 * dye) * (0.5 + 0.35 * tilt + 0.4 * veins) * (0.7 + 0.6 * smoothstep(0.85, 1.0, dn)) + sky * 0.05, dyed);
    }
    if (day > 0.0) leaf *= 1.0 + 1.3 * day;
    if (night > 0.0) leaf *= mix(vec3(1.0), vec3(0.35, 0.5, 0.8), night);
    if (ink > 0.0) {
      vec3 line = poHue * poHue * 0.35 * poLoud + uKind[0] * uKind[0] * 0.1;
      leaf = mix(leaf, line, ink); m *= mix(1.0, sat(smoothstep(0.1, 0.05, d) + 0.75 * smoothstep(0.3, 0.8, veins) + 0.12), ink);
    }
    col = mix(col, leaf, m);
    // the flower: three rings of petals, each a little higher and smaller, round a gold heart
    float open = smoothstep(0.3, 0.75, poLoud);
    if (bare > 0.0) open *= 1.0 - bare;
    if (ice > 0.0) open *= 1.0 - 0.9 * ice;
    if (uOwn[1] < 0.0) open *= 1.0 + 0.5 * uOwn[1];
    float rf = cell / poM * 0.24 * open;
    vec2 rv = normalize(poRnd - 0.5 + 0.001);
    vec2 q = poL - poR * 0.25 * rv;
    vec3 deepHue = poHue * poHue * 1.3 + poHue * 0.2, pale = mix(vec3(1.0, 0.93, 0.88), poHue * 1.3, 0.35);
    float halo = exp(-length(q) / max(rf, 0.001) * 1.3) * open * poWin * (1.0 - 0.75 * max(abs(uOwn[1]), ink));
    col += deepHue * halo * 0.8 * poLoud * (1.0 - 0.6 * night);
    for (int j = 0; j < 3; j++) {
      float fj = float(j);
      vec2 qq = q - vec2(0.0, 0.17 * rf * fj);
      float rj = rf * (1.0 - 0.27 * fj), len = length(qq), fr = len / max(rj, 0.001);
      vec2 u = mat2(rv.x, -rv.y, rv.y, rv.x) * qq / max(len, 0.0001);
      float c4 = 1.0 - 8.0 * u.x * u.x * u.y * u.y, s4 = 4.0 * u.x * u.y * (u.x * u.x - u.y * u.y);
      float lobe = sqrt(abs(j == 1 ? s4 : c4));
      float edge = 0.38 + 0.62 * lobe * sqrt(lobe);
      if (uOwn[1] > 0.0) edge = mix(edge, 0.16 + 0.84 * lobe * lobe * lobe * lobe, uOwn[1]);
      if (uOwn[1] < 0.0) edge = mix(edge, 0.72 + 0.25 * sqrt(lobe), -uOwn[1]);
      float pm = smoothstep(edge, edge - aa * 1.5 / max(rj, 0.001), fr) * step(0.001, rf);
      if (ink > 0.0) pm *= mix(1.0, 0.1 + 0.9 * smoothstep(edge * 0.75, edge * 0.9, fr), ink);
      vec3 petal = mix(deepHue, pale, sat(fr * 1.1 - 0.15 + 0.2 * fj)) * (0.4 + 0.6 * lobe) * (0.45 + 0.25 * fj + 0.7 * poLoud);
      if (ink > 0.0) petal = mix(petal, deepHue * 0.25, ink);
      col = mix(col, petal, pm);
    }
    col = mix(col, vec3(1.0, 0.6, 0.1) * (0.8 + 0.6 * poLoud), smoothstep(rf * 0.17, rf * 0.17 - aa * 1.5, length(q - vec2(0.0, 0.42 * rf))) * step(0.001, rf));
  }
  if (ice > 0.0) {
    vec2 f = poIce(w); float near = exp(-max(dist - 3.0, 0.0) * 0.12);
    vec3 c = mix(vec3(0.07, 0.13, 0.17) + 0.18 * sky, vec3(0.62, 0.7, 0.76), f.x * 0.8) * mix(1.0, 1.35, day) * mix(vec3(1.0), vec3(0.22, 0.32, 0.5), night);
    c = mix(c, mix(c, uKind[1] * 0.8 + 0.1, 0.35), 1.0 - f.x);
    col = mix(col, col * 0.75 * (1.0 - 0.8 * f.x) + c * (0.3 + 0.7 * f.x), ice * 0.92);
    col += (vec3(0.5, 0.6, 0.65) + uKind[3] * 0.3) * f.y * near * ice * (0.22 + 0.5 * uLevel * 0.4 + 2.5 * max(ring.z, 0.0)) * mix(1.0, 0.4, night);
  }
  // lost in the dusk far out
  col *= 1.0 - 0.7 * smoothstep(8.0, 40.0, dist) * (1.0 - day);
  return mix(col, sky, above);
}
// One layer of round stones on the bed of the stream. Lays its stone over col and returns the new colour.
vec3 poStone(vec3 col, vec2 b, float cell, float seed, mat2 turned, vec3 L) {
  cell /= poM;
  vec2 g = turned * b / cell, id = floor(g);
  vec2 h = hash22(id + seed), h2 = hash22(id + seed + 7.7);
  vec2 v = normalize(h2 - 0.5 + 0.001);
  mat2 own = mat2(v.x, -v.y, v.y, v.x);
  vec2 size = (0.2 + 0.16 * h.x) * vec2(1.0, 0.62 + 0.38 * h2.y);
  vec2 q = own * (fract(g) - 0.5 - (h - 0.5) * 0.24) / size;
  float d = length(q);
  float dome = sqrt(max(1.0 - d * d, 0.0));
  vec3 nrm = normalize(vec3(((q / size * 0.2) * own) * turned, dome + 0.25));
  float speck = noise(g * 9.0 + h * 30.0);
  vec3 tone = mix(vec3(0.2, 0.2, 0.2), vec3(0.4, 0.29, 0.17), smoothstep(0.1, 0.6, h2.y));
  tone = mix(tone, vec3(0.2, 0.25, 0.3), smoothstep(0.7, 0.8, h2.y));
  tone = mix(tone, vec3(0.6, 0.56, 0.48), step(0.88, h.y));
  tone = mix(tone, vec3(0.34, 0.13, 0.07), step(0.8, h.x) * 0.8) * (0.35 + 1.0 * h2.x) * (0.7 + 0.6 * speck);
  if (dyed > 0.0) tone = mix(tone, mix(uKind[0], uKind[2], smoothstep(0.2, 0.8, h2.y)) * (0.25 + 0.45 * h2.x) * (0.8 + 0.4 * speck), 0.85 * dyed);
  if (pale > 0.0) tone = mix(tone, vec3(0.5, 0.46, 0.4) * (0.6 + 0.5 * h2.x), 0.5 * pale);
  vec3 stone = tone * (0.22 + 0.95 * sat(dot(nrm, L)) + 0.25 * nrm.z);
  float foot = 0.7 * smoothstep(1.45, 0.95, d);
  if (pale > 0.0) foot *= 1.0 - 0.85 * pale;
  if (ink > 0.0) foot *= 1.0 - ink;
  col *= 1.0 - foot;
  float there = smoothstep(1.0, 0.94, d);
  if (pale > 0.0) there *= mix(1.0, smoothstep(0.55, 0.62, fract(h.x * 7.3 + h2.y)), pale);
  if (ink > 0.0) there *= mix(1.0, 0.1 + 0.9 * smoothstep(0.86, 0.95, d), ink);
  return mix(col, stone, there);
}
// One layer of leaves carried on the stream. Returns how far inside a leaf the place is.
float poCarried(vec2 w, float cell, float seed, float flow) {
  cell /= poM;
  vec2 g = (w - vec2(flow, 0.0)) / cell + seed, id = floor(g);
  vec2 h = hash22(id + seed);
  vec2 c = (id + 0.5 + (h - 0.5) * 0.4 - seed) * cell + vec2(flow, 0.0);
  vec4 pc = piece(poUV(c));
  float size = cell * (0.09 * step(0.7, h.y) + 0.2 * smoothstep(0.03, 0.5, pc.a));
  if (uOwn[7] > 0.0) size = max(size, cell * (0.15 + 0.07 * h.x) * smoothstep(0.0, 0.25, uOwn[7] - 0.75 * h.y * (1.0 - uOwn[7])));
  if (bare > 0.0) size *= mix(1.0, smoothstep(0.62, 0.72, fract(h.x * 13.7 + h.y)), bare);
  if (uOwn[1] > 0.0) size *= 1.0 + 0.9 * uOwn[1];
  float turn = h.x * 20.0 + 0.3 * poSin_(uTime * 0.2 + h.y * 30.0) + uTime * 0.05 * (h.y - 0.5);
  vec2 v = normalize(vec2(poSin_(turn + 1.5708), poSin_(turn)));
  vec2 l = mat2(v.x, -v.y, v.y, v.x) * (w - c);
  float x = l.x / max(size, 0.001), y = l.y / max(size, 0.001);
  float in_ = sat(1.0 - x * x);
  float halfWide = 0.46 * sqrt(in_ * sqrt(in_)) * (1.0 + 0.35 * x);
  if (uOwn[1] > 0.0) halfWide *= 1.0 - 0.76 * uOwn[1];
  if (uOwn[1] < 0.0) halfWide = mix(halfWide, 0.85 * sqrt(in_) * (1.0 + 0.2 * x) - 0.4 * smoothstep(0.6, 1.0, x) * smoothstep(0.3, 0.0, abs(y)), -uOwn[1]);
  poL = vec2(x, y); poR = size; poLoud = pc.a; poHue = pc.rgb / max(pc.a, 0.02); poRnd = h;
  return size < 0.004 ? -1.0 : halfWide - abs(y);
}
vec3 poStream(vec2 p) {
  float t = uTime;
  poH = 1.6; poSin = 0.8387; poCos = 0.5446; poFar = 0.4;
  float flow = uTime * 0.07 + uTravel * 0.03;
  if (ice > 0.0) flow *= 1.0 - ice;
  if (uOwn[4] != 0.0) { float k = abs(uOwn[4]), up = step(0.0, uOwn[4]), g = mix(0.995, mix(0.4, 1.5, up), k); poSin = sin(g); poCos = cos(g); poH = mix(1.6, mix(0.9, 1.9, up), k); poFar = mix(0.4, mix(0.8, 0.3, up), k); }
  vec3 ro = vec3(0.0, poH, 0.0);
  vec3 rd = normalize(vec3(p.x, p.y * poCos - poF * poSin, p.y * poSin + poF * poCos));
  vec3 rd0 = rd;
  rd.y = min(rd.y, -0.05);
  float dist = poH / -rd.y;
  vec2 w = (ro + rd * dist).xz;
  float aa = 1.6 * dist / uRes.y;
  vec3 L = normalize(vec3(-0.5, 0.45, 0.75));
  // the surface: ripples running with the stream, and the rings
  vec3 ring = poRing(w);
  vec2 wf = vec2(w.x - flow * 2.2, w.y);
  float e = 0.03;
  float h0 = noise(wf * vec2(2.2, 4.5)) + 0.5 * noise(wf * vec2(5.0, 11.0) + 3.0 + vec2(-flow, 0.0));
  float hx = noise((wf + vec2(e, 0.0)) * vec2(2.2, 4.5)) + 0.5 * noise((wf + vec2(e, 0.0)) * vec2(5.0, 11.0) + 3.0 + vec2(-flow, 0.0));
  float hz = noise((wf + vec2(0.0, e)) * vec2(2.2, 4.5)) + 0.5 * noise((wf + vec2(0.0, e)) * vec2(5.0, 11.0) + 3.0 + vec2(-flow, 0.0));
  vec2 slope = vec2(hx - h0, hz - h0) / e * (0.02 + 0.012 * uHigh) + ring.xy * 0.5;
  vec3 rain = vec3(0.0);
  if (wet > 0.0) { rain = poRain(w * 1.5) * wet; slope += rain.xy * 0.16; }
  if (ice > 0.0) slope = mix(slope, (vec2(noise(w * 3.0), noise(w * 3.0 + 7.0)) - 0.5) * 0.05, ice);
  vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
  // the bed, seen through the moving water
  float deep = 0.32;
  vec2 b = w + (rd.xz / -rd.y * 0.75 - slope * 1.3) * deep;
  vec3 bed = vec3(0.055, 0.05, 0.04) * (0.5 + noise(b * 40.0)) * (0.6 + 0.6 * noise(b * 9.0));
  if (pale > 0.0) bed = mix(bed, mix(vec3(0.4, 0.35, 0.27), uKind[2] * 0.5, 0.35) * (0.75 + 0.3 * noise(b * 60.0) + 0.22 * sin(b.y * 22.0 + 5.0 * noise(b * 1.8) + b.x * 3.0)), pale);
  if (dyed > 0.0) bed = mix(bed, uKind[2] * uKind[2] * 0.2 * (0.6 + 0.6 * noise(b * 9.0)), dyed * (1.0 - pale));
  if (ink > 0.0) bed = mix(bed, vec3(0.34, 0.33, 0.3), ink);
  bed = poStone(bed, b, 0.17, 5.0, poR2, L);
  bed = poStone(bed, b, 0.31, 2.0, poR1, L);
  bed = poStone(bed, b, 0.55, 9.0, mat2(0.9553, 0.2955, -0.2955, 0.9553), L);
  // light: the dancing net the ripples throw, the shade of branches overhead, and the piece's own colours lying on the bed
  float caust = poCaust(b * 5.0 - vec2(flow * 3.0, 0.0), t * 1.6);
  float branch = smoothstep(0.3, 0.7, noise(w * 0.9 + vec2(t * 0.015, 3.0)) * 0.7 + 0.3 * noise(w * 3.1 - vec2(t * 0.02, 0.0)));
  vec4 pc = piece(poUV(w));
  vec3 hue = pc.rgb / max(pc.a, 0.02);
  vec3 light = vec3(1.0, 0.86, 0.62) * mix(0.16, 1.0, branch) * (0.45 + 0.5 * uLevel) * (0.5 + 3.4 * caust * (0.3 + 0.7 * branch));
  light += hue * hue * pc.a * (1.2 + 3.0 * caust);
  // the shadows of the leaves floating over
  vec2 off = vec2(0.09, -0.07) + slope * 0.5;
  float shade = smoothstep(-0.05, 0.12, poCarried(w + off, 0.6, 1.0, flow));
  shade = max(shade, smoothstep(-0.05, 0.12, poCarried(w + off, 0.37, 4.0, flow * 1.25)));
  light *= 1.0 - 0.72 * shade;
  if (day > 0.0) light = mix(light, light * 0.8 + vec3(1.5, 1.48, 1.4), day);
  if (night > 0.0) light *= mix(vec3(1.0), vec3(0.3, 0.45, 0.75), night);
  if (ink > 0.0) light = mix(light, vec3(1.6 + 0.5 * uLevel) + hue * pc.a * 0.6, ink);
  if (bare > 0.0) {
    vec3 kc; float far = mix(1.0, 0.1, max(uOwn[4], 0.0));
    float sh = poCarp(b + vec2(-0.07, 0.1), 0.72, vec2(0.0, 1.0 * far), kc); bed *= 1.0 - 0.6 * sh * bare;
    float m = poCarp(b + slope * 0.1, 0.72, vec2(0.0, 1.0 * far), kc); bed = mix(bed, kc * 0.55, m * bare); light = mix(light, max(light, vec3(0.5 - 0.2 * night)), m * bare);
  }
  vec3 col = bed * light * vec3(0.8, 1.0, 0.9) + vec3(0.0, 0.012, 0.012);
  if (black > 0.0) col *= 1.0 - 0.9 * black;
  // what the surface itself gives back: a little sky, and the sun on the ripples
  float cosV = sat(dot(-rd, n));
  float fres = 0.02 + 0.98 * pow(1.0 - cosV, 5.0);
  vec3 refl = reflect(rd, n);
  if (black > 0.0) fres = mix(fres, 0.5 + 0.5 * fres, black);
  if (day > 0.0) fres = mix(fres, 0.12 + 0.88 * fres, day);
  col = mix(col, mix(vec3(0.01, 0.03, 0.02), vec3(0.1, 0.16, 0.22), branch), fres);
  if (black > 0.0 || uOwn[2] != 0.0 || uOwn[4] < 0.0) {
    vec3 r = refl; r.y = abs(r.y);
    vec3 mirrored = poSky(r);
    col = mix(col, mirrored, fres * max(max(black, abs(uOwn[2])), max(-uOwn[4], 0.0)));
  }
  if (wet > 0.0) col += vec3(0.4, 0.44, 0.48) * rain.z * 0.7;
  float sp = pow(sat(dot(refl, L)), 180.0);
  if (uOwn[2] != 0.0) sp *= 1.0 - 0.7 * abs(uOwn[2]);
  if (ice > 0.0) sp *= 1.0 - ice;
  col += vec3(1.0, 0.92, 0.8) * sp * (0.2 + 1.2 * uHigh) * (0.3 + 0.7 * branch);
  col += vec3(0.8, 0.9, 1.0) * max(ring.z, 0.0) * 0.15;
  // the leaves
  for (int k = 0; k < 2; k++) {
    float d = poCarried(w, k == 0 ? 0.6 : 0.37, k == 0 ? 1.0 : 4.0, k == 0 ? flow : flow * 1.25);
    float m = smoothstep(0.0, aa / max(poR, 0.001) * 1.5, d);
    float rib = smoothstep(0.03, 0.0, abs(poL.y)) + 0.5 * smoothstep(0.035, 0.0, abs(fract((poL.x - abs(poL.y) * 0.9) * 4.0 + 0.5) - 0.5) * 0.25);
    vec3 own = mix(vec3(0.6, 0.4, 0.05), vec3(0.6, 0.2, 0.04), smoothstep(0.2, 0.5, poRnd.x));
    own = mix(own, vec3(0.42, 0.07, 0.04), smoothstep(0.55, 0.7, poRnd.x));
    own = mix(own, vec3(0.17, 0.3, 0.05), smoothstep(0.8, 0.86, poRnd.x));
    own = mix(own, poHue * poHue * 0.9 + poHue * 0.25, sat(poLoud * 0.75));
    float cup = 0.75 + 0.9 * poL.y * sign(poRnd.y - 0.5) + 0.25 * poL.x;
    if (dyed > 0.0) own = mix(own, mix(uKind[1], uKind[3], poRnd.x) * (0.15 + 0.6 * mix(uKind[1], uKind[3], poRnd.x)), dyed * (1.0 - sat(poLoud)));
    vec3 leaf = own * cup * mix(0.35, 1.0, branch) * (1.0 - 0.5 * rib) * (0.7 + 0.5 * uLevel + 0.7 * poLoud) * (0.55 + 0.45 * smoothstep(0.0, 0.14, d));
    leaf += vec3(0.6, 0.65, 0.7) * 0.16 * branch * smoothstep(0.1, 0.0, abs(poL.y - 0.16 - 0.1 * poL.x)) * smoothstep(0.02, 0.1, d);
    if (day > 0.0) leaf *= 1.0 + 0.9 * day;
    if (night > 0.0) leaf *= mix(vec3(1.0), vec3(0.4, 0.55, 0.85), night);
    if (ink > 0.0) { leaf = mix(leaf, own * own * 0.2, ink); m *= mix(1.0, sat(smoothstep(0.07, 0.03, d) + 0.7 * rib + 0.1), ink); }
    col = mix(col, leaf, m);
  }
  if (ice > 0.0) {
    vec2 f = poIce(w * 1.8);
    vec3 c = mix(vec3(0.1, 0.17, 0.2), vec3(0.62, 0.7, 0.76), f.x * 0.85) * mix(1.0, 1.35, day) * mix(vec3(1.0), vec3(0.22, 0.32, 0.5), night);
    c = mix(c, mix(c, uKind[1] * 0.8 + 0.1, 0.35), 1.0 - f.x);
    col = mix(col, col * 0.8 * (1.0 - 0.85 * f.x) + c * (0.22 + 0.78 * f.x), ice * 0.92);
    col += (vec3(0.5, 0.6, 0.65) + uKind[3] * 0.3) * f.y * ice * (0.25 + 0.2 * uLevel + 2.5 * max(ring.z, 0.0)) * mix(1.0, 0.4, night);
  }
  if (uOwn[4] < 0.0) {
    vec3 r = rd0; r.y = max(r.y, 0.0);
    col = mix(col, poSky(r), smoothstep(-0.06, -0.045, rd0.y) * -uOwn[4]);
  }
  return col;
}
vec3 render(vec2 p) {
  day = max(uOwn[2], 0.0); night = max(-uOwn[2], 0.0); ice = max(uOwn[3], 0.0); wet = max(-uOwn[3], 0.0); pale = max(uOwn[5], 0.0); black = max(-uOwn[5], 0.0); dyed = max(uOwn[6], 0.0); ink = max(-uOwn[6], 0.0); bare = max(-uOwn[7], 0.0);
  poM = uOwn[0] == 0.0 ? 1.0 : exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.0 : 1.2));
  return screenOf(uVar < 0.5 ? poLilies(p) : poStream(p));
}
