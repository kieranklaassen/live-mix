// name: Alley sun
// a: Smoke of stalls
// b: Cat stair
// what: A narrow market alley in shade, where sun comes down past washing and turns cooking smoke into four slanting blades, the brightest on a bicycle and two stacked baskets; or a stone stair that goes down into shade and up into white light, every tread with its lit lip, a cat on one sunny step, washing strung above.
// follows: Drone thickens the smoke; pad widens the sun; texture is steam at the stall, mist below the stair; phrase slides light along the paving or up the treads; bands light slats and lips, the piece glows in windows and behind slats. A hit runs down the blades or up the stair; a cue sends sun along it all. Keys light bulbs and windows; the loop swings the sun.
// own: 0 moonlit night at -1, low copper evening at 1; 1 snow on ledges and stone at -1, grey rain and shining stone at 1; 2 limewashed walls and blue wood at -1, red brick and tile at 1; 3 a crack of an alley at -1, a broad one at 1; 4 bare and more open to the sun at -1, crowded with big washing at 1; 5 the eye low at -1, at an upper window at 1
float auS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float auNight, auEve, auWet, auSnow, auLime, auBrick, auMany, auPx, auMist;
float auZs, auBase;       // how far the eye sees, how high a blade's foot is
float auL, auR;           // where the left and the right wall stand
vec2 auE;                 // the eye: across and up
vec3 auSun, auAir, auAmb; // sun, lit air far off, light in the shade
vec2 auLean;              // how far light moves across and away for a metre up
vec4 auB[4];              // the blades: across, how far off, half width, strength
// A kind's colour as a worn dye.
vec3 auDye(float k, float rich) {
  vec3 c = kindColour(k); c *= c;
  return mix(vec3(1.0, 0.93, 0.82), min(c / max(dot(c, vec3(0.3, 0.59, 0.11)), 0.05), 2.2), rich) * 0.42;
}
float auBox(vec2 q, vec2 b) { q = abs(q) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
float auSeg(vec2 q, vec2 a, vec2 b) { vec2 v = b - a; q -= a; return length(q - v * sat(dot(q, v) / dot(v, v))); }
float auIn(float d, float w) { return auS(w, -w, d); }
float auBump(float x) { return exp(-x * x); }

void auSet() {
  auNight = sat(-uOwn[0]); auEve = sat(uOwn[0]);
  auSnow = sat(-uOwn[1]); auWet = sat(uOwn[1]);
  auLime = sat(-uOwn[2]); auBrick = sat(uOwn[2]);
  auMany = uOwn[4];
  float pad = uPad * (0.4 + 0.8 * uEnergy), grey = max(auWet, auSnow);
  auSun = mix(vec3(1.0, 0.86 + 0.05 * uTone, 0.62 + 0.12 * uTone), vec3(1.25, 0.52, 0.2), auEve);
  auSun = mix(auSun, vec3(0.36, 0.52, 0.9), auNight) * (2.3 + 1.2 * pad) * (1.0 - 0.5 * auWet);
  auAir = mix(vec3(0.86, 0.78, 0.64), vec3(0.95, 0.47, 0.36), auEve);
  auAir *= mix(vec3(1.0), vec3(1.0, 0.86, 0.72), auBrick);
  auAir = mix(auAir, mix(vec3(0.68, 0.7, 0.73), vec3(0.4, 0.46, 0.52), auWet), 0.75 * grey);
  auAir = mix(auAir, vec3(0.05, 0.085, 0.16), auNight) * (0.8 + 0.25 * pad + 0.15 * uMic);
  auAmb = mix(vec3(0.078, 0.086, 0.1), vec3(0.1, 0.07, 0.11), auEve);
  auAmb = mix(auAmb, vec3(0.02, 0.032, 0.06), auNight) * (0.9 + 0.3 * uSpace + 0.5 * auSnow + 0.3 * auLime);
  auMist = 0.034 * (0.8 + 0.7 * uDrone + 0.3 * uLow) * (1.0 + 0.5 * grey);
}
// Colour c seen through z metres of air.
vec4 auVeil; // the air before a thing
vec4 auHaze(float z, float y) { return vec4(auAir * (0.6 + 0.07 * clamp(y, 0.0, 6.0)) * (0.3 + 0.8 * sat(z * 0.045)), exp(-max(z - 1.5, 0.0) * auMist)); }
vec3 auFog(vec3 c, float z, float y) { vec4 h = auHaze(z, y); return mix(h.rgb, c, h.a); }
void auLay(inout vec3 col, vec3 c, float a) { col = mix(col, mix(auVeil.rgb, c, auVeil.a), a); }
// Blade k, u metres off its middle, with the gaps between the washing in it.
float auEdge(int k, float u, float y) {
  float soft = 0.05 + 0.006 * auB[k].y + 0.03 * max(3.5 - y, 0.0);
  return auS(auB[k].z + soft, auB[k].z - soft, abs(u)) * (0.8 + 0.2 * sin(u * (15.0 + 9.0 * u) + float(k) * 2.0));
}
// The sun that gets down to a place in the alley.
float auPool(vec3 P) {
  float s = 0.0;
  for (int k = 0; k < 4; k++)
    s += auEdge(k, P.x - auLean.x * P.y - auB[k].x, P.y) * auS(0.75, 0.45, abs(P.z - auB[k].y - auLean.y * P.y)) * auB[k].w;
  return s;
}
// The light in a room, from the piece.
vec4 auRoom(float n, float up, float side) {
  vec4 a = piece(vec2(fract(n * 0.137 + 0.144), sat(0.155 + 0.35 * up + 0.12 * side)));
  return vec4(mix(vec3(1.0, 0.72, 0.38), a.rgb / max(a.a, 0.01), 0.35), a.a);
}
// A house front: s along the alley, y up from its door; w a pixel's size along and up.
vec3 auFront(float s, float y, float side, vec2 w, vec3 lit) {
  float id = floor(s / 3.4), f = s - id * 3.4, h = hash21(vec2(id, side * 3.0 + 11.0)), m = max(w.x, w.y);
  vec3 glow = vec3(0.0), wood = mix(auDye(floor(h * 3.99), 0.24) * 0.45, vec3(0.14, 0.26, 0.42), auLime);
  vec3 alb = mix(vec3(0.34, 0.31, 0.28), vec3(0.56, 0.52, 0.45), h);
  alb = mix(alb, vec3(0.86, 0.85, 0.8), auLime);
  alb = mix(alb, mix(vec3(0.46, 0.19, 0.12), vec3(0.58, 0.33, 0.16), h), auBrick);
  alb *= 0.58 + 0.5 * noise(vec2(s * 2.3, y * 0.5)) + 0.4 * noise(vec2(s * 7.0, y * 1.2));
  vec2 j = abs(fract(vec2(s / 0.3 + 0.5 * floor(y / 0.11), y / 0.11)) - 0.5);
  alb *= 1.0 - 0.4 * auBrick * auS(0.06, 0.02, w.y) * max(auS(0.42, 0.48, j.x), auS(0.35, 0.46, j.y));
  alb *= 1.0 - 0.55 * auIn(abs(f) - 0.05, w.x + 0.02);
  if (y < 2.7) {
    // the ground floor: a shop closed with slats
    vec2 q = vec2(f - 1.85, y - 1.15);
    float in_ = auIn(auBox(q, vec2(1.2, 1.12)), m), row = y / 0.1, n = fract(row), bx = sat(floor(row) / 22.0), b = band(bx);
    float slat = mix(0.62, 0.35 + 0.65 * auS(0.0, 0.55, n) * auS(1.0, 0.9, n), auS(0.06, 0.02, w.y));
    alb = mix(alb, wood * (0.5 + slat * 0.9) * (1.0 - 0.6 * auIn(abs(abs(q.x) - 0.4) - 0.03, w.x)), in_) * (0.6 + 0.4 * auS(0.0, 0.7, y));
    glow = in_ * (slat - 0.3) * auDye(3.0 * bx, 0.35) * b * b * 0.35 * uEnergy;
    vec4 a = auRoom(id, 0.4, side);
    glow += in_ * mix(0.12, auS(0.75, 0.96, n), auS(0.024, 0.008, w.y + 0.25 * w.x)) * a.rgb * a.a * (0.1 + 0.8 * uEnergy);
  } else {
    // above: shuttered windows, the piece as the light in them
    float st = floor((y - 2.7) / 2.5), fy = y - 2.7 - st * 2.5, wn = floor(f / 1.7);
    vec2 q = vec2(f - (wn + 0.5) * 1.7, fy - 1.2);
    float win = auIn(auBox(q, vec2(0.36, 0.62)), m), wing = auIn(auBox(vec2(abs(q.x) - 0.58, q.y), vec2(0.19, 0.66)), m);
    alb = mix(alb, wood * (0.7 + 0.8 * mix(0.5, auS(0.1, 0.6, fract(fy / 0.09)), auS(0.05, 0.015, w.y))), wing);
    alb = mix(alb, vec3(0.05, 0.055, 0.06), win);
    vec4 a = auRoom(id + 0.5 * wn, 0.5 + st, side);
    float on = a.a * (0.35 + 0.9 * uEnergy) + (0.05 + 0.3 * max(auNight, uKeys)) * step(0.6, hash21(vec2(id * 3.0 + wn, st + side)));
    glow = win * auS(0.02 - m, 0.02 + m, min(abs(q.x), abs(abs(q.y - 0.1) - 0.22))) * a.rgb * on * (0.8 + auNight);
    alb = mix(alb, vec3(0.6 + 0.5 * auSnow), auIn(auBox(q + vec2(0.0, 0.7), vec2(0.46, 0.05)), m));
    alb *= 1.0 - 0.4 * auIn(abs(fy) - 0.06, w.y);
  }
  return alb * lit + glow;
}
// Paving or a tread.
vec3 auStone(vec2 q, vec2 w) {
  vec2 c = q / vec2(0.62, 0.42); w /= vec2(0.62, 0.42);
  c.x += 0.5 * floor(c.y);
  vec2 f = abs(fract(c) - 0.5);
  float far = auS(0.35, 0.1, w.y), n = noise(q * 3.1);
  vec3 a = mix(vec3(0.3, 0.29, 0.28), vec3(0.5, 0.47, 0.42), mix(0.5, hash21(floor(c)), far) * 0.7 + 0.3 * n);
  a = mix(a, vec3(0.55, 0.25, 0.15) * (0.7 + 0.6 * a.r), 0.8 * auBrick) * (1.0 + 0.6 * auLime);
  a *= (1.0 - 0.55 * far * max(auS(0.47 - w.x, 0.5, f.x), auS(0.45 - w.y, 0.5, f.y))) * (1.0 - 0.5 * auWet);
  return mix(a, vec3(0.85, 0.87, 0.9) * (0.9 + 0.2 * n), auS(0.0, 0.5, auSnow * 1.5 - 0.7 * n));
}
// Washing on a pole at height h, and wordless boards with a bulb under each.
void auCard(inout vec3 col, vec2 r, float z, float h, float size, float seed, vec3 b) {
  vec2 q = auE + r * z;
  float px = auPx * z, cell = 0.62, more = sat(auMany);
  if (z > auZs || abs(q.y - 3.3) > 2.4) return;
  auVeil = auHaze(z, q.y);
  h += -0.9 * more + 0.1 * (q.x - 0.2) * (hash11(seed) - 0.3) - 0.04 * cos(q.x * 1.2) + 0.015 * sin(uTime * 0.31 + seed);
  float down = h - q.y, at = q.x / cell + seed * 0.37, n = floor(at), r1 = hash21(vec2(n, seed)), r2 = hash21(vec2(n + 5.0, seed * 1.7));
  if (down > -0.1 && down < 2.0) {
    float here = auS(r1 * 0.8 - 0.05, r1 * 0.8 + 0.12, 0.62 + 0.42 * auMany);
    float x = (at - n - 0.5) * cell + down * (0.05 * sin(uTime * 0.43 + n * 1.3 + seed) + 0.2 * uHits * (1.0 - uHits));
    vec2 b = vec2(0.17 + 0.1 * r2, (0.35 + 0.75 * r1) * size * here * (0.5 + 0.35 * more));
    float d = auBox(vec2(x, down - b.y), b + vec2(-0.03 * down, 0.02 * sin(x * 22.0 + n)));
    if (r2 > 0.55) d = min(d, auBox(rot(0.5) * vec2(abs(x) - b.x - 0.02, down - 0.12), vec2(0.07, 0.11))); // a shirt has sleeves
    vec3 c = auDye(floor(r2 * 4.99), 0.36) * (auAmb * 1.2 + auSun * (0.21 + 0.35 * uHits * auS(-0.05, 0.0, d)));
    auLay(col, c, auIn(d, px) * auS(0.0, 0.1, here));
    auLay(col, vec3(0.02), auIn(abs(down) - 0.018, px) * sat(1.3 + 1.3 * auMany));
  }
  // b: half a board's width and height, how high it hangs
  float side = q.x < 0.0 ? -1.0 : 1.0;
  seed += 3.5 + 2.2 * side; b.z -= 0.2 * side;
  float k = hash11(seed), here = auS(k * 0.9 - 0.1, k * 0.9 + 0.1, 0.55 + 0.6 * auMany) * step(0.01, b.x) * (side < 0.0 ? 1.0 - uVar : 1.0);
  b.xy *= sqrt(here);
  vec2 v = vec2(q.x - (side < 0.0 ? auL : auR) + side * (b.x + 0.46), q.y - b.z);
  v.x += 0.012 * v.y * sin(uTime * 0.37 + seed);
  float d = auBox(v, b.xy);
  if (d < 0.4) {
    vec3 c = auDye(floor(hash11(seed + 3.1) * 3.99), 0.5) * (0.6 + 0.2 * sin(v.x * 40.0 + seed) * sin(v.y * 3.0));
    c *= (1.0 + 0.7 * auIn(abs(d + 0.06) - 0.012, px)) * (auAmb * 1.25 + auSun * (0.2 - 0.1 * side) * auS(-0.1, 0.0, d));
    auLay(col, vec3(0.015), auIn(auBox(v - vec2(side * 0.2, b.y + 0.06), vec2(b.x + 0.25, 0.018)), px) * here);
    auLay(col, c, auIn(d, px) * auS(0.0, 0.15, here));
    float lamp = length(v + vec2(0.0, b.y + 0.14));
    col += vec3(1.0, 0.62, 0.28) * here * (0.06 + 0.94 * max(auNight, uKeys)) * (auIn(lamp - 0.045, px) * 2.2 + 0.35 * exp(-lamp * 5.0) * auS(0.38, 0.15, d));
  }
}
// Drifting smoke.
float auSmoke(vec2 q, float seed) {
  vec2 d = vec2(0.11, -0.16) * uTime + vec2(0.05, -0.12) * uTravel;
  float a = 0.5 + 0.25 * sin(q.x * 2.6 + d.x * 2.0 + seed * 3.0 + 1.3 * sin(q.y * 1.7 + d.y)) + 0.25 * sin(q.y * 1.9 + d.y * 2.0 + seed);
  return a * 0.45 + 0.55 * noise(q * vec2(1.9, 1.3) + d * 1.7 + a * 1.1 + seed * 2.0);
}
// The smoke that blade k lights, over what is behind it.
void auBlade(inout vec3 col, int k, vec2 r) {
  float z = auB[k].y; vec2 q = auE + r * z; q.y -= auBase;
  float u = q.x - auLean.x * q.y - auB[k].x;
  if (z > auZs || q.y < -0.05 || abs(u) > auB[k].z + 1.4) return;
  float s = auSmoke(q, float(k) * 5.3);
  float core = auEdge(k, u, q.y) * auS(0.0, 0.4, q.x - auL) * auS(0.0, 0.35, auR - q.x);
  float f = (core * (0.18 + 0.5 * s + 0.85 * s * s) + 0.13 * s * auBump(1.5 * u)) * auB[k].w;
  f *= (0.35 + 0.9 * uDrone * (0.5 + uEnergy) + 0.2 * uLow) * auS(7.5, 3.0, q.y) * auS(-0.05, 0.25, q.y) * exp(-0.02 * z);
  col = mix(auSun * 0.78, col, exp(-1.05 * f));
}
// The bicycle, side on, its wheels on y = 0.
const vec4 auBar[8] = vec4[8](vec4(-0.52, 0.34, -0.1, 0.3), vec4(-0.1, 0.3, -0.22, 0.86), vec4(-0.52, 0.34, -0.2, 0.74), vec4(-0.1, 0.3, 0.37, 0.7),
  vec4(-0.2, 0.74, 0.36, 0.8), vec4(0.34, 0.97, 0.52, 0.34), vec4(0.34, 0.97, 0.24, 1.01), vec4(-0.3, 0.89, -0.14, 0.88));
float auBike(vec2 q) {
  float w = length(vec2(abs(q.x) - 0.52, q.y - 0.34)), d = min(abs(w - 0.32) - 0.02, w - 0.045);
  for (int i = 0; i < 8; i++) d = min(d, auSeg(q, auBar[i].xy, auBar[i].zw) - 0.019);
  return d;
}
float auBasket(vec2 q) { return auBox(vec2(q.x / (0.8 + 0.5 * q.y), q.y - 0.21), vec2(0.27, 0.19)) - 0.02; }
// The cat, sitting, its back to us; the tail moves.
float auCat(vec2 q) {
  float d = length((q - vec2(0.0, 0.13)) * vec2(1.0, 0.82)) - 0.125;
  d = smin(d, length((q - vec2(0.01, 0.27)) * vec2(1.0, 0.8)) - 0.075, 0.06);
  d = smin(d, length((q - vec2(0.02, 0.385)) * vec2(0.95, 1.1)) - 0.068, 0.02);
  vec2 e = vec2(abs(q.x - 0.02) - 0.043, q.y - 0.455);
  d = min(d, max(abs(e.x) * 0.9 + e.y * 0.45 - 0.024, -e.y - 0.05));
  return smin(d, auSeg(q, vec2(0.05, 0.03), vec2(0.3, 0.06 + 0.04 * sin(uTime * 0.7))) - 0.024, 0.03);
}

// What the eye meets (1 wall, 2 ground), where, where on its face, a pixel's size, its light
int auWhat;
vec3 auP, auLit, auShine;
vec2 auAt, auW;
float auSide, auOver;   // which wall; how far it is above its roof
vec3 auBack;            // what is behind that roof, or where there is neither

void auAlley(vec2 p, vec2 r) {
  float wide = exp2(0.75 * uOwn[3]), up = uOwn[5];
  auL = -1.75 * wide; auR = -auL;
  auE = vec2(0.7 * wide, 1.35 + (up > 0.0 ? 2.25 : 0.95) * up);
  auLean = vec2(0.62 + 0.06 * sin(TAU * uLoop) + 0.25 * auEve, 0.08);
  auB[0] = vec4(-2.6, 3.1, 0.3, 0.6); auB[1] = vec4(-1.9, 4.6, 0.3, 0.66); auB[2] = vec4(-0.75, 7.2, 0.52, 1.35); auB[3] = vec4(0.1, 11.6, 0.5, 0.95);
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    auB[k].xz *= vec2(wide, 1.0 + 0.35 * uPad - 0.35 * auMany);
    auB[k].x += 0.12 * sin(uTime * 0.05 + fk * 1.7);
    auB[k].w *= 0.75 + 0.25 * uPad + 1.3 * uHits * auBump(1.2 * (fk - 3.6 * (1.0 - uHits))); // a hit runs away down them
  }
  // both walls lean out above the shops
  const float eave = 2.7;
  auSide = sign(r.x);
  float x = auSide < 0.0 ? auL : auR, z = (x - auE.x) / r.x, zf = r.y < 0.0 ? -auE.y / r.y : 1e4;
  float x1 = x - auSide * 0.32, z1 = z * (x1 - auE.x) / (x - auE.x), y0 = auE.y + r.y * z, y1 = auE.y + r.y * z1;
  auBack = auAir * (1.0 + 0.5 * sat(p.y + 0.3)) * mix(1.25, 0.7, auNight);
  auZs = 34.0;
  float big = step(auSide, 0.0);
  if ((y1 > eave && z1 < 34.0) || (y0 <= eave && z < min(zf, 34.0))) {
    auWhat = 1;
    if (y1 > eave) { z = z1; x = x1; }
    float id = floor(z / 3.4), t = auSide < 0.0 ? 8.6 : 4.6, zn = (id + 1.0) * 3.4, yn = auE.y + r.y * zn;
    auP = vec3(x, auE.y + r.y * z, z); auAt = auP.zy;
    auW = auPx * z * vec2(z / max(abs(x - auE.x), 0.2), 1.0);
    auOver = auS(-auW.y, auW.y, auP.y - t - 1.6 * hash11(id + t));
    auBack = mix(auBack, auFog(auAmb * 0.35, zn, yn), auIn(yn - t - 1.6 * hash11(id + t + 1.0), auPx * zn));
    auZs = mix(z, 1e3, auOver);
    auLit = auAmb * (0.75 + 0.06 * auP.y) + auSun * big * 0.9 * uCue * auBump(0.2 * (z - 11.0 + 7.0 * uCue));
    big *= 0.42;
  } else if (y0 > eave && z < 34.0) {
    auZs = auE.y < eave ? (eave - auE.y) / r.y : z;
    auBack = auFog(auAmb * 0.08, auZs, eave);
  } else if (zf < 34.0) {
    auWhat = 2; auZs = zf; auP = vec3(auE.x + r.x * zf, 0.0, zf); auAt = auP.xz;
    auW = auPx * zf * vec2(1.0, zf / auE.y);
    auLit = auAmb * (0.5 + 0.5 * auS(0.0, 0.9, min(auP.x - auL, auR - auP.x))) + auSun * 0.07 * auBump(0.32 * length(auP.xz - auB[2].xy));
    // the phrase, sliding
    auLit += auSun * uPhrase * (0.35 + 0.5 * uEnergy) * auBump(5.5 * (zf - 5.0 - 3.0 * sin(uTravel * 0.21) - 0.25 * auP.x));
    big = 0.75 * (1.0 - 0.6 * auBump(length((auP.xz - vec2(-0.75, 7.15)) * vec2(1.0, 5.5))));
    auShine = auAir * 0.5 + auSun * 0.6 * auBump(1.3 * (auE.x + r.x * 7.2 + 0.2));
  } else auBack = mix(auBack, auAir * 0.42, auIn(auE.y + r.y * 34.0 - 4.6, 0.06));
  if (auWhat > 0) auLit += auSun * big * auPool(auP);
}

const float auTr = 0.32, auRi = 0.17, auZ0 = 3.4, auZ1 = 7.6; // a tread, a riser, where it goes down, where up again
const float auLow = -1.53, auSteps = 28.0, auCatZ = 8.75;
// The sun over the right roofs; a low one lets it in on the cat's step.
float auHigh(vec3 P) {
  float roof = 9.6 - 0.2 * P.z - 4.95 * auS(1.0, 0.7, abs(P.z - auCatZ) / (1.0 + 2.2 * sat(-auMany))) - 3.6 * auS(11.5, 16.0, P.z);
  return auS(-0.06, 0.2, auR - P.x - (roof - P.y) * auLean.x);
}
void auStair(vec2 r) {
  float wide = exp2(0.7 * uOwn[3]), up = uOwn[5];
  auL = -3.0 * wide; auR = 2.2 * wide;
  auE = vec2(0.8 * wide, 3.1 + (up > 0.0 ? 1.6 : 1.0) * up);
  auLean = vec2(0.8 * wide + 0.05 * sin(TAU * uLoop) - 0.06 * uPad, 0.0);
  auMist *= 1.2; auBase = auLow + 3.0 * auRi;
  auB[0] = auB[1] = auB[3] = vec4(0.0, 99.0, 0.0, 0.0);
  auB[2] = vec4(-0.95, auCatZ + 0.3, 0.6, (0.12 + 0.6 * uHits + 0.2 * uPad) * (1.0 - 0.4 * auNight));
  float s = auRi / auTr, m = r.y;
  // tread or riser: z how far, y how high, n its number, lip how far from the edge
  float z = 60.0, y = 0.0, lip = 9.0, n = -1.0, za = m < 0.0 ? -auE.y / m : 1e4;
  bool riser = false;
  float i = m + s < -1e-3 ? floor(((s * auZ0 - auE.y) / (m + s) - auZ0) / auTr) : 99.0;
  if (za < auZ0) { z = za; lip = auZ0 - z; }
  else if (i >= 0.0 && i < 9.0) { n = i; y = -(i + 1.0) * auRi; z = (y - auE.y) / m; lip = auZ0 + (i + 1.0) * auTr - z; }
  else if (m < 0.0 && (auLow - auE.y) / m < auZ1) { z = (auLow - auE.y) / m; y = auLow; n = 9.0; }
  else if (m < s - 1e-3) {
    i = max(floor(((auE.y - auLow - auRi + s * auZ1) / (s - m) - auZ1) / auTr), -1.0);
    float zr = auZ1 + (i + 1.0) * auTr, yr = auE.y + m * zr, yt = auLow + (i + 1.0) * auRi;
    n = 10.0 + i;
    if (i >= auSteps - 1.0) { y = auLow + auSteps * auRi; n = 38.0; if (m < 0.0 && auE.y > y) z = (y - auE.y) / m; }
    else if (yr < yt && m < 0.0) { z = (yt - auE.y) / m; y = yt; lip = z - (auZ1 + i * auTr); }
    else { riser = true; z = zr; y = yr; lip = yt + auRi - yr; }
  }
  auSide = sign(r.x);
  float x = auSide < 0.0 ? auL : auR, zw = (x - auE.x) / r.x;
  auZs = min(z, zw); auP = vec3(auE.x + r.x * auZs, auE.y + r.y * auZs, auZs);
  auBack = auAir * mix(2.2, 0.7, auNight);
  float px = auPx * auZs, sun = auHigh(auP);
  if (zw < z && zw < 40.0) {
    auWhat = 1;
    float id = floor(zw / 3.4), zm = (id + 0.5) * 3.4;
    auAt = vec2(zw, auP.y - (zm < auZ0 ? 0.0 : zm < auZ1 ? auLow * 0.8 : auLow + (zm - auZ1) * s + 0.3));
    auW = px * vec2(zw / max(abs(x - auE.x), 0.2), 1.0);
    auLit = auAmb * mix(0.22, 1.5, auS(-1.5, 4.0, auP.y)) + auSun * sun * 0.34 * step(auSide, 0.0);
    auLit += auSun * (0.08 * auS(5.0, 15.0, zw) + (0.07 + 0.4 * uCue) * auBump(0.5 * length(auP.yz - vec2(0.2, auCatZ))));
    auOver = auS(-px, px, auP.y - (auSide < 0.0 ? 8.8 : 7.2) + 0.14 * zw - 1.6 * hash21(vec2(id, auSide)));
  } else if (z < 59.0) {
    auWhat = 2; auP.y = y;
    float pl = riser ? px : px * z / max(abs(auE.y - y), 0.3), low = auS(-2.0, 3.4, y);
    auAt = (riser ? auP.xy * vec2(1.0, 1.4) : auP.xz) + vec2(n * 0.31, 0.0); auW = vec2(px, pl);
    auLit = auAmb * mix(0.2, 1.7, low) * (riser ? 0.4 : 1.0) * (0.45 + 0.55 * auS(0.0, 0.7, min(auP.x - auL, auR - auP.x)));
    auLit += auSun * (sun * (riser ? 0.4 : 1.15) * (1.0 + 0.4 * uPad) + 0.05 * auBump(0.6 * length(auP.xz - vec2(-0.5, auCatZ))));
    // the worn lips: bands, the phrase, a hit
    float w = riser ? 0.028 : 0.045, b = band(sat(n / 38.0));
    auLit += auS(w + pl, w - pl * 0.3, lip) * (auAmb * 2.6 + auSun * (0.03 + 0.12 * low + 0.25 * uEnergy * b * b
      + uPhrase * (0.5 + 0.9 * uEnergy) * auBump(0.25 * (n - 19.0 - 19.0 * sin(uTravel * 0.19))) + 1.3 * uHits * auBump(0.28 * (n - 34.0 * (1.0 - uHits)))));
    auLit += auSun * uCue * 0.6 * auBump(0.3 * (z - 4.0 - 9.0 * uCue));
    auLit *= 1.0 - 0.65 * auBump(length((auP.xz - vec2(-1.15, auCatZ)) * vec2(2.2, 8.0)));
    auShine = auAir * (riser ? 0.1 : 0.6);
  }
}

vec3 render(vec2 p) {
  auSet();
  bool b = uVar > 0.5;
  float F = b ? 0.98 : 1.15;
  vec2 r = (p - (b ? vec2(0.16, 0.33 + 0.06 * uOwn[5]) : vec2(0.2, -0.12 + (uOwn[5] > 0.0 ? 0.26 : 0.14) * uOwn[5]))) / F;
  r += step(abs(r), vec2(1e-4)) * 2e-4;
  auPx = 0.75 / (uRes.y * F);
  auWhat = 0; auOver = 0.0; auBase = 0.0; auP = auLit = auShine = vec3(0.0); auAt = auW = vec2(0.0);
  if (b) auStair(r); else auAlley(p, r);
  vec3 col = auBack;
  if (auWhat == 1) col = auFront(auAt.x, auAt.y, auSide, auW, auLit);
  if (auWhat == 2) {
    col = auStone(auAt, auW) * auLit;
    col = mix(col, auShine, auWet * (0.12 + 0.75 * pow(1.0 - sat((auE.y - auP.y) / length(vec2(auE.y - auP.y, auP.z))), 3.0)));
  }
  if (auWhat > 0) col = mix(auFog(col, auP.z, auP.y), auBack, auOver);
  if (b) col = mix(col, auAir * 0.5, uTexture * 0.3 * auBump(0.9 * (auP.y - auLow)) * auS(4.0, 7.0, auZs)); // mist in the hollow
  if (b) col = mix(col * mix(0.42, 1.0, auS(3.0, 9.0, auZs)), auBack, auS(9.0, 19.0, auZs) * 0.75 * (1.0 - 0.6 * auNight)); // the top goes out into white
  // from far to near: boards, washing, the blades between
  vec4 w = b ? vec4(14.0, 11.0, 9.4, 6.6) : vec4(15.0, 9.4, 5.9, 3.9), h = b ? vec4(5.35, 4.65, 4.35, 4.1) : vec4(4.9, 4.6, 4.3, 3.9);
  float size = b ? 0.6 : 0.9; vec3 one = b ? vec3(0.0) : vec3(0.21, 0.7, 3.5);
  auCard(col, r, w.x, h.x, size, 11.0, one * 1.1);
  auBlade(col, 3, r);
  auCard(col, r, w.y, h.y, size, 2.0, one);
  auBlade(col, 2, r);
  float zc = b ? auCatZ : 7.0, px = auPx * zc;
  vec2 q = auE + r * zc - (b ? vec2(-0.85, auLow + 4.0 * auRi) : vec2(-0.75, 0.0));
  auVeil = auHaze(zc, q.y);
  if (b && zc < auZs + 0.3 && abs(q.x) < 0.7 && abs(q.y) < 0.8) {
    q /= 1.3;
    float d = auCat(q);
    col = mix(col, vec3(0.012) + auSun * 0.2 * auS(-0.02, 0.0, d) * auS(0.03, 0.08, q.x) * auS(0.08, 0.14, q.y) * auS(0.44, 0.36, q.y), auIn(d, px));
  }
  if (!b && zc < auZs && abs(q.x - 0.4) < 1.3 && q.y < 1.1) {
    auLay(col, vec3(0.02), auIn(auBike(q), px));
    q.x -= 1.12; float e = auBasket(q), e2 = auBasket(q - vec2(-0.03, 0.43));
    if (e2 < e) { e = e2; q -= vec2(-0.03, 0.43); }
    vec3 c = vec3(0.5, 0.36, 0.2) * (0.06 + auSun * (0.03 + 0.3 * auS(-0.2, 0.3, q.x)) * (0.85 + 0.3 * sin(q.x * 70.0) * sin(q.y * 60.0)));
    auLay(col, c, auIn(e, px));
  }
  auCard(col, r, w.z, h.z, size, 5.0, one);
  auBlade(col, 1, r);
  auCard(col, r, w.w, h.w, size, 9.0, b ? vec3(0.22, 0.3, 2.6) : one * 0.9);
  auBlade(col, 0, r);
  if (b) {
    // an iron rail
    float xr = auL + 0.5, zr = (xr - auE.x) / min(r.x, -1e-3);
    if (r.x < -1e-3 && zr < min(auZs, 16.5)) {
      float yr = auE.y + r.y * zr, w = auPx * zr, s = auRi / auTr;
      float h = yr - (zr > auZ1 ? auLow + s * (zr - auZ1) : clamp(s * (auZ0 - zr), auLow, 0.0));
      col = mix(col, auFog(vec3(0.015) + auSun * 0.1 * auS(8.0, 11.0, zr), zr, yr), auIn(abs(h - 0.85) - 0.025, w));
    }
    return screenOf(col);
  }
  // the near stall: counter, steamer, awning, ladles
  px = auPx * 2.4;
  q = auE + r * 2.4 - vec2(auL + min(0.0, -0.75 * auL - 1.3125), 0.0);
  if (q.x > 2.2) return screenOf(col);
  vec2 k = vec2(q.x - 0.78, q.y - 0.84), s = k - vec2(0.0, 0.46);
  float d = min(auBox(q - vec2(0.1, 0.41), vec2(0.98, 0.41)), auBox(k - vec2(0.0, 0.16), vec2(0.245, 0.16)));
  d = min(d, min(max(length((s + vec2(0.0, 0.15)) * vec2(1.0, 1.9)) - 0.24, -0.15 - s.y), length(s) - 0.03));
  float rim = auS(-0.022, 0.0, d) * step(0.8, q.y) * max(auS(0.31, 0.35, k.y) * step(k.y, 0.43), auS(0.12, 0.26, k.x));
  float x = (s.x - 0.12 * s.y - 0.06 * sin(s.y * 3.0 - uTime * 0.6) * (1.0 + s.y)) / (0.16 + 0.22 * max(s.y, 0.0));
  float st = auS(-0.1, 0.3, s.y) * auS(2.6, 0.6, s.y) * auBump(1.2 * x) * auSmoke(q * 2.0 - vec2(0.0, 0.25 * uTime), 9.0);
  col = mix(col, auAir * 0.7 + auSun * 0.12, sat(st * (0.4 + 1.2 * uTexture)));
  col = mix(col, vec3(0.01) + auSun * 0.16 * rim, auIn(d, px));
  float edge = 2.02 + 0.1 * q.x + 0.012 * sin(uTime * 0.4 + q.x * 2.0), hx = (q.x - 0.46) / 0.26, hi = clamp(floor(hx + 0.5), 0.0, 2.0);
  vec2 hk = vec2((hx - hi) * 0.26 + 0.015 * sin(uTime * 0.5 + hi * 2.3), q.y - edge + 0.15 + 0.03 * hi * (2.0 - hi));
  float hang = min(auBox(hk - vec2(0.0, 0.08), vec2(0.006, 0.1)), max(length(hk * vec2(1.0, 1.3)) - 0.09, hk.y - 0.03));
  float aw = max(edge - 0.07 * abs(sin(q.x * 14.0)) - q.y, max(q.x - 1.28, q.y - edge - 0.75));
  vec3 cloth = auDye(1.0, 0.3) * auAmb * (0.5 + 0.9 * step(0.5, fract(q.x * 3.2))) + auSun * 0.02 * auS(-0.3, 0.0, aw);
  col = mix(mix(col, vec3(0.012), auIn(hang, px)), mix(cloth, auAmb * 4.0, auSnow * auS(0.2, 0.5, q.y - edge)), auIn(aw, px));
  return screenOf(col);
}
