// name: Flowers
// a: Flower field
// b: One bloom
// what: A meadow of flowers seen at a slant in evening light, the piece lying on the ground as drifts of flowers in its colours, each one open as far as its sound is loud; or one great flower seen close, a ring of petals for each kind of sound.
// follows: Each flower opens with the sound where it grows (across is the loop, far is the back of the room), the low band sways them, the mix warms the light, a hit or cue opens a ring of flowers that spreads outward; on the one bloom each ring of petals opens with its own kind of sound and a hit sends a ring of light out through them.
// own: 0 1 many narrow pointed petals, -1 few broad notched ones; 1 a: 1 a fine carpet of small flowers, -1 a few great ones; b: 1 far off and alone, -1 into its heart; 2 the ground: 1 pale and bare, -1 still dark water they float on; 3 the eye: 1 straight from above, -1 low down under a sky (b: from the side); 4 a: 1 planted in rows, -1 in clumps with bare ground between; b: 1 a standing cup, -1 spread flat; 5 1 drawn in ink, -1 seen through like glass; 6 the hour: 1 clear day with an air in the drone's colour, -1 night and only their own light; 7 1 petals twisted to pinwheels, -1 frayed and ruffled
float fNarrow, fBroad, fPale, fWater, fDown, fLow, fRows, fClump, fInk, fGlass, fDay, fNight, fTwist, fFrill;
// One ring of n petals round the middle of a flower. r is the distance out with the tips at 1; a is the angle in turns
// times n, plus the ring's own turn. vary gives each petal its own length and lean.
// Returns how far inside a petal's edge this is (in the flower's units), the place across the petal (-1 to 1),
// the place along it (0 to 1) and the petal's own number between 0 and 1.
vec4 fRing(float r, float a, float n, float round, float point, float vary) {
  a += fTwist*(1.3*r - .45)*smoothstep(0., .2, r);
  point = mix(mix(point, 1., fNarrow), 0., fBroad);
  round *= 1. + .5*fBroad;
  float id = floor(a);
  float hv = fract(sin(mod(id, n)*12.9898 + n*3.1)*43758.5453);
  float f = (a - id - .5)*2. + (hv - .5)*.5*vary;
  r /= 1. - .28*vary*hv;
  if (fBroad > 0.) r *= 1. + fBroad*(.16*exp(-f*f*9.) - .04);
  if (fFrill > 0.) r *= 1. + fFrill*(.07*sin(f*8. + hv*20.) + .05*sin(f*19. + hv*50.))*smoothstep(.5, 1., r);
  float w = min(1., mix(round*sqrt(max(1. - r*r, 0.)), 2.2*(1. - r), point))*(.93 - .25*point - .2*vary)*smoothstep(0., .3, r + .3*(1. - point));
  w *= 1. - .35*fNarrow;
  if (fFrill > 0.) w *= 1. + fFrill*.13*sin(r*24. + hv*20.)*sign(f);
  float edge = min((w - abs(f))*(r + .05)*PI/n, 1. - r);
  return vec4(edge, clamp(f/max(w, .08), -1., 1.), min(r, 1.), hv);
}
// The light on a petal: it rises toward its tip like a cup and curls at its edges. dir is the way outward from the middle.
float fLit(vec2 dir, float f, float cup, vec3 lamp) {
  vec3 n = normalize(vec3(-dir*cup + vec2(-dir.y, dir.x)*f*.7, 1.));
  return sat(dot(n, lamp));
}
// A petal drawn in ink: its line, its veins, a wash of its colour. in_ is how far inside the edge, over one line's width.
vec3 fDrawn(vec3 hue, float in_, float f, float z, float lit, float loud, float fine) {
  float vein = smoothstep(.35, 0., abs(fract(f*3.5 + .5) - .5))*smoothstep(1., .25, z)*fine;
  vec3 wash = mix(vec3(.86, .82, .74), hue*1.2, (.25 + .6*loud)*mix(.9, .35, z))*(.55 + .45*lit);
  return mix(wash, vec3(.03, .03, .045), max(.8*smoothstep(1.6, .6, in_), .45*vein));
}
vec3 fMeadow(vec2 p) {
  float asp = uRes.x/uRes.y;
  const float F = 1.15;
  float pitch = .66, thin = 1. - .65*fDay, many = uOwn[1] == 0. ? 1. : exp2(-uOwn[1]*(uOwn[1] > 0. ? 1. : 1.2));
  vec3 fwd = vec3(0., -sin(pitch), cos(pitch)), up = vec3(0., cos(pitch), sin(pitch));
  if (uOwn[3] != 0.) { float to = .66 + .8*fDown - .5*fLow; fwd = vec3(0., -sin(to), cos(to)); up = vec3(0., cos(to), sin(to)); }
  vec3 ro = vec3(.25*sin(uTime*.05), 2.3 + .5*fDown - .85*fLow + .6*max(-uOwn[1], 0.)*(1. - fLow), uTravel*.045);
  vec3 rd = normalize(fwd*F + vec3(p.x, 0., 0.) + up*p.y);
  vec3 sky = rd;
  rd.y = min(rd.y, -.03);                                 // nothing is drawn above the far edge of the meadow
  vec3 lamp = normalize(vec3(-.5, .5, .62));             // in a flower's own frame: across, away, up. The sun is low, behind and to the left
  float g = max(uHits, uCue);
  vec3 sunny = mix(mix(vec3(1., .68, .38), vec3(1.3, 1.22, 1.1), fDay), vec3(.07, .11, .2), fNight), cool = mix(mix(vec3(.045, .075, .15), vec3(.3, .34, .38), fDay), vec3(.012, .02, .045), fNight);
  vec3 col = vec3(0.);
  float left = 1., shade = 1.;                            // how much of the pixel is still to fill; shadow from what is above
  float px = 1.3/uRes.y;
  vec3 haze = mix(vec3(.014, .014, .035), vec3(.55, .20, .09), smoothstep(.05, .6, p.y)*(.55 + .45*exp(-pow((p.x + .35)*1.3, 2.))));
  vec3 air = uKind[0]*uKind[0];
  if (fDay > 0.) haze = mix(haze, mix(air, vec3(1.), .25)*(1.1 + .5*smoothstep(.5, -.1, p.y)), fDay);
  if (fNight > 0.) haze = mix(haze, air*.16 + vec3(.002, .004, .01), fNight);
  if (fPale > 0.) haze = mix(haze, vec3(.95, .93, .9)*(cool + sunny*.55) + haze*.3, .6*fPale);
  if (fLow > 0.) {                                         // a sky, with the low sun or the moon in it
    float far = length(p - vec2(-.34, .3));
    haze = mix(haze, haze*(.55 + .9*exp(-max(sky.y, 0.)*4.)) + (.15*air + sunny*.5)*exp(-far*5.) + (sunny + air*fNight)*1.6*smoothstep(.085, .081, far), fLow);
  }
  // the flower heads, the tallest first
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float hk = .86 - .17*fk, ck = .72 - .05*fk;
    hk = mix(hk*(1. - .5*max(uOwn[1], 0.)), .12 - .02*fk, fWater);
    ck = mix(ck, .66, fRows)*many;
    mat2 turn = rot((.4 + fk*1.13)*(1. - fRows));
    vec2 off = mix(vec2(fk*7.3), vec2(fk*7., fk*7.25), fRows);
    float t = (hk - ro.y)/rd.y;
    vec2 q = ro.xz + rd.xz*t;
    vec2 gq = turn*q/ck + off;
    vec2 id = floor(gq);
    float hx = hash21(id + fk*31.7), hy = fract(hx*57.31), h3 = fract(hx*131.7), h4 = fract(hx*717.3);
    vec2 l = ((gq - id - .5 - (vec2(hx, hy) - .5)*.16*(1. - fRows))*turn)*ck;   // from the flower's middle, in the ground's own directions
    vec2 c = q - l;
    // the wind rocks the head on its stem
    l -= (.012 + .05*uLow)*vec2(sin(uTime*.5 + c.x*.7 + hx*3.), .6*sin(uTime*.37 + c.y*.9 + hy*5.));
    // where this flower lies in the piece: its place on the screen
    vec3 dc = vec3(c.x, hk, c.y) - ro;
    vec2 sc = F*vec2(dc.x, dot(dc, up))/dot(dc, fwd);
    vec4 m = piece(vec2(sc.x/asp*.96 + .5, .5 - sc.y*.96));
    float loud = sat(m.a*(.7 + .6*uEnergy));
    // the ring a hit sets going: flowers open as it passes
    float rr = (length(c - vec2(ro.x + .4, ro.z + 3.6 - 3.2*fDown)) - (1. - g)*3.8)*1.2;
    float ring = sqrt(g)*exp(-rr*rr);
    float open = sat(.08 + 1.15*loud + .9*ring);
    vec3 hue = m.rgb/max(m.a, .02);
    hue = mix(vec3(.6, .55, .4), mix(hue, hue*hue*1.5, .75), sat(m.a*6.));
    // the low sun lies across the meadow in slow pools of light, wider as the music fills
    float pool = smoothstep(.5 - .35*uLevel, .75, noise(c*.45 + vec2(uTime*.02, 0.)) + .5*ring);
    vec3 warm = sunny*(.4 + 1.*pool);
    hue = mix(hue, uKind[4]*uKind[4]*1.8 + vec3(.25, .08, .1), sat(ring*1.2 - loud));
    hue = hue*(.7 + .6*hx) + (h4 - .5)*vec3(.12, -.03, .10);
    float fog = 1. - exp(-t*.07*thin);
    float there = step(.12 + fClump*smoothstep(.42, .6, noise(c*.55 + 3.)), h3);
    float R = ck*.33*(.75 + .25*h3)*(.34 + .66*open)*(1. - .16*fLow);
    vec2 lf = vec2(l.x, l.y*(.8 + .2*fDown - .2*fLow))/R;                    // it leans its face a little toward us
    float aa = (px*t/F)/R*(1. + 5.*max(2.5 - t, 0.)*max(2.5 - t, 0.));
    float daisy = step(.68 - .69*fNarrow + .33*fBroad, hy);                           // some have many narrow petals
    float n = mix(5. + floor(h4*3.99*(1. - .8*fBroad)), 11. + floor(h4*2.99), daisy);
    float r = length(lf), ang = atan(lf.y, lf.x)/TAU*n + hx;
    vec2 dir = lf/max(r, 1e-3);
    float in_ = mix(.68, .8, daisy);
    vec4 outer = fRing(r, ang, n, 1.5, .3*daisy, .5);
    vec4 inner = fRing(r/in_, ang + .5, n, 1.5, .3*daisy, .5);
    vec2 rim = vec2(outer.x, inner.x*in_);
    outer.x = smoothstep(-aa, aa, outer.x); inner.x = smoothstep(-aa, aa, inner.x*in_);
    float mid = smoothstep(.2 + aa, .2 - aa, r/(.5 + .5*open));
    // petals: deep at the throat, pale at the tip, a dark mid-line; the far side of the cup takes the sun, the near side lets it through
    float thru = sat(.15 - dot(dir, lamp.xy)*1.2);
    vec3 glow = hue*hue*warm*thru*1.3;
    vec3 po = hue*mix(.4, 1., outer.z) + .08*outer.z*outer.z;
    po *= (.75 + .25*(1. - outer.y*outer.y))*(1. - .3/(1. + outer.y*outer.y*60.));
    po = po*(cool + warm*1.1*fLit(dir, outer.y, .9 - .5*open, lamp)) + glow*outer.z;
    po *= 1. - .5*smoothstep(1.25, .6, r/in_);      // the inner ring's shadow
    vec3 pi_ = hue*mix(.5, 1.15, inner.z) + .12*inner.z*inner.z;
    pi_ *= (.75 + .25*(1. - inner.y*inner.y))*(1. - .3/(1. + inner.y*inner.y*60.));
    pi_ = pi_*(cool + warm*1.1*fLit(dir, inner.y, 1.3 - .6*open, lamp)) + glow*inner.z;
    if (fInk > 0.) {
      float fine = smoothstep(.1, .03, aa);
      po = mix(po, fDrawn(hue, rim.x/max(aa, .02), outer.y, outer.z, fLit(dir, outer.y, .5, lamp), loud, fine), fInk);
      pi_ = mix(pi_, fDrawn(hue, rim.y/max(aa, .02), inner.y, inner.z, fLit(dir, inner.y, .9, lamp), loud, fine), fInk);
    }
    if (fGlass > 0.) {
      po = mix(po, hue*(.12 + 1.1*exp(-max(rim.x, 0.)*22.) + .25/(1. + outer.y*outer.y*60.))*(.4 + loud), fGlass);
      pi_ = mix(pi_, hue*(.2 + 1.3*exp(-max(rim.y, 0.)*22.) + .3/(1. + inner.y*inner.y*60.))*(.5 + loud), fGlass);
    }
    po += hue*ring*(fNight + .6*fDay + .3*fPale)*outer.z;
    pi_ += hue*ring*(fNight + .6*fDay + .3*fPale);
    po += hue*fNight*(.05 + .75*loud)*(.3 + .7*outer.z*outer.z);
    pi_ += hue*fNight*(.05 + .9*loud);
    // a closed flower is a green bud with a little colour showing
    vec3 bud = vec3(.04, .09, .03)*(cool + warm*.7);
    float shut = smoothstep(.45, .1, open)*(1. - .6*max(fInk, fGlass));
    po = mix(po, bud*(.6 + .6*outer.z), shut*.85); pi_ = mix(pi_, bud + .5*pi_, shut*.6);
    // the middle: a small gold dome
    vec3 mc = vec3(.85, .45, .06)*(cool + warm*(.25 + sat(dot(normalize(vec3(lf*3., 1.)), lamp))))*(.8 + .2*sin(lf.x*60.)*sin(lf.y*60.)*sat(1. - aa*8.));
    vec3 fc = mix(po, pi_, inner.x);
    fc = mix(fc, mc, mid*(1. - shut));
    fc += hue*warm*.3*loud*loud*(1. - shut);    // a sounding flower holds the light
    mc = mix(mc, mc*.5 + .1, fInk);
    float fa = max(max(outer.x, inner.x), mid)*there*(1. - fGlass*.55*(1. - mid));
    col += left*fa*mix(fc*shade, haze, fog);
    left *= 1. - fa;
    shade *= 1. - .6*(1. - .8*fGlass)*(1. - .4*max(fDay, fPale))*there*smoothstep(1.9, .5, length(lf - vec2(.35, -.5)));
    // the stem, going down into the shade
    vec2 sd = -rd.xz/abs(rd.y)*hk;
    float along = sat(dot(l, sd)/dot(sd, sd));
    float sw = .011 + px*t/F;
    float sa = smoothstep(sw, sw*.4, length(l - sd*along))*smoothstep(.75, .1, along)*there*step(.001, along)*(1. - fWater);
    col += left*sa*mix(mix(vec3(.03, .075, .025), vec3(.12), fInk)*(cool + warm*.7)*shade, haze, fog);
    left *= 1. - sa;
  }
  // their leaves, lower down
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float hk = .86 - .17*fk, ck = .72 - .05*fk;
    hk = mix(hk*(1. - .5*max(uOwn[1], 0.)), .12 - .02*fk, fWater);
    ck = mix(ck, .66, fRows)*many;
    mat2 turn = rot((.4 + fk*1.13)*(1. - fRows));
    vec2 off = mix(vec2(fk*7.3), vec2(fk*7., fk*7.25), fRows);
    float t = (hk*.3 - ro.y)/rd.y;
    vec2 gq = turn*(ro.xz + rd.xz*t)/ck + off;
    vec2 id = floor(gq);
    float hx = hash21(id + fk*31.7), hy = fract(hx*57.31), h3 = fract(hx*131.7), h4 = fract(hx*717.3);
    vec2 lf = ((gq - id - .5 - (vec2(hx, hy) - .5)*.16)*turn)/(.42*(.7 + .3*h4));
    float aa = (px*t/F)/(ck*.36);
    float r = length(lf), nl = 4. + floor(h3*3.99);
    vec4 leaf = fRing(r, atan(lf.y, lf.x)/TAU*nl + hy, nl, 1., 1., 1.);
    vec2 cl = (ro.xz + rd.xz*t);
    vec3 warm = sunny*(.4 + 1.*smoothstep(.5 - .35*uLevel, .75, noise(cl*.45 + vec2(uTime*.02, 0.))));
    vec3 lc = mix(vec3(.010, .04, .018), vec3(.035, .10, .03), leaf.z)*(.6 + .6*hx + .4*leaf.w);
    lc *= 1. + .6/(1. + leaf.y*leaf.y*30.);       // the vein down the middle
    if (fInk > 0.) lc = mix(lc, mix(vec3(.5, .52, .46), vec3(.06), max(.7*smoothstep(.06, .01, leaf.x), .5/(1. + leaf.y*leaf.y*60.))), fInk);
    vec2 cc = cl - lf*.42*(.7 + .3*h4);
    if (fWater > 0.) {                                     // round pads with a slit, lying on the water
      float pad = min(.95 - r, abs(lf.x*(hx - .5) + lf.y*(hy - .5))*2.5 + step(0., dot(lf, vec2(hy - .5, .5 - hx))) - .02);
      leaf = mix(leaf, vec4(pad, .5, r, .5), fWater);
      lc = mix(lc, vec3(.06, .15, .08)*(.6 + .8*hx)*(.8 + .5*r), fWater);
    }
    lc *= cool + warm*(.1 + 1.*fLit(lf/max(r, 1e-3), leaf.y, -.5, lamp));
    float fa = smoothstep(-aa, aa, leaf.x)*step(.12 + .25*fWater + fClump*smoothstep(.42, .6, noise(cc*.55 + 3.)), h3)*(1. - .6*fGlass);
    col += left*fa*mix(lc*shade, haze, 1. - exp(-t*.07*thin));
    left *= 1. - fa;
    shade *= 1. - .35*(1. - fGlass)*step(.12, h3)*smoothstep(1.4, .4, r);
  }
  // the ground: grass and shade
  float tg = -ro.y/rd.y;
  vec2 q = ro.xz + rd.xz*tg;
  float gr = noise(q*vec2(11., 6.));
  vec3 gc = mix(vec3(.003, .012, .007), vec3(.025, .06, .02), gr*gr)*(cool + sunny*.5);
  if (fPale > 0.) gc = mix(gc, vec3(.8, .78, .74)*(cool + sunny*.6)*(.85 + .2*noise(q*5.) + .1*noise(q*31.)), fPale);
  if (fWater > 0.) {
    float rip = noise(q*vec2(3., 5.) + vec2(0., uTime*.15)) + noise(q*vec2(7., 4.) - vec2(uTime*.11, 0.)) - 1.;
    gc = mix(gc, haze*(.12 + .2*smoothstep(-.5, .5, p.y))*(1. + .5*rip) + vec3(.002, .008, .01) + (sunny + air)*.12*pow(sat(.5 + .5*rip + .2*uLow), 8.), fWater);
    shade = mix(shade, .35 + .65*shade, fWater);
  }
  col += left*mix(gc*shade, haze, 1. - exp(-tg*.07*thin));
  // far off the meadow goes into the evening
  float py = p.y + .42*fLow - 2.*fDown;
  col = mix(col, haze, smoothstep(.25, .6, py)*(.8 - .5*fDay) + .2 *smoothstep(.6, .82, py));
  if (fLow > 0.) col = mix(col, haze, smoothstep(0., .3, fLow)*smoothstep(-.06, -.02, sky.y));
  col /= 1. + .8*dot(p, p);
  return col;
}
// Soft far lights behind the one bloom: other flowers, out of focus.
vec3 fBokeh(vec2 p, float n, float seed) {
  vec2 q = p*n + seed*7.7, id = floor(q), f = fract(q) - .5;
  float hx = hash21(id + seed), hy = fract(hx*57.31), h3 = fract(hx*131.7);
  float k = floor(h3*4.99);
  float lv = k < .5 ? uDrone : k < 1.5 ? uPad : k < 2.5 ? uTexture : k < 3.5 ? uPhrase : uHits;
  vec2 at = (vec2(hx, hy) - .5)*.4 + .05*vec2(sin(uTime*.11 + hx*30.), cos(uTime*.09 + hy*30.));
  float d = length(f - at);
  float rad = .12 + .12*fract(hx*717.3);
  float disc = smoothstep(rad, rad*.7, d)*(.55 + .45*smoothstep(rad*.4, rad*.95, d));
  vec3 c = uKind[int(k)];
  return c*c*disc*(.004 + .06*lv)*step(.4, hy);
}
// One row of the great flower's petals. They lie on a cone about the stem, th up from flat; far says which of the two
// places the eye's ray meets that cone is wanted (0 the near wall, seen from outside; 1 the far wall or the floor).
// Returns the light and how much of the pixel it covers; edge is how far inside a petal this is, for the shadow it lays.
vec4 fRow(vec3 ro, vec3 rd, float th, float far, float L, float n, float turn, vec3 base, float lv, float flare, float px, out float edge) {
  float c2 = tan(th); c2 *= c2;
  float A = rd.y*rd.y - c2*dot(rd.xz, rd.xz);
  float B = ro.y*rd.y - c2*dot(ro.xz, rd.xz);
  float C = ro.y*ro.y - c2*dot(ro.xz, ro.xz);
  float disc = B*B - A*C, sq = sqrt(max(disc, 0.));
  A = abs(A) < 1e-4 ? 1e-4 : A;
  float ta = (-B - sq)/A, tb = (-B + sq)/A;
  float t1 = min(ta, tb), t2 = max(ta, tb);
  float ok1 = step(0., t1)*step(0., ro.y + t1*rd.y), ok2 = step(0., t2)*step(0., ro.y + t2*rd.y);
  float t = far > .5 ? mix(t1, t2, ok2) : t1;
  float ok = step(0., disc)*(far > .5 ? max(ok1, ok2) : ok1*ok2);
  vec3 h = ro + rd*t;
  float s = length(h);
  vec4 e = fRing(s/L, atan(h.z, h.x)/TAU*n + turn, n, 1.3, .42, .35);
  edge = e.x*L*ok - (1. - ok);
  float aa = px*t*.7;
  float face = 1.;                                         // less of a petal seen edge on
  if (fLow > 0.) { face = abs(dot(vec3(-sin(th)*normalize(h.xz + 1e-5), cos(th)).xzy, rd)); aa /= mix(1., max(face, .12), fLow); face = mix(1., smoothstep(.02, .2, face), fLow); }
  float cover = smoothstep(-aa, aa, e.x*L)*ok*face;
  // the petal's own facing: the cone's, curled up at the edges and bent back toward the tip
  vec2 u = h.xz/max(length(h.xz), 1e-4);
  float st = sin(th), ct = cos(th);
  vec3 nrm = normalize(vec3(-st*u.x, ct, -st*u.y) - vec3(-u.y, 0., u.x)*e.y*.55 + vec3(ct*u.x, st, ct*u.y)*(e.z - .55)*.7);
  float under = step(0., dot(nrm, rd));                    // we are looking at its back
  nrm *= 1. - 2.*under;
  vec3 lamp = normalize(vec3(-.5, .4, .77));             // the sun is low, behind the flower and to the left
  lamp = normalize(mix(lamp, vec3(-.35, .9, -.2), fDay));
  float front = sat(dot(nrm, lamp)), thru = sat(-dot(nrm, lamp));
    float crease = 1. - .35/(1. + e.y*e.y*30.);
  vec3 alb = (base*mix(.10, 1., smoothstep(.15, 1., e.z)) + vec3(.10, .07, .05)*smoothstep(.75, 1., e.z))*crease;
  alb = mix(alb, alb*vec3(.55, .8, .5), under*(1. - e.z)*.8);          // the back is greener toward the stem
  vec3 warm = vec3(1., .72, .45)*(.7 + .3*uLevel);
  vec3 pc = alb*(vec3(.03, .05, .10) + warm*front*.62);
  pc += alb*base*warm*thru*(1. + 1.2*lv)*(.35 + .65*e.z);         // the sun coming through it
  pc += base*base*lv*.22*e.z*e.z;                                               // a sounding ring holds light of its own
  pc += (base + .12)*warm*smoothstep(.03*L, 0., e.x*L)*(.10 + .25*thru + .3*lv);   // the thin edge takes the light
  pc += (base + vec3(.3, .2, .1))*flare*(.3 + .7*e.z);
  if (fDay > 0.) pc = mix(pc, (base*mix(.5, 1., e.z) + .04*e.z)*crease*(vec3(.3, .33, .37) + vec3(1.05, 1., .92)*(front + .35*thru))*(.9 + .5*lv), fDay);
  if (fNight > 0.) pc = mix(pc, base*(.03 + .25*lv + .9*lv*e.z*e.z) + (base + .05)*smoothstep(.05*L, 0., e.x*L)*(.1 + .5*lv) + alb*vec3(.02, .04, .09)*front + base*flare, fNight);
  if (fInk > 0.) pc = mix(pc, fDrawn(base, e.x*L/max(px*t*1.3, .0035), e.y, e.z, front + .5*thru, lv, 1.) + base*flare, fInk);
  if (fGlass > 0.) {
    pc = mix(pc, (base + .03)*(.1 + .9*exp(-max(e.x, 0.)*L*60.) + .3*smoothstep(.4, 0., abs(fract(e.y*3.5 + .5) - .5))*(1. - e.z) + flare)*(.5 + 1.5*lv)*1.6, fGlass);
    cover *= 1. - fGlass*(.62 - .4*exp(-max(e.x, 0.)*L*60.));
  }
  return vec4(pc, cover);
}
vec3 fBloom(vec2 p) {
  float g = max(uHits, uCue);
  // behind: deep leaf green going to dusk, and far lights
  vec3 col = mix(vec3(.0004, .004, .003), vec3(.004, .0015, .008), smoothstep(-.5, .5, p.y + .3*p.x));
  col += vec3(.10, .03, .008)*exp(-length(p - vec2(-.85, .5))*2.6)*(.4 + 1.*uLevel);
  vec3 air = uKind[0]*uKind[0];
  if (fDay > 0.) col = mix(col, mix(air, vec3(1.), .15)*(.85 - .5*length(p - vec2(-.4, .35))), fDay);
  if (fNight > 0.) col *= 1. - .7*fNight;
  if (fPale > 0.) col = mix(col, mix(vec3(1.5, 1.44, 1.32), air*1.6, .2 + .5*fDay)*(1. - .35*length(p - vec2(-.35, .3)))*(.96 + .06*noise(p*60.))*mix(1., .25, fNight), fPale);
  col += (1. - fPale)*(fBokeh(p, 2.6, 1.) + fBokeh(p*rot(.5), 4.3, 2.)*.7);
  // the eye: a little above the flower's rim, drifting slowly round it
  const float F = 1.55;
  float el = .64 + .8*fDown - .5*fLow + .02*sin(uTime*.09), az = .3*sin(uTime*.045);
  vec3 ro = 1.85*(1. + (uOwn[1] > 0. ? .9 : .42)*uOwn[1])*vec3(sin(az)*cos(el), sin(el), -cos(az)*cos(el));
  vec3 fw = normalize(vec3(0., .03 + .2*fRows - .3*max(uOwn[1], 0.), 0.) - ro), ri = normalize(cross(vec3(0., 1., 0.), fw)), upv = cross(fw, ri);
  vec3 rd = normalize(fw*F + ri*p.x + upv*p.y);
  // the wind rocks the flower on its stem
  vec2 rock = (.01 + .035*uLow)*vec2(sin(uTime*.31), sin(uTime*.23 + 1.));
  mat2 rx = rot(rock.x), rz = rot(rock.y);
  ro.xy = rx*ro.xy; rd.xy = rx*rd.xy; ro.zy = rz*ro.zy; rd.zy = rz*rd.zy;
  float px = 1.3/uRes.y/F;
  // how far each ring of petals stands up: every ring opens with its own kind of sound, and an inner ring always stands inside the one round it
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, sat(uHits*1.2));
  float th[6];
  th[0] = 0.;
  for (int k = 0; k < 5; k++) {
    float open = sat(.06 + 1.2*lv[k] + .2*uLevel);
    th[k + 1] = th[k] + mix(k == 0 ? .42 + .5*fRows : k == 1 ? .17 + .1*fRows : .4, .115, open*(1. - .75*fRows))*(1. - .7*fClump)*(1.42 - th[k])/1.42;   // the two outer rings never stand higher than the eye
  }
  vec3 acc = vec3(0.);
  float left = 1., shade = 1., edge;
  // Eight rows of petals from the flattest to the most upright: two to each of the three outer rings (the under row
  // lies flatter and half a petal round), one to each of the two inner ones. First the near walls of the upright ones,
  // seen from outside and from the outside in; then the middle; then every row's far side from the inside out.
  for (int j = fRows > 0. ? -4 : 0; j < 12; j++) {
    int r = j < 4 ? j + 4 : 11 - j;
    int k = r < 6 ? r/2 : r - 3;
    float fk = float(k), row = r < 6 ? float(1 - (r & 1)) : 0.;
    float t = mix(th[k + 1], th[k] + .1*step(fk, .5), row*.42);
    float L = (.66 - .085*fk)*(.78 + .22*sat(lv[k]*1.5 + .3*uLevel))*(1. + .07*row);
    float n = max(9. - fk + floor(fNarrow*9. - fk*.5*fNarrow) - floor(fBroad*3.2), 3.);
    float turn = fk*.37 + .5*row + .03*sin(uTime*.13 + fk*1.7);
    vec3 kc = uKind[k]; kc = kc*kc*(.9 + kc);
    vec3 base = mix(mix(vec3(.16, .08, .11), kc, .5)*.4, kc, sat(.1 + 1.4*lv[k]))*(1. - .22*row);
    float fd = (1. - g)*5.5 - fk - .5 + .5*row;      // a hit: a ring of light going out through the petals
    float flare = sqrt(g)*exp(-fd*fd*.8)*.5;
    vec4 c = fRow(ro, rd, t, step(3.5, float(j)), L, n, turn, base, lv[k], flare, px, edge);
    acc += left*c.a*c.rgb*shade;
    left *= 1. - c.a;
    shade *= 1. - .55*(1. - fGlass)*(1. - .35*max(fInk, fDay))*smoothstep(-.09, .012, edge);   // the shadow each petal lays on those behind it
    if (j == 3) {
      // the middle: a gold dome of stamens, brighter with the mix
      vec3 oc = ro - vec3(0., .035, 0.);
      float b = dot(oc, rd), h = b*b - dot(oc, oc) + .0055;
      float ts = -b - sqrt(max(h, 0.));
      vec3 nn = normalize(oc + rd*ts);
      float core = smoothstep(0., .0008, h);
      float dots = .65 + .35*sin(nn.x*34.)*sin(nn.z*34.);
      acc += left*core*vec3(1., .5, .07)*dots*(.12 + .2*uLevel + .6*g + (.5 + .6*uLevel)*sat(dot(nn, normalize(vec3(-.5, .4, .77))) + .25))*shade;
      left *= 1. - core;
    }
  }
  // the stem below
  vec3 dn = vec3(0., -1., 0.);
  vec2 s0 = F*vec2(dot(-ro, ri), dot(-ro, upv))/dot(-ro, fw), s1 = F*vec2(dot(dn - ro, ri), dot(dn - ro, upv))/dot(dn - ro, fw);
  vec2 sd = s1 - s0;
  float al = max(dot(p - s0, sd)/dot(sd, sd), 0.);
  float ds = (p - s0 - sd*al).x + .03*al*al;
  float sw = .022;
  float stem = smoothstep(sw, sw - .004, abs(ds))*step(.001, al)*(1. - fWater)*(1. - fDown);
  acc += left*stem*mix(vec3(.03, .08, .03), vec3(.2), .5*fInk)*(.25 + 1.4*smoothstep(.2, -1., ds/sw)*vec3(1., .8, .5))*shade;
  left *= 1. - stem;
  if (fWater > 0.) {                                       // it floats: rings on the water and its own light in it
    vec3 w = ro - rd*(ro.y + .02)/min(rd.y, -.02);
    float d = length(w.xz), rip = sin(d*26. - uTime*.6)*exp(-d*1.6)*.5 + noise(w.xz*4. + uTime*.1) - .5;
    vec3 k = mix(uKind[1], uKind[2], sat(.5 + w.x));
    vec3 wc = (vec3(.004, .012, .016) + air*mix(.12, .8, fDay))*(1. + .7*rip)*(.45 + .55*smoothstep(.2, .9, d)) + k*k*(.04 + .22*uLevel)*exp(-(d - .62)*(d - .62)*9.)*(1. + rip);
    col = mix(col, wc, fWater*smoothstep(0., -.06, rd.y));
  }
  col = col*left + acc;
  // pollen a hit throws up from the middle
  vec2 po = p - s0 - vec2(0., .03);
  float pr = length(po), pa = atan(po.y, po.x)/TAU;
  vec2 pq = vec2(pa*46., pr*16. - (1. - g)*9.), pid = floor(pq);
  float ph = hash21(pid + 3.);
  vec2 pf = (fract(pq) - .5 - (vec2(ph, fract(ph*57.3)) - .5)*.6)*vec2(pr*TAU/46., 1./16.);
  col += vec3(1., .72, .28)*smoothstep(.006, .002, length(pf))*step(.8, ph)*sqrt(g)*smoothstep(.03, .1, pr)*smoothstep(.6, .2, pr)*1.6;
  col /= 1. + .95*dot(p, p);
  return col;
}
vec3 render(vec2 p) {
  vec3 col;
  fNarrow = max(uOwn[0], 0.); fBroad = max(-uOwn[0], 0.); fPale = max(uOwn[2], 0.); fWater = max(-uOwn[2], 0.);
  fDown = max(uOwn[3], 0.); fLow = max(-uOwn[3], 0.); fRows = max(uOwn[4], 0.); fClump = max(-uOwn[4], 0.);
  fInk = max(uOwn[5], 0.); fGlass = max(-uOwn[5], 0.); fDay = max(uOwn[6], 0.); fNight = max(-uOwn[6], 0.);
  fTwist = max(uOwn[7], 0.); fFrill = max(-uOwn[7], 0.);
  if (uVar < .5) col = fMeadow(p); else col = fBloom(p);
  return screenOf(col*1.1);
}
