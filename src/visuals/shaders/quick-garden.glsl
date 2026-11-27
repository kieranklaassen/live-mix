// name: Weeks in minutes
// a: Climbing beans
// b: Bulbs on glass
// what: Beans climb five strings out of dark soil before grey-green paper with a window's light on it; a bent seedling waits, tips grope in slow circles, and a tendril near the eye curls round the last string; or five bulbs in waisted glasses on a windowsill, roots combing down, one flower leaning, two still shut, rain on the pane.
// follows: Each kind is one plant: it climbs or opens, greens and flowers as it sounds. Drone thickens its stem and the roots, pad lifts leaves, texture wets the pane, phrase widens a tip's circle. Bands lift leaves or open the flower row by row. Light swings with the loop. A hit runs up a string and tightens the tendril, or lights a glass; a cue is one night passing.
// own: 0 night, by lamplight on the sill, at -1, evening gold at 1; 1 one plant, the other strings or glasses bare, at -1, a thicket at 1; 2 withered, or short and shut, at -1, all in flower at 1; 3 narrow leaves and thin petals at -1, round leaves and round heads at 1; 4 from farther off at -1, close at 1; 5 a black cloth behind, or frost ferns on the pane, at -1, clay red paper, or a green clear garden, at 1; 6 standing in clay pots at -1, over still water, or on a polished table that mirrors them, at 1; 7 a great low sun or moon behind with all in shade before it at -1, poles leaning together at the top, or a window of many small panes, at 1
precision highp int;
const float qgSoil = -.4;
#define qgPots max(-uOwn[6], 0.)
#define qgWater max(uOwn[6], 0.)
#define qgDisc max(-uOwn[7], 0.)
#define qgPole max(uOwn[7], 0.)
float qgPx, qgDay, qgLift, qgNight, qgGold, qgLush, qgBloom;
float qgLv[5], qgOn[5], qgH[5], qgWilt[5], qgPart[5];
vec3 qgL, qgSky;
// the beans: drone, pad, texture, phrase, hit
const float qgBx[5] = float[5](-.6, -.31, .33, .04, .57);
const float qgLean[5] = float[5](-.09, .07, -.05, .1, .03);
const float qgBig[5] = float[5](1.3, 1.02, .72, 1., .7);
const int qgOrder[5] = int[5](2, 4, 1, 3, 0);
const float qgTall[5] = float[5](.86, .66, .34, .5, .17);
// Lays a colour over a layer.
void qgLay(inout vec4 l, vec3 c, float a) { l = mix(l, vec4(c, 1.), sat(a)); }
float qgUp(float a, float b, float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
float qgEdge(float d) { return sat(.5 + .5*d/qgPx); }
// A kind's colour as a petal.
vec3 qgDye(int k) { vec3 c = uKind[k]/max(max(uKind[k].r, max(uKind[k].g, uKind[k].b)), .2); return mix(c, vec3(.85, .68, .7), .36)*.93; }
float qgSeg(vec2 p, vec2 a, vec2 b) { vec2 d = b - a, q = p - a; return length(q - d*sat(dot(q, d)/max(dot(d, d), 1e-6))); }

void qgStart(inout vec2 p) {
  qgDay = .62*sin(TAU*uLoop) + .38*sin(uTime*.047 + 2.2);
  qgNight = sat(-uOwn[0]); qgGold = sat(uOwn[0]); qgLush = sat(uOwn[1]); qgBloom = sat(uOwn[2]);
  qgLift = sat(.42 + .2*cos(TAU*(uLoop - .4)) + .08*sin(uTime*.11) + .4*uPad - .3*qgNight);
  qgL = mix(mix(vec3(1.), vec3(1.06, .86, .6), qgGold), uVar < .5 ? vec3(.4, .48, .62) : vec3(.74, .59, .42), qgNight)*(1. + .06*uLevel);
  // a cue: one whole night and morning goes over, from left to right
  float n = (p.x + 1.25 - 2.3*(1. - uCue))/.42, m = n + 1.6;
  qgL *= mix(vec3(1.), vec3(.3, .36, .5), min(1.6*uCue, 1.)*exp(-n*n))*(1. + .25*uCue*exp(-m*m)*vec3(1., .8, .4));
  qgSky = qgL; qgL *= 1. - .86*qgDisc;
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  for (int k = 0; k < 5; k++) {
    float f = float(k), turn = uTravel*TAU/(150. + 23.*f) + f*2.3, still = k == 4 ? .6*uLevel : lv[k], cs = cos(turn), few = k == 3 ? 0. : sat(-uOwn[1]);
    qgLv[k] = lv[k]; qgOn[k] = still;
    qgPart[k] = .5 + .5*cos(TAU*(uLoop - .1 - .2*f));
    qgWilt[k] = sat(.55*qgUp(.1, -1., cs)*(1. - .8*still) + sat(-uOwn[2])*(.7 + .06*f));
    qgH[k] = qgTall[k]*(.86 + .14*cs) + .13*still + .035*qgPart[k] - 1.3*few*few + .2*qgLush;
  }
  // nearer or farther
  float far = 1. - (uOwn[4] < 0. ? .35 : .3)*uOwn[4];
  vec2 foot = vec2(.02, uOwn[4] < 0. ? -.44 : .1);
  p = foot + (p - foot)*far; qgPx = .75*far/uRes.y;
  p.y -= uVar < .5 ? .13*qgPots + .2*qgWater : .13*qgWater;
}
// The low sun or moon.
vec3 qgMoon(vec2 q, vec3 c, float r) {
  float d = length(q);
  vec3 m = vec3(.95, .91, .8)*(1. + .3*uVar)*(.86 + .1*noise(q*7. + 3.) + .07*noise(q*19.))*mix(vec3(1.), qgSky*1.3, .4)*(.94 + .06*uLevel);
  if (uOwn[0] > 0.) m = mix(m, mix(vec3(1.02, .66, .34), vec3(1.05, .95, .72), qgUp(-r, r, q.y))*(.94 + .08*uLevel), qgGold);
  c += qgDisc*m*(.22 + .25*uHits)*exp(-max(d - r, 0.)*5.);
  return mix(c, m, qgDisc*sat((r - d)/(qgPx*2.5) + .5));
}

float qgString(int k, float h) { return uOwn[7] > 0. ? qgBx[k]*(1. - 1.12*qgPole*h) + qgLean[k]*(1. - qgPole)*h : qgBx[k] + qgLean[k]*h; }
float qgLeans(int k) { return uOwn[7] > 0. ? qgLean[k]*(1. - qgPole) - 1.12*qgPole*qgBx[k] : qgLean[k]; }
// Where a stem is at a height: it winds round its string, z in front of it.
float qgStem(int k, float h, out float slope, out float z) {
  float f = float(k), w = 27./qgBig[k], a = w*h + f*1.7, on = .0125*qgBig[k]*qgUp(.02, .25, h);
  float free = qgUp(qgH[k] - .28, qgH[k] + .02, h), o = (k == 1 || k == 3 ? -.05 : .05)*exp(-h*9.);
  z = cos(a);
  slope = qgLeans(k) + w*on*z*(1. - free) - 9.*o;
  return qgString(k, h) + o + on*sin(a)*(1. - .8*free) + .016*free*free*sin(uTime*.31 + f);
}
// One leaf: q from its stalk, L long.
void qgLeaf(inout vec4 l, vec2 q, float ang, float L, float wide, float bend, vec3 base, float glow) {
  float c = cos(ang), s = sin(ang);
  q = vec2(c*q.x + s*q.y, c*q.y - s*q.x)/max(L, 1e-3);
  float u = sat(q.x), v = q.y - bend*u*(1. - u), sq = sqrt(u*(1. - u)), bean = 1.02*sqrt(u)*(1. - u)*(1. + .25*u);
  float w = wide*(uOwn[3] < 0. ? mix(bean, .4*sq*(1.1 - .5*u), -uOwn[3]) : mix(bean, sq, uOwn[3]));
  float g0 = .5*(1. - 2.*u)/max(w, .2), d = (w - abs(v) - 8.*abs(q.x - u))*L/sqrt(1. + g0*g0);
  float av = min(abs(v)/max(w, .01), 1.5), side = qgUp(-.02, .02, v)*2. - 1.;
  float lit = .5 + .5*side*dot(vec2(-s, c), vec2(-.85*qgDay, .55))*(.35 + .65*av);
  float x = (u - av*av*.1 - av*.16)*7.5, vein = abs(fract(x) - .5), pl = qgPx/max(L, 1e-3)*7.5;
  float ribs = (qgUp(.06 + pl, .015, vein))*qgUp(1., .5, av), mid = (qgUp(.02 + pl*.14, .004, abs(v)))*(1. - .6*u);
  float sh = av - .5 - .3*side*qgDay, sheen = max(1. - 3.5*sh*sh, 0.)*qgUp(0., .4, u);
  vec3 col = base*(.58 + .6*lit + (.1*vein - .03)*(1. - av));
  col = mix(col, base*vec3(1.55, 1.42, .85) + .04, (.1 + .45*glow)*lit);
  col += vec3(.075, .085, .08)*sheen + (base*.4 + .05)*((.28 + .5*uKeys)*ribs + .75*mid);
  qgLay(l, col*qgL, qgEdge(d));
}
vec3 qgGreen(int k) {
  vec3 g = mix(vec3(.29, .43, .17), vec3(.22, .4, .24), fract(.3 + .63*float(k)));
  g = mix(g, uKind[k]*.65, .14)*(.95 + .22*qgLv[k]*(.5 + uEnergy) + .06*qgPart[k]);
  return mix(g, vec3(.6, .43, .16), .85*qgWilt[k]);
}
void qgVine(inout vec4 l, inout float shade, int k, vec2 p, vec2 off, float blur) {
  float h = p.y - qgSoil, big = qgBig[k], x = p.x - qgString(k, h), H = qgH[k], f = float(k), dir = qgDay, slope, z, hs = h + off.y;
  float X = qgStem(k, max(h, 0.), slope, z);
  shade = max(shade, .75*(qgUp(blur + .006*big, 0., abs(p.x + off.x - X - slope*off.y)))*qgUp(H + .05, H - .07, hs)*step(0., hs));
  vec3 pale = mix(qgGreen(k)*1.35 + .05, vec3(.6, .4, .3), .4*qgUp(.25, 0., h));
  float sw = (.0017 + .0006*big)*(1. + 2.2*qgPole), sn = x/sw, strA = qgEdge(sw - abs(x)), pluck = (h - .9*(1. - uHits))*9.;
  vec3 strC = vec3(.7, .63, .5)*(.8 + .2*sin(h*900./big + sn*1.6))*(.8 - .22*sn*dir)*qgL;
  if (uOwn[7] > 0.) { float kn = fract(h*5. + f*.3) - .5; strC = mix(strC, vec3(.66, .52, .3)*(.75 + .3*(1. - sn*sn) - .25*sn*dir)*(1. - .4*exp(-kn*kn*900.))*qgL, qgPole); }
  strC += (k == 4 ? uHits : 0.)*vec3(.5, .45, .35)*exp(-pluck*pluck);
  qgLay(l, strC, strA);
  float th = .0078*big*(1. - .5*sat(h/max(H, .05)))*(1. + (k == 0 ? .4 : .12)*qgOn[k]);
  float dx = (p.x - X)/sqrt(1. + slope*slope), n = clamp(dx/th, -1., 1.), nl = n - .35*dir, on = qgEdge(H - h)*step(0., H);
  qgLay(l, pale*(.5 + .5*sat(.55 + .5*n*dir) + .28*max(1. - 4.*nl*nl, 0.) - .3*n*n)*(.9 + .1*z)*qgL*(1. + (k == 4 ? .6*uHits : 0.)), qgEdge(th - abs(dx))*on);
  qgLay(l, strC, strA*(qgUp(0., -.3, z))*qgUp(.12, .2, h));
}
// What grows at a node: three leaves, and flowers across from them. Or the searching tip: a bent neck while the
// plant is young, then a long arc with two folded leaves.
void qgNode(inout vec4 l, inout float shade, int k, float id, bool tip, vec2 p, vec2 off, float blur) {
  float f = float(k), big = qgBig[k], H = qgH[k], lv = qgOn[k], nh = tip ? max(H, 0.) : .1*big + id*.155*big, size = qgUp(0., .26, H - nh), side = mod(id + f, 2.) < .5 ? 1. : -1., slope, z;
  float hd = hash21(vec2(id, f) + .7), h2 = fract(hd*57.3), hook = qgUp(.34, .12, H), turn = uTime*(tip ? .37 : .19) + (tip ? f*2. : hd*6. + f), st = sin(turn), ct = cos(turn);
  vec3 green = qgGreen(k), pale = green*1.2 + .05;
  vec2 a = vec2(qgStem(k, nh, slope, z), (tip ? H : nh) + qgSoil), c, e;
  float fl = .0155*big*sat(.3 + .6*qgLv[k] + .25*qgPart[k] + .8*qgBloom - qgWilt[k])*size*(1. + .6*qgBloom);
  float lift = sat(qgLift + .15*st + .3*(band((max(id, 0.) + .5)/6.) - .2) - .6*qgWilt[k]), up = mix(.35, .95, lift), ang = mix(-1.35, -.1, lift*(.65 + .35*h2)), L, s0 = 1., wa = .0029*big;
  if (tip) {
    float wide = (.5 + .35*lv + (k == 3 ? .35 : 0.))*big;
    c = a + vec2(.02*wide, .12*big);
    e = a + mix(vec2(.09*ct + .05, .15 + .022*st)*vec2(wide, big), vec2(.075 + .008*ct, .01 + .06*sat(H*3.))*big, hook);
    L = .052*big; wa = .0039*big + .002*hook;
    vec2 ed = e - c; s0 = clamp(ed.x*30./big, -1., 1.); ang = atan(ed.y, ed.x + 1e-4) - s0*(.25 + .4*hook); side = 1.;
  } else {
    L = size*.128*big*(.8 + .4*hd)*(1. + .1*lv)*(1. + .1*qgLush);
    e = a + L*vec2(side*(.85 - .3*up), up*.75); c = a + L*vec2(side*.25, up*.6);
  }
  ang = side > 0. ? ang : PI - ang;
  vec2 q = p - e, q2 = q + off, m = vec2(cos(ang), sin(ang)), o = m*L*.16, q0 = a;
  vec2 ms = vec2(dot(m, q2), dot(q2, vec2(-m.y, m.x))) - vec2(.33*L, 0.);
  if (!tip) shade = mix(shade, 1., .95*(qgUp(blur, -blur, length(ms/vec2(1., 1. + .5*min(uOwn[3], 0.))) - .6*L)));
  float best = 1., segs = tip ? 6. : 3.;
  for (float i = 1.; i <= segs; i++) {
    float s = i/segs; vec2 q1 = mix(mix(a, c, s), mix(c, e, s), s);
    best = min(best, qgSeg(p, q0, q1) - wa*(1. - .3*s)); q0 = q1;
  }
  qgLay(l, pale*(.7 + .35*sat(-best/wa))*qgL, qgEdge(-best));
  qgLay(l, pale*qgL, tip ? 0. : qgEdge(.002*big - qgSeg(q, vec2(0.), o)));
  for (int i = 0; i < (tip ? 2 : 3) && dot(q, q) < L*L*1.45; i++) {
    float s = side*(i == 0 ? 1. : -1.), open = tip ? .34 : i == 0 ? 1. + .4*h2 : i == 1 ? 1.35 - .4*hd : 0.;
    qgLeaf(l, i == 2 ? q - o : q, ang + open*s, L*(i == 2 || tip ? 1. : .84), i == 0 ? .65 + .3*hd : .95 - .25*h2, .35*s*s0, green*(tip ? 1.15 : (.9 + .2*h2)*(.82 + .1*float(i))), tip ? .6 : .3 + .4*qgLv[k]);
  }
  vec2 bq = p - a + vec2(side*fl, -fl*2.5); vec3 dye = qgDye(k);
  for (int i = 0; i < 4 && !tip && abs(bq.x) < fl*3.4 && abs(bq.y) < fl*4.2; i++) {
    float g = float(i), s = fl*(1.15 - .18*g), sd = i % 2 == 0 ? -1. : 1.;
    vec2 b = p - a - fl*vec2(-side*(.4 + .45*g) + sd*.6, 1. + .95*g);
    b.x *= sd; b = vec2(.88*b.x - .48*b.y, .48*b.x + .88*b.y);
    qgLay(l, dye*(.6 + .45*sat(.4 + b.y/max(s, 1e-4)))*qgL, qgEdge(s*.8 - length(b/vec2(.85, 1.) - vec2(0., .25*s))));
    qgLay(l, mix(dye, vec3(1.), .25)*qgL, qgEdge(s*.4 - length((b - vec2(.36, -.3)*s)/vec2(1.3, .7))));
  }
}
// The tendril close to the eye. A hit draws it tighter.
void qgTendril(inout vec4 l, vec2 p) {
  float snap = 4.*uHits*(1. - uHits), R = (.135 + .008*sin(uTime*.23))*(1. - .16*snap), b = .15 + .03*snap;
  vec2 v = p - vec2(.6, .1 + .01*sin(uTime*.17));
  float th0 = mod(atan(v.y, v.x + 1e-5) - .5*PI, TAU), r = length(v), best = 1., n = 0., sl = b + .9*v.x;
  for (int i = 0; i < 3 && r < .2; i++) {
    float th = th0 + TAU*float(i), d = r - R*exp(-b*th), ww = .0165*exp(-.085*th)*(qgUp(15., 13., th));
    if (abs(d) - ww < best) { best = abs(d) - ww; n = d/max(ww, 1e-3); }
  }
  float d = (v.y - R - b*v.x - .45*v.x*v.x)/sqrt(1. + sl*sl), ww = .0165 + .012*v.x;
  if (v.x > 0. && abs(d) - ww < best) { best = abs(d) - ww; n = d/ww; }
  vec3 g = mix(vec3(.16, .27, .13), uKind[4]*.5, .2);
  vec3 c = mix(g, g*2.1 + .08, qgUp(-.6, 1.2, n))*qgL*(1. + .9*uHits);
  qgLay(l, mix(c, vec3(.6, .45, .22)*qgL, .6*sat(-uOwn[2])), .94*(qgUp(.013, -.013, best)));
}
int qgFirst(int bits) { return int(log2(float(max(bits & -bits, 1))) + .5); }
vec3 qgBeans(vec2 p, vec2 p0) {
  vec2 pIn = p;
  float deep = qgSoil - .03 - p.y;
  if (uOwn[6] > 0. && deep > 0.) {
    p.y = qgSoil - .03 + deep; p0.y += 2.*deep;
    p.x += (.016*deep + .0012)*sin(deep*70. - 30.*deep*deep + uTime*.8 + 3.*sin(p.x*5. + uTime*.2)) + .004*deep*sin(p.x*40. - uTime*.6);
  }
  // the paper, the window's light on it
  vec3 sweep = mix(vec3(.69, .735, .665), vec3(.8, .825, .75), qgUp(-.5, .5, p0.y));
  sweep = uOwn[5] < 0. ? mix(sweep, vec3(.055, .06, .062), -uOwn[5]) : mix(sweep, sweep*vec3(1.02, .72, .58), uOwn[5]);
  vec2 w = p0 - vec2(.26 + .3*qgDay, .1);
  w.x += w.y*(.32 + .12*qgDay);
  float soft = .07 + .05*(1. - uTone);
  float win = (qgUp(.34 + soft, .34 - soft, abs(w.x)))*(qgUp(.36 + soft, .36 - soft, abs(w.y)));
  win *= (.55 + .45*qgUp(0., .024 + soft*.5, abs(w.x)))*(.6 + .4*qgUp(0., .024 + soft*.5, abs(w.y - .06)));
  win *= 1. - qgDisc; float shade = 0., blur = .016 + .012*uSpace, h = p.y - qgSoil;
  vec2 off = vec2(.085*qgDay + .02, .055);
  // which vines and nodes are near enough, a bit for each
  int vines = 0, nodes = 0;
  for (int i = 0; i < 5; i++) {
    int k = qgOrder[i];
    float big = qgBig[k], x = p.x - qgString(k, h), xs = x + off.x, hs = h + off.y, grown = (1. + .1*qgLush)*big;
    vec3 id = floor((h - .1*big)/(.155*big) + .2) + vec3(-1., 0., 1.), nh = (.1 + .155*id)*big, size = sat((qgH[k] - nh)*5.);
    vec3 gs = grown*size, sx = vec3(-1., 1., -1.)*(1. - 2.*step(.5, mod(id.y + float(k), 2.))), leanAt = (uOwn[7] > 0. ? qgLeans(k) : 0.)*(h - nh), ax = (x + leanAt)*sx - .11*gs, ay = h - nh - .055*gs, bx = (xs + leanAt)*sx - .12*gs, by = hs - nh - .04*gs;
    vec3 far = .2*gs + .025, on = step(min(ax*ax*1.3 + ay*ay - far*far, bx*bx + by*by - far*far*.8), vec3(0.))*step(-.5, id)*step(.01, size);
    nodes |= int(dot(on, vec3(1., 2., 4.))) << (i*4);
    vec2 t = vec2(x - .02, h - qgH[k] - .07); if (uOwn[7] > 0.) t.x += qgLeans(k)*(h - qgH[k]);
    if (qgH[k] > -.12 && dot(t, t) < .035*big*big) nodes |= 1 << (i*4 + 3);
    if (min(abs(x), abs(xs)) < .04 + .03*big && h > -.06) vines |= 1 << i;
  }
  vec4 l = vec4(0.);
  for (int i = 0; i < 5 && vines != 0; i++) {
    qgVine(l, shade, qgOrder[qgFirst(vines)], p, off, blur);
    vines &= vines - 1;
  }
  for (int i = 0; i < 9 && nodes != 0; i++) {
    int b = qgFirst(nodes), k = qgOrder[min(b/4, 4)], n = b % 4;
    qgNode(l, shade, k, n == 3 ? -1. : floor((h - .1*qgBig[k])/(.155*qgBig[k]) + .2) + float(n - 1), n == 3, p, off, blur);
    nodes &= nodes - 1;
  }
  vec3 ground = sweep*(.8 + .26*win + .05*uLevel)*(1. - .11*dot(p0, p0))*mix(vec3(.97, 1., 1.01), vec3(1.03, 1.01, .95), win)*qgSky;
  if (uOwn[7] < 0.) ground = qgMoon(p0 - vec2(.02, .06), ground, .385);
  ground *= 1. - (1. - qgDisc)*shade*(.2 + .2*win)*vec3(1.05, .95, 1.);
  l = vec4(l.rgb + ground*(1. - l.a), 1.);
  if (uOwn[6] > 0. && deep > 0.) l.rgb = mix(l.rgb, (l.rgb*.62 + .05*sweep)*vec3(.86, .97, 1.)*(1. - 1.2*deep) + .05*qgUp(.75, .95, noise(vec2(pIn.x*6., deep*80.) + uTime*.12))*qgSky, qgUp(0., .012, deep));
  p = pIn;
  // pots
  for (int k = 0; k < 5 && uOwn[6] < 0. && p.y < qgSoil + .02; k++) {
    float f = float(k), x = p.x - qgBx[k] - (k == 1 || k == 3 ? -.045 : .045), y = p.y + .575, w = (.044 + .03*qgBig[k])*(.74 + 1.5*y) + .008*qgUp(.122, .126, y), n = clamp(x/w, -1., 1.);
    vec3 clay = mix(vec3(.62, .36, .25), uKind[k]*.75 + .06, .35)*(.8 + .25*noise(vec2(x*24. + f*9., y*60.)));
    l.rgb *= 1. - .3*(1. - qgUp(-.02, .035, length(max(abs(vec2(x + .06*qgDay + .02, y - .08)) - vec2(w*.8, .07), 0.))));
    qgLay(l, clay*(.42 + .6*sqrt(1. - n*n) + .3*n*qgDay)*(1. - .35*qgUp(.112, .122, y)*(1. - qgUp(.122, .124, y)))*qgL*(1. + .2*qgLv[k]), qgEdge(w - abs(x))*qgEdge(.17 - y)*qgEdge(y));
  }
  // the soil
  float ds = qgSoil - .008 - p.y - .172*qgPots, lit = .5;
  for (int i = 0; i < 3 && p.y < qgSoil + .03; i++) {
    float s = float(i), big = exp2(-1.4*s);
    vec2 g = p*vec2(34., 46.)/big;
    ds += (1. - .8*qgPots)*.013*big*noise(vec2(p.x*9./(big*big), s));
    lit -= .6*(noise(g) - noise(g + vec2(-.5*qgDay, .5)));
  }
  lit = sat(lit);
  qgLay(l, mix(vec3(.075, .06, .05), vec3(.34, .27, .21), lit*lit*1.2)*mix(1.15, .5, qgUp(0., .1, ds))*qgL*(.75 + .4*win), qgEdge(ds)*(1. - qgWater*qgUp(.012, .03, ds))*(uOwn[6] > 0. ? 1. - .9*qgWater : 1.));
  qgTendril(l, p - vec2(.75*qgPots, .1*qgPole));
  return l.rgb;
}
const float qgVx[5] = float[5](-.615, -.36, .25, .6, -.06);
const float qgVs[5] = float[5](1.12, .94, .9, 1.2, 1.);
const float qgVy[5] = float[5](-.41, -.395, -.395, -.42, -.405);
const float qgGrown[5] = float[5](.72, .45, .06, 1., .2);
const float qgTilt[5] = float[5](.03, -.02, .015, -.13, .02);
vec3 qgView(vec2 q) {
  vec3 sky = mix(vec3(.76, .82, .85), vec3(.9, .91, .88), qgUp(-.1, .5, q.y));
  vec2 s = q - vec2(.5*qgDay + .05, .22);
  float spring = sat(uOwn[5]), hill = q.y + .06 - .035*sin(q.x*4.1 + 1.), tr = q.x + .5 + .06*q.y;
  vec3 hedge = mix(vec3(.46, .54, .53), vec3(.4, .58, .3), spring), lawn = mix(vec3(.66, .71, .69), vec3(.62, .74, .4), spring);
  sky = mix(sky, vec3(.97, .94, .84), .75*exp(-dot(s, s)*6.)*(.75 + .4*uLevel));
  if (uOwn[7] < 0.) sky = qgMoon(q - vec2(.03, .17), sky*(1. - .3*qgDisc), .31);
  sky = mix(sky, hedge*1.1, .55*exp(-tr*tr*260.));
  sky = mix(sky, hedge, .8*(qgUp(.1, -.05, hill)));
  sky = mix(sky, lawn, qgUp(-.08, -.2, q.y));
  return sky*mix(mix(vec3(1.), vec3(.2, .27, .4), qgNight), vec3(1.04, .84, .62), qgGold);
}
// Half a glass's width.
float qgGlass(float y) { float b = (y - .07)/.075; if (uOwn[6] < 0.) return mix(.031 + .057*exp(-b*b) + .032*qgUp(.19, .265, y), .056 + .11*y + .008*qgUp(.212, .216, y), qgPots); return .031 + .057*exp(-b*b) + .032*qgUp(.19, .265, y); }
float qgRoots(vec2 q, float w, float count, float seed, float grow, float thick) {
  float u = (q.x/w + .07*sin(q.y*38. + seed))*count;
  float id = floor(u), hs = hash11(id + seed*7.3), d = abs(fract(u) - .5 + .35*(hs - .5))*w/count;
  float end = .2 - (.05 + .13*fract(hs*41.))*grow, taper = qgUp(end - .004, end + .06, q.y);
  return qgEdge(.0021*thick*taper*min(w*13., 1.) - d)*step(abs(id + .5), count)*step(.001, taper);
}
void qgVase(inout vec4 l, int k, vec2 p) {
  float sc = qgVs[k], f = float(k), lv = qgLv[k], px = qgPx, here = k == 3 ? 1. : sat(1. + uOwn[1]), small = max(here, .05);
  vec2 q = (p - vec2(qgVx[k], qgVy[k]))/sc, qb = vec2(q.x, q.y - .2)/small + vec2(0., .2);
  float grown = sat(qgGrown[k] + .1*sin(uTravel*TAU/(190. + 21.*f) + f) + .2*qgOn[k] + .04*qgPart[k] + .75*qgBloom - sat(-uOwn[2]));
  vec3 dye = qgDye(k), green = mix(vec3(.3, .46, .2), vec3(.24, .43, .27), fract(f*.37))*(1. + .2*lv);
  qgPx = px/sc/small;
  // leaves, behind the flower and before it
  float y0 = .31, tilt = qgTilt[k]*(1. + .05*sin(uTime*.21 + f))*grown*(1. - .45*qgLush), tall = (.06 + .15*grown)*(1. + .45*qgLush), len = .06 + .1*grown, foot = .03 + (.13 + .09*qgLush)*grown;
  float lh = max(qb.y - y0, 0.)*4., st = qb.x - tilt*lh*lh;
  bool shoot = qb.y > .28 && qb.y < .75 && here > .05;
  vec4 front = vec4(0.);
  for (int i = 0; i < 6 && shoot; i++) {
    float g = float(i), hs = hash21(vec2(g, f + .7)), s = (i % 2 == 0 ? -1. : 1.)*(.3 + .7*fract(hs*9.)), ln = tall*(.75 + .5*hs)*(i == 3 ? .8 : 1.15) + .05, v = sat((qb.y - y0 + .02)/ln), vr = sqrt(v);
    float lean = s*(.02 + .075*grown + .03*uPad*lv + .03*qgLush)*(1. + .04*sin(uTime*.27 + g + f)), ls = lean*1.5*vr/ln;
    float w = .0135*(.7 + .7*v)*sqrt(1. - v*v*v)*(1. + .6*uOwn[3]*(uOwn[3] < 0. ? 1.1 : 1.)), n = (qb.x - lean*v*vr - .006*s)/sqrt(1. + ls*ls)/max(w, 1e-4), an = min(abs(n), 4.);
    float lit = .5 + .5*sign(n)*qgDay*qgUp(0., .2, an) + .1*cos(an*17.), a = qgEdge((1. - abs(n))*w)*step(.001, v)*step(v, .999);
    vec3 c = mix(green*(i < 3 ? .8 : 1.)*(.62 + .5*lit), green*vec3(1.7, 1.5, .8) + .05, (.2 + .25*lv)*(.5 + .5*v));
    c = (c*(.6 + .4*qgUp(0., .35, v)) + .05*(qgUp(.12, 0., an)))*qgL;
    if (i < 3) qgLay(l, c, a); else qgLay(front, c, a);
  }
  if (shoot) qgLay(l, green*1.35*(.8 + .3*sat(.5 - st*80.*qgDay))*qgL, qgEdge(.006 - abs(st))*step(qb.y, y0 + foot));
  // the head, its lowest flowers open first
  vec2 up = normalize(vec2(tilt*foot*32., 1.)), hq = qb - vec2(tilt*foot*foot*16., y0 + foot);
  hq = vec2(dot(hq, vec2(up.y, -up.x)), dot(hq, up));
  float row = .0215, R = (.016 + .036*grown)*(1. + .25*sat(uOwn[3])), jc = floor(hq.y/row + .5), thin = sat(-uOwn[3]);
  bool head = shoot && abs(hq.x) < R*1.4 + .025 && hq.y > -.03 && hq.y < len + .03;
  for (int i = 0; i < 15 && head; i++) {
    int ps = i/3;
    float at = ps < 4 ? float(ps % 2*2 - 1)*(ps < 2 ? 2. : 1.) : 0., r = jc + 1. - float(i % 3), s = r*row/len, th = at*.66 + (mod(r, 2.) - .5)*.5, cs = cos(th), sn = sin(th), hs = hash21(vec2(r + 3., at + f*3.));
    float o = sat(grown*1.7 - s*.9 + .5*(band(s) - .15) + .15*hs - .1), Rr = R*mix(1. - .5*s*s, .35 + 1.15*sqrt(sat(4.*s*(1. - s))), sat(uOwn[3]));
    vec2 m = hq - vec2(Rr*sn, r*row + (hs - .5)*.008 - .006*o);
    m.x /= max(.5, cs);
    float rr = length(m), fr = sat(7. - 7.*s)*mix(.012, .0245, o)*(.9 + .2*hs + .25*sat(uOwn[3])), kk = min(rr/max(fr, 1e-4), 1.), pet = abs(cos(atan(m.y, m.x + 1e-5)*3. + hs*5.));
    float edge = fr*mix(1., mix(.5, .2, thin) + mix(.5, .85, thin)*mix(sqrt(pet), pet, thin), qgUp(.1, .6, o));
    vec3 c = mix(mix(vec3(.36, .5, .25), dye, .25)*(.75 + .5*sat(.5 + m.y/(fr + 1e-4))), mix(dye*.5, mix(dye, vec3(1.), .3), qgUp(.05, .9, kk)), o);
    c *= (1. - .4*o*qgUp(.9, 1., pet)*(1. - kk))*(.72 + .3*cs + .12*sn*qgDay + .12*sat(m.y/(fr + 1e-4)));
    c = mix(c, vec3(.97, .93, .7), .8*o*(qgUp(.2, .12, kk)));
    qgLay(l, c*qgL*(.95 + .15*lv), s > -.02 && s < 1.02 ? qgEdge((edge - rr)*.8) : 0.);
  }
  l.rgb = mix(l.rgb, front.rgb/max(front.a, 1e-3), front.a);
  qgPx = px/sc;
  // the glass
  float w = qgGlass(q.y), t = q.x/w, at = min(abs(t), 1.), top = q.y - .275, inG = qgEdge((w - abs(q.x))*.8)*qgEdge(-top)*qgEdge(q.y), bow = sqrt(1. - at*at), thick = 1. - bow, wet = qgEdge(.2 - q.y);
  vec3 tint = mix(vec3(.9, .95, .94), dye*.85 + .04, .45 + .25*thick + .25*lv*(.6 + uEnergy));
  vec3 c = l.rgb*mix(vec3(.97), tint, .45 + .5*wet)*(1. - (.5 + .2*wet)*qgUp(.66, 1., at));
  float gr = (.55 + .35*grown + .25*lv)*here, fat = 1. + .7*uDrone, rnd = .65 + .35*bow, lip = abs(q.y - .201 - .006*thick);
  for (int i = 0; i < 2 && q.y < .21 && inG > 0.; i++) {
    float g = float(i);
    c = mix(c, mix(vec3(.78, .78, .7)*mix(vec3(1.), tint, .5), vec3(.97, .96, .9), g)*qgL*rnd, (.7 + .2*g)*qgUp(.93, .84, at)*qgRoots(q, w*(.92 - .06*g), 7. + g, f + .3 + 4.8*g, gr*(.8 + .2*g), fat*(.75 + .1*g)));
  }
  c = mix(c, c*.55, .7*(qgUp(.005, 0., lip)));
  vec4 pot = vec4(0.);
  if (uOwn[6] < 0.) {
    pot = vec4(mix(vec3(.62, .36, .25), dye*.8, .4)*(.78 + .24*noise(vec2(t*2. + f*9., q.y*17.)) + .08*noise(vec2(t*13. + f*9., q.y*110.)))*(.4 + .62*bow + .3*t*qgDay)*(1. - .4*qgUp(.195, .212, q.y)*(1. - qgUp(.212, .216, q.y)))*qgL, 1.);
    c = mix(c, pot.rgb, qgUp(0., .6, qgPots)); lip += qgPots;
  }
  qgLay(l, mix(c, .97*qgL, .7*(qgUp(.002, 0., lip)))*(.65 + .35*qgUp(0., .02, q.y)), inG);
  // the bulb
  float bt = sat((qb.y - .196)/.14), bw = .057*sqrt(4.*bt*(1. - bt))*(1. - .3*bt*bt) + .01*qgUp(.6, 1., bt) + 1e-3, n = clamp(qb.x/bw, -.99, .99), as = asin(n);
  float ln = noise(vec2(as*11. + f*5., bt*3.));
  c = mix(vec3(.46, .31, .24), dye*vec3(.5, .4, .45), .4)*(.7 + .45*ln);
  c = mix(c, vec3(.8, .7, .52), .5*qgUp(.62, .95, ln) + .5*(qgUp(.2, 0., bt)));
  qgLay(l, c*(.5 + .55*sqrt(1. - n*n) + .25*n*qgDay)*qgL, bt > 0. && bt < 1. && here > .05 ? qgEdge((bw - abs(qb.x))*here)*(uOwn[6] < 0. ? mix(1., qgUp(.268, .274, q.y), qgUp(0., .6, qgPots)) : 1.) : 0.);
  // lights on the glass
  if (uOwn[6] < 0.) inG *= 1. - qgUp(0., .6, qgPots);
  qgLay(l, tint*qgL, inG*(.18 + .2*thick)*qgUp(.195, .21, q.y));
  float hl = qgUp(.16, 0., abs(t + .58))*qgUp(.02, .06, q.y)*(qgUp(.16, .12, q.y) + qgUp(.2, .23, q.y)) + .8*qgUp(.004, 0., abs(top + .003));
  qgLay(l, min(qgL*1.1, 1.), inG*sat(hl*(.6 + .3*lv + (k == 4 ? uHits : 0.))));
  qgPx = px;
}
// Drops on the pane, or frost ferns from its corners.
vec3 qgPane(vec2 p, vec3 c) {
  float wet = sat(.25 + .5*uTexture + .4*uKeys - .6*sat(uOwn[5]) + .2*uMic), frost = sat(-uOwn[5]);
  for (int i = 0; i < 2; i++) {
    float s = i == 0 ? 34. : 15.;
    vec2 g = p*s + float(i)*3.3, m = fract(g) - .5;
    float hs = hash21(floor(g) + 9.), h2 = fract(hs*61.), h3 = fract(hs*877.), r = (.12 + .2*h3)*qgUp(h2, h2 + .25, wet);
    m += (vec2(h3, fract(hs*313.)) - .5)*.34; m.x *= 1.1;
    float a = step(.02, r)*(qgUp(r, r - s*qgPx*2. - 1e-3, length(m)));
    c = mix(c, mix(c*1.2 + .05, c*.7, sat(.5 + .5*m.y/max(r, .02))), .75*a);
    c += .3*a*(qgUp(r*.4 + 1e-3, 0., length(m - r*vec2(-.3, .4))));
  }
  vec2 q = vec2(abs(p.x + .2) - 1., p.y + .6); float r = length(q), an = atan(q.y, q.x - 1e-4) + .08*sin(r*13. + 3.*p.x);
  float stem = abs(2.*noise(vec2(an*15., r*3.)) - 1.), barb = abs(sin(an*70. + r*95. + stem*9.));
  return mix(c, vec3(.93, .96, .98), frost*sat(1.4 - r*1.1)*(.35 + .6*max(exp(-stem*7.), .8*exp(-barb*5.))));
}
int qgNear(float x, float y) { return x < -.49 ? 0 : x < -.22 ? 1 : x < .095 ? 4 : x < .41 - .1*qgUp(-.2, 0., y) ? 2 : 3; }
vec3 qgBulbs(vec2 p) {
  const float sill = -.335;
  float tall = qgUp(1., .6, uRes.x/uRes.y), near = .85 + .2*tall; // a tall frame holds two whole
  p = vec2(.1*tall, -.42) + (p - vec2(0., -.42))*near; qgPx *= near;
  // the garden, upside down through the water of a glass
  int k = qgNear(p.x, p.y);
  vec2 q = (p - vec2(qgVx[k], qgVy[k]))/qgVs[k];
  float py = p.y;
  if (uOwn[6] > 0. && q.y < 0.) { q.y = -q.y; p.y = 2.*qgVy[k] - p.y; }
  float t = q.x/qgGlass(q.y);
  bool glass = abs(t) < 1. && q.y > 0. && q.y < .275;
  vec2 at = !glass ? p : q.y < .2 ? vec2(qgVx[k]*.6 - t*.35, .22 - (q.y - .02)*2.2) : p + vec2(.1*t*abs(t), 0.);
  vec3 c = qgView(at), paneLight = mix(vec3(1.), qgL, .3 + .5*uCue);
  vec3 pane = qgPane(p, c)*paneLight;
  float bar = (p.x + .2)/.017;
  pane = mix(pane, vec3(.6, .625, .62)*(.88 + .2*qgDay*bar)*qgL, qgEdge((1. - abs(bar))*.017));
  if (uOwn[7] > 0.) {
    vec2 g = abs(fract(vec2(p.x + .2, p.y + .015)/vec2(.146, .185)) - .5); g = (.5 - g)*vec2(.146, .185);
    float lead = .0075*qgPole - min(g.x, g.y);
    pane = mix(pane*(1. + .12*qgPole*(hash21(floor(vec2(p.x + .2, p.y + .015)/vec2(.146, .185))) - .5)), vec3(.17, .18, .19)*(1.3 - .6*qgDay)*qgL, qgEdge(lead));
  }
  // the sill, and the light through the glasses on it
  float e = sill - py, lean = qgDay*1.3;
  vec3 s = mix(vec3(.7, .71, .69), vec3(.84, .83, .79), qgUp(0., .16, e))*(.96 + .05*noise(vec2(p.x*3., py*90.)))*mix(.72, 1., qgUp(0., .02, e));
  int j = qgNear(p.x + lean*(-.385 - py), -1.);
  float d = qgVy[j] - py + .02, x = (p.x - qgVx[j] + lean*d)/qgVs[j], w = .058 + .35*max(d, 0.);
  vec3 g = qgDye(j);
  s *= mix(vec3(1.), mix(g*.35 + .42, vec3(.5), qgPots), .75*(qgUp(w*1.4, w*.7, abs(x)))*qgUp(0., .015, d));
  s += (1. - qgPots)*(g*.5 + .35)*exp(-x*x/(w*w)*9.)*qgUp(0., .05, d)*(.4 + .35*qgLv[j]);
  s *= (.72 + .28*qgUp(-.482, -.478, py))*qgL;
  if (uOwn[6] > 0. && py < sill) s = mix(s, (s*.12 + .6*pow(max(qgView(vec2(p.x, 2.*sill - py + .015*sin(p.x*30.))), 0.), vec3(1.3))*paneLight)*(1. - 1.5*(sill - py)), .85*qgWater);
  vec4 l = vec4(py > sill ? pane : s, 1.);
  vec3 was = l.rgb;
  if (glass) l.rgb = c*paneLight;
  // where a neighbour may reach over, it is drawn first
  int left = qgNear(p.x - .08, p.y), k2 = left == k ? qgNear(p.x + .06, p.y) : left;
  for (int i = k2 != k && p.y > -.1 && qgLush + qgBloom > 0. ? 0 : 1; i < 2; i++) qgVase(l, i == 0 ? k2 : k, p);
  if (uOwn[6] > 0.) l.rgb = mix(l.rgb, was, py < qgVy[k] ? 1. - qgWater*.72*sat(1. - 1.6*(qgVy[k] - py)) : 0.);
  return l.rgb;
}
vec3 render(vec2 p) {
  vec2 p0 = p;
  qgStart(p);
  return sat(uVar < .5 ? qgBeans(p, p0) : qgBulbs(p));
}
