// name: Toy railway
// a: Over the table
// b: Engine view
// what: A model railway in window light: mossy hills, a plaster tunnel, a tin bridge by painted water, a station, sponge trees and a red engine with four coaches on a figure of eight, the room soft behind; or the view from the engine, rails ahead, a hill close by, a folded paper sky and, once a round, the room.
// follows: the loop takes the train round, or the paper sun; travel the ride and the clouds; drone swells the hills, pad the sun; coaches and trees take the kinds; phrase smoke, bands poplars; a hit lights the signal, or the fire; a cue the station, coaches and lamp; keys the windows, voice the lamp; space pulls back; the piece tints hills and sky
// own: 0 night with lit windows at -1, red evening at 1; 1 snow at -1, dry ochre autumn at 1; 2 worn ground with no trees and no poplars at -1, deep moss and tall trees at 1; 3 low mounds at -1, steep mountains at 1 (b: the round begun elsewhere, as by 6); 4 the eye low at -1, from above or looking back along the coaches at 1; 5 unpainted white card at -1, a painted sea over the board at 1; 6 flat-topped tables of rock at -1, at 1 hills of stacked layers in the sounds' colours; 7 a dark room and one lamp at -1, at 1 no room: open country out to a haze in the pad's colour
#define TS_MESA max(-uOwn[6], 0.)
#define TS_STEP max(uOwn[6], 0.)
#define TS_LAMP max(-uOwn[7], 0.)
#define TS_OPEN max(uOwn[7], 0.)
vec3 tsHaze; vec2 tsPool;
// The line is an eight: its middle, which way it lies; the tunnel, which way that runs.
const vec2 TSC = vec2(.45, 1.35), TSE = vec2(.819, .574), TST = vec2(1.06, 3.03), TSD = vec2(.6, .8);
float tsPx, tsTn, tsTf, tsSnow, tsCard, tsNight, tsHk, tsFoc = 4.6, tsK = 1.6, tsRim;
vec3 tsL, tsSun, tsSky, tsRo, tsFw, tsRt, tsUp, tsRd, tsNn, tsQ, tsGrass, tsMoss, tsLeaf, tsGlow, tsDay, tsP1, tsP2, tsC1, tsC2;
vec4 tsPc;
vec2 tsJx, tsJy;
// what was met first, and the edge before it
vec3 tsHit[2], tsHn[2]; vec4 tsHb[2];
// the boxes: 0 to 3 coaches, 4 to 6 the engine, 7 and 8 the station, 9 and 10 the bridge, 11 a signal
vec3 tsBc[12]; vec2 tsBa[12];
const vec3 TSH0 = vec3(.2, .16, .105);
const vec3 tsBh[12] = vec3[12](TSH0, TSH0, TSH0, TSH0, vec3(.085, .19, .11), vec3(.15, .12, .085), vec3(.018, .05, .018),
  vec3(.38, .28, .16), vec3(.46, .13, .27), vec3(.5, .12, .012), vec3(.5, .12, .012), vec3(.03, .33, .03));
const vec2 TSK0 = vec2(.5, .03), TSK9 = vec2(0, 9);
const vec2 tsBk[12] = vec2[12](TSK0, TSK0, TSK0, TSK0, vec2(.4, .02), vec2(.8, .03), TSK9, TSK9, vec2(.95, 0), TSK9, TSK9, TSK9);
// where the trees stand
const vec4 TSX0 = vec4(-.25, 1.5, .5, 1.7), TSZ0 = vec4(.62, -.3, -.55, .55);
const vec2 TSX1 = vec2(-2.6, 2.35), TSZ1 = vec2(.75, 1);
vec4 tsX0, tsZ0; float tsRe;
float tsLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float tsS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
// A wave like a sine, made without one.
float tsW(float x) { x = fract(x * .159155) * 2. - 1.; return 4. * x * (abs(x) - 1.); }
float tsLum(vec3 c) { return dot(c, vec3(.3, .59, .11)); }
vec2 tsTurn(vec2 q) { return vec2(q.x * TSE.x - q.y * TSE.y, q.x * TSE.y + q.y * TSE.x); }
// A paint in the colour of a sound, as light as it was.
vec3 tsDye(vec3 c, vec3 k, float a) { k = k * k + .02; return mix(c, k * tsLum(c) / tsLum(k), sat(a)); }
vec3 tsPaint(vec3 c) { return mix(c, vec3(.7, .68, .63) * (.8 + .4 * tsLum(c)), tsCard * .92); }
vec3 tsHour(vec3 day, vec3 night, vec3 eve) { return mix(mix(day, night, tsNight), eve, sat(uOwn[0])); }
vec3 tsLand(vec3 c, vec3 snow, vec3 dry) { return mix(mix(c, snow, tsSnow), dry, sat(uOwn[1])); }
// A place of the round, and which way the line runs there.
vec4 tsAt(vec2 a) {
  float s = 2. * a.x * a.y, c = 1. - 2. * a.x * a.x, d = -s * (.1467 + .0532 * c - .0214 * (3. - 4. * s * s) + .0196 * c * (1. - 2. * s * s));
  a = (a + d * vec2(a.y, -a.x)) * (1. - .5 * d * d); s = a.x; c = a.y;
  return vec4(TSC + tsTurn(vec2(2.6 * s, 2.2 * s * c)), tsTurn(normalize(vec2(2.6 * c, 2.2 * (1. - 2. * s * s)))));
}
// Noise, and which way it climbs.
vec3 tsGrain(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f), v = 6. * f * (1. - f);
  float a = hash21(i), b = hash21(i + vec2(1, 0)) - a, c = hash21(i + vec2(0, 1)) - a, d = hash21(i + 1.) - a - b - c;
  return vec3(a + b * u.x + c * u.y + d * u.x * u.y, v * (vec2(b, c) + d * u.yx));
}
// How soft the lens draws what lies this far.
float tsBlur(float z) { return max(tsPx * .75, min((.1 - .06 * uTone) * abs(1. / tsFoc - 1. / max(z, .1)) - .0015, .014)) * z / tsK; }
// A box, its top cut by two slopes.
void tsBox(vec3 ro, vec3 rd, int i) {
  vec2 ax = tsBa[i], ay = vec2(-ax.y, ax.x), k = tsBk[i]; vec3 h = tsBh[i]; ro -= tsBc[i];
  vec3 o = vec3(dot(ro.xz, ax), ro.y, dot(ro.xz, ay)), d = vec3(dot(rd.xz, ax), rd.y, dot(rd.xz, ay));
  d += vec3(d.x < 0. ? -1e-5 : 1e-5, d.y < 0. ? -1e-5 : 1e-5, d.z < 0. ? -1e-5 : 1e-5);
  vec3 iv = abs(1. / d), n = -o / d, a = n - h * iv, b = n + h * iv;
  tsTn = max(a.x, max(a.y, a.z)); tsTf = min(b.x, min(b.y, b.z));
  vec3 nl = -sign(d) * vec3(greaterThanEqual(a, vec3(tsTn)));
  vec2 kk = vec2(k.x, -k.x), den = d.y + kk * d.z + vec2(1e-5, -1e-5), r = (h.y + k.y - o.y - kk * o.z) / den;
  if (den.x > 0.) tsTf = min(tsTf, r.x); else if (r.x > tsTn) { tsTn = r.x; nl = vec3(0, 1, k.x); }
  if (den.y > 0.) tsTf = min(tsTf, r.y); else if (r.y > tsTn) { tsTn = r.y; nl = vec3(0, 1, -k.x); }
  nl = normalize(nl); tsQ = o + d * tsTn;
  tsNn = vec3(nl.x * ax.x - nl.z * ax.y, nl.y, nl.x * ax.y + nl.z * ax.x);
}
// Which of four things a line passes near.
int tsNear(vec4 X, vec4 Z, vec4 R, vec3 o, vec2 d, float k, vec4 top) {
  X -= o.x; Z -= o.z; vec4 b = X * d.x + Z * d.y, y = o.y + k * b, s = abs(k) * R + .02;
  vec4 on = step(abs(X * d.y - Z * d.x), R) * step(-R, b) * step(y - s, top) * step(-s, y);
  return int(dot(on, vec4(1, 2, 4, 8)));
}
// How much sun four round things let by.
float tsShadow(vec4 X, vec4 Z, float y, vec4 R, vec3 o) {
  X -= o.x; Z -= o.z; y -= o.y;
  vec4 c = X * tsL.x + Z * tsL.z + y * tsL.y, d = X * X + Z * Z + y * y - c * c;
  vec4 k = 1. - .9 * sat(1.5 - d * R) * sat(c * 24. - 3.); return k.x * k.y * k.z * k.w;
}
int tsBit(int m) { return int(log2(float(m & -m)) + .5); }
// The hills of paper and paste, and the block with the tunnel.
const vec4 TSHX = vec4(-1.45, .42, 2.05, 3.6), TSHZ = vec4(3.3, 3.98, 2.25, 4.4), TSHR = 1. / vec4(1.8, 1.2, .75, 1.5), TSHW = vec4(1.4, .9, .52, 1);
vec2 tsT;
float tsH(vec2 g) {
  vec4 a = (g.x - TSHX) * TSHR, b = (g.y - TSHZ) * TSHR; b = max(1. - a * a - b * b, 0.);
  float h = dot(TSHW, b * b) * tsHk;
  vec2 l = fract(vec2(g.x * .84 + g.y * .27, g.y * .75 - g.x * .16)) * 2. - 1.; l *= abs(l) - 1.; h *= 1. + 2.6 * l.x * l.y;
  if (uOwn[6] < 0.) {
    h = mix(h, tsS(.1, .34, h) * (.5 + .16 * h) * max(tsHk, .5) + .1 * tsS(.0, .3, h), TS_MESA);
    // a cutting on either side of the tunnel, so that no rock stands on the line
    vec2 c = g - TST; c = abs(vec2(dot(c, TSD), c.x * TSD.y - c.y * TSD.x));
    h *= 1. - TS_MESA * tsS(.5, .62, c.x) * tsS(1.9, 1.2, c.x) * tsS(.5, .26, c.y);
  }
  if (uOwn[6] > 0.) { float k = h / .14, b = floor(k); h = mix(h, .14 * (b + tsS(.72, 1., k - b)), TS_STEP); }
  g -= TST; tsT = abs(vec2(dot(g, TSD), g.x * TSD.y - g.y * TSD.x)); vec2 t = sat(vec2(3.3, 2.2) - vec2(6., 4.) * tsT);
  return max(h, .74 * (2. - t.x) * t.x * (2. - t.y) * t.y);
}
// How deep in the bore a place is, once tsH was asked there.
float tsDig(float y) { return tsT.x < .6 ? (.073 - tsT.y * tsT.y - y * y * .25) * 1.85 : -9.; }
// The room, out of focus, and the paper sky.
vec3 tsRoom(vec3 rd, float az) {
  vec2 d = vec2(az, rd.y / max(length(rd.xz), .1) + .1);
  float cn = tsS(PI - .06, PI, abs(az)) * .5; cn = tsS(.5, -.9, d.x) + (az > 0. ? cn : -cn);
  vec3 wall = mix(vec3(.5, .33, .2), vec3(.2, .13, .1), cn) * (.4 + .6 * tsS(-.3, .06, d.y)) * (tsSun * .2 + tsSky * .7);
  vec2 w = abs(d - vec2(.19, .33)) - vec2(.17, .36), c = d - vec2(-.44, .04);
  float cu = d.x - .4 - .1 * d.y;
  wall = mix(wall, tsDay * (.45 + .55 * tsS(0., .035, abs(d.x - .19))) * (.5 + .5 * tsS(0., .04, abs(d.y - .12))), tsS(.05, -.04, max(w.x, w.y)));
  wall = mix(wall, tsDay * vec3(.6, .3, .17) * (.5 + .16 * tsW(cu * 80.)), .9 * tsS(.13, .07, abs(cu)));
  // a chair
  float ch = min(abs(abs(c.x) - .15) - .014, max(abs(c.x) - .15, abs(abs(c.y - .03) - .09) - .02));
  wall = mix(wall, vec3(.14, .06, .03) * (tsSun * .2 + tsSky), tsS(.026, -.02, max(ch, c.y - .2)));
  float e = d.x < 0. ? min(-d.x - .85, 2.4 + d.x) : min(d.x - 1., 2.4 - d.x), f = abs(d.x) - 1.65;
  float cl = .4 + .2 * tsW(d.x * 7. + uTravel * .01 + 2. * tsW(d.y * 11.)) * tsW(d.y * 19. + d.x * 3.) ;
  vec3 sk = mix(mix(vec3(.75, .72, .6), vec3(.22, .42, .6), sat(d.y * 2. + .1)), vec3(.85, .82, .74), tsS(.36, .48, cl));
  sk = mix(sk, mix(vec3(.3, .4, .3), vec3(.42, .5, .5), tsS(0., .2, d.y)), tsS(.004, -.004, d.y - .17 - .05 * tsW(d.x * 4.) - .03 * tsW(d.x * 9.)));
  sk = tsDye(sk, tsPc.rgb / max(tsPc.a, .05), tsPc.a * .6);
  float su = length(d - vec2(-2.4 + 1.5 * uLoop, .3)) - .07;
  sk = mix(sk, vec3(.95, .62, .2), tsS(.012, -.012, su) * tsS(0., .06, uLoop) * tsS(1., .94, uLoop));
  sk *= (tsSun * .32 + tsSky * .8) * (1. + .16 * sign(f) * tsS(.5, 0., abs(f)) + .25 * tsS(.012, 0., abs(f)));
  sk = mix(wall, sk, tsS(-.015, .015, e) * tsS(.95, .93, d.y));
  if (uOwn[7] < 0.) sk *= 1. - .97 * TS_LAMP;
  if (uOwn[7] > 0.) {
    float y = rd.y + .02; vec2 cq = rd.xz / (max(y, 0.) + .07); float cs = noise(cq * .7 + uTravel * vec2(.01, .004)) * .6 + .4 * noise(cq * 1.7 + uTravel * vec2(.016, .006) + 7.);
    vec3 o = mix(tsHaze, tsSky * 2.2 + tsHaze * .25, tsS(0., .6, y)); o = mix(o, tsHaze * 1.25, .7 * tsS(.5, .75, cs) * tsS(.02, .12, y));
    o = tsDye(o, tsPc.rgb / max(tsPc.a, .05), tsPc.a * .4);
    float sl = length(vec2(az - .55, rd.y - .16)); o += tsSun * (.5 * tsS(.05, .042, sl) + .1 * exp(-sl * 5.)) * (1. - .5 * tsNight);
    sk = mix(sk, o, TS_OPEN);
  }
  return sk;
}
// The balls: 6 trees, from 8 wool, from 10 poplars. tsTn is how tall.
vec4 tsBall(int i) {
  float f = float(i), n = uOwn[2], y, on = n < 0. ? tsS(0., .3, 1. + n * 1.05 - .6 * fract(f * .618)) : 1. + .35 * n, r = .11 * min(on, 1.); tsTn = 1.;
  vec2 a = vec2(i < 4 ? TSX0[i & 3] : TSX1[i & 1], i < 4 ? TSZ0[i & 3] : TSZ1[i & 1]);
  if (i < 8) { r = (.14 + .06 * fract(f * .37) + .06 * min(tsLv(i % 5), 1.)) * on; tsTn = 1. + 1.1 * max(n, 0.) * fract(f * .8); y = r * tsTn * .93; }
  else if (i < 10) { a = tsBc[6].xz - tsBa[6] * (.06 + .12 * (f - 8.)); r = .0001 + (.04 + .025 * (f - 8.)) * sat(.15 + uPhrase); y = .5 + .15 * (f - 8.); }
  else { a = vec2(-3.2 + .44 * (f - 10.), 3.6); tsTn = 2.6 + 3. * min(1.4 * uBands[min(i - 10, 15)] * (.4 + uEnergy), 1.); y = r * tsTn; }
  return vec4(a.x, y, a.y, r);
}
// A thing: 1 the board, 3 the table, 4 a hill, from 10 the boxes, from 30 the balls.
vec3 tsShade(int id, float t, int z) {
  vec3 q = tsRo + tsRd * t, n = vec3(0, 1, 0), c = vec3(0), glow = c, bq = c;
  vec2 g = q.xz;
  float w = max(length(tsJx), length(tsJy)), bp, rail = 0., gl = 1. - abs(tsRd.y), wet = 0., amb = 1., dg = -9., tall = 1., sh = 1.;
  gl *= gl * gl;
  bool hill = id == 4, land = id == 1 || hill, ball = id >= 30, box = id >= 10 && !ball;
  int i = id - (ball ? 30 : 10);
  if (ball) { vec4 b = tsHb[z]; tall = tsHn[z].x; n = normalize((q - b.xyz) / vec3(1, tall, 1) / b.w + 1e-3); }
  if (box) { bq = tsHit[z]; n = tsHn[z]; }
  if (hill) { float h = tsH(g); dg = tsDig(q.y); amb = dg > -.012 ? 0. : 1.; n = normalize(vec3(h - tsH(g + vec2(.04, 0)), .04, h - tsH(g + vec2(0, .04)))); if (uOwn[6] > 0.) { float e = .012; h = tsH(g); n = normalize(mix(n, normalize(vec3(h - tsH(g + vec2(e, 0)), e, h - tsH(g + vec2(0, e)))), TS_STEP)); } g += q.y * vec2(.3, 1.1); w = .01; }
  vec2 lq = g - TSC, wq = (g - vec2(-.98, .93)) / vec2(.6, .74); lq = vec2(dot(lq, TSE), dot(lq, vec2(-TSE.y, TSE.x)));
  float lake = (length(wq) - 1. - .1 * tsW(wq.x * 3.3 + 1.) - .07 * tsW(wq.y * 5. + wq.x * 4.)) * .5;
  lake = id == 1 ? mix(lake, -.3, sat(uOwn[5])) : 1.;
  // the grain of things
  vec2 ua = g * 2.1 + 3., ub = g * 9., uc = g * 55.;
  if (lake < .05) ua = g * vec2(5., 22.) + 3. * tsW(g.y * 3.);
  if (ball) { uc = vec2(dot(n, tsRt), dot(n, tsUp) * tall) * 6. + float(i) * 7.; ub = uc * 2.7; }
  if (box) ub = vec2(bq.x + bq.z, bq.y) * 30.;
  if (id == 3) { ua = g * vec2(1.2, 17.); ub = g * vec2(3., 60.); }
  float fine = land ? tsS(.035, .008, w) : 1., A = noise(ua), B = noise(ub), C, st = tsS(.66, .42, n.y + .25 * (B - .5));
  vec3 gr = tsGrain(uc); C = mix(.5, gr.x, fine); bp = dot(gr.yz, ball ? vec2(dot(tsL, tsRt), tsL.y) : tsL.xz) * .4 * fine;
  if (land) {
    c = mix(tsMoss, tsGrass, tsS(.3, .62, A * .65 + B * .35 - .3 * max(uOwn[2], 0.)));
    c = mix(c, tsLand(vec3(.5, .38, .12), vec3(.9), vec3(.78, .58, .32)), .85 * tsS(.5, .78, B * .45 + .55 * A * (1.2 - A) - .25 * uOwn[2])) * (.65 + .7 * C);
  }
  if (hill) {
    c = tsDye(c, tsPc.rgb / max(tsPc.a, .05), tsPc.a * .5);
    if (uOwn[6] > 0.) {
      float id = floor(q.y / .14 + .2); vec3 k = kindColour(mod(id * 2. + 1., 5.)); k *= k;
      c = mix(c, k * (.82 + .24 * C) * (.75 + .25 * step(.5, n.y)), .94 * TS_STEP * tsS(.02, -.02, dg)); st *= 1. - TS_STEP;
    }
    if (uOwn[6] < 0.) st = mix(st, 0., TS_MESA), c = mix(c, mix(vec3(.5, .25, .13), vec3(.75, .5, .3), .5 + .5 * tsW(q.y * 34. + 2. * B)) * (.7 + .5 * A), TS_MESA * tsS(.86, .6, n.y));
    // plaster where it is steep, stones about the tunnel
    c = mix(c, mix(mix(vec3(.3, .25, .2), vec3(.58, .5, .4), .5 * A + .5 * B), vec3(.7, .42, .22), .7 * sat(uOwn[1])), st);
    c = mix(c, vec3(.34, .31, .29) * (.7 + .6 * B), tsS(-.16, -.13, dg) * step(n.y, .5));
    bp *= amb - .7 * st * amb;
  }
  if (uOwn[6] > 0. && id == 1) c = mix(c, uKind[0] * uKind[0] * (.8 + .3 * C), .85 * TS_STEP);
  if (id == 1) {
    c = mix(c, vec3(.52, .42, .27) * (.6 + .8 * B), tsS(.1, .04, lake)); wet = tsS(.02 + w, -.02 - w, lake);
    c = mix(c, mix(vec3(.04, .3, .34), vec3(.015, .1, .17), tsS(0., -.28, lake)) + .05 * A * A, wet);
    // the line: ballast, sleepers, rails; two strands where they cross
    float m = lq.x * lq.y > 0. ? 1. : -1.;
    for (int j = 0; j < 2 && (j == 0 || abs(lq.x) < .6); j++) {
      vec2 v = vec2(lq.x, lq.y * m), k, r; float sx = v.x < 0. ? -1. : 1., s = clamp(v.x / 2.6, -.99, .99), o = sqrt(1. - s * s);
      if (abs(v.x) > 1.9) { float y = clamp(v.y / 1.1, -1., 1.); s = sqrt(.5 + .5 * sqrt(1. - y * y)) * sx; o = .5 * y / s; }
      for (int z = 0; z < 2; z++) {
        k = v - vec2(2.6 * s, 2.2 * s * o); r = vec2(2.6 * o, 2.2 * (1. - 2. * s * s));
        if (z < 1) { float e = dot(k, r) / dot(r, r); vec2 a = normalize(vec2(s + o * e, o - s * e)); s = a.x; o = a.y; }
      }
      r = normalize(r); float d = k.y * r.x - k.x * r.y, e2 = dot(k, k); if (e2 > d * d + .05) d = 9.;
      r = tsTurn(vec2(r.x, r.y * m)); vec2 nw = vec2(-r.y, r.x) * m;
      float ad = abs(d), u = (atan(s, o) + s * o * (.283 + .2064 * (1. - 2. * s * s))) * 16.55, wd = length(vec2(dot(nw, tsJx), dot(nw, tsJy))) + 1e-4, wt = length(vec2(dot(r, tsJx), dot(r, tsJy))) + 1e-4;
      float ba = tsS(.025 + wd, -.025 - wd, ad - .22 - .06 * (B - .5)), al = (fract(u) - .5) * .1412, fad = tsS(.09, .04, wt);
      c = mix(c, mix(mix(vec3(.2, .16, .13), vec3(.5, .43, .35), C), vec3(.75, .77, .8), tsSnow * .6), ba); bp *= 1. - .4 * ba; wet *= 1. - ba;
      c = mix(c, vec3(.2, .1, .05) * (.75 + .25 * tsW(d * 90. + 5. * floor(u)) + .3 * B), tsS(wd, -wd, ad - .165) * mix(.5, tsS(wt, -wt, abs(al) - .036), fad));
      c *= 1. - .6 * tsS(wd, -wd, abs(abs(d + .045 * dot(tsL.xz, nw)) - .09) - .012);
      rail = max(rail, tsS(wd, -wd, abs(ad - .09) - .013) * sat(.016 / wd)); m = -m;
    }
    bp *= 1. - wet; vec2 tq = g - TST; amb = abs(tq.x * TSD.y - tq.y * TSD.x) < .4 ? tsS(.2, .55, abs(dot(tq, TSD))) : 1.;
  }
  if (id == 3) c = mix(vec3(.13, .055, .025), vec3(.32, .15, .065), mix(.5, A * .6 + B * .4, tsS(.12, .02, w))) * tsRim;
  if (ball) {
    int k = i % 5;
    c = i < 8 ? tsDye(mix(tsLeaf, tsGrass, fract(float(i) * .618) * .7), uKind[k], min(tsLv(k), 1.) * .42) : i < 10 ? vec3(.8) * (1. + uHits * vec3(2., .9, .3)) : tsDye(tsLeaf * .8, kindColour(float(i - 10) * .26), .5 * tsTn - 1.2);
    c *= i == 8 || i == 9 ? .8 + .3 * C : .45 + 1.1 * B * C + .35 * B;
  }
  if (box) {
    float up = step(.3, n.y), win = step(abs(fract(bq.x * 10.) - .5), .34) * step(abs(bq.y - .06), .036) * (1. - up), k = fract(bq.x * 9.5);
    c = i == 4 ? vec3(.6, .045, .03) : i == 5 ? mix(vec3(.65, .45, .12), vec3(.05, .09, .065), step(.06, k)) : i == 6 ? vec3(.02) : i == 7 ? vec3(.75, .6, .36) : vec3(.42, .1, .06);
    if (i < 4) { c = mix(mix(vec3(.6, .46, .25), uKind[i] * uKind[i], .55), vec3(.75, .66, .46), step(.115, bq.y)) * (.1 + .9 * step(-.09, bq.y)); glow = mix(tsGlow * .5, uKind[i], .25) * (.3 + tsLv(i) + uKeys); }
    else win = i == 4 ? step(abs(bq.y - .07), .045) * step(abs(bq.x), .05) : 0.;
    if (i < 5) c = mix(c, vec3(.18), up);
    if (i == 7) { win = step(abs(fract(bq.x * 5.26) - .5), .26) * step(abs(bq.y + .02), .085); glow = tsGlow * (.6 + uKeys); }
    if (i == 8) c = mix(vec3(.5, .1, .055) * (.8 + .35 * step(.5, fract(k * 2.))), vec3(.85, .87, .92), tsSnow * .8);
    if (i == 11) { win = step(.2, bq.y); glow = vec3(3., .3, .1) * (.3 + 2. * uHits); }
    glow *= win;
    c = mix(c, vec3(.06), win) * (.85 + .3 * B);
  }
  if (land) n = normalize(n - vec3(tsL.x, 0, tsL.z) * bp);
  if (id != 3) c = tsPaint(c);
  vec3 s0 = q + n * .015; float tr = 35. / (.01 + sat(1. + 1.6 * uOwn[2]));
  sh = tsShadow(TSX0, TSZ0, .2, vec4(tr), s0);
  if (!box) sh *= tsShadow(vec4(tsBc[5].x, 1.27, tsX0.xz * .5 + tsX0.yw * .5), vec4(tsBc[5].z, 1.68, tsZ0.xz * .5 + tsZ0.yw * .5), .16, vec4(40, 11, 18, 18), s0);
  float nl = ball ? sat(dot(n, tsL) * .85 + .2 - bp * 1.1) : sat(dot(n, tsL));
  if (g.y > .9 && nl > 0.) { vec3 s = s0 + tsL * .45; sh *= 1. - sat((tsH(s.xz) - s.y) * 5.); }
  vec3 al = c;
  float pool = 1.;
  if (uOwn[7] < 0.) { vec2 po = g - tsPool; pool = mix(1., .012 + (uVar < .5 ? 2.1 : 1.1) * exp(-dot(po, po) * (uVar < .5 ? .55 : 1.)), TS_LAMP); wet *= sat(pool); }
  c = c * (tsSun * nl * sh * 1.2 + tsSky * (.68 + .42 * n.y) * (.12 + .88 * amb)) * pool + glow;
  vec3 l1 = q - tsP1, l2 = q - tsP2; c += al * (tsC1 / (1. + 9. * dot(l1, l1)) + tsC2 / (1. + 30. * dot(l2, l2)));
  c += wet * (tsSky * .5 + tsSun * .35 * sh) * (.05 + gl * gl * 1.4) * (.6 + .8 * A);
  return mix(c, (tsSun * (.03 + .24 * sh) + tsSky * .4) * amb * pool, sat(rail));
}
vec3 render(vec2 p) {
  tsPx = 1. / uRes.y; tsNight = sat(-uOwn[0]); tsSnow = sat(-uOwn[1]); tsCard = sat(-uOwn[5]);
  float low = sat(-uOwn[4]), high = sat(uOwn[4]);
  tsHk = (1. + (uOwn[3] < 0. ? .8 : .9) * uOwn[3]) * (1. + .12 * uDrone);
  tsL = normalize(vec3(.8, .46 - .2 * sat(uOwn[0]), .42 + .05 * tsW(uTravel * .01)));
  tsSun = tsHour(vec3(3.1, 2.2, 1.25), vec3(.2, .3, .56), vec3(2.9, 1.05, .4)) * (.9 + .25 * uPad);
  tsSky = tsHour(vec3(.23, .27, .38), vec3(.03, .045, .1), vec3(.24, .17, .34));
  tsDay = tsHour(vec3(2.2, 2., 1.6), vec3(.1, .16, .34), vec3(2.4, .95, .4)) * (.75 + .5 * uPad);
  tsGrass = tsLand(vec3(.25, .31, .055), vec3(.8, .84, .9), vec3(.62, .4, .19));
  tsMoss = tsLand(vec3(.09, .165, .035), vec3(.6, .66, .74), vec3(.45, .22, .1));
  tsLeaf = tsLand(vec3(.1, .21, .04), vec3(.6, .66, .7), vec3(.5, .13, .03));
  tsRe = .23 + .12 * max(uOwn[2], 0.); tsGlow = vec3(2.6, 1.35, .45) * (.3 + .6 * tsNight + 1.6 * uCue);
  tsHaze = mix(tsHour(vec3(.86, .84, .8), vec3(.035, .055, .11), vec3(1.15, .5, .26)), uKind[1] * uKind[1] * 1.1 * mix(1., .2, tsNight), .6);
  // the eye
  bool ride = uVar > .5; float u0 = ride ? TAU * fract(uTravel * .012) + 2.4 + 1.95 * uOwn[3] + 2.4 * abs(uOwn[6]) : TAU * uLoop + 3.02;
  vec2 ph = vec2(sin(u0), cos(u0)); vec4 e = tsAt(ph), f = tsAt(vec2(ph.x * .955 + ph.y * .296, ph.y * .955 - ph.x * .296));
  vec3 at = vec3(f.x, 0, f.y);
  for (int k = 0; k < 4; k++) { ph = vec2(ph.x * .979 - ph.y * .204, ph.y * .979 + ph.x * .204); f = tsAt(ph); tsBc[k] = vec3(f.x, .21, f.y); tsBa[k] = f.zw; tsBa[k + 4] = e.zw; }
  vec3 ec = vec3(e.x, 0, e.y), ef = vec3(e.z, 0, e.w);
  tsBc[4] = ec - ef * .11 + vec3(0, .24, 0); tsBc[5] = ec + ef * .05 + vec3(0, .18, 0); tsBc[6] = ec + ef * .14 + vec3(0, .36, 0);
  tsBc[7] = vec3(1.27, .28, 1.68); tsBc[8] = vec3(1.27, .6, 1.68); tsBc[9] = vec3(-1.3, .12, 1.1); tsBc[10] = vec3(-1.3, .12, 1.6); tsBc[11] = vec3(.75, .33, .9);
  tsBa[7] = tsBa[8] = tsBa[11] = vec2(1, 0); tsBa[9] = tsBa[10] = vec2(.98, .2);
  tsX0 = vec4(tsBc[0].x, tsBc[1].x, tsBc[2].x, tsBc[3].x); tsZ0 = vec4(tsBc[0].z, tsBc[1].z, tsBc[2].z, tsBc[3].z);
  vec3 ro = vec3(.02 + .07 * tsW(uTravel * .015), mix(mix(2., .75, low), 4.6, high), -mix(mix(3.6, 3.3, low), 3., high)), ta = vec3(.1, mix(.36, .4, low), 1.15 + .25 * high);
  if (ride) {
    tsFoc = 1.8; tsK = 1.; ro = ec + ef * (.45 * tsS(0., .6, low) - .18) + vec3(-ef.z * .1, .49 - .3 * tsS(.5, 1., low), ef.x * .1);
    vec3 v = vec3(at.x - ro.x, -.17 * (1. - low) * (1. - high), at.z - ro.z); v.xz = rot(PI * high) * v.xz; ta = ro + v;
  }
  tsPool = ride ? ec.xz + ef.xz * 1.1 : vec2(.1, 1.25);
  // two lamps
  tsP1 = ride ? ec + ef * .9 + vec3(0, .2, 0) : vec3(1.1, .35, 1.2); tsP2 = ride ? tsBc[6] + vec3(0, .1, 0) : vec3(.75, .6, .85);
  tsC1 = vec3(2.2, 1.25, .5) * (.2 + .5 * tsNight + 1.6 * uCue + .3 * uMic); tsC2 = vec3(3., .9, .3) * (.04 + 1.6 * uHits);
  tsK *= 1.06 - .12 * uSpace; tsRo = ro; tsFw = normalize(ta - ro); tsRt = normalize(vec3(tsFw.z, 0, -tsFw.x)); tsUp = cross(tsFw, tsRt);
  vec3 rd = normalize(tsFw * tsK + tsRt * p.x + tsUp * p.y), col; rd.y += abs(rd.y) < 1e-4 ? 1e-4 : 0.; tsRd = rd;
  float down = max(-rd.y, 1e-3), t1 = 1e3, t2 = 1e3, cov = 0., t = ro.y / down, w = tsBlur(t * dot(rd, tsFw));
  int id1 = 0, id2 = 0;
  vec2 g = ro.xz + rd.xz * t;
  float edge = min(min(4.2 - abs(g.x), 5.2 - g.y), 1.25 - dot(g, vec2(.34, -.94))); edge += 60. * TS_OPEN * step(.01, TS_OPEN) * step(g.y, 90.); tsRim = .2 + .8 * tsS(.07, .16, -edge);
  tsJx = (tsRt.xz - rd.xz * tsRt.y / rd.y) * w; tsJy = (tsUp.xz - rd.xz * tsUp.y / rd.y) * w;
  if (rd.y < -.004) {
    if (g.y < 6.4 && g.y > -2.7 && abs(g.x) < 5.2) { id1 = 3; t1 = t; }
    if (edge > w) { id1 = 1; t1 = t; } else if (edge > -w) { id2 = 1; t2 = t; cov = tsS(-w, w, edge); }
  }
  float aa = dot(rd.xz, rd.xz) + 1e-5, h, d = 1., best = 1e3, bt, st = 0., sc = 1.; bool hit = false;
  vec4 hx = TSHX - ro.x, hz = TSHZ - ro.z, hb = hx * rd.x + hz * rd.z, hh = hb * hb - aa * (hx * hx + hz * hz - vec4(3.24, 2.9, .57, 2.25)), on = step(0., hh);
  hh = sqrt(max(hh, 0.)); hx = (hb - hh) / aa + 1e3 - 1e3 * on; hz = (hb + hh) / aa * on;
  float top = 1.66 * max(tsHk, .5), a0 = min(min(hx.x, hx.y), min(hx.z, hx.w)), a1 = max(max(hz.x, hz.y), max(hz.z, hz.w));
  if (rd.y < 0.) a0 = max(a0, (ro.y - top) / down); else a1 = min(a1, (top - ro.y) / rd.y);
  t = bt = max(a0, .03); a1 = min(a1, t1);
  for (int i = 0; i < 23 && t < a1 && sc > .06; i++) {
    // the last step is to the board
    vec3 q = ro + rd * t; h = tsH(q.xz); d = max(q.y - h, tsDig(q.y));
    if (hit || (d < .002 && h > .006)) { hit = true; sc *= .5; st *= .5; t += d < .002 ? -st : st; }
    else { if (d / t < best && q.y - d > .06) { best = d / t; bt = t; } st = max(min(d, .1 + max(max(tsT.x + tsT.y, q.y + .3) - 1.1, 0.)), .03 * t); t = t < a1 - .002 ? min(t + st, a1 - .001) : a1; }
  }
  if (hit) { id1 = 4; t1 = t; }
  else { float c = tsS(1., 0., best * .5 * bt / tsBlur(bt)); if (c > .02) { id2 = 4; t2 = bt; cov = c; } }
  // boxes and balls the ray comes near
  int m; vec2 r2 = rd.xz / sqrt(aa); float k2 = rd.y / sqrt(aa);
  m = tsNear(vec4(tsBc[5].x, 1.27, -1.3, .75), vec4(tsBc[5].z, 1.68, 1.35, .9), vec4(.28, .56, .6, .08), ro, r2, k2, vec4(.44, .75, .24, .66));
  m = tsNear(tsX0, tsZ0, vec4(.26), ro, r2, k2, vec4(.42)) | (m & 1) * (ride ? 96 : 112) | (m & 2) * 192 | (m & 4) * 384 | (m & 8) << 8;
  for (int k = 0; k < 7 && m != 0; k++) {
    int i = tsBit(m); m &= m - 1; tsBox(ro, rd, i);
    float ww = 2.2 * tsBlur(tsTn), ch = tsTf - tsTn; vec2 v = vec2(abs(fract(tsQ.x * 5.) - .5) * 2., tsQ.y / .24 + .5);
    if (tsTn > .02 && !((i == 9 || i == 10) && abs(v.x - v.y) > .16 && abs(v.y - .5) < .4) && !(i == 11 && abs(tsQ.x) > .012 && tsQ.y < .2)) {
      if (ch > 0.) { if (tsTn < t1) { t1 = tsTn; id1 = 10 + i; tsHit[0] = tsQ; tsHn[0] = tsNn; } }
      else if (ch > -ww && tsTn < t2) { t2 = tsTn; id2 = 10 + i; tsHit[1] = tsQ; tsHn[1] = tsNn; cov = 1. + ch / ww; }
    }
  }
  float row = (ro.x + rd.x * (3.6 - ro.z) / (abs(rd.z) < .01 ? .01 : rd.z) + 3.42) / .44;
  vec4 wx = tsBc[6].xxzz - vec4(.06, .18, .06, .18) * tsBa[6].xxyy;
  m = tsNear(TSX0, TSZ0, vec4(tsRe), ro, r2, k2, vec4(tsRe * 8. - 1.3));
  int m2 = tsNear(vec4(TSX1, wx.xy), vec4(TSZ1, wx.zw), vec4(tsRe, tsRe, .16, .2), ro, r2, k2, vec4(tsRe * 8. - vec2(1.3), 1, 1));
  m |= (m2 & 3) << 4 | (m2 & 12) << 6;
  if (rd.z > .05 && row > 0. && row < 16. && abs(ro.y + rd.y * (3.6 - ro.z) / rd.z - .55) < .75) m |= 1 << 10;
  for (int k = 0; k < 7 && m != 0; k++) {
    int i = tsBit(m); m &= m - 1; if (i == 10) i += int(row);
    vec4 b = tsBall(i); vec3 o = b.xyz - ro, s = rd; o.y /= tsTn; s.y /= tsTn; float dl = length(s); s /= dl;
    float tc = dot(o, s), l = sqrt(max(dot(o, o) - tc * tc, 0.)), ww = max(tsBlur(tc), b.w * .04), in_ = (tc - sqrt(max(b.w * b.w - l * l, 0.))) / dl;
    bool wool = i > 7 && i < 10; vec2 rg = vec2(dot(o, tsRt), o.y) - tc * vec2(dot(s, tsRt), s.y); float rag = b.w * (.93 + .05 * tsW(rg.x / b.w * 13. + float(i)) * tsW(rg.y / b.w * 11.));
    if (tc > .1 && b.w > .012) {
      if (l < rag - ww && !wool) { if (in_ < t1) { t1 = in_; id1 = 30 + i; tsHb[0] = b; tsHn[0].x = tsTn; } }
      else if (l < rag + ww && in_ < t2) { t2 = in_; id2 = 30 + i; tsHb[1] = b; tsHn[1].x = tsTn; cov = tsS(rag + ww, rag - ww, l) * (wool ? .8 * tsS(b.w, b.w * .4, l) : 1.); }
    }
  }
  vec3 at1 = ro + rd * t1; float az = atan(rd.x, rd.z); tsPc = piece(id1 == 0 ? vec2(sat(.5 + az / TAU), sat(.75 - rd.y)) : vec2(sat(.5 + at1.x * .13), sat(1. - at1.y * .6)));
  col = vec3(0); for (int k = id1; k < 1; k++) col = tsRoom(rd, az);
  if (t2 > t1 || cov < .06) cov = 0.;
  for (int k = id1 > 0 ? 0 : 1; k < 2 && (k == 0 || cov > 0.); k++) {
    vec3 c = tsShade(k == 0 ? id1 : id2, k == 0 ? t1 : t2, k); if (uOwn[7] > 0.) c = mix(c, tsHaze, TS_OPEN * (1. - exp(-pow((k == 0 ? t1 : t2) * (uVar < .5 ? .08 : .15), 2.)))); col = k == 0 ? c : mix(col, c, cov);
  }
  col = max(col, 0.); col = col * (1. + .12 * col) / (1. + .6 * col);
  col = sqrt(sat(col)); return col * (1.09 - .09 * col);
}
