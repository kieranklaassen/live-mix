// name: Crystal hall
// a: Great beams
// b: Geode
// what: A hot dark cave of crystal beams thick as trees, leaning from wall to wall over rust-brown rock, milky and veiled inside, lit from behind by a hidden lamp; far in, one small figure by a small warm light. Or the mouth of a geode close up: a grey rind round a hollow of short pointed crystals, smoke to violet to clear.
// follows: Each kind of sound lights one beam from its foot, the spectrum climbs the beams as faint planes, the low band feeds the small far light; a hit lights the crystal point at the right, a cue swings the hidden lamp behind the beams and back, keys light the small tip. In the geode each kind lights a quarter, a hit flares one cluster, a cue swings the lamp across.
const int chN = 10;
// The beams: two of three faces, their middle and half length, half widths and the slant of the points.
#define CH_LONG(F)  \
  F(0.0, vec3(-0.689, -0.046, -0.724), vec3(-0.694, -0.719, 0.016), vec4(-7.522, -1.062, 7.007, 11.129), vec4(0.860, 0.740, 0.980, 0.0)) \
  F(1.0, vec3(0.291, -0.837, 0.463), vec3(0.598, -0.649, -0.470), vec4(3.686, -7.642, 2.565, 14.976), vec4(0.660, 0.800, 0.600, 0.0)) \
  F(2.0, vec3(-0.636, 0.045, -0.771), vec3(-0.947, -0.300, 0.115), vec4(-4.165, 5.831, 6.734, 6.311), vec4(0.500, 0.400, 0.460, 0.0)) \
  F(3.0, vec3(-0.419, -0.157, 0.894), vec3(0.546, -0.375, 0.750), vec4(6.642, 11.689, 7.984, 6.962), vec4(0.520, 0.620, 0.500, 0.0)) \
  F(5.0, vec3(-0.019, -0.776, 0.630), vec3(-0.320, -0.893, -0.317), vec4(9.761, -3.712, -4.362, 11.037), vec4(0.460, 0.400, 0.520, 0.0)) \
  F(6.0, vec3(-0.576, -0.392, -0.717), vec3(-0.588, -0.783, 0.203), vec4(-13.808, 3.889, 8.891, 8.844), vec4(0.420, 0.500, 0.440, 0.0)) \
  F(7.0, vec3(-0.145, -0.473, 0.869), vec3(0.417, -0.895, 0.158), vec4(3.511, -2.786, 2.180, 5.170), vec4(0.500, 0.460, 0.560, 0.0)) \
  F(8.0, vec3(0.076, -0.475, 0.877), vec3(0.751, -0.641, 0.158), vec4(12.026, -4.285, 5.924, 7.030), vec4(0.400, 0.460, 0.360, 0.0))
#define CH_TIPS(F)  \
  F(4.0, vec3(0.565, -0.522, -0.639), vec3(0.492, -0.811, 0.316), vec4(-3.788, 3.530, -12.836, 7.734), vec4(0.340, 0.280, 0.380, 1.5)) \
  F(9.0, vec3(0.878, -0.311, 0.363), vec3(0.691, -0.377, -0.617), vec4(1.106, -4.664, -3.681, 1.120), vec4(0.260, 0.220, 0.300, 0.9))
vec3 chA[chN], chB[chN]; vec4 chC[chN], chW[chN];
vec3 chKey, chFar, chKeyC, chFarC; // the lamp, the small warm light far in, and how strong they are
bool chGeo;
const float chG = 4.5; // how large the geode is

// Noise, with its slope in yzw.
vec4 chNoiseD(vec3 p) {
  vec3 i = floor(p), f = p - i, d = 6.0 * f * (1.0 - f); f = f * f * (3.0 - 2.0 * f);
  uvec3 k = uvec3(ivec3(i)) * uvec3(1597334677u, 3812015801u, 2798796415u);
  uint n = k.x + k.y + k.z;
  uvec4 a = uvec4(0u, 1597334677u, 3812015801u, 1114383182u) + n, b = a + 2798796415u;
  a = (a ^ (a >> 15)) * 742121581u; b = (b ^ (b >> 15)) * 742121581u;
  vec4 A = vec4(ivec4(a >> 8)), B = vec4(ivec4(b >> 8)) - A, h = A + B * f.z;
  vec2 g = mix(h.xz, h.yw, f.x), z = mix(B.xz, B.yw, f.x);
  return vec4(mix(g.x, g.y, f.y), d * vec3(mix(h.y - h.x, h.w - h.z, f.y), g.y - g.x, mix(z.x, z.y, f.y))) * 5.9604645e-8;
}
float chNoise(vec3 p) { return chNoiseD(p).x; }
// Where a ray goes into three pairs of faces and comes out again.
vec2 chSpan(vec3 o, vec3 d, vec3 w) {
  vec3 m = 1.0 / (d + 1.3e-6), k = abs(m) * w, c = m * o, a = -c - k, b = k - c;
  return vec2(max(a.x, max(a.y, a.z)), min(b.x, min(b.y, b.z)));
}
// The same, cut to a point at the end.
vec2 chPoint(vec2 r, vec3 o, vec3 d, vec3 u, vec3 n, vec4 c, float s) {
  vec3 x = cross(u, n) * 1.1547, g = 0.7 * u - 0.6 * (n - 0.5 * u) * 1.1547;
  float O = dot(o, x) - c.z, D = dot(d, x), oy = dot(o, u) - c.x, oz = (dot(o, n) - c.y - 0.5 * oy) * 1.1547;
  vec2 o2 = vec2(O + s * oy, O - s * (0.7 * oy - 0.6 * oz)), d2 = vec2(D + s * dot(d, u), D - s * dot(d, g)) + 1.3e-6;
  vec2 m = 1.0 / d2, k = abs(m) * c.w, a = -m * o2 - k, b = k - m * o2;
  return vec2(max(r.x, max(a.x, a.y)), min(r.y, min(b.x, b.y)));
}
// The hall without its roughness, and with it; in the geode the broken face of the rind.
float chRock(vec3 q, out vec3 slope) {
  vec4 n = chNoiseD(q * (chGeo ? 0.8 : 0.62));
  vec3 e = (q - vec3(0.0, 1.0, 9.0)) / vec3(10.5, 5.8, 15.5), g = e / vec3(10.5, 5.8, 15.5);
  float l = length(e), m = 1.0 / (length(g) + 1e-4), d = (1.0 - l) * l * m, f = q.y + 2.75 - 0.022 * q.x * q.x, h = sat(0.5 + 0.2 * (d - f));
  slope = chGeo ? vec3(0.0, 0.0, -1.0) - 0.32 * n.yzw : mix(-g * m, vec3(-0.044 * q.x, 1.0, 0.0), h) - 1.2 * n.yzw;
  return chGeo ? 0.5 - q.z - 0.4 * n.x : mix(d, f, h) - 2.5 * h * (1.0 - h) - 1.94 * (n.x - 0.42);
}
// What a ray sees of the lamps alone.
vec3 chEnv(vec3 q, vec3 d) {
  vec3 l1 = chKey - q, l2 = chFar - q;
  float s1 = dot(l1, l1), s2 = dot(l2, l2), a = max(dot(d, l2), 0.0), b = max(dot(d, l1), 0.0);
  a = a * a / s2; b = b * b / s1; float b4 = b * b * b * b;
  return chFarC * (0.02 + 0.2 * a + a * a * a) / (6.0 + s2) + chKeyC * (0.01 + 0.15 * b + 2.0 * b4 * b4 * b4) / (6.0 + s1) + vec3(0.020, 0.020, 0.024) * (1.1 + d.y);
}
// Light in the air round a lamp, along a ray as far as t.
float chAir(vec3 ro, vec3 rd, float t, vec3 l) {
  vec3 o = l - ro; float b = dot(o, rd), h = sqrt(max(dot(o, o) - b * b, 0.004)), u = t - b;
  return (u / (0.64 * h + abs(u)) + b / (0.64 * h + abs(b))) * 1.57 / h;
}
// One ray through every beam: the nearest, the next, and how much crystal lies within len.
#define CH_TAKE(I) th += max(0.0, min(s.y, len) - max(s.x, 0.02)); h = vec3(s.x + 1e4 * (step(s.y, s.x) + step(s.x, 0.1)), s.y - s.x, I); n = step(h.x, b1.x); b2 = mix(mix(b2, h, step(h.x, b2.x)), b1, n); b1 = mix(b1, h, n);
#define CH_MEET(A, B, C, W) f = vec2(dot(o, A), dot(o, B)) - C.xy; g = vec2(dot(d, A), dot(d, B)); s = chSpan(vec3(f, f.x - f.y), vec3(g, g.x - g.y), W.xyz);
#define CH_BEAM(I, A, B, C, W) CH_MEET(A, B, C, W) CH_TAKE(I)
#define CH_TIP(I, A, B, C, W) CH_MEET(A, B, C, W) s = chPoint(s, o, d, A, B, C, W.w); CH_TAKE(I)
#define CH_PUT(I, A, B, C, W) chA[int(I)] = A; chB[int(I)] = B; chC[int(I)] = C; chW[int(I)] = W;
// The edge of the geode's mouth: below 0 in the hollow.
float chMouth(vec2 m) {
  vec2 u = m / (length(m) + 1e-4);
  return length(m) - 0.87 + 0.06 * u.x * (4.0 * u.x * u.x - 3.0) + 0.04 * u.y * u.x + 0.1 * abs(fract(m.x * 2.0 + 0.6 * m.y) - 0.5) * abs(fract(m.y * 2.7 - 0.4 * m.x) - 0.5);
}
// One crystal of the geode: its point, the way it points, a way across it; its height.
float chTooth(vec2 id, out vec3 tip, out vec3 ax, out vec3 e1) {
  float k = hash21(id + 5.0); vec4 h = fract(k * vec4(17.3, 91.7, 53.9, 233.1)), g = (id.xyxy + vec4(0.15, 0.15, 0.3, 0.3) + vec4(0.7, 0.7, 0.4, 0.4) * h) * 0.165;
  vec2 r = min(vec2(dot(g.xy, g.xy), dot(g.zw, g.zw)), 3.0), c = sqrt(1.0 - 0.25 * r);
  vec3 b = vec3(g.xy * c.x, 1.0 - 0.5 * r.x);
  tip = vec3(g.zw * c.y, 1.0 - 0.5 * r.y) * (1.0 - (0.24 + 0.17 * k * k + 0.08 * step(0.88, h.x)) * (1.1 - smoothstep(1.8, 2.2, r.x))) - b;
  float tall = length(tip);
  ax = tip / tall; tip += b;
  e1 = normalize(cross(ax, vec3(h.xy - 0.5, 0.7)));
  return tall;
}

vec3 render(vec2 p) {
  chGeo = uVar > 0.5;
  CH_LONG(CH_PUT) CH_TIPS(CH_PUT)
  float tv = uTravel * 0.03, cp = 4.0 * uCue * (1.0 - uCue), sway = sin(uTime * 0.05), tR; vec2 wander = sin(uTime * vec2(0.31, 0.23));
  vec3 ro = vec3(0.35 * sin(tv), 0.12 * sin(tv * 0.7 + 1.0), 0.4 * sin(tv * 0.43)), rd = vec3(p.x - 0.03 * sin(tv), p.y + 0.03, 1.0);
  chKeyC = mix(vec3(1.0, 0.95, 0.86), vec3(0.8, 0.95, 1.15), uTone) * (46.0 + 18.0 * uLevel + 16.0 * uCue);
  chFarC = vec3(1.0, 0.56, 0.22) * (8.0 + 12.0 * uLow + 3.0 * uMic);
  chKey = vec3(-0.9 + 0.5 * sway, 2.5, 14.6) + cp * vec3(4.0, -1.2, 0.0); chFar = vec3(-3.25, -1.5, 14.6);
  if (chGeo) {
    ro = chG * vec3(0.2 + 0.1 * sin(tv), 0.14 + 0.05 * sin(tv * 0.7), -2.1);
    rd = vec3((p.x + 0.2) / 1.6 - ro.x / chG / 2.3, (p.y + 0.07) / 1.2 - ro.y / chG / 2.3, 1.0);
    chKey = vec3(-4.6 + 0.5 * sway, 4.6, -3.4) + cp * vec3(8.0, 1.0, 0.0); chKeyC *= 1.15; chFar = vec3(1.6, -1.2, 4.4); chFarC *= 0.25;
  }
  rd = normalize(rd);
  // the rock
  vec3 er = vec3(9.2, 4.5, 14.1), eo = (ro - vec3(0.0, 1.0, 9.0)) / er, ed = rd / er;
  float ea = dot(ed, ed), eb = dot(eo, ed), ec = dot(eo, eo) - 1.0;
  tR = (sqrt(max(eb * eb - ea * ec, 0.0)) - eb) / ea;
  if (rd.y < -0.01) tR = min(tR, (-1.4 - ro.y) / rd.y);
  vec3 slope;
  for (int k = 0; k < 6; k++) { float d = chRock(ro + rd * tR, slope); if (abs(d) < 0.003 * tR || chGeo) break; tR += d / clamp(-dot(slope, rd), 0.5, 1.0); }
  // the first look finds what is seen; the next goes from there to the lamp
  float n, cov = 1.0, len = 1e4; vec3 h, b1 = vec3(9e3, 0.0, 0.0), b2 = b1; vec2 s, f, g;
  float T0 = tR, T1 = tR, th = 0.0; int B0 = -1, B1 = -1; vec2 I0 = vec2(0.0), I1 = I0;
  for (int k = 0; k < 2 && !chGeo; k++) {
    vec3 o = ro, d = rd; th = 0.0;
    if (k > 0) { o = ro + rd * (T0 - (B0 < 0 ? 0.08 : 0.0)); d = chKey - o; len = length(d); d /= len; }
    CH_LONG(CH_BEAM) CH_TIPS(CH_TIP)
    if (k == 0) {
      if (b1.x < tR) { T0 = b1.x; B0 = int(b1.z); cov = sat(b1.y * uRes.y / (1.6 * T0)); }
      if (b2.x < tR) { T1 = b2.x; B1 = int(b2.z); }
      b1 = b2 = vec3(-1.0);
    }
  }
  // the geode: the rind's face, or the crystals near where the ray meets the hollow
  for (int z = 0; z < 1 && chGeo; z++) {
    vec3 rg = ro / chG;
    float tm = -rg.z / rd.z, b = dot(rg, rd), inside = chMouth(rg.xy + rd.xy * tm);
    // the ray is followed to the wall, with the four cells round it at each step
    float bb = b * b - dot(rg, rg), tA = max(tm, sqrt(max(bb + 0.38, 0.0)) - b), rim = tm * 0.8 / uRes.y; tR = sqrt(max(bb + 0.96, 0.0)) - b;
    T0 = tm * chG; B0 = B1 = -2; cov = 1.0; th = 0.0; b1 = b2 = vec3(9e3, 0.0, 0.0);
    vec2 was = vec2(99.0);
    for (int m = 0; m < 4; m++) {
      vec3 w = normalize(rg + rd * mix(tA, tR, float(m) * 0.32 + 0.02));
      vec2 c0 = floor(w.xy * inversesqrt(max(0.5 + 0.5 * w.z, 0.1)) / 0.165 - 0.5);
      if (inside > rim || b1.x < mix(tA, tR, float(m) * 0.32 - 0.2)) break;
      if (c0 == was) continue;
      was = c0;
      for (int k = 0; k < 4; k++) {
        vec2 id = c0 + vec2(k & 1, k >> 1);
        vec3 tip, ax, e1; chTooth(id, tip, ax, e1);
        vec3 e2 = cross(ax, e1), o = rg - tip;
        vec3 ol = vec3(dot(o, e1), dot(o, e2), dot(o, ax) * 0.42), dl = vec3(dot(rd, e1), dot(rd, e2), dot(rd, ax) * 0.42);
        vec3 a = vec3(ol.x, 0.5 * ol.x + 0.866 * ol.y, 0.5 * ol.x - 0.866 * ol.y), v = vec3(dl.x, 0.5 * dl.x + 0.866 * dl.y, 0.5 * dl.x - 0.866 * dl.y);
        vec3 d1 = v + dl.z + 1.3e-6, d2 = dl.z - v + 1.3e-6, u1 = -(a + ol.z) / d1, u2 = (a - ol.z) / d2;
        vec3 e = max(mix(u1, vec3(-9.0), step(0.0, d1)), mix(u2, vec3(-9.0), step(0.0, d2))), x = min(mix(vec3(9.0), u1, step(0.0, d1)), mix(vec3(9.0), u2, step(0.0, d2)));
        float tn = max(e.x, max(e.y, e.z)), tf = min(x.x, min(x.y, x.z)), nm = id.x + 16.0 + 64.0 * (id.y + 16.0);
        h = vec3(tn + 1e4 * (step(tf, tn) + step(tn, tm - 0.1) + float(nm == b1.z)), tf - tn, nm); n = step(h.x, b1.x);
        b2 = mix(mix(b2, h, step(h.x, b2.x)), b1, n); b1 = mix(b1, h, n);
      }
    }
    if (inside < rim) {
      I0 = vec2(mod(b1.z, 64.0), floor(b1.z / 64.0)) - 16.0; I1 = vec2(mod(b2.z, 64.0), floor(b2.z / 64.0)) - 16.0;
      T0 = min(b1.x, tR) * chG; T1 = min(b2.x, tR) * chG; B0 = b1.x < tR ? 0 : -3; B1 = b2.x < tR ? 0 : -3;
      cov = B0 < 0 ? 1.0 : sat(b1.y * uRes.y / (1.6 * b1.x));
      if (inside > -rim) { T1 = T0; B1 = B0; I1 = I0; T0 = tm * chG; B0 = -2; cov = 0.5 + 0.5 * inside / rim; }
    }
  }
  if (cov > 0.8) cov = 1.0;
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    int bk = k == 0 ? B0 : B1;
    float t = k == 0 ? T0 : T1, px = t / uRes.y, rk, e, e2, far, face, face2, big, along; int i = max(bk, 0);
    vec3 q = ro + rd * t, n, n2, sd, O, O2, ri, q2, c, tint = vec3(1.0), glow = vec3(0.0); bool glass = bk >= 0;
    rk = chRock(q, slope);
    vec3 v1 = chKey - q, v2 = chFar - q, l1 = normalize(v1), l2 = normalize(v2);
    // a beam: its nearest face and the next, and the way through it
    vec3 u = chA[i], nb = chB[i], v = (nb - 0.5 * u) * 1.1547, x = cross(u, v); vec4 C = chC[i], W = chW[i];
    float lip = 0.0, kk = float(i), slant = chGeo ? 0.42 : 0.0, tall = 1.0, seed = float(i);
    if (chGeo) {
      vec3 tip, e1; tall = chTooth(k == 0 ? I0 : I1, tip, x, e1) * chG; tip *= chG;
      u = e1; v = cross(x, u); nb = 0.5 * u + 0.866 * v; C = vec4(dot(tip, u), dot(tip, nb), dot(tip, x), 1.0);
      W = vec4(vec3(0.42 * (C.z - dot(q, x))), 0.0); seed = fract(tall * 137.0) * 9.0;
      kk = step(1.0, tip.x + seed * 0.3) + 2.0 * step(-1.0, tip.y - seed * 0.3);
      tint = mix(mix(vec3(0.26, 0.19, 0.15), vec3(0.30, 0.11, 0.56), smoothstep(-0.9, -0.35, tip.x / chG)), vec3(0.9, 0.92, 0.95), smoothstep(0.15, 0.8, tip.x / chG + 0.2 * (seed / 9.0 - 0.5)));
      vec3 lc = q + (chKey - q) * q.z / max(q.z - chKey.z, 0.1);
      lip = chMouth((glass ? lc.xy : q.xy) / chG);
      th = glass ? 4.0 * smoothstep(-0.1, 0.06, lip) : 0.0;
    }
    O = vec3(dot(q, x) - C.z, dot(q, u) - C.x, 0.0); float z1 = dot(q, nb) - C.y; O.z = (z1 - 0.5 * O.y) * 1.1547;
    vec3 f3 = vec3(O.y, z1, O.y - z1), d3 = W.xyz - abs(f3);
    vec2 g2 = vec2(O.x + W.w * O.y, O.x - W.w * (0.7 * O.y - 0.6 * O.z)), h2 = W.w > 0.0 ? (C.w - abs(g2)) * inversesqrt(1.0 + W.w * W.w) : vec2(9.0);
    float mn = min(min(d3.x, min(d3.y, d3.z)), min(h2.x, h2.y));
    vec3 m3 = step(d3, vec3(mn)), sg = sign(f3); vec2 m2 = step(h2, vec2(mn)), sh2 = sign(g2);
    n = m3.x * sg.x * u + m3.y * sg.y * nb + m3.z * sg.z * (u - nb) + m2.x * sh2.x * (x + W.w * u) + m2.y * sh2.y * (x - W.w * (0.7 * u - 0.6 * v));
    face = dot(m3, vec3(1.0, 2.0, 3.0) + 2.5 * sg) + dot(m2, vec2(9.0, 11.0));
    d3 += 9.0 * m3; h2 += 9.0 * m2; e = min(min(d3.x, min(d3.y, d3.z)), min(h2.x, h2.y));
    big = max(W.x, W.y); along = chGeo ? sat(1.0 + O.x / tall) : sat(0.5 + 0.5 * O.x / C.w);
    n = normalize(n + slant * x + 1e-5);
    if (!glass) n = -rd;
    ri = refract(rd, n, 0.66);
    vec3 dl = vec3(dot(ri, u), dot(ri, nb), 0.0); dl.z = dl.x - dl.y; dl += 1.3e-6;
    vec3 ex = (W.xyz * sign(dl) - f3) / dl;
    far = max(min(ex.x, min(ex.y, ex.z)), 0.0);
    m3 = step(ex, vec3(far)); sg = sign(dl);
    n2 = normalize(m3.x * sg.x * u + m3.y * sg.y * nb + m3.z * sg.z * (u - nb) + slant * x + 1e-5);
    face2 = dot(m3, vec3(1.3, 2.1, 5.7));
    e2 = 0.5 * (min(max(ex.x, ex.y), min(max(ex.y, ex.z), max(ex.x, ex.z))) - far);
    sd = cross(n, x);
    q2 = q + ri * far; O2 = O + far * vec3(dot(ri, x), dl.x, (dl.y - 0.5 * dl.x) * 1.1547);
    // the light of its own kind: in a beam's foot, or in a quarter of the geode
    tint = mix(vec3(0.75, 0.72, 0.74), tint, smoothstep(0.1, 0.8, along));
    float bi = float(i), al = mix(along, 1.0 - along, float(i == 4));
    float lv = dot(vec4(equal(vec4(kk), vec4(0.0, 1.0, 2.0, 3.0))), vec4(uDrone, uPad, uTexture, uPhrase)) + 0.7 * uHits * float(kk == 4.0);
    float gp = (fract(al * 9.0 - uTravel * 0.08 + bi * 0.37) - 0.5) * 14.0, fo = 1.0 / (1.0 + al * (2.2 + 4.0 * al * al)), hp = dot(q.xy - 1.6 * wander, q.xy - 1.6 * wander);
    gp = 1.0 / (1.0 + gp * gp);
    glow = uKind[int(min(kk, 4.0))] * (lv * fo * (5.5 * fo * fo + 0.08) + band(chGeo ? seed / 9.0 : al) * mix(gp * gp, 0.2, float(chGeo)) * (0.15 + lv) * fo) * (0.5 + 1.1 * uEnergy) * step(kk, 4.5);
    glow = chGeo ? glow * (0.5 + 3.0 * tint) + (uKind[4] + 0.3) * uHits * 2.0 / (1.0 + hp * (1.4 + 2.0 * hp)) : glow;
    glow += uKind[3] * uKeys * smoothstep(0.35, 1.0, along) * (chGeo ? step(6.5, seed) : step(8.5, bi));
    // noise: on a beam its lines and veils, on the rock its slope
    float st = 4.0 / (0.25 + big);
    vec3 qr = q + vec3(0.6, -0.5, 0.4) * q.yxx;
    vec3 N = vec3(0.0, chNoise(qr * 8.1), chNoise(glass ? vec3(dot(q, sd) * 35.0, O.x * 1.2, face * 9.0) : qr * (chGeo ? 6.0 : 23.0)));
    vec4 D1 = chNoiseD(glass ? mix(O, O2, 0.12) * vec3(0.5, st, st) + seed * 11.0 : qr * 1.7), D2 = chNoiseD(glass ? mix(O, O2, 0.6) * vec3(0.5, st, st) + seed * 11.0 : qr * 4.3);
    vec2 A = vec2(D1.x, D2.x); N.x = A.y;
    float a1 = 1.0 / (1.0 + dot(v1, v1)), a2 = 1.0 / (1.0 + dot(v2, v2));
    rk = chGeo ? along * 0.9 - 0.1 : rk;
    if (glass) {
      float fine = (N.z - 0.5) * sat(0.015 / px), cw = 0.012 + 0.07 * big * smoothstep(0.55, 0.85, N.y), w = max(cw, 1.5 * px);
      float chip = (1.0 - smoothstep(0.4 * w, w, e)) * min(1.0, cw / w), cloud = 0.5 * (A.x + A.y) * (chGeo ? 0.6 : 1.0);
      vec3 nn = normalize(n + sd * 0.26 * fine + chip * (N.yzx - 0.5) * 1.3);
      vec2 sh = abs(fract(vec2(0.55, 0.45) * O.x + vec2(0.5, 0.9) * O.y - vec2(0.4, 0.1) * O.z + vec2(0.1, 0.43) + 0.3 * seed) - 0.5);
      float veil = dot((1.0 - smoothstep(vec2(0.0), vec2(0.09), sh)) * smoothstep(vec2(0.4), vec2(0.7), A) * 0.7 + 0.42 * smoothstep(vec2(0.55), vec2(0.8), A), vec2(1.0));
      float fw = sat(dot(rd, l1)); fw *= fw * fw;
      float tk = chGeo ? 1.1 + 1.2 * cloud : 0.5 + 0.9 * cloud, frost = (chGeo ? 0.5 : 0.25) + 0.3 * cloud + 0.6 * chip;
      vec3 L1 = chKeyC * a1 * exp(-tk * th), L2 = chFarC * vec3(1.0, 0.9, 0.8) * a2 / (1.0 + tk * far * (0.5 + 0.2 * tk * far));
      vec3 milk = mix(chGeo ? vec3(0.6, 0.64, 0.62) : vec3(0.52, 0.60, 0.58), vec3(0.90, 0.83, 0.72), smoothstep(0.1, 0.8, cloud)) * tint;
      c = milk * (L1 * (frost * sat(dot(nn, l1)) + (chGeo ? 0.03 : 0.14 + 2.4 * fw * fw) + 0.35 * veil) + L2 * (frost * sat(dot(nn, l2)) + 0.2 + 0.35 * veil));
      c += milk * vec3(0.8, 0.95, 1.1) * ((chGeo ? 0.02 : 0.11) + 0.04 * uLevel) * sat(0.1 + dot(nn, vec3(-0.62, 0.62, -0.48))) * (0.4 + cloud);
      // seen through: the back faces and the lines where they meet
      vec3 back = chEnv(q2, reflect(ri, -n2)) * (0.6 + fract(face2 * 3.1 + seed * 0.37));
      back += (L1 + L2) * 0.16 * (1.0 - smoothstep(0.0, 0.05 + px, e2));
      c += back * tint / (1.0 + far * (0.5 + cloud) * (1.0 + far));
      c += glow * (0.1 + 0.7 * cloud * cloud + 0.9 * veil + 0.4 * chip);
      // what the faces mirror, and the rust dust low down and where it stands in the rock
      float fr = 1.0 - sat(-dot(rd, nn)); fr *= fr;
      c += chEnv(q, reflect(rd, nn)) * ((chGeo ? 0.35 : 0.08) + 1.4 * fr * fr);
      float dust = max(1.0 - smoothstep(0.05, 0.55, rk + 0.35 * (N.y - 0.5)), 0.5 * smoothstep(0.5, 0.75, N.x) * sat(n.y));
      c *= mix(vec3(1.0), vec3(0.5, 0.27, 0.15), dust) * smoothstep(-0.05, 0.4, rk);
    } else {
      n = normalize(slope / (length(slope) + 1e-4) - (D1.yzw * 0.7 + D2.yzw * 0.6) * (chGeo ? 0.35 : 1.0) + (N - 0.5) * 0.5 * (chGeo ? 0.4 : 1.0));
      vec3 alb = mix(vec3(0.042, 0.016, 0.008), vec3(0.075, 0.031, 0.014), N.y) * (0.6 + 0.5 * A.x + 0.4 * N.z);
      if (chGeo) {
        alb = bk < -2 ? vec3(0.05, 0.04, 0.06) * (0.3 + N.z) : mix(vec3(0.34, 0.33, 0.34), vec3(0.085, 0.08, 0.076) * (0.8 + 0.5 * N.x + 0.6 * N.z), smoothstep(0.02, 0.07, lip + 0.05 * (N.y - 0.5)));
      }
      c = alb * (chKeyC * a1 * (chGeo ? 1.0 : min(50.0 * a1, 1.6)) * exp(-1.5 * th) * sat(0.08 + 0.92 * dot(n, l1)) + chFarC * a2 * sat(0.1 + 0.9 * dot(n, l2)) * 5.0 / (1.0 + 2.0 * a2) + 0.01);
    }
    c /= 1.0 + 0.03 * (0.6 + 0.8 * uSpace) * t * (1.0 + 0.015 * t);
    col += c * (k == 0 ? cov : 1.0 - cov);
    if (cov > 0.95) break;
  }
  float tEnd = cov > 0.5 ? T0 : T1, haze = 0.6 + 0.8 * uSpace;
  if (!chGeo) {
    col += chFarC * chAir(ro, rd, tEnd, chFar) * 0.0045 * haze + chKeyC * chAir(ro, rd, tEnd, chKey) * 0.0006 * haze;
    // somebody stands there with a lamp: how large the hall is
    float fz = 14.0 - ro.z; vec2 fp = ro.xy + rd.xy / rd.z * fz - vec2(-2.65, -1.7);
    if (tEnd * rd.z > fz && max(abs(fp.x), abs(fp.y)) < 0.8) {
      float fd = min(min(length(fp - vec2(0.015, 0.55)) - 0.085, 0.12 * length(vec2(fp.x, fp.y - 0.18) / vec2(0.13, 0.32)) - 0.12), max(abs(abs(fp.x + 0.01) - 0.055) - 0.042, abs(fp.y + 0.2) - 0.3));
      col *= 0.2 + 0.8 * smoothstep(-0.5, 0.5, fd * uRes.y / fz);
    }
  }
  return screenOf(col * 1.6);
}
