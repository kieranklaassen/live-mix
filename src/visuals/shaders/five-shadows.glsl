// name: Coloured shadows
// a: Hung branch
// b: Cut card
// what: A white wall lit by five lamps of five colours that together make white. A bare branch hangs before it, only its tip in the frame, and throws five shadows, each in the colour its lamp's absence leaves, darker where they cross; or hoops, combs and a disc of cut card on threads, whose shadows cross in hard interlaced fans.
// follows: Each kind of sound is a lamp: as it sounds its own shadow deepens and sharpens and its light fills the others. Low draws things nearer the wall, texture and high stir the twigs, the mix deepens the colours. A hit flares one lamp and swings its shadow; a cue clears every edge and sways what hangs. The loop walks the lamps, Space spreads them, Tone sharpens.
vec2 fsD[5];    // how far each lamp throws a shadow aside for each step away from the wall
vec3 fsC[5];    // each lamp's light, all five together the white of the wall
float fsPen[5]; // how soft each lamp's shadows get with distance
vec2 fsO;       // the lamp in hand: its aside and
float fsS;      // its softness
float fsPx, fsNear;
float fsAll;    // 1 when drone, pad, texture and phrase all sound at their fullest

void fsLamp(int k, vec2 at, float base, vec3 c, float lv) {
  float an = TAU * uLoop + float(k) * 1.256;
  fsD[k] = at * (0.8 + 0.4 * uSpace) + 0.05 * vec2(cos(an), sin(an)) + 0.03 * sin(uTime * vec2(0.071, 0.053) + float(k) * 2.4);
  c *= c;
  c /= max(dot(c, vec3(0.333)), 0.02);
  c = max(mix(vec3(1.0), c, 0.55 + 0.4 * lv + 0.45 * uCue * (1.0 - lv)), 0.02);
  fsC[k] = c * base * (0.5 + (0.5 + 0.7 * uEnergy) * lv);
  fsPen[k] = (0.04 - 0.02 * sqrt(lv)) * (1.0 - 0.6 * uCue) * (1.3 - 0.6 * uTone) * (0.8 + 0.4 * uSpace);
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
  return (length(p - m.xy) - m.z - 0.0034 * e * e) * m.w;
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
  float spine = fsStrip(q.y + 0.01, 0.045, s.y) * fsStrip(q.x, 1.0, s.x);
  return max(teeth, spine);
}
// A thread from at straight up out of the frame.
float fsThread(vec2 p, vec3 at) {
  vec2 c = at.xy + fsO * at.z;
  float s = fsPx + fsS * at.z;
  return fsStrip(p.x - c.x, 0.0012, s) * smoothstep(-s, s, p.y - c.y);
}
float fsCards(vec2 p) {
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

// What the lamp in hand adds to the wall where a share c of it is kept off.
vec3 fsLight(vec2 p, int k, float c) {
  p += fsO * vec2(0.5, 0.3);
  return fsC[k] * (1.0 - c) / (1.0 + (0.13 + 0.22 * fsAll) * dot(p, p));
}
vec3 render(vec2 p) {
  fsPx = 1.0 / uRes.y;
  fsNear = 1.0 - 0.1 * uLow;
  fsLamps();
  int na = uVar > 0.5 ? 0 : 5, nb = 5 - na;       // a loop of none is the cheapest way round the other picture
  vec3 lin = vec3(0.0);
  if (nb > 0) {
    vec3 an = vec3(0.9, 0.6, 0.4) * sin(uTime * vec3(0.037, 0.051, 0.043) + vec3(0.6, 2.0, 4.0)) + 4.0 * uCue * (1.0 - uCue) * vec3(0.3, -0.4, 0.5);
    fsF1 = vec2(cos(an.x), sin(an.x)); fsF2 = vec2(cos(an.y), sin(an.y)); fsF3 = vec2(cos(an.z), sin(an.z));
  }
  for (int k = 0; k < nb; k++) {
    fsO = fsD[k]; fsS = fsPen[k] * 0.4;
    lin += fsLight(p, k, fsCards(p));
  }
  float tip = 0.0;
  for (int k = 0; k < na; k += 5) { fsBranch(); fsO = vec2(0.0, 1.67); tip = fsTip(fsBark(p)); }
  for (int k = 0; k < na; k++) {
    fsO = fsD[k]; fsS = fsPen[k];
    lin += fsLight(p, k, fsTree(fsBark(p)));
  }
  // plaster
  float tex = noise(p * 190.0) * 0.5 + noise(p * 41.0) * 0.5 - 0.5;
  lin = (lin * (1.0 + 0.015 * uLevel + 0.06 * fsAll) + 0.03 * vec3(1.0, 0.8, 0.9)) * 0.975 * (1.0 + 0.03 * tex);
  vec3 col = pow(max(lin, 0.0), vec3(1.25 + 0.4 * uLevel + 0.7 * fsAll)) * vec3(0.99, 0.985, 0.965);
  return mix(col, vec3(0.2, 0.15, 0.15), tip * 0.94);
}
