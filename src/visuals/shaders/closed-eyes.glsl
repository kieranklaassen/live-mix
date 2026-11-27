// name: Closed eyes
// a: Toward the sun
// b: Pressed
// what: The warm red of shut lids turned to the sun, darker under the upper lid, with the eye's own branching vessels coming and going and a few clear threads sinking through; or the eye pressed in the dark, where soft beads, checkers, spirals and fans glow on plum, finest at the middle, and turn inside out.
// follows: Fuller music is more sun, or brings the forms in from the edge. The drone warms the red or lights the rings, the pad shows the vessels or the spiral, texture the grain or the checks, a phrase the threads or the fan. The piece blushes through. A hit leaves an afterimage; a cue is a hand before the sun, or light round the fingertip. Keys are sparks.
// own: 0 1 many fine vessels (b: many small forms), -1 a few great ones; 1 1 upright as trees (b: flat as a cloth), -1 a rose round a dark pupil (b: two whirls); 2 1 ink on pale ground, -1 (a: lit vessels in the dark; b: carved stone); 3 1 a clear round disc, -1 only a slit between the lids; 4 1 drifting cells (b: hard edges), -1 an empty field (b: outlines only); 5 1 warped like melted wax, -1 made of round dots; 6 1 rays, -1 dapples of light (b: rings); 7 1 a ground that goes to a horizon, -1 a globe. Any of them lets the piece's own colours in
float ceRim(float u);
float ceAll;      // how far any of its own numbers is from rest
float cePx = 1.0; // how much of the field lies in one pixel, beside the plain picture
// Where the eye looks: it rests, then glides on to another place. Goes round after ninety seven rests.
vec2 ceGaze(float t, float soft) {
 float i = mod(floor(t), 97.0), f = smoothstep(0.0, soft, fract(t));
 vec2 a = vec2(hash11(i + 3.0), hash11(i + 41.0)), b = vec2(hash11(mod(i + 1.0, 97.0) + 3.0), hash11(mod(i + 1.0, 97.0) + 41.0));
 return mix(a, b, f) - 0.5;
}
// The seethe every shut eye sees: fine grain, each grain brightening and fading in its own time. About -1 to 1.
float ceSeethe(vec2 p, float size) {
 vec2 g = rot(0.6) * p * size;
 float a = fract(uTime * 0.31), b = fract(a + 0.5);
 float ka = floor(mod(uTime * 0.31, 16.0)), kb = floor(mod(uTime * 0.31 + 0.5, 16.0));
 return ((noise(g + ka * 17.3) - 0.5) * sin(PI * a) + (noise(rot(1.3) * g * 1.4 + kb * 23.7 + 5.0) - 0.5) * sin(PI * b)) * 2.0;
}
// Tiny sparks that dart along short curved ways and are gone. 0 to 1.
float ceSparks(vec2 p, float size) {
 vec2 g = p * size, id = floor(g), h = hash22(id);
 float c = uTime * 0.45 + h.x * 7.0, f = fract(c), k = hash21(id + floor(mod(c, 50.0)) * 3.1);
 float ang = k * TAU + 2.2 * f;
 vec2 at = 0.5 + 0.28 * vec2(cos(ang), sin(ang));
 float d = length(g - id - at);
 float px = size / uRes.y;
 return (1.0 - smoothstep(0.0, 0.075 + px, d)) * sin(PI * f) * step(0.45, h.y);
}
// The piece over the whole field, soft at its ends. rgb the colours of the sounds there, a how loud.
vec4 cePiece(vec2 p) {
 vec2 uv = vec2(0.5 + p.x / 1.8, 0.5 - p.y * 0.92);
 vec4 m = piece(uv) + piece(uv + vec2(0.035, 0.0)) + piece(uv - vec2(0.035, 0.0));
 return 0.333 * m * (1.0 - smoothstep(0.36, 0.5, abs(uv.x - 0.5)));
}
// The tree of vessels, laid on log-polar ground so it is finest toward the middle of sight. How dark it is here.
float ceTree(vec2 q, float seed, float px, float w) {
 float ink = 0.0, zoom = 1.0, key = seed;
 for (int i = 0; i < 9; i++) {
  float h1 = hash11(key), h2 = hash11(key + 4.7);
  float L = 0.23 + 0.17 * h1, bow = (h2 - 0.5) * 0.5;
  float y = clamp(q.y, 0.0, L), u = y / L;
  float d = length(vec2(q.x - bow * y * (1.0 - u), q.y - y));
  float e = px * zoom, ww = w * (1.0 - 0.16 * u), wd = max(ww, 0.7 * e);
  ink = max(ink, (1.0 - smoothstep(0.45 * wd - 0.8 * e, wd + 1.1 * e, d)) * (0.25 + 0.75 * ww / wd));
  // past the fork: a main way on, and a thinner one to the side, left and right by turns
  q.y -= L;
  if (mod(float(i) + floor(seed), 2.0) > 0.5) q.x = -q.x;
  float turn = -0.1 - 0.22 * h1, k = 0.9, wk = 0.97;
  if (q.x > 0.2 * q.y + 0.002) { turn = 0.6 + 0.35 * h2; k = 0.62 + 0.14 * h1; wk = 0.9; key += 5.3; }
  q = rot(-turn) * q / k;
  zoom /= k; w *= wk;
  key = mod(key * 1.37 + 1.9, 91.0);
 }
 return ink;
}
float ceVessels(vec2 p) {
 vec2 f = p - vec2(-0.2, -0.09);
 f += 0.011 * vec2(sin(f.y * 17.0 + 2.0 * sin(f.x * 9.0)), cos(f.x * 15.0 + f.y * 6.0));
 f.x += f.x == 0.0 ? 1e-5 : 0.0;
 float rho = max(length(f), 0.02), phi = atan(f.y, f.x), px = cePx / (uRes.y * rho), up = step(0.0, phi);
 vec2 q = vec2(log(rho / 0.72), abs(phi));
 // above and below the middle of sight: one wide and one fine, which cross; and one that leaves outward
 float a = ceTree(rot(0.1 - 0.35 * up) * q, 12.3 + 35.0 * up, px, 0.0145);
 float b = ceTree(rot(0.5 - 0.3 * up) * (q - vec2(0.0, 0.01)), 70.6 - 13.0 * up, px, 0.010);
 float c = ceTree(vec2(-phi, q.x), 33.0, px, 0.011);
 return max(max(a, 0.85 * b), c) * smoothstep(0.04, 0.2, rho);
}
float ceVesselsOwn(vec2 p) {
 float way = uOwn[1], was = 0.0, other = 0.0, w = exp2(-1.1 * uOwn[0] * step(uOwn[0], 0.0)), px = cePx / uRes.y;
 if (abs(way) < 1.0) {
  vec2 q = p / (1.0 + 0.8 * max(-uOwn[0], 0.0)) + vec2(0.4, 0.06) * max(-uOwn[0], 0.0);
  was = ceVessels(q);
  if (uOwn[0] > 0.0) was = max(was, uOwn[0] * ceVessels(rot(2.3) * p * 1.25 + vec2(0.1, 0.05)));
 }
 if (way > 0.0) {
  vec2 f = p + 0.012 * vec2(sin(p.y * 13.0), sin(p.x * 11.0 + 1.0));
  float k = exp2(0.7 * uOwn[0]);
  other = ceTree((f - vec2(0.3, -0.62)) * 1.45 * k * vec2(-1.0, 1.0), 12.3, px * 1.45 * k, 0.026 * w);
  other = max(other, 0.8 * ceTree((f - vec2(-0.52, -0.6)) * 2.1 * k, 47.3, px * 2.1 * k, 0.022 * w));
  if (uOwn[0] > 0.0) {
   f.x += 0.5; f.x -= 0.55 * floor(f.x / 0.55); f.x -= 0.27;
   other = max(other, uOwn[0] * 0.55 * ceTree((f - vec2(0.0, -0.55)) * 3.4, 31.6, px * 3.4, 0.024));
  }
 }
 if (way < 0.0) {
  vec2 f = p + 0.008 * vec2(sin(p.y * 19.0), sin(p.x * 17.0 + 1.0)); f.x += f.x == 0.0 ? 1e-5 : 0.0;
  float rho = max(length(f), 0.02), part = TAU / floor(8.5 + 5.0 * uOwn[0]), phi = mod(atan(f.y, f.x), part) - 0.5 * part, lr = log(rho / 0.13);
  other = ceTree(vec2(abs(phi) + 0.01, lr), 12.3, px / rho, 0.028 * w);
  other = max(other, 0.8 * ceTree(vec2(0.5 * part - abs(phi), lr - 0.25), 60.6, px / rho, 0.019 * w)) * smoothstep(0.11, 0.15, rho);
 }
 return mix(was, other, abs(way));
}
// Round cells afloat all over the field, each a small ring.
float ceCells(vec2 p) {
 float s = 0.0;
 for (int k = 0; k < 2; k++) {
  float fk = float(k), z = 3.0 + 3.2 * fk;
  vec2 g = p * z + vec2(0.11 * uTime * (0.4 + fk), 0.07 * uTime) + 31.0 * fk, id = floor(g), h = hash22(id);
  vec2 d = fract(g) - 0.5 - 0.3 * (h - 0.5);
  float w = 0.06 + 0.07 * h.y;
  s += 1.5 * ceRim(length(d * (1.0 + 0.3 * h.yx)) / w) * step(0.2, h.x) + 0.5 * ceRim(length(d) / (0.35 * w)) * step(0.2, h.x);
 }
 return s;
}
// Spots of sun through leaves: round, soft, over one another.
float ceDapple(vec2 p) {
 float s = 0.0;
 for (int k = 0; k < 3; k++) {
  float fk = float(k), z = 2.2 + 1.3 * fk;
  vec2 g = rot(0.5 * fk) * p * z + 9.0 * fk + 0.18 * vec2(sin(uTime * 0.21 + fk), cos(uTime * 0.17 + 2.0 * fk)), id = floor(g), h = hash22(id + 5.0);
  float d = length(fract(g) - 0.5 - 0.3 * (h - 0.5)), rr = 0.16 + 0.17 * h.x;
  s += step(0.3, h.y) * (0.5 + 0.5 * h.x) * (1.0 - smoothstep(rr - 0.02 * z, rr + 0.02 * z, d)) * (0.75 + 0.25 * d / rr);
 }
 return s;
}
// How open the lids are at a place, where they are nearly shut.
float ceSlit(vec2 p) {
 float x = p.x - 0.02, a = 0.17 * (1.0 + 0.04 * sin(uTime * 0.13)) * max(1.0 - x * x / 0.62, 0.0);
 float y = p.y + 0.1 * x * x - 0.03 * sin(x * 2.0);
 float lash = 0.03 * noise(vec2(x * 46.0, 1.0 + step(0.0, y)));
 return smoothstep(-0.035, 0.05, a - abs(y) - lash);
}
// A thread afloat in the eye: a clear core between dark rims, and a paler fringe outside, as light bends round it.
float ceRim(float u) {
 float a = u - 1.0, b = u - 1.75, c = u - 2.45;
 return 0.75 * exp(-u * u * 2.6) - 0.85 * exp(-a * a * 7.0) + 0.42 * exp(-b * b * 9.0) - 0.16 * exp(-c * c * 9.0);
}
float ceFloater(vec2 q, float seed, float len, float w) {
 if (dot(q, q) > (len + 0.12) * (len + 0.12)) return 0.0;
 float k = 9.0 + 5.0 * hash11(seed), A = 0.028;
 float b = 1.6 * (hash11(seed + 2.0) - 0.5);
 float ph = q.y * k + seed, x = q.x - A * sin(ph) - 0.35 * A * sin(2.3 * ph) - b * q.y * q.y;
 float sl = A * k * (cos(ph) + 0.8 * cos(2.3 * ph)) + 2.0 * b * q.y;
 float d = length(vec2(x / sqrt(1.0 + sl * sl), max(abs(q.y) - len, 0.0)));
 float ww = w * (1.0 + 0.22 * sin(q.y * 78.0 + seed) + 0.25 * sin(q.y * 21.0));
 float s = ceRim(d / ww);
 // loose cells beside it, each a small ring
 for (int i = 0; i < 3; i++) {
  float fi = float(i), y = (hash11(seed + fi * 3.1) - 0.5) * 1.7 * len;
  vec2 c = vec2(A * sin(y * k + seed) + b * y * y + (0.02 + 0.02 * hash11(seed + fi)) * (fi - 0.8), y);
  s += 0.75 * ceRim(length(q - c) / (w * (1.2 + 0.5 * fi)));
 }
 return s;
}
vec3 ceSun(vec2 p) {
 float t = uTime;
 vec2 gz = ceGaze(t / 8.0, 0.32), slow = ceGaze(t / 8.0, 0.85);
 // the lids: thick above and at the corners, thin where the sun comes through
 vec2 s = p - vec2(0.21, 0.02) - 0.03 * vec2(sin(t * 0.05), cos(t * 0.037));
 float r = length(s * vec2(0.72, 1.0));
 float n1 = noise(p * 1.7 + vec2(0.02 * t, 4.0 - 0.013 * t)), n2 = noise(rot(0.6) * p * vec2(4.6, 7.5) - vec2(0.015 * t, 2.0));
 float edge = p.y - 0.27 + 0.34 * (p.x - 0.12) * (p.x - 0.12) - 0.05 * (n1 - 0.5);
 float lid = smoothstep(-0.26, 0.24, edge);
 float crease = exp(-676.0 * (edge - 0.02) * (edge - 0.02)) * (0.4 + 0.6 * n1);
 float thick = 0.8 + 0.8 * lid + 0.2 * crease + 0.85 * smoothstep(0.0, 1.0, r) + 0.55 * (n1 - 0.5) + 0.28 * (n2 - 0.5);
 float on = 0.55 + 0.6 * uEnergy;
 float ring = band(sat(r * 1.1)) * on;
 float sun = 0.3 + 0.95 * exp(-r * r * (5.5 - 2.4 * uSpace)) * (1.0 + 0.7 * uLevel * on) + 0.22 * uLevel * on + 0.22 * ring + 0.25 * uMic * exp(-r * r * 9.0);
 if (uOwn[3] > 0.0) {
  float disc = (1.0 - smoothstep(0.165, 0.185, length(s))), aura = exp(-max(length(s) - 0.17, 0.0) * 5.0);
  sun = mix(sun, 0.14 + 2.6 * disc + (0.4 + 0.4 * uLevel * on) * aura + 0.2 * uLevel * on + 0.25 * ring, uOwn[3]);
  thick = mix(thick, 0.3 * thick * (1.0 - 0.7 * disc) + 0.08 + 1.0 * (1.0 - aura), uOwn[3]);
 }
 if (uOwn[3] < 0.0) {
  float open = ceSlit(p);
  thick += -uOwn[3] * (2.1 * (1.0 - open) - 0.5 * open);
 }
 if (uOwn[6] > 0.0) {
  vec2 dir = s / max(length(s), 1e-4);
  float rays = 0.65 * noise(dir * 6.0 + vec2(0.06 * t, 3.0)) + 0.35 * noise(dir * 15.0 + vec2(5.0, -0.09 * t));
  thick += uOwn[6] * 2.6 * (smoothstep(0.3, 0.72, rays) - 0.45) * smoothstep(0.1, 0.42, r);
 }
 if (uOwn[6] < 0.0) thick += -uOwn[6] * (0.75 - 1.15 * ceDapple(p - vec2(0.03 * slow)));
 thick -= 0.34 * uDrone * on - 0.12 + 0.22 * (uTone - 0.5);
 // a place in the piece is a blush of its own colour
 vec4 pc = cePiece(p + vec2(0.16, -0.1) * (n1 - 0.5) + 0.1 * (n2 - 0.5));
 thick -= 0.3 * pc.a * on;
 // the vessels, shown by a patch of light that wanders over them
 vec2 eye = p - 0.05 * gz;
 vec2 pt = eye - vec2(0.5 * sin(t * 0.043), 0.28 * cos(t * 0.061));
 float show = (0.16 + 0.95 * uPad * on) * (0.35 + 0.65 * exp(-dot(pt, pt) * 3.5)) + 0.1 * uCue;
 float empty = max(-uOwn[4], 0.0), ves = 0.0;
 if (empty < 1.0) ves = (uOwn[0] == 0.0 && uOwn[1] == 0.0 ? ceVessels(eye) : ceVesselsOwn(eye)) * (1.0 - empty);
 if (ceAll > 0.0) show = mix(show, max(show, 0.45 + 0.35 * uPad * on), ceAll);
 if (uOwn[1] < 0.0) thick -= 3.2 * uOwn[1] * (1.0 - smoothstep(0.105, 0.125, length(eye + 0.004 * sin(eye.yx * 40.0))));
 thick += ves * show * 1.5;
 // three threads afloat: they sink, and slip when the eye goes after them
 float fl = 0.0, halo = 0.0;
 for (int i = 0; i < 3; i++) {
  float fi = float(i), c = t * (0.019 + 0.004 * fi) + fi * 0.37, f = fract(c), k = mod(floor(c), 40.0) + fi * 11.0;
  vec2 at = vec2(0.9 * (hash11(k + 1.0) - 0.5), 0.5 - 1.05 * f);
  if (i == 1) at = vec2(0.95 - 1.9 * f, 0.22 * (hash11(k) - 0.5) + 0.12 * sin(f * 6.0));
  at += (0.16 + 0.07 * fi) * slow + 0.1 * gz;
  float vis = (1.0 - empty) * (1.0 - abs(uOwn[1])) * smoothstep(0.0, 0.1, f) * (1.0 - smoothstep(0.9, 1.0, f)) * (i == 1 ? 0.15 + 1.2 * uPhrase : i == 0 ? 0.8 + 0.3 * uPhrase : 0.35 + 0.5 * uPhrase);
  vec2 fp = p - at;
  halo += vis * exp(-dot(fp, fp) * 42.0);
  fl += vis * (0.9 + 0.5 * uPhrase) * ceFloater(rot(0.5 + k * 2.1 + 0.4 * sin(t * 0.07 + k)) * (p - at), k, 0.1 + 0.05 * fi, 0.0042 + 0.0028 * fi * fi * 0.6);
 }
 if (uOwn[4] > 0.0) fl += uOwn[4] * (0.75 + 0.35 * uPhrase) * ceCells(p + 0.1 * slow);
 // a hand before the sun
 if (uCue > 0.001) {
  float x = p.x + 0.35 * p.y - mix(1.5, -0.75, uCue);
  float y = p.y * 15.0 + 1.2;
  float tip = x - 0.15 * cos(y) * (0.6 + 0.4 * sin(p.y * 4.0)) - 0.1 * p.y;
  float hand = (1.0 - smoothstep(-0.2, 0.16, tip)) * smoothstep(-1.6, -0.8, x);
  thick += 1.3 * hand * sat(uCue * 2.0); sun *= 1.0 - 0.35 * hand * uCue;
 }
 float grain = ceSeethe(p, 190.0);
 thick = 0.4 + 0.5 * (thick - 0.4 + sqrt((thick - 0.4) * (thick - 0.4) + 0.06));
 vec3 c = sun * 1.45 / (1.0 + 0.1 * sun * sun) * exp(-thick * mix(vec3(0.3, 1.95, 2.85), vec3(0.3, 1.95, 2.85) * (1.25 - 0.5 * uKind[0]), 0.35));
 if (ceAll > 0.0) {
  vec3 k0 = uKind[0], k1 = uKind[1];
  vec3 other = sun * 1.45 / (1.0 + 0.1 * sun * sun) * exp(-thick * (0.2 + 2.9 * (1.0 - k0)) * (0.75 + 0.25 * length(vec3(1.0) - k0)));
  float ink = sat(ves * show * 1.6);
  other = mix(other, other * (0.15 + 0.85 * k1 * k1), 0.7 * ink);
  if (uOwn[2] > 0.0) {  // ink on a pale ground
   vec3 paper = mix(vec3(1.25, 1.2, 1.12), vec3(1.25) * (0.5 + 0.6 * k0), 0.35) * (1.5 - 0.35 * thick + 0.15 * sun);
   paper *= exp(-max(thick - 0.5, 0.0) * (1.0 - k0 * 0.9) * 0.75);
   paper *= mix(vec3(1.0), 0.05 + k1 * k1 * 0.6, ink);
   other = mix(other, paper * 1.15, uOwn[2]);
  }
  if (uOwn[2] < 0.0) {  // the vessels lit, in the dark
   float lit = exp(-1.15 * thick + 0.3);
   vec3 night = k0 * k0 * (0.03 + 0.5 * lit * sun) + vec3(0.004, 0.005, 0.008);
   float pulse = 0.55 + 0.45 * sin(6.0 * length(p - s * 0.5) - uTime * 0.5 + 3.0 * n1);
   night += ves * (k1 * k1 + 0.06) * (0.5 + 1.5 * show) * (0.25 + 0.5 * pulse + 0.6 * ring) * 1.5;
   other = mix(other, night, -uOwn[2]);
  }
  c = mix(c, other, ceAll);
 }
 c *= mix(vec3(1.0), 0.7 + 0.5 * pc.rgb / max(pc.a, 0.02), 0.5 * sat(pc.a * 1.4) * on);
 c *= 1.0 + grain * (0.045 + 0.16 * uTexture);
 // a phrase lights the threads, and a little of the water round them
 c += (0.1 + 0.09 * uKind[3]) * halo * uPhrase * on;
 c *= max(1.0 + 0.42 * fl, 0.2);
 // the afterimage of a hit: pale, then its opposite
 vec2 hd = p - vec2(-0.3, -0.1) - 0.14 * slow - vec2(0.05, -0.04) * (1.0 - uHits);
 float hr = length(hd), disc = (1.0 - smoothstep(0.04, 0.19, hr));
 float neg = smoothstep(0.0, 0.3, uHits) * (1.0 - smoothstep(0.4, 0.9, uHits));
 c = mix(c, vec3(0.15 * c.g, 0.2 * c.r, 0.24 * c.r) + vec3(0.0, 0.012, 0.016), 0.9 * disc * neg);
 c += disc * smoothstep(0.4, 1.0, uHits) * (0.35 + 0.4 * uKind[4]);
 c += (0.5 + 0.5 * uKind[3]) * ceSparks(p + 0.02 * sin(p.yx * 11.0), 11.0) * 1.2 * uKeys;
 return screenOf(c);
}
// How much of a wave is left as its turns come near a pixel: k is radians a pixel.
float ceKeep(float k) { return 1.0 - smoothstep(0.5, 1.6, k); }
// A wave that goes round a whole number of times.
float ceRound(float n, float th, float rest) {
 float i = floor(n);
 return mix(cos(i * th + rest), cos((i + 1.0) * th + rest), smoothstep(0.3, 0.7, n - i));
}
vec4 ceForms(float th, float go, float turn, float px, float inv, float m) {
 float kR = ceKeep(15.0 * m * px) * inv, kF = ceKeep(26.0 * m * px) * inv, kC = ceKeep(28.0 * m * px) * inv;
 float fR = cos(15.0 * m * go) * kR, fS = ceRound(12.0 * m, th, 9.0 * m * go + turn) * kR, fF = ceRound(24.0 * m, th, -4.0 * m * go) * kF;
 float fC = ceRound(20.0 * m, th, 20.0 * m * go) * ceRound(20.0 * m, th, -20.0 * m * go) * kC;
 fR *= 0.75 + 0.25 * ceRound(30.0 * m, th, 0.0) * kC; fS *= 0.72 + 0.28 * ceRound(12.0 * m, th, -18.0 * m * go - turn) * kR; fF *= 0.7 + 0.3 * cos(13.0 * m * go) * kR;
 return vec4(fR, fS, fC, fF);
}
// The same forms laid flat, as on a cloth.
vec4 ceCloth(vec2 z, float m, float inv) {
 vec2 f = rot(0.35) * (z + 0.04 * vec2(sin(z.y * 4.0 + 0.11 * uTime), sin(z.x * 3.0 - 0.13 * uTime))) * 4.2 * m;
 float soft = ceKeep(84.0 * m * cePx / uRes.y) * inv;
 f.y += 0.045 * uTravel + 0.006 * uTime;
 return vec4(cos(9.0 * f.y) * (0.75 + 0.25 * cos(9.0 * f.x)), cos(7.0 * f.x + 7.0 * f.y) * (0.72 + 0.28 * cos(7.0 * f.x - 7.0 * f.y)), cos(8.0 * f.x) * cos(8.0 * f.y), cos(13.0 * f.x) * (0.7 + 0.3 * cos(6.0 * f.y))) * soft;
}
// The second whirl, come in from far off.
vec3 ceSecond(vec2 z) {
 vec2 b = z + vec2(0.75, -0.1) / min(uOwn[1], -1e-3); b.x += b.x == 0.0 ? 1e-5 : 0.0;
 float rb = max(length(b), 1e-3);
 return vec3(atan(b.y, b.x), log(rb * -uOwn[1] / 0.75), cePx / (uRes.y * rb));
}
vec3 cePressed(vec2 p) {
 float t = uTime, on = 0.55 + 0.6 * uEnergy;
 vec2 slow = ceGaze(t / 9.0, 0.8);
 // where the finger presses: the forms are pushed aside there
 float moon = max(uOwn[3], 0.0);
 vec2 fp = p - mix(vec2(0.55, -0.2), vec2(0.0, 0.0), moon) - 0.02 * vec2(sin(t * 0.07), cos(t * 0.05));
 float fr = length(fp * vec2(0.85 + 0.15 * moon, 1.0)) * (1.0 - 0.12 * moon);
 vec2 z = p - vec2(-0.14, 0.05) * (1.0 - moon) - 0.03 * slow;
 z -= fp * 0.22 * exp(-fr * fr * 6.0) * (1.0 - moon);
 float n1 = noise(p * 2.1 + vec2(0.03 * t, 3.0)), n2 = noise(p * 1.3 + vec2(7.0, -0.021 * t)), n3 = noise(rot(0.7) * p * 4.6 - 0.04 * t);
 z += 0.05 * (vec2(n1, n2) - 0.5) * smoothstep(0.02, 0.3, length(z));
 z.x += z.x == 0.0 ? 1e-5 : 0.0;
 float rho = max(length(z), 1e-3), th = atan(z.y, z.x), lr = log(rho), px = cePx / (uRes.y * rho);
 if (uOwn[1] < 0.0) { vec3 far = ceSecond(z); th -= far.x; lr -= far.y; px += far.z; }
 float go = lr + 0.045 * uTravel + 0.006 * t, turn = TAU * uLoop;
 // it turns inside out as a slow wave runs inward
 float inv = sin(1.5 * lr + 0.13 * t + 2.5 * n2);
 inv /= sqrt(inv * inv + 0.12);
 // the forms: beaded rings, a spiral, a fan, a fine checker, each where it happens to be strongest
 float kR = ceKeep(15.0 * px) * inv, kS = ceKeep(15.0 * px) * inv, kF = ceKeep(26.0 * px) * inv, kC = ceKeep(28.0 * px) * inv;
 float fR = cos(15.0 * go) * kR, fS = cos(12.0 * th + 9.0 * go + turn) * kS, fF = cos(24.0 * th - 4.0 * go) * kF;
 float fC = cos(20.0 * th + 20.0 * go) * cos(20.0 * th - 20.0 * go) * kC;
 fR *= 0.75 + 0.25 * cos(30.0 * th) * kC; fS *= 0.72 + 0.28 * cos(12.0 * th - 18.0 * go - turn) * kS; fF *= 0.7 + 0.3 * cos(13.0 * go) * kR;
 vec4 wave = vec4(fR, fS, fC, fF);
 if (uOwn[0] != 0.0 || uOwn[1] > 0.0) {
  float m = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.0 : 1.585)), cloth = max(uOwn[1], 0.0);
  wave = ceForms(th, go, turn, px, inv, m);
  if (cloth > 0.0) wave = mix(wave, ceCloth(z, m, inv), cloth);
 }
 vec4 form = 0.5 + 0.5 * wave;
 float e = 2.2 + 1.6 * uTone;
 form = max(pow(max(form, 1e-4), vec4(e)) - 0.6 * pow(0.5, e), 0.0);
 vec4 wave1 = form;
 if (uOwn[4] > 0.0) form = mix(form, 0.85 * smoothstep(0.24, 0.3, form), uOwn[4]);
 if (uOwn[4] < 0.0) { vec4 off = (form - 0.3) / (0.035 + 3.5 * px); form = mix(form, 1.1 * exp(-off * off), -uOwn[4]); }
 vec4 ever = smoothstep(vec4(0.35, 0.35, 0.35, 0.4), vec4(0.6, 0.6, 0.6, 0.65), vec4(n2, 1.0 - n2, 1.0 - n1, n1));
 if (uOwn[6] > 0.0) ever = mix(ever, vec4(0.0, 0.45, 0.0, 1.3), uOwn[6]);
 if (uOwn[6] < 0.0) ever = mix(ever, vec4(1.5, 0.0, 0.0, 0.0), -uOwn[6]);
 form *= vec4(0.25 + uDrone, 0.22 + uPad, 0.12 + uTexture, 0.08 + uPhrase) * ever;
 float amt = sat(0.34 + 0.8 * uLevel * on);
 float there = smoothstep(-0.8, 0.9, lr + 0.5 + 2.7 * amt + 0.4 * (n3 - 0.5));
 float glow = (0.7 + 0.65 * uEnergy) * there * (0.35 + 0.6 * amt + 0.5 * uDrone * (1.0 - amt)) * smoothstep(0.1, 0.7, n3 + 0.3 * n1) * (0.4 + 1.0 * band(sat((lr + 3.2) / 3.2)));
 float own = 0.3 + 0.6 * ceAll;
 vec3 c = vec3(0.028, 0.009, 0.034) * (0.5 + 1.2 * n2) + vec3(0.024, 0.006, 0.012) * n1;
 c += glow * (form.x * mix(vec3(0.85, 0.5, 0.16), uKind[0] * uKind[0], own) + form.y * mix(vec3(0.62, 0.26, 0.5), uKind[1] * uKind[1], own)
  + form.z * mix(vec3(0.3, 0.75, 0.55), uKind[2] * uKind[2], own) + form.w * mix(vec3(0.9, 0.75, 0.5), uKind[3] * uKind[3], own));
 if (ceAll > 0.0) c *= mix(vec3(1.0), vec3(0.5) + 1.1 * uKind[0], ceAll);
 if (uOwn[2] != 0.0) {
  float seen = sat(glow * 1.3 + 0.45);
  if (uOwn[2] > 0.0) {
   vec3 paper = vec3(0.86, 0.82, 0.75) * (0.86 + 0.2 * n2 + 0.1 * n1);
   paper *= exp(-seen * 3.6 * (form.x * (1.04 - uKind[0]) + form.y * (1.04 - uKind[1]) + form.z * (1.04 - uKind[2]) + form.w * (1.04 - uKind[3])));
   c = mix(c, paper, uOwn[2]);
  } else {
   // the same forms a little toward the lamp: what is higher there lies in shade
   vec2 z2 = z + vec2(-0.007, 0.0065); z2.x += z2.x == 0.0 ? 1e-5 : 0.0;
   float lr2 = log(max(length(z2), 1e-3)), th2 = atan(z2.y, z2.x), m2 = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.0 : 1.585));
   if (uOwn[1] < 0.0) { vec3 far = ceSecond(z2); th2 -= far.x; lr2 -= far.y; }
   vec4 w2 = ceForms(th2, lr2 + 0.045 * uTravel + 0.006 * t, turn, px, inv, m2);
   if (uOwn[1] > 0.0) w2 = mix(w2, ceCloth(z2, m2, inv), uOwn[1]);
   vec4 all4 = vec4(0.25 + uDrone, 0.22 + uPad, 0.12 + uTexture, 0.08 + uPhrase) * ever;
   w2 = max(pow(max(0.5 + 0.5 * w2, 1e-4), vec4(e)) - 0.6 * pow(0.5, e), 0.0);
   float h = dot(form, vec4(1.0)), slope = dot(wave1 - w2, all4 / (0.4 + all4));
   float grit = noise(p * 60.0), l = 0.4 + 1.25 * slope / (0.2 + abs(slope));
   vec3 stone = mix(uKind[0] * uKind[0], uKind[1] * uKind[1], sat(h * 0.9 + 0.4 * (n3 - 0.5))) * (0.6 + 0.4 * n1 + 0.25 * grit);
   c = mix(c, stone * (0.06 + 1.15 * max(l, 0.0)) * (0.55 + 0.9 * there * amt) * (0.55 + 0.6 * smoothstep(0.0, 0.6, h)) + c * 0.12, -uOwn[2]);
  }
 }
 vec4 pc = cePiece(p + 0.14 * (n1 - 0.5));
 c *= mix(vec3(1.0), 0.6 + 0.9 * pc.rgb, 0.7 * sat(pc.a));
 // the pit under the finger and the ring of light round it
 float pressed = max(moon, 1.0 - sat(2.0 * (abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7]) + max(-uOwn[3], 0.0))));
 float pit = (1.0 - smoothstep(0.11, 0.26, fr)), ringd = fr - 0.225 - 0.02 * (n1 - 0.5);
 float side = 0.12 + 0.88 * smoothstep(-0.25, 0.3, 0.8 * fp.y - fp.x);
 if (uOwn[3] < 0.0) c = mix(c, c * ceSlit(p) + vec3(0.012, 0.006, 0.01) * n1 + 0.06 * c, -uOwn[3]);
 pit *= pressed; side *= pressed;
 c = mix(c, vec3(0.011, 0.004, 0.014) + 0.02 * c, pit);
 c += vec3(0.5, 0.42, 0.62) * exp(-ringd * ringd * 420.0) * side * (0.10 + 0.45 * moon + 0.12 * uLow + 0.25 * uMic + 0.9 * uCue);
 c += vec3(0.3, 0.14, 0.4) * exp(-max(ringd, 0.0) * (12.0 - 6.0 * uSpace)) * smoothstep(-0.03, 0.03, ringd) * side * (0.08 + 0.1 * uLow + 0.5 * uCue);
 c *= 1.0 + ceSeethe(p, 190.0) * (0.12 + 0.1 * uTexture);
 vec2 hd = p - vec2(-0.42, 0.16) - 0.14 * slow - vec2(0.05, -0.04) * (1.0 - uHits);
 float disc = (1.0 - smoothstep(0.03, 0.19, length(hd)));
 c += disc * (smoothstep(0.4, 1.0, uHits) * vec3(0.5, 0.48, 0.4) * (0.5 + uKind[4]) + vec3(0.08, 0.02, 0.2) * smoothstep(0.0, 0.3, uHits));
 c += (0.5 + 0.5 * uKind[3]) * ceSparks(p + 0.02 * sin(p.yx * 11.0), 11.0) * uKeys;
 return screenOf(c * 1.6);
}
vec3 ceInner(vec2 p) { return uVar < 0.5 ? ceSun(p) : cePressed(p); }
vec3 render(vec2 p) {
 ceAll = sat(2.0 * (abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7])));
 if (ceAll == 0.0) return ceInner(p);
 float dots = max(-uOwn[5], 0.0), lay = max(uOwn[7], 0.0), globe = max(-uOwn[7], 0.0), pale = max(uOwn[2], 0.0);
 vec2 q = p, cell = vec2(0.0);
 const float N = 50.0;
 if (dots > 0.0) {
  vec2 g = p * N / vec2(1.0, 0.8660254); float row = floor(g.y); g.x += 0.5 * mod(row, 2.0);
  cell = (fract(g) - 0.5) * vec2(1.0, 0.8660254);
  q = p - dots * cell / N;
 }
 vec2 at = q;
 float d = 1.0, inside = 1.0, shade = 1.0;
 if (lay > 0.0) {
  d = 1.0 - lay * (q.y + 0.5) / 0.8;
  float dd = max(d, 0.06);
  q = (vec2(q.x, q.y + 0.5) / dd) * (1.0 - 0.45 * lay) - vec2(0.0, 0.5 + 0.1 * lay);
  cePx = 1.0 / (dd * dd);
 }
 if (globe > 0.0) {
  const float R = 0.42;
  float rr = length(q) / R, edge = 1.0 - smoothstep(0.985, 1.0, rr);
  float z = sqrt(max(1.0 - rr * rr, 0.0));
  vec2 on = q * (rr > 1e-3 ? asin(min(rr, 1.0)) / rr : 1.0) * 1.15;
  vec3 n = vec3(q / R, z);
  shade = mix(1.0, 0.16 + 1.05 * sat(dot(n, vec3(-0.5, 0.55, 0.67)) * 0.8 + 0.2), globe);
  q = mix(q, on, globe * step(rr, 1.0)); cePx = 1.0 + globe * min(1.0 / max(z, 0.15) - 1.0, 5.0);
  inside = mix(1.0, edge, globe);
 }
 if (uOwn[5] > 0.0) {
  vec2 w = vec2(noise(q * 2.3 + vec2(0.03 * uTime, 1.0)), noise(q * 2.3 + vec2(7.0, 4.0 - 0.027 * uTime))) - 0.5;
  w += 0.45 * (vec2(noise(q * 5.1 + 3.0 * w + 2.0), noise(q * 5.1 - 3.0 * w + 19.0)) - 0.5);
  q += 0.42 * uOwn[5] * w;
 }
 vec3 c = ceInner(q) * shade;
 if (inside < 1.0) {
  float out1 = max(length(at) - 0.42, 0.0);
  vec3 back = mix(uKind[0] * uKind[0] * 0.05 + uKind[0] * 0.22 * exp(-out1 * 9.0) * (0.5 + uLevel), vec3(0.93, 0.91, 0.87) * (0.8 + 0.2 * smoothstep(0.0, 0.2, out1 + 0.2 * at.y)), pale);
  c = mix(mix(back, c, 1.0 - globe), c, inside);
 }
 if (lay > 0.0) {
  float far = (1.0 - smoothstep(0.06, 0.42, d));
  float up = max(-d, 0.0);
  vec3 haze = mix(sqrt(uKind[1]) * (0.35 + 0.35 * uLevel), vec3(0.95, 0.93, 0.9), 0.7 * pale);
  vec3 sky = mix(haze, uKind[0] * mix(0.35, 1.0, pale), smoothstep(0.0, 0.3, up));
  c = mix(c, sky, far * lay);
 }
 if (dots > 0.0) {
  float l = dot(c, vec3(0.3, 0.55, 0.15)), px = N / uRes.y;
  float big = mix(0.06 + 0.4 * sqrt(sat(l * 1.25)), 0.05 + 0.42 * sqrt(sat(1.1 - l)), pale);
  float on = (1.0 - smoothstep(big - px, big + px, length(cell)));
  vec3 bead = c * mix(1.25, 0.9, pale), under = mix(c * 0.1, vec3(0.95, 0.93, 0.88), pale);
  c = mix(c, mix(under, bead, on), dots);
 }
 return c;
}
