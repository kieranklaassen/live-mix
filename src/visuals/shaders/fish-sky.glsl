// name: Fish's sky
// a: Open water
// b: Under ice
// what: Lying on the bottom of a lake and looking up: the world squeezed into one bright round window, trees, reeds and a wading bird leaning in from its rim, lily pads and weed in the dark green water about it; or the same window frozen over, milky, with white cracks, stacked flat bubbles and one clear round hole.
// follows: Once round the rim is the loop: trees, reeds and bubbles grow and take colour where the piece is loud. Drone swells the water or lights the deep ice, pad the sky, texture brings ripples and silt, a phrase sends birds, tints leaves or cracks, the spectrum shivers the rim or lights the cracks; a hit drops one ring, a cue passes a shadow over, keys rain.
// own: 0 the hour: 1 night with stars and a moon, -1 a low sun and a coloured sky; 1 the depth: 1 close under the surface, the window fills the picture, -1 deep down, it is small and far; 2 the bank: 1 a tall wood closes over, -1 bare, only water to the rim; 3 the water: 1 clear and bright over pale sand with a net of light (b: white ice), -1 brown and black (b: clear black ice); 4 1 rain rings everywhere (b: the ice broken in plates), -1 a carpet of lily pads (b: crowded with bubbles); 5 1 a shoal of fish goes round, -1 jellyfish rise; 6 1 shafts of light, -1 thick murk; 7 1 the window broken by a swell, -1 combed into rings
// A soft step from a to b, whichever is the larger.
float fsS(float a, float b, float x) { x = sat((x-a)/(b-a)); return x*x*(3.-2.*x); }
vec2 fsSun = vec2(-.3, .46);
float fsPx;
float fsNight, fsDusk, fsClear, fsPeat;
vec3 fsSq(int k) { return uKind[k]*uKind[k]; }
float fsBlur;
// The colours of the sounds, made into those of stained glass.
vec3 fsGlass(vec4 m) { vec3 h = m.rgb/max(m.a, .02); return h*h*1.1+h*.12; }
float fsSeg(vec2 p, vec2 a, vec2 b, float r0, float r1) {
 vec2 d = b-a; float t = sat(dot(p-a, d)/dot(d, d));
 return length(p-a-d*t)-mix(r0, r1, t);
}
float fsInk(float d) { return fsS(fsBlur, -fsBlur, d); }
// The slope of a ring that has run out to R.
vec2 fsRing(vec2 u, vec2 c, float R, float k) {
 vec2 d = u-c; float r = length(d)+1e-3, x = (r-R)*k;
 return d/r*sin(x*2.2)*exp(-x*x*.45);
}
// How the water tips at a place.
vec2 fsSlope(vec2 u, float t) {
 float big = .011+.021*uDrone, fine = .004+.009*uTexture+.003*uHigh;
 vec2 s = vec2(.86, .5)*cos(dot(u, vec2(3.1, 1.8))+t*.43)*big
    + vec2(-.42, .9)*cos(dot(u, vec2(-2.4, 5.2))-t*.37+1.)*big;
 vec2 w = u+.05*vec2(sin(u.y*7.+t*.3), sin(u.x*6.-t*.26));
 s += vec2(.7, -.7)*cos(dot(w, vec2(13., -12.))+t*.9)*fine;
 s += vec2(.2, 1.)*cos(dot(w, vec2(5., 23.))-t*1.1+2.)*fine;
 return s;
}
// The sky over the lake: pale, a soft sun behind cloud.
vec3 fsSky(vec2 q, float r) {
 vec2 c = q*(1.+1.3*r*r)*1.5;
 vec2 go = vec2(.016, .007)*uTravel+vec2(.003*uTime, .0);
 float a = fbm(c+go), b = noise(c*1.1-go*.6+8.);
 float cloud = fsS(.38, .6, a+.2*(b-.5));
 float thick = fsS(.44, .72, a+.15*(b-.5));
 float sun = exp(-dot(q-fsSun, q-fsSun)*5.);
 vec3 sky = mix(vec3(.2, .4, .47), vec3(.5, .6, .54), fsS(.1, 1., r));
 vec3 white = mix(vec3(.9, .92, .86), vec3(.36, .46, .5), thick*(1.-.7*sun));
 sky = mix(sky, white, cloud*.85);
 if (fsDusk > .0) {
  vec3 low = mix(fsSq(1)*.7+.03, fsSq(2)*1.5+.06, fsS(.0, 1., r*.75+.35*dot(q, normalize(fsSun))));
  sky = mix(sky, mix(low, mix(low*.45, fsSq(3)*1.5+.1, sat(sun*1.6+.35*(b-.3))), cloud*.75), fsDusk);
 }
 if (fsNight > .0) {
  vec2 g = rot(.7)*q*15., id = floor(g), h = hash22(id+60.);
  float d = length(q-fsSun*.75), star = exp(-dot(g-id-.1-.8*h, g-id-.1-.8*h)*(160.-100.*h.x))*pow(h.y, 6.)*2.;
  vec3 dark = mix(fsSq(1)*.1+vec3(.006, .009, .014), fsSq(2)*.22+.02, r*r)+cloud*.05*(.3+fsSq(3))*(.4+2.*exp(-d*d*8.));
  dark += vec3(.9, .95, 1.)*star*(1.-cloud)*(.7+.8*uHigh);
  dark = mix(dark, (uKind[3]*.5+.6)*(.75+.35*noise(q*22.))*1.3, fsS(.105+fsBlur, .1-fsBlur, d)*(1.-.6*thick))+(.2+fsSq(3))*(.35*exp(-d*6.)+.5*uHits*exp(-d*3.));
  sky = mix(sky, dark, fsNight);
 }
 sky += vec3(1., .78, .44)*sun*(.45+.5*uPad)*(1.-fsNight);
 return sky*(.86+.4*uPad+.16*(uTone-.5));
}
// One tree, drawn by folding: how far from its wood, and from the tips where leaves hang.
vec2 fsTree(vec2 x, float H, vec2 h) {
 vec2 q = x/H;
 q.x += (h.x-.5)*.6*q.y*q.y+.02*sin(q.y*9.+h.y*20.);
 float s = 1., d = 9.;
 mat2 turn = rot(-.36-.22*h.y);
 float len = .34+.16*h.x, tip = 9.;
 for (int i = 0; i < 6; i++) {
  float t = sat(q.y/len);
  d = min(d, (length(vec2(q.x, q.y-t*len))-.026+.007*t)/s);
  q = 1.36*turn*vec2(abs(q.x+.05*sin(h.x*40.+float(i)*2.)), q.y-len);
  s *= 1.36;
  if (i > 2) tip = min(tip, (length(q-vec2(.0, .1))-.18)/s);
 }
 return vec2(d, tip)*H;
}
// The wading bird: feet at 0, head near 1.
float fsWader(vec2 x) {
 float nod = .03*sin(uTime*.31);
 float d = fsSeg(x, vec2(-.02, .0), vec2(-.03, .46), .01, .012);
 d = min(d, fsSeg(x, vec2(.08, .0), vec2(.06, .22), .01, .01));
 d = min(d, fsSeg(x, vec2(.06, .22), vec2(.0, .46), .01, .012));
 d = min(d, fsSeg(x, vec2(-.26, .42), vec2(.06, .56), .014, .085));
 vec2 n1 = vec2(.16, .68), n2 = vec2(.09+nod, .84), n3 = vec2(.17+nod, .97);
 d = min(d, fsSeg(x, vec2(.08, .57), n1, .06, .03));
 d = min(d, fsSeg(x, n1, n2, .03, .023));
 d = min(d, fsSeg(x, n2, n3, .023, .034));
 d = min(d, fsSeg(x, n3, n3+vec2(.24, -.05-nod), .026, .002));
 return d;
}
// All that stands round the rim.
vec3 fsBank(vec3 sky, vec2 q, float r, float az, float lit) {
 vec3 col = sky;
 float bare = max(-uOwn[2], .0), tall = max(uOwn[2], .0);
 float y = 1.-r, turn = fract(.25-az/TAU);
 if (y > .86) return col;
 vec2 dir = q/max(r, 1e-3);
 float clear = fsS(.03, .075, abs(turn-.541)), crown = noise(dir*44.+y*24.);
 float far = (.09+.14*noise(dir*3.4+4.)+.045*noise(dir*15.)+.03*crown)*(.4+.6*clear)*(1.+.8*tall)-.3*bare;
 vec3 wood = mix(vec3(.008, .04, .016), vec3(.04, .12, .05), crown*crown+.5*lit*crown);
 wood = mix(wood, vec3(.3, .4, .28)*(.45+.7*lit)*(1.-.85*fsNight)*mix(vec3(1.), fsSq(2)*1.1, fsDusk), fsS(.15, .0, y)*(.35+.5*uSpace));
 col = mix(col, wood, fsS(.008+fsBlur, -fsBlur, y-far)*.97);
 const float N = 14.;
 float g = turn*N, id0 = floor(g);
 float leafy = noise(q*46.)*.6+noise(q*88.+3.)*.4;
 for (int k = -1; k <= 1; k++) {
  float id = mod(id0+float(k), N);
  vec2 h = hash22(vec2(id, 3.));
  float at = id0+float(k)+.25+h.x*.5;
  float uvx = fract(at/N);
  vec4 a = piece(vec2(uvx, .18)), b = piece(vec2(uvx, .31)), c = piece(vec2(uvx, .47));
  float loud = max(a.a, max(b.a, c.a)), kin = mod(id, 3.);
  vec4 m = a*(kin < .5 ? 6. : 1.)+b*(kin > .5 && kin < 1.5 ? 6. : 1.)+c*(kin > 1.5 ? 6. : 1.);
  float H = (.17+.2*h.y*h.y+(.13+.16*uEnergy)*loud)*(.2+.8*fsS(.05, .14, abs(uvx-.541)));
  H = max(H*(1.+1.*tall)*(1.-bare), .002);
  vec2 x = vec2((at-g)/N*TAU*mix(r, 1., .4), y-.01);
  if (abs(x.x) > H*1.25 || y > H*1.9) continue;
  vec2 t = fsTree(x, H, h)+vec2(.3, .8)*max(abs(x.x)-.28, .0);
  float leaf = fsS(.012+fsBlur, -.012-fsBlur, t.y+(leafy-.6)*.16)*(1.-bare);
  vec3 green = mix(vec3(.012, .045, .016), vec3(.2, .25, .03), lit*lit*leafy);
  vec3 tint = fsGlass(m)*(.08+.92*leafy*leafy)*1.25;
  col = mix(col, mix(green, tint*(.35+.65*sky.g), sat(loud*3.)), leaf*.94);
  col = mix(col, vec3(.012, .02, .016)+.05*lit*vec3(1., .7, .4), fsInk(t.x-.0012)*(1.-bare));
 }
 vec2 bx = vec2((az+1.83)*mix(r, 1., .5), y-.012)/.36;
 if (abs(bx.x) < .6 && bx.y < 1.1) col = mix(col, vec3(.02, .03, .03), fsInk(fsWader(bx)*.36)*(1.-bare));
 const float M = 132.;
 float gm = turn*M, im = floor(gm), bed = fsS(.35, .75, noise(dir*2.1+9.));
 for (int k = -2; k <= 2; k++) {
  float id = mod(im+float(k), M);
  vec2 h = hash22(vec2(id, 11.)), h2 = hash22(vec2(id, 23.));
  float at = im+float(k)+h.x;
  vec4 m = piece(vec2(fract(at/M), h2.x > .5 ? .69 : .86));
  float H = (.06+.18*h.y)*(.45+.75*bed)+.3*uEnergy*m.a*(.4+.6*h2.y);
  H = max(H*(1.-bare), .002);
  float v = y/H;
  float bend = (h2.y-.5)*.6*v*v*H+.006*sin(uTime*.5+id)*v;
  float x = (at-gm)/M*TAU*r+bend, d = max(abs(x)-.0055*(1.-v*.92), y-H);
  vec3 ink = mix(vec3(.015, .035, .02), fsGlass(m), sat(m.a*1.1)*fsS(.35, 1., v));
  col = mix(col, ink, fsInk(d)*.95*(1.-bare));
  if (h2.x > .72) {
   vec2 e = vec2(x, y-H*.88)/vec2(.0075, .026);
   col = mix(col, vec3(.05, .03, .02)+ink, fsInk((length(e)-1.)*.0075)*(1.-bare));
  }
 }
 col = mix(col, vec3(.02, .04, .025), fsInk(y-.018-.02*noise(dir*30.))*.9);
 return col;
}
// Stones of the bottom, one layer.
vec3 fsStones(vec3 col, vec2 b, float cell, float seed, float soft) {
 vec2 g = b/cell, id = floor(g);
 vec2 h = hash22(id+seed), h2 = hash22(id+seed+7.7);
 vec2 q = rot(h2.x*6.)*(fract(g)-.5-(h-.5)*.24)/((.15+.23*h.x)*vec2(1., .62+.38*h2.y));
 float d = length(q)*(1.+.1*sin(atan(q.y, q.x+1e-5)*3.+h.y*9.)), dome = sqrt(max(1.-d*d, .0));
 vec3 tone = mix(vec3(.06, .105, .07), vec3(.24, .215, .12), h2.y*h2.y)*(.55+.8*h.y*h.y);
 col *= 1.-.55*fsS(1.6, .9, d);
 tone *= (.2+.8*dome)*(.7+.6*noise(g*11.));
 return mix(col, tone, fsS(1.+soft, .9-soft, d)*(.45+.55*fsS(.1, .4, h2.x)));
}
// The dark mirror outside the window: the bottom upside down in green water.
vec3 fsMirror(vec2 u, vec2 slope, float ru) {
 vec2 b = rot(.6)*(u-slope*1.3)*1.9+3.;
 float n = noise(b*1.3), soft = .06+.07*ru;
 vec3 bed = vec3(.045, .065, .04)*(.4+.8*n);
 bed = mix(bed, fsStones(bed, b+5., .19, 4., soft), fsS(.2, .6, n));
 bed = fsStones(bed, b, .43, 1., soft*.5);
 float far = exp(-max(ru-1., .0)*mix(2., 1.1, uSpace));
 if (fsClear > .0) {
  vec2 w = b*1.7+.25*vec2(sin(b.y*2.+uTime*.25), sin(b.x*2.3-uTime*.21));
  float net = pow(1.-abs(2.*noise(w*1.6+uTime*.05)-1.), 5.)+.7*pow(1.-abs(2.*noise(w*2.7-uTime*.07+9.)-1.), 5.);
  vec3 sand = (uKind[0]*.35+fsSq(2)*.3+.12)*(.55+.3*noise(b*vec2(3., 7.)))*(.7+(.9+.5*uDrone)*net*(1.-.8*fsNight));
  bed = mix(bed, mix(sand, fsStones(sand, b, .43, 1., soft*.5), .5), fsClear);
  return mix(mix(vec3(.004, .02, .013), bed*vec3(.75, 1.15, .8), far*.95), mix(fsSq(0)*.75+.02, bed*(.5+uKind[0]*.7), far*.9)*(1.-.7*fsNight), fsClear);
 }
 if (fsPeat > .0) return mix(mix(vec3(.004, .02, .013), bed*vec3(.75, 1.15, .8), far*.95), fsSq(0)*.1+(bed*.8+fsSq(2)*.12*n)*far*far*(.4+uKind[2]), fsPeat);
 return mix(vec3(.004, .02, .013), bed*vec3(.75, 1.15, .8), far*.95);
}
// Lily pads from beneath, with the stems that run down past the eye.
const vec3 fsP[6] = vec3[6](vec3(-.66, .74, .17), vec3(-.93, .5, .12), vec3(-.92, .84, .2), vec3(-1.18, .63, .13), vec3(-.5, 1.04, .14), vec3(-1.3, .98, .17));
vec3 fsPads(vec3 col, vec2 u, vec2 slope, float inWin) {
 vec2 g0 = floor(u/.31-.5);
 for (int i = 0; i < (uOwn[4] < .0 ? 4 : 0); i++) {
  vec2 id = g0+vec2(float(i % 2), float(i/2)), h = hash22(id+31.), h2 = hash22(id+57.);
  vec2 c = (id+.5+.45*(h-.5))*.31+.01*vec2(sin(uTime*.2+h.x*9.), cos(uTime*.17+h.y*9.));
  if (h2.y < .16) continue;
  vec2 l = u-c-slope*.4; float big = (.11+.085*h2.x)*sqrt(max(-uOwn[4], 1e-4)), d = length(l), a = mod(atan(l.y, l.x+1e-5)+h.x*20.+PI, TAU)-PI;
  float edge = min(big*(1.+.03*sin(a*6.+h.y*9.))-d, (abs(a)-.1)*d), f = d/big, vein = pow(abs(cos(a*8.)), 14.)*fsS(1., .1, f);
  vec4 m = piece(vec2(fract(.25-atan(c.y, c.x+1e-5)/TAU), sat(.1+.5*length(c))));
  vec3 pad = mix(mix(fsSq(2), fsSq(0), h2.y)*.9+.02, fsGlass(m)*1.1, sat(m.a)*.65)*(.3+(.2+.8*exp(-dot(u-fsSun, u-fsSun)*1.2))*(.35+.65*inWin)*(1.-.6*fsNight))*(1.-.5*vein)*(.75+.3*f+.25*noise(l*45.));
  col *= 1.-.5*fsS(-.03, .0, edge);
  col = mix(col, pad, fsS(-fsPx, fsPx, edge));
 }
 for (int i = 0; i < 6; i++) {
  vec3 P = fsP[i]; float fi = float(i);
  vec2 c = P.xy+.012*vec2(sin(uTime*.23+fi*2.), cos(uTime*.19+fi*3.)), l = u-c;
  float rc = length(c); vec2 o = c/rc;
  float along = dot(u, o)-rc, side = dot(u, vec2(-o.y, o.x))+.1*along*along*(fi*.4-1.);
  float w = .009*(1.+along*.9);
  if (along > .0) col = mix(col, vec3(.012, .03, .016)+vec3(.05, .08, .03)*sat(side/w)/(1.+2.*along), fsS(fsPx, -fsPx, abs(side)-w)*sat(along*25.));
  l -= slope*.4;
  float d = length(l), a = atan(l.y, l.x+1e-5)+fi*2.1;
  a = mod(a+PI, TAU)-PI;
  float edge = min(P.z*(1.+.03*sin(a*5.+fi))-d, (abs(a)-.12)*d);
  if (edge < -.02) continue;
  float f = d/P.z, vein = pow(abs(cos(a*7.)), 18.)*fsS(1., .1, f);
  vec3 through = mix(vec3(.3, .34, .07), vec3(.26, .1, .05), fsS(.35, 1., f+.25*sin(fi*4.)));
  vec3 pad = through*(.1+(.16+.5*exp(-dot(u-fsSun, u-fsSun)*1.4))*inWin)*(1.-.55*vein)*(.8+.4*noise(l*40.));
  col = mix(col, pad, fsS(-fsPx, fsPx, edge));
 }
 return col;
}
// Ribbons of weed that rise from the bottom and lean in to the light.
vec3 fsWeed(vec3 col, vec2 u, float ru) {
 if (ru < .97) return col;
 float W = 56., g = fract(atan(u.y, u.x+1e-5)/TAU+1.)*W, id0 = floor(g);
 for (int k = -2; k <= 2; k++) {
  float id = mod(id0+float(k), W);
  vec2 h = hash22(vec2(id, 5.));
  float at = id0+float(k)+.1+h.x*.8, th = at/W*TAU;
  float bed = fsS(.72, .97, cos(th+.62))+fsS(.86, .99, cos(th-3.75));
  if (bed < .1) continue;
  float tip = .98+.9*h.y+1.-min(bed, 1.), v = ru-tip;
  float sway = .07*sin(ru*3.4-uTravel*.35-uTime*.12+h.x*20.)*sat(1.2-.3*v);
  float x = (g-at)/W*TAU*ru+sway;
  float w = (.03+.03*h.x)*fsS(.0, .5, v)*(.7+.35*v)*(1.+.18*sin(v*24.+h.y*9.));
  vec3 tone = mix(vec3(.035, .085, .03), vec3(.075, .085, .02), h.y)*(.25+1.5*exp(-max(ru-1., .0)*1.1));
  float fold = x/max(w, 1e-3);
  tone *= (.62+.5*fold*sign(h.x-.5))*(.65+.35*fsS(.0, .3, abs(fold)));
  col = mix(col, tone, fsS(fsPx, -fsPx, abs(x)-w)*step(.0, v)*.94);
 }
 return col;
}
// Small rings where the keys rain. The slope of the water.
vec2 fsRain(vec2 u) {
 vec2 g = u/.36, id = floor(g), l = fract(g)-.5; float h = hash21(id+3.), c = fract(uTime*.55+h);
 vec2 o = (hash22(id+mod(floor(uTime*.55+h), 61.)*1.7)-.5)*.3;
 return fsRing(l, o, c*.32, 26.)*(1.-c)*c*fsS(.5, .35, max(abs(l.x), abs(l.y)))*(uKeys*.28+max(uOwn[4], .0)*(.5+.3*uTexture));
}
// Birds while a phrase sounds, and leaves afloat that take its colour.
vec3 fsPassing(vec3 col, vec2 q, vec2 u, vec2 slope) {
 float c = fract(uTime/26.);
 for (int i = 0; i < 3; i++) {
  float fi = float(i);
  vec2 at = vec2(mix(-1.3, 1.3, fract(c+fi*.035)), .16-.15*fi+.2*c);
  vec2 x = rot(-.2)*(q-at)/(.15-.025*fi);
  float ax = abs(x.x), wing = (.1+.22*sin(uTime*1.7+fi*2.))*ax*(1.3-ax)+.22*ax*ax;
  float d = max(abs(x.y+wing)-.12*(1.-ax), ax-1.);
  d = min(d, length(x*vec2(2.4, 1.)-vec2(.0, .05))-.24);
  col = mix(col, vec3(.07, .09, .1), fsS(fsPx, -fsPx, d*.09)*sat(uPhrase*2.2));
 }
 for (int i = 0; i < 3; i++) {
  float fi = float(i);
  vec2 at = vec2(.02+.5*sin(uTime*.017+fi*2.4), -.06+.42*cos(uTime*.013+fi*1.7))-slope*.5;
  vec2 x = rot(fi*2.+uTime*.02)*(u-at)/(.074-.012*fi);
  if (dot(x, x) > 4.) continue;
  x.y += .14*x.x*x.x-.07;
  float in_ = sat(1.-x.x*x.x), half_ = .44*in_*(1.+.4*x.x), d = (abs(x.y)-half_)*.06;
  col *= 1.-.35*fsS(.02, .0, d)*in_;
  col += .18*fsS(.006, .0, abs(d-.012))*in_;
  vec3 leaf = mix(vec3(.42, .2, .03), uKind[3]*uKind[3]+.06, .25+.7*uPhrase)*(.55+.5*x.y+.5*uPhrase);
  if (abs(x.x) < 1.) col = mix(col, leaf*(1.-.5*fsS(.06, .02, abs(x.y))), fsS(fsPx, -fsPx, d));
 }
 return col;
}
// A shoal that goes slowly round under the window.
vec3 fsShoal(vec3 col, vec2 s) {
 for (int i = 0; i < (uOwn[5] > .0 ? 13 : 0); i++) {
  float fi = float(i), h = hash11(fi+2.), h2 = hash11(fi+21.), a = -uTime*(.045+.012*h2)+fi*1.94+.5*h, R = .12+.36*h2;
  vec2 at = vec2(R*1.35*cos(a), R*sin(a)+.03*sin(a*2.+fi)), fw = normalize(vec2(1.35*sin(a), -cos(a))), l = s-at;
  float big = (.06+.085*h*h)*sqrt(max(uOwn[5], 1e-4)); if (dot(l, l) > big*big*2.) continue;
  vec2 x = vec2(dot(l, fw), dot(l, vec2(-fw.y, fw.x)))/big;
  x.y += .13*sin(x.x*2.6+uTime*1.3+fi*2.)*(.6-.5*x.x);
  float t = sat(1.-x.x*x.x), d = abs(x.y)-.27*pow(t, .75)*(1.+.35*x.x), u = (-.78-x.x)/.5;
  d = max(d, abs(x.x)-1.);
  d = min(d, max(abs(abs(x.y)-.2*u)-.1*(1.-u)-.02, max(-u, u-1.)*.4));
  d = min(d, max(abs(x.y)-.45+.9*abs(x.x-.15), abs(x.x-.15)-.25));
  vec3 k = mix(vec3(.012, .02, .02), fsSq(3)*.5, .25+.5*uPhrase)*(.5+1.3*sat(x.y*2.+.3)*fsS(.0, -.1, d));
  k += (uKind[3]*.3+.03)*fsS(.5, 1.1, length(s)/.36)*(1.-.7*fsNight)*exp(-length(s)*1.2)*fsS(.1, -.15, abs(x.y-.1)-.12);
  col = mix(col, k, fsS(1.5/(uRes.y*big), -1.5/(uRes.y*big), d)*.93);
 }
 return col;
}
// Jellyfish, rising and pulsing, lit by what sounds.
vec3 fsJelly(vec3 col, vec2 s) {
 for (int i = 0; i < (uOwn[5] < .0 ? 6 : 0); i++) {
  float fi = float(i), h = hash11(fi+5.), go = fract(uTime*.006*(1.+.5*h)+.43*fi+.2), beat = sin(uTime*.9+fi*2.1);
  float big = (.055+.1*hash11(fi+14.))*sqrt(max(-uOwn[5], 1e-4))*(.75+.5*go), show = fsS(.0, .12, go)*fsS(1., .85, go);
  vec2 x = rot(.5*(h-.5)+.1*sin(uTime*.2+fi))*(s-vec2(-.8+1.6*fract(fi*.382+.13), -.75+1.5*go))/big;
  if (abs(x.x) > 2. || x.y > 1.6 || x.y < -4.) continue;
  float w = 1.+.1*beat, y = x.y/(.85-.08*beat), e = length(vec2(x.x/w, y)), rim = -.12+.06*cos(x.x*14./w)-.15*(1.-sat(x.x*x.x));
  float bell = fsS(1.02, .97, e)*fsS(rim-.04, rim+.04, y), skin = pow(sat(e), 5.)+.5*fsS(.12, .0, abs(y-rim)), ribs = .6+.4*cos(x.x/max(w*sqrt(max(1.-y*y, .05)), .1)*13.);
  float arms = .0;
  for (int k = 0; k < 5; k++) { float fk = float(k)-2., v = sat(-x.y/3.4), c = fk*.34*w*(1.-.5*v)+(.1+.3*v)*sin(x.y*1.9+uTime*.6+fk+fi)*v*1.6; arms += exp(-pow(abs(x.x-c)/(.05+.05*v*abs(fk-.4)), 2.))*(1.-v)*fsS(.1, -.1, x.y); }
  vec3 k = mix(uKind[3]*(.5+.9*uPhrase), uKind[1]*(.5+.9*uPad), h)+.08;
  col = mix(col, col*.75+k*(.08+.75*skin*(.6+.4*ribs)+.16*ribs*(1.-e)), bell*show*.9)+k*arms*.28*show*(1.-bell);
 }
 return col;
}
// Silt in the water, caught by the light.
float fsSilt(vec2 p, float cell, float seed) {
 vec2 g = (p+vec2(.004, .0025)*uTime)/cell, id = floor(g), h = hash22(mod(id, 97.)+seed);
 float d = length((fract(g)-.5-(h-.5)*.7)*cell), w = .0003+.0022*h.y*h.y*h.x;
 return fsS(w+1./uRes.y, .0, d)*h.x*h.x*.8;
}
float fsZig(float x, float s) { float i = floor(x); return mix(hash11(i+s), hash11(i+1.+s), x-i)-.5; }
// The ice: milk, cracks and stacked flat bubbles. glow is the daylight in it.
vec3 fsIce(vec3 col, vec2 u, vec3 glow, float ring) {
 float a = noise(u*1.7+3.), b = noise(u*vec2(5., 4.)+9.), c = noise(u*19.);
 float milk = sat(.22+.9*fsClear-.75*fsPeat+.66*a+.22*(b-.5)+.1*(c-.5));
 col = mix(col, vec3(.80, .93, .87)*glow*(.8+.3*b), milk*.5);
 if (fsClear > .0) col += uKind[0]*glow*.12*fsClear;
 col *= 1.-.42*fsS(.5, .72, noise(rot(.5)*u*vec2(1.1, 2.6)+20.)*.8+.2*b);
 for (int i = 0; i < 7; i++) {
  float fi = float(i), h = hash11(fi+1.3), h2 = hash11(fi+31.7);
  float th = fi*1.94+h*.6; vec2 n = vec2(cos(th), sin(th));
  float x = dot(u, vec2(-n.y, n.x)), o = (h2-.5)*1.9;
  float d = dot(u, n)-o-.13*fsZig(x*1.9, fi*37.)-.028*fsZig(x*8., fi*37.+200.);
  if (d < -.02 || d > .4) continue;
  float lives = fsS(.0, .5, noise(vec2(x*.9+fi*3., 40.+fi))*1.5-.35);
  float shade = noise(vec2(x*34.+d*20., d*5.+fi));
  float wall = fsS(-fsPx, fsPx, d)*exp(-d*(6.+12.*h))*lives*(.25+.75*shade);
  float w = .0012+.0024*(.5+.5*sin(x*5.+fi*3.))*lives;
  float line = fsS(w+fsPx, w-fsPx, abs(d))*lives;
  float say = .8+.7*band(fi/6.)+3.*ring;
  vec3 hue = mix(vec3(.75, .88, .83), .1+1.6*uKind[3]*uKind[3], sat(1.4*uPhrase)*step(.5, fract(fi*.5+.25)));
  col = mix(col, hue*glow*say, wall*.6);
  col = mix(col, hue*glow*say*1.2, line*.85);
 }
 if (uOwn[4] > .0) {
  vec2 w = u+.06*vec2(noise(u*6.), noise(u*6.+30.)), g = w*2.3, id = floor(g); float n1 = 9., n2 = 9.; vec2 at = vec2(.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = id+vec2(float(i), float(j)), d = o+.15+.7*hash22(o+5.)-g; float m = dot(d, d); if (m < n1) { n2 = n1; n1 = m; at = o; } else n2 = min(n2, m); }
  float gap = sqrt(n2)-sqrt(n1), h = hash21(at+3.);
  col *= mix(1., .45+.95*h, uOwn[4]);
  col = mix(col, vec3(.8, .93, .88)*glow*(.9+.6*band(h)+2.*ring), uOwn[4]*(.75*exp(-gap*16.)*(.4+.6*noise(u*30.))+.2*exp(-gap*5.)));
  col = mix(col, vec3(.004, .012, .014)+fsSq(0)*.08, uOwn[4]*fsS(.035, .01, gap));
 }
 vec2 g = u/.23, id = floor(g), h = hash22(id+2.), h3 = hash22(id+12.);
 vec2 k = (id+.5+(h-.5)*.42)*.23; float rk = length(k);
 vec4 m = piece(vec2(fract(.25-atan(k.y, k.x+1e-5)/TAU), sat(.12+.62*rk)));
 float many = max(-uOwn[4], .0);
 float some = fsS(.56-.5*many, .66-.5*many, h3.x*.75+.25*m.a+.5*(noise(id*.45+5.)-.5));
 if (some > .0) {
  vec2 o = k/max(rk, .05);
  float big = (.03+.04*h3.y*h3.y)*(.8+.4*m.a)*(1.+.5*many);
  for (int i = 0; i < 6; i++) {
   float fi = float(i);
   vec2 l = u-k-o*(fi-2.5)*.014-(hash22(id+fi*3.1)-.5)*.016;
   float R = big*(.35+.75*hash11(h.x*9.+fi));
   if (many > .0) { vec2 off = abs(u-l-(id+.5)*.23); R = mix(R, min(R, .108-max(off.x, off.y)), sat(many*4.)); } // whole inside its cell
   float d = length(l)-R, face = fsS(fsPx, -fsPx, d)*some;
   vec3 hue = mix(vec3(.82, .95, .9), fsGlass(m)*1.3, sat(m.a)*.4)*glow;
   col *= 1.-.45*fsS(.014, .0, d)*(1.-face)*some;
   col = mix(col, hue*(.5+.1*fi+.8*ring), face*.42);
   col = mix(col, hue*1.3, fsS(.006, .0, -d)*face*.75);
  }
 }
 return col;
}
vec3 render(vec2 p) {
 float wide = uRes.x/uRes.y, R = min(.365, .47*wide), t = uTime;
 vec2 s = p-vec2(.09*min(wide, 1.6)/1.6, .085);
 R *= exp2(uOwn[1]*(uOwn[1] > .0 ? .75 : 1.15));
 fsNight = max(uOwn[0], .0); fsDusk = max(-uOwn[0], .0); fsClear = max(uOwn[3], .0); fsPeat = max(-uOwn[3], .0);
 float f = R/1.134, murk = max(-uOwn[6], .0);
 vec3 rd = vec3(s.x, s.y*.985+f*.174, f*.985-s.y*.174);
 vec2 u = rd.xy/max(rd.z, .02)/1.134;
 fsBlur = fsPx = length(fwidth(u))*.6+1e-4;
 fsBlur += .035*murk;
 float ru = length(u), hole = 1., hd = .0;
 vec2 slope = fsSlope(u, t), holeAt = vec2(.36, -.22);
 bool ice = uVar > .5;
 if (ice) {
  vec2 l = u-holeAt;
  hd = length(l)-.235-.012*sin(atan(l.y, l.x+1e-5)*3.+1.)-.012*noise(u*14.);
  hole = fsS(.004, -.004, hd);
 }
 vec2 drop = .12*vec2(sin(t*.13), cos(t*.17))+(ice ? holeAt : vec2(.02, .06));
 float R1 = .17+(1.-uHits)*1.1, ring = length(u-drop)-R1;
 float wave = cos(34.*ring);
 ring = uHits*exp(-ring*ring*60.);
 slope += fsRing(u, drop, R1, 9.)*uHits*.1+fsRain(u);
 vec2 wet = vec2(.0);
 if (uOwn[4] > .0 && !ice) { wet = fsRain(u)*.8+fsRain(u*1.63+7.3)*.8+fsRain(u*.7-3.1)*1.2; slope += wet; }
 slope += fsRing(u, vec2(-.5, .2), (1.-uCue)*1.7, 4.)*4.*uCue*(1.-uCue)*.07;
 if (ice) {
  vec2 bulge = .05*vec2(noise(u*3.)-.5, noise(u*3.+40.)-.5);
  slope = mix(bulge, slope*.6, hole);
  fsBlur = mix(.026, fsPx, hole);
 }
 vec2 q = u-slope*mix(.45, 1.25, sat(ru));
 if (uOwn[7] > .0) q += uOwn[7]*((vec2(noise(u*2.1+vec2(t*.07, 3.)), noise(u*2.1+vec2(40., -t*.06)))-.5)*.6+(vec2(noise(u*5.2+vec2(9., t*.12)), noise(u*5.2+vec2(-t*.11, 70.)))-.5)*.3);
 if (uOwn[7] < .0) q -= uOwn[7]*u/(ru+.02)*.085*sin(ru*34.-t*.35)*fsS(.02, .2, ru);
 float az = atan(q.y, q.x+1e-5);
 float sec = fract(.25-az/TAU)*16.; int bi = int(min(sec, 15.)); float sf = sin(PI*fract(sec));
 float shiver = uBands[bi]*sf*sf*(.5+.5*sin(az*14.-t*.5));
 if (!ice) q *= 1.+shiver*.014*sin(az*64.+t*1.6)*fsS(.6, 1., ru);
 float r = length(q), lit = exp(-dot(q-fsSun, q-fsSun)*1.6)*(1.-.9*fsNight), soft = fsBlur*1.5;
 vec3 col = fsMirror(u, slope, ru);
 col += vec3(.035, .1, .06)*exp(-max(r-1., .0)*4.5)*(.4+.3*uPad)*(1.-.75*fsNight)*(1.-.8*fsPeat);
 if (uOwn[3] != .0) col += (fsClear*fsSq(0)+fsPeat*fsSq(2)*.25)*exp(-max(r-1., .0)*4.5)*(.5+.4*uPad)*(1.-.8*fsNight);
 float inWin = fsS(soft, -soft, r-1.);
 if (r < 1.06) {
  vec3 win = fsSky(q, r);
  if (!ice || hole > .0) win = fsPassing(win, q, u, slope);
  win = fsBank(win, q, r, az, lit);
  float c = dot(q, vec2(.95, .3))-mix(1.4, -.8, uCue);
  win *= 1.-.62*uCue*exp(-c*c*3.);
  float edge = fsS(.016, .0, 1.-r)*(ice ? .4 : 1.), here = .5+.5*cos(az-TAU*(.25-uLoop));
  win = mix(win, vec3(.85, .95, .8)*(1.-.8*fsNight)*mix(vec3(1.), fsSq(2)+.2, fsDusk)*(.28+.6*lit+.2*uPad+.5*uMic+.6*pow(here, 14.)), edge);
  col = mix(col, win, vec3(fsS(soft, -soft, r-1.0045), inWin, fsS(soft, -soft, r-.9955)));
 }
 if (ice) {
  vec3 glow = mix(mix(mix(vec3(.05, .13, .095), fsSq(0)*.5+.03, max(fsClear, fsPeat)), fsSq(2)*.25, fsDusk)*(1.-.6*fsNight)*(.85+.5*uDrone), mix(vec3(1.), fsSq(2)*1.2+.15, fsDusk)*(1.-.82*fsNight), fsS(1.3, .8-.6*fsNight, ru))*(.8+.3*uPad+.45*lit);
  col = mix(fsIce(col, u, glow, ring), col, hole);
  col = mix(col, vec3(.92, 1., .95)*glow, fsS(.01+fsPx, .01-fsPx, abs(hd-.006))*.55);
  col *= 1.-.5*exp(-abs(hd)*60.)*hole;
 } else {
  col = fsPads(col, u, slope, inWin);
  col = fsWeed(col, u, ru);
 }
 col *= 1.+mix(.45, .75, hole)*ring*wave;
 col += (fsNight+fsPeat*.9)*ring*(.5+.5*wave)*(uKind[4]*.16+.02);
 col *= 1.+9.*clamp(dot(wet, vec2(.5, .86)), -.09, .14);
 if (uOwn[6] != .0) {
  vec2 d = s/(length(s)+1e-3); float ray = noise(d*4.+vec2(t*.03, 2.))*noise(d*11.-vec2(t*.05, 7.))*2.4, rs = length(s);
  vec3 day = mix(mix(uKind[0]*.4+vec3(.35, .4, .36), fsSq(2)*1.2+.1, fsDusk), fsSq(3)*.25+.05, fsNight);
  col += max(uOwn[6], .0)*day*ray*ray*(.35+.4*uLevel)*exp(-rs*1.9)*fsS(.45*R, 1.5*R, rs)*1.4;
  col = mix(col, (day*.75*exp(-max(ru-.7, .0)*1.5)+fsSq(0)*.12)*(.75+.5*noise(s*5.+t*.04)+.25*uTexture), murk*(.3+.55*fsS(.2, 1.5, ru)));
 }
 col = fsJelly(fsShoal(col, s), s);
 float silt = fsSilt(p, .045, 3.)+fsSilt(rot(.6)*p, .085, 9.);
 col += vec3(.45, .6, .42)*silt*(.1+.6*uTexture+.5*murk)*(.15+exp(-max(ru-1., .0)*1.3))*(1.-.8*inWin);
 return screenOf(col*1.25);
}
