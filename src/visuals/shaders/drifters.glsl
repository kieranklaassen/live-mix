// name: Drifters
// a: Night water
// b: Drawn plate
// what: Jellyfish in black-blue water lit from above: a striped one with ruffled arms, a moon bell, a glass bell, a small red one, and one so near that half of it is out of the picture, with far ones and crumbs drifting; or the same animals on cream paper in pen and pale wash, set out in order over a row of young ones.
// follows: Each kind of sound is one animal: it lights, or takes on colour, and strokes harder. Lows widen the bells, highs light beads on the tentacles, a hit runs down an arm, a cue turns the light. The far or young ones show the piece; travel lets all rise and sink. Keys play the glass bell, a voice the pad's; Tone warms the lamp, Space widens the tails.

float ss(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
// Five animals in the water and five on the plate: drone, pad, texture, phrase, hit.
// At: across, up, up in a tall picture, bend of tail. Size: size, lean, tip, height. Tail: hairs, their length, arms' length, width.
const vec4 DR_AT[10] = vec4[10](vec4(.76, .37, .04, .1), vec4(-.29, .2, -.22, -.14), vec4(.09, .32, -.05, .1), vec4(-.75, .17, .24, .1), vec4(.17, -.17, -.14, -.12),
  vec4(0., .215, -.02, 0.), vec4(-.56, .25, .14, 0.), vec4(.56, .25, .14, 0.), vec4(-.56, -.08, -.14, .08), vec4(.56, -.08, -.14, -.08));
const vec4 DR_SIZE[10] = vec4[10](vec4(.47, .34, -.42, .78), vec4(.195, -.3, -.32, .82), vec4(.08, .3, .55, .55), vec4(.055, .1, -.25, 1.2), vec4(.065, -.5, -.3, 1.15),
  vec4(.22, 0., -.28, .85), vec4(.13, .12, .5, .62), vec4(.145, 0., 1.3, .5), vec4(.084, .1, -.3, 1.2), vec4(.084, -.1, -.3, 1.2));
const vec4 DR_TAIL[10] = vec4[10](vec4(15., 2.2, 1.9, .22), vec4(15., 3.5, 3.1, .2), vec4(10., 1.4, 1., .15), vec4(8., 3.4, 0., .1), vec4(10., 4.2, 2.4, .22),
  vec4(15., 2.4, 2.4, .2), vec4(0., .5, 1.3, .22), vec4(0., .5, 0., .1), vec4(8., 3.2, 0., .1), vec4(10., 3., 1.9, .22));
const float DR_LAP[5] = float[5](16., 16., 16., 8., 12.);
// each one's colour in silence, and its markings
const vec3 DR_SELF[5] = vec3[5](vec3(.5, .64, .74), vec3(.92, .7, .46), vec3(.6, .66, .82), vec3(.62, .78, .78), vec3(.82, .4, .3));
const vec3 DR_MARK[5] = vec3[5](vec3(.34, .3, .5), vec3(.78, .22, .07), vec3(.8, .5, .62), vec3(.9, .8, .5), vec3(.75, .1, .06));

int drK;
float drPx, drLv, drR, drH, drLap, drSpin, drS, drX, drLate, drCut, drC, drSn;
vec4 drSh, drTl;
vec2 drQ;
float drInk;
vec3 drWashed;

// One stroke in ten seconds: quick in, slow out.
float drBeat(float s, float ph) {
  float f = fract(s / 10. + ph);
  return ss(0., .17, f) * (1. - ss(.15, .8, f));
}
// A line of half width w, never thinner than the screen can show: it pales instead.
float drLine(float d, float w) { float v = max(w, .6 * drPx); return ss(v + .6 * drPx, v - .6 * drPx, d) * w / v; }
float drB(float x) { x = max(1. - .25 * x * x, 0.); x *= x; return x * x; } // a soft bump
void drPut(float ink) { drInk = max(drInk, ink); }
void drWash(vec3 c, float amount) { drWashed += (c - 1.) * amount; }

// In a tall picture two of the small ones step aside.
float drAside(int k) { return k == 3 ? .07 : k == 2 ? -.09 : 0.; }
// Takes animal k in hand at p.
void drTake(vec2 p, int k, int row, float fx, float high, float px) {
  vec4 at = DR_AT[k + row];
  drSh = DR_SIZE[k + row]; drTl = DR_TAIL[k + row]; drLap = DR_LAP[k]; drK = k;
  float fk = float(k), size = drSh.x * (1. - (row > 0 && k > 0 || row + k == 0 ? .5 : .36) * high);
  vec2 c = vec2(at.x * fx + (row > 0 ? 0. : drAside(k) * high), at.y + at.z * high) + (row > 0 ? .15 : 1.) * vec2(.02 * sin(uTime * .031 + fk), .025 * sin(uTravel * .09 + fk * 2.1));
  drPx = px / size;
  drQ = rot(drSh.y) * (p - c) / size;
  drS = max(.1 - drQ.y, 0.);
  // the tail hangs where the animal has been: one long bend
  drX = drQ.x - (at.w + .05 * sin(uTime * .11 + fk * 2.)) * drS * drS * .5 - .05 * drS * sin(uTime * .17 + fk - drS * .8);
  float ph = fk * .37 + .1, amp = .55 + .45 * (k == 4 ? 4. * drLv * (1. - drLv) : drLv), cc = drBeat(uTime, ph) * amp;
  drR = 1. - .17 * cc + .06 * uLow; drH = drSh.w * (1. + .16 * cc - .06 * uLow);
  drCut = .07 - .34 * cc * drSh.w; drC = cos(drSh.z); drSn = sin(drSh.z);
  drSpin = fk + (row > 0 ? .03 : .5) * sin(uTime * .03);
  drLate = drBeat(uTime - drS * 1.1, ph) * amp;
}
// A ruffled arm at x from its middle, s down it: how dense, how folded, how far outside its frill.
vec3 drRuffle(float x, float s, float w, float seed) {
  float side = x < 0. ? 2.1 : 0., u = abs(x) / w, pu = drPx / w;
  float n = .5 + .5 * sin(s * 4.3 - uTime * .1 + seed * 7. + side * 3. + 2. * sin(s * 2.1 + seed)), n2 = noise(vec2(s * 8. - uTime * .12 + 2e3, x / w * 1.3 + seed * 5. + 20.));
  float fr = s * 14. - uTime * .35 + seed + side + n * 4.;
  float e = .58 + (.14 + .2 * n) * sin(fr) + .11 * sin(fr * 2.3 + n2 * 3.);
  float f1 = .5 + .5 * sin(u * 5. - s * 17. + n2 * 5. + seed), f2 = .5 + .5 * sin(u * 3. + s * 11. - n2 * 7. + seed * 2.);
  return vec3(ss(e + pu, e - pu, u), f1 * f1 * f1 * .7 + f2 * f2 * f2 * f2 * .5, (u - e) * w);
}
// Four rings inside a moon bell.
float drRings(vec2 b) {
  vec2 g = rot(drSpin) * vec2(b.x, b.y * drSn + drC * (b.y * drC - .3 * drH) / max(drSn, .1));
  g = abs(g); g = vec2(g.x + g.y, abs(g.x - g.y)) * .7071 - vec2(.3, 0.); // four quarters folded on one
  return abs(length(g) - .14) + .4 * max(g.x - .07, 0.);
}
// Dots of a pen.
float drStipple(vec2 p, float dark, float px) {
  float sc = 1. / max(1. / 260., 2.6 * px);
  vec2 g = p * sc + 300., h = hash22(floor(g));
  float r = .34 * sqrt(sat(dark)) * (.6 + .5 * h.x) * step(h.y, dark * 1.5 + .05);
  return ss(r + px * sc, r - px * sc, length(fract(g) - .5 - (h - .5) * .7)) * ss(0., .15, r);
}

// One animal: in the water light over col, on the plate ink and wash.
vec3 drAnimal(vec3 col, vec2 p, bool plate, vec3 lamp, vec2 ldir, float px, float fade) {
  float fk = float(drK), size = px / drPx, pen = max(.00095 / size, .45 * drPx), wet = .5 + .75 * drLv * (.6 + uEnergy), lit = .85 + (.4 + uEnergy) * drLv;
  vec3 self = DR_SELF[drK], mark = DR_MARK[drK], kind = uKind[drK], tint, front = vec3(0.), arms = vec3(0.);
  vec3 pale = mix(vec3(.8), kind / max(max(kind.r, max(kind.g, kind.b)), .1), .62) * vec3(.97, .93, .88);
  if (plate) {
    self = drK == 0 ? vec3(.9, .7, .5) : mix(self, vec3(.95, .86, .72), .35);
    mark = mix(mark, vec3(.75, .46, .3), drK == 0 ? .7 : .35);
    tint = mix(self, pale, .8 * drLv); mark = mix(mark, .65 * mark + .35 * pale, .6 * drLv);
  } else { kind *= kind; tint = mix(self, self * .3 + kind * 1.5, .55 * drLv); mark = mix(mark, mark * .6 + kind * .5, .45 * drLv); }
  vec2 L = rot(drSh.y) * (plate ? vec2(-.6, .8) : ldir);
  // hair-thin tentacles from all round the hem
  float thin = plate ? .02 : .0016 / drSh.x + .004, side = drR * drSn * .97, root = drCut * drC, wide = 1. - .17 * drLate + .06 * uLow, sway = .13 + .08 * uSpace, i = 0.;
  vec2 cs = vec2(cos(drSpin), sin(drSpin));
  mat2 turn = rot(2.4);
  float hairs = abs(drX) < 1.25 && drQ.y < .45 && drQ.y > -drTl.y - .4 ? drTl.x : 0.;
  if (hairs > 0.) do {
    float h = fract(i * .618 + fk * .29), st = root + side * cs.y - drQ.y, g = sat(st / (drTl.y * (.4 + .6 * h))), A = (.5 + h) * sway * g, hi = band(.55 + .45 * h);
    vec2 a = vec2(st * (3. + h) - uTime * .42, st * 7.5 - uTime * .8 + h * 50.) + h * 40., sn = sin(a);
    float d = abs(drX - cs.x * wide * (.95 + .12 * min(st * 2., 1.) - .5 * g * g) - A * sn.x - .022 * g * sn.y) / length(vec2(1., A * (3. + h) * cos(a.x) + .12 * g));
    float w = thin * ((1. - g) * (1. - .7 * g) + .14), on = ss(0., .07, st) * step(g, .999), line = drLine(d, plate ? max(w, pen) : w) * on;
    float b = .5 + .5 * cos(st * 30. + 9. * h + 2. * sn.y); b *= b; b *= b; b *= b * (1. - g) * on * drB(d / (1.4 * w + drPx)); // beads
    if (plate) {
      float c = mix(drLine(abs(d - w), pen * .8) * on, line, ss(.35, .6, g)) * (1. - .6 * g) + b * sat(.08 + 1.4 * hi); // two lines that run into one
      drPut(c * (cs.y < 0. ? .85 : .5));
      drWash(tint, .7 * wet * line * (1. - g));
    } else {
      vec3 e = (tint * line * .6 * lit / (1. + .4 * st) + (.5 + .5 * tint) * b * (.02 + .7 * hi)) * fade;
      if (cs.y < 0.) front += e; else col += e * .6 * lamp;
    }
    cs = turn * cs;
  } while (++i < hairs);
  // the bell: an egg cut off at its hem; first its far wall, then its near one
  vec2 b = vec2(drQ.x / (1. + drC * (.06 - .12 * ss(-.1, drSh.w * .8, drQ.y))), drQ.y); // it flares a little
  float iR = 1. / (drR * drR), iH = 1. / (drH * drH), hp = sqrt(drR * drR * drSn * drSn + drH * drH * drC * drC);
  float rim = (1. - length(b / vec2(drR, hp))) * min(drR, hp), ins = ss(-drPx, drPx, rim);
  float qa = drC * drC * iR + drSn * drSn * iH, qb = b.y * drC * drSn * (iR - iH), qc = b.x * b.x * iR + b.y * b.y * (drSn * drSn * iR + drC * drC * iH) - 1.;
  float far = sqrt(max(qb * qb - qa * qc, 0.)), s2 = .45 * drH - drQ.y, red = 0., flesh = 0., bare = 1., lines = 0.;
  bool inArms = s2 > 0. && s2 < drTl.z && abs(drX) < .75, inBell = rim > -2. * drPx - 3. * pen;
  vec3 V = vec3(0., -drSn, drC);
  float run = uHits * drB((drS - .35 - (1. - uHits) * drTl.z * .8) / .3);
  if (inArms) {
    i = 0.;
    do {
      float g = sat(s2 / (drTl.z * (.7 + .1 * i))), a = i * PI * .5 + .6 + fk, seed = i * 1.7 + fk;
      float x = drX - cos(a) * (.1 + .24 * g) * (1. - .2 * drLate) - .16 * g * sin(s2 * 2. - uTime * .31 + seed);
      float w = drTl.w * (.35 + .65 * ss(0., .35, g)) * sqrt(1. - g) * (1. - .5 * g) + .004;
      vec3 r = drRuffle(x, s2, w, seed);
      float at = ss(0., .2, s2) * step(g, .999), frill = drB(r.z / max(.085 * w, drPx)) * min(1., .3 * w / drPx) * at;
      r.x *= at;
      bare *= 1. - .9 * r.x;
      lines = max(lines * (1. - .9 * r.x), at * drLine(abs(r.z), pen) * .85 + r.x * ss(.3, .8, r.y) * .28);
      flesh = max(flesh, r.x * (.3 + .7 * r.y) * (1. - .5 * g));
      red = max(red, r.x * run);
      arms += (mix(tint, mark, .5) * r.x * (.08 + .5 * r.y) + (tint + .2) * frill * .42) * (.75 - .25 * sin(a)) * lit / (1. + .4 * drS);
      arms += (tint * .6 + uKind[4] * .7) * run * (drK == 1 || drK == 4 ? 1. : .25) * (r.x * .5 + frill) * .9;
    } while (++i < 4.);
  }
  int j = inBell ? 0 : 1;
  do {
    bool nigh = j == 1;
    if (nigh) {
      drWash(mix(tint, mark, .6), flesh * wet * .9 * (1. - red));
      drInk = max(drInk * bare, lines) * (1. - .5 * red);
      col = col * (1. - .75 * sat(dot(arms, vec3(.6)))) + arms * lamp;
    }
    vec3 P = vec3(b.x, b.y * drC, b.y * drSn) + V * ((nigh ? -qb - far : far - qb) / qa);
    float phi = atan(P.z, P.x + 1e-5) + drSpin, rho = length(P.xz), cl = rho / drR;
    vec3 n = normalize(P * vec3(iR, iH, iR) + vec3(0., 1e-5, 0.));
    float nv = dot(n, V), av = abs(nv), lim = 1. - av, sv = nv < 0. ? min(nv, -.02) : max(nv, .02);
    n = vec3(n.x, n.y * drC + n.z * drSn, nv); // as the screen sees it
    float above = P.y - drCut + .07 * abs(cos(phi * drLap * .5));
    float hem = above / clamp(length(vec2(drSn * n.x, drC * sv + drSn * n.y) / sv), .3, 20.); // on the screen
    float on = inBell ? ins * ss(-drPx, drPx, hem) : 0., up = sat(.5 + .5 * dot(n.xy, L)), sh = sat(.55 - .65 * dot(n.xy, L)), tone = nigh ? 1. : .5;
    // its pattern: V marks, canals, a cross or a deep crown
    float tri = abs(fract(phi * drLap / TAU) - .5) * 2., can = drB(sin(phi * drLap * .5) / .2), pat;
    if (drK < 2) pat = ss(.2, .07, abs(tri - .06 - .8 * max(cl - .28, 0.))) * ss(.24, .42, cl) + ss(.22, .12, cl);
    else if (drK == 2) pat = can * .4 * ss(.35, .7, cl);
    else if (drK == 3) pat = drB(sin(phi * 2.) / .07) * .8;
    else pat = ss(.85, .15, cl) + .5 * can * ss(.8, 1., cl);
    float ring = drK == 2 && nigh ? drRings(b) : 9.;
    if (plate) {
      // meridians, lifted off before the crown; m is how long a step round is on the screen
      vec3 M = vec3(-P.xz * P.y * drR * drR * iH, rho * rho).xzy;
      float m = rho * av * length(M) / max(length(vec2(M.x, M.y * drC + M.z * drSn)), 1e-4) * TAU / drLap;
      float f = phi * drLap * 2. / TAU, lift = fract(floor(f) * .618) * .3, f2 = phi * drLap * .5 / TAU;
      float c = drLine((.5 - abs(fract(f) - .5)) * .5 * m, pen * .6) * ss(.35 + lift, .85 + .3 * lift, cl) * (.35 + .5 * sh);
      c += drLine((.5 - abs(fract(f2) - .5)) * 2. * m, pen * .8) * ss(.1, .3, cl) * .6;
      c += drLine(abs(hem - .09), pen * .6) * .45 + drLine(abs(hem), pen * 1.3);
      c += drStipple(p, .8 * sh * sh * ss(1., .3, hem) + .25 * pat * tone, px) * .85 + drLine(abs(ring - .03), pen * .8) * .8;
      drInk = mix(drInk, drInk * (nigh ? .25 : .4), on);
      drPut(sat(c) * on * tone);
      drPut(drLine(abs(rim), pen * (1.1 + 1.3 * sh)) * ss(-drPx, drPx, above) * (.2 + .8 * tone) * float(inBell));
      float pool = .65 + .7 * noise(p * 16. + 30.), tide = drB((min(rim, hem) - .015) / .03);
      drWash(tint, on * wet * pool * (.25 + .35 * sh + .4 * tide) * (.3 + .7 * tone));
      drWash(mark, on * wet * (pool * pat * .8 * tone + drB(ring / .04)));
    } else {
      float light = .1 + 1.05 * up * up * up, l3 = lim * lim * lim;
      float grit = noise(vec2(phi * 12. + 60., cl * 19.));
      pat *= .65 + .35 * grit;
      float st = (.5 + .5 * sin(phi * drLap * 4.)) * ss(.3, .9, cl);
      float lip = drB(hem / (.018 + drPx)) + .35 * drB((hem - .1) / .03), gel = drB((rim - .075) / .018) * .35 * up; // the inner face of the thick jelly
      float body = .022 + .05 * st + .05 * grit * grit + .05 / (av + .18);
      vec3 e = tint * (body * light + (.85 * l3 + gel) * (.2 + .8 * up)) + mark * pat * .42 * (.25 + .75 * light) + (tint + .1) * lip * .24;
      e += mark * (.45 * drB(ring / .028) + .12 * drB(ring / .1));
      col = mix(col, col * exp(-(.35 * pat + 2. * body)) + e * lit * (.3 + .7 * tone) * lamp, on);
    }
  } while (++j < 2);
  drWash(vec3(.95, .3, .24), red * 1.5);
  return col + front * lamp;
}
// Crumbs sinking past.
float drSnow(vec2 p, float px, float i) {
  float sc = 4. + i * 5.;
  vec2 g = mod(p * sc + vec2(64. + .3 * sin(uTime * .05 + i * 2. + p.y), uTravel * (.1 - .02 * i) + i * 7.3 + 64.), 256.);
  vec2 h = hash22(floor(g) + i * 31.), o = rot(h.x * 6.) * (fract(g) - .5 - (h - .5) * (i < .5 ? .4 : .7));
  float hs = fract(h.x * 13.7 + h.y * 5.1);
  float r = i < .5 ? .08 + .08 * step(.93, hs) : .01 + .026 * hs * hs, soft = i < .5 ? r * .9 : r * .5 + px * sc;
  return ss(r + soft, r - soft, length(o * vec2(1., .75 + .9 * h.y))) * step(i < .5 ? .8 : .4, h.y) * (i < .5 ? .012 : .04 + .2 * hs * hs);
}
// Eight small far ones, each lit by one place of the piece.
vec3 drFar(vec2 p, float fx, float px) {
  float u = (clamp(floor(p.x / (1.8 * fx) * 8. + 4.), 0., 7.) + .5) / 8., h = fract(u * 8. * .618 + .21), rise = fract(u * 8. * .382 + uTravel * (.004 + .003 * h)), r = (.011 + .013 * fract(h * 5.3)) * min(fx, 1.);
  vec2 q = rot(.5 * sin(u * 19.)) * (p - vec2((u - .5) * 1.8 * fx + .03 * fx * sin(uTime * .05 + u * 8.), rise * 1.3 - .65)) / r;
  float cc = drBeat(uTime, h), R = 1. - .2 * cc, pq = px / r, d = length(q / vec2(R, .8 + .15 * cc));
  float dome = ss(1. + pq, 1. - pq, d) * ss(-.25 - pq, -.25 + pq, q.y);
  float s = max(-q.y, 0.), x = q.x - .12 * s * sin(uTime * .3 + u * 8. - s * .7);
  drPx = pq;
  float hairs = (drLine(abs(abs(x) - .8 * R + .1 * s), .05) + drLine(abs(abs(x - .1 * sin(s * 2.)) - .2), .08 - .015 * s)) * ss(0., .4, s) * ss(5., 1., s);
  return (vec3(.25, .4, .5) + piece(vec2(u, .15 + .7 * h)).rgb * 2.5) * ss(0., .15, rise) * ss(1., .85, rise) * (dome * (.1 + .9 * d * d * d * d * d) + .3 * hairs) * .32;
}
// Young ones on the plate, bud to star, each at one place of the piece.
void drYoung(vec2 p, float fx, float px) {
  float i = clamp(floor(p.x / (.17 * fx) + .5), -3., 3.), age = (i + 3.) / 6., u = (i + 3.5) / 7.;
  float r = (.011 + .014 * age) * (.75 + .25 * fx) * (1. - .1 * drBeat(uTime, u * .6));
  vec2 q = (p - vec2(i * .17 * fx, -.415)) / r;
  float l = length(q), a = atan(q.y, q.x + 1e-5) + i * .4;
  drPx = px / r;
  float edge = 1. - (.15 + .45 * age) * (1. - ss(.2, .6, .5 + .5 * cos(a * 8.))), d = (edge - l) * (.85 - .25 * age);
  float c = drLine(abs(d), .045) + .7 * drLine(abs(l - .26), .035) + .5 * drLine(abs(sin(a * 4.)) * l * .25, .03) * step(.3, l) * ss(0., .1, d);
  drPut(sat(c) * .85);
  vec4 m = piece(vec2(u, .84)) + piece(vec2(u, .55)) + piece(vec2(u, .25));
  float here = 1. - abs(fract(u - uLoop + .5) - .5) * 7.; // the place now playing is wettest
  drWash(mix(vec3(.9, .78, .6), mix(vec3(.85, .8, .7), m.rgb / max(max(m.r, max(m.g, m.b)), .1), .6), sat(m.a * 1.5)), ss(-drPx, drPx, d) * (.5 + .8 * sat(m.a) + .6 * ss(0., .8, here)));
}

float drBest, drNext;
int drWho;
vec3 drGlow;
// Is this place nearer to animal k of the water, whose bounds are an egg at off from it, as large as r?
void drTry(vec2 p, int k, vec4 at, float size, float lv, vec2 off, vec2 r, float lean, float fx, float high) {
  float f = 1. - .36 * high;
  vec2 q = p - vec2(at.x * fx + drAside(k) * high, at.y + at.z * high), g = q / size - vec2(0., .2);
  drGlow += uKind[k] * uKind[k] * lv * (.06 + .22 * uEnergy) * drB(1.26 * length(g));
  q -= off * f;
  float d = length(vec2(q.x - lean * q.y, q.y) / r) / f;
  if (d < drBest) { drNext = drBest; drBest = d; drWho = k; } else drNext = min(drNext, d);
}

vec3 render(vec2 p) {
  float lv[5] = float[5](uDrone, max(uPad, .8 * uMic), uTexture, max(uPhrase, uKeys), uHits);
  float px = 1. / uRes.y, asp = .5 * uRes.x / uRes.y, fx = clamp(asp / .86, .33, 1.35), high = ss(.85, .35, asp);
  bool plate = uVar > .5;
  drInk = 0.; drLv = 0.; drWashed = vec3(0.); drBest = 9.; drNext = 9.; drGlow = vec3(0.); drWho = 0;
  // the water: lit from above, and a cue turns that light
  vec2 src = vec2(-.3 * fx + .1 * sin(uTime * .02) + 1.4 * uCue * (1. - uCue), .95), to = p - src;
  float dl = length(to), ang = atan(to.x, .3 - to.y), lampI = .85 + .45 * uLevel + .9 * uCue;
  float shaft = noise(vec2(ang * 7. + .04 * uTime + 50., 3.)) * .6 + noise(vec2(ang * 19. - .06 * uTime + 2e3, 9.)) * .4;
  vec3 lamp = mix(vec3(.72, .9, 1.08), vec3(1.05, .97, .86), .35 + .4 * uTone) * lampI * (.4 + 1.9 * exp(-dl * 1.1));
  vec3 col = vec3(.0012, .0028, .008) + vec3(.018, .085, .21) * exp(-dl * dl * 2.6) * (.25 + (1.1 + uMic) * shaft * shaft) * lampI;
  if (plate) {
    // which animal's place on the sheet this is
    drWho = abs(p.x / fx) < .34 || (asp < .42 && abs(p.y - .09) < .23) ? 0 : (p.x < 0. ? 1 : 2) + (p.y < .07 ? 2 : 0);
  } else {
    col += (drFar(p, fx, px) + (drSnow(p, px, 0.) + drSnow(p, px, 1.) + drSnow(p, px, 2.)) * .7) * lamp;
    drTry(p, 0, DR_AT[0], DR_SIZE[0].x, lv[0], vec2(.1, -.35), vec2(.62, .9), -.2, fx, high);
    drTry(p, 1, DR_AT[1], DR_SIZE[1].x, lv[1], vec2(-.11, -.2), vec2(.3, .5), .4, fx, high);
    drTry(p, 2, DR_AT[2], DR_SIZE[2].x, lv[2], vec2(.02, -.03), vec2(.15, .15), 0., fx, high);
    drTry(p, 3, DR_AT[3], DR_SIZE[3].x, lv[3], vec2(.01, -.07), vec2(.1, .19), 0., fx, high);
    drTry(p, 4, DR_AT[4], DR_SIZE[4].x, lv[4], vec2(-.08, -.1), vec2(.14, .22), .5, fx, high);
  }
  drLv = lv[drWho];
  drTake(p, drWho, plate ? 5 : 0, fx, high, px);
  col += drGlow * lamp;
  col = drAnimal(col, p, plate, drWho == 0 ? lamp * .95 : lamp * 1.1, normalize(vec2(src.x - p.x, .9)), px, ss(0., .08, drNext - drBest));
  if (!plate) return screenOf(col * 1.2);
  drYoung(p, fx, px);
  float fibre = noise(p * vec2(90., 240.) + 500.) * .5 + noise(p * 420. + 900.) * .5;
  vec3 paper = vec3(.95, .91, .81) * (.975 + .03 * fibre) - vec3(.02, .035, .06) * noise(p * 2.3 + 9.);
  // a window's light across the sheet; a cue lets it travel over and shows the tooth of the paper
  float lie = dot(p, vec2(.8, .6));
  paper *= 1. - .1 * ss(-.1, .9, lie + .15 * sin(uTime * .03));
  paper *= 1. + uCue * (.11 * drB((lie + .9 - 1.8 * (1. - uCue)) / .28) - .07 + .1 * (fibre - .5));
  drPx = px;
  vec2 fr = abs(p) - vec2(asp, .5) + .03;
  drPut(drLine(abs(max(fr.x, fr.y)), .001) * .8);
  return mix(paper * exp(drWashed), vec3(.17, .125, .11), sat(drInk) * (.8 + .2 * fibre));
}
