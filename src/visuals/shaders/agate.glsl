// name: Agate
// a: Slice
// b: Landscape stone
// what: A polished slice of agate with a lamp behind it on a pale table: fine bands from smoke to honey to blue, small eyes by the dark rind, a hollow lined with violet crystals off the middle; or a slab that looks like a far country: banded hills, level water, a ringed pale sky, black mineral ferns and healed cracks.
// follows: The piece lies in the bands from rim to heart, as does the spectrum; the pass of the loop lights them going inward. A hit sparks one crystal and sends a ring out; a cue moves the lamp. In the slab the hills hold the piece, the ferns spread with the sounds, the spectrum is the rings of the sky, a hit runs up the cracks, a cue opens the sky.
// own: 0 1 many hair fine bands, -1 a few broad ones; 1 1 a round disc (b: steep peaks), -1 six small stones apart (b: a wide flat plain); 2 1 crystals fill the stone (b: water floods the hills), -1 no hollow (b: dry land); 3 1 ringed eyes all through it (b: many tall ferns), -1 level bands straight across (b: no ferns); 4 1 a black table (b: night, one moon), -1 a table in the colour of the drone (b: the slab goes on past the picture); 5 1 dyed in the colours of the sounds, -1 dull stone lit from in front (b: pale, worn out of its colour); 6 1 broken and mended with gold, -1 the bands folded and stirred; 7 1 the bands travel inward, -1 outward
// The wall of the stone: corners (x, y) and how tightly the bands are laid there.
const vec3 AG_V[17] = vec3[17](vec3(-0.69, -0.02, 0.62), vec3(-0.63, 0.17, 0.66), vec3(-0.45, 0.25, 0.8), vec3(-0.32, 0.37, 0.95), vec3(-0.1, 0.355, 1.05),
 vec3(0.1, 0.42, 1.2), vec3(0.28, 0.365, 1.35), vec3(0.46, 0.33, 1.4), vec3(0.61, 0.19, 1.35), vec3(0.68, 0.02, 1.2), vec3(0.6, -0.16, 1.15),
 vec3(0.4, -0.23, 1.1), vec3(0.29, -0.36, 0.95), vec3(0.06, -0.4, 0.85), vec3(-0.16, -0.345, 0.75), vec3(-0.36, -0.39, 0.7), vec3(-0.58, -0.25, 0.6));
// Three places in the hollow where a hit sparks.
const vec2 AG_S0 = vec2(0.139, -0.014), AG_S1 = vec2(0.305, 0.153), AG_S2 = vec2(-0.11, 0.042);
float agPx, agSeam;
// A smooth step that may run either way.
float agS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float agUp(float x) { return max(x, 0.0); }
// Six small stones: where each lies and how wide it is.
const vec3 AG_P[6] = vec3[6](vec3(-0.5, 0.16, 0.22), vec3(-0.04, 0.2, 0.17), vec3(0.42, 0.17, 0.25), vec3(-0.28, -0.22, 0.16), vec3(0.13, -0.2, 0.2), vec3(0.6, -0.26, 0.13));
// The breaks of a stone that fell: moves each piece a little, and says how far off a break is.
vec2 agBreak(vec2 p) {
 vec2 g = p * 2.3 + 0.12 * vec2(noise(p * 5.0), noise(p * 5.0 + 9.0)), id = floor(g), f = fract(g), own = vec2(0.0), was = own;
 float one = 9.0, two = 9.0;
 for (int k = 0; k < 9; k++) {
  vec2 o = vec2(k % 3, k / 3) - 1.0, r = o + 0.1 + 0.8 * hash22(id + o + 71.0) - f;
  float d = dot(r, r);
  if (d < one) { two = one; one = d; own = id + o; } else two = min(two, d);
 }
 agSeam = (sqrt(two) - sqrt(one)) / 2.3;
 return p + (hash22(own + 8.0) - 0.5) * 0.05 * uOwn[6];
}
vec3 agMend(vec3 c, vec2 p) {
 if (uOwn[6] <= 0.0) return c;
 float g = 0.5 + 0.9 * noise(p * 26.0);
 return mix(c, vec3(1.25, 0.8, 0.3) * g + (uKind[4] + 0.4) * uHits, (1.0 - agS(0.008 * uOwn[6], 0.008 * uOwn[6] + agPx * 2.0, agSeam)) * min(uOwn[6] * 3.0, 1.0));
}
// Small round growths on the wall, each with rings of its own.
const vec3 AG_E[5] = vec3[5](vec3(-0.4, -0.29, 0.9), vec3(0.2, 0.31, 1.5), vec3(0.47, -0.135, 1.5), vec3(-0.16, 0.285, 1.3), vec3(-0.54, 0.12, 0.95));
// x: how deep a place lies, as the bands count it (below 0 outside). y: the way along the wall.
vec2 agWall(vec2 p, bool eyes) {
 float best = 9.0, along = 0.0, run = 0.0, inside = -1.0;
 vec3 b = AG_V[16];
 for (int i = 0; i < 17; i++) {
  vec3 a = AG_V[i];
  vec2 e = b.xy - a.xy, w = p - a.xy;
  float l = length(e), h = sat(dot(w, e) / (l * l));
  float d = length(w - e * h) * mix(a.z, b.z, h);
  if (d < best) { best = d; along = run + (1.0 - h) * l; }
  if ((a.y > p.y) != (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = -inside;
  run += l;
  b = a;
 }
 if (uOwn[1] > 0.0) {
  best = mix(best * inside, (0.4 - length(p)) * 0.95, uOwn[1]);
  along = mix(along, 0.4 * atan(p.y, p.x - 1e-5), uOwn[1]);
  inside = sign(best); best = abs(best);
 }
 if (uOwn[1] < 0.0) {
  float most = -9.0;
  for (int i = 0; i < 6; i++) most = max(most, (1.0 - length((p - AG_P[i].xy) * vec2(1.0, 1.0 + 0.25 * sin(float(i) * 2.0))) / AG_P[i].z) * 0.37);
  best = mix(best * inside, most, -uOwn[1]);
  inside = sign(best); best = abs(best);
 }
 if (eyes && uOwn[3] > 0.0 && inside > 0.0) {
  vec2 g = p * 5.2, id = floor(g);
  float e = 9.0;
  for (int k = 0; k < 9; k++) {
   vec2 c = id + vec2(k % 3, k / 3) - 1.0, h = hash22(c + 13.0);
   e = min(e, length(c + 0.2 + 0.6 * h - g) * (0.75 + 0.9 * h.y * h.x) / 5.2);
  }
  best = mix(best, min(best, 0.05 + e * 2.1), uOwn[3]);
 }
 if (eyes && inside > 0.0) for (int i = 0; i < 5; i++) best = min(best, 0.4 * abs(uOwn[1]) + 0.016 + length(p - AG_E[i].xy) * AG_E[i].z);
 return vec2(best * inside, along);
}
vec2 agTwo(vec2 q) { return vec2(noise(q), noise(q + 31.0)) - 0.5; }
vec2 agSway(vec2 p) {
 return p + 0.018 * vec2(sin(p.y * 9.0 + 1.0) + 0.6 * sin(p.y * 21.0 + p.x * 7.0), sin(p.x * 8.0 + 2.0) + 0.7 * sin(p.x * 17.0 - p.y * 6.0));
}
vec2 agWarp(vec2 p) {
 return agSway(p) + 0.024 * agTwo(p * 15.0) + 0.008 * agTwo(p * 41.0);
}
// One set of bands, each of its own tone: x the tone, y a thin line where two bands meet. w is the width of a pixel.
vec2 agLay(float x, float w, float seed) {
 float i = floor(x + 0.5), f = x - i;
 float a = hash11(i - 1.0 + seed), b = hash11(i + seed);
 float tone = mix(a, b, agS(-w, w, f));
 float r = hash11(i * 1.7 + seed + 3.0), hw = 0.03 + 0.16 * r * r;
 float line = step(0.5, r) * (1.0 - agS(hw - w * 0.6, hw + w * 0.6, abs(f))) * min(1.0, hw * 2.0 / w);
 float gone = agS(0.4, 1.0, w);
 return vec2(mix(tone, 0.5, gone), mix(line, 0.12, gone));
}
// What the stone lets through, from the rim to the heart: smoke, honey, blue.
vec3 agThrough(float t) {
 vec3 c = mix(vec3(0.05, 0.035, 0.028), vec3(0.17, 0.12, 0.095), agS(0.02, 0.1, t));
 c = mix(c, vec3(0.34, 0.15, 0.055), agS(0.14, 0.26, t));
 c = mix(c, vec3(1.0, 0.39, 0.065), agS(0.24, 0.36, t));
 c = mix(c, vec3(1.0, 0.68, 0.33), agS(0.4, 0.5, t));
 c = mix(c, vec3(0.5, 0.63, 0.75), agS(0.5, 0.56, t));
 c = mix(c, vec3(0.12, 0.25, 0.5), agS(0.58, 0.7, t));
 return mix(c, vec3(0.72, 0.82, 0.95), agS(0.72, 0.8, t));
}
// The crystals in the hollow: x the tone of a face, y its ribs, z how far in from the edge, w its number; at is the way to its middle.
vec4 agCrystals(vec2 p, vec2 lamp, out vec2 at) {
 const float size = 0.033;
 vec2 g = p / size, id = floor(g), f = fract(g), ids = vec2(0.0);
 float one = 9.0, two = 9.0;
 at = vec2(0.0);
 for (int k = 0; k < 9; k++) {
  vec2 o = vec2(k % 3, k / 3) - 1.0;
  vec2 r = o + 0.1 + 0.8 * hash22(id + o + 40.0) - f;
  float d = dot(r, r);
  if (d < one) { two = one; one = d; at = r; ids = id + o; } else two = min(two, d);
 }
 float edge = sqrt(two) - sqrt(one);
 vec2 h = hash22(ids + 5.0);
 // a six sided point seen nearly end on
 vec2 v = -at + (h - 0.5) * 0.55;
 at *= size;
 float turn = h.x * TAU, a = (atan(v.y + 1e-5, v.x) - turn) / TAU * 6.0;
 float face = floor(a), fa = fract(a), wa = agPx / size / (length(v) + 0.02);
 a = (face + 0.5) / 6.0 * TAU + turn;
 float lit = 0.5 + 0.5 * dot(vec2(cos(a), sin(a)), normalize(lamp - p + 1e-4));
 float own = hash11(mod(face + 12.0, 6.0) + h.y * 50.0);
 float tone = (0.08 + 0.92 * lit * lit * lit) * (0.3 + 0.9 * own);
 float rib = agS(0.05 + wa, 0.0, min(fa, 1.0 - fa)) * agS(0.05, 0.3, length(v));
 return vec4(tone, rib, edge, h.y);
}
vec3 agSlice(vec2 p) {
 float shape = uRes.x / uRes.y, fit = min(1.0, (shape < 1.0 ? shape * 1.75 : shape) / 1.56);
 agPx = 1.0 / (uRes.y * fit);
 if (shape < 1.0) p = vec2(p.y, -p.x);
 p /= fit;
 vec2 whole = p;
 if (uOwn[6] > 0.0) p = agBreak(p);
 vec2 wall = agWall(agWarp(p), true);
 float d = wall.x, s = wall.y, fw = max(fwidth(d), 1e-5);
 float c = uCue, go = 0.5 + uEnergy;
 vec2 lamp = vec2(0.03 + 0.3 * sin(uTime * 0.021), 0.03 + 0.14 * cos(uTime * 0.027)) + c * (1.0 - c) * vec2(-0.9, 0.4);
 float ll = dot(p - lamp, p - lamp), lampHere = exp(-ll / (0.1 + 0.14 * uSpace));
 // the pale table, a soft shadow, and light fallen through the stone
 vec3 col = vec3(1.75, 1.6, 1.38) * (0.36 + 0.5 * exp(-ll * 1.1) + 0.22 * agS(0.9, -0.9, dot(p, vec2(0.8, -0.6)))) * (0.965 + 0.07 * noise(p * 230.0) * noise(p * 70.0));
 if (uOwn[6] > 0.0) fw = min(fw, agPx * 4.0);
 if (uOwn[4] > 0.0) col = mix(col, vec3(0.03, 0.028, 0.03) * (0.5 + exp(-ll * 2.0)), uOwn[4]);
 if (uOwn[4] < 0.0) col = mix(col, (uKind[0] * uKind[0] * 1.1 + 0.02) * col * (0.65 + 0.5 * noise(vec2(p.x * 4.0 + p.y, p.y * 90.0 + 4.0 * noise(p * 3.0)))), -uOwn[4]);
 if (d < fw) {
  vec2 far = whole * vec2(1.16, 1.75);
  float sd = dot(far, far) < 1.0 ? agWall(agSway(whole + vec2(-0.075, 0.075)), false).x : -1.0;
  col *= mix(vec3(1), mix(vec3(0.36, 0.26, 0.21), vec3(1.5, 0.72, 0.24), agS(0.015, 0.1, sd)), agS(-0.06, 0.08, sd) * 0.8);
  col *= 1.0 - 0.5 * exp(min(d, 0.0) / 0.01);
  if (uOwn[4] > 0.0) col += uOwn[4] * vec3(0.5, 0.2, 0.06) * (0.3 + 0.5 * uLevel) * exp(min(d, 0.0) / 0.06) * 0.5;
  if (d < -fw) return col;
 }
 // the bands: broad, narrow and hair lines
 float t = d / 0.36, t0 = t;
 if (uOwn[3] < 0.0) t = mix(t, 0.46 + p.y * 1.2 + 0.1 * noise(p * vec2(1.6, 4.0)), -uOwn[3]);
 if (uOwn[6] < 0.0) t -= uOwn[6] * (0.42 * (noise(p * 2.7 + 9.0) - 0.5) + 0.16 * (noise(p * 6.5 + 3.0) - 0.5));
 float wander = noise(p * 3.1 + 4.0), crease = noise(p * 8.0 + 17.0);
 float x = t + 0.012 * sin(t * 41.0 + 1.0) + 0.0035 * sin(t * 97.0) + uLow * 0.006 * sin(t * 24.0) + uTime * 0.008 * uOwn[7];
 float w = fw / 0.36, many = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.1 : 2.2));
 if (uOwn[3] < 0.0 || uOwn[6] < 0.0) w = clamp(fwidth(t), w * 0.3, 0.1);
 w *= many; x *= many;
 vec2 A = agLay(x * 15.0, w * 15.0, 2.0), B = agLay(x * 44.0, w * 44.0, 20.0), C = agLay(x * 120.0, w * 120.0, 61.0);
 float fine = agS(0.3, 0.6, A.x) * agS(0.15, 0.45, wander);
 w /= many;
 float dye = t + 0.1 * (A.x - 0.5) + 0.06 * (B.x - 0.5);
 vec3 through = agThrough(dye);
 if (uOwn[5] > 0.0) { vec3 k = kindColour(clamp(dye * 4.6 - 0.5, 0.0, 3.0)); through = mix(through, k * k * 1.25 + 0.01, uOwn[5]); }
 through *= 0.4 + 0.85 * B.x;
 through *= mix(1.0, 0.35 + 1.2 * C.x, (0.35 + 0.65 * fine) * (0.3 + 0.7 * uTone));
 float fog = 0.6 * noise(p * 9.0 + 3.0) + 0.4 * noise(p * 23.0 + 3.0), fibre = noise(vec2(s * 170.0, t * 12.0));
 through *= (0.72 + 0.56 * fog) * (0.88 + 0.24 * fibre);
 through = pow(max(through, 0.0), vec3(1.45)) * 1.15;
 // what is heard: the spectrum, the piece, the pass of the loop, the ring of a hit
 vec4 pc = piece(vec2(sat(t * 1.15), 0.5 - p.y * 1.15));
 vec3 hue = pc.rgb / max(pc.a, 0.05);
 float turn = (t * 1.15 - uLoop) / 0.035;
 float pass = exp(-turn * turn) * agS(0.0, 0.06, uLoop) * agS(1.0, 0.94, uLoop);
 float wave = (t - 0.72 + 0.72 * (1.0 - uHits)) / 0.05, ring = exp(-wave * wave) * uHits;
 float gain = go * (0.55 * band(t * 1.2) + 0.4 * pc.a + 2.2 * pass + 2.2 * ring);
 vec3 light = vec3(1.6, 1.36, 1.1) * (0.75 + 0.2 * uLevel + 0.35 * c) * (0.36 + 1.5 * lampHere) * (1.0 + gain);
 vec3 tint = mix(vec3(1), hue * hue * 1.9 + hue * 0.2, sat(pc.a) * 0.75);
 vec3 zone = uDrone * uKind[0] * uKind[0] * agS(0.3, 0.14, t) + uPad * uKind[1] * uKind[1] * agS(0.2, 0.3, t) * agS(0.54, 0.44, t) + uTexture * uKind[2] * uKind[2] * agS(0.48, 0.6, t);
 vec3 stone = through * light * tint + zone * 0.4 * go * B.x * (0.5 + 1.2 * C.x) * (0.4 + lampHere);
 stone = stone * (1.0 + stone * 0.1) / (1.0 + stone * 0.22);
 if (uOwn[5] < 0.0) stone = mix(stone, pow(through, vec3(0.75)) * tint * (0.55 + 0.35 * agS(0.9, -0.9, dot(p, vec2(0.8, -0.6)))) * (1.0 + 0.6 * gain) * (0.8 + 0.5 * uLevel) + 0.05, -uOwn[5]);
 float white = sat(A.y + B.y * 0.8 * agS(0.35, 0.7, crease) + C.y * 0.5 * fine);
 white *= agS(0.07, 0.13, t) * (0.6 + 0.4 * noise(vec2(s * 14.0, t * 9.0)));
 vec3 milk = vec3(1.4, 1.26, 1.06) * (0.5 + 0.8 * lampHere) * (1.0 + 0.3 * gain) * mix(vec3(1), hue, 0.3 * sat(pc.a));
 stone = mix(stone, milk, white * 0.85);
 // the rind
 float h = t0 + 0.52 * agUp(uOwn[2]) - 0.8 * agUp(-uOwn[2]);
 float rind = agS(0.055, 0.02, t0 + 0.03 * (noise(p * 60.0) - 0.5));
 stone = mix(stone, vec3(0.1, 0.06, 0.036) * (0.25 + 1.5 * noise(p * 130.0) * noise(p * 50.0)), rind);
 // the crystal a hit lights, one of three in turn
 vec3 turns = max(cos(uTime * 0.11 + vec3(0.0, 2.094, 4.189)), 0.0);
 // the hollow: milk quartz, then crystals
 if (h > 0.6) {
  vec2 at;
  vec4 cr = agCrystals(p, lamp, at);
  at += p;
  vec3 hot = turns * exp(-vec3(dot(at - AG_S0, at - AG_S0), dot(at - AG_S1, at - AG_S1), dot(at - AG_S2, at - AG_S2)) / 0.0003);
  float tc = h + 0.075 * min(cr.z, 0.35) + 0.04 * (cr.w - 0.5), deep = agS(0.78, mix(0.96, 1.4, agUp(uOwn[2])), h);
  vec3 glass = mix(vec3(0.62, 0.57, 0.7), vec3(0.15, 0.055, 0.23), deep);
  if (uOwn[5] > 0.0) glass = mix(glass, uKind[3] * uKind[3] * mix(0.9, 0.3, deep) + 0.02, uOwn[5]);
  vec3 hc = glass * (mix(0.3, 0.1, deep) + 1.5 * cr.x) * (0.3 + 1.2 * lampHere) * (0.8 + 0.3 * uLevel);
  hc += vec3(1.0, 0.95, 0.9) * cr.y * (0.06 + 0.5 * cr.x) * (1.0 - 0.5 * deep);
  hc *= 0.3 + 0.7 * agS(0.0, 0.1, cr.z);
  hc += glass * vec3(1.0, 0.6, 0.3) * 0.35 * lampHere * agS(0.1, 0.5, cr.z) * (1.0 - deep);
  hc *= mix(vec3(1), 0.5 + uKind[3] * 1.4, 0.45 * uPhrase);
  hc += uKind[3] * uKind[3] * uPhrase * go * 0.5 * cr.x * cr.x;
  hc += uMic * vec3(0.5, 0.26, 0.1) * deep * (0.3 + cr.x);
  hc += (uKind[4] * uKind[4] + 0.7) * uHits * (hot.x + hot.y + hot.z) * (3.0 + 3.0 * cr.x);
  float grow = noise(vec2(s * 90.0, t * 5.0)) * 0.6 + noise(vec2(s * 260.0, t * 9.0)) * 0.4;
  vec3 quartz = vec3(0.9, 0.93, 1.0) * (0.3 + 0.75 * lampHere) * (0.45 + 0.9 * grow) * (1.0 + 0.8 * uKeys);
  stone = mix(stone, quartz, agS(0.69, 0.71, h) * 0.8);
  stone = mix(stone * (1.0 - 0.45 * agS(0.75, 0.785, tc)), hc, agS(0.785 - w, 0.785 + w, tc));
 }
 vec3 halo = turns * exp(-vec3(length(p - AG_S0), length(p - AG_S1), length(p - AG_S2)) / 0.035);
 stone += (uKind[4] * uKind[4] * 0.8 + vec3(0.4, 0.36, 0.3)) * uHits * go * (halo.x + halo.y + halo.z);
 stone = agMend(stone, p);
 return mix(col, stone, agS(-fw, fw, d));
}
// A tuft of mineral ferns, rooted at 0 and one high.
float agFern(vec2 q, float seed, float w, float grow) {
 if (q.y < -0.1 || dot(q, q) > 1.2) return 0.0;
 q += 0.03 * q.y * sin(q.yx * vec2(6.0, 5.0) + seed) + 0.005 * sin(q.yx * vec2(37.0, 33.0) + seed);
 // the fronds, side by side like a hand
 float fan = atan(q.x, q.y + 0.04) + 0.3 * (hash11(seed) - 0.5), part = clamp(floor(fan / 0.36 + 0.5), -3.0, 3.0);
 q = rot(-part * 0.36) * (q + vec2(0.0, 0.04));
 float hs = hash11(part + seed);
 float u = q.y, v = q.x - 0.05 * sin(q.y * 4.0 + hs * 9.0) * q.y, L = (1.02 - 0.12 * abs(part) - 0.42 * hs * step(0.5, abs(part))) * grow, stp = 0.052, wide = 0.0058, cov = 0.0, last = 0.0;
 seed += part * 5.0;
 for (int k = 0; k < 4; k++) {
  float th = wide * (1.0 - 0.5 * sat(u / max(L, 0.001))) * (1.0 + 0.3 * sin(u * 90.0 + seed));
  if (k == 0) th *= 0.8 + 1.1 * (1.0 - sat(u * 1.2));
  float off = length(vec2(v, max(u - L, 0.0) + max(-u, 0.0))) - th;
  cov = max(cov, (1.0 - agS(-w, w, off)) * min(1.0, th * 1.6 / w + 0.3));
  // on to its side shoots
  float side = step(0.0, v), a = abs(v), g = (u - a * 0.85) / stp + 0.5 * side, i = floor(g);
  float at = (i + 0.5 - 0.5 * side) * stp, r = hash11(i + 13.0 * side + seed + float(k) * 31.0), room = k == 0 ? 0.3 * at + 0.01 : last;
  last = stp * 0.98;
  u = a / 0.76; v = (fract(g) - 0.5) * stp * 0.76;
  L = at > (k == 0 ? 0.08 : 0.0) && at < L ? min((L - at) * (0.25 + 0.45 * r), room * (0.7 + 0.3 * r)) : -1.0;
  if (L < 0.0) break;
  seed += i * 3.7 + side * 17.0;
  stp *= 0.5; wide *= 0.82;
 }
 return cov;
}
float agRidge(float x, float k) {
 float peak = 0.0;
 if (uOwn[1] > 0.0) peak = uOwn[1] * (0.3 * abs(noise(vec2(x * 3.1 + k * 4.3, k + 20.0)) * 2.0 - 1.0) * (1.0 - 0.25 * k) + 0.12 * (0.5 - abs(noise(vec2(x * 7.0 + k, k + 30.0)) - 0.5)));
 return peak - 0.17 * agUp(-uOwn[1]) + (1.0 - 0.85 * agUp(-uOwn[1])) * ((noise(vec2(x * 2.3 + k * 9.1, k)) - 0.5) * 0.2 + (noise(vec2(x * 6.0 + k * 5.0, k + 3.0)) - 0.5) * 0.07 + (noise(vec2(x * 24.0, k + 8.0)) - 0.5) * 0.016);
}
// The low bank the ferns stand on.
float agBank(float x) { return -0.335 + 0.07 * (noise(vec2(x * 2.2, 4.0)) - 0.5) + 0.02 * (noise(vec2(x * 11.0, 7.0)) - 0.5); }
// Beds of stone laid one on another, thick and thin: x how dark or pale, y the hair lines of white.
vec2 agBeds(float x, float seed) {
 float u = x + 0.012 * sin(x * 46.0 + seed) + 0.0035 * sin(x * 103.0), w = agPx * 1.3, m = exp2(1.5 * uOwn[0]);
 u = (u + uTime * 0.005 * uOwn[7]) * m; w *= m;
 vec2 a = agLay(u * 22.0, 22.0 * w, seed), b = agLay(u * 63.0, 63.0 * w, seed + 8.0), c = agLay(u * 170.0, 170.0 * w, seed + 3.0);
 return vec2((0.35 + 0.9 * a.x) * (0.55 + 0.7 * b.x) * (0.75 + 0.5 * c.x), sat(a.y * 0.8 + b.y * 0.6 + c.y * 0.4));
}
vec3 agCountry(vec2 p) {
 agPx = 1.0 / uRes.y;
 float shape = uRes.x / uRes.y, near = clamp(shape / 1.7, 0.36, 1.1), c = uCue, go = 0.5 + uEnergy;
 // the plate: sawn on two sides, broken on two
 vec2 he = vec2(0.5 * shape, 0.5) - 0.035 + 0.5 * agUp(-uOwn[4]);
 float night = agUp(uOwn[4]), dyed = agUp(uOwn[5]), worn = agUp(-uOwn[5]);
 if (uOwn[6] > 0.0) p = agBreak(p);
 float crumb = noise(p * 60.0), broken = 0.016 * noise(p * 7.0 + 2.0) + 0.012 * noise(p * 23.0) + 0.006 * crumb;
 float box = max(max(-he.x - p.x + 0.008 * p.y, p.x - he.x + broken), max(-he.y - p.y - 0.006 * p.x, p.y - he.y + broken));
 float lampX = 0.5 * sin(uTime * 0.017), across = p.x - (uLoop - 0.5) * 2.1 * he.x;
 float lamp = exp(-(p.x - lampX) * (p.x - lampX) * 1.2 - p.y * p.y * 1.5);
 vec3 ground = vec3(1.4, 1.31, 1.18) * (0.75 + 0.25 * lamp) * (1.0 - 0.5 * exp(-max(box, 0.0) / 0.009));
 ground = mix(ground, vec3(0.03, 0.028, 0.032), night);
 if (box > agPx) return ground;
 // old cracks that slipped and healed
 vec2 q = p;
 float vein = 0.0, run = 0.0, n4 = noise(p * 4.0) - 0.5, n9 = noise(p * 9.0), n19 = noise(p * 19.0) - 0.5;
 for (int k = 0; k < 3; k++) {
  vec2 n = k == 0 ? vec2(0.913, -0.408) : k == 1 ? vec2(0.929, 0.37) : vec2(0.978, -0.209);
  float sd = dot(p, n) - (k == 0 ? 0.17 * near : k == 1 ? -0.62 * max(near, 0.6) : 0.62 * near) + (k == 1 ? -0.03 : 0.03) * n4 + 0.01 * n19;
  if (sd > 0.0) q += vec2(-n.y, n.x) * (k == 1 ? -0.014 : 0.022);
  vein = max(vein, agS(agPx * 1.2, 0.0, abs(sd) - 0.0025 * max(n9 - 0.4, 0.0)));
  if (uHits < 0.004) continue;
  float y = (p.y - 0.58 + uHits) / 0.16;
  run = max(run, (k == 0 ? 1.4 : 0.3) * (exp(-abs(sd) / 0.035) * 0.4 + exp(-abs(sd) / 0.003)) * exp(-y * y));
 }
 vein *= 0.3 + 0.7 * n9;
 vec2 soft = 0.05 * agTwo(q * 4.0) + 0.012 * (noise(q * 16.0) - 0.5);
 float grain = noise(rot(0.6) * q * 330.0);
 float mist = noise(rot(0.7) * q * 5.0 + 2.0) * 0.5 + noise(rot(1.8) * q * 12.0) * 0.3 + soft.y * 4.0, cloud = noise(vec2(q.x * 2.0, q.y * 6.0) + 11.0) * 0.55 + noise(vec2(q.x * 4.6, q.y * 13.0) + 5.0) * 0.4;
 if (uOwn[6] < 0.0) soft -= uOwn[6] * (0.3 * agTwo(q * 2.6 + 5.0) + 0.12 * agTwo(q * 6.0));
 float bloom = agS(0.35, 0.65, noise(q * 6.0 + 8.0)), fade = agS(0.0, 0.1, uLoop) * agS(1.0, 0.9, uLoop);
 // a slow lamp behind, and the place now playing going across
 float lit = 0.85 + 0.3 * lamp + (0.12 + 0.5 * uLevel) * go * fade * exp(-across * across * 26.0);
 float mapX = p.x / (2.0 * he.x) + 0.5, sunX = 0.2 * near;
 float sl = length((q + soft - vec2(sunX, 0.13)) * vec2(1.0, 1.15));
 // the sky: clear stone with rings, the spectrum going out in them
 vec3 sky = mix(vec3(1.4, 1.02, 0.62), vec3(0.5, 0.6, 0.68), agS(-0.04, 0.34, q.y + 0.2 * (cloud - 0.4))) * (0.7 + 0.6 * cloud);
 if (dyed > 0.0) sky = mix(sky, mix(uKind[3] * uKind[3], uKind[1] * uKind[1], agS(-0.04, 0.34, q.y + 0.2 * (cloud - 0.4))) * (0.9 + 0.8 * cloud), dyed);
 float bd = agBank(q.x) - q.y, wy = -0.185 + 0.25 * agUp(uOwn[2]) - 0.5 * agUp(-uOwn[2]) - q.y + 0.016 * noise(vec2(q.x * 3.0, 3.0)) + 0.004 * noise(vec2(q.x * 21.0, 3.0));
 vec3 rs = wy > agPx ? vec3(-9) : vec3(0.1 + agRidge(q.x, 0.0) * 1.05, 0.005 + agRidge(q.x, 1.0) * 0.85, -0.09 + agRidge(q.x, 2.0) * 0.65) - q.y;
 vec3 col = sky;
 if (wy < agPx && max(rs.x, max(rs.y, rs.z)) < agPx) {
  vec2 rg = agBeds(sl * 0.9 + 0.03 * cloud, 5.0);
  float ring = band(sl * 1.5);
  col *= 0.84 + 0.2 * rg.x + 0.14 * go * ring * rg.x;
  col = mix(col, vec3(1.4, 1.2, 0.95), rg.y * (0.12 + 0.22 * go * ring));
  float by = exp(-sl * sl * mix(44.0, 20.0, uSpace));
  col += (vec3(1.0, 0.7, 0.38) * (0.3 + 0.4 * uLevel + 0.6 * c) + vec3(0.7, 0.3, 0.1) * uMic) * by;
  col += uKeys * vec3(0.8, 0.6, 0.35) * rg.y * agS(0.5, 0.1, sl);
  float swell = (sl - 0.75 * (1.0 - c)) / 0.07;
  col += c * vec3(0.5, 0.32, 0.16) * exp(-swell * swell);
 }
 // three ranges of hills
 for (int k = 0; k < 3; k++) {
  float fk = float(k), dd = rs[k], next = k < 2 ? rs[k + 1] : wy;
  if (dd < -agPx || max(next, wy) > agPx) continue;
  vec3 body = k == 0 ? vec3(0.42, 0.4, 0.4) : k == 1 ? vec3(0.8, 0.4, 0.14) : vec3(0.52, 0.17, 0.05);
  if (dyed > 0.0) { vec3 kc = mix(uKind[2], uKind[0], 0.5 * fk); body = mix(body, kc * kc * (1.1 - 0.2 * fk), dyed); }
  vec2 bed = agBeds(dd + soft.x * 0.5 + soft.y, fk * 17.0 + 2.0);
  vec4 pc = piece(vec2(mapX, (fk + 0.6) / 4.2));
  vec3 hc = body * mix(0.6, bed.x, 0.7 + 0.3 * uTone) * (0.35 + 1.3 * mist);
  hc = mix(hc, sky * vec3(0.95, 0.8, 0.6), agS(0.0, 0.2, dd + 0.4 * (mist - 0.5)) * (0.5 + 0.4 * uSpace - 0.2 * fk));
  hc = mix(hc, vec3(1.2, 1.0, 0.78), bed.y * 0.4 * bloom);
  hc = hc * mix(vec3(1), 0.4 + pc.rgb / max(pc.a, 0.05), 0.5 * sat(pc.a)) + pc.rgb * pc.rgb * go * 0.4 * bed.x * (0.4 + mist);
  hc = mix(hc, vec3(0.08, 0.035, 0.018), 0.8 * agS(0.01, 0.0, dd + 0.012 * (grain - 0.5)) * agS(0.2, 0.7, noise(q * 12.0)) * (0.3 + 0.35 * fk));
  col = mix(col, hc, agS(-agPx, agPx, dd));
 }
 // level water: clear stone laid down flat
 if (wy > -agPx && bd < agPx) {
  vec2 lv = agBeds(wy, 33.0);
  float under = (q.x + soft.x - sunX) * 3.0;
  vec3 water = mix(vec3(0.16, 0.26, 0.33), mix(vec3(0.6, 0.62, 0.6), vec3(1.5, 1.1, 0.66) * (1.0 + 0.4 * c), exp(-under * under)), sat(lv.x * 1.2 - 0.2)) * (0.7 + 0.5 * cloud);
  if (dyed > 0.0) water = mix(water, mix(uKind[0] * uKind[0] * 0.6, sky, 0.35 + 0.5 * exp(-under * under)) * (0.5 + 0.8 * lv.x), dyed);
  water = mix(water, mix(vec3(0.42, 0.17, 0.06), uKind[2] * uKind[2] * 0.6, dyed), exp(-max(wy - 0.04 * (bloom - 0.3), 0.0) / 0.03) * 0.7);
  water = mix(water, vec3(1.2, 1.1, 0.95), lv.y * (0.2 + 0.4 * uHigh) * agS(0.01, 0.03, wy));
  col = mix(col, water, agS(-agPx, agPx, wy));
 }
 // the near bank
 if (bd > -agPx) {
  vec2 bl = agBeds(bd + soft.x * 0.7 + soft.y * 0.6, 71.0);
  vec4 pn = piece(vec2(mapX, 0.85));
  vec3 bank = mix(vec3(0.07, 0.035, 0.022), vec3(0.34, 0.1, 0.03), agS(0.0, 0.14, bd + 0.2 * (mist - 0.5))) * mix(vec3(1.0), uKind[0] * uKind[0] * vec3(2.0, 5.0, 12.0), dyed * 0.7) * bl.x * (0.35 + 1.3 * mist);
  bank = mix(bank, vec3(1.0, 0.8, 0.58), bl.y * 0.35 * bloom);
  bank += pn.rgb * pn.rgb * go * 0.26 * bl.x * bl.x;
  col = mix(col, bank, agS(-agPx, agPx, bd));
 }
 col *= lit;
 if (worn > 0.0) col = mix(col, vec3(1.3, 1.24, 1.12) * sat(0.2 + 0.62 * dot(col * col, vec3(0.4, 0.55, 0.25))), worn);
 if (night > 0.0) col *= mix(vec3(1.0), vec3(0.2, 0.27, 0.4) + (0.6 + 0.6 * uLevel) * vec3(0.95, 1.0, 1.05) * exp(-sl * sl * 9.0) + vec3(0.5) * exp(-pow(abs(q.x - sunX) * 4.0, 2.0)) * step(0.0, wy), night);
 if (night > 0.0 && wy < agPx && max(rs.x, max(rs.y, rs.z)) < agPx) col += night * vec3(1.3, 1.25, 1.1) * agS(0.072, 0.066, sl) * (0.7 + 0.5 * mist);
 // the ferns, each spreading with one kind of sound
 float tr = 0.0, size = sqrt(near);
 for (int k = 0; k < (uOwn[3] > 0.0 ? 6 : 3); k++) {
  vec3 f = k == 0 ? vec3(-0.5, 0.6, uDrone) : k == 1 ? vec3(-0.17, 0.22, uPhrase) : vec3(0.56, 0.34, uTexture);
  if (uOwn[3] > 0.0) f = k < 3 ? f * vec3(1.0, 1.0 + 0.3 * uOwn[3], 1.0) : vec3(k == 3 ? 0.16 : k == 4 ? -0.78 : 0.82, (k == 3 ? 0.72 : 0.5) * uOwn[3] + 0.001, uPad);
  f.xy *= vec2(near, size);
  if (abs(q.x - f.x) > f.y * 1.1 || q.y > f.y * 1.1 - 0.3) continue;
  tr = max(tr, agFern((q - vec2(f.x, agBank(f.x) - 0.01)) / f.y, k == 0 ? 3.0 : k == 1 ? 8.0 : 15.0, agPx / f.y, 0.86 + 0.15 * f.z));
 }
 // low growth on the bank, far woods
 for (int k = 0; k < 2; k++) {
  if (k == 0 ? abs(bd) > 0.12 : abs(rs.y + 0.02) > 0.06) continue;
  float wide = k == 0 ? 0.075 : 0.05, cell = floor(q.x / wide), h = hash11(cell + 3.0 + float(k) * 60.0);
  float cx = (cell + 0.5) * wide, sz = wide * (0.6 + 0.5 * h);
  if (h < (k == 0 ? 0.2 : 0.45)) continue;
  float foot = k == 0 ? agBank(cx) - 0.008 : agRidge(cx, 1.0) * 0.85 + 0.001;
  tr = max(tr, agFern((q - vec2(cx, foot)) / sz, h * 40.0, agPx / sz, 0.88 + 0.12 * uPad) * (k == 0 ? 1.0 : 0.75));
 }
 tr *= 1.0 - agUp(-uOwn[3]);
 col = mix(col, vec3(0.02, 0.012, 0.009), tr * 0.96);
 col *= 0.92 + 0.16 * grain;
 col = mix(col, vec3(1.2, 1.1, 0.95), vein * 0.55);
 col += (uKind[4] * uKind[4] * 0.6 + vec3(0.5, 0.4, 0.27)) * run * uHits * go * 1.3;
 col = agMend(col, p);
 // the broken edge is chalky
 col = mix(col, vec3(0.95, 0.86, 0.72) * (0.55 + 0.6 * crumb), agS(-0.02, -0.005, max(p.x - he.x, p.y - he.y) + broken) * 0.8);
 return mix(col, ground, agS(-agPx, agPx, box));
}
vec3 render(vec2 p) { return screenOf(uVar < 0.5 ? agSlice(p) : agCountry(p)); }
