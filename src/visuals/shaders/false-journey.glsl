// name: False journey
// a: Carriage side
// b: Behind the belts
// what: From a polished old compartment, a landscape made of belts: gravel, bushes, sawn fences and huts, and behind them a slow painted canvas of lakes, birches and mountains under a glass roof; or the set from behind, each belt a loop on its drum beside the carriage, sun barred over it all.
// follows: Each kind colours a belt: drone the mountains, pad lakes and birches, texture bushes, phrase huts and fences; a hit sends one telegraph pole past. Bands are the birches' heights, fuller music runs the belts faster and lifts the sun, the loop sways its bars. A cue rocks the carriage; keys light the vase or the panes.
// own: 0 fog at -1, sunset at 1; 1 winter at -1, autumn at 1; 2 low country, wide sky at -1, high peaks at 1; 3 bare linen and drawing at -1, poster colours at 1; 4 back in the seat, or down on the floor at -1, at the open window, or up in the roof at 1; 5 bare belts and few trees at -1, crowded, with tall bushes and more cloud at 1; 6 a painted sea with sails and sawn waves, through a round window in a, at -1, a painted desert of red tables, palms and cactus at 1; 7 night, with footlights and a painted moon, at -1, everything cut from papers coloured by the sounds at 1
float fjS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
#define FJ_SEA max(-uOwn[6], 0.)
#define FJ_DES max(uOwn[6], 0.)
#define FJ_NT max(-uOwn[7], 0.)
#define FJ_PAP max(uOwn[7], 0.)
#define FJ_WIN vec2(.94 - .4 * FJ_SEA, .57), .13 + .41 * FJ_SEA
// pixel, worlds, runs, sun, shade, air, eye, ray
float fjPx, fjFog, fjEve, fjWin, fjAut, fjRaw, fjBold, fjTall, fjM;
vec4 fjRun;
vec3 fjSun, fjDim, fjAir, fjO, fjD;
float fjH(float n) { n = fract(mod(n, 1024.) * .1031); n *= n + 33.33; n *= n + n; return fract(n); }
float fjH2(vec2 p) { return fjH(p.x + 91.7 * p.y); }
float fjN(float x) { float i = floor(x), f = x - i; return mix(fjH(i), fjH(i + 1.), f * f * (3. - 2. * f)); }
float fjN2(vec2 p) {
 vec2 i = floor(p), f = p - i; f = f * f * (3. - 2. * f);
 return mix(mix(fjH2(i), fjH2(i + vec2(1,0)), f.x), mix(fjH2(i + vec2(0,1)), fjH2(i + 1.), f.x), f.y);
}
float fjI(float e, float d) { return fjS(e, -e, d); }
void fjL(inout vec3 c, vec3 over, float e, float d) { c = mix(c, over, fjI(e, d)); }
float fjBox(vec2 q, vec2 h, float r) { q = abs(q) - h + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
float fjR(float x, float l) { return abs(fract(x / l + .5) - .5) * l; }   // from the nearest line of a row
void fjU(inout vec4 top, vec3 c, float a) { top += (1. - top.a) * vec4(c * a, a); }
vec3 fjDye(int k) { vec3 c = uKind[k]; return c / max(max(c.r, max(c.g, c.b)), .2); }
vec3 fjY(vec3 c, vec3 autumn, vec3 winter) { return mix(mix(c, autumn, fjAut), winter, fjWin); }
vec3 fjT(vec3 c, vec3 fog, vec3 eve) { return mix(mix(c, fog, fjFog), eve, fjEve); }
// Scene paint, coloured by its kind of sound.
vec3 fjP(vec3 c, int k, float lv) {
 float l = dot(c, vec3(.3,.6,.1));
 lv *= .5 + .7 * uEnergy;
 c = mix(vec3(l), c, .9 + .35 * lv + .55 * fjBold);
 c = mix(c, fjDye(k) * (.15 + .9 * l), .55 * lv);
 c = mix(c, c * c * (3. - 2. * c), .7 * fjBold);
 if (uOwn[3] < 0.) return mix(max(c, 0.), vec3(.95,.9,.8) * (.4 + .6 * l), fjRaw * .9 * (1. - .9 * min(1.8 * lv, 1.)));
 c = mix(c, uKind[k] * (.5 + .75 * fjS(.1, .9, l) + .3 * lv), .92 * FJ_PAP);
 return max(c, 0.);
}
// The sun through the glazing's bars.
float fjB(vec3 q) {
 float s = q.x + .75 * q.y - .3 * q.z + .45 * sin(TAU * uLoop), w = .06 + .02 * max(q.z, 0.);
 return 1. - (.3 + .5 * uTone) * fjS(.1 + w, .1 - .5 * w, min(fjR(s, 1.15), .4 * fjR(s + .6, 6.9))) / (1. + .06 * max(q.z - 4., 0.));
}
// The painted canvas.
vec3 fjCanvas(vec2 q, float e) {
 float x = q.x, y = q.y - .35 * uOwn[2], hz = 1.72, up = sat((y - hz) / (4.2 - hz)), dab = fjN2(q * vec2(9,22)) - .5;
 vec3 c = mix(vec3(.96,.93,.82), vec3(.36,.63,.84), pow(up, .75) + .06 * dab);
 float cl = fjN2(vec2(x * .5, y * 1.5)) * .62 + fjN2(vec2(x * 1.3 + 3., y * 3.2)) * .38 + .04 * dab;
 c = mix(c, mix(vec3(.98,.96,.91), vec3(.8,.85,.9), fjS(.6, .72, cl)), fjS(.5, .6, cl + .1 * fjM) * fjS(.02, .3, up));
 c = mix(c, mix(vec3(.98,.84,.64), vec3(.5,.7,.76), pow(up, .6)), .8 * FJ_DES);
 if (uOwn[7] < 0.) {
  vec2 m = vec2(x - 11. * floor(x / 11.) - 5.5, y - 3.2), st = q * 5., si = floor(st);
  float R = length(m);
  c = mix(c, mix(vec3(.2,.27,.5), vec3(.035,.06,.17), pow(up, .6)) * (.8 + .4 * cl), FJ_NT);
  c = mix(c, vec3(.95,.92,.75), FJ_NT * max(fjI(e, R - .3), max(step(.72, fjH2(si)) * fjI(5. * e, length(st - si - .5 - .4 * (fjH2(si + 9.) - .5)) - .07) * fjS(.1, .3, up), .25 * exp(-2.5 * R))));
 }
 c = fjP(mix(c, vec3(.82,.84,.84), .6 * fjWin * (1. - FJ_NT)), 1, .3 * uPad);
 c = mix(c, mix(vec3(.94,.92,.86), uKind[1], .25 + .35 * up) * (.94 + .08 * fjS(.5, .6, cl)), FJ_PAP);
 // ranges of mountains
 for (float k = 0.; k < 3.; k++) {
  float u = x * (.4 + .22 * k) + 31. * k;
  float h = fjN(u) + .45 * (1. - abs(2. * fjN(u * 2.3 + 7.) - 1.)) + .16 * fjN(u * 6.1);
  h = mix(h, .42 + .5 * fjS(.5, .56, h) + .42 * fjS(.8, .86, h) + .05 * fjN(u * 9.), FJ_DES);
  h = (h - .26 - .35 * FJ_SEA) * (1.6 - .55 * k) * fjTall * (1. - .45 * FJ_SEA);
  float d = hz + h - .06 - y, face = fjS(-.2, .2, fjN(u * 4.1 + d * 2.1) - fjN(u * 4.1 - d * 2.1 + 9.) + .6 * dab);
  vec3 m = mix(mix(vec3(.4,.53,.7), vec3(.7,.69,.72), face), mix(vec3(.2,.38,.42), vec3(.55,.6,.42), face), k * .5);
  m = mix(m, mix(vec3(.55,.24,.16), vec3(.9,.55,.34), face) * (.86 + .2 * fjN(y * 9. + fjN(x))) + .08 * k, FJ_DES);
  m = mix(m, mix(vec3(.62,.73,.88), vec3(1), face), (1. - FJ_DES) * fjS(.12, 0., d - (.5 - .25 * k) * (h - .35) * (.5 + fjN(u * 11.)) - 1.2 * fjWin) * (1. - .8 * FJ_SEA * (1. - fjWin)));
  m *= 1. - FJ_NT * vec3(.72,.62,.4);
  m = mix(m, vec3(.84,.87,.86), .35 * fjS(.5, 0., y - hz));
  fjL(c, fjP(m, 0, uDrone * (1.1 - .2 * k)), e + .004, -d);
 }
 float wood = hz + .03 + .1 * fjN(x * .9) + .09 * fjN(x * 11.) - y - .4 * max(FJ_SEA, FJ_DES), dn = hz - .04 - y;
 vec3 wc = fjY(vec3(.2,.37,.3), vec3(.62,.36,.18), vec3(.6)) + .12 * dab;
 fjL(c, fjP(wc, 1, .4 * uPad), e + .006, -wood);
 float shine = fjN2(vec2(x * 1.1, dn * 26.)) - .5;
 vec3 lake = mix(vec3(.76,.84,.84), vec3(.26,.52,.64), sat(dn * 1.5 + .5 * shine));
 lake = mix(mix(lake, wc * 1.1, .75 * fjS(.2, 0., dn - .06)), vec3(.9,.93,.92), max(.55 * fjS(.26, .4, shine), .8 * fjWin));
 lake = mix(lake, mix(vec3(.95,.8,.58), vec3(.86,.6,.38), sat(dn + .5 * shine)), FJ_DES);
 lake *= 1. - FJ_NT * vec3(.75,.62,.36);
 lake += FJ_NT * vec3(.7,.66,.5) * fjS(.12, .3, shine) * fjS(1.1, 0., abs(x - 11. * floor(x / 11.) - 5.5) - .2 * dn);
 fjL(c, fjP(lake, 1, uPad), e + .003, -dn);
 float shore = 1.1 + .3 * fjN(x * .33) - y - 1.6 * FJ_SEA + .25 * FJ_DES, g = sat(shore * 1.3 + dab);
 vec3 grass = fjY(mix(vec3(.72,.75,.36), vec3(.35,.53,.25), g), mix(vec3(.86,.7,.34), vec3(.6,.4,.22), g), vec3(.95) - .12 * g);
 grass = mix(grass, mix(vec3(.97,.82,.56), vec3(.8,.55,.34), g), FJ_DES) * (1. - FJ_NT * vec3(.75,.66,.45));
 fjL(c, fjP(grass, FJ_PAP > .5 ? 4 : 1, .2 * uPad), e + .01, -shore);
 // birches, each lifted by a band
 float n2 = fjN2(q * 19.);
 for (float k = 0.; k < 2.; k++) {
  float l = 1. + .7 * k, id = floor(x / l + .37 * k), h1 = fjH(id + 71. * k), keep = fjS(-.1, .1, .72 - .3 * FJ_SEA - .25 * FJ_DES + .4 * fjM - fjH(id + 13. + 71. * k));
  float tall = (1. + .6 * h1 + .65 * k + .9 * uBands[int(mod(id * 5. + k * 3., 16.))] * (.5 + uEnergy)) * (.2 + .8 * keep);
  vec2 v = vec2(x - (id - .37 * k + .5 + .22 * (h1 - .5)) * l, y - .9 + .4 * k);
  v.x += .06 * sin(v.y * 1.7 + h1 * 9.) * v.y * (1. - FJ_SEA);
  float n = fjN2(q * 7. + 9. * k), wide = (.03 + .02 * k) * (1. - .6 * sat(v.y / tall));
  float cr = length(vec2(v.x / (.22 + .14 * k), v.y / tall * 2.4 - 1.6)) - .55 - .8 * (n - .35) - .3 * (n2 - .5);
  if (uOwn[6] > 0.) {  // palms
   vec2 b = vec2(v.x, v.y - tall * .9); float R = length(b); b.y += 1.1 * R * R;
   cr = mix(cr, R - (.16 + .4 * pow(abs(cos(atan(b.x, b.y + 1e-4) * 3.5)), 2.)) * (.7 + .5 * k) - .1 * (n2 - .5), FJ_DES);
  }
  vec3 sail = mix(vec3(.97,.93,.84), vec3(.75,.36,.22), step(.62, fjH(id + 3.)));
  if (uOwn[6] < 0.) {  // sails, and a hull
   vec2 b = vec2(v.x, v.y - .04 * sin(uTime * .5 + id * 2.)) / (.55 + .4 * k); float T = 1.1 + .25 * tall;
   float main = max(max(-b.x - .02, b.x - .62 * (1. - b.y / T)), .2 - b.y), jib = max(max(b.x + .06, -b.x - .42 * (1. - b.y / T * 1.15)), .24 - b.y);
   cr = mix(cr, .6 * min(main, jib), FJ_SEA);
   c = mix(c, fjP(mix(vec3(.3,.24,.22), vec3(.9,.88,.82), step(.11, b.y)), 3, uPhrase), keep * FJ_SEA * fjI(e, max(abs(b.x - .04) - .5 - .5 * b.y, max(b.y - .15, -b.y))));
   c = mix(c, fjP(sail * .7, 1, 0.), .35 * keep * FJ_SEA * fjI(.02, max(abs(b.x - .05 - .05 * sin(b.y * 40.)) - .3, max(b.y, -b.y - .45))));
   sail *= .84 + .3 * sat(b.x * 1.5 + .4);
  }
  vec3 leaf = mix(vec3(.28,.46,.18), vec3(.76,.8,.36), fjS(.3, .75, n2 * .6 + .4 * n + 1.3 * v.x));
  leaf = fjY(leaf, mix(vec3(.75,.42,.1), vec3(.98,.8,.26), n2), vec3(.92,.95,.97) - .2 * n2);
  leaf = mix(leaf, sail, FJ_SEA) * (1. - FJ_NT * vec3(.6,.5,.25));
  c = mix(c, fjP(leaf, FJ_PAP > .5 ? 2 : 1, .5 * uPad), keep * fjI(e * 1.5 + .02 * (1. - FJ_SEA), cr + .9 * fjWin * n2 * (1. - FJ_SEA)));
  c = mix(c, fjP(mix(vec3(1,.98,.93), vec3(.2), fjS(.55, .75, fjN(id * 7. + v.y * 13. + 12. * abs(v.x))) * (1. - FJ_SEA)) * mix(vec3(1), vec3(.55,.4,.28), FJ_DES) * (1. - .55 * FJ_NT) * (.9 - .12 * v.x / wide), 1, 0.), keep * fjI(e, max(abs(v.x) - wide, max(v.y - mix(tall * .92, (.55 + .4 * k) * (1.13 + .25 * tall), FJ_SEA), -v.y))) * (1. - fjS(.35, .6, n) * fjI(.05, cr) * .85));
 }
 // folds, hems, a stitched seam
 float s = fjR(x + 1.7, 14.), hem = min(q.y, 4.2 - q.y);
 c *= (1. + .05 * dab) * (.965 + .05 * fjN(x * 1.7 + .3 * sin(y)));
 c = mix(c, vec3(.36,.3,.26), fjI(e, max(abs(s - .045) - .01, abs(fract(y * 7.) - .5) / 7. - .045)) * sat(.02 / e));
 c *= 1. - .25 * fjS(.2, 0., s);
 fjL(c, vec3(.9,.86,.77), e, hem - .11);
 return mix(c, vec3(.45,.36,.22), fjI(e, length(vec2(fjR(x, .5), hem - .055)) - .022));
}
// Huts and fences.
vec4 fjHuts(vec2 q, float e) {
 vec4 o = vec4(0);
 // pickets
 float n = floor(q.x / .17), x = q.x - (n + .5) * .17, id = floor(q.x / 2.3), pick = max(abs(x) - .052, q.y - .38 - .06 * sin(n * .35) + abs(x) * 1.2);
 vec3 c = mix(vec3(.97,.94,.86), vec3(.4,.58,.5), step(.6, fjH(id))) * (1. - .2 * step(0., pick) - .22 * fjS(0., .05, x) * step(pick, 0.));
 fjU(o, fjP(c, 3, uPhrase), fjI(e, max(min(pick, min(abs(q.y - .12), abs(q.y - .31)) - .028), -q.y)) * fjS(.28, .34, fjN(q.x * .28 + 4.) + .3 * fjM));
 // a hut, or hay
 float h1 = fjH(id + 3.), h2 = fjH(id + 40.), h3 = fjH(id + 90.), keep = fjS(h2 - .12, h2 + .12, .7 + .5 * fjM), w = .4 + .22 * h1, wall = .62 + .25 * h3, top = wall + .42 + .12 * h1;
 vec2 v = rot(.012 * uPhrase * sin(uTime * 1.3 + id * 2.)) * vec2(q.x - (id + .5 + .2 * (h3 - .5)) * 2.3, q.y + (1. - keep) * 1.6);
 float under = top - abs(v.x) * (top - wall) * (1. - .97 * FJ_DES) / (w + .09) - v.y - .25 * FJ_DES, body = max(max(abs(v.x) - w, -under * .8), -v.y);
 float roof = min(max(max(abs(v.x) - w - .09, -under * .8), under - .14), fjBox(v - vec2(w * .5, top - .12), vec2(.07,.2), 0.));
 float all = min(body, roof), s = sign(h2 - .4);
 c = h1 < .3 ? vec3(.74,.24,.16) : h1 < .55 ? vec3(.93,.74,.36) : h1 < .8 ? vec3(.42,.6,.68) : vec3(.95,.91,.8);
 c *= .96 - .16 * fjI(.012, fjR(v.x, .11) - .008) - .3 * fjS(.26, .12, under);
 c = mix(c, vec3(.88,.68,.46), .8 * FJ_DES);
 c = mix(c, vec3(.97,.95,.9), FJ_SEA * fjI(e, fjR(v.x, .2) - .05));
 vec2 g = vec2(abs(v.x - .11 * s), v.y - wall * .55) * vec2(1,.8);
 float win = max(g.x, abs(g.y)) - .115;
 fjL(c, vec3(.97,.94,.86), e, win - .035);
 fjL(c, mix(vec3(.2,.28,.35), vec3(1,.8,.45), max(.8 * uPhrase, FJ_NT)), e, max(win, .012 - min(g.x, abs(g.y))));
 fjL(c, mix(mix(vec3(.55,.28,.2), vec3(.8,.58,.38), FJ_DES), vec3(1), fjWin), e, roof);
 if (h3 > .76) { all = length(v / vec2(.62,.95)) * .6 - .57 - .03 * fjN(v.x * 11. + v.y * 7.); c = mix(vec3(.95,.8,.4), vec3(.6,.44,.2), sat(v.x + fjN(v.x * 30.))); }
 c = mix(fjP(c, 3, .8 * uPhrase), vec3(.95,.82,.6), fjS(-.03, -.018, all) * step(0., v.x));   // its sawn edge
 fjU(o, c, fjI(e, max(all, -q.y)) * fjS(0., .1, keep));
 float b = fjR(q.x, .46);
 c = mix(vec3(.3,.26,.22), vec3(.78,.62,.43), fjI(e, b - .19));
 fjU(o, c * (1. - .45 * fjS(-.12, 0., q.y)), fjI(e, max(q.y, -q.y - .3)));
 return vec4(o.rgb / max(o.a, .001), o.a);
}
// Bushes, and their slats.
vec4 fjBush(vec2 q, float row, float e) {
 float d = 9., lit = 0., tone = 0., all = 1e-20, u = q.x + row * .31, n = fjN2(q * 11. + row * 9.), n2 = fjN2(q * 27.);
 for (float k = -1.; k < 2.; k++) {
  float id = floor(u / .64) + k, h1 = fjH(id + 17. * row), h2 = fjH(id + 29. + 17. * row);
  float r = (.23 + .18 * h1) * (1. + .65 * max(fjM, 0.)) * (.1 + .9 * fjS(h2 - .15, h2 + .15, .84 + .75 * fjM));
  vec2 v = vec2(u - (id + .35 + .3 * h1) * .64 - .1 * q.y * sin(uTime * .9 + id * 1.7) * (.4 * step(abs(mod(id, 5.) - 2.), .5) + uTexture), q.y - r * .75);
  float l = length(v) - r;
  if (uOwn[6] > 0.) l = mix(l, min(fjBox(v - vec2(0, .1), vec2(.085, r * 1.5 + .1), .085), min(fjBox(v - vec2(.12, .1), vec2(.15,.05), .05), fjBox(vec2(abs(v.x) - .2, v.y - .2 - .1 * h1 * sign(v.x)), vec2(.05,.15), .05))), FJ_DES);
  float w = exp(-18. * l);
  d = min(d, l); all += w; lit += w * dot(v, vec2(-.45,.9)) / r; tone += w * h2;
 }
 lit /= all; tone /= all; d += (.14 * (.5 - n) + .08 * (.5 - n2)) * (1. - .85 * FJ_DES);
 float wv = 0.;
 if (uOwn[6] < 0.) { float f = fract(u * 1.5 + .05 * sin(uTime * .7 + row)) - .5, y = q.y - .03 * sin(uTime * .8 + u * 2. + row * 2.) * (.4 + uTexture); wv = y - .2 - .1 * fjM - .3 * (.5 - abs(f)) * (.5 - abs(f)) * 2. - .08 * fjN(u); d = mix(d, wv * .8, FJ_SEA); }
 float a = fjI(e + .006, d) * fjS(-.05, -.01, q.y), g = sat(.42 + .42 * lit + .6 * (n - .5) + .6 * (n2 - .5));
 vec3 dark = fjY(vec3(.1,.23,.14), vec3(.3,.1,.08), vec3(.38,.44,.5)), mid = fjY(mix(vec3(.3,.48,.2), vec3(.34,.54,.38), tone), mix(vec3(.74,.28,.12), vec3(.78,.52,.16), tone), vec3(.84,.88,.92)), high = fjY(vec3(.72,.8,.42), vec3(.98,.74,.3), vec3(1));
 vec3 b0 = mix(mix(dark, mid, fjS(.1, .5, g)), high, fjS(.5, .9, g));
 if (uOwn[6] < 0.) b0 = mix(b0, mix(mix(vec3(.2,.42,.6), vec3(.55,.76,.82), .5 + .5 * sin(wv * 46. + fjN(u * 3.))), vec3(.97), fjS(-.07, -.05, wv)), FJ_SEA);
 if (uOwn[6] > 0.) b0 = mix(b0, mix(vec3(.16,.3,.22), vec3(.62,.72,.46), sat(.5 + .45 * lit + .25 * sin(u * 90.))), .8 * FJ_DES * (1. - fjAut));
 vec3 c = fjP(b0, 2, .7 * uTexture);
 vec2 b = q * 11. + row * 3.3, i = floor(b);
 c = mix(c, mix(vec3(1,.95,.88), fjDye(2), .6) * (.7 + .4 * g), fjS(-.1, .1, .07 + .4 * uTexture - fjH2(i + 21.)) * fjI(11. * e + .06, length(b - i - .3 - .4 * fjH2(i)) - .26) * step(d, -.02));
 return vec4(c, a);
}
vec4 fjSlats(vec2 q, float e) {
 float s = fjR(q.x, .21);
 vec3 c = vec3(.17,.14,.12);
 fjL(c, vec3(.82,.66,.46) * (.78 + .3 * fjH(floor(q.x / .21 + .5))), e, s - .088);
 return vec4(c * (1. - .5 * fjS(-.14, .02, q.y)), fjI(e, max(q.y, -q.y - .42)));
}
vec3 fjGravel(vec2 q, float e) {
 float bed = fjN2(q * vec2(.9,3)), sand = fjS(.4, .62, bed + .2 * fjN(q.x * 3.) - .1);
 vec3 c = mix(vec3(.66,.59,.5), vec3(.94,.83,.61), sand) * (.86 + .28 * fjN2(q * 38.));
 for (float k = 0.; k < 3.; k++) {
  float f = 13. - 4.5 * k;
  vec2 g = rot(.6 + k) * q * f, id = floor(g), h = vec2(fjH2(id + 31. * k), fjH2(id + 5. + 31. * k)), v = g - id - .5 - .3 * (h - .5);
  float big = .16 + .2 * h.x, on = step(.22 + .5 * sand + .06 * k, h.y);
  c *= 1. - .35 * on * fjS(.1, -.05, length(v - .06) - big);
  c = mix(c, mix(vec3(.58), mix(vec3(.8,.64,.5), vec3(.88,.86,.82), h.x), h.y) * (.95 - dot(v, vec2(.55,.7))), on * fjI(e * f + .03, length(v * vec2(1, 1. + .5 * h.y)) - big));
 }
 if (uOwn[6] > 0.) c = mix(c, vec3(.95,.76,.5) * (.86 + .2 * fjN(q.y * 16. + 2. * fjN(q.x * 2.))), .85 * FJ_DES);
 if (uOwn[6] < 0.) c = mix(c, mix(vec3(.22,.45,.58), vec3(.82,.92,.9), fjS(.5, .8, fjN2(q * vec2(3,9)))), FJ_SEA);
 c = mix(c, uKind[4] * (.55 + .5 * dot(c, vec3(.33))), .85 * FJ_PAP);
 return mix(c, vec3(.95), fjWin * .65 * bed);
}
// The hall; dark is the belts' shade.
vec3 fjHall(float dark) {
 vec2 s = vec2(1,-1), r = (8.6 - fjO.y + .36 * s * (fjO.z - 5.)) / max(fjD.y - .36 * s * fjD.z, 1e-4);
 float tf = (-.9 - fjO.y) / min(fjD.y, -1e-4), tr = min(r.x, r.y), t = min(min(tf, tr), min((15.5 - fjO.z) / max(fjD.z, 1e-4), (fjD.x < 0. ? -34. - fjO.x : 34. - fjO.x) / fjD.x)), e = fjPx * t;
 vec3 h = fjO + fjD * t, c, iron = mix(vec3(.78,.83,.86), vec3(.66,.5,.44), fjEve);
 c = mix(vec3(.97,.98,.97), vec3(.62,.81,.95), fjS(.3, .75, fjN2(h.xz * .23 + vec2(uTime * .01, 0))));
 c = fjT(c, vec3(.86,.88,.9), vec3(1,.58,.35) + .4 * c);
 vec2 u = t == tr ? h.xz : h.zy + vec2(h.x, 0);
 if (uOwn[7] < 0.) { vec2 s0 = floor(u * 3.); c = mix(c, mix(vec3(.05,.08,.18), vec3(.2,.26,.42), fjS(.3, .9, fjN2(h.xz * .15))) + step(.86, fjH2(s0)) * fjI(3. * e, length(u * 3. - s0 - .5) - .1) * .8, FJ_NT); iron *= 1. - .8 * FJ_NT; }
 c = mix(c, mix(vec3(.95,.93,.88), uKind[1], .3), .8 * FJ_PAP);
 c = mix(c, iron, max(fjI(e, min(fjR(u.x, .9), fjR(u.y, 1.4)) - .035) * sat(.06 / e) * .8, fjI(e, fjR(u.x, 5.4) - .15)));
 for (float k = 0.; k < 2.; k++) {
  float tt = (5.4 - 5.4 * k - fjO.x) / fjD.x;
  vec3 q = fjO + fjD * tt; float a = abs(q.z - 5.), m = 8.45 - .36 * a - q.y;
  m = max(min(min(abs(m), abs(q.y - 5.3)) - .07, fjR(a + q.y * .5, 2.4) - .035), max(-.09 - m, 5.23 - q.y));
  c = mix(c, iron * .86, fjI(fjPx * tt, m) * step(0., tt) * step(tt, t));
 }
 if (t == tf) c = vec3(.82,.69,.54) * (.85 + .2 * fjH(floor(h.z / .22))) * (1. - .3 * fjI(e, fjR(h.z, .22) - .008) * sat(.02 / e)) * (fjDim + fjSun * fjB(h) * (1. - dark)) * (1. - .45 * dark);
 if (uOwn[7] < 0. && t == tf) c += FJ_NT * vec3(.5,.3,.12) * dark * dark * .6;
 return mix(c, fjAir, 1. - exp(-(.016 + .06 * fjFog + .01 * uSpace) * max(t - 4., 0.)));
}
vec2 fjLoop(vec3 b) {
 float ta = max((b.x - b.y - fjO.z) / fjD.z, (b.z - fjO.x) / fjD.x), tb = (b.x + b.y - fjO.z) / fjD.z;
 vec2 o = ta < tb ? vec2(ta, tb) : vec2(1e4, -1e4), q = fjO.xz - b.zx;
 float A = dot(fjD.xz, fjD.xz), B = dot(q, fjD.xz), D = B * B - A * (dot(q, q) - b.y * b.y), s = sqrt(max(D, 0.));
 return D > 0. ? vec2(min(o.x, (-B - s) / A), max(o.y, (-B + s) / A)) : o;
}
// A place on a belt: along, up, a pixel; fjG is its light.
vec3 fjG;
vec3 fjAt(float t, vec3 b, float run, bool back) {
 vec3 h = fjO + fjD * t; vec2 d = h.xz - b.zx;
 float a = d.x > 0. ? atan(d.x, -d.y) : d.y < 0. ? 0. : PI, turn = back ? .7 : .7 + .38 * cos(a - .9);
 fjG = (fjDim + fjSun * fjB(h) * turn) * (.5 + .5 * min(turn, 1.));
 fjG += FJ_NT * vec3(1.1,.76,.42) * (exp(-.5 * max(h.y, 0.)) + .2) * (.7 + .4 * uLevel) * (back ? .3 : .5 + .5 * turn);
 return vec3((d.x > 0. ? b.y * a : d.y < 0. ? d.x : PI * b.y - d.x) + run, h.y, fjPx * t * (1. + .4 * uVar));
}
// Its wheel and deck.
void fjDrum(inout vec4 o, vec3 b, vec2 t2, float run) {
 float t = (.24 - fjO.y) / min(fjD.y, -1e-3), e = fjPx * t * 1.6;
 vec3 w = fjO + fjD * t; vec2 g = rot(-run / b.y) * (w.xz - b.zx);
 float R = length(g), r = b.y;
 vec3 c = mix(vec3(.17), vec3(.4,.6,.5), fjI(e, min(abs(R - r * .86) - .07 * r, max(min(min(abs(g.x), abs(g.y)), abs(g.x + g.y) * .7) - .03, R - r * .86))));
 c = mix(c, vec3(.66,.54,.4) * (.7 + .3 * step(.06, fjR(w.x, .5))), fjS(.02, -.02, w.x - b.z + r));
 fjU(o, c * fjAir, step(t2.x, t) * step(t, t2.y) * step(fjD.y, 0.));
}
// The carriage from outside.
void fjCoach(inout vec4 o, float tip) {
 float t = -fjO.z / min(fjD.z, -1e-4), e = fjPx * t * 1.2;
 vec3 h = fjO + fjD * t;
 float y = h.y - .3 * tip, pw = .95 - fjR(h.x + .4, 1.9), pane = fjBox(vec2(pw, y - 1.9), vec2(.68,.55), .1);
 vec3 c = mix(vec3(.5,.12,.11), vec3(.95,.9,.76), fjS(-e, e, y - 1.25)), g = mix(vec3(.42,.54,.6), vec3(1,.82,.5), sat(.25 - .4 * (y - 1.9) + .5 * uKeys + .5 * uMic));
 fjL(c, vec3(.88,.68,.33), e, min(min(abs(y - 1.25) - .03, abs(y - 2.72) - .02), abs(pane - .07) - .025));
 c = mix(c, g, fjI(e, pane)) * (1. - .4 * fjS(2.6, 2.95, y));
 fjU(o, c * (fjDim + .8 * fjSun * fjB(h)), fjI(e, abs(y - 1.55) - 1.45));
 fjU(o, vec3(.2), fjI(e, min(length(vec2(fjR(h.x + 1.2, 5.), h.y + .38)) - .48, abs(h.y + .02) - .12)));
}
vec3 fjSet(float tip) {
 bool b = uVar > .5;
 vec4 o = vec4(0), s;
 vec3 q, c, b0 = vec3(3.3,.5,5.2), b1 = vec3(5.7,.85,4.3), b2 = vec3(10.2,1.7,5.4);
 if (!b) b0 = b1 = b2 = vec3(99,1,1e3);
 // a hit: one telegraph pole goes by, once
 vec2 w = normalize(fjD.xz), k = (b ? vec2(mix(-5., 7.5, uHits), 2.4) : vec2(mix(-1.4, 1. - .55 * FJ_SEA, uHits), .7)) - fjO.xz;
 float x = w.x * k.y - w.y * k.x, t = dot(k, w) / length(fjD.xz), y = fjO.y + fjD.y * t - 2.6 * uVar * max(uOwn[4], 0.);
 fjU(o, mix(vec3(.4,.28,.2), fjDye(4) * .6, .4) * (1.1 + 4. * x * step(abs(x), .09)), fjI(fjPx * t + .02 * uHits, max(min(max(abs(x) - .09, y - 1.95), max(abs(x) - .45, abs(abs(y - 1.64) - .15) - .03 - .04 * fjS(.04, .02, fjR(x - .1, .2)))), -.9 - 2.6 * max(uOwn[4], 0.) - y)) * sat(uHits * 6.) * step(0., t));
 // gravel
 t = (.55 - fjO.y) / min(fjD.y, -1e-3);
 float a = 0., e, on = step(fjD.y, 0.);
 vec3 h = fjO + fjD * t;
 if (b && h.x > 4.6) {
  vec2 m = fjO.xy - vec2(4.6,.1);
  float M = dot(fjD.xy, fjD.xy), B = dot(m, fjD.xy), D = B * B - M * (dot(m, m) - .2025);
  t = (-B - sqrt(max(D, 0.))) / M; on = step(0., D); h = fjO + fjD * t;
  a = atan(max(h.x - 4.6, 0.), h.y - .1);
 }
 e = fjPx * t * 1.4;
 c = fjGravel(vec2(min(h.x, 4.6 + .45 * a) + fjRun.w, h.z), e);
 c = b ? mix(c, vec3(.36,.32,.29), fjI(e, .56 - abs(h.z - 1.55))) : mix(c, vec3(.82,.6,.38) * (1. - .4 * fjI(e, fjR(h.x - .4, 1.6) - .012)), fjI(e, .52 - abs(h.z - 1.54)));
 c *= fjDim + fjSun * fjB(h) * cos(a * .8);
 fjU(o, c * (.45 + .55 * cos(a * .7)), on * step(.5, t) * fjI(e, abs(h.z - 1.55) - .63));
 if (b && fjD.z < 0.) fjCoach(o, tip);
 vec2 t1 = (vec2(2.75,3.2) - fjO.z) / fjD.z, t2 = vec2(4.6 - fjO.z) / fjD.z, t3 = t2 + 6.4 / fjD.z;
 if (b) { t1 = fjLoop(b0); t2 = fjLoop(b1); t3 = fjLoop(b2); }
 vec3 ok = step(0., fjD.z) * step(vec3(t1.x, t2.x, t3.x), vec3(t1.y, t2.y, t3.y));
 for (int i = 0; i < 2; i++) {
  if (i > 0) {
   s = fjSlats(q.xy - vec2(0,.4), q.z);
   fjU(o, s.rgb * fjG, s.a * ok.x);
   if (b) fjDrum(o, b0, t1, fjRun.z);
  }
  q = fjAt(i == 0 ? t1.x : t1.y, b0, fjRun.z, false);
  s = fjBush(vec2(q.x, (q.y - .36) / (b ? 1.1 : .7 + .16 * float(i))), float(i), q.z);
  fjU(o, s.rgb * fjG, s.a * ok.x);
 }
 // huts, raw backs
 q = fjAt(t2.x, b1, fjRun.y, false); s = fjHuts(q.xy - vec2(0, b ? .3 : .4), q.z);
 fjU(o, mix(s.rgb * fjG, fjAir, .3 * fjFog), s.a * ok.y);
 if (b) {
  fjDrum(o, b1, t2, fjRun.y);
  q = fjAt(t2.y, b1, fjRun.y, true); a = fjR(q.x - 1.15, 2.3);
  fjU(o, vec3(.82,.67,.48) * (1. - .35 * fjI(q.z, fjR(q.x, .46) - .03)) * fjG, ok.y * fjI(q.z, max(min(q.y - .7, max(a - .5, q.y + .7 * a - 1.6)), -q.y)));
 }
 q = fjAt(t3.x, b2, fjRun.x, false);
 q.y += b ? .5 : .1; y = q.y - 4.2;
 fjU(o, vec3(.62,.45,.3) * (1. - .4 * fjI(q.z, fjR(q.x, .6) - .015)) * fjG, ok.z * fjI(q.z, abs(y - .17) - (b ? .13 : .06)));
 if (ok.z > 0. && o.a < .99) fjU(o, mix(fjCanvas(q.xy, q.z) * fjG, fjAir, fjFog * (1. - exp(-.07 * t3.x))), ok.z * fjI(q.z, max(y, -q.y)));
 vec2 g = fjO.xz + fjD.xz * (-.9 - fjO.y) / min(fjD.y, -1e-3);
 float d = min(min(length(g - vec2(min(g.x, 5.2), 3.3)) - .5, length(g - vec2(min(g.x, 4.3), 5.7)) - .85), min(length(g - vec2(min(g.x, 5.4), 10.2)) - 1.7, g.y - 2.2));
 fjU(o, fjHall(fjS(.7, -.4, d)), 1.);
 return o.rgb;
}
vec3 fjWood(vec2 q, float tone) { return mix(vec3(.4,.18,.09), vec3(.76,.45,.25), sat(tone + .6 * fjN2(q * vec2(1.3,24)) + .4 * fjN2(q * vec2(4,70)))); }
// The compartment.
vec3 fjRoom(vec3 c, vec3 ro, vec3 rd, float tip) {
 vec3 cool = fjDim * .75 + fjSun * .3, lit = (.42 + .5 * cool) * (1. - FJ_NT * vec3(.1,.34,.55)), h = ro + rd * (1.13 - ro.x) / max(rd.x, 1e-3), f;
 float t = -ro.z / rd.z, e = fjPx * t, es = fjPx * (1.13 - ro.x) / max(rd.x, 1e-3) * 1.6, tt = (.8 - ro.y) / min(rd.y, -1e-3);
 vec2 w = ro.xy + rd.xy * t, tq = (ro + rd * tt).xz;
 float win = fjBox(w - vec2(.05,1.42), FJ_WIN), seat = step(h.z, 0.), tb = rd.y < 0. ? fjBox(tq - vec2(.34,-.25), vec2(.42,.25), .05) : 9.;
 vec2 n = vec2(dFdx(win), dFdy(win)) / max(fwidth(win), 1e-5);
 f = fjWood(tb < 0. ? tq : seat > .5 ? h.zy : win < .1 ? w.yx : w, win < .1 ? .15 : 0.);
 f = mix(f, vec3(1,.96,.86) * (.82 + .2 * dot(f, vec3(.5))) * (1. - .35 * fjI(e, fjR(w.x, .19) - .006)), .85 * FJ_SEA * step(seat, .5));
 f = mix(f, uKind[0] * (.35 + .3 * f), .85 * FJ_PAP);
 vec3 wood = f, wall = f * lit * (1. - .4 * n.y * fjI(.08, win - .02));
 fjL(wall, mix(vec3(.5,.34,.12), vec3(1,.9,.6), sat(.6 - .5 * n.y + .4 * n.x)), e, abs(win - .02) - .013);
 fjL(c, wall, e, -win);
 // the buttoned seat
 float top = 1.5 + .07 * exp(7. * min(h.z, 0.)) - h.y, pad = fjS(.02, .18, top), near = exp(1.1 * min(h.z, 0.));
 vec2 g = h.zy / vec2(.26,.24), a = vec2(g.x + g.y, g.x - g.y) * .5, sn = sin(PI * a), gr = cos(PI * a) * sign(sn) * abs(sn.yx);
 float li = mix(.95 - .5 * fjS(0., .18, top), dot(normalize(vec3(1, gr.x - gr.y, gr.x + gr.y)), vec3(.5,.35,-.62)) * .9 + .25, pad);
 f = mix(vec3(.3,.07,.08), vec3(.9,.36,.3), sat(li)) * (.35 + .55 * near) * mix(1., .6 + .4 * fjS(0., .25, abs(sn.x * sn.y)), pad);
 f = mix(f, vec3(.75,.28,.22) * near, pad * fjI(es, length((fract(a + .5) - .5) * .34) - .03)) * lit;
 c = mix(c, mix(wood * lit * near, f, fjI(es, -top)), seat);
 float m = fjS(-.6, .1, tq.y);
 f = mix(wood * lit, fjAir, .1 + .4 * m * m) * (1. - .4 * fjS(.06, .02, abs(tq.x - .46 + .3 * (tq.y + .15))) * step(tq.y, -.15));
 e = fjPx * tt * 1.5;
 fjL(c, mix(f, vec3(.97,.8,.48), .8 * fjI(e, abs(tb + .035) - .005)), e, tb);
 // the vase and its five flowers, one for each kind
 t = (-.15 - ro.z) / rd.z; e = fjPx * t;
 vec2 v = ro.xy + rd.xy * t - vec2(.46,.8);
 vec3 leaf = mix(vec3(.2,.36,.18), vec3(.58,.7,.34), sat(.4 + v.x * 6.)) * cool;
 fjL(c, leaf, e, length(rot(.6) * (vec2(abs(v.x), v.y) - vec2(.07,.24)) * vec2(1,2.6)) - .05);
 for (float k = 0.; k < 5.; k++) {
  float lv = k < 1. ? uDrone : k < 2. ? uPad : k < 3. ? uTexture : k < 4. ? uPhrase : uHits, R = .048 + .008 * sin(k * 3.) + .012 * lv;
  vec2 at = vec2(-.14 + .068 * k + .006 * sin(uTime * .6 + k) - .6 * tip, .37 + .08 * sin(k * 2.3 + .8)), b = v - at;
  float bend = fjS(.16, at.y, v.y), r = length(b), u = atan(b.y, b.x + 1e-5);
  fjL(c, leaf, e, max(abs(v.x - at.x * bend * bend) - .004, max(v.y - at.y, .16 - v.y)));
  f = mix(vec3(1,.95,.87), fjDye(int(k)), .3 + .5 * lv) * (.8 + .08 * sin(r / R * 11. - u + k) + .22 * dot(b, vec2(.5,.8)) / R);
  fjL(c, f * (cool + .1 + .25 * lv), e, r - R * (.94 + .06 * cos(u * 7. + k)));
 }
 float y = v.y / .2, R = .026 + .052 * sin(PI * sat(y * .9 + .12)) * (1.15 - .55 * sat(y)) + .016 * fjS(.85, 1., y), x = v.x / R;
 f = mix(vec3(.95,.97,.98), vec3(.3,.46,.68), fjS(.6, .72, .5 + .3 * sin(x * 4. + 1.) * sin(y * 11.))) * (.62 + .5 * sqrt(sat(1. - abs(x)))) * lit;
 f += .5 * fjS(.12, 0., abs(x + .45)) * sat(y * 3. - 1.) + vec3(1,.75,.4) * .5 * uKeys * (1.2 - y);
 c = mix(c, f, fjI(e, max(abs(v.x) - R, max(v.y - .2, -v.y)))) + vec3(1,.7,.35) * .35 * uKeys * exp(-12. * length(v - vec2(0,.1)));
 // the curtain
 t = (-.12 - ro.z) / rd.z; w = ro.xy + rd.xy * t; e = fjPx * t; y = w.y - 1.02;
 float pin = exp(-y * y * 14.), edge = -.7 - .33 * FJ_SEA - .2 * pin - .2 * fjS(0., -.5, y) + .06 * fjS(0., 1., y) + .012 * sin(y * 9. + .3 * sin(uTime * .4)), u = (w.x + 1.7) / (edge + 1.7), cd = w.x - edge;
 float fold = .5 + .5 * sin(u * (27. - 3. * pin) + .8 * sin(y * 2.) + .6 * sin(y * 4. + u * 9.));
 f = mix(vec3(.6,.46,.24), vec3(1,.9,.62), fold * fold) * (lit + .12 + .1 * uMic);
 f = mix(f, uKind[3] * (.5 + .6 * fold * fold), .85 * FJ_PAP);
 fjL(f, vec3(.75,.27,.2) * lit * (.75 + .3 * sin(w.y * 170.)), e, abs(cd + .035) - .012);
 c *= 1. - .3 * fjS(.12, 0., cd);
 fjL(c, f, e, cd);
 v = vec2(w.x + .87 + .33 * FJ_SEA + .35 * tip + (1.6 * tip + .006 * sin(uTime * .8)) * y, y);
 float cord = min(max(abs(y + .1 * (v.x + .2) * (v.x + .2)) - .022, v.x - .01), min(length(v + vec2(0,.1)) - .035, fjBox(v + vec2(0,.16), vec2(.022 + .05 * sat(-.12 - y), .16), 0.)));
 return mix(c, mix(vec3(.5,.13,.1), vec3(.95,.42,.28), .5 + .4 * sin(y < -.12 ? v.x * 300. : (v.x + y) * 120.)) * lit, fjI(e, cord));
}
vec3 render(vec2 p) {
 fjPx = .6 / uRes.y;
 fjFog = sat(-uOwn[0]); fjEve = sat(uOwn[0]); fjWin = sat(-uOwn[1]); fjAut = sat(uOwn[1]);
 fjTall = 1. + .8 * uOwn[2]; fjRaw = sat(-uOwn[3]); fjBold = sat(uOwn[3]); fjM = uOwn[5];
 fjRun = mod((uTravel * .06 + uTime * .004) * vec4(1,2,5,12), 4096.);
 fjSun = fjT(vec3(.46,.42,.33), vec3(.05), vec3(.6,.34,.16)) * (.85 + .25 * uLevel + .45 * uCue);
 fjDim = fjT(vec3(.66,.7,.76), vec3(.82,.85,.88), vec3(.56,.47,.5));
 fjSun *= 1. - FJ_NT * vec3(.9,.82,.66); fjDim *= 1. - FJ_NT * vec3(.78,.68,.5);
 fjAir = fjDim + .5 * fjSun;
 float v = uOwn[4], up = max(v, 0.), low = max(-v, 0.), tip = .12 * uCue * (1. - uCue) * (.5 + uEnergy);
 vec3 ro = vec3(-.12 + .015 * sin(uTime * .11), 1.56 + .1 * up, -1.6 - .8 * low + .7 * up), rd = vec3(p.x + .1, p.y - .12, 1.02 - .25 * up);
 fjO = ro; fjD = rd; fjD.xy = rot(tip) * fjD.xy;
 if (uVar > .5) {
  fjO = vec3(9.8, 2.6 + 1.9 * up - 1.7 * low, 1.5 + .1 * sin(uTime * .05));
  fjD = vec3(min(p.x * .5 - .755, -.02), p.y - .07 - .22 * up + .06 * low, .442 + p.x * .87);
 }
 fjD += 2e-4 * step(abs(fjD), vec3(1e-4));
 vec3 c = vec3(0);
 if (uVar > .5 || fjBox(ro.xy - rd.xy * ro.z / rd.z - vec2(.05,1.42), FJ_WIN) < .02) c = fjSet(tip * 5.);
 return uVar < .5 ? fjRoom(c, ro, rd, tip) : c;
}
