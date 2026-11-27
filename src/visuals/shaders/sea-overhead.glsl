// name: Sea overhead
// a: Noon
// b: Long evening
// what: A plain of pale sand at noon under a ceiling that is the sea: it hangs a few storeys up, upside down, aquamarine, its slow crests pointing down and its net of light sliding over the sand, where one small figure in a red coat stands; or a long evening, teal and rose, a low sun under the sea's far edge, and a gull on a lone post.
// follows: A drone lowers the sea, lows swell it, highs ripple it. The piece lies in the water as drifts of colour that tint the sand below. Pad lights the horizon, texture blows sand, a phrase lets one swell hang low. A hit sends a drop falling up, a cue lets down a turning column; keys are droplets, a voice lights one patch of sand; the music carries the sea over.
// own: 0 the waves: 1 a few great folds, -1 a small chop; 1 1 frozen into slabs, light in the seams, -1 no water but dull sand or cloth; 2 the ground: 1 still water that mirrors it, -1 walls of rock and ridges; 3 the eye: 1 looks up into it, -1 down on the sand; 4 1 it hangs very low, -1 it ends close by under open sky; 5 1 night, its crests shine, -1 grey weather and rain that falls up; 6 1 many stand there (b: two rows of posts), lamps by night, -1 nobody, and a small boat floats on the sea, mast down; 7 1 lines of ink on paper, -1 dyed in the colours of the sounds
#define ss smoothstep
#define soNt max(uOwn[5], 0.0)
#define soWe max(-uOwn[5], 0.0)
const float soF = 0.92;
float soHz, soEye, soH, soEdge, soSwell; // the horizon on the screen, the eye over the sand, the sea over the sand, how far the sea goes, how tall its swell is
vec2 soSlide; vec3 soSun, soHit, soCol, soMan; float soB, soDeep, soTongue;
vec3 soBoat;
float soV, soVw, soInk; int soFew = 0; // where the pen's lines run
float soUp(float x) { return max(x, 0.0); }
float soLum(vec3 c) { return dot(c, vec3(0.3, 0.55, 0.15)); }
// Night or grey weather over a colour of the air, and the dye of a sound.
vec3 soHour(vec3 c, float y) {
 if (uOwn[5] > 0.0) c = mix(c, vec3(0.012, 0.022, 0.05) + (0.35 * uKind[1] * uKind[1] + 0.03) * exp(-y * 7.0) * (0.28 + 0.8 * uPad), uOwn[5]);
 if (uOwn[5] < 0.0) c = mix(c, vec3(0.5, 0.56, 0.6) * (0.35 + 0.65 * soLum(c)) * mix(1.0, 0.55, ss(0.0, 0.3, y)), -uOwn[5]);
 return c;
}
vec3 soDye(vec3 c, vec3 k) {
 if (uOwn[7] >= 0.0) return c;
 float l = soLum(c);
 return mix(c, (l * 1.5 / (0.8 + 0.35 * l) + 0.015) * k * (0.45 + 0.95 * k), -uOwn[7]);
}
// Soft noise that comes round again far off, so that it stays sound however far the sea has gone.
float soN(vec2 p) {
 vec2 i = floor(p), f = p - i; f = f * f * (3.0 - 2.0 * f);
 vec4 c = mod(vec4(i, i + 1.0), 311.0);
 return mix(mix(hash21(c.xy), hash21(c.zy), f.x), mix(hash21(c.xw), hash21(c.zw), f.x), f.y);
}
// How far the sea hangs below its level at a place: steep crests downward, flat between, in n waves from long to short. g is its slope.
float soHang(vec2 x, int n, float fine, out vec2 g) {
 vec2 q = x + soSlide;
 float s = 0.0, k = 0.36 * exp2(-uOwn[0]), a = 0.95 * soSwell, an = 0.22;
 g = vec2(0.0);
 for (int i = 0; i < n; i++) {
  vec2 d = vec2(sin(an), cos(an));
  float ph = dot(d, q) * k + uTime * 0.85 * sqrt(k) + an * 3.0;
  float e = a * exp(1.35 * (sin(ph) - 1.0)), de = e * 1.35 * cos(ph);
  s += e; g += d * de * k;
  q -= d * de * 0.75;
  k *= 1.56; a *= i == 4 ? 0.6 * fine : 0.585;
  if (uOwn[0] > 0.0) a *= 1.0 - 0.1 * uOwn[0];
  an += i % 2 == 0 ? -0.83 : 1.41;
 }
 vec2 w = (x - vec2(2.6 * sin(uTime * 0.047) - 2.0, 13.0)) / vec2(3.4, 2.1);
 float b = soDeep * exp(-dot(w, w));
 soTongue = b;
 g -= 2.0 * b * w / vec2(3.4, 2.1);
 return s + b;
}
// The net of light: bright seams between drifting cells.
float soNet(vec2 x) {
 x += 0.2 * sin(x.yx * 2.3 + uTime * vec2(0.31, -0.27)) + 0.11 * sin(x.yx * vec2(5.3, 4.7) - uTime * vec2(0.43, 0.37)) + 0.35 * sin(x.yx * 0.7 + 1.0);
 vec2 id = floor(x), f = x - id;
 float a = 9.0, b = 9.0;
 for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
  vec2 o = vec2(i, j), h = hash22(mod(id + o, 311.0) + 40.0), r = o + 0.5 + 0.42 * sin(uTime * (0.35 + 0.3 * h.y) + TAU * h) - f;
  float d = dot(r, r);
  if (d < a) { b = a; a = d; } else b = min(b, d);
 }
 return sqrt(b) - sqrt(a);
}
vec4 soPiece(vec2 w) {
 float s = soF * w.x / w.y / 1.7 + 0.5, v = 1.0 - log(max(w.y, 1.0) / 7.0) / log(6.5);
 float o = max(abs(s - 0.5) - 0.49, 0.0);
 return piece(vec2(clamp(s, 0.01, 0.99), clamp(v, 0.02, 0.97))) * exp(-o * o * 90.0);
}
// What is far off: the clear air under the sea.
vec3 soAir(vec3 r) {
 float y = abs(r.y), x = r.x / max(r.z, 0.1);
 vec3 c;
 if (soB < 0.5) {
  c = mix(vec3(1.9, 1.75, 1.4), vec3(0.62, 1.05, 1.12), ss(0.0, 0.1, y));
  c += (vec3(0.5, 0.42, 0.2) + uKind[1] * 0.9) * uPad * exp(-y * 26.0) * (0.6 + 0.6 * exp(-x * x * 3.0));
 } else {
  float d = x + 0.42;
  c = mix(vec3(1.5, 0.62, 0.42), vec3(0.42, 0.2, 0.36), ss(0.0, 0.12, y));
  c *= 0.45 + 0.8 * exp(-d * d * 2.2);
  float y2 = y - 0.03;
  c += vec3(1.9, 0.9, 0.38) * exp(-(d * d + y2 * y2 * 3.0) * 26.0);
  c += (vec3(0.5, 0.22, 0.12) + uKind[1] * 0.7) * uPad * exp(-y * 22.0);
 }
 if (uOwn[5] != 0.0) c = soHour(c, y);
 return soDye(c, mix(uKind[1], uKind[3], exp(-y * 9.0)));
}
vec3 soSand(float l) {
 vec3 c = soB < 0.5 ? vec3(0.92, 0.81, 0.63) * l : vec3(0.42, 0.31, 0.33) * l;
 return soDye(c, uKind[2] + 0.12);
}
// The nearest slab of ice: how far to its seam, and what it is like.
float soSlab(vec2 x, out vec2 like) {
 x += 0.35 * (vec2(soN(x * 1.3), soN(x * 1.3 + 9.0)) - 0.5);
 vec2 id = floor(x), f = x - id;
 float a = 9.0, b = 9.0;
 like = vec2(0.5);
 for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
  vec2 o = vec2(i, j), h = hash22(mod(id + o, 311.0) + 40.0), r = o + 0.5 + 0.8 * (h - 0.5) - f;
  float d = dot(r, r);
  if (d < a) { b = a; a = d; like = h; } else b = min(b, d);
 }
 return sqrt(b) - sqrt(a);
}
vec3 soEnv(vec3 r) {
 vec3 air = soAir(r);
 if (r.y > 0.0) return air * 0.6;
 float t = 6.0 / max(-r.y, 0.02);
 return mix(air, soSand(soB < 0.5 ? 1.05 : 0.6), exp(-t * 0.012) * ss(0.0, 0.12, -r.y));
}
vec3 soSea(vec3 ro, vec3 rd, float px, out float cover) {
 float top = soH - 0.02, low = soH - 1.75 * soSwell - soDeep;
 float t0 = (low - ro.y) / rd.y, t1 = (top - ro.y) / rd.y;
 cover = 0.0;
 if (t0 > soEdge) return vec3(0.0);
 t0 = max(t0, 2.5);
 vec2 g;
 float t = t0, d = 0.0, pt = t0, pd = low - soH;
 for (int i = 0; i < 20 - 9 * soFew; i++) {
  vec3 q = ro + rd * t;
  d = q.y - soH + soHang(q.xz, 3, 1.0, g) + 0.06 * soSwell;
  if (d > 0.0 || t > t1) break;
  pt = t; pd = d;
  t += max(-d / (rd.y + 0.7), 0.004 * t);
 }
 if (d > 0.0) t = mix(pt, t, sat(pd / min(pd - d, -1e-4)));
 t = min(t, t1);
 vec3 q = ro + rd * t;
// where the sea ends, far off
 float lip = soEdge + 1.6 * sin(q.x * 0.31 + uTime * 0.11) + 0.9 * sin(q.x * 0.83 - uTime * 0.15);
 cover = ss(0.0, 1.0, (lip - q.z) / (0.2 + px * q.z * q.z / soH * 1.2));
 if (cover <= 0.0) return vec3(0.0);
 float hang = soHang(q.xz, 9 - 3 * soFew, (mix(0.4, 0.75, soB) + 1.1 * uHigh) / (1.0 + 0.0025 * t * t) * (0.3 + 1.6 * ss(0.25, 0.8, soN(q.xz * 0.19 - soSlide * 0.2 + uTime * 0.02))), g);
 float far = 1.0 / (1.0 + 0.0011 * t * t), bare = hang - soTongue;
 g *= mix(0.5, 1.0, far);
 float ice = soUp(uOwn[1]), dull = soUp(-uOwn[1]), seam = 0.0;
 vec2 like = vec2(0.5);
 if (ice > 0.0) {
  float e = soSlab((q.xz + soSlide) * 0.22, like), w = 0.012 + 0.04 * like.x * (0.5 + uLow);
  seam = ice * (1.0 - ss(w, w + 0.025 + px * t * 0.5, e));
  g = mix(g, (like - 0.5) * 0.42 + 0.12 * g, ice * (1.0 - 0.7 * seam));
 }
// the ring a drop or the column leaves in it
 float glow = 0.0;
 for (int i = 0; i < 2; i++) {
  float on = i == 0 ? uHits : uCue;
  vec2 w = q.xz - (i == 0 ? soHit : soCol).xz;
  float r = length(w) + 1e-3, e = r - (i == 0 ? 3.2 : 5.5) * (1.0 - on) - 0.3;
  glow += on * exp(-r * r * (i == 0 ? 0.16 : 0.07));
  g += w / r * 0.6 * on * sin(e * 3.4) * exp(-e * e * 1.2);
 }
// a face turned away from us is eased round until it can just be seen
 vec2 to = rd.xz / length(rd.xz);
 float sl = dot(g, to), lim = 0.6 * rd.y / length(rd.xz) + 0.01;
 if (sl < 0.0) g += to * (sl / sqrt(1.0 + sl * sl / (lim * lim)) - sl);
 vec3 n = -normalize(vec3(g.x, 1.0, g.y));
 float cv = sat(-dot(rd, n)), m = 1.0 - max(cv, 0.15 * (1.0 - far));
 float fr = 0.02 + 0.98 * m * m * m * m * m;
 vec3 rt = refract(rd, n, 0.75), rf = reflect(rd, n);
 float s = sat(dot(rt, soSun)), s2 = s * s, s8 = s2 * s2 * s2 * s2, s32 = s8 * s8 * s8 * s8;
 float tip = ss(0.35, 1.5, bare / soSwell + 0.25 * soTongue);
 vec3 c;
 vec4 pc = soPiece(q.xz + g * 2.0);
 vec3 kc = pc.rgb / max(pc.a, 0.02);
 if (soB < 0.5) {
  c = mix(vec3(0.0, 0.11, 0.15), vec3(0.06, 0.55, 0.55), s8);
  c += vec3(0.75, 1.0, 0.8) * s32 * 0.7 + vec3(1.6, 1.6, 1.3) * s32 * s32 * s32 * s32;
  c += vec3(0.05, 0.42, 0.33) * tip * (0.35 + 0.65 * m);
 } else {
  c = mix(vec3(0.006, 0.038, 0.06), vec3(0.05, 0.19, 0.235), s8);
// the low light goes through the thin crests, and glances off every facet that leans to it
  float th = sat(dot(n, vec3(0.5, -0.1, -0.86)) * 1.9 - 0.1); th = th * th + 0.08;
  float thin = ss(0.85, 1.75, bare / soSwell + 0.45 * soTongue);
  c += vec3(2.6, 0.62, 0.36) * thin * th * m * m;
  float gl = sat(dot(rf, vec3(-0.42, -0.02, 0.907))), g4 = gl * gl * gl * gl, g16 = g4 * g4 * g4 * g4;
  c += vec3(1.3, 0.5, 0.34) * (0.1 * g4 * g4 + 2.2 * g16 * g16) * (0.15 + m);
  c += vec3(0.03, 0.2, 0.19) * tip * (0.3 + 0.7 * m);
 }
 if (uOwn[5] > 0.0) { // by night a moon comes through it, and the thin of the water shines
  float th = ss(0.5, 1.6, bare / soSwell + 0.5 * soTongue);
  vec3 own = uKind[0] * (0.35 + uKind[0]) + kc * kc * pc.a;
  vec3 ni = vec3(0.004, 0.012, 0.026) + vec3(0.02, 0.05, 0.08) * s8 + vec3(0.6, 0.75, 0.85) * s32 * (0.2 + 0.8 * s32) * (1.0 - 0.6 * soB);
  ni += own * (th * th * (0.5 + 1.1 * m) + 0.07 * m * m) * (0.6 + 0.8 * uEnergy);
  c = mix(c, ni, uOwn[5]);
 }
 if (uOwn[5] < 0.0) c = mix(c, vec3(0.2, 0.26, 0.29) * (0.25 + 0.9 * soLum(c) + 0.6 * m * tip), -uOwn[5]);
 c = soDye(c, mix(mix(uKind[0], uKind[1], ss(0.25, 0.8, soN(q.xz * 0.09 + soSlide * 0.1))), uKind[3], tip * 0.55));
 if (ice > 0.0) {
  vec3 slab = mix(vec3(0.16, 0.4, 0.46), vec3(0.62, 0.78, 0.78), like.y) * (0.35 + 0.75 * s2) * (0.8 + 0.4 * soN(q.xz * 1.7 + soSlide * 1.7));
  if (soB > 0.5) slab = slab.brg * vec3(0.8, 0.55, 0.65) * 0.75;
  slab = soDye(soHour(slab, 0.5 - 0.5 * like.y) + soNt * 0.05 * slab, mix(uKind[0], uKind[1], like.y));
  c = mix(c, slab, 0.8 * ice);
 }
// the piece, as drifts of colour in the water
 float pw = sat(pc.a * 1.3) * (0.55 + 0.45 * soN(q.xz * 0.3 + soSlide * 0.3));
 c = mix(c, c * (0.45 + 1.1 * kc) + kc * kc * (0.2 + 0.6 * uEnergy), 0.85 * pw);
 c += (soB < 0.5 ? vec3(0.45, 0.8, 0.65) : vec3(0.7, 0.3, 0.22)) * (0.4 + uKind[4]) * glow * 0.7;
 vec3 wet = c;
 c = mix(c, soEnv(rf), fr);
 if (dull > 0.0) { // no water: heaped sand, or a cloth, in a light from one side
  vec3 sun = soB < 0.5 ? vec3(0.62, -0.55, 0.56) : vec3(-0.75, -0.2, 0.63);
  float li = sat(0.22 + 1.4 * dot(n, sun)), grain = 0.85 + 0.3 * soN((q.xz + soSlide) * 14.0) * far;
  vec3 sc = soB < 0.5 ? vec3(1.25, 1.02, 0.74) : vec3(0.95, 0.46, 0.36);
  vec3 cc = sc * (li * li * 1.05 + 0.12) * grain + (soB < 0.5 ? vec3(0.1, 0.17, 0.2) : vec3(0.07, 0.05, 0.13)) * sat(-n.y) * 0.5;
  cc = soDye(soHour(cc, 0.1), mix(uKind[0], uKind[1], 0.5 + 0.5 * n.x));
  cc = mix(cc, cc * (0.4 + 1.2 * kc) + 0.3 * kc * kc, 0.75 * pw);
  c = mix(c, cc + glow * 0.4 * uKind[4], dull);
 }
 if (ice > 0.0) c = mix(c, wet, 0.75 * ice) + seam * soDye(soHour(soB < 0.5 ? vec3(1.5, 1.75, 1.6) : vec3(2.1, 0.9, 0.55), 0.0), uKind[3] + 0.15) * (0.35 + 0.65 * soN(q.xz * 0.25 + uTime * 0.05)) * (1.0 + soNt) + seam * kc * pw * 0.6;
// foam on the hanging crests
 float fz = ss(0.75, 1.35, bare / soSwell) * far;
 if (uOwn[1] != 0.0) fz *= 1.0 - abs(uOwn[1]);
 fz *= 1.0 - sat(1.6 * max(uOwn[3], uOwn[4]));
 if (fz > 0.01) {
  vec2 u = q.xz + soSlide + g * 0.7;
  u += 0.17 * sin(u.yx * vec2(2.3, 2.9) + 1.0) + 0.07 * sin(u.yx * vec2(6.1, 5.3));
  float fo = soN(rot(1.1) * u * 3.8) * 0.5 + soN(rot(0.5) * u * 9.0 + 7.0) * 0.5, wide = 4.2 * px * t / max(cv, 0.05);
  float lace = mix((1.0 - ss(0.0, 0.07, abs(fo - 0.5))) * 0.6 + 0.15 * ss(0.46, 0.75, fo), 0.26, ss(0.1, 0.5, wide));
  c = mix(c, soDye(soB < 0.5 ? vec3(1.4, 1.45, 1.3) : vec3(1.3, 0.66, 0.52), uKind[3] + 0.2) * mix(vec3(1.0), uKind[0] * 0.8, soNt), fz * lace * ss(0.25, 0.65, soN(u * 0.8)) * (soB < 0.5 ? 0.6 : 0.34));
 }
 if (uOwn[7] > 0.0) { soV = (q.z + soSlide.y) * 1.1 + 2.6 * hang + 0.25 * q.x; soVw = px * t * t * 1.1 / (soH - ro.y); }
// the lip, where it thins to nothing and the light comes through; the bands run along it
 float el = exp(-(lip - q.z) * (0.22 + 1.2 * soUp(-uOwn[4])));
 c += soDye((soB < 0.5 ? vec3(0.5, 1.0, 0.85) : vec3(1.6, 0.7, 0.4)), uKind[3]) * (1.0 - 0.6 * soNt) * el * (0.15 + 0.7 * band(0.5 + soF * rd.x / rd.z / 1.75));
 return mix(c, soAir(vec3(rd.x, clamp(rd.y, 0.04, 0.3), rd.z)), 1.0 - exp(-t * mix(0.006, 0.014, uSpace)));
}
float soCap(vec2 q, vec2 a, vec2 b, float ra, float rb) {
 vec2 d = b - a; float h = sat(dot(q - a, d) / dot(d, d));
 return length(q - a - d * h) - mix(ra, rb, h);
}
vec3 soFloor(vec3 ro, vec3 rd, float px) {
 float t = ro.y / max(-rd.y, 1e-3);
 vec3 q = ro + rd * t;
 vec2 x = q.xz;
 float fz = px * t * t / ro.y;
// low ripples the wind has left, and the grain
 float u = x.y * 5.2 + 1.6 * soN(x * 0.7) + x.x * 0.8 + 0.8 * soN(x * 2.3);
 float rip = sin(u) * exp(-fz * 5.0), gr = (soN(x * 60.0) - 0.5) * exp(-fz * 60.0) + (soN(x * 9.0) - 0.5) * exp(-fz * 9.0);
 float big = soN(x * 0.22 + 3.0) * 0.6 + soN(x * vec2(0.6, 0.9)) * 0.4;
 vec3 c;
 vec2 k = (x + soSlide * 0.35 + vec2(0.0, rip * 0.03)) * (soB < 0.5 ? vec2(0.85, 0.8) : vec2(0.5, 0.8));
 float nt = soNet(k);
 float wd = soN(k * 1.9 + uTime * 0.11);
 float net = 1.15 * exp(-nt / (mix(0.12, 0.06, uTone) * (0.35 + 1.5 * wd))) * (0.35 + 0.9 * wd) + 0.6 * exp(-nt * 3.4);
 net = mix(0.38, net, exp(-fz * 2.6));
 net *= 0.15 + 1.5 * ss(0.1, 0.9, soN(x * 0.3 + soSlide * 0.4 + uTime * 0.02));
 vec4 pc = soPiece(x);
 vec3 kc = pc.rgb / max(pc.a, 0.02);
 float pw = sat(pc.a * 1.3);
 float tex = 1.0 + (0.25 + 1.2 * uTexture) * gr * 0.5;
 if (soB < 0.5) {
  vec3 li = vec3(0.66, 0.65, 0.58) + vec3(1.9, 1.75, 1.3) * net;
  li = mix(li, li * (0.3 + 1.1 * kc) + kc * net * 0.7, 0.85 * pw);
  c = soSand(1.0) * (0.88 + 0.24 * big) * (1.0 + 0.1 * rip) * tex * li;
 } else {
  float lo = x.x / max(x.y, 1.0) + 0.42, rake = 0.35 + 1.1 * exp(-lo * lo * 2.5);
  vec3 li = vec3(0.11, 0.12, 0.22) + vec3(1.75, 0.68, 0.38) * sat(0.5 + 0.6 * rip) * ss(0.15, 0.85, big) * rake + vec3(0.7, 0.42, 0.38) * net * 0.6;
  li = mix(li, li * (0.4 + 1.1 * kc) + kc * (0.15 + net * 0.5), 0.75 * pw);
  c = soSand(1.0) * tex * li;
 }
 if (uOwn[5] > 0.0) c = mix(c, soSand(1.0) * ((vec3(0.02, 0.026, 0.04) + 0.02 * kc * pw) * tex + (uKind[0] * 0.06 + 0.08 * kc * pw) * (0.5 + net * 0.6)), uOwn[5]);
 if (uOwn[5] < 0.0) c = mix(c, vec3(0.3, 0.32, 0.33) * (0.35 + 0.8 * soLum(c)), -uOwn[5]);
 c = soDye(c, uKind[2] + 0.12);
 float gone = ss(0.1, 0.7, -uOwn[6]);
// the shadow at the foot of what stands, the light a voice brings there, the ring a drop leaves
 vec2 m = x - soMan.xz;
 float sd = soB < 0.5 ? soCap(m, vec2(0.0), vec2(-1.9, -1.5), 0.34, 0.24) : soCap(m, vec2(0.0), vec2(5.4, -11.0), 0.13, 0.26);
 c *= 1.0 - 0.8 * (1.0 - ss(-0.1 - fz * 0.2, 0.12 + fz * 0.5, sd)) * (soB < 0.5 ? 1.0 : exp(-length(m) * 0.06)) * (1.0 - gone) * (1.0 - 0.8 * soNt);
 if (gone > 0.0) { vec2 bs = (x - soBoat.xz - vec2(0.0, 1.0)) / vec2(3.2, 1.5); c *= 1.0 - 0.45 * gone * exp(-dot(bs, bs) * 1.6); }
 if (uOwn[7] > 0.0) { soV = u / 1.9 + rip * 0.2; soVw = fz * 2.7; }
 c += (soB < 0.5 ? vec3(1.1, 0.9, 0.5) : vec3(1.2, 0.6, 0.3)) * uMic * 1.1 * exp(-dot(m, m) * 0.06);
 for (int i = 0; i < 2; i++) {
  float on = i == 0 ? uHits : uCue, r = length(x - (i == 0 ? soHit : soCol).xz), e = (r - (i == 0 ? 2.2 : 3.6) * (1.0 - on) - 0.35) / (0.16 + fz * 0.5);
  c *= 1.0 + on * (0.8 * exp(-e * e) + 0.55 * exp(-r * r * 0.16));
 }
 return mix(c, soAir(vec3(rd.x, 0.0, rd.z)), 1.0 - exp(-t * mix(0.012, 0.02, uSpace)));
}
// A round drop of sea, rising.
vec3 soDrop(vec3 c, vec2 p, vec3 w, float r, float on, vec3 tint) {
 float k = soF / w.z, rad = r * k;
 vec2 q = (p - vec2(w.x * k, (w.y - soEye) * k + soHz)) / rad;
 q.y *= 0.88;
 float d = length(q), aa = 1.0 / (rad * uRes.y);
 float m = (1.0 - ss(1.0 - aa, 1.0 + aa, d)) * on;
 if (m <= 0.0) return c;
// seen through it the world stands on its head: sand above, sea below
 vec3 up = soB < 0.5 ? vec3(0.1, 0.55, 0.55) : vec3(0.1, 0.12, 0.2), dn = soB < 0.5 ? vec3(1.9, 1.8, 1.45) : vec3(1.6, 0.75, 0.48);
 float bow = q.y + 0.45 * q.x * q.x * sign(q.y), dd = d * d;
 vec3 b = mix(up, dn * 0.75, ss(-0.35, 0.8, bow)) * (1.0 - 0.6 * dd * dd * dd) * (0.4 + tint);
 b += dn * (1.2 * (1.0 - ss(0.06, 0.2, length(q - vec2(-0.34, 0.42)))) + 0.7 * ss(0.5, 0.85, d) * (1.0 - ss(0.85, 0.98, d)) * (1.0 - ss(-0.9, 0.3, q.y)));
 return mix(c, b, m * (0.5 + 0.5 * dd * d));
}
// The one who stands there (a) or the old post with its gull (b), in metres from its foot.
float soBody(vec2 q, float bird) {
 if (soB < 0.5) {
  float d = min(soCap(q, vec2(-0.1, 0.05), vec2(-0.06, 0.7), 0.06, 0.1), soCap(q, vec2(0.11, 0.05), vec2(0.06, 0.7), 0.06, 0.1));
  d = min(d, soCap(q, vec2(0.0, 0.62), vec2(0.0, 1.34), 0.27, 0.17));
  return min(d, length((q - vec2(0.01, 1.64)) * vec2(1.15, 1.0)) - 0.125);
 }
 q.x -= q.y * 0.05;
 float d = soCap(q, vec2(0.0), vec2(0.0, 3.46), 0.14, 0.11);
 if (bird < 0.5) return d;
 q -= vec2(0.02, 3.5);
 d = min(d, soCap(q, vec2(-0.13, 0.22), vec2(0.15, 0.17), 0.13, 0.07));
 d = min(d, soCap(q, vec2(0.15, 0.17), vec2(0.36, 0.1), 0.06, 0.02));
 d = min(d, soCap(q, vec2(-0.2, 0.42), vec2(-0.16, 0.3), 0.085, 0.07));
 return min(d, soCap(q, vec2(-0.22, 0.42), vec2(-0.38, 0.39), 0.03, 0.005));
}
// The boat on the sea overhead, in metres from where its keel lies, y down to its mast.
float soBoatAt(vec2 q) {
 q = rot(0.06 * sin(uTime * 0.4)) * q;
 float hull = max(abs(q.y - 0.06) - 0.36 - 0.06 * q.x * q.x * step(0.06, q.y), max(q.x - 1.8 - 1.1 * q.y, -q.x - 1.75 - 0.3 * q.y)) * 0.75;
 float d = min(hull, soCap(q, vec2(0.3, 0.3), vec2(0.3, 5.0), 0.045, 0.025)), y = q.y - 0.72, j = q.y - 0.8;
 float sail = max(max(-y - 0.05 * q.x, q.x - 0.22), -q.x - 1.9 * (1.0 - y / 4.1) - 0.2 * sin(sat(y / 4.1) * PI)) * 0.85;
 float jib = max(max(-j, 0.5 - q.x - 0.06 * j), q.x - 0.36 - 1.75 * (1.0 - j / 3.2)) * 0.8;
 return min(d, min(sail, jib));
}
vec3 render(vec2 p) {
 soB = step(0.5, uVar);
 float px = 1.0 / (uRes.y * soF);
 float breath = 0.12 * sin(uTime * 0.19);
 soHz = soB < 0.5 ? -0.17 : -0.22; soEye = soB < 0.5 ? 1.75 : 1.6;
 if (uOwn[3] > 0.0) soHz -= 0.4 * uOwn[3];
 if (uOwn[3] < 0.0) { soHz -= 0.5 * uOwn[3]; soEye -= 1.3 * uOwn[3]; }
 soH = (soB < 0.5 ? 7.6 : 6.4) - 1.1 * uDrone + breath;
 soEdge = soB < 0.5 ? 78.0 : 56.0;
 if (uOwn[4] > 0.0) soH = mix(soH, soEye + 0.46 * (soH - soEye), uOwn[4]);
 if (uOwn[4] < 0.0) soEdge *= exp2(2.6 * uOwn[4]);
 soSwell = (soB < 0.5 ? 0.8 : 1.0) * (0.8 + 0.6 * uLow);
 if (uOwn[0] != 0.0 || uOwn[1] > 0.0 || uOwn[3] < 0.0 || uOwn[4] > 0.0) {
  soSwell *= exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.15 : 0.75)) * (1.0 - 0.6 * soUp(uOwn[1]));
  float most = max(0.12, (soH - soEye - 0.5) / 1.75);
  soSwell = max(0.06, soSwell / pow(1.0 + pow(soSwell / most, 4.0), 0.25));
 }
 soDeep = uPhrase * min(2.2, max(0.0, 0.8 * (soH - soEye - 1.5 * soSwell - 0.3)));
 soSlide = vec2(0.10, 0.06) * uTravel;
 soSun = normalize(vec3(0.2, 0.86, 0.5));
 soHit = vec3(0.6 + 1.3 * sin(uTime * 0.11), 0.3, 9.5);
 soHit.y = mix(0.3, soH - 0.8, (1.0 - uHits) * (1.0 - 0.25 * uHits));
 soCol = vec3(-3.0, 0.0, 12.5);
 soMan = soB < 0.5 ? vec3(4.3, 0.0, 19.0) : vec3(3.7, 0.0, 14.0);
 vec3 ro = vec3(0.0, soEye, 0.0), rd = normalize(vec3(p.x, p.y - soHz, soF));
 vec3 c;
 soV = (p.y - soHz) * 46.0; soVw = 1.2 * 46.0 / uRes.y; soBoat = vec3(-1.6 + 0.8 * sin(uTime * 0.05), soH, 13.0);
 if (rd.y > 0.0) {
  float cov;
  vec3 s = soSea(ro, rd, px, cov);
  vec3 air = soAir(rd);
  if (uOwn[4] < 0.0) {
   float hi = ss(0.02, 0.5, rd.y), cl = soN(vec2(p.x * 2.2 + uTime * 0.01, rd.y * 16.0)) * 0.6 + 0.4 * soN(vec2(p.x * 6.0 - uTime * 0.012, rd.y * 40.0));
   air *= 1.0 - uOwn[4] * (0.5 * ss(0.45, 0.8, cl) * (1.0 - hi) - 0.55 * hi);
   if (uOwn[5] > 0.0) { vec2 sp = floor(p * 110.0), sf = fract(p * 110.0) - 0.5; float h = hash21(sp + 70.0); air += uOwn[5] * step(0.985, h) * ss(0.3, 0.0, length(sf)) * vec3(0.8, 0.85, 1.0) * fract(h * 977.0) * ss(0.0, 0.2, rd.y); }
  }
  vec2 sd = rd.xy / rd.z + vec2(0.42, -0.034);
  if (soB > 0.5) air += mix(soDye(vec3(3.0, 1.9, 0.9), uKind[4]), vec3(1.5, 1.5, 1.35), soNt) * (1.0 - 0.8 * soWe) * ss(-px, px, 0.026 - length(sd));
  c = mix(air, s, cov);
 } else c = soFloor(ro, rd, px);
 float ay = abs(p.y - soHz), under = p.y < soHz ? 1.0 : 0.0, wetAt = 0.0;
 if (uOwn[2] > 0.0 && under > 0.5) { // still water lying on it: the same sea seen upside down
  float t = soEye / max(-rd.y, 1e-3), cov;
  vec2 x = (ro + rd * t).xz;
  wetAt = sat((soN(x * vec2(0.22, 0.3) + 5.0) * 0.7 + soN(x * vec2(0.6, 0.9)) * 0.3 - 1.0 + 1.36 * uOwn[2]) / 0.12);
  if (wetAt > 0.0) {
   float v0 = soV, v1 = soVw, rp = 0.012 * exp(-px * t * t) * (1.0 + 2.0 * uHigh);
   vec3 r = normalize(vec3(p.x + rp * sin(x.y * 3.1 + uTime * 0.7 + 2.0 * soN(x)), ay + rp * sin(x.x * 1.7 + x.y * 2.3 - uTime * 0.6), soF));
   soFew = 1;
   vec3 m = soSea(vec3(0.0, -soEye, 0.0), r, px, cov);
   m = mix(soAir(r), m, cov);
   float nd = 1.0 - ay / length(vec2(ay, soF));
   c = mix(c, m * (0.55 + 0.4 * nd * nd * nd), wetAt * 0.93);
   soV = mix(v0, soV, step(0.5, wetAt)); soVw = mix(v1, soVw, step(0.5, wetAt));
  }
 }
 if (uOwn[2] < 0.0) { // ridges far off, and walls that rise on both sides
  float hl = -uOwn[2];
  if (under < 0.5) for (int i = 0; i < 4; i++) {
   float fi = float(i), w = p.x * (2.0 + 0.9 * (3.0 - fi)) + fi * 17.3 + 5.0, ax = abs(p.x + 0.05 * (fi - 1.5));
   float top = (0.035 + 0.02 * fi) * (0.35 + soN(vec2(w, fi))) + 0.02 * soN(vec2(w * 4.3, 3.0)) + 0.006 * soN(vec2(w * 17.0, 7.0));
   top += ss(0.3 + 0.07 * fi, 0.62 + 0.1 * fi, ax + 0.06 * (soN(vec2(ay * 9.0 + fi * 3.0, sign(p.x))) - 0.5)) * (0.16 + 0.2 * fi) * (0.7 + 0.6 * soN(vec2(w * 0.8 + 9.0, 2.0)));
   top = top * hl - 0.012 * (1.0 - hl);
   float in_ = ss(-0.6, 0.6, (top - ay) * uRes.y);
   if (in_ > 0.0) {
    vec2 k = vec2(p.x * 13.0 + fi * 5.0, ay * 5.0); k += 1.2 * vec2(soN(k * 1.1), soN(k.yx));
    float face = soN(k) * 0.65 + soN(k * vec2(2.7, 3.1)) * 0.35, st = soN(vec2(k.x * 0.5, ay * 70.0 + 5.0 * face));
    vec3 rock = (soB < 0.5 ? vec3(0.5, 0.4, 0.31) : vec3(0.2, 0.11, 0.14)) * (0.25 + 0.3 * st + 1.5 * face * face);
    rock *= soB < 0.5 ? 0.6 + 0.9 * ss(-0.6, 0.6, p.x * (p.x > 0.0 ? 1.0 : -1.2)) : 0.55 + 1.1 * exp(-abs(p.x + 0.4) * 2.5);
    rock = soDye(uOwn[5] > 0.0 ? mix(rock, rock * (0.07 + 0.35 * uKind[0] * face * ss(0.0, 0.4, ay)), uOwn[5]) : soHour(rock, 0.3), uKind[2] + 0.05);
    c = mix(c, mix(soAir(vec3(rd.x, 0.02 + 0.3 * ay, rd.z)), rock, (0.25 + 0.2 * fi) * (1.0 - 0.75 * exp(-ay * (60.0 - 12.0 * fi)))), in_);
    soV = (p.x * (fi - 1.5) * 40.0 + ay * 90.0); soVw = 110.0 / uRes.y;
   }
  }
 }
// sand blown in veils low over the plain
 float yy = p.y - soHz;
 if (uTexture > 0.01 && yy < 0.06) {
  float st = soN(vec2(p.x * 2.6 - uTime * 0.16, yy * 34.0 + 2.0 * soN(vec2(p.x * 1.7 - uTime * 0.07, 3.0)))) * 0.6 + 0.4 * soN(vec2(p.x * 7.0 - uTime * 0.4, yy * 90.0));
  float ve = uTexture * ss(0.3, 0.8, st) * exp(-max(yy, 0.0) * 55.0) * (1.0 - ss(0.02, 0.06, yy)) * exp(-max(-yy - 0.03, 0.0) * 9.0);
  c = mix(c, soDye((soB < 0.5 ? vec3(1.9, 1.7, 1.3) : vec3(1.4, 0.65, 0.45)) * (1.0 - 0.95 * soNt), uKind[2] + 0.1) * (0.5 + 0.8 * uKind[2]), 0.85 * ve);
 }
// the one far thing that stands
 float mk = soF / soMan.z;
 vec2 mq = (p - vec2(soMan.x * mk, soHz - soEye * mk)) / mk;
 float own = 1.0, gone = ss(0.1, 0.7, -uOwn[6]);
 if (uOwn[2] > 0.0 && mq.y < 0.0) { own = 0.7 * wetAt; mq.y = -mq.y; }
 float md = soBody(mq, 1.0) * mk * uRes.y;
 vec3 coat = soB < 0.5 ? mix(vec3(0.035, 0.05, 0.06), vec3(0.3, 0.07, 0.05), ss(0.55, 0.65, mq.y) * (1.0 - ss(1.4, 1.5, mq.y))) : vec3(0.05, 0.03, 0.05);
 if (uOwn[7] < 0.0 && soB < 0.5) coat = mix(coat, uKind[4] * uKind[4] * 0.6, -uOwn[7] * ss(0.55, 0.65, mq.y) * (1.0 - ss(1.4, 1.5, mq.y)));
 soInk = (1.0 - ss(-0.7, 0.7, md)) * own * (1.0 - gone);
 c = mix(c, coat, soInk);
 if (uOwn[6] > 0.0 && (soB < 0.5 ? abs(p.y - soHz + 0.1) < 0.36 : abs(p.x - 0.14) < 0.42 && abs(p.y - soHz) < 0.6)) for (int i = 0; i < 16; i++) { // and the others
  float fi = float(15 - i), on = sat(uOwn[6] * 18.0 - fi), h = hash11(fi + 3.3), h2 = hash11(fi * 1.7 + 8.1);
  float pair = floor(fi * 0.5), z = soB < 0.5 ? 11.0 + 34.0 * fi / 16.0 + 3.0 * h2 : 9.0 * exp2(pair * 0.36);
  float x = soB < 0.5 ? (fract(fi * 0.618 + 0.13) - 0.5) * 1.5 * z : (mod(fi, 2.0) < 0.5 ? 3.7 : -0.9) + 0.35 * (h - 0.5);
  if (soB < 0.5 && abs(x / z - soMan.x / soMan.z) < 0.06) x -= 0.12 * z;
  float ok = soF / z;
  vec2 o = (p - vec2(x * ok, soHz - soEye * ok)) / ok;
  if (abs(o.x) > 2.6 || abs(o.y) > 4.3) continue;
  float see = on;
  if (o.y < 0.0) { if (uOwn[2] <= 0.0) continue; see *= 0.7 * wetAt; o.y = -o.y; }
  o *= soB < 0.5 ? 0.9 + 0.35 * h2 : 1.0;
  if (h > 0.5) o.x = -o.x;
  float od = soBody(o, step(0.7, h2)) * ok * uRes.y;
  vec3 oc = coat;
  if (soB < 0.5) oc = mix(vec3(0.035, 0.05, 0.06), kindColour(4.0 * h) * kindColour(4.0 * h) * 0.4, ss(0.55, 0.65, o.y) * (1.0 - ss(1.4, 1.5, o.y)));
  oc = mix(oc, soAir(vec3(rd.x, 0.0, rd.z)), 1.0 - exp(-z * 0.005));
  float in_ = (1.0 - ss(-0.7, 0.7, od)) * see;
  c = mix(c, oc, in_); soInk = max(soInk, in_ * 0.8);
  if (uOwn[5] > 0.0) { vec2 l = o - (soB < 0.5 ? vec2(0.34, 0.95) : vec2(0.2, 3.75)); float r2 = dot(l, l); c += uOwn[5] * see * (uKind[3] + vec3(0.3, 0.16, 0.05)) * (0.55 + 0.6 * band(fi / 15.0)) * (0.012 / (r2 + 0.006) * exp(-r2 * 1.5)); }
 }
 if (gone > 0.0) { // or nobody does, and a boat lies on the sea
  vec2 gg;
  float bk = soF / soBoat.z, lie = soH - 0.6 * soHang(soBoat.xz, 3, 1.0, gg);
  float size = min(1.0, (lie - soEye + 0.9) / 5.2) * 0.9;
  for (int k = uOwn[2] > 0.0 ? 1 : 0; k >= 0; k--) {
   float see = gone * (k > 0 ? 0.7 * wetAt : 1.0), Y = (p.y - soHz) / bk + soEye;
   vec2 o = vec2(p.x / bk - soBoat.x, lie - (k > 0 ? -Y : Y)) / size;
   if (abs(o.x) > 3.2 || see <= 0.0) continue;
   float bd = soBoatAt(o) * bk * size * uRes.y, in_ = (1.0 - ss(-0.7, 0.7, bd)) * see * ss(-0.15, 0.1, o.y);
   vec3 sc = uKind[4] * uKind[4] * (0.5 + 0.5 * sat(o.x * 0.5 + 0.7)) * (1.0 - 0.75 * soNt);
   c = mix(c, mix(vec3(0.04, 0.035, 0.04) + 0.05 * uKind[2], sc, ss(0.62, 0.7, o.y) * step(0.05, abs(o.x - 0.3))), in_);
   if (uOwn[5] > 0.0) { vec2 l = o - vec2(1.9, 0.75); float r2 = dot(l, l); c += uOwn[5] * see * (uKind[3] + vec3(0.3, 0.16, 0.05)) * 0.03 / (r2 + 0.02) * exp(-r2); }
   soInk = max(soInk, in_ * 0.7);
  }
 }
// the cue's column of sea, let down turning
 float ext = 4.0 * uCue * (1.0 - uCue);
 if (ext > 0.004) {
  float ck = soF / soCol.z, Y = (p.y - soHz) / ck + soEye, top = soH - 0.5, tip = mix(top, 0.3, ext);
  float h = sat((Y - tip) / max(top - tip, 0.01)), hh = h * h;
  float X = p.x / ck - soCol.x - 0.16 * sin(Y * 1.7 - uTime * 2.1) * (1.0 - h), R = (0.06 + 0.34 * h + 1.5 * hh * hh * h) * sqrt(ext) + 0.01;
  float u = X / R, aa = 1.0 / (R * ck * uRes.y), m = ss(-aa, aa, 1.0 - abs(u)) * ss(tip - 0.05, tip + 0.05, Y) * (1.0 - ss(top - 0.9, top + 0.3, Y));
  if (m > 0.0) {
   float as = asin(clamp(u, -1.0, 1.0)), tw = 0.5 + 0.5 * sin(as * 2.0 + Y * 3.2 - uTime * 4.0), rim = u * u * u * u;
   vec3 w = soB < 0.5 ? mix(vec3(0.02, 0.3, 0.34), vec3(0.4, 0.95, 0.85), tw) : mix(vec3(0.06, 0.07, 0.12), vec3(0.95, 0.42, 0.33), tw * (0.6 - 0.4 * u));
   w += (soB < 0.5 ? vec3(1.2, 1.3, 1.1) : vec3(1.0, 0.5, 0.4)) * (0.5 * rim + pow(tw, 12.0) * 0.5);
   c = mix(c, w, m * (0.62 + 0.35 * rim));
  }
 }
 if (uOwn[5] < 0.0) { // rain, falling up
  for (int i = 0; i < 3; i++) {
   float fi = float(i), n = 18.0 + 17.0 * fi, X = p.x * n + fi * 7.7 + (p.y * (0.8 + 0.2 * fi)), col = floor(X), h = hash11(mod(col, 173.0) + fi * 31.0);
   float f = fract((p.y * (0.75 + 0.25 * fi)) - uTime * (0.34 + 0.1 * h) + h * 7.0), dx = (X - col - 0.5) / n * uRes.y;
   float st = exp(-dx * dx * 1.6) * ss(0.0, 0.3, f) * ss(0.4, 0.36, f) * step(0.3, h);
   c += -uOwn[5] * st * (0.16 - 0.035 * fi) * (vec3(0.75, 0.85, 0.9) + 0.8 * uKind[1] * uPad) * (0.7 + 0.5 * uHigh);
  }
 }
 if (uOwn[7] > 0.0) { // ink on paper: the darker it is the broader the line
  float l = sat(soLum(c) / (0.75 + 0.25 * soLum(c)) * (soB < 0.5 ? 0.42 : 1.1));
  l = mix(l, ss(0.02, 0.75, l), 0.7);
  float lv = log2(soVw / 0.19), fl = floor(lv), wide = 0.03 + 0.85 * (1.0 - l) * (1.0 - l), ink = 0.0;
  for (int i = 0; i < 2; i++) { // as many lines as there is room for
   float e = exp2(-fl - float(i)), w = 1.4 * soVw * e, d = abs(fract(soV * e) - 0.5) * 2.0;
   ink += (i == 0 ? 1.0 - lv + fl : lv - fl) * (1.0 - ss(wide - w, wide + w, d));
  }
  ink = max(ink, soInk);
  vec3 hue = c / (soLum(c) + 0.06);
  vec3 paper = vec3(1.75, 1.6, 1.36) * (0.96 + 0.06 * soN(p * 220.0)), pen = (0.045 + 0.1 * uKind[0] * uKind[0]) * (0.4 + 0.6 * hue);
  paper = mix(paper, paper * (0.45 + 0.6 * min(hue, 2.0)), 0.3);
  c = mix(c, mix(paper, pen, ink * (0.93 - 0.1 * soN(p * 90.0))), uOwn[7]);
 }
// what falls up
 if (uHits > 0.01) c = soDrop(c, p, soHit, 0.3, ss(0.02, 0.12, uHits), 0.5 + uKind[4]);
 if (uKeys > 0.01) for (int i = 0; i < 6; i++) {
  float fi = float(i), f = fract(uTime * (0.14 + 0.03 * hash11(fi)) + hash11(fi + 7.0));
  c = soDrop(c, p, vec3((hash11(fi + 3.0) - 0.5) * 11.0, f * f * soH, 10.0 + 4.0 * hash11(fi + 5.0)), 0.2 + 0.1 * hash11(fi + 9.0), sat(2.0 * uKeys) * ss(0.0, 0.1, f) * (1.0 - ss(0.8, 0.97, f)), vec3(1.0));
 }
 return screenOf(c * (0.85 + 0.3 * uTone));
}
