// name: Ghost in glass
// a: Parlour set
// b: Under the stage
// what: A stage parlour in low gold light. Across it leans a sheet of glass, known by one cold seam, and in it stand pale things that are not there: a tree, a lilac, a cage, a lamp; or the trick from the side, with the pit where the real ones lean under lamps.
// follows: Each kind is one ghost, as bright as it is loud: drone the tree, pad (or a voice) the lilac, texture falling petals, phrase the cage and its swing, hits the lamps. Bands light leaves and bars. The loop turns them to and fro. The sheen of the glass drifts, keys set glints on its edge, a cue dims the room round them.
// own: 0 moonlight at -1, broad day at 1; 1 bare twigs and cold air at -1, heavy leaf and green air at 1; 2 small ghosts at -1, huge at 1; 3 close at -1, far and high at 1; 4 dark green paper and velvet at -1, rose at 1; 5 blue ghosts in line in a dim room at -1, full and gaslit at 1; 6 a bare black stage at -1, the walls gone and open country at 1 (b: the glass leans far at -1, stands up at 1); 7 cages hung in rows at -1, a wood of weeping trees at 1
#define SG_BARE max(-uOwn[6], 0.0)
#define SG_OPEN max(uOwn[6], 0.0)
#define SG_WOOD max(uOwn[7], 0.0)
float sgPx, sgE, sgFill, sgLeaf, sgTurn, sgVeil, sgLv[5]; // a pixel, and here; how full the ghosts are, leaf, turn, what they hide, lamps
vec3 sgTint[5], sgLight, sgPale, sgDye, sgSun, sgSky, sgL; // the ghosts' colours and light; the paper, sun, sky, way to the sun
float sgB[66]; // the boxes of the set: where, and half their size

float sgBy(float low, float mid, float high, float q) { return q < 0.0 ? mix(mid, low, -q) : mix(mid, high, q); }
vec3 sgBy(vec3 low, vec3 mid, vec3 high, float q) { return q < 0.0 ? mix(mid, low, -q) : mix(mid, high, q); }
float sgDn(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); } // falls from a to b
float sgSq(float x) { return x * x; }
float sgIn(float d) { return sgDn(sgE, -sgE, d); }
float sgLine(float d, float w) { float s = max(1.0 - d * d / (3.0 * w * w), 0.0); return s * s * s; }
float sgSpan(float x, float a, float b, float w) { return sat((x - a) / w + 0.5) * sat((b - x) / w + 0.5); }
void sgAdd(vec3 c, float light) { sgLight += c * light; sgVeil = max(sgVeil, 0.6 * min(light, 1.0)); }
// Round glass, bright where it turns away: s is across it.
float sgGlass(float s) { float r = min(abs(s), 1.0); return sgFill + (1.0 - sgFill) * r * r * r; }

// ---- the ghosts, in metres round the foot of each
vec2 sgQ, sgWay;        // this place; which way the next branch goes
vec3 sgBark;            // the nearest branch: how far, across, how wide
float sgLeafy, sgStalk;
vec4 sgOne, sgTwo;      // the two nearest twigs: the way to their ends, how near us, which
vec3 sgOff(inout vec3 dir, vec3 from, float turned, float len, float wide) {
  sgWay = mat2(-0.62, 0.785, -0.785, -0.62) * sgWay;
  dir = normalize(dir + turned * vec3(sgWay.x, 0.1 - 3.0 * SG_WOOD * max(0.62 - len, 0.0), sgWay.y));
  vec3 to = from + dir * len * (0.97 + 0.17 * sgWay.y);
  vec2 pa = sgQ - from.xy, ba = to.xy - from.xy;
  float h = sat(dot(pa, ba) / (dot(ba, ba) + 1e-5)), r = wide * (1.0 - 0.45 * h), d = length(pa - ba * h);
  if (d - r < sgBark.x) sgBark = vec3(d - r, d, r);
  return to;
}
void sgTwig(vec3 dir, vec3 from, float turned, float id) {
  vec4 end = vec4(sgQ, 0.0, id) - vec4(sgOff(dir, from, turned, 0.36, 0.013), 0.0);
  float far = dot(end.xy, end.xy);
  if (far < dot(sgOne.xy, sgOne.xy)) { sgTwo = sgOne; sgOne = end; } else if (far < dot(sgTwo.xy, sgTwo.xy)) sgTwo = end;
}
void sgRing(float r, float a, float n, float lit) { // leaves round a twig's end
  float cell = floor(a / TAU * n + 0.5), h = fract(sgOne.w * 0.618 + mod(cell, n) * 0.37 + n * 0.71);
  a -= cell * TAU / n;
  vec2 m = r * vec2(cos(a), sin(a)) - vec2(0.04 * n - 0.14 + 0.03 * h, 0.03 * (h - 0.5));
  float u = m.x / ((0.034 + 0.026 * h) * (0.5 + 0.5 * sgLeaf)), shape = sgIn(abs(m.y) - 0.022 * sgLeaf * (0.5 + 0.7 * h) * (1.0 - u * u)) * step(abs(u), 1.0);
  sgLeafy = max(sgLeafy, shape * (0.3 + 0.75 * h) * (0.65 + 0.35 * smoothstep(0.0, 0.008, abs(m.y))) * lit);
  sgStalk = max(sgStalk, 0.4 * sgIn(abs(m.y) - 0.5 * sgE) * step(m.x, 0.0) * step(-0.07, m.x));
}
void sgTree(vec2 q) {
  bool crown = abs(q.x) < 1.35 + 0.2 * SG_WOOD && abs(q.y - 1.7 + 0.55 * SG_WOOD) < 1.0 + 0.5 * SG_WOOD;
  q += vec2((0.05 * sin(2.3 * q.y + 0.7) + 0.02 * sin(6.1 * q.y)) * sat(2.0 * q.y), 0.03 * sin(5.3 * q.x + 1.0));
  sgQ = q;
  sgOne = sgTwo = vec4(9.0);
  sgLeafy = sgStalk = 0.0;
  float trunk = 0.085 - 0.03 * q.y + 0.09 * exp(-5.0 * max(q.y, 0.0)) * (1.0 + 0.4 * sin(70.0 * q.x)), x = abs(q.x - 0.03 * q.y);
  sgBark = q.y > 0.95 ? vec3(9.0, 9.0, 0.0) : vec3(x - trunk, x, trunk);
  // boughs, branches, twigs
  for (float i = 0.0; i < 9.0 && crown; i++) {
    float bough = floor(i / 3.0), a = sgTurn + 2.24 * bough;
    vec3 dir = vec3(0.0, 1.0, 0.0);
    sgWay = vec2(cos(a), sin(a));
    vec3 at = sgOff(dir, vec3(0.03, 0.93, 0.0), 0.8, 0.66, 0.05);
    sgWay = rot(2.24 * i) * sgWay;
    at = sgOff(dir, at, i == 3.0 * bough ? 0.3 : 0.8, 0.5, 0.028);
    sgTwig(dir, at, 0.3, i);
    sgTwig(dir, at, 0.8, i + 9.0);
    sgTwig(dir, at, 0.8, i + 18.0);
  }
  for (int k = 0; k < 2 && crown; k++) {
    float r = length(sgOne.xy), a = atan(sgOne.y, sgOne.x + 1e-5) + sgOne.w * 1.7 + 0.1 * sin(uTime * 0.3 + sgOne.w), lit = (0.35 + 1.5 * band(sgOne.w / 27.0)) * (0.8 - 0.45 * sgOne.z);
    sgRing(r, a, 5.0, lit);
    sgRing(r, a + 0.5, 7.0, lit);
    sgRing(r, a + 1.0, 9.0, lit);
    sgOne = sgTwo;
  }
  float wide = max(sgBark.z, 0.6 * sgE), wood = sgIn(sgBark.y - wide) * mix(1.0, sgGlass(sgBark.y / wide), sat(sgBark.z / sgE - 1.0)) * min(1.0, 0.35 + sgBark.z / sgE);
  wood *= smoothstep(-0.04, 0.03, q.y) * mix(1.0, 0.5 + 0.9 * noise(vec2(q.x * 34.0 + sin(q.y * 5.0), q.y * 4.0)), smoothstep(0.04, 0.06, sgBark.z));
  wood = max(wood, sgStalk);
  sgAdd(sgTint[0], sgLv[0] * wood * 0.85);
  sgAdd(mix(sgTint[0], vec3(1.0, 0.97, 0.9), 0.35), sgLv[0] * sgLeafy * 0.8);
}
// More of them: rows going off.
float sgRow(inout vec2 q, float gap, float grow, float lit, int k) {
  float c = floor(q.x * grow / gap + 0.5);
  q *= grow;
  q.x -= c * gap;
  sgE *= grow;
  sgLv[k] *= lit;
  return c;
}
void sgWood(vec2 q) {
  if (uOwn[7] > 0.0) {
    vec3 was = vec3(sgTurn, sgE, sgLv[0]);
    vec2 f = q - vec2(1.0, 0.45);
    float gap = 2.6 / max(uOwn[7], 0.05);
    sgTurn = was.x + 2.0 + 1.7 * sgRow(f, gap, 1.5, 0.32 * sat(2.5 * uOwn[7]), 0);
    sgLv[0] *= sgDn(0.5 * gap, 0.5 * gap - 0.2, abs(f.x));
    sgTree(f);
    sgLv[0] = was.z;
    sgE = was.y;
    sgTurn = was.x + 1.3 * sgRow(q, gap, 1.0, 1.0, 0);
    sgLv[0] *= sgDn(0.5 * gap, 0.5 * gap - 0.2, abs(q.x));
    sgTree(q);
    sgTurn = was.x;
    sgLv[0] = was.z;
    return;
  }
  sgTree(q);
}
void sgFlorets(vec2 g, float v, float lamp, inout float flower) {
  vec2 c = floor(g), h = hash22(c), f = fract(g) - 0.5 - (h - 0.5) * 0.36;
  float r = length(f), soft = sgE * 26.0, petal = sgDn(soft, -soft, r - 0.32 - 0.16 * cos(4.0 * atan(f.y, f.x + 1e-4) + h.x * 6.0)) * sgDn(0.95, 0.85, abs(v) - 0.4 * h.x);
  flower = mix(flower, (0.3 + 0.7 * smoothstep(0.02, 0.22, r)) * (0.5 + 0.6 * h.y) * lamp, petal);
}
void sgLilac(vec2 q) {
  // the jar and its water
  float R = 0.1 - 0.026 * sgSpan(q.y, 0.2, 0.26, 0.06) - 0.03 * sgDn(0.03, 0.0, q.y), s = q.x / R, water = q.y - 0.16 + 0.018 * sqrt(max(1.0 - s * s, 0.0)), flower = 0.0;
  float best = sgIn(max(abs(q.x) - R, abs(q.y - 0.14) - 0.14)) * (0.12 + 0.9 * sgSq(min(s * s, 1.0)) + 0.6 * sgLine(water, 0.004 + sgE) + 0.15 * sgIn(water));
  vec4 head = vec4(0.0, 9.0, -9.0, 0.0);
  // seven stems; of the heads that cover this place, the nearest
  for (float k = 0.0; k < 7.0 && abs(q.x) < 0.6 && abs(q.y - 0.4) < 0.5; k++) {
    float a = k * 2.4 + 0.5 + sgTurn, reach = sin(a), y = sat((q.y - 0.02) / 0.4);
    best = max(best, 0.5 * sgIn(abs(q.x - reach * (0.24 * y * y - 0.04)) - 0.006) * step(0.02, q.y) * step(q.y, 0.45));
    vec2 ax = normalize(vec2(0.75 * reach + 0.02 * sin(uTime * 0.23 + k), 0.8)), m = q - vec2(0.12 * reach, 0.4 - 0.05 * cos(a) - 0.06 * abs(reach));
    float u = dot(m, ax) / (0.37 + 0.05 * sin(k * 4.1)), v = (m.x * ax.y - m.y * ax.x) / (0.1 * sqrt(sat((u + 0.07) * 4.0)) * sqrt(max(1.05 - u, 0.0)) + 0.004), near = cos(a) - 3.0 * step(1.0, abs(v));
    if (abs(v) < 1.3 && abs(u - 0.5) < 0.56 && near > head.z) head = vec4(u, v, near, k);
  }
  if (head.y < 2.0) { // small flowers over their own dark
    float phi = asin(clamp(head.y * 0.8, -0.99, 0.99)), lamp = (0.66 + 0.5 * sin(phi + 0.8)) * (0.8 + 0.25 * max(head.z, -1.0));
    vec2 g = vec2(phi + 2.0 * sgTurn, head.x * 4.8) * 1.5 + head.w * 5.3;
    flower = 0.2 * lamp * sgDn(1.0, 0.8, abs(head.y));
    best *= 0.4;
    sgFlorets(rot(0.4) * g * 1.15 + 3.7, head.y, 0.75 * lamp, flower);
    sgFlorets(g, head.y, lamp, flower);
  }
  sgAdd(sgTint[1], sgLv[1] * best * 0.8);
  sgAdd(mix(sgTint[1], vec3(1.0), 0.45), sgLv[1] * flower * 1.6);
}
float sgWires(float phi, float w) {
  float t = (phi + sgTurn) / TAU * 18.0, n = floor(t + 0.5);
  return sgIn(abs(t - n) * w - 0.0045) * (0.5 + 1.2 * band(mod(n, 18.0) / 17.0));
}
void sgCage(vec2 q) { // bars before and behind, hoops, a perch that swings
  float y = q.y, dome = sat((y - 0.48) / 0.28), tip = sqrt(1.0 - dome * dome), R = 0.27 * tip + 0.012, s = clamp(q.x / R, -1.0, 1.0), phi = asin(s);
  float w = TAU / 18.0 * R * max(cos(phi), 0.12) * inversesqrt(1.0 + sgSq(s * dome * 0.96 / max(tip, 0.12))), inside = sgIn(abs(q.x) - 0.272), bow = 0.018 * sqrt(max(1.0 - sgSq(q.x / 0.272), 0.0));
  float best = max(sgWires(phi, w), 0.42 * sgWires(PI - phi, w)) * step(abs(s), 0.999) * step(0.0, y) * step(y, 0.765);
  vec3 hoops = abs(abs(y - vec3(0.02, 0.3, 0.48)) - bow);
  best = max(best, 0.9 * inside * sgIn(min(min(hoops.x, hoops.y), hoops.z) - 0.005));
  vec2 m = rot((0.1 + 0.4 * uPhrase) * sin(uTime * 1.5)) * (q - vec2(0.0, 0.7));
  float swing = min(max(abs(abs(m.x) - 0.09 * sat(-m.y / 0.12)) - 0.003, max(m.y, -0.36 - m.y)), max(abs(m.x) - 0.115, abs(m.y + 0.36) - 0.009));
  float hook = max(y < 0.83 ? abs(length(q - vec2(0.0, 0.83)) - 0.022) - 0.005 : abs(q.x) - 0.004, uVar > 0.5 ? y - 0.83 : -9.0); // the wire it hangs by
  best = max(best, sgIn(min(min(length(q - vec2(0.0, 0.785)) - 0.024, hook), swing)));
  sgAdd(sgTint[3], sgLv[3] * best * 1.1);
}
void sgCages(vec2 q) {
  if (uOwn[7] < 0.0) for (float k = 1.0; k < 3.5; k++) {
    vec2 was = vec2(sgE, sgLv[3]), f = q + vec2(0.31 * k, 0.22 * k - 0.5);
    float h = hash11(sgRow(f, 0.95 / max(-uOwn[7], 0.05), 0.75 + 0.35 * k, (1.15 - 0.25 * k) * sat(-2.5 * uOwn[7]), 3) + 9.0 * k);
    f.y += (uVar > 0.5 ? 0.35 : 1.0) * (0.8 - 1.4 * h);
    sgTurn += 2.0 * h;
    sgCage(f);
    sgTurn -= 2.0 * h;
    sgE = was.x;
    sgLv[3] = was.y;
  }
  sgCage(q);
}
void sgLamp(vec2 q) {
  float l = sgLv[4], y = q.y, r = length(q - vec2(0.0, 0.47)) / 0.135, x = abs(q.x), R = max(max(0.105 - 1.4 * y, 0.02), 0.085 * sqrt(max(1.0 - sgSq((y - 0.25) / 0.06), 0.0)));
  float best = sgIn(x - R) * sgGlass(x / R) * step(0.0, y) * step(y, 0.355) + 0.15 * sgIn(max(x - 0.036, abs(y - 0.53) - 0.18));
  float globe = sgIn((r - 1.0) * 0.135) * sgIn(abs(y - 0.47) - 0.112) * (0.25 + 1.1 * sgLine(r, 0.7) + 0.5 * smoothstep(0.8, 1.0, r));
  float flame = sgLine(x, 0.016 - 0.012 * sat((y - 0.43) / 0.12)) * sgLine(y - 0.465, 0.05);
  sgAdd(sgTint[4], l * (best + globe) * 0.75);
  sgAdd(mix(sgTint[4], vec3(1.0, 0.8, 0.5), 0.5), l * (flame * 1.6 + l * (0.24 * sgLine(r, 2.0) + 0.12 * sgLine(r, 3.0 + 1.5 * uSpace))));
}
void sgPetals(vec2 q) { // one to a column
  float col = floor(q.x / 0.17), h = hash11(col + 40.0), a = 5.0 * q.y + 9.0 * h;
  vec2 m = vec2(q.x - (col + 0.5) * 0.17 - 0.04 * sin(a), (fract(q.y / 0.8 + fract(uTime * (0.05 + 0.03 * h)) + h * 9.7) - 0.5) * 0.8);
  float best = sgIn(length(rot(a) * m / vec2(1.0, 0.2 + 0.4 * abs(sin(2.0 * a)))) - 0.028) * sgSpan(q.y, -0.7, 0.9, 0.4) * step(abs(q.x), 1.4);
  sgAdd(sgTint[2], sgLv[2] * best * 0.9);
}

// ---- the solid set, all of it boxes
vec3 sgSlab(vec3 rd) { return 1.0 / (rd + (step(0.0, rd) - 0.5) * 2e-4); }
vec2 sgBox(vec3 ro, vec3 inv, vec3 half_) { // where a ray goes in and comes out
  vec3 n = -inv * ro, k = abs(inv) * half_, a = n - k, b = n + k;
  return vec2(max(max(a.x, a.y), a.z), min(min(b.x, b.y), b.z));
}
vec2 sgPast(vec3 q, vec3 inv, vec3 half_, float soft) { // the light it lets by, the room it leaves
  vec2 b = sgBox(q, inv, half_);
  return 1.0 - vec2(sat((b.y - max(b.x, 0.0)) / soft), 0.55 / sgSq(1.0 + 0.18 / soft * length(max(abs(q) - half_, 0.0))));
}
#define SG_V(i) vec3(sgB[i], sgB[i + 1], sgB[i + 2])
#define SG_ALL(F) F(0) F(1) F(2) F(3) F(4) F(5) F(6) F(7) F(8) F(9) F(10)
// The wall: along it, and up.
vec3 sgPaper(vec2 at) {
  float y = at.y, e = sgE, x = fract(at.x / 0.78) - 0.5, s = abs(fract(at.x / 0.36) - 0.5) - 0.25;
  vec2 b = abs(vec2(x * 0.78, y - 0.52)) - vec2(0.31, 0.25);
  float w = 1.0 + sgLine(max(b.x, b.y) - 0.01, 0.016 + e) * (0.65 * (b.x > b.y ? sign(x) : sign(0.52 - y)) - 0.15);
  w *= 1.0 + 0.9 * sgLine(y - 0.965, 0.016 + e) - 0.6 * sgLine(y - 0.915, 0.02 + e);
  float c = (1.0 - 0.17 * sat(0.5 + s / (0.01 + e * 3.0))) * (1.0 - 0.3 * sgLine(s, 0.012 + e * 2.0)) * (1.0 - 0.3 * smoothstep(2.2, 4.0, y) - 0.5 * sgLine(y - 2.9, 0.018 + e) + 0.4 * sgLine(y - 2.94, 0.015 + e));
  return sgDye * (y < 1.0 ? w * vec3(0.5, 0.39, 0.29) : vec3(c));
}
// b's glass: its foot, along it, out of it; up from the pit's bed; a seat in the house.
#define SG_A (1.0708 + 0.24 * uOwn[6])
#define SG_D (uOwn[6] == 0.0 ? vec2(0.4794, 0.8776) : vec2(cos(SG_A), sin(SG_A)))
#define SG_OUT (uOwn[6] == 0.0 ? vec2(0.8776, -0.4794) : vec2(sin(SG_A), -cos(SG_A)))
#define SG_BED (uOwn[6] == 0.0 ? vec2(0.8415, 0.5403) : vec2(sin(2.0 * SG_A), -cos(2.0 * SG_A)))
const vec2 SG_LIP = vec2(-0.12, 0.02), SG_EYE = vec2(1.75, 0.3);
vec3 sgBulb(vec3 v, vec3 n, float bright) { float d2 = dot(v, v) + 1e-4; return vec3(1.0, 0.93, 0.78) * bright * sat(0.1 + dot(n, v) * inversesqrt(d2)) / (d2 + 0.02); }
vec3 sgRoom(vec3 ro, vec3 rd, bool under, float power) {
  vec3 inv = sgSlab(rd), n = vec3(0, 0, -1), alb, at = vec3(0.0), size = vec3(1.0);
  float t = ((under ? 0.52 : 3.0 + 45.0 * SG_OPEN) - ro.z) * inv.z, tx = ((rd.x > 0.0 ? 2.75 + 41.0 * SG_OPEN : -2.6 - 39.0 * SG_OPEN) - ro.x) * inv.x, ty = -ro.y * inv.y, tb = -dot(ro.xy - SG_LIP, SG_BED) / dot(rd.xy, SG_BED);
  if (!under && tx < t) { t = tx; n = vec3(-sign(rd.x), 0, 0); }
  if (!under && rd.y < 0.0 && ty < t) { t = ty; n = vec3(0, 1, 0); }
  int id = -1;
#define SG_HIT(i) { vec2 b = sgBox(ro - SG_V(6 * i), inv, SG_V(6 * i + 3)); if (b.x < b.y && b.x > 0.0 && b.x < t) { t = b.x; id = i; at = SG_V(6 * i); size = SG_V(6 * i + 3); } }
  SG_ALL(SG_HIT)
  vec3 pos = ro + rd * tb, rim = vec3(9.0), box = vec3(9.0);
  float run = dot(pos.xy - SG_LIP, vec2(SG_BED.y, -SG_BED.x));
  if (under && tb > 0.0 && tb < t && run > 0.0 && run < 0.75 && abs(pos.z - 0.12) < 0.4) { t = tb; n = vec3(SG_BED, 0); id = 20; }
  pos = ro + rd * t;
  if (id >= 0 && id < 20) {
    box = pos - at;
    vec3 a = abs(box / size);
    n = sign(box) * (a.x > max(a.y, a.z) ? vec3(1, 0, 0) : a.y > a.z ? vec3(0, 1, 0) : vec3(0, 0, 1));
    rim = size - abs(box) + abs(n) * 9.0;
  }
  vec3 key = under ? vec3(-0.62, 0.78, -0.35) - pos : sgL, from = pos + n * 0.002;
  float kd = dot(key, key), soft = under ? 0.02 : 0.07, ew = t * sgPx * (under ? 0.5 : 0.9);
  key *= inversesqrt(kd);
  inv = sgSlab(key);
  vec2 sh = vec2(1.0);
#define SG_SHADE(i) if (i != id) sh *= sgPast(from - SG_V(6 * i), inv, SG_V(6 * i + 3), soft);
  SG_ALL(SG_SHADE)
  sgE = ew / max(abs(dot(n, rd)), under ? 0.5 : 0.12);
  bool boards = !under && id < 0 && n.y > 0.5, wood = id >= 0 && id < 20 && !(under && id == 4);
  float plank = floor(pos.x / 0.21);
  vec3 q = under ? pos * 6.0 : box;
  q = abs(n.y) > 0.5 ? q.zxy : under && id == 0 ? q.yxz : q;
  float grain = noise(boards ? vec2(pos.x * 60.0, pos.z * 2.2 + plank * 5.3) : wood ? vec2((q.x + q.z) * 42.0, q.y * 2.5) + 2.0 * sin(q.y * 1.7 + q.x * 3.0) : pos.xy * vec2(2.0, 1.1));
  alb = sgPaper(under ? vec2(pos.x, pos.y - 0.02) * 4.6 + vec2(20.0, 0.0) : vec2((n.z < -0.5 ? pos.x : pos.z) + 30.0, pos.y)) * (0.84 + 0.32 * grain);
  if (boards) alb = mix(vec3(0.19, 0.13, 0.08), vec3(0.4, 0.31, 0.21), 0.5 * fract(plank * 0.618) + 0.5 * grain) * (1.0 - 0.75 * sgLine((0.5 - abs(fract(pos.x / 0.21) - 0.5)) * 0.21, 0.004 + ew));
  if (wood) alb = mix(vec3(0.05, 0.022, 0.012), vec3(0.27, 0.13, 0.06), 0.24 + 0.6 * grain) * (under ? id == 1 || id > 7 ? 0.5 : 1.15 : id < 5 ? 1.0 : 0.7) * (1.0 + (under ? 0.3 : 1.1) * sgLine(min(min(rim.x, rim.y), rim.z), 0.008 + 0.7 * sgE));
  if (!under) {
    float out_ = sat(3.0 * SG_OPEN);
    vec3 far = vec3(0.0);
    if (uOwn[6] > 0.0 && id < 0) { // country
      far = sgSun * 0.26 * exp(-7.0 * max(rd.y, 0.0)) + sgSky * (0.2 + 0.25 * max(rd.y, 0.0));
      if (n.y > 0.5) {
        float near_ = exp(-0.16 * t), drift = noise(pos.xz * vec2(0.8, 1.7) + 3.0), blade = noise(pos.xz * vec2(34.0, 9.0));
        vec3 g = sgBy(vec3(0.7, 0.75, 0.82), vec3(0.45, 0.33, 0.2), vec3(0.1, 0.17, 0.06), uOwn[1]) * (0.75 + 0.5 * drift);
        alb = mix(alb, g * (1.0 + (0.5 + max(uOwn[1], 0.0)) * (blade - 0.5) * near_), out_);
        far *= 1.0 - exp(-0.045 * t);
        alb *= mix(1.0, exp(-0.045 * t), out_);
      } else {
        float az = rd.x / (rd.z + 0.6), h1 = 0.2 * noise(vec2(az * 3.0, 2.0)) + 0.02 * noise(vec2(az * 14.0, 5.0)), h2 = 0.09 * noise(vec2(az * 5.0 + 7.0, 4.0)) + 0.012 * noise(vec2(az * 60.0, 5.0));
        float y = rd.y, soft = 1.5 * sgPx;
        far *= 0.8 + 0.5 * smoothstep(0.3, 0.8, noise(vec2(az * 2.2 + 0.02 * uTime, rd.y * 13.0))) * sat(rd.y * 5.0);
        far += step(uOwn[0], 0.0) * -uOwn[0] * vec3(0.8, 0.9, 1.0) * sgDn(0.09, 0.03, length(fract(rd.xy / rd.z * 24.0) - 0.5 - 0.35 * (hash22(floor(rd.xy / rd.z * 24.0)) - 0.5))) * step(0.86, hash21(floor(rd.xy / rd.z * 24.0) + 5.0));
        far = mix(far, sgSky * 0.17 + sgSun * 0.07, sgDn(soft, -soft, y - h1));
        far = mix(far, sgSky * 0.09 + sgSun * 0.04, sgDn(soft, -soft, y - h2));
        alb *= 1.0 - out_;
      }
      far *= out_;
    }
    if (uOwn[6] < 0.0 && id < 0) alb *= mix(1.0, boards ? 0.75 : 0.12 + 0.5 * sgSq(0.5 + 0.5 * sin((pos.x + pos.z) * 15.0 + 2.0 * sin(pos.x * 3.1 + 0.4 * pos.y))), SG_BARE);
    if (id == 7 && n.z < -0.5) alb = mix(alb, vec3(0.6, 0.53, 0.38) * (1.0 - 1.5 * length(box.xy)), sgIn(length(box.xy) - 0.21));
    vec3 v = vec3(-2.5, 1.75, 0.1) - pos;
    float d2 = dot(v, v), open_ = 0.1 + sat(0.25 + 0.75 * dot(n, v) * inversesqrt(d2)) * 5.2 / (d2 + 3.2);
    open_ *= 1.0 - 0.4 * (abs(n.z) < 0.5 ? sgLine(3.0 - pos.z, 0.6) : sgLine(pos.y, 0.4));
    // sun past leaves
    float k = (pos.x + 2.6) / max(-sgL.x, 0.05), blur = 0.02 + 0.02 * k * (1.6 - 1.2 * uTone);
    vec2 w = (pos + sgL * k).zy - vec2(-0.75, 0.35), bars = (0.5 - abs(fract(w / 0.85) - 0.5)) * 0.85;
    float beam = sgSpan(w.x, 0.0, 1.7, 2.0 * blur) * sgSpan(w.y, 0.0, 2.55, 2.0 * blur) * (1.0 - 0.85 * sgLine(min(bars.x, bars.y), 0.035 + 0.5 * blur)) * (0.35 + 0.65 * smoothstep(0.18, 0.48, noise(w * 2.3 + 0.12 * sin(uTime * vec2(0.21, 0.17)) + 4.0)));
    beam = mix(beam, 0.7, out_);
    if (uOwn[6] < 0.0) {
      beam = mix(beam, 1.4 * sgLine(length(pos.xz - vec2(-0.1, 1.2)), 1.3) * step(0.5, n.y), SG_BARE);
      open_ *= 1.0 - 0.75 * SG_BARE;
    }
    open_ = mix(open_, 0.75 + 0.2 * n.y, out_);
    return far + (alb + max(n.y, 0.0) * 0.02) * (sgSun * 2.1 * beam * sat(dot(n, sgL) + 0.02 + 0.6 * SG_BARE) * sh.x + (sgSky * open_ + sgSun * 0.2 * sgLine(length(pos - vec3(-0.9, 0.6, 2.2)), 1.3)) * sh.y) + sgSky * beam * max(n.x - 9.0 * abs(pos.x + 2.6), 0.0);
  }
  vec3 plush = mix(vec3(0.028, 0.022, 0.03), sgDye * 0.16, abs(uOwn[4]));
  bool pit = id == 20 || (dot(pos.xy - SG_LIP, SG_BED) > 0.0 && pos.y < 0.04 && pos.x < 0.63);
  if (id == 20) alb = plush;
  else if (id < 0 && pit) alb = plush * (0.25 + 1.2 * sgSq(0.5 + 0.5 * sin(pos.x * 78.0 + 2.2 * sin(pos.x * 23.0 + pos.y * 3.0)))); // velvet
  else if (id < 0 && pos.x < 0.4 && pos.y < 0.0) { // brick under the stage
    vec2 b = pos.xy * vec2(17.0, 38.0);
    b.x += 0.5 * mod(floor(b.y), 2.0);
    vec2 f = abs(fract(b) - 0.5);
    alb = vec3(0.17, 0.095, 0.065) * (0.6 + 0.7 * hash21(floor(b))) * (1.0 - 0.6 * max(smoothstep(0.44, 0.5, f.x), smoothstep(0.4, 0.5, f.y)));
  } else if (id < 0 && pos.x < -0.12) alb = vec3(0.05);
  else if (id < 0) { // the house: tiers with small lights
    float tier = fract(pos.y * 4.2 + 0.5 * pos.x * pos.x), arch = abs(fract(pos.x * 4.0) - 0.5);
    alb = (plush + vec3(0.06, 0.025, 0.01)) * (tier < 0.38 ? 1.0 : 0.15) + vec3(0.9, 0.45, 0.14) * sgLine(length(vec2(tier - 0.6, 0.5 - arch)), 0.12);
  }
  float on = sgDn(-0.06, -0.22, pos.x - 0.6 * pos.y) * step(0.0, pos.y);
  return alb * (sgSun * (0.9 * sat(dot(n, key)) * sh.x + 0.16 * sh.y) * on * 0.6 / (0.25 + kd) + sgSky * 0.05 * sh.y
    + sgBulb(vec3(0.5, -0.23, 0.05) - pos, n, power * (pit ? 0.24 : 0.024)) + vec3(1.0, 0.67, 0.4) * sgBulb(vec3(-0.48, -0.19, 0.05) - pos, n, pit || pos.y > 0.02 ? 0.0 : 0.11));
}

void sgKind(int k, float loud, float base) {
  vec3 c = uKind[k];
  sgLv[k] = (base + (1.0 - base) * max(loud * (1.6 - 0.6 * loud), 0.45 * uCue)) * (0.62 + 0.85 * uEnergy) * (1.0 + 0.35 * uCue);
  sgTint[k] = mix(sgPale, c / max(max(c.r, max(c.g, c.b)), 0.05), 0.42 - 0.2 * abs(uOwn[5]));
}
vec3 sgRay(int k, vec3 at, float up, vec4 seen) { // a ghost's light, up to the glass and on to the seat
  float away = SG_EYE.x - at.x;
  vec2 z = (seen.yw - (at.y + up * at.z - SG_EYE.y) / away) * away / (max(0.75 * up, 0.4) * at.z), z2 = z * z, r = vec2(0.15, 0.07) / (1.0 + z2 * z2 * (1.0 + z2)) * smoothstep(-0.03, 0.05, seen.xz - at.x);
  return sgTint[k] * sgLv[k] * (r.x + r.y);
}
float sgGlints(float s) { return 2.0 * uKeys * pow(0.5 + 0.5 * sin(s * 70.0 + 3.0 * sin(s * 13.0 - uTime * 0.4)), 14.0); }
vec3 sgPrint(vec3 c, vec2 p) { return screenOf(c * (1.9 - 0.55 * smoothstep(0.45, 1.1, length(p * vec2(0.85, 1.15))))); }

vec3 render(vec2 p) {
  bool under = uVar > 0.5;
  sgPx = 1.0 / uRes.y;
  float hour = uOwn[0], leaf = uOwn[1], stand = uOwn[3], lamps = uOwn[5], power = 0.3 + 0.5 * uLevel + 0.5 * uCue + 0.45 * uHits, dim = mix(1.0, 0.3, uCue * (2.0 - uCue)) * (1.0 + 0.55 * min(lamps, 0.0)), base = under ? 0.2 : 0.0;
  vec3 air = sgBy(vec3(0.75, 0.95, 1.2), vec3(1.0), vec3(0.92, 1.06, 0.7), leaf) * mix(vec3(1.0), vec3(1.1, 0.85, 0.6), max(lamps, 0.0)), cold = vec3(0.7, 0.88, 1.0);
  sgSun = air * sgBy(vec3(0.2, 0.27, 0.42), vec3(1.0, 0.77, 0.46), vec3(1.3, 1.2, 1.04), hour);
  sgSky = air * sgBy(vec3(0.11, 0.17, 0.3), vec3(0.66, 0.66, 0.6), vec3(1.35, 1.42, 1.5), hour);
  sgL = normalize(vec3(-0.5, sgBy(0.2, 0.15, 0.36, hour) + 0.02 * sin(uTime * 0.02), -0.86));
  sgDye = sgBy(vec3(0.1, 0.15, 0.11), vec3(0.47, 0.41, 0.27), vec3(0.66, 0.4, 0.34), uOwn[4]);
  sgPale = air * sgBy(vec3(0.4, 0.75, 1.0), vec3(0.88, 0.95, 1.0), vec3(1.0, 0.75, 0.42), lamps);
  sgKind(0, uDrone, base);
  sgKind(1, max(uPad, 0.7 * uMic), under ? base : 0.09 + 0.04 * sin(uTime * 0.35));
  sgKind(2, uTexture, base);
  sgKind(3, uPhrase, base);
  sgKind(4, uHits, max(base, 0.07));
  sgFill = sgBy(0.02, 0.38, 0.8, lamps);
  sgLeaf = sgBy(0.0, 1.0, 1.9, leaf);
  sgTurn = 0.45 * sin(TAU * uLoop) + 0.6 * sin(uTime * 0.021);
  sgLight = vec3(0.0);
  sgVeil = 0.0;
  // where we stand, ghosts and set
  vec2 w = p, v;
  float rise = 0.0, solid = 1.0, side = 0.0, edge = p.x + 0.79 - 0.09 * p.y, seam = p.x - 0.475 - 0.05 * p.y, grow = min(exp2(0.5 * uOwn[2]), under ? 1.22 : 2.0);
  vec3 ro, rd, at[5];
  if (under) {
    float zoom = sgBy(0.72, 1.0, 1.28, stand);
    w = p * zoom + vec2(-0.1, 0.06) * min(stand, 0.0);
    sgPx *= zoom;
    ro = vec3(0.15 + 0.02 * sin(uTime * 0.04), 0.17 + 0.12 * stand, -1.9);
    rd = normalize(vec3(w, 0.0) - ro);
    side = dot(w - SG_LIP, SG_OUT);
    solid = sat(side / sgPx + 0.5) * sat(dot(w - SG_LIP, SG_BED) / sgPx + 0.5);
    v = side > 0.0 ? w - 2.0 * side * SG_OUT : w; // solid in the pit, and on the stage as the glass lays them
    at = vec3[5](vec3(-0.655, 0.02, 0.19), vec3(-0.365, 0.145, 0.24), vec3(-0.45, 0.25, 0.16), vec3(-0.51, 0.19, 0.19), vec3(-0.255, 0.145, 0.17));
    sgB = float[66](-.96, -.015, .1, .84, .035, .4, .65, -.28, .1, .03, .32, .4, 1.4, -.2, .1, .75, .03, .4, -.86, .4, .1, .012, .4, .4, -.55, .32, .5, .32, .31, .01, -.35, .135, .05, .14, .009, .1, -.46, .07, .05, .008, .06, .08, -.24, .07, .05, .008, .06, .08, -.3, -.3, .1, .018, .26, .3, -.66, -.3, .1, .018, .26, .3, -.86, -.085, 0.0, .7, .015, .02);
  } else {
    rise = sgBy(0.0, 0.06, 0.13, stand);
    ro = vec3(0.08 * sin(uTime * 0.03), sgBy(0.85, 1.35, 2.1, stand), sgBy(-1.75, -2.3, -3.1, stand));
    rd = normalize(vec3(p.x, p.y - rise, 1.15));
    v = p + vec2(0.0, 0.007) * sat(seam / sgPx + 0.5);
    at = vec3[5](vec3(-1.28, 0, 1.7), vec3(0, 0.75, 1.1), vec3(0, 1.5, 1), vec3(0.78, 1.72, 1.4), vec3(1.72, 0.48, 0.4));
    sgB = float[66](0.0, .71, 1.1, .66, .04, .42, -.56, .32, .8, .035, .32, .035, .56, .32, .8, .035, .32, .035, -.56, .32, 1.4, .035, .32, .035, .56, .32, 1.4, .035, .32, .035, 1.38, .24, 2.75, .31, .24, .2, 1.38, 1.0, 2.8, .22, .6, .16, 1.38, 1.96, 2.75, .28, .36, .2, 1.8, .45, .4, .27, .03, .26, 2.04, .95, .4, .03, .55, .26, 1.6, .21, .2, .025, .21, .025);
    if (uOwn[6] < 0.0) { // the furniture goes down
#define SG_SINK(i) sgB[6 * i + 1] -= 4.0 * SG_BARE;
      SG_ALL(SG_SINK)
      at[1].y = max(at[1].y - 4.0 * SG_BARE, 0.0);
      at[4].y = max(at[4].y - 4.0 * SG_BARE, 0.0);
    }
  }
  vec3 col = sgRoom(ro, rd, under, power) * mix(1.0, dim, under ? sgDn(0.0, -0.2, w.x) : 1.0);
#define SG_GHOST(k, ghost) if (!under) at[k] = vec3((at[k].xy - ro.xy) * 1.15, k == 1 ? 1.55 : 1.15) / (at[k].z - ro.z) + vec3(0, rise, 0); at[k].z *= grow; sgE = sgPx / at[k].z; ghost((v - at[k].xy) / at[k].z);
  SG_GHOST(0, sgWood)
  SG_GHOST(1, sgLilac)
  SG_GHOST(2, sgPetals)
  SG_GHOST(3, sgCages)
  SG_GHOST(4, sgLamp)
  if (!under) {
    float in_ = sat(edge / sgPx + 0.5), sheen = p.x * 0.9 - p.y * 0.42 + 0.5 * sin(uTravel * 0.04), fine = 0.8 * sgPx + 0.0005;
    col = col * (1.0 - 0.55 * sat(sgVeil) * in_) + sgLight * in_;
    col = mix(col, cold * 0.3, in_ * 0.05 * (0.7 + uLevel) * sgLine(sheen, 0.2));
    col = mix(col, cold * (0.55 + 0.5 * uLevel), (sgLine(seam, fine) + 0.6 * sgLine(edge, fine)) * (0.45 + 0.3 * sin(p.y * 7.0 + 2.0 * sheen)));
    return sgPrint(col + cold * sgGlints(p.y + edge) * (sgLine(seam, 0.01) + sgLine(edge, 0.01)), p);
  }
  float smoke = (0.5 + 0.5 * noise(w * 5.0 + 0.3 * sin(uTime * vec2(0.05, 0.04)))) * (0.8 + 0.6 * uSpace);
  vec4 seen = vec4(w - 2.0 * side * SG_OUT, w);
  seen.yw = (seen.yw - SG_EYE.y) / max(SG_EYE.x - seen.xz, 0.05);
  vec3 ray = sgRay(0, at[0], 1.3, seen) + sgRay(1, at[1], 0.5, seen) + sgRay(2, at[2], 0.2, seen) + sgRay(3, at[3], 0.35, seen) + sgRay(4, at[4], 0.45, seen) * (1.0 + 1.6 * uHits);
  col = col * (1.0 - sat(sgVeil) * mix(0.3, 0.9, solid)) + sgLight * max(0.42 * step(side, 0.0) * step(-0.02, w.y), solid) * sgDn(0.66, 0.6, w.x) + ray * solid * smoke;
  // the lamps
  float r = length(vec2(w.x - 0.525, abs(w.y + 0.2375) - 0.1625)), small = length(w - vec2(-0.48, -0.19));
  col += vec3(1.0, 0.92, 0.76) * power * (2.0 * sgLine(r, 0.0105) + 0.25 * sgLine(r, 0.045));
  col += vec3(1.0, 0.6, 0.22) * (sgLine(small, 0.012) + 0.1 * sgLine(small, 0.08));
  // the glass, nearly on edge
  float turn = dot(rd.xy, SG_OUT), fine = 0.004 + 11.0 * sgPx;
  vec3 q = ro - rd * dot(ro.xy - SG_LIP, SG_OUT) / (turn + (turn < 0.0 ? -1e-4 : 1e-4));
  float s = dot(q.xy - SG_LIP, SG_D), sweep = sin(s * 9.0 - q.z * 5.0 + uTravel * 0.12);
  col += cold * smoothstep(0.0, 0.004, s) * step(-1.0, q.z) * (sgSpan(q.z, -0.28, 0.5, 2.0 * fine) * (0.05 + 0.03 * sweep + 0.1 * uLevel * sgLine(s - 0.3, 0.2)) + (0.7 + sgGlints(s)) * sgLine(q.z + 0.28, fine) + 0.2 * sgLine(q.z - 0.5, fine));
  return sgPrint(col, p);
}
