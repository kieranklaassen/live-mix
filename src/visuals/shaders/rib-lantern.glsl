// name: Rib lantern
// a: White room
// b: Only lamp
// what: A huge squashed moon of a paper lantern, thin paper over uneven bamboo ribs, hangs in a pale plaster corner in daylight, hardly lit, its soft shadow bent over two walls. Or a dark boarded room where the only lamp is a tall paper lantern pinched at the waist, its ribs thrown as wide rings of shade over walls, ceiling and floor.
// follows: The level is the lamp. The drone widens its glow, the pad warms it, texture brings up the fibres, the phrase is a small light gliding behind the paper; the low end fills the paper between its ribs. Sixteen gaps hold the bands, the piece tints the paper, the loop carries the lamp round. A hit taps it and a ring of light runs; a cue turns it full up.
// own: 0 the body: 1 a straight drum (b: three beads), -1 a flat saucer (b: a slim column); 1 1 many fine ribs, -1 a few, the paper puffed between; 2 1 hoops tipped and wandering, -1 upright ribs, a lobed body (half way a lattice); 3 out of doors: 1 a pale plain, -1 water at night; 4 1 pierced metal, -1 no paper, a bare cage; 5 the eye: 1 from above, -1 from low beneath; 6 more lanterns: 1 many, far off too, -1 close beside it in rows; 7 dyed in the sounds' colours, 1 in its own hour, -1 in the other (a: night, b: day)
const float rlFloor = -1.55;
bool rlB;               // the tall lamp in the dark room
float rlA, rlH, rlYc;   // the body: widest radius, half height, and where paper stops at the openings
float rlGain, rlI;      // how strongly things answer; how bright the lamp is
float rlSagD;           // how deep the paper hangs between two ribs
vec3 rlLamp, rlHue;     // where the lamp is inside, and its colour
vec3 rlSun;             // towards the window
const vec3 rlTap = vec3(-0.42, 0.22, -0.85); // where a hit taps the paper
float rlN, rlU, rlHw, rlUn;          // ribs: times as many; upright ones, hoops; how many upright
float rlDye, rlDayB, rlDay1, rlOut, rlG, rlTop; // dyed; daylight in b; out of doors; the ground; the ceiling
float rlSq(float x) { return x * x; }
float rlBell(float x) { return exp(-x * x); }
// The body's radius at a height.
float rlR(float y) {
 if (!rlB) { 
  float h = y / (y > 0.0 ? rlH : rlH * 1.08), R = rlA * sqrt(max(1.0 - h * h, 0.0));
  if (uOwn[0] > 0.0) { float g = h * h; g *= g; R = mix(R, rlA * sqrt(max(1.0 - g * g, 0.0)), uOwn[0]); }
  if (uOwn[0] < 0.0) R = mix(R, rlA * max(1.0 - abs(h), 0.0), -uOwn[0]);
  return R;
 }
 float h = y / rlH, h2 = h * h;
 float R = rlA * sqrt(max(1.0 - h2 * h2 * h2, 0.0)) * (1.0 - 0.47 * rlBell((y - 0.12) / 0.5)) * (1.0 - 0.06 * h);
 if (uOwn[0] > 0.0) { float w = cos(1.5 * PI * h); R = mix(R, rlA * (0.12 + 0.82 * sqrt(w * w + 0.03)) * (1.0 - 0.12 * h), uOwn[0]); }
 if (uOwn[0] < 0.0) R = mix(R, 0.5 * rlA * sqrt(max(1.0 - h2 * h2 * h2 * h2, 0.0)), -uOwn[0]);
 return R;
}
// Counts the ribs upwards, 0 to 16, each tipped its own way; d is the direction round the axis.
float rlF(float y, vec2 d) {
 float f = 8.0 + 8.0 * (rlB ? y / rlYc : asin(clamp(y / (y > 0.0 ? rlH : rlH * 1.08), -0.999, 0.999)) / 1.32);
 if (!rlB && uOwn[0] != 0.0) f = mix(f, 8.0 + 8.0 * clamp(y / rlYc, -1.0, 1.0), abs(uOwn[0]));
 if (uOwn[2] > 0.0) f += uOwn[2] * (2.1 * d.x + 0.75 * d.x * (3.0 - 4.0 * d.x * d.x));
 return f + 0.12 * sin(f * 3.7 + 1.0) + 0.2 * sin(f * 0.83 + 2.0) + 0.22 * sin(f * 1.1) * dot(d, vec2(0.8, 0.6));
}
float rlSag(float f) { float k = fract(2.0 * f * rlN); return 4.0 * k * (1.0 - k); }
// How far round between two upright ribs; the sag of both kinds.
float rlUp(vec2 d) { return fract(atan(d.x, -d.y - 1e-5) * rlUn / TAU + 0.5); }
float rlSag2(float s, float k) { float u = 4.0 * k * (1.0 - k); return mix(1.0, s, rlHw) * mix(1.0, mix(1.0 - u, u, rlHw), rlU); }
// The pierced metal: 1 in a hole.
float rlHoles(vec2 d, float f, float w) {
 float n = floor(22.0 * rlN + 0.5), y = f * 1.25 * rlN, i = floor(y), x = fract(atan(d.x, -d.y - 1e-5) * n / TAU + 0.5 * mod(i, 2.0));
 float r = 0.17 + 0.19 * step(1.5, mod(i + 1.0, 3.0));
 return 1.0 - smoothstep(r - w, r + w, length(vec2(x, y - i) - 0.5));
}
float rlSkin(vec3 q) {
 float r = max(length(q.xz), 1e-3), f = rlF(q.y, q.xz / r), d;
 if (rlB) d = (r - rlR(q.y)) * 0.75;
 else {
  vec2 e = vec2(rlA, q.y > 0.0 ? rlH : rlH * 1.08), c = vec2(r, q.y);
  float k0 = length(c / e), k1 = length(c / (e * e));
  d = k0 * (k0 - 1.0) / max(k1, 1e-3);
 }
 if (uOwn[0] != 0.0) { float R = rlR(q.y), s = (rlR(q.y + 0.02) - rlR(q.y - 0.02)) * 25.0; d = (r - R) / sqrt(1.0 + s * s); }
 if (rlU > 0.0) return max(d + rlSagD * rlSag2(rlSag(f), rlUp(q.xz)), abs(q.y) - rlYc);
 return max(d + rlSagD * rlSag(f), abs(q.y) - rlYc);
}
// What the lamp sends out through gap number f: the band's gap, and the shade of its ribs.
float rlGap(float f, float w) {
 float k = fract(f * rlN), m = min(k, 1.0 - k);
 float bd = uBands[int(clamp(floor(f), 0.0, 15.0))];
 return (1.0 + 1.1 * bd * rlGain * rlSq(sin(PI * k))) * (1.0 - 0.75 * rlHw * rlBell(m / w));
}
// Light from the lantern on a wall: bare where it comes out of an opening.
vec3 rlThrow(vec3 q, vec3 n) {
 vec3 v = q - rlLamp;
 float d2 = dot(v, v), d = sqrt(d2);
 float r = max(length(v.xz), 1e-3), y = rlB ? rlLamp.y + 0.36 * v.y / r : rlH * sin(atan(v.y, r));
 float ya = abs(y), edge = 0.05 + 0.06 * d;
 float open = smoothstep(rlYc - edge, rlYc + edge, ya);
 float f = clamp(rlF(clamp(y, -rlYc, rlYc), v.xz / r), 0.0, 15.999);
 float g = rlGap(f, mix(0.34, 0.2, uTone));
 if (rlU > 0.0) { float k = rlUp(v.xz); g *= 1.0 - 0.8 * rlU * rlBell(min(k, 1.0 - k) / 0.16); }
 if (uOwn[4] > 0.0) g = mix(g, 2.3 * rlHoles(v.xz, f, 0.06 + 0.03 * d), uOwn[4]);
 g = mix(1.0, g, rlB ? 0.92 : 0.06 + 0.8 * max(max(uOwn[4], -uOwn[3]), max(-uOwn[7], 0.0)));
 float e = sat(-dot(n, v) / d + 0.06) / (d2 + (rlB ? 0.3 : 0.6));
 float ring = uHits * rlBell((f - 1.0 - 17.0 * (1.0 - uHits)) / 1.3);
 return rlHue * e * (rlI * mix(g, 1.7 + 2.0 * uKeys * rlGain, open) + (rlB ? 1.1 : 0.25) * rlGain * ring);
}
vec3 rlDyed(vec3 k) { return k * k * 0.8 + k * 0.2; }
vec3 rlPapered(float h) { return mix(vec3(1.0), 1.5 * rlDyed(mix(uKind[1], uKind[3], h)), rlDye); }
float rlUpRib(float k, float r, float w) { return rlU * rlBell(min(k, 1.0 - k) * TAU / rlUn * r / w); }
float rlRib; // a rib is here
// Long fibres of bark in the paper, one bent strand to a cell.
float rlStrands(vec2 s, float px) {
 vec2 i = floor(s), h = hash22(i), q = rot(h.x * 6.0) * (s - i - 0.5);
 q.y += (h.y - 0.5) * 1.6 * q.x * q.x + 0.02 * sin(q.x * 9.0 + h.x * 9.0);
 float w = 0.006 + 0.008 * h.y + px;
 return (1.0 - smoothstep(0.3 * w, w, abs(q.y))) * (1.0 - smoothstep(0.2, 0.46, length(s - i - 0.5))) * step(0.2, fract(h.x * 7.3)) * (0.5 + 0.5 * h.y) * min(1.0, 0.015 / px);
}
// The paper. x: transmission, y: shade of the surface, z: crease.
vec3 rlPaper(vec3 q, float th, float f, float px) {
 f *= rlN;
 float k = fract(2.0 * f), m = 0.5 * min(k, 1.0 - k);
 float gw = TAU / (rlB ? 9.0 : 13.0), gi = floor((th + 10.0) / gw), gf = (th + 10.0) / gw - gi;
 float lap = smoothstep(0.0, 0.012 + px * 2.0, gf) * (1.0 - smoothstep(0.088 - px * 2.0, 0.1, gf));
 vec2 s = vec2(th + gi * 3.7, q.y + gi * 5.1);
 float tone = hash11(gi + 3.0);
 float cloud = noise(s * 5.0) * 0.6 + noise(s * 14.0) * 0.4;
 if (rlB) { s *= 0.62; px *= 0.62; }
 float fib = rlStrands(s * 3.1, px * 3.1) + 0.8 * rlStrands(rot(1.1) * s * 5.3 + 7.0, px * 5.3) + 0.8 * rlStrands(rot(2.3) * s * 7.0 + 3.0, px * 7.0) + 0.6 * rlStrands(rot(0.6) * s * 9.0 + 5.0, px * 9.0);
 float cr = noise(vec2(th * 34.0, floor(2.0 * f) * 7.0 + k * 1.6)) - 0.5;
 cr *= 0.35 + 0.65 * (1.0 - 4.0 * k * (1.0 - k));
 float tx = 0.4 + 2.6 * sat(uTexture * rlGain);
 float t = (0.95 + 0.07 * tone) * (1.0 + (0.14 + 0.28 * tx) * (cloud - 0.5)) * (1.0 - (rlB ? 0.16 : 0.26) * lap) * (1.0 - 0.25 * min(fib, 1.0) * tx) * (1.0 + 0.16 * cr);
 float rib = rlHw * rlBell(m / (0.05 * min(1.0, rlN * 1.6)));
 if (rlU > 0.0) { rib = max(rib, rlUpRib(rlUp(q.xz), length(q.xz), 0.011 + px)); }
 rlRib = rib;
 t *= 1.0 - 0.62 * rib;
 float sh = (0.97 + 0.04 * tone) * (0.97 + 0.06 * cloud) * (1.0 - 0.05 * lap) * (1.0 - 0.1 * min(fib, 1.0) * tx) * (1.0 - 0.16 * rib);
 return vec3(t, sh, cr);
}
// How much of the window's light the lantern lets by.
float rlShadow(vec3 q) {
 vec3 e = vec3(rlA, rlH * 1.04, rlA) * 0.99, o = q / e, d = rlSun / e;
 float dd = dot(d, d), t = max(-dot(o, d) / dd, 0.0);
 float m = length(o + d * t), w = mix(0.26, 0.14, uTone);
 float s = smoothstep(1.0 - w, 1.0 + w, m);
 float u = (q.x * rlSun.z - q.z * rlSun.x) / length(rlSun.xz);
 float y = q.y - rlSun.y * dot(q.xz, rlSun.xz) / dot(rlSun.xz, rlSun.xz);
 return s * (1.0 - 0.2 * rlBell(u / 0.045) * smoothstep(0.6, 0.8, y) * (1.0 - rlOut));
}
const vec3 rlCn = vec3(0.98, 0.0, 1.2);
vec3 rlRoomA(vec3 ro, vec3 rd, vec3 day) {
 const vec3 n1 = vec3(0.2079, 0.0, -0.9781), n2 = vec3(-0.8746, 0.0, -0.4848);
 float wide = 1.0 + 1.6 * max(uOwn[6], 0.0);
 vec3 cn = rlCn * vec3(wide, 1.0, wide);
 float top = rlTop, t1 = dot(cn - ro, n1) / dot(rd, n1), t2 = dot(cn - ro, n2) / dot(rd, n2);
 t1 = dot(rd, n1) < -1e-3 ? t1 : 1e4; t2 = dot(rd, n2) < -1e-3 ? t2 : 1e4;
 float t = min(t1, t2);
 vec3 n = t1 < t2 ? n1 : n2;
 if (rd.y > 1e-3) { float tc = (top - ro.y) / rd.y; if (tc < t) { t = tc; n = vec3(0.0, -1.0, 0.0); } }
 if (uOwn[5] > 0.0 && rd.y < -1e-3) { float tf = (-1.9 - ro.y) / rd.y; if (tf < t) { t = tf; n = vec3(0.0, 1.0, 0.0); } }
 vec3 q = ro + rd * t;
 vec2 s = abs(n.y) > 0.5 ? q.xz : vec2(dot(q.xz, vec2(-n.z, n.x)), q.y);
 float big = noise(s * 1.1 + 3.0), mid = noise(s * vec2(4.0, 3.0) + 4.0 * big), fine = noise(rot(0.6) * s * vec2(9.0, 30.0));
 vec3 alb = vec3(0.87, 0.835, 0.775) * (0.95 + 0.06 * big + 0.04 * mid + 0.02 * fine);
 if (rlDye > 0.0) alb = mix(alb, rlDyed(uKind[n.y > 0.5 ? 2 : 0]) * (0.86 + 0.2 * big + 0.1 * mid), rlDye);
 float sh = rlShadow(q);
 if (uOwn[4] < 0.0) sh = mix(sh, 1.0, -0.75 * uOwn[4]);
 float dl = sat(dot(n, rlSun));
 float d2 = dot(q, q);
 float ao = 1.0 - 0.55 * sat(-dot(n, q) / sqrt(d2)) / max(d2, 1.0);
 float c1 = abs(dot(q - cn, n1)), c2 = abs(dot(q - cn, n2)), c3 = top - q.y;
 float gather = (1.0 - 0.22 * exp(-(n == n1 ? c2 : c1) * 3.0)) * (abs(n.y) > 0.5 ? (1.0 - 0.2 * exp(-c1 * 3.0)) * (1.0 - 0.2 * exp(-c2 * 3.0)) : 1.0 - 0.22 * exp(-c3 * 3.0));
 float fall = 1.0 - 0.3 * (1.0 - smoothstep(-1.8, 0.2, q.y));
 vec3 light = day * vec3(1.06, 0.97, 0.85) * 0.5 * dl * sh * fall + day * vec3(0.2, 0.235, 0.29) * (n.y < -0.5 ? 0.75 : 0.9) * ao;
 return alb * (light * gather + 0.5 * rlThrow(q, n));
}
vec3 rlRoomB(vec3 ro, vec3 rd, vec3 day) {
 float wide = 2.5 * max(uOwn[6], 0.0);
 float tx = (rd.x > 0.0 ? 2.1 + wide - ro.x : 3.6 + wide + ro.x) / max(abs(rd.x), 1e-4), ty = (rd.y > 0.0 ? rlTop - ro.y : ro.y - rlFloor) / max(abs(rd.y), 1e-4), tz = (2.1 + 2.0 * wide - ro.z) / rd.z;
 float t = min(tx, min(ty, tz));
 vec3 q = ro + rd * t, n, alb;
 if (t == ty) n = vec3(0.0, rd.y > 0.0 ? -1.0 : 1.0, 0.0); else if (t == tx) n = vec3(-sign(rd.x), 0.0, 0.0); else n = vec3(0.0, 0.0, -1.0);
 float big = noise(q.xy * 1.2 + q.z + 5.0);
 vec3 c;
 if (n.y > 0.5) {
  float bx = q.x / 0.36, bi = floor(bx), bf = bx - bi, w = 0.012 + t / uRes.y * 2.0;
  float gap = smoothstep(0.0, w, min(bf, 1.0 - bf));
  float gr = noise(vec2(q.x * 26.0, q.z * 1.6 + bi * 9.0));
  alb = vec3(0.36, 0.25, 0.17) * (0.75 + 0.3 * hash11(bi + 2.0) + 0.3 * (gr - 0.5)) * (0.4 + 0.6 * gap);
  if (rlDye > 0.0) alb = mix(alb, rlDyed(uKind[2]) * (0.75 + 0.3 * hash11(bi + 2.0) + 0.3 * (gr - 0.5)) * (0.4 + 0.6 * gap), rlDye);
  c = alb * rlThrow(q, n) * 1.4;
  vec3 m = reflect(rd, n);
  float u = -dot(q.xz, m.xz) / max(dot(m.xz, m.xz), 1e-3);
  vec3 a = q + m * max(u, 0.0);
  float r = length(a.xz) , R = rlR(clamp(a.y, -rlYc, rlYc)), s = 0.1 + 0.08 * max(a.y - rlFloor, 0.0);
  c += rlI * rlHue * vec3(1.0, 0.72, 0.45) * 0.16 * (1.0 - smoothstep(R - s, R + s, r)) * (1.0 - smoothstep(rlYc - s, rlYc + s, abs(a.y))) * (0.8 + 0.4 * gr) * gap * exp(-0.8 * (a.y - rlFloor));
 } else {
  alb = vec3(0.64, 0.5, 0.37) * (0.92 + 0.14 * big);
  if (rlDye > 0.0) alb = mix(alb, rlDyed(uKind[0]) * (0.92 + 0.14 * big), rlDye);
  c = alb * rlThrow(q, n) * 0.75;
 }
 vec3 k = vec3(2.1 + wide - q.x, q.y - rlFloor, 2.1 + 2.0 * wide - q.z), k2 = vec3(q.x + 3.6 + wide, rlTop - q.y, 9.0);
 k = min(k, k2) + abs(n) * 9.0;
 c *= (1.0 - 0.35 * exp(-k.x * 4.0)) * (1.0 - 0.35 * exp(-k.y * 4.0)) * (1.0 - 0.35 * exp(-k.z * 4.0));
 if (rlDayB > 0.0) {
  float sh = rlShadow(q);
  if (uOwn[4] < 0.0) sh = mix(sh, 1.0, -0.75 * uOwn[4]);
  c += rlDayB * alb * day * (vec3(1.06, 0.98, 0.88) * 0.75 * sat(dot(n, rlSun)) * sh + vec3(0.36, 0.38, 0.42) * (0.75 + 0.25 * n.y)) * (1.0 - 0.3 * exp(-3.0 * min(k.x, min(k.y, k.z))));
 }
 return c + alb * vec3(0.007, 0.012, 0.026);
}
vec3 rlSky(vec3 rd, vec3 day) {
 float up = max(rd.y, 0.0), pale = max(uOwn[3], 0.0) / max(abs(uOwn[3]), 1e-3);
 vec3 a = rlDyed(uKind[0]), b = rlDyed(uKind[1]);
 vec3 d = mix(b + 0.12, a, smoothstep(0.0, 0.42, up)) * day * 1.25 + 0.15 * day * exp(-up * 14.0);
 vec3 n = mix(a * 0.34 + b * 0.1, a * 0.05, smoothstep(0.0, 0.3, up)) + 0.05 * b * exp(-up * 22.0);
 return mix(n, d, pale);
}
vec3 rlOutside(vec3 ro, vec3 rd, vec3 day) {
 vec3 sky = rlSky(rd, day);
 if (rd.y > -1e-3) return sky;
 float t = (rlG - ro.y) / rd.y, far = 1.0 - exp(-max(t - 4.0, 0.0) * 0.07);
 vec3 q = ro + rd * t;
 if (uOwn[3] > 0.0) {
  float big = noise(q.xz * vec2(0.5, 0.9) + 3.0), e = 0.06;
  vec2 s = rot(0.4) * q.xz * vec2(1.3, 2.6);
  float lie = noise(s), lx = noise(s + vec2(e, 0.0)) - lie, ly = noise(s + vec2(0.0, e)) - lie;
  vec3 n = normalize(vec3(-lx, e * 5.0 / (1.0 + 0.1 * t), -ly));
  vec3 alb = mix(vec3(0.84), rlDyed(uKind[2]) + 0.04, 0.85) * (0.9 + 0.16 * big + 0.06 * (noise(q.xz * 40.0) - 0.5) * exp(-t * 0.1));
  vec3 c = alb * (day * (vec3(1.59, 1.45, 1.28) * sat(dot(n, rlSun)) * rlShadow(q) + rlDyed(uKind[0]) * 0.45 + 0.1) * (1.0 - 0.4 * exp(-1.6 * length(q.xz))) + 0.9 * rlThrow(q, n));
  return mix(c, rlSky(vec3(0.0), day), sat(far * 1.3));
 }
 float a = noise(q.xz * vec2(1.6, 5.0) + vec2(0.0, uTime * 0.11)) - 0.5, b = noise(q.xz * vec2(5.0, 15.0) - vec2(uTime * 0.16, 0.0)) - 0.5;
 vec3 m = reflect(rd, normalize(vec3(0.05 * (a + b), 1.0, 0.07 * a)));
 m.y = abs(m.y);
 vec3 c = rlSky(m, day) * 0.8;
 float u = -dot(q.xz, m.xz) / max(dot(m.xz, m.xz), 1e-3);
 vec3 h = q + m * max(u, 0.0);
 float y = clamp(h.y, -rlYc, rlYc), R = rlR(y), r = length(h.xz), s = 0.03 + 0.03 * max(h.y - rlG, 0.0), k = fract(2.0 * rlN * rlF(y, vec2(0.0, -1.0)));
 float w = (1.0 - smoothstep(R - s, R + s, r)) * (1.0 - smoothstep(rlYc - s, rlYc + s, abs(h.y)));
 c = mix(c, rlI / (1.0 + 0.36 * rlI) * rlHue * 1.3 * (0.35 + 0.65 * sat(1.0 - r * r / max(R * R, 1e-3))) * (1.0 - 0.35 * rlHw * rlBell(min(k, 1.0 - k) / 0.16)) * rlPapered(0.5 + 0.5 * y / rlYc) * (1.0 - 0.75 * max(uOwn[4], 0.0)), 0.75 * w);
 c += 0.16 * rlThrow(q, vec3(0.0, 1.0, 0.0)) * (0.4 + 1.2 * (a + 0.5));
 return mix(c, rlSky(vec3(0.0), day), far);
}
// Where number i of the others hangs, and how large.
vec4 rlOther(float i) {
 float h1 = fract(i * 5.755 + 0.13), h2 = fract(i * 7.57 + 0.41), on = smoothstep(0.0, 0.3 + 0.7 * h2, abs(uOwn[6]));
 if (uOwn[6] > 0.0) {
  float z = mix(1.8, 15.0, (11.5 - i + 0.8 * h1) / 12.0), s = (0.65 + 0.4 * h2);
  z = mix(z, 1.0 + 0.45 * z, 1.0 - rlOut);
  return vec4((fract(i * 0.618 + 0.36) * 2.2 - 1.1) * (z + 4.5), rlB ? (s * on - 1.0) * 1.5 : (h2 - 0.35) * (0.8 + 0.1 * z), z, s * on);
 }
 if (rlB) { float c = i < 6.0 ? i - 6.0 : i - 5.0; return vec4(c * (2.0 * rlA + 0.24), (on * 0.88 - 1.0) * 1.5, 0.55, 0.88 * on); }
 float c = mod(i, 4.0) - 2.0, r = floor(i / 4.0) - 1.0;
 c += c > -0.5 ? 1.0 : 0.0;
 return vec4(c * (2.05 * rlA + 0.12) + r * 0.2, r * (2.2 * rlH + 0.16), 0.5, (0.86 + 0.14 * h1) * on);
}
// One of the others, over what is behind it.
vec3 rlMore(vec3 c, vec2 l, float i, float tilt, float px, vec3 day, vec3 air, float far, float dim) {
 float R = max(rlR(clamp(l.y, -rlYc, rlYc)), 0.02), ex = sat(abs(l.x) / R), rd = sqrt(1.0 - ex * ex);
 float w = (1.0 - smoothstep(-px, px, abs(l.x) - R)) * (1.0 - smoothstep(-px, px, abs(l.y) - rlYc + px));
 vec2 d = vec2(clamp(l.x / R, -1.0, 1.0), -rd);
 float f = rlF(l.y + tilt * rd * R, d) * rlN, k = fract(2.0 * f), rib = rlHw * rlBell(min(k, 1.0 - k) / (0.14 + px * 16.0)) / (1.0 + px * 20.0);
 if (rlU > 0.0) { rib = max(rib, rlUpRib(rlUp(d), R * max(rd, 0.1), 0.015 + px)); }
 float own = uBands[int(mod(i * 5.0 + 2.0, 16.0))], lamp = 0.3 * rlI + (0.7 * own + 0.3 * max(-uOwn[3], 0.0) + 0.8 * uHits) * rlGain;
 vec3 dye = mix(vec3(1.0), 1.3 * rlDyed(kindColour(mod(i * 1.7, 4.0))), rlDye);
 vec3 pc = lamp / (1.0 + 0.36 * lamp) * rlHue * dye * (0.14 + 0.86 * exp(-dot(l, l) * (rlB ? 1.2 : 2.5))) * (0.3 + 0.8 * rd) * (1.3 + 1.6 * max(-uOwn[3], 0.0)) * (1.0 - 0.65 * rib);
 vec3 dl = day * (0.2 + 0.45 * sat(dot(vec3(d.x, l.y / rlH * 0.6, d.y), rlSun)) + 0.1 * l.y / rlH) * dye * (1.0 - 0.3 * rib);
 pc += dl * rlDay1;
 if (uOwn[4] > 0.0) { float ho = rlHoles(d, f / rlN, 0.08 + px * 6.0); pc = mix(pc, pc * mix(0.16, 1.9, ho), uOwn[4]); }
 float there = uOwn[4] < 0.0 ? mix(1.0, sat(rib + 0.05), -uOwn[4]) : 1.0;
 pc = mix(pc, pc * 0.35, 1.0 - smoothstep(0.02, 0.05, rlYc - abs(l.y)));
 return mix(c, mix(pc, air, far) * dim, w * there);
}
// The light of the day on the paper.
vec3 rlDaylight(vec3 n, float lit) {
 float nl = dot(n, rlSun), w = max(nl, 0.0);
 float wr = rlSq(sat(nl * 0.6 + 0.4));
 vec3 bounce = vec3(0.3, 0.28, 0.25) * sat(0.5 + 0.5 * dot(n, vec3(0.8, 0.0, 0.5)));
 return vec3(1.06, 0.98, 0.88) * (0.48 * w + 0.28 * wr) + vec3(0.18, 0.2, 0.23) * (0.75 + 0.25 * n.y) + bounce * 0.5 + 0.09 * lit;
}
vec3 render(vec2 p) {
 rlB = uVar > 0.5;
 rlGain = 0.35 + 1.4 * uEnergy;
 rlA = rlB ? 0.6 : 1.0; rlH = rlB ? 1.36 : 0.72; rlYc = rlB ? 1.25 : rlH * 0.968;
 rlN = uOwn[1] == 0.0 ? 1.0 : exp2(uOwn[1] * (uOwn[1] > 0.0 ? 1.05 : 2.0));
 rlU = sat(-2.0 * uOwn[2]); rlHw = 1.0 - smoothstep(0.5, 1.0, -uOwn[2]); rlUn = floor((rlB ? 16.0 : 18.0) * rlN + 0.5);
 if (uOwn[0] > 0.0 && !rlB) { rlA = mix(rlA, 0.74, uOwn[0]); rlH = mix(rlH, 0.78, uOwn[0]); rlYc = rlH * 0.968; }
 if (uOwn[0] < 0.0 && !rlB) { rlA = mix(rlA, 1.42, -uOwn[0]); rlH = mix(rlH, 0.46, -uOwn[0]); rlYc = rlH * mix(0.968, 0.84, -uOwn[0]); }
 rlDye = abs(uOwn[7]); rlOut = abs(uOwn[3]); rlG = rlB ? rlFloor : -rlH * 1.08 - 0.22;
 rlTop = (rlB ? 1.75 : 1.36) + (rlB ? 1.3 : 2.0) * max(uOwn[5], 0.0);
 rlDayB = rlB ? max(max(-uOwn[7], 0.0) * step(0.0, uOwn[3]), max(uOwn[3], 0.0)) : 0.0;
 rlDay1 = rlB ? rlDayB : 1.0;
 rlSagD = (rlB ? 0.014 : 0.018) * (0.95 + 0.12 * sin(uTime * 0.35) - 0.62 * sat(uLow * rlGain));
 if (rlN != 1.0) rlSagD /= rlN * sqrt(sqrt(rlN));
 if (rlU > 0.0) rlSagD *= 1.0 + rlU * mix(3.4, 0.6, rlHw);
 rlLamp = vec3(0.26 * sin(TAU * uLoop), 0.05 * cos(TAU * uLoop), -0.26 * cos(TAU * uLoop));
 if (rlB) rlLamp = vec3(0.12, 0.0, 0.12) * rlLamp / 0.26 + vec3(0.0, -0.45, 0.0);
 rlI = (rlB ? 0.42 : 0.16) + (rlB ? 1.3 : 1.1) * uLevel * rlGain + 1.3 * uCue;
 rlHue = mix(vec3(1.0, 0.8, 0.56), mix(vec3(1.0, 0.6, 0.3), uKind[1], 0.2), sat(0.1 + 0.9 * uPad * rlGain));
 rlHue *= mix(vec3(1.0, 0.72, 0.45), vec3(1.0), smoothstep(0.1, 1.1, rlI));
 if (rlDye > 0.0) rlHue = mix(rlHue, rlHue * 0.25 + 0.8 * uKind[3] / max(max(uKind[3].r, max(uKind[3].g, uKind[3].b)), 0.1), 0.6 * rlDye);
 if (rlOut > 0.0 && !rlB) rlI += 0.35 * max(-uOwn[3], 0.0);
 rlSun = normalize(vec3(-0.75, 0.3, -0.6));
 vec3 day = vec3(1.15) * (1.0 - 0.72 * sat(uLevel * rlGain + 0.5 * uCue)) * (1.0 + 0.15 * uMic) * (1.0 + 0.05 * sin(uTime * 0.13));
 if (uOwn[3] > 0.0) day = mix(day, vec3(1.25), 0.6 * uOwn[3]);
 if (!rlB && (uOwn[7] < 0.0 || uOwn[3] < 0.0)) { day *= 1.0 - 0.95 * max(-uOwn[7], -uOwn[3]); rlI *= 1.0 + 0.5 * max(-uOwn[7], -uOwn[3]); }
 if (rlDayB > 0.0) rlI *= 1.0 - 0.45 * rlDayB;
 float asp = uRes.x / uRes.y;
 float D = rlB ? 4.7 : 4.4, zoom = min(1.0, asp * 0.95) * mix(1.06, 0.94, uSpace), foc = (rlB ? 1.24 : 2.3) * zoom;
 float sway = 0.16 * sin(uTime * 0.041);
 vec3 ro = vec3(sway, rlB ? 0.2 : -1.35, -D);
 if (rlOut > 0.0 && !rlB) ro.y = mix(ro.y, -0.35, rlOut);
 if (uOwn[5] > 0.0) ro.y = mix(ro.y, 2.3, uOwn[5]);
 if (uOwn[5] < 0.0) ro.y = mix(ro.y, rlB ? -1.3 : mix(-2.9, rlG + 0.25, rlOut), -uOwn[5]);
 if (rlOut > 0.0) foc *= 1.0 - (rlB ? 0.0 : 0.36) * rlOut;
 vec2 at = rlB ? vec2(0.26, 0.015) : vec2(-0.2, -0.015);
 at.x *= smoothstep(0.6, 1.6, asp);
 if (rlOut > 0.0 && !rlB) at = mix(at, vec2(-0.16 * smoothstep(0.6, 1.6, asp), 0.09), rlOut);
 vec3 rd = normalize(vec3(p - at - ro.xy * foc / D, foc));
 float px = D / (foc * uRes.y);
 // the lantern's own space: it swings or rocks, and turns a few degrees a minute
 float sw = 0.006 * sin(uTime * 0.5) + (rlB ? 0.012 : 0.03) * 4.0 * uHits * (1.0 - uHits);
 vec3 pv = vec3(0.0, rlB ? rlFloor : 1.9, 0.0), lo = ro - pv, ld = rd;
 mat2 M = rot(sw), T = rot(0.4 * sin(uTime * 0.008));
 lo.xy *= M; ld.xy *= M; lo += pv;
 lo.xz *= T; ld.xz *= T;
 float cover = 0.0, tb = 0.0;
 {
  float Rb = rlA + 0.03, Hb = rlYc + 0.01;
  float a = dot(ld.xz, ld.xz), b = dot(lo.xz, ld.xz), disc = b * b - a * (dot(lo.xz, lo.xz) - Rb * Rb);
  if (disc > 0.0) {
   disc = sqrt(disc);
   float iy = 1.0 / (abs(ld.y) < 1e-4 ? 1e-4 : ld.y), y1 = (-Hb - lo.y) * iy, y2 = (Hb - lo.y) * iy;
   float t = max((-b - disc) / a, min(y1, y2)), tEnd = min((-b + disc) / a, max(y1, y2)), best = 1.0;
   for (int i = 0; i < 34; i++) {
    if (t > tEnd) break;
    float d = rlSkin(lo + ld * t);
    if (d < best) { best = d; tb = t; }
    if (d < 0.0006) break;
    t += max(d * 0.9, 0.002);
   }
   cover = (1.0 - smoothstep(0.1, 1.2, best / px));
   if (best < 0.01) tb += rlSkin(lo + ld * tb);
  }
 }
 vec3 c = vec3(0.0);
 if (cover < 1.0 || uOwn[4] < 0.0) {
  if (rlOut < 1.0) c = rlB ? rlRoomB(ro, rd, day) : rlRoomA(ro, rd, day);
  if (rlOut > 0.0) c = mix(c, rlOutside(ro, rd, day), rlOut);
  if (uOwn[6] != 0.0) {
   vec3 air = rlOut > 0.0 ? rlSky(vec3(0.0), day) : c;
    vec2 at2 = at + ro.xy * foc / D; vec4 bo = vec4(0.0); vec3 bl = vec3(0.0, 0.0, -1.0); float bp = 0.0, by = 0.0, bd = 1.0;
    for (int i = 0; i < 12; i++) {
     vec4 o = rlOther(float(i));
     if (uOwn[6] > 0.0) o.x /= foc;
     float z = o.z + D, s = foc / z, pw = z / (foc * uRes.y * o.w);
     if (!rlB) o.y += 0.02 * sin(uTime * 0.23 + float(i));
     vec2 l = (p - at2 - (o.xy - ro.xy) * s) / (s * o.w);
     if (abs(l.x) < rlA && abs(l.y) < rlYc) if (abs(l.x) < rlR(l.y) + pw) { bo = o; bl = vec3(l, float(i)); bp = pw; by = (ro.y - o.y) / z; bd = 1.0; }
     if (!rlB && l.y > rlYc) c = mix(c, c * 0.35, (1.0 - rlOut) * (1.0 - smoothstep(0.008, 0.008 + 2.0 * pw, abs(l.x))));
     if (uOwn[3] < 0.0 && rd.y < 0.0) {
      l = (p - at2 - (vec2(o.x, 2.0 * rlG - o.y) - ro.xy) * s) / (s * o.w);
      l.x += 0.05 * sin(l.y * 23.0 + uTime * 0.9 + float(i)) * (1.0 + 0.5 * sin(l.y * 7.0)); l.y = -l.y;
      if (abs(l.x) < rlA && abs(l.y) < rlYc) if (abs(l.x) < rlR(l.y)) { bo = o; bl = vec3(l, float(i)); bp = pw * 3.0; by = (o.y - ro.y) / z; bd = 0.6; }
     }
    }
    if (bl.z >= 0.0) c = rlMore(c, bl.xy, bl.z, by, bp, day, air, uOwn[6] > 0.0 ? rlOut * (1.0 - exp(-bo.z * 0.07)) : 0.0, bd);
   }
  // the cord, or the legs
  if (!rlB) {
   float u = -lo.z / ld.z; vec3 a = lo + ld * u;
   float w = (1.0 - smoothstep(0.011 - px, 0.011 + px, abs(a.x))) * step(min(0.5, rlYc - 0.05), a.y) * (1.0 - rlOut);
   c = mix(c, (vec3(0.2, 0.185, 0.17) - 8.0 * a.x) * day, w);
  } else {
   for (int i = 0; i < 3; i++) {
    float an = 0.6 + TAU * float(i) / 3.0;
    vec3 l0 = vec3(0.22 * vec2(sin(an), cos(an)), -rlYc).xzy, l1 = vec3(0.42 * vec2(sin(an), cos(an)), rlFloor).xzy;
    vec3 u = l1 - l0, w0 = l0 - ro;
    float b = dot(u, rd), s = sat((b * dot(rd, w0) - dot(u, w0)) / max(dot(u, u) - b * b, 1e-4));
    w0 += u * s;
    float w = (1.0 - smoothstep(0.011 - px, 0.011 + px, sqrt(max(dot(w0, w0) - rlSq(dot(w0, rd)), 0.0))));
    c = mix(c, vec3(0.02, 0.016, 0.012) + rlI * rlHue * 0.03 * (1.0 - s), w);
   }
  }
 }
 if (cover > 0.0) {
  vec3 q = lo + ld * tb, pc;
  float r = max(length(q.xz), 1e-3);
  vec2 dr = q.xz / r;
  vec3 vl = rlLamp - lo;
  float m2 = max(dot(vl, vl) - rlSq(dot(vl, ld)), 0.0);
  bool mouth = !rlB && q.y < -rlYc + 0.004 && r < rlR(-rlYc) - 0.004;
  float end = -1.0;
  if (uOwn[5] != 0.0 || uOwn[0] != 0.0 || rlOut > 0.0) { end = q.y > 0.0 ? 1.0 : -1.0; mouth = abs(q.y) > rlYc - 0.004 && r < rlR(end * rlYc) - 0.004; }
  if (mouth) {
   vec3 e = vec3(rlA, rlH * (rlB ? 1.3 : 1.0), rlA), o = q / e, d = ld / e;
   float dd = dot(d, d), bb = dot(o, d), t = (-bb + sqrt(max(bb * bb - dd * (dot(o, o) - 1.0), 0.0))) / dd;
   vec3 q2 = q + ld * t, v = q2 - rlLamp;
   float f2 = rlN * rlF(q2.y, q2.xz / max(length(q2.xz), 1e-3));
   pc = (rlI / (1.0 + 0.3 * rlI) * rlHue * (1.0 + 0.5 / (dot(v, v) + 0.15)) + day * 0.2) * (1.0 - 0.25 * rlBell((abs(fract(2.0 * f2) - 0.5) - 0.5) / 0.12));
   pc *= 0.75 + 0.35 * smoothstep(-0.6, 0.3, -end * q2.y);
   if (rlDye > 0.0) pc *= rlPapered(0.5 + 0.5 * end);
   pc += rlI * rlHue * (1.0 + 3.0 * uKeys * rlGain) * exp(-m2 / 0.03);
   float in2 = smoothstep(-1.0, 1.0, (rlR(end * rlYc) - 0.03 - r) / (px * 2.0));
   pc = mix(vec3(0.1, 0.085, 0.07) * (day + rlI * rlHue), pc, in2);
  } else {
   float f = rlF(q.y, dr), e = 0.004;
   float dR = (rlR(q.y + e) - rlR(q.y - e)) / (2.0 * e);
   dR -= rlSagD * (rlSag(rlF(q.y + e, dr)) - rlSag(rlF(q.y - e, dr))) / (2.0 * e);
   float ny = -clamp(dR, -8.0, 8.0);
   float th = atan(q.x, -q.z - 1e-5);
   vec3 P = rlPaper(q, th, f, px);
   vec3 n = normalize(vec3(dr.x, ny, dr.y) + vec3(dr.y, 0.0, -dr.x) * P.z * 0.35);
   if (rlU > 0.0) {
    float u0 = rlUp(q.xz), ue = min(u0 + 0.03, 1.0), ub = max(u0 - 0.03, 0.0), s = rlSag(f);
    float dT = -rlSagD * (rlSag2(s, ue) - rlSag2(s, ub)) / max((ue - ub) * TAU / rlUn, 1e-3);
    n = normalize(vec3(dr.x, ny, dr.y) - dT / r * vec3(-dr.y, 0.0, dr.x));
   }
   float face = sat(-dot(n, ld));
   f = clamp(f, 0.0, 15.999);
   vec3 v = q - rlLamp;
   float d2 = dot(v, v), wide = sat(uDrone * rlGain);
   float core = sat(0.3 + 0.7 * dot(n, v) / sqrt(d2)) / (d2 * 1.3 / (rlB ? 0.3 : 1.0) + 0.3);
   float s2 = mix(0.05, 0.22, wide) * (rlB ? 0.5 : 1.3);
   float thru = exp(-m2 / s2) + 0.4 * exp(-m2 / (s2 * 4.0));
   vec4 m = piece(vec2(0.5 + th * 0.31, 0.5 - 0.46 * q.y / rlYc));
   vec3 tint = mix(vec3(1.0), m.rgb / max(max(m.r, max(m.g, m.b)), 0.03) * 1.2, sat(m.a * 0.6 * rlGain)) * (1.0 + 0.35 * m.a * rlGain);
   vec3 rim = exp(-(1.0 - face) * vec3(0.6, 1.35, 2.5));
   float k = fract(f), bd = uBands[int(floor(f))];
   vec3 in_ = rlI / (1.0 + 0.36 * rlI) * rlHue * tint * rim * (rlB ? 1.7 : 1.15) * ((rlB ? 0.14 : 0.24) + 0.42 * core + 1.05 * thru * face) * (1.0 + 1.0 * bd * rlGain * rlSq(sin(PI * k)));
   // the small lamp of the phrase
   vec3 sp = vec3(sin(0.8 * sin(uTravel * 0.17)), 0.0, -cos(0.8 * sin(uTravel * 0.17))) * 0.8;
   sp.y = 0.4 * rlH * sin(uTravel * 0.11 + 1.0); sp.xz *= rlR(sp.y);
   vec3 sv = q - sp;
   in_ += mix(uKind[3], vec3(1.0, 0.9, 0.75), 0.35) * uPhrase * rlGain * 0.05 / (dot(sv, sv) + 0.035);
   // a tap runs over the paper as a ring
   vec3 tq = rlTap; if (rlB) tq = vec3(-0.35, 0.65, -0.4);
   float td = length(q - tq);
   in_ += mix(uKind[4], vec3(1.0, 0.85, 0.65), 0.5) * uHits * rlGain * 1.3 * rlBell((td - 1.7 * (1.0 - uHits)) / 0.26);
   pc = in_ * P.x;
   vec3 dl = !rlB || rlDayB > 0.0 ? rlDaylight(n, P.x) : vec3(0.0);
   if (!rlB) pc += day * dl * P.y * vec3(0.95, 0.93, 0.885);
   else pc += vec3(0.01, 0.012, 0.018) * P.y + rlDayB * day * dl * P.y * 0.92;
   if (rlDye > 0.0) {
    float gi = floor((th + 10.0) * (rlB ? 9.0 : 13.0) / TAU);
    pc *= rlPapered(smoothstep(-0.7, 0.8, q.y / rlYc + 0.5 * (hash11(gi + 3.0) - 0.5)));
   }
   if (uOwn[4] > 0.0) {
    float ho = rlHoles(dr, clamp(rlF(q.y, dr), 0.0, 15.999), 0.05 + px * 5.0);
    vec3 brass = mix(vec3(0.5, 0.36, 0.2), rlDyed(uKind[1]), rlDye);
    vec3 h2 = normalize(rlSun - ld), metal = brass * (0.05 + rlDay1 * day * (0.22 + 0.7 * sat(dot(n, rlSun)))) + (brass + 0.15) * pow(sat(dot(n, h2)), 24.0) * (0.12 + 0.6 * rlDay1 * day);
    metal += brass * rlI * rlHue * 0.1 * (1.0 - face);
    metal += 0.22 * brass * mix(uKind[4], vec3(1.0, 0.85, 0.65), 0.5) * uHits * rlGain;
    pc = mix(pc, mix(metal, rlI / (1.0 + 0.25 * rlI) * rlHue * tint * (0.7 + 2.6 * thru * face + 0.9 * face * face) + metal * 0.3, ho), uOwn[4]);
   }
   // the hoops at the openings
   float hoop = (1.0 - smoothstep(0.02, 0.035, rlYc - abs(q.y)));
   pc = mix(pc, pc * 0.3, hoop);
  }
  if (uOwn[4] < 0.0) {
   // no paper
   float u = tb + 0.03;
   for (int i = 0; i < 14; i++) { float d = -rlSkin(lo + ld * u); if (d < 0.004) break; u += max(d, 0.02); }
   vec3 q2 = lo + ld * u, v = q2 - rlLamp;
   vec2 d2 = q2.xz / max(length(q2.xz), 1e-3);
   float f2 = fract(2.0 * rlN * rlF(clamp(q2.y, -rlYc, rlYc), d2)), w2 = 1.0 - smoothstep(rlYc - 0.02, rlYc, abs(q2.y));
   float rb = rlHw * rlBell(0.5 * min(f2, 1.0 - f2) / 0.07) * w2;
   if (rlU > 0.0) { rb = max(rb, rlUpRib(rlUp(d2), length(q2.xz), 0.012 + px) * w2); }
   vec3 wood = mix(vec3(0.34, 0.25, 0.16), rlDyed(uKind[2]), rlDye), lit = rlI * rlHue * 0.6;
   vec3 in2 = mix(c, wood * (day * rlDay1 * 0.6 + lit / (dot(v, v) + 0.3) + 0.02), sat(rb) * 0.9);
   in2 += rlI * rlHue * (1.0 + 2.0 * uKeys * rlGain) * (0.5 * exp(-m2 / 0.05) + 2.0 * exp(-m2 * m2 / 0.00006));
   float near = abs(q.y) > rlYc - 0.04 && r > rlR(sign(q.y) * rlYc) - 0.05 ? 1.0 : abs(q.y) > rlYc - 0.004 ? 0.0 : sat(1.6 * rlRib);
   vec3 bar = wood * (0.03 + day * rlDay1 * (0.5 + 0.4 * sat(dot(vec3(dr.x, 0.0, dr.y), rlSun))) + 0.25 * rlI * rlHue + 0.5 * uHits * rlGain * uKind[4]);
   pc = mix(pc, mix(in2, bar, near), -uOwn[4]);
  }
  c = mix(c, pc, cover);
 }
 // a breath of light in the air round it
 {
  vec3 vl = -ro; float m = sqrt(max(dot(vl, vl) - rlSq(dot(vl, rd)), 0.0));
  c += rlI * rlHue * (rlB ? 0.06 : 0.03) * (0.4 + sat(uDrone * rlGain) + 0.6 * uMic) * exp(-m * 2.0);
 }
 c = 1.0 - exp(-1.35 * max(c, 0.0));
 return pow(c, vec3(0.4545));
}
