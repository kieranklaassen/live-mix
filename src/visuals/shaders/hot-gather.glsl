// name: Hot gather
// a: At the bench
// b: Pulled thread
// what: A dim glass shop: an iron pipe over a bench carries a pear of molten glass, white-orange at the tip, rose, then bottle green at the neck, two bubbles inside, a bucket steaming below, firelit brick at the left; or two small figures in a dark hall pull one glowing thread between them, its light lying on the wet floor.
// follows: Drone is the heat of the glass, pad the furnace, the mix swells the bubble, low is the sag. The bands and the piece colour ribbons along the glass or the thread; texture is threads wound on, phrase lights the bubbles or a place on the thread. A hit drops a glowing bead in the water, a cue is one breath that fattens the glass, keys light the pipe.
// own: 0 a slim bottle at -1, a wide bowl at 1, or the thread drawn taut, or hung in a deep loop; 1 cobalt glass, blue walls and a teal dusk at -1, ruby glass, red walls and a sunset at 1; 2 deep night with the fire low at -1, a pale shop by day at 1; 3 stood far back at -1, close to the glass or to one of the two at 1; 4 unused below 0, a room full of steam at 1; 5 glass gone rose and cold at -1, white hot at 1
vec3 hgFire, hgGlow, hgSky, hgAmb, hgWall, hgCold; // light of furnace, glass, sky, room; wall, cold glass
float hgHeat, hgPx, hgHaze, hgSplash; // heat of the glass, a pixel, steam, a bead in the water
const vec2 HG_C = vec2(.33, .045), HG_B = vec2(.5, -.265); // the middle of the glass, the bucket's rim

// Softly 0 at a to 1 at b, either way round.
float hgUp(float a, float b, float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
float hgOn(float d) { return sat(.5 - d/hgPx); }
float hgBox(vec2 p, vec2 h) { p = abs(p) - h; return max(p.x, p.y); }
float hgCap(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 d = b - a; float h = sat(dot(p - a, d)/dot(d, d));
  return length(p - a - d*h) - mix(ra, rb, h);
}
// The light of glass at a heat: clear, rose, orange, nearly white.
vec3 hgEmit(float t) {
  vec3 c = vec3(.46, .035, .065)*hgUp(.06, .45, t);
  c = mix(c, vec3(1.25, .23, .03), hgUp(.40, .82, t));
  return mix(c, vec3(2.5, 1.15, .36), hgUp(.76, 1.2, t));
}
vec3 hgRich(vec3 c) { return max(mix(vec3(dot(c, vec3(.3, .59, .11))), c, 1.6), 0.); }
// Bricks: how far in, which, where across.
vec3 hgBricks(vec2 q, vec2 size, float px) {
  vec2 b = q/size; float row = floor(b.y);
  b.x += .5*mod(row, 2.);
  vec2 f = fract(b) - .5, e = (.5 - abs(f))*size;
  return vec3(hgUp(.001, .004 + px, min(e.x, e.y)), hash21(floor(b) + 43.), f.x);
}
float hgSteam(vec2 q, float size) {
  float s = 0.;
  for (int k = 0; k < 2; k++) {
    float f = fract(uTime/15. + .5*float(k));
    vec2 u = (q + vec2(.02*sin(q.y*11. - uTime*.23), 3. - .3*f))*size;
    s += (1. - abs(2.*f - 1.))*noise(u + .7*noise(u*.8) + 13.*float(k));
  }
  return hgUp(.2, 1., s);
}
// A room full of it.
vec3 hgFog(vec2 p, float far, vec2 w, float s) {
  return (hgFire*.6*exp(-length(p + vec2(.9, .1))*2.4) + hgGlow*.35*exp(-far*6.) + hgSky*exp(-length(p - w)*2.2) + hgAmb*1.4)*(.6 + .55*s);
}
// The light of small panes between bars.
float hgPanes(vec2 w, vec2 size, float bar) {
  vec2 v = w/size + vec2(.5, 0.), e = (.5 - abs(fract(v) - .5))*size;
  return hgUp(bar - hgPx, bar + hgPx, min(e.x, e.y))*(.6 + .55*hash21(floor(v) + 50.));
}

// ---- a: the shop
float hgPipeY(float x) { return .094 - .1*x; }
vec3 hgShop(vec2 q) {
  vec2 g = q - HG_C, f = q - vec2(-1.05, -.12);
  float soot = .6*noise(q*vec2(4., 3.)) + .4*noise(q*vec2(23., 13.) + 5.), r2 = dot(g, g);
  // the wall behind, darker up under the roof
  vec3 light = hgFire*.15/(1. + 7.*dot(f, f)) + hgGlow*.15/(1. + 26.*r2);
  light += hgAmb*(.4 + .9*sat(.5 + q.x*.7));
  light *= 1. - .6*hgUp(.1, .55, q.y);
  vec3 col = hgWall*(.45 + 1.1*soot)*light;
  // the window, cut by the upper edge
  vec2 w = q - vec2(.665, .375);
  col = mix(col, hgWall*(hgAmb*.5 + hgGlow*.02 + hgSky*.4*hgUp(.1, -.3, w.x + w.y)), hgOn(hgBox(w, vec2(.165, .225))));
  col = mix(col, hgSky*(.35 + 1.1*hgUp(-.22, .3, w.y - .5*w.x))*hgPanes(w, vec2(.0933, .1), .003), hgOn(hgBox(w, vec2(.14, .2))));
  // tools hung on a rail
  float tool = hgBox(q - vec2(-.02, .352), vec2(.4, .004));
  tool = min(tool, hgCap(q, vec2(-.3, .34), vec2(-.318, .17), .006, .009));
  tool = min(tool, hgCap(q, vec2(-.29, .34), vec2(-.272, .17), .006, .009));
  tool = min(tool, min(hgBox(q - vec2(.065, .3), vec2(.006, .045)), hgBox(q - vec2(.067, .2), vec2(.026, .055))));
  col = mix(col, light*.04 + hgGlow*.025*hgUp(-.006, 0., tool)/(1. + 10.*r2), hgOn(tool));
  // the floor: worn brick, wet about the bucket
  float fy = -.205 - q.y;
  if (fy > -hgPx) {
    float z = 1./(.02 - min(q.y, -.19));
    vec2 fp = vec2(q.x*z, z*1.15);
    vec3 b = hgBricks(fp, vec2(.42, .2), hgPx*z*z*.3);
    float wet = hgUp(.35, .7, noise(fp*1.7));
    vec2 fl = vec2(q.x + .95, (q.y + .42)*2.2), gl = vec2(q.x - .36, (q.y + .36)*2.4), sh = vec2(q.x - .5, q.y + .455), ss = q + vec2(.12, .415);
    vec3 lit = hgFire*.75*exp(-dot(fl, fl)*2.6) + hgGlow*.26*exp(-dot(gl, gl)*7.) + hgAmb*.7;
    // shadows of the bucket and the bench, away from the furnace
    float dark = hgUp(-.05, .03, sh.x)*hgUp(.05, .02, abs(sh.y))*exp(-max(sh.x, 0.)*1.8);
    dark = max(dark, .8*hgUp(-.32, -.2, ss.x)*hgUp(.5, 0., ss.x)*hgUp(.05, .01, abs(ss.y)));
    lit *= 1. - .8*dark;
    vec3 fc = mix(vec3(.2, .13, .1), hgWall, .45)*(.5 + .8*b.y)*mix(.5, 1., b.x)*(.5 + noise(fp*9.))*lit;
    float sx = (q.x - .36)*6., wx = (q.x - .66)*6.5;
    fc += (hgGlow*.17*exp(-sx*sx - abs(q.y + .38)*5.) + hgSky*.22*exp(-wx*wx))*wet*(.3 + .7*b.x)*(1. - .6*dark);
    col = mix(col, fc, sat(fy/hgPx + .5));
  }
  // the bench: two rails on posts with their depth, a seat between
  float x = q.x + .285, px = x - (x < 0. ? -.165 : .165), top = hgPipeY(q.x) - .017;
  float post = max(abs(px - .013) - .04, max(q.y - top, -.44 - q.y));
  float seat = hgBox(vec2(x - .006, q.y + .222), vec2(.215, .034)), all = min(post, seat);
  if (all < .01) {
    bool plank = seat < hgPx*.5;
    float grain = noise(plank ? vec2(q.x*5. + 9., q.y*70.) : vec2(q.x*95., q.y*4.));
    float edge = plank ? hgUp(-.2, -.192, q.y) : hgUp(-.012, -.026, px), deep = plank ? 0. : hgUp(.024, .03, px);
    vec3 bl = hgFire*(.05 + .65*edge)*(1. - .7*deep)/(1. + 3.*dot(f, f)) + hgAmb*.5 + hgGlow*(.02 + .08*deep)/(1. + 7.*r2);
    vec3 bc = vec3(.26, .16, .09)*(.25 + 1.3*grain)*bl;
    float cap = max(abs(px - .013) - .045, abs(q.y - top + .01) - .012); // iron on the rails
    bc = mix(bc, .2*bl + (hgFire*.14 + hgAmb)*hgUp(.004, .001, abs(q.y - top + .002)), hgOn(cap));
    col = mix(col, bc, hgOn(min(all, cap)));
  }
  // the furnace's front: a ring of bricks round the mouth, courses beyond it
  float fd = q.x + .6 + .012*noise(vec2(q.y*21. + 60., 2.));
  if (fd < hgPx) {
    vec2 m = vec2(q.x + 1.32, q.y - .03);
    float ring = length(vec2(m.x, max(m.y, 0.))) - .4, a = m.y > 0. ? atan(m.y, m.x + (m.x < 0. ? -1e-3 : 1e-3))*.4 : m.y;
    vec3 b = ring > 0. && ring < .085 ? hgBricks(vec2(ring*.5 + .06, a), vec2(.3, .047), hgPx) : hgBricks(q + .01, vec2(.125, .052), hgPx);
    float n = noise(q*46.)*.5 + noise(q*13.)*.5;
    float face = mix(.22, 1., b.x)*(.15 + 1.1*n)*(.45 + .75*b.y)*(1. - .6*hgUp(0., .5, b.z));
    vec3 bl = hgFire*(2.5*exp(-max(ring, 0.)*13.) + .05)*(.45 + .55*hgUp(.55, -.2, q.y)) + hgAmb*.5 + hgGlow*.015;
    vec3 fc = vec3(.5, .25, .16)*(.06 + 1.15*face)*bl;
    fc += hgFire*1.5*hgUp(.012, 0., abs(ring - .004))*(.4 + .6*b.x); // the hot edge
    float in_ = hgUp(0., -.36, ring); // the mouth, seen in a wide room
    fc = mix(fc, hgFire*mix(vec3(.9, .55, .3)*(.6 + .4*b.x), vec3(2.6, 2.2, 1.5), in_)*(.8 + .4*noise(q*vec2(9., 5.))), hgOn(ring));
    col = mix(col, fc*(.3 + .7*hgUp(0., -.06, fd)), sat(.5 - fd/hgPx));
  }
  // the bucket of water under the glass
  vec2 o = q - HG_B;
  float hw = .128 + .11*max(o.y, -.3), nz = sqrt(sat(1. - o.x*o.x/(hw*hw))), y = o.y + .036*nz;
  float body = max(abs(o.x) - hw, max(o.y, -.185 - y)), rim = (length(o/vec2(.128, .034)) - 1.)*.034;
  float cover = hgOn(min(body, rim));
  if (cover > 0.) {
    float nx = clamp(o.x/hw, -1., 1.), an = asin(nx), st = an*4.4 + .5;
    float stave = hgUp(0., .1, abs(fract(st) - .5))*(.75 + .4*hash11(floor(st - .5) + 20.))*(.6 + .7*noise(vec2(an*22. + 60., q.y*9.)));
    float hoop = max(hgUp(.016, .012, abs(y + .045)), hgUp(.016, .012, abs(y + .14)));
    vec3 l = hgFire*.55*pow(sat(.25*nz - nx*.85), 1.4) + hgGlow*.13*sat(.75 + 4.*o.y)*nz + hgAmb*(.35 + .5*sat(nx));
    vec3 c = mix(vec3(.34, .2, .11)*stave, vec3(.13, .12, .12), hoop)*l;
    c = mix(c, vec3(.34, .21, .12)*(hgFire*(.28 - 1.6*o.x) + hgGlow*.3 + hgAmb), hgOn(rim));
    // its inside, and the glow lying in the water
    vec3 inner = vec3(.2, .12, .07)*(hgFire*sat(.1 + 3.*o.x)*.6 + hgGlow*.1);
    float wave = sin(length(o*vec2(1., 4.2))*130. - uTime*2.2)*(.12 + .6*hgSplash);
    vec2 r = (o + vec2(.04, .01))*vec2(1., 5.);
    vec3 water = hgGlow*(.55 + .4*wave)*exp(-dot(r, r)*190.) + hgSky*.1*(1. + wave) + hgFire*hgSplash*1.8*exp(-dot(o, o*vec2(1., 9.))*90.);
    inner = mix(inner, water, hgOn((length((o + vec2(0., .01))/vec2(.111, .022)) - 1.)*.022));
    col = mix(col, max(mix(c, inner, hgOn((length(o/vec2(.114, .026)) - 1.)*.026)), 0.), cover);
  }
  return col;
}
vec3 hgBench(vec2 p) {
  float form = uOwn[0], slim = max(-form, 0.), fat = max(form, 0.);
  float swell = .035*sin(uTime*.37) + .12*uLevel + .4*uCue*(1. - uCue) + .05*uMic;
  // the pear of glass: q along and across it, r2 its radius squared
  float ang = -.09 + .012*sin(uTime*.21), fall = 1. - sat(uHits);
  vec2 q = rot(-ang)*(p - vec2(.045, hgPipeY(.045)));
  float len = .49 + .16*uCue*(1. - uCue) - .1*fat + .1*slim, u = q.x/len, uu = clamp(u, 1e-3, 1.2);
  q.y += (.018 + .012*sin(uTime*.29) + .032*uLow)*u*abs(u)*(.5 + .5*uu);
  float big = (.13 + .075*fat - .055*slim)*(1. + swell), pw = 2.3 + 3.2*slim - 1.3*fat;
  float up = big*big*(1. + pw)*pow((1. + pw)/pw*uu, pw), rise = .0006*sat(q.x/.014);
  float r2 = (1. - u)*(rise + up), dr = ((1. - uu)*pw*up/uu - rise - up)/len;
  float d = (q.y*q.y - r2)/(length(vec2(dr, 2.*q.y)) + .012);
  if (u < 0.) d = max(d, -q.x);
  float cover = hgOn(d), h = sqrt(max(r2 - q.y*q.y, 0.)), rr = clamp(q.y/sqrt(max(r2, 1e-5)), -1., 1.);
  vec3 N = normalize(vec3(-.5*dr, q.y, h + 1e-4));
  N.xy = rot(ang)*N.xy;
  hgSplash = uHits*hgUp(.35, .6, fall);
  // all behind the glass, seen through it upside down
  vec3 col = hgShop(p - N.xy*(.1 + 1.5*h)*cover*hgUp(0., .1, u));
  // steam over the water, and through the room
  vec2 so = p - HG_B;
  float sx = (so.x - .12*so.y)/(.055 + .22*max(so.y, 0.)), st = exp(-sx*sx)*hgUp(-.02, .05, so.y)*hgUp(.45, 0., so.y)*(.35 + .4*uSpace + .3*uMid + 1.6*hgSplash);
  if (st + hgHaze > .004) {
    float s = hgSteam(so, 7.), thick = hgHaze*(.35 + .65*s)*hgUp(.75, -.35, p.y);
    col += st*s*(hgFire*.1*(1. - so.x) + hgGlow*.13 + hgAmb*.7);
    col = mix(col, hgFog(p, max(d, 0.), vec2(.66, .4), s), thick);
  }
  // the pipe
  float v = (p.y - hgPipeY(p.x))/.0115, pd = max(abs(v)*.0115 - .0115, p.x - .075);
  if (pd < .01) {
    v = clamp(v, -1., 1.);
    float tw = .4 + .2*sin(p.x*70. + asin(v) - mod(uTravel*.4, TAU)) + .3*uKeys;
    vec3 pc = (hgAmb*1.3 + hgSky*.35 + hgFire*.1*exp(-(p.x + .9)*1.6))*hgUp(.35, 0., abs(v - .5))*tw;
    pc += hgAmb*.08 + hgFire*.16*hgUp(.1, -.9, v)*exp(-max(p.x + .8, 0.)*2.2) + vec3(.7, .07, .015)*exp(-max(.05 - p.x, 0.)*18.)*(1. - .6*v*v)*.5*hgHeat;
    col = mix(col, pc, hgOn(pd));
  }
  col += hgGlow*.05*exp(-max(d, 0.)*12.)*(1. - cover);
  if (cover > 0.) {
    float turn = mod(uTravel*.3, TAU), lean = u + .3*h, th = 2.*h, ph = asin(rr), skin = 1. - sqrt(sat(1. - rr*rr));
    // two bubbles in it
    vec2 b1 = (q - vec2(len*.62, .006))/(vec2(.115 + .02*slim, .4*big)*(.8 + 1.1*swell + .35*uMic)), b2 = (q - vec2(len*.33, .004*sin(turn)))/vec2(.026, .0125);
    float k1 = dot(b1, b1), k2 = dot(b2, b2), in1 = hgUp(1.03, .97, k1), in2 = hgUp(1.1, .9, k2);
    th = max(th - .09*sqrt(max(1. - k1, 0.)) - .03*sqrt(max(1. - k2, 0.)), .006);
    float T = hgHeat*(.02 + 1.2*hgUp(.1, 1., u)) - .22*skin + .05*(noise(vec2(u*7. + 30., ph*1.6 + 4.)) - .5);
    vec3 gl = col*exp(-th*(1. - hgCold)*11.)*(1. - .75*hgUp(.2, .7, T));
    gl += hgCold*hgCold*(hgAmb*.8 + hgGlow*.05*hgUp(0., .25, u) + hgFire*.04)*(.3 + 1.4*skin)*hgUp(.5, .15, T);
    vec3 em = hgEmit(T)*(1. - exp(-th*11.));
    // ribbons twisted along it, near side and far, and threads wound on
    for (int k = 0; k < 2; k++) {
      float a = (k == 0 ? ph : PI - ph) + lean*4.2 + turn, s = fract(a/TAU)*6., id = floor(s), y = abs(fract(s) - .5);
      vec4 m = piece(vec2(sat(u), (id + .5)/6.));
      float lv = sat(.12 + .7*band((id + .5)/6.) + .5*m.a*(.6 + uEnergy));
      float on = (1. - hgUp(.04, .17 + .14*lv, y))*lv*(k == 0 ? .8 : .3)*hgUp(.08, .3, u)*hgUp(.95, .6, u);
      vec3 hue = hgRich(mix(kindColour(id*.8), m.rgb/max(m.a, .01), sat(m.a*8.)));
      hue *= hue;
      gl = mix(gl, gl*hue*1.6 + hue*(.02 + .2*hgAmb), on);
      em = mix(em, em*mix(vec3(.35), vec3(.2) + 1.3*hue, .6), on);
      float w = abs(fract(lean*17. + a/TAU) - .5), on2 = hgUp(.15, .05, w)*hgUp(.14, .24, u)*hgUp(.78, .5, u)*(.06 + 1.1*sqrt(uTexture))*(k == 0 ? 1. : .3);
      hue = hgRich(uKind[2]);
      gl = mix(gl, hue*(hgAmb + hgGlow*.1 + .02), sat(on2));
      em = mix(em, hue*hue*(.1 + .7*em.r), sat(on2*.9));
    }
    gl += em;
    // the bubbles: dark above, a bright crescent low, points of light
    float wall1 = in1*hgUp(.45, 1., k1), wall2 = in2*hgUp(.3, 1., k2);
    vec3 song = hgRich(uKind[3])*uPhrase;
    gl *= 1. - .6*wall1*hgUp(-.6, .8, b1.y);
    gl += song*(.25*exp(-k1*.8) + .4*exp(-k2*.35));
    gl += (hgEmit(T + .22)*.7 + song)*wall1*hgUp(.3, -.9, b1.y) + em*wall2*hgUp(.2, -.8, b2.y);
    gl += (hgSky*2. + hgFire*.4 + song)*(in1*hgUp(.13, .05, length(b1 - vec2(-.45, .48))) + in2*hgUp(.5, .2, length(b2 - vec2(-.2, .3))))*.8;
    // and what its skin mirrors: the mouth on the left, the window
    vec2 R = 2.*N.z*N.xy, wr = R - vec2(.26, .64), pane = abs(fract(wr*vec2(4.6, 4.2) + .5) - .5);
    float fr = .05 + .95*pow(sat(1. - N.z), 4.), shine = .7 + .6*uTone + .6*uKeys;
    gl += hgFire*1.2*hgUp(.45, .8, -R.x)*hgUp(.8, .3, abs(R.y + .1))*(fr + .1)*shine;
    gl += (hgSky*2.1 + .03)*hgUp(.02, -.02, hgBox(wr, vec2(.17, .16)))*hgUp(.02, .07, min(pane.x, pane.y))*hgUp(.68, .76, N.z)*shine;
    gl += (hgAmb*(1. + N.y) + hgSky*.5*sat(N.x + N.y))*fr;
    col = mix(col, gl, cover);
  }
  // a hit: a bead lets go of the tip and drops in the bucket
  if (uHits > .01) {
    vec2 bo = p - vec2(HG_B.x - .005, HG_C.y - .075 - 1.15*fall*fall);
    float bd = length(bo*vec2(1., .8)) - .016, air = hgUp(-.02, .005, p.y - bo.y - HG_B.y);
    col += vec3(1.9, .6, .12)*air*.6*exp(-max(bd, 0.)*40.);
    col = mix(col, vec3(3., 1.6, .6), hgOn(bd)*air);
  }
  return col;
}

// ---- b: the long hall
const float HG_EYE = -.19, HG_HOR = -.067; // the foot of the wall, the eye's height
float hgSag;
float hgFoot(float x) { return -.261 + .0204*x; }
float hgThreadY(float s) { return -.067 - hgSag*(1. - s*s); }
// Someone from the side, a pipe in both hands; st is how wide the legs stand.
float hgFigure(vec2 q, float st) {
  vec2 l = vec2(-.016*st, 0.);
  float d = hgCap(q, vec2(-.008, .115), vec2(-.03, .058) + l, .021, .015);
  d = min(d, hgCap(q, vec2(-.03, .058) + l, vec2(-.052, .008) + l, .015, .01));
  d = min(d, hgCap(q, vec2(-.054, .006) + l, vec2(-.03, .004) + l, .008, .005));
  d = min(d, hgCap(q, vec2(.002, .115), vec2(.022, .06) - l, .022, .016));
  d = min(d, hgCap(q, vec2(.022, .06) - l, vec2(.018, .008) - l, .016, .01));
  d = min(d, hgCap(q, vec2(.016, .006) - l, vec2(.042, .004) - l, .008, .005));
  d = smin(d, hgCap(q, vec2(.01, .135), vec2(.018, .068), .02, .024), .006);
  d = smin(d, hgCap(q, vec2(-.004, .125), vec2(-.02, .185), .026, .031), .012);
  d = min(d, hgCap(q, vec2(-.022, .198), vec2(-.034, .152), .017, .012));
  d = min(d, hgCap(q, vec2(-.034, .152), vec2(.01, .144), .012, .008));
  d = smin(d, hgCap(q, vec2(-.014, .196), vec2(.018, .16), .017, .012), .004);
  d = smin(d, hgCap(q, vec2(.018, .16), vec2(.06, .171), .012, .008), .003);
  d = smin(d, hgCap(q, vec2(-.014, .208), vec2(-.004, .238), .013, .017), .006);
  return min(d, hgCap(q, vec2(-.012, .25), vec2(.018, .247), .013, .003));
}
// The wall of brick and windows, the furnace and its hood at the left.
vec3 hgFar(vec2 q) {
  vec2 m = q - vec2(-.7, -.13);
  float fire = length(vec2(m.x, max(m.y, 0.))), x = q.x/.42 - .26, cell = floor(x), n = noise(q*vec2(6., 4.));
  vec3 b = hgBricks(q, vec2(.07, .026), hgPx);
  float s = clamp((q.x - .01)/.61, -1., 1.), th = length(vec2(q.y - hgThreadY(s), max(abs(q.x - .01) - .61, 0.)));
  vec2 g = vec2(abs(q.x - .01) - .6, q.y - HG_HOR);
  vec3 near = hgGlow*(.03/(1. + 10.*th + 130.*th*th) + .26/(1. + 45.*dot(g, g) + 8.*length(g)));
  vec3 col = hgWall*(.25 + 1.1*n)*mix(.7, 1., b.x)*(.75 + .4*b.y)*(hgAmb*(.5 + .9*sat(q.x + .5)) + near + hgFire*.35*exp(-fire*5.));
  vec2 w = vec2((fract(x) - .5)*.42, q.y - .185);
  float bow = w.y - .185 + 1.8*w.x*w.x, seen = hgUp(-1.5, -1., cell);
  col = mix(col, col*.4 + hgSky*.05*hgUp(0., .1, -w.x), hgOn(max(max(abs(w.x) - .095, bow), -.2 - w.y))*seen);
  w.x -= .007;
  vec3 pane = hgSky*(.4 + .6*n)*(.35 + hgUp(-.2, .25, w.y))*(.45 + .75*hgUp(-.5, .9, q.x))*hgPanes(w + vec2(.054*99.*cell, 0.), vec2(.054, .062), .0015);
  col = mix(col, pane, hgOn(max(max(abs(w.x) - .081, bow + .016), -.186 - w.y))*seen);
  float hood = abs(q.x + .7) - .16 + .1*hgUp(.02, .22, q.y);
  col = mix(col, hgWall*vec3(.8, .55, .42)*(.3 + .7*b.x)*(.5 + n)*(hgFire*.55*exp(-fire*8.) + near*.6 + hgAmb*.5), hgOn(hood));
  float mouth = max(length(vec2(m.x, max(m.y - .015, 0.))) - .075, -.015 - m.y);
  col = mix(col, hgFire*(1.2 + 1.8*hgUp(0., -.06, mouth))*vec3(1., .95, .8), hgOn(mouth));
  return col + hgFire*.1*exp(-fire*9.);
}
vec3 hgHall(vec2 p) {
  hgSag = .062 + .006*sin(uTime*.23) + .028*uLow + (uOwn[0] > 0. ? .085 : .056)*uOwn[0];
  hgGlow *= 1. + (uOwn[0] > 0. ? .9 : .55)*uOwn[0];
  vec2 q = p, f = p, fp = vec2(p.x, 1.)/(HG_HOR - min(p.y, -.15));
  float wet = 0., rip = 0.;
  if (p.y < HG_EYE) {
    wet = hgUp(.22, .62, noise(fp*vec2(1.1, 1.)));
    rip = noise(fp*vec2(2., 4.)) - .5;
    // a hit drops a bead, and a ring runs out over the wet
    float rk = length(vec2(p.x - .1, (p.y + .36)*3.)) - .03 - .3*(1. - uHits);
    rip += 2.4*uHits*(1. - uHits)*sin(rk*90.)*exp(-rk*rk*600.);
    q = vec2(p.x + .01*rip, 2.*HG_EYE - p.y + .014*rip);
  }
  vec3 col = hgFar(q), b = vec3(1.);
  float ft = hgFoot(p.x), mir = p.y < ft ? 1. : 0., ends = exp(-(1. - min(abs(p.x - .01)/.61, 1.))/.2);
  if (p.y < HG_EYE + hgPx) {
    b = hgBricks(fp + vec2(0., 20.), vec2(1.1, .62), hgPx*fp.y*fp.y*.3);
    vec2 fl = vec2(p.x + .68, (p.y + .24)*2.2);
    float dz = (p.y - ft + .02)*4.;
    vec3 lit = hgFire*.6*exp(-dot(fl, fl)*9.) + hgGlow*(.05 + .3*ends)*exp(-dz*dz) + hgAmb*.8;
    // laths for the cold thread to rest on
    float lath = abs(fract(fp.x/.62) - .5)*.62 - .045, lz = abs(fp.y - 1./(HG_HOR - ft)) - .62;
    float on = hgUp(hgPx*fp.y*2., 0., max(lath, lz))*hgUp(.54, .5, abs(p.x));
    vec3 base = mix(mix(vec3(.11, .095, .085), hgWall, .3)*mix(.4, 1., b.x)*(.7 + .6*b.y), vec3(.28, .19, .12), on)*lit;
    col = mix(col, base + col*(.06 + .62*wet)*mix(.3, 1., b.x)*(1. - .9*on), sat((HG_EYE - p.y)/hgPx + .5));
    wet *= 1. - .8*on;
  }
  // all that stands before the wall, and below their feet its mirror image
  if (mir > .5) f = vec2(p.x + .01*rip, 2.*ft - p.y + .014*rip);
  float keep = mix(1., (.1 + .7*wet)*mix(.35, 1., b.x), mir), s = (f.x - .01)/.61, e = (1. - abs(s))*.61;
  for (int k = 0; k < 2; k++) {
    float sd = k == 0 ? 1. : -1., size = k == 0 ? 1. : .86, gx = k == 0 ? -.6 : .62;
    vec2 o = (f - vec2(gx - sd*.135*size, hgFoot(gx - sd*.135)))/size;
    o.x = o.x*sd + (.1*float(k) + .02*sin(uTime*.31 + 2.*float(k)))*o.y*hgUp(0., .2, o.y);
    if (abs(o.x) < .12 && o.y > -.02 && o.y < .28) {
      float st = float(k), d = hgFigure(o, st)*size;
      if (d < .006) {
        vec2 to = vec2(.17, .215) - o;
        float d2 = hgFigure(o + to/(length(to) + 1e-3)*.006, st)*size, rim = sat((d2 - d)/.006)*hgUp(-.012, -.001, d);
        vec3 c = hgAmb*.05 + hgGlow*(.55*rim*rim + .02*hgUp(-.02, .06, o.x))/(1. + 70.*dot(to, to));
        if (k == 0) c += hgFire*.14*hgUp(-.006, -.001, d)*sat(1. - 2.*rim);
        col = mix(col, c, hgOn(d)*mix(1., .9*keep + .08, mir));
      }
    }
    // the pipe in their hands
    vec2 g = vec2(gx, -.067);
    float pd = hgCap(f, g + vec2(-sd*.185, -.095)*size, g, .0032, .0032);
    col = mix(col, hgAmb*.15 + hgGlow*(.02 + .5*exp(-length(f - g)*30.) + .12*uKeys), hgOn(pd)*keep);
  }
  // the thread: hot at both ends, cold in the middle
  float turn = mod(uTravel*.5, TAU), el = max(e, 0.);
  vec4 m = piece(vec2(.5 + .49*s, .84)) + piece(vec2(.5 + .49*s, .5)) + piece(vec2(.5 + .49*s, .2));
  float nw = (.5 + .5*s - uLoop)*14., run = (abs(s) - 1.2*uCue)*6., lp = sin(PI*uLoop);
  float T = hgHeat*(.08 + 1.02*exp(-el/.15) + .22*band(sat(.5 + .5*s))) + .3*exp(-nw*nw)*lp*lp*(.2 + 2.6*uPhrase) + .7*uCue*exp(-run*run);
  float w = (.027 + .009*max(uOwn[0], 0.) + .07*uCue*(1. - uCue) + .006*uLevel)*sqrt(sat(el/.035))*(exp(-el*el/.0035) + .2*exp(-el/.12)) + .0018;
  float y = f.y - hgThreadY(s), slope = 2.*hgSag*s/.61, d = abs(y)/sqrt(1. + slope*slope), v = clamp(y/w, -1., 1.);
  vec3 c = hgEmit(T)*1.4 + hgCold*vec3(.8, .85, .85)*(.15 + hgSky*.5)*(1. - .92*max(uOwn[2], 0.))*hgUp(.5, .1, T);
  if (m.a > .01) c += hgRich(m.rgb/m.a)*.2*sat(m.a)*(.4 + .8*uEnergy)*hgUp(.02, .25, e);
  vec3 air = c;
  float tw = sin(asin(v) + f.x*110. + (s < 0. ? turn : -turn));
  c = mix(c, c*(.2 + 1.7*hgRich(uKind[2])), hgUp(-.1, .7, tw)*(.2 + .8*uTexture)*hgUp(.001, .004, w));
  c += (hgSky*.8 + .06)*hgUp(.35, 0., abs(v - .5))*hgUp(.003, .01, w);
  col += air*exp(-d*32.)*.13*keep*sat(1. + e/.03);
  col = mix(col, c, sat((w - d)/hgPx + .5)*sat(w/hgPx*1.5)*sat(e/hgPx + .5)*keep);
  // the bead of a hit, where it meets the wet
  float bd = length(vec2(p.x - .1, (p.y + .36)*2.2));
  col += vec3(1.9, .6, .12)*uHits*(1.2*exp(-bd*70.) + .35*exp(-bd*14.));
  if (hgHaze > 0.) {
    float st = hgSteam(p, 5.);
    col = mix(col, hgFog(p, length(vec2(abs(p.x - .01) - .6, p.y - HG_HOR)), vec2(.5, .2), st), hgHaze*(.35 + .65*st)*hgUp(.6, -.35, p.y));
  }
  return col;
}

vec3 render(vec2 p) {
  float asp = uRes.x/uRes.y, day = max(uOwn[2], 0.), night = max(-uOwn[2], 0.), glass = uOwn[1];
  vec3 green = vec3(.36, .86, .56);
  hgHeat = .8 + .035*sin(uTime*.17) + (.23*uDrone + .04*uLevel)*(.6 + .8*uEnergy) + .06*(uTone - .5) + .06*uCue + (uOwn[5] < 0. ? .45 : .25)*uOwn[5];
  hgFire = vec3(1., .4, .115)*(.62 + .04*sin(uTime*.7) + .03*sin(uTime*1.13) + .8*uPad*(.5 + uEnergy))*(1. - .6*night);
  hgGlow = hgEmit(hgHeat*.92)*.9 + vec3(.9, .35, .1)*(.25*uHits + .3*uCue);
  float blue = max(-glass, 0.), rose = max(glass, 0.);
  vec3 dusk = mix(mix(vec3(.06, .105, .17), vec3(.03, .16, .24), blue), vec3(.5, .13, .075), rose);
  hgSky = mix(mix(dusk, vec3(.8, .9, 1.), day), vec3(.012, .02, .05), night);
  hgAmb = mix(mix(vec3(.011, .015, .023), vec3(.3, .325, .335), day), vec3(.007, .009, .018), night)*(1. + .4*uLevel);
  hgWall = mix(mix(vec3(.3, .235, .19), vec3(.15, .3, .46)*.9, blue), vec3(.42, .17, .18), rose)*(1. + day) + day*vec3(.05, .13, .17);
  hgCold = mix(mix(green, vec3(.24, .45, .98), blue), vec3(.95, .4, .62), rose);
  hgHaze = .85*max(uOwn[4], 0.);
  float z = uVar > .5 ? clamp(asp/1.66, .34, 1.)*(1. + (uOwn[3] > 0. ? 1.1 : .45)*uOwn[3]) : clamp(asp/1.25, .5, 1.)*exp2((uOwn[3] > 0. ? .8 : .55)*uOwn[3]);
  hgPx = 1.3/(uRes.y*z);
  if (uVar > .5) return screenOf(hgHall((p + vec2(0., .1))/z + vec2(-.44*max(uOwn[3], 0.), -.1))*1.6);
  vec2 to = mix(vec2(mix(.06, HG_C.x, hgUp(.5, 1.2, asp)), HG_C.y), vec2(.02, 0.), max(uOwn[3], 0.));
  return screenOf(hgBench((p - to)/z + HG_C)*1.5);
}
