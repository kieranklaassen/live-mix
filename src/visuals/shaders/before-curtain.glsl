// name: Before the show
// a: Under the hem
// b: Gathered swags
// what: From the side of the front row a velvet curtain falls in deep pleats to a gold fringe; lamps we cannot see spill under its hem and along the waxed boards, and a thin parting glows; or the stage from its middle, cream silk drawn up in swags five deep over a painted sky with a low sun and a tree on wheels.
// follows: Each kind is a lamp behind, or lights one depth of silk. Pad opens the parting, drone warms the folds, texture is dust, phrase darkens the wheeled shadow or tree. Bands send light up the pleats, or lift the swags. A hit pushes a pleat or lights the far swags; a cue raises all a moment. Loop moves the oval or sun, keys gild the gold, the piece tints the sky.
// own: 0 sea green velvet or night blue silk at -1, bone velvet or rose red silk at 1; 1 few broad pleats or huge swags at -1, many narrow ones at 1; 2 hem on the boards or silk let far down at -1, hem knee high or silk drawn right up at 1; 3 further back at -1, close and low or near under the silk at 1; 4 moonlight behind at -1, a red fire or sunset at 1; 5 gauze with the lamps showing through, or sheer silk, at -1, broad stripes at 1
float bcPx, bcBack, bcPleat, bcTall, bcLift, bcCue, bcHit, bcBlow, bcBlown; // a pixel; and where cloth and camera stand
vec3 bcDye, bcSheen, bcTint, bcWarm; // the cloth's colour, its shine, the light behind
vec3 bcBy(vec3 low, vec3 mid, vec3 high, float q) { return q < 0.0 ? mix(mid, low, -q) : mix(mid, high, q); }
float bcBy(float low, float mid, float high, float q) { return q < 0.0 ? mix(mid, low, -q) : mix(mid, high, q); }
float bcLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
vec3 bcGel(int k) { vec3 c = uKind[k]; return (c * c * 1.75 + c * 0.04) * mix(vec3(1.0), bcTint, 0.6 * abs(uOwn[4])); }
float bcDn(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
float bcBump(float x) { return exp(-x * x); }

// ---- a: the great velvet curtain, along s, up y
float bcAt(float s, float y) { // which pleat, counted along the cloth
  return bcPleat * s + 0.42 * sin(0.83 * bcPleat * s + 0.6) + 0.23 * sin(1.71 * bcPleat * s + 2.0) + 0.05 * sin(0.9 * y + 1.3 * s);
}
float bcDeep(float s, float y) { // how far the cloth stands out toward us
  float draught = bcBump((s - bcBlow) * 0.8) * bcBlown;
  float u = bcAt(s, y) + 0.07 * draught * sin(1.3 * y + uTime * 0.5);
  float a = TAU * u;
  float c = 0.5 - 0.5 * cos(a + 0.45 * sin(a));
  float big = 0.78 + 0.22 * sin(0.61 * a + 1.0);
  float d = (0.27 / bcPleat * 1.9) * 0.5 * big * c * (1.35 - 0.35 * c);
  d += 0.13 * bcTall * (sin(2.0 * a + 1.5 * sin(0.37 * a) + 0.4 * y) + 0.2 * sin(5.0 * a + 2.0 * sin(0.7 * a) - 0.5 * y)) * (0.45 + 0.55 * exp(-0.4 * y));
  d += 0.035 * draught;
  // a push from behind
  vec2 at = vec2((s + 0.85) * 3.6, y - 0.75);
  d += bcHit * 0.17 * exp(-dot(at, at) * 1.6);
  return d;
}
float bcHem(float s) { // the height of the hem over the boards
  float c = cos(TAU * bcAt(s, 0.0));
  return bcLift + min(bcLift, 0.1) * (0.42 * c + 0.3 * sin(2.3 * s + 1.0)) + 0.36 * bcCue * (0.9 + 0.1 * c);
}
float bcSlit(float s, float y) { // below 0 inside the parting
  float mid = -2.55 + 0.05 * sin(0.8 * y);
  float w = (0.018 + 0.13 * uPad) * exp(-0.3 * y) * (1.0 + 0.25 * sin(1.9 * y + 0.6 + 0.15 * uTime));
  return abs(s - mid) - w;
}
float bcPlace(int k) { return float[5](-4.7, -3.1, -1.9, -0.05, -0.85)[k]; }
// The light that stands behind at s, as it shows in the gap.
vec3 bcBehind(float s) {
  vec3 c = bcTint * (0.42 + 0.15 * uLevel + 0.12 * sin(1.1 * s + 0.1 * uTime));
  for (int k = 0; k < 5; k++) {
    float x = (s - bcPlace(k)) / (k == 0 ? 1.1 : 0.62);
    c += bcGel(k) * bcLv(k) * bcBump(x) * (0.8 + 1.4 * uEnergy);
  }
  return c * (1.0 + 0.5 * uCue);
}
// Scenery rolled across behind: how much of the light at s gets by.
float bcWheels(float s, float soft) {
  float go = fract(uTime / 26.0), at = 1.8 - 9.5 * go, x = s - at;
  float leg = min(min(abs(x + 0.62), abs(x - 0.55)), abs(x - 0.36)) - 0.06;
  float body = abs(x) - 0.75;
  float dark = max(0.94 * bcDn(-soft, soft, leg), (0.35 + 0.45 * uPhrase) * bcDn(-soft - 0.05, soft + 0.05, body));
  return 1.0 - dark * smoothstep(0.0, 0.08, go) * bcDn(0.9, 1.0, go) * (0.6 + 0.4 * uPhrase);
}
// The light that lies on the boards at (s, z); z below 0 is behind the cloth.
vec3 bcFans(vec2 q, float d) {
  if (d < 0.0) return bcBehind(q.x) * bcWheels(q.x, 0.03) * (0.55 + 0.75 * exp(d * 1.5));
  vec3 c = vec3(0.0);
  for (int k = -1; k < 5; k++) {
    float H = k < 0 ? 0.5 : 0.10 + 0.035 * float((k * 2) % 5), D = k < 0 ? 1.0 : 1.0 + 0.4 * float((k * 3) % 5);
    vec2 src = vec2(k < 0 ? q.x : bcPlace(k), D);
    float f = d / (d + D), sc = mix(q.x, src.x, f), h = H * f;
    float soft = (0.004 + 0.022 * f) * (1.7 - 1.4 * uTone);
    float open = smoothstep(-soft, soft, bcHem(sc) - h);
    float side = (q.x - src.x) / (D + d);
    float fall = exp(-(0.45 - 0.3 * uSpace) * d) / (1.0 + 2.5 * side * side);
    vec3 hue = k < 0 ? bcTint * 0.4 : bcGel(k) * bcLv(k) * (0.9 + 1.5 * uEnergy) + bcTint * 0.12;
    c += hue * open * fall * bcWheels(mix(q.x, src.x, (d + 0.5) / (d + 0.5 + D)), 0.03 + 0.1 * f);
  }
  // and the long strip from the parting
  float D = 1.6, sx = -2.2 + 0.1 * sin(uTime * 0.05), f = d / (d + D), sc = mix(q.x, sx, f);
  float strip = bcDn(-0.01 - 0.05 * f, 0.01 + 0.05 * f, bcSlit(sc, 0.4));
  c += (bcTint + bcGel(1) * uPad * 2.0) * strip * exp(-0.22 * d) * (0.4 + 0.5 * uPad);
  return c * (1.0 + 0.6 * uCue);
}
// The twisted gold cords along the hem.
vec3 bcBullion(float s, float up, float len, float foot, vec3 leak, out float gap) {
  float n = s * 34.0, id = floor(n), x = fract(n) - 0.5;
  float fine = bcDn(0.12, 0.35, foot * 34.0);
  float twist = 0.5 + 0.5 * sin((up * 60.0 + x * 5.0) * 2.0);
  float round_ = sqrt(max(1.0 - 4.0 * x * x, 0.0));
  float b = mix(0.55, (0.25 + 0.75 * round_) * (0.6 + 0.5 * twist), fine);
  gap = smoothstep(0.42, 0.5, abs(x)) * fine;
  float lo = hash11(id + 5.0);
  float glint = (0.5 + fine) * band(lo) * smoothstep(0.3, 1.0, sin(uTime * (0.5 + lo) + lo * 40.0) * 0.5 + 0.5);
  vec3 gold = vec3(1.0, 0.56, 0.14);
  vec3 c = gold * b * (0.1 + leak * (0.55 + 0.6 * bcDn(0.0, len, up)));
  c += vec3(1.0, 0.8, 0.45) * pow(round_, 6.0) * twist * (glint * (0.4 + uEnergy) + 1.1 * uKeys * (0.4 + 0.6 * lo)) * (0.4 + leak);
  return c;
}
vec3 bcVelvet(vec3 q, vec3 rd, float foot, float across) {
  float s = q.x, y = q.y, e = 0.012 + foot;
  float d = bcDeep(s, y);
  vec3 n = normalize(vec3(-(bcDeep(s + e, y) - d) / e, -(bcDeep(s, y + e) - d) / e, -1.0));
  float hem = bcHem(s), up = y - hem;
  float tall = bcTall;
  float ao = smoothstep(-0.02, 0.95 * tall, d); ao = 0.02 + 0.98 * ao * ao;
  float face = sat(dot(n, -rd)), graze = pow(1.0 - face, 1.9) * smoothstep(0.0, 0.15, face);
  // the pile: brushed patches and fine upright streaks
  float u = bcAt(s, y);
  float nap = noise(vec2(u * 2.3, y * 1.5)) * 0.6 + noise(vec2(u * 7.0 + 3.0, y * 4.0)) * 0.4;
  float pile = noise(vec2(u * 60.0, y * 14.0));
  pile = mix(0.5, pile, bcDn(0.004, 0.02, foot));
  float brushed = 0.55 + 0.8 * smoothstep(0.15, 0.85, nap) + 0.4 * (pile - 0.5);
  vec3 dye = bcDye;
  float stripe = max(uOwn[5], 0.0);
  dye = mix(dye, bcSheen * vec3(0.9, 0.75, 0.42) + dye * 0.2, stripe * smoothstep(-0.12, 0.12, sin(TAU * u * 2.0 + 0.8) - 0.15));
  // the house: a dim warm wash from the front
  vec3 L = normalize(vec3(0.75, 0.5, -0.8));
  float dif = sat(dot(n, L));
  vec3 c = dye * ao * (0.10 + 0.22 * dif) * mix(vec3(1.0, 0.86, 0.76), bcWarm, 0.5) * brushed;
  c += bcSheen * graze * (0.2 + 0.8 * ao) * 0.16 * brushed * (0.3 + 0.7 * sat(0.5 + n.x));
  // the warm oval of the front light
  vec2 o = vec2(s + 1.35 + 0.4 * sin(TAU * uLoop) - 0.5 * d, y - 2.05 - 0.12 * cos(TAU * uLoop)) / vec2(1.25, 0.72);
  float oval = bcDn(0.82, 1.08, length(o)) * (0.75 + 0.25 * bcDn(0.0, 1.0, length(o)));
  vec3 Lo = normalize(vec3(-0.35, 0.45, -1.0));
  float od = sat(dot(n, Lo));
  c += (dye * (0.25 + 0.95 * od * od) + bcSheen * 0.5 * graze * sqrt(od)) * (0.15 + 0.85 * ao) * oval * brushed * bcWarm * (1.5 + 0.6 * uLevel + 0.6 * uMic);
  // the drone warms the folds from within
  vec3 warm = mix(vec3(1.0, 0.45, 0.2), bcGel(0) * 1.6, 0.45);
  c += warm * (dye * 0.35 + bcSheen * 0.16 * graze) * uDrone * (0.35 + 0.9 * uEnergy) * smoothstep(0.0, 0.35, ao) * sat(0.45 - n.x) * brushed;
  vec2 push = vec2((s + 0.85) * 2.6, y - 0.6);
  // the light under the hem climbs the pleats
  vec3 leak = bcBehind(s) * mix(bcWheels(s, 0.12), 1.0, 0.4);
  float climb = 0.6 * exp(-max(up, 0.0) * 4.0) + (0.08 + 0.5 * band((s + 5.5) / 6.0)) * exp(-max(up, 0.0) * 1.3);
  c += leak * (dye * 2.2 + bcSheen * (0.05 + 0.4 * graze)) * climb * (0.06 + 0.94 * ao) * (0.5 + 0.5 * sat(0.5 - n.x)) * brushed;
  c += (bcGel(4) + 0.1) * (dye * 2.0 + bcSheen * graze) * uHits * exp(-dot(push, push) * 1.3) * 1.5 * ao;
  // the edge of the parting takes the light
  float sl = max(bcSlit(s, y), 0.0);
  c += (bcTint + bcGel(1) * uPad * 2.0) * (dye * 1.6 + bcSheen * 0.16) * (1.6 * exp(-sl * 16.0) + 0.5 * exp(-sl * 2.2)) * (0.25 + 0.6 * uPad) * exp(-0.25 * y) * sat(0.08 - sign(s + 2.55) * n.x) * ao * 1.6;
  // thin gauze: the lamps behind show through as moons
  float thin = max(-uOwn[5], 0.0);
  if (thin > 0.0) {
    vec3 g = bcTint * 0.05 * exp(-0.3 * y);
    for (int k = 0; k < 5; k++) {
      vec2 m = vec2(s - bcPlace(k) + 0.1 * (d - 0.1), y - 0.7 - 0.5 * float((k * 2) % 5));
      float r = length(m);
      g += (bcGel(k) * (0.15 + bcLv(k) * 1.6) + bcTint * 0.16) * (bcDn(0.2, 0.36, r) * (0.6 + 0.6 * exp(-r * r * 30.0)) + 0.35 * exp(-r * 2.2));
    }
    c = mix(c, c * 0.45 + g * (0.35 + 0.65 * ao) * (0.6 + 0.5 * face), thin);
  }
  // the braid, then the fringe
  float len = 0.15, braid = up - len;
  if (braid < 0.07 + foot) {
    float gap, inF = bcDn(-foot, foot, braid), inB = bcDn(-foot, foot, braid - 0.055) * (1.0 - inF);
    vec3 lk = mix(leak, bcTint * dot(leak, vec3(0.5)), 0.65) * (0.45 + 0.55 * ao) + 0.06 + 0.3 * dif * ao;
    vec3 f = bcBullion(s + 0.6 * d, max(up, 0.0), len, across, lk, gap) * (0.2 + 0.8 * ao);
    float weave = 0.6 + 0.4 * sin((s + 0.6 * d) * 150.0) * sin(braid * 170.0) * bcDn(0.0015, 0.005, foot);
    float ridge = 0.35 + 0.9 * bcBump((braid - 0.046) * 90.0) + 0.9 * bcBump((braid - 0.01) * 90.0);
    c = mix(c, vec3(1.0, 0.55, 0.15) * weave * ridge * (0.25 * lk + 0.03) * (0.1 + 0.9 * ao), inB);
    c = mix(c, mix(f, f * 0.15, gap), inF);
  }
  return c;
}
vec3 bcBoards(vec2 q, float d, float foot, out float gloss) {
  float n = (q.x + 0.15 * d) * 5.2, id = floor(n), x = abs(fract(n) - 0.5);
  float g = noise(vec2(q.x * 90.0, d * 2.2 + id * 7.0)) * 0.5 + noise(vec2(q.x * 30.0 + id * 3.0, d * 0.9)) * 0.5;
  g = mix(0.5, g, bcDn(0.008, 0.05, foot));
  float seam = smoothstep(0.5 - 0.012 - foot * 5.2, 0.5, x) * bcDn(0.01, 0.09, foot);
  gloss = (0.75 + 0.5 * g) * (1.0 - 0.8 * seam);
  return vec3(0.30, 0.17, 0.09) * (0.6 + 0.5 * hash11(id) + 0.5 * (g - 0.5)) * (1.0 - 0.75 * seam);
}
vec3 bcHouse(vec2 p) {
  float yaw = bcBy(0.18, 0.47, 0.6, uOwn[3]), f = 1.15, Z = bcBack, eye = bcBy(1.15, 0.66, 0.3, uOwn[3]);
  vec3 v = vec3(p.x, p.y + 0.1, f) / f;
  vec3 rd = vec3(v.x * cos(yaw) - v.z * sin(yaw), v.y, max(v.x * sin(yaw) + v.z * cos(yaw), 0.15));
  float cross = fract(uTime / 34.0);  // a draught takes half a minute to pass
  bcBlow = 2.0 - 10.0 * cross; bcBlown = sin(PI * cross);
  vec3 ro = vec3(0.0, eye, 0.0);
  float tf = rd.y < -1e-4 ? -eye / rd.y : 1e5;
  // walk through the depth of the pleats
  float deep = bcTall + 0.06 + 0.2 * bcHit;
  float t0 = (Z - deep) / rd.z, t1 = (Z + 0.04) / rd.z, dt = (t1 - t0) / 12.0, t = t0, was = deep, tw = t0;
  if (tf > t0) for (int i = 0; i < 12; i++) {
    t += dt;
    float now = Z - bcDeep(ro.x + rd.x * t, eye + rd.y * t) - rd.z * t;
    if (now < 0.0) { t = mix(tw, t, was / (was - now)); break; }
    was = now; tw = t;
  }
  { float now = Z - bcDeep(ro.x + rd.x * t, eye + rd.y * t) - rd.z * t; t += clamp(now / rd.z * 0.6, -dt, dt); }
  vec3 q = ro + rd * t;
  float foot = bcPx * t / f, across = foot / max(rd.z * rd.z, 0.2);
  vec3 at = ro + rd * (Z - 0.5 * bcTall) / rd.z;
  float slit = bcSlit(at.x, at.y);
  float cover = tf < t ? 0.0 : smoothstep(-foot, foot, q.y - bcHem(q.x)) * smoothstep(-across, across, slit);
  vec3 col = vec3(0.0);
  if (cover < 1.0) {
    // under the hem and through the parting, and the boards before it
    if (tf < 60.0 && (tf < t || q.y < bcHem(q.x) + 0.02)) {
      vec2 b = ro.xz + rd.xz * tf;
      float d = Z - bcDeep(b.x, 0.0) - b.y, ff = bcPx * tf / f, gloss;
      vec3 wood = bcBoards(b, d, ff * (1.0 + abs(rd.x / rd.y)), gloss);
      vec3 lit = bcFans(b, d);
      col = wood * lit * 2.2 + wood * 0.012;
      if (d < 0.0) col = mix(col, lit * 1.1, 0.6);
      else {
        // the wax mirrors the gap and, faintly, the cloth
        vec3 r = vec3(rd.x, -rd.y, rd.z);
        float tr = d / r.z, sr = b.x + r.x * tr, yr = r.y * tr, fr = pow(1.0 - sat(-rd.y / length(rd)), 4.0);
        float wob = 0.04 * (noise(vec2(b.x * 14.0, d * 5.0)) - 0.5);
        float hem = bcHem(sr + wob);
        float in_ = bcDn(-0.05, 0.05, yr - hem) + 0.35 * exp(-max(yr - hem, 0.0) * 5.0);
        col += bcBehind(sr + wob) * bcWheels(sr, 0.1) * in_ * (0.08 + 0.36 * fr) * gloss;
        float fold = 0.5 - 0.5 * cos(TAU * bcAt(sr + wob, yr));
        col += (bcDye * 0.3 + bcSheen * 0.012) * fold * fr * gloss * 0.6;
      }
      if (d < 0.0) col = mix(bcTint * 0.1, col, exp(0.3 * d));
    } else {
      // the air behind, with its lamps
      vec3 far = ro + rd * (Z + 2.5) / rd.z;
      col = bcTint * (0.1 + 0.1 * bcBump(far.y));
      for (int k = 0; k < 5; k++) {
        vec2 m = far.xy - vec2(bcPlace(k) - 0.6, 0.9 + 0.5 * float((k * 2) % 5));
        col += (bcGel(k) * (0.1 + 1.4 * bcLv(k)) + bcTint * 0.1) * (bcBump(length(m) * 3.2) + 0.25 * bcBump(length(m) * 1.1));
      }
      // in the parting: lit air, and the turned edges of the cloth in gold
      float inside = bcDn(0.0, 0.06, slit), lip = exp(-abs(slit) * 55.0), deep = smoothstep(-0.1, 0.04, at.x + 2.55) * smoothstep(0.0, 0.05, -slit);
      vec3 air = (bcTint * vec3(1.0, 0.6, 0.26) * 0.7 + bcGel(1) * 0.22 * uPad) * (0.07 + 1.3 * bcBump((at.y - 0.8) * 1.15)) * (1.0 - 0.9 * deep);
      col = mix(col * vec3(0.8, 0.5, 0.5), air + bcTint * vec3(1.0, 0.78, 0.45) * lip * (0.15 + 1.5 * exp(-0.8 * at.y)), inside * (1.0 - 0.7 * deep));
    }
  }
  if (cover > 0.0) col = mix(col, bcVelvet(q, normalize(rd), foot, across), cover);
  col += bcTint * vec3(1.0, 0.7, 0.4) * (0.03 + 0.16 * uPad) * exp(-abs(slit) * (9.0 - 4.0 * uPad)) * exp(-1.1 * max(at.y, 0.0)) * step(0.0, at.y);
  // dust in the leak
  float dustUp = p.y + 0.36 - 0.12 * p.x + 0.03;
  for (int i = 0; i < 2; i++) {
    float sc = i == 0 ? 17.0 : 29.0;
    vec2 g = p * sc + vec2(0.12 * uTime, 0.5 * sin(0.07 * uTime + float(i))) * (i == 0 ? 1.0 : 0.7);
    g.x = mod(g.x, 512.0);
    vec2 id = floor(g), h = hash22(id + 7.0 * float(i));
    vec2 w = g - id - 0.2 - 0.6 * h;
    float r = 0.02 + 0.04 * h.x * h.x;
    float m = bcDn(0.0, r + bcPx * sc, length(w)) * (0.5 + 0.5 * sin(uTime * (0.3 + 0.4 * h.y) + 40.0 * h.x));
    col += (bcTint * 0.7 + bcGel(2)) * m * (0.02 + 0.5 * uTexture) * (0.25 + uEnergy) * exp(-dustUp * dustUp * 110.0);
  }
  return col * (1.0 - 0.35 * smoothstep(0.5, 1.1, length(p * vec2(0.8, 1.2) + vec2(0.1, 0.05)))) * (1.0 - 0.35 * bcDn(-0.52, -0.33, p.y));
}

// ---- b: cream silk drawn up in swags, five deep, over a low bright sky-cloth
vec2 bcEye;
const vec4 bcRows[5] = vec4[5](vec4(0.52, 0.46, 0.05, 0.95), vec4(0.68, 0.62, 0.02, 0.75), vec4(0.76, 0.6, 0.25, 1.2), vec4(0.84, 0.6, 0.2, 0.9), vec4(0.9, 0.35, 0.4, 1.4));
vec4 bcHow;
float bcWide, bcFloor, bcL0, bcL1, bcSag;
float bcArch(int i, float x, float more) {
  return bcHow.x - bcHow.y * smoothstep(bcHow.z, bcHow.w, (i == 4 ? abs(x) : i % 2 == 0 ? -x : x) + more);
}
float bcLine(int i, float k) { // how high the k-th lifting line has been drawn
  float fi = float(i), x = k * bcWide + 0.11 * fi;
  float h = bcArch(i, x, 0.0);
  h += 0.15 * (uBands[int(mod(k * 5.0 + fi * 3.0, 16.0))] - 0.15) * (0.4 + uEnergy);
  h += 0.06 * sin(k * 1.7 + fi * 2.3 + 0.05 * uTime) + 0.05 * bcLv(i) + 0.16 * bcCue;
  return max(h, bcFloor);
}
float bcHang(float t) { return mix(bcL0, bcL1, t) - bcSag * 4.0 * t * (1.0 - t); }
vec3 bcEdge(int i, float x) { // height of the hem, the place between two lines (-1 to 1), the swag's number
  float k = floor(x / bcWide), t = x / bcWide - k;
  bcL0 = bcLine(i, k); bcL1 = bcLine(i, k + 1.0);
  bcSag = bcWide * (0.26 + 0.12 * hash21(vec2(k, float(i))));
  return vec3(bcHang(t), 2.0 * t - 1.0, k);
}
// How far the silk stands out, and (out) the fold it is in
float bcPuff(vec3 e, vec2 q, out float fr) {
  float v = max(q.y - e.x, 0.0) / bcWide, c = 1.0 - e.y * e.y;
  float r = 3.1 * log(1.0 + 1.1 * v) + 0.14 * sin(5.0 * v + e.z * 2.0 + 2.0 * e.y) * c;
  fr = fract(r);
  float puff = sin(PI * pow(fr, 0.72)), side = e.y * e.y;
  float ruche = (sin(TAU * r * 4.0 + 2.0 * e.z) + 0.6 * sin(44.0 * r + 1.9 * e.y + e.z)) * side * bcDn(0.8, 1.0, side);
  float pull = sin(TAU * (r * 2.0 + 0.6 * c + 0.37 * e.z)) * c;
  return bcWide * (0.36 * sqrt(c + 0.02) * (0.45 + 0.55 * puff) + 0.022 * ruche + 0.03 * pull);
}
vec3 bcSilk(int i, vec2 q, vec3 e, float px) {
  float fr, f2, h = bcPuff(e, q, fr), s = 0.006 + px, fi = float(i);
  float hx = bcPuff(vec3(bcHang(0.5 + 0.5 * e.y + s / bcWide), min(e.y + 2.0 * s / bcWide, 1.0), e.z), q, f2), hy = bcPuff(e, q + vec2(0.0, s), f2);
  vec3 n = normalize(vec3(-clamp((hx - h) / s, -3.0, 3.0), -clamp((hy - h) / s, -2.0, 1.7), 1.0));
  float v = q.y - e.x, c = 1.0 - e.y * e.y, lv = bcLv(i);
  vec3 dye = mix(bcDye, bcDye * vec3(0.8, 0.3, 0.2), max(uOwn[5], 0.0) * smoothstep(-0.3, 0.3, cos(e.y * 2.0 * PI)));
  vec3 peach = vec3(1.05, 0.58, 0.40), blue = vec3(0.34, 0.54, 1.0);
  vec3 in_ = mix(peach, blue, smoothstep(0.3, 0.7, float[5](0.15, 0.8, 0.35, 0.9, 0.1)[i] + 0.22 * sin(e.z * 1.3))) * mix(vec3(1.0), bcTint, abs(uOwn[4]) * 0.4 + 0.1);
  in_ = mix(in_, bcGel(i) * 1.6, 0.62 * sat(lv * 1.5));
  in_ = max(mix(vec3(dot(in_, vec3(0.3, 0.59, 0.11))), in_, 1.12), 0.0);
  float power = 0.85 + 0.22 * fi + 0.5 * uCue, more = power + (0.3 + 0.9 * uEnergy) * (0.6 + 0.15 * fi) * lv;
  float ao = (0.2 + 0.8 * smoothstep(0.0, 0.25, fr)) * (0.3 + 0.7 * smoothstep(0.0, 0.45, c));
  float under = sat(0.28 - 0.9 * n.y), front = sat(dot(n, normalize(vec3(0.5, 0.55, 0.75))));
  float near = exp(-v * 4.2);
  vec3 col = dye * mix(vec3(0.15, 0.06, 0.11) * (0.5 + uSpace), bcWarm * vec3(0.78, 0.6, 0.55), front * front) * ao * (0.16 + 0.7 * near);
  col += dye * in_ * more * under * (0.05 + near) * (0.2 + 0.8 * ao);
  // thin silk lets the light through toward the hem
  col += dye * in_ * more * exp(-v * 8.0) * (0.25 + 0.75 * c) * 0.8;
  vec3 gl = normalize(vec3(0.3, -0.4, 0.85));
  float shine = pow(sat(dot(n, gl)), 30.0);
  col += (bcSheen * 0.4 + in_ * 0.6) * shine * (0.15 + 0.5 * uTone) * more * near;
  // gold cord and a small tassel on each line
  float cord = abs(abs(e.y) - 1.0) * 0.5 * bcWide - 0.004;
  col = mix(col, vec3(0.7, 0.42, 0.14) * (0.25 + 0.8 * near + 1.5 * uKeys), bcDn(-px, px, cord) * 0.8);
  return col;
}
vec3 bcSky(vec2 p, float hor) {
  float y = p.y - hor;
  vec2 at = vec2(p.x - 0.2 - 0.08 * sin(TAU * uLoop), y - 0.11 - 0.03 * cos(TAU * uLoop));
  vec3 low = bcBy(vec3(0.30, 0.52, 0.85), vec3(1.7, 0.86, 0.38), vec3(2.2, 0.42, 0.07), uOwn[4]);
  vec3 col = mix(low, bcBy(vec3(0.03, 0.06, 0.2), vec3(0.34, 0.56, 1.0), vec3(0.5, 0.06, 0.16), uOwn[4]), smoothstep(-0.05, 0.4, y));
  col += low * (exp(-dot(at, at) * 14.0) * (1.1 + 0.5 * uMic) + 0.25 * uCue + 0.9 * bcDn(0.063, 0.066, length(at)));
  vec2 c2 = vec2(p.x * 2.6 + 0.01 * uTime, y * 12.0 + 3.0);
  float cl = 0.62 * noise(c2) + 0.38 * noise(c2 * 2.3 + 5.0);
  col = mix(col, low * 0.9 + 0.35, 0.75 * smoothstep(0.45, 0.62, cl) * bcDn(0.02, 0.45, y));
  vec4 m = piece(vec2(0.5 + 0.4 * p.x, 1.0 - y * 2.2));
  m.a *= smoothstep(0.0, 0.2, 0.5 - 0.4 * abs(p.x));
  col = mix(col, m.rgb / max(m.a, 0.02) * (0.5 + low), 0.5 * m.a * smoothstep(0.0, 0.06, y));
  // a tree on a flat, wheeled across before the sky
  float go = fract(uTime / 62.0 + 0.1);
  vec2 w = vec2(p.x - 1.4 + 2.8 * go, y);
  if (abs(w.x) > 0.12 || y > 0.25) return col;
  float leaf = 0.016 * noise(w * 70.0) + 0.02 * noise(w * 26.0);
  float tree = min(length((w - vec2(0.0, 0.165)) * vec2(1.0, 0.8)) - 0.042, length((w - vec2(-0.035, 0.12)) * vec2(0.8, 1.2)) - 0.034);
  tree = min(tree, length((w - vec2(0.045, 0.115)) * vec2(0.8, 1.2)) - 0.036) + leaf - 0.012;
  tree = min(tree, max(abs(w.x + 0.004 * sin(w.y * 60.0)) - 0.005 - 0.004 * bcDn(0.02, 0.06, w.y), abs(w.y - 0.06) - 0.05));
  tree = min(tree, max(abs(w.x) - 0.055, abs(w.y - 0.013) - 0.003));
  tree = min(tree, length(vec2(abs(w.x) - 0.042, w.y - 0.006)) - 0.006);
  return mix(col, col * 0.16 + vec3(0.05, 0.02, 0.05), bcDn(-bcPx, bcPx, tree) * (0.82 + 0.16 * uPhrase));
}
vec3 bcSwags(vec2 p) {
  vec3 col = vec3(0.0);
  float left = 1.0, zoom = bcBy(1.35, 1.0, 0.72, uOwn[3]), F = 0.16 * zoom;
  bcFloor = 0.17 - F;
  bcEye = vec2(0.22, -0.3);
  bcWide = bcBy(0.6, 0.34, 0.2, uOwn[1]);
  float floorY = bcEye.y - 0.05, zf = p.y < floorY ? 0.16 / (bcEye.y - p.y) : 3.2;
  bool low = p.y < floorY;
  float gloss = 1.0;
  vec3 wood = vec3(0.0);
  vec2 at = p;
  if (low) { // the boards: they mirror what hangs over them
    float bx = (p.x - bcEye.x) * zf * 5.0, id = floor(bx), x = abs(fract(bx) - 0.5), wide = bcPx * zf * 5.0 * (1.0 + abs(p.x - bcEye.x) * zf / 0.16);
    float seam = smoothstep(0.5 - 0.02 - wide, 0.5, x) * bcDn(0.06, 0.4, wide);
    float g = noise(vec2(bx * 9.0, zf * 3.0 + id * 5.0));
    gloss = (0.28 + 0.14 * g) * (1.0 - 0.7 * seam);
    wood = vec3(0.16, 0.085, 0.05) * (0.6 + 0.5 * hash11(id) + 0.3 * g) * (1.0 - 0.7 * seam);
    at.x += 0.006 * (g - 0.5);
  }
  for (int i = 0; i < 5; i++) {
    float z = float[5](0.82, 1.12, 1.5, 2.0, 2.6)[i];
    if (low && z < zf) continue;
    z *= zoom;
    vec2 q = (at - bcEye) * z;
    if (low) q.y = -2.0 * F - q.y;
    q.x -= 0.11 * float(i) + 0.02 * sin(0.05 * uTime + float(i));
    bcHow = bcRows[i] * vec4(1.0, bcBy(1.25, 1.0, 0.35, uOwn[2]), 1.0, 1.0) + vec4(bcBy(-0.22, 0.0, 0.16, uOwn[2]), 0.0, 0.0, 0.0);
    if (q.y < bcArch(i, q.x + 0.11 * float(i), bcWide) - 0.1 - 0.4 * bcWide) continue;
    vec3 e = bcEdge(i, q.x);
    float soft = bcPx * z * (low ? 5.0 : 1.0);
    float a = smoothstep(-soft, soft, q.y - e.x) * (1.0 - 0.7 * max(-uOwn[5], 0.0) * smoothstep(0.0, 0.3 * bcWide, q.y - e.x));
    if (a > 0.0) { col += left * a * bcSilk(i, q, e, bcPx * z); left *= 1.0 - a; }
    if (left < 0.1) { col /= 1.0 - left; left = 0.0; break; }
  }
  if (left > 0.0) col += left * bcSky(vec2(at.x, abs(at.y - floorY) + floorY), floorY);
  if (low) col = wood * (0.6 + 0.8 * exp(-abs(p.x - 0.2) * 1.5)) + col * gloss;
  return col * (1.0 - 0.3 * smoothstep(0.5, 1.1, length(p * vec2(0.8, 1.0))));
}
vec3 render(vec2 p) {
  bcPx = 1.0 / uRes.y;
  bcBack = bcBy(5.0, 3.1, 2.0, uOwn[3]);
  bcPleat = bcBy(1.0, 1.9, 3.4, uOwn[1]);
  bcTall = 0.46 / bcPleat;
  bcLift = bcBy(0.02, 0.062, 0.5, uOwn[2]);
  bcCue = 4.0 * uCue * (1.0 - uCue);
  bcHit = 4.0 * uHits * (1.0 - uHits);
  bcTint = bcBy(vec3(0.3, 0.62, 1.05), vec3(1.0, 0.74, 0.38), vec3(1.4, 0.3, 0.08), uOwn[4]);
  bcWarm = bcBy(vec3(0.35, 0.62, 1.1), vec3(1.0, 0.8, 0.55), vec3(1.5, 0.5, 0.12), uOwn[4]);
  if (uVar < 0.5) {
    bcDye = bcBy(vec3(0.02, 0.10, 0.09), vec3(0.24, 0.05, 0.075), vec3(0.75, 0.66, 0.54), uOwn[0]);
    bcSheen = bcBy(vec3(0.3, 0.7, 0.65), vec3(0.9, 0.35, 0.32), vec3(1.0, 0.92, 0.8), uOwn[0]);
    return screenOf(bcHouse(p));
  }
  bcDye = bcBy(vec3(0.10, 0.16, 0.34), vec3(0.95, 0.86, 0.72), vec3(0.8, 0.16, 0.2), uOwn[0]);
  bcSheen = vec3(1.0, 0.93, 0.8);
  return screenOf(bcSwags(p));
}
