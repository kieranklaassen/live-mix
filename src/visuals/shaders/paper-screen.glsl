// name: Paper screen
// a: Leaf shadow
// b: Lamp within
// what: A sliding screen of fibrous paper in a dark lattice, with the sun behind it: bamboo close by lies sharp on the paper, stalks and leaves further off are soft, and a bare branch reaches in; or night, the lamp inside, a jug with a budding branch and a steaming bowl vague behind the paper, and black leaves before it.
// follows: The phrase brings the bamboo, or the branch, close and sharp, pads the soft leaves or the jug, drones the far stalks or a low ember glow. Texture brings up fibre and steam; low is wind, the level sun or lamp. The piece tints the panes. A hit is a bird and its branch dips, or a moth; a cue is a cloud, or someone passing; the loop slants the sun.
float psPx, psT, psA, psGust, psPen; // the pixel; the sun and the sky that still get through; the wind; how soft distance makes a shadow
vec2 psSlant;                        // how far a shadow lies aside for each step away from the paper
vec2 psWood;                         // the lattice here: how much is wood, and its lit side

// Like smoothstep, and it may also run down.
float psS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
// A band of half width w at y, blurred by s.
float psStrip(float y, float w, float s) { return psS(-s, s, y + w) - psS(-s, s, y - w); }
// A thing h away from the paper keeps the sun off, and close by the light of the sky.
void psLay(float cover, float h, float dens) {
  psT *= 1.0 - cover * dens;
  psA *= 1.0 - cover * dens * 0.62 / (1.0 + 18.0 * h * (1.0 + h));
}
float psSoft(float h) { return psPx + psPen * h; }
vec2 psWind(vec2 at, float far) {
  vec2 w = sin(uTime * vec2(0.83, 0.61) + at.x * vec2(2.3, 1.7) + at.y * vec2(1.4, 3.1) + far);
  return psGust * vec2(w.x * (0.7 + 0.3 * w.y), 0.45 * w.y);
}
// A twig from a to b, bowed, thin toward b.
void psTwig(vec2 p, vec2 a, vec2 b, float bow, float w0, float h, float dens) {
  vec2 ab = b - a, n = vec2(-ab.y, ab.x);
  float l = dot(ab, ab), k = sat(dot(p - a, ab) / l), s = psSoft(h);
  if (dot(p - a - ab * k, p - a - ab * k) > 2.0 * (l * bow * bow + (s + w0) * (s + w0))) return;
  vec2 d = p - a - ab * k - n * bow * 4.0 * k * (1.0 - k);
  psLay(psStrip(length(d), mix(w0, w0 * 0.4, k), s), h, dens);
}
// Long leaves by turns along a twig from at, the way ax.
void psSpray(vec2 p, vec2 at, float ax, float sc, float fat, float h, float dens, float seed, int n) {
  vec2 way = vec2(cos(ax), sin(ax)), q = p - at, m = q - way * 0.08 * sc;
  float s0 = psSoft(h), R = 0.2 * sc + s0;
  if (dot(m, m) > R * R) return;
  float along = dot(q, way), k = clamp(along, 0.0, 0.1 * sc);
  psLay(psStrip(length(q - way * k), 0.0016 * sc * sc, s0), h, dens);
  vec2 beat = (0.06 + psGust * 8.0 + 0.16 * uHigh) * sin(uTime * vec2(0.83, 1.17) + seed * vec2(1.0, 1.7));
  for (int i = 0; i < n; i++) {
    float r = fract(seed * 0.7549 + float(i) * 0.5698), r2 = fract(r * 37.7), r3 = fract(r * 91.3);
    float u = float(i) / float(n - 1), side = u > 0.99 ? 0.15 : float(i & 1) * 2.0 - 1.0;
    float len = sc * (0.085 + 0.06 * r2 + 0.035 * u);
    vec2 o = q - way * 0.1 * sc * u;
    if (dot(o, o) > 1.7 * len * len) continue;
    float turn = side * (1.5 - 0.9 * u) + (r - 0.5) * 1.1 + dot(beat, vec2(r2, r3) - 0.5);
    vec2 v = way + vec2(-way.y, way.x) * turn - vec2(0.0, 0.4);  // the weight of the leaf
    v *= inversesqrt(dot(v, v) + 1e-4);
    vec2 d = vec2(dot(v, o), v.x * o.y - v.y * o.x) / len;
    if (d.x < -0.3 || d.x > 1.3 || abs(d.y) > 0.5) continue;
    float hl = h * (0.15 + 1.5 * r3 * r3), s = psSoft(hl * mix(1.5, 0.6, sat(d.x))) / len;
    d.y += (0.14 + 0.12 * r3) * v.x * d.x * d.x;
    float x = sat((d.x + s) / (1.0 + 2.0 * s));
    psLay(psStrip(d.y, fat * 2.6 * sqrt(x) * (1.0 - x) * (1.15 - 0.4 * x), s), hl, dens);
  }
}
// A spray far off, and one close by on its twig: its place, the way it points, how big.
void psFar(vec2 p, vec4 t, float h, float dens, float seed) {
  if (dot(p - t.xy, p - t.xy) > 0.12 * t.w * t.w) return;
  psSpray(p - 1.5 * psWind(t.xy, 1.0), t.xy, t.z, t.w, 0.072, h, dens, seed, 6);
}
void psNear(vec2 p, vec2 root, vec4 t, float h, float dens, float bow, float seed) {
  vec2 e = p - (root + t.xy) * 0.5, span = abs(t.xy - root) * 0.5;
  float reach = span.x + span.y + 0.26 * t.w;
  if (dot(e, e) > reach * reach) return;
  vec2 mv = psWind(t.xy, 0.0);
  psTwig(p, root + 0.4 * mv, t.xy + mv, bow, 0.003, h, dens);
  psSpray(p, t.xy + mv, t.z + mv.x * 3.0, t.w, 0.066, h, dens, seed, 6);
}
// A stalk: x = x0 + lean * y, jointed at y = first + k * gap.
void psStalk(vec2 p, float x0, float lean, float w, float first, float gap, float h, float dens) {
  float s = psSoft(h), x = p.x - x0 - lean * p.y;
  if (abs(x) > w * 1.5 + s + 0.02) return;
  x -= 0.02 * sin(p.y * 2.0 + x0 * 9.0);
  float j = abs(fract((p.y - first) / gap + 0.5) - 0.5) * gap;
  float ring = exp(-j * j / (0.00006 + 0.3 * s * s));
  float c = psStrip(x, w * (1.0 + 0.2 * ring), s);
  c *= 1.0 - 0.5 * exp(-j * j / (0.000006 + s * s)) * 0.004 / (0.004 + s);
  psLay(c, h, dens);
}
float psEll(vec2 p, vec2 r) { float k = length(p / r); return (k - 1.0) * min(r.x, r.y); }

// The wood: cells c wide and tall from o, with a broad upright every per cells.
void psLattice(vec2 p, vec2 c, vec2 o, float thin, float thick, float per) {
  vec2 g = (p - o) / c, k = floor(g + 0.5), d = p - o - k * c;
  float stile = 1.0 - step(0.5, abs(mod(k.x + 0.5, per) - 0.5));
  float wx = mix(thin, thick, stile), wy = thin;
  float bx = psS(psPx, -psPx, abs(d.x) - wx), by = psS(psPx, -psPx, abs(d.y) - wy);
  // the lit side of a bar
  float sx = clamp(-(p.x) * 0.012, -0.008, 0.008), sy = clamp(-(p.y) * 0.014, -0.006, 0.006);
  float lx = psS(psPx, -psPx, abs(d.x - sx * 0.5) - wx - abs(sx) * 0.5), ly = psS(psPx, -psPx, abs(d.y - sy * 0.5) - wy - abs(sy) * 0.5);
  psWood = vec2(max(lx, ly), max(lx * (1.0 - bx), ly * (1.0 - by)) * (1.0 - max(bx, by)));
}
// The paper: cloudy, with long fibres in it.
float psPaper(vec2 p, float much) {
  float cloud = noise(vec2(0.83 * p.x + 0.56 * p.y, 0.83 * p.y - 0.56 * p.x) * 11.0 + 3.0) * 0.65 + noise(vec2(0.62 * p.x + 0.78 * p.y, 0.62 * p.y - 0.78 * p.x) * 47.0) * 0.35, f = 0.0;
  vec2 v = p;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    v = mat2(0.2385, 0.9711, -0.9711, 0.2385) * v;
    vec2 q = v * vec2(5.0, 13.0) * (1.0 + 0.16 * fi) + 7.3 * fi;
    vec2 k = floor(q); q -= k + 0.5;
    float r = hash21(k + fi * 3.7), r2 = fract(r * 41.3), x = q.x + 0.2 * (r2 - 0.5);
    q.y += (r - 0.5) * 0.3 + (r2 - 0.5) * 3.4 * x * x + (fract(r * 93.1) - 0.5) * 0.3 * x * (1.0 + 9.0 * x * x);
    f += psS(0.4 * r2 + 1e-4, 0.1 * r2, abs(x)) * psStrip(q.y / 13.0, 0.0003 + 0.0009 * r2 * r * r, 0.0007 + psPx) * (0.3 + 0.7 * r);
  }
  return 1.0 + (cloud - 0.5) * 0.15 * (1.0 + much) - f * 0.28 * (0.3 + 0.7 * much);
}
// The dye of a pane: the colour of the piece at its place, and how strong.
vec4 psDye(vec2 p, vec2 c, vec2 o, float own, vec2 hitAt) {
  vec2 at = mix((floor((p - o) / c) + 0.5) * c + o, p, 0.3), near = (p - hitAt) / vec2(0.2, 0.16);
  vec4 m = piece(vec2(sat(at.x / 1.76 + 0.5), sat(0.5 - at.y / 0.9)));
  vec3 k = m.rgb / (m.a + 0.02);
  k = sqrt(max(k / (max(k.r, max(k.g, k.b)) + 0.02), 0.0));
  float much = sat(m.a * 1.5) * (0.3 + 0.2 * uEnergy) * (0.14 + 1.1 * psS(0.3, 0.75, own)), hit = 0.55 * uHits * exp(-dot(near, near));
  vec3 hk = sqrt(uKind[4] / (max(uKind[4].r, max(uKind[4].g, uKind[4].b)) + 0.02));
  return vec4(mix(k, hk, hit / (hit + much + 0.01)), much + hit);
}
float psSheet(float own) { return (0.97 + 0.04 * own) * (1.0 + 0.14 * uKeys * psS(0.45, 0.9, fract(own * 7.3))); }
// A small bird sitting at 0, facing left; leaving is how far it has gone off.
float psBird(vec2 p, float leaving) {
  p = rot(0.35) * p;
  float d = smin(psEll(p - vec2(0.0, 0.004), vec2(0.026, 0.0155)), length(p - vec2(-0.023, 0.014)) - 0.0105, 0.008);
  d = smin(d, psEll(p - vec2(-0.037, 0.013), vec2(0.007, 0.0026)), 0.003);
  d = smin(d, psEll(rot(0.12) * (p - vec2(0.041, -0.001)), vec2(0.026, 0.0042)), 0.008);
  vec2 w = rot(-0.5) * (p - vec2(0.012, 0.016 * leaving));
  return smin(d, psEll(w, vec2(0.016 + 0.03 * leaving, 0.006)), 0.006);
}
vec3 psDay(vec2 p) {
  const vec2 cell = vec2(0.236, 0.202), org = vec2(-0.502, -0.418);
  float sun = 0.83 + 0.17 * uLevel;
  // the sun behind it, and a cloud that passes over
  vec2 hot = p - vec2(0.26, 0.2) + psSlant * 0.8;
  float fall = exp(-dot(hot, hot) * (1.8 - 0.6 * uMic));
  float cloud = psS(0.5, 0.15, abs(p.x - 0.95 + 2.2 * (1.0 - uCue) + 0.15 * sin(p.y * 4.0 + 1.0))) * psS(0.0, 0.3, uCue);
  vec3 lit = mix(vec3(0.74, 0.65, 0.51), vec3(1.05, 0.99, 0.85), fall);
  float low = p.y - org.y;
  if (low < 0.0) {
    float g = noise(vec2(p.x * 3.0 + 0.7 * sin(p.y * 31.0), p.y * 110.0));
    vec3 board = vec3(0.15, 0.105, 0.072) * (0.6 + 0.7 * g) + lit * vec3(0.2, 0.15, 0.1) * exp(low * 22.0) * fall;
    return board * (1.0 - 0.7 * psStrip(low + 0.019, 0.001, psPx + 0.001));
  }
  psLattice(p, cell, org, 0.0034, 0.013, 3.0);
  vec3 wood = vec3(0.1, 0.075, 0.058);
  if (psWood.x > 0.99 && psWood.y < 0.01) return wood * (0.8 + 0.4 * noise(p * vec2(40.0, 8.0)));
  // the stalks and the leaves far off
  float hf = 0.75 + 0.35 * uSpace - 0.3 * uDrone, dd = 0.3 + 0.42 * uDrone;
  vec2 sh = psSlant * hf;
  psStalk(p + sh, -0.66, 0.07, 0.034, 0.1, 0.4, hf, dd);
  psStalk(p + sh, -0.14, -0.05, 0.018, 0.2, 0.33, hf * 0.8, dd * 0.8);
  psStalk(p + sh, 0.98, 0.12, 0.03, 0.0, 0.37, hf, dd);
  psStalk(p + sh, -1.12, -0.05, 0.03, 0.0, 0.37, hf, dd);
  float hp = 0.75 + 0.3 * uSpace - 0.5 * uPad;
  vec2 pf = p + psSlant * hp;
  float df = 0.3 + 0.42 * uPad;
  psFar(pf, vec4(-0.78, 0.42, -0.9, 1.9), hp, df, 1.0); psFar(pf, vec4(-0.36, 0.5, -2.2, 1.8), hp, df, 4.1);
  psFar(pf, vec4(-1.0, 0.1, -0.6, 2.0), hp, df, 7.2); psFar(pf, vec4(0.98, -0.16, -2.3, 1.9), hp, df, 10.3);
  psFar(pf, vec4(0.06, -0.06, -2.1, 1.7), hp, df, 13.4); psFar(pf, vec4(-0.36, 0.22, -0.7, 1.6), hp, df, 16.5);
  // the bamboo close to the paper
  float hn = 0.14 - 0.1 * uPhrase, dn = 0.72 + 0.27 * uPhrase;
  vec2 pn = p + psSlant * hn;
  psStalk(pn - 0.3 * psWind(vec2(0.5, 0.0), 0.0), 0.5, -0.07, 0.018, 0.14, 0.32, hn, dn);
  psStalk(pn - 0.3 * psWind(vec2(0.7, 0.0), 0.0), 0.655, 0.09, 0.012, 0.28, 0.27, hn * 2.5, dn * 0.8);
  if (p.x > -0.32) {
    psNear(pn, vec2(0.49, 0.14), vec4(0.3, 0.27, -2.6, 1.1), hn * 0.4, dn, -0.021, 20.0);
    psNear(pn, vec2(0.49, 0.14), vec4(0.63, 0.24, -0.1, 1.0), hn * 1.265, dn, 0.0049, 22.7);
    psNear(pn, vec2(0.465, 0.46), vec4(0.24, 0.44, -2.75, 1.15), hn * 0.73, dn, 0.0308, 25.4);
    psNear(pn, vec2(0.3, 0.27), vec4(0.15, 0.17, -2.9, 1.0), hn * 1.596, dn, -0.0133, 28.1);
    psNear(pn, vec2(0.515, -0.18), vec4(0.4, -0.06, -2.3, 1.1), hn * 1.061, dn, 0.0126, 30.8);
    psNear(pn, vec2(0.515, -0.18), vec4(0.64, -0.06, -0.4, 1.15), hn * 0.526, dn, 0.0385, 33.5);
    psNear(pn, vec2(0.465, 0.46), vec4(0.4, 0.37, -1.9, 1.0), hn * 1.391, dn, -0.0056, 36.2);
    psNear(pn, vec2(0.63, 0.24), vec4(0.8, 0.2, -0.9, 1.0), hn * 0.856, dn, 0.0203, 38.9);
    psNear(pn, vec2(0.24, 0.44), vec4(0.03, 0.42, -2.6, 1.0), hn * 1.722, dn, 0.0462, 41.6);
    psNear(pn, vec2(0.3, 0.27), vec4(0.24, 0.13, -1.7, 0.95), hn * 1.187, dn, 0.0021, 44.3);
    psNear(pn, vec2(0.465, 0.46), vec4(0.56, 0.45, -0.5, 1.0), hn * 0.652, dn, 0.028, 47.0);
    psNear(pn, vec2(0.4, -0.06), vec4(0.31, -0.13, -2.8, 0.9), hn * 1.517, dn, -0.0161, 49.7);
  }
  // a bare bent branch from the left, where the bird comes down
  float c = uHits, dip = 4.0 * c * (1.0 - c), hb = 0.2;
  vec2 pb = p + psSlant * hb - 0.6 * psWind(vec2(-0.5, 0.0), 0.5);
  pb.y += dip * 0.035 * psS(-1.0, -0.2, p.x);
  float by = -0.06 + 0.05 * sin(pb.x * 4.1 + 0.5) + 0.03 * (abs(fract(pb.x * 2.3 + 0.2) - 0.5) - 0.25) + 0.01 * sin(pb.x * 17.0);
  float sb = psSoft(hb), bw = 0.016 * psS(-0.14, -0.9, pb.x) + 0.003;
  psLay(psStrip((pb.y - by) * 0.95, bw, sb) * psS(-0.15, -0.19, pb.x), hb, 0.88);
  psTwig(pb, vec2(-0.56, -0.045), vec2(-0.4, 0.12), 0.1, 0.005, hb, 0.85);
  psTwig(pb, vec2(-0.45, -0.02), vec2(-0.28, -0.18), -0.08, 0.004, hb, 0.85);
  psTwig(pb, vec2(-0.8, -0.03), vec2(-0.7, 0.13), -0.1, 0.006, hb, 0.85);
  const vec2 perch = vec2(-0.335, -0.065);
  float gone = 1.0 - c;
  vec2 pq = pb - perch - gone * vec2(-0.05, 0.11);
  if (dot(pq, pq) < 0.03) {
    float hq = 0.04 + 0.5 * gone, sq = psSoft(hq);
    psLay(psS(sq, -sq, psBird(pq / 1.5, gone) * 1.5) * psS(0.0, 0.5, c), hq, 0.95);
  }
  // light
  float T = mix(psT, 0.7, cloud * 0.5) * (1.0 - 0.6 * cloud);
  vec3 shade = mix(vec3(0.36, 0.375, 0.385), vec3(0.54, 0.51, 0.46), fall) * (0.35 + 0.65 * psA);
  vec3 col = mix(shade, lit, T * sun * (0.72 + 0.28 * fall));
  col *= psPaper(p, 0.2 + 0.8 * uTexture);
  float own = hash21(floor((p - org) / cell) + 5.0);
  vec4 dye = psDye(p, cell, org, own, perch + vec2(0.02, 0.03));
  vec3 tint = mix(vec3(1.0), dye.rgb, dye.a * 0.75) * (1.0 + 0.05 * uTexture);
  col *= tint * psSheet(own);
  wood = mix(wood, lit * tint * 0.45, psWood.y * 0.8);
  col = mix(col, wood, psWood.x);
  return col;
}
// A jug on the table: how wide it is at u, 0 its foot, 1 its lip.
float psJug(float u) {
  float b = (u - 0.36) / 0.4, body = max(1.0 - b * b, 0.0), neck = 0.017 + 0.009 * psS(0.85, 1.0, u);
  return sqrt(0.0064 * pow(body, 1.35) + neck * neck + 0.0009 * psS(0.12, 0.0, u));
}
// Leaves outside, black against it.
vec3 psOutside(vec2 p, vec3 col) {
  psT = 1.0;
  const vec4 spray[4] = vec4[4](vec4(-0.8, 0.4, -0.5, 1.25), vec4(-0.6, 0.46, -0.9, 1.1), vec4(-0.9, 0.22, -0.7, 1.2), vec4(0.84, 0.46, -2.3, 1.1));
  const vec2 root[4] = vec2[4](vec2(-1.1, 0.5), vec2(-0.8, 0.56), vec2(-1.1, 0.34), vec2(1.0, 0.6));
  for (int i = 0; abs(p.x) > 0.3 && i < 4; i++) {
    vec2 mv = psWind(spray[i].xy, 0.0), at = spray[i].xy + mv;
    psTwig(p, root[i] + 0.4 * mv, at, 0.06, 0.004, 0.02, 1.0);
    psSpray(p, at, spray[i].z + mv.x * 3.0, spray[i].w, 0.064, 0.02, 1.0, 50.0 + float(i) * 2.7, 7);
  }
  return screenOf(mix(vec3(0.0015, 0.0025, 0.003), col, psT));
}
vec3 psNight(vec2 p) {
  const vec2 cell = vec2(0.134, 0.2105), org = vec2(-0.464, -0.4);
  vec2 lampAt = vec2(0.29 + 0.012 * sin(uTime * 0.05), -0.07);
  float lit = (0.6 + 0.4 * uLevel + 0.15 * uMic) * (1.0 - 0.15 * uCue);
  // the boards before the screen
  float low = p.y - org.y + 0.004;
  if (low < 0.0) {
    float g = noise(vec2(p.x * 3.0, p.y * 90.0)), side = p.x - lampAt.x;
    float seam = psS(0.0, 0.004, abs(fract(p.x / 0.31 + 0.2) - 0.5) * 0.31);
    vec3 fl = vec3(0.9, 0.4, 0.12) * lit * 0.16 * exp(low * 14.0 + 0.42 - 5.0 * side * side) * (0.5 + g) * psS(-0.02, -0.032, low);
    return screenOf(vec3(0.002, 0.0018, 0.002) + fl * (0.4 + 0.6 * seam));
  }
  psLattice(p, cell, org, 0.0032, 0.014, 4.0);
  if (psWood.x > 0.99 && psWood.y < 0.01) return psOutside(p, vec3(0.004, 0.003, 0.0025));
  // things on a low table
  float hv = 0.5 - 0.4 * uPad + 0.15 * uSpace, sv = psSoft(hv), ty = -0.292;
  vec2 aside = vec2(0.25 * psSlant.x, 0.0), q = p - vec2(-0.17, ty) - aside;
  if (abs(q.x) < 0.2) {
    float v = psStrip(q.x, 1.15 * psJug(sat(q.y / 0.31)), sv) * psS(-sv, sv, q.y) * psS(sv, -sv, q.y - 0.31);
    psLay(v, hv, 0.66 + 0.3 * uPad);
  }
  psLay(psStrip(p.y - ty + 0.012, 0.012, sv) * psStrip(p.x - 0.18, 0.62, sv), hv, 0.85);
  psLay(psStrip(abs(p.x - 0.18) - 0.55, 0.012, sv) * psS(sv, -sv, p.y - ty), hv, 0.8);
  float hb = 0.4 - 0.36 * uPhrase + 0.1 * uSpace, db = 0.5 + 0.48 * uPhrase;
  vec2 pb = p - aside;
  float nod = 4.0 * uHits * (1.0 - uHits);
  pb.y += (0.012 * nod + 0.3 * psWind(vec2(0.0), 0.0).y) * psS(-0.05, -0.6, p.x);
  const int B = 10;
  const vec4 bough[B] = vec4[B](vec4(-0.17, -0.02, -0.145, 0.095), vec4(-0.145, 0.095, -0.245, 0.17), vec4(-0.245, 0.17, -0.215, 0.275), vec4(-0.215, 0.275, -0.295, 0.39), vec4(-0.245, 0.17, -0.4, 0.165),
    vec4(-0.4, 0.165, -0.49, 0.235), vec4(-0.49, 0.235, -0.66, 0.205), vec4(-0.145, 0.095, -0.055, 0.15), vec4(-0.055, 0.15, -0.02, 0.265), vec4(-0.4, 0.165, -0.485, 0.085));
  bool by = p.x < 0.12 && p.y > -0.12;
  for (int i = 0; by && i < B; i++) psTwig(pb, bough[i].xy, bough[i].zw, 0.05 - 0.1 * float(i & 1), i < 2 ? 0.011 - 0.002 * float(i) : 0.006, hb, db);
  const vec3 bud[9] = vec3[9](vec3(-0.297, 0.395, 0.018), vec3(-0.21, 0.29, 0.012), vec3(-0.018, 0.268, 0.018), vec3(-0.055, 0.155, 0.011), vec3(-0.665, 0.202, 0.018), vec3(-0.56, 0.228, 0.013), vec3(-0.49, 0.08, 0.016), vec3(-0.335, 0.175, 0.013), vec3(-0.25, 0.34, 0.01));
  for (int i = 0; by && i < 9; i++) {
    vec2 d = pb - bud[i].xy;
    float l = dot(d, d);
    if (l > 0.012) continue;
    float lobes = l > 1e-7 ? cos(5.0 * atan(d.y, d.x) + float(i)) : 0.0, s = psSoft(hb);
    psLay(psS(s, -s, sqrt(l) - (0.75 + 0.6 * uPhrase) * bud[i].z * (1.0 + 0.14 * lobes)), hb, db * 0.85);
  }
  // a bowl, and a thread of steam
  vec2 w = p - vec2(0.5, ty) - aside;
  float sw = psSoft(0.2);
  psLay(psStrip(w.x, 0.02 + 0.045 * sqrt(sat(w.y / 0.06)), sw) * psS(-sw, sw, w.y) * psS(sw, -sw, w.y - 0.06), 0.2, 0.85);
  float up = w.y - 0.06, steam = 0.0;
  if (up > 0.0 && up < 0.5 && abs(w.x) < 0.22) {
    for (int k = 0; k < 2; k++) {
      float fk = float(k) * 2.0 - 1.0;
      float xc = 0.02 * fk + (0.012 + 0.1 * up) * sin(up * 11.0 - uTime * 0.55 + fk * 1.1) + 0.04 * up * sin(up * 23.0 - uTime * 0.8 + fk);
      float wd = 0.012 + 0.055 * up, e = (w.x - xc) / wd;
      steam += exp(-e * e) * psS(0.0, 0.05, up) * psS(0.5, 0.1, up) * 0.65;
    }
    psLay(min(steam, 1.0), 0.5, 0.26 + 0.4 * uTexture);
  }
  // someone goes by
  float away = 1.0 - uCue;
  if (uCue > 0.004) {
  vec2 m = (p - vec2(0.8 - 0.9 * away, 0.0)) / 1.3;
  m.x += 0.09 * m.y;
  float wb = 0.026 + (0.047 - 0.012 * psStrip(m.y + 0.1, 0.03, 0.06)) * sqrt(psS(0.14, 0.06, m.y));
  float who = max(psStrip(m.x, wb, 0.03) * psS(0.03, -0.03, m.y - 0.17), psS(0.028, -0.026, psEll(m - vec2(-0.004, 0.17), vec2(0.038, 0.048))));
  psLay(who * psS(0.0, 0.35, uCue) * psS(0.0, 0.12, away), 0.5, 0.8);
  }
  // a moth on the paper
  const vec2 perch = vec2(0.15, 0.13);
  vec2 mq = rot(0.6) * (p - perch - (1.0 - uHits) * vec2(0.06, 0.05)) / 1.5;
  mq.x = abs(mq.x);
  if (dot(mq, mq) < 0.01) {
    float hm = 0.01 + 0.3 * (1.0 - uHits), sm = psSoft(hm);
    float d = min(psEll(rot(0.55) * (mq - vec2(0.018, 0.004)), vec2(0.021, 0.0095)), psEll(rot(-0.5) * (mq - vec2(0.012, -0.011)), vec2(0.013, 0.008)));
    d = min(d, psEll(mq, vec2(0.0035, 0.015)));
    psLay(psS(sm, -sm, d) * psS(0.0, 0.5, uHits), hm, 0.9);
  }
  // light
  vec2 l = (p - lampAt) * vec2(1.0, 1.1);
  float r2 = dot(l, l), L = lit * (1.35 / (1.0 + 34.0 * r2) + 0.27 * exp(-4.2 * r2)), T = 0.055 + 0.945 * psT;
  L *= T;
  vec2 ld = p - vec2(-0.66, -0.3);
  vec3 col = vec3(1.75 * L, 0.84 * L * sqrt(L), 0.36 * L * L);
  col += mix(vec3(0.6, 0.15, 0.04), uKind[0] * uKind[0], 0.2) * 0.3 * uDrone * exp(-5.0 * dot(ld, ld)) * (0.3 + 0.7 * psT);
  col += vec3(0.012, 0.006, 0.006);
  col *= 1.0 + steam * (0.7 + 1.2 * uTexture) * psS(0.015, 0.12, r2);
  float paper = psPaper(p, 0.2 + 0.5 * uTexture), own = hash21(floor((p - org) / cell) + 5.0);
  vec4 dye = psDye(p, cell, org, own, perch);
  float lum = dot(col, vec3(0.4, 0.45, 0.15));
  col = mix(col, dye.rgb * dye.rgb * dye.rgb * vec3(1.15, 0.95, 0.75) * (1.4 * lum + 0.022 * psT), sat(dye.a * 1.45));
  col += vec3(0.5, 0.3, 0.15) * uHits * exp(-dot(p - perch, p - perch) * 40.0) * T;
  col *= paper * paper * psSheet(own);
  vec3 wood = vec3(0.0025, 0.002, 0.002) + col * 0.015;
  col = mix(col, wood, max(psWood.x - psWood.y, 0.0));
  return psOutside(p, col);
}
vec3 render(vec2 p) {
  psPx = 0.75 / uRes.y;
  psT = 1.0; psA = 1.0; psWood = vec2(0.0);
  psPen = 0.05 * (1.35 - 0.7 * uTone);
  psGust = (0.004 + 0.016 * uLow) * (0.75 + 0.25 * sin(uTime * 0.17 + p.x));
  psSlant = vec2(0.05 * sin(TAU * uLoop) + 0.05 * sin(uTime * 0.013), 0.02 * cos(TAU * uLoop)) * (0.6 + 0.8 * uSpace);
  return uVar < 0.5 ? psDay(p) : psNight(p);
}
