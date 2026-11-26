// name: Urchin shells
// a: On sand
// b: Lit inside
// what: Five bare sea-urchin shells lie on pale sand in low side light, dusty violet, olive, rose and cream, their rows of round knobs running from fat at the girth to dust at the crown, one hollow side up. Or one broken shell from inside, its wall glowing, daylight coming through every pore and falling as dots on the sand.
// follows: Each kind is one shell, or a fifth of the wall (texture also the violet bands): knobs swell and take its colour from the girth up, or its pores do. The spectrum runs up the rows. A hit sends a ring up the shells; a cue brings the light lower and warmer and back. The piece tints the sand, high notes and keys wink in its grains, the loop swings the sun.
const float UC_ROW = 0.235; // height of a row of knobs
const float UC_Q = 0.67;   // how squashed the shells are
const float UC_5 = TAU / 5.0;
vec3 ucL, ucLd, ucSun, ucSky; // towards the sun, the same squashed, its colour, the sky's
float ucGain, ucLv, ucRing, ucHole; // of the shell in hand: its sound, its hit, how wide its opening is
// A soft step from a to b, whichever is the larger.
float ucS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float ucBell(float x) { x = max(1.0 - x * x * 0.3, 0.0); return x * x * x; }
// How much a row of knobs answers; n counts rows up from the girth.
float ucAmt(float n) {
  float a = ucLv * ucS(-2.0, 1.5, ucLv * 10.0 - n);
  return a + ucRing * ucBell((n - 11.5 * (1.0 - uHits)) / 1.5) * 1.6;
}
// A shell's own map: across a fifth, and up and down; round stays round.
float ucFifth;
vec2 ucMap(vec3 d) {
  float ph = atan(d.z, d.x + 1e-6) / UC_5 + 0.5;
  ucFifth = floor(ph);
  return vec2((ph - ucFifth - 0.5) * UC_5, 0.5 * log((1.0 - d.y + 1e-4) / (1.0 + d.y + 1e-4)));
}
// How far the nearest pin hole is (they lie in pairs), and its row.
float ucPore(vec2 m, out float rw) {
  float ax = abs(m.x), v = m.y / UC_ROW * 4.0 + (ax > 0.425 ? 0.25 : 0.0);
  rw = floor(v);
  return length(vec2(abs(ax - 0.425) - 0.0265, (v - rw - 0.5) * UC_ROW * 0.25));
}
// The seams between the plates.
float ucSeam(vec2 m, float w) {
  float v = m.y / UC_ROW, dz = abs(fract(v + (m.x > 0.0 ? 0.0 : 0.5)) - 0.5) * UC_ROW, zig = abs(m.x + 0.02 * (abs(fract(v) - 0.5) * 4.0 - 1.0));
  return max(ucS(0.017 + w, 0.0, dz) * step(abs(m.x), 0.39), ucS(0.017 + w, 0.0, zig));
}
// The nearest big knob: from its middle, in radii; its radius and row.
vec2 ucKnob(vec2 m, out float R, out float n) {
  float ax = abs(m.x), sd = m.x > 0.0 ? 0.5 : 0.0;
  bool wide = ax < 0.41;
  float row = wide ? UC_ROW : UC_ROW * 0.74, v = m.y / row + sd, i = floor(v);
  n = -(i + 0.5 - sd) * (wide ? 1.0 : 0.74);
  R = (wide ? 0.102 : 0.066) * (1.0 + 0.26 * min(ucAmt(n), 1.4));
  return vec2((ax - (wide ? 0.222 : 0.548)) * (m.x > 0.0 ? 1.0 : -1.0), (v - i - 0.5) * row) / R;
}
float ucRise(vec2 m) {
  float R, n;
  float r = length(ucKnob(m, R, n));
  return R * (0.5 * ucS(1.0, 0.3, r) + 0.28 * sqrt(max(0.0, 1.0 - r * r * 9.0)));
}
mat3 ucFrame(vec3 ax, float turn) {
  vec3 e = normalize(cross(ax, vec3(0.31, 0.02, 1.0))), g = cross(e, ax);
  float c = cos(turn), s = sin(turn);
  return mat3(e * c + g * s, ax, g * c - e * s);
}
// Soft shadow of a shell.
float ucShade(vec3 q, vec4 s, float k) {
  vec3 oc = (q - s.xyz) * vec3(1.0, 1.0 / UC_Q, 1.0) / s.w;
  float b = dot(oc, ucLd), dd = sqrt(max(dot(oc, oc) - b * b, 0.0)) - 1.0;
  return -b < 0.02 ? 1.0 : ucS(-0.5, 0.5, dd / (k * max(-b, 0.02) + 0.02));
}
// The sand at a place: its colour under a light, gw its grains.
vec3 ucSand(vec2 w, vec2 gw, float sharp, float lit, float amb, vec3 tint) {
  vec2 e = normalize(ucL.xz);
  float mid = 0.5 + 0.5 * sin(w.x * 0.9 + 1.7 * sin(w.y * 0.7 + 0.5));
  vec2 o = vec2(w.x * 0.5 + w.y * 0.28, w.y * 1.1 - w.x * 0.3) * 1.5 + 0.9 * mid;
  float rake = noise(o) - noise(o + e * vec2(0.11, 0.2));
  float g1 = noise(gw), g2 = noise(gw + e * 0.7), g = (g1 * 1.3 - 0.65) * sharp;
  float face = sat(ucL.y + rake * 0.75 + (g1 - g2) * 0.4 * sharp);
  vec3 alb = mix(vec3(0.7, 0.6, 0.47), vec3(0.84, 0.76, 0.64), sat(mid * 0.8 + 0.1 + 0.35 * g));
  // a dark or a pale grain here and there
  vec2 a = gw * 0.62, ci = floor(a); float h = hash21(ci + 5.0);
  float spot = ucS(0.1 + 0.25 * fract(h * 91.0), 0.05, length(a - ci - 0.3 - 0.4 * vec2(h, fract(h * 53.0)))) * sharp;
  alb *= 1.0 - spot * 0.5 * step(0.82, h);
  alb = mix(alb, vec3(0.96, 0.93, 0.89), spot * 0.6 * step(h, 0.12));
  float wink = ucS(0.6, 1.0, sin(h * 1900.0 + uTime * 0.45 + uTravel * 0.3)) * step(0.35, h) * step(h, 0.5);
  vec3 c = alb * tint * (ucSun * face * lit + ucSky * amb * (0.9 + 0.3 * g));
  return c + spot * wink * vec3(1.0, 0.93, 0.8) * (0.1 + 2.0 * sat(uHigh + 0.6 * uKeys) * ucGain) * (0.15 + 0.85 * lit);
}
// The skin of a shell: its colour and bent normal; l is the sun in its frame.
vec3 ucSkin(vec3 d, vec3 l, float px, vec3 cB, vec3 cK, vec3 kind, float dust, out vec3 nb, out float shut, out float open) {
  vec2 m = ucMap(d);
  float s = max(sqrt(max(1.0 - d.y * d.y, 0.0)), 0.02), w = px / s, ax = abs(m.x), sd = m.x > 0.0 ? 1.0 : -1.0;
  vec3 eP = normalize(vec3(-d.z, 0.0, d.x + 1e-5)), eU = cross(eP, d);
  if (eU.y > 0.0) eU = -eU;
  vec2 lt = vec2(dot(l, eP), dot(l, eU)); float lz = max(dot(l, d), 0.12);
  float crown = ucS(-2.15, -1.7, m.y); // 0 on the plates at the very top
  float R, n;
  vec2 k = ucKnob(m, R, n);
  float r = length(k), fade = ucS(0.9, 0.25, w / R);
  float kn = ucAmt(n) + 0.4 * ucGain * uBands[int(clamp(n * 1.2 + 2.0, 0.0, 15.0))];
  float sl = -1.15 * ucS(0.36, 0.55, r) * ucS(1.0, 0.7, r) - 2.6 * r * ucS(0.36, 0.28, r) + 0.45 * ucS(0.9, 1.05, r) * ucS(1.32, 1.1, r);
  vec2 g = k / max(r, 1e-3) * sl * fade;
  // its cast shade
  vec2 ld = lt / max(length(lt), 1e-3);
  float along = -dot(k, ld), off = dot(k, vec2(-ld.y, ld.x)), len = 0.75 + min(0.75 * length(lt) / lz, 1.3);
  shut = 1.0 - 0.75 * fade * ucS(0.95, 0.55, abs(off) + 0.25 * max(along - 0.8, 0.0)) * ucS(0.35, 0.75, along) * ucS(len + 0.35, len - 0.25, along) * crown;
  // wall: cream between, colour in the bands
  vec3 alb = mix(mix(cB, cK, 0.62), cB, sat(ucS(0.36, 0.46, ax) * 0.75 + 0.5 * ucBell(m.x / 0.07) + 0.14 * sin(m.x * 17.0 + ucFifth * 5.0 + 2.0 * sin(m.y * 6.0))));
  alb = mix(alb, cB * 0.8, 0.09 * m.y * m.y);
  alb = mix(alb, alb * (kind * 1.5 + 0.1), 0.6 * sat(ucAmt(-m.y / UC_ROW)));
  alb *= 1.0 - 0.3 * ucSeam(m, w) * ucS(0.06, 0.02, w) * crown;
  // small knobs in the gaps, and dust
  for (int j = 0; j < 2; j++) {
    float f = j == 0 ? 15.0 : 27.0;
    if (w * f > 0.4) break;
    vec2 a = vec2(ax + 0.013, m.y) * f;
    a.y += 0.5 * mod(floor(a.x), 2.0);
    vec2 i = floor(a), q = a - i - 0.5;
    float h = hash21(i + ucFifth * 7.0 + sd * 3.0), rr = (j == 0 ? 0.2 : 0.24) + 0.16 * h;
    q += 0.2 * (vec2(h, fract(h * 17.0)) - 0.5);
    float L = length(q), on = ucS(1.12, 1.4, r) * ucS(0.4, 0.1, w * f) * (j == 0 ? step(0.25, h) : 0.8) * (1.0 - ucS(0.02, 0.0, abs(ax - 0.425) - 0.03));
    g += q / max(L, 1e-3) * vec2(sd, 1.0) * (j == 0 ? -1.1 : -0.75) * ucS(rr + 0.1, rr - 0.08, L) * ucS(0.0, rr * 0.7, L) * on;
    alb = mix(alb, cK, 0.55 * on * ucS(rr, rr - 0.12, L));
  }
  float rw, pore = ucS(0.014 + w, 0.014 - w, ucPore(m, rw)) * ucS(0.045, 0.012, w);
  alb *= 1.0 - 0.8 * pore * crown;
  // knob's own colour: paler boss, pearl on top
  vec3 tip = mix(cK, kind, sat(kn * 1.1) * 0.85);
  float boss = ucS(1.02, 0.8, r) * crown, pearl = ucS(0.38, 0.27, r) * crown;
  alb = mix(alb, tip, boss * (0.5 + 0.4 * sat(kn)) * (0.4 + 0.6 * fade));
  alb = mix(alb, tip * 1.12 + 0.04, pearl * fade);
  alb *= 1.0 - 0.35 * ucS(0.1, 0.0, abs(r - 1.06)) * crown * fade - 0.4 * ucS(0.07, 0.0, abs(r - 0.4)) * fade * crown;
  // plates of the crown and the opening
  float th = d.y > 0.0 ? s + s * s * s * 0.17 : 2.0, top = 1.0 - crown;
  alb = mix(alb, mix(cB, cK, 0.4) * (1.0 - 0.3 * ucS(0.05 + w, 0.02, abs(ax - 0.4 - 0.1 * (m.y + 2.2)))), top * 0.85);
  g *= crown;
  alb *= 1.0 - 0.7 * top * ucS(0.035, 0.02, length(vec2(m.x, (m.y + 2.15) * 0.8) * s));
  g.y -= 0.7 * ucBell((th - ucHole - 0.03) / 0.03);
  open = ucS(ucHole + px, ucHole - px, th);
  alb = mix(alb, vec3(0.8, 0.73, 0.62), dust);
  nb = normalize(d - (eP * g.x + eU * g.y) * 0.95 + eP * 1e-4);
  return alb;
}
// The five shells: middle and size, which way up, colour of bands and wall.
const vec4 UC_S[5] = vec4[5](vec4(-1.0, 0.6, 0.45, 1.32), vec4(1.75, 0.38, 1.45, 0.86), vec4(3.05, 0.5, -1.75, 1.12), vec4(0.95, 0.26, -0.95, 0.56), vec4(-2.1, 0.27, -1.8, 0.7));
const vec3 UC_AX[5] = vec3[5](vec3(0.12, 0.95, -0.3), vec3(0.22, 0.95, -0.2), vec3(-0.35, 0.9, 0.1), vec3(-0.5, 0.75, -0.4), vec3(0.3, 0.9, -0.3));
const vec3 UC_B[5] = vec3[5](vec3(0.32, 0.19, 0.38), vec3(0.3, 0.38, 0.21), vec3(0.4, 0.48, 0.34), vec3(0.6, 0.34, 0.36), vec3(0.42, 0.24, 0.3));
const vec3 UC_C[5] = vec3[5](vec3(0.87, 0.76, 0.76), vec3(0.84, 0.83, 0.64), vec3(0.88, 0.83, 0.69), vec3(0.92, 0.83, 0.71), vec3(0.88, 0.75, 0.68));
// Where the eye is and which way it looks.
vec3 ucRo, ucRd;
float ucLook(vec2 p, vec3 at, float pit, float far, float narrow) {
  float foc = 2.0 * clamp(uRes.x / uRes.y / 1.28, narrow, 1.0) * mix(1.05, 0.95, uSpace), cp = cos(pit), sp = sin(pit);
  ucRo = at + vec3(0.0, sp, -cp) * far;
  ucRd = normalize(vec3(p.x, p.y * cp - foc * sp, p.y * sp + foc * cp));
  return far / (foc * uRes.y);
}
// Their light, with what is left for the sand, and its place and light.
vec4 ucOn(vec2 p, out vec2 at, out float px, out float lit, out float amb) {
  px = ucLook(p, vec3(0.1 - 0.5 * sat(1.3 - uRes.x / uRes.y), 0.0, 0.0), 0.72, 8.6, 0.56); lit = amb = 1.0;
  vec3 ro = ucRo, rd = ucRd;
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, 0.0);
  float tg = ro.y / max(-rd.y, 1e-3), rem = 1.0, soft = mix(0.16, 0.06, uTone);
  vec3 c = vec3(0.0); at = (ro + rd * tg).xz;
  // which shell lies this way; no two overlap
  int i = 0; float near = 1.095;
  for (int j = 0; j < 5; j++) {
    vec3 oc = (ro - UC_S[j].xyz) / UC_S[j].w; float b = dot(oc, rd), dd = sqrt(max(dot(oc, oc) - b * b, 0.0));
    if (dd < near) { near = dd; i = j; }
  }
  vec4 S = UC_S[i];
  if (near < 1.095) {
    vec3 oc = ro - S.xyz;
    ucLv = sat(lv[i] * ucGain); ucRing = uHits * (i == 4 ? 1.3 : 0.35); ucHole = i == 4 ? 0.36 : 0.1;
    mat3 F = ucFrame(normalize(UC_AX[i]), float((i + 1) * 7 % 5) * 1.7 + 0.35);
    vec3 sc = vec3(S.w, S.w * UC_Q, S.w), o = (oc * F) / sc, v = (rd * F) / sc;
    float vv = dot(v, v), B = dot(o, v) / vv, rim = 1.081 + 0.024 * min(max(ucLv, ucRing), 1.0), D = B * B - (dot(o, o) - rim * rim) / vv;
    float miss = step(D, 0.0); D = max(D, 0.0);
    float t = -B - sqrt(D), iv = 1.0 / sqrt(vv), best = 1.0, tb = t;
    float D1 = B * B - (dot(o, o) - 0.998) / vv, tI = D1 > 0.0 ? -B - sqrt(D1) : 1e5, tE = min(min(-B + sqrt(D), tg), tI);
    float least = (tE - t) / 9.0;
    for (int j = 0; j < 10; j++) {
      vec3 q = o + v * t; float L = length(q);
      q /= L;
      float h = L - 1.0 - ucRise(ucMap(q)) * sqrt(max(1.0 - q.y * q.y, 0.0));
      if (h < best) { best = h; tb = t; }
      if (h < 0.004 || t > tE) break;
      t += max(h * iv * 0.87, least);
    }
    tb += best * iv;
    if (tI < tg && (tb > tI || best > 0.004)) { tb = tI; best = 0.0; }
    float cover = ucS(1.2, 0.0, (best - 0.0045) * S.w / px) * ucS(0.0, 2.0 * px, tg - tb) * (1.0 - miss);
    vec3 q = o + v * tb, d = q / max(length(q), 1e-3), W = ro + rd * tb, lf = ucL * F, nb;
    float shut, open, low = W.y, sandy = ucS(0.05, 0.015, low);
    vec3 n0 = normalize(F * (d / sc));
    vec3 alb = ucSkin(d, lf, px / S.w / sqrt(max(-dot(n0, rd), 0.15)), UC_B[i], UC_C[i], uKind[i] * 0.75 + 0.12, sandy * 0.9, nb, shut, open);
    vec3 n = normalize(F * (nb / sc));
    float sun = sat(dot(n, ucL) * 1.1) * ucS(-0.1, 0.25, dot(n0, ucL)) * shut;
    if (i == 1 || i == 3) sun *= ucShade(W, UC_S[0], soft);
    float occ = mix(0.35, 1.0, ucS(0.0, 0.6, low / S.w)) * (0.6 + 0.4 * shut);
    alb *= ucSun * sun * 1.15 + ucSky * (n.y * 0.5 + 0.5) * occ;
    vec2 hd = d.xz / sin(ucHole);
    vec3 inside = UC_B[i] * (0.05 + ucSun * 0.3 * ucS(0.1, 1.1, -dot(hd, normalize(lf.xz + 1e-4))) * ucS(0.75, 1.0, length(hd)) + 0.06 * length(hd));
    c = cover * mix(alb, inside, open); rem = 1.0 - cover;
  }
  for (int i = 0; i < 5; i++) {
    S = UC_S[i];
    float dd = length(at - S.xz) / S.w;
    if (dd > 4.0) continue;
    lit = min(lit, ucShade(vec3(at.x, 0.0, at.y), S, soft));
    amb *= 1.0 - 0.62 * exp(-max(dd - 0.82, 0.0) * 4.5);
  }
  return vec4(c, rem);
}
// Above 0 the wall of the broken shell is gone.
vec3 ucM;
float ucGone(vec3 q) {
  vec3 e = normalize(cross(ucM, vec3(0.0, 1.0, 0.0))), g = cross(e, ucM);
  float a = atan(dot(q, g), dot(q, e) + 1e-6) / TAU + 0.5, j = 0.0;
  for (int i = 0; i < 2; i++) {
    float f = i == 0 ? 23.0 : 53.0, x = a * f, k = floor(x), h = hash11(k + 11.0 * f), h2 = hash11(mod(k + 1.0, f) + 11.0 * f);
    j += mix(h, h2, ucS(0.2, 0.6 + 0.4 * h, x - k)) * (i == 0 ? 0.2 : 0.12);
  }
  return dot(q, ucM) - 0.24 + j;
}
// The light through the wall: pores, and the glow round them.
vec3 ucGlow(vec3 d, float px, float blur, out vec3 bare) {
  vec2 m = ucMap(d);
  float s = max(sqrt(max(1.0 - d.y * d.y, 0.0)), 0.02), w = px / s, ax = abs(m.x), sd = m.x > 0.0 ? 0.5 : 0.0;
  int k = int(mod(ucFifth + 2.0, 5.0)); k = k == 0 ? 1 : k == 1 ? 4 : k == 4 ? 0 : k;
  float lv = sat((k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : 0.4 * uHits) * ucGain), n = -m.y / UC_ROW;
  vec3 kind = uKind[k]; kind = kind * kind + 0.05; kind /= max(kind.r, max(kind.g, kind.b));
  float rw, pl = ucPore(m, rw);
  float fill = lv * ucS(-2.5, 1.5, lv * 10.0 - n) * ucS(0.63, 0.47, ax), ring = uHits * ucBell((n - 10.5 * (1.0 - uHits)) / 1.2);
  float bd = uBands[int(clamp(2.0 - rw * 0.32, 0.0, 15.0))];
  float h = hash21(vec2(rw, ucFifth * 4.0 + sd * 2.0 + step(0.425, ax)));
  float R = 0.008 + 0.008 * h + blur, W = w + blur;
  float pore = ucS(R + W, R - W, pl) * min(1.0, 0.02 / (R + W));
  float halo = exp(-pl * pl * 900.0) * 0.05 + ucBell((ax - 0.425) / 0.075) * 0.06;
  // knobs stand thick and dark against the light, seams are thin
  float KR, kn; vec2 kk = ucKnob(m, KR, kn);
  float r = length(kk), crown = ucS(-2.2, -1.7, m.y);
  float thin = (1.0 - 0.6 * ucS(1.05, 0.5, r) * crown + 0.1 * ucS(0.35, 0.2, r)) * (1.0 + 0.55 * ucSeam(m, w) * crown) * (0.82 + 0.36 * noise(m * vec2(44.0, 60.0)));
  vec3 warm = mix(vec3(1.0, 0.86, 0.66), kind, 0.85 * sat(fill));
  bare = thin * mix(vec3(1.0), kind * 1.6, 0.28 * fill) * (1.0 + 0.5 * fill + 0.8 * ring);
  float gain = 0.75 + 1.6 * fill + 1.2 * bd * ucGain + 2.5 * ring;
  float eye = ucS(0.09, 0.07, s) * step(0.0, d.y);
  return warm * (pore * (4.0 + 5.0 * fract(h * 7.0)) * gain * crown + halo * (0.5 + gain) * crown) + eye * vec3(3.2, 3.1, 3.0);
}
vec4 ucIn(vec2 p, out vec2 at, out float px, out float lit, out float amb, out vec3 spots, out float tg) {
  px = ucLook(p, vec3(0.34 - 0.25 * sat(1.3 - uRes.x / uRes.y), 0.5, 0.0), 0.42, 3.6, 0.5);
  vec3 ro = ucRo, rd = ucRd;
  const vec3 S = vec3(0.0, 0.5, 0.0), sc = vec3(1.0, 0.8, 1.0);
  mat3 F = ucFrame(normalize(vec3(-0.28, 0.72, 0.5)), 0.0);
  mat3 G = mat3(F[0] / sc.x, F[1] / sc.y, F[2] / sc.z);
  ucM = normalize(vec3(0.72, 0.26, -0.66) * G);
  vec3 o = (ro - S) * G, v = rd * G, l = ucL * G;
  tg = rd.y < -1e-3 ? -ro.y / rd.y : 1e5;
  float vv = dot(v, v), B = dot(o, v) / vv, D = B * B - (dot(o, o) - 1.0) / vv;
  vec3 c = vec3(0.0), bare; float rem = 1.0;
  lit = amb = 1.0; spots = vec3(0.0); at = (ro + rd * min(tg, 60.0)).xz;
  float t0 = D > 0.0 ? -B - sqrt(D) : 1e6, t1 = D > 0.0 ? -B + sqrt(D) : 1e6;
  // what stands of the near wall, and its broken edge
  if (t0 < tg) {
    vec3 d = normalize(o + v * t0), n = normalize(F * (d / sc));
    float gone = ucGone(d);
    if (gone < 0.07) {
      vec2 m = ucMap(d); float R, i; vec2 k = ucKnob(m, R, i); float r = length(k), boss = ucS(1.0, 0.75, r);
      vec3 sk = mix(mix(vec3(0.67, 0.5, 0.56), vec3(0.34, 0.19, 0.38), ucS(0.34, 0.46, abs(m.x))), vec3(0.86, 0.76, 0.72), 0.8 * boss);
      sk *= (1.0 - 0.4 * boss * k.y * ucS(0.25, 0.4, r)) * (1.0 - 0.4 * ucS(0.1, 0.0, abs(r - 0.4)) - 0.3 * ucS(0.2, 0.0, abs(r - 1.08)));
      sk *= ucSky * (1.3 + 0.9 * n.y) + ucSun * sat(dot(n, ucL) + 0.15 - 0.3 * boss * k.y) * 0.8;
      sk = mix(sk, vec3(0.9, 0.78, 0.66) * (0.7 + 0.4 * noise(d.xy * 60.0)) * (0.35 + 0.3 * ucSun), ucS(0.0, 0.006, gone));
      rem = ucS(0.062, 0.067, gone); c = sk * (1.0 - rem);
    }
  }
  // the far wall, from inside
  if (t1 < tg && rem > 0.01) {
    vec3 e = o + v * t1, d = normalize(e);
    float gone = ucGone(d), k = ucS(-0.004, 0.004, gone);
    vec3 n = normalize(F * (d / sc));
    float face = max(dot(n, rd), 0.12);
    vec3 th = ucGlow(d, px * t1 / 3.6 / sqrt(face), 0.0, bare);
    float sunny = dot(n, ucL), glow = 0.05 + 1.1 * pow(sat(sunny * 0.55 + 0.45), 3.0);
    vec3 wall = mix(vec3(0.6, 0.34, 0.3), vec3(0.42, 0.2, 0.36) + 0.25 * uTexture * uKind[2], ucS(0.34, 0.46, abs(ucMap(d).x)));
    float low = (ro + rd * t1).y;
    vec3 inn = wall * bare * ucSun * glow * 0.27 + th * ucSun * (0.12 + 0.35 * sat(0.5 + 0.5 * sunny));
    float mouth = ucS(-0.75, 0.0, gone);
    inn += wall * bare * (vec3(0.4, 0.38, 0.42) * mouth * mouth + vec3(0.5, 0.36, 0.28) * 0.35 * ucS(0.45, 0.0, low)) * ucS(-0.02, 0.08, low);
    inn = mix(inn, vec3(0.95, 0.84, 0.74) * (0.55 + 0.35 * noise(d.xy * 70.0 + d.z * 40.0)) * (0.5 + ucSun * 0.4 * sat(0.4 + sunny)), ucS(-0.055, -0.048, gone));
    c += rem * inn * (1.0 - k); rem *= k;
  }
  // the sand, where each pore throws a small light
  if (tg < 60.0 && rem > 0.01) {
    vec3 q = (vec3(at.x, 0.0, at.y) - S) * G;
    float ll = dot(l, l), b = dot(q, l) / ll, dd = b * b - (dot(q, q) - 1.0) / ll, within = length(q);
    lit = b > 0.0 && within > 1.0 ? 1.0 : step(1.0, within) * ucS(-0.06, 0.0, sqrt(max(dot(q, q) - b * b * ll, 0.0)) - 1.0);
    if (dd > 0.0 && -b + sqrt(dd) > 0.0) {
      vec3 e = q + l * (-b + sqrt(dd));
      float open = ucS(-0.05, 0.05, ucGone(e)), first = within > 1.0 ? ucS(-0.05, 0.05, ucGone(q + l * (-b - sqrt(dd)))) : 1.0;
      lit = max(lit, open * first);
      if (open < 1.0) spots = ucGlow(normalize(e), 0.004, mix(0.0065, 0.0025, uTone) * length(e - q), bare) * (1.0 - open) * first * 0.5;
    }
    amb = mix(0.6, 1.0, ucS(0.7, 1.5, within)) * (1.0 - 0.5 * ucS(0.2, -0.1, dot(q, ucM)) * exp(-abs(within - 1.0) * 9.0));
  }
  return vec4(c, rem);
}
vec3 render(vec2 p) {
  ucGain = 0.45 + 1.2 * uEnergy;
  float low = 4.0 * uCue * (1.0 - uCue);
  float az = 0.07 * sin(TAU * uLoop) + 0.13 * sin(uTime * 0.031);
  ucL = normalize(vec3(-0.88, 0.4 - 0.13 * low + 0.03 * sin(uTime * 0.043), -0.12 + az));
  ucLd = normalize(ucL * vec3(1.0, 1.0 / UC_Q, 1.0));
  ucSun = mix(vec3(1.95, 1.5, 1.02), vec3(2.0, 1.2, 0.64), uCue * 0.8) * (0.95 + 0.15 * uLevel);
  ucSky = vec3(0.22, 0.26, 0.38);
  bool inside = uVar > 0.5;
  if (inside) { ucL = normalize(vec3(-0.5 + az, 0.62 - 0.09 * low, 0.62)); ucSun *= 0.8; ucSky = vec3(0.19, 0.17, 0.19); }
  vec2 at; float px, lit, amb, far = 0.0; vec3 spots = vec3(0.0);
  vec4 f = inside ? ucIn(p, at, px, lit, amb, spots, far) : ucOn(p, at, px, lit, amb);
  vec3 c = f.rgb;
  if (f.a > 0.01) {
    vec2 tw = at * (inside ? 0.19 : 0.125);
    vec4 m = piece(vec2(0.5 + tw.x, 0.5 - tw.y));
    vec3 tint = mix(vec3(1.0), 0.6 + m.rgb * 0.7 / max(max(m.r, max(m.g, m.b)), 0.1), sat(m.a * 0.45 * ucGain) * ucS(0.5, 0.35, abs(tw.x)));
    vec3 g = ucSand(inside ? at * 2.2 + 5.0 : at, inside ? p * min(300.0, 0.4 * uRes.y) + 200.0 : at * min(90.0, 0.42 / px), ucS(5.5, 3.0, far), lit, amb, tint);
    if (inside) g = mix(g * mix(1.0, 0.7, ucS(3.0, 5.0, far)), mix(vec3(0.36, 0.26, 0.25), vec3(0.3, 0.3, 0.36), ucS(0.3, 0.5, p.y)), 1.0 - exp(-max(far - 3.6, 0.0) * 0.22)) + vec3(0.8, 0.7, 0.56) * spots * ucSun * ucL.y;
    c += f.a * g;
  }
  c = 1.0 - exp(-1.2 * max(c, 0.0));
  return pow(c, vec3(0.4545));
}
