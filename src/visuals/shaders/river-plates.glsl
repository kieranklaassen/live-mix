// name: River plates
// a: Plate rack
// b: Round the jar
// what: Eleven blue and white dishes stand in a wooden rack in morning light, and one river painted in five washes of cobalt runs on from dish to dish past hills and reeds; its boat turns pale as it crosses the dark wood. Or one great jar, so near that it fills the view, a wide strait and its ridges going round into shade.
// follows: A drone darkens the ridges, a pad lays the sky's wash, texture hatches the water, a phrase inks the reeds. Bands raise the ridges; the piece sets shores and islands. The loop moves the boat and sways the jar. A hit flushes five birds and rings the water; a cue floods one dish, or the jar's sky, with deep blue. Keys brighten the window's mark.
// own: 0 iron red paint at -1, copper green at 1; 1 a jade glaze at -1, dipped in deep colour from the foot up at 1, the painting left pale; 2 night by one warm lamp at -1, bright noon and a limewashed rack or pale room at 1; 3 close to the painting at -1, at 1 along the rack from the side, or down on the jar and its open mouth; 4 petal-edged dishes and a lobed jar at -1, eight-sided dishes and a jar of flat sides at 1; 5 winter at -1, snow on the hills and pale water, at 1 rain and a high river
float rpD;             // how much pigment lies here
vec3 rpTint;           // a thin enamel over the glaze
float rpPx;            // a pixel, in the painting's own measure
vec3 rpN, rpM;         // the shake of the hand: broad, and fine
float rpWash(float d) { return smoothstep(-rpPx, rpPx, d); }
// three noises for the price of one
vec3 rpRand(vec2 p) { float h = hash21(p); return fract(h * vec3(1.0, 57.31, 131.7)); }
vec3 rpNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(rpRand(i), rpRand(i + vec2(1, 0)), f.x), mix(rpRand(i + vec2(0, 1)), rpRand(i + vec2(1, 1)), f.x), f.y);
}
// a brush line of half width w, pale where it is finer than a pixel
float rpLine(float d, float w) { return (1.0 - smoothstep(max(w - rpPx, 0.0), w + rpPx, abs(d))) * min(1.0, 0.3 + w / (1.6 * rpPx)); }
float rpSeg(vec2 p, vec2 a, vec2 b, float wa, float wb) {
  vec2 d = b - a, q = p - a;
  float h = sat(dot(q, d) / dot(d, d));
  return rpLine(length(q - d * h), mix(wa, wb, h));
}
// a wash, with a darker edge where it dried
void rpLay(float d, float tone, float pool, float hold) { rpD = mix(rpD, tone + pool * exp(-max(d, 0.0) * 160.0), rpWash(d) * hold); }
// One hill: an outline, the far flank flooded, thinning down into bare glaze.
void rpHill(vec2 s, float at, float wide, float base, float high, float seed, float tone, float ink) {
  float t = (s.x - at) / wide;
  t /= 1.0 + sign(t) * 0.45 * (fract(seed * 0.731) - 0.5);
  float m = 1.0 - abs(t);
  if (m <= 0.0 || s.y > base + high * 1.15) return;
  float sharp = 0.15 + 0.5 * fract(seed * 0.37), near = smoothstep(0.0, 0.2, m);
  float bump = 0.05 * sin(t * 9.0 + seed) + 0.10 * (rpN.x - 0.5) + 0.05 * (rpM.x - 0.5);
  float top = base + high * (mix(m * m * (3.0 - 2.0 * m), m, sharp) + bump * near);
  float up = length(vec2(1.0, high / wide * mix(6.0 * m * (1.0 - m), 1.0, sharp))), d = (top - s.y) / up;
  if (d < -0.015) return;
  float dd = max(d, 0.0), low = smoothstep(base + 0.02, base + 0.02 + 0.5 * high, s.y) * near, white = max(-uOwn[5], 0.0);
  float fold = (t + 0.10 - 0.13 * sin(dd * 26.0 + seed * 5.0) - 0.16 * (rpN.y - 0.5)) * wide;
  float flank = smoothstep(-rpPx, rpPx, fold), thin = mix(exp(-dd * 5.0), 0.15 + 0.85 * smoothstep(0.0, 0.09, dd) * exp(-dd * 2.0), white);
  float body = tone * thin * (0.25 + flank * (0.75 + 0.35 * exp(-max(fold, 0.0) * 130.0)) + 0.35 * (1.0 - ink) * (1.0 - flank)) * (0.8 + 0.4 * rpM.y);
  // strokes down the lit side
  float ln = dd * 34.0 + 1.2 * rpN.y + seed;
  body += ink * 0.4 * tone * (1.0 - flank) * (1.0 - smoothstep(0.06, 0.2, abs(fract(ln) - 0.5))) * smoothstep(0.5, 0.75, rpN.z) * (1.0 - smoothstep(0.02, 0.16, dd));
  rpD = mix(rpD, body, rpWash(d) * low);
  rpD += ink * low * rpLine(d - 0.002, 0.0011 + 0.0036 * rpM.x * (0.35 + flank)) * (0.3 + 0.8 * tone);
  rpD += (1.0 - ink) * low * rpWash(d) * tone * 0.5 * exp(-dd * 190.0);
}
// the middle of the river and half its width
vec2 rpRiver(float x) {
  float flood = 1.0 + 0.5 * max(uOwn[5], 0.0);
  if (uVar > 0.5) return vec2(-0.09 + 0.04 * sin(x * 2.1) + 0.025 * sin(x * 3.7 + 1.0), (0.15 + 0.035 * sin(x * 1.7 + 2.0)) * flood);
  float up = smoothstep(-0.2, 1.2, x);
  return vec2(-0.235 + 0.24 * up + 0.05 * sin(x * 4.6 + 1.2), mix(0.115, 0.06, up) * (1.0 + 0.2 * sin(x * 6.0 + 2.0)) * flood);
}
// The boat: hull, mat roof, and one standing with a pole.
vec3 rpBoatAt(vec2 o) {
  if (abs(o.x) > 0.075 || abs(o.y) > 0.08) return vec3(0.0);
  float sag = 7.0 * o.x * o.x, hull = min(min(sag - o.y, o.y - 0.55 * sag + 0.0115), 0.05 - abs(o.x));
  float roof = min(0.022 - 34.0 * (o.x + 0.006) * (o.x + 0.006) - o.y, o.y - 0.001);
  float pole = max(rpSeg(o, vec2(0.026, 0.054), vec2(0.046, -0.022), 0.0012, 0.001), rpSeg(o, vec2(0.031, 0.004), vec2(0.0315, 0.026), 0.0036, 0.0022));
  return vec3(rpWash(hull), rpWash(roof), pole);
}
// A hit: five birds flushed from beside the boat.
float rpBirds(vec2 o) {
  float k = 0.0, gone = 1.0 - uHits;
  if (uHits > 0.003 && abs(o.x) < 0.4 && abs(o.y - 0.17) < 0.2) for (int j = 0; j < 5; j++) {
    float fj = float(j);
    vec2 q = o - vec2(-0.13 + 0.066 * fj + 0.05 * (fj - 1.5) * gone, 0.085 + 0.06 * fract(fj * 0.618) + 0.1 * gone * (0.7 + 0.5 * fract(fj * 0.37)));
    q.x = abs(q.x + 0.25 * q.y);
    k = max(k, rpLine(q.y - 0.6 * q.x + 11.0 * q.x * q.x, max(0.0062 - 0.2 * q.x, 0.0)) * step(q.x, 0.031));
  }
  return k * sat(uHits * 1.6);
}
// where along the piece a place of the painting is
float rpAlong(float x) { return uVar > 0.5 ? abs(fract(x * 0.45) * 2.0 - 1.0) : sat((x + 0.95) / 2.1); }
// The painting: s.x along the river, s.y from -0.5 to 0.5.
void rpPaint(vec2 s, vec2 boat) {
  rpTint = vec3(1.0);
  bool jar = uVar > 0.5;
  float rain = max(uOwn[5], 0.0), snow = max(-uOwn[5], 0.0);
  rpN = rpNoise(s * 8.0); rpM = rpNoise(s * vec2(27.0, 21.0) + 5.0);
  s += 0.005 * (rpN.xz - 0.5);
  float x = s.x, y = s.y;
  vec2 rv = rpRiver(x);
  // the sky: level washes that come with the pad
  rpD = 0.0;
  if (y > 0.0) {
    vec3 sky = rpNoise(vec2(x * 1.7 + uTime * 0.006, y * 13.0 + 3.0));
    float k = sky.x * 0.8 + rpN.x * 0.14 + rpM.x * 0.06 - 0.68 + 0.22 * uPad + 0.1 * rain;
    rpD = (0.07 + 0.2 * uPad) * smoothstep(0.0, 0.016, k) * (0.65 + 0.7 * (1.0 - smoothstep(0.0, 0.045, k))) + (0.4 * snow + 0.36 * rain) * smoothstep(-0.1, 0.4, y) * (0.7 + 0.6 * sky.y);
    // on the jar a cue floods the whole sky with deep wet blue
    if (jar) rpD = mix(rpD, 0.75 + 0.5 * sky.y + 0.3 * rpN.y, sat(1.2 * uCue) * 0.9);
    rpD *= smoothstep(0.0, 0.12, y);
  }
  // sixteen ridges, even ones far, odd ones near
  float gap = 0.16, trend = jar ? -0.02 : -0.17 + 0.24 * smoothstep(-0.2, 1.2, x);
  if (y > min(trend, rv.x + 0.4 * rv.y)) for (int row = 0; row < 2; row++) {
    if (!jar && (row == 0 ? y < 0.13 : y > trend + 0.36)) continue;
    float fr = float(row);
    if (!jar) gap = row == 0 ? 0.07 : 0.115;
    float c0 = floor((x + 1.02) / gap * 0.5 - 0.5 * fr);
    for (int i = -1; i < 2; i++) {
      float id = 2.0 * (c0 + float(i)) + fr, h = hash11(mod(id, 97.0) + 4.1), h2 = fract(h * 37.7);
      float lv = uBands[int(mod(id, 16.0))], cx = -1.02 + (id + 1.0 + 0.6 * (h - 0.5)) * gap;
      if (row == 0) rpHill(s, cx, gap * (1.35 + 0.6 * h2), jar ? trend : 0.13, jar ? 0.18 + 0.17 * h + 0.14 * lv : 0.04 + 0.1 * h * h + 0.11 * lv, h * 91.0 + 3.0, (0.15 + 0.12 * h2 + 0.28 * uDrone) * (1.2 - 0.4 * uSpace), jar ? 0.0 : 0.5);
      else rpHill(s, cx, gap * (0.8 + 0.8 * h2), trend, (jar ? 0.1 + 0.15 * h2 * h2 : 0.08 + 0.1 * h2 * h2) + (jar ? 0.15 : 0.11) * lv, h * 77.0 + 8.0, 0.45 + 0.25 * h + 0.4 * uDrone, 1.0);
    }
  }
  // the river in five washes, each with a darker edge where it dried
  float u = (y - rv.x) / rv.y, shore = 0.45 * sat(piece(vec2(rpAlong(x + 0.1 * u + 0.12 * (rpN.z - 0.5)), u > 0.0 ? 0.2 : 0.85)).a * (0.5 + 0.6 * uEnergy));
  float wet = (1.0 - shore + 0.16 * (rpN.x - 0.5) + 0.1 * (rpM.x - 0.5) - abs(u)) * rv.y;
  if (wet > -0.02) {
    vec3 run = rpNoise(vec2(x * 3.0 - uTravel * 0.04, u * 1.7 + 4.0));
    float deep = max((0.85 - 0.85 * u * u) + 0.95 * (run.x - 0.5) - 0.1 * u, 0.0) * 4.2, fl = min(floor(deep), 4.0), fr = deep - fl;
    float tone = 0.09 + 0.18 * (fl + smoothstep(0.0, 0.05 + rpPx * 4.2 / rv.y, fr));
    tone += 0.14 * (1.0 - smoothstep(0.02, 0.3, fr)) * smoothstep(0.0, 0.05, fr) * min(fl, 1.0);
    tone *= (1.0 - 0.55 * snow) * (0.85 + 0.3 * rpM.y);
    // fine level strokes where there is texture
    float ln = (y + 0.004 * sin(x * 13.0)) * 120.0, row = floor(ln), hr = hash11(row);
    float dash = fract(x * 2.3 + hr * 9.0 - uTravel * 0.015);
    float hatch = (1.0 - smoothstep(0.08, 0.26, abs(ln - row - 0.5))) * smoothstep(0.0, 0.12, dash) * (1.0 - smoothstep(0.2 + 0.2 * uTexture, 0.4 + 0.2 * uTexture, dash)) * step(0.45, fract(hr * 7.7));
    tone += hatch * (0.14 + 0.4 * uTexture);
    // a hit sends a ring over the water from the boat
    vec2 rq = (s - boat) * vec2(0.7, 1.5);
    float ring = length(rq) - 0.13 - 0.22 * (1.0 - uHits);
    tone = mix(tone, 0.04, sat(uHits * 1.3) * 0.75 * exp(-ring * ring * 420.0));
    rpD = mix(rpD, tone, rpWash(wet));
    rpD += rpLine(wet, 0.001 + 0.003 * rpM.z) * (0.35 + 0.5 * rpN.z);
  }
  // the near bank
  if (y < rv.x) for (int i = -1; i < 2; i++) {
    float id = floor(x / 0.21 + 0.5) + float(i), h = hash11(mod(id, 61.0) + 6.6);
    rpHill(s, (id + 0.3 * (h - 0.5)) * 0.21, 0.2 + 0.16 * h, -0.56, (rv.x - rv.y + 0.56) * (jar ? 0.3 + 0.75 * h : 0.35 + 0.35 * h) + 0.04, h * 63.0, 0.5 + 0.3 * h + 0.2 * uLow, 1.0);
  }
  // islands, where the piece has something: a rock and a tree or two
  float pitch = jar ? 0.3 : 0.235, i0 = floor(x / pitch);
  if (abs(u) < 1.6) for (int i = 0; i < 2; i++) {
    float id = i0 + (fract(x / pitch) < 0.5 ? -float(i) : float(i)), h = hash11(mod(id, 83.0) + 2.7), h2 = fract(h * 91.3);
    float cx = (id + 0.5 + 0.3 * (h - 0.5)) * pitch, row = mod(id, 2.0);
    vec2 r = rpRiver(cx);
    vec4 m = piece(vec2(rpAlong(cx), row < 0.5 ? 0.34 : 0.68));
    float big = 0.35 * smoothstep(0.35, 0.8, h2) + 1.1 * sat(m.a * (0.6 + 0.6 * uEnergy));
    if (big < 0.02) continue;
    float lf = smoothstep(0.1, 0.35, big), on = smoothstep(0.0, 0.2, big);
    big = min(big, 1.0) * (jar ? 1.25 : 1.0);
    vec2 o = s - vec2(cx, r.x + r.y * (row < 0.5 ? 0.3 : -0.45));
    float w = 0.035 + 0.075 * big, tall = (0.012 + 0.032 * big) * on, q = 1.0 - o.x * o.x / (w * w);
    if (q < -0.6 || abs(o.y) > 0.14) continue;
    float top = tall * q * (0.75 + 0.5 * rpN.x + 0.3 * rpM.x), d = min(top - o.y, o.y + 0.008 * q * on);
    float flank = rpWash(o.x - w * (0.1 + 0.5 * (rpN.y - 0.5)));
    // bare glaze kept round it, then the rock
    rpD *= 1.0 - 0.7 * on * smoothstep(0.0, 0.6, q) * smoothstep(-0.02, -0.004, o.y) * (1.0 - smoothstep(0.0, 0.012, o.y));
    rpLay(d, 0.06 + 0.5 * flank, 0.2, on);
    rpD += 0.9 * on * rpLine(d, 0.0012 + 0.002 * rpM.x);
    vec3 c = m.a > 0.01 ? m.rgb / m.a : vec3(1.0);
    float leaf = 1e3;
    vec2 tr = o - vec2(-0.2 * w, tall * 0.7);
    float hgt = (0.03 + 0.04 * h2) * lf + 0.001;
    tr.x -= (0.3 * (h - 0.5) + 0.05 * sin(uTime * 0.31 + id)) * tr.y;
    if (tr.y < hgt) rpD += 0.9 * rpLine(tr.x, 0.0018) * smoothstep(0.0, 0.004, tr.y) * lf;
    for (int j = 0; j < 3; j++) {
      vec2 b = tr - hgt * vec2(0.55 * float(j) - 0.5, j == 1 ? 1.15 : 0.8 + 0.2 * h);
      leaf = min(leaf, length(b * vec2(0.62, 1.5)) - hgt * 0.36);
    }
    leaf += 0.012 * (rpM.y - 0.5) + 0.006 * (rpN.y - 0.5);
    rpLay(-leaf, 0.75 + 0.5 * rpM.z, 0.3, lf);
    rpTint = mix(rpTint, mix(vec3(1.0), c, 0.6), max(rpWash(d), rpWash(-leaf) * lf) * sat(m.a) * 0.9);
  }
  // reeds on the near bank, a fan from one root
  if (y < (jar ? 0.0 : -0.17)) {
    float pr = jar ? 0.26 : 0.2, id = floor(x / pr), h = hash11(mod(id, 71.0) + 8.8);
    vec2 o = vec2(x - (id + 0.4 + 0.2 * h) * pr, y + (jar ? 0.5 : 0.46) - 0.03 * h);
    float on = smoothstep(0.1, 0.2, fract(h * 17.3));
    if (on > 0.0 && o.y > -0.03) for (int j = 0; j < 6; j++) {
      float fj = float(j), g = fract(h * 13.1 + fj * 0.618), tall = (0.10 + 0.13 * g) * (jar ? 1.35 : 1.0) * (0.85 + 0.2 * uPhrase), v = o.y / tall;
      if (v > 1.0) continue;
      float bend = (fj - 2.5) * 0.006 + (g - 0.5) * 0.16 * v * v + 0.012 * v * sin(uTime * 0.4 + fj + id) * (0.4 + uPhrase);
      rpD = max(rpD, on * rpLine(o.x - bend, 0.0046 * (1.0 - v) * smoothstep(-0.2, 0.3, v) + 0.0006) * (0.5 + 0.7 * uPhrase) * (0.55 + 0.45 * g));
    }
  }
  // the boat
  vec2 o = (s - boat) / (jar ? 1.4 : 1.0);
  vec3 b = rpBoatAt(o);
  rpD *= 1.0 - 0.9 * (1.0 - smoothstep(0.034, 0.042, length(o * vec2(0.6, 1.5) + vec2(0.0, -0.004)) + 0.02 * (rpM.x - 0.5)));
  rpD = mix(mix(rpD, 0.42, b.y), 1.5, max(b.x, b.z));
  rpD = mix(rpD, 1.4, rpBirds(o));
  // a shower
  if (rain > 0.0) {
    vec2 q = rot(-0.25) * s * vec2(85.0, 9.0) + vec2(0.0, mod(uTravel * 0.25, 64.0)), c = floor(q);
    rpD += 0.3 * rain * step(0.68, hash21(vec2(c.x, mod(c.y, 64.0)))) * (1.0 - smoothstep(0.05, 0.05 + 85.0 * rpPx, abs(fract(q.x) - 0.5))) * smoothstep(0.0, 0.2, fract(q.y)) * (1.0 - smoothstep(0.5, 0.9, fract(q.y)));
  }
}
vec3 rpPig() {
  vec3 k = mix(vec3(2.35, 1.6, 0.72), vec3(0.55, 1.75, 2.1), max(-uOwn[0], 0.0));
  return mix(k, vec3(2.4, 0.85, 1.35), max(uOwn[0], 0.0));
}
vec3 rpGlaze() { return mix(vec3(0.925, 0.94, 0.945), vec3(0.66, 0.80, 0.70), max(-uOwn[1], 0.0)); }
// Pigment under glaze. Below the dip line the ground is deep and the painting left pale.
vec3 rpFired(float dip) { return rpGlaze() * rpTint * exp(-mix(rpD, max(1.4 - 1.25 * rpD, 0.02), dip) * rpPig()); }
vec2 rpBoat() {
  float x = uVar > 0.5 ? uTravel * 0.006 + 0.12 - 0.2 * cos(TAU * uLoop) : -0.2 - 0.34 * cos(TAU * uLoop);
  vec2 r = rpRiver(x);
  return vec2(x, r.x - 0.02 * r.y + 0.0015 * sin(uTime * 0.7));
}
// The dishes, nearest first: across, shelf, radius, own number.
const vec4 RPP[11] = vec4[11](
  vec4(0.05, 0.0, 0.148, 0.2), vec4(0.70, 0.0, 0.165, 0.7), vec4(-0.31, 1.0, 0.150, 0.5), vec4(0.415, 1.0, 0.165, 0.9),
  vec4(-0.25, 0.0, 0.262, 0.3), vec4(0.37, 0.0, 0.245, 0.6), vec4(1.00, 0.0, 0.235, 0.1), vec4(-0.68, 0.0, 0.215, 0.8),
  vec4(0.05, 1.0, 0.218, 0.4), vec4(-0.66, 1.0, 0.205, 0.0), vec4(0.80, 1.0, 0.222, 1.0));
float rpShelf(float row) { return row < 0.5 ? -0.445 : 0.125; }
vec3 rpWood(vec2 w, float along) {
  vec3 f = rpNoise(w * vec2(80.0, 2.6) + along);
  vec3 c = mix(vec3(0.16, 0.105, 0.065), vec3(0.34, 0.235, 0.15), 0.1 + 0.4 * f.x + 0.45 * noise(vec2(w.x * 23.0 + along, w.y * 1.6)));
  return mix(c, c + vec3(0.44, 0.42, 0.38), max(uOwn[2], 0.0));
}
// the window's light: tall panes of it lying slanting over the rack
vec3 rpLight(vec2 w) {
  float a = w.x + 0.42 * w.y - 0.03 * sin(uTime * 0.021), b = w.y - 0.2 * w.x;
  float pane = smoothstep(-0.66, -0.54, a) * (1.0 - smoothstep(0.42, 0.62, a)) * (0.25 + 0.75 * smoothstep(0.012, 0.05, abs(a + 0.07)));
  pane *= (1.0 - smoothstep(0.36, 0.46, b)) * (0.3 + 0.7 * smoothstep(0.012, 0.05, abs(b + 0.02)));
  vec3 l = vec3(0.80, 0.88, 1.0) * mix(0.68, 0.48, smoothstep(-0.8, 1.2, w.x)) + vec3(1.0, 0.91, 0.76) * pane * 0.38;
  l = mix(l, vec3(0.97, 0.98, 0.97), max(uOwn[2], 0.0) * 0.75);
  vec2 q = w - vec2(0.42, -0.3);
  l = mix(l, vec3(1.1, 0.84, 0.58) * (0.12 + exp(-dot(q, q) * 1.7)) + vec3(0.03, 0.05, 0.11), max(-uOwn[2], 0.0));
  return l * (1.0 + 0.1 * uLevel) + vec3(0.13, 0.07, 0.02) * uMic;
}
// Where w lies in a dish, in radii; z is 1 at the lip.
vec3 rpDish(vec2 w, vec4 k) {
  vec2 q = (w - vec2(k.x, rpShelf(k.y) + k.z * 0.985)) / k.z;
  float r = length(q) + 1e-5;
  if (abs(uOwn[4]) > 0.001 && r < 1.3) {
    float an = atan(q.y, q.x + 1e-6) + k.w * 2.0;
    r *= uOwn[4] > 0.0 ? mix(1.0, 1.04 * cos(mod(an, PI / 4.0) - PI / 8.0) / cos(PI / 8.0), uOwn[4]) : 1.0 + uOwn[4] * 0.09 * (abs(sin(an * 6.0)) - 0.7);
  }
  return vec3(q, r);
}
// One dish with the painting on it.
vec3 rpGlazed(int i, vec2 w, vec3 light, float sh) {
  vec4 k = RPP[i];
  vec3 at = rpDish(w, k);
  vec2 q = at.xy, dir = q / (length(q) + 1e-5);
  float r = at.z, px = rpPx / k.z, keep = rpD;
  float bowl = 0.12 + 0.35 * fract(k.w * 7.3 + 0.2), x = (r - 0.69) / 0.055;
  float slope = mix((r < 0.69 ? bowl * r : bowl * 0.5) + 0.62 * exp(-x * x), -0.9, smoothstep(0.955, 1.0, r));
  vec3 n = normalize(vec3(-slope * dir + 0.1 * (fract(k.w * vec2(3.7, 5.9)) - 0.5), 1.0));
  // a blue line round the lip and two round the well; the small dishes have a flooded rim
  rpD += 0.75 * rpLine((r - 0.965) * k.z, 0.0032) + 0.6 * rpLine((r - 0.735) * k.z, 0.0014);
  if (i < 4) rpD = mix(rpD, 0.62 + 0.25 * rpN.x + 0.25 * exp(-abs(r - 0.735) * 70.0) + 0.3 * exp(-abs(0.95 - r) * 60.0), smoothstep(0.735 - px, 0.735 + px, r) * (1.0 - smoothstep(0.945, 0.955, r)));
  // a cue floods one dish with deep wet blue
  if (i == 4) rpD = mix(rpD, 1.05 + 0.5 * rpN.x + 0.3 * exp(-abs(1.0 - r) * 14.0), sat(1.3 * uCue) * 0.92 * (1.0 - smoothstep(0.93, 0.95, r)));
  float dip = smoothstep(-px, px, 2.4 * max(uOwn[1], 0.0) - 1.22 - q.y + 0.07 * sin(q.x * 3.0 + k.w * 9.0)), f = (r - 0.655) / 0.05;
  vec3 c = rpFired(dip) * mix(vec3(1.0), vec3(0.78, 0.90, 0.955), 0.75 * exp(-f * f));
  c *= light * (0.60 + 0.80 * max(dot(n, vec3(-0.634, 0.346, 0.692)), 0.0)) * mix(0.4, 1.0, sh);
  // the window bent in the glaze
  vec2 g = abs(2.0 * n.xy * n.z - vec2(-0.44, 0.24)) / vec2(0.13, 0.2);
  float blur = mix(0.4, 0.1, uTone);
  float win = (1.0 - smoothstep(1.0 - blur, 1.0 + blur, max(g.x, g.y))) * (0.35 + 0.65 * smoothstep(0.06, 0.13, min(g.x, g.y)));
  rpD = keep;
  return c + win * (0.15 + 0.4 * uKeys + 0.1 * uHigh) * (light + 0.15) * mix(0.5, 1.0, sh);
}
vec3 rpRack(vec2 p) {
  float near = max(-uOwn[3], 0.0), slant = max(uOwn[3], 0.0), zoom = 1.0 - 0.42 * near;
  vec2 z = p * zoom - vec2(0.1, 0.1) * near;
  float per = 1.0 / max(1.0 - (0.2 + 0.22 * slant) * z.x + 0.05 * z.y, 0.3);
  vec2 w = z * per + vec2(-0.12 * slant, 0.0), boat = rpBoat();
  float px = per * per * zoom / uRes.y;
  rpPx = px * 0.8;
  vec3 light = rpLight(w), col = vec3(0.0);
  // front to back: the first dish, the one behind its edge, and the light the nearer ones let by
  float left = 1.0, sh = 1.0, shA = 1.0, shB = 1.0, covA = 0.0, covB = 0.0;
  int A = -1, B = -1;
  for (int i = 0; i < 11; i++) {
    vec4 k = RPP[i];
    float r = rpDish(w, k).z, cov = smoothstep(-px, px, (1.0 - r) * k.z);
    if (cov > 0.0) {
      if (A < 0) { A = i; covA = cov; shA = sh; } else { B = i; covB = left * cov; shB = sh; }
      left *= 1.0 - cov;
      if (left < 0.01 || B >= 0) break;
    }
    vec2 v = w - vec2(k.x + 0.045, rpShelf(k.y) + k.z * 0.985 - 0.026);
    sh *= 1.0 - 0.8 * (1.0 - smoothstep(k.z - 0.03, k.z + 0.03, length(v)));
  }
  // the shelf's front edge stands before everything
  float lipY = w.y - rpShelf(w.y > -0.15 ? 1.0 : 0.0), lip = smoothstep(-px, px, 0.012 - lipY) * smoothstep(-px, px, lipY + 0.03) * (1.0 - smoothstep(1.27 - px, 1.27 + px, w.x));
  if (A >= 0 && lip < 0.99) {
    rpPaint(w, boat);
    col = covA * rpGlazed(A, w, light, shA);
    if (covB > 0.0) col += covB * rpGlazed(B, w, light, shB);
  }
  if (left > 0.01 || lip > 0.0) {
    // the back boards, in the rack's shade, or the edge of the shelf
    bool edge = lip > 0.5;
    float bd = w.x / 0.19, id = floor(bd), under = rpShelf(1.0) - 0.03 - w.y;
    vec3 c = rpWood(edge ? w.yx : w, edge ? 3.0 : id * 9.7) * light;
    if (edge) c *= 1.0 + 0.8 * smoothstep(0.004, 0.012, lipY) - 0.5 * (1.0 - smoothstep(-0.03, -0.018, lipY));
    else c *= (0.8 + 0.35 * hash11(id + 3.0)) * (0.3 + 0.7 * smoothstep(0.006, 0.02, 0.5 - abs(fract(bd) - 0.5))) * (0.5 + 0.6 * sh) * (under > 0.0 ? 1.0 - 0.7 * exp(-under * 14.0) : 1.0);
    // far to the right the rack ends
    if (w.x > 1.24) {
      float in_ = smoothstep(1.27 - px, 1.27 + px, w.x);
      c = mix(c * (1.0 - 0.5 * smoothstep(1.24, 1.27, w.x)), mix(c * 2.0, vec3(0.80, 0.74, 0.64) * light * (1.0 - 0.6 * exp(-max(w.x - 1.34, 0.0) * 14.0)), smoothstep(1.34 - px, 1.34 + px, w.x)), in_);
    }
    // over the gap the boat is pale as bare glaze
    vec3 b = rpBoatAt(w - boat);
    if (edge) col = mix(col, c, lip);
    else col += left * mix(c, rpGlaze() * light * 0.85, max(max(b.x, 0.7 * b.y), max(b.z, rpBirds(w - boat))));
  }
  return col;
}
vec3 rpJar(vec2 p) {
  float near = max(-uOwn[3], 0.0), over = max(uOwn[3], 0.0), night = max(-uOwn[2], 0.0), noon = max(uOwn[2], 0.0);
  float turn = uTravel * 0.006 + 0.1 * sin(TAU * uLoop), f = 1.9 + 0.9 * near;
  vec3 ro = vec3(-0.07 - 0.1 * near, 0.72 + 0.75 * over, -2.0), ta = vec3(ro.x, 0.19 + 0.2 * over - 0.02 * near, 0.0);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0, 1, 0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * f + rt * p.x + up * p.y);
  // the room behind, out of focus, its window off to the left
  vec3 key = mix(mix(vec3(1.0, 0.93, 0.82), vec3(1.0), noon), vec3(1.05, 0.76, 0.50), night) * (1.0 + 0.1 * uLevel), fill = mix(vec3(0.80, 0.88, 1.0) * (0.26 + 0.22 * noon), vec3(0.10, 0.13, 0.20), night) + vec3(0.12, 0.07, 0.03) * uMic;
  vec3 L = normalize(mix(vec3(-0.75, 0.42, -0.55), vec3(0.75, 0.15, -0.5), night));
  float glow = exp(-dot(p - vec2(-1.0, 0.35), p - vec2(-1.0, 0.35)) * 1.6);
  vec3 col = mix(vec3(0.085, 0.065, 0.052), vec3(0.46, 0.37, 0.28), glow) * (1.0 - 0.8 * night) + noon * vec3(0.42, 0.40, 0.37);
  const float H = 0.9;
  vec3 a = vec3(ro.x, ro.y / H, ro.z), d = vec3(rd.x, rd.y / H, rd.z);
  float A = dot(d, d), B = dot(a, d), C = dot(a, a) - 1.0, h = B * B - A * C;
  if (h <= 0.0) return col;
  float t = (-B - sqrt(h)) / A;
  vec3 P = ro + rd * t, n = normalize(P / vec3(1.0, H * H, 1.0));
  float phi = atan(P.x, -P.z), lat = asin(clamp(P.y / H, -1.0, 1.0)), face = max(dot(n, -rd), 0.0);
  rpPx = 1.04 * t / (f * uRes.y) / max(face, 0.25);
  vec2 s = vec2(phi * 1.3 + turn, (lat - 0.47) * 1.3);
  rpPaint(s, rpBoat());
  // the rim's line, and the deep band above it
  rpD *= 1.0 - smoothstep(0.455 - rpPx, 0.455 + rpPx, s.y);
  rpD += 0.9 * rpLine(s.y - 0.46, 0.004) + 0.5 * rpLine(s.y - 0.476, 0.0015);
  rpD += smoothstep(0.49 - rpPx, 0.49 + rpPx, s.y) * (1.0 - smoothstep(0.71 - rpPx, 0.71 + rpPx, s.y)) * (0.75 + 0.4 * rpN.x + 0.3 * exp(-abs(s.y - 0.49) * 60.0));
  float dip = smoothstep(-rpPx, rpPx, 1.3 * max(uOwn[1], 0.0) - 0.62 - s.y + 0.03 * sin(s.x * 4.0) + 0.02 * sin(s.x * 11.0));
  vec3 c = rpFired(dip);
  // the body: throwing rings, and lobes or flat sides where the other worlds have them
  float turned = phi + turn / 1.3, part = mod(turned, PI / 6.0) - PI / 12.0;
  float yaw = uOwn[4] > 0.0 ? -uOwn[4] * part * (1.0 - smoothstep(0.225, 0.2618, abs(part))) : -uOwn[4] * 0.32 * sin(turned * 12.0);
  n.xz *= rot(yaw);
  n = normalize(n + vec3(0.0, 0.012 * sin(P.y * 90.0) + 0.02 * (rpN.y - 0.5), 0.0));
  c *= mix(vec3(1.0), vec3(0.75, 0.87, 0.93), 0.6 * max(-uOwn[4], 0.0) * smoothstep(0.4, 1.0, -cos(turned * 12.0)));
  float dif = max(dot(n, L), 0.0);
  c *= fill * (0.8 + 0.4 * n.y) + key * 0.9 * dif;
  // the window bent in the glaze
  vec3 r = reflect(rd, n);
  if (r.x < -0.05) {
    vec2 g = abs(vec2(r.z, r.y) / -r.x - vec2(0.12, 0.95)) / vec2(0.34, 0.4);
    float blur = mix(0.3, 0.06, uTone);
    float win = (1.0 - smoothstep(1.0 - blur, 1.0 + blur, max(g.x, g.y))) * smoothstep(0.03, 0.08, min(g.x, g.y));
    c += win * (0.19 + 0.4 * uKeys + 0.1 * uHigh) * vec3(0.9, 0.96, 1.0) * (1.0 - 0.8 * night);
  }
  c += key * (0.25 * night + 0.06) * pow(max(dot(n, normalize(L - rd)), 0.0), 60.0);
  c += (1.0 - smoothstep(0.0, 0.5, face)) * col * 0.5;
  // the mouth
  c = mix(c, vec3(0.02, 0.022, 0.03) + 0.05 * key * smoothstep(0.82, 0.9, s.y), smoothstep(0.765 - rpPx, 0.765 + rpPx, s.y));
  return mix(col, c, smoothstep(0.0, 6.0 / uRes.y, h));
}
vec3 render(vec2 p) { return uVar < 0.5 ? rpRack(p) : rpJar(p); }
