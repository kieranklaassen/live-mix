// name: Behind the fall
// a: From the ledge
// b: Five falls
// what: From a wet ledge in the hollow behind a great fall, black rock and ferns on the left, the water sliding past in ropes and veils green and gold with daylight, and where it thins a valley with one white house; or five falls at unlike depths down grey cliffs into mist, a hut with a lit window, near pines, a pale arc in the spray.
// follows: The bands thicken the water, low in the middle, high at its edges, or fall by fall; each kind is one rope or one fall in its colour. Drone is body and mist, pad the light, texture spray, phrase a surge. A hit throws drops or fills its fall, a cue parts the water or sweeps sun along the cliffs. The piece is moss and wet on the rock, the loop moves the sun.
// own: 0 winter with snow at -1, autumn rust at 1; 1 night with a lit window at -1, low red sun at 1; 2 thin water at -1, fine ropes in a, narrow falls and low mist in b, flood with broad ropes and wide falls at 1; 3 deep in the hollow or far back across the gorge at -1, the rock drawn aside and the sheet filling the view or close in at 1; 4 clear air at -1, thick mist at 1; 5 pale limestone at -1, red sandstone at 1
// A soft step that may also run downward.
float bfS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x*x*(3. - 2.*x); }
// The water's own noise: its rows come round again, so it may fall for ever.
float bfN(vec2 p) {
 vec2 i = floor(p), f = p - i; f = f*f*(3. - 2.*f);
 float a = mod(i.y, 89.), b = mod(i.y + 1., 89.);
 return mix(mix(hash21(vec2(i.x, a)), hash21(vec2(i.x + 1., a)), f.x), mix(hash21(vec2(i.x, b)), hash21(vec2(i.x + 1., b)), f.x), f.y);
}
float bfV(vec2 p) { return abs(2.*noise(p) - 1.); }
float bfG(float x) { return exp(-x*x); }
float bfIn(float d, float a) { return bfS(a, -a, d); }
float bfLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
vec3 bfKc(int k) { vec3 c = uKind[k]; return c*c*1.3 + c*.1; }
vec3 bfMix(float o, vec3 lo, vec3 mid, vec3 hi) { return o < .0 ? mix(mid, lo, -o) : mix(mid, hi, o); }
float bfMix1(float o, float lo, float mid, float hi) { return o < .0 ? mix(mid, lo, -o) : mix(mid, hi, o); }
// What both pictures share: the fall's phase, the size of a pixel, how much night and winter, how much water, the colours of the hour and the season.
float bfPh, bfPx, bfNight, bfWin, bfFlow, bfCc;
vec3 bfSun, bfSky, bfGreen, bfStone;
// Broken rock, creased along its beds: how it stands out.
float bfRock(vec2 p) {
 vec2 q = rot(.42)*p;
 q += .03*noise(q*7.);
 return .55*bfV(q*vec2(3., 8.)) + .32*bfV(rot(1.2)*q*vec2(8., 17.) + 5.) + .16*noise(q*vec2(30., 55.)) + .08*noise(q*120.);
}
vec2 bfSunAt() { return vec2(.44 + .05*sin(TAU*uLoop), .25 + .02*cos(TAU*uLoop)); }
// The valley out beyond the water, soft with distance and damp, and the one white house.
vec3 bfValley(vec2 q, float soft) {
 float ds = length((q - bfSunAt())*vec2(.75, 1.)), glow = exp(-ds*4.);
 vec3 col = mix(bfSun*1.1, bfSky, bfS(-.02, .5, q.y + .3*max(.3 - q.x, .0)));
 col += bfSun*(1.5*glow + 2.*exp(-ds*15.))*(1. + .8*uCue);
 vec3 air = mix(bfSky, bfSun, .35)*.75 + bfSun*.5*glow;
 float clear = bfMix1(uOwn[4], .5, 1., 1.35)*(.85 + .3*uSpace);
 for (int i = 0; i < 4; i++) { // ranges from far to near
  float f = float(i) / 3.;
  float h = mix(.12, -.10, f) + (noise(vec2(q.x*mix(5., 2.4, f) + f*19. + 2., f*7.)) - .5)*mix(.17, .09, f) + .14*f*max(q.x - .36, .0);
  float field = .5;
  if (i > 0) { h += .014*f*noise(vec2(q.x*60., f)); field = bfS(.35, .7, noise(vec2(q.x*5. + q.y*12., q.y*30. + f*9.))); }
  vec3 body = bfGreen*mix(.35, 1.5, field)*(.5 + 1.6*glow + .9*bfG((q.x - .24)*6.)*bfG((q.y + .12)*12.));
  body = mix(body, bfSun*.25 + vec3(.3, .34, .4)*(.5 + field)*(1. - .8*bfNight), bfWin*.85);
  body += bfSun*.12*f*bfS(.03, .0, h - q.y);
  col = mix(col, mix(body, air, sat((1. - f)*.85*clear)), bfIn(q.y - h, soft));
 }
 vec2 h = q - vec2(.195, -.078); // the house
 float r = h.y - .018;
 col = mix(col, bfGreen*.25, .85*bfS(.034, .018, length((h - vec2(.064, -.006))*vec2(1., .8))));
 vec3 white = mix(vec3(2., 1.85, 1.55), vec3(.16, .19, .28), bfNight)*mix(.6, 1., bfS(-.018, -.010, h.x));
 col = mix(col, white, bfIn(max(abs(h.x) - .034, abs(h.y) - .021), soft));
 col = mix(col, mix(vec3(.26, .10, .06)*(1. - .7*bfNight), vec3(.8)*(1. - .8*bfNight), bfWin*.9), bfIn(max(-r, abs(h.x) - .041 + r*.85), soft)*bfIn(r - .034, soft));
 return mix(col, vec3(.12, .10, .09) + vec3(1.9, .9, .25)*sat(bfNight + uMic), bfIn(max(abs(abs(h.x - .006) - .012) - .0035, abs(h.y) - .006), soft));
}
// Ferns rooted in two cracks of the arch, fronds arching out: how much of the pixel, how far along.
vec2 bfFerns(vec2 p, float open) {
 float cover = .0, along = .0;
 if (p.x + .75*open > -.02 || p.x + .75*open < -.5 || abs(p.y - .2*open) > .42) return vec2(.0);
 for (int i = 0; i < 12; i++) {
  int s = i / 6;
  float fi = float(i), n = float(i - 6*s), h1 = hash11(fi + 3.), h2 = hash11(fi + 41.);
  vec2 b = (s == 0 ? vec2(-.225, .17) : vec2(-.335, -.19)) + vec2(-.75*open, .2*open) + .025*vec2(h1 - .5, h2 - .5);
  float L = (.13 + .10*h1)*(n > 3.5 ? -.7 : 1.), lift = n > 3.5 ? .9 - .5*h2 : mix(1.2, -.5, n / 3.) + .3*(h2 - .5);
  float droop = .7 + .4*h2 + .05*sin(uTime*(.35 + .2*h1) + fi*2.1)*(.5 + uTexture + .5*uLow);
  float t = (p.x - b.x) / L;
  if (t < .0 || t > 1.) continue;
  float sl = (lift - 2.*droop*t)*sign(L), y = p.y - b.y - abs(L)*(lift*t - droop*t*t), v = y / sqrt(1. + sl*sl);
  t = sat(t + y*sl / (1. + sl*sl) / L);
  float comb = abs(fract((t - abs(v / L)*.5)*17.) - .5)*2.;
  float w = abs(L)*.20*sqrt(1. - t)*bfS(.03, .3, t)*bfS(.0, .8, comb) + .001;
  float a = bfIn(abs(v) - w, bfPx)*bfS(1., .95, t);
  along = mix(along, t, a); cover = max(cover, a);
 }
 return vec2(cover, along);
}
// One bright drop, drawn out along its fall.
float bfDrop(vec2 d, float r) { return bfS(1., .2, length(d*vec2(1., .5)) / r); }
vec3 bfLedge(vec2 p) {
 float o3 = uOwn[3], zoom = bfMix1(o3, 1.22, 1., .86), open = bfMix1(o3, -.06, .0, .34), px = bfPx *= zoom;
 p = (p - vec2(.2, -.05))*zoom + vec2(.2, -.05);
 // the hollow: the wall on the left that leans over into the roof, and the ledge we stand on
 float H = bfRock(p);
 float wall = -.30 + .18*(p.y + .2) - p.x, roof = p.y - .385 + .05*bfG((p.x - .60)*5.) - .03*sin(p.x*5.) + .06*max(p.x - .7, .0);
 float dR = -smin(-wall, -roof, .24) + .14*(noise(p*vec2(4., 6.)) - .5) + .085*(H - .5) - open;
 float dG = -.385 - .25*max(o3, .0) - p.y + .06*abs(noise(vec2(p.x*6., 3.)) - .4) + .04*abs(noise(vec2(p.x*15., 5.)) - .5) + .05*(H - .5)*bfS(.1, -.4, p.x);
 float rock = bfIn(-max(dR, dG), px);
 vec3 day = mix(bfSun, bfSky, .3)*(.9 + .4*uLevel), tint = vec3(.0), col = vec3(.0);
 float ropes = .0;
 for (int k = 0; k < 5; k++) { // each kind is a rope of water with its colour in the light behind it
  float at = k == 0 ? .37 : k == 1 ? .02 : k == 2 ? .74 : k == 3 ? .56 : -.16;
  float g = bfG((p.x - at + .025*sin(p.y*5. + float(k)*2. + uTime*.05)) / .085)*bfLv(k);
  tint += bfKc(k)*g; ropes += g;
 }
 if (rock < 1.) {
  // the sheet of water, sliding faster the further it has fallen
  float tau = sqrt(max(.66 - p.y, .02)), part = (p.x - .2) / .16;
  float x = p.x - .13*bfCc*part*bfG(part) + .010*sin(tau*8. - bfPh*2. + p.x*11.);
  float see = bfG((p.x - .2 + .02*sin(tau*9.))*11.)*bfG((p.y + .05)*5.); // it runs thin before the house
  float flow = .36 + .5*band(abs(p.x - .28) / .62)*(.5 + uEnergy) + .10*uDrone + .16*ropes + bfFlow - .25*see - .5*bfCc*bfG(part*.8);
  float form = bfMix1(uOwn[2], 1.5, 1., .75);
  float c1 = bfN(vec2(x*4.2*form + 3., tau*1.5 - bfPh)), lag = tau + .03*sin(x*70. + 3.*c1);
  vec2 a2 = vec2(x*16.*form + 1.5*c1, lag*2.2 - bfPh*1.47), a3 = vec2(x*43.*form + 3.*c1, lag*3.4 - bfPh*2.27 + 9.), a4 = vec2(x*105. + 4.*c1, lag*4.4 - bfPh*2.93 + 5.);
  float c2 = bfN(a2), c3 = bfN(a3), c4 = bfN(a4);
  // how the surface leans across: what makes ropes of it
  float lean = (bfN(a2 + vec2(.06, .0)) - c2)*5. + (bfN(a3 + vec2(.14, .0)) - c3)*2.6 + (bfN(a4 + vec2(.3, .0)) - c4)*.9;
  float D = .44*c1 + .36*c2 + .26*c3 + .14*c4;
  float am = bfS(.80 - flow, 1.10 - flow, D)*(1. - .75*see), body = bfS(.86 - flow, 1.5 - flow, D);
  vec2 q = p + am*vec2(lean*.03, .05*(c2 - .5));
  vec3 val = bfValley(q, .004 + .012*am + .004*uSpace)*(.85 + .4*uPad + .2*uTone);
  vec2 sd = (p - bfSunAt())*vec2(.8, 1.);
  float glow = exp(-dot(sd, sd)*7.);
  vec3 light = mix(bfGreen*2.6 + bfSun*.25, mix(bfSun, bfSky, .45), bfS(-.4, .3, p.y))*(.6 + 1.1*glow);
  light = mix(light, light*.35 + tint*1.3, sat(ropes*.8)*(.55 + .45*uEnergy));
  // clear water takes the red out of the light; torn water throws it back white
  col = val*exp(-am*(.35 + 1.7*body)*mix(mix(vec3(1.35, .62, 1.1), vec3(.5, .62, 1.1), glow), vec3(.8, .5, .3), bfWin));
  float lit = sat(.42 + .7*lean), white = am*lit*lit*(.3 + 1.5*c3*c2 + .5*body) + bfS(.1, .0, abs(c3 - .5))*.22*c2*(.3 + am)*(.7 + .6*uTone);
  col += light*white*(1.1 + .4*uLevel)*(1. + 1.4*uPhrase*bfG((fract(tau*.8 - bfPh*.53) - .5)*5.));
  // spray rising at its foot
  float mi = noise(vec2(p.x*2.6 - uTime*.012, p.y*4. - uTime*.02))*.65 + noise(vec2(p.x*7. + uTime*.015, p.y*9. - uTime*.04))*.35;
  float fog = sat(bfS(-.05, -.45, p.y)*(.4 + .5*uTexture + .25*uDrone)*(.2 + 1.2*mi)*bfMix1(uOwn[4], .1, 1., 1.6) + max(uOwn[4], .0)*(.25 + .7*mi));
  col = mix(col, light*.65 + day*.15, fog)*(1. - .6*bfS(-.07, .0, dR));
 }
 // the piece lies along the arch, from the ledge round over the roof, as moss and wet
 vec2 lp = vec2(.28, .0) - p, ld = lp / (length(lp) + 1e-3), ap = p - vec2(.3, -.05);
 vec4 pc = piece(vec2(.5 + atan(ap.y, -ap.x - 1e-3) / 4.4, sat(1. - max(dR, .0) / .5)));
 vec3 kept = pc.rgb*pc.rgb*.9 + pc.rgb*.2;
 if (rock > .0) {
  float rel = (H - bfRock(p + ld*.012))*6., f = sat(.3 + rel), reach = exp(-max(dR, .0)*7.), away = bfG((p.x - .28)*1.5);
  if (dG < dR) {
   float moss = bfS(.45, .65, noise(p*9. + 4.)*.7 + .3*noise(p*40.));
   vec3 rc = bfStone*day*(.05 + 2.6*reach*f);
   rc += day*(.12 + 1.5*bfStone)*pow(f, 4.)*reach; // wet on the faces that look out
   rc = mix(rc, mix(bfGreen*.6, vec3(.5), bfWin*.7)*day*(.04 + 1.3*reach)*(.12 + f), moss*.6);
   rc += kept*(.08 + .9*moss)*(.05 + f)*(.5 + uEnergy)*.7;
   col = mix(col, rc, rock);
  } else {
   // the ledge: wet stone, with the light beyond lying in it
   float dep = sat(-3. - 8.*(p.y + 2.*max(-dG, .0) + .25*max(o3, .0))), wet = bfS(.35, .65, noise(vec2((p.x - .2) / (.35 + dep)*4., 3. / (.3 + dep)))*.75 + .25*H);
   vec3 rc = bfStone*day*(.1 + .9*f*away) + day*exp(-dG*90.)*(.25 + .4*f)*away;
   rc += (day*.7 + tint)*wet*exp(-dep)*(.12 + noise(vec2(p.x*15. + H, uTime*.04)))*away*.45 + kept*wet*.4;
   col = mix(col, mix(rc, vec3(.6, .66, .75)*day, bfWin*.6*bfS(.1, .8, H + .2)*away), rock);
  }
 }
 vec2 fe = bfFerns(p, open);
 col = mix(col, mix(bfGreen*2., vec3(.35, .42, .5), bfWin*.6)*(.05 + (.06 + .9*bfS(.04, -.06, dR))*fe.y)*day, fe.x);
 // drops: single ones from the roof for the keys, a handful thrown from a lip of rock by a hit
 float dr = .0, th = .0, age = 1. - uHits;
 for (int i = 0; i < 12; i++) {
  float h1 = hash11(float(i) + 80.), h2 = hash11(float(i) + 97.), h3 = fract(h1*37.), f = fract(uTime*(.16 + .05*h1) + h1*7.);
  if (i < 5) dr += bfDrop(p - vec2(-.12 + .17*float(i) + .05*h1, .36 - .80*f*f), .007)*bfS(.0, .1, f)*bfS(1., .85, f);
  vec2 at = vec2(-.225 + .05*h1, .165 + .04*h2) + age*vec2(.12 + .5*h1, .22*h2) - vec2(.0, .42*age*age);
  th += bfDrop(p - at, .004 + .007*h3);
 }
 vec2 hp = p - vec2(-.20, .19);
 return col + (day + .5)*dr*(.10*uLevel + uKeys) + mix(vec3(1.), uKind[4], .35)*uHits*(1.8*min(th, 1.5) + .4*exp(-dot(hp, hp)*130.));
}
// The five cliffs: middle, half width, top, haze; and their falls: where, how wide, the foot of the mist, the lip.
const vec4 bfCl[5] = vec4[5](vec4(.06, .40, .24, .48), vec4(-.42, .22, .36, .28), vec4(.80, .46, .27, .18), vec4(.29, .15, -.01, .06), vec4(-.98, .42, .52, .0));
const vec4 bfFl[5] = vec4[5](vec4(.01, .022, -.10, .235), vec4(-.32, .036, -.20, .35), vec4(.44, .034, -.20, .235), vec4(.245, .024, -.27, -.04), vec4(-.65, .066, -.33, .60));
vec3 bfFive(vec2 p0) {
 float zoom = bfMix1(uOwn[3], 1.3, 1., .62), px = bfPx *= zoom;
 vec2 about = vec2(.10, -.12 - .20*max(uOwn[3], .0)), p = (p0 - about)*zoom + about;
 vec3 sun = bfSun*vec3(.95, .98, 1.1), air = bfMix(uOwn[1], vec3(.03, .05, .12), vec3(.50, .60, .66), vec3(.50, .36, .40));
 vec3 pearl = mix(air, sun, .5)*(1.2 + .25*uLevel + .2*uPad + .1*uTone);
 float sunX = -.25 + .2*sin(TAU*uLoop), ray = bfG((p.x + 1. - 2.2*(1. - uCue))*3.)*uCue;
 vec3 col = mix(pearl*1.25, air*vec3(.55, .75, .95), bfS(-.1, .7, p.y + .15*p.x));
 vec4 pc = piece(vec2(p0.x / 1.78 + .5, .5 - p0.y));
 vec3 kept = pc.rgb*pc.rgb*.9 + pc.rgb*.2;
 float mist = noise(vec2(p.x*2.2 - uTime*.010, p.y*5. + uTime*.006))*.6 + noise(vec2(p.x*6. + uTime*.012, p.y*13.))*.4;
 float foggy = bfMix1(uOwn[4], -.14, .0, .22) + .05*uDrone + .04*uTexture - .07*bfCc + .08*uOwn[2];
 // the shoulder of land that carries the hut: where its edge is
 float ky = -.40 + .05*bfS(-.05, .12, p.x) + .22*bfS(.35, 1., p.x) - .5*max(-.02 - p.x, .0)  + .025*(noise(vec2(p.x*11., 2.)) - .5) + .014*noise(vec2(p.x*80., 6.));
 float on_ = bfIn(p.y - ky, 2.*px), left = 1. - on_, fy = -.24 + foggy + .3*(mist - .5), fog = bfS(fy + .10, fy - .16, p.y);
 if (fog > .99) left = .0;
 vec3 far = col; col = vec3(.0);
 for (int k = 4; k >= 0 && left > .004; k--) { // the cliffs, from the near one back
  vec4 c = bfCl[k], f = bfFl[k];
  if (c.z + .14 - 6.*max(abs(p.x - c.x) - c.y - .04, .0) < p.y) continue;
  float fk = float(k), xw = p.x + .06*(noise(vec2(p.y*7. + fk*5., fk)) - .5) + .018*(noise(vec2(p.y*34., fk)) - .5);
  float beyond = max(abs(xw - c.x) - c.y, .0), n = noise(vec2(xw*6. + fk*13., fk));
  float tf = mix(34., 80., c.w), tu = p.x*tf + n*5., tip = max(.0, 1. - 2.4*abs(fract(tu) - .5));
  float gap = bfS(.4, 2., abs(p.x - f.x) / f.y); // no trees where its water leaves it
  float below = c.z - 6.*beyond + gap*.16*(n - .5) - p.y;
  if (below < .2) below += gap*.04*bfS(.2, .1, below)*(noise(vec2(xw*23., fk + 4.)) - .5);
  float m = bfIn(-below - gap*tip*hash11(floor(tu) + fk*31.)*1.6 / tf, 2.*px)*left;
  if (m <= .0) continue;
  left -= m;
  int kind = k == 0 ? 3 : k == 1 ? 1 : k == 2 ? 4 : k == 3 ? 2 : 0;
  float lv = bfLv(kind), foot = f.z + .16*(mist - .5) + foggy, at = bfS(foot + .20, foot - .02, p.y);
  float haze = sat(max(c.w*(.85 + .3*uSpace + 1.5*foggy), at));
  vec3 rc = vec3(.0), veil = mix(pearl*(.85 + .3*mist), bfKc(kind), .2*lv*at*bfG((p.x - f.x)*6.));
  if (haze < .995) {
   // the face, hewn downward: facets lit from the left, dark seams, ledges that hold green
   vec2 q = p*mix(1.25, 2., c.w) + fk*7.3, a1 = q*vec2(9., 2.4), a2 = q*vec2(27., 7.);
   a1.x += .3*sin(q.y*9. + 3.*sin(q.x*5.));
   float n1 = noise(a1), n2 = noise(a2 + n1);
   float face = .40 + 1.9*(noise(a1 + vec2(.35, .1)) - n1) + 1.1*(noise(a2 + n1 + vec2(.35, .1)) - n2) + .4*(noise(q*vec2(80., 34.)) - .5);
   float seam = bfS(.0, .18, abs(n1 - .5))*(.5 + .5*bfS(.0, .14, abs(n2 - .5)));
   float ledge = bfS(.52, .68, noise(q*vec2(7., 22.))*.6 + .4*n2) + bfS(.07, .01, below - .05*n2);
   float shine = sat(face)*(.5 + .8*bfG((p.x - sunX)*1.2))*(1. + .5*uPad) + 1.6*ray*sat(face + .2);
   rc = bfStone*2.8*(.18*air + sun*1.25*shine)*(.15 + .85*seam);
   rc = mix(rc, mix(bfGreen*.8, vec3(.8, .85, .95), bfWin*.9)*(.22*air + .9*sun*shine), sat(ledge)*.8);
   rc += kept*(.5*sat(ledge) + .25*seam*sat(face))*(.5 + uEnergy);
   // its fall
   float d = f.w - p.y, tau = sqrt(max(d, .0) + .015), on = sat((k == 2 || k == 3 ? .05 : .6) + .6*lv + bfFlow*1.2);
   float w = f.y*(.55 + .3*on + .55*tau + .35*bfS(.13, .20, d + .02*fk))*(.75 + .6*band((.5 + fk) / 5.))*bfMix1(uOwn[2], .5, 1., 1.7);
   float dx = (p.x - f.x - .006*sin(tau*9. + fk)) / w;
   if (abs(dx) < 1.6 && d > .0) {
    vec2 b1 = vec2(dx*3. + fk*9., tau*3. - bfPh*2.), b2 = vec2(dx*8.5 + fk*5., tau*4. - bfPh*2.7);
    float s1 = bfN(b1); b2.x += s1*1.5;
    float s2 = bfN(b2), lean = 1.1*(bfN(b2 + vec2(.35, .0)) - s2) + .8*(bfN(b1 + vec2(.3, .0)) - s1);
    float al = bfS(1.15, .6, abs(dx) + .5*(s2 - .5) + .4*(s1 - .5))*bfS(.95 - on, 1.3 - on, .45 + .5*s1 + .4*s2)*bfS(.0, .006, d);
    rc *= 1. - .6*bfS(1.5, .7, abs(dx)); // wet rock beside it
    vec3 wc = mix(air*.5, sun*1.5 + air*.3, sat(.5 + .4*(s2 - .5) + lean));
    wc = mix(wc, wc*.5 + bfKc(kind), .7*lv*(.4 + .6*s1))*(1. + ray);
    if (k == 0) wc += sun*.6*uPhrase*bfG((fract(tau*.8 - bfPh*.6) - .5)*5.);
    rc = mix(rc, wc + (uKeys + .3*uHigh)*sun*bfS(.7, .9, s2), al);
   }
  }
  col += m*mix(rc, veil, haze);
 }
 col += far*left;
 // the hit's fall bursts on the rocks in the mist
 vec2 hs = (p - vec2(.44, -.10))*vec2(1., 1.3);
 if (uHits > .01) col += mix(vec3(1.), uKind[4], .4)*uHits*.7*exp(-dot(hs, hs)*90.)*(.3 + noise(p*24. + vec2(.0, 4.*uHits)));
 // mist filling the foot
 col = mix(col, pearl*(.75 + .5*mist)*(.8 + .5*sat(p.y + .6)), min(fog*1.01, 1.));
 // the pale arc standing in the spray
 vec2 aq = p - vec2(-.11 + .02*sin(TAU*uLoop), -.42);
 float ar = (length(aq*vec2(1., .8)) - .26) / .026;
 vec3 hue = sat(vec3(1.3 - abs(ar - .75)*1.5, 1.2 - abs(ar)*1.5, 1.3 - abs(ar + .75)*1.5));
 col += hue*(.14 + .12*uTexture + .12*uLevel + .4*uCue)*bfS(.02, .16, aq.y)*bfS(.17, -.12, aq.x)*(.3 + mist)*(.4 + .6*(1. - bfNight));
 // the land and the hut, at the mist's edge
 vec3 dark = bfStone*.25 + bfGreen*.22;
 if (on_ > .0) {
  vec3 land = mix(dark*(.5 + .8*noise(p*vec2(26., 60.))*noise(p*90.)*1.6), vec3(.8), bfWin*.7)*(.3*air + .6*sun);
  col = mix(col, mix(land, pearl*(.5 + .7*mist), .75*bfS(.35, .75, mist)*bfS(.03, .12, ky - p.y)), on_);
 }
 vec2 h = p - vec2(.15, -.341);
 float r = h.y - .016 + .06*h.x*h.x / .05*.2, lamp = 1. + .5*uMic + .3*bfNight;
 col = mix(col, dark*.7*(.5*air + sun), bfIn(max(abs(h.x) - .034, abs(h.y) - .024), px));
 col = mix(col, vec3(2.4, 1.05, .25)*lamp, bfIn(max(abs(h.x - .008) - .010, abs(h.y - .001) - .009), px));
 col = mix(col, mix(dark*.4, vec3(.9), bfWin*.8)*(.5*air + sun), bfIn(max(-r, abs(h.x) - .052 + r*.95), px)*bfIn(r - .034, px));
 col += vec3(.8, .36, .10)*lamp*(.25 + .3*bfNight)*exp(-dot(h, h)*260.);
 // near pine boughs that cut the right edge
 vec2 t = p0 + vec2(.06*uOwn[3], .0);
 if (t.x > .36) {
  // the trunk, then boughs that arch and hang, each a comb of twigs, a little out of focus
  float tx = .95 + .04*t.y, s = abs(t.x - tx), cov = bfIn(s - .03 + .02*t.y, .003), lace = .1 + .5*bfS(.01, -.03, t.x - tx)*noise(t*vec2(90., 14.));
  for (int i = 0; i < 6; i++) {
   float fi = float(i), h1 = hash11(fi + 12.), L = .5 - .28*fract(fi*.55 + .1), u = s / L;
   if (u > 1.) continue;
   float v = t.y - .50 + .12*fi + .05*step(2.5, fi) - .05*h1 + L*(.5*u - .30*u*u) + .004*u*sin(uTime*.5 + fi*2.)*(.5 + uLow);
   if (abs(v) > .1) continue;
   float side = v < .0 ? 1. : 1.7, ph = (s - abs(v)*(v < .0 ? .35 : .9))*44. + fi*7. + .6*noise(vec2(s*30., fi)), tw = floor(ph), c = abs(fract(ph) - .5)*2.;
   float w = .10*sqrt(1. - u)*bfS(-.05, .3, u)*(.35 + .75*noise(vec2(s*13. + fi*7., fi)));
   w *= .40 + (.25 + .50*hash11(tw + fi*31. + (v < .0 ? .0 : 57.)))*bfS(1., .15, c + .5*noise(vec2(s*260., v*260. + fi)) - .2);
   float a = max(bfIn(abs(v)*side - w, .007), bfIn(abs(v) - .005*(1. - u), .0025));
   lace = mix(lace, sat(.25 + v / .05 + .35*(1. - c)), a); cov = max(cov, a);
  }
  col = mix(col, mix(mix(bfGreen, vec3(.06, .12, .05)*(1. - .8*bfNight), .7)*.28, vec3(.8), bfWin*lace)*(.2*air + (.1 + .7*lace)*sun*.7), cov);
 }
 return col;
}
vec3 render(vec2 p) {
 bfPh = uTime*.085 + uTravel*.05;
 bfPx = 1.2 / uRes.y;
 bfCc = 4.*uCue*(1. - uCue);
 bfNight = max(-uOwn[1], .0); bfWin = max(-uOwn[0], .0);
 bfFlow = bfMix1(uOwn[2], -.28, .0, .3);
 bfSun = bfMix(uOwn[1], vec3(.14, .20, .34), vec3(1.25, 1.02, .62), vec3(1.6, .60, .17))*bfMix(uOwn[0], vec3(.85, .96, 1.18), vec3(1.), vec3(1.15, .94, .72));
 bfSky = bfMix(uOwn[1], vec3(.010, .024, .075), vec3(.42, .66, .74), vec3(.42, .24, .34));
 bfGreen = bfMix(uOwn[0], vec3(.10, .14, .16), vec3(.10, .20, .035), vec3(.45, .15, .02))*mix(1., .15, bfNight);
 bfStone = bfMix(uOwn[5], vec3(.30, .28, .25), vec3(.046, .050, .052), vec3(.22, .07, .035));
 return screenOf(uVar < .5 ? bfLedge(p) : bfFive(p));
}
