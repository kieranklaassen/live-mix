// name: Closed eyes
// a: Toward the sun
// b: Pressed
// what: The warm red of shut lids turned to the sun, darker under the upper lid, with the eye's own branching vessels coming and going and a few clear threads sinking through; or the eye pressed in the dark, where soft beads, checkers, spirals and fans glow on plum, finest at the middle, and turn inside out.
// follows: Fuller music is more sun, or brings the forms in from the edge. The drone warms the red or lights the rings, the pad shows the vessels or the spiral, texture the grain or the checks, a phrase the threads or the fan. The piece blushes through. A hit leaves an afterimage; a cue is a hand before the sun, or light round the fingertip. Keys are sparks.
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
  float rho = max(length(f), 0.02), phi = atan(f.y, f.x), px = 1.0 / (uRes.y * rho), up = step(0.0, phi);
  vec2 q = vec2(log(rho / 0.72), abs(phi));
  // above and below the middle of sight: one wide and one fine, which cross; and one that leaves outward
  float a = ceTree(rot(0.1 - 0.35 * up) * q, 12.3 + 35.0 * up, px, 0.0145);
  float b = ceTree(rot(0.5 - 0.3 * up) * (q - vec2(0.0, 0.01)), 70.6 - 13.0 * up, px, 0.010);
  float c = ceTree(vec2(-phi, q.x), 33.0, px, 0.011);
  return max(max(a, 0.85 * b), c) * smoothstep(0.04, 0.2, rho);
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
  thick -= 0.34 * uDrone * on - 0.12 + 0.22 * (uTone - 0.5);
  // a place in the piece is a blush of its own colour
  vec4 pc = cePiece(p + vec2(0.16, -0.1) * (n1 - 0.5) + 0.1 * (n2 - 0.5));
  thick -= 0.3 * pc.a * on;
  // the vessels, shown by a patch of light that wanders over them
  vec2 eye = p - 0.05 * gz;
  vec2 pt = eye - vec2(0.5 * sin(t * 0.043), 0.28 * cos(t * 0.061));
  float show = (0.16 + 0.95 * uPad * on) * (0.35 + 0.65 * exp(-dot(pt, pt) * 3.5)) + 0.1 * uCue;
  float ves = ceVessels(eye);
  thick += ves * show * 1.5;
  // three threads afloat: they sink, and slip when the eye goes after them
  float fl = 0.0, halo = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i), c = t * (0.019 + 0.004 * fi) + fi * 0.37, f = fract(c), k = mod(floor(c), 40.0) + fi * 11.0;
    vec2 at = vec2(0.9 * (hash11(k + 1.0) - 0.5), 0.5 - 1.05 * f);
    if (i == 1) at = vec2(0.95 - 1.9 * f, 0.22 * (hash11(k) - 0.5) + 0.12 * sin(f * 6.0));
    at += (0.16 + 0.07 * fi) * slow + 0.1 * gz;
    float vis = smoothstep(0.0, 0.1, f) * (1.0 - smoothstep(0.9, 1.0, f)) * (i == 1 ? 0.15 + 1.2 * uPhrase : i == 0 ? 0.8 + 0.3 * uPhrase : 0.35 + 0.5 * uPhrase);
    vec2 fp = p - at;
    halo += vis * exp(-dot(fp, fp) * 42.0);
    fl += vis * (0.9 + 0.5 * uPhrase) * ceFloater(rot(0.5 + k * 2.1 + 0.4 * sin(t * 0.07 + k)) * (p - at), k, 0.1 + 0.05 * fi, 0.0042 + 0.0028 * fi * fi * 0.6);
  }
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
vec3 cePressed(vec2 p) {
  float t = uTime, on = 0.55 + 0.6 * uEnergy;
  vec2 slow = ceGaze(t / 9.0, 0.8);
  // where the finger presses: the forms are pushed aside there
  vec2 fp = p - vec2(0.55, -0.2) - 0.02 * vec2(sin(t * 0.07), cos(t * 0.05));
  float fr = length(fp * vec2(0.85, 1.0));
  vec2 z = p - vec2(-0.14, 0.05) - 0.03 * slow;
  z -= fp * 0.22 * exp(-fr * fr * 6.0);
  float n1 = noise(p * 2.1 + vec2(0.03 * t, 3.0)), n2 = noise(p * 1.3 + vec2(7.0, -0.021 * t)), n3 = noise(rot(0.7) * p * 4.6 - 0.04 * t);
  z += 0.05 * (vec2(n1, n2) - 0.5) * smoothstep(0.02, 0.3, length(z));
  z.x += z.x == 0.0 ? 1e-5 : 0.0;
  float rho = max(length(z), 1e-3), th = atan(z.y, z.x), lr = log(rho), px = 1.0 / (uRes.y * rho);
  float go = lr + 0.045 * uTravel + 0.006 * t, turn = TAU * uLoop;
  // it turns inside out as a slow wave runs inward
  float inv = sin(1.5 * lr + 0.13 * t + 2.5 * n2);
  inv /= sqrt(inv * inv + 0.12);
  // the forms: beaded rings, a spiral, a fan, a fine checker, each where it happens to be strongest
  float kR = ceKeep(15.0 * px) * inv, kS = ceKeep(15.0 * px) * inv, kF = ceKeep(26.0 * px) * inv, kC = ceKeep(28.0 * px) * inv;
  float fR = cos(15.0 * go) * kR, fS = cos(12.0 * th + 9.0 * go + turn) * kS, fF = cos(24.0 * th - 4.0 * go) * kF;
  float fC = cos(20.0 * th + 20.0 * go) * cos(20.0 * th - 20.0 * go) * kC;
  fR *= 0.75 + 0.25 * cos(30.0 * th) * kC; fS *= 0.72 + 0.28 * cos(12.0 * th - 18.0 * go - turn) * kS; fF *= 0.7 + 0.3 * cos(13.0 * go) * kR;
  vec4 form = 0.5 + 0.5 * vec4(fR, fS, fC, fF);
  float e = 2.2 + 1.6 * uTone;
  form = max(pow(max(form, 1e-4), vec4(e)) - 0.6 * pow(0.5, e), 0.0);
  form *= vec4(0.25 + uDrone, 0.22 + uPad, 0.12 + uTexture, 0.08 + uPhrase) * smoothstep(vec4(0.35, 0.35, 0.35, 0.4), vec4(0.6, 0.6, 0.6, 0.65), vec4(n2, 1.0 - n2, 1.0 - n1, n1));
  float amt = sat(0.34 + 0.8 * uLevel * on);
  float there = smoothstep(-0.8, 0.9, lr + 0.5 + 2.7 * amt + 0.4 * (n3 - 0.5));
  float glow = (0.7 + 0.65 * uEnergy) * there * (0.35 + 0.6 * amt + 0.5 * uDrone * (1.0 - amt)) * smoothstep(0.1, 0.7, n3 + 0.3 * n1) * (0.4 + 1.0 * band(sat((lr + 3.2) / 3.2)));
  vec3 c = vec3(0.028, 0.009, 0.034) * (0.5 + 1.2 * n2) + vec3(0.024, 0.006, 0.012) * n1;
  c += glow * (form.x * mix(vec3(0.85, 0.5, 0.16), uKind[0] * uKind[0], 0.3) + form.y * mix(vec3(0.62, 0.26, 0.5), uKind[1] * uKind[1], 0.3)
    + form.z * mix(vec3(0.3, 0.75, 0.55), uKind[2] * uKind[2], 0.3) + form.w * mix(vec3(0.9, 0.75, 0.5), uKind[3] * uKind[3], 0.3));
  vec4 pc = cePiece(p + 0.14 * (n1 - 0.5));
  c *= mix(vec3(1.0), 0.6 + 0.9 * pc.rgb, 0.7 * sat(pc.a));
  // the pit under the finger and the ring of light round it
  float pit = (1.0 - smoothstep(0.11, 0.26, fr)), ringd = fr - 0.225 - 0.02 * (n1 - 0.5);
  float side = 0.12 + 0.88 * smoothstep(-0.25, 0.3, 0.8 * fp.y - fp.x);
  c = mix(c, vec3(0.011, 0.004, 0.014) + 0.02 * c, pit);
  c += vec3(0.5, 0.42, 0.62) * exp(-ringd * ringd * 420.0) * side * (0.10 + 0.12 * uLow + 0.25 * uMic + 0.9 * uCue);
  c += vec3(0.3, 0.14, 0.4) * exp(-max(ringd, 0.0) * (12.0 - 6.0 * uSpace)) * smoothstep(-0.03, 0.03, ringd) * side * (0.08 + 0.1 * uLow + 0.5 * uCue);
  c *= 1.0 + ceSeethe(p, 190.0) * (0.12 + 0.1 * uTexture);
  vec2 hd = p - vec2(-0.42, 0.16) - 0.14 * slow - vec2(0.05, -0.04) * (1.0 - uHits);
  float disc = (1.0 - smoothstep(0.03, 0.19, length(hd)));
  c += disc * (smoothstep(0.4, 1.0, uHits) * vec3(0.5, 0.48, 0.4) * (0.5 + uKind[4]) + vec3(0.08, 0.02, 0.2) * smoothstep(0.0, 0.3, uHits));
  c += (0.5 + 0.5 * uKind[3]) * ceSparks(p + 0.02 * sin(p.yx * 11.0), 11.0) * uKeys;
  return screenOf(c * 1.6);
}
vec3 render(vec2 p) { return uVar < 0.5 ? ceSun(p) : cePressed(p); }
