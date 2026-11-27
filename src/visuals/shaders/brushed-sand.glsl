// name: Brushed sand
// a: Marsh
// b: Harbour town
// what: Brown sand on a lit milk glass, drawn by fingers: a wide marsh with water in bare level swipes, flicked reeds, a far line of dabbed trees and one heron standing near; or a steep town at night rubbed out of a dark sheet, its windows and stairs, a quay lamp with its long reflection, a small boat and one under sail.
// follows: Drone deepens the sand at the frame or in the night sky, pad wipes the sky open, texture strews grains, a phrase redraws the heron's neck or fills the sail. The piece bares and tints the water; bands are the reeds or the windows. The loop is one finger crossing, a hit a smear of light that fills in, a cue softens all edges, keys are gaps between grains.
// own: 0 sifted over, a dark night at -1, swept nearly clear at 1; 1 blue glass at -1, ember glass at 1; 2 bare shore with no reeds or trees, or a few cottages at -1, tall thick reeds, or a whole town awake at 1; 3 far off at -1, close to the heron or the boat and lamp at 1; 4 fine black sand at -1, coarse red sand at 1; 5 low horizon, the heron bowed or the mast bare at -1, high water, the neck stretched or the sail full at 1; 6 the heron or boat gone at a half, a bare tree on an islet or a lighthouse at -1, a hut on stilts or a steamer at 1; 7 a moon at -0.5 and mountains too at -1, rain at 0.5 and lying snow at 1
#define bsS smoothstep
float bsD;                  // how deep the sand lies here
vec3 bsGel;                 // the colour of the light under the glass
#define bsStay (1. - bsS(.1, .5, abs(uOwn[6])))
#define bsThen bsS(.45, 1., abs(uOwn[6]))
#define bsMoonK bsS(.0, .5, -uOwn[7])
#define bsPeaks bsS(.4, 1., -uOwn[7])
#define bsFall bsS(.0, .5, uOwn[7])
#define bsSnow bsS(.5, 1., uOwn[7])
float bsHalf, bsPx, bsSoft, bsGain; // half the picture's width, a pixel, how soft an edge lies, how strongly things answer

float bsBell(float x) { return exp(-x*x); }
// 0 below zero, 1 above, over a few grains.
float bsIn(float d, float e) { return bsS(-e, e, d); }
// Distance to a tapered stroke from a to b, and the place along it.
vec2 bsSeg(vec2 p, vec2 a, vec2 b, float ra, float rb) {
 vec2 d = b - a, q = p - a;
 float t = sat(dot(q, d)/dot(d, d));
 return vec2(length(q - d*t) - mix(ra, rb, t), t);
}
// Sand laid on: to the depth amt inside a shape.
void bsLay(float d, float amt) { bsD = mix(bsD, max(bsD, amt), bsIn(-d, bsSoft)); }
// Sand wiped off inside a shape down to what the finger leaves, and pushed up in a ridge outside its edge.
void bsWipe(float d, float left, float ridge, float strong) {
 float m = bsIn(-d, bsSoft)*strong;
 bsD = mix(bsD, min(bsD, left), m);
 bsD += strong*ridge*min(bsD+.35, 1.4)*bsBell((d - 1.6*bsSoft)/(1.5*bsSoft))*(1. - m);
}
// One finger swiped level across: with bristle lines in it and tapering ends.
void bsSwipe(vec2 p, vec2 c, float len, float wide, float bow, float left, float strong) {
 vec2 q = p - c;
 float t = q.x/len;
 if (abs(t) > 1.15 || abs(q.y) > wide+.07+abs(bow)) return;
 q.y += bow*(1. - t*t);
 float w = wide*(sqrt(max(1. - t*t, .0)) - .25*t);
 float line = noise(vec2(q.x*5.+c.y*91., q.y/wide*4.));
 float d = abs(q.y) - w*(.75+.5*noise(vec2(q.x*16., c.x*37.+c.y*71.)))+max(abs(t) - 1., .0);
 bsWipe(d, left+.45*bsS(.6, .9, line), .9, strong);
}
// The heron's neck: two bent lengths through five places. Distance to it.
float bsNeck(vec2 h, vec2 a, vec2 b, vec2 c, vec2 d, vec2 e) {
 float best = 9.;
 vec2 last = a;
 for (int i = 1; i <= 10; i++) {
  float t = float(i)*.2;
  vec2 q = t <= 1.001 ? mix(mix(a, b, t), mix(b, c, t), t) : mix(mix(c, d, t - 1.), mix(d, e, t - 1.), t - 1.);
  float r = mix(.044, .018, sat(t*.62));
  best = min(best, bsSeg(h, last, q, r, r).x);
  last = q;
 }
 return best;
}
void bsHeron(vec2 p, vec2 foot, float size) {
 vec2 h = (p - foot)/size;
 if (h.x < -.62 || h.x > .5 || h.y < -.3 || h.y > 1.25) return;
 float keep = bsSoft;
 bsSoft /= size;
 // the poses of the neck, drawn over through the phrase
 float turn = cos(uTime*.23);
 float up = sat(sat(turn)*sat(turn)*uPhrase*.9+sat(uOwn[5])), low = sat(sat(-turn)*sat(-turn)*uPhrase*.7+sat(-uOwn[5]))*(1. - up);
 vec2 n0 = vec2(-.1, .6);
 vec2 n1 = vec2(-.3, .6)+up*vec2(.08, .1)+low*vec2(.0, .06);
 vec2 n2 = vec2(-.175, .77)+up*vec2(.0, .08)+low*vec2(-.12, -.04);
 vec2 n3 = vec2(-.06, .93)+up*vec2(-.07, .1)+low*vec2(-.2, -.1);
 vec2 n4 = vec2(-.185, .965)+up*vec2(.0, .1)+low*vec2(-.27, -.27);
 vec2 bill = mix(vec2(-.225, -.05), vec2(-.13, -.2), low)+up*vec2(.0, .07);
 vec2 along = bill/length(bill);
 // legs
 float legs = bsSeg(h, vec2(.045, .46), vec2(.07, .235), .017, .008).x;
 legs = min(legs, bsSeg(h, vec2(.07, .235), vec2(.03, .0), .009, .006).x);
 legs = min(legs, bsSeg(h, vec2(.095, .44), vec2(.15, .24), .017, .008).x);
 legs = min(legs, bsSeg(h, vec2(.15, .24), vec2(.135, .02), .009, .006).x);
 bsLay(legs, 2.8*bsStay);
 // the body, the wing folded over it and the tail
 float body = bsSeg(h, vec2(-.06, .575), vec2(.17, .46), .086, .06).x;
 body = smin(body, bsSeg(h, vec2(.1, .5), vec2(.36, .345), .07, .004).x, .04);
 float neck = bsNeck(h, n0, n1, n2, n3, n4);
 float bird = smin(body, neck, .05);
 bird = min(bird, bsSeg(h, n4, n4+along*.05, .028, .017).x);
 bird = min(bird, bsSeg(h, n4+along*.05, n4+bill, .015, .001).x);
 // the plume behind the eye, and the hair of the breast
 bird = min(bird, bsSeg(h, n4+vec2(.0, .018), n4+vec2(.15, -.075)+.2*low*vec2(.0, .4), .010, .001).x);
 bird = min(bird, bsSeg(h, vec2(-.135, .585), vec2(-.15, .44), .013, .001).x);
 bird = min(bird, bsSeg(h, vec2(-.105, .56), vec2(-.105, .4), .013, .001).x);
 // pushed clear all round first, so that it stands off from what is behind
 bsWipe(bird - .022, .12, .35, .8*bsStay*bsS(.25, .4, h.y));
 bsLay(bird, 3.1*bsStay);
 // feathers: thin lines of light taken back with a stick
 vec2 hb = h - vec2(-.06, .575), uv = vec2(dot(hb, vec2(.877, -.48)), dot(hb, vec2(.48, .877)));
 for (int i = 0; i < 4; i++) {
  float k = float(i), v = uv.y - (.042 - .032*k)*(1.15 - 1.9*uv.x) - .25*(uv.x - .2)*(uv.x - .2);
  float d = max(abs(v) - .0075*sat(2. - 4.*uv.x), abs(uv.x - .21 - .015*k) - .16+.02*k);
  bsWipe(d, .3, .1, .95*bsStay*bsIn(-body - .012, .012));
 }
 bsWipe(length(h - n4 - along*.022) - .0085, .05, .0, .95*bsStay);
 bsSoft = keep;
}
// A clump of flicked stems: sixteen, each as tall as its band.
void bsReeds(vec2 p, vec2 root, float wide, float tall, float depth) {
 float y = p.y - root.y;
 if (y < -.02 || y > 1.1*tall+.06 || abs(p.x - root.x) > wide+.35*tall) return;
 float near = 9.;
 for (int i = 0; i < 16; i++) {
  float k = float(i), r = hash11(k+3.7+root.x*13.), r2 = fract(r*47.3);
  float show = bsS(.0, .2, 1.2+1.2*min(uOwn[2], .0) - fract(k*.618));
  if (show <= .0) continue;
  float high = tall*(.4+.42*r2+.3*bsGain*uBands[i])*show, t = y/high;
  if (t > 1.05) continue;
  float lean = (r - .5)*.5+.16+.02*sin(uTime*.31+k*1.7);
  float x = root.x+wide*(r2*2. - 1.)*.7+(fract(k*.618) - .5)*.4*wide+lean*y*(.35+.65*t);
  float w = .0045*show*(1. - .8*sat(t));
  float d = abs(p.x - x)*.93 - w+max(t - 1., .0)*high;
  if (r > .62) d = min(d, max(abs(t - .86) - .09, .0)*high+abs(p.x - x) - .008);
  near = min(near, d);
 }
 bsLay(near, depth);
}

// A round moon rubbed out of the sky, and mountains behind all.
void bsMoon(vec2 q, vec2 c, float r, float base) {
 float d = length(q - c) - r;
 bsD += 1.1*bsMoonK*bsS(.0, .35, d);
 bsD = mix(bsD, min(bsD, .5+4.*max(d, .0)), .6*bsMoonK*bsS(-.25, .0, -d));
 bsWipe(d, .03+.3*bsS(.5, .8, noise(q*11.)), .8, bsMoonK);
 if (uOwn[7] < -.4) {
  for (int i = 0; i < 2; i++) {
   float k = float(i), x = q.x*(1.7+1.2*k)+3.7+5.1*k, y = .0, a = .5;
   for (int j = 0; j < 4; j++) { y += a*abs(fract(x)*2. - 1.); x = x*1.93+.7; a *= .46; }
   float top = base+(.62 - .3*k)*(y - .2)*bsPeaks, m = q.y - top;
   float lit = bsS(.35, .65, noise(rot(.7)*q*vec2(6., 34.))+.9*(q.y - base) - .2);
   bsD = mix(bsD, 2.6 - .5*k - 2.*lit*bsS(.02, .2, q.y - base), bsIn(-m, bsSoft)*bsPeaks);
   bsWipe(abs(m) - .002, .3, .1, .7*bsPeaks);
  }
 }
}
// Rain, or snow: short strokes of a fingernail, or dots of a fingertip, coming down.
void bsWeather(vec2 p) {
 for (int k = 0; k < 3; k++) {
  float fk = float(k), c = .06+.035*fk;
  vec2 g = rot(.3 - .22*bsSnow)*p+fk*3.3;
  g.x += .012*bsSnow*sin(uTime*.5+g.y*9.+fk);
  g = g/(c*vec2(1., 3.2 - 2.2*bsSnow));
  float col = floor(g.x);
  g.y += uTime*(.22+.1*hash11(col+fk))*(1. - .45*bsSnow);
  vec2 id = vec2(col, floor(g.y)), r = hash22(id+fk*19.+.5), f = fract(g) - .5 - (r - .5)*vec2(.7, .3);
  f *= c*vec2(1., 3.2 - 2.2*bsSnow);
  float len = (.06+.03*fk)*(1. - bsSnow)*(.5+.5*r.x);
  float d = length(vec2(f.x, max(abs(f.y) - len, .0))) - mix(.0024, .0035+.0045*r.x*r.x, bsSnow)*(1.+.35*fk);
  bsWipe(d, .06, .15, .95*bsFall*step(r.y, .55+.3*uTexture+.2*bsSnow));
 }
}
// In the marsh: a bare tree on its islet, or a hut on stilts with a landing, and what the water gives back.
void bsStands(vec2 p, float fit) {
 bool tree = uOwn[6] < .0;
 vec2 q = p - vec2(mix(.0, tree ? .34 : .3, fit), tree ? -.17 : -.2);
 float under = bsIn(-q.y, .003);
 vec2 h = vec2(q.x+under*(.012*sin(q.y*95.+.4*sin(uTime*.3))+.01*(noise(vec2(q.y*60., 2.)) - .5)), abs(q.y)*(1.+.25*under));
 float strong = bsThen*(1. - .5*under);
 if (tree) {
  float d = 9., size = 1., g = .02;
  vec2 t = h;
  for (int i = 0; i < 8; i++) {
   float k = float(i), tall = i == 0 ? .17 : .15;
   d = min(d, bsSeg(t, vec2(.0, -.01), vec2(.0, tall), g, g*.72).x*size);
   t.y -= tall*(.78+.2*sin(k*2.1));
   t = rot(.36*sin(k*2.7+.6)+.012*sin(uTime*.23+k))*t;
   t.x = abs(t.x);
   t = rot(-.46 - .1*sin(k*1.9))*t/.76; size *= .76; g *= .96;
  }
  if (under < .5) bsWipe(d - .012, .15, .3, .6*bsThen);
  bsLay(d, 3.1*strong);
  float rim = (.026+.02*noise(vec2(q.x*14., 3.)))*(1. - q.x*q.x*18.) - .004;
  bsLay(max(q.y - rim, -q.y - .5*rim), 2.9*bsThen);
  bsWipe(abs(q.y+.03) - .004+max(abs(q.x) - .24, .0), .1, .6, .9*bsThen);
  for (int j = 0; j < 5; j++) {
   float k = float(j);
   vec2 b = q - vec2(-.75+.1*k+.03*sin(k*4.)+.06*sin(uTime*.031+k), .42+.045*sin(k*2.3));
   bsLay(abs(b.y+.35*abs(b.x) - 4.*b.x*b.x - .004*sin(uTime*1.1+k*2.)) - .0026+3.*max(abs(b.x) - .028, .0), 2.6*bsThen);
  }
 } else {
  float px = h.x - .3, deck = abs(h.y - .16) - .009;
  float post = max(abs(fract(h.x/.094+.5) - .5)*.094 - .0062, h.y - .16);
  float d = max(min(deck, post), -h.x - .2);
  float wall = max(abs(h.x) - .155, abs(h.y - .24) - .085), roof = max(.315 - h.y, (h.y - .315)*.8 - .55*(.2 - abs(h.x)));
  float rail = max(min(abs(h.y - .22) - .004, max(abs(fract(h.x/.047) - .5)*.047 - .003, abs(h.y - .19) - .03)), .155 - h.x);
  d = min(min(d, min(wall, roof)), min(rail, bsSeg(h, vec2(-.2, .17), vec2(-.27, .0), .006, .006).x));
  d = min(d, max(abs(h.x - .07) - .015, abs(h.y - .39) - .05));
  if (under < .5) bsWipe(d - .016, .1, .3, .8*bsThen);
  bsLay(d, 3.3*strong);
  // planks and thatch drawn with a stick, a window
  bsWipe(max(abs(fract(h.y/.021) - .5)*.021 - .0016, wall+.012), .8, .1, .55*strong);
  bsWipe(max(abs(fract((h.x+.25*sign(h.x)*(.4 - h.y))/.026) - .5)*.026 - .0022, roof+.01), .7, .1, .6*strong);
  vec2 w = vec2(abs(h.x+.06) - .028, h.y - .25);
  bsWipe(max(abs(w.x) - .022, abs(w.y) - .026), .02, .6, bsThen*(1. - .3*under));
  bsD -= .6*bsThen*exp(-dot(w, w)*250.)*min(bsD, 1.);
  // smoke from the chimney, one swipe
  vec2 m = q - vec2(.07, .45);
  float sx = m.x+.28*m.y+.03*sin(m.y*13. - uTime*.21)*sat(m.y*8.);
  bsWipe(max(abs(sx) - .008 - .07*max(m.y, .0), -m.y), .15, .4, .8*bsThen);
 }
}
// In the harbour: a lighthouse on its rock, or a steamer with all its portholes.
void bsCalls(vec2 p, float quay) {
 if (uOwn[6] < .0) {
  vec2 q = p - vec2(.5, quay), l = q - vec2(.0, .43);
  float a = atan(l.y, l.x), r = length(l), turn = .12*sin(uTime*.17);
  float beam = min(abs(a - .16 - turn), abs(abs(a) - PI+.13*sign(a)+turn*sign(a)));
  bsWipe((beam - .085 - .03*noise(vec2(a*30., 1.)))*max(r, .03), .06+.5*bsS(.5, .8, noise(vec2(r*4., a*40.)))+.5*r, .4, .95*bsThen);
  bsD = mix(bsD, min(bsD, .1+8.*r), .85*bsThen*bsS(-.2 - .06*uLow, .0, -r));
  float rock = q.y - .07+.9*q.x*q.x*(1.+4.*step(q.x, .0))+.05*abs(fract(q.x*9.+2.*q.y) - .5)+.03*abs(fract(q.x*23.) - .5);
  bsLay(max(rock, -q.y - .02), 3.3*bsThen);
  bsWipe(abs(rock) - .005 - .012*noise(q*30.), .3, .2, .8*bsThen*bsIn(q.y+.01, .01));
  float half_ = .055 - .06*q.y, tower = max(abs(q.x) - half_, max(q.y - .385, .03 - q.y));
  bsLay(tower - .006, 3.3*bsThen);
  float band = step(.5, fract(q.y/.15+.1));
  bsWipe(tower+.003, mix(.1+1.6*bsS(.0, 1., -q.x/max(half_, .01)), 3., band), .1, .95*bsThen);
  bsLay(max(abs(q.x) - .05, abs(q.y - .39) - .008), 3.4*bsThen);
  bsLay(min(max(abs(q.x) - .026, abs(q.y - .43) - .034), max(abs(q.x) - .034+.7*(q.y - .46), abs(q.y - .482) - .022)), 3.4*bsThen);
  bsWipe(max(abs(l.x) - .018, abs(l.y) - .024), .0, .5, bsThen);
  float rx = abs(q.x+.02*(noise(vec2(q.y*60., 4.)) - .5)) - (.02 - .1*q.y)*(.3+noise(vec2(q.y*85., 8.)));
  bsWipe(max(rx, q.y+.03), .08, .5, .9*bsThen);
 } else {
  vec2 q = (p - vec2(.3, quay - .06+.002*sin(uTime*.33)))/1.3;
  float bow = q.x < .0 ? .9 : .45;
  float sheer = .085+.14*q.x*q.x, hull = max(max(q.y - sheer, -.05 - q.y), (abs(q.x) - .42 - bow*.25*(q.y - .03))*.9);
  vec2 u = q - vec2(.03, .0);
  float decks = min(max(abs(u.x) - .27, abs(u.y - .115) - .03), max(abs(u.x+.03) - .2, abs(u.y - .165) - .024));
  float fx = abs(q.x - .06 - .12*q.y) - .085, fun = max(abs(fx) - .03, abs(q.y - .25) - .075);
  float mast = min(bsSeg(q, vec2(-.31, .08), vec2(-.3, .4), .005, .003).x, bsSeg(q, vec2(.36, .08), vec2(.37, .35), .005, .003).x);
  // smoke, one long swipe of the thumb
  float sx = q.x - .08, sy = q.y - .34 - .2*sqrt(max(sx, .0)+.0001) - .02*sin(sx*11. - uTime*.15);
  bsWipe(max(abs(sy) - .02 - .1*max(sx, .0), -sx - .08), .25+.7*bsS(.4, .8, noise(vec2(sx*6., sy*40.))), .5, .8*bsThen);
  float all_ = min(min(hull, decks), min(fun, mast));
  bsWipe(all_ - .012, .5, .2, .6*bsThen);
  bsLay(all_, 3.4*bsThen);
  bsWipe(max(abs(q.y - sheer+.006) - .004, abs(q.x) - .4), .1, .3, .9*bsThen);
  bsWipe(max(fun+.004, abs(q.y - .275) - .022), .4, .2, .9*bsThen);
  bsWipe(bsSeg(q, vec2(-.3, .39), vec2(.0, .31), .002, .002).x, .4, .2, .8*bsThen);
  for (int i = 0; i < 4; i++) {
   float k = float(i), n = k < 1.5 ? .033 : .028;
   vec2 w = vec2((fract(q.x/n) - .5)*n, q.y - (k < .5 ? .005 : k < 1.5 ? .045 : k < 2.5 ? .113 : .163));
   float lit = bsS(.0, .15, .62+.4*bsGain*uBands[int(mod(floor(q.x/n)+20.+k*5., 16.))] - hash21(vec2(floor(q.x/n), k)));
   float in_ = step(abs(q.x - (k < 1.5 ? .0 : .015)), k < 1.5 ? .37 : k < 2.5 ? .26 : .18);
   bsWipe(k < 1.5 ? length(w) - .0075 : max(abs(w.x) - .008, abs(w.y) - .009), .03, .4, lit*in_*bsThen);
   float ry = -.06 - q.y;
   bsWipe(max(abs(w.x+.01*(noise(vec2(q.y*80., k)) - .5)) - .006*noise(vec2(q.y*70., floor(q.x/n))), max(-ry, ry - .07 - .05*k)), .2, .4, .8*step(2.5, k)*in_*bsThen);
  }
 }
}

void bsMarsh(vec2 p) {
 float fit = sat(bsHalf/.85);
 float zoom = uOwn[3] > .0 ? 1. - .36*uOwn[3] : 1. - .55*uOwn[3];
 vec2 eye = vec2(.36*fit, uOwn[3] > .0 ? .12 : -.12), q = (p - eye)*zoom+eye;
 float side = p.x/max(bsHalf, .3), season = uOwn[2], tide = .06+.16*uOwn[5], night = uOwn[0];
 // the sift of the sky, dragged on the slant by the side of a hand
 vec2 s = rot(-.16)*q;
 float drag = noise(s*vec2(2.2, 17.))*.6+noise(s*vec2(5., 48.)+9.)*.4;
 float high = sat((q.y - tide - .02)/.45);
 bsD = .1+.55*high+.9*bsS(.42, .75, drag)*(.35+.65*high)+.25*noise(q*3.);
 // the pad wipes the sky open in one long arc
 float arc = q.y - tide - .21 - .1*q.x+.1*(q.x+.1)*(q.x+.1);
 float w = .05+.07*uPad+.03*uSpace;
 bsWipe(abs(arc+.02*(drag - .5)) - w*(.6+.4*noise(q*vec2(3., 8.))), .08+.5*bsS(.5, .8, noise(vec2(q.x*3., arc*50.))), .5, .75+.25*uPad);
 bsD += 1.3*bsFall;
 if (uOwn[7] < .0) bsMoon(q, vec2(-.2*fit, tide+.26), .085, tide);
 // two treelines of fingertip dabs
 for (int k = 0; k < 2; k++) {
  float fk = float(k), cw = .052 - .014*fk, gx = q.x/cw+7.3*fk, base = tide+.007+.018*fk;
  float d = 9.;
  for (int i = -1; i <= 1; i++) {
   float id = floor(gx)+float(i), r = hash11(id+40.*fk);
   vec2 c = vec2((id+.5+.5*(r - .5) - gx)*cw, (q.y - base - .02*r*(1.+noise(vec2(id*.23, 3.+fk))*2.))/(1.+1.1*max(season, .0)));
   d = min(d, length(vec2(c.x, max(c.y*.75, .0))) - cw*(.42+.26*r));
  }
  float gap = bsS(.3, .55, noise(vec2(q.x*2.6+5.*fk, 8.)));
  bsLay(max(d, base - .012 - q.y), gap*(1. - .45*fk)*1.45*sat(1.+season));
 }
 // the water: level drags of the hand, and the swipes that bare the glass
 float wet = 1. - bsIn(q.y - tide, .004);
 float lines = noise(q*vec2(1.6, 46.)+3.)*.55+noise(q*vec2(5., 110.))*.45;
 float pool = mix(.28, .75, bsS(-.5, .6, -side))+1.5*bsS(.52, .8, lines)*bsS(-.12, .5, -q.y)+.8*bsS(.6, .75, lines);
 bsD = mix(bsD, pool+1.1*bsBell((q.y - tide+.012)/.012), wet);
 if (wet > .0) {
  for (int i = 0; i < 8; i++) {
   float k = float(i), r = hash11(k+2.3), deep = (k+.5)/8.;
   vec2 c = vec2(mix(-.5, .62, fract(k*.618+.1))*(.4+.6*fit)+.02*sin(uTime*.05+k), tide - .03 - .46*pow(deep, 1.25));
   vec4 m = piece(vec2(.5+p.x/1.8, deep));
   float open = sat(m.a*1.4)*bsGain;
   bsGel += (m.rgb - bsGel*m.a)*bsBell((q.y - c.y)*22.);
   bsSwipe(q, c, .3+.35*r, (.011+.028*deep)*(.75+.8*open), .02*(r - .4), .03, .9);
  }
 }
 if (uOwn[7] < .0) bsD -= bsMoonK*wet*sat(bsD - .05)*bsS(-.1, .0, -abs(q.x+.2*fit+.05*(lines - .5)))*bsS(.25, .5, lines);
 // the whole sheet sifted over, or swept nearly clear
 bsD = max(bsD+1.1*max(-night, .0)*bsS(.02, .7, bsD+.25*noise(q*vec2(3., 9.))+.15) - .75*max(night, .0)*bsS(-1.6, -.4, -bsD), .02);
 // the bank in front, and stems flicked out of it
 float bank = q.y+.43 - .05*noise(vec2(q.x*3., 1.)) - .14*bsS(.0, .75, -q.x)+.05*bsS(-.1, .3, q.x);
 bsLay(bank, (2.4+.8*noise(q*vec2(8., 30.)))*(1. - .8*bsSnow));
 bsD += .5*bsBell((bank - .004)/.012);
 bsReeds(q, vec2(mix(-.12, -.36, fit), -.4), .24+.1*max(season, .0), .62+.2*max(season, .0), 2.7);
 if (season > .0) bsReeds(q, vec2(mix(.2, .08, fit), -.5), .3, .75*season, 2.6);
 bsReeds(q, vec2(.83, -.46), .13, .36, 2.5);
 // the sand left thick at the frame, its edge ragged by fingers
 float deep = .015+.06*uDrone - .03*uSpace - .05*night - .2*abs(uOwn[7]);
 float lobes = noise(vec2(p.x*5., 2.))*.1+noise(vec2(p.x*17.+p.y*9., 5.))*.03;
 float lobes2 = noise(vec2(p.y*6., 7.))*.11+noise(vec2(p.y*19., 11.))*.03;
 float frame = smin(.5 - p.y - deep - lobes - .07*sat(-side), p.x+bsHalf - (deep+lobes2+.02)*(.4+.6*fit), .12);
 float rake = noise(rot(-.45)*p*vec2(3., 42.))*.6+noise(rot(-.45)*p*vec2(7., 90.))*.4;
 bsD += 1.5*bsIn(.1 - frame, .1)*bsS(.35, .7, rake);
 float heap = frame+.09*bsS(.5, .75, rake);
 bsLay(heap, 2.5+.9*rake);
 // stems flicked out of the dark with a stick
 for (int i = 0; i < 7 && q.y < -.12 && q.x < -.2; i++) {
  float k = float(i), tall = .17+.2*fract(k*.618), t = (q.y+.52)/tall;
  if (t > 1.1) continue;
  float x = -.84*bsHalf/.89+.056*k+.03*sin(k*5.)+(.02+.05*sin(k*3.1+.2*sin(uTime*.2)))*t*t;
  bsWipe(abs(q.x - x) - .0062*(1. - .75*sat(t))+max(t - 1., .0)*tall, .3, .2, .9*bsS(1., 2.2, bsD)*sat(1.+season));
 }
 // rings where the legs stand, then the bird
 vec2 foot = vec2(mix(-.1, .43, fit), -.37);
 if (abs(uOwn[6]) > .45) bsStands(q, fit);
 if (abs(uOwn[6]) < .5) {
 vec2 rg = (q - foot - vec2(.05, .0))/vec2(.15, .028);
 bsWipe(abs(length(rg) - 1.)*.028 - .005, .1, .8, .85*bsStay);
 bsWipe(length(rg*vec2(1.5, 2.))*.014 - .012, .15, .6, .8*bsStay);
 vec2 mir = vec2(q.x - foot.x+.012*sin(q.y*90.), foot.y - q.y);
 bsLay(max(abs(mir.x - .03) - .006, -mir.y), 1.5*bsStay);
 bsHeron(q, foot, mix(.5, .62, fit));
 }
 if (uOwn[7] > .0) bsWeather(p);
}

// b: the town, taken away out of a sheet of dark sand.
void bsTown(vec2 p) {
 float fit = sat(bsHalf/.85);
 vec2 eye = vec2(.28*fit, -.2), q = (p - eye)*(uOwn[3] > .0 ? 1. - .36*uOwn[3] : 1. - .5*uOwn[3])*(1.6 - .6*fit)+eye;
 q.x += .46*(1. - fit);
 q.y -= .12*uOwn[5];
 float quay = -.16, day = uOwn[0];
 vec2 s = rot(.12)*q;
 float drag = noise(s*vec2(1.8, 15.))*.6+noise(s*vec2(4.5, 44.)+4.)*.4;
 // the sky, rubbed thin behind the hill
 float far = length((q - vec2(.42, .0))*vec2(.7, 1.1));
 bsD = .35+2.5*bsS(.0, .8+.2*uPad, far)+1.*bsS(.4, .8, drag)+1.5*uDrone*bsS(.1, .5, p.y);
 for (int i = 0; i < 3; i++) {
  float k = float(i);
  bsSwipe(rot(-.2 - .05*k)*(q - vec2(.3+.2*k - .15*k*k, .18+.11*k)), vec2(.0), .62 - .07*k, .014+.022*uPad+.004*k, .05, .25+.25*k, (.7+.3*uPad)*(1. - .85*max(abs(uOwn[7]), bsThen*step(uOwn[6], .0))));
 }
 bsD = max(bsD - 1.*sat(day)*bsS(-.2, .4, q.x), .1)+1.*sat(-day);
 if (uOwn[7] < .0) bsMoon(q, vec2(.16, .2), .1, quay+.12);
 // the far headland
 bsLay(max(q.y+.035 - .05*noise(vec2(q.x*5., 2.)), -.2 - q.y), 2.7);
 // the hill, a dark mass
 float hill = q.y - (.4 - .62*bsS(-.72, .3, q.x)) - .02*noise(vec2(q.x*12., 3.));
 bsLay(hill, 3.4);
 // six terraces of houses, the highest first
 for (int j = 5; j >= 0; j--) {
  float fj = float(j), base = quay+.085*fj+.012*sin(q.x*6.+fj*2.), cw = .115 - .006*fj;
  float gx = q.x/cw+fj*.37+20., id = floor(gx), r = hash21(vec2(id, fj+3.)), r2 = fract(r*57.), r3 = fract(r*331.);
  float edge = .24 - .145*fj;                 // where the terrace ends
  float mid = (id+.5 - fj*.37 - 20.)*cw;
  if (mid > edge+.02 || q.y < base - .01 || q.y > base+.2) continue;
  float show = bsS(-1., .0, uOwn[2]*6.+5. - fj+r);
  if (show <= .0) continue;
  vec2 h = vec2((fract(gx) - .5)*cw, q.y - base);
  float hw = cw*(.3+.17*r2), high = .065+.055*r3, gable = r > .45 ? .75*(hw - abs(h.x)) : .004;
  float wall = max(abs(h.x) - hw, max(h.y - high, -h.y)), house = max(abs(h.x) - hw, max((h.y - high - gable)*.8, -h.y));
  bsLay(house, 3.4);
  // the wall rubbed half bare, its roof line drawn with a stick
  bsD = mix(bsD, mix(.0, .7, r2)+.3+1.*bsS(.05, .9, length(q - vec2(.2, .0))) - .5*max(uOwn[2], .0)+.6*noise(h*vec2(60., 20.))+1.1*bsS(-.3, .6, -h.x/hw) - .25*uLow - .9*sat(day)+.8*sat(-day)+.8*bsSnow, bsIn(-wall - .003, bsSoft)*show);
  bsWipe(abs(max((h.y - high - gable)*.8, abs(h.x) - hw)) - .0034+step(h.y, high*.9), .3, .2, .85*show);
  if (uOwn[7] > .5) bsWipe(max(abs(h.x) - hw - .005, abs(h.y - high - gable - .003) - .013), .02, .2, .95*bsSnow*show);
   vec2 wc = vec2(h.x/(hw*.95), (h.y - .018)/.034), wi = floor(wc);
  vec2 wf = (fract(wc) - .5)*vec2(hw*.95, .034);
  float rw = hash21(wi+vec2(id*7., fj*13.)), bnd = uBands[int(mod(id*5.+fj*3., 16.))];
  float lit = bsS(.0, .15, .42+.5*uOwn[2]+.35*bsGain*bnd - rw)*step(abs(wc.x), 1.)*step(.0, wc.y)*step(wi.y, floor((high - .02)/.034) - .5)*show;
  bsWipe(max(abs(wf.x) - .0085, abs(wf.y) - .0115), .04, .5, lit);
  bsD -= lit*.5*exp(-dot(wf, wf)*2500.)*min(bsD, 1.);
 }
 // the stairs, up between the houses
 vec2 st[4] = vec2[4](vec2(.06, quay), vec2(-.2, .02), vec2(-.09, .12), vec2(-.46, .32));
 for (int i = 0; i < 3; i++) {
  vec2 g = bsSeg(q, st[i], st[i+1], .0, .0);
  bsLay(g.x - .032, 3.2);
  float n = .0155 - .0015*float(i), y = (fract((q.y - quay)/n) - .5)*n;
  bsWipe(max(abs(y) - .0034, g.x - .024+.003*float(i)), .35, .3, .9*bsS(.0, .06, g.y)*(1. - .3*float(i)));
 }
 // the harbour: dark again, with level swipes
 float wet = bsIn(quay - q.y, bsSoft);
 float lines = noise(q*vec2(2., 60.))*.6+noise(q*vec2(7., 140.))*.4;
 float sea = 2.9 - .9*bsS(-.3, .5, q.x) - 1.5*bsS(.5, .75, lines)*bsS(-.5, .4, q.x) - 1.2*sat(day)+.5*sat(-day);
 float col = noise(vec2(q.x*40.+2.5*(lines - .5), 1.));
 sea -= (2.6+1.2*uOwn[2])*bsS(.55 - .1*uOwn[2], .72, col)*bsS(.32, .5, lines)*bsS(-.35, .0, -q.x)*bsS(-.44, -.2, q.y)*(.75+.4*uMid);
 bsD = mix(bsD, max(sea, .08), wet);
 if (wet > .0) for (int i = 0; i < 5; i++) {
  float k = float(i), deep = (k+.5)/5.;
  vec4 m = piece(vec2(.5+p.x/1.8, deep));
  vec2 c = vec2(mix(.0, .75, fract(k*.618))+.02*sin(uTime*.05+k), quay - .04 - .28*deep);
  bsGel += (m.rgb - bsGel*m.a)*bsBell((q.y - c.y)*20.);
  bsSwipe(q, c, .16+.1*k, (.004+.008*deep)*(.6+1.4*sat(m.a*1.4)*bsGain), .01, .15, .85);
 }
 // a small boat left in front, on a rubbed patch
 vec2 rb = q - vec2(-.47, -.35+.002*sin(uTime*.37));
 if (abs(rb.x) < .4) {
  bsSwipe(rb, vec2(.02, -.012), .33, .017, -.004, .5, .85);
  float rim = .012+.55*rb.x*rb.x;
  bsLay(max(rb.y - rim, max(-.032+.6*max(abs(rb.x) - .09, .0) - rb.y, abs(rb.x) - .15)), 3.3);
  bsWipe(max(abs(rb.y - rim) - .0038, abs(rb.x) - .147), .1, .3, .9);
 }
 // the edge of the quay
 bsWipe(abs(q.y - quay - .006) - .004+2.*max(q.x - .26, .0), .35, .4, .95);
 bsLay(max(abs(q.y - quay+.008) - .009, q.x - .27), 3.3);
 // the lamp on its post, its ring of rubbed light, its long reflection
 vec2 l = q - vec2(.2, .005);
 float glow = 1.+.5*uLow+.4*uMic;
 bsD = mix(bsD, min(bsD, .25+10.*length(l)/glow), .8*bsS(-.15 - .1*uSpace, .0, -length(l))*(.75+.25*noise(l/(length(l)+1e-4)*4.+9.)));
 bsLay(max(abs(l.x) - .0035, max(l.y+.01, quay - q.y)), 3.2);
 bsWipe(length(l) - .017, .0, .6, 1.);
 float ww = .012+.05*(quay - q.y);
 float rx = abs(l.x+.02*(noise(vec2(q.y*60., 4.)) - .5)) - ww*(.35+noise(vec2(q.y*95., 8.)));
 bsWipe(max(rx, q.y - quay+.02), .06, .6, .95*bsS(-.5, -.42, q.y));
 if (abs(uOwn[6]) > .45) bsCalls(q, quay);
 // the boat: hull, mast, boom, stays, and a sail that fills
 vec2 b = q - vec2(.52, -.235+.003*sin(uTime*.4));
 b = rot(.02*sin(uTime*.31))*b;
 if (abs(uOwn[6]) < .5 && abs(b.x) < .36 && b.y > -.14 && b.y < .62) {
  float fill = .3+.3*uOwn[5]+1.1*uPhrase*(.5+.5*cos(uTime*.23));
  float spread = sat(.75+uOwn[5]*.8);
  float luff = b.x+.012, top = .44, y = sat((b.y - .07)/(top - .07));
  float leech = -.2*spread*pow(1. - y, .8) - .05*fill*spread*sin(PI*y);
  float sail = max(max(luff, leech - b.x), max(.07 - b.y, b.y - top));
  if (spread > .05) {
   bsWipe(sail, .12+.5*bsS(.35, .8, noise(vec2((b.x - leech)*14., b.y*4.)))+.2*y, .6, .95*bsStay);
  }
  float jib = max(max(.02 - b.x, (b.x - .02)*.86+(b.y - .36)*.5), .09+.1*fill*sin(PI*sat(b.x*5.))*.2 - b.y);
  bsWipe(jib, .4+.8*noise(b*vec2(30., 6.)), .5, .75*spread*bsStay);
  float rig = bsSeg(b, vec2(.005, .5), vec2(.23, .04), .0028, .0028).x;
  rig = min(rig, bsSeg(b, vec2(.005, .5), vec2(-.21, .04), .0028, .0028).x);
  rig = min(rig, bsSeg(b, vec2(.16, .03), vec2(.27, .07), .003, .0015).x);
  bsWipe(rig, .2, .3, .9*bsStay);
  bsLay(bsSeg(b, vec2(.002, .0), vec2(.002, .52), .006, .003).x, 3.*bsStay);
  bsLay(bsSeg(b, vec2(.0, .065), vec2(-.22, .06), .005, .003).x, 3.*bsStay);
  float sheer = .02+.42*b.x*b.x+.05*b.x;
  float hull = max(b.y - sheer, -.045+.5*max(abs(b.x - .01) - .14, .0) - b.y);
  bsLay(max(hull, abs(b.x) - .215), 3.4*bsStay);
  bsWipe(max(abs(b.y - sheer) - .0045, abs(b.x) - .205), .05, .4, .95*bsStay);
 }
 if (uOwn[7] > .0) bsWeather(p);
}

vec3 render(vec2 p) {
 bsHalf = .5*uRes.x/uRes.y; bsPx = 1./uRes.y;
 bsGain = .5+uEnergy;
 float shake = 4.*uCue*(1. - uCue);
 bsSoft = .0026+.01*shake+.0006*(.5 - uTone);
 bsGel = vec3(.0);
 float grain = max(.0036, 1.9*bsPx)*(1.+.7*max(uOwn[4], .0)+.3*min(uOwn[4], .0));
 vec2 g = rot(.4)*p/grain;
 // a hand's line is never true, and the edges creep
 vec2 wob = vec2(noise(p*13.+.4*sin(uTime*.11)), noise(p*13.+31.)) - .5;
 vec2 q = p+.006*wob+shake*.012*(vec2(noise(p*40.), noise(p*40.+17.)) - .5);
 bsD = .0;
 if (uVar < .5) bsMarsh(q); else bsTown(q);
 // the loop: one finger going slowly across
 float lx = mix(-1.15, 1.15, uLoop)*(bsHalf+.1), ly = (uVar < .5 ? .13 : -.4)+.02*sin(q.x*3.);
 float tail = sat(1. - (lx - q.x)/.5)*bsS(.0, .1, uLoop)*bsS(-1., -.9, -uLoop);
 bsWipe(max(abs(q.y - ly) - .02*sqrt(tail*bsS(.0, .03, lx - q.x)+1e-4), q.x - lx), .1, .3, .85*tail);
 // a hit: a fingertip's smear, which fills in again
 vec2 hc = (uVar < .5 ? vec2(-.22 - .3*bsMoonK, .29) : vec2(-.04, -.365))*vec2(sat(bsHalf/.85), 1.)+vec2(.05*sin(uTime*.13), .025*cos(uTime*.17));
 float hr = (.1+.05*max(uOwn[0], .0)+.06*bsFall)*sqrt(uHits+1e-5);
 vec2 hq = rot(.1)*(q - hc)*(uVar < .5 ? vec2(.6, 1.8) : vec2(.4, 1.8));
 bsWipe(length(hq) - hr*(.65+.6*noise(hq*24.)), .03+.4*bsS(.6, .9, noise(hq*vec2(9., 50.))), .5, bsS(.0, .25, uHits));
 if (uOwn[0] > .0) bsD += 1.5*uOwn[0]*uHits*bsBell((length(hq) - hr)/.03)*noise(hq*40.);
 bsD *= 1. - .45*uHits*exp(-dot(hq, hq)*70.);
 bsGel = mix(bsGel, uKind[4], (.35+.45*max(uOwn[0], .0))*uHits*exp(-dot(hq, hq)*60.));
 // grains
 float n1 = noise(g), n2 = noise(rot(.7)*g*1.37+40.), n3 = noise(rot(1.9)*g*.61+9.);
 float cover = 1. - exp(-1.25*bsD);
 float aa = .1+.1*(.5 - uTone)+.1*sat(1. - .0036/bsPx*.5);
 float top = mix(.1, .94, cover) - .06;
 float s1 = bsS(-aa, aa, top - n1), s2 = bsS(-aa, aa, top - .02 - n2), s3 = bsS(-aa, aa, top - .1 - n3);
 float loose = .02+.1*uTexture;
 float strew = bsS(.93 - loose, .96 - loose, noise(g*.83+3.*vec2(sin(uTime*.05), cos(uTime*.041))))*.9;
 float dens = .16*bsD+.75*s1+.8*s2+.7*s3+strew;
 dens += .9*bsS(1.2, 3.4, bsD)*(.6+.4*n2);
 // a key: single gaps between grains
 float gap = bsS(.86, .9, noise(g*.5+77.))*step(.6, hash21(floor(g*.12)));
 dens *= 1. - .9*uKeys*gap;
 // the lamp under the glass
 vec2 lc = p - (uVar < .5 ? vec2(.5*bsHalf, -.22) : vec2(.25*bsHalf, -.05));
 float lamp = .58+.5*exp(-dot(lc, lc*vec2(1.3, 2.3)));
 lamp *= .97+.03*sin(uTime*.19)+.06*uLevel+.05*uMic+.1*uCue*exp(-dot(lc, lc)*4.);
 vec3 glass = vec3(1., .94, .8)*vec3(pow(lamp, .75), lamp, pow(lamp, 1.25));
 glass *= mix(vec3(1.), uOwn[1] < .0 ? vec3(.72, .9, 1.22) : vec3(1.1, .72, .52), abs(uOwn[1]));
 float gelL = max(max(bsGel.r, bsGel.g), bsGel.b);
 glass = mix(glass, glass*(.45+.75*bsGel/max(gelL, .05)), .75*sat(gelL));
 vec3 soak = vec3(.62, .98, 1.5);
 soak = mix(soak, uOwn[4] < .0 ? vec3(1.05, 1.07, 1.1) : vec3(.42, 1.2, 1.7), abs(uOwn[4]));
 vec3 colr = glass*exp(-dens*soak*1.05);
 // a little of the room on the top of the heap
 colr += vec3(.05, .038, .03)*s1*(.4+.9*n2)*bsS(.6, 2.5, bsD);
 return clamp(colr, .0, 1.);
}
