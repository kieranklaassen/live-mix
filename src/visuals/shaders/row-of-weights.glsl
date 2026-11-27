// name: Row of weights
// a: Down the aisle
// b: Lamps on cords
// what: A long white hall in side light: two dozen brass balls hang in a row from a beam, each on shorter threads than the last, and swing across the aisle as a snake, as files, a scatter and a line again, their shadows on the plaster; or a dark room at night where glass lamps on long and short cords draw the same wave over a wet floor.
// follows: Drone, pads and the mix set how wide they swing, each band a few neighbours. A phrase lays a second wave across; the loop winds the row a little out of step and home. The piece tints each weight, pads lift the light, texture shivers the threads. A hit is a glint passed along, a cue draws all into line; keys glint, a voice lights window or door.
// own: 0 moonlit blue, or a cold dawn outside, at -1, late red gold at 1; 1 plaster weights in a clay-red hall, or paper moons in a pale room, at -1, black weights in a slate hall, or clear bulbs in a green-black room, at 1; 2 a third as many and larger at -1, the grading turned round so the far ones are largest at 1; 3 flat discs, with long low windows or a low ceiling, at -1, tall drops with narrow windows or a high ceiling at 1; 4 seen from near the floor at -1, from high up at 1; 5 the whole row sways almost as one at -1, two files, or a hanging garland with both ends high, at 1
#define rwS smoothstep
vec3 rwAng;        // where the first weight is in its swing, how much further each next one is, and the phrase's wave
float rwDark, rwAu, rwWht, rwBlk, rwFew, rwBig, rwStep, rwRing, rwSy, rwHit, rwTrem, rwLoud, rwLine, rwPx;
vec3 rwL, rwSun, rwSky;
vec4 rwWin;        // a window: from, to along the wall, its sill and its head
const float rwXL = -2.3, rwXR = 1.75, rwH = 3.5, rwZ = 17., rwB = 3.12, rwBay = 2.6;

vec2 rwE(float a) { return vec2(cos(a), sin(a)); }
float rwIn(float x, float a, float b, float w) { return sat((x - a) / w + .5) * sat((b - x) / w + .5); }
float rwGl(float k) { float d = k - rwHit; return uHits / (1. + d * d * d * d); }

// The plain hall in a direction: what the sky gives there (c) and what the sun does (sun). soft blurs it.
// id: 0 the windows, 1 the plaster wall, 2 the floor, 3 the ceiling, 4 the far wall, 5 behind us.
void rwRoom(vec3 ro, vec3 rd, float soft, out vec3 q, out int id, out vec3 c, out float sun) {
 vec3 ad = max(abs(rd), 1e-5);
 vec3 t3 = vec3(rd.x < 0. ? ro.x - rwXL : rwXR - ro.x, rd.y < 0. ? ro.y : rwH - ro.y, rd.z < 0. ? 3. + ro.z : rwZ - ro.z) / ad;
 float t = min(t3.x, min(t3.y, t3.z));
 q = ro + rd * t;
 id = t == t3.x ? (rd.x < 0. ? 0 : 1) : t == t3.y ? (rd.y < 0. ? 2 : 3) : rd.z < 0. ? 5 : 4;
 float w = rwPx * t * 1.6 + soft * .1, far = (q.x - rwXL) / -rwL.x;
 vec3 wall = mix(mix(vec3(1.), vec3(.86, .52, .38), rwWht), vec3(.2, .25, .28), rwBlk);
 vec2 k = max(id == 2 || id == 3 ? vec2(q.x - rwXL, rwXR - q.x) : vec2(q.y, rwH - q.y), 0.);
 // a pane of the windows here, or the pane the sun comes through to this place
 vec3 u = id == 0 ? q : q + rwL * far;
 float wp = id == 0 ? w + .008 : .1 + .05 * far + soft * .1, z = fract(u.z / rwBay) * rwBay;
 float dim = 1. / (1. + wp * 7.), by = abs(fract((u.y - rwWin.z) / .733 + .5) - .5) * .733;
 float a = rwIn(z, rwWin.x, rwWin.y, wp) * rwIn(u.y, rwWin.z, rwWin.w, wp);
 a *= (1. - dim * rwIn(z, 1.225, 1.275, wp)) * (1. - dim * sat((.018 - by) / wp + .5));
 sun = id == 1 || id == 2 ? a : 0.;
 if (id == 0) { // the window wall, against the light
  float rev = rwIn(z, rwWin.x - .11, rwWin.y + .13, .03 + w) * rwIn(q.y, rwWin.z - .08, rwWin.w + .08, .03 + w);
  c = mix(wall * (.36 + .04 * q.y + .42 * rev), vec3(1.75 + .35 * sat((q.y - rwWin.z) * .5)), a);
  k += 9. * rev;
 } else if (id == 1) c = wall * (.8 - .06 * abs(q.y - 1.75));
 else if (id == 2) c = vec3(.42);
 else if (id == 3) c = mix(wall, vec3(1.), .3) * (.62 + .03 * k.x) * (.7 + .3 * sat((abs(fract(q.z / rwBay + .02) - .5) * rwBay - .1) / w + .5));
 else { // behind us it is dark, with one small window; ahead is the bright door
  float b = id == 5 ? rwIn(q.x, -.2, .75, .04) * rwIn(q.y, 1.4, 2.6, .04) * sat(abs(q.x - .27) * 20.) : rwIn(q.x, -.75, .75, w) * rwIn(q.y, -1., 2.9, w);
  float fr = rwIn(q.x, -.93, .93, w) * rwIn(q.y, -1., 3.06, w);
  c = mix(id == 5 ? wall * .36 : wall * .45 * (1. - .3 * fr), id == 5 ? vec3(2.) : mix(vec3(1.), vec3(1., .8, .5) * 1.1 / max(rwSky, .05), .25 + .65 * rwDark) * (1.7 + .8 * uMic), b);
  k += id == 5 ? 9. : 9. * b;
 }
 c *= rwSky * (1. - .28 / (1. + k.x * k.x * 12.)) * (1. - .28 / (1. + k.y * k.y * 12.)); // dusk in the corners
}
// Weight k of the hall: its middle and radius, and how much of it there is.
vec4 rwBall(float k, out float wt) {
 float s = k / 23., third = step(.5, abs(k - 3. * floor(k / 3. + .2)));
 wt = 1. - rwFew * third;
 float rad = mix(.185 - .117 * s * (1.7 - .7 * s), .06 + .36 * s * s, rwBig) * (wt + .7 * rwFew * (1. - third));
 float len = 2.3 - 1.52 * s * (1.28 - .28 * s);
 float x = sin(rwAng.x + k * rwAng.y);
 if (rwStep > 0.) x = mix(x, sin(rwAng.x - .13 * k), rwStep);
 x = (.19 - .09 * s + rwLoud * len * (.7 + .5 * uBands[int(k * .64)])) * rwLine * (x + .5 * uPhrase * sin(rwAng.z - .785 * k));
 float px = rwRing * (fract(k * .5) < .25 ? -.4 : .4);
 return vec4(x + px, rwB - len + x * x * .5 / len, 1.75 * exp(k * .0953), rad);
}

vec3 rwDay(vec2 p) {
 float up = uOwn[4];
 vec3 ro = vec3(.85 + .05 * sin(TAU * uTime / 170.), 1.5 + .03 * sin(TAU * uTime / 130.) + (up > 0. ? 1.1 : .95) * up, 0.);
 vec2 vp = vec2(.2, .06 + .2 * up);
 const float F = 1.3;
 vec3 rd = normalize(vec3(p - vp, F));
 // only the weights this line of sight can meet
 float dx = (p.x - vp.x) / F, dy = (p.y - vp.y) / F, more = 1. + .5 * uPhrase;
 float Rm = .23 + .13 * rwFew + .24 * rwBig, za = 1.2, zb = 17., sq = max(rwSy, 1.);
 float wide = (.2 + rwLoud * 2.8) * more + Rm + .4 * rwRing;
 if (dx < 0.) {
  za = (ro.x - wide) / -dx;
  float s0 = sat(log(max(za, 1.75) / 1.75) * .456);
  zb = (ro.x + (.2 - .09 * s0 + rwLoud * (2.8 - 1.8 * s0)) * more + Rm + .4 * rwRing) / -dx;
 } else if (dx > 0.) zb = (wide - ro.x) / dx;
 if (dy > 0.) zb = min(zb, (rwB - ro.y) / dy + .1);
 int k0 = int(max(log(max(za, 1.6) / 1.75) * 10.492 - .5, 0.)), k1 = zb < 1.6 ? -1 : int(min(log(zb / 1.75) * 10.492 + .5, 23.));
 // the weights and their pairs of threads, nearest first; the two nearest faces are kept for later
 float T = 1.;
 vec3 acc = vec3(0.), thread = mix(vec3(.3, .26, .22) * rwSky, rwSun, .1) + rwBlk * .2 * rwSky;
 vec4 h1 = vec4(0.), h2 = h1; vec3 g1 = vec3(0.), g2 = g1;
 vec3 d = rd; d.y /= rwSy; float dd = dot(d, d);
 for (int i = k0; i <= k1; i++) {
  float k = float(i), wt; vec4 C = rwBall(k, wt);
  vec3 o = C.xyz - ro; float iz = F / o.z, r = C.w;
  vec2 c2 = o.xy * iz + vp, g = p - c2;
  if (T < .01 || (dy < 0. && g.y < -Rm * iz * sq * 1.3 - .03)) break;   // the rest hang higher
  vec3 q2 = o; q2.y /= rwSy;
  float b = dot(q2, d) / dd, m = length(q2 - d * b), e = rwPx * o.z * 1.1;
  float cov = (1. - rwS(r - e, r + e, m)) * wt;
  if (cov > 0. && h2.w == 0.) {
  vec4 h = vec4(q2, T * cov); vec3 f = vec3(r, k, b - sqrt(max(r * r - m * m, 0.) / dd));
  if (h1.w == 0.) { h1 = h; g1 = f; } else { h2 = h; g2 = f; }
  T *= 1. - cov;
  }
  float wd = .0024 * iz, gl = rwGl(k);
  vec2 v = vec2(-ro.x, rwB - ro.y) * iz + vp - c2, sp = vec2(.035 + .045 * ro.x, -.045 * (rwB - ro.y)) * iz;
  if (rwRing > 0.) v.x += rwRing * (fract(k * .5) < .25 ? -.4 : .4) * iz;
  vec2 vx = v.xx + vec2(sp.x, -sp.x), vy = max(v.yy + vec2(sp.y, -sp.y), 1e-3), hh = g.y / vy;
  vec2 dn = abs(g.xx - vx * hh - rwTrem * iz * hh * (1. - hh) * (fract(k * .5) < .25 ? 1. : -1.)) * vy / sqrt(vx * vx + vy * vy);
  vec2 al = sat((max(wd, rwPx * .6) + rwPx * .5 - dn) / rwPx) * step(0., hh) * step(hh, vec2(1.));
  float a = max(al.x, al.y) * min(1., wd / (rwPx * .6)) * .85 * wt;
  acc += T * a * (thread + gl * .5); T *= 1. - a;
 }
 // rays: the hall behind (0), its mirror in the worn floor (1), and what the two weights mirror (2, 3)
 vec3 bg = vec3(0.), mo = ro, mr = rd; int from = T < .01 ? 2 : 0, to = h2.w > 0. ? 4 : h1.w > 0. ? 3 : 2;
 float gloss = 0.;
 for (int i = from; i < to; i++) {
  if (i == 1 && gloss == 0.) { if (h1.w == 0.) break; i = 2; }
  vec4 h = i == 3 ? h2 : h1; vec3 gg = i == 3 ? g2 : g1;
  vec3 n = vec3(0., 1., 0.), q, c; int id; float sun;
  if (i > 1) { n = d * gg.z - h.xyz; n.y /= rwSy; n = normalize(n - 1e-5 * rd); mo = ro + rd * gg.z; mr = reflect(rd, n); }
  rwRoom(mo, mr, float(i > 1) + 2. * float(i == 1), q, id, c, sun);
  bool onFloor = id == 2, surf = id == 1 || onFloor;
  if (i == 0) {
  // the plaster or the boards, and how much sun (x) and sky (y) the row lets by: the weights near the way to the light
  vec2 sh = vec2(1.);
  if (surf) {
  vec3 sk = onFloor ? vec3(-.12, .99, 0.) : vec3(-.97, .22, -.1);
  float zs = q.z + rwL.z * (q.x / -rwL.x), zk = onFloor ? q.z : q.z - .1 * q.x;
  vec2 w2 = log(max(vec2(min(zs, zk) - .3, max(zs, zk) + .3), 1.6) / 1.75) * 10.492;
  for (int j = max(int(w2.x - .5), 0); j <= min(int(w2.y + 1.), 23); j++) {
  float wt; vec4 C = rwBall(float(j), wt); vec3 o = C.xyz - q;
  float t = max(dot(o, rwL), 0.), w = .014 + (.028 - .018 * uTone) * t;
  vec3 m = o - rwL * t; m.y /= rwSy;
  sh.x *= 1. - (1. - rwS(C.w - w, C.w + w, length(m))) * .94 * wt;
  t = dot(o, sk); m = o - sk * t;
  float r2 = C.w * C.w + 1e-5, e = dot(m, m) / (r2 * 1.2 + .04 * t * t);
  sh.y *= 1. - .8 * r2 / ((r2 + .03 * t * t) * (1. + e) * (1. + e));
  }
  float bx = q.x / .24, ib = floor(bx), aw = rwPx * q.z * 7., fade = 1. / (1. + .02 * q.z * q.z);
  float gr = noise(onFloor ? vec2(q.x * 40., q.z * 1.3 + ib * 7.) : q.zy * vec2(2.3, 2.8));
  vec3 alb = vec3(.97, .95, .91) * (.93 + .07 * gr) * (1. - .3 * (1. - sat((q.y - .175) / (.012 + rwPx * 6.) + .5)));
  vec3 lit = mix(mix(vec3(1.7), vec3(1.5, .95, .7), rwWht), vec3(.5, .55, .56), rwBlk);
  if (onFloor) {
  alb = mix(vec3(.86, .75, .61), vec3(.3, .24, .2), rwBlk * .8) * (.88 + .12 * hash11(ib + 3.) + .08 * fade * gr);
  alb *= 1. - .5 * rwS(.48 - aw, .5, abs(fract(bx) - .5)) * fade;
  lit = vec3(1.6);
  }
  c = alb * (c * sh.y + rwSun * sun * sh.x * lit);
  c += alb * (onFloor ? uKind[0] * uDrone : uKind[1] * uPad) * .09 * (1. - .6 * sun); // the tones lie faintly in the shade
  float e = 2. + (1. - uCue) * 9. - q.z;
  c += rwSun * uCue * .5 * sh.x / (1. + e * e * e * e);
  if (onFloor) { float fr = 1. - sat(-rd.y); fr *= fr; gloss = (.05 + .5 * fr * fr) * sh.y; mo = q; mr = vec3(rd.x, -rd.y, rd.z); }
  }
  bg = mix(c, rwSky * .85 * (1. - .6 * rwBlk), (.06 + .24 * uSpace) * q.z / (q.z + 12.));
  } else if (i == 1) bg += c * gloss;
  else { // a weight's face
  c += rwSun * sun * (onFloor ? .5 : .9) * (1. - .7 * rwBlk);
  if (onFloor) c *= vec3(.8, .68, .55);
  vec4 m = piece(vec2(gg.y / 23., .25)) + piece(vec2(gg.y / 23., .62));
  vec3 tint = m.rgb * (.4 + .6 * uEnergy);
  float fr = 1. - sat(dot(n, -rd)), gn = sat(dot(n, vec3(-.447, .497, -.745))); fr *= fr; fr *= fr; gn *= gn; gn *= gn;
  vec3 base = mix(mix(vec3(.9, .56, .2), vec3(.95, .74, .45), fr), vec3(.12, .13, .16) + .75 * fr, rwBlk);
  c = c * mix(base, base * (.35 + 1.3 * tint) + .15 * tint, sat(m.a * .8)) + tint * .1;
  c = mix(c, vec3(.86, .83, .78) * (rwSky * (.32 + .35 * sat(.5 - .5 * n.x) + .14 * n.y) + rwSun * sat(dot(n, rwL) * .8 + .2) * .6 + tint * .35), rwWht);
  c += rwSun * pow(sat(dot(mr, rwL)), mix(90., 12., rwWht)) * mix(1.5, .12, rwWht) * (1. + 5. * uKeys);
  c *= .5 + .5 * rwS(-.7, .5, n.y);
  acc += h.w * (c + rwGl(gg.y) * (uKind[4] * 1.3 + .5) * (.1 + 2.6 * gn * gn));
  }
 }
 // the beam overhead
 vec3 lo = vec3(-.09, rwB, 0.) - ro;
 float tu = lo.y / max(rd.y, 1e-4), ts = (lo.x + .18) / min(rd.x, -1e-4);
 vec3 wood = mix(vec3(.36, .24, .15), vec3(.1), rwBlk) * mix(rwSky, vec3(1.), .2) * (.5 + .3 * uLow);
 if (rd.z * ts < rwZ) bg = mix(bg, wood * 1.1, rwIn(rd.y * ts, lo.y, lo.y + .2, rwPx * ts * 1.6));
 if (rd.z * tu < rwZ) bg = mix(bg, wood * .8, rwIn(rd.x * tu, lo.x, lo.x + .18, rwPx * tu * 1.6));
 return screenOf(acc + T * bg);
}

// One globe seen flat: g is the way from its middle in radii.
vec3 rwBulb(vec2 g, vec3 I) {
 float u2 = dot(g, g), top = max(I.r, max(I.g, I.b)) + .02, lim = max(1. - u2, 0.);
 vec3 hot = mix(I / top, vec3(1., .95, .85), .45);
 vec3 milk = I * (1.3 + 1.6 * lim) + hot * (3.6 * top + .2) / (1. + u2 * u2 * 40. + u2 * 6.);
 vec3 paper = I * (1.6 + .8 * lim - .5 * g.y);
 vec3 clear = I * (.12 + u2 * u2 * u2) + hot * (3. * top + .4) / (1. + (g.x * g.x * 160. + g.y * g.y * 14.));
 vec2 hl = g - vec2(-.38, .42);
 return mix(mix(milk, paper, rwWht), clear, rwBlk) + (.3 + 2. * uKeys) * (1. - rwWht) / (1. + dot(hl, hl) * 160.);
}
vec3 rwNight(vec2 p) {
 float up = uOwn[4], H = 4.3 + (uOwn[3] > 0. ? 1.6 : 1.) * uOwn[3];
 vec3 ro = vec3(.1 * sin(TAU * uTime / 170.), 1.35 + .03 * sin(TAU * uTime / 130.) + (up > 0. ? 1.6 : .95) * up, 0.);
 vec2 vp = vec2(0., .03 + .2 * up);
 vec3 warm = mix(vec3(1., .5, .17), vec3(1., .66, .34), uTone);
 warm = mix(mix(warm, vec3(1., .26, .1), .75 * rwAu), vec3(1., .82, .58), .5 * rwDark);
 vec3 wall = mix(mix(vec3(.1, .092, .1), vec3(.75, .72, .68), rwWht), vec3(.05, .1, .1), rwBlk);
 vec3 boards = mix(mix(vec3(.6, .42, .28), vec3(.85, .82, .78), rwWht), vec3(.1, .22, .2), rwBlk);
 float few = 1. - rwFew, share = 1., blur = 0.;
 vec3 all = vec3(0.), from = ro;
 vec3 Ic[6]; float am[6], amax = 0.;
 for (int c = 0; c < 3; c++) { // three lamps share a light; a third of the row belongs to one kind of sound
  vec3 tint = c == 0 ? uKind[0] : c == 1 ? uKind[1] : mix(uKind[2], uKind[3], .5);
  vec3 I = warm * mix(vec3(1.), tint / max(max(tint.r, max(tint.g, tint.b)), .05), .2);
  float s = float(c) * .4 + .1, lv = c == 0 ? uDrone : c == 1 ? uPad : sat(.65 * (uTexture + uPhrase)), ec = (s - 1. + uCue) * 4.;
  vec3 m = piece(vec2(s, .4)).rgb * .2;
  float cue = (1. + .6 * uCue / (1. + ec * ec) + .3 * uCue) * (1. + 1.2 * rwFew), b0 = uBands[c * 5], b1 = uBands[c * 5 + 2];
  lv = .38 + .28 * lv + .2 * uEnergy * uLevel;
  Ic[2 * c] = (I * (lv + .22 * b0) + m) * cue; Ic[2 * c + 1] = (I * (lv + .22 * b1) + m) * cue;
  am[2 * c] = (.32 + 2. * rwLoud * (.6 + .8 * b0)) * rwLine; am[2 * c + 1] = (.32 + 2. * rwLoud * (.6 + .8 * b1)) * rwLine;
  amax = max(amax, max(am[2 * c], am[2 * c + 1]));
 }
 vec2 one = rwE(rwAng.x);
 // first the room as it is, then, where that is the wet floor, the same room upside down in it
 for (int pass = 0; pass < 2; pass++) {
  if (share <= 0.) break;
  vec3 rd = normalize(vec3(p - vp, 1.)), ad = max(abs(rd), 1e-5), own = vec3(0.);
  vec3 t3 = vec3(rd.x < 0. ? 5. + from.x : 5. - from.x, rd.y < 0. ? from.y : H - from.y, 12. - from.z) / ad;
  float t = min(t3.x, min(t3.y, t3.z)), e = (t * rwPx + blur * .08) * 1.6;
  vec3 q = from + rd * t, n = vec3(0., 0., -1.), alb = wall;
  bool wet = false;
  float bz = q.z / .46, ib = floor(bz), w2 = e * 4.;
  float gr = noise(t == t3.y && rd.y > 0. ? vec2(q.x * 1.4 + ib * 9., q.z * 20.) : q.xz * vec2(.9, .6) + 4.);
  if (t == t3.y) {
  wet = rd.y < 0.; n = vec3(0., wet ? 1. : -1., 0.);
  alb = wet ? vec3(.05, .05, .055) : boards * (.7 + .4 * hash11(ib + 2.)) * (.85 + .3 * gr) * (1. - .75 * rwS(.46 - w2, .48, abs(fract(bz) - .5)) / (1. + w2 * 4.));
  } else if (t == t3.x) n = vec3(rd.x < 0. ? 1. : -1., 0., 0.);
  else { // one tall window on the night
  vec2 w = vec2(q.x + 3.1, q.y - 1.6);
  float a = rwIn(w.x, -.8, .8, e) * rwIn(w.y, -1.35, 1.35, e), bars = sat(abs(w.x) / e - .02 / e) * sat((abs(abs(w.y) - .45) - .02) / e);
  own = rwSky * (2.2 + 1.6 * uMic) * (1.1 - .15 * w.y) * a * mix(.2, 1., bars);
  alb *= 1. - a;
  }
  float T = 1.;
  vec3 acc = vec3(0.), halo = acc, l1 = acc, L1 = acc, h1 = acc;   // h1: the nearest globe, the place on it and how much of it
  // some of the lamps light the room; then come those this column can meet, nearest first
  float wide = amax * (1. + .4 * uPhrase) * 1.1 + .4 + .2 * (rwFew + rwBig), mid = 2.7 - 5.1 * p.x, den = 1. / max(6.5 + 3.4 * p.x, .5);
  int k0 = int(clamp((mid - wide) * den * 17., 0., 17.)), k1 = int(clamp((mid + wide) * den * 17. + 1., 0., 17.));
  int nl = pass == 0 ? 4 : 2;
  for (int i = 0; i <= nl + k1 - k0; i++) {
  bool lamp = i < nl;
  int kk = lamp ? (pass > 0 ? 9 * i + 4 : i == 0 ? 1 : i == 1 ? 7 : i == 2 ? 10 : 16) : k0 + i - nl, c = kk / 3;
  float k = float(kk), s = k / 17., wt = kk - 3 * c == 1 ? 1. : few, a = rwAng.x + k * rwAng.y;
  vec3 tp = vec3(2.7 - 6.5 * s, H, 5.1 + 3.4 * s), I = Ic[c];
  vec2 e1 = rwE(a), sw = am[c] * (1. - .25 * s) * (mix(e1, (one + vec2(one.y, -one.x) * .1 * k) / sqrt(1. + .01 * k * k), rwStep) + vec2(0., .8 * uPhrase * e1.x * e1.y));
  vec3 C = vec3(tp.x + sw.y * .9, mix(mix(.75, H - .8, s * (.4 + .6 * s)), H - .9 - (H - 1.6) * 4. * s * (1. - s), rwRing) + dot(sw, sw) * .1, tp.z + sw.x);
  float r = mix(.19 - .03 * s, .09 + .21 * s, rwBig) * wt * (1. + .5 * rwFew);
  vec3 eye = vec3(ro.x, pass == 0 ? ro.y : -ro.y, 0.), o = C - eye;
  float iz = 1. / o.z, R = max(r * iz, 1e-4), aa = rwPx / R + .18 * blur;
  vec2 c2 = o.xy * iz + vp, g = p - c2;
  vec3 L = (I + (warm + uKind[4]) * 1.6 * rwGl(k * 1.35)) * wt;
  if (lamp) {
  L *= pass > 0 ? 3. : 1.5;
  vec3 w = C - q; float d2 = dot(w, w) + .3;
  l1 += L * max(dot(w, n), 0.) / (d2 * sqrt(d2));
  }
  else { float eh = sat(1. - dot(g, g) / (.16 * iz * iz)); halo += L * wt * wt * 1.3 * eh * eh * eh; }
  vec2 v = (tp.xy - eye.xy) / tp.z + vp - c2;
  g /= R; g.y /= rwSy;
  float cov = (1. - rwS(1. - aa, 1. + aa, length(g))) * wt * (1. - .35 * rwBlk);
  if (cov > 0. && !lamp) {
  if (h1.z == 0.) { h1 = vec3(g, T * cov); L1 = L; }
  else acc += T * cov * L * 2.5;
  T *= 1. - cov;
  }
  // its cord
  float h = (p.y - c2.y) / max(v.y, 1e-3), wd = .006 * iz;
  float dx = p.x - c2.x - v.x * h - rwTrem * iz * h * (1. - h) * e1.x;
  float al = sat((max(wd, rwPx * .6) + rwPx * .5 - abs(dx)) / rwPx) * min(1., wd / (rwPx * .6)) * wt * step(0., h) * step(h, 1.) * float(!lamp);
  acc += T * al * (L * (.16 + .9 / (1. + h * h * v.y * v.y * 900.)) + .01); T *= 1. - al;
  }
  acc += h1.z * rwBulb(h1.xy, L1);
  acc += T * (alb * (l1 * 2.6 + rwSky * (.35 - .1 * n.y)) + own) + halo * (.1 + .2 * uSpace);
  all += acc * share;
  float fr = 1. - sat(-rd.y); fr *= fr;
  share = wet && pass == 0 ? (.45 + .55 * fr) * mix(.75, 1., rwS(.25, .65, gr)) : 0.;
  // the water's slow ripple
  p += (.0016 + .004 * gr) * sin(q.zx * vec2(9., 5.) + q.xz * vec2(4., 13.) + TAU * vec2(fract(uTime / 5.), fract(uTime / 7.)));
  p.y = 2. * vp.y - p.y; from = q; blur = 1.;
 }
 return screenOf(all);
}

vec3 render(vec2 p) {
 rwPx = 1. / uRes.y;
 rwDark = sat(-uOwn[0]); rwAu = sat(uOwn[0]);
 rwWht = sat(-uOwn[1]); rwBlk = sat(uOwn[1]);
 rwFew = rwS(0., 1., -uOwn[2]); rwBig = sat(uOwn[2]);
 float o3 = uOwn[3];
 rwSy = exp2(o3 * (o3 > 0. ? .85 : 1.3));
 rwStep = sat(-uOwn[5]); rwRing = rwS(0., 1., uOwn[5]);
 rwHit = 3. + (1. - uHits) * 19.;
 rwTrem = .03 * uTexture * sin(TAU * fract(uTime * 1.3));
 rwLine = 1. - 3.2 * uCue * (1. - uCue);   // a cue draws the row into line for a breath
 rwLoud = .18 * sat(.22 * uLevel + .45 * uDrone + .4 * uPad + .15 * uLow);
 float T = fract(uTime / 150.), wind = .1 * (.5 - .5 * cos(TAU * uLoop)); // the loop winds the row out of step and home
 rwAng = vec3(TAU * fract(12. * T), TAU * T + wind, TAU * fract(uTime / 36.));
 vec3 c;
 if (uVar > .5) {
  rwSky = mix(vec3(.045, .08, .16), vec3(.3, .42, .6), rwDark) * mix(vec3(1.), vec3(1., .4, .45), rwAu);
  c = rwNight(p);
 } else {
  float bright = .82 + .2 * uPad + .1 * uLevel;
  rwWin = mix(vec4(.55, 1.95, .95, 3.15), o3 > 0. ? vec4(.95, 1.55, .25, 3.3) : vec4(.2, 2.4, 1.75, 2.75), abs(o3));
  rwSky = mix(mix(vec3(.92, .985, 1.07), vec3(1.05, .83, .66) * .75, rwAu), vec3(.1, .16, .3), rwDark) * bright;
  rwSun = mix(mix(mix(vec3(1., .93, .82), vec3(1., .83, .62), uTone), vec3(1.5, .66, .24), rwAu), vec3(.2, .3, .48), rwDark) * bright * (1. + .1 * sin(TAU * uTime / 50.));
  rwL = normalize(vec3(-1., mix(.31, .2, rwAu), -.3 + .06 * sin(TAU * uTime / 240.)));
  c = rwDay(p);
 }
 return c;
}
