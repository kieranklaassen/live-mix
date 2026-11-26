// name: Frost
// a: Window
// b: Grass
// what: Frost on a window before dawn: stiff feathers of ice with barbs on their barbs grow in from the edges, and through the clear glass that is left a blue garden and a far lamp show out of focus; or frosted grass against the low sun, white needles all along each blade and round the rim of one brown leaf.
// follows: The feathers, or the needles, grow and draw back once in the loop. Each kind of sound lights its own feathers or blades, and the piece lies along them from foot to tip. Low warms the lamp or the sun, a cue more so; high and keys bring glints. A hit runs one fine crack over the glass, or a light up the blades. In the grass the bands light far grains of frost.

// The feathers of the window. Where each stem starts (x is stretched with the picture) and which way it sets out; then how
// it bends, how wide its plume is, when it starts to grow and how long it is. Every fourth belongs to one kind.
const int FR_N = 20;
const vec4 FR_A[20] = vec4[20](
  vec4(-0.74, -0.64, 0.54, 0.841), vec4(-0.5, -0.64, 0.697, 0.717), vec4(-1.02, -0.4, 0.454, 0.891),
  vec4(-0.16, -0.64, 0.853, 0.523), vec4(0.2, -0.64, 0.79, 0.613), vec4(1.0, -0.64, -0.589, 0.808),
  vec4(0.54, -0.64, 0.454, 0.891), vec4(0.74, -0.64, -0.178, 0.984), vec4(1.04, -0.3, -0.912, 0.409),
  vec4(1.04, 0.06, -0.703, 0.711), vec4(1.04, 0.36, -0.953, -0.304), vec4(0.94, 0.64, -0.628, -0.778),
  vec4(0.56, 0.64, 0.315, -0.949), vec4(0.22, 0.64, 0.697, -0.717), vec4(-0.2, 0.64, 0.697, -0.717),
  vec4(-0.7, 0.64, 0.582, -0.813), vec4(-1.04, 0.5, 0.939, -0.343), vec4(-1.04, 0.1, 0.853, 0.523),
  vec4(-1.04, -0.16, 0.976, 0.218), vec4(-1.02, -0.64, 0.582, 0.813));
const vec4 FR_B[20] = vec4[20](
  vec4(-0.98, 0.44, 0.0, 1.46), vec4(-0.75, 0.2, 0.1, 0.8), vec4(-0.5, 0.26, 0.05, 0.95),
  vec4(0.55, 0.22, 0.1, 0.62), vec4(0.6, 0.26, 0.13, 0.54), vec4(-0.6, 0.3, 0.0, 0.92),
  vec4(0.9, 0.25, 0.14, 0.44), vec4(0.6, 0.24, 0.1, 0.52), vec4(-0.8, 0.2, 0.1, 0.46),
  vec4(0.7, 0.2, 0.12, 0.5), vec4(0.8, 0.22, 0.14, 0.5), vec4(-0.75, 0.24, 0.04, 0.56),
  vec4(0.8, 0.22, 0.15, 0.34), vec4(-0.6, 0.25, 0.11, 0.54), vec4(0.55, 0.28, 0.08, 0.66),
  vec4(0.75, 0.34, 0.02, 1.0), vec4(0.5, 0.24, 0.12, 0.7), vec4(-0.5, 0.22, 0.1, 0.62),
  vec4(0.45, 0.27, 0.14, 0.8), vec4(0.6, 0.24, 0.06, 0.6));
float frSq(float x) { return x * x; }
float frS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }   // a step that may run either way
float frGrain(vec2 p) { return 0.5 * (noise(rot(0.6) * p * 430.0) + noise(rot(2.1) * p * 310.0)); }   // rime
float frLevel(float k) { return k < 0.5 ? uDrone : k < 1.5 ? uPad : k < 2.5 ? uTexture : uPhrase; }
// How far a stem that sets out along x has bent aside at x.
float frAside(float x, float k) { x = clamp(x, -0.2, 1.4); return k * x * x * 0.25 * (1.0 + x); }
// The place q beside that stem: x how far along it, y how far off; t is its way there.
vec2 frBend(vec2 q, float k, float f, out vec2 t) {
  float x = clamp(q.x, -0.2, 1.4), g = k * x * (0.5 + 0.75 * x), n = inversesqrt(1.0 + g * g);
  t = vec2(1.0, g) * n;
  return vec2(q.x + 0.25 * g * g * x, (q.y - f) * n);
}
// How far out the barbs of a plume reach at u, 0 its foot to 1 its tip.
float frPlume(float u) { float x = sat(1.0 - u); return frS(-0.05, 0.22, u) * x * (1.6 - 0.6 * x) + 0.02; }
// What sounds along a feather or a blade: its kind, and the piece from its foot to its tip.
vec3 frSound(float kind, float u) {
  vec3 tint = uKind[int(kind)];
  float m = piece(vec2(0.02 + 0.96 * u, 0.84 - 0.2 * kind)).a;
  return mix(tint * tint, vec3(0.27, 0.42, 0.57), 0.28) * (0.65 * frLevel(kind) * exp(-2.0 * u) + 0.8 * m) * (0.3 + uEnergy);
}

// One feather at (s along, d aside): barbs at 60 degrees, barbs on the barbs. x the line of ice, y how much ice, zw its slope
// in (s, d); hn the numbers of the nearest facet and barb.
vec4 frFeather(float s, float d, float len, float plume, float seed, float px, out vec2 hn) {
  float sg = d < 0.0 ? -1.0 : 1.0, ad = abs(d);
  float s0 = s - ad * 0.577 - ad * ad * 0.35;
  float p1 = 0.012 + 0.008 * fract(seed * 0.618) + 0.010 * len;
  float w = s0 / p1 + 0.45 * sin(s0 * 15.0 + seed) + 0.12 * sin(s0 * 61.0 + seed * 3.0) + 0.5 * step(sg, 0.0);
  float i = floor(w), hb = hash21(vec2(i + seed * 11.0, 5.0 + sg));
  float c = (fract(w) - 0.5) * p1 * 0.866, ac = abs(c), sc = c < 0.0 ? -1.0 : 1.0;
  float t = ad * 1.1547, u0 = sat((i + 0.5) * p1 / len);
  float bl = plume * frPlume(u0) * (0.45 + 0.55 * sqrt(hb)) * (0.85 + 0.15 * sin(s0 * 23.0 + seed * 5.0 + sg));
  float k = sat(1.0 - t / max(bl, 1e-4)), on = frS(0.0, 0.06, k);
  vec2 e1 = vec2(0.866, -0.5 * sg), b1 = vec2(0.5, 0.866 * sg);
  // the barb
  float r1 = sat(1.0 - ac / (p1 * 0.1 * sqrt(k) + px * 0.75)) * on;
  // the barbs on it
  float p2 = p1 * (0.19 + 0.05 * hb);
  float w2 = (t - ac * 0.577) / p2 + 9.0 * hb + 0.5 * step(sc, 0.0);
  float h2 = hash21(vec2(floor(w2) + 37.0 * hb, i + seed * 3.0 + sc));
  float c2 = (fract(w2) - 0.5) * p2 * 0.866;
  float b2 = p1 * 0.62 * (0.5 + 0.5 * h2) * frS(0.0, 0.4, k + 0.04), k2 = sat(1.0 - ac * 1.1547 / max(b2, 1e-4));
  float see = frS(1.2, 3.0, p2 / px), in2 = frS(0.0, 0.2, k2) * on;
  float r2 = mix(0.45, sat(1.0 - abs(c2) / (p2 * 0.26 * (0.3 + 0.7 * k2) + px * 0.5)), see) * in2;
  vec2 e2 = e1 * (-0.5 * sc) + b1 * 0.866;
  // the stem
  float ws = (0.0025 + 0.0035 * len) * sat(1.1 - s / len) + px;
  float rs = sat(1.0 - ad / ws) * frS(len + 0.004, len - 0.02, s);
  hn = vec2(h2, hb);
  return vec4(sat(0.9 * r1 + 0.55 * r2 * (1.0 - r1) + rs), sat(in2 * 0.5 + on * exp(-ac / (p1 * 0.2)) * 0.4 + rs), e1 * sc * r1 + e2 * sign(c2) * r2 * 0.75 * see + vec2(0.0, sg) * rs);
}

// The garden out of focus before dawn: snow, dark trees, a paling sky, one lamp at l.
vec3 frGarden(vec2 p, vec2 l, float warm) {
  float y = p.y, x = p.x - l.x;
  vec3 c = mix(vec3(0.055, 0.12, 0.2), vec3(0.006, 0.018, 0.05), frS(-0.1, 0.45, y));
  c += vec3(0.2, 0.15, 0.1) * exp(-frSq((y + 0.03) / 0.06)) * (0.4 + 0.4 * uMic);
  float tree = -0.025 + 0.02 * sin(x * 13.0 + 1.0) + 0.01 * sin(x * 29.0) + 0.1 * frS(0.12, 0.4, x) + 0.1 * frS(-0.1, -0.35, x);
  c = mix(c, vec3(0.006, 0.016, 0.03), 0.9 * frS(0.04, -0.03, y - tree));
  // bare trunks
  const vec3 TR[5] = vec3[5](
    vec3(-0.4, 0.012, 0.05), vec3(-0.235, 0.008, -0.04), vec3(0.06, 0.010, 0.03), vec3(0.27, 0.007, -0.05), vec3(0.45, 0.013, 0.02));
  float wood = 0.0;
  if (y > -0.17) for (int i = 0; i < 5; i++) wood = max(wood, frS(0.016, -0.010, abs(x - TR[i].x - TR[i].z * y) - TR[i].y * (1.0 - 0.8 * y)));
  c = mix(c, vec3(0.005, 0.012, 0.024), 0.8 * wood * frS(-0.16, -0.12, y));
  float snow = frS(-0.1, -0.15, y + 0.015 * sin(x * 7.0));
  c = mix(c, mix(vec3(0.04, 0.085, 0.15), vec3(0.015, 0.035, 0.07), sat((-0.12 - y) * 3.0)), snow);
  float r2 = x * x + frSq(y - l.y), r = sqrt(r2);
  c = mix(c, vec3(0.004), 0.85 * frS(0.006, 0.0, abs(x) - 0.002) * frS(-0.155, -0.14, y) * step(y, l.y));   // its post
  c += vec3(1.0, 0.55, 0.19) * warm * (0.8 * exp(-r2 / 0.0016) + 0.22 * exp(-r2 / 0.012) + 0.05 * exp(-r2 / 0.07)
     + snow * (0.24 * exp(-frSq(x / 0.13) - frSq((y + 0.155) / 0.03)) + 0.05 * exp(-frSq(x / 0.3) - frSq((y + 0.15) / 0.08))));
  return mix(c, vec3(1.9, 1.3, 0.7) * (0.6 + 0.6 * warm), frS(0.013, 0.007, r));
}

vec3 frWindow(vec2 p, float px, float X) {
  vec2 lamp = vec2(0.25 * X, 0.0), ql = p - lamp;
  float warm = 0.6 + 0.5 * uLow * (0.5 + uEnergy) + 0.9 * uCue, S = mix(0.66, 1.0, frS(0.3, 0.9, X));
  // some of the growth keeps its own slow time, so a short loop does not shake the pane
  float front = mix(0.77, 1.05, 0.5 - 0.5 * cos(TAU * uLoop)) + 0.11 * sin(uTime * 0.055 - 0.4);
  // which two feathers got here first
  float T1 = 9.0, T2 = 9.0;
  int k1 = -1, k2 = -1;
  vec2 m1 = vec2(0.0), m2 = m1, d1 = vec2(1.0, 0.0), d2 = d1;
  for (int k = 0; k < FR_N; k++) {
    vec4 A = FR_A[k], B = FR_B[k];
    vec2 q = (p - vec2(A.x * X, A.y)) / S;
    float qx = dot(A.zw, q);
    if (qx < -0.1 || qx > B.w + 0.1) continue;
    q = vec2(qx, A.z * q.y - A.w * q.x);
    float f = frAside(q.x, B.x);
    if (abs(q.y - f) * 0.6 > B.y) continue;
    vec2 t, m = frBend(q, B.x, f, t);
    float ad = abs(m.y), s0 = m.x - ad * 0.577 - ad * ad * 0.35, u = s0 / B.w;
    if (u > 1.0 || ad * 1.1547 > B.y * frPlume(u)) continue;
    float T = B.z + s0 * 0.75 + ad * 1.3;
    if (T < T2) {
      vec2 d = vec2(A.z * t.x - A.w * t.y, A.w * t.x + A.z * t.y);
      if (T < T1) { T2 = T1; k2 = k1; m2 = m1; d2 = d1; T1 = T; k1 = k; m1 = m; d1 = d; }
      else { T2 = T; k2 = k; m2 = m; d2 = d; }
    }
  }
  vec2 g = vec2(0.0);
  float line = 0.0, body = 0.0, hn = 0.0;
  vec3 from = vec3(0.0);  // what sounds, from behind
  for (int j = 1; j >= 0; j--) {  // the later one lies under the first
    int k = j == 1 ? k2 : k1;
    if (k < 0) continue;
    vec2 m = j == 1 ? m2 : m1, d = j == 1 ? d2 : d1, h;
    vec4 B = FR_B[k];
    float ad = abs(m.y), T = B.z + (m.x - 0.577 * ad - 0.35 * ad * ad) * 0.75 + ad * 0.7;
    if (T > front + 0.012) continue;   // not grown yet
    vec4 f = frFeather(m.x, m.y, B.w, B.y, float(k) + 1.0, px / S, h);
    f *= frS(0.012, -0.012, T + ad * 1.3 * h.y - front)   // some barbs grow faster
       * (j == 1 ? 0.6 : 1.0);
    float over = sat(f.x * 1.2 + f.y * 0.35);
    g = g * (1.0 - over) + f.z * d + f.w * vec2(-d.y, d.x);
    line = line * (1.0 - over) + f.x; body = body * (1.0 - 0.6 * f.y) + 0.6 * f.y; hn = h.x;
    from = mix(from, frSound(float(k % 4), sat(m.x / B.w)), f.y);
  }
  // the thin breath of ice on the glass toward its edges
  float edge = max(abs(p.x) / (0.89 * X), abs(p.y) / 0.5);
  float film = edge < 0.29 ? 0.0 : frS(0.5, 1.15, edge + 0.35 * (noise(p * 4.0) - 0.4)) * (0.6 + 0.8 * uSpace);
  if (film > 0.001) film *= 0.12 + 0.16 * frGrain(p);
  vec3 col = frGarden(p + g * 0.012, lamp, warm);
  float r2 = dot(ql, ql), away = frSq(ql.x * 0.75 / X) + ql.y * ql.y;
  vec3 sky = mix(vec3(0.34, 0.5, 0.66), vec3(0.085, 0.19, 0.36), frS(0.02, 0.85, away));
  vec3 glow = vec3(1.0, 0.52, 0.18) * warm * (1.6 * exp(-r2 / 0.022) + 0.5 * exp(-r2 / 0.08) + 0.1 * exp(-r2 / 0.3));
  float toSky = dot(g, vec2(-0.5, 0.86)), toLamp = -dot(g, ql) / (sqrt(r2) + 0.05);
  // a hit: one fine crack runs over the glass, and the ice beside it catches its light
  float crack = 0.0, beside = 0.0;
  if (uHits > 0.004) {
    vec2 cq = rot(-0.45 - 0.5 * sin(uTime * 0.023)) * (p - vec2(0.12 * X, 0.12 * sin(uTime * 0.017)));
    float v = cq.x, y = abs(cq.y + 0.05 * abs(fract(v * 1.9 + 0.2) * 2.0 - 1.0) + 0.014 * abs(fract(v * 6.3) * 2.0 - 1.0) - 0.03);
    float head = mix(0.8, 0.12, uHits), on = frS(head + 0.01, head - 0.01, v) * frS(-0.95, -0.6, v) * (0.4 + exp(-max(head - v, 0.0) * 4.0)) * uHits;
    crack = on * frS(px * 1.8, 0.0, y);
    beside = on * exp(-y * 26.0) * (0.1 + 0.75 * sat(line));
  }
  vec3 c = sky * (0.9 + 0.55 * toSky) + glow * (0.6 + 0.5 * toLamp) + from * 1.2;
  col = mix(col, c * 0.45, sat(film + 0.62 * body));
  col = mix(col, c * mix(1.3, 1.95, uTone), sat(line) * 0.9);
  col += (crack * 1.2 + beside * 0.8) * (vec3(0.5, 0.7, 0.9) + uKind[4] * 0.4);
  float tw = frSq(sat(sin(TAU * (hn * 5.0 + p.x * 0.8 - p.y * 0.5) + uTime * 0.35)));
  tw *= tw * tw * frS(0.75, 1.0, fract(hn * 91.7));
  col += (vec3(0.6, 0.8, 1.0) + glow * 2.0) * tw * sat(line) * (0.3 + 1.6 * uHigh + uKeys) * 1.3;
  return screenOf(col);
}

// The blades of b from back to front, laid out as the feathers are: how it bends, how wide, whose sound lights it, how long.
// Number 4 is a dead leaf that hangs in from the right.
const vec4 FR_C[12] = vec4[12](
  vec4(-1.0, -0.64, 0.362, 0.932), vec4(0.3, -0.64, -0.129, 0.992), vec4(-0.3, -0.64, -0.049, 0.999),
  vec4(0.72, -0.64, -0.416, 0.909), vec4(1.06, 0.44, -0.961, -0.275), vec4(-0.8, -0.64, 0.454, 0.891),
  vec4(0.1, -0.64, -0.505, 0.863), vec4(-0.46, -0.64, 0.436, 0.9), vec4(-0.22, -0.64, 0.582, 0.813),
  vec4(0.4, -0.64, 0.436, 0.9), vec4(-0.6, -0.64, -0.276, 0.961), vec4(0.06, -0.64, 0.752, 0.659));
const vec4 FR_D[12] = vec4[12](
  vec4(-0.6, 0.016, 1.0, 0.94), vec4(0.4, 0.014, 3.0, 0.7), vec4(-0.5, 0.019, 2.0, 1.02),
  vec4(0.6, 0.015, 1.0, 0.6), vec4(0.6, 0.115, 3.0, 0.86), vec4(-0.95, 0.024, 2.0, 1.1),
  vec4(0.8, 0.02, 1.0, 0.76), vec4(-1.1, 0.03, 0.0, 1.26), vec4(-0.9, 0.023, 3.0, 0.94),
  vec4(-0.8, 0.02, 2.0, 0.62), vec4(0.7, 0.02, 0.0, 0.56), vec4(-0.6, 0.02, 1.0, 0.66));
// Needles along an edge at s, e beyond it; they lean forward.
float frNeedles(float s, float e, float pitch, float len, float lean, float seed, float px) {
  float w = (s - e * lean) / pitch, h = hash21(vec2(floor(w), seed)), l = max(len * (0.2 + 0.8 * h * h), 1e-4);
  float k = sat(1.0 - e / l), c = abs(fract(w) - 0.35 - 0.3 * h) * pitch;
  return sat(1.2 - c / (pitch * 0.18 * k + px * 0.7)) * frS(0.0, 0.12, k);
}

// All the needles of a blade or a leaf at m, e beyond its edge, u along it: how much ice, and its glint.
vec2 frEdge(vec2 m, float e, float u, float k, float big, float px) {
  float seed = k * 3.0 + (m.y < 0.0 ? 1.0 : 2.0), e0 = max(e + 0.004, 0.0);
  float gr = (m.y > 0.0 ? 1.0 : 0.6) * big * mix(0.66, 1.0, 0.5 - 0.5 * cos(TAU * uLoop)) * frS(0.0, 0.12, u) * (1.0 + 0.4 * sin(m.x * 37.0 + seed) * sin(m.x * 17.0 + seed * 2.0));
  float n = max(frNeedles(m.x, e0, 0.0046, 0.018 * gr, 0.25, seed, px), frNeedles(m.x, e0, 0.0080, 0.036 * gr, 0.65, seed + 20.0, px));
  n *= frS(-0.004, 0.0, e) * frS(1.04, 0.99, u - 0.3 * e0) * step(0.0, u);
  float tw = frSq(sat(sin(hash11(floor(m.x / 0.0080) + seed) * 31.4 + m.x * 3.8 + uTime * 0.37)));
  return vec2(n * mix(0.8, 1.0, uTone), tw * tw * tw);
}
vec3 frIce(vec2 p, float near, float warm, vec3 sound) {
  return mix(vec3(0.42, 0.58, 0.74), vec3(1.7, 1.25, 0.8) * warm, 0.08 + 0.85 * near) * mix(0.55, 1.15, frS(-0.5, 0.0, p.y)) + sound * 1.8;
}

// The dead leaf.
vec3 frLeaf(vec3 col, vec2 p, vec2 m, float near, float warm, float px) {
  vec4 B = FR_D[4];
  float ad = abs(m.y), u = m.x / B.w, v = sat(u);
  float e = ad - B.y * 2.1 * sqrt(v) * (1.0 - v) * (1.0 + 0.2 * v) - 0.003 * abs(fract(m.x * 42.0) * 2.0 - 1.0) * (1.0 - v);
  vec3 ice = frIce(p, near, warm, frSound(B.z, v));
  float vs = (m.x - ad * 0.75) / 0.042 + 0.5 * step(0.0, m.y), vn = abs(fract(vs) - 0.5) * 0.034;
  float vein = max(sat(1.2 - vn / 0.0022), sat(1.2 - ad / (0.0045 * (1.1 - v)))), grain = frGrain(m), spot = noise(m * 18.0 + 9.0);
  vec3 c = mix(vec3(0.13, 0.034, 0.012), vec3(0.85, 0.34, 0.07) * warm, sat(0.08 + 0.5 * v * v + 1.1 * near) * (0.3 + 0.9 * spot * (0.4 + grain))) * (1.0 - 0.5 * vein) * (1.0 - 0.65 * frS(0.62, 0.8, spot));
  c *= (m.y < 0.0 ? 0.72 : 1.0) * (0.7 + 0.3 * frS(0.0, 0.02, ad));
  float rime = vein * 0.55 * frS(0.3, 0.65, grain) + (0.15 + 0.6 * frS(-0.030, 0.0, e)) * frS(0.45, 0.75, grain);
  c = mix(c, ice * 0.75, rime) + ice * 0.6 * exp(-abs(e) * 420.0);
  col = mix(col, c, frS(px, -px, e) * frS(1.0, 1.0 - 2.0 * px, u));
  vec2 n = frEdge(m, e, u, 4.0, 1.35, px);
  return mix(col, ice * (0.75 + 40.0 * max(e + 0.004, 0.0)) + n.y * (0.3 + 1.8 * uHigh), n.x);
}

vec3 frGrass(vec2 p, float px, float X) {
  vec2 sun = vec2(-0.4 * X, 0.14);
  float warm = 0.7 + 0.4 * uLow * (0.5 + uEnergy) + 0.7 * uCue + 0.25 * uMic;
  float sr = frSq((p.x - sun.x) * 0.8) + frSq(p.y - sun.y), near = exp(-sr / 0.1);
  // a field at sunrise, far out of focus
  vec3 gold = vec3(1.0, 0.66, 0.36);
  vec3 col = mix(vec3(0.34, 0.5, 0.58), vec3(0.06, 0.15, 0.31), frS(0.0, 0.58, p.y));
  col = mix(col, gold * 0.95, min(warm, 1.3) * (0.55 * exp(-sr / 0.03) + (0.2 + 0.3 * uSpace) * exp(-sr / 0.16)));
  float trees = p.y - 0.045 - 0.03 * (1.0 + sin(p.x * 4.1 + 2.0)) - 0.015 * sin(p.x * 11.0) - 0.006 * sin(p.x * 31.0);
  col = mix(col, mix(vec3(0.07, 0.14, 0.21), gold * 0.45, 0.8 * exp(-sr / 0.05)), 0.8 * frS(0.035, -0.035, trees));
  vec3 field = mix(vec3(0.2, 0.31, 0.38), vec3(0.010, 0.028, 0.045), frS(0.0, -0.46, p.y));
  field = mix(field, gold * 0.5, 0.65 * exp(-frSq((p.x - sun.x) / 0.35) - frSq((p.y + 0.02) / 0.12)));
  col = mix(col, field, frS(0.02, -0.06, p.y + 0.02 + 0.01 * sin(p.x * 5.0)));
  col += vec3(1.0, 0.75, 0.45) * warm * (1.6 * exp(-sr / 0.0030) + 0.5 * exp(-sr / 0.015));
  for (int i = 0; i < 10; i++) {            // frost far off, each grain a disc of light; each follows a band
    float f = float(i), r = 0.012 + 0.034 * frSq(fract(f * 0.713 + 0.2));
    vec2 c = vec2((fract(f * 0.618 + 0.1) - 0.5) * 1.9 * X, -0.45 + 0.44 * fract(f * 0.382 + 0.37 * fract(f * 0.27)));
    float d = length(p - c);
    if (d > r) continue;
    float g = sat(1.0 - 1.4 * abs(c.x - sun.x)), b = frS(r, r - 0.007, d) * (0.6 + 0.5 * frS(0.4 * r, r, d));
    col += mix(vec3(0.35, 0.6, 0.85), vec3(1.0, 0.68, 0.36), g) * b * (0.1 + 0.16 * g + 0.22 * uBands[i + 3] * (0.4 + uEnergy)) * (0.75 + 0.25 * sin(uTime * 0.23 + f * 2.4));
  }
  float y = p.y + 0.6;
  for (int i = 0; i < 4; i++) {  // blades behind, soft
    float f = float(i), h = fract(f * 0.618 + 0.3), top = 0.5 + 0.45 * fract(f * 0.382 + 0.6);
    float at = (-0.85 + 0.42 * f + 0.1 * h) * X + (h - 0.5) * 0.55 * y * (1.0 + y) + 0.006 * sin(uTime * 0.2 + f) * y;
    float a = frS(0.016, -0.012, abs(p.x - at) - 0.014 * sat(1.0 - y / top)) * frS(top, top - 0.2, y);
    col = mix(col, vec3(0.03, 0.065, 0.07) + gold * 0.3 * warm * near * near, 0.75 * a);
  }
  // the leaf, then the three blades that lie foremost here
  vec3 at[3] = vec3[3](vec3(-9.0), vec3(-9.0), vec3(-9.0));  // along, aside, which
  vec2 lm = vec2(-9.0), stir = 0.010 * vec2(sin(uTime * 0.31), cos(uTime * 0.31));   // each stirs in its own time
  for (int k = 0; k < 12; k++) {
    vec4 A = FR_C[k], B = FR_D[k];
    vec2 q = p - vec2(A.x * X, A.y), t;
    if (k == 4) q -= vec2(0.7, 0.1) * (1.0 - min(X, 1.0));   // in a tall picture only its tip hangs in
    q = vec2(dot(A.zw, q), A.z * q.y - A.w * q.x);
    q.y -= dot(stir, A.zw) * q.x;
    vec2 m = frBend(q, B.x, frAside(q.x, B.x), t);
    float v = m.x / B.w, e = abs(m.y) - B.y * sat(1.0 - v) * (1.0 + 0.5 * v);
    if (k == 4) { lm = m; continue; }
    if (e > 0.028 || v < -0.05 || v > 1.06) continue;
    at[0] = at[1]; at[1] = at[2]; at[2] = vec3(m, float(k));
  }
  col = frLeaf(col, p, lm, near, warm, px);
  for (int j = 0; j < 3; j++) {
    if (at[j].z < 0.0) continue;
    vec2 m = at[j].xy;
    float fk = at[j].z;
    vec4 B = FR_D[int(fk)];
    float u = m.x / B.w, v = sat(u), w = B.y * (1.0 - v) * (1.0 + 0.5 * v), e = abs(m.y) - w, x = m.y / max(w, 1e-3);
    vec3 sound = frSound(B.z, v);
    float run = uHits * exp(-frSq((u - 0.98 + 0.55 * uHits) / 0.14)) * frS(0.4, 0.9, cos(uTime * 0.05 + fk * 1.885));   // a hit's light goes up it
    vec3 ice = frIce(p, near, warm, sound) + run * (vec3(1.5, 1.7, 1.9) + uKind[4]);
    // the blade, the sun behind it
    float fold = frS(-0.12, 0.12, x * sign(B.x)), grain = frGrain(p);
    vec3 c = mix(vec3(0.012, 0.040, 0.040), vec3(0.42, 0.4, 0.1) * warm, near * (0.3 + 0.7 * fold)) * (0.88 + 0.17 * cos(x * 16.0)) * (0.6 + 0.8 * fold) + sound * 0.1;
    float rime = frS(0.45, 1.0, abs(x)) * (0.3 + 0.6 * grain) + 0.5 * frS(0.6, 0.78, grain);
    c = mix(c, ice * 0.75, rime) + ice * 0.6 * exp(-abs(e) * 420.0);
    col = mix(col, c, frS(px, -px, e) * frS(1.0, 1.0 - 2.0 * px, u));
    vec2 n = frEdge(m, e, u, fk, 1.0, px) * vec2(1.0, 0.3 + 1.8 * uHigh + uKeys);
    col = mix(col, ice * (0.75 + 40.0 * max(e + 0.004, 0.0)) + n.y, n.x);
    col += run * exp(-max(e, 0.0) * 60.0) * 0.25 * vec3(0.7, 0.85, 1.0) * step(0.0, u);
  }
  // one blade close by, out of focus
  vec2 n = p - vec2(-0.98 * X, -0.6);
  float na = abs(n.y - 0.95 * n.x + 0.5 * n.x * n.x) - 0.028 * sat(1.0 - n.x / 0.62);
  col = mix(col, vec3(0.02, 0.05, 0.055) + gold * 0.1 * warm * near, 0.8 * frS(0.035, -0.02, na) * frS(0.66, 0.4, n.x));
  return screenOf(col);
}

vec3 render(vec2 p) {
  float px = 1.0 / uRes.y, X = clamp(0.5 * uRes.x / uRes.y, 0.28, 1.2) / 0.89;
  return uVar < 0.5 ? frWindow(p, px, X) : frGrass(p, px, X);
}
