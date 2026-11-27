// name: Urchin shells
// a: On sand
// b: Lit inside
// what: Five bare sea-urchin shells lie on pale sand in low side light, dusty violet, olive, rose and cream, their rows of round knobs running from fat at the girth to dust at the crown, one hollow side up. Or one broken shell from inside, its wall glowing, daylight coming through every pore and falling as dots on the sand.
// follows: Each kind is one shell, or a fifth of the wall (texture also the violet bands): knobs swell and take its colour from the girth up, or its pores do. The spectrum runs up the rows. A hit sends a ring up the shells; a cue brings the light lower and warmer and back. The piece tints the sand, high notes and keys wink in its grains, the loop swings the sun.
// own: 0 1 the eye low along the sand (b: in the mouth, looking up into the dome), -1 straight above; 1 1 a crowd of small shells (b: a low broken bowl), -1 one great shell alone (b: nearly whole); 2 1 tall, -1 flat as a coin; 3 1 knobs grown to long blunt spines (b: every knob a round window), -1 worn smooth; 4 ground: 1 white and even, -1 dark and wet in the drone's colour; 5 1 dyed in the sounds' colours, -1 dark glaze; 6 1 night and lit from within, -1 noon; 7 1 in shallow water with moving nets of light, -1 half buried in wind ripples
const float UC_ROW = .235; // height of a row of knobs
const float UC_Q = .67;   // how squashed the shells are
const float UC_5 = TAU / 5.;
vec3 ucL, ucLd, ucSun, ucSky; // to the sun, that squashed, its colour, the sky's
float ucGain, ucLv, ucRing, ucHole; // of the shell in hand: its sound, its hit, how wide its opening is
float ucTg;
// Its own numbers, known beforehand: squash, spines, worn, night, dyed, glazed.
const float ucQ = UC_Q * exp2(uOwn[2] * (uOwn[2] > .0 ? .75 : 1.5)), ucSp = max(uOwn[3], .0), ucOld = 1. - max(-uOwn[3], .0), ucNight = max(uOwn[6], .0), ucDye = max(uOwn[5], .0), ucDark = max(-uOwn[5], .0);
const float ucMany = max(uOwn[1], .0), ucOne = max(-uOwn[1], .0), ucDeep = max(-uOwn[7], .0), ucLie = max(uOwn[0], .0), ucTop = max(-uOwn[0], .0);
const bool ucMore = uOwn[0] != .0 || uOwn[1] > .0 || uOwn[2] > .0 || uOwn[3] > .0; // one before another
const vec3 UC_LAMP = vec3(1.,.72,.44);
vec3 ucWarm = vec3(.0); // lamplight on the sand
vec3 ucRo, ucRd;         // the eye, and its look
float ucWide = 1.;
vec3 ucTo(vec3 c, float k) { return mix(vec3(1.), c, k); }
// A soft step from a to b, whichever is the larger.
float ucS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float ucBell(float x) { x = max(1. - x * x * .3, .0); return x * x * x; }
float ucHear(int i) { return sat((i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : .0) * ucGain); }
// How much a row of knobs answers; n counts rows up from the girth.
float ucAmt(float n) {
 float a = ucLv * ucS(-2., 1.5, ucLv * 10. - n);
 return a + ucRing * ucBell((n - 11.5 * (1. - uHits)) / 1.5) * 1.6;
}
// A shell's own map: across a fifth, and up and down; round stays round.
float ucFifth;
vec2 ucMap(vec3 d) {
 float ph = atan(d.z, d.x + 1e-6) / UC_5 + .5;
 ucFifth = floor(ph);
 return vec2((ph - ucFifth - .5) * UC_5, .5 * log((1. - d.y + 1e-4) / (1. + d.y + 1e-4)));
}
// How far the nearest pin hole is (they lie in pairs), and its row.
float ucPore(vec2 m, out float rw) {
 float ax = abs(m.x), v = m.y / UC_ROW * 4. + (ax > .425 ? .25 : .0);
 rw = floor(v);
 return length(vec2(abs(ax - .425) - .0265, (v - rw - .5) * UC_ROW * .25));
}
// The seams between the plates.
float ucSeam(vec2 m, float w) {
 float v = m.y / UC_ROW, dz = abs(fract(v + (m.x > .0 ? .0 : .5)) - .5) * UC_ROW, zig = abs(m.x + .02 * (abs(fract(v) - .5) * 4. - 1.));
 return max(ucS(.017 + w, .0, dz) * step(abs(m.x), .39), ucS(.017 + w, .0, zig));
}
// The nearest big knob: from its middle, in radii; its radius and row.
vec2 ucKnob(vec2 m, out float R, out float n) {
 float ax = abs(m.x), sd = m.x > .0 ? .5 : .0;
 bool wide = ax < .41;
 float row = wide ? UC_ROW : UC_ROW * .74, v = m.y / row + sd, i = floor(v);
 n = -(i + .5 - sd) * (wide ? 1. : .74);
 R = (wide ? .102 : .066) * (1. + .26 * min(ucAmt(n), 1.4));
 return vec2((ax - (wide ? .222 : .548)) * (m.x > .0 ? 1. : -1.), (v - i - .5) * row) / R;
}
// How far a place in the direction q, L out from the middle, is from the shell and its spines.
float ucFar(vec3 q, float L) {
 float R, n, s = sqrt(max(1. - q.y * q.y, .0)), r = length(ucKnob(ucMap(q), R, n));
 float h = L - 1. - R * (.5 * ucS(1., .3, r) + .28 * sqrt(max(.0, 1. - r * r * 9.))) * ucOld * s;
 if (ucSp > .0) {
 float len = ucSp * s * ucS(.28, .5, s) * (R > .09 ? .72 : .5) * (.8 + .3 * min(ucAmt(n), 1.4));
 h = min(h, max(R * s * (r * L - .46 + .23 * sat((L - 1.) / max(len, 1e-3))), L - 1. - len));
 }
 return h;
}
// Nets of light on the floor of shallow water.
float ucNet(vec2 w) {
 float t = uTime * .11, a = 1. - abs(noise(w * 1.2 + vec2(t, .7 * t)) + noise(w * 1.45 + vec2(9. - t, .8 * t)) - 1.), b = 1. - abs(2. * noise(w * 2.3 + a * .6 - t) - 1.);
 a *= a * a * a;
 return .4 + 1.9 * a * a + .9 * a * b * b * b;
}
mat3 ucFrame(vec3 ax, float turn) {
 vec3 e = normalize(cross(ax, vec3(.31, .02, 1.))), g = cross(e, ax);
 float c = cos(turn), s = sin(turn);
 return mat3(e * c + g * s, ax, g * c - e * s);
}
vec3 ucC; float ucD; // how the last shadow lay
// Soft shadow of a shell.
float ucShade(vec3 q, vec4 s, float k) {
 vec3 oc = (q - s.xyz) * vec3(1., 1. / ucQ, 1.) / s.w;
 float b = dot(oc, ucLd), dd = sqrt(max(dot(oc, oc) - b * b, .0)) - 1.;
 ucC = oc - b * ucLd; ucD = b > -.02 ? 9. : dd;
 return -b < .02 ? 1. : ucS(-.5, .5, dd / (k * max(-b, .02) + .02));
}
// The sand at a place: its colour under a light, gw its grains.
vec3 ucSand(vec2 w, vec2 gw, float sharp, float lit, float amb, vec3 tint) {
 vec2 e = normalize(ucL.xz);
 float mid = .5 + .5 * sin(w.x * .9 + 1.7 * sin(w.y * .7 + .5));
 vec2 o = vec2(w.x * .5 + w.y * .28, w.y * 1.1 - w.x * .3) * 1.5 + .9 * mid;
 float rake = noise(o) - noise(o + e * vec2(.11, .2));
 const float drift = ucDeep, pale = max(uOwn[4], .0), wet = max(-uOwn[4], .0);
 if (drift > .0) {
 float rp = w.x * 5.2 + w.y * 1.6 + 2.6 * noise(w * .8) + 1.2 * noise(w * 2.2 + 7.);
 rake += drift * (.34 + .3 * mid) * (cos(rp) - .4 * cos(2. * rp)) * sat(sharp * 1.5);
 }
 rake *= 1. - .8 * pale; sharp *= 1. - .75 * pale;
 float g1 = noise(gw), g2 = noise(gw + e * .7), g = (g1 * 1.3 - .65) * sharp;
 float face = sat(ucL.y + rake * .75 + (g1 - g2) * .4 * sharp);
 vec3 alb = mix(vec3(.7, .6, .47), vec3(.84, .76, .64), sat(mid * .8 + .1 + .35 * g));
 // a dark or a pale grain here and there
 vec2 a = gw * .62, ci = floor(a); float h = hash21(ci + 5.);
 float spot = ucS(.1 + .25 * fract(h * 91.), .05, length(a - ci - .3 - .4 * vec2(h, fract(h * 53.)))) * sharp;
 alb *= 1. - spot * .5 * step(.82, h);
 alb = mix(alb, vec3(.96, .93, .89), spot * .6 * step(h, .12));
 if (pale > .0) alb = mix(alb, vec3(.93, .92, .9), pale);
 if (wet > .0) alb = mix(alb, (uKind[0] * uKind[0] * .42 + .012) * (.75 + .5 * mid + .5 * g), wet);
 float wink = ucS(.6, 1., sin(h * 1900. + uTime * .45 + uTravel * .3)) * step(.35, h) * step(h, .5);
 vec3 c = alb * tint * (ucSun * face * lit + ucSky * amb * (.9 + .3 * g) + ucWarm);
 if (wet > .0) {
 vec3 hv = normalize(ucL - ucRd + vec3(.0, 1e-3, .0));
 c += wet * (ucSun * lit * pow(sat(hv.y + rake * .06 + (g1 - g2) * .05), 26.) * .3 + ucSky * amb * .35 * pow(1. - sat(-ucRd.y), 3.) * (.8 + .5 * mid) + ucWarm * .1);
 }
 return c + spot * wink * vec3(1., .93, .8) * (.1 + 2. * sat(uHigh + .6 * uKeys) * ucGain) * (.15 + .85 * lit);
}
float ucPo, ucBo; vec2 ucK2; // its pore and its knob here
// The skin of a shell: its colour and bent normal; l is the sun in its frame.
vec3 ucSkin(vec3 d, vec3 l, float px, vec3 cB, vec3 cK, vec3 kind, float dust, out vec3 nb, out float shut, out float open) {
 vec2 m = ucMap(d);
 if (ucDye > .0) { cB = mix(cB, kind * (.35 + .6 * kind), ucDye); cK = mix(cK, .3 + .72 * kind, ucDye); }
 if (ucDark > .0) { cB = mix(cB, cB * .07 + kind * .015, ucDark); cK = mix(cK, cB + .05 * kind, ucDark); }
 float s = max(sqrt(max(1. - d.y * d.y, .0)), .02), w = px / s, ax = abs(m.x), sd = m.x > .0 ? 1. : -1.;
 vec3 eP = normalize(vec3(-d.z, .0, d.x + 1e-5)), eU = cross(d, eP);
 vec2 lt = vec2(dot(l, eP), dot(l, eU)); float lz = max(dot(l, d), .12);
 float crown = ucS(-2.15, -1.7, m.y); // 0 on the plates at the very top
 float R, n;
 vec2 k = ucKnob(m, R, n);
 float r = length(k), fade = ucS(.9, .25, w / R);
 float kn = ucAmt(n) + .4 * ucGain * uBands[int(clamp(n * 1.2 + 2., .0, 15.))];
 float sl = -1.15 * ucS(.36, .55, r) * ucS(1., .7, r) - 2.6 * r * ucS(.36, .28, r) + .45 * ucS(.9, 1.05, r) * ucS(1.32, 1.1, r);
 vec2 g = k / max(r, 1e-3) * sl * fade * ucOld;
 // its cast shade
 vec2 ld = lt / max(length(lt), 1e-3);
 float along = -dot(k, ld), off = dot(k, vec2(-ld.y, ld.x)), len = .75 + min(.75 * length(lt) / lz, 1.3);
 shut = 1. - .75 * ucOld * fade * ucS(.95, .55, abs(off) + .25 * max(along - .8, .0)) * ucS(.35, .75, along) * ucS(len + .35, len - .25, along) * crown;
 // wall: cream between, colour in the bands
 vec3 alb = mix(mix(cB, cK, .62), cB, sat(ucS(.36, .46, ax) * .75 + .5 * ucBell(m.x / .07) + .14 * sin(m.x * 17. + ucFifth * 5. + 2. * sin(m.y * 6.))));
 alb = mix(alb, cB * .8, .09 * m.y * m.y);
 alb = mix(alb, alb * (kind * 1.5 + .1), .6 * sat(ucAmt(-m.y / UC_ROW)));
 alb *= 1. - .3 * ucOld * ucSeam(m, w) * ucS(.06, .02, w) * crown;
 // small knobs in the gaps, and dust
 for (int j = 0; j < 2; j++) {
 float f = j == 0 ? 15. : 27.;
 if (w * f > .4) break;
 vec2 a = vec2(ax + .013, m.y) * f;
 a.y += .5 * mod(floor(a.x), 2.);
 vec2 i = floor(a), q = a - i - .5;
 float h = hash21(i + ucFifth * 7. + sd * 3.), rr = (j == 0 ? .2 : .24) + .16 * h;
 q += .2 * (vec2(h, fract(h * 17.)) - .5);
 float L = length(q), on = ucS(1.12, 1.4, r) * ucS(.4, .1, w * f) * (j == 0 ? step(.25, h) : .8) * (1. - ucS(.02, .0, abs(ax - .425) - .03));
 g += q / max(L, 1e-3) * vec2(sd, 1.) * (j == 0 ? -1.1 : -.75) * ucS(rr + .1, rr - .08, L) * ucS(.0, rr * .7, L) * on;
 alb = mix(alb, cK, .55 * on * ucS(rr, rr - .12, L));
 }
 float rw, pore = ucS(.014 + w, .014 - w, ucPore(m, rw)) * ucS(.045, .012, w);
 alb *= 1. - .8 * pore * crown;
 // knob's own colour: paler boss, pearl on top
 vec3 tip = mix(cK, kind, sat(kn * 1.1) * .85);
 if (uOwn[0] < .0 || uOwn[7] < .0) tip = mix(tip, uKind[4], uHits * sat(-uOwn[0] - min(uOwn[7], .0)));
 float boss = ucS(1.02, .8, r) * crown * (.25 + .75 * ucOld), pearl = ucS(.38, .27, r) * crown * ucOld;
 alb = mix(alb, tip, boss * (.5 + .4 * sat(kn)) * (.4 + .6 * fade));
 alb = mix(alb, tip * 1.12 + .04, pearl * fade);
 alb *= 1. - ucOld * (.35 * ucS(.1, .0, abs(r - 1.06)) * crown * fade + .4 * ucS(.07, .0, abs(r - .4)) * fade * crown);
 ucPo = pore * crown; ucBo = boss; ucK2 = k;
 // plates of the crown and the opening
 float th = d.y > .0 ? s + s * s * s * .17 : 2., top = 1. - crown;
 alb = mix(alb, mix(cB, cK, .4) * (1. - .3 * ucS(.05 + w, .02, abs(ax - .4 - .1 * (m.y + 2.2)))), top * .85);
 g *= crown;
 alb *= 1. - .7 * top * ucS(.035, .02, length(vec2(m.x, (m.y + 2.15) * .8) * s));
 g.y -= .7 * ucBell((th - ucHole - .03) / .03);
 open = ucS(ucHole + px, ucHole - px, th);
 alb = mix(alb, vec3(.8, .73, .62), dust);
 nb = normalize(d - (eP * g.x + eU * g.y) * .95 + eP * 1e-4);
 return alb;
}
// The five shells: middle and size, which way up, colour of bands and wall.
#define UC_W(W, M) (mix(W, M, ucMany) * (1. - .97 * ucOne))
#define UC_AT(X,Y,Z,W,M) vec4(X,mix(Y * ucQ / UC_Q * (mix(W,M,ucMany) / W),-.1,ucOne) - ucDeep * UC_W(W,M) * ucQ * .62,Z,UC_W(W,M))
const vec4 ucSs[5] = vec4[5](uOwn[1] < .0 ? mix(vec4(-1.,.6 * ucQ / UC_Q,.45,1.32),vec4(.1,.8 * ucQ / UC_Q,-.35,1.85),ucOne) - vec4(.0,ucDeep * mix(1.32,1.85,ucOne) * ucQ * .62,.0,.0) : UC_AT(-1.,.6,.45,1.32,.52),UC_AT(1.75,.38,1.45,.86,.58),UC_AT(3.05,.5,-1.75,1.12,.64),UC_AT(.95,.26,-.95,.56,.52),UC_AT(-2.1,.27,-1.8,.7,.58));
const vec3 UC_AX[5] = vec3[5](vec3(.12,.95,-.3),vec3(.22,.95,-.2),vec3(-.35,.9,.1),vec3(-.5,.75,-.4),vec3(.3,.9,-.3));
const vec3 UC_B[5] = vec3[5](vec3(.32,.19,.38),vec3(.3,.38,.21),vec3(.4,.48,.34),vec3(.6,.34,.36),vec3(.42,.24,.3));
const vec3 UC_C[5] = vec3[5](vec3(.87,.76,.76),vec3(.84,.83,.64),vec3(.88,.83,.69),vec3(.92,.83,.71),vec3(.88,.75,.68));
float ucLook(vec2 p, vec3 at, float pit, float far, float narrow) {
 float foc = 2. * clamp(uRes.x / uRes.y / 1.28, narrow, 1.) * mix(1.05, .95, uSpace) * ucWide, cp = cos(pit), sp = sin(pit);
 ucRo = at + vec3(.0, sp, -cp) * far;
 ucRd = normalize(vec3(p.x, p.y * cp - foc * sp, p.y * sp + foc * cp));
 return far / (foc * uRes.y);
}
// The shells that may lie one way, the nearest first: each, how near, and which.
vec4 ucBy[3]; vec2 ucAt[3];
void ucPut(vec4 s, vec2 at) {
 if (at.x < ucAt[2].x) { ucAt[2] = at; ucBy[2] = s; }
 if (at.x < ucAt[1].x) { ucAt[2] = ucAt[1]; ucBy[2] = ucBy[1]; ucAt[1] = at; ucBy[1] = s; }
 if (at.x < ucAt[0].x) { ucAt[1] = ucAt[0]; ucBy[1] = ucBy[0]; ucAt[0] = at; ucBy[0] = s; }
}
float ucAway(vec2 c, vec4 s) { return length(c - s.xz) - s.w; }
// The small shell of a cell of the sand.
vec4 ucCrowd(vec2 id, out float h) {
 h = hash21(id + 71.3);
 vec2 c = (id + .5 + .44 * (vec2(fract(h * 57.1), fract(h * 91.7)) - .5)) * 1.16;
 c.x += .55 * c.y;
 float r = ucMany * (.3 + .24 * fract(h * 37.7));
 r = min(r, (min(min(min(ucAway(c, ucSs[0]), ucAway(c, ucSs[1])), min(ucAway(c, ucSs[2]), ucAway(c, ucSs[3]))), ucAway(c, ucSs[4]))) * .92);
 return vec4(c.x, r * ucQ * (.45 + .35 * fract(h * 13.3) - .72 * ucDeep), c.y, r);
}
vec2 ucCell(vec2 w) { return floor(vec2(w.x - .55 * w.y, w.y) / 1.16); }
vec3 ucTilt(float h) { return normalize(vec3(fract(h * 113.) - .5, .75, fract(h * 211.) - .62)); }
// Their light, with what is left for the sand, and its place and light.
vec4 ucOn(vec2 p, out vec2 at, out float px, out float lit, out float amb) {
 px = ucLook(p, vec3(.1 - .5 * sat(1.3 - uRes.x / uRes.y), .55 * ucLie, .0), .72 - .56 * ucLie + .82 * ucTop, 8.6 - 2.2 * ucLie, .56); lit = amb = 1.;
 vec3 ro = ucRo, rd = ucRd;
 float tg = ro.y / max(-rd.y, 1e-3), rem = 1., soft = mix(.16, .06, uTone);
 vec3 c = vec3(.0); at = (ro + rd * tg).xz; ucTg = tg;
 // which shell lies this way; as they lie no two overlap, in a world up to three may, the nearest first
 float bound = ucMore ? (1.105 + .68 * ucSp) * max(1., ucQ) : 1.095, hs = .0, best = 1., tb = .0, miss = 1.;
 int i = 0, who = -1; vec4 S = ucSs[0]; mat3 F = mat3(1.); vec3 sc = vec3(1.), o = sc, v = sc;
 vec2 cell;
 float h; ucAt[0] = ucAt[1] = ucAt[2] = vec2(9e4);
 for (int j = 0; j < 5; j++) {
 vec3 oc = (ro - ucSs[j].xyz) / ucSs[j].w; float b = dot(oc, rd), dd = sqrt(max(dot(oc, oc) - b * b, .0));
 if (ucMore) { if (dd < bound && ucSs[j].w > .06) ucPut(ucSs[j], vec2(-b * ucSs[j].w, float(j))); }
 else if (dd < bound) { bound = dd; who = j; }
 }
 if (!ucMore && who >= 0) { ucAt[0] = vec2(.0, float(who)); ucBy[0] = ucSs[who]; }
 if (ucMany > .0) cell = ucCell((ro + rd * min((ro.y - .2) / max(-rd.y, 1e-3), 60.)).xz);
 for (int j = 0; j < (ucMany > .0 ? 9 : 0); j++) {
 vec4 s = ucCrowd(cell + vec2(float(j % 3) - 1., float(j / 3) - 1.), h);
 vec3 oc = ro - s.xyz; float b = dot(oc, rd), rr = bound * s.w;
 if (s.w > .06 && dot(oc, oc) - b * b < rr * rr) ucPut(s, vec2(-b, 10. + h));
 }
 for (int l = 0; l < (ucMore ? ucSp > .0 ? 3 : 2 : 1); l++) {
 if (ucAt[0].x > 8e4) break;
 S = ucBy[0]; hs = ucAt[0].y - 10.;
 if (ucMore) { ucBy[0] = ucBy[1]; ucAt[0] = ucAt[1]; ucBy[1] = ucBy[2]; ucAt[1] = ucAt[2]; }
 who = hs < .0 ? int(hs + 10.5) : 9; i = hs < .0 ? who : int(fract(hs * 7.7) * 4.99);
 vec3 oc = ro - S.xyz;
 ucLv = ucHear(i); ucRing = uHits * (i == 4 ? 1.3 : .35); ucHole = i == 4 ? .36 : .1;
 F = ucFrame(normalize((who < 5 ? UC_AX[i] : ucTilt(hs)) + vec3(.0, 2.5 * max(-uOwn[2], .0), .0)), who < 5 ? float((i + 1) * 7 % 5) * 1.7 + .35 : hs * 40.);
 sc = vec3(S.w, S.w * ucQ, S.w); o = (oc * F) / sc; v = (rd * F) / sc;
 float vv = dot(v, v), B = dot(o, v) / vv, rim = 1.081 + .024 * min(max(ucLv, ucRing), 1.) + .68 * ucSp, D = B * B - (dot(o, o) - rim * rim) / vv;
 miss = step(D, .0); D = max(D, .0); best = 1.;
 float t = -B - sqrt(D), iv = 1. / sqrt(vv); tb = t;
 float D1 = B * B - (dot(o, o) - .998) / vv, tI = D1 > .0 ? -B - sqrt(D1) : 1e5, tE = min(min(-B + sqrt(D), tg), tI);
 float least = (tE - t) / (ucSp > .0 ? 70. : 9.);
 for (int j = 0; j < (ucSp > .0 ? 46 : 10); j++) {
 vec3 q = o + v * t; float L = length(q);
 q /= L;
 h = ucFar(q, L);
 if (h < best) { best = h; tb = t; }
 if (h < .004 || t > tE) break;
 t += max(h * iv * (ucSp > .0 ? .65 : .87), least);
 }
 tb += best * iv;
 if (tI < tg && (tb > tI || best > .004)) { tb = tI; best = .0; }
 if (best < .0045 + .6 * px / S.w && tb < tg && miss < .5) break;
 }
 if (who >= 0) {
 float cover = ucS(1.2, .0, (best - .0045) * S.w / px) * ucS(.0, 2. * px, tg - tb) * (1. - miss);
 vec3 q = o + v * tb, d = q / max(length(q), 1e-3), W = ro + rd * tb, lf = ucL * F, nb;
 float shut, open, low = W.y, sandy = ucS(.05, .015, low);
 vec3 n0 = normalize(F * (d / sc)), kind = uKind[i] * .75 + .12;
 vec3 alb = ucSkin(d, lf, px / S.w / sqrt(max(-dot(n0, rd), .15)), UC_B[i], UC_C[i], kind, sandy * .9, nb, shut, open);
 float L = length(q), up = ucSp > .0 ? ucS(1.06, 1.12, L) : .0, root = 1., side = dot(n0, ucL);
 if (ucSp > .0) { // on a spine
 vec3 eP = normalize(vec3(-d.z, .0, d.x + 1e-5)), eU = cross(d, eP);
 nb = normalize(mix(nb, eP * ucK2.x + eU * ucK2.y + d * (.05 + .2 * up), up) + eP * 1e-4);
 vec3 body = mix(mix(UC_B[i], UC_C[i], .5 + .5 * sin(L * 27.)), kind, max(ucDye * .8, .5 * ucLv));
 alb = mix(alb, mix(body, kind * .12 + .02, ucDark), up);
 shut = mix(shut, 1., up); open *= 1. - up;
 root = mix(1., ucS(.85, 1.35, L), ucSp);
 }
 vec3 n = normalize(F * (nb / sc));
 float sun = sat(dot(n, ucL) * 1.1) * (ucSp > .0 ? mix(ucS(-.1, .25, side), ucS(-.5, .1, side), up) : ucS(-.1, .25, side)) * shut * root;
 for (int j = 0; j < (ucMore ? 5 : 1); j++) if (ucMore ? j != who && ucSs[j].w > .06 : i == 1 || i == 3) sun *= ucShade(W, ucSs[j], soft);
 float occ = mix(.35, 1., ucS(.0, .6, low / S.w)) * (.6 + .4 * shut) * (.4 + .6 * root);
 if (uOwn[7] > .0) sun *= mix(1., ucNet(W.xz + W.y * .4), uOwn[7] * .8);
 vec3 skin = alb;
 alb *= ucSun * sun * 1.15 + ucSky * (n.y * .5 + .5) * occ;
 if (ucDark > .0) { float nv = 1. - sat(-dot(n, rd)), shine = pow(sat(dot(n, normalize(ucL - rd))), 34.);
 alb += ucDark * (ucSun * shine * sun * 1.3 + ucSky * (.15 + 1.3 * nv * nv * nv) * occ * sat(n.y + .5)); }
 if (ucNight > .0) {
 vec3 lamp = mix(UC_LAMP, kind * 1.15, max(.35, ucDye)) * (.5 + .9 * ucLv + .8 * ucRing);
 float thick = (1. - .72 * ucBo) * (1. - up) * (.45 + .55 * sat(-dot(n0, rd))) * (1. - ucDark);
 alb += ucNight * lamp * (skin * (thick * 1.35 + up * .16) + 2.6 * ucPo * (1. - up));
 }
 vec2 hd = d.xz / sin(ucHole);
 vec3 inside = UC_B[i] * (.05 + ucSun * .3 * ucS(.1, 1.1, -dot(hd, normalize(lf.xz + 1e-4))) * ucS(.75, 1., length(hd)) + .06 * length(hd));
 if (ucNight > .0) inside += ucNight * vec3(1., .75, .45) * (.5 + ucLv);
 c = cover * mix(alb, inside, open); rem = 1. - cover;
 }
 float star = 9.; vec3 way = vec3(1.);
 for (int i = 0; i < 5; i++) {
 S = ucSs[i];
 float dd = length(at - S.xz) / S.w;
 if (dd > 4. + 2. * max(uOwn[2], .0) + ucNight) continue;
 lit = min(lit, ucShade(vec3(at.x, .0, at.y), S, soft));
 if (ucSp > .0 && ucD < star) { star = ucD; way = ucC; }
 amb *= 1. - .62 * exp(-max(dd - .82, .0) * 4.5);
 if (ucNight > .0) ucWarm += ucNight * mix(UC_LAMP, uKind[i], .4) * (.4 + .9 * ucHear(i)) * exp(-max(dd - .8, .0) * 1.7) * .75;
 }
 if (ucSp > .0) { // the spines throw their shadows as rays
 vec3 e = normalize(cross(ucLd, vec3(.3, 1., .1)));
 float f = sat(star / (.62 * ucSp)), ray = abs(fract(atan(dot(way, cross(ucLd, e)), dot(way, e) + 1e-6) / TAU * 26.) - .5) * 2.;
 lit = min(lit, 1. - .8 * ucS(1., .75, f) * ucS(.2 + .6 * f, .75 + .25 * f, ray));
 }
 if (ucMany > .0) cell = ucCell(at + ucL.xz * .5);
 for (int j = 0; j < (ucMany > .0 ? 9 : 0); j++) {
 float h; S = ucCrowd(cell + vec2(float(j % 3) - 1., float(j / 3) - 1.), h);
 if (S.w < .06) continue;
 float dd = length(at - S.xz) / S.w;
 lit = min(lit, ucShade(vec3(at.x, .0, at.y), S, soft));
 amb *= 1. - .62 * exp(-max(dd - .82, .0) * 4.5);
 if (ucNight > .0) ucWarm += ucNight * mix(UC_LAMP, uKind[int(fract(h * 7.7) * 4.99)], .4) * .22 * exp(-max(dd - .8, .0) * 2.2) * ucS(4., 1.5, dd);
 }
 return vec4(c, rem);
}
// Above 0 the wall of the broken shell is gone.
vec3 ucM;
float ucGone(vec3 q) {
 vec3 e = normalize(cross(ucM, vec3(.0, 1., .0))), g = cross(e, ucM);
 float a = atan(dot(q, g), dot(q, e) + 1e-6) / TAU + .5, j = .0;
 for (int i = 0; i < 2; i++) {
 float f = i == 0 ? 23. : 53., x = a * f, k = floor(x), h = hash11(k + 11. * f), h2 = hash11(mod(k + 1., f) + 11. * f);
 j += mix(h, h2, ucS(.2, .6 + .4 * h, x - k)) * (i == 0 ? .2 : .12);
 }
 return dot(q, ucM) - (.24 + (uOwn[1] < .0 ? -.58 : -.2) * uOwn[1]) + j;
}
int ucK; // whose fifth it is
// The light through the wall: pores, and the glow round them.
vec3 ucGlow(vec3 d, float px, float blur, out vec3 bare) {
 vec2 m = ucMap(d);
 float s = max(sqrt(max(1. - d.y * d.y, .0)), .02), w = px / s, ax = abs(m.x), sd = m.x > .0 ? .5 : .0;
 int k = int(mod(ucFifth + 2., 5.)); k = k == 0 ? 1 : k == 1 ? 4 : k == 4 ? 0 : k;
 float lv = k == 4 ? sat(.4 * uHits * ucGain) : ucHear(k), n = -m.y / UC_ROW;
 ucK = k;
 vec3 kind = uKind[k]; kind = kind * kind + .05; kind /= max(kind.r, max(kind.g, kind.b));
 float rw, pl = ucPore(m, rw);
 float fill = lv * ucS(-2.5, 1.5, lv * 10. - n) * ucS(.63, .47, ax), ring = uHits * ucBell((n - 10.5 * (1. - uHits)) / 1.2);
 float bd = uBands[int(clamp(2. - rw * .32, .0, 15.))];
 float h = hash21(vec2(rw, ucFifth * 4. + sd * 2. + step(.425, ax)));
 float R = .008 + .008 * h + blur, W = w + blur;
 float pore = ucS(R + W, R - W, pl) * min(1., .02 / (R + W));
 float halo = exp(-pl * pl * 900.) * .05 + ucBell((ax - .425) / .075) * .06;
 // knobs stand thick and dark against the light, seams are thin
 float KR, kn; vec2 kk = ucKnob(m, KR, kn);
 float r = length(kk), crown = ucS(-2.2, -1.7, m.y);
 float thin = (1. - ucOld * (.6 * ucS(1.05, .5, r) * crown - .1 * ucS(.35, .2, r))) * (1. + .55 * ucOld * ucSeam(m, w) * crown) * (.82 + .36 * noise(m * vec2(44., 60.)));
 vec3 warm = mix(vec3(1., .86, .66), kind, .85 * sat(fill));
 bare = thin * ucTo(kind * 1.6, .28 * fill) * (1. + .5 * fill + .8 * ring);
 float gain = .75 + 1.6 * fill + 1.2 * bd * ucGain + 2.5 * ring;
 float eye = ucS(.09, .07, s) * step(.0, d.y);
 if (ucSp > .0) pore += .33 * ucSp * ucS(.74 * KR + W, .74 * KR - W, r * KR) * (KR > .085 ? 1. : .8) * ucS(1.2, .2, W / KR);
 return warm * (pore * (4. + 5. * fract(h * 7.)) * gain * crown + halo * (.5 + gain) * crown) + eye * vec3(3.2, 3.1, 3.);
}
vec4 ucIn(vec2 p, out vec2 at, out float px, out float lit, out float amb, out vec3 spots, out float tg) {
 ucWide = 1. - .58 * max(uOwn[0], .0);
 const float tall = exp2(uOwn[2] * (uOwn[2] > .0 ? .75 : 1.2)), off = 3.6 - 2.95 * ucLie + 1.9 * max(uOwn[2], .0);
 px = ucLook(p, vec3(.34 - .25 * sat(1.3 - uRes.x / uRes.y), .5 * tall - .05 * ucLie, .0), .42 - .86 * ucLie + .8 * ucTop, off, .5);
 vec3 ro = ucRo, rd = ucRd, S = vec3(.0, .5 * tall - .55 * tall * ucDeep, .0), sc = vec3(1., .8 * tall, 1.);
 mat3 F = ucFrame(normalize(vec3(-.28, .72, .5)), .0);
 mat3 G = mat3(F[0] / sc.x, F[1] / sc.y, F[2] / sc.z);
 ucM = normalize((vec3(.72, .26, -.66) + vec3(-.45, .9, .35) * ucMany) * G);
 vec3 o = (ro - S) * G, v = rd * G, l = ucL * G;
 tg = rd.y < -1e-3 ? -ro.y / rd.y : 1e5;
 float vv = dot(v, v), B = dot(o, v) / vv, D = B * B - (dot(o, o) - 1.) / vv;
 vec3 c = vec3(.0), bare; float rem = 1.;
 lit = amb = 1.; spots = vec3(.0); at = (ro + rd * min(tg, 60.)).xz;
 float t0 = D > .0 ? -B - sqrt(D) : 1e6, t1 = D > .0 ? -B + sqrt(D) : 1e6;
 // what stands of the near wall, and its broken edge
 if (t0 < tg && t0 > .0) {
 vec3 d = normalize(o + v * t0), n = normalize(F * (d / sc));
 float gone = ucGone(d);
 if (gone < .07) {
 vec2 m = ucMap(d); float R, i; vec2 k = ucKnob(m, R, i); float r = length(k), boss = ucS(1., .75, r) * ucOld; int f = int(mod(ucFifth + 2., 5.));
 vec3 sk = mix(mix(vec3(.67, .5, .56), vec3(.34, .19, .38), ucS(.34, .46, abs(m.x))), vec3(.86, .76, .72), .8 * boss);
 if (ucDye > .0) sk = mix(sk, uKind[f] * (.4 + .5 * boss), ucDye); if (ucDark > .0) sk = mix(sk, vec3(.04) + .05 * boss, ucDark); if (ucTop > .0) sk *= ucTo(uKind[f] * 1.5 + 1.1, ucTop * ucHear(f)) * (1. + .9 * ucTop * uHits); if (ucSp > .0) sk *= 1. - .8 * ucSp * ucS(.78, .66, r);
 sk *= (1. - .4 * boss * k.y * ucS(.25, .4, r)) * (1. - ucOld * (.4 * ucS(.1, .0, abs(r - .4)) + .3 * ucS(.2, .0, abs(r - 1.08))));
 sk *= ucSky * (1.3 + .9 * n.y) + ucSun * sat(dot(n, ucL) + .15 - .3 * boss * k.y) * .8;
 if (ucNight * ucSp > .0) sk += ucNight * ucSp * vec3(1.3, .85, .5) * ucS(.78, .66, r);
 sk = mix(sk, vec3(.9, .78, .66) * (.7 + .4 * noise(d.xy * 60.)) * (.35 + .3 * ucSun), ucS(.0, .006, gone));
 rem = ucS(.062, .067, gone); c = sk * (1. - rem);
 }
 }
 // the far wall, from inside
 if (t1 < tg && t1 > .0 && rem > .01) {
 vec3 e = o + v * t1, d = normalize(e);
 float gone = ucGone(d), k = ucS(-.004, .004, gone);
 vec3 n = normalize(F * (d / sc));
 float face = max(dot(n, rd), .12);
 vec3 th = ucGlow(d, px * t1 / off / sqrt(face), .0, bare);
 float sunny = dot(n, ucL), glow = .05 + 1.1 * pow(sat(sunny * .55 + .45), 3.);
 vec3 wall = mix(vec3(.6, .34, .3), vec3(.42, .2, .36) + .25 * uTexture * uKind[2], ucS(.34, .46, abs(ucMap(d).x)));
 if (ucDye > .0) wall = mix(wall, uKind[ucK] * mix(.95, .5, ucS(.34, .46, abs(ucMap(d).x))), ucDye);
 wall *= 1. - .88 * ucDark;
 float low = (ro + rd * t1).y;
 vec3 inn = wall * bare * ucSun * glow * .27 + th * ucSun * (.12 + .35 * sat(.5 + .5 * sunny));
 if (ucNight > .0) { // a lamp stands in it
 float lampAt = exp(-2.2 * max(low - .1, .0));
 inn = mix(inn, wall * bare * vec3(1.25, .82, .5) * (.35 + 1.5 * lampAt) * (.6 + .6 * uLevel) + th * vec3(.05, .065, .1), ucNight);
 }
 float mouth = ucS(-.75, .0, gone) * (1. - .8 * ucNight);
 inn += wall * bare * (vec3(.4, .38, .42) * mouth * mouth + vec3(.5, .36, .28) * .35 * ucS(.45, .0, low)) * ucS(-.02, .08, low);
 inn = mix(inn, vec3(.95, .84, .74) * (.55 + .35 * noise(d.xy * 70. + d.z * 40.)) * (.5 + ucSun * .4 * sat(.4 + sunny)), ucS(-.055, -.048, gone));
 c += rem * inn * (1. - k); rem *= k;
 }
 // the sand, where each pore throws a small light
 if (tg < 60. && rem > .01) {
 vec3 q = (vec3(at.x, .0, at.y) - S) * G;
 float ll = dot(l, l), b = dot(q, l) / ll, dd = b * b - (dot(q, q) - 1.) / ll, within = length(q);
 lit = b > .0 && within > 1. ? 1. : step(1., within) * ucS(-.06, .0, sqrt(max(dot(q, q) - b * b * ll, .0)) - 1.);
 const bool lampOn = ucNight > .5;
 if (lampOn || dd > .0 && -b + sqrt(dd) > .0) {
 vec3 e = q + l * (-b + sqrt(max(dd, .0)));
 if (lampOn) e = normalize(q + vec3(.0, .22, .0));
 float gone = ucGone(e), open = ucS(-.05, .05, gone), first = within > 1. ? ucS(-.05, .05, ucGone(q + l * (-b - sqrt(dd)))) : 1.;
 if (!lampOn) lit = max(lit, open * first);
 if (open < 1.) spots = ucGlow(normalize(e), .004, mix(.0065, .0025, uTone) * length(e - q), bare) * (1. - open) * (lampOn ? ucS(.98, 1.06, within) * exp(1.1 - 1.1 * within) * 2.4 : first * .5);
 if (lampOn) spots += vec3(1.1, .72, .42) * (1. - ucS(.92, 1.02, within) + ucS(-.15, .2, gone) * ucS(.95, 1.1, within)) * exp(-2.6 * within) * 4.4;
 if (ucNight > .0) spots *= abs(2. * ucNight - 1.);
 }
 amb = mix(.6, 1., ucS(.7, 1.5, within)) * (1. - .5 * ucS(.2, -.1, dot(q, ucM)) * exp(-abs(within - 1.) * 9.));
 }
 return vec4(c, rem);
}
vec3 render(vec2 p) {
 ucGain = .45 + 1.2 * uEnergy;
 float low = 4. * uCue * (1. - uCue);
 float az = .07 * sin(TAU * uLoop) + .13 * sin(uTime * .031);
 ucL = normalize(vec3(-.88, .4 - .13 * low + .03 * sin(uTime * .043), -.12 + az));
 ucSun = mix(vec3(1.95, 1.5, 1.02), vec3(2., 1.2, .64), uCue * .8) * (.95 + .15 * uLevel);
 ucSky = vec3(.22, .26, .38);
 bool inside = uVar > .5;
 if (inside) { ucL = normalize(vec3(-.5 + az, .62 - .09 * low, .62)); ucSun *= .8; ucSky = vec3(.19, .17, .19); }
 const float noon = max(-uOwn[6], .0);
 if (noon > .0) { ucL = normalize(mix(ucL, inside ? vec3(-.12, 1., .16) : vec3(-.3, 1., .12 + az), noon)); ucSun *= ucTo(vec3(.74, .92, 1.18), noon); ucSky *= ucTo(vec3(1.2, 1.35, 1.5), noon); }
 if (ucNight > .0) { ucSun *= ucTo(vec3(.035, .06, .14), ucNight); ucSky *= ucTo(vec3(.1, .14, .22), ucNight); }
 if (uOwn[7] > .0) { ucSun *= ucTo(vec3(.62, 1., 1.15), uOwn[7]); ucSky *= ucTo(vec3(.7, 1.35, 1.5), uOwn[7]); }
 ucLd = normalize(ucL * vec3(1., 1. / ucQ, 1.));
 vec2 at; float px, lit, amb, far = .0; vec3 spots = vec3(.0);
 vec4 f = inside ? ucIn(p, at, px, lit, amb, spots, far) : ucOn(p, at, px, lit, amb);
 vec3 c = f.rgb;
 vec3 ucAir = ucTo(vec3(.9, 1.05, 1.2), noon) * (1. - .86 * ucNight) * (uOwn[4] > .0 ? 1. + uOwn[4] : 1. + .75 * uOwn[4]);
 if (f.a > .01) {
 vec2 tw = at * (inside ? .19 : .125);
 vec4 m = piece(vec2(.5 + tw.x, .5 - tw.y));
 vec3 tint = ucTo(.6 + m.rgb * .7 / max(max(m.r, max(m.g, m.b)), .1), sat(m.a * .45 * ucGain) * ucS(.5, .35, abs(tw.x)));
 if (uOwn[7] > .0) lit *= mix(1., ucNet(at * (inside ? 1.6 : 1.)), uOwn[7] * .9);
 vec3 g = ucSand(inside ? at * 2.2 + 5. : at, inside ? p * min(300., .4 * uRes.y) + 200. : at * min(90., .42 / px), (inside ? ucS(5.5, 3., far) : 1.) * (!inside && ucLie > .0 ? ucS(26., 8., ucTg) : 1.), lit, amb, tint);
 if (inside) g = mix(g * mix(1., .7, ucS(3., 5., far)), mix(vec3(.36, .26, .25), vec3(.3, .3, .36), ucS(.3, .5, p.y)) * ucAir, 1. - exp(-max(far - 3.6, .0) * .22)) + vec3(.8, .7, .56) * spots * (ucNight > .0 ? mix(ucSun * ucL.y, vec3(1.), ucNight) : ucSun * ucL.y);
 if (ucLie > .0) {
 vec3 sky = mix(ucSun * vec3(.3, .27, .25) + ucSky * .7, ucSky * 1.5 + ucSun * .12, ucS(-.02, .7, ucRd.y)) * (uOwn[4] < .0 ? 1. + .4 * uOwn[4] : 1.);
 g = mix(g, sky, ucS(9., 34., inside ? far * 2. : ucTg));
 }
 c += f.a * g;
 }
 c = 1. - exp(-1.2 * max(c, .0));
 return pow(c, vec3(.4545));
}
