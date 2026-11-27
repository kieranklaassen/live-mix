// name: Beam shadows
// a: Long wall
// b: Granary lane
// what: A long mud wall smoothed by hand runs from huge at the right to small in the haze, bristling with beam ends whose shadows slide over the swollen plaster round one blue-black doorway; or a lane between round granaries in painted clay and straw hats, with a log ladder in a bar of sun.
// follows: The drone swells walls and heat, the pad draws shadows out, texture roughens the plaster, a phrase sends a kite's shadow over; each kind tints its own stretch of clay. Bands set beam lengths and painted teeth, the piece lies in it as damp patches, the loop moves the sun. A hit drops a puff of dust, a cue swings the sun out and back with a pool of light.
// own: 0 moonlight at -1, red evening at 1; 1 white clay at -1, red earth at 1; 2 bare wall and trimmed hats at -1, long crowded beams and wide shady eaves at 1; 3 a low straight wall, slim granaries with steep hats at -1, a high swollen wall, fat granaries with flat hats at 1; 4 wall seen more squarely, lane from a child's height at -1, both from higher up at 1; 5 rain-worn bare clay at -1, painted tall at 1; 6 snow lying on ground, hats, beams and ledges at -1, a flood over the ground that mirrors everything at 1; 7 a: square on to the wall and its door, b: granaries strewn far apart on open ground, at -1, both from far off over the plain at 1
// What both share: the way to the sun, its colour, the sky's light, the clay, the far air.
vec3 bsL, bsSun, bsAmb, bsClay, bsHaze;
float bsPx, bsNight, bsEve, bsSwing, bsBig, bsHat, bsN, bsF, bsOut, bsTop;
float bsLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
// A kind's colour as a clay, no lighter and no darker than the wall.
vec3 bsKind(int k) { vec3 c = uKind[k]*uKind[k] + .01, w = vec3(.3, .6, .1); return mix(bsClay, c*vec3(1.1, .94, .7)*min(dot(bsClay, w)/dot(c, w), 1.5), .55); }
float bsTri(float x) { return abs(fract(x) - .5); }
// 1 inside an edge w soft, 0 outside it; d is how far outside.
float bsIn(float w, float d) { return sat(.5 - .5*d/w); }
// How near a ray passes a stick from a along u: x how near, y how far along the stick, z how far along the ray.
vec3 bsSeg(vec3 ro, vec3 rd, vec3 a, vec3 u) {
 vec3 w = ro - a;
 float b = dot(rd, u), d = dot(rd, w), k = sat((dot(u, w) - b*d)/max(dot(u, u) - b*b, 1e-4)), s = k*b - d;
 return vec3(length(w + rd*s - u*k), k, s);
}
// How much a stick shades q.
float bsCast(vec3 q, vec3 a, vec3 u, float r) {
 vec3 e = bsSeg(q, bsL, a, u);
 float w = (.012 + .05*(1. - uTone))*(.4 + max(e.z, 0.)) + .005;
 return bsIn(w, e.x - r)*step(-.05, e.z)*smoothstep(0., .04, r);
}
float bsNotch(float k) { float f = fract(k*11.); return .085 + .035*f*f - .02*k; }
// Plaster swept by hand: how high it stands at u.
float bsPlaster(vec2 u, float n, float fine) {
 float m = noise(u*2.9 + 9.);
 return .35*m + fine*(.05*sin((u.y*.8 + .9*n + .5*m)*24.)*smoothstep(.35, .75, m));
}
// The clay at u, t away: its colour; rel is how it leans to the sun.
vec3 bsMud(vec2 u, float t, vec2 ld, out float rel) {
 float n = noise(u*.8 + 5.), hand = (.8 + .9*uTexture)/(1. + .012*t*t), h = bsPlaster(u, n, hand), gr = noise(vec2(u.x*8. + u.y*6., u.y*9. - u.x*7.))*hand, rain = dot(ld, ld) < .01 ? 0. : max(-uOwn[5], 0.);
 float run = smoothstep(.45, .8, bsTri(u.x*.83 + .15*n) + bsTri(u.x*2.3 + .3*n));
 rel = (h - bsPlaster(u + ld*.05, n, hand))*3.2 + (.2 + .15*uTexture)*(gr - .5*hand) - rain*.4*run;
 bsN = n; bsF = gr;
 // straw and sand, seen close by
 float fl = (noise(vec2(u.x*41. + u.y*13., u.y*29. - u.x*17.)) - .5)/(1. + .12*t*t);
 rel -= .35*fl;
 return bsClay*(.56 + .45*n + .5*h + (.14 + .06*uTexture)*gr + .26*fl)*mix(vec3(1.), vec3(1., .87, .78), smoothstep(.35, .65, n))*(1. - (.12 + .42*rain)*run);
}
// Bands of black, white and red clay, v from the foot up.
vec3 bsPaint(vec3 alb, float u, float v, float w, float tall, vec3 red, float amt) {
 v += .05*(bsN - .5) + .006*bsF;
 float tri = 1. - 2.*bsTri(u);
 vec3 k = vec3(.06, .05, .05), c = mix(alb, k, bsIn(w, v));
 c = mix(c, vec3(.74, .68, .57), bsIn(w, abs(v - .1) - .1));
 c = mix(c, k, bsIn(w*8., v*5. - tri*tall)*step(0., v));
 c = mix(c, red, bsIn(w, abs(v - .25) - .03));
 return mix(alb, c, amt);
}
// A kite, the bird: wings out.
float bsKite(vec2 q) {
 float x = abs(q.x);
 return max(bsIn(.06, abs(q.y - .16*x + .35*x*x) - .14*(1. - x*x)), bsIn(.06, max(x - .08, abs(q.y + .15) - .45)));
}
vec3 bsSky(float y, float side) {
 y = max(y, 0.);
 vec3 c = mix(vec3(1., .86, .62), vec3(.11, .29, .6), smoothstep(0., .5, y + .03));
 c = mix(c, mix(vec3(1.6, .6, .2), vec3(.2, .16, .34), smoothstep(0., .5, y))*(.7 + .5*side), bsEve);
 return mix(c, mix(vec3(.07, .1, .19), vec3(.012, .022, .065), smoothstep(0., .45, y)), bsNight);
}
// How far straw hangs out at the eave.
float bsRag(vec2 d) { d /= max(length(d), .01); return .2*bsTri(d.x*4.3 + d.y*1.3)*bsTri(d.y*5.1 + .3) + .1*bsTri(d.x*13. - d.y*17.) - .02; }
float bsAng(vec2 d) { return atan(d.y, d.x + (d.x < 0. ? -1e-4 : 1e-4)); }
// ---- a: the long wall. x runs along it (far is large), y up, z out from it.
const vec2 bsCell = vec2(.74, .72);
const vec4 bsBas = vec4(13.2, 2.5, 26., 3.);   // the two bastions: where, how wide
float bsWall(vec3 q) {
 float w = q.z + .05*q.y + .06*sin(q.x*.9 + .7*q.y) - .16/(1. + 6.*q.y*q.y);
 vec2 up = max(q.y - vec2(4.1, 4.4), 0.)*1.1, R = bsBas.yw*bsBig*(1. - .04*q.y);
 float b = min(length(vec3(q.x - bsBas.x, up.x, q.z*1.7)) - R.x, length(vec3(q.x - bsBas.z, up.y, q.z*1.7)) - R.y);
 float d = smin(w, b*.7, .7), top = bsTop + .14*sin(q.x*.55 + 1.) + .07*sin(q.x*1.7);
 return max(-smin(-d, top - q.y, .22), q.x - 52.);
}
// One beam of the wall, with its own tilt and length.
void bsBeam(vec2 id, out vec3 a, out vec3 u, out float r) {
 vec2 h = hash22(id + 3.7), g = fract(h*vec2(57.3, 91.7) + h.yx*13.1);
 float s = (id.x + .5 + (h.x - .5)*.6)*bsCell.x, y = 2.25 + (id.y + (h.y - .5)*.3)*bsCell.y, lean = 0., z = -.05*y;
 vec2 R = bsBas.yw*bsBig*(1. - .04*y), x = s - bsBas.xz, up = max(y - vec2(4.1, 4.4), 0.)*1.1, r2 = R*R - x*x - up*up;
 if (r2.x > 0.) { z = max(z, sqrt(r2.x)/1.7); lean = .6*x.x/R.x; }
 if (r2.y > 0.) { z = max(z, sqrt(r2.y)/1.7); lean = .6*x.y/R.y; }
 float many = uOwn[2], here = smoothstep(0., .18, fract(h.x*91.7) - .12 + (many < 0. ? .75 : .3)*many)*step(-.5, id.y)*step(id.y, 4.5)*sat((bsTop - .4 - y)*4.);
 float len = (.28 + .24*g.x + .26*uBands[clamp(int(id.x) - 2, 0, 15)] + .3*max(many, 0.))*here/(1. + .0016*s*s);
 u = vec3((g.y - .5)*.5 + lean, (fract(g.x*37.1) - .45)*.42, 1.)*len;
 a = vec3(s, y, z) - u*.25;
 r = (.036 + .016*max(many, 0.) + .026*fract(g.y*17.3))*smoothstep(.02, .25, len);
}
// How much sun reaches q on the wall, past the beams and the bastions.
float bsSunAt(vec3 q) {
 float sh = 1., r;
 vec3 a, u;
 vec2 i0 = floor(vec2(q.x/bsCell.x + .1, (q.y - 2.25)/bsCell.y + .75));
 for (int k = 0; k < 6 && q.y > .6; k++) {
  vec2 id = i0 + vec2(k & 1, k >> 1);
  bsBeam(id, a, u, r);
  // a hit: the shadows of one row shiver
  if (id.y == 2.) u.x += .5*uHits*(1. - uHits)*sin(id.x*2.4);
  sh *= 1. - bsCast(q, a, u, r);
 }
 vec2 lq = bsL.xz*vec2(1., 1.7), lw = normalize(lq);
 for (int k = 0; k < 2; k++) {
  vec2 b = k == 0 ? bsBas.xy : bsBas.zw, c = (vec2(b.x, 0.) - q.xz)*vec2(1., 1.7);
  float al = dot(c, lw), y2 = q.y + al*bsL.y/length(lq), o = max(y2 - 4.2, 0.)/(b.y*bsBig);
  float R = b.y*bsBig*(1. - .04*y2)*sqrt(sat(1. - o*o));
  sh *= 1. - bsIn(.1, abs(c.x*lw.y - c.y*lw.x) - R)*smoothstep(.3, .9, al);
 }
 return sh;
}
// ---- b: the granaries. x, z, how wide, how tall.
vec4 bsG[6];
// Two beams stand out of each granary over the lane.
void bsPeg(int i, int j, vec4 g, out vec3 a, out vec3 u, out float r) {
 vec2 h = hash22(vec2(float(i), float(j)) + .3), w = normalize(vec2(-g.x, -1.6)), o = normalize(w + (1.4*float(j) - .7 + .5*(h.x - .5))*vec2(-w.y, w.x));
 float len = (.5 + .3*h.y + .25*uBands[3 + 8*j])*(1. + .3*uOwn[2])*smoothstep(-1., -.6, uOwn[2] - .5*h.x);
 u = vec3(o.x, .25*(h.x - .4), o.y)*len; r = .045*smoothstep(0., .2, len);
 a = vec3(g.x, g.w*(.66 + .08*h.y), g.y) + vec3(o.x, 0., o.y)*g.z*.93;
}
// How much sun comes down to q between the hats.
float bsLaneSun(vec3 q, int own) {
 float sh = 1., lh = length(bsL.xz), s = .03 + .06*(1. - uTone), e = bsL.y/lh;
 vec2 L = bsL.xz/lh;
 // only the two on the sun's side and its own
 for (int k = 0; k < 3; k++) {
  int i = k == 0 ? 1 : k == 1 ? 3 : own;
  if (k == 2 && (own == 1 || own == 3)) break;
  vec4 g = bsG[i];
  vec2 c = g.xy - q.xz;
  float al = dot(c, L), pe = abs(c.x*L.y - c.y*L.x), Re = g.z + bsOut, y = q.y + al*e, f = (g.w - .1 - q.y)/e;
  float hit = bsIn(s, pe - g.z)*step(.2, al)*bsIn(.1, y - g.w);
  hit = max(hit, bsIn(s, pe - Re*sat(1. - (y - g.w)/(Re*bsHat)))*step(g.w, y)*step(0., al));
  vec2 d = c - L*f;
  sh *= 1. - max(hit, bsIn(s, length(d) - Re - .4*bsTri(d.x*3.1)*bsTri(d.y*2.7))*step(-.15, f));
 }
 return sh;
}
// ---- What the eye meets. bsM: 0 sky, 1 ground, 2 clay, 3 straw, 4 the eave from below, 5 a log.
int bsM, bsI, bsM2;   // bsM2: what lies behind it
float bsT, bsT2, bsC, bsR;
vec3 bsA, bsU, bsE;
bool bsTake(int mat, float t, float c, int i) {
 if (c < .03) return false;
 if (t < bsT) { bsM2 = bsM; bsT2 = bsT; bsM = mat; bsT = t; bsC = c; bsI = i; return true; }
 if (t < bsT2 && c > .5) { bsM2 = mat; bsT2 = t; }
 return false;
}
void bsTakeLog(vec3 ro, vec3 rd, vec3 a, vec3 u, float r, float tEnd, int i) {
 vec3 e = bsSeg(ro, rd, a, u);
 if (i < 0) r = bsNotch(e.y);
 float w = bsPx*max(e.z, .1)*.8;
 if (bsTake(5, e.z, bsIn(w, e.x - r)*step(2e-3, r)*step(e.z, tEnd)*step(.1, e.z), i)) { bsA = a; bsU = u; bsR = r; bsE = e; }
}
// The granaries, nearest first.
void bsMeet(vec3 ro, vec3 rd) {
 float A = dot(rd.xz, rd.xz), r;
 vec3 a, u, kk = vec3(1., -1./(bsHat*bsHat), 1.);
 for (int i = 0; i < 6 && uVar > .5; i++) {
  vec4 g = bsG[i];
  vec2 oc = ro.xz - g.xy;
  float t0 = -dot(oc, rd.xz)/A, dp = length(oc + rd.xz*t0), hh = (g.z + bsOut)*bsHat, He = g.w - .1, t;
  for (int j = 0; j < 2 && abs((ro.y + rd.y*t0)/g.w - .78) < .3 && dp < g.z + 1.2; j++) {
   bsPeg(i, j, g, a, u, r);
   bsTakeLog(ro, rd, a, u, r, t0 + 1., i);
  }
  float tu = (He - ro.y)/max(rd.y, 1e-3), rag = bsRag(oc + rd.xz*tu);
  // the hat from outside: a cone, its edge softened by how fast the ray comes to miss it
  vec3 o = vec3(oc.x, ro.y - He - hh, oc.y);
  float ka = max(dot(rd*kk, rd), .01), kb = dot(o*kk, rd), kc = dot(o*kk, o), dis = kb*kb - ka*kc;
  t = (-kb - sqrt(max(dis, 0.)))/ka;
  float y = o.y + rd.y*t, px = bsPx*t;
  bsTake(3, t, t > 0. ? sat(.5 + dis/(length(2.*kb*o*kk - 2.*kc*rd*kk)*bsPx*1.1 + 1e-5))*bsIn(px*1.5, -y - hh - rag - .05)*step(y, 0.) : 0., i);
  // the body, pressed full like a jar
  float sq = 1.07*g.z/g.w, A2 = A + sq*sq*rd.y*rd.y, oy = sq*(ro.y - .45*g.w), h2;
  t = -(dot(oc, rd.xz) + oy*sq*rd.y)/A2;
  h2 = dot(oc + rd.xz*t, oc + rd.xz*t) + (oy + sq*rd.y*t)*(oy + sq*rd.y*t);
  t -= sqrt(max(g.z*g.z - h2, 0.)/A2);
  px = bsPx*max(t, .1); y = ro.y + rd.y*t;
  bsTake(2, t, t > 0. ? bsIn(px, sqrt(h2) - g.z)*step(y, He + .1)*step(0., y) : 0., i);
  px = bsPx*tu/max(rd.y, .05);
  if (uOwn[7] != 0.) px = min(px, .09);
  bsTake(4, tu, rd.y > 0. ? bsIn(px, length(oc + rd.xz*tu) - g.z - bsOut - rag) : 0., i);
  if (bsT < t0 - g.z - .5 && bsC > .97) break;
 }
}
vec3 render(vec2 p) {
 float h = uOwn[0], cl = uOwn[1], van = uOwn[4], hi = max(van, 0.), lo = max(-van, 0.), b = step(.5, uVar);
 bool lane = uVar > .5;
 bsNight = max(-h, 0.); bsEve = max(h, 0.); bsPx = 1./uRes.y;
 bsSun = mix(mix(vec3(4.7, 3.75, 2.4), vec3(.75, 1., 1.45), bsNight), vec3(6.2, 2.3, .65), bsEve);
 bsSun *= .94 + .14*uLevel*(.5 + uEnergy);
 bsAmb = mix(mix(vec3(.27, .34, .47), vec3(.06, .09, .19), bsNight), vec3(.36, .3, .46), bsEve);
 bsClay = mix(vec3(.56, .3, .115), cl < 0. ? vec3(.74, .68, .58) : vec3(.45, .13, .055), abs(cl));
 bsSwing = .16*sin(TAU*uLoop) + .06*sin(uTime*.05) + 3.6*uCue*(1. - uCue);
 float form = uOwn[3], breath = sin(uTime*.17), eye = lane ? 1.5 + 1.3*hi - .9*lo : 1.5 + 1.2*hi, D = 5. + 1.4*abs(van), hy = lane ? -.16 : -.28 + .12*hi;
 bsOut = .42 + (uOwn[2] < 0. ? .28 : .4)*uOwn[2];
 bsTop = 5.9 + (form < 0. ? 1.3 : .9)*form;
 bsHat = 1.15*exp2(-.5*form);
 bsBig = lane ? (1. + .03*uDrone + .006*breath)*(1. + .12*form) : (1. + .07*uDrone + .015*breath)*(1. + .5*max(form, 0.) - .96*max(-form, 0.));
 bsL = normalize(lane ? vec3(.55 + .25*bsSwing, .86 - .16*uPad - .35*bsEve, -.2 - .2*bsSwing) : vec3(.42 + .4*bsSwing, .84 - .26*uPad + .1*bsNight - .5*bsEve, .58));
 bsG = vec4[6](vec4(-2.85, 2.6, 1.35, 3.5), vec4(2.65, 3.7, 1.5, 3.2), vec4(-2.55, 6.6, 1.5, 3.), vec4(2.5, 8.4, 1.4, 3.1), vec4(-2.4, 11.4, 1.4, 3.3), vec4(.5, 15.5, 1.9, 3.5));
 for (int i = 0; i < 6; i++) bsG[i].z *= bsBig;
 vec3 lA = lane ? vec3(-.45, 0., 5.5) : vec3(4.75, 0., 1.35), lU = lane ? vec3(-.75, 3.1, .75) : vec3(-.05, 4.9, -1.25);   // the ladder
 vec3 ro = vec3(0., eye, 0.), rd = normalize(vec3(p.x, p.y - hy, 1.1 - .15*b)), col = vec3(0.), q, n;
 if (!lane) {
  vec2 W = normalize(vec2(-.5 - .75*lo, 1.1));
  ro.z = D; rd = vec3(dot(rd.xz, W), rd.y, dot(rd.xz, vec2(-W.y, W.x)));
 }
 if (uOwn[7] != 0. && !lane) {
  float sq = max(-uOwn[7], 0.), fa = max(uOwn[7], 0.);
  vec2 W = normalize(mix(vec2(-.5 - .75*lo, 1.1), uOwn[7] < 0. ? vec2(-1.3, .06) : vec2(-.75, 1.), abs(uOwn[7])));
  vec3 r0 = normalize(vec3(p.x, p.y - hy - .05*sq + .02*fa, 1.1));
  rd = vec3(dot(r0.xz, W), r0.y, dot(r0.xz, vec2(-W.y, W.x)));
  ro = mix(ro, uOwn[7] < 0. ? vec3(8.6, ro.y + .5, 7.2 + 1.4*abs(van)) : vec3(-9., 2.2 + 3.*hi, 15.), abs(uOwn[7]));
  D = ro.z;
 }
 if (uOwn[7] > 0. && lane) { ro += vec3(1.4, .5 + 1.2*hi, -8.5)*uOwn[7]; rd = normalize(vec3(p.x, p.y - hy + .06*uOwn[7], 1.05)); }
 if (uOwn[7] < 0. && lane) {
  vec2 far6[6] = vec2[6](vec2(-5.2, 7.5), vec2(4.4, 10.5), vec2(-1.7, 13.5), vec2(9.5, 15.), vec2(-9.5, 18.), vec2(3., 24.));
  for (int i = 0; i < 6; i++) bsG[i].xy = mix(bsG[i].xy, far6[i], -uOwn[7]);
  lA.xz = mix(lA.xz, bsG[2].xy + vec2(2.1, -1.1), -uOwn[7]);
 }
 float tS = exp(-2.*length(p - vec2(-.75, .1)));
 bsHaze = mix(bsSky(.02, tS), bsClay*bsSun*.3, .35)*.85;
 bool wet = false, to, onWall, brush, seen;
 float tg, t, m, tm, tw, edge, tt, tEnd, r, tb, tW = 0.;
 vec3 qw, nw, q2, a, u;
 vec2 ee, rh;
 for (int go = 0; go < (uOwn[6] > 0. ? 2 : 1); go++) {
 tg = rd.y < -1e-4 ? -ro.y/rd.y : 1e4; t = 1e5; m = 1e5; tm = 0.; tw = 1e5;
 // the way to the long wall
 to = !lane && rd.z < -1e-3;
 if (to) t = (go > 0 ? max(ro.z - 1.8*max(bsBig, 1.), 0.) : D - 1.8*max(bsBig, 1.))/-rd.z;
 for (int i = 0; i < 44 && to; i++) {
  q = ro + rd*t;
  float d = bsWall(q), rel = d/max(t, .1);
  if (rel < m) { m = rel; tm = t; }
  if (rel < .002 || i == 43) { tw = t; break; }
  t += max(d, .01);
  if (q.y > 7.4 || q.y < -.3 || t > 70.) break;
 }
 edge = tw < 1e4 ? 1. : sat(1. - m/(1.5*bsPx))*.9; tt = tw < 1e4 ? tw : tm;
 onWall = edge > 0. && tt < tg;
 qw = ro + rd*tt;
 ee = vec2(.004 + .0015*tt, 0.);
 nw = normalize(vec3(bsWall(qw + ee.xyy), bsWall(qw + ee.yxy), bsWall(qw + ee.yyx)) - bsWall(qw) + vec3(0., 0., 1e-5));
 bsM = tg < 1e3 ? 1 : 0; bsT = min(tg, 1e4); bsM2 = bsM; bsT2 = bsT; bsC = 1.; bsI = 0;
 if (onWall) bsTake(2, tt, edge, 0);
 bsTakeLog(ro, rd, lA, lU, .1, 1e3, -1);
 // the wall's beams, near the place seen and near the bastion the eye brushes past
 tEnd = onWall ? tt + .04 : min(tg, 60.);
 rh = rd.xz/max(dot(rd.xz, rd.xz), 1e-4);
 tb = dot(vec2(bsBas.x, 0.) - ro.xz, rh);
 q2 = ro + rd*tb;
 if (abs(q2.x - bsBas.x) > 4. || tb > tEnd) { tb = dot(vec2(bsBas.z, 0.) - ro.xz, rh); q2 = ro + rd*tb; }
 brush = rd.z < 0. && tb < tEnd && abs(q2.z - 1.) < 1.8 && q2.y < 6.; seen = onWall && qw.y > 1.8;
 for (int k = seen ? 0 : 6; k < (brush ? 10 : 6) && !lane; k++) {
  vec3 c0 = k < 6 ? qw : q2;
  vec2 id = floor(vec2(c0.x/bsCell.x + .35, (c0.y - 2.25)/bsCell.y + .25)) - (k < 6 ? vec2(k % 3, k / 3) : vec2(k & 1, (k - 6)/2));
  bsBeam(id, a, u, r);
  bsTakeLog(ro, rd, a, u, r, tEnd, max(int(id.x), 0));
 }
 bsMeet(ro, rd);
 if (uOwn[6] <= 0. || go > 0 || bsM != 1) break;
 // the flood: on from where the ray meets it, turned up
 wet = true; tW = bsT; ro += rd*tW; ro.y = 0.;
 vec2 rq = ro.xz*vec2(2.2, 3.4) + vec2(uTime*.11, -uTime*.17);
 rd = normalize(vec3(rd.x, -rd.y, rd.z) + vec3(0., .02, .035)*(noise(rq) + .5*noise(rq*2.7 + 3.) - .75)/(1. + .03*tW*tW)*(.6 + .8*uLow));
 rd.y = max(rd.y, .002);
 }
 q = lane || bsM != 2 ? ro + rd*bsT : qw;
 vec4 g = bsG[lane ? max(bsI, 0) : 0];
 vec2 wq = normalize(ro.xz - g.xy + 1e-4), dq2 = q.xz - g.xy;   // round a granary, counted from the side we see
 float an = bsAng(vec2(dot(wq, dq2), wq.x*dq2.y - wq.y*dq2.x)), v = q.y/g.w, rel, px = bsPx*bsT, dif, am, bo, sun;
 vec2 uv = bsM == 1 ? q.xz : lane ? vec2(an*g.z + float(bsI)*7., q.y) : vec2(q.x + .6*q.z, q.y), ld = bsL.xy;
 n = nw;
 if (lane) {
  vec2 d = normalize(q.xz - g.xy + 1e-4);
  n = normalize(vec3(d.x, bsM == 3 ? 1./bsHat : 1.2*(v - .45)*g.z/g.w, d.y));
  ld.x = dot(bsL.xz, vec2(-n.z, n.x));
 }
 // the grain of straw or wood, or the cloud
 float rr = length(q.xz - g.xy), lx = 0.;
 if (bsM == 5) { n = normalize(cross(bsU, rd) + 1e-5); lx = clamp(dot(q - bsA - bsU*bsE.y, n)/bsR, -1., 1.); }
 float gr = noise(bsM == 0 ? vec2(p.x*1.6 + uTime*.006, p.y*7. + .3*sin(p.x*5.)) : bsM == 5 ? vec2(bsE.y*4.*length(bsU) + bsA.x*9., lx*4. + bsA.y*5.) : vec2(an*50., rr*2.));
 vec3 alb = bsMud(uv, bsT, bsM == 1 ? vec2(0.) : normalize(ld + 1e-4), rel), at = q + n*.04;
 if (bsM == 2) {
  // each kind's wash
  float wob = bsN, f = (log2(max(q.x, 1.)) - 1.2)/.72 + .5*(wob - .5) + .12*bsF, comb = 0.;
  int kd = lane ? (bsI < 2 ? bsI : bsI < 4 ? 5 - bsI : 4) : (int(clamp(f, 0., 4.99)) + 3) % 5;
  float fk = fract(f), wash = smoothstep(0., .14, fk)*bsIn(.07, fk - .93)*step(0., f)*step(f, 5.)*smoothstep(0., .3, .5 + .35*fract(float(kd)*.618) - q.y/5.4 + .45*(wob - .5) + .1*bsF);
  if (lane) {
   // combed with the fingers
   comb = bsIn(.02, abs(v - .655) - .215);
   rel += .75*comb*(.35 + .65*smoothstep(.2, .5, wob))*sin(q.y*62. + 2.5*sin(an*4.) + 5.*wob)/(1. + .03*bsT*bsT);
   wash = comb;
  }
  alb = mix(alb, bsKind(kd)*alb/bsClay, (lane ? .5 : .65)*wash*bsLv(kd));
  vec4 pm = piece(lane ? vec2(.5 + p.x*.55, .5 - p.y) : vec2(1. - f/5., sat(1. - q.y/6.)));
  alb *= mix(vec3(1.), vec3(.6, .55, .54) + .25*pm.rgb, .8*smoothstep(.1, .7, pm.a*(.7 + .6*wob)));
  vec3 red = lane ? mix(vec3(.4, .1, .045), bsKind(kd), .5*bsLv(kd)) : vec3(.42, .11, .05);
  alb = bsPaint(alb, lane ? an*g.z*2.6 : uv.x*.9, lane ? (v - .14)/(1. + 1.1*max(uOwn[5], 0.)) : (q.y - .5)/6., .004 + px*.25, lane ? .45 + .55*band(.5 + .3*an) : 1., red, lane ? .85*sat(1. + uOwn[5]) : max(uOwn[5], 0.));
  alb *= lane ? 1. - .45*smoothstep(.85, 1., v) : .8 + .2*smoothstep(0., .7, q.y + .4*wob);
  dif = dot(n, bsL) + .35*rel;
  am = (lane ? .5 + .35*v : .6 + .4*n.y)*(1. + .5*rel);
  bo = lane ? (.1 + .1*uMic + .14*sat(-n.x))*(1. - .5*v)*(1. + .5*rel) : .16*(.35 + .65/(1. + .5*q.y))*(.75 - .35*n.y);
 } else if (bsM == 3 || bsM == 4) {
  float tier = fract(rr*2.6 + .04*sin(an*14.));
  alb = vec3(.5, .38, .2)*(.4 + .7*gr)*(bsM == 3 ? 1. - .45*tier : .55);
  dif = bsM == 3 ? dot(n, bsL) + .35*(gr - .5) : 0.; am = bsM == 3 ? .9 : .35; bo = .06;
  at = q + n*.1;
 } else if (bsM == 5) {
  float end = bsI < 0 ? 0. : smoothstep(.9, 1., bsE.y);
  n = normalize(n*lx - rd*sqrt(1. - lx*lx) + normalize(bsU + 1e-5)*end);
  alb = mix(vec3(.4, .3, .21), vec3(.62, .51, .38), end)*(.7 + .5*gr);
  if (bsI < 0) alb *= 1.2 + smoothstep(.75, 1., fract(bsE.y*11.));
  dif = dot(n, bsL)*(1. + .3*uKeys); am = .6 + .4*n.y; bo = .14*(.6 - .5*n.y);
  at = q + bsL*.4 + n*.1;
 } else {
  alb = mix(alb, vec3(.62, .48, .32), .55);
  dif = bsL.y*.66; am = .8; bo = 0.; at.y = 0.;
  if (!lane) alb *= 1. - .35*sat(1. - q.z);
 }
 if (uOwn[6] < 0. && bsM != 4) alb = mix(alb, vec3(.82, .86, .93)*(.93 + .07*bsF), bsM == 1 ? -uOwn[6]*smoothstep(0., .3, -uOwn[6]*1.5 - bsN + .2) : -uOwn[6]*smoothstep(.0, .3, n.y - .62 + .45*(bsN - .5) + .18*(bsF - .5) + (bsM == 3 ? .22 : 0.) + (bsM == 2 ? .12*(1. - smoothstep(0., .5, q.y)) + (lane ? -.5 : .25) : 0.)));
 // a cue: a pool of sun goes along
 float far = p.x + .7 - 1.4*uCue;
 bsSun *= 1. + .8*uCue/(1. + 12.*far*far);
 // a phrase: the shadow of a kite comes over
 float kf = fract(uTime/26.);
 vec2 kq = lane ? at.xz + bsL.xz*(4. - at.y)/bsL.y - vec2(.8, 13. - 11.*kf) : at.xy - vec2(15. - 13.*kf, 3.4 + 1.2*kf);
 kq.x += (2.5 - kf)*sin(kf*9.)*.3;
 sun = sat(dif)*(1. - .75*bsKite((lane ? kq : vec2(kq.y - .4*kq.x, kq.x + .4*kq.y))/.78)*bsIn(.1, abs(kf - .5) - .4)*sat(uPhrase*1.6))*(lane ? bsLaneSun(at, bsI < 0 || bsM < 2 ? 1 : bsI) : bsSunAt(at));
 if (bsI >= 0) sun *= 1. - bsCast(at, lA, lU, bsNotch(sat(at.y/lU.y)));
 for (int j = 0; j < 2 && lane && bsM == 2 && sun > 0.; j++) { bsPeg(bsI, j, g, a, u, r); sun *= 1. - bsCast(at, a, u, r); }
 vec3 c = alb*(bsSun*sun + bsAmb*am + bsClay*bsSun*bo);
 c = mix(bsHaze, c, exp(-(bsM == 1 ? bsT*1.5 : max(bsT + tW - 9., 0.))*(.016 + .018*uSpace)*(1. - .4*b)));
 if (!lane && bsM == 2) {
  c = mix(c, bsHaze*.85, .3/(1. + 12.*q.y*q.y)*(.6 + .4*sin(q.x*.9 + uTime*.08 + 5.*bsN)));   // dust along the foot
  // the doorway: a step deep, cool and almost black, a lamp in it for the voice and at night
  vec2 dq = q.xy - vec2(8.35 - .04*sin(q.y*3.), 0.), din = dq + rd.xy/max(-rd.z, .05)*.16;
  float dr = length(max(vec2(abs(dq.x) - .22, dq.y - 1.6), 0.)) - .32, di = length(max(vec2(abs(din.x) - .22, din.y - 1.6), 0.)) - .32;
  vec3 ins = mix(bsClay*.3*(bsAmb + bsSun*.06), vec3(.006, .011, .03), bsIn(px + .01, di + .01));
  ins += vec3(1.5, .6, .16)*sat(1.1 - length(din - vec2(.1, .5)))*(uMic*.9 + .8*bsNight + .1*uKeys);
  c = mix(c, ins, bsIn(px, dr));
 }
 // the sky, with thin dusty cloud
 vec3 sky = mix(bsSky(rd.y, tS), bsHaze, .5*smoothstep(.45, .9, gr)*sat(1.2 - 2.2*p.y));
 if (bsM == 0) c = sky;
 vec3 back = bsM == 5 && !lane ? bsClay*(bsSun*.3 + bsAmb) : mix(bsHaze, mix(bsClay, vec3(.62, .48, .32), .55)*.85*(bsSun*.5 + bsAmb*.8), exp(-.03*bsT));
 if (wet) back = mix(back, bsHaze*.8, .7);
 col = mix(bsM2 == 0 ? sky : bsM2 == 1 || bsM == 5 && !lane ? back : c, c, bsC);
 if (wet) col = mix(col*vec3(.8, .84, .86), mix(bsClay, vec3(.12, .18, .2), .6)*(bsSun*.12 + bsAmb*.6), uOwn[6]*(.12 + .4*pow(max(rd.y, 0.), .7))) ;
 // a hit: a puff of dust falls from a beam's end
 float gone = 1. - uHits, pr = .4 + .6*gone;
 vec3 pu = (lane ? vec3(-.7, 2.5, 4.6) : vec3(6.4, 3.7, .6)) - vec3(0., .9*gone, 0.), e = bsSeg(ro, rd, pu, vec3(0., .5 + .3*gone, 0.));
 if (uOwn[7] != 0.) {
  if (!lane && uOwn[7] < 0.) pu.xyz = mix(pu, vec3(8.1, 5.4 - .5*gone, .7), -uOwn[7]);
  if (uOwn[7] > 0.) pr *= 1. + 2.2*uOwn[7];
  e = bsSeg(ro, rd, pu, vec3(0., .5 + .3*gone, 0.));
 }
 float puff = exp(-e.x*e.x/(pr*pr))*(.35 + 1.1*noise((ro + rd*e.z - pu).xy*5. + 2.*gone))*uHits;
 return screenOf(mix(col, (bsClay + .5)*bsSun*.4, sat(puff)));
}
