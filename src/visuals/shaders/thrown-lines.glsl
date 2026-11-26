// name: Thrown lines
// a: Flung
// b: Swung can
// what: About a dozen strands of wet enamel flung from the lower right across raw linen, looping, thinning and parting into drops where the throw dies, with most of the cloth left bare; or pale paint run from a pierced can on a cord, laid in closing ellipses over a black board.
// follows: Each kind of sound swells its own strands; in the linen the low band swells the black, and the whole mix the white in both. The piece says where the paint lies thickest; the wet gloss runs on with the loop. A hit throws a spatter, a cue one long new skein; keys add drops, a voice swells the white.
vec3 tlL, tlH;                          // where the window is, and halfway to it
float tlPx, tlWob, tlMap, tlReach, tlDark;
vec4 tlTop; vec3 tlTopIs;               // the uppermost coat here: direction out, how far from its edge, half width; its kind, cover and gleam
vec2 tlLow;                             // the coat under it: its kind and cover
float tlShade, tlSoak;                  // shadow on what lies on top so far; how near the cloth is to any paint
vec4 tlHeard; vec3 tlHeardToo;          // how loud each of the five kinds is, then the low band (black) and the whole (white)
float tlLevel(float k) {
  return dot(tlHeard, vec4(equal(vec4(k), vec4(0.0, 1.0, 2.0, 3.0)))) + dot(tlHeardToo, vec3(equal(vec3(k), vec3(4.0, 5.0, 6.0))));
}
// Lays a run of paint over what is there: d from its edge (below 0 inside), w its half width, dir out from its middle line.
void tlPut(float d, float w, vec2 dir, float kind, float gleam) {
  float there = sat(w * 0.9 / tlPx), m = sat(0.5 - d * 0.77 / tlPx) * there, out_ = max(d, 0.0);
  tlSoak = min(tlSoak, out_ + 1.0 - there);
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
    return v * mix(vec3(1.0, 0.98, 0.94), 0.45 + 0.6 * c / max(g, 0.1) * 0.9, 0.14) * (0.86 + 0.16 * tlLevel(k));
  }
  c = max(mix(vec3(g), c, 0.95), 0.0);
  c = k < 0.5 ? c * c * 0.55 : c * (0.25 + 0.65 * c);
  return k > 5.5 ? vec3(0.92, 0.9, 0.84) : k > 4.5 ? vec3(0.04, 0.038, 0.042) : c;
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
  float sw = sin(x * 13.5 + seed), run = x / cell + seed + 0.55 * sw, id = floor(run), h = fract((id + seed) * 0.754877), h2 = fract(h * (h + 37.7) * 11.3);
  h = fract(h2 * 91.3 + h);
  float frail = sat(1.8 * u - 0.9) * (1.0 - step(0.001, A) * sat(0.9 - 1.2 * e.x / B)), far = run - id - 0.5;
  w *= swell * (1.2 - 0.55 * u) * (1.0 + 0.28 * sw + 0.12 * sin(x * 6.0 - uTime * 0.35 + seed)) * (0.75 + 0.5 * k * k * k) * (1.0 + 0.3 * slow);
  float part = mix(0.5, 0.5 * h2 * h2 * (1.15 - 0.75 * u), frail);
  w *= mix(1.0, (0.45 + 0.5 * h + 0.5 * sat(1.0 - 6.0 * part)) * (1.0 + 0.7 * far), frail);
  part += 0.4 * sat(1.0 - 4.0 * frail);
  float b = max(abs(far) - part, 0.0) * cell / k * sign(far);
  w *= step(h, 1.35 - 0.5 * frail) * sat((1.2 - u) * 10.0) * sat((front - u) * 9.0) * sat(x * 6.0 + 4.0);
  vec2 side = g * (f < 0.0 ? -abs(d) : abs(d)), v = side + vec2(b, frail * (0.012 + 0.03 * sat(u * 4.0 - 3.4)) * (h - 0.5));
  d = length(v);
  float neck = w * 0.17 * step(0.4, h2) * sat(6.0 - 6.0 * u), thin = length(side);
  if (thin - neck < d - w) { d = thin; v = side; w = neck; }     // a hair of paint still joins two lengths
  v /= max(d, 1e-5);
  float gleam = abs(fract(u - uLoop - uTime * 0.012 + 0.13 * seed) - 0.5);
  tlPut(d - w, w, k * (vec2(1.0, dy) * v.x + vec2(-dy, 1.0) * v.y), kind, tlPeak(gleam) * (0.35 + uEnergy) + 0.8 * (swell - 0.9));
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
  // the ground. a: raw linen, threads over and under, some of them thicker; b: a board rolled black, its grain lying across
  vec2 g = p * 150.0 + 0.6 * tlWob;
  float n1 = noise(cloth ? vec2(g.x * 0.045, g.y * 0.9) : p * vec2(7.0, 160.0));
  float n2 = noise(cloth ? vec2(g.x * 0.9 + 9.0, g.y * 0.045) : p * vec2(30.0, 420.0));
  float n3 = noise(cloth ? p * 5.0 : p * 2.6 + 4.0);
  vec2 id = floor(g), f = g - id - 0.5;
  bool over = mod(id.x + id.y, 2.0) < 0.5;
  float weave = (0.5 - 4.0 * (over ? f.x * f.x : f.y * f.y)) * sat(1.6 - 330.0 * tlPx);   // under two pixels a thread is only tone
  vec3 linen = vec3(0.83, 0.78, 0.69) * (0.97 + 0.08 * weave + 0.07 * (n1 + n2 - 1.0) + 0.05 * (hash11(over ? id.x : id.y + 71.0) - 0.5) + 0.05 * (n3 - 0.5));
  vec2 lamp = p - vec2(-0.45, 0.35);
  float sheen = exp(-dot(lamp, lamp) * 1.3), grain = n1 + 0.6 * n2 - 0.8;
  vec3 board = vec3(0.034, 0.033, 0.036) + vec3(0.07, 0.074, 0.082) * sheen * (0.55 + 0.45 * n3) + 0.011 * grain * (0.4 + sheen);
  vec3 col = cloth ? linen : board;
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
    vec4 loop = vec4(E.y == 0.0 ? -3.0 : 0.82 + 0.25 * fract(fi * 0.41), E.y, sign(-E.y) * (1.0 + 0.3 * fract(fi * 0.71)), abs(kind - 3.5) < 2.0 ? 9.0 : 1.9 * abs(E.y) + 0.01);
    tlThrow(q, W.xyz, whip, loop, W.w, 10.0 * (E.x - kind), kind, cue ? 1.2 * smoothstep(0.0, 0.4, uCue) : base + grow * tlLevel(kind), cue ? 0.6 + 1.1 * (1.0 - uCue) : 9.0);
  }
  for (int i = cloth ? 6 : 0; i < 6; i++) {
    vec4 A = TLA[i], B = TLB[i];
    bool cue = i == 5;                                            // the last is a cue's own swing
    tlSwing(q, A.xy, B.x, A.zw, B.y, B.z, B.w, TLW[i].x, TLW[i].y, cue ? 1.2 * smoothstep(0.0, 0.4, uCue) : base + grow * tlLevel(TLW[i].y), cue ? 7.0 + 13.0 * (1.0 - uCue) : 999.0);
  }
  // a hit: one spatter, which runs on the way it was thrown
  vec2 hv = q - (cloth ? vec2(1.12, -0.27) : vec2(-0.42, -0.26)) - vec2(0.1 * sin(uTime * 0.11), 0.05 * sin(uTime * 0.083));
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
  vec2 far = p - vec2(-0.35, 0.22);
  return col * tlShade * (cloth ? 1.05 - 0.2 * min(dot(far, far), 2.5) : 0.8 + 0.35 * sheen);
}
