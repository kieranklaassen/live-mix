// name: Small world
// a: Round moor
// b: Round sky
// what: A small ball of moorland hangs in a wide pale morning sky: heather, a track, pools and a white house, with trees and stones pointing outward all round it like pins, and it rolls without hurry; or the world is inside out, the moor fills the frame, trees lean in from every side and the sky is a round pool of light in the middle.
// follows: The piece lies round the land and a patch of sun goes round with the loop. Drones raise the middle hills, pads fill the pools, textures colour the heather, phrases the leaves; trees grow where it is loud. Bands are the far hills, level the sun. A hit sends up birds where the loop is, a cue sends wind right round. Keys open flowers, a voice lights the lamp.
vec2 swL;      // the way to the sun, seen from where a thing stands upright
vec3 swSun;    // the sun's colour
float swWave;  // the wind of a cue as it passes
// What stands on the moor: place round it in turns, height of its foot, size, and what it is:
// 0 thorn, 1 birch, 2 pine, 3 stone, 4 house. Nine on the far fold, five on the next, three near.
const vec4 swO[17] = vec4[17](
 vec4(0.05, -0.069, 0.36, 1), vec4(0.155, -0.074, 0.17, 3), vec4(0.27, -0.206, 0.42, 2), vec4(0.375, -0.1, 0.15, 3), vec4(0.5, -0.1, 0.17, 4), vec4(0.6, -0.023, 0.34, 2),
 vec4(0.715, -0.17, 0.36, 0), vec4(0.83, -0.156, 0.3, 1), vec4(0.94, -0.09, 0.21, 3), vec4(0.085, -0.25, 0.5, 0), vec4(0.32, -0.424, 0.24, 3), vec4(0.44, -0.377, 0.46, 1),
 vec4(0.69, -0.297, 0.2, 3), vec4(0.88, -0.422, 0.56, 2), vec4(0.13, -0.981, 0.2, 3), vec4(0.4, -0.786, 0.5, 0), vec4(0.8, -0.7, 0.22, 3));
// The same on the plain under the eye: place of each foot, height, what it is.
const vec4 swB[17] = vec4[17](
 vec4(13.81, 4.49, 5.23, 1), vec4(7.64, 11.24, 2.31, 3), vec4(-0.6, 4.78, 2.02, 2), vec4(-7.04, 7.04, 1.49, 3), vec4(-9.94, 0, 1.69, 4), vec4(-13.48, -9.79, 5.66, 2),
 vec4(-1.28, -5.72, 2.11, 0), vec4(3.09, -5.61, 1.92, 1), vec4(10.29, -4.07, 2.32, 3), vec4(3.41, 2.02, 1.98, 0), vec4(-0.97, 2.07, 0.55, 3), vec4(-2.41, 0.95, 1.19, 1),
 vec4(-1.22, -3.08, 0.66, 3), vec4(1.68, -1.57, 1.29, 2), vec4(0.6, 0.64, 0.17, 3), vec4(-0.93, 0.68, 0.58, 0), vec4(0.41, -1.25, 0.29, 3));
// From 1 below lo to 0 above hi.
#define swS smoothstep
float swX(float hi, float lo, float x) { return 1.0 - swS(lo, hi, x); }
// A line of noise that closes after per cells in x.
float swLine(float x, float per, float seed) {
 float i = floor(x), f = x - i; f = f * f * (3.0 - 2.0 * f);
 return mix(hash21(vec2(mod(i, per), seed)), hash21(vec2(mod(i + 1.0, per), seed)), f);
}
float swGap(float a, float b) { return fract(a - b + 0.5) - 0.5; } // the way round from b to a, in turns
float swSeam(float u) { return swS(0.0, 0.03, u) * swX(1.0, 0.97, u); }
float swLoud(float u) { return swSeam(u) * max(piece(vec2(u, 0.22)).a, piece(vec2(u, 0.5)).a); }
vec3 swInk(vec3 c, float k) { float g = dot(c, vec3(0.3, 0.59, 0.11)); return clamp(mix(vec3(g), c, k), 0.0, 1.0); }
// The top of a fold of the moor, a the angle round it.
float swFold(int k, float a) {
 if (k == 0) return -0.09 + 0.06 * sin(2.0 * a + 1.0) + 0.045 * sin(5.0 * a + 2.0);
 if (k == 1) return -0.36 + 0.11 * sin(3.0 * a + 0.5) + 0.08 * sin(a + 2.0);
 if (k == 2) return -0.8 + 0.14 * sin(2.0 * a + 4.0) + 0.07 * sin(5.0 * a);
 return -1.25 + 0.12 * sin(3.0 * a + 2.0);
}
// A crown of three flat balls: where in its ball a place is, and how far out.
vec3 swCrown(vec2 z, vec4 a, vec4 b, vec4 c) {
 vec2 na = (z - a.xy) / a.zw, nb = (z - b.xy) / b.zw, nc = (z - c.xy) / c.zw;
 float la = dot(na, na), lb = dot(nb, nb), lc = dot(nc, nc);
 return la < lb && la < lc ? vec3(na, la) : lb < lc ? vec3(nb, lb) : vec3(nc, lc);
}
// One tree, z its own measure: the foot at 0, the top near 1. Leaves in dabs, dark under light.
vec4 swTree(vec2 z, float kind, float seed, float e, float lean) {
 z.x -= lean * z.y * z.y;
 vec4 a, b, c;
 if (kind < 0.5) { a = vec4(0.05, 0.63, 0.36, 0.2); b = vec4(0.3, 0.76, 0.27, 0.14); c = vec4(-0.2, 0.54, 0.2, 0.12); }
 else if (kind < 1.5) { a = vec4(0.0, 0.5, 0.16, 0.24); b = vec4(0.03, 0.78, 0.1, 0.22); c = vec4(-0.08, 0.38, 0.13, 0.12); }
 else { a = vec4(0.03, 0.9, 0.2, 0.1); b = vec4(0.17, 0.74, 0.24, 0.075); c = vec4(-0.15, 0.63, 0.19, 0.06); }
 float y = z.y, w = 0.032 * (1.15 - y) + 0.03 * exp(-y * 14.0);
 float tx = z.x - 0.02 * sin(y * 7.0 + seed * 9.0);
 float trunk = swX(e, -e, abs(tx) - w) * step(-0.08, y) * swX(0.86, 0.8, y);
 float bough = min(abs(tx - (y - 0.3) * 0.8), abs(tx + (y - 0.28) * 0.66));
 trunk = max(trunk, swX(e, -e, bough - 0.012) * swS(0.26, 0.3, y) * swX(0.66, 0.56, kind == 1.0 ? y + 0.2 : y));
 float side = swS(-0.5, 0.5, tx / max(w, 0.004) * clamp(swL.x * 4.0, -1.0, 1.0));
 bool birch = kind > 0.5 && kind < 1.5;
 vec3 col = mix(birch ? vec3(0.5, 0.46, 0.5) : vec3(0.2, 0.15, 0.16), birch ? vec3(0.95, 0.91, 0.84) : vec3(0.55, 0.4, 0.3), side);
 if (birch) col *= 1.0 - 0.45 * step(0.72, noise(vec2(tx * 20.0, y * 38.0 + seed)));
 vec3 mid = kind > 1.5 ? vec3(0.2, 0.31, 0.27) : birch ? vec3(0.72, 0.55, 0.2) : vec3(0.42, 0.43, 0.2);
 mid = mix(mid, swInk(uKind[3], 1.0) * 0.85, 0.12 + 0.4 * uPhrase);
 vec3 dark = mid * vec3(0.4, 0.42, 0.55) + vec3(0.02, 0.02, 0.05), up = mix(mid * 1.3 + 0.1, vec3(1.0, 0.9, 0.6), 0.25) * swSun;
 vec3 s = swCrown(z, a, b, c);
 trunk *= swS(-0.06, 0.03, y + 0.06 * sin(z.x * 160.0));
 float al = trunk, mass = swX(0.75, 0.55, s.z);
 al = max(al, mass); col = mix(col, dark, mass / max(al, 0.001));
 vec2 gi = floor(z * 15.0) - 1.0;
 for (int i = 0; i < 9; i++) {
  vec2 id = gi + vec2(i % 3, i / 3);
  vec2 r = hash22(id + seed * 13.0), m = (id + 0.15 + 0.7 * r) / 15.0;
  vec2 dz = (z - m) * vec2(0.8, 1.15);
  if (length(dz) > 0.052 + e) continue;
  vec3 n = swCrown(m, a, b, c);
  float dab = swX(0.052 + e, 0.052 - e, length(dz)) * step(n.z + 0.25 * r.x, 1.12);
  float lit = 0.5 + 0.45 * dot(n.xy, swL) + 0.5 * (r.y - 0.5);
  vec3 dc = mix(mix(dark, mid, swS(0.15, 0.5, lit)), up, swS(0.55, 0.95, lit));
  al = max(al, dab); col = mix(col, dc, dab / max(al, 0.001));
 }
 return vec4(col, al);
}
// A stone, and the house with its lamp.
vec4 swStone(vec2 z, float seed, float e) {
 z.x -= (hash11(seed + 2.0) - 0.5) * 0.3 * z.y;
 float n = noise(z * 9.0 + seed * 7.0), w = 0.2 - 0.09 * z.y + 0.03 * (n - 0.5);
 float d = max(abs(z.x) - w, z.y - 0.95 - z.x * (hash11(seed) - 0.5) + 5.0 * z.x * z.x);
 float lit = swS(-0.35, 0.45, z.x / w * swL.x + 0.5 * (noise(z * vec2(16.0, 9.0) + seed) - 0.5));
 vec3 col = mix(vec3(0.42, 0.41, 0.5), vec3(0.85, 0.79, 0.73) * swSun, lit);
 col = mix(col, vec3(0.72, 0.66, 0.4), 0.5 * swS(0.6, 0.75, n));
 return vec4(col, swX(e, -e, d) * swS(-0.04, 0.03, z.y + 0.04 * sin(z.x * 75.0)));
}
vec4 swHouse(vec2 z, float e) {
 float wall = max(abs(z.x) - 0.75, z.y - 0.5), roof = max(max(z.y - 1.0, 0.45 - z.y), abs(z.x) + (z.y - 0.45) * 0.45 - 0.86);
 float chim = max(abs(abs(z.x) - 0.6) - 0.07, abs(z.y - 1.0) - 0.16);
 float al = swX(e, -e, min(min(wall, roof), chim)) * step(-0.1, z.y);
 vec3 col = mix(vec3(0.95, 0.91, 0.84), vec3(0.8, 0.78, 0.8), swX(0.2, -0.2, z.x * clamp(swL.x * 4.0, -1.0, 1.0)));
 float pane = swX(e, -e, max(abs(abs(z.x) - 0.38) - 0.085, abs(z.y - 0.26) - 0.1));
 col = mix(col, mix(vec3(0.25, 0.27, 0.33), vec3(1.0, 0.78, 0.36), 0.3 + 0.7 * uMic), pane);
 col = mix(col, vec3(0.5, 0.25, 0.2), swX(e, -e, max(abs(z.x) - 0.1, z.y - 0.36)));
 col = mix(col, vec3(0.38, 0.39, 0.46), swX(e, -e, roof));
 return vec4(col, al);
}
// The sky: thin morning cloud laid over the dome, so it closes into rings near the horizon.
vec3 swSky(vec2 dir, float l, vec2 p, vec2 sun) {
 float g = 1.0 / sinh(max(l, 0.05)), drift = uTravel * 0.00033 + uTime * 0.00007;
 vec3 col = mix(vec3(0.97, 0.89, 0.79), vec3(0.87, 0.89, 0.86), swS(0.0, 0.45, l));
 col = mix(col, vec3(0.66, 0.78, 0.84), swS(0.3, 1.4, l));
 vec2 q = rot(0.6) * dir * g * 1.7 + 60.0 * vec2(cos(drift), sin(drift));
 q += 0.8 * vec2(noise(q * 0.9 + 5.0), noise(q * 0.9 + 11.0));
 float far = swX(10.0, 2.5, g);
 float c = 0.5 * noise(q) + 0.28 * mix(0.5, noise(rot(1.0) * q * 2.1 + 4.0), far) + 0.22 * mix(0.5, noise(rot(2.1) * q * 4.6 + 9.0), far * far);
 float ds = length(sun - p), body = swS(0.45, 0.69, c);
 vec3 cl = mix(vec3(0.985, 0.95, 0.9), vec3(0.8, 0.81, 0.85), 0.7 * swS(0.56, 0.82, c));
 col = mix(col, cl, body * 0.75 * swS(0.02, 0.35, l));
 col = mix(col, vec3(1.0, 0.92, 0.78), (0.3 + 0.35 * uLevel) * exp(-ds * 4.5));
 col = mix(col, vec3(1.0, 0.975, 0.91), max(swX(0.034, 0.031, ds), 0.5 * exp(-ds * ds * 260.0)) * (0.65 + 0.35 * uLevel));
 return col;
}
vec3 render(vec2 p) {
 bool sky = uVar > 0.5;
 float wide = 0.5 * uRes.x / uRes.y, fit = swS(0.2, 0.75, wide);
 // the hand: no edge is ruled
 vec2 pw = p + 0.003 * (vec2(noise(p * 30.0), noise(p * 30.0 + 31.0)) - 0.5);
 vec2 mid = sky ? vec2(0.07 * fit, 0.015) : vec2(-0.17 * fit, -0.045);
 float R = (sky ? 0.29 : 0.275) * mix(1.04, 0.96, uSpace) * mix(0.52, 1.0, fit);
 vec2 sun = mid + (sky ? R * vec2(-0.34, 0.4) : vec2(mix(0.16, 0.62, fit), 0.33));
 vec2 az = normalize(sun - mid);
 vec2 q = pw - mid; float r = max(length(q), 0.0005);
 vec2 er = q / r, et = vec2(-er.y, er.x);
 float l = log(r / R); if (sky) l = -l;
 float roll = fract(uTravel * 0.007), turn = atan(q.y, abs(q.x) < 1e-6 ? 1e-6 : q.x) / TAU;
 float u = fract(turn + roll), a = u * TAU, e = 0.9 / (uRes.y * r);
 vec2 land = vec2(cos(a), sin(a));
 swL = normalize(vec2(dot(az, et), 0.45));
 swSun = mix(vec3(0.94, 0.94, 0.98), vec3(1.06, 1.0, 0.9), 0.3 + 0.7 * uLevel);
 float dh = swGap(u, uLoop), here = exp(-dh * dh * 130.0);
 float dw = swGap(turn - 0.25, 1.0 - uCue), gust = exp(-dw * dw * 60.0) * uCue;
 swWave = exp(-dw * dw * 60.0) * 4.0 * uCue * (1.0 - uCue);
 float grow = sky ? 1.25 : 1.2;
 vec3 col = vec3(0.0), air = vec3(0.94, 0.89, 0.83);
 float face = 0.5 + 0.5 * dot(er, az) * (sky ? -0.6 : min(1.0, r / R));
 // the folds and what stands on them
 int st = -1, last = -1, first = 4, end = -1; float top[4]; int own[3];
 for (int k = 0; k < 4; k++) {
  float f = float(k);
  top[k] = swFold(k, a) + 0.03 * (swLine(u * (41.0 - 6.0 * f), 41.0 - 6.0 * f, 30.0 + f) - 0.5);
  if (l < top[k] - e) st = k;
  bool any = l < top[k] + 0.03 + 0.03 * f;
  if (any) last = k;
  if (k < 3) {
   int n = k == 0 ? 9 : k == 1 ? 5 : 3;
   int i = (k == 0 ? 0 : k == 1 ? 9 : 14) + min(int(fract(u - 0.035 * max(l - top[k], 0.0)) * float(n)), n - 1);
   vec4 o = swO[i];
   float dx = abs(swGap(u, o.x)) * TAU, h = o.z * grow;
   bool in1 = l > o.y - 0.03 && l < o.y + h * 1.5 && dx < h * (o.w == 1.0 ? 0.75 : 1.2);
   own[k] = in1 ? i : -1;
   any = any || in1;
  }
  if (any) { first = min(first, k); end = k; }
 }
 first = max(first, st);
 if (st < 0) {
  col = swSky(er, l, p, sun);
  if (l < 0.6) {
   // far hills in one blue tone, middle hills with firs along them
   float bh = band(1.0 - abs(2.0 * fract(u + 0.1) - 1.0));
   float hf = 0.03 + 0.27 * pow(swLine(u * 5.0, 5.0, 1.0), 1.7) + 0.06 * swLine(u * 17.0, 17.0, 2.0) + 0.014 * swLine(u * 70.0, 70.0, 3.0) + 0.16 * bh * (0.35 + 0.65 * swLine(u * 23.0, 23.0, 7.0));
   vec3 fc = mix(vec3(0.57, 0.64, 0.77), swInk(uKind[0], 0.7) * 0.6 + 0.3, 0.1 + 0.25 * uDrone) * (0.92 + 0.16 * face);
   fc = mix(fc, air, 0.15 + 0.2 * uSpace + 0.5 * swX(0.12, -0.02, l));
   col = mix(col, fc, swX(e, -e, l - hf));
   float ht = swLine(u * 9.0, 9.0, 11.0), hm = -0.05 + 0.24 * pow(ht, 1.4) + 0.04 * swLine(u * 31.0, 31.0, 12.0) + 0.2 * uDrone * swLine(u * 5.0 + 0.5, 5.0, 14.0);
   float copse = swLine(u * 13.0, 13.0, 8.0), fu = u * 260.0, ft = max(0.0, 1.0 - 2.4 * abs(fract(fu) - 0.5)) * (0.4 + 0.6 * hash21(vec2(floor(fu), 5.0)));
   float wood = swS(0.45, 0.6, copse) * swS(-0.07, -0.02, l - hm);
   hm += 0.04 * ft * swS(0.5, 0.62, copse);
   vec3 mc = mix(vec3(0.6, 0.52, 0.61), vec3(0.65, 0.65, 0.5), swS(0.2, 0.8, noise(land * exp(l) * 8.0 + 3.0)));
   mc = mix(mc * (0.82 + 0.3 * face), vec3(0.33, 0.43, 0.45), 0.85 * wood);
   mc = mix(mc, swInk(uKind[0], 0.8) * 0.75, 0.3 * uDrone);
   mc = mix(mc, air, 0.08 + (0.2 + 0.5 * uSpace) * swX(0.05, -0.1, l - 0.06 * swLine(u * 13.0 + 0.5, 13.0, 4.0)));
   col = mix(col, mc, swX(e, -e, l - hm));
  }
 }
 // the moor lies as a plain under the eye
 float under = 1.0 / sinh(max(-l, 0.08));
 vec2 g = land * under;
 float shade = 0.0, pool = 0.0, shore = 0.0, pa = 0.0, pb = 0.0, pd = 0.0, tr = 0.0, str = 0.0; vec4 pc = vec4(0.0);
 if (last >= 0) {
  vec2 sg = rot(-roll * TAU) * az; // the sun's way, turned with the land
  for (int i = 0; i < 17; i++) {
   vec4 o = swB[i];
   vec2 dg = g - o.xy;
   float al = -dot(dg, sg) / (o.z * 1.8), ac = abs(dg.x * sg.y - dg.y * sg.x) / o.z;
   float broad = o.w < 2.5 ? 0.04 + 0.2 * swS(0.4, 0.75, al) : 0.14;
   shade = max(shade, swS(-0.02, 0.02, al) * swX(1.05, 0.5, al) * swX(0.05, -0.05, ac - broad));
  }
  pa = noise(g * 1.6 + 3.0); pb = noise(g * 5.0 + 11.0); pd = noise(g * 2.6 + 27.0); str = noise(land * r * (sky ? 75.0 : 140.0) + 9.0);
  pb = mix(0.5, pb, swX(9.0, 4.0, under)); pd = mix(0.45, pd, swX(12.0, 6.0, under));
  for (int i = 0; i < (sky ? 3 : 4); i++) {
   float at = i == 0 ? 0.2 : i == 1 ? 0.56 : i == 2 ? 0.755 : 0.06, oa = TAU * at, far = i == 0 ? 2.6 : i == 1 ? 1.75 : i == 2 ? 3.2 : 0.42;
   vec2 dg = g - vec2(cos(oa), sin(oa)) * far;
   float full = max(far, 1.1) * (0.17 + 0.07 * uPad + 0.09 * swSeam(at) * piece(vec2(at, 0.5)).a);
   float d = length(rot(oa) * dg * vec2(1.25, 0.8)) - full + (far < 1.0 ? 0.1 : 0.6) * (pa - 0.5) + 0.2 * min(far, 1.0) * (pb - 0.5);
   pool = max(pool, swX(0.02, -0.02, d)); shore = max(shore, swX(0.07, 0.0, d / min(far, 1.0)));
  }
  pc = piece(vec2(u, sat(0.06 - l * 0.7))) * swSeam(u) * (sky ? 1.0 : swS(0.6, 1.7, under));
  if (!sky) { float still = swX(1.6, 0.3, under); pb = mix(pb, 0.5, 0.6 * still); str = mix(str, 0.5, 0.6 * still); }
  tr = swX(0.06, 0.045, abs(under - 1.25 - 0.45 * sin(a + 1.0) - 0.3 * sin(3.0 * a) + 0.12 * (pb - 0.5)));
 }
 for (int k = first; k <= end; k++) {
  float f = float(k);
  if (k <= last) {
   float rh = 0.03 + 0.028 * f, tp = top[k], d1 = max(tp - l, 0.0);
   // the fringe of grass
   float N = floor(TAU / (0.2 * rh)), wind = 0.15 + 0.15 * sin(uTime * 0.7 + a * 5.0) + 1.4 * swWave;
   float up = max(l - tp + 0.4 * rh, 0.0), s = u - wind * up * up / rh / TAU, c1 = s * N, c2 = s * floor(N * 0.4) + 0.3;
   float bl = max((1.0 - 2.0 * abs(fract(c1) - 0.5)) * hash21(vec2(mod(floor(c1), N), f)), (1.0 - 2.0 * abs(fract(c2) - 0.5)) * hash21(vec2(mod(floor(c2), floor(N * 0.4)), f + 9.0)));
   float tuft = swLine(u * 47.0, 47.0, f + 60.0);
   float cv = swS(-e, e, tp + rh * bl * (0.25 + 1.1 * tuft) * (1.0 + 0.3 * uTexture) - l);
   if (cv > 0.0) {
    // the ground in broad strokes: turf, straw, heather, and the piece where it lies
    vec3 gc = mix(vec3(0.56, 0.64, 0.42), vec3(0.91, 0.84, 0.61), swS(0.38, 0.62, pa * 0.55 + pb * 0.3 + (sky ? 0.14 : 0.3) * (str - 0.5)));
    float hea = swS(0.5, 0.56, pd * 0.6 + 0.3 * pb + 0.05 + (sky ? 0.12 : 0.16) * (str - 0.5) + 0.08 * uTexture + 0.1 * pc.a);
    vec3 hc = mix(vec3(0.62, 0.42, 0.57), swInk(uKind[2], 1.0) * 0.8 + 0.1, 0.12 + 0.4 * uTexture);
    vec3 sown = swInk(pc.rgb / max(pc.a, 0.04), 1.0) * 0.75 + 0.28;
    hc = mix(hc, sown, (sky ? 0.75 : 0.55) * sat(pc.a * 1.5));
    gc = mix(gc, hc, hea * 0.8) * (0.86 + 0.22 * str);
    gc = mix(gc, vec3(0.93, 0.86, 0.74), tr * 0.9);
    // tufts and small flowers in rows out of step
    for (int i = 0; i < 2; i++) {
     float Nt = floor(TAU / (1.1 * rh)), y = (tp - l) / rh + float(i) * 0.5, row = floor(y), x = s * Nt + 0.37 * row + 0.5 * float(i), ci = floor(x);
     vec2 hh = hash22(vec2(mod(ci, Nt), row + 50.0 * f + 25.0 * float(i)));
     vec2 z = vec2(fract(x) - 0.5 - 0.3 * (hh.x - 0.5), 1.0 - (y - row)); // z.y: 0 at the foot, 1 at the top
     float ez = e / rh, seen = step(0.0, row) * swX(0.24, 0.1, ez);
     float keep = step(0.45 - 0.25 * tuft, hh.y) * seen;
     float fan = z.x / (0.2 + 0.36 * z.y), env = (1.0 - 1.5 * fan * fan) * (0.5 + 0.5 * hh.x);
     float blades = swS(-0.3, 0.3, sin(fan * 30.0 + hh.x * 9.0) + 0.9 - z.y / max(env, 0.1));
     float tu = keep * swX(ez, -ez, z.y - env) * swX(0.5, 0.4, abs(fan)) * blades;
     vec3 tc = mix(gc * vec3(0.74, 0.76, 0.78), mix(vec3(0.98, 0.9, 0.62), hc * 1.25 + 0.08, hea), swS(0.1, 0.8, z.y));
     gc = mix(gc, tc, tu * (sky ? 0.6 : 0.85) * (1.0 - tr));
     float petal = length(z - vec2(0.12, 0.45)) - (0.05 + 0.15 * uKeys);
     gc = mix(gc, i == 0 ? vec3(0.99, 0.97, 0.92) : vec3(0.98, 0.84, 0.35), step(hh.y, 0.2) * step(0.0, row) * swX(0.6, 0.2, ez) * swX(ez, -ez, petal));
    }
    // the keys open larger flowers on the ball
    if (!sky && uKeys > 0.01 && under < 4.0) {
     vec2 ci = floor(g * 3.4), hh = hash22(ci + 70.0), z = fract(g * 3.4) - 0.3 - 0.4 * hh;
     float ez = 6.0 * e / max(-l, 0.3), d = length(z) - 0.2 * uKeys * (1.0 + 0.13 * cos(5.0 * atan(z.y, z.x + 1e-5)));
     float open = step(hh.y, 0.55) * swX(ez, -ez, d) * swX(4.0, 2.0, under) * sat(uKeys * 6.0);
     gc = mix(gc, mix(vec3(1.0, 0.8, 0.3), vec3(1.0, 0.98, 0.94), swS(0.03, 0.06, length(z))), open * (1.0 - tr));
    }
    gc *= mix(vec3(1.0), vec3(0.74, 0.74, 0.82), swS(0.02, 0.45, d1) * 0.8);
    float lum = mix(sky ? 0.82 : 0.68, 1.16, swS(0.15, 0.75, face));
    vec3 light = mix(sky ? vec3(0.82, 0.84, 0.97) : vec3(0.86, 0.95, 1.22), vec3(1.0), swS(0.78, 1.0, lum)) * lum * swSun;
    light *= mix(vec3(1.0), vec3(0.52, 0.55, 0.74), shade * 0.8);
    light *= 1.0 + vec3(0.3, 0.25, 0.14) * here * (sky ? 1.0 : swS(0.1, 1.3, under)) * (0.4 + 0.6 * uEnergy + 0.5 * uLevel);
    light += vec3(0.4, 0.37, 0.3) * gust * (0.4 + 0.8 * str);
    gc *= light;
    // pools hold the sky
    float near = k < 3 || !sky ? 1.0 : 0.0;
    vec3 wc = mix(vec3(0.56, 0.7, 0.81), vec3(0.96, 0.94, 0.89), swS(0.25, 0.75, noise(vec2(abs(swGap(u, 0.4)) * 31.0, sky ? l * 42.0 + 3.0 * sin(uTime * 0.04) : under * 6.0 + sin(uTime * 0.06))) + 0.5 * (pa - 0.5)));
    wc = mix(wc, swInk(uKind[1], 0.9) * 0.5 + 0.45, 0.12 + 0.45 * uPad);
    gc = mix(gc, gc * vec3(0.45, 0.42, 0.42), 0.8 * shore * near);
    gc = mix(gc, wc, pool * near);
    gc = mix(gc, air, 0.4 * exp(-f * 1.3) * swS(0.02, 0.16, d1) * (0.5 + uSpace));
    col = mix(col, gc, cv);
   }
  }
  // what stands here
  int i = k < 3 ? own[min(k, 2)] : -1;
  if (i >= 0) {
   vec4 o = swO[max(i, 0)];
   float h = o.z * grow;
   if (o.w < 2.5) h *= 1.0 + 0.35 * swLoud(o.x) + 0.08 * uPhrase;
   vec2 z = vec2(swGap(u, o.x) * TAU, l - o.y) / h;
   vec4 c = vec4(0.0);
   if (o.w < 2.5) c = swTree(z, o.w, float(i) * 0.37 + 0.2, e / h, 0.14 + 0.012 * sin(uTime * 0.8 + float(i)) + 0.3 * swWave);
   else c = o.w < 3.5 ? swStone(z, float(i), e / h) : swHouse(z, e / h);
   c.rgb = mix(c.rgb, air, k == 0 ? 0.1 : 0.0);
   col = mix(col, c.rgb, c.a);
  }
 }
 // a hit: birds go up from the ground where the loop is, in a breath of light
 for (int i = uHits > 0.01 ? 0 : 5; i < 5; i++) {
  float fi = float(i), up = 1.0 - uHits;
  vec2 z = vec2(dh * TAU, l) - vec2((fi - 2.0) * (0.13 + 0.07 * up), 0.5 * up + 0.16 * hash11(fi + 3.0));
  if (i == 0) col = mix(col, mix(vec3(1.0, 0.93, 0.76), swInk(uKind[4], 1.0), 0.45), 0.75 * uHits * exp(-9.0 * (dh * dh * 30.0 + (l + 0.05) * (l + 0.05))));
  z.x = abs(z.x);
  float y = z.y - z.x * 0.7 * sin(uTime * 8.0 + fi * 2.0) + z.x * z.x * 6.0;
  col = mix(col, vec3(0.2, 0.17, 0.24), swX(0.006 + e, 0.006 - e, abs(y) - 0.003 * (1.0 - z.x * 14.0)) * swX(0.05, 0.042, z.x) * swS(0.0, 0.2, uHits));
 }
 // a voice: lamplight round the house
 vec2 hz = vec2(swGap(u, 0.5) * TAU, l + 0.03) / 0.24;
 col = mix(col, vec3(1.0, 0.76, 0.38), 0.7 * uMic * exp(-dot(hz, hz)) * sat(dot(col, vec3(0.5))));
 // the wind of a cue in the air over the land
 col = mix(col, vec3(1.0, 0.96, 0.88), 0.35 * gust * exp(-6.0 * l * l) * swS(-0.2, 0.1, l));
 // the tone dial: veiled to clear
 return mix(col, swS(0.0, 1.0, col), 0.5 * (uTone - 0.5)) * mix(vec3(0.96, 0.98, 1.03), vec3(1.02, 1.0, 0.97), uTone);
}
