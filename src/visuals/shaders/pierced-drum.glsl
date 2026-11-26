// name: Pierced drum
// a: Round holes
// b: Slots and combs
// what: A pale empty room at night and in it a dark pierced drum on a spindle, its lamps inside: fields of discs, rings of small ones, pinholes and a few like waxing moons slide over floor, walls and ceiling, long where they rake a wall; or a drum hung on a cord, whose slots and combs throw leaning bars that bend at the corners.
// follows: Drone, pad, texture and phrase are each a lamp with a piercing of its own, as bright as it sounds; the spectrum opens the holes from floor to ceiling; the two drums turn against each other as the music goes; low notes lift the spill on the walls, highs and keys light the pinholes, a hit sends a hoop of light out over the room, a cue tips the drum once.
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
  pdSoft = mix(0.005, 0.0015, uTone) * (0.8 + 0.4 * uSpace);
}
float pdFall(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
// 1 inside an edge, 0 outside it, b soft each way
float pdEdge(float d, float b) { float x = sat(0.5 - 0.5 * d / b); return x * x * (3.0 - 2.0 * x); }

// Along the skin, from the middle of the nearest of n cells round the drum.
float pdCell(float a, float n) { return (fract(a * n / TAU) - 0.5) * TAU / n * pdR; }
// How much light the round holes of lamp k let by: th round the drum, h up it, b the softness there.
float pdHoles(int k, float th, float h, float b) {
  float open = 0.8 + 0.34 * band(0.5 + 0.85 * h);
  if (k == 0) {          // rows of holes that open and close as the wide windows of the other drum go by
    const float B = 0.057;
    float j = floor(h / B + 0.5), x = pdCell(th + pdTurn.x + j * TAU / 58.0, 29.0), y = h - j * B;
    float w = th - x / pdR + pdTurn.y, g = floor(j * B / 0.34 + 0.5);
    vec2 q = vec2(pdCell(w + g * 0.9, 4.0), (j * B - g * 0.34) * 1.1);
    float r = 0.0232 * open * sat(1.12 - dot(q, q) * 32.0);
    return pdEdge(length(vec2(x, y)) - r, b) * smoothstep(0.002, 0.009, r);
  }
  if (k == 1) {          // rings of small holes, in every other row
    const float B = 0.2;
    float j = floor(h / B + 0.5), x = pdCell(th + pdTurn.y + j * 0.31, 8.0), y = h - j * B, r = length(vec2(x, y));
    if (r > 0.095 || r < 0.001 || fract(j * 0.5) < 0.25) return 0.0;
    float t = (fract(atan(x, y) * 18.0 / TAU) - 0.5) * TAU / 18.0;
    return pdEdge(length(vec2(t, r / 0.072 - 1.0)) * 0.072 - 0.0078 * open, b);
  }
  if (k == 2) {          // pinholes, in leaning drifts
    const float B = 0.03;
    float j = floor(h / B + 0.5), x = pdCell(th + pdTurn.x + j * TAU / 120.0, 60.0);
    return pdEdge(length(vec2(x, h - j * B)) - 0.0068 * open, b) * pdFall(0.06, 0.1, abs(pdCell(th + pdTurn.y + 1.4 * h, 4.0)));
  }
  const float B = 0.21;  // a few large holes, with a disc of the other drum going over each, as a moon goes through its phases
  float j = floor(h / B + 0.5), y = h - j * B;
  return pdEdge(length(vec2(pdCell(th + pdTurn.y + j * 0.6, 7.0), y)) - 0.027 * open, b) * pdEdge(0.026 - length(vec2(pdCell(th + pdTurn.x, 9.0), y + 0.012)), b);
}
// The same for slots and combs: teeth side by side, leaning, of unequal length.
float pdSlots(int k, float th, float h, float b) {
  bool up = h > 0.33;
  float lean = up ? -1.3 : k == 1 ? 1.5 : k == 3 ? -0.7 : 0.9;
  float a = th + (up ? pdTurn.y : pdTurn.x) + lean * h;
  float n = up ? 11.0 : k == 0 ? 6.0 : k == 1 ? 8.0 : k == 2 ? 13.0 : 5.0, teeth = k == 0 ? 10.0 : k == 2 ? 9.0 : 8.0;
  float u = fract(a * n / TAU) * teeth, i = clamp(floor(u), 1.0, floor(teeth * 0.62)), pitch = TAU * pdR / (n * teeth);
  float lo = up ? 0.37 : k == 0 ? -0.5 + 0.03 * i : k == 1 ? -0.22 - 0.03 * i : k == 2 ? -0.42 : 0.05 - 0.07 * i;
  float hi = up ? 0.42 + 0.02 * i : k == 0 ? 0.31 - 0.012 * i : k == 1 ? 0.28 : k == 2 ? -0.1 + 0.03 * i : 0.3;
  vec2 q = vec2((u - i - 0.5) * pitch, max(abs(h - 0.5 * (lo + hi)) - 0.5 * (hi - lo), 0.0));
  float m = pdEdge(length(q) - pitch * (0.19 + 0.08 * band(0.5 + 0.85 * h)), b);
  float g = abs(pdCell(th + (up ? pdTurn.x : pdTurn.y) - 0.8 * h + float(k), 4.0)) - 0.17;
  return m * pdEdge(g, b);
}
float pdSkin(int k, float th, float h, float b) {
  float y = abs(h) - pdH + 0.03;
  if (y > b) return 0.0;
  return pdEdge(y, b) * (uVar < 0.5 ? pdHoles(k, th, h, b) : pdSlots(k, th, h, b));
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
  pdPiv = vec3(0.0, two ? pdHi.y - pdC.y : -pdC.y, 0.0);
  vec3 fw = vec3(sin(yaw), 0.0, cos(yaw)), rt = vec3(cos(yaw), 0.0, -sin(yaw));
  vec3 rd = normalize(fw * f + rt * p.x + vec3(0.0, p.y + shift, 0.0));
  float px = 1.0 / uRes.y;

  // the room: the wall, floor or ceiling this ray comes to
  vec3 tw = (mix(pdLo, pdHi, step(0.0, rd)) - ro) / (rd + vec3(equal(rd, vec3(0.0))) * 1e-5);
  float t = min(tw.x, min(tw.y, tw.z));
  vec3 N = t == tw.x ? vec3(-sign(rd.x), 0, 0) : t == tw.y ? vec3(0, -sign(rd.y), 0) : vec3(0, 0, -sign(rd.z));
  vec3 P = ro + rd * t;
  float foot = t * px / f;
  // distances to the planes, for the dusk in the corners
  vec3 e = min(P - pdLo, pdHi - P);
  vec3 eo = mix(1.0 - 0.5 * exp(-e * 2.2), vec3(1.0), abs(N));
  float ao = eo.x * eo.y * eo.z;
  vec3 near = mix(1.0 - 0.6 * exp(-e / (0.006 + 1.3 * foot)), vec3(1.0), abs(N));   // the dark line where two planes meet
  vec3 wall = near.x * near.y * near.z * (N.y > 0.5 ? vec3(0.36, 0.31, 0.28) : N.y < -0.5 ? vec3(0.6) : vec3(0.66, 0.65, 0.64));
  if (N.y > 0.5) {        // boards
    float q = abs(fract(P.z * 4.5) - 0.5) / 4.5;
    wall *= 1.0 - 0.45 * (1.0 - smoothstep(0.003, 0.003 + foot * 2.5, q)) * pdFall(0.01, 0.1, foot);
    wall *= 0.9 + 0.2 * hash11(floor(P.z * 4.5));
  } else if (N.y == 0.0) wall *= 1.0 - 0.35 * pdFall(-foot, foot, abs(P.y - 0.11) - 0.006);

  // from here back to each lamp
  vec3 d = P - pdC;
  float D2 = dot(d, d), inc = abs(dot(N, d)) / sqrt(D2);
  d = pdLean(d);
  float rr = length(d.xz), th = atan(d.x, d.z + 1e-6);
  float s = pdR / max(rr, 0.05);
  float b = pdSoft * (0.4 + 0.3 * sqrt(D2)) + 0.6 * foot * s / max(inc, 0.25);
  float fall = 6.0 * inc / (1.3 + 0.5 * D2);
  vec3 L = vec3(0.0);
  for (int k = 0; k < 4; k++) if (pdLit[k] > 0.004) L += pdInk[k] * pdSkin(k, th + pdTh[k], pdY[k] + (d.y - pdY[k]) * s, b);
  if (uHits > 0.01) {
    L += pdInk[4] * pdHoop(th, d.y * s, b);
    float hole = rr / max(-d.y * 0.53, 0.1);            // and the dark pool under the drum fills
    if (N.y > 0.5) L += pdInk[4] * uHits * 0.32 * hole * hole * pdFall(0.9, 1.06, hole);
  }
  L *= fall;
  // light thrown back by the room, and the night outside it
  vec3 back = pdAll * vec3(1.16, 0.93, 0.74) * (0.042 + 0.05 * uLow + 0.06 * uMic + 0.04 * uSpace) * 13.0 / (3.0 + D2 * (1.0 + 0.09 * D2));
  vec3 night = vec3(0.005, 0.008, 0.017);
  vec3 col = wall * (L * 1.15 + (back + night) * ao);
  if (!two && N.y > 0.5) col *= smoothstep(-foot, foot, length(P.xz - pdC.xz) - 0.15) * 0.97 + 0.03;   // the foot of the spindle

  // the drum
  vec3 o = ro - pdC, v = rd;
  o = pdLean(o); v = pdLean(v + pdPiv) - pdPiv;
  float A = dot(v.xz, v.xz), miss = abs(o.x * v.z - o.z * v.x) / sqrt(A);
  float tc = -dot(o.xz, v.xz) / A;          // nearest the axis
  float ys = o.y + v.y * tc, fpx = max(tc, 0.01) * px / f;
  // the spindle it stands on, or the cord it hangs by
  float rod = pdFall(-fpx, fpx, miss - (two ? 0.006 : 0.016)) * step(0.0, two ? ys : -ys) * step(tc, t + 0.02) * step(0.0, tc);
  col = mix(col, vec3(0.004), rod);
  float disc = pdR * pdR - miss * miss;
  if (disc > 0.0 && tc > 0.0) {
    float q = sqrt(disc / A), t0 = tc - q; vec3 Q = o + v * t0;
    float edge = smoothstep(-fpx, fpx, pdH + 0.01 - abs(Q.y)) * pdEdge(miss - pdR + fpx, fpx);
    if (edge > 0.0) {
      float nz = sqrt(disc) / pdR;
      vec3 glow = vec3(0.0); float qa = atan(Q.x, Q.z);
      for (int k = 0; k < 4; k++) { float dy = (ys - pdY[k]) * 4.0; glow += pdInk[k] / (1.0 + dy * dy) * (0.25 + 2.5 * exp(-miss * miss * 60.0)) * pdSkin(k, qa + pdTh[k], Q.y, 0.7 * fpx); }
      glow += pdInk[4] * pdHoop(qa, Q.y, 0.7 * fpx);
      float rim = pow(1.0 - nz, 3.0);
      vec3 metal = vec3(0.001) + (pdAll * 0.12 + night * 0.6) * (rim * 0.6 + 0.12 * exp(-36.0 * (nz - 0.75) * (nz - 0.75)));
      metal *= 0.75 + 0.5 * smoothstep(0.0, 0.004, abs(abs(Q.y) - pdH + 0.035));
      col = mix(col, metal + glow * (0.3 + 0.7 * nz), edge);
    }
  }
  col += pdAll * 0.012 / (1.0 + 5.0 * miss * miss + 2.0 * ys * ys);
  return screenOf(col * 1.3);
}
