// name: Cast net
// a: Thrown open
// b: Lift nets
// what: A pearl-grey lake at sunrise: somebody in a wide hat stands in a flat boat and has thrown a net, which hangs in the air as a great ring of mesh with the sun through it, falls, and is drawn in. Or an estuary at dusk: shore nets on bent poles and long beams, held by stones, the near one dripping; a heron waits.
// follows: The fuller the music, the wider the net. The mesh shows the piece: round it or along it is the loop. Drone is mist and the sun's height, pad colour on the water, texture ripple, the phrase leans the net or dips a beam, bands light the weights or the drops. A hit is a ring of splashes; a cue a far throw, or the near beam dips. Keys are fish, a voice ripples.
// own: 0 a moonlit night at -1, a red dawn or dusk at 1; 1 white mist at -1, a dark storm at 1; 2 quite alone at -1, a fleet of boats, or a net on the other bank, at 1; 3 a low eye and a high sky at -1, a high eye and much water at 1; 4 a deep bell of a net, or a taut cloth, at -1, a flat open ring, or a deep bag, at 1; 5 seen from far off at -1, from very near at 1
float cnPx, cnHz, cnTilt;  // a pixel; where water meets sky; how far the water opens to us
float cnFog, cnStorm;
vec2 cnSun;
vec3 cnTop, cnMid, cnLow, cnGlow, cnLit, cnDark;  // the sky from top to bottom, the light, what stands against it

float cnOn(float a, float b, float x) { return smoothstep(a, b, x); }
float cnOff(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
float cnSeg(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 pa = p - a, ba = b - a;
  float h = sat(dot(pa, ba) / max(dot(ba, ba), 1e-6));
  return length(pa - ba * h) - mix(ra, rb, h);
}
// How far from a bent pole, or a slack rope.
float cnBow(vec2 p, vec2 a, vec2 b, float bow) {
  vec2 ba = b - a; float L = max(length(ba), 1e-4); ba /= L;
  vec2 q = vec2(dot(p - a, ba), dot(p - a, vec2(-ba.y, ba.x)));
  float h = sat(q.x / L), slope = bow * 4.0 * (1.0 - 2.0 * h) / L;
  return length(vec2((q.y - bow * 4.0 * h * (1.0 - h)) / sqrt(1.0 + slope * slope), q.x - h * L));
}
// Below a line on the water all is seen upside down.
vec2 cnTwice(vec2 q, float line, float shake) { return q.y < line ? vec2(q.x + shake, 2.0 * line - q.y) : q; }
float cnFill(float d) { return cnOff(-0.5, 0.5, d / cnPx); }
float cnLine(float d, float w) { return cnOff(w - 0.5 * cnPx, w + 0.7 * cnPx, d) * min(1.0, w * 2.0 / cnPx + 0.35); }

// A net is a bowl: the place (x, y) of the cloth is seen at m * xy + k * (1 - (x*x + y*y) / s). The two places seen at q.
float cnRoots(vec2 q, mat2 m, vec2 k, float s, out vec2 one, out vec2 two) {
  mat2 im = inverse(m);
  vec2 w = im * (q - k), v = im * k / s;
  float a = dot(v, v), b = 2.0 * dot(w, v) - 1.0, c = dot(w, w), D = b * b - 4.0 * a * c;
  float Q = 0.5 * (-b + sqrt(max(D, 0.0)));
  one = two = vec2(9.0);
  if (D < 0.0 || Q < 1e-4) return 0.0;
  one = w + v * (c / Q);
  two = w + v * (Q / max(a, 1e-4));
  return sat(D / max(length(4.0 * b * (v * im) - 8.0 * a * (w * im)) * cnPx, 1e-6));
}
// From a step on the cloth to a step in the picture, and slopes back.
mat2 cnLay(vec2 xy, mat2 m, vec2 k, float s, out mat2 back) {
  mat2 j = m - outerProduct(k, xy) * (2.0 / s);
  float det = determinant(j);
  back = mat2(j[1][1], -j[1][0], -j[0][1], j[0][0]) / (abs(det) < 1e-6 ? 1e-6 : det);
  return j;
}
// Threads where f crosses a whole number; g is how fast f runs across the picture.
float cnThreads(float f, vec2 g, out float dense) {
  const float width = 0.0008;
  float w = length(g) * cnPx, t = width * length(g);
  dense = cnOn(0.16, 0.34, w);
  float d = abs(fract(f - 0.5) - 0.5) / max(w, 1e-5);
  float line = cnOff(width / cnPx - 0.4, width / cnPx + 0.8, d);
  return mix(line, min(0.9, 2.0 * t + 0.6 * w), dense);
}

// The sky, and below it the water: the sky upside down, broken small, with a path of light under the sun.
vec3 cnGround(vec2 p, out float rip) {
  float d = max(cnHz - p.y, 1e-4), e = d / cnTilt, far = cnOn(0.0, 0.16, d), wet = cnOff(-0.005, 0.005, p.y - cnHz);
  vec2 w = vec2(p.x / (e + 0.12), log(e + 0.03));
  float a = noise(w * vec2(2.6, 6.0) + vec2(sin(0.05 * uTime), 2.0 * sin(0.06 * uTime))) - 0.5;
  float b = noise(w * vec2(9.0, 24.0) + vec2(cos(0.07 * uTime), 3.0 * sin(0.083 * uTime + 1.5))) - 0.5;
  rip = (a + b * (0.35 + 0.8 * uTexture)) * far;
  vec2 up = p;
  if (p.y < cnHz) up = vec2(p.x + rip * 0.02, cnHz + abs(0.95 * e + rip * (0.06 + 0.07 * uTexture + 0.05 * cnStorm)));
  float h = up.y - cnHz, away = length((up - cnSun) * vec2(0.8, 1.0));
  vec3 c = mix(cnLow, cnMid, cnOn(-0.02, 0.22, h));
  c = mix(c, cnTop, cnOn(0.1, 0.62, h));
  c = mix(c, cnGlow, (1.0 - cnFog * 0.4) * (0.6 * exp(-away * away * 22.0) + 0.34 * exp(-away * 3.6)) * (1.0 - 0.5 * cnStorm));
  vec2 q = vec2(up.x * 1.1 + 0.006 * uTravel, h * 5.5 + 0.22 * up.x);
  float n = noise(q * 1.6) * 0.64 + noise(q * vec2(4.6, 5.6) + 3.0) * 0.36;
  float bank = cnOn(0.46 - 0.14 * cnStorm, 0.8 - 0.1 * cnStorm, n) * cnOn(0.0, 0.2, h) * (1.0 - 0.6 * wet);
  c = mix(c, mix(cnTop * 0.86, cnGlow, 0.5 * exp(-2.4 * away)) * (1.0 - 0.25 * cnStorm), bank * (0.45 + 0.4 * cnStorm) * (1.0 - cnFog));
  float disc = cnOff(-cnPx, cnPx, length(p - cnSun) - 0.047);
  c = mix(c, min(cnGlow * 1.14 + 0.06, 1.0), disc * (1.0 - wet) * (0.92 - 0.6 * cnFog) * (1.0 - 0.9 * cnStorm) * (1.0 - 0.5 * bank));
  c *= mix(1.0, mix(1.0, 0.72, cnOn(0.0, 0.5, d)) + rip * 0.12, wet);
  float across = (p.x - cnSun.x + rip * 0.05) / (0.05 + 0.22 * d), path = exp(-across * across);
  float glint = cnOn(-0.1, 0.36, b + 0.4 * a + 0.1 * path) * far + (1.0 - far) * 0.4;
  c = mix(c, cnLit, wet * sat(path * (0.22 + 0.75 * glint) * (1.0 - 0.75 * cnStorm) * (0.85 - 0.5 * cnFog) + 0.2 * uCue * path));
  return mix(c, mix(cnLow, cnMid, 0.3), (0.35 + 0.6 * cnFog) * exp(-abs(p.y - cnHz) * mix(40.0, 6.0, cnFog)));  // mist where they meet
}
// The colour the music lays on a thing at a place of the piece.
vec3 cnStain(vec3 c, vec4 m, float much) {
  float a = sat(m.a * (0.7 + 0.8 * uEnergy));
  vec3 hue = m.rgb / max(m.a, 0.004);
  hue = mix(hue, hue * hue, 0.5);
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  return mix(c, hue * (0.35 + 0.75 * l) + 0.1 * l, sat(a * much) * step(0.004, m.a));
}

// One thrown net: its rim's middle, size, tilt and lean, and where its crown stands from there.
vec3 cnCast(vec3 col, vec2 p, vec2 c, float R, float ratio, float lean, vec2 k, float see) {
  vec2 q = p - c;
  if (see < 0.003 || length(q) > 1.1 * R + length(k) + 0.02) return col;
  mat2 m = rot(lean) * mat2(R, 0.0, 0.0, R * ratio);
  vec2 one, two;
  float hit = cnRoots(q, m, k, 1.0, one, two);
  if (one.y < two.y) { vec2 h = one; one = two; two = h; }
  for (int i = 0; i < 2 && hit > 0.0; i++) {
    bool near = i == 1;
    vec2 xy = near ? two : one;
    float s = dot(xy, xy);
    if (s > 1.4 || s < 1e-5) continue;
    float r = sqrt(s), th = atan(xy.y, xy.x);
    float edge = 1.0 + 0.035 * sin(3.0 * th + 0.23 * uTime) + 0.016 * sin(7.0 * th - 0.31 * uTime);
    r /= edge;
    mat2 G, J = cnLay(xy, m, k, 1.0, G);
    vec2 gr = G * xy / (r * edge * edge), gt = G * vec2(-xy.y, xy.x) / s;
    float inside = cnOff(-0.5, 0.5, (r - 1.0) / max(length(gr) * cnPx, 1e-5));
    float N = 72.0 / TAU, inner = max(r, 0.03), a = th * N, b = log(inner) * N * 0.85, dense;
    vec2 gA = gt * N, gB = gr / inner * N * 0.85;
    float u1 = cnThreads(a + b, gA + gB, dense), u2 = cnThreads(a - b, gA - gB, dense);
    float mesh = max(u1, u2), knots = u1 * u2 * (1.0 - dense);
    float gore = 0.5 + 0.5 * sin(11.0 * th + 2.0 * sin(2.0 * th) + 0.2 * uTime);  // it hangs in soft folds
    float shine = exp(-dot(p - cnSun, p - cnSun) * 18.0);
    float veil = ((near ? 0.05 : 0.12) + 0.13 * gore * cnOn(0.1, 0.9, r) + 0.22 * cnOff(0.0, 0.35, r)) * (1.0 - 0.7 * shine);
    float turn = fract(th / TAU + 0.75);
    vec2 mp = vec2(turn, 0.98 - 0.96 * min(r, 1.0));
    vec4 mus = mix(piece(mp), piece(vec2(1.0 - turn, mp.y)), 0.5 * cnOn(0.42, 0.5, abs(turn - 0.5)));
    vec3 cloth = mix(col, cnDark, veil * inside);
    cloth = cnStain(cloth, mus, 0.52 * inside);
    cloth = mix(cloth, mix(cnDark, cnGlow * 0.6, 0.6 * shine), mesh * inside * (near ? 0.75 : 0.26) * (1.0 - 0.45 * dense));
    cloth = mix(cloth, cnLit, knots * inside * sat(1.1 * mus.a + 0.3 * shine));
  // the skirt: a rope, and the weights along it in sixteen parts
    cloth = mix(cloth, cnDark, cnLine(abs(r - 1.0) / max(length(gr), 1e-5), 0.0014) * (near ? 0.9 : 0.5));
    float id = floor(th / TAU * 64.0 + 0.5), at = id / 64.0 * TAU, loud = band(0.5 + 0.5 * sin(at));
    float bead = cnFill(length(J * (xy - edge * vec2(cos(at), sin(at)))) - min(0.0032 + 0.0038 * loud, 0.04 * R) * (near ? 1.0 : 0.75));
    cloth = mix(cloth, mix(cnDark, mix(cnGlow, uKind[3], 0.4), 0.9 * sat(1.4 * loud)), bead);
    col = mix(col, cloth, see * hit);
  }
  return col;
}
// A net far out: a veil, its rope and a few threads.
vec3 cnVeil(vec3 col, vec2 p, vec2 c, float R, float lean, float see) {
  vec2 q = rot(-lean) * (p - c) / (R * vec2(1.0, 0.42));
  float r = length(q + vec2(0.0, 0.12 * q.x * q.x)), th = atan(q.y, q.x + 1e-5) * 24.0, px = cnPx / (0.6 * R);
  float threads = cnOn(0.7, 1.0, max(sin(th + 15.0 * r), sin(th - 15.0 * r)));
  float a = cnOff(-px, px, r - 1.0) * (0.16 + 0.2 * threads * cnOn(0.2, 0.8, r)) + 0.4 * (cnOff(0.0, 1.5 * px, abs(r - 1.0)));
  return mix(col, cnDark, see * a);
}
// A drop that falls at x from one height to another.
vec3 cnDrip(vec3 col, vec2 p, float x, float from, float to, float fall, float light) {
  float y = mix(from, to, fall * fall), thin = cnOff(0.0005, 0.0005 + 1.4 * cnPx, abs(p.x - x));
  return mix(col, cnLit, sat(light) * thin * (cnOff(0.0, 0.01 + 0.03 * fall, abs(p.y - y))) * sat((1.0 - fall) * 5.0));
}
// The slow throw: gathered, opening, hanging, fallen, drawn in, gathered again.
vec4 cnPose(vec4 g, vec4 h, vec4 w, vec4 d, float t) {
  vec4 a = mix(g, h, cnOn(0.05, 0.26, t));
  a = mix(a, w, cnOn(0.66, 0.78, t));
  a = mix(a, d, cnOn(0.84, 0.95, t));
  return mix(a, g, cnOn(0.94, 1.0, t));
}
float cnMan(vec2 p) {
  float d = cnSeg(p, vec2(-0.008, 0.0), vec2(-0.002, 0.062), 0.007, 0.012);
  d = min(d, cnSeg(p, vec2(0.022, 0.0), vec2(0.008, 0.062), 0.007, 0.012));
  d = smin(d, cnSeg(p, vec2(0.001, 0.058), vec2(0.009, 0.122), 0.0165, 0.0185), 0.01);  // a loose shirt
  d = min(d, length(p - vec2(0.013, 0.155)) - 0.0125);
  vec2 h = rot(0.14) * (p - vec2(0.013, 0.163));  // the wide hat
  return min(d, max(abs(h.x) * 0.48 + h.y * 0.877 - 0.0245, -h.y - 0.003 + 1.2 * h.x * h.x));
}
// A long flat boat with somebody standing in it, at home round 0.
float cnBoat(vec2 p) {
  float u = abs((p.x + 0.12) / 0.44), bend = u * u * u * u;
  float hull = max(max(p.y - 0.022 - 0.042 * bend, -0.02 + 0.085 * bend * u - p.y), u * 0.44 - 0.44);
  return min(hull * 0.9, cnMan(p - vec2(0.02, 0.016)));
}
// The other boats: where, how far out, how large.
vec3 cnAfar(int i) { return i == 0 ? vec3(0.66, 0.052, 0.42) : i == 1 ? vec3(-0.47, 0.035, 0.36) : i == 2 ? vec3(-0.84, 0.07, 0.48) : vec3(0.62, 0.235, 0.78); }

// A ring of small splashes round a place on the water, as far out as grown.
float cnRing(vec2 e, float grown, float fine) {
  float r = length(e) - grown;
  return exp(-fine * r * r) * (0.25 + 0.75 * pow(0.5 + 0.5 * cos(40.0 * atan(e.y, e.x + 1e-5)), 3.0));
}
// What both pictures have on their water: the pad's colour, fish that flash for the keys, a ring for a hit.
vec3 cnOnWater(vec3 col, vec2 p, vec2 at) {
  float d = cnHz - p.y;
  if (d < 0.0) return col;
  float lie = noise(vec2(p.x * 1.6 - 0.02 * uTime, d * 9.0 / cnTilt + 0.013 * uTime));
  col = mix(col, col * (0.35 + uKind[1]), uPad * cnOn(0.35, 0.75, lie) * 0.6 * cnOn(0.0, 0.1, d));
  vec2 e = (p - at) / vec2(0.3, 0.051 * cnTilt);
  float o = length(e), ring = 0.75 + 0.9 * (1.0 - uHits);
  col = mix(col, cnLit, uHits * (0.95 * cnRing(e, ring, 160.0) + 0.42 * exp(-5.0 * (o - ring) * (o - ring))));
  col += 0.12 * uMic * sin(34.0 * o - 3.0 * uTime) * exp(-1.4 * o) * cnGlow;
  for (int i = 0; i < 3; i++) {
    float f = float(i);
    vec2 q = p - vec2(-0.32 + 0.36 * f + 0.02 * sin(uTime * 0.13 + f * 2.0), cnHz - (0.2 + 0.06 * mod(f * 1.7, 2.0)) * cnTilt);
    float fish = 0.4 * (length(q * vec2(1.0, 4.0)) - 0.032), wink = sin(uTime * 0.7 + f * 1.6);
    col = mix(col, cnLit, (cnFill(fish) + 0.4 * exp(-60.0 * max(fish, 0.0))) * 0.8 * uKeys * (0.4 + 0.6 * wink * wink));
  }
  return col;
}
vec3 cnThrown(vec2 p) {
  float rip;
  vec3 col = cnGround(p, rip);
  float t = fract(uTime / 45.0), sea = cnHz - 0.27 * cnTilt;
  vec2 boat = vec2(-0.6, cnHz - 0.31 * cnTilt + (0.003 + 0.003 * uLow) * sin(0.55 * uTime)), hand = boat + vec2(0.044, 0.115);
  float deep = exp2(-uOwn[4]), open = 1.0 + 0.2 * (uLevel - 0.4) / 0.6;
  vec4 A = cnPose(vec4(hand + vec2(0.004, -0.1), 0.028, 0.4), vec4(0.13, 0.1 + 0.01 * sin(uTime * 0.21), 0.34 * open, 0.52 + 0.13 * uOwn[4]), vec4(0.13, sea, 0.36 * open, 0.17 * cnTilt), vec4(-0.4, sea - 0.02, 0.05, 0.2), t);
  vec4 B = cnPose(vec4(-0.004, 0.1, 0.0, 1.0), vec4(-0.15 * deep, 0.02 + 0.02 * deep, -0.42 + 0.05 * sin(uTime * 0.17) + 0.12 * uPhrase, 1.0), vec4(-0.004, 0.006, 0.0, 1.0), vec4(-0.06, 0.06, 0.0, 1.0), t);
  float sunk = cnOn(0.77, 0.82, t) * cnOff(0.87, 0.92, t), air = max(A.y - sea, 0.0);
  // its shadow on the water, and the ring the small weights leave
  vec2 sh = vec2(A.x - 0.2 * air, sea - 0.14 * air * cnTilt);
  vec2 e = (p - sh) / (A.z * vec2(1.0, 0.17 * cnTilt));
  float net = cnOn(0.1, 0.2, A.z), soft = 0.08 + air;
  if (p.y < cnHz) {
    col = mix(col, col * (0.3 + 0.4 * cnMid), net * 0.62 * (cnOff(1.0 - soft, 1.0 + soft, length(e) + rip * 0.25)) * (1.0 - sunk));
    col = mix(col, cnLit, cnOn(0.755, 0.775, t) * cnOff(0.83, 0.92, t) * cnRing(e, 1.0 + 0.4 * cnOn(0.76, 0.9, t), 320.0));
  }
  col = cnOnWater(col, p, vec2(0.1, sea - 0.05));
  // the boats far out, and the cue's throw from one of them
  for (int i = 0; i < 4; i++) {
    float there = i == 0 ? cnOn(-1.0, -0.4, uOwn[2]) : cnOn(0.0, 0.8, uOwn[2]);
    vec3 f = cnAfar(i); float sc = f.z;
    vec2 at = vec2(f.x + 0.02 * sin(0.03 * uTravel + float(i) * 2.0), cnHz - f.y * cnTilt), q = (p - at) / sc;
    q.x = (i == 0 || i == 3) ? -q.x : q.x;
    if (i == 1 || i == 2) {
      float lift = 0.5 + 0.5 * sin(0.14 * uTime + 2.1 * float(i));
      col = cnVeil(col, p, at + sc * vec2(0.56, 0.16 + 0.2 * lift), sc * (0.28 + 0.14 * lift), -0.35, there * 0.9);
      col = mix(col, cnDark, 0.6 * there * cnLine(cnSeg(p, at + sc * vec2(0.05, 0.12), at + sc * vec2(0.4, 0.15 + 0.2 * lift), 0.0, 0.0), 0.0006));
    }
    bool under = q.y < -0.019;
    float k = cnPx / sc, dd = cnBoat(cnTwice(q, -0.019, rip * 0.04));
    col = mix(col, mix(cnDark, cnMid, max(0.0, 0.35 + 0.35 * cnFog + 3.0 * (0.052 - f.y))), there * cnOff(-0.5 * k, 0.5 * k, dd) * (under ? 0.5 * exp(q.y * 3.0) : 0.92));
  }
  float c = uCue, up = 4.0 * c * (1.0 - c);
  vec2 land = vec2(0.53, cnHz - 0.06 * cnTilt);
  if (c > 0.005) {
    float w = length((p - land) / vec2(1.0, 0.2 * cnTilt)) - 0.06 - 0.55 * (1.0 - c);
    if (p.y < cnHz) col = mix(col, cnLit, c * 0.7 * exp(-w * w * 900.0));
    col = cnVeil(col, p, land + vec2(0.0, 0.1 * c), 0.02 + 0.08 * cnOn(0.0, 0.7, up), -0.3 * c, cnOn(0.0, 0.3, up));
  }
  // the boat that threw
  vec2 q = p - boat;
  bool under = q.y < -0.019;
  q = cnTwice(q, -0.019, rip * 0.05);
  float rim = cnOn(-0.001, 0.002, cnBoat(q + vec2(0.0032, 0.0026)));
  col = mix(col, mix(cnDark, cnGlow, under ? 0.1 : 0.75 * rim), cnFill(cnBoat(q)) * (under ? 0.6 * exp(-2.0 * q.y) : 1.0));
  // the hand line, then the net
  vec2 crown = A.xy + B.xy; float rope = length(crown - hand);
  col = mix(col, cnDark, cnLine(cnBow(p, hand, crown, -0.09 * rope), 0.0011) * 0.85 * cnOn(0.01, 0.06, rope));
  float id = floor(p.x * 46.0), h = hash11(id + 7.0), u = (p.x - A.x) / max(A.z, 0.05);  // water runs off the skirt
  col = cnDrip(col, p, (id + 0.3 + 0.4 * h) / 46.0, A.y - A.z * A.w * sqrt(max(1.0 - u * u, 0.0)) - 0.8 * u * A.z * sin(B.z), sh.y, fract(uTime * 0.36 + h * 7.0), (0.4 + 0.8 * uTexture) * net * step(abs(u), 0.9) * cnOn(0.02, 0.1, air));
  return cnCast(col, p, A.xy, A.z, A.w, B.z, B.xy, (1.0 - 0.45 * cnOn(0.7, 0.77, t) * cnOff(0.86, 0.92, t)) * (1.0 - sunk * 0.97));
}

// One shore net: a square cloth under four bent poles, on a beam that tips over its post and is held by stones.
vec3 cnLift(vec3 col, vec2 p, vec2 post, float sc, float tip, float haze, float deep) {
  vec2 l = (p - post) / sc;
  if (abs(l.x + 0.23) > 1.0 || abs(l.y + 0.06) > 0.8) return col;
  float px = cnPx; cnPx /= sc;
  mat2 turn = rot(-tip);
  vec2 ap = turn * vec2(-0.58, 0.35), end = turn * vec2(0.31, -0.187);
  vec2 c = ap + vec2(0.01 * sin(0.4 * uTime + post.x * 9.0), -0.25);
  mat2 m = mat2(0.33, 0.015, 0.1, 0.085 * cnTilt);
  vec2 k = vec2(0.0, -0.15 * deep), one, two;
  vec3 dark = mix(cnDark, mix(cnLow, cnMid, 0.5), haze);
  float hit = cnRoots(l - c, m, k, 2.0, one, two);
  if (one.y < two.y) { vec2 h = one; one = two; two = h; }
  for (int i = 0; i < 2 && hit > 0.0; i++) {
    vec2 xy = i == 1 ? two : one;
    if (max(abs(xy.x), abs(xy.y)) > 1.08) continue;
    mat2 G, J = cnLay(xy, m, k, 2.0, G);
    vec2 edge = (1.0 - abs(xy)) / max(vec2(length(G[0]), length(G[1])), 1e-5);
    float e = min(edge.x, edge.y), inside = cnOn(-0.5, 0.5, e / cnPx), dense;
    float mesh = max(cnThreads(xy.x * 17.0, G[0] * 17.0, dense), cnThreads(xy.y * 17.0, G[1] * 17.0, dense));
    vec4 mus = piece(clamp(0.5 + 0.48 * xy * vec2(1.0, -1.0), 0.0, 1.0));
    vec3 cloth = mix(col, dark, inside * (i == 1 ? 0.2 : 0.14));
    cloth = cnStain(cloth, mus, 0.58 * inside * (1.0 - 0.6 * haze));
    cloth = mix(cloth, dark, mesh * inside * (i == 1 ? 0.75 : 0.4));
    col = mix(col, mix(cloth, dark, cnLine(abs(e), 0.0022) * step(-0.02, e)), hit);
  }
  float d = 1e3;
  for (int i = 0; i < 4; i++) {
    vec2 s = vec2(i < 2 ? -1.0 : 1.0, (i == 0 || i == 3) ? -1.0 : 1.0);
    d = min(d, cnBow(l, ap, c + m * s, s.x * (s.y > 0.0 ? 0.035 : 0.06)) - 0.0042);
  }
  d = min(d, cnSeg(l, end, 1.04 * ap, 0.0125, 0.006));
  d = min(d, cnSeg(l, vec2(0.0, 0.015), vec2(-0.06, -0.34), 0.009, 0.011));
  d = min(d, cnSeg(l, vec2(0.0, 0.015), vec2(0.06, -0.34), 0.009, 0.011));
  d = min(d, cnSeg(l, vec2(-0.2, -0.222), vec2(0.7, -0.222), 0.007, 0.007));
  for (int i = 0; i < 4; i++) {  // stones on ropes
    float f = float(i);
    vec2 a = end * (0.36 + 0.16 * f), b = a - vec2(0.0, 0.055 + 0.02 * mod(f, 2.0));
    d = min(d, min(cnSeg(l, a, b, 0.0016, 0.0016), length((l - b) * vec2(1.0, 0.85)) - 0.0155));
  }
  col = mix(col, dark, cnFill(d));
  cnPx = px;
  return col;
}
vec4 cnPlace(int i) { return i == 0 ? vec4(0.6, 1.0, 0.0, 0.0) : i == 1 ? vec4(-0.1, 0.5, 0.14, 0.3) : i == 2 ? vec4(-0.44, 0.31, 0.3, 0.62) : i == 3 ? vec4(-0.68, 0.2, 0.45, 0.0) : vec4(-0.82, 0.74, 0.06, 0.8); }
float cnHeron(vec2 p) {
  vec2 b = rot(0.5) * (p - vec2(0.0, 0.075));
  float d = (length(b / vec2(0.034, 0.0135)) - 1.0) * 0.0135;
  d = min(d, cnSeg(vec2(abs(p.x + 0.001), p.y), vec2(0.005, 0.0), vec2(0.003, 0.07), 0.0016, 0.002));
  d = min(d, cnBow(p, vec2(0.024, 0.088), vec2(0.026, 0.125), -0.012) - 0.0045);
  d = min(d, cnBow(p, vec2(0.026, 0.125), vec2(0.034, 0.152), 0.008) - 0.0036);
  return min(d, cnSeg(p, vec2(0.036, 0.153), vec2(0.076, 0.146), 0.0065, -0.001));
}
vec3 cnShore(vec2 p) {
  float rip;
  vec3 col = cnGround(p, rip);
  // a low far shore
  float land = 0.012 + 0.02 * noise(vec2(p.x * 13.0, 2.0)) + 0.02 * cnOn(0.1, 0.9, p.x);
  float sh = abs(p.y - cnHz) + (p.y < cnHz ? rip * 0.02 : 0.0);
  col = mix(col, mix(cnDark, mix(cnLow, cnMid, 0.5), 0.55 + 0.3 * cnFog), cnOff(land - 0.002, land + 0.002, sh) * (p.y < cnHz ? 0.35 : 0.8));
  float deep = exp2(uOwn[4]), up = 4.0 * uCue * (1.0 - uCue);
  float tip0 = -0.03 + 0.05 * sin(uTime * 0.13) + 0.16 * up;
  col = cnOnWater(col, p, vec2(0.07, cnHz - 0.24 * cnTilt));
  for (int i = 4; i >= 0; i--) {
    vec4 n = cnPlace(i);
    float there = i == 0 ? 1.0 : i < 4 ? cnOn(-1.0, -0.3, uOwn[2]) : cnOn(0.0, 0.9, uOwn[2]);
    float yw = cnHz - 0.215 * n.y * cnTilt;
    vec2 post = vec2(n.x, yw + 0.27 * n.y);
    float turn = fract(uTime / 48.0 + n.w), dip = cnOn(0.1, 0.3, turn) * cnOff(0.5, 0.72, turn);
    float tip = i == 0 ? tip0 : (i == 4 ? 0.2 : 0.6) * dip - 0.03 + (i == 1 ? 0.25 * uPhrase * (1.0 - dip) : 0.0);
    vec2 q = cnTwice(p, yw, rip * 0.035 * (0.4 + n.y));
    float side = i == 4 ? -1.0 : 1.0;  // the other bank
    q.x = post.x + side * (q.x - post.x);
    if (there > 0.01) col = mix(col, cnLift(col, q, post, n.y, tip, sat(n.z * (0.8 + cnFog)), deep), there * (p.y < yw ? 0.62 * exp((p.y - yw) * 1.4) : 1.0));
    vec2 c = n.y * (rot(-tip) * vec2(-0.58, 0.35) - vec2(0.0, 0.25));
    c = post + vec2(side * c.x, c.y);
    float wet = sat((yw + 0.06 * n.y - c.y + 0.14 * n.y) / (0.12 * n.y)), o = length((p - vec2(c.x, yw)) / (n.y * vec2(0.36, 0.06 * cnTilt)));
    if (p.y < cnHz) col = mix(col, cnGlow, there * wet * 0.6 * exp(-50.0 * (o - 1.0) * (o - 1.0)));
  }
  // the near cloth drips in sixteen places
  float yw = cnHz - 0.215 * cnTilt;
  vec2 c = vec2(0.6, yw + 0.02) + rot(-tip0) * vec2(-0.58, 0.35);
  float id = floor((p.x - c.x) / 0.036 + 8.0);
  float h = hash11(id + 3.0), mid = c.x + (id - 7.5) * 0.036 + 0.012 * (h - 0.5), u = (mid - c.x) / 0.33;
  col = cnDrip(col, p, mid, c.y - 0.11 * deep * (1.0 - 0.6 * u * u) - 0.03, yw - 0.03, fract(uTime * 0.32 + h * 5.0), step(abs(id - 7.5), 7.6) * (0.3 + 1.8 * uBands[int(clamp(id, 0.0, 15.0))] + 0.5 * uHits));
  // whoever minds the near one
  vec2 m = cnTwice(p, yw, rip * 0.04) - vec2(0.465, yw + 0.054);
  col = mix(col, cnDark, cnFill(0.75 * cnMan(m / 0.75)) * (p.y < yw ? 0.5 : 1.0));
  // a heron on an old post
  vec2 q = p - vec2(-0.34, cnHz - 0.27 * cnTilt);
  bool under = q.y < 0.0;
  q = cnTwice(q, 0.0, rip * 0.03);
  float d = min(cnSeg(q, vec2(0.0, -0.02), vec2(0.002, 0.052), 0.0085, 0.0075), cnHeron(q - vec2(0.002, 0.056)));
  col = mix(col, cnDark, cnFill(d) * (under ? 0.55 : 1.0));
  return col;
}
void cnMix(float w, vec3 t, vec3 m, vec3 l, vec3 g, vec3 d) {
  cnTop = mix(cnTop, t, w); cnMid = mix(cnMid, m, w); cnLow = mix(cnLow, l, w); cnGlow = mix(cnGlow, g, w); cnDark = mix(cnDark, d, w);
}
vec3 render(vec2 p) {
  bool a = uVar < 0.5;
  float fit = max(1.0, 1.45 * uRes.y / uRes.x), zoom = fit * exp2(-0.6 * uOwn[5]);
  cnPx = zoom / uRes.y;
  p = p * zoom + vec2(a ? -0.02 : 0.05, 0.0) * uOwn[5];
  cnTop = cnMid = cnLow = cnGlow = cnDark = vec3(0.0);
  if (a) cnMix(1.0, vec3(0.62, 0.67, 0.72), vec3(0.8, 0.81, 0.81), vec3(0.92, 0.87, 0.8), vec3(1.0, 0.89, 0.7), vec3(0.15, 0.14, 0.15));
  else cnMix(1.0, vec3(0.45, 0.45, 0.56), vec3(0.9, 0.66, 0.53), vec3(0.98, 0.79, 0.57), vec3(1.0, 0.86, 0.6), vec3(0.09, 0.06, 0.07));
  // the hour: a moonlit night one way, a red one the other
  cnMix(sat(-uOwn[0]), vec3(0.03, 0.05, 0.1), vec3(0.09, 0.14, 0.22), vec3(0.22, 0.29, 0.35), vec3(0.8, 0.86, 0.9), vec3(0.015, 0.02, 0.035));
  cnMix(sat(uOwn[0]), vec3(0.28, 0.16, 0.3), vec3(0.78, 0.3, 0.24), vec3(0.97, 0.56, 0.28), vec3(1.0, 0.82, 0.48), vec3(0.1, 0.03, 0.06));
  // the weather: white mist one way, a dark storm the other
  cnStorm = sat(uOwn[1]);
  float mist = sat(-uOwn[1]);
  cnMix(0.75 * cnStorm, vec3(0.16, 0.2, 0.23), vec3(0.34, 0.4, 0.41), vec3(0.74, 0.76, 0.68), vec3(0.86, 0.87, 0.76), vec3(0.06, 0.07, 0.08));
  vec3 pale = vec3(0.5 * dot(cnMid, vec3(0.33)) + 0.5 * cnMid + 0.06);
  cnMix(0.75 * mist, pale, pale * 1.03, pale * 1.05, min(pale * 1.14, 1.0), mix(cnDark, pale, 0.3));
  cnFog = sat(0.1 + 0.8 * mist + 0.25 * uDrone + 0.1 * uSpace - 0.15 * cnStorm);
  cnGlow = min(cnGlow * (0.97 + 0.08 * uTone + 0.06 * uLevel), 1.0);
  cnLit = min(cnGlow * 1.12, 1.0);
  cnHz = (a ? 0.05 : -0.06) + 0.19 * uOwn[3];
  cnTilt = 1.0 + 0.5 * uOwn[3];
  cnSun = a ? vec2(0.25, cnHz + 0.15 + 0.03 * uDrone) : vec2(-0.22, cnHz + 0.055 + 0.03 * uDrone);
  return a ? cnThrown(p) : cnShore(p);
}
