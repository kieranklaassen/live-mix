// name: Snowfall
// a: Street lamp
// b: Pine wood
// what: A lane on a winter evening under one street lamp, its cone of light full of falling flakes near and far, snow on the roofs, the wall and a bare tree, old wheel tracks and steps; or a pine wood on a grey day, dark trunks rank behind rank, loaded boughs with two small bright birds, young firs, a pale sun and one line of steps.
// follows: The mix is how thick it snows, the low band leans it, the piece tints the flakes where it sounds. Drone is the lamp, pad, texture and phrase the windows; in the wood each kind tints the air at its own depth and phrase the birds. A hit shakes snow off a limb, a cue lifts the lamp or the sun, the loop deepens the drifts.
// own: 0 the hour: 1 a pale open day, -1 dark with a great disc in the drone's colour; 1 what falls: 1 petals that turn, -1 long slant rain; 2 1 tall houses close on the lane (b: a crowd of thin stems), -1 the houses sink away (b: a few great trunks); 3 the ground: 1 still water that mirrors all, -1 bare ground and roofs in the sounds' colours; 4 the near limbs: 1 in leaf and blossom, -1 none; 5 the eye: 1 high up looking down, -1 low looking up; 6 a: 1 lamps all down the lane, -1 no lamp; b: 1 pale marked bark, -1 fronds that sway; 7 1 it rises and glows in the sounds' colours, -1 few, large and slow
// The picture so far, drawn from the nearest thing back, what is still seen through it, how far off the first thing is, a pixel.
float snS(float a, float b, float x) { x = sat((x-a)/(b-a)); return x*x*(3.-2.*x); }
vec3 snCol;
float snT, snZ, snPx, snDr, snB, snE, snLf, snDay, snNi, snWet, snBare, snTall, snAway;
vec2 snVp;
vec3 snHaze, snTop, snGr;
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
 float lf = max(uOwn[4], .0), fr = .07*lf;
 float sway = .003*sin(uTime*.31)*(.4+uLow), load = mix(.012, .028, snB)+mix(.006, .015, snB)*snDr;
 if (lf+snBare > .0) load *= max(1.-max(lf, snBare), .02);
 bool on = snB < .5 ? p.x < .35 && p.y+fr > (p.x > -.67 ? min(.24, .42*(p.x+.69)) : -.28*(p.x+.7)) : p.x < -.5 ? p.x < -.58 && abs(p.y-.02) < .19+fr : p.x > .22 ? p.y > .22-fr && p.x < .65 : p.y < .09 ? p.x > -.16 && p.y > -.19-fr : p.x > .08 || p.y < .37+fr;
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
  if (lf > .0) snLf = max(snLf, snS(.085, .0, abs(v+.012*snB)/(.6+.6*snN(p.x*9.+fk)))*snS(-.06, .12, u)*snS(1.12, .95, u));
  if (snB > .5 && abs(u-.5) < .55 && abs(v+.025) < .035) {
  float dep = .036*snS(.0, .25, u)*snS(1.06, .8, u)*(.45+snN(p.x*46.+fk*7.));
  m.x = max(m.x, sat((v+dep*(.5+.7*snN((p.x+v*.5*dir)*420.)))/(snPx*1.5)+.5)*snIn(.006-v)*step(.0, u));
  }
  all.x = max(all.x, m.x);
  if (m.y > all.y) all.yz = m.yz;
 }
 return all;
}
// Fallen leaves: a coat of dabs, how thick. g in dabs.
float snFell(vec2 g, out float h) {
 float a = .0; h = .5;
 vec2 i = floor(g);
 for (int n = 0; n < 4; n++) {
  vec2 c = i+vec2(float(n&1), float(n>>1))-step(g-i, vec2(.5))*1., o = hash22(c), q = rot(o.x*TAU)*(g-c-.5-(o-.5)*.7);
  float m = snS(.5, .34, length(q*vec2(1., 1.8)))*step(.25, o.y);
  if (m > a) { a = m; h = fract(o.y*7.3); }
 }
 return a;
}
// Leaf and blossom on the limbs, dab by dab.
void snLeaves(vec2 p, vec3 lit) {
 if (snLf < .02) return;
 for (int k = 0; k < 2; k++) {
  vec2 g = p*(k == 0 ? 52. : 84.), i = floor(g);
  for (int n = 0; n < 9; n++) {
  vec2 c = i+vec2(float(n%3)-1., float(n/3)-1.), h = hash22(c+31.*float(k));
  vec3 b = mix(uKind[1], uKind[3], sat(h.y*1.6-.3)), o = vec3(g-c-.5-(h-.5)*.9, .0);
  float r = (.25+.42*h.x)*sqrt(snLf)*snS(1.-1.25*uOwn[4], 1.2-1.1*uOwn[4], h.y*.4+snLf);
  snLay(b*b*lit*(.62+.5*sat(.5+o.y/.9))*(k == 0 ? 1. : .72), sat((r-length(o.xy))/(snPx*60.)+.2)*step(.02, r), 4.6);
  }
 }
}
// What a hit shakes from a limb. b: its middle, its slope.
void snShake(vec2 p, vec3 b, vec3 c) {
 if (uHits < .01) return;
 float go = 1.-uHits, x = p.x-b.x, y = b.y+b.z*x-p.y, drop = .7*snN(p.x*13.)+.3*snN(p.x*41.);
 float puff = noise(rot(.6)*p*38.+vec2(.0, go*6.)), dust = noise(rot(-.5)*p*210.+vec2(.0, go*20.));
 float fall = .07+.08*drop+(.08+.3*drop)*go*(.6+.4*go);
 snCol += c*uHits*exp(-x*x*34.)*snS(fall, fall*.3, y)*snS(-.025, .03, y-.16*go*go)*(.12+1.7*drop*puff*(.45+.55*dust));
}
// ---- a: the lane. The eye stands at (0, 2.5, 0) and looks along z.
const vec3 snLamp = vec3(-1.5, 3.75, 7.2);
vec3 snFire;
float snOne(vec3 l) { float d2 = dot(l, l); return (.06+.94*snS(.58, .8, l.y*inversesqrt(d2+.01)))/(.6+d2); }
float snReach(vec3 w) {
 float r = snOne(snLamp-w);
 if (uOwn[6] > .0) for (float k = 1.; k < 5.5; k++) r += .8*uOwn[6]*snOne(vec3(mod(k, 2.) > .5 ? 2.1 : -1.5, 3.75, 7.2+3.*k)-w);
 return r;
}
// Lays a surface, lit, then through the air to the eye.
vec3 snFar(vec3 c, float z) { z = 1.+max(z-4., .0)*mix(.013, .03, uSpace); return mix(snHaze, c, 1./(z*z)); }
void snPut(vec3 alb, vec3 w, vec3 n, float a) {
 vec3 amb = mix(vec3(.018, .034, .075), vec3(.062, .118, .255), .5+.5*n.y), l = snLamp-w;
 if (snDay > .0) amb = mix(amb, mix(vec3(.12, .13, .15), vec3(.8, .84, .9), .5+.5*n.y)+vec3(.75, .68, .55)*max(dot(n, vec3(.62, .62, -.48)), .0), snDay);
 if (snNi > .0) amb = mix(amb, amb*.25+uKind[0]*uKind[0]*(.1*max(n.y, .0)+.2*max(n.z, .0)), snNi);
 snLay(snFar(alb*(amb+snFire*1.9*max(dot(n, l)*inversesqrt(dot(l, l)+.01)*.8+.2, .0)*snReach(w)), w.z), a, w.z);
}
// The houses, the nearest first. s: the side of the lane.
void snHouses(vec3 d) {
 float lane = -d.y/2.5;
 bool open = uOwn[2] <= .0 && snE == 2.5 && d.y < -.11 && d.x > -4.2*lane && d.x < 2.6*lane;
 for (int i = d.x < .0 ? 1 : 0; i < (uOwn[5] > .0 ? 9 : 4) && snT > .01 && !open; i += i > 1 ? 1 : 2) {
  vec4 box = i == 0 ? vec4(2.9, 2.5, 3.3, 12.5) : i == 1 ? vec4(4.6, 3., 10.5, 17.) : i == 2 ? vec4(3.4, 2.3, 14.5, 21.) : i > 5 ? vec4(float(i-6)*3.+6., 2.3, i == 7 ? vec2(22., 29.) : i == 6 ? vec2(27., 33.) : vec2(33., 41.)) : i == 5 ? vec4(9.5, 2.5, 21., 28.) : vec4(i == 4 ? -2.8 : -2.6, 2.7, 25., 31.);
  vec2 hgt = i == 1 ? vec2(3.1, 2.6) : vec2(2.8, 2.3);
  if (uOwn[2] != .0) { hgt.x += snTall*2.7; hgt *= 1.-snAway; box.x -= snTall*(i == 1 ? 1.5 : i < 3 ? .6 : .0); box.z += 30.*snAway*snAway; box.w += 30.*snAway*snAway; }
  int k = i > 2 && i < 5 ? 3 : i == 0 ? 1 : 2;
  float s = i == 1 || i == 4 || i == 5 || i == 8 ? -1. : 1., dx = d.x*s, x0 = box.x, hw = box.y, m = hgt.y/hw, snow = .26+.12*snDr, drift = .32+.3*snDr;
  if (snAway+snBare > .0) { snow *= 1.-.9*snAway; drift *= 1.-max(.9*snAway, .8*snBare); }
  float top = hgt.x+snow, xe = x0-.45, te = top-m*.45;
  float z = box.z, X = dx*z, y = snE+d.y*z, u = (X-x0-hw)/hw, f = snPx*z, line = hgt.x+hgt.y*(1.-abs(u)), own = .8, dark = snS(line-.5, line, y);
  float sn = sat((1.12-abs(u))*hw/f+.5)*snBox(y, line-.04, line+snow*1.15, f);
  float a = max(sn, sat((1.-abs(u))*hw/f+(u < .0 ? 1. : .5))*snBox(y, .0, line, f));
  vec3 w = vec3(X*s, y, z), n = vec3(.0, .0, -.9);
  vec2 q = vec2(X-x0-hw, y-hgt.x-.15);
  if (q.y < -.65) { q = vec2(abs(q.x)-hw*.48, y-1.5); own = .36; if (snTall > .0 && y > 2.85) { q.y -= 2.7; own = .7; } }
  if (a < .5 && dx > .01) {
  z = xe/dx; y = snE+d.y*z;
  sn = snBox(z, box.z-.25, box.w, snPx*z/dx)*snBox(y, te-snow-.03*sin(z*2.1)-.03*sin(z*5.3), te+.02, snPx*z);
  z = x0/dx; y = snE+d.y*z; f = snPx*z/dx;
  a = max(a, max(sn, snBox(z, box.z-.1, box.w, f)*snBox(y, .0, 2.5+(te-2.6)*x0/xe+(snE == 2.5 ? .0 : max((top-.1)-(2.5+(te-2.6)*x0/xe), .0)), snPx*z)));
  w = vec3(x0*s, y, z); n = vec3(-s, .0, .0);
  float cell = (z-box.z)/3.1;
  q = vec2((fract(cell)-.5)*3.1, y-1.7); own = fract(floor(cell)*.382+.45); if (snTall > .0 && y > 3.05) { q.y -= 2.7; own = fract(own+.55); } dark = snS(hgt.x-.7, hgt.x, y);
  sn = max(sn, snBox(q.x, -.54, .54, f)*snBox(q.y, -.67, -.53, snPx*z));
  }
  sn = max(sn, sat((drift+.06*sin(w.x*2.+w.z*1.3)-y)/(snPx*z+.06)+.5));
  sn = min(sn/max(a, 1e-3), 1.);
  vec2 aq = abs(q);
  vec3 g = snWarm(k)*(.3+1.9*snKind(k)+(k == 3 ? uMic : .0))*mix(.06, 1., snS(.3, .55, own))*(.75+.6*q.y)*(.75+.25*snS(.08, .3, aq.x));
  g = mix(vec3(.02, .02, .03), g, min(sat((aq.x-.03)/f+.5), sat((abs(q.y-.12)-.03)/f+.5)));
  snLay(snFar(g, z), a*(1.-sn)*sat((.42-aq.x)/f+.5)*sat((.55-aq.y)/f+.5), z);
  snPut(mix(vec3(.19, .165, .15)*(1.-.5*dark)*(snDay > .0 ? 1.+1.4*snDay : 1.), snTop, sn), w, normalize(n+vec3(.0, 1.4*sn, .0)), a);
  float den = d.y-m*dx;
  z = (top-m*x0-snE)/(abs(den) < 1e-3 ? 1e-3 : den); X = dx*z;
  f = z*m*snPx/max(abs(den), 1e-3)+.02;
  if (den < .0 && z > .5 && z < box.w+2.) snPut(snE > 2.6 ? snTop*(1.-.07*(snE-2.5)) : snBare > .0 ? snTop*(1.-.45*snBare*snS(.4, .0, abs(fract((X-xe)*2.2)-.5)+.15*noise(vec2(z*3., X*2.2)))*snS(30., 8., z)) : snTop, vec3(X*s, snE+d.y*z, z), normalize(vec3(-m*s, 1., .0)), snBox(X, xe-.2, x0+hw, snPx*z*1.5+f*abs(dx))*snBox(z, box.z-.25, box.w, f));
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
// The lamps that stand in the lane, and what burns in them.
vec2 snAt(vec3 d, vec3 l) { return d.xy-(l.xy-vec2(.0, snE))/l.z; }
void snLamps(vec3 d) {
 vec3 was = snCol; float t = snT, z = snZ;
 snStreetLamp(snAt(d, snLamp)-vec2(.0, .035));
 if (uOwn[6] < .0) { snCol = mix(snCol, was, -uOwn[6]); snT = mix(snT, t, -uOwn[6]); if (uOwn[6] < -.6) snZ = z; }
 if (uOwn[6] > .0) for (float k = 1.; k < 5.5; k++) {
  vec3 l = vec3(mod(k, 2.) > .5 ? 2.1 : -1.5, 3.75, 7.2+3.*k);
  float by = l.z/7.2, px = snPx;
  vec2 q = snAt(d, l)*by;
  snCol += snT*uOwn[6]*snFire*(.55*exp(-dot(q, q)*3600.)+.02*exp(-length(q)*9.));
  if (l.x > .0) q.x = -q.x;
  was = snCol; t = snT; snPx *= by;
  snStreetLamp(q-vec2(.0, .035));
  snPx = px; snCol = mix(was, snCol, uOwn[6]); snT = mix(t, snT, uOwn[6]);
 }
}
// The wall on the left.
void snWall(vec3 d) {
 float up = d.y, a, z;
 if (d.x < -.01 && snT > .01 && up*snE < .0) {
  float t = 1.98+.14*snDr;
  if (snAway > .0) t *= 1.-.97*snAway;
  z = -2.95/d.x; float y = snE+d.y*z, f = snPx*z;
  a = snBox(y, .0, t, f)*sat((15.5-z)/(f/-d.x)+.5);
  if (a > .0) {
  float row = floor(y/.23);
  vec2 b = vec2(z/.52+.5*mod(row, 2.)+.3*hash11(row), y/.23), e = fract(b);
  float st = hash21(floor(b)), lip = 1.71-.04*snN(z*3.)-1.7*snAway;
  vec3 alb = mix(vec3(.1, .09, .085), vec3(.22, .19, .17), st)*(1.+1.5*snDay)*(.45+.55*snS(.02, .2, min(min(e.x, 1.-e.x)*2.2, min(e.y, 1.-e.y))));
  float lay = max(sat((y-lip)/f+.5), sat((.2+.4*snDr+.3*snN(z*.7)-y)/(f+.03)+.5));
  snPut(mix(alb, snTop, lay), vec3(-2.95, y, z), normalize(mix(vec3(1., .3*(st-.5), .0), vec3(.8, y > 1. ? (y-lip)*5. : .9, .0), lay)), a);
  }
  z = (t-snE)/min(up, -.002);
  if (up < .0) snPut(snTop, vec3(d.x*z, t, z), vec3(.0, 1., .0), snBox(d.x*z, -3.5, -2.85, snPx*z*2.)*sat(15.5-z));
 }
}
// The hill beyond, and the sky, dark above and pale with snow low down.
void snSky(vec3 d, float px) {
 float up = d.y;
 if (snT > .01) {
  float hill = .05+.05*snN(px*2.6)+.06*snS(.1, -.8, px)-up;
  vec3 far = vec3(.045, .075, .15), sky = mix(snHaze*1.15, vec3(.012, .026, .07), snS(-.02, .5, up));
  if (snDay > .0) { far = mix(far, snHaze*.62, snDay); sky = mix(sky, mix(snHaze*1.1, snHaze*vec3(.42, .55, .72), snS(.0, .7, up)), snDay); }
  if (snNi > .0) {
  vec2 q = d.xy-vec2(.16, .2-.14*max(uOwn[5], .0)-.12*min(uOwn[5], .0));
  vec3 k = uKind[0]*uKind[0];
  far *= 1.-.6*snNi;
  sky = mix(sky, sky*.4+k*(.5*exp(-dot(q, q)*5.)*(.6+uDrone)+(.75+.4*noise(q*16.))*snS(.152, .147, length(q))*(.8+.6*uDrone)), snNi);
  }
  snLay(far, snIn(hill+.03*snN(px*60.)*snN(px*9.))*.85, 45.);
  snLay(sky, 1., 60.);
 }
}
// What still water in the lane mirrors: the lane again, from as far under it.
vec3 snMirror(vec3 d, vec2 g, float px) {
 vec3 was = snCol; float t = snT, z = snZ, e = snE, r = noise(vec2(g.x*1.3+3., g.y*1.1-uTime*.23))+.5*noise(vec2(g.x*4., g.y*2.6+uTime*.5))-.75;
 d = vec3(d.x+.012*r, -d.y+.05*r*min(1., 5./g.y), 1.);
 snCol = vec3(.0); snT = 1.; snE = -e;
 if (uOwn[6] > -.7) snLamps(d);
 vec2 v = snAt(d, snLamp);
 snCol += snFire*(.5*exp(-v.x*v.x*1500.-v.y*v.y*60.)+.03*exp(-v.x*v.x*60.-v.y*v.y*9.));
 snWall(d); snHouses(d); snSky(d, px);
 vec3 m = snCol; snCol = was; snT = t; snZ = z; snE = e;
 return m;
}
void snLane(vec2 p, vec2 bp, vec3 bough) {
 vec3 d = vec3(p-snVp, 1.);
 float up = d.y, a, z, plas = .0;
 vec2 lp = snVp+(snLamp.xy-vec2(.0, snE))/snLamp.z, v = p-lp;
 float near = exp(-dot(v, v)*12.);
 snLeaves(bp, mix(vec3(.3, .36, .5)*(1.-.6*snNi), vec3(1.5), snDay)+snFire*.3*near);
 p = bp;
 float tw = .037+.012*snS(.1, -.2, p.y)-.03*(p.y-.1), u = (p.x+.72-.05*sin(p.y*4.)-.06*p.y)/tw;
 if (abs(u) < 1.1) { a = snIn((1.-abs(u))*tw); bough.x = max(bough.x, a); plas = a*snS(.55, .8, u+.5*noise(p*vec2(30., 26.))-.1); }
 snLay(snBare > .0 ? mix(vec3(.075, .13, .26), vec3(.02, .02, .018), snBare)+snFire*.03*near : snDay > .0 ? mix(vec3(.075, .13, .26), vec3(1.05), snDay) : vec3(.075, .13, .26)+snFire*.03*near, max(bough.y, plas), 5.);
 snLay(vec3(.007, .01, .018)*(.7+.6*snN(p.x*90.+4.*sin(p.y*9.)))+vec3(.05, .022, .008)*near*(1.+uDrone), bough.x, 5.);
 p = d.xy+snVp;
 snLamps(d);
 float through = snT;
 snWall(d);
 snHouses(d);
 if (up < -.004 && snT > .01) {
  z = -snE/d.y;
  vec2 g = vec2(d.x*z, z), way = vec2(.55+.5*sin(z*.17+.6)-.02*z, -1.15-.15*sin(z*.7));
  float soft = snS(26., 8., z), h = snLie(g, way, soft), heap = cos(g.x*2.1+1.5*sin(z*.6));
  vec3 n = normalize(vec3((h-snLie(g+vec2(.06, .0), way, soft))/.06-.1*heap, 1., (h-snLie(g+vec2(.0, .06), way, soft))/.06-.04*heap));
  float a = sat(-up/snPx);
  if (snWet > .0) {
  float w = a*snS(.0, .16, snWet*1.2-.45*noise(g*vec2(.5, .3)+7.)-.35*abs(h)-.1);
  snCol += snT*w*snMirror(d, g, p.x)*mix(.55, .9, snS(.35, .05, -up)); snT *= 1.-w;
  }
  snCol += snT*a*snWarm(1)*(1.-snAway)*(.05+.4*uPad)*(.4-.4*cos(TAU*(z-3.3)/3.1))*exp(-(g.x-2.1)*(g.x-2.1)*1.1)*snBox(z, 4., 12., 1.)*max(n.y*1.4+n.x-.4, .0);
  vec3 lie = snSnow;
  if (snBare > .0) {
  float st, fell = snFell(g*vec2(7., 6.), st);
  fell = mix(fell, .45, snS(6., 16., z))*snS(.15, .5, noise(g*.9)+.5*snS(1., 2.6, abs(g.x)))*max(uOwn[4], .0);
  st = mix(st, noise(g*vec2(5., 4.)), step(fell, .1));
  lie = mix(lie, mix(snGr*(.6+.7*st), mix(uKind[1], uKind[3], st), fell), snBare);
  }
  snPut(lie, vec3(g.x, h*.3, z), n, a);
 }
 snSky(d, p.x);
 vec3 rd = normalize(d), lv = snLamp-vec3(.0, snE, .0);
 float b = dot(lv, rd), c2 = sqrt(max(dot(lv, lv)-b*b, .0)+.02);
 float cone = .1+.9*snS(.32, .78, (.012-v.y)/(length(v-vec2(.0, .012))+.004));
 v.y = v.y*1.5-.009;
 snCol += through*snFire*((atan((min(snZ, 40.)*length(d)-b)/c2)+atan(b/c2))/c2*(cone*.022+.0025)*(.75+.4*uEnergy)+.9*exp(-dot(v, v)*9000.));
}
// ---- b: the wood.
vec3 wdMist, wdSnow;
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
 float weed = max(-uOwn[6], .0), pale = max(uOwn[6], .0);
 if (weed > .0) {
  float s = p.y*.11/w+seed*3.;
  x += weed*w*1.5*sin(p.y*5.5+seed*5.-uTime*.4);
  s += p.x-lean*p.y > x ? .5 : .0;
  w *= mix(1., .45+1.5*abs(fract(s)-.5), weed);
 }
 float wave = sin(p.y*5.+seed), u = (p.x-x-lean*p.y)/w-.15*wave;
 if (abs(u) < 1.2 && snT > .01) {
  vec2 b = vec2(u*3.2+.22*sin(p.y*11.+2.*wave), p.y*.16/w+seed*7.);
  float plate = noise(b*vec2(2.6, 2.4))*.8+.2*snN(b.x*5.+b.y*3.), crack = snS(.52, .38, plate);
  vec3 bark = mix(vec3(.03, .027, .026), vec3(.07, .056, .047), plate)*(.35+.65*sqrt(max(1.-u*u*.9, .0))*(.75-.35*u))*mix(1., .25, crack);
  if (pale > .0) {
  float row = p.y*.2/w+seed*3., mark = max(snS(.64, .74, noise(vec2(u*1.1+seed*9., row*2.6)))*snS(.95, .6, abs(u))*(1.-snTall), snS(.03-.014*snTall, .012-.01*snTall, abs(fract(row*mix(.35, .25, snTall))-.5))*(1.-.4*snTall));
  bark = mix(bark, mix(vec3(.62, .61, .58), uKind[2]*uKind[2]*1.1+.06, .5)*wdSnow*(.3+.8*sqrt(max(1.-u*u*.9, .0))*(.75-.35*u))*(1.-.85*mark)*(.85+.3*plate), pale);
  }
  if (weed > .0) bark = mix(bark, mix(uKind[1]*uKind[1], uKind[3]*uKind[3], snN(seed*3.))*wdSnow*(.12+.5*u*u+.15*plate), weed);
  float held = snS(-.5, -.8, u+.6*(plate-.5)+.15*(1.-2.*wave*wave))*(1.-.6*crack);
  held *= 1.-max(max(snBare, weed), .6*pale);
  snLay(mix(wdMist, mix(bark, vec3(.56, .6, .64)*wdSnow*(.8+.3*plate), held), dark), snIn((1.-abs(u))*w), mix(22., 2.5, dark));
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
void snWood(vec2 p, vec2 bp, vec3 bough) {
 vec2 q = (p-vec2(.08, .0))*vec2(1.25, 2.);
 wdMist = mix(vec3(.1, .118, .135), vec3(.44, .475, .49), exp(-dot(q, q)));
 wdSnow = vec3(1.);
 if (snDay > .0) { wdMist = mix(wdMist, mix(vec3(.5, .55, .6), vec3(1.5, 1.45, 1.35), exp(-dot(q, q)*.8)), snDay); wdSnow += .9*snDay; }
 if (snNi > .0) { vec3 k = uKind[0]*uKind[0]; wdMist = mix(wdMist, mix(k*.03+vec3(.004, .006, .01), k*(.32+.25*uDrone), exp(-dot(q, q)*3.)), snNi); wdSnow = mix(wdSnow, k*.3+.05, snNi); }
 float grain = noise(p*vec2(9., 40.)), steps = 1., y;
 for (int k = 0; k < 8 && p.y < -.26; k++) {
  float g = float(k)/7.;
  vec2 o = (p-vec2(.33-.32*g+.15*g*g+(k % 2 == 0 ? .012 : -.012)*(1.-.6*g), -.49+.2*g*(1.25-.4*g)))/((1.-.62*g)*vec2(.02, .0085));
  steps *= 1.-.55*exp(-dot(o, o)*1.2)*snS(-.9, .6, o.y+.5);
 }
 vec2 was = p; p = bp;
 wdBird(p.x < .2 ? p-vec2(-.14, .365) : vec2(.48-p.x, p.y-.475), p.x < .2 ? 1. : .6);
 snLeaves(p, wdSnow*.9);
 p = was;
 snLay(mix(vec3(.24, .275, .315), vec3(.78, .8, .81), snS(.0, .8, bough.z+.25*(grain-.5)))*wdSnow, bough.y, 2.5);
 snLay(vec3(.015, .023, .02), bough.x, 2.5);
 for (int i = 4; i >= 0; i--) {
  if (snT < .01) break;
  float fi = float(i), near = min(fi/3., 1.), dark = i == 4 ? 1. : mix(.3, .9, near)-.12*(uSpace-.5);
  float cw = .05+.022*fi+.018*fi*fi, y0 = i == 4 ? -.375 : -.09-.045*fi-.018*fi*fi, x = p.x+fi*3.17;
  if (uOwn[5] != .0) y0 += uOwn[5] > .0 ? uOwn[5]*(.54-.165*fi) : uOwn[5]*(.12+.08*fi);
  float wave = sin(p.x*3.1+fi*5.3), air = 1.+14.*(p.y+.03+.03*fi)*(p.y+.03+.03*fi);
  y = y0+(i == 4 ? .08 : .03+.02*fi)*(.3*wave+.15*sin(p.x*7.3+fi*2.1)+.35*snDr)-p.y;
  if (i < 4) snCol += snT*uKind[i]*snKind(i)*(.13+.12*wave)*(.5+uEnergy)/(air*air);
  vec3 lie = mix(i == 4 ? vec3(.68, .71, .73) : vec3(.6, .63, .65), vec3(.26, .3, .348), snS(.0, .07+.025*fi, y))*wdSnow;
  if (snBare > .0) {
  float lit, s = snFell(vec2(p.x, p.y*2.6)*(95.-16.*fi)+fi*9., lit);
  vec3 k = mix(uKind[1], uKind[3], lit);
  lie = mix(lie, mix(snGr*(.8+.4*grain), k*k, s*snS(.2, .55, noise(p*vec2(5., 14.)+fi)+.4*max(uOwn[4], .0)))*wdSnow*mix(1.1, .4, snS(.0, .16, y)), snBare);
  }
  snLay(mix(wdMist, lie*(.9+.14*grain)*mix(1., steps, near), .4+.6*near), snIn(y), mix(24., i == 4 ? 2.2 : 7., near));
  float c = floor(x/cw), h = hash21(vec2(c, fi));
  vec4 tr = vec4((c+.25+.5*h)*cw-fi*3.17, .1*cw*(.6+fract(h*7.3)), .1*(fract(h*23.)-.5), h*9.);
  if (i == 3) tr = abs(p.x-.1) > .65 ? vec4(p.x < .0 ? -.83 : 1.05, .03, .03, 7.) : p.x < .1 ? vec4(-.17, .026, .03, 2.) : vec4(.37, .034, -.04, 5.);
  if (i == 4) tr = p.x < .1 ? vec4(-.53, .074, .05, 1.3) : vec4(.7, .056, -.03, 6.1);
  if (uOwn[2] != .0) {
  if (i < 3) tr.y *= snAway > .0 ? mix(1., 1.7*snS(.45, .6, h), snAway) : 1.-.3*snTall;
  else {
  tr.y *= snAway > .0 ? 1.+(i == 4 ? 1.1 : .8)*snAway : 1.-.75*snTall;
  if (snTall > .0) {
  float w2 = cw*.3, x2 = floor(x/w2), h2 = hash21(vec2(x2, fi+4.));
  wdTrunk(p, (x2+.25+.5*h2)*w2-fi*3.17, snTall*w2*.1*(.5+.8*h2), .06*(h2-.5), dark, h2*9.);
  }
  }
  }
  if (i > 2 || h > .25) if (tr.y > .0004) wdTrunk(p, tr.x, tr.y, tr.z, dark, tr.w);
  c = floor(x/(cw*2.6)); h = hash21(vec2(c, fi+9.));
  float hi = i < 2 ? (.3+.34*h)*(.35+.65*snS(.08, .3, abs(p.x-x+(c+.5)*cw*2.6-.1))) : .16+.2*h;
  if (uOwn[2] > .0 || uOwn[6] < .0) hi = max(hi*(1.-max(uOwn[2], -uOwn[6])), .01);
  if (i < 4 && h > .3*near) {
  vec3 fir = wdFir(vec2(x-(c+.4+.2*h)*cw*2.6, p.y-y0+.02)/hi, snPx/hi, h*17., i < 2 ? 15. : 8.);
  vec3 on = vec3(.68, .71, .73);
  if (snBare > .0) on = mix(on, mix(uKind[1]*uKind[1], uKind[2]*uKind[2], h)*.7, snBare);
  snLay(mix(wdMist, mix(vec3(.015, .021, .021), on*wdSnow*fir.z, fir.y), dark), fir.x, mix(22., 6., near));
  }
 }
 q = p-vec2(.1, .12);
 vec3 sun = vec3(1., .94, .82)*(.25*exp(-dot(q, q)*22.)+.16*snS(.048, .034, length(q)))*(.4+.35*uLevel+1.8*uCue);
 if (snNi > .0) sun = mix(sun, uKind[0]*uKind[0]*(1.+.6*uDrone+uCue)*(.35*exp(-dot(q, q)*14.)+(.7+.4*noise(q*14.))*snS(.163, .158, length(q))), snNi);
 snLay(wdMist+sun*(1.+snDay), 1., 40.);
}
// The falling snow, the nearest layer first, lit by the lamp or by the grey day.
void snFall(vec2 p) {
 float lean = .06+.3*uLow+.05*sin(uTime*.11), sway = .05*sin(p.y*5.+uTime*.23), dens = .48+.12*snB+.65*uLevel, through = 1.;
 vec3 sum = vec3(.0), tint = piece(vec2(p.x*.55+.5, .5-p.y)).rgb*.7;
 float pet = max(uOwn[1], .0), rain = max(-uOwn[1], .0), rise = max(uOwn[7], .0), few = max(-uOwn[7], .0);
 float ring = length(p-vec2(.0, .1))-1.1*(1.-uHits);
 ring = uHits*abs(uOwn[4])*exp(-ring*ring*12.);
 if (uOwn[4] < .0) snCol *= 1.+.3*ring;
 if (rain > .0) { lean += .16*rain; sway *= 1.-rain; }
 for (int i = 7; i >= 0; i--) {
  float fi = float(i), z = i < 3 ? 25.-7.2*fi : i < 6 ? 13.1-1.5*fi : i < 7 ? 3.4 : 2.1, cs = i > 2 && i < 6 ? .34 : .42;
  if (uOwn[7] < .0) cs *= 1.+1.1*few;
  if (z > snZ) break;
  vec2 q = p*z;
  q.x += lean*q.y+3.7*fi+sway*z*(i % 2 == 0 ? .25 : -.2);
  q /= cs;
  if (rain > .0) q.y /= 1.+3.*rain;
  float col = floor(q.x), hc = hash21(vec2(col, fi*7.+1.));
  q.y += mod(uTime, 1920.)*floor(12.6*(.8+.4*hc)/cs*(1.+.5*rain-.45*pet)*(1.-1.35*rise)*(1.-.45*few)+.5)/30.+hc*64.;
  float row = floor(q.y);
  float own = hash21(vec2(col+31.*fi, mod(row, 64.)));
  vec2 at = (q-vec2(col, row)-.5-(fract(own*vec2(37.7, 91.3))-.5)*.56)*cs/z;
  if (rain > .0) at.y *= 1.+3.*rain;
  at.x -= at.y*lean;
  float size = (.011+.013*own)/z;
  if (uOwn[1] != .0 || uOwn[7] != .0) {
  size *= (1.+1.9*pet)*(1.-.45*rain)*(1.+1.6*few);
  if (pet > .0) { at *= rot(pet*(own*40.+uTime*(.3+.5*hc))); at.y *= 1.+pet*(.7+1.1*sin(uTime*(.6+.7*own)+own*50.)); at.y += pet*9.*z*at.x*at.x; }
  at.y /= 1.+11.*rain;
  }
  float R = max(size+.0065*max(8.-z, .0)/z*mix(1.3, .7, uTone), snPx*.9), e = size/R;
  float a = min(e*sqrt(e)*(1.25-.25*snB), 1.)*snS(R, R*.45, length(at))*snS(.0, .22, dens*(1.-.05*fi)-fract(own*5.7+.1*fi))*.9;
  vec3 c = snB > .5 ? vec3(.85, .88, .9) : vec3(.16, .23, .38)+snFire*(4.+3.*uKeys)*snReach(vec3((p-snVp)*z, z)+vec3(.0, snE, .0));
  if (snB > .5 && snNi > .0) c = mix(c, c*wdSnow, snNi);
  if (snB < .5 && snDay > .0) c = mix(c, vec3(1.15), snDay);
  vec3 f = max(c, snCol*.95)+tint;
  if (rain > .0) { a *= 1.-.45*rain; f = mix(f, c*.7+snCol*.75+tint, rain); }
  if (pet > .0) { vec3 k = mix(uKind[1], uKind[3], fract(own*3.3)); f = mix(f, k*k*(snB > .5 ? wdSnow : mix(c*2.4, vec3(1.3), snDay))*(.7+.5*hc)+tint*.5, pet); }
  if (rise > .0) { int n = int(own*4.99); vec3 k = uKind[n]; f = mix(f, k*k*(.7+3.*snKind(n))*(1.2+.6*sin(uTime*.7+own*90.))*(1.+6./(1.+z)), rise); }
  if (ring > .0) { f = mix(f, uKind[4]*uKind[4]*1.4, min(2.*ring, 1.)); a = min(a*(1.+3.*ring), 1.); }
  sum += through*a*f;
  through *= 1.-a;
 }
 snCol = sum+through*snCol;
}
vec3 render(vec2 p) {
 snPx = 1./uRes.y; snCol = vec3(.0); snT = 1.; snZ = 60.; snDr = .5-.5*cos(TAU*uLoop); snB = step(.5, uVar);
 snFire = mix(vec3(1., .56, .15), snWarm(0), .3*uDrone)*(5.5+3.*uDrone+1.5*uLevel+6.*uCue);
 if (uOwn[6] < .0 && snB < .5) snFire *= 1.+uOwn[6];
 snDay = max(uOwn[0], .0); snNi = max(-uOwn[0], .0); snTall = max(uOwn[2], .0); snAway = max(-uOwn[2], .0); snWet = max(uOwn[3], .0); snBare = max(-uOwn[3], .0);
 snFire *= 1.-.75*snDay;
 snE = 2.5+4.5*max(uOwn[5], .0)+1.75*min(uOwn[5], .0);
 snVp = vec2(.1, .03+.24*max(uOwn[5], .0)+.2*min(uOwn[5], .0));
 snHaze = vec3(.06, .108, .215); snTop = snSnow; snGr = vec3(.0); snLf = .0;
 if (snDay > .0) snHaze = mix(snHaze, vec3(.86, .9, .95), snDay);
 if (snNi > .0) snHaze = mix(snHaze, snHaze*.12+uKind[0]*uKind[0]*.1, snNi);
 if (snBare > .0) { snTop = mix(snTop, uKind[2]*uKind[2]*.6+.02, snBare); snGr = uKind[0]*uKind[0]*.6+.03; }
 vec2 w = p, bp;
 float mir = .0;
 if (snB > .5) {
  float line = mix(-.62, -.2, snWet), deep = line-p.y;
  if (uOwn[5] < .0) { w.x *= 1.-.75*uOwn[5]*(p.y+.4); }
  if (snWet > .0 && deep > .0) {
  float r = noise(vec2(p.x*7., -1.1/(deep+.03)+uTime*.3))+.5*noise(vec2(p.x*19., -2.3/(deep+.03)-uTime*.5))-.75;
  w = vec2(w.x+.02*r*(deep+.02), line+deep+.16*r*deep); mir = 1.;
  }
 }
 bp = w;
 if (uOwn[4] < .0) bp += uOwn[4]*(snB > .5 ? vec2(.0, .8) : vec2(-1.15, .0));
 vec3 bough = snBoughs(bp);
 if (uVar < .5) snLane(w, bp, bough); else snWood(w, bp, bough);
 if (mir > .5) { snCol = snCol*.72+wdMist*.03; snZ = 40.; }
 if (uOwn[4] >= .0) snShake(bp, snB > .5 ? vec3(-.2, .32, -.2) : vec3(-.05, .39, .12), uOwn[4] > .0 ? mix(vec3(.6), uKind[1]*uKind[1]*1.3-snCol, uOwn[4]) : snB > .5 ? vec3(1.) : vec3(.3, .4, .6)+snFire*.05);
 snFall(p);
 vec3 c = sat(screenOf(snCol));
 return mix(c, c*c*(3.-2.*c), .35);
}
