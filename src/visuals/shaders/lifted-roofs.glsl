// name: Lifted roofs
// a: Rooms and clouds
// b: Snowed veranda
// what: A long house seen from above with its roofs left off: straw mats, painted walls, blinds, the rooms slanting down to the left between banks of worn gold cloud, a robe's five-edged hem lying out from under a blind by a lamp; or its veranda on a snowy evening, a blue stream, a bridge of planks in a zigzag and a bent plum.
// follows: Drone and loudness draw back the gold clouds, a cue parts them. Pad warms the rooms, texture stirs the mats or thickens the snow, a phrase carries a lantern along the veranda with the loop. Each kind spreads one edge of the hem, patterned by the piece. Bands raise the blinds, a hit slides a panel open, keys add gold flecks and blossom.
// own: 0 a pale spring morning at -1 (no snow, the plum in flower), night at 1; 1 no cloud at -1, gold over most of it at 1; 2 far off at -1, close at 1; 3 the house lies flat at -1, steep at 1; 4 ink lines on bare paper, the robe in colour, at -1, gold lines on blue-black at 1; 5 the inner walls gone and the stream dry at -1, blinds down and the stream broad at 1
const float lfL = .36, lfD = .36, lfE = .34, lfV = .2; // a room's length; the depth of front rooms, back rooms, veranda
const vec3 lfBlk = vec3(.13, .1, .085), lfPap = vec3(.71, .61, .44), lfLac = vec3(.14, .09, .08), lfWh = vec3(.9, .91, .92);
vec3 lfC;                     // the painting so far
float lfK, lfT;               // how much of it is drawn line, and how much keeps its colour
float lfPx, lfPp, lfDry;      // a pixel, and how many to 1; where the brush ran dry
vec2 lfA, lfB;                // which way the house runs, and which way across it
float lfDet, lfH, lfHp, lfCa, lfCb; // the angle between them; the height of a beam, of a wall; a step along and across, on the screen
float lfNt, lfSp, lfSn;       // night, spring, snow
float lfS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float lfIn(float d) { return sat(.5 - d * lfPp); }
void lfPut(vec3 c, float a) { lfC = mix(lfC, c, a); lfK *= 1. - a; lfT *= 1. - a; }
// A line of half width w; finer than a pixel it goes pale.
float lfLine(float d, float w) { return lfIn(abs(d) - max(w, .5 * lfPx)) * min(1., 2. * w * lfPp); }
void lfInk(float a) { a *= lfDry; lfC = mix(lfC, lfBlk, .85 * a); lfK = max(lfK, a); }
// A shape and the line round it.
void lfDraw(vec3 c, float d, float al) { lfPut(c, al * lfIn(d)); lfInk(al * lfLine(d, .0011)); }
float lfBox(vec2 q, vec2 lo, vec2 hi) { vec2 d = max(lo - q, q - hi); return max(d.x, d.y); }
// A kind's colour, ground as a pigment.
vec3 lfPig(int k) { vec3 c = uKind[k]; c = mix(vec3(dot(c, vec3(.33))), c, .8); return c * c * .5 + c * .4 + .05; }
// A room's own numbers, 0 to 1.
float lfNo(float k, float r, float c) { return fract(k * .7549 + r * .5698 + c); }
// How warm a room is lit; a hit lights the one by the lamp.
float lfLit(float k, float r) {
 float h = lfNo(k, r, .1), near = k == 0. && r < .5 ? 1. : 0.;
 return sat(.05 + .65 * near + (1. - near) * (.25 * h + .2 * lfSn) + uPad * (.25 + .5 * h) * (.6 + uEnergy) + .2 * uMic) + .45 * near * uHits;
}
vec3 lfLamp(vec3 c, float l) { return c * mix(mix(vec3(.67, .64, .66), vec3(.3, .34, .5), lfNt), vec3(1.17, 1.04, .83), l); }
// Where room k of row r begins; which room a place is in.
float lfAt(float k, float r) { return k * lfL + (r < .5 && (k == 0. || k == 1.) ? 0. : .13 * (lfNo(k, r, .6) - .5)); }
float lfRoom(float a, float r) { float k = floor(a / lfL); return k - 1. + step(lfAt(k, r), a) + step(lfAt(k + 1., r), a); }
// Where the pixel falls on a standing plane at b: (a, height).
vec2 lfWall(vec2 p, float b) { float a = (p.x - b * lfB.x) / lfA.x; return vec2(a, p.y - a * lfA.y - b * lfB.y); }
// Sliding panels c wide, some painted with hills; u is a step's size on the screen.
void lfPan(vec2 w, float c, float u, float al, float seed, float lit) {
 al *= lfIn(w.y - lfHp);
 if (al <= 0.) return;
 float f = mod(w.x, c), y = w.y / lfH, h = fract(seed * .7549), x = w.x + seed;
 vec3 col = mix(vec3(.86, .81, .69), vec3(.77, .66, .43), step(.62, h) * .8 + .3 * lfS(.5, 1., y));
 if (h < .5) {
  float hill = .3 + .2 * sin(x * 11.) + .08 * sin(x * 29.);
  col = mix(col, mix(vec3(.22, .34, .48), vec3(.45, .55, .46), fract(seed * 3.3)), .75 * lfIn((y - hill) * lfH) * lfS(hill - .3, hill, y));
 }
 lfPut(lfLamp(col, lit * (1.08 - .35 * y)), al);
 lfPut(lfLac, al * lfIn((min(f, c - f) - .002) * u));
 lfInk(al * lfLine((min(f, c - f) - .0032) * u, .0007));
 lfPut(lfLac, al * lfIn((y - .05) * lfH));
}
// The beam along a wall's top.
void lfBeam(float y, float u, float al) {
 if (abs(y - lfH) > .03) return;
 float d = (y - lfH + .007) * u;
 lfDraw(lfLamp(vec3(.6, .42, .25), .5), abs(d) - .006, al);
 lfPut(lfWh, lfSn * lfIn(abs(d - .0075) - .0035));
}
void lfPost(float d, float al) { if (abs(d) < .009) lfDraw(lfLamp(vec3(.56, .38, .22), .5), abs(d) - .0048, al); }
// Straw mats edged in black, or boards.
void lfFloor(vec2 q, float mid, float k, float r, float al) {
 float lit = lfLit(k, r), h = lfNo(k, r, .8);
 vec2 v = q - vec2(mid, .2);
 lit *= .5 + .6 / (1. + 18. * dot(v, v));
 if (h < .7 || (k == 0. && r < .5)) {
  float row = floor(q.y / .09), x = q.x + .09 * mod(row, 2.), fx = mod(x, .18), fy = q.y - row * .09;
  float straw = noise(vec2(x * 260., q.y * 24.)), m = hash21(vec2(floor(x / .18) + k * 3., row + r * 5.));
  vec3 c = mix(vec3(.47, .54, .32), vec3(.66, .62, .36), .75 * m);
  c *= .94 + (.09 + .22 * uTexture) * (straw - .45) + .1 * uTexture * sin(q.x * 30. + q.y * 17. + uTime * .6);
  lfPut(lfLamp(c, lit), al);
  float e = min(fy, .09 - fy) * lfDet;
  lfPut(lfLamp(lfLac, lit), al * lfIn(e - .0042));
  lfK = max(lfK, .4 * al * lfLine(e, .0042));
  lfInk(.6 * al * lfLine(min(fx, .18 - fx) * lfDet, .0011));
 } else {
  float f = mod(q.y, .06), b = floor(q.y / .06);
  vec3 c = vec3(.62, .44, .26) * (.85 + .25 * hash21(vec2(b, k)) + .14 * (noise(vec2(q.x * 12., q.y * 200.)) - .5));
  lfPut(lfLamp(c, lit), al);
  lfInk(.75 * al * lfLine(min(f, .06 - f) * lfDet, .0011));
 }
}
// What stands in a room: a curtain on a stand, a folding screen, a brazier.
void lfThing(float x, float y, float k, float r, float which) {
 float lit = lfLit(k, r), dim = .15 + .85 * lit;
 if (which < .55) {
  float top = .62 * lfH, fold = fract(x / .032), d = lfBox(vec2(x, y), vec2(-.1, .004), vec2(.09, top)) * lfCa, in_ = lfIn(d);
  vec3 c = mix(lfPig(int(mod(k + 2. * r + 10.5, 5.))), vec3(.88, .82, .7), .5 * lfS(.2, .9, y / top) + .15);
  lfDraw(lfLamp(c * (.84 + .2 * lfS(0., .6, fold)), dim), d, 1.);
  lfInk(.5 * in_ * lfLine((fold - .5) * .032 * lfCa, .001));
  lfPut(lfLac, max(in_ * lfIn((abs(fold - .25) - .09) * .032) * step(.5, fract(x / .064)), lfIn(lfBox(vec2(x, y), vec2(-.115, top), vec2(.105, top + .006)))));
  x -= .112;
  vec2 o = vec2(x * lfA.x, y + x * lfA.y - .012);
  float e = length((o - vec2(0., .012)) * vec2(1., 2.2));
  lfDraw(lfLamp(vec3(.27, .15, .11), dim), max(length(o * vec2(1., 1.5)) - .026, o.y - .012), 1.);
  lfDraw(lfLamp(mix(vec3(.7, .66, .58), vec3(.9, .38, .16), lfIn(e - .011)), lit), e - .026, 1.);
 } else {
  float f = (x + .13) / .065, yy = y - .026 * abs(fract(f * .5) * 2. - 1.) + .01, tall = .68 * lfH, d = lfBox(vec2(x, yy), vec2(-.13, 0.), vec2(.13, tall)) * lfCa;
  float v = yy / tall, hy = .45 + .2 * sin(x * 21. + k * 2.);
  vec3 c = mix(vec3(.8, .66, .38), vec3(.2, .36, .42), .85 * lfIn((v - hy) * tall) * lfS(-.3, hy, v));
  c = mix(c * (1. - .22 * mod(floor(f), 2.)), lfLac, lfIn(min(min(fract(f), 1. - fract(f)) * .065, min(yy, tall - yy)) - .0026));
  lfDraw(lfLamp(c, dim), d, 1.);
 }
}
// A row of rooms from b0 (far) to b1.
void lfRow(vec2 p, vec2 ab, float b0, float b1, float r) {
 float k = lfRoom(ab.x, r), kp = k + 1.;
 // the wall that stands before this floor; some rooms run on into the next
 float a1 = lfAt(kp, r), h = (a1 - ab.x) * lfDet / lfCb, bh = ab.y + h * lfCa / lfDet;
 float hid = lfIn((h - lfH) * lfCb) * lfIn(max(b0 - bh, bh - b1) * lfCb), shut = step(.28, lfNo(kp, r, .35)) * hid;
 float seen = 1. - shut * lfIn(h - lfHp);
 if (seen > 0.) {
  float fl = lfIn(max(b0 - ab.y, ab.y - b1) * lfDet), a0 = lfAt(k, r);
  if (fl > 0.) lfFloor(vec2(ab.x - a0, ab.y - b0), .5 * (a1 - a0), k, r, fl);
  vec2 w = lfWall(p, b0);
  if (w.y > 0. && w.y < lfH + .015) {
   float kk = lfRoom(w.x, r), c, x, al = lfIn((w.y - lfH) * lfCa);
   a0 = lfAt(kk, r); c = .25 * (lfAt(kk + 1., r) - a0); x = w.x - a0;
   lfPan(vec2(x, w.y), c, lfCa, al, r * 3. + kk + 9., lfLit(kk, r));
   // on a hit one panel slides, with light behind it
   if (r < .5 && kk == 0. && uHits > .001) {
    float gap = lfIn(abs(x - 1.5 * c) - 2. * c * uHits * (1. - uHits)), y = w.y / lfH;
    lfC = mix(lfC, vec3(1., .8, .45), al * max(gap * step(.06, y), .6 * uHits * exp(-900. * (x - 1.5 * c) * (x - 1.5 * c))));
   }
   lfPost(min(x, 4. * c - x) * lfCa, al);
   lfBeam(w.y, lfCa, al);
  }
 }
 if (shut > 0.) lfPan(vec2(bh - b0, h), .25 * (b1 - b0), lfCb, shut, kp * 1.7 + r * 4., .15 + .85 * lfLit(kp, r));
 vec2 o = lfWall(p, mix(b0, b1, .4));
 if (o.y > -.07 && o.y < .75 * lfH) {
  float ko = lfRoom(o.x, r);
  o.x -= .5 * (lfAt(ko, r) + lfAt(ko + 1., r));
  if (abs(o.x) < .15 && (ko > k || seen > .5)) lfThing(o.x, o.y, ko, r, lfNo(ko * 1.7, r * 1.3, .01));
 }
 if (hid > 0.) { lfBeam(h, lfCb, hid); lfPost(min(bh - b0, b1 - bh) * lfCb, hid); }
}
// The blinds between the posts of the front.
void lfFront(vec2 w) {
 float k = lfRoom(w.x, 0.), a0 = lfAt(k, 0.), bw = .5 * (lfAt(k + 1., 0.) - a0);
 float half_ = step(bw, w.x - a0), j = 2. * k + half_, x = w.x - a0 - bw * half_, e = min(x, bw - x);
 float up = .08 + .5 * lfNo(j, j * j, .3) + .3 * uBands[int(mod(j + .5, 16.))];
 if (j == 0.) up = .1 + .1 * uBands[0];
 up = clamp(up - .75 * uOwn[5], .02, .87) * lfH;
 float al = lfIn((w.y - lfH) * lfCa) * lfIn((up - w.y) * lfCa) * lfIn((.006 - e) * lfCa), y = w.y - up, slat = w.y / lfH * 22.;
 if (al > 0.) {
  vec3 c = mix(vec3(.69, .62, .33), vec3(.53, .55, .31), lfNo(j, j, .7)) * (.84 + .26 * lfS(0., .4, fract(slat)) * lfS(1., .7, fract(slat)));
  float bd = min(min(abs(x - .34 * bw), abs(x - .67 * bw)) - .004, e - .013);
  c = mix(c, vec3(.4, .17, .12), lfIn(min(bd, lfH - .026 - w.y)));
  lfPut(lfLamp(c, .25 + .55 * lfLit(k, 0.)), al);
  lfInk(.3 * al * lfLine((fract(slat) - .5) * lfH / 22., .0006));
  float thick = .003 + .006 * up / lfH;
  lfDraw(lfLamp(vec3(.5, .42, .22), .4), abs(y - thick) - thick, al);
 }
 al = lfIn((w.y - lfH) * lfCa) * lfIn(-w.y * lfCa);
 lfPost(e * lfCa, al);
 lfBeam(w.y, lfCa, al);
}
// The robe's hem out from under the blind: five edges, one for each kind.
void lfHem(vec2 ab) {
 vec2 q = vec2(ab.x - .09, ab.y + .15);
 float r = length(q), th = atan(q.x, q.y), sig[5] = float[5](uDrone, uPad, uTexture, uPhrase, .7 * uHits);
 for (int k = 0; k < 5; k++) {
  float f = float(k), s = sat(sig[k]), T = .7 - .055 * f + .07 * s;
  float u = th * (9. + .5 * f) + .8 * f + .4, fold = abs(sin(u)), R = .3 - .021 * f + .024 * s + .003 * sin(uTime * .23 + f * 1.3);
  R *= .965 + .05 * fold - .14 * th * th + .07 * th;
  float d = -smin(R - r, (T + .012 * sin(r * 44. + f) - abs(th)) * r, .018) * lfDet, al = lfIn(d);
  if (al <= 0.) continue;
  vec3 c = (k & 1) == 0 ? lfPig(k) * (k == 4 ? 1. : .72) : mix(lfPig(k), vec3(.9, .85, .74), .42);
  // the piece is the pattern woven in it
  vec4 m = piece(vec2(.5 + .48 * th / T, .12 + .17 * f + .5 * (R - r)));
  vec2 g = vec2(th * 17., r * 52. + .5 * mod(floor(th * 17.), 2.));
  float w = sat(1.6 * m.a), motif = lfS(.18 + .22 * w, .1 + .22 * w, length((fract(g) - .5) * vec2(1., .8)));
  c = mix(c, mix(vec3(.93, .85, .68), .3 + .65 * m.rgb / max(m.a, .02), w), motif * (k == 4 ? .6 : .75 * w));
  c *= .74 + .3 * fold;
  lfPut(lfLamp(c, .85), al);
  lfPut(vec3(.95, .88, .75), .85 * al * lfIn(-d - .0038));
  lfT = max(lfT, al);
  lfInk(lfLine(d, .0012));
  lfInk(.5 * al * lfLine(sin(u) * r / 9., .0007) * lfS(.14, .26, r));
 }
}
// The whole house, its near side running through 0.
void lfHouse(vec2 p, vec2 ab) {
 // the light that walks along with the loop, and the lamp
 float wx = mix(-.95, .8, uLoop), on = lfS(0., .12, uLoop) * lfS(1., .88, uLoop) * uPhrase;
 if (ab.y < .01 - lfD) lfRow(p, ab, -lfD - lfE, -lfD, 1.);
 if (ab.y < .01 && ab.y > -lfD - lfH * lfCa / lfDet - .04) lfRow(p, ab, -lfD, 0., 0.);
 float fl = lfIn(max(-ab.y, ab.y - lfV) * lfDet), f = mod(ab.y, .05), glow = 0.;
 if (ab.y > -.02) {
  vec2 la = ab - vec2(wx, .13), lb = ab - vec2(-.06, .07);
  glow = max(.9 / (1. + 30. * dot(lb, lb)), on / (1. + 40. * dot(la, la)));
 }
 if (fl > 0.) {
  vec3 c = vec3(.64, .48, .31) * (.95 + .05 * sin(floor(ab.y / .05) * 9.) + .14 * (noise(vec2(ab.x * 9., ab.y * 190.)) - .5));
  lfPut(lfLamp(c, .12 + .88 * glow), fl);
  lfInk(.7 * fl * lfLine(min(f, .05 - f) * lfDet, .001));
  lfPut(lfWh, lfSn * fl * lfIn((lfV - .035 - .03 * noise(vec2(ab.x * 9., 2.)) - ab.y) * lfDet));
 }
 vec2 e = lfWall(p, lfV);
 if (e.y < .006 && e.y > -.07) {
  float al = lfIn(max(-.05 - e.y, e.y) * lfCa);
  lfPut(lfLac, al);
  lfPut(lfLamp(vec3(.6, .45, .29), .2 + .5 * glow), al * lfIn((-.014 - e.y) * lfCa));
  lfPost((fract(e.x / .18) - .5) * .18 * lfCa, al);
  lfInk(max(lfLine(e.y * lfCa, .0013), lfLine((e.y + .014) * lfCa, .001)));
  lfPut(lfWh, lfSn * lfIn(abs(e.y * lfCa - .001) - .005));
 }
 vec2 w = lfWall(p, 0.);
 if (w.y > -.01 && w.y < lfH + .02) lfFront(w);
 if (ab.y > 0. && ab.y < .24 && abs(ab.x - .09) < .34) lfHem(ab);
 // the lamp: a pole, a dish, a small flame
 vec2 o = p - (-.06 * lfA + .07 * lfB);
 if (abs(o.x) < .25 && abs(o.y - .12) < .25) {
  float l = length(o - vec2(.003, .123)), body = min(min(length(o * vec2(1., 2.6)) - .02, lfBox(o, vec2(-.0024, 0.), vec2(.0024, .105))), max(length((o - vec2(0., .112)) * vec2(1., 1.9)) - .018, o.y - .112));
  lfDraw(lfLac, body, 1.);
  lfC += vec3(.5, .33, .13) * (.85 + .25 * uMic + .07 * sin(uTime * 1.7)) * exp(-20. * l) * (1. - lfC);
  o -= vec2(.003, .123);
  lfPut(vec3(1., .91, .68), lfIn(length(vec2(o.x * (1. + 40. * sat(o.y + .008)), o.y * .55)) - .0075));
 }
 // the paper lantern in the corridor
 vec2 n = p - (wx * lfA + .13 * lfB);
 if (abs(n.x) < .06 && n.y > -.02 && n.y < .09 && on > 0.) {
  float bx = lfBox(n, vec2(-.017, .004), vec2(.017, .052));
  lfDraw(vec3(1., .86, .58), bx, on);
  lfInk(on * lfIn(bx) * lfLine(n.y - .028, .0009));
 }
}
const vec4 lfBand[11] = vec4[11]( // its side, where it ends, height, half thickness
 vec4(-1, -.4, .45, .075), vec4(-1, .02, .37, .036), vec4(-1, -.55, .3, .04), vec4(1, .4, .47, .05), vec4(1, .68, .4, .032), vec4(1, .6, -.3, .032), vec4(1, .4, -.365, .034), vec4(1, .54, -.44, .05),
 vec4(-1, -.83, .1, .036), vec4(-1, -.6, .035, .036), vec4(-1, -.3, -.45, .04));
// The cloud: long bars with round ends, run together.
float lfCloud(vec2 p, float open, bool few) {
 float sway = .05 * sin(uTime * .031), d = 1., W = min(1., .55 + .2 * uRes.x / uRes.y), thick, reach, h;
 open += .25 * (uSpace - .5) - 1.2 * uOwn[1] + 4. * uCue * (1. - uCue);
 thick = clamp(1.45 - .38 * open, .4, 2.2); reach = .62 * open - .28; p.y /= 1. + .1 * open;
 for (int i = 0; i < (few ? 8 : 11); i++) {
  vec4 b = lfBand[i];
  float e = length(vec2(max(b.x * (b.y * W + sway * float(i % 3 - 1) - p.x) + reach, 0.), p.y - b.z)) - b.w * thick;
  h = max(.05 - abs(d - e), 0.);
  d = min(d, e) - h * h * 5.;
 }
 return d - (.011 * abs(sin(p.x * 24. + 9. * p.y)) - .004) * lfS(-.04, -.01, d);
}
// Grasses in the garden, in tufts.
void lfGrass(vec2 p) {
 vec2 id = floor(p / vec2(.23, .15)), q = p - (id + .5) * vec2(.23, .15), h = hash22(id + 3.);
 if (h.x > .7) return;
 q -= (h - .35) * vec2(.1, .05) + vec2(0., -.05);
 for (int i = 0; i < 6; i++) {
  float f = float(i) - 2.5, t = q.y / (.09 - .008 * f * f);
  if (t < 0. || t > 1.) continue;
  float d = q.x - f * .004 - f * .012 * t * t - .006 * t * t * sin(uTime * .4 + h.y * 9. + f) - .012 * t * t;
  lfInk(.8 * lfLine(d, .0022 * (1. - t)));
 }
}
void lfWater(float d, vec2 q) {
 if (d < .004) {
  float w = q.y * 26., row = floor(w), n = noise(q * vec2(5., 16.));
  lfPut(mix(vec3(.17, .31, .46), vec3(.3, .46, .54), n), lfIn(d));
  w = fract(w + .5 * sin(q.x * 13. - uTravel * .3) + .25 * sin(q.x * 31. + row));
  lfPut(vec3(.72, .79, .8), (.6 + .4 * uLow) * lfIn(d + .006) * lfLine((w - .5) / 26., .0012) * lfS(.35, .6, noise(vec2(q.x * 7. - uTravel * .15, row * 3.1))));
  lfInk(.9 * lfLine(d, .0013));
 }
}
const vec4 lfTree[15] = vec4[15](vec4(0, -.06, .03, .12), vec4(.03, .12, -.06, .24), vec4(-.06, .24, .06, .36), vec4(.06, .36, .21, .41), vec4(.21, .41, .35, .52),
 vec4(-.06, .24, -.17, .35), vec4(-.17, .35, -.19, .5), vec4(.06, .36, 0., .53), vec4(0., .53, .09, .67), vec4(.21, .41, .37, .38), vec4(.37, .38, .5, .42), vec4(.03, .12, .17, .2), vec4(.13, .39, .15, .55), vec4(-.1, .28, -.27, .31), vec4(0., .5, -.09, .62));
// The bent plum, snow along its upper sides.
void lfPlum(vec2 q) {
 vec3 bare = lfC;
 float soil = lfK, bank = q.y + .042 - .02 * cos(q.x * 16.);
 q += .014 * vec2(sin(q.y * 31. + 1.), sin(q.x * 27.));
 float d = 1., up = 1.;
 for (int i = 0; i < 15; i++) {
  vec4 e = lfTree[i];
  vec2 v = e.zw - e.xy, g = q - e.xy;
  float f = float(i), h = sat(dot(g, v) / dot(v, v)), w = i < 5 ? .04 - .0078 * (f + h) : (i == 6 || i == 8 || i == 10 ? .006 : .0095) * (1. - .55 * h), l = length(g -= v * h);
  d = min(d, l - w);
  up = min(up, l - w - .0042 * sat(1.3 * g.y / max(w, l) - .2) + .004 * sat(.5 - g.y / w));
 }
 if (d < .003) lfPut(mix(vec3(.17, .13, .12), vec3(.4, .33, .27), lfS(.4, .9, noise(q * vec2(70., 38.)))), lfIn(d));
 lfInk(lfLine(d, .0011));
 lfPut(lfWh, lfSn * lfIn(up) * (1. - lfIn(d + .0035)));
 if (d < .035) for (int i = 0; i < 16; i++) {
  float f = float(i), h = hash11(f + .7), R = (.009 + .006 * h) * (.75 + .35 * uKeys + .5 * lfSp + .2 * uPhrase);
  vec4 e = lfTree[4 + int(mod(f + .5, 11.))];
  vec2 g = q - mix(e.xy, e.zw, .25 + .75 * fract(h * 7.3)) - .026 * (vec2(fract(h * 13.), fract(h * 29.)) - .5);
  float l = length(g);
  if (l > .024) continue;
  float fl = l - R * (.84 + .18 * cos(5. * atan(g.y, g.x + 1e-5) + 6. * h));
  lfPut(mix(vec3(.78, .25, .3), vec3(.95, .8, .79), (.3 + .5 * h) * lfS(0., R, l)), lfIn(fl));
  lfPut(vec3(.88, .7, .34), lfIn(l - .0022));
  lfT = max(lfT, lfIn(fl));
 }
 // the bank its foot stands in
 if (bank < .01) {
  bank = lfIn(bank + .012 * (noise(q * 40.) - .5));
  lfC = mix(lfC, bare, bank); lfK = mix(lfK, soil, bank);
 }
}
// The garden: banks, a stream, a bridge of planks in a zigzag.
void lfGarden(vec2 p, vec2 ab, float n) {
 lfC = mix(mix(vec3(.6, .6, .4), vec3(.45, .53, .33), n), mix(vec3(.65, .675, .71), vec3(.79, .79, .78), n), lfSn);
 // low banks, each a line with its shade beneath
 for (int i = 0; i < 3; i++) {
  float f = float(i), y = .31 - .19 * f - .08 * step(1.5, f) + .035 * sin(p.x * (3. + f) + f * 2.) - (f < 1.5 ? .25 : .12) * p.x - p.y;
  float on = lfS(.3, .5, n);
  lfC *= mix(vec3(1), vec3(.84, .87, .93), on * lfS(.16, -.02, y) * lfIn(-y));
  lfInk(.6 * on * lfLine(y, .0011));
 }
 // the warm light of the open room on the snow
 vec2 gl = ab - vec2(.22, .25);
 lfC *= mix(vec3(1), vec3(1.12, .96, .72), (.55 + .5 * uPad + .6 * uHits) / (1. + 14. * dot(gl, gl)));
 float yc = -.05 - .45 * p.x + .05 * sin(p.x * 5. + .6), wd = .055 + .022 * sin(p.x * 3.3 + 1.) + .09 * uOwn[5] + .012 * uDrone;
 float d = (abs(p.y - yc) - wd) * .9;
 lfWater(d, vec2(p.x, p.y - yc));
 lfC *= 1. - .4 * lfIn(d) * lfS(.03, 0., yc + wd - p.y);
 lfPut(lfWh, lfSn * lfS(-.02, .01, wd) * lfIn(abs(d - .004) - .005));
 vec2 lift = vec2(lfB.x, -lfA.x) / lfDet * .024, q = ab + lift;
 if (abs(q.x - .23) < .12 && abs(q.y - .6) < .4) for (int i = 0; i < 4; i++) {
  float f = float(i), a0 = .16 + .06 * mod(f, 2.), b0 = .29 + .155 * f;
  vec2 lo = vec2(a0, b0), hi = lo + vec2(.068, .175);
  float top = lfBox(q, lo, hi) * lfDet;
  lfC *= 1. - .45 * lfIn(lfBox(ab, lo, hi) * lfDet - .004);
  lfPut(lfLac, lfIn(lfBox(q - .4 * lift, lo, hi) * lfDet));
  lfPut(mix(vec3(.55, .42, .29), lfWh, lfSn * lfS(0., -.012, top) * lfS(.25, .4, noise(q * 30.))), lfIn(top));
  lfInk(max(lfLine(top, .0013), .6 * lfIn(top) * lfLine((abs(q.x - a0 - .034) - .0115) * lfDet, .0008)));
 }
}
vec3 render(vec2 p) {
 bool snow = uVar > .5;
 vec2 at = p, w = rot(.6) * p;
 float n1 = noise(w * 5. + 3.), n2 = noise(w * 92.);
 lfDry = .6 + .4 * lfS(.2, .45, n2);
 lfNt = max(uOwn[0], 0.); lfSp = max(-uOwn[0], 0.); lfSn = snow ? 1. - lfSp : 0.;
 float zoom = (snow ? 1. : 1.18) * (1. + .25 * uOwn[2]) / (1. - .25 * uOwn[2]);
 lfA = normalize(vec2(-1, -.51 - .26 * uOwn[3])); lfB = normalize(vec2(1, -.288 - .09 * uOwn[3]));
 lfCa = -lfA.x; lfCb = lfB.x; lfDet = lfCa * -lfB.y - lfA.y * lfCb; lfH = .175 * lfDet; lfHp = mix(lfH + .002, -.01, max(-uOwn[5], 0.));
 p += .004 * (n1 - .5); // a hand's unsteadiness
 vec2 gp = p / zoom, hp = snow ? (gp - vec2(.42, .18)) * vec2(-1., 1.) : (p - vec2(.2, -.03)) / zoom - lfA * .05 * sin(uTravel * .04);
 lfC = lfPap * (.92 + .12 * n1); lfK = 0.; lfT = 0.;
 float shade, flake = lfS(.7, .74, .5 * n2 + .5 * n1);
 // the clouds hide what is under them
 float d = lfCloud(at, .45 * uLevel + .45 * uDrone + (snow ? .3 : 0.), snow);
 shade = sat(1. - 25. * d);
 if (d > -.005) {
  lfPp = uRes.y * zoom / 1.1; lfPx = 1. / lfPp;
  vec2 ab = vec2(hp.x * lfB.y - hp.y * lfB.x, lfA.x * hp.y - lfA.y * hp.x) / lfDet;
  if (snow) lfGarden(gp, ab, n1);
  if (!snow && (ab.y > lfV || ab.y < -lfD - lfE)) {
   lfC *= mix(vec3(1), vec3(.82, .9, .7), lfS(.3, .85, n1 + .35 * (n2 - .5)));
   float run = ab.y - .05 * sin(ab.x * 5.);
   lfWater((abs(run - .5) - .05 - .07 * uOwn[5] - .015 * sin(ab.x * 9.)) * lfDet, vec2(ab.x, run));
   lfGrass(gp);
  }
  if (ab.y < lfV + .12) lfHouse(hp, ab);
  vec2 q = gp + vec2(min(.66, .34 * uRes.x / uRes.y), .48);
  if (snow && q.x > -.32 && q.x < .56 && q.y < (q.x < -.12 || q.x > .2 ? .6 : .72) && (q.y > .12 || abs(q.x - .04) < .16)) lfPlum(q);
  lfC = mix(lfC, snow ? vec3(.7, .69, .66) : lfPap * .9, .5 * flake * (1. - .6 * lfT));
  lfK *= 1. - .5 * flake;
  lfC *= (.96 + .08 * n2) * (1. - .35 * shade * shade);
  lfC *= mix(vec3(1), vec3(.4, .46, .62), lfNt * lfS(.95, .5, lfC.r - .3 * lfC.b + .1));
 }
 lfPp = uRes.y / 1.1; lfPx = 1. / lfPp;
 float cl = lfIn(d), by = .8 * lfS(.16, 0., abs(d)) + .25 * lfS(.2, .5, abs(at.y));
 if (d < .004) {
  vec3 gold = vec3(.77, .63, .36) * (.95 + .07 * hash21(floor(at / .11)) + .14 * (n1 - .5) + .08 * (n2 - .5));
  gold = mix(gold, vec3(.57, .37, .22), .7 * lfS(.61, .65, .5 * n1 + .5 * n2));
  gold = mix(gold, vec3(.94, .84, .59), .65 * lfIn(abs(d + .0075) - .002));
  gold = mix(gold, dot(gold, vec3(.36)) * vec3(.82, .88, 1.), .75 * lfNt) * (1. + .08 * uDrone + .12 * uCue);
  lfPut(gold, cl);
  lfInk(.8 * lfLine(d, .0011));
 }
 // flecks of leaf, thick at the clouds' edges
 if (by > .05) {
  vec2 fq = at / .022, fh = hash22(floor(fq) + 11.);
  float fs = .16 * lfS(0., .15, (.12 + .5 * uKeys) * by - .35 * fh.x * fh.x - .02);
  fq = abs(rot(fh.y * 6.) * (fract(fq) - fh * .5 - .25));
  if (fs > .003) lfPut(vec3(.97, .87, .6), lfIn((max(fq.x, fq.y) - fs) * .022));
 }
 if (snow) {
  vec2 q = at / .055 + vec2(.3 * sin(uTime * .3 + at.y * 5.), 0.) + mod(uTime * vec2(.11, .42), vec2(1000.)), id = floor(q), h = hash22(mod(id, 1000.));
  lfPut(vec3(.96), lfSn * lfIn(length(q - id - .25 - .5 * h) * .055 - .0014 - .0026 * h.x * h.x) * lfS(0., .3, .45 + .6 * uTexture - h.y));
 }
 lfC = mix(lfC, mix(lfC, vec3(.93, .87, .82), .25) + .03, lfSp);
 // only the drawing on bare paper, or in gold on blue-black
 if (uOwn[4] != 0.) {
  float l = dot(lfC, vec3(.3, .59, .11)), k = sat(1.5 * lfK);
  vec3 bare = mix(vec3(.9, .87, .8) * (.88 + .16 * l), vec3(.14, .12, .11), max(.95 * k, .75 * lfS(.3, .12, l)));
  vec3 blue = mix(vec3(.045, .06, .13) + vec3(.13, .15, .2) * l * l * 1.5, vec3(.93, .76, .42), max(k, .4 * cl * n2 * (.5 + n1)));
  lfC = mix(lfC, mix(bare, lfC, .9 * lfT), lfS(0., .9, -uOwn[4]));
  lfC = mix(lfC, mix(blue, lfC, .6 * lfT), lfS(0., .9, uOwn[4]));
 }
 return lfC * (.94 + .12 * uTone);
}
