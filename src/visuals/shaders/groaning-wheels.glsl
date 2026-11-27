// name: Groaning wheels
// a: Under the rim
// b: Across the river
// what: Close beneath a wooden water wheel as tall as a house: wet black spokes crossing, boards and box buckets climbing out of the river, each spilling a curtain that breaks to beads before a low sun. Or, from the far bank, three wheels of unlike size turn against a stone channel on arches, with white water, swimmers and a palm.
// follows: Travel turns the wheels, faster when the music is full. Each bucket is a place of the loop and one band, and pours as full as they are. Drone lifts the river, pad warms the light, texture is mist, phrase lights wet spokes or runs along the channel, low bands stir the water. A hit is a splash off a board, a cue brightens bow and curtains, keys brighten drops.
// own: 0 moonlit night at -1, red dusk at 1; 1 clear blue air at -1, thick mist at 1; 2 few broad spokes at -1, many thin ones at 1; 3 low river and only drips at -1, high river and full curtains at 1; 4 far back, the wheel nearly whole, or the channel small under a wide sky at -1, close in at 1; 5 winter, snow on wood and stone at -1, deep moss at 1; 6 open water to the horizon, no bank and no channel, the wheels on trestles at -1, steep walls of a gorge round the sun at 1 (b: a row of many like wheels along the channel at 1); 7 dyed cloths stretched between the spokes at -1, fire poured in place of water and a lamp at every bucket at 1
const float gwN = 24.0, gwP = TAU / 24.0; // the buckets of a wheel
#define gwFree max(-uOwn[6], 0.0)
#define gwMany max(uOwn[6], 0.0)
#define gwSail max(-uOwn[7], 0.0)
#define gwFire max(uOwn[7], 0.0)
bool gwB; // the second variation
float gwMist, gwFlood, gwDry, gwSnow, gwMoss, gwGain, gwWarm;
vec3 gwSun, gwLow, gwHigh, gwIce; // colours of sun, low sky, high sky and snow
// the nearest beam: distance, which way its side faces, where across and along it
struct gwWood { float d; vec2 n; float u, along; };

// A soft step from a to b, either way round.
float gwStep(float a, float b, float x) { float t = sat((x - a) / (b - a)); return t * t * (3.0 - 2.0 * t); }
float gwBell(float x) { return exp(-x * x); }
float gwIn(float d, float px) { return gwStep(px, -px, d); }
// Noise that comes round again after 64 steps upwards.
float gwNoise(vec2 q) {
  vec2 i = floor(q), f = fract(q); f = f * f * (3.0 - 2.0 * f);
  float y0 = mod(i.y, 64.0), y1 = mod(i.y + 1.0, 64.0);
  return mix(mix(hash21(vec2(i.x, y0)), hash21(vec2(i.x + 1.0, y0)), f.x), mix(hash21(vec2(i.x, y1)), hash21(vec2(i.x + 1.0, y1)), f.x), f.y);
}
// How full bucket k pours: the piece at its place in the loop, its band, and more as the loop comes by.
float gwFull(float k) {
  float j = mod(k, gwN), u = (j + 0.5) / gwN;
  float a = piece(vec2(u, 0.3)).a + piece(vec2(u, 0.7)).a;
  float q = 0.14 + 0.14 * hash11(j + 3.0) + gwGain * (0.32 * a + 0.5 * band(u) + 0.3 * uLevel * gwBell((fract(u - uLoop + 0.5) - 0.5) / 0.06)) + 0.3 * uCue;
  return sat(q * (1.0 + 0.8 * gwFlood - 0.7 * gwDry));
}
void gwBeam(inout gwWood o, float c, float w, vec2 n, float along) {
  float e = abs(c) - w;
  if (e < o.d) o = gwWood(e, n, clamp(c / max(w, 1e-4), -1.0, 1.0), along);
}
// One face of a wheel of radius 1.
gwWood gwFace(vec2 q, float turn) {
  gwWood o = gwWood(1e3, vec2(0.0, 1.0), 0.0, 0.0);
  float r = max(length(q), 1e-4), a = mod(atan(q.y, q.x + 1e-6) - turn, TAU);
  vec2 up = q / r, side = vec2(-up.y, up.x);
  float bare = max(-uOwn[2], 0.0), fine = max(uOwn[2], 0.0);
  // rims of straight planks
  float s = TAU / 16.0, k = floor(a / s + 0.5), pr = r * cos(a - s * k);
  gwBeam(o, pr - 0.955, 0.03 + 0.014 * bare, up, a * 0.95);
  gwBeam(o, pr - 0.8, 0.02 + 0.01 * bare, up, a * 0.8);
  gwBeam(o, pr - 0.46, 0.013 - 0.033 * bare + 0.003 * fine, up, a * 0.46);
  gwBeam(o, r - 0.06, 0.06, up, a * 0.2);
  // posts that hold the buckets
  float c = r * sin(a - gwP * floor(a / gwP + 0.5));
  if (abs(r - 0.9) < 0.12) gwBeam(o, c, 0.012, side, r);
  // straight spokes, and two families that miss the middle and cross
  s = TAU / 12.0;
  if (r < 0.97) {
    gwBeam(o, r * sin(a - s * (floor(a / s) + 0.5)), 0.006 + 0.009 * fine - 0.03 * bare, side, r);
    float b = asin(min(0.15 / r, 1.0));
    for (int i = 0; i < 2; i++) {
      float sg = i == 0 ? 1.0 : -1.0;
      k = floor((a - sg * b) / s + 0.5);
      float id = mod(k + 12.0, 12.0), h = hash11(id * 1.7 + float(i) * 13.0), ph = k * s + turn + 0.09 * (h - 0.5);
      vec2 n = vec2(-sin(ph), cos(ph));
      float w = (0.017 + 0.01 * h) * (1.0 - 0.45 * fine) + bare * (0.01 - 0.06 * mod(id, 2.0));
      gwBeam(o, dot(q, n) - sg * 0.15, w, n, r + h * 9.0);
    }
  }
  return o;
}
// Wet timber. to is the way to the light, near how much of it there is.
vec3 gwTimber(gwWood o, vec2 to, float near, float moss) {
  float g = noise(vec2(o.along * 7.0, o.u * 4.0 + 20.0)) * 0.6 + noise(vec2(o.along * 26.0, o.u * 9.0)) * 0.4;
  float u = sat(o.u * dot(o.n, to)), top = o.u * o.n.y;
  vec3 c = mix(vec3(0.003), vec3(0.02, 0.015, 0.01), g * g);
  if (gwB) c = c * 1.5 + vec3(0.085, 0.045, 0.022) * near * g;
  c += gwHigh * 0.07 * sat(top) * g;
  c += gwSun * near * (gwB ? 0.7 * u * u * (0.2 + g) : 2.2 * pow(u, 7.0) * g);
  vec3 green = mix(vec3(0.005, 0.01, 0.002), vec3(0.04, 0.065, 0.008), g) * (0.15 + near + 0.5 * gwMoss);
  c = mix(c, green, moss * gwStep(0.35, 0.6, g + 0.3 * top + 0.25 * gwMoss) * (0.45 + 0.55 * gwMoss));
  return mix(c, gwIce, gwSnow * gwStep(0.1, 0.5, top + 0.35 * (g - 0.5)));
}
// Where the ray meets a box, its face, and how much of the pixel it covers.
float gwBox(vec3 o, vec3 d, vec3 b, out vec3 n, out float cov) {
  vec3 m = 1.0 / d, k = abs(m) * b, a = -m * o, t1 = a - k, t2 = a + k;
  float tn = max(max(t1.x, t1.y), t1.z);
  n = -sign(d) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
  vec3 away = step(t2, t2.yzx) * step(t2, t2.zxy);
  cov = sat((min(min(t2.x, t2.y), t2.z) - tn) * uRes.y / (max(tn, 1e-3) * min(dot(abs(n) + away, abs(m)), 8.0)));
  return tn;
}
// Water off one bucket: x from its middle, h below its lip. A film (x) that breaks to beads (y).
vec2 gwPour(float x, float h, float k, float full, float px) {
  float w = (0.02 + 0.055 * full) * (1.0 + 0.4 * h), s = sqrt(h), u = mod(uTime, 3200.0) * 0.4 - s * 1.35;
  float n = gwNoise(vec2(x * 90.0 + k * 7.0, u * 2.0)) * 0.55 + gwNoise(vec2(x * 230.0 + k * 5.0, u * 4.0)) * 0.45;
  float prof = gwStep(1.0, 0.45, abs(x) / w), lip = gwStep(0.0, 0.05, h - 0.03 * n);
  float film = prof * lip * gwStep(0.42 + 0.3 * sat(h * 1.5), 0.75, n + 0.35 * full * exp(-h * 6.0)) * (0.3 + 0.7 * full) * exp(-h * 1.1);
  float beads = 0.0;
  for (int i = 0; i < 2; i++) {
    float cw = i == 0 ? 0.012 : 0.007, rows = i == 0 ? 8.0 : 20.0;
    float c = floor(x / cw + 40.0), h0 = hash21(vec2(c + float(i) * 31.0, k + 2.0));
    float v = (u + h0 * 3.0) * rows, row = mod(floor(v), 64.0);
    float h1 = hash21(vec2(row + 64.0 * float(i), c + k * 3.0)), h2 = fract(h1 * 57.31), h3 = fract(h1 * 913.7);
    float dy = (fract(v) - 0.5 + 0.35 * (h2 - 0.5)) * 2.0 * s / (rows * 1.35);
    float dx = (fract(x / cw) - 0.5 + 0.5 * (h3 - 0.5)) * cw;
    float rad = cw * (0.1 + 0.2 * h2 * h2) * gwStep(0.0, 0.3, (0.12 + full) * prof * 1.15 - h1 * 0.95), soft = max(px * 0.7, 1e-5);
    float e = length(vec2(dx, dy / (1.7 + 2.0 * h3)));
    beads += (1.0 - gwStep(rad - soft, rad + soft, e)) * sat(rad / soft) * gwStep(0.02, 0.2, h) * (0.45 + 0.55 * h3);
  }
  return vec2(film, min(beads, 1.0));
}
// Water thrown up off a board by a hit, in a fan.
float gwSplash(vec2 at) {
  float t = 0.22 + 0.75 * (1.0 - uHits);
  vec2 v = at / t + vec2(-0.1, 0.5 * t);
  float l = length(v), an = atan(v.x, abs(v.y) + 0.05);
  float n = noise(vec2(an * 11.0, l * 9.0)) * 0.45 + noise(vec2(an * 30.0, l * 40.0 + 5.0)) * 0.55;
  float d = gwStep(0.5, 0.8, n + 0.35 * (0.6 - l)) * gwStep(0.8, 0.25, l) * gwStep(-0.02, 0.02, at.y);
  return (d + 0.5 * exp(-dot(at, at) * 40.0)) * uHits;
}

// In a: the eye, the ray, the sun and its place, the river's level.
vec3 gwRo, gwRd, gwSd, gwEye; vec2 gwSp; float gwYr;
void gwAim(vec2 p) {
  float c4 = uOwn[4], far = max(-c4, 0.0), close = max(c4, 0.0);
  gwEye = vec3(0.12 * c4, 0.0, 2.6 - 0.75 * close + 1.1 * far);
  gwRo = vec3(1.02, -0.69, -0.95) + far * vec3(0.0, 0.2, -1.0) + close * vec3(0.05, 0.06, 0.3);
  gwYr = -0.9 + 0.09 * (gwFlood - gwDry) + 0.025 * uDrone * gwGain;
  vec3 fw = vec3(-0.2462, 0.0998, 0.9641), rt = vec3(0.9689, 0.0, 0.2474), up = cross(fw, rt);
  gwRd = fw * 1.35 + rt * p.x + up * p.y;
  gwSd = normalize(vec3(-0.06 + 0.13 * far, 0.085, 1.0));
  gwSp = 1.35 * vec2(dot(gwSd, rt), dot(gwSd, up)) / dot(gwSd, fw);
}
// Behind the wheel in a: sky, sun, far bank and river.
vec3 gwOpen(float ds) {
  vec3 n = normalize(gwRd);
  float el = n.y, az = gwRd.x / gwRd.z, glow = (exp(-ds * 3.0) * 0.75 + exp(-ds * 9.0) * 1.6) * gwWarm;
  vec3 col = mix(gwLow, gwHigh, gwStep(-0.03, 0.4, el)) + gwSun * glow * 0.75 + gwSun * 5.0 * gwStep(0.034, 0.03, ds);
  float tree = 0.03 + 0.045 * noise(vec2(az * 6.0, 1.0)) + 0.024 * noise(vec2(az * 31.0, 2.0));
  float m = az * 9.0 + 0.3, ph = hash11(floor(m)), pp = fract(m) - 0.3 - 0.4 * ph;
  tree = max(tree, (0.1 + 0.07 * fract(ph * 7.3)) * step(0.5, ph) * (1.0 - pp * pp * 44.0));
  tree *= 1.0 - 0.95 * gwFree;
  if (gwMany > 0.0) {
    float off = az - gwSd.x / gwSd.z + 0.05 * (noise(vec2(el * 7.0, 3.0)) - 0.5) + 0.04 * (noise(vec2(floor(el * 22.0), 9.0)) - 0.5) + 0.02 * (noise(vec2(el * 70.0, az * 30.0)) - 0.5);
    tree = max(tree, gwMany * (off > 0.0 ? 2.6 * (off - 0.1) : -2.6 * (off + 0.15)) * (0.9 + 0.3 * noise(vec2(az * 5.0, 2.0))));
  }
  vec3 far = mix(gwHigh * vec3(0.3, 0.4, 0.3), gwLow * 0.75, 0.3 + 0.4 * gwMist) + gwSun * glow * 0.3;
  far = mix(far, gwIce, gwSnow * 0.5);
  if (gwMany > 0.0) far *= 1.0 - gwMany * 0.75 * noise(vec2(az * 9.0 + 2.0 * el, el * 24.0)) * gwStep(0.02, 0.2, el);
  col = mix(col, far, gwIn(el - tree, 0.003));
  if (el > -0.001) return col;
  float tr = (gwYr - gwRo.y) / min(gwRd.y, -1e-4), ft = 1.0 / (1.0 + 0.3 * tr * tr);
  vec3 g = gwRo + gwRd * tr;
  vec2 rq = vec2(g.x * 2.0 - uTime * 0.12, g.z * 5.0);
  float n1 = noise(rq) - 0.5, n2 = noise(rq * vec2(2.6, 2.2) + vec2(0.0, 9.0)) - 0.5;
  float n3 = noise(vec2(g.x * 26.0 - uTime * 0.5, g.z * 60.0));
  vec2 sl = vec2(n1 * 0.5 + n2 * 0.5, n1 + n2 * 0.9 + (n3 - 0.5) * 0.35) * (0.2 + 0.12 * uLow) * ft;
  vec3 rr = normalize(reflect(n, normalize(vec3(sl.x * 0.6, 1.0, sl.y))));
  float fr = 0.05 + 0.95 * pow(1.0 - sat(abs(el) + 0.4 * sl.y), 5.0);
  vec3 refl = mix(far * 0.6, mix(gwLow, gwHigh, gwStep(-0.02, 0.4, rr.y)), gwStep(0.03, 0.09, rr.y));
  vec3 rp = g + rr * ((0.1 - g.z) / max(rr.z, 0.05));
  float rw = length(rp.xy);
  if (g.z < 0.1) refl *= 1.0 - 0.9 * gwStep(1.06, 0.98, rw);
  float gl = sat(dot(rr, gwSd)), soft = exp(-ds * 1.2);
  vec3 w = mix(vec3(0.004, 0.016, 0.014), vec3(0.016, 0.045, 0.03), 0.5 + n1) * (0.2 + 2.0 * gwHigh) + refl * fr;
  float fire = pow(gl, 60.0) * 0.5 + pow(gl, 300.0) * (2.2 + 3.0 * uHigh);
  w += gwSun * gwWarm * fire / (1.0 + 0.35 * fire);
  float foam = gwBell((g.z + 0.03) / 0.07) * gwBell((g.x - 0.6) / 0.4) * sat(0.2 + uLevel);
  w += (gwSun * soft + gwHigh) * gwWarm * foam * n3 * n3 * 3.0;
  return mix(col, w, gwStep(0.0, 0.012, -el));
}
// Boards and box buckets between the faces.
void gwBoxes(inout vec3 col, vec2 q0, vec2 q1, float turn, vec2 ts, float lit) {
  float r0 = length(q0), r1 = length(q1), a0 = atan(q0.y, q0.x + 1e-5) - turn, a1 = atan(q1.y, q1.x + 1e-5) - turn;
  a1 = a0 + mod(a1 - a0 + PI, TAU) - PI;
  float k0 = floor(min(a0, a1) / gwP), k1 = max(a0, a1) / gwP + 0.9, best = 1e3, cov = 0.0, bk = 0.0;
  bool here = !gwB && min(r0, r1) < 1.2 && max(r0, r1) > 0.8;
  vec3 bn = vec3(0.0);
  for (int i = 0; i < 8 && here; i++) {
    float k = k0 + 0.5 * float(i), cv;
    if (k > k1) break;
    bool board = fract(k) > 0.25;
    vec2 ca = vec2(cos(k * gwP + turn), sin(k * gwP + turn));
    vec3 o = vec3(dot(gwRo.xy, ca) - (board ? 1.03 : 0.93), ca.x * gwRo.y - ca.y * gwRo.x, gwRo.z - 0.15), n;
    vec3 d = vec3(dot(gwRd.xy, ca), ca.x * gwRd.y - ca.y * gwRd.x, gwRd.z);
    d += step(abs(d), vec3(1e-5)) * 2e-5;
    float tn = gwBox(o, d, board ? vec3(0.1, 0.012, 0.18) : vec3(0.075, 0.06, 0.138), n, cv);
    if (cv > 0.0 && tn < best) { best = tn; cov = cv; bn = vec3(n.x * ca + n.y * vec2(-ca.y, ca.x), n.z); bk = mod(k, gwN); }
  }
  if (best > 1e2) return;
  vec3 b = gwRo + gwRd * best;
  float gr = noise(vec2(length(b.xy) * 70.0, b.z * 5.0 + bk * 5.0)), seam = gwStep(0.1, 0.0, abs(fract(length(b.xy) * 17.0) - 0.5));
  vec3 c = mix(vec3(0.005), vec3(0.03, 0.024, 0.016), gr * gr) + gwHigh * 0.1 * sat(bn.y) + gwSun * lit * 0.16 * sat(dot(bn.xy, ts)) * (0.2 + gr);
  c *= 1.0 - 0.6 * seam;
  c = mix(c, vec3(0.03, 0.045, 0.01) * (0.3 + lit + 0.3 * gwMoss) * (0.2 + gr), gwStep(0.5, 0.75, noise(b.zy * vec2(14.0, 9.0) + bk) + 0.3 * gwMoss) * (0.45 + 0.5 * gwMoss));
  c = mix(c, gwIce, gwSnow * gwStep(0.2, 0.6, bn.y));
  col = mix(col, c, cov * gwStep(-0.002, 0.002, b.y - gwYr));
}

// In b: u along the stone channel, v above the eye, and how far.
const float gwYh = -0.13;
vec3 gwWall(vec2 p) {
  float x = p.x / 1.3, u = (gwEye.x - x * gwEye.z) / min(x * 0.45 - 0.893, -0.08), z = (gwEye.z + u * 0.45) / 1.3;
  return vec3(u, (p.y - gwYh) * z, z);
}
// In b: sky, hills and the channel on its arches. shade is a wheel's shadow.
vec3 gwTown(vec2 q, vec3 w, float px, float shade, vec3 light, float water) {
  float el = q.y - gwYh, u = w.x, v = w.y, top = 0.76 - 1.5 * gwFree;
  vec3 col = mix(gwLow + gwSun * 0.12, gwHigh, gwStep(0.0, 0.6, el + 0.12 * q.x));
  float cl = noise(vec2(q.x * 1.6 + uTime * 0.004, el * 9.0)) * 0.6 + noise(vec2(q.x * 4.0 + uTime * 0.006, el * 23.0 + 4.0)) * 0.4;
  col = mix(col, gwSun * 0.55 + gwLow * 0.4, gwStep(0.48, 0.85, cl) * 0.6);
  if (gwFree > 0.0) {
    float sd = length(q - vec2(0.5, 0.16));
    col += gwSun * gwFree * gwWarm * (0.4 * exp(-sd * 4.0) + 1.4 * gwStep(0.085, 0.082, sd) * (1.0 - 0.75 * gwMist));
  }
  float hill = (1.0 - 0.9 * gwFree) * 0.035 + (1.0 - 0.95 * gwFree) * 0.06 * noise(vec2(q.x * 4.0, 5.0)) + 0.02 * (1.0 - 0.9 * gwFree) * noise(vec2(q.x * 34.0, 8.0));
  vec3 garden = mix(light * vec3(0.12, 0.17, 0.05), gwLow, sat(0.25 + el * 2.0 + 0.4 * gwMist));
  garden *= 0.8 + 0.4 * noise(q * vec2(60.0, 80.0));
  if (gwFree > 0.0) {
    float st = noise(vec2(q.x * 6.0 + 0.05 * uTime, el * 160.0)) * gwStep(0.0, -0.02, el), sx = (q.x - 0.5) / 0.14;
    garden = mix(garden, mix(gwLow, gwHigh, gwStep(0.0, -0.2, el) * 0.8) * (0.7 + 0.35 * st) + gwSun * gwWarm * (0.25 + 0.7 * st * st) * exp(-sx * sx) * (1.0 - 0.6 * gwMist), gwFree);
  }
  garden = mix(garden, gwIce, gwSnow * 0.75 * (1.0 - gwFree));
  col = mix(col, garden, gwIn(el - hill, 0.004));
  float au = u - 0.62 * floor(u / 0.62 + 0.5), bu = au + 0.085, sv = max(v - 0.24, 0.0);
  float ad = length(vec2(au, sv)) - 0.205, bd = length(vec2(bu, sv)) - 0.205;
  float row = floor(v * 17.0), br = u * 8.5 + 0.5 * mod(row, 2.0) + 0.3 * hash11(row);
  float big = noise(vec2(u, v) * vec2(3.0, 2.2)), grain = noise(vec2(u, v) * 46.0), damp = gwStep(0.3, -0.05, v - water - 0.16 * big);
  float joint = max(gwStep(0.1, 0.02, abs(fract(v * 17.0 + 0.5) - 0.5)), gwStep(0.06, 0.01, abs(fract(br + 0.5) - 0.5))) * gwStep(0.006, 0.0015, px);
  vec3 stone = mix(vec3(0.5, 0.37, 0.24), vec3(0.85, 0.68, 0.48), 0.35 * hash21(vec2(floor(br), row)) + 0.65 * big) * (0.75 + 0.35 * grain) * (1.0 - 0.4 * joint);
  // the ring of stones round each arch, damp low down
  float va = atan(au, sv + 1e-3) * 7.0;
  stone = mix(stone, vec3(0.7, 0.55, 0.39) * (0.8 + 0.4 * hash11(floor(va))), gwStep(0.065, 0.06, ad) * step(0.001, sv));
  stone *= mix(vec3(1.0), vec3(0.28, 0.33, 0.2), damp * 0.85);
  stone = mix(stone, vec3(0.09, 0.15, 0.035), gwMoss * gwStep(0.4, 0.75, big + 0.25 * damp));
  vec3 wall = stone * light * (1.0 - 0.68 * shade) * (1.0 - 0.5 * gwStep(0.675, 0.705, v));
  wall = mix(wall, light * mix(vec3(0.85, 0.68, 0.48), gwHigh + 0.6, gwSnow), gwIn(abs(v - top + 0.035) - 0.018, px));
  // threads of water down the wall in two places
  float x = u - (u < 1.0 ? 0.3 : 1.71), h = max(top - 0.05 - v, 0.0), lane = floor(x / 0.011), lh = hash11(lane + 40.0);
  float th = gwNoise(vec2(lane * 3.0 + 9.0, mod(uTime, 3200.0) * 0.7 - sqrt(h) * 6.0));
  float run = sat(0.25 + uPhrase * gwGain + 0.4 * uCue + 0.5 * gwFlood - 0.4 * gwDry);
  float l = gwStep(0.004 + px, 0.003 - px, abs(fract(x / 0.011) - 0.5) * 0.011) * gwStep(0.15, 0.05, abs(x)) * step(0.001, h);
  l *= gwStep(0.35, 0.8, th + 0.3 - 0.5 * h) * gwStep(lh, lh + 0.4, run * 1.3);
  wall = mix(wall, (gwSun * 0.7 + gwHigh * 0.8) * gwWarm, l * 0.7);
  vec3 jamb = vec3(0.75, 0.56, 0.36) * light * (0.5 + 0.2 * grain) * gwStep(-0.3, 0.3, v);
  wall = mix(wall, mix(jamb, col, gwIn(bd, px)), gwIn(ad, px));
  col = mix(col, wall, gwIn(v - top, px));
  float gleam = uPhrase * gwGain * gwStep(0.3, 0.7, noise(vec2(u * 2.2 - uTime * 0.09, 4.0)));
  return mix(col, gwSun * (0.4 + 1.2 * gleam) + gwHigh * 0.4, 0.8 * gwIn(abs(v - top - 0.006) - 0.006 - 0.004 * gleam, px));
}
// Swimmers, and the palm that leans in.
void gwNear(inout vec3 col, vec2 p, vec3 light, float px) {
  for (int i = 0; i < 4 && gwFree < 0.5; i++) {
    float fi = float(i), h = hash11(fi + 5.0), ph = uTime * (0.035 + 0.02 * h) + fi * 2.1, sz = (0.0045 + 0.0012 * fi) * (1.0 - gwSnow) + 1e-5 * gwSnow;
    vec2 e = p - vec2(-0.2 + 0.23 * fi + 0.12 * sin(ph), -0.29 - 0.035 * fi * h - 0.02 * fi);
    col += light * 0.13 * gwBell((e.y + 0.6 * sz) / 0.002) * gwBell(e.x / 0.025);
    col = mix(col, light * vec3(0.04, 0.02, 0.01), gwIn(length(e) - sz, px) * step(-sz * 0.4, e.y));
  }
  const float away = min(0.75 * abs(uOwn[6]) + 0.75 * max(-uOwn[5], 0.0), 0.9);
  vec2 crown = vec2(-0.69 - away + 0.004 * sin(uTime * 0.3), 0.27), pd = p - crown;
  vec3 dark = vec3(0.008, 0.011, 0.009) * (0.5 + gwHigh);
  float ty = (p.y + 0.55) / 0.82, off = p.x - mix(-0.9 - away, crown.x, ty * ty * 0.6 + 0.4 * ty);
  col = mix(col, dark + light * 0.1 * gwStep(0.0, -0.012, off), gwIn(abs(off) - 0.016 + 0.005 * ty, px) * step(ty, 1.0));
  for (int i = 0; i < 11 && dot(pd, pd) < 0.17; i++) {
    float fi = float(i), h = hash11(fi + 1.0), an = -0.75 + 0.465 * fi + 0.2 * h + 0.02 * sin(uTime * 0.5 + fi), L = 0.26 + 0.12 * h;
    vec2 d = vec2(cos(an), sin(an)), g = vec2(dot(pd, d), dot(pd, vec2(-d.y, d.x)));
    float e = g.y + (d.x >= 0.0 ? 1.5 : -1.5) * g.x * g.x * (0.4 + abs(d.x)), t = sat(g.x / L), wl = 0.055 * sqrt(sat(t * 3.0)) * (1.0 - t * t);
    float leaf = abs(fract((g.x - abs(e) * 0.9) * 80.0) - 0.5) / 80.0 - 0.0022 * (1.0 - abs(e) / max(wl, 1e-3));
    float dd = max(min(abs(e) - 0.002, max(abs(e) - wl, leaf)), max(-g.x, g.x - L));
    col = mix(col, dark + light * 0.035 * h * vec3(0.8, 1.0, 0.4), gwIn(dd, px));
  }
}

vec3 render(vec2 p) {
  gwB = uVar > 0.5;
  float night = max(-uOwn[0], 0.0), dusk = max(uOwn[0], 0.0);
  gwMist = max(uOwn[1], 0.0); gwDry = max(-uOwn[3], 0.0); gwFlood = max(uOwn[3], 0.0); gwSnow = max(-uOwn[5], 0.0); gwMoss = max(uOwn[5], 0.0);
  gwGain = 0.5 + uEnergy;
  gwWarm = 0.75 + 0.5 * uPad * gwGain + 0.35 * uLevel * gwGain;
  gwSun = mix(mix(vec3(1.0, 0.74, 0.42), vec3(1.0, 0.36, 0.13), dusk), vec3(0.4, 0.52, 0.75), night);
  gwLow = mix(mix(gwB ? vec3(0.62, 0.42, 0.32) : vec3(0.3, 0.215, 0.115), vec3(0.36, 0.11, 0.05), dusk), vec3(0.03, 0.05, 0.085), night);
  gwHigh = mix(mix(gwB ? vec3(0.15, 0.2, 0.31) : vec3(0.06, 0.115, 0.14), vec3(0.085, 0.06, 0.1), dusk), vec3(0.01, 0.017, 0.035), night);
  // clear blue air, and winter's pale sun
  float day = 1.0 - max(night, dusk), clear = day * max(-uOwn[1], 0.0);
  gwLow = mix(gwLow, (gwB ? 1.0 : 0.6) * vec3(0.3, 0.46, 0.54), 0.75 * clear);
  gwHigh = mix(gwHigh, (gwB ? 1.0 : 0.45) * vec3(0.054, 0.18, 0.38), clear);
  gwSun = mix(gwSun, vec3(0.8, 0.82, 0.86), 0.6 * gwSnow * day);
  gwLow = mix(gwLow, vec3(dot(gwLow, vec3(0.42))), 0.8 * gwSnow);
  gwIce = gwHigh * 0.9 + gwLow * 0.6 + gwSun * 0.06;
  float fine = 1.0 / uRes.y;
  gwAim(p);

  // where this pixel meets the two faces of a wheel, and its shadow
  vec2 q0, q1, qs, ts; float px0, px1, turn, water, lit, fall = 1.0, kOff = 0.0, dep = 0.0, rip = 0.0, R = 1.0, wl0 = 0.0, ds = length(gwSp - p);
  vec3 w = vec3(0.0), light = (gwSun * 0.72 + gwHigh * 0.5) * gwWarm;
  vec2 sp = p;
  if (!gwB) {
    float t0 = -gwRo.z / gwRd.z, t1 = (0.3 - gwRo.z) / gwRd.z;
    q0 = gwRo.xy + gwRd.xy * t0; q1 = gwRo.xy + gwRd.xy * t1; qs = vec2(9.0);
    px0 = t0 * fine * 0.6; px1 = t1 * fine * 0.6;
    turn = mod(uTravel * 0.06, TAU); water = gwYr;
    ts = normalize((gwSp - p) / max(ds, 1e-3) + vec2(0.3, -0.1) + 1e-4);
    lit = (0.12 + 1.3 * exp(-ds * 2.0)) * gwWarm * (1.0 + 1.4 * uPhrase * gwGain);
  } else {
    water = -0.22 + 0.07 * (gwFlood - gwDry) + 0.012 * uDrone * gwGain;
    w = gwWall(p);
    dep = gwYh + water / w.z - p.y;
    if (dep > 0.0) {
      // the river gives the evening back in long slow lines
      float iz = 1.0 / (gwYh - p.y + 0.03);
      vec2 rq = vec2(p.x * iz * 0.8 + uTime * 0.05, iz * 5.0);
      rip = noise(rq) - 0.5 + 0.6 * (noise(rq * vec2(2.3, 2.1) + 7.0) - 0.5);
      sp = vec2(p.x + rip * 0.05 * dep, 2.0 * (gwYh + water / w.z) - p.y + rip * (0.008 + 0.09 * dep) * (0.8 + 0.5 * uLow));
      w = gwWall(sp);
    }
    int i = w.x < 0.33 ? 0 : w.x < 1.75 ? 1 : 2;
    vec4 wh;
    if (gwMany > 0.0) i = w.x < mix(0.33, -0.16, gwMany) ? 0 : w.x < mix(1.75, 0.68, gwMany) ? 1 : int(2.0 + clamp(floor((w.x - mix(2.45, 1.1, gwMany)) / 0.84 + 0.5), 0.0, 3.0));
    wh = i == 0 ? vec4(-0.52, 0.36, 0.66, 0.05) : i == 1 ? vec4(0.98, 0.2, 0.47, 0.083) : vec4(2.45, 0.12, 0.4, 0.067);
    if (gwMany > 0.0) wh = i > 2 ? vec4(mix(2.45, 1.1, gwMany) + 0.84 * float(i - 2), 0.16, 0.37 * gwMany + 1e-3, 0.06 + 0.005 * float(i)) : mix(wh, vec4(0.84 * float(i) - 0.58, 0.16, 0.37, wh.w), vec4(vec3(gwMany), 0.0));
    R = wh.z; turn = mod(uTravel * wh.w, TAU); kOff = float(i) * 8.0; fall = 1.0 - 0.28 * float(i);
    q0 = (w.xy - wh.xy) / R; q1 = q0 - vec2(0.09, 0.015); qs = q0 - vec2(0.3, -0.15);
    px0 = px1 = fine * w.z * 0.7 / R;
    ts = vec2(-0.8, 0.6); lit = 0.4 * gwWarm;
    wl0 = water; water = (water - wh.y) / R;
  }
  gwWood f0 = gwFace(q0, turn), f1 = gwFace(q1, turn + 0.05);
  if (gwFree > 0.0) {
    float tr = length(vec2(0.45, 1.2));
    for (int i = 0; i < 2; i++) {
      vec2 n = vec2(i == 0 ? 1.2 : -1.2, 0.45) / tr;
      if (q1.y < 0.0) gwBeam(f1, dot(q1, n), (0.035 + 0.02 * float(gwB)) * gwFree, n, q1.y);
    }
  }
  float shade = gwFree > 0.99 ? 0.0 : gwStep(0.03, -0.02, min(gwFace(qs, turn).d, abs(length(qs) - 0.94) - 0.07));
  vec3 col = gwB ? gwTown(sp, w, fine * w.z * 0.7, shade, light, wl0) : gwOpen(ds);
  vec3 haze = gwB ? light * 0.45 : mix(gwLow, gwHigh, 0.3) * 0.8 + gwSun * (0.08 + 0.7 * exp(-ds * 2.6)) * gwWarm;

  // a bow standing in the spray
  float br = (length(p - (gwB ? vec2(-0.3, -0.45) : vec2(-0.12, -0.5))) - 0.62) / 0.028;
  vec3 bow = vec3(br - 0.7, br, br + 0.7);
  col += exp(-bow * bow) * (gwSun + 0.3) * (0.025 + (gwB ? 0.4 : 0.22) * uCue + 0.05 * uPad * gwGain) * gwStep(0.0, 0.5, p.x) * gwStep(0.35, -0.2, p.y);

  // the wheel: far face, boards and buckets, near face
  vec3 c1 = mix(gwTimber(f1, ts, lit, 0.3), haze, (gwB ? 0.06 : 0.14) + 0.35 * gwMist + 0.1 * uTexture * gwGain);
  col = mix(col, c1, gwIn(f1.d, px1) * gwStep(-px1, px1, q1.y - water));
  float above = gwStep(-px0, px0, q0.y - water), r = max(length(q0), 1e-4);
  if (gwB) {
    float a = atan(q0.y, q0.x + 1e-5) - turn, bd = max(abs(r * sin(a - gwP * floor(a / gwP + 0.5))) - 0.055, abs(r - 0.93) - 0.07);
    float pd = max(abs(r * sin(a - gwP * (floor(a / gwP) + 0.5))) - 0.014, abs(r - 1.02) - 0.1);
    vec3 bc = light * mix(vec3(0.05, 0.035, 0.025), vec3(0.22, 0.15, 0.09), sat(dot(q0 / r, ts)) * 0.8 + 0.2 * f0.u);
    col = mix(col, mix(bc, gwIce, gwSnow * sat(q0.y / r)), gwIn(min(bd, pd), px0) * above);
  }
  if (gwSail > 0.0) for (int i = 0; i < 2; i++) {
    vec2 q = mix(q1, q0, 0.25 + 0.5 * float(i));
    float rr = max(length(q), 1e-4), a = mod(atan(q.y, q.x + 1e-6) - turn - 0.15 * float(i), TAU) / TAU * 12.0, k = floor(a), x = fract(a), h = hash11(k + 3.0);
    float rim = 0.79 - 0.5 * x * (1.0 - x) * (0.3 + 0.3 * h), edge = min((min(x, 1.0 - x) - 0.02 - 0.1 * (1.0 - gwSail)) * rr * 0.52, min(rim - rr, rr - 0.17 - 0.5 * (1.0 - gwSail)));
    float fold = noise(vec2(x * 7.0 + k * 5.0, rr * 2.5 + 0.1 * uTime)), weave = 0.92 + 0.08 * sin(rr * 260.0);
    if (mod(k, 2.0) < 0.5 == (i > 0)) {
      vec3 dye = uKind[int(mod(k, 5.0))];
      dye = mix(vec3(dot(dye, vec3(0.333))), dye, 0.92);
      dye *= mix(vec3(0.6), dye, 0.8);
      vec3 c = dye * (gwB ? 0.55 : 1.0) * (gwHigh * 2.2 + gwLow * 0.9 + gwSun * lit * 1.1 * (0.45 + 0.8 * fold)) * weave * (0.7 + 0.7 * rr + 0.6 * uPad);
      c *= 1.0 - 0.3 * gwStep(0.06, 0.05, abs(rr - 0.62 - 0.06 * h)) * step(0.4, h);
      col = mix(col, mix(c, haze, (0.3 - 0.2 * float(i)) * gwMist), gwIn(-edge, px0) * gwStep(-px0, px0, q.y - water) * 0.94);
    }
  }
  gwBoxes(col, q0, q1, turn, ts, lit);
  col = mix(col, gwTimber(f0, ts, lit, gwB ? 0.35 : 0.6), gwIn(f0.d, px0) * above);
  vec3 fire = mix(vec3(1.0, 0.36, 0.08), uKind[4] * uKind[4], 0.35);
  if (gwFire > 0.0) {
    float a = atan(q0.y, q0.x + 1e-5) - turn, k = floor(a / gwP + 0.5), da = r * sin(a - gwP * k);
    vec2 e = vec2(da, r - 0.93);
    float g = length(e), on = gwFull(mod(k, gwN) + kOff);
    col += fire * gwFire * above * (gwStep(0.03, 0.02, g) * 3.0 + exp(-g * 22.0) * 1.2 + 0.25 * exp(-abs(r - 0.9) * 5.0)) * (0.25 + 1.1 * on) * gwStep(1.5, 1.0, r);
  }

  float blaze = gwB ? 1.0 : 0.15 + 0.9 * exp(-ds * 1.8) + 3.0 * exp(-ds * 5.0);
  vec2 q = gwB ? q0 : gwRo.xy + gwRd.xy * ((-0.05 - gwRo.z) / gwRd.z);
  float side = acos(clamp(q.x / 0.95, -1.0, 1.0));
  for (int i = 0; i < 2; i++) {
    float k = gwB ? floor(((i == 0 ? side : -side) - turn) / gwP + 0.5) : floor((-side - turn) / gwP) + float(i);
    float an = k * gwP + turn;
    vec2 at = 0.95 * vec2(cos(an), sin(an));
    float h = at.y - q.y, x = q.x - at.x;
    if (h < 0.0 || abs(x) > 0.11 || q.y < water) continue;
    an -= TAU * floor((an + PI) / TAU);
    k = mod(k, gwN) + kOff;
    float full = gwFull(k) * gwStep(-1.62, -1.2, an) * gwStep(1.9, 1.1, an);
    vec3 z = vec3(x, h, px0) * (gwB ? 0.25 + 0.25 * fall : 1.0);
    vec2 f = gwPour(z.x, z.y, k, full, z.z) * sat(full * 9.0) * gwStep(0.11, 0.08, abs(x)) * fall;
    vec3 drop = mix(gwHigh, gwSun, 0.62) * mix(vec3(1.0), uKind[int(mod(k, 5.0))] * 1.5, 0.2) * gwWarm * blaze * (1.0 + 0.5 * uCue + max(uKeys, uMic));
    if (gwFire > 0.0) drop = mix(drop, fire * (1.6 + 2.0 * exp(-h * 2.0)), gwFire);
    col = mix(col, col * 0.5 + drop * 0.7, f.x);
    col = mix(col, drop * 1.6 + gwHigh * 0.12, f.y * 0.9);
  }
  // spray standing over the river
  float sy = (q.y - water) * R, sx = gwB ? sp.x * 1.5 : q.x;
  float sw = noise(vec2(sx * 3.0 + 4.0, sy * 4.0 - uTime * 0.05)) * 0.6 + noise(vec2(sx * 8.0 - uTime * 0.04, sy * 9.0 - uTime * 0.1)) * 0.4;
  float spray = exp(-abs(sy) * (gwB ? 8.0 : 7.0)) * gwStep(0.2, 0.85, sw + 0.15) * (0.08 * uSpace + 0.06 + 0.6 * uTexture * gwGain + 0.4 * gwMist) * (gwB ? 0.7 : gwStep(-0.1, 0.5, sx));
  col = mix(col, haze * 1.1, min(spray, 0.6));
  if (gwB) {
    col = mix(col, light * 0.4 + gwLow * 0.4, gwMist * sat(0.08 + 0.16 * w.z));
    if (dep > 0.0) {
      vec3 wet = col * (0.3 + 0.5 * exp(-dep * 5.0)) + mix(vec3(0.006, 0.02, 0.018), vec3(0.02, 0.05, 0.045), 0.5 + rip) * (0.3 + gwHigh * 2.0);
      col = gwFree > 0.0 ? mix(col, wet, mix(1.0, smoothstep(0.0, 0.22, dep), gwFree)) : wet; // no shore to begin at
    }
    gwNear(col, p, light, fine);
  } else col = mix(col, haze, gwMist * 0.25);
  vec2 base = gwB ? vec2(-0.12, gwYh - 0.1) : vec2(0.0, -0.36);
  float spl = gwSplash((p - base) / (gwB ? 0.6 : 0.85));
  col = mix(col, mix(gwSun, uKind[4], 0.25) * (gwB ? 1.1 : 0.8 + 1.2 * exp(-ds * 2.0)), min(spl, 1.0) * 0.85);
  float l = dot(col, vec3(0.3, 0.59, 0.11));
  col = max(mix(vec3(l), col, 1.18), 0.0) * 1.25 * l / (l + mix(0.1, 0.045, uTone));
  return screenOf(col);
}
