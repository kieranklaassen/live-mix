// name: Chair ride
// a: From the grass
// b: Far lit top
// what: From the grass, a chair ride turns overhead on a hazy day: painted crown with mirrors, striped mast, empty slatted chairs on chains, near ones big and dark, far ones tiny, over flags and grass; or the ride far off over a wet meadow at blue dusk, bulbs and chairs drawn into rings of light, broken in a puddle.
// follows: Drone and pad swing the chairs out, pad lifts the crown; sound turns it faster. Each kind colours its own chairs, a phrase runs a wave round, texture is flags and seeds, or steam. The piece tints the canvas, bands light the boards, keys bulbs, loop the sun, voice the tents. A hit flashes mirrors and swings a chair, a cue tips the crown.
// own: 0 night at -1, low sun at 1; 1 snow at -1, storm at 1; 2 every fourth chair at -1, all flung out flat at 1 (far off in a blaze); 3 close by at -1, far out at 1; 4 bleached paint, cold lamps at -1, black and gold, red lamps at 1; 5 wide crown, short chains at -1, small crown, long chains at 1; 6 up in the air level with the chairs (b: the meadow under still water) at -1, right below and looking straight up (b: two more rides beyond) at 1; 7 roofs of a town with lit windows behind at -1, snow peaks behind at 1
#define crT smoothstep
#define crUp max(uOwn[6], 0.)
#define crLow max(-uOwn[6], 0.)
#define crTown max(-uOwn[7], 0.)
#define crPeak max(uOwn[7], 0.)
float crU(float a, float b, float x) { return 1. - crT(b, a, x); }
// A the ride's angle, C the clock; N night, D dusk, W snow, S storm; L lamp, H haze, M land
float crPx, crA, crSn, crCs, crC, crN, crD, crW, crS, crFew, crF, crTip, crLen, crRad, crY;
vec3 crRo, crRd, crSun, crP, crRed, crE, crG, crInk, crH, crL, crHi, crMid, crLo, crM, crV;
mat2 crJ;
float crIn(float e, float d) { return 1. - crT(-e, e, d); }
float crB(float x) { return exp(-x * x); }
float crBox(vec2 q, vec2 h, float r) { q = abs(q) - h + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
float crSeg(vec2 p, vec2 a, vec2 b) { p -= a; b -= a; return length(p - b * sat(dot(p, b) / dot(b, b))); }
float crSoft(vec2 q) { return .5 * noise(q) + .3 * noise(q * 2.1 + 3.7) + .2 * noise(q * 4.5 + 9.1); }
float crKind(float id) { int k = int(mod(id, 5.)); return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : 0.; }
vec3 crDye(float id) { vec3 c = kindColour(mod(id, 5.)); return c / max(max(c.r, max(c.g, c.b)), .2); }
float crOn(float id) { return 1. - crFew * min(mod(id, 4.), 1.); }
vec3 crHour(vec3 day, vec3 dark, vec3 dusk) {
  vec3 c = mix(mix(day, dark, crN), dusk, crD);
  return mix(c, vec3(.24, .25, .26) * (dot(c, c) + .2), crS);
}
// The piece on the canvas; a hit runs out over it.
vec3 crMap(vec3 c, float a, float r) {
  vec4 h = piece(vec2(a, sat(1. - r)));
  c += .5 * c * uCue + vec3(.6, .5, .35) * uHits * crB((r - 1. + uHits) / .2);
  return mix(c, c * .45 + h.rgb * .7, sat(h.a * 1.2) * crT(0., .05, a) * crU(1., .95, a) * (.4 + .5 * uEnergy));
}
// What stands along the horizon, y above it: peaks, or a town.
vec3 crBack(vec3 c, vec2 p, float y, float s) {
  vec3 far = mix(crLo, crHi, .3);
  if (uOwn[7] > 0.) for (int i = 0; i < 3; i++) {
    float f = float(i), x = p.x * (1.5 + .9 * f) / s + 3.7 * f + 1.3, a = 1. - abs(2. * noise(vec2(x, 3.)) - 1.), b = 1. - abs(2. * noise(vec2(x * 2.3, 7.)) - 1.), d = noise(vec2(x * 9., 4.));
    float h = s * crPeak * (.1 + .34 * a * a + .1 * b * a + .03 * d) * (1. - .36 * f) + .001, v = y / h;
    float side = crT(-.15, .15, noise(vec2(x * 2.2 + .5 + 1.2 * v, 3. + 2. * v)) - .5 + .6 * (noise(vec2(x * 8. + 3. * v, v * 7.)) - .5));
    vec3 sn = mix(mix(crHi, far, .4), far * .5 + .5 * crLo + .06, side), k = mix(crM * .8, crM * 1.3 + .03, side);
    k = mix(k, sn, crT(.75, .9, v + .5 * (d - .5) + .3 * side - .25 * f + .6 * crW));
    c = mix(c, mix(k, far, .45 - .2 * f), crIn(crPx * 2., y - h));
  }
  if (uOwn[7] < 0.) for (int i = 0; i < 3; i++) {
    float f = float(i), u = p.x * (6. + 3. * f) / s + 5. * f, id = floor(u), x = u - id - .5, hs = hash11(id + 31. * f), gb = hash11(id + 7.3);
    float h = s * crTown * (.3 - .08 * f) * (.35 + .75 * hs), roof = gb > .5 ? h - .05 * s * abs(x) * 2. : h, w = .5;
    roof = max(roof, abs(x - .3 * (gb - .5)) < .06 ? h + .03 * s : 0.); // a chimney
    vec2 g = vec2(u * 5., y / s * 26.), ci = floor(g), q = abs(g - ci - .5);
    float lit = step(.62, hash21(ci + 17. * f)), win = crIn(.1, max(q.x - .24, q.y - .3)) * step(y, h - .05 * s) * step(abs(x), .42);
    vec3 k = mix(crM * (.45 + .3 * gb) + crE * .05, far, .5 - .2 * f);
    k = mix(k, mix(k * .6, vec3(1., .8, .5) * .9, lit * (.65 + .35 * max(crN, 1. - crY * crY))), win * .9);
    k = mix(k, vec3(.85, .9, .95) * crLo, crW * crIn(crPx * 3., roof - y - .012 * s));
    c = mix(c, k, crIn(crPx * 1.5, y - roof));
  }
  return c;
}
// ---- a: where the ray meets a cone of radius r + k y.
vec2 crCone(float r, float k) {
  float R = r + k * crRo.y, K = k * crRd.y, a = dot(crRd.xz, crRd.xz) - K * K, b = dot(crRo.xz, crRd.xz) - R * K, d = b * b - a * (dot(crRo.xz, crRo.xz) - R * R);
  return d < 0. || abs(a) < 1e-4 ? vec2(-1) : (vec2(-b) + vec2(-1, 1) * sqrt(d) * sign(a)) / a;
}
vec3 crSky(vec3 rd, float n, float m) {
  float d = max(dot(rd, crSun), 0.), cl = crT(.4, .72, n) * crT(0., .3, rd.y);
  vec3 hi = mix(crHi, crHi * .35 + .42, crW), lo = mix(crLo, crLo * .3 + .57, crW), glow = lo * .45 + vec3(.58, .56, .5);
  crH = mix(lo, hi, .2);
  vec3 c = mix(mix(lo, hi, crT(.15, .95, rd.y)), mix(mix(glow, lo, .35), hi * (1. - .2 * crS), crT(.3, .75, m) * (.35 + .65 * crS)), cl * (.6 + .35 * crS));
  return mix(c, glow, (.4 * pow(d, 6.) + .4 * pow(d, 60.)) * (1. - .8 * crS) * (1. - .6 * max(crW, crN)));
}
// The edge of the crown.
vec4 crEdge(float t, bool front) {
  vec3 h = crRo + crRd * t, n = normalize(vec3(h.x, -.45 * length(h.xz), h.z));
  float f = (atan(h.x, h.z) + crA) * 16. / TAU, i = floor(f), x = f - i - .5, y = h.y, e = .8 * crPx * t, id = mod(i, 16.), lv = uBands[int(id)];
  float lit = dot(n, crSun), shade = mix(.55, 1.08, crT(-.8, .5, lit)), s = fract(f * 2.) - .5, hang = -.2 - .26 * sqrt(max(1. - 4. * s * s, 0.));
  vec2 q = vec2(x * 1.35, y - .5);
  vec4 hem = vec4(mix(fract(f) < .5 ? crP : crRed, crG, crIn(e, abs(y - hang - .04) - .022)) * (front ? shade : .77 + .15 * lit), crIn(e, hang - y) * crIn(e, y - .02));
  float m = front ? crIn(e, y - 1.02 - .42 * sqrt(max(1. - 4. * x * x, 0.))) * crIn(e, -y) : 0.;
  vec3 c = mix(fract(i * .5) < .25 ? crRed : crE, crP, crIn(e, crBox(q, vec2(.55, .4), .08)));
  // the mirror
  float ov = length(q / vec2(.3, .36)) - 1., blink = .5 + .5 * sin(crC * .35 + id * 2.4), ry = reflect(crRd, normalize(n + .14 * sin(id * vec3(2.3, 4.1, 3.7)))).y;
  vec3 mir = mix(mix(vec3(.42, .5, .36), vec3(.9), crW) * crY, crH, crT(-.25, .1, ry + .25 * q.x - .2 * q.y));
  mir += (.35 * blink * blink + uHits) * crU(.35, 0., abs(q.x * .8 + q.y * .5 - .2 + .4 * blink));
  float gold = min(min(abs(y - 1.) - .05, abs(y - .03) - .04), min(.64 - abs(q.x), abs(length(q - vec2(0, .5)) - .3) - .04)), b = length(vec2((fract(f * 5.) - .5) * .27, y - 1.)) - .035;
  c = mix(mix(c, crG, max(crIn(e * 3., ov - .16), crIn(e, gold))) * shade, mir, crIn(e * 3., ov));
  c = mix(c, vec3(1, .95, .78), crIn(e, b) * sat(.4 + .6 * lv + .6 * crN + uCue + .6 * uKeys));
  c = c * (1. + .15 * lv * uEnergy) + vec3(.6, .45, .24) * (.6 * lv * uEnergy + .3 * crN + uCue + .5 * uHits) * exp(-max(b, 0.) * 9.);
  return vec4(mix(hem.rgb, c, m) * (.5 + .5 * crY), max(m, hem.a));
}
vec3 crRoof(vec3 col) {
  float t = -crRo.y / max(crRd.y, .02); vec2 w = crRo.xz + crRd.xz * t;
  float r = length(w) / crRad, e = crPx * t / max(crRd.y, .2), a = fract((atan(w.x, w.y) + crA) / TAU), f = a * 24., arc = r * TAU * crRad / 24., spoke = (.5 - abs(fract(f) - .5)) * arc;
  vec3 c = mix(crP, crRed, crT(-e, e, (abs(fract(f * .5) - .5) - .25) * arc)) * (.74 - .18 * w.x / crRad) * (1. - .16 * crU(.5 * arc, 0., spoke));
  c = mix(crMap(c, a, r), crInk * 1.5, .9 * crIn(e, min(spoke - .03, (abs(r - .6) - .006) * crRad)));
  c = mix(c, crG * .8, crIn(e, (abs(r - .96) - .03) * crRad));
  return mix(col, c * (.5 + .5 * crY), crIn(e, (r - 1.) * crRad) * step(.02, crRd.y));
}
// The mast, the chairs' shadows on it, and its drum.
vec4 crMast() {
  vec4 o = vec4(0); vec2 t = vec2(crCone(.5, 0.).x, crCone(1.15, .12).x);
  for (int i = 0; i < 2; i++) {
    vec3 h = crRo + crRd * t[i], n = normalize(vec3(h.x, 1e-4, h.z)), c; float e = crPx * abs(t[i]), u = atan(h.x, h.z), lit = dot(n, crSun), m, f = (u + crA) * 10. / TAU;
    if (i == 0) {
      c = mix(crP, crRed, crT(-e, e, abs(fract(u * 3. / TAU + h.y * .16) - .5) - .25)) * (1. - .4 * crT(.1, .55, sin(u * 2. + h.y * .9 - crA * 12.)) * crT(-.1, .4, lit));
      m = crIn(e, h.y) * crIn(e, abs(determinant(mat2(crRo.xz, crRd.xz))) / length(crRd.xz) - .5 + e);
    } else {
      c = mix(fract(f * .5) < .5 ? crE : crRed, crG, crIn(e, .31 - .7 * abs(fract(f) - .5)));
      c = mix(c, crH * .8, crIn(e, crBox(vec2(fract(f) * .7 - .35, h.y + .75), vec2(.2, .5), .18)));
      c = mix(c, crG, crIn(e, abs(abs(h.y + .8) - .75) - .07)); m = crIn(e, -1.6 - h.y) * step(h.y, .05);
    }
    m *= step(0., t[i]);
    o = vec4(mix(o.rgb, c * mix(.42, 1.05, crT(-.35, .7, lit)) * crY, m), max(o.a, m));
  }
  return o;
}
// One chair, in its own room: across, up along the chains, forward.
vec4 crChair(vec3 lo, vec3 ld, float far, vec3 paint, float glow) {
  vec3 dark = mix(crInk, paint * .5, .45), edge = mix(paint, vec3(1, .97, .9) * crY, .35), add = paint * glow * .5;
  float e = .9 * crPx * far, tb = (-.32 - lo.z) / ld.z, ts = -lo.y / ld.y, eb = e / max(abs(ld.z), .12), es = e / max(abs(ld.y), .12);
  vec2 h = (lo + ld * tb).xy - vec2(0, .42), g = (lo + ld * ts).xz, p1 = vec2(.34, .36);
  float d = crBox(h, vec2(.4, .42), .16), gap = max(abs(fract(h.y * 4.6 + .9) - .5) / 4.6 - .05, crBox(h, vec2(.33, .35), .1));
  vec4 back = vec4(mix(mix(paint * .75, dark, .45), edge, .7 * crIn(eb, abs(d + .03) - .02)) + add, crIn(eb, d) * (1. - crIn(eb, gap)) * step(0., tb));
  d = crBox(g, vec2(.42, .36), .08); gap = max(abs(fract(g.y * 7.) - .5) / 7. - .026, crBox(g, vec2(.37, .31), .02));
  vec4 seat = vec4(mix(mix(dark, paint, ld.y > 0. ? .1 : .6), edge, .6 * crIn(es, abs(d + .02) - .02)) + add, crIn(es, d) * (1. - crIn(es, gap)) * step(0., ts));
  vec4 a = tb > ts ? back : seat, b = tb > ts ? seat : back, o = vec4(a.rgb, 1) * a.a;
  // the sides, and the chains that meet over the head
  for (int k = 0; k < 2; k++) {
    float t = (float(k) * .8 - .4 - lo.x) / ld.x, ek = e / max(abs(ld.x), .2); vec2 q = (lo + ld * t).zy;
    float s = min(crSeg(q, vec2(-.32, .42), p1), crSeg(q, p1, vec2(.32, 0))) - .034;
    float ch = min(crSeg(q, vec2(-.32, .45), vec2(0, 1.25)), crSeg(q, p1, vec2(0, 1.25))) - .012;
    o = mix(o, vec4(mix(dark, edge, .15), 1), max(crIn(ek, s), crIn(ek, ch) * min(1., .03 / ek)) * step(0., t));
  }
  o = mix(o, vec4(b.rgb, 1), b.a);
  return vec4(mix(o.rgb, crH * o.a, crT(4., 22., far) * .6), o.a);
}
// One of the twenty four, counted from the farthest.
vec2 crK, crEr; float crQ, crFr, crSi, crCo, crId; int crZ;
float crMine(vec2 er) { return sat(5. * dot(er, vec2(-.87, -.49)) - 4.); } // a hit swings one here
void crOne(int j) {
  float g = float(j % 2 == 0 ? j / 2 + 1 : -(j / 2)), dl;
  crEr = rot((g - crFr) * TAU / 24.) * crK; crId = mod(crQ + g + 24., 24.); crZ = j / 12;
  dl = (.015 + .09 * uPhrase) * sin(crId * TAU / 8. - crC * .8) + crMine(crEr) * .35 * uHits * sin(TAU * 1.25 * (1. - uHits));
  crSi = crSn + crCs * dl; crCo = crCs - crSn * dl;
}
int crNext(inout int bits) { int low = bits & -bits; bits -= low; return int(log2(float(max(low, 1))) + .5); }
vec3 crRing(vec3 col, vec4 mast, vec4 board) {
  float R = crRad - .25; crFr = crA * 24. / TAU; crQ = floor(crFr); crFr -= crQ; crK = -normalize(crRo.xz);
  // which chairs the ray comes near to
  vec3 A = vec3(0, -.1, 0) - crRo; vec2 g2 = cross(A, crRd).xz, v = crSn * g2 - crCs * R * vec2(-crRd.z, crRd.x), er = rot((-11. - crFr) * TAU / 24.) * crK;
  float h0 = crRd.x * A.z - crRd.z * A.x, ar = dot(A, crRd), most = .7 + crLen * (.02 + .1 * uPhrase + .2 * uHits); mat2 turn = rot(TAU / 24.);
  int bits = 0, close = 0;
  for (int g = -11; g < 13; g++) {
    float f = dot(er, v) - crCs * h0, b = crSn * dot(er, crRd.xz) - crCs * crRd.y;
    if (f * f < most * most * (1. - b * b)) bits |= 1 << (g > 0 ? 2 * g - 2 : 1 - 2 * g);
    er = turn * er;
  }
  // their chains: how near (d), how far down (ht), how far off (tt)
  vec4 lay[2] = vec4[2](vec4(col, 1), vec4(0));
  for (int k = 0; k < 24; k++) {
    bool some = bits != 0; int j = crNext(bits); crOne(j);
    float tr = crRd.x * crEr.y - crRd.z * crEr.x, re = dot(crEr, crRd.xz), b = crSi * re - crCo * crRd.y, n = max(1. - b * b, 1e-3), ea = dot(crEr, A.xz), w1 = R * re + ar, wa = crSi * (R + ea) - crCo * A.y;
    float ht = (b * w1 - wa) / n, tt = w1 + b * ht, d = abs(crSi * dot(crEr, g2) - crCo * (R * tr + h0)) / sqrt(n), e = crPx * max(tt, .1), hm = crLen - .4, bm = w1 + b * hm;
    if (some && tt > 0.) {
      if (d < .7 && R * (R + 2. * ea) + dot(A, A) + hm * (2. * wa + hm) - bm * bm < 1.2) close |= 1 << j;
      float a = .9 * crIn(e, abs(d - abs(tr) / sqrt(n) * .4) - .022) * min(1., .044 / e) * crOn(crId) * step(0., ht) * step(ht, crLen - 1.25);
      lay[crZ] = mix(lay[crZ], vec4(mix(mix(crInk, crP * crY, .15), crH, crT(4., 18., tt) * .6), 1), a);
    }
    if (bits == 0) break;
  }
  for (int k = 0; k < 10; k++) {
    float there = close == 0 ? 0. : 1., lv; crOne(crNext(close)); lv = crKind(crId);
    vec3 W = normalize(vec3(crEr.x * crSi, -crCo, crEr.y * crSi)), B = vec3(crEr.x, 0, crEr.y) * R + A + W * crLen, tn = vec3(crEr.y, 0, -crEr.x);
    vec3 O = normalize(cross(W, tn) + tn * .1 * cos(crId * 2.7 + crC * .37)), T = cross(O, W), ld = vec3(dot(crRd, O), -dot(crRd, W), dot(crRd, T));
    ld = mix(ld, vec3(1e-3), lessThan(abs(ld), vec3(1e-3)));
    vec3 paint = mix(mix(crRed, crE, mod(crId, 2.)), crDye(crId) * (.45 + .25 * lv), .25 + .6 * lv) * crY;
    vec4 c = crChair(-vec3(dot(B, O), -dot(B, W), dot(B, T)), ld, max(dot(B, crRd), .1), paint, lv * (.3 + .6 * uEnergy) + crMine(crEr) * uHits * .8) * there * crOn(crId);
    lay[crZ] = lay[crZ] * (1. - c.a) + c;
    if (close == 0) break;
  }
  col = mix(mix(lay[0].rgb, mast.rgb, mast.a), board.rgb, board.a);
  return col * (1. - lay[1].a) + lay[1].rgb;
}
// A line of small flags.
vec3 crFlags(vec3 col, vec2 p) {
  float u = (p.x + 1.3) / 1.92, y = -.02 - .5 * u + .3 * u * u, i = floor(u * 24.), v = (y - p.y) * 12.5, px = 15. / uRes.y;
  float x = u * 24. - i - .5 + .12 * (.4 + uTexture) * v * sin(crC * 1.1 + i * 1.7);
  vec3 c = mix(fract(i * .5) < .25 ? crG : crRed, crDye(i) * .9, .15 + .6 * uTexture) * (.82 + .18 * sin(x * 7. + crC)) * crY;
  return mix(col, c, crIn(px, abs(x) - .42 * (1. - v)) * crIn(px, -.02 - v) * step(u, 1.));
}
vec3 crUnder(vec2 p, vec3 rd, float n1, float n2) {
  vec3 col = crSky(rd, n1, n2);
  if (uOwn[7] != 0.) col = crBack(col, p, p.y + .53 + .8 * crUp, 1.5);
  col = crRoof(crFlags(col, p - vec2(0., 3. * crUp)));
  vec2 t = crCone(crRad, .28); float y = crRo.y + crRd.y * t.x; bool front = t.x > 0. && y > -.5 && y < 1.6;
  vec4 board = crEdge(front ? t.x : max(t.y, .1), front);
  if (!front) { col = mix(col, board.rgb, board.a * step(0., t.y)); board.a = 0.; }
  return crRing(col, crMast(), board);
}
// ---- b: far off at dusk. How far from a flattened circle.
float crO(vec2 q, float r, float k) {
  float l = length(vec2(q.x, q.y / k));
  return abs(l - r) * l / max(length(vec2(q.x, q.y / (k * k))), 1e-3);
}
// The ride, in crown widths: what is solid, and the light it gives.
vec4 crLit(vec2 at, float tall, float roof, float e, out vec3 light) {
  vec2 q = crJ * at; vec3 warm = crL, c; vec4 o;
  float k = .2 + .07 * crTip, yb = k * sqrt(max(1.08 - q.x * q.x, 0.)), yt = yb + .36, l = length(vec2(q.x, q.y / k)), a = fract((atan(q.y / k, q.x + 1e-4) + crA) / TAU);
  c = mix(crP, crRed, crT(-.4, .4, sin(at.x * 18. + at.y * 5.))) * warm * (.3 + .75 * crT(-tall, 0., at.y)) * max(1. - 22. * at.x * at.x, 0.);
  o = vec4(c, crIn(e, abs(at.x) - .085 - .06 * crU(0., -tall, at.y)) * crIn(e, at.y) * crIn(e, -tall - at.y));
  c = crMap(mix(crP, crRed, .25 + .25 * crT(.15, .35, abs(fract(a * 24.) - .5))) * warm * (.75 - .25 * l), a, l);
  c += (warm + .15) * (crB((l - .35) / .05) + crB((l - .7) / .045)) * (.5 + .5 * uKeys);
  o = mix(o, vec4(c, 1), crIn(e, (l - 1.04) * k));
  float u = asin(clamp(q.x / 1.04, -1., 1.)) / PI + .5, v = (q.y - yb) / .36 - .5, lv = band(u), p8 = abs(fract(u * 8. + crA * 16. / TAU) - .5);
  c = mix(mix(crRed, crE, crT(.1, .4, p8)), crP, crB(v / .22) * .8) * (.55 + .5 * lv) * (.6 + 2. * yb);
  c += crB(v / .15) * (.25 + .8 * lv * uEnergy + 1.2 * uHits * crB((u - .36) / .07)) * crU(.45, .1, p8);
  o = mix(o, vec4(c * warm, 1), crIn(e, abs(q.x) - 1.04) * crIn(e, yb - .06 - q.y) * crIn(e, q.y - yt));
  float up = sat((q.y - .36) / roof), edge = 1.05 * (1. - up) * (1. - .9 * up * (1. - up)), rib = abs(fract(q.x / max(edge, .02) * 2. + crA * 7. / TAU) - .5);
  c = mix(crRed, crP * .8, crT(.2, .3, rib)) * mix(crMid, warm, .35 * (1. - up)) + warm * .5 * crT(.38, .5, rib) * (.4 + uKeys);
  o = mix(o, vec4(c, 1), crIn(e, abs(q.x) - edge) * crIn(e, yt - q.y) * step(q.y, .36 + roof));
  vec2 q2 = q - vec2(0, .36); float r1 = crO(q, 1.05, k), r2 = crO(q2, 1.1, k), nt = step(-.02, q2.y), w = .022 + .5 * e;
  light = (warm * .9 + .25) * (.75 + .25 * sin(q.x * 40. + crA * 20.)) * (crB(r1 / w) + crB(r2 / w) * nt) * (.7 + .6 * lv);
  light += warm * exp(-min(r1, r2) * 7.) * (.13 + .2 * lv * uEnergy);
  // the chairs, a halo of streaks under a veil of chains, far and near
  float L = .3 * crLen, kk = k * 1.15, dr = L * crSn, dh = -L * crCs / kk, qy = q.y / kk, A = dh * dh - dr * dr, B = qy * dh + .95 * dr, D = B * B - A * (q.x * q.x + qy * qy - .9);
  A = abs(A) < 1e-3 ? 1e-3 : A;
  for (int i = 0; i < 2 && D > 0.; i++) {
    float t = (B + (float(i) * 2. - 1.) * sqrt(D)) / A, hy = qy - t * dh, f = fract((atan(hy, q.x + 1e-4) + crA) / TAU) * 20., id = floor(f), x = f - id, lk = crKind(id);
    float wave = (.03 + .13 * uPhrase) * sin(q.x * 2. + crC * .8), st = crT(0., .1, x) * crU(1., .6 - .55 * crF, x) * (1. + crF), hot = crB((x - .14) / .08);
    vec3 tint = mix(mix(warm, vec3(1, .9, .75), .4), crDye(id), .35 + .5 * max(lk, crF));
    st = st * (.4 + .5 * lk * (.5 + uEnergy) + 1.2 * uHits * crB((q.x + 1.1) / .5) * step(0., hy)) + hot * (.45 + .5 * lk);
    light += crOn(id) * tint * (crB((t - 1. - wave) / .075) * st + .22 * step(0., t) * step(t, 1. + wave) * (.1 + .5 * hot));
  }
  light += warm * (.1 + .1 * uSpace) * (1. + 3. * crF - .6 * crFew + 2. * uCue) * exp(-.25 * dot(q, q));
  return o;
}
vec3 crFar(vec2 p, float n1, float n2, float hor, vec2 at, float S) {
  float y = p.y - hor, e = crPx / S, dep = sat(-y / .42), z = .1 / max(-y, .004), tall = 3. + .8 * uOwn[5]; bool land = y < 0.;
  // the track, its ruts and a puddle
  float tr = p.x - at.x + .42 * crT(.05, 1., dep) - .12 * sin(dep * 3.6), hw = .012 + .24 * dep, W; tr = abs(tr) / hw;
  W = max(.22 - abs(tr - .5), .5 - .55 * length(vec2((p.x - at.x + .03) / (.04 + .34 * dep), (dep - .68) / .4))) + 1.2 * (n2 - .5) + .1 * uDrone;
  float wet = land ? crT(.02, .08, W) * crT(.1, .4, dep) : 0.;
  float rip = .5 * sin(z * 60. + crC * .9) + .5 * sin(p.x * z * 37. + z * 90. - crC * .7);
  vec2 m = land ? vec2(p.x + .006 * rip * (.3 + dep), 2. * at.y - p.y + .012 * rip) : p;
  float sy = m.y - hor;
  vec3 light, sky = mix(mix(crLo, crMid, crT(0., .16, sy)), crHi, crT(.08, .55, sy)), c = sky;
  vec4 ride = crLit((m - at) / S - vec2(0, tall), tall, .8 + .45 * uOwn[5], e, light);
  if (uOwn[6] > 0.) for (int i = 0; i < 2; i++) { // the rides beyond
    float S2 = S * (.62 - .24 * float(i)), k; vec2 a2 = vec2(at.x - 5. * S - 2.6 * S * float(i), hor - .008 * (1. - float(i))); vec3 l2;
    if (abs(p.x - a2.x) > 4. * S2) continue;
    crA += 2.1; vec4 r2 = crLit((vec2(m.x, land ? 2. * a2.y - p.y : p.y) - a2) / S2 - vec2(0, tall), tall, .8 + .45 * uOwn[5], crPx / S2, l2);
    k = r2.a * (1. - ride.a) * crUp; light += l2 * crUp * (1. - ride.a) * crU(4., 3., abs(p.x - a2.x) / S2);
    ride = vec4((ride.rgb * ride.a + r2.rgb * k) / max(ride.a + k, 1e-3), ride.a + k);
  }
  if (!land) {
    c = mix(c, mix(crHi * .75, crLo, .35 * crU(.4, 0., y)), crT(.42, .75, n1 + .12 * crS) * (.5 + .45 * crS));
    c = mix(c, mix(crM, crLo, .35), crIn(crPx * 1.5, y - .02 - .02 * sin(p.x * 11.) * sin(p.x * 4.)));
    if (uOwn[7] != 0.) c = crBack(c, p, y, .8);
    for (int i = 0; i < 7; i++) {
      float f = float(6 - i), h = .43 * exp2(-.42 * f), v = y / h, x = abs(p.x + .21 + .72 * exp2(-.36 * f));
      float wd = h * .13 * sqrt(sat(v * 5.) * sat((1.06 - v) * 1.4)) * (.35 + 1.1 * n2) * (1. - .6 * crW);
      c = mix(c, mix(crM * (.6 + .9 * n2), crLo, .1 + .06 * f), crIn(crPx * 2. + .004 * h, x - max(wd, .02 * h * sat(1. - v))) * step(v, 1.06) * (1. - crTown));
    }
    // tents lit from within
    for (int i = 0; i < 4; i++) {
      float f = float(i); vec2 q = (p - at) / S; q.x += i < 2 ? 2.9 - 1.15 * f : .4 - 1.25 * f; q /= .75 + .2 * sin(f * 2.);
      float h = sat(q.y * 1.5 - .75), w = h > 0. ? .75 - h * (1.05 - .3 * h) : .6;
      vec3 t = mix(crP, i % 2 < 1 ? crRed : crE, crT(-.5, .5, sin(9. * q.x / max(w, .04)))) * mix(crL * (.7 - .4 * q.y + .35 * uMic), crMid + .05, step(.5, q.y));
      c = mix(c, t, crIn(e, abs(q.x) - w) * step(q.y, 1.16));
    }
    // steam
    float t = max(p.y - at.y, 0.) / .5, px = p.x - at.x + 1.9 * S + (.1 + .2 * crS) * t * (1. + t), th = exp(-px * px / (.0008 + .018 * t * t));
    c = mix(c, mix(crLo, crL, .45) * (.75 + .5 * n2), sat(crT(.2, .65, n2 + .35 * th - .12) * th * crT(0., .03, t) * exp(-t * 2.2) * (.4 + .6 * uTexture)));
  } else {
    vec2 q = vec2(p.x - at.x, 2.3 * (p.y - at.y)) / (3.4 * S); float lit = exp(-dot(q, q));
    c = mix(crM, crV, mix(.4, crT(.25, .75, n1), min(4. * dep, 1.))) * mix(1.15, .6, dep);
    c = mix(c, crLo, .45 * exp(-dep * 9.) + .1 * crT(.55, .8, n1)) + crL * (lit * (.16 + .25 * n1 + .25 * uCue) + .4 * uHits * crB((length(q) - 1.4 + uHits) / .3));
    c = mix(c, crM * .6 + crL * lit * .1, .75 * max(crU(1.2, .8, tr + n1 - .5), crT(-.25, .05, W)));
    c = mix(c, sky * .82, wet);
  }
  float see = land ? wet * .9 : 1.;
  return mix(c, ride.rgb, ride.a * see) + light * see * (1. - .7 * c);
}
vec3 crGrass(vec3 col, vec2 p, float tall, vec3 lo, vec3 hi) {
  for (int i = 0; i < 4; i++) {
    float la = float(i / 2), sp = .042 - .014 * la, u = p.x / sp + la * 3.7, id = floor(u - .5) + float(i % 2); vec2 h = hash22(vec2(id + 99., 7. + la));
    float H = tall * (.3 + .9 * h.x * h.x) * (.5 + .7 * crU(.1, -.9, p.x)), v = (p.y + .52) / H;
    float x = (u - id - .5 - .3 * (h.y - .5) - (.6 * (h.y - .4) + .06 * sin(crC * .5 + id)) * v * v) * sp;
    col = mix(col, mix(lo, hi, sat(v) * (.45 + .55 * h.x)), crIn(.006 - .003 * la, abs(x) - .006 * sqrt(sat(1. - v))) * crIn(.1, v - .96));
  }
  return col;
}
// Seeds on the air, or snow.
vec3 crAir(vec3 col, vec2 p, vec3 tint, float seeds) {
  for (float f = 0.; f < 2.; f++) {
    vec2 q = p * (9. + 5. * f) + vec2(.5 * sin(p.y * 3. + crC * .2) - mod(uTime * .16, 256.), mod(uTime * (.2 + .1 * f), 256.)), c = floor(q), h = hash22(mod(c, 256.) + 11. * f);
    col = mix(col, tint, max(seeds * step(.6, h.y), crW) * .85 * crU(.12 + .06 * crW, .03, length(q - c - .2 - .6 * h)));
  }
  return col;
}
vec3 render(vec2 p) {
  bool a = uVar < .5; vec4 w = vec4(uOwn[0], uOwn[1], uOwn[2], uOwn[3]), o = max(w, 0.), n = max(-w, 0.); float wide = o.w, close = n.w, side = min(uRes.x / uRes.y, 1.6) / 1.6, bone = max(-uOwn[4], 0.), lac = max(uOwn[4], 0.);
  crN = n.x; crD = o.x; crW = n.y; crS = o.y; crFew = n.z; crF = o.z;
  crC = mod(uTime, 6283.1853); crA = mod(uTravel * .2, TAU); crPx = 1. / uRes.y; crRad = 3.4 - .9 * uOwn[5]; crLen = 4.4 + 1.2 * uOwn[5];
  float th = mix(.35 + .4 * uPad + .2 * uDrone, 1.4, .7 * crF); crTip = 4. * uCue * (1. - uCue); crSn = sin(th); crCs = cos(th);
  crP = mix(vec3(.97, .91, .78), vec3(.85, .66, .34), lac); crRed = mix(vec3(.76, .24, .16), vec3(.14, .1, .11), lac); crE = mix(vec3(.2, .46, .5), vec3(.5, .08, .09), lac);
  crRed = mix(crRed, vec3(.72, .8, .84), bone); crE = mix(crE, vec3(.84), bone); crG = vec3(.86, .64, .28); crInk = vec3(.13, .12, .17) + .15 * bone;
  crL = mix(mix(vec3(1, .68, .34), vec3(.8, .95, 1), bone), vec3(1, .36, .22), lac);
  crY = 1. - .55 * crN - (a ? .25 : 0.) * crS;
  crHi = a ? crHour(vec3(.44, .63, .8), vec3(.11, .18, .34), vec3(.47, .47, .64)) : crHour(vec3(.085, .15, .3), vec3(.02, .035, .09), vec3(.32, .36, .55));
  crLo = a ? crHour(vec3(.86, .91, .91), vec3(.45, .5, .62), vec3(.97, .75, .5)) : crHour(vec3(.55, .5, .5), vec3(.12, .15, .25), vec3(.99, .72, .5)) + vec3(.35, .32, .17) * crS;
  crMid = mix(crLo, crHi, .65);
  crM = mix(crHi * vec3(.5, .5, .36), crMid, .7 * crW); crV = mix(crLo * vec3(.3, .46, .38), crLo * 1.1 + .05, .9 * crW);
  vec2 q1, q2, at, p0 = p; float wetp = 0.; vec3 rd = vec3(0, 0, 1), c = rd, lo = crM * .5, hi = mix(crM, crV, .7); float hor = -.1 - .1 * wide - .04 * close, S = .105 * exp2(.9 * close - .6 * wide), tip = crC * .09;
  at = vec2((.36 - .1 * close) * side, hor - .016 - .03 * close);
  if (a) {
    float el = .68 + .25 * close - .2 * wide; vec2 q = rot(-.36) * (p - vec2(.45 * side - .32, .08));
    if (uOwn[6] != 0.) { el = mix(mix(el, 1.36, crUp), .1, crLow); q = mix(q, p - vec2(.1, -.02), crUp); q = mix(q, rot(-.12) * (p - vec2(.12, .05)), crLow); }
    vec3 fw = vec3(-.659 * cos(el), sin(el), .752 * cos(el)), rt = vec3(.752, 0, .659);
    crRd = rd = normalize(q.x * rt + q.y * cross(fw, rt) + .7 * fw); crRo = vec3(0, -6.5 - .5 * uPad, -4.7 + 2. * close - 5. * wide - 5. * crSn); crPx /= .7;
    if (uOwn[6] != 0.) crRo = mix(mix(crRo, vec3(1.5, -7.4, -1.6), crUp), vec3(1.2, -3.4, -7.6 + 2.5 * close - 5. * wide - 3. * crSn), crLow);
    crSun = normalize(vec3(-.95 + .25 * sin(TAU * uLoop), .95, .15 + .1 * cos(TAU * uLoop)));
    mat2 m1 = rot(.05 * sin(tip) + .14 * crTip), m2 = rot(.05 * cos(tip) - .08 * crTip);
    crRo.xy = m1 * crRo.xy; crRd.xy = m1 * crRd.xy; crRo.zy = m2 * crRo.zy; crRd.zy = m2 * crRd.zy;
    q1 = rd.xz / (sat(rd.y) + .4) * 2. + vec2(uTravel * .004, 0); q1 += .25 * sin(q1.yx * 2.3); q2 = q1 * 1.4 + vec2(5, 2) - .15 * crSun.xz;
    lo = mix(vec3(.07, .13, .06), vec3(.4), crW) * crY; hi = mix(mix(vec3(.5, .6, .22), vec3(.8, .55, .25), crD), vec3(.86), crW) * crY;
  } else {
    if (uOwn[6] < 0.) {
      float d = hor - p.y, z = .1 / max(d, .004), sh = .47 * (1. - crLow) + .03 * (noise(vec2(p.x * 3., 1.)) - .2) * z * .2;
      wetp = d > 0. ? crT(sh, sh + .004, d) : 0.;
      if (wetp > .5) { float w = sin(z * 46. + crC * .8 + 2. * sin(p.x * z * 20.)) + .6 * sin(z * 83. - crC * .6 + p.x * z * 40.); p += vec2(.003, .02) * w * d * (.4 + d); p.y = max(2. * hor - p.y, hor + .0005); } else wetp = 0.;
    }
    float z = .1 / max(hor - p.y, .004); bool land = p.y < hor;
    q1 = land ? vec2(p.x * z * 60., log(z) * 14.) : vec2(p.x * 2.2 + uTravel * .004, (p.y - hor) * 9. + p.x);
    q2 = land ? vec2(p.x * z * 8., log(z) * 6.) : p * vec2(16, 12) - vec2(0, mod(uTime * .12, 512.));
    crJ = rot(.11 + .04 * sin(tip) + .16 * crTip);
  }
  float n1 = crSoft(q1), n2 = crSoft(q2), m = mod(uTime * .12, 512.) - 508.;
  if (m > 0.) n2 = mix(n2, crSoft(q2 + vec2(0, a || p.y < hor ? 0 : 512)), m / 4.);
  for (int i = 0; i < 1 && a; i++) c = crUnder(p, rd, n1, n2);
  for (int i = 0; i < 1 && !a; i++) c = crFar(p, n1, n2, hor, at, S);
  if (wetp > 0.) c = c * .75 + crL * .5 * uHits * crB((length(vec2(p0.x - at.x, 2.3 * (p0.y - at.y))) / (3.4 * S) - 1.4 + uHits) / .3);
  c = crGrass(c, p0 + vec2(0., a ? crUp + crLow : 0.), a ? .22 : .11, lo, hi);
  return sat(crAir(c, p, vec3(1, .98, .92) * (a ? .4 + .6 * crY : .65 + .3 * crD), a ? uTexture * (1. - .8 * crTown) * (1. - .6 * crLow) : 0.));
}
