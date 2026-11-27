// name: Pierced drum
// a: Round holes
// b: Slots and combs
// what: A pale empty room at night and in it a dark pierced drum on a spindle, its lamps inside: fields of discs, rings of small ones, pinholes and a few like waxing moons slide over floor, walls and ceiling, long where they rake a wall; or a drum hung on a cord, whose slots and combs throw leaning bars that bend at the corners.
// follows: Drone, pad, texture and phrase are each a lamp with a piercing of its own, as bright as it sounds; the spectrum opens the holes from floor to ceiling; the two drums turn against each other as the music goes; low notes lift the spill on the walls, highs and keys light the pinholes, a hit sends a hoop of light out over the room, a cue tips the drum once.
// own: 0 1 many fine piercings, -1 a few great ones; 1 1 petals and stars (b: reeds that bend), -1 leaves (b: dashes like rice); 2 1 a round room under a dome, -1 no room but open ground under the sky; 3 1 day, all pale and the piercings lie as stains of colour, -1 night full of smoke that holds the shafts; 4 the eye: 1 looks down from above, -1 close to the drum; 5 1 a globe in place of the drum, -1 no drum seen and what it throws sinks slowly down (b: the bars run from floor to ceiling); 6 1 everything hung with folded cloth, -1 a floor of still water; 7 1 outlines only, -1 large soft pools with no edge
const float pdR = 0.3, pdH = 0.56;   // the drum: its radius and half its height
vec3 pdLo, pdHi;      // the room, corner to corner
vec3 pdPiv;           // what it tips about, from its middle
vec3 pdC;             // the middle of the drum
vec3 pdInk[5];        // the light of each lamp: drone, pad, texture, phrase, hit
float pdY[4], pdTh[4];// each lamp's height in the drum, and its turn round it
float pdLit[4];       // how strong each is
vec3 pdAll;           // what all the lamps come to
vec2 pdTip, pdTurn;   // the tip of the spindle (cos, sin); how far the outer and the inner drum have turned
float pdSoft;         // how soft an edge is at the skin
float pdM;            // how many times as many piercings
float pdSink;         // how far they have sunk
vec3 pdPig[4];        // the stain of each lamp by day, and how strong
float pdDeep[4];

vec3 pdRich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }

void pdPlace() {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  pdY = float[4](-0.06, 0.2, -0.25, 0.08);
  pdTh = float[4](0.0, 1.1, 2.3, 4.0);
  float wt[5] = float[5](1.15, 0.55, 0.36, 0.65, 1.0);   // the drone leads, the others stand behind it
  pdAll = vec3(0.0);
  for (int k = 0; k < 5; k++) {
    vec3 c = pdRich(uKind[k], 0.9); c *= c * vec3(1.12, 0.96, 0.82);
    c = c / (0.25 + max(c.r, max(c.g, c.b)));
    pdInk[k] = (c + vec3(0.1, 0.07, 0.04)) * lv[k] * (0.35 + 0.65 * lv[k]) * (0.8 + 0.8 * uEnergy) * 1.35 * wt[k];
  }
  // with nothing sounding one lamp is at a low warm glow
  pdInk[0] += vec3(1.0, 0.66, 0.33) * (0.5 + 0.5 * uCue) * (1.0 - 0.45 * uDrone);
  pdInk[2] += vec3(0.95, 0.75, 0.5) * (0.6 * uKeys + 0.2 * uHigh);   // highs and the keys light the fine holes
  pdInk[4] *= 1.7;
  for (int k = 0; k < 4; k++) pdLit[k] = max(pdInk[k].r, max(pdInk[k].g, pdInk[k].b));
  for (int k = 0; k < 5; k++) pdAll += pdInk[k] * (k == 4 ? 0.12 : 0.3);
  pdAll /= 1.0 + 0.5 * max(pdAll.r, max(pdAll.g, pdAll.b));   // the room stays night however many burn
  float c = 4.0 * uCue * (1.0 - uCue), tip = 0.012 * sin(uTime * 0.11) + 0.1 * c;
  pdTip = vec2(cos(tip), sin(tip));
  pdTurn = TAU * fract(uTravel * vec2(0.0062, -0.0047));
  pdM = uOwn[0] == 0.0 ? 1.0 : exp2(uOwn[0] * (uOwn[0] > 0.0 ? 0.9 : 1.3));
  pdSink = max(-uOwn[5], 0.0) * uTime * 0.012;
  if (uOwn[3] > 0.0) for (int k = 0; k < 4; k++) {
    pdPig[k] = uKind[k] * (0.3 + 0.75 * uKind[k]);
    pdDeep[k] = sat(0.14 + 0.95 * sqrt(lv[k]) * (0.7 + 0.4 * uEnergy) + 0.3 * uHits + (k == 0 ? 0.3 : k == 2 ? 0.3 * uHigh : 0.0));
  }
  pdSoft = mix(0.005, 0.0015, uTone) * (0.8 + 0.4 * uSpace);
}
float pdFall(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
// 1 inside an edge, 0 outside it, b soft each way
float pdEdge(float d, float b) { float x = sat(0.5 - 0.5 * d / b); return x * x * (3.0 - 2.0 * x); }

// Along the skin, from the middle of the nearest of n cells round the drum.
float pdCell(float a, float n) { return (fract(a * n / TAU) - 0.5) * TAU / n * pdR; }
float pdN(float n) { return uOwn[0] == 0.0 ? n : max(floor(n * pdM + 0.5), 2.0); }
// What is cut at an edge d: the whole of it, its outline, or a soft pool.
float pdCut(float d, float r, float b) {
  if (uOwn[7] > 0.0) { float w = uVar < 0.5 ? min(0.2 * r, 0.0035) : 0.16 * r; if (uVar > 0.5) d -= 0.35 * r * uOwn[7]; d = mix(d, abs(d + w) - w, uOwn[7]); }
  if (uOwn[7] < 0.0) { float k = -uOwn[7] * (uVar < 0.5 ? 1.0 : 2.6); b += k * r * 0.75; d += k * r * (uVar < 0.5 ? 0.6 : 0.3); }
  return pdEdge(d, b);
}
// A hole of size r: round, a flower of petals, or a leaf that leans.
float pdHole(vec2 q, float r, float lean, float b) {
  float d = length(q) - r;
  if (uOwn[1] > 0.0) d = mix(d, length(q) - r * (0.75 + 0.42 * cos(5.0 * atan(q.y, q.x + 1e-6) + lean)), uOwn[1]);
  if (uOwn[1] < 0.0) { vec2 w = rot(lean) * q; d = mix(d, length(vec2(abs(w.x) + 1.02 * r, w.y)) - 1.56 * r, -uOwn[1]); }
  return pdCut(d, r, b);
}
// How much light the round holes of lamp k let by: th round the drum, h up it, b the softness there.
float pdHoles(int k, float th, float h, float b) {
  float open = 0.8 + 0.34 * band(0.5 + 0.85 * h);
  h += pdSink;
  if (k == 0) {          // rows of holes that open and close as the wide windows of the other drum go by
    float B = 0.057 / pdM, n = pdN(29.0);
    float j = floor(h / B + 0.5), x = pdCell(th + pdTurn.x + j * TAU / (2.0 * n), n), y = h - j * B;
    float w = th - x / pdR + pdTurn.y, g = floor(j * B / 0.34 + 0.5);
    vec2 q = vec2(pdCell(w + g * 0.9, 4.0), (j * B - g * 0.34) * 1.1);
    float r = 0.0232 / pdM * open * sat(1.12 - dot(q, q) * 32.0);
    return pdHole(vec2(x, y), r, 0.6 + 1.1 * j, b) * smoothstep(0.002, 0.009, r);
  }
  if (k == 1) {          // rings of small holes, in every other row
    float B = 0.2 / pdM;
    float j = floor(h / B + 0.5), x = pdCell(th + pdTurn.y + j * 0.31, pdN(8.0)), y = h - j * B, r = length(vec2(x, y));
    if (r > 0.095 / pdM || r < 0.001 || fract(j * 0.5) < 0.25) return 0.0;
    float t = (fract(atan(x, y) * 18.0 / TAU) - 0.5) * TAU / 18.0, R = 0.072 / pdM;
    if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[7] != 0.0) return pdHole(vec2(t, r / R - 1.0) * R, 0.0078 * open / pdM, PI * 0.5, b);
    return pdEdge(length(vec2(t, r / 0.072 - 1.0)) * 0.072 - 0.0078 * open, b);
  }
  if (k == 2) {          // pinholes, in leaning drifts
    float B = 0.03 / pdM, n = pdN(60.0);
    float j = floor(h / B + 0.5), x = pdCell(th + pdTurn.x + j * TAU / (2.0 * n), n);
    return pdHole(vec2(x, h - j * B), 0.0068 * open / pdM, 0.7, b) * pdFall(0.06, 0.1, abs(pdCell(th + pdTurn.y + 1.4 * h, 4.0)));
  }
  float B = 0.21 / pdM;  // a few large holes, with a disc of the other drum going over each, as a moon goes through its phases
  float j = floor(h / B + 0.5), y = h - j * B;
  return pdHole(vec2(pdCell(th + pdTurn.y + j * 0.6, pdN(7.0)), y), 0.027 * open / pdM, 1.1, b) * pdEdge(0.026 / pdM - length(vec2(pdCell(th + pdTurn.x, pdN(9.0)), y + 0.012 / pdM)), b);
}
// The same for slots and combs: teeth side by side, leaning, of unequal length.
float pdSlots(int k, float th, float h, float b) {
  bool up = h > 0.33;
  float lean = up ? -1.3 : k == 1 ? 1.5 : k == 3 ? -0.7 : 0.9;
  float a = th + (up ? pdTurn.y : pdTurn.x) + lean * h;
  if (uOwn[1] > 0.0) a += uOwn[1] * (0.16 * sin(h * 11.0 + th * 2.0 + float(k) * 1.7 + uTime * 0.05) - 0.9 * lean * h + 1.5 * h * h);
  float n = up ? 11.0 : k == 0 ? 6.0 : k == 1 ? 8.0 : k == 2 ? 13.0 : 5.0, teeth = k == 0 ? 10.0 : k == 2 ? 9.0 : 8.0;
  n = pdN(n);
  float u = fract(a * n / TAU) * teeth, i = clamp(floor(u), 1.0, floor(teeth * 0.62)), pitch = TAU * pdR / (n * teeth);
  float lo = up ? 0.37 : k == 0 ? -0.5 + 0.03 * i : k == 1 ? -0.22 - 0.03 * i : k == 2 ? -0.42 : 0.05 - 0.07 * i;
  float hi = up ? 0.42 + 0.02 * i : k == 0 ? 0.31 - 0.012 * i : k == 1 ? 0.28 : k == 2 ? -0.1 + 0.03 * i : 0.3;
  vec2 q = vec2((u - i - 0.5) * pitch, max(abs(h - 0.5 * (lo + hi)) - 0.5 * (hi - lo), 0.0));
  if (uOwn[5] < 0.0) { lo = mix(lo, -0.6, -uOwn[5]); hi = mix(hi, up ? hi : 0.36, -uOwn[5]); }
  float wide = pitch * (0.19 + 0.08 * band(0.5 + 0.85 * h)), d = length(q) - wide;
  if (uOwn[1] > 0.0) d += uOwn[1] * wide * 0.6 * sat((h - lo) / (hi - lo));
  if (uOwn[1] < 0.0) {
    float seg = 0.075 / sqrt(pdM), yy = (fract(h / seg + i * 0.37) - 0.5) * seg;
    d = mix(d, max(d, length(vec2(q.x * 0.85, yy * 0.5)) - wide * 0.9 * min(1.0, seg * 0.24 / wide)), -uOwn[1]);
  }
  float m = pdCut(d, wide, b);
  float g = abs(pdCell(th + (up ? pdTurn.x : pdTurn.y) - 0.8 * h + float(k), 4.0)) - 0.17;
  return m * pdEdge(g, b);
}
float pdSkin(int k, float th, float h, float b) {
  float y = abs(h) - pdH + 0.03;
  float bb = b + 0.06 * max(-uOwn[7], 0.0);
  if (y > bb) return 0.0;
  return pdEdge(y, bb) * (uVar < 0.5 ? pdHoles(k, th, h, b) : pdSlots(k, th, h, b));
}
// The ring of holes a hit opens: it runs up the drum, so its hoop runs out over the floor and up the walls.
float pdHoop(float th, float h, float b) {
  float y = h - mix(uVar < 0.5 ? -0.42 : -0.26, 0.34, 1.0 - uHits);
  if (uVar < 0.5) {
    float j = clamp(floor(y / 0.034 + 0.5), -1.0, 1.0);
    return pdEdge(length(vec2(pdCell(th + pdTurn.x + j * TAU / 88.0, 44.0), y - j * 0.034)) - (j == 0.0 ? 0.0165 : 0.009), b);
  }
  float x = pdCell(th + pdTurn.x + 1.5 * h, 40.0);
  return pdEdge(length(vec2(x, max(abs(y) - 0.055, 0.0))) - 0.0085, b);
}

// From the room to the drum, which tips about its foot or its hook.
vec3 pdLean(vec3 d) { d -= pdPiv; return vec3(d.x * pdTip.x - d.y * pdTip.y, d.x * pdTip.y + d.y * pdTip.x, d.z) + pdPiv; }

float pdFold(vec2 q) { return sin(q.x * 9.0 + 1.6 * sin(q.x * 2.3 + 0.4 * q.y) + 0.5 * q.y + 0.25 * sin(uTime * 0.13)) + 0.35 * sin(q.x * 21.0 + 2.0); }
// How high on the skin the light at d (from the middle of the drum) left it, for a lamp at height y.
float pdAt(vec3 d, float y, float rr, float s) {
  float h = y + (d.y - y) * s;
  return uOwn[5] > 0.0 ? mix(h, 0.34 * atan(d.y - 0.3 * y, rr), uOwn[5]) : h;
}
// The sky over open ground, by night or by day.
vec3 pdSky(vec3 rd) {
  float up = max(rd.y, 0.0), day = max(uOwn[3], 0.0), az = atan(rd.x, rd.z);
  vec3 c = vec3(0.004, 0.007, 0.016) + (vec3(0.01, 0.02, 0.05) + pdAll * 0.03) * exp(-up * 5.0);
  vec2 g = vec2(az * 60.0, rd.y * 70.0), id = floor(g);
  float h = hash21(id);
  c += vec3(0.8, 0.85, 1.0) * step(0.962, h) * exp(-(30.0 + 900.0 * (1.0 - h)) * dot(fract(g) - 0.5 - 0.3 * (hash22(id + 3.1) - 0.5), fract(g) - 0.5 - 0.3 * (hash22(id + 3.1) - 0.5))) * (h - 0.955) * 22.0 * smoothstep(0.03, 0.2, up);
  if (day > 0.0) c = mix(c, mix(vec3(0.95, 0.9, 0.82), 0.45 * uKind[1] + 0.35, smoothstep(0.0, 0.7, up)), day);
  float ridge = 0.02 + 0.07 * noise(vec2(az * 3.0 + 20.0, 1.0)) + 0.02 * noise(vec2(az * 11.0, 5.0));
  return mix(c, mix(vec3(0.004, 0.006, 0.011), vec3(0.5, 0.48, 0.47), day), (1.0 - smoothstep(-0.004, 0.004, rd.y - ridge)) * 0.8);
}
// The room along a ray: what is seen of its walls, floor or ceiling, where and which way it faces.
vec3 pdRoom(vec3 ro, vec3 rd, float pf, float past, out float t, out vec3 P, out vec3 N) {
  bool two = uVar > 0.5;
  float dome = max(uOwn[2], 0.0), open = max(-uOwn[2], 0.0), day = max(uOwn[3], 0.0);
  vec3 tw = (mix(pdLo, pdHi, step(0.0, rd)) - ro) / (rd + vec3(equal(rd, vec3(0.0))) * 1e-5);
  t = min(tw.x, min(tw.y, tw.z));
  N = t == tw.x ? vec3(-sign(rd.x), 0, 0) : t == tw.y ? vec3(0, -sign(rd.y), 0) : vec3(0, 0, -sign(rd.z));
  if (dome > 0.0) {
    vec3 c = vec3(pdC.x, 0.4, pdC.z), o = ro - c;
    float b2 = dot(o, rd), q = -b2 + sqrt(max(b2 * b2 - dot(o, o) + 13.7, 0.01));
    vec3 n = normalize(-(o + rd * q));
    if (rd.y < 0.0 && -ro.y / rd.y < q) { q = -ro.y / rd.y; n = vec3(0, 1, 0); }
    t = mix(t, q, dome); N = normalize(mix(N, n, dome) + vec3(0.0, 1e-4, 0.0));
  }
  P = ro + rd * t;
  float foot = min((t + past) * pf, 0.5);
  bool flat_ = N.y > 0.5;
  // distances to the planes, for the dusk in the corners
  vec3 e = min(P - pdLo, pdHi - P);
  if (dome > 0.0) e = max(e, 0.0);
  vec3 eo = mix(1.0 - 0.5 * exp(-e * 2.2), vec3(1.0), abs(N));
  float ao = eo.x * eo.y * eo.z;
  vec3 near = mix(1.0 - 0.6 * exp(-e / (0.006 + 1.3 * foot)), vec3(1.0), abs(N));   // the dark line where two planes meet
  if (dome > 0.0) { near = mix(near, vec3(1.0), dome); ao = mix(ao, 1.0 - 0.4 * exp(-P.y * 2.2) * step(N.y, 0.5), dome); }
  vec3 wall = near.x * near.y * near.z * (N.y > 0.5 ? vec3(0.36, 0.31, 0.28) : N.y < -0.5 ? vec3(0.6) : vec3(0.66, 0.65, 0.64));
  float was = 1.0;
  if (flat_) {            // boards
    float q = abs(fract(P.z * 4.5) - 0.5) / 4.5;
    was = wall.x;
    wall *= 1.0 - 0.45 * (1.0 - smoothstep(0.003, 0.003 + foot * 2.5, q)) * pdFall(0.01, 0.1, foot);
    wall *= 0.9 + 0.2 * hash11(floor(P.z * 4.5));
    if (open > 0.0) wall = mix(wall, vec3(0.62, 0.6, 0.57) * (0.75 + 0.4 * fbm(P.xz * 2.3) + 0.12 * sin(P.x * 7.0 + 3.0 * noise(P.xz * 1.4) + 2.0 * P.z)), open);
    if (dome > 0.0) wall = mix(wall, vec3(0.4, 0.39, 0.38) * (0.9 + 0.2 * noise(P.xz * 3.0)), dome);
    if (day > 0.0) wall = mix(wall, mix(wall * 2.0, vec3(0.8), 0.35), day);
  } else if (N.y == 0.0 && dome == 0.0) wall *= 1.0 - 0.35 * pdFall(-foot, foot, abs(P.y - 0.11) - 0.006);

  float lit = 1.0;
  vec3 at = P;
  if (uOwn[6] > 0.0) {    // folds: the cloth stands out from the wall and turns from the light
    vec2 q = flat_ ? P.xz * vec2(0.6, 0.5) : dome > 0.5 ? vec2(atan(P.x - pdC.x, P.z - pdC.z) * 2.6, P.y) : vec2(abs(N.x) > 0.5 ? P.z : P.x, P.y * (N.y < -0.5 ? 0.0 : 1.0));
    float f0 = pdFold(q), f1 = pdFold(q + vec2(0.03, 0.0));
    vec3 side = abs(N.x) > 0.5 ? vec3(0, 0, 1) : vec3(1, 0, 0);
    at += N * f0 * 0.1 * uOwn[6];
    float tilt = (f1 - f0) / 0.03 * 0.085 * uOwn[6];
    float turned = dome > 0.5 && !flat_ ? 0.6 : dot(pdC - P, side) / (abs(dot(pdC - P, side)) + 0.45);
    lit = clamp(1.0 - tilt * 0.8 * turned, 0.15, 1.9);
    ao *= 1.0 - 0.3 * uOwn[6] * (0.5 - 0.37 * f0);
    ao *= mix(1.0, lit, 0.55);
  }
  // from here back to each lamp
  vec3 d = at - pdC;
  float D2 = dot(d, d), inc = abs(dot(N, d)) / sqrt(D2);
  d = pdLean(d);
  float rr = length(d.xz), th = atan(d.x, d.z + 1e-6);
  float s = pdR / max(rr, 0.05);
  float b = pdSoft * (0.4 + 0.3 * sqrt(D2)) + 0.6 * foot * s / max(inc, 0.25);
  if (open > 0.0) b = min(b, mix(b, 0.03, open));
  float fall = 6.0 * inc / (1.3 + 0.5 * D2);
  if (open > 0.0) fall = mix(fall, 6.0 * inc / (1.3 + 0.16 * D2) * 1.5, open);
  vec3 L = vec3(0.0), stain = vec3(1.0);
  for (int k = 0; k < 4; k++) if (pdLit[k] > 0.004) {
    float m = pdSkin(k, th + pdTh[k], pdAt(d, pdY[k], rr, s), b);
    L += pdInk[k] * m;
    if (day > 0.0) stain *= mix(vec3(1.0), pdPig[k], m * pdDeep[k] * sat(fall * 1.3));
  }
  float hoop = 0.0;
  if (uHits > 0.01) {
    hoop = pdHoop(th, pdAt(d, 0.0, rr, s), b + 0.012 * max(-uOwn[7], 0.0));
    L += pdInk[4] * hoop;
    float hole = rr / max(-d.y * 0.53, 0.1);            // and the dark pool under the drum fills
    if (N.y > 0.5) L += pdInk[4] * uHits * 0.32 * hole * hole * pdFall(0.9, 1.06, hole);
  }
  L *= fall * lit;
  // light thrown back by the room, and the night outside it
  vec3 back = pdAll * vec3(1.16, 0.93, 0.74) * (0.042 + 0.05 * uLow + 0.06 * uMic + 0.04 * uSpace) * 13.0 / (3.0 + D2 * (1.0 + 0.09 * D2));
  vec3 night = vec3(0.005, 0.008, 0.017);
  vec3 col = wall * (L * 1.15 + (back + night) * ao);
  if (!two && N.y > 0.5) col *= mix(smoothstep(-foot, foot, length(P.xz - pdC.xz) - 0.15) * 0.97 + 0.03, 1.0, max(-uOwn[5], 0.0));   // the foot of the spindle
  if (day > 0.0) {        // by day: plaster in light from a high window, the colours lie on it as stains
    float sun = 0.72 + 0.28 * dot(N, normalize(vec3(0.35, 0.8, -0.5)));
    vec3 pale = vec3(1.3, 1.27, 1.2) * sun * (0.45 + 0.55 * ao) * mix(vec3(1.0), wall * 1.4, 0.75) * (1.0 - 0.1 * length(P - pdC) * (1.0 - open) * 0.5);
    pale *= stain * mix(vec3(1.0), uKind[4] * uKind[4] * 0.8, sat(uHits * 1.3) * max(hoop, 0.5 * stain.x * step(stain.x, 0.97) * 0.4));
    pale *= 1.0 - 0.45 * exp(-dot(P.xz - pdC.xz, P.xz - pdC.xz) * 4.0) * step(0.5, N.y) * (1.0 - max(-uOwn[5], 0.0));
    col = mix(col, pale * (0.92 + 0.12 * uLevel), day);
  }
  if (open > 0.0) {
    vec3 sky = pdSky(rd);
    col = mix(col, sky, open * (flat_ ? smoothstep(5.0, 24.0, t) : 1.0));
  }
  return col;
}
// The drum on its spindle, or hung, over what is behind it.
vec3 pdDrum(vec3 col, vec3 ro, vec3 rd, float t, float pf) {
  bool two = uVar > 0.5;
  float seen = 1.0 - max(-uOwn[5], 0.0), globe = max(uOwn[5], 0.0), day = max(uOwn[3], 0.0);
  vec3 night = vec3(0.005, 0.008, 0.017);
  vec3 o = ro - pdC, v = rd;
  o = pdLean(o); v = pdLean(v + pdPiv) - pdPiv;
  float A = dot(v.xz, v.xz) + 1e-9, miss = abs(o.x * v.z - o.z * v.x) / sqrt(A);
  float tc = -dot(o.xz, v.xz) / A;          // nearest the axis
  float ys = o.y + v.y * tc, fpx = max(tc, 0.01) * pf;
  // the spindle it stands on, or the cord it hangs by
  float rod = pdFall(-fpx, fpx, miss - (two ? 0.006 : 0.016)) * step(0.0, two ? ys : -ys) * step(tc, t + 0.02) * step(0.0, tc);
  if (uOwn[2] < 0.0 && two) rod *= 1.0 + uOwn[2];
  col = mix(col, vec3(0.004 + 0.2 * day), rod * seen);
  float disc = pdR * pdR - miss * miss;
  vec3 Q = vec3(0.0); float edge = 0.0, nz = 0.0, up = 0.0;
  if (globe > 0.0) {                        // between a drum and a globe
    float q0 = -dot(o, v), near2 = dot(o, o) - q0 * q0;
    if (near2 < 0.6 && q0 > 0.0) {
      float q = q0 - 0.78, dd = 1.0;
      for (int i = 0; i < 26; i++) {
        Q = o + v * q;
        vec2 w = vec2(length(Q.xz) - pdR, abs(Q.y) - pdH);
        dd = mix(min(max(w.x, w.y), 0.0) + length(max(w, 0.0)), length(Q) - 0.56, globe);
        if (dd < 0.0015 || q > q0 + 0.6) break;
        q += dd * 0.95;
      }
      edge = (1.0 - smoothstep(0.003, 0.006 + fpx, dd));
      vec3 n = normalize(mix(vec3(Q.x, 0.0, Q.z) / max(length(Q.xz), 1e-3), Q / max(length(Q), 1e-3), globe));
      nz = sat(-dot(n, v)); up = n.y;
    }
  } else if (disc > 0.0 && tc > 0.0) {
    float q = sqrt(disc / A), t0 = tc - q; Q = o + v * t0;
    edge = smoothstep(-fpx, fpx, pdH + 0.01 - abs(Q.y)) * pdEdge(miss - pdR + fpx, fpx);
    nz = sqrt(disc) / pdR;
  }
  if (uOwn[4] > 0.0 && v.y < -0.01 && globe < 1.0) {        // the open top, seen from above
    float tp = (pdH - o.y) / v.y; vec3 K = o + v * tp;
    float rk = length(K.xz), cap = pdFall(-fpx, fpx, rk - pdR) * uOwn[4] * seen * (1.0 - globe);
    vec3 in_ = pdAll * (0.35 + 2.2 * exp(-rk * rk * 60.0)) * 1.4 + night;
    col = mix(col, mix(mix(in_, vec3(0.35), day * 0.8), vec3(0.02 + 0.5 * day), (1.0 - smoothstep(0.012, 0.02, abs(rk - pdR + 0.014)))), cap * step(0.0, tp));
    edge *= 1.0 - cap;
  }
  if (edge > 0.0) {
    float h = globe > 0.0 ? mix(Q.y, 0.34 * asin(clamp(Q.y / max(length(Q), 1e-3), -1.0, 1.0)), globe) : Q.y;
    vec3 glow = vec3(0.0), stain = vec3(1.0); float qa = atan(Q.x, Q.z), m1 = globe > 0.0 ? mix(miss, 0.13, globe) : miss;
    for (int k = 0; k < 4; k++) {
      float dy = (ys - pdY[k]) * 4.0, m = pdSkin(k, qa + pdTh[k], h, 0.7 * fpx);
      glow += pdInk[k] / (1.0 + dy * dy) * (0.25 + 2.5 * exp(-m1 * m1 * 60.0)) * m;
      if (day > 0.0) stain *= 1.0 - 0.75 * m;
    }
    glow += pdInk[4] * pdHoop(qa, h, 0.7 * fpx);
    float rim = pow(1.0 - nz, 3.0);
    vec3 metal = vec3(0.001) + (pdAll * 0.12 + night * 0.6) * (rim * 0.6 + 0.12 * exp(-36.0 * (nz - 0.75) * (nz - 0.75)));
    metal *= mix(0.75 + 0.5 * smoothstep(0.0, 0.004, abs(abs(Q.y) - pdH + 0.035)), 1.0, globe);
    vec3 skin = metal + glow * (0.3 + 0.7 * nz) * (1.0 + 1.6 * max(-uOwn[2], 0.0));
    if (day > 0.0) skin = mix(skin, (uKind[0] * uKind[0] * 0.55 + 0.02) * (0.12 + 0.5 * nz + 0.35 * up + 0.3 * sat(dot(normalize(vec3(Q.x, 0.0, Q.z) + 1e-5), vec3(-0.8, 0.0, -0.6)))) * stain + glow * 0.5, day);
    col = mix(col, skin, edge * seen);
  }
  col += pdAll * 0.012 / (1.0 + 5.0 * miss * miss + 2.0 * ys * ys);
  return col;
}
vec3 render(vec2 p) {
  pdPlace();
  bool two = uVar > 0.5;
  vec3 ro; float f = 0.8, yaw, shift;
  if (two) {
    pdLo = vec3(-2.6, 0.0, -4.5); pdHi = vec3(4.6, 3.9, 2.6); pdC = vec3(-0.2, 1.9, -0.95);
    ro = vec3(2.2, 1.2, -2.6); yaw = -0.8; shift = 0.13;
  } else {
    pdLo = vec3(-2.6, 0.0, -4.5); pdHi = vec3(2.6, 3.1, 2.6); pdC = vec3(0.3, 1.25, -1.1);
    ro = vec3(-2.3, 1.5, -2.5); yaw = 0.95; shift = -0.03;
  }
  if (two) pdC.y -= 0.85 * max(-uOwn[2], 0.0);
  if (uOwn[2] < 0.0) {     // the walls and the ceiling go far off
    float k = 1.0 + 14.0 * uOwn[2] * uOwn[2];
    pdHi.y *= k; pdLo.xz = pdC.xz + (pdLo.xz - pdC.xz) * k; pdHi.xz = pdC.xz + (pdHi.xz - pdC.xz) * k;
  }
  pdPiv = vec3(0.0, two ? (uOwn[2] < 0.0 ? 2.0 : pdHi.y - pdC.y) : -pdC.y, 0.0);
  vec3 fw = vec3(sin(yaw), 0.0, cos(yaw)), rt = vec3(cos(yaw), 0.0, -sin(yaw));
  vec3 rd = normalize(fw * f + rt * p.x + vec3(0.0, p.y + shift, 0.0));
  if (uOwn[4] != 0.0) {
    vec3 ro2, ta;
    if (uOwn[4] > 0.0) { ro2 = pdC + (two ? vec3(0.9, 2.75, -0.9) : vec3(-0.75, 3.3, -0.9)); ta = pdC * vec3(1.0, 0.1, 1.0) + vec3(0.1, 0.0, 0.1); }
    else { ro2 = pdC + (two ? vec3(1.0, -0.28, -1.02) : vec3(-1.22, 0.16, -0.62)); ta = pdC + (two ? vec3(0.24, 0.0, 0.18) : vec3(-0.16, 0.02, 0.26)); }
    float k = abs(uOwn[4]);
    ro = mix(ro, ro2, k);
    fw = normalize(mix(fw, normalize(ta - ro2), k)); rt = normalize(cross(vec3(0, 1, 0), fw));
    rd = normalize(fw * f + rt * p.x + cross(fw, rt) * (p.y + shift * (1.0 - k)));
  }
  float px = 1.0 / uRes.y, t;
  vec3 P, N;
  vec3 col = pdRoom(ro, rd, px / f, 0.0, t, P, N);
  if (uOwn[6] < 0.0 && N.y > 0.5) {         // still water: the room and the drum stand in it upside down
    float far = exp(-t * 0.22), k = -uOwn[6], t2; vec2 w = P.xz * 2.6 + vec2(uTime * 0.07, -uTime * 0.05);
    float n0 = noise(w), n1 = noise(w * 2.7 - uTime * 0.11);
    vec2 slope = vec2(n0 - noise(w + vec2(0.12, 0.0)), n0 - noise(w + vec2(0.0, 0.12))) * 0.5 + vec2(n1 - noise(w * 2.7 - uTime * 0.11 + vec2(0.2, 0.0)), 0.0) * 0.12;
    vec3 n = normalize(vec3(slope.x * far, 1.0, slope.y * far)), r = reflect(rd, n), P2, N2;
    r.y = max(r.y, 0.004);
    vec3 m = pdRoom(P + vec3(0.0, 0.01, 0.0), r, px / f, t, t2, P2, N2);
    m = pdDrum(m, P, r, t2, px / f);
    float fres = 0.5 + 0.5 * pow(1.0 - sat(dot(n, -rd)), 4.0);
    col = mix(col, col * mix(0.22, 0.16, max(-uOwn[2], 0.0)) + m * fres * vec3(0.9, 0.97, 1.0), k);
  }
  if (uOwn[3] < 0.0) {                      // smoke: the shafts between the drum and the walls
    vec3 o = ro - pdC, sum = vec3(0.0);
    float tm = -dot(o, rd), dist = max(length(o + rd * tm), 0.14), a0 = atan(-tm / dist), a1 = atan((min(t, 20.0) - tm) / dist), j = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float n = pdN(two ? 24.0 : 29.0), B = 0.057 / pdM;
    for (int i = 0; i < 22; i++) {           // the rows of the drone and the rings of the pad, as shafts with soft sides
      vec3 X = o + rd * (tm + dist * tan(mix(a0, a1, (float(i) + 0.5 + 0.5 * (j - 0.5)) / 22.0)));
      float rr = length(X.xz), h = X.y * pdR / max(rr, 0.05), a = atan(X.x, X.z + 1e-6) + pdTurn.x;
      vec2 q = vec2(pdCell(a - pdTurn.x + pdTurn.y, 4.0), abs(h) - 0.16 * step(0.17, abs(h)) * 2.0);
      float c = two ? cos(a * n + h * 24.0) : cos(a * n) * cos(PI * h / B);
      sum += (pdInk[0] * smoothstep(0.0, 0.9, c) * smoothstep(0.0, 0.5, 1.1 - dot(q, q) * 30.0) * 1.8 + (pdInk[1] + pdInk[3]) * smoothstep(0.55, 1.0, cos(a * 7.0 - h * 9.0 + 2.0)) * 0.8) * smoothstep(pdR * 0.95, pdR * 1.3, length(vec2(rr, 0.5 * X.y))) * (1.0 - smoothstep(pdH - 0.1, pdH, abs(h)));
    }
    float curl = 0.4 + noise(vec2(p.x * 2.4 - uTime * 0.03, p.y * 2.4 - uTime * 0.05)) * 0.7 + 0.35 * noise(vec2(p.x * 6.0 + uTime * 0.04, p.y * 5.0 - uTime * 0.07));
    col = col * (1.0 + 0.45 * uOwn[3]) + (sum * (a1 - a0) / (dist * 22.0) * 0.4 + pdAll * 0.035 / (0.4 + dist)) * curl * -uOwn[3];
  }
  col = pdDrum(col, ro, rd, t, px / f);
  if (uOwn[5] < 0.0 && uOwn[3] <= 0.0) { vec3 o = ro - pdC; float q = dot(o + rd * -dot(o, rd), o + rd * -dot(o, rd)); col += pdAll * 0.006 * -uOwn[5] / (0.004 + q); }
  return screenOf(col * 1.3);
}
