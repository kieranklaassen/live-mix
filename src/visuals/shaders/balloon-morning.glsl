// name: Balloon morning
// a: Over the mist
// b: Own shadow
// what: Painted silk balloons hang over a valley full of white mist, with poplars and a bell tower standing out of it, one so near that we see up into its mouth; or straight down over a wicker rim, fields and a river with our own round shadow in a ring of light.
// follows: Each kind lights a balloon, which climbs a little, or gores of the shadow. Bands are gores of the near one, the piece its dye or the fields' colours. Drone thickens the mist, pad warms the sun, texture draws seams and rows, phrase sways. A hit is one roar of flame, a cue lights all, keys light windows.
// own: 0 before dawn at -1, clear noon at 1; 1 bare fields at -1, a sea of mist at 1; 2 snow at -1, autumn at 1; 3 round raw silk at -1, tall checked cloth at 1; 4 two balloons, or low, at -1, all near, or high, at 1; 5 seen from below, or a lake, at -1, from above, or a thin river in terraced hills, at 1
float bmPx, bmHour, bmAir, bmCold, bmGold, bmCloth, bmMany, bmStand, bmTall; // a pixel's height, and the world it is
vec3 bmTop, bmLow, bmSun, bmMist, bmDim, bmDark, bmDay; // sky high and low, sun, mist lit and shaded, trees, the hour
float bmLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float bmN1(float x) { float i = floor(x), f = fract(x); return mix(hash11(i), hash11(i + 1.), f * f * (3. - 2. * f)); }
float bmUp(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float bmIn(float d, float w) { return bmUp(w, -w, d); }
float bmGrey(vec3 c) { return dot(c, vec3(.333)); }
vec3 bmFire(int k) { return mix(vec3(1., .7, .36), uKind[k], .33); }
vec3 bmBy(vec3 low, vec3 mid, vec3 high, float q) { return q < 0. ? mix(mid, low, -q) : mix(mid, high, q); }
void bmWorld() {
  bmPx = 1. / uRes.y; bmTall = 1. + (uOwn[3] > 0. ? .28 : .06) * uOwn[3];
  bmHour = uOwn[0]; bmAir = uOwn[1]; bmCold = max(-uOwn[2], 0.); bmGold = max(uOwn[2], 0.); bmCloth = uOwn[3]; bmMany = uOwn[4]; bmStand = uOwn[5];
  bmTop = bmBy(vec3(.07, .11, .22), vec3(.53, .62, .69), vec3(.27, .49, .74), bmHour);
  bmLow = bmBy(vec3(.4, .31, .36), vec3(.9, .85, .77), vec3(.8, .89, .94), bmHour);
  bmSun = bmBy(vec3(.95, .55, .38), vec3(1., .9, .7), vec3(1., .98, .9), bmHour);
  bmMist = bmBy(vec3(.38, .41, .52), vec3(.95, .92, .87), vec3(.98), bmHour);
  bmDim = bmBy(vec3(.13, .17, .28), vec3(.63, .67, .73), vec3(.6, .71, .83), bmHour);
  bmDark = bmDim * vec3(.25, .31, .28);
  bmDay = bmBy(vec3(.46, .52, .72), vec3(1.), vec3(1.07), bmHour);
  vec3 warm = mix(vec3(1.), vec3(1.06, .91, .72), bmGold);
  bmTop = mix(bmTop * warm, vec3(.84, .86, .9) * bmGrey(bmTop), bmCold);
  bmLow = mix(bmLow * warm, vec3(.94) * bmGrey(bmLow), bmCold);
  bmMist *= warm;
  bmSun = mix(bmSun, bmMist, .7 * bmCold);
  bmDark = mix(bmDark * mix(vec3(1.), vec3(2.6, 1.15, .55), bmGold), bmMist * .53, .9 * bmCold);
}
// The fields: boxes split again and again. Each has a number, an edge, a middle, a size.
float bmId, bmEdge;
vec2 bmMid, bmBig;
void bmFields(vec2 w) {
  float col = floor(w.x / 1.5), off = 1.5 * hash11(col + 3.);
  w.y += off;
  vec2 cell = vec2(col, floor(w.y / 1.5)), lo = cell * 1.5, hi = lo + 1.5, e = min(w - lo, hi - w);
  bmEdge = min(e.x, e.y);
  bmId = hash21(cell + 17.);
  for (int i = 0; i < 4; i++) {
    vec2 s = hi - lo, at = mix(lo, hi, .32 + .36 * hash11(bmId * 51. + float(i)));
    bool wide = s.x > s.y * .8;
    float d = wide ? w.x - at.x : w.y - at.y;
    bmEdge = min(bmEdge, abs(d));
    if (d < 0.) { if (wide) hi.x = at.x; else hi.y = at.y; bmId = fract(bmId * 7.13 + .217); }
    else { if (wide) lo.x = at.x; else lo.y = at.y; bmId = fract(bmId * 5.31 + .631); }
  }
  bmMid = .5 * (lo + hi) - vec2(0., off); bmBig = hi - lo;
}
vec3 bmCrop(float id) {
  vec3 c = id < .2 ? vec3(.46, .5, .29) : id < .4 ? vec3(.76, .65, .39) : id < .55 ? vec3(.33, .42, .27) : id < .7 ? vec3(.5, .38, .29) : vec3(.63, .48, .41);
  float own = .85 + .25 * fract(id * 37.);
  return mix(mix(c, vec3(.78, .82, .87), .92 * bmCold), mix(vec3(.72, .49, .22), vec3(.47, .22, .15), fract(id * 11.)), .85 * bmGold) * own;
}
// The dyes of balloon k at angle a and height y; soft is a pixel in gores.
const float BM_N[5] = float[5](24., 16., 20., 16., 12.);
float bmTwo, bmBelt;
vec3 bmDye(int k, float a, float y, float soft) {
  vec3 madder = vec3(.6, .22, .17), straw = vec3(.83, .67, .36), ink = vec3(.17, .27, .4), cream = vec3(.89, .82, .68);
  float n = BM_N[k], u = a * n / TAU, e = soft + .02, ey = .012 + soft * TAU / n;
  bmTwo = bmUp(-e, e, .5 - abs(fract(u * .5) * 2. - 1.));
  bmBelt = bmIn(abs(y) - .2, ey);
  vec3 c = k == 3 ? mix(ink, straw, bmTwo) : k == 2 ? cream * (1. - .1 * bmTwo) : mix(madder, cream, bmTwo);
  if (k == 0) {
    float swag = abs(sin(a * n * .125));
    c = mix(c, ink, max(bmBelt, bmUp(-ey, ey, y - .72 - .06 * swag)));
    c = mix(c, straw, max(bmIn(abs(y + .35 - .15 * swag * swag) - .032, ey), bmIn(abs(abs(y) - .2) - .014, ey)));
    c = mix(c, straw, bmBelt * bmIn(abs(abs(fract(u * .5) - .5) * .3 + abs(y) - .1) - .012, ey));
  } else {
    float q = bmUp(-e, e, sin(a * 2.) * 4.), up = bmUp(-ey, ey, y);
    if (k == 1) c = mix(mix(straw, ink, mix(q, 1. - q, up)), cream, bmIn(abs(y) - .05, ey));
    c = mix(c, k == 2 ? ink : madder, bmIn(k < 3 ? y + .62 : abs(y) - .12, ey));
  }
  vec3 check = mix(k == 0 || k == 4 ? madder : ink, straw * 1.08, bmUp(-e, e, sin(u * PI) * sin(y * 15.7)));
  return mix(mix(c, check, bmUp(.1, 1., bmCloth)), cream, .93 * bmUp(.1, 1., -bmCloth));
}
// One balloon: a ball and the cone that touches it, seen from tilt (above 0 we look up).
const float BM_SA = .743, BM_YA = -1.346, BM_RM = .27, BM_YM = -1.103; // the cone
// Its outline: the ball's, the mouth's, and the straight sides between.
float bmOutline(vec2 q, float s, float ce, float se) {
  float my = BM_YM * s * ce, h = sqrt(s * s * ce * ce + se * se), k = h / max(-BM_YA * s * ce, h * 1.02), m = max(abs(se), .06), foot = my - min(m * BM_RM, m * m * .3 / (s * ce));
  vec2 l = vec2(abs(q.x), q.y / h);
  float sides = max(l.x * sqrt(1. - k * k) - (l.y + 1. / k) * k, max(l.y + k, foot / h - l.y));
  return min(min((length(l) - 1.) * min(h, 1.), sides), (length(vec2(q.x, (q.y - my) / m)) - BM_RM) * m);
}
vec4 bmBalloon(vec2 q, int k, float size, float tilt, float spin, float lit) {
  float s = bmTall, px = bmPx / size, ce = cos(tilt), se = sin(tilt), my = BM_YM * s * ce, by = (-1.42 - .24 * s) * ce;
  vec3 fire = bmFire(k), wick = bmDay * vec3(.3, .2, .13);
  vec4 col = vec4(0.);
  vec2 b = vec2(q.x, q.y - by), one = vec2(abs(b.x - .01) - .07, b.y + .1 * b.x);
  if (q.y < my + .1) {
    float wide = mix(.2, BM_RM, sat((b.y - .1) / max(my - by - .1, .01))), rope = abs(abs(abs(q.x) - wide * .62) - wide * .36);
    col = mix(col, vec4(wick * .9, 1.), bmUp(.006 + px, .003, rope) * step(.05, b.y) * bmUp(my + .05, my, q.y) * min(.85, .01 / px + .3));
    float folk = min(length(one - vec2(0., .215)) - .033, length(vec2(one.x, max(one.y - .13, 0.))) - .05);
    col = mix(col, vec4(vec3(.17, .14, .17) + fire * lit * .25, 1.), bmIn(max(folk, -b.y), px));
    float ox = q.x / .25, ox2 = ox * ox, tub = max(abs(q.x) - .25 - .18 * b.y, max(b.y - .08 - .05 * ox2, -.12 + .07 * ox2 * ox2 - b.y));
    vec3 tc = mix(wick * (.85 + .25 * sin(q.x * 150. + PI * floor(b.y * 42.)) * sat(size * 8. - 1.)), bmDay * vec3(.4, .17, .13), bmIn(.02 + .05 * ox2 - b.y - .05 * abs(sin(q.x * 22.)), px));
    col = mix(col, vec4(tc * (.9 + .4 * ox) + fire * lit * .35, 1.), bmIn(tub, px));
  }
  float cover = bmIn(bmOutline(q, s, ce, se), px);
  if (cover <= 0.) return col;
  vec3 o = vec3(q.x, q.y * ce / s, -q.y * se), d = vec3(0., se / s, ce);
  float aa = dot(d, d), bb = dot(o, d), root = sqrt(max(bb * bb - aa * (dot(o, o) - 1.), 0.)), t1 = (-bb - root) / aa, t2 = (-bb + root) / aa, t = -bb / aa;
  bool hit = root > 0. && o.y + max(d.y * t1, d.y * t2) >= -BM_SA, cone = false;
  if (hit) t = o.y + d.y * t1 >= -BM_SA ? t1 : t2;
  float oy = o.y - BM_YA, kk = 1.234, qa = d.z * d.z - kk * d.y * d.y, qb = o.z * d.z - kk * oy * d.y, dd = qb * qb - qa * (o.x * o.x + o.z * o.z - kk * oy * oy);
  if (dd > 0. && abs(qa) > 1e-4) {
    for (int i = 0; i < 2; i++) {
      float tc = (-qb + (i == 0 ? -1. : 1.) * sqrt(dd)) / qa, y = o.y + d.y * tc;
      if (y > BM_YM && y < .004 - BM_SA && (tc < t || !hit)) { t = tc; cone = true; hit = true; }
    }
  }
  if (!hit) cone = o.y + d.y * t < -BM_SA;
  vec3 P = o + d * t, n = normalize(vec3(P.x, cone ? -kk * (P.y - BM_YA) : P.y, P.z) / vec3(1., s, 1.) + 1e-5);
  float nv = dot(n, vec3(0., se, ce)), R = max(length(P.xz), .02), N = BM_N[k];
  bool inside = nv > .02 && hit;
  nv = abs(nv);
  float turn = atan(P.x, -P.z - 1e-5), u = (turn + spin) * N / TAU, g = fract(u) - .5, soft = min(px / (R * max(nv, .08)) * N / TAU, .6), ring = 0.;
  vec3 dye = bmDye(k, turn + spin, P.y, soft);
  if (k == 0) {
    // the piece, and a gore for each band
    vec4 m = piece(vec2(.5 + .4 * sin(turn), sat(.5 - P.y * .62)));
    dye = mix(dye, dye * .25 + m.rgb / max(m.a, .05) * (.15 + .55 * bmGrey(dye)), sat(m.a * 1.3) * (.2 + .6 * max(bmTwo, bmBelt)));
    ring = uBands[int(mod(floor(u), 24.) * .66)];
  }
  float wear = noise(vec2(u * 5.6, P.y * 2.6 + float(k) * 7.));
  dye = mix(dye, vec3(1.12, 1.06, .94) * bmGrey(dye), .16 + .24 * wear) * (.86 + .22 * wear);
  n = normalize(n - vec3(P.z, 0., -P.x) / R * g * .85 * (1. - soft) + vec3(0., size > .2 ? sin(P.y * 34. + 2. * wear) * .12 * abs(g) : 0., 0.));
  vec3 view = vec3(n.x, n.y * ce - n.z * se, -(n.y * se + n.z * ce));
  float nl = dot(view, vec3(.89, .3, -.24)), seam = bmUp(.43 - soft, .5, abs(g)) * (.32 + .4 * uTexture) * (1. - soft);
  vec3 amb = mix(mix(mix(bmDim, bmLow, .3), bmTop * .85 + .12, .5 + .5 * n.y), bmMist * .8, .5 * sat(-n.y));
  vec3 c = dye * (amb * .6 + bmSun * (1.1 * sat(nl + .05) + vec3(.22, .18, .12) * sat(.6 + view.x)) * (1. + .2 * uPad));
  c *= (1. - .55 * seam) * mix(.62, 1., bmUp(0., .45, nv));
  float net = max(k == 2 ? 1. : 0., bmUp(.2, 1., -bmCloth)) * bmUp(-.08, .02, P.y) * (1. - soft * 1.4), lat = P.y * N * .28, nw = .02 + soft * .3;
  c *= 1. - .55 * sat(net) * bmIn(min(abs(fract((u + lat) * .5) - .5), abs(fract((u - lat) * .5) - .5)) - nw, nw);
  // the fire within
  vec3 f = P + vec3(0., .8, 0.);
  float low = exp(-dot(f, f) * .95), on = sat(lit * (.8 + .5 * ring * ring));
  vec3 lamp = fire * (dye * 1.3 + .05) * (.22 + 1.15 * low) * mix(.45, 1., bmUp(0., .8, nv)) * (1. - .6 * seam);
  if (inside) {
    c = dye * mix(bmDim * .1, bmLow * .26, sat(.3 + .5 * view.x)) * (1. - .5 * seam);
    lamp = fire * (dye + .2) * (.25 + 1.1 * low);
  }
  c = c * (1. - .4 * on) + lamp * on;
  c = mix(c, wick * (.6 + .5 * sat(nl)), cone ? bmUp(.05, .03, P.y - BM_YM) * .75 : 0.);
  return mix(col, vec4(c, 1.), cover);
}
// A row of poplars.
float bmPoplars(vec2 p, float base, float pitch, float tall, float seed) {
  float u = p.x / pitch, i = floor(u) + seed * 17., h = tall * (.3 + .7 * hash11(i)) * bmUp(.42, .6, bmN1(u * .13 + seed * 5.));
  float y = (p.y - base) / max(h, 1e-3), w = pitch * (.24 + .14 * hash11(i + 57.)) * pow(max(1. - y, 0.), .6) * (.5 + .5 * bmUp(-.05, .3, y)) * (.75 + .5 * noise(p * 5. / pitch));
  return y > 1. || h < .002 ? 0. : bmIn(abs(fract(u) - .5 - .22 * (hash11(i + 91.) - .5)) * pitch - w, bmPx);
}
vec3 bmOver(vec2 p) {
  float hz = -.075 + (bmStand < 0. ? .15 : .22) * bmStand, few = max(-bmMany, 0.), many = max(bmMany, 0.), night = max(-bmHour, 0.);
  vec2 sun = vec2(.6, hz + .085 + .17 * max(bmHour, 0.));
  vec3 air = mix(bmLow, bmMist, .35), glow = vec3(0.);
  float s = bmTall, veil = 1.;
  // five balloons, the near one first
  const vec3 AT[5] = vec3[5](vec3(-.575, .295, .47), vec3(.165, .175, .122), vec3(.525, .335, .068), vec3(.385, .045, .036), vec3(-.045, 0., .04));
  int who = -1;
  vec2 whoQ = vec2(0.);
  vec3 whoR = vec3(1.);
  for (int k = 0; k < 5; k++) {
    float fk = float(k), lv = bmLv(k), sway = sin(uTime * .33 - fk * 1.2), bob = sin(uTime * (.21 + .03 * fk) + fk * 2.1);
    bool near = k == 0;
    float r = AT[k].z * mix(mix(1., near ? .66 : .6 + .09 / AT[k].z, many), near ? .82 : .5, few) * (1. + .035 * lv);
    vec2 at = AT[k].xy + many * (near ? vec2(-.09, .03) : vec2(.2, .15) * AT[k].xy) + few * (near ? vec2(.41, -.05) : vec2(k < 2 ? .24 : 1.5, -.06));
    at.y += r * (near ? .1 * lv + .02 * bob : .1 * bob + (k == 4 ? 0. : .7 * lv - .18)) + (hz + .075) * (near ? .14 : .35);
    at.x += r * .1 * (sin(uTime * .07 + fk * 1.7) + uPhrase * sway);
    float lit = sat(lv * (.5 + .7 * uEnergy) * (k == 4 ? 1.4 : 1.) + .7 * uCue + (near ? .35 * uMic + .35 * uHits : 0.) + .16 * night);
    float tilt = clamp((near ? .5 : .2 + .25 * (at.y - hz)) - bmStand * (near ? .6 : .45), -.75, 1.), ce = cos(tilt);
    vec2 g = (p - at) / r, q = rot((.02 + .07 * uPhrase) * sway) * g;
    float boat = max(abs(q.x) - .28, abs(q.y - ce * (-1.2 * s - .3)) - .55);
    if (who < 0 && min(bmOutline(q, s, ce, sin(tilt)), boat) < 1.5 * bmPx / r) { who = k; whoQ = q; whoR = vec3(r, tilt, lit); }
    vec2 fl = (g + vec2(0., 1.1 * s * ce - .12 * uHits)) * vec2(9., 6. - 2.5 * uHits);
    float seen = who < 0 || who == k ? 1. : 0., more = seen * lit * (near ? .08 : .28) * exp(-.4 * dot(g, g) - .5 * g.y);
    glow += veil * more * bmFire(k) + seen * vec3(.6, .5, .3) * exp(-dot(fl, fl)) * max(lit, near ? uHits : 0.);
    veil *= 1. - more;
  }
  vec3 sum = vec3(0.);
  float left = 1.;
  if (who >= 0) {
    bool near = who == 0;
    vec4 b = bmBalloon(whoQ, who, whoR.x, whoR.y, .3 * float(who) + (near ? .25 : 0.) * sin(TAU * uLoop) + .15 * sin(uTime * .03), whoR.z);
    float haze = near ? 0. : mix(.1, .48, bmUp(.12, .028, AT[who].z + .04 * many)) * (.6 + .4 * uSpace);
    sum = mix(b.rgb, air * b.a, haze); left = 1. - b.a;
  }
  // the mist from near to far, and what stands in it
  float drift = 30. * sin(uTime * .00013 + uTravel * .0002), warm = exp(-abs(p.x - sun.x) * 1.5), clear = max(-bmAir, 0.), full = max(bmAir, 0.);
  for (int i = 4; i >= 0 && left > .02 && p.y < hz + .08; i--) {
    float fi = float(i), t = fi / 4., sc = mix(.22, 1.45, t * t * .6 + t * .4), yb = mix(hz - .018, -.455, pow(t, 1.35)), y = (p.y - yb) / sc;
    if (y > .19) continue;
    vec2 mq = vec2(p.x / sc * 1.7 + drift * (1. + fi) + fi * 5.3, y * 4.);
    float n1 = noise(mq * vec2(1., .6)), n2 = noise(mq * 2.7 + vec2(0., uTime * .01)), n3 = noise(mq * vec2(7., 8.) + 3.), edge = mix(.004, .035, n1);
    float top = (n1 - .45) * .075 + (n2 - .5) * .04 + (n3 - .5) * .012 + .0045 + .018 * uDrone + .085 * full, lip = bmUp(top - .15, top, y);
    vec3 mc = mix(mix(bmDim, bmMist, sat(.28 + .55 * lip + .65 * (n2 * .6 + n3 * .4 - .5) + .22 * warm)), bmSun, .45 * warm * lip * (.7 + .5 * uPad));
    float dens = bmUp(top + edge, top - edge * 2., y) * mix(.985, .3 * bmUp(.3, .8, n1), clear);
    sum += left * dens * mc; left *= 1. - dens;
    if (y < -.12) continue;
    float hu = p.x / sc, hedge = -.02 + .03 * bmN1(hu * 9. + fi * 11.) + .016 * bmN1(hu * 37. + fi) + .04 * bmUp(.5, .9, bmN1(hu * 2. + fi * 3.7));
    float stand = max(bmIn(y - hedge, bmPx / sc), bmPoplars(vec2(p.x + fi * .37, p.y), yb - .02 * sc, .028 * sc, .155 * sc, fi + 2.));
    vec3 tc = mix(mix(mix(bmDark, bmDim, .8), bmDark, pow(t, .8)), bmSun, .3 * warm * (1. - t));
    if (i == 2) {
      vec2 b = vec2(p.x - .325, p.y - yb + .02 * sc);
      float nx = abs(b.x + .034), lamp = sat(exp(-1e3 * (nx * nx + (b.y - .022) * (b.y - .022))) + exp(-1e3 * (b.x * b.x + (b.y - .07) * (b.y - .07)))) * sat(uKeys + .5 * night), tower = max(abs(b.x) - (b.y > .085 ? .28 * (.135 - b.y) : .0105), b.y - .135);
      tc = mix(tc, bmLow, .5 * bmIn(max(abs(b.x) - .004, abs(b.y - .07) - .009), bmPx));
      stand = max(stand, bmIn(min(tower, max(nx - .03, b.y - .034 - .018 * sat(1. - nx * 20.))), bmPx));
      sum += left * lamp * vec3(1., .76, .42); left *= 1. - lamp;
    }
    stand *= (.25 + .75 * bmUp(-.03, .06, y));
    sum += left * stand * tc; left *= 1. - stand;
  }
  vec3 col = mix(bmMist, bmDim, .35);
  if (p.y > hz) {
    float up = p.y - hz, ds = length((p - sun) * vec2(.75, 1.)), hill = .012 + .06 * (bmN1(p.x * 1.6 + 20.) - .2) * bmUp(1.1, -.4, p.x);
    vec2 cq = vec2(p.x * 1.3 + uTime * .004, up * 7. - p.x * .5);
    col = mix(bmLow, bmTop, bmUp(-.06, .58, up + .1 * (sun.x - p.x)));
    col = mix(col, air, .42 * bmUp(.46, .78, noise(cq + .4 * noise(cq * 3.))) * bmUp(.04, .2, up));
    col = mix(col, bmSun, (.45 + .25 * uPad) * exp(-ds * 3.4) + .5 * exp(-ds * 13.));
    col = mix(col, min(bmSun + .08, 1.), bmIn(length(p - sun) - .029, .0015) * .95);
    col = mix(col, mix(bmMist, mix(mix(bmTop, bmDim, .5) * .82, bmLow, .24 + .4 * warm), bmUp(-.03, .05, up)), bmIn(up - hill, bmPx));
  } else if (clear > 0.) {
    float z = .5 / (hz - p.y + .05);
    bmFields(vec2(p.x * z * .8 + 3.3, z * 1.3 + 7.));
    vec3 lc = mix(bmCrop(bmId) * bmDay, bmDark, .8 * bmUp(.02 + .006 * z, .01, bmEdge));
    col = mix(col, mix(bmLow * .85, lc, exp(-z * .1)), bmUp(0., .8, clear) * bmUp(0., .02, hz - p.y));
  }
  return (sum + left * col) * veil + glow;
}
float bmTree(vec2 w, float m) {
  bmFields(w);
  float n = .6 * noise(w * 31.) + .4 * noise(rot(.6) * w * 67.);
  return bmUp(0., .01, max(m * (.008 + .034 * n) - bmEdge, step(.9, fract(bmId * 91.7)) * (.05 * n - .018)));
}
float bmLie(vec2 w) { return noise(w * .9 + 3.) * .7 + noise(w * 2.2) * .3; }
vec3 bmDown(vec2 p) {
  float zoom = 1.75 * exp2(.85 * bmMany), wp = bmPx * zoom, steep = max(bmStand, 0.), full = max(bmAir, 0.), night = max(-bmHour, 0.);
  vec2 slide = vec2(0., 2. + 40. * sin(uTravel * .0004 + uTime * .0001)), w = p * zoom + slide, sd = vec2(-.622, .783);
  vec2 bent = w + .1 * vec2(sin(w.y * 1.7 + .5), sin(w.x * 1.9)) + .03 * sin(w.yx * 4.1);
  float lie = bmLie(w), m = bmUp(.3, .5, noise(w * 2.1 + 5.)), sh = bmTree(bent - sd * .034, m), tall = bmTree(bent, m), fine = noise(w * 60.);
  // strips and rows, along the slope where it is steep
  vec2 f = bent - bmMid;
  float turn = step(.5, fract(bmId * 71.)), across = mix(mix(f.x, f.y, turn) + .02 * sin(mix(f.y, f.x, turn) * 5. + bmId * 40.), lie * .8, .95 * bmUp(0., 1., steep));
  float st = across / .052, strips = step(.35, fract(bmId * 13.));
  vec3 c = mix(bmCrop(bmId), bmCrop(fract(hash11(floor(st) + bmId * 91.) * .83 + bmId * .17)), strips * .65);
  c *= 1. - (.25 + .25 * uTexture) * strips * bmUp(.42 - wp / .052, .5, abs(fract(st) - .5));
  c *= 1. - (.06 + .2 * uTexture) * (.5 + .5 * sin(across * 740.)) * sat(1. - wp * 200.);
  c *= .84 + .14 * fine + .2 * noise(w * 7.);
  c *= 1. - .5 * step(.9, fract(bmId * 91.7));
  vec2 at = (bmMid - slide) / zoom;
  vec4 snd = piece(vec2(sat(.5 + at.x / 1.85), sat(.5 - at.y * .85)));
  c = mix(c, mix(vec3(bmGrey(c)), snd.rgb / max(snd.a, .05), .5) * (.3 + 1.2 * bmGrey(c)), sat(snd.a * 1.2) * .7);
  c *= (1. + (1.2 + 5. * steep) * (lie - bmLie(w + sd * .12))) * mix(vec3(1.), vec3(.45, .5, .64), .9 * sh * (1. - tall));
  vec3 tree = mix(vec3(.15, .21, .14), vec3(.42, .45, .25), sat(tall * .5 - .6 * sh + .2 + .35 * fine)) * mix(vec3(1.), vec3(1.8, 1.1, .6), bmGold) + .2 * bmCold;
  c = mix(c, tree, tall);
  vec2 q = rot(bmId * 3.) * (f - bmBig * .2), qs = abs(q) - vec2(.03, .018);
  float farm = step(.72, fract(bmId * 29.)) * step(.22, min(bmBig.x, bmBig.y)), lamp = farm * sat(uKeys + .7 * night) * exp(-dot(q, q) * 900.);
  float house = max(qs.x, qs.y);
  c = mix(c * (1. - .4 * farm * bmUp(.02, 0., house)), mix(vec3(.44, .26, .2), vec3(.74, .45, .32), bmIn(q.y, wp)) + .4 * bmCold, farm * bmIn(house, wp));
  // the river and a ferry on its rope
  float fy = 1.5 * floor(w.y / 1.5 + .5), wid = .085 + (bmStand < 0. ? .5 * bmStand * bmStand : -.063 * steep);
  vec2 bend = .68 + .26 * sin(vec2(w.y, fy) * 1.1 + .2) + .14 * sin(vec2(w.y, fy) * 2.3 + 1.6);
  float bank = abs(w.x - bend.x) / 1.18 - wid + .025 * (noise(w * 7.) - .5) + .75 * max(-bmStand, 0.) * max(noise(w * 1.9 + 9.) - .5, -.1), water = bmIn(bank, wp);
  vec3 wc = mix(bmTop * vec3(.66, .8, .84), bmLow, .15 + .45 * noise(w * vec2(3., 1.1))) * (1. - .45 * bmUp(-.05, 0., bank));
  wc += bmSun * (.06 + .2 * uHigh) * bmUp(.55, .95, noise(rot(.7) * w * vec2(80., 34.) + 20. * sin(uTime * .005)));
  c = mix(c, vec3(.68, .63, .48), bmUp(.03, .01, bank + .02 * noise(w * 18.)) * .7);
  c *= bmDay * mix(vec3(.76, .81, .94), bmSun * .65 + .53, sat(.6 + .35 * p.x - .2 * p.y + .25 * uPad));
  c = mix(c, wc, water);
  q = vec2(w.x - bend.y - .6 * min(wid, .2) * sin(uTime * .1 + fy * 2.), w.y - fy);
  c = mix(c, c * .35, water * bmIn(abs(q.y) - .001, wp) * .6);
  c = mix(c, bmDay * mix(vec3(.5, .38, .25), vec3(.88, .84, .74), bmIn(max(abs(q.x) - .013, abs(q.y) - .009), wp)), water * bmIn(max(abs(q.x) - .04 + 8. * q.y * q.y, abs(q.y) - .017), wp));
  c = mix(c, vec3(1., .82, .5), lamp);
  float mz = noise(w * 1.1 + vec2(uTime * .013, 9.)) * .6 + noise(w * 2.7 - .01 * uTime) * .4;
  float haze = sat(bmUp(.56, .84, mz + .13 * uDrone + .26 * full + .3 * min(bmAir, 0.)) * (.5 + .2 * uSpace + .4 * full) + (.03 + .06 * uSpace) * (p.y + .5));
  c = mix(c, mix(bmDim, bmMist, sat(.2 + 1.3 * (mz - .25))), haze);
  // our own shadow, longer the way it falls
  float day = 1. - .55 * night, dyed = max(bmCloth, 0.), raw = max(-bmCloth, 0.);
  vec2 s = mat2(sd.y, sd.x, -sd.x, sd.y) * (p - vec2(-.13, .085) - vec2(.012 * sin(uTime * .11) + .01 * uPhrase * sin(uTime * .4), .012 * cos(uTime * .083))) / (.14 * exp2(-.75 * bmMany));
  s /= vec2(1. - .1 * dyed, 1.16 + .42 * dyed - .14 * raw);
  float rr = length(s), body = min(rr - 1., max(max(abs(s.x) * .8 - (s.y + 1.66) * .6, -1.16 - s.y), s.y + .55)), bask = max(abs(s.x) - .17, abs(s.y + 1.62) - .1), cord = max(abs(abs(s.x) - .13) - .01, abs(s.y + 1.3) - .3);
  float dark = bmIn(min(body, min(bask, cord)), .05);
  // the sun through its sixteen gores
  float a = (atan(s.x, s.y + 1e-5) + .35 * sin(TAU * uLoop)) / TAU * 16. + 16., gi = mod(floor(a), 16.);
  int k = int(mod(gi, 5.));
  float lv = sat(bmLv(k) * .7 + .6 * band(gi / 15.) + .8 * uCue + .4 * uMic + .6 * uHits), check = mix(mod(gi, 2.), mod(gi + floor(rr * 4.), 2.), dyed);
  vec3 dye = mix(mix(vec3(.98, .82, .5), vec3(.8, .34, .25), check), bmFire(k) * 1.1, .25 + .5 * lv);
  dye = mix(dye, vec3(.95, .9, .78), .9 * raw);
  float thru = (1. - .7 * bmUp(.5 - .05 / (rr + .05), .5, abs(fract(a) - .5))) * bmUp(1.04, .75, rr) * bmUp(0., .08, rr);
  c = mix(c, c * mix(vec3(.36, .41, .55), dye * .85, thru * (.5 + .4 * abs(bmCloth))) + (c * .5 + .2) * dye * thru * lv * (.4 + .8 * uEnergy), dark);
  // the ring of light round it; a cue sends it out
  float o = max(length(vec2(s.x, s.y + .22)) - 1.12, 0.), ring = exp(-o * o * 10.), cr = o - 5. * (1. - uCue), out_ = 1. - dark;
  vec3 halo = bmSun * .65 + .35;
  c = mix(c, min(c * 1.25 + .22, 1.) * halo, ring * (.62 + .25 * uPad + .13 * uLevel) * day * out_);
  c += (.012 + .13 * haze) * day * (.6 + .6 * uLevel) * exp(-pow(abs(o - .55) * 2.6, 2.)) * out_ * (.2 + cos(TAU * (o * 1.2 - vec3(.24, .04, -.18))));
  c = mix(c, c * .5 + halo * .6, .7 * uCue * exp(-cr * cr * 3.) * out_);
  c += bmFire(4) * uHits * .5 * exp(-rr * rr * 2.2);
  // the wicker rim we lean on
  float v = -.395 - .085 * p.x * p.x - p.y, lip = v / .052, u = p.x * 34. + lip * .55, wy = (v - .052) / .0135, wx = p.x * 26. + mod(floor(wy), 2.) * .5;
  float bow = sqrt(sat(1. - pow(abs(lip * 2. - 1.), 2.)));
  c *= 1. - .2 * exp(min(v, 0.) * 30.);
  vec3 rc = mix(vec3(.34, .22, .13), vec3(.8, .6, .38), bow * (.35 + .65 * sin(fract(u) * PI)));
  if (lip > 1.) rc = mix(vec3(.1, .07, .05), vec3(.58, .41, .25), sin(fract(wx) * PI) * sin(fract(wy) * PI)) * (.55 + .45 * bmUp(1., 1.5, lip));
  rc *= bmDay * (.92 + .16 * p.x) * (1. + vec3(1.2, .7, .3) * sat(uHits + .6 * uCue + .5 * uMic) * exp(-p.x * p.x * 5.));
  return mix(c, rc, bmIn(-v, bmPx));
}
vec3 render(vec2 p) {
  bmWorld();
  vec3 c = uVar < .5 ? bmOver(p) : bmDown(p);
  return sat(mix(c, c * c * (3. - 2. * c), .1 + .2 * uTone) * (.985 + .03 * noise(p * 210.)));
}
