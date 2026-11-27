// name: Facets
// a: Tabletop
// b: Window and stair
// what: A still life taken apart on a tipped table: a guitar, a green bottle, a glass and a bowl of three fruits, each seen from several sides at once in ochre, grey and green planes that are full at one edge and fade to nothing, under broken pencil lines; or an open window and a stair, seen from the side, from above and from in front.
// follows: Drone, pad, texture and phrase each slide their own family of planes and glaze them with their colour; the piece tints scattered dabs where its sounds lie; the spectrum stipples the lit facets; a hit opens one pale plane; a cue slides the shading off its edges while a light crosses. Keys light the guitar strings, a voice the window or the bottle.
// own: 0 1 it stands again and again, mirrored and smaller, -1 the eye is close; 1 1 shattered by many more cuts, -1 whole, nothing cut or slid; 2 1 every edge bent in waves, -1 cut in rings, each turned on its own; 3 the ground: 1 bare pale paper, -1 dark; 4 1 leaded glass with a light behind, -1 flat cut paper; 5 1 each plane in the full colour of its kind, -1 the drawing alone with hardly any paint; 6 the paint: 1 small square stones, -1 round dots; 7 the light: 1 one lamp in the dark, -1 the panes of a window lie over it
bool fcA;                   // the tabletop, or the stair
vec3 fcC, fcN, fcM;         // the paint so far; slow noises that break the pencil, fcM never quite
vec2 fcP, fcD, fcQ;         // the place of the pixel, from it to the middle of its dab of paint, and its place after the cuts
float fcInk, fcIp, fcSl;    // the pencil so far, pixels to one height, how far a cue has slid the shading
float fcR, fcRel, fcT;      // the dab's own number, its relief, the light its facet stands in
vec2 fcCell;                // the place in the dab
float fcShD, fcShL;         // dark and light along the cuts
float fcMv[5], fcGr[5];     // for each kind of sound: how far its planes have slid, how steep their shading
vec3 fcK[5];                // and its colour as a glaze
const vec3 fcB = vec3(.105,.085,.07), fcW = vec3(.93,.885,.78), fcO = vec3(.7,.51,.27), fcU = vec3(.3,.22,.145), fcV = vec3(.75,.7,.6); // dark, pale, ochre, umber, stone
float fcOp = 1., fcKeep = 1., fcBold = 1., fcFlat = 0.; // how much paint, how much of the cuts and planes, how broad the lines, how flat
float fcUp(float x) { return max(x, 0.); }
void fcMix(vec3 c, float a) { fcC = mix(fcC, c, a * fcOp); }
float fcS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float fcFall(float d, float k) { d = max(d, 0.) * k; return 1. / (1. + d * (1. + .6 * d)); }
float fcBump(float x, float k) { return fcFall(x * x, k); }
float fcIn(float d) { return sat(.5 - .7 * d * fcIp); }
float fcOut(float d) { return sat(.5 + .7 * d * fcIp); }
float fcLum(vec3 c) { return dot(c, vec3(.3,.59,.11)); }
float fcLine(float d, float w) { return sat((w - abs(d)) * fcIp + .4); }
void fcDraw(float d, float w, float a) { if (fcBold > 1.) a = sat(a * fcBold); fcInk = max(fcInk, a * fcLine(d, w * fcBold)); }
vec3 fcHue(vec3 c, int k) { return uOwn[5] > 0. ? mix(c, uKind[k] * (.3 + 1.15 * fcLum(c)), uOwn[5]) : c; }
// Short dabs of the brush in crooked rows, the second layer over the first.
void fcDab(vec2 p, mat2 m, float k) {
  float stone = fcUp(uOwn[6]), dot_ = fcUp(-uOwn[6]), some = max(stone, dot_);
  vec2 sz = vec2(.03,.0105) * (1. - .2 * k);
  if (some > 0.) sz = mix(sz, vec2(mix(.0215, .0165, dot_)), some);
  if (k > .5 && some > .5) return;
  vec2 g = m * p / sz + k * vec2(.37,3.5);
  g.y += sin(g.x * .33 + g.y * .21) * (1. - .6 * some);
  float row = floor(g.y);
  g.x += hash11(row + 3. * k) * 9.;
  vec2 f = fract(g) - .5;
  float h = hash21(vec2(floor(g.x), row) + 31. * k);
  if (k > .5 && (fract(h * 57.31) < .42 || abs(f.x) > .49 - .3 * h * f.y)) return;
  fcD = -(f * sz) * m;
  fcR = h;
  fcRel = 2. * f.y + .4 * f.x;
  fcCell = f;
}
// One plane: full of colour at its hard edge, nothing a depth away on its left; across the edge a little of the opposite.
void fcPlane(vec4 e, float depth, float slant, vec3 c, int k, float op) {
  vec2 ab = e.zw - e.xy; float il = inversesqrt(dot(ab, ab));
  vec2 t = ab * il, r = fcP - e.xy;
  float v = dot(r, vec2(-t.y, t.x)) - .3 * fcMv[k], vd = v + t.x * fcD.y - t.y * fcD.x, u = dot(r, t) - fcMv[k];
  float us = fcOut(u - slant * v) * sat(2.2 - 2.2 * il * (u + dot(fcD, t))) * op, g = sat(1. - abs(vd / depth - fcSl) * fcGr[k]);
  bool pale = c.y > .4;
  c = fcHue(c, k); op *= fcKeep; us *= fcKeep;
  if (fcFlat > 0.) g = mix(g, sat((1. - abs(vd / depth)) * 40.), fcFlat);
  fcMix(c * fcK[k], fcOut(v) * us * g * g * (.66 + .34 * fcR));
  g = sat(1. + vd / (.4 * depth));
  if (fcFlat > 0.) g *= mix(1., step(-.2 * depth, vd), fcFlat);
  fcMix(pale || fcFlat > .5 ? fcB : fcW, fcIn(v) * us * g * g * .28);
  fcDraw(v, .0014, op * .75 * (k % 3 == 0 ? fcN.x : fcN.y) * sat(u * 25. + 2.5) * sat(3.3 - 2.9 * u * il));
}
// A plane of the tabletop or of the stair.
void fcPlane(vec4 a, float da, float sa, vec3 ca, int ka, vec4 b, float db, float sb, vec3 cb) {
  fcPlane(fcA ? a : b, fcA ? da : db, fcA ? sa : sb, fcA ? ca : cb, ka, 1.);
}
// A thing with a contour: d its distance, s from -1 (shadow side) to 1 (lit side); o: how solid, how soft its relief, its pencil.
void fcThing(float d, float s, vec3 lit, vec3 shade, vec3 o, int k) {
  lit = fcHue(lit, k); shade = fcHue(shade, k);
  float turn = fcS(-.7,.75, s + .25 * (fcR - .5));
  if (fcFlat > 0.) turn = mix(turn, sat(s * 12. + .5), fcFlat);
  vec3 c = mix(shade, lit, turn) * fcK[k];
  float rim = fcFall(-d, 1. / o.y) * (1. - fcFlat);
  c = mix(mix(c, fcB, .75 * sat(.1 - s * 1.3) * rim), fcW, .5 * sat(s * 1.2) * rim);
  fcMix(c, fcIn(d) * o.x);
  fcMix(fcB, fcOut(d) * .55 * sat(s + .25) * fcFall(d, 1.1 / o.y) * o.x);
  fcDraw(d, .002, o.z);
}
void fcThing(float d, float s, vec3 l, vec3 h, vec3 o, int k, float D, float S, vec3 L, vec3 H, vec3 O) {
  fcThing(fcA ? d : D, fcA ? s : S, fcA ? l : L, fcA ? h : H, fcA ? o : O, k);
}
float fcBox(vec2 p, vec2 b) { vec2 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, q.y), 0.); }
float fcEll(vec2 p, vec2 r) { return (length(p / r) - 1.) * .5 * (r.x + min(r.x, r.y)); }
float fcBottle(vec2 p) {
  return max((abs(p.x) - mix(.098,.03, fcS(.1,.24, p.y)) - .008 * step(.387, p.y)) * .8, abs(p.y - .085) - .335);
}
float fcGuitar(vec2 g) { return smin(length(g + vec2(.125,0.)) - .172, length(g - vec2(.115,0.)) - .128, .05); }
// The same as a plane, along a curve: d its distance, w where along it the plane is.
void fcCurve(float d, float w, float depth, vec3 c) {
  float g = sat(1. - abs(d / depth - fcSl));
  fcMix(c, fcOut(d) * g * g * w * .85);
  fcDraw(d, .0015, .8 * w * fcN.x);
}
// A long line that cuts the picture: past it everything has slipped along and stands in another light.
void fcCut(vec4 a, vec3 la, vec4 b, vec3 lb, int k) {
  if (!fcA) { a = b; la = lb; }
  la.xy *= uOwn[1] > 0. ? 1. + vec2(1.9, .5) * uOwn[1] : vec2(fcKeep);
  vec2 n = a.xy, t = vec2(-n.y, n.x), r = fcP - a.zw;
  float v = dot(r, n), s = v > 0. ? 1. : -1., far = fcBump(dot(r, t) / la.z, 2.), b8 = fcBump(v, 10.), vd = v + dot(fcD, n) - fcSl * .05;
  fcQ += t * (la.x * (.75 + .5 * uSpace + 16. * fcMv[k])) * .5 * s * b8;
  fcT += la.y * s * far * b8;
  far *= fcKeep;
  fcDraw(v, .0012, .55 * far * (k > 1 ? fcN.x : fcN.y));
  fcShD = max(fcShD, far * fcFall(vd, 14.) * fcOut(v));
  fcShL = max(fcShL, far * fcFall(-vd, 24.) * fcIn(v));
}
// A leaf of the window turned on its hinge, three panes high: x its two sides, e their upper and lower ends.
float fcLeaf(vec2 q, vec2 x, vec4 e, out float pane, out vec3 glass) {
  float u = (q.x - x.x) / (x.y - x.x), wd = abs(x.y - x.x), bt = mix(e.z, e.w, u), hi = max(mix(e.x, e.y, u) - bt, .05), v = (q.y - bt) / hi, f = fract(v * 3.);
  float ud = u + fcD.x / (x.y - x.x), w = f * .5 + ud * .6 - .42, d = max(abs(u - .5) * wd - .5 * wd, abs(v - .5) * hi - .5 * hi);
  pane = max(max(abs(u - .5) * wd - .5 * wd + .026, abs(f - .5) * hi / 3. - hi / 6. + .01), d);
  glass = mix(vec3(.6,.68,.7) * (1. - .55 * sat(.9 * ud - .1 - 1.1 * fcT)), fcW, .75 * fcFall(w, 9.) * fcS(-.01,.01, w));
  return d;
}

void fcScene(vec2 p) {
  float A = fcA ? 1. : 0., on = 1. - A;
  fcCut(vec4(.989,.149,-.04,.1), vec3(.04,.3,.5), vec4(.998,.06,-.14,.05), vec3(.04,.3,.6), 0);
  fcCut(vec4(-.589,.808,.1,.02), vec3(.036,-.28,.5), vec4(-.612,.791,.1,.02), vec3(.034,-.26,.6), 1);
  fcCut(vec4(.498,.867,-.12,-.08), vec3(-.036,.26,.45), vec4(.814,.581,-.3,-.06), vec3(-.036,.26,.5), 3);
  fcCut(vec4(-.978,-.207,.3,0.), vec3(.04,.3,.45), vec4(-.997,-.078,.36,0.), vec3(.044,.28,.5), 2);
  fcCut(vec4(-.99,.141,-.3,0.), vec3(-.022,-.3,.4), vec4(-.982,.19,-.46,.1), vec3(-.03,-.26,.4), 1);
  fcCut(vec4(-.149,.989,.15,.17), vec3(.03,.25,.45), vec4(.091,.996,.2,.17), vec3(.034,.25,.5), 2);
  fcCut(vec4(.19,.982,0.,-.24), vec3(-.034,-.25,.5), vec4(-.178,.984,.1,-.22), vec3(-.034,-.25,.55), 0);
  if (uOwn[1] > 0.) for (int i = 0; i < 7; i++) {
    float f = float(i), a = f * 1.26 + .5, o = sin(f * 2.4 + 1.) * .42;
    vec4 n = vec4(cos(a), sin(a), o, .34 * cos(f * 3.7));
    fcCut(n, uOwn[1] * vec3(.03 * cos(f * 2.), .4 * cos(f * 2.), .4), n, uOwn[1] * vec3(.03 * cos(f * 2.), .4 * cos(f * 2.), .4), i % 4);
  }
  vec2 q = fcQ, pd = p + fcD;
  // the ground: bare and pale at the rim, worked and darker behind the things; on the stair cool above and warm below
  float mid = fcBump(length(pd * vec2(.95,1.2)), 2.6);
  vec3 green = vec3(.32,.38,.28), blue = vec3(.43,.49,.52), deep = vec3(.17,.2,.22);
  fcC = mix(fcA ? vec3(.74,.68,.56) : vec3(.66,.64,.58), fcA ? vec3(.36,.33,.27) : vec3(.36,.37,.37), mid);
  fcMix(fcA ? green * 1.15 : blue, .5 * fcS(fcA ? .1 : -.1,.5, pd.y) * mix(1., fcS(.3,-.5, pd.x), A));
  fcMix(fcA ? vec3(.55,.54,.5) : fcO, .48 * (fcA ? fcS(.1,.7, pd.x + pd.y * .5) : fcS(.05,-.5, pd.y)));
  if (uOwn[5] > 0.) fcC = mix(fcC, uKind[1] * (.3 + .9 * fcLum(fcC)), .7 * uOwn[5]);
  fcC *= 1. + .23 * fcT;
  if (uOwn[3] != 0.) fcC = mix(fcC, uOwn[3] > 0. ? vec3(.93,.895,.82) * (1. + .05 * fcT) : vec3(.045,.05,.065) * (1. + .6 * fcT), abs(uOwn[3]));
  // the table: its top tipped up, its two edges meeting at a corner
  vec2 tb = q + vec2(.02,.43);
  float top = -min(dot(tb, vec2(.387,.922)), dot(tb, vec2(-.287,.958)));
  fcMix(mix(fcO, fcU, sat(.3 - .8 * fcT + .2 * sin(pd.y * 60. + pd.x * 15.))) * fcK[0], A * fcIn(top) * fcFall(-top - fcD.y, 4.) * .85 * fcBump(pd.x, 1.6));
  fcMix(fcB, A * (1. - .7 * fcUp(uOwn[3])) * fcOut(top) * fcFall(top - fcD.y, 10.) * .8 * fcBump(pd.x, 2.5));
  fcDraw(top, .002, A * fcN.x); fcDraw(top - .04, .0014, A * .8 * fcN.y);
  fcMix(fcB, .5 * fcShD); fcMix(fcW, .25 * fcShL);
  fcPlane(vec4(-.56,-.2,-.42,.3),.22,-.3,fcU,1, vec4(.14,.48,.02,.02),.22,.2,deep);
  fcPlane(vec4(.62,.36,.46,-.1),.22,.3,green,2, vec4(.62,.46,.5,.04),.22,.2,blue);
  fcPlane(vec4(-.36,.36,.02,.26),.2,.4,fcV,3, vec4(-.16,.06,.26,.24),.2,.2,fcV);
  fcPlane(vec4(.05,.1,-.02,.47),.18,.2,fcB,0, vec4(-.64,-.02,-.66,-.36),.16,-.2,fcU);
  fcPlane(vec4(.34,.02,.56,.3),.16,0.,fcV,1, vec4(.2,.18,.44,.48),.2,0.,fcV);
  fcPlane(vec4(.2,.12,.36,.46),.16,0.,fcU,1,A);
  fcPlane(vec4(-.14,.14,-.34,.34),.16,.3,fcU,0,A);
  fcPlane(vec4(.28,.3,.52,.16),.14,.5,fcB,2,A);
  fcPlane(vec4(-.5,.5,-.72,.1),.26,.2,vec3(.5,.49,.45),2,A);
  fcPlane(vec4(-.8,-.36,-.52,-.5),.22,.2,fcU * 1.7,0,A);
  fcPlane(vec4(.44,-.5,.74,-.34),.18,.3,fcV,3,A);
  // the guitar, its neck running up behind the bottle; or the open window, the roofs outside and its two leaves
  vec2 g = mat2(.814,-.581,.581,.814) * (q - vec2(-.16,-.1)), o = q - vec2(-.42,.22), ro = o + .02;
  float neck = min(fcBox(g - vec2(.46,0.), vec2(.25,.022)), fcBox(g - vec2(.755,0.), vec2(.05,.036))), wd = fcBox(o, vec2(.185,.225)), wm = fcIn(wd) * on;
  fcThing(neck, sat(g.y * 30. + .5) * 2. - 1. + fcT, mix(fcU, fcO, .6), fcB, vec3(.9,.012,fcN.y), 1, wd - .028, fcT - o.x * 4., fcV, deep, vec3(.9,.03,fcN.y));
  fcDraw(fract(g.x * 22.) / 22. - .02, .001, A * .8 * step(neck, 0.));
  fcMix(fcHue(mix(vec3(.64,.71,.74), vec3(.95,.91,.82), fcS(.25,-.2, o.y + fcD.y + .2 * fcT)), 2) * (1. + .1 * fcT + .12 * uMic), wm);
  fcCurve(-max(dot(ro, vec2(.447,.894)), dot(ro, vec2(-.793,.61))), wm, .16, vec3(.6,.38,.25) * fcK[3]);
  fcCurve(-max(o.y + .06 - .5 * (o.x - .1), -o.x - .02), wm, .14, vec3(.38,.45,.38) * fcK[2]);
  fcMix(fcB, wm * .6 * fcFall(.225 - o.y - fcD.y, 30.));
  fcDraw(wd, .002, on * fcM.x);
  float pa, pb, gd = fcGuitar(g), g2 = fcGuitar((g - vec2(.03,-.05)) * .92);
  vec3 ga, gb;
  fcCurve(g2, A * fcS(.1,-.1, g.y) * fcS(.3,.1, g.x), .1, fcU * fcK[0]);
  float d1 = fcLeaf(q, vec2(-.6,-.76), vec4(.44,.49,0.,-.06), pa, ga), d2 = fcLeaf(q, vec2(-.235,-.015), vec4(.445,.495,-.005,-.1), pb, gb);
  if (d2 < .05) { d1 = d2; pa = pb; ga = gb; }
  fcThing(gd, dot(g, vec2(-2.1,3.4)) + 1.9 * fcT, vec3(.89,.74,.47), vec3(.36,.24,.14), vec3(.93 - .5 * fcS(0.,.16, .25 * g.x - g.y + .3 * fcT),.035,fcM.x), 0, d1, .3 + 1.2 * fcT, vec3(.82,.78,.68), fcV * .35, vec3(.92,.02,fcM.x));
  fcMix(ga, .9 * fcIn(pa) * on);
  fcDraw(pa, .0013, on * .7 * fcN.y); fcDraw(gd + .022, .0013, A * .8 * fcN.y); fcDraw(g2, .0015, A * .7 * fcN.z);
  fcPlane(vec4(-.4,-.24,-.16,.1),.14,.2,fcW,0, vec4(-.24,.08,.1,-.24),.13,.3,fcW);
  fcPlane(vec4(-.02,-.3,-.2,-.04),.14,-.3,fcU,0, vec4(-.66,-.025,-.16,-.055),.05,0.,fcW);
  fcPlane(vec4(-.3,-.04,-.06,.06),.1,-.4,fcO,0, vec4(.32,-.12,.62,.02),.13,.4,blue);
  // the hole, the bridge and the strings
  float hole = length(g - vec2(.035,0.)) - .05;
  fcMix(mix(fcB * .8, fcU, fcS(.03,-.06, g.y)), A * .94 * fcIn(hole) * fcS(-.045,-.03, g.x - .03 + .4 * g.y));
  fcDraw(hole - .01, .0014, A * .8 * fcN.x); fcDraw(hole, .0014, A * .8);
  fcMix(fcB, A * .85 * fcIn(fcBox(g + vec2(.165,0.), vec2(.008,.055))));
  float sy = g.y / .0095, str = fcLine((fract(sy + .5) - .5) * .0095, .0009) * step(abs(g.x - .27), .44) * step(abs(sy), 2.5);
  fcMix(hole < 0. || neck < 0. ? fcW : fcB, A * str * (.5 + .5 * uKeys));
  // the stair from in front, low at the right: bars of step on step
  vec2 fr = q - vec2(.48,-.5);
  float fd = max(abs(fr.x) - .33 + .42 * fr.y, fr.y - .33), fs = fract(fr.y / .066) * .066, fm = on * fcIn(fd);
  vec3 rc = mix(mix(fcV, fcU, .25), fcU * .6, sat(1. - (fs + fcD.y) * 22. + .8 * fcT + fr.x));
  fcMix(fcHue(mix(rc, fcW, fcOut(fs - .046) * .85), 3) * fcK[3], fm * .85 * fcS(.36,.05, fr.y));
  fcDraw(fs - .046, .0014, fcN.x * fm);
  // the stair from above, at the foot: steps turning round the post
  vec2 wc = q - vec2(-.17,-.4);
  float rr = length(wc), an = atan(wc.y, 1e-5 - wc.x), sa = fract(an / .29), md = max(rr - .4, .05 - rr), wedge = on * step(abs(an), 2.2) * step(wc.x, .02);
  float san = sat(sa + (fcD.x * wc.y - fcD.y * wc.x) / max(rr * rr * .29, .004));
  fcMix(fcHue(mix(vec3(.84,.75,.57), fcU, fcS(.05,.95, san - .6 * fcT)), 0) * fcK[0], fcIn(md) * wedge * .9);
  fcDraw(rr * .29 * min(sa, 1. - sa), .0016, wedge * fcN.x * step(md, 0.)); fcDraw(md, .002, wedge * fcM.y);
  fcMix(fcB, .6 * wedge * step(0., md) * fcFall(md, 30.));
  // the stair from the side: treads and risers climbing
  vec2 sp = q - vec2(-.14,-.43);
  float st = sp.x / .125, n = floor(st), f = (st - n) * .125, h = (n + 1.) * .095, dt = h - sp.y, under = sp.y - .76 * sp.x + .15, dty = max(dt - fcD.y, 0.);
  float up = on * step(0., st) * fcS(8.,6.8, st);
  vec3 sc = mix(fcHue(mix(fcO, fcU, sat(.25 + dty * 3. - 1.1 * fcT)), 1) * fcK[0], fcW, .7 * fcFall(f + fcD.x, 26.));
  fcMix(mix(sc, fcB, .75 * fcFall(dty, 34.) * fcS(0.,.03, f)), fcOut(dt) * fcOut(under) * up * .92);
  fcMix(fcB, up * .8 * fcIn(under) * fcFall(fcD.y - under, 8.));
  fcMix(mix(fcW * fcK[3], fcV, f * 5.), fcOut(-dt) * fcIn(-dt - .024) * up * .95);
  fcDraw(dt, .002, up * fcM.x); fcDraw(min(f, .125 - f), .0014, up * .8 * step(abs(dt - .04), .045)); fcDraw(under, .0016, up * fcN.y);
  // the bottle: seen from the front, its lip and its foot from above and below; or a turned baluster on each step
  vec2 b = mat2(1.,-.05,.05,1.) * (q - vec2(.12,-.12));
  float bd = fcBottle(b), bm = A * fcIn(bd), by = (sp.y - h) / .285, bx = f - .062;
  float bw = .0055 + .0095 * fcBump(by - .3, 42.) + .005 * fcBump(by - .62, 81.) + .004 * (fcBump(by - .1, 676.) + fcBump(by - .8, 676.));
  fcThing(bd, 1.26 * fcT - b.x * 10.6 - .3, vec3(.52,.6,.42), vec3(.075,.105,.075), vec3(.93 - .5 * fcS(-.02,-.22, b.y - b.x + .2 * fcT),.03,fcM.y), 1,
    max(abs(bx) - bw, abs(by - .5) * .28 - .14), 1.6 * fcT - bx / bw, vec3(.9,.86,.76), deep, vec3(up * .93,.006,up * fcM.y));
  fcMix(fcW, (.7 + .3 * uMic) * bm * fcOut(b.x + .045) * fcFall(b.x + .045 + fcD.x, 40.) * fcS(-.2,-.1, b.y));
  fcMix(fcB, .6 * bm * fcOut(b.x - .03) * fcFall(b.x - .03 + fcD.x, 25.));
  fcDraw(fcEll(b - vec2(0.,.42), vec2(.037,.02)), .0018, A * .9); fcDraw(fcEll(b + vec2(0.,.24), vec2(.1,.06)), .0015, A * fcN.z);
  fcPlane(vec4(.07,.04,0.,-.28),.12,.35,fcW,3, vec4(0.,.1,.02,-.14),.1,.3,fcV);
  fcPlane(vec4(.1,-.12,.28,-.02),.11,.1,vec3(.5,.55,.43),1, vec4(-.52,-.1,-.26,-.18),.11,.5,fcW);
  // the bowl: its side from the front, its mouth from above, three fruits; or the rail, the post and the rail's curl
  vec2 w = q - vec2(.4,-.2), rp = q - vec2(-.17,-.09), rv = mat2(.793,-.609,.609,.793) * rp, po = q - vec2(-.17,-.27);
  fcThing(max(fcEll(w, vec2(.165,.15)), w.y), 1.5 * fcT - w.x * 6.7, vec3(.91,.87,.77), vec3(.22,.21,.18), vec3(.94 - .5 * fcS(0.,.15, w.x - w.y * .3),.03,fcM.z), 2,
    fcBox(rv - vec2(.6,0.), vec2(.58,.017)), rv.y * 55. + fcT, vec3(.66,.42,.23), fcB, vec3(.94 * fcS(.75,.6, q.x),.012,fcM.x * fcS(.75,.6, q.x)));
  fcThing(fcEll(w - vec2(0.,.02), vec2(.165,.085)), w.x * 6.7 + fcT, fcV, fcU, vec3(.85,.025,fcM.x), 2,
    max(abs(po.x) - .02 - .008 * step(.105, abs(po.y + .01)), abs(po.y) - .165), 1.3 * fcT - po.x * 45., vec3(.72,.5,.29), fcB, vec3(.95,.014,fcM.y));
  float i = clamp(floor(w.x / .078 + .5), -1., 1.), cr = length(rp + vec2(0.,.01));
  vec2 fv = w - vec2(.078 * i, .095 - .035 * i * i);
  float fl = dot(fv, vec2(-15.,15.));
  fcThing(length(fv) - .046, fl + (fl + fv.x * 12. > 0. ? .5 : -.45), vec3(.84,.63,.29), vec3(.33,.24,.13), vec3(.94,.02,fcM.y), 3,
    cr - .045, dot(rp, vec2(-17.,17.)) + fcT, vec3(.8,.58,.33), fcB, vec3(.95,.018,fcM.x));
  fcDraw(cr - .026, .0013, on * fcN.y); fcDraw(cr - .011, .0013, on * .8);
  // the glass
  vec2 l = mix(p, q, .5) - vec2(-.42,.03);
  fcThing(max(abs(l.x) - .052 - .16 * l.y, abs(l.y - .055) - .1), 1.5 * fcT - l.x * 16., vec3(.85,.83,.75), fcB * 3., vec3(.7 * A,.025,fcM.x * A), 3);
  fcDraw(fcEll(l - vec2(0.,.155), vec2(.077,.034)), .0016, A * .9); fcDraw(fcEll(l + vec2(0.,.165), vec2(.07,.024)), .0016, A * .8);
  fcDraw(fcBox(l + vec2(0.,.1), vec2(.007,.065)), .0014, A * .8);
  // planes before the things, and a folded cloth at the corner
  fcPlane(vec4(.29,-.34,.24,.06),.1,.2,fcV,1, vec4(.26,.02,.24,-.3),.12,-.3,deep);
  fcPlane(vec4(-.6,-.12,-.34,-.22),.11,.5,fcV,3, vec4(.1,-.36,-.14,-.46),.1,-.3,fcU);
  fcPlane(vec4(.6,-.32,.4,-.37),.12,-.3,fcU,2, vec4(.44,.3,.4,.04),.12,.2,fcB);
  fcPlane(vec4(.36,.04,.6,-.04),.13,.4,green,2,A);
  fcPlane(vec4(-.2,-.44,-.3,-.2),.08,-.2,fcW,4,A);
  fcPlane(vec4(-.11,-.42,-.22,-.22),.075,-.1,fcU,4,A);
  fcPlane(vec4(-.1,-.43,-.14,-.24),.07,.1,fcW,4,A);
}
// What a hit opens: one pale plane, its far edge swinging away from the near one.
void fcFan(vec2 at, float a0) {
  mat2 m = rot(-a0);
  vec2 r = m * (fcP - at);
  float open = .35 + .75 * (1. - uHits), an = atan(r.y, r.x + 1e-5), L = length(r + m * fcD) / (1. + .8 * fcUp(uOwn[0])), s = sat(uHits * 1.15);
  fcMix(mix(fcW, vec3(.95,.8,.5) * fcK[4], .45), fcOut(r.y) * fcOut(L * sin(open - an)) * step(0., r.x + r.y * .3) * fcS(.4,.28, L) * (1. - .6 * sat(an / open)) * s);
  float near = s * fcS(0.,.03, r.x) * fcS(.42,.26, r.x);
  fcMix(fcB, .6 * fcIn(r.y) * fcFall(-r.y, 40.) * near);
  fcDraw(r.y, .0016, near);
}

vec3 render(vec2 p) {
  fcA = uVar < .5;
  float big = fcA ? .87 : .94, lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  fcIp = uRes.y / big;
  p *= big;
  for (int k = 0; k < 5; k++) {
    float w = sin(uTime * (.11 + .017 * float(k)) + 2.1 * float(k));
    fcK[k] = mix(vec3(1.), (uKind[k] + .03) / (fcLum(uKind[k]) + .03), .05 + .2 * lv[k]) * (1. + .12 * lv[k]);
    fcMv[k] = .011 * w + (k < 4 ? .035 * lv[k] : 0.);
    fcGr[k] = 1. / (1. - .12 * w);
  }
  fcSl = 2.4 * uCue * (1. - uCue);
  fcT = fcShD = fcShL = fcInk = fcRel = 0.; fcR = .5; fcD = vec2(0.);
  fcKeep = 1. - fcUp(-uOwn[1]); fcFlat = fcUp(-uOwn[4]); fcBold = 1. + 2.6 * fcUp(uOwn[4]) + .4 * fcUp(-uOwn[5]);
  p += .0017 * sin(p.yx * vec2(31.,29.) + p.xy * 11.);   // a hand's straight line
  vec2 s = p;
  fcCell = vec2(0.);
  if (uOwn[0] > 0.) {   // again and again, each the mirror of the next
    float n = 1. + 1.25 * uOwn[0], far = 1. - uOwn[0];
    vec2 h = vec2(.74,.5) + 4. * far * far;
    p = abs(mod(p * n - h, 4. * h) - 2. * h) - h;
    fcIp /= n;
  } else if (uOwn[0] < 0.) {
    float n = exp2(uOwn[0]);
    p = p * n - uOwn[0] * (fcA ? vec2(-.1,-.03) : vec2(-.12,-.1));
    fcIp /= n;
  }
  if (uOwn[2] > 0.) p += uOwn[2] * (.065 * sin(p.yx * vec2(6.3,5.1) + vec2(.4,1.2) + .06 * uTime) + .022 * sin(p.yx * vec2(15.,13.) - .09 * uTime));
  else if (uOwn[2] < 0.) {
    float R = length(p) / .088, id = floor(R), f = fract(R);
    p = rot(uOwn[2] * step(.5, id) * ((hash11(id + 2.) - .5) * 1.5 + .12 * sin(uTime * .09 + id * 2.))) * p;
    fcT -= uOwn[2] * (hash11(id + 8.) - .5) * .9;
    fcShD = -.7 * uOwn[2] * fcFall(f, 7.) * step(.5, id);
    fcInk = -uOwn[2] * .7 * fcLine((f - .5 > 0. ? 1. - f : f) * .088, .0012);
  }
  fcP = fcQ = p;
  float nx = noise(p * 6. + 3.);
  fcN = smoothstep(.33,.58, vec3(nx, 1. - nx, noise(p * 5. + 77.)));
  fcM = max(fcN, .28);
  // the hand turns with the facet it is working on
  float turn = .15 + (dot(p - vec2(.1,.02), vec2(-.59,.81)) > 0. ? .28 : -.12) + (p.x + p.y * .15 > -.02 ? -.34 : .14);
  mat2 m = rot(turn);
  fcDab(p, m, 0.); fcDab(p, m, 1.);
  fcOp = 1. - .88 * fcUp(-uOwn[5]);
  if (fcFlat > 0.) { fcD *= 1. - fcFlat; fcR = mix(fcR, .6, fcFlat); fcRel *= 1. - fcFlat; }
  fcScene(p);
  fcOp = 1.;
  fcFan(fcA ? vec2(-.12,.15) : vec2(.1,.03), fcA ? -1.75 : .35);
  // the dabs' own tone, the bristles, the light on the ridges; thin and scraped here and there
  float body = (.45 + .55 * fcN.z) * (.5 + .5 * fcBump(length(p), 2.)), br = noise((p + fcD * .5) * vec2(40.,420.));
  fcC *= 1. + (fcR - .5) * .27 * body + (br - .5) * .1 + fcRel * .05 * body;
  fcC += (fract(fcR * 13.7) - .5) * vec3(.05,.015,-.045) * body;
  // the piece, in the colour of scattered dabs: its time from left to right, its back at the top
  vec4 pc = piece(vec2(.5 + s.x / 1.75, .5 - s.y * .9));
  vec3 mc = pc.rgb / max(pc.a, .05);
  fcMix(fcC * mix(vec3(1.), mc / max(fcLum(mc), .15), .45), sat(pc.a * 1.5 - fract(fcR * 5.3)) * .55 * fcS(.87,.75, abs(s.x)));
  // the spectrum stipples the lit facets: round points of light paint, the low notes at the left
  fcMix(fcW, sat((band(s.x / 1.7 + .5) * .6 - fract(fcR * 7.7)) * 3.) * fcIn(length(fcD) - .0036) * sat(.25 + 2.5 * fcT) * (.2 + .6 * uEnergy));
  // a cue: light crosses the lit facets from the left
  fcC *= 1. + uCue * (.15 + .35 * sat(fcT * 2.)) * fcBump(s.x + fcD.x + .3 * s.y + .55 - 1.2 * (1. - uCue), 25.);
  if (uOwn[6] > 0.) {
    vec2 e = abs(fcCell);
    float gap = fcS(.36,.46, max(e.x, e.y));
    fcC *= 1. + uOwn[6] * ((fcR - .5) * .3 + .25 * (fcCell.y - fcCell.x));
    fcC = mix(fcC, vec3(.24,.22,.2) * (.4 + fcLum(fcC)), uOwn[6] * gap * .85);
  } else if (uOwn[6] < 0.) {
    float d = length(fcCell + .1 * (hash22(vec2(fcR, 3.)) - .5)), rr = .53 - .2 * fcR * fcLum(fcC);
    vec3 under = uOwn[3] < 0. ? vec3(.05,.055,.07) : mix(vec3(.8,.75,.66), vec3(.93,.9,.83), fcUp(uOwn[3]));
    fcC = mix(fcC, mix(under, fcC * (1. + .35 * (fcR - .5)), fcS(rr, rr - .13, d)), -uOwn[6]);
  }
  if (uOwn[4] > 0.) {   // a light behind the glass
    vec3 g = fcC * (.75 + .7 * noise(p * 9. + 5.)) * (1.06 - .7 * dot(s, s)) + .12 * noise(p * vec2(60.,24.)) * fcC;
    fcC = mix(fcC, mix(vec3(fcLum(g)), g, 1.35) * (.9 + .3 * uLevel), uOwn[4]);
    fcC = max(fcC, 0.);
  }
  if (uOwn[7] > 0.) {
    vec2 l = s - vec2(-.42,.26);
    float near = exp(-dot(l, l) * 2.6);
    fcC *= mix(vec3(1.), vec3(.1,.11,.14) + vec3(1.5,1.3,1.02) * near * (.85 + .3 * uLevel), uOwn[7]);
  } else if (uOwn[7] < 0.) {   // the panes of a window, thrown aslant
    vec2 w = vec2(s.x + .42 * s.y + .04, s.y - .1 * s.x) / vec2(.3,.235) + vec2(.02 * sin(uTime * .05), .0) + .5;
    vec2 c = abs(fract(w) - .5), in_ = abs(w - .5);
    float lit = fcS(.46,.43, c.x) * fcS(.46,.43, c.y) * fcS(1.51,1.48, in_.x) * fcS(1.51,1.48, in_.y);
    fcC *= mix(vec3(1.), mix(vec3(.4,.44,.55), vec3(1.38,1.3,1.14), lit), -uOwn[7]);
  }
  fcMix(uOwn[3] < 0. ? mix(vec3(.07,.06,.055), vec3(.86,.84,.78), -uOwn[3] * (1. - fcUp(uOwn[4]))) : vec3(.07,.06,.055), fcInk * .88);
  return sat(mix(fcC, smoothstep(-.06,.96, fcC), .35 + .4 * uTone) * (.96 + .14 * uTone));
}
