// name: Drifters
// a: Night water
// b: Drawn plate
// what: Jellyfish in black-blue water lit from above: a striped one with ruffled arms, a moon bell, a glass bell, a small red one, and one so near that half of it is out of the picture, with far ones and crumbs drifting; or the same animals on cream paper in pen and pale wash, set out in order over a row of young ones.
// follows: Each kind of sound is one animal: it lights, or takes on colour, and strokes harder. Lows widen the bells, highs light beads on the tentacles, a hit runs down an arm, a cue turns the light. The far or young ones show the piece; travel lets all rise and sink. Keys play the glass bell, a voice the pad's; Tone warms the lamp, Space widens the tails.
// own: 0 1 one great animal and the rest small about it, -1 five of a size in a row; 1 bells tall as thimbles, -1 flat as dishes; 2 1 seen from above, tentacles out all round like rays, -1 tipped, hems cut deep into petals; 3 1 long tails and great ruffles, -1 hardly any tail; 4 the ground: 1 pale bright water (b: a sheet washed with colour), -1 a sand floor with shadows (b: pale ink on a dark sheet); 5 1 drawn all in dots, -1 solid bodies lit from one side (b: flat paint); 6 1 a great swarm of small ones (b: the sheet full of young stars), -1 none, and no crumbs (b: no young, no frame); 7 1 upside down, -1 all swept sideways

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
const vec3 DR_SELF[5] = vec3[5](vec3(.5, .64, .74), vec3(.92, .7, .46), vec3(.6, .66, .82), vec3(.62, .78, .78), vec3(.82, .4, .3));
const vec3 DR_MARK[5] = vec3[5](vec3(.34, .3, .5), vec3(.78, .22, .07), vec3(.8, .5, .62), vec3(.9, .8, .5), vec3(.75, .1, .06));

// when one is great, and in a row
const vec3 DR_ONE[10] = vec3[10](vec3(.69, .31, .06), vec3(-.03, .19, .33), vec3(.5, .02, .05), vec3(-.68, .24, .05), vec3(.62, -.3, .05),
  vec3(0., .16, .3), vec3(-.68, .28, .085), vec3(.68, .28, .085), vec3(-.68, -.06, .07), vec3(.68, -.06, .07));
const vec3 DR_ROW[10] = vec3[10](vec3(.64, .17, .13), vec3(-.36, .04, .135), vec3(-.03, .27, .115), vec3(-.69, .21, .115), vec3(.3, .01, .12),
  vec3(0., .12, .12), vec3(-.35, .12, .12), vec3(.35, .12, .12), vec3(-.69, .12, .12), vec3(.69, .12, .12));
vec4 drAt(int i) {
  vec4 a = DR_AT[i];
  if (uOwn[0] > 0.) a.xy = mix(a.xy, DR_ONE[i].xy, uOwn[0]);
  if (uOwn[0] < 0.) a.xyz = mix(a.xyz, vec3(DR_ROW[i].xy, 0.), -uOwn[0]);
  if (uOwn[1] > 0.) a.y -= .07 * uOwn[1];
  if (uOwn[7] > 0.) a.yz = mix(a.yz, vec2(i > 4 ? .07 : -.04, 0.) - a.yz, uOwn[7]);
  return a;
}
vec4 drSize(int i) {
  vec4 s = DR_SIZE[i];
  if (uOwn[0] > 0.) s.x = mix(s.x, DR_ONE[i].z, uOwn[0]);
  if (uOwn[0] < 0.) s.x = mix(s.x, DR_ROW[i].z, -uOwn[0]);
  s.y = mix(s.y + PI * max(uOwn[7], 0.), -1.25 + .15 * sin(float(i) * 2.), max(-uOwn[7], 0.));
  s.z = mix(s.z, 1.2 + .15 * sin(float(i) * 2.4), max(uOwn[2], 0.));
  s.z = mix(s.z, .85, max(-uOwn[2], 0.));
  s.w *= exp2((uOwn[1] > 0. ? .95 : 1.3) * uOwn[1]);
  return s;
}

int drK;
float drPx, drLv, drR, drH, drLap, drSpin, drS, drX, drLate, drCut, drC, drSn;
vec4 drSh, drTl;
vec2 drQ;
float drInk, drShade;
vec3 drWashed;

float drBeat(float s, float ph) {
  float f = fract(s / 10. + ph);
  return ss(0., .17, f) * (1. - ss(.15, .8, f));
}
float drLine(float d, float w) { float v = max(w, .6 * drPx); return ss(v + .6 * drPx, v - .6 * drPx, d) * w / v; }
float drB(float x) { x = max(1. - .25 * x * x, 0.); x *= x; return x * x; }
void drPut(float ink) { drInk = max(drInk, ink); }
void drWash(vec3 c, float amount) { drWashed += (c - 1.) * amount; }

float drAside(int k) { return k == 3 ? .07 : k == 2 ? -.09 : 0.; }
void drTake(vec2 p, int k, int row, float fx, float high, float px) {
  vec4 at = drAt(k + row);
  drSh = drSize(k + row); drTl = DR_TAIL[k + row]; drLap = DR_LAP[k]; drK = k;
  if (uOwn[3] > 0.) drTl.yzw *= 1. + vec3(.5, .9, 1.1) * uOwn[3];
  if (uOwn[3] < 0.) drTl.yz *= 1. + vec2(.86, .84) * uOwn[3];
  if (uOwn[2] > 0.) drTl.yz *= 1. - vec2(.5, .8) * uOwn[2];
  float fk = float(k), size = drSh.x * (1. - (row > 0 && k > 0 || row + k == 0 ? .5 : .36) * high);
  vec2 c = vec2(at.x * fx + (row > 0 ? 0. : drAside(k) * high), at.y + at.z * high) + (row > 0 ? .15 : 1.) * vec2(.02 * sin(uTime * .031 + fk), .025 * sin(uTravel * .09 + fk * 2.1));
  drPx = px / size;
  drQ = rot(drSh.y) * (p - c) / size;
  drS = max(.1 - drQ.y, 0.);
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
float drRings(vec2 b) {
  vec2 g = rot(drSpin) * vec2(b.x, b.y * drSn + drC * (b.y * drC - .3 * drH) / max(drSn, .1));
  g = abs(g); g = vec2(g.x + g.y, abs(g.x - g.y)) * .7071 - vec2(.3, 0.);
  return abs(length(g) - .14) + .4 * max(g.x - .07, 0.);
}
float drStipple(vec2 p, float dark, float px) {
  float sc = 1. / max(1. / 260., 2.6 * px);
  vec2 g = p * sc + 300., h = hash22(floor(g));
  float r = .34 * sqrt(sat(dark)) * (.6 + .5 * h.x) * step(h.y, dark * 1.5 + .05);
  return ss(r + px * sc, r - px * sc, length(fract(g) - .5 - (h - .5) * .7)) * ss(0., .15, r);
}

// One animal: in the water light over col, on the plate ink and wash.
vec3 drAnimal(vec3 col, vec2 p, bool plate, vec3 lamp, vec2 ldir, float px, float fade) {
  float rays = max(uOwn[2], 0.), petal = max(-uOwn[2], 0.), wire = max(uOwn[5], 0.), solid = max(-uOwn[5], 0.), fk = float(drK), size = px / drPx, pen = max(.00095 / size, .45 * drPx), wet = .5 + .75 * drLv * (.6 + uEnergy), lit = .85 + (.4 + uEnergy) * drLv;
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
  float hairs = abs(drX) < 1.25 + 2. * rays && drQ.y < .45 + 3. * rays && (rays < 1. || length(drQ) > .75) && drQ.y > -drTl.y - .4 ? drTl.x : 0.;
  if (hairs > 0.) do {
    float h = fract(i * .618 + fk * .29), st = mix(root + side * cs.y - drQ.y, dot(drQ, cs) - .93 * drR, rays), g = sat(st / (drTl.y * (.4 + .6 * h))), A = (.5 + h) * sway * g, hi = band(.55 + .45 * h);
    vec2 a = vec2(st * (3. + h) - uTime * .42, st * 7.5 - uTime * .8 + h * 50.) + h * 40., sn = sin(a);
    float d = abs(mix(drX - cs.x * wide * (.95 + .12 * min(st * 2., 1.) - .5 * g * g), dot(drQ, vec2(-cs.y, cs.x)) - .16 * st * st, rays) - A * sn.x - .022 * g * sn.y) / length(vec2(1., A * (3. + h) * cos(a.x) + .12 * g));
    float w = thin * ((1. - g) * (1. - .7 * g) + .14), on = ss(0., .07, st) * step(g, .999), line = drLine(d, plate ? max(w, pen) : w) * on;
    float b = .5 + .5 * cos(st * 30. + 9. * h + 2. * sn.y); b *= b; b *= b; b *= b * (1. - g) * on * drB(d / (1.4 * w + drPx));
    if (solid > 0.) line = mix(line, drLine(d, w * 2.2) * on, solid);
    if (plate) {
      if (wire > 0.) line *= 1. - .8 * wire * step(.3, fract(st * 14. + h));
      float c = mix(drLine(abs(d - w), pen * .8) * on, line, ss(.35, .6, g)) * (1. - .6 * g) + b * sat(.08 + 1.4 * hi);
      drPut(c * (cs.y < 0. ? .85 : .5));
      drWash(tint, .7 * wet * line * (1. - g));
    } else {
      if (wire > 0.) { line *= 1. - .85 * wire; b *= 1. + 4. * wire; }
      vec3 e = (tint * line * .6 * lit / (1. + .4 * st) + (.5 + .5 * tint) * b * (.02 + .7 * hi)) * fade;
      if (cs.y < 0.) front += e; else col += e * .6 * lamp;
    }
    cs = turn * cs;
  } while (++i < hairs);
  // the bell: an egg cut off at its hem; first its far wall, then its near one
  vec2 b = vec2(drQ.x / (1. + drC * (.06 - .12 * ss(-.1, drSh.w * .8, drQ.y))), drQ.y);
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
      if (wire > 0.) { r.x *= 1. - .9 * wire; frill *= 1. + wire * (1.6 * drB(sin(s2 * 34. + i) / .55) - 1.); }
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
    n = vec3(n.x, n.y * drC + n.z * drSn, nv);
    float above = P.y - drCut + .07 * abs(cos(phi * drLap * .5));
    if (petal > 0.) above += petal * (1.05 * abs(cos(phi * drLap * .25)) - .8) * drH;
    float hem = above / clamp(length(vec2(drSn * n.x, drC * sv + drSn * n.y) / sv), .3, 20.);
    float on = inBell ? ins * ss(-drPx, drPx, hem) : 0., up = sat(.5 + .5 * dot(n.xy, L)), sh = sat(.55 - .65 * dot(n.xy, L)), tone = nigh ? 1. : .5;
    float tri = abs(fract(phi * drLap / TAU) - .5) * 2., can = drB(sin(phi * drLap * .5) / .2), pat;
    if (drK < 2) pat = ss(.2, .07, abs(tri - .06 - .8 * max(cl - .28, 0.))) * ss(.24, .42, cl) + ss(.22, .12, cl);
    else if (drK == 2) pat = can * .4 * ss(.35, .7, cl);
    else if (drK == 3) pat = drB(sin(phi * 2.) / .07) * .8;
    else pat = ss(.85, .15, cl) + .5 * can * ss(.8, 1., cl);
    float ring = (drK == 2 || rays > .5 && drK == 1) && nigh ? drRings(b) : 9.;
    if (plate) {
      vec3 M = vec3(-P.xz * P.y * drR * drR * iH, rho * rho).xzy;
      float m = rho * av * length(M) / max(length(vec2(M.x, M.y * drC + M.z * drSn)), 1e-4) * TAU / drLap;
      float f = phi * drLap * 2. / TAU, lift = fract(floor(f) * .618) * .3, f2 = phi * drLap * .5 / TAU;
      float c = drLine((.5 - abs(fract(f) - .5)) * .5 * m, pen * .6) * ss(.35 + lift, .85 + .3 * lift, cl) * (.35 + .5 * sh);
      c += drLine((.5 - abs(fract(f2) - .5)) * 2. * m, pen * .8) * ss(.1, .3, cl) * .6;
      c += drLine(abs(hem - .09), pen * .6) * .45 + drLine(abs(hem), pen * 1.3);
      c += drStipple(p, .8 * sh * sh * ss(1., .3, hem) + .25 * pat * tone, px) * .85 + drLine(abs(ring - .03), pen * .8) * .8;
      if (wire > 0.) c = mix(c, .9 * drStipple(p * .5, sat(.12 + sh * sh + pat * .6 + .5 * lim), px * .5), wire);
      drInk = mix(drInk, drInk * (nigh ? .25 : .4), on);
      drPut(sat(c) * on * tone);
      drPut(drLine(abs(rim), pen * (1.1 + 1.3 * sh)) * ss(-drPx, drPx, above) * (.2 + .8 * tone) * float(inBell));
      float pool = .65 + .7 * noise(p * 16. + 30.), tide = drB((min(rim, hem) - .015) / .03);
      if (solid > 0.) drWash(mix(tint, mark, .75 * pat), on * solid * (.6 + wet) * (1.2 + sh) * tone * pool);
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
      if (wire > 0.) {
        float dt = drB(sin(phi * drLap * .5) / .16) * drB(sin(cl * 19.) / .55) * ss(.1, .3, cl) + drB(hem / .035) * drB(sin(phi * drLap) / .5) + .5 * drB(ring / .03);
        e = mix(e, mix(tint, vec3(.8), .15) * (dt * .6 + .08 * l3), wire);
        pat *= 1. - wire; body *= 1. - wire;
      }
      if (solid > 0.) {
        float wrap = sat(.5 + .55 * dot(n.xy, L) + .25 * av);
        vec3 skin = mix(tint, mark, .8 * sat(pat)) * (.05 + .95 * wrap * wrap) * (.85 + .2 * st + .12 * grit) * (nigh ? 1. : .3) + (tint + .1) * l3 * up * .3;
        e = mix(e, skin * .55, solid); body = mix(body, 2. * solid, solid);
      }
      col = mix(col, col * exp(-(.35 * pat + 2. * body)) + e * lit * (.3 + .7 * tone) * lamp, on);
    }
  } while (++j < 2);
  drWash(vec3(.95, .3, .24), red * 1.5);
  return col + front * lamp;
}
float drSnow(vec2 p, float px, float i) {
  float sc = 4. + i * 5.;
  vec2 g = mod(p * sc + vec2(64. + .3 * sin(uTime * .05 + i * 2. + p.y), uTravel * (.1 - .02 * i) + i * 7.3 + 64.), 256.);
  vec2 h = hash22(floor(g) + i * 31.), o = rot(h.x * 6.) * (fract(g) - .5 - (h - .5) * (i < .5 ? .4 : .7));
  float hs = fract(h.x * 13.7 + h.y * 5.1);
  float r = i < .5 ? .08 + .08 * step(.93, hs) : .01 + .026 * hs * hs, soft = i < .5 ? r * .9 : r * .5 + px * sc;
  return ss(r + soft, r - soft, length(o * vec2(1., .75 + .9 * h.y))) * step(i < .5 ? .8 : .4, h.y) * (i < .5 ? .012 : .04 + .2 * hs * hs);
}
vec3 drFar(vec2 p, float fx, float px, float n, float big) {
  float u = (clamp(floor(p.x / (1.8 * fx) * n + .5 * n), 0., n - 1.) + .5) / n, h = fract(u * n * .618 + .21), rise = fract(u * n * .382 + uTravel * (.004 + .003 * h)), r = big * (.011 + .013 * fract(h * 5.3)) * min(fx, 1.);
  vec2 q = rot(.5 * sin(u * 19.) + PI * max(uOwn[7], 0.) - 1.2 * max(-uOwn[7], 0.)) * (p - vec2((u - .5) * 1.8 * fx + .03 * 8. / n * fx * sin(uTime * .05 + u * 8.), rise * 1.3 - .65)) / r;
  float cc = drBeat(uTime, h), R = 1. - .2 * cc, pq = px / r, d = length(q / vec2(R, .8 + .15 * cc));
  float dome = ss(1. + pq, 1. - pq, d) * ss(-.25 - pq, -.25 + pq, q.y);
  float s = max(-q.y, 0.), x = q.x - .12 * s * sin(uTime * .3 + u * 8. - s * .7);
  drPx = pq;
  float hairs = (drLine(abs(abs(x) - .8 * R + .1 * s), .05) + drLine(abs(abs(x - .1 * sin(s * 2.)) - .2), .08 - .015 * s)) * ss(0., .4, s) * ss(5., 1., s);
  return (vec3(.25, .4, .5) + piece(vec2(u, .15 + .7 * h)).rgb * 2.5) * ss(0., .15, rise) * ss(1., .85, rise) * (dome * (.1 + .9 * d * d * d * d * d) + .3 * hairs) * .32;
}
void drYoung(vec2 p, float fx, float px, float j) {
  float i = clamp(floor(p.x / (.17 * fx) + .5), -3. - step(.5, j), 3. + step(.5, j)), age = (i + 3.) / 6., u = (i + 3.5) / 7., on = max(1. + uOwn[6], 0.), arms = 8.;
  if (j > 0.) { on = uOwn[6]; age = hash21(vec2(i, j)); arms = 4. + floor(7. * fract(age * 7.7)); u = (i + 4.5) / 9.; px /= 2.2; p = (p - vec2(0., j * .163)) / 2.2 + vec2(i * .17 * fx, -.415) * (1. - 1. / 2.2); }
  on = min(on, 1.);
  float r = (.011 + .014 * age) * (.75 + .25 * fx) * (1. - .1 * drBeat(uTime, u * .6));
  vec2 q = (p - vec2(i * .17 * fx, -.415)) / r;
  float l = length(q), a = atan(q.y, q.x + 1e-5) + i * .4;
  drPx = px / r;
  float edge = 1. - (.15 + .45 * age) * (1. - ss(j > 0. ? 0. : .2, j > 0. ? .95 : .6, .5 + .5 * cos(a * arms))), d = (edge - l) * (.85 - .25 * age);
  float c = drLine(abs(d), .045) + .7 * drLine(abs(l - .26), .035) + .5 * drLine(abs(sin(a * .5 * arms)) * l * .25, .03) * step(.3, l) * ss(0., .1, d);
  drPut(sat(c) * .85 * on);
  vec4 m = piece(vec2(u, .84)) + piece(vec2(u, .55)) + piece(vec2(u, .25));
  if (j > 0.) m = 2.2 * piece(vec2(u, 1. - (j + .3) / 6.));
  float here = 1. - abs(fract(u - uLoop + .5) - .5) * 7.;
  drWash(mix(vec3(.9, .78, .6), mix(vec3(.85, .8, .7), m.rgb / max(max(m.r, max(m.g, m.b)), .1), .6), sat(m.a * 1.5)), ss(-drPx, drPx, d) * on * (.5 + (j > 0. ? uHits : 0.) + .8 * sat(m.a) + .6 * ss(0., .8, here)));
}

float drBest, drNext;
int drWho;
vec3 drGlow;
void drTry(vec2 p, int i, float lv, vec2 off, vec2 r, float lean, float fx, float high) {
  float f = 1. - .36 * high, was = DR_SIZE[i].x, s = drSize(i).x / was, rays = max(uOwn[2], 0.);
  vec4 at = drAt(i);
  vec2 q = p - vec2(at.x * fx + (i < 5 ? drAside(i) * high : 0.), at.y + at.z * high), g = q / (was * s) - vec2(0., .2);
  if (i < 5) drGlow += uKind[i] * uKind[i] * lv * (.06 + .22 * uEnergy) * drB(1.26 * length(g));
  if (uOwn[4] < 0.) drShade = max(drShade, ss(1.25, .7, length(vec2(g.x, g.y + .2) - vec2(.35, -.45))));
  q /= s;
  if (uOwn[7] != 0.) q = rot(drSize(i).y - DR_SIZE[i].y) * q;
  if (uOwn[1] > 0. && q.y > 0.) q.y /= 1. + .9 * uOwn[1];
  q -= off * f * (1. - rays);
  if (rays > 0.) { r = mix(r, vec2(was * 2.4), rays); lean *= 1. - rays; }
  float d = length(vec2(q.x - lean * q.y, q.y) / r) / f;
  if (d < drBest) { drNext = drBest; drBest = d; drWho = i % 5; } else drNext = min(drNext, d);
}

vec3 render(vec2 p) {
  float lv[5] = float[5](uDrone, max(uPad, .8 * uMic), uTexture, max(uPhrase, uKeys), uHits);
  float px = 1. / uRes.y, asp = .5 * uRes.x / uRes.y, fx = clamp(asp / .86, .33, 1.35), high = ss(.85, .35, asp);
  bool plate = uVar > .5;
  drInk = 0.; drLv = 0.; drWashed = vec3(0.); drBest = 9.; drNext = 9.; drShade = 0.; drGlow = vec3(0.); drWho = 0;
  // the water: lit from above, and a cue turns that light
  vec2 src = vec2(-.3 * fx + .1 * sin(uTime * .02) + 1.4 * uCue * (1. - uCue), .95), to = p - src;
  float dl = length(to), ang = atan(to.x, .3 - to.y), lampI = .85 + .45 * uLevel + .9 * uCue;
  float shaft = noise(vec2(ang * 7. + .04 * uTime + 50., 3.)) * .6 + noise(vec2(ang * 19. - .06 * uTime + 2e3, 9.)) * .4;
  vec3 lamp = mix(vec3(.72, .9, 1.08), vec3(1.05, .97, .86), .35 + .4 * uTone) * lampI * (.4 + 1.9 * exp(-dl * 1.1));
  vec3 col = vec3(.0012, .0028, .008) + vec3(.018, .085, .21) * exp(-dl * dl * 2.6) * (.25 + (1.1 + uMic) * shaft * shaft) * lampI;
  float day = plate ? 0. : max(uOwn[4], 0.), floor_ = plate ? 0. : max(-uOwn[4], 0.), many = max(uOwn[6], 0.), few = 1. - max(-uOwn[6], 0.);
  if (day > 0.) col *= 1. - day;
  if (plate && (uOwn[0] != 0. || uOwn[1] != 0. || uOwn[2] != 0. || uOwn[3] != 0. || uOwn[7] != 0.)) {
    for (int i = 5; i < 10; i++) { float z = DR_SIZE[i].x, l = DR_TAIL[i].y * z; drTry(p, i, 0., vec2(0., -.4 * l), vec2(1.2 * z, z + .55 * l), 0., fx, high); }
  } else if (plate) {
    drWho = abs(p.x / fx) < .34 || (asp < .42 && abs(p.y - .09) < .23) ? 0 : (p.x < 0. ? 1 : 2) + (p.y < .07 ? 2 : 0);
  } else {
    col += (drFar(p, fx, px, 8., 1.) + (drSnow(p, px, 0.) + drSnow(p, px, 1.) + drSnow(p, px, 2.)) * .7) * lamp * few;
    if (many > 0.) for (float i = 0.; i < 4.; i++) col += many * drFar(p + vec2(0., .13 * i), fx, px, 23. - 4. * i, 1.2 + .5 * i) * lamp * (.7 + .25 * i);
    drTry(p, 0, lv[0], vec2(.1, -.35), vec2(.62, .9), -.2, fx, high);
    drTry(p, 1, lv[1], vec2(-.11, -.2), vec2(.3, .5), .4, fx, high);
    drTry(p, 2, lv[2], vec2(.02, -.03), vec2(.15, .15), 0., fx, high);
    drTry(p, 3, lv[3], vec2(.01, -.07), vec2(.1, .19), 0., fx, high);
    drTry(p, 4, lv[4], vec2(-.08, -.1), vec2(.14, .22), .5, fx, high);
  }
  if (floor_ > 0.) {
    vec2 w = p * vec2(1., 1.25) + .012 * vec2(sin(p.y * 22. + uTime * .3), sin(p.x * 19. - uTime * .26));
    float n1 = noise(w * 7. + vec2(uTime * .06, 60.)), n2 = noise(w * 8. + vec2(90., 20. - uTime * .07)), net = 1. - abs(n1 - n2) * 3.2;
    float rip = sin(w.y * 85. + 6. * noise(w * 3.5 + 30.) + 14. * w.x * noise(w * .9 + 70.));
    vec3 sand = mix(vec3(.5, .43, .31), uKind[0], .45);
    sand = sand * sand * 1.7 * (.75 + .13 * rip + .2 * noise(w * 140. + 300.)) * (.62 + .5 * max(net, 0.) * max(net, 0.)) * lampI * (.75 + .5 * exp(-dl));
    col = mix(col, sand * (1. - .62 * drShade), floor_);
  }
  drLv = lv[drWho];
  drTake(p, drWho, plate ? 5 : 0, fx, high, px);
  col += drGlow * lamp;
  col = drAnimal(col, p, plate, drWho == 0 ? lamp * .95 : lamp * 1.1, normalize(vec2(src.x - p.x, .9)), px, ss(0., .08, drNext - drBest));
  if (!plate && day > 0.) {
    float m = max(max(col.r, col.g), max(col.b, 1e-3)), a = 1. - exp(-2.2 * m);
    vec3 sky = mix(vec3(.95), uKind[0] / max(max(uKind[0].r, uKind[0].g), max(uKind[0].b, .1)), .3) * (.78 + .24 * exp(-dl) + .12 * shaft * exp(-dl)) * (.95 + .1 * lampI);
    return mix(screenOf(col * 1.2), sky * mix(vec3(1.), .1 + .75 * col * col / (m * m), a * .92), day);
  }
  if (!plate) return screenOf(col * 1.2);
  drWashed *= 1. - many; drInk *= 1. - many;
  if (uOwn[5] < 0.) drInk *= 1. + .75 * uOwn[5];
  drYoung(p, fx, px, 0.);
  if (many > 0.) drYoung(p, fx, px, clamp(floor((p.y + .415) / .163 + .5), 0., 5.));
  float fibre = noise(p * vec2(90., 240.) + 500.) * .5 + noise(p * 420. + 900.) * .5;
  vec3 paper = vec3(.95, .91, .81) * (.975 + .03 * fibre) - vec3(.02, .035, .06) * noise(p * 2.3 + 9.);
  float lie = dot(p, vec2(.8, .6));
  paper *= 1. - .1 * ss(-.1, .9, lie + .15 * sin(uTime * .03));
  paper *= 1. + uCue * (.11 * drB((lie + .9 - 1.8 * (1. - uCue)) / .28) - .07 + .1 * (fibre - .5));
  drPx = px;
  vec2 fr = abs(p) - vec2(asp, .5) + .03;
  drPut(drLine(abs(max(fr.x, fr.y)), .001) * .8 * few);
  vec3 ink = vec3(.17, .125, .11);
  if (uOwn[4] > 0.) {
    vec3 sea = mix(uKind[1], uKind[2], ss(-.5, .45, p.y + .3 * noise(p * 2.6 + 70.) - .15 + .2 * (uTexture - uPad))) * (.9 + .16 * noise(p * vec2(5., 9.) + 40.)) * (.95 + .1 * fibre);
    paper = mix(paper, paper * sea * 1.15, uOwn[4] * .95 * exp(2.5 * min(drWashed.b, 0.)));
  }
  if (uOwn[4] < 0.) {
    vec3 k = uKind[0] * uKind[0], w = exp(drWashed);
    paper = mix(paper, (.03 + .6 * k) * (.55 + .3 * paper), -uOwn[4]);
    ink = mix(ink, vec3(.95, .93, .86), -uOwn[4]);
    paper += -uOwn[4] * .8 * w * sat(2. - 2. * min(w.r, min(w.g, w.b)));
    drWashed *= 1. + uOwn[4];
  }
  if (uOwn[4] != 0.) paper = mix(paper, uKind[4], .4 * abs(uOwn[4]) * uHits * drB(length(p - drAt(9).xy * vec2(fx, 1.)) / .25));
  return mix(paper * exp(drWashed), ink, sat(drInk) * (.8 + .2 * fibre));
}
