// name: Roped pines
// a: Snow garden
// b: Under the ropes
// what: A winter garden across a black pond: old pines, each inside a cone of straw ropes that run down taut from the tip of a tall pole, snow on every bough, all of it upside down in the water; or under the biggest of them, looking up the trunk, ropes out like rays with snow along them, dark plates of needles against a pale sun.
// follows: A rope shivers and takes colour where the piece sounds: round the cone is the loop, down the rope is the room. The drone brightens the day, the pad warms the sun, texture is the snowfall, a phrase brings a bird by, sixteen ropes shine with the bands, low ripples the pond. A hit drops a load of snow, a cue lights the ropes gold, keys glint on them.
// own: 0 moonlit blue night with the ropes lit from below at -1, an orange dusk at 1; 1 late autumn, no snow, red leaves falling, at -1, deep snow and the pond frozen white at 1; 2 the garden from farther off, or the tip of the pole high in the corner, at -1, very near at 1; 3 tall narrow cones, or plates drawn in, at -1, wide low ones, or far apart, at 1; 4 thick mist at -1, a clear blue day at 1; 5 driven slanting snow at -1, big slow flakes at 1; 6 bare boughs and twigs at -1, in full bloom in the pad's colour at 1; 7 the ropes closed with cloth panels in the sounds' colours at -1, at 1 hung with small lamps in the sounds' colours
#define rpS smoothstep
float rpEdge, rpUnder, rpRing, rpSc, rpRoom, rpOff, rpClose, rpWet, rpIce, rpPx, rpW, rpSnow, rpNight, rpEve, rpFog, rpBlue;
vec3 rpAmb, rpHaze, rpTop, rpSun, rpWhite;
vec2 rpSunAt, rpWv, rpMv, rpBough;
const vec3 rpGold = vec3(1., .7, .32);
const float rpTall = 1.02, rpWide = 1.117; // a cone's height, and its half width for its depth
#define rpBloom max(uOwn[6], 0.)
#define rpBare max(-uOwn[6], 0.)
#define rpCloth max(-uOwn[7], 0.)
#define rpHung max(uOwn[7], 0.)
#define rpChime (uHits*(max(uOwn[1], 0.) + rpBloom))
float rpLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float rpH(float n) { n = fract(n*.1031); n *= n + 33.33; return fract(n*(n + n)); }
float rpN(float x) { float i = floor(x), f = x - i; return mix(rpH(i), rpH(i + 1.), f*f*(3. - 2.*f)); }
vec3 rpDim(float k) { return mix(vec3(1.), rpAmb, k); }
float rpSq(float x) { return x*x; }
float rpIn(float d, float px) { return sat(d/px + .5); }
// How much of a pixel a thin stroke of half width w covers, d from its middle.
float rpLine(float d, float w, float px) { float v = max(w, .55*px); return sat((v - abs(d))/px + .5)*min(1., w/v); }
vec3 rpHour(vec3 grey, vec3 blue, vec3 eve, vec3 night) { return mix(mix(mix(grey, blue, rpBlue), eve, rpEve), night, rpNight); }
// The hour, the season and the air, for both pictures.
void rpLight() {
 rpPx = 1./uRes.y;
 rpW = clamp(.5*uRes.x/uRes.y, .28, 1.)/.889;
 rpNight = sat(-uOwn[0]); rpEve = sat(uOwn[0]);
 rpSnow = sat(.5 + .12*uDrone + (uOwn[1]<0.?.62:.42)*uOwn[1]);
 rpIce = rpS(.1, .9, uOwn[1]); rpWet = 0.;
 rpRoom = rpS(.31, 1., rpW); rpOff = sat(-uOwn[2]); rpClose = sat(uOwn[2]);
 rpFog = sat(-uOwn[4]); rpBlue = sat(uOwn[4]);
 float day = .93 + .07*uDrone + .1*(uTone - .5);
 rpAmb = rpHour(vec3(.97, .985, 1.), vec3(1.03, 1.02, 1.03), vec3(1.02, .84, .74), vec3(.19, .25, .4))*day;
 rpHaze = rpHour(vec3(.83, .835, .83), vec3(.83, .89, .93), vec3(.93, .7, .5), vec3(.12, .17, .28))*day;
 rpTop = rpHour(vec3(.66, .685, .71), vec3(.34, .55, .78), vec3(.58, .48, .6), vec3(.03, .05, .11))*day;
 rpSun = rpHour(vec3(1., .93, .76), vec3(1., .93, .76), vec3(1., .72, .4), vec3(.8, .87, 1.));
 rpWhite = vec3(.985, .985, .975)*rpAmb;
}
// The sky with its cloud and the sun, or the moon, behind it.
vec3 rpSky(vec2 p, float low) {
 vec3 c = mix(rpHaze, rpTop, rpS(0., 1., low));
 vec2 q = vec2(p.x*1.4 + uTime*.006 + uTravel*.006, p.y*3.4 + .4*p.x);
 float n = .62*noise(q) + .38*noise(q*2.3 + 5.);
 c *= 1. + (.16 - .06*rpFog)*(n - .5)*(1. - .5*rpBlue);
 vec2 s = p - rpSunAt;
 float r = length(s), warm = .45 + .35*uPad + .35*uCue;
 vec3 tint = mix(rpSun, uKind[1], .18*uPad);
 c = mix(c, tint, sat(exp(-r*r*7.)*warm*.75*(.8 + .5*n))*(1. - .45*rpNight));
 float disc = 1. - rpS(.022, .034 + .026*(1. - max(rpBlue, rpNight)), r + .03*(n - .5)*(1. - rpBlue));
 return mix(c, mix(vec3(1., .975, .89), rpSun, .35), disc*(.2 + .5*n*n + .2*uPad + .3*uCue + .45*rpNight + .2*rpBlue)*(1. - .6*rpFog));
}
// Tufts of needles, one to a cell, within an ellipse of half axes env. x is the cover, y the tuft's shade.
vec2 rpTuft(vec2 q, vec2 env, float px) {
 vec2 id0 = floor(q - .5), got = vec2(0.);
 for (int j = 0; j<4; j++) {
  vec2 id = id0 + vec2(j & 1, j >> 1);
  float h = hash21(id + 3.7), h2 = fract(h*91.7);
  vec2 c = id + .5 + .5*(vec2(h, h2) - .5), d = q - c;
  float there = 1. - length(c/env) + .3*(h2 - .5);
  float r = length(d), a = atan(d.y, d.x + 1e-5)/TAU + h; a = (a + .025*sin(TAU*(a*3. + h2*9.)) + .13*r*(h2 - .5))*19.;
  float s = abs(fract(a) - .5)/19.*TAU*r;
  float cov = rpLine(s, .05*(1. - .8*r), px)*rpIn((.4 + .5*fract(h*37. + floor(a)*.37))*sat(.6 + 5.*there) - r, px)*step(0., there);
  if (cov>got.x) got = vec2(cov, h2);
 }
 return got;
}
vec3 rpPetal() { return mix(vec3(.96, .74, .78), uKind[1], .75)*rpAmb; }
// Twigs, a fan of them from below.
float rpTwig(vec2 g, float seed, float px) {
 float got = 0.;
 for (int k = 0; k<2; k++) {
  vec2 q = g - vec2(k<1?-.3:.25, k<1?-.4:-.5);
  float r = length(q), a = atan(q.x, q.y + 1e-5) + .16*sin(r*5. + seed*9. + float(k)*3.), n = 2.4, id = round(a*n), h = rpH(id + seed*57. + float(k)*31. + 60.);
  a = abs(abs(a - (id + .3*(h - .5))/n) - .36*max(r - .2 - .2*h, 0.)) - .22*max(r - .6, 0.);
  got = max(got, rpLine(a*r, .034*(1. - .8*r), px)*step(r, .6 + .45*h)*step(abs(id), 4.));
 }
 return got;
}
// A bird in its own measure, wings about one across.
float rpBird(vec2 q, float px) {
 float ax = abs(q.x), f = .5*sin(uTime*4.6) + .15;
 float c = rpIn(.055*sqrt(sat(1. - ax/.5)) - abs(q.y - f*ax + (.6 + .8*f)*ax*ax), px)*step(ax, .5);
 return max(c, rpIn(.07 - length(q*vec2(1.6, 1.)), px));
}
// The colour of a rope where the piece sounds, and how much it sounds there.
vec3 rpStraw(vec4 m, float bd) {
 vec3 c = mix(vec3(.56, .43, .26), vec3(.8, .64, .38), sat(bd*(.4 + .5*uEnergy)));
 vec3 k = m.a>.004?m.rgb/m.a:c;
 c = mix(c, mix(c, k, .45), sat(m.a*(.7 + .5*uEnergy)));
 return (c + .3*rpWet)*rpDim(.8);
}
// ---- a: the garden ----
// The ropes of a cone, its far side and ours, and the knots' glint. v is from the tip of the pole.
void rpCone(vec2 v, float seed, float px, out vec4 back, out vec4 front, out float glint, out vec4 lamp) {
 float down = max(-v.y, 1e-3), c = clamp(v.x/(down*rpWide), -.9999, .9999), ph = acos(c)/PI, in_ = step(abs(v.x), 1.02*rpWide*down)*step(v.y, -.004);
 // our side
 float k = floor(ph*16.), h = hash21(vec2(k, seed)), h2 = fract(h*57.3), ck = cos((k + .5 + .5*(h - .5))*PI/16.), uk = ck*rpWide, at = abs(ck);
 float end = (h2<.56 || at>.88?.26:h2<.8 || at>.66?.43:.57) + .01*at - .02*h, len = rpTall - end, t = down/len;
 vec4 m = piece(vec2((k + .5)/16., .12 + .8*sat(t)));
 float bd = uBands[int(clamp(k, 0., 15.))], sh = sin(PI*min(t, 1.))*m.a*(.4 + .8*uEnergy);
 float d = (v.x - uk*down)*inversesqrt(1. + uk*uk) + sh*.005*sin(t*19. + h*40.)*sin(uTime*5.3 + h*30.);
 vec2 kn = vec2(d, (1. - t)*len);
 front = vec4(rpStraw(m, bd), in_*max(rpLine(d, .0026*(1. + .5*bd*uEnergy) + .0016*sh, px)*(1. - .3*sh)*rpIn(1. - t, px/len), rpIn(.0068 - length(kn*vec2(1., .7)), px)));
 glint = in_*exp(-dot(kn, kn)*5000.)*sat(uKeys*1.6 - 1.2*h2);
 lamp = vec4(0.);
 if (rpCloth>0.) {
  // the panel of cloth here
  int ki = int(5.*rpH(k + seed*13. + 2.)*.999);
  float f = fract(ph*16.) - .5, hem = rpTall - .13 + .02*f*f*4. + .05*rpN(v.x*3. + seed*5. + 20.);
  vec3 kc = mix(vec3(.72, .58, .38), uKind[ki], .8), lit = rpAmb*(.62 + .5*sat(-.6*c + .55))*(.8 + .2*cos(f*PI)) + rpGold*rpNight*(.75*exp(-rpSq(down - .75)*5.))*(.7 + .6*rpLv(ki));
  lamp = vec4(kc*lit*(1. + .5*m.a) + rpGold*.2*uCue, in_*rpCloth*rpIn(hem - down, px)*(1. - rpS(.985, 1., abs(v.x)/(rpWide*down)))*(.96 - .22*rpNight));
 }
 if (rpHung>0.) {
  float jn = fract(t*5. + h2*.5) - .5, jd = floor(t*5. + h2*.5), room = down*rpWide*sqrt(max(1. - ck*ck, 0.))*.08, rad = min(.024, room);
  int ki = int(4.99*rpH(k*3. + jd*7. + seed*5.));
  vec2 g = vec2(d, jn*len/5. + .012);
  float l = length(g*vec2(1., .8)), there = in_*rpHung*step(.3, t)*step(t, .97)*rpS(.006, .012, rad), lv = min(.55 + .5*m.a + .5*rpLv(ki) + .5*uCue, 1.35);
  vec3 kc = mix(vec3(1., .8, .5), uKind[ki], .7);
  lamp = vec4(kc*(.55 + .25*(1. - rpNight)*rpAmb + (.35 + .45*rpNight)*lv*(1. - .6*sat(l/max(rad, 1e-3)))), there*max(rpIn(rad - l, px), (.18 + .4*rpNight)*lv*.5*sat(1. - l/(rad*2.2 + 1e-4))));
 }
 // the far side
 k = floor(ph*13.); h = hash21(vec2(k, seed + 40.)); uk = rpWide*cos((k + .5 + .5*(h - .5))*PI/13.);
 d = (v.x - uk*down)*inversesqrt(1. + uk*uk);
 back = vec4((vec3(.56, .43, .26) + .3*rpWet)*rpDim(.8), in_*rpLine(d, .0019, px)*rpIn(.97 - down/(rpTall - .28), px)*.75);
}
// A tree's plates of needles, back ones first: across, up, half width, thickness for its width.
vec4 rpPlate(float i, float seed, out float h) {
 float j = floor(i*.5), sd = mod(i, 2.)*2. - 1., n = j - 4.;
 h = rpH(i*7.1 + seed*31.7 + 3.);
 vec4 a = n<-.5?vec4(sd*(.14 + .155*j), .695 - .137*j, .165 + .014*j, .33 - .02*j):vec4(sd*(.17 + .13*n), .365 - .15*n, .23, .27);
 float h2 = fract(h*73.1);
 return a + vec4(.1*(h - .5), .07*(h2 - .5) + .004*sin(uTime*.5 + h*20.)*(.3 + uLow), .04*(h2 - .4), 0.);
}
// How far off what is drawn is, and laying it.
float rpMist;
void rpLay(inout vec3 col, vec3 c, float a) { col = mix(col, mix(c, rpHaze, rpMist), a); }
// One pine under its ropes. q is from its foot in its own measure.
vec3 rpTree(vec3 col, vec2 q, float seed, float px, float near) {
 vec2 v = q - vec2(.02, rpTall), lq = q - vec2(0., .2);
 float lamp = exp(-dot(lq, lq)*3.), y = q.y, glint;
 vec4 back, front, hung;
 rpCone(v, seed, px, back, front, glint, hung);
 // the air and the light inside the cone, the ropes on its far side
 float inside = (1. - rpS(.92, 1., abs(v.x)/(max(-v.y, 1e-3)*rpWide)))*rpS(.1, .3, y)*step(v.y, 0.), glow = rpNight*(.3 + .7*lamp);
 col = mix(col, rpHaze*1.08, (.12 + .22*rpWet)*inside*(1. - rpNight));
 col += rpGold*inside*(.17*uCue + .2*rpChime + rpNight*.5*lamp)*(1. - .6*rpMist);
 rpLay(col, mix(back.rgb, rpGold, sat(.6*uCue + glow))*.95, back.a);
 // the pole, the straw tied at its tip, the trunk
 float pole = rpLine(v.x, .0062, px)*rpIn(.012 - v.y, px)*step(0., y);
 float tie = rpIn(min(.016 + .2*max(-v.y - .004, 0.) + .6*max(v.y, 0.) - abs(v.x), .034 - abs(v.y)), px);
 rpLay(col, vec3(.3, .235, .18)*rpAmb, pole);
 rpLay(col, vec3(.62, .47, .27)*rpAmb, tie);
 float tw = .034*(1. - y) + .008 + .02*exp(-max(y, 0.)*18.), bend = .075*sin(y*7.6 + seed)*rpS(0., .2, y);
 float bn = rpN(y*90. + q.x*60. + 80.), cover = rpIn(min(tw - abs(q.x - bend), .7 - y), px)*rpS(-.02, .005, y);
 vec3 bark = vec3(.15, .125, .115)*(.7 + .6*bn)*rpAmb;
 vec3 tc = mix(bark, rpWhite*.86, rpS(.25, .75, (bend - q.x)/tw + .5*(rpN(y*22. + 9.) - .5))*step(bend - q.x, 1.3*tw)*sat(rpSnow*1.5)*.85);
 // each plate's limb, and the two plates over this place
 float first = -1., second = -1., snowOn = 0.;
 for (int i = 0; i<12; i++) {
  float fi = float(i), h;
  vec4 a = rpPlate(fi, seed, h);
  vec2 la = vec2(a.x>0.?.02:-.02, max(a.y - .1, .06)), ab = vec2(a.x*.85, a.y - .02) - la, lp = q - la, g = (q - a.xy)/a.z;
  float lt = sat(lp.x/ab.x), b = lt*(1. - lt), ly = lp.y - ab.y*lt - .12*b + .1*(h - .5)*b*(1. - 2.*lt), on = step(0., lp.x*ab.x)*step(lp.x/ab.x, 1.), lw = .015*(1. - .6*lt);
  cover = max(cover, rpIn(lw - abs(ly), px)*on);
  snowOn = max(snowOn, rpIn(.006 - abs(ly - lw - .003), px)*on);
  float room = 1. - g.x*g.x;
  if (room>-.25&&g.y<.08 + a.w*2.3*max(room, 0.)&&g.y>-.15 - a.w*max(room, 0.)) { second = first; first = fi; }
 }
 rpLay(col, tc + rpGold*rpNight*.22*exp(-max(y, 0.)*3.), cover);
 rpLay(col, rpWhite*.9, snowOn*sat(rpSnow*2.));
 // the plates, each with its snow
 for (int n = 0; n<2; n++) {
  float i = n<1?second:first, h;
  vec4 a = rpPlate(max(i, 0.), seed, h);
  vec2 g = (q - a.xy)/a.z;
  float gp = px/a.z, dome = sqrt(max(1. - g.x*g.x, 0.)), T = a.w;
  float ga = g.x + 20. + i*7.3 + seed*3.1, n1 = rpN(ga*3.1), n2 = rpN(ga*8.), n3 = rpN(ga*17.);
  float crown = dome*(T*(.5 + .6*n1) + .04*n2), under = -dome*(T*(.25 + .6*n2) + .03), spike = .12*rpN(ga*46.)*dome;
  float sn = mix(rpSnow, max(rpSnow, .8), rpBloom)*(1. - (i==10.?.75*near*rpS(0., .3, uHits):0.));
  float cap = crown + sn*dome*T*(.65 + .6*n1)*(1.1 + .5*rpIce);
  float hem = crown - sat(sn*2.)*T*dome*(.05 + (.35 + .8*sn)*rpS(.2, .85, n2*.65 + n3*.35));
  float tf = mix(rpTuft(g*8.5 + vec2(i*7., seed*5.), vec2(1e4), gp*8.5).x, .35, rpS(.02, .04, gp));
  float body = rpIn(min(crown + .6*spike - g.y, g.y - under + spike), gp);
  if (rpBare>0.) rpLay(col, mix(bark*1.1, rpWhite*.9, sat(rpSnow*1.6)*.55*rpS(-.1, .1, sin(g.x*23. + i) - .2)), rpTwig(g, i + seed, gp)*rpS(-.34, -.08, g.y - .3*n2*step(.2, abs(g.x)))*step(0., i)*sat(rpBare*2.));
  float up = sat((g.y - under)/max(crown - under, .02)), on = step(0., i)*(1. - rpS(.4, 1., max(rpBare, rpCloth)));
  vec3 needle = mix(vec3(.045, .065, .062), mix(vec3(.16, .215, .17), vec3(.2, .27, .13), sat(-uOwn[1])), tf*(.3 + .7*up))*rpAmb;
  needle = mix(needle, rpPetal()*(.34 + .22*up + .2*tf), rpBloom);
  needle += rpGold*(rpNight*.2*(1. - up)*(.3 + tf) + .13*uCue*tf);
  rpLay(col, needle, body*on);
  // snow, with needle points through it
  float st = sat((g.y - hem)/max(cap - hem, .02)), side = sat(.5 - .5*g.x);
  vec3 sc = mix(vec3(.66, .71, .78), vec3(1., .995, .975), rpS(0., .75, st + .25*(n3 - .5))*(.72 + .28*side))*rpAmb;
  sc = mix(sc, mix(rpPetal()*.8, mix(rpPetal()*1.12, rpWhite, .25 + .5*sat(uOwn[1])), rpS(0., .8, st + .5*(noise(g*19. + i*5.) - .5))), rpBloom);
  sc += rpGold*rpNight*.25*(1. - st);
  sc = mix(sc, needle*1.3, .75*tf*(1. - rpS(.2, .55, st))*rpIn(hem + .1 - g.y, gp*8.));
  rpLay(col, sc, rpIn(min(cap - g.y, g.y - hem), gp)*rpS(0., .02, sn)*on);
 }
 if (rpCloth>0.) rpLay(col, hung.rgb, hung.a);
 // the ropes on our side
 rpLay(col, mix(front.rgb, rpGold, sat(.75*uCue + glow + .9*rpChime)), front.a*(.97 - .3*rpMist));
 if (rpHung>0.) rpLay(col, hung.rgb, hung.a);
 return mix(col, vec3(1., .95, .8), sat(glint*1.3));
}
// The water's edge, nearer to us at the right where the big pine stands.
float rpShore(float x) { x /= rpW; return -.115 - .085*rpS(.08, .62, x) + .008*sin(x*5. + 1.) - .004*sin(x*17.); }
// The ground: snow, or moss and fallen needles.
vec3 rpGround(vec2 p, float shade) {
 vec3 moss = vec3(.3, .3, .16);
 if (rpSnow<.35) moss = mix(mix(moss, vec3(.3, .38, .2), rpBloom), mix(vec3(.55, .27, .1), rpPetal(), rpBloom), noise(p*vec2(9., 40.))*(rpBloom>0.?rpS(.45, .8, noise(rot(.6)*p*vec2(70., 190.)))*rpS(.2, .7, noise(p*vec2(8., 22.) + 4.)):noise(p*70.)));
 return mix(moss, mix(vec3(.76, .8, .86), vec3(.97, .97, .965), shade), rpS(0., .35, rpSnow))*rpAmb;
}
// The garden. In the pond each tree is mirrored about the water at its own foot.
vec3 rpGarden(vec3 col, vec2 b) {
 vec2 p = rpMv;
 float edge = rpEdge, down = rpWet;
 // a far wooded hill, nearly lost
 float hx = p.x + 9., hill = .005 + .05*rpN(hx*2.2) + .02*rpN(hx*9.);
 vec3 wood = mix(vec3(.5, .53, .55), mix(vec3(.6, .28, .14), vec3(.5, .55, .42), rpBloom), sat(-uOwn[1]))*rpAmb*(.85 + .3*noise(p*vec2(40., 30.)));
 col = mix(col, mix(wood, rpHaze, sat(.45 + .4*rpFog - .15*rpBlue + .2*uOwn[1])), (1. - rpS(-.02, .012, b.y - hill))*.85);
 // the bank
 float bank = edge + .045 + .03*rpS(0., .6, p.x/rpW) + (.014 + .02*rpIce)*rpN(p.x*5. + 20.);
 vec3 snow = mix(rpGround(p, sat(.35 + 14.*(p.y - edge) + .4*(rpN(p.x*6. + p.y*40. + 70.) - .5))), rpHaze, .3*(1. - rpS(0., .5, p.x/rpW)));
 col = mix(col, snow, rpIn(bank - p.y, rpPx));
 // one tree to a place: the big one, or the far one that stands here
 float o3 = uOwn[3], high = 1. - (o3<0.?.35:.22)*o3, broad = 1. + (o3<0.?.4:.5)*o3;
 float shift = .32*(1. - rpRoom), x = p.x - shift;
 vec4 far = x<-.865?vec4(-1.1, .2, .5, 5.):x<-.21?vec4(-.535, .34, .16, 3.):vec4(-.07, .14, .36, 4.);
 vec4 big = vec4(.61*rpW, .62*rpSc, 0., 1.);
 vec2 at = vec2(big.x, -.165), q = (p + vec2(0., 2.*down*(rpShore(at.x) - edge)) - at)/big.y;
 float out_ = abs(q.x)/broad - rpWide*(rpTall - max(q.y/high, mix(.25, .08, rpCloth))) - .07, near = step(out_, 0.);
 far.x += shift;
 at = vec2(far.x, -.095 + .07*far.z);
 vec2 qf = (p + vec2(0., 2.*down*(rpShore(at.x) - edge)) - at)/far.y;
 vec4 t = near>.5?big:far;
 broad = near>.5?broad:min(broad, 1.);
 rpMist = near>.5?.18*rpFog:sat(t.z*(.8 + .4*uSpace) + rpFog*(.5 + .3*t.z) - .2*rpBlue*t.z);
 q = (near>.5?q:qf)/vec2(broad, high);
 vec3 tree = rpTree(col, q, t.w, rpPx/t.y, near);
 return mix(col, tree, max(near, rpS(0., .05, out_))*step(-.04, q.y));
}
// What falls, in three depths: snow, or leaves where there is none.
vec3 rpFall(vec3 col, vec2 p) {
 float wind = sat(-uOwn[5]), big = sat(uOwn[5]), leaf = sat(-1.5*uOwn[1]);
 float amt = .1 + .45*uTexture + .55*wind + .12*uLevel + .1*rpIce;
 for (int k = 0; k<3; k++) {
  float fk = float(k), s = (k==0?6.:k==1?12.:21.)*(1. - .35*big);
  vec2 q = vec2(p.x + (.12 + 1.5*wind)*p.y + .02*sin(uTime*.3 + p.y*4. + fk*2.) + fk*3.3, p.y)*s;
  q.y = q.y*(1. - .6*wind) + mod((uTime*.05 + uTravel*.05)*(10. - fk), 64.);
  vec2 id = floor(q), d = q - id - .5; id.y = mod(id.y, 64.);
  float h = hash21(id + fk*17.), h2 = fract(h*57.7);
  d -= .6*(vec2(h2, fract(h*311.)) - .5);
  d = mix(d, rot(h*9. + uTime*.6)*d*vec2(.6, 1.6), leaf*(1. - wind));
  float r = (.03 + .026*h2)*(1. + .9*big + .4*leaf*(1. - wind)), soft = max(rpPx*s*.9, (k==0?.8:.35)*r*(1. - .6*leaf));
  float c = (1. - rpS(r - soft, r + soft, length(d)))*rpS(h*1.02, h*1.02 + .12, amt);
  vec3 f = mix(mix(vec3(.99, .99, .985), uKind[2], .12*uTexture), mix(mix(vec3(.62, .17, .08), vec3(.75, .42, .12), h2), mix(vec3(.96, .74, .78), uKind[1], .75), rpBloom), leaf)*mix(vec3(1.), rpAmb*1.25, max(rpNight, leaf));
  if (rpNight>0.) f = mix(f, max(f, col), rpNight); // a flake before a lamp is no speck
  col = mix(col, f, c*(k==0?.65:.9));
 }
 return mix(col, rpHaze*1.04, .3*wind);
}
// A load of snow let go: a puff that falls by drop as s goes from 0 to 1, and powder left hanging.
float rpLoad(vec2 q, float wide, float drop, float s) {
 q.y += drop*(.3*s + .7*s*s);
 float z = .4 + 4.*wide, n = noise(rot(.6)*q*24./z)*.5 + .5*noise(rot(1.2)*q*60./z + 5.*s);
 float body = exp(-rpSq(q.y/(.02 + .14*wide + .25*drop*s))), tail = rpS(-.02, .02, q.y)*(1. - rpS(0., .03 + drop*s, q.y));
 return sat(exp(-rpSq(q.x/wide)*1.4)*(body + .6*tail)*(.1 + 1.5*rpS(.15, .85, n)));
}
// Where in the garden or its mirror a place looks, and where in the sky.
vec2 rpPlan(vec2 p) {
 float zoom = 1. + .5*rpOff - .42*rpClose, s = 1. - uHits;
 vec2 w = (p - vec2(.33*rpW, .1))*zoom + vec2(.33, .1 - .06*rpOff - .1*rpClose)*vec2(rpW, 1.);
 rpPx *= zoom;
 rpSunAt = vec2(-.2*rpW, .22 - .06*rpEve);
 rpEdge = rpShore(w.x); rpUnder = rpEdge - w.y; rpWet = step(0., rpUnder);
 rpSc = mix(.55, 1., rpRoom);
 rpBough = vec2(.61*rpW - .3*.62*rpSc, -.165 + .24*.62*rpSc);
 // ripples, and the ring of what falls in
 float far = sat(rpUnder/.4), rip = (.0012 + .005*uLow)*(.2 + far), y = rpUnder/(.12 + .5*far);
 float rr = length((w - vec2(rpBough.x, rpShore(rpBough.x) - .1))*vec2(1., 2.8)) - .34*s;
 rpRing = uHits*sin(rr*90.)*exp(-rr*rr*500.)*rpS(0., .2, s);
 rpMv = vec2(w.x, abs(rpUnder) + rpEdge);
 rpMv += rpWet*(rip*vec2(sin(y*60. + uTime*.9) + .6*sin(y*97. - uTime*.7 + w.x*9.), 1.5*sin(y*41. - uTime*.6 + w.x*5.)*sat(rpUnder*40.)) + .011*rpRing);
 rpWv = w;
 return rpMv + vec2(0., 2.*rpWet*(-.11 - rpEdge));
}
vec3 rpA(vec3 col, vec2 b) {
 vec2 w = rpWv;
 col = rpGarden(col, b);
 // the pond is the garden upside down in black water
 vec3 pond = mix(vec3(.03, .04, .045), vec3(.02, .07, .11), rpBlue)*rpDim(.8);
 pond += pow(col, vec3(1.6))*mix(.58, .22, rpS(0., .36, rpUnder))*(.6 + .4*rpS(0., .02, rpUnder)) + .1*rpRing;
 pond = mix(pond, rpHaze, (.3*uMic + .35*rpFog)*exp(-rpSq((rpUnder - .03)/.07)));
 float ice = noise(vec2(w.x*3., w.y*16.));
 pond = mix(pond, vec3(.86, .885, .915)*rpAmb*(.95 + .06*ice), rpS(0., .3, rpIce*1.25 - .05 - .9*ice*(1. - .6*rpIce)));
 col = mix(col, pond, rpIn(rpUnder, rpPx));
 // the near bank, left low
 float nb = -.43 - .35*rpS(-.75, .15, w.x/rpW) + .03*rpIce + .018*rpN(w.x*6. + 30.);
 col = mix(col, rpGround(w, rpS(0., .09, nb - w.y )), rpIn(nb - w.y, rpPx));
 return col;
}

// ---- b: under the biggest pine ----
// The plates overhead: from the tip across and up, and how wide.
vec3 rpOver(int i) {
 vec3 o = i<3?(i<1?vec3(-.28, -.15, .11):i<2?vec3(.32, -.07, .12):vec3(-.13, .33, .14)):i<6?(i<4?vec3(-.8, .26, .2):i<5?vec3(.46, .29, .2):vec3(-.64, -.27, .27))
 :i<7?vec3(.88, .02, .18):i<8?vec3(.27, -.4, .17):vec3(.66, -.36, .28);
 return o*vec3(mix(.45, 1., rpRoom), 1., mix(.6, 1., rpRoom));
}
vec2 rpStem(float s) { return vec2(mix(-.24, -.03, s) + .05*sin(s*5.4 + .5)*(1. - s*.6), mix(-.85, -.05, s)); }
vec3 rpB(vec3 col, vec2 p, vec2 C) {
 float spread = 1. + (uOwn[3]<0.?.13:.3)*uOwn[3], zoom = 1. + .45*rpClose;
 vec2 v = (p - C)/zoom;
 float px = rpPx/zoom, r = length(v), an = atan(v.y, v.x + 1e-6)/TAU;
 // the rope here and how far it runs, the limb here, the plates over it
 float n = 34., k = floor((an + .5)*n), h = hash21(vec2(k, 4.)), a = ((k + .5 + .55*(h - .5))/n - .5)*TAU;
 float cueAt = exp(-rpSq((r - 1.1*(1. - uCue))/.35))*uCue + rpChime*exp(-rpSq((r - .8*(1. - uHits))/.3)), end = 3., best = 9.;
 vec2 d = vec2(cos(a), sin(a)), bent = vec2(0.);
 vec3 arm = vec3(0.);
 int first = -1, second = -1, third = -1;
 for (int i = 0; i<9; i++) {
  vec3 o = rpOver(i);
  float al = dot(o.xy, d), hit = step(0., al)*step(abs(o.x*d.y - o.y*d.x), .7*o.z);
  end = mix(end, fract(h*41.)<.5 || end>2.?al:max(end, al), hit);
  float s0 = .92 - .6*sat(length(o.xy));
  vec2 la = rpStem(s0), ab = o.xy*spread - la, e = v - o.xy*spread;
  float L = length(ab), lt = dot(v - la, ab)/(L*L), b = lt*(1. - lt);
  float lc = ((v.x - la.x)*ab.y - (v.y - la.y)*ab.x)/L + L*b*((o.x>0.?.24:-.24) + 1.1*(.5 - lt)*(lt - .8));
  if (abs(b - .125)<.125&&abs(lc)<best) { best = abs(lc); arm = vec3(lt*L, lc, mix(.13, .035, sqrt(sat(lt)))*o.z); bent = ab/L; }
  if (max(abs(e.x)*.57, abs(e.y)*.75)<o.z) { third = second; second = first; first = i; }
 }
 end *= spread;
 float al = dot(v, d), ac = v.y*d.x - v.x*d.y, t = sat(al/min(end, 1.));
 vec4 m = piece(vec2((k + .5)/n, .1 + .8*t));
 float bd = uBands[int(mod(k, 16.))], sh = sin(PI*t)*m.a*(.4 + .8*uEnergy);
 ac += sh*.0035*sin(al*25. + h*40.)*sin(uTime*5.1 + h*30.);
 al = max(al, 0.);
 if (rpCloth>0.) {
  end = mix(end, 3., rpCloth);
  float id = mod(k + (ac>0.?1.:0.), n), f = rpH(id*3. + 5.);
  int ki = int(4.99*f);
  float bright = dot(col, vec3(.3, .6, .1)), fold = sat(abs(ac)/(.09*al + 1e-3));
  vec3 kc = mix(vec3(.8, .68, .46), uKind[ki], .85);
  col = mix(col, mix(kc, kc*kc, .5)*(.16 + .72*bright*(.75 + .3*fold))*(1. + .35*m.a + .25*rpLv(ki)) + rpNight*rpGold*kc*(.5*exp(-r*1.2) + .25*rpLv(ki)), rpCloth*.94);
 }
 float w = .0011 + .0044*al*(1. + .35*bd*uEnergy), on = step(1e-4, al)*step(al, end), side = d.x >= 0.?1.:-1.;
 float tw = .9 + .16*sin(al*260./(.4 + al) + ac/w*1.9)*rpS(.0015, .003, w);
 vec3 c = rpStraw(m, bd)*tw*(1. - .35*sat(.3 - ac*side/w));
 c = mix(c, rpGold, sat(.85*cueAt + rpNight*.6*rpS(.1, .7, al)));
 float lie = abs(d.x)*sat(rpSnow*1.7), sw = w*(.35 + .5*rpN(al*30. + k*7. + 60.) + .6*rpIce)*lie;
 col = mix(col, rpWhite, rpLine(ac*side - w - sw*.6, sw + 1e-5, px)*rpS(0., .1, lie)*on);
 col = mix(col, mix(c, rpHaze, .2*(1. - sat(al*2.)) + .4*rpFog), rpLine(ac, w + .002*sh, px)*on);
 col = mix(col, vec3(1., .95, .8), exp(-rpSq((al - end*.6)/.03))*on*sat(uKeys*1.5 - .8*h)*(1. - rpS(0., 3.*w, abs(ac))));
 if (rpHung>0.) {
  float js = log(max(al, .02)/.1)/.3 + h*.8, jf = fract(js) - .5, rad = .055*al;
  int ki = int(4.99*rpH(floor(js)*5. + k*7. + 90.));
  float l = length(vec2(ac + .3*rad, jf*.3*al)*vec2(1., .85)), lv = min(.55 + .5*m.a + .5*rpLv(ki) + .5*uCue, 1.35), at = .1*exp(.3*(floor(js) + .5 - h*.8)), lon = rpHung*step(.12, at)*step(at, end);
  vec3 kc = mix(vec3(1., .8, .5), uKind[ki], .7);
  col = mix(col, kc*(.6 + .2*(1. - rpNight) + (.35 + .4*rpNight)*lv*(1. - .6*sat(l/(rad + 1e-4)))), lon*max(rpIn(rad - l, px), (.18 + .4*rpNight)*lv*.5*sat(1. - l/(rad*1.5 + 1e-4))));
 }
 // the pole and the straw tied at its tip
 float ps = sat((v.y + .9)/.9);
 col = mix(col, vec3(.36, .28, .19)*rpAmb, rpLine(v.x - .03*(1. - ps), mix(.016, .0022, sqrt(ps)), px)*step(v.y, 0.));
 col = mix(col, vec3(.5, .38, .22)*rpAmb, rpIn(.012 - r, px));
 // the limbs and the trunk, rising away from us
 vec3 bark = mix(vec3(.12, .1, .09)*rpAmb, rpHaze*.8, .55*rpFog);
 float lw = arm.z + 1e-4, lb = rpN(arm.x*50. + arm.y/lw + 20.), topside = -arm.y*(bent.x>0.?1.:-1.)*abs(bent.x);
 arm.y += lw*.5*sin(arm.x*45.);
 col = mix(col, bark*(.6 + .8*lb), rpIn(lw*(.9 + .2*lb) - abs(arm.y), px)*step(1e-3, arm.z));
 col = mix(col, rpWhite*.93, rpIn(topside - lw*(.4 + .5*lb), px)*rpIn(lw*(1.2 + .5*rpIce) - abs(arm.y), px)*sat(rpSnow*2.)*step(1e-3, arm.z));
 float ts = sat((v.y + .85)/.8), wide = mix(.13, .001, pow(ts, .6)), tr = (v.x - rpStem(ts).x)/wide;
 float plate = noise(vec2(tr*3. + ts*3., ts*ts*30.))*.6 + .4*noise(vec2(tr*7., ts*60.));
 vec3 bk = bark*(.5 + 1.3*rpS(.3, .65, plate))*(.75 + .6*sat(-tr));
 bk = mix(bk, rpWhite, rpS(.1, .25, -tr - .68 + .3*(rpN(ts*22.) - .5) + .25*rpIce)*sat(rpSnow*1.5));
 col = mix(col, bk, rpIn((1. - abs(tr))*wide, px)*step(v.y, -.05));
 // the plates of needles, snow showing over their rims
 for (int j = 0; j<3; j++) {
  int i = j<1?third:j<2?second:first;
  if (i<0) continue;
  vec3 o = rpOver(i);
  float hp = rpH(float(i)*3. + 2.);
  vec2 e = v - o.xy*spread - .004*vec2(sin(uTime*.4 + hp*9.), cos(uTime*.33 + hp*20.))*(.4 + uLow);
  vec2 rad = normalize(vec2(.2*o.x, o.y + (o.y<0.?-.15:.15))), tn = vec2(-rad.y, rad.x), g = vec2(dot(e, tn), dot(e, rad))/o.z, env = vec2(1.2, .68);
  if (rpBare>0.) col = mix(col, bark*1.1, rpTwig(g, float(i), px/o.z)*sat(rpBare*2.));
  float gp = px/o.z, sc = 3.4 + 11.*o.z, gone = i==5?rpS(0., .3, uHits):0.;
  float fine = rpN(g.x*9. + g.y*4. + hp*90. + 40.), wob = .9*noise(rot(.6)*g*2.3 + hp*30.) + .35*noise(rot(1.1)*g*5.6 + hp*70.) - .62, in0 = 1. - length(g/env) + wob - 5.*rpSq(max(abs(g.x) - .95, 0.)) - 8.*rpSq(max(abs(g.y) - .5, 0.));
  float es = in0 - .1 + (.3 + .14*rpIce)*clamp(dot(vec2(tn.y, rad.y), g), -.5, .7) + .08*rpIce - .3*(1. - sat(rpSnow*2.)*(1. - .8*gone));
  vec3 snow = mix(vec3(1., .99, .97), vec3(.17, .2, .21), rpS(.02, .24, es))*rpAmb;
  snow = mix(snow, rpPetal()*1.05, rpBloom);
  snow *= mix(vec3(1.), vec3(1.06, .95, .74), sat(cueAt + .4*uCue));
  col = mix(col, mix(snow, rpHaze, .3*rpFog), rpIn(es, gp*2.)*rpS(0., .15, max(rpSnow, rpBloom))*(1. - rpBare));
  float solid = rpS(0., .14, in0 - .16 - .36*fine);
  vec2 tuft = rpTuft(g*sc + wob, env*sc*1.1, gp*sc);
  vec3 green = mix(mix(vec3(.13, .18, .13), vec3(.25, .29, .11), sat(-uOwn[1])), vec3(.27, .27, .15), .5*exp(-dot(p - rpSunAt, p - rpSunAt)*5.));
  vec3 needle = mix(vec3(.04, .056, .05), green*(.4 + .85*tuft.y), tuft.x*(1. - .3*solid))*rpAmb + rpGold*(.2*uCue + .12*rpNight)*tuft.x;
  if (rpBloom>0.) needle = mix(needle, rpPetal()*(.6 + .22*noise(g*7. + hp*40.) + .4*tuft.x*tuft.y)*(.82 + .3*sat(dot(e, vec2(-.6, .5))/o.z + .4)), rpBloom);
  col = mix(col, mix(needle, rpHaze, .42*rpFog + .1*(1. - sat(length(o.xy)*1.5))), max(solid, tuft.x)*(1. - rpS(.4, 1., rpBare)));
 }
 return col;
}
vec3 render(vec2 p) {
 rpLight();
 bool a = uVar<.5;
 vec2 C = vec2((.15 + .2*rpOff - .12*rpClose)*rpW, .13 + .2*rpOff - .1*rpClose) + .004*vec2(sin(uTime*.13), cos(uTime*.11)), b = p;
 if (a) b = rpPlan(p); else rpSunAt = C + vec2(-.48*rpW, .07);
 vec3 col = rpSky(b, a?(b.y + .05)/.6:.75 - .9*length(p - C));
 // the bird of the phrase
 float bt = fract(uTime/26.), bs = a?.06:.085;
 vec2 q = b - vec2((bt*2.6 - 1.3)*rpW, (a?.24:.04 + .3*bt) + .06*sin(bt*9.));
 col = mix(col, vec3(.13)*rpDim(.5), rpBird(q/bs, rpPx/bs)*rpS(.02, .2, uPhrase)*.85);
 if (a) col = rpA(col, b); else col = rpB(col, p, C);
 // the load a hit lets go and, under the ropes, small falls of powder
 float f = fract(uTime/17.), turn = mod(floor(uTime/17.), 2.);
 vec2 at = turn<.5?rpOver(8).xy:rpOver(4).xy;
 float load = rpLoad(a?rpWv - rpBough:p - C - rpOver(5).xy, a?.17*rpSc:.19, a?.24*rpSc:.28, 1. - uHits)*rpS(0., .5, uHits);
 if (!a) load = max(load, rpLoad(p - C - at, .13, .35, f)*.6*rpSq(sin(PI*f))*sat(rpSnow*1.6));
 col = mix(col, mix(rpWhite, rpPetal(), rpBloom)*mix(vec3(1.), vec3(.68, .76, .88), rpIce*rpS(0., .6, dot(col, vec3(.35)))), load);
 return rpFall(col, a?rpWv:p);
}
