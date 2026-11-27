// name: Grown bridge
// a: Across the gorge
// b: Walking over
// what: A green gorge in rain mist: long roots led across from two fig trees have grown into one hanging bridge, a younger one above, hair roots below, pale pools, and one small walker under an umbrella; or the way over from inside it, flat stones on plaited roots, roots and ribs on both sides and overhead, the far bank bright in mist.
// follows: The piece wets, lights and slightly thickens the roots where it sounds along the bridge. The drone is the depth of the mist, the pad the green, texture the rain; a phrase lights the umbrella. Sixteen bands sway the hanging tufts. A hit drops water and runs out along the roots; a cue lets the sun in; keys sparkle the drops; travel walks us over.
// own: 0 a blue night at -1, a gold low sun at 1; 1 snow on roots and forest at -1, rose-red new leaves at 1; 2 young thin roots at -1, old thick ones with long hair at 1; 3 seen from farther off, or with a wide lens on the path, at -1, close to the walker, or looking narrow ahead, at 1; 4 clear air at -1, thick white mist at 1; 5 a taut, nearly level bridge at -1, a deep sag at 1
float rbS(float a, float b, float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
// The hour, the roots' age, a pixel, where a hit falls, the colours.
float rbNight, rbOld, rbPx, rbFog, rbAt;
vec3 rbAir, rbLeaf, rbSun, rbBark, rbMoss, rbHit;
float rbG(float x) { return exp(-x*x); }
float rbIn(float d, float a) { return rbS(a, -a, d); }
float rbW(float x) { x = 2.*fract(x*.15915) - 1.; return 4.*x*(abs(x) - 1.); }   // near enough a sine
float rbH(float n) { n = fract(n*.1031); n *= n + 33.33; return fract(n*(n + n)); }
vec3 rbKc(int k) { vec3 c = uKind[k]; return c*c*1.3 + c*.1; }
void rbWorld() {
 float gold = max(uOwn[0], .0), snow = max(-uOwn[1], .0), rose = max(uOwn[1], .0);
 rbNight = max(-uOwn[0], .0); rbOld = uOwn[2];
 rbFog = exp2(1.4*uOwn[4])*(.80 + .35*uDrone + .12*uSpace);
 rbAir = mix(mix(vec3(.86, 1.12, 1.03), vec3(1.5, .92, .46), gold), vec3(.07, .13, .22), rbNight);
 rbAir = mix(rbAir, vec3(.98, 1.02, 1.1)*(1. - .8*rbNight), .5*snow)*mix(vec3(1.), vec3(1.16, .90, .88), rose);
 rbSun = mix(mix(vec3(1.9, 1.75, 1.2), vec3(2.6, 1.35, .45), gold), vec3(.45, .65, 1.), rbNight);
 vec3 hour = mix(mix(vec3(1.), vec3(1.35, .95, .5), gold), vec3(.16, .22, .36), rbNight), pad = rbKc(1);
 rbLeaf = mix(mix(vec3(.08, .27, .045), vec3(.34, .085, .07), rose), vec3(.5, .56, .62), .75*snow)*hour;
 rbLeaf *= mix(vec3(1.), pad/(.15 + dot(pad, vec3(.333))), .25*uPad)*(.8 + .75*uPad);
 rbBark = mix(vec3(.085, .066, .048)*mix(vec3(1.), vec3(1.3, .9, .6), gold), vec3(.03, .035, .05), rbNight);
 rbMoss = mix(mix(vec3(.13, .23, .03), vec3(.34, .09, .06), .8*rose), vec3(.75, .82, .9), .9*snow)*mix(vec3(1.), vec3(.2, .28, .45), rbNight);
 rbAt = -cos(TAU*uLoop);                   // where a hit falls, to and fro with the loop
 rbHit = (rbKc(4) + .4)*uHits;
}
// Round tree crowns: how high one stands here, and how far up its own round it is.
vec2 rbCrowns(vec2 q) {
 vec2 i = floor(q - .5), f = q - i, best = vec2(.0);
 for (int k = 0; k < 4; k++) {
  vec2 g = vec2(float(k & 1), float(k >> 1)), h = hash22(i + g), d = f - g - .25 - .5*h;
  float r = .5 + .24*fract(h.x*37.), e = dot(d, d)/(r*r), v = 1.1 - 1.1*e + .25*h.y*sat(2. - 2.*e);
  if (v > best.x) best = vec2(v, d.y/r);
 }
 return best;
}
float rbRidge(vec2 p, float f) {
 float dx = p.x - .13 - .03*sin(f*2.4);
 float h = mix(-.50, .03, pow(f/3., .65)) + .39*rbS(2.5, 3., f) + (1.45 - .22*f)*pow(abs(dx), 1.12)*(dx < .0 ? 1. : .86);
 return min(h, .30 + .05*f + .10*sin(dx*5. + f*2.)) + .017*sin(p.x*23. + f*5.);
}
// The gorge behind: four walls of forest from near to far, going to white.
vec3 rbGorge(vec2 p, vec3 sky) {
 vec3 col = vec3(.0); float T = 1., f = .0;
 for (int j = 0; j < 4; j++) if (p.y > rbRidge(p, f) + .66/(10. + 7.*f)) f += f < float(j) + .5 ? 1. : .0;
 for (; f < 3.5 && T > .02; f += 1.) {
  float s = 10. + 7.*f, h = rbRidge(p, f);
  vec2 q = rot(.6 + f)*p*s + f*13.7;
  float w = noise(q*1.9);
  vec2 c = rbCrowns(q + .9*vec2(w, .8 - w));
  float e = (c.x - .25)*.6/s + h - p.y, twig = noise(q*8.), lit = sat(.45 + .62*c.y)*sat(.15 + .95*c.x)*(.25 + 1.5*twig*twig);
  float a = rbS(-.003, .006, e)*rbS(.10, .35, twig + 18.*e);
  float fog = 1. - exp(-rbFog*(.10 + .42*f + .75*rbS(.12, -.45, p.y - h)*(.5 + .2*f)));
  vec3 body = rbLeaf*(.05 + (1.3 + 1.4*uCue)*lit*lit) + rbSun*rbLeaf*.9*lit*rbS(.5, 1.1, c.x + .3*twig);
  col += T*a*mix(body, sky*mix(.94, 1., f/3.), fog); T *= 1. - a;
 }
 return col + T*sky;
}
// The deck of the bridge: how high it hangs at x; it is tied to the trees at 0.62 each side.
float rbSag() { return .155*exp2(uOwn[5] < .0 ? 1.6*uOwn[5] : .75*uOwn[5]); }
float rbDeck(float x) { float u = x/.62; return .085 - .045*u - rbSag()*(1. - u*u); }
// The strand in front: how far in front, where across it, which, how much of the pixel.
float rbTop, rbV, rbId, rbCov, rbSee, rbMist, rbGrain, rbRip;
vec3 rbFeet, rbSky; // the walker's feet and height, and the mist behind
void rbStrand(float d, float r, float z, float id) {
 r = max(r, 1e-4);
 float a = rbIn(abs(d) - r, rbPx), s = (2. + z + 36.*r*sqrt(max(1. - d*d/(r*r), .0)))*a;
 if (s > rbTop) { rbTop = s; rbV = clamp(d/r, -1., 1.); rbId = id; }
 rbCov = max(rbCov, a);
}
// Wet bark with its long cracks, moss along the top; lit is the sound that is there.
vec3 rbSkin(float along, vec3 lit, float wet, float mossy) {
 float n = noise(vec2(along*70. + rbId*11., rbV*2.5 + rbId*5.)), m = noise(vec2(along*19. + rbId*7., rbV + rbId*3.));
 float up = .5 + .5*rbV;
 vec3 c = rbBark*(.05 + (.9 + .5*wet)*up*up)*(.55 + .9*n);
 c = mix(c, rbMoss*(.08 + up*up)*(.5 + .9*n), .9*rbS(.50, .85, up*.8 + .65*m - .35 + mossy));
 c += rbAir*(.03 + .30*wet)*rbS(.66, .90, up)*rbS(.35, .8, n)*sqrt(max(1. - rbV*rbV, .0));
 return c + lit*(.2 + .8*up)*(.3 + .9*n);
}
// The one who walks, feet at 0 and as tall as 1, under an umbrella.
vec4 rbWalker(vec2 w, float px) {
 float st = .07*sin(uTime*2.2)*rbS(.45, .0, w.y), legs = max(min(abs(w.x - st), abs(w.x + st)) - .045, abs(w.y - .15) - .18);
 float body = max(abs(w.x) - .09 - .07*rbS(.85, .25, w.y), abs(w.y - .56) - .30), a = max(rbIn(min(legs, body), px), rbIn(length(w - vec2(.0, .95)) - .095, px));
 vec2 u = rot(.12)*(w - vec2(.03, 1.02));
 float arc = rbIn(max(length(u*vec2(1., 1.35)) - .46, -u.y - .03*sin(u.x*27.)), px);
 vec3 red = mix(vec3(.62, .045, .03), rbKc(3)*.9, .4)*mix(1., .45, rbNight);
 float rib = abs(fract(u.x*3.2/(.3 + sqrt(max(.25 - u.x*u.x, .0)))) - .5);
 return vec4(mix(vec3(.02, .024, .032), red*(.55 + 1.1*rbS(-.1, .4, u.y) + 1.4*uPhrase + .8*uMic)*(.85 + .25*rbS(.0, .2, rib)), arc), max(a, arc));
}
vec3 rbRain(vec2 p) {
 float l = .0;
 for (int i = 0; i < 2; i++) {
  float f = float(i), gx = (p.x + .05*p.y)*(70. - 26.*f), c = floor(gx), h = hash21(vec2(c, f + 2.));
  float y = fract(p.y*(1.2 - .4*f) + fract(uTime*(.55 + .3*h)) + h*9.);
  l += (.03 + .18*uTexture)*rbIn(abs(fract(gx) - .5) - .05, .10)*rbS(.0, .10, y)*rbS(.14 + .1*h, .10, y)*step(.35, h);
 }
 return rbAir*l;
}
float rbZoom() { return 1. - (uOwn[3] < .0 ? .35 : .42)*uOwn[3]; }
vec2 rbStand(vec2 p) { return vec2(.10, -.02) + (p - vec2(.10, -.02))*rbZoom(); }
vec3 rbAcross(vec2 p) {
 float hw = min(.5*uRes.x/uRes.y, .89);
 vec2 pp = p;
 p = rbStand(p); rbPx *= rbZoom();
 // the light of the mist, the sun of a cue
 float glow = exp(-length((p - vec2(.20, .22))*vec2(1.15, .8))*3.2), roll = rbMist, an = (p.x - .30)/max(.75 - p.y, .05);
 vec3 shaft = rbSun*uCue*(.15 + rbS(-.3, 1.2, rbW(an*17. + uTime*.05) + .6*rbW(an*41. - uTime*.07)))*exp(-abs(an + .30)*2.2)*rbS(-.55, .45, p.y)*.8;
 vec3 sky = rbAir*(.25 + (.85 + .25*uTone)*glow + .24*roll) + rbSun*glow*glow*.35 + shaft*.5, col = sky;
 if (p.y > -.21) col = rbGorge(p, sky);
 // the thin fall, far off
 float fx = p.x - .215 - .006*sin(p.y*40.), fw = .0035 + .010*rbS(.24, .0, p.y);
 if (abs(fx) < .04 && p.y > -.12) col = mix(col, rbAir*1.15 + .1, .8*rbG(fx/fw)*rbS(.185, .16, p.y)*rbS(-.12, .05, p.y)*(.8 + .2*rbW(p.y*90. + uTime*4. + 5.*rbW(p.x*300.))));
 // the pools below, and the rocks in them, black and wet
 float n = rbGrain, n2 = noise(rot(-.3)*p*vec2(70., 130.));
 float hor = -.185, far = max(hor - p.y, .0), xHit = .10 + .30*rbAt, grow = 1. - uHits;
 if (p.y < -.12) {
  float rip = rbRip - .5, mir = p.x - .14 + rip*.10*(.4 + far*3.);
  vec3 pool = mix(rbAir*vec3(.36, .60, .72)*(.75 + .5*roll), rbLeaf*.35 + rbAir*vec3(.012, .045, .055), rbS(.04, .26, abs(mir) - .25*far));
  pool += rbAir*.22*rbS(.24, .42, rip) + shaft*.4;
  float rr = length((p - vec2(xHit, -.35))*vec2(1., 2.7));
  pool += rbHit*(rbG((rr - .015 - .22*grow)*45.) + .6*rbG((rr - .01 - .13*grow)*70.) + .45*rbG(rr*4.5));
  col = mix(col, mix(pool, sky, .75*exp(-far*12./rbFog)), rbS(.01, -.01, p.y - hor - .01*roll));
  float ra = .0, rk = .0, rt = .0;
  for (int i = 0; i < 12; i++) {
   float f = float(i), h = rbH(f*1.7 + 12.), h2 = rbH(f*3.1 + 17.), k = f/11., r = mix(.024, .145, k*k*.6 + k*.4)*(.6 + .7*h);
   vec2 d = (p - vec2(.12 + (1. - 2.*float(i & 1))*(.03 + (.06 + .50*k)*(.2 + 1.3*h2)), mix(-.205, -.52, k)))/vec2(r*(1.4 + h2), r);
   float a = rbIn(length(d) + .3*(n - .5) - 1., .012 + rbPx/r)*rbS(-.32, -.26, d.y + .15*d.x*d.x);
   if (a > .5 || a > ra) { rk = k; rt = sat(d.y*1.1 + .10 + .6*(n - .5)); }
   ra = max(ra, a);
  }
  vec3 stone = vec3(.012, .017, .018) + rbAir*(.10*rt*rt*(.4 + n2) + .22*rbS(.62, .78, rt + .2*n2));
  stone = mix(stone, rbMoss*rt*(.4 + .8*n2), rbS(.5, .9, rt + .4*n2 - .1)*.6);
  col = mix(col, mix(stone, sky, (1. - rk)*(1. - rk)*.5*sat(rbFog)), ra);
 }
 col = mix(col, sky, sat(rbFog*.5*roll*rbG((p.y + .17)*8.)));
 // the tree at each end on its boulder, roots let down over it
 float side = p.x < .0 ? -1. : 1., k = p.x < .0 ? 1. : .72, dim = (p.x < .0 ? .02 : .14)*sat(rbFog), f, h, r;
 vec2 q = vec2(abs(p.x) - (p.x < .0 ? .60 : .62), p.y - (p.x < .0 ? .115 : .05))/k;     // q.x grows outward from the end of the bridge
 float big = q.x - .02 + .26*rbS(.0, -.6, q.y) + .05*sin(q.y*11. + side) + .075*(n - .5);
 vec3 rock = vec3(.008, .012, .011)*(.4 + n + n2) + rbAir*(.09*rbS(.05, .0, big)*(.2 + n2) + .05*rbS(.05, .0, abs(n - .5))*n2) + rbMoss*.35*rbS(.40, .85, n + .35*n2 - .15)*(.2 + n2*n2);
 col = mix(col, mix(rock, sky, dim), rbS(-.004, .004, big)*rbS(.03, .0, q.y - .05*sin(q.x*9.)));
 rbTop = rbV = rbId = rbCov = .0;
 float low = rbS(.22, -.5, q.y), mv = low*low*(3. - 2.*low)*.6 + .4*low, base = mix(.026, .007, sqrt(low))*exp2(.9*rbOld);
 for (int i = 0; i < 9 && q.x > -.30; i++) {
  f = float(i); h = rbH(f*2.3 + side*5. + 30.);
  float cx = mix(.12 + .021*f + .02*rbW(q.y*9. + f*2.), -.05 + .066*f + .06*(h - .5) + .028*rbW(q.y*(11. + 5.*h) + f*2.3), mv);
  rbStrand((cx - q.x)*.95, base*(.6 + .8*h)*(.85 + .3*rbW(q.y*17. + f*4.)), 1.5*rbW(q.y*5. + f*1.9) + h, f + 20. + 10.*side);
 }
 // the bridge: the piece wets and lights it, a hit runs along it
 float u = p.x/.62, au = abs(u), y0 = rbDeck(p.x), dy = p.y - y0, slope = (rbSag()*2.*u - .045)/.62, e = rbS(.66, 1.12, au);
 rbFeet = vec3(.13 + .20*sin(uTime*.021), .0, .056); rbFeet.y = rbDeck(rbFeet.x) + .013;
 vec4 mp = .8*(piece(vec2(.5 + .5*u, .3)) + piece(vec2(.5 + .5*u, .72)));
 float wet = sat(mp.a), run = rbG((abs(p.x - xHit) - .30*grow)*13.), thick = (1. + .1*wet)*exp2(1.2*rbOld), hz = mix(.02, .08, sat(.5 + .5*u))*sat(rbFog), fade = rbS(1.28, 1.14, au), edge = fade*step(.0, 1.28 - au);
 vec3 lit = mp.rgb*mp.rgb*(.2 + .9*uEnergy)/(.35 + mp.a) + rbHit*run;
 // the young one above, and the hairs it lets down to the lower one
 float yu = .115 + .09*u*u;
 for (int i = 0; i < 4 && au < 1.2 && abs(dy - yu) < .03 + .06*e; i++) {
  f = float(i); float ph = f*1.57 + p.x*31. + rbW(p.x*9. + f*2.);
  rbStrand(dy - yu - .0055*(1. + 3.*e)*rbW(ph) - (f - 1.5)*.03*e*e, .0026*(.7 + .5*rbH(f + 1.))*(1. + .4*rbW(p.x*23. + f*5.))*thick*edge, 10. + rbW(ph + 1.57), f + 40.);
 }
 float hc = p.x/.023, hh = rbH(floor(hc) + 99.), ht = (yu - dy)/((.02 + .14*hh*hh)*(.8 + .4*rbOld));
 float fine = rbIn(abs(fract(hc) - .5 - .5*(hh - .5) - .1*sin(p.y*40. + hh*40.))*.023 - .0009, rbPx)*step(.0, ht)*rbS(1., .5, ht)*step(au, 1.)*.6;
 col = mix(col, mix(rbBark*.5, sky, .35*sat(rbFog)), fine);
 // the deck, the near rail, and the roots tied up to it
 float was = rbCov; rbCov = .0;
 for (int i = 0; i < 7 && au < 1.28 && abs(dy) < .05 + .16*e; i++) {
  f = float(i); h = rbH(f + 1.3);
  float s6 = p.x*6. + f*1.7, ph = f*.898 + p.x*15. + 1.1*rbW(s6), R = .0135*(1. + .35*rbW(p.x*8. + f))*(1. + 2.4*e)*(.75 + .25*thick), cp = rbW(ph + 1.5708);
  r = .0078*(.6 + .75*h)*(1.05 + .2*rbW(p.x*29. + f*2.6) + .15*rbW(p.x*67. + f*4.1))*thick*mix(1., .75, e)*(1.1 - .25*u)*edge;
  float so = slope + R*cp*(15. + 6.6*rbW(s6 + 1.5708));
  rbStrand((dy - R*rbW(ph) - (f - 3.)*.045*e*e)/sqrt(1. + so*so), r, 20. + cp, f);
 }
 for (int i = 0; i < 2 && au < 1.28; i++) {
  f = float(i); float ph = f*3.14 + p.x*48. + rbW(p.x*11.);
  rbStrand((dy - .043 - .004*rbW(p.x*21.) - .02*e - .0035*rbW(ph) - f*.06*e*e)/sqrt(1. + slope*slope), .0027*(1. + .35*rbW(p.x*29. + f*3.))*thick*edge, 21.4 + rbW(ph + 1.57), 8. + f);
 }
 float tt = sat(dy/.045), c0 = floor(p.x/.027);
 for (int i = -1; i < 2 && dy > -.005 && dy < .05 && au < 1.02; i++) {
  float c = c0 + float(i); h = rbH(c + 105.);
  rbStrand(p.x - (c + .5 + .5*(h - .5) + (rbH(c + 177.) - .5)*1.7*tt + .25*rbW(tt*5. + c))*.027, .0014*(.6 + h)*thick, 21.1, 12. + h*7.);
 }
 rbSee = 1. - rbCov; rbCov = max(rbCov, was);
 bool isTree = rbTop < 8. && abs(rbId - 24.5) < 15., young = rbId > 39.5;
 vec3 bark = rbSkin(isTree ? q.y : p.x, isTree ? vec3(.0) : lit, isTree ? .2 : wet, isTree ? .04 : young ? -.1 : .06);
 col = mix(col, mix(bark, sky, isTree ? dim : young ? hz + .25*sat(rbFog) : hz), rbCov*rbS(-.62, -.5, p.y*1.2));
 // hair roots, sixteen tufts that the spectrum sways, and their drops
 float down = -dy, hair = .0, shine = .0, tc = (u*.5 + .5)*16., ti = clamp(floor(tc), .0, 15.), b = uBands[int(ti)], th = rbH(ti + 4.);
 for (int i = 0; i < 2 && down > .0 && down < .2 && au < 1.; i++) {
  float g = i == 0 ? .0052 : .0083, hx = p.x/g + .35*sin(down*60. + float(i)); h = hash21(vec2(floor(hx), float(i)));
  float len = .012 + (.02 + .08*h*h)*(.5 + .5*rbW(p.x*61. + 2.*rbW(p.x*23.)))*exp2(1.1*rbOld);
  hair = max(hair, rbIn(abs(fract(hx) - .5)*g - .0007, rbPx)*rbS(len, len*.6, down)*.75);
 }
 float len = (.055 + .10*th)*(1. + .1*b)*exp2(1.1*rbOld), x0 = ((ti + .5 + .35*(th - .5))/8. - 1.)*.62, t = down/len;
 float sway = (.0025 + .012*b)*sin(uTime*(.7 + .4*th) + ti*2.1)*t*t, hot = rbG((x0 - xHit)*14.);
 for (int i = 0; i < 7 && t > .0 && t < 1.1 && au < 1.; i++) {
  f = float(i); h = rbH(f*5. + ti + 1.);
  float x = x0 + (f - 3.)*.0032*(1. - .45*t) + sway*(.7 + .6*h) + .0022*sin(down*45. + f*2.), end = .5 + .5*h;
  hair = max(hair, rbIn(abs(p.x - x) - .0011*(1.2 - t), rbPx)*rbS(end, end - .15, t));
  shine += rbIn(length(vec2(p.x - x, (down - end*len)*.75)) - .0017, rbPx)*(.35 + .5*b + 4.*uKeys*rbS(.3, 1., sin(uTime*1.7 + f*2. + ti*3.)));
 }
 col = mix(col, mix(rbBark*(.5 + 1.2*wet) + lit*.6 + rbHit*hot*.8, sky, hz + .06), hair*rbS(1., .94, au));
 col += rbAir*shine*rbS(1., .94, au)*(1. + 4.*uHits*hot);
 float ft = fract(uTime*(.09 + .05*th) + th*7.), fy = y0 - .10 - .9*ft*ft;
 col += rbAir*(.25 + .6*uTexture)*rbIn(abs(p.x - x0 - .003) - .0009, rbPx)*rbS(.012, .0, abs(p.y - fy))*step(au, 1.)*rbS(-.45, -.3, fy);
 fy = mix(rbDeck(xHit) - .10, -.35, grow*grow);
 col += (rbHit + .6*uHits)*rbIn(abs(p.x - xHit) - .0022, .0015)*rbS(.020, .0, abs(p.y - fy))*1.5;
 col += shaft*.35;
 rbSky = sky;
 // leaves the size of plates across the near upper corner
 vec2 w = vec2(hw, .5) - pp;
 for (int i = 0; i < 7 && w.x < .60 && w.y < .38; i++) {
  float f = float(i), h = rbH(f + 5.), h2 = rbH(f + 41.), L = mix(.14, .31, h);
  vec2 d = rot(-2.5 + 1.25*h2 + .02*sin(uTime*(.31 + .2*h) + f*2.))*(-w - vec2(.05 - .085*f - .02*h, .06 - .10*fract(f*.618)));
  d.y += .3*d.x*d.x*(h2 - .5)/L;
  float x = sat(d.x/L), v = abs(d.y), vein = abs(fract((x - v/L*.75)*9.) - .5);
  float wd = d.x < .0 || d.x > 1.1*L ? -.01 : L*(.60*sqrt(x)*pow(1. - x, .85) + .012*rbS(1.15, .9, d.x/L));
  vec3 c = rbLeaf*(.16 + .9*h*h2 + .28*step(.0, d.y))*(.45 + .4*rbS(.0, .3, vein) + .5*rbIn(v - .0035*(1.1 - x), .003) + .3*rbS(.08, .0, vein))*(1. + 1.2*uCue);
  col = mix(col, c, rbIn(v - wd, .004));
 }
 return col;
}
// Walking over: the path bends and sags away from the eye; rbGo is how far it has been walked.
float rbGo, rbSink, rbThin;
vec3 rbBent(vec3 q) { float u = q.z/13.; return vec3(q.x - 1.1*u*u, q.y + rbSink*4.*u*(1. - u), q.z); }
// How far the nearest root or stone is: roots cross along a rounded hall, held by ribs; the floor is plaited.
float rbMap(vec3 q) {
 vec2 e = vec2(q.x/.86, (q.y + .12)/1.22);
 float r = length(e), fl = q.y + 1., d = min(r > .78 ? .5 : .95 - r, max(fl - .1, .0) + (fl > .4 ? .0 : .5)), z = q.z + rbGo, h;
 if (r > .78) {
  float th = atan(e.x, -e.y + 1e-5), up = rbS(1.1, 2.6, abs(th)), c = TAU/30., rr = r - 1.06, wz = rbW(z*.903236), wc = rbW(z*.903236 + 1.5708);
  for (int i = 0; i < 2; i++) {
   float f = float(i), sg = f*2. - 1., a = th + sg*.24*wz + .06*rbW(z*2.317 + sg*2.) + .1*f, k = floor(a/c + .5);
   h = rbH(mod(k, 30.) + 30.*f + 1.);
   float rad = (.014 + .046*h*h)*(1. + .3*rbW(z*3.10242 + k*2.))*mix(1., .2 + .7*step(.6, h), up);
   d = min(d, length(vec2(a - k*c, rr - sg*.06*wc - .08*(h - .5))) - rad*rbThin);
  }
  float zi = floor(z/1.25 + .5), zm = mod(zi, 128.), dz = z - zi*1.25 + .2*rbW(th*1.3 + zm*2.4);
  d = smin(d, length(vec2(rr - .06, dz)) - (.05 - .025*up)*(1. + .3*rbW(th*7. + zm*3.))*rbThin, .045);
 }
 if (fl > .4) return .92*d;
 for (int i = 0; i < 2; i++) {
  float f = float(i), sg = f*2. - 1., w = z*1.29595 + sg*.6, x = q.x + sg*.13*rbW(w) + .08*f, k = floor(x/.16 + .5);
  h = rbH(k + 39. + 20.*f);
  d = smin(d, length(vec2(x - k*.16, fl + .03 - sg*.04*rbW(w + 1.5708) - .03*(h - .5))) - (.030 + .045*h)*rbThin, .04);
 }
 float si = floor(z/.8 + .5);
 h = rbH(mod(si, 200.) + 3.);
 vec2 b = vec2(q.x - .34*(h - .5), z - si*.8); b += .9*(h - .5)*vec2(b.y, -b.x);
 float st = max(length(b*vec2(.9, 1.15)) - .24, abs(b.y)*.8 + abs(b.x)*.5 - .24);
 return .92*min(d, length(max(vec2(st, abs(fl - .05) - .01), .0)) - .025);
}
vec3 rbOver(vec2 p) {
 vec2 vp = vec2(-.10, .07);
 rbGo = mod(uTravel*.10, 160.); rbThin = (1. + .1*uLevel)*exp2(.6*rbOld);
 rbSink = .55*exp2(uOwn[5] < .0 ? 2.5*uOwn[5] : .7*uOwn[5]);
 float lens = .86*exp2(.45*uOwn[3]);
 vec3 ro = vec3(.07 + .015*sin(uTime*.2), .14 + .012*sin(uTime*.31), .0), rd = normalize(vec3(p - vp, lens));
 // the mist outside, and the light where the path comes to the far bank
 float glow = exp(-length((p - vp - vec2(.075, -.06))*vec2(1., .85))*4.2), roll = rbMist;
 vec3 sky = rbAir*(.22 + (.85 + .3*uTone)*glow + .2*roll) + rbSun*glow*glow*(.7 + 1.*uCue), col = sky;
 // through the open middle, then step by step to a root
 float t = .4, d = 1., near = 1., tn = .0, hit = .0;
 for (int i = 0; i < 5; i++) {
  vec3 b = rbBent(ro + rd*t);
  t += max(min(b.y + .88, (.86 - length(vec2(b.x/.86, (b.y + .12)/1.22)))*.86), .0);
 }
 for (int i = 0; i < 16 && t < 11.5; i++) {
  vec3 b = rbBent(ro + rd*t);
  d = rbMap(b);
  if (d < near*t) { near = d/t; tn = t; }
  if (b.y < -1.3 || abs(b.x) > 1.2 || b.y > 1.4) d = 9.;
  if (d < .003*t || d > 8.) break;
  t += d*1.08;
 }
 hit = t < 11.5 ? max(rbS(.0065, .003, near), rbS(.018, .009, d/t)) : rbS(.0065, .003, near);
 if (hit > .0) t = tn;
 if (hit < .99) {
  vec2 c = rbCrowns(rot(.6)*p*vec2(11., 15.) + 3. + 2.5*roll);
  float tw = noise(p*90.), lit = sat(.45 + .6*c.y)*sat(.15 + c.x)*(.2 + 1.5*tw*tw);
  float hill = .20 + .5*abs(p.x - vp.x) + .03*sin(p.x*17.) + .03*c.x - p.y, dep = max(vp.y - .12 - p.y, .0);
  col = mix(sky, mix(sky, rbLeaf*(.04 + 1.6*lit), exp(-rbFog*(.35 + 1.4*glow + .6*roll))), rbS(-.004, .01, hill));
  vec3 pool = rbAir*vec3(.30, .54, .66)*(.45 + rbS(.5, .8, rbRip));
  pool = mix(pool, vec3(.01, .016, .016) + rbMoss*.08, rbS(.50, .60, roll));
  col = mix(col, mix(pool, sky, sat(exp(-dep*6./rbFog)*.8 + 2.4*glow - .5)), rbS(.0, .05, dep));
 }
 if (hit > .0) {
  vec3 q = ro + rd*t, b = rbBent(q);
  vec2 h = vec2(.004 + .0015*t, .0);
  vec3 n = normalize(vec3(rbMap(b + h.xyy), rbMap(b + h.yxy), rbMap(b + h.yyx)) - near*t + vec3(.0, 1e-6, .0));
  float z = abs(mod(b.z + rbGo, 160.) - 80.), fl = b.y + 1., across = fl < .2 ? b.x*1.3 : 2.2*atan(b.x, .5 - b.y), g = noise(vec2(across*13., z*2.6)), g2 = mix(.5, noise(vec2(across*48. + 4.*g, z*6.)), 1./(1. + .06*t*t)), far = exp(-rbFog*(.002*t*t + .0010*t*t*t));
  n = normalize(n + (fl < .2 ? .4 : .8)*far*vec3(g2 - .5, .6*(g - .5), .0));
  float ao = sat(fl < .15 ? .55 + 7.*fl : 1. - 6.*(length(vec2(b.x/.86, (b.y + .12)/1.22)) - 1.))*.85 + .15, top = sat(.5 + .5*n.y), end = sat(.1 + .9*n.z);
  vec4 mp = piece(vec2(sat(b.z/13.), sat(.5 - .5*b.y))); float wet = sat(mp.a);
  float stone = rbS(.06, .07, fl)*rbS(.115, .10, fl)*rbS(.75, .6, abs(b.x))*rbS(.6, .9, n.y);
  vec3 base = rbBark*(.12 + 1.8*g*g2);
  base = mix(base, rbMoss*(.1 + .9*g2), rbS(.60, .90, top + .6*g - .3)*.9);
  base = mix(base*mix(1., .3 + 1.3*g2, far), rbAir*.11*(.5 + .7*g), stone);
  vec3 c = base*(rbAir*(.10 + .75*top*top) + rbSun*1.6*end*exp(-abs(b.z - 13.)*.16)*(1. + uCue))*ao;
  float sp = pow(sat(dot(reflect(rd, n), normalize(vec3(.15, .20, 1.)))), 12.)*ao;
  c += (rbAir*.5 + rbSun*(.4 + 1.2*uCue))*sp*(.04 + .22*wet + .5*stone + .12*uTexture)*mix(.1 + 1.4*g2*g2*2., .25 + .5*g, stone);
  // what sounds lights the roots there; a hit runs out from where its drop falls
  c += mp.rgb*mp.rgb*(.10 + .75*uEnergy)*(.1 + .9*top)*(.1 + 1.6*g2*g2)*ao;
  c += rbHit*rbG((length(b - vec3(.2*rbAt, -.95, 2.4)) - 2.2*(1. - uHits))*2.6)*(.1 + .9*top)*(.1 + g2*g2*1.5)*ao*.8;
  col = mix(col, mix(sky, c, far), hit);
 }
 // someone ahead, nearly over
 rbFeet = vec3(vp + (vec2(1.1*.31 + .1*sin(uTime*.05), -.95 - rbSink*.985) - ro.xy)/7.2*lens, 1.05/7.2*lens);
 rbSee = t*rd.z > 6.6 ? .85 : .0; rbSky = sky;
 // sixteen tufts of hair roots hang from overhead, a band in each, a drop at its end
 for (int i = 0; i < 8; i++) {
  float f = float(i), h = rbH(f + 2.), z = mod(f*1.25 - rbGo, 10.) + .9, u = z/13., s = lens/z;
  vec2 x = (p - vp)/s + ro.xy - vec2(1.1*u*u, 1. - .75*h - rbSink*4.*u*(1. - u));
  float sd = x.x < .0 ? .0 : 1., b = uBands[2*i + int(sd)], v = -x.y/((.25 + .3*fract(h*7. + .4*sd))*(1. + .1*b)*exp2(.5*rbOld));
  if (v < -.1 || v > 1.1 || z > t*rd.z) continue;
  x.x = abs(x.x) - .10 - .55*h - .06*sd + (.012 + .06*b)*sin(uTime*(.6 + .4*h) + f*2. + sd)*v*v + .01*sin(x.y*30. + f);
  float px = rbPx/s, on = rbS(.9, 1.6, z)*rbS(10.8, 8., z), l = abs(abs(x.x) - .018*(1. - .6*v)) - .0045*(1.1 - v);
  col = mix(col, mix(rbBark*.5, sky, 1. - exp(-rbFog*.01*z*z)), on*rbIn(l, px)*rbS(-.05, .0, v)*rbS(1., .9, v));
  col += on*rbAir*(.5 + 2.*b + 4.*uKeys*rbS(.0, 1., sin(uTime*1.7 + f*3. + sd)))*rbIn(length(vec2(x.x, (v - 1.)*.4)) - .007, px);
 }
 float g = 1. - uHits;
 vec2 dp = p - vp - (vec2(.2*rbAt, mix(.9, -.95, g*g)) - ro.xy)/2.4*lens;
 col += (rbHit + .6*uHits)*rbIn(abs(dp.x) - .004, .002)*rbS(.05, .0, abs(dp.y))*1.3;
 return col;
}
vec3 render(vec2 p) {
 rbPx = .75/uRes.y;
 rbWorld();
 rbMist = .6*noise(vec2(p.x*2.1 - uTime*.012, p.y*4. + .3*sin(uTime*.03))) + .4*noise(vec2(p.x*5. + uTime*.02, p.y*9.));
 bool a = uVar < .5;
 vec2 at = a ? rbStand(p) : p;
 if (a) rbGrain = noise(rot(.5)*at*vec2(19., 30.) + 4.);
 rbRip = noise(vec2(at.x*13., log(max((a ? -.155 : .0) - at.y, .03))*(a ? 22. : 18.) + 40.*sin(uTime*.00275)));
 vec3 col;
 if (a) col = rbAcross(p); else col = rbOver(p);
 // the walker and the rain
 vec2 w = (at - rbFeet.xy)/rbFeet.z;
 vec4 one = vec4(.0);
 if (dot(w, w) < 3.) one = rbWalker(w, rbPx/rbFeet.z);
 col = mix(col, mix(one.rgb, rbSky, .12*uVar), one.a*rbSee);
 col += ((rbKc(3) + rbSun)*.16*uPhrase + vec3(.5, .3, .1)*uMic)*exp(-dot(w, w)*.3)*(1. - .4*uVar) + rbRain(p);
 return screenOf(col*(1. - .3*dot(p, p)));
}
