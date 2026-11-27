// name: Steep balconies
// a: Up the well
// b: Down the rails
// what: The bottom of a court, looking up between two facing fronts of unlike balconies, warm plaster in sun and blue in shade, washing strung across a leaning wedge of sky and one red blanket four floors up; or hanging over the top rail, where round balconies ladder down to a paved court with a round bed, a tree and a hand cart.
// follows: Drone lowers the sun and the shadow climbs; pad warms the walls; texture stirs leaves; a phrase sends a shadow up the storeys; kinds dye the washing; bands open curtains; the piece colours curtains and shutters; a hit flashes panes and throws patches of sun; a cue leans the view and lifts the light; keys light windows; the loop turns the sun.
// own: 0 night with lit windows at -1, a low rose sun at 1; 1 chalk white walls at -1, brick red facing sea green at 1; 2 straight balconies at -1, deep round ones at 1; 3 snow at -1, leaves and flowers over the rails at 1; 4 a grey day and bare lines at -1, a great wash day at 1; 5 a wide court at -1, a narrow deep well at 1; 6 looking straight up at -1, level along the court at 1, or a court of water at -1, looking out over the far roofs at 1; 7 a hive of small balconies at -1, long galleries and houses painted in the sounds' colours at 1
// A soft step, up or down.
float sbT(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
const vec3 sbSn = vec3(.89, .92, 1.);
#define sbB (4.4 - 1.5 * max(-uOwn[7], 0.) + 1.2 * max(uOwn[7], 0.))
#define sbWall7 max(uOwn[7], 0.)
const float sbS = 3.1, sbRh = 1., sbTh = .17, sbDm = 1.6; // storey, bay, rail, slab, depth
vec3 sbL, sbSun, sbAmb, sbBnc, sbO;
vec2 sbA, sbH; // how far the two fronts are, how many storeys
float sbPx, sbNgt, sbPen, sbSd, sbSnow, sbGrey;
bool sbB2;
// A balcony: half width, depth, front's radius, 1 if there, rail 0 bars 1 wall 2 boards.
float sbW, sbD, sbR, sbE, sbK;

float sbWv(float x) { x = abs(fract(x) - .5) * 4. - 1.; return x * (1.5 - .5 * x * x); }
float sbIn(float px, float d) { return sat(.5 - d / px); }
// A line of this half width.
float sbLn(float px, float d, float w) { return min(sat(.5 + (w - abs(d)) / px), 2. * w / px); }
vec2 sbId(float z, float y) { return floor(vec2(z / sbB + .5, (y + .65) / sbS)); }
void sbUnit(vec2 id) {
 float h = hash21(vec2(id.x * 1.37 + 3.1, sbSd * 11.3)), g = hash21(id * vec2(.71, 1.13) + sbSd * 5.7);
 sbK = h < .45 ? 0. : h < .78 ? 1. : 2.;
 if (g > .8) sbK = mod(sbK + 1., 3.);
 float g2 = fract(g * 7.31), h2 = fract(h * 9.7), o = uOwn[2];
 sbW = 1.25 + .6 * h2 - .2 * g2;
 float rd = sat(.35 + .9 * h2 - .3 * g2 + .9 * o);
 sbD = clamp(mix(.95, 1.35, h2) + .22 * o, .7, 1.55);
 rd = 1. - rd; rd *= rd; sbR = mix(max(sbW * .98, sbD * .8), 14., rd * rd);
 sbE = step(.16, g) * step(.5, id.y) * step(id.y, (sbSd < 0. ? sbH.x : sbH.y) - .5);
 // one balcony for the blanket; b hangs over round ones with bars
 if (sbSd < 0. && id.x == 1. && id.y == 4.) { sbK = 0.; sbE = 1.; }
 if (sbB2 && sbSd < 0. && abs(id.x) < 1.5) {
  sbK = 0.; sbE = step(.5, id.y) * step(id.y, sbH.x - .5); sbW = 1.62 + .25 * g2 * abs(id.x); sbD = 1.3 + .2 * o;
  o = sat(-o); sbR = mix(1.64, 14., o * o * o + .015 * h2);
 }
 if (uOwn[7] < 0.) { sbW *= 1. + .42 * uOwn[7]; sbD *= 1. + .3 * uOwn[7]; sbR = mix(sbR, max(sbW * .98, sbD * .8), -.8 * uOwn[7] * step(sbR, 5.)); sbE = max(sbE, step(uOwn[7], -.4) * step(.5, id.y) * step(id.y, (sbSd < 0. ? sbH.x : sbH.y) - .5) * step(.06, g)); }
 if (uOwn[7] > 0.) {
  float lon = sat(1.6 * uOwn[7]); sbW = mix(sbW, .5 * sbB + .03, lon); sbR = mix(sbR, 40., lon * lon * lon); sbD = mix(sbD, 1.35, lon);
  sbE = max(sbE, step(.6, uOwn[7]) * step(.5, id.y) * step(id.y, (sbSd < 0. ? sbH.x : sbH.y) - .5));
 }
}
// How far round the front.
float sbArc(float z) { float v = clamp(z / sbR, -1., 1.), w = v * v; return sbR * v * (1. + w * (.17 + .2 * w * w)); }
// Distance in plan from its outline; x is out from the wall.
float sbPlan(float z, float x) { return max(abs(z) - sbW, length(vec2(z, x - sbD + sbR)) - sbR); }
// Shade of slabs and rails; q is out, up, along.
float sbShd(vec3 q, float px) {
 vec2 l = vec2(-sbSd * sbL.x, sbL.z) / sbL.y; float s = 0., k = floor((q.y + .65) / sbS);
 for (int j = 0; j < 2; j++) {
  float y0 = (k + float(j)) * sbS, hi = y0 + sbRh - q.y, lo = max(y0 - q.y, 0.);
  vec2 a = q.xz + l * lo, b = q.xz + l * hi;
  vec2 id = vec2(floor(a.y / sbB + .5), k + float(j));
  sbUnit(id);
  float pen = (.02 + .025 * lo) * sbPen + .01 + px, z0 = id.x * sbB, da = sbPlan(a.y - z0, a.x), db = sbPlan(b.y - z0, b.x);
  float in0 = sbT(pen, -pen, da), in1 = sbT(pen, -pen, db), th = sbK == 1. ? 1. : .75;
  if (sbK == 0.) {   // the bars, each with its shadow
   vec2 c = mix(a, b, sat(da / (da - db + 1e-4 * (da < db ? -1. : 1.))));
   float g = abs(fract(sbArc(c.y - z0) * 7.) - .5) / 7.;
   th = mix(.3, sbT(pen * .4 + .02, .01, g), sat(.06 / pen - .9));
  }
  s = max(s, sbE * step(0., hi) * max(step(.001, lo) * in0, abs(in1 - in0) * th));
 }
 return s;
}
// How much of the sun clears the house across the court.
float sbClr(vec3 w) {
 float t = (sbA.y - w.x) / max(sbL.x, .05), y = w.y + sbL.y * t, z = w.z + sbL.z * t;
 float roof = sbH.y * sbS + .4, c = abs(fract(z / 7.3 + .2) - .5) * 7.3; roof += 1.5 * sbT(.62, .5, c);
 c = abs(fract(z / 17. + .6) - .5) * 17.; roof += 2.3 * sbT(2.4, 2.2, c);
 // a phrase's shadow
 float c2 = sat(1.4 - abs(fract((w.y - .35 * w.z) / 23. - uTime * .05 + .2) - .5) * 6.);
 return sbT(-.12, .12, y - roof) * (1. - .75 * uPhrase * c2 * c2 * (3. - 2. * c2));
}
vec3 sbSky(vec3 d) {
 float h = sat(d.y);
 vec3 c = mix(mix(vec3(1.7, 1.5, 1.2), vec3(.75, 1.02, 1.25), sbT(.35, 1., h)), vec3(1.5, .72, .5), max(uOwn[0], 0.) * (.85 - .5 * h));
 vec2 q = d.xz / (.25 + h) * 2.2 + uTime * vec2(.004, .002);
 float cl = .15 + .7 * noise(q) + .15 * sbWv(q.x * .5 + .3 * sbWv(q.y * .4));
 c = mix(c, vec3(1.15, 1.18, 1.22) * (.7 + .5 * cl), max(sbGrey, .7 * sbSnow));
 c = mix(c, vec3(2., 1.9, 1.75), .7 * sbT(.35, .8, cl));
 return mix(c, vec3(.02, .035, .085) * (1. + .8 * cl), sbNgt);
}
// Plaster, each house its own.
vec3 sbWall(float bay, float z, float y) {
 float hs = floor((bay + 1.) / 3.), h = fract(hs * .618 + sbSd * .31 + .2);
 vec3 c = sbSd < 0. ? mix(vec3(.86, .5, .24), vec3(.9, .67, .4), h) : sbSd > 1.5 ? vec3(.8, .5, .4) : mix(vec3(.24, .42, .68), vec3(.36, .53, .7), h);
 vec3 wc = vec3(.85, .83, .78), wr = mix(vec3(.6, .14, .09), vec3(.66, .24, .1), h);
 c = mix(c, sbSd < 0. ? wc : wc * vec3(.85, .92, 1.), max(-uOwn[1], 0.));
 c = mix(c, sbSd < 0. ? wr : mix(vec3(.1, .27, .25), vec3(.15, .3, .36), h), max(uOwn[1], 0.));
 if (uOwn[7] > 0.) {
  vec3 k = uKind[int(mod(hs * 2. + (sbSd < 0. ? 1. : sbSd > 1.5 ? 3. : 0.), 5.))]; k *= .7 / max(max(k.r, k.g), max(k.b, .2));
  c = mix(c, k * k * 1.1 + .04, .92 * uOwn[7]);
 }
 return c * (.82 + .24 * noise(vec2(z * .7, y * .16) + hs * 7.) + .12 * noise(vec2(z, y) * 2.3));
}
vec3 sbLit(float lit, float nl, float up, float ao) {
 vec3 bounce = sbBnc * (sbSd < 0. ? .35 : 1.) * (1. - .6 * max(up, 0.)) * (up < 0. ? 1.3 : 1.);
 return sbSun * lit * nl + (sbAmb * (.6 + .4 * up) + bounce) * ao;
}
// A front, flat on: windows, doors, shutters, curtains.
vec3 sbFront(float z, float y, float t, float sh, float nl, float lat, bool end) {
 float px = sbPx * t * 1.5;
 vec2 id = sbId(z, y); float lz = z - id.x * sbB, ly = y - id.y * sbS;
 sbUnit(id); if (end) sbE = 0.;
 float hw = hash21(id * vec2(1.9, .83) + sbSd * 3.);
 float ha = .62, y0 = sbE > .5 ? 0. : .85, hh = .5 * (2.25 - y0);
 vec3 alb = sbWall(id.x, z, y);
 // a band of stone, snow in drifts
 float bd = sbIn(px, abs(ly + .12) - .1); alb = mix(alb * (1. + .14 * bd), sbSn, sbSnow * .9 * max(bd, sbIn(.3, alb.r * .5 + abs(ly - .1) - .6)));
 float yc = ly - 1.125 - .5 * y0, dw = max(abs(lz) - ha, abs(yc) - hh);
 alb = mix(alb, min(alb * 1.25 + .06, .92), sbIn(px, dw - .11));
 float ao = .75 + .25 * sbT(0., .8, abs(2.3 - ly));
 // shutters laid back on the wall
 float dS = max(abs(abs(lz) - ha - .34) - .3, abs(yc) - hh);
 vec3 sc = fract(floor((id.x + 1.) / 3.) * .618 + sbSd * .3 + .4) > .5 ? vec3(.1, .26, .2) : vec3(.12, .22, .34);
 sc = mix(sc, vec3(.08, .2, .45), max(-uOwn[1], 0.) * .8);
 vec4 pc = piece(vec2(fract(z / 44. + .5), sat(y / 25.))); float pa = sat(pc.a * 1.6); pc.rgb /= max(pc.a, .05); sc = mix(sc, pc.rgb * .6, .8 * pa);
 alb = mix(alb, sc * (.75 + .25 * sbWv(ly * 9.) * sat(.06 / px)), sbIn(px, dS) * step(.25, hw));
 float hit = uHits * (.6 + .9 * uEnergy);
 vec3 col = alb * sbLit(sh, nl, 0., ao);
 // glass, curtains, a lamp
 float win = sbIn(px, dw);
 {
  float lx = max(nl, .12);
  float rev = sbIn(.06 + px, max(abs(lz + lat / lx * .16) - ha, abs(yc + sbL.y / lx * .16) - hh)) * sh;
  float open = mix(.12, .85, sat(.35 + .35 * sbWv(hw * 9. + uTime * .01) + .8 * uBands[int(min(hw * 16., 15.))])) * ha;
  float fold = sbWv(lz * 4.2 + hw * 7. + .1 * sbWv(uTime * .09 + hw + ly * .2));
  float cu = sbIn(px + .03, open - abs(lz) + .03 * sbWv(ly * .4 + uTime * .08 + hw * 5.));
  vec3 cc = mix(hw > .5 ? vec3(.8, .76, .68) : vec3(.66, .5, .36), pc.rgb, .8 * pa) * (.8 + .2 * fold);
  vec3 gl = vec3(.035, .04, .05) + sbAmb * (.2 + .25 * step(.5, fract(hw * 23.)));
  float lamp = sat(uKeys * step(.45, fract(hw * 13.)) * 1.1 + sbNgt * step(.42, fract(hw * 5.3)));
  vec3 warm = vec3(1.9, .95, .34) * lamp * (.6 + .4 * sbT(1.4, 0., abs(yc - .5)));
  vec3 wcol = mix(gl + warm, cc * (sbLit(rev, nl, 0., .5) + warm * .8), cu);
  float bar = sbIn(px, min(abs(lz), abs(yc - .35)) - .033);
  wcol = mix(wcol, vec3(.7, .66, .58) * sbLit(rev, nl, 0., .6), bar * .9);
  col = mix(col, wcol, win);
  // a hit: a pane catches the sun
  col += vec3(2.4, 2.1, 1.5) * hit * win * (1. - cu) * step(.86, hw);
 }
 // and throws a patch over the shade
 if (sbSd > 0.) {
  vec2 q = vec2(z - 5.5 - .35 * (y - 9.), y - 8. - 4. * (1. - uHits));
  col += alb * (sbSun + 1.6 * sbGrey) * .9 * hit * sbT(.25, -.1, max(abs(q.x) - .9, abs(q.y) - 1.5)) * (.6 + .4 * sbWv(q.x * .6 + q.y * .3));
 }
 return col;
}
// A rail, its leaves and cloths, and how much it covers.
vec4 sbRail(vec2 id, float lz, float x, float ly, float px, float py, float sun, float nl, bool back, vec3 wallc) {
 float s = abs(lz) > sbW - .02 ? x : sbArc(lz);
 float g = hash21(id * 1.7 + sbSd * 9.), g2 = fract(g * 17.3);
 float tall = sbIn(py, abs(ly - .475 * sbRh) - .525 * sbRh);
 float al; vec3 alb;
 if (sbK == 1.) { al = tall; alb = wallc * (1. - .15 * sbLn(py, ly - sbRh + .06, .05)); }
 else if (sbK == 2.) {
  float b = abs(fract(ly * 4.) - .5) * .25; al = tall * mix(.8, sbIn(py, .02 - b), sat(.12 / py - .6));
  alb = mix(vec3(.3, .16, .08), vec3(.16, .3, .3), step(.5, fract(g * 3.3)));
 } else {
  float b = abs(fract(s * 7.) - .5) / 7.; al = tall * mix(.24, sbIn(px, b - .017), sat(.11 / px - .6));
  al = max(al, max(sbLn(py, ly - sbRh, .035), sbLn(py, ly - .12, .02)));
  alb = vec3(.045, .05, .055);
 }
 alb = mix(alb, sbSn, sbSnow * sbT(sbRh - .3, sbRh, ly)); al = max(al, sbSnow * sbLn(py, ly - sbRh, .07));
 if (back) return vec4(alb * sbLit(sun, nl, 0., .7), al);
 // leaves
 float am = sat(.55 + .5 * uOwn[3] + .12 * uTexture) * sat((.55 + .6 * uOwn[3] - g) * 6.) * (sbB2 && id.y > 7.5 ? 0. : 1.);
 vec3 col = alb * sbLit(sun, nl, 0., .85);
 {
  vec2 q = vec2(s + (.015 + .12 * uTexture) * sbWv(uTime * .21 + g + ly * .6), ly);
  float m = noise(q * 3. + g * 40.), f = mix(noise(q * 13. + g * 9.), .5, sat(py * 4. - .4));
  float edge = abs(ly - .85 + .5 * (1. - am)) * 1.15 + .22 * abs(s - (g2 - .5) * 1.2) / (.25 + am);
  float lf = sbT(-.06 - py, .06 + py, m * .75 + .5 * f - edge * .95 - .1) * sat(am * 4.);
  vec3 gc = mix(vec3(.05, .13, .03), vec3(.2, .33, .06), f) * (.7 + .6 * m);
  gc = mix(gc, g2 > .6 ? vec3(.75, .12, .2) : vec3(.85, .6, .7), sbT(.66, .78, f) * step(.3, g2));
  col = mix(col, gc * sbLit(sun, .35 + .65 * nl, .2, .9) * 1.1, lf); al = max(al, lf);
 }
 // cloth over a rail
 bool red = sbSd < 0. && id.x == 1. && id.y == 4.;
 if (red || (g > .7 && !(sbB2 && id.y > 6.5) && fract(g * 29.) > .45)) {
  float cs = red ? 0. : g2 - .5, hw = red ? .82 : .45, low = red ? -.5 : -.05, wav = .05 * sbWv(s * 1.1 + uTime * .06);
  float cl = sbIn(max(px, py), max(abs(s - cs + .04 * sbWv(ly * .5 + uTime * .07)) - hw, abs(ly - .5 * (sbRh + .07 + low) - wav * .5) - .5 * (sbRh + .07 - low)));
  vec3 cc = red ? vec3(.82, .035, .03) : mix(vec3(.88, .85, .78), mix(vec3(.75, .45, .2), uKind[1], .4), sbIn(px * 5., abs(fract(s * 5.) - .5) - .24));
  cc *= .86 + .14 * sbWv(s * 1.6 + .15 * ly);
  col = mix(col, cc * sbLit(sun, max(nl, .25), 0., 1.), cl); al = max(al, cl);
 }
 return vec4(col, al);
}
// Washing across the court, far ones first.
vec3 sbWash(vec3 col, vec3 d, float tMax) {
 float x0 = -sbA.x + 1., x1 = sbA.y - 1., full = .62 + (uOwn[4] < 0. ? .75 : 1.2) * uOwn[4], big = 1. + .6 * max(uOwn[4], 0.), cov = 0., lin = 0.;
 vec4 c = vec4(0.); vec3 at = vec3(0.);   // the nearest cloth
 for (int i = 4; i >= 0; i--) {
  float fi = float(i), h = fract(fi * .618 + .21), zc = sbB2 ? (i < 3 ? -12. + 2.6 * fi : 3. * fi + 2.5) : 3.4 + 2.5 * fi;
  float yl = sbB2 ? 9. + 5. * h : 11.5 + 1.3 * fi + 4. * (h - .5), t = zc / d.z, px = sbPx * abs(t);
  vec3 q = sbO + d * t;
  float e = (2. * q.x - x0 - x1) / (x1 - x0), v = yl - .5 * (1. - e * e) - q.y, here = step(0., t) * step(t, tMax) * step(abs(e), 1.);
  float sway = q.x + v * (.05 + .2 * uTexture) * sbWv(uTime * .11 + fi * .37 + q.x * .1), n = floor(sway / 1.05), g = hash21(vec2(n, fi * 3. + 1.)), g2 = fract(g * 13.7);
  float u = sway - (n + .5) * 1.05, len = (.7 + .75 * g2) * big, k = fract(g * 5.9);
  float dd = max(abs(u) - .3 * big - .1 * k, abs(v - .5 * len) - .5 * len - .04 * sin(u * 6. + g * 25.));
  if (k > .7) dd = max(dd, min(.06 - abs(u), v - .35));
  else if (k > .45) dd = max(abs(u) - (v < .3 ? .44 : .26), abs(v - .4) - .4);
  float al = here * sbIn(px, dd) * sbT(0., .12, full - .95 * fract(g * 3.1 + .2));
  lin = max(lin * (1. - al), here * sbIn(px, abs(v) - .012) * sat(.03 / px) * sbT(0., .12, full - .5 * fract(h * 7.)));
  cov = max(cov, al);
  if (al > .3) { c = vec4(g, u, v, g2); at = q; lin *= 1. - al; }
 }
 float g3 = fract(c.x * 91.3), kd = min(floor(c.w * 4.), 3.), lv = kd < 1. ? uDrone : kd < 2. ? uPad : kd < 3. ? uTexture : uPhrase;
 vec3 cc = g3 < .45 ? vec3(.9, .88, .82) : g3 < .65 ? vec3(.35, .5, .68) : g3 < .85 ? vec3(.85, .62, .22) : vec3(.75, .45, .42);
 cc = mix(cc, uKind[int(kd)] * .85 + .08, mix(.5 * lv, .15 + .75 * lv, step(.45, g3)));
 float clr = sbT(-.4, .4, at.y + sbL.y / sbL.x * (sbA.y - at.x) - sbH.y * sbS - .5);
 cc *= (.85 + .15 * sbWv(c.y * 2.1 + c.x * 5. + c.z * .2)) * (sbSun * clr * .55 + sbAmb * (sbB2 ? .9 : 1.6) + sbBnc * .5);
 return mix(mix(col, cc, cov), vec3(.05), lin);
}
// The court: slabs, a bed with a tree, a hand cart.
float sbBox(vec2 q, vec2 b) { q = abs(q) - b; return max(q.x, q.y); }
vec3 sbCourt(vec3 g, vec3 d, float t, float cx) {
 float px = sbPx * t, cl = sbClr(g);
 vec2 q = g.xz - vec2(cx, 5.2), sd = sbL.xz / sbL.y; float r = length(q) + 1e-4, a = atan(q.y, q.x + 1e-5);
 // setts in rings, slabs in courses
 float ring = sbIn(px, r - 6.), rc = floor(r), nn = floor(TAU * (rc + .5) * .8);
 vec2 cf = vec2(r, a / TAU * nn), sf = g.xz / vec2(1.5, 2.3); sf.y += .5 * mod(floor(sf.x), 2.);
 float h = mix(hash21(floor(sf)), hash21(floor(cf) + 7.), ring);
 vec2 jt = mix(abs(fract(sf) - .5) - vec2(.48, .487), abs(fract(cf) - .5) - .475, ring);
 vec3 alb = mix(vec3(.76, .66, .53), vec3(.6, .46, .36), ring) * (.9 + .17 * h) * (.8 + .34 * noise(g.xz * .3));
 alb *= 1. - .22 * sbT(-.02, .02, max(jt.x, jt.y));
 alb = mix(alb, vec3(.8, .73, .62), sbIn(px, abs(r - 6.) - .15));
 // the bed: a stone rim, rings of planting
 vec2 sway = vec2(.03 + .12 * uTexture, 0.) * sbWv(uTime * .17 + q.y * .1);
 float l2 = noise(q * 5.5 + sway * 5.), rg = r / 1.05;
 vec3 gr = mix(vec3(.07, .17, .05), vec3(.26, .38, .09), .25 + .6 * l2);
 gr = mix(gr, rg > 2. ? vec3(.85, .55, .12) : vec3(.78, .2, .25), sbT(.5, .7, l2) * sbT(.42, .25, abs(fract(rg) - .5)));
 gr *= 1. - .6 * sbT(.38, .5, abs(fract(rg) - .5));
 alb = mix(mix(alb, gr, sbIn(px, r - 3.2)), vec3(.82, .77, .68), sbIn(px, abs(r - 3.4) - .22));
 // the shadows of the bed, the tree and the cart
 float shade = sbT(.06, -.06, max(length(q + sd * .45) - 3.6, 3.6 - r));
 vec2 e = q + sd * 3.4; float lum = length(sd); vec2 ax = sd / lum;
 e = vec2(dot(e, ax) / sqrt(1. + lum * lum), dot(e, vec2(-ax.y, ax.x)));
 shade = max(shade, .95 * sbT(.12, -.12, length(e) - 1.7 - .12 * sin(q.x * 3.) * sin(q.y * 4.)));
 mat2 cr = rot(.62); vec2 c = cr * (g.xz - vec2(.75 * cx, -5.2)), cs = cr * sd, k = c + cs * clamp(-dot(c, cs) / dot(sd, sd), .45, 1.5);
 shade = max(shade, sbT(.05, -.05, sbBox(k, vec2(1.15, .72))));
 k = c + cs * .75 - vec2(2., 0.); shade = max(shade, sbT(.05, -.05, sbBox(vec2(k.x, abs(k.y) - .5), vec2(.95, .06))));
 alb = mix(alb, sbSn * (.9 + .1 * h), sbSnow * sbT(.1, .5, l2 + .3 * sbSnow));
 vec3 col = alb * (sbSun * sbL.y * cl * (1. - shade) + sbAmb * (1. - .25 * shade) + sbBnc * .25);
 if (uOwn[6] < 0. && sbB2) {   // water for the stones
  float w = -uOwn[6] * sbT(3.5, 3.62, r);
  vec2 rq = g.xz * vec2(.9, .5);
  float rp = noise(rq + uTime * vec2(.05, .03)) + .5 * noise(rq * 2.7 - uTime * vec2(.06, .02)) - .75, rp2 = noise(rq.yx + 9. - uTime * vec2(.04, .03)) - .5;
  vec3 rd = normalize(vec3(d.x + (.10 + .16 * uTexture) * rp, -d.y, d.z + .1 * rp2));
  float far = rd.x > 0. ? (sbA.y - g.x) / max(rd.x, .01) : (g.x + sbA.x) / max(-rd.x, .01), y2 = rd.y * far, top = (rd.x > 0. ? sbH.y : sbH.x) * sbS, z2 = g.z + rd.z * far, keep = sbSd;
  sbSd = rd.x > 0. ? 1. : -1.;
  vec3 hs = sbWall(floor(z2 / sbB + .5), z2, y2) * (sbAmb + (rd.x > 0. ? 0. : .25) * sbSun);
  sbSd = keep;
  hs *= 1. - .55 * sbT(.26, .2, abs(fract(y2 / sbS) - .5)) * sbT(.22, .16, abs(fract(z2 / sbB) - .5));
  vec3 mir = mix(hs, sbSky(rd), sbT(-.6, .6, y2 - top));
  float glint = sbT(.82, .98, dot(rd, sbL) + .12 * rp) * cl;
  vec3 wet = mix(col * vec3(.16, .5, .52), mir, .3 + .25 * sbT(-.3, .5, rp)) + sbSun * .5 * glint * sbT(.1, .5, rp) + sbSun * cl * .05 * sbT(.12, .0, abs(noise(g.xz * .8 + rp) - .5));
  col = mix(col, wet, w); alb *= 1. - .85 * w;
 }
 // night: a lamp by the bed
 vec2 ld = q + vec2(3.9, 2.); col += alb * vec3(1.6, .85, .35) * (sbNgt + .4 * uKeys) * 1.1 / (1. + .12 * dot(ld, ld));
 // a hit throws the sun of panes over the shade
 vec2 hq = cr * (g.xz - vec2(cx + 7. + 2. * (1. - uHits), 1.)); col += alb * sbSun * uHits * (.5 + .7 * uEnergy) * sbT(.4, -.2, sbBox(hq, vec2(3.4, 6.))) * sbT(-.8, -.2, sbWv(hq.y * .25)) * .8;
 // the cart: shafts, a load of fruit
 vec3 lit = sbSun * cl * .75 + sbAmb;
 col = mix(col, vec3(.36, .2, .1) * lit, sbIn(px, sbBox(vec2(c.x - 2., abs(c.y) - .5), vec2(.95, .07))));
 col = mix(col, vec3(.14, .3, .42) * lit, sbIn(px, sbBox(c, vec2(1.2, .75))));
 vec2 ci = c * 2.6, cj = floor(ci + .5);
 col = mix(col, vec3(.95, .5, .06) * lit * (.85 + .6 * (ci.x - cj.x)), sbIn(px, sbBox(c, vec2(1.06, .62))) * (.35 + .65 * sbIn(px * 2.6, length(ci - cj) - .47)));
 // the crown of the tree
 vec2 u = q + d.xz / d.y * 3.4;
 float m = noise(u * 1.8 + sway * 2.), m2 = noise(u * 5. - sway * 4.), cd = length(u) - 1.75 - .6 * (m - .5) - .35 * (m2 - .5);
 vec3 tc = mix(vec3(.07, .15, .04), vec3(.3, .4, .09), sat(.5 + .3 * dot(u, sbL.xz) + .7 * (m2 - .5))) * (sbSun * .6 * cl + sbAmb);
 tc = mix(tc, sbSn * .9 * (sbSun * .5 * cl + sbAmb), sbSnow * .85 * sbT(.2, .6, m2));
 return mix(col, tc, sbT(.06 + px, -.06 - px, cd));
}
vec3 render(vec2 p) {
 sbB2 = uVar > .5;
 sbNgt = max(-uOwn[0], 0.); sbSnow = max(-uOwn[3], 0.); sbGrey = max(-uOwn[4], 0.); float dusk = max(uOwn[0], 0.);
 float az, el, ro, fo, cx = 6.6;
 if (!sbB2) { az = -.42; el = .98; ro = .22; fo = .72; sbA = vec2(5.6, 5.4); sbH = vec2(8., 7.); sbO = vec3(0., 1.5 + .5 * sbWv(uTravel * .006), 0.); }
 else { az = .9; el = -1.33; ro = -.5; fo = .78; sbA = vec2(2.5, 24.); sbH = vec2(9., 4.); sbO = vec3(0., 27.4 + .6 * sbWv(uTravel * .006), 0.); }
 float wide = max(-uOwn[5], 0.), thin = max(uOwn[5], 0.);
 if (!sbB2) { sbA *= 1. + .75 * wide - .34 * thin; el += .2 * thin - .16 * wide; fo -= .1 * thin; az += .15 * thin; }
 else { sbA.y += 12. * wide - 11. * thin; cx += 2.2 * wide - 1.6 * thin; el += .16 * wide - .04 * thin; ro -= .15 * wide; }
 float over = max(uOwn[6], 0.), under = max(-uOwn[6], 0.);
 if (!sbB2) { el += .5 * under - .52 * over; ro += .3 * under - .2 * over; az += .42 * under + .3 * over; fo += .34 * over - .04 * under; sbO.y += 3.5 * over; }
 else { el += .5 * over; ro += .36 * over; az += .42 * over; fo += .06 * over; cx += 4. * over + 2. * under; }
 fo *= 1. - .06 * (uSpace - .5);
 ro += .28 * uCue * (1. - uCue);
 p = rot(ro) * p;
 vec3 f = vec3(sin(az) * cos(el), sin(el), cos(az) * cos(el)), r = normalize(vec3(f.z, 0., -f.x)), u = cross(f, r);
 vec3 d = normalize(f * fo + r * p.x + u * p.y);
 d += (1. - step(1e-4, abs(d))) * 2e-4;
 sbPx = 1. / (uRes.y * fo);
 // the sun
 float turn = .08 * sin(TAU * uLoop) + .05 * sbWv(uTime * .002), low = .45 * uDrone + .6 * dusk;
 sbL = sbB2 ? normalize(vec3(.5, .56 - .18 * low, -.72 + turn)) : normalize(vec3(.5, .82 - .22 * low, -.62 + turn));
 sbPen = 1.6 - uTone;
 sbSun = mix(vec3(2.5, 2.05, 1.5) * mix(vec3(1.), vec3(1.12, .95, .75), uPad), vec3(2.7, 1.2, .6), dusk);
 sbSun = mix(sbSun, vec3(.05, .07, .13), sbNgt) * (.94 + .25 * uLevel + .14 * uCue);
 sbAmb = mix(mix(vec3(.3, .42, .62), vec3(.45, .34, .5), dusk), vec3(.03, .045, .09), sbNgt);
 sbSun *= 1. - .9 * sbGrey; sbAmb = mix(sbAmb, vec3(dot(sbAmb, vec3(.45))), .8 * sbGrey + .3 * sbSnow) * (1. + .45 * sbSnow + .35 * sbGrey);
 sbBnc = mix(mix(vec3(.3, .17, .08), vec3(.4, .14, .06), dusk), vec3(.04, .022, .01), sbNgt) * (1. + .9 * uPad + .6 * uMic + 1.5 * uCue + (3. * uHits + 1.5 * uLevel + 1.5 * uPhrase + uLow) * (sbGrey + .3 * sbSnow));
 sbSd = d.x < 0. ? -1. : 1.;
 float D = sbSd < 0. ? sbA.x : sbA.y, adx = abs(d.x), N = sbSd < 0. ? sbH.x : sbH.y, H = N * sbS;
 float tW = D / adx, tF = d.y < 0. ? -sbO.y / d.y : 1e9, tE = min(tW, tF), tZ = !sbB2 && d.z > 0. ? 17. / d.z : 1e9, yz = sbO.y + d.y * tZ;
 bool end = tZ < tE && yz < sbH.y * sbS;
 if (end) tE = tZ;
 float plan = length(d.xz), t = max((D - sbDm) / adx, 0.), tr = 1.;
 vec3 col = vec3(0.);
 // bay by bay: 0 a rail, 1 a slab, 2 a rail from inside
 float ht[7], ha[7], hi[7]; vec2 hid[7]; int hk[7], n = 0; bool full = false;
 if (t < tE && (d.y < 0. || sbO.y + d.y * t < H)) {
  vec3 w = sbO + d * t; vec2 id = sbId(w.z, w.y), st = vec2(d.z < 0. ? -1. : 1., d.y < 0. ? -1. : 1.);
  vec2 tn = vec2(((id.x + .5 * st.x) * sbB - sbO.z) / d.z, ((id.y + .5 + .5 * st.y) * sbS - .65 - sbO.y) / d.y), dt = vec2(sbB, sbS) / abs(d.zy);
  for (int i = 0; i < 16; i++) {
   float te = min(min(tn.x, tn.y), tE);
   sbUnit(id);
   // a strip cut by a disc
   float oz = sbO.z - id.x * sbB, cx = D - sbD + sbR, aa = plan * plan, b = oz * d.z - cx * adx, q = b * b - aa * (cx * cx + oz * oz - sbR * sbR);
   vec2 sz = (vec2(-sbW, sbW) - oz) / d.z; q = q > 0. ? sqrt(q) : -1e6;
   float a0 = max(max(min(sz.x, sz.y), (-b - q) / aa), 0.), a1 = min(max(sz.x, sz.y), (-b + q) / aa), a2 = min(a1, tW);
   if (sbE > .5 && a0 < a2 && q > 0.) {
    float y0 = id.y * sbS - sbO.y, pt = sbPx * a0 + 1e-5, ch = (a1 - a0) * plan, ya = d.y * a0 - y0, yb = d.y * a2 - y0;
    float sil = sat(min(ch * .5, ch * ch / (3. * min(sbR, 2.5))) / pt), al = sil * sat(min(max(ya, yb) + sbTh, -min(ya, yb)) * plan / pt);
    if (a0 > .02 && ya > -.6 && ya < 1.6 && n < 7) { ht[n] = a0; ha[n] = sil; hid[n] = id; hk[n++] = 0; }
    if (al > 0. && n < 7) { ht[n] = clamp((y0 - (d.y > 0. ? sbTh : 0.)) / d.y, a0, a2); hi[n] = d.y > 0. ? sbT(-pt, pt, ya + sbTh) : sbT(pt, -pt, ya); ha[n] = al; hid[n] = id; hk[n++] = 1; full = al > .98; }
    if (a1 < tW && yb > -.05 && yb < 1.1 && n < 7 && !full) { ht[n] = a1; ha[n] = sil; hid[n] = id; hk[n++] = 2; }
   }
   if (full || te >= tE) break;
   if (tn.x < tn.y) { tn.x += dt.x; id.x += st.x; } else { tn.y += dt.y; id.y += st.y; if (id.y >= N && st.y > 0.) break; }
  }
 }
 // the colour of each
 for (int i = 0; i < n; i++) {
  if (tr < .015) break;
  int k = hk[i]; vec2 id = hid[i]; vec3 P = sbO + d * ht[i], c;
  sbUnit(id);
  float lz = P.z - id.x * sbB, x = D - abs(P.x), al = ha[i], pt = sbPx * ht[i];
  vec3 nn = abs(lz) > sbW - .02 ? vec3(0., 0., sign(lz)) : normalize(vec3(-sbSd * max(x - sbD + sbR, .01), 0., lz));
  if (k == 2) nn = -nn;
  vec3 nf = nn; float lf = sbB2 || sbSd < 0. ? 1. : 0.;
  if (k == 1 && hi[i] < .99) nn = vec3(0., d.y > 0. ? -1. : 1., 0.);
  float nl = max(dot(nn, sbL), 0.) * lf;
  vec3 Q = P + nn * .1, alb = min(sbWall(id.x, P.z, P.y) * 1.08 + .04, .95);
  float sun = sbClr(Q) * (1. - sbShd(vec3(D - abs(Q.x), Q.y, Q.z), pt));
  sbUnit(id);
  if (k == 1) {
   vec3 edge = mix(alb, sbSn, sbSnow * hi[i]) * sbLit(sun, max(dot(nf, sbL), 0.) * lf, 0., .8);
   if (nn.y > .5) {   // the floor of a balcony, tiled
    vec2 q = abs(fract(vec2(x, P.z) * 2.4) - .5);
    alb = mix(vec3(.6, .36, .22), vec3(.46, .34, .27), fract(sbW * 37.)) * (1. - .35 * sbT(.44, .48, max(q.x, q.y)) * sat(.06 / pt - 1.));
   }
   alb = mix(alb, sbSn, sbSnow * sbT(.4, .9, nn.y));
   c = mix(alb * sbLit(sun, nl, nn.y, nn.y < -.5 ? .5 + .45 * sat(x / 1.2) : .8), edge, hi[i]);
  } else {
   // a pixel's reach along the rail and up it
   float dn = max(abs(dot(d, nn)), .04);
   vec4 rl = sbRail(id, lz, x, P.y - id.y * sbS, pt * max(1., plan / dn), pt * sqrt(1. + d.y * d.y / (dn * dn)), sun, nl, k == 2, alb);
   c = rl.rgb; al *= rl.a;
  }
  col += tr * al * c; tr *= 1. - al;
 }
 // what is behind them
 bool court = !end && tF < tW, open = !end && !court && sbO.y + d.y * tW > H;
 if (tr > .015) {
  vec3 bg, P = sbO + d * tE;
  if (court) bg = sbCourt(sbO + d * tF, d, tF, cx);
  else if (open) {
   bg = sbSky(d);
   if (d.y < 0.) { float q = sbO.z + d.z * (H - sbO.y) / d.y; bg = mix(vec3(.42, .17, .1), sbSn * .95, sbSnow) * (.85 + .2 * sbWv(q * 2.2)) * (sbSun * .6 + sbAmb); }
   if (uOwn[6] > 0. && sbB2 && d.y < 0.) {   // roofs beyond roofs
    float s = (H - sbO.y) / d.y; vec2 g = sbO.xz + d.xz * s - vec2(sbA.y, 0.), n = floor(g / vec2(16., 11.) + vec2(.0, .37)); float px = sbPx * s * 1.4 / max(-d.y, .1);
    n.y = floor(g.y / 11. + .37 + .31 * n.x); vec2 l = vec2(g.x - n.x * 16., (g.y / 11. + .37 + .31 * n.x - n.y) * 11.); float h = hash21(n + 3.);
    float face = h > .4 ? l.x - 7.5 - 1.5 * h : l.y - 5.5, lean = h > .4 ? -sbL.x : sbL.z, yard = max(3. - 2.4 * fract(h * 11.) - l.x, .9 - l.y);
    vec3 a = mix(vec3(.56, .25, .13), fract(h * 7.) > .75 ? vec3(.55, .5, .46) : vec3(.3, .14, .13), fract(h * 7.)) * (.88 + .12 * sbWv((h > .4 ? g.y : g.x) * 1.4) * sat(.2 / px));
    vec3 c = mix(a, sbSn * .95, sbSnow) * (sbSun * (.5 + sign(face) * .62 * lean * sat(abs(face) / px)) + sbAmb);
    c = mix(c, c * .35, sbT(-px, px, -abs(face) * 8. + .9) * .5);
    vec2 ch = abs(l - vec2(4. + 5. * fract(h * 13.), 3. + 5. * fract(h * 29.))) - vec2(.5, .7);
    c = mix(c, vec3(.8, .6, .45) * (sbSun * .7 + sbAmb), sbIn(px, max(ch.x, ch.y))); ch += vec2(-1., .4) * .5;
    c = mix(c, sbAmb * vec3(.12, .14, .2), sbT(-px, px, yard));
    vec3 lit = vec3(1.9, .95, .34) * sbNgt * step(.5, fract(h * 5.)) * sbIn(px, max(abs(l.x - 9.) - .4, abs(l.y - 4.) - .5));
    bg = mix(bg, mix(c + lit, sbSky(vec3(d.x, .02, d.z)) * .8, 1. - exp(-max(s - 12., 0.) * .012)), sat(uOwn[6] * 4.));
   }
  } else {
   float nl = end ? -sbL.z : -sbSd * sbL.x, sun = sbClr(P);
   if (end) sbSd = 3.;
   else sun *= 1. - sbShd(vec3(0., P.yz), sbPx * tE);
   bg = sbFront(end ? P.x + 1.5 : P.z, P.y, tE, sun, max(nl, 0.), end ? sbL.x : sbL.z, end);
  }
  col += tr * bg;
 }
 // the eaves
 if (!court && !end) {
  float tc = (D - .6) / adx, ya = sbO.y + d.y * tc - H, yb = sbO.y + d.y * tW - H;
  float ea = sat(min(max(ya, yb) + .25, .12 - min(ya, yb)) * plan / (sbPx * tc)) * step(0., tc) * (full ? 0. : tr);
  col = mix(col, vec3(.5, .36, .25) * sbLit(0., 0., -1., .7), ea);
 }
 col = sbWash(col, d, min(tE, tF));
 return screenOf(col * 1.1);
}
