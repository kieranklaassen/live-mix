// name: Three inks
// a: Fruit and moons
// b: Far coast
// what: A poster in blue, red and yellow ink, each plate a little out of line and all its shading made of coarse grain. A bowl of plain round fruit on a striped cloth under a moon, with half a melon and two cherries, on much bare paper; or a low sun over a far coast, ridges fading into haze, and its red bars on a striped sea.
// follows: The drone thickens the blue, phrases the red, pads and textures the yellow. The spectrum fills the stripes; the piece is dusted between them in red. The low loosens the plates. A hit bursts in grain at the cherries or the lamp. A cue reprints the sheet from the top, inks moved round. Keys swell the pips or widen the bars; a voice fills the moon or halo.
vec2 tiPage;    // half the printed area
float tiPx;     // one pixel
float tiWide;   // how far apart things stand in this shape of picture
float tiBig;    // how big they are in it
float tiSea;    // how high the horizon stands in b
float tiBlue, tiRed, tiGold; // how thick each ink is, 0 to 1

// how much of a shape covers this place, from its distance
float tiIn(float d) { return 1.0 - smoothstep(-tiPx, tiPx, d); }
// a gradient g (0 bare to 1 heavy) printed with ink of thickness k
float tiRamp(float g, float k) { return sat(mix(0.08 + 0.82 * g * sqrt(g), 0.2 + 0.88 * g, k)); }
float tiHalf(vec2 q, float r, vec2 up) { return max(length(q) - r, dot(q, up)); }
// a leaf along x, l half its length, w half its width
float tiLeaf(vec2 q, float l, float w) {
  float c = (l * l - w * w) / (2.0 * w);
  return length(vec2(q.x, abs(q.y) + c)) - (c + w);
}
// a stem: a bent stroke from a to b
float tiStem(vec2 q, vec2 a, vec2 b, float bend, float w) {
  vec2 ab = b - a;
  float h = sat(dot(q - a, ab) / dot(ab, ab));
  vec2 c = a + ab * h + vec2(-ab.y, ab.x) * bend * 4.0 * h * (1.0 - h);
  return (length(q - c) - w * (1.0 - 0.35 * h)) * 0.9;
}
// the speckle of one plate: a number from 0 to 1, evenly spread, in clumps about two pixels wide
float tiGrain(vec2 p, float turn, float cell) {
  vec2 q = rot(turn) * p / cell + turn * 37.0;
  float n = 0.66 * noise(q) + 0.34 * noise(rot(1.1) * q * 1.9 + 11.0);
  return smoothstep(0.13, 0.87, n);
}
// where something stands on the table of a, and where it hangs in its sky
vec2 tiOn(vec2 p, vec2 at) { return (p - vec2(at.x * tiWide, -0.24)) / tiBig - vec2(0.0, at.y); }
vec2 tiAt(vec2 p, vec2 at) { return (p - vec2(at.x * tiWide, at.y)) / tiBig; }
vec2 tiCherry(float k) {
  float s = 0.006 * sin(uTime * 0.23 + k * 1.3);
  return vec2(0.705 + 0.085 * k + s / tiWide, 0.43 - (0.27 + 0.085 * k) * tiBig);
}

// ---- a: fruit and moons, one plate at a time ----
float tiBlueA(vec2 p) {
  float t = 0.0;
  // the bowl: a half moon lying on its back, and its foot
  vec2 q = tiOn(p, vec2(0.12, 0.315));
  float bowl = min(tiHalf(q, 0.3, vec2(0.0, 1.0)), max(abs(q.x) - 0.1, abs(q.y + 0.298) - 0.017));
  t = max(t, tiIn(bowl * tiBig) * tiRamp(sat(0.3 - q.y * 1.9 + q.x * 0.9), tiBlue));
  // the moon's dark side, which slides across it over minutes
  q = tiAt(p, vec2(-0.6, 0.255));
  float m = max(length(q) - 0.135, 0.135 - length(q - vec2(0.11 + 0.05 * sin(uTravel * 0.035), 0.05)));
  t = max(t, tiIn(m * tiBig) * tiRamp(sat(0.65 - q.x * 3.0), tiBlue));
  // a plum at the right, and leaves
  q = tiOn(p, vec2(0.6, 0.105));
  t = max(t, tiIn((length(q) - 0.105) * tiBig) * tiRamp(sat(0.55 - q.y * 4.0 + q.x * 2.0), tiBlue));
  q = rot(-0.5) * tiOn(p, vec2(-0.02, 0.6));
  t = max(t, tiIn(tiLeaf(q - vec2(0.13, 0.02), 0.12, 0.045) * tiBig) * tiRamp(sat(0.9 - q.x * 3.2), tiBlue));
  // the melon's pips, fatter and darker as the keys are played
  q = tiOn(p, vec2(-0.54, -0.02));
  for (int i = 0; i < 5; i++) {
    vec2 e = rot((float(i) - 2.0) * 0.56) * q - vec2(0.0, 0.115);
    t = max(t, tiIn(tiLeaf(e.yx, 0.02 + 0.012 * uKeys, 0.0075 + 0.007 * uKeys) * tiBig) * mix(0.7, 1.0, uKeys));
  }
  // stems
  q = tiOn(p, vec2(-0.02, 0.0));
  float s = tiStem(q, vec2(0.0, 0.53), vec2(0.03, 0.655), 0.1, 0.008);
  vec2 top = vec2(0.765, 0.43);
  q = tiAt(p, top);
  for (int i = 0; i < 2; i++) s = min(s, tiStem(q, vec2(0.0), (tiCherry(float(i)) - top) * vec2(tiWide / tiBig, 1.0 / tiBig), 0.06 - 0.16 * float(i), 0.006));
  t = max(t, tiIn(s * tiBig) * 0.97);
  q = rot(0.75) * (q - vec2(-0.005, -0.03)) + vec2(0.1, 0.0);
  t = max(t, tiIn(tiLeaf(q, 0.1, 0.036) * tiBig) * tiRamp(sat(0.6 + q.x * 4.0), tiBlue));
  // stripes of the cloth: each is as long as its part of the spectrum is loud
  float x = (p.x / tiPage.x * 0.5 + 0.5) * 16.0, i = floor(x);
  float dn = (-0.24 - p.y) / 0.26;
  if (dn > -0.02) {
    float b = uBands[int(clamp(i, 0.0, 15.0))];
    float st = tiIn((abs(x - i - 0.5) - 0.23) * tiPage.x / 8.0) * tiIn(-dn * 0.26);
    t = max(t, st * tiRamp(sat(1.0 - dn / (0.55 + 0.9 * sqrt(sat(b)))), 0.35 + 0.65 * tiBlue));
  }
  return t;
}
float tiRedA(vec2 p) {
  float t = 0.0;
  // the big fruit in the bowl
  vec2 q = tiOn(p, vec2(-0.02, 0.385));
  t = max(t, tiIn((length(q) - 0.19) * tiBig) * tiRamp(sat(0.52 + q.x * -1.7 + q.y * 1.7), tiRed));
  // a small one at the back
  q = tiOn(p, vec2(0.2, 0.48));
  t = max(t, tiIn((length(q) - 0.105) * tiBig) * tiRamp(sat(0.5 + q.x * 4.0), tiRed) * 0.8);
  // half a melon, standing on its cut like a moon coming up
  q = tiOn(p, vec2(-0.54, 0.0));
  t = max(t, tiIn(tiHalf(q, 0.21, vec2(0.0, -1.0)) * tiBig) * tiRamp(sat(1.05 - q.y * 4.3), tiRed));
  // two cherries, where a hit lands
  for (int i = 0; i < 2; i++) {
    q = tiAt(p, tiCherry(float(i)));
    float r = length(q);
    t = max(t, tiIn((r - 0.052) * tiBig) * max(tiRamp(sat(0.65 + q.x * 6.0 - q.y * 5.0), tiRed), uHits));
    float ring = max(max(r - 0.09 - 0.18 * (1.0 - uHits), 0.05 + 0.2 * (1.0 - uHits) - r), 0.0) * 20.0;
    t = max(t, uHits * 0.6 * exp(-ring * ring));
  }
  // the piece, dusted on the cloth between the stripes
  float dn = (-0.24 - p.y) / 0.23;
  if (dn > 0.0) {
    float x = p.x / tiPage.x * 0.5 + 0.5;
    float m = sat(piece(vec2(x, sat(dn))).a);
    t = max(t, 0.85 * m * tiIn((0.24 - abs(fract(x * 16.0) - 0.5)) * tiPage.x / 8.0));
  }
  return t;
}
float tiGoldA(vec2 p) {
  float t = 0.0;
  // the great pale round behind everything
  vec2 q = tiOn(p, vec2(0.33, 0.4));
  t = max(t, tiIn((length(q) - 0.285) * tiBig) * tiRamp(sat(0.5 + q.y * 1.6 + q.x * 0.6), 0.75 * tiGold));
  // the lemon
  q = tiOn(p, vec2(0.28, 0.37));
  float d = length(q) - 0.14;
  t = mix(t, tiRamp(sat(0.9 - q.y * 3.0), 0.5 + 0.5 * tiGold), tiIn(d * tiBig));
  // the melon's heart, the moon, the fruit's blush, the leaf
  q = tiOn(p, vec2(-0.54, 0.0));
  t = max(t, tiIn(tiHalf(q, 0.15, vec2(0.0, -1.0)) * tiBig) * tiRamp(sat(0.35 + q.y * 5.0), tiGold));
  q = tiAt(p, vec2(-0.6, 0.255));
  t = max(t, tiIn((length(q) - 0.135) * tiBig) * tiRamp(sat(0.65 + q.x * 2.4), max(tiGold, uMic)));
  q = tiOn(p, vec2(-0.02, 0.385));
  t = max(t, tiIn((length(q) - 0.19) * tiBig) * tiRamp(sat(0.45 + q.x * 2.4 - q.y * 1.2), tiGold));
  q = rot(-0.5) * tiOn(p, vec2(-0.02, 0.6));
  t = max(t, tiIn(tiLeaf(q - vec2(0.13, 0.02), 0.12, 0.045) * tiBig) * 0.9);
  q = rot(0.75) * (tiAt(p, vec2(0.765, 0.43)) - vec2(-0.005, -0.03)) + vec2(0.1, 0.0);
  t = max(t, tiIn(tiLeaf(q, 0.1, 0.036) * tiBig) * 0.8);
  // the cloth
  float dn = (-0.24 - p.y) / 0.26;
  t = max(t, tiIn(-dn * 0.26) * tiRamp(sat(0.1 + 0.8 * dn), tiGold) * 0.85);
  return t;
}

// ---- b: far coast, one plate at a time ----
// the land, from the far range to the near slope: above 0 it covers this place. d is how far under its ridge that is
float tiLand(vec2 p, int k, out float d) {
  float x = p.x / tiWide, fk = float(k), top, foot = tiSea;
  if (k == 0) top = tiSea + 0.008 + 0.1 * exp(-(x + 0.3) * (x + 0.3) * 5.3) + 0.06 * exp(-(x - 0.6) * (x - 0.6) * 10.2);
  else if (k == 1) { foot = tiSea - 0.018; top = foot - 0.03 + 0.26 * smoothstep(0.3, 1.0, x); }
  else if (k == 2) { foot = tiSea - 0.06; top = foot - 0.03 + 0.33 * (1.0 - smoothstep(-0.72, -0.02, x)) - 0.1 * smoothstep(0.66, 1.0, -x); }
  else { foot = -1.0; top = -0.6 + 0.4 * (1.0 - smoothstep(-0.95, 0.42, x)); }
  d = -1.0;
  if (p.y > top + 0.03 || p.y < foot - 0.01) return 0.0;
  d = top + 0.02 * noise(vec2(x * 6.0 + 40.0, fk * 5.3)) + 0.006 * noise(vec2(x * 21.0 + 40.0, fk * 3.1)) - p.y;
  return min(tiIn(-d * 0.9), tiIn(foot - p.y));
}
vec2 tiSun() { return vec2(0.17 * tiWide, 0.115 + 0.012 * sin(uTravel * 0.03)); }
float tiCloud(vec2 p) {
  vec2 q = (p - vec2((-0.1 + 0.06 * sin(uTravel * 0.021)) * tiWide, 0.15)) / tiBig;
  vec2 e = (p - vec2((0.36 + 0.06 * sin(uTravel * 0.016 + 1.0)) * tiWide, 0.08)) / tiBig;
  return min(tiLeaf(q, 0.26, 0.015), tiLeaf(e, 0.21, 0.012)) * tiBig;
}
// the sea's ten stripes: x the place in one (0 its top), y which, narrower towards the horizon
vec2 tiStripe(vec2 p) {
  float s = sat((tiSea - p.y) / (tiSea + 0.5));
  float v = 10.0 * pow(s, 0.75) + 0.16 * sin(p.x * 6.0 / tiBig + s * 11.0 + uTime * 0.11) * s;
  return vec2(fract(max(v, 0.0)), clamp(floor(v), 0.0, 9.0));
}
// the sun lying on the water, a bar in each stripe
float tiGlitter(vec2 p, vec2 s) {
  float w = (0.06 + 0.13 * hash11(s.y + 5.0) + 0.04 * sin(uTime * 0.31 + s.y * 2.1) + 0.06 * uKeys) * tiBig;
  return tiIn(abs(p.x - tiSun().x - 0.03 * sin(s.y * 1.7)) - w * (1.1 - 0.5 * s.x)) * smoothstep(0.0, 26.0 / uRes.y, s.x) * (1.0 - smoothstep(0.62, 0.62 + 26.0 / uRes.y, s.x));
}
float tiBlueB(vec2 p) {
  // the top of the sky
  vec2 q = (p - tiSun()) / tiBig;
  float t = tiRamp(sat((p.y - 0.17) * 2.9), tiBlue) * smoothstep(0.14, 0.26, p.y) * (1.0 - tiIn((length(q - vec2(-0.045, 0.015)) - 0.262) * tiBig));
  float sea = tiIn(p.y - tiSea);
  if (sea > 0.0) {
    vec2 s = tiStripe(p);
    float b = sat(band(s.y / 9.0));
    t = mix(t, tiRamp(sat(1.0 - s.x * (1.9 - 0.95 * b)), 0.15 + 0.4 * tiBlue) * (1.0 - tiGlitter(p, s)) * smoothstep(0.0, 26.0 / uRes.y, s.x), sea);
  }
  for (int k = 0; k < 4; k++) {
    float d, a = tiLand(p, k, d);
    float g = sat(1.0 - d / vec4(0.12, 0.17, 0.22, 0.25)[k]);
    t = mix(t, tiRamp(g, tiBlue) * vec4(0.62, 0.8, 0.95, 1.0)[k], a);
  }
  return t;
}
float tiRedB(vec2 p) {
  vec2 q = (p - tiSun()) / tiBig;
  float t = tiIn((length(q) - 0.2) * tiBig) * tiRamp(sat(0.6 + q.y * 2.2), 0.3 + 0.7 * tiRed) * (1.0 - tiIn(tiCloud(p)));
  float sea = tiIn(p.y - tiSea);
  if (sea > 0.0) {
    vec2 s = tiStripe(p);
    float w = tiGlitter(p, s) * tiRamp(sat(1.0 - s.x * 0.8), 0.4 + 0.6 * tiRed);
    float m = piece(vec2(p.x / tiPage.x * 0.5 + 0.5, sat((tiSea - p.y) / (tiSea + 0.5)))).a;
    t = mix(t, max(w, 0.75 * sat(m) * smoothstep(0.3, 1.0, s.x)), sea);
  }
  for (int k = 0; k < 4; k++) {
    float d, a = tiLand(p, k, d);
    if (k == 1) {
      // a tower on the right point
      vec2 e = (p - vec2(0.66 * tiWide, tiSea + 0.07)) / tiBig;
      float thick = 0.013 - 0.04 * (e.y - 0.05);
      t = max(t, tiIn(max(abs(e.x) - thick, abs(e.y - 0.06) - 0.06) * tiBig) * (0.95 - 0.9 * tiIn((abs(e.y - 0.078) - 0.008) * tiBig)));
    }
    if (k == 0) a = 0.0;
    t = mix(t, k == 3 ? tiRamp(sat(0.35 + d * 2.6), tiRed) : 0.0, a);
  }
  return t;
}
float tiGoldB(vec2 p) {
  vec2 q = (p - tiSun()) / tiBig;
  float t = tiIn((length(q - vec2(-0.045, 0.015)) - 0.262) * tiBig) * tiRamp(sat(0.55 - q.y * 1.6 + q.x * 1.4), max(tiGold, uMic));
  t = max(t, 0.92 * tiIn(tiCloud(p)));
  t *= 1.0 - tiIn(p.y - tiSea);
  // the tower's lamp: a hit lights it, and the light goes out from it in grain
  vec2 e = (p - vec2(0.66 * tiWide, tiSea + 0.07 + 0.127 * tiBig)) / tiBig;
  float r = length(e), ring = max(max(r - 0.1 - 0.2 * (1.0 - uHits), 0.04 + 0.24 * (1.0 - uHits) - r), 0.0) * 18.0;
  float lamp = max(0.9 * tiIn((r - 0.013) * tiBig), uHits * 0.8 * exp(-ring * ring));
  for (int k = 0; k < 4; k++) {
    float d, a = tiLand(p, k, d);
    if (k == 0) a = 0.0;
    t = mix(t, k == 2 ? tiRamp(sat(0.5 + d * 3.0), tiGold) : 0.0, a);
    if (k == 1) t = max(t, lamp);
  }
  return t;
}

vec3 render(vec2 p) {
  tiSea = -0.07;
  tiPx = 0.75 / uRes.y;
  float hw = 0.5 * uRes.x / uRes.y;
  tiPage = vec2(hw, 0.5) - 0.03;
  tiWide = clamp(1.0 + 1.22 * (hw - 0.89), 0.24, 1.3);
  tiBig = clamp(hw / 0.62, uVar < 0.5 ? 0.5 : 0.62, 1.0);
  tiBlue = sat(0.8 * uDrone + 0.25 * uLow) * (0.75 + 0.5 * uEnergy);
  tiRed = sat(0.9 * uPhrase + 0.3 * uMid + 0.3 * uHits) * (0.75 + 0.5 * uEnergy);
  tiGold = sat(0.6 * uPad + 0.5 * uTexture + 0.2 * uHigh) * (0.75 + 0.5 * uEnergy);
  // and each swells a little by itself, one after another
  tiBlue = sat(tiBlue + 0.1 + 0.1 * sin(uTime * 0.29));
  tiRed = sat(tiRed + 0.1 + 0.1 * sin(uTime * 0.23 + 2.1));
  tiGold = sat(tiGold + 0.1 + 0.1 * sin(uTime * 0.19 + 4.2));

  // the plates lie a little out of register; the low breathes in it and a hit knocks one
  float knock = 4.0 * uHits * (1.0 - uHits);
  float br = 0.5 + 0.4 * uLow + 0.4 * uSpace;
  vec2 oR = vec2(0.003, -0.0018) * br + vec2(1.2, 0.8) / uRes.y * knock;
  vec2 oG = vec2(-0.0022, -0.0024) * br;
  vec2 pR = p - oR, pG = p - oG;

  float cell = max(1.6 / uRes.y, 1.0 / 330.0);
  float w = mix(0.2, 0.08, uTone);
  vec3 g = vec3(tiGrain(p, 0.35, cell), tiGrain(pR, 1.27, cell), tiGrain(pG, 2.2, cell));
  vec3 t;
  if (uVar < 0.5) t = vec3(tiBlueA(p), tiRedA(pR), tiGoldA(pG));
  else t = vec3(tiBlueB(p), tiRedB(pR), tiGoldB(pG));
  // the edge of each plate
  t.x *= tiIn(max(abs(p.x) - tiPage.x, abs(p.y) - tiPage.y));
  t.y *= tiIn(max(abs(pR.x) - tiPage.x, abs(pR.y) - tiPage.y));
  t.z *= tiIn(max(abs(pG.x) - tiPage.x, abs(pG.y) - tiPage.y));
  // a drum never lays its ink quite evenly
  float lay = noise(p * vec2(3.0, 7.0) + 3.0);
  t *= 0.93 + 0.1 * lay;
  vec3 ink = smoothstep(-w, w, t * (1.0 + 2.0 * w) - w - g);

  vec3 blue = mix(vec3(0.13, 0.36, 0.62), uKind[0], 0.15);
  vec3 red = mix(vec3(1.0, 0.3, 0.25), uKind[4], 0.12);
  vec3 gold = mix(vec3(1.0, 0.81, 0.2), uKind[2], 0.12);
  vec3 col = vec3(0.955, 0.932, 0.88);
  col *= 0.985 + 0.03 * noise(p * 190.0);
  // a cue prints the sheet again from the top, with the inks moved round: the fresh strip goes down and dries
  float front = 0.36 - 1.5 * (1.0 - uCue);
  float y = p.y + 0.05 * (g.x - 0.5) + 0.02 * sin(p.x * 3.0);
  float sw = smoothstep(front - 0.09, front, y) * (1.0 - smoothstep(front + 0.45, front + 0.75, y)) * sat(uCue * 5.0);
  vec3 b0 = blue, r0 = red;
  blue = mix(blue, r0, sw); red = mix(red, gold, sw); gold = mix(gold, b0, sw);
  col *= mix(vec3(1.0), blue, ink.x * 0.97);
  col *= mix(vec3(1.0), red, ink.y * 0.97);
  col *= mix(vec3(1.0), gold, ink.z * 0.97);
  return col;
}
