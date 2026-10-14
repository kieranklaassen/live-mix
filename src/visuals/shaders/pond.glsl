// name: Pond
// a: Lilies
// b: Stream
// what: Still water seen from above at a slant, with lily leaves and flowers floating where the piece sounds, trees and sky mirrored between them and light moving on the shallow bottom; or a clear stream over round stones with leaves carried past on top.
// follows: The piece lies on the water (across is the loop, away from you is the room): leaves gather and flowers open where its strokes are, in their colours; a hit or a cue drops a ring that rocks the leaves and breaks the reflection; the high band puts glints on the ripples.
float poH, poSin, poCos; // the eye: how high over the water and how far tipped down
const float poF = 1.1;
float poFar; // how far out the rings fall
vec2 poDrift;
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
// The sky and the far bank as the water mirrors them.
vec3 poSky(vec3 r) {
  float el = r.y / max(length(r.xz), 0.001), az = atan(r.x, r.z);
  float toSun = exp(-pow((az + 0.4) * 1.2, 2.0));
  vec3 col = mix(vec3(0.75, 0.27, 0.1) * (0.25 + toSun) * (0.5 + 0.7 * uLevel), vec3(0.05, 0.065, 0.17), smoothstep(0.15, 0.8, el));
  col = mix(col, vec3(0.006, 0.014, 0.055), smoothstep(0.6, 2.4, el));
  float line = 0.24 + 0.3 * noise(vec2(az * 2.6 + 1.0, 0.5)) + 0.1 * noise(vec2(az * 9.0, 3.5));
  float leaves = noise(vec2(az * 40.0, el * 40.0));
  float tree = smoothstep(line, line - 0.06, el + 0.06 * leaves);
  vec3 wood = vec3(0.002, 0.007, 0.005) + vec3(1.0, 0.45, 0.14) * toSun * smoothstep(0.62, 0.9, leaves) * (0.25 + 0.7 * uLevel) * smoothstep(0.03, 0.15, el);
  return mix(col, wood, tree);
}
// One layer of floating leaves. Returns how far inside a leaf the place is (0 at its edge, 1 at its middle; below 0 outside).
vec2 poL; float poA, poR, poLoud, poWin; vec3 poHue; vec2 poRnd;
float poLeaf(vec2 w, float cell, float seed, mat2 turned, vec2 push) {
  w = turned * w; push = turned * push;
  vec2 g = (w + poDrift) / cell, id = floor(g);
  vec2 h = hash22(id + seed), gf = abs(fract(g) - 0.5);
  poWin = smoothstep(0.5, 0.25, max(gf.x, gf.y));
  vec2 c = (id + 0.5 + (h - 0.5) * 0.22) * cell - poDrift;
  vec4 pc = piece(poUV(c * turned));
  float loud = pc.a;
  float some = step(0.62, h.y) * (0.18 + 0.12 * h.x);
  float r = cell * max(some, 0.36 * smoothstep(0.02, 0.5, loud));
  vec2 l = w - c - push * (0.5 + h.x);
  float turn = h.x * 30.0 + 0.2 * poSin_(uTime * 0.11 + h.y * 20.0);
  float a = atan(l.y, l.x) - turn;
  a = mod(a + PI, TAU) - PI;
  float d = length(l);
  float rr = r * (1.0 + 0.035 * sin(a * 5.0 + h.x * 20.0));
  poL = l; poA = a; poR = rr; poLoud = loud; poHue = pc.rgb / max(pc.a, 0.02); poRnd = h;
  float notch = (abs(a) - 0.13) * d / max(rr, 0.001) * 2.5;
  return r < 0.01 ? -1.0 : min(1.0 - d / rr, notch + 0.03);
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
  vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
  float cosV = sat(dot(-rd, n));
  float fres = 0.04 + 0.96 * pow(1.0 - cosV, 2.2);
  vec3 refl = reflect(rd, n); refl.y = abs(refl.y);
  float above = step(-0.03, rd0.y); // past the far bank, when the view is pulled back
  vec3 sky = poSky(above > 0.5 ? vec3(rd0.x, max(rd0.y, 0.0), rd0.z) : refl);
  // the bottom, where it is shallow enough to see
  float deep = 0.2 + 0.3 * max(w.y - 1.0, 0.0);
  vec2 b = w + (rd.xz / -rd.y * 0.75 - slope * 3.0) * min(deep, 1.5) + poDrift;
  float sand = noise(b * 5.0) * 0.6 + noise(b * 17.0) * 0.4;
  float caust = poCaust(b * 2.2, t) * (0.35 + 0.9 * uLevel);
  vec3 bed = vec3(0.2, 0.13, 0.05) * (0.5 + 0.7 * sand) * (0.25 + 2.2 * caust);
  vec3 under = bed * exp(-deep * vec3(3.6, 1.9, 2.6)) + vec3(0.002, 0.012, 0.012) * (1.0 - exp(-deep * 0.9));
  // a fish passing under, a soft shadow
  vec2 fc = vec2(2.2 * sin(t * 0.06), 3.2 + 1.3 * sin(t * 0.045 + 1.0));
  vec2 fd = normalize(vec2(2.2 * 0.06 * cos(t * 0.06), 1.3 * 0.045 * cos(t * 0.045 + 1.0)));
  vec2 fl = vec2(dot(w - fc, fd), dot(w - fc, vec2(-fd.y, fd.x)));
  fl.y += 0.05 * sin(fl.x * 6.0 - t * 2.2) * smoothstep(0.2, -0.5, fl.x);
  float body = length(vec2(fl.x * 0.3, fl.y) / (0.11 * smoothstep(-0.62, 0.1, fl.x) * smoothstep(0.42, 0.1, fl.x) + 0.001));
  under *= 1.0 - 0.75 * smoothstep(1.3, 0.3, body);
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
  col += vec3(1.0, 0.62, 0.3) * sp * (0.35 + 1.3 * uHigh) * (0.5 + uLevel);
  col += vec3(0.9, 0.95, 1.0) * max(ring.z, 0.0) * 0.12;
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
    col = mix(col, leaf, m);
    // the flower: three rings of petals, each a little higher and smaller, round a gold heart
    float open = smoothstep(0.3, 0.75, poLoud);
    float rf = cell * 0.24 * open;
    vec2 rv = normalize(poRnd - 0.5 + 0.001);
    vec2 q = poL - poR * 0.25 * rv;
    vec3 deepHue = poHue * poHue * 1.3 + poHue * 0.2, pale = mix(vec3(1.0, 0.93, 0.88), poHue * 1.3, 0.35);
    float halo = exp(-length(q) / max(rf, 0.001) * 1.3) * open * poWin;
    col += deepHue * halo * 0.8 * poLoud;
    for (int j = 0; j < 3; j++) {
      float fj = float(j);
      vec2 qq = q - vec2(0.0, 0.17 * rf * fj);
      float rj = rf * (1.0 - 0.27 * fj), len = length(qq), fr = len / max(rj, 0.001);
      vec2 u = mat2(rv.x, -rv.y, rv.y, rv.x) * qq / max(len, 0.0001);
      float c4 = 1.0 - 8.0 * u.x * u.x * u.y * u.y, s4 = 4.0 * u.x * u.y * (u.x * u.x - u.y * u.y); // eight petals; every other ring turned half a petal
      float lobe = sqrt(abs(j == 1 ? s4 : c4));
      float edge = 0.38 + 0.62 * lobe * sqrt(lobe);
      float pm = smoothstep(edge, edge - aa * 1.5 / max(rj, 0.001), fr) * step(0.001, rf);
      vec3 petal = mix(deepHue, pale, sat(fr * 1.1 - 0.15 + 0.2 * fj)) * (0.4 + 0.6 * lobe) * (0.45 + 0.25 * fj + 0.7 * poLoud);
      col = mix(col, petal, pm);
    }
    col = mix(col, vec3(1.0, 0.6, 0.1) * (0.8 + 0.6 * poLoud), smoothstep(rf * 0.17, rf * 0.17 - aa * 1.5, length(q - vec2(0.0, 0.42 * rf))) * step(0.001, rf));
  }
  // lost in the dusk far out
  col *= 1.0 - 0.7 * smoothstep(8.0, 40.0, dist);
  return mix(col, sky, above);
}
// One layer of round stones on the bed of the stream. Lays its stone over col and returns the new colour.
vec3 poStone(vec3 col, vec2 b, float cell, float seed, mat2 turned, vec3 L) {
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
  vec3 stone = tone * (0.22 + 0.95 * sat(dot(nrm, L)) + 0.25 * nrm.z);
  col *= 1.0 - 0.7 * smoothstep(1.45, 0.95, d); // the dark round the foot of a stone
  return mix(col, stone, smoothstep(1.0, 0.94, d));
}
// One layer of leaves carried on the stream. Returns how far inside a leaf the place is; poL, poR, poHue, poLoud, poRnd describe it.
float poCarried(vec2 w, float cell, float seed, float flow) {
  vec2 g = (w - vec2(flow, 0.0)) / cell + seed, id = floor(g);
  vec2 h = hash22(id + seed);
  vec2 c = (id + 0.5 + (h - 0.5) * 0.4 - seed) * cell + vec2(flow, 0.0);
  vec4 pc = piece(poUV(c));
  float size = cell * (0.09 * step(0.7, h.y) + 0.2 * smoothstep(0.03, 0.5, pc.a));
  float turn = h.x * 20.0 + 0.3 * poSin_(uTime * 0.2 + h.y * 30.0) + uTime * 0.05 * (h.y - 0.5);
  vec2 v = normalize(vec2(poSin_(turn + 1.5708), poSin_(turn)));
  vec2 l = mat2(v.x, -v.y, v.y, v.x) * (w - c);
  float x = l.x / max(size, 0.001), y = l.y / max(size, 0.001);
  float in_ = sat(1.0 - x * x);
  float halfWide = 0.46 * sqrt(in_ * sqrt(in_)) * (1.0 + 0.35 * x);
  poL = vec2(x, y); poR = size; poLoud = pc.a; poHue = pc.rgb / max(pc.a, 0.02); poRnd = h;
  return size < 0.004 ? -1.0 : halfWide - abs(y);
}
vec3 poStream(vec2 p) {
  float t = uTime;
  poH = 1.6; poSin = 0.8387; poCos = 0.5446; poFar = 0.4;
  float flow = uTime * 0.07 + uTravel * 0.03;
  vec3 ro = vec3(0.0, poH, 0.0);
  vec3 rd = normalize(vec3(p.x, p.y * poCos - poF * poSin, p.y * poSin + poF * poCos));
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
  vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
  // the bed, seen through the moving water
  float deep = 0.32;
  vec2 b = w + (rd.xz / -rd.y * 0.75 - slope * 1.3) * deep;
  vec3 bed = vec3(0.055, 0.05, 0.04) * (0.5 + noise(b * 40.0)) * (0.6 + 0.6 * noise(b * 9.0));
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
  vec3 col = bed * light * vec3(0.8, 1.0, 0.9) + vec3(0.0, 0.012, 0.012);
  // what the surface itself gives back: a little sky, and the sun on the ripples
  float cosV = sat(dot(-rd, n));
  float fres = 0.02 + 0.98 * pow(1.0 - cosV, 5.0);
  vec3 refl = reflect(rd, n);
  col = mix(col, mix(vec3(0.01, 0.03, 0.02), vec3(0.1, 0.16, 0.22), branch), fres);
  float sp = pow(sat(dot(refl, L)), 180.0);
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
    vec3 leaf = own * cup * mix(0.35, 1.0, branch) * (1.0 - 0.5 * rib) * (0.7 + 0.5 * uLevel + 0.7 * poLoud) * (0.55 + 0.45 * smoothstep(0.0, 0.14, d));
    leaf += vec3(0.6, 0.65, 0.7) * 0.16 * branch * smoothstep(0.1, 0.0, abs(poL.y - 0.16 - 0.1 * poL.x)) * smoothstep(0.02, 0.1, d);
    col = mix(col, leaf, m);
  }
  return col;
}
vec3 render(vec2 p) {
  return screenOf(uVar < 0.5 ? poLilies(p) : poStream(p));
}
