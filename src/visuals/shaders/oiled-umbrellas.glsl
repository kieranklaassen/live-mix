// name: Oiled umbrellas
// a: Drying lawn
// b: Three hubs
// what: A lawn early in the day, set with opened paper umbrellas drying against the low sun; each lights up like a lamp and throws a tinted disc with its ribs on the grass, and the far ones crowd to a ribbon by a misty wood. Or lying under three of them: split bamboo, rings of thread, leaf shade on the paper, a wedge of sky.
// follows: The piece dyes each paper by its place, and kinds open the umbrellas wider. The drone lowers the sun, the pad lets more light through, texture shows oil and fibres, a phrase rolls one round, sixteen bands light the panels. A hit runs out over one paper as it tips, a cue sends a bar of light and a gust, keys light the threads, the loop swings the sun.
// own: 0 night with a lamp in each at -1, a red late sun at 1; 1 snow at -1, dry earth and dust at 1; 2 one umbrella alone at -1, a crowd at 1 (under the three: one wheel and open sky, or hardly any sky); 3 low in the grass at -1, from above at 1 (under the three: far off in the sky, or close to the ribs); 4 undyed white paper at -1, deep dye at 1; 5 flat as plates at -1, steep as hats at 1
const int ouN = 9;
// where each stands (x, depth), how wide it is, when it joins (above 1 only in a crowd); near to far
const vec4 ouPut[9] = vec4[9](
 vec4(-1.6,2.5,1.12,.0), vec4(-.2,3.,.5,1.1), vec4(1.5,3.1,.56,.2), vec4(.2,4.2,.74,-.5), vec4(2.9,4.6,.82,.4), vec4(-1.5,5.1,.6,.1),
 vec4(1.25,5.6,.6,.3), vec4(-2.,7.4,.68,.35), vec4(.4,7.9,.78,.3));
// the way each points, and its dye
const vec4 ouPose[9] = vec4[9](
 vec4(.11,.41,-.91,.75), vec4(-.27,.72,-.64,2.00), vec4(-.35,.44,-.83,1.90), vec4(.43,.56,.71,.00), vec4(-.30,.48,-.82,1.00), vec4(.63,.48,-.61,3.00), vec4(-.09,.44,-.89,.30), vec4(-.50,.48,-.72,2.00), vec4(-.18,.43,-.88,1.00));
vec4 ouC[9]; // the middle of each rim, and its radius
vec3 ouAx[9]; // the way each points
vec3 ouL, ouSun, ouSky; // towards the sun; its light, the sky's
float ouG, ouNt, ouGd, ouSn, ouDry, ouH, ouPx, ouTex, ouPad, ouKey;
const vec3 ouLamp = vec3(1.5,.8,.3);

// A soft step that may also run downward.
float ouStep(float a, float b, float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
float ouSq(float x) { return x*x; }
float ouBell(float x) { return exp(-x*x); }
float ouIn(float d, float w, float px) { return 1. - ouStep(w - px*.5, w + px, d); }
// The dyes, cream, honey, rose, celadon, and the colour of what sounds there.
vec3 ouTint(float k, vec4 m) {
 vec3 w = sat(vec3(k, k - 1., k - 2.)), s = m.rgb/max(max(m.r, max(m.g, m.b)), .03);
 vec3 c = mix(mix(mix(vec3(.95,.87,.66), vec3(.96,.64,.2), w.x), vec3(.94,.4,.33), w.y), vec3(.64,.79,.56), w.z);
 c = mix(mix(c, c*c*c*vec3(.95,.7,.8), sat(uOwn[4])), vec3(.93,.89,.8), sat(-uOwn[4]));
 return mix(c, (s*s*.65 + .22)*(.4 + .7*c), .8*sat(m.a*1.3*ouG));
}
// What lies on and in the paper, of three noises: x fibres and clouds (about 1), y oil stains (0 to 1).
vec2 ouSheet(vec3 n) { return vec2(mix(1.,.86 + .18*n.x + .1*n.y*n.z, .7 + .6*ouTex), mix(.5, ouStep(.48,.66, n.x + .16*(n.y - .5)), .35 + .65*ouTex)); }
vec3 ouDye(int i) { vec2 u = ouPut[i].xy; return ouTint(ouPose[i].w, piece(vec2(.5 + .46*u.x/(1.2 + .46*u.y), 1.06 - .092*u.y))); }
void ouSet() {
 vec4 lv = vec4(uDrone, uPhrase, uPad, uTexture);
 float gust = 4.*uCue*(1. - uCue), skip = 4.*uHits*(1. - uHits), o2 = uOwn[2];
 for (int i = 0; i < ouN; i++) {
  vec4 u = ouPut[i];
  vec3 n = ouPose[i].xyz;
  float fi = float(i), one = i == 2 ? 1. : .0;
  float on = ouStep(u.w - 1., u.w - .5, o2);
  float R = u.z*on*(1. + .16*sat(lv[i % 4]*ouG) + .2*max(o2,.0) - (i == 3 ? .5*min(o2,.0) : .0));
  if (i == 3) n.xz = rot(-2.1*min(o2,.0))*n.xz;
  float a = sin(uTime*.36 + fi*2.3);
  n.x += .03*a;
  n.y += (.02 + .03*one)*a + gust*.2*(1. + a) + .45*one*skip;
  n = normalize(n);
  ouAx[i] = n;
  ouC[i] = vec4(u.x, R*sqrt(1. - n.y*n.y) + .16*one*skip, u.y, R > .03 ? R : .0);
 }
}
// What the umbrellas leave of the sun at a place: a tinted disc with its ribs.
vec3 ouShade(vec3 q, int from, int to) {
 // a cue sends one bar of brighter light over the lawn
 vec3 c = vec3(1. + 1.1*uCue*ouBell((q.z - 3.6 - 7.*(1. - uCue))/1.1));
 int i = from; to = min(to, ouN);
 for (int k = 0; k < 4; k++) {
  float R = .0, t = .0, s = .0, r2 = .0;
  vec3 n = vec3(.0,1.,.0), v = n;
  for (; i < to; i++) {
   R = ouC[i].w; n = ouAx[i];
   vec3 d = ouC[i].xyz + n*R*ouH*.35 - q;
   float nl = dot(n, ouL);
   t = dot(d, n)/(abs(nl) < .06 ? .06 : nl); v = ouL*t - d; s = .015 + .035*t; r2 = dot(v, v);
   if (t > .03 && R > .0 && r2 < ouSq(R + s)) break;
  }
  if (i >= to) break;
  float r = sqrt(r2), h = r/R;
  vec3 a = normalize(cross(n, vec3(.96,.0,.28)));
  float rib = ouStep(.8 - .5*s, 1., cos(32.*atan(dot(v, cross(n, a)), dot(v, a) + 1e-5)))*ouStep(.1,.45, h)*(1. - sat(s*4.));
  vec3 tint = ouDye(i);
  c *= mix(vec3(1.), tint*tint*(.8 + .25*ouPad)*(1. - .6*rib)*mix(.4,1., ouStep(.02,.2, h)), ouStep(R + s, R - s, r));
  i++;
 }
 return c;
}
// The paper of one umbrella, the one the eye meets first.
int ouI; // which
vec3 ouX, ouE; // where, and the way out from its middle there
float ouR, ouF, ouBar, ouFr, ouCov; // how far out, the place between two ribs, the place round, a pixel's size, how much of the pixel
vec3 ouPaper(vec3 rd, vec3 nz, vec3 sh) {
 ouI = min(ouI, ouN - 1);
 float R = ouC[ouI].w + 1e-4, s = ouR/R, w = ouFr/R, f = ouF, fi = float(ouI);
 vec3 n = ouAx[ouI], N = normalize(n + ouE*ouH + cross(n, ouE)*.16*(f - .5));
 float lit = dot(N, ouL), side = dot(N, rd) < .0 ? 1. : -1., al = abs(lit);
 vec2 sheet = ouSheet(nz);
 // some are oiled afresh, some plain
 float oil = .4 + .4*sin(fi*2.4) + .5*(sheet.y - .5);
 vec3 pc = ouDye(ouI)*sheet.x;
 float paint = max(max(1. - ouIn(s, .89, w), ouIn(abs(s - .84), .01, w)), ouIn(s, .17, w));
 pc *= mix(vec3(1.), vec3(.74,.4,.28), .8*paint);
 float rw = .0065*(.6 + .4*s)*sqrt(R), rib = ouIn((.5 - abs(f - .5))*TAU*ouR/32., rw, ouFr)*min(1., rw/(ouFr*.6));
 float bnd = uBands[int(clamp(fract(ouBar)*16.,.0,15.))]*ouG*4.*f*(1. - f);
 // light through it, light on it
 vec3 T = ouSun*pc*sqrt(pc)*(.12 + al + .5*ouSq(sat(dot(rd, ouL))))*(.9 + .7*oil + .45*ouPad + .9*bnd)*(1. - .75*rib)*(1. - .28*ouIn(s, .52,.02));
 vec3 D = ouSun*pc*.5*al*(1. - .3*rib)*(1. + .8*bnd);
 // a hit runs out over one of them as a ring
 if (ouI == 2) T += ouSun*pc*.8*ouG*uHits*ouBell((s - 1. + .6*uHits)/.25);
 vec3 c = mix(T, D, ouStep(-.3,.22, lit*side))*sh;
 c += ouSky*pc*(.34 + .2*N.y*side)*(1. - .35*rib);
 c += pc*pc*ouLamp*ouNt*(.25 + 1.1*exp(-s*s*2.6))*(1. - .6*rib)*(1. + .5*bnd + .4*ouPad);
 // thread rings and the cap
 float thr = ouIn(abs(s - .58 + .06*abs(f - .5)), .005, w);
 c = mix(c, mix(vec3(.5,.1,.05)*(ouSky + ouSun*.2), ouLamp, ouKey), thr*(side < .0 ? .6 : .12 + .6*ouKey));
 return mix(c, vec3(.07,.04,.025)*(ouSky*2. + ouSun*sat(lit*side)), ouIn(s, .045, w));
}
vec3 ouLawn(vec2 p) {
 float up = max(uOwn[3], .0), foc = 1.25*mix(.8,1., ouStep(.5,1.3, uRes.x/uRes.y))*mix(1.04,.94, uSpace);
 float pit = .3 + .72*up + .17*min(uOwn[3], .0);
 vec3 ro = vec3(.1 + .22*sin(uTravel*.023), .0,7.1 - 1.5*up + .2*sin(uTravel*.017)) + (7.4 - .6*up)*vec3(.0, sin(pit), -cos(pit));
 vec3 rd = vec3(rot(.045)*p, foc);
 rd.yz = rot(-pit)*rd.yz;
 rd = normalize(rd);
 ouPx = 1./(uRes.y*foc);
 int i = 0;
 ouI = ouN; ouCov = .0; ouX = ro; ouE = rd; ouR = ouF = ouBar = .0; ouFr = ouPx;
 for (int l = 0; l < ouN; l++) {
  float R = .0; vec3 oc = ro;
  for (; i < ouN; i++) {
   R = ouC[i].w; oc = ouC[i].xyz - ro;
   float b = dot(oc, rd);
   if (R > .0 && dot(oc, oc) - b*b < R*R*1.7) break;
  }
  if (i >= ouN) break;
  vec3 n = ouAx[i], a = normalize(cross(n, vec3(.96,.0,.28)));
  float h = R*ouH;
  vec3 w = -oc - n*h;
  float K = 1. + 1./(ouH*ouH), yw = -dot(w, n), yd = -dot(rd, n);
  float qa = 1. - K*yd*yd, qb = dot(w, rd) - K*yw*yd, ds = qb*qb - qa*(dot(w, w) - K*yw*yw);
  qa = abs(qa) < 1e-3 ? 1e-3 : qa;
  float dq = sqrt(max(ds, .0))/abs(qa), t = -qb/qa - dq, y = yw + yd*t;
  if (t < .1 || y < .0 || y > h*1.01) { t += 2.*dq; y = yw + yd*t; }
  float r = max(y/ouH, 1e-4);
  vec3 X = ro + rd*t, e = (X - ouC[i].xyz - n*(h - y))/r;
  float fr = t*ouPx/max(abs(dot(normalize(n + e*ouH), rd)), .12);
 // the phrase rolls one of them round
  float bar = atan(dot(e, cross(n, a)), dot(e, a) + 1e-6)/TAU + (i == 6 ? .12*sin(uTravel*.06)*uPhrase : .0) + float(i)*.013, f = fract(bar*32.);
  float edge = sat(.5 + (R*(1. - .056*f*(1. - f)) - r)/(fr*1.4)), cov = edge*ouStep(-.01,.03, X.y);
  if (ds >= .0 && y > .0 && t > .1 && cov > ouCov) { ouI = i; ouX = X; ouE = e; ouR = r; ouF = f; ouBar = bar; ouFr = fr; ouCov = cov; }
  if (ouCov > .5 && edge > .95) break; // at a rim the one behind may still fill the pixel
  i++;
 }
 bool pap = ouI < ouN, tree;
 float tg = -ro.y/min(rd.y, -.004), tx = pap ? length(ouX - ro) : tg;
 vec3 q = ro + rd*tg, P = pap ? ouX : q;
 tree = q.z > 24. && !pap;
 vec2 s2 = rd.xy/max(rd.z, .1), o2 = s2 - vec2(ouL.x/ouL.z, .08);
 vec3 air = mix(vec3(.30,.38,.36), vec3(1.3,.95,.5), exp(-ouSq(o2.x*1.4)))*dot(ouSun, vec3(.2)) + ouSky*.15;
 // four noises, read as paper, as grass or as trees
 float n0 = noise(tree ? s2*vec2(6.,9.) + 3. : pap ? ouX.xy*3. + float(ouI) : q.xz*vec2(2.4,1.5));
 float n1 = noise(tree ? s2*vec2(34.,28.) : pap ? vec2(ouBar*46., ouR*8.) : q.xz*vec2(52.,9.));
 float n2 = noise(tree ? vec2(s2.x*23. + .5*n0,1. + s2.y) : pap ? rot(1.1)*ouX.xy*vec2(34.,11.) : q.xz*vec2(24.,5.) + 9.);
 float n3 = noise(tree ? vec2(s2.x*61.,5.) : pap ? vec2(ouX.x*46., ouX.y*5. + float(ouI)) : q.xz*.45 + 2.);
 vec3 sh = ouShade(P, pap ? ouI + 1 : 0, pap ? ouI + 6 : ouN), g = vec3(.0), pc = g;
 if (!pap || ouCov < 1. || ouX.y < .1) {
 // grass
 float b = mix(.5,.6*n1 + .4*n2,.3 + .7*exp(-tg*.16));
 vec3 alb = mix(vec3(.09,.17,.05), vec3(.34,.40,.12), b*.9 + .5*(n0 - .5));
 alb = mix(alb, vec3(.46,.47,.3), .5*ouStep(.35,.8, n3));
 alb = mix(alb, vec3(.78,.8,.82)*(.9 + .12*n0 + .06*(b - .5)), ouSn);
 alb = mix(alb, mix(vec3(.42,.2,.09), vec3(.62,.37,.17), .5*b + .5*n0), ouDry);
 g = alb*(ouSun*sh*(.3 + ouL.y)*(.5 + .6*ouSq(sat(dot(rd, normalize(vec3(ouL.x, -.2, ouL.z))))))*mix(.75 + .7*b*b, 1., ouSn) + ouSky*.6);
 // dew
 vec2 c2 = q.xz*vec2(16.,9.), id = floor(c2), h = hash22(id);
 float gw = 16.*tg*ouPx, dew = ouStep(.07 + gw, .02, length(c2 - id - .5 - .6*(h - .5)))*step(.62, h.y)*max(.4 + .6*sin(uTime*(.3 + .4*h.x) + h.y*40.), .0);
 g += ouSun*sh*(.4 + .8*uHigh*ouG)*dew*min(1.,.05/max(gw, 1e-3))*(1. - ouDry);
 // shade gathers under each one
 for (int j = 0; j < 7; j++) { vec2 e = (q.xz - ouC[j].xz)/(ouC[j].w + 1e-3); g *= 1. - .5*ouSq(max(1. - .6*dot(e, e), .0)); }
 g = mix(g, air, .6*(1. - exp(-ouSq(max(tg - 5.,.0)*.055))));
 if (pap && q.z > 24.) g = air*.4; // a rim before the wood
 if (tree) {
 // trees, and the light between their trunks
  float hy = max(s2.y, .0), near = exp(-dot(o2, o2)*5.);
  vec3 wood = mix(vec3(.010,.026,.02), vec3(.05,.085,.025), n0*n1)*(dot(ouSun, vec3(.3)) + .2*ouSky.b);
  g = mix(wood, air, .16*near*(.4 + n0*n1) + .02);
  g = mix(g, air*1.1, ouStep(.52,.64,.5*n2 + .5*n3 + .05*near)*ouStep(.0,.06,.04 + .13*n0 + .07*n1 - hy)*(.15 + .6*near));
  g = mix(g, air*.9,.35*exp(-hy*40.));
 }
 // the far ones crowd to a ribbon
 float rr = .0, z = .0, cv = .0, kk = .0;
 vec2 d = p, at = p;
 for (int j = 0; j < 6; j++) {
  kk = float(j/2); z = 8.9 + 4.*up + 3.2*kk; tg = (z - ro.z)/max(rd.z, .05);
  q = ro + rd*tg;
  at.x = q.x/1.02 + kk*.37; at.y = floor(at.x); cv = .0;
  if (q.y < .0 || q.y > 1.4) continue;
  // of two that overlap the even one stands in front
  if ((mod(at.y, 2.) > .5) == (j % 2 == 0)) at.y += at.x - at.y < .5 ? -1. : 1.;
  h = hash22(vec2(at.y, kk + 3.));
  rr = (.4 + .26*h.x)*step(.1, fract(h.x*7.7))*ouStep(-1.,-.5, uOwn[2] - .2*h.y) + 1e-3;
  float v = .6 + .35*h.y;
  d = vec2((at.x - at.y - .5 - .2*(h.y - .5))*1.02, q.y - rr*v*.8)/vec2(rr, rr*v);
  cv = ouIn(length(d), 1., tg*ouPx*1.5/rr)*ouStep(.0,.1, q.y)*step(.02, rr);
  if (cv > .3) break;
 }
 pc = ouTint(h.y*3., piece(vec2(.5 + .46*at.y/(1.2 + .46*z), .1)));
 pc = pc*pc*(ouSun*(.9 + .5*d.y) + ouNt*ouLamp)*(.85 + .15*cos(16.*atan(d.y - .15, d.x + 1e-5))) + ouSky*.3*pc;
 g = mix(g, mix(pc, air, .06 + .07*kk), cv);
 }
 vec3 c = mix(ouPaper(rd, vec3(n0, n1, n2), sh), air, .5*(1. - exp(-ouSq(max(tx - 4.,.0)*.06))));
 // blades of grass stand before its foot
 g = mix(g, c, pap ? ouCov*ouStep(.0,.02, ouX.y - .08*n3*n3*(1. - ouDry)) : .0);
 // the stick of the one we look into
 vec3 n = ouAx[3], sv = -n*ouC[3].w*(ouH + 1.15), w0 = ouC[3].xyz - ro + n*ouC[3].w*ouH*.95;
 float sb = dot(sv, rd), sl = sat((sb*dot(rd, w0) - dot(sv, w0))/max(dot(sv, sv) - sb*sb, 1e-4));
 w0 += sv*sl; tg = dot(w0, rd);
 float rw = .024*ouC[3].w*(sl < .12 ? 2. : 1.), sd = length(w0 - rd*tg);
 return mix(g, mix(vec3(.42,.28,.13), vec3(.12,.07,.03), sat(sd/rw))*(ouSky + ouSun*.25), ouIn(sd, rw, tg*ouPx)*ouStep(.02,.06, ro.y + rd.y*tg)*step(.0, dot(ouC[3].xyz - ro, n))*(ouI < 3 ? 1. - ouCov : 1.));
}
// Sun and shade of the leaves overhead: 1 in the sun.
float ouLeaves(vec2 p, float soft) {
 float l = 1.;
 p += .02*vec2(sin(uTime*.31), sin(uTime*.23 + 1.)) + .012*sin(uTime*.17 + p.yx*5.);
 for (int k = 0; k < 2; k++) {
  float fk = float(k);
  vec2 q = rot(.5 + 1.3*fk)*p*(4.6 + 1.1*fk) + 7.*fk, id = floor(q), h = hash22(id + 3.);
  vec2 d = rot(h.x*2. + .2*sin(uTime*(.5 + .3*h.y) + h.x*20.))*(q - id - .5 - .1*(h - .5));
  l *= 1. - .75*ouStep(soft, -soft, abs(d.y) - .16*(1. - ouSq(d.x/.43)))*ouStep(.3,.45, noise(p*1.9 + vec2(2. + 3.*fk, .0)));
 }
 return l;
}
// One wheel from below: hub and size and dye in wh, q the place in its own plane, o its runner; sq towards the sun.
// Paints over c, and takes from the light that goes on down.
void ouWheel(int i, vec4 wh, vec2 q, float R, vec2 o, float px, float ang, vec2 sq, inout vec3 c, inout vec3 light) {
 float r = length(q), s = r/R, w = px/R, fi = float(i);
 if (s > 1.01) return;
 float u = (atan(q.y, q.x + 1e-6)/TAU + ang)*32., f = fract(u), id = floor(u), sag = 4.*f*(1. - f);
 float cov = sat(.5 + (R*(1. - .02*sag) - r)/(px*1.4)), mid = ((id + .5)/32. - ang)*TAU;
 vec2 at = wh.xy + (.25 + .75*s)*R*vec2(cos(mid), sin(mid));
 vec4 m = piece(vec2(.5 + at.x/1.8,.5 - at.y))*(.55 + .45*s);
 float bnd = uBands[int(clamp(mod(id, 16.), .0,15.))]*ouG*sag, lum = dot(light, vec3(.33));
 vec2 sq2 = q*2.2 + fi*3.1, sh = ouSheet(vec3(noise(sq2*3.), noise(sq2*vec2(9.,31.)), noise(rot(1.1)*sq2*vec2(11.,37.))));
 vec3 pc = ouTint(wh.w, m)*sh.x;
 vec3 through = light*pc*.5;
 pc *= mix(vec3(1.), vec3(.8,.4,.26), .75*ouStep(.93 - w, .93 + w, s));
 vec3 T = light*pow(pc, vec3(1.5))*(.9 + .4*sh.y)*(1. + .5*ouPad + .9*bnd)*(.86 + .2*sag + .1*(f - .5));
 // a hit runs out along one paper as a ring
 if (i == 1) T *= 1. + 2.2*uHits*ouG*ouBell((s - 1. + .55*uHits)/.15);
 T /= 1. + .2*dot(T, vec3(.33));
 T += pc*pc*ouLamp*ouNt*(.2 + 1.3*exp(-s*s*3.))*(1. + .4*ouPad + .5*bnd) + ouSky*pc*.16;
 // the long ribs, split bamboo with a lit edge
 vec3 bam = vec3(.4,.23,.1), e = vec3(q/max(r, 1e-4), .0);
 float ds = (f < .5 ? f : f - 1.)*TAU*r/32., rw = R*(.007 + .005*s), ts = dot(vec2(-e.y, e.x), sq - q) > .0 ? 1. : -1.;
 vec3 rc = bam*(.16 + .16*lum + .75*lum*ouStep(.1,1., ts*ds/rw)) + bam*ouLamp*ouNt*exp(-s*2.);
 T *= 1. - .3*exp(-abs(ds)/(rw*1.6));
 T = mix(T, rc, ouIn(abs(ds), rw, px)*(1. - .25*s));
 T = mix(T, vec3(.25,.06,.03)*(.3 + lum), .7*ouIn(abs(s - .972), .002, w));
 c = mix(c, T, cov);
 light = mix(light, through, cov);
 // the short ribs, from the runner lower on the stick up to the long ones
 float a = .075*R, b = .58*R, v = .0, r2 = r;
 vec2 q2 = q;
 for (int n = 0; n < 2; n++) { q2 = q - o*(1. - v); r2 = length(q2); v = clamp((r2 - a)/(b - a), .0,1.); }
 u = (atan(q2.y, q2.x + 1e-6)/TAU + ang)*32.; f = fract(u);
 if (v < 1.) {
  float out_ = step(.001, v), k = TAU*r2/32.;
  ds = (f < .5 ? f : f - 1.)*k; rw = R*.0085*(1.15 - .3*v);
  rc = bam*((.12 + .12*lum + .42*lum*ouStep(.0,1., ts*ds/rw))*(.8 + .4*hash11(floor(u + .5) + 5.)) + ouLamp*ouNt*(1. - v));
  c = mix(c*(1. - .35*(1. - v)*out_), rc, ouIn(abs(ds), rw, px)*out_);
 // coloured threads tied from rib to rib, star within star
  for (int n = 0; n < 4; n++) {
   float fn = float(n), tri = abs(fract(u*.5 + .5*mod(fn, 2.))*2. - 1.), sl = .09*(b - a)/k;
   float d = abs(v - .3 - .17*fn - .09*(tri - .5))*(b - a)/sqrt(1. + sl*sl), tw = .0021 + .0012*ouKey;
   vec3 tc = mix(n == 0 ? vec3(.9,.1,.05) : n == 1 ? vec3(.95,.85,.6) : n == 2 ? vec3(.04,.45,.3) : vec3(.8,.1,.35), uKind[n], .15);
   c = mix(c*(1. - .25*ouBell(d/(tw*2.6))), tc*(.3 + .35*lum + 1.6*ouKey + .5*ouNt), ouIn(d, tw, px));
  }
 }
 // the runner on the stick, notched for its ribs
 float rr = length(q - o), run = ouIn(rr + .003*R*cos(TAU*u), a, px);
 vec3 wood = vec3(.2,.1,.04)*(.25 + .4*lum + .4*ouNt) ;
 c = mix(c, wood*(.7 + .6*ouStep(.55*a, .6*a, rr)), run);
}
vec3 ouWheels(vec2 p) {
 float asp = ouStep(.4,1.2, uRes.x/uRes.y), zoom = exp2(-uOwn[3])*mix(.96,1.05, uSpace)*mix(1.25,1., asp);
 vec2 anc = vec2(-.14,.02);
 p = (p - anc*asp)*zoom + anc;
 float px = zoom/uRes.y, ph = TAU*uLoop, gust = 4.*uCue*(1. - uCue);
 vec2 sun = vec2(-.17,.17 - .07*sat(uDrone*ouG)) + .07*vec2(sin(ph), .6*cos(ph));
 float d = length(p - sun);
 // the sky, with a thin cloud
 vec2 cq = p*vec2(2.2,3.4) + vec2(.3*sin(uTime*.01), 2.);
 float n1 = noise(cq), n2 = noise(rot(.5)*cq*2.7), cl = ouStep(.35,.85,.65*n1 + .35*n2);
 vec3 sky = mix(vec3(.06,.25,.75), vec3(.25,.55,1.), sat(.5 - .6*p.y)) + vec3(.4,.4,.35)*exp(-d*4.);
 sky = mix(sky, vec3(1.25,1.2,1.1), .45*cl);
 sky = mix(sky, vec3(1.1,.6,.35) + vec3(.5,.3,.1)*exp(-d*3.) - .25*cl, ouGd);
 sky = mix(sky, vec3(.95,1.,1.08) - .12*cl, ouSn);
 sky = mix(sky, vec3(1.15,.72,.32) + .2*cl, ouDry);
 vec2 g = p*34., id = floor(g), h = hash22(id);
 sky = mix(sky, vec3(.012,.03,.09) + vec3(.02,.03,.06)*cl + .9*h.y*step(.72, h.x)*ouStep(.1,.02, length(g - id - .2 - .6*h)), ouNt);
 vec3 light = ouSun*(.22 + .5*exp(-d*1.7) + (1.7 + .5*uMic)*exp(-d*d*mix(30.,18., uMic)))*mix(.25,1., ouLeaves(p, mix(.1,.03, uTone)));
 // a cue lets a wide bar of sun over all of them
 light *= 1. + .9*uCue*ouBell((dot(p, vec2(.83,.55)) - .9 + 1.3*uCue)/.28);
 // snow on the paper shuts out some of the light
 light = mix(light, mix(light*vec3(.9,1.,1.15), light*vec3(.22,.3,.42) + vec3(.05,.08,.13), ouStep(.3,.6,.75*n1 + .3*n2)), ouSn);
 vec3 c = sky;
 for (int i = 2; i >= 0; i--) {
  vec4 wh = i == 0 ? vec4(-.5,-.15,.63,.95) : i == 1 ? vec4(.6,-.32,.5,2.) : vec4(.37,.42,.41,.3);
  float fi = float(i), on = i == 0 ? 1. : ouStep(-.95,-.3, uOwn[2] - .12*fi);
  float R = wh.z*on*(1. + (i == 0 ? .12 : .34)*max(uOwn[2], .0))*(1. + .03*sat(uLow*ouG));
  if (R < .02) continue;
  wh.xy += .006*vec2(sin(uTime*.21 + fi*2.), sin(uTime*.17 + fi)) + .02*gust*vec2(sin(fi*2. + 5.*uCue), cos(fi + 4.*uCue));
  vec2 dn = normalize(i == 0 ? vec2(-.5,-.8) : i == 1 ? vec2(.35,-.9) : vec2(.75,.6)), side = vec2(-dn.y, dn.x), q = p - wh.xy, sq = sun - wh.xy;
 // each leans its own way
  float da = dot(q, rot(.4 - .5*fi)*dn), lean = 1. + .85*uOwn[5];
  vec2 o = dn*R*.13*lean, ax = rot(.4 - .5*fi)*dn;
  ouWheel(i, wh, (q + ax*da*.15*lean)/max(1. - .28*lean*da, .4), R, o, px, .011*fi + .012*sin(uTime*.05 + fi*2.) + (i == 2 ? .12*sin(uTravel*.05)*uPhrase : .0), sq, c, light);
 // its stick comes down past us
  float al = dot(q - o, dn), ac = dot(q - o, side), sw = R*.028 + .035*on*max(al, .0);
  vec3 st = vec3(.4,.24,.1)*(.12 + (.1 + .4*ouStep(.0,1., ac/sw*sign(dot(sq, side))))*min(dot(ouSun, vec3(.2)), 1.))*(1. - .4*ouBell((fract(al/R*1.6 + .2) - .5)/.03));
  c = mix(c, st + .14*ouLamp*ouNt*exp(-al*3.), ouIn(abs(ac), sw, px)*step(.0, al));
 }
 return c;
}
vec3 render(vec2 p) {
 ouG = .35 + 1.45*uEnergy;
 ouNt = ouStep(.0,1.,-uOwn[0]); ouGd = sat(uOwn[0]);
 ouSn = ouStep(.0,.9,-uOwn[1]); ouDry = ouStep(.0,.9, uOwn[1]);
 ouTex = sat(uTexture*ouG); ouPad = sat(uPad*ouG); ouKey = sat(uKeys*ouG);
 ouH = .3*exp2(1.3*uOwn[5]);
 float el = mix(.62,.42, sat(uDrone*ouG)) - .1*ouGd, az = .3 + .16*sin(TAU*uLoop);
 ouL = vec3(sin(az)*cos(el), sin(el), cos(az)*cos(el));
 ouSun = mix(mix(vec3(2.9,2.2,1.3), vec3(2.8,1.2,.4), ouGd), vec3(.16,.22,.34), ouNt)*(.85 + .25*uLevel)*mix(vec3(1.), vec3(1.08,.84,.55), ouDry);
 ouSky = mix(mix(vec3(.40,.52,.64), vec3(.42,.34,.5), ouGd), vec3(.045,.08,.17), ouNt);
 if (uVar > .5) return screenOf(ouWheels(p));
 ouSet();
 return screenOf(ouLawn(p));
}
