// name: Mountain's shadow
// a: Cone of shade
// b: Climbing shade
// what: From a summit at sunrise the mountain's own shadow lies as one huge blue triangle over ridges and low cloud, its tip on a grey-violet band under rose, with a cairn and two climbers on near rocks; or from a terrace at evening the last pink light on a wall of snow peaks, the shade climbing, fog, a lit hut, lamps and a railing.
// follows: The loop draws the shade back and forth and the level glows at its edge. Drone and pad colour the low and the high sky; each kind lights its own range or peak; the bands lift the tops; the piece lies as colour in the cloud, and low notes thicken it. A hit flashes in a window, a cue pours cloud over a col, keys light lamps, a voice warms the near light.
// own: 0 a moonlit night with stars at -1, clear white day at 1; 1 bare red land with no snow at -1, deep winter at 1; 2 low worn heights at -1, steep spires at 1; 3 clear valleys at -1, a sea of cloud with only the tops out at 1; 4 looking down with a high horizon, or a low foreground, at -1, a big sky, or a near slope that stands higher, at 1; 5 a narrow spear of shade, or the whole wall still lit, at -1, a wide cone, or only the last tip lit, at 1
vec3 msSun, msTop, msMid, msLow, msAmb, msRock; // the hour's light, three bands of the sky, the light of the shade, the bare ground
float msSnow, msForm, msFog, msAsp, msPx, msNight, msWin, msLc;
float msH(float n) { n = fract(n*.1031); n *= n+33.33; n *= n+n; return fract(n); }
// Noise with its slope: along a line, and on a plane.
vec2 msN1(float x) { float i = floor(x), f = x - i, a = msH(i), b = msH(i+1.); return vec2(mix(a, b, f*f*(3. - 2.*f)), (b - a)*6.*f*(1. - f)); }
float msDip(float x) { return msN1(x).x - .5; }
float msDown(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
float msIn(float d) { return 1. - smoothstep(-msPx, msPx, d); } // inside a shape, its edge one pixel soft
vec3 msN2(vec2 p) {
  vec2 i = floor(p), f = p - i, u = f*f*(3. - 2.*f), du = 6.*f*(1. - f);
  float a = hash21(i), b = hash21(i+vec2(1,0)), c = hash21(i+vec2(0,1)), d = hash21(i+vec2(1,1));
  float k = a - b - c+d;
  return vec3(a+(b - a)*u.x+(c - a)*u.y+k*u.x*u.y, du*(vec2(b - a, c - a)+k*u.yx));
}
float msKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
vec3 msDye(int k) { vec3 c = uKind[k]; return mix(vec3(.8), c/max(max(c.r, max(c.g, c.b)), .2), .6); }
// A skyline of pointed tops: its height from 0 to about 1, and how it leans.
vec2 msRidge(float x) {
  vec2 n = msN1(x);
  float r = 1. - abs(2.*n.x - 1.), dr = -sign(2.*n.x - 1.)*2.*n.y;
  float soft = .12+.75*max(-msForm, 0.);
  r = mix(r, .2+.8*n.x, soft); dr = mix(dr, .8*n.y, soft);
  vec2 m = msN1(x*2.7+5.3);
  float q = 1. - abs(2.*m.x - 1.), dq = -sign(2.*m.x - 1.)*5.4*m.y, w = .42*(1.+.5*msForm);
  return vec2(r*(.75+w*q), dr*(.75+w*q)+r*w*dq);
}
// The relief of a face: how it leans each way, and how high it stands out.
vec3 msFace(vec2 q) {
  vec3 s = vec3(0.); float a = .5, sc = 1.; mat2 m = mat2(1.);
  for (int i = 0; i < 4; i++) {
    vec3 n = msN2(q);
    float sg = n.x > .5 ? -1. : 1., v = 1. - abs(2.*n.x - 1.);
    s += vec3((sg*2.*n.yz)*m*a*sc, v*a);
    const mat2 r = mat2(.96,.28,-.28,.96);
    q = r*q*2.07+3.7; m = r*m; sc *= 1.7; a *= .5;
  }
  return s;
}
vec3 msHour(vec3 a, vec3 b, vec3 night, vec3 day) { return mix(mix(uVar < .5 ? a : b, night, msNight), day, max(uOwn[0], 0.)); }
void msSet() {
  msNight = max(-uOwn[0], 0.); msWin = max(uOwn[1], 0.); float red = max(-uOwn[1], 0.);
  msSun = msHour(vec3(1.12,.79,.55), vec3(1.16,.64,.5), vec3(.46,.53,.64), vec3(1.1,1.03,.9));
  msTop = msHour(vec3(.33,.45,.63), vec3(.17,.3,.47), vec3(.025,.045,.1), vec3(.2,.42,.7));
  msMid = msHour(vec3(.9,.71,.69), vec3(.84,.6,.6), vec3(.11,.16,.27), vec3(.8,.87,.9));
  msLow = msHour(vec3(.56,.54,.66), vec3(.5,.5,.63), vec3(.11,.15,.25), vec3(.66,.76,.84));
  msAmb = msHour(vec3(.31,.41,.58), vec3(.31,.41,.58), vec3(.06,.1,.18), vec3(.34,.47,.64));
  msRock = mix(vec3(.5,.46,.45), vec3(.8,.42,.27), red);
  msSnow = (uVar < .5 ? .42 : .68)+1.5*msWin - 1.1*red;
  msForm = uOwn[2]; msFog = uOwn[3];
  msTop = mix(msTop, msTop*(.5+.75*msDye(1)), .5*uPad);
  msLow = mix(msLow, msLow*(.55+.75*msDye(0)), .55*uDrone);
  msAsp = uRes.x/uRes.y; msPx = 1.1/uRes.y;
  msLc = .5 - .5*cos(TAU*uLoop);
}
// A light that flashes from a window: a point, a glow and two thin blades.
float msGlint(vec2 d) {
  float r = length(d);
  return exp(-r*r*22000.)*1.5+.5*exp(-r*22.)+.6*exp(-abs(d.y)*500. - abs(d.x)*20.)+.4*exp(-abs(d.x)*500. - abs(d.y)*30.);
}
vec3 msStars(vec2 p, vec3 c) {
  vec2 g = p*46., i = floor(g); float h = hash21(i+3.);
  vec2 o = .2+.6*hash22(i);
  return c+msNight*step(.8, h)*msDown(0.,.07, length(g - i - o))*vec3(.8,.87,1.)*(h - .6)*2.2;
}
float msLamp(float q, float r) { return exp(-q/(r*r))+.16*exp(-q/(r*r*36.))+.09*uKeys*exp(-q/(r*r*160.)); }
// Cloud poured over a col, down as the cue dies away.
vec3 msVeil(vec3 c, vec2 q, vec3 light) {
  if (uCue < .004) return c;
  float run = 1. - uCue, fall = -q.y/.2, w = .07+.13*sat(fall)+.1*sat(-fall);
  float n = .6*noise(vec2(q.x*15. - q.y*6., q.y*12.+run*2.))+.4*noise(vec2(q.x*34., q.y*30.+run*4.));
  fall += .7*(n - .5); q.x += .06*(n - .5);
  float m = smoothstep(-.3,.1, fall)*msDown(run, run+.55, fall)*exp(-q.x*q.x/(w*w));
  return mix(c, mix(light, vec3(1.), .45)*(.8+.3*n), sat(m*uCue*2.2*(.15+1.1*n)));
}
// ---- a: the shadow of the summit we stand on
float msAx, msAy, msKl, msKr;
// How deep in the shade a place is; bend is what the land does to the edge, w how soft it is.
float msWedge(vec2 p, float bend, float w) {
  float d = msAy - p.y, x = p.x - msAx;
  float s = min((x+msKl*d)/sqrt(1.+msKl*msKl), (msKr*d - x)/sqrt(1.+msKr*msKr));
  return smoothstep(-w, w, s+bend);
}
float msSeg(vec2 p, vec2 a, vec2 b, float r) { vec2 d = b - a; return length(p - a - d*sat(dot(p - a, d)/dot(d, d))) - r; }
// One climber, feet at 0, one unit tall.
float msFigure(vec2 q, float turn) {
  q.x *= turn;
  float d = length(q - vec2(.02,.9)) - .1;
  d = min(d, msSeg(q, vec2(0.,.5), vec2(0.,.72), .13));
  d = min(d, msSeg(q, vec2(-.13,.56), vec2(-.16,.68), .11)); // the pack
  d = min(d, msSeg(q, vec2(.02,.45), vec2(.11,0.), .06));
  d = min(d, msSeg(q, vec2(-.04,.45), vec2(-.1,0.), .06));
  d = min(d, msSeg(q, vec2(.06,.7), vec2(.27,.47), .04));
  return min(d, msSeg(q, vec2(.27,.6), vec2(.36,0.), .014));
}
// The rock of the summit we stand on, in the lower left; x from the left edge.
float msStand(float x) {
  float h = -.3 - .085*smoothstep(.06,.2, x) - .05*smoothstep(.26,.34, x) - .25*smoothstep(.38,.62, x);
  return h+.05*(abs(msDip(x*11.+3.6)) - .2)+.012*msN1(x*47.).x;
}
// The next range that stands at this place: its height, foot and size, and where along it we are.
int msRange(int i, vec2 p, float hz, out vec4 m) {
  m = vec4(0.);
  for (; i < 8; i++) {
    float fi = float(i), far = fi/7.;
    float base = hz - .015 - .6*(1. - far)*sqrt(1. - far)*(1. - .3*uOwn[4]);
    float f = mix(1.2,5.2, far), amp = mix(.24,.026, sqrt(far*sqrt(far)))*(1.+.45*max(msForm, 0.));
    float u = (p.x+fi*.37)*f+fi*13.7;
    float fine = msDip(u*7.)*.17+msDip(u*19.)*.08;
    m = vec4(base+amp*(msRidge(u).x+fine*(.7+.4*msForm) - .3+.07*band(fract(fi*.37))), base, amp, u);
    if (m.x - p.y > -msPx) break;
  }
  return i;
}
vec3 msCone(vec2 p) {
  float frame = smoothstep(.5,1.4, msAsp), hz = .1 - .15*uOwn[4], wide = exp(.5*uOwn[5])*mix(.5,1., frame);
  msAx = .18*frame; msAy = hz+.115 - .065*msLc;
  msKl = .98*wide; msKr = .76*wide;
  vec4 heard = piece(vec2(p.x/1.78+.5, sat((hz+.02 - p.y)/(hz+.5))));
  float soft = mix(.022,.004, uTone), up = p.y - hz;
  vec3 hue = mix(vec3(dot(heard.rgb, vec3(.33))), heard.rgb, .72); // the piece, taken into the air
  vec3 hazeLit = mix(msLow*.92, msSun, .28), hazeDim = mix(msLow*.62, msAmb*.85,.65);
  vec3 col = vec3(0.); float left = 1.;
  // eight ranges, the nearest first
  vec4 cm; int i = msRange(0, p, hz, cm);
  for (int s = 0; s < 2 && i < 8; s++) { // the second only for a pixel on a skyline
    float fi = float(i), far = fi/7., near = 1. - far, h = cm.x, base = cm.y, amp = cm.z, u = cm.w;
    int k = clamp(i - 1,0,4);
    float lv = i > 0 && i < 6 ? msKind(k) : 0.;
    float a = msIn(p.y - h);
    float dep = (h - p.y)/amp, rel = sat(dep);
    // spurs come down from the tops, each with a side to the sun and one away
    float wob = msDip(dep*4.+fi*3.)*.4*rel+msDip(dep*11.)*.06*rel;
    float side = msRidge(u+wob).y, lean = side*.4*(1. - .6*rel);
    float dir = side/(abs(side)+1.);
    vec3 g = msFace(vec2((u - dep*.45*dir)*3.2, dep*1.1+u*.7+fi*5.)*mix(1.,1.35, near));
    lean += g.x*.6+g.y*.3;
    float tone = .5+.5*lean/sqrt(1.+lean*lean);
    float snow = smoothstep(.4,.7, msSnow*1.2 - .5*rel - .12*length(g.xy)+.3*g.z+.2);
    vec3 alb = mix(msRock*mix(vec3(.5,.5,.52), vec3(.8), far), vec3(.97,.98,1.), snow);
    float sh = msWedge(p, (.5 - rel)*.024*near - (g.z - .45)*.04*(.2+near), soft+.012*near);
    vec3 c = mix(alb*(msSun*(.1+1.25*tone*tone)+msAmb*.25), alb*msAmb*(.25+.8*tone), sh);
    c += alb*mix(msDye(k), msDye(k)*mix(msSun, msAmb*1.6, sh), .6)*lv*uEnergy/(1.+.9*lv*uEnergy)*exp(-rel*3.)*(.2+tone);
    vec3 haze = mix(hazeLit, hazeDim, sh);
    c = mix(c, haze, sat((.05+.6*far+.45*smoothstep(.25,1.1, dep)*(.5+.5*far))*mix(.8,1.1, uSpace)));
    // cloud low in the valley, heaped
    float y = (p.y - base)/amp, lev = -.2+.8*msFog+.14*uLow;
    vec2 q = vec2(u*1.3+uTravel*.01, y*1.1+fi*3.);
    vec3 n1 = msN2(q), n2 = msN2(q*2.3+vec2(uTravel*.012,3.));
    float b3 = noise(q*5.1+1.7), bill = .55*n1.x+.3*n2.x+.15*b3;
    float cl = smoothstep(0.,.3, lev - y+(bill - .42)*2.);
    float puff = .86+.2*b3+.1*n1.z+.06*n2.z - .05*n2.y;
    vec3 cc = mix(mix(msLow, mix(msMid, msSun, .5), sat(puff*2.6 - 1.75)), mix(hazeDim*.85, msAmb*1.15, sat(puff*2.6 - 1.75)), sh);
    cc = mix(cc, hue*.62+cc*.66, min(heard.a*(.3+.5*uEnergy)*(.35+bill), .62));
    c = mix(c, cc, cl*.92);
    col += left*a*c; left *= 1. - a;
    if (left < .01) break;
    i = msRange(i+1, p, hz, cm);
  }
  for (int s = 0; s < 1 && left > 0.; s++) {
    // the sky: rose over a band of grey-violet
    vec3 sky = mix(msLow, msMid, smoothstep(.015,.15, up));
    sky = mix(sky, mix(msMid, msTop, .62), smoothstep(.13,.3, up));
    sky = mix(sky, msTop, smoothstep(.25,.6, up));
    vec2 cq = vec2(p.x*1.1+p.y*1.5+uTravel*.004, p.y*11. - p.x*.8);
    float ci = .6*noise(cq)+.3*noise(cq*vec2(2.1,2.7)+4.)+.1*noise(cq*vec2(6.,4.));
    sky = mix(sky, mix(msMid, msSun, .2), .4*smoothstep(.46,.8, ci)*smoothstep(.1,.24, up)*msDown(.24,.6, up));
    sky = msStars(p, sky);
    float air = msWedge(p, 0., soft+.008);
    sky = mix(sky, hazeDim, .8*air*exp(-max(up, 0.)*6.));
    col += left*sky;
  }
  // the glow on the edge of the shade, and the sun in a far window
  float e = msWedge(p, 0.,.025); e *= 1. - e;
  col += msSun*e*msDown(0.,.1, up)*(.04+.5*uLevel*uEnergy);
  col += vec3(1.,.85,.6)*msGlint(p - vec2(mix(.16,.43, frame), hz - .085))*uHits;
  // a veil of cloud that comes over a col, and lamps in a valley the sun has not reached
  col = msVeil(col, p - vec2(msAx+.02, hz - .2), mix(hazeLit, hazeDim, .35));
  float lamp = 1.;
  for (int j = 0; j < 12; j++) {
    float fi = float(j), v = fi < 7. ? 0. : 1.;
    vec2 d = p - vec2(msAx+mix(-.1,.1, v)+.1*(msH(fi+2.) - .5), hz+mix(-.2,-.115, v)+.018*(msH(fi+40.) - .5));
    lamp = min(lamp, dot(d, d));
  }
  col += vec3(1.,.74,.4)*msLamp(lamp, .002)*(.35+.35*msNight+.9*uKeys);
  // rocks, a cairn and two climbers
  float xl = p.x+min(.5*msAsp, .95);
  if (xl < .7 && p.y < -.2) {
    float rock = msStand(xl);
    vec2 f1 = vec2(xl - .235, p.y+.3769), f2 = vec2(xl - .305, p.y+.4042);
    float d1 = msFigure(f1/.066,1.)*.066, d2 = msFigure(f2/.062,-1.)*.062;
    vec3 c1 = mix(vec3(.2,.15,.15), vec3(.66,.24,.17), smoothstep(.027,.031, f1.y)), c2 = mix(vec3(.14,.14,.18), vec3(.68,.48,.26), smoothstep(.025,.029, f2.y));
    col = mix(col, c1*msSun*(.75 - 9.*f1.x), msIn(d1));
    col = mix(col, c2*msSun*(.75 - 9.*f2.x), msIn(d2));
    vec3 g = msFace(vec2(xl*5. - p.y*5., p.y*8.+xl*6.));
    float t = .5+.5*(-g.x*.5+g.y*.6)/sqrt(1.+dot(g.xy, g.xy)*.4);
    float depth = rock - p.y;
    vec3 c = msRock*(msAmb*.25+msSun*(.06+(1.1+1.2*uMic)*t*t)*exp(-depth*5.))*(.6+.5*g.z);
    c = mix(c, .95*(msAmb*.6+msSun*.5*t), msWin*smoothstep(.1,.5, g.y+.6 - 4.*depth));
    // the cairn: five flat stones
    for (int i = 0; i < 5; i++) {
      float fi = float(i), w = .027 - .004*fi, t2 = .0105 - .001*fi;
      vec2 q = vec2(xl - .1 - .004*sin(fi*2.4), p.y+.3023 - .017*fi); q.y += q.x*.22*sin(fi*1.9+1.);
      float sd = sqrt(length(q*q/vec2(w*w, t2*t2))) - 1., m = 1. - smoothstep(-.12,.12, sd);
      col = mix(col, msRock*(msAmb*.3+msSun*sat(.45+28.*q.y - 9.*q.x)), m);
    }
    col = mix(col, c, msIn(-depth));
  }
  return col;
}
// ---- b: the wall of peaks seen from a terrace at evening
// One horn: steep near its top, easing out below. Its height and its lean.
vec2 msHorn(float x, float at, float top, float steep, float fall) {
  float d = x - at, s = d < 0. ? steep : steep*fall, e = exp(-abs(d)*s/.34);
  return vec2(top - .34*(1. - e), -sign(d)*s*e);
}
vec2 msWall(float x) {
  float sharp = 1.+.45*msForm;
  vec2 a = msHorn(x, -.2,.36,1.5*sharp, .85), b = msHorn(x, .27,.235,1.1*sharp, .8), c = msHorn(x, -.74,.24,.8*sharp, 1.5), d = msHorn(x, .82,.26,.75*sharp, 1.2);
  vec2 m = a.x > b.x ? a : b; m = m.x > c.x ? m : c; m = m.x > d.x ? m : d;
  vec2 r = msRidge(x*5.3+2.4);
  return vec2(m.x+.055*(r.x - .45), m.y+.055*5.3*r.y*.4);
}
vec3 msTerrace(vec2 p) {
  float frame = smoothstep(.5,1.4, msAsp), tip = .1*uOwn[4];
  vec2 hut = vec2(mix(.13,.37, frame), -.185+tip);
  vec4 heard = piece(vec2(p.x/1.78+.5, sat((.12 - p.y)/.5)));
  // the line the shade has reached
  float line = .09+.15*uOwn[5]+.09*msLc+.05*p.x+.07*msDip(p.x*2.3+8.)+.02*msDip(p.x*9.);
  vec3 hue = mix(vec3(dot(heard.rgb, vec3(.33))), heard.rgb, .72), hazeDim = mix(msLow, msAmb, .5), col = vec3(0.); float left = 1.;
  float sx = p.x - hut.x, soft = mix(.03,.006, uTone);
  // the nearest first: snow spur, woods, buttress, wall, peaks behind
  float tops[5]; vec2 m2 = msRidge(p.x*2.3+1.2), m3 = msWall(p.x), m4 = msRidge(p.x*2.9+7.7); float rough = msDip(p.x*37.);
  tops[0] = hut.y - .004 - .5*msDown(-.85,-.02, sx)+.12*smoothstep(.08,.6, sx)+.014*msDip(p.x*7.)*smoothstep(.04,.12, abs(sx));
  tops[1] = -.43+tip+.34*msDown(-1.,.25, p.x)+.05*msN1(p.x*3.1).x;
  float sway = 1.5*msN1(p.x*20.).x;
  for (int j = 0; j < 2; j++) { // the tops of firs
    float tu = p.x*(70.+43.*float(j))+sway, id = floor(tu)+91.*float(j);
    tops[1] += .02*max(0.,1. - (2.3+msH(id+3.))*abs(fract(tu) - .5))*(.25+msH(id))*(j == 0 ? 1. : .6);
  }
  tops[2] = -.21+.17*m2.x+.02*rough;
  tops[3] = m3.x+.016*rough+.01*msDip(p.x*91.)+.008*band(p.x*.5+.5);
  tops[4] = .06+.16*m4.x+.01*rough;
  int i = 0;
  for (int j = 0; j < 5; j++) if (i == j && tops[j] < p.y - msPx) i++;
  for (int s = 0; s < 2 && i < 5; s++) {
    float fi = float(i), h = tops[i], foot = i < 2 ? -.3 : i == 2 ? -.22 : i == 3 ? -.12 : 0., amp = i == 2 ? .16 : i == 3 ? .4 : .2;
    float far = i == 0 ? 0. : i == 1 ? .06 : i == 2 ? .28 : i == 4 ? .4 : .06+.36*msDown(-.15,.12, p.y)+.25*msDown(-.4,-.1, p.y);
    float a = msIn(p.y - h);
    float dep = h - p.y, rel = sat(dep/amp);
    float wob = msDip(dep*13.+fi*7.)*.07*smoothstep(0.,.15, dep);
    float side = i == 3 ? msWall(p.x+wob).y : i == 2 ? m2.y*.5 : i == 4 ? m4.y : 0.;
    side *= 1. - .85*smoothstep(.14,.34, dep);
    float dir = side/(abs(side)+.7);
    vec3 g = msFace(vec2((p.x - min(dep, .22)*.42*dir)*(i == 0 ? 3. : 8.), p.y*(i == 3 ? 2.6 : 3.4)+p.x*1.4+fi*3.));
    float lean = side*.7*(1. - .3*rel)+g.x*.65+g.y*.3;
    float tone = .5+.5*lean/sqrt(1.+lean*lean);
    float snow = smoothstep(.3,.5, msSnow*.9 - .25*rel - .3*length(g.xy) - .12*abs(side)+.5*g.z+.1);
    if (i == 0) snow = mix(snow, 1., sat(msSnow*1.3)*.9);
    vec3 alb = mix(msRock*.62, vec3(.97,.98,1.), snow);
    if (i == 1) { alb = mix(msRock*vec3(.2,.27,.27), vec3(.8,.84,.9), sat(.3*sat(msSnow)*smoothstep(.5,.8, g.z)+msWin*(.3+.5*smoothstep(.35,.7, g.z)))); tone = .3+.4*g.z; alb *= mix(.45+1.1*noise(vec2(p.x*120., p.y*55.)), .8,.6*msWin); }
    if (i == 0) tone = .42+.07*g.x+.25*exp(-dep*14.);
    float sun = smoothstep(-soft, soft, p.y - line+(g.z - .45)*.06+lean*.012)*step(1.5, fi);
    vec3 c = mix(alb*msAmb*(.4+.8*tone), alb*(msSun*(.02+1.12*tone)+msAmb*.6*(1. - tone)), sun);
    if (i > 2) {
      c += msSun*alb*sun*(1. - sun)*(.2+2.2*uLevel*uEnergy);
      float kx = clamp((p.x/mix(.35,1., frame)+.95)/.36,0.,4.999), d = 2.*abs(fract(kx) - .5); // each kind of sound lights one peak
      int k = int(floor(kx)); d = 1. - d*d;
      c += alb*msDye(k)*msKind(k)*uEnergy*.8*d*d*exp(-dep*7.)*(.15+tone);
    }
    c = mix(c, hazeDim, far*mix(.7,1.3, uSpace));
    // fog in the valley
    float lev = foot+tip*(i < 2 ? 1. : .35)+.16*msFog+.05*uLow, y = (p.y - lev)/.12+(i == 1 ? 2.8 - 1.2*smoothstep(-.3,.2, p.x)+1.*sat(tip*10.)+1.3*sat(msFog) : 0.);
    if (i > 0 && y < 2.6) {
      vec2 q = vec2(p.x*(3.4 - fi*.4)+uTravel*.012+fi, p.y*8.+fi*2.);
      float n = .55*noise(q)+.3*noise(q*2.2+vec2(uTravel*.02,2.))+.15*noise(q*4.6);
      float cl = smoothstep(-.2,.9,1. - y+(n - .5)*2.6);
      vec3 cc = mix(hazeDim, msMid, .2)*(.75+.5*n);
      cc = mix(cc, hue*.55+cc*.7, min(heard.a*(.2+.45*uEnergy)*(.4+.9*n), .62));
      c = mix(c, cc, cl*.95);
    }
    col += left*a*c; left *= 1. - a;
    if (left < .01) break;
    i++;
    for (int j = 0; j < 5; j++) if (i == j && tops[j] < p.y - msPx) i++;
  }
  for (int s = 0; s < 1 && left > 0.; s++) {
    vec3 sky = mix(msMid, mix(msMid, msTop, .6), smoothstep(-.02,.24, p.y));
    sky = msStars(p, mix(sky, msTop, smoothstep(.15,.55, p.y)));
    col += left*sky;
  }
  col = msVeil(col, p - vec2(.08,.16), mix(msMid, msSun, .3));
  // the hut: stone below, boards above, snow on its roof, and one window
  vec2 q = p - hut;
  float wx = abs(q.x), eave = .034 - .5*wx;
  float body = max(wx - .036, max(-q.y - .01, q.y - .02)), gable = max(wx - .046, abs(q.y - eave - .006) - .0045);
  body = max(min(body, max(q.y - eave - .006,-q.y)), wx - .036);
  vec3 wood = mix(msRock*.35, vec3(.2,.13,.11), step(.004, q.y))*(.8+.3*noise(q*vec2(40.,600.)))*(.5+msAmb);
  col = mix(col, wood, msIn(body));
  col = mix(col, mix(msRock*.5, vec3(.95), sat(msSnow))*msAmb*1.25, msIn(gable));
  float ch = max(abs(q.x - .018) - .004, abs(q.y - .034) - .009);
  col = mix(col, msRock*msAmb*.7, msIn(ch));
  vec2 wq = q - vec2(-.012,.009);
  float win = max(abs(wq.x) - .0075, abs(wq.y) - .0065);
  col = mix(col, mix(vec3(1.,.6,.3), vec3(1.,.85,.6), smoothstep(-.007,.007, wq.y))*.8, msIn(win));
  col += vec3(1.,.55,.25)*((.22+.35*uMic)*exp(-length(wq)*26.)+uHits*msGlint(wq));
  // a string of lamps on the path down, coming on
  float lamp = 1., on = 0., size = .002;
  for (int i = 0; i < 9; i++) {
    float t = (float(i)+1.)/9.;
    vec2 at = hut+vec2(-.05 - .34*t - .05*sin(t*8.)*t, -.02 - .17*t - .05*t*t);
    float q2 = dot(p - at, p - at);
    if (q2 < lamp) { lamp = q2; size = .0022+.0012*t; on = sat(1.6*(.3+.35*msLc+.8*uKeys+msNight) - t+.45); }
  }
  col += vec3(1.,.7,.36)*msLamp(lamp, size)*on*msDown(0.,.02, p.y - tops[0]);
  // the railing, cut by the near edge
  float ry = p.y+.41 - .035*p.x+.004*msDip(p.x*5.), thick = .032 - .008*p.x;
  float post = abs(mod(p.x+.17,.62) - .31) - .03;
  float top = abs(ry) - thick, low = abs(ry+.11) - thick*.45;
  float rail = min(min(top, low), max(post, ry));
  if (rail < msPx) {
    bool up = top < msPx*2.;
    vec2 gq = up || low < 0. ? vec2(p.x*4., ry*190.) : vec2(p.y*5., p.x*190.);
    float gr = .6*noise(gq)+.4*noise(gq*2.6);
    vec3 c = msAmb*vec3(.5,.44,.42)*(.2+.85*gr);
    float face = up ? smoothstep(thick*.25, thick*.4, ry) : 0.;
    c = mix(c, mix(msAmb*(.35+.6*gr)+msMid*.14, msAmb*.8+msMid*.35, msWin), face);
    c *= .5+.5*smoothstep(0.,.03, abs(ry+thick));
    col = mix(col, c, msIn(rail));
  }
  return col;
}
vec3 render(vec2 p) {
  msSet();
  return sat(uVar < .5 ? msCone(p) : msTerrace(p));
}
