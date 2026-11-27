// name: Three inks
// a: Fruit and moons
// b: Far coast
// what: A poster in blue, red and yellow ink, each plate a little out of line and all its shading made of coarse grain. A bowl of plain round fruit on a striped cloth under a moon, with half a melon and two cherries, on much bare paper; or a low sun over a far coast, ridges fading into haze, and its red bars on a striped sea.
// follows: The drone thickens the blue, phrases the red, pads and textures the yellow. The spectrum fills the stripes; the piece is dusted between them in red. The low loosens the plates. A hit bursts in grain at the cherries or the lamp. A cue reprints the sheet from the top, inks moved round. Keys swell the pips or widen the bars; a voice fills the moon or halo.
// own: 0 the sheet: 1 black paper and light ink, -1 rolled all over first from the pad's colour to the texture's; 1 1 inks in the sounds' colours, -1 flat, light and shadow parted by a hard line and the plates out of line; 2 the shading: 1 cut lines, -1 round dots; 3 1 cut with corners (b: steep peaks, one side in snow), -1 blossoms in a cup (b: a town of gables and lit windows); 4 1 a sheet of nine small prints each a little different, -1 nearly all taken away; 5 the eye: 1 from high above (b: islands), -1 low and close; 6 under it: 1 checks (b: fields), -1 a mirror; 7 1 rays from the disc, -1 rain
vec2 tiPage;    // half the printed area
float tiPx;     // one pixel
float tiWide;   // how far apart things stand in this shape of picture
float tiBig;    // how big they are in it
float tiSea;    // how high the horizon stands in b
float tiBlue, tiRed, tiGold; // how thick each ink is, 0 to 1
float tiForm;   // own 3 here: the prints of a sheet differ in it
float tiGone, tiFew; // how far what is taken away has shrunk; how nearly alone the fruit is
float tiHigh, tiLow; // the eye
float tiEdge = -0.24, tiTab = -0.24; // where the cloth begins in a, and where what lies on it stands
float tiDisc;   // how big the sun is in b
float tiMask;   // where things cover what is behind them
float tiFace, tiWin, tiLamp; // of a piece of land: its snow side, its windows, the lit ones
int tiLands = 4;

// how much of a shape covers this place, from its distance
float tiIn(float d) { return 1.0 - smoothstep(-tiPx, tiPx, d); }
// a gradient g (0 bare to 1 heavy) printed with ink of thickness k
float tiRamp(float g, float k) { return sat(mix(0.08 + 0.82 * g * sqrt(g), 0.2 + 0.88 * g, k)); }
// a round of radius r: cut with corners, or opened into petals
float tiRnd(vec2 q, float r) {
  float l = length(q);
  if (tiForm > 0.0) {
    vec2 e = rot(r * 29.0) * q;
    l = mix(l, 0.93 * max(max(abs(e.x), abs(dot(e, vec2(0.45, 0.893)))), abs(dot(e, vec2(-0.62, 0.785)))), tiForm);
  }
  if (tiForm < 0.0) {
    float a = l > 1e-4 ? atan(q.y, q.x) : 0.0, n = 2.5 + floor(fract(r * 37.0) * 4.0);
    l += r * -tiForm * (0.06 - 0.26 * abs(cos(a * n + r * 50.0)));
  }
  return l - r;
}
float tiHeart(vec2 q, float r) { return tiForm < 0.0 ? -tiForm * tiIn((length(q) - 0.3 * r) * tiBig) : 0.0; }
float tiHalf(vec2 q, float r, vec2 up) { return max(tiRnd(q, r), dot(q, up) - r * 1.3 * tiHigh); }
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
// rays out of a disc: one ink's, and the other's between them
vec2 tiRays(vec2 q) {
  float r = length(q), a = r > 1e-4 ? atan(q.y, q.x) : 0.0, s = sin(a * 11.0 + uTime * 0.05), w = 22.0 * tiPx / (tiBig * max(r, 0.05));
  float fade = tiRamp(sat(1.15 - 0.75 * r), 0.8);
  return vec2(smoothstep(-w, w, s), smoothstep(w, -w, s)) * fade;
}
// two other ways to shade: cut lines, and round dots
float tiLine(vec2 p, float k) {
  vec2 q = rot(k < 0.5 ? 0.0 : k < 1.5 ? -0.5 : 0.62) * p;
  float y = q.y * 50.0 + 1.6 * sin(q.x * 5.0 + k) + 2.2 * noise(q * vec2(5.0, 9.0) + k * 9.0);
  return 0.08 + 0.84 * abs(2.0 * fract(y) - 1.0);
}
float tiDot(vec2 p, float turn) {
  vec2 q = rot(turn) * p * 38.0 * TAU;
  return sat(0.5 + 0.27 * (cos(q.x) + cos(q.y)));
}
// where something stands on the table of a, and where it hangs in its sky
vec2 tiOn(vec2 p, vec2 at) { return (p - vec2(at.x * tiWide, tiTab)) / tiBig - vec2(0.0, at.y); }
// what stands in the bowl, higher when it is in bloom; and the one fruit that stays
vec2 tiIn2(vec2 p, vec2 at) { return tiOn(p, at + vec2(0.4 * (at.x - 0.12), 0.1) * max(-tiForm, 0.0) * (1.0 - tiHigh)); }
vec2 tiFruit(vec2 p) { return tiIn2(p, mix(vec2(-0.02, 0.385), vec2(0.14, 0.24), tiFew)) / (1.0 + 0.3 * tiFew); }
vec2 tiAt(vec2 p, vec2 at) { return (p - vec2(at.x * tiWide, at.y)) / tiBig; }
vec2 tiCherry(float k) {
  float s = 0.006 * sin(uTime * 0.23 + k * 1.3);
  return vec2(0.705 + 0.085 * k + s / tiWide, 0.43 - (0.27 + 0.085 * k) * tiBig);
}

// ---- a: fruit and moons, one plate at a time ----
float tiBowl(vec2 q) {
  vec2 e = vec2(q.x * (1.0 + 0.8 * max(-tiForm, 0.0) * (1.0 - tiHigh)), q.y);
  return min(max(tiForm > 0.0 ? mix(length(e), max(abs(e.x) * 0.62 - e.y * 0.5, abs(e.y)), tiForm) - 0.3 : length(e) - 0.3, e.y - 0.4 * tiHigh), max(abs(e.x) - 0.1, abs(e.y + 0.298) - 0.017) + tiHigh) + tiGone;
}
// where the things of a are
float tiThings(vec2 p) {
  float d = tiBowl(tiOn(p, vec2(0.12, 0.315)));
  d = min(d, tiRnd(tiOn(p, vec2(0.6, 0.105)), 0.105) + tiGone);
  d = min(d, tiRnd(tiFruit(p), 0.19));
  d = min(d, tiRnd(tiIn2(p, vec2(0.2, 0.48)), 0.105) + tiGone);
  d = min(d, tiHalf(tiOn(p, vec2(-0.54, 0.0)), 0.21, vec2(0.0, -1.0)) + tiGone);
  d = min(d, length(tiOn(p, vec2(0.33, 0.4))) - 0.285 + tiGone);
  d = min(d, length(tiAt(p, vec2(-0.6, 0.255))) - 0.135);
  return tiIn(d * tiBig);
}
// the stalks of what is in bloom
float tiStalks(vec2 p) {
  vec2 q = tiOn(p, vec2(0.12, 0.2)), f = vec2(-0.16, 0.315), up = vec2(0.1, 0.4);
  float w = 0.009 * sat(-2.0 * tiForm) * (1.0 - tiHigh);
  float d = tiStem(tiFruit(p), mix(vec2(0.16, -0.3), vec2(0.03, -0.25), tiFew), vec2(0.0, -0.1), 0.06, w);
  return min(d, min(tiStem(q, vec2(0.0), up, 0.05, w), tiStem(q, vec2(0.02, 0.0), vec2(0.2, 0.26), -0.1, w)) + tiGone) + 0.01 - w;
}
float tiBlueA(vec2 p) {
  float t = 0.0;
  // the bowl: a half moon lying on its back, and its foot
  vec2 q = tiOn(p, vec2(0.12, 0.315));
  float bowl = tiBowl(q);
  t = max(t, tiIn(bowl * tiBig) * tiRamp(sat(0.3 - q.y * 1.9 + q.x * 0.9), tiBlue));
  // the moon's dark side, which slides across it over minutes
  q = tiAt(p, vec2(-0.6, 0.255));
  float m = max(length(q) - 0.135, 0.135 - length(q - vec2(0.11 + 0.05 * sin(uTravel * 0.035), 0.05)));
  t = max(t, tiIn(m * tiBig) * tiRamp(sat(0.65 - q.x * 3.0), tiBlue));
  // a plum at the right, and leaves
  q = tiOn(p, vec2(0.6, 0.105));
  t = max(t, tiIn((tiRnd(q, 0.105) + tiGone) * tiBig) * tiRamp(sat(0.55 - q.y * 4.0 + q.x * 2.0), tiBlue));
  q = rot(-0.5) * (tiFruit(p) - vec2(0.0, 0.215));
  t = max(t, tiIn(tiLeaf(q - vec2(0.13, 0.02), 0.12, 0.045) * tiBig) * tiRamp(sat(0.9 - q.x * 3.2), tiBlue));
  // the melon's pips, fatter and darker as the keys are played
  q = tiOn(p, vec2(-0.54, -0.02));
  for (int i = 0; i < 5; i++) {
    vec2 e = rot((float(i) - 2.0) * (0.56 + 0.7 * tiHigh)) * q - vec2(0.0, 0.115);
    t = max(t, tiIn((tiLeaf(e.yx, 0.02 + 0.012 * uKeys, 0.0075 + 0.007 * uKeys) + tiGone) * tiBig) * mix(0.7, 1.0, uKeys));
  }
  // stems
  q = tiFruit(p) + vec2(0.0, 0.385);
  float s = tiStem(q, vec2(0.0, 0.53), vec2(0.03, 0.655), 0.1, 0.008);
  vec2 top = vec2(0.765, 0.43);
  q = tiAt(p, top);
  for (int i = 0; i < 2; i++) s = min(s, tiStem(q, vec2(0.0), (tiCherry(float(i)) - top) * vec2(tiWide / tiBig, 1.0 / tiBig), 0.06 - 0.16 * float(i), 0.006) + tiGone);
  if (tiForm < 0.0) s = min(s, tiStalks(p));
  t = max(t, tiIn(s * tiBig) * 0.97);
  q = rot(0.75) * (q - vec2(-0.005, -0.03)) + vec2(0.1, 0.0);
  t = max(t, tiIn((tiLeaf(q, 0.1, 0.036) + tiGone) * tiBig) * tiRamp(sat(0.6 + q.x * 4.0), tiBlue));
  // stripes of the cloth: each is as long as its part of the spectrum is loud
  float x = (p.x / tiPage.x * 0.5 + 0.5) * 16.0, i = floor(x);
  float dn = (tiEdge - p.y) / (0.26 + tiEdge + 0.24);
  if (dn > -0.02) {
    float b = uBands[int(clamp(i, 0.0, 15.0))];
    float st = tiIn((abs(x - i - 0.5) - 0.23) * tiPage.x / 8.0) * tiIn(-dn * 0.26);
    if (uOwn[6] > 0.0) {
      // checks: the bars across are as long, and where the two cross the ink is whole
      float y = (p.y - tiEdge) / tiPage.x * 8.0 * mix(2.4, 1.0, sat(tiHigh * 2.0)), j = floor(y);
      st = mix(st, (0.5 * st + 0.55 * tiIn((abs(y - j - 0.5) - 0.25) * tiPage.x / 8.0)) * tiIn(-dn * 0.26), uOwn[6]);
    }
    st *= 1.0 - tiHigh * tiMask;
    t = max(t, st * tiRamp(sat(1.0 - dn / (0.55 + 0.9 * sqrt(sat(b)))), 0.35 + 0.65 * tiBlue));
  }
  return t;
}
float tiRedA(vec2 p) {
  float t = 0.0;
  // the big fruit in the bowl
  vec2 q = tiFruit(p);
  t = max(t, tiIn(tiRnd(q, 0.19) * tiBig) * tiRamp(sat(0.52 + q.x * -1.7 + q.y * 1.7), tiRed) * (1.0 - 0.85 * tiHeart(q, 0.19)));
  if (uOwn[7] > 0.0) t = max(t, uOwn[7] * 0.9 * tiRays(tiOn(p, vec2(0.33, 0.4))).y * (1.0 - tiMask) * tiIn(tiEdge - p.y));
  // a small one at the back
  q = tiIn2(p, vec2(0.2, 0.48));
  t = max(t, tiIn((tiRnd(q, 0.105) + tiGone) * tiBig) * tiRamp(sat(0.5 + q.x * 4.0), tiRed) * 0.8);
  // half a melon, standing on its cut like a moon coming up
  q = tiOn(p, vec2(-0.54, 0.0));
  t = max(t, tiIn((tiHalf(q, 0.21, vec2(0.0, -1.0)) + tiGone) * tiBig) * tiRamp(sat(1.05 - q.y * 4.3), tiRed));
  // two cherries, where a hit lands
  for (int i = 0; i < 2; i++) {
    q = tiAt(p, tiCherry(float(i)));
    float r = length(q);
    t = max(t, tiIn((tiRnd(q, 0.052) + tiGone) * tiBig) * max(tiRamp(sat(0.65 + q.x * 6.0 - q.y * 5.0), tiRed), uHits));
    float ring = max(max(r - 0.09 - 0.18 * (1.0 - uHits), 0.05 + 0.2 * (1.0 - uHits) - r), 0.0) * 20.0;
    t = max(t, uHits * 0.6 * exp(-ring * ring));
  }
  // the piece, dusted on the cloth between the stripes
  float dn = (tiEdge - p.y) / (0.23 + tiEdge + 0.24);
  if (dn > 0.0) {
    float x = p.x / tiPage.x * 0.5 + 0.5;
    float m = sat(piece(vec2(x, sat(dn))).a);
    t = max(t, 0.85 * m * tiIn((0.24 - abs(fract(x * 16.0) - 0.5)) * tiPage.x / 8.0) * (1.0 - tiHigh * tiMask));
  }
  return t;
}
float tiGoldA(vec2 p) {
  float t = 0.0;
  // the great pale round behind everything
  vec2 q = tiOn(p, vec2(0.33, 0.4));
  if (uOwn[7] > 0.0) t = uOwn[7] * tiRays(q).x * (1.0 - tiMask) * tiIn(tiEdge - p.y);
  t = max(t, tiIn((length(q) - 0.285 + tiGone) * tiBig) * tiRamp(sat(0.5 + q.y * 1.6 + q.x * 0.6), 0.75 * tiGold));
  // the lemon
  q = tiIn2(p, vec2(0.28, 0.37));
  float d = tiRnd(q, 0.14) + tiGone;
  t = mix(t, tiRamp(sat(0.9 - q.y * 3.0), 0.5 + 0.5 * tiGold), tiIn(d * tiBig));
  // the melon's heart, the moon, the fruit's blush, the leaf
  q = tiOn(p, vec2(-0.54, 0.0));
  t = max(t, tiIn((tiHalf(q, 0.15, vec2(0.0, -1.0)) + tiGone) * tiBig) * tiRamp(sat(0.35 + q.y * 5.0), tiGold));
  q = tiAt(p, vec2(-0.6, 0.255));
  t = max(t, tiIn((length(q) - 0.135) * tiBig) * tiRamp(sat(0.65 + q.x * 2.4), max(tiGold, uMic)));
  q = tiFruit(p);
  t = max(t, tiIn(tiRnd(q, 0.19) * tiBig) * tiRamp(sat(0.45 + q.x * 2.4 - q.y * 1.2), tiGold));
  t = max(t, tiHeart(q, 0.19));
  q = rot(-0.5) * (q - vec2(0.0, 0.215));
  t = max(t, tiIn(tiLeaf(q - vec2(0.13, 0.02), 0.12, 0.045) * tiBig) * 0.9);
  q = rot(0.75) * (tiAt(p, vec2(0.765, 0.43)) - vec2(-0.005, -0.03)) + vec2(0.1, 0.0);
  t = max(t, tiIn((tiLeaf(q, 0.1, 0.036) + tiGone) * tiBig) * 0.8);
  // the cloth
  float dn = (tiEdge - p.y) / (0.26 + tiEdge + 0.24);
  t = max(t, tiIn(-dn * 0.26) * tiRamp(sat(0.1 + 0.8 * dn), tiGold) * 0.85 * (1.0 - tiHigh * tiMask));
  return t;
}

// ---- b: far coast, one plate at a time ----
// the land, from the far range to the near slope: above 0 it covers this place. d is how far under its ridge that is
float tiLand(vec2 p, int k, out float d) {
  float x = p.x / tiWide, fk = float(k), top, foot = tiSea, cw = k == 0 ? 0.05 : 0.07 + 0.016 * fk, town = max(-tiForm, 0.0), u = 0.0, h = 0.0;
  tiFace = tiWin = tiLamp = 0.0;
  if (town > 0.0) {
    u = x / cw + fk * 0.37; h = hash11(floor(u) + fk * 31.0);
    x = mix(x, (floor(u) + 0.5 - fk * 0.37) * cw, town); u = fract(u);
  }
  if (k == 0) top = tiSea + 0.008 + 0.1 * exp(-(x + 0.3) * (x + 0.3) * 5.3) + 0.06 * exp(-(x - 0.6) * (x - 0.6) * 10.2);
  else if (k == 1) { foot = tiSea - 0.018; top = foot - 0.03 + 0.26 * smoothstep(0.3, 1.0, x); }
  else if (k == 2) { foot = tiSea - 0.06; top = foot - 0.03 + 0.33 * (1.0 - smoothstep(-0.72, -0.02, x)) - 0.1 * smoothstep(0.66, 1.0, -x); }
  else if (k == 3) { foot = -1.0; top = -0.6 + 0.4 * (1.0 - smoothstep(-0.95, 0.42, x)); }
  else {
    // islands, out on the sea
    float n = x < -0.28 ? 0.0 : x < 0.2 ? 1.0 : 2.0, c = x - (n < 0.5 ? -0.6 : n < 1.5 ? -0.02 : 0.52);
    foot = tiSea - (n < 0.5 ? 0.2 : n < 1.5 ? 0.33 : 0.16);
    top = foot - 0.07 + (n < 1.5 ? 0.17 : 0.13) * tiHigh * exp(-c * c * (n < 0.5 ? 26.0 : n < 1.5 ? 40.0 : 60.0));
  }
  if (tiFew > 0.0) top = mix(top, k == 1 ? foot - 0.03 + 0.115 * exp(-(x - 0.66) * (x - 0.66) * 70.0) : k == 0 ? top - 0.12 : top - 0.45, tiFew);
  if (tiForm > 0.0 && k < 4) {
    float a = x * vec4(2.6, 1.1, 0.9, 1.3)[k] + vec4(0.1, 0.68, 1.05, 0.95)[k], b = a * 2.7 + 0.3, f = 2.0 * abs(fract(a) - 0.5), g = 2.0 * abs(fract(b) - 0.5);
    f = 1.0 - f; g = 1.0 - g;
    float peak = foot - 0.06 + (k == 0 ? 0.3 * f * (0.65 + 0.35 * sin(floor(a) * 2.3 + 1.0)) + 0.05 * g + 0.03 : k == 1 ? (0.42 * f + 0.06 * g) * smoothstep(0.1, 0.75, x) : k == 2 ? (0.55 * f + 0.07 * g) * smoothstep(0.1, -0.5, x) : (0.36 * f + 0.07 * g) + 0.5);
    top = mix(top, peak - 0.3 * tiFew, tiForm);
    tiFace = tiForm * step(0.5, fract(a + 0.1 * g * (0.5 + 4.0 * (top - p.y)))) * smoothstep(0.24, 0.1, top - p.y + 0.08 * g);
  }
  if (town > 0.0) {
    float base = k == 3 ? top : k == 0 ? foot + 0.01 : foot + 0.45 * max(top - foot, -0.05), roof = cw * (0.62 - 1.1 * abs(u - 0.5)) * tiWide * 0.75;
    if (fract(h * 17.0) < 0.22) roof = cw * 0.1;
    float up = base + 0.05 + 0.13 * h * h;
    top = mix(top, (k != 3 && base < foot + 0.004 && k != 0 ? foot - 0.05 : up + roof), town * (1.0 - tiFew));
    vec2 w = vec2(u * 2.0, (p.y - foot) / 0.036), e = fract(w) - 0.5;
    if (top > foot) tiWin = town * step(0.45, hash21(floor(w) + h * 91.0)) * tiIn((abs(e.x) - 0.2) * cw * 0.5 * tiWide) * tiIn((abs(e.y) - 0.3) * 0.036) * step(p.y, up - 0.004) * step(0.6, w.y);
    tiFace = town * (0.75 * fract(h * 5.0) * step(p.y, up) + 0.5 * tiIn(p.y - up) * step(up, p.y));
  }
  d = -1.0;
  if (p.y > top + 0.03 || p.y < foot - 0.01) return 0.0;
  d = top + 0.02 * noise(vec2(x * 6.0 + 40.0, fk * 5.3)) + 0.006 * noise(vec2(x * 21.0 + 40.0, fk * 3.1)) - p.y;
  return min(tiIn(-d * 0.9), tiIn(foot - p.y));
}
vec2 tiSun() { return vec2(0.17 * tiWide, 0.115 + 0.012 * sin(uTravel * 0.03) + 0.2 * tiHigh - 0.06 * tiLow); }
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
// fields going away: which ink each is sown in, and how thick
vec3 tiField(vec2 p) {
  float s = sat((tiSea - p.y) / (tiSea + 0.5)), z = 1.0 / (s + 0.11);
  vec2 g = vec2(p.x * z * 0.62 / tiBig + 0.3 * z * 0.11, z * 1.05), id = floor(vec2(0.0, g.y));
  g.x += 0.37 * id.y + 0.06 * sin(g.y * 3.0 + id.y);
  id.x = floor(g.x);
  vec2 f = g - id;
  float h = hash21(id + 40.0), h2 = fract(h * 57.0), far = z * z * 12.0 * tiPx;
  float row = h2 < 0.5 ? f.x * 7.0 : (f.y + f.x * 0.3) * 6.0, v = abs(fract(row) - 0.5) * 2.0;
  v = mix(smoothstep(0.3, 0.7, v), 0.5, sat(far)) * 0.75 + 0.12 + 0.2 * h2;
  v *= smoothstep(0.0, 0.05, min(f.x, 1.0 - f.x)) * smoothstep(0.0, 0.06, min(f.y, 1.0 - f.y));
  vec3 c = h < 0.3 ? vec3(1.0, 0.0, 0.35) : h < 0.52 ? vec3(0.0, 1.0, 0.3) : h < 0.86 ? vec3(0.0, 0.12, 1.0) : vec3(0.7, 0.0, 1.0);
  return sat(c * v * (0.75 + 0.5 * piece(vec2(p.x / tiPage.x * 0.5 + 0.5, s)).a));
}
float tiBlueB(vec2 p) {
  // the top of the sky
  vec2 q = (p - tiSun()) / tiDisc;
  float t = tiRamp(sat((p.y - 0.17) * 2.9), tiBlue) * smoothstep(0.14, 0.26, p.y) * (1.0 - tiIn((length(q - vec2(-0.045, 0.015)) - 0.262) * tiBig));
  if (uOwn[7] > 0.0) t *= 1.0 - uOwn[7];
  float sea = tiIn(p.y - tiSea);
  if (sea > 0.0) {
    vec2 s = tiStripe(p);
    float b = sat(band(s.y / 9.0));
    t = mix(t, tiRamp(sat(1.0 - s.x * (1.9 - 0.95 * b)), 0.15 + 0.4 * tiBlue) * (1.0 - tiGlitter(p, s)) * smoothstep(0.0, 26.0 / uRes.y, s.x), sea);
    if (uOwn[6] > 0.0) t = mix(t, tiField(p).x * (0.6 + 0.4 * tiBlue), sea * uOwn[6]);
  }
  for (int k = 0; k < tiLands; k++) {
    float d, a = tiLand(p, k, d);
    float g = sat(1.0 - d / vec4(0.12, 0.17, 0.22, 0.25)[k & 3]);
    if (k == 4) g = sat(0.95 - d / 0.11);
    t = mix(t, tiRamp(g, tiBlue) * vec4(0.62, 0.8, 0.95, 1.0)[k & 3] * (1.0 - 0.85 * tiFace) * (1.0 - tiWin), a);
  }
  return t;
}
float tiRedB(vec2 p) {
  vec2 q = (p - tiSun()) / tiDisc;
  float t = tiIn((length(q) - 0.2) * tiBig) * tiRamp(sat(0.6 + q.y * 2.2), 0.3 + 0.7 * tiRed) * (1.0 - tiIn(tiCloud(p)));
  if (uOwn[7] > 0.0) t = max(t, uOwn[7] * 0.9 * tiRays(q).y * (1.0 - tiIn((length(q) - 0.262) * tiBig)));
  float sea = tiIn(p.y - tiSea);
  if (sea > 0.0) {
    vec2 s = tiStripe(p);
    float w = tiGlitter(p, s) * tiRamp(sat(1.0 - s.x * 0.8), 0.4 + 0.6 * tiRed);
    float m = piece(vec2(p.x / tiPage.x * 0.5 + 0.5, sat((tiSea - p.y) / (tiSea + 0.5)))).a;
    t = mix(t, max(w, 0.75 * sat(m) * smoothstep(0.3, 1.0, s.x)), sea);
    if (uOwn[6] > 0.0) t = mix(t, tiField(p).y * (0.6 + 0.4 * tiRed), sea * uOwn[6]);
  }
  for (int k = 0; k < tiLands; k++) {
    float d, a = tiLand(p, k, d);
    if (k == 1) {
      // a tower on the right point
      vec2 e = (p - vec2(0.66 * tiWide, tiSea + 0.07)) / tiBig;
      float thick = 0.013 - 0.04 * (e.y - 0.05);
      t = max(t, tiIn(max(abs(e.x) - thick, abs(e.y - 0.06) - 0.06) * tiBig) * (0.95 - 0.9 * tiIn((abs(e.y - 0.078) - 0.008) * tiBig)));
    }
    if (k == 0) a *= abs(tiForm);
    t = mix(t, (k == 3 ? tiRamp(sat(0.35 + d * 2.6), tiRed) : 0.0) * (1.0 - tiFace * 0.7) * (1.0 - tiWin), a);
  }
  return t;
}
float tiGoldB(vec2 p) {
  vec2 q = (p - tiSun()) / tiDisc;
  float t = tiIn((length(q - vec2(-0.045, 0.015)) - 0.262) * tiBig) * tiRamp(sat(0.55 - q.y * 1.6 + q.x * 1.4), max(tiGold, uMic));
  t = max(t, 0.92 * tiIn(tiCloud(p)));
  if (uOwn[7] > 0.0) t = max(t, uOwn[7] * tiRays(q).x);
  t *= 1.0 - tiIn(p.y - tiSea);
  if (uOwn[6] > 0.0) t = max(t, uOwn[6] * tiField(p).z * tiIn(p.y - tiSea) * (0.6 + 0.4 * tiGold));
  // the tower's lamp: a hit lights it, and the light goes out from it in grain
  vec2 e = (p - vec2(0.66 * tiWide, tiSea + 0.07 + 0.127 * tiBig)) / tiBig;
  float r = length(e), ring = max(max(r - 0.1 - 0.2 * (1.0 - uHits), 0.04 + 0.24 * (1.0 - uHits) - r), 0.0) * 18.0;
  float lamp = max(0.9 * tiIn((r - 0.013) * tiBig), uHits * 0.8 * exp(-ring * ring));
  for (int k = 0; k < tiLands; k++) {
    float d, a = tiLand(p, k, d);
    if (k == 0) a *= abs(tiForm);
    t = mix(t, max((k == 2 ? tiRamp(sat(0.5 + d * 3.0), tiGold) : k == 4 ? tiRamp(sat(0.3 + d * 6.0), tiGold) : 0.0) * (1.0 - 0.8 * tiFace), tiWin), max(a, k == 0 ? tiWin : 0.0));
    if (k == 1) t = max(t, lamp);
  }
  return t;
}

vec3 tiPlates(vec2 p, vec2 r, vec2 g) { return uVar < 0.5 ? vec3(tiBlueA(p), tiRedA(r), tiGoldA(g)) : vec3(tiBlueB(p), tiRedB(r), tiGoldB(g)); }
vec3 render(vec2 p) {
  vec2 sheet = p;
  tiSea = -0.07;
  tiPx = 0.75 / uRes.y;
  float hw = 0.5 * uRes.x / uRes.y;
  tiPage = vec2(hw, 0.5) - 0.03;
  tiWide = clamp(1.0 + 1.22 * (hw - 0.89), 0.24, 1.3);
  tiBig = clamp(hw / 0.62, uVar < 0.5 ? 0.5 : 0.62, 1.0);
  tiForm = uOwn[3]; tiHigh = max(uOwn[5], 0.0); tiLow = max(-uOwn[5], 0.0); tiFew = max(-uOwn[4], 0.0);
  float many = max(uOwn[4], 0.0);
  vec2 cell9 = vec2(0.0);
  if (many > 0.0) {
    // a sheet of small prints, every second one the other way round
    vec2 size = vec2(2.0 * hw, 1.0);
    p *= 1.0 + 2.0 * many; tiPx *= 1.0 + 2.0 * many;
    cell9 = floor(p / size + 0.5);
    p -= cell9 * size;
    if (mod(cell9.x + cell9.y, 2.0) > 0.5) { p.x = -p.x; tiForm = tiForm + many * 0.9 * (hash21(cell9 + 5.0) < 0.5 ? -1.0 : 1.0); }
    else if (cell9 != vec2(0.0)) tiHigh = max(tiHigh, 0.8 * many * step(0.4, hash21(cell9 + 9.0)));
    tiForm = clamp(tiForm, -1.0, 1.0);
  }
  tiGone = 0.42 * tiFew;
  tiSea += 0.26 * tiHigh - 0.27 * tiLow;
  tiBig *= uVar < 0.5 ? 1.0 + 0.3 * tiLow - 0.1 * tiHigh : 1.0;
  tiDisc = tiBig * (1.0 + 0.45 * tiLow - 0.25 * tiHigh);
  tiEdge = -0.24 + 0.78 * tiHigh - 0.19 * tiLow; tiTab = -0.24 - 0.19 * tiLow;
  if (tiHigh > 0.0) tiLands = 5;
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
  if (uOwn[1] < 0.0) { oR -= uOwn[1] * vec2(0.02, -0.011); oG -= uOwn[1] * vec2(-0.014, -0.015); }
  vec2 pR = p - oR, pG = p - oG;

  float cell = max(1.6 / uRes.y, 1.0 / 330.0);
  float w = mix(0.2, 0.08, uTone);
  vec3 g = vec3(tiGrain(sheet, 0.35, cell), tiGrain(sheet - oR, 1.27, cell), tiGrain(sheet - oG, 2.2, cell));
  if (uOwn[2] != 0.0) g = mix(g, uOwn[2] > 0.0 ? vec3(tiLine(sheet, 0.0), tiLine(sheet - oR, 1.0), tiLine(sheet - oG, 2.0)) : vec3(tiDot(sheet, 0.26), tiDot(sheet - oR, 1.31), tiDot(sheet - oG, 0.0)), abs(uOwn[2]));
  vec3 t;
  float mir = max(-uOwn[6], 0.0), line = uVar < 0.5 ? tiEdge : tiSea;
  if (uVar < 0.5 && (tiHigh > 0.0 || uOwn[7] > 0.0)) tiMask = tiThings(p);
  t = tiPlates(p, pR, pG);
  if (uVar < 0.5 && tiHigh > 0.0) t.x = max(t.x, tiHigh * 0.8 * (1.0 - tiMask) * tiThings(p + vec2(-0.028, 0.034) * tiBig));
  if (mir > 0.0 && p.y < line + 0.004) {
    // still water, or a polished board: the same again upside down, broken into bars where its part of the spectrum sounds
    float dn = sat((line - p.y) / (line + 0.5));
    float bar = abs(2.0 * fract(9.0 * sqrt(dn) + 0.1 * sin(p.x * 5.0 + uTime * 0.1)) - 1.0);
    vec2 sh = vec2(0.004 + 0.02 * dn, 0.0) * sin(p.y * 60.0 + uTime * 0.3 + 2.0 * noise(p * 4.0));
    vec2 m = vec2(1.0, -1.0), up = vec2(0.0, 2.0 * line);
    if (uVar < 0.5 && uOwn[7] > 0.0) tiMask = tiThings(p * m + up + sh);
    vec3 r = tiPlates(p * m + up + sh, pR * m + up + sh, pG * m + up + sh);
    r *= 1.0 - smoothstep(0.75, 0.95, bar) * (0.35 + 0.65 * sat(band(p.x / tiPage.x * 0.5 + 0.5)));
    r.x = max(r.x, 0.1 + 0.5 * tiBlue * dn * dn);
    t = mix(t, r, mir * tiIn(p.y - line));
  }
  if (uOwn[7] < 0.0) {
    // rain: long thin strokes, ink on the bare sheet and bare on the ink, under a dark lid of cloud
    vec2 q = rot(-0.2) * p * vec2(34.0, 4.0);
    float i = floor(q.x), h = hash11(i + 3.0), y = q.y + h * 17.0 + uTime * (0.3 + 0.25 * h), j = floor(y), hh = hash21(vec2(i, j));
    float s = -uOwn[7] * step(0.35, hh) * tiIn((abs(q.x - i - 0.5) - 0.085) / 34.0) * smoothstep(0.0, 0.05, y - j) * smoothstep(0.35 + 0.6 * fract(hh * 7.0), 0.3 + 0.6 * fract(hh * 7.0), y - j);
    t.x = max(t.x, -uOwn[7] * tiRamp(sat((p.y - 0.26 + 0.14 * noise(p * vec2(3.0, 5.0) + uTravel * vec2(0.03, 0.0))) * 3.4), 0.8) * (1.0 - 0.6 * max(t.y, t.z)));
    t.x += s * (0.85 - 1.7 * t.x); t.yz *= 1.0 - s;
  }
  if (uOwn[1] < 0.0) t = mix(t, 0.04 + 0.94 * smoothstep(0.36, 0.42, t + 0.05 * (vec3(noise(sheet * 70.0)) - 0.5)), -uOwn[1]);
  // the edge of each plate
  t.x *= tiIn(max(abs(p.x) - tiPage.x, abs(p.y) - tiPage.y));
  t.y *= tiIn(max(abs(pR.x) - tiPage.x, abs(pR.y) - tiPage.y));
  t.z *= tiIn(max(abs(pG.x) - tiPage.x, abs(pG.y) - tiPage.y));
  // a drum never lays its ink quite evenly
  float lay = noise(sheet * vec2(3.0, 7.0) + 3.0);
  t *= 0.93 + 0.1 * lay;
  vec3 ink = smoothstep(-w, w, t * (1.0 + 2.0 * w) - w - g);

  vec3 blue = mix(vec3(0.13, 0.36, 0.62), uKind[0], 0.15);
  vec3 red = mix(vec3(1.0, 0.3, 0.25), uKind[4], 0.12);
  vec3 gold = mix(vec3(1.0, 0.81, 0.2), uKind[2], 0.12);
  if (uOwn[1] > 0.0) { blue = mix(blue, uKind[0], uOwn[1]); red = mix(red, uKind[3], uOwn[1]); gold = mix(gold, uKind[1], uOwn[1]); }
  if (many > 0.0) {
    // some prints of the sheet take the inks in another order
    float h = hash21(cell9 + 2.0), k = cell9 == vec2(0.0) ? 0.0 : many * step(0.45, h);
    vec3 b0 = blue, r0 = red;
    blue = mix(blue, mix(blue, red, step(0.75, h)), k); red = mix(red, mix(gold, b0, step(0.75, h)), k); gold = mix(gold, mix(r0, gold, step(0.75, h)), k);
  }
  vec3 col = vec3(0.955, 0.932, 0.88);
  if (uOwn[0] < 0.0) {
    float roll = sat(0.5 - 1.1 * sheet.y + 0.1 * (g.x - 0.5));
    vec2 q = uVar < 0.5 ? tiAt(p, vec2(-0.6, 0.255)) / 0.135 : (p - tiSun()) / tiDisc / 0.262;
    col = mix(col, 0.25 + 0.75 * mix(uKind[1], uKind[2], roll), -uOwn[0] * 0.92 * smoothstep(-0.03, 0.03, length(q) - 1.0 + 0.04 * (g.y - 0.5)));
  }
  col *= 0.985 + 0.03 * noise(sheet * 190.0);
  // a cue prints the sheet again from the top, with the inks moved round: the fresh strip goes down and dries
  float front = 0.36 - 1.5 * (1.0 - uCue);
  float y = sheet.y + 0.05 * (g.x - 0.5) + 0.02 * sin(sheet.x * 3.0);
  float sw = smoothstep(front - 0.09, front, y) * (1.0 - smoothstep(front + 0.45, front + 0.75, y)) * sat(uCue * 5.0);
  vec3 b0 = blue, r0 = red;
  blue = mix(blue, r0, sw); red = mix(red, gold, sw); gold = mix(gold, b0, sw);
  col *= mix(vec3(1.0), blue, ink.x * 0.97);
  col *= mix(vec3(1.0), red, ink.y * 0.97);
  col *= mix(vec3(1.0), gold, ink.z * 0.97);
  if (uOwn[0] > 0.0) {
    // black paper: the inks lie on it, and where two lie together it is lighter
    vec3 n = vec3(0.045, 0.047, 0.056) * (0.8 + 0.4 * noise(sheet * 190.0));
    n = 1.0 - (1.0 - n) * (1.0 - ink.x * 0.97 * (0.1 + 0.95 * blue)) * (1.0 - ink.y * 0.95 * red) * (1.0 - ink.z * 0.9 * gold);
    col = mix(col, n, uOwn[0]);
  }
  return col;
}
