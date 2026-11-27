// name: Walking village
// a: Low tide
// b: Among the legs
// what: A wide wet flat at evening, and across it a few fishing sheds on thin jointed legs going from right to left, each lifting one foot at a time out of its reflection, the nearest so near that only its legs and floor are seen; or deep dusk low down in the herd, plank floors overhead with light falling through the gaps.
// follows: Travel is the walk. Each kind has a shed: its window and smoke take that colour and brighten. Loud bends the knees, drone brings water, texture roughens it, phrase passes a nod down the line, bands thicken smoke, keys light panes. A hit lifts the near foot and sends a ring, a cue makes all crouch. The loop swings the lantern; the piece lies on the flat.
// own: 0 pale grey morning at -1, clear night at 1 (in b red sunset, silver moon); 1 bare ribbed sand at -1, flood water at 1; 2 short stout legs at -1, very tall ones at 1; 3 one shed alone at -1, all five side by side at 1; 4 eye down by the mud at -1, a higher view over the flat at 1; 5 long low barns at -1, tall narrow towers at 1

float wvPx, wvHz, wvE, wvF, wvD, wvWet, wvHaz, wvDim, wvFl;
vec2 wvRip, wvSun;
vec3 wvTop, wvMid, wvLow, wvDk, wvLit, wvMs, wvGlow;
int wvK, wvKd;
float wvS, wvX, wvW, wvH, wvDe, wvHip, wvTn, wvLv, wvOn, wvMir, wvNod, wvRise;
bool wvU;
vec2 wvQ;
vec3 wvKc, wvLamp;
// A soft step from a to b, that may also fall (b under a).
float wvSs(float a, float b, float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
#define ss wvSs
// What is 1 at 0, a at -1 and b at 1.
float wvTo(float x, float a, float b) { return mix(1., x < 0. ? a : b, abs(x)); }
// Where each shed is (middle of its front, how large a length of one is there, half width, wall), far to near.
const vec4 WV_A[5] = vec4[5](vec4(.075, .062, .36, .34), vec4(-.46, .115, .3, .42), vec4(.69, .155, .33, .4), vec4(.34, .33, .42, .42), vec4(-.52, .86, .46, .5));
const vec4 WV_B[5] = vec4[5](vec4(-.06, .075, .36, .34), vec4(.14, .125, .3, .42), vec4(-.4, .2, .38, .4), vec4(.74, .72, .5, .5), vec4(-.62, .98, .56, .5));
const float WV_ROW[5] = float[5](.68, 0., -.34, .34, -.68);
const int WV_KIND[5] = int[5](0, 2, 3, 1, 4);
// A colour of its light: morning, evening and night in a, then sunset, dusk and moonlight in b.
vec3 wvPick(vec3 a, vec3 b, vec3 c, vec3 d, vec3 e, vec3 f) {
  if (uVar > .5) { a = d; b = e; c = f; }
  return mix(b, uOwn[0] < 0. ? a : c, abs(uOwn[0]));
}
float wvIn(float d) { return sat(.5 - d/wvPx); } // inside an edge, in picture lengths
float wvBox(vec2 q, vec2 c, vec2 h) { q = abs(q - c) - h; return max(q.x, q.y); }
vec3 wvKind(int k) { vec3 c = uKind[k]; return mix(c/max(max(c.r, max(c.g, c.b)), .15), vec3(1., .72, .36), .55); }
float wvLevel(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }

// A shed's walk: where a foot is from its hip, how high, and how long since it came down (0 to 1 of a round).
vec3 wvFoot(int k, int leg) {
  float f = fract(uTravel*.1417+float(k)*.37+float(leg)*.25);
  if (f < .8) return vec3(-.24+.6*f, 0., f);
  float t = (f - .8)*5., e = t*t*(3. - 2.*t);
  return vec3(-.24+.6*f - .6*e, .2*sin(PI*t)*sin(PI*t), 0.);
}
vec3 wvSky(vec2 p) {
  float y = p.y - wvHz;
  vec3 c = mix(wvLow, wvMid, ss(.0, .22, y));
  c = mix(c, wvTop, ss(.12, .62, y));
  vec2 d = p - wvSun;
  // long flat cloud
  vec2 q = vec2(p.x*1.1+uTime*.003+20., y*9.+.6*p.x);
  float n = noise(q)*.55+noise(q*vec2(2.3, 2.7)+4.)*.3+noise(q*vec2(6., 5.)+9.)*.15;
  float cl = ss(.46, .72, n)*ss(.02, .14, y)*ss(.75, .3, y);
  c = mix(c, mix(wvMs, wvTop, .45), cl*.55);
  c += wvGlow*(.3*exp(-length(d*vec2(.8, 1.5))*4.2)*(1. - .4*cl)+.1*exp(-dot(d, d)*90.));
  return c;
}
// A tapered timber from a to b: distance, and across it -1 to 1.
vec3 wvSeg(vec2 q, vec2 a, vec2 b, float wa, float wb) {
  vec2 v = b - a, u = q - a;
  float t = sat(dot(u, v)/dot(v, v)), w = mix(wa, wb, t);
  u -= v*t;
  return vec3(length(u) - w, (u.x*v.y - u.y*v.x)/(length(v)*w), t);
}

// One leg at scale s, its hip at x, mirrored in the flat.
void wvLeg(inout vec3 col, vec2 p, float s, float x, float hip, vec3 ft, float tone, float tk) {
  float y0 = wvHz - wvE*s;
  bool under = p.y < y0;
  vec2 q = vec2(p.x - x, abs(p.y - y0))/s;
  if (under) q += wvRip*(.3+q.y);
  vec2 H = vec2(0., hip), F = vec2(ft.x, ft.y - wvFl), D = F - H;
  float b = .51*max(1.06*wvF, sqrt(wvF*wvF+.07)), a = .96*b, l = min(length(D), a+b - .004);
  float h = (a*a - b*b+l*l)/(2.*l);
  D /= length(D);
  vec2 K = H+D*h+vec2(-D.y, D.x)*sqrt(max(a*a - h*h, 0.));
  float px = wvPx/s, blur = under ? 1.+14.*q.y*s*(.4+uTexture) : 1.;
  vec3 up = wvSeg(q, H, K, tk*1.1, tk*.85), lo = wvSeg(q, K, F+vec2(0., .03), tk*.95, tk*.6), m = up.x < lo.x ? up : lo;
  float d = min(m.x, length(q - K) - tk*1.12);
  d = min(d, wvBox(q, F+vec2(-.012, .014), vec2(tk*1.3+.012, .014)));
  float al = sat(.5 - d/(px*blur));
  if (al <= 0.) return;
  float side = -m.y*clamp((wvSun.x - x)*8.+.5, -1., 1.); // the side toward the light
  float lk = length(q - K), grain = .6*noise(vec2(m.y*3.5+9., m.z*7.+x*40.))+.4*noise(vec2(m.y*7.+9., m.z*31.+x*90.));
  vec3 c = mix(wvDk, wvLit, ss(-.1, 1., side)*.85*(.5+.8*grain))*(.6+.75*grain);
  // rope bound round the joint
  float bind = ss(tk*3.4, tk*3.2, lk)*ss(tk*1.15, tk*1.3, lk), wrap = abs(fract(lk/tk*2.3+m.y*.12) - .5)*2.;
  c = mix(c, mix(wvDk*.7, wvLit, (.15+.4*ss(-.6, .9, side))*ss(0., .6, wrap)+.06), bind*.9);
  c = mix(c, wvDk*.55, ss(px*1.5, 0., abs(lk - tk*1.1))*.6);
  c = mix(c, wvLit, ss(tk*.35+px, tk*.35 - px, lk)*.35);
  c *= mix(.62, 1., ss(0., .25, q.y)); // the wet foot
  c += wvLamp*pow(sat(q.y/hip), 3.)*.5;
  c = mix(c, wvMs, tone);
  col = mix(col, c, al*(under ? wvWet*.8*exp(-q.y*.5) : 1.));
}
// Whether a place (across, away) is under a floor, and the light through its planks there.
vec2 wvPlank(vec2 g, float X, float w, float Z, float foot, float soft) {
  float in1 = ss(soft, -soft, abs(g.x - X) - w)*ss(soft, -soft, abs(g.y - Z - .5*wvD) - .5*wvD);
  float u = (g.x - X)*9.5, f = abs(fract(u) - .5), w1 = fract(sin(floor(u)*7.3)*91.7);
  float gap = ss(.06+foot*9.5, 0., .5 - f - .02*w1)*sat(.16/(.06+foot*9.5));
  float n = floor(u+.5); n = fract(sin(n*3.7+X)*47.3);
  return vec2(in1, gap*(.25+n*n));
}

float wvHalf(float w) { return w*wvTo(uOwn[5], 1.35, .58); }
// Takes shed k in hand at p.
void wvTake(vec2 p, int k, vec4 at) {
  float fk = float(k), f5 = uOwn[5];
  wvK = k; wvKd = WV_KIND[k]; wvS = at.y; wvX = at.x/wvS;
  wvW = wvHalf(at.z); wvH = at.w*wvTo(f5, .7, 2.1);
  wvDe = max(wvW+.08, .41); wvRise = .3*(1.+.7*f5)*(.8+.4*fract(fk*.37));
  wvLv = wvLevel(wvKd); wvTn = wvHaz*exp(-wvS*4.2); wvKc = wvKind(wvKd);
  if (wvKd == 3) wvKc = mix(vec3(1., .74, .27), wvKc, .6*wvLv);
  wvOn = (wvKd == 3 ? .75 : .22)+(.6+.5*uEnergy)*wvLv+.6*uCue;
  wvLamp = wvKc*(.1+.4*wvLv)*wvDim;
  wvNod = uPhrase*.04*sin(uTime*.8+fk*1.1);
  wvHip = wvF - .02*cos(TAU*(uTravel*.5668+fk*.37)) - .48*uCue*(1. - uCue) - .035*uLevel - wvFl;
  float y0 = wvHz - wvE*wvS;
  wvU = p.y < y0;
  wvQ = vec2(p.x - at.x, abs(p.y - y0))/wvS;
  if (wvU) wvQ += wvRip*(.3+wvQ.y);
  wvMir = wvU ? wvWet*.8*exp(-wvQ.y*.22) : 1.;
  wvQ.y -= wvHip; wvQ = rot(wvNod)*wvQ;
}
void wvPt(inout vec3 col, vec3 c, float d, float tone) { col = mix(col, mix(c, wvMs, tone), wvIn(d*wvS)*wvMir); }
// Smoke, walls, roof, windows.
void wvHouse(inout vec3 col) {
  vec2 q = wvQ;
  float fk = float(wvK), s = wvS, w = wvW, wh = wvH, rise = wvRise, px = wvPx/s, top = wh+rise+.17, tone = wvTn, gw = w*.72, xc = -w+gw, u = max(q.y - top, 0.), away = wvSun.x - wvX*s;
  vec2 pipe = vec2(w*.45, wh+rise*.5);
  float sx = q.x - pipe.x - .06*u*u - .05*u*sin(u*2.6 - uTime*.33+fk*2.) - .03*u*sin(u*6. - uTime*.5+fk), sw = .022+.085*u;
  float dn = exp(-sx*sx/(sw*sw))*exp(-u*1.15)*(.45+.75*noise(vec2(sx/sw*1.2+7., u*5. - uTime*.22+fk*9.)))*ss(0., .05, u);
  col = mix(col, mix(mix(wvMs, wvTop, .4)*.92, wvKc*(.35+.5*wvDim), .25+.45*wvLv), min(dn*(.4+.75*band(.1+.2*fk)), 1.)*.8*wvMir);
  float litG = ss(-.6, .35, -away), grain = noise(vec2(q.x*34.+fk*9.+40., q.y*3.));
  vec3 side = mix(wvDk, wvLit, .06+.12*grain), gab = mix(wvDk, wvLit, .1+.42*litG+.14*grain);
  float pw = px*23., bd = ss(.1+pw, .0, abs(fract(q.x/.062) - .5))*sat(.1/(.1+pw)); // boards
  side *= (1. - .45*bd)*(.8+.35*sat(q.y/wh))*(1. - .45*ss(wh - .1, wh, q.y)); gab *= 1. - .35*bd;
  // pipe, side, gable
  float d = min(wvBox(q, vec2(pipe.x, (pipe.y+top)*.5), vec2(.017, (top - pipe.y)*.5)), wvBox(q, vec2(pipe.x, top - .01), vec2(.028, .012)));
  wvPt(col, mix(wvDk, wvLit, .2+.3*ss(-.02, .02, (q.x - pipe.x)*away*9.)), d, tone);
  wvPt(col, side, wvBox(q, vec2((xc+w)*.5, wh*.5), vec2((w - xc)*.5, wh*.5+.01)), tone);
  float gx = abs(q.x+w - gw*.5), gh = wh+rise*(1. - gx*2./gw);
  wvPt(col, gab, max(max(gx - gw*.5, (q.y - gh)*.7), -q.y), tone);
  // roof and bargeboard
  float t = (q.y - wh)/rise;
  d = max(max(xc - t*gw*.5 - q.x, q.x - w - .05+t*gw*.27)*.8, max(-t - .12, t - 1.)*rise);
  float row = mix(.88, .75+.25*ss(0., .35, fract(t*5.)), ss(.12, .25, s));
  vec3 rc = mix(wvDk, wvLit, .24+.1*grain)*row*(.9+.25*noise(vec2(q.x*20.+50., floor(t*5.)*7.)));
  wvPt(col, mix(rc, wvLit, ss(.1, 0., 1. - t)*.6), d, tone);
  wvPt(col, mix(wvDk, wvLit, .3+.3*litG), max(abs(q.y - gh - .012)*.7 - .02, gx - gw*.5 - .04), tone);
  // a window of four panes, and a door
  vec2 wq = q - vec2(mix(xc, w, .47), wh*.52), wz = vec2(min((w - xc)*.26, .13), min(.11, wh*.25)), pn = floor(wq/wz+1.);
  float bar = max(ss(.012+px, .012 - px, abs(wq.x)), ss(.012+px, .012 - px, abs(wq.y)));
  float pane = .75+.4*hash21(pn+fk*3.)+uKeys*step(.5, fract(dot(pn, vec2(.5, .25))+.3*fk));
  d = wvBox(wq, vec2(0.), wz);
  wvPt(col, gab*.55, d - .025, tone);
  wvPt(col, mix(mix(wvDk*.8+wvTop*.12, wvKc*(.75+.25*pane), sat(wvOn*pane)), wvDk, bar*.8), d, tone*.45);
  wvPt(col, mix(gab*.5, wvKc, sat(wvOn - .45)*.3), wvBox(q, vec2(-w+gw*.5, wh*.42), vec2(gw*.17, wh*.4)), tone);
  col += wvKc*min(wvOn, 1.2)*wvMir*(.04+.1*wvDim)*exp(-dot(wq, wq)*26.);
}
// Deck, legs and what hangs.
void wvBelow(inout vec3 col, vec2 p) {
  vec2 q = wvQ;
  float fk = float(wvK), s = wvS, w = wvW, tone = wvTn, px = wvPx/s, th = (uVar > .5 ? .036 : .023)*(1.+.15*ss(.25, .1, s))*(1. - .25*uOwn[2]), Z = 1./s, sf = 1./(Z+wvD), hx = wvDe - .07;
  // of the two pairs of legs only the one on this side of the middle
  bool r = p.x/sf - wvX > .05;
  wvLeg(col, p, sf, (wvX+(r ? hx : -hx))*sf, wvHip+wvNod*(r ? hx : -hx), wvFoot(wvK, r ? 3 : 2), mix(tone, 1., uVar > .5 ? .12 : .16), th);
  // the deck from under: planks running away from us with light in the gaps
  float den = max(wvHip+wvNod*q.x+(wvU ? wvE : -wvE) - .05, .02), su = max((wvU ? wvHz - p.y : p.y - wvHz)/den, .01);
  vec2 g = vec2(p.x/su, 1./su); if (wvU) g.x += wvRip.x*2.;
  float foot = wvPx/su;
  vec2 pl = wvPlank(g, wvX, wvDe - .03, Z, foot, foot*1.2);
  float joist = ss(.45, .36, abs(fract((g.y - Z)/wvD*3.5) - .5));
  vec3 c = wvDk*(.45+.45*noise(vec2(g.x*26.+60., g.y*3.))+.2*sat((g.y - Z)/wvD))*(.6+.4*joist);
  c += wvKc*(pl.y*joist*(wvOn*.9+.1)*(.35+.65*wvDim))+wvLamp*.12;
  col = mix(col, mix(c, wvMs, tone), pl.x*wvMir);
  vec3 rope = mix(wvDk, wvLit, .28);
  float dn = -q.y, sway = .05*sin(uTime*.43+fk*2. - dn)*dn, hung = step(0., dn);
  if (wvK != 2) { // a net hung up at three points
    float nx = (q.x+sway*1.5+w*.28)/(w*.62), sag = .3*abs(sin(PI*nx))*(1. - .25*nx)+.02, wm = .05+px*17., on = step(abs(nx), 1.)*hung;
    vec2 m = vec2(q.x+sway+dn*.6, q.x+sway - dn*.6)*17.; m = abs(fract(m+.4*sin(dn*9.+q.x*7.)) - .5);
    float mesh = ss(wm, 0., min(m.x, m.y))*sat(.08/wm+.1);
    col = mix(col, mix(mix(rope, wvKc*.7, .3*uTexture), wvMs, tone), max(ss(px, -px, dn - sag)*max(mesh, .12), ss(.016+px, .004, abs(dn - sag)))*on*wvMir*.8);
  }
  if (wvK > 1) { // a rope ladder
    float lx = q.x - sway - (wvK == 3 ? -.12 : .2)*w;
    float d = max(min(abs(abs(lx) - .05) - .006, max(abs(fract(dn*10.) - .5)*.1 - .009, abs(lx) - .06)), max(dn - .6, -dn));
    wvPt(col, rope, d, tone);
  }
  if (wvK == 4) { // a lantern that swings with the loop
    float an = .14*sin(TAU*uLoop)+.05*sin(uTime*.7), bright = .7+.4*uLevel+.5*uCue;
    vec2 l = rot(an)*vec2(q.x - w*.62, q.y); l = (l+vec2(0., .39))*(uVar > .5 ? 1.4 : 1.);
    float d = max(abs(l.x) - .004, abs(l.y - .25) - .2), L = wvBox(l, vec2(0.), vec2(.034, .05));
    wvPt(col, wvDk, min(d, min(L - .009, length(l - vec2(0., .055)) - .02)), 0.);
    wvPt(col, mix(vec3(1., .72, .34), wvKc, .4*uHits)*bright*(.72+.5*exp(-dot(l, l)*900.)), max(L, .004 - abs(l.x)), 0.);
    col += vec3(1., .62, .28)*bright*wvMir*(.08+.2*wvDim)*exp(-dot(l, l)*18.);
  }
  // the edge of the deck, and a post
  float d = min(wvBox(q, vec2(0., -.025), vec2(wvDe, .032)), wvBox(q, vec2(.02 - wvDe, .07), vec2(.012, .09)));
  wvPt(col, mix(wvDk, wvLit, .14+.12*fract(sin(floor(q.y*60.)+fk)*9.7)+.25*ss(-.012, .004, q.y)), d, tone);
  // the near leg; a hit lifts the first foot of the nearest and lets it down again
  r = q.x > .05;
  vec3 ft = wvFoot(wvK, r ? 1 : 0);
  if (wvK == 4 && r) ft.y += .5*uHits*(1. - uHits);
  wvLeg(col, p, s, (wvX+(r ? hx : -hx))*s, wvHip+wvNod*(r ? hx : -hx), ft, tone, th);
}
float wvRing(vec2 g, vec2 c, float r, float a) {
  float d = length(g - c) - r;
  return a*exp(-d*d*160.)*sin(d*62.);
}
vec3 render(vec2 p) {
  bool deep = uVar > .5;
  float asp = uRes.x/uRes.y, fx = clamp(asp/1.778, .42, 1.2), o3 = uOwn[3], o4 = uOwn[4];
  wvPx = 1.3/uRes.y;
  wvHz = (deep ? -.17 : -.13)+(o4 > 0. ? .2 : .1)*o4;
  wvE = (deep ? .26 : .36)*wvTo(o4, .5, 1.75);
  wvFl = .15*max(uOwn[1], 0.); wvE -= wvFl;
  wvF = wvTo(uOwn[2], .62, 1.5);
  wvD = deep ? .75 : .5;
  wvTop = wvPick(vec3(.74, .76, .77), vec3(.5, .56, .64), vec3(.03, .05, .12), vec3(.2, .12, .2), vec3(.03, .055, .11), vec3(.1, .12, .15));
  wvMid = wvPick(vec3(.8, .81, .8), vec3(.79, .71, .66), vec3(.07, .12, .23), vec3(.5, .2, .2), vec3(.1, .16, .24), vec3(.27, .3, .34));
  wvLow = wvPick(vec3(.86, .86, .83), vec3(.96, .72, .5), vec3(.18, .26, .37), vec3(.92, .42, .2), vec3(.5, .37, .3), vec3(.6, .63, .66));
  wvDk = wvPick(vec3(.27, .29, .31), vec3(.15, .11, .13), vec3(.012, .018, .04), vec3(.07, .03, .045), vec3(.018, .022, .034), vec3(.012, .014, .018));
  wvLit = wvPick(vec3(.62, .63, .62), vec3(.82, .54, .36), vec3(.3, .4, .52), vec3(.75, .32, .18), vec3(.34, .33, .34), vec3(.6, .64, .68));
  wvMs = wvPick(vec3(.79, .8, .79), vec3(.86, .68, .56), vec3(.12, .18, .28), vec3(.5, .2, .17), vec3(.16, .18, .23), vec3(.36, .39, .42));
  float bright = dot(wvMid, vec3(.33));
  wvDim = sat(1.15 - 1.5*bright);
  wvSun = deep ? vec2(.16*fx, .31) : vec2(.135*fx, wvHz+.07+.25*max(uOwn[0], 0.));
  wvGlow = mix(wvLow, vec3(1., .86, .6), deep ? .2 : .5*(1. - abs(uOwn[0])))*(deep ? .35 : .8 - .5*max(-uOwn[0], 0.))*(.85+.25*uLevel+.3*uCue)*(1.+.1*uTone);
  wvHaz = (deep ? .62 : .78)*(.9+.25*uSpace)*(1. - .15*max(uOwn[0], 0.));
  wvHaz = min(wvHaz+.25*max(-uOwn[0], 0.), 1.1);
  float walk = uTravel*.085;
  vec4 at[5];
  for (int k = 0; k < 5; k++) {
    vec4 v = deep ? WV_B[k] : WV_A[k];
    if (o3 > 0.) v.xy = mix(v.xy, vec2(WV_ROW[k], .205+.01*float(k)), o3);
    else if (k == (deep ? 4 : 3)) v.xy = mix(v.xy, deep ? vec2(-.2, .62) : vec2(-.08, .4), -o3);
    else v.x -= o3*(v.x < 0. ? -2.4 : 2.4)/fx; // the others have walked off
    if (k == 4 && !deep) v.x -= .3*(1. - min(fx, 1.));
    if (k == 3 && !deep) v = mix(v, vec4(.44, .25, v.zw), (1. - min(fx, 1.))*1.4*(1. - abs(o3))); // clear of the near leg where it is narrow
    v.x *= fx; v.y *= mix(.72, 1., min(fx, 1.));
    at[k] = v;
  }
  // the ground in lengths of the place: how far across, how far away
  float below = wvHz - p.y, sg = max(below, .0005)/wvE, film = 1., ridge = 0., ring = 0., fine = 0.;
  vec2 g = vec2(p.x/sg, 1./sg), gw = vec2(g.x - walk, g.y);
  wvWet = 1.; wvRip = vec2(0.);
  if (below > 0.) {
    float foot = wvPx/(wvE*sg*sg);
    float far = ss(.02, .5, foot), o1 = uOwn[1];
    float n = noise(gw*vec2(.75, 1.9)+30.)*.62+noise(gw*vec2(2.1, 4.7)+70.)*.38;
    float th = .5 - .2*uDrone - .9*o1;
    film = mix(ss(th - .1, th+.1, n), sat(1. - th*.8), far);
    float ph = gw.y*34.+4.*noise(gw*vec2(1.3, 2.4))+1.6*noise(gw*vec2(5., 6.)+11.);
    fine = exp(-foot*foot*900.);
    ridge = sin(ph)*fine;
    for (int i = 0; i < 2; i++) {
      const int k = 4;
      vec3 ft = wvFoot(k, i);
      vec2 c = vec2(at[k].x/at[k].y+float(i*2 - 1)*(max(wvHalf(at[k].z)+.08, .41) - .07)+ft.x, 1./at[k].y);
      ring += wvRing(g, c, .05+1.3*ft.z, .8*exp(-ft.z*6.)*sat(ft.z*30.));
      if (i == 1) ring += wvRing(g, c, .08+.75*(1. - uHits), 1.6*uHits);
    }
    ring *= fine;
    wvWet = mix(mix(.34, .1, max(-o1, 0.)), .97, film);
    float tx = (.35+.9*uTexture)*(1. - .5*max(o1, 0.));
    wvRip.x = (.05*tx*(noise(vec2(gw.x*1.5+9., gw.y*15.+sin(uTime*.11)*3.+40.)) - .5)+.05*ring)*ss(0., .05, below);
    wvRip += vec2(.03, .02)*ridge*(1. - film);
  }
  // sky, or the sky in the wet
  vec2 sp = below > 0. ? vec2(p.x+wvRip.x*.4, wvHz+below*1.05+wvRip.y*.5+.02*ring) : p;
  vec3 sky = wvSky(sp), col = sky;
  if (deep) { // moon and stars
    vec2 m = sp - wvSun;
    float md = length(m);
    vec2 ce = p*38.+300., ci = floor(ce);
    float st = fract(sin(dot(ci, vec2(12.99, 78.23)))*4375.85), tw = length(fract(ce) - .15 - .7*fract(st*vec2(713.1, 1931.7)));
    if (below < 0.) col += vec3(.75, .8, .9)*step(.88, st)*ss(.04+wvPx*38.+.05*fract(st*91.), 0., tw)*ss(.06, .3, p.y - wvHz)*(.3+.5*fract(st*37.))*(1. - max(-uOwn[0], 0.));
    else col += mix(wvLow, vec3(.8), .5)*.5*exp(-m.x*m.x*160.)*wvWet*ss(.0, .05, below)*ss(.4, .8, noise(vec2(gw.x*9., gw.y*17.+sin(uTime*.07)*4.)));
    float disc = wvIn((md - .036)*(below > 0. ? .12 : 1.));
    col = mix(col, mix(vec3(.93, .9, .8), wvLow*1.5, .2)*(.9+.1*noise(m*40.+9.)), disc*(below > 0. ? .6 : .95));
    col += vec3(.4, .42, .42)*.5*exp(-md*11.);
  } else {
    float disc = wvIn((length(sp - wvSun) - .03)*(below > 0. ? .2 : 1.));
    col = mix(col, mix(wvLow, vec3(1., .97, .88), .93), disc*(below > 0. ? .6 : 1.)*(1. - .5*max(-uOwn[0], 0.)));
  }
  // a far shore
  float shore = .012*noise(vec2(p.x*3.+walk*.05+9., 1.))+.006*noise(vec2(p.x*19.+walk*.05, 3.)) - .004;
  col = mix(col, mix(wvMs, wvDk, .22), wvIn(abs(p.y - wvHz) - shore)*.75);
  if (below > 0.) {
    vec3 mud = mix(wvDk, wvMs, .5)*(.86+.2*noise(gw*vec2(3., 8.)+5.));
    mud = mix(mud, mix(wvLow, wvMid, .4), .22+.2*ridge+.4*max(-uOwn[1], 0.));
    float gl = mix(wvWet, 1., .35*exp(-below*9.)*(1.+min(uOwn[1], 0.)));
    col = mix(mud, col*.96, gl);
    col += (wvLow*.16+.04)*ridge*(1. - film)*.6;
    col += (wvMid*.5+.1+uKind[4]*.15)*ring*.5;
    col *= 1. - .22*ss(.1, .45, below);
    // the piece lies on the flat
    vec4 pc = piece(vec2(.5+(p.x+wvRip.x)/(1.72*fx), sat(below/(wvHz+.5))*.96+.02));
    col = mix(col, col*.7+pc.rgb*(.25+.5*bright), sat(pc.a*.9)*ss(.9*fx, .6*fx, abs(p.x))*ss(0., .06, below)*(.35+.4*film)*(.75+.25*ridge));
    // light of the lantern and through the floors, on the mud
    vec2 lg = g - vec2(at[4].x/at[4].y, 1./at[4].y) - vec2(.3, .15);
    col += vec3(.9, .5, .2)*exp(-dot(lg, lg)*2.2)*wvDim*.17*(1.+.5*uLevel+.4*ridge)*(.5+.5*film);
    if (deep || uOwn[0] > 0.) for (int k = 3; k < 5; k++) {
      vec2 pl = wvPlank(g, at[k].x/at[k].y, wvHalf(at[k].z), 1./at[k].y, .03+wvPx/sg, .12);
      col += wvKind(WV_KIND[k])*pl.x*(.1+.9*pl.y)*(.3+.6*wvLevel(WV_KIND[k])+.3*uLevel)*wvDim*.6*(1.+.3*ridge);
    }
  }
  // of the sheds only those that reach here: first what stands above the decks, then what is under them
  int up[5], lo[5]; int nu = 0, nl = 0;
  for (int k = 0; k < 5; k++) {
    float s = at[k].y, qy = abs(p.y - wvHz+wvE*s)/s, qx = p.x/s - at[k].x/s, fl = wvF - .24 - wvFl;
    up[k] = lo[k] = 0;
    if (qy > fl && qy < wvF+3.4 && abs(qx) < (qy > wvF+1.9 ? .95 : .72)) { up[nu] = k; nu++; }
    float far = at[k].x*(1./(1.+s*wvD) - 1.)/s;
    if (qy < wvF+.22 && qx > min(far, 0.) - .95 && qx < max(far, 0.)+.95) { lo[nl] = k; nl++; }
  }
  for (int j = 0; j < nu; j++) { wvTake(p, up[j], at[up[j]]); wvHouse(col); }
  for (int j = 0; j < nl; j++) { wvTake(p, lo[j], at[lo[j]]); wvBelow(col, p); }
  col *= 1. - .12*dot(p, p);
  return sat(col);
}
