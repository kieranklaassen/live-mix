// name: Sun prints
// a: Ferns
// b: Seaweed
// what: Plants laid on paper brushed with sun-sensitive blue: two fern fronds crossing, oats, a head of tiny flowers and thin petals, white where they lay close, soft where they lifted, paler where they overlap; or seaweeds on the same blue: a ruffled blade, forked ribbons and weeds that branch out to hair.
// follows: Each kind is a plant that presses closer, whiter and sharper as it sounds and lifts to a soft blur after; the spectrum climbs the fronds. A fuller mix deepens the blue, the piece stains it faintly, the loop sends a band of sun across. A hit lays a petal or two, a cue runs water down the sheet. Keys whiten the flowers and hairs; a voice lifts the oats.
// own: 0 the colour: 1 the coat dyed in the drone's and pad's colours, -1 no coat, each plant inked in its sound's colour on pale paper; 1 the sheet: 1 the coat runs past the picture, -1 a round coat; 2 1 strewn with many small sprigs, -1 one plant alone; 3 1 fine and feathery, -1 broad and few like cut paper; 4 which plants: 1 grasses and flower heads (b: hair weeds), -1 ferns only (b: ribbons and kelp); 5 1 wet, the colour run down, -1 old, creased and spotted; 6 1 a great disc laid behind, -1 hills of torn paper; 7 1 sways as in a current, -1 drawn in outline
float suKeep, suFine;   // how much of a plant is laid; how fine it is
vec3 suInk, suDye;       // the ink laid so far where plants are inked; the ink of the plant in hand
float suPx, suHalf, suWide; // a pixel; half the width of the picture; how far apart the plants lie
float suT, suLv, suSoft;    // how much sun still reaches the paper; how much a plant sounds; how far it blurs when lifted
vec3 suTint, suStain;       // the stain on the paper; the stain of the plant in hand
vec4 suWarp;                // how the water bent the weed before it dried
vec2 suSun;                 // which way a lifted plant throws its shade
float suCov(float d, float b) {
  float a = 1.0 - smoothstep(-b, b, d);
  if (uOwn[7] < 0.0) { float w = 0.0018 + 0.6 * b; a *= 1.0 + 0.95 * uOwn[7] * smoothstep(-w,-2.0 * w, d); }
  return a;
}
float suLine(float d, float w, float b) { return (1.0 - smoothstep(w - b, w + b, d)) * w / (w + 0.8 * max(b - w,0.0)); }
// Takes up a plant of one kind of sound.
float suBegin(int k) {
  vec3 c = uKind[k];
  suStain = mix(vec3(1.0), c / max(max(c.r, max(c.g, c.b)),0.05),0.75);
  suDye = c * (0.35 + 0.65 * c);
  return suLv = sat(1.15 * (k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits));
}
// Lays something on the sheet: a is the light it keeps off.
void suLay(float a) {
  a = sat(a) * suKeep;
  if (uOwn[0] < 0.0) suInk = mix(suInk, suDye, a / max(1.0 - suT * (1.0 - a),1e-3));
  suT *= 1.0 - a;
  suTint = mix(suTint, suStain, a * suLv);
}
// The place along a stalk that bends at an even rate, and the place across it.
vec2 suArc(vec2 q, float k) {
  if (abs(k) < 4e-3) k = 4e-3;
  vec2 e = vec2(k * q.x,1.0 - k * q.y);
  return vec2(atan(e.x, e.y),1.0 - length(e)) / k;
}
// The spectrum up a stem, with a swell that climbs.
float suRise(float s, float seed) { return band(s * 0.9) * (0.5 + 1.1 * uEnergy) * (0.55 + 0.45 * sin(s * 9.0 - uTravel * 1.1 + seed)); }
// A fern frond. form 0 is broad in the middle, 1 broad at the foot.
void suFern(vec2 p, vec2 base, float ang, float len, float k, float n, float wide, float form, float seed, int kind) {
  if (suKeep < 0.004) return;
  float lv = suBegin(kind), lift = 1.0 - 0.88 * lv, sw = max(uOwn[7],0.0);
  n *= suFine; wide *= 1.0 - 0.15 * uOwn[3];
  mat2 m = rot(ang + (0.012 + 0.09 * sw) * sin(uTime * 0.11 + seed));
  vec2 q = m * (p - base) / len;
  q += m * suSun * lift * sat(q.x) * 0.5;
  if (q.x < -0.1 || q.x > 1.15 || abs(q.y) > 0.5) return;
  vec2 a = suArc(q, k + (0.03 + 0.5 * sw) * sin(uTime * 0.083 + seed * 2.0));
  if (sw > 0.0) a.y += sw * 0.03 * sin(a.x * 8.0 - uTime * 0.37 + seed) * sat(a.x);
  float s = a.x, d = abs(a.y), side = a.y < 0.0 ? -1.0 : 1.0;
  if (s < -0.06 || s > 1.04 || d > wide * 1.35) return;
  float blur = suPx / len + lift * (0.0025 + 0.013 * s * s) * suSoft + 0.0015 * (1.0 - uTone);
  float lit = suRise(s, seed);
  float op = 0.52 + 0.2 * lv + 0.25 * lit;
  float cot = mix(0.32,0.85, s * s) + 0.1 * form;
  float u = (s - d * cot - 0.5 * d * d) * n + 0.23 * side + seed;
  float i0 = floor(u), f = u - i0;
  float keep = 0.0, rib = 0.0;
  int c = 0;
  do {
    float i = i0 + (c == 0 ? 0.0 : (f < 0.5 ? -1.0 : 1.0));
    float h = hash11(i * 1.7 + side * 31.0 + seed), h2 = fract(h * 57.3), h3 = fract(h * 311.7);
    float sk = (i + 0.5 - 0.23 * side - seed) / n;
    if (sk < 0.14 || sk > 1.0) continue;
    float sn = inversesqrt(1.0 + cot * cot);
    float al = d / sn;
    float env = smoothstep(0.1,0.45 - 0.23 * form, sk) * pow(1.0 - sk,0.75 + 0.15 * form) * (1.45 - 0.35 * form);
    float ln = wide * env * (0.84 + 0.26 * h) * (h3 > 0.93 ? 0.45 : 1.0) + 0.004;
    float b = ((u - i - 0.5) / n) * sn + (h2 - 0.5) * 0.14 * al + (h3 - 0.5) * 0.35 * al * al / ln;
    float t = al / ln;
    if (t > 1.1) continue;
    float ws = 0.5 / n * sn * (1.02 + 0.3 * h2);
    float dl = max(ws * 0.62,0.004), ab = abs(b);
    if (ab > 1.2 * ws + blur) continue;
    float v = (al - ab * 0.55) / dl + (b < 0.0 ? 0.4 : 0.0) + h * 3.0;
    float j = floor(v), x = (v - j - 0.5) * dl;
    float tj = sat((j + 0.5 - h * 3.0) * dl / ln);
    float lw = ws * (1.0 - tj) * (1.0 + 0.75 * tj) * smoothstep(-0.12,0.12, tj) * (0.85 + 0.3 * fract(j * 0.618 + h * 37.0));
    float r = min(0.44 * dl, lw);
    float leaf = length(vec2(x, max(ab - (lw - r),0.0))) - r;
    leaf = min(leaf, ab - 0.28 * ws * (1.0 - t));
    leaf = min(max(leaf, al - ln), d - 0.0035 * (1.0 - s) + 0.02 * (1.0 - smoothstep(0.14,0.2, s)));
    float thick = (0.72 + 0.4 * h3) * (0.86 + 0.5 * sat(1.0 - ab / ws) * (1.0 - t) - 0.14 * sat(x / dl + 0.5));
    keep = 1.0 - (1.0 - keep) * (1.0 - suCov(leaf, blur) * op * thick);
    rib = max(rib, suLine(ab,0.0011 * (1.0 - t) + 0.0003, blur) * step(t,1.0));
    rib = max(rib,0.35 * suLine(abs(x),0.0004, blur) * step(ab, lw));
  } while (++c < 2);
  rib = max(rib, suLine(d, mix(0.0075,0.0018, sqrt(sat(s))),0.6 * blur) * step(s,1.0) * smoothstep(-0.04,-0.03, s));
  suLay(keep);
  suLay(rib * (0.42 + 0.28 * lv));
}
// A stem: the place along it (0 to 1), across it, and how soft it lies.
vec3 suStem(vec2 p, vec2 base, float ang, float len, float k, float seed, float lift) {
  float sw = max(uOwn[7],0.0);
  mat2 m = rot(ang + (0.02 + 0.07 * sw) * sin(uTime * 0.13 + seed));
  vec2 q = m * (p - base) / len;
  q += m * suSun * lift * sat(q.x);
  vec2 a = suArc(q, k + (0.05 + 0.4 * sw) * sin(uTime * 0.097 + seed));
  if (sw > 0.0) a.y += sw * 0.035 * sin(a.x * 7.0 - uTime * 0.41 + seed) * sat(a.x);
  return vec3(a, suPx / len + lift * (0.001 + 0.014 * sat(a.x) * sat(a.x)) * suSoft);
}
// Grass blades, and stems of oats.
void suGrass(vec2 p, vec2 base) {
  if (suKeep < 0.004 || abs(p.x - base.x) > 0.1 + (0.45 + 0.3 * max(uOwn[7],0.0)) * max(p.y - base.y,0.0)) return;
  float lv = suBegin(2), lift = sat(1.0 - lv + 0.5 * uMic);
  int i = 0;
  do {
    float fi = float(i + 1), h = hash11(fi * 2.3 + 4.0), h2 = fract(h * 91.7);
    bool oat = i > 2;
    float len = (oat ? 0.56 : 0.5) + 0.22 * h;
    float k = (h - 0.62) * 1.5, g = 1.65 - fi * 0.085 + 0.2 * h2;
    vec2 at = base + vec2((fi - 3.0) * 0.016,-0.02 * h), o = p - at;
    if (abs(o.x - o.y * (1.57 - g)) > 0.08 + (0.1 + 0.6 * abs(k) + 0.4 * max(uOwn[7],0.0)) * max(o.y,0.0)) continue;
    vec3 a = suStem(p, at, g, len, k, fi * 1.9, lift);
    float s = a.x, d = abs(a.y);
    if (s < -0.02 || s > 1.05 || d > 0.1) continue;
    if (!oat) {
      float w = 0.0105 * pow(max(1.0 - s,0.0),0.6) * (0.6 + 0.6 * smoothstep(0.0,0.3, s)) / suFine + 0.0004;
      suLay(suCov(d - w, a.z) * (0.55 + 0.25 * lv));
      suLay(suLine(d,0.0012, a.z) * 0.5 * step(s,1.0));
      continue;
    }
    suLay(suLine(d, mix(0.0026,0.0008, s), a.z) * step(s,0.99) * 0.9);
    if (s < 0.45) continue;
    a.z = min(a.z,0.006);
    float side = a.y < 0.0 ? -1.0 : 1.0, n = 13.0;
    float c = (s - d * 1.5) * n + (side < 0.0 ? 0.5 : 0.0), id = floor(c);
    float hh = hash11(id + side * 7.0 + fi * 13.0);
    float sk = (id + 0.5 - (side < 0.0 ? 0.5 : 0.0)) / n;
    if (sk < 0.52 || sk > 0.96) continue;
    float reach = 0.075 * (1.02 - sk) * (0.4 + 0.9 * hh);
    float y = (c - id - 0.5) / n * 0.55;
    suLay(suLine(abs(y),0.0007, a.z) * step(d, reach) * 0.7);
    o = vec2(d - reach - 0.012, y + 0.15 * (d - reach));
    float w = 0.0058 / suFine * (1.0 - sat(abs(o.x) / 0.024)) * (1.2 + 0.5 * o.x / 0.02);
    suLay(suCov(abs(o.y) - w, a.z) * (0.75 + 0.2 * uHigh));
    suLay(suLine(abs(o.y - (o.x - 0.02) * 0.25),0.0005, a.z) * step(0.015, o.x) * step(o.x,0.05) * 0.7);
  } while (++i < 6);
}
// A flat head of tiny flowers: rays ending in smaller rays.
void suUmbel(vec2 p, vec2 base) {
  const float ang = 1.46, len = 0.68, k = -0.22, size = 0.23;
  if (suKeep < 0.004 || abs(p.x - base.x - 0.12) > 0.34 + 0.25 * max(uOwn[7],0.0)) return;
  float lv = suBegin(3), lift = 1.0 - lv;
  vec3 a = suStem(p, base, ang, len, k,3.0, lift * 0.6);
  if (a.x > -0.02 && a.x < 1.0) suLay(suLine(abs(a.y), mix(0.007,0.004, sat(a.x)), a.z) * (0.75 + 0.25 * suRise(a.x,2.0)));
  float th = k + (0.05 + 0.4 * max(uOwn[7],0.0)) * sin(uTime * 0.097 + 3.0);
  if (abs(th) < 4e-3) th = 4e-3;
  vec2 top = vec2(sin(th),1.0 - cos(th)) / th;
  mat2 m = rot(ang + (0.02 + 0.07 * max(uOwn[7],0.0)) * sin(uTime * 0.13 + 3.0));
  vec2 q = m * (p - base) / len + m * suSun * lift * 0.6;
  q = rot(th) * (q - top) * len / size;
  if (length(q) > 1.25 || q.x < -0.35) return;
  float px = suPx / size + lift * 0.016 * suSoft;
  float mid = floor(atan(q.y, q.x + 1e-5) / 0.2 + 0.5);
  int i = -2;
  do {
    float fi = mid + float(i), h = hash11(fi * 3.7 + 9.0), h2 = fract(h * 77.7);
    if (abs(fi) > 6.0) continue;
    float an = fi * 0.2 + (h - 0.5) * 0.12, R = 0.78 + 0.16 * h2 - 0.05 * abs(fi) * 0.4;
    vec2 dir = vec2(cos(an), sin(an));
    float al = dot(q, dir), ac = dot(q, vec2(-dir.y, dir.x)) - 0.25 * an * al * (al - R);
    if (al < -0.02 || abs(ac) > 0.32) continue;
    if (al < R) suLay(suLine(abs(ac),0.011, px) * 0.75);
    vec2 w = vec2(al - R, ac);
    float rr = length(w);
    if (rr > 0.3 || rr < 1e-4) continue;
    float c = atan(w.y, w.x) / 0.34 + h * 4.0, id = floor(c), hh = hash11(id * 5.3 + fi);
    if (abs(id - h * 4.0) > 4.6) continue;
    float off = (c - id - 0.5 + (hh - 0.5) * 0.3) * 0.34 * rr, ro = 0.15 + 0.07 * hh;
    if (rr < ro) suLay(suLine(abs(off),0.006, px) * 0.6);
    vec2 fl = vec2(rr - ro, off);
    float pet = length(fl) - 0.023 * (0.85 + 0.15 * cos(5.0 * atan(fl.y, fl.x + 1e-5) + hh * 20.0)) * (0.6 + 0.8 * hh) / (suFine < 1.0 ? suFine * suFine : 1.0);
    suLay(suCov(pet, px) * (0.6 + 0.25 * lv + 0.3 * uKeys));
  } while (++i < 3);
}
float suStrand(float r, float th, float r0, float m0, float r1, float m) {
  float t = (r - r0) / (r1 - r0), u = min(t,1.0), g = r * (m - m0) * (1.6 - 1.2 * u) * sat(t * 3.5) / (r1 - r0);
  return (th - mix(m0, m, u * (1.6 - 0.6 * u))) * r / sqrt(1.0 + g * g);
}
// Where a strand of fork l that starts at r0 ends; the last ones run on.
float suEnd(float h, int l, float r0, float wide, bool rib, out bool last) {
  float h2 = fract(h * 63.7), r1 = r0 + (l == 0 ? 0.06 : (rib ? 0.075 : 0.05) + 0.1 * h2);
  last = l == (rib ? 6 : 8) || (l > 2 && fract(h * 417.3) > 0.84) || r1 > 0.97 || wide * r1 < (rib ? 0.055 : 0.034);
  return last ? min(r1 + 0.22 * h2,1.02) : r1;
}
// Seaweed, fork after fork out to hair: each share of the fan holds one strand.
// hair: how long the fringe is; under 0 for ribbons.
void suWeed(vec2 p, vec2 base, float ang, float size, float fan, float w0, float hair, float seed, int kind) {
  if (suKeep < 0.004) return;
  bool rib = hair < 0.0;
  w0 /= suFine; if (!rib) hair *= suFine;
  float lv = suBegin(kind), lift = sat(1.0 - lv + (kind == 3 ? 0.5 * uMic : 0.0));
  mat2 tu = rot(ang + 0.015 * sin(uTime * 0.09 + seed));
  vec2 v = tu * (p - base) / size;
  if (dot(v, v) > 1.35) return;
  v += tu * suSun * lift * length(v) * 0.6;
  v += (suWarp.xy * (rib ? 0.1 : 0.24) + suWarp.zw * 0.07) * length(v);
  float r = length(v);
  if (r > 1.05 || r < 1e-4) return;
  float th = atan(v.y, v.x);
  suLay(suCov(r - w0 - 0.006, suPx / size + 0.004) * 0.6);
  if (abs(th) > fan) return;
  float a = -fan, b = fan, m0 = 0.0, r0 = 0.0, d = 1.0, code = seed, lvl = 0.0, side = 1.0, tip = 0.0, rim = 1.0;
  float sa = 0.0, sb = 0.0, sc = 0.0;
  bool last, done;
  float h, r1, m;
  int l = 0;
  do {
    h = hash11(code); r1 = suEnd(h, l, r0, b - a, rib, last); m = mix(a, b,0.3 + 0.4 * h);
    lvl = float(l);
    if (r < r1 || last) break;
    float cl = fract(code * 1.37 + 0.317) * 91.0 + 1.0, cr = fract(code * 1.91 + 0.713) * 97.0 + 2.0;
    if (th < m) { sa = m; sb = b; sc = cr; b = m; code = cl; } else { sa = a; sb = m; sc = cl; a = m; code = cr; }
    m0 = m; r0 = r1;
  } while (++l < 9);
  if (r > r1 && !rib) return;
  if (r < r1) {
    d = suStrand(r, th, r0, m0, r1, m);
    side = d < 0.0 ? -1.0 : 1.0; d = abs(d);
    tip = last ? smoothstep(0.75,1.0, (r - r0) / (r1 - r0)) : 0.0;
  }
  if (lvl > 0.5) {  // its sister may lean over
    h = hash11(sc);
    rim = (sa < a ? b - th : th - a) * r;
    r1 = suEnd(h, int(lvl), r0, sb - sa, rib, done);
    d = min(d, abs(suStrand(r, th, r0, m0, r1, mix(sa, sb,0.3 + 0.4 * h))) + 0.3 * max(r - r1,0.0));
  }
  float room = 0.5 * (b - a) * r;
  float blur = suPx / size + min(lift * (0.001 + 0.016 * r * r) * suSoft, room * 0.8) + 0.0015 * (1.0 - uTone);
  float lit = suRise(r, seed);
  if (rib) {
    float w = w0 * (1.0 - 0.4 * r) * (1.0 + 0.12 * sin(r * 34.0 + seed)) * sqrt(1.0 - tip * tip * 0.96);
    suLay(suCov(d - w, blur) * sat(rim * 200.0) * (0.45 + 0.2 * lv + 0.25 * lit));
    suLay(suLine(d, w * 0.14, blur) * 0.5);
    return;
  }
  float w = w0 * pow(0.7, lvl) + 0.0007;
  suLay(suLine(d, w, blur) * (1.0 - tip) * (0.85 + 0.15 * cos(r * 260.0)) * (0.56 + 0.34 * lv + 0.3 * lit));
  if (lvl < 1.0 || d > hair * 1.35) return;
  // the fringe
  int i = 0;
  do {
    float n = i == 0 ? 46.0 : 118.0, lean = 0.7 + (i == 0 ? 11.0 : 20.0) * d;
    float c = (r - d * lean) * n + side * 0.25 + 0.4 * sin(r * 41.0 + lvl * 2.0);
    float hh = hash11(floor(c) + lvl * 9.0 + side * 3.0 + seed);
    float reach = min(hair * (i == 0 ? 1.0 : 0.45) * (0.35 + 0.9 * hh) * (1.1 - 0.4 * r), room * 1.3);
    if (d > reach) continue;
    float x = abs(fract(c) - 0.5) / (n * sqrt(1.0 + 4.0 * lean * lean));
    suLay(suLine(x,0.0009, blur) * (1.0 - tip) * (1.0 - smoothstep(reach * 0.5, reach, d)) * (0.42 + 0.26 * lv + 0.35 * lit + 0.25 * uHigh * lv + 0.3 * uKeys));
  } while (++i < 2);
}
// A broad, thin blade of kelp, crimped along its edges.
void suKelp(vec2 p, vec2 base) {
  if (suKeep < 0.004) return;
  float lv = suBegin(0);
  vec3 a = suStem(p, base,-0.5,1.3,0.35,2.0,1.0 - lv);
  float s = a.x, y = a.y + 0.018 * sin(s * 7.0 + 2.0);
  if (s < -0.05 || s > 1.02 || abs(y) > 0.104 * max(1.0,1.0 - 0.5 * uOwn[3])) return;
  float d = abs(y), side = y < 0.0 ? -1.0 : 1.0;
  float lit = suRise(s,2.0);
  float prof = smoothstep(0.1,0.3, s) * pow(max(1.0 - s * s,0.0),0.6);
  float crimp = noise(vec2(s * 26.0 + side * 9.0, d * 12.0 + 2.0));
  float w = 0.065 * prof * (0.85 + 0.3 * crimp) * (1.0 - 0.5 * uOwn[3]) + 0.0005;
  float in_ = sat(1.0 - d / w), body = suCov(d - w, a.z + 0.0005) * (1.0 - smoothstep(0.985,1.0, s));
  float fold = smoothstep(0.3,0.7, crimp) * (1.0 - smoothstep(0.1,0.65, in_)) * smoothstep(0.0,0.05, in_);
  suLay(body * (0.36 + 0.06 * noise(vec2(s * 7.0, y * 90.0)) + 0.2 * lv + 0.25 * lit * in_));
  suLay(body * fold * 0.5);
  suLay(body * 0.3 * (1.0 - smoothstep(0.0,0.2, abs(d / w - 0.2))));
  suLay(suLine(d,0.006, a.z) * (1.0 - smoothstep(0.12,0.34, s)) * smoothstep(-0.05,-0.045, s) * 0.9);
}
// Fallen petals, or scraps of sea lettuce. A hit presses them flat.
void suPetals(vec2 p, bool sea) {
  const vec2 lie[5] = vec2[5](vec2(-0.6,0.2), vec2(0.02,0.31), vec2(0.66,-0.2), vec2(0.28,-0.27), vec2(-0.3,-0.33));
  const vec2 wet[5] = vec2[5](vec2(-0.05,0.3), vec2(0.64,-0.3), vec2(-0.1,-0.3), vec2(-0.68,0.04), vec2(0.18,0.06));
  suBegin(4);
  float lead = fract(uTime * 0.023) * 5.0;
  float fi = 0.0, qq = 1.0;
  vec2 q = p;
  int i = 0;
  do {
    vec2 o = p - (sea ? wet[i] : lie[i]) * vec2(suWide,1.0);
    if (dot(o, o) < qq) { q = o; qq = dot(o, o); fi = float(i); }
  } while (++i < 5);
  if (qq > 0.026) return;
  float h = hash11(fi * 4.1 + (sea ? 60.0 : 20.0));
  q = rot(h * TAU + 0.06 * sin(uTime * 0.07 + fi)) * q * vec2(1.0, sea ? 1.35 : 1.0);
  float near = abs(lead - fi); near = min(near,5.0 - near);
  float hit = uHits * exp(-2.5 * near * near);
  suLv = hit;
  float blur = suPx + 0.009 * (1.0 - hit), d, thin;
  if (sea) {
    float r = length(q), an = atan(q.y, q.x + 1e-5);
    vec2 rim = vec2(cos(an), sin(an));
    d = r - 0.06 - 0.06 * noise(rim * 1.3 + h * 20.0) - 0.014 * noise(rim * 6.0 + h * 9.0);
    float fold = noise(rim * 3.0 + vec2(r * 9.0, h * 19.0));
    thin = 0.6 * (1.0 - smoothstep(0.0,0.1, abs(fold - 0.5))) * smoothstep(0.0,0.05, r) + 0.4 * (1.0 - smoothstep(0.0,0.012, abs(d + 0.006)));
  } else {
    q.x += 0.085;
    float r = length(q), an = atan(q.y, q.x + 1e-5);
    d = r - 0.175 * pow(max(cos(min(abs(an) * 1.35,1.57)),0.0),0.7) * (1.0 - 0.07 * exp(-an * an * 30.0)) - 0.005 * sin(an * 7.0 + h * 9.0);
    d *= 0.7;
    thin = 0.4 * pow(0.5 + 0.5 * cos(an * 26.0 + 3.0 * noise(vec2(r * 22.0, h * 9.0))),3.0) * smoothstep(0.0,0.05, r) + 0.5 * (1.0 - smoothstep(0.0,0.06, r));
  }
  suLay(suCov(d, blur) * (0.06 + 0.14 * fract(h * 7.7) + 0.6 * hit + thin * (0.1 + 0.5 * hit)));
  suLay(0.3 * hit * (1.0 - smoothstep(0.0,0.026, qq)));
}
// Many small sprigs, one to a cell.
void suSprigs(vec2 p, bool sea) {
  float g = 4.3, big = sea ? 1.36 : 1.1, px = suPx;
  vec2 q = p * g + vec2(0.5,0.15 + 0.5 * mod(floor(p.x * g + 0.5),2.0)), id = floor(q), h = hash22(id + 5.0), h2 = hash22(id + 47.0);
  vec2 c = abs(q - id - 0.5);
  suKeep *= smoothstep(0.5,0.465, max(c.x, c.y));          // a tip that reaches its cell's side thins out there
  q = rot((h2.x - 0.5) * 1.5) * (q - id - 0.5 + 0.12 * (h - 0.5)) * big;
  int kind = int(h.x * 3.99);
  float lean = (h2.y - 0.5) * 1.4;
  suPx *= g * big;
  if (sea) suWeed(q, vec2(-0.1 * lean,-0.44),1.57,0.84,0.75 + 0.3 * h.y, h.x < 0.34 ? 0.02 : 0.010, h.x < 0.34 ? -1.0 : 0.06,5.0 + 17.0 * floor(h2.x * 7.0), kind);
  else if (h.x < 0.62) suFern(q, vec2(-0.12 * lean,-0.46),1.57 + 0.3 * lean,0.92, lean,13.0,0.26, h.y,3.0 * h2.x, kind);
  else suUmbel((q - vec2(-0.1,-0.5)) * 0.95, vec2(0.0));
  suPx = px;
}
vec3 suPrint(float e) {
  vec3 c = mix(vec3(0.925,0.925,0.885), vec3(0.62,0.765,0.86), smoothstep(0.0,0.3, e));
  c = mix(c, vec3(0.2,0.42,0.66), smoothstep(0.2,0.55, e));
  c = mix(c, vec3(0.045,0.165,0.4), smoothstep(0.45,0.82, e));
  return mix(c, vec3(0.018,0.065,0.2), smoothstep(0.75,1.15, e));
}
// The same ramp in a dye of one colour.
vec3 suDyed(float e, vec3 d) {
  vec3 c = mix(vec3(0.94,0.925,0.88), mix(vec3(0.9), d,0.55), smoothstep(0.0,0.3, e));
  c = mix(c, d * 0.92, smoothstep(0.2,0.55, e));
  c = mix(c, d * 0.58, smoothstep(0.45,0.82, e));
  return mix(c, d * 0.3, smoothstep(0.75,1.15, e));
}
const vec4 suFernA[4] = vec4[4](vec4(-0.74,-0.4,0.66,1.36), vec4(0.2,-0.47,1.87,0.98), vec4(-0.62,0.5,-0.75,0.95), vec4(0.86,-0.5,2.0,0.92));
const vec4 suFernB[4] = vec4[4](vec4(-0.45,29.0,0.165,0.0), vec4(0.3,21.0,0.2,1.0), vec4(0.5,23.0,0.18,0.6), vec4(-0.4,19.0,0.2,0.3));
const vec4 suWeedA[8] = vec4[8](vec4(-0.5,-0.42,1.45,0.64), vec4(0.42,-0.44,1.75,0.74), vec4(0.86,0.36,-2.6,0.6), vec4(0.22,-0.43,1.5,0.86), vec4(0.22,-0.43,1.35,0.74), vec4(0.74,0.38,-2.3,0.66), vec4(-0.6,-0.43,1.6,0.86), vec4(-0.62,0.42,-1.2,0.55));
const vec4 suWeedB[8] = vec4[8](vec4(1.0,0.0115,-1.0,3.0), vec4(1.0,0.012,-1.0,23.0), vec4(0.9,0.012,-1.0,13.0), vec4(1.15,0.0055,0.045,11.0), vec4(1.1,0.0055,0.03,29.0), vec4(0.9,0.006,0.06,47.0), vec4(1.1,0.0055,0.05,53.0), vec4(0.9,0.005,0.05,37.0));
vec3 render(vec2 p) {
  suPx = 0.9 / uRes.y;
  suHalf = 0.5 * uRes.x / uRes.y;
  suWide = clamp(suHalf / 0.89,0.34,1.15);
  bool sea = uVar > 0.5;
  suKeep = 1.0; suFine = exp2(0.9 * uOwn[3]); suInk = vec3(0.3); suDye = vec3(0.3);
  float rev = max(-uOwn[0],0.0), wet = max(uOwn[5],0.0), old = max(-uOwn[5],0.0), one = max(-uOwn[2],0.0), many = max(uOwn[2],0.0), gr = max(uOwn[4],0.0), br = max(-uOwn[4],0.0);
  suSoft = 0.6 + 0.8 * uSpace;
  suT = 1.0; suTint = vec3(1.0);
  suSun = (0.012 + 0.012 * uSpace) * vec2(1.0 + 0.5 * sin(uTime * 0.031),0.7 * cos(uTime * 0.023));
  // the coat, brushed from side to side
  vec2 lim = vec2(suHalf - 0.055,0.44);
  if (uOwn[1] > 0.0) lim += uOwn[1] * vec2(0.3,0.2);
  float row = p.y * 8.0 + 0.2 * sin(p.x * 2.5), ri = floor(row);
  float rj = mix(hash11(ri + 3.0), hash11(ri + 4.0), smoothstep(0.75,1.0, row - ri));
  float bris = noise(vec2(p.x * 4.0, p.y * 70.0)) * 0.55 + noise(vec2(p.x * 6.0 + 4.0, p.y * 190.0)) * 0.45;
  float ex = lim.x - abs(p.x) - 0.05 * rj - 0.06 * bris * bris;
  float ey = lim.y - abs(p.y) + 0.006;
  if (ey < 0.2) ey -= 0.012 * noise(vec2(p.x * 5.0, sign(p.y) * 7.0));
  if (uOwn[1] < 0.0) { ex = mix(ex,0.435 - length(p) - 0.035 * rj - 0.03 * bris * bris,-uOwn[1]); ey = mix(ey, max(ey, ex) + 0.1,-uOwn[1]); }
  float tooth = noise(p * 210.0), grain = 0.7 * tooth + 0.3 * bris;
  float coat = smoothstep(0.0,1.0, ex / 0.03 + 1.3 * (grain - 0.5) + 0.3) * smoothstep(-0.003,0.01, ey + 0.014 * (grain - 0.5));
  float pool = exp(-max(min(ex - 0.02, ey),0.0) * 60.0) * 0.12;
  float e = 0.0, hills = 1.0, torn = 0.0;
  vec2 blot = vec2(0.5), was = p;
  if (coat > 0.001 || rev > 0.0) {
    if (wet > 0.0) p += wet * vec2(0.022 * (noise(p * vec2(11.0,2.5)) - 0.5),0.032 * (noise(vec2(p.x * 13.0,3.0)) - 0.5) + 0.03 * (noise(p * vec2(50.0,4.0)) - 0.5));
    if (uOwn[6] > 0.0) {
      suBegin(1); suDye = mix(suDye, vec3(0.75,0.70,0.60),0.35);
      suLay(suCov(length(p - vec2(sea ? -0.16 : 0.26, sea ? 0.02 : 0.07) * vec2(suWide,1.0)) - 0.29, suPx + 0.004 * suSoft) * uOwn[6] * (0.66 + 0.16 * uPad + 0.1 * (noise(p * 6.0) - 0.5)));
    }
    if (uOwn[6] < 0.0) {
      hills = 0.34 + 0.05 * p.y;
      int k = 0;
      do {
        float fk = float(k), y = 0.24 - 0.135 * fk + (0.13 - 0.01 * fk) * (noise(vec2(p.x * (1.3 + 0.35 * fk) + 7.3 * fk,2.0)) - 0.5) + 0.012 * (noise(vec2(p.x * 31.0, fk)) - 0.5) + 0.004 * (noise(vec2(p.x * 160.0, fk)) - 0.5) - p.y;
        float in_ = smoothstep(-suPx, suPx, y);
        hills = mix(hills,0.42 + 0.17 * fk, in_);
        torn = mix(torn, smoothstep(0.011,0.004, y + 0.006 * noise(p * vec2(60.0,90.0))), in_);
      } while (++k < 5);
    }
    suPetals(p, sea);
    float all = 1.0 - many, rest = all * (1.0 - one), lone;
    if (!sea && many >= 1.0) lone = 0.0;
    else if (!sea) {
      int i = gr < 1.0 ? 0 : 2, n = one >= 1.0 ? 1 : br > 0.0 ? 4 : 2;
      if (i < n) do {
        suKeep = i < 1 ? all * (1.0 - gr) : rest * (i < 2 ? 1.0 - gr : br);
        vec4 f = suFernA[i], g = suFernB[i];
        suFern(p, vec2(f.x * suWide, f.y), f.z, f.w, g.x, g.y, g.z, g.w, i < 1 ? 0.37 : i < 2 ? 5.21 : i < 3 ? 2.6 : 7.7, i);
      } while (++i < n);
      i = 0; n = gr > 0.0 ? 3 : 1;
      if (br < 1.0 && one < 1.0) do {
        suKeep = i < 1 ? rest * (1.0 - br) : rest * gr;
        suGrass(i < 2 ? p : vec2(-p.x, p.y) * 1.25, i < 1 ? vec2(0.63 * suWide,-0.46) : i < 2 ? vec2(-0.66 * suWide,-0.5) : vec2(0.02,-0.6));
      } while (++i < n);
      lone = one * gr; i = one < 1.0 ? 0 : n - 1;
      if (br < 1.0 && (one < 1.0 || gr > 0.0)) do {
        suKeep = i < n - 1 ? rest * gr : all * (1.0 - one * (1.0 - gr)) * (1.0 - br);
        suUmbel(i == n - 1 ? (p - vec2(0.4 * suWide,-0.48) * (1.0 - lone)) * (1.0 - 0.2 * lone) + lone * vec2(0.10,0.48) : i < 1 ? (p - vec2(-0.40 * suWide,-0.5)) * 0.86 : vec2(0.13 * suWide - p.x, p.y + 0.5) * 1.5, vec2(0.0));
      } while (++i < n);
    } else {
      float w = 0.4 * sin(uTime * 0.02), sw = max(uOwn[7],0.0);
      suWarp = vec4(noise(p * 4.4 + vec2(w,0.0)), noise(p * 4.4 + 40.0 - vec2(w,0.0)), noise(p * 15.0), noise(p * 15.0 + 70.0)) - 0.5;
      if (sw > 0.0) suWarp = mix(suWarp, vec4(sin(p.y * 7.0 + p.x * 2.0 - uTime * 0.31),0.6 * sin(p.x * 6.0 - p.y * 2.0 + uTime * 0.23),0.5 * sin(p.y * 15.0 - uTime * 0.47),0.4 * sin(p.x * 13.0 + uTime * 0.39)), sw * 0.75);
      if (gr < 1.0 && one < 1.0) { suKeep = rest * (1.0 - gr); suKelp(p, vec2(-0.74 * suWide,0.38)); }
      lone = one * br;
      // a ribbon weed, two more of them, two hair weeds from one foot, a third, two more
      vec2 at = vec2(0.22 * suWide * (1.0 - one),-0.43);
      int i = gr < 1.0 && (one < 1.0 || br > 0.0) ? 0 : br > 0.0 && one < 1.0 ? 1 : 3;
      do {
        suKeep = i < 1 ? all * (1.0 - gr) * (1.0 - one * (1.0 - br)) : i < 3 ? rest * br : (i < 5 ? all : rest) * (i < 6 ? 1.0 - br : gr);
        vec4 f = suWeedA[i], g = suWeedB[i];
        vec2 foot = i < 1 ? vec2(-0.5 * suWide * (1.0 - lone),-0.42) : i == 3 || i == 4 ? at : vec2(f.x * suWide, f.y);
        if (i < 1) { f.z += 0.1 * lone; f.w += 0.28 * lone; }
        if (i == 3) f.w += 0.07 * one;
        if (i == 4) f.z += 0.2 * one;
        suWeed(p, foot, f.z, f.w, g.x, g.y, g.z, g.w, i < 1 || i == 7 ? 1 : i == 2 || i == 5 ? 3 : i == 6 ? 0 : 2);
        ++i;
        if (i == 1 && (br <= 0.0 || one >= 1.0)) i = 3;
        if (i == 3 && br >= 1.0) i = 6;
      } while (i < (one >= 1.0 ? 5 : gr > 0.0 ? 8 : 6));
    }
    suKeep = many;
    if (many > 0.0) suSprigs(p, sea);
    p = was;
    blot = vec2(noise(p * 2.3 + vec2(sin(uTime * 0.007),4.0)), noise(p * 7.0 + 8.0));
    float cloud = dot(blot, vec2(0.65,0.35)), streak = noise(vec2(p.x * 1.3, p.y * 26.0)) * 0.5 + bris * 0.5;
    e = 0.72 + 0.06 * uLevel + 0.3 * (cloud - 0.5) + 0.2 * (streak - 0.5) + 0.12 * (rj - 0.5) + pool;
    float front = p.x - mix(-suHalf - 0.35, suHalf + 0.35, uLoop);
    e += 0.16 * exp(-front * front * 30.0) * (0.4 + 0.6 * uLevel);
    // a cue: water runs down the sheet, paler where it runs and deeper behind it
    if (uCue > 0.001) {
      float wash = p.y - mix(0.3,-0.85,1.0 - uCue) + 0.07 * noise(vec2(p.x * 5.0,1.0));
      e -= 0.5 * sqrt(uCue) * exp(-wash * wash * (wash > 0.0 ? 22.0 : 1500.0));
      e += 0.25 * uCue * (1.0 - uCue) * smoothstep(0.0,0.5, wash);
    }
    if (uOwn[6] < 0.0) e = mix(e, e * hills * 1.15,-uOwn[6]);
    if (wet > 0.0) {
      float run = noise(vec2(p.x * 13.0,1.0)) * 0.6 + noise(vec2(p.x * 37.0 + 3.0, p.y * 1.5)) * 0.4, fall = smoothstep(-0.45,0.5, p.y + 0.45 * (run - 0.5));
      e = mix(e, e * mix(1.22,0.50, fall) - 0.22 * smoothstep(0.58,0.8, run) * fall + 0.14 * exp(-abs(fall - 0.5 - 0.2 * (blot.y - 0.5)) * 30.0), wet);
    }
    e = mix(e,0.0, torn * 0.75 * max(-uOwn[6],0.0));
    e = e * suT * coat;
    if (old > 0.0) {
      float jag = 0.010 * (noise(p * 24.0) - 0.5), cx = min(abs(p.x - 0.31 * suWide + jag), abs(p.x + 0.35 * suWide + 0.5 * jag)), cy = abs(p.y - 0.03 - jag), flake = noise(p * vec2(31.0,34.0)) * 0.6 + noise(p * 97.0) * 0.4;
      float worn = smoothstep(0.018,0.0, min(cx, cy) - 0.030 * smoothstep(0.55,0.9, flake)) + 0.5 * smoothstep(0.64,0.8, noise(p * 5.0) * 0.6 + flake * 0.4);
      e = max(e * (1.0 - old * (0.85 * sat(worn) + 0.20)),0.0);
    }
    e += 0.1 * (grain - 0.5) * smoothstep(0.02,0.4, e);
  }
  vec3 col = suPrint(max(e,0.0));
  if (uOwn[0] > 0.0) col = mix(col, suDyed(max(e,0.0), mix(uKind[0], uKind[1], smoothstep(0.30,0.75, blot.x * 0.7 + 0.15 + 0.4 * p.y))), uOwn[0]);
  float bare = 1.0 - smoothstep(0.1,0.75, e);
  col *= mix(vec3(1.0), suTint,0.34 * bare * coat);
  if (rev > 0.0) {
    rev = smoothstep(0.0,1.0, (rev * 1.15 - sat(p.x / (2.0 * suHalf) + 0.5 + 0.10 * (bris - 0.5) + 0.04 * rj) + 0.04 * smoothstep(0.8,1.0, rev)) / 0.15);
    float dens = sat((1.0 - suT) * (0.92 + 0.35 * (grain - 0.5)) * (1.0 + 0.5 * uLevel)), soak = wet * smoothstep(0.35,0.7, blot.x * 0.6 + blot.y * 0.4);
    vec3 page = vec3(0.925,0.91,0.855) * (0.97 + 0.05 * (blot.x - 0.5)), ink = suInk;
    page = mix(page, page * mix(vec3(1.0), uKind[1],0.45), max(soak * 0.8, wet * 0.25));
    page = mix(page, page * mix(vec3(1.0), mix(uKind[0], uKind[1], hills),0.8) * (1.18 - 0.35 * hills), max(-uOwn[6],0.0) * (1.0 - torn));
    page = mix(page, uKind[1] * (0.82 + 0.16 * blot.y) + 0.1,0.75 * max(-uOwn[1],0.0) * coat);
    float front = p.x - mix(-suHalf - 0.35, suHalf + 0.35, uLoop);
    page *= 1.0 - 0.05 * exp(-front * front * 30.0) - 0.10 * uCue * smoothstep(0.3,-0.1, p.y - mix(0.3,-0.85,1.0 - uCue));
    col = mix(col, mix(page, min(ink * (0.85 + 0.3 * grain), page), dens * 0.96), rev);
    bare = mix(bare,1.0 - 0.5 * dens, rev); coat = mix(coat,1.0, rev);
  }
  if (old > 0.0) {
    float spot = smoothstep(0.66,0.80, noise(p * 9.0 + 3.0) * 0.75 + 0.25 * noise(p * 37.0)), jag = 0.010 * (noise(p * 24.0) - 0.5);
    float fold = exp(-abs(p.x - 0.31 * suWide + jag) * 130.0) + exp(-abs(p.x + 0.35 * suWide + 0.5 * jag) * 130.0) + exp(-abs(p.y - 0.03 - jag) * 130.0);
    col = mix(col, col * vec3(0.93,0.86,0.72), old * (0.7 + 0.3 * blot.x)) * (1.0 - old * (vec3(0.16,0.26,0.36) * spot + 0.22 * min(fold,1.0)));
  }
  // the piece: faint washes
  vec2 uv = vec2(p.x / (2.0 * lim.x) + 0.5,0.5 - p.y / 0.88) + 0.05 * (blot - 0.5);
  vec4 m = piece(uv);
  col = mix(col, col * 0.75 + 0.35 * m.rgb * (0.3 + col),0.8 * sat(m.a) * coat * (1.0 - bare));
  float slope = bare > 0.02 ? bare * (noise(p * 210.0 + vec2(-0.45,0.45)) - tooth) : 0.0;
  col *= 1.0 - 0.055 * slope - 0.05 * dot(p, p) + 0.02 * (p.y - p.x);
  return col;
}
