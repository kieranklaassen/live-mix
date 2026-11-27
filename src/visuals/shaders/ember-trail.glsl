// name: Ember trail
// a: Powder maze
// b: Hung coil
// what: Seen from above, a tray of white ash with a combed edge and a winding line of brown incense powder: behind one small ember it has burned to pale ash, far ahead it is laid again, and a thread of smoke leans away; or great coils of incense hung in rows under a smoky ceiling, each with a red point, pale ash and a slip of paper.
// follows: An ember burns on with the loop; powder and coils are thick and coloured where the piece is loud. Drone brightens embers, and each hung one answers a kind of sound; pad widens smoke, phrase curls it, bands sway it, texture roughens ash, keys spark or light the slips. A hit flares embers and drops ash; a cue glows along old ash, or from near coils to far.
// own: 0 1 many and small (a: more mazes beside it), -1 few and great, seen close; 1 a: 1 bent round into a wreath of three, -1 loosened into a wandering river, b: 1 tall spires, -1 flat discs; 2 1 no tray and no ceiling, open ground or air, -1 a round tray (b: a roof of glass panes); 3 1 night, lit by the embers, -1 a low sun with long shadows (b: dark against the light); 4 1 a channel of water (b: clear glass), -1 a string of beads; 5 1 fallen petals (b: long ribbons), -1 the ash is raked round the line (b: round lanterns); 6 1 it goes on glowing far behind, -1 it never burns away; 7 the eye: 1 low along the ground (b: straight under), -1 above, the tray corner on (b: level)
// The maze, one closed line on ten by eight cells: which step a cell is, and which cell a step is; four to a number.
const uvec4 etAt[5] = uvec4[5](uvec4(0x4d4e4f00u, 0x494a4b4cu, 0x06014748u, 0x3a393807u), uvec4(0x463d3c3bu, 0x37080502u, 0x3f403536u, 0x0403453eu), uvec4(0x340b0a09u, 0x44434241u, 0x191a1b1cu, 0x3132330cu), uvec4(0x161d2b2cu, 0x0e0d1817u, 0x2a2d300fu, 0x1314151eu), uvec4(0x2f101112u, 0x201f292eu, 0x24232221u, 0x28272625u));
const uvec4 etWay[5] = uvec4[5](uvec4(0x1e140a00u, 0x0c0b151fu, 0x22212016u, 0x3837362cu), uvec4(0x3f404142u, 0x34333d3eu, 0x292a2b35u, 0x463c3228u), uvec4(0x4a494847u, 0x4e4d4c4bu, 0x313b454fu, 0x43443a30u), uvec4(0x2d2e2f39u, 0x17181923u, 0x100f0e0du, 0x1b1c1211u), uvec4(0x2625241au, 0x09131d27u, 0x05060708u, 0x01020304u));
float etCell = .094, etR = .24, etLen, etPx, etShift = 0., etTall, etPitch;
vec2 etPan = vec2(0.), etF = vec2(1., 0.);
vec3 etDim = vec3(1.);
float etP(float x) { return max(x, 0.); }
float etOff(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
float etBell(float x) { return exp(-x*x); }
int etByte(uint four, int i) { return int((four >> uint(8*(i & 3))) & 255u); }
vec2 etStep(int i) { i = i % 80; int k = etByte(etWay[i >> 4][(i >> 2) & 3], i); return vec2(k % 10, k/10); }
// Laid by hand: never quite straight.
vec2 etHand(vec2 u) {
 vec2 far = uOwn[1] < 0. ? -.8*uOwn[1]*vec2(sin(u.y*.62+2.+.8*sin(u.x*.45)), sin(u.x*.57+1.+.7*sin(u.y*.5))) : vec2(0.);
 return far+.085*vec2(sin(u.y*1.7+1.+.6*sin(u.x*.9)), sin(u.x*1.5+.4+.7*sin(u.y*1.1)))+.012*vec2(sin(u.y*4.1), sin(u.x*3.7+2.));
}
// Nearest place on the line: x to its side, y along it in cells.
vec2 etLine(vec2 u) {
 vec2 c = floor(u);
 if (c.x < 0. || c.y < 0. || c.x > 9. || c.y > 7.) return vec2(9., 0.);
 int k = int(c.y)*10+int(c.x), i = etByte(etAt[k >> 4][(k >> 2) & 3], k);
 vec2 a = etStep(i+79) - c, b = etStep(i+1) - c, f = u - c - .5;
 if (dot(a, b) < -.5) return vec2(a.x*f.y - a.y*f.x, float(i)+.5+dot(f, b));
 float A = dot(f, a), B = dot(f, b), turn = sign(a.x*b.y - a.y*b.x), t, side;
 if (A < etR && B < etR) {
  side = etR - length(vec2(A, B) - etR);
  t = .5 - etR+etR*atan(etR - A+1e-4, etR - B+1e-4);
 } else if (A > B) { side = B; t = .5 - A; }
 else { side = A; t = etLen - .5+B; }
 return vec2(side*turn, float(i)+t/etLen);
}
// Where a place along the line lies.
vec2 etPlace(float s) {
 s = mod(s, 80.);
 int i = int(s);
 float t = s - float(i);
 vec2 c = etStep(i), a = etStep(i+79) - c, b = etStep(i+1) - c;
 if (dot(a, b) < -.5) return c+.5+b*(t - .5);
 t *= etLen;
 if (t < .5 - etR) return c+.5+a*(.5 - t);
 if (t > etLen - .5+etR) return c+.5+b*(t - etLen+.5);
 float w = (t - .5+etR)/etR;
 return c+.5+a*(etR - etR*sin(w))+b*(etR - etR*cos(w));
}
// How many cells behind the ember; under 0 it is still to burn.
float etBehind(float s) { float d = mod(uLoop*80. - s+etShift, 80.); return d > 72. ? d - 80. : d; }
// From the tray, in cells from its middle, to the maze and back: bent round a point, or laid side by side.
vec2 etTo(vec2 w) {
 float o = etP(uOwn[1]), n = etP(uOwn[0]), c = .20944*o;
 if (o > 0.) {
  w = w*(1.+1.15*o) - vec2(0., o*o/c);
  etF = vec2(1.+c*w.y, -c*w.x);
  float l = max(length(etF), 1e-3);
  w = vec2(-atan(etF.y, etF.x+1e-6), log(l))/c;
  etF /= l;
 }
 if (o+n > 0.) {
  vec2 per = vec2(10., 8.)+7.*(1. - max(o, n))*(1. - max(o, n)), k = floor(w/per+.5);
  if (n == 0.) k.y = 0.;
  if (uOwn[2] <= 0.) k = clamp(k, -1., 1.);
  w -= k*per;
  if (mod(k.x+k.y, 2.) > .5) { w = -w; etF = -etF; }
  etShift = mod(dot(k, vec2(29., 47.)), 80.);
 }
 return w+vec2(5., 4.)+etPan;
}
vec2 etFrom(vec2 u) {
 float o = etP(uOwn[1]), c = .20944*o;
 u -= vec2(5., 4.)+etPan;
 if (o > 0.) u = (vec2(exp(c*u.y)*sin(c*u.x), exp(c*u.y)*cos(c*u.x) - 1.+o*o)/c)/(1.+1.15*o);
 return u;
}
// Raked round the line, as a garden of gravel is.
float etRake(vec2 v) {
 float x = abs(etLine(v).x);
 if (x > 2.) x = .5+length(max(abs(v - vec2(5., 4.)) - vec2(5., 4.), 0.));
 else x = min(x, .5);
 return sin(x*TAU*4.);
}
// How high the powder or its ash stands here.
float etHigh(vec2 u, float w) {
 vec2 l = etLine(u);
 if (abs(l.x) > .5) return 0.;
 float d = etBehind(l.y), crumb = noise(u*5.)*.04+noise(u*15.)*.06 - .05;
 float h = etOff(w - .065, w+.075, abs(l.x)+crumb), burns = 1. - etP(-uOwn[6]);
 if (uOwn[4] < 0.) {
  vec2 b = vec2((fract(l.y*3.) - .5)/3., l.x)/(.13+.15*w);
  h = mix(h, sqrt(etP(1. - dot(b, b))), -uOwn[4]);
 }
 float ash = burns*smoothstep(-.1, .5, d), gone = burns*smoothstep(46., 52., d), laid = smoothstep(53., 64., d);
 float rough = noise(vec2(l.y*7., l.x*8.));
 float ashH = .66 - (.2+.4*uTexture)*rough*rough;
 return h*mix(mix(1., ashH, ash), mix(.12, 1., laid), gone);
}
// Where that is in the picture.
vec2 etScreen(vec2 u, mat2 turn, float zoom) {
 vec2 q = etFrom(u)*etCell*turn+vec2(.03, 0.);
 if (uOwn[7] != 0.) {
  float a = 1.15*etP(uOwn[7]), e = .15*(1. - etP(-uOwn[7])), Q = q.y/((1.1+.7*etP(uOwn[7]))*zoom), b = max(1.+a*Q, .05);
  float y = 2.*Q/(b+sqrt(etP(b*b+4.*e*Q)));
  return vec2(q.x*max(1. - a*y, .1)/(zoom*(1.+e*y)), y);
 }
 float y = (sqrt(max(1.+.6*q.y/(1.1*zoom), 0.)) - 1.)/.3;
 return vec2(q.x/(zoom*(1.+.15*y)), y);
}
// A thread of smoke: two thin sheets that turn about each other as they rise.
float etSmoke(vec2 q, float carry) {
 float h = q.y;
 if (h < 0. || h > .95) return 0.;
 float t = uTime, up = smoothstep(0., .5, h);
 float x = q.x - carry*up*.8;
 float sway = .012+.05*uLevel+.1*band(h*1.5);
 float bend = .16*h+.22*h*h - .06*uMic*h+h*sway*sin(h*8. - t*.7)+.5*h*sway*sin(h*17. - t*1.1+1.3);
 bend += uPhrase*(.12*h*h+.03*h)*sin(h*24. - t*1.5+2.*sin(h*7. - t*.4));
 x -= bend;
 float w = .0025+(.035+.07*uPad+.02*uSpace)*h, soft = .0014+.012*h, d = 0.;
 if (abs(x) > w*1.5+soft*3.) return 0.;
 for (int i = 0; i < 2; i++) {
  float f = float(i), k = h*(11.+4.*f) - t*(.8+.17*f)+f*2.;
  float a = w*(sin(k)+.35*sin(k*2.3+1.)), b = w*(sin(k+1.4+sin(h*5. - t*.31)) - .3*sin(k*1.7));
  float lo = min(a, b), hi = max(a, b);
  float fill = smoothstep(lo - soft, lo+soft, x)*etOff(hi - soft, hi+soft, x);
  float ea = (x - a)/soft, eb = (x - b)/soft;
  d += fill*(.25+.6*soft/(hi - lo+soft))+.42*exp(-ea*ea)+.28*exp(-eb*eb);
 }
 return d*.55*smoothstep(0., .02, h)*exp(-h*1.5)*etOff(.55, .95, h);
}
vec3 etMaze(vec2 p) {
 float asp = uRes.x/uRes.y, zoom = asp < 1. ? max(1., 1.16/asp) : max(1., 1.35/asp);
 float over = etP(-uOwn[7]), low = etP(-uOwn[3]), night = etP(uOwn[3]), round_ = etP(-uOwn[2]), wet = etP(uOwn[4]), raked = etP(-uOwn[5]);
 mat2 turn = rot((asp < 1. ? 1.44 : .12)+.66*over);
 vec2 q = p*vec2(1., 1.1)*(1.+.15*p.y)*zoom;
 if (uOwn[7] != 0.) q = p*vec2(1., 1.1+.7*etP(uOwn[7]))*(1.+.15*(1. - over)*p.y)/max(1. - 1.15*etP(uOwn[7])*p.y, .1)*zoom;
 etCell *= exp2(-uOwn[0]*(uOwn[0] > 0. ? 1.45 : 1.15));
 if (uOwn[0] < 0.) {
  for (int i = -3; i < 4; i++) etPan += (etPlace(uLoop*80.+5.*float(i)+80.) - vec2(5., 4.))/7.;
  etPan *= -uOwn[0]*(1. - etP(uOwn[1]));
 }
 vec2 m = turn*(q - vec2(.03, 0.)), u = etTo(m/etCell);
 vec2 L = turn*normalize(vec2(-.8, .55)), lu = vec2(dot(L, etF), L.y*etF.x - L.x*etF.y);
  // the tray: a dark lacquered rim, a straw mat under it
 vec2 half_ = vec2(.62, .5)+2.*etP(uOwn[2]), bx = mix(abs(m) - half_, vec2(length(m) - .6), round_);
 float tray = length(max(bx, 0.))+min(max(bx.x, bx.y), 0.) - .02;
 vec2 bl = mix(abs(m+L*.03) - half_, vec2(length(m+L*.03) - .6), round_);
 float trayL = length(max(bl, 0.))+min(max(bl.x, bl.y), 0.) - .02;
 vec3 col;
  // daylight from the upper left, crossed by two soft bars
 float wx = p.x*.8 - p.y*.62+.012*sin(uTime*.05), wide = .05+.05*uSpace;
 float bars = etBell((wx - .34)/wide)+etBell((wx+.2)/wide);
 float light = (1.06 - .52*smoothstep(-.4, .95, wx))*(1. - .16*bars)*(.96+.08*uTone);
 vec2 eu = etPlace(uLoop*80.+etShift), ev = eu - etHand(eu - etHand(eu));
 if (uOwn[1] < 0.) for (int i = 0; i < 6; i++) ev = eu - etHand(ev);
 float ed = length(u - ev), pool = exp(-ed*.33);
 light = mix(light, .17+.05*p.y+pool*(.8+.5*uLevel+.7*uHits), night);
 light *= 1. - .25*low*smoothstep(.1, .6, wx);
 if (tray < 0.) {
  vec2 g0 = m/etCell+vec2(5., 4.);
  float soft = noise(g0*.55) - noise(g0*.55+L*.35)+.5*(noise(g0*1.9+3.) - noise(g0*1.9+3.+L*.3));
  float fine = noise(g0*22.) - noise(g0*22.+L*.6);
  vec2 v = u+etHand(u), l = etLine(v);
  float d = etBehind(l.y), s = fract(l.y/80.);
  float w = .17, full = 0.; vec4 here = vec4(0.);
  vec2 gu = rot(.6)*u*26.; gu.x += .37*floor(gu.y);
  vec2 gid = floor(gu); float g = hash21(gid), g2 = hash21(gid+71.3), dome = 1. - 1.7*length(gu - gid - .5 - .3*vec2(g - .5, g2 - .5));
  if (uOwn[4] < 0.) g = g2 = mix(g, hash11(floor(l.y*3.)+9.), -uOwn[4]);
  if (abs(l.x) < .5) {
   full = piece(vec2(s, .2)).a+piece(vec2(s, .5)).a+piece(vec2(s, .8)).a;
   full = 1. - exp(-full*1.2);
   here = piece(vec2(fract(s+(g2 - .5)*.004), sat(.5+.28*l.x/w+.5*(g - .5))));
   w += .11*full;
  }
  float h = etHigh(v, w), hl = etHigh(v+lu*.1, w), hf = max(etHigh(v+lu*.26, w) - .25, hl - .1);
  if (low > 0.) hf = max(hf, low*max(etHigh(v+lu*.42, w), etHigh(v+lu*.58, w)));
  if (night > 0. && uOwn[6] > 0.) light += night*uOwn[6]*.5*exp(-abs(l.x)*5. - etP(d)/7. - 9.*etP(-d));
    // the margin is combed, stroke by stroke, inside a pressed line
  vec2 lane = bx.x > bx.y ? m.yx : m; float edge = max(bx.x, bx.y);
  float comb = smoothstep(-.062, -.054, edge)*etOff(-.014, -.004, edge);
  if (round_ > 0.) lane.x = mix(lane.x, .58*atan(m.y, m.x+1e-5), round_);
  float tooth = sin((lane.x+.0016*noise(lane*60.))*330.+2.*noise(vec2(floor(lane.x*12.), 3.)));
  float groove = etBell((edge+.066)/.0035);
  if (raked > 0.) fine += 6.*raked*etOff(.1, .35, 4.*etPx*zoom/etCell)*(etRake(v+lu*.03) - etRake(v))*(1. - smoothstep(.0, .3, h))*etOff(-.1, -.06, edge);
  float shade = 1.+.28*(1.+1.8*low)*soft+.12*fine+.1*comb*tooth*etOff(.8, 2.2, 330.*etPx*zoom) - .16*groove;
  col = vec3(.885, .875, .86)*light*shade;
  col *= 1. - vec3(.42, .4, .36)*etOff(-.04, .03, -trayL - .02);
    // powder, char, ash
  float on = smoothstep(.12, .4, h);
  float cover = 0., crack = 0., laid = 0.;
  if (on > 0.) {
  float burns = 1. - etP(-uOwn[6]), ash = burns*smoothstep(.05, .7, d+.35*(g - .5)); laid = smoothstep(g*8., g*8.+2., d - 54.);
  float gone = burns*smoothstep(46.+3.*g, 50.+3.*g, d);
  vec3 tint = here.rgb/max(max(here.r, max(here.g, here.b)), .05);
  vec3 powder = mix(vec3(.43, .275, .15), vec3(.25, .14, .07), g2)*(.72+.5*g2*g+.3*dome);
  powder = mix(powder, tint*vec3(.8, .7, .62)*(.5+.5*g2), sat(here.a*2.)*.62);
  if (uOwn[4] < 0.) powder = mix(powder, (mix(vec3(.3, .22, .16), tint*tint*.75, sat(.3+here.a*2.))*(.45+.75*hash11(floor(l.y*3.)+3.))*(.5+.8*h)+.7*etOff(.02, .055, length(vec2((fract(l.y*3.) - .5)/3., l.x) - vec2(.02, .04)))), -uOwn[4]);
  if (wet > 0.) {
   float sky = noise(v*1.6+vec2(.05*uTime, 3.))*.7+.3*noise(v*5. - .07*uTime);
   powder = mix(powder, mix(vec3(.05, .075, .09)+.4*tint*tint*sat(here.a*2.), vec3(.8, .84, .85), smoothstep(.42, .75, sky)*.75), wet);
  }
  vec3 grey = mix(vec3(.17, .16, .155), vec3(.69, .68, .665), smoothstep(.2, 3.2, d+g));
  grey *= .82+.28*g2*g+.12*dome;
  crack = noise(vec2(l.y*9.+2.*noise(v*5.), l.x*5.));
  grey *= 1. - (.1+.3*uTexture)*smoothstep(.6, .8, crack);
  vec3 stuff = mix(powder, grey, ash*(1. - laid));
  cover = on*mix(1., laid*smoothstep(0., .4, dome+smoothstep(56., 66., d)), gone);
  stuff *= (1.+.22*fine)*min(light*1.06, 1.);
  col = mix(col, stuff, cover);
  }
  col *= clamp(1.+.75*(h - hl)*(1. - 2.*wet), .45, 1.3);
  col *= 1. - (vec3(.5, .48, .44)+vec3(.25, .22, .16)*low)*smoothstep(.02, .5, mix(hf - h, (h - etOff(.5, 1., hl) - .45)*1.2 - .35, wet));
    // the ember, and a cue breathing back along the ash
  float power = .5+.05*sin(uTime*.8)+(.5+uEnergy)*(.5*uLevel+.5*uDrone+.2*uMic)+1.2*uHits;
  float coal = etBell((d - .1+.25*(g - .5))/(.2+.18*uDrone))*cover*etOff(.1, .35, abs(l.x));
  coal *= .55+.6*noise(u*7.+2.*vec2(sin(uTime*.19), cos(uTime*.15)));
  if (uOwn[6] > 0.) coal = max(coal, uOwn[6]*cover*smoothstep(-.3, .1, d)*exp(-etP(d)/15.)*(.3+1.2*smoothstep(.35, .75, noise(v*4.)*.6+.4*noise(v*11.))));
  float back = etBell((d - 46.*(1. - uCue))/3.5)*uCue*cover*(1. - laid)*(.4+.8*crack);
  float flare = uHits*etBell(ed*.6), hot = sat(coal*power*1.1);
  col = mix(col, vec3(.75, .1, .02)+vec3(.25, .42, .1)*hot+vec3(0., .26, .3)*hot*hot*hot*hot, sat(coal*1.8));
  col = mix(col, vec3(.86, .23, .06), sat(back*1.1));
  col += col*vec3(.5, .13, 0.)*(power*(.4*exp(-ed*ed*1.3)+.16*exp(-ed*.9))+.9*flare) - col*vec3(0., .25, .42)*flare;
 } else {
   vec2 w = rot(.12)*q*84.;
  float rib = abs(fract(w.y) - .5)*2., run = noise(vec2(w.x*.5+floor(w.y)*7.3, floor(w.y)*3.1));
  col = mix(vec3(.47, .42, .32), vec3(.57, .515, .4), run)*mix(.95, .86+.16*smoothstep(0., .8, rib), etOff(.3, .9, 84.*etPx*zoom))*light;
  col *= 1. - .55*etOff(-.02, .05, trayL - .028);
 }
 float rim = etOff(-etPx*zoom, etPx*zoom, abs(tray) - .017);
 vec2 gm = bx.x > bx.y ? vec2(sign(m.x), 0.) : vec2(0., sign(m.y));
 if (round_ > 0.) gm = mix(gm, m/max(length(m), .01), round_);
 float lit = dot(gm, L)*tray/.017;
 vec3 lac = vec3(.14, .085, .065)*(1.+.7*lit+.3*noise(m*90.))+.22*smoothstep(.35, .8, lit)*vec3(.9, .9, 1.);
 col = mix(col, lac*light, rim);
 col *= mix(vec3(.84, .92, 1.07), vec3(1.05, 1., .93), smoothstep(.5, 1.05, light));
 col *= mix(vec3(1.), vec3(1.3, .84, .5), night*pool);
 col *= mix(vec3(1.), vec3(1.1, .97, .8), low);
 if (uOwn[5] > 0.) {
  vec2 g = m*11.+40.;
  for (int i = 0; i < 2; i++) {
   vec2 k = floor(g), hh = hash22(k+9.);
   float a = hash21(k+31.)*TAU, s = .34*sqrt(max(uOwn[5], 1e-4))*step(hash21(k+5.), .5*uOwn[5])*(.6+.4*hh.y);
   vec2 f = (rot(a)*(g - k - .5 - .34*(hh - .5)) )/max(s, .001), fs = f+rot(a)*L*.3;
   float pd = length(f*vec2(1., 1.6+.6*f.x)) - 1., ps = length(fs*vec2(1., 1.6+.6*fs.x)) - 1.;
   if (s > 0.) {
    col *= 1. - .4*etOff(-.1, .35, ps);
    vec3 k3 = mix(uKind[3], uKind[1], hh.x);
    col = mix(col, (.15+.85*k3)*(.75+.3*f.y - .18*etBell(f.y*9.)+.25*f.x*f.x)*min(light, 1.1), etOff(-.06, .06, pd));
   }
   g = rot(.9)*g*1.23+17.;
  }
 }
  // the smoke, and its shadow lying away from the window
 if (etShift > 0.) { eu = etPlace(uLoop*80.); ev = eu - etHand(eu - etHand(eu)); }
 vec2 e = etScreen(ev, turn, zoom), far = vec2(0.);
 for (int i = -2; i <= 2; i++) far += etScreen(etPlace(uLoop*80.+3.*float(i)+80.), turn, zoom)*.2;
 vec2 sh = p - e; float along = dot(sh, vec2(.848, -.53)), off = dot(sh, vec2(.53, .848));
 float soft = .006+.05*along;
 if (along > 0.) col *= 1. - .1*etBell(off/soft)*exp(-along*5.)*smoothstep(0., .03, along);
 col = mix(col, vec3(.43, .475, .54), sat(etSmoke(p - e, far.x - e.x)));
  // a hit lets a flake of ash fall; keys throw sparks
 float fall = 1. - uHits;
 vec2 fl = p - e - vec2(.02+.05*fall, -.012 - .06*fall*fall);
 fl.y *= 1.7;
 col = mix(col, vec3(.36, .34, .33), etOff(.0055, .0075, length(fl)+.003*noise(fl*300.))*smoothstep(0., .2, uHits)*smoothstep(0., .15, fall));
 if (uKeys > .01) for (int i = 0; i < 5; i++) {
  float f = float(i), age = fract(uTime*.9+f*.2), way = f*2.4+.7;
  vec2 at = e+vec2(cos(way), sin(way)*.7+.5)*(.01+.07*age);
  float spark = etOff(.0012, .0032, length(p - at))*uKeys*(1. - age);
  col = mix(col, vec3(1., .5, .12), sat(spark*1.4));
 }
 return col;
}
// A coil hung by its tip, seen from below; q from the middle of its foot.
const float etTurns = 8.;
vec4 etSide(vec3 at, vec3 rd, float aa, float burnt, vec3 stuff, float thick, float glow, float flush, vec2 keep) {
 float ang = atan(at.z, at.x+1e-5)/TAU, u = at.y/etTall*etTurns+ang, n = floor(u), f = u - n - .5;
 float place = n+.5 - ang, r = max(1. - at.y/etTall, .02);
 vec3 nor = vec3(at.x/r*etTall, 1., at.z/r*etTall)/etPitch;
 float look = dot(nor, rd), facing = abs(look), pitch = etPitch/etTurns;
 float along = (place - burnt)*TAU*r;
 float ash = etOff(-.03, .03, along)*keep.y;
 float w = .14+.05*thick;
 float a = aa/(pitch*max(facing, .05)), far = smoothstep(.2, .55, a);
 if ((far <= 0. && abs(f) > .1+2.*w) || place < .34 || place > etTurns - .3) return vec4(0.);
 float wob = noise(vec2(place*150., f*12.+n*5.));
 w += ash*(.015+.1*uTexture)*(wob - .5);
 float bead = etP(-uOwn[4]), b = 0.;
 if (bead > 0.) {
  float rn = max(1. - (n+.5)/etTurns, .05), many = floor(TAU*rn/.105)+3.;
  b = (fract(ang*many) - .5)*TAU*rn/many/(pitch*.34);
  w = mix(w, .34*sqrt(etP(1. - b*b))+.02, bead);
 }
 float hw = w/max(facing, .5);
 float cover = mix(etOff(hw - a, hw+a, abs(f)), min(2.*hw, 1.), far);
 cover *= smoothstep(.35, .357, place);
 cover *= sat(facing/(6.*aa));
 float x = clamp(f/hw, -1., 1.)*sign(-look)*(1. - far);
 float lit = .5+.42*x - .22*x*x - .2*at.x;
 vec3 c = stuff*(.3+.9*lit)*(.85+.3*wob);
 c = mix(c, vec3(.68, .665, .64)*(.75+.35*lit)*(.88+.24*wob), ash);
 if (bead > 0.) c *= 1. - bead*.4*b*b;
 if (uOwn[4] > 0.) {
  cover *= 1. - .6*uOwn[4]*(1. - x*x)*(1. - ash);
  c = mix(c, (.1+1.3*stuff)*(1.3 - x*x)+1.4*etBell((x - .4)*5.), uOwn[4]*(1. - ash));
 }
 c *= etDim+etP(uOwn[3])*vec3(1.5, .6, .2)*glow*exp(-abs(along)*1.5);
 c = mix(c, vec3(.82, .2, .06), sat(flush*ash*(.2+wob)));
 c = mix(c, vec3(.1, .07, .06), etOff(.02, .14, abs(along))*.8*keep.x);
 c = mix(c, vec3(.86, .09, .02)+vec3(.14, .42, .15)*glow*glow, sat(1.8*exp(-along*along/(.0016+aa*aa*3.) - x*x*.7))*sat(.75+glow)*keep.x);
 return vec4(c, cover);
}
vec4 etCoil(vec2 q, float ce, float se, float aa, float burnt, vec3 stuff, float thick, float glow, float flush, vec2 keep) {
 float k2 = 1./(etTall*etTall), y0 = etTall - q.y*ce;
 float A = ce*ce - k2*se*se, B = -q.y*se*ce+k2*se*y0, C = q.x*q.x+q.y*q.y*se*se - k2*y0*y0;
 if (abs(A) < .01) A = .01;
 float disc = B*B - A*C;
 vec4 sum = vec4(0.);
 if (disc < 0.) return sum;
 disc = sqrt(disc);
 for (int i = 0; i < 2; i++) {
  float t = -B/A+(i == 0 ? -disc : disc)/abs(A);
  vec3 at = vec3(q.x, q.y*ce+t*se, t*ce - q.y*se);
  if (at.y < -.08 || at.y > etTall) continue;
  vec4 s = etSide(at, vec3(0., se, ce), aa, burnt, stuff, thick, glow, flush, keep);
  sum += vec4(s.rgb, 1.)*s.a*(1. - sum.a);
  if (sum.a > .98) break;
 }
 return sum;
}
vec3 etHall(vec2 p) {
 float asp = uRes.x/uRes.y, narrow = min(1., asp/1.5);
 vec2 vp = vec2(-.32*narrow, -.775), d = p - vp;
 float night = etP(uOwn[3]), sun = etP(-uOwn[3]), open = etP(uOwn[2]), many = exp2(.95*uOwn[0]), lamp = etP(-uOwn[5]), long_ = etP(uOwn[5]), up_ = etP(etTall - .6);
 etDim = mix(vec3(1.), vec3(.17, .19, .25), night)*(1. - .75*sun);
  // the ceiling: boards and beams sinking into pale smoke, the far end full of daylight
 float far = exp(-length((p - vec2(vp.x, -.5))*vec2(.75, 1.))*2.1);
 vec3 haze = mix(vec3(.43, .395, .35), vec3(.98, .925, .83), sat(far*(1.45+.3*uTone)+.02+.05*uLevel));
 if (open > 0.) haze = mix(haze, mix(vec3(.96, .93, .87), vec3(.45, .55, .62), smoothstep(-.5, .55, p.y+.22*(noise(p*vec2(1.6, 3.)+.01*uTime) - .5))), open);
 haze *= 1. - .22*etP(-uOwn[2]);
 haze = mix(haze, vec3(.035, .04, .06)+vec3(.15, .12, .1)*far*(1. - .5*open), night);
 haze = mix(haze, haze*.45+vec3(.58, .54, .47), sun);
 float Z = 1./max(d.y, .08), X = d.x*Z;
 float bx = abs(fract(X*1.1+.2) - .5), bz = abs(fract(Z*1.9+.3) - .5);
 float aX = etPx*Z*1.6, aZ = etPx*Z*Z*2.8;
 float beam = max(.75*etOff(.07 - aX, .07+aX, bx), etOff(.1 - aZ, .1+aZ, bz));
 vec3 wood = mix(vec3(.4, .35, .3), vec3(.15, .115, .095), beam);
 wood *= 1. - .8*night;
 vec3 col = mix(haze, wood, .85*exp(-Z*.75)*(1. - open)*(1. - .6*sun));
 if (uOwn[2] < 0.) col = mix(col, mix(mix(vec3(.93, .96, .94), haze, .7*night)*(.8+.3*hash21(floor(vec2(X*1.1+.7, Z*1.9+.8)))), wood*.4, smoothstep(.1, .6, beam)), -uOwn[2]*exp(-Z*.2));
 float drift = uTime*.012, near = .3147, fall = 1. - uHits;
 for (int j = 3; j >= 0; j--) {
  float f = float(j), sc = near, foot = vp.y+sc;
  near /= .655;
    // smoke lying between the rows
  float veil = j == 3 ? .5 : noise(vec2(p.x*3.4/(.4+sc) - drift*(1.+sc)+f*7., p.y*6.5+1.1*sin(p.x*2.6+f*2. - drift)+f*3. - drift));
  col = mix(col, haze*1.03, (.22+.24*uPad+.16*uSpace)*smoothstep(.2, .9, veil)+.06);
  float gx = d.x*many/sc+.5*mod(f, 2.)+.02, id = floor(gx);
  float h = hash21(vec2(id+40., f+3.)), h2 = hash21(vec2(id+11., f+23.));
  float R = (.37+.05*h2)*sc/many*(1.+.25*etP(uOwn[0]));
  vec2 q = (vec2(gx - id - .5+.1*(h - .5), (p.y - foot)*many/sc - .1*(h2 - .5)))*sc/many/R;
  if (abs(q.x) > 1.3 || q.y < -1. - 1.6*long_ || q.y > 1.6+up_) continue;
  float own = uBands[int(h2*15.99)];
  q.x -= (.006+.006*uLow)*sin(uTime*(.5+.2*h)+h*20.)*(2. - q.y);
  int kind = int(h*4.999);
  float lv = kind == 0 ? uDrone : kind == 1 ? uPad : kind == 2 ? uTexture : kind == 3 ? uPhrase : uHits;
  float at = fract(uLoop+h2+.17*f), renew = smoothstep(0., .05, at)*etOff(.93, 1., at), burnt = .34+2.7*at*(uOwn[6] < 0. ? 1.+.97*uOwn[6] : 1.+uOwn[6]);
  vec4 here = piece(vec2(fract((id+.5)*.19+h*.1), .95 - .22*f));
  vec3 tint = here.rgb/max(max(here.r, max(here.g, here.b)), .05);
  vec3 stuff = mix(vec3(.34, .21, .12), tint*tint*vec3(.46, .36, .3), .6*sat(here.a*2.));
  float aa = etPx/R, ks = sc*exp2(1.3*uOwn[7]), ce = inversesqrt(1.+ks*ks), se = ks*ce;
  float front = etBell((f - 5.*(1. - uCue))/1.1)*uCue, hit = j == 1 ? uHits : 0.;
  float glow = renew*(.25+.12*sin(uTime*(.7+h)+h2*30.)+(.4+uEnergy)*(.8*lv+.4*uDrone)+front+hit);
  float fade = 1. - exp(-sc*3.), tip = etTall*ce;
  float cord = etOff(.012 - aa, .012+aa, abs(q.x))*step(tip, q.y)*etOff(.8+up_, 1.6+up_, q.y);
  col = mix(col, vec3(.12, .1, .09), cord*fade*.8);
  vec4 c = q.y > max(uOwn[7] > 0. ? 1.05 : .75, etTall*1.1) || abs(q.x) > 1.12 ? vec4(0.) : etCoil(q, ce, se, aa, burnt, stuff, sat(here.a*1.6), sat(glow), front+.75*etP(uOwn[6])*(.4+.6*lv), vec2(renew, etOff(.86, 1., at)));
  col = col*(1. - c.a)+mix(haze*c.a, c.rgb, fade);
    // a paper slip on a thread from the tip
  float sway = .05*(.3+1.5*own)*sin(uTime*.6+h*30.);
  vec2 s = vec2(q.x - sway*(tip - q.y), q.y);
  if (long_ > 0.) s.x -= long_*.05*(tip - s.y)*sin(s.y*3.+uTime*.5+h*30.);
  if (abs(s.x) < .1+.25*lamp) {
   float thread = etOff(.006 - aa, .006+aa, abs(s.x))*step(s.y, tip)*step(-.2*ce, s.y);
   float slip = etOff(-aa, aa, abs(s.x+.012*sin(s.y*7.+h*9.)) - .058)*etOff(-aa, aa, abs(s.y+(.42+.8*long_)*ce) - (.24+.8*long_)*ce);
   if (lamp > 0.) slip = mix(slip, etOff(.2 - aa, .2+aa, length((s+vec2(0., .5*ce))*vec2(1., 1.15))), lamp);
   vec3 kc = uKind[kind]; kc /= max(max(kc.r, max(kc.g, kc.b)), .05);
   vec3 paper = mix(vec3(.72, .16, .1), kc*vec3(.8, .62, .55), .45)*(.78 - .35*s.y+2.2*s.x*sin(s.y*5.+h*9.)+.3*lv+.3*uKeys*step(.5, h2));
   paper *= 1. - .75*night*(1. - lamp);
   if (lamp > 0.) paper = mix(paper, (.1+.75*kc)*(.5+.5*lv+.35*night )*(1.15 - 9.*dot(s+vec2(0., .5*ce), s+vec2(0., .5*ce))), lamp);
   col = mix(col, vec3(.15), thread*.6*fade);
   col = mix(col, mix(haze, paper, fade), slip);
  }
    // the ember's own light and its thread of smoke
  float te = -TAU*(burnt - .5), re = 1. - burnt/etTurns, ye = etTall*burnt/etTurns;
  vec2 e = vec2(re*cos(te), ye*ce - re*sin(te)*se);
  float ed = length(q - e);
  if (ed < 1.2) col += col*vec3(.9, .16, 0.)*sat(glow)*fade*(.5*exp(-ed*ed*40.)+1.1*hit*exp(-ed*ed*20.))*etOff(1., 1.2, abs(q.x));
  if (night > 0. && ed < 1.2) col += night*vec3(.5, .17, .04)*sat(.25+glow)*fade*renew*exp(-ed*ed*12.)*etOff(.8, 1.2, abs(q.x));
  vec2 up = q - e, fl = up - vec2(.12, -.9*fall)*fall;
  if (j == 1) col = mix(col, vec3(.42, .4, .38), etOff(.022, .03, length(fl*vec2(1., 1.8)))*smoothstep(0., .2, uHits)*smoothstep(0., .15, fall));
  if (j < 3 && up.y > 0. && up.y < 1.8 && abs(up.x - .06*up.y) < .12+.12*up.y) {
   float wind = .06*up.y+up.y*(.025+.05*own+.07*uPhrase)*sin(up.y*7. - uTime*.8+h*20.)+up.y*.02*sin(up.y*15. - uTime*1.1);
   float wide = .008+aa+(.018+.05*uPad+.03*uMic)*up.y, off = (up.x - wind)/wide;
   float wisp = exp(-off*off)*(.6+.4*sin(off*2.5+up.y*9. - uTime*.5));
   col = mix(col, haze*1.15+.08, sat(fade*renew*wisp*smoothstep(0., .05, up.y)*etOff(.2, 1.8, up.y)*etOff(.9, 1.6, q.y)*.8));
  }
 }
 return col;
}
vec3 render(vec2 p) {
 etPx = 1./uRes.y;
 etR = .24+.2*etP(-uOwn[1]);
 etLen = 1. - 2.*etR+.5*PI*etR;
 etTall = .6*exp2(uOwn[1]*(uOwn[1] > 0. ? 1.2 : 1.9));
 etPitch = uOwn[1] == 0. ? 1.1662 : sqrt(1.+etTall*etTall);
 return uVar < .5 ? etMaze(p) : etHall(p);
}
