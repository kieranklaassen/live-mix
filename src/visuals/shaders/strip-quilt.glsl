// name: Strip quilt
// a: On the bed
// b: On the line
// what: A quilt pieced by eye from worn denim, red, mustard and cream, its strips nearly lining up, sewn over in fans; it lies on a bed in the low light of a window; or another hangs pegged to a line over a mown field, stirring in the wind with the sun coming through the cloth.
// follows: Each strip stands for a place in the piece: washed pale at rest, it takes back its colour and some of the sound's own as that place sounds. Bands plump and deepen the rows. A hit brightens and puckers one block; a cue sends a slow lit swell along the cloth. The loop gleams along the stitches, keys too. The mix stirs the wind.
// own: 0 the piecing: 1 triangles in pinwheels, -1 hexagons; 1 the patches: 1 fine and many, -1 few and great; 2 the cloth: 1 sheer, lit from behind, -1 satin; 3 the dyes: 1 each patch in a sound's colour, -1 two cloths, the drone's and the pad's; 4 the hour: 1 a white winter day, -1 night (a lamp, or a moon); 5 the eye: 1 from straight above (b: close up), -1 low along the cloth (b: far off, a line of quilts); 6 the sewing: 1 bold white stitch in steps, -1 patches stuffed like pillows; 7 the lie: 1 deep folds (b: a hard wind), -1 lie apart
// The patch here: its corners, how far and which way the nearest seam is, its block's middle.
bool sqA; // variation a
float sqWhich; // which quilt along the line
vec2 sqLo, sqHi, sqN, sqMid;
// How far; which cloth; is it dark; is its grain along y; how far inside a mend.
float sqD, sqSeed, sqDark, sqLong, sqSew;
// 1 within w, its edge e soft.
float sqIn(float w, float e, float x) { x = sat((w - x) / (2.0 * e) + 0.5); return x * x * (3.0 - 2.0 * x); }
float sqH(float n) { n = fract(n * 0.1031 + 0.137); n *= n + 33.33; n *= n + n; return fract(n); }
// Strips of uneven width side by side, w wide on average, each cut by eye so that it leans.
void sqBars(vec2 q, vec2 ax, float w, float seed) {
  float u = dot(q, ax), a = dot(sqLo, ax), b = dot(sqHi, ax), o = dot(q - 0.5 * (sqLo + sqHi), ax.yx), id = 0.0, n = max(floor((b - a) / w + 0.5), 1.0), each = (b - a) / n;
  if (n > 1.5) {
  float k = clamp(floor((u - a) / each + 0.5), 1.0, n - 1.0);
  float h = sqH(seed + k * 1.73), pa = a + each * (k + 0.55 * h - 0.27), da = u - pa - 0.13 * (fract(h * 37.0) - 0.5) * o, s = da > 0.0 ? 1.0 : -1.0, k2 = k + s;
  h = sqH(seed + k2 * 1.73);
  float pb = a + each * (k2 + 0.55 * h - 0.27), db = u - pb - 0.13 * (fract(h * 37.0) - 0.5) * o;
  bool two = k2 > 0.5 && k2 < n - 0.5, past = two && db * s > 0.0;
  float near = past ? pb : pa, far = two && !past ? pb : (s > 0.0 ? b : a);
  if (!past && abs(da) < sqD) { sqD = abs(da); sqN = -ax * s; }
  if (two && abs(db) < sqD) { sqD = abs(db); sqN = ax * (past ? -s : s); }
  sqLo += ax * (min(near, far) - a); sqHi += ax * (max(near, far) - b);
  id = k + min(s, 0.0) + (past ? s : 0.0);
  }
  sqSeed = fract(sqSeed + sqH(seed + id * 2.91 + 0.7));
  sqDark = mod(id + floor(seed), 2.0);
}
// Cuts into big blocks: which way, where, what lies before and after (a later cut, or a block from 20 on).
const vec4 sqCuts[11] = vec4[11](
  vec4(0, 0.42, 1, 4), vec4(0, -0.66, 3, 2), vec4(1, -0.4, 5, 22), vec4(1, 0.1, 31, 25), vec4(1, 0.5, 21, 20), vec4(0, -0.2, 24, 23),
  vec4(1, -0.085, 7, 26), vec4(0, -0.33, 32, 8), vec4(0, 0.16, 9, 10), vec4(0, -0.12, 30, 29), vec4(1, -0.36, 28, 27));
// A block: strips 0 upright, 1 lying, 2 round and round; their width, seed, length of pieces in them (0 whole).
const vec4 sqBlocks[13] = vec4[13](
  vec4(1, 0.12, 21, 0), vec4(0, 0.17, 12, 0.75), vec4(2, 0.1, 7, 0.9), vec4(1, 0.1, 34, 0), vec4(0, 0.085, 47, 0), vec4(0, 0.14, 55, 0.45),
  vec4(0, 0.26, 14, 0), vec4(1, 0.066, 23, 0), vec4(2, 0.055, 5, 0.3), vec4(0, 0.1, 33, 0.3), vec4(1, 0.055, 42, 0), vec4(1, 0.1, 62, 0), vec4(0, 0.13, 55, 0.24));
// Where on the quilt we are: how each block is pieced.
void sqPiece(vec2 q) {
 sqD = 9.0; sqSew = -1.0; sqSeed = sqWhich; sqDark = 0.0; sqN = vec2(1, 0);
  if (sqA) { sqLo = vec2(-2.2, -1.5); sqHi = vec2(1.6, 1.3); } else { sqLo = vec2(-0.6, -0.68); sqHi = vec2(0.6, 0); }
  int at = sqA ? 0 : 6;
  for (int i = 0; i < 4; i++) {
  vec4 c = sqCuts[at];
  vec2 ax = vec2(1.0 - c.x, c.x), o = (q - 0.5 * (sqLo + sqHi)) * ax.yx;
  float d = dot(q, ax) - c.y - (sqH(c.y * 91.0) - 0.5) * 0.12 * (o.x + o.y);
  if (abs(d) < sqD) { sqD = abs(d); sqN = -ax * sign(d); }
  if (d > 0.0) sqLo += ax * (c.y - sqLo); else sqHi += ax * (c.y - sqHi);
  at = int(d > 0.0 ? c.w : c.z);
  if (at > 19) break;
  }
  vec4 b = sqBlocks[clamp(at - 20, 0, 12)];
  sqMid = 0.5 * (sqLo + sqHi);
  float seed = b.z, two = -1.0;
  if (b.x > 1.5) {
  // a strip on each side in turn: left, top, right, bottom
  int side = 4; float fi = 0.0; vec2 c = q - sqMid;
  for (int i = 0; i < 5; i++) {
   vec2 sz = sqHi - sqLo;
   if (min(sz.x, sz.y) < b.y * 3.2) break;
   fi = float(i);
   vec4 w = seed + fi * 7.7 + vec4(0, 3.7, 7.4, 11.1), ln = 0.15 * fract(w * 0.317 + 0.1) - 0.075;
   w = b.y * (0.62 + 0.8 * fract(fract(w * 0.618) * 17.31));
   vec4 d = vec4(q.x - sqLo.x, sqHi.y - q.y, sqHi.x - q.x, q.y - sqLo.y) - w - ln * c.yxyx, a = abs(d);
   side = d.x < 0.0 ? 0 : d.y < 0.0 ? 1 : d.z < 0.0 ? 2 : d.w < 0.0 ? 3 : 4;
   a += 9.0 * vec3(side < 1, side < 2, side < 3).xxyz * vec4(0, 1, 1, 1);
   float m = min(min(a.x, a.y), min(a.z, a.w));
   vec4 z = sign(d) * vec4(equal(a, vec4(m)));
   if (m < sqD) { sqD = m; sqN = vec2(z.z - z.x, z.y - z.w); }
   if (side == 0) sqHi.x = sqLo.x + w.x; else sqLo.x += w.x;
   if (side == 1) sqLo.y = sqHi.y - w.y; else if (side > 1) sqHi.y -= w.y;
   if (side == 2) sqLo.x = sqHi.x - w.z; else if (side > 2) sqHi.x -= w.z;
   if (side == 3) sqHi.y = sqLo.y + w.w; else if (side > 3) sqLo.y += w.w;
   if (side < 4) break;
  }
  sqLong = 1.0 - float(side & 1);
  if (side < 4) { two = mod(fi + (side < 2 ? 0.0 : 1.0), 2.0); seed += fi * 5.3 + float(side) * 2.3; }
  else { sqSeed = 0.47; sqDark = 2.0; b.w = 0.0; }
  } else {
  sqBars(q, vec2(1.0 - b.x, b.x), b.y, seed);
  sqLong = 1.0 - b.x; two = sqDark; seed = floor(sqSeed * 47.0) + 1.0;
  }
  if (b.w > 0.0) { sqBars(q, vec2(1.0 - sqLong, sqLong), b.w, seed); if (sqH(sqSeed * 91.0) < 0.85) sqDark = two; }
  // a mend sewn on top, with rows of running stitch
  vec2 m = sqA ? vec2(-0.5, -0.3) : vec2(0.02, -0.44), e = vec2(0.07, 0.058), r = q - m;
  r += 0.13 * vec2(r.y, -r.x) * (uVar * 2.0 - 1.0);
  vec2 k = e - abs(r);
  float d = min(k.x, k.y);
  if (d > 0.0) {
  sqD = sqSew = d; sqN = k.x < k.y ? vec2(sign(r.x), 0.0) : vec2(0.0, sign(r.y));
  sqSeed = 0.83 - 0.71 * uVar; sqDark = uVar; sqLong = 0.0; sqMid = m; sqLo = m - e; sqHi = m + e;
  }
}
// The quilting, in fans swung from the elbow: x how far to the stitch, y along it; g which way it lies.
vec2 sqFan(vec2 q, out vec2 g) {
  const float R = 0.36, W = 0.25, H = 0.235, S = 0.06;
  float edge = 9.0, d = 0.0, al = 0.0; g = vec2(1, 0);
  for (int k = 0; k < 4; k++) {
  float row = floor(q.y / H) - (k < 2 ? 1.0 : 0.0), sh = 0.5 * mod(row, 2.0) * W, ci = ceil((q.x - sh) / W) + ((k & 1) == 0 ? 1.0 : 0.0);
  vec2 v = q - vec2(ci * W + sh, row * H);
  float r = dot(v, v);
  if (r < R * R || k == 3) {
   r = sqrt(r);
   float f = r / S, n = floor(f + 0.5);
   d = abs(f - n) * S; g = v / max(r, 1e-3) * sign(n - f);
   al = atan(v.y, v.x - 1e-4) * max(n, 1.0) * S + n * 0.37;
   if (n < 0.5) d = S * 0.5;
   break;
  }
  edge = min(edge, sqrt(r) - R);
  }
  return vec2(min(edge, d), al);
}
// The worn cloths. l is a place in the grain, full how fully it sounds, hue the colour of what sounds there.
vec3 sqCloth(vec2 l, float full, vec3 hue, float px) {
  float h = fract(sqSeed * 7.13 + 0.17), j = fract(sqSeed * 31.7), fine = sat(1.6 - px * 330.0), slub = (noise(vec2(l.x * 24.0, l.y * 330.0)) - 0.5) * fine;
  float wear = sat((noise(l * 6.5 + sqSeed * 50.0) * 0.8 + 0.35 * slub - 0.38) * 2.8);
  vec3 c;
  if (sqDark > 0.5) {
  // denim new and worn, red, brown drill, black
  c = sqDark > 1.5 ? vec3(0.7, 0.17, 0.12) : h < 0.3 ? vec3(0.13, 0.18, 0.29) + 0.06 * j : h < 0.52 ? vec3(0.25, 0.35, 0.49) + 0.07 * j
   : h < 0.74 ? mix(vec3(0.58, 0.13, 0.11), vec3(0.67, 0.22, 0.14), j) : h < 0.88 ? vec3(0.3, 0.24, 0.2) : vec3(0.21, 0.22, 0.24);
  if (h < 0.52) c += 0.035 * sin((l.x + l.y) * 620.0) * fine;
  if (uOwn[3] != 0.0) c = mix(c, uOwn[3] > 0.0 ? kindColour(floor(h * 4.99)) * (0.55 + 0.4 * j) : uKind[0] * (0.5 + 0.25 * j), abs(uOwn[3]));
  c = mix(c + 0.1 * slub, c * 0.7 + vec3(0.21, 0.2, 0.2), wear * 0.5);
  } else {
  // cream sacking, mustard corduroy, work shirt, ticking, faded red, check
  c = h < 0.26 ? vec3(0.88, 0.83, 0.71) - 0.06 * j : h < 0.46 ? vec3(0.79, 0.56, 0.21) + 0.04 * j : h < 0.62 ? vec3(0.5, 0.6, 0.69) + 0.09 * j
   : h < 0.76 ? vec3(0.87, 0.83, 0.73) : h < 0.88 ? vec3(0.8, 0.5, 0.42) : vec3(0.84, 0.79, 0.68);
  if (h > 0.26 && h < 0.46) c *= 1.0 + 0.1 * sin(l.y * 520.0) * fine;
  if (h > 0.62 && h < 0.76) {
   float u = l.y * 26.0, e = px * 26.0;
   c = mix(c, vec3(0.28, 0.36, 0.5), max(0.8 * sqIn(0.1, e, abs(fract(u) - 0.5)), 0.5 * sqIn(0.03, e, abs(fract(u + 0.2) - 0.5))));
  }
  if (h > 0.88) {
   vec2 k = abs(fract(l * 21.0) - 0.5);
   c = mix(c, vec3(0.62, 0.2, 0.17), 0.45 * (sqIn(0.25, px * 21.0, k.x) + sqIn(0.25, px * 21.0, k.y)));
  }
  if (uOwn[3] != 0.0) c = mix(c, uOwn[3] > 0.0 ? kindColour(floor(fract(h + 0.31) * 4.99)) * (0.85 + 0.3 * j) : mix(uKind[1], vec3(0.95), 0.5) * (0.88 + 0.12 * j), abs(uOwn[3]));
  c = mix(c * (1.0 + 0.15 * slub), c * 0.8 + 0.16, wear * 0.55);
  }
  // washed pale at rest; the colour comes back as it sounds
  float g = dot(c, vec3(0.3, 0.59, 0.11));
  vec3 pale = mix(c, vec3(g), 0.34) * 0.88 + 0.09;
  vec3 rich = 1.06 * mix(mix(vec3(g), c, 1.25), hue * (0.25 + 0.95 * g), 0.5);
  return max(mix(pale, rich, full), 0.01);
}
// The patch when it is a triangle or a hexagon, of size S.
void sqOther(vec2 q, float S) {
 vec2 c, f; float h;
 if (uOwn[0] > 0.0) {
  c = floor(q / S); f = fract(q / S) - 0.5;
  h = hash21(c + 3.7 + sqWhich * 50.0);
  if (h > uOwn[0] * 1.02) return;
  vec2 turn = vec2(1.0, mod(c.x + c.y, 2.0) < 0.5 ? 1.0 : -1.0);
  float side = dot(f, turn), up = side > 0.0 ? 1.0 : 0.0;
  vec2 e = 0.5 - abs(f);
  sqD = S * min(abs(side) * 0.7071, min(e.x, e.y));
  sqN = abs(side) * 0.7071 < min(e.x, e.y) ? -turn * 0.7071 * sign(side) : sign(f) * vec2(e.x < e.y, e.x >= e.y);
  sqMid = (c + 0.5 + turn * (up - 0.5) * 0.34) * S;
  sqDark = mod(up + (turn.y > 0.0 ? 0.0 : mod(c.x, 2.0)), 2.0);
  sqSeed = fract(h * 7.3 + up * 0.37); sqLong = up;
  } else {
  const vec2 k = vec2(1.0, 1.7320508);
  vec2 u = q / S, a = mod(u, k) - 0.5 * k, b = mod(u - 0.5 * k, k) - 0.5 * k;
  f = dot(a, a) < dot(b, b) ? a : b; c = floor((u - f) * 2.0 + 0.5);
  h = hash21(c + 1.3 + sqWhich * 50.0);
  if (h > -uOwn[0] * 1.02) return;
  vec2 g = abs(f);
  float m = dot(g, vec2(0.5, 0.8660254));
  sqD = S * (0.5 - max(g.x, m));
  sqN = g.x > m ? vec2(sign(f.x), 0.0) : vec2(0.5, 0.8660254) * sign(f + 1e-5);
  sqMid = (u - f) * S;
  sqDark = fract(h * 37.0) < 0.12 ? 2.0 : step(0.5, fract(h * 13.7));
  sqSeed = fract(h * 5.1); sqLong = step(0.5, fract(h * 3.3));
  }
 sqSew = -1.0; sqLo = sqMid - 0.2 * S; sqHi = sqMid + 0.2 * S;
}
float sqSt, sqGr; // is there a stitch; how deep in a fold
vec2 sqSl; // how the cloth's face leans
// The quilt at q: its colour, how it leans, its stitches.
vec3 sqQuilt(vec2 q, float px) {
  vec2 waver = 0.006 * sin(q.yx * 9.0 + vec2(1, 4)) + 0.002 * sin(q.yx * 37.0);
 if (uOwn[1] == 0.0) sqPiece(q + waver);
 else {
  // cut larger, or smaller and over again, mirrored
  float k = exp2(uOwn[1] * 1.1);
  vec2 c = sqA ? vec2(-0.2, 0.0) : vec2(0.0, -0.34), h = sqA ? vec2(1.4, 1.25) : vec2(0.6, 0.34), u = (q + waver - c) * k + h, w = k > 1.0 ? mod(u, 4.0 * h) - 2.0 * h : u, z = k > 1.0 ? vec2(w.x < 0.0 ? -1.0 : 1.0, w.y < 0.0 ? -1.0 : 1.0) : vec2(1.0);
  sqPiece(w * z - h + c);
  sqN *= z; sqD /= k; sqSew /= k;
  vec2 off = u - w - h;
  z /= k; c = h * z + off / k + c - c * z;
 sqMid = sqMid * z + c; sqLo = sqLo * z + c; sqHi = sqHi * z + c;
 sqMid = mix(sqMid, 0.5 * (sqLo + sqHi), min(abs(uOwn[1]) * 4.0, 1.0));
  }
 if (uOwn[0] != 0.0) sqOther(q + waver, (sqA ? 0.27 : 0.15) * exp2(-uOwn[1]));
  vec2 mid = 0.5 * (sqLo + sqHi), uv = sqA ? vec2((mid.x + 1.15) / 2.1, (0.95 - mid.y) / 1.55) : vec2((mid.x + 0.62) / 1.24, -mid.y / 0.7);
  vec4 pc = piece(clamp(uv, 0.03, 0.97));
  float row = band(sat(1.0 - uv.y));
  vec3 hue = pc.rgb / max(pc.a, 0.02);
  hue = mix(vec3(0.6), mix(vec3(dot(hue, vec3(0.333))), hue, 0.85), sat(pc.a * 50.0));
  float full = sat(pc.a * (1.1 + 1.2 * uEnergy)), plump = 1.0 + 0.7 * full + 0.8 * row;
  vec2 l = sqLong > 0.5 ? q.yx : q;
  l = (l + (sqH(sqSeed * 77.0) - 0.5) * 0.16 * vec2(l.y, -l.x)) * (sqA ? 1.0 : 1.7) + sqSeed * 9.0;
  // a hit puckers and lights the block nearest a slowly wandering place
  float block = 0.0;
  if (uHits > 0.0) {
  vec2 bw = sqMid - (sqA ? vec2(-0.1, 0.15) : vec2(0, -0.36)) - vec2(0.35, 0.2) * sin(uTime * vec2(0.11, 0.083));
  block = uHits * exp(-dot(bw, bw) * (sqA ? 16.0 : 30.0));
  hue = mix(hue, uKind[4], block * 0.6);
  }
  full = sat(full + 0.25 * row * uEnergy + block * 0.6);
  vec3 alb = sqCloth(l, full, hue, px);
  alb *= 1.0 + 0.55 * block;
  vec2 g, f = sqFan(sqA ? q + 2.0 * waver.yx : q * 1.9 + 4.0 * waver.yx + vec2(0.3, 0.1), g);
  if (uVar > 0.5) f /= 1.9;
 float s = sqA ? 1.0 : 0.62, groove = exp(-f.x / (0.011 * s)), seam = exp(-sqD / (0.011 * s));
 if (uOwn[6] != 0.0 || uOwn[2] > 0.0) groove *= 1.0 - max(uOwn[6] < 0.0 ? -uOwn[6] : 0.6 * uOwn[6], 0.8 * uOwn[2]);
 float gs = sqrt(groove), ss = sqrt(seam);
  // and the little gathers the thread pulls up
  float ga = noise(vec2(f.y * 95.0 / s, f.x * 26.0)) - 0.5, ga2 = noise(q * 55.0 / s + 4.0) - 0.5;
  vec2 sn = vec2(sqN.y, -sqN.x);
  sqSl = -(g * groove * 0.42 + sqN * seam * 0.6) * plump + (vec2(-g.y, g.x) * ga * 0.6 * gs + vec2(ga2, -ga) * 0.2) * plump;
  sqSl += sn * sin(dot(q, sn) * 190.0 / s + 9.0 * ga2) * 0.22 * ss;
  if (uHits > 0.0) {
  vec2 bq = q - sqMid; float bl = length(bq) + 1e-3, hp = 4.0 * (1.0 - uHits);
  sqSl += (vec2(-bq.y, bq.x) * sin(atan(bq.y, bq.x - 1e-4) * 15.0 + 2.0 * ga2) * smoothstep(0.02, 0.14, bl) * 0.5 + bq * 0.4) / bl * hp * block;
  }
  float th = 0.0021 * s + 0.15 * px, da = sqIn(0.3, 0.03, abs(fract(f.y / (0.021 * s)) - 0.5));
  sqSt = sqIn(th, px, f.x) * da;
  if (sqSew > 0.0) {
  vec2 m = (q - mid) / (0.018 * s);
  float d2 = abs(fract(m.x + 0.5 * mod(floor(m.y), 2.0)) - 0.5);
  sqSt = max(sqIn(th, px, abs(fract(m.y) - 0.5) * 0.018 * s) * sqIn(0.29, 0.03, d2) * step(0.008 * s, sqSew), sqIn(th, px, abs(sqSew - 0.008 * s)) * da);
  }
  sqGr = 1.0 - 0.28 * groove - 0.4 * seam;
 if (uOwn[6] > 0.0) {
  float S = 0.044 * s; vec2 u = q / S, n = floor(u + 0.5), m = floor(u);
  vec2 over = vec2(mod(m.y + floor(2.0 * hash11(n.x + 40.0)), 2.0), mod(m.x + floor(2.0 * hash11(n.y + 7.0)), 2.0));
  vec2 d = abs(u - n), al = abs(fract(u.yx) - 0.5);
  float e = px / S, t = max(sqIn(0.13, e, d.x) * sqIn(0.43, e + 0.05, al.x) * over.x, sqIn(0.13, e, d.y) * sqIn(0.43, e + 0.05, al.y) * over.y);
  sqSt = mix(sqSt, t, uOwn[6]);
 } else if (uOwn[6] < 0.0) {
  float w = (sqA ? 0.04 : 0.02) * exp2(-0.3 * uOwn[1]) * (1.0 + 0.7 * min(uOwn[7], 0.0)), b = exp(-sqD / w);
  sqSl = mix(sqSl, -sqN * b * 1.35 * (1.0 + 0.4 * row + 0.3 * full) + 0.4 * sqSl, -uOwn[6]);
  sqGr *= 1.0 + uOwn[6] * 0.55 * b * b;
  sqSt *= 1.0 + uOwn[6];
  }
 if (uOwn[2] < 0.0) {
  float g0 = dot(alb, vec3(0.3, 0.59, 0.11));
  alb = mix(alb, max(mix(vec3(g0), alb, 1.45), 0.01) * (0.35 + 0.65 * g0), -uOwn[2]);
  sqSl += -uOwn[2] * 0.14 * (vec2(noise(l * vec2(9.0, 3.0)), noise(l.yx * vec2(4.0, 12.0) + 8.0)) - 0.5);
  }

  return alb;
}
// How brightly the stitches at x shine as the playhead goes by.
float sqRun(float x) {
  x -= uLoop;
  return exp(-x * x * 500.0) * smoothstep(0.0, 0.06, uLoop) * sqIn(0.97, 0.03, uLoop);
}
vec3 sqBed(vec2 p) {
  float px = 1.0 / uRes.y;
  vec3 ro = vec3(0, 1.5, -1.02), rd = normalize(vec3(p, 1.35));
  rd.yz = rot(-0.97) * rd.yz;
  mat2 yaw = rot(0.2 + 0.006 * sin(uTime * 0.05));
 if (uOwn[5] != 0.0) {
  float above = max(uOwn[5], 0.0), low = max(-uOwn[5], 0.0);
  ro = mix(ro, vec3(-0.25, 2.0, -0.12), above); ro = mix(ro, vec3(-0.15, 0.5, -0.75), low);
  rd = normalize(vec3(p, mix(1.35, 1.25, low))); rd.yz = rot(-0.97 - 0.58 * above + 0.36 * low) * rd.yz;
  yaw = rot((0.2 + 0.006 * sin(uTime * 0.05)) * (1.0 - 0.75 * above + 0.5 * low));
  }
  ro.xz = yaw * ro.xz; rd.xz = yaw * rd.xz;
  float down = -1.0 / min(rd.y, -0.1), t = ro.y * down;
  vec2 q = ro.xz + rd.xz * t;
 vec2 fold = vec2(0.0); float deep = 0.0, apart = 0.0;
 if (uOwn[7] > 0.0) {
  vec2 q0 = q, dr = rd.xz * down;
  for (int i = 0; i < 4; i++) {
   vec2 k = q * vec2(1.9, 1.2) + 0.03 * sin(uTime * vec2(0.13, 0.1));
   k += 0.55 * sin(k.yx * 1.4 + vec2(0.3, 1.9));
   float a = k.x * 2.1 + k.y * 1.5, b = k.x * 1.1 - k.y * 2.6 + 1.0, sa = 0.5 + 0.5 * sin(a), sb = 0.5 + 0.5 * sin(b);
   deep = 0.17 * sa * sa + 0.1 * sb * sb;
   fold = 0.17 * sa * cos(a) * vec2(4.0, 1.8) + 0.1 * sb * cos(b) * vec2(2.1, -3.1);
   q = q0 - dr * deep * uOwn[7];
  }
  fold *= uOwn[7]; deep *= uOwn[7] / 0.27;
  }
  float px2 = px * t * 0.75, edge = 0.86 + 0.014 * sin(q.y * 7.0) - q.x;
  vec3 L = vec3(-0.8, 0.46, 0.39), sunC = mix(vec3(1, 0.84, 0.64), vec3(1, 0.95, 0.86), uTone) * (0.96 + 0.12 * uLevel), sky = vec3(0.5, 0.54, 0.61), alb, col = vec3(0);
  // the light of a window: panes that cross slowly, with a branch outside
  vec2 w = vec2(q.x * 0.9 + q.y * 0.42, q.y * 0.8 - q.x * 0.25) + 0.03 * sin(uTime * vec2(0.021, 0.017));
  vec2 pn = abs(fract(w * vec2(1.25, 0.95) + vec2(0.22, 0.6)) - 0.5), lw = w * 4.0 + 0.1 * sin(uTime * vec2(0.23, 0.31));
  float soft = mix(0.05, 0.02, uTone) + 0.03 * uSpace, win = sqIn(0.462, soft, pn.x) * sqIn(0.468, soft, pn.y) * sqIn(0.85, 0.1, w.x);
  win *= 1.0 - 0.6 * smoothstep(0.45, 0.75, noise(lw + 0.35 * sin(lw.yx * 3.1))) * smoothstep(-0.2, 0.6, w.y);
 float day = max(uOwn[4], 0.0), night = max(-uOwn[4], 0.0), sheer = max(uOwn[2], 0.0);
 if (day > 0.0) { win = mix(win, 0.6 - 0.12 * q.x, day); sky = mix(sky, vec3(0.62), day); sunC = mix(sunC, vec3(0.95, 0.96, 1.0), day); }
 if (night > 0.0) {
  vec2 lp = q - vec2(-0.35, 0.35);
  win = mix(win, 1.15 * exp(-dot(lp, lp) * 1.35), night); sky = mix(sky, vec3(0.06, 0.085, 0.14), night); sunC = mix(sunC, vec3(1.12, 0.72, 0.4), night);
  L = normalize(mix(L, vec3(-lp.x, 0.62, -lp.y), night));
  }
  if (edge < 3.0 * px2) {
  vec2 fl = ro.xz + rd.xz * (ro.y + 0.5) * down;
  float b = (fl.x + 0.1 * fl.y) * 5.0, gap = abs(fract(b) - 0.5);
  col = mix(vec3(0.42, 0.29, 0.19), vec3(0.55, 0.4, 0.27), sqH(floor(b))) * (0.75 + 0.5 * noise(vec2(fl.x * 70.0, fl.y * 3.0 + floor(b) * 7.0))) * sqIn(0.485, 0.015, gap);
  if (day > 0.0) col = mix(col, 0.35 + 0.75 * col, day);
  col *= mix(0.2, 0.75, sat(-edge * 2.2)) * sky + 0.7 * sunC * win * smoothstep(0.1, 0.4, -edge);
  }
  if (edge > 0.0) {
  // a cue: a long swell under the cloth, from the foot to the head
  float cq = 4.0 * uCue * (1.0 - uCue), cw = q.y + 0.2 * q.x - mix(0.9, -0.35, uCue), swell = uCue > 0.0 ? exp(-cw * cw * 7.0) : 0.0, under = 1.0;
  vec2 sl = 0.07 * sin(q.yx * 4.1 + 1.3 * sin(q * 3.0) + vec2(3.0, 1.0 + 0.3 * uTime)) * (1.0 + uMic);
  // the head of the bed: quilt turned back, sheet, pillow
  float over = q.y - 0.8 - 0.012 * sin(q.x * 5.0) - 0.03 * q.x;
  if (over < 0.0) {
   alb = sqQuilt(q, px2);
   sl += fold;
   if (uOwn[7] < 0.0) {
  float g = sqD + 0.03 * uOwn[7];
  apart = sqIn(0.0, px2, g);
  sqSl -= sqN * 1.5 * exp(-max(g, 0.0) * 90.0) * -uOwn[7];
   }
   sl += sqSl * (1.0 + 0.6 * cq * swell) - vec2(0.2, 1) * cw * swell * 2.6 * cq;
   under = sqGr * (1.0 - 0.6 * exp(over * 12.0));
   if (uOwn[7] > 0.0) under *= mix(1.0, 0.35 + 0.65 * smoothstep(0.0, 0.55, deep), uOwn[7]);
   float run = sqRun((q.x + 1.15) / 2.1);
   alb = mix(alb, vec3(0.93, 0.89, 0.78), sqSt * (0.72 + 0.28 * run));
   under += sqSt * (0.2 + (0.8 * run + 0.4 * uKeys) * (0.4 + uEnergy));
  } else {
   vec2 k = vec2(q.x * 3.0 + q.y * 5.0, q.y * 9.0 - q.x * 1.5);
   sl += vec2(0.5, 1) * (noise(k) - noise(k + 0.12)) * 2.0;
   if (over < 0.15) {
    float e = px2 * 22.0, rl = over / 0.15 - 0.5;
    alb = mix(vec3(0.83, 0.79, 0.7), vec3(0.45, 0.53, 0.64), 0.65 * sqIn(0.1, e, abs(fract(q.x * 22.0 + q.y) - 0.5)));
    sl.y += rl * 1.2 + 4.0 * rl * rl * rl;
    under = 1.0 - 0.4 * exp(-over * 40.0);
   } else {
    float pil = over - 0.36 - 0.04 * q.x - 0.02 * sin(q.x * 4.0), dp = exp(-abs(pil) * 16.0);
    alb = vec3(0.77, 0.75, 0.71);
    under = 1.0 - 0.55 * exp(-(over - 0.15) * 22.0);
    if (pil > 0.0) sl.y -= 1.2 * exp(-pil * 9.0); else { under *= 1.0 - 0.6 * dp; win *= 1.0 - 0.7 * dp; }
   }
  }
  sl.x += 0.9 * exp(-edge * 14.0);
  vec3 N = normalize(vec3(-sl.x, 1, -sl.y));
  float d = max(dot(N, L), 0.0) / 0.46;
  d *= 1.22 / (1.0 + 0.22 * d);
  vec3 cloth = vec3(0.0);
  if (uOwn[2] < 0.0) {
   float nh = max(dot(N, normalize(L - rd)), 0.0);
   cloth = -uOwn[2] * (alb * 0.8 + 0.22) * (pow(nh, 14.0) * 0.9 + pow(nh, 70.0) * 0.5) * (sunC * (0.3 + 0.7 * win)) * step(over, 0.0);
  }
  if (sheer > 0.0 && over < 0.0) {
   float lap = 1.0 - 0.5 * sqIn(0.011, px2, sqD);
   vec3 lit = alb * mix(alb, vec3(1.0), 0.45) * (1.0 + 0.6 * win) * lap * (1.0 + 0.5 * uCue * swell) * mix(vec3(1.2), vec3(1.2, 0.9, 0.6), night);
   col = mix(col, mix(alb * (sky * under + sunC * d * win * 0.84), lit, sheer), smoothstep(0.0, 3.0 * px2, edge)) + sqSt * 0.1 * sheer;
  } else col = mix(col, cloth + alb * (sky * (0.62 + 0.38 * N.y) * under + sunC * (d * (win * 0.84 + uCue * swell * 0.35) * (0.5 + 0.5 * under) + 0.1 * under)), smoothstep(0.0, 3.0 * px2, edge));
  }
 if (uOwn[7] < 0.0) col = mix(col, (0.05 + day * vec3(0.69, 0.66, 0.6)) * (0.5 + 0.5 * win), apart * sqIn(0.0, px2, -edge));
  return col;
}
// Behind the line: sky, far trees, a mown field, the prop.
vec3 sqYard(vec2 p, vec2 pw, float yl, float post) {
  float px = 1.0 / uRes.y, hz = 0.014 * sin(p.x * 1.7 + 1.0) - 0.3;
  vec2 su = p - vec2(0.45, 0.25);
  vec3 col = mix(vec3(0.96, 0.91, 0.8), vec3(0.56, 0.71, 0.83), smoothstep(-0.35, 0.65, p.y - 0.12 * p.x));
  col = mix(col, vec3(1, 0.95, 0.84), exp(-dot(su, su) * 2.2) * 0.85);
 float snow = max(uOwn[4], 0.0), night = max(-uOwn[4], 0.0);
 if (snow > 0.0) col = mix(col, mix(vec3(0.9), vec3(0.74, 0.78, 0.82), smoothstep(-0.3, 0.6, p.y)), snow);
 if (night > 0.0) {
  vec2 m = p - vec2(-0.73, 0.27), k = p * 34.0, c = floor(k), o = hash22(c) - 0.5;
  k -= c + 0.5 + 0.7 * o;
  float l = length(m), st = exp(-dot(k, k) * 260.0) * step(0.72, hash21(c + 9.0));
  vec3 n = mix(vec3(0.2, 0.22, 0.27), vec3(0.03, 0.05, 0.1), smoothstep(-0.35, 0.5, p.y)) + st * 0.6;
  n += vec3(0.55, 0.6, 0.66) * exp(-l * l * 9.0) * 0.45 + vec3(0.95, 0.92, 0.82) * sqIn(0.052, px, l) * 0.75;
  col = mix(col, n, night);
  }
  if (p.y < hz + 0.16) {
  float n1 = noise(vec2(p.x * 4.0, 2.0)), n2 = noise(vec2(p.x * 13.0, 7.0)), n3 = noise(p * 37.0);
  float haze = 0.3 + 0.3 * uSpace, far = hz + 0.04 + 0.06 * n1 + 0.012 * n2, near = hz + 0.006 + 0.05 * n2 * n1 + 0.03 * sqIn(-0.3, 0.6, p.x) + 0.012 * n3;
  col = mix(col, mix(vec3(0.5, 0.6, 0.58), vec3(0.93, 0.89, 0.78), haze), sqIn(0.0, 0.012, p.y - far));
  col = mix(col, mix(vec3(0.27, 0.34, 0.22) * (0.8 + 0.5 * n3), vec3(0.93, 0.89, 0.72), haze * 0.75), sqIn(0.0, 0.009, p.y - near));
  float g = max(hz - p.y, 0.0);
  float blade = noise(vec2(p.x * 150.0, p.y * 30.0 + 9.0 * n2));
  vec3 field = mix(vec3(0.8, 0.74, 0.44), vec3(0.5, 0.52, 0.22), sat(g * 4.2));
  field *= 0.8 + 0.2 * n3 + 0.45 * (blade - 0.4) * sat(g * 9.0);
  field *= mix(vec3(1), vec3(0.5, 0.57, 0.57), smoothstep(0.085, 0.13, g + 0.016 * blade) * sqIn(0.58, 0.08, abs(p.x + 0.12 + g * 0.9)) * (1.0 + 0.8 * min(uOwn[5], 0.0)));
  float ground = sqIn(0.0, 0.005, p.y - hz - 0.006 * n3);
  if (snow > 0.0) {
   vec3 w = mix(vec3(0.86, 0.88, 0.9), vec3(0.96, 0.955, 0.94), sat(g * 4.0)) * (0.96 + 0.07 * n2);
   w *= mix(vec3(1.0), vec3(0.72, 0.8, 0.9), smoothstep(0.07, 0.15, g) * sqIn(0.62, 0.15, abs(p.x + 0.12 + g * 0.9)) * (1.0 + min(uOwn[5], 0.0)));
   field = mix(field, w, snow);
   col = mix(col, mix(col, vec3(0.8, 0.83, 0.86), 0.45), snow * (1.0 - ground));
  }
  col = mix(col, field, ground);
  if (night > 0.0) col = mix(col, dot(col, vec3(0.3, 0.5, 0.2)) * vec3(0.17, 0.22, 0.3), night * sqIn(hz + 0.09, 0.05, p.y));
  }
 p = pw;
  float at = p.x + post - 0.715 + 0.07 * (p.y - 0.36), up = p.y - yl, prop = max(abs(abs(at) - max(0.8 * up, 0.0)) - 0.0065 - 0.0015 * sin(p.y * 31.0), up - 0.025);
  col = mix(col, vec3(0.27, 0.21, 0.17) * (1.0 + 70.0 * clamp(at, -0.01, 0.01)), sqIn(0.0, px, prop));
  col = mix(col, vec3(0.34, 0.31, 0.28), sqIn(0.0022, px, abs(p.y - yl)));
  return col;
}
vec3 sqLine(vec2 p) {
  float px = 1.0 / uRes.y, t = uTime * 0.42 + uTravel * 0.12;
 vec2 eye = p; float post = 0.0;
 float blow = max(uOwn[7], 0.0);
 if (uOwn[5] > 0.0) { p = mix(p, p * 0.46 + vec2(-0.02, 0.06), uOwn[5]); px *= 1.0 - 0.54 * uOwn[5]; }
 if (uOwn[5] < 0.0) {
  float k = 1.0 - 1.35 * uOwn[5]; p = p * k; p.y -= 0.2 * uOwn[5]; px *= k;
  float low = max(0.4 - p.y, 0.0), n = floor((p.x + 0.66 - 0.12 * low * low * step(low, 0.9)) / 1.32);
  post = 1.32 * n;
  if (n != 0.0) { sqWhich = fract(0.137 + 0.6180 * n); p.x -= post; }
  }
  // the quilt in the wind
 float gust = 0.5 + 0.5 * sin(uTime * 0.13) * sin(uTime * 0.083 + 1.0), yl = 0.36 + 0.022 * p.x * p.x - 0.02 * p.x * (1.0 + min(uOwn[5], 0.0)), s = yl - p.y, hang = sat(s / 0.7), x = p.x;
  x -= s * s * (0.1 + 0.06 * gust);
  float ph = x * 11.0 - t * 2.0 + s * 2.6, ph2 = x * 23.0 - t * 2.9 - s * 4.0, A = hang * (0.5 + 0.3 * gust + 0.25 * uLevel), cq = 4.0 * uCue * (1.0 - uCue), cw = x - mix(-0.6, 0.45, uCue), bump = cq * exp(-cw * cw * 14.0);
 if (blow > 0.0) { A *= 1.0 + 1.4 * blow; x += blow * s * (0.26 + 0.1 * sin(t * 1.3 + s * 3.0)); }
  float lean = A * (cos(ph) + 0.4 * cos(ph2)) - bump * cw * 6.0 * hang;
  // between the pegs the edge sags, and folds run down from each peg
  float pg = (p.x + 0.56) / 0.224, pf = abs(fract(pg + 0.5) - 0.5), sag = 0.016 * sin(PI * pf);
  lean -= 0.5 * sin(TAU * pg) * exp(-s * 6.0);
 if (blow > 0.0) s *= 1.0 + blow * (0.3 + 0.2 * sin(x * 4.0 - t * 1.7)) * smoothstep(0.0, 0.6, s);
  vec2 q = vec2(x + 0.02 * A * (sin(ph) + 0.3 * sin(ph2)), -(s - sag) * (1.0 + 0.05 * A * sin(ph - 0.6) + 0.05 * bump));
  vec2 in2 = vec2(0.6 - abs(q.x + 0.002 * sin(q.y * 40.0)), min(-q.y, 0.68 + 0.004 * sin(q.x * 30.0) + q.y));
 float edge = min(in2.x, in2.y);
 vec3 alb = vec3(0.0);
 if (uOwn[7] < 0.0) { alb = sqQuilt(q, px); edge = min(edge, sqD + 0.016 * uOwn[7]); }
 float on = 1.0 - sqIn(0.0, px, edge);
 vec3 col = on < 1.0 || uOwn[2] > 0.0 ? sqYard(eye, p, yl, post) : vec3(0);
  if (on > 0.0) {
  if (uOwn[7] >= 0.0) alb = sqQuilt(q, px);
  vec2 su = p - vec2(0.36, 0.16);
  float sun = exp(-dot(su, su) * 2.6), sharp = mix(0.7, 1.3, uTone);
  float facing = sat(dot(normalize(vec3(-0.9 * lean - 0.8 * sqSl.x, 0.12 - 0.8 * sqSl.y, 1)), vec3(0.7, 0.3, 0.65)));
  float bind = sqIn(0.0115, px, edge);
  if (uOwn[7] < 0.0) bind *= 1.0 + uOwn[7];
  alb = mix(alb, mix(vec3(0.5, 0.17, 0.14), uKind[0] * 0.75, abs(uOwn[3])), bind);
  // light coming through, less at seams and folds
  float allow = 1.0 - 0.45 * sqIn(0.0075, px, sqD) - 0.2 * bind, fold = sat(0.6 + 1.5 * sharp * lean);
  vec3 thru = alb * mix(alb, vec3(1), 0.25) * vec3(1.35, 1.16, 0.84) * (0.32 + 1.05 * sun) * (0.35 + 0.85 * fold) * allow;
  thru *= 1.0 + 0.15 * uLevel + 0.9 * uCue * exp(-cw * cw * 14.0) + 0.15 * uMic;
  vec3 c = alb * vec3(0.52, 0.56, 0.62) * (0.4 + 0.75 * facing) * sqGr + thru * mix(1.0, sqGr, 0.35);
  if (uOwn[4] > 0.0) c = mix(c, alb * vec3(0.62, 0.65, 0.7) * (0.7 + 0.45 * facing) * sqGr + thru * 0.22, uOwn[4]);
  if (uOwn[4] < 0.0) {
   vec2 mo = p - vec2(-0.6, 0.2);
   c = mix(c, alb * vec3(0.3, 0.36, 0.45) * (0.4 + 1.2 * facing) * sqGr + thru * vec3(0.4, 0.48, 0.6) * (0.2 + 0.9 * exp(-dot(mo, mo) * 1.6)) * (1.0 + 0.6 * uLevel), -uOwn[4]);
  }
  if (uOwn[2] < 0.0) {
   float nh = max(dot(normalize(vec3(-1.1 * lean - 0.9 * sqSl.x, 0.1 - 0.9 * sqSl.y, 1.0)), vec3(0.37, 0.41, 0.83)), 0.0);
   c = mix(c, alb * (0.25 + 0.9 * facing) * sqGr + (alb * 0.9 + 0.2) * (0.75 * pow(nh, 12.0) + 0.4 * pow(nh, 60.0)), -uOwn[2] * 0.85) * (1.0 - min(uOwn[4], 0.0) * uOwn[2] * 0.45);
  }
  if (uOwn[2] > 0.0) {
   float lap = sqIn(0.0085, px, sqD);
   vec3 air = col * mix(vec3(1.0), alb * 1.3, 0.72) * (0.86 + 0.3 * fold);
   c = mix(c, mix(air, c * 0.8, 0.12 + 0.5 * lap), uOwn[2]);
  }
  float run = sqRun((q.x + 0.62) / 1.24);
  c = mix(c, vec3(0.95, 0.9, 0.78) * (0.5 + 0.6 * sun + 0.4 * run + 0.3 * uKeys), sqSt * (0.5 + 0.3 * run + 0.2 * uKeys) * (1.0 - bind) * (1.0 + 0.5 * max(uOwn[6], 0.0)) * (1.0 + 0.6 * min(uOwn[4], 0.0)));
  // the rim of the cloth catches the sun
  c += vec3(1, 0.85, 0.6) * exp(-edge * 260.0) * 0.35 * sun * (1.0 - 0.8 * abs(uOwn[4]));
  col = mix(col, c, on);
  }
 if (uOwn[4] > 0.0) {
  for (int i = 0; i < 2; i++) {
   float z = 9.0 + 8.0 * float(i);
   vec2 k = eye * z + vec2(uTime * 0.12, uTime * (0.9 + 0.3 * float(i))), c = floor(k), o = hash22(c + 17.0 * float(i)) - 0.5;
   vec2 d = k - c - 0.5 - 0.6 * o;
   col = mix(col, vec3(0.98), uOwn[4] * 0.75 * smoothstep(0.1, 0.03, length(d)) * step(0.45, hash21(c + 3.3)));
  }
  }
  // pegs
  float k = floor(pg + 0.5);
  if (k > -0.5 && k < 5.5) {
  vec2 m = vec2((fract(pg + 0.5) - 0.5) * 0.224 + 0.05 * sin(k * 5.0) * (p.y - yl), p.y - yl), e = abs(m + vec2(0, 0.008)) - vec2(0.0055, 0.026);
  col = mix(col, vec3(0.78, 0.63, 0.43) * (0.75 + 45.0 * m.x) * (1.0 - 0.4 * sqIn(0.0005, px, abs(m.x))), sqIn(0.0, px, max(e.x, e.y)));
  }
  return col;
}
vec3 render(vec2 p) {
 sqA = uVar < 0.5; sqWhich = 0.0;
  vec3 c = sqA ? sqBed(p) : sqLine(p);
  return c / (1.0 + max(c - 0.8, 0.0) * 0.6);
}
