// name: Soft city
// a: Avenue
// b: Rain on glass
// what: A wet avenue at dusk seen from the front of a tram with the lens wide open: lamps, windows, cars and signals are six-sided discs of light that overlap and slide apart, doubled in the road, with somebody under an umbrella; or the same city through a rainy side window, where each drop holds it small, sharp and upside down.
// follows: Each disc has a kind of sound or a band, and lights up with it; the piece hangs along the houses, what comes next further off (across the window in the other). Low opens the lens, so discs grow; high twinkles. A hit is one tail light passing; a cue lights every rim while the focus is pulled and let back; keys and voice light the green ones.
const float scF = 0.9, scE = 2.1; // the lens, and how high the eye is over the road, in metres
const vec3 scAmber = vec3(1.0, 0.37, 0.075), scRed = vec3(1.0, 0.035, 0.02), scPale = vec3(1.0, 0.74, 0.46);
vec2 scVp; // where the avenue runs to
float scPx, scOpen, scNear; // a pixel, how wide the lens is open, how near the focus is pulled
float scLit; // how strongly the lights answer
vec3 scAir, scWet; // the lights seen straight, and in the wet road
vec4 scLv; // how loud the first four kinds are
vec3 scCol[5]; // each kind's light
vec2 scQ, scM; // the place looked at, and the same shaken by the water

float scFall(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); }
vec3 scRich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }
// The opening of the lens: six blades, a little rounded. 1 at its edge.
float scBlades(vec2 v) {
 vec2 a = abs(mat2(0.966, 0.259, -0.259, 0.966) * v);
 return mix(length(v), max(a.x * 0.866 + a.y * 0.5, a.y) * 1.06, 0.6);
}
// One disc of light. v from its middle, at is where it lies in the frame, rnd its own number.
float scDisc(vec2 v, vec2 at, float r, float rnd, float soft) {
 vec2 u = v / r;
 float d = scBlades(u);
 d = max(d, length(u + at * 0.5) / 1.16); // near the frame's edge the barrel of the lens cuts the disc to an eye
 float e = scPx / r + soft;
 float rim = smoothstep(0.78, 0.93, d) * (smoothstep(0.25, 0.9, rnd) * mix(0.5, 1.3, uTone) + 1.4 * uCue);
 return scFall(1.0 + e, 1.0 - e, d) * (0.6 + 0.22 * d * d + rim * 0.75 + 0.14 * abs(fract(d * 4.1 + rnd) - 0.5));
}
// The piece's own colour at a place, as a lit window shows it: deepened, and warmer.
vec3 scTint(vec4 m) { vec3 c = scRich(m.rgb * m.rgb * m.rgb, 1.5); return mix(c, scAmber * 0.6 * m.a * m.a, 0.4); }
float scBend(float z) { return 0.14 * z / (z + 70.0); }
// Where a lamp at w (across, above the road, ahead) is seen: its disc, and its foot on the road.
vec2 scC, scG, scV2; float scR, scX, scY, scGap;
bool scUp, scDown;
bool scSee(vec3 w, float size, float gap) {
 float iz = 1.0 / w.z;
 scR = (0.6 * iz + 0.0155 + 0.02 * scNear) * scOpen * size;
 scG = scVp + vec2(w.x * scF * iz + scBend(w.z), -scE * scF * iz);
 float lie = w.y * scF * iz, deep = scG.y - scM.y; // the lamp over its foot, and how far below the foot the water is
 scC = scG + vec2(0.0, lie);
 scV2 = scQ - scC;
 scGap = gap * scF * iz; scV2.x = scGap > 0.0 ? abs(scV2.x) - scGap : scV2.x; 
 scUp = dot(scV2, scV2) < scR * scR * 1.35;
 scX = scM.x - scG.x; scX = (scGap > 0.0 ? abs(scX) - scGap : scX) / (scR * 0.75);
 scY = (deep - lie) / (0.08 + 0.6 * lie + scR * 1.5);
 scDown = deep > 0.0 && abs(scX) < 2.1 && abs(scY) < 2.0;
 return scUp || scDown;
}
void scAdd(vec3 col, float rnd, float gloss) {
 col *= min(sqrt(0.025 / scR), 1.0);
 if (scUp) scAir += col * scDisc(scV2, scC, scR, rnd, 0.035);
 if (scDown) {
  float deep = scG.y - scM.y, lie = scC.y - scG.y, y2 = (deep - lie) / (scR * 1.6), x2 = scX * scX;
  float d2 = x2 * 0.56 + y2 * y2;
  float s = exp(-x2 - scY * scY) * (1.0 - 0.25 * scY * scY) * smoothstep(0.0, 0.04 + scR, deep);
  if (d2 < 1.44) s += 0.7 * gloss * scFall(1.44, 0.6, d2) * smoothstep(0.0, scR, deep);
  scWet += col * s * 0.42 * scFall(4.4, 3.2, x2);
 }
}
// How far ahead the lamps of a row x across can be whose light falls here.
ivec2 scRange(float x, float size, float from, float gap, float f, int n) {
 float s = sign(x), a = abs(x) * scF, g = (scQ.x - scVp.x) * s, k = 0.97 * scOpen * size;
 float z = a / max(g, 0.02);
 g -= s * scBend(a / max(g - s * scBend(z), 0.02));
 float tol = 0.035 + 1.6 * (0.0155 + 0.02 * scNear) * scOpen * size;
 if (g < -tol - 0.02) return ivec2(0);
 float lo = (a - k) / max(g + tol, 0.001), hi = g > tol + 0.001 ? (a + k) / (g - tol) : 999.0;
 return ivec2(max(int(floor((lo - from) / gap + f)) - 1, 0), min(int(ceil((hi - from) / gap + f)), n));
}
vec3 scSky(vec2 q) {
 vec3 sky = mix(vec3(0.22, 0.095, 0.07), vec3(0.05, 0.06, 0.125), smoothstep(0.0, 0.19, q.y));
 sky = mix(sky, vec3(0.010, 0.020, 0.06), smoothstep(0.12, 0.55, q.y));
 return sky * (0.5 + 0.6 * exp(-q.x * q.x * 3.0));
}
// The evening behind it all: sky, and two dark walls of houses with lit rooms and the glow of shops.
vec3 scBack(vec2 q, float blur) {
 float side = step(0.0, q.x), ax = abs(q.x) + 0.004, wx = mix(11.5, 13.0, side);
 float z = scF * wx / ax, run = z + uTravel * 1.9, hgt = q.y * z / scF + scE;
 float calm = smoothstep(0.03, 0.12, ax), tall = 10.0 + 9.0 * mix(0.5, noise(vec2(run / 13.0, side * 7.3 + 2.0)), calm);
 float far = scFall(150.0, 30.0, z), b = blur + 0.05 * ax;
 float wall = scFall(b, -b, q.y - (tall * ax / wx + 0.012));
 float shop = exp(-max(hgt - 2.0, 0.0) * 0.42) * (0.15 + 0.85 * smoothstep(0.25, 0.75, noise(vec2(run / 5.0, 4.0 + side * 9.0))));
 float panes = noise(vec2(run / 2.6, hgt / 2.0 + side * 31.0));
 vec3 face = mix(vec3(0.06, 0.04, 0.05), vec3(0.008, 0.010, 0.020), far);
 face += vec3(0.135, 0.052, 0.018) * (shop * 0.8 + 0.22 * smoothstep(0.35, 0.95, panes)) * calm * (0.35 + 0.65 * far) * (0.65 + 0.6 * uLevel);
 return mix(scSky(q), face, wall);
}
// Somebody walking ahead under an umbrella. q in metres from the feet, b how soft.
float scWalker(vec2 q, float b) {
 q.x -= 0.1 * sin(uTime * 0.31);
 vec2 u = q - vec2(0.08, 1.75);
 float dome = max(length(u * vec2(0.82, 1.15)) - 0.52, -u.y - 0.02 + 0.10 * u.x);
 float body = length(q - vec2(0.0, clamp(q.y, 0.15, 1.55))) - mix(0.15, 0.27, smoothstep(0.1, 1.2, q.y)) * scFall(1.75, 1.35, q.y);
 return scFall(b, -b, min(dome, body));
}
vec3 scAvenue(vec2 p) {
 scVp = vec2(-0.13, -0.015);
 vec2 q = p - scVp - vec2(0.085, 0.0);
 // where the houses stand, the ground begins lower
 float wx = q.x > 0.0 ? 13.0 : 11.5;
 float foot = scE * abs(q.x) / wx, down = max(-q.y, 0.0), hor = smoothstep(-0.012, 0.014 + 0.02 * abs(q.x), -q.y - foot);
 float dist = scF * scE / max(down, 0.006); // metres ahead, on the road
 float along = dist + uTravel * 1.9, across = q.x * dist / scF;
 float close = smoothstep(0.02, 0.2, down);
 // the water: broad puddles, and small waves that shake what it mirrors
 float pud = smoothstep(0.34, 0.68, noise(vec2(across * 0.22 + 3.0, along * 0.15)) + 0.12 * (uSpace - 0.5));
 float ly = log(down + 0.07);
 float shake = noise(vec2(q.x * 9.0 + 3.0, ly * 13.0 + uTime * 0.2)) - 0.5, fine = noise(vec2(q.x * 30.0, ly * 36.0 - uTime * 0.17)) - 0.5;
 // the grain of the road: each wet stone a small disc
 vec2 gp = mat2(0.8776, -0.4794, 0.4794, 0.8776) * vec2(q.x / (down + 0.07), ly) * 25.0;
 vec2 gh = hash22(mod(floor(gp), 512.0) + 3.0);
 float gr = 0.14 + 0.24 * gh.x * gh.x, ge = 0.1 + scPx * 25.0 / (down + 0.07);
 vec2 gv = fract(gp) - 0.5 - (0.8 - 2.0 * gr) * (fract(gh * 31.7) - 0.5);
 float stone = scFall(gr + ge, gr - ge, length(gv)) * step(0.4, gh.y) * (gh.y + 0.7 * uHigh * sin(uTime * (0.8 + gh.y) + gh.x * 60.0));
 scQ = p;
 scM = p + vec2(shake * 0.026 + fine * 0.012, shake * 0.03 + fine * 0.02) * mix(1.0, 0.5, pud) * close;
 if (hor <= 0.0) scM.y = 9.0;
 scAir = scWet = vec3(0.0);
 float t = uTravel * 1.9;
 // street lamps, left and right
 for (int s = 0; s < 2; s++) {
  float sd = float(s), x = s == 0 ? -7.2 : 8.4, sp = 13.0, b = t / sp + 0.5 * sd, f = fract(b);
  ivec2 rg = scRange(x, 1.12, 7.0, sp, f, 9);
  for (int i = rg.x; i < rg.y; i++) {
   float z = 7.0 + (float(i) + 1.0 - f) * sp;
   if (scSee(vec3(x, 7.2, z), 1.12, 0.0)) {
   float h = hash21(vec2(mod(floor(b) + float(i), 512.0), 3.0 + sd));
   vec3 c = scAmber * (0.3 * smoothstep(20.0, 60.0, z) + 0.1 + 0.4 * uLevel) * (h > 0.35 ? 1.0 - 0.8 * uDrone : 1.0);
   c += h > 0.35 ? mix(scCol[0], scPale, 0.1) * uDrone * scLit * (0.6 + 0.5 * h) : vec3(0.0);
   c /= 1.0 + z / 90.0;
   scAdd(c * smoothstep(7.0, 13.0, z) * scFall(124.0, 90.0, z), h, pud);
   }
  }
 }
 // windows and shop lights: the piece hung along the houses, what comes next further off
 for (int s = 0; s < 2; s++) {
  float sd = float(s), x = s == 0 ? -10.0 : 11.0, sp = 3.8, b = t / sp, f = fract(b);
  ivec2 rg = scRange(x, 1.3, 7.5, sp, f, 17);
  for (int i = rg.x; i < rg.y; i++) {
   float z = 7.5 + (float(i) + 1.0 - f) * sp;
   vec2 h = hash22(vec2(mod(floor(b) + float(i), 512.0), 11.0 + sd * 5.0));
   if (scSee(vec3(x, 0.9 + 9.5 * h.x * h.x, z), 0.7 + 0.6 * h.y, 0.0)) {
   float pu = fract(uLoop + (z - 8.0) / 150.0);
   vec4 m = piece(vec2(pu, 1.0 - h.x)) * sat(20.0 * min(pu, 1.0 - pu));
   vec3 own = h.y < 0.4 ? scAmber : h.y < 0.55 ? scPale : h.y < 0.8 ? scCol[1] : scCol[2];
   float kind = h.y < 0.55 ? 0.6 * band(h.x) : h.y < 0.8 ? uPad : uTexture;
   float tw = fract(uTime * (0.2 + 0.16 * h.x) + h.y * 9.0) - 0.5; tw = 1.0 + 0.8 * uHigh * (1.0 - 8.0 * tw * tw);
   vec3 c = own * (0.05 + 0.2 * smoothstep(20.0, 55.0, z) * step(0.35, h.x) + 0.55 * kind * scLit * (0.3 + 0.7 * h.x)) * tw;
   c += (scTint(m) * 1.5 + own * m.a * 0.25) * scLit;
   scAdd(c * smoothstep(7.5, 13.0, z) * scFall(71.0, 52.0, z), h.x, pud * 0.8);
   }
  }
 }
 // cars: white pairs coming, red pairs going away ahead; the signals over the crossings; and on a hit one tail light passing
 float aside = scM.x - scVp.x;
 int i0 = p.y > scVp.y + 0.05 ? 6 : aside > 0.16 ? 3 : 0, i1 = aside < -0.06 ? 3 : aside > 0.6 ? i0 : 8;
 for (int i = i0; i < i1; i++) {
  float fi = float(i), z = i < 3 ? 103.0 - 96.0 * fract(t / 60.0 + fi / 3.0 + 0.1) : i < 6 ? 14.0 + 19.0 * (fi - 3.0) + 4.0 * sin(uTime * 0.05 + fi * 2.3) : 12.0 + 45.0 * (fi - 5.0 - fract(t / 45.0));
  if (scSee(i < 3 ? vec3(-3.2, 0.7, z) : i < 6 ? vec3(2.9 + 0.35 * sin(fi * 4.0), 0.75, z) : vec3(4.6, 5.4, z), 0.9, i < 6 ? 0.68 : 0.0)) {
   vec3 c = i < 3 ? scPale * (0.25 + 0.5 * uLevel) * smoothstep(7.0, 14.0, z) * scFall(103.0, 80.0, z) : scRed * (0.5 + 0.5 * uLevel);
   if (i > 5) c = scCol[3] * (0.08 + scLit * 0.9 * scLv.w) * smoothstep(12.0, 20.0, z) * scFall(102.0, 80.0, z);
   scAdd(c, i < 3 ? 0.4 : 0.85, pud);
   vec2 other = vec2(scV2.x + 2.0 * scGap, scV2.y);
   if (i < 6) scAir += c * min(sqrt(0.025 / scR), 1.0) * scDisc(other, scC, scR, 0.6, 0.035);
  }
 }
 int hit = uHits > 0.002 ? 1 : 0;
 for (int i = 0; i < hit; i++) {
  float g = 1.0 - uHits;
  if (scSee(vec3(2.9, 0.8, 7.5 + 34.0 * g * g), 1.1, 0.0)) scAdd(mix(scRed, scCol[4], 0.3) * 3.2 * uHits, 0.5, 1.0);
 }
 float fres = mix(1.0, (0.22 + 0.6 * exp(-down * 7.0)) * mix(0.4, 1.0, pud), hor);
 vec3 col = scBack(q.y > -foot ? q : vec2(q.x + (shake + fine * 0.4) * 0.1 * close, -2.0 * foot - q.y + shake * 0.04 * close), 0.02 + 0.04 * hor) * fres;
 // the kerbs, and the wet rails
 float kerb = (abs(across - 0.6) - 8.0) / (0.5 + 0.01 * dist), gauge = (abs(across) - 0.75) / (0.035 + 0.003 * dist);
 col *= 1.0 - 0.45 * exp(-kerb * kerb) * scFall(70.0, 20.0, dist) * hor;
 col += (vec3(0.006, 0.007, 0.011) + scWet * mix(0.6 + 0.6 * stone * close, 1.05, pud)) * hor;
 col = mix(col, vec3(0.05, 0.055, 0.08) * (0.6 + 0.4 * sin(along * 0.4)) + scWet * 0.9, 0.6 * exp(-gauge * gauge) * scFall(60.0, 12.0, dist) * hor);
 // and whoever walks there, upright and in the water
 vec2 wq = (q - vec2(scF * -4.9, -scF * scE) / 9.0) * 10.0;
 bool wetHalf = wq.y < 0.0;
 if (wetHalf) wq = vec2(wq.x + 10.0 * (scM.x - p.x), -wq.y - 10.0 * (scM.y - p.y));
 float walk = scWalker(wq, wetHalf ? 0.2 : 0.09);
 if (wetHalf) col *= 1.0 - 0.8 * walk * hor;
 // damp air where the lights are thickest
 vec2 hz = (q - vec2(0.0, 0.01)) * vec2(1.0, 1.5);
 col += vec3(0.30, 0.13, 0.055) * exp(-dot(hz, hz) * 26.0) * (0.25 + 0.5 * uLevel + 0.5 * uMic + 0.5 * uCue) * mix(0.6, 1.4, uSpace);
 col = mix(col + scAir, vec3(0.006, 0.007, 0.012) + 0.06 * scAir, wetHalf ? 0.0 : walk * 0.95);
 return col;
}

// The side window: lights in three depths that slide past one another. Size 1 is soft, small is sharp.
float scGlare; // how hot the lamps are inside a drop
vec3 scSide(vec2 q, float size, vec2 frame) {
 vec3 sum = vec3(0.0);
 for (int L = 0; L < 3; L++) {
  float l = float(L), w = L == 0 ? 0.12 : 0.19 * l + 0.02 * l * l - 0.03, slide = uTravel * (0.007 + 0.011 * l * l + 0.006 * l);
  float gx = (q.x + slide) / w, r0 = 0.027 + 0.026 * l + 0.01 * l * l;
  float reach = 1.55 * r0 * size * scOpen;
  if (q.y < 0.37 - 0.02 * l + reach && (q.y > -0.2 - reach || (L > 0 && size > 0.5)))
  for (int i = 0; i < (0.1 + min(fract(gx), 1.0 - fract(gx)) < 1.2 * reach / w ? 2 : 1); i++) for (int j = 0; j < (L > 0 ? 1 : 2); j++) {
   float id = floor(gx) + float(i) * (fract(gx) < 0.5 ? -1.0 : 1.0);
   vec2 h = hash22(vec2(mod(id, 512.0) + 3.0, 7.0 + l * 13.0 + float(j) * 5.0));
   vec2 c = vec2((id + 0.1 + 0.8 * h.x) * w - slide, 0.0);
   c.y = L == 2 ? mix(-0.2, 0.32, h.y * h.y) : L == 1 ? -0.1 + 0.38 * h.y : float(j) * 0.1 - 0.09 + 0.36 * h.y;
   float r = r0 * (0.7 + 0.6 * h.x) * size * scOpen * (1.0 - 0.55 * scNear);
   vec2 v = q - c;
   bool in_ = dot(v, v) < r * r * 1.35, wet = L > 0 && j == 0 && q.y < -0.17 && abs(v.x) < r * 1.4;
   for (int n = in_ || wet ? 1 : 0; n > 0; n--) {
   float u = c.x / 1.78 + 0.5, k = fract(h.x * 5.0 + h.y * 3.0) * 8.0, rnd = fract(h.y * 7.31);
   if (L == 2) k = k < 2.6 ? 0.5 : k < 5.4 ? 1.5 : k; // the great ones
   vec4 m = piece(vec2(u, sat(0.5 - c.y * 1.6)));
   vec3 own = k < 1.0 ? scCol[0] : k < 2.0 ? scCol[1] : k < 3.0 ? scCol[2] : k < 4.0 ? scCol[3] : k < 6.4 ? scAmber : (L == 2 ? scRed : scPale);
   float kind = k < 1.0 ? 1.2 * scLv.x : k < 2.0 ? 1.4 * scLv.y : k < 3.0 ? scLv.z : k < 4.0 ? scLv.w : 0.8 * band(rnd);
   float quiet = k < 4.0 ? 0.03 : 0.2 - 0.05 * l;
   float tw = fract(uTime * (0.2 + 0.16 * h.x) + h.y * 9.0) - 0.5; tw = 1.0 + 0.8 * uHigh * (1.0 - 8.0 * tw * tw);
   vec3 c3 = (own * (quiet + 0.5 * kind * scLit) * tw + (scTint(m) * (L == 2 ? 0.5 : 1.1) + own * m.a * 0.3) * scLit);
   c3 *= L == 2 ? 0.28 + 0.26 * h.x : 1.0 - 0.2 * l;
   if (in_) sum += c3 * scDisc(v, frame, r, max(rnd, 0.35 * l), size > 0.5 ? 0.04 + 0.03 * l : 0.3) * mix(1.0, scGlare, step(size, 0.5));
   if (wet) sum += c3 * 0.3 * exp(-v.x * v.x / (r * r) * 2.0 + (q.y + 0.17) * 9.0) * scFall(1.4, 1.1, abs(v.x) / r) * scFall(-0.17, -0.27, q.y);
   }
  }
 }
 // a hit: one tail light passing
 float r = 0.085 * size * scOpen;
 vec2 v = q - vec2(1.25 * uHits - 0.63, -0.15);
 for (int n = uHits > 0.002 ? 1 : 0; n > 0; n--) sum += mix(scRed, scCol[4], 0.35) * uHits * 2.0 * (scDisc(v, frame, r, 0.95, 0.05) + 0.1 * exp(-dot(v, v) * 60.0));
 return sum;
}
// The street as a drop shows it: sky, two rows of houses with lit windows, the road.
vec3 scSharp(vec2 q, float px) {
 vec3 col = scSky(vec2(q.x * 0.4, q.y + 0.02)) * 1.9;
 for (int L = 0; L < 2 && q.y < 0.27; L++) {
  float l = float(L), w = 0.075 + 0.075 * l, x = q.x + uTravel * (0.007 + 0.02 * l);
  float h = hash21(vec2(mod(floor(x / w), 512.0), 3.0 + l)) , top = -0.08 + (0.08 + 0.15 * h) * (1.0 + 0.4 * l) * step(0.3 * l, h);
  float m = scFall(px, -px, q.y - top);
  vec2 cell = vec2(w / 5.0, 0.024 + 0.008 * l), g = vec2(x, q.y) / cell, f = abs(fract(g) - 0.5);
  float on = step(0.72, hash21(mod(floor(g), 512.0) + l * 37.0)) * scFall(0.36, 0.28, f.x) * scFall(0.34, 0.24, f.y);
  on = mix(on, 0.15, smoothstep(0.25, 0.6, px / cell.x));
  vec3 face = mix(vec3(0.035, 0.028, 0.045), vec3(0.008, 0.009, 0.016), l);
  face += on * mix(scAmber, scPale, h) * (0.35 + 0.8 * uLevel * scLit) * (0.5 + 0.5 * l);
  col = mix(col, face, m);
 }
 float road = scFall(px, -px, q.y + 0.19);
 col = mix(col, vec3(0.016, 0.014, 0.022) + scSky(vec2(q.x * 0.4, -q.y - 0.1)) * 0.25, road);
 return col;
}
const mat2 scTurn[4] = mat2[4](mat2(0.8776, -0.4794, 0.4794, 0.8776), mat2(-0.0292, -0.9996, 0.9996, -0.0292), mat2(-0.9041, -0.4274, 0.4274, -0.9041), mat2(-0.7910, 0.6119, -0.6119, -0.7910));
// One layer of drops on the pane. Gives the place in the drop (1 at its edge) and its size.
vec2 scV; float scDr;
float scDrop(vec2 p, float cell, float seed, float some, float size, mat2 turn) {
 vec2 g = turn * p / cell, id = floor(g);
 vec2 h = hash22(id + seed), c = ((id + 0.5 + (h - 0.5) * 0.5) * cell) * turn;
 float there = fract(h.y * 11.7), far = dot(p - c, p - c);
 if (there > some * 1.25 || far > 3.0 * cell * cell * size * size || there > some * (0.85 + 0.4 * sin(c.x * 8.0 + 5.0 * c.y))) return 9.0;
 float age = fract(uTime / (70.0 + 60.0 * h.x) + h.y * 7.0);
 float grow = smoothstep(0.0, 0.25, age) * scFall(1.0, 0.96, age);
 float rnd = fract(h.x * 17.3 + h.y * 5.1);
 scDr = cell * size * (0.35 + 0.65 * rnd * rnd) * grow;
 if (scDr < scPx || far > 3.0 * scDr * scDr) return 9.0;
 scV = (p - c) / scDr;
 scV += 0.13 * vec2(sin(scV.y * 2.6 + h.x * 20.0), sin(scV.x * 2.3 + h.y * 31.0)) * smoothstep(0.02, 0.06, cell * size);
 scV.x *= 1.0 + 0.16 * scV.y;
 scV.y *= 0.92;
 return length(scV);
}
vec3 scPane(vec2 p) {
 // the drops: great ones first, then the smaller between them
 float d = 9.0; vec2 V = vec2(0.0); float R = 0.1, shade = 0.0;
 for (int k = 0; k < 4; k++) {
  float fk = float(k);
  float cell = k == 0 ? 0.36 : k == 1 ? 0.135 : k == 2 ? 0.058 : 0.026;
  float some = k == 0 ? 0.8 : k == 1 ? 0.55 : 0.46;
  float size = 0.30 * (k > 1 ? 0.75 + 0.4 * uTexture : 1.0);
  float e = scDrop(p, cell, 5.0 + 9.0 * fk, some, size, scTurn[k]);
  if (e < d && e < 1.5) {
   shade = max(shade, scFall(1.5, 1.0, e));
   if (e < 1.1) { d = e; V = scV; R = scDr; break; }
  }
 }
 // a drop shows the whole street, small, sharp and upside down; between the drops all is soft
 bool lens = d < 1.0;
 float edge = scPx / R + 0.3 * scNear, d2 = min(d * d, 1.0), big = smoothstep(0.004, 0.03, R);
 vec2 q = lens ? vec2(p.x * 0.8, 0.07 + 0.1 * p.y) - V * vec2(0.42, 0.36) * (0.62 + 0.5 * d2) : p;
 scGlare = lens ? mix(0.9, 2.6, big) : 1.0;
 vec3 col = scSide(q, lens ? 0.42 : 1.0, lens ? vec2(0.0) : p);
 if (lens) {
  col += scSharp(q, scPx / R * 0.4);
  col *= 1.13 * mix(1.0, scFall(1.0, 0.62, d), mix(0.55, 1.0, big));
  col += vec3(0.16, 0.2, 0.3) * smoothstep(0.6, 0.9, d) * scFall(1.0, 0.93 - 0.3 * scNear, d) * scFall(0.1, -0.9, V.y) * (0.7 + 2.5 * uCue);
  vec2 s = V - vec2(-0.32, 0.5);
  col += vec3(0.9, 0.75, 0.55) * exp(-dot(s, s) * 90.0) * 0.45;
 } else {
  float x = p.x + uTravel * 0.02, roof = 0.08 + 0.05 * sin(x * 3.1 + 1.0) + 0.06 * sin(x * 7.3 + 2.0 * sin(x * 1.7));
  float gl = (p.y + 0.1) * 6.0;
  vec3 back = mix(scSky(vec2(p.x * 0.7, p.y + 0.12)), vec3(0.010, 0.010, 0.02) + vec3(0.1, 0.045, 0.018) * mix(0.5, 1.5, uSpace) * exp(-gl * gl), scFall(0.12, -0.12, p.y - roof));
  col += mix(back, vec3(0.012, 0.011, 0.018), scFall(-0.15, -0.28, p.y) * 0.8);
  col *= (1.0 - 0.35 * shade) * mix(mix(0.6, 0.3, big), 1.0, smoothstep(1.0, 1.02 + 1.2 * edge, d));
 }
 return col;
}
vec3 render(vec2 p) {
 scPx = 1.0 / uRes.y;
 scNear = 4.0 * uCue * (1.0 - uCue);
 scOpen = 1.0 + 0.3 * uLow;
 scLit = 0.35 + 1.3 * uEnergy;
 for (int k = 0; k < 5; k++) {
  vec3 c = scRich(uKind[k] * uKind[k] * sqrt(max(uKind[k], 0.0)), 1.4);
  scCol[k] = c / max(max(c.r, max(c.g, c.b)), 0.05);
 }
 scCol[3] = scCol[3] * vec3(0.5, 0.82, 0.85) + vec3(0.0, 0.0, 0.22) * scCol[3].g; // glass over the green
 scLv = vec4(uDrone, uPad, uTexture, max(uPhrase, max(uKeys, uMic)));
 vec3 col = vec3(0.0);
 if (uVar > 0.5) col = scPane(p);
 if (uVar <= 0.5) col = scAvenue(p);
 col *= 1.0 - 0.35 * dot(p, p);
 col = screenOf(col);
 col = max(mix(vec3(dot(col, vec3(0.3, 0.5, 0.2))), col, 1.25), 0.0);
 return mix(col, col * col * (3.0 - 2.0 * col), 0.55);
}
