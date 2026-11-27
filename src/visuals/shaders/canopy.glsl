// name: Canopy
// a: Looking up
// b: Forest floor
// what: Looking up through the leaves of a tree toward the evening sky, layer over layer of leaves moving in the wind, the sun coming through them in soft shafts and drifting discs; or the forest floor, ferns and moss in mist, with shafts of light slanting down between dark trunks.
// follows: The mix is how much sun comes through, the low band sways the branches, the high band flickers the small leaves, each kind of sound lights one layer of leaves in its colour (on the forest floor, one shaft of light), a hit lets one bright shaft through for a moment.
// own: 0 the leaf: 1 combed needles (b: thin grass), -1 round petals (b: broad blades); 1 1 full and close, -1 nearly bare; 2 the hour: 1 pale day, -1 moonlit night with stars; 3 1 many small leaves (b: many slim trunks), -1 few great ones; 4 the lie: 1 a long lane of sky (b: trunks bend and lean), -1 boughs hang only from above (b: they stand on a slope); 5 1 tall trunks stand all round up to the sky (b: the floor is still water that mirrors), -1 no limbs (b: thick even fog, no shafts); 6 1 leaves come falling, -1 snow falls and lies; 7 1 drawn in outlines only, -1 cut from flat paper
#define cS smoothstep
float cEdge; // how far in from the rim of the top leaf
float cPos(float x) { return max(x, 0.0); }
#define cTint vec3(0.42, 0.62, 1.0)
#define cNight mix(vec3(1.0), cTint, cPos(-uOwn[2]))
#define cInk max(uOwn[7], 0.0)
#define cSnow max(-uOwn[6], 0.0)
#define cHill max(-uOwn[4], 0.0)
#define cDay max(uOwn[2], 0.0)
// What falls over c: leaves, turning as they come down, or snow; lit is its light.
vec3 cFall(vec3 c0, vec2 p, float px, float lit) {
 float got = 0.0, leaves = uOwn[6];
 if (leaves == 0.0) return c0;
 for (int k = 0; k < 3; k++) {
  float fk = float(k), s = leaves > 0.0 ? 4.5 + 2.5 * fk : 9.0 + 7.0 * fk;
  vec2 q = p * s + vec2(uTime * (0.1 - 0.06 * fk) + fk * 3.7, uTime * (leaves > 0.0 ? 0.35 : 0.5) * (1.0 + 0.2 * fk) + fk * 5.3);
  float col = floor(q.x), hc = hash11(col + fk * 17.0);
  q.y += hc * 7.0;
  vec2 id = vec2(col, floor(q.y)), h = hash22(id + fk * 11.0);
  vec2 d = fract(q) - 0.5 - (h - 0.5) * 0.4 - vec2(0.1 * sin(uTime * (0.5 + h.x) + h.y * 30.0), 0.0);
  float c;
  if (leaves > 0.0) {
   d = rot(h.x * TAU + 0.8 * sin(uTime * (0.4 + 0.4 * h.y) + h.x * 40.0)) * d / 0.2;
   float thin = 0.25 + 0.75 * abs(cos(uTime * (0.5 + 0.5 * h.x) + h.y * 20.0));
   c = cS(-px * s * 6.0 - 0.02, px * s * 6.0 + 0.02, 0.5 * thin * (1.0 - d.x * d.x) - abs(d.y)) * step(0.45, h.y);
  } else c = cS(0.1 + 0.05 * h.x, 0.03, length(d)) * step(0.3, h.y) * (1.0 - 0.2 * fk);
  got = max(got, c);
 }
 vec3 k = mix(uKind[3], uKind[4], 0.3);
 return mix(c0, (leaves > 0.0 ? k * k : vec3(0.8, 0.85, 0.9)) * mix(lit, 1.0, cDay), got * abs(leaves) * 0.9);
}
// One layer of leaves at a place q in the layer's own grid (q = place * scale + off). The leaves stand round an opening
// to the sky (hole, r0 its size for this layer) and point roughly in toward it. Returns how much of the pixel is leaf,
// how many leaves deep, and the leaf's own number; lpTop gets the place in the top leaf (x from stalk to tip, y across).
vec3 cLeaves(vec2 q, float scale, vec2 off, float seed, float aa, float flutter, vec2 hole, float r0, out vec2 lpTop) {
 vec2 id0 = floor(q - 0.5);
 float cover = 0.0, thick = 0.0, own = 0.0;
 lpTop = vec2(0.0); cEdge = 1.0;
 for (int j = 0; j < 4; j++) {
  vec2 id = id0 + vec2(j & 1, j >> 1);
  float hx = hash21(id + seed), hy = fract(hx * 57.31), h3 = fract(hx * 131.7), h4 = fract(hx * 717.3);
  vec2 c = id + 0.5 + (vec2(hx, hy) - 0.5) * 0.5;
  vec2 cw = (c - off) / scale - hole; // where the leaf hangs, from the middle of the opening
  float far = length(cw);
  float off_ = far; // how far into the leaves
  vec2 in_ = -cw / max(far, 1e-3);
  if (uOwn[4] > 0.0) off_ = mix(far, length(rot(-0.5) * cw * vec2(0.32, 1.25)), uOwn[4]);
  if (uOwn[4] < 0.0) {
   off_ = mix(far, 0.3 + 1.5 * cw.y + 0.35 * noise(vec2(cw.x * 3.1 + seed, 2.0)), -uOwn[4]);
   in_ = mix(in_, vec2(0.0, -1.0), -0.85 * uOwn[4]);
   in_ /= max(length(in_), 1e-2);
  }
  float here = cS(0.0, 0.25, cS(r0 - 0.07, r0 + 0.16, off_ + 0.14 * (hy - 0.5)) * 1.25 - h4);
  if (uOwn[1] < 0.0) here *= mix(1.0, cS(0.74, 0.82, fract(hx * 931.7)), -uOwn[1]);
  float ang = (h3 - 0.5) * 2.8 + flutter * sin(uTime * (1.3 + 1.5 * hx) + hy * 30.0);
  float cs = cos(ang), sn = sin(ang);
  vec2 d = (q - c) / (0.4 + 0.28 * h4);
  d = vec2(dot(d, in_), dot(d, vec2(-in_.y, in_.x)));
  vec2 lp = vec2(cs * d.x + sn * d.y, cs * d.y - sn * d.x);
  float w = 0.43 * (1.0 - lp.x * lp.x) * (1.0 - 0.32 * clamp(lp.x, -1.0, 1.0)); // broad toward the stalk, drawn to a point at the tip
  if (uOwn[0] > 0.0) { // a twig with needles on both its sides
   float comb = abs(fract((lp.x + abs(lp.y) * 0.9) * 4.5 + hy) - 0.5) * 2.0;
   w = mix(w, min(0.05 + w * 1.25 * cS(0.35, 0.75, comb), 0.05 + 0.6 * sat(1.0 - lp.x * lp.x)), uOwn[0]);
  }
  if (uOwn[0] < 0.0) { // a round petal, notched at its tip
   float rx = lp.x * 1.25;
   w = mix(w, 0.74 * sqrt(max(1.0 - rx * rx, 0.0)) - 2.5 * max(abs(rx) - 1.0, 0.0) - 0.5 * cS(0.55, 0.85, lp.x) * cS(0.2, 0.0, abs(lp.y)), -uOwn[0]);
  }
  float a = cS(-aa, aa, w - abs(lp.y)) * here;
  float top = step(0.02, a);
  lpTop = mix(lpTop, lp, top); cEdge = mix(cEdge, w - abs(lp.y), top); own = mix(own, hx, top);
  cover = max(cover, a); thick += a;
 }
 return vec3(cover, thick, own);
}
// A limb of the tree from a to b, bowed sideways by bow, thick at a. Returns how much of the pixel it covers, and where across it (-1 to 1).
vec2 cLimb(vec2 p, vec2 a, vec2 b, float bow, float w0, float w1, float aa) {
 vec2 ab = b - a, nrm = vec2(-ab.y, ab.x);
 float h = sat(dot(p - a, ab) / dot(ab, ab));
 p -= nrm * bow * 4.0 * h * (1.0 - h);
 h = sat(dot(p - a, ab) / dot(ab, ab));
 vec2 d = p - a - ab * h;
 float w = mix(w0, w1, h * h * (3.0 - 2.0 * h)) * (1.0 + 0.12 * sin(h * 23.0 + a.x * 9.0));
 return vec2(cS(w + aa, w - aa, length(d)), dot(d, nrm) / (length(ab) * w));
}
// What the layers of leaves share: the pixel, the sun, how much of it comes through, the light so far.
vec2 cP, cSun, cHole;
float cSd, cPower, cReach, cT, cNear, cPx;
vec3 cCol, cSky;
// Lays one sheet of leaves over what is behind it. li is which of the five layers it belongs to (0 the highest), n its own number.
void cSheet(int li, float n) {
 // which sound each layer answers to, from the highest leaves down: texture, phrase, pad, drone, hits
 float lv = li == 0 ? uTexture : li == 1 ? uPhrase : li == 2 ? uPad : li == 3 ? uDrone : uHits;
 int kind = li == 0 ? 2 : li == 1 ? 3 : li == 2 ? 1 : li == 3 ? 0 : 4;
 float fi = float(li) / 4.0;
 float scale = 14.0 * pow(0.66, float(li)) * exp2(uOwn[3] * (uOwn[3] > 0.0 ? 0.8 : 1.0));
 vec2 sway = (0.004 + 0.035 * uLow) * (0.35 + fi) * vec2(sin(uTime * 0.41 + fi * 2.1 + cP.x), cos(uTime * 0.33 + fi * 1.3 + cP.y));
 vec2 off = vec2(n * 13.7, n * 5.1);
 float aa = (cPx + 0.004 * (1.0 - fi) * (1.0 - fi) + 0.03 * pow(fi, 5.0)) * scale * 2.2;
 float flutter = (0.05 + 0.45 * uHigh) * (1.0 - 0.7 * fi);
 // the higher the layer the further its leaves reach in over the opening; a fuller mix parts them a little
 float r0 = 0.2 + 0.2 * fi + 0.4 * fi * fi + 0.05 * uLevel + 0.03 * fract(n * 0.5) - 0.34 * cPos(uOwn[1]);
 vec2 lp;
 vec3 a = cLeaves((cP + sway) * scale + off, scale, off, n * 3.1 + 1.0, aa, flutter, cHole, r0, lp);
 float cover = a.x, own = a.z;
 float vein = cS(0.5, 1.0, cos((abs(lp.y) * 2.6 - lp.x) * 15.0)) * 0.45 * sat((1.1 / scale - 0.05) * 14.0) + cS(0.05, 0.015, abs(lp.y));
 float tone = fract(own * 3.7) + 0.2 * sign(lp.y); // each leaf its own green, one half of the fold a little lighter
 // the leaf from below: dark where others shade it, alight where the sun comes through it
 float light = min(cPower * cReach * (cT + 0.05) * exp(-1.0 * max(a.y - 1.0, 0.0)), 1.1);
 vec3 kc = uKind[kind]; kc = kc * kc * (0.8 + kc);
 vec3 glow = mix(vec3(0.10, 0.42, 0.02), vec3(0.62, 0.50, 0.02), sat(fract(own * 7.3) * 0.45 + 0.7 * exp(-cSd * 2.8)));
 if (uOwn[0] < 0.0) { vec3 pet = mix(mix(uKind[2], uKind[1], fract(own * 7.3)), uKind[3], 0.5 * fract(own * 3.1)); glow = mix(glow, pet * pet * 0.8, -uOwn[0]); }
 // some of the leaves in a layer turn to its sound's colour as it sounds, like blossom among the green
 float turned = cS(0.0, 0.2, lv * 0.75 - fract(own * 5.1));
 glow = mix(glow, kc, turned * (li == 3 ? 0.5 : 0.9));
 vec3 lc = (vec3(0.0015, 0.008, 0.007) + 0.008 * kc * turned) * (0.5 + 0.7 * tone) + glow * light * (1.0 - 0.6 * vein) * (0.7 + 0.5 * tone) * (0.85 + 0.3 * lp.x) * (1.0 + 0.8 * lv * turned);
 if (uOwn[2] != 0.0) {
  lc *= cNight;
  lc = mix(lc, (glow * (0.35 + 0.3 * tone) * (1.0 - 0.5 * vein) + 0.05) * (0.45 + 0.75 * cT) * (0.8 + 0.4 * lv * turned), 0.8 * cDay);
 }
 if (uOwn[6] < 0.0) lc = mix(lc, vec3(0.55, 0.62, 0.72) * (0.12 + 0.9 * cT * max(cPower * 0.5, cDay)) * (1.0 - 0.3 * vein), -uOwn[6] * (0.35 + 0.55 * cS(0.3, 0.6, fract(own * 9.1))));
 if (uOwn[7] < 0.0) lc = mix(lc, mix(glow, kc, 0.4 * turned) * mix(0.75, 0.12, fi) * (0.75 + 0.5 * fract(own * 3.7)) * mix(0.35 + 0.5 * cPower, 1.0, cDay) * cNight, -uOwn[7]);
 if (uOwn[7] > 0.0) {
  float line = max(cS(0.05 + aa * 0.5, aa * 0.5, cEdge), cS(0.05, 0.02, abs(lp.y)) * 0.7);
  vec3 ink = mix((glow + 0.06) * (0.4 + 1.1 * light) * (1.0 + lv), glow * 0.12, cDay);
  lc = mix(lc, mix(cSky * 0.9 + 0.1 * glow * turned * lv, ink, line), uOwn[7]);
 }
 lc += vec3(1.0, 0.9, 0.6) * pow(fract(own * 11.3), 12.0) * uHigh * light * 1.5; // a glint here and there
 lc *= 1.0 - 0.85 * cS(0.6, 1.0, fi) * (1.0 - 0.8 * max(cInk, 0.6 * cDay)); // the nearest hang dark
 cCol = mix(cCol, lc, cover);
 cT *= 1.0 - mix(0.4, 0.7, fi) * cover;
 cNear = cover;
}
vec3 cUp(vec2 p) {
 cPx = 1.3 / uRes.y;
 p *= 1.0 + 0.25 * dot(p, p); // the edges of the eye see wider
 cP = p;
 cSun = vec2(0.2, 0.1) + 0.02 * vec2(sin(uTime * 0.05), cos(uTime * 0.04));
 cHole = vec2(0.08, 0.03); // the middle of the opening in the leaves
 float sd = length(p - cSun);
 cSd = sd;
 float power = 0.3 + 0.95 * uLevel; // how much sun comes through
 cPower = power;
 // a hit: one bright shaft for a moment, lighting the leaves along its way
 vec2 sp = p - cSun;
 float an = atan(sp.y, sp.x);
 float way = -2.3 + 0.7 * sin(uTime * 0.13), da = abs(mod(an - way + PI, TAU) - PI);
 float shaft = exp(-da * da * 50.0) * exp(-sd * 0.8) * cS(0.0, 0.12, sd) * (uHits * 1.1 + uCue * 0.6);
 // more of the sun near where it is; further off only flecks of it, drifting
 float fleck = cS(0.6, 0.8, noise(p * 2.7 + vec2(uTime * 0.02, -uTime * 0.015) + 3.0));
 float reach = exp(-sd * 3.0) * 1.9 + 0.03 + 0.55 * fleck * (0.35 + uLevel) * exp(-sd * 0.9) + 1.2 * shaft;
 cReach = reach;
 // the sky in the opening: gold round the sun, through rose, cooling to deep blue-green away from it
 vec3 sky = (vec3(0.006, 0.018, 0.07) + vec3(0.11, 0.03, 0.05) * exp(-sd * 3.0) + vec3(0.95, 0.42, 0.05) * exp(-sd * 6.0)) * (0.45 + 0.6 * power);
 sky += vec3(1.0, 0.85, 0.6) * (2.2 * cS(0.05, 0.028, sd) + 0.6 * exp(-sd * 11.0)) * power;
 float day = cDay, night = cPos(-uOwn[2]);
 if (day > 0.0) sky = mix(sky, mix(vec3(0.5, 0.64, 0.74), vec3(1.15, 1.1, 1.0), exp(-sd * 1.6)) * (0.75 + 0.25 * power) + vec3(1.0, 0.95, 0.85) * cS(0.06, 0.02, sd), day);
 if (night > 0.0) {
  vec2 sq = p * 26.0, si = floor(sq), sh = hash22(si + 3.0);
  float star = cS(0.07, 0.0, length(fract(sq) - 0.5 - (sh - 0.5) * 0.7)) * step(0.55, sh.y);
  float moon = cS(0.094, 0.088, sd), sea = noise((p - cSun) * 22.0 + 4.0);
  sky = mix(sky, mix(vec3(0.004, 0.008, 0.022), vec3(0.06, 0.1, 0.17), exp(-sd * 2.2)) * (0.6 + 0.6 * power) + vec3(0.5, 0.6, 0.75) * star * (1.0 - moon) + vec3(0.2, 0.28, 0.4) * exp(-sd * 8.0) * power + moon * vec3(0.9, 0.92, 0.95) * (0.55 + 0.5 * sea), night);
 }
 cSky = sky;
 cCol = sky;
 cT = 1.0; // how much of the sun is still coming through, layer after layer
 cNear = 0.0;
 for (int n = 0; n < 5; n++) cSheet((n + 1) / 2, float(n));
 // the limbs of the tree, swaying from the trunk
 vec2 trunk = vec2(-1.05, -0.62);
 vec2 bend = (0.004 + 0.02 * uLow) * vec2(sin(uTime * 0.37), cos(uTime * 0.29));
 vec2 k1 = vec2(-0.32, -0.12) + bend, k2 = vec2(0.12, 0.3) + 2.0 * bend, k3 = vec2(-0.02, -0.42) + 1.6 * bend, k4 = vec2(-0.55, 0.4) + 2.0 * bend, k5 = vec2(0.62, -0.3) + 2.4 * bend;
 vec2 l1 = cLimb(p, trunk, k1, 0.05, 0.085, 0.036, cPx), l2 = cLimb(p, k1, k2, -0.07, 0.036, 0.004, cPx), l3 = cLimb(p, k1, k3, 0.08, 0.026, 0.012, cPx);
 vec2 l4 = cLimb(p, k1 * 0.75 + trunk * 0.25, k4, 0.09, 0.03, 0.003, cPx), l5 = cLimb(p, k3, k5, -0.06, 0.012, 0.002, cPx);
 float limb = max(max(max(l1.x, l2.x), max(l3.x, l4.x)), l5.x);
 float side = mix(mix(mix(mix(l1.y, l2.y, l2.x), l3.y, l3.x), l4.y, l4.x), l5.y, l5.x);
 limb *= 1.0 - abs(uOwn[5]);
 vec3 bark = vec3(0.003, 0.0025, 0.003) + vec3(0.5, 0.2, 0.04) * power * reach * cS(0.35, 1.0, side) * 0.5;
 if (day > 0.0) bark = mix(bark, vec3(0.05, 0.035, 0.028) * (1.0 + cS(0.0, 1.0, side)), day);
 if (night > 0.0) bark *= cNight;
 if (uOwn[6] < 0.0) bark = mix(bark, vec3(0.5, 0.57, 0.66) * (0.15 + 0.6 * max(day, 0.6 * power)), -uOwn[6] * cS(-0.1, 0.5, side));
 cCol = mix(cCol, bark, limb);
 cT *= 1.0 - 0.9 * limb;
 if (uOwn[5] > 0.0) { // tall trunks all round, run together high above
  vec2 tp = p - cHole - bend * 0.5;
  float tr = length(tp), ta = atan(tp.y, tp.x + 1e-5) / TAU + 0.5;
  for (int k = 0; k < 2; k++) {
   float many = k == 0 ? 17.0 : 9.0, g = ta * many + float(k) * 0.37, id = mod(floor(g), many);
   vec2 h = hash22(vec2(id + 2.0, float(k) * 7.0 + 1.0));
   float top = (k == 0 ? 0.1 : 0.2) + 0.22 * h.y;
   float da = (fract(g) - 0.5 - (h.x - 0.5) * 0.45 - 0.03 * sin(tr * 9.0 + h.y * 20.0)) / many * TAU * tr;
   float w = (k == 0 ? 0.045 : 0.1) * (0.6 + 0.8 * h.y) * cS(top - 0.03, top + 0.75, tr) + 0.003;
   float c = cS(w + cPx, w - cPx, abs(da)) * cS(top, top + 0.05, tr) * uOwn[5] * step(0.12, h.x);
   float s = da / w, ring = noise(vec2(s * 3.0 + id * 9.0, tr * 26.0));
   vec3 tc = vec3(0.006, 0.005, 0.005) + vec3(0.5, 0.25, 0.08) * cNight * power * (reach + 0.1) * cS(0.9, -0.6, s) * 0.5 * (0.5 + ring);
   tc = mix(tc, vec3(0.16, 0.12, 0.1) * (0.6 + 0.8 * ring) * (0.8 - 0.5 * s), 0.75 * day);
   if (uOwn[7] < 0.0) tc = mix(tc, vec3(0.02, 0.016, 0.016) * (k == 0 ? 3.0 : 1.0), -uOwn[7]);
   if (uOwn[7] > 0.0) tc = mix(tc, mix(cSky, mix(vec3(0.7), vec3(0.02), day), max(cS(0.7, 1.0, abs(s)), 0.6 * step(0.62, ring))), uOwn[7]);
   cCol = mix(cCol, tc, c);
   cT *= 1.0 - 0.9 * c;
  }
 }
 for (int n = 5; n < 7; n++) cSheet(n - 2, float(n));
 vec3 col = cCol;
 // shafts of sun in the air under the leaves
 float rays = noise(vec2(an * 5.0 + uTime * 0.02, 2.0)) * noise(vec2(an * 13.0 - uTime * 0.03, 7.0));
 col += mix(vec3(1.0, 0.62, 0.24), cTint * 0.6, night) * (1.0 - 0.6 * day) * rays * rays * 3.0 * exp(-sd * 2.6) * power * 0.4 * (1.0 - 0.7 * cNear);
 col += mix(vec3(1.0, 0.8, 0.5), kindColour(4.0), 0.25) * shaft * (1.0 - 0.6 * cNear);
 col = cFall(col, p, cPx, 0.3 + 0.5 * power);
 col /= 1.0 + (0.8 - 0.55 * day) * dot(p, p);
 return col;
}
// The forest floor. What its parts share: the picture so far, the mist, the light of the shafts at this pixel.
vec3 fCol, fMist, fLight;
float fPower, fGlow;
// One rank of trunks at a depth dj (0 far, 1 near), standing on a rise of moss.
void cTrunks(vec2 p, float dj, float seed, float px) {
 float cw = mix(0.13, 0.66, dj * sqrt(dj)) * exp2(-0.9 * uOwn[3]), tw = mix(0.007, 0.07, dj * dj) * exp2((uOwn[3] > 0.0 ? -1.1 : -1.25) * uOwn[3]);
 float day = cDay, night = cPos(-uOwn[2]);
 float yg = mix(-0.13, -0.44, dj) + 0.025 * (0.4 + dj) * (noise(vec2(p.x * mix(6.0, 2.0, dj) + seed * 5.0, seed)) - 0.5) - cHill * 0.38 * p.x;
 float haze = (1.0 - dj) * (1.0 - dj) * 0.8 + 0.12 * (1.0 - dj);
 if (uOwn[5] < 0.0) haze = mix(haze, 1.0 - 0.75 * dj * dj, -uOwn[5]);
 // the ground at this depth: moss, lit where a shaft comes down on it
 float tex = noise(p * vec2(26.0, 60.0) * mix(1.6, 0.6, dj) + seed);
 vec3 moss = mix(vec3(0.003, 0.012, 0.006), vec3(0.022, 0.05, 0.012), tex) * (0.5 + 1.4 * fGlow * fPower) + (vec3(0.12, 0.2, 0.03) * dot(fLight, vec3(0.4)) + 0.25 * fLight) * (0.4 + 0.6 * tex);
 if (night > 0.0) moss *= cNight;
 if (day > 0.0) moss = mix(moss, mix(vec3(0.07, 0.1, 0.03), vec3(0.22, 0.26, 0.09), tex) * (0.7 + 0.5 * fPower) + fLight * 0.2, day);
 if (cSnow > 0.0) moss = mix(moss, vec3(0.62, 0.7, 0.8) * (0.1 + 0.3 * fPower + 0.75 * day) * (0.8 + 0.2 * tex) + fLight * 0.5, cSnow);
 if (uOwn[7] != 0.0) moss = mix(moss, uOwn[7] < 0.0 ? fMist * mix(0.8, 0.12, dj) + fLight * 0.2 : mix(fMist * 1.1, fMist * 0.15 + 0.02, cS(0.75, 0.9, sin(p.y * 260.0 * mix(1.0, 0.4, dj) + 9.0 * tex))), abs(uOwn[7]));
 fCol = mix(fCol, mix(moss, fMist, haze), cS(yg + 0.004, yg - 0.004, p.y));
 // the trunks
 float x = p.x + seed * 7.7 - 0.05 * dj * p.y;
 if (uOwn[4] > 0.0) x += uOwn[4] * (0.5 * (hash11(seed * 3.3) - 0.5) * p.y + (0.02 + 0.09 * dj) * sin(p.y * (7.0 - 3.0 * dj) + seed * 9.0 + x * 1.7));
 float id = floor(x / cw);
 float hx = hash21(vec2(id, seed * 3.1 + 0.7)), hy = fract(hx * 57.31), h3 = fract(hx * 131.7);
 float up = p.y - yg;
 float cx = (id + 0.5 + (hx - 0.5) * 0.5) * cw + (h3 - 0.5) * 0.06 * dj * up * up;
 float w = tw * (0.6 + 0.8 * hy) * (1.0 + 1.3 * exp(-max(up, 0.0) * mix(40.0, 9.0, dj))) * (1.0 - 0.12 * up);
 float d = (x - cx) / w;
 float aa = (px + 0.004 * dj * dj) / w;
 float cover = cS(1.0 + aa, 1.0 - aa, abs(d)) * step(0.0, up) * step(0.22, h3);
 float bark = 0.6 + 0.4 * noise(vec2(d * 3.0 + id * 9.0, p.y * mix(30.0, 9.0, dj)));
 vec3 tc = vec3(0.006, 0.005, 0.005) * bark;
 tc += vec3(0.50, 0.33, 0.09) * fPower * (0.12 + fGlow) * cS(-0.35, -1.0, d) * bark * 0.9; // the edge toward the light
 tc += vec3(0.02, 0.06, 0.012) * exp(-max(up, 0.0) * 7.0) * bark; // moss climbing from the foot
 if (night > 0.0) tc *= cNight;
 if (day > 0.0) tc = mix(tc, vec3(0.09, 0.07, 0.055) * bark * (1.0 - 0.6 * d), day);
 tc += fLight * 0.35 * bark * cS(0.4, -1.0, d);
 if (cSnow > 0.0) tc = mix(tc, vec3(0.6, 0.68, 0.78) * (0.1 + 0.3 * fPower + 0.6 * day), cSnow * max(cS(0.0, 0.35, -0.35 - d + 0.9 * (bark - 0.8)), exp(-max(up, 0.0) * 22.0)));
 if (uOwn[7] < 0.0) tc = mix(tc, fMist * mix(0.6, 0.03, dj) + fLight * 0.06, -uOwn[7]);
 if (uOwn[7] > 0.0) tc = mix(tc, mix(fMist, mix(vec3(0.75), vec3(0.02), day), max(cS(0.8, 1.0, abs(d)), 0.7 * cS(0.5, 0.9, sin(d * 13.0 + 5.0 * bark + up * 3.0)))), uOwn[7]);
 fCol = mix(fCol, mix(tc, fMist * 0.7, haze), cover);
}
// A stand of ferns rooted along y = yb: fronds arching out to both sides, each a rib with leaflets.
// Returns how much of the pixel is frond, how far along the frond (0 root, 1 tip), and how near the rib.
vec3 cFerns(vec2 p, float yb, float sc, float seed, float aa) {
 float cw = 0.3 * sc;
 float c = p.x / cw + seed * 3.3, id = floor(c);
 float sway = (0.02 + 0.1 * uLow) * sin(uTime * 0.5 + p.x * 3.0 + seed);
 float cover = 0.0, along = 0.0, rib = 0.0;
 for (int j = 0; j < 6; j++) {
  float cid = id + float(j / 2 - 1), sgn = float(j & 1) * 2.0 - 1.0;
  float hx = hash21(vec2(cid, seed * 5.3 + float(j & 1) * 3.7)), hy = fract(hx * 57.31), h3 = fract(hx * 131.7);
  float h = sc * (0.22 + 0.16 * hy) * (1.0 + 0.75 * uOwn[1]) * (1.0 + 0.9 * abs(uOwn[0]));
  float t = (p.y - yb + 0.03 * sc * hx) / h, tt = sat(t);
  float lean = sgn * (0.2 + 0.6 * h3 + sway) * cw;
  float dx = p.x + seed * 3.3 * cw - (cid + 0.5 + (hx - 0.5) * 0.3) * cw - lean * tt * sqrt(tt);
  float env = pow(1.0 - tt, 0.8) * cS(0.0, 0.14, tt) * 0.21 * h + 0.004 * sc; // widest low down, drawn out to the tip
  float tooth = abs(sin(PI * (t * (15.0 + 6.0 * hy) - abs(dx) / env * 0.5))); // the leaflets, slanting toward the tip
  float w = env * (0.07 + 0.93 * sqrt(tooth));
  if (uOwn[0] > 0.0) w = mix(w, 0.02 * sc * (1.0 - tt) * cS(0.0, 0.1, tt), uOwn[0]);
  if (uOwn[0] < 0.0) w = mix(w, 1.7 * env * (1.0 - tt) * (0.94 + 0.06 * abs(cos(t * 24.0))), -uOwn[0]);
  float a = cS(w + aa, w - aa, abs(dx)) * step(0.0, t) * cS(1.0, 0.97, t);
  float top = step(0.02, a);
  along = mix(along, tt, top); rib = mix(rib, cS(0.012 * sc, 0.004 * sc, abs(dx)), top);
  cover = max(cover, a);
 }
 if (uOwn[7] > 0.0) rib = mix(rib, 1.6, uOwn[7] * cS(0.9, 0.5, cover));
 return vec3(cover * (1.0 - cPos(uOwn[5])) * (1.0 - cS(0.8, 1.0, -uOwn[1])), along, rib);
}
// The colour of a frond in the hour, the snow or the paper of the world: c as it was, along from 0 at its root to 1.
vec3 cFrond(vec3 c, vec3 green, float along, float rib, float near) {
 if (uOwn[2] == 0.0 && uOwn[6] >= 0.0 && uOwn[7] == 0.0) return c;
 float day = cDay;
 c *= cNight;
 c = mix(c, green * (0.35 + 0.5 * along) + fLight * 0.3, 0.8 * day);
 c = mix(c, vec3(0.62, 0.7, 0.8) * (0.1 + 0.3 * fPower + 0.7 * day), cSnow * cS(0.15, 0.7, along));
 if (uOwn[7] < 0.0) c = mix(c, fMist * mix(0.3, 0.05, near) + green * 0.05 * fPower + fLight * 0.2, -uOwn[7]);
 if (uOwn[7] > 0.0) c = mix(c, mix(fMist * 0.9, mix(green + fLight * 2.0, vec3(0.02), day), 0.15 + 0.85 * sat(rib)), uOwn[7]);
 return c;
}
vec3 cFloor(vec2 p) {
 float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, sat(uHits * 1.2 + uCue * 0.5));
 float px = 1.3 / uRes.y, day = cDay, night = cPos(-uOwn[2]), fog = cPos(-uOwn[5]), wet = 0.0, slope = cHill * 0.38 * p.x;
 vec2 was = p;
 if (uOwn[5] > 0.0) { // water over the floor: below its line the wood is seen again, upside down
  float line = mix(-0.75, -0.2, uOwn[5]), deep = line - p.y;
  wet = cS(0.0, 0.006, deep);
  float nearer = 0.04 + max(deep, 0.0);
  p.x += wet * nearer * (0.03 + 0.04 * uLow) * (sin(1.6 / nearer + uTime * 0.6) + 0.6 * sin(0.9 / nearer - uTime * 0.43 + p.x * 9.0));
  p.y = mix(p.y, line + deep * 1.25 + wet * nearer * 0.03 * sin(2.6 / nearer - uTime * 0.7), wet);
 }
 vec2 src = vec2(-0.6, 0.66); // the light comes from above the trees to the left
 src = mix(src, vec2(0.16, -0.02), fog);
 fPower = 0.35 + 0.9 * uLevel;
 fGlow = exp(-length((p - src) * vec2(0.6, 1.0)) * 1.9);
 // the mist: gold where the sun gets in, deep green where it does not, drifting
 float drift = noise(vec2(p.x * 1.7 - uTime * 0.02, p.y * 3.0 + uTime * 0.006)) * noise(vec2(p.x * 4.1 + uTime * 0.015, p.y * 6.0));
 float ml = fGlow * (0.45 + 1.6 * drift);
 fMist = (mix(vec3(0.0015, 0.010, 0.012), vec3(0.03, 0.10, 0.035), cS(0.0, 0.3, ml)) + vec3(0.55, 0.36, 0.05) * cS(0.15, 0.9, ml)) * fPower;
 if (night > 0.0) fMist = mix(fMist, (vec3(0.004, 0.01, 0.022) + vec3(0.07, 0.13, 0.2) * ml) * (0.5 + fPower), night);
 if (day > 0.0) fMist = mix(fMist, mix(vec3(0.34, 0.42, 0.42), vec3(0.95, 0.96, 0.9), sat(0.25 + ml * 0.9)) * (0.7 + 0.3 * fPower), day);
 if (fog > 0.0) fMist += fog * mix(vec3(0.9, 0.6, 0.3), cTint, night) * cS(0.085, 0.075, length(p - src)) * fPower * 0.7;
 if (uOwn[7] < 0.0) fMist = mix(fMist, fMist / (0.25 + ml) * 0.5 * (0.6 + 0.2 * floor(p.y * 5.0 + 2.5 + 0.12 * sin(p.x * 6.0))), -uOwn[7]);
 fCol = fMist;
 // the shafts: one for each kind of sound, as bright as it is loud, slanting down from the left
 float u = p.x + 0.42 * p.y;
 vec3 shaft[3] = vec3[3](vec3(0.0), vec3(0.0), vec3(0.0));
 float fine = 0.55 + 0.45 * noise(vec2(u * 34.0, uTime * 0.05));
 for (int k = 0; k < 5; k++) {
  float fk = float(k);
  float at = -0.62 + 0.3 * fk + 0.04 * sin(uTime * 0.07 + fk * 2.3);
  float wd = 0.035 + 0.02 * sin(fk * 1.7 + 1.0) + 0.03 * lv[k];
  float du = (u - at) / wd;
  float b = (exp(-du * du) + 0.22 * exp(-du * du * 0.1)) * fine * (0.05 + 1.1 * lv[k]) * (0.45 + 0.55 * cS(-0.5, 0.5, p.y)) * (0.6 + 0.8 * drift);
  if (fog > 0.0) { b *= 1.0 - 0.92 * fog; float col = (p.x - at - 0.1) / 0.17; fMist += fog * uKind[k] * uKind[k] * lv[k] * 0.45 * exp(-col * col - 2.0 * abs(p.y)) * (0.4 + drift); }
  vec3 kc = uKind[k]; kc = mix(mix(vec3(1.0, 0.8, 0.45), vec3(0.4, 0.62, 1.0), night), kc * kc * 1.8 + 0.05, 0.72);
  shaft[k % 3] += kc * b * fPower * 0.75;
 }
 if (fog > 0.0) fCol = fMist;
 fLight = shaft[0] + shaft[1] + shaft[2];
 for (int j = 0; j < 4; j++) { // four ranks of trunks from far to near, the shafts coming down between them
  float dj = j == 0 ? 0.0 : j == 1 ? 0.3 : j == 2 ? 0.58 : 1.0;
  if (j == 3) {
   // ferns at the feet of the nearer trees
   vec3 fa = cFerns(p, -0.37 - slope, 0.55, 1.0, px);
   vec3 green = mix(vec3(0.10, 0.34, 0.03), vec3(0.45, 0.48, 0.04), fa.y);
   vec3 fc = vec3(0.003, 0.014, 0.008) * (0.5 + fa.y) + green * ((0.10 + 0.5 * fGlow) * fPower + dot(fLight, vec3(0.9))) * (0.4 + 0.6 * fa.y) + fLight * 0.5;
   fc = cFrond(fc, green, fa.y, fa.z, 0.0);
   fCol = mix(fCol, mix(fc * (1.0 - 0.5 * fa.z * (1.0 - cInk)), fMist, 0.25), fa.x);
  }
  cTrunks(p, dj, float(j) + 1.0, px);
  if (j > 0) fCol += shaft[j - 1] * (j == 1 ? 0.8 : 1.0);
 }
 // and ferns close to the eye
 vec3 fb = cFerns(p + vec2(0.11, 0.0), -0.56 - slope, 1.25, 2.0, px + 0.006);
 vec3 green = mix(vec3(0.08, 0.30, 0.03), vec3(0.42, 0.46, 0.04), fb.y);
 vec3 fc = vec3(0.002, 0.010, 0.006) * (0.5 + fb.y) + green * ((0.07 + 0.45 * fGlow) * fPower + dot(fLight, vec3(0.9))) * (0.35 + 0.65 * fb.y) + fLight * 0.45;
 fc = cFrond(fc, green, fb.y, fb.z, 1.0);
 fCol = mix(fCol, fc * (1.0 - 0.5 * fb.z * (1.0 - cInk)), fb.x);
 vec3 col = fCol;
 // dust and small wings in the shafts, more with the high band
 vec2 mq = p * 15.0 + vec2(uTime * 0.05, -uTime * 0.03), mid = floor(mq);
 float mh = hash21(mid + 5.0), my = fract(mh * 57.31);
 vec2 mat_ = (vec2(mh, my) - 0.5) * 0.5 + 0.12 * vec2(sin(uTime * 0.4 + mh * 40.0), cos(uTime * 0.33 + my * 40.0));
 float md = length(fract(mq) - 0.5 - mat_);
 col += (fLight * 2.0 + vec3(0.3, 0.25, 0.1) * fGlow * fPower) * cS(0.07, 0.02, md) * step(0.55, my) * (0.4 + 1.6 * uHigh) * (0.5 + 0.5 * sin(uTime * (0.6 + mh) + my * 30.0));
 if (wet > 0.0) col = mix(col, col * vec3(0.62, 0.68, 0.7) + fMist * 0.06, wet);
 p = was;
 col = cFall(col, p, px, 0.15 + 0.35 * fPower);
 col /= 1.0 + (0.95 - 0.65 * day) * dot(p, p);
 return col;
}
vec3 render(vec2 p) {
 vec3 col;
 if (uVar < 0.5) col = cUp(p); else col = cFloor(p);
 return screenOf(col * 1.05);
}
