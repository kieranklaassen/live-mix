// name: Slice of country
// a: Valley block
// b: Fire block
// what: A wedge of countryside cut out like cake hangs over cream paper with one soft shadow: fields, woods, a barn and a looped river on top, folded beds of rock in watercolour on its two cut faces, broken by one fault; or a block half out of the frame, a smoking cone on top and in its grey rock a pale red chamber and a branching dyke.
// follows: The beds are the piece laid on its side: what sounds wets its stretch of bed to full colour. Drone bows the folds, pad moves a light over the land, texture grains the sand beds, the phrase silvers the river or heats the dyke, bands thicken sixteen beds. A hit lights and slips the fault, a cue lights the near edge and opens the faces, keys light windows.
// own: 0 the season: snow at -1; gold autumn at 1, or a cone grown green; 1 the hour and the page: night on blue-black at -1, sunset on red clay at 1; 2 the beds: level at -1, tightly folded at 1 (and the chamber small, or large); 3 the land: high peaks or a taller cone at -1, drowned under a bay at 1; 4 seen from high up like a map at -1, from low down at 1; 5 the block: a thin slab at -1, a slim deep column at 1
vec2 scER, scNR, scNL, scAB, scRt, scFw; // along the right face, into the block; its reach; right and away
float scBase, scWat, scPx, scPit, scFallX, scHigh, scSlip;
vec3 scL, scSun, scSky, scPap;
const vec3 scVent = vec3(.62, 0., .05);
const vec3 scDry = vec3(.97, .94, .88);
float scS(float a, float b, float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
float scSq(float x) { return x*x; }
// Where the river runs: how far across from it.
float scRiver(vec2 q) {
  float z = q.y + .05*sin(8.*q.x + 1.), c = 6.6*z + .2;
  float at = .43 + .15*sin(c) + .03*sin(2.2*c + 1.);
  float sl = .99*cos(c) + .43*cos(2.2*c + 1.);
  return (q.x - at)/sqrt(1. + sl*sl);
}
// The hills alone, broad and smooth: the beds bend under them.
float scHill(vec2 q) {
  if (uVar > .5) { float r = length(q - scVent.xz); vec2 b = q - vec2(1.95, .55); return .86*exp(-r*2.4) + .2/scSq(1. + 9.*dot(b, b)); }
  vec2 a = q - vec2(1.16, .5), b = q - vec2(-.02, .98);
  float g = 1./(1. + 7.*a.x*a.x + 1.6*a.y*a.y + 2.*a.x*a.y), k = 1./(1. + 9.*dot(b, b));
  return .37*g*g + .24*k*k;
}
float scLand(vec2 q) {
  float h = scHill(q);
  if (uVar > .5) {
    float r = length(q - scVent.xz), w = atan(q.y - scVent.z + 1e-4, q.x - scVent.x);
    h += .012*sin(w*13. + 3.*sin(r*9.))*scS(.05, .3, r)*exp(-r) + .02*sin(q.x*7. + 3.*q.y)*scS(.2, .8, r);
    return scHigh*smin(h, .56 + 14.*r*r + .02*sin(w*3.), .03);
  }
  float r = scRiver(q);
  h *= scHigh;
  h += .02*sin(q.x*5.1 + 1.3)*sin(q.y*4.3 + q.x*1.7) + .04*q.y;
  float m = max(scHigh - 1., 0.);
  if (m > 0.) h += m*.16*(.5 - abs(sin(q.x*6.3 + 1.6*sin(q.y*5.))*.5 + sin(q.y*8. - q.x*3.)*.35))*scS(.1, .5, abs(r));
  h -= .05/(1. + 45.*r*r) + .02/(1. + 2600.*r*r);
  return h;
}
float scTop(vec2 q) { return max(scLand(q), scWat); }
// Paint as it dries: pale blooms and grains.
float scWash(vec2 q) { return .55*noise(q*7.) + .3*noise(q*19. + 4.) + .15*noise(q*70.); }
vec3 scRock(int i) {
  if (uVar > .5) {
    float k = hash11(float(i)*1.7 + 2.);
    return mix(vec3(.47, .485, .51), vec3(.88, .87, .84), k*k);
  }
  int j = i & 7;
  return j == 0 ? vec3(.87, .75, .52) : j == 1 ? vec3(.5, .6, .68) : j == 2 ? vec3(.91, .86, .72) : j == 3 ? vec3(.74, .42, .31) :
         j == 4 ? vec3(.83, .64, .38) : j == 5 ? vec3(.46, .49, .53) : j == 6 ? vec3(.82, .63, .56) : vec3(.6, .63, .52);
}
float scSeg(vec2 p, vec2 a, vec2 b, float wa, float wb) {
  vec2 d = b - a; float h = sat(dot(p - a, d)/dot(d, d));
  return length(p - a - d*h) - mix(wa, wb, h);
}
// The molten part of b in the cut: below 0 is inside.
float scMolten(vec2 q) {
  q.x += -scVent.x + .05*(noise(vec2(q.y*9., 3.)) - .5) + .016*(noise(vec2(q.y*34., 8.)) - .5);
  q.y += .022*(noise(q*15.) - .5);
  vec2 c = (q + vec2(.02, .37))/(vec2(.36, .11)*(1. + .25*uOwn[2]));
  float d = (length(c + vec2(0., .22*c.x*c.x - .1)) - 1.)*.11;
  d = smin(d, scSeg(q, vec2(-.02, -.32), vec2(.02, -.02), .05, .015), .07);
  d = min(d, scSeg(q, vec2(.02, -.02), vec2(0., .85), .015, .028));
  d = min(d, scSeg(q, vec2(.01, -.1), vec2(.3, .13), .011, .002));
  d = min(d, scSeg(q, vec2(.16, .02), vec2(.46, .03), .006, .001));
  d = min(d, scSeg(q, vec2(.01, .06), vec2(-.2, .24), .010, .002));
  d = min(d, scSeg(q, vec2(-.1, .155), vec2(-.3, .12), .005, .001));
  return d;
}
// One cut face: folded beds, darker at their base. s is the place along both faces, the near edge at 0.
vec3 scFace(vec3 P, float s, float px, float lit, float h) {
  vec2 f2 = vec2(s, P.y);
  float own2 = uOwn[2], hill = scHill(P.xz)*scHigh;
  // the fault and its slip
  float side = (P.x*.94 - P.y*.34 - P.z*.25) - (uVar < .5 ? .74 : 1.12);
  float amp = own2 < 0. ? 1. + own2 : 1. + 1.8*own2;
  float bow = amp*(.045*sin(2.6*P.x - 2.1*P.z + .9) + .02*sin(6.1*P.x + 4.3*P.z)) + max(own2, 0.)*.09*sin(7.*P.x - 6.*P.z + 2.*P.y);
  bow += (.055*uDrone)*cos(2.4*(P.x - P.z) - 1.2);
  float y = P.y;
  if (uVar < .5) y -= mix(.8, .95, max(own2, 0.))*(own2 < 0. ? 1. + own2 : 1.)*hill + bow;
  else y -= hill*sat((y + .9)/1.9)*.85*(1. + .9*min(own2, 0.)) + bow*.7;
  y += step(0., side)*scSlip;
  y += .007*(noise(f2*11.) - .5) + .003*(noise(f2*40.) - .5);
  float deep = uVar < .5 ? .33 - scBase : 1.8, q = ((uVar < .5 ? .13 : .5) - y)/deep;
  // sixteen beds, as thick as their bands
  float w[16], all = 0.;
  for (int i = 0; i < 16; i++) { w[i] = (.25 + 1.9*scSq(hash11(float(i)*3.1 + 5.)))*(1. + 1.1*uBands[15 - i]); all += w[i]; }
  q = 1. - abs(1. - abs(q));
  float x = clamp(q, 0., .9999)*all; int k = 0;
  for (int i = 0; i < 16; i++) { if (x < w[i] || i == 15) { k = i; break; } x -= w[i]; }
  float f = sat(x/w[k]), thick = w[k]/all*deep, fromTop = f*thick, toBase = (1. - f)*thick;
  float wash = scWash(f2 + float(k)*3.);
  vec3 col = scRock(k);
  vec4 m = piece(vec2(.5 + .5*s/(s > 0. ? scAB.x : scAB.y), (float(k) + f)/16.));
  float wet = sat(m.a*(1. + 1.3*uEnergy));
  wet = sat(wet*(.75 + .5*scS(.3, .7, wash + .3*wet)));
  vec3 hue = m.rgb/max(m.a, .04); hue /= max(max(hue.r, max(hue.g, hue.b)), .2);
  float dry = .22 + .32*scS(.3, .7, wash);
  vec3 full = col*col*(uVar < .5 ? 1.02 : .85);
  hue = mix(hue, vec3(dot(hue, vec3(.33))), uVar < .5 ? .35 : .5);
  full = mix(full, full*hue*1.15 + .08*hue*hue, .75);
  col = mix(col, scDry, dry*.8);
  // darker towards its base, a hard dried edge at the foot and a bare sliver under the bed above
  float low = scS(.15, 1., f);
  col *= 1. - (.14 + .12*uTone)*low*low;
  col = mix(col, full*(1. - .25*low*low), wet*.88);
  float soft = px*1.2 + .0015;
  col *= 1. - (1. - col)*.62*scS(.005 + soft, 0., min(toBase, fromTop*1.6));
  col = mix(col, scDry, .6*(1. - wet)*scS(.003 + soft, 0., abs(fromTop - .006 - soft)));
  // what each bed is made of: stipple, courses, dashes
  vec2 g = vec2(s, fromTop);
  float ink = 0.;
  int ty = (k*5 + 1) % 4;
  if (ty == 0 || uVar > .5) { // sandstone, ash
    vec2 c = g*52., id = floor(c), o = hash22(id + float(k)*7.);
    ink = scS(.1 + .14*hash21(id + 9.) + .1*uTexture, .08, length(fract(c) - .3 - .4*o))*step(.55 - .5*uTexture, hash21(id + 3.))*(.45 + .5*uTexture);
  } else if (ty == 1) { // limestone in courses
    float rest = (.25 + 1.9*scSq(hash11(float(k)*3.1 + 5.)))/14.*deep;
    float hh = max(thick/max(floor(rest/.03 + .5), 1.), .012), n = floor(fromTop/hh);
    vec2 e = abs(fract(vec2(s/.075 + .5*mod(n, 2.) + .3*hash11(n + float(k)), fromTop/hh)) - .5);
    ink = .4*scS(.42, .5, max(e.x + .02, e.y));
  } else if (ty == 2) { // shale
    vec2 c = vec2(s*14. + 7.*hash11(floor(fromTop*55.)), fromTop*55.), e = abs(fract(c) - .5);
    ink = .42*scS(.22, .12, e.y)*scS(.36, .3, e.x)*step(.4, hash21(floor(c)));
  }
  col = mix(col, col*vec3(.5, .46, .44), mix(uVar > .5 || ty == 0 ? (.5 - .25*uVar)*uTexture : .1, ink, scS(.011, .003, px)));
  col *= .94 + .1*noise(f2*130.);
  // the fault
  float fa = abs(side);
  col = mix(col, vec3(.2, .16, .14), .75*scS(.0025 + px, 0., fa));
  col += (uKind[4]*.5 + .5)*uHits*.6*exp(-fa*15.);
  col += (scSun*.4 + .2*uKind[0])*uCue*exp(-abs(s)*7.);
  float own = 0.;
  if (uVar < .5) {
    float so = h - P.y, soil = .018 + .008*noise(f2*20.); // turf and soil
    col = mix(col, vec3(.36, .26, .19), .85*scS(soil + .004, soil - .004, so));
    col = mix(col, vec3(.38, .42, .22), scS(.006 + px, .004, so));
  } else {
    float d = scMolten(vec2(dot(P.xz, scER), P.y));
    if (s < 0.) d -= 2.2*s;
    float run = .5 + .5*sin(TAU*(P.y*2. - uTime*.12));
    float heat = .34 + .22*uEnergy*uLow + .08*sin(uTime*.25) + uPhrase*(.35 + .55*run*run) + .5*uCue;
    vec3 red = mix(vec3(.83, .43, .37), vec3(.95, .7, .6), scS(0., -.1, d));
    red = mix(red*.93, vec3(1., .78, .56), .6*sat(heat));
    red *= .9 + .16*scWash(f2*1.3 + 9.);
    // cracks near the heat take its light
    float cr = abs(noise(vec2(f2.x*3. - f2.y*5., f2.x*11. + f2.y*8.) + .8*noise(f2*13.)) - .5);
    float near = exp(-max(d, 0.)*8.);
    col = mix(col, col*vec3(1.2, .76, .68) + vec3(.07, .015, 0.), sat(near*near*(.45 + .6*heat)));
    col = mix(col, red*1.05, scS(.022 + px, 0., cr)*scS(.3, .8, near)*sat(.25 + heat)*.8);
    col = mix(col, red*.55, scS(.006 + px, .002, d));
    own = scS(px, -px, d + .003);
    col = mix(col, red, own);
    own = max(own, .6*near*near);
    col = mix(col, vec3(.35, .33, .33), scS(.02, 0., h - P.y)*.6);
  }
  // water standing over the land, cut too
  if (P.y > h) {
    float dw = sat((scWat - P.y)/.3);
    col = mix(vec3(.62, .76, .79), vec3(.3, .47, .56), dw)*(.95 + .1*wash);
    col = mix(col, vec3(.95), .6*scS(.006 + px, .002, scWat - P.y));
    return col*mix(vec3(1.), scSky, .2)*(.8 + .25*lit);
  }
  return col*mix(mix(scSky*vec3(.87, .85, .85), scSun, lit), vec3(1.), own);
}
// How the day falls on the ground: the sun, the clouds' shade, the pad's patch.
float scDay(vec2 q, vec3 n, float sun, out float cs, out float patchy) {
  vec2 co = .2*vec2(cos(TAU*uLoop), sin(TAU*uLoop)) + vec2(sin(uTime*.011), cos(uTime*.013)), pa = q - vec2(.75 + .5*sin(uTime*.09), .55 + .3*cos(uTime*.067));
  patchy = uPad*exp(-dot(pa, pa)*5.);
  cs = scS(.48, .62, noise(q*2.1 + co + 3.)*.7 + noise(q*5.3 + co*2.)*.3);
  return sat(dot(n, scL))*sun*(1. - .5*cs*(1. - .5*patchy));
}
// Fields, hedges, woods, a barn and the river. q on the ground.
vec3 scFields(vec3 P, vec3 n, float px, float sun) {
  vec2 q = P.xz;
  float pd = px/scPit;
  vec2 v = rot(.42)*q; v += .035*sin(v.yx*vec2(6., 5.) + vec2(1., 2.)) + .012*sin(v.yx*17.);
  v *= vec2(4.6, 7.2);
  float row = floor(v.y), wid = .75 + .6*hash11(row + 11.), X = v.x*wid + 9.*hash11(row + 3.);
  vec2 c = vec2(floor(X), row), f = vec2(X - c.x, v.y - row), sz = vec2(1./(4.6*wid), 1./7.2);
  float id = hash21(c + 5.);
  if (id > .55) { f.x *= 2.; sz.x *= .5; id = fract(id*7.3 + floor(f.x)*.37); f.x = fract(f.x); }
  else if (id > .4) { f.y *= 2.; sz.y *= .5; id = fract(id*5.1 + floor(f.y)*.41); f.y = fract(f.y); }
  vec2 e0 = f*sz, e1 = (1. - f)*sz;
  float edge = min(min(e0.x, e0.y), min(e1.x, e1.y)), h2 = fract(id*17.7);
  float au = max(uOwn[0], 0.), wi = max(-uOwn[0], 0.);
  vec3 grass = mix(vec3(.58, .66, .38), vec3(.7, .73, .46), h2), barley = vec3(.89, .79, .5), plough = vec3(.66, .5, .4);
  vec3 col = id < .34 ? grass : id < .52 ? barley : id < .66 ? plough : id < .84 ? vec3(.8, .81, .6) : vec3(.44, .57, .37);
  col = mix(col, (col.r + col.g)*vec3(.63, .48, .22), au);
  // furrows
  float fu = (h2 > .5 ? f.x*sz.x : f.y*sz.y)/.012, fs = scS(.006, .002, pd);
  col *= 1. - (id > .34 && id < .66 ? .16 : .05)*fs*scS(.2, .5, abs(fract(fu) - .5));
  col *= .9 + .2*scWash(q*1.5 + id*9.);
  float moor = scS(.17, .26, P.y + .1*noise(q*6.));
  vec3 heath = mix(mix(vec3(.6, .58, .4), vec3(.58, .5, .46), noise(q*9.)), vec3(.72, .48, .3), au);
  heath = mix(heath, vec3(.62, .61, .6), max(scHigh - 1., 0.)*scS(.45, .8, length(n.xz) + .3*noise(q*13.)));
  col = mix(col, heath*(.85 + .3*noise(q*vec2(34., 22.))), moor);
  float hw = .0042 + .003*noise(q*60.), hedge = scS(hw + pd*.6, hw - pd*.6, edge)*(1. - moor)*min(1., 2.*hw/max(pd, .001));
  col = mix(col, vec3(.97, .975, .98)*(.95 + .07*noise(q*25.)), wi*.9);
  col = mix(col, mix(mix(vec3(.25, .34, .2), vec3(.5, .33, .18), au*.7), vec3(.37, .34, .32), wi), hedge*.85);
  // the river
  float r = scRiver(q), ra = abs(r), rw = .019 + .006*sin(q.y*11.);
  float riv = scS(rw + pd*.5, rw - pd*.5, ra);
  float go = fract(q.y*2.2 + uTime*.16), gl = scS(0., .5, go)*scS(1., .6, go);
  vec3 wat = mix(vec3(.44, .6, .7), vec3(.7, .8, .84), .5 + .5*sin(q.y*9. + 1.));
  wat = mix(wat, mix(vec3(1.06), uKind[3], .2), sat(uPhrase*(.45 + gl)));
  col = mix(col, wat*vec3(.6, .62, .65), scS(rw + .005 + pd, rw + .002, ra)*.6);
  // sand where the sea comes in
  col = mix(col, vec3(.9, .83, .66), scS(-.045, -.012, scWat - P.y));
  float cs, patchy, dif = scDay(q, n, sun, cs, patchy);
  vec3 lit = col*(scSky*(.56 + .08*n.y) + scSun*.7*dif)*(1. + patchy*(.2 + .5*uKind[1])*(.4 + .6*uEnergy));
  lit = mix(lit, wat*mix(scSun, scSky, .5)*(1. - .2*cs), riv);
  // woods: each tree stands up from where it grows, its light side to the left
  vec2 ci = floor(q/.05);
  float crown = 0., shade = 0.; vec3 tc = vec3(0.);
  vec2 up = scFw*scPit/sqrt(max(1. - scPit*scPit, .01)) - n.xz/max(n.y, .2); // up the picture, over the slope
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 b = ci + vec2(float(i), float(j)), hs = hash22(b + 7.), at = (b + .25 + .5*hs)*.05;
    float wood = noise(at*3.2 + 8.)*.75 + .25*hs.x - .12*scS(.5, .2, at.x);
    float on = scS(.58, .63, wood) + step(.95, hash21(b + 31.));
    on *= scS(.03, .05, abs(scRiver(at)))*step(0., dot(at, scNR) - .01)*step(0., dot(at, scNL) - .01);
    if (on < .4) continue;
    float R = (.012 + .010*hs.y)*sat(on);
    vec2 d = q - at, u = vec2(dot(d, scRt), dot(d, up) - R*1.05);
    vec2 sd = d + scL.xz*.022; // its shade
    shade = max(shade, scS(1.25, .6, length(vec2(dot(sd, scRt)*.7, dot(sd, scFw)))/R));
    float e = length(u*vec2(1., .95))/R + .12*sin(u.x/R*5. + hs.x*20.)*sin(u.y/R*5.), a = scS(1. + px/R, 1. - px/R, e);
    if (a > 0.) {
      vec3 g = mix(mix(vec3(.27, .37, .23), vec3(.48, .53, .29), hs.x), mix(vec3(.62, .25, .12), vec3(.8, .55, .2), hs.x), au);
      g = mix(g, mix(vec3(.42, .38, .36), vec3(.9, .91, .93), scS(-.1, .7, u.y/R)), wi);
      g *= .62 + .5*scS(1., -1., (u.x - u.y*.8)/R);
      tc = mix(tc, g, crown > 0. ? a : 1.); crown = max(crown, a);
    }
  }
  lit *= 1. - .38*shade*(1. - crown);
  lit = mix(lit, tc*(scSky*.35 + scSun*.7*(1. - .4*cs)), crown);
  // farms: white walls, a slate roof, windows for the keys
  for (int i = 0; i < 3; i++) {
    vec2 at = i == 0 ? vec2(.66, .52) : i == 1 ? vec2(.16, .4) : vec2(.82, 1.02);
    float S = i == 0 ? .045 : .03;
    vec2 d = q - at, u = vec2(dot(d, scRt), dot(d, up))/S; float w = px/S;
    if (abs(u.x) > 3. || u.y < -2. || u.y > 3.) continue;
    lit *= 1. - .4*scS(.15, -.1, max(abs(u.x - 1.4) - .75, abs(u.y - .12) - .25));
    float wall = scS(w, -w, max(abs(u.x) - 1., abs(u.y - .4) - .42));
    float roof = scS(w, -w, max(abs(u.x) - 1.12 + .3*(u.y - .8), abs(u.y - 1.1) - .32));
    vec3 wl = mix(vec3(1., .985, .95), vec3(.72, .73, .78), scS(-w, w, u.x - .35));
    lit = mix(lit, wl*mix(scSky, scSun, .7), wall);
    lit = mix(lit, mix(vec3(.6, .34, .26), vec3(.93, .94, .96), wi)*scSun*(u.x > .4 ? .85 : 1.), roof);
    float ws = wall*scS(.15 + w, .15 - w, abs(abs(u.x) - .5))*scS(.22 + w, .2 - w, abs(u.y - .38));
    float on = sat(uKeys + uMic + .25*uLevel + max(-uOwn[1], 0.)*.6);
    lit = mix(lit, mix(vec3(.32, .33, .36), vec3(1., .78, .32), on), ws*.9);
    lit += vec3(.5, .3, .08)*(uKeys + .6*uMic)*exp(-dot(u, u)*.35)*.7;
  }
  return lit;
}
vec3 scScree(vec3 P, vec3 n, float sun) {
  vec2 q = P.xz - scVent.xz; float r = length(q);
  vec2 w = q/max(r, .001);
  float ch = noise(w*5. + r*2.)*.6 + noise(w*13. + r*4.)*.4;
  vec3 col = mix(vec3(.53, .53, .54), vec3(.72, .71, .69), ch)*(.88 + .22*noise(P.xz*60.));
  float sn = max(-uOwn[0], 0.), gr = max(uOwn[0], 0.);
  col = mix(col, vec3(.95, .96, .98), sn*scS(.05, .35, P.y + .25*(ch - .5)));
  col = mix(col, mix(vec3(.46, .56, .33), vec3(.62, .66, .4), noise(P.xz*14.)), gr*scS(.66, .35, P.y + .3*(ch - .5)));
  col = mix(col, vec3(.8, .76, .66), scS(-.05, -.012, scWat - P.y));
  float cs, patchy, dif = scDay(P.xz, n, sun, cs, patchy);
  return col*(scSky*.46 + scSun*dif)*(1. + patchy*(.15 + .5*uKind[1]))
    + vec3(.55, .16, .1)*scS(.16, .02, r)*(.35 + .5*uPhrase + .8*uCue); // the mouth glows on its inner wall
}
vec3 scTopColour(vec3 P, float px) {
  float e = .006, h = scLand(P.xz), tp = max(h, scWat);
  vec3 n = normalize(vec3(h - scLand(P.xz + vec2(e, 0.)), e, h - scLand(P.xz + vec2(0., e))));
  float sun = 1.;
  for (int i = 1; i < 4; i++) { float t = .07*float(i*i); vec3 s = vec3(P.x, tp, P.z) + scL*t; sun = min(sun, scS(-.03, .03, s.y - scLand(s.xz))); }
  P.y = h;
  vec3 col = uVar < .5 ? scFields(P, n, px, sun) : scScree(P, n, sun);
  float dw = scWat - h;
  if (dw > -.002) {
    float rip = noise(P.xz*vec2(30., 60.) + uTime*.1);
    vec3 sea = mix(vec3(.58, .75, .76), vec3(.3, .47, .57), scS(0., .22, dw))*(.94 + .1*rip)*mix(scSky, scSun, .6);
    sea = mix(sea, vec3(.96), scS(.014, .004, dw + .006*sin(uTime*.5 + P.x*20.))*.7);
    sea = mix(sea, mix(vec3(1.), uKind[3], .3), uPhrase*.4*scS(.6, .85, rip));
    col = mix(col, sea, scS(-.002, .003, dw));
  }
  return col;
}
// The page, its tooth, and the one soft shadow.
vec3 scPage(vec2 p, vec3 o, vec3 d) {
  float tooth = noise(p*230.)*.5 + noise(p*97. + 3.)*.5;
  vec3 col = scPap*(.97 + .045*tooth)*(1.01 - .05*length(p - vec2(-.3, .25)));
  float gap = .26 + .2*uSpace, t = (scBase - gap - o.y)/min(d.y, -.05);
  vec2 q = (o + d*t).xz + scL.xz/scL.y*gap*.55;
  float e = max(max(-dot(q, scNR), -dot(q, scNL)), (length(q/scAB) - 1.)*1.2);
  return uVar > .5 ? col : col*mix(vec3(1.), vec3(.6, .58, .62), .85*scSq(scS(.34 + .15*uSpace, -.3, e)));
}
// The smoke of b, laid on as one grey wash after another.
vec4 scSmoke(vec2 p, vec2 at) {
  vec2 q = p - at; float y = q.y + .01;
  if (y < -.03) return vec4(0.);
  float wide = .022 + .26*y + .1*sqrt(max(y, 0.));
  q.x -= .6*y + 1.9*y*y + .02*sin(y*11. - uTime*.22);
  vec2 u = vec2(q.x*8., y*8. - uTime*.09);
  float n = noise(u + .9*noise(u*1.3 + 4.))*.55 + noise(u*2.6 + 2.)*.3 + noise(u*6. + 1.)*.15;
  float d = 1. - abs(q.x)/wide + min((n - .5)*2.8, .25);
  float a = scS(0., .22, d)*scS(-.02, .01, y)*scS(.8, .15, y);
  float ed = scS(0., .1, d)*scS(.35, .1, d);
  vec3 c = mix(vec3(.44, .44, .48), vec3(.92, .91, .89), sat(.5 + 2.2*(n - .5) - .5*q.x/wide));
  c += vec3(.35, .08, .03)*(.15 + .6*uPhrase + uCue + uKeys)*exp(-y*16.);
  return vec4(c*(1. - .14*ed)*mix(scPap, vec3(1.), .4), a*(.75 + .2*uLow));
}
vec3 render(vec2 p) {
  bool B = uVar > .5;
  float asp = uRes.x/uRes.y, v4 = uOwn[4], o1 = uOwn[1], o3 = uOwn[3], o5 = uOwn[5];
  float far = 1. + (B ? .3 : .75)*scS(1.3, .5, asp);
  vec2 p0 = p; p *= far;
  float cue = 4.*uCue*(1. - uCue), hit = 4.*uHits*(1. - uHits);
  // the hour and the page
  float nt = max(-o1, 0.), ev = max(o1, 0.);
  scPap = mix(mix(mix(vec3(.955, .925, .855), vec3(.46, .54, .64), sat(2.*nt)), vec3(.085, .105, .165), sat(2.*nt - 1.)), vec3(.88, .55, .4), ev);
  scSun = mix(mix(vec3(1.06, 1.02, .94), vec3(.72, .82, 1.04), nt), vec3(1.15, .84, .58), ev);
  scSky = mix(mix(vec3(.86, .9, .97), vec3(.4, .47, .68), nt), vec3(.7, .62, .78), ev);
  scPap *= mix(vec3(1.), uOwn[0] < 0. ? vec3(.93, .985, 1.08) : vec3(.98, .91, .74), abs(uOwn[0]));
  // how the block is cut and stands
  float open = (B ? .04 : .09)*cue;
  scER = vec2(cos(open), -sin(open)); scNR = vec2(sin(open), cos(open)); scNL = vec2(cos(open), sin(open));
  scAB = (B ? vec2(3.3, 1.5) : vec2(1.62, 1.36))*(1. - (B ? .52 : .4)*max(o5, 0.));
  scBase = B ? -1.5 + .85*max(-o5, 0.) + .4*max(o5, 0.) : -.52 - .32*o5;
  scHigh = 1. - (B ? .25 : o3 < 0. ? .65 : .3)*o3;
  scWat = o3 > 0. ? mix(-.3, B ? .12 : .085, scS(0., 1., o3)) : -9.;
  scSlip = (B ? .07 : .085) + .05*hit;
  float turn = (B ? .42 : .56) + .06*sin(uTravel*.021), pit = (B ? .36 : .47) - (v4 < 0. ? .55 : .24)*v4;
  scFw = vec2(sin(turn), cos(turn)); scRt = vec2(scFw.y, -scFw.x); scPit = sin(pit);
  float cp = cos(pit), K = .42;
  vec3 f = vec3(scFw.x*cp, -scPit, scFw.y*cp), r = vec3(scRt.x, 0., scRt.y), u = vec3(scFw.x*scPit, cp, scFw.y*scPit);
  vec3 away = vec3(scFw.x, 0., scFw.y), look = r*(B ? .78 : .33) + away*(B ? .3 : .62);
  look.y = B ? .16 + .02*max(o5, 0.) : -.07 - .26*max(o5, 0.);
  float dist = (B ? 3.9 : 3.75) - .5*min(o3, 0.) - .7*min(v4, 0.);
  look.y -= (B ? .13 : .26)*max(o5, 0.);
  vec3 o = look - f*dist, d = normalize(f + K*(r*p.x + u*p.y));
  scPx = K/uRes.y*far;
  scL = normalize(vec3(0., .62, 0.) - .8*r - .12*away);
  scFallX = .5;
  for (int i = 0; i < 3; i++) scFallX -= scRiver(scER*scFallX)*1.1;
  vec3 col = scPage(p0, o, d);
  // the smoke stands behind the near rim and before the page
  if (B) {
    vec3 mv = vec3(scVent.x, .58*scHigh, scVent.z + .03) - o; float mz = max(dot(mv, f), .1);
    vec4 s = scSmoke(p, vec2(dot(mv, r), dot(mv, u))/(mz*K)); col = mix(col, s.rgb, s.a);
  }
  // into the block
  vec2 od = o.xz/scAB, dd = d.xz/scAB;
  float qa = max(dot(dd, dd), 1e-5), qb = dot(od, dd), disc = qb*qb - qa*(dot(od, od) - 1.);
  float tR = -dot(o.xz, scNR)/max(dot(d.xz, scNR), 1e-3), tL = -dot(o.xz, scNL)/max(dot(d.xz, scNL), 1e-3);
  float t0 = max(tR, tL), t1 = disc > 0. ? (-qb + sqrt(disc))/qa : -1.;
  if (t1 > t0) {
    bool right = tR > tL;
    vec3 P = o + d*t0;
    float px = t0*scPx, h = scLand(P.xz), top = max(h, scWat), s = right ? dot(P.xz, scER) : -length(P.xz);
    float over = (top - P.y)/(px*.8), cf = sat(.5 + over);
    if (cf < 1. && P.y > scBase) {
      float ymax = (B ? .8 : .46)*scHigh + .12, t = max(t0, (ymax - o.y)/min(d.y, -.02)), gap = 1e3, tg = t, dy = 0.;
      bool got = false;
      float k = 1./(-d.y + .8*length(d.xz)), was = 1., st = 0.;
      for (int i = 0; i < 30; i++) {
        vec3 q = o + d*t;
        dy = q.y - scTop(q.xz);
        if (dy < t*scPx*.4) { if (dy < 0.) t += st*dy/max(was - dy, 1e-4); got = true; break; }
        if (dy/t < gap) { gap = dy/t; tg = t; }
        if (t >= t1) break;
        was = dy; st = min(max(dy*k, .004), t1 - t); t += st;
      }
      if (t < t1 - .01) got = true;
      float cov = got ? 1. : sat(1. - gap/scPx*1.2);
      if (cov > .02) {
        vec3 q = o + d*(got ? t : tg);
        col = mix(col, scTopColour(q, t*scPx), cov);
      }
    }
    if (cf > 0.) {
      float end = (t1 - t0)/(px*2.5), cb = sat(.5 + (P.y - scBase)/px)*sat(end);
      if (cb > 0.) {
        float lit = right ? .3 : .97;
        vec3 c = scFace(P, s, px/max(abs(dot(d.xz, right ? scNR : scNL)), .2), lit, h);
        // pencil along the near edge and the foot
        c *= 1. - .2*scS(.1, 0., P.y - scBase) - .3*scS(px*2.5, 0., P.y - scBase);
        c = mix(c, vec3(.2, .16, .15), .55*scS(px*1.6, 0., abs(s)));
        col = mix(col, c, cf*cb);
      }
    }
  }
  if (!B) {
    // the river falls off the edge as a thread
    vec3 F = o + d*tR; float fs = dot(F.xz, scER), px = tR*scPx, ft = scTop(scER*scFallX);
    float fall = ft - F.y, fx = fs - scFallX + .004*sin(F.y*24. + uTime*.8)*sat(fall*2.);
    float len = -scBase + ft + .16;
    if (fall > 0. && fall < len && abs(fx) < .1) {
      float wd = .013 + .006*scS(.3, 0., fall);
      float st = .78 + .22*sin(fx*420. + 3.*sin(F.y*13. + uTime*1.7));
      float run = fract(F.y*1.4 + uTime*.3); run = scS(0., .4, run)*scS(1., .5, run);
      float a = scS(wd + px, wd - px, abs(fx))*st*scS(len, len - .3, fall);
      float shd = scS(.03, 0., abs(fx - .022))*step(scBase, F.y)*scS(0., .05, fall);
      col *= 1. - .25*shd;
      col = mix(col, mix(vec3(.84, .91, .93), vec3(1.), sat(uPhrase*run*1.4))*mix(vec3(1.), scSun, .8), a*(.8 + .2*uPhrase));
    }
  }
  return sat(col);
}
