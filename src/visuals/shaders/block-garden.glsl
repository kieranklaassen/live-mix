// name: Block garden
// a: Little town
// b: Shelf of houses
// what: A little town of painted wooden blocks on a pale table in morning light from a window: houses, round towers, arches, trees and street lamps with long soft shadows, the paint rubbed off at the edges; or the same blocks seen level, standing along two shelves with the sun coming in from the side.
// follows: Houses rise where the piece sounds and their windows light with their own kind of sound; a row of round towers stands as high as the bands; a hit lights one tower, a cue lights lamps and windows street by street, or house by house along the shelf; the loop swings the sun and the shadows; keys and voice colour the trees and light windows.
// own: 0 1 tall as towers, -1 low and flat; 1 1 a wood of trees in place of the houses, -1 bare square blocks side by side with no roof or window; 2 1 crowded as far as one sees, -1 a few left with room about them; 3 1 snow on everything, -1 the ground (b: the wall too) in the drone's colour; 4 1 night with lit windows, -1 a low late sun and long shadows; 5 the eye: 1 straight above (b: close, with deep perspective), -1 low along the ground (b: looking down on the boards); 6 1 strewn and turned any way, of every size, -1 in strict rows, all alike; 7 1 paper lanterns lit from inside, -1 drawn in ink on paper
// What stands in one place of the grid: a lower piece and one on top.
vec4 bgH, bgD0 = vec4(1.0), bgD1 = vec4(1.0), bgF1 = vec4(0.0);  // its numbers, sizes, how its faces lean
vec2 bgCs, bgMid; 
float bgFt, bgKi = 0.0, bgPx, bgSf;
vec4 bgM;       
float bgDye, bgNight, bgDraw, bgStrict;   // own: how far the paint is of the kinds' colours; night; drawn; in rows
bool bgB, bgHo, bgTr, bgLm, bgPeg, bgAr, bgAny;
vec3 bgL, bgSun, bgSky;
vec2 bgHt;

float bgOff(float lo, float hi, float x) { return 1.0 - smoothstep(lo, hi, x); }
float bgIn(float x) { return 1.0 - smoothstep(-bgPx, bgPx, x); }
vec4 bgHash(vec2 p) {
  vec4 q = fract(p.xyxy * vec4(0.1031, 0.103, 0.0973, 0.1099));
  q += dot(q, q.wzxy + 33.33);
  return fract((q.xxyz + q.yzzw) * q.zywx);
}
void bgFe(vec2 c) {
  bgMid = c + 0.5;
  bgH = bgHash(c + 61.0 + bgSf * 17.0);
  float t = fract(bgH.z * 7.7 + bgH.x * 3.1), b = abs(fract(uTime * 0.021 + bgH.x) - 0.5) * 2.0, turn = (bgH.w - 0.5) * 0.2, size = 1.0;
  b = b * b * (0.39 - 0.26 * b);
  bool odd = fract(c.x * 0.5) < 0.25, back = c.y > 0.5, rim = false;
  vec2 at; float tall;
  if (bgB) {
    bool up = bgSf < 0.5, in_ = abs(c.y - 0.5) < 1.0 && bgSf > -0.5;
    at = vec2((c.x + 8.0) * 0.0625, 0.4 + 0.5 * bgSf - 0.2 * c.y);
    bgPeg = in_ && up && back && abs(c.x - 3.5) < 3.0;
    bgTr = in_ && !back && t < 0.22 && bgH.x < 0.5;
    bgHo = in_ && !bgTr && !bgPeg && bgH.y < (up ? (back ? 0.5 : 0.36) : (back ? 0.9 : 0.5));
    bgLm = false;
    tall = 0.4 + 0.4 * bgH.x + (back ? 0.35 + 0.15 * bgH.x : 0.0);
  } else {
    float r = dot(bgMid * bgMid, vec2(0.74, 1.0)), f = r + (bgH.x - 0.5) * 17.0;
    bool street = bgH.w >= uOwn[2] && min(fract(c.x * 0.25 + 0.25), fract(c.y * 0.3333334 + 0.01) - 0.1) < 0.1, in_ = f < (uOwn[2] > 0.0 ? 24.0 * exp2(4.0 * uOwn[2]) : 24.0);
    at = vec2((c.x + 6.0) * 0.0833333, 0.5 - c.y * 0.1);
    bgPeg = c.y == 3.0 && abs(bgMid.x) < 5.0;
    bgLm = in_ && street && !bgPeg && fract((c.x + c.y * 2.0) * 0.3333334 + 0.01) < 0.3;
    bgTr = !street && !bgPeg && (in_ ? bgH.y < 0.15 : bgH.y < 0.07);
    rim = !in_;
    bgHo = !bgPeg && (in_ ? !street && bgH.y > 0.2 : bgH.y > 0.955 && r > 30.0);
    tall = rim ? 0.3 : 0.3 + 0.35 * bgH.x * bgH.w + max(0.5 - 0.02 * r, 0.0) * bgH.z;
    turn *= rim ? 13.0 : 1.0; size = rim ? 0.7 : 1.0;
  }
  bool bell = c == bgHt && bgSf < 0.5;
  bgHo = bgHo || bell; bgTr = bgTr && !bell; bgLm = bgLm && !bell;
  t = bell ? 0.1 : t;
  float cubes = max(-uOwn[1], 0.0), loose = max(uOwn[6], 0.0), go = fract(bgH.x * 41.0 + bgH.y * 17.0);
  if (bgDye > 0.0) {
    if (!bell && go < -0.9 * uOwn[2]) bgHo = bgTr = bgLm = bgPeg = false;
    if (bgB && uOwn[2] > 0.0 && !bgPeg && !bgTr && abs(c.y - 0.5) < 1.0 && go < uOwn[2]) bgHo = true;
    if (bgHo && !bell && go < uOwn[1]) { bgHo = false; bgTr = true; }
    turn = (turn + (bgH.y - 0.5) * 1.5 * loose) * (1.0 - max(cubes, bgStrict));
    size *= mix(1.0, 0.45 + 0.4 * bgH.w, loose);
    bgMid += (bgH.zx - 0.5) * 0.22 * loose;
    t = mix(t, 0.3, bgStrict);
  }
  bgAny = bgHo || bgTr || bgPeg || bgLm;
  bgM = bgHo || bgTr && uOwn[1] > 0.0 ? piece(at) : vec4(0.0);
  bgCs = vec2(1.0, bgPeg ? 0.0 : turn); bgCs *= inversesqrt(1.0 + bgCs.y * bgCs.y);
  bgKi = bgPeg ? fract(c.x * 0.25) * 4.0 : floor(bgH.z * 3.99);
  tall += 0.65 * bgM.a * (1.7 - tall);
  tall = bgPeg ? 0.42 + (bgB ? 0.06 * c.x : 0.2 * bgH.x) + 0.75 * uBands[int(clamp(bgB ? c.x * 2.6 - 2.0 : c.x * 1.6 + 8.0, 0.0, 15.0))] : bell ? 1.0 + 0.15 * bgM.a + 0.4 * uHits * (1.0 - uHits) : tall;
  if (bgDye > 0.0) {
    tall = mix(tall, (0.55 + 0.6 * bgM.a) * (bgB && back ? 1.5 : 1.0), bgPeg || bell ? 0.0 : bgStrict);
    tall *= exp2(uOwn[0] * (uOwn[0] < 0.0 ? 1.7 : bgB ? 0.75 : 1.1)) * mix(1.0, 0.5 + bgH.z, loose);
  }
  tall = bgTr ? 0.2 : bgLm ? 0.56 : rim ? tall : tall + b;
  bool rnd = (t < 0.2 || bgPeg) && uOwn[1] > -0.5 || bgTr || bgLm, cone = bgPeg ? odd : !bgLm && (fract(bgH.w * 5.0) < 0.6 || bell), ball = bgLm || bgTr && !cone;
  float w = bgPeg ? 0.3 : bgTr ? 0.055 : bgLm ? 0.03 : (0.34 + 0.07 * bgH.z) * size, d = w * (0.82 + 0.18 * bgH.w);
  if (bgHo || bgPeg) { w = mix(mix(w, 0.36, bgStrict), 0.495, cubes); d = mix(mix(d, 0.36, bgStrict), 0.495, cubes); }
  bool gable = t < 0.5 && !(cubes > 0.5), hip = t < 0.7 && !gable && !(cubes > 0.5), lean = gable || hip;
  bgAr = bgHo && t > 0.7 && t < 0.84 && cubes < 0.5;
  float r2 = bgTr ? 0.3 : bgLm ? 0.1 : w * 1.12, up2 = cone ? bgTr ? 2.9 : 1.7 : 1.0, h2 = rnd ? r2 * up2 : gable ? w : hip ? w * 1.25 : bgAr ? 0.18 : 0.3;
  if (bgTr && bgDye > 0.0) { float grow = (1.0 + 0.4 * go * max(uOwn[1], 0.0)) * (1.0 - 0.3 * loose * bgH.w) * (1.0 + 0.3 * bgM.a); r2 *= grow; up2 *= exp2(0.5 * uOwn[0]); h2 = r2 * up2; }
  if (cubes > 0.0 && !bgTr && !bgLm) { h2 *= 1.0 - 0.97 * cubes; }
  vec2 hf = lean ? vec2(w, d) + 0.035 : bgAr ? vec2(w * 0.5, d * 0.97) : vec2(w, d) * mix(0.62, -0.1, cubes);
  bgFt = ball ? -r2 : 0.0;
  bgD0 = vec4(rnd ? vec2(99.0) : vec2(w, d), tall, rnd ? w : 99.0);
  bgD1 = vec4(rnd ? vec2(99.0) : hf, h2, rnd ? r2 : 99.0);
  float k = 1.0 / up2;
  bgF1 = rnd ? vec4(0.0, 0.0, cone ? -k * k : 1.0, cone ? k * r2 : 0.0) : vec4(lean ? hf.x / h2 : 0.0, hip ? hf.y / h2 : 0.0, 0.0, 0.0);
}
vec2 bgTu(vec2 v) { return vec2(bgCs.x * v.x + bgCs.y * v.y, bgCs.x * v.y - bgCs.y * v.x); }
// Where a ray comes into each piece and goes out (x, y), and how much of the pixel it covers (z).
vec3 bgIn0, bgIn1;
void bgMeet(vec3 o, vec3 d, float a0, bool sun, float lid) {
  o.xz = bgTu(o.xz - bgMid); d.xz = bgTu(d.xz);
  vec2 id = 1.0 / (d.xz + 1e-6), m = -o.xz * id, w = abs(id) * bgD0.xy, lo = m - w, hi = m + w;
  float iy = 1.0 / (d.y + 1e-6), b0 = dot(o.xz, d.xz), c0 = dot(o.xz, o.xz), e = b0 * b0 - a0 * (c0 - bgD0.w * bgD0.w), q = sqrt(max(e, 0.0)), ia = 1.0 / a0;
  float top = (bgD0.z - o.y) * iy, t0 = max(max(lo.x, lo.y), (-b0 - q) * ia), t1 = min(min(hi.x, hi.y), (-b0 + q) * ia);
  float y = o.y - bgD0.z;
  vec2 s = bgF1.xy * d.y, r = bgF1.xy * y - bgD1.xy;
  vec4 nd = vec4(d.xz + s, s - d.xz) + 1e-6, t = -vec4(r + o.xz, r - o.xz) / nd;
  vec4 l4 = mix(vec4(-1e4), t, lessThan(nd, vec4(0.0))), h4 = mix(t, vec4(1e4), lessThan(nd, vec4(0.0)));
  float u0 = max(max(l4.x, l4.y), max(l4.z, l4.w)), u1 = min(min(h4.x, h4.y), min(h4.z, h4.w));
  y += bgFt;
  float A = max(a0 + bgF1.z * d.y * d.y, 1e-3), B = b0 + (bgF1.z * y + bgF1.w) * d.y, C = c0 + (bgF1.z * y + 2.0 * bgF1.w) * y - bgD1.w * bgD1.w, E = B * B - A * C, Q = sqrt(max(E, 0.0));
  float foot = (bgFt - y) * iy, cap = (bgD1.z - y) * iy;
  if (sun) {
    bool lean = bgF1.x > 0.0, crown = bgTr || bgLm;
    float lidY = (bgD0.z + (lean ? 1.0 : lid) * bgD1.z - o.y) * iy;
    bgIn0 = crown ? vec3((-B - Q) / A, (-B + Q) / A, E) : vec3(lean ? max(t0, u0) : t0, min(lean ? min(t1, u1) : t1, lidY), e);
    if (crown) bgIn0.y = min(bgIn0.y, cap);
  } else {
    t0 = max(t0, d.y < 0.0 ? top : -1e4); t1 = min(t1, d.y < 0.0 ? 1e4 : top);
    bgIn0 = vec3(t0, e > 0.0 ? t1 : -1e4, sat(min((t1 - t0) * 0.37, e * ia * 0.5 / bgD0.w) / bgPx));
    u0 = max(max(u0, min(foot, cap)), (-B - Q) / A); u1 = min(min(u1, max(foot, cap)), (-B + Q) / A);
    float ye = y + d.y * u0, near = bgF1.z < 0.0 ? sqrt(max(bgD1.w * bgD1.w - (bgF1.z * ye + 2.0 * bgF1.w) * ye, 1e-4)) : bgD1.w;
    bgIn1 = vec3(u0, E > 0.0 ? u1 : -1e4, sat(min((u1 - u0) * 0.37, E / (2.0 * A * near)) / bgPx));
  }
}
// How high anything stands near two places: out on the open table things are low.
float bgHigh(vec2 a, vec2 b) { vec2 k = vec2(0.8, 1.0); a *= k; b *= k; return bgDye > 0.0 ? 1.96 + 1.7 * max(uOwn[0], 0.0) : !bgB && min(dot(a, a), dot(b, b)) > 38.0 ? 1.1 : 1.96; }
// The sun at a place (x), its shadows softer the farther they fall, and the sky (y).
float bgLn;
vec2 bgShade(vec3 o, float face, bool sun) {
  vec3 d = bgL; float sh = 1.0, ao = 1.0, t = 0.0;
  vec2 c = floor(o.xz), st = sign(d.xz), id = 1.0 / abs(d.xz), tm = (st * (c + 0.5 - o.xz) + 0.5) * id;
  float soft = mix(0.3, 0.1, uTone), base = 3.0 * bgPx;
  vec2 q0 = vec2(0.0), h0 = vec2(-9.0); bool lamp = false;
  vec2 run = d.xz / d.y;
  float a0 = dot(d.xz, d.xz), lim = bgHigh(o.xz + run * max(1.0 - o.y, 0.0), o.xz + run * max(1.96 - o.y, 0.0));
  for (int i = 0; i < 20; i++) {
    if (i > 9 && uOwn[0] < 0.5 && uOwn[4] > -0.3) break;
    bgFe(c);
    for (int k = 0; k < 1 && bgAny; k++) bgMeet(o, d, a0, true, i == 0 ? 0.0 : 0.55);
    float from = max(bgIn0.x, 0.0), len = bgAny && bgIn0.z > 0.0 && bgIn0.y > from ? bgIn0.y - from : 0.0;
    sh *= 1.0 - smoothstep(0.0, base + soft * from, len);
    ao *= 1.0 - 0.5 * min(len * 2.0, 1.0) / (1.0 + from * 2.5);
    if (i == 0) { q0 = bgTu(o.xz - bgMid); h0 = bgAny ? min(bgD0.xy, bgD0.ww) : vec2(-9.0); lamp = bgLm || uOwn[7] > 0.0 && bgHo && !bgB; }
    if (tm.x < tm.y) { t = tm.x; tm.x += id.x; c.x += st.x; } else { t = tm.y; tm.y += id.y; c.y += st.y; }
    if (!sun && i > 1 || o.y + d.y * t > lim || sh < 0.02 || (bgB && c.y < -0.5)) break;
  }
  q0 = abs(q0);
  bgLn = lamp ? max(exp2(-dot(q0, q0) * 9.0) - 0.1, 0.0) : 0.0;
  if (face > 0.5) ao *= 1.0 - 0.4 * exp2(-length(max(q0 - h0, 0.0)) * 12.0);
  return vec2(sh, ao);
}
const vec3 bgPs[8] = vec3[8](vec3(0.86, 0.76, 0.55), vec3(0.52, 0.073, 0.036), vec3(0.76, 0.41, 0.05), vec3(0.25, 0.36, 0.18), vec3(0.115, 0.24, 0.385), vec3(0.8, 0.68, 0.45), vec3(0.72, 0.3, 0.22), vec3(0.06, 0.08, 0.115));
vec3 bgPt(float h) {
  vec3 k = uKind[1 + int(fract(h * 3.0) * 3.99)];
  return bgDye > 0.0 ? mix(bgPs[int(h * 7.99)], k * k * 0.9 + 0.03, bgDye) : bgPs[int(h * 7.99)];
}
vec3 bgMute(vec3 c, float k) { c = max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); return c * c; }
// How lit a lamp or a window is as a cue runs through: first the near street, then the next. x is its place in the row.
float bgLit(float x) { return smoothstep(x - 0.3, x - 0.05, 1.45 - 1.3 * uCue) * smoothstep(0.0, 0.35, uCue); }
float bgOr(vec2 c) { return sat(bgB ? c.x * 0.07 + 0.5 : c.y * 0.1 + 0.5) * 0.8; }
// The light of the window the sun comes through.
float bgPane(vec3 o) {
  vec2 q;
  if (bgB) { q = (o - bgL / min(bgL.z, -0.2) * (o.z - 2.0)).xy; q = vec2(q.x * 0.095 + q.y * 0.035 + 0.06, q.y * 0.13 + 0.06); q.y = bgSf < -0.5 ? 9.0 : max(q.y, 0.0); }
  else { q = o.xz - bgL.xz / bgL.y * o.y; q = mat2(0.8776, 0.4794, -0.4794, 0.8776) * q * 0.066 + vec2(0.16, -0.12); }
  vec2 e = abs(q) - vec2(0.56, 0.46);
  return bgOff(-0.05, 0.05, max(e.x, e.y)) * (1.0 - 0.55 * bgOff(0.0, 0.035, abs(q.x - 0.12) - 0.01));
}
// One thing seen: where, its face, its colour, its own light.
struct BgSeen { vec3 pos, n, alb, glow; float sun; };
struct BgMet { float t, cv, k, key; vec2 c; };
BgSeen bgLook(vec3 ro, vec3 rd, BgMet m, float ground) {
  BgSeen s; s.pos = ro + rd * m.t; s.sun = 1.0;
  bool table = ground < 0.5, wall = ground == 2.0;
  vec2 gq = wall ? s.pos.xy * vec2(6.0, 0.4) : table ? mat2(0.95, 0.31, -0.31, 0.95) * s.pos.xz * vec2(0.5, 0.55) : s.pos.xz * vec2(0.5, 1.0);
  s.n = ground < 1.5 ? vec3(0.0, 1.0, 0.0) : ground < 2.5 ? vec3(0.0, 0.0, -1.0) : vec3(0.0, -1.0, 0.0);
  s.alb = (table ? vec3(0.86, 0.8, 0.7) : wall ? vec3(0.63, 0.68, 0.6) : ground > 2.5 ? vec3(0.5, 0.36, 0.22) : vec3(0.66, 0.5, 0.33)) * (1.0 + (0.112 * noise(gq * vec2(1.7, 17.0)) + 0.048 * noise(gq * 11.0 + 5.0) - 0.12) * (wall ? 0.6 : 1.0));
  s.glow = vec3(0.0);
  float snow = max(uOwn[3], 0.0), dyed = max(-uOwn[3], 0.0);
  if (dyed > 0.0) s.alb = mix(s.alb, (uKind[0] * uKind[0] * 0.85 + 0.02) * (0.8 + 0.35 * noise(gq * 3.0) + 0.1 * noise(gq * 23.0)), dyed * (wall || table ? 1.0 : 0.35));
  if (snow > 0.0 && !wall) s.alb = mix(s.alb, vec3(0.86, 0.89, 0.95) * (0.93 + 0.1 * noise(gq * 2.0)), snow * step(0.5, s.n.y));
  if (bgDraw > 0.0) s.alb = mix(s.alb, vec3(0.92, 0.89, 0.82) * (0.96 + 0.06 * noise(gq * 29.0)), bgDraw);
  for (int once = 0; once < 1 && m.k > -0.5; once++) { // a block
  bgFe(m.c);
  bool top = m.k > 0.5;
  vec4 D = top ? bgD1 : bgD0, F = top ? bgF1 : vec4(0.0);
  vec3 q = s.pos; q.xz = bgTu(s.pos.xz - bgMid);
  if (top) q.y -= bgD0.z - bgFt;
  vec2 sg = vec2(q.x < 0.0 ? -1.0 : 1.0, q.z < 0.0 ? -1.0 : 1.0);
  vec2 il = inversesqrt(1.0 + F.xy * F.xy);
  vec3 ds = vec3((abs(q.x) - D.x + F.x * q.y) * il.x, q.y - D.z, (abs(q.z) - D.y + F.y * q.y) * il.y);
  vec3 nA = vec3(sg.x, F.x, 0.0) * il.x, nC = vec3(0.0, F.y, sg.y) * il.y;
  bool rnd = D.w < 9.0;
  if (rnd) {
    vec3 g = vec3(q.x, F.z * q.y + F.w, q.z); float l = max(length(g), 1e-3);
    nA = g / l; ds.x = (dot(q.xz, q.xz) + (F.z * q.y + 2.0 * F.w) * q.y - D.w * D.w) / (2.0 * l); ds.z = -9.0;
  }
  bool isY = ds.y > max(ds.x, ds.z), isZ = !isY && ds.z > ds.x, side = !isY && F.x == 0.0 && F.z == 0.0;
  vec3 nB = vec3(0.0, 1.0, 0.0), n = isY ? nB : isZ ? nC : nA, n2 = isY ? (ds.x > ds.z ? nA : nC) : isZ ? (ds.x > ds.y ? nA : nB) : (ds.y > ds.z ? nB : nC);
  float e = isY ? ds.y - max(ds.x, ds.z) : isZ ? ds.z - max(ds.x, ds.y) : ds.x - max(ds.y, ds.z);
  n = normalize(mix(n, n2, 0.5 * bgOff(0.0, 0.03 + bgPx, e)));
  // wood and wear: two noises, laid along the grain of whatever is seen
  gq = isY && !rnd ? q.xz + bgH.xy * 19.0 : vec2(q.y, isZ ? q.x : rnd ? q.x - q.z : q.z) + bgH.zw * 23.0;
  float g = noise(gq * vec2(1.7, 17.0)), wn = noise(gq * 11.0 + 5.0);
  vec3 beech = mix(vec3(0.46, 0.29, 0.14), vec3(0.74, 0.54, 0.31), g), kc = uKind[int(bgKi)];
  bool roof = top && !bgAr, bell = m.c == bgHt && bgSf < 0.5;
  vec3 paint = bgPt(bell ? (top ? 0.3 : 0.0) : !roof ? bgH.x : bgH.w < 0.55 ? 0.15 + 0.2 * bgH.z : 0.5 + 0.49 * bgH.x);
  paint = roof || bell ? paint : mix(paint, kc * kc * 0.8 + 0.06, 0.35);
  if (bgPeg) paint = top ? bgMute(kc, 0.8) * 0.85 : vec3(0.84, 0.74, 0.56);
  if (bgTr) paint = !top ? beech * 0.5 : F.z < 0.0 ? vec3(0.1, 0.19, 0.1) : mix(vec3(0.26, 0.33, 0.1), bgMute(uKind[3], 0.9), 0.2 + 0.6 * uKeys);
  if (bgTr && top && bgDye > 0.0) paint = mix(paint, bgPt(bgH.w) * 0.8, bgDye * max(abs(uOwn[1]), 0.5));
  if (bgLm) paint = top ? vec3(0.85, 0.78, 0.6) : vec3(0.04);
  float wear = max(bgOff(0.0, 0.05, e + (wn - 0.4) * 0.07) * 0.85, smoothstep(0.82, 0.92, wn) * 0.6);
  if (fract(bgH.z * 9.0 + bgH.w) < 0.26 && bgHo) wear = 1.0;
  if (bgTr || bgLm) wear = 0.0;
  paint *= mix(vec3(1.0), 0.7 + bgM.rgb, sat(bgM.a * 0.8));
  s.alb = mix(paint * (0.88 + 0.22 * g), beech, wear * (1.0 - 0.9 * max(-uOwn[1], 0.0)));
  float w = isZ ? D.x : D.y, u = isZ ? q.x : q.z, down = D.z - q.y - 0.05, row = floor(down / 0.34);
  float dv = abs(down - (row + 0.5) * 0.34) - 0.1, du = rnd ? min(abs(q.x), abs(q.z)) - 0.06 : abs(abs(u) - 0.5 * w) - 0.078;
  float fit = !top && side && (bgHo || bgPeg) && !bgAr && row > -0.5 && row < 1.5 ? smoothstep(0.02, 0.08, D.z - (row + 0.78) * 0.34 - 0.05) : 0.0;
  if (uOwn[1] < 0.0) fit *= 1.0 + uOwn[1];
  float win = bgIn(max(du, dv)) * fit, frame = bgIn(max(du, dv) - 0.024) * fit;
  float lv = bgKi < 0.5 ? uDrone : bgKi < 1.5 ? uPad : bgKi < 2.5 ? uTexture : uPhrase;
  float own = fract(bgH.y * 5.0 + row * 0.37 + (u > 0.0 ? 0.43 : 0.0) + (isZ ? 0.21 : 0.0));
  float lit = lv * smoothstep(own * 0.6 - 0.1, own * 0.6 + 0.2, lv + 0.1);
  if (bgNight > 0.0) lit = max(lit, bgNight * 1.4 * smoothstep(0.3, 0.45, own));
  if (bgDye > 0.0) lit = max(lit, bgDye * uHits * step(fract(bgH.y * 13.0), 0.3));
  lit = max(max(lit, bgLit(bgOr(m.c))), uMic * step(0.5, own));
  s.alb = mix(mix(s.alb, vec3(0.75, 0.7, 0.6), frame - win), vec3(0.04, 0.05, 0.075), win);
  s.glow = mix(bgMute(kc, 1.25), vec3(1.0, 0.62, 0.25), 0.35) * (win + 0.2 * fit * exp2(-max(max(du, dv), 0.0) * 18.0) * bgOff(0.52, 0.71, down)) * lit * (0.8 + 1.4 * uEnergy);
  if (bgAr && !top && isZ) {
    float ar = D.x * 0.55, sy = max(D.z - 0.14 - ar, 0.0), ma = q.y < sy ? abs(q.x) - ar : length(vec2(q.x, q.y - sy)) - ar;
    float deep = bgIn(ma);
    s.alb *= mix(1.0, 0.16 + 0.3 * sat(0.4 - q.y * 1.2), deep); s.sun = 1.0 - deep;
  }
  if (bgLm && top) s.glow = vec3(1.0, 0.62, 0.25) * max(bgLit(bgOr(m.c)), bgNight * 0.6) * 2.6;
  n.xz = vec2(bgCs.x * n.x - bgCs.y * n.z, bgCs.y * n.x + bgCs.x * n.z);
  s.n = n;
  if (snow > 0.0) s.alb = mix(s.alb, vec3(0.88, 0.91, 0.96), snow * smoothstep(0.2, 0.5, n.y + 0.3 * (wn - 0.5)) * (bgLm ? 0.0 : 1.0));
  if (bgTr && top && uOwn[1] > 0.0) s.glow = uOwn[1] * (s.alb * (0.25 * lv + 0.4 * bgM.a) + bgMute(uKind[4], 1.1) * uHits * step(bgH.y, 0.35) * 0.7);
  if (uOwn[7] > 0.0 && (bgHo || bgPeg)) {       // a lantern: ribs, and the light in it
    float rib = 0.72 + 0.28 * smoothstep(0.0, 0.25, abs(fract(q.y * 9.0) - 0.5) * 2.0);
    vec3 warm = mix(bgMute(kc, 1.2), vec3(1.0, 0.72, 0.42), 0.3);
    s.glow = mix(s.glow, warm * rib * (0.22 + 1.5 * lv + 0.5 * bgM.a + 0.8 * bgLit(bgOr(m.c))) * (top ? 0.45 : 0.6 + 0.6 * exp2(-3.0 * abs(q.y - 0.35))), uOwn[7]);
    s.alb *= 1.0 - 0.5 * uOwn[7];
  }
  if (bgDraw > 0.0) {                           // drawn: paper, a line along each edge, its windows filled as they sound
    float thick = bgPx * 0.5 + 0.004, ink = max(bgOff(thick, thick + bgPx, e), frame - win);
    vec3 page = mix(vec3(0.92, 0.89, 0.82), kc * kc * 0.8 + 0.1, win * sat(0.15 + lit * 1.5));
    page = mix(page, mix(page, bgM.rgb / max(bgM.a, 0.02), 0.55), bgHo && (top || bgAr) ? sat(bgM.a * 1.5) : 0.0);
    s.alb = mix(s.alb, mix(page, vec3(0.05, 0.06, 0.09), 0.9 * ink), bgDraw); s.glow *= 1.0 - bgDraw; s.sun = mix(s.sun, 1.0, bgDraw);
  }
  s.alb *= mix(0.7, 1.0, smoothstep(0.0, 0.3, s.pos.y));
  // the block a hit lights
  if (bell) s.glow += mix(bgMute(uKind[4], 1.1), vec3(1.0, 0.8, 0.5), 0.35) * uHits * (top || isY ? 1.5 : 0.15);
  }
  return s;
}
void bgKeep(inout BgMet m1, inout BgMet m2, inout int got, vec2 h, vec2 c, float k) {
  bool hit = h.x < 9e3;
  BgMet m = BgMet(h.x, h.y, k, bgH.x, c);
  if (hit && got == 0) m1 = m;
  if (hit && got == 1) m2 = m;
  if (hit) got++;
}
vec3 bgLight(BgSeen s, vec2 sh, float pane) {
  vec3 light = bgSun * sh.x * pane * sat(dot(s.n, bgL)) * s.sun;
  light += bgSky * sh.y * (0.66 + 0.34 * s.n.y);
  light += bgSun * vec3(0.17, 0.145, 0.11) * sat(0.6 - 0.6 * s.n.y) * exp2(-max(s.pos.y, 0.0) * 1.7) * (0.3 + 0.7 * pane) * s.sun;
  vec3 v = vec3(bgHt.x + 0.5, 0.9, bgHt.y + (bgB ? 0.4 : 0.5)) - s.pos;
  light += bgMute(uKind[4], 1.2) * uHits * (abs(bgSf) < 0.5 ? 2.0 : 0.0) * exp2(-dot(v, v) * 0.7);
  if (bgNight > 0.0) light += vec3(1.0, 0.58, 0.2) * bgNight * bgLn * 1.8;
  if (uOwn[7] > 0.0) light += vec3(1.0, 0.66, 0.36) * uOwn[7] * bgLn * (0.5 + uLevel);
  light += vec3(1.0, 0.58, 0.2) * (bgLn * 2.2 + 0.28 * exp2(-max(s.pos.y, 0.0) * 0.8)) * bgLit(bgOr(s.pos.xz));
  return s.alb * light + s.glow;
}
vec3 render(vec2 p) {
  bgNight = max(uOwn[4], 0.0); bgDraw = max(-uOwn[7], 0.0); bgStrict = max(-uOwn[6], 0.0);
  bgDye = min(abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7]), 1.0);
  bgB = uVar > 0.5; bgSf = 0.0; bgHt = bgB ? vec2(-3.0, 1.0) : vec2(0.0, -1.0);
  float sway = sin(TAU * uLoop), t, tEnd, ground = 0.0;
  bgSun = mix(vec3(1.0, 0.78, 0.53), vec3(1.0, 0.9, 0.78), uTone) * (2.1 + 0.5 * uLevel);
  bgSky = vec3(0.48, 0.5, 0.6) * 0.9;
  float late = max(-uOwn[4], 0.0);
  if (bgNight > 0.0) { bgSun *= mix(vec3(1.0), vec3(0.11, 0.15, 0.24), bgNight); bgSky *= mix(vec3(1.0), vec3(0.16, 0.2, 0.32), bgNight); }
  if (late > 0.0) { bgSun *= mix(vec3(1.0), vec3(1.25, 0.95, 0.66), late); bgSky *= mix(vec3(1.0), vec3(0.7, 0.68, 0.8), late); }
  vec3 ro, rd;
  float edge = 0.0, ye = 0.0;
  if (!bgB) {
    float S = mix(8.2, 9.4, uSpace), az = 0.66 + 0.05 * sin(uTime * 0.021), el = 0.74;
    bgPx = S / uRes.y;
    vec2 ca = vec2(cos(az), sin(az)), ce = vec2(cos(el), sin(el));
    if (uOwn[5] != 0.0) { float to = el + (uOwn[5] > 0.0 ? 0.7 : 0.4) * uOwn[5]; ce = vec2(cos(to), sin(to)); }
    rd = vec3(ca.y * ce.x, -ce.y, ca.x * ce.x);
    vec3 rt = vec3(ca.x, 0.0, -ca.y), up = cross(rd, rt);
    float sa = az - 1.15 + 0.22 * sway;
    bgL = normalize(vec3(sin(sa) * 0.84, 0.55 - 0.33 * late, cos(sa) * 0.84));
    ro = vec3(0.2, 0.0, 0.3) + (rt * (p.x - 0.03) + up * (p.y + 0.03)) * S - rd * 20.0;
    vec2 run = rd.xz / rd.y, g0 = ro.xz - run * ro.y;
    t = (bgHigh(g0 + run * 1.96, g0 + run) - ro.y) / rd.y; tEnd = -ro.y / rd.y;
  } else {
    float S = mix(7.4, 8.4, uSpace), u0 = 0.65, l0 = -3.0, th = 0.22, fy;
    bgPx = S / uRes.y;
    bgL = normalize(vec3(-0.8 + 0.1 * sway, 0.4 - 0.26 * late, -0.74 + 0.4 * late));
    ro = vec3(0.3 + 0.35 * sin(uTime * 0.019), -0.1, -11.0); rd = normalize(vec3(p.x * S - 0.3, p.y * S, 11.0));
    if (uOwn[5] != 0.0) {
      float D = 11.0 - 6.2 * max(uOwn[5], 0.0), rise = 4.2 * max(-uOwn[5], 0.0);
      ro.z = -D; ro.y += rise; rd = normalize(vec3(p.x * S - 0.3, p.y * S - rise, D));
    }
    t = 11.0 / rd.z; tEnd = 13.0 / rd.z; ground = 2.0;
    if (uOwn[5] > 0.0) { t = -ro.z / rd.z; tEnd = (2.0 - ro.z) / rd.z; }
    float y = ro.y + rd.y * t;
    if (y > u0) fy = u0; else if (y > l0) { fy = l0; bgSf = 1.0; } else { fy = l0 - th - 3.43; bgSf = -1.0; }
    if (y < u0 && y > u0 - th) { edge = 1.0; ye = u0 - y; } else if (y < l0 && y > l0 - th) { edge = 1.0; ye = l0 - y; bgSf = 1.0; }
    ro.y -= fy;
    if (rd.y < -1e-4 && -ro.y / rd.y < tEnd) { tEnd = -ro.y / rd.y; ground = 1.0; }
    if (rd.y > 1e-4 && abs(bgSf) > 0.5 && (3.43 - ro.y) / rd.y < tEnd) { tEnd = (3.43 - ro.y) / rd.y; ground = 3.0; }
    if (edge > 0.5) { tEnd = t; ground = 2.0; }
  }
  // along the ray from place to place, until a pixel is covered
  vec2 c = floor(ro.xz + rd.xz * t), st = vec2(rd.x < 0.0 ? -1.0 : 1.0, rd.z < 0.0 ? -1.0 : 1.0), id = 1.0 / max(abs(rd.xz), 1e-5);
  vec2 tm = (st * (c + 0.5 - ro.xz) + 0.5) * id;
  BgMet base = BgMet(tEnd, 1.0, -1.0, 0.0, vec2(1e3)), m1 = base, m2 = base; int got = 0;
  float a0 = dot(rd.xz, rd.xz);
  for (int i = 0; i < 24; i++) {
    if (i > 11 && bgDye == 0.0) break;
    bgFe(c);
    for (int k = 0; k < 1 && bgAny; k++) bgMeet(ro, rd, a0, false, 0.0);
    vec3 a = bgIn0, b = bgIn1;
    vec2 ha = bgAny && a.y > a.x && a.x < tEnd ? a.xz : vec2(1e4), hb = bgAny && b.y > b.x && b.x < tEnd ? b.xz : vec2(1e4);
    bool sw = hb.x < ha.x;
    bgKeep(m1, m2, got, sw ? hb : ha, c, sw ? 1.0 : 0.0);
    bgKeep(m1, m2, got, sw ? ha : hb, c, sw ? 0.0 : 1.0);
    t = min(tm.x, tm.y);
    if (got > 1 || (got == 1 && m1.cv > 0.97) || t > tEnd) break;
    if (tm.x < tm.y) { tm.x += id.x; c.x += st.x; } else { tm.y += id.y; c.y += st.y; }
  }
  BgSeen s = bgLook(ro, rd, m1, ground);
  if (edge > 0.5 && got == 0) { s.alb = mix(vec3(0.55, 0.38, 0.21), vec3(0.75, 0.57, 0.37), noise(vec2(s.pos.x * 1.1, ye * 30.0))); s.n = normalize(vec3(0.0, bgOff(0.0, 0.05, ye) - smoothstep(0.17, 0.22, ye), -1.0)); }
  bool bare = got == 0;
  vec3 pos = s.pos;
  float pane = bgPane(pos);
  if (bgB && abs(bgSf) > 0.5 && edge < 0.5) {       // the board above throws its own shadow
    float u = max((3.43 - pos.y) / bgL.y, 0.0), z = pos.z + bgL.z * u;
    pane *= 1.0 - smoothstep(-0.02 - 0.05 * u, 0.02 + 0.05 * u, z);
  }
  if (bgB) pane *= mix(1.15, 0.8, sat(pos.x * 0.07 + 0.5));
  vec2 sh = bgShade(pos + s.n * 0.005, s.n.y, pane * dot(s.n, bgL) > 0.0);
  if (edge > 0.5) sh = vec2(1.0);
  if (bgB && bare && ground > 1.5) sh.y *= 1.0 - 0.4 * exp2(-max(pos.y, 0.0) * 5.0);
  if (bgB && bare && ground < 1.5) sh.y *= 1.0 - 0.45 * exp2(-(2.0 - pos.z) * 4.0);
  if (bgB && abs(bgSf) > 0.5) sh.y *= 1.0 - 0.45 * exp2(-max(3.43 - pos.y, 0.0) * 2.5);
  float by = sh.x * smoothstep(0.1, 0.4, dot(s.n, bgL));
  if (bgDraw > 0.0) { sh = mix(sh, vec2(0.75 + 0.25 * sh.x, 0.8 + 0.2 * sh.y), 0.8 * bgDraw); pane = mix(pane, 1.0, bgDraw); }
  vec3 col = bgLight(s, sh, pane), back = m2.c == m1.c && m2.k > -0.5 ? col * 0.7 : m2.k > -0.5 ? mix(vec3(0.6, 0.2, 0.1), vec3(0.4, 0.45, 0.45), m2.key) * (bgSky * (0.5 + 0.3 * by) + bgSun * (0.06 + 0.4 * by) * pane) : (ground < 0.5 ? vec3(0.8, 0.73, 0.64) : vec3(0.55, 0.59, 0.52)) * (bgSky * (0.45 + 0.4 * by) + bgSun * 0.45 * by * pane);
  if (bgDye > 0.0 && m2.k < -0.5) {
    vec3 g = uOwn[3] < 0.0 ? mix(vec3(0.7), uKind[0] * uKind[0], -uOwn[3]) : vec3(0.75);
    back = mix(back, g * (bgSky * (0.45 + 0.4 * by) + bgSun * 0.45 * by * pane), bgDye);
  }
  return screenOf(bare ? col : mix(back, col, m1.cv));
}
