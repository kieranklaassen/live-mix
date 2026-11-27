// name: Wave machine
// a: From the stalls
// b: From the wings
// what: A small painted stage behind a dark arch: five twisted rollers of slate canvas with foam painted on their crests turn one behind another and read as sea, under board clouds and a painted moon, lit by candle shades and one cold lamp; or the same machine seen from the wings, with its bench, sawn ends, cranks and ropes.
// follows: Each kind of sound is one roller, drones at the back, hits at the front: it takes their colour and its screw deepens as it sounds. Fuller music turns them faster, the low band lifts them. The footlights are the mix, low to high from left to right. A hit lets down a gilt lightning, a cue lifts the moon; keys whiten the foam, a voice lights the clouds.
// own: 0 the eye: 1 in over the footlights, close to the water (b: low at the ends of the rollers), -1 looking down from the gallery (b: from up among the ropes); 1 1 thin rollers twisted tight as rope, -1 fat ones with one long swell; 2 1 they climb in a steep bank, -1 they lie level; 3 1 three threads like barley sugar, -1 carved to thin blades; 4 1 dyed in the sounds' colours, -1 everything bare white card; 5 the light: 1 day through the back cloth in the colours of drone and pad, -1 footlights out and moonlight alone; 6 1 a bare stage, clouds and wings drawn off and the moon great, -1 a ceiling of cloud let down; 7 1 paper snow falls, -1 sea fog
#define wmS smoothstep
float wmF(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
float wmY[5], wmZ[5], wmPh[5], wmK[5], wmD[5], wmLv[5]; // each roller, front to back: axis, turn, twist, depth of carving, how loud
vec3 wmTint[5];
float wmL, wmFoc, wmPx;  // half the length of a roller, the lens, a pixel at distance 1
float wmR, wmSl, wmGlow=1., wmDye, wmCard, wmDay, wmDark, wmBare, wmLow, wmFog; // the rollers' radius and rise, the footlights, and the world's
const vec3 wmBone=vec3(.80, .72, .57), wmWarmC=vec3(1., .60, .28), wmColdC=vec3(.50, .68, .95);
// How far the carving stands out where a direction in the round makes the cosine c and sine s with the ridge.
float wmRidge(float c, float s) {
 if (uOwn[3] > 0.) { c=mix(c, c*(4.*c*c - 3.), uOwn[3]); s=mix(s, s*(3. - 4.*s*s), uOwn[3]); }
 float f=.5+.5*c; c=f*f; if (uOwn[3] < 0.) c=mix(c, c*c*c*c*1.15, -uOwn[3]); return c*mix(1., c, .25+.6*uTone)*(1.+.3*s); }
vec2 wmTurn(int i, float x) { vec2 v=fract(vec2(.75, .5)+wmK[i]*x - wmPh[i])*2. - 1.; v=4.*v*(1. - abs(v)); return v+.225*(v*abs(v) - v); }
// Distance to roller i.
float wmD2(vec2 o, vec2 u, int i) { float l=max(length(o), 1e-4); return l - wmR - wmD[i]*wmRidge(dot(o, u)/l, (o.y*u.x - o.x*u.y)/l); }
float wmD3(vec3 q, int i) { return wmD2(vec2(q.z - wmZ[i], q.y - wmY[i]), wmTurn(i, q.x), i); }
// Follow a ray to roller i: x where it meets it or comes nearest, y pixels it misses by, z whether at the sawn end.
vec3 wmHit(vec3 ro, vec3 rd, int i, int steps, float far) {
 vec2 o=vec2(ro.z - wmZ[i], ro.y - wmY[i]), d=rd.zy; float a=max(dot(d, d), 1e-5), b=dot(o, d), r=wmR+wmD[i]*1.06+.004, h=b*b - a*(dot(o, o) - r*r);
 if (h < 0.) return vec3(1e5, 99., 0.);
 h=sqrt(h); float t=max((-b - h)/a, 0.), e=(-b+h)/a, end=0.;
 float rx=abs(rd.x) < 1e-5 ? 1e-5 : rd.x, t0=(-wmL - ro.x)/rx, t1=(wmL - ro.x)/rx;
 if (min(t0, t1) > t) { t=min(t0, t1); end=1.; }
 e=min(e, max(t0, t1));
 if (e <= t || t > far) return vec3(1e5, 99., 0.);
 float best=99., bt=t;
 for (int n=0; n < steps; n++) {
  float f=wmD3(ro+rd*t, i)*mix(1., .6, abs(uOwn[3])), m=f/(t*wmPx);
  if (m < best) { best=m; bt=t; }
  if (m < .7) return vec3(t, 0., n == 0 ? end : 0.);
  t+=f*.86; if (t > e) break;
 }
 return vec3(bt, t < e && uVar > .5 ? max(best-1., 0.)/3. : best, 0.);
}
// The footlights at a place along the lip: their strength is the mix, with the spectrum spread from left to right.
float wmLamp(float x) {
 float b=band(x/2.3+.5), fl=sin(uTime*4.7+x*9.);
 return (.5+.75*uLevel+.55*b*(.5+uEnergy))*(1.+(.04+.2*uHigh)*fl)*wmGlow;
}
// The footlights on roller i, behind the one in front.
float wmFoot(vec3 q, vec3 n, int i, float La) {
 vec2 v=vec2(-.02 - q.z, .04+.4*uVar - q.y); float d=max(length(v), .05); v /= d;
 float sh=1.;
 if (i > 0) {
  vec2 c=vec2(wmZ[i - 1] - q.z, wmY[i - 1] - q.y), up=vec2(v.y, -v.x), u=wmTurn(i - 1, q.x);
  float r=wmR+wmD[i - 1]*wmRidge(dot(up, u), up.y*u.x - up.x*u.y);
  sh=wmS(-.05, .045, -dot(c, up) - r);
 }
 return sh*sat(dot(n.zy, v)*.9+.1)*La*1.5/(1.+d*.4);
}
vec3 wmPool(vec3 q) { vec2 c=q.xz - vec2(.15+.1*sin(uTime*.021), 1.2); return wmColdC*exp(-dot(c, c)*mix(.45, .2, wmDark))*(.45+.4*uTone+.5*uCue+.35*uMid)*(1.+1.3*wmDark); }
// Fog that lies over the water and drifts.
vec3 wmMist(vec3 c, vec3 q, float t) {
 float k=noise(vec2(q.x*1.1+uTime*.05, q.y*2.2+q.z*1.7))*.6+noise(vec2(q.x*2.7 - uTime*.07, q.y*4.+q.z*3.))*.4;
 float far=uVar < .5 ? sat(q.z*.42+.1) : sat(t*.2 - .15);
 return mix(c, (uKind[0]*.3+.1)*(.35*wmGlow+.75*wmDay+.35*wmDark+.4*wmCard+.3*uLevel)*mix(vec3(1.), wmWarmC*1.6, .3*wmGlow*wmS(1., 0., q.z)), sat(wmFog*far*(.35+1.1*k)*wmF(.3, 1.7, q.y - .25*q.z)*wmS(-.05, .5, q.z)*1.3));
}
// Canvas of roller i at q: painted bands along the ridge, scalloped foam, seams; then the two lights.
vec3 wmCanvas(vec3 q, int i, float t, vec3 rd) {
 vec2 o=vec2(q.z - wmZ[i], q.y - wmY[i]), u=wmTurn(i, q.x), k=vec2(.0025, 0.); float r=length(o), co=dot(o, u), si=float(i)*7.3, a=atan(o.y*u.x - o.x*u.y, co), d=wmD2(o, u, i);
 vec3 n=normalize(vec3(wmD2(o, wmTurn(i, q.x+k.x), i), wmD2(o+k.yx, u, i), wmD2(o+k, u, i)) - d+1e-7);
 float aw=t*wmPx/wmR/max(.25, -dot(n, rd));
 float br=noise(vec2(q.x*4.+si, a*5.)), fine=noise(vec2(q.x*46., a*8.+si)), w=a+(br - .5)*.14;
 float La=wmLamp(q.x), f=.5+.5*co/r;
 vec3 c=mix(vec3(.012, .026, .042), vec3(.052, .11, .165), wmS(.0, .8, f+.2*(br - .5)));
 c*=.75+.6*wmS(.3, .75, br);
 c=mix(c, dot(c, vec3(.35, .5, .3))*wmTint[i]*2.1, .1+.38*wmLv[i]);
 vec3 ti=wmTint[i]; float thr=max(uOwn[3], 0.);
 if (wmDye > 0.) c=mix(c, ti*(.1+.4*ti)*(.6+.6*wmS(.2, .8, f+.3*(br - .5)))*(.75+.5*wmLv[i]), wmDye);
 if (wmCard > 0.) c=mix(c, mix(wmBone*.62, ti*.55+.06, .12+.5*wmLv[i])*(.8+.25*wmS(.2, .8, br)), wmCard);
 // foam: a white crest with a scalloped hem, and one loose line each side
 float sc=abs(sin(q.x*15.+si+.6*a)), hem=.16+.2*sc*sc, v=-w;
 float foam=wmF(hem - aw, hem+aw+.02, v)*wmS(-.2 - aw, -.1, v)*(.7+.3*wmS(.3, .6, br+.3*fine));
 foam*=1. - .55*wmF(0., aw+.05, abs(v - hem+.1) - .015);
 foam+=wmF(0., aw+.05, abs(v - hem - .22) - .018)*.6*wmS(.2, .5, fine*.5+br*.5);
 foam+=wmF(0., aw+.06, abs(v+.75+.1*br) - .02)*.4*wmS(.4, .6, br)+wmF(0., aw+.06, abs(v - 1.35) - .025)*.3*wmS(.35, .6, br);
 if (thr > 0.) { float u3=mix(co/r, (co/r)*(4.*co*co/(r*r) - 3.), thr); foam=mix(foam, wmS(.72, .9, u3+.3*(fine - .5))*.9, thr); }
 foam=sat(foam)*(1. - .45*wmCard);
 c=mix(c, wmBone*(.8+.4*uKeys)*(.8+.25*fine), foam*.9);
 float seam=abs(fract(q.x*2.1+si*.37) - .5)/2.1;
 c*=(.82+.25*fine)*(1. - .35*wmF(0., .004+t*wmPx, seam));
 float low=sat((q.y - wmY[i])/wmR*.5+.62); // down between two beds it is dark
 float cold=sat(dot(n, normalize(vec3(-.62, .72, .18)))*.9+.06);
 vec3 gel=piece(vec2(sat(q.x/3.2+.5), .95 - .2*float(i))).rgb;
 vec3 l=mix(wmWarmC, vec3(.9), .12)*wmFoot(q, n, i, La)*(uVar < .5 ? 1.5 : 3.4)+(wmPool(q)*(uVar < .5 ? 1.1 : .4)+gel*(.5+uEnergy)*(.5 - .3*uVar))*cold*low+vec3(.02, .026, .034)*low;
 l+=wmWarmC*.12*La*low*low*sat(.4 - .6*n.z);
 if (wmDay > 0.) l+=wmDay*(mix(vec3(1.), uKind[1]*1.4, .5)*(.35+1.5*sat(n.z*.8+n.y*.35))+vec3(.3, .33, .36)*sat(.5+.5*n.y))*low;
 if (wmCard > 0.) l+=wmCard*vec3(.85, .86, .88)*(.15+.7*sat(dot(n, vec3(-.45, .75, -.48))))*low*(1. - .9*wmDark);
 c=mix(c*l, vec3(.06, .07, .085)*(.4+uLevel), uSpace*uSpace*.4*sat(q.z*.3+.12*uVar*(q.x+1.)));
 return wmFog > 0. ? wmMist(c, q, t) : c;
}
const vec3 wmLobe[12]=vec3[12](vec3(-.291, .120, .143), vec3(-.137, .053, .125), vec3(.123, .076, .148), vec3(.331, .113, .121), vec3(-.349, .002, .144), vec3(-.180, -.059, .111), vec3(.186, .011, .173), vec3(.330, -.022, .085), vec3(-.499, -.137, .091), vec3(-.111, -.136, .163), vec3(.123, -.082, .124), vec3(.464, -.155, .128));
// Painted cloud, cut from board: x how much of it is here, y its painted roundness.
vec2 wmCloud(vec2 q, float px) {
 float m=-1., r=0.;
 for (int j=abs(q.x) > .68 || abs(q.y) > .32 ? 12 : 0; j < 12; j++) {
  vec3 b=wmLobe[j]; float R=b.z; vec2 o=q - b.xy; if (o.y < 0.) o.y*=.5; float k=R - length(o), h=o.y/R, e=sat(1. - k*8.);
  m=max(m, k); r=mix(r, e*e*(.9+.3*e)*sat(.45+h+.4*o.x/R), wmS(-px, px, k)*wmS(-.75, .1, h));
 }
 return vec2(wmS(-px, px, min(m, q.y+.17 - .03*abs(sin(q.x*7.)))), r*sat(.6+q.y*1.6));
}
// What hangs and stands behind the last roller: sky cloth, moon, lightning, clouds.
vec3 wmBack(vec3 ro, vec3 rd) {
 vec3 q=ro+rd*(2.75 - ro.z)/rd.z; float t=(2.75 - ro.z)/rd.z, px=t*wmPx;
 float br=noise(vec2(q.x*1.3, q.y*9.)), fold=.5+.5*sin(q.x*7.+1.6*sin(q.x*2.1)+.4*q.y);
 float h=q.y - .5;
 vec3 c=mix(wmBone*.8, vec3(.07, .10, .135), wmS(-.15, .75, h+.2*(br - .5)));
 c=mix(c, wmBone*.5, wmS(.56, .75, noise(vec2(q.x*.9+3., q.y*5.5+.4*q.x)))*.5);
 c*=.8+.2*fold;
 if (wmCard > 0.) c=mix(c, wmBone*(.75+.2*fold), wmCard);
 float La=wmLamp(q.x), warm=La*.42/(.5+1.5*max(h, 0.)), mid=exp(-q.x*q.x*.35);
 vec3 l=(wmWarmC*warm*1.1+wmColdC*.75*exp(-(q.x+.5)*(q.x+.5)*.7)+wmTint[4]*wmLv[4]*.15)*mid*wmS(-.15, .15, h);
 if (wmDay > 0.) { vec3 s=mix(uKind[1], uKind[0], wmS(-.1, 1.2, h+.25*(br - .5))); c=mix(c, vec3(1.), wmDay); l=mix(l, s*(.2+s)*(.75+.5*exp(-h*h*3.))*(.93+.07*fold)*(.9+.3*uLevel), wmDay); }
 if (wmCard > 0.) l+=wmCard*vec3(.6, .62, .66)*(1. - wmDay)*(1. - .9*wmDark);
 if (wmDark > 0.) l+=wmDark*wmColdC*.3*exp(-length(q.xy - vec2(.5, 1.))*.9);
 // the moon on its slat
 float up=.34*4.*uCue*(1. - uCue);
 q=ro+rd*(2.45 - ro.z)/rd.z; vec2 mo=q.xy - vec2(.62, 1.0+up);
 if (wmBare > 0.) mo=mix(mo, (q.xy - vec2(.1, .95+up))/2.7, wmBare);
 float md=length(mo);
 l+=vec3(.9, .85, .7)*(.12+.5*uCue)*exp(-md*2.6);
 vec3 col=c*l;
 col*=1. - (.5 - .42*max(wmDay, wmCard*.6))*wmF(-.06, .1, length(mo - vec2(.03, .05)) - .24);
 float slat=wmF(-px, px, max(abs(mo.x) - .025, mo.y));
 col=mix(col, vec3(.05, .035, .02)*l, slat);
 float ring=wmF(0., .02, abs(md - .2) - .006)*.25, dab=md < .26 ? noise(mo*14.) : 0.;
 vec3 moon=mix(wmBone, wmBone*vec3(.62, .64, .66), sat(wmS(.45, .7, dab)*.5+ring))*(.42+.25*uLevel+.9*uCue)*(.8 - mo.y*1.2)*(1.+.9*wmDark);
 if (wmDay > 0.) moon=mix(moon, mix(uKind[3], vec3(1.), .35)*(.75+.5*uLevel+.5*uCue), wmDay); moon+=wmCard*(1. - wmDay)*(1. - wmDark)*.45;
 col=mix(col, moon, wmF(-px, px, md - .24));
 // lightning, a gilt board let down from the clouds
 if (uHits > .004) {
  q=ro+rd*(2.4 - ro.z)/rd.z;
  float x=q.x+.45+.25*sin(uTime*.043), v=1.75 - q.y, go=.75+.75*wmS(0., .6, 1. - uHits);
  float zig=(abs(fract(v*2.2) - .5) - .25)*.34+v*.1, wd=.055*sat(1.02 - v/go);
  float b=wmF(-px, px, abs(x - zig) - wd)*step(0., v)*step(v, go);
  vec3 gilt=mix(vec3(1., .66, .25), vec3(1., .9, .66), wmS(-.01, .02, x - zig))*(.5+1.7*uHits);
  col=mix(col, gilt, b*sat(uHits*5.))+c*vec3(1., .75, .4)*uHits*1.1*exp(-(x - zig)*(x - zig)*6.8)*wmF(.2, 1.6, v);
 }
 // the cloud flats, slid by hand
 for (int j=0; j < (wmLow > 0. ? 4 : 2); j++) {
  float f=float(j), z=2.3 - .25*f; t=(z - ro.z)/rd.z; q=ro+rd*t;
  vec2 cq=q.xy - vec2(f < .5 ? .75+.12*sin(uTime*.031) : -.75+.16*sin(uTime*.024+2.), f < .5 ? 1.62 : 1.5);
  if (j > 1) cq=q.xy - vec2((f - 2.4)*1.7+.2*sin(uTime*.027+f*2.), 1.05+1.3*(1. - wmLow)+.12*f);
  cq.y+=.3*wmLow - 1.3*wmBare; if (f > .5) cq.x=-cq.x;
  cq /= vec2(1.2, .85)*(1.+.15*f);
  cq /= 1.+.55*wmLow;
  col*=1. - .5*wmF(-.1, .14, length(max(abs(cq - vec2(-.03, .06)) - vec2(.36, .03), 0.)) - .09);
  float rope=wmF(.004, .008+t*wmPx, abs(abs(cq.x) - .34))*step(0., cq.y);
  col=mix(col, vec3(.1, .075, .045)*(.3+warm), rope*.8);
  vec2 k=wmCloud(cq, t*wmPx);
  float sh=sat(.06+k.y*1.1+.3*(br - .5));
  vec3 cc=mix(vec3(.065, .085, .105), wmBone, sh); if (wmCard > 0.) cc=mix(cc, wmBone*(.5+.5*sh), wmCard);
  vec3 cl=wmWarmC*La*.24+wmColdC*.26+wmWarmC*.5*wmF(-.17, .05, cq.y)+(wmTint[3]*wmLv[3]*.14+vec3(.5, .42, .3)*uMic*.6)*sh;
  if (wmDay+wmCard > 0.) cl+=wmDay*(.15+.5*uKind[1])*(.3+sh)+wmCard*.4*(1. - .9*wmDark); if (wmDark > 0.) cl+=wmDark*wmColdC*.4*sh;
  col=mix(col, cc*cl, k.x);
 }
 return wmFog > 0. ? wmMist(col, ro+rd*((2.4 - ro.z)/rd.z), t) : col;
}
// The dark house, its galleries just touched by the footlights.
vec3 wmBoxes(vec3 ro, vec3 rd) {
 float t=(-3.2 - ro.z)/min(rd.z, -.02); vec3 q=ro+rd*t; float y=q.y/.75, e=fract(y);
 float rail=wmS(.0, .1, e)*wmF(.3, .42, e), x=abs(fract(q.x*.8) - .5);
 vec3 pale=wmCard*wmBone*(.16+.06*rail*wmS(.05, .12, x))*(1. - .9*wmDark)*exp(-.12*max(q.y, 0.)); return pale+(vec3(.012, .007, .004)*rail*wmS(.05, .12, x)*.6+.002)*wmWarmC*wmLamp(.5)*exp(-abs(q.x - 1.)*.25 - max(q.y, 0.)*.35);
}
// The boards of the stage.
vec3 wmFloor(vec3 ro, vec3 rd) {
 float t=-ro.y/min(rd.y, -1e-3); vec3 q=ro+rd*t;
 float bo=q.x/.12, e=abs(fract(bo) - .5), k=wmF(.1, .4, t*wmPx*(1. - rd.x/min(rd.y, -.02))*8.);
 vec3 c=vec3(.13, .085, .05)*mix(.8, (.6+.5*hash21(vec2(floor(bo), 3.)))*(.8+.4*noise(vec2(q.x*60., q.z*4.)))*(1. - .6*wmS(.44, .5, e)), k);
 if (wmCard > 0.) c=mix(c, wmBone*.6*(.8+.2*wmS(.5, .44, e)), wmCard);
 vec3 f=c*wmWarmC*wmLamp(q.x)*1.6/(.2+3.*max(q.z, 0.))*wmF(.0, 1.2, q.z)*wmS(-.05, .0, q.z);
 if (wmDay+wmDark+wmCard > 0.) f+=c*(wmDay*.45*uKind[1]+wmDark*wmPool(q)*.4+wmCard*.4*(1. - .9*wmDark))*wmS(-.05, .05, q.z);
 return wmFog > 0. ? mix(f, wmMist(f, q, t), .55) : f;
}
// Three pairs of wing flats, painted as rock: the nearest along the ray, how much of it is here and how far off.
vec4 wmWing(vec3 ro, vec3 rd, float far, bool b, out float tw) {
 float rz=abs(rd.z) < 1e-4 ? 1e-4 : rd.z, a=0., d=1., z=1., y=0., x=0.; tw=1e5;
 for (int k=0; k < (b ? 2 : 3); k++) {
  float zk=2.24 - .88*float(k), t=(zk - ro.z)/rz; vec3 q=ro+rd*t; if (t <= 0. || t > far || q.y < -.02 || b && q.x < 0.) continue;
  float s=sign(q.x), cut=1.37+1.1*wmBare - .11*float(k)+.13*abs(fract(q.y*1.3+zk*1.7+s*.2) - .5)+.07*abs(fract(q.y*3.1 - zk+s*.3) - .5) - .1*wmF(0., .55, q.y)+.1*wmS(.8, 1.8, q.y), e=abs(q.x) - cut, n=wmS(-t*wmPx, t*wmPx, min(e, q.y*2.));
  if (n > .5 || n > a) { d=e; z=zk; tw=t; y=q.y; x=q.x; }
  a=max(a, n);
 }
 if (a <= 0.) return vec4(0.);
 float w=noise(vec2(d*5., y*4.+z*3.)), st=noise(vec2(d*11.+y*3., y*26.)), fa=abs(fract(y*1.5 - d*2.2+w*.8+z) - .5)+.7*abs(fract(y*2.3+d*3.1 - w*.6) - .5);
 vec3 al=mix(vec3(.03, .035, .042), vec3(.20, .19, .17), mix(.35, sat(wmS(.1, .65, fa)*(.6+.6*st)), wmS(.1, .5, abs(rd.z)))); al=mix(al, wmBone*.6, wmF(.004, .022, d)*.6);
 if (wmCard > 0.) al=mix(al, wmBone*.7, wmCard);
 float o=b ? exp(-(y - 1.)*(y - 1.)*2. - d) : 0.;
 return vec4(al*(wmWarmC*.36*wmLamp(x)/(.5+1.2*y+.8*z)*exp(-max(d, 0.)*1.6)+wmColdC*(.045+.2*o+.25*wmDark)+wmDay*.22*uKind[1]+wmCard*.45*(1. - .9*wmDark)), a);
}
// The two lights on timber.
vec3 wmRake(vec3 q, vec3 n) {
 vec3 v=vec3(.6, .05 - q.y, -.02 - q.z); float d=length(v);
 return wmWarmC*wmLamp(q.x)*sat(dot(n, v)/d*.8+.2)*.9/(.6+d*d*.5)+wmColdC*.24*sat(dot(n, vec3(-.5, .8, .2)))+wmWarmC*.5*sat(dot(n, normalize(vec3(-1., .5, -.5)))+.1)/(.6+dot(q.yz - vec2(.6, .7), q.yz - vec2(.6, .7))*1.5)+vec3(.006, .008, .011);
}
// The sawn end of roller i: boards, iron hub, the canvas turned over its rim.
vec3 wmEnd(vec3 q, int i) {
 vec2 o=vec2(q.z - wmZ[i], q.y - wmY[i]), u=wmTurn(i, -wmL), k=vec2(dot(o, u), o.y*u.x - o.x*u.y); float si=float(i), l=length(o), in_=-wmD3(q, i);
 float g=noise(vec2(k.x*14., k.y*150.)), e=abs(fract(k.y/.07) - .5)*.07;
 vec3 c=vec3(.20, .125, .07)*(.55+.7*g)*(.8+.3*hash21(vec2(floor(k.y/.07), si)))*wmS(.0, .004, .035 - e+.001);
 if (wmCard > 0.) c=mix(c, wmBone*.4*(.8+.4*g), wmCard);
 c=mix(c, wmBone*.5, wmF(.012, .016, in_)); c*=wmS(0., .006, abs(in_ - .016))*.6+.4;
 c=mix(c, vec3(.03), wmF(.047, .05, l)); c*=.55+.45*wmS(.05, .12, l);
 return c*1.4;
}
// A sheared box of timber, for the bench the rollers lie on: where a ray meets it and leaves it.
bool wmBox(vec3 o, vec3 d, vec3 h, out vec3 n, out vec2 t) {
 vec3 m=1./(d+vec3(1e-5)), k=abs(m)*h, a=-m*o - k, e=-m*o+k;
 t=vec2(max(max(a.x, a.y), a.z), min(min(e.x, e.y), e.z)); n=-sign(d)*step(a.yzx, a)*step(a.zxy, a);
 return t.y > max(t.x, 0.);
}
// A round bar from a, along v: where it is the nearest, its tint and how much of it is here, its face, its place.
void wmBar(inout vec4 tint, inout vec3 n, inout float best, vec3 ro, vec3 rd, vec3 a, vec3 v, float r, vec3 col) {
 vec3 w=ro - a; float B=dot(rd, v), C=dot(v, v), D=dot(rd, w), E=dot(v, w), k=sat((E - B*D)/max(C - B*B, 1e-6));
 vec3 q=a+v*k; float t=dot(q - ro, rd); vec3 o=ro+rd*t - q; float d=length(o), al=wmF(r - t*wmPx, r+t*wmPx, d);
 if (t > best || al <= (tint.a > .5 ? .5 : 0.)) return;
 n=o/r - rd*sqrt(max(1. - d*d/(r*r), 0.)); tint=vec4(col, al); if (al > .5) best=t;
}
// The bench, the cranks and their handles.
void wmCarpentry(inout vec3 c, float best, vec3 ro, vec3 rd, int id) {
 float sl=wmSl; vec3 n, N=vec3(-1., 0., 0.), T=vec3(0.), w=ro+rd*((-wmL - .17 - ro.x)/max(rd.x, .05)); vec2 t; float by=w.y - wmY[0] - (w.z - wmZ[0])*sl, al=0., hit=-1., A=0.; vec4 bar=vec4(0.);
 if (by > .5) return;
 if (id >= 0) { T=wmEnd(ro+rd*best, id); A=1.; }
 for (int j=by < .1 ? 0 : 4; j < 4; j++) {
  bool rail=j == 0; float z=rail ? 1.2 : .62*float(j);
  vec3 o=ro - vec3(-wmL - .11, wmY[0]+(z - wmZ[0])*sl - (rail ? 0. : .5), z), d=rd; if (rail) { o.y -= o.z*sl; d.y -= d.z*sl; }
  if (wmBox(o, d, rail ? vec3(.035, .04, 1.15) : vec3(.03, .46, .035), n, t) && t.x < best && t.x > 0.) { best=t.x; N=n; al=sat((t.y - t.x)/(t.x*wmPx*2.5)); hit=float(j); }
 }
 if (al > 0.) { vec3 q=ro+rd*best; vec2 g=hit < .5 ? vec2(q.z*5., (q.y - q.z*sl)*90.+q.x*70.) : vec2(q.y*5., q.z*90.+q.x*70.); T=mix(T, vec3(.15, .095, .055)*(.5+.8*noise(g)), max(al, step(A, 0.))); A=max(A, al); }
 for (int i=abs(by) < .3 ? 4 : -1; i >= 0; i--) if (abs(w.z - wmZ[i]) < .26) {
  vec2 u=wmTurn(i, -wmL)*.12; vec3 h=vec3(-wmL - .17, wmY[i], wmZ[i]), e=h+vec3(0., u.y, u.x);
  wmBar(bar, N, best, ro, rd, h+vec3(.12, 0., 0.), vec3(-.16, 0., 0.), .026, vec3(.05, .05, .055));
  wmBar(bar, N, best, ro, rd, h, e - h, .016, vec3(.06, .06, .065));
  wmBar(bar, N, best, ro, rd, e, vec3(-.17, 0., 0.), .019, mix(vec3(.30, .17, .08), wmTint[i]*.4, .3+.4*wmLv[i]));
 }
 if (bar.a > 0.) { T=mix(T, bar.rgb, max(bar.a, step(A, 0.))); A=max(A, bar.a); }
 if (A > 0.) c=mix(c, T*wmRake(ro+rd*best, N), A);
}
// The eye, then the whole stage along a ray.
vec3 wmStage(vec3 ro, vec3 rd, bool b) {
 float best=1e5, missT=1e5, miss=1., end=0.; int id=-1, mid=-1;
 for (int i=0; i < 5; i++) {
  vec3 h=wmHit(ro, rd, i, uOwn[3] != 0. ? 26 : b ? 16 : 10, best);
  if (h.y <= 0.) { if (h.x < best) { best=h.x; id=i; end=h.z; } if (!b) break; }
  else if (h.y < 1. && h.x < best) { missT=h.x; miss=h.y; mid=i; }
 }
 vec3 c=vec3(0.), cs[2]; bool edge=mid >= 0 && missT < best;
 for (int j=id >= 0 ? 0 : 1; j < (edge ? 2 : 1); j++) { float t=j == 0 ? best : missT; cs[j]=wmCanvas(ro+rd*t, j == 0 ? id : mid, t, rd); }
 if (id >= 0) c=cs[0];
 if (id < 0) {
  float tf=rd.y < -1e-3 ? -ro.y/rd.y : 1e4, zf=ro.z+rd.z*tf; bool house=b && rd.z < 0. && (zf < -.05 || tf > 9e3), fl=!house && tf < 9e3 && zf < 2.;
  if (house) c=wmBoxes(ro, rd);
  if (fl) c=wmFloor(ro, rd);
  if (!house && !fl && rd.z > .02) c=wmBack(ro, rd);
  best=1e4;
 }
 float tw; vec4 wing=wmWing(ro, rd, best, b, tw);
 if (edge && missT > tw) c=mix(cs[1], c, miss);
 c=mix(c, wing.rgb, wing.a);
 if (edge && missT <= tw) c=mix(cs[1], c, miss);
 if (b) wmCarpentry(c, best, ro, rd, end > .5 ? id : -1);
 return c;
}
// The front of the house: arch, lip and the shades of the footlights, seen from the stalls.
float wmArch(vec2 p) {
 float sp=.2; vec2 q=vec2(abs(p.x), p.y); float d=q.y < sp ? q.x - .735 : 0.; if (q.y >= sp) { vec2 e=vec2(q.x, q.y - sp), ab=vec2(.735, .225); float k=length(e/ab); d=(k - 1.)*k/max(length(e/(ab*ab)), .01); }
 return d;
}
float wmPp=1.; // how large the arch is drawn
vec3 wmHouse(vec3 c, vec2 p, float d) {
 float px=1.5/uRes.y*wmPp; vec2 q=vec2(abs(p.x), p.y);
 float lo=sat(wmLamp(p.x*1.2)), fall=exp(-(p.y+.34)*4.2);
 float mo=.5+.5*cos(d*190.)*wmF(.0, .075, d) , g=noise(p*vec2(9., 60.));
 vec3 wood=vec3(.10, .062, .036)*(.7+.5*g)*mix(.35, 1., mo); if (wmCard > 0.) wood=mix(wood, wmBone*.55*mix(.7, 1., mo), wmCard);
 vec3 h=wood*(wmWarmC*lo*fall*exp(-max(d, 0.)*9.)*.8+vec3(.012, .011, .012)+wmCard*vec3(.62, .63, .65)*(1. - .9*wmDark)*exp(-max(d, 0.)*.7));
 h+=vec3(.5, .34, .16)*wmWarmC*lo*fall*wmF(0., px*2.+.003, abs(d - .004))*.35;
 float be=(q.y > .2 ? q.x : q.y+.1)*50., bl=length(vec2(abs(fract(be) - .5)*.02, d - .026));
 h+=vec3(.5, .34, .16)*wmWarmC*lo*fall*wmF(.002, .008, bl)*(.12+.88*wmF(-.004, .004, d - .026))*.3;
 c=mix(c, h, wmS(-px, px, d));
 // the cold lamp's beam in the dust
 vec2 w=p - vec2(-.95, .5); float r0=length(w), bm=exp(-pow(abs(dot(w, vec2(.5, .866)))/(.04+.13*r0), 2.))*wmF(.2, 1.5, r0);
 c+=wmColdC*bm*.022*(.5+uMid+uCue)*wmF(-px, px, d);
 // the lip and the board below it
 float y=p.y+.345;
 vec3 bd=vec3(.085, .054, .034)*(.6+.6*noise(vec2(p.x*5., p.y*90.)))*(.02+.1*exp(y*12.))*wmWarmC;
 if (wmCard > 0.) bd+=wmCard*wmBone*.22*(1. - .9*wmDark);
 bd+=vec3(.3, .18, .08)*lo*wmF(0., .004+px, abs(y+.004) - .0015)*.25*wmF(.6, .78, q.x);
 c=mix(c, bd, wmF(-px, px, y));
 // the tin shades
 float k=p.x/.0875, j=clamp(floor(k+.5), -8., 8.); vec2 s=vec2(p.x - j*.0875, y); float L=wmLamp(j*.0875*1.6);
 float r=length(s*vec2(1., 1.1));
 c+=wmWarmC*L*.16*exp(-r*r*700.)*vec3(1., .9, .8)+wmWarmC*L*.02*exp(-y*y*90.)*wmF(.5, .9, q.x);
 if (abs(y) > .05) return c;
 float rib=.5+.5*cos(s.x*760.);
 float sh=wmF(-px, px, max(r - .027 - .0014*rib, -s.y));
 c=mix(c, vec3(.035, .026, .02)*(.25+.75*rib)*(.4+L*.6)+wmWarmC*L*.55*wmF(0., .0065, abs(r - .0265)) , sh);
 return c;
}
// The row of footlights seen from its own end, and the ropes near the eye.
vec3 wmRow(vec3 c, vec2 p, vec3 ro, vec2 vp) {
 float La=wmLamp(0.);
 for (int j=p.x > .2 ? 9 : -1; j >= 0; j--) {
  vec3 l=vec3(-1.1+.25*float(j), .09, -.03) - ro; float s=wmFoc/l.x; vec2 o=(p - vp - vec2(-l.z, l.y)*s)/s; float px=1.2*wmPx*wmFoc/s, d2=dot(o, o);
  c+=wmWarmC*La*wmS(.2, .42, p.x)*.0009/(.02+d2*8.);
  if (d2 < .04) {
  float L=wmLamp(l.x+ro.x);
  vec2 f=o*vec2(1., .55); float sh=length(o*vec2(1.15, .9) - vec2(.045, -.01)) - .062;
  c=mix(c, vec3(.006, .005, .004)+wmWarmC*L*.3*wmS(-.08, .06, -o.x)*(.7+.3*cos(o.y*170.)) , wmF(-px, px, max(sh, -.015 - o.x)));
  c=mix(c, vec3(1.6, 1.25, .75)*L, wmF(.006, .016+px, length(f*.85)));
  }
 }
 float px=1./uRes.y;
 for (int j=p.x < -.5 ? 0 : 3; j < 3; j++) {
  float f=float(j), x=p.x+.80 - .055*f - .012*f*f+.01*p.y*(f - 1.)+.0015*sin(uTime*.3+f), r=.009 - .0015*f, k=x/r, tw=.5+.5*sin((p.y*260.+k*1.6) );
  vec3 rp=vec3(.16, .12, .075)*(.3+.7*tw)*(wmWarmC*.25*sat(k*.7+.3)*exp(-max(p.y+.3, 0.)*2.)+wmColdC*.05*sat(.4 - k));
  c=mix(c, rp, wmF(r - px, r+px, abs(x)));
 }
 return c;
}
// Torn paper let fall from above.
vec3 wmSnow(vec2 p) {
 vec3 c=vec3(0.);
 for (int j=0; j < 4; j++) {
  float f=float(j), z=7.+4.5*f; vec2 g=p*z+vec2(f*3.7+.35*sin(uTime*.23+f), uTime*(.5+.09*f)), id=floor(g); float h=hash21(id+f*17.);
  vec2 o=g - id - .5 - .5*(vec2(h, fract(h*57.3)) - .5) - .12*vec2(sin(uTime*(.6+h)+h*40.), 0.);
  float turn=.35+.65*abs(sin(uTime*(.5+.7*h)+h*60.)), r=.07+.06*fract(h*31.);
  o=rot(h*6.+uTime*.2*(h - .5))*o; o.y/=turn;
  c+=wmF(r - z/uRes.y, r+z/uRes.y, max(abs(o.x), abs(o.y)))*step(fract(h*91.), uOwn[7]*.5)*(.25+.75*turn)*mix(1., .55, f/3.)*(wmWarmC*wmLamp(p.x*1.6)*.5*exp(-(p.y+.35)*2.2)+wmColdC*(.22+.3*uMid+.3*wmDark)+wmDay*.45+.3*uKeys);
 }
 return c;
}
vec3 render(vec2 p) {
 float lv[5]=float[5](4.*uHits*(1. - uHits), uPhrase, uTexture, uPad, uDrone);
 float pit[5]=float[5](.66, -.74, .6, -.68, .58), sp[5]=float[5](.073, -.057, .083, -.049, .038);
 bool b=uVar > .5;
 float in_=max(uOwn[0], 0.), up=max(-uOwn[0], 0.), twist=exp2(uOwn[1]*(uOwn[1] > 0. ? .95 : 1.25)), deep=exp2(-.5*max(uOwn[1], 0.)+.3*max(-uOwn[1], 0.)+.4*max(-uOwn[3], 0.));
 wmR=.125*exp2(uOwn[1]*(uOwn[1] > 0. ? -.8 : -.5)); wmSl=(.125+uOwn[2]*(uOwn[2] > 0. ? .13 : .115))/.42;
 wmDye=max(uOwn[4], 0.); wmCard=max(-uOwn[4], 0.); wmDay=max(uOwn[5], 0.); wmDark=max(-uOwn[5], 0.); wmBare=max(uOwn[6], 0.); wmLow=max(-uOwn[6], 0.); wmFog=max(-uOwn[7], 0.);
 wmGlow=1. - .65*wmDay - .88*wmDark;
 wmPx=1./uRes.y;
 for (int i=0; i < 5; i++) {
  float f=float(i);
  wmLv[i]=i == 0 ? uHits : lv[i];
  wmTint[i]=uKind[4 - i];
  wmZ[i]=.36+.42*f; wmK[i]=1./pit[i]*twist;
  wmY[i]=.17+(uOwn[2] == 0. ? .125 : wmSl*.42)*f+.05*uLow;
  wmD[i]=.058+(i == 0 ? .034*lv[0] : lv[i]*(.06+.032*lv[i]*lv[i]*lv[i]));
  wmD[i]*=deep;
  wmPh[i]=fract(uTravel*sp[i])+.008*sin(uTime*.21+f)+f*.334;
 }
 vec3 ro, rd; vec2 vp=vec2(.35, .24);
 if (!b) { wmL=2.2; wmFoc=1.5; ro=vec3(0., .55, -2.4); rd=normalize(vec3(p.x, p.y, wmFoc)); }
 else { wmL=1.35; wmFoc=1.2; ro=vec3(-3.3, 1.25, .5); rd=normalize(vec3(wmFoc, p.y - vp.y, vp.x - p.x)); }
 wmPx /= wmFoc;
 vec2 pp=p;
 if (uOwn[0] != 0.) {
  if (!b) {
   ro+=in_*vec3(0., .06, 1.55)+up*vec3(0., 1.4, -.1); rd=normalize(vec3(p.x, p.y+.04*in_ - .9*up, wmFoc));
   pp=.625*(ro.xy - rd.xy*ro.z/rd.z - vec2(0., .55)); wmPp=-ro.z/2.4;
  } else {
   vp+=in_*vec2(.1, -.1)+up*vec2(-.2, .55); ro+=in_*vec3(1., -.4, .25)+up*vec3(.5, 1.5, .5); rd=normalize(vec3(wmFoc, p.y - vp.y, vp.x - p.x));
  }
 }
 float d=b ? -1. : wmArch(pp);
 vec3 c=vec3(0.);
 if (d < .01 && (b || pp.y > -.36)) c=wmStage(ro, rd, b);
 if (b) c=wmRow(c, p, ro, vp);
 if (!b) c=wmHouse(c, pp, d);
 if (uOwn[7] > 0.) c+=wmSnow(p)*(b ? 1. : wmF(-.004, .004, d)*wmS(-.36, -.3, pp.y));
 return screenOf(c*1.9);
}
