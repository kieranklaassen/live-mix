// name: Stand-up page
// a: Garden
// b: Towers of paper
// what: A book of thick white card lies open under one lamp on a pale table, and out of its fold rise sheets one behind another: grass, reeds, waves, leaves, arches, a sun and a row of trees, each throwing its shadow on the next; or a single white page folded upright, with stairs and towers of boxes cut and pushed out of it.
// follows: Each kind has its own sheet, or its own tower: quiet lies in the page, loud stands up. The phrase slides the sun on its arc, the spectrum cuts the tops of the trees or the page, and the piece tints the page. A hit lights the front sheet or the small house, a cue lifts all once, keys light reeds or windows, and as the loop ends a leaf turns over all.
// own: 0 1 the sheets are cut as mountain ridges (b: thin tall towers under a peaked page), -1 as a town of gables with windows (b: broad low flights of steps); 1 1 the eye low before them, -1 high above; 2 1 card dyed deep in its sound's colour, -1 black card; 3 the table: 1 black, -1 a cloth in the drone's colour; 4 1 the lamp stands behind and the paper glows (b: windows lit, dusk), -1 a low sun and long shadows; 5 1 many fine cuts (b: many small steps), -1 few broad ones; 6 1 no book, the paper runs out of the picture, -1 (of a) a narrow card; 7 1 printed with stripes and dots, -1 mist between the sheets (b: about their feet)
const float spV = .3; // the fold down each sheet's middle
float spZF = -.74, spZB = 1.62, spXB = 1.06, spFin = 1.; const float spBs = -.15;
float spG = .55, spFD = 1.02; // the card of b: its gutter, and how deep its lying page is
vec3 spPa = vec3(.95, .935, .905);
float spZ[7], spWd[7], spS[7], spC[7]; // each sheet: its hinge, half width, angle
vec4 spI[9]; vec3 spL, spK, spA;
vec3 spHz; // the mist
vec4 spTw[5]; vec2 spTs[5]; vec4 spTz[5]; // each tower: left, right, depth, height; its steps, how loud; a step
vec2 spSun, spW; float spPhi, spBow, spPx, spPen, spGr, spWa, spWi; vec2 spE, spO; // the sun, the standing page's lean; the turning leaf, its bow, a pixel, softness, grain
float spH(float n) { return fract(n*.618034+n*n*.0837); }
vec3 spT(vec3 c, float k) { return mix(spPa, c*.93/max(max(c.r, c.g), max(c.b, .05)), k); }
float spNear(vec3 q) { vec3 l = spL - q; return 2.3/length(l); }
// The cuts. Each gives how far inside the paper a place is.
float spBl(vec2 q, float cell, float seed, float lo, float hi, float w, float lean) {
 float id = floor(q.x/cell), r = spH(id+seed);
 float y = max(q.y, .0)/mix(lo, hi, r), y2 = y*y;
 return w*(1. - y2) - abs(q.x - (id+.5)*cell - (fract(r*7.7) - .5)*lean*y2);
}
float spLc(vec2 q, float l, float w) { float r = (l*l+w*w)/(2.*w); return r - length(vec2(q.x, abs(q.y)+r - w)); }
float spWave(vec2 q, float id) {
 vec2 c = vec2((id+.5)*.27, .13+.035*sin(id*1.9+uTime*.25));
 float d = length(q - c);
 return min(.165 - d, max(min(abs(d - .125), abs(d - .078)) - .0075, c.y - .015 - q.y));
}
// Two pieces of one sheet, with a rounded cut between them.
float spJoin(float a, float b) { float h = max(.02 - abs(a - b), .0); return max(a, b)+h*h*12.5; }
float spArch(vec2 q, float r, float cy, float th, inout float hole) {
 float d = length(vec2(q.x, max(q.y - cy, .0)));
 hole = min(hole, d - r);
 return r+th - d;
}
float spCut0(vec2 q) { // grass
 return spJoin(max(spBl(q, .085, 3., .1, .26, .022, .06), spBl(q+vec2(.031, .0), .097, 11., .07, .2, .024, .08)), .03 - q.y);
}
float spCut1(vec2 q) { // reeds
 q.y /= .5+.5*smoothstep(.1, .85, abs(q.x+.12));
 float s = spBl(q, .095, 5., .24, .58, .015, .1);
 float id = floor(q.x/.19), r = spH(id+40.), x = q.x - (id+.5)*.19 - .04*(r - .5), h = .34+.17*r;
 s = max(s, min(.005 - abs(x), h - q.y));
 s = max(s, .016 - length(vec2(x, max(abs(q.y - h+.02) - .045, .0))));
 return spJoin(s, .045 - q.y);
}
float spCut2(vec2 q) { // waves
 float u = q.x/.27, id = floor(u);
 return max(max(spWave(q, id), spWave(q, id+(u - id < .5 ? -1. : 1.))), .06 - q.y);
}
float spCut3(vec2 q) { // leaves on their stems
 float id = floor(q.x/.42), r = spH(id+2.3), H = .32+.22*r;
 float u = q.x - (id+.5)*.42 - .04*sin(q.y*5.+r*6.) - .06*(r - .5);
 float s = min(.013*(1.3 - q.y/H) - abs(u), H - q.y);
 float k = clamp(floor((q.y - .04)/.1), .0, floor((H - .04)/.1) - 1.), sz = 1.15 - .06*k/H;
 vec2 m = mat2(.732, -.682, .682, .732)*vec2(abs(u), q.y - .06 - k*.1);
 m.x -= .085*sz;
 s = max(s, spLc(m, .088*sz, .032*sz));
 s = max(s, spLc(vec2(q.y - H - .03, u), .075, .03));
 return spJoin(s, .05 - q.y);
}
float spCut4(vec2 q) { // arches
 float hole = 1.;
 float s = spArch(q - vec2(-.53, .0), .2, .28, .08, hole);
 s = max(s, spArch(q - vec2(.05, .0), .27, .37, .085, hole));
 s = max(s, spArch(q - vec2(.61, .0), .19, .22, .075, hole));
 return min(max(min(s, hole), .05 - q.y), abs(hole - .036) - .005);
}
float spCut5(vec2 q) { // the sun on its arm
 vec2 m = q - .66*spSun;
 float d = length(m), a = d > .001 ? atan(m.x, m.y)/TAU*18. : .0, tooth = abs(fract(a) - .5);
 float s = max(.135 - d, min(min(.25 - d - .64*tooth*tooth, (.36 - tooth)*d*.33), d - .12));
 s = min(s, max(abs(d - .105) - .004, .02 - abs(m.x)));
 return max(s, min(.012 - abs(dot(q, vec2(spSun.y, -spSun.x))), .52 - length(q)));
}
float spCut6(vec2 q) { // cypresses and round crowns, as high as their bands
 float u = q.x*4.5, id = floor(u), x = (u - id - .5)/4.5, r = spH(id+9.), h = .48+.14*r+.36*band((id+5.5)/10.);
 float s = spLc(vec2(q.y - .5*h, x), .5*h, .045+.025*r);
 u += .5; id = floor(u); x = (u - id - .5)/4.5; r = spH(id+40.); h = .36+.12*r+.24*uMid;
 s = max(s, .055+.025*r - length(vec2(x, (q.y - h)*.8)));
 return max(max(s, min(.012 - abs(x), h - q.y)), .17 - q.y);
}
// What else a sheet may be cut as: i is which of them it is.
float spTri(float x) { return abs(fract(x) - .5)*2.; }
float spElse(float i, vec2 q, float was) {
 if (uOwn[0] > .0 && i != 5.) {
  float x = q.x*spFin*.9+i*2.37;
  float y = .46*spTri(x)+.3*spTri(x*1.63+.3)+.15*spTri(x*3.7)+.06*spTri(x*9.1+.2);
  was = mix(was, (.05+.066*i+(.3+.03*i+.1*uMid*step(5.5, i))*y - q.y)*.55, uOwn[0]);
 }
 if (uOwn[0] < .0 && i != 5.) {
  float c = .17/spFin, u = q.x/c+i*.37, id = floor(u), h = spH(id+i*7.3), x = (u - id - .5)*c, hi = .09+.052*i+(.16+.02*i)*h;
  float k = fract(h*13.7), hw = c*(k > .75 ? .34 : .5), s = min((hi+(k > .75 ? .16 : .0)+(.5+k)*(hw - abs(x)) - q.y)*.7, hw - abs(x)+(k > .75 ? .0 : .004));
  s = max(s, .07 - q.y);
  vec2 w = vec2(abs(fract(x/(c*.34)+.5) - .5)*c*.34, abs(fract(q.y/.075) - .5)*.075);
  float o = max(w.x - .2*c*.34, w.y - .02);
  if (q.y > .075 && q.y < floor(hi/.075)*.075 && abs(x) < hw*.8) s = min(s, o);
  was = mix(was, s, -uOwn[0]);
 }
 return was;
}
#define SP_CUT(i, CUT) (uOwn[0] == .0 && uOwn[5] == .0 ? CUT(q) : spElse(float(i), q, (i == 5 ? CUT(q) : CUT(vec2(q.x*spFin, q.y))/max(spFin, 1.))))
// The sheet's place on a ray: both halves of its fold are planes, and the ray is in once it is past both.
float spHit(float s, float c, float z, vec3 ro, vec3 rd) {
 float sx = spV*s, f = (ro.z - z)*s - ro.y*c, d = rd.z*s - rd.y*c;
 return max((sx*ro.x - f)/max(d - sx*rd.x, 1e-4), (-sx*ro.x - f)/max(d+sx*rd.x, 1e-4));
}
vec2 spOn(float s, float c, float z, vec3 q) { return vec2(q.x, q.y*s+(q.z - z - abs(q.x)*spV)*c); }
// The turning leaf: a bowed sheet hinged on the gutter. o and d run along the page it leaves, and up.
float spTurn(vec2 o, vec2 d, float R, out float r, out vec2 n) {
 float c = spE.x, s = spE.y, k = -.35*spBow; o -= spO;
 vec2 O = vec2(o.x*c+o.y*s, o.y*c - o.x*s), D = vec2(d.x*c+d.y*s, d.y*c - d.x*s);
 float A = k*D.x*D.x, B = D.y - k*D.x*(R - 2.*O.x), C = O.y - k*O.x*(R - O.x);
 float q = -.5*(B+(B < .0 ? -1. : 1.)*sqrt(max(B*B - 4.*A*C, .0)));
 float t2 = C/(abs(q) < 1e-5 ? 1e-5 : q), t1 = abs(A) > 1e-5 ? q/A : t2, r1 = O.x+t1*D.x, r2 = O.x+t2*D.x;
 float t = t1 > .0 && r1 > .0 && r1 < R && (t1 < t2 || t2 < .0 || r2 > R || r2 < .0) ? t1 : t2;
 r = O.x+t*D.x;
 vec2 m = normalize(vec2(-k*(R - 2.*r), 1.));
 n = vec2(m.x*c - m.y*s, m.x*s+m.y*c);
 return B*B < 4.*A*C ? -1. : t;
}
float spShut(vec2 o, vec2 L, float R, float z) {
 vec2 m = vec2(-spE.y, spE.x); o -= spO;
 float den = dot(L, m), t = abs(den) > 1e-3 ? -dot(o, m)/den : -1., r = dot(o+L*t, spE), w = .02+spPen*max(t, .0);
 return t < .005 ? 1. : 1. - sat(2.*spBow)*smoothstep(-w, w, min(min(r+.02, R - r), z));
}
float spPg(float x) { if (uOwn[6] > .0) x *= 1. - .8*uOwn[6]; float k = 1.+9.*abs(x); return -.075/(k*k) - .035*x*x; }
vec3 spTb(vec3 q, float za, float zb) {
 vec3 L = normalize(spL - q);
 vec2 s = q.xz+L.xz*(.11/L.y);
 float d = min(spXB - abs(s.x), min(s.y - za, zb - s.y)), near = min(spXB - abs(q.x), min(q.z - za, zb - q.z));
 vec3 wood = vec3(.75, .71, .655);
 if (uOwn[3] > .0) wood = mix(wood, vec3(.035, .033, .036), min(1., 1.15*uOwn[3]));
 if (uOwn[3] < .0) { vec2 u = rot(.5)*q.xz; vec2 fu = fwidth(u); float px = max(fu.x, fu.y)*14.; vec3 k = uKind[0]*uKind[0];
  wood = mix(wood, k*(.82+.2*noise(u*3.)+.16*(1. - smoothstep(.12, .35, px))*sin(u.x*90.)*sin(u.y*90.))*mix(1., 1.35, smoothstep(.44, .46, abs(fract(u.x*1.6) - .5))), min(1., -1.2*uOwn[3])); }
 return wood*(spK*L.y*(1. - smoothstep(-.07, .06, d))*spNear(q)+spA*(1. - .5/(1. - 20.*min(near, .0))));
}
vec3 spFr(vec3 q, float top) {
 vec3 al = mix(spPa*(.9+.1*sin((q.y - top)*190.)*sat(1.5 - 300.*spPx)), (uOwn[2] < .0 ? mix(vec3(.4, .42, .44), spPa*1.6, -uOwn[2]) : vec3(.4, .42, .44)), smoothstep(-.034, -.03, spBs - q.y));
 return al*(spK*.42+spA*.75*sat(.5+(q.y - spBs)*5.));
}
// One sheet met by the ray: where its edge faces up the card's thickness shows. The two nearest are kept.
// Its foot darkens the page, and its colour falls before it.
#define SP_ME(i, CUT) { float s = spS[i], c = spC[i], z = spZ[i], t = spHit(s, c, z, ro, rd), px = t*spPx; \
 vec2 q = spOn(s, c, z, ro+rd*t); float v = min(SP_CUT(i, CUT), spWd[i] - abs(q.x)), up = sat(-dFdy(v)/px); \
 vec4 me = vec4(t, sat(.5+v/px)*sat(.5+(tp - t)/(2.*px)), sat(.5+(.013*up - v)/px)*up, float(i)); \
 if (t > .0 && me.y > .02 && q.y > -.09) { if (t < l1.x) { l2 = l1; l1 = me; } else if (t < l2.x) l2 = me; } \
 float d = z+abs(P.x)*spV - P.z, k = max(1. - abs(d)*6., .0)*s*foot; k *= k*smoothstep(-.02, .1, spWd[i] - abs(P.x)); \
 pao *= 1. - .4*k; if (d > .0) palb = mix(palb, spI[i].rgb, .75*k); }
// What one sheet lets by of the light on its way to a place.
#define SP_SH(i, CUT) { float s = spS[i], c = spC[i], z = spZ[i], f0 = (pos.z - z)*s - pos.y*c, sx = spV*s, d0 = L.z*s - L.y*c; \
 float fa = f0 - sx*pos.x, fb = f0+sx*pos.x, a = d0 - sx*L.x, b = d0+sx*L.x; \
 float t = min(fa/max(-a, 1e-3), fb/max(-b, 1e-3)), w = .006+spPen*t; vec2 q = spOn(s, c, z, pos+L*t); \
 bool on = min(fa, fb) > .004; \
 if (uOwn[4] > .0 && min(a, b) > .0) { t = spHit(s, c, z, pos, L); w = .006+spPen*max(t, .0); q = spOn(s, c, z, pos+L*t); on = t > .012; } \
 float k = smoothstep(-w, w, min(SP_CUT(i, CUT), spWd[i] - abs(q.x))); \
 if (on && t < 2.5 && q.y > -.05) sh *= 1. - k; }
// b, in the card's own measure: across, out from the standing page, and up along it.
vec3 spToD(vec3 d) { float v = d.y*spWi; return vec3(d.x, v*spW.y - d.z, v); }
vec3 spTo(vec3 q) { return spToD(q)+vec3(.0, spG, .0); }
float spTop(float x) { float id = floor(x*6.5+.5); return 0.96+.12*spH(id+60.)+.18*band((id+7.)/14.)+(uOwn[0] > .0 ? uOwn[0]*(.75*spTri(x*1.1+.35)+.35*spTri(x*3.1) - .35) : .0)+max(uOwn[6], .0)*1.6; }
float spIn(vec2 g, float n, vec2 z) {
 float k = clamp(floor(.5*(n - g.x+g.y)), .0, n - 1.);
 return min((n - k - g.x)*z.x, (k+1. - g.y)*z.y);
}
// A tower on a ray: in by the front or the top of a step, or by its open side.
void spSt(vec4 T, vec2 G, float n, float id, vec3 o, vec3 d, inout vec2 hit) {
 vec2 g = o.yz*G, e = d.yz*G;
 float ta = (n+1. - g.x - g.y)/(e.x+e.y), k = clamp(floor(g.y+e.y*ta), .0, n);
 float tf = (n - k - g.x)/e.x, tt = (k - g.y)/e.y, ts = max(ta, min(tf, tt)), x = o.x+d.x*ts;
 if (ts < hit.x && x > T.x && x < T.y && (k > .5 || tf < tt) && (k < n - .5 || tt < tf)) hit = vec2(ts, id+(tf < tt ? 1. : 2.));
 float tx = ((d.x > .0 ? T.x : T.y) - o.x)/d.x; vec2 m = g+e*tx;
 if (tx > .0 && tx < hit.x && m.x > .0 && m.y > .0 && floor(m.x)+floor(m.y) < n) hit = vec2(tx, id);
}
// What a ray meets first: 0 table, 1 pages' edges, 2 lying page, 3 standing page, 5 its edge, 6 leaf, 10 on towers: side, front, top.
vec2 spSee(vec3 ro, vec3 rd) {
 vec3 o = spTo(ro), d = spToD(rd), q;
 d = vec3(abs(d.x) < 1e-4 ? 1e-4 : d.x, min(d.yz, -1e-3));
 vec2 hit = vec2((spBs - ro.y)/rd.y, .0);
 float t = (spG - spFD - ro.z)/rd.z; q = ro+rd*t;
 if (abs(q.x) < spXB && q.y < .0 && q.y > spBs) hit = vec2(t, 1.);
 t = -o.y/d.y; q = o+d*t;
 float sky = spTop(q.x), tw = t; bool wall = abs(q.x) < spXB && q.z < sky && q.z > .0;
 t = (-.03 - o.y)/d.y; q = o+d*t;
 if (abs(q.x) < spXB && q.z < sky && q.z > .0) hit = vec2(t, 5.);
 t = -o.z/d.z; q = o+d*t;
 if (abs(q.x) < spXB && q.y > .0 && q.y < spFD) hit = vec2(t, 2.);
 if (wall) hit = vec2(tw, 3.);
 #define SP_ST(i, id) spSt(spTw[i], spTz[i].zw, spTs[i].x, id, o, d, hit);
 SP_ST(0, 10.) SP_ST(1, 13.) SP_ST(2, 16.) SP_ST(3, 19.) SP_ST(4, 22.)
 return hit;
}
#define SP_P(i) { vec4 U = spTw[i], z = spTz[i]; float k = max((U.y - o.x)*dx, .0), w = .008+1.3*spPen*k; \
 vec3 c = o+d*k; \
 sh *= 1. - sat(.5*min(spIn(c.yz*z.zw, spTs[i].x, z.xy), c.y+w)/w)*sat((o.x - U.x)/(.02+w)); \
 vec3 v = max(vec3(max(U.x - q.x, q.x - U.y), q.yz - U.zw), .0); float l = max(1. - 12.*dot(v, v), .0); l *= l*l*page; \
 alb = mix(alb, spI[i].rgb, (uOwn[2] < .0 ? .4+.32*uOwn[2] : .4)*spTs[i].y*l); }
vec3 spLit(vec3 pos, vec3 n, vec3 alb, float ao, float nl, float sh, float thin) {
 return alb*spGr*(spK*(nl > .0 ? nl*sh : -nl*thin)*spNear(pos)+spA*ao*(.72+.28*n.y));
}
vec3 spPic(vec3 ro, vec3 rd, vec3 fr, vec3 fu, vec4 leaf, vec3 ln, vec3 under, bool card) {
 float gy = min(rd.y, -.02), tp = -ro.y/gy; tp = (spPg(ro.x+rd.x*tp) - ro.y)/gy; tp = (spPg(ro.x+rd.x*tp) - ro.y)/gy;
 vec3 P = ro+rd*tp;
 float onPage = sat(.5+min(min(spXB - abs(P.x), spZB - P.z), P.z - spZF)/(tp*spPx)), pao = 1. - .5*exp(-abs(P.x)*16.);
 spGr = .97+.06*noise(P.xz*130.);
 if (rd.y > -.021) onPage = .0;
 if (uOwn[1] > .0 && uOwn[6] > .0) onPage *= 1. - smoothstep(-.26, -.08, rd.y)*min(1., 2.*uOwn[1]*uOwn[6]);
 vec4 l1 = leaf, l2 = vec4(1e4, .0, .0, 8.), m = piece(vec2(.5+.52*P.x, (card ? -P.z : -.14 - P.z)/.56));
 vec3 palb = spPa*mix(vec3(1.), spT(m.rgb+.02, .8), .7*sat(1.6*m.a)*spWa); // the piece, printed on the page like a wash
 float foot = card ? .0 : 1.;
 if (onPage < .5) tp = 1e3;
 if (!card) {
 SP_ME(0, spCut0) SP_ME(1, spCut1) SP_ME(2, spCut2) SP_ME(3, spCut3) SP_ME(4, spCut4) SP_ME(5, spCut5) SP_ME(6, spCut6)
 }
 float tf = ((card ? spG - spFD : spZF) - ro.z)/rd.z; vec3 F = ro+rd*tf;
 float top = card ? .0 : spPg(F.x);
 vec3 front = spFr(F, top);
 if (!card) under = mix(under, front, sat(.5+min(min(top - F.y, F.y - spBs), spXB - abs(F.x))/(tf*spPx)));
 vec2 ids = vec2(.0), ts = vec2(1.);
 if (card) for (int k = 0; k < 2 && (k == 0 || card); k++) {
  vec2 h = spSee(ro, rd+(fr*(k == 0 ? .3 : -.3)+fu*(k == 0 ? .18 : -.18))*spPx);
  if (leaf.y > .5 && leaf.x < h.x) h = vec2(leaf.x, 6.);
  if (k == 0) { ids = h.yy; ts = h.xx; } else { ids.y = h.y; ts.y = h.x; }
 }
 vec3 col = vec3(.0); float left = 1., hk = max(1. - 3.*abs(spZ[0] - .1+abs(P.x)*spV - P.z), .0);
 if (!card) for (int pass = 0; pass < 3 && left > .02 && (pass == 0 || !card); pass++) {
  int kg = int(l1.w);
  float cov = l1.y, ed = l1.z, ao = 1., sh = 1.;
  vec3 pos = ro+rd*l1.x, n, alb = spPa, add = vec3(.0);
  if (kg < 7) {
   vec4 ink = spI[kg];
   n = normalize(mix(vec3((pos.x > .0 ? spV : -spV)*ink.w, sqrt(max(1. - ink.w*ink.w, .0)), -ink.w), vec3(-.4, .85, -.1), .75*ed));
   ao = mix(.65+.35*sat(pos.y*4.), 1., ed);
   alb = mix(ink.rgb*(1. - .08*max(1. - abs(pos.x)*90., .0)), vec3(.97), .6*ed);
   if (uOwn[7] > .0 && l1.x < 50.) {
    vec2 q = spOn(spS[kg], spC[kg], spZ[kg], pos);
    float m = mod(float(kg), 3.), w = spPx*l1.x*40., pat = m < .5 ? sin(q.y*95.) : m < 1.5 ? .36 - length(fract(q*vec2(17., 17.)) - .5) : sin((q.x*sign(q.x)+q.y)*75.);
    if (m > .5 && m < 1.5) pat *= 5.;
    alb = mix(alb, mix(alb*alb*.45, spPa, uOwn[2] > .0 ? .8*uOwn[2] : .0), uOwn[7]*smoothstep(-.3 - w, .3+w, pat)*(1. - .7*ed)*sat(1.4 - w));
   }
   add = ink.rgb*((kg == 0 ? uHits*(.4+ed)*(.6+uEnergy) : .0)*uKind[4]+ed*(kg == 1 ? .4*uKeys : .0)+ed*.3*uCue);
  } else if (kg == 7) n = dot(ln, rd) > .0 ? -ln : ln;
  else {
   pos = P; cov = 1.; alb = palb; ao = pao; add = uKind[4]*uHits*hk*hk*(.5+uEnergy);
   n = normalize(vec3((spPg(P.x - .01) - spPg(P.x+.01))/.02, 1., .0));
  }
  if (uOwn[2] < .0) add *= 1.+.7*uOwn[2];
  vec3 L = normalize(spL - pos);
  SP_SH(0, spCut0) SP_SH(1, spCut1) SP_SH(2, spCut2) SP_SH(3, spCut3) SP_SH(4, spCut4) SP_SH(5, spCut5)
  sh = kg == 7 ? 1. : sh*spShut(pos.xy, L.xy, min(spXB, 1.06), 1.18 - abs(pos.z - .44));
  vec3 c = spLit(pos, n, alb, ao, dot(n, L), sh, kg == 7 ? .5 : uOwn[4] > .0 ? mix(.12, .62*(.35+.65*sh), uOwn[4]) : .12)+add;
  if (uOwn[7] < .0) c = mix(c, spHz, -uOwn[7]*(1. - exp(-1.5*max(pos.z+.62, .0)))*(1. - .35*sat(pos.y*1.2)));
  col += left*cov*(kg == 8 ? mix(under, c, onPage) : c);
  left *= 1. - cov;
  l1 = l2; l2 = vec4(1e4, .0, .0, 8.);
 }
 vec3 garden = col;
 float id = ids.x, t = ts.x; left = .0; col = vec3(.0);
 if (card) for (int pass = 0; pass < 2 && left < .9 && (pass == 0 || card); pass++) {
  int ki = int(clamp((id - 10.)/3., .0, 4.));
  float ao = 1., lit = 1., sh = 1., page = id > 1.5 && id < 4.5 ? 1. : .0;
  vec3 n = vec3(.0, 1., .0), alb = spPa, add = vec3(.0), pos = ro+rd*t, q = spTo(pos);
  float px = t*spPx, fc = id > 9.5 ? mod(id - 10., 3.) : -1.;
  vec4 T = spTw[ki], I = spI[ki]; vec2 S = vec2(floor(I.w), fract(I.w)), size = T.zw/S.x, k = q.yz/size;
  vec3 ink = I.rgb*I.rgb, wn = vec3(.0, spW.y, -spW.x);
  if (id < 2.5) alb = palb, ao = 1. - .5/(1.+12.*abs(q.y));
  else if (id < 4.5) { n = wn; ao = 1. - .45/(1.+9.*abs(q.z)); }
  else if (id < 5.5) { n = vec3(-.42, .9, -.1); alb = vec3(.97); }
  else if (fc > -.5 && fc < .5) { // the open side: the strip's own edge, and the hollow under it
   n = vec3(q.x > .5*(T.x+T.y) ? 1. : -1., .0, .0);
   float e = spIn(k, S.x, size); lit = smoothstep(-px, px, .018 - e);
   alb = mix(vec3(.85), vec3(.97), lit);
   ao = mix(.45+.5/(1.+16.*abs(e)), 2., lit);
   add = ink*(.08+.4*S.y+.3*uCue)*(1. - lit)*(.3+.7*q.z/T.w);
  } else if (fc > .5 && fc < 1.5) { // the front, with a window where the steps are tall
   n = wn;
   float nx = max(floor((T.y - T.x)/.1), 1.), cw = (T.y - T.x)/nx, y = fract(k.y)*size.y, hf = .24*size.y;
   vec2 w = vec2((fract((q.x - T.x)/cw) - .5)*cw, y - .45*size.y);
   if (w.y > .0) w.y += .02 - sqrt(max(.0004 - w.x*w.x, .0));
   float o2 = sat(.5+min(min(.02 - abs(w.x), hf - abs(w.y)), min(.02 - abs(w.x - .008), hf - abs(w.y+.01)))/px)*step(S.x, 4.5);
   lit = 1. - o2;
   ao = mix(mix(.6, 1., smoothstep(.0, .2, y)), .25, o2);
   add = ink*(.12+.6*S.y+.3*max(uKeys, uCue))*o2;
   if (uOwn[4] > .0) add += mix(ink, vec3(1., .72, .4), .45)*uOwn[4]*(.7+1.6*S.y)*o2;
  } else if (fc > 1.5) ao = mix(.65, 1., fract(k.x+.001));
  if (ki == 0 && fc > -.5) add += ink*uHits*(.3+uEnergy)*(fc > 1.5 ? .25 : .7 - .6*lit);
  alb *= mix(vec3(1.), spI[0].rgb, uHits*page*sat(1.7 - 2.1*length(q - vec3(-.09, .5, .0))));
  if (uOwn[2] < .0 && id > 4.5 && id < 5.5) alb = mix(alb, spPa*2.+.04, -uOwn[2]);
  if (uOwn[2] < .0 && fc > -.5) alb = mix(alb, I.rgb*I.rgb*.9*lit, -.7*uOwn[2]);
  if (uOwn[2] > .0 && fc > -.5) alb = mix(alb, I.rgb*I.rgb*(fc > .5 && fc < 1.5 ? 1. - .9*(1. - lit) : .95), uOwn[2]);
  if (uOwn[7] > .0 && id > 1.5 && id != 6.) {
   vec2 u = id < 2.5 ? q.xy : fc > 1.5 || id < 4.5 ? vec2(q.x, id < 4.5 ? q.z : q.y) : vec2(q.x+q.y, q.z);
   float w = px*40., m = fc > -.5 ? mod(float(ki), 2.) : 2., pat = m < .5 ? sin(u.x*110.) : m < 1.5 ? sin((u.x+u.y)*90.) : 6.*(.3 - length(fract(u*13.) - .5));
   alb *= mix(vec3(1.), fc > -.5 ? I.rgb*.5 : mix(vec3(.8), spI[4].rgb, .7), uOwn[7]*smoothstep(-.3 - w, .3+w, pat)*lit*sat(1.4 - w));
  }
  bool turning = id == 6.;
  if (turning) n = dot(ln, rd) > .0 ? -ln : ln;
  vec3 L = normalize(spL - pos), o = spTo(pos+n*.006), d = spToD(L);
  float dx = 1./min(d.x, -1e-3);
  SP_P(0) SP_P(1) SP_P(2) SP_P(3) SP_P(4)
  sh = turning ? 1. : sh*spShut(vec2(spG - pos.z, pos.y), vec2(-L.z, L.y), .95, min(spXB, 1.06) - abs(pos.x));
  float nl = dot(n, L);
  vec3 c = spLit(pos, n, alb, ao, nl > .0 ? nl*lit : nl, sh, turning ? .5 : .1*lit)+add;
  if (uOwn[7] < .0) c = mix(c, spHz, -uOwn[7]*exp(-3.2*max(q.z, .0))*(.75+.25*noise(q.xy*3.+vec2(mod(uTime*.05, 64.), 0.))));
  float share = abs(ids.x - ids.y) < .5 ? 1. : .5;
  col += share*(id < .5 ? under : id < 1.5 ? front : c); left += share;
  id = ids.y; t = ts.y;
 }
 return card ? col : garden;
}
// How far a sound has raised its paper.
float spR(float l, float up) { float q = 1.15*l/(l+.5); return q+.55*up*(1. - q); }
#define SP_S(i, z, wide, l, b) { float h = mix(mix(.16 - .01*float(i), .9, l)+b, .075 - .007*float(i), E), k = 1./(1.+h*h); \
 spZ[i] = z; spWd[i] = wide; spS[i] = 2.*h*k; spC[i] = (1. - h*h)*k; }
#define SP_TW(i, x0, x1, dp, hi, steps, l, r, b) { float q = (1. - E)*(r+b); \
 spTw[i] = vec4(x0, x1, dp*mix(.12 - .08*E, 1., q), hi*mix(.72, 1., q)); spTs[i] = vec2(steps, l); spTz[i].xy = spTw[i].zw/steps; spTz[i].zw = 1./spTz[i].xy; }
vec3 render(vec2 p) {
 bool card = uVar > .5;
 float zoom = clamp(1.4*uRes.y/uRes.x, 1., 1.9), up = 4.*uCue*(1. - uCue), l = fract(uLoop);
 // the page turns in the last part of the loop: everything lies down, the leaf goes over, everything stands again
 float E = smoothstep(.85, .895, l)*(1. - smoothstep(.958, 1., l)), turn = l < .965 ? smoothstep(.877, .965, l) : .0;
 spWa = 1. - smoothstep(.85, .876, l)*(1. - smoothstep(.97, 1., l));
 float lean = .32 - .16*uLevel;
 spBow = sin(PI*turn); spPhi = turn*(card ? .5*PI+lean : PI);
 spE = vec2(cos(spPhi), sin(spPhi)); spO = card ? vec2(-.02) : vec2(.0, -.07); spW = vec2(cos(lean), sin(lean)); spWi = 1./spW.x;
 spPen = mix(.11, .04, uTone);
 spFin = exp2(uOwn[5]*(uOwn[5] > .0 ? .9 : 1.));
 if (uOwn[2] < .0) spPa = mix(spPa, vec3(.032, .034, .042)+.05*uKind[0]*uKind[0], min(1., -1.1*uOwn[2]));
 if (uOwn[6] > .0) { spXB += 2.2*uOwn[6]; spZF -= 2.2*uOwn[6]; spZB += 9.*uOwn[6]; if (uOwn[2] > .0) spPa = mix(spPa, uKind[0]*(.4+.6*uKind[0])+.02, .9*uOwn[6]*uOwn[2]); }
 if (uOwn[6] > .0 && card) spFD += 2.5*uOwn[6];
 if (uOwn[6] < .0 && !card) spXB += .42*uOwn[6];
 spL = card ? vec3(-2.7, 2.1, -1.1) : vec3(-2.3, 2.5, -1.5);
 spK = vec3(1., .91, .75)*(2.25+.5*uCue);
 spA = vec3(.25, .28, .35);
 if (uOwn[4] > .0) { if (!card) { spL = mix(spL, vec3(.5, 1.55, 3.1), uOwn[4]); spK *= 1.+.35*uOwn[4]; spA *= 1. - .35*uOwn[4]; } else { spK *= mix(vec3(1.), vec3(.1, .15, .26), uOwn[4]); spA *= mix(vec3(1.), vec3(.36, .45, .66), uOwn[4]); } }
 if (uOwn[4] < .0) { spL = mix(spL, card ? vec3(-3.4, .95, -.9) : vec3(-3.3, .92, -.75), -uOwn[4]); spK *= mix(vec3(1.), vec3(1.32, 1.1, .82), -uOwn[4]); spA *= mix(vec3(1.), vec3(.72, .8, 1.), -uOwn[4]); }
 spL.y -= .6*(uSpace - .5);
 float foc = card ? 1.42 : 1.54;
 spPx = zoom/(foc*uRes.y);
 vec3 b = .011*sin(uTime*.31+vec3(.0, 2.1, 4.2));
 float rd_ = spR(uDrone, up), rp = spR(uPad, up), rt = spR(uTexture, up), rf = spR(uPhrase, up), rl = spR(uLevel, up);
 SP_S(0, -.46, .86, spR(.3*uLevel+.1, up), b.x) SP_TW(0, -.2, .02, .8, .2, 2., uHits, .3+.4*uLevel, b.y)
 SP_S(1, -.24, .92, rt, b.y) SP_TW(1, .24, .54, .74, .5, 9., uTexture, rt, b.z)
 SP_S(2, -.02, .95, rd_, b.z+.06*uMic) SP_TW(2, -.92, -.42, .8, .6, 6., uDrone, rd_, b.x)
 SP_S(3, .22, .84, rf, b.x) SP_TW(3, .64, .92, .36, 1., 4., uPhrase, rf, b.x)
 SP_S(4, .46, .94, rp, b.y) SP_TW(4, -.3, .1, .48, .88, 4., uPad, rp, b.y)
 SP_S(5, .66, .93, max(rf, .8*rl), b.z)
 SP_S(6, .84, .96, rl, b.x)
 if (uOwn[6] != .0 && !card) for (int i = 0; i < 7; i++) spWd[i] *= uOwn[6] > .0 ? 1.+1.5*uOwn[6] : 1.+.45*uOwn[6];
 if (card && (uOwn[0] != .0 || uOwn[5] != .0)) for (int i = 0; i < 5; i++) {
  vec4 T = spTw[i]; float m = .5*(T.x+T.y), h = .5*(T.y - T.x)*(uOwn[0] > .0 ? 1. - .45*uOwn[0] : 1. - .3*uOwn[0]), n = max(floor(spTs[i].x*exp2(uOwn[5])+.5), 1.);
  T = vec4(m - h, m+h, T.z*(uOwn[0] > .0 ? 1. - .35*uOwn[0] : 1. - .12*uOwn[0]), T.w*(uOwn[0] > .0 ? 1.+(i == 0 ? 1.2 : i == 3 ? .12 : .32)*uOwn[0] : 1.+.4*uOwn[0]));
  spTw[i] = T; spTs[i].x = n; spTz[i].xy = T.zw/n; spTz[i].zw = 1./spTz[i].xy;
 }
 float k = card ? .3 : .0;
 #define SP_I(i, c, l) spI[i] = vec4(spT(c, l), card ? spTs[min(i, 4)].x+.95*spTs[min(i, 4)].y : spS[i]);
 SP_I(0, uKind[4], .35+1.5*k) SP_I(1, uKind[2], .5+k+.2*uTexture) SP_I(2, uKind[0], .5+k+.2*uDrone) SP_I(3, uKind[3], .45+k+.2*uPhrase)
 SP_I(4, uKind[1], .4+k+.2*uPad) SP_I(5, mix(uKind[3], vec3(1., .75, .25), .75), .6) SP_I(6, mix(uKind[0], uKind[3], .6), .28)
 if (uOwn[2] > .0 && !card) {
  for (int i = 0; i < 7; i++) { vec3 c = i == 0 ? uKind[4] : i == 1 ? uKind[2] : i == 2 ? uKind[0] : i == 3 ? uKind[3] : i == 4 ? uKind[1] : i == 5 ? mix(uKind[3], vec3(1., .7, .28), .75) : mix(uKind[0], uKind[3], .6); spI[i].rgb = mix(spI[i].rgb, c*c*1.05+.01, uOwn[2]); }
 }
 if (uOwn[2] < .0 && !card) for (int i = 0; i < 7; i++) if (i != 5) spI[i].rgb = mix(spI[i].rgb, spPa, -uOwn[2]*(.96 - .12*float(i)));
 spI[7] = spI[8] = vec4(spPa, 1.);
 spHz = mix(vec3(dot(spPa, vec3(.33))), spPa*(.3+uKind[1]), .7)*(uOwn[2] < .0 ? .75 : .92)*mix(vec3(1.), card ? vec3(.36, .45, .66) : vec3(.6), max(uOwn[4], .0));
 float yaw = (card ? .5 : .16)+.03*sin(uTime*.04);
 spSun = vec2(.0, 1.)*rot(.6 - uPhrase+.12*sin(uTime*.05));
 vec3 tgt = card ? vec3(.05, .33, .12) : vec3(.0, .18, .14);
 vec3 ro = tgt+3.5*vec3(sin(yaw)*.82, .57, -cos(yaw)*.82);
 if (uOwn[1] != .0) {
  float s = uOwn[1] > .0 ? mix(.57, card ? .4 : .16, uOwn[1]) : mix(.57, card ? .86 : .93, -uOwn[1]), c = sqrt(1. - s*s)/.82;
  if (card) yaw -= .4*abs(uOwn[1]);
  tgt.y += (card ? .08 : .2)*max(uOwn[1], .0);
  ro = tgt+3.5*vec3(sin(yaw)*.82*c, s, -cos(yaw)*.82*c);
 }
 vec3 f = normalize(tgt - ro), r = normalize(vec3(f.z, .0, -f.x)), u = cross(f, r);
 vec3 rd = f*foc+(r*p.x+u*p.y)*zoom;
 rd.y = min(rd.y, uOwn[1] > .0 && !card ? 1. : -.05); rd.z = max(rd.z, .05); rd = normalize(rd);
 float lr, xb = min(spXB, 1.06), R = card ? .95 : xb - .02; vec2 l2;
 float lt = spTurn(card ? vec2(spG - ro.z, ro.y) : ro.xy, card ? vec2(-rd.z, rd.y) : rd.xy, R, lr, l2);
 vec3 lp = ro+rd*lt;
 vec4 leaf = vec4(1e4, .0, .0, 8.);
 if (spPhi > .0 && lt > .0 && lr > .0 && lr < R) leaf = vec4(lt, sat(.5+min(min(lr+.01, R - lr), card ? xb - abs(lp.x) : 1.18 - abs(lp.z - .44))/(lt*spPx)), .0, 7.);
 vec3 col = spTb(ro+rd*((spBs - ro.y)/min(rd.y, -.02)), card ? spG - spFD : spZF, card ? spG : spZB);
 if (uOwn[1] > .0 && !card) {
  vec3 k1 = uKind[1]*uKind[1], far = mix(mix(vec3(dot(k1, vec3(.33))), k1, .8)*1.1+.1, vec3(.02, .02, .03), max(uOwn[3], .0))*(1. - .6*smoothstep(-.1, .55, rd.y))*(1. - .3*max(uOwn[4], .0));
  if (uOwn[7] < .0) far = mix(far, spHz, -.8*uOwn[7]*(1. - smoothstep(.0, .4, rd.y)));
  col = mix(col, far, smoothstep(-.3, -.03, rd.y)*sat(3.*uOwn[1]));
 } else if (uOwn[7] < .0) col = mix(col, spHz, -.3*uOwn[7]);
 col = spPic(ro, rd, r, u, leaf, card ? vec3(.0, l2.y, -l2.x) : vec3(l2, .0), col, card);
 col *= 1.12; col = sqrt(col*(1.4+col)/(1.+1.4*col+col*col));
 return mix(col, col*col*(3. - 2.*col), .6);
}
