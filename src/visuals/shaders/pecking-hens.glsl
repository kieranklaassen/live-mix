// name: Pecking hens
// a: One paddle
// b: Whole yard
// what: A wooden paddle over a mint table, painted hens in a ring on it with strings to a ball that swings below, so they peck in turn at scattered grain; or a shelf by a pale wall: four hens on crossed slats, two small geese behind, a hare that rocks on a bow, and two large soft hens near the eye.
// follows: Each hen has her kind and pecks deeper as it sounds. Drone swings the ball or works the slats, pad tips the paddle or the far slats, texture, keys and voice hop the grain, phrase rocks the hare; a hit makes a hen peck in a ring of light, a cue runs along the birds; bands lengthen tails and petals; the piece is the grain, or leaves on the shelf.
// own: 0 a lamp at night at -1, low red sun at 1; 1 table or wall brick at -1, deep blue at 1; 2 bare wood at -1, black lacquer at 1; 3 fewer birds at -1, more at 1; 4 the eye low at -1 and from above at 1 in a, farther and closer in b; 5 round chicks at -1, long-necked geese at 1; 6 a lily pond below, or far hills in place of the wall, at -1, checked cloth or painted tiles at 1; 7 black birds before a lit board or a lit paper screen at -1, great wheels of tails at 1
#define phPea sat(uOwn[7])
#define phPup sat(-uOwn[7])
#define phTile sat(uOwn[6])
#define phPond sat(-uOwn[6])
const float phFull = .5 + .48 * clamp(9. * (phPup + sat(-uOwn[2]) + abs(uOwn[4])), 0., 1.); // how much of a pixel a piece fills to hide what is behind it
vec3 phSun, phSunC, phSky; // the way to the sun, its light, the sky's
vec3 phP[5], phT[2], phRed, phWood, phGold; // paints, second colours, combs, wood, beaks
float phEar, phBall, phGo, phCh, phBare, phInk, phDim, phEve;
float phUp(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
// x, resting at whole numbers
float phRest(float x) { float f = floor(x); return f + phUp(.3, .7, x - f); }
float phOn(float d, float w) { return sat(.5 - .5 * d / w); } // cover at d from an edge w soft
float phIn(float d, float w) { return exp(-d * d * w); }
vec3 phLin(vec3 c) { return c * c; }
vec3 phGround(vec3 pale) { return mix(mix(pale, vec3(.72, .35, .25), sat(-uOwn[1])), vec3(.17, .26, .42), sat(uOwn[1])); }
vec3 phLit(vec3 c, vec3 n, float sun, float ao) {
  return phLin(c) * (phSunC * sat(dot(n, phSun)) * sun * 1.15 + phSky * (.72 + .28 * n.y) * ao + vec3(.2, .14, .08) * phSunC * sat(.35 - .65 * n.y) * (1.4 - ao));
}
// How far a neck is down.
float phDip(int k) {
  int i = k % 5; float f = float(k), l = i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : .4 * uLevel;
  float w = .5 + .5 * cos(phBall - TAU * .2 * f), c = (.7 - uCue - .09 * f) / .15, b = max(1. - c * c, 0.);
  float d = w * w * w * (1.05 * l + .08 * uLevel) * (.7 + .6 * uEnergy) + .04 * sin(uTime * .23 + f * 2.4) + 1.1 * b * b;
  return clamp(d + (i == 4 ? 4.4 * uHits * (1. - uHits) : 0.) + (k == 2 ? .1 : 0.), -.12, 1.1);
}

// A hen of seven pieces, facing x.
vec4 phAt, phTurn, phTu; // her place and size; her turn and softness; that of the one met
vec3 phO, phD, phW; // the ray in her lengths, its softness
vec3 phQ, phN, phHit, phV; vec4 phC; mat2 phF; // what is met
float phFar, phS, phMiss, phBest, phNeck, phNear, phOff, phMeet, phNext, phMin, phOver = 0.; // phMiss: what is before the sun; phOver: what is over a body
int phI, phK; // piece and hen met
void phCut(vec3 o, vec3 d, vec3 r) {
  phV = 1. / r; phMin = min(r.x, min(r.y, r.z)); vec3 O = o * phV, D = d * phV;
  float dd = dot(D, D), A = 1. / dd, t = -dot(O, D) * A, m = dot(O, O) - t * t * dd;
  phMeet = t - sqrt(max(1. - m, 0.) * A); phHit = o + d * phMeet; phNear = t; phOff = (sqrt(max(m, 0.)) - 1.) * phMin;
}
void phPut(int i, vec3 paint, float cut) {
  float off = max(phOff, cut);
  float t = phMeet * phS, a = phOn(off, phW.x) * step(t, phFar) * phW.z;
  phMiss = max(phMiss, sat(phNear * 50.) * phOn(off, phW.x + phW.y * clamp(phNear, 0., .5)) * (1. - phW.z));
  phC = mix(phC, vec4(paint, 1.), a);
  vec3 n = phHit * phV * phV * phMin; phN = mix(phN, vec3(phF * n.xy, n.z), a);
  if (i > 3) phOver = max(phOver, a);
  if (a > phBest || (a > .5 && uVar > .5)) { phBest = min(a, .5); phQ = phHit; phI = i; if (i == 3) phOver = 0.; phK = -1; if (a > phFull) { phNext = t + .001; if (uVar < .5) phFar = phNext; } }
}
// Four slats of a tail, longer with their bands: how far off, which.
vec2 phFan(vec2 q, int k) {
  float pea = phPea * (1. - phEar), wd = .29 - .06 * pea, a = atan(q.y, q.x - 1e-4) - 1.83 + .83 * pea, i = floor(clamp(a / wd, 0., pea > 0. ? 8.9 : 3.9)), l = length(q), e = a - wd * i - .5 * wd;
  if (pea > 0.) { float g = sat(4. + 5. * pea - i), n = (.145 + .022 * sat(uBands[(4 * k + int(i)) % 16])) * mix(.2, 1., g); return vec2((length(vec2(l - n, l * e) / vec2(n + .02, .012 + .022 * pea)) - 1.) * .03, i); }
  float len = .105 - .04 * phCh + .055 * sat(uBands[(4 * k + int(i)) % 16] * (.6 + uEnergy));
  return vec2((length(vec2(l - len, l * e) / vec2(len + .02, .03)) - 1.) * .03, i);
}
// A hen; or (h 1) a hare, its ears the fan, its haunch the neck.
void phHen(int k, float dip, float h) {
  float sm = 1. - .75 * max(phGo, phCh), al = 1.28 - 1.85 * dip;
  vec2 n = vec2(cos(al), sin(al)), s = vec2(n.y, -n.x), w = phO.xy - vec2(.085, .25), f;
  vec3 N = vec3(dot(w, n) - phNeck, dot(w, s), phO.z), D = vec3(dot(phD.xy, n), dot(phD.xy, s), phD.z), body = phP[k % 5], trim = phT[k % 2], gold = mix(phGold, body, h), r;
  phF = mat2(1.);
  phCut(phO - vec3(.01 * h, .065, 0.), phD, vec3(.09 + .12 * h, .095, .02)); phPut(0, gold, abs(abs(phHit.x) - .027 - .07 * h) - .0135 - .009 * h);
  phCut(phO - mix(vec3(-.085, .235, 0.), vec3(.2, .4, 0.), h), phD, vec3(.38, .38, .026)); f = phFan(phHit.xy, k); phPut(2, trim, f.x + h * step(1.5, f.y) + (phFull - .5) * .1 * (1. - phUp(.03, .13, abs(phD.z))));
  phCut(phO - vec3(-.015, .218, 0.), phD, vec3(.175, .125, .12) + phGo * vec3(.04, -.005, -.015) + phCh * vec3(-.03, .025, .022)); phPut(3, body, -1.);
  phF = mat2(n, s); r = mix(vec3(.044, .058, .017) * sm, vec3(.05), h);
  phCut(N - mix(vec3(.075, -.006 * sm, 0.), vec3(-.25, -.28, 0.), h), D, r); phPut(4, mix(phRed, trim, h), (length(phHit.xy / r.xy) - .84 + .16 * cos(phHit.y / sm * 125.)) * .03 - h);
  phCut(N - vec3(0., .088 + .03 * phGo + .035 * h, 0.), D, vec3(.021, .055, .021) + phGo * vec3(.008, .03, 0.) + h * vec3(.02, -.01, .02)); phPut(5, gold, -1.);
  phCut(N + mix(vec3(.54 * phNeck, 0., 0.), vec3(.28, .14, -.06), h), D, mix(vec3(.5 * phNeck + .055, .064, .064), vec3(.09, .1, .07), h)); phPut(6, mix(mix(body, trim, max(phOn(abs(phHit.x) - .012, phW.x), phOn(.06 - phHit.x, phW.x))), phP[4], h), -1.);
  phCut(N - vec3(.012 - .03 * h, .008 + .06 * h, 0.), D, vec3(.064 + .02 * phCh)); phPut(7, mix(trim, body, h), -1.);
}
float phHens, phStep, phFrom, phN1, phN2; vec2 phHold, phR1, phR2, phS1, phS2; // the ring; the two rows, their step
// Where bird k stands: in a on the ring at g; in b four near, three far, a hare, two close.
vec4 phPlace(int k, vec2 g) {
  float f = float(k), o = uOwn[3];
  if (uVar < .5) return vec4(.64 * g.x, 0., .64 * g.y, (1.04 + .5 * sat(-o) - .12 * sat(o) + .17 * abs(uOwn[5])) * sat(1.5 * (phHens - f) - .5));
  return k < 4 ? vec4(phR1 + f * phS1, 4. + .3 * float(k % 2), .5 * sat(1.25 * (phN1 - f + .8))) : k < 7 ? vec4(phR2 + (f - 4.) * phS2, 1. + .2 * float(k % 2), .26 * sat(1.25 * (phN2 - max(f, 5.) + 4.8))) : k < 8 ? vec4(.66, -.152, 3., .48) : vec4(k < 9 ? vec2(-.95, -.72) : vec2(.9, -.7), 7., 1.25);
}
bool phBy(vec4 a, vec3 o, vec3 d, float r) { o -= a.xyz; o.y -= .27 * a.w; float b = dot(o, d); r *= a.w; return b < r && dot(o, o) - b * b < r * r - 1e-4; }

// a
vec2 phAlong(vec2 q) { return vec2(dot(q, phHold), dot(q, vec2(-phHold.y, phHold.x))); }
float phBoard(vec2 q) {
  vec2 h = phAlong(q);
  return smin(length(q) - 1., length(max(vec2(abs(h.x - 2.2) - 1.3, abs(h.y) - .1 - .06 * phUp(1.2, 2.3, h.x)), 0.)) - .02, .16);
}
// Grain in small cells, in two lots, sown by the piece.
vec4 phGrain(vec2 q, float lot, vec4 sown, float now, float px) {
  vec2 id = floor(q / .08), c = (id + .5) * .08; float h = hash21(id + 3.7), h2 = hash21(id + 19.1);
  vec2 f = q - c - (vec2(h, h2) - .5) * .02, d = normalize(vec2(h2 * 2. - 1., .1 + fract(h * 5.))); f = vec2(dot(f, d), dot(f, vec2(-d.y, d.x)));
  vec3 hue = mix(mix(vec3(.83, .58, .22), vec3(.66, .36, .16), fract(h * 17.)), sown.rgb * .85, .7 * sat(sown.a * 2.)) * (1. + .3 * now + .35 * uKeys * step(.6, h2));
  return vec4(hue, step(dot(c, c), .18) * step(abs(step(.5, h) - lot), .5) * phOn(length(f * vec2(.62, 1.15)) - .0075 - .005 * fract(h * 9.) - .0075 * sat(sown.a * 1.3) - .003 * now, px));
}

// b
vec4 phL; float phB, phDark;
const float PHWALL = -.235, PHFRONT = -.36; // the shelf's back and front
void phLay(float d, vec3 c, float dark) { float a = phOn(d, phB); phL = mix(phL, vec4(c, 1.), a); phDark = mix(phDark, dark, a); }
float phRod(vec2 q, vec2 a, vec2 v) { q -= a; return length(q - v * sat(dot(q, v) / max(dot(v, v), 1e-5))); }
// A row of crossed slats, a cell f.
vec3 phRow(vec2 q, vec2 f, float cells) {
  q += vec2(.5 * cells * f.x, -.028);
  float i = clamp(floor(q.x / f.x), 0., max(ceil(cells), 1.) - 1.), g = phUp(0., 1., cells - i), j = floor(q.x / f.x + .5), w = g > .02 ? .027 : -1.;
  vec2 m = vec2(i + .5, .5) * f, v = g * f * .5, b = vec2(v.x, -v.y);
  return vec3(phRod(q, m - v, 2. * v) - w, phRod(q, m - b, 2. * b) - w, min(length(q - vec2(j * f.x, q.y > .5 * f.y ? f.y : 0.)) + step(j, -.5) + step(cells + .7, j) + step(cells, .3), length(q - m) + step(g, .5)) - .02);
}
// What the hare rocks on.
vec3 phBow(vec2 y, float tilt) {
  vec2 q = rot(tilt) * ((y - vec2(.66, -.312)) / .48 - vec2(0., .63)), h = q + vec2(0., .63);
  return vec3(phRod(h, vec2(-.2, .06), vec2(.33, .29)) - .022, phRod(h, vec2(.2, .06), vec2(-.33, .29)) - .022, length(vec2(length(q) - .6, max(abs(atan(q.x, -q.y + 1e-4)) - .45, 0.) * .6)) - .026);
}
void phSlats(vec3 d, vec3 c) { phLay(d.x, phP[2], .62 + .3 * phUp(0., .04, d.y)); phLay(d.y, c, .95); phLay(d.z, phWood, 1.1); }

vec3 render(vec2 p) {
  bool yard = uVar > .5;
  float o3 = uOwn[3], o4 = uOwn[4], goose = sat(uOwn[5]), high = sat(o4), px = 1. / uRes.y;
  phBall = mod(uTime * .83, TAU); phDim = sat(-uOwn[0]); phEve = sat(uOwn[0]); phBare = sat(-uOwn[2]); phInk = sat(uOwn[2]); phCh = sat(-uOwn[5]);
  phSunC = mix(mix(vec3(1.36, 1.22, .98) * (.94 + .12 * uLevel), vec3(1.6, .9, .46), phEve), vec3(1.3, .82, .4), phDim);
  phSky = mix(mix(vec3(.33, .39, .45), vec3(.27, .25, .4), phEve), vec3(.04, .055, .11), phDim);
  // chalk paints, or bare limewood, or black lacquer
  phP = vec3[5](vec3(.73, .25, .19), vec3(.89, .68, .27), vec3(.31, .5, .35), vec3(.31, .46, .57), vec3(.84, .43, .23));
  for (int i = 0; i < 5; i++) { vec3 c = mix(mix(phP[i], uKind[i], .25), vec3(.83, .7, .52), .94 * phBare); phP[i] = mix(c, vec3(.09, .08, .1) + .12 * c, phInk); if (i > 3) break; }
  vec3 cream = mix(vec3(.95, .9, .79), vec3(.72, .56, .38), .9 * phBare);
  phT[0] = mix(cream, vec3(.93, .42, .15), phInk); phT[1] = mix(cream, vec3(.95, .76, .33), phInk); phWood = mix(vec3(.84, .69, .49), vec3(.36, .25, .17), phInk);
  phRed = mix(vec3(.78, .17, .12), vec3(.74, .5, .36), .8 * phBare); phGold = mix(vec3(.85, .55, .18), phWood, phBare);
  // a: the paddle, the ring of hens, the eye
  float sway = .14 * sin(uTravel * .05), swing = sat(.2 * uLevel + .8 * uDrone), soft = .07 - .04 * uTone;
  phHens = 5. + (o3 < 0. ? 4. : 2.) * o3; phStep = TAU / phHens; phFrom = .6 + sway; phHold = vec2(cos(sway - .9), sin(sway - .9));
  vec2 way = vec2(cos(phBall), sin(phBall)), tip = (.02 + .05 * uPad) * vec2(sin(uTime * .23), sin(uTime * .17)) + .03 * swing * way - .04;
  vec3 up = normalize(vec3(tip.x, 1., tip.y)), bx = normalize(vec3(up.y, -up.x, 0.));
  mat3 toBoard = transpose(mat3(bx, up, cross(bx, up)));
  float el = .5 + (o4 < 0. ? .2 : .85) * o4, ce = cos(el), se = sin(el), az = .06 * sin(uTime * .043) - .05, far = 6.1 + .6 * uSpace + .6 * high;
  vec3 fw = normalize(vec3(-az * ce, -se, ce)), rt = normalize(vec3(fw.z, 0., -fw.x)), tn = toBoard * vec3(0., 1., 0.);
  vec3 ro = toBoard * (vec3(.24, -.29 + .29 * high + .15 * (1. - high) * max(goose, sat(-o3)), .06) - far * fw), rd = toBoard * normalize(fw * 2.95 + rt * p.x + cross(fw, rt) * p.y);
  float zoom = 1. + (o4 < 0. ? .36 : .5) * o4, tilt = .025 * sin(uTime * .37) + .2 * uPhrase * sin(uTime * .83), base = -.3125;
  float th = .5 + .03 * sin(uTime * .13) + .22 * uDrone * sin(uTime * .31), th2 = .6 + .14 * uPad * sin(uTime * .27);
  vec2 mid = mix(vec2(0., -.22), vec2(-.42, .05), high), y = (p - mid) / zoom + mid, f1 = .66 * vec2(cos(th), sin(th)), f2 = .66 * vec2(cos(th2), sin(th2)), at1 = vec2(-.28, base), at2 = vec2(.36 - .05 * o3, PHWALL - .025);
  phN1 = phRest(3. + 2. * min(o3, 0.)); phN2 = phRest(1. + o3); phS1 = vec2(.5 * f1.x, 0.); phS2 = vec2(.26 * f2.x, 0.); phR1 = at1 - .5 * phN1 * phS1 + vec2(0., .5 * f1.y + .02); phR2 = at2 - .5 * phN2 * phS2 + vec2(0., .26 * f2.y + .01);
  phSun = normalize(mix(mix(vec3(-.68, .6, -.22), vec3(-.9, .35, -.12), phEve), vec3(-.45, .78, -.3), phDim));
  if (yard) { px /= zoom; ro = vec3(y, 10.); rd = vec3(0., 0., -1.); phSun = normalize(phSun * vec3(.9, 1., -2.3)); }
  else { px *= far / 2.95; rd.y = min(rd.y, -.02); phSun = toBoard * phSun; }

  // under the hens: the board or the table; in b where this shadow comes from
  float ry = min(rd.y, -.02), pw = px / max(-ry, .2);
  vec2 c = ro.xz - rd.xz * (ro.y / ry), hq = phAlong(c), u = vec2(cos(phStep), sin(phStep)), g = vec2(cos(phFrom + 7. * phStep), sin(phFrom + 7. * phStep));
  float dt = phBoard(c), side = phOn(min(dt, phBoard(c - rd.xz * (.085 / ry))), pw), face = phOn(dt, pw), r = length(c);
  vec3 q = ro + rd * ((-1.36 - dot(ro, tn)) / min(dot(rd, tn), -.02)), here = face > .01 ? vec3(c.x, .001, c.y) : q, from = yard ? rd : phSun;
  bool wall = y.y > PHWALL; float deep = sat((PHWALL - y.y) * 8.), rise = max(y.y - PHWALL, 0.), ds = max(.62 - deep, 0.), w1 = .016 - .008 * uTone + .02 * ds;
  vec2 fall = mix(vec2(.17, -.11), vec2(.32, -.06), phEve), s1 = vec2(y.x - fall.x * ds, rise - fall.y * ds + at1.y);

  // the hens before the eye and before the sun
  highp int list = 0;
  for (int k = yard ? 9 : 6; k >= 0; k--) {
    g = vec2(dot(g, u), g.y * u.x - g.x * u.y); vec4 a = phPlace(k, g); float reach = k < 8 ? .46 + .12 * (yard && k > 3 ? 1. : .7 * goose) : .5;
    if (list < 33554432 && phBy(a, ro, rd, reach)) list = (list << 5) + k + 1;
    if (list < 33554432 && (yard ? (k < 4 || k == 7) && y.y > PHFRONT : k < 7) && phBy(a, yard ? vec3(s1, 10.) : here, from, (yard ? .5 : .46) + .05 * goose)) list = (list << 5) + k + 17;
    if (k < 1) break;
  }
  phC = vec4(0.); phMiss = phBest = 0.; phQ = phN = vec3(0.); phFar = phNext = 1e4; phK = phI = 0; int kind = 0; phTu = vec4(1., 0., -1., px);
  for (int n = 0; n < 6; n++) {
    int b = (list & 31) - 1, k = max(b, 0) & 15; if (b < 0) phFar = -1e5; bool shade = b > 15, fore = k < 4 || k == 7, hare = yard && k == 7; list >>= 5;
    float ang = phFrom + phStep * float(k); phAt = phPlace(k, vec2(cos(ang), sin(ang))); float face = k == 9 ? -1. : k > 6 || k % 2 == 0 ? 1. : -1.;
    phTurn = yard ? vec4(face, 0., -face, fore ? px * 2.2 : k > 7 ? .013 + .016 * uSpace : px * 4. + .008) : vec4(-phAt.xz / .64, 1., px / max(phAt.w, .05));
    vec2 z = vec2(phTurn.y, -phTurn.x) * phTurn.z; vec3 o = ((!shade ? ro : yard ? vec3(s1, 10.) : here) - phAt.xyz) / phAt.w, d = shade ? from : rd;
    phO = vec3(dot(o.xz, phTurn.xy), o.y, dot(o.xz, z)); phD = vec3(dot(d.xz, phTurn.xy), d.y, dot(d.xz, z)); phS = phAt.w;
    if (hare) phO.xy = rot(-tilt) * (phO.xy + vec2(0., .3)) - vec2(0., .3);
    phGo = !yard || k < 4 || k == 8 ? goose : k == 9 ? .5 : hare ? 0. : 1.; phNeck = .17 + .15 * phGo - .06 * phCh;
    phW = !shade ? vec3(phTurn.w, 0., 1.) : yard ? vec3(w1, 0., 0.) : vec3(.004, soft, 0.);
    int who = !yard ? k : k < 4 ? k + 1 : k < 7 ? k - 2 : hare ? 1 : 3 * k - 19;
    phEar = hare ? 1. : 0.; phHen(who, hare ? 0. : phDip(who) * (yard && k > 7 ? .35 : 1.), hare ? 1. : 0.); if (phK < 0) { phK = k; phTu = phTurn; kind = who; }
    if (yard) phFar = min(phFar, phNext);
    if (list < 1) break;
  }
  // her paint
  float cov = phC.a, spark = uHits * uHits, e = phTu.w * .8 + .001; bool hare = yard && phK == 7, close = yard && phK > 7;
  vec3 c3 = phC.rgb / max(cov, .001), q3 = phQ, hn = normalize(phN + 1e-4), trim = phT[kind % 2];
  hn.xz = hn.x * phTu.xy + hn.z * phTu.z * vec2(phTu.y, -phTu.x);
  vec2 w = vec2(.95 * q3.x - .3 * q3.y + .028, .3 * q3.x + .95 * q3.y + .01), dq = vec2(fract(atan(abs(q3.z), q3.y + 1e-4) * 2.55) - .5, (q3.x - .1) * 26.), fan = vec2(0.); phEar = hare ? 1. : 0.; fan = phFan(q3.xy, kind);
  float str = phUp(-.3 - 40. * e, .3 + 40. * e, sin(w.y * 165. + w.x * 22.)) * phUp(.06, -.06, w.x), wing = phOn((length(w / vec2(.1, .06)) - 1.) * .06, e) * step(.03, abs(q3.z));
  if (phI == 2) c3 = mix(trim, phP[kind % 5], mod(fan.y, 2.)) * (1. - .3 * phUp(-.012, 0., fan.x));
  if (phI == 2 && phPea > 0. && !hare) c3 = mix(mix(c3, phP[(kind + 2) % 5], phPea * phOn(length(vec2(length(q3.xy) - .262, .6 * fan.x + .012)) - .03, e)), phT[1], phPea * phOn(abs(length(q3.xy) - .2) - .01, e));
  if (phI == 3 && !hare) c3 = mix(c3, mix(mix(c3, mix(trim, c3 * .55, str), wing), trim, phOn(length(dq) - .3, 20. * e) * (1. - wing)), sat(1. - 2. * phOver));
  if (phI == 7) c3 = mix(mix(c3, hare ? c3 : phRed, phOn(length(q3.xy - vec2(-.034, .042)) - .028, e) * phOn(length(q3.xy) - .064, e)), vec3(.06), phOn(length(q3.xy - vec2(.016, .014)) - .0125, e));
  vec2 rub = cov > .5 ? q3.xy * 20. + q3.z * 9. + float(phK) * 3. : yard ? y * 42. : c * 8., hw = yard ? y * vec2(2., 6.) : side > .01 ? hq : q.zx * vec2(.5, .3);
  float w2 = .6 * noise(rub) + .4 * noise(rub * 3.1), worn = .75 * phUp(.58, .7 + 3. * e * cov, w2) * (1. - .7 * phInk), grow = noise(vec2(hw.x * 1.2 + 3., hw.y * 12. + .8 * sin(hw.x * 1.7)));
  c3 = mix(c3, phWood, worn * (close ? 0. : 1.));
  vec3 col, henC = phLit(c3, hn, 1., yard ? 1. : .55 + .45 * sat((ro.y + rd.y * phFar) / .3)) + phSunC * .25 * phInk * pow(sat(dot(hn, normalize(phSun - rd))), 24.);
  henC += phLin(c3) * phLin(uKind[4]) * spark * .8 * float(kind == 4);
  float turn = atan(c.y, c.x + 1e-4) / TAU;
  vec2 uv = vec2(y.x / 1.7 + .5, (PHFRONT - .012 - y.y) / .12), gg = uv * vec2(44., 3.), id = floor(gg);
  vec4 m = piece(yard ? (id + .5) / vec2(44., 3.) : vec2(fract(turn + .5), 1. - sat(r / .42))); m.rgb /= max(m.a, .02);
  if (!yard) {
    float an = fract(turn - (sway - .9) / TAU), seg = an * 16., paint = (.9 - .75 * phBare) * phUp(.78, .5, w2), open = 1. - phMiss; int si = int(min(seg, 15.));
    vec3 wood = mix(vec3(.86, .72, .53), vec3(.73, .54, .34), .8 * grow * grow) * mix(vec3(1.), vec3(.46, .31, .24), phInk), fa = wood, pale = phGround(vec3(.68, .79, .73)), leaf = mix(phP[2], phT[1], phInk), ball = -1.08 * tn + .36 * swing * vec3(way.x, 0., way.y);
    vec3 gr = normalize(vec3(mix(c / max(r, 1e-4), vec2(-phHold.y, phHold.x) * sign(hq.y), phUp(1., 1.2, hq.x)) + 1e-5, .1).xzy), top = vec3(0.);
    if (side > 0.) {
    // sixteen petals, the rim, a thin ring
    float len = .05 + .06 * sat(uBands[si] * (.7 + uEnergy)), lx = (fract(seg) - .5) * TAU / 16. * r, ly = (r - .935 + len) / len;
    fa = mix(fa, si % 2 == 0 ? leaf : phRed, paint * phOn(abs(lx) - .045 * sqrt(max(1. - ly * ly, 0.)) * (.75 + .45 * ly), pw) * step(abs(ly), 1.));
    fa = mix(mix(fa, phRed, paint * phOn(abs(r - .975) - .017, pw)), leaf, paint * phOn(abs(r - .45) - .006, pw));
    // the piece as grain
    float hop = .004 + (.1 * uTexture + .06 * uKeys + .08 * uMic) * abs(sin(uTime * 1.7)) + .5 * uHits * (1. - uHits), now = phIn(fract(turn - uLoop) - .5, 160.) * sat(uLevel * 2.);
    
    vec4 g0 = phGrain(c, 0., m, now, pw), g1 = phGrain(c + rd.xz / rd.y * hop, 1., m, now, pw);
    fa = mix(fa, g0.rgb, g0.w);
    float nk = floor(fract(turn - phFrom / TAU) * phHens + .5), na = phFrom + phStep * nk, on = nk > phHens - .5 ? 1. : phUp(.35, 1., phHens - nk), five = phFrom + phStep * min(ceil(phHens) - 1., 4.);
    vec2 f = vec2(cos(na), sin(na)), hv = c - .34 * vec2(cos(five), sin(five));
    fa = mix(fa, vec3(.16, .1, .07), step(.1, on) * phOn(length(c - .5 * f) - .012, pw));
    // a hit: light where the last hen pecks; a cue runs round the rim
    float hr = length(hv), run = hr - .06 - .5 * (1. - uHits), cu = fract(an + uCue + .5) - .5;
    spark = spark * (.7 * phIn(run, 400.) + .7 * phIn(hr, 40.)) + uCue * (.9 * phIn(cu, 50.) + .15) * phUp(.75, .9, r) * phUp(1.08, 1., r);
    vec3 light = phSunC * sat(phSun.y) * 1.3 * open * mix(1., phIn(r, .15), phDim), glow = mix(phSunC, phLin(uKind[4]) * 2.5, .5) * spark + phSky * (1. - .45 * on * phIn(length(c - .64 * f), 40.));
    top = mix(phLin(fa) * (light + glow), phLin(g1.rgb) * (light + glow), g1.w) * (1. + .2 * phUp(-.03, -.004, dt) * sat(dot(gr.xz, phSun.xz)));
    }
    if (side < 1.) {
    // the table, the ball on its strings
    vec3 oc = ro - ball, bo = q - ball; float b2 = dot(oc, rd), miss = sqrt(max(dot(oc, oc) - b2 * b2, 0.)), onBall = phOn(miss - .165, px);
    vec3 v3 = oc - rd * b2, bp = v3 - rd * sqrt(max(.0272 - miss * miss, 0.)), ps = onBall > .5 ? ball + bp : q; ps += phSun * (-ps.y / max(phSun.y, .1));
    float rope = dot(v3, tn) / ce, lean = dot(v3, toBoard * rt) / max(abs(rope), .05) * .95 + ball.x, line = abs(fract(lean / .2 + .5) - .5) * .2 * rope + step(.1 * phHens, abs(lean)) + step(rope, .1) + step(1., rope);
    float qq = length(q.xz), bar = dot(q.xz, vec2(.86, .5)), win = phUp(2.4, 2.7, bar) - phUp(2.9, 3.2, bar) + phUp(-1.9, -2.3, q.x * .86 - q.z * .3);
    float past = phUp(-soft, soft, phBoard(ps.xz)), sun = past * open * phUp(.14, .18, length(bo - dot(bo, phSun) * phSun)) * (1. - .85 * (1. - phDim) * sat(win));
    if (phTile > 0.) {
      // a checked cloth
      vec2 tc = rot(.55) * q.xz / .42, tw = abs(fract(tc) - .5) - .25; float pt = pw / .42;
      vec2 on = vec2(sat(.5 - tw.x / pt), sat(.5 - tw.y / pt)); float thr = .9 + .14 * (noise(vec2(tc.x * 30., tc.y * 6.)) + noise(vec2(tc.x * 6., tc.y * 30.)) - 1.) * sat(1.4 - 20. * pt);
      pale = mix(pale, mix(mix(vec3(.96, .93, .86), phGround(phP[3]), .1 + .39 * (on.x + on.y)) * thr, pale, .1), phTile);
    }
    col = phLin(pale * (.95 + .06 * grow)) * (phSunC * 1.2 * dot(tn, phSun) * sun * mix(1., phIn(qq, .16), phDim) + phSky * (1.15 - .5 * phIn(qq, .9)));
    if (phPond > 0.) {
      vec2 z = q.xz - ball.xz, id = floor(q.xz / .74), h = hash22(id + 5.), pc = (id + .5 + .22 * (h - .5)) * .74 + .015 * vec2(sin(uTime * .31 + h.x * 9.), cos(uTime * .27 + h.y * 9.)); float rb = length(z), rw = length(q.xz - pc), rr = .17 + .13 * h.y, ang = atan(q.z - pc.y, q.x - pc.x + 1e-5) + h.x * 6.;
      float rip = sin(rb * 24. - uTime * 1.4) * exp(-1.3 * rb) * (.6 + .6 * uDrone) + 1.1 * (noise(q.xz * vec2(1.1, 3.2) + vec2(uTime * .12, 0.)) - .5) + .25 * (noise(q.xz * vec2(3., 11.) - uTime * .2) - .5);
      vec3 wat = mix(phLin(phGround(vec3(.23, .37, .34))) * .5 * (phSky + .4 * phSunC * sun), phSky * .9 + phSunC * .28 * sun, phUp(-.2, .9, rip) * .6);
      float lily = phOn(rw - rr, pw) * step(.3, h.x) * (1. - phOn(abs(sin(.5 * ang)) * rw - .022, pw));
      vec3 lf = mix(vec3(.36, .52, .3), vec3(.56, .6, .33), h.y) * (.86 + .14 * noise(vec2(ang * 5., rw * 4.))) * (1. - .25 * phUp(rr - .03, rr, rw));
      wat *= 1. - .5 * step(.3, h.x) * phOn(length(q.xz - pc - vec2(.05, -.03)) - rr - .01, .05) * (1. - lily);
      wat = mix(wat, phLin(lf) * (phSunC * 1.2 * sun * mix(1., phIn(qq, .16), phDim) + phSky), lily);
      wat += phLin(uKind[4]) * uHits * uHits * .9 * phIn(rb - .45 - 1.3 * (1. - uHits), 30.);
      col = mix(col, wat, phPond);
    }
    col = mix(col, vec3(.17, .13, .08) * phSunC, .9 * phOn(line - .006, px));
    col = mix(col, phLit(mix(phWood, phRed, .9 * phOn(abs(bp.y) - .035, px)), bp / max(length(bp), 1e-4), past, 1.), onBall);
    }
    vec3 edgeC = phLit(wood, gr, .8, .9);
    if (phPup > 0.) {
      // lit from within
      vec3 in_ = phLin(fa) * mix(vec3(1., .8, .5), phP[1], .2) * (2.5 - 1.1 * r) * (.75 + .4 * uLevel) + phLin(uKind[4]) * uHits * uHits * phIn(r - 1.1 * (1. - uHits), 14.);
      top = mix(top, in_, phPup * .95); edgeC = mix(edgeC, phLin(fa) * vec3(.9, .5, .22), .9 * phPup);
      col *= 1. - .9 * phPup; col += phPup * vec3(.24, .14, .06) * phIn(max(length(q.xz) - 1.0, 0.), .9);
    }
    col = mix(col, mix(edgeC, top, face), side);
  } else {
    vec3 d1 = phRow((s1 - at1) / .5, f1, phN1), d3 = phBow(s1, tilt);
    float open = 1. - max(phMiss, phOn(min(min(d1.x, d1.y), min(d3.x, min(d3.y, d3.z))), w1) * step(.001, ds));
    float wl = y.x + .55 * y.y, win = phUp(-.95, -.86, wl) * phUp(.99, .9, wl) * (1. - .8 * phUp(.02, 0., abs(wl - .3) - .014)), sweep = wl + 1.2 - 2.6 * (1. - uCue);
    vec3 alb = wall ? phGround(vec3(.9, .885, .84)) * (.96 + .02 * grow + .03 * w2) : mix(mix(vec3(.54, .68, .58), phWood, .6 * phUp(.5, .75, grow)), vec3(.2), .6 * phInk);
    if (wall && phTile > 0.) {
      vec2 tu = y / .178, ti = floor(tu), tf = fract(tu) - .5; float pt = px / .178, edge = .5 - max(abs(tf.x), abs(tf.y)), corner = length(abs(tf) - .5), hh = hash21(ti + 4.), pe = atan(tf.y, tf.x + 1e-5);
      vec3 tl = mix(vec3(.95, .93, .87), vec3(.9, .88, .83), hh), ink = mix(phGround(phP[3]), phGround(phP[int(hh * 4.9)]), .45);
      tl = mix(tl, ink, phOn(abs(corner - .3) - .04, pt)); tl = mix(tl, ink, phOn(length(tf) - .05, pt)); tl = mix(tl, ink, phOn(length(tf) - .2 - .07 * cos(4. * pe), pt) * phOn(.14 - length(tf), pt));
      tl = mix(tl, phP[1], .8 * phOn(abs(tf.x) + abs(tf.y) - .075, pt));
      tl *= .95 + .08 * noise(tu * 3.); tl = mix(tl, vec3(.7, .67, .6), phUp(.03 + pt, .012, edge));
      alb = mix(alb, tl, phTile);
    }
    col = phLin(alb) * (phSunC * (wall ? .68 : .78) * (.06 + .94 * open * mix(1., win, .75 * (1. - phDim))) * (1. + .4 * uCue * phIn(sweep, 26.)) + phSky * (1. - .3 * exp(-abs(y.y - PHWALL) * 30.)));
    if (wall && phPond > 0.) {
      // far hills
      float up = y.y - PHWALL; vec3 hz = mix(mix(vec3(.96, .86, .66), vec3(1., .66, .38), phEve), vec3(.2, .24, .36), phDim), zen = mix(mix(vec3(.42, .62, .78), vec3(.5, .45, .6), phEve), vec3(.03, .05, .12), phDim);
      vec3 sk = mix(hz, zen, phUp(.02, .75, up)); float sd = length(y - vec2(.3, .23)); sk += (hz + .1) * (.32 * phOn(sd - .06, px * 3.) + .25 * phIn(sd, 12.) + .5 * uCue * phIn(sweep, 12.));
      for (int i = 0; i < 4; i++) {
        float fi = float(i), hx = y.x * (2.1 + .5 * fi) + fi * 7.3 + .004 * uTime * (fi + 1.), top = .33 - .085 * fi + (.14 - .02 * fi) * (noise(vec2(hx, fi)) - .3) + .012 * noise(vec2(hx * 7., fi)) + .012 * phUp(.35, .8, noise(vec2(hx * 30., fi + 3.)));
        vec3 hc = mix(mix(zen, hz, .5 - .1 * fi), phGround(mix(vec3(.42, .52, .4), phP[i], .3)), .22 + .2 * fi) * (1. - .05 * fi) * mix(1., .4, phDim);
        sk = mix(sk, hc * (.9 + .15 * sat((top - up) * 5.)), phOn(up - top, px * 1.5));
      }
      col = mix(col, phLin(sk) * 1.1, phPond);
    }
    if (phPup > 0.) {
      float gl = phIn(length((y - vec2(.1, .12)) * vec2(.75, 1.)), 1.7); vec3 paper = phLin(phGround(vec3(.98, .86, .62))) * (.28 + 1.0 * gl) * (.92 + .1 * noise(y * vec2(160., 9.)) * .6 + .1 * w2) * (.8 + .35 * uLevel);
      paper *= 1. - .35 * phOn(abs(fract(y.x / .62 + .15) - .5) * .62 - .006, .004) - .3 * phOn(abs(y.y - .13) - .004, .004);
      col = mix(col, wall ? paper + .5 * spark * phIn(length(y - vec2(.05, -.06)), 12.) : col * .16 + paper * .05, phPup);
    }
    // the shelf's edge, painted with the piece
    vec2 f = rot(.7 - 1.4 * mod(id.x, 2.)) * ((gg - id - .5) * vec2(1.7 / 44., .04));
    float now = phIn(fract(uv.x - uLoop + .5) - .5, 196.), leaf = length(f * vec2(1., 2.1)) - .006 - .01 * sat(m.a * 1.4) - .002 * now;
    vec3 fr = mix(phGround(vec3(.3, .46, .43)), phWood, worn * .8);
    fr = mix(fr, mix(phT[1], m.rgb, .6 * sat(m.a * 2.)), step(0., uv.y) * step(uv.y, 1.) * phOn(leaf, px * 1.5) * .9);
    fr = phLin(fr) * (phSunC * .5 * (1. + .6 * now * uLevel) + phSky * .8) * (1. - .35 * phUp(PHFRONT - .1, -.6, y.y));
    fr *= 1. - .85 * phPup;
    col = mix(col, fr, phOn(y.y - PHFRONT, px)) * (1. + .5 * phUp(2.5 * px, 0., abs(y.y - PHFRONT)));
    phL = vec4(0.); phDark = 1.; vec3 bow = phBow(y, tilt); vec2 cell = (y - at1) / .5;
    phB = (px + .002) / .26; phSlats(phRow((y - at2) / .26, f2, phN2), phP[0]);
    phB = px * 2.2; phLay(bow.z, phRed, .85); phSlats(vec3(bow.xy, 1.), phP[3]); phSlats(phRow(cell, f1, phN1), phP[int(abs(mod(floor(cell.x / f1.x + .5 * phN1), 2.)))]);
    col = mix(col, phLit(mix(phL.rgb / max(phL.a, .001), phWood, worn), vec3(0., .1, .995), phDark, phDark) * (1. - .93 * phPup), phL.a);
    float cx = (y.x + .9) / .026, ci = floor(cx), h = hash11(ci + 3.), hop = (.06 * uTexture + .1 * uKeys + .1 * uMic) * abs(sin(uTime * 1.6 + h * 20.)) + .25 * uHits * (1. - uHits) * h;
    vec2 gp = vec2((cx - ci - .5) * .026 - .008 * (h - .5), y.y - base + .012 + .02 * fract(h * 17.) - hop);
    col = mix(col, phLin(mix(vec3(.9, .66, .28), vec3(.72, .42, .2), h)) * (phSunC * .9 + phSky), phOn(length(gp * vec2(.7, 1.)) - .005, px) * step(.4, h));
    // a hit: light at the fourth hen; at night a lamp
    float hd = length(y - vec2(.05, -.06)), run = hd - .05 - .2 * (1. - uHits);
    vec3 lamp = (1. + phLin(uKind[4]) * spark * (2. * phIn(hd, 80.) + 1.2 * phIn(run, 900.))) * mix(1., 1.25 * phIn(length(y - vec2(-.3, .05)), 2.4), phDim);
    col *= lamp; henC *= close ? vec3(1. - .65 * phDim) : lamp;
  }
  henC *= 1. - .93 * phPup;
  col = mix(col, henC, cov);
  return sqrt(max(col, 0.) / (1. + .16 * max(col, 0.)));
}
