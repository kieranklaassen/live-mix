// name: Storm eye
// a: From orbit
// b: Inside the wall
// what: From far above at sunrise a white wheel of cloud turns over a dark blue sea, its arms lit from the left and throwing long shadows, a stepped well at its middle, a thin line of air round the world; or low inside the well, walls of cloud going right round under a disc of sky, one side bright, one in blue shade.
// follows: A fuller piece turns the wheel faster; each part lifts and tints the cloud at its own place. The drone deepens the well, the pad veils, texture roughens the tops, the phrase lets an arm out or lights the edges of the shade, the bands raise towers round the wall, a hit glows in one tower, a cue opens the eye and closes it, keys glint on the sea.
// own: 0 white noon over green water at -1, a red evening at 1; 1 ochre dust over rust at -1, ash-dark cloud over a pale sea at 1; 2 a pinhole eye with steep walls at -1, a wide eye at 1; 3 one whole sheet of cloud, smooth shelves inside, at -1, torn thin arms and broken towers at 1; 4 from straight overhead, inside looking up to the sky, at -1, low along the edge of the world, inside with the sea filling the picture, at 1; 5 wound the other way, inside the towers leaning left over a glassy sea, at -1, wound tight, leaning right over a rough sea, at 1
float seR, seDeep, seOpen, seWind, seCover, seRough, sePc, sePx, seAns;   // the eye's size and depth, how far it is open, the arms' winding, how much cloud; last, how strongly it answers
mat2 seTurn, seTurn2;
vec3 seSunC, seShade, seSea, seWhite, seSkyC;   // the hour's light, the shade, the sea, the cloud's own colour, the sky
float seE(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
// Round heads of cloud packed side by side: which way the nearest one faces (xy) and how high it stands here (z).
// hard is how sharp the creases between them are.
vec3 seHeads(vec2 q, float seed, float hard) {
  vec2 i0 = floor(q - 0.5);
  vec3 b = vec3(0.0, 0.0, exp(-0.6 * hard));
  for (int j = 0; j < 4; j++) {
    vec2 id = i0 + vec2(j & 1, j >> 1);
    float h = hash21(id + seed), g = fract(h * 91.7);
    vec2 d = q - id - 0.5 - (vec2(h, g) - 0.5) * 0.5;
    float r = 0.62 + 0.2 * fract(h * 37.3);
    d /= r;
    float z = 1.0 - dot(d, d) - 0.25 * fract(g * 13.3);
    b += vec3(d, 1.0) * exp(z * hard);
  }
  return vec3(b.xy / b.z, log(b.z) / hard);
}
// The hour, the stuff the storm is made of.
void seLight() {
  float o = uOwn[0], m = uOwn[1];
  float lo = max(o, 0.0), hi = max(-o, 0.0), du = max(-m, 0.0), as = max(m, 0.0);
  float warm = 0.12 * (0.5 - uTone);
  seSunC = mix(mix(vec3(1.0, 0.83, 0.62), vec3(1.0, 0.98, 0.95), hi), vec3(1.0, 0.45, 0.2), lo) * vec3(1.0 + warm, 1.0, 1.0 - warm);
  seShade = mix(mix(vec3(0.25, 0.26, 0.48), vec3(0.24, 0.36, 0.52), hi), vec3(0.22, 0.1, 0.27), lo);
  seSea = mix(mix(vec3(0.004, 0.03, 0.1), vec3(0.005, 0.075, 0.12), hi), vec3(0.03, 0.016, 0.06), lo);
  seSkyC = mix(mix(vec3(0.03, 0.13, 0.42), vec3(0.02, 0.2, 0.55), hi), vec3(0.16, 0.1, 0.3), lo);
  seWhite = mix(mix(vec3(1.0), vec3(0.95, 0.58, 0.27), du), vec3(0.075, 0.07, 0.085), as);
  seShade = mix(mix(seShade, vec3(0.3, 0.15, 0.13), du), seShade * 1.2 + 0.1, as);
  seSea = mix(mix(seSea, vec3(0.1, 0.025, 0.012), du), vec3(0.42, 0.4, 0.35), as);
  seSkyC = mix(mix(seSkyC, vec3(0.5, 0.3, 0.14), du), vec3(0.5, 0.5, 0.46), as);
}
// How high the cloud stands at q, seen from above: sea at the bottom of the eye, a stepped wall, then arms running out.
float seDens, seN;   // how thick the cloud is, its broad unevenness
vec2 seW;           // the place with the arms unwound
float seH(vec2 q) {
  float r = length(q);
  float lr = log(r + 0.07);
  vec2 w = rot(seWind * lr) * (seTurn * q);
  float out_ = seE(seR * 2.0, seR * 3.4, r), lump = 0.0;
  if (out_ < 1.0) lump = (1.0 - out_) * noise(seTurn2 * q * 13.0);
  if (out_ > 0.0) lump += out_ * noise(w * 6.7);
  float n = mix(0.92, 0.66, out_) * noise(w * 2.5 + 3.1) + mix(0.08, 0.34, out_) * lump;
  lump *= lump * 1.6;
  seW = w; seN = n;
  float two = (w.x * w.x - w.y * w.y) / (r * r + 0.01);
  float smoothed = exp(-r * r / max(6.5 * seR * seR, 0.15));
  seDens = seE(-0.03, 0.3, n + 0.1 * two + 0.2 * uPhrase * seE(0.2, 1.0, w.x / (r + 0.05)) - seCover - 0.2 * max(r - 0.35, 0.0) + 0.5 * smoothed);
  float x = (r - seR * (0.62 + 0.16 * lump)) / (seR * 0.85);
  float s = sat(x) * 3.0, f = fract(s);
  float wall = (floor(s) + f * f * f * (f * (6.0 * f - 15.0) + 10.0)) / 3.0;
  float ri = (r - seR * 1.6) / (seR * 0.55), rim = exp(-ri * ri);
  float a = atan(q.y, q.x + 1e-6) / TAU + 0.5, k = a * 16.0 + 0.4 * sin(a * TAU * 3.0 + 1.0) + 0.3 * sin(a * TAU * 7.0);
  float tw = uBands[min(int(mod(k, 16.0)), 15)] * (0.5 - 0.5 * cos(TAU * k)) * seAns;
  float top = seDens * (0.035 + 0.1 * n + 0.07 * exp(-r * 1.6) + lump * (0.004 + 0.04 * rim) + 0.09 * sePc) + rim * (0.05 + (0.03 + 0.13 * lump) * tw);
  return mix(-seDeep, top, wall);
}
float seFib(vec2 w) { return noise(w * 20.0) * 0.55 + noise(rot(0.6) * w * 51.0) * 0.45; }
vec3 seOrbit(vec2 p) {
  float ld = 0.5 - 0.5 * cos(TAU * uLoop);
  // where we look from
  float T = 0.54 + (uOwn[4] < 0.0 ? 0.55 : 0.36) * uOwn[4] + 0.03 * (uSpace - 0.5), D = 3.0;
  vec2 at = vec2(0.2, -0.06) * (1.0 - 0.25 * abs(uOwn[4])) - vec2(0.0, 0.1) * max(uOwn[4], 0.0);
  vec2 s = rot(0.6) * (p - at);
  vec3 e = vec3(0.0, sin(T), -cos(T)), up = vec3(0.0, cos(T), sin(T));
  vec3 ro = -e * D, rd = normalize(e * 1.5 + up * s.y + vec3(s.x, 0.0, 0.0));
  const float R = 9.0;
  vec3 oc = ro + vec3(0.0, 0.0, R);
  float b = dot(oc, rd), rr = R + 0.2, cc = dot(oc, oc);
  float miss = sqrt(max(cc - b * b, 0.0)) - rr;       // how far over the edge of the world the look passes
  vec2 ls = normalize(rot(0.6) * vec2(-1.0, 0.12));
  float tanE = (mix(0.3, 0.42, ld) + 0.5 * max(-uOwn[0], 0.0) - 0.12 * max(uOwn[0], 0.0));
  // space and the line of air
  vec3 air = mix(seSkyC * 1.5 + 0.03, seSunC, 0.12) * (0.9 + 1.2 * uMic);
  vec3 col = vec3(0.0015, 0.002, 0.005) + air * (exp(-max(miss, 0.0) * 34.0) * 0.9 + 0.1 * exp(-max(miss, 0.0) * 9.0));
  if (miss > 0.0) return screenOf(col);
  float t = -b - sqrt(max(b * b - cc + rr * rr, 0.0));
  vec3 P = ro + rd * t, n = (P + vec3(0.0, 0.0, R)) / rr;
  float face = max(-dot(rd, n), 0.0);
  vec3 side = rd + n * face;
  vec2 q = P.xy, st = side.xy / max(face, 0.22);
  float r0 = length(q), an = atan(q.y, q.x + 1e-6) / TAU + 0.5;
  vec4 pc = piece(vec2(an, sat((r0 - 0.25) / 1.1)));
  float soft = seE(0.0, 0.04, an) * seE(1.0, 0.96, an) * seE(0.2, 0.4, r0);
  pc *= soft; pc *= seAns; sePc = min(pc.a, 1.0);
  // down to the tops of the cloud
  float z = mix(0.26, 0.17, seE(0.4, 0.7, r0)), h = 0.0, was = 1.0, stepBack = 0.0;
  float pull = mix(0.5, 0.72, seE(0.4, 0.7, r0)), cap = mix(0.055, 0.2, seE(0.4, 0.7, r0));
  for (int i = 0; i < 11; i++) {
    h = seH(q);
    float gap = z - h;
    if (gap < 0.0 && i > 0) { q += st * stepBack * gap / max(was - gap, 1e-4); h = seH(q); }
    if (gap < 0.01 || r0 > 1.5) break;
    stepBack = clamp(gap * pull, 0.004, cap);
    was = gap; z -= stepBack; q += st * stepBack;
  }
  float r = length(q), dens = seDens, wide = seN;
  vec2 w = seW, tq = seTurn2 * q, lt = seTurn2 * ls;
  // the slope toward the sun and what stands in its way
  float slope = (seH(q + ls * 0.02) - h) / 0.02;
  float fib = seFib(w), fib2 = seFib(seW);
  vec2 bend = vec2(fib, wide) * 1.4;
  vec3 c2 = seHeads(rot(0.7) * tq * 40.0 + bend * 1.6, 7.0, 14.0);
  float bo = (r - seR * 1.5) / (seR * 0.9);
  float boil = (0.1 + 0.4 * seE(0.95, 0.4, dens) + exp(-bo * bo)) * (0.45 + 0.9 * seRough) * seE(0.0, 0.25, dens);
  slope += (fib2 - fib) * 0.75 * dens - 0.4 * boil * dot(c2.xy, rot(0.7) * lt) * sat(c2.z + 0.5) * 1.3;
  float sh = 0.0, sd = 0.035;
  for (int i = 0; i < 5; i++) {
    sh = max(sh, (seH(q + ls * sd) - h - sd * tanE) / (0.012 + 0.1 * sd));
    sd *= 1.6;
    if (sd > mix(0.4, 0.1, seE(0.5, 0.9, r0))) break;
  }
  sh = sat(sh);
  float lit = sat((tanE - slope) / sqrt(1.0 + slope * slope) * 1.7) * (1.0 - sh);
  float well = seE(0.05, -seDeep, h);
  // the sea, with glints
  vec3 sea = seSea * (1.0 - 0.35 * well * uDrone);
  float gl = noise(q * 90.0 + vec2(uTime * 0.3, 0.0)) * noise(q * 63.0 - vec2(0.0, uTime * 0.21));
  sea += seSunC * (1.0 - 0.7 * sh) * seE(0.35, 0.8, gl) * (0.015 + 0.14 * uKeys);
  sea = mix(sea, sea + uKind[0] * uKind[0] * 0.22, well * uDrone);
  sea += (seSkyC * 0.5 + seSunC * 0.12) * uCue * seE(seR * 1.6, seR * 0.6, r);
  vec3 kc = pc.rgb / max(pc.a, 0.2);
  vec3 alb = seWhite * mix(vec3(1.0), 0.55 + 0.7 * kc, 0.55 * sePc);
  vec3 cl = alb * (seSunC * lit * (1.75 + 0.5 * fib) + seSunC * 0.2 * (1.0 - dens) * (1.0 - sh) + seShade * (0.75 + 0.35 * sat(h * 5.0)) * (1.15 - 0.45 * sat(abs(slope) * 0.6)) * (1.0 - 0.55 * well)) * (1.0 + 0.9 * uCue * seE(seR * 2.2, seR * 0.8, r) * (1.0 - lit));
  float a = seE(0.14, 0.6, dens + (fib - 0.5) * 2.6 * dens * (1.0 - dens)) * seE(-seDeep * 0.95, -seDeep * 0.6, h);
  a = max(a, seE(-seDeep * 0.97, -seDeep * 0.75, h) * seE(seR * 1.9, seR * 1.3, r));
  col = mix(sea * (1.0 - 0.6 * sh), cl, a);
  // small fair-weather cloud between the arms, and a veil of ice drawn out over everything
  float pop = seE(0.55, 1.0, c2.z * 0.8 + 3.0 * wide + 1.0 * fib - 2.1 + 0.15 * uHigh) * (1.0 - a) * seE(0.3, 0.6, r) * seE(0.3, 0.75, face);
  col = mix(col, seWhite * (seSunC * (0.75 - 0.6 * dot(c2.xy, rot(0.7) * lt)) * (1.0 - 0.8 * sh) * 1.2 + seShade * 0.6), pop * 0.85);
  float veil = seE(0.35, 0.8, fib) * (0.04 + 0.6 * uPad) * exp(-r * 0.9) * seE(0.34, 0.6, wide) * (0.3 + 0.7 * a);
  col = mix(col, seWhite * mix(seSunC * 1.3, uKind[1] * uKind[1] + 0.35, 0.3 * uPad), veil * (1.0 - well) * seE(seR, seR * 1.4, r));
  // lightning inside one tower of the wall
  float ha = TAU * uLoop;
  vec2 hp = vec2(cos(ha), sin(ha)) * seR * 1.5;
  float hd = length(q - hp) / 0.13;
  col += (mix(vec3(0.8, 0.85, 1.0), uKind[4], 0.3)) * uHits * exp(-hd * hd) * (0.4 + 1.2 * sat(c2.z)) * (0.8 + uEnergy);
  // the air between
  float far = pow(max(1.0 - face, 0.0), 3.0);
  col = mix(col, air * 0.75, sat(far * 1.3) * 0.7);
  return screenOf(col);
}
vec3 seWall(vec2 p) {
  float ld = 0.5 - 0.5 * cos(TAU * uLoop), v4 = uOwn[4], form = uOwn[3], px = sePx / 0.4;
  // a wide look that keeps the horizon straight and draws the disc of sky round
  float hy = -0.3 + (v4 < 0.0 ? 0.28 : 0.3) * v4;
  vec2 s = (p - vec2(0.0, hy)) / (0.4 - 0.06 * (uSpace - 0.5) - 0.06 * min(v4, 0.0));
  float k = 4.0 / (4.0 + dot(s, s));
  vec3 rd = vec3(s.x * k, 2.0 * k - 1.0, s.y * k);      // x right, y ahead, z up
  float flat_ = max(length(rd.xy), 1e-3), rise = rd.z / flat_;
  vec2 rh = rd.xy / flat_, cam = vec2(-0.14, -0.3);
  float size = exp(0.4 * uOwn[2]) * (1.0 + 0.16 * seOpen), eye = 0.06;
  vec3 L = normalize(vec3(-0.8, -0.3, (0.46 + 0.12 * ld) * (1.0 + 0.9 * max(-uOwn[0], 0.0) - 0.4 * max(uOwn[0], 0.0))));
  vec2 Lh = normalize(L.xy);
  float tanE = L.z / length(L.xy), az = atan(rd.x, rd.y);
  // the clean sky, a veil of ice in it
  float el = max(rd.z, 0.0);
  vec3 col = mix(seSkyC * 2.4 + 0.1 * seSunC + 0.03, seSkyC * (0.75 - 0.2 * uDrone), pow(el, 0.8));
  vec2 sk = rh * flat_ / (el + 0.35);
  float ice = (0.6 * noise(sk * vec2(2.2, 15.0) + vec2(uTime * 0.006, sin(sk.x * 2.0))) + 0.4 * noise(sk * vec2(5.0, 40.0) + sin(sk.x * 2.0) * 2.0)) * noise(sk * vec2(1.3, 2.6) - uTime * 0.004 + 4.0);
  col = mix(col, seWhite * mix(seSunC * 1.3, uKind[1] * uKind[1] + 0.3, 0.4 * uPad), seE(0.18, 0.75, ice) * (0.2 + 0.6 * uPad));
  col += seSunC * 0.25 * uMic * exp(-el * 2.0);
  float left = 1.0, tSea = eye / max(-rd.z / flat_, 1e-4), tWall = 9.0;
  vec3 wallC = vec3(0.0);
  float hitAz = -0.65 + 0.45 * sin(TAU * uLoop);
  // the tiers of the stadium, the nearest and lowest first
  for (int i = 0; i < 4; i++) {
    float fi = float(i), Rk = (0.82 + fi * 0.28) * size;
    float bq = dot(cam, rh), t = -bq + sqrt(max(bq * bq + Rk * Rk - dot(cam, cam), 0.0));
    if (i == 0) { tWall = t; if (tSea < t) break; }
    vec2 hp = cam + rh * t;
    float z = t * rise + eye;
    float turn = atan(hp.x, hp.y) / TAU + 0.5 + (uTravel * (0.012 - 0.002 * fi) + uTime * 0.003) / TAU;
    float N = 20.0 - 2.0 * fi, u = turn * N, unit = TAU * Rk / N, smooth_ = 1.0 + 0.85 * min(form, 0.0), base = 0.26 * (fi - 1.0) + 0.16;
    vec2 warp = 0.9 * vec2(noise(vec2(u * 1.1, z / unit * 0.9) + fi), noise(vec2(u * 0.9, z / unit) + 9.0 + fi));
    u += 0.35 * (warp.x - 0.45) - uOwn[5] * z / unit * 0.7;
    if (z > base + 0.6 + 0.35 * seAns + 0.5 * max(form, 0.0)) continue;
    float place = az / 3.6 + 0.5;
    vec4 pc = piece(vec2(place, sat(1.0 - z / 1.2))) * seE(0.0, 0.12, place) * seE(1.0, 0.88, place);
    // the towers of this tier
    float heap = 1e-9, across = 0.0, i0 = floor(u - 0.5);
    for (int j = 0; j < 2; j++) {
      float id = mod(i0 + float(j), N), hh = hash21(vec2(id, fi * 3.7 + 1.0)), g = fract(hh * 71.3);
      float d = (u - i0 - float(j) - 0.5 - (hh - 0.5) * 0.45) / (0.58 + 0.2 * g);
      float b = uBands[int(mod(id, 16.0))];
      float tall = base + 0.2 + 0.2 * g * (1.0 + form + max(form, 0.0)) + (0.16 * b + 0.06 * pc.a) * seAns * (0.4 + 0.6 * hh);
      float tz = tall - (0.34 + 0.3 * form) * (0.4 + 0.2 * fi) * unit * d * d * (0.6 + d * d) - (0.28 + 0.4 * max(form, 0.0) + 0.3 * b) * seE(0.36, 1.0, abs(u - i0 - float(j) - 0.5));
      float wt = exp((tz - base - 0.2) * 15.0) * seE(1.0, 0.6, abs(u - i0 - float(j) - 0.5));
      heap += wt; across += d * wt;
    }
    heap += 1.0; across /= heap;
    float best = base + 0.2 + log(heap) / 15.0;
    vec2 cq = vec2(u, z / unit);
    float lumpy = 1.0 + 0.6 * min(form, 0.0);
    vec3 c1 = seHeads(rot(0.4) * cq * 1.9 + warp, fi * 5.0, 11.0);
    float dd = best - z + unit * 0.24 * c1.z * lumpy;
    if (dd < -0.16 * unit) continue;
    vec3 c2 = seHeads(rot(1.1) * cq * 4.7 + warp * 2.0 + rot(0.7) * c1.xy * 0.35, fi * 5.0 + 2.0, 9.0);
    dd += unit * 0.1 * c2.z * lumpy;
    vec3 c3 = seHeads(rot(2.0) * cq * 11.0 + rot(0.9) * c2.xy * 0.4, fi * 5.0 + 3.0, 8.0);
    c1.xy = rot(-0.4) * c1.xy; c2.xy = rot(-1.1) * c2.xy; c3.xy = rot(-2.0) * c3.xy;
    dd += unit * 0.035 * c3.z * lumpy;
    float a = seE(0.0, 0.012 + px * t * 1.5, dd) * left;
    if (a < 0.003) continue;
    vec3 inw = vec3(-hp / Rk, 0.0), along = vec3(hp.y, -hp.x, 0.0) / Rk;
    float r3 = 0.16 + 0.34 * seRough;
    float tx = across * 0.6 * smooth_ + lumpy * (0.85 * c1.x + 0.5 * c2.x + r3 * c3.x);
    float tz = lumpy * (0.85 * c1.y + 0.5 * c2.y + r3 * c3.y) + 1.2 * exp(-max(dd, 0.0) / unit * 3.0) - 0.1;
    vec3 n = normalize(inw * 0.85 + along * tx + vec3(0.0, 0.0, tz));
    // the shadow the far side of the wall throws across
    float bl = dot(hp, Lh) / Rk, ac = 1.15 * size * (sqrt(bl * bl + 0.75) - bl);
    float sun = seE(-0.1, 0.1, z + ac * tanE - 1.2 - 0.16 * c1.z);
    float lit = sat(dot(n, L) * 1.35 + 0.05) * sun;
    float crease = sat(0.45 + 0.4 * c1.z + 0.3 * c2.z + 0.16 * c3.z) * (1.0 - 0.4 * smooth_ * seE(0.5, 1.1, abs(across)));
    float step_ = seE(base - 0.02, base + 0.24, z);
    vec3 c = seSunC * lit * 2.1 * (0.4 + 0.6 * crease);
    c += seShade * vec3(0.7, 0.85, 1.05) * (0.16 + 0.6 * crease) * (0.4 + 0.6 * step_) * (0.7 + 0.5 * n.z);
    c += seSunC * 0.1 * sat(dot(n, normalize(vec3(0.8, 0.45, -0.15)))) * (0.4 + 0.6 * crease);
    c += mix(seSunC, uKind[3] * uKind[3] * 1.4, 0.45 * uPhrase) * (0.3 + 0.7 * uPhrase * seAns) * exp(-max(dd, 0.0) / unit * mix(14.0, 7.0, uPhrase)) * step_;  // the thin edge lets light through
    c *= seWhite * mix(vec3(1.0), 0.5 + 0.8 * pc.rgb / max(pc.a, 0.2), 0.5 * min(pc.a, 1.0));
    float gd = length(vec2((az - hitAz) * 4.0, (z - 0.36) * 4.5));
    c += mix(vec3(0.8, 0.85, 1.0), uKind[4], 0.35) * uHits * exp(-gd * gd) * (0.6 + 1.9 * sat(c1.z) + 0.8 * sat(c2.z)) * (0.8 + uEnergy);
    c += seSunC * seWhite * 0.5 * uCue * step_ * crease * sat(0.6 + n.z);
    c = mix(c, col, 0.05 * fi);
    wallC += c * a; left -= a;
    if (left < 0.01) break;
  }
  col = col * left + wallC;
  // the wall as the sea has it, and the mist along its foot
  float br = seE(-0.3, 0.8, -dot(rh, Lh));
  vec3 wl = seWhite * mix(seShade * 0.75, seSunC * 1.1, br * 0.75);
  if (tSea < tWall) {
    vec2 g = cam + rh * tSea;
    float near = 1.0 / (1.0 + 40.0 * px * tSea * tSea / eye), rough = (0.55 + 0.5 * uLow) * exp(0.9 * uOwn[5]);
    vec2 sl = vec2(0.0);
    vec4 wv[5] = vec4[5](vec4(0.5, 0.87, 92.0, 0.6), vec4(-0.62, 0.78, 131.0, 0.7), vec4(0.2, 0.98, 223.0, 1.0), vec4(-0.9, 0.43, 347.0, 1.3), vec4(0.8, 0.6, 541.0, 1.6));
    float crest = 0.0;
    vec2 gw = g + 0.016 * vec2(noise(g * 22.0), noise(g * 22.0 + 7.0));
    for (int i = 0; i < 5; i++) {
      float ph = dot(gw, wv[i].xy) * wv[i].z + uTime * wv[i].w, fd = exp(-wv[i].z * px * tSea * tSea / eye * 0.35);
      float am = (i < 2 ? 0.14 : 0.1) * fd;
      sl += wv[i].xy * cos(ph) * am; crest += sin(ph) * fd * (i < 2 ? 0.3 : 0.15);
    }
    sl += 0.1 * near * (vec2(noise(g * vec2(510.0, 620.0) + uTime * 0.3), noise(g * vec2(600.0, 530.0) - uTime * 0.2)) - 0.5);
    vec3 n = normalize(vec3(-sl * rough, 1.0)), rf = reflect(rd, n);
    float e2 = abs(rf.z), br2 = seE(-0.3, 0.8, -dot(rf.xy, Lh));
    vec3 w2 = seWhite * mix(seShade * 0.6, seSunC * 1.1, br2 * br2 * 0.7);
    vec3 up = mix(w2, seSkyC * 1.5 + 0.03, seE(0.2, 0.75, e2));
    float fr = 0.1 + 0.6 * pow(1.0 - sat(dot(-rd, n)), 3.0);
    col = mix(seSea * (1.3 - 0.4 * uDrone) + seShade * 0.05, up, fr);
    col *= max(1.0 + 1.7 * rough * dot(sl, rh), 0.25);
    col += seSunC * pow(sat(dot(rf, normalize(vec3(-Lh, 0.5)))), 22.0) * (0.12 + 0.2 * uHigh + 2.2 * uKeys);
    col = mix(col, wl, 0.75 * seE(0.55, 1.1, crest + 0.5 * noise(g * 170.0)) * max(uOwn[5], 0.0) * near);
    col = mix(col, wl, 0.55 * exp(-max(tWall - tSea, 0.0) * 22.0) + 0.42 * exp((tSea / tWall - 1.0) * eye * 190.0));
  } else { float foot = max(tWall * rise + eye, 0.0); col = mix(col, wl, 0.55 * exp(-foot * 26.0) + 0.42 * exp(-foot * 110.0)); }
  // one white bird
  vec2 bp = vec2(-0.3 + 0.22 * sin(uTime * 0.031) + 0.03 * sin(uTime * 0.11), hy + 0.36 + 0.05 * sin(uTime * 0.047) + 0.03 * uPhrase);
  vec2 bq = rot(0.25 + 0.2 * sin(uTime * 0.031 + 1.0)) * (p - bp) / 0.03;
  float flap = 0.35 + 0.22 * sin(uTime * 1.7) * seE(0.2, 0.8, sin(uTime * 0.13)), ax = abs(bq.x);
  float wy = bq.y - flap * (1.6 * ax - 1.5 * ax * ax), th = 0.13 * sqrt(sat(1.0 - ax)) ;
  float body = length(bq * vec2(1.0, 1.0) - vec2(0.0, -0.02)) - 0.13;
  float bd = min(abs(wy) - th, body), baa = px * 0.5 / 0.03;
  col = mix(col, seWhite * seSunC * 1.9 + 0.2, sat(0.5 - bd / baa * 0.5) * seE(1.05, 0.95, ax));
  return screenOf(col);
}
vec3 render(vec2 p) {
  sePx = 1.0 / uRes.y;
  seLight();
  float cu = 4.0 * uCue * (1.0 - uCue);
  seOpen = cu;
  seAns = 0.5 + 1.1 * uEnergy;
  seR = (0.185 + 0.012 * uLevel) * exp(0.62 * uOwn[2]) * (1.0 + 0.35 * cu);
  seDeep = 0.2 + 0.08 * uDrone;
  seWind = 2.1 + 0.05 * sin(uTravel * 0.06) + (uOwn[5] < 0.0 ? 4.2 : 1.4) * uOwn[5];
  seCover = 0.3 + 0.16 * uOwn[3] - 0.03 * uLevel;
  seRough = 0.35 + 0.6 * uTexture;
  seTurn = rot(uTravel * 0.006 + uTime * 0.002);
  seTurn2 = rot(uTravel * 0.009 + uTime * 0.003);
  if (uVar < 0.5) return seOrbit(p);
  return seWall(p);
}
