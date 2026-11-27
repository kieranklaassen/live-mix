// name: Big sleepers
// a: The shaggy one
// b: Harbour guest
// what: At dawn a hillside is asleep: an enormous mossy back with birches on its spine and sheep on its shoulder, a head with a round ear laid on an arm, a croft and its smoke in the crook. Or a smooth grey creature as big as a hill lies curled round a harbour, lit windows along its side, a lighthouse by its tail.
// follows: The drone deepens the breath and warms the coat, pads light the sun in fur or on skin, texture is wind or ripples, a phrase runs down the body. Bands raise tufts or waves, the piece flowers in the coat or lights windows, each boat is a kind. A hit twitches the ear or lights the harbour, a cue stretches it; the loop is a cloud's shadow or the beam.
// own: 0 snow at -1, rust at 1; 1 moonlit night at -1, pale day at 1; 2 close, or low on the water, at -1, far off, or a gull's height, at 1; 3 lean with a knobbed spine at -1, fat at 1; 4 cropped coat, or sunk in flat water, at -1, hair to the ground, or risen in a rough sea, at 1; 5 deep mist at -1, a dark sky at 1
float bsPx, bsBr, bsWin, bsAut, bsNi, bsDay, bsHair, bsUp, bsTall, bsFog, bsStorm;
vec3 bsSun;
float bsS(float a, float b, float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); } // also from high to low
float bsLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
// dawn or evening, deep night, plain day
vec3 bsHour(vec3 dusk, vec3 night, vec3 day) { return mix(mix(dusk, night, bsNi), day, bsDay); }
// ---- a: the shaggy one. Each body is a few rounds and limbs melted together.
const vec2 bsAt = vec2(.228, .122); // the sun
// How far a tip stands out across the edge, 0 to 1.
float bsTip(float x) {
 float i = floor(x), f = x - i, h = hash11(mod(i, 997.) + 3.7), c = .25 + .5*fract(h*7.3);
 f = f < c ? f/c : (1. - f)/(1. - c);
 return f*f*(.3 + .7*h);
}
// Overlapping locks, as thatch: how light, and whose.
vec2 bsLocks(vec2 q) {
 for (int j = 2; j >= 0; j--) {
  float row = floor(q.y) - float(j), x = q.x + .37*mod(row, 2.) + .13*mod(row, 3.), i = floor(x);
  vec2 h = hash22(vec2(i, mod(row, 211.)) + .5);
  float y = (q.y - row - .5*h.x)/2.2, w = .52*(1. - y*y) - abs(x - i - .5 - (h.y - .5)*.5*y);
  if (y > 0. && w > 0.) return vec2((.3 + .85*y)*(.65 + .35*bsS(0., .25, w)) + .2*(h.x - .5), h.y);
 }
 return vec2(.2, .5);
}
float bsW, bsMore, bsSd, bsArmF, bsFat; bool bsFull;
vec2 bsQ, bsG; int bsN;
vec4 bsD[3], bsX[3]; float bsA[3]; // the bodies seen here, the nearest first
// A round, or a limb from a to b, melted into the body that is being made.
void bsEll(float x, float y, float a, float b) {
 vec2 q = (bsQ - vec2(x, y))/vec2(a, b);
 float w = exp(clamp(1. - dot(q, q), -8., 2.)*7.);
 bsW += w; bsG -= 2.*w*q/vec2(a, b);
}
void bsLimb(vec2 a, vec2 b, float ra, float rb) {
 vec2 ba = b - a, d = bsQ - a; float h = sat(dot(d, ba)/dot(ba, ba)), r = mix(ra, rb, h)*(1. + .07*bsFat);
 d -= ba*h;
 float w = exp(clamp(1. - dot(d, d)/(r*r), -8., 2.)*7.);
 bsW += w; bsG -= 2.*w*d/(r*r);
}
void bsNew(vec2 p, float s) { bsQ = vec2(p.x, -.3 + (p.y + .3)/(1. + s)); bsW = 0.; bsG = vec2(0.); }
// Body l, made of the rounds before it, is kept if seen here: dep deep, its hair combed to C, R wide and amp long.
void bsKeep(float l, float dep, vec2 C, float R, float amp) {
 vec2 G = bsG/bsW; float F = log(bsW)/7. + bsMore;
 amp *= bsHair;
 float sd = F/max(length(G), .6);
 bsSd = sd;
 if (F > -3. && sd > -1.15*amp - 2.*bsPx && bsN < 3 && !bsFull) {
  bsD[bsN] = vec4(F, G, sd); bsX[bsN] = vec4(bsQ - C, R, l + dep); bsA[bsN] = amp;
  bsN++; bsFull = sd > 3.*bsPx && l != 1.;
 }
}
vec3 bsShaggy(vec2 p) {
 float thin = sat(-uOwn[3]); bsFat = sat(uOwn[3]);
 float zoom = exp2(.62*uOwn[2]);
 p = mix(vec2(.14, -.16), p, zoom) + vec2(.12*bsTall, 0.); p *= 1. + .3*bsTall;
 bsPx = 1.2*zoom*(1. + .3*bsTall)/uRes.y;
 bsHair = uOwn[4] < 0. ? mix(1., .15, -uOwn[4]) : mix(1., 2.6, uOwn[4]);
 float br = bsBr*(.016 + .018*uDrone) + .05*bsUp, air = length(p - bsAt);
 vec3 mist = bsHour(vec3(.7, .62, .52), vec3(.06, .09, .16), vec3(.66, .7, .7)) + bsSun*.5*exp(-air*3.);
 mist *= 1. - .5*bsStorm;
 // the sky with the sun low in it
 vec3 lo = bsHour(vec3(.95, .76, .54), vec3(.07, .1, .18), vec3(.72, .76, .74));
 vec3 col = mix(lo, bsHour(vec3(.3, .43, .52), vec3(.015, .025, .07), vec3(.2, .4, .62)), bsS(0., .5, p.y));
 float cl = .6*noise(vec2(p.x*1.7 + uTravel*.01, p.y*9.)) + .4*noise(vec2(p.x*4.1 + uTravel*.014, p.y*21. + 5.));
 col = mix(col, lo*1.15, bsS(.45, .8, cl)*.5);
 col = mix(col, vec3(.05, .062, .08)*(.6 + .9*cl), bsStorm*bsS(-.02, .2, p.y)*.92);
 float ds = length((p - bsAt)*vec2(.7, 1.));
 col += bsSun*(.5*(1. - .5*bsStorm)*exp(-ds*2.5) + 1.6*exp(-ds*9.) + 5.*bsS(.034, .034 - 2.*bsPx, air));
 // the meadow in the crook of the arm with its walls, and mist in the valley beyond
 float mx = (p.x + .4*p.y)*13., wisp = noise(vec2(p.x*2.6 + uTravel*.02, p.y*14.));
 vec3 grass = mix(vec3(.16, .24, .05), vec3(.34, .36, .12), noise(vec2(p.x*26., p.y*150.)))*(.75 + .25*sin(floor(mx)*4.))*(.7 + .5*bsDay);
 grass = mix(grass, vec3(.05, .05, .04), .6*bsS(.06, 0., abs(fract(mx) - .5)));
 grass = mix(mix(grass, vec3(.6), bsWin*.8) + bsSun*.1, mist, .08 + .45*bsS(.3, .46, p.x) + .25*bsS(-.24, -.2, p.y))*(1. - .7*bsNi);
 vec3 low = mix(mist*.8, bsHour(vec3(.2, .26, .24), vec3(.03, .05, .08), vec3(.22, .3, .28)), bsS(.35, .8, wisp)*.7*bsS(-.12, -.35, p.y));
 float val = bsS(.4, .56, p.x), fog = max(bsS(-.02, -.16, p.y)*bsS(.44, .58, p.x), bsS(.25, .4, p.x)*bsS(-.33, -.44, p.y));
 float mead = bsS(.02, -.02, p.y + .2)*(1. - val), veil = 1. - (1. - mead)*(1. - fog);
 vec3 vc = (grass*mead*(1. - fog) + low*fog)/max(veil, .001);
 // which bodies are seen here
 float wb = 0., swell = bsFat*.2 - thin*.28 + br, t0 = TAU*uTime/18.;
 bsN = 0; bsFull = false; bsMore = 0.;
 float f = 1. + .07*bsFat, ear = .07*uHits*(1. - uHits);
 // a bank of heather close to us
 bsNew(p, 0.); bsEll(.86, -.78, .62, .36); bsEll(.5, -.86, .3, .3);
 bsKeep(0., .2, vec2(.86, -1.28), .9, .03);
 // the arm
 bsNew(p, .7*swell); bsLimb(vec2(.05, -.06), vec2(.66, -.21), .13, .1); bsLimb(vec2(.66, -.21), vec2(-.16, -.8), .105, .085);
 bsArmF = log(bsW)/7.;
 bsKeep(1., .13, vec2(.2, -8.), 8., .024);
 // the knee drawn up
 bsNew(p, .6*swell); bsEll(-.66, -.43, .36*f, .28); bsEll(-.41, -.59, .28, .17);
 bsKeep(2., .22, vec2(-.62, -.88), .46, .026);
 // haunch, ribs and shoulder
 bsNew(p, swell); bsEll(-.86, -.12, .52*f, .5); bsEll(-.36, -.2, .4*f, .44); bsEll(-.02, -.1, .23*f, .23);
 vec2 bc = bsQ - vec2(-.35, -.75); float rho3 = length(bc), u3 = atan(bc.x, bc.y)*.9;
 float tu = 6.*(fract(u3*.5 + .5 + uTime*.11) - .5), shiver = uPhrase*exp(-tu*tu), tuft = band((u3 + .7)/1.3)*uEnergy;
 bsMore = .13*thin*(.5 + .5*cos(u3*60.))*bsS(.5, .8, rho3); // a lean one shows its spine
 bsKeep(3., .34, vec2(-.35, -.75), .9, .03*(1. + 1.8*tuft + .7*shiver));
 bsMore = 0.; float back = bsSd;
 // the head, turned away, and its ear
 bsNew(p, .4*swell); bsEll(.47, -.06, .2, .165); bsEll(.64, -.14, .14, .12); bsEll(.61, .06 + ear, .045, .06 + .5*ear);
 bsKeep(4., .19, vec2(.45, -.36), .4, .022);
 // two more, far off
 bsNew(p, .02*sin(t0 - .7)*(.6 + uDrone)); bsEll(.9, -.08, .28, .2); bsEll(1.14, -.11, .16, .16);
 bsKeep(5., .16, vec2(.93, -6.), 6., .011);
 bsNew(p, .02*sin(t0 - 1.5)*(.6 + uDrone)); bsEll(.55, .035, .17, .13); bsEll(.73, .01, .11, .1); bsEll(.83, .02, .02, .05);
 bsKeep(6., .1, vec2(.6, -6.), 6., .007);
 float cs = (p.x - mix(-1.3, 1.3, uLoop))*2.2;
 float shade = 1. - .5*exp(-cs*cs)*bsS(0., .12, uLoop)*bsS(1., .88, uLoop);
 // each in its coat, the nearest first
 vec3 seen = vec3(0.); float left = 1.;
 for (int k = 0; k < 3; k++) {
  int l = k < bsN ? int(floor(bsX[k].w)) : 9;
  if (l > 8 || uVar > .5) break;
  float F = bsD[k].x, sd = bsD[k].w, dep = fract(bsX[k].w), amp = bsA[k], rho = length(bsX[k].xy), u = atan(bsX[k].x, bsX[k].y)*bsX[k].z;
  vec2 G = bsD[k].yz, ts = bsAt - p;
  if (l == 1) u += (p.y + .21)*bsS(-.04, .14, p.x - .66);
  float uu = u + (.9 + .5*sin(u*5. + 1.) + .5*uTexture*sin(u*9. - uTime*.8))*clamp(-sd, -.02, .1);
  float tip = .5*bsTip(uu*42.) + .32*bsTip(uu*105. + 7.) + .3*bsTip(uu*190. + 3.);
  float cover = bsS(-1., 1., (sd + amp*tip)/(bsPx*(1. + amp*90.)));
  if (l == 1) cover *= bsS(0., .2, p.x + 3.*max(-p.y - .24, 0.));
  if (l > 3) { seen += left*veil*vc; left *= 1. - veil; veil = 0.; }
  F = max(F, 0.);
  vec3 nn = normalize(vec3(-.5*dep*G, sqrt(F) + .02));
  float vv = .7*dep*sqrt(F) - rho, big = noise(vec2(u*7., vv*5.));
  float ux = u + .05*sin(vv*9. + u*4.)*(.6 + .4*bsHair) + (noise(vec2(u*9. + 4., vv*6. + 3.*sin(uTime*.04))) - .5)*(.012 + .02*uTexture);
  vec2 lk = bsLocks(vec2(ux*62., vv*mix(46., 24., sat(bsHair*.55))));
  float strand = noise(vec2(ux*420., vv*16.)), tone = mix(.6, lk.x, .95)*(.65 + .7*strand)*(.45 + 1.1*big);
  // moss, lichen, and what is sounding
  vec3 coat = mix(vec3(.045, .1, .028), vec3(.135, .2, .05), sat(lk.y*.9 + big - .5));
  coat = mix(coat, vec3(.24, .22, .11), bsS(.6, .95, noise(vec2(u*11., vv*13. + 20.)))*.6);
  coat = mix(coat, mix(vec3(.26, .09, .025), vec3(.36, .2, .05), lk.y), bsAut*.85);
  coat = mix(coat, vec3(.62, .64, .66), bsWin*bsS(.1, .75, lk.x + .5*nn.y));
  vec4 pc = piece(vec2((p.x + .85)/1.2, sat(.75 - p.y*1.4)));
  vec2 fg = vec2(u, rho)*105., fi = floor(fg), fh = hash22(mod(fi, 997.));
  float bloom = bsS(.3, .12, length(fg - fi - .3 - .4*fh))*step(.45, fract(fh.x*7.))*bsS(.4, .75, noise(p*13.));
  float dark = shade;
  if (l == 3) {
   coat += uKind[0]*uDrone*.09*uEnergy + pc.rgb*vec3(1., .6, .95)*(.05 + .9*bloom) + uKind[3]*shiver*.1 + (bsSun*.12 + .5*coat)*tuft*lk.x*bsS(-.16, 0., back);
   dark *= 1. - .6*exp(-sat(-bsArmF)*2.5);
   wb = left*cover;
  }
  if (l == 1) coat += uKind[2]*uTexture*.1*uEnergy;
  dark *= l == 0 ? .55 : l == 2 ? .8 : 1.;
  // light
  float da = length(ts), side = .5 + .5*dot(-G/max(length(G), .001), ts/max(da, .001)), up = .5 + .5*nn.y;
  vec3 skyL = mix(mix(vec3(.16, .24, .32), vec3(.8, .78, .7), up*up*up), vec3(.06, .09, .17), bsNi*.8)*(1. + .8*bsDay);
  vec3 c = coat*tone*(skyL*1.15*dark*(.5 + .5*bsS(-.5, .15, p.y)) + bsSun*sat(dot(nn, normalize(vec3(.5, .55, .65*bsDay + .05))))*(.9 + 1.2*bsDay));
  float s = max(sd, 0.);
  c += bsSun*(exp(-s*60.)*(.45 + .8*strand)*1.5 + .12*exp(-s*12.)*lk.x)*side*side*(.25 + 1.7*exp(-da*2.))*(.7 + .6*uPad + .7*uCue)*(1. + coat*2.);
  float ring = (length(p - vec2(.6, .06)) - .9*(1. - uHits))*9.;
  c += (c*2.6 + .07)*mix(bsSun, uKind[4], .4)*uHits*exp(-ring*ring);
  if (l > 3) {
   vec3 kc = uKind[l == 5 ? 3 : 1]; float lv = l == 5 ? uPhrase : uPad*step(5., float(l));
   c = mix(c, mix(mix(vec3(.3, .38, .46), mist, .4), kc*kc, .5*lv*uEnergy), l == 4 ? .12 : l == 5 ? .6 : .82);
   c = mix(c, mist, l == 4 ? .4*bsS(-.06, -.31, p.y) : .85*bsS(.05, -.16, p.y - .02*wisp + (l == 5 ? .07 : 0.)));
  }
  seen += left*cover*c; left *= 1. - cover;
  if (left < .01 || k == 2) break;
 }
 col = seen + left*mix(col, vc, veil);
 // sheep on the shoulder; a hit sends them a step
 vec2 sg = vec2(u3*18., rho3*22.), si = floor(sg), h2 = hash22(si + 3.);
 vec2 sq = (sg - si - .3 - .4*h2 - vec2((h2.x > .5 ? .25 : -.25)*uHits*(1. - uHits), 0.))/vec2(18., 22.);
 float flock = wb*bsS(0., .05, .3*noise(si*.45 + 2.) + .16*h2.x - .17 - .35*length((p - vec2(-.1, .04))*vec2(1., 2.)))*bsS(.02, .05, back);
 col = mix(col, (vec3(.75, .72, .64) + bsSun*.5*uHits)*(.65 + 70.*sq.y)*(1. - .7*bsNi), flock*bsS(bsPx, -bsPx, length(sq*vec2(.75, 1.15)) - .0034));
 // birches on the spine
 float h = -back, ti = floor(u3*34.);
 for (int k = h > -.01 && h < .1 ? -1 : 1; k <= 1; k++) {
  float id = ti + float(k); vec2 r = hash22(vec2(id, 4.));
  float x0 = (id + .2 + .6*r.x)/34., tall = .04 + .03*r.y, yy = h/tall;
  float has = step(abs(h - .045), .055)*bsS(0., .1, .7 - abs(x0 + .2)*1.5 - fract(r.x*13.)*.6);
  float x = u3 - x0 - h*(.12*(r.x - .5) + .05*bsBr + .04*sin(uTime*.6 + id)*uTexture);
  float trunk = bsS(bsPx, 0., abs(x) - .0017*(1.2 - yy))*step(yy, 1.);
  float cr = 1. - length(vec2(x/tall*(2.6 + 1.6*yy), yy*2. - 1.32)) + .7*(noise(vec2(x, h)*260. + id*9.) - .5) + .5*(noise(vec2(x, h)*110. + id) - .5);
  vec3 leaf = mix(vec3(.07, .08, .02), vec3(.3, .14, .03), bsAut) + bsSun*.35*exp(-air*1.2)*noise(vec2(x, h)*400.);
  col = mix(col, vec3(.2, .17, .14)*(1. - .8*bsNi), trunk*has*bsS(-.002, .006, h));
  col = mix(col, mix(leaf, vec3(.45), .6*bsWin)*(1. - .75*bsNi), bsS(.1, .5, cr)*.9*has*bsS(0., .015, h));
  if (k == 1) break;
 }
 // mist: near the ground, or over everything
 float deep = mix(bsS(-.52, -.75, p.y), .96*bsS(.3, -.2, p.y - .12*wisp - .05*p.x), bsFog);
 col = mix(col, mist*(.9 + .2*wisp), deep);
 // the croft and its smoke
 vec2 q = (p - vec2(.235, -.312))*.8; vec3 clear = col;
 float wall = max(abs(q.x) - .024, abs(q.y - .008) - .01), roof = max(abs(q.x)*.25 + q.y - .036, max(abs(q.x) - .028, .017 - q.y));
 col = mix(col, mix(vec3(.85, .8, .7), vec3(.1, .11, .15), bsNi)*(.7 - 9.*q.x), bsS(bsPx, -bsPx, wall));
 col = mix(col, vec3(.09, .07, .055), bsS(bsPx, -bsPx, min(roof, max(abs(q.x - .014) - .004, abs(q.y - .037) - .006))));
 col = mix(col, vec3(2.4, 1.2, .35)*(.35 + .65*uKeys + bsNi), bsS(bsPx, -bsPx, max(abs(abs(q.x) - .011) - .003, abs(q.y - .008) - .004)));
 col = mix(col, clear, .7*bsFog);
 float sy = p.y + .258, sx = p.x - .2525 - .014*sin(sy*17. - uTime*.35)*bsS(.02, .3, sy) - .02*sy, sw = .003 + .02*max(sy, 0.);
 col = mix(col, mist*1.25 + bsSun*.12, exp(-sx*sx/(sw*sw))*bsS(0., .01, sy)*bsS(.5, .05, sy)*(.85 + .2*sin(sy*38. - uTime*.7 + 5.*noise(vec2(sx*60., sy*9.))))*(.75 + .25*uMic));
 return screenOf(col);
}
// ---- b
float bsAlong; // brow 0, tail 1
mat2 bsFl, bsFm;
float bsGuest(vec3 q) {
 float f = atan(q.x, q.z), s = sat((f + 2.35)/4.1), fat = uOwn[3];
 vec2 way = f < -2.35 ? vec2(-.711, -.703) : f > 1.75 ? vec2(.984, -.178) : q.xz/max(length(q.xz), .001);
 bsAlong = s;
 float r = (.13 + (1.06 + .3*fat)*bsS(-.3, .3, s)*(1. - bsS(.3, 1.02, s)))*(1. - .2*max(-fat, 0.));
 float y = .18*uOwn[4] - .2*r - .8*(1. - bsS(0., .26, s));
 r *= 1. + bsBr*.018*(.6 + uDrone) + .04*bsUp + .012*uPhrase*sin(s*22. - uTime*.9) + .07*max(-fat, 0.)*cos(s*66.)*bsS(0., .5, q.y);
 float d = length(q - vec3(way.x*(2.6 + .2*s), y, way.y*(2.6 + .2*s))) - r;
 // the flipper drawn up over its brow, and the two lobes of the tail on the water
 vec3 a = q - vec3(-1.62, .2, -1.3);
 a.xz = bsFl*a.xz; a.xy = bsFm*a.xy;
 d = smin(d, (length(vec3(a.x, a.y + .3*a.x*a.x, a.z + .25*a.x*a.x)/vec3(.95, .09, .3)) - 1.)*.12, .18);
 a = q - vec3(2.62, .05 + .16*uOwn[4], -.95);
 a = vec3(abs(a.x) - .36, a.y - .1*abs(a.x), a.z - .55*abs(a.x) + .1);
 return smin(d, (length(a/vec3(.46, .075, .22)) - 1.)*.11, .16);
}
vec3 bsEve(vec3 d, float clouds) {
 float y = max(d.y, 0.), az = d.x/max(d.z, .2) - .3, el = d.y/max(d.z, .2);
 vec3 lo = bsHour(vec3(.95, .5, .26), vec3(.05, .08, .17), vec3(.8, .82, .8)), hi = bsHour(vec3(.1, .18, .28), vec3(.008, .016, .05), vec3(.2, .42, .66));
 vec3 c = mix(lo, hi, bsS(-.02, .18, y));
 c = mix(c, mix(lo*vec3(.78, .58, .62), hi, .4), clouds*bsS(0., .06, y));
 c = mix(c, vec3(.05, .06, .075)*(1. + 2.*clouds), bsStorm*bsS(0., .1, y)*.92);
 return c + bsSun*(.5*exp(-az*az*2. - y*y*20.) + 2.5*bsS(.028, .026, length(vec2(az, el - .05))));
}
float bsBox(vec2 q, vec2 c, vec2 h) { q = abs(q - c) - h; return max(q.x, q.y); }
// Boats, the houses of the quay, and the lighthouse on its rock: flat and standing.
const vec3 bsRock = vec3(3.15, 0., .2);
vec4 bsProps(vec3 ro, vec3 rd, float far, float px) {
 vec4 o = vec4(0.);
 float grey = bsHour(vec3(.16), vec3(.05), vec3(.5)).x, iz = 1./max(rd.z, 1e-3), ta = (-.9 - ro.z)*iz, tb = (1.4 - ro.z)*iz;
 vec3 gold = vec3(1., .6, .25);
 vec2 a = (ro + rd*ta).xy, b = (ro + rd*tb).xy;
 bool near = uVar > .5 && max(a.y, b.y) > -.1 && min(a.y, b.y) < .42 && max(a.x, b.x) > -1.5 && min(a.x, b.x) < 1.3 && far > ta;
 for (int i = 0; i < (near ? 14 : 0); i++) {
  float fi = float(i), f = -1.1 + (fi - 5.)*.17, d, sharp; vec2 h = hash22(vec2(fi, 2.)), at;
  vec3 c = i < 5 ? vec3(-.7 + .42*fi + .1*sin(uTime*.07 + fi*2.), .012*sin(uTime*.7 + fi*1.9), .3 - 1.1*h.x) : vec3(sin(f), .04, cos(f))*1.4, cc, lit;
  float t = (c.z - ro.z)*iz, e = px*t;
  vec2 q = (ro + rd*t - c).xy;
  if (t < 0. || t > far || abs(q.x) > .4 || q.y < -.1) continue;
  if (i < 5) {
   vec3 kc = uKind[i];
   q.x *= h.x > .5 ? .85 : -.85; q.y *= .85;
   d = min(max(abs(q.x) - .1 - .5*q.y, max(q.y - .05 - q.x*q.x*1.6, -.02 - q.y)), min(bsBox(q, vec2(-.03, .07), vec2(.03, .025)), bsBox(q, vec2(.03, .13), vec2(.004, .1))));
   cc = mix(vec3(.1, .09, .08), kc, .35)*grey*(q.y > .04 ? 3.2 : 1.6);
   at = vec2(.03, .16); lit = mix(gold, kc, .6)*(.2 + bsLv(i)*1.4); sharp = 1100.;
  } else {
   float m = .12 + .08*h.x, wd = .075 + .02*h.y;
   q /= 1.15;
   d = min(min(bsBox(q, vec2(0., .5*m), vec2(wd, .5*m)), max(abs(q.x)*.9 + q.y - m - wd*.75, m - q.y)), bsBox(q, vec2(0., -.03), vec2(.12, .035)));
   cc = mix(vec3(.5, .45, .38), vec3(.45, .17, .1), step(.5, h.y))*grey*(q.y < .005 ? .5 : q.y > m ? .6 : 1.6);
   vec4 pc = piece(vec2((fi - 4.5)/10., .2 + .6*h.x)) + piece(vec2((fi - 4.5)/10., .5));
   vec2 wn = abs(abs(q - vec2(0., .5*m)) - vec2(.033, 0.)) - vec2(.012, .022);
   lit = mix(gold, pc.rgb, .5*sat(pc.a))*(.25 + 1.6*sat(pc.a) + uKeys*h.y + .4*bsNi);
   cc = mix(cc, lit*1.6, bsS(e, -e, max(wn.x, wn.y)));
   at = vec2(0., .06); lit *= .25; sharp = 70.;
  }
  q -= at;
  o = mix(o, vec4(cc, 1.), bsS(e, -e, d)) + vec4(lit*exp(-dot(q, q)*sharp), 0.);
 }
 float t = (bsRock.z - ro.z)*iz, e = px*t;
 vec2 q = (ro + rd*t - bsRock).xy;
 if (t > 0. && t < far && abs(q.x) < .35 && q.y < 1.1) {
  float d = min(bsBox(q, vec2(0., .35), vec2(.055 - .025*q.y, .35)), min(bsBox(q, vec2(0., .76), vec2(.03, .05)), max(abs(q.x) + q.y - .86, .8 - q.y)));
  vec3 cc = mix(vec3(.75, .7, .62), vec3(.4, .08, .06), step(.5, fract(q.y*3.2))*step(q.y, .69))*grey*3.*(.8 + 4.*q.x);
  float rock = q.y - .12 + 1.6*q.x*q.x - .06*noise(q*26.);
  if (rock < d) { d = rock; cc = vec3(.36)*(.5 + noise(q*60.))*grey; }
  o = mix(o, vec4(cc, 1.), bsS(e, -e, d)); q.y -= .76;
  o.rgb += gold*(.9 + uKeys)*exp(-dot(q, q)*1100.);
 }
 return o;
}
// the light a hit throws over the harbour
float bsPool(vec3 q) { q -= vec3(.3, .3, -.1); return .2*exp(-dot(q, q)*.35); }
vec3 bsSkin(vec3 q, vec3 rd, vec3 n, float s) {
 vec2 w = vec2(s*9., q.y*2.6 + 1.6*length(q.xz));
 float mott = noise(w*2.)*.6 + noise(w*5.)*.4, fine = noise(w*14.);
 n = normalize(n + .05*vec3(fine - .5, mott - .5, fine*mott*2. - .5));
 vec3 c = mix(vec3(.05, .085, .08), vec3(.15, .19, .16), bsS(.35, .75, mott)*.6 + .4*sat(.4 - q.y));
 c = mix(c, vec3(.24, .1, .04)*(.5 + mott), bsAut*bsS(.2, .7, mott + .4*n.y));
 // barnacles toward the brow
 vec2 bq = w*vec2(6., 5.), bi = floor(bq), bh = hash22(bi);
 float bar = bsS(.1 + .25*bh.x, .05, length(bq - bi - .35 - .3*bh))*step(.5, bh.y)*bsS(.27, .12, s)*bsS(.6, .2, q.y);
 c = mix(c, vec3(.5, .48, .4), bar) + uKind[0]*uDrone*.05 + uKind[2]*uTexture*.03;
 c = mix(c, vec3(.75, .8, .85), bsWin*bsS(.35, .75, n.y + .6*(mott - .5))*bsS(.1, .3, q.y));
 vec3 sd = normalize(vec3(.3, .14 + .5*bsDay, .95 - 1.2*bsDay)), r = reflect(rd, n);
 r.y = abs(r.y);
 vec3 lo = bsHour(vec3(.8, .45, .28), vec3(.04, .06, .13), vec3(.7, .75, .75)), hi = bsHour(vec3(.16, .24, .33), vec3(.02, .03, .07), vec3(.38, .5, .6));
 c *= mix(lo*(.3 + .7*sat(n.z)), hi, .5 + .5*n.y)*.9 + bsSun*sat(dot(n, sd)*.7 + .3)*1.5;
 c += mix(lo, hi, bsS(0., .4, r.y))*(.03 + .9*pow(1. - sat(-dot(n, rd)), 4.))*(.6 - .3*bar)*(1. - .7*bsWin);
 c += bsSun*pow(sat(dot(r, sd)), 40.)*(.6 + .6*fine)*(.8 + .6*uPad + 2.*uCue);
 c += uKind[4]*uHits*bsPool(q) + bsSun*uCue*.06*sat(n.y);
 return c*(1. - .5*bsS(.1, .02, q.y + .05*(mott - .5) + .015*sin(uTime*.7 + s*20.)));
}
vec2 bsRing(vec2 d, float at, float strong) {
 float r = length(d) + .001, x = (r - at - .08)*6.;
 return d/r*cos(x)*exp(-x*x*.15)*strong*.2;
}
vec3 bsHarbour(vec2 p) {
 bsFl = rot(-1.); bsFm = rot(-.28);
 float v = uOwn[2], hgt = v < 0. ? mix(2.2, .8, -v) : mix(2.2, 5., v), pit = atan(hgt - .95 + .3*v, 6.2), px = .74/uRes.y;
 vec3 ro = vec3(0., hgt, -6.2), rd = normalize(vec3(p*(1. + 1.15*bsTall) - vec2(.05*bsTall, 0.), 1.35));
 rd.yz = rot(-pit)*rd.yz;
 vec3 o = ro, d = rd, col = vec3(0.), deep = bsHour(vec3(.025, .06, .06), vec3(.008, .018, .02), vec3(.06, .16, .17));
 vec3 hz = bsEve(vec3(rd.x, 0., max(rd.z, .2)), 0.);
 float seen = 60., mirror = 0., pool = 0., glint = 0., foam = 0., fog = 0., under = 1.;
 vec4 over = vec4(0.);
 // the eye's ray, and then what the water mirrors of it
 for (int k = 0; k < 2; k++) {
  float tw = d.y < -.001 ? -o.y/d.y : 60., t = k == 0 ? (d.y < 0. ? max((1.3 - o.y)/d.y, 1.) : 1.) : .03;
  float end = min(d.y > .001 ? (1.35 - o.y)/d.y : tw, k == 0 ? 14. : 5.), g = 1.;
  bool hit = false;
  for (int i = 0; i < (k == 0 ? 34 : 14); i++) {
   if (t > end || uVar < .5) break;
   g = bsGuest(o + d*t);
   if (g < .002*t + .001) { hit = true; break; }
   t += g*.88;
  }
  float az = d.x/max(d.z, .2), far = hit ? t : min(tw + .02, 60.), s = bsAlong;
  bool sky = !hit && (k == 1 || tw > 59.);
  float cl = sky ? .6*noise(vec2(az*2.2 + uTravel*.006, d.y*22.)) + .4*noise(vec2(az*6. + uTravel*.008, d.y*55. + 5.)) : 0.;
  vec3 c = sky ? bsEve(d, .8*bsS(.45, .75, cl)) : vec3(0.), q = o + d*(hit ? t : tw), n = vec3(0.);
  // how the skin lies, or how near it is
  for (int i = 0; i < 3; i++) {
   float v = bsGuest(q + (hit ? .006 : 0.)*vec3(i == 0, i == 1, i == 2));
   n[i] = v - g;
   if (!hit) { g = v; break; }
  }
  if (hit) c = bsSkin(q, d, normalize(n + 1e-6), s);
  vec4 prop = bsProps(o, d, far, px*float(k + 1));
  if (k == 0) { col = c; over = prop; seen = far; }
  else col = mix(deep, c*(1. - prop.a) + prop.rgb, mirror);
  if (k == 1 || hit || tw > 59. || uVar < .5) break;
  // the water: swell, ripples, rings
  vec2 w = q.xz, go = 60.*vec2(cos(uTime*.005), sin(uTime*.005)), sl = vec2(noise(w*vec2(3., 7.) + go), noise(w*vec2(2.6, 8.) + 9. - go.yx)) - .5;
  sl += .6*vec2(noise(w*vec2(9., 21.) - 1.2*go), noise(w*vec2(8., 23.) + 4. + 1.3*go.yx)) - .3;
  sl *= (.05 + .06*uTexture + (uOwn[4] > 0. ? .25 : .045)*uOwn[4])/(1. + .1*tw)*(.6 + 1.2*band(sat(.5 + q.x*.25))*uEnergy);
  sl += bsRing(w - vec2(.5, -.5), 2.2*(1. - uHits), uHits) + bsRing(w - vec2(-1.2, -1.6), 4.*(1. - uCue), uCue);
  n = normalize(vec3(-sl.x, 1., -sl.y));
  mirror = .28 + .7*pow(1. - sat(-dot(n, d)), 3.);
  float gl = az - .3 + sl.x*2.;
  glint = exp(-gl*gl*120.)*bsS(0., .03, sl.y)*.35;
  // it laps along the flank
  if (g < .12) {
   float lap = .035 + .02*sin(uTime*.7 + 5.*noise(w*2.)) + .02*noise(w*14.);
   foam = .5*bsS(.018, 0., abs(g - lap))*bsS(.35, .6, noise(w*9. + 3.));
  }
  pool = uHits*bsPool(q);
  under = 1. - .35*exp(-max(g, 0.)*9.);
  fog = 1. - exp(-max(tw - 6., 0.)*(.03 + .06*uSpace));
  o = q; d = reflect(d, n); d.y = max(d.y, .01);
 }
 fog = max(fog, bsFog*.84*(1. - exp(-max(seen - 3.5, 0.)*.3)));
 col = mix(mix(col*under, hz*.9, foam) + bsSun*glint + uKind[4]*pool, hz, fog);
 col = col*(1. - over.a*(1. - .6*bsFog)) + over.rgb*(1. - .6*bsFog);
 // the beam of the light goes round once in the piece
 vec3 lp = bsRock + vec3(0., .76, 0.), bd = vec3(sin(TAU*uLoop), 0., cos(TAU*uLoop)), wv = lp - ro;
 float b = dot(rd, bd), tb = max((b*dot(wv, rd) - dot(wv, bd))/max(1. - b*b, .001), 0.), ta = clamp(dot(wv + bd*tb, rd), 0., seen);
 float wide = .02 + .1*tb, gap = length(ro + rd*ta - lp - bd*tb)/wide;
 col += vec3(1., .8, .5)*exp(-gap*gap - tb*.4)*.3*(.6 + uPad)*(1. - .8*bsDay);
 return screenOf(col);
}
vec3 render(vec2 p) {
 bsBr = sin(TAU*uTime/18.);
 bsWin = sat(-uOwn[0]); bsAut = sat(uOwn[0]);
 bsNi = sat(-uOwn[1]); bsDay = sat(uOwn[1]);
 bsFog = sat(-uOwn[5]); bsStorm = sat(uOwn[5]);
 bsTall = bsS(.75, .3, .5*uRes.x/uRes.y);
 bsUp = 4.*uCue*(1. - uCue);
 bsSun = bsHour(vec3(1., .58, .24), vec3(.42, .55, .85), vec3(1., .86, .66))*(.8 + .5*uPad*uEnergy + .2*uTone);
 if (uVar < .5) return bsShaggy(p);
 return bsHarbour(p);
}
