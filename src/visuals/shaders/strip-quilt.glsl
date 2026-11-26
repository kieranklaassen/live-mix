// name: Strip quilt
// a: On the bed
// b: On the line
// what: A quilt pieced by eye from worn denim, red, mustard and cream, its strips nearly lining up, sewn over in fans; it lies on a bed in the low light of a window; or another hangs pegged to a line over a mown field, stirring in the wind with the sun coming through the cloth.
// follows: Each strip stands for a place in the piece: washed pale at rest, it takes back its colour and some of the sound's own as that place sounds. Bands plump and deepen the rows. A hit brightens and puckers one block; a cue sends a slow lit swell along the cloth. The loop gleams along the stitches, keys too. The mix stirs the wind.
// The patch here: its corners, how far and which way the nearest seam is, its block's middle.
bool sqA; // variation a
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
  sqD = 9.0; sqSew = -1.0; sqSeed = 0.0; sqDark = 0.0; sqN = vec2(1, 0);
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
    c = mix(c * (1.0 + 0.15 * slub), c * 0.8 + 0.16, wear * 0.55);
  }
  // washed pale at rest; the colour comes back as it sounds
  float g = dot(c, vec3(0.3, 0.59, 0.11));
  vec3 pale = mix(c, vec3(g), 0.34) * 0.88 + 0.09;
  vec3 rich = 1.06 * mix(mix(vec3(g), c, 1.25), hue * (0.25 + 0.95 * g), 0.5);
  return max(mix(pale, rich, full), 0.01);
}
float sqSt, sqGr; // is there a stitch; how deep in a fold
vec2 sqSl; // how the cloth's face leans
// The quilt at q: its colour, how it leans, its stitches.
vec3 sqQuilt(vec2 q, float px) {
  vec2 waver = 0.006 * sin(q.yx * 9.0 + vec2(1, 4)) + 0.002 * sin(q.yx * 37.0);
  sqPiece(q + waver);
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
  float s = sqA ? 1.0 : 0.62, groove = exp(-f.x / (0.011 * s)), seam = exp(-sqD / (0.011 * s)), gs = sqrt(groove), ss = sqrt(seam);
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
  ro.xz = yaw * ro.xz; rd.xz = yaw * rd.xz;
  float down = -1.0 / min(rd.y, -0.1), t = ro.y * down;
  vec2 q = ro.xz + rd.xz * t;
  float px2 = px * t * 0.75, edge = 0.86 + 0.014 * sin(q.y * 7.0) - q.x;
  vec3 L = vec3(-0.8, 0.46, 0.39), sunC = mix(vec3(1, 0.84, 0.64), vec3(1, 0.95, 0.86), uTone) * (0.96 + 0.12 * uLevel), sky = vec3(0.5, 0.54, 0.61), alb, col = vec3(0);
  // the light of a window: panes that cross slowly, with a branch outside
  vec2 w = vec2(q.x * 0.9 + q.y * 0.42, q.y * 0.8 - q.x * 0.25) + 0.03 * sin(uTime * vec2(0.021, 0.017));
  vec2 pn = abs(fract(w * vec2(1.25, 0.95) + vec2(0.22, 0.6)) - 0.5), lw = w * 4.0 + 0.1 * sin(uTime * vec2(0.23, 0.31));
  float soft = mix(0.05, 0.02, uTone) + 0.03 * uSpace, win = sqIn(0.462, soft, pn.x) * sqIn(0.468, soft, pn.y) * sqIn(0.85, 0.1, w.x);
  win *= 1.0 - 0.6 * smoothstep(0.45, 0.75, noise(lw + 0.35 * sin(lw.yx * 3.1))) * smoothstep(-0.2, 0.6, w.y);
  if (edge < 3.0 * px2) {
    vec2 fl = ro.xz + rd.xz * (ro.y + 0.5) * down;
    float b = (fl.x + 0.1 * fl.y) * 5.0, gap = abs(fract(b) - 0.5);
    col = mix(vec3(0.42, 0.29, 0.19), vec3(0.55, 0.4, 0.27), sqH(floor(b))) * (0.75 + 0.5 * noise(vec2(fl.x * 70.0, fl.y * 3.0 + floor(b) * 7.0))) * sqIn(0.485, 0.015, gap);
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
      sl += sqSl * (1.0 + 0.6 * cq * swell) - vec2(0.2, 1) * cw * swell * 2.6 * cq;
      under = sqGr * (1.0 - 0.6 * exp(over * 12.0));
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
    col = mix(col, alb * (sky * (0.62 + 0.38 * N.y) * under + sunC * (d * (win * 0.84 + uCue * swell * 0.35) * (0.5 + 0.5 * under) + 0.1 * under)), smoothstep(0.0, 3.0 * px2, edge));
  }
  return col;
}
// Behind the line: sky, far trees, a mown field, the prop.
vec3 sqYard(vec2 p, float yl) {
  float px = 1.0 / uRes.y, hz = 0.014 * sin(p.x * 1.7 + 1.0) - 0.3;
  vec2 su = p - vec2(0.45, 0.25);
  vec3 col = mix(vec3(0.96, 0.91, 0.8), vec3(0.56, 0.71, 0.83), smoothstep(-0.35, 0.65, p.y - 0.12 * p.x));
  col = mix(col, vec3(1, 0.95, 0.84), exp(-dot(su, su) * 2.2) * 0.85);
  if (p.y < hz + 0.16) {
    float n1 = noise(vec2(p.x * 4.0, 2.0)), n2 = noise(vec2(p.x * 13.0, 7.0)), n3 = noise(p * 37.0);
    float haze = 0.3 + 0.3 * uSpace, far = hz + 0.04 + 0.06 * n1 + 0.012 * n2, near = hz + 0.006 + 0.05 * n2 * n1 + 0.03 * sqIn(-0.3, 0.6, p.x) + 0.012 * n3;
    col = mix(col, mix(vec3(0.5, 0.6, 0.58), vec3(0.93, 0.89, 0.78), haze), sqIn(0.0, 0.012, p.y - far));
    col = mix(col, mix(vec3(0.27, 0.34, 0.22) * (0.8 + 0.5 * n3), vec3(0.93, 0.89, 0.72), haze * 0.75), sqIn(0.0, 0.009, p.y - near));
    float g = max(hz - p.y, 0.0);
    float blade = noise(vec2(p.x * 150.0, p.y * 30.0 + 9.0 * n2));
    vec3 field = mix(vec3(0.8, 0.74, 0.44), vec3(0.5, 0.52, 0.22), sat(g * 4.2));
    field *= 0.8 + 0.2 * n3 + 0.45 * (blade - 0.4) * sat(g * 9.0);
    field *= mix(vec3(1), vec3(0.5, 0.57, 0.57), smoothstep(0.085, 0.13, g + 0.016 * blade) * sqIn(0.58, 0.08, abs(p.x + 0.12 + g * 0.9)));
    col = mix(col, field, sqIn(0.0, 0.005, p.y - hz - 0.006 * n3));
  }
  float at = p.x - 0.715 + 0.07 * (p.y - 0.36), up = p.y - yl, prop = max(abs(abs(at) - max(0.8 * up, 0.0)) - 0.0065 - 0.0015 * sin(p.y * 31.0), up - 0.025);
  col = mix(col, vec3(0.27, 0.21, 0.17) * (1.0 + 70.0 * clamp(at, -0.01, 0.01)), sqIn(0.0, px, prop));
  col = mix(col, vec3(0.34, 0.31, 0.28), sqIn(0.0022, px, abs(p.y - yl)));
  return col;
}
vec3 sqLine(vec2 p) {
  float px = 1.0 / uRes.y, t = uTime * 0.42 + uTravel * 0.12;
  // the quilt in the wind
  float gust = 0.5 + 0.5 * sin(uTime * 0.13) * sin(uTime * 0.083 + 1.0), yl = 0.36 + 0.022 * p.x * p.x - 0.02 * p.x, s = yl - p.y, hang = sat(s / 0.7), x = p.x;
  x -= s * s * (0.1 + 0.06 * gust);
  float ph = x * 11.0 - t * 2.0 + s * 2.6, ph2 = x * 23.0 - t * 2.9 - s * 4.0, A = hang * (0.5 + 0.3 * gust + 0.25 * uLevel), cq = 4.0 * uCue * (1.0 - uCue), cw = x - mix(-0.6, 0.45, uCue), bump = cq * exp(-cw * cw * 14.0);
  float lean = A * (cos(ph) + 0.4 * cos(ph2)) - bump * cw * 6.0 * hang;
  // between the pegs the edge sags, and folds run down from each peg
  float pg = (p.x + 0.56) / 0.224, pf = abs(fract(pg + 0.5) - 0.5), sag = 0.016 * sin(PI * pf);
  lean -= 0.5 * sin(TAU * pg) * exp(-s * 6.0);
  vec2 q = vec2(x + 0.02 * A * (sin(ph) + 0.3 * sin(ph2)), -(s - sag) * (1.0 + 0.05 * A * sin(ph - 0.6) + 0.05 * bump));
  vec2 in2 = vec2(0.6 - abs(q.x + 0.002 * sin(q.y * 40.0)), min(-q.y, 0.68 + 0.004 * sin(q.x * 30.0) + q.y));
  float edge = min(in2.x, in2.y), on = 1.0 - sqIn(0.0, px, edge);
  vec3 col = on < 1.0 ? sqYard(p, yl) : vec3(0);
  if (on > 0.0) {
    vec3 alb = sqQuilt(q, px);
    vec2 su = p - vec2(0.36, 0.16);
    float sun = exp(-dot(su, su) * 2.6), sharp = mix(0.7, 1.3, uTone);
    float facing = sat(dot(normalize(vec3(-0.9 * lean - 0.8 * sqSl.x, 0.12 - 0.8 * sqSl.y, 1)), vec3(0.7, 0.3, 0.65)));
    float bind = sqIn(0.0115, px, edge);
    alb = mix(alb, vec3(0.5, 0.17, 0.14), bind);
    // light coming through, less at seams and folds
    float allow = 1.0 - 0.45 * sqIn(0.0075, px, sqD) - 0.2 * bind, fold = sat(0.6 + 1.5 * sharp * lean);
    vec3 thru = alb * mix(alb, vec3(1), 0.25) * vec3(1.35, 1.16, 0.84) * (0.32 + 1.05 * sun) * (0.35 + 0.85 * fold) * allow;
    thru *= 1.0 + 0.15 * uLevel + 0.9 * uCue * exp(-cw * cw * 14.0) + 0.15 * uMic;
    vec3 c = alb * vec3(0.52, 0.56, 0.62) * (0.4 + 0.75 * facing) * sqGr + thru * mix(1.0, sqGr, 0.35);
    float run = sqRun((q.x + 0.62) / 1.24);
    c = mix(c, vec3(0.95, 0.9, 0.78) * (0.5 + 0.6 * sun + 0.4 * run + 0.3 * uKeys), sqSt * (0.5 + 0.3 * run + 0.2 * uKeys) * (1.0 - bind));
    // the rim of the cloth catches the sun
    c += vec3(1, 0.85, 0.6) * exp(-edge * 260.0) * 0.35 * sun;
    col = mix(col, c, on);
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
  sqA = uVar < 0.5;
  vec3 c = sqA ? sqBed(p) : sqLine(p);
  return c / (1.0 + max(c - 0.8, 0.0) * 0.6);
}
