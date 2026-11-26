// name: Snowfall
// a: Street lamp
// b: Pine wood
// what: A lane on a winter evening under one street lamp, its cone of light full of falling flakes near and far, snow on the roofs, the wall and a bare tree, old wheel tracks and steps; or a pine wood on a grey day, dark trunks rank behind rank, loaded boughs with two small bright birds, young firs, a pale sun and one line of steps.
// follows: The mix is how thick it snows, the low band leans it, the piece tints the flakes where it sounds. Drone is the lamp, pad, texture and phrase the windows; in the wood each kind tints the air at its own depth and phrase the birds. A hit shakes snow off a limb, a cue lifts the lamp or the sun, the loop deepens the drifts.
// The picture so far, drawn from the nearest thing back, what is still seen through it, how far off the first thing is, a pixel.
float snS(float a, float b, float x) { x = sat((x-a)/(b-a)); return x*x*(3.-2.*x); }
vec3 snCol;
float snT, snZ, snPx, snDr, snB;
float snKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float snIn(float d) { return sat(d/snPx+.5); }
float snBox(float x, float a, float b, float f) { return sat((x-a)/f+.5)*sat((b-x)/f+.5); }
float snN(float x) { float i = floor(x), f = x-i; f = f*f*(3.-2.*f); return mix(hash21(vec2(i, 3.7)), hash21(vec2(i+1., 3.7)), f); }
void snLay(vec3 c, float a, float z) { snCol += snT*a*c; snT *= 1.-a; if (a > .5) snZ = min(snZ, z); }
const vec3 snSnow = vec3(.92, .93, .95);
// The light of one kind of sound, kept near a flame's amber.
vec3 snWarm(int k) { vec3 c = uKind[k]; return mix(vec3(1., .48, .12), c*c*1.8, .22); }

// A limb from a to b, bowed by bow, w thick at a. x: wood, y: the snow that lies on it, z: how high in that snow.
vec3 snLimb(vec2 p, vec2 a, vec2 b, float bow, float w, float load) {
 vec2 ab = b-a;
 float g = (p.x-a.x)/ab.x, h = sat(g), y = p.y-a.y-ab.y*h-bow*4.*h*(1.-h);
 vec3 m = vec3(.0);
 if (abs(g-.5) < .5 && y > -2.*w-.004 && y < load*2.+.004) {
  float slope = (ab.y+bow*4.*(1.-2.*h))/ab.x, k = inversesqrt(1.+slope*slope), v = y*k, t = w*(1.-.9*h);
  float bump = load*k*(.55+.75*snN(h*23.*abs(ab.x)+a.x*31.+a.y*57.))*max(snB, snS(.0, .1, h))*snS(1., .8, h), up = v-t*.2;
  m = vec3(snIn(t-abs(v)), snIn(bump-up)*snIn(up), sat(up/(load*.9)));
 }
 return m;
}
// The loaded limbs near this pixel with their twigs: the bare tree's over the lane, or the pine's, which droop and carry needles.
vec3 snBoughs(vec2 p) {
 vec3 all = vec3(.0);
 float sway = .003*sin(uTime*.31)*(.4+uLow), load = mix(.012, .028, snB)+mix(.006, .015, snB)*snDr;
 bool on = snB < .5 ? p.x < .35 && p.y > (p.x > -.67 ? min(.24, .42*(p.x+.69)) : -.28*(p.x+.7)) : p.x < -.5 ? p.x < -.58 && abs(p.y-.02) < .19 : p.x > .22 ? p.y > .22 && p.x < .65 : p.y < .09 ? p.x > -.16 && p.y > -.19 : p.x > .08 || p.y < .37;
 int turns = !on ? 0 : snB > .5 || p.y < .24 ? 8 : 16;
 for (int k = 0; k < turns; k++) {
  vec2 a, b; vec2 bw;
  if (snB > .5) {
   a = vec2(-.45, .3); b = vec2(.045, .2); bw = vec2(.06, .0085);
   if (p.x < -.5) { a = vec2(-.59, .1); b = vec2(-1.1, -.03); }
   else if (p.y < .09) { a = vec2(-.146, .03); b = vec2(.1, -.06); bw = vec2(.03, .007); }
   else if (p.x > .14) { a = vec2(.642, .41); b = vec2(.2, .35); bw.x = .05; }
  } else if (p.x > -.67) {
   a = vec2(-.69, .12); b = vec2(.17, .385); bw = vec2(.075, .018);
   if (k > 7) { a = vec2(-.66, .3); b = vec2(-.2, .52); bw = vec2(.03, .013); }
  } else {
   a = vec2(-.7, .06); b = vec2(-1.3, .3); bw = vec2(.04, .014);
   if (k > 7) { a = vec2(-.65, .33); b = vec2(-1.1, .5); bw = vec2(.02, .01); }
  }
  b.y += sway;
  vec2 ab = b-a;
  float fk = float(k & 7), w = bw.y, ld = load, dir = sign(ab.x);
  if ((k & 7) > 0) {
   float g = fract(fk*.618+a.x), t = .22+.105*fk, o = mod(fk, 2.)-.5;
   a += ab*t; a.y += bw.x*4.*t*(1.-t);
   b = a+(.11+.1*g)*(1.2-.6*t)*vec2(dir*mix(1., .7+.2*g, snB), mix(o*(.8+.6*g), o*.55-.3-.3*g, snB));
   bw.x = .015; w *= .45*(1.2-t); ld *= mix(.45, .62, snB);
  }
  vec3 m = snLimb(p, a, b, bw.x, w, ld);
  float u = (p.x-a.x)/(b.x-a.x), v = p.y-mix(a.y, b.y, u)-bw.x*4.*u*(1.-u);
  if (snB > .5 && abs(u-.5) < .55 && abs(v+.025) < .035) {
   float dep = .036*snS(.0, .25, u)*snS(1.06, .8, u)*(.45+snN(p.x*46.+fk*7.));
   m.x = max(m.x, sat((v+dep*(.5+.7*snN((p.x+v*.5*dir)*420.)))/(snPx*1.5)+.5)*snIn(.006-v)*step(.0, u));
  }
  all.x = max(all.x, m.x);
  if (m.y > all.y) all.yz = m.yz;
 }
 return all;
}
// What a hit shakes from a limb: powder that comes down and thins. b: its middle, and how the limb slopes.
void snShake(vec2 p, vec3 b, vec3 c) {
 if (uHits < .01) return;
 float go = 1.-uHits, x = p.x-b.x, y = b.y+b.z*x-p.y, drop = .7*snN(p.x*13.)+.3*snN(p.x*41.);
 float puff = noise(rot(.6)*p*38.+vec2(.0, go*6.)), dust = noise(rot(-.5)*p*210.+vec2(.0, go*20.));
 float fall = .07+.08*drop+(.08+.3*drop)*go*(.6+.4*go);
 snCol += c*uHits*exp(-x*x*34.)*snS(fall, fall*.3, y)*snS(-.025, .03, y-.16*go*go)*(.12+1.7*drop*puff*(.45+.55*dust));
}

// ---- a: the lane. The eye stands at (0, 2.5, 0) and looks along z.
const vec2 snVp = vec2(.1, .03);
const vec3 snLamp = vec3(-1.5, 3.75, 7.2);
vec3 snFire;
// How much lamp light reaches a place in the air.
float snReach(vec3 w) {
 vec3 l = snLamp-w;
 float d2 = dot(l, l);
 return (.06+.94*snS(.58, .8, l.y*inversesqrt(d2+.01)))/(.6+d2);
}
const vec3 snHaze = vec3(.06, .108, .215);
// Lays a surface: under the blue of the sky and the amber of the lamp, then through the air to the eye.
vec3 snFar(vec3 c, float z) { z = 1.+max(z-4., .0)*mix(.013, .03, uSpace); return mix(snHaze, c, 1./(z*z)); }
void snPut(vec3 alb, vec3 w, vec3 n, float a) {
 vec3 amb = mix(vec3(.018, .034, .075), vec3(.062, .118, .255), .5+.5*n.y), l = snLamp-w;
 snLay(snFar(alb*(amb+snFire*1.9*max(dot(n, l)*inversesqrt(dot(l, l)+.01)*.8+.2, .0)*snReach(w)), w.z), a, w.z);
}
// The houses, the nearest first, each behind the one before. s is the side of the lane it stands on.
void snHouses(vec3 d) {
 float lane = -d.y/2.5;
 bool open = d.y < -.11 && d.x > -4.2*lane && d.x < 2.6*lane;
 for (int i = d.x < .0 ? 1 : 0; i < 4 && snT > .01 && !open; i += i == 2 ? 1 : 2) {
  // near edge, half width, front, back; eave and rise of the roof; the sound in the windows
  vec4 box = i == 0 ? vec4(2.9, 2.5, 3.3, 12.5) : i == 1 ? vec4(4.6, 3., 10.5, 17.) : i == 2 ? vec4(3.4, 2.3, 14.5, 21.) : vec4(-2.6, 2.7, 25., 31.);
  vec2 hgt = i == 1 ? vec2(3.1, 2.6) : vec2(2.8, 2.3);
  int k = i == 3 ? 3 : i == 0 ? 1 : 2;
  float s = i == 1 ? -1. : 1., dx = d.x*s, x0 = box.x, hw = box.y, m = hgt.y/hw, snow = .26+.12*snDr, drift = .32+.3*snDr, top = hgt.x+snow, xe = x0-.45, te = top-m*.45;
  // the gable that faces the eye, with snow along its slopes
  float z = box.z, X = dx*z, y = 2.5+d.y*z, u = (X-x0-hw)/hw, f = snPx*z, line = hgt.x+hgt.y*(1.-abs(u)), own = .8, dark = snS(line-.5, line, y);
  float sn = sat((1.12-abs(u))*hw/f+.5)*snBox(y, line-.04, line+snow*1.15, f);
  float a = max(sn, sat((1.-abs(u))*hw/f+(u < .0 ? 1. : .5))*snBox(y, .0, line, f));
  vec3 w = vec3(X*s, y, z), n = vec3(.0, .0, -.9);
  vec2 q = vec2(X-x0-hw, y-hgt.x-.15);
  if (q.y < -.65) { q = vec2(abs(q.x)-hw*.48, y-1.5); own = .36; }
  if (a < .5 && dx > .01) {
   // the wall along the lane, under its lip of snow
   z = xe/dx; y = 2.5+d.y*z;
   sn = snBox(z, box.z-.25, box.w, snPx*z/dx)*snBox(y, te-snow-.03*sin(z*2.1)-.03*sin(z*5.3), te+.02, snPx*z);
   z = x0/dx; y = 2.5+d.y*z; f = snPx*z/dx;
   a = max(a, max(sn, snBox(z, box.z-.1, box.w, f)*snBox(y, .0, 2.5+(te-2.6)*x0/xe, snPx*z)));
   w = vec3(x0*s, y, z); n = vec3(-s, .0, .0);
   float cell = (z-box.z)/3.1;
   q = vec2((fract(cell)-.5)*3.1, y-1.7); own = fract(floor(cell)*.382+.45); dark = snS(hgt.x-.7, hgt.x, y);
   sn = max(sn, snBox(q.x, -.54, .54, f)*snBox(q.y, -.67, -.53, snPx*z));
  }
  sn = max(sn, sat((drift+.06*sin(w.x*2.+w.z*1.3)-y)/(snPx*z+.06)+.5));
  sn = min(sn/max(a, 1e-3), 1.);
  vec2 aq = abs(q);
  vec3 g = snWarm(k)*(.3+1.9*snKind(k)+(k == 3 ? uMic : .0))*mix(.06, 1., snS(.3, .55, own))*(.75+.6*q.y)*(.75+.25*snS(.08, .3, aq.x));
  g = mix(vec3(.02, .02, .03), g, min(sat((aq.x-.03)/f+.5), sat((abs(q.y-.12)-.03)/f+.5)));
  snLay(snFar(g, z), a*(1.-sn)*sat((.42-aq.x)/f+.5)*sat((.55-aq.y)/f+.5), z);
  snPut(mix(vec3(.19, .165, .15)*(1.-.5*dark), snSnow, sn), w, normalize(n+vec3(.0, 1.4*sn, .0)), a);
  // the slope of the roof towards the lane
  float den = d.y-m*dx;
  z = (top-m*x0-2.5)/(abs(den) < 1e-3 ? 1e-3 : den); X = dx*z;
  f = z*m*snPx/max(abs(den), 1e-3)+.02;
  if (z > .5 && z < box.w+2.) snPut(snSnow, vec3(X*s, 2.5+d.y*z, z), normalize(vec3(-m*s, 1., .0)), snBox(X, xe-.2, x0+hw, snPx*z*1.5+f*abs(dx))*snBox(z, box.z-.25, box.w, f));
 }
}
float snTrack(float x) { x = 1./(1.+x*x*22.); return x*x*(.4-1.35*x); }
// The lie of the snow in the lane: heaps at the sides, two wheel tracks and a line of steps. way: how both wander.
float snLie(vec2 g, vec2 way, float soft) {
 float x = g.x-way.x, f = g.y/.62, i = floor(f);
 vec2 st = vec2(g.x-way.y-.13*(mod(i, 2.)*2.-1.), (f-i-.5)*.62);
 return .13*(snTrack(x-.62)+snTrack(x+.62))+snS(.8, 2.6, abs(g.x+.1))*(.18+.25*snDr)-.08*soft*snS(.0, 1., 1.-st.x*st.x*50.-st.y*st.y*18.);
}
// The lamp on its arm. q is the place from the top of its shade.
void snStreetLamp(vec2 q) {
 if (abs(q.x+.05) < .12) {
  float o = q.x+.1, dr = snDr, ring = length(q+vec2(.05, .0))-.05, uq = min(abs(q.x)/.036, 1.);
  float hump = -.026*pow(uq, 1.7);
  snLay(vec3(.1, .16, .3), max(snBox(q.y, hump, hump+(.009+.005*dr)*(1.-uq*uq*uq), snPx)*step(uq, .999), snBox(ring, .002, .006+.003*dr, snPx)*snS(.012, .03, q.y)), snLamp.z);
  snLay(vec3(.06, .1, .2)+snFire*.056, snIn(.016*exp(-o*o*1100.)+.006*dr-.579-q.y)*snS(-.6, -.576, q.y)*snS(.055, .02, abs(o)), snLamp.z);
  float shade = max(snIn(.036-.03*sqrt(sat(q.y/.026+1.))-abs(q.x))*snBox(q.y, -.026, .001, snPx), snBox(o, -.0048, .0048, snPx)*snBox(q.y, -.574, .0, snPx));
  snLay(vec3(.006, .008, .013)+snFire*.008*snS(.0, .005, o)*snS(-.03, -.2, q.y), max(shade, snIn(.0032-abs(ring))*step(.0, q.y)), snLamp.z);
 }
}
void snLane(vec2 p, vec3 bough) {
 vec3 d = vec3(p-snVp, 1.);
 float up = d.y, a, z, plas = .0;
 vec2 lp = snVp+(snLamp.xy-vec2(.0, 2.5))/snLamp.z, v = p-lp;
 // the bare tree behind the wall, its limbs over the lane
 float near = exp(-dot(v, v)*12.), tw = .037+.012*snS(.1, -.2, p.y)-.03*(p.y-.1), u = (p.x+.72-.05*sin(p.y*4.)-.06*p.y)/tw;
 if (abs(u) < 1.1) { a = snIn((1.-abs(u))*tw); bough.x = max(bough.x, a); plas = a*snS(.55, .8, u+.5*noise(p*vec2(30., 26.))-.1); }
 snLay(vec3(.075, .13, .26)+snFire*.03*near, max(bough.y, plas), 5.);
 snLay(vec3(.007, .01, .018)*(.7+.6*snN(p.x*90.+4.*sin(p.y*9.)))+vec3(.05, .022, .008)*near*(1.+uDrone), bough.x, 5.);
 snStreetLamp(v-vec2(.0, .035));
 float through = snT;
 // the wall on the left
 if (d.x < -.01 && snT > .01 && up < .0) {
  float t = 1.98+.14*snDr;
  z = -2.95/d.x; float y = 2.5+d.y*z, f = snPx*z;
  a = snBox(y, .0, t, f)*sat((15.5-z)/(f/-d.x)+.5);
  if (a > .0) {
   float row = floor(y/.23);
   vec2 b = vec2(z/.52+.5*mod(row, 2.)+.3*hash11(row), y/.23), e = fract(b);
   float st = hash21(floor(b)), lip = 1.71-.04*snN(z*3.);
   vec3 alb = mix(vec3(.1, .09, .085), vec3(.22, .19, .17), st)*(.45+.55*snS(.02, .2, min(min(e.x, 1.-e.x)*2.2, min(e.y, 1.-e.y))));
   float lay = max(sat((y-lip)/f+.5), sat((.2+.4*snDr+.3*snN(z*.7)-y)/(f+.03)+.5));
   snPut(mix(alb, snSnow, lay), vec3(-2.95, y, z), normalize(mix(vec3(1., .3*(st-.5), .0), vec3(.8, y > 1. ? (y-lip)*5. : .9, .0), lay)), a);
  }
  z = (t-2.5)/min(up, -.002);
  snPut(snSnow, vec3(d.x*z, t, z), vec3(.0, 1., .0), snBox(d.x*z, -3.5, -2.85, snPx*z*2.)*sat(15.5-z));
 }
 snHouses(d);
 // the lane
 if (up < -.004 && snT > .01) {
  z = -2.5/d.y;
  vec2 g = vec2(d.x*z, z), way = vec2(.55+.5*sin(z*.17+.6)-.02*z, -1.15-.15*sin(z*.7));
  float soft = snS(26., 8., z), h = snLie(g, way, soft), heap = cos(g.x*2.1+1.5*sin(z*.6));
  vec3 n = normalize(vec3((h-snLie(g+vec2(.06, .0), way, soft))/.06-.1*heap, 1., (h-snLie(g+vec2(.0, .06), way, soft))/.06-.04*heap));
  float a = sat(-up/snPx);
  // what the windows throw on the snow
  snCol += snT*a*snWarm(1)*(.05+.4*uPad)*(.4-.4*cos(TAU*(z-3.3)/3.1))*exp(-(g.x-2.1)*(g.x-2.1)*1.1)*snBox(z, 4., 12., 1.)*max(n.y*1.4+n.x-.4, .0);
  snPut(snSnow, vec3(g.x, h*.3, z), n, a);
 }
 // the hill beyond, and the sky, dark above and pale with snow low down
 if (snT > .01) {
  float hill = .05+.05*snN(p.x*2.6)+.06*snS(.1, -.8, p.x)-up;
  snLay(vec3(.045, .075, .15), snIn(hill+.03*snN(p.x*60.)*snN(p.x*9.))*.85, 45.);
  snLay(mix(snHaze*1.15, vec3(.012, .026, .07), snS(-.02, .5, up)), 1., 60.);
 }
 // the lamp in the air: light gathered along the line of sight
 vec3 rd = normalize(d), lv = snLamp-vec3(.0, 2.5, .0);
 float b = dot(lv, rd), c2 = sqrt(max(dot(lv, lv)-b*b, .0)+.02);
 float cone = .1+.9*snS(.32, .78, (.012-v.y)/(length(v-vec2(.0, .012))+.004));
 v.y = v.y*1.5-.009;
 snCol += through*snFire*((atan((min(snZ, 40.)*length(d)-b)/c2)+atan(b/c2))/c2*(cone*.022+.0025)*(.75+.4*uEnergy)+.9*exp(-dot(v, v)*9000.));
}

// ---- b: the wood.
vec3 wdMist;
// A fir under snow, its foot at 0, 1 high, n boughs up one side. x: how much is tree, y: how much of that is snow, z: its light.
vec3 wdFir(vec2 q, float f, float seed, float n) {
 float ax = abs(q.x), s = q.x < .0 ? 1.7 : 5.3, open = 1.02-q.y;
 vec3 r = vec3(.0);
 if (snT > .01 && q.y > .0 && ax < open*.34+.02) {
  float lv = (q.y+.42*ax)*n+(s < 3. ? .45 : .0), k = floor(lv), fr = lv-k, hk = hash21(vec2(k+seed*3., s));
  float lump = snN(ax*n*4.+seed+k*5.+s), w = open*(.19+.12*hk)*(1.1-.75*fr*fr)+.14/n*lump;
  r = vec3(sat((w-ax)/f+.5), snS(.0, .14, fr-.12-.4*lump*lump)*snS(.95, .75, fr+.3*hk), (1.-.6*fr)*(.75+.4*lump)*(s < 3. ? 1. : .8));
 }
 return r;
}
// A trunk: where it stands, half its width, its lean, how dark for its distance.
void wdTrunk(vec2 p, float x, float w, float lean, float dark, float seed) {
 w *= 1.-.28*p.y+.3*snS(-.2, -.45, p.y);
 float wave = sin(p.y*5.+seed), u = (p.x-x-lean*p.y)/w-.15*wave;
 if (abs(u) < 1.2 && snT > .01) {
  vec2 b = vec2(u*3.2+.22*sin(p.y*11.+2.*wave), p.y*.16/w+seed*7.);
  float plate = noise(b*vec2(2.6, 2.4))*.8+.2*snN(b.x*5.+b.y*3.), crack = snS(.52, .38, plate);
  vec3 bark = mix(vec3(.03, .027, .026), vec3(.07, .056, .047), plate)*(.35+.65*sqrt(max(1.-u*u*.9, .0))*(.75-.35*u))*mix(1., .25, crack);
  // snow driven onto the side the wind comes from, held by the rough of the bark
  float held = snS(-.5, -.8, u+.6*(plate-.5)+.15*(1.-2.*wave*wave))*(1.-.6*crack);
  snLay(mix(wdMist, mix(bark, vec3(.56, .6, .64)*(.8+.3*plate), held), dark), snIn((1.-abs(u))*w), mix(22., 2.5, dark));
 }
}
float wdSeg(vec2 q, vec2 a, vec2 b) { b -= a; q -= a; return length(q-b*sat(dot(q, b)/dot(b, b))); }
// A small round bird, fluffed against the cold.
void wdBird(vec2 q, float own) {
 if (dot(q, q) < .003) {
  float d = smin(wdSeg(q, vec2(-.007, -.003), vec2(.003, .004))-.0125, length(q-vec2(.009, .0165))-.0088, .006);
  d = min(d, wdSeg(q, vec2(-.015, -.009), vec2(-.032, -.021))-.0028);
  vec3 c = mix(vec3(.07, .074, .085), mix(vec3(.5, .07, .035), uKind[3]*uKind[3]*.8, .2)*(.55+.9*uPhrase*own+.4*uKeys+.3*uMic), snS(-.002, .003, q.x-.35*q.y));
  snLay(mix(c, vec3(.008), snS(.0165, .018, q.y+.1*q.x))*(.9+18.*q.y), snIn(-d), 2.5);
 }
}
void snWood(vec2 p, vec3 bough) {
 vec2 q = (p-vec2(.08, .0))*vec2(1.25, 2.);
 wdMist = mix(vec3(.1, .118, .135), vec3(.44, .475, .49), exp(-dot(q, q)));
 // a line of steps going in
 float grain = noise(p*vec2(9., 40.)), steps = 1., y;
 for (int k = 0; k < 8 && p.y < -.26; k++) {
  float g = float(k)/7.;
  vec2 o = (p-vec2(.33-.32*g+.15*g*g+(k % 2 == 0 ? .012 : -.012)*(1.-.6*g), -.49+.2*g*(1.25-.4*g)))/((1.-.62*g)*vec2(.02, .0085));
  steps *= 1.-.55*exp(-dot(o, o)*1.2)*snS(-.9, .6, o.y+.5);
 }
 // who sits on the boughs, and the boughs
 wdBird(p.x < .2 ? p-vec2(-.14, .365) : vec2(.48-p.x, p.y-.475), p.x < .2 ? 1. : .6);
 snLay(mix(vec3(.24, .275, .315), vec3(.78, .8, .81), snS(.0, .8, bough.z+.25*(grain-.5))), bough.y, 2.5);
 snLay(vec3(.015, .023, .02), bough.x, 2.5);
 // rank behind rank, the nearest first
 for (int i = 4; i >= 0; i--) {
  if (snT < .01) break;
  float fi = float(i), near = min(fi/3., 1.), dark = i == 4 ? 1. : mix(.3, .9, near)-.12*(uSpace-.5);
  float cw = .05+.022*fi+.018*fi*fi, y0 = i == 4 ? -.375 : -.09-.045*fi-.018*fi*fi, x = p.x+fi*3.17;
  // its snow: soft heaps, deeper as the loop goes on
  float wave = sin(p.x*3.1+fi*5.3), air = 1.+14.*(p.y+.03+.03*fi)*(p.y+.03+.03*fi);
  y = y0+(i == 4 ? .08 : .03+.02*fi)*(.3*wave+.15*sin(p.x*7.3+fi*2.1)+.35*snDr)-p.y;
  // the air before it, tinted by a kind of sound
  if (i < 4) snCol += snT*uKind[i]*snKind(i)*(.13+.12*wave)*(.5+uEnergy)/(air*air);
  snLay(mix(wdMist, mix(i == 4 ? vec3(.68, .71, .73) : vec3(.6, .63, .65), vec3(.26, .3, .348), snS(.0, .07+.025*fi, y))*(.9+.14*grain)*mix(1., steps, near), .4+.6*near), snIn(y), mix(24., i == 4 ? 2.2 : 7., near));
  // a trunk
  float c = floor(x/cw), h = hash21(vec2(c, fi));
  vec4 tr = vec4((c+.25+.5*h)*cw-fi*3.17, .1*cw*(.6+fract(h*7.3)), .1*(fract(h*23.)-.5), h*9.);
  if (i == 3) tr = abs(p.x-.1) > .65 ? vec4(p.x < .0 ? -.83 : 1.05, .03, .03, 7.) : p.x < .1 ? vec4(-.17, .026, .03, 2.) : vec4(.37, .034, -.04, 5.);
  if (i == 4) tr = p.x < .1 ? vec4(-.53, .074, .05, 1.3) : vec4(.7, .056, -.03, 6.1);
  if (i > 2 || h > .25) wdTrunk(p, tr.x, tr.y, tr.z, dark, tr.w);
  // its firs, tall far off and young near by
  c = floor(x/(cw*2.6)); h = hash21(vec2(c, fi+9.));
  float hi = i < 2 ? (.3+.34*h)*(.35+.65*snS(.08, .3, abs(p.x-x+(c+.5)*cw*2.6-.1))) : .16+.2*h;
  if (i < 4 && h > .3*near) {
   vec3 fir = wdFir(vec2(x-(c+.4+.2*h)*cw*2.6, p.y-y0+.02)/hi, snPx/hi, h*17., i < 2 ? 15. : 8.);
   snLay(mix(wdMist, mix(vec3(.015, .021, .021), vec3(.68, .71, .73)*fir.z, fir.y), dark), fir.x, mix(22., 6., near));
  }
 }
 // the pale sun in the mist
 q = p-vec2(.1, .12);
 snLay(wdMist+vec3(1., .94, .82)*(.25*exp(-dot(q, q)*22.)+.16*snS(.048, .034, length(q)))*(.4+.35*uLevel+1.8*uCue), 1., 40.);
}
// The falling snow, the nearest layer first, lit by the lamp or by the grey day.
void snFall(vec2 p) {
 float lean = .06+.3*uLow+.05*sin(uTime*.11), sway = .05*sin(p.y*5.+uTime*.23), dens = .48+.12*snB+.65*uLevel, through = 1.;
 // where the piece sounds, the flakes take its colour: its time across, its room from the top to the bottom
 vec3 sum = vec3(.0), tint = piece(vec2(p.x*.55+.5, .5-p.y)).rgb*.7;
 for (int i = 7; i >= 0; i--) {
  float fi = float(i), z = i < 3 ? 25.-7.2*fi : i < 6 ? 13.1-1.5*fi : i < 7 ? 3.4 : 2.1, cs = i > 2 && i < 6 ? .34 : .42;
  if (z > snZ) break;
  vec2 q = p*z;
  q.x += lean*q.y+3.7*fi+sway*z*(i % 2 == 0 ? .25 : -.2);
  q /= cs;
  float col = floor(q.x), hc = hash21(vec2(col, fi*7.+1.));
  q.y += mod(uTime, 1920.)*floor(12.6*(.8+.4*hc)/cs+.5)/30.+hc*64.;
  float row = floor(q.y);
  float own = hash21(vec2(col+31.*fi, mod(row, 64.)));
  vec2 at = (q-vec2(col, row)-.5-(fract(own*vec2(37.7, 91.3))-.5)*.56)*cs/z;
  at.x -= at.y*lean;
  float size = (.011+.013*own)/z;
  float R = max(size+.0065*max(8.-z, .0)/z*mix(1.3, .7, uTone), snPx*.9), e = size/R;
  float a = min(e*sqrt(e)*(1.25-.25*snB), 1.)*snS(R, R*.45, length(at))*snS(.0, .22, dens*(1.-.05*fi)-fract(own*5.7+.1*fi))*.9;
  vec3 c = snB > .5 ? vec3(.85, .88, .9) : vec3(.16, .23, .38)+snFire*(4.+3.*uKeys)*snReach(vec3((p-snVp)*z, z)+vec3(.0, 2.5, .0));
  sum += through*a*(max(c, snCol*.95)+tint);
  through *= 1.-a;
 }
 snCol = sum+through*snCol;
}
vec3 render(vec2 p) {
 snPx = 1./uRes.y; snCol = vec3(.0); snT = 1.; snZ = 60.; snDr = .5-.5*cos(TAU*uLoop); snB = step(.5, uVar);
 snFire = mix(vec3(1., .56, .15), snWarm(0), .3*uDrone)*(5.5+3.*uDrone+1.5*uLevel+6.*uCue);
 vec3 bough = snBoughs(p);
 if (uVar < .5) snLane(p, bough); else snWood(p, bough);
 snShake(p, snB > .5 ? vec3(-.2, .32, -.2) : vec3(-.05, .39, .12), snB > .5 ? vec3(1.) : vec3(.3, .4, .6)+snFire*.05);
 snFall(p);
 vec3 c = sat(screenOf(snCol));
 return mix(c, c*c*(3.-2.*c), .35);
}
