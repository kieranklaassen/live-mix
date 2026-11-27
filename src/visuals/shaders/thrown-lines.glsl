// name: Thrown lines
// a: Flung
// b: Swung can
// what: About a dozen strands of wet enamel flung from the lower right across raw linen, looping, thinning and parting into drops where the throw dies, with most of the cloth left bare; or pale paint run from a pierced can on a cord, laid in closing ellipses over a black board.
// follows: Each kind of sound swells its own strands; in the linen the low band swells the black, and the whole mix the white in both. The piece says where the paint lies thickest; the wet gloss runs on with the loop. A hit throws a spatter, a cue one long new skein; keys add drops, a voice swells the white.
// own: 0 1 thrown from every side over all of it (b: many figures apart), -1 drawn together into one bundle (b: about one middle); 1 1 curling in many loops (b: round and close, coil on coil), -1 drawn taut and straight (b: narrow); 2 1 a few thick runs, -1 hair fine; 3 the ground: 1 a cloth dyed dark (b: white plaster), -1 damp sand in the pad's colour; 4 1 the runs are light, -1 they are grooves scored into the ground; 5 1 all in beads and drops, -1 whole, and broad or thin as a pen turns; 6 1 seen low across it going away, -1 bent round into a ring (b: wound on a ball); 7 1 the ground hangs in folds, -1 folded while wet, two halves alike
vec3 tlL, tlH;                          // where the window is, and halfway to it
float tlPx, tlWob, tlMap, tlReach, tlDark;
vec4 tlTop; vec3 tlTopIs;               // the uppermost coat here: direction out, how far from its edge, half width; its kind, cover and gleam
vec2 tlLow;                             // the coat under it: its kind and cover
float tlShade, tlSoak;                  // shadow on what lies on top so far; how near the cloth is to any paint
mat2 tlBack = mat2(1.0);                 // from a strand's own frame to the throw's
vec3 tlGlow = vec3(0.0);                // the light the runs give off here
vec3 tlInk[7];                          // the colours of the kinds, where they are light
vec4 tlHeard; vec3 tlHeardToo;          // how loud each of the five kinds is, then the low band (black) and the whole (white)
float tlLevel(float k) {
  return dot(tlHeard, vec4(equal(vec4(k), vec4(0.0, 1.0, 2.0, 3.0)))) + dot(tlHeardToo, vec3(equal(vec3(k), vec3(4.0, 5.0, 6.0))));
}
// Lays a run of paint over what is there: d from its edge (below 0 inside), w its half width, dir out from its middle line.
void tlPut(float d, float w, vec2 dir, float kind, float gleam) {
  float there = sat(w * 0.9 / tlPx), m = sat(0.5 - d * 0.77 / tlPx) * there, out_ = max(d, 0.0);
  tlSoak = min(tlSoak, out_ + 1.0 - there);
  if (uOwn[4] > 0.0) {
    float at = out_ / (0.006 + 1.2 * w);
    tlGlow += tlInk[int(kind)] * there * min(w * 70.0, 1.0) * (0.5 * exp(-at * 1.6) + 0.06 / (1.0 + at * at * 0.4)) * (0.4 + 0.8 * tlLevel(kind) + gleam);
  }
  float fall = sat(1.0 - out_ / (tlReach * w + 0.0015));
  tlShade = mix(tlShade * (1.0 - tlDark * there * sat(-dot(dir, tlL.xy)) * fall * fall), 1.0, m);
  if (m > 0.0) {
    tlLow = tlTopIs.xy;
    tlTop = vec4(dir, d, w); tlTopIs = vec3(kind, m, gleam);
  }
}
// The wet light going along a strand: 1 where g is a half, gone a fifth of the way off.
float tlPeak(float g) { g = 4.0 * g * g; g *= g; return g * g * g; }
// Enamel of one kind: 0 to 4 the kinds, 5 black, 6 white.
vec3 tlEnamel(float k) {
  vec3 c = uKind[int(min(k, 4.0))];
  float g = dot(c, vec3(0.3, 0.59, 0.11));
  if (uVar > 0.5) {                                              // b: white and greys, with a breath of the kind's colour
    float v = k < 0.5 ? 0.42 : k < 1.5 ? 0.8 : k < 2.5 ? 0.62 : k < 3.5 ? 0.9 : k < 4.5 ? 0.95 : 0.88;
    vec3 was = v * mix(vec3(1.0, 0.98, 0.94), 0.45 + 0.6 * c / max(g, 0.1) * 0.9, 0.14) * (0.86 + 0.16 * tlLevel(k));
    if (uOwn[3] != 0.0 || uOwn[4] > 0.0) was = mix(was, k > 5.5 ? uKind[3] * (0.3 + 0.7 * uKind[3]) : c * (0.3 + 0.7 * c), max(abs(uOwn[3]), uOwn[4]));
    return was;
  }
  c = max(mix(vec3(g), c, 0.95), 0.0);
  c = k < 0.5 ? c * c * 0.55 : c * (0.25 + 0.65 * c);
  vec3 coal = vec3(0.04, 0.038, 0.042);
  if (uOwn[3] > 0.0) {                                           // on a dark cloth nothing is darker than it
    coal = mix(coal, uKind[1] * 0.75, uOwn[3]);
    c = k > 4.5 ? c : mix(c, uKind[int(k)] * (0.45 + 0.6 * uKind[int(k)]), uOwn[3]);
  }
  if (uOwn[4] > 0.0) { c = k > 4.5 ? c : mix(c, uKind[int(k)], uOwn[4]); coal = mix(coal, uKind[0], uOwn[4]); }
  vec3 chalk = mix(vec3(0.92, 0.9, 0.84), uKind[3] * (0.4 + 0.55 * uKind[3]), max(max(abs(uOwn[3]), uOwn[4]), max(-uOwn[5], 0.0)));
  return k > 5.5 ? chalk : k > 4.5 ? coal : c;
}
// How a coat of wet paint looks from above.
vec3 tlWet(vec4 t, vec3 ink, float gleam) {
  float w = t.w, x = sat(1.0 + t.z / max(0.8 * w, 1e-4)), x2 = x * x;
  float swim = smoothstep(0.003, 0.012, w);
  vec3 n = normalize(vec3(t.xy * x * mix(0.95, 0.8 + 0.4 * x2, swim) + tlWob * 0.5 * swim, sqrt(1.0 - x2 * 0.98) + 0.2));
  float sharp = mix(0.04, 0.012, uTone), big = smoothstep(0.5, 2.2, w / tlPx);
  float nl = dot(n, tlL);
  float spec = smoothstep(0.965 - sharp, 0.965 + sharp, dot(n, tlH));
  vec3 c = ink * (0.6 + 0.5 * nl) + 0.05 * sat(-n.x) * (0.5 + ink);
  c = mix(c, vec3(1.0, 0.985, 0.95), spec * big * min(0.5 + 0.45 * gleam, 1.0));
  return c + min(gleam, 1.5) * 0.11 * (0.3 + ink) * (1.0 - x2);
}
// One thrown strand, in the throw's own frame (x runs along the throw): its way, how it whips, its width, where it dies.
// loop: where the arm looped, how large (the sign is the side), how it leans, and how far on it loops again.
void tlThrow(vec2 q, vec3 way, vec4 whip, vec4 loop, float w, float end, float kind, float swell, float front) {
  float x = q.x, a = whip.y * x + whip.z * x * x + whip.w, s = sin(a), c = cos(a);
  float y = way.x + x * (way.y + way.z * x + whip.x * s);
  float dy = way.y + 2.0 * way.z * x + whip.x * (s + x * c * (whip.y + 2.0 * whip.z * x));
  float k = inversesqrt(1.0 + dy * dy), o = (q.y - y) * k;
  // the loop: a strophoid, whose two tails run out along the strand
  float A = abs(loop.y) + 1e-4, B = 0.6 * A, which = loop.y < 0.0 ? -1.0 : 1.0, out1 = o * which, lx = (x - loop.x) / k + loop.z * out1;
  vec2 e = vec2(out1 + B, lx - loop.w * clamp(floor(lx / loop.w + 0.5), 0.0, 1.0));
  vec2 g = vec2(-e.y * e.y - e.x * (2.0 * A + 3.0 * e.x), 2.0 * e.y * (B - e.x));
  float f = e.y * e.y * (B - e.x) - e.x * e.x * (A + e.x);
  g.x += loop.z * g.y;
  float gl = max(length(g), 1e-7);
  float d = f / gl;
  g = vec2(g.y, g.x * which) / gl;
  vec2 tip = e + vec2(0.6 * A, 0.0);
  float slow = step(0.001, A) / (1.0 + 3.0 * dot(tip, tip) / (A * A + 1e-5));
  // the cord swells where the arm was slow; past its strength it parts into lengths, then drops
  float u = x / end, seed = whip.w * 7.0 + kind, cell = 0.05 + 3.5 * w;
  if (uOwn[5] > 0.0) cell = mix(cell, 0.014 + 2.8 * w, uOwn[5]);
  float sw = sin(x * 13.5 + seed), run = x / cell + seed + 0.55 * sw, id = floor(run), h = fract((id + seed) * 0.754877), h2 = fract(h * (h + 37.7) * 11.3);
  h = fract(h2 * 91.3 + h);
  float frail = sat(1.8 * u - 0.9) * (1.0 - step(0.001, A) * sat(0.9 - 1.2 * e.x / B)), far = run - id - 0.5;
  if (uOwn[5] != 0.0) frail = uOwn[5] > 0.0 ? mix(frail, 1.0, uOwn[5]) : frail * (1.0 + uOwn[5]);
  w *= swell * (1.2 - 0.55 * u) * (1.0 + 0.28 * sw + 0.12 * sin(x * 6.0 - uTime * 0.35 + seed)) * (0.75 + 0.5 * k * k * k) * (1.0 + 0.3 * slow);
  if (uOwn[5] < 0.0) {                                           // a broad pen held at a slant
    vec2 nib = k * vec2(-dy, 1.0);
    nib = mix(nib, vec2(g.x - dy * g.y, g.y + dy * g.x) * k, step(0.001, A) * sat(1.6 - dot(tip, tip) / (A * A + 1e-5)));
    w *= mix(1.0, 0.22 + 1.7 * pow(abs(dot(normalize(tlBack * nib + 1e-5), vec2(0.28, 0.96))), 2.0), -uOwn[5]);
  }
  float part = mix(0.5, 0.5 * h2 * h2 * (1.15 - 0.75 * u) * (1.0 - 0.8 * max(uOwn[5], 0.0)), frail);
  w *= mix(1.0, (0.45 + 0.5 * h + 0.5 * sat(1.0 - 6.0 * part)) * (1.0 + 0.7 * far), frail);
  part += 0.4 * sat(1.0 - 4.0 * frail);
  float b = max(abs(far) - part, 0.0) * cell / k * sign(far);
  w *= step(h, 1.35 - 0.5 * frail + max(uOwn[5], 0.0)) * sat((1.2 - u) * 10.0) * sat((front - u) * 9.0) * sat(x * 6.0 + 4.0);
  vec2 side = g * (f < 0.0 ? -abs(d) : abs(d)), v = side + vec2(b, frail * (1.0 - 0.7 * max(uOwn[5], 0.0)) * (0.012 + 0.03 * sat(u * 4.0 - 3.4)) * (h - 0.5));
  d = length(v);
  float neck = w * 0.17 * (1.0 - 0.8 * max(uOwn[5], 0.0)) * step(0.4, h2) * sat(6.0 - 6.0 * u), thin = length(side);
  if (thin - neck < d - w) { d = thin; v = side; w = neck; }     // a hair of paint still joins two lengths
  v /= max(d, 1e-5);
  float gleam = abs(fract(u - uLoop - uTime * 0.012 + 0.13 * seed) - 0.5);
  tlPut(d - w, w, tlBack * (k * (vec2(1.0, dy) * v.x + vec2(-dy, 1.0) * v.y)), kind, tlPeak(gleam) * (0.35 + uEnergy) + 0.8 * (swell - 0.9));
}
// Drops, one to a cell: more where `want` is higher.
void tlDrops(vec2 q, float n, float seed, float want, float most, float kind) {
  vec2 g = q * vec2(0.8, 1.0) * n + seed, id = floor(g), h = hash22(id + seed);
  float h3 = fract(h.x * 57.3 + h.y * 13.7), h4 = fract(h3 * 91.7 + h.y * 37.1);
  float r = (0.05 + most * h3 * h3 * h3) * smoothstep(0.0, 0.15, want - h4);
  vec2 v = (g - id - 0.5 - (h - 0.5) * 0.3) * vec2(1.0, 1.0 + 0.5 * h.y) / vec2(0.8, 1.0);
  float d = length(v);
  if (kind < 0.0) { float hk = fract(h4 * 91.0); kind = hk < 0.4 ? 5.0 : hk < 0.55 ? 6.0 : floor((hk - 0.55) * 11.0); }
  tlPut((d - r) / n, 0.6 * r / n, v / max(d, 1e-4), kind, uKeys);
}
// What one swing of the can laid: an ellipse (r its half axes) that dies away by `die` a radian and turns by `turn` as it does.
void tlSwing(vec2 q, vec2 at, float tilt, vec2 r, float die, float turn, float last, float w, float kind, float swell, float front) {
  vec2 p0 = q - at, v, ir = 1.0 / (r * r);
  float t = 0.4 * last;
  // when the can was at this distance: two refining steps, since the ellipse was turning meanwhile
  for (int i = 0; i < 2; i++) {
    v = rot(tilt + turn * t) * p0;
    float r2 = dot(v * v, ir) + 1e-5;
    float slope = die + turn * dot(v * ir, vec2(v.y, -v.x)) / r2;
    t = clamp(t - (0.5 * log(r2) + die * t) / max(slope, 0.35 * die), -8.0, last + 8.0);
  }
  float a = atan(v.y / r.y, v.x / r.x + 1e-5);
  t = a + TAU * floor((t - a) / TAU + 0.5);
  mat2 m = rot(tilt + turn * t);
  v = m * p0;
  float rho = sqrt(dot(v * v, ir) + 1e-5);
  vec2 g = v * ir / rho;
  float gl = max(length(g), 1e-3), d = (log(rho) + die * t) * rho / gl, s = min(rho, 1.0);
  float speed = length(vec2(r.x * v.y / r.y, r.y * v.x / r.x) / rho) * (0.45 + 0.55 * s);
  w *= swell * clamp(0.36 / (speed + 0.06), 0.55, 2.2) * (1.0 + 0.1 * sin(t * 31.0) + 0.2 * sin(t * 2.3 + kind) + 0.07 * sin(t * 0.9 - uTime * 0.35));
  w *= sat(0.5 + 0.5 * t) * sat((last - t) * 0.3) * sat((front - t) * 1.6);
  float gleam = abs(fract(t / last - uLoop - uTime * 0.012 + 0.2 * kind) - 0.5);
  vec2 dir = (g / gl) * m;
  if (uOwn[5] < 0.0) w *= mix(1.0, 0.25 + 1.6 * pow(abs(dot(dir, vec2(0.38, 0.925))), 2.0), -uOwn[5]);
  if (uOwn[5] > 0.0) {                                           // beads, each where a drop fell, larger as they come round
    float along = length(r) * 0.7 * s, n = max(floor(along * TAU / (0.016 + 7.0 * w) + 0.5), 5.0), id = floor(t / TAU * n), f = t / TAU * n - id - 0.5;
    float b = w * (1.2 + 1.5 * hash11(id + kind * 7.0)), len = f * TAU * along / n;
    vec2 at = vec2(d, len);
    float dl = length(at);
    tlPut(mix(abs(d) - w, dl - b, sat(uOwn[5] * 1.5)), mix(w, b, uOwn[5]), mix(d < 0.0 ? -dir : dir, (dir * d + vec2(-dir.y, dir.x) * len) / max(dl, 1e-4), uOwn[5]), kind, tlPeak(gleam) * (0.35 + uEnergy) + 0.8 * (swell - 0.9));
    return;
  }
  tlPut(abs(d) - w, w, d < 0.0 ? -dir : dir, kind, tlPeak(gleam) * (0.35 + uEnergy) + 0.8 * (swell - 0.9));
}
// The thrown strands, the lowest first. Each: where it starts, its lean, its bend, its width; then its kind with a tenth of the
// place where it dies, and how large its loop is (the sign is the side).
const int TLN = 12;
const vec4 TLWAY[TLN] = vec4[TLN](vec4(-0.2, 0.1, 0.1, 0.0095), vec4(0.24, -0.2, 0.1, 0.0048), vec4(0.2, -0.34, 0.06, 0.0072), vec4(0.12, 0.26, -0.08, 0.0058),
  vec4(0.06, 0.02, 0.16, 0.0036), vec4(-0.22, 0.18, -0.16, 0.0028), vec4(0.3, -0.02, -0.1, 0.0028), vec4(-0.16, -0.24, 0.34, 0.0034),
  vec4(0.26, -0.46, 0.16, 0.0062), vec4(0.34, -0.4, -0.02, 0.0024), vec4(-0.1, 0.26, -0.18, 0.0042), vec4(0.14, -0.42, 0.17, 0.0085));
const vec2 TLEND[TLN] = vec2[TLN](vec2(0.14, 0.0), vec2(0.18, 0.0), vec2(5.175, -0.25), vec2(3.115, 0.0), vec2(1.155, 0.17), vec2(2.175, 0.0), vec2(2.165, 0.0), vec2(3.16, -0.15),
  vec2(4.13, 0.0), vec2(5.18, 0.2), vec2(6.165, 0.21), vec2(4.17, -0.2));
// The swings of the can: the middle and half axes; the tilt, how fast it dies, how it turns, where it stops; the width and the kind.
const vec4 TLA[6] = vec4[6](vec4(-0.10, 0.02, 0.86, 0.40), vec4(0.30, -0.10, 0.52, 0.36), vec4(-0.26, 0.06, 0.50, 0.22),
  vec4(0.16, 0.04, 0.62, 0.19), vec4(-0.02, -0.05, 0.95, 0.55), vec4(-0.04, 0.02, 0.70, 0.30));
const vec4 TLB[6] = vec4[6](vec4(0.35, 0.0150, 0.011, 70.0), vec4(-0.7, 0.0125, -0.008, 78.0), vec4(1.15, 0.0160, 0.009, 60.0),
  vec4(0.1, 0.0200, -0.0065, 56.0), vec4(-0.5, 0.0300, 0.015, 17.0), vec4(0.75, 0.0300, 0.02, 16.0));
const vec2 TLW[6] = vec2[6](vec2(0.0052, 0.0), vec2(0.0019, 2.0), vec2(0.0032, 1.0), vec2(0.0024, 3.0), vec2(0.0034, 6.0), vec2(0.0055, 4.0));
vec3 render(vec2 p) {
  bool cloth = uVar < 0.5;
  float back = clamp(uRes.y / uRes.x, 1.0, 1.45);                // a narrow picture is seen from a little further off
  p *= back;
  tlPx = back / uRes.y;
  vec2 eye = p;
  float away = 0.0, fold = 0.0;
  if (uOwn[6] > 0.0) {                                           // low across it: the top of the picture is far off
    float den = max(1.0 - 1.45 * uOwn[6] * p.y, 0.12);
    p = vec2(p.x * 1.25, p.y * 1.35 + 0.08 * uOwn[6]) / den * mix(1.0, 0.8, uOwn[6]);
    p = mix(eye, p, sat(uOwn[6] * 2.5));
    away = uOwn[6] * (1.0 - smoothstep(0.25, 1.0, den)); tlPx /= den;
  }
  float ball = 0.0, round_ = 1.0;
  if (uOwn[6] < 0.0 && !cloth) {                                 // wound on a ball
    float R = 0.45 / max(-uOwn[6], 1e-4), r = length(eye) / R, z = sqrt(max(1.0 - r * r, 0.0));
    ball = 1.0 - smoothstep(-tlPx, tlPx, length(eye) - R);
    p = r < 1.0 ? eye * mix(1.0, asin(min(r, 0.999)) / max(r, 1e-3) * 0.95, -uOwn[6]) : vec2(9.0);
    tlPx /= max(z, 0.25);
    round_ = mix(1.0, 0.16 + 1.0 * sat(dot(vec3(eye / R, z), vec3(-0.48, 0.5, 0.72))), -uOwn[6]);
  }
  if (uOwn[6] < 0.0 && cloth) {                                  // bent round: straight on at the foot, its ends together at the top
    float bow = -uOwn[6] * 3.1, rad = 1.0 / bow;
    vec2 c = vec2(eye.x, rad - eye.y - (0.1 + 0.2 * -uOwn[6]) * -uOwn[6]);
    float r = length(c), a = r > 1e-4 ? atan(c.x, c.y) : 0.0;
    p = vec2(a * rad, rad - r);
    p.x *= mix(1.0, 0.95, -uOwn[6]);
  }
  vec2 lies = uOwn[6] < 0.0 ? eye : p;                            // how the ground lies
  if (uOwn[7] < 0.0) p.x = mix(p.x, sqrt(p.x * p.x + 1e-5) * 1.25 - 0.12, -uOwn[7]);
  if (uOwn[7] > 0.0) {                                           // hanging in folds that sway a little
    float n = noise(vec2(p.x * 2.2, p.y * 0.5 + 7.0)), ph = p.x * 8.5 + 3.4 * n + 0.8 * p.y * sin(p.x * 2.0 + 1.0) + 0.25 * sin(uTime * 0.21 + p.x * 2.0);
    fold = (cos(ph) + 0.35 * cos(ph * 2.3 + 1.0)) * uOwn[7] * (0.75 + 0.5 * n);
    p.x += 0.05 * uOwn[7] * sin(ph);
    p.y += 0.02 * fold;
    lies = p;
  }
  tlHeard = vec4(uDrone, uPad, uTexture, uPhrase);
  tlHeardToo = vec3(0.35 * uHits, uLow, min(uLevel + 0.7 * uMic, 1.3));
  float la = 2.2 + 0.22 * sin(uTime * 0.07);
  tlL = normalize(vec3(cos(la), sin(la), 0.95));
  tlH = normalize(tlL + vec3(0.0, 0.0, 1.0));
  tlMap = piece(vec2(p.x / 1.78 + 0.5, 0.5 - p.y)).a;
  tlWob = noise(p * 30.0 + vec2(0.0, uTime * 0.03)) - 0.5;
  tlReach = mix(0.8, 1.9, uSpace); tlDark = mix(0.65, 0.85, uTone);
  tlTop = vec4(0.0, 0.0, 0.0, 0.01); tlTopIs = vec3(5.0, 0.0, 0.0); tlLow = vec2(5.0, 0.0);
  tlSoak = 1.0; tlShade = 1.0;
  for (int k = 0; k < 7; k++) tlInk[k] = uOwn[4] > 0.0 ? uOwn[4] * (k < 5 ? uKind[k] : k < 6 ? uKind[0] : vec3(0.9, 0.86, 0.78)) : vec3(0.0);
  // the ground. a: raw linen, threads over and under, some of them thicker; b: a board rolled black, its grain lying across
  vec2 g = lies * 150.0 + 0.6 * tlWob;
  float n1 = noise(cloth ? vec2(g.x * 0.045, g.y * 0.9) : lies * vec2(7.0, 160.0));
  float n2 = noise(cloth ? vec2(g.x * 0.9 + 9.0, g.y * 0.045) : lies * vec2(30.0, 420.0));
  float n3 = noise(cloth ? lies * 5.0 : lies * 2.6 + 4.0);
  vec2 id = floor(g), f = g - id - 0.5;
  bool over = mod(id.x + id.y, 2.0) < 0.5;
  float weave = (0.5 - 4.0 * (over ? f.x * f.x : f.y * f.y)) * sat(1.6 - 330.0 * tlPx);   // under two pixels a thread is only tone
  vec3 linen = vec3(0.83, 0.78, 0.69) * (0.97 + 0.08 * weave + 0.07 * (n1 + n2 - 1.0) + 0.05 * (hash11(over ? id.x : id.y + 71.0) - 0.5) + 0.05 * (n3 - 0.5));
  vec2 lamp = p - vec2(-0.45, 0.35);
  float sheen = exp(-dot(lamp, lamp) * 1.3), grain = n1 + 0.6 * n2 - 0.8;
  vec3 board = vec3(0.034, 0.033, 0.036) + vec3(0.07, 0.074, 0.082) * sheen * (0.55 + 0.45 * n3) + 0.011 * grain * (0.4 + sheen);
  vec3 col = cloth ? linen : board;
  if (uOwn[3] > 0.0) {
    if (cloth) col = mix(col, (0.025 + 0.36 * uKind[0] * uKind[0]) * (1.0 + 2.2 * (linen.r - 0.8)) * (0.8 + 0.4 * n3), uOwn[3]);
    else {
      float trowel = noise(lies * vec2(3.0, 11.0) + 2.0 * n3);
      col = mix(col, vec3(0.8, 0.785, 0.75) * (0.93 + 0.1 * trowel + 0.05 * n3 + 0.03 * (n1 - 0.5)), uOwn[3]);
    }
  }
  if (uOwn[3] < 0.0) {
    float wet = fbm(lies * 1.7 + 5.0), grit = hash21(floor(lies * 620.0)), rip = sin(lies.y * 46.0 + 5.0 * noise(lies * vec2(1.6, 3.0)) + 2.0 * n3);
    vec3 sand = uKind[1] * (0.5 + 0.5 * uKind[1]) * (0.66 + 0.5 * wet + 0.12 * (grit - 0.5) + 0.07 * rip * smoothstep(0.35, 0.7, wet)) + 0.05 * step(0.985, grit);
    col = mix(col, sand, -uOwn[3]);
  }
  vec3 bare = col;
  // a is worked out in the throw's own frame, from the lower right to the upper left
  mat2 turn = cloth ? mat2(-0.848, -0.53, 0.53, -0.848) : mat2(1.0);
  vec2 q = turn * (p - (cloth ? vec2(0.95, -0.62) : vec2(0.0)) + (cloth ? 0.0012 * weave : 0.0) + (cloth ? 0.004 : 0.0025) * vec2(tlWob, n3 * tlWob));
  vec3 window = tlL;
  tlL.xy = turn * tlL.xy;
  float axis = q.y * (3.0 - 0.8 * q.x);
  float strew = cloth ? exp(-axis * axis) * (1.0 - smoothstep(0.6, 1.95, q.x)) : 0.14 + 0.2 * exp(-dot(p, p) * 5.0);
  strew *= (0.4 + 1.2 * n3) * (1.0 + 0.8 * uKeys);
  tlDrops(q, 52.0, 13.7, 0.5 * strew + (cloth ? 0.35 : 0.14) * tlMap, 0.3, cloth ? -1.0 : 6.0);
  tlDrops(q, 19.0, 3.1, (cloth ? 0.28 : 0.1) * strew + (cloth ? 0.18 : 0.04) * tlMap, 0.2, cloth ? -1.0 : 6.0);
  if (cloth) tlHeard.z *= 2.4;                                   // thin threads swell the most
  float grow = (cloth ? 0.42 : 0.26) + 0.36 * uEnergy, base = (cloth ? 0.85 : 1.0) + 0.45 * tlMap;
  for (int i = cloth ? 0 : TLN; i < TLN; i++) {
    vec4 W = TLWAY[i]; vec2 E = TLEND[i];
    float fi = float(i), kind = floor(E.x);
    bool cue = i == TLN - 1;                                      // the last is a cue's own skein
    vec4 whip = vec4(0.045, 2.6 + 2.4 * fract(fi * 0.618), 1.8 * fract(fi * 0.382), fi * 2.4);
    float wide = W.w;
    if (uOwn[2] != 0.0) wide *= uOwn[2] > 0.0 ? mix(1.0, cue ? 2.0 : mod(fi, 3.0) < 0.5 ? 3.0 : mod(fi, 3.0) < 1.5 && fi > 5.0 ? 2.4 : 0.0, uOwn[2]) : exp2(1.3 * uOwn[2]);
    vec2 qi = q;
    if (uOwn[0] > 0.0) {
      mat2 m = rot(uOwn[0] * (fi * 2.4 - 6.0 - 6.2832 * floor(fi * 0.382)) * (cue ? 0.2 : 0.75));
      qi = m * (q - vec2(1.134, -0.022)) + vec2(1.134 - 0.12 * uOwn[0], -0.022 + W.x * uOwn[0]);
      tlBack = mat2(m[0][0], m[1][0], m[0][1], m[1][1]);
      E.x += 0.06 * uOwn[0];
    }
    if (uOwn[0] < 0.0) { W.xyz *= 1.0 + 0.9 * uOwn[0]; E.x = mix(E.x, kind + 0.17 + 0.002 * fi, -uOwn[0]); }
    if (uOwn[1] > 0.0) { whip.x *= 1.0 + 0.55 * uOwn[1]; whip.y *= 1.0 + 0.4 * uOwn[1]; W.z *= 1.0 - 0.5 * uOwn[1]; E.y = E.y == 0.0 ? 0.19 * uOwn[1] * (mod(fi, 2.0) < 0.5 ? 1.0 : -1.0) : E.y * (1.0 + 0.25 * uOwn[1]); }
    if (uOwn[1] < 0.0) { whip.x *= 1.0 + uOwn[1]; W.z *= 1.0 + uOwn[1]; E.y *= 1.0 + uOwn[1]; W.x *= 1.0 - 0.5 * uOwn[1]; }
    vec4 loop = vec4(E.y == 0.0 ? -3.0 : 0.82 + 0.25 * fract(fi * 0.41), E.y, sign(-E.y) * (1.0 + 0.3 * fract(fi * 0.71)), abs(kind - 3.5) < 2.0 ? 9.0 : 1.9 * abs(E.y) + 0.01);
    tlThrow(qi, W.xyz, whip, loop, wide, 10.0 * (E.x - kind), kind, cue ? 1.2 * smoothstep(0.0, 0.4, uCue) : base + grow * tlLevel(kind), cue ? 0.6 + 1.1 * (1.0 - uCue) : 9.0);
  }
  tlBack = mat2(1.0);
  for (int i = cloth ? 6 : 0; i < 6; i++) {
    vec4 A = TLA[i], B = TLB[i];
    float wide = TLW[i].x, fi = float(i);
    if (uOwn[2] != 0.0) wide *= uOwn[2] > 0.0 ? mix(1.0, i == 1 || i == 3 ? 0.0 : 2.6, uOwn[2]) : exp2(1.2 * uOwn[2]);
    if (uOwn[0] > 0.0) { A.xy = mix(A.xy, i == 0 ? vec2(-0.48, 0.16) : i == 1 ? vec2(0.5, 0.2) : i == 2 ? vec2(-0.2, -0.24) : i == 3 ? vec2(0.42, -0.26) : i == 4 ? vec2(0.06, 0.22) : vec2(0.1, 0.0), uOwn[0]); A.zw *= 1.0 - (i == 0 || i == 4 ? 0.62 : 0.45) * uOwn[0]; }
    if (uOwn[0] < 0.0) { A.xy *= 1.0 + uOwn[0]; B.x = mix(B.x, 0.25, -uOwn[0]); A.zw = mix(A.zw, vec2(0.9, 0.46) * (1.0 - 0.15 * fi), -uOwn[0]); B.z *= 1.0 + uOwn[0]; }
    if (uOwn[1] > 0.0) { B.y *= 1.0 - 0.3 * uOwn[1]; A.zw = mix(A.zw, vec2(0.25 + 0.28 * A.z), uOwn[1]); A.y *= 1.0 + 0.8 * uOwn[1]; }
    if (uOwn[1] < 0.0) { A.w *= 1.0 + 0.55 * uOwn[1]; B.z *= 1.0 + 0.7 * uOwn[1]; A.z *= 1.0 - 0.1 * uOwn[1]; }
    bool cue = i == 5;                                            // the last is a cue's own swing
    tlSwing(q, A.xy, B.x, A.zw, B.y, B.z, B.w, wide, TLW[i].y, cue ? 1.2 * smoothstep(0.0, 0.4, uCue) : base + grow * tlLevel(TLW[i].y), cue ? 7.0 + 13.0 * (1.0 - uCue) : 999.0);
  }
  // a hit: one spatter, which runs on the way it was thrown
  vec2 hv = q - (cloth ? vec2(1.12, -0.27) : vec2(-0.42 - 0.72 * min(uOwn[7], 0.0), -0.26)) - vec2(0.1 * sin(uTime * 0.11), 0.05 * sin(uTime * 0.083));
  float ha = atan(hv.y, hv.x + 1e-5), fly = hv.x - 0.32 * (1.0 - uHits), hl = length(hv);
  float splat = 0.034 * sqrt(uHits) * (1.0 + 0.12 * sin(ha * 3.0 + 1.0) + 0.09 * sin(ha * 8.0) * sin(ha * 5.0 + 2.0));
  tlPut(hl - splat, 0.4 * splat, hv / max(hl, 1e-4), 4.0, uHits);
  tlDrops(q, 30.0, 29.3, 1.2 * sat(uHits * 1.4) * exp(-fly * fly * 45.0 - hv.y * hv.y * 90.0 / (1.0 + 8.0 * max(hv.x, 0.0))), 0.32, 4.0);
  // its finest spray catches on the ground, and the wet paint near it takes the light; on a cue all of it does
  vec2 sg = q * 62.0, sid = floor(sg), sh = hash22(sid + 9.0);
  float spray = uHits * exp(-dot(hv, hv) * 30.0 - 20.0 * fly * fly), sd = length(sg - sid - 0.5 - 0.6 * (sh - 0.5));
  col = mix(col, tlEnamel(4.0), 0.85 * sat(((0.16 + 0.2 * sh.y * sh.y) * smoothstep(0.0, 0.4, spray - 0.4 * fract(sh.x * 57.0)) - sd) / (62.0 * tlPx) + 0.5) * sat(8.0 * spray));
  float flash = 0.9 * uHits * exp(-hl * hl * 9.0) + 0.8 * uCue;
  // oil in the cloth, then the two uppermost coats, then the shadows
  tlTop.xy = tlTop.xy * turn;
  tlL = window;
  float soak = 0.55 / (1.0 + tlSoak * tlSoak * mix(60000.0, 16000.0, uSpace));
  if (cloth) col = mix(col, col * vec3(0.8, 0.71, 0.57), soak);
  col = mix(col, tlEnamel(tlLow.x) * 0.95, tlLow.y);
  col = mix(col, tlWet(tlTop, tlEnamel(tlTopIs.x), tlTopIs.z + flash), tlTopIs.y);
  if (uOwn[4] < 0.0) {
    // scored: the side toward the window is dark, the far side catches it, and a rim of what came out lies along both
    float w = max(tlTop.w, 1e-4), in_ = sat(-tlTop.z / w), rim = exp(-abs(tlSoak - 0.0018) * 520.0) * (1.0 - tlTopIs.y);
    float lean = dot(tlTop.xy, normalize(window.xy)) * (1.0 - in_ * in_);
    vec3 tint = tlTopIs.x > 4.5 ? vec3(0.6) : 0.35 + 0.9 * uKind[int(min(tlTopIs.x, 4.0))];
    vec3 cut = bare * mix(vec3(0.5), vec3(1.0), 0.5 - 0.5 * lean) * (0.72 + 0.28 * (1.0 - in_)) + (0.28 * bare + 0.1) * max(-lean, 0.0);
    cut = mix(cut, cut * tint, 0.35 + 0.35 * sat(tlTopIs.z + flash + 0.6 * tlLevel(tlTopIs.x)));
    vec3 g0 = bare * (1.0 + 0.16 * rim);
    col = mix(col, mix(g0, cut, tlTopIs.y), -uOwn[4]);
    tlShade = mix(tlShade, 1.0, -uOwn[4]);
  }
  if (uOwn[4] > 0.0) {
    vec3 lit = bare * 0.12 + tlGlow * 0.6;
    float core = tlTopIs.y * sat(-tlTop.z / max(0.55 * tlTop.w, 1e-4));
    lit += (0.35 + 0.65 * tlEnamel(tlTopIs.x)) * core * (0.55 + 0.5 * tlLevel(tlTopIs.x) + 0.5 * min(tlTopIs.z + flash, 1.0));
    col = mix(col, lit / (1.0 + 0.35 * max(max(lit.r, lit.g), lit.b)), uOwn[4]);
    tlShade = mix(tlShade, 1.0, uOwn[4]);
  }
  if (uOwn[7] > 0.0) col *= clamp(0.82 - 0.34 * fold + 0.06 * fold * fold, 0.12, 1.12);
  if (uOwn[7] < 0.0) col *= 1.0 + uOwn[7] * 0.3 * exp(-abs(eye.x) * 90.0);
  if (!cloth) { float hx = uHits * exp(-hl * hl * 26.0); col = mix(col, uKind[4] * (0.5 + 0.5 * uKind[4]) + 0.25 * max(-uOwn[4], 0.0) * bare, 0.75 * hx * hx * max(max(-uOwn[4], abs(uOwn[3])), abs(uOwn[7]))); }
  if (uOwn[6] < 0.0 && !cloth) {
    vec2 sh = eye - vec2(0.1, -0.12);
    float under = mix(1.0, 0.35 + 0.65 * smoothstep(0.3, 0.62, length(sh)), -uOwn[6]);
    col = mix(bare * under * mix(1.0, 0.6, -uOwn[6]), col * round_, ball); tlShade = mix(1.0, tlShade, ball);
  }
  if (uOwn[6] != 0.0) { p = eye; col *= 1.0 - 0.55 * away; }
  vec2 far = p - vec2(-0.35, 0.22);
  return col * tlShade * (cloth ? 1.05 - 0.2 * min(dot(far, far), 2.5) : uOwn[3] > 0.0 ? mix(0.8 + 0.35 * sheen, 1.05 - 0.2 * min(dot(far, far), 2.5), uOwn[3]) : 0.8 + 0.35 * sheen);
}
