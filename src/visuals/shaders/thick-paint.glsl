// name: Thick paint
// a: Ploughed slope
// b: Sea grass
// what: Furrows climb a ploughed slope to a dark hedge under a pale windy sky, all of it in short thick strokes of paint whose ridges catch the light; or dune grass bending before a strip of surf and a grey sky, laid in the same thick paint. Now and then a new stroke is put down.
// follows: Low notes draw every stroke longer. Drone colours the furrows' hollows or the sea, pad the sky, texture the hedge or the grass, phrase the young green or single blades; a louder kind lays more new strokes on its ground. Highs glint on the ridges, a hit is one bright stroke, a cue a gust of light across the land, keys and voice warm the sky.
// own: 0 1 great slabs of paint laid with a knife, -1 many small touches; 1 1 long thin lines, -1 short square dabs; 2 1 a mountain stands on the slope (b: the grass grows high over the sea), -1 a flat plain under a wide sky (b: an open shore with hardly any grass); 3 1 the sky rolls and turns, -1 it falls slantwise as rain; 4 1 painted in the colours of the sounds (sky the pad, earth or sea the drone, leaves the texture, young green the melody, lights the hits), -1 night with stars; 5 1 fewer strokes on bare canvas, -1 strokes apart on black; 6 1 a low sun and its road on the land, -1 tall dark trees; 7 1 rows straight away to one point (b: blades upright, as reeds), -1 rows round the hill as terraces (b: grass laid over by wind, the sea high)
#define TPC 0.91309
#define TPS 0.40776
const vec2 TPV = vec2(0.36, 0.66); // where the furrows run together, behind the crest; TPC and TPS turn them into a curve
float tpPx, tpLong;              // a pixel, and how long the strokes are drawn
vec2 tpL;                        // towards the light, on the canvas
// The grounds that may reach this place, up to three. Q: the place on the ground's grid and the scale there. E: the grid's
// cell and the flow. M: how far inside the ground a place is, which way that
// grows, and where its foot is. R: how much a stroke strays, how
// uneven the ground's edge is, which ground, how loud.
vec4 tpQ[4], tpE[4], tpR[4], tpM[4];
vec3 tpTop;                      // of the top two strokes here: the order of the first and second, and how much the first covers
int tpK1, tpK2;                  // which they are
// One stroke, as it was last looked up.
vec2 tsD, tsH, tsS; float tsN, tsZ, tsW, tsDa, tsRow, tsIn;
vec3 tpDeep, tpHit; vec4 tpHere;   // two paints that follow the music, and the piece here
// How this place lies, for the paints: clouds, gust, light, how high, warm by the keys and the voice, hazy, green, under the hedge.
float tpCloud, tpGust, tpLight, tpHi, tpWarm, tpFar, tpGreen, tpUnder;
vec2 tpC, tpAt;                  // where a stroke has its middle, and where the sun stands
float tpBig;                     // how large the strokes are
float tpZs, tpSh;                // what stands between here and the light
float tpBump(float x) { float y = 1.0 / (1.0 + 0.6 * x * x); return y * y; }
float tpTri(float x) { return abs(fract(x) - 0.5) * 2.0; }
vec2 tpCrestWas(float x) { x = x * 1.5 - 0.25; return vec2(0.135 + 0.13 * x - 0.0205 * x * x * x, 0.195 - 0.092 * x * x); } // how high, and how it slopes
vec2 tpCrest(float x) {
  vec2 c = tpCrestWas(x);
  if (uOwn[2] < 0.0) c = mix(c, vec2(-0.13 + 0.012 * sin(x * 3.0), 0.036 * cos(x * 3.0)), -uOwn[2]);
  if (uOwn[2] > 0.0) {                                     // one great peak, a lower one beside it
    vec2 z = (x + vec2(0.1, -0.52)) * vec2(3.0, 4.2), q = sqrt(z * z + 0.02), e = vec2(0.5, 0.27) * exp(-q * 1.15);
    c = mix(c, vec2(-0.1 + e.x + e.y + 0.016 * sin(x * 13.0), -1.15 * dot(e, z / q * vec2(3.0, 4.2)) + 0.208 * cos(x * 13.0)), uOwn[2]);
  }
  return c;
}
vec2 tpHedge(float x) { // how tall the hedge stands along the crest, and how it slopes
  vec4 d = (x - vec4(0.49, 0.28, -0.62, -0.2)) * vec4(7.5, 8.0, 8.0, 7.0), y = 1.0 / (1.0 + 0.6 * d * d);
  const vec3 a = vec3(0.11, 0.065, 0.03);
  return vec2(0.036 + 0.014 * sin(x * 9.0 + 1.0) + dot(a, y.xyz * y.xyz), -19.0 * dot(a, d.xyz * y.xyz * y.xyz * y.xyz)) * (1.0 - y.w * y.w);
}
vec2 tpGrass(float x) { return vec2((0.15 * x + 0.13) * x - 0.185 + (uOwn[2] > 0.0 ? 0.34 : 0.3) * uOwn[2] + 0.045 * sin(x * 6.1 + 2.0), 0.3 * x + 0.13); }
float tpLean(float h, float k) { return k * (0.2 * h + 0.9 * h * h); }
float tpTaper(float reg) { return reg > 4.5 && uVar > 0.5 ? 0.85 : 0.15; }
// Tall trees along the land, each a flame: how far inside, how that grows, and which tree.
vec4 tpTrees(vec2 p, float foot) {
  float n = floor((p.x + 0.07) / 0.31), h = hash11(n * 3.1 + 2.0), w = 0.05 + 0.035 * h, tall = (0.28 + 0.3 * hash11(n * 7.3 + 1.0)) * min(1.0, -1.6 * uOwn[6]);
  float c = (n + 0.36 + 0.28 * h) * 0.31 - 0.07, v = (p.y - foot + 0.05) / max(tall, 0.01), x = p.x - c - 0.012 * sin(p.y * 22.0 + n * 2.0);
  float s = sqrt(max(v, 0.0) + 0.02), prof = 1.75 * s * (1.0 - v), dp = (0.875 * (1.0 - v) / s - 1.75 * s) * w / max(tall, 0.01);
  return vec4(v < 0.0 ? -0.05 : w * prof - abs(x), x > 0.0 ? -1.0 : 1.0, dp, n);
}
// How far inside a stroke a place is, in half widths: round where the brush came down, ragged and thinner where it was lifted.
// u runs along it and b across, -1 to 1; asp is its length over its width.
float tpEdge(float u, float b, float asp, float n, float taper) {
  float e = u > 0.0 ? 0.15 + (0.35 + 0.5 * n) * tpTri(b * (0.5 + n) + n * 9.7) : (0.3 + 0.4 * n) * b * b;
  return min(1.0 - taper * max(u, 0.0) - abs(b), ((1.0 - abs(u)) * asp - e) * (u > 0.0 ? 0.6 : 1.0));
}
// One coat of strokes: a grid stretched along the flow, its rows pushed past one another, the six nearest strokes of it.
// Over them the late ones, on a wider grid: each is drawn in its own time, and the louder its kind is the more there are.
void tpStroke(int k, vec2 q, vec2 sc, vec2 cell, vec2 ql, vec4 M, vec4 R, float ifx) {
  bool lt = k > 5; float late = lt ? 1.0 : 0.0;
  vec2 full = cell * sc, ce = lt ? cell * vec2(1.8, 2.2) : cell, g = lt ? q * vec2(0.5556, 0.4545) + vec2(0.37, 0.71) : q;
  float row = floor(g.y) + (lt ? 0.0 : float(k / 2) - 1.0), push = fract(row * 0.381966), x = g.x + push;
  vec2 id = vec2(lt ? floor(x) : floor(x - 0.5) + float(k & 1), row), h;
  vec4 m = fract((id.xyxy + R.z * 37.0 + late * 51.0) * vec4(0.1031, 0.1030, 0.0973, 0.1099)); m += dot(m, m.wzxy + 33.33); m = fract((m.xxyz + m.yzzw) * m.zywx);
  h = fract(m.xy * 91.7 + m.zw * 37.3);
  vec2 c = vec2(id.x - push, row) + 0.5 + (h - 0.5) * (lt ? vec2(0.16, 0.14) : vec2(0.36, 0.6)), d = (g - c) * ce * sc;
  float da = (m.x - 0.5) * (lt ? 0.5 * R.x : R.x), life = fract(uTime * 0.015625 + m.z), wide = lt ? sat(12.0 - 12.0 * life) * sat(1.0 + 3.0 * R.w - 2.7 * m.y) : 1.0;
  tsIn = 900.0 * min(M.x - dot(M.yz, d) + R.y * (push - 0.5), c.x * ce.x + M.w);
  vec2 hf = full * vec2(tpLong * (0.82 + 0.18 * m.y), 0.68 + 0.22 * m.x);
  if (uOwn[5] != 0.0) hf *= vec2(1.0, 1.0 - 0.36 * abs(uOwn[5])) * (1.0 - max(uOwn[5], 0.0) * 0.85 * (1.0 - smoothstep(0.35, 0.5, m.z)));
  float grow = lt ? 0.85 * min(0.12 + 20.0 * life, 1.0) : 1.0;
  float dx = d.x + da * d.y;
  tsD = vec2(lt ? dx + (0.85 - grow) * hf.x : dx, d.y - da * d.x + (m.w - 0.5) * 0.65 * dx * dx * ifx);   // bent a little, as a wrist bends it
  tsH = hf * vec2(grow, lt ? 0.5 + 0.3 * wide : 1.0); tsW = wide;
  tsS = tsD + vec2(ql.x + da * ql.y, ql.y - da * ql.x) * tsH.y * 0.3;
  tsN = m.w; tsDa = da; tsRow = c.y * ce.y; tsZ = R.z * 3.0 + late + 0.98 * h.x;
}
void tpLay(int y) {
  vec4 Q = tpQ[y], E = tpE[y], R = tpR[y]; vec4 M = tpM[y]; float taper = tpTaper(R.z), ifx = 1.0 / (E.x * Q.z);
  vec2 qc = Q.xy / E.xy, pp = vec2(-E.w, E.z), ql = vec2(dot(tpL, E.zw), dot(tpL, pp)); M.yz = vec2(dot(M.yz, E.zw), dot(M.yz, pp));
  for (int k = 0; k < 7; k++) {
    tpStroke(k, qc, Q.zw, E.xy, ql, M, R, ifx);
    vec2 ih = 1.0 / tsH, us = tsS * ih, ub = tsD * ih; float asp = tsH.x * ih.y;
    if (tsIn <= 0.0 || tsW <= 0.0 || (any(greaterThan(abs(us), vec2(1.0))) && any(greaterThan(abs(ub), 1.0 + ih * tpPx)))) continue;
    float cov = sat(min(tpEdge(ub.x, ub.y, asp, tsN, taper) * tsH.y * uRes.y + 0.5, tsIn)) * tsW;
    bool on = cov > 0.004, first = on && tsZ > tpTop.x, second = on && tsZ > tpTop.y; int key = y * 8 + k;
    tpK2 = first ? tpK1 : second ? key : tpK2;
    tpK1 = first ? key : tpK1;
    tpTop = first ? vec3(tsZ, tpTop.x, cov) : second ? vec3(tpTop.x, tsZ, tpTop.z) : tpTop;
    float s = tsW * sat(min(min(1.0 - abs(us.y) - taper * max(us.x, 0.0), (1.0 - abs(us.x)) * asp - 0.4) * 4.0, tsIn));
    bool sh = s > 0.0 && tsZ > tpZs; tpZs = sh ? tsZ : tpZs; tpSh = sh ? s : tpSh;
  }
}
// The second paint on a brush, four for each ground; then what hedge and grass are mixed from.
const vec3 tpP[32] = vec3[32](
  vec3(0.98, 0.95, 0.86), vec3(0.62, 0.73, 0.80), vec3(0.87, 0.80, 0.82), vec3(0.80, 0.86, 0.78), vec3(0.98, 0.86, 0.68), vec3(0.45, 0.50, 0.70), vec3(0.84, 0.50, 0.36), vec3(0.54, 0.60, 0.36),
  vec3(0.50, 0.48, 0.20), vec3(0.22, 0.36, 0.28), vec3(0.45, 0.24, 0.15), vec3(0.30, 0.40, 0.20), vec3(0.95, 0.93, 0.86), vec3(0.55, 0.62, 0.70), vec3(0.78, 0.72, 0.75), vec3(0.70, 0.76, 0.70),
  vec3(0.80, 0.84, 0.82), vec3(0.30, 0.40, 0.46), vec3(0.66, 0.60, 0.64), vec3(0.50, 0.60, 0.52), vec3(0.95, 0.86, 0.58), vec3(0.16, 0.22, 0.24), vec3(0.62, 0.68, 0.56), vec3(0.68, 0.48, 0.28),
  vec3(0.08, 0.13, 0.14), vec3(0.13, 0.22, 0.15), vec3(0.11, 0.13, 0.22), vec3(0.20, 0.26, 0.13), vec3(0.22, 0.32, 0.25), vec3(0.48, 0.52, 0.28), vec3(0.82, 0.72, 0.44), vec3(0.40, 0.52, 0.47));
// A paint given a colour, its lightness kept. full: how much of the colour there is, where it comes already multiplied.
vec3 tpTint(vec3 c, vec3 k, float m, float full) { return sat(c + m * (k * dot(c, vec3(0.54, 1.06, 0.2)) - c * full)); }
// The two paints on the brush. Every ground is mixed one of three ways: a sky from four paints, ploughed earth or shore from
// five laid one over another, leaves from four kept apart.
void tpPaint(float reg, float cy, float h, float v, out vec3 a, out vec3 b) {
  bool one = uVar < 0.5, sky = reg == 0.0 || reg == 3.0, leaf = reg == 2.0 || reg > 4.5 || (reg > 2.1 && reg < 2.9), tree = fract(reg) > 0.3;
  float h2 = fract(h * 57.3), h3 = fract(h * 191.7), cl = sat((tpCloud + 0.3 * h2 - 0.56) * 3.2), surf = 0.0;
  vec4 w;
  if (one) { float s = 2.2 * tpTri(v / 0.114 + 0.75) - 1.1 + 0.35 * (h2 - 0.5); w = vec4(sat(s * 2.6 + 1.9), sat(s * 1.8 - 0.1), tpFar, tpGreen); }
  else {
    if (uOwn[7] < 0.0) cy = mix(cy, cy * 0.24 + 0.004, -uOwn[7]);   // the sea comes up the shore
    surf = sat((max(1.1 - 60.0 * abs(cy + 0.035), 0.0) + max(0.9 - 80.0 * abs(cy + 0.005), 0.0) + max(0.8 - 60.0 * abs(cy + 0.085), 0.0)) * (0.6 + 0.8 * h2));
    w = vec4(sat(1.0 - 17.0 * cy), sat(-25.0 * cy - 1.5), sat(-17.0 * cy - 1.9), surf);
  }
  vec3 s = mix(mix(one ? vec3(0.76, 0.82, 0.80) : vec3(0.95, 0.89, 0.76), one ? vec3(0.50, 0.65, 0.76) : vec3(0.57, 0.61, 0.66), tpHi), mix(one ? vec3(0.97, 0.89, 0.68) : vec3(0.97, 0.92, 0.80), one ? vec3(0.92, 0.91, 0.86) : vec3(0.80, 0.80, 0.79), tpHi), cl);
  if (uOwn[4] > 0.0) {
    vec3 pale = mix(uKind[1], mix(uKind[4], vec3(1.0, 0.97, 0.92), max(uOwn[6], 0.0)), 0.75 - 0.2 * max(uOwn[6], 0.0));
    s = mix(s, mix(mix(uKind[1], pale, 0.55), uKind[1] * 0.86, tpHi) * (0.94 + 0.14 * h3), uOwn[4]);
    s = mix(s, pale, uOwn[4] * cl * 0.75);
  }
  if (uOwn[4] < 0.0) {                                     // night: a star is a stroke of its own
    float st = smoothstep(0.935, 0.955, fract(h * 313.7)) * sat(tpHi * 3.0 + 0.2);
    s *= mix(vec3(1.0), vec3(0.16, 0.22, 0.4) * (0.7 + 0.6 * h2) * (1.0 + 0.7 * cl), -uOwn[4]);
    s = mix(s, vec3(0.9, 0.8, 0.5) * (0.8 + 0.3 * uHigh), st * -uOwn[4]);
  }
  vec2 off = mix(tpC, tpAt, 0.55); float sunny = 0.0;
  if (uOwn[6] > 0.0 && sky) {                              // the sun, and the air round it
    vec2 d = off - (one ? vec2(-0.36, 0.2) : vec2(0.2, 0.17)); float l = length(d);
    vec3 disc = mix(vec3(1.0, 0.93, 0.66), uKind[4], max(uOwn[4], 0.0));
    s = mix(s, mix(vec3(0.93, 0.6, 0.34), mix(uKind[4], uKind[3], 0.85), max(uOwn[4], 0.0)), uOwn[6] * sat((0.95 - 0.45 * max(uOwn[4], 0.0) - 0.5 * min(uOwn[4], 0.0) * -1.0) * exp(-l * 2.6) + 0.14 * sin(l * 42.0) * exp(-l * 2.5)) * (0.75 + 0.3 * uLevel));
    s = mix(s, disc, uOwn[6] * (1.0 - smoothstep(0.105, 0.125, l)));
  }
  s = mix(s, vec3(1.0, 0.82, 0.56), tpWarm);
  vec3 e = mix(mix(tpDeep, one ? vec3(0.76, 0.45, 0.29) : vec3(0.42, 0.55, 0.51), w.x), one ? vec3(1.0, 0.80, 0.49) : vec3(0.62, 0.60, 0.58), w.y);
  e = mix(mix(e, one ? vec3(0.94, 0.82, 0.68) : vec3(0.82, 0.73, 0.60), w.z), one ? vec3(0.42, 0.52, 0.25) + vec3(0.28, 0.24, 0.12) * h2 : vec3(0.97, 0.97, 0.94), w.w);  // a strip of young green, or the foam
  if (uOwn[4] > 0.0) {
    vec3 d = mix(mix(uKind[0] * 0.62, mix(uKind[0], uKind[3], one ? 0.3 : 0.12), w.x), one ? mix(uKind[3], uKind[4], 0.45) : mix(uKind[0], uKind[4], 0.5), w.y);
    d = mix(mix(d, one ? uKind[1] : mix(uKind[3], uKind[4], 0.3), w.z * (one ? 0.6 : 1.0)), one ? mix(uKind[2], uKind[3], h2) : mix(vec3(1.0), uKind[4], 0.7), w.w);
    e = mix(e, d * (0.88 + 0.24 * h3), uOwn[4]);
  }
  if (uOwn[6] > 0.0 && !sky) {                             // its road on the land or on the water
    float x = off.x - (one ? -0.36 : 0.2), wide = one ? 0.16 : 0.05 + 0.25 * max(0.06 - off.y, 0.0);
    sunny = uOwn[6] * exp(-x * x / (wide * wide)) * (one ? 0.5 * sat(1.0 + off.y * 2.0) : step(0.25, h2) * 0.95);
    e = mix(e, mix(vec3(1.0, 0.88, 0.62), mix(uKind[4], vec3(1.0), 0.2), max(uOwn[4], 0.0)), sunny);
  }
  if (uOwn[4] < 0.0) e *= mix(vec3(1.0), vec3(0.34, 0.42, 0.58), -uOwn[4] * (1.0 - 0.6 * sunny));
  a = sky ? s : leaf ? tpP[(one ? 24 : 28) + int(h2 * 3.99)] : e;
  if (leaf && uOwn[4] > 0.0) a = mix(a, mix(uKind[2] * 0.42, mix(uKind[2], h3 > 0.6 ? uKind[3] : uKind[0], 0.3), h2 * (one || tree ? 0.55 : 1.0)), uOwn[4]);
  if (leaf && uOwn[4] < 0.0) a *= mix(vec3(1.0), vec3(0.42, 0.5, 0.66), -uOwn[4]);
  if (tree) a *= one ? 0.8 : 0.45;
  // some strokes of the slope and some blades take the phrase's colour, the rest the piece's or the texture's
  bool ph = leaf ? !one && h3 < 0.3 : one && (h3 > 0.8 || tpGreen > 0.5), tx = leaf && (one || h3 < 0.7), sea = !one && !leaf;
  float ka = sky ? 0.3 * uPad : ph ? (0.5 - 0.2 * tpGreen) * uPhrase : tx ? 0.55 * uTexture : sea ? 0.5 * uDrone * sat(20.0 * cy + 1.8) * (1.0 - surf) : 0.4;
  float li = sky || sea ? 1.0 : leaf && one ? 1.0 + 0.5 * uTexture : tpLight;
  if (uOwn[4] > 0.0) ka *= 1.0 - 0.5 * uOwn[4];
  bool own = sky || ph || tx || sea;
  a = tpTint(a, sky ? uKind[1] : ph ? uKind[3] : tx ? uKind[2] : sea ? uKind[0] : tpHere.rgb, ka, own ? 1.0 : tpHere.a);
  b = mix(a, tpP[int(min(reg, 5.0)) * 4 + int(h3 * 3.99)] * (reg == 1.0 ? vec3(1.0) - tpGreen * vec3(0.25, 0.0, 0.35) : vec3(1.0)), sea ? 0.3 : 0.45) * (0.15 + 0.85 * li);
  if (uOwn[4] > 0.0) b = mix(b, mix(a, sky ? mix(uKind[1], uKind[4], h3) : leaf ? uKind[2] : mix(uKind[int(min(h3 * 5.0, 4.0))], uKind[0], 0.4), 0.38) * (0.3 + 0.7 * li), uOwn[4]);
  if (uOwn[4] < 0.0) b = mix(b, a * 1.25, -0.85 * uOwn[4]);
  a = mix(a * li, vec3(1.0, 0.96, 0.82), sky || sea ? 0.0 : leaf && one ? 0.3 * tpGust : 0.6 * tpGust);
  if (reg == 9.0) { a = mix(tpHit, vec3(1.0, 0.8, 0.5), 0.12); b = mix(a, vec3(1.0, 0.93, 0.74), uVar < 0.5 ? 0.45 : 0.65); }
}
// Hills and hollows along two lines at once: their heights, then their slopes.
vec4 tpN1(vec2 x) {
  vec2 i = floor(x), f = x - i; vec4 h = fract(vec4(i, i + 1.0) * 0.1031); h *= h + 33.33; h = fract(2.0 * h * h);
  return vec4(mix(h.xy, h.zw, f * f * (3.0 - 2.0 * f)), (h.zw - h.xy) * 6.0 * f * (1.0 - f));
}
// A stroke in relief: heaped edges, the furrows of the bristles, a lump where the brush came down.
vec3 tpShade(vec2 p, float reg, vec2 dir) {
  vec3 ca, cb;
  vec2 A = tsD, H = tsH, pp = vec2(-dir.y, dir.x), lg = vec2(dot(tpL, dir), dot(tpL, pp));
  tpC = p - dir * A.x - pp * A.y; tpAt = p;
  tpPaint(reg, p.y - dir.y * A.x - pp.y * A.y, tsN, tsRow, ca, cb);
  float dark = reg < 1.5 ? tpUnder : 0.0; ca = mix(ca, vec3(0.10, 0.15, 0.14), dark); cb = mix(cb, vec3(0.14, 0.20, 0.17), dark);
  float n = tsN, b = A.y / H.y, s = A.x / H.y, taper = tpTaper(reg);
  float wob = 0.5 * tpTri(s * 0.13 + n * 50.0);
  vec4 l = tpN1(vec2(b * 2.6 + wob, b * 7.0 + wob * 2.0) + n * vec2(91.0, 530.0));
  float ed = tpEdge(A.x / H.x, b, H.x / H.y, n, taper), rim = sat(ed / 0.42), soft = sat(ed * 3.0);
  float across = 1.0 - taper * max(A.x / H.x, 0.0) - abs(b), along = (H.x - abs(A.x)) / H.y - 0.3;
  float slope = 1.5 * (1.0 - rim);
  vec2 gr = soft * vec2(0.0, 0.72 * l.z + 0.8 * l.w * sat(H.y * 0.07 * uRes.y - 0.5));
  gr -= across < along ? vec2(0.0, slope * sign(b)) : vec2(slope * (s > 0.0 ? 0.35 : -0.85), 0.0);
  gr *= (reg == 0.0 || reg == 3.0 ? 0.5 : 0.65) * (0.75 + 0.5 * uTone);
  vec3 nn = normalize(vec3(-gr, 1.0));
  vec3 c = mix(ca, cb, sat(3.2 * l.x + l.y - 1.75));
  float k = max(dot(nn, vec3(lg, 1.1)) / 1.1, 0.0);
  c *= mix(vec3(0.5, 0.5, 0.62), vec3(1.0), sat(k)) * (1.0 + 0.2 * max(k - 1.0, 0.0)) * (0.94 + 0.12 * uTone);
  float sp = sat(dot(nn, vec3(lg * 0.35, 0.937))); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sat(H.y * uRes.y * 0.14 - 0.3);
  return c + vec3(1.0, 0.97, 0.9) * sp * sat(2.2 * dot(gr, gr) - 0.09) * soft * (0.08 + 0.6 * uHigh);
}
// The sky, turned and rolled: the same strokes along other lines.
void tpTurn(vec2 p) {
  float t = max(-uOwn[3], 0.0) * 1.12, k = max(uOwn[3], 0.0);
  if (k > 0.0) {                                           // lines that roll, and go round the sun
    vec2 c = p - (uVar < 0.5 ? vec2(-0.36, 0.2) : vec2(0.2, 0.17)), w = p * vec2(6.2, 4.0) + vec2(0.6, 1.0);
    float near = exp(-dot(c, c) * 5.0);
    float f = tpQ[0].y + k * (0.15 * sin(w.x) * cos(w.y * 1.1) * (1.0 - near) + 2.0 * near * c.x * c.x);
    vec2 d = tpE[0].zw, g = vec2(-d.y / d.x, 1.0);
    vec2 gn = -10.0 * c * near, h = vec2(sin(w.x) * cos(w.y * 1.1), c.x * c.x);
    g += k * (0.15 * vec2(6.2 * cos(w.x) * cos(w.y * 1.1), -4.4 * sin(w.x) * sin(w.y * 1.1)) * (1.0 - near) - 0.15 * h.x * gn + 2.0 * (gn * h.y + vec2(2.0 * near * c.x, 0.0)));
    g.y = max(g.y, 0.35);
    float l = length(g);
    tpQ[0] = vec4(tpQ[0].x, f, clamp(l / g.y, 1.0, 2.2), 1.0 / l);
    tpE[0].zw = vec2(g.y, -g.x) / l;
  }
  if (t > 0.0) {                                           // the same curves, the whole sky turned
    vec2 q = rot(t) * p, b = uVar < 0.5 ? vec2(0.065, -0.08) : vec2(0.14, -0.04);
    float s = smoothstep(0.0, 0.5, t); q = mix(tpQ[0].xy, vec2(q.x, q.y + (b.x * q.x + b.y) * q.x), s);
    vec2 d = normalize(vec2(1.0, -(2.0 * b.x * q.x + b.y)));
    tpQ[0].xy = q; tpE[0].zw = mix(tpE[0].zw, vec2(d.x * cos(t) - d.y * sin(t), d.x * sin(t) + d.y * cos(t)), s);
    tpE[0].zw = normalize(tpE[0].zw);
  }
}
vec3 render(vec2 p) {
  tpPx = 1.0 / uRes.y;
  tpBig = uOwn[0] == 0.0 && uOwn[1] == 0.0 ? 1.0 : max(1.0, exp2(uOwn[0] * 1.15 + max(uOwn[1], 0.0) * 0.8));
  tpLong = 0.68 + 0.16 * uLow;
  tpL = vec2(-0.82, 0.57) + 0.2 * cos(TAU * uLoop) * vec2(0.57, 0.82);
  tpTop = vec3(-1.0, -1.0, 1.0); tpK1 = tpK2 = -1; tpZs = -1.0; tpSh = 0.0; tpUnder = 0.0;
  tpHit = uKind[4] / max(max(uKind[4].r, max(uKind[4].g, uKind[4].b)), 0.1); tpHit *= 0.25 + 0.75 * tpHit;
  tpDeep = uVar < 0.5 ? tpTint(vec3(0.36, 0.27, 0.44), uKind[0], uDrone * 0.8, 1.0) : vec3(0.28, 0.42, 0.46);
  float px = sat(p.x / 1.8 + 0.5), noisy = noise(p * vec2(2.0, 4.4) + vec2(-uTime * 0.012, 3.0)); vec4 here = piece(vec2(px, sat(0.6 - 1.1 * p.y)));
  tpHere = here; tpCloud = noisy;
  tpLight = (1.0 + 0.2 * uEnergy * band(px)) * (0.76 + 0.32 * sat(2.8 * noisy + 0.84 * tpBump((p.x - 0.3) * 1.6) - 1.1)); // sun and the shadows of clouds
  tpGust = uCue * tpBump((p.x - 0.3 * p.y + 0.6 - 1.6 * (1.0 - uCue)) * 4.0);
  tpFar = tpGreen = 0.0;
  vec3 ground;
  vec2 hq, hs, hdir; // the stroke of a hit, on the grid of its ground
  int nn = 0;
  float hx = tpTri(uTime * 0.0173) - 0.5;
  if (uVar < 0.5) {
    vec2 cr = tpCrest(p.x); float up = p.y - cr.x, cs = cr.y, hd, hh; vec2 hg = tpHedge(p.x); hd = hg.x; hh = hg.y;
    ground = up > 0.0 ? (up < hd - 0.008 ? vec3(0.10, 0.14, 0.13) : vec3(0.74, 0.76, 0.74)) : vec3(0.30, 0.20, 0.22);
    tpUnder = smoothstep(-0.012, -0.004, up) * (1.0 - smoothstep(-0.014, -0.006, up - hd));
    float dep = sat(-up * 1.67); tpHi = sat(up * 2.0); tpFar = (0.08 + 0.4 * uSpace) * sat(1.0 - 3.0 * dep);
    tpGreen = sat(25.0 * dep - 0.5) * sat(4.2 - 16.0 * dep - 0.8 * p.x) * sat(0.9 - 5.5 * p.x);
    vec2 s = vec2(0.9801 * p.x + 0.1987 * p.y, -0.1987 * p.x + 0.9801 * p.y), w = p - TPV - vec2(0.0, 0.3 * min(uOwn[2], 0.0)) + vec2(0.36 * max(uOwn[7], 0.0), 0.2 * max(uOwn[7], 0.0));
    float r = max(length(w), 0.05), lr = log(r), th = atan(w.x, 1e-5 - w.y), sl = 0.28 - 0.13 * s.x;
    vec2 fq = vec2(lr * TPC - th * TPS, lr * TPS + th * TPC), fd = (w * TPC + vec2(w.y, -w.x) * TPS) / r;
    if (uOwn[7] != 0.0) {
      float an = 0.42 - 0.42 * max(uOwn[7], 0.0) + 0.95 * max(-uOwn[7], 0.0), cc = cos(an), ss = sin(an);
      fq = vec2(lr * cc - th * ss, lr * ss + th * cc); fd = (w * cc + vec2(w.y, -w.x) * ss) / r;
    }
    if (up > -0.015 * tpBig) { tpQ[0] = vec4(s.x, s.y + (0.065 * s.x - 0.08) * s.x, 1.0, 1.0); tpE[0] = vec4(0.15, 0.04, normalize(vec2(1.0, sl))); if (uOwn[3] != 0.0) tpTurn(p); tpM[0] = vec4(up + 0.03, -cs, 1.0, 99.0); tpR[0] = vec4(0.3, 0.0, 0.0, uPad); nn = 1; }
    if (up < 0.025 * tpBig) { tpQ[nn] = vec4(fq, r, r); tpE[nn] = vec4(0.17, 0.038, fd); tpM[nn] = vec4(-up - 0.004, cs, -1.0, 99.0); tpR[nn] = vec4(0.22, 0.0, 1.0, uDrone); nn++; }
    if (up > -0.035 * tpBig && up < hd + 0.02 * tpBig) { tpQ[nn] = vec4(up, p.x - 0.25 * up, 1.0, 1.0); tpE[nn] = vec4(0.04, 0.026, 0.24, 0.97); tpM[nn] = vec4(hd - up - 0.006, hh + cs, -1.0, 0.012); tpR[nn] = vec4(1.1, 0.02, 2.0, uTexture); nn++; }
    hq = fq - vec2(-0.2, -0.1 + 0.8 * hx); hs = vec2(r); hdir = fd;
  } else {
    float gr, gs; vec2 gg = tpGrass(p.x); gr = gg.x; gs = gg.y; float deep = p.y - gr, sl = 0.2 + 1.8 * (p.y + 0.6), lean = 1.0 - (uOwn[7] > 0.0 ? 0.92 : 0.9) * uOwn[7]; sl *= lean;
    float top = sat(deep * 2.5 + 1.0); tpHi = sat((p.y - 0.05 - 0.12 * tpBump((p.x - 0.15) * 2.2)) * (7.0 - 4.0 * uSpace)); tpLight *= 0.42 + 0.55 * top;
    vec2 ca = inversesqrt(1.0 + sl * sl * vec2(0.64, 1.69));
    ground = deep < -0.12 ? vec3(0.16, 0.19, 0.16) : p.y > 0.05 ? vec3(0.72, 0.73, 0.74) : p.y > -0.06 ? vec3(0.42, 0.52, 0.52) : vec3(0.70, 0.64, 0.56);
    if (p.y > 0.05 || (p.y > 0.05 - 0.03 * tpBig && deep > -0.1 * tpBig)) { float sx = p.x + 0.3 * p.y; tpQ[0] = vec4(p.x, p.y + (0.14 * sx - 0.04) * sx, 1.0, 1.0); tpE[0] = vec4(0.16, 0.044, normalize(vec2(1.0, 0.04 - 0.28 * sx))); if (uOwn[3] != 0.0) tpTurn(p); tpM[0] = vec4(p.y - 0.05, 0.0, 1.0, 99.0); tpR[0] = vec4(0.35, 0.0, 3.0, uPad); nn = 1; }
    if (p.y < 0.05 + 0.03 * tpBig && deep > -0.13 * tpBig) { tpQ[nn] = vec4(p, 1.0, 1.0); tpE[nn] = vec4(0.14, 0.026, 1.0, 0.0);
      if (uOwn[7] < 0.0) { float a = -0.02 * uOwn[7] * sat(8.0 * (0.05 - p.y)); tpQ[nn].y += a * sin(p.x * 9.0 + p.y * 24.0); tpE[nn].zw = normalize(vec2(1.0 + a * 24.0 * cos(p.x * 9.0 + p.y * 24.0), -a * 9.0 * cos(p.x * 9.0 + p.y * 24.0))); }
       tpM[nn] = vec4(0.065 - p.y, 0.0, -1.0, 99.0); tpR[nn] = vec4(0.24, 0.0, 4.0, uDrone); nn++; }
    if (deep < 0.16 * tpBig) { tpQ[nn] = vec4(p.y, p.x - tpLean(p.y + 0.6, lean), 1.0 / ca.x, ca.x); tpE[nn] = vec4(0.17, 0.032, sl * ca.x, ca.x); tpM[nn] = vec4(-deep, gs, -1.0, 99.0); tpR[nn] = vec4(0.2, 0.1, 5.0, uTexture); nn++; }
    hq = vec2(p.y + 0.06, p.x - tpLean(p.y + 0.6, lean) - hx + 0.1); hs = vec2(1.0 / ca.x, ca.x); hdir = vec2(sl * ca.x, ca.x);
  }
  if (uOwn[6] < 0.0) {                                     // trees
    vec2 f = uVar < 0.5 ? tpCrest(p.x) : vec2(tpGrass(p.x).x - 0.03, 0.0); vec4 tr = tpTrees(p, f.x); float fl = 0.25 * sin(p.y * 16.0 + tr.w * 2.0);
    if (tr.x > -0.03 * tpBig) { tpQ[nn] = vec4(p.y, p.x + 0.0156 * cos(p.y * 16.0 + tr.w * 2.0), 1.0, 1.0); tpE[nn] = vec4(0.075, 0.021, normalize(vec2(fl, 1.0))); tpM[nn] = vec4(tr.x, tr.yz, 99.0); tpR[nn] = vec4(0.4, 0.012, uVar < 0.5 ? 2.5 : 4.6, uTexture); nn++; }
  }
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0) {
    vec2 by = exp2(uOwn[0] * vec2(1.0, 1.15) + uOwn[1] * vec2(0.8, -0.75));
    for (int k = 0; k < nn; k++) { tpE[k].xy *= uOwn[1] < 0.0 && tpR[k].z > 4.5 ? sqrt(by) : by; tpM[k].w = max(tpM[k].w, 0.03); }
  }
  if (uOwn[4] > 0.0) ground = mix(ground, (p.y > 0.05 && uVar > 0.5) || ground.b > 0.7 ? uKind[1] * 0.9 : ground.g < 0.18 ? uKind[2] * 0.4 : uKind[0] * 0.6, uOwn[4]);
  if (uOwn[5] != 0.0) {
    ground = mix(ground, uOwn[5] > 0.0 ? vec3(0.85, 0.8, 0.7) * (0.9 + 0.08 * noise(p * 190.0) + 0.08 * noise(p * vec2(8.0, 300.0))) : vec3(0.035, 0.034, 0.042), min(1.0, 1.6 * abs(uOwn[5])));
  }
  tpWarm = 0.7 * max(uKeys, uMic) * (1.0 - tpHi);
  for (int k = 0; k < nn; k++) tpLay(k);
  // the stroke of a hit: bright, drawn out while it fades
  vec2 hd = hq * hs, hh = vec2(0.1 + 0.07 * (1.0 - uHits), 0.024);
  float hc = sat(tpEdge(hd.x / hh.x, hd.y / hh.y, hh.x / hh.y, 0.37, 0.15 + 0.7 * uVar) * hh.y / tpPx + 0.5) * smoothstep(0.02, 0.4, uHits);
  vec3 col = ground, top = ground;
  int cnt = tpK1 < 0 ? 0 : tpTop.z > 0.85 || tpK2 < 0 ? 1 : 2;
  bool laid = hc > 0.004;
  for (int i = 0; i < max(cnt, laid ? 3 : 0); i++) {
    int key = i == 1 ? tpK2 : tpK1, y = max(key, 0) / 8;
    vec4 E = tpE[y], R = tpR[y]; vec2 dir = E.zw; float reg = R.z;
    tpStroke(max(key, 0) % 8, tpQ[y].xy / E.xy, tpQ[y].zw, E.xy, vec2(0.0), vec4(0.0), R, 1.0 / (E.x * tpQ[y].z));
    dir += tsDa * vec2(-dir.y, dir.x);
    if (i == 2) { reg = 9.0; tsD = hd; tsH = hh; tsN = 0.37; dir = hdir; }
    vec3 c = tpShade(p, reg, dir);
    if (i < 2 && tpZs > (i == 0 ? tpTop.x : tpTop.y)) c *= mix(vec3(1.0), reg == 0.0 || reg == 3.0 ? vec3(0.84, 0.83, 0.88) : vec3(0.66, 0.64, 0.74), tpSh);
    if (i == 0) { top = c; if (cnt > 0) col = mix(ground, c, tpTop.z); }
    else if (i == 1) { if (cnt > 1) col = mix(c, top, tpTop.z); }
    else col = mix(col, c, hc);
  }
  col = mix(col, col * 1.15 + uKind[4] * 0.22, uHits * exp(-dot(hd, hd) * 45.0) * (1.0 - hc)); // it lights what lies round it
  return col;
}
