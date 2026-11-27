// name: Dark pool
// a: Outer slope
// b: Fringed lake
// what: A round black lake in a crater whose walls are a forest of grey-blue and amber ropes: from the near slope, over a ragged golden lip, the water is cut by the frame and holds one tall window of light; or from high above, the ropes running off wide, half in the long shade of grasses, a bright curl of light on the amber.
// follows: The pool opens in quiet and draws in as the sound grows bright. The piece dyes the land, the loop round it, the room outward. A drone colours the deep, a pad is wet shine, texture fine threads, a phrase glows along one braid, bands raise sixteen sectors. A hit lights and shivers the window, a cue passes a lid of shade, keys light flecks, a voice the lip.
// own: 0 moss and copper at -1, frost blue and dusty rose at 1; 1 a moonlit night at -1, a low red evening at 1; 2 a pinhole of a pool at -1, a flooded one at 1; 3 few fat smooth ropes at -1, land pitted with deep hollows at 1; 4 low down by the water at -1, from high overhead at 1; 5 a long narrow tarn at -1, a lake with five bays at 1; 6 the pool under a white lid of ice and snow on the land at -1, a molten lake that lights a charred wall at 1; 7 the land cut in level terraces that hold water at -1, made of great overlapping petals at 1
#define ecIce max(-uOwn[6], 0.0)
#define ecFire max(uOwn[6], 0.0)
#define ecStep max(-uOwn[7], 0.0)
#define ecLeaf max(uOwn[7], 0.0)
float ecPool;          // how wide the pool is
float ecOut;             // where the crater's rim stands
// what the last reading of the land found
float ecA, ecS, ecH, ecId, ecWeb, ecIn, ecLane;
vec3 ecN, ecM;
float ecWet;           // how much of a level field of water this is
float ecFlat;         // where the eye looks along the ground the ropes lie lower, so that they stay whole
// a swing like a sine, and a number for a whole number, both cheap
float ecSin(float x) { float f = 2.0 * fract(x * 0.15915494) - 1.0; return -4.0 * f * (1.0 - abs(f)); }
float ecHash(float n) { n = fract(n * 0.1031); n *= n + 33.33; return fract(2.0 * n * n); }
// three noises that meet themselves after a whole turn
vec3 ecRand(float x, float y) { float h = hash21(vec2(x, y)); return fract(h * vec3(1.0, 57.31, 131.7)); }
vec3 ecNoise(vec2 p, float per) {
  vec2 i = floor(p), f = p - i; f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, per), x1 = mod(i.x + 1.0, per);
  return mix(mix(ecRand(x0, i.y), ecRand(x1, i.y), f.x), mix(ecRand(x0, i.y + 1.0), ecRand(x1, i.y + 1.0), f.x), f.y);
}
// Distance from the middle of the pool, in a place that may be long or have bays.
float ecRad(vec2 q) {
  float r = length(q) + 1e-4, c = q.x / r, o = uOwn[5];
  if (o == 0.0) return r;
  float near = 1.0 - smoothstep(0.7, 3.4, r);
  vec2 e = rot(0.5) * q * vec2(1.0 - 0.45 * max(-o, 0.0), 1.0 + 0.9 * max(-o, 0.0));
  return mix(r, length(e) + 1e-4, near) * (1.0 + 0.22 * max(o, 0.0) * near * c * (16.0 * c * c * c * c - 20.0 * c * c + 5.0));
}
// The bare ground: a floor, a lip, then the long wall up to the rim.
float ecBase(float r, vec2 q) {
  float s = (r - ecPool) / (ecOut - ecPool), w = max(s, 0.0);
  float hi = 1.25 + 0.16 * ecSin(q.x * 0.9 + 1.0) + 0.1 * ecSin(q.x * 2.3 - q.y * 0.7);
  float lip = (s - 0.24) * 9.0;
  lip = 1.0 + lip * lip;
  float b = min(s, 0.06) * 1.1 + 0.2 * w + 0.15 / (lip * lip) + hi * w * w * 0.95;
  float over = max(s - 1.0, 0.0);
  return b - 5.0 * over * over;
}
// One family of ropes: round backs side by side, each with a height and a life of its own.
float ecRope(float u, float s, float per, float foot, out float id) {
  float i = floor(u), f = 2.0 * (u - i) - 1.0, h = ecHash(mod(i, per) + 3.7);
  id = h;
  float live = smoothstep(-0.75, 0.1, ecSin(s * (5.0 + 7.0 * h) + h * 50.0));
  float pr = 1.0 - f * f;
  return mix(0.6, pr * (1.6 - 0.6 * pr), foot) * (0.45 + 0.55 * fract(h * 9.7)) * live;
}
float ecBand(float a) {
  float f = fract(a) * 16.0; int i = int(min(f, 15.0)); float t = fract(f); t = t * t * (3.0 - 2.0 * t);
  return mix(uBands[i], uBands[(i + 1) % 16], t);
}
// Great petals in rows, the inner lying over the outer. Their height; which one, and how near its edge.
float ecPetals(float a, float y, out float id, out float rib) {
  float best = 0.06; id = 0.3; rib = 0.0;
  for (int k = 2; k >= 0; k--) {
    float j = floor(y) - float(k), per = 34.0, x = a * per + 0.5 * mod(j, 2.0), i = floor(x);
    float h = ecHash(mod(i, per) + 41.0 * j + 5.1), v = (y - j) / (1.7 + 0.9 * h);
    float u = (x - i - 0.5 - 0.22 * (h - 0.5)) * 2.0, w = 1.12 * sqrt(max(1.0 - v * v, 0.0)) * (0.8 + 0.2 * smoothstep(0.0, 0.35, v));
    if (v > 1.0 || abs(u) > w) continue;
    float e = abs(u) / max(w, 1e-3);
    best = 0.18 + 0.7 * v * v + 0.42 * (1.0 - e * e) - 0.22 * exp(-u * u * 60.0) * (1.0 - v);
    e *= e * e; best = mix(best, 0.06, e * e); id = h; rib = abs(u) / max(w, 1e-3);
    break;
  }
  return best;
}
// The whole land at a place, with its ropes and hollows. foot is how wide a pixel lies there.
float ecLand(vec2 q, float foot) {
  float r = ecRad(q), s = (r - ecPool) / (ecOut - ecPool), o3 = uOwn[3];
  float a = atan(q.y, q.x + 1e-5) / TAU + 0.5;
  float b = ecBase(r, q), turn = TAU * r;
  ecA = a; ecS = s;
  vec3 n = ecNoise(vec2(a * 14.0, s * 3.6), 14.0);
  vec3 m1 = vec3(0.0, 2.1, 4.2) + TAU * (41.0 * a + vec3(2.0, 1.0, 3.0) * n.y) + 13.0 * s, m2 = vec3(1.0, 5.0, 3.0) + TAU * (23.0 * a - vec3(1.0, 3.0, 2.0) * n.z) - 19.0 * s;
  vec3 m = 0.5 + 0.28 * vec3(ecSin(m1.x) + ecSin(m2.x), ecSin(m1.y) + ecSin(m2.y), ecSin(m1.z) + ecSin(m2.z));
  ecN = n; ecM = m;
  // hollows the ropes part round
  vec2 c = vec2(a * 26.0, s * 3.6 + n.y * 0.8); float row = floor(c.y);
  c.x += 0.5 * mod(row, 2.0);
  vec2 hh = hash22(vec2(mod(floor(c.x), 26.0), row) + 2.3);
  vec2 e = (fract(c) - 0.5 - 0.14 * (hh - 0.5)) / vec2(0.40, 0.42);
  float hole = max(1.0 - dot(e, e), 0.0);
  hole *= hole * smoothstep(0.5 - 0.5 * o3, 0.85 - 0.5 * o3, hh.y) * smoothstep(0.22, 0.34, s);
  a -= 0.75 * min(hole * 1.3, 1.0) * e.x * 0.40 / 26.0;
  // three families of ropes: two that wander through each other, and a fine one under them
  float way = 1.9 * ecSin(s * 8.0 + 6.0 * n.z), fine = turn / max(foot, 1e-4), ia, ib, ic;
  ecLane = a + (2.2 * (n.x - 0.5) + way * 0.5) / 76.0;
  float A = ecRope(76.0 * ecLane, s, 76.0, smoothstep(2.0, 6.0, fine / 76.0), ia);
  float B = ecRope(58.0 * a - 1.9 * (n.y - 0.5) - way * 0.55, s + 0.37, 58.0, smoothstep(2.0, 6.0, fine / 58.0), ib) * 1.12;
  float C = ecRope(230.0 * a + 5.0 * (n.z - 0.5) + 1.3 * m.x, s, 230.0, smoothstep(2.5, 7.0, fine / 230.0), ic);
  float wild = max(o3, 0.0), mild = max(-o3, 0.0);
  B *= 1.0 - 0.45 * mild; C *= 1.0 - 0.9 * mild;
  float k = 0.12 + 0.6 * mild, h = 0.5 + 0.5 * clamp((A - B) / k, -1.0, 1.0);
  float H = mix(B, A, h) + k * h * (1.0 - h);
  ecId = mix(ib, ia, h); ecWeb = C;
  ecWet = 0.0;
  if (uOwn[7] < 0.0) {
    float x = s * 15.0 + 1.7 * n.x + 1.3 * n.z, row = floor(x), f = x - row;
    float st = f < 0.72 ? 1.0 - f / 0.72 : smoothstep(0.72, 1.0, f);
    float fit = smoothstep(2.0, 7.0, (ecOut - ecPool) / 15.0 / max(foot, 1e-4));     // far off they are too fine to tell apart
    st = mix(0.55, st, fit);
    float walk = abs(fract(a * 46.0 + ecHash(row + 2.0) + 0.3 * n.y) - 0.5) * turn / 46.0;       // a bank across, between two fields
    float bank = max(exp(-min(f, 1.0 - f) * min(f, 1.0 - f) * 90.0), exp(-walk * walk * 1500.0) * smoothstep(0.0, 0.08, f) * (1.0 - smoothstep(0.66, 0.74, f))) * fit;
    H = mix(H, 1.15 * st + 0.15 * bank + 0.08 * C * smoothstep(0.74, 0.84, f) * smoothstep(0.0, 0.12, 1.0 - f), ecStep);
    ecId = mix(ecId, ecHash(row + floor(a * 46.0 + ecHash(row + 2.0) + 0.3 * n.y) * 7.0), ecStep);
    ecWet = ecStep * smoothstep(0.1, 0.16, f) * (1.0 - smoothstep(0.66, 0.74, f)) * (1.0 - bank) * smoothstep(0.25, 0.4, ecId);
    ecWet = mix(0.45 * ecStep, ecWet, fit);
    hole *= 1.0 - ecStep; C *= 1.0 - 0.85 * ecStep * smoothstep(0.24, 0.34, s);
  } else if (uOwn[7] > 0.0) {
    float id, rib, P = ecPetals(a + 0.012 * (n.x - 0.5), s * 7.0 + 0.9 * (n.y - 0.5), id, rib);
    H = mix(H, 1.35 * P + 0.05 * C * (1.0 - rib), ecLeaf); ecId = mix(ecId, id, ecLeaf); ecWeb = mix(C, rib, ecLeaf);
    hole *= 1.0 - ecLeaf;
  }
  // inside the ragged lip there are only the fine ones
  float edge = s + 0.07 * (m.y - 0.5) + 0.06 * (n.x - 0.5);
  ecIn = 1.0 - smoothstep(0.2, 0.26, edge);
  H = mix(H, 0.3 * H + 0.5 * C, ecIn * (1.0 - 0.8 * ecLeaf)); ecWet *= 1.0 - ecIn;
  H = max(H, 0.45 * C) * (1.0 - 0.9 * hole) - (0.55 + 1.3 * wild) * hole + (0.1 + 0.3 * hole) * C;
  ecH = H;
  float lip = (edge - 0.245) * 13.0; lip = 1.0 + lip * lip;
  return b + ecFlat * (0.052 + 0.018 * mild) * r * smoothstep(-0.02, 0.06, s) * (1.0 - 0.62 * ecIn) * (1.0 - 0.65 * smoothstep(0.75, 1.0, s)) * (1.0 + 0.8 * ecBand(ecA)) * (H - 0.5) + 0.08 / (lip * lip) * (0.4 + m.x);
}
vec3 ecLight, ecWarm, ecCool, ecHaze; // where the light comes from; its colour, the sky's, the far air's
float ecNight, ecEve;
vec3 ecSky(vec3 d) {
  float l = max(dot(d, normalize(vec3(ecLight.x, ecLight.y * 0.35, ecLight.z))), 0.0);
  vec3 c = mix(ecHaze, ecCool * 0.45, smoothstep(0.0, 0.6, d.y));
  c += ecWarm * (0.32 * l * l * l * l + 0.4 * pow(l, 30.0));
  // a wet bow of sheen, as on the inside of a bowl
  float bow = d.y - 0.36 + 0.3 * d.x * d.x - 0.12 * d.x, low = d.y - 0.19 + 0.12 * d.x * d.x;
  return c + ecCool * (0.28 * exp(-bow * bow * 160.0) + 0.14 * exp(-low * low * 900.0));
}
// The pool: black water that holds one tall window of light.
vec3 ecWater(vec3 ro, vec3 rd, vec3 q) {
  vec2 mid = normalize(-ro.xz + 1e-5);
  vec2 o = q.xz / ecPool;
  float v = dot(o, mid), u = dot(o, vec2(mid.y, -mid.x)), k = uHits * (1.0 - uHits) * 4.0;
  float ring = length(vec2(u + 0.22, v)) - 1.3 * (1.0 - uHits), wave = exp(-ring * ring * 260.0) * uHits;
  float rip = (0.004 + 0.008 * uLow) * (1.2 - v) * sin(v * 31.0 - uTime * 0.9 + 3.0 * sin(u * 4.0 + uTime * 0.21)) * 0.3 + 0.03 * k * (sin(v * 27.0 + u * 9.0 + 18.0 * uHits) + sin(v * 61.0 - u * 17.0));
  vec3 rf = normalize(vec3(rd.x + rip * 0.6, -rd.y + 0.03 * wave, rd.z));
  float fr = 0.015 + 0.36 * pow(1.0 - clamp(rf.y, 0.0, 1.0), 5.0);
  // the far wall upside down in it, then the sky
  float st = noise(vec2(atan(rf.x, rf.z + 1e-4) * 34.0 + 20.0, rf.y * 5.0));
  float wall = 1.0 - smoothstep(-0.04, 0.05, rf.y - 0.27 - 0.06 * sin(rf.x * 7.0));
  vec3 c = mix(ecSky(rf), ecHaze * (0.22 + 0.4 * st * st), wall) * fr * (0.8 - 0.5 * uDrone);
  c += (0.006 + 0.15 * uDrone) * uKind[0] * uKind[0] * exp(-dot(o, o) * 1.6);
  if (uOwn[6] < 0.0) {                          // a lid of ice, with its cracks
    vec2 g = q.xz * 1.3;
    float f1 = noise(g * 1.7 + 4.0), f2 = noise(g * 4.3 + 9.0), cr = min(abs(f1 + 0.22 * f2 - 0.6), min(abs(f2 + 0.3 * f1 - 0.72) * 0.6, abs(noise(g * 0.9 + 21.0) - 0.5 + 0.1 * (f2 - 0.5)))), fw = 0.8 * length(q - ro) / uRes.y;
    vec3 ice = mix(vec3(0.16, 0.34, 0.44), vec3(0.62, 0.72, 0.78), smoothstep(0.25, 0.75, 0.6 * f1 + 0.4 * noise(g * vec2(9.0, 3.0))));
    ice = mix(ice, vec3(0.9), 0.75 * (1.0 - smoothstep(0.0, 0.025 + fw, cr)) + 0.7 * smoothstep(0.75, 1.0, length(o) + 0.15 * f2));
    c = mix(c, c + ice * (ecWarm * 0.55 + ecCool * 1.1), ecIce);
  }
  if (uOwn[6] > 0.0) {                          // a skin of slag on fire, drifting
    vec2 g = q.xz * 1.5 + 0.35 * vec2(sin(uTime * 0.05 + q.z), cos(uTime * 0.043 + q.x));
    float f1 = noise(g * 1.4), f2 = noise(g * 3.1 + 7.0), f3 = noise(g * 8.0), cr = min(abs(f1 + 0.3 * f2 - 0.65 + 0.06 * f3), abs(f2 + 0.3 * f1 - 0.66 + 0.06 * f3) * 0.7);
    float hot = exp(-cr * (26.0 - 10.0 * uLow)) + 0.28 * smoothstep(0.35, 0.8, f1) + 0.6 * smoothstep(0.8, 1.05, length(o) + 0.1 * f3);
    c = mix(c, vec3(0.03, 0.02, 0.018) * (0.5 + f3) + vec3(2.6, 0.62, 0.1) * hot * (0.65 + 0.35 * uLevel + 0.6 * uHits * exp(-length(o) * 1.5)) + vec3(1.2, 0.9, 0.4) * hot * hot * hot * 0.9, ecFire);
  }
  // the window
  float wx = (u + 0.24) / (1.0 + 0.16 * v) + rip;
  float broke = 0.5 + 0.5 * sin(v * 60.0 + 4.0 * sin(u * 7.0) - uTime * 0.7);
  float win = (1.0 - smoothstep(0.085, 0.125, abs(wx))) * (1.0 - smoothstep(0.48, 0.60, v + 9.0 * wx * wx)) * smoothstep(-0.85, -0.2, v + 0.22 * broke - 0.2);
  win += (0.07 + 0.40 * uHits) * exp(-wx * wx * (14.0 - 8.0 * uHits)) * smoothstep(-1.0, 0.4, v);
  win *= 1.0 - 0.75 * ecFire - 0.5 * ecIce;
  c += ecWarm * win * (0.55 + 0.35 * uHits + 0.15 * uLevel) * (0.65 + 0.35 * v);
  return c + ecWarm * wave * 0.12;
}
// The shade of tall grasses that stand beyond the top of the picture: long soft blades laid over the land by one low light.
float ecGrass(vec2 q) {
  float along = dot(q, vec2(0.42, 0.91)), side = dot(q, vec2(0.91, -0.42)), k = 0.0;
  for (int l = 0; l < 2; l++) {
    float fl = float(l), w = 0.42 - 0.15 * fl, v0 = 4.6 - along;
    float x = (side + (0.10 + 0.14 * fl) * v0 + 0.06 * v0 * (0.4 * v0) * (fl - 0.3) + 0.03 * v0 * sin(uTime * 0.21 + fl * 2.0 + 0.5 * side)) / w + 50.0;
    for (int i = -1; i <= 1; i++) {
      float id = floor(x) + float(i), h = hash11(id + 91.0 * fl), g = fract(h * 57.3);
      float len = 2.6 + 2.6 * g * (0.6 + 0.4 * sin(id * 0.7)) , v = v0 / len;
      float dx = abs(x - id - 0.5 - 0.6 * (h - 0.5) - (h - 0.5) * 1.6 * v * v) * w, soft = 0.03 + 0.015 * v0;
      float wide = 0.17 * (1.0 - v) + 0.04;
      k = max(k, (1.0 - smoothstep(wide - soft, wide + soft, dx)) * (1.0 - smoothstep(0.75, 1.1, v)));
    }
  }
  return max(k, smoothstep(1.6, 4.0, along));
}
vec3 render(vec2 p) {
  float lo = max(-uOwn[4], 0.0), up = max(uOwn[4], 0.0);
  bool far = uVar > 0.5;
  ecNight = max(-uOwn[1], 0.0); ecEve = max(uOwn[1], 0.0);
  ecPool = (1.42 - 0.065 * uHigh - 0.05 * uMid) * exp2(uOwn[2] * (uOwn[2] > 0.0 ? 0.5 : 1.2)) + 0.02 * sin(uTime * 0.23);
  vec3 ro, ta; float zoom;
  if (!far) {
    ro = vec3(-2.15, 1.62, -3.05); ta = vec3(-1.4, 0.74, 0.2); zoom = 1.2;
    ro += lo * vec3(0.2, -0.55, 0.6) + up * vec3(-0.3, 1.9, 0.0); ta += lo * vec3(0.0, 0.1, 0.0) + up * vec3(0.25, -0.75, 0.0);
    ecLight = normalize(vec3(0.85, 0.36, 0.38));
  } else {
    ro = vec3(3.95, 5.0, -4.4); ta = vec3(3.35, 0.0, -1.5); zoom = 1.35; ecPool *= 1.15;
    ro += lo * vec3(0.0, -1.5, 0.5) + up * vec3(0.0, 1.6, 1.0); ta += lo * vec3(0.0, 0.35, 0.0);
    ecLight = normalize(vec3(0.35, 0.40, 0.75));
  }
  ecLight = normalize(ecLight - vec3(0.0, 0.14 * ecEve, 0.0));
  ecOut = far ? 6.4 : 4.7;
  ecWarm = mix(mix(vec3(1.75, 1.22, 0.70), vec3(0.26, 0.36, 0.55), ecNight), vec3(2.1, 0.62, 0.22), ecEve);
  ecCool = mix(mix(vec3(0.27, 0.40, 0.52), vec3(0.04, 0.065, 0.12), ecNight), vec3(0.17, 0.15, 0.34), ecEve);
  ecHaze = mix(mix(vec3(0.22, 0.27, 0.31), vec3(0.025, 0.04, 0.065), ecNight), vec3(0.28, 0.13, 0.15), ecEve);
  ecHaze += vec3(0.07, 0.018, 0.005) * ecFire; ecHaze *= 1.0 + 0.6 * ecIce;
  ro.xz += 0.06 * vec2(sin(uTime * 0.031), cos(uTime * 0.027));
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0, 1, 0), fw)), uu = cross(fw, rt);
  vec3 rd = normalize(fw * zoom + rt * p.x + uu * p.y);
  // a cue: a lid of shade comes down over all and goes off below
  float ly = p.y - 0.8 + 0.3 * p.x * p.x + 2.05 * (1.0 - uCue), lid = (1.0 - smoothstep(0.1, 0.55, abs(ly))) * smoothstep(0.0, 0.05, uCue);
  float bright = (1.0 - 0.8 * lid) * (1.0 + 0.12 * uLevel);
  // down to the land
  float tp = rd.y < -1e-3 ? -ro.y / rd.y : 1e3, t = 0.15, y = 1.0, r = 0.0;
  vec3 q = ro, col;
  bool hit = false;
  for (int i = 0; i < 22; i++) {
    q = ro + rd * t; r = ecRad(q.xz);
    y = q.y - ecBase(r, q.xz) - r * (0.035 + 0.03 * sat((r - ecPool) * 2.5));
    if (y < 0.004 * t) { hit = true; break; }
    t += max(y * 0.82, 0.012);
    if (t > 11.0 || t > tp) break;
  }
  if (!hit && t <= tp && t <= 11.0) hit = true;
  bool wet = !hit && t > tp, air = !hit && !wet;
  float foot, h = 0.0, d = 0.0;
  if (hit) {
    // through the ropes
    vec3 q2 = q + rd * 0.12;
    float thick = r * (0.035 + 0.03 * sat((r - ecPool) * 2.5));
    float rate = clamp((y - q2.y + ecBase(ecRad(q2.xz), q2.xz) + thick) / 0.12, 0.12, 1.5);
    // a rope that lies across the view is seen foreshortened, and loses its fine form sooner
    float across = min(abs(dot(normalize(rd.xz), vec2(-q.z, q.x) / r)), 1.0);
    foot = t / (uRes.y * zoom) / min(mix(0.6 + 0.4 * rate, rate, across * across), 1.0);
    float dt = min(1.75 * thick / rate, 1.3) / clamp(2.6 / rate, 6.0, 11.0), d0 = 0.0;
    ecFlat = mix(0.4, 1.0, smoothstep(0.15, 0.65, rate));
    float tEnd = t + min(1.75 * thick / rate, 1.3) + 0.5 * dt;
    for (int i = 0; i < 12; i++) {
      q = ro + rd * t;
      d = q.y - ecLand(q.xz, foot);
      if (d < 0.0) break;
      d0 = d; t += dt;
      if (t > tEnd) break;
    }
    if (d < 0.0) {
      // the place between two steps, found twice, so that an edge is a line and not a stair
      float t0 = t - dt, tm = t - dt * d / min(d - d0, -1e-5);
      q = ro + rd * tm;
      float dm = q.y - ecLand(q.xz, foot);
      if (abs(uOwn[7]) > 0.05) {                  // steps and petals have edges, which want it found more closely
        float hi = t; tm = t0;
        for (int i = 0; i < 6; i++) { float m = 0.5 * (tm + hi); q = ro + rd * m; if (q.y < ecLand(q.xz, foot)) hi = m; else tm = m; }
        t = hi;
      } else t = dm < 0.0 ? t0 + (tm - t0) * d0 / max(d0 - dm, 1e-5) : tm + (t - tm) * dm / max(dm - d, 1e-5);
    }
    wet = t > tp;
  }
  vec3 fog = ecSky(normalize(vec3(rd.x, 0.05, rd.z)));
  if (wet) { q = ro + rd * tp; col = ecWater(ro, rd, q); t = tp; }
  else if (air) col = ecSky(rd);
  else {
    q = ro + rd * t;
    float ep = max(0.006 * r, foot);
    float hx = ecLand(q.xz + vec2(ep, 0.0), foot), hz = ecLand(q.xz + vec2(0.0, ep), foot);
    float hl = ecLand(q.xz + ecLight.xz * 0.06 * r, foot);
    h = ecLand(q.xz, foot);
    float gain = (1.0 + 0.9 * ecIn) * mix(1.6, 1.0, ecFlat);
    vec3 n = normalize(vec3((h - hx) * gain, ep, (h - hz) * gain));
    float s = ecS, gold = exp(-(s - 0.25) * (s - 0.25) * 90.0);
    float shade = 1.0 - smoothstep(0.0, 0.05 * r, hl - h - 0.02 * r * ecLight.y);
    float dif = max(dot(n, ecLight), 0.0) * (0.2 + 0.8 * shade), ao = smoothstep(-0.55, 0.8, ecH);
    // grey-blue ropes, amber ones, a golden lip
    vec3 slate = mix(vec3(0.10, 0.18, 0.25), vec3(0.29, 0.38, 0.44), ecId);
    vec3 amber = mix(vec3(0.30, 0.13, 0.035), vec3(0.78, 0.48, 0.17), 0.65 * ecWeb + 0.35 * ecM.z);
    float moss = max(-uOwn[0], 0.0), pale = max(uOwn[0], 0.0);
    slate = mix(mix(slate, vec3(0.05, 0.11, 0.03) + vec3(0.16, 0.25, 0.05) * ecId, moss), vec3(0.34, 0.47, 0.62) + 0.22 * ecId, pale);
    amber = mix(mix(amber, amber * vec3(0.75, 0.42, 0.45), moss), vec3(0.62, 0.33, 0.33) * (0.55 + 0.7 * ecWeb), pale);
    vec3 alb = mix(slate, amber, max(ecIn, gold));
    alb = mix(alb, amber * 1.1, 0.75 * (1.0 - 0.5 * moss - 0.5 * pale) * smoothstep(0.52, 0.72, ecN.x * 0.7 + 0.3 * ecId));
    if (uOwn[7] > 0.0) alb = mix(alb, mix(mix(slate, amber, 0.35 * ecId) * 1.25, amber * 1.1, smoothstep(0.55, 1.0, ecWeb)), ecLeaf * (1.0 - ecIn));
    if (uOwn[6] > 0.0) alb *= mix(vec3(1.0), vec3(0.30, 0.27, 0.28), ecFire);
    if (uOwn[6] < 0.0) alb = mix(alb, vec3(0.74, 0.79, 0.84), ecIce * smoothstep(0.45, 0.75, n.y + 0.35 * (ao - 0.6)));
    // the piece is dye in the land, round and outward
    float at = far ? ecA : fract(ecA + 0.5);
    vec4 pc = piece(vec2(at, sat(s * 1.05)));
    float ends = smoothstep(0.0, 0.04, at) * (1.0 - smoothstep(0.96, 1.0, at)), dye = sat(pc.a * 1.3) * ends * (0.35 + 0.8 * uEnergy) * (0.4 + 0.6 * smoothstep(0.3, 0.6, ecId));
    vec3 pcol = pc.rgb / max(pc.a, 0.02);
    pcol = mix(pcol, vec3(dot(pcol, vec3(0.34))), 0.28);
    alb = mix(alb, pcol * pcol * (0.15 + 0.8 * ecId), dye * 0.8);
    // flecks, each of one kind
    vec2 fc = vec2(ecA * 52.0 + 2.0 * ecN.x, s * 13.0), fi = floor(fc);
    float fh = hash21(vec2(mod(fi.x, 52.0), fi.y) + 7.7), fg = fract(fh * 91.7);
    vec2 fo = (fract(fc) - 0.3 - 0.4 * vec2(fg, fract(fh * 37.3))) * vec2(1.0, 0.8);
    float fleck = step(0.7, fh) * (1.0 - smoothstep(0.05, 0.15, length(fo) + 0.16 * (ecM.x - 0.5))) * smoothstep(0.03, 0.1, s);
    int kind = int(fg * 4.0);
    float own_ = kind == 0 ? uDrone : kind == 1 ? uPad : kind == 2 ? uTexture : uPhrase;
    alb = mix(alb, mix(alb * 0.25, uKind[kind] * uKind[kind] * 0.8, 0.15 + 0.6 * own_), fleck * (0.35 + 0.35 * own_));
    // fine threads across the ropes
    float th = abs(fract(s * 21.0 + 3.0 * ecN.y + 0.9 * ecM.y) - 0.5) * 2.0;
    float thread = (1.0 - smoothstep(0.02, 0.10 + 12.0 * foot / r, th)) * smoothstep(0.5, 0.8, ecM.z) * (1.0 - smoothstep(0.03, 0.12, foot / r)) * smoothstep(0.1, 0.3, s);
    alb += vec3(0.5, 0.48, 0.40) * thread * (0.04 + 0.48 * uTexture);
    alb *= mix(0.06, 1.05, ao * ao * 0.5 + 0.5 * ao);
    alb *= mix(1.0, 0.22, exp(-max(s, 0.0) * (60.0 - 35.0 * uDrone)));        // dark and wet at the water
    col = alb * (ecWarm * dif * 2.6 + ecCool * (0.36 + 0.30 * n.y));
    if (uOwn[6] > 0.0) {
      vec3 to = vec3(-q.x, 0.35 * r, -q.z) / max(r, 1e-3);
      float gap = max(r - ecPool, 0.0);
      col += (alb * 2.2 + 0.03) * vec3(2.8, 0.75, 0.16) * ecFire * (0.15 + max(dot(n, to), 0.0)) * exp(-gap * 1.15) * ao * (0.9 + 0.25 * uLow + 0.35 * uHits + 0.06 * ecSin(uTime * 0.7));
    }
    if (abs(uOwn[3]) + abs(uOwn[6]) + abs(uOwn[7]) > 0.3) {   // where the pool may be out of sight a hit also runs out over the land
      float gone = s - 0.4 - 0.8 * (1.0 - uHits);
      col += (alb + 0.1) * (uKind[4] * uKind[4] + 0.3 * ecWarm) * uHits * smoothstep(0.0, 0.2, uHits) * exp(-gone * gone * 22.0) * ao * 0.9;
    }
    if (uOwn[7] < 0.0) {
      vec3 rf = reflect(rd, normalize(vec3(0.02 * sin(q.x * 9.0 + uTime * 0.6), 1.0, 0.02 * sin(q.z * 11.0 - uTime * 0.5))));
      col = mix(col, alb * ecCool * 0.5 + (ecSky(rf) + pcol * dye * 0.15) * (0.35 + 0.65 * pow(1.0 - max(rf.y, 0.0), 2.0)) * (0.5 + 0.5 * shade), ecWet * 0.92);
    }
    float sharp = mix(14.0, 60.0, uTone);
    vec3 hv = normalize(ecLight - rd);
    col += ecWarm * pow(max(dot(n, hv), 0.0), sharp) * (0.10 + 0.6 * uPad) * (1.0 + 0.6 * ecSin(uTime * 0.6 + 40.0 * ecId + 9.0 * ecM.x)) * ao * (0.3 + 0.7 * shade);
    col += pcol * dye * ao * uEnergy * 0.16 + uKeys * fleck * vec3(0.9, 0.75, 0.45);
    col += amber * uMic * gold * 0.6 + uKind[0] * uKind[0] * uDrone * 0.10 * (1.0 - ao) * (1.0 - ecIn);   // a drone lies in the deep between the ropes
    // a phrase runs a glow along one braid
    float lane = (ecLane - (far ? 0.30 : 0.07)) * 80.0, run = s - 0.5 + 0.4 * cos(TAU * uLoop);
    col += uPhrase * exp(-lane * lane) * (0.25 + exp(-run * run * 14.0)) * (uKind[3] + 0.25) * ao * 1.1;
    if (!far) {
      // a cloud's shade lies over the near left
      col *= mix(vec3(0.40, 0.48, 0.58), vec3(1.0), smoothstep(-4.0, -1.4, q.x - 0.25 * q.z + 0.5 * ecSin(q.z * 1.1 + uTime * 0.03)));
    } else {
      // half the land lies in the reeds' shade; a bright curve of light crosses the amber side
      float sh = ecGrass(q.xz);
      col *= mix(vec3(1.0), vec3(0.17, 0.23, 0.33), 0.9 * sh);
      float net = noise(q.xz * 1.5 + vec2(0.05 * uTime, 3.0)), arc = length(q.xz - vec2(5.6, -4.4)) - 4.6 - 0.5 * (net - 0.5);
      float caus = exp(-max(arc, 0.0) * 30.0) * (0.85 * exp(min(arc, 0.0) * 16.0) + 0.22 * exp(min(arc, 0.0) * 2.5)) + 0.6 * exp(-abs(arc + 0.5) * 3.5) * (1.0 - smoothstep(0.0, 0.1, abs(net - 0.5)));
      col += alb * ecWarm * caus * (1.0 - sh) * 2.2;
    }
    if (!far) col = mix(col, fog, 0.5 * smoothstep(0.65, 1.05, s) * smoothstep(4.0, 6.0, t));
  }
  float air_ = max(t - (far ? 4.6 : 3.0), 0.0);
  col = mix(col, fog, (1.0 - exp(-air_ * air_ * (0.010 + 0.015 * uSpace))) * (air ? 0.0 : wet ? 0.3 : 1.0));
  if (far) {
    // the clear dome over it: a broad bow of sheen
    float dome = length((p - vec2(-0.5, -1.0)) * vec2(0.8, 1.0)) - 1.15;
    col += ecCool * 0.10 * exp(-dome * dome * 60.0);
  }
  col = screenOf(col * bright);
  return mix(col, col * col * (3.0 - 2.0 * col), 0.5);
}
