// name: Cranked show
// a: Barn night
// b: Behind the roll
// what: In a dim barn a wooden box on straw bales, its front a paper window with a lamp behind: cut black country winds past between two rollers, houses, poles, a bare tree, a wolf, a train, a moon of bare paper; or the box from behind: the naked bulb, two great rollers, a crank, the pale sheet with a road and a fox.
// follows: The piece stains the sky and lifts the hills as it passes the bulb, and fuller music winds faster. Drone raises and tints the far hills, pad dyes the dusk, texture lights stars and windows, the phrase is chimney smoke, the bands are the reeds. A hit flares the bulb and a window, a cue brightens the lamp, keys open pinholes, a voice warms the light.
// own: 0 snow and blue dusk at -1, red evening and leaves at 1; 1 flat country at -1, steep peaks at 1; 2 tree and moon alone at -1, a fir wood at 1; 3 coloured tissue at -1, black on bare paper at 1; 4 far back in the barn at -1, close to the paper at 1; 5 moonlight in the planks at -1, the barn lit warm at 1; 6 a town of towers and lit windows on the roll at -1, paper waves with a ship at 1; 7 a round window, or a round hole in a board, at -1, the show set up out of doors at 1
// A pixel, how far the roll has run, the lamp; then the worlds: many things, high or flat, snow, dusk, tissue, black, moon, light
#define rsTown max(-uOwn[6], 0.)
#define rsSea max(uOwn[6], 0.)
#define rsRound max(-uOwn[7], 0.)
#define rsOut max(uOwn[7], 0.)
float rsPx, rsS, rsMany, rsFlat, rsSnow, rsDusk, rsCol, rsInk, rsMoon, rsLit;
vec3 rsLamp, rsAmb;
float rsE(float a, float b, float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
float rsH(float n) { n = fract(mod(n, 512.)*.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float rsN(float x) { float i = floor(x), f = x - i; return mix(rsH(i), rsH(i + 1.), f*f*(3. - 2.*f)); }
float rsIn(float d, float e) { return rsE(-e, e, -d); }
void rsL(inout vec3 c, vec3 over, float d) { c = mix(c, over, rsIn(d, rsPx)); }
float rsBox(vec2 q, vec2 h, float r) { q = abs(q) - h + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
float rsRow(float x, float l) { return abs(fract(x/l + .5) - .5)*l; }
// A stick from a to b, as thick as ra there and rb here.
float rsCap(vec2 q, vec2 a, vec2 b, float ra, float rb) {
 vec2 v = b - a; float h = sat(dot(q - a, v)/dot(v, v));
 return length(q - a - v*h) - mix(ra, rb, h);
}
vec3 rsDye(int k) { vec3 c = uKind[k]; return c/max(max(c.r, max(c.g, c.b)), .2); }
// The piece along the paper: what plays now stands before the bulb.
vec4 rsPiece(float x, float room) {
 float u = fract(uLoop + x*.34);
 return .5*(piece(vec2(u - .012, room)) + piece(vec2(u + .012, room)))*rsE(0., .07, u)*rsE(1., .93, u);
}
// A beast on the trot, one unit long: a wolf, or with bush at 1 a fox.
float rsBeast(vec2 q, float g, float bush) {
 vec2 hd = vec2(.42, .63 - .06*bush), t1 = vec2(-.6, .32), t2 = vec2(-.78 - .17*bush, .2 + .08*bush);
 float d = rsCap(q, vec2(-.3, .44), vec2(.18, .46), .1, .14);
 d = smin(d, rsCap(q, vec2(.2, .5), hd, .12, .085), .06);
 d = smin(d, rsCap(q, hd, hd + vec2(.17, -.05), .07, .034), .03);
 d = min(d, min(rsCap(q, hd + vec2(-.04, .05), hd + vec2(-.07, .17), .05, .006), rsCap(q, hd + vec2(.03, .05), hd + vec2(.02, .15), .04, .006)));
 d = smin(d, rsCap(q, vec2(-.36, .48), t1, .04, .05 + .04*bush), .03);
 d = min(d, rsCap(q, t1, t2, .05 + .04*bush, .008));
 for (float k = 0.; k < 4.; k++) {
  float w = sin(g + (k < 2. ? 0. : 2.4) + PI*k), fore = step(2., k);
  vec2 hip = vec2(-.3 + .52*fore, .42), knee = hip + vec2(.16*w + .03, -.21), paw = knee + vec2(.1*w - .06, -.19 + .04*w);
  d = min(d, min(rsCap(q, hip, knee, .08, .034), rsCap(q, knee, paw, .034, .02)));
 }
 return d;
}
// A bare tree of forked sticks, one unit tall.
float rsTree(vec2 q, float bend) {
 q.x -= bend*q.y*q.y;
 float s = .36, w = .05, d = rsCap(q, vec2(0., -.15), vec2(0., .02), .085, .05);
 for (float k = 0.; k < 6.; k++) {
  d = min(d, rsCap(q, vec2(0.), vec2(0., s), w, w*.62));
  q.y -= s*(k < .5 ? .96 : .78); q.x += .12*s*sin(k*2.3);
  q = rot(q.x > 0. ? -.52 - .12*sin(k*3.1) : .4 + .1*sin(k*1.7))*q;
  s *= .71; w *= .63;
 }
 return d;
}
// The lines of the near and the middle hills along the roll.
// Scallops of a cut-paper wave, l long.
float rsWave(float X, float l, float a) { float u = fract(X/l), k = 1. - abs(2.*u - 1.); return a*(pow(1. - .999*k, 1.7) - .4) + .25*a*sin(X*1.7/l + uTime*.35); }
// A row of towers: how far above them y is, and how far into a lit window.
vec2 rsRowOf(float x, float y, float cell, float seed, float tall) {
 float i = floor(x/cell), h = rsH(i + seed), g = rsH(i + seed + 31.), u = (x/cell - i - .5)*cell, w = cell*(.36 + .14*g), top = tall*(.3 + .7*h*h), v = y - top;
 float d = max(abs(u) - w, v), roof = g < .3 ? max(abs(u)*1.6 + v - w*1.6, -v) : g < .55 ? max(length(vec2(u, v)) - w*.8, -v) : g < .75 ? max(abs(u) - .003, abs(v) - w*1.2) : max(abs(u - w*.4) - w*.2, v - w*.5);
 vec2 cs = vec2(.021, .031), q = vec2(u, v), n = floor(q/cs); q = abs(q - (n + .5)*cs) - vec2(.0044, .0075);
 float lit = step(.5, fract(rsH(n.x + i*7. + seed)*37. + rsH(n.y + i*3.)*11.));
 return vec2(min(d, roof), max(max(q.x, q.y), max(d + .007, .006 - y)) + 9.*(1. - lit));
}
float rsNear(float X) { if (uOwn[6] > 0.) return mix(-.175 + (.05*(rsN(X*2.1) - .4) + .016*rsN(X*7.))*rsFlat, -.165 + rsWave(X, .17, .045), rsSea); return -.175 + (.05*(rsN(X*2.1) - .4) + .016*rsN(X*7.))*rsFlat; }
float rsMid(float X) {
 float valley = rsE(.62, .3, rsRow(X + 1.15, 2.3))*(1. - uVar), h = rsN(X*1.5 + 31.) + .4*rsN(X*4.1 + 7.);
 if (uOwn[6] > 0.) return mix(-.09 + (.15*h - .07)*rsFlat, -.115 + rsWave(X + .05, .13, .034), rsSea);
 return mix(-.09 + (.15*h - .07)*rsFlat, -.2, valley*rsFlat*.8);
}
// Reeds along the foot, one to a band.
float rsReeds(float x, float y, float cell, float soft) {
 float cut = 0.;
 for (float k = 0.; k < 3.; k++) {
  float u = x/cell + .37*k, i = floor(u), h = rsH(i + 91.*k), lean = fract(h*13.) - .5, tall = .04 + .05*h + .2*(.3 + .9*fract(h*7.))*uBands[int(mod(i*5. + 3.*k, 16.))]*(.4 + uEnergy);
  vec2 q = vec2((u - i - .5 - .12*(h - .5))*cell, y); float up = q.y/tall;
  q.x -= lean*.7*cell*up*up + .006*sin(uTime*.7 + i*1.3)*up;
  float d = min(rsCap(q, vec2(0.), vec2(0., tall), .005, .0012), rsCap(q, vec2(0.), vec2(-.07*lean, tall*.6), .005, .001));
  cut = max(cut, rsIn(min(d, length((q - vec2(0., tall))*vec2(1., .38)) - .0065*step(.5, h)), soft));
 }
 return cut;
}
// What the paper lets through at q; ax is the way from the bulb.
vec3 rsRoll(vec2 q, float ax) {
 float e = rsPx;
 float X = q.x + rsS, x0 = q.x + rsS*.55, x1 = q.x + rsS*.8, front = 1. - uVar;
 vec4 m0 = rsPiece(ax, .2), m1 = rsPiece(ax, .55);
 float jx = mod(X, 1.37), mottle = noise(vec2(jx, q.y)*8.)*.6 + noise(vec2(jx*90., q.y*420.))*.4;
 vec3 sheet = vec3(1., .94, .83)*(.78 + .34*mottle);
 // a join in the paper, pasted
 sheet *= 1. - .16*rsIn(rsRow(X, 1.37) - .011, e*1.5 + .001);
 // the dusk, a stain in the paper: rose low down, blue above
 vec3 gel = mix(mix(vec3(.05, .24, .9), vec3(.14, .5, 1.8), rsSnow), vec3(1., .17, .2), rsDusk);
 gel = mix(gel, rsDye(1)*vec3(.5, .7, 1.5), .7*uPad*(.4 + uEnergy));
 float wave = q.y + .05*mottle - .025, up = rsE(-.06, .23, wave)*(1. - .95*rsInk)*(.2 + .76*front + .3*uPad*uVar);
 vec3 c = sheet*mix(mix(vec3(1.), vec3(1., .72, .75), rsE(-.12, .12, wave)*(1. - rsInk)*(.4 + .6*front)), gel, up);
 c *= 1. + .35*uPad*rsE(.15, -.1, q.y);
 // the piece, as colour in the sky
 float ml = max(m1.r, max(m1.g, m1.b));
 c *= mix(vec3(1.), m1.rgb/max(ml, .02)*.8 + .35, sat(.8*m1.a)*rsE(-.2, 0., q.y));
 // the moon, bare paper, and pierced stars
 if (uVar < .5) {
  vec2 mv = q - vec2(-.21 + .03*sin(uTime*.011), .115);
  float md = length(mv) - .056*(1. + 1.1*max(-uOwn[2], 0.));
  rsL(c, sheet*vec3(1.9, 1.8, 1.65), md);
  vec2 g = vec2(q.x + rsS*.35, q.y)*15., i = floor(g); float sh = hash21(mod(i, 97.));
  g -= i + .5 + .56*(vec2(sh, fract(sh*17.3)) - .5);
  c += vec3(2., 1.9, 1.7)*rsIn(length(g) - .03 - .045*fract(sh*7.7), .02 + 15.*e)*step(.35, sh)*rsE(.02, .1, q.y)*step(.02, md)*(.1 + 1.7*uTexture*(.6 + .4*sin(uTime*.6 + sh*50.)));
 }
 // the tissue of the three layers
 vec3 t0 = mix(mix(vec3(.6, .42, .42), vec3(.4, .62, .95), rsCol), vec3(.8, .95, 1.2), rsSnow);
 vec3 t1 = mix(mix(vec3(.27, .13, .12), vec3(1., .42, .16), rsCol), vec3(.5, .68, 1.), rsSnow), t2 = mix(vec3(.02, .013, .012), vec3(.06, .2, .2), rsCol);
 t0 = mix(mix(t0, vec3(.1), rsInk), rsDye(0)*.6, uDrone*(.3 + .5*uEnergy)); t1 = mix(t1, vec3(.03), rsInk); t2 *= 1. - .7*rsInk;
 // far hills, which the drone raises
 float pk = 1. - abs(2.*rsN(x0*2.7 + 9.) - 1.), h0 = -.04 + (.2*rsN(x0*1.3) + .1*pk - .13)*rsFlat + max(uOwn[1], 0.)*.22*pk - .03*rsSea*(1. - max(uOwn[1], 0.)) + .04*uDrone + .06*m0.a;
 c *= mix(vec3(1.), sqrt(t0), rsIn(q.y - h0 - .05 - .04*rsN(x0*3. + 50.)*rsFlat, e)*rsE(-1., -.6, uOwn[1]));
 c *= mix(vec3(1.), t0, rsIn(q.y - h0 - .004*rsN(x0*60.), e));
 // the middle hills
 float h1 = rsMid(x1) + .05*m1.a, hole = 9., d1 = q.y - h1 - .006*rsN(x1*85.)*rsE(.4, .6, rsN(x1*5.));
 float few = rsE(-.9, -.1, rsMany)*(1. - rsSea);
 if (uOwn[6] < 0.) { vec2 tw = rsRowOf(x1, q.y + .13, .062, 5., .34*rsTown); d1 = min(d1, tw.x); hole = min(hole, tw.y); }
 if (uOwn[6] > 0.) {
  // a ship, and a light on a rock
  float l = 1.25, n = floor(x1/l), sx = (n + .5)*l, bob = .006*sin(uTime*.5 + n*2.);
  vec2 v = rot(.05*sin(uTime*.37 + n))*(vec2(x1 - sx, q.y + .1 - bob + .2*(1. - rsSea)));
  float hull = max(max(abs(v.x + .02*v.y) - .1 - v.y*.5, v.y - .03 - .5*v.x*v.x*6.), -v.y - .06);
  float sail = 9.;
  for (float k = 0.; k < 2.; k++) { vec2 m = v - vec2(-.045 + .075*k, .045); m.x -= .022*sin(sat(m.y/.16)*PI); float hh = .17 - .03*abs(k - .4); sail = min(sail, max(max(abs(m.x) - .032 + .1*m.y, abs(m.y - hh*.5) - hh*.5), .003 - abs(m.y - hh*.52))); sail = min(sail, max(abs(v.x + .045 - .075*k) - .0022, abs(v.y - .14) - .12)); }
  sail = min(sail, max(max(v.x - .115, .03 + .06 - v.x + .0) , abs(v.y - .06 + (v.x - .09)*2.) - .05));
  vec2 k = vec2(x1 - sx - l*.5 + (x1 < sx ? l : 0.), q.y + .12 + .5*(1. - rsSea));
  float rock = max(length(k*vec2(.5, 1.)) - .045 - .012*rsN(k.x*60. + 40.), -k.y - .1), house = min(max(abs(k.x) - .022 + .06*k.y, abs(k.y - .11) - .09), min(max(abs(k.x) - .018, abs(k.y - .212) - .002), max(abs(k.x)*1.2 + k.y - .252, .232 - k.y)));
  house = min(house, max(abs(abs(k.x) - .012) - .0016, abs(k.y - .222) - .012));
  d1 = min(d1, min(min(hull, sail), min(rock, house)));
  hole = min(hole, min(max(abs(k.x) - .009, abs(k.y - .223) - .008), max(length(vec2(rsRow(v.x, .03), v.y - .008)) - .004, abs(v.x) - .07)));
  float beam = abs(k.y - .223) - .16*abs(k.x), side = cos(uTime*.23 + n);
  c += sheet*vec3(.9, .8, .5)*rsSea*sat(side*sign(k.x)*2.)*(1. - rsE(-.01, .006, beam))*exp(-abs(k.x)*6.)*step(.012, abs(k.x));
 }
 if (uVar < .5) {
  // a trestle over the valley, and its train
  vec2 t = vec2(x1 - (floor(x1/2.3) + .5)*2.3, q.y + .07 + .2*(1. - few)), l = t - vec2(.2, 0.);
  float bay = rsRow(t.x, .1), leg = min(min(min(bay, .05 - bay) - .0033, abs(t.y + .06) - .0025), abs(bay*.9 + t.y + .055) - .0025);
  d1 = min(d1, min(max(abs(t.y + .008) - .006, abs(t.x) - .62), max(leg, max(t.y, abs(t.x) - .6))));
  if (abs(l.x + .1) < .36 && abs(l.y - .1) < .14) {
   float d = min(rsBox(l - vec2(.02, .028), vec2(.05, .013), .012), rsBox(l - vec2(-.045, .036), vec2(.022, .028), .003));
   d = min(d, min(rsBox(l - vec2(-.045, .066), vec2(.028, .003), .001), rsCap(l, vec2(.052, .03), vec2(.052, .068), .006, .011)));
   d = min(d, max(length(vec2(rsRow(l.x - .02, .034), l.y - .011)) - .0115, abs(l.x - .002) - .07));
   float wu = l.x + .085 - (clamp(floor((l.x + .085)/.092), -3., -1.) + .5)*.092;
   d = min(d, min(rsBox(vec2(wu, l.y - .034), vec2(.04, .02), .003), min(rsBox(vec2(wu, l.y - .056), vec2(.044, .003), .001), length(vec2(abs(wu) - .024, l.y - .008)) - .009)));
   d1 = min(d1, min(d, max(abs(l.y - .015) - .003, abs(l.x + .17) - .17)));
   hole = max(max(abs(rsRow(wu, .02) - .005) - .0035, abs(l.y - .038) - .008), abs(wu) - .032);
   hole = min(max(hole, l.x + .08), rsBox(l - vec2(-.045, .045), vec2(.01, .009), 0.));
  }
 } else {
  // a pale road over the hills
  float y = (h1 - q.y)/.15, u = x1 - (floor(x1/.7) + .6)*.7;
  hole = max(abs(u - .034*sin(y*5.5 + .6)*(.35 + y)) - .003 - .016*max(y, 0.), -y + .01 + rsSea + rsTown);
 }
 // houses, lit windows, smoke
 float i = floor(x1/.31), hh = rsH(i + 3.), hx = (i + .5 + .35*(hh - .5))*.31, hs = .044 + .022*rsH(i + 60.);
 float on = rsE(hh - .14, hh + .14, 1.15 + 1.3*min(rsMany, 0.))*step(.7, rsRow(hx + 1.15, 2.3) + uVar)*(1. - rsSea)*(1. - rsTown);
 vec2 hq = vec2(x1 - hx, q.y - rsMid(hx) - .05*rsPiece(ax + hx - x1, .55).a + .004 + (1. - on)*.14)/hs, hw = abs(vec2(abs(hq.x - .04*hh) - .22, hq.y - .28));
 float house = min(max(abs(hq.x) - .5, max(hq.y - .55, -.6 - hq.y)), min(max(abs(hq.x)*.75 + hq.y - 1., .5 - hq.y), rsBox(hq - vec2(.27, .9), vec2(.07, .2), 0.)));
 d1 = min(d1, house*hs);
 hole = min(hole, max(max(max(hw.x - .1, hw.y - .13), .018 - min(hw.x, hw.y)), house + .06)*hs + .02 - .02*on);
 float sy = hq.y - 1.12, smoke = hs*max(abs(hq.x - .27 - .1*sy - .22*sin(sy*1.9 - uTime*.35)*rsE(0., 1.5, sy)) - (.14 + .16*sy)*rsE(.1 + 3.2*uPhrase*on, 0., sy) + .05, -sy);
 c *= mix(vec3(1.), mix(vec3(.4, .3, .32), vec3(.15), rsInk), rsIn(smoke, e + .0015)*.8);
 vec3 under = c;
 c *= mix(vec3(1.), t1*(.8 + .35*mottle), rsIn(d1, e));
 rsL(c, mix(sheet*vec3(1.5, 1.2, .75)*(.6 + .8*uTexture + 4.*exp(-ax*ax*30.)*uHits), under*1.1, .75*uVar), hole);
 // telegraph poles and their wire
 float d2 = 9.;
 if (uVar < .5) {
  vec2 v = vec2((fract(X/.47) - .5)*.47, q.y - .02 + .26*(1. - few)); float w = 2.*fract(X/.47 + .5) - 1., sag = .036*(w*w - 1.);
  d2 = max(abs(v.x) - .0032 - .004*sat(-v.y), v.y - .02);
  d2 = min(d2, min(rsBox(v - vec2(0., .004), vec2(.026, .0026), 0.), rsBox(v + vec2(0., .014), vec2(.02, .0024), 0.)));
  d2 = min(d2, min(abs(v.y - .013 - sag), abs(v.y + .006 - sag*1.15)) - .0011);
 }
 // the near ground, its fence, a fir wood
 float h2 = rsNear(X), gate = rsE(.05, -.05, rsN(X*1.1 + 70.) - .58);
 d2 = min(d2, q.y - h2);
 d2 = min(d2, rsSea*.3 + max(min(rsRow(X, .052) - .0028, abs(q.y - h2 - .02) - .0022), q.y - h2 - .036) + .01*gate);
 float wood = max(rsMany, 0.)*(1. - rsSea), win2 = 9.;
 if (uOwn[6] < 0.) { vec2 tw = rsRowOf(X + .4, q.y - h2 + .03, .105, 77., .25*rsTown); d2 = min(d2, tw.x); win2 = tw.y; }
 if (wood > 0.) for (float k = 0.; k < 2.; k++) {
  float j = floor(X/.11 + .5*k), r = rsH(j + 33.*k), tall = wood*(.2 + .2*r)*rsE(0., .4, wood - .5*fract(r*9.)), y = q.y - h2;
  float x = abs(X - (j + .5 - .5*k + .3*(r - .5))*.11);
  d2 = min(d2, max(x - .17*(tall - y)*(.55 + .45*fract(-y/.032 + r)), -y - .01)*.8);
 }
 // the lone tree and the beast
 float n = floor(X/.95), tx = (n + .36 + .16*rsH(n + 8.))*.95, th = .27 + .06*rsH(n + 19.);
 vec2 v = vec2(X - tx, q.y - rsNear(tx) + .6*rsSea + .5*rsTown)/th;
 if (abs(v.x) < .9 && v.y < 1.35) {
  d2 = min(d2, rsTree(v, .16 + .015*sin(uTime*.5))*th);
  d2 = min(d2, (length((v - vec2(.12, .8))*vec2(1., 1.2)) - .78*rsDusk + .4*noise(v*9. + mod(n, 64.)) + .2*noise(rot(.6)*v*30.) + .2*noise(rot(2.1)*v*47.))*th*.35 + .02*(1. - rsE(0., .25, rsDusk)));
 }
 float bx = (n + .92)*.95; if (X < bx - .475) bx -= .95;
 v = vec2(X - bx, q.y - rsNear(bx) - .012*uPhrase + .004 + .18*(1. - few) + .25*rsTown)/(.125 + .02*uPhrase + .02*uVar);
 if (abs(v.x) < 1.25 && v.y < 1.) d2 = min(d2, rsBeast(v, 1.1 + rsS*22., uVar)*.12);
 vec3 was = c;
 c *= mix(vec3(1.), t2, max(rsIn(d2, e), uVar*(1. - rsSea)*(1. - rsTown)*rsReeds(X, q.y + .25, .1, e*1.3)));
 if (uOwn[6] < 0.) c = mix(c, sheet*vec3(1.5, 1.15, .65)*(.75 + .6*uTexture + 3.*exp(-ax*ax*30.)*uHits), rsIn(win2, e));
 if (uOwn[6] > 0.) { // the edge of the next wave behind, and a nearer one
  float a = q.y - rsNear(X*.8 + .07) - .055*rsSea, b = q.y - rsNear(X*1.3 + .3) + .062; c = mix(was*mix(vec3(1.), mix(t1, t2, .45), rsIn(a, e)*rsSea), c, rsIn(d2, e));
  c = mix(c, c*.45, rsSea*rsIn(b, e)); c += sheet*.22*rsSea*(rsIn(abs(d2 + .005) - .0014, e) + .6*rsIn(abs(a + .004) - .001, e)*step(0., d2))*vec3(.8, .95, 1.1)*(1. - rsInk);
 }
 // pinholes in the near ground
 vec2 kg = vec2(X, q.y - h2)*42.; float kh = hash21(mod(floor(kg), 89.));
 return c + vec3(1.6, 1.3, .7)*rsIn(length(fract(kg) - .5 - .5*vec2(kh - .8, fract(kh*37.) - .5)) - .1, .05 + 42.*e)*step(.6, kh)*rsE(-.008, -.014, q.y - h2)*step(h2 - .07, q.y)*max(uKeys, .25*uTexture);
}
// Straw, from strands lying three ways.
float rsStraw(vec2 q) {
 float s = 0.;
 for (float k = 0.; k < 3.; k++) { vec2 r = rot(k*.8 - .8)*q + k*3.7; float n = noise(r*vec2(20., 260.)); s = max(s, n*n*n*(.9 + .25*k)); }
 return s;
}
void rsBale(inout vec3 c, vec2 q, vec2 h, vec3 light) {
 float d = rsBox(q, h, .02);
 if (d > .03) return;
 float s = rsStraw(q*vec2(.6, 1.) + h*7.), tie = abs(abs(q.x) - h.x*.45) - .003; d += .02*(s - .45);
 vec3 b = vec3(.66, .44, .19)*(.1 + 1.5*s)*(.35 + .65*rsE(0., -.03, d))*(1. - .6*rsIn(tie - .005, .006));
 c = mix(c, mix(b, vec3(.5, .32, .16), .6*rsIn(tie, rsPx + .001))*light, rsIn(d, rsPx + .002));
}
// The barn: planks with the night in their cracks, rafters, lit by what leaks up from from.
vec3 rsBarn(vec2 p, vec2 from, vec3 glow) {
 vec3 open = vec3(0.);
 if (uOwn[7] > 0.) {
  float hor = p.y + .12 - .05*(rsN(p.x*2.3 + 20.) - .5), fir = .03*rsN(p.x*34. + 9.)*rsN(p.x*5. + 3.) + .05*rsE(.55, .8, rsN(p.x*3.1 + 61.));
  vec3 low = mix(mix(vec3(.03, .035, .07), vec3(.1, .18, .34), rsMoon), mix(vec3(.75, .55, .42), vec3(.8, .22, .1), rsDusk), rsLit), high = mix(mix(vec3(.004, .007, .02), vec3(.015, .035, .1), rsMoon), mix(vec3(.2, .34, .5), vec3(.16, .1, .24), rsDusk), rsLit);
  low = mix(low, low*vec3(.8, 1., 1.2), rsSnow);
  open = mix(low, high, rsE(0., .5, hor))*(1. + .25*uPad);
  vec2 sg = p*34., si = floor(sg); float sh = hash21(si + 5.); float sz = fract(sh*91.); sg -= si + .5 + .86*(vec2(fract(sh*211.3), fract(sh*17.3)) - .5);
  open += vec3(.9, .92, 1.)*step(.7, sh)*rsIn(length(sg) - .025 - .06*sz*sz, .02 + 34.*rsPx)*(1. - .97*rsLit)*(.2 + .8*sz*sz + .5*uTexture);
  vec2 mv = p - vec2(.56, .33); float ml = length(mv);
  open += rsMoon*vec3(.75, .82, .9)*(rsIn(ml - .055, rsPx*2.)*(.8 + .3*noise(mv*40.)) + .1*exp(-ml*9.));
  float cl = fbm(vec2(p.x*2. + uTime*.006, p.y*6.) + 3.); open += low*.5*rsE(.5, .8, cl)*rsE(.6, .1, p.y);
  rsL(open, mix(low*vec3(.32, .36, .36), low*1.5 + .05, rsSnow*rsE(.02, .0, hor - .5*fir)), hor - fir);
 }
 vec2 q = p - from; float r2 = dot(q, q), an = atan(q.x, q.y + 1e-4);
 float fan = exp(-an*an)*(.3 + .9*rsE(.3, .8, noise(vec2(an*9., uTime*.02))))/(.3 + 2.*r2)*rsE(-.12, .14, q.y);
 glow *= .7 + .6*uSpace;
 vec3 cold = mix(vec3(.02, .045, .11), vec3(.28, .5, .9), rsMoon)*(1. - .75*rsLit);
 float x = p.x*10.5, id = floor(x), f = x - id, t = rsH(id + 40.), g = noise(vec2(x*6. + t*30., p.y*3. + t*9.));
 vec3 c = mix(vec3(.2, .12, .07), vec3(.28, .19, .13), t)*(.4 + g)*(rsAmb + glow*fan*.8);
 float gap = noise(vec2(id*3., p.y*3.));
 c = mix(c, cold*4.*gap*gap*step(.3, t), rsIn(min(f, 1. - f) - .006 - .05*t*gap, 10.5*rsPx));
 for (float k = 0.; k < 3.; k++) {
  float sc = .82 + .3*k, ax = abs(p.x + .04), roof = .6*sc + .1 - ax*(.56 + .03*k) - p.y, w = .026*sc, tie = p.y - .295 - .085*k, post = abs(ax - .74*sc - .12*k);
  float d = min(abs(roof) - w, max(min(min(abs(tie) - w, post - w*.95), max(abs(ax*.9 - p.y - .36*sc - .05*k + .04) - w*.7, max(tie, post - .3))), -roof));
  if (k < .5) c *= 1. - .6*rsE(0., .15, -roof);
  c *= 1. - .55*rsIn(d - .012, .016);
  float under = sat((abs(roof) < w ? roof : -tie)/w*.5 + .5);
  rsL(c, vec3(.3, .19, .115)*(.5 + .7*noise(vec2(dot(p, vec2(9., 4.)), dot(p, vec2(-60., 90.)))))*(rsAmb*1.1 + glow*fan*(.25 + 2.4*under*under)), d);
 }
 if (uOwn[7] > 0.) c = mix(c, open + rsAmb*.1 + glow*fan*.07, rsOut);
 return c;
}
// Boards going away, straw on them.
vec3 rsFloor(vec2 p, float y0, vec3 pool) {
 float y = max(y0 - p.y, 0.), z = 1./(y + .22), x = p.x*z*2.2, f = fract(x);
 vec3 wood = vec3(.22, .14, .085)*(.6 + .5*rsH(floor(x) + 70.))*(.6 + .7*noise(vec2(x*9., z*5.)))*(1. - .7*rsIn(min(f, 1. - f) - .02, .02 + 2.2*z*rsPx));
 if (uOwn[7] > 0.) {
  float gz = 1./(y + .06), blade = noise(vec2(p.x*160., y*22. + p.x*9.)), tuft = noise(vec2(p.x*4.*gz*.3, gz*1.6));
  vec3 grass = mix(vec3(.1, .13, .05)*(.4 + 1.3*blade*blade)*(.6 + .7*tuft), vec3(.66, .7, .78)*(.75 + .3*tuft), rsSnow);
  grass = mix(grass, vec3(.34, .26, .1)*(.4 + 1.3*blade), .6*rsDusk);
  vec3 sky = mix(mix(vec3(.05, .055, .09), vec3(.3, .42, .62), rsMoon), vec3(1., .86, .72), rsLit);
  wood = mix(wood*pool, grass*(pool*1.2 + sky), rsOut);
  if (uOwn[7] >= 1.) return wood;
 }
 return mix(wood, vec3(.6, .4, .18)*rsStraw(vec2(p.x, (p.y - y0)*2.2))*1.6, .85*rsE(.35, .75, noise(vec2(p.x*4., z*3.)) + .25*noise(p*30.)))*pool;
}
// An iron crank, r long, turned by an, seen a little from above.
void rsCrank(inout vec3 c, vec2 q, float r, float an, vec3 light) {
 vec2 end = r*vec2(cos(an), .3*sin(an)), v = q - end; float z = r*.1;
 vec3 iron = vec3(.15, .125, .11)*light;
 rsL(c, iron*(.35 + 1.5*rsE(z, -z, q.x)), rsCap(q, vec2(0., -r*.4), vec2(0.), z, z));
 rsL(c, iron*(.4 + 1.4*rsE(-z, z, end.x*q.y - end.y*q.x)), min(rsCap(q, vec2(0.), end, z*1.15, z*.85), rsCap(v, vec2(0.), vec2(0., r*.2), z*.7, z*.7)));
 rsL(c, vec3(.42, .22, .11)*light*(.2 + 1.4*rsE(z, -z, v.x + z*.4)), rsCap(v, vec2(0., r*.14), vec2(0., r*.46), z*1.15, z*1.5));
}
// a: the box in the barn, its paper window towards us.
vec3 rsFront(vec2 p) {
 float e = rsPx;
 vec2 at = p - vec2(-.07, .005), w = mix(vec2(.585, .272), vec2(.29), rsRound), o = mix(vec2(.665, .342), vec2(.365), rsRound), d = at - vec2(.15, -.02);
 float win = rsBox(at, w, mix(.03, .29, rsRound)), rr = .055, side = abs(at.x) - w.x + 2.*rr - .12*rsRound;
 if (win < 0.) {
  vec3 c;
  if (side < 0.) {
   float r2 = dot(d, d);
   c = rsRoll(at/1.12, d.x)*rsLamp*(.5 + 1.2*exp(-r2*4.5) + (1.5 + 2.2*uHits)*exp(-r2*50.))*(1. - .55*rsE(-.03, 0., side));
   // the near grass, out of focus and faster
   float gx = at.x + rsS*1.75, gy = at.y + w.y - .012;
   c *= 1. - .97*(1. - rsSea)*max(rsReeds(gx, gy, .125, .0048), rsE(.02, 0., gy - .02*rsN(gx*9.)));
  } else {
   // the rollers, fat with wound paper
   float u = side/rr - 1., n = sqrt(max(1. - u*u, 0.)), in1 = rsE(.5, -1., u), turn = sign(at.x)*(rsS*22. + u*.8);
   c = vec3(.8, .62, .42)*(.5 + .35*noise(vec2(u*9. + 2., at.y*3.)) + .35*noise(vec2(u*34., at.y*40.)))*rsLamp*(.015 + .06*n + .85*in1*in1*in1*in1);
   c *= 1. - .7*rsE(.02, -.02, at.y + .11 - .09*rsN(turn*1.2 + 90.));
  }
  return c*(.4 + .6*rsE(0., -.02, win));
 }
 vec3 c = rsBarn(p, vec2(.06, .3), rsLamp);
 float dy = -.36 - p.y;
 if (dy > 0.) { float fx = p.x/(.7 + 1.4*dy); c = rsFloor(p, -.36, rsAmb + rsLamp*1.1*exp(-fx*fx*2.2)*rsE(0., .06, dy)/(1. + 16.*dy*dy)); }
 vec3 near = rsAmb*1.4 + rsLamp*.4*rsE(.97, .55, p.x), low = (rsAmb + rsLamp*.3)*(.4 + 1.8*rsE(-.35, -.48, p.y));
 rsBale(c, p - vec2(.84, -.335), vec2(.18, .08), near);
 rsBale(c, p - vec2(.89, -.18), vec2(.15, .072), near);
 rsBale(c, p - vec2(-.4, -.405), vec2(.21, .075), low);
 rsBale(c, p - vec2(.22, -.4), vec2(.22, .075), low);
 vec2 ax = vec2(abs(at.x) - w.x + rr, at.y - o.y - .012 + .09*rsRound);
 rsL(c, vec3(.2, .12, .07)*(rsAmb + rsLamp*.4*rsE(.02, -.02, ax.x)), rsBox(ax, vec2(.016, .03), .004));
 if (at.x > .2) rsCrank(c, ax - vec2(0., .04), .1, -rsS/.055 + .6, rsAmb + rsLamp*.8);
 // the box, worn green paint over board
 float outer = rsBox(at, o, mix(.008, .365, rsRound)), in1 = -outer;
 c *= 1. - .6*rsIn(outer - .02, .04);
 bool upright = abs(at.x) - w.x > abs(at.y) - w.y;
 vec2 g = upright ? at.yx : at; g.x += 9.*sign(g.y);
 if (uOwn[7] < 0.) { float gl = max(length(at), 1e-3); g = mix(g, vec2(1.3*at.x/gl + 2., gl), rsRound); }
 float gr = .6*noise(vec2(g.x*4., g.y*150.)) + .4*noise(vec2(g.x*16., g.y*400.)), worn = rsE(.46, .54, gr*.6 + .3*noise(g*vec2(5., 40.)) + .2*rsE(.012, 0., min(in1, win)));
 vec3 L = rsAmb*1.6 + rsLamp*(.1 + .5*exp(-win*60.))*(.5 + .7*exp(-dot(d, d)*4.)), b = mix(vec3(.05, .15, .125), vec3(.36, .2, .1), worn)*(.5 + gr);
 b *= (1. + .9*rsIn(abs(in1 - .005) - .003, e))*(1. - .6*rsIn(abs(in1 - .013) - .002, e))*(1. - .5*rsIn(abs(win - .028) - .002, e));
 b = mix(b, vec3(.75, .45, .15), .85*rsIn(abs(win - .034) - .0022, e))*L;
 // light through the lid's seam and round the window
 b += rsLamp*(rsIn(abs(at.y - o.y + .012) - .0016, e)*rsE(.35, .7, noise(vec2(at.x*8., 3.)))*exp(-d.x*d.x*7.) + rsIn(win - .003, e + .001)*(.1 + .5*exp(-dot(d, d)*4.)));
 rsL(c, b, outer);
 return c + rsLamp*vec3(.03, .02, .012)*exp(-max(win, 0.)*7.);
}
// b: behind the box, the bare bulb between us and the paper.
vec3 rsBack(vec2 p) {
 float e = rsPx;
 vec2 h = vec2(.64, .29), d = p - vec2(-.16, .06), bd = d/1.3;
 float E = .22 + (1.9 - .8*rsSnow)/pow(1. + dot(d, d)*6., 1.5);
 float s = p.x < 0. ? -1. : 1., R = s < 0. ? .165 : .125, qx = p.x - (s < 0. ? -.68 : .67), F = R*1.2;
 vec3 c = vec3(0.);
 // the sheet, then what is round it
 if (abs(qx) < R - .004 && abs(p.y + .04) < .2) {}
 else if (abs(p.y + .01) < h.y && abs(p.x) < h.x) {
  c = (.006 + rsRoll(vec2(-p.x, p.y)/1.17, -d.x))*rsLamp*E*vec3(.9, 1., 1.1)*(1. + .12*(rsN(p.x*22. + 60.) - .5)*rsE(.2, .55, abs(p.x)));
  if (uOwn[7] < 0.) {
   // a board with a round hole before the sheet
   vec2 hc = p - vec2(-.03, -.005); float hr = length(hc) - mix(.75, .255, rsRound), y = p.y*13.; float gb = noise(vec2(p.x*5. + 9.*rsH(floor(y) + 5.), p.y*120.));
   vec3 bo = vec3(.3, .19, .11)*(.45 + .7*gb)*(.8 + .3*rsH(floor(y)))*(1. - .7*rsIn(min(fract(y), 1. - fract(y)) - .03, .03))*(rsAmb*1.2 + rsLamp*(.22 + .9/(1. + 9.*dot(d, d))));
   c *= 1. - .45*rsIn(-hr - .02, .03);
   rsL(c, mix(bo, vec3(.5, .3, .13)*(rsAmb + rsLamp*.9), rsIn(abs(hr - .012) - .009, e)), -hr);
  }
 } else {
  vec3 near = rsAmb + rsLamp/(1. + 7.*dot(d, d));
  c = p.y < -.3 ? rsFloor(p, -.28, rsAmb + rsLamp*.7*exp(-d.x*d.x*2.)*rsE(-.3, -.4, p.y)) : rsBarn(p*.85 + .03, vec2(-.1, .2), rsLamp);
  float gr = .5 + .7*noise(vec2(p.x*5., p.y*130.));
  rsL(c, vec3(.3, .18, .1)*gr*near*(p.y > -.318 ? 1. : .3), rsBox(p + vec2(0., .335), vec2(.95, .036), .004));
  rsL(c, vec3(.28, .17, .1)*gr*near*(p.y < .292 ? 1.4 : .35), rsBox(p - vec2(0., .303), vec2(.9, .023), .003));
 }
 // the two rollers between their boards
 vec3 L = rsLamp*(s < 0. ? .9 : .75);
 if (abs(qx) < F + .01) for (float k = 0.; k < 2.; k++) {
  float y0 = k < .5 ? -.3 : .275, v = (p.y - y0)/.2, g = .6 + .6*noise(vec2(p.x*8., v*22.)), lit = .15 + rsE(.8, -.8, s*qx/F);
  float low = p.y < y0 - .026 ? (length(vec2(qx, v + .13)) - F)*.2 : p.y - y0;
  rsL(c, vec3(.2, .115, .065)*g*(rsAmb + L*.6*lit), max(abs(qx) - F, low));
  rsL(c, vec3(.3, .18, .1)*g*(rsAmb + L*(k < .5 ? .6 : .1)*lit), (length(vec2(qx, v)) - F)*.25);
  if (k < .5) {
   float u = clamp(qx/R, -1., 1.), n = sqrt(1. - u*u), y = p.y + .2*R*n, turn = asin(u)*R, X = (-s*.67 - turn)/1.17 + rsS;
   vec3 pap = vec3(.9, .84, .72)*(.72 + .22*noise(vec2(turn*26. + 5.*s, p.y*2.)) + .14*noise(vec2(turn*160., p.y*30.)));
   pap *= mix(vec3(1.), vec3(.5, .32, .26), rsIn(y - rsMid(X)*1.17, e*2.))*mix(1., .14, rsIn(y - rsNear(X)*1.17, e*2.));
   pap *= rsAmb*1.2 + L*(.015 + 1.3*pow(sat(.3 - s*u*.7 + .15*n), 2.6));
   rsL(c, pap, max(max(y0 - y, y - .275), abs(qx) - R));
  }
 }
 vec2 lx = vec2(p.x + .68, p.y - .31);
 rsL(c, vec3(.2, .13, .08)*(rsAmb + rsLamp*.7*rsE(-.03, .03, lx.x)), rsBox(lx, vec2(.024, .045), .004));
 rsCrank(c, p - vec2(.67, .345), .18, rsS/.125 + 2.4, rsAmb + rsLamp*.8);
 // bales near us
 float by = rsE(-.54, -.36, p.y);
 rsBale(c, p - vec2(-.66, -.45), vec2(.28, .1), rsAmb*1.4 + rsLamp*rsE(-.95, -.3, p.x)*by);
 rsBale(c, p - vec2(.75, -.46), vec2(.27, .1), rsAmb*1.4 + rsLamp*.7*rsE(1.05, .45, p.x)*by);
 // the cord, the socket, the glass and its wire
 rsL(c, vec3(.02), max(abs(bd.x - .006*sin(bd.y*9.)) - .0028, .1 - bd.y));
 float glass = smin(length(bd) - .052, rsCap(bd, vec2(0., .03), vec2(0., .08), .03, .017), .03);
 c += rsLamp*(.45 + .9*uHits)*exp(-24.*max(glass, 0.)) + rsLamp*.014*exp(-6.*max(glass, 0.));
 float fil = max(abs(bd.y - .012 + .03*(rsRow(bd.x, .018)/.009 - .5))*.35 - .0012, abs(bd.x) - .027);
 rsL(c, c*.3 + rsLamp*(.5 + 1.6*exp(-dot(bd, bd)*900.) + 4.*rsIn(fil, e*.7) + .9*rsE(-.016, -.004, glass)), glass);
 c *= 1. - .5*rsIn(abs(glass) - .0012, e);
 float sock = min(rsBox(bd - vec2(0., .098), vec2(.0185, .024), .005), rsBox(bd - vec2(0., .127), vec2(.011, .01), .004));
 return mix(c, vec3(.45, .28, .1)*rsLamp*(.15 + .9*rsE(.012, -.012, abs(bd.x + .004) - .004)), rsIn(sock, e));
}
vec3 render(vec2 p) {
 float zoom = mix(1.5, 1., rsE(.5, 1.5, uRes.x/uRes.y))*exp2(-.75*uOwn[4]);
 rsPx = .75*zoom/uRes.y;
 rsS = uTravel*.02 + uTime*.0012;
 rsSnow = max(-uOwn[0], 0.); rsDusk = max(uOwn[0], 0.);
 rsFlat = 1. + (uOwn[1] < 0. ? .95 : .9)*uOwn[1];
 rsMany = uOwn[2];
 rsCol = max(-uOwn[3], 0.); rsInk = max(uOwn[3], 0.);
 rsMoon = max(-uOwn[5], 0.); rsLit = max(uOwn[5], 0.);
 vec3 bulb = mix(vec3(1., .58, .23), vec3(1., .75, .46), .5*uTone);
 bulb = mix(mix(mix(bulb, vec3(.9, .88, .75), .6*rsSnow), vec3(1., .42, .14), .6*rsDusk), vec3(1., .46, .14), .4*uMic);
 rsLamp = bulb*1.75*(1. + .05*sin(uTime*.55) + .03*sin(uTime*1.31))*(.85 + .4*uLevel + .8*uCue);
 rsAmb = vec3(.012, .02, .04)*(1. + 7.*rsMoon) + bulb*.45*rsLit;
 return screenOf(uVar < .5 ? rsFront(p*zoom) : rsBack(p*zoom));
}
