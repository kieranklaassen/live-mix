// name: Coloured shadows
// a: Hung branch
// b: Cut card
// what: A white wall lit by five lamps of five colours that together make white. A bare branch hangs before it, only its tip in the frame, and throws five shadows, each in the colour its lamp's absence leaves, darker where they cross; or hoops, combs and a disc of cut card on threads, whose shadows cross in hard interlaced fans.
// follows: Each kind of sound is a lamp: as it sounds its own shadow deepens and sharpens and its light fills the others. Low draws things nearer the wall, texture and high stir the twigs, the mix deepens the colours. A hit flares one lamp and swings its shadow; a cue clears every edge and sways what hangs. The loop walks the lamps, Space spreads them, Tone sharpens.
// own: 0 what hangs: 1 a a bough in broad leaf, b strings of turning discs, -1 a tall grass, b a lattice of laths; 1 1 many and fine (a blossom at each tip, b teeth doubled, hoops ringed), -1 few and bold; 2 1 lamps far apart, -1 close together; 3 the ground: 1 a dark room lit only through what hangs, -1 a wall painted in the drone's colour; 4 1 soft, -1 drawn in outline; 5 1 they lie on a floor going away, -1 on hanging cloth; 6 1 a wall of rough blocks, -1 a wall of round beads; 7 1 a strong wind, -1 they lie under moving water with a net of light over them
vec2 fsD[5];    // how far each lamp throws a shadow aside for each step away from the wall
vec3 fsC[5];    // each lamp's light, all five together the white of the wall
float fsPen[5]; // how soft each lamp's shadows get with distance
vec2 fsO;       // the lamp in hand: its aside and
float fsS;      // its softness
float fsPx, fsNear;
float fsLeaf, fsBloom; // how broad the leaves are, and the flowers
vec2 fsHill;    // which way the wall leans just here, and
float fsDeep;   // how much further back it stands
float fsAll;    // 1 when drone, pad, texture and phrase all sound at their fullest

void fsLamp(int k, vec2 at, float base, vec3 c, float lv) {
  float an = TAU * uLoop + float(k) * 1.256;
  if (uOwn[2] != 0.0) at *= exp2(uOwn[2] * (uOwn[2] > 0.0 ? 0.9 : 1.7));
  fsD[k] = at * (0.8 + 0.4 * uSpace) + 0.05 * vec2(cos(an), sin(an)) + 0.03 * sin(uTime * vec2(0.071, 0.053) + float(k) * 2.4);
  c *= c;
  c /= max(dot(c, vec3(0.333)), 0.02);
  c = max(mix(vec3(1.0), c, 0.55 + 0.4 * lv + 0.45 * uCue * (1.0 - lv)), 0.02);
  fsC[k] = c * base * (0.5 + (0.5 + 0.7 * uEnergy) * lv);
  fsPen[k] = (0.04 - 0.02 * sqrt(lv)) * (1.0 - 0.6 * uCue) * (1.3 - 0.6 * uTone) * (0.8 + 0.4 * uSpace);
  fsPen[k] *= 1.0 + (3.5 + 3.5 * uVar) * max(uOwn[4], 0.0);
}
void fsLamps() {
  fsAll = smoothstep(0.75, 1.0, 0.25 * (uDrone + uPad + uTexture + uPhrase));
  float kick = 4.0 * uHits * (1.0 - uHits);
  fsLamp(0, mix(vec2(-1.45, -0.36), vec2(-1.25, -0.10), uVar), 0.80, uKind[2], uTexture);
  fsLamp(1, mix(vec2(-0.75, -0.27), vec2(-0.62, -0.22), uVar), 1.05, uKind[0], uDrone);
  fsLamp(2, vec2(0.28, -0.2) * kick, 0.70, uKind[4], sat(uHits + 0.5 * fsAll));
  fsLamp(3, mix(vec2(0.55, 0.52), vec2(0.60, 0.12), uVar), 0.92, uKind[1], sat(uPad + 0.5 * uMic));
  fsLamp(4, mix(vec2(0.86, 1.20), vec2(1.10, 0.48), uVar), 0.80, uKind[3], sat(uPhrase + 0.5 * uKeys));
  vec3 sum = fsC[0] + fsC[1] + fsC[2] + fsC[3] + fsC[4];
  sum = mix(vec3(dot(sum, vec3(0.333))), sum, 0.95);
  for (int k = 0; k < 5; k++) fsC[k] /= sum;
}
// How much of a band of half width w is seen at d from its middle, blurred by s.
float fsStrip(float d, float w, float s) { return smoothstep(-s, s, d + w) - smoothstep(-s, s, d - w); }

// ---- the branch: each joint has its place in the middle lamp's shadow, its distance from the wall, its thickness
vec4 fsJ0, fsJ1, fsJ2, fsJ3, fsJ4, fsJ5, fsJ6, fsJ7, fsA1, fsA2, fsA3, fsB1, fsB2, fsB3, fsB4, fsB5, fsE1, fsE2, fsE3, fsG1, fsG2, fsG3, fsT1, fsT2, fsT3, fsS1, fsS2;
vec3 fsTurn;
// The branch turns about its own length, so that side twigs come forward and go back, and sways from where it hangs.
vec4 fsJ(float u, float v, float z, float w) {
  float ax = 0.0025 - 0.625 * u, az = 0.296 + 0.366 * u, dv = v - ax, e = (z - az) * 1.67;
  vec2 q = vec2(u + 0.98, ax - 0.66 + fsTurn.x * dv - fsTurn.y * e);
  z = max(az + (fsTurn.y * dv + fsTurn.x * e) * 0.6, 0.0) * fsNear;
  if (uOwn[1] < 0.0) w *= 1.0 - uOwn[1] * 1.7 * smoothstep(0.004, 0.011, w);
  return vec4(q.x - 0.98 - fsTurn.z * q.y, q.y + 0.66 + fsTurn.z * q.x, z, w);
}
// A twig's end, which stirs.
vec4 fsK(float u, float v, float z, vec2 stir) {
  vec4 j = fsJ(u, v, z, 0.0031);
  j.xy += stir;
  return j;
}
void fsBranch() {
  float turn = 0.28 * sin(uTime * 0.031) + 0.03 * sin(uTime * 0.23);
  fsTurn = vec3(cos(turn), sin(turn), 0.015 * sin(uTime * 0.17) + 0.28 * uCue * (1.0 - uCue));
  vec4 st = (0.002 + 0.014 * sat(uTexture + 0.5 * uHigh)) * sin(uTime * vec4(0.9, 1.13, 0.71, 1.31) + vec4(0.0, 2.0, 4.0, 1.0));
  fsJ0 = fsJ(-0.98, 0.66, -0.06, 0.024); fsJ1 = fsJ(-0.70, 0.44, 0.045, 0.018); fsJ2 = fsJ(-0.48, 0.20, 0.155, 0.0135); fsJ3 = fsJ(-0.30, 0.16, 0.20, 0.0115);
  fsJ4 = fsJ(-0.07, 0.07, 0.27, 0.0098); fsJ5 = fsJ(0.06, -0.10, 0.34, 0.0086); fsJ6 = fsJ(0.24, -0.16, 0.395, 0.0062); fsJ7 = fsJ(0.43, -0.26, 0.45, 0.0038);
  fsA1 = fsJ(-0.57, 0.22, 0.15, 0.0086); fsA2 = fsK(-0.66, -0.04, 0.30, st.xy); fsA3 = fsK(-0.45, 0.02, 0.26, st.zw);
  fsB1 = fsJ(-0.15, 0.29, 0.22, 0.0086); fsB2 = fsJ(0.12, 0.27, 0.30, 0.0062); fsB3 = fsK(0.36, 0.36, 0.34, st.xw); fsB4 = fsK(0.29, 0.14, 0.37, st.zy); fsB5 = fsK(0.00, 0.45, 0.17, st.yx);
  fsE1 = fsJ(-0.10, -0.12, 0.38, 0.0070); fsE2 = fsK(-0.27, -0.33, 0.48, st.wz); fsE3 = fsK(-0.02, -0.35, 0.45, st.xy);
  fsG1 = fsJ(0.33, 0.00, 0.39, 0.0060); fsG2 = fsK(0.58, 0.04, 0.42, st.zw); fsG3 = fsK(0.40, 0.15, 0.34, st.yz);
  fsT1 = fsK(0.21, -0.38, 0.47, st.wx); fsT2 = fsK(0.62, -0.22, 0.46, st.xz); fsT3 = fsK(0.50, -0.40, 0.47, st.yw);
  fsS1 = fsK(-0.35, 0.06, 0.24, st.zx); fsS2 = fsK(0.36, -0.12, 0.43, st.wy);
}
// A joint in the shadow of the lamp in hand: where it falls, how thick it still looks so soft, and how sharp it is.
vec4 fsP(vec4 j) {
  float s = fsPx + fsS * j.z * (0.45 + 1.7 * j.z);
  return vec4(j.xy + fsO * j.z, j.w - 0.7 * s * s / (j.w + s), 1.0 / s);
}
// How far outside a length of wood, in widths of its blur: -1 in full shadow, 1 in full light.
float fsSeg(vec2 p, vec4 a, vec4 b) {
  vec2 d = b.xy - a.xy;
  vec4 m = mix(a, b, sat(dot(p - a.xy, d) / (dot(d, d) + 1e-5)));
  return (length(p - m.xy) - m.z) * m.w;
}
// The small crooks of the wood, the same for each lamp's shadow.
vec2 fsBark(vec2 p) {
  vec2 q = p - 0.28 * fsO;
  q = q * vec2(17.0, 21.0) + 1.3 * sin(q.yx * vec2(11.0, 8.0) + 1.0);
  return p + 0.0065 * sin(q.yx) + 0.0022 * sin(q * 3.1 + q.yx);
}
// A twig, with a bud at its end.
float fsTwig(vec2 p, vec4 a, vec4 b) {
  vec2 d = b.xy - a.xy;
  float h = sat(dot(p - a.xy, d) / (dot(d, d) + 1e-5)), e = h * h;
  vec4 m = mix(a, b, h);
  e *= e; e *= e;
  if (uOwn[0] > 0.0 || uOwn[1] > 0.0) {
    vec2 v = p - b.xy;
    float r = length(v), x = v.x / (r + 1e-4), y = x * x;
    float leaf = h * (1.0 - h) * 4.0;
    leaf = fsLeaf * leaf * (0.55 + 0.45 * leaf) * (1.15 - 0.5 * h);
    float t = (length(p - m.xy) - m.z - leaf - 0.0034 * e * e) * m.w;
    vec2 w = p - mix(a.xy, b.xy, 0.4);
    float u = length(w), xx = w.y / (u + 1e-4), yy = xx * xx;
    t = min(t, (u - 0.75 * fsBloom * (0.62 + 0.38 * sqrt(sat(0.5 + 0.5 * xx * (16.0 * yy * yy - 20.0 * yy + 5.0)))) - 0.001) * b.w);
    return min(t, (r - fsBloom * (0.62 + 0.38 * sqrt(sat(0.5 + 0.5 * x * (16.0 * y * y - 20.0 * y + 5.0)))) - 0.001) * b.w);
  }
  return (length(p - m.xy) - m.z - 0.0034 * e * e) * m.w;
}
// A field of tall grass in one plane before the wall.
float fsBlades(vec2 p, float z, float seed) {
  p += fsO * z;
  float many = 6.5 * exp2(uOwn[1] * 1.1), s = (fsPx + fsS * z * (0.45 + 1.7 * z)) * many, c = 0.0;
  vec2 q = vec2(p.x * many, p.y);
  float id0 = floor(q.x);
  for (int i = -1; i <= 1; i++) {
    float id = id0 + float(i), h1 = hash11(id + seed), h2 = hash11(id * 1.7 + seed + 9.3);
    float top = -0.22 + 0.66 * h1 + 0.1 * h2, y = (q.y + 0.75) / (top + 0.75);
    float lean = (h2 - 0.5) * 1.5 + (0.04 + 0.12 * uTexture) * sin(uTime * (0.5 + 0.4 * h1) + h2 * 20.0);
    float x = q.x - id - 0.5 - 0.5 * (h1 - 0.5) - lean * y * y;
    float w = (0.085 + 0.07 * h2) * sat(1.0 - y) * (0.4 + y);
    float head = step(0.45, h2) * max(1.0 - pow((y - 0.9) / 0.13, 2.0), 0.0);
    w = max(w, head * (0.07 + 0.06 * h1)) - 0.5 * s * smoothstep(0.98, 1.06, y);
    c = max(c, fsStrip(x, max(w, 0.0), s) * smoothstep(1.08, 1.0, y));
  }
  return c;
}
float fsTree(vec2 p) {
  vec4 j1 = fsP(fsJ1), j2 = fsP(fsJ2), j3 = fsP(fsJ3), j4 = fsP(fsJ4), j5 = fsP(fsJ5), j6 = fsP(fsJ6), j7 = fsP(fsJ7);
  float t = min(min(min(fsSeg(p, fsP(fsJ0), j1), fsSeg(p, j1, j2)), min(fsSeg(p, j2, j3), fsSeg(p, j3, j4))), min(min(fsSeg(p, j4, j5), fsSeg(p, j5, j6)), fsSeg(p, j6, j7)));
  vec4 g = fsP(fsA1);
  t = min(t, min(fsSeg(p, j1, g), min(fsTwig(p, g, fsP(fsA2)), fsTwig(p, g, fsP(fsA3)))));
  g = fsP(fsB1);
  t = min(t, min(fsSeg(p, j3, g), fsTwig(p, g, fsP(fsB5))));
  vec4 h = fsP(fsB2);
  t = min(t, min(fsSeg(p, g, h), min(fsTwig(p, h, fsP(fsB3)), fsTwig(p, h, fsP(fsB4)))));
  g = fsP(fsE1);
  t = min(t, min(fsSeg(p, j4, g), min(fsTwig(p, g, fsP(fsE2)), fsTwig(p, g, fsP(fsE3)))));
  g = fsP(fsG1);
  t = min(t, min(fsSeg(p, j5, g), min(fsTwig(p, g, fsP(fsG2)), fsTwig(p, g, fsP(fsG3)))));
  t = min(t, min(min(fsTwig(p, j6, fsP(fsT1)), fsTwig(p, j3, fsP(fsS1))), min(fsTwig(p, j7, fsP(fsT2)), fsTwig(p, j7, fsP(fsT3)))));
  t = min(t, fsTwig(p, j6, fsP(fsS2)));
  return 1.0 - smoothstep(-1.0, 1.0, t);
}
// The branch's own tip, before the wall, where it comes into the frame from above.
float fsTip(vec2 p) {
  fsS = 0.004;
  p.y -= 0.5 * max(0.3 - p.x, 0.0);                // it comes down into the frame
  vec4 j4 = fsP(fsJ4), j5 = fsP(fsJ5), j6 = fsP(fsJ6), j7 = fsP(fsJ7);
  float t = min(min(fsSeg(p, j4, j5), fsSeg(p, j5, j6)), min(fsSeg(p, j6, j7), fsTwig(p, j6, fsP(fsT1))));
  t = min(t, min(min(fsTwig(p, j7, fsP(fsT2)), fsTwig(p, j7, fsP(fsT3))), fsTwig(p, j6, fsP(fsS2))));
  return 1.0 - smoothstep(-1.0, 1.0, t);
}

// ---- the cut card: flat shapes hung at a tilt, each with its middle and its two half lengths
vec2 fsF1, fsF2, fsF3;         // the turning of each
vec2 fsG;                      // how fast the card's own measures run over the wall, across and along
// A place on the wall as the card's own: across, along, and its distance from the wall.
vec3 fsIn(vec2 p, vec3 at, vec3 a, vec3 b) {
  vec2 c = at.xy + fsO * at.z, A = a.xy + fsO * a.z, B = b.xy + fsO * b.z, q = p - c;
  float det = A.x * B.y - A.y * B.x;
  det = abs(det) < 1e-3 ? 1e-3 : det;
  fsG = vec2(length(B), length(A)) / abs(det);
  q = vec2(q.x * B.y - q.y * B.x, A.x * q.y - A.y * q.x) / det;
  return vec3(q, max(at.z + q.x * a.z + q.y * b.z, 0.0));
}
float fsHoop(vec2 p, vec3 at, vec3 a, vec3 b, float w) {
  vec3 q = fsIn(p, at, a, b);
  float r = max(length(q.xy), 1e-3), g = length(q.xy / r * fsG);
  return fsStrip(r - 1.0, w, g * (fsPx + fsS * q.z));
}
float fsComb(vec2 p, vec3 at, vec3 a, vec3 b, float n) {
  vec3 q = fsIn(p, at, a, b);
  vec2 s = fsG * (fsPx + fsS * q.z);
  if (abs(q.x) > 1.0 + s.x || q.y < -0.1 - s.y || q.y > 1.0 + s.y) return 0.0;
  float x = (fract(q.x * n * 0.5 + 0.5) - 0.5) * 2.0 / n;
  float w = (0.62 - 0.4 * sat(q.y)) / n;
  float teeth = fsStrip(x, w, s.x) * fsStrip(q.y - 0.5, 0.5, s.y);
  if (uOwn[1] > 0.0 || uOwn[4] != 0.0) teeth *= fsStrip(q.x, 1.0, s.x);
  float spine = fsStrip(q.y + 0.01, 0.045, s.y) * fsStrip(q.x, 1.0, s.x);
  return max(teeth, spine);
}
// A thread from at straight up out of the frame.
float fsThread(vec2 p, vec3 at) {
  vec2 c = at.xy + fsO * at.z;
  float s = fsPx + fsS * at.z;
  return fsStrip(p.x - c.x, 0.0012, s) * smoothstep(-s, s, p.y - c.y);
}
// The same hoops, combs and disc, more of them or fewer.
float fsCards2(vec2 p) {
  float more = max(uOwn[1], 0.0), few = max(-uOwn[1], 0.0), big = 1.0 + 0.75 * few;
  vec3 h1 = vec3(mix(-0.38, -0.2, few), mix(0.07, 0.0, few), 0.17 * fsNear), d1 = vec3(mix(0.48, 0.36, few), mix(-0.25, -0.1, few), 0.12 * fsNear), q;
  float c = fsHoop(p, h1, big * vec3(0.28 * fsF1.x, 0.0, 0.10 * fsF1.y), big * vec3(0.02, 0.27, -0.03), 0.075);
  q = fsIn(p, h1, big * vec3(0.28 * fsF1.x, 0.0, 0.10 * fsF1.y), big * vec3(0.02, 0.27, -0.03));
  float r = max(length(q.xy), 1e-3), g = length(q.xy / r * fsG) * (fsPx + fsS * q.z);
  if (more > 0.0) c = max(c, fsStrip(fract(r * 6.0) - 0.5, 0.24 * more, g * 6.0) * (1.0 - smoothstep(0.9, 0.9 + g, r)) * more);
  c = max(c, fsHoop(p, h1, big * vec3(0.15 * fsF2.x, 0.0, 0.10 * fsF2.y), big * vec3(0.0, 0.15, 0.02), 0.1) * (1.0 - more));
  q = fsIn(p, d1, big * vec3(0.13 * fsF3.x, 0.0, 0.08 * fsF3.y), big * vec3(0.0, 0.13, 0.02));
  r = max(length(q.xy), 1e-3); g = length(q.xy / r * fsG) * (fsPx + fsS * q.z);
  float d = 1.0 - smoothstep(-g, g, r - 1.0);
  if (more > 0.0) d *= 1.0 - more * fsStrip(fract(r * 4.0) - 0.5, 0.22, g * 4.0);
  c = max(c, d);
  if (few < 1.0) {
    float n = 1.0 + more;
    c = max(c, fsComb(p, vec3(0.30, 0.37, 0.05), vec3(0.30, 0.04, 0.0), vec3(0.04, -0.40, 0.34 * fsNear), 9.0 * n) * (1.0 - few));
    c = max(c, fsComb(p, vec3(-0.22, -0.43, 0.05), vec3(-0.22, -0.02, 0.0), vec3(0.02, 0.24, 0.22 * fsNear), 7.0 * n) * (1.0 - few));
  }
  return max(c, max(fsThread(p, h1 + big * vec3(0.02, 0.27, -0.03)), fsThread(p, d1 + big * vec3(0.0, 0.13, 0.02))));
}
float fsCards(vec2 p) {
  if (uOwn[1] != 0.0) return fsCards2(p);
  vec3 h1 = vec3(-0.38, 0.07, 0.17 * fsNear), d1 = vec3(0.48, -0.25, 0.12 * fsNear);
  float c = fsHoop(p, h1, vec3(0.28 * fsF1.x, 0.0, 0.10 * fsF1.y), vec3(0.02, 0.27, -0.03), 0.075);
  c = max(c, fsHoop(p, h1, vec3(0.15 * fsF2.x, 0.0, 0.10 * fsF2.y), vec3(0.0, 0.15, 0.02), 0.1));
  vec3 q = fsIn(p, d1, vec3(0.13 * fsF3.x, 0.0, 0.08 * fsF3.y), vec3(0.0, 0.13, 0.02));
  float r = max(length(q.xy), 1e-3), g = length(q.xy / r * fsG) * (fsPx + fsS * q.z);
  c = max(c, 1.0 - smoothstep(-g, g, r - 1.0));
  c = max(c, fsComb(p, vec3(0.30, 0.37, 0.05), vec3(0.30, 0.04, 0.0), vec3(0.04, -0.40, 0.34 * fsNear), 9.0));
  c = max(c, fsComb(p, vec3(-0.22, -0.43, 0.05), vec3(-0.22, -0.02, 0.0), vec3(0.02, 0.24, 0.22 * fsNear), 7.0));
  return max(c, max(fsThread(p, h1 + vec3(0.02, 0.27, -0.03)), fsThread(p, d1 + vec3(0.0, 0.13, 0.02))));
}

// Strings of turning discs in one plane.
float fsBeads(vec2 p, float z, float seed) {
  p -= fsO * z;
  float many = 3.1 * exp2(uOwn[1] * 0.95), s = min((fsPx + fsS * z) * many, 0.14);
  vec2 q = p * many;
  float col = floor(q.x), h1 = hash11(col + seed);
  q.y += h1 * 7.0;
  float row = floor(q.y), h2 = hash21(vec2(col, row) + seed), h3 = fract(h2 * 37.7);
  vec2 v = vec2(fract(q.x) - 0.5 - 0.16 * (h1 - 0.5), fract(q.y) - 0.5);
  float r = 0.12 + 0.26 * h2, turn = h3 * 6.3 + uTime * (0.12 + 0.1 * h1) + 1.5 * uCue * (1.0 - uCue);
  float thin = 0.02 + 0.2 * max(-uOwn[4], 0.0), wide = sqrt(thin + (1.0 - thin) * cos(turn) * cos(turn));
  vec2 e = vec2(v.x / wide, v.y);
  float l = length(e), c = 1.0 - smoothstep(-s, s, (l - r) * mix(wide, 1.0, abs(v.y) / (length(v) + 1e-3)));
  float moon = smoothstep(0.55, 0.6, h3);                          // some are crescents
  c *= 1.0 - moon * (1.0 - smoothstep(-s, s, length(e - vec2(0.36 * r, 0.2 * r)) - 0.82 * r));
  return max(c, fsStrip(v.x, 0.004 * many / 3.1, s) * (0.9 + 0.8 * min(uOwn[4], 0.0)));
}
// A lattice of crossed laths, hung a little aslant.
float fsLaths(vec2 p) {
  float tilt = 0.10 * sin(uTime * 0.041) + 0.3 * uCue * (1.0 - uCue);
  vec3 q = fsIn(p, vec3(0.0, 0.02, 0.17 * fsNear), vec3(0.95, 0.06, 0.1 + tilt), vec3(-0.03, 0.62, -0.1));
  vec2 s = fsG * (fsPx + fsS * q.z);
  vec2 n = vec2(3.0, 2.0) * exp2(uOwn[1]), d = (fract(q.xy * n + 0.5) - 0.5) / n;
  float c = max(fsStrip(d.x, 0.05 * 3.0 / n.x, s.x), fsStrip(d.y, 0.045 * 2.0 / n.y, s.y));
  return max(c, 0.0);
}
// How the wall stands here: its lean, its depth and what it takes of the light. p is drawn to a bead's middle.
vec3 fsWall(inout vec2 p) {
  vec3 take = vec3(1.0);
  fsHill = vec2(0.0); fsDeep = 0.0;
  if (uOwn[5] < 0.0) {                               // cloth in long folds
    float y = p.y + 0.06 * sin(uTime * 0.11 + p.x), x = p.x + 0.03 * sin(y * 4.0 + p.x * 5.0 + uTime * 0.09) + 0.05 * y * sin(p.x * 3.0);
    float a = x * 29.0, b = x * 12.3 + 1.0;
    fsHill += uOwn[5] * vec2(0.36 * cos(a) + 0.34 * cos(b), 0.0);
    fsDeep += -uOwn[5] * 0.04 * (0.6 * sin(a) + sin(b));
    take *= mix(1.0, (0.78 + 0.13 * (0.6 * sin(a) + sin(b))) * (0.97 + 0.06 * noise(p * vec2(220.0, 60.0))), -uOwn[5]);
  }
  if (uOwn[6] > 0.0) {                               // rough blocks in courses
    vec2 q = p / vec2(0.36, 0.17);
    float row = floor(q.y);
    q.x += 0.5 * mod(row, 2.0) + 0.24 * hash11(row + 3.0);
    vec2 id = vec2(floor(q.x), row), f = fract(q) - 0.5, w = p * 26.0 + id * 3.7;
    vec2 j = (0.5 - abs(f)) * vec2(0.36, 0.17) + 0.005 * (noise(p * 40.0) - 0.5);
    vec2 in_ = smoothstep(vec2(0.0), vec2(0.011), j), lip = smoothstep(vec2(0.03), vec2(0.0), j) * sign(f);
    float n0 = noise(w) + 0.5 * noise(w * 2.7), nx = noise(w + vec2(0.3, 0.0)) + 0.5 * noise(w * 2.7 + vec2(0.8, 0.0)), ny = noise(w + vec2(0.0, 0.3)) + 0.5 * noise(w * 2.7 + vec2(0.0, 0.8));
    fsHill += uOwn[6] * (vec2(n0 - nx, n0 - ny) * 0.8 - 0.5 * lip);
    fsDeep += uOwn[6] * 0.06 * (hash21(id + 7.0) - 0.5);
    take *= mix(1.0, (0.66 + 0.34 * in_.x * in_.y) * (0.86 + 0.16 * hash21(id)) * (0.84 + 0.18 * n0), uOwn[6]);
  }
  if (uOwn[6] < 0.0) {                               // round beads set close
    const float cell = 0.025;
    vec2 q = vec2(p.x / cell, p.y / (cell * 0.866));
    float row = floor(q.y);
    q.x += 0.5 * mod(row, 2.0);
    vec2 f = fract(q) - 0.5;
    f.y *= 0.866;
    float r = length(f), in_ = smoothstep(0.43, 0.39, r), rise = sqrt(max(0.1849 - r * r, 0.0));
    fsHill += uOwn[6] * f * 1.1 * in_;
    take *= mix(1.0, 0.34 + in_ * (0.12 + 1.15 * rise - 0.5 * f.x + 0.6 * f.y + 0.5 * smoothstep(0.14, 0.02, length(f - vec2(-0.14, 0.16)))), -uOwn[6]);
    p -= f * cell * -uOwn[6] * 0.85;
  }
  return take;
}
// Every shadow of the lamp in hand, for the worlds where other things hang.
float fsHung(vec2 p, float c) {
  if (uOwn[0] != 0.0) {
    float o = 0.0, way = abs(uOwn[0]);
    if (uVar < 0.5) {
      if (uOwn[0] < 0.0) { o = max(fsBlades(p, 0.14, 3.0), fsBlades(p, 0.34, 40.0)); c = mix(c, 0.0, smoothstep(0.3, 0.9, way)); c = max(c, o * smoothstep(0.1, 0.7, way)); }
    } else {
      o = uOwn[0] > 0.0 ? max(fsBeads(p, 0.07, 3.0), fsBeads(p, 0.2, 50.0)) : fsLaths(p);
      c = max(c * (1.0 - smoothstep(0.3, 0.9, way)), o * smoothstep(0.1, 0.7, way));
    }
  }
  return c;
}

// What the lamp in hand adds to the wall where a share c of it is kept off.
vec3 fsLight(vec2 p, int k, float c) {
  if (uOwn[4] < 0.0) c = mix(c, min(4.4 * c * (1.0 - c), 1.0), -uOwn[4]);
  vec3 lean = vec3(1.0);
  if (uOwn[5] < 0.0 || uOwn[6] != 0.0) lean = vec3(max(1.0 + dot(fsHill, fsO) * 0.55, 0.06));
  if (uOwn[3] > 0.0) return fsC[k] * lean * mix(1.0 - c, mix(2.6, uOwn[0] > 0.0 ? 1.6 - 0.6 * uOwn[0] : 1.6, uVar) * c + 0.03, uOwn[3]) / (1.0 + (0.13 + 0.22 * fsAll) * dot(p, p));
  p += fsO * vec2(0.5, 0.3);
  if (uOwn[5] < 0.0 || uOwn[6] != 0.0) return fsC[k] * lean * (1.0 - c) / (1.0 + (0.13 + 0.22 * fsAll) * dot(p, p));
  return fsC[k] * (1.0 - c) / (1.0 + (0.13 + 0.22 * fsAll) * dot(p, p));
}
vec3 render(vec2 p) {
  fsPx = 1.0 / uRes.y;
  fsNear = 1.0 - 0.1 * uLow;
  fsLamps();
  vec2 was = p;
  vec3 take = vec3(1.0);
  float far = 0.0;
  fsLeaf = 0.05 * max(uOwn[0], 0.0); fsBloom = 0.036 * max(uOwn[1], 0.0);
  if (uOwn[5] > 0.0) {                               // a floor going away
    float z = 0.6 / max(0.66 - p.y, 0.12);
    vec2 q = vec2(p.x * z, 0.72 * (z - 1.0) - 0.08);
    p = mix(p, q, uOwn[5]);
    fsPx *= mix(1.0, z, uOwn[5]);
    far = uOwn[5] * smoothstep(1.0, 4.6, z);
  }
  take = fsWall(p);
  if (uOwn[4] < 0.0) fsPx *= 1.0 - 0.9 * uOwn[4];
  if (uOwn[7] > 0.0) {                               // a wind
    float h = uVar < 0.5 && uOwn[0] < 0.0 ? 0.0 : 1.0;
    float up = mix(p.y + 0.5, 0.6 - p.y, h), gust = 0.7 + 0.3 * sin(uTime * 0.31) + 0.2 * sin(uTime * 0.53 + 1.0);
    p.x -= uOwn[7] * (0.75 * gust * up * up + 0.022 * up * sin(up * 7.0 - uTime * 1.3 + p.x * 2.0));
  }
  if (uOwn[7] < 0.0) {                               // water over it all, and the net of light it throws
    vec2 w = p * 4.2 + 0.35 * vec2(sin(p.y * 9.0 + uTime * 0.4), sin(p.x * 8.0 - uTime * 0.35));
    float n1 = noise(vec3(w, uTime * 0.22)), n2 = noise(vec3(w.yx * 1.9 + 7.0, uTime * 0.3 + 20.0));
    float net = 0.75 * exp(-abs(n1 - 0.5) * 11.0) + 0.6 * exp(-abs(n2 - 0.5) * 8.0);
    take *= mix(vec3(1.0), vec3(0.7 + (0.4 + 0.2 * uHigh) * net), -uOwn[7]);
    p += -uOwn[7] * 0.028 * vec2(sin(p.y * 13.0 + uTime * 0.7 + 2.0 * sin(p.x * 5.0)), sin(p.x * 11.0 - uTime * 0.6 + 2.0 * sin(p.y * 6.0 + 1.0)));
  }
  int na = uVar > 0.5 ? 0 : 5, nb = 5 - na;       // a loop of none is the cheapest way round the other picture
  vec3 lin = vec3(0.0);
  if (nb > 0) {
    vec3 an = vec3(0.9, 0.6, 0.4) * sin(uTime * vec3(0.037, 0.051, 0.043) + vec3(0.6, 2.0, 4.0)) + 4.0 * uCue * (1.0 - uCue) * vec3(0.3, -0.4, 0.5);
    fsF1 = vec2(cos(an.x), sin(an.x)); fsF2 = vec2(cos(an.y), sin(an.y)); fsF3 = vec2(cos(an.z), sin(an.z));
  }
  for (int k = 0; k < nb; k++) {
    fsO = fsD[k]; fsS = fsPen[k] * 0.4;
    vec2 q = p + fsO * fsDeep;
    lin += fsLight(p, k, fsHung(q, uOwn[0] == 0.0 || abs(uOwn[0]) < 0.9 ? fsCards(q) : 0.0));
  }
  float tip = 0.0;
  for (int k = 0; k < na; k += 5) { fsBranch(); fsO = vec2(0.0, 1.67); tip = fsTip(fsBark(was)); }
  if (uOwn[0] < 0.0) tip *= 1.0 - smoothstep(0.3, 0.9, -uOwn[0]);
  for (int k = 0; k < na; k++) {
    fsO = fsD[k]; fsS = fsPen[k];
    vec2 q = p + fsO * fsDeep;
    lin += fsLight(p, k, fsHung(q, uOwn[0] > -0.9 ? fsTree(fsBark(q)) : 0.0));
  }
  if (uOwn[5] < 0.0 || uOwn[6] != 0.0 || uOwn[7] < 0.0) lin *= take;
  if (far > 0.0) lin *= 1.0 - 0.8 * far;
  if (uOwn[3] < 0.0) lin *= mix(vec3(1.0), (0.05 + 0.85 * uKind[0] * uKind[0] + 0.25 * uKind[0]) * (1.7 / (1.0 + 1.1 * dot(was - vec2(-0.1, 0.1), was - vec2(-0.1, 0.1)))), -uOwn[3]);
  // plaster
  float tex = noise(p * 190.0) * 0.5 + noise(p * 41.0) * 0.5 - 0.5;
  lin = (lin * (1.0 + 0.015 * uLevel + 0.06 * fsAll) + 0.03 * (1.0 - 0.75 * abs(uOwn[3])) * vec3(1.0, 0.8, 0.9)) * 0.975 * (1.0 + 0.03 * tex);
  vec3 col = pow(max(lin, 0.0), vec3(1.25 + 0.4 * uLevel + 0.7 * fsAll)) * vec3(0.99, 0.985, 0.965);
  return mix(col, vec3(0.2, 0.15, 0.15), tip * 0.94);
}
