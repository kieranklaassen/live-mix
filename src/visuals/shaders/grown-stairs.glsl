// name: Grown stairs
// a: Colour city
// b: Salt windows
// what: A crystal of metal seen so near that it is a town: hollow blocks stepping down at right angles, a dusty skin of straw, rose and slate on every terrace, one deep square well lit from within and a window at the left; or cubes of salt on a pale plate, stepped like nested window frames, the sun through them drawing bright lines.
// follows: A drone deepens the hollows; a pad slides the colours, or widens the sun; texture rules fine steps, or frosts the salt; a phrase runs a light round the well, or brightens the lines; bands lift blocks; the piece tints each place; a hit rings one block's rims outward; a cue moves the sun; keys glint on corners; with the loop one ring grows and draws back.
// own: 0 bare silver metal, and rose salt, at -1, deep peacock metal, and blue salt, at 1; 1 a blue night with the wells glowing at -1, pale even day in the town, and a black slate under the salt, at 1; 2 few broad terraces at -1, many fine ones at 1; 3 shallow as a tray at -1, deep as shafts at 1; 4 straight down like a plan at -1, low across the tops at 1; 5 one block alone on low ground, and one cube alone, at -1, towers, and bigger cubes, at 1; 6 far off from another side at -1, close in and from another side at 1; 7 growth in the texture's colour (snow, moss) lying on the ledges at -1, water standing in the wells, the cubes of salt stacked into a tower, at 1
#define GS_FAR max(-uOwn[6], 0.0)
#define GS_IN max(uOwn[6], 0.0)
#define GS_COVER max(-uOwn[7], 0.0)
#define GS_WET max(uOwn[7], 0.0)
// Set once a frame: step width, step depth, growth, what a pixel covers, night, pale day, the light
float gsW, gsS, gsG, gsPx, gsNgt, gsDay;
float gsLow, gsTall;
vec3 gsL, gsAside, gsSun, gsAmb, gsWhite, gsSaltTint;
bool gsB;
// What a ray met: distance, block, face axis and side, level, 0 ledge or 1 wall, the local place, local normal, edge and corner distances
float gsT, gsSg, gsK, gsE, gsC, gsHit, gsLine, gsLineT;
int gsId, gsAx;
vec3 gsQ, gsN;
vec2 gsA;
float gsSeed, gsBw, gsBs, gsGr; vec4 gsF;
const int gsMax = 9;
const vec4 gsCity[13] = vec4[13](   // middle, half sizes; those that throw shade first
 vec4(-2.3, -1.25, 0.8, 1.0), vec4(-2.55, 1.3, 1.1, 1.25), vec4(-1.1, 1.75, 0.5, 0.45), vec4(0.25, 2.75, 1.3, 1.0), vec4(0.0, 0.0, 1.62, 1.45),
 vec4(1.45, 1.35, 0.42, 0.5), vec4(2.62, 1.5, 1.1, 1.35), vec4(-0.98, 0.62, 0.21, 0.24), vec4(1.32, -1.2, 0.3, 0.24),
 vec4(-0.55, -2.35, 1.2, 0.75), vec4(1.5, -2.5, 0.62, 0.7), vec4(2.5, -1.0, 0.9, 0.8), vec4(3.1, 4.2, 1.5, 1.2));
const vec2 gsTop[13] = vec2[13](   // how high, how much higher among towers
 vec2(1.20, 0.00), vec2(1.95, 0.68), vec2(1.45, 1.01), vec2(2.10, 1.58), vec2(1.00, 0.00), vec2(1.30, 1.17), vec2(1.35, 0.68), vec2(0.66, 0.19), vec2(1.30, 0.26), vec2(0.50, 0.00), vec2(0.80, 0.00), vec2(0.62, 0.09), vec2(1.80, 1.08));
const int gsWell = 4;
// Cubes of salt: middle, half size; and their turn
const vec3 gsSalt[5] = vec3[5](vec3(-0.6, 0.5, 1.0), vec3(0.5, -0.35, 0.56), vec3(-1.5, -0.95, 0.36), vec3(2.0, 1.0, 0.46), vec3(1.55, -1.15, 0.2));
const vec2 gsRot[5] = vec2[5](vec2(0.4085, 0.9128), vec2(0.4085, 0.9128), vec2(0.7317, 0.6816), vec2(0.9801, 0.1987), vec2(0.6216, 0.7833));
vec3 gsTo(vec3 p, int ax) { return ax == 1 ? p.xzy : ax == 0 ? p.zyx : p; }
vec3 gsTurn(vec3 p, vec2 a) { return vec3(a.x * p.x - a.y * p.z, p.y, a.y * p.x + a.x * p.z); }
float gsDn(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
float gsV(float x) { return 1.0 / (1.0 + x * x); }
float gsDepth(float k) { return gsBs * (k + 0.4 * (fract(k * 0.381 + gsSeed) - fract(gsSeed))); }
// The opening in terrace k: low corner and high corner.
vec4 gsRect(float k) {
 vec4 r = vec4(-gsA, gsA) + gsBw * (0.4 + k + 0.42 * fract(k * 0.618 + gsSeed)) * gsF;
 if (abs(k - 2.0) < 0.5) r.xw += gsGr * gsBw * vec2(0.62, -0.62);
 return r;
}
float gsRectIn(vec2 q, vec4 r) { vec2 e = min(q - r.xy, r.zw - q); return min(e.x, e.y); }
// The stairs' numbers for one face of a block.
void gsFace(vec3 a, int id, int ax) {
 bool well = id == gsWell && !gsB;
 gsA = gsTo(a, ax).xy; gsSeed = fract(float(id) * 0.377 + float(ax) * 0.21 + 0.13);
 gsF = (0.78 + 0.44 * fract(gsSeed * vec4(3.1, 5.7, 7.3, 9.9) + 0.2)) * vec4(1.0, 1.0, -1.0, -1.0);
 gsBw = gsW * (well ? 1.15 : 0.8 + 0.35 * fract(gsSeed * 7.0)) * (gsB ? 0.3 + 0.75 * a.x : min(1.0, 0.35 + 0.85 * min(a.x, a.z)));
 gsBs = gsS * gsBw / gsW * (well ? 1.35 : 1.0);
 if (ax != 1 && !gsB) { gsBw *= 1.5; gsBs *= 0.45; }
 gsGr = (ax == 1 && (gsB ? id < 3 : well || id == gsWell + 1 || id == 1)) ? gsG : 0.0;
}
// Down the stairs of one hollow face; the third axis points out of it.
void gsPit(vec3 o, vec3 d, int id, int ax, float sg) {
 float t = -o.z / d.z, k = 0.0, edge = 1e9, cor = 1e9, wall = 0.0;
 vec2 q = o.xy + d.xy * t, inv = 1.0 / d.xy;
 vec3 n = vec3(0.0, 0.0, 1.0); vec4 r0 = vec4(-gsA, gsA);
 for (int i = 0; i < gsMax; i++) {
  k = float(i);
  cor = gsRectIn(q, r0);
  vec4 r = gsRect(k);
  if (i == gsMax - 1 || min(r.z - r.x, r.w - r.y) < 0.03) break;
  float in_ = gsRectIn(q, r);
  if (in_ < 0.0) { edge = -in_; if (i == 0) { edge = min(edge, cor); cor = 1e9; } break; }
  float ln = 1.0 - in_ / (gsPx * t * 1.3);
  if (ln > gsLine) { gsLine = ln; gsLineT = t; }
  vec2 tw = (mix(r.xy, r.zw, step(0.0, d.xy)) - o.xy) * inv;
  float zn = -gsDepth(k + 1.0), tp = (zn - o.z) / d.z, te = min(tw.x, tw.y);
  if (te < tp) {
   t = te; q = o.xy + d.xy * t;
   bool x = tw.x < tw.y;
   n = x ? vec3(-sign(d.x), 0.0, 0.0) : vec3(0.0, -sign(d.y), 0.0);
   float z = o.z + d.z * t;
   edge = -gsDepth(k) - z;
   vec2 s = min(q - r.xy, r.zw - q);
   cor = min(z - zn, x ? s.y : s.x); wall = 1.0;
   break;
  }
  t = tp; q = o.xy + d.xy * t; r0 = r;
 }
 if (t < gsT) { gsT = t; gsK = k; gsE = edge; gsC = cor; gsHit = wall; gsQ = vec3(q, o.z + d.z * t); gsN = n; gsId = id; gsAx = ax; gsSg = sg; }
}
// How much light comes over the terraces into a hollow.
float gsClimb(vec3 q, vec3 l, float k) {
 float a = 1.0;
 vec2 up = step(0.0, l.xy), iv = 1.0 / (l.xy + 2e-4 * (up - 0.5));
 for (int i = 0; i < gsMax; i++) {
  if (k < -0.5) break;
  vec4 e = gsRect(k);
  vec2 tw = (mix(e.xy, e.zw, up) - q.xy) * iv;
  float t = max(min(tw.x, tw.y), 0.0);
  a = min(a, (q.z + gsDepth(k) + l.z * t) / (t + 0.04));
  k -= 1.0;
 }
 return smoothstep(-0.14, 0.14, a);
}
// The skin of oxide: straw, rose, violet, slate; bare metal or peacock in other worlds.
vec3 gsFilm(float t) {
 const vec3 c[4] = vec3[4](vec3(0.80, 0.58, 0.24), vec3(0.62, 0.24, 0.19), vec3(0.25, 0.16, 0.28), vec3(0.15, 0.26, 0.31));
 float f = fract(t) * 4.0, g = fract(f); int i = int(f) % 4, j = (i + 1) % 4; g = g * g * (3.0 - 2.0 * g);
 vec3 x = mix(c[i], c[j], g);
 x = max(x + (x - vec3(0.3, 0.33, 0.3)) * vec3(1.5, 1.7, 1.3) * max(uOwn[0], 0.0), 0.02);
 return mix(x, vec3(0.56, 0.55, 0.53) * (0.7 + 0.4 * x.r), 0.95 * max(-uOwn[0], 0.0));
}
// The room as the metal sees it: a wide window at the left.
vec3 gsRoom(vec3 r) {
 vec2 w = vec2(dot(r, gsAside), r.y - gsL.y);
 float win = gsDn(0.45, 0.75, abs(w.x)) * gsDn(0.25, 0.45, abs(w.y)) * smoothstep(-0.1, 0.35, dot(r.xz, gsL.xz));
 vec3 c = mix(vec3(0.05, 0.04, 0.035), vec3(0.13, 0.145, 0.17), smoothstep(-0.2, 1.0, r.y)) + win * vec3(3.2, 3.0, 2.6);
 c = mix(c, vec3(0.02, 0.025, 0.05) + win * vec3(0.4, 0.55, 0.85), gsNgt);
 return mix(c, vec3(0.75, 0.77, 0.8) + 0.6 * win, gsDay * 0.8);
}
// A cube of salt: its middle and its half size.
vec3 gsMid(int i) {
 float n = i == 0 ? 1.0 : 1.0 - max(-uOwn[5], 0.0) + 0.45 * gsTall * fract(float(i) * 0.618);
 return vec3(gsSalt[i].xy * (1.0 + 0.12 * gsTall), (gsSalt[i].z + (i == 0 ? 0.0 : 0.05 * uBands[i * 3])) * n + 0.001);
}
// Its middle in the room: on the plate, or one on another.
vec3 gsCen(int i, vec3 m) {
 vec3 c = m.xzy;
 if (GS_WET > 0.0) {
  float y = i == 0 ? 0.0 : i == 1 ? 2.0 : i == 3 ? 3.12 : i == 2 ? 4.04 : 4.76;
  c.y += GS_WET * y; c.xz = mix(c.xz, vec2(-0.1, 0.1) + 0.13 * vec2(sin(float(i) * 2.0), cos(float(i) * 2.7)), GS_WET);
 }
 return c;
}
// Light on the plate: shade of the cubes, with the sun's bright lines in it.
vec3 gsPlate(vec2 q, vec4 pc, float soft) {
 float lit = 1.0, lines = 0.0, ao = 1.0;
 for (int i = gsB ? 0 : 5; i < 5; i++) {
  vec3 m = gsMid(i); float h = m.z;
  vec3 ce = gsCen(i, m), p = gsTurn(vec3(q.x - ce.x, -ce.y, q.y - ce.z), gsRot[i]), l = gsTurn(gsL, gsRot[i]);
  ao *= 1.0 - 0.55 * gsV(length(max(abs(p.xz) - h, 0.0)) * 4.0 / (h + 0.1)) * sat(h * 8.0) * (i == 0 ? 1.0 : 1.0 - GS_WET);
  vec3 iv = 1.0 / l, nn = -p * iv, kk = abs(iv) * h, t1 = nn - kk, t2 = nn + kk;
  float tn = max(max(max(t1.x, t1.y), t1.z), 0.0), tf = min(min(t2.x, t2.y), t2.z);
  float in_ = smoothstep(0.0, 0.06 + 0.1 * tn, tf - tn);
  vec3 x = abs(p + l * tf) / h;
  float a = x.x > 0.999 ? max(x.y, x.z) : x.y > 0.999 ? max(x.x, x.z) : max(x.x, x.y);
  float b = max(h * (1.0 - a), 0.0) / (gsW * (0.3 + 0.75 * h)), blur = 0.06 + 0.05 * tn + soft, f = abs(fract(b + 0.2 * p.x / h) - 0.5);
  lit *= 1.0 - in_ * (0.6 + 0.25 * gsV(b * 1.5));
  lines += in_ * blur / (blur + f * f * 9.0) * sat(b * 2.0) * (0.3 + 2.1 / (3.0 + b)) * sat(h * 5.0);
 }
 vec3 glow = mix(vec3(1.0, 0.95, 0.85), pc.rgb / max(pc.a, 0.05), 0.75 * sat(pc.a));
 // the sun's patch, from a window
 vec2 w = rot(0.35) * (q - vec2(0.35, 0.0));
 vec3 sun = gsSun * mix(0.3, 1.0, gsDn(0.0, 0.4, abs(w.x) - 2.3 - 0.6 * uPad) * gsDn(0.0, 0.4, abs(w.y) - 1.7 - 0.4 * uPad));
 return gsWhite * (sun * lit + gsAmb * ao) + sun * glow * lines * (0.62 + 0.4 * uPhrase + 0.8 * uEnergy * pc.a);
}
vec3 render(vec2 p) {
 gsB = uVar > 0.5;
 gsNgt = max(-uOwn[1], 0.0); gsDay = max(uOwn[1], 0.0);
 gsW = (gsB ? 0.16 : 0.17) * exp2(-0.75 * uOwn[2]);
 gsS = (gsB ? 0.1 : 0.15) * exp2((uOwn[3] < 0.0 ? 1.5 : 0.75) * uOwn[3] - 0.4 * uOwn[2]) * (0.9 + 0.35 * uDrone);
 gsLow = 1.0 - 0.97 * max(-uOwn[5], 0.0); gsTall = max(uOwn[5], 0.0);
 gsG = 0.5 - 0.5 * cos(TAU * uLoop);
 float sway = 0.12 * sin(uTime * 0.017) + (gsB ? 1.6 : 3.2) * uCue * (1.0 - uCue);
 gsL = normalize(gsB ? vec3(-0.75, 0.8, 0.5 + sway) : vec3(-0.8, 0.58 + 0.7 * gsDay, 0.22 + sway));
 gsAside = normalize(vec3(gsL.z, 0.0, -gsL.x));
 gsSun = mix(vec3(1.3, 1.19, 1.0), vec3(0.26, 0.36, 0.6), gsNgt) * (1.0 + 0.4 * uCue);
 gsAmb = mix(vec3(0.17, 0.195, 0.235), vec3(0.010, 0.014, 0.032), gsNgt);
 gsWhite = mix(vec3(0.66, 0.65, 0.63), vec3(0.05, 0.055, 0.065), gsDay);
 gsSaltTint = mix(vec3(0.95, 0.97, 0.97), uOwn[0] < 0.0 ? vec3(1.0, 0.55, 0.42) : vec3(0.25, 0.35, 0.9), abs(uOwn[0]));
 float el = (gsB ? 0.62 : 0.86) + (uOwn[4] < 0.0 ? -0.62 : -0.4) * uOwn[4], yaw = 0.5 + 0.05 * sin(uTime * 0.013) + (gsB ? 0.55 * GS_IN - 1.3 * GS_FAR : 1.25 * GS_IN - 1.0 * GS_FAR), f = 2.0;
 vec3 fw = vec3(sin(yaw) * cos(el), -sin(el), cos(yaw) * cos(el)), rt = vec3(cos(yaw), 0.0, -sin(yaw));
 vec3 o = (gsB ? vec3(0.0, 0.75, -0.1) + GS_IN * vec3(-0.3, 0.1, 0.3) + GS_WET * vec3(0.0, 1.5, 0.0) : vec3(0.62, 0.35, 0.3) + GS_IN * vec3(-0.6, -0.5, -0.3)) - fw * (gsB ? 8.4 + 7.0 * GS_FAR - 4.4 * GS_IN + 4.2 * GS_WET : 8.0 + 12.0 * GS_FAR - 2.9 * GS_IN) * (0.94 + 0.12 * uSpace);
 vec3 d = normalize(fw * f + rt * p.x + cross(fw, rt) * p.y);
 d += 1e-4 * (step(0.0, d) * 2.0 - 1.0);
 gsPx = 1.0 / (uRes.y * f);
 gsT = 1e9; gsLine = 0.0; gsLineT = 1e9; gsE = 1e9; gsC = 1e9;
 gsId = -1; gsAx = 1; gsSg = 1.0; gsK = 0.0; gsHit = 0.0; gsQ = vec3(0.0); gsN = vec3(0.0, 0.0, 1.0);

 // the two nearest blocks on the ray, and the closest miss
 float iy = 1.0 / d.y, tg = d.y < -1e-3 ? -o.y * iy : 60.0, n1 = 1e9, n2 = 1e9, miss = 0.04, hid = 0.0, top[13];
 int i1 = -1, i2 = -1, mi = -1;
 vec2 iv = 1.0 / d.xz, ai = abs(iv), po = -o.xz * iv, g = o.xz + d.xz * tg;
 for (int i = 0; i < (gsB ? 5 : 13); i++) {
  float tn, tf;
  if (gsB) {
   vec3 m = gsMid(i), e = 1.0 / gsTurn(d, gsRot[i]), n = -gsTurn(o - gsCen(i, m), gsRot[i]) * e, w = abs(e) * m.z, t1 = n - w, t2 = n + w;
   tn = max(max(t1.x, t1.y), t1.z) + (m.z < 0.005 ? 1e6 : 0.0); tf = min(min(t2.x, t2.y), t2.z);
  } else {
   vec4 b = gsCity[i];
   float h = 0.06 + (gsTop[i].x - 0.06) * gsLow + gsTop[i].y * gsTall + 0.22 * uBands[i] * gsLow;
   if (i == gsWell) h = 1.0;
   top[i] = h;
   vec2 nn = po + b.xy * iv, kk = ai * b.zw, t1 = nn - kk, t2 = nn + kk;
   tn = max(max(t1.x, t1.y), (h - o.y) * iy); tf = min(t2.x, t2.y);
  }
  float gap = tn - tf;
  if (gap < 0.0) {
   hid = max(hid, step(tg, tf));
   if (tn < n1) { n2 = n1; i2 = i1; n1 = tn; i1 = i; } else if (tn < n2) { n2 = tn; i2 = i; }
  } else if (gap < miss) { miss = gap; mi = i; }
 }
 vec2 cell = floor(g / vec2(2.6, 2.1) + 0.5);
 if (!gsB && hid < 0.5 && tg < n2) {   // the low floor of the town
  if (tg < n1) { n2 = n1; i2 = i1; n1 = tg; i1 = 20; } else { n2 = tg; i2 = 20; }
 }
 bool missed = false;
 for (int j = 0; j < 3; j++) {   // down into each of them
  if (i1 < 0) break;
  vec3 c, a, u = o, v = d; int id = i1;
  if (gsB) { vec3 m = gsMid(i1); u = gsTurn(o - gsCen(i1, m), gsRot[i1]); v = gsTurn(d, gsRot[i1]); c = vec3(0.0); a = vec3(m.z); }
  else if (i1 == 20) { c = vec3(cell.x * 2.6, -4.0, cell.y * 2.1); a = vec3(1.3, 4.0, 1.05); id = 20 + int(mod(cell.x + 5.0 * cell.y, 11.0)); }
  else { vec4 b = gsCity[i1]; c = vec3(b.x, top[i1] - 4.0, b.y); a = vec3(b.z, 4.0, b.w); }
  u -= c;
  vec3 m = 1.0 / v, t1 = -u * m - abs(m) * a, t2 = -u * m + abs(m) * a;
  float tn = max(max(t1.x, t1.y), t1.z);
  if (missed) {
   float t = 0.5 * (tn + min(min(t2.x, t2.y), t2.z)); vec3 e = abs(u + v * t) - a;
   float ln = 1.0 - max(e.x, max(e.y, e.z)) / (gsPx * t * 1.3);
   if (ln > gsLine) { gsLine = ln; gsLineT = t; }
   break;
  }
  int ax = tn == t1.y ? 1 : tn == t1.x ? 0 : 2;
  float sg = v[ax] < 0.0 ? 1.0 : -1.0;
  gsFace(a, id, ax);
  u = gsTo(u, ax); v = gsTo(v, ax);
  gsPit(vec3(u.xy, u.z * sg - gsTo(a, ax).z), vec3(v.xy, v.z * sg), id, ax, sg);
  if (j == 0 && n2 < gsT) i1 = i2; else { i1 = mi; missed = true; }
 }

 bool salt = gsB && gsId >= 0 && gsT < tg, city = !gsB && gsId >= 0;
 if (gsB && !salt) gsT = tg;
 int id = max(gsId, 0), ax = gsAx; float sg = gsSg, px = gsPx * gsT;
 bool gnd = id >= 20;
 vec2 turn = gsB ? gsRot[id % 5] : vec2(1.0, 0.0);
 vec3 mid = gsB ? gsMid(id % 5) : vec3(0.0), mc = gsB ? gsCen(id % 5, mid) : vec3(0.0), pos = o + d * gsT, ld = gsTurn(d, turn), n = gsTo(vec3(gsN.xy, gsN.z * sg), ax);
 gsFace(gsB ? vec3(mid.z) : gnd ? vec3(1.3, 4.0, 1.05) : vec3(gsCity[id % 13].z, 4.0, gsCity[id % 13].w), id, ax);
 bool pool = false;
 if (GS_WET > 0.0 && city && ax == 1) {
  float lv = gsBs * (9.4 - 7.2 * GS_WET), up = -lv - gsQ.z;
  if (up > 0.0) {
   pool = true; gsT += up / d.y; pos = o + d * gsT; px = gsPx * gsT;
   gsQ = vec3(gsQ.xy + d.xz * up / d.y, -lv); gsN = n = vec3(0.0, 0.0, 1.0); n = n.xzy; gsHit = 0.0;
   gsK = max(floor(lv / gsBs), 1.0); gsC = gsRectIn(gsQ.xy, gsRect(gsK - 1.0)); gsE = 1e3;
   if (gsLineT > gsT) gsLine = 0.0;
  }
 }
 // each terrace leans a hair its own way
 float w = gsBw, onTop = ax == 1 ? 1.0 : 0.0, well = id == gsWell ? onTop : 0.0, hs = hash31(vec3(gsK, dot(gsN, vec3(1.0, 2.0, 3.0)), float(id * 3 + ax)));
 vec3 nb = n + 0.09 * (vec3(hs, fract(hs * 17.0), fract(hs * 93.0)) - 0.5);
 // and is ruled with the fine steps of its growth
 float gr = noise(pos.xz * 5.0 + pos.y * 3.0), fs = fract((gsHit > 0.5 ? gsQ.z : min(gsE, gsC)) / w * 7.0 + hs);
 nb += (0.04 + 0.6 * uTexture) * sat(0.05 * w / px - 0.8) * (gsB ? 0.3 : 1.0) * (fs - 0.5) * smoothstep(0.4, 0.6, gr + 0.4 * uTexture) * vec3(gsL.x, 0.3, gsL.z) + 0.03 * (gr - 0.5);
 if (pool) nb = n + (0.03 + 0.05 * uLow + 0.06 * uHits) * vec3(noise(pos.xz * 7.0 + uTime * 0.23) - 0.5, 0.0, noise(pos.xz * 7.0 + 19.0 - uTime * 0.21) - 0.5);
 nb = normalize(nb);
 vec3 r = gsTurn(reflect(ld, nb), vec2(turn.x, -turn.y)), wn = gsTurn(nb, vec2(turn.x, -turn.y));
 float graze = 1.0 - max(dot(-ld, nb), 0.0), nl = max(dot(wn, gsL), 0.0);
 float edge = max(sat(1.0 - gsE / (px * 1.3)), gsLineT < gsT + 0.05 ? gsLine : 0.0), worn = gsV(gsE / (0.016 + 0.02 * uTexture));

 // Salt: through the cube to where the ray leaves it
 vec3 q = gsTurn(pos - mc, turn), td = refract(ld, nb, 0.65);
 td += 1e-4 * (step(0.0, td) * 2.0 - 1.0);
 vec3 im = 1.0 / td, t2 = -q * im + abs(im) * mid.z;
 float tf = max(min(min(t2.x, t2.y), t2.z), 0.0);
 q += td * tf;
 vec3 at = salt ? gsTurn(q, vec2(turn.x, -turn.y)) + mc : pos, x = abs(q) / max(mid.z, 0.01);
 float below = x.y > 0.999 && q.y < 0.0 ? 1.0 : 0.0, b = mid.z * (1.0 - (x.y > 0.999 ? max(x.x, x.z) : x.x > 0.999 ? max(x.y, x.z) : max(x.x, x.y))) / w, fb = fract(b);
 vec4 pc = piece(gsB ? vec2(0.5 + at.x / 6.0, 0.55 - at.z / 5.0) : vec2(0.5 + pos.x / 8.5, 0.55 - pos.z / 7.5));
 vec3 pt = pc.rgb / max(pc.a, 0.05), c = gsPlate(at.xz, pc, salt ? 0.25 : 0.0);
 if (salt) {
  // out at the bottom lies the plate; out at a side the far face shows its steps, as a mirror from within
  vec3 far = mix(gsAmb * 1.2, gsAmb * 2.0 + gsSun * 0.3, sat(0.5 + 0.5 * q.y / mid.z)) * (0.9 + 0.2 * hash11(floor(b) + float(id)));
  c = mix(far, c * 0.9, below) * (1.0 - 0.25 * smoothstep(0.6, 0.72, fb) * gsDn(0.92, 1.0, fb));
  c *= 1.0 / (1.0 + tf / (mid.z + 0.2) * (1.05 - gsSaltTint) * 1.3);
  c = c * (gsHit > 0.5 ? 0.5 : 0.92) + gsSaltTint * (gsSun * nl * 0.4 + gsAmb * 0.08);
  c = mix(c, gsSaltTint * (gsSun * (0.12 + 0.5 * nl) + gsAmb * 1.5), 0.45 * uTexture * gr);   // frost
  float s = max(dot(r, gsL), 0.0); s *= s; s *= s; s *= s; s *= s;
  c = mix(c, gsAmb * (1.5 + 0.4 * r.y) + gsSun * (0.12 + 2.5 * s * s), 0.05 + 0.75 * graze * graze * graze * graze);
  c *= 0.62 + 0.38 * sat(gsC / (w * 0.6));
  c = mix(c, c * pt * 1.5, 0.5 * sat(pc.a)) + gsSaltTint * pc.rgb * 0.15;
  if (GS_COVER > 0.0) {
   float lie = smoothstep(0.55, 0.9, wn.y) * smoothstep(0.05, 0.5, 1.6 * GS_COVER - 0.75 + 0.6 * noise(pos.xz * 6.0 + pos.y * 3.0) + 0.25 * noise(pos.xz * 22.0));
   c = mix(c, mix(vec3(0.75), uKind[2], 0.75) * (0.75 + 0.35 * noise(pos.xz * 30.0)) * (gsSun * nl * 0.8 + gsAmb * 2.0), lie);
  }
  c = mix(c, gsAmb * 0.3, 0.6 * edge) + gsSun * gsV((gsE - 0.02) / 0.012) * 0.12 * (0.4 + nl);
 } else c *= 1.0 - 0.5 * (gsLineT < gsT ? gsLine : 0.0);
 c = mix(c, gsAmb * 1.6 + 0.1 * gsSun, smoothstep(8.0 + 8.0 * GS_FAR + 4.0 * GS_WET, 22.0 + 12.0 * GS_FAR + 6.0 * GS_WET, gsT)) * 1.35;

 // Metal: the light that gets past the terraces, and past the other blocks
 vec3 lq = gsTo(gsL, ax); float rz = gsTo(r, ax).z * sg, depth = -gsQ.z; lq.z *= sg;
 float sh = city && lq.z > 0.0 ? gsClimb(gsQ + gsN * 0.01, lq, gsHit > 0.5 ? gsK : gsK - 1.0) : 0.0, over = 0.0;
 vec2 m = 1.0 / gsL.xz, am = abs(m);
 for (int i = nl * sh > 0.0 ? 0 : 9; i < 9; i++) {
  vec4 k = gsCity[i];
  vec2 nn = (k.xy - pos.xz) * m, kk = am * k.zw, t1 = nn - kk, t2 = nn + kk;
  float tn = max(max(t1.x, t1.y), 0.0), tl = min(min(t2.x, t2.y), (top[i] - pos.y) / gsL.y);
  over = max(over, i == id ? 0.0 : tl - 1.2 * tn);
 }
 sh *= 1.0 - 0.9 * smoothstep(0.0, 0.2, over);
 if (city) {
  // the skin: by height, by block, thicker towards edges
  vec3 film = gsFilm(0.22 * uPad + 0.04 * sin(uTime * 0.05) + 0.05 * uMic + 0.085 * gsK + fract(float(id) * 0.377) * 0.36 + 0.07 * pos.y + 0.05 * gr + 0.07 * hs + 0.12 * sat(gsE / w) + 0.12 * graze);
  film = mix(film, pt * pt * (0.25 + 0.7 * dot(film, vec3(0.33))), 0.5 * sat(pc.a));
  float high = depth / min(gsA.x, gsA.y), ao = (0.35 + 0.65 * sat(gsC / (w * 0.9))) / (1.0 + high * 0.5);
  ao *= gnd ? 0.5 : mix(0.3 + 0.6 * sat(pos.y / 1.6), 1.0, onTop);
  vec3 env = mix(film.brg * (0.05 + 0.4 * ao), gsRoom(r), smoothstep(0.0, 0.25, rz - 0.45 * high));
  vec3 sun = mix(vec3(3.0, 2.65, 2.2), vec3(0.18, 0.24, 0.4), gsNgt) * (1.0 + 0.4 * uCue), amb = mix(mix(vec3(0.085, 0.10, 0.145), vec3(0.02, 0.028, 0.055), gsNgt), vec3(0.62), gsDay);
  c = film * (sun * nl * sh + amb * ao * (0.6 + 0.4 * nb.y) + env * (0.5 + 0.5 * graze * graze * graze) * (0.3 + 0.7 * ao));
  if (pool) {
   vec3 deep = mix(film * 0.35, uKind[1] * 0.45, 0.65);
   float fk = floor(gsC / w * 1.1 + 0.15 * (nb.x + nb.z));
   deep = mix(deep, gsFilm(0.22 * uPad + 0.085 * (gsK - 1.0 - fk) + fract(float(id) * 0.377) * 0.36) * 0.55, 0.75 * exp(-0.4 * fk));
   c = deep * (sun * nl * sh * 0.3 + amb * 1.2) * (0.5 + 0.5 * sat(gsC / w)) + mix(film.brg * 0.12, gsRoom(r), smoothstep(-0.05, 0.3, rz - 0.3 * sat(1.0 - gsC / (w * 2.5)))) * (0.16 + 0.65 * graze * graze * graze) + sun * sh * pow(max(dot(r, gsL), 0.0), 60.0) * 0.5;
  }
  // the great well, lit by its own reflections
  c += film * vec3(1.0, 0.62, 0.3) * well * sat(depth / 1.3) * (0.75 + 0.8 * uDrone * (0.4 + uEnergy) + 0.6 * gsNgt) * (0.4 + 0.5 * gsHit + 0.4 * ao);
  c += film * vec3(1.0, 0.6, 0.3) * gsNgt * sat(depth * 1.2) * onTop * 0.5 + film * pt * pt * pc.a * (0.1 + 0.5 * uEnergy);
  // edges that catch the window
  vec3 rim = mix(film, vec3(1.0, 0.93, 0.8), 0.45) * (0.2 + 0.8 * ao) * (0.3 + 0.8 * sh) * mix(1.0, 0.25, gsNgt);
  if (GS_COVER > 0.0) {
   float up = smoothstep(0.55, 0.9, wn.y), lie = up * smoothstep(0.05, 0.5, 1.6 * GS_COVER - 0.75 + 0.6 * noise(pos.xz * 4.0 + pos.y) + 0.25 * noise(pos.xz * 15.0) - 0.35 * gsDn(0.0, 0.05, gsE));
   vec3 moss = mix(vec3(0.75), uKind[2], 0.75) * (0.75 + 0.35 * noise(pos.xz * 24.0));
   c = mix(c, moss * (sun * nl * sh * 0.62 + amb * (0.8 + 1.4 * ao) + 0.05) * (0.45 + 0.55 * ao), lie);
   rim *= 1.0 - 0.5 * lie;
  }
  c = mix(c, rim, 0.75 * edge * sat(0.02 / px + 0.2)) + rim * worn * 0.14;
  // a phrase runs round the square spiral
  vec2 qn = gsQ.xy / gsA; bool xx = abs(qn.x) > abs(qn.y); float big = xx ? qn.x : qn.y, ang = 0.5 * (xx ? qn.y : -qn.x) / (abs(big) < 1e-3 ? 1e-3 : big) + (xx ? 0.0 : 1.0) + (big > 0.0 ? 0.0 : 2.0);
  float run = 8.0 * fract((gsK + fract(ang * 0.25 + 1.0)) / 8.0 + uTime * 0.02);
  c += well * uPhrase * mix(uKind[3], vec3(1.0, 0.85, 0.6), 0.2) * (gsV((8.0 - run) * 12.0) + exp(-run * 3.0)) * gsV(gsE / 0.038) * 1.9 * gsDn(5.0, 8.0, gsK);
  c = mix(c, mix(mix(vec3(0.10, 0.095, 0.11), vec3(0.01, 0.013, 0.03), gsNgt), vec3(0.7), gsDay), 0.8 * smoothstep(7.0 + 13.0 * GS_FAR, 17.0 + 25.0 * GS_FAR, gsT));
 }
 // a hit rings one block's rims outward; keys glint on corners
 if (salt ? id == 0 : well > 0.5) c += uHits * gsV((gsK / 7.0 - 1.0 + uHits) * 10.0) * (gsB ? 0.3 : 0.1 + worn + edge) * mix(uKind[4], vec3(1.0, 0.9, 0.75), 0.4);
 float gl = gsV(gsE / 0.035) * gsV(gsC / 0.06);
 if (salt || city) c += (uKeys * 2.0 + 0.4 * uMic) * gl * gl * step(0.5, hs) * vec3(1.0, 0.93, 0.8);
 if (!gsB) {   // the near block, out of focus
  vec2 e2 = p - vec2(0.36, -0.43);
  float e = max(0.94 * e2.y - 0.35 * e2.x, -0.76 * e2.y - 0.65 * e2.x);
  c = mix(c, vec3(0.012, 0.01, 0.014) + vec3(0.36, 0.21, 0.17) * gsV((e + 0.03) / 0.022) * (1.0 - 0.8 * gsNgt), gsDn(-0.022, 0.022, e) * 0.97 * (1.0 - GS_FAR) * (1.0 - GS_IN));
 }
 if (!gsB) c = c * c / (c + 0.16) * 1.35;
 return screenOf(c * (1.2 + 0.6 * uTone));
}
