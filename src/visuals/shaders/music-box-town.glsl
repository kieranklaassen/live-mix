// name: Music box town
// a: Round the barrel
// b: Star wheels
// what: A little town stands on a slowly turning brass barrel: small over the top against a warm grey wall, it rolls down to a steel comb where each roof lifts a tooth; or the town stands on a slotted brass disc that turns over five toothed wheels, each a round square with trees and a fountain, in a dark box.
// follows: Houses rise and light the street where the piece sounds, at the comb what sounds now. Bands lift and light the teeth, or the rim's slots. Drone is the sheen of brass, pad the window, texture the brushing; each kind lights its houses, or its wheel and fountain. A hit runs out along the teeth or the rim, a cue lights every window, keys and voice a few.
// own: 0 night with lit windows at -1, pale bright morning at 1; 1 black iron at -1, white enamel at 1; 2 a few cottages at -1, a crowded tall town at 1; 3 flat roofs at -1, long spires at 1; 4 low and from another side at -1, from high above at 1; 5 moss and grass at -1, snow at 1
// Run only where it is needed.
#define MBIF(c) for (int go = (c) ? 1 : 0; go > 0; go--)
bool mbB, mbTw;
float mbTp, mbN, mbDt, mbRot, mbPx, mbSu, mbAt, mbDay, mbNi, mbSn, mbMo, mbUn;
const vec3 mbIc = vec3(.8, .85, .92), mbL = vec3(-.752, .647, -.125);
vec3 mbMe;
float mbIn(float d, float w) { return sat(.5 - .5 * d / w); }
float mbUp(float a, float b, float x) { return sat((x - a) / (b - a)); }
float mbOf(float a, float b, float x) { return sat((b - x) / (b - a)); }
float mbLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float mbCr(vec2 a, vec2 b) { return a.x * b.y - a.y * b.x; }
vec4 mbHs(vec2 p) {
 vec4 q = fract(p.xyxy * vec4(.1031, .103, .0973, .1099));
 q += dot(q, q.wzxy + 33.33);
 return fract((q.xxyz + q.yzzw) * q.zywx);
}
// A house: its numbers, the piece there, half width and depth, the roof's tip and slopes, if it is there.
vec4 mbH = vec4(0), mbM = vec4(0); float mbW = 0., mbD = 0., mbT = 0., mbK1 = 0., mbK2 = 0., mbEx = 0.; vec2 mbId = vec2(0);
void mbAt0(vec2 c) {
 float row = mod(c.x, mbN);
 mbId = vec2(row, c.y);
 mbH = mbHs(mbId + vec2(7, 41));
 bool hero = !mbB && mod(row, 4.) < .5 && c.y == 0., no = mbB ? abs(c.y - 5.) > 2.2 : !hero && (mod(row, 7.) < .5 || mod(c.y, 7.) == 3.);
 if (hero) mbH.yz = vec2(.8, .95);
 mbEx = no ? 0. : hero ? 1. : mbUp(-.02, .02, mbH.x - .17 + .46 * uOwn[2]);
 mbTw = mbH.z > .87;
}
void mbHo(vec2 c) {
 float ang = mbB ? (c.x + .5) * mbDt + mbRot + PI * .5 : mbAt - (c.x + .5) * mbDt - mbRot;
 ang = mod(ang + PI, TAU) - PI;
 float at = fract(uLoop + ang * .3);
 mbM = piece(vec2(at, mbB ? sat(c.y * .2 - .5) : sat(.5 + c.y * .04))) * sat(min(at, 1. - at) * 25.);
 mbW = (mbB ? 1. : 1.25) * (mbTw ? .26 : .33 + .12 * mbH.y) * mbEx;
 mbD = (mbB ? 2. * c.y + .5 : 10.) * mbDt * (mbTw ? .26 : .31 + .13 * mbH.w) * mbEx;
 float sl = .95 + (uOwn[3] < 0. ? .91 : 1.45) * uOwn[3], wall = .28 + .3 * mbH.y + (mbTw ? .55 + .3 * mbH.w : 0.) + (mbTw ? .75 : 1.2) * sat(mbM.a * (.6 + .7 * uEnergy)) * (.5 + .5 * mbH.w);
 wall *= 1. + (uOwn[2] < 0. ? .3 : .6) * uOwn[2];
 // under the comb, or near the wall of the box, it draws in its head
 mbUn = mbB ? 1. : .04 + .96 * mbUp(-.1, .07, ang);
 float head = mbB ? mbOf(-1., 3.5, -(2. * c.y + .5) * cos(ang)) : (.5 + .5 * mbUp(.06, .42, ang)) * mbUp(-.2, -.05, ang);
 wall *= mbEx * head; sl *= sat(.2 + head);
 bool turn = mbH.w > .5;
 mbK1 = mbTw ? sl * 2. : turn ? sl : 0.;
 mbK2 = mbTw ? mbK1 * mbW / max(mbD, .01) : turn ? 0. : sl;
 mbT = min(wall + max(mbK1 * mbW, mbK2 * mbD), mbTp);
}
vec3 mbLa() { return mix(vec3(1, .6, .2), mbM.rgb / max(mbM.a, .02), .35 * sat(mbM.a * 3.)); }
// The room as polished metal sees it: a warm grey wall, a tall window upper left, dark below.
vec3 mbRm(vec3 d) {
 vec2 w = vec2((d.x + .62) * 1.7, (d.y - .55) * 1.6);
 return (mix(vec3(.05, .042, .036), vec3(.4, .36, .31), mbUp(-.35, .5, d.y)) + vec3(1.25, 1.12, .92) * exp(-dot(w, w) * 2.5)) * mbDay;
}
vec3 mbLo, mbLd;
vec3 mbTo(vec2 ec, vec2 v, float a) { float x = dot(ec, v), y = mbCr(ec, v); return mbB ? vec3(x, a, y) : vec3(a, x, y); }
vec3 mbSh(vec3 P, vec3 n, vec3 l, float px) {
 float loud = sat(mbM.a * 1.2), roof = mbUp(.1, .35, n.y);
 int ki = int(min(5. * fract(dot(floor(mbId * .34), vec2(.37, .61)) + mbH.y * .35), 4.));
 if (mbTw && mbId.y == 0.) ki = 4;
 vec3 kc = uKind[ki] * uKind[ki], tile = mix(vec3(.36, .1, .05), kc * .6 + .015, ki == 4 ? .15 : .62) * (.65 + .5 * mbH.z);
 tile *= 1. - .3 * sat(1. - px * 18.) * mbUp(.55, .95, fract(P.y * 9.));
 tile += (tile * .9 + kc * .12) * mbLv(ki);
 tile = mix(mix(tile, mbIc, mbSn * .95), vec3(.13, .22, .06) * (.7 + .8 * mbH.x), mbMo * .8);
 vec3 pl = mix(vec3(.84, .74, .59), kc + .12, .05 + .14 * mbH.x) * (.72 + .3 * mbH.w) * (.55 + .45 * mbUp(0., .5, P.y));
 // the windows
 vec3 lamp = mbLa(), pane = lamp;
 float win = 0.;
 MBIF(roof < .99) {
 vec2 g = vec2(((abs(n.x) > abs(n.z) ? P.z / max(mbD, .01) : P.x / max(mbW, .01)) * .5 + .5) * (mbTw ? 1. : 2.), P.y / .34 - .2), id = floor(g), f = abs(fract(g) - .5), aw = px * vec2(2.2 / max(mbW, .05), 3);
 f -= vec2(mbTw ? .17 : .2, .27);
 win = mbIn(f.x, aw.x) * mbIn(f.y, aw.y) * mbUp(0., .04, mbT - max(mbK1 * mbW, mbK2 * mbD) - (id.y + 1.) * .34) * step(0., id.y) * sat(1.3 - px * 9.);
 float hw = hash21(id + mbH.xy * 91. + n.xz * 7.), lit = sat(1.6 * (loud * .9 + .5 * mbLv(ki) + .75 * mbNi + 1.2 * uKeys * step(.7, hw) + .7 * uMic * step(hw, .6) + 1.2 * uCue + .12 - hw));
 pane = mix(vec3(.06, .06, .07) * mbDay + .004, lamp * (1.5 + .8 * mbNi), lit);
 }
 vec3 c = mix(pl, tile, roof) * (vec3(1.5, 1.28, .98) * mbDay * sat(dot(n, l)) + vec3(.3, .275, .25) * (mbDay * (.7 + .3 * n.y) + .02));
 c += (1. - roof) * lamp * (.13 * loud + .08 * mbNi) * pl * exp(-P.y * 1.4);
 return mix(c, pane, win * (1. - roof));
}
float mbWt;
vec2 mbTr(vec2 w) { float a = floor((atan(w.y, w.x + 1e-5) - mbWt) * 1.4324 + .5) * .69813 + mbWt; return vec2(cos(a), sin(a)); }
vec3 render(vec2 p) {
 mbB = uVar > .5;
 float v = uOwn[4];
 mbNi = max(-uOwn[0], 0.); mbSn = max(uOwn[5], 0.); mbMo = max(-uOwn[5], 0.);
 mbDay = (.95 + .3 * uPad + .1 * uLevel) * (1. + (uOwn[0] < 0. ? .9 : .35) * uOwn[0]);
 mbMe = mix(vec3(.9, .55, .19), uOwn[1] < 0. ? vec3(.15, .17, .21) : vec3(.95, .94, .9), abs(uOwn[1]));
 mbN = mbB ? 60. : 52.; mbDt = TAU / mbN; mbSu = mbB ? 2. : 1.25; mbAt = 2.618;
 mbRot = TAU * fract(uTime * .0012 + uTravel * .004);
 mbTp = 2.2 + (uOwn[2] < 0. ? .5 : .8) * uOwn[2] + (uOwn[3] < 0. ? .2 : .6) * uOwn[3];
 float yaw = .3 + .03 * sin(uTime * .05) + (v < 0. ? .75 : -.15) * v, el = .33 + (v < 0. ? .12 : .28) * v, di = 22. + 2. * (uSpace - .5);
 vec3 ta = vec3(.6, 7.2, -6);
 if (mbB) { yaw -= .7; el = .57 + (v < 0. ? .13 : .4) * v; di -= 4.; ta = vec3(-.3, .3, -12.8); }
 vec3 F = vec3(sin(yaw) * cos(el), -sin(el), cos(yaw) * cos(el)), ro = ta - F * di, X = normalize(cross(vec3(0, 1, 0), F)), Y = cross(F, X), rd = normalize(F * 1.28 + X * p.x + Y * p.y);
 mbPx = .78 / uRes.y;
 rd += step(abs(rd), vec3(1e-4)) * 2e-4;
 vec3 col = vec3(0), cc = col, lamp = col, sum = col, n = vec3(0, 1, 0), q, warm = mix(vec3(1, .9, .7), uKind[4], .3), ste = vec3(.6, .66, .74);
 vec2 o2 = ro.zy, d2 = rd.zy, lf = vec2(-.986, -.164), to = vec2(-1.162, -.193), L2 = mbL.zy, w, mid = vec2(99);
 vec3 kc = lamp;
 float r0 = 0., lv = 0., oa = ro.x, da = rd.x, La = mbL.x, t0, t1, gk = 0., comb = 0., t, px, iy = 1. / min(rd.y, -1e-3), tg = -ro.y * iy, tW = (4. - ro.z) / max(rd.z, 1e-3);
 if (mbB) { o2 = ro.xz; d2 = rd.xz; oa = ro.y; da = rd.y; L2 = mbL.xz; La = mbL.y; }
 float A = dot(d2, d2), bq = dot(o2, d2), cq = dot(o2, o2), q1 = bq * bq - A * (cq - 100.), q2 = bq * bq - A * (cq - (10. + mbTp) * (10. + mbTp));
 MBIF(!mbB) {
  // the wall, and the window's light on it
  vec2 b = p - vec2(-.5, .36); b.x += .35 * b.y;
  float pane = mbIn(abs(b.x) - .26, .03) * mbIn(abs(b.y) - .2, .03) * mbUp(.004, .016, abs(b.x)) * mbUp(.004, .016, abs(b.y - .03));
  col = mix(vec3(.3, .265, .225), vec3(.21, .185, .16), mbUp(-.9, .7, p.x)) * (mbDay + .03) + vec3(.34, .29, .21) * pane * mbDay * (.5 + .9 * uPad);
  t0 = q2 > 0. ? max((-bq - sqrt(q2)) / A, 0.) : 1.;
  t1 = q1 > 0. ? (-bq - sqrt(q1)) / A : (-bq + sqrt(max(q2, 0.))) / A;
  gk = q1 > 0. ? sat(q1 / (bq * bq) / (mbPx * .4)) : 0.;
  if (q2 <= 0.) t1 = 0.;
  // the comb: a tooth to each lane, lifted by the roof now under it
  float ti = 0., s = 0., lift = 0., bd = 0.;
  t = (4.9 - ro.y) * iy;
  for (int i = 0; i < 3; i++) {
   q = ro + rd * t;
   s = (q.z + 14.7) / 4.6; ti = floor(q.x / mbSu + .5); lift = 0.;
   bd = uBands[int(clamp(floor((ti + 13.) * .6), 0., 15.))];
   if (s > -.2 && s < 1.4) {
    float u = (mbAt - mbRot) / mbDt, k = floor(u), a = u - k - .5;
    mbAt0(vec2(k, ti));
    lift = mbEx * (mbTw ? 1. : .6) * mbUp(-.5, .25, a) * mbOf(.3, .5, a) * (.3 + .4 * bd) + .12 * bd;
   }
   float ss = sat(s);
   t = (4.9 + lift * ss * ss - ro.y) * iy;
  }
  q = ro + rd * t; px = t * mbPx;
  s = (q.z + 14.7) / 4.6;
  float dx = q.x - ti * mbSu, hw = s < 0. ? mbSu : mbSu * mix(.45, .3, sat(s)), u = dx / hw;
  comb = mbIn(abs(dx) - hw, px) * mbIn((s - 1.) * 1.8, px) * step(rd.y, -.02);
  if (comb > 0.) {
   vec3 m = normalize(vec3(.1 * u + .05 * (hash11(ti + 3.) - .5), 1, -1.3 * lift * sat(s)));
   cc = ste * (mbRm(reflect(rd, m)) * (.6 + .6 * noise(vec2(dx * 50. + ti * 9., q.z * .6))) + .06 * mbDay) * (.45 + .75 * mbUp(-.3, 1., s));
   cc += vec3(1, .95, .86) * mbDay * (.3 + .5 * sat(s)) * mbOf(0., .16, abs(u + .85)) * step(0., s);
   cc *= s > 0. ? 1. - .6 * mbUp(.75, 1., u) : 1.;
   float g = (s - uHits) * 6., g2 = (s - .8) * 3., g3 = abs(ti) - 9. * (1. - uHits);
   cc += warm * uHits * exp(-g3 * g3 * .4) * 1.3 * sat(s * 2.) + warm * ((ti == 0. ? 2. * uHits * exp(-g * g) : 0.) + .5 * bd * exp(-g2 * g2)) * mbOf(.2, .9, abs(u));
   w = vec2((fract(q.x * .20833) - .5) * 4.8, q.z + 16.1);
   float rr = length(w);
   cc = mix(cc, vec3(.75, .52, .22) * mbDay * (.25 + .5 * sat(.5 + w.y - w.x) * mbUp(.3, .5, rr)) * mbUp(.05, .08 + px, abs(dot(w, vec2(.8, .6)))), mbOf(.5 - px * 1.5, .5, rr));
  }
 }
 MBIF(mbB) {
  t0 = tg + mbTp * iy; t1 = min(tg, tW);
  if (tg >= tW) {
   // the wall of the box, and the shadow of the winding key going round
   q = ro + rd * tW;
   w = rot(.12) * (q.xy - vec2(-5, 2)); w.x /= .35 + .65 * abs(cos(uTravel * .05 + .4));
   float kd = min(abs(length(vec2(abs(w.x) - .8, w.y)) - .5) - .28, length(vec2(w.x, max(abs(w.y + 1.2) - 1.2, 0.))) - .2);
   col = vec3(.125, .064, .037) * mbDay * (.3 + (1.4 + .9 * uPad) * mbOf(1.5, 4.5, abs(q.x + 5. + .6 * q.y)) * mbUp(-.12, .12, kd)) * (.3 + .7 * mbUp(0., 1.2, q.y));
  }
  r0 = length(ro.xz + rd.xz * tg);
  if (tg < tW) gk = mbIn(r0 - 16., tg * mbPx);
  MBIF(tg < tW && r0 > 15.3) {
   // the base of dark wood
   t = tg - iy; q = ro + rd * t;
   vec2 bl = q.xz + to * .4 - vec2(-12, -24.5);
   float sh = mbUp(-.5, .5, length(q.xz + to) - 16.) * (1. - mbOf(.1, .35, abs(length(bl) - 7.)) * step(0., min(bl.x, bl.y)) * mbOf(6.1, 6.4, bl.y));
   w = q.xz + to * .35;
   // the nearest of five wheels: its number, middle, and turn as the slots hold it
   q = ro + rd * (tg - iy * .32); q.xz += to * .2;
   float wi = clamp(floor((atan(q.x, -q.z) + .08) / .315 + .5), -2., 2.), a = wi * .315 - .08;
   mid = 18.1 * vec2(sin(a), -cos(a));
   mbWt = a + PI * .5 + (fract((a - PI * .5 - mbRot) / mbDt) - .5) * TAU / 9.;
   col = mix(vec3(.07, .034, .018), vec3(.17, .08, .04), .5 + .3 * sin(q.z * 4. + q.x * .4 + 2. * sin(q.x * .23 + q.z * .7)) + .2 * sin(q.z * 9. + q.x * .9) * sat(1.6 - t * mbPx * 30.)) * mbDay * (.25 + 1.2 * sh * mbUp(1.7, 2.45, length(w - mid)));
   lv = mbLv(int(wi + 2.)); kc = uKind[int(wi + 2.)];
   for (float i = 0.; i < 2.; i++) {
    t = tg - iy * (.6 - .28 * i); px = t * mbPx; q = ro + rd * t; w = q.xz - mid;
    float lw = length(w), d = (lw - 1.95 - .55 * smoothstep(.05, .95, .5 + .5 * cos((atan(w.y, w.x + 1e-5) - mbWt) * 9.))) * .75, l = dot(w, lf) / max(lw, .1), sd = mbUp(-.3, .3, length(q.xz + to * .35) - 16.);
    vec3 m = mbMe * .1;
    if (i > .5) m = mbMe * (.25 + sd * (.5 + .3 * l * l + .12 * sin(lw * 40.) + .7 * mbOf(.02, .1, abs(d + .08)) * sat(l) + .4 * uDrone * l * l)) + kc * lv * .3;
    col = mix(col, m * mbDay, mbIn(d, px));
   }
   // the round square on it: paving, a ring in its sound's colour, the trees' shadows, a basin
   t = tg - iy * .25; px = t * mbPx; q = ro + rd * t; w = q.xz - mid;
   float lw = length(w), k = mbIn(lw - 1.6, px);
   if (k > 0.) {
    vec3 st = mix(vec3(.5, .46, .39), mbIc, mbSn) * (.95 + .08 * sin(w.x * 22.) * sin(w.y * 22.));
    st = mix(st, kc * kc * (.45 + .9 * lv) + .03, mbIn(abs(lw - 1.46) - .07, px));
    st = mix(st, vec3(.1, .22, .27) + kc * lv * .6, mbIn(lw - .46, px)) * (1. + .5 * mbOf(0., .09, abs(lw - .5)));
    w += to * .5;
    col = mix(col, st * mbDay * (.3 + 1.05 * mbUp(.2, .42, length(w - mbTr(w)))), k);
   }
   w = (ro.xz + rd.xz * (tg - iy * .2)) / 16.;
   col = mix(col, mbMe * mbDay * (.2 + .6 * sat(dot(w, lf))), mbIn(length(w) - 1., tg * mbPx * .06));
  }
 }
 // Along the ray from cell to cell of the town, then from the ground it meets toward the light.
 float tr = 1., see = 1., pool = 0., gl = 0., th = 0., gv = 0., gu = 0.;
 for (int pass = 0; pass < 2; pass++) {
  vec2 a2 = o2, e2 = d2; float b0 = oa, b1 = da, s0 = t0, s1 = t1;
  if (pass > 0) {
   see = tr;
   if (see * gk < .01 || comb > .98) break;
   lamp = mbLa(); pool = mbEx * (.8 * sat(mbM.a) + .5 * mbNi * mbH.x + 1.2 * uCue);
   q = ro + rd * t1; a2 = o2 + d2 * t1; th = atan(a2.y, a2.x); gv = (th - mbRot) / mbDt;
   if (!mbB) n = normalize(vec3(0, q.yz));
   gu = mbB ? length(q.xz) : q.x / mbSu + .5;
   gl = dot(n, mbL); tr = 1.;
   if (gl < .02) break;
   a2 *= 1.0005; e2 = L2; b0 = mbB ? .001 : q.x; b1 = La; s0 = .01; s1 = 2.5;
  } else if (s1 <= s0 || comb > .98) continue;
  float AA = dot(e2, e2), bb = dot(a2, e2), c2 = dot(a2, a2);
  t = s0; w = a2 + e2 * t;
  float sg = mbCr(a2, e2) > 0. ? 1. : -1., k = floor((atan(w.y, w.x) - mbRot) / mbDt), ac = (k + .5) * mbDt + mbRot, ab = ac + .5 * sg * mbDt;
  vec2 ec = vec2(cos(ac), sin(ac)), eb = vec2(cos(ab), sin(ab));
  mat2 rs = rot(-sg * mbDt);
  float at = floor(mbB ? length(w) * .5 : (b0 + b1 * t) / mbSu + .5), st = b1 > 0. ? 1. : -1., tB;
  for (int i = 0; i < 24; i++) {
   float cr = mbCr(e2, eb), tA = -mbCr(a2, eb) / (abs(cr) < 1e-5 ? 1e-5 : cr);
   if (tA <= t) tA = 1e9;
   if (mbB) {
    float g = bb * bb - AA * (c2 - 4. * at * at), ti = (-bb - sqrt(max(g, 0.))) / AA;
    st = g > 0. && ti > t ? -1. : 1.;
    tB = st < 0. ? ti : (-bb + sqrt(max(bb * bb - AA * (c2 - 4. * (at + 1.) * (at + 1.)), 0.))) / AA;
   } else tB = ((at + .5 * st) * mbSu - b0) / b1;
   float te = min(min(tA, tB), s1);
   mbAt0(vec2(k, at));
   MBIF(mbEx > .01) {
    mbHo(vec2(k, at));
    mbLo = mbTo(ec, a2, b0); mbLd = mbTo(ec, e2, b1) + 1e-6;
    if (mbB) mbLo.x -= 2. * at + .5; else mbLo.xy -= vec2(at * mbSu, 10);
   }
   MBIF(mbEx > .01 && min(mbLo.y + mbLd.y * t, mbLo.y + mbLd.y * te) < mbT) {
    // four walls, four slopes of roof
    vec2 sn = -sign(mbLd.xz), hf = vec2(mbW, mbD), in2 = (sn * hf - mbLo.xz) / mbLd.xz, o = (-sn * hf - mbLo.xz) / mbLd.xz;
    vec4 ks = vec4(mbK1, -mbK1, mbK2, -mbK2), de = mbLd.y + ks * vec4(mbLd.xx, mbLd.zz), tt = (mbT - mbLo.y - ks * vec4(mbLo.xx, mbLo.zz)) / (de + step(abs(de), vec4(1e-5)) * 2e-5);
    bvec4 cu = lessThan(de, vec4(0));
    vec4 c4 = mix(vec4(-1e9), tt, cu), l4 = mix(tt, vec4(1e9), cu);
    float rm = max(max(c4.x, c4.y), max(c4.z, c4.w)), s9 = max(in2.x, in2.y), te1 = max(s9, rm), te2 = max(min(in2.x, in2.y), min(s9, rm)), ch = min(min(min(o.x, o.y), min(min(l4.x, l4.y), min(l4.z, l4.w))), s1 + .1) - te1;
    if (te1 < s0 - .02) ch = 0.;
    if (pass > 0) tr *= 1. - mbUp(0., .1 + .16 * max(te1, 0.), ch) * mbOf(1.8, 2.5, te1);
    MBIF(pass < 1 && ch > 0.) {
     px = te1 * mbPx;
     vec3 nr = normalize(c4.x >= rm ? vec3(mbK1, 1, 0) : c4.y >= rm ? vec3(-mbK1, 1, 0) : vec3(0, 1, c4.z >= rm ? mbK2 : -mbK2)), ns = in2.x > in2.y ? vec3(sn.x, 0, 0) : vec3(0, 0, sn.y), na = rm > s9 ? nr : ns, nb = rm > s9 ? ns : rm >= te2 ? nr : vec3(sn.x, 0, sn.y) - ns;
     float al = sat(ch / (px * 2.5));
     sum += tr * al * mbUn * mbSh(mbLo + mbLd * te1, normalize(mix(nb, na, .5 + .5 * sat((te1 - te2) / (px * 3.)) + 1e-4)), mbTo(ec, L2, La), px);
     tr *= 1. - al;
    }
   }
   if (te >= s1 || tr < .12 || (pass > 0 && i > 1)) break;
   if (tA < tB) { k += sg; ec = rs * ec; eb = rs * eb; } else at += st;
   t = te;
  }
 }
 // the turned brass, the window drawn out into one long sheen
 MBIF(see * gk > .01 && comb < .98) {
  vec2 cs = vec2(cos(th - mbRot), sin(th - mbRot));
  px = t1 * mbPx;
  float ax = mbB ? gu : q.x, br = mix(.5, noise(vec2(ax * (mbB ? 20. : 42.), 9. * cs.y)), (.45 + .4 * uTexture) * (mbB ? sat(2. + 14. * px / min(rd.y, -.02)) : 1.)), dif = sat(gl) * tr, f = fract(gu) - .5, ring = floor(gu);
  vec3 r = reflect(rd, n);
  float sn = (mbB ? length(r.xz - vec2(-.45, .6)) : atan(r.y, -r.z) - 1.2) * (1.9 + 1.4 * uTone), ang = mbAt - th;
  vec3 g = mbMe * (vec3(.5, .43, .33) * dif * mbDay + mbRm(r) * (.15 + .5 * tr) * (.45 + 1.1 * br)) + mix(mbMe, vec3(1, .93, .8), .25) * exp(-sn * sn) * (.3 + .7 * tr) * mbDay * (.3 + .9 * uDrone) * (.35 + 1.3 * br);
  float ln = mbB ? .5 - abs(f) : abs(abs(mod(gu + 3., 7.) - .5) - .36);
  g *= 1. - .5 * mbOf(.02, .04 + px, ln);
  g *= 1. + .5 * mbOf(.01, .03 + px, abs(ln - .06));
  MBIF(mbSn + mbMo > 0.) {
   float gn = noise(mbB ? gu * cs : vec2(gu + 5. * cs.x, 8. * cs.y));
   g = mix(g, mix(vec3(.11, .19, .055), mbIc, step(0., uOwn[5])) * (.75 * dif + .3) * mbDay, (mbSn + mbMo) * mbUp(.25, .55, gn + .1 + .1 * mbSn));
  }
  vec2 cu = vec2(mbB ? fract(gu * .5) * 2. - .5 : f, fract(gv) - .5); cu = max(1. - cu * cu * vec2(mbB ? 1. : 4., 4), 0.);
  g += lamp * pool * cu.x * cu.y * (mbMe * .6 + .15);
  g *= mbB ? .25 + .75 * mbOf(1.5, 4., q.z) : .03 + .97 * mbUp(-.1, .1, ang);
  if (mbB && ring > 5.5 && (ring > 14.5 || mod(ring, 2.) > .5)) {
   // the slots, lit from under by the piece, and along the rim by the bands
   bool rim = ring > 14.5;
   float g4 = (abs(th + 1.7) - 1. + uHits) * 7., sd = length(vec2(max(abs((fract(gv) - .5) * mbDt * gu) - (rim ? .42 : .1 + .28 * fract(floor(gv) * .616667 + ring * .37)), 0.), f)) - (rim ? .24 : .13);
   vec4 m = piece(vec2(fract(uLoop + (mod(th - PI * .5, TAU) - PI) * .3), sat((ring - 5.) * .1)));
   vec3 glow = m.rgb * 1.2 + vec3(1, .6, .2) * m.a * .6;
   g += (rim ? vec3(0) : glow * .3 * exp(-max(sd, 0.) * 5.)) + mbMe * mbDay * .7 * mbOf(0., .07, abs(sd - .04)) * sat(f * 3.);
   g = mix(g, rim ? vec3(.035, .02, .012) + vec3(1, .6, .2) * (band(sat((th + 2.5) * .55)) * uEnergy + 1.5 * uHits * exp(-g4 * g4)) * mbIn(sd + .1, .12) : vec3(.02, .015, .01) + glow * (.5 + uEnergy), mbIn(sd, px));
  }
  col = mix(col, g, gk);
 }
 MBIF(r0 > 15.3 && tg < tW) {
  // the spring blade, a hit's gleam along it
  w = ro.xz + vec2(12, 24.5);
  float b = dot(w, d2), h = b * b - A * (dot(w, w) - 49.);
  t = (-b - sqrt(max(h, 0.))) / A; px = t * mbPx;
  w = (w + d2 * t) / 7.;
  float y = ro.y + rd.y * t, a = atan(w.y, w.x + 1e-5), g = (a - 1.1 * uHits) * 4.;
  col = mix(col, ste * (mbRm(reflect(rd, vec3(w.x, 0, w.y))) * 1.3 + .08 * mbDay) + mbDay * .5 * mbUp(-.4, -.3, y) + warm * 1.6 * uHits * exp(-g * g), step(0., h) * mbIn(-1. - y, px) * mbIn(y + .3, px) * mbOf(1.05, 1.06, a) * step(-.2, a));
 }
 col = sum + col * see;
 MBIF(r0 > 15.3 && tg < tW) {
  // trees and fountains
  q = ro + rd * (tg + .05 * iy); w = q.xz - mid;
  if (dot(w, w) < 4.) {
   vec2 e = mid + mbTr(w);
   vec3 oc = ro - vec3(e.x, .12, e.y);
   float b = dot(oc, rd), h = dot(oc, oc) - b * b;
   n = normalize(oc + rd * (-b - sqrt(max(.084 - h, 0.))));
   vec3 leaf = mix(mix(vec3(.1, .17, .05), kc * kc, .12) * (1. + .4 * sin(n.x * 17. + e.x) * sin(n.y * 19.) * sin(n.z * 18.)), mbIc, mbSn * mbUp(0., .5, n.y));
   col = mix(col, leaf * mbDay * (.25 + 1.3 * sat(dot(n, mbL))), mbIn(sqrt(max(h, 0.)) - .29, -b * mbPx));
   w = ro.xz - mid; t = -dot(w, rd.xz) / A;
   float y = (ro.y + rd.y * t + .2) / (.45 + .75 * lv), l = length(w + rd.xz * t), j = (l - .4 * sqrt(sat(1. - y))) * 13.;
   col += (vec3(.5, .55, .6) * mbDay + kc * lv * .5) * (exp(-j * j) * .4 + exp(-l * l * 400.) * .8) * (.3 + .7 * lv) * mbUp(0., .1, y) * mbOf(.8, 1., y);
  }
 }
 return screenOf(mix(col, cc, comb));
}
