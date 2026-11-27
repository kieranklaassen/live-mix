// name: Beetle drawer
// a: Open drawer
// b: One back
// what: A museum drawer pulled out by a north window: pinned beetles on cream paper, big horned ones near, jewel and leaf beetles behind, with one empty place kept by its pin; or a single wing case from close by, a long dome of rows of pits like polished bowls holding green and ember light, hairs along the seam, the window beyond.
// follows: The piece opens the wing cases in its places, or fills the bowls there. Drone slides the sheen, pad is the window, texture deepens fine punctures, the phrase runs along a row or warms the hairs; bands light beetles or bowls. A hit snaps one pair open, or runs out over the bowls; a cue sweeps the window's reflection. Keys glint; a voice warms the seam.
// own: 0 lamplight from the right at -1, a pale warm morning at 1; 1 blue-black paper at -1, green at 1 (b: deep blue metal, copper metal); 2 a few great beetles or pits at -1, a crowd of small ones at 1; 3 strict straight rows at -1, turned every way at 1 (b: a smooth shell, deep ribs); 4 all broad, dark and horned at -1, all slender and bright with long feelers at 1 (b: a short round dome, a long narrow one); 5 seen from nearly above at -1, from low down at 1; 6 moths with their wings spread at -1, speckled eggs at 1 (b: beads instead of pits, scales); 7 no drawer and no pins, out on rippled sand at -1, on a great green leaf at 1 (b: a dune and the sun behind, leaves)
#define bdS smoothstep
#define BD_MOTH max(-uOwn[6], .0)
#define BD_EGG max(uOwn[6], .0)
#define BD_OUT abs(uOwn[7])
#define BD_SAND max(-uOwn[7], .0)
#define BD_LEAF max(uOwn[7], .0)
float bdO(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
vec3 bdW, bdWx, bdWy;       // towards the window, and its two sides
vec3 bdKey, bdSky, bdRoom;  // the window's light, the soft light from above, what is thrown up from below
vec3 bdRo, bdFw, bdRt, bdUp; float bdFo; // the eye
float bdSlide;              // how far the sheen has slid

void bdLight(vec3 w) {
 float eve = max(-uOwn[0], .0), morn = max(uOwn[0], .0);
 w = mix(w, vec3(1.1, .55, .3), .8*eve);
 bdW = normalize(w);
 bdWx = normalize(cross(vec3(0, 1, 0), bdW)); bdWy = cross(bdW, bdWx);
 vec3 c = mix(mix(vec3(.93, .98, 1.06), vec3(1.15, .66, .3), eve), vec3(1.2, .92, .78), morn);
 bdKey = c*(.92 + .28*uPad + .12*uLevel)*(1. - .35*eve + .35*morn);
 bdSky = mix(mix(vec3(.13, .15, .19), vec3(.05, .05, .08), eve), vec3(.3, .29, .31), morn);
 bdSlide = .05*sin(uTime*.043) + .04*sin(uTime*.11 + 1.) + .26*uDrone;
}
// The window as a polished thing mirrors it: tall panes with bars between, softer by s.
float bdPane(vec3 r, float s) {
 float c = dot(r, bdW);
 if (c < .08) return .0;
 vec2 w = vec2(dot(r, bdWx), dot(r, bdWy))/c;
 float box = bdO(.4 - s, .4 + s, abs(w.x))*bdO(.5 - s, .5 + s, abs(w.y));
 float bars = bdS(.0, .05 + s, abs(w.x) - .005)*bdS(.0, .05 + s, abs(w.y - .12) - .005);
 return box*mix(1., bars, .75/(1. + 6.*s));
}
vec3 bdEnv(vec3 r, float s) {
 float w = sat(.5 + .5*dot(r, bdW));
 vec3 e = mix(bdRoom, bdSky*(.25 + 1.9*w), bdS(-.5, .35, r.y)) + bdKey*.55*w*w*w*w;
 return e + bdKey*(2.1 + .9*uPad)*bdPane(r, s);
}
vec3 bdFilm(float x) {
 const vec3 f[5] = vec3[5](vec3(.04, .5, .2), vec3(.5, .5, .08), vec3(.8, .26, .07), vec3(.4, .06, .28), vec3(.04, .2, .48));
 x = fract(x)*5.; int i = int(min(floor(x), 4.));
 return mix(f[i], f[(i + 1) % 5], bdS(.0, 1., fract(x)));
}
void bdEye(vec3 ta, float pitch, float yaw, float dist, float fo) {
 bdFw = vec3(sin(yaw)*cos(pitch), -sin(pitch), cos(yaw)*cos(pitch));
 bdRt = normalize(cross(vec3(0, 1, 0), bdFw)); bdUp = cross(bdFw, bdRt);
 bdRo = ta - bdFw*dist; bdFo = fo;
}
vec2 bdSee(vec3 q) { q -= bdRo; return bdFo*vec2(dot(q, bdRt), dot(q, bdUp))/max(dot(q, bdFw), .05); }
float bdSeg(vec2 p, vec2 a, vec2 b) { p -= a; b -= a; return length(p - b*sat(dot(p, b)/(dot(b, b) + 1e-6))); }
float bdLeg(vec2 p, vec2 a, vec2 b, vec2 c) { return min(bdSeg(p, a, b), bdSeg(p, b, c)); }

// ---- the drawer
const float BD_R = .8; // each row to the one before it
// The five builds: half width, how narrow the tail, the breast's width, the horn; then the feelers.
const vec4 BD_F[5] = vec4[5](vec4(.5, .06, .46, .9), vec4(.36, .34, .31, 0), vec4(.42, .12, .3, 0), vec4(.58, -.04, .36, 0), vec4(.33, .2, .25, 0));
const float BD_FE[5] = float[5](.2, .15, .45, .35, 1.3);
struct bdBug { vec2 l; float ang, aa, sp, open, hit, lit, near; vec4 h; };

float bdOval(vec2 l, vec2 c, vec2 ab, float sq, float egg, out vec3 n, float H) {
 vec2 q = (l - c)/ab; q.x /= max(1. + egg*q.y, .3);
 float y2 = q.y*q.y, r2 = q.x*q.x + mix(y2, y2*y2, sq), z = sqrt(max(1. - r2, .0));
 vec2 g = vec2(q.x, mix(q.y, 2.*q.y*y2, sq))/ab;
 n = vec3(g, (z + .03)/H);
 float r = sqrt(r2 + 1e-6);
 return (r - 1.)*r/(length(g) + 1e-3);
}
// One beetle: its colour, and how much it covers.
vec4 bdDraw(bdBug b) {
 int k = int(b.sp);
 float o4 = uOwn[4], m4 = abs(o4)*.9;
 int k2 = o4 < .0 ? 0 : 4;
 vec4 F = mix(BD_F[k], BD_F[k2], m4);
 float wi = F.x, ta = F.y, br = F.z, ho = F.w, fe = mix(BD_FE[k], BD_FE[k2], m4);
 vec2 a = vec2(abs(b.l.x), b.l.y);
 float aa = b.aa, al = .0, mat = .0, crease = 1., gap = .0, seam = .0; vec3 n = vec3(0, 0, 1), nn; vec2 e = a;
 float d = 1e3;
 if (b.near > .01) {
  d = min(d, bdLeg(a, vec2(br*.7, .42), vec2(br + .2, .62), vec2(br + .26, .9)));
  d = min(d, bdLeg(a, vec2(wi*.6, .08), vec2(wi + .22, .12), vec2(wi + .3, -.16)));
  d = min(d, bdLeg(a, vec2(wi*.6, -.2), vec2(wi + .2, -.38), vec2(wi + .24, -.72)));
  d += .03 - .056*b.near;
 }
 vec2 fa = vec2(.1, .78), fb = fa + vec2(.16 + .12*fe, .2 + .1*fe), fc = fb + vec2(.36, -.62)*fe;
 d = min(d, bdLeg(a, fa, fb, fc) - .016);
 al = bdO(-aa, aa, d);
 if (al > .0) { n = vec3(.3, .2, 1.); mat = 2.; }
 d = bdOval(a, vec2(.0, .76), vec2(br*.5, .15), .0, .0, nn, .16);
 if (ho > .02) {
  vec2 hq = a - vec2(.0, .84);
  float fork = bdS(.2, .62, hq.y)*(.1 + .06*b.h.z);
  float hd = abs(hq.x - fork) - .075*(1. - .75*sat(hq.y/.62));
  hd = max(hd, max(-hq.y, hq.y - .62*ho))*.8;
  if (hd < d) { d = hd; nn = vec3((hq.x - fork)*9., .25, 1.); }
 }
 float c = bdO(-aa, aa, d);
 if (c > .4 || c > al) { n = nn; mat = 1.; crease = bdS(-.01, .05 + aa, -d); e = a; }
 al = max(al, c);
 d = bdOval(a, vec2(.0, .46), vec2(br, .28), .35, -.22, nn, .27);
 c = bdO(-aa, aa, d);
 if (c > .4 || c > al) { n = nn; mat = 1.; crease = bdS(-.01, .06 + aa, -d); e = a - vec2(.0, .46); }
 al = max(al, c);
 e = mat == 1. ? e : a;
 vec2 w = rot(b.open)*(a - vec2(.07, .2)) + vec2(.07, .2);
 d = bdOval(w, vec2(.0, -.38), vec2(wi, .64), .3, ta, nn, .36);
 float body = (length((a + vec2(.0, .36))/vec2(wi*.86, .58)) - 1.)*.4;
 float edge = max(d, -w.x - .03*bdO(.0, .03, b.open)); // shut, they meet
 c = bdO(-aa, aa, edge);
 float cu = bdO(-aa, aa, body);
 if (c > .4 || c > max(al, cu*step(.02, b.open))) { n = nn; mat = .0; e = w; crease = bdS(-.012, .05 + aa, -d); seam = bdO(.0, .018 + 1.6*aa, w.x); }
 else if (cu > .4 && mat < .5 && b.open > .005) gap = 1.;
 if (mat == 2. && cu > .4) gap = 1.;
 al = max(al, max(c, cu*bdS(.01, .04, b.open)));
 if (al < .004) return vec4(.0);
 n.x *= b.l.x < .0 ? -1. : 1.;
 n.xy = rot(b.ang)*n.xy;
 vec3 N = normalize(n.xzy), V = -bdFw;
 float fine = bdO(.015, .06, aa);
 float sp = b.sp, film = b.h.x*.26, rng = .34, met = .8, soft = .07; vec3 pig = vec3(.03, .025, .03);
 if (sp < .5) { film += .46; met = .34; pig = mix(vec3(.1, .025, .012), vec3(.02, .016, .02), b.h.z); soft = .045; }
 else if (sp < 1.5) { film += b.h.w < .5 ? -.04 : .3; rng = .5; met = 1.05; if (mat < .5) N = normalize(N + .1*fine*vec3(sin(e.x*60.), .0, .0)); }
 else if (sp < 2.5) {
  film += .12; met = .6;
  if (mat < .5) { vec2 pf = fract(e*vec2(15./(wi + .3), 17.)) - .5; float pit = bdO(.12, .4, length(pf)); N = normalize(N + fine*(.35 + 1.4*uTexture)*pit*vec3(pf.x, .0, pf.y)*2.2); pig *= 1. - .5*pit; met *= 1. - .6*uTexture*pit*fine; }
 } else if (sp < 3.5) {
  film += b.h.y; rng = .18; met = .55; soft = .05;
  vec3 base = b.h.z < .4 ? vec3(.55, .06, .02) : b.h.z < .7 ? vec3(.62, .34, .03) : vec3(.03, .16, .3);
  float spot = mat > .5 ? .8 : b.h.w < .5 ? bdO(.07, .09 + aa, min(length(e - vec2(wi*.5, -.12)), min(length(e - vec2(wi*.45, -.56)), length(e - vec2(.02, .1))))) : bdS(.0, .2, sin(e.y*13. + 1.5*sin(e.x*7.)) - .2);
  pig = mix(base, vec3(.015, .012, .014), spot); met *= .35 + .3*spot;
 } else {
  film += .82; met = .3; soft = .2;
  float bars = bdS(-.25, .25, sin(e.y*10.5 + 2.*b.h.x) + .5*(noise(e*14. + b.h.xy*20.) - .5));
  pig = mix(vec3(.05, .06, .08), mix(vec3(.4, .4, .36), vec3(.45, .27, .1), step(.5, b.h.y)), mat < .5 ? bars : .2);
 }
 film += .4*o4; met *= 1. + (o4 < .0 ? .6 : .4)*o4; pig = mix(pig, vec3(.012, .01, .009), max(-o4, .0));
 if (mat == 2.) { met = .08; pig = vec3(.016, .012, .011); soft = .2; }
 vec3 kc = uKind[k]; kc /= max(max(kc.r, kc.g), max(kc.b, .05));
 float f = dot(N, V);
 vec3 fc2 = bdFilm(film + rng*(1. - f) + .1*N.x + bdSlide)*mix(vec3(1.), kc*1.1, .25 + .2*b.lit);
 vec3 dif = bdKey*(.12 + .75*sat(dot(N, bdW))) + bdSky;
 vec3 env = bdEnv(reflect(-V, N), soft*(1.7 - 1.4*uTone) + 2.2*aa);
 float fr = .05 + .6*pow(1. - sat(f), 4.);
 float turn = .25 + .95*bdS(-.2, .95, dot(N, bdW));
 vec3 col = pig*dif + fc2*env*met*turn*(.95 + (.7 + .6*uEnergy)*b.lit) + fc2*met*.2*dif*turn + env*fr*(mat > 1.5 ? .22 : .55);
 col *= mix(.25, 1., crease)*(1. - .75*seam);
 if (gap > .5) {
  float ve = min(abs(sin(a.x*34. + a.y*5.)), abs(sin(a.y*13. + a.x*9.)));
  vec3 amber = mix(vec3(.6, .27, .06), kc*vec3(.8, .5, .35), .35);
  col = amber*(.2*dif + (.2 + 1.*b.lit + 1.5*b.hit)*(.4 + .6*sat(1. + a.y)))*(.45 + .55*bdS(.0, .35, ve))*(.12 + .88*bdS(.0, .07 + 2.*aa, edge));
 }
 return vec4(col, al);
}
vec4 bdMoth(bdBug b) {
 vec2 a = vec2(abs(b.l.x), b.l.y), w;
 float fold = 1. - .35*b.open/.26, fur = .07*(noise(b.l*23. + b.h.x*9.) - .5);
 a.x /= max(fold, .4);
 vec3 kc = uKind[int(b.sp)]; kc = mix(kc, vec3(dot(kc, vec3(.4))), .35);
 vec3 A = .55*mix(vec3(.3, .2, .12), kc, .6), B = mix(vec3(.8, .68, .48), kc, .4), n = vec3(.0, .0, 1.);
 vec3 c = vec3(.0); float al = .0, shade = 1.;
 for (int i = 0; i < 2; i++) { // the hind wing, then the one before it
  w = a - vec2(.02, i > 0 ? .14 : .06);
  float r = length(w), th = atan(w.y, w.x + 1e-4), t = i > 0 ? (th + .12)/.98 : (th + 1.42)/1.5, R = .02 + (i > 0 ? (.72 + .34*t)*bdS(-.1, .3, t)*bdO(.84, 1.04, t) : (.8 - .2*t)*sqrt(bdS(.0, .4, t)*bdO(.75, 1.1, t)) + .025*sin(th*22.));
  float u = r/max(R, .05), cv = bdO(-b.aa, b.aa, (r - R)*.6), e = length(w - (i > 0 ? vec2(.58, .34) : vec2(.4, -.34)))/(.1 + .05*b.h.z);
  vec3 m = mix(A, B, .5 + .5*sin(u*(9. + 9.*b.h.y) + .8*sin(th*5.) + b.h.x*6.)*sat(u*2.));
  m *= .7 + .6*noise(vec2(u*9., th*26.));
  m = mix(mix(m, A*.25, bdS(.8, .9, u)), B, bdO(.0, .03, abs(u - .95)));
  float eye = step(.35, b.h.w)*(i > 0 ? .6 : 1.);
  m = mix(m, mix(mix(vec3(.02), kc*1.3, bdO(.5, .55, abs(e - .72)*3.)), vec3(.9), bdO(.1, .2, e)), eye*bdO(.95, 1.05 + b.aa*8., e));
  if (i < 1) m *= .6 + .4*bdO(-.2, .1, th);
  c = mix(c, m, cv); al = max(al, cv);
 }
 n.x = -.35*sign(b.l.x)*(fold < 1. ? 1.4 - fold : .4);
 n.xy = rot(b.ang)*n.xy;
 vec3 N = normalize(n.xzy);
 float sheen = sat(dot(N, bdW));
 c = c*(bdKey*(.1 + .5*sheen) + bdSky)*(1. + b.lit) + c*uKind[4]*b.hit + c*bdFilm(b.h.x + 2.*bdSlide + .4*a.x)*b.lit*uEnergy;
 float d = min(length((b.l - vec2(.0, -.12))/vec2(.5, 1.6)) - .22, length(b.l - vec2(.0, .24)) - .13) + fur;
 d = min(d, bdSeg(a, vec2(.04, .33), vec2(.24, .62)) - .012 - .03*sat((a.y - .33)*3.));
 float cv = bdO(-b.aa - .01, b.aa + .01, d);
 c = mix(c, mix(A, B, .4 + .4*sin(b.l.y*34.))*(bdKey*(.1 + .6*bdO(-.1, .06, d)) + bdSky), cv*(.9));
 return vec4(c, max(al, cv));
}
vec4 bdEgg(bdBug b) {
 vec3 n; float d = bdOval(b.l, vec2(.0, .0), vec2(.56, .74)*(.85 + .2*b.h.x), .0, -.12, n, .42), al = bdO(-b.aa, b.aa, d);
 if (al < .004) return vec4(.0);
 n.xy = rot(b.ang)*n.xy;
 vec3 N = normalize(n.xzy), V = -bdFw;
 vec3 kc = uKind[int(b.sp)];
 vec3 c = mix(vec3(.8, .76, .64), kc*.9, .65*step(.25, b.h.z));
 vec2 q = b.l*(1. + .3*dot(b.l, b.l)) + b.h.xy*31.;
 float sp = noise(q*(6. + 8.*b.h.w)) + .4*noise(q*21.), cut = .98 - .3*b.h.y - .2*bdS(.0, .6, b.l.y)*b.h.x;
 c = mix(c, vec3(.16, .1, .07) + .2*kc, .85*bdS(cut, cut + .07 + b.aa, sp));
 float f = sat(dot(N, V)), k = dot(N, bdW);
 vec3 o = c*(bdKey*(.04 + 1.15*bdS(-.25, 1., k)) + bdSky*(.5 + .5*N.y) + bdRoom*.3*(1. - N.y)) + bdEnv(reflect(-V, N), .16)*.1;
 o += c*mix(vec3(1., .45, .15), kc, .5)*(.9*b.lit*(.3 + .7*f) + 1.3*b.hit + 3.*b.open*f);
 return vec4(o*mix(.45, 1., bdS(.0, .12 + b.aa, -d)), al);
}
vec4 bdThing(bdBug b) {
 if (uOwn[6] >= 1.) return bdEgg(b);
 if (uOwn[6] <= -1.) return bdMoth(b);
 vec4 c = bdDraw(b), o = uOwn[6] > .0 ? bdEgg(b) : bdMoth(b);
 float m = sat(abs(uOwn[6])*6. - 5.*b.h.x), al = mix(c.a, o.a, m);
 return vec4(mix(c.rgb*c.a, o.rgb*o.a, m)/max(al, 1e-3), al);
}
vec3 bdWood(vec2 q, vec3 c) {
 float g = noise(vec2(q.x*3. + 1.5*noise(q*vec2(1.5, 5.)), q.y*70.));
 return c*(.7 + .5*g);
}
vec3 bdDrawer(vec2 p) {
 float o5 = uOwn[5], px = 1./uRes.y;
 bdRoom = vec3(.2, .17, .12);
 bdLight(vec3(-.62, .66, .42));
 float eve = max(-uOwn[0], .0), morn = max(uOwn[0], .0);
 bdEye(vec3(.04, .0, .24 + .1*o5), .87 - (o5 < .0 ? .5 : .27)*o5, .14 + .012*sin(uTime*.05), 2.05 - .2*abs(o5), 1.3);
 vec3 rd = normalize(bdFw*bdFo + bdRt*p.x + bdUp*p.y);
 float down = min(rd.y, -.02), tt = -bdRo.y/down, wpx = px*tt/bdFo;
 vec2 dq = rd.xz/down, q0 = bdRo.xz - bdRo.y*dq; // the paper here, and how it slides with height
 float ZF = -.5 - 5.*BD_OUT, XR = 1.12 + 7.*BD_OUT, ZC = 1.02 + 6.*BD_OUT;
 vec2 qt = q0 + dq*.17;
 vec3 wood = mix(vec3(.2, .1, .05), vec3(.34, .24, .16), morn);
 vec2 fq = q0 - vec2(-.75, .4);
 float fall = 1./(1. + (.75 - .35*uSpace)*dot(fq, fq)), back = bdS(.55, 1.02, q0.y)*(1. - .75*BD_OUT);
 float tc = (ZC - bdRo.z)/max(rd.z, .02); vec3 qc = bdRo + rd*tc;
 float cpx = px*tc/bdFo + .007;
 float inX = bdS(-wpx, wpx, q0.x - XR), topX = bdS(-wpx, wpx, qt.x - XR), outX = bdS(-wpx, wpx, qt.x - XR - .075);
 float inC = rd.z > .02 ? bdS(-cpx, cpx, qc.y - .2) : .0, inF = bdS(-wpx, wpx, ZF - qt.y), outF = bdS(-wpx, wpx, ZF - .085 - qt.y);
 vec3 col = vec3(.0);
 if (max(max(topX, inC), inF) < 1.) {
  vec2 wp = rot(-.5)*(q0 - vec2(-.2 + .05*sin(uTime*.021), .2))*vec2(1., .8);
  float pane = bdO(.35, .75, abs(wp.x))*bdO(.45, .95, abs(wp.y))*(.45 + .55*bdS(.01, .09, abs(wp.x))*bdS(.01, .1, abs(wp.y - .08)));
  vec3 base = vec3(.88, .74, .5); float gr = 1.;
  if (uOwn[7] != .0) {
   if (uOwn[7] < .0) {
    vec2 w = rot(.35)*q0; float n = noise(w*vec2(2.2, 3.4)), y = w.y*17. + 5.*n + .7*sin(w.x*4.), a = fract(y/TAU);
    gr = mix(.62, 1.22, bdS(.0, .72, a)*bdO(.82, 1., a)) + .16*(noise(q0*90.) - .5) - .1*n;
    base = mix(base, vec3(.95, .68, .4), BD_SAND);
   } else {
    vec2 w = rot(-.5)*(q0 - vec2(.15, .1)); float u = abs(w.x), v = (w.y - .75*u + .2*u*u)/.21, fv = abs(fract(v) - .5);
    float ribs = bdO(.0, .035, abs(u - .012)) + .75*bdS(.44 - wpx*3., .49, fv), tiny = noise(rot(.6)*w*38.);
    gr = .78 + .3*bdS(.05, .4, .5 - fv) + .14*tiny - .25*bdS(.3, .42, fv);
    base = mix(base, mix(vec3(.2, .42, .1), vec3(.62, .72, .3), sat(ribs)), BD_LEAF);
   }
   pane = mix(pane, bdS(.3, .75, noise(q0*1.7 + .05*sin(uTime*.07)) + .3*noise(q0*5.)), BD_OUT*(.4 + .6*BD_LEAF));
  }
  vec3 pap = mix(base, mix(vec3(.035, .05, .075), vec3(.17, .3, .22), step(.0, uOwn[1])), abs(uOwn[1]));
  pap *= mix(1., gr, BD_OUT)*(.93 + .13*noise(q0*vec2(70., 190.))*bdO(.003, .02, wpx));
  float S = exp2(-(uOwn[2] < .0 ? .62 : .5)*uOwn[2]), mess = max(uOwn[3], .0), strict = 1. - max(-uOwn[3], .0);
  vec2 anc = vec2(.1, -.42), qs = (q0 - anc)/S + anc;
  float sh = 1., pinA = .0; vec3 pinC = vec3(.0); vec4 bug = vec4(.0);
  bdBug win, win2 = bdBug(vec2(9), .0, .1, .0, .0, .0, .0, .0, vec4(0)); win = win2; float rank2 = 1e3, rank = 1e3;
  vec2 drop = -bdW.xz/max(bdW.y, .3);
  float kn = floor(log(max(1. - (qs.y + .2)/2.15, .06))/-.22314);
  for (int j = 1; j >= 0; j--) {
   float k = kn + float(j);
   if (k < .0 || k > 9.) continue;
   float sc = pow(BD_R, k), pit = .5*sc, off = k*.775 + .1, cx = floor(qs.x/pit - off - .5);
   for (int i = 0; i <= 1; i++) {
    float ci = cx + float(i);
    vec2 c = vec2((ci + .5 + off)*pit, 1.95 - 2.15*sc);
    if (length(qs - c) > sc*(.46 + .06*mess + .1*max(-uOwn[4], .0))) continue;
    vec4 h = vec4(hash22(vec2(ci + 31., k*7. + 3.)), hash22(vec2(ci + 77., k*5. + 11.)));
    c += pit*(strict*(h.xy - .5)*.16 + mess*(h.zw - .5)*vec2(.2, .4));
    c.y += strict*.02*sc*(fract(k*.62 + .3) - .5)*c.x;
    c = (c - anc)*S + anc;
    float s = .205*sc*S*(.8 + .3*h.z)*(1. - .22*min(uOwn[4], .0));
    vec2 v0 = q0 - c;
    if (dot(v0, v0) > 3.4*s*s) continue;
    s *= bdO(XR - .07, XR - .05, c.x + s*.6)*bdO(ZC - .03, ZC + .03, c.y)*bdO(6.5, 9., k);
    if (s < .004) continue;
    bool gone = k == 1. && ci == -1. && uOwn[7] == .0;
    float ang = strict*(h.w - .5)*.36 + mess*(h.x - .5)*3.6, sp = floor(min(h.y*(k < .5 ? 2.6 : 5.), 4.));
    mat2 tn = rot(ang); // a point times tn is turned back
    float blur = .0035*min(abs(k - .6), 3.)*(.4 + uSpace)*S;
    vec2 away = drop*s;
    if (gone) pap *= 1. + (.07 + .2*uMic)*bdO(.9, 1.1, length(v0*tn/s/vec2(.5, .95))); // unfaded
    else {
     float wi = BD_F[int(sp)].x + .45*BD_MOTH, d0 = length((v0 - away*.3)*tn/s/vec2(wi + .1, .94)), d1 = length((v0 - away*.62)*tn/s/vec2(wi + .2, 1.1));
     if (uOwn[6] < .0) { vec2 y = (v0 - away*.3)*tn/s; y.x = abs(y.x); float e = .12 + .95*min(length((y - vec2(.45, .36))/vec2(.5, .38)), length((y - vec2(.3, -.28))/vec2(.4, .42))); d0 = mix(d0, e, BD_MOTH); d1 = mix(d1, e*.8 + .1, BD_MOTH); }
     sh *= (1. - .62*bdO(.65, 1.2, d0))*(1. - .55*bdO(.4, 1.4, d1)*bdO(2.2, 3.4, dot(v0, v0)/(s*s)));
    }
    vec2 pb = tn*vec2(.17, .02)*s;
    float ht = .95*s + .02, ppx = wpx*(.8 + .7*min(abs(k - .6), 2.)), pr = .032*s + .15*wpx;
    vec2 g = (v0 - pb + dq*ht)*vec2(1., .75), g2 = g - vec2(-.5, .6)*pr;
    float pa = .8*bdO(.3*pr - .5*ppx, .3*pr + ppx, bdSeg(v0, pb - dq*(gone ? .0 : .5*s), pb - dq*ht)), ha = bdO(pr*1.7 - ppx, pr*1.7 + ppx, length(g));
    pa *= 1. - BD_OUT; ha *= 1. - BD_OUT;
    if (max(pa, ha) > pinA) { pinA = max(pa, ha); pinC = bdKey*(mix(.1, .05, ha) + (1. + 3.*uKeys)/(1. + 6.*dot(g2, g2)/(pr*pr + 2.*ppx*ppx))); }
    sh *= 1. - (gone ? .5 : .35)*(1. - BD_OUT)*bdO(.0015, .007 + wpx, bdSeg(v0, pb, pb + away*ht/s*.95));
    vec2 l = (v0 + dq*.28*s)*tn/s;
    float o4 = abs(uOwn[4])*.25 + .4*BD_MOTH;
    if (gone || abs(l.x) > o4 + (k < .5 || sp > 3.5 ? .9 : sp < .5 || sp > 2.5 ? .75 : .63) || abs(l.y - (sp < .5 ? .19 : .03)) > o4 + (sp < .5 ? 1.25 : 1.12)) continue;
    float d = max(abs(l.x)*1.3, abs(l.y)) - (k == kn ? .2 : .0);
    if (d < rank) {
     rank2 = rank; win2 = win; rank = d;
     float wave = fract(uTime*.045 + k*.31)*4. - 2., me = k == .0 && ci == .0 ? 1. : .0;
     float heard = sat(piece(vec2(sat((c.x + 1.2)/2.4), sat(1. - (c.y + .35)/1.5))).a*(.6 + .5*uEnergy));
     heard = sat(heard + .7*uPhrase*exp(-(c.x - wave)*(c.x - wave)*7.)*bdO(1.4, 2., abs(wave)));
     float ring = length(c - vec2(.2, -.2)) - 1.6*(1. - uHits);
     win = bdBug(l, ang, (.9*wpx + blur)/s, sp, .26*sat(heard*(.3 + .7*h.w) + me*4.*uHits*(1. - uHits)), me*uHits, sat(.75*heard + .9*band(fract(h.x*3. + ci*.19))*uEnergy + me*uHits + .8*uHits*exp(-ring*ring*9.)), bdO(.0, 1., k), h);
    }
   }
  }
  for (int i = 0; i < 2; i++) { // the one on top, then one that shows behind it
   if (rank > 1.6 || bug.a > .995) break;
   vec4 b2; if (uOwn[6] == .0) b2 = bdDraw(win); else b2 = bdThing(win);
   bug += vec4(b2.rgb*b2.a, b2.a)*(1. - bug.a);
   win = win2; rank = rank2 < 1.15 ? rank2 : 9.;
  }
  vec2 hp = q0 - vec2(.3, -.25);
  vec3 lit = uKind[4]*uHits*exp(-dot(hp, hp)*16.)*1.2 + (bdKey*(.34 + .95*pane)*fall*1.5 + bdSky)*mix(1., .1, back);
  lit *= (.5 + .5*bdS(.0, .12, XR - q0.x))*(.6 + .4*bdS(.0, .2, q0.y - ZF));
  col = pap*lit*sh*mix(vec3(1.), vec3(.86, .92, 1.1), 1. - sh);
  float dim = mix(1., .25, back)*(.5 + .8*fall);
  col = col*(1. - bug.a) + bug.rgb*dim;
  col = mix(col, pinC*dim, pinA);
 }
 if (max(inX, topX) > .0) {
  vec3 c = bdWood(mix(vec2(q0.y, q0.x*.3), qt.yx, topX), wood)*(bdKey*mix(.5, 1.1, topX)*fall + bdSky)*mix(1., .2, back);
  c = mix(c, wood*.1*(bdKey*.3 + bdSky), outX);
  col = mix(col, c, max(inX, topX));
 }
 if (inC > .0) {
  float y = qc.y - .2, fy = mod(y, .3);
  vec2 kb = vec2(mod(qc.x + .35, .9) - .45, fy - .15);
  vec3 c = bdWood(qc.xy, wood*.75)*(bdKey*.16 + bdSky*.6)*mix(.2, 1., bdS(.0, .03, fy)*bdO(.27, .3, fy))*(.6 + .5*bdO(-1.2, 1.2, qc.x));
  c = mix(c, vec3(.5, .34, .12)*(bdKey*(.06 + .5*bdO(.0, .05, length(kb - vec2(-.015, .02)))) + bdSky*.4), bdO(.03, .06, length(kb)));
  col = mix(col, c, inC);
 }
 if (inF > .0) {
  vec3 c = bdWood(qt, wood*1.35)*(bdKey*.8*fall + bdSky)*(.75 + .6*bdO(.0, .025, abs(qt.y - ZF)));
  c = mix(c, wood*.25*(bdKey*.3*fall + bdSky), outF);
  col = mix(col, c, inF);
 }
 vec2 q1 = q0 + dq*.1 - vec2(.34, ZF - .1);
 float bd = length(q1/vec2(1., .62)) - .2, bw = .024;
 if (q1.y < .06 && abs(bd) < .1) {
  float cv = bdO(bw - 2.*wpx - .004, bw + 2.*wpx + .004, abs(bd)), y = sat(bd/bw*.5 + .5);
  vec3 N = normalize(vec3(normalize(q1)*(2.*y - 1.), .45).xzy);
  col = mix(col, vec3(.62, .42, .15)*bdEnv(reflect(rd, N), .12), cv*bdO(.02, .05, q1.y));
 }
 float u = p.y + .32*p.x + .8 - 1.3*uCue, gl = bdO(.1, .15, abs(u))*bdS(.0, .02, abs(u - .02) - .008);
 gl *= .26*(1. - BD_OUT)*uCue*(1. - outX)*(1. - inC)*(1. - inF);
 return col + bdKey*gl;
}
// ---- one back
// The room behind, out of focus.
vec3 bdBehind(vec3 rd) {
 vec3 c = mix(vec3(.02, .013, .009), bdSky*vec3(.2, .16, .13), bdS(-.2, .6, rd.y));
 c += bdKey*vec3(.8, .95, 1.2)*(bdPane(rd, .06 + .1*uSpace)*(.6 + .35*uCue) + .07*pow(sat(.5 + .5*dot(rd, bdW)), 8.));
 if (rd.y < -.02) {
  vec2 q = bdRo.xz - rd.xz/rd.y*(bdRo.y + .75);
  float far = exp(-.24*length(q));
  vec3 pap = mix(vec3(.5, .42, .28), mix(vec3(.03, .04, .06), vec3(.1, .18, .13), step(.0, uOwn[1])), abs(uOwn[1]));
  pap *= bdKey*.75 + bdSky;
  vec2 g = vec2(q.x/1.5, (q.y + .3*q.x)/1.9), id = floor(g), f = fract(g) - .5;
  float h = hash21(id + 5.), d = length(f*vec2(1., .8)), sh = length((f - vec2(.1, -.05))*vec2(1., .8));
  pap *= 1. - .6*bdO(.1, .42, sh);
  vec3 b = bdFilm(h)*(.12 + .6*bdO(.0, .16, length(f - vec2(-.08, .1))))*(bdKey + bdSky);
  pap = mix(pap, b, bdO(.06, .42, d));
  c = mix(c, pap*far*far*1.3, bdS(.02, .25, -rd.y));
 }
 if (uOwn[7] < .0) { // a dune, the sun behind it
  float e = rd.y + .03 - .05*sin(rd.x*2.3 + .6) - .02*sin(rd.x*5.1), s = dot(rd, bdW);
  vec3 k = bdKey*mix(vec3(1., .72, .46), vec3(.42, .5, .62), bdS(.0, .7, rd.y)) + bdKey*(.5*pow(sat(s), 30.) + 2.*bdS(.988, .993, s)*(.7 + .4*uCue));
  vec2 q = bdRo.xz - rd.xz/min(rd.y, -.03)*(bdRo.y + .75);
  vec3 g = vec3(.75, .46, .24)*(bdKey*(.35 + .35*exp(-.12*dot(q, q))*sin(q.y*5. + 4.*noise(q*.8))) + bdSky);
  c = mix(c, mix(k*.8, g, bdO(-.012, .012, e)), BD_SAND);
 } else if (uOwn[7] > .0) { // leaves, out of focus
  vec3 k = mix(vec3(.02, .06, .02), vec3(.3, .45, .12)*(bdKey + bdSky), bdS(-.4, .9, rd.y + .4*rd.x));
  for (float i = .0; i < 3.; i++) {
   vec2 q = rot(i*1.1)*rd.xy/(.16 + .07*i) + 7.*i + .03*sin(uTime*.1 + i), j = floor(q); vec2 h = hash22(j + i*9.);
   k += bdKey*mix(vec3(.2, .4, .08), vec3(.8, .85, .4), h.x)*.3*bdO(.3, .4, length(q - j - .35 - .3*h))*step(.5, h.y)*sat(.6 + rd.y);
  }
  c = mix(c, k, BD_LEAF);
 }
 return c;
}
vec3 bdBack(vec2 p) {
 float px = 1./uRes.y, o1 = uOwn[1], o3 = uOwn[3], o4 = uOwn[4], o5 = uOwn[5];
 bdRoom = vec3(.1, .07, .035);
 bdLight(normalize(vec3(-.5, .42 - .25*BD_SAND, .8)));
 vec3 ax = vec3(1., .64, 1.9);
 ax *= mix(vec3(1.), o4 < .0 ? vec3(1.08, 1.18, .72) : vec3(.72, .9, 1.5), abs(o4));
 bdEye(vec3(.16, .62*ax.y, -.35), .37 - .2*o5*(o5 > .0 ? 1. : 2.4), -.34 + .02*sin(uTime*.037), 1.1 + .15*o5, 1.05);
 vec2 pp = rot(.14)*p;
 vec3 rd = normalize(bdFw*bdFo + bdRt*pp.x + bdUp*pp.y);
 vec3 o = bdRo/ax, d = rd/ax;
 float A = dot(d, d), B = dot(o, d), C = dot(o, o) - 1., D = B*B - A*C;
 float ed = D/(A*.004 + abs(B)*px*2.);
 vec3 col = vec3(.0);
 if (ed < 1. || B > .0) {
  col = bdBehind(rd);
  // the breast plate ahead, and two feelers against the window
  vec3 pc = vec3(.0, -.06, ax.z + .28), pa = ax*vec3(.8, 1.12, .36);
  vec2 f1 = bdSee(pc + vec3(.24, .55, .5)), g1 = bdSee(pc + vec3(.66, .78, .6)), h1 = bdSee(pc + vec3(1.3, .66 + .03*sin(uTime*.3), .4));
  vec2 f2 = bdSee(pc + vec3(-.24, .55, .5)), g2 = bdSee(pc + vec3(-.55, .84, .6)), h2 = bdSee(pc + vec3(-1.2, .86 + .03*sin(uTime*.27 + 2.), .6));
  float fe = min(bdLeg(pp, f1, g1, h1), bdLeg(pp, f2, g2, h2));
  fe = min(fe, min(bdSeg(pp, mix(g1, h1, .8), h1), bdSeg(pp, mix(g2, h2, .8), h2)) - .006);
  col = mix(col, vec3(.012, .011, .012) + .1*bdSky, .85*bdO(.001, .014, fe));
  vec3 o2 = (bdRo - pc)/pa, d2 = rd/pa;
  float A2 = dot(d2, d2), B2 = dot(o2, d2), D2 = B2*B2 - A2*(dot(o2, o2) - 1.), e2 = bdS(-.01, .06, D2/A2);
  if (e2 > .0 && B2 < .0) {
   vec3 q2 = o2 + d2*((-B2 - sqrt(max(D2, .0)))/A2), n2 = normalize(q2/pa);
   float f = sat(-dot(n2, rd));
   vec3 c2 = bdFilm(-.02 + .3*(1. - f) + .6*bdSlide + (o1 < .0 ? .3 : .36)*o1)*bdEnv(reflect(rd, n2), .1) + bdSky*2.*pow(1. - f, 3.);
   col = mix(col, c2*(.15 + .6*bdS(-.2, .9, dot(n2, bdW))), e2);
  }
 }
 if (D > .0 && B < .0) {
  float t = (-B - sqrt(D))/A;
  vec3 q = o + d*t;
  float ph = asin(clamp(q.z, -1., 1.)), th = atan(q.x, q.y + 1e-5), cp = max(cos(ph), .02);
  vec3 N = normalize(q/ax);
  vec3 eu = normalize(vec3(ax.x*cos(th), -ax.y*sin(th), .0)), ev = normalize(cross(N, eu));
  ev *= ev.z < .0 ? -1. : 1.;
  float S = exp2(.6*uOwn[2]), du = .082/S, dv = .05/S;
  float side = th < .0 ? -1. : 1., ro = abs(th)/du, row = floor(ro), fu = ro - row - .5;
  float stag = mod(row, 2.)*.5 + .2*sin(row*1.7);
  float al = ph/dv + stag, cell = floor(al), fv = al - cell - .5;
  vec4 h = vec4(hash22(vec2(row + 40.*side, cell)), hash22(vec2(cell, row*side + 9.)));
  vec2 foot = vec2(t*px/bdFo/(du*ax.x*cp), t*px/bdFo/(dv*ax.z*cp)/max(dot(N, -rd), .12));
  float aa = max(foot.x, foot.y), fine = bdO(.25, .7, aa)*step(.5, row);
  vec2 r = vec2(fu, fv) - (h.xy - .5)*.12;
  float u6 = sat(.5 + .6*q.z), mo = bdS(.0, .2, 1.2*BD_MOTH - u6), eg = bdS(.0, .2, 1.2*BD_EGG - u6);
  float R = .25 + .07*h.z, depth = (1. - max(-o3, .0)*.9)*(1. + .5*max(o3, .0))*(1. - 1.9*mo);
  R = mix(R, min(R*1.45, .44), mo);
  float rr = length(r*vec2(1., .9))/R, in_ = bdO(1. - 1.2*aa - .05, 1. + 1.2*aa + .12, rr)*fine*(1. - eg);
  float rim = exp(-(rr - 1.15)*(rr - 1.15)*22.)*fine*(1. - eg);
  float tile = .0, lip = 1.; vec2 ti = vec2(row*side, .0);
  if (uOwn[6] > .0) { // scales, each over the next
   float su = th/du*.8, nn = floor(su), v = ph/dv*.55 + .5*mod(nn, 2.), g = su - nn - .5, y = v - 1.3*g*g; ti = vec2(nn, floor(y)); tile = y - ti.y; lip = bdS(.0, .2 + aa, tile)*bdS(.0, .1 + aa, .5 - abs(g)); }
  float rib = .2 + .75*max(o3, .0);
  vec3 n = N;
  n += eu*side*(-fu*2.*rib*(1. - 4.*fu*fu)*bdO(.2, .6, foot.x));
  n -= (eu*side*r.x + ev*r.y)/R*in_*depth;
  n += (eu*side*r.x + ev*r.y)/R*rim*.35*depth;
  if (uOwn[6] > .0) { vec2 h2 = hash22(ti + 3.); n += eg*(ev*(.32 - .6*tile) + eu*(h2.x - .5)*.35); }
  n = normalize(n);
  float f = sat(-dot(n, rd)), f0 = sat(-dot(N, rd));
  vec4 m = piece(vec2(sat(.5 + .62*th), .455 - .375*q.z));
  float bd = band(sat(abs(th)/1.3))*uEnergy;
  float heard = sat(m.a*(.6 + .6*uEnergy));
  vec3 hue = m.a > .004 ? m.rgb/m.a : uKind[0];
  hue /= max(max(hue.r, hue.g), max(hue.b, .05));
  float film = -.06 + .22*(1. - f0) + .6*bdSlide + .09*sin(th*1.3 + ph*2.) + in_*sat(depth)*(.05 + .3*h.w);
  film += (o1 < .0 ? .3 : .36)*o1;
  if (uOwn[6] > .0) film += eg*(.2*hash21(ti + 9.) + .12*tile);
  vec3 fc = bdFilm(film); fc *= .45 + .9*fc;
  vec3 env = bdEnv(reflect(rd, n), .12 - .06*uTone + .3*sat(aa));
  float turn = .1 + bdS(-.35, .8, dot(n, bdW));
  vec2 pf = fract(vec2(ro*3., al*3.)) - .5;
  float dot_ = bdO(.08, .26, length(pf))*(1. - in_)*bdO(.06, .2, aa);
  vec3 c = fc*(env*turn*1.2 + bdSky*.2)*(1. - (.2 + .6*uTexture)*dot_) + env*turn*(.01 + .5*pow(1. - f, 4.));
  float wall = sat(.5 + .9*dot(n - N, bdW));
  vec2 wl = vec2(dot(eu, bdW)*side, dot(ev, bdW));
  c *= 1. - in_*sat(depth)*(.9 - .6*wall*wall);
  float cup = in_*sat(depth + .2)*sat(1.2 - rr)*(.05 + 1.25*wall*wall*wall);
  c += cup*(mix(vec3(1., .3, .05), hue*hue*hue, .75)*heard*1.9 + (fc + .02)*bd*2.2 + (uKeys*.5 + .06)*vec3(1., .4, .1));
  if (uOwn[6] < .0) c = mix(c*(1. - .75*mo*(1. - in_)*bdO(.9, 1.8, rr)*fine), c*1.1 + fc*bdKey*.25*turn, mo*in_) + mo*in_*(hue*hue*heard*1.3 + fc*bd*1.4 + .25*bdKey*bdO(.1, .5, length(r/R*.9 - .42*wl)))*(.3 + .7*wall);
  if (uOwn[6] > .0) c = c*mix(1., .12 + .88*lip, eg) + eg*lip*(mix(fc, hue*hue, .6)*heard*(.25 + 1.3*tile*tile) + (fc + .02)*bd*tile + .3*fc*env*bdS(.6, 1., tile));
  // a hit runs out over the bowls; a cue sends the window's band down the back
  float ring = length(vec2(th - .25, (q.z + .45)*1.4)) - 1.3*(1. - uHits), run = q.z + .95 - 1.5*uCue;
  c += (.05 + 1.6*in_*wall + eg*tile + .5*max(-o3, .0))*uKind[4]*uHits*exp(-ring*ring*26.) + (fc + .12)*bdKey*uCue*exp(-run*run*22.)*(1. - .6*in_);
  c *= (1. - .85*in_*sat(depth)*bdS(.55, 1.15, length(r/R + .75*wl)))*(.4 + .6*bdS(-.3, .6, dot(N, bdW)));
  // the seam, and the hairs along it
  float sx = abs(th)*ax.x*cp, sw = .009;
  c *= .08 + .92*bdS(sw*.4, sw*2.4 + t*px, sx);
  float hs = (ph*ax.z + .5*sx + 14.*sx*sx)/.018, hi = floor(hs), hv = hash11(hi + 90.*side), len = .02 + .05*hv*hv;
  float hw = .13*(1. - .8*sat(sx/len)), ha = t*px/bdFo/.018/max(dot(N, -rd), .2);
  float hair = bdO(hw - ha*.5, hw + ha, abs(hs - hi - .5 + .3*(hv - .5)))*bdO(.8*len, len, sx)/(1. + ha*2.);
  c += vec3(1., .5, .15)*uMic*.3*exp(-sx*14.);
  c = mix(c, vec3(.85, .6, .28)*(bdKey*(.35 + .35*uPhrase) + bdSky), .85*hair);
  col = mix(col, c, sat(ed));
 }
 return col*1.1;
}
vec3 render(vec2 p) {
 return screenOf(uVar < .5 ? bdDrawer(p) : bdBack(p));
}
