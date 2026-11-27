// name: Hundred compasses
// a: Carried magnet
// b: Floating corks
// what: A long sheet of cream paper covered with small brass compasses, seen low from one end, window light on every glass and one large old compass in front; something unseen is carried under the cloth and the needles swirl round it; or a white basin of water where corks, each with an upright needle, float in rings above their shadows.
// follows: The piece tints the paper or the water and turns the needles at its place. Drone holds north or draws the rings in, pad widens the swirl or the rings, texture trembles, the phrase strengthens the magnet. Bands pull columns or lift corks. A hit runs outward in a ring, a cue spins the needles round or opens the rings, keys glint, the loop turns north.
// own: 0 night by a lamp at -1, low evening sun at 1; 1 few and large at -1, many and small at 1; 2 from high above at -1, low along the table at 1; 3 black iron, slate and pale needles at -1, porcelain, celadon and red at 1; 4 square rows and needles in a star, corks huddled at -1, rows and needles in waves, corks drawn aside at 1; 5 flat as coins, or low round leaves with a short pin, at -1, tall drums, or a paper sail on every cork, at 1; 6 bare sand or snow in open sun, the basin a pool in it, at -1, a chart drawn on the sheet, or under the water, at 1; 7 few left, scattered and of mixed sizes, at -1, every dial or pin head lit from within at 1
vec3 hcRo, hcRd, hcKey, hcSky; // the eye, the ray, the window's light and the room's
vec2 hcU, hcS, hcAt; // the way of the ray over the table; how far a shadow falls; the magnet
float hcK, hcPx, hcNight, hcEve, hcIron, hcPale, hcStar, hcWave, hcHigh, hcFlat;
const float HC_LEN = 17.0, HC_HALF = 3.75;
const vec2 HC_BIG = vec2(2.6, 2.75); // where the large old one stands
#define HC_DEEP (uOwn[5] > 0.0 ? 1.0 / (1.0 + 1.7 * uOwn[5]) : 1.0)
#define HC_LIT max(uOwn[7], 0.0)
#define HC_FEW max(-uOwn[7], 0.0)
#define HC_SAND max(-uOwn[6], 0.0)
#define HC_MAP max(uOwn[6], 0.0)
#define HC_SAIL max(uOwn[5], 0.0)
#define HC_PAD max(-uOwn[5], 0.0)
const vec3 HC_L = vec3(-0.75, 0.6, 0.28); // towards the window

void hcEye(vec3 aim, float far, float pitch, float yaw, float f, vec2 p) {
  float cp = cos(pitch), sp = sin(pitch), cy = cos(yaw), sy = sin(yaw);
  vec3 fw = vec3(sy * cp, -sp, cy * cp), rt = vec3(cy, 0.0, -sy), up = vec3(sy * sp, cp, cy * sp);
  hcRo = aim - fw * far;
  hcRd = normalize(fw * f + rt * p.x + up * p.y);
  hcPx = 1.0 / (uRes.y * f);
  hcU = hcRd.xz / max(length(hcRd.xz), 1e-4);
  hcK = 1.0 / max(-hcRd.y, 0.03);
}
// Half the width of an edge on the table, n its outward way: a pixel is longer along the view.
float hcEdge(vec2 n, float w) { float a = dot(n, hcU) * hcK, b = n.x * hcU.y - n.y * hcU.x; return w * sqrt(a * a + b * b) + 1e-4; }
float hcDown(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
float hcBell(float x) { return exp(-x * x); }
float hcIn(float d, float e) { return 1.0 - smoothstep(-e, e, d); }
float hcSeg(vec2 p, vec2 b) { return length(p - b * sat(dot(p, b) / max(dot(b, b), 1e-5))); }
// A hit at a distance: one kick that rings out.
float hcKick(float d) { float t = max((1.0 - uHits) * 1.5 - d * 0.13, 0.0); return uHits * exp(-2.2 * t) * sin(t * 13.0); }
vec4 hcPiece(vec2 uv) { vec4 m = piece(clamp(uv, 0.004, 0.996)); float b = max(max(m.r, m.g), max(m.b, 0.001)); return vec4(m.rgb / b, sat(1.25 * m.a)); }
vec3 hcTint(float kind) { vec3 c = kindColour(kind); return c / max(max(c.r, c.g), max(c.b, 0.01)); }
float hcLoud(float kind) { return kind < 0.5 ? uDrone : kind < 1.5 ? uPad : kind < 2.5 ? uTexture : uPhrase; }
vec3 hcKind3(vec3 plain, vec3 iron, vec3 pale) { return mix(mix(plain, iron, hcIron), pale, hcPale); }
// The rows stand staggered, square or in waves; which place has a compass.
float hcOdd(float row) { return 0.5 * mod(row, 2.0) * (1.0 - hcStar) + hcWave * 1.3 * sin(row * 0.55); }
// Of those that are few: how large the one of this seed still is.
float hcSome(float s) { return HC_FEW > 0.0 ? max(1.5 * smoothstep(0.6 * HC_FEW, 0.66 * HC_FEW + 0.001, s) - 0.5, 0.0) * (1.0 - 0.45 * HC_FEW * fract(s * 7.7)) : 1.0; }
float hcHave(vec2 c, float many) {
  float some = 1.0;
  if (HC_FEW > 0.0) { float row = floor(c.y * many / 0.9); some = hcSome(hash21(vec2(floor(c.x * many + hcOdd(row)) + 60.0, row + 9.0))); }
  return some * hcIn(abs(c.x) - HC_HALF + 0.4 / many, 0.03) * hcIn(1.56 * (1.0 - HC_SAND) - length(c - HC_BIG), 0.02) * step(0.0, c.y) * step(c.y, HC_LEN); }
vec2 hcUv(vec2 q) { return vec2(0.5 + 0.5 * q.x / HC_HALF, 1.0 - q.y / HC_LEN); }

// Sand with the wind's ripples, or snow; and a chart: coasts, depths, lines of the world.
vec3 hcDune(vec2 q, float w) {
  vec3 c = hcKind3(vec3(0.8, 0.6, 0.38), vec3(0.2, 0.19, 0.19), vec3(0.87, 0.89, 0.93));
  float n = noise(q * 0.5), s = q.y * 8.0 + q.x * 2.5 + 9.0 * n + 2.0 * noise(q * 1.7), v = cos(s) + 0.4 * cos(2.0 * s);
  return c * (0.86 + 0.16 * n + (0.13 - 0.06 * hcPale) * v * hcDown(0.02, 0.09, w) + 0.06 * hash21(floor(q * 60.0) + 30.0) * hcDown(0.006, 0.02, w));
}
vec3 hcChart(vec2 q, float w) {
  float f = 0.62 * noise(q * 0.5 + 3.3) + 0.26 * noise(q * 1.25 + 9.0) + 0.12 * noise(q * 3.4), land = smoothstep(0.0, 0.012 + w, f - 0.5);
  vec3 c = mix(mix(vec3(0.72, 0.84, 0.86), hcTint(0.0), 0.35) * (1.0 - 0.25 * sat((0.5 - f) * 4.0)), mix(vec3(1.0, 0.86, 0.62), hcTint(3.0), 0.4), land);
  float lines = hcDown(0.0, 0.08 + 9.0 * w, abs(fract(f * 22.0) - 0.5) * 2.0) * 0.4, coast = hcDown(0.0, 0.006 + 0.35 * w, abs(f - 0.5));
  vec2 g = abs(fract(q * 0.7) - 0.5) / 0.7;
  lines = max(lines, hcDown(0.0, 0.012 + w, min(g.x, g.y)) * 0.3) * hcDown(0.015, 0.06, w);
  return c * (1.0 - 0.75 * max(lines, coast));
}

// The sun through a window, lying over the table.
float hcSun(vec2 q, float soft) {
  q = rot(0.62) * (q - vec2(0.3 + 0.5 * sin(uTime * 0.017), 5.2));
  float s = hcIn(abs(abs(q.x) - 1.45) - 1.3, soft) * hcIn(abs(q.y + 0.4) - 5.6, soft) * hcIn(abs(mod(q.y + 2.0, 3.6) - 1.8) - 1.68, soft * 0.6);
  if (HC_SAND > 0.0) s = mix(s, 0.55 + 0.45 * smoothstep(0.35, 0.6, noise(q * 0.45 + uTime * 0.012)), HC_SAND);
  return mix(s, exp(-dot(q, q) * 0.045), hcNight);
}
vec2 hcMagnet(float t) { return vec2(0.2 + 2.3 * sin(t * 1.3), 5.6 + 2.9 * sin(t * 0.83 + 0.6)); }
// Which way a needle points: north, the swirl round the magnet, the slope of the piece, and what shakes it.
float hcPoint(vec2 c, vec2 at, float seed) {
  float north = 1.1 + 0.4 * sin(TAU * uLoop) + 0.12 * sin(uTime * 0.05) + hcWave * 1.9 * sin(c.y * 0.75 - c.x * 0.35 + uTime * 0.11);
  vec2 F = vec2(cos(north), sin(north)) * (0.5 + 0.9 * uDrone) * (1.0 - 0.93 * hcStar);
  vec2 d = c - at;
  float reach = 0.7 + 1.1 * uPad + 0.5 * uSpace;
  F += (rot(-1.15 * (1.0 - hcStar)) * d) * (1.5 + 2.2 * uPhrase + 0.5 * uLevel + 0.6 * uMic) / (dot(d, d) / (0.6 + reach) + 0.25);
  vec2 uv = hcUv(c);
  float a0 = piece(uv).a;
  F += 2.2 * vec2(piece(uv + vec2(0.06, 0.0)).a - a0, a0 - piece(uv + vec2(0.0, 0.06)).a);
  float a = atan(F.y, F.x + 1e-5);
  a += (0.018 + 0.16 * uTexture) * sin(uTime * (3.0 + 2.0 * seed) + seed * 40.0);
  a += 0.55 * (band(uv.x) - 0.15) * uEnergy * (seed > 0.5 ? 1.0 : -1.0);
  a += 1.5 * hcKick(length(d)) + TAU * smoothstep(0.0, 0.45, 1.0 - uCue - 0.5 * c.y / HC_LEN);
  return a;
}

// Brass, black iron or porcelain.
vec3 hcMetal(vec3 n, float sun) {
  float v = dot(n, HC_L);
  vec3 base = hcKind3(vec3(0.6, 0.38, 0.14), vec3(0.055, 0.06, 0.07), vec3(0.85, 0.86, 0.83));
  float band1 = smoothstep(0.62, 0.8, v) * (1.0 + 0.9 * sun), band2 = smoothstep(0.3, 0.5, n.x) * hcDown(0.65, 0.85, n.x) * 0.3, dark = smoothstep(0.1, 0.4, abs(v - 0.2));
  vec3 spec = mix(base * 1.7 + 0.12, vec3(0.8), 0.6 * hcPale + 0.2 * hcIron);
  return base * (hcSky * 0.5 + hcKey * sun * (0.1 + 0.75 * sat(v))) * mix(0.4 + 0.5 * hcPale, 1.0, dark) + spec * (hcKey * (0.12 + 0.5 * sun) + hcSky * 0.6) * (band1 * 0.75 + band2);
}
// One compass: the wall of its case, its rim, and under the glass the dial and the needle.
vec4 hcCompass(vec2 c, float R, float h, float seed, vec2 ground, float t, bool old) {
  vec2 d = hcU * h * sqrt(max(hcK * hcK - 1.0, 0.0)), top = ground - d - c;
  vec2 m = top + d * sat(-dot(top, d) / max(dot(d, d), 1e-5));
  float lm = length(m), w = hcPx * t, cover = hcIn(lm - R, hcEdge(m / max(lm, 1e-4), w));
  if (cover < 0.004) return vec4(0.0);
  float sun = hcSun(c + top * 0.6, 0.35) * (1.0 - 0.8 * HC_LIT * hcNight), r = length(top);
  vec2 n = top / max(r, 1e-4);
  float er = hcEdge(n, w);
  // the wall
  float ap = dot(top, hcU); vec2 side = top - hcU * ap;
  float half_ = sqrt(max(R * R - dot(side, side), 0.0));
  vec2 nw = (side - hcU * half_) / R;
  float down = sat((-half_ - ap) / max(length(d), 1e-4));
  vec3 col = hcMetal(vec3(nw.x, 0.0, nw.y), sun * hcDown(-0.5, 0.35, nw.x)) * (1.0 - 0.65 * down * down);
  if (r > R + er) return vec4(col, 1.0) * cover;
  // the rim, turned outward and then in
  float turn = (r / R - 0.91) * 11.0;
  vec3 rim = hcMetal(normalize(vec3(n * turn, 0.75)).xzy, sun * (0.45 + 0.55 * hcDown(-0.5, 0.5, n.x * turn)));
  // the dial, a little below the glass
  float Ri = R * 0.85;
  vec2 q = top + d * (old ? 0.3 : 0.42) * HC_DEEP;
  float rq = length(q), kind = floor(seed * 3.999);
  vec4 was = hcPiece(hcUv(c));
  vec3 tint = hcTint(kind), paper = hcKind3(vec3(0.86, 0.79, 0.64), vec3(0.035, 0.04, 0.05), vec3(0.8, 0.86, 0.82));
  vec3 dye = mix(vec3(1.0), was.rgb, 0.7 * was.a) * mix(vec3(1.0), tint, 0.62 * sat(hcLoud(kind) * (0.5 + uEnergy)));
  paper *= mix(dye, 0.6 + 3.0 * (1.0 - dye), hcIron * 0.6);
  vec3 ink = mix(vec3(0.16, 0.1, 0.07), vec3(0.75, 0.68, 0.5), hcIron);
  float ang = atan(q.y, q.x + 1e-5);
  float eq = hcEdge(q / max(rq, 1e-4), w);
  float tick = abs(fract(ang * 16.0 / TAU + 0.5) - 0.5) * 2.0;
  float marks = hcIn(abs(rq / R - 0.715) - 0.04, eq / R) * hcIn(tick - 0.12, 0.02 + eq * 5.0 / max(rq, 0.05)) + 0.5 * hcIn(abs(rq / R - 0.64) - 0.007, eq / R);
  if (old) { // the painted star of the large one
    vec2 s8 = abs(fract(vec2(ang * 8.0, ang * 4.0 + PI) / TAU) - 0.5) * 2.0;
    float rose = max(hcIn(rq / R - 0.13 - 0.3 * pow(s8.x, 5.0), 0.01) * 0.45, hcIn(rq / R - 0.1 - 0.46 * pow(s8.y, 4.0), 0.01) * 0.75);
    marks = max(marks, rose * (0.65 + 0.35 * sin(ang * 8.0)));
  }
  paper = mix(paper, ink, sat(marks) * 0.7);
  float shade = smoothstep(-0.02, 0.3 * R, Ri - length(q - hcS * 0.41 * h)); // the rim's shadow on the dial
  float warm = hcDown(0.0, 0.75, length(q / R - vec2(0.42, -0.12))); // the light the glass gathers
  vec3 dial = paper * (hcSky * (0.65 + 0.35 * shade) + hcKey * sun * shade * (0.8 + 0.55 * warm * (0.5 + uTone)));
  // the needle over its shadow: two long triangles, blued and pale
  if (HC_LIT > 0.0) dial = mix(dial, mix(paper, vec3(0.6), 0.75) * (tint * tint * 0.9 + 0.1) * (0.75 + 0.9 * sat(hcLoud(kind)) + 0.8 * was.a + 0.6 * uHits) * (1.15 - 0.6 * r / R), 0.92 * HC_LIT);
  float a = hcPoint(c, old ? hcMagnet(uTime * 0.035 + uTravel * 0.1 - 0.22) : hcAt, seed), ca = cos(a), sa = sin(a);
  mat2 to = mat2(ca, -sa, sa, ca);
  vec2 qp = top + d * 0.2 * HC_DEEP, q2 = to * qp, q3 = to * (q - hcS * 0.12 * R);
  float en = hcEdge(vec2(-sa, ca), w), wide = R * (old ? 0.09 : 0.15);
  float lit = pow(sat(cos(2.0 * a + 0.9 + seed)), 20.0) * sun;
  dial *= 1.0 - 0.6 * hcIn(abs(q3.y) - wide * (1.0 - abs(q3.x) / (0.74 * R)), en + 0.03 * R) * (0.3 + 0.7 * sun);
  float slim = wide * max(1.0 - abs(q2.x) / (0.78 * R), 0.0), ridge = smoothstep(-en, en, q2.y);
  vec3 blue = hcKind3(vec3(0.01, 0.018, 0.046) + 0.03 * tint, vec3(1.0, 0.94, 0.78), vec3(0.62, 0.05, 0.03));
  blue = mix(mix(vec3(0.3, 0.26, 0.2), vec3(0.2), max(hcIron, hcPale * 0.7)), blue, smoothstep(-en, en, q2.x)) * (0.75 + 0.5 * ridge) + 0.5 * lit * ridge;
  dial = mix(dial, blue * (hcSky + hcKey * (0.3 + 0.7 * sun)), hcIn(abs(q2.y) - slim, en) * sat(0.4 + slim / en) * hcIn(abs(q2.x) - 0.77 * R, en));
  dial = mix(dial, col * (1.2 - 9.0 * qp.x / R), hcIn(length(qp) - 0.075 * R, en));
  dial = mix(dial, rim * 0.3, hcIn(Ri * 0.97 - rq, eq));
  // the glass: the window as a bright crescent on the left
  vec2 g = top / R; float eg = er / R + 0.004 + 0.02 * (1.0 - uTone);
  float cres = hcIn(length(g) - 0.77, eg) * hcIn(0.745 - length(g - vec2(0.085, -0.055)), eg);
  float ring = hcBell((length(c - hcAt) - 0.7 - (1.0 - uHits) * 5.0) * 1.1) * uHits;
  ring += 0.8 * uCue * hcBell((c.y - 2.0 - (1.0 - uCue) * 14.0) * 0.7);
  vec3 glow = mix(vec3(1.0), uKind[4] * 1.4, 0.5) * ring * (0.55 + uEnergy);
  dial += (hcKey * (0.35 + 0.75 * sun) + hcSky * 0.6) * cres * (0.85 + 1.8 * uKeys * pow(0.5 + 0.5 * sin(seed * 91.0 + uTime * 0.9), 8.0)) + glow * (cres * 2.5 + 0.4);
  vec3 face = mix(rim, dial, hcIn(r - Ri, er));
  return vec4(mix(col, face, hcIn(r - R, er)), 1.0) * cover;
}

vec3 hcCloth(vec2 q, float w) {
  float fold = sin(q.x * 0.9 + 0.7 * sin(q.y * 0.31 + 1.0) + 2.0);
  vec3 c = mix(vec3(0.19, 0.26, 0.31), vec3(0.28, 0.35, 0.39), 0.5 + 0.35 * fold);
  c = mix(mix(c, vec3(0.05, 0.05, 0.055), hcIron * 0.8), vec3(0.36, 0.22, 0.18), hcPale * 0.85);
  return c * (1.0 + 0.1 * sin(q.x * 70.0) * sin(q.y * 70.0) * hcDown(0.004, 0.02, w));
}

vec3 hcTable(vec2 p) {
  hcEye(vec3(0.6, 0.0, 5.4), 6.2 + 0.6 * hcHigh - 0.9 * hcFlat, 0.55 + 0.015 * sin(uTime * 0.03) + 0.62 * hcHigh - 0.2 * hcFlat, 0.3 - 0.12 * hcHigh, 1.23 - 0.1 * uSpace, p);
  hcS = mix(vec2(1.25, -0.5), vec2(3.0, -0.9), hcEve);
  hcAt = hcMagnet(uTime * 0.035 + uTravel * 0.1);
  float wall = -hcRd.y - 0.075;
  vec3 room = mix(vec3(0.3, 0.3, 0.29), vec3(0.09, 0.1, 0.12), smoothstep(-0.5, 0.7, p.x)) * (hcSky + 0.35 * hcKey);
  if (HC_SAND > 0.0) room = mix(room, hcSky * (1.6 + 0.5 * hcNight) + hcKey * 0.14, HC_SAND);
  if (wall < 0.0) { hcRd.y = -0.075; hcK = 1.0 / 0.075; }
  float t = -hcRo.y / hcRd.y;
  vec2 q = hcRo.xz + hcRd.xz * t;
  hcPx += (0.006 + 0.003 * uSpace) * abs(1.0 - 6.2 / t) * (t > 6.2 ? 1.0 : 0.2);
  float w = hcPx * t;
  float many = exp2(uOwn[1] * (uOwn[1] < 0.0 ? 0.75 : 0.5)), R = 0.43, h = 0.23 * (1.0 + (uOwn[5] < 0.0 ? 0.82 : 1.7) * uOwn[5]), pz = 0.9, hBig = 0.5 * (1.0 + (uOwn[5] < 0.0 ? 0.7 : 0.35) * uOwn[5]);
  // the compasses: the large old one, then the rows, near ones first
  float left = 1.0, run = h * sqrt(max(hcK * hcK - 1.0, 0.0)) / many; vec3 sum = vec3(0.0);
  vec2 near = q - hcU * run;
  float first = max(floor((near.y * many - R) / pz), 0.0), last = min(floor((q.y * many + R) / pz), floor(HC_LEN * many / pz));
  bool slant = abs(hcU.x) > 0.55; // a slanting ray may meet two in one row
  for (int i = 0; i < 12; i++) {
    bool old = i == 0;
    float go = float(i - 1), two = mod(go, 2.0), row = first + (slant ? floor(0.5 * go) : go), z = (row + 0.5) * pz / many, odd = hcOdd(row);
    if (!old && (row > last || left < 0.01)) break;
    float x = q.x + (clamp(z, near.y, max(q.y, near.y + 1e-4)) - q.y) * hcU.x / max(hcU.y, 0.2), at = x * many + odd - 0.5;
    float n = slant ? floor(at) + (hcU.x > 0.0 ? two : 1.0 - two) : floor(at + 0.5);
    vec2 c = old ? HC_BIG : vec2((n + 0.5 - odd) / many, z);
    float have = old ? 1.0 - HC_SAND : hcHave(c, many);
    vec4 one = hcCompass(c, max(old ? 1.2 * have : R * have / many, 0.004), old ? hBig : h / many, old ? 0.8 : fract(sin(n * 12.7 + row * 41.3) * 437.5), q, t, old) * step(0.05 + 0.4 * hcWave, have);
    sum += left * one.rgb; left *= 1.0 - one.a;
  }
  if (left < 0.01) return sum;
  float sun = hcSun(q, 0.16 + 0.01 * t);
  float off = max(abs(q.x) - HC_HALF - 0.012 * sin(q.y * 3.0), abs(q.y - 0.5 * HC_LEN) - 0.5 * HC_LEN - 0.6), on = hcIn(off, hcEdge(vec2(1.0, 0.0), w) * 0.7 + hcEdge(vec2(0.0, 1.0), w) * 0.3);
  vec3 sheet = hcKind3(vec3(0.86, 0.79, 0.65), vec3(0.2, 0.21, 0.23), vec3(0.62, 0.72, 0.66));
  sheet *= 0.97 + 0.05 * noise(q * vec2(2.0, 1.3));
  vec4 was = hcPiece(hcUv(q));
  sheet *= mix(vec3(1.0), was.rgb, (0.35 + 0.4 * uEnergy) * was.a * smoothstep(0.0, 0.7, -off));
  if (HC_MAP > 0.0) sheet *= mix(vec3(1.0), hcChart(q, w), HC_MAP);
  vec3 cloth = on > 0.99 ? vec3(0.0) : hcCloth(q, w) * (1.0 - 0.5 * exp(-max(off, 0.0) * 9.0) * step(0.0, q.x));
  if (HC_SAND > 0.0) { vec3 dune = hcDune(q, w); sheet = mix(sheet, dune * mix(vec3(1.0), was.rgb, 0.3 * was.a), HC_SAND); cloth = mix(cloth, dune, HC_SAND); }
  vec3 lamp = vec3(0.0);
  // the shadows of the cases, and the dark round their feet
  float sh = 0.0, ao = 0.0;
  vec2 bt = q - HC_BIG, md = q - hcAt, s = hcS * h / many;
  if (on + HC_SAND > 0.0) {
    for (int i = 0; i < (HC_SAND > 0.0 ? 3 : 2); i++) {
      vec2 at = (q - (i == 0 ? 0.0 : i == 1 ? 0.85 : 1.3) * s) * many;
      float row = floor(at.y / pz), odd = hcOdd(row);
      vec2 cw = vec2(floor(at.x + odd) - odd + 0.5, (row + 0.5) * pz) / many;
      float have = hcHave(cw, many), by = max(length(q - cw) * many - R, 0.0);
      sh = max(sh, have * hcIn(hcSeg(q - cw, s) * many - R * have, 0.06 + 0.1 * by + w));
      ao = max(ao, have * exp(-9.0 * by));
      if (HC_LIT > 0.0) { float k = floor(3.999 * fract(sin(floor(at.x + odd) * 12.7 + row * 41.3) * 437.5)); lamp += have * exp(-3.5 * by) * hcTint(k) * (0.08 + 0.3 * sat(hcLoud(k))); }
    }
  }
  sh = max(sh, hcIn(hcSeg(bt, hcS * hBig) - 1.2, 0.13) * (1.0 - HC_SAND));
  ao = max(ao, exp(-max(length(bt) - 1.2, 0.0) * 5.0) * (1.0 - HC_SAND));
  vec3 col = mix(cloth, sheet, on) * (hcSky * (1.0 - 0.5 * ao) + hcKey * sun * (1.0 - 0.94 * sh));
  if (HC_LIT > 0.0) col += lamp * HC_LIT * sheet;
  if (HC_FEW > 0.0) col *= 1.0 + (0.5 * uKind[4] + 0.15) * HC_FEW * uHits * hcBell((length(md) - 0.7 - (1.0 - uHits) * 5.0) * 1.4);
  // the magnet lifts and warms the paper a little
  col *= 1.0 + on * exp(-dot(md, md) * 1.2) * ((0.1 + 0.25 * uMic) * (0.3 + uPhrase) * (uKind[3] + 0.3) + 0.5 * dot(md, vec2(-0.8, 0.5)) * (0.4 + sun));
  if (wall < 0.0) col = mix(col, room, smoothstep(0.0, 0.07, -wall));
  col = mix(col, room, 0.85 * smoothstep(15.0, 34.0, t));
  return sum + left * col;
}
// A basin with five, eleven and fifteen corks; now and then one slips inward. A last ring waits.
vec3 hcBasin(vec2 p) {
  float few = max(-uOwn[1], 0.0), lots = max(uOwn[1], 0.0);
  hcEye(vec3(-0.35, 0.0, 0.12), 5.5 - 0.5 * hcFlat, 0.82 + 0.01 * sin(uTime * 0.04) + 0.34 * hcHigh - 0.3 * hcFlat, -0.2, 1.25 - 0.08 * uSpace, p);
  hcS = mix(vec2(0.85, -0.42), vec2(1.7, -0.6), hcEve);
  float steep = max(sqrt(max(hcK * hcK - 1.0, 0.0)), 0.05), t = -hcRo.y / min(hcRd.y, -0.05), w = hcPx * t, RB = 3.1;
  vec2 q = hcRo.xz + hcRd.xz * t, qr = q - hcU * 0.24 * steep;
  // the table and the rolled rim
  float rq = length(q), rr = length(qr), len = max(rq, 1e-3);
  vec2 nr = qr / max(rr, 1e-3);
  float er = hcEdge(nr, w), turn = (rr - RB - 0.07) * 13.0, v = sat(dot(normalize(vec3(nr * turn, 0.7)).xzy, HC_L));
  vec3 enamel = hcKind3(vec3(0.84, 0.85, 0.82), vec3(0.07, 0.08, 0.095), vec3(0.5, 0.68, 0.6));
  vec3 col = vec3(0.0), rim = col;
  vec3 dune = vec3(0.0);
  if (HC_SAND > 0.0) dune = hcDune(q * 1.3 + 5.0, w) * (hcSky + hcKey * (0.3 + 0.6 * hcSun(q + vec2(0.0, 5.0), 0.3)));
  if (rr > RB + 0.14 - er) col = hcCloth(q * 1.2 + 3.0, w) * (hcSky + hcKey * (0.35 + 0.65 * hcSun(q + vec2(0.0, 5.0), 0.3)) * (1.0 - 0.9 * hcIn(length(q - hcS * 0.5) - RB, 0.25)));
  if (rr > RB - er) rim = mix(enamel, mix(vec3(0.03, 0.06, 0.16), vec3(0.5, 0.08, 0.04), hcPale), 0.92 * hcIn(abs(turn - 0.45) - 0.62, er * 13.0)) * (hcSky + hcKey * (0.1 + 0.9 * v)) + hcKey * 0.8 * pow(v, 40.0);
  if (HC_SAND > 0.0) { col = mix(col, dune, HC_SAND); rim = mix(rim, dune * (0.75 + 0.35 * v), HC_SAND); }
  // the water's face tilts: a slow swell, small ripples, and the rings of a hit and a cue
  bool wet = rq < RB;
  float hitR = len - (1.0 - uHits) * 3.4, cueR = len - (1.0 - uCue) * 3.8;
  vec2 tilt = 0.012 * vec2(sin(q.x * 2.1 + q.y * 3.3 + uTime * 0.5), sin(q.y * 2.7 - q.x * 1.9 - uTime * 0.43));
  tilt += (0.004 + 0.012 * uLow) * vec2(sin(q.x * 7.0 - uTime * 1.1 + 2.0 * q.y), cos(q.y * 8.0 + uTime * 0.9));
  tilt += (0.007 * uTexture + 0.004 * uHigh + 0.01 * uMic) * vec2(sin(q.x * 23.0 + 5.0 * sin(q.y * 4.0) - uTime * 1.7), sin(q.y * 25.0 + uTime * 1.5));
  tilt += q / len * (0.22 * uHits * exp(-hitR * hitR * 30.0) * sin(hitR * 16.0) + 0.2 * uCue * exp(-cueR * cueR * 7.0) * sin(cueR * 7.0));
  // the floor, and the light the water gathers on it
  vec2 fl = q + hcU * 0.5 * steep / (1.0 + 0.45 * steep) + tilt * 1.3, cw = fl * 1.7 + tilt * 9.0;
  float sun = 0.22 + 0.78 * hcSun(fl * 1.15 + vec2(0.1, 5.4), 0.28), wallSh = smoothstep(-0.2, 0.25, length(fl - hcS * 0.62) - RB + 0.35);
  // the corks, ring by ring
  float slip = 0.5 - 0.5 * cos(uTime * 0.07);
  float spread = 1.0 + 0.16 * uPad - 0.12 * uDrone + 0.7 * uCue * (1.0 - uCue) - 0.28 * hcStar - 0.06 * lots + 0.03 * sin(uTime * 0.12);
  float rc = (0.17 + 0.07 * few - 0.03 * lots) * (1.0 + 0.2 * HC_PAD), nt = (0.62 + 0.15 * uTone) * (1.0 - 0.55 * HC_PAD + 0.25 * HC_SAIL), en = w * 0.8, near = 9.0, cd = 9.0, reach = (0.2 + nt) * steep, sh = 0.0, halo = 0.0, dim = 9.0, mir = 9.0;
  vec2 side = vec2(hcU.y, -hcU.x), shake = (0.012 + 0.05 * uTexture) * vec2(sin(uTime * 0.9), cos(uTime * 0.77)), so = hcS * 0.28, hd = vec2(9.0), ct = vec2(9.0);
  vec3 lamp = vec3(0.0), shine = lamp, deep = lamp;
  vec4 nd = vec4(9.0), ck = vec4(0.1);
  float ahead = atan(side.y, side.x), go0 = 0.15 * sin(TAU * uLoop) + 0.35 * sin(uTime * 0.034);
  for (int k = 0; k < 5; k++) {
    float n = k == 0 ? 5.0 : k == 1 ? 10.0 : k == 2 ? 15.0 : k == 3 ? 1.0 : 16.0, have = k == 2 ? 1.0 - few : k == 4 ? lots : 1.0;
    if (have < 0.01) continue;
    float rad = k == 0 ? 0.62 + 0.06 * slip : k == 1 ? 1.37 : k == 2 ? 2.1 : k == 3 ? mix(1.37, 0.68, slip) : 2.74;
    rad *= spread + (uHits > 0.0 ? 0.1 * hcKick(rad * 1.3) : 0.0);
    float one = TAU / (k == 0 ? mix(5.0, 6.0, slip) : k == 1 ? mix(11.0, 10.0, slip) : n), R = rc * sqrt(have), fk = float(k);
    vec2 bands = vec2(uBands[k], uBands[k * 3 + 3]);
    float a = go0 + 0.12 * sin(uTime * 0.05 + (k == 3 ? 1.0 : fk));
    a += k == 3 ? 0.4 : k == 2 ? 0.2 : k == 4 ? 0.1 : 0.4 + one; // the gaps lie side by side
    vec2 mid0 = vec2(0.85, 0.3) * hcWave * (k == 4 ? 0.1 : 1.05 - 0.33 * rad), fr = fl - so - mid0;
    float qc = dot(q - mid0, side), qa = dot(q - mid0, hcU) - reach, lf = length(fr), front = ahead + (qc < 0.0 ? PI : 0.0);
    float wide = acos(sat((abs(qc) - R - 0.03) / rad));
    float lo = length(vec2(qc, clamp(0.0, qa, qa + reach))), hi = max(length(q - mid0), length(vec2(qc, qa)));
    if (min(lo - 0.3 - 0.3 * HC_PAD - 0.2 * HC_LIT, lf - 0.5) > rad || max(hi + 0.3 + 0.3 * HC_PAD + HC_LIT * reach, lf + 0.5) < rad) continue;
    for (int go = wet ? 0 : 1; go < (wet && few + HC_FEW + HC_LIT > 0.0 ? 6 : 5); go++) {
      float ang = go == 0 || go == 5 ? atan(fr.y, fr.x + 1e-5) : front + (go < 3 ? 1.0 : -1.0) * (wide - float(go & 1) * one);
      if (go == 5) ang += fract(mod(ang - a + 0.5 * one, TAU) / one) > 0.5 ? one : -one;
      float j = floor(mod(ang - a + 0.5 * one, TAU) / one), fi = fk * 5.0 + j, sd = fract(fi * 0.618 + 0.13) - 0.5;
      if (j >= n || (k == 3 && go > 1)) continue;
      float some = hcSome(sd + 0.5), hv = have * some, Rk = R * some;
      if (hv < 0.02) continue;
      ang = a + j * one;
      vec2 c = mid0 + rad * (1.0 + 0.025 * sd) * vec2(cos(ang), sin(ang)) + shake * sd, f = fl - c - so, rel = q - c;
      if (go == 0 || go == 5) { // the dimple's shadow with its bright edge, and the needle's
        float df = length(f);
        sh = max(sh, hv * max(hcIn(df - Rk * 1.22, 0.12 * Rk + 0.025), 0.75 * hcIn(hcSeg(f, hcS * 0.5 * nt) - 0.008 - 0.07 * HC_SAIL, 0.022 + 0.03 * HC_SAIL)));
        if (HC_LIT > 0.0) lamp += hcTint(mod(fi, 4.0)) * exp(-df * df * 11.0) * hv * (0.35 + 0.8 * hcLoud(mod(fi, 4.0)));
        halo = max(halo, hcBell((df - Rk * 1.55) * 15.0) * hv);
        continue;
      }
      float across = dot(rel, side), base = (0.13 + 0.1 * mix(bands.x, bands.y, sd + 0.5) * uEnergy) * (1.0 - 0.75 * HC_PAD), up = dot(rel, hcU) / steep, tall = 0.5 * nt * hv, mid = base + tall;
      float slim = 0.012 * (1.0 - 0.45 * sat((up - base) / nt));
      if (HC_SAIL > 0.0) { float y = (up - base) / nt; if (y > 0.16 && across * sd > 0.0) slim += HC_SAIL * Rk * 1.15 * sat(1.06 - y) * sqrt(max(sat(1.1 - y), 1e-4)); }
      vec2 at = vec2(across, (up - mid - tall) * steep / hcK), d = hcU * base * steep, top = rel - d;
      float dn = min(max(abs(across) - slim, (abs(up - mid) - tall) * 0.6), length(at) - 0.055 * hv);
      if (dn < near) { near = dn; nd = vec4(slim, across, hv, fi); hd = at; }
      mir = min(mir, max(abs(across + tilt.x * 2.0) - slim, abs(-up - tilt.y * 2.0 - mid) - tall));
      if (HC_LIT > 0.0) { // the light of the heads, and that light in the water
        vec2 mr = vec2(across + tilt.x * 2.0, up + tilt.y * 2.0 + mid + tall);
        float kd = mod(fi, 4.0), g = dot(at, at);
        vec3 tn = hv * mix(hcTint(kd), vec3(1.0), 0.25) * (0.5 + 1.1 * hcLoud(kd) + uHits);
        shine = max(shine, tn * (1.3 * exp(-g * 900.0) + 0.34 * exp(-g * 200.0)));
        deep = max(deep, tn * exp(-mr.x * mr.x * 420.0 - mr.y * mr.y * 34.0));
      }
      dim = min(dim, length(rel) - Rk);
      vec2 m = top + d * sat(-dot(top, d) / max(dot(d, d), 1e-5));
      if (length(m) - Rk < cd) { cd = length(m) - Rk; ct = top; ck = vec4(Rk, m, fi); }
    }
  }
  // the water, and the window lying on it
  vec3 water = vec3(0.0);
  if (wet) {
  float c1 = sin(cw.x * 1.3 + 1.7 * sin(cw.y * 1.1 + uTime * 0.21)), c2 = sin(cw.y * 1.5 + cw.x * 0.5 + 1.6 * sin(cw.x * 0.9 - uTime * 0.17));
  float lines = pow(sat(1.0 - abs(c1 * 0.6 + c2 * 0.4)), 5.0) + 0.6 * pow(sat(1.0 - abs(c1 * 0.4 - c2 * 0.6)), 6.0);
  float lit = 0.94 + (0.22 + 0.3 * uMid + 0.2 * uEnergy * uLevel) * (lines - 0.3);
  vec4 was = hcPiece(vec2(0.5 + 0.5 * fl.x / 2.6, 0.5 - 0.5 * fl.y / 2.6));
  water = enamel * mix(vec3(0.86, 0.96, 0.97), vec3(1.0), 0.3 * hcPale) * mix(vec3(1.0), was.rgb, (0.4 + 0.45 * uEnergy) * was.a);
  if (HC_MAP > 0.0) water *= mix(vec3(1.0), hcChart(fl + 7.0, w), HC_MAP);
  if (HC_SAND > 0.0) water *= mix(vec3(1.0), vec3(0.62, 0.9, 0.88), 0.7 * HC_SAND * (1.0 - hcIron));
  water *= hcSky + hcKey * sun * (1.0 - 0.85 * wallSh) * lit * (0.9 - 0.77 * sh) * (1.0 + 0.6 * halo * (1.0 - sh));
  water *= (1.0 - 0.4 * exp(-max(dim, 0.0) * 22.0)) * (1.0 - 0.22 * smoothstep(RB - 0.75, RB - 0.1, length(fl)));
  vec2 sk = rot(0.3) * (q + tilt * 8.0 - vec2(-1.55, 0.95));
  float pane = hcIn(abs(abs(sk.x) - 0.36) - 0.33, 0.07) * hcIn(abs(abs(sk.y) - 0.5) - 0.46, 0.07);
  if (HC_LIT > 0.0) water += lamp * HC_LIT * (0.35 * enamel + 0.1);
  water = mix(water, hcSky * 1.2, 0.03 + 0.5 * pow(sat(1.0 + hcRd.y), 4.0)) + hcKey * pane * 0.28 * (1.0 - hcNight) * (1.0 - HC_SAND);
  water *= 1.0 - 0.4 * hcIn(mir, en + 0.006);
  water += deep * 0.4 * HC_LIT;
  water += (hcKey + uKind[4]) * 0.5 * sat(tilt.x * -3.0) * (uHits + uCue);
  }
  if (HC_SAND > 0.0) enamel = mix(enamel, hcDune(q * 1.3 + 5.0, w), HC_SAND);
  vec3 dry = enamel * (hcSky * 0.9 + hcKey * sat(0.15 + 0.6 * dot(nr, vec2(0.85, -0.3))));
  vec3 inside = mix(dry, water, hcIn(rq - RB + 0.1, hcEdge(q / len, w) + 0.01)) + hcKey * 0.25 * hcBell((rq - RB + 0.1) * 45.0);
  // the cork
  float R = ck.x, ap = dot(ct, hcU), r = length(ct);
  vec2 sw = ct - hcU * ap, nw = (sw - hcU * sqrt(max(R * R - dot(sw, sw), 0.0))) / R;
  if (cd < 0.2) {
  vec3 cork = mix(mix(vec3(0.5, 0.28, 0.13), vec3(0.8, 0.76, 0.64), hcIron * 0.8), vec3(0.6, 0.1, 0.06), hcPale);
  if (HC_PAD > 0.0) { float a = atan(ct.y, ct.x + 1e-5); cork = mix(cork, mix(vec3(0.16, 0.34, 0.14), hcTint(mod(ck.w, 4.0)), 0.2) * (0.75 + 0.25 * cos(a * 11.0) + 0.3 * r / R), HC_PAD * (1.0 - 0.75 * hcPale)); }
  vec3 wall = cork * (0.6 + 0.5 * sat(0.5 + sin(nw.x * 31.0 + ck.w) * sin(nw.x * 13.0 - ck.w))) * (hcSky * 0.6 + hcKey * sun * sat(0.2 - nw.x));
  vec3 face = cork * (1.1 - 0.45 * (1.0 - 0.75 * HC_PAD) * smoothstep(0.55, 0.85, noise(ct * 55.0 + ck.w * 7.0))) * (hcSky + hcKey * sun * (1.0 - 0.7 * hcIn(hcSeg(ct, hcS * nt) - 0.01, 0.014)));
  inside = mix(inside, mix(wall, face, hcIn(r - R, hcEdge(ct / max(r, 1e-4), w))), hcIn(cd, hcEdge(ck.yz / max(length(ck.yz), 1e-4), w)));
  }
  col = mix(col, mix(inside, rim, hcIn(RB - rr, er)), hcIn(rr - RB - 0.14, er));
  if (near > 0.6) return col;
  // the needle and its head
  float kind = mod(nd.w, 4.0), loud = hcLoud(kind);
  vec3 tint = hcTint(kind), steel = mix(vec3(0.02, 0.03, 0.06), vec3(0.75, 0.72, 0.62), hcIron) * (0.35 + hcSky + 0.3 * hcKey) + hcKey * 0.6 * hcIn(abs(nd.y + nd.x * 0.5) - nd.x * 0.25, en);
  if (HC_SAIL > 0.0) steel = mix(steel, mix(vec3(0.9, 0.84, 0.72), tint, 0.65) * (hcSky * 1.4 + hcKey * (0.22 + 0.5 * sat(abs(nd.y) / max(nd.x, 1e-3)))) * (0.8 + 0.3 * loud), smoothstep(0.014, 0.022, nd.x));
  if (HC_LIT > 0.0) steel *= 1.0 - HC_LIT * (0.85 - 0.8 * exp(-dot(hd, hd) * 9.0));
  vec3 bead = mix(mix(vec3(0.3, 0.32, 0.34), vec3(0.55, 0.06, 0.04), hcPale), tint * tint * 0.6, 0.25 + 0.75 * sat(loud * 1.4));
  bead = bead * (hcSky * 1.3 + hcKey * sat(0.5 - 9.0 * hd.x + 7.0 * hd.y) * 0.8) + hcKey * hcIn(length(hd + vec2(0.018, -0.02)) - 0.012, en) * 0.9 + tint * loud * uEnergy * 0.3;
  col = mix(col, mix(steel, bead, hcIn(length(hd) - 0.055 * nd.z, en)), hcIn(near, en));
  if (HC_LIT > 0.0) col += HC_LIT * shine * sat(1.0 - 1.7 * max(near, 0.0));
  return col + hcKey * uKeys * fract(nd.w * 0.618 + 0.13) * exp(-dot(hd, hd) * 160.0);
}

vec3 render(vec2 p) {
  hcNight = max(-uOwn[0], 0.0); hcEve = max(uOwn[0], 0.0);
  hcIron = max(-uOwn[3], 0.0); hcPale = max(uOwn[3], 0.0);
  hcHigh = max(-uOwn[2], 0.0); hcFlat = max(uOwn[2], 0.0);
  hcStar = max(-uOwn[4], 0.0); hcWave = max(uOwn[4], 0.0);
  hcKey = mix(mix(vec3(2.5, 2.1, 1.5), vec3(1.7, 1.05, 0.5), hcNight), vec3(2.3, 1.15, 0.42), hcEve) * (0.95 + 0.15 * uLevel);
  hcSky = mix(mix(vec3(0.21, 0.26, 0.33), vec3(0.035, 0.05, 0.09), hcNight), vec3(0.3, 0.24, 0.36), hcEve);
  if (HC_LIT > 0.0) hcKey *= 1.0 - 0.75 * HC_LIT * hcNight;
  vec3 c;
  if (uVar < 0.5) c = hcTable(p); else c = hcBasin(p);
  return screenOf(c * 1.15);
}
