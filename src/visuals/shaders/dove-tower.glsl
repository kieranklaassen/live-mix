// name: Dove tower
// a: Ringed niches
// b: Melon field
// what: Looking up from the floor of a round mud-brick dove tower: rings of small arched niches by the thousand, a leaning pillar, and daylight from the lattice above lying long and pale down one wall; or three squat banded towers in a field of melons in level evening sun, and a wheel of birds turning from sun to shade.
// follows: The piece lies round the walls, up the room: a sounding niche warms and a dove sits in it; outside it lights vines and melons. The drone moves the daylight, or wets furrows; pad warms the earth, texture is dust, bands light the rings, a phrase climbs as a bird, a voice warms the sun, keys light niches or melons. A hit sends out a pair, a cue lifts the birds.
// own: 0 moonlight at -1, red dusk inside or white noon outside at 1; 1 pale lime walls at -1, red clay at 1; 2 the roof gone and wide open, or low broad towers, at -1, walls drawn in to a small opening, or tapering hives, at 1; 3 nobody, and bare ground, at -1, a dove in nearly every niche, or many birds and melons, at 1; 4 looking straight up, or low among the melons, at -1, looking across at the niches, or from high over the field, at 1; 5 frost or snow at -1, ivy on the walls or a field all in leaf and flower at 1
const vec3 dtWarm = vec3(1.0, 0.68, 0.36);
float dtPx, dtLift, dtNight, dtDay, dtCold, dtLush, dtMany; // a pixel, a cue's lift, the hour, the season, how many live here
vec3 dtMud, dtSun, dtAir;  // the colour of the earth, the sun's light, the sky's light
float dtDn(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
float dtIn(float w, float d) { return dtDn(-w, w, d); }
// A dove flying toward hd: how much it covers, and how far out along the wings.
vec2 dtFly(vec2 q, vec2 hd, float size, float span) {
  hd /= max(length(hd), 1e-3);
  q = vec2(dot(q, hd), dot(q, vec2(-hd.y, hd.x))) / size;
  float y = abs(q.y) / span, body = (length(q / vec2(0.5, 0.13)) - 1.0) * 0.2;
  float wing = max(max(q.x - 0.3 - 0.12 * y + 0.75 * y * y, 0.34 * y - 0.55 * y * y - 0.22 - q.x), (y - 1.0) * 0.5);
  float tail = max(abs(q.y) + 0.34 * q.x + 0.07, max(q.x + 0.3, -0.82 - q.x));
  return vec2(dtIn(1.2 * dtPx / size, min(body, min(wing, tail))), smoothstep(0.1, 0.5, y));
}
float dtArch(vec2 c, float a, float b, float s) { return c.y > s ? length(vec2(c.x, c.y - s)) - a : max(abs(c.x) - a, b - c.y); }
// ---- a: inside, looking up
const float dtTop = 3.6, dtRise = 0.225, dtPilR = 0.2;  // how high the tower and one ring are, the pillar's radius
const vec2 dtPil = vec2(0.55, 0.1), dtLean = vec2(0.01, 0.05);
float dtMouth;  // the opening above
vec3 dtL, dtOval;  // toward the sun, and where its oval lies
// Bricks across an opening: 1 is a hole.
float dtLattice(vec2 q, float w) {
  q = rot(0.4) * q * 7.5;
  q.x += 0.5 * mod(floor(q.y), 2.0);
  return dtIn(w, length(max(abs(fract(q) - 0.5) - vec2(0.24, 0.2), 0.0)) - 0.1);
}
// How much sun comes down to a place.
float dtBeam(vec3 q) {
  float up = (dtTop - q.z) / dtL.z;
  vec2 at = q.xy + dtL.xy * up, o = q.xy - dtPil - dtLean * q.z, d = dtL.xy - dtLean * dtL.z;
  float t = clamp(-dot(o, d) / max(dot(d, d), 1e-5), 0.0, up), lit = dtIn(0.05, length(at) - dtMouth);
  if (t > 0.02) lit *= smoothstep(dtPilR - 0.02, dtPilR + 0.03, length(o + d * t));
  return lit * (0.4 + 0.6 * dtLattice(at, 0.12 + 0.12 * up / dtTop));
}
// Soft light on a place that faces n.
vec3 dtSoft(vec3 q, vec3 n) {
  vec3 v = vec3(0.0, 0.0, dtTop) - q, b = dtOval - q;
  float d2 = dot(v, v) + 0.05, d1 = sqrt(d2), e2 = dot(b, b) + 0.12;
  return dtAir * (0.25 + 0.75 * sat(0.3 + dot(n, v) / d1)) * max(v.z, 0.0) * (0.5 + dtMouth) / (d2 * d1) * 1.9
    + dtSun * dtMud * (0.12 + max(dot(n, b), 0.0)) / (e2 * e2 + 0.3) * 0.5;
}
// A wall of niches at q: n faces us, e runs round, u counts round, cw is a niche.
vec3 dtWall(vec3 q, vec3 n, vec3 e, vec3 d, float u, float count, float cw, float t) {
  float ring = floor(q.z / dtRise), zz = q.z - ring * dtRise, rib = 0.034, rh = 0.5 * (dtRise - rib), row = step(rib + rh, zz), r = ring * 2.0 + row;
  float m = abs(u - 0.5 * count), g1 = noise(vec2(m * 1.3, q.z * 11.0)), g2 = noise(vec2(m * 8.0, q.z * 110.0));
  u += 0.5 * mod(r, 2.0);
  float id = mod(floor(u), count), h = hash21(vec2(id + 3.0, r + 60.0));
  vec2 c = vec2((fract(u) - 0.5) * cw, zz - rib - rh * (row + 0.5));
  vec3 dl = vec3(dot(d, e), d.z, max(-dot(d, n), 0.03)), ll = vec3(dot(dtL, e), dtL.z, -dot(dtL, n)), from = q - vec3(-0.8, 0.4, 0.75);
  float w = t * dtPx * 1.6 / max(dl.z, 0.16), a = cw * (0.345 + 0.03 * h), b = -0.041, s = 0.041 - a, sd = dtArch(c, a, b, s) + 0.005 * (g2 - 0.5);
  vec4 pc = piece(vec2(fract((id + 0.5) / count), 1.0 - sat((r + 0.5) / 32.0)));
  float glow = smoothstep(0.0, 0.3, pc.a * 0.6 - fract(h * 13.7)) * sat(0.3 + pc.a) + uKeys * smoothstep(0.95, 0.97, fract(h * 7.31));
  vec3 tint = pc.rgb / max(pc.a, 0.01);
  tint = mix(vec3(1.0, 0.56, 0.2), tint * tint * 1.8, 0.4);
  // the wall: mud, ivy or frost, and the round rib under each ring
  vec3 alb = dtMud * (0.68 + 0.5 * g1 + 0.25 * (g2 - 0.5));
  alb = mix(alb, vec3(0.1, 0.17, 0.05) * (0.4 + 1.4 * g2), dtLush * smoothstep(0.38, 0.6, 0.65 * noise(vec2(m * 0.22, 3.0 + q.z * 0.3)) + 0.35 * g1 + 0.1 * q.z - 0.08));
  alb = mix(alb, vec3(0.75, 0.79, 0.85), dtCold * smoothstep(0.1, 0.55, g1 + 0.1 * g2) * 0.85);
  float ribM = dtIn(w, zz - rib), up = (sat(zz / rib) * 2.0 - 1.0) * ribM, ledge = 1.0 - 0.45 * dtDn(0.0, 0.03, dtRise - zz);
  vec3 soft = dtSoft(q, n), sunC = dtSun * 6.5 * dtBeam(q);
  vec3 face = alb * (soft * ledge * (1.0 + 0.4 * up) + sunC * max(dot(normalize(n + vec3(0.0, 0.0, 0.9 * up)), dtL), 0.0));
  face += alb * dtWarm * (uBands[int(clamp(ring, 0.0, 15.0))] * (0.02 + 0.16 * ribM) * (0.4 + uEnergy) + uHits * 0.8 * exp(-7.0 * dot(from, from)));
  // into the niche
  vec2 k = dl.xy / dl.z;
  float deep = 0.075, ex = max(((k.x > 0.0 ? a : -a) - c.x) / (abs(k.x) < 1e-4 ? 1e-4 : k.x), 0.0), oy = c.y - s;
  vec3 nl = vec3(-sign(k.x), 0.0, 0.0);
  float x2 = (b - c.y) / min(k.y, -1e-4);
  if (k.y < 0.0 && x2 < ex) { ex = x2; nl = vec3(0.0, 1.0, 0.0); }
  float kk = max(dot(k, k), 1e-6), kb = c.x * k.x + oy * k.y, x3 = (sqrt(max(kb * kb - kk * (c.x * c.x + oy * oy - a * a), 0.0)) - kb) / kk;
  if (oy + k.y * x3 > 0.0 && x3 < ex + 0.004) { ex = x3; nl = vec3(-c.x - k.x * x3, -oy - k.y * x3, 0.0) / a; }
  ex = max(ex, 0.0);
  if (ex > deep) { ex = deep; nl = vec3(0.0, 0.0, -1.0); }
  vec2 at = c + k * ex;
  float sun = max(dot(nl, ll), 0.0) * (ll.z < -0.01 ? dtIn(0.004, dtArch(at - ll.xy * ex / ll.z, a, b, s)) : 1.0);
  vec3 cav = alb * (soft * mix(0.75, 0.1, pow(ex / deep, 0.6)) * (0.75 + 0.2 * nl.y) + sunC * (sun + 0.05 - 0.03 * nl.y));
  cav += (alb + 0.03) * tint * glow * 2.6 * exp(-26.0 * (at.y - b)) * (0.55 + 0.9 * uEnergy);
  // who sits there: two shaded ovals and a tail
  float sits = dtIn(0.012, h - 0.055 - 0.95 * max(dtMany, 0.0));
  sits = max(sits, smoothstep(0.2, 0.6, glow) * step(0.45, fract(h * 91.7))) * sat(1.0 + dtMany) * step(0.022, ex);
  vec2 bq = (c + k * 0.022 - vec2(0.0, b)) / 0.037;
  bq.x = bq.x * sign(fract(h * 37.0) - 0.5) - 0.04 + 0.04 * sin(uTime * 0.5 + h * 40.0) * bq.y;
  bq.y -= 0.6 * dtLift * fract(h * 5.0);
  float bird = smin((length(rot(-0.45) * (bq - vec2(-0.05, 0.62)) / vec2(0.72, 0.5)) - 1.0) * 0.5, length(bq - vec2(0.5, 1.2)) - 0.26, 0.12);
  bird = min(bird, max(abs(bq.y - 0.4 - 0.3 * bq.x) - 0.1, max(bq.x + 0.4, -1.15 - bq.x)));
  vec3 plum = mix(vec3(0.82, 0.78, 0.72), vec3(0.36, 0.37, 0.42), step(0.7, fract(h * 23.0))) * (0.12 + 1.1 * pow(sat(0.3 + 0.45 * bq.y + 0.25 * bq.x), 2.0));
  cav = mix(cav, plum * (soft * 1.1 + sunC * 0.45 + tint * glow * 0.5 + 0.012), dtIn(w / 0.037, bird) * sits);
  return mix(face, cav, dtIn(w, sd));
}
vec3 dtInside(vec2 p) {
  float wide = max(-uOwn[2], 0.0), narrow = max(uOwn[2], 0.0), tp = 0.035 + 0.17 * narrow;
  dtSun = mix(mix(vec3(1.0, 0.86, 0.64), vec3(1.0, 0.36, 0.12), dtDay), vec3(0.2, 0.3, 0.5), dtNight) * (1.0 + 0.35 * uLevel + 0.3 * uMic + 0.4 * uCue);
  dtAir = mix(mix(vec3(0.86, 0.9, 0.98), vec3(0.75, 0.42, 0.42), dtDay), vec3(0.09, 0.14, 0.27), dtNight) * (0.9 + 0.3 * uLevel);
  dtMouth = 0.48 + 0.5 * wide - 0.22 * narrow;
  // the drone draws the sun's oval down and along the wall
  dtOval = vec3(0.95 * normalize(vec2(-0.5 + 0.12 * sin(uTime * 0.021) + 0.3 * uDrone, 0.84)), 1.4 + 0.12 * sin(uTime * 0.017 + 1.0) - 0.35 * uDrone);
  dtL = normalize(vec3(0.0, 0.0, dtTop) - dtOval);
  // the eye, near one wall
  float el = mix(1.0, uOwn[4] < 0.0 ? 1.5 : 0.62, abs(uOwn[4])) + 0.01 * sin(uTime * 0.05), F = 0.66 + 0.06 * (uOwn[4] - uSpace);
  vec3 o = vec3(-0.5 - 0.2 * min(uOwn[4], 0.0), -0.45, 0.0), ri = vec3(0.9928, -0.1197, 0.0), fw = vec3(0.1197 * cos(el), 0.9928 * cos(el), sin(el)), uu = cross(ri, fw);
  vec3 d = normalize(fw * F + ri * p.x + uu * p.y), col;
  // the wall, the ceiling, the pillar
  float A = dot(d.xy, d.xy) - tp * tp * d.z * d.z, B = dot(o.xy, d.xy) + tp * d.z, C = dot(o.xy, o.xy) - 1.0;
  float t = -C / max(B + sqrt(max(B * B - A * C, 0.0)), 1e-4), roof = (dtTop - o.z) / max(d.z, 1e-3), turn = fract(uTravel * 0.0007 + uTime * 0.0004);
  vec2 po = o.xy - dtPil, pd = d.xy - dtLean * d.z;
  float pa = max(dot(pd, pd), 1e-6), pb = dot(po, pd), pc = pb * pb - pa * (dot(po, po) - dtPilR * dtPilR), tq = (-pb - sqrt(max(pc, 0.0))) / pa;
  bool ceiling = roof < t, pillar = pc > 0.0 && tq > 0.0 && tq < min(t, roof);
  t = pillar ? tq : min(t, roof);
  vec3 q = o + d * t;
  vec2 c = q.xy - (pillar ? dtPil + dtLean * q.z : vec2(0.0));
  float ang = fract(atan(c.y, c.x + 1e-5) / TAU + turn), r = max(length(c), 1e-3), fp = t * dtPx * 2.0, count = pillar ? 16.0 : 76.0, side = pillar ? 1.0 : -1.0;
  if (ceiling && !pillar) {
    vec3 sky = dtAir * mix(vec3(1.9, 1.85, 1.8), vec3(0.5, 0.72, 1.05) * (0.7 + 0.7 * smoothstep(0.3, 0.8, noise(q.xy * 2.5 + uTime * 0.02))), 0.8 * wide);
    float seg = (fract(ang * 9.0) - 0.5) * TAU / 9.0;
    vec2 sq = r * vec2(cos(seg), sin(seg)) - vec2(0.72, 0.0);
    col = dtMud * dtAir * (0.16 + 0.5 * exp(-abs(r - dtMouth) * 9.0));
    col = mix(col, sky * dtLattice(sq * 2.5, 0.06 + fp * 8.0), dtIn(fp, length(sq) - 0.085) * (1.0 - wide) * (1.0 - narrow));
    col = mix(col, sky * mix(dtLattice(q.xy, 0.04 + fp * 6.0), 1.0, 0.25 + 0.75 * wide), dtIn(fp, r - dtMouth));
  } else {
    vec3 n = vec3(c * side / r, 0.0);
    col = dtWall(q, n, vec3(-c.y, c.x, 0.0) / r, d, ang * count, count, TAU * r / count, t);
    if (pillar) col *= mix(0.6, 1.0, smoothstep(0.0, 0.3, dot(-d, n)));
  }
  // the shaft of daylight: how far the eye's ray runs in it
  vec2 sh = dtL.xy / dtL.z, so = o.xy + sh * dtTop, sv = d.xy - sh * d.z;
  float sa = max(dot(sv, sv), 1e-5), sb = dot(so, sv), sD = sqrt(max(sb * sb - sa * (dot(so, so) - dtMouth * dtMouth), 0.0));
  float run = max(min((sD - sb) / sa, t) - max((-sb - sD) / sa, 0.0), 0.0);
  col += dtSun * 0.8 * (1.0 - exp(-run * (0.08 + 0.02 * uLevel + 0.25 * uTexture) * (0.6 + 0.8 * noise(p * 5.0 + vec2(0.0, uTime * 0.04)))));
  // birds on slow rings; two climb, two burst across
  for (int i = 0; i < 10; i++) {
    float fi = float(i), al = i < 3 ? sat(1.0 + dtMany) : i % 6 == 3 ? smoothstep(0.02, 0.4, uPhrase) : i < 6 ? smoothstep(0.0, 0.35, uHits) : max(sat(dtMany), smoothstep(0.0, 0.3, dtLift));
    float way = mod(fi, 2.0) * 2.0 - 1.0, a = uTime * 0.22 * way + fi * 2.4, rise = fract(uTime * 0.035 + fi / 12.0), k = fi - 4.5;
    vec3 b = vec3(0.5 * cos(a) - 0.08, 0.5 * sin(a) + 0.12, 1.15 + 0.28 * mod(fi * 3.0, 7.0) + 0.5 * dtLift), hd = vec3(-sin(a), cos(a), 0.15) * way;
    if (i % 6 == 3) { b.z = 1.0 + 2.2 * rise; al *= smoothstep(0.0, 0.1, rise) * dtDn(0.85, 1.0, rise); }
    if (abs(k) < 1.0) { b = mix(vec3(0.4, 0.5 + 0.5 * k, 1.5), vec3(-0.72, 0.28, 0.75), uHits) + 0.2 * k; hd = vec3(1.0, 0.35 + 0.5 * k, 0.6); }
    vec3 rel = b - o;
    float z = max(dot(rel, fw), 0.1), sc = F * (i % 6 == 3 ? 0.115 : 0.085) / z;
    vec2 sp = vec2(dot(rel, ri), dot(rel, uu)) / z, bd = p - F * sp;
    if (length(bd) < sc * 1.25 && length(rel) < t) {
      vec2 fl = dtFly(bd, vec2(dot(hd, ri), dot(hd, uu)) - sp * dot(hd, fw), sc, 0.72 + 0.28 * sin(uTime * 5.0 + fi * 2.0));
      col = mix(col, dtSoft(b, vec3(0.0, 0.0, 1.0)) * (0.24 + 0.36 * fl.y) + dtSun * dtBeam(b) * (0.7 + fl.y), fl.x * al);
    }
  }
  // one feather, coming down
  float fc = fract(uTime * 0.021 + 0.3);
  vec2 fa = rot(0.9 * cos(fc * 25.0) + 0.5) * (p - vec2(0.02 + 0.07 * sin(fc * 25.0), 0.24 - 0.62 * fc)) / vec2(0.036, 0.007);
  fa.y -= 0.6 * fa.x * fa.x;
  col = mix(col, dtSun * 0.7 + dtAir * 0.12, dtIn(dtPx * 70.0, length(fa * vec2(1.0, 1.0 + 0.4 * fa.x)) - 1.0) * smoothstep(0.0, 0.08, fc) * dtDn(0.9, 1.0, fc));
  return col * 1.35;
}
// ---- b: outside, over the field
const float dtF = 0.9, dtRun = 0.25;  // the lens, and which way the furrows run
float dtEye, dtHor, dtHigh, dtTan;  // how high the eye stands, where the horizon is, how high a tower, how steep the sun
vec2 dtS, dtC;  // toward the sun over the ground; where the drum we look at stands,
vec3 dtLowC, dtHighC, dtQ;  // the sky below and above; how far round that drum, how high, 0 to 1 up it,
float dtR, dtOwn, dtMain, dtCov, dtNow;  // how wide, of which tower, the main drum or not, how much it covers; the tower drawn now
vec3 dtTowerAt(float i) { return i < 0.5 ? vec3(-10.8, 12.0, 5.0) : i < 1.5 ? vec3(9.4, 26.0, 5.2) : vec3(-5.2, 58.0, 5.0); }
// How much of the low sun reaches a place: the two nearer towers throw long shadows.
float dtSunAt(vec3 q, float own) {
  float lit = 1.0;
  for (float i = 0.0; i < 2.0; i++) {
    vec3 T = dtTowerAt(i) - vec3(q.xy, 0.0);
    float al = dot(T.xy, dtS), h = q.z + al * dtTan, soft = 0.15 + 0.025 * max(al, 0.0);
    if (i != own) lit *= 1.0 - dtIn(soft, abs(T.y * dtS.x - T.x * dtS.y) - T.z * (h < dtHigh ? 1.0 : 0.5)) * smoothstep(0.0, 2.0, al) * dtIn(soft, h - dtHigh * 1.4);
  }
  return lit;
}
vec3 dtSky(float x, float up) {
  float s = exp(-1.3 * length(vec2(0.8 * x - 0.84, 1.6 * up - 0.16)));
  return mix(dtLowC, dtHighC, smoothstep(-0.02, 0.5, up - 0.25 * s)) + dtSun * s * (0.36 + 0.12 * uPad + 0.08 * uLevel + 0.2 * uMic);
}
vec3 dtHaze(vec3 col, float z) { return mix(dtAir, col, exp(-z * (0.003 + 0.004 * uSpace + 0.005 * uTexture))); }
// A round of brick at c, r0 wide at its foot, r1 at its head, from h0 to h1. What is seen is kept.
void dtDrum(vec2 p, vec2 c, float r0, float r1, float h0, float h1, float dome) {
  float x = p.x * c.y / dtF - c.x, r = 0.5 * (r0 + r1), w = dtPx * c.y / dtF, v, h;
  for (int i = 0; i < 2; i++) {
    h = dtEye + (p.y - dtHor) / dtF * (c.y - sqrt(max(r * r - x * x, 0.0)));
    v = sat((h - h0) / (h1 - h0));
    if (i == 0) r = mix(mix(r0, r1, v), r0 * sqrt(1.0 - v * v * v * v), dome) + 1e-3;
  }
  float m = dtIn(w, max(abs(x) - r, max(h0 - h, h - h1)));
  if (m > min(dtCov, 0.5)) { dtQ = vec3(clamp(x / r, -1.0, 1.0), h, v); dtC = c; dtR = r0; dtOwn = dtNow; dtMain = step(h1, dtHigh * 0.97); }
  dtCov = max(dtCov, m);
}
void dtTower(vec2 p, float i) {
  vec3 T = dtTowerAt(i);
  float H = dtHigh, R = T.z, top = R * (0.93 - 0.4 * max(uOwn[2], 0.0)), a = asin(clamp((p.x * T.y / dtF - T.x) / (0.84 * top), -1.0, 1.0));
  a = 0.56 * clamp(floor(a / 0.56 + 0.5), -2.0, 2.0);
  vec2 rim = T.xy + top * 0.84 * vec2(sin(a), -cos(a));
  rim.x *= rim.y / T.y;
  dtNow = i;
  dtDrum(p, T.xy, R * 0.21, R * 0.21, H * 1.2, H * 1.58, 1.0);
  dtDrum(p, T.xy, top * 0.57, top * 0.54, H * 0.8, H * 1.34, 0.0);
  dtDrum(p, rim, R * 0.085, R * 0.085, H * 0.9, H * 1.22, 1.0);
  dtDrum(p, T.xy, top, top, H * 0.92, H * 1.06, 0.0);
  dtDrum(p, T.xy, R, top * 0.97, 0.0, H * 0.96, 0.0);
}
// That drum: courses of brick, a band of plaster, sixteen rows of holes.
vec3 dtBrick() {
  float nz = sqrt(1.0 - dtQ.x * dtQ.x), v = dtQ.z, a = asin(dtQ.x) * dtR, w = dtPx * dtC.y / dtF, vw = w / dtHigh, lam = max(dot(vec2(dtQ.x, -nz), dtS), 0.0);
  float g = noise(vec2(a * 1.6 + dtOwn * 9.0, dtQ.y * 2.6)), row = floor(v * 16.0), band = dtMain * dtIn(vw, abs(v - 0.8) - 0.085), ha = a * 1.25 + 0.5 * mod(row, 2.0);
  vec3 alb = dtMud * (0.55 + 0.3 * g + 0.3 * noise(vec2(a * 5.0, dtQ.y * 0.5))) * (1.0 - 0.12 * smoothstep(0.35, 0.5, abs(fract(dtQ.y * 3.2) - 0.5)) * sat(1.0 - w * 5.0));
  alb = mix(alb, mix(dtMud, vec3(0.86, 0.8, 0.7), 0.65), band * (1.0 - 0.75 * dtIn(0.03 + w, abs(abs(fract(a * 0.9) - 0.5) + abs(v - 0.8) * 6.0 - 0.28) - 0.05)));
  float hole = dtMain * dtIn(0.02 + w, dtArch(vec2(fract(ha) - 0.5, (fract(v * 16.0) - 0.5) * 0.36), 0.1, -0.1, 0.02)) * step(row, 10.5) * step(1.5, row) * step(0.45, hash21(vec2(floor(ha), row)));
  vec3 col = alb * (1.0 - 0.8 * hole) * (dtSun * 5.0 * lam * dtSunAt(vec3(dtC, dtQ.y), dtOwn) + dtAir * (0.07 + 0.1 * nz + 0.06 * v));
  return dtHaze(col + vec3(1.0, 0.45, 0.12) * uBands[int(clamp(row, 0.0, 15.0))] * dtMain * (0.55 * hole + 0.07 * lam) * (0.4 + uEnergy), dtC.y);
}
// Birds on a tilted hoop; one climbs, two burst out.
vec3 dtWheel(vec3 col, vec2 p) {
  vec2 q = rot(-0.16) * (p - vec2(0.1 + 0.03 * sin(uTime * 0.031), 0.23 + 0.05 * dtLift));
  for (int i = 0; i < 8; i++) {
    float fi = float(i), R = (0.2 + 0.052 * fi) * (1.0 + 0.2 * dtLift), sq = 0.3 + 0.03 * fi + 0.1 * dtLift, n = 17.0 + 3.0 * fi, spin = uTime * 0.04 + fi * 0.8;
    float id = floor(fract((atan(q.y / sq, q.x + 1e-5) - spin) / TAU) * n), h = hash21(vec2(id, fi + 4.0)), ca = (id + 0.3 + 0.4 * h) / n * TAU + spin;
    float size = (0.013 - 0.004 * sin(ca)) * (0.8 + 0.4 * fract(h * 17.3)), al = smoothstep(0.0, 0.15, 0.55 + 0.55 * dtMany - fract(h * 73.0)), c = fract(uTime * 0.03);
    vec2 hd = vec2(-sin(ca), cos(ca) * sq), b = q - vec2(cos(ca), sin(ca) * sq) * (R + 0.05 * (fract(h * 29.0) - 0.5));
    if (i == 5) { ca = c * 22.0; size = 0.034; hd = vec2(-sin(ca), 0.4 * cos(ca) + 0.2); b = p - vec2(-0.2 + 0.09 * cos(ca), 0.45 * c + 0.03 * sin(ca) - 0.02); al = smoothstep(0.02, 0.4, uPhrase) * smoothstep(0.0, 0.1, c) * dtDn(0.9, 1.0, c); }
    if (i > 5) { h = fi - 6.0; ca = 1.2; size = 0.026; hd = vec2(-0.8 - 0.3 * h, 0.5 - 0.4 * h); b = p - vec2(0.3, 0.06) - hd * (0.46 - 0.4 * uHits); al = smoothstep(0.0, 0.35, uHits); }
    if (dot(b, b) < size * size * 1.4) {
      vec2 fl = dtFly(b, hd, size, 0.6 + 0.2 * sin(uTime * 4.0 + h * 60.0));
      col = mix(col, mix(dtAir * vec3(0.4, 0.42, 0.5), dtSun * (1.5 + uPhrase) + dtAir * 0.5, smoothstep(-0.3, 0.6, sin(ca + 0.9) * 0.8 + 0.25 * fl.y)), fl.x * al);
    }
  }
  return col;
}
vec3 dtGround(vec2 p, float t) {
  float gz = dtF * dtEye / t, gx = p.x * gz / dtF, fp = gz * dtPx / dtF, fz = gz * fp / dtEye, far = sat(1.3 - 1.6 * max(fp, abs(p.x / dtF - dtRun) * fz)), row = gx - dtRun * gz;
  float u = row / 1.55 + 0.06 * sin(gz * 0.35), cu = cos(TAU * u) * far, g = noise(vec2(u * 5.0, gz * 2.0)), clod = mix(0.5, noise(vec2(u * 22.0, gz * 11.0)), sat(1.0 - 2.0 * fz));
  // level light across the furrows, and vines along the ridges
  vec3 L = normalize(vec3(dtS.x, dtTan, dtS.y));
  float lam = max(dot(normalize(vec3(sin(TAU * u) * 0.8 * far + clod - 0.5, 1.0, 0.5 * g - 0.25)), L), 0.0), lit = dtSunAt(vec3(gx, gz, 0.0), 9.0);
  float green = smoothstep(0.42, 0.6, 0.5 * cu + 0.3 * clod + 0.35 * noise(vec2(u * 1.7, gz * 0.8)) + 0.12 + 0.7 * dtLush - 0.6 * dtCold + (dtMany < 0.0 ? 0.7 : 0.15) * dtMany);
  vec3 alb = mix(dtMud * 0.72, vec3(0.2, 0.15, 0.11), 0.35) * (0.45 + 0.5 * g + 0.3 * clod);
  alb = mix(alb, mix(vec3(0.07, 0.1, 0.035), vec3(0.26, 0.27, 0.09), clod) * (0.4 + g), green);
  alb = mix(alb, vec3(0.85, 0.8, 0.25), dtLush * green * smoothstep(0.6, 0.7, clod));
  alb = mix(alb, vec3(0.83, 0.86, 0.92), dtCold * smoothstep(0.1, 0.4, g + 0.4 * cu + 0.1));
  // what is sounding lies on the field: across is the loop, away is the room
  vec4 pc = piece(vec2(0.5 + p.x / 1.76, sat(1.15 - gz / 34.0)));
  vec3 col = alb * (dtSun * 3.4 * lam * lit + dtAir * (0.13 + 0.1 * cu) + (pc.rgb * 0.7 + pc.a * 0.4 * dtWarm) * (0.4 + 1.1 * green) * (0.5 + uEnergy));
  float wet = dtDn(-0.93, max(-0.7 - 0.3 * fp, -0.92), cu) * smoothstep(0.0, 0.6, uDrone + 0.1 - 0.3 * g) * sat(1.0 + dtMany - dtCold - dtLush);
  col = mix(col, dtSky(p.x, 0.4 * t + 0.02 * clod) * (0.25 + 0.45 * lit), wet * 0.85);
  // melons, each a ball lying on a ridge
  float mz = gz * (1.0 - 0.1 / dtEye);
  for (float i = 0.0; i < 3.0; i++) {
    vec2 id = vec2(0.0, floor(mz / 2.4) - i);
    id.x = floor((p.x / dtF - dtRun) * (id.y + 0.575) * 1.548 + 0.5);
    float h = hash21(id + 11.0), zc = max((id.y + 0.4 + 0.35 * fract(h * 31.0)) * 2.4, 0.8), rr = 0.19 + 0.1 * fract(h * 57.0), k = zc / (dtF * rr);
    float shown = dtIn(0.02, h - 0.53 - 0.56 * dtMany) * dtDn(18.0, 26.0, zc * max(2.3 / dtEye, 1.0)) * smoothstep(1.2, 2.0, zc) * (1.0 - 0.6 * dtCold);
    vec2 dq = (p - vec2(1.55 * (id.x - 0.06 * sin(zc * 0.35)) + dtRun * zc, rr * 0.85 - dtEye) * dtF / zc - vec2(0.0, dtHor)) * k, sd = (dq - vec2(-1.1, -0.85)) / vec2(1.7, 0.4);
    col *= 1.0 - 0.6 * shown * dtDn(0.3, 1.0, dot(sd, sd));
    vec3 nn = vec3(dq, sqrt(max(1.0 - dot(dq, dq), 0.0))), ma = mix(vec3(0.8, 0.55, 0.18), vec3(0.55, 0.6, 0.3), fract(h * 31.0)) * (0.8 + 0.1 * cos(atan(nn.x, nn.z + 1e-3) * 11.0 + h * 9.0) + 0.25 * clod);
    ma = mix(ma, vec3(0.86, 0.88, 0.92), dtCold * smoothstep(-0.1, 0.5, nn.y));
    ma *= dtSun * 4.2 * max(dot(nn, vec3(L.x, L.y, -L.z)), 0.0) * lit + dtAir * (0.2 + 0.16 * nn.y) + (mix(pc.rgb, dtWarm * pc.a, 0.45) * 1.4 + dtWarm * uKeys * step(0.8, fract(h * 13.0))) * (0.5 + 0.5 * nn.z) * (0.4 + uEnergy);
    col = mix(col, ma, dtIn(dtPx * k, length(dq) - 1.0) * shown);
  }
  return dtHaze(col, gz);
}
vec3 dtField(vec2 p) {
  float az = 0.36 + 0.03 * sin(uTime * 0.013), v4 = abs(uOwn[4]), t;
  dtSun = mix(mix(vec3(1.0, 0.5, 0.2), vec3(1.0, 0.92, 0.78), dtDay), vec3(0.11, 0.16, 0.28), dtNight) * (0.95 + 0.12 * uLevel + 0.12 * uPad + 0.3 * uCue);
  dtLowC = mix(mix(mix(vec3(0.82, 0.46, 0.25), vec3(0.8, 0.88, 0.95), dtDay), vec3(0.72, 0.76, 0.84), 0.7 * dtCold), vec3(0.045, 0.07, 0.13), dtNight);
  dtHighC = mix(mix(mix(vec3(0.2, 0.3, 0.45), vec3(0.13, 0.33, 0.68), dtDay), vec3(0.5, 0.56, 0.65), 0.7 * dtCold), vec3(0.006, 0.013, 0.04), dtNight);
  dtEye = mix(2.3, uOwn[4] < 0.0 ? 1.1 : 8.0, v4); dtHor = mix(-0.12, uOwn[4] < 0.0 ? -0.22 : 0.14, v4); dtHigh = mix(6.2, uOwn[2] < 0.0 ? 4.2 : 7.6, abs(uOwn[2]));
  dtS = vec2(cos(az), sin(az)); dtTan = mix(0.15, 0.7, dtDay) + 0.01 * sin(uTime * 0.017);
  dtAir = mix(dtSky(p.x, 0.01), dtSky(p.x, 0.3), 0.35); t = p.y - dtHor;
  vec3 col = dtSky(p.x, t);
  // thin cloud lit from under, stars by night, hills and poplars far off
  float cl = noise(vec2(p.x * 2.0 + uTime * 0.003 + t * 2.0, t * 19.0)), tx = p.x * 62.0, f = fract(tx) - 0.5;
  vec2 hh = hash22(floor(p * 42.0));
  col = mix(col, dtSun * 0.75 + col * 0.45, smoothstep(0.3, 1.0, cl) * smoothstep(0.02, 0.2, t) * dtDn(0.3, 0.65, t) * 0.5);
  col += 0.5 * dtNight * dtDn(0.0, 0.09, length(fract(p * 42.0) - 0.2 - 0.6 * hh)) * step(0.8, hh.x);
  col = mix(col, mix(dtAir, dtHighC, 0.4) * 0.85, dtIn(dtPx, t - 0.03 - 0.02 * sin(p.x * 3.1 + 1.0)));
  col = mix(col, dtAir * 0.5, 0.9 * dtIn(dtPx, t - (0.006 + 0.022 * hash11(floor(tx))) * sqrt(max(1.0 - 4.0 * f * f, 0.0))));
  if (t < 0.0) col = dtGround(p, max(-t, 1e-3));
  dtCov = -1.0;
  for (float i = 2.0; i > -0.5; i--) dtTower(p, i);
  vec3 brick = dtBrick();
  float near = dtOwn < 0.5 ? dtCov : 0.0;
  col = mix(dtWheel(mix(col, brick, dtCov - near), p), brick, near);
  p -= vec2(0.3, 0.02);
  return col + dtSun * 0.5 * uHits * exp(-45.0 * dot(p, p));
}
vec3 render(vec2 p) {
  dtPx = 1.0 / uRes.y;
  dtLift = 4.0 * uCue * (1.0 - uCue);
  dtNight = max(-uOwn[0], 0.0); dtDay = max(uOwn[0], 0.0); dtCold = max(-uOwn[5], 0.0); dtLush = max(uOwn[5], 0.0); dtMany = uOwn[3];
  dtMud = mix(vec3(0.5, 0.345, 0.215), uOwn[1] < 0.0 ? vec3(0.74, 0.7, 0.63) : vec3(0.42, 0.145, 0.07), abs(uOwn[1])) * mix(vec3(1.0), vec3(1.12, 0.98, 0.88), uPad);
  return screenOf((uVar < 0.5 ? dtInside(p) : dtField(p)) * (0.85 + 0.35 * uTone));
}
