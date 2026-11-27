// name: Domino run
// a: Schoolroom floor
// b: Garden wall
// what: Some two hundred and fifty painted wooden slabs stand in one line on a schoolroom floor in late sun, from close at the right through a double spiral to the far wall; a long fall runs along it and the fallen stand up again behind; or stone slabs on a stepped garden wall and across a plank, trees and sky behind, a ball at the end.
// follows: The loop is where the fall has come to. Each kind paints a stretch of the line, the piece each slab, and the clouds; drone tints the low sky, melody the lawn and hills, pads lift the shade, texture the lichen. Lows and Tone brighten the sun, bands stir what stands. A hit lights and tips a few slabs, a cue shivers the line, keys light some. Space widens.
// own: 0 moonlight at -1, a red low sun at 1; 1 squat thick blocks at -1, tall thin planks at 1; 2 slabs all chalk white before a cold blue wall, or in snow, at -1, in silence deep red with a few of gold before a dark green wall, or under autumn leaves, at 1; 3 seen from low down at -1, from high above at 1; 4 a white floor, or a whitewashed wall, at -1, a dark slate floor, or red brick, at 1
const float DR_R = 1.75, DR_D = 0.46, DR_OUT = 25.1327412; // between the turns of the spiral, from slab to slab, one arm of it
// an if that is stepped over whole
#define DR_IF(c) for (int go = (c) ? 1 : 0; go > 0; go--)
bool drG;                               // the garden wall
float drH, drW, drT, drN, drFirst, drF; // height, width, thickness; how many, the first one, where the front is
float drLie, drRise, drRest, drPx, drStir, drCue, drKnock, drNear; // how many lie and are rising, how far over; a pixel; what a band, a cue and a hit stir, and where
vec3 drSun, drKey, drSky, drSide; vec2 drA; vec3 drP; float drC, drS; // the sun; the slab in hand: its foot, its way, its lean
vec4 drOne, drTwo;                      // the two nearest slabs: how far, how much of the pixel, which
float drGrey(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
float drIn(float d, float e) { return sat(0.5 - d / max(e, 1e-5)); }

// How high the wall stands under slab i.
float drBase(float i) {
  if (!drG) return 0.0;
  return 0.4 * (step(-9.5, i) + step(-6.5, i) + step(-3.5, i) - step(5.5, i) - step(7.5, i));
}
// How many slabs back from the front slab i is; just ahead of the front it is nearly drN.
float drBack(float i) { return drN * fract(drF - (i - drFirst) / drN); }
float drLean(float i) {
  float b = drBack(i), rest = drRest;
  if (drG) {
    float on = drBase(i + 1.0) - drBase(i), on2 = drBase(i + 2.0) - drBase(i);
    if (on > 0.1) rest = 0.5; else if (on2 > 0.1) rest = 0.85; else if (on < -0.1) rest = 1.4;
  }
  float x = min(b / 6.3, 1.0), f = x * (1.5 - 0.5 * x * x) * (1.0 - smoothstep(drLie, drLie + drRise, b));
  float e = i - drNear, stir = drStir * sin(1.3 * uTime + i * 1.7) + drCue * sin(i * 0.55) + drKnock * max(0.0, 1.0 - 0.3 * e * e);
  return rest * f + stir * (1.0 - f);
}
// Where slab i stands: two straight runs and a double spiral of half circles.
void drStand(float i) {
  float th = drLean(i);
  drC = cos(th); drS = sin(th);
  if (drG) { drP = vec3(i * DR_D, drBase(i), 0.0); drA = vec2(1.0, 0.0); return; }
  float s = i * DR_D / DR_R, a = abs(s);
  vec2 p;
  if (a > DR_OUT) { p = vec2(-4.0, a - DR_OUT); drA = vec2(0.0, 1.0); }
  else {
    float n = floor(sqrt(a * 2.0 / PI)), g = (a - 0.5 * PI * n * n) / (n + 0.5), w = mod(n, 2.0) > 0.5 ? -1.0 : 1.0;
    p = w * vec2(0.5 - (n + 0.5) * cos(g), (n + 0.5) * sin(g)); drA = w * vec2(sin(g), cos(g));
  }
  p *= s < 0.0 ? -DR_R : DR_R;
  drP = vec3(p.x, 0.0, p.y);
}
vec3 drInto(vec3 v) { // a direction in the frame of the slab: across, up it, through it
  float f = dot(v.xz, drA);
  return vec3(v.x * drA.y - v.z * drA.x, drC * v.y + drS * f, drC * f - drS * v.y);
}
vec3 drOut(vec3 v) {
  float f = drC * v.z + drS * v.y;
  return vec3(v.x * drA.y + f * drA.x, drC * v.y - drS * v.z, f * drA.y - v.x * drA.x);
}
// How much of a ray as wide as px falls on a box; t is how far off it is.
float drBox(vec3 o, vec3 d, vec3 h, float px, float foc, out float t) {
  d += (step(0.0, d) * 2.0 - 1.0) * 1e-5;
  vec3 m = 1.0 / d, n = -o * m, k = abs(m) * h, a = n - k, b = n + k, am = abs(m);
  t = max(a.x, max(a.y, a.z));
  float e = min(b.x, min(b.y, b.z));
  if (e < 0.0 || e - t < -0.5) return 0.0;
  float ga = t * (t == a.x ? am.x : t == a.y ? am.y : am.z), gb = e * (e == b.x ? am.x : e == b.y ? am.y : am.z);
  float wide = (px + foc * max(5.0 / max(t, 0.5) - 1.0, 0.0)) * sqrt(ga * ga + gb * gb);
  return t < 0.0 ? 0.0 : sat(0.5 + (e - t) / max(wide, 1e-5));
}
void drMeet(vec3 ro, vec3 rd, float i, float px, float foc) {
  if (i == drOne.z || i == drTwo.z) return;
  drStand(i);
  float t, c = drBox(drInto(ro - drP) - vec3(0.0, 0.5 * drH, -0.5 * drT), drInto(rd), vec3(0.5 * drW, 0.5 * drH, 0.5 * drT), px, foc, t);
  if (c < 0.02) return;
  if (t < drOne.x) { drTwo = drOne; drOne = vec4(t, c, i, 0.0); }
  else if (t < drTwo.x) drTwo = vec4(t, c, i, 0.0);
}
// How far along the line the place q is, and how far beside it.
float drAlong(vec2 q, out float beside) {
  if (drG) { beside = 0.0; return q.x; }
  q /= DR_R;
  float w = q.y < 0.0 ? -1.0 : 1.0, o = w; q *= w;
  vec2 v = q - vec2(0.5, -1e-5);
  float r = length(v), n = min(floor(r), 3.0), run = abs(q.x + 4.0), a = 0.5 * PI * n * n + (n + 0.5) * atan(v.y, -v.x);
  beside = abs(r - n - 0.5);
  if (mod(n, 2.0) > 0.5) w = -w;
  if (run < beside) { beside = run; a = DR_OUT + q.y; w = o; }
  beside *= DR_R;
  return w * a * DR_R;
}
// The slabs a ray meets between t0 and t1, the nearest two kept.
void drWalk(vec3 ro, vec3 rd, float t0, float t1, float px, float foc) {
  drOne = drTwo = vec4(1e4, 0.0, -1e4, 0.0); drTwo.z = -2e4;
  float go = (t1 - t0) * length(rd.xz);
  int n = drG ? 1 : int(clamp(ceil(go / 0.7), 1.0, 8.0));
  float dt = (t1 - t0) / float(n), half0 = drG ? 0.5 : 0.5 * go / float(n);
  for (int k = 0; k < n; k++) {
    float t = t0 + (float(k) + 0.5) * dt, beside;
    if (drOne.y > 0.97 && t - 0.5 * dt > drOne.x + 1.0) break;
    vec3 q = ro + rd * t;
    float s = drAlong(q.xz, beside), i = s / DR_D, b = drBack(i - 2.0);
    bool down = b < drLie + drRise + 4.0;
    if (beside > 0.5 * drW + min(half0, 0.36) + (down ? 0.3 : 0.05)) continue;
    float lo = ceil((s - (down ? drH + 0.1 : 0.12) - half0) / DR_D), hi = floor((s + drT + 0.05 + half0) / DR_D);
    lo = max(lo, drFirst); hi = min(hi, drFirst + drN - 1.0);
    for (int j = 0; j < 6; j++) { float m = lo + float(j); if (m > hi) break; drMeet(ro, rd, m, px, foc); }
  }
}
// Sun through three tall windows on the left, barred; px is how soft the edge is.
float drLit(vec3 w, float px) {
  if (drG) return 1.0;
  float k = (w.x + 15.0) / max(-drSun.x, 0.1), h = w.y + k * drSun.y, z = w.z + k * drSun.z, soft = px + 0.012 * k;
  float f = abs(fract(z / 8.6 + 0.12) - 0.5) * 8.6, g = abs(fract(f / 2.1 + 0.5) - 0.5) * 2.1, r = abs(fract(h / 3.2 + 0.2) - 0.5) * 3.2;
  return drIn(f - 3.15, soft) * (1.0 - 0.85 * drIn(g - 0.1, soft)) * (1.0 - 0.85 * drIn(r - 0.1, soft)) * drIn(1.6 - h, soft) ;
}
// The paint of slab i: five stretches, each with a kind's colour among the schoolroom's own five.
vec3 drPaintOf(float i) {
  float u = (i - drFirst) / drN, z = floor(u * 5.0), h = fract(i * 0.618 + 0.13 * z);
  vec3 set[5] = vec3[5](vec3(0.06, 0.16, 0.3), vec3(0.74, 0.16, 0.08), vec3(0.82, 0.76, 0.6), vec3(0.08, 0.34, 0.28), vec3(0.87, 0.54, 0.09));
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  int own = int(mod(z, 5.0)), at = h < 0.58 ? own : int(mod(z + 2.0 + floor(fract(i * 0.382) * 3.0), 5.0));
  vec3 c = mix(set[at], vec3(0.5, 0.46, 0.4), drG ? 0.2 : 0.0), ink = uKind[own];
  c = mix(c, vec3(0.8, 0.77, 0.7), 0.88 * sat(-uOwn[2]));
  c = mix(c, fract(i * 0.2) < 0.15 ? vec3(0.86, 0.6, 0.14) : vec3(0.55, 0.03, 0.03), 0.9 * sat(uOwn[2]));
  ink = max(mix(vec3(drGrey(ink)), ink, 1.5), 0.0); ink *= 0.28 / max(drGrey(ink), 0.06);
  c = mix(c, min(ink, 0.9), 0.12 + lv[own] * (0.3 + 0.5 * uEnergy));
  vec4 m = piece(vec2(u, 0.12 + 0.76 * fract(i * 0.41)));
  c = mix(c, m.rgb / max(max(m.r, max(m.g, m.b)), 0.05) * 0.6, 0.4 * sat(m.a * 1.3));
  return c * (0.88 + 0.24 * fract(i * 0.773));
}
// A slab as it is seen: paint worn to the wood along its edges, sun past its neighbours, light back from the ground.
vec3 drSlab(vec4 hit, vec3 ro, vec3 rd) {
  float i = hit.z;
  vec3 w = ro + rd * hit.x, alb = drPaintOf(i), h = 0.5 * vec3(drW, drH, drT);
  drStand(i);
  vec3 q = clamp(drInto(w - drP) - vec3(0.0, h.y, -h.z), -h, h), bev = vec3(max(0.022, drPx * hit.x * 1.2));
  vec3 on = smoothstep(h - bev, h, abs(q)), n = drOut(normalize(on * (step(0.0, q) * 2.0 - 1.0) + vec3(0.0, 1e-4, 0.0)));
  float edge = on.x + on.y + on.z - 1.0, base = drP.y, sh = 1.0, gr = noise(vec2(q.x * 9.0 + i * 3.1, q.y * 2.5 + q.z * 8.0));
  alb *= 0.88 + 0.24 * gr;
  alb = mix(alb, drG ? vec3(0.62, 0.58, 0.5) : vec3(0.72, 0.56, 0.36), 0.6 * sat(edge) * smoothstep(0.35, 0.75, gr));
  float lies = drS, way = dot(drA, drSun.xz) > 0.0 ? 1.0 : -1.0, toSun = dot(n, drSun);
  for (int k = 0; k < 2; k++) {
    float m = i + (k == 0 ? way : lies > 0.5 ? -1.0 : 2.0 * way), t;
    if (m < drFirst || m > drFirst + drN - 1.0 || toSun < 0.0) break;
    drStand(m);
    sh *= 1.0 - drBox(drInto(w + n * 0.012 - drP) - vec3(0.0, h.y, -h.z), drInto(drSun), h, 0.05, 0.0, t);
  }
  float up = sat((w.y - base) / drH), ao = 0.45 + 0.55 * smoothstep(0.0, 0.7, up), u = (i - drFirst) / drN, e = i - drNear - (drG ? 5.0 : 12.0) * (1.0 - uHits);
  float lit = drLit(w, 0.02) * sh;
  vec3 c = alb * (drKey * lit * smoothstep(0.0, 0.9, toSun) + drSky * ao * (0.62 + 0.38 * n.y) + drSide * ao * (0.5 - 0.5 * n.y) * (1.2 - up));
  c += drKey * 0.12 * pow(sat(dot(reflect(rd, n), drSun)), 14.0) * lit + drSky * 0.1 * pow(1.0 - sat(-dot(rd, n)), 4.0);
  float wave = fract(u - 1.3 * (1.0 - uCue) + 0.5) - 0.5;
  return c + (alb + 0.1) * (1.1 * uHits * exp(-e * e * (drG ? 0.12 : 0.06)) + 0.9 * uCue * exp(-wave * wave * 60.0) + 0.35 * uKeys * step(0.8, fract(i * 0.29)));
}
// How high the wall is at x, with its post at the right.
float drTop(float x) { return x > 6.35 && x < 7.5 ? 1.5 : drBase(ceil((x - 0.2) / DR_D)); }
// The stones of the wall, as they face us.
vec3 drStones(vec2 w, float top, float e, vec3 nz) {
  float o4 = uOwn[4], brick = sat(o4), white = sat(-o4), down = top - w.y, cap = step(down, 0.17), tidy = max(brick, cap);
  vec2 q = w + 0.1 * (1.0 - brick) * (nz.x - 0.5) * vec2(1.0, -0.8);
  float hi = mix(0.42, 0.25, brick), row = cap > 0.5 ? 90.0 : floor(q.y / hi), wide = cap > 0.5 ? 1.38 : mix(0.65 + 0.5 * hash11(row + 70.0), 0.72, brick);
  float x = q.x / wide + (cap > 0.5 ? 0.15 : mod(row, 2.0) * 0.5 + (1.0 - brick) * 0.4 * hash11(row + 12.0)), h = hash21(vec2(floor(x) + 31.0, row + 57.0)), h2 = fract(h * 37.1);
  vec2 hb = 0.5 * vec2(wide, cap > 0.5 ? 0.17 : hi), c = vec2((fract(x) - 0.5) * wide, cap > 0.5 ? 0.085 - down : (q.y / hi - row - 0.5) * hi);
  vec2 g = abs(c) - hb + mix(0.1, 0.03, tidy);
  float d = length(max(g, 0.0)) + min(max(g.x, g.y), 0.0) - mix(0.085, 0.015, tidy) + 0.05 * (1.0 - tidy) * (nz.y - 0.5);
  vec3 a = mix(vec3(0.27, 0.25, 0.22), vec3(0.55, 0.46, 0.33), h2) * (0.75 + 0.5 * h);
  a = mix(a, mix(vec3(0.42, 0.14, 0.08), vec3(0.6, 0.26, 0.14), h2) * (0.85 + 0.3 * h), brick * (1.0 - cap * 0.7));
  a = mix(a, vec3(0.74, 0.72, 0.66), white * smoothstep(0.1, 0.4, nz.y + 0.25));
  a = mix(a, mix(vec3(0.6, 0.6, 0.44), uKind[2], 0.45 * uTexture), sat(0.55 + 0.4 * uTexture) * (1.0 - white) * smoothstep(0.55, 0.75, nz.x * 0.5 + nz.y * 0.5 + 0.12 * uTexture) * smoothstep(0.15, 0.85, nz.z)); // lichen
  a *= 0.68 + 0.34 * nz.y + 0.3 * nz.z;
  a = mix(a, vec3(0.82, 0.85, 0.92), sat(-uOwn[2]) * (1.0 - smoothstep(0.06, 0.12, down + 0.12 * (nz.x - 0.5))));
  vec3 n = normalize(vec3(sign(c) * smoothstep(hb - 0.16, hb, abs(c)) * mix(0.8, 0.3, tidy) + 0.35 * (nz.yz - 0.5), -1.0));
  float under = 1.0 - 0.75 * (1.0 - smoothstep(0.17, 0.45, down)) * (1.0 - cap);
  vec3 face = a * (drKey * smoothstep(-0.05, 0.9, dot(n, drSun)) * under + drSky * (0.6 + 0.5 * n.y) * mix(1.0, under, 0.5));
  return mix(mix(vec3(0.03, 0.035, 0.02), vec3(0.2, 0.18, 0.15), brick + white * 0.5) * (drSky + 0.2 * drKey), face, drIn(d, e + 0.02));
}
// A bare tree: how far off its nearest branch is.
float drTree(vec2 p, float seed) {
  float d = 10.0, s = 1.0;
  p.x += 0.012 * sin(p.y * 9.0 + seed) + 0.004 * sin(uTime * 0.4 + seed) * p.y;
  for (int k = 0; k < 9; k++) {
    float f = float(k), y = clamp(p.y, 0.0, 0.17);
    d = min(d, (length(vec2(p.x, p.y - y)) - 0.013 + 0.02 * y) / s);
    p.y -= 0.13 + 0.04 * sin(seed * 5.0 + f * 1.9); p = rot(0.17 * sin(seed + f * 2.3)) * p;
    p.x = abs(p.x); p = rot(-0.36 + 0.09 * sin(seed * 3.0 + f * 1.3)) * p * 1.28; s *= 1.28;
  }
  return d;
}
// Sky, hill, trees and the lawn behind the wall.
vec3 drBehind(vec2 p, vec3 ro, vec3 rd, float night, float gold) {
  float up = rd.y * 1.4, snow = sat(-uOwn[2]), leaf = sat(uOwn[2]);
  vec3 hi = mix(mix(vec3(0.3, 0.5, 0.8), vec3(0.03, 0.05, 0.12), night), vec3(0.5, 0.48, 0.6), gold);
  vec3 lo = mix(mix(vec3(1.7, 1.4, 1.05), vec3(0.14, 0.2, 0.34), night), vec3(1.9, 0.75, 0.3), gold);
  lo = mix(lo, uKind[0] * drGrey(lo) * 1.5, 0.2 * uDrone);
  vec4 m = piece(vec2(0.5 + 0.55 * p.x, sat(0.75 - 1.1 * p.y)));
  float cl = noise(vec2(p.x * 1.8 + uTime * 0.008, p.y * 6.0 + 2.0)), cl2 = noise(vec2(p.x * 5.0 + uTime * 0.013, p.y * 19.0 + 7.0));
  vec3 sky = mix(lo, hi, smoothstep(0.0, 0.34, up - 0.06 * p.x - 0.04 * cl)) * (1.0 + 0.3 * uPad);
  sky = mix(sky, lo * vec3(0.5, 0.58, 0.7), 0.75 * snow);
  float moon = length(vec2(p.x - 0.36, rd.y * 2.45 - 0.44));
  sky += night * vec3(0.5, 0.55, 0.6) * (drIn(moon - 0.032, 0.003) + 0.25 * exp(-6.0 * moon));
  sky = mix(sky, mix(lo * 1.1, m.rgb / max(drGrey(m.rgb), 0.1) * drGrey(lo) * 0.85, 0.62 * sat(m.a * 1.4)), 0.65 * smoothstep(0.5, 0.85, cl * 0.7 + cl2 * 0.35));
  vec3 air = mix(sky, 0.2 * drSky + vec3(0.03, 0.025, 0.025) * drKey, 0.6), c = sky, lawn = mix(mix(vec3(0.24, 0.3, 0.1), vec3(0.85, 0.87, 0.92), snow), vec3(0.5, 0.3, 0.08), leaf);
  float edge = 1.5 / uRes.y;
  vec3 tune = mix(vec3(1.0), uKind[3] / max(drGrey(uKind[3]), 0.1), 0.6 * min(uPhrase, 1.0)); // the hills and the pale stripes take the melody
  c = mix(c, mix(sky, air, 0.55) * tune, drIn(up - 0.07 - 0.025 * sin(p.x * 2.3 + 1.0) - 0.008 * sin(p.x * 11.0), edge * 3.0));
  float left = step(p.x, 0.09), size = mix(0.56, 0.92, left), tree = drTree(vec2(p.x - mix(0.56, -0.4, left), rd.y * 2.5) / size, mix(4.1, 1.3, left)) * size;
  c = mix(c, air * mix(0.8, 0.45, left), mix(0.85, 0.95, left) * drIn(tree, edge * 1.6));
  vec2 tp = (vec2(p.x - mix(0.56, -0.4, left), rd.y * 2.5) / size - vec2(0.0, 0.4)) * vec2(0.85, 1.15);
  float lv = noise(p * 130.0), lump = noise(p * 26.0 + 4.0);
  float crown = leaf * (1.0 - smoothstep(0.14, 0.31, length(tp) + 0.2 * (lump - 0.5)));
  c = mix(c, mix(vec3(0.55, 0.12, 0.03), vec3(0.8, 0.42, 0.05), sat(lump * 0.7 + lv * 0.5 + tp.y - tp.x)) * (drSky + drKey * 0.28), 0.9 * smoothstep(0.42, 0.6, lv + crown * 0.75 - 0.35) * smoothstep(0.0, 0.15, crown));
  // the lawn, mown in stripes
  float t = -(1.7 + ro.y) / min(rd.y, -0.004), z = t * rd.z, x = ro.x + t * rd.x, far = sat(z / 160.0);
  float stripe = smoothstep(-0.5, 0.5, 2.0 * sin(x * 0.75 + 0.06 * z));
  vec3 g = lawn * mix(vec3(0.72), 1.15 * tune, stripe) * (drSky + drKey * 0.4);
  g = mix(g, mix(vec3(0.5, 0.42, 0.3), vec3(0.7, 0.71, 0.75), snow) * (0.85 + 0.3 * cl2) * (drSky + drKey * 0.5), drIn(abs(x - 0.9 - 0.004 * z * z * exp(-z * 0.03)) - 1.0, 0.1 + 2.0 * t * drPx));
  c = mix(c, mix(g, air, sqrt(far) * 0.75), drIn(rd.y + 0.006, edge));
  float hedge = rd.y - 0.011 - 0.002 * sin(p.x * 31.0) - 0.004 * cl2;
  return mix(c, mix(mix(lawn, vec3(0.1, 0.13, 0.12), 0.7 * snow) * 0.45 * (drSky + 0.25 * drKey), air, 0.16), drIn(hedge, edge * 2.0) * smoothstep(-0.03, -0.026, rd.y));
}
vec3 render(vec2 p) {
  drG = uVar > 0.5;
  float o0 = uOwn[0], o1 = uOwn[1], o2 = uOwn[2], o3 = uOwn[3], o4 = uOwn[4], night = sat(-o0), gold = sat(o0), low = sat(-o3), high = sat(o3);
  drH = 1.0 + (o1 < 0.0 ? 0.42 : drG ? 0.9 : 0.5) * o1; drT = 0.17 - (o1 < 0.0 ? 0.12 : 0.06) * o1; drW = 0.62 - (o1 < 0.0 ? 0.0 : 0.3) * o1;
  drRest = 0.5 * PI - asin(drT / DR_D);
  if (drG) { drN = 23.0; drFirst = -12.0; drLie = 9.0; drRise = 6.0; drNear = 1.0; }
  else { drN = 252.0; drFirst = -124.0; drLie = 45.0; drRise = 34.0; drNear = 70.0; }
  drF = uLoop + 0.42 - 0.8 * sin(TAU * 6.0 * uLoop) / (TAU * 6.0);
  drStir = 0.03 * (0.3 + uEnergy) * (0.3 * uLow + 0.3 * uMid + 0.6 * uHigh); drCue = 0.28 * uCue * (1.0 - uCue); drKnock = 0.6 * uHits * (1.0 - uHits);
  float az = 0.12 * sin(uTravel * 0.02);
  drSun = normalize(drG ? vec3(-0.85, 0.4, -0.22 - az) : vec3(-0.86, 0.43, 0.36 + az));
  drKey = mix(mix(vec3(3.3, 2.5, 1.55), vec3(0.4, 0.55, 0.9), night), vec3(3.6, 1.6, 0.5), gold) * (0.85 + 0.35 * uTone + 0.15 * uLow);
  drSky = mix(mix(vec3(0.42, 0.42, 0.46), vec3(0.08, 0.11, 0.2), night), vec3(0.36, 0.27, 0.34), gold) * (1.0 + 0.2 * uPad + 0.15 * uMic);
  if (drG) drKey *= mix(vec3(1.0), vec3(0.8, 0.95, 1.2), sat(-o2));
  drSide = drKey * 0.16;
  // where we look from
  float fl = (drG ? 2.45 + 0.2 * high : 1.3) * (1.05 - 0.1 * uSpace) * mix(0.6, 1.0, smoothstep(0.5, 1.3, uRes.x / uRes.y));
  vec3 ro, ta;
  if (drG) {
    ro = mix(mix(vec3(0.1, 1.05, -17.0), vec3(1.6, -1.6, -14.0), low), vec3(-4.0, 8.0, -16.0), high);
    ta = vec3(0.1, 1.95 + 0.3 * low + 0.6 * high, 0.0); ro.x += 0.25 * sin(uTime * 0.03);
  } else {
    ro = mix(mix(vec3(5.0, 4.6, -12.5), vec3(5.4, 2.5, -13.0), low), vec3(1.0, 17.0, -5.0), high);
    ta = vec3(0.2, 0.0, 0.6); ro.x += 0.12 * sin(uTime * 0.04);
  }
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), rd = normalize(fw * fl + rt * p.x + cross(fw, rt) * p.y);
  drPx = 1.0 / (uRes.y * fl);
  // what stands behind the slabs: the floor and far wall of the room, or the top of the garden wall
  float down = min(rd.y, -1e-3), tw = drG ? (-0.6 - ro.z) / rd.z : rd.z > 0.01 ? (19.0 - ro.z) / rd.z : 1e4, e = drPx * tw;
  vec3 wall = ro + rd * tw;
  float l0 = drTop(wall.x - 0.3 * e), l1 = drTop(wall.x + 0.3 * e), top = drG ? min(l0, l1) : 0.0, tf = (top - ro.y) / down;
  vec3 foot = ro + rd * tf;
  bool ground = rd.y < -1e-3 && (drG ? foot.z < 0.6 && foot.z > -0.62 : tf < tw);
  float t0 = drG ? -ro.z / rd.z : max((drH * 1.02 - ro.y) / down, 0.3), t1 = drG ? t0 : min(min(tw, tf), 60.0);
  drWalk(ro, rd, t0, max(t0, t1), drPx, drG ? 0.0 : 0.004);
  vec4 one = drOne, two = drTwo;
  float a = one.y, b = (1.0 - a) * two.y, rest = 1.0 - a - b;
  // the shadows on it
  float beside, along = drAlong(foot.xz, beside), fp = drPx * tf / max(-rd.y, 0.08), lit = rest > 0.01 ? drLit(foot, fp) : 0.0, len = drH * 1.02 / drSun.y, sh = 1.0;
  if (ground && rest > 0.02 && lit > 0.01 && beside < 0.5 * drW + len) {
    drWalk(foot + vec3(0.0, 0.003, 0.0), drSun, 0.0, len, 0.035, 0.0);
    sh = (1.0 - drOne.y) * (1.0 - drTwo.y);
  }
  // boards or stones
  vec2 q = rot(0.14) * foot.xz;
  float row = floor(q.y / 0.9), f = q.y / 0.9 - row, x = q.x / 7.0 + hash11(row + 40.0) * 5.0, h2 = hash21(vec2(row, floor(x)) + 60.0);
  vec2 gq = drG ? (wall.y < top ? wall.xy : foot.xz * vec2(1.0, 2.0)) : q;
  vec3 nz = vec3(0.5);
  bool seen = drG || rest > 0.01;
  DR_IF(seen) {
  nz.x = noise(drG ? gq * 2.1 : vec2(q.x * 0.5 + h2 * 30.0, q.y * 3.0));
  nz.y = noise(drG ? gq * 6.0 + 4.0 * nz.x : vec2(q.x * 1.2, q.y * 26.0 + 9.0 * nz.x) + h2 * 70.0);
  nz.z = noise(gq * 23.0);
  }
  vec3 c, under = vec3(0.0);
  DR_IF(drG) {
    under = drBehind(p, ro, rd, night, gold);
    vec3 s = mix(vec3(0.46, 0.42, 0.34), vec3(0.7, 0.68, 0.62), sat(-o4)) * (0.6 + 0.4 * nz.y + 0.4 * nz.z);
    if (ground) under = mix(s, vec3(0.8, 0.83, 0.9), sat(-o2)) * (1.4 * drKey * drSun.y * sh + drSky);
  }
  DR_IF(!drG && seen && ground) {
    float gap = drIn(0.5 - abs(f - 0.5) - 0.012, fp / 0.9), end = drIn((0.5 - abs(fract(x) - 0.5)) * 7.0 - 0.012, drPx * tf * 2.0), keep = 1.0 / (1.0 + fp * 5.0);
    vec3 s = mix(vec3(0.4, 0.2, 0.075), vec3(0.62, 0.36, 0.15), h2) * (0.9 + keep * (0.34 * (nz.y - 0.5) + 0.3 * (nz.x - 0.5) + 0.12 * (nz.z - 0.5)));
    s = mix(s, o4 < 0.0 ? vec3(0.7, 0.68, 0.62) * (0.9 + 0.2 * h2 + 0.1 * nz.y * keep) : vec3(0.09, 0.12, 0.15) * (0.8 + 0.4 * h2 + 0.3 * nz.y * keep), abs(o4));
    s *= 1.0 - 0.7 * max(gap, end * 0.8) * min(1.0, 0.03 / max(fp, 0.01));
    float ao = 1.0 - 0.45 * exp(-max(beside - 0.25, 0.0) * 4.0);
    under = s * (drKey * drSun.y * 1.5 * lit * sh + drSky * ao) + (0.05 + 0.5 * pow(sat(1.0 + rd.y), 4.0)) * drSky * (0.7 + 0.5 * h2) * ao * 0.55;
  }
  DR_IF(!drG && seen && !ground) {
    vec3 s = mix(vec3(0.3, 0.4, 0.36), vec3(0.75, 0.72, 0.62), drIn(3.2 - wall.y, e));
    s = mix(s, s * (o2 < 0.0 ? vec3(0.75, 0.9, 1.25) : vec3(0.3, 0.45, 0.4)), abs(o2));
    under = mix(s, vec3(0.16, 0.09, 0.05), drIn(wall.y - 0.75, e)) * (drSky * 0.9 + drKey * 0.5 * drLit(wall, 0.05));
  }
  DR_IF(drG) {
    // the ball at the end of the line
    float bk = drBack(drFirst + drN - 1.0), roll = smoothstep(0.5, 4.0, bk) * (1.0 - smoothstep(drLie, drLie + drRise, bk));
    vec3 ball = vec3(5.05 + 0.75 * roll, 0.84, 0.0) - ro;
    float bb = dot(ball, rd), m = sqrt(max(dot(ball, ball) - bb * bb, 0.0)), bc = drIn(m - 0.44, drPx * bb);
    vec3 n = normalize(rd * (bb - sqrt(max(0.1936 - m * m, 0.0))) - ball);
    vec3 s = mix(vec3(0.7, 0.1, 0.06), uKind[4] * 0.8, 0.3 + 0.3 * uHits);
    s = mix(s, vec3(0.85, 0.8, 0.7), drIn(abs(dot(n, vec3(sin(roll * 1.7), cos(roll * 1.7), 0.0))) - 0.14, 0.03));
    under = mix(under, s * (drKey * smoothstep(-0.1, 1.0, dot(n, drSun)) + drSky * (0.6 + 0.4 * n.y)) + drKey * 0.2 * pow(sat(dot(reflect(rd, n), drSun)), 30.0), bc);
  }
  c = under * rest;
  int many = b > 0.0 ? 2 : a > 0.0 ? 1 : 0;
  for (int k = 0; k < many; k++) c += (k == 0 ? a : b) * drSlab(k == 0 ? one : two, ro, rd);
  DR_IF(drG) {
    float face = 0.5 * (drIn(wall.y - l0, e) + drIn(wall.y - l1, e)) * (1.0 - drIn(abs(wall.x - 0.9) - 1.45, e) * drIn(wall.y - 1.1, e));
    float plank = drIn(abs(wall.x - 0.76) - 1.78, e) * drIn(abs(wall.y - 1.11) - 0.09, e);
    DR_IF(face > 0.0) c = mix(c, drStones(wall.xy, top, e, nz), face);
    c = mix(c, vec3(0.42, 0.3, 0.18) * (0.75 + 0.5 * nz.x) * (drKey * 0.4 + drSky), plank);
  }
  return screenOf(c);
}
