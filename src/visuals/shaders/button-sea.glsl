// name: Button sea
// a: Sewn night
// b: Spilled tin
// what: A night sea sewn on blue felt: rows of shell, horn, glass and bone buttons, small at the horizon and large at the hem, under a chipped shell moon ringed with stitches, with a felt boat; or a tin tipped over on a worn white table by a window, its buttons spilled toward you, some on edge and one rolling.
// follows: Each band rocks its own row and lifts its light, low the swell; each kind of sound colours one family of buttons, and the piece lays shine where its strokes are. A hit is a ring of buttons that knock, a cue a wave from the horizon to the hem, or a button rolled through. Travel sails the boat and rolls the one on edge. Keys light the moon, or the tin.
// own: 0 dawn on pale felt at -1, dusk on wine red felt at 1 (b: lamplight on a dark table, a table painted green); 1 all bleached bone at -1, dyed in many colours at 1; 2 a few great buttons at -1, a crowd of tiny ones at 1; 3 a flat calm at -1, a dark high sea at 1 (b: a thin trail, or all over the table); 4 a low horizon and much sky at -1, all sea at 1 (b: seen from far, or close); 5 the lamp out and a large moon at -1, a low lamp at the right at 1 (b: an overcast day, a low warm sun with long shadows)
#define buN normalize
float buLn, buZb, buH, buA, buSz, buWide; // the rows' step, the boat's nearness, the horizon, the swell; how big things are, the fan
vec3 buL, buKey, buSky, buTint, buAlb, buAdd; // the light, where it is and what it adds
// The button seen here: where in it, its lean, its back, its numbers; a pixel's size; how much of it, of any; its light.
vec2 buQ, buT, buB; vec4 buHs; float buPx, buTop, buAll, buCf, buShd, buGain, buSewn, buMoon, buNear;
// A soft step from a to b, that may also fall (b under a).
float buS3(float a, float b, float x) { x=sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
float buBox(float x, float a, float b, float s) { return buS3(a - s, a+s, x)*buS3(b+s, b - s, x); }
float buIn(float d, float a) { return buS3(a, -a, d); }
float buBump(float x) { x=max(1. - x*x, .0); return x*x; }
// Felt: short wool fibres lying every way.
float buFelt(vec2 p) {
 return .72+.4*max(noise(rot(.5)*p*vec2(52., 250.)), noise(rot(-.7)*p*vec2(60., 230.)+9.)) - .2*noise(p*14.);
}
// The face of a button (its edge is at 1): five families, one for each kind of sound.
vec3 buFace() {
 vec2 q=buQ; vec4 h=buHs;
 float r=length(q), f=h.x, px=buPx, fine=buS3(.35, .08, px);
 vec2 e=q/max(r, .001), g=rot(h.z*6.28)*q;
 float rim=.66+.2*h.y, fall=buS3(.8, 1., r);
 float s=1.1*fall - .75*buS3(rim - .14, rim, r)*buS3(rim+.14, rim, r);
 float n1=mix(.5, noise(g*vec2(1.6, 7.)+h.xy*60.), fine);
 float lv=uHits, gloss=30., shine=.6; vec3 kc=uKind[4], alb=mix(vec3(.05, .09, .34), vec3(.42, .06, .045), max(uVar, .45*uHits));
 bool shell=f<.32, glass=f>.66 && f<.9;
 if (shell) { lv=uPad; kc=uKind[1]; alb=vec3(.6, .64, .62); shine=.9; gloss=46.; }
 else if (f<.52) { lv=uDrone; kc=uKind[0]; alb=mix(vec3(.07, .03, .014), vec3(.42, .2, .075), n1*n1*1.3); }
 else if (f<.66) { lv=uTexture; kc=uKind[2]; alb=vec3(.68, .58, .42)*(.72+.4*n1); shine=.22; gloss=14.; }
 else if (glass) { lv=uPhrase; kc=uKind[3]; s=.75*r*r+.5*fall; shine=1.5; gloss=90.; }
 kc/= max(max(kc.r, kc.g), max(kc.b, .05));
 vec3 N=buN(vec3(buT+e*s, 1.));
 if (shell) { // growth lines, and a sheen that slides as it leans
  float ph=dot(N.xy, vec2(1.1, 1.5))+.7*n1+.45*g.y+h.w+buMoon*1.3*noise(g*2.2+3.);
  alb=mix(alb, .46+.36*cos(TAU*(ph+vec3(.0, .22, .5))), .34)*(.86+.24*n1)*mix(vec3(1.), kc, .2+.35*lv);
 } else if (glass) alb=mix(vec3(.03, .17, .26), kc*kc*vec3(.3, .34, .42), .4+.3*lv);
 else alb=mix(alb, alb*kc*1.5, .15+.5*lv);
 alb=mix(alb, vec3(.74, .71, .65)*(.75+.3*n1), .85*max(-uOwn[1], .0));
 vec3 dye=.36*(.55+.45*cos(TAU*(h.y*3.+vec3(.0, .36, .67))))*(.8+.4*n1);
 buAlb=alb=mix(alb, dye, .8*max(uOwn[1], .0)*(1. - buMoon))*buTint;
 // the holes, and the thread that holds it down
 vec2 a=rot(h.w*6.28)*q, b=abs(a);
 bool two=h.z>.55;
 float hd=two?length(vec2(b.x - .2, a.y)) - .1:length(b - .16) - .085, D=dot(N, buL);
 vec3 c=alb*(buKey*(.25+.75*max(D, -.33))+buSky)*(1. - .3*fine*buS3(.07+px, .0, hd));
 if (glass) { float t=sat(.5 - .62*dot(q, buN(buL.xy+.001))); c=alb*(buKey*(.5+2.6*t*t*t*(1. - fall))+buSky); }
 c+=buKey*pow(sat(dot(N, buN(buL+vec3(.0, .0, 1.)))), gloss*(.6+.8*uTone))*shine*(.45+(.7+.5*uEnergy)*lv);
 c=mix(c*(buGain+.35*lv), alb*buSky*.12, buIn(hd, px)*fine);
 float th=fine*buSewn*(two?buIn(b.y - .065, px)*step(b.x, .2):buIn(abs(b.x - b.y)*.8 - .075, px)*step(r, .25));
 return mix(c, mix(vec3(.62, .58, .5), kc, .25)*(.75+.25*sin((a.x+a.y)*70.))*(buKey*.7+buSky), th);
}
// Is a button seen here? d from its middle, leaning by T; E is where its back lies. Those on top are asked first.
bool buTry(vec2 d, float R, vec2 T, vec2 E, float aa, float sh) {
 float m=sqrt(1.+dot(T, T))+1., px=aa/R;
 vec2 q=(d+T*dot(T, d)/m)/R, b=d+E*R;
 b=(b+T*dot(T, b)/m)/R;
 vec2 u=q/max(length(q), .001);
 float pe=px*length(u+T*dot(T, u)/m), cf=buIn(length(q) - 1., pe), al=max(cf, buIn(length(b) - 1., pe))*sat(R/aa - .5);
 buAll+=al*(1. - buAll);
 if (al <= buTop || buTop >= .5) return false;
 buNear+=buTop;
 buTop=al; buQ=q; buB=b; buT=T; buPx=px; buCf=cf; buShd=sh;
 return true;
}
// A running stitch: d is the distance to its line, s the way along it.
float buStitch(float d, float s, float w, float aa) { return buIn(abs(d) - w, aa)*buIn(abs(fract(s) - .5) - .3, .06); }

// ---- the sewn sea
float buW(float x, float k) {
 x*= max(5.4 - .33*k, 1.6);
 return buA*(.62*sin(x+.8*k - uTime*.33)+.38*sin(x*1.9 - .45*k+uTime*.21+1.));
}
float buTri(vec2 p, vec2 a, vec2 b, vec2 c) {
 vec2 e=b - a, f=c - b, g=a - c;
 return max(max(dot(p - a, vec2(e.y, -e.x))/length(e), dot(p - b, vec2(f.y, -f.x))/length(f)), dot(p - c, vec2(g.y, -g.x))/length(g));
}
float buSails(vec2 l) {
 return min(buTri(l - vec2(.12*sin(PI*sat(l.y/2.3)), .0), vec2(1.02, .34), vec2(.06, 2.3), vec2(.06, .28)), buTri(l, vec2(-.05, .3), vec2(-.05, 1.75), vec2(-.82, .3)));
}
vec3 buSea(vec2 p, out vec4 boat) {
 float nar=clamp(uRes.x/uRes.y/1.7, .45, 1.), aa=.8/uRes.y, t=uTime, z0=.075;
 float dawn=max(-uOwn[0], .0), dusk=max(uOwn[0], .0), up=max(uOwn[4], .0), dn=max(-uOwn[4], .0);
 float alone=max(-uOwn[5], .0), rake=max(uOwn[5], .0), storm=max(uOwn[3], .0), calm=1. - max(-uOwn[3], .0);
 buH=.12+.5*up - .3*dn;
 buLn=.1457*exp2(-.75*uOwn[2]);
 buZb=.27+.25*up;
 buA=min(.28+.28*uLow*(.5+uEnergy)+.26*storm, .74)*(.1+.9*calm);
 // the lamp, upper left, that drifts over minutes
 vec2 toL=vec2(mix(-.72, .85, rake)+.12*sin(t*.031), mix(.72, .2, rake)+.05*sin(t*.023+1.)) - p;
 buL=buN(vec3(toL, .62 - .3*rake));
 vec3 warm=mix(mix(vec3(1., .8, .55), vec3(1., .86, .8), dawn), vec3(1., .5, .26), dusk);
 buKey=warm*(4.3+.5*uLevel+1.*dawn)*(1. - .75*alone)/(1.+dot(toL, toL)*(3.6 - 1.6*uSpace - .9*rake));
 buSky=mix(mix(vec3(.09, .15, .28), vec3(.5, .5, .56), dawn), vec3(.2, .08, .13), dusk)*(1.+.5*alone)*(1. - .3*storm);
 buTint=mix(mix(vec3(.52, .75, 1.04), vec3(.96), dawn), vec3(1., .7, .66), dusk);
 vec2 mo=vec2(-.25*nar, .31+.55*up - .03*dn); float MR=.12+.05*dn+.05*alone;
 vec4 pc=piece(vec2(p.x/(1.76*nar)+.5, sat((buH - p.y)/(buH+.5))));
 // the boat: a hull, a mast and two sails of felt
 float bx=(.27+.16*sin(uTravel*.021+.6))*nar, S=(.052+.19*buZb)*(.55+.45*nar);
 vec2 li=(.01+.015*uLow+.075*storm)*calm*sin(vec2(bx, p.x)*3.4+.6+t*.19); // the long swell, at the boat and here
 vec2 bo=vec2(bx, buH+z0 - buZb*exp(buLn*(buW(bx, .5)+.2))+.36*S - .7*li.x);
 mat2 heel=rot(.1+(.08+.2*buA)*sin(t*.33 - bx*5.+.7));
 vec2 l=heel*(p - bo)/S; float px=aa/S;
 float dh=max(max(l.y - .14*l.x*l.x, -.46 - l.y), abs(l.x) - 1.02 - .7*l.y) , ds=buSails(l) ;
 float dm=max(abs(l.x) - .028, abs(l.y - 1.18) - 1.24), jib=step(l.x, .0);
 float ch=buIn(dh, px), cs=buIn(ds, px);
 vec3 light=buKey*.75+buSky, pale=vec3(.75, .66, .47)*light;
 float wool=1.;
 if (max(ch, cs)>.0) wool=buFelt(l*.16+3.);
 boat=vec4(vec3(.16, .08, .04)*light, max(max(ch, cs), buIn(dm, px)));
 vec3 sail=mix(vec3(.66, .6, .47), vec3(.5, .15, .08), jib)*wool*light*(1.+.5*uMic)*(.75+.25*buS3(.0, -.06, ds));
 boat.rgb=mix(boat.rgb, mix(sail, jib>.5?pale:vec3(.1, .12, .26)*light, buStitch(ds+.1, (l.x*.6+l.y)*5., .017, px)), cs);
 boat.rgb=mix(boat.rgb, mix(vec3(.42, .11, .06)*wool*light*(.75+.25*buS3(.0, -.08, dh)), pale, buStitch(dh+.09, l.x*6., .018, px)), ch);
 float sailSh=1. - .5*buS3(.12, -.12, buSails(l - heel*vec2(.03, -.025)/S));
 // the rows: the nearest lie over those behind
 float sh=1., py=p.y+li.y*sat((buH - p.y)*3.3), z=max(buH+z0 - py, .02), hid=.0, span=log((buH+z0+.5)/z0);
 float r0=log(z/buZb)/buLn+.5, kn=floor(r0 - buW(p.x, r0 - buW(p.x, r0))+.5);
 vec2 hp=vec2(.12+.2*sin(t*.07), -.16+.08*sin(t*.053)), side=vec2(.4*rake - .2, .05);
 for (int j=1; j >= -1; j--) {
  float k=kn+float(j), zk=buZb*exp(buLn*(k - .5)), w=1.39*buLn*zk, hk=hash11(k+61.);
  float u=p.x/w+hk*7.+.5*mod(k, 2.)+.18*sin(t*.09+k*1.7), i0=floor(u - .5);
  float dep=log(zk/z0)/span, bd=band(1. - dep), cw=buBump((dep - 1.1*(1. - uCue))/.2);
  float amp=(.13+.5*bd*(.4+uEnergy))*(.15+.85*calm)+.18*storm;
  for (int i=0; i<2; i++) {
   vec2 id=vec2(i0+float(i), k+40.), h1=hash22(id*1.37+3.1);
   vec4 h=vec4(h1, fract(h1.yx*vec2(61.7, 83.3)));
   float xc=p.x+(id.x+.5+(h.y - .5)*.14 - u)*w, wv=buW(xc, k), zc=zk*exp(buLn*(wv+(h.z - .5)*.12));
   float R=.81*buLn*zc*(.8+.3*h.w)*buS3(z0*.8, z0*1.2, zc)+1e-5;
   vec2 c=vec2(xc, buH+z0 - zc), d=vec2(p.x, py) - c;
   // how it leans: the row's rocking, the ring of a hit, the wave of a cue
   float ph=xc*.8*max(5.4 - .33*k, 1.6)+1.15*k - t*.42;
   float ring=buBump((length((c - hp)*vec2(1., 1.6)) - .5*(1. - uHits))/.1);
   vec2 T=vec2(.5*cos(ph), sin(ph))*amp+(h.xw - .5)*.3*calm+vec2(.2, .5)*ring*4.*uHits*(1. - uHits);
   T.y+=3.2*cw*uCue*(1. - uCue);
   T*= min(1., .7/max(length(T), .01));
   float m=sqrt(1.+dot(T, T)), under=k<.5?sailSh:1.;
   if (buTry(d, R, T, T/m*.22+vec2(.0, .1), aa, sh*under)) {
    float crest=sat(.5+.6*wv/max(buA, .1)*(.3+.7*calm)), glint=.0;
    h.x=fract(.5*h.x+.13*k+.3*sin(.5*id.x+.9*k)+.2); buHs=h;
    buGain=.3 - .1*calm - .12*storm+(1.+.6*storm)*crest*crest+.6*pc.a*(.4+uEnergy)+.6*bd*crest*uEnergy+1.3*ring*uHits+1.6*cw*uCue;
    glint=buBump((c.x - mo.x)/(.16+.6*z))*(.4+.6*alone+.4*uPad)*buS3(.05, .4, .2 - .2*calm+dot(T, vec2(.2, .9))+.25*h.z);
    buAdd=pc.rgb*.5+vec3(.75, .9, 1.15)*glint*(4. - dawn - calm);
   }
   vec2 o=d+side*R;
   sh*= 1. - .62*buS3(1.35, .9, length(o+T*dot(T, o)/(m+1.))/R);
  }
  if (k>.5) hid=buAll;
 }
 boat.a*= 1. - hid;
 // the moon, one chipped shell button
 vec2 d=p - mo, g=d/MR; float q=length(g);
 float chip=min(length(g - vec2(.86, -.62)) - .2, length(g - vec2(.98, -.36)) - .13)+.03*noise(g*14.);
 float sea=buAll;
 if (q<1.1 && chip>.0 && buTry(d, MR, vec2(.14*sin(t*.05), .12*cos(t*.04)), vec2(.0), aa, 1.)) {
  buMoon=1.; buHs=vec4(.1, .55, .2, .13); buGain=(.85+.2*uKeys)*(1.+.35*buS3(.1, .0, chip)); buTint=vec3(1.);
  buShd=1.; buAdd=vec3(.3, .33, .38);
 }
 if (sea<.01 && q<1.1) buAll*= buS3(.0, 2.*aa/MR, chip);
 sh*= 1. - .5*buS3(1.2, .85, length(d - vec2(.02, -.018))/MR);
 if (buAll>.999) return vec3(.0);
 if (max(ch, cs) <= .0) wool=buFelt(p);
 // the felt of the sky, two felt clouds and the stitches
 vec3 felt=mix(mix(vec3(.03, .055, .15), vec3(.5, .42, .42), dawn), vec3(.13, .026, .045), dusk);
 float st=.0;
 for (int i=0; i<2; i++) {
  float fi=float(i);
  vec2 a=p - vec2(mix(.62, -.66, fi)*nar+.012*sin(t*.04), buH+mix(.27, .13, fi));
  a.x*= 1. - 2.*fi;
  float dd=max(min(min(length(a) - .06, length(a - vec2(.072, -.014)) - .045), length(a+vec2(.078, .016)) - .04), -.03 - a.y), inC=buIn(dd, aa);
  felt=mix(felt*(1. - .4*buS3(.012, .0, dd)), felt*1.75+.012, inC);
  st=max(st, .6*buStitch(dd+.011, (a.x+a.y*.5)*34., .0017, aa));
 }
 float ri=clamp(floor((q - 1.)/.36+.5), 1., 3.);
 st=max(st, buStitch((q - 1. - .36*ri)*MR, atan(d.y, d.x+1e-5)/TAU*floor(16.+9.*ri), .0017, aa)*(.75 - .17*ri+.4*uPad+.5*uKeys));
 vec2 sg=p/.115, sr=hash22(floor(sg)+4.), so=rot(sr.x*3.)*((fract(sg) - .5)*.115 - (sr - .5)*.06);
 st=max(st, buIn(min(abs(so.x), abs(so.y)) - .0017, aa)*buS3(.012, .009, length(so)+.005*sr.y)*step(.62, sr.y)*buS3(2.3, 2.6, q)*(.35+.4*sr.x+.8*uHigh));
 st*= sat((p.y - buH)*90.+1.);
 light=buKey*1.05+buSky*1.1;
 vec3 c=mix(felt*wool*light*(.6+.4*buL.z), mix(vec3(.56, .53, .44), vec3(.24, .16, .24), dawn)*light, sat(st));
 return c*(1. - .5*buS3(.06, .0, p.y - buH))*mix(.25, 1., buS3(z0*1.2, z0, z))*sh*sailSh;
}

// ---- the spilled tin
const vec2 BUM=vec2(.2, .2); // the tin's mouth on the table
float buFan(vec2 w) {
 vec2 v=w - BUM, e=vec2(-.6, -.8); float a=dot(v, e), b=dot(v, vec2(e.y, -e.x))+.12*a*a, up=max(a, .0), wide=(.17+.42*up)*buWide;
 return (1.75*exp(-up*(1.25 - .7*uOwn[3]) - b*b/(wide*wide))+.12*max(uOwn[3], .0))*buS3(-.16, -.04, a);
}
// The loose button of one layer of the heap that may lie here: its radius, where it is from w, its numbers.
float buPile(vec2 w, float j, out vec2 d, out vec4 h) {
 mat2 M=rot(.3+.9*j); float cell=.15*buSz;
 vec2 id=floor(M*w/cell), g=hash22(id+17.*j+5.); h=vec4(g, fract(g.yx*vec2(61.7, 83.3)));
 vec2 c=(id+.5+(h.zw - .5)*.18)*cell*M;
 d=w - c;
 return cell*(.24+.11*h.w)*buS3(.012, .026, buFan(c) - .2*(3. - j) - .02 - .5*h.y*h.y)+1e-5;
}
vec3 buTin(vec2 p) {
 float nar=clamp(uRes.x/uRes.y/1.7, .5, 1.), t=uTime, zoom=exp2(-.75*uOwn[4])*mix(1.25, 1., nar);
 p=p*zoom+vec2(-.02, -.05)*(1. - zoom)+vec2(.14 - .14*nar, .0);
 float eve=max(-uOwn[0], .0), green=max(uOwn[0], .0), dull=max(-uOwn[5], .0), low=max(uOwn[5], .0), aa0=.8*zoom/uRes.y;
 buSz=exp2(-.8*uOwn[2]); buWide=exp2(1.1*uOwn[3]);
 float D=1.9/(1.9 - p.y); vec2 w=vec2(p.x*D, (D - 1.)*2.93); float aa=1.25*aa0*D;
 vec2 S=vec2(.75, -.62)*(1.+1.6*low), s=vec2(.771, -.637);
 buL=buN(vec3(-.55, .5, .75 - .4*low));
 // the window lies on the table; by night a lamp does
 vec2 q=w - vec2(-.32+.1*sin(t*.021), .12), lp=w - vec2(-.3, .2); float so=.012+.03*(1. - uTone);
 q=vec2(dot(q, vec2(.94, .34)), dot(q, s)); q.x-=.1*q.y;
 float pane=buIn(abs(q.x) - .4 - .12*uSpace, so)*buBox(q.y, -.62, .95, so)*(1. - .8*max(buIn(abs(q.x) - .02, so), buIn(abs(abs(q.y - .16) - .27) - .02, so)));
 pane=mix(mix(pane, .35, dull), 1.6*exp(-2.2*dot(lp, lp)), eve);
 vec3 sun=mix(mix(vec3(2.1, 1.85, 1.45), vec3(1.5, .82, .36), eve), vec3(2.2, 1.1, .5), low)*(.9+.2*uLevel)*(1. - .35*dull);
 vec3 sky=mix(vec3(.22, .28, .4), vec3(.05, .06, .1), eve)*(1.+.5*dull);
 buKey=sun*(.1+.9*pane); buSky=sky;
 vec4 pc=piece(vec2(p.x/(1.76*nar)+.5, .5 - p.y));
 vec3 l0=buL, Lp=l0; float sh=1., go=fract(uTravel*.011+.35), qc=1. - uCue;
 // the ones on edge: three that stand, one that rolls with the travel, one that a cue sends through
 for (int i=0; i<5; i++) {
  float fi=float(i);
  vec2 B=i == 0?vec2(-.12, -.46):i == 1?vec2(.36, -.3):i == 2?vec2(-.5, -.12)
  :i == 3?vec2(.1 - 1.4*go, .02 - .5*go+.5*go*go):vec2(.08 - .5*qc - .2*qc*qc, .1 - 1.25*qc);
  float R=(.052+.012*hash11(fi+2.))*buSz*(i == 3?buS3(.0, .08, go)*buS3(1., .95, go):i == 4?buS3(.0, .12, qc)*buS3(.0, .06, uCue):1.)+1e-5;
  vec2 v=w - B, b=B/(1.+B.y/2.93); float k=1./(1.+B.y/2.93), len=1.7*R*length(S), x=dot(v, s)/len;
  b.y=1.9 - 1.9*k;
  vec2 T=vec2(i == 1?-1.5:1.35+.5*hash11(fi+9.), .2+.05*sin(t*.3+fi));
  if (buTry(p - b - vec2(.0, R*k*.9), R*k, T, T/sqrt(1.+dot(T, T))*.24, aa0, 1.)) {
   buHs=vec4(i == 0?.7:i == 1?.15:i == 2?.93:i == 3?.4:.8, .4, i>2?.2:.8, i == 3?go*3.:i == 4?qc*4.:.1);
   Lp=buN(vec3(.75*sign(T.x), .55, .6)); if (i == 4) buGain+=uCue;
  }
  sh*= 1. - .75*buS3(1.2, .75, length(vec2(x*2. - 1., dot(v, vec2(-s.y, s.x))/(R*(.45+.25*x)))))*(1. - .6*dull);
 }
 // the heap, four deep by the mouth and thin toward us
 vec2 hp=vec2(-.05+.15*sin(t*.06), -.12);
 for (int i=0; i<4; i++) {
  vec2 d, o; vec4 h, ho;
  float R=buPile(w, float(i), d, h), Ro=buPile(w - S*.034*buSz, float(i), o, ho);
  vec2 c=w - d; float away=length(c - BUM), bd=band(sat(1.1 - away)), ph=t*.5+6.*away+h.x;
  float ring=buBump((length(c - hp) - .55*(1. - uHits))/.14);
  vec2 T=(h.yx - .5)*(.25+.6*buS3(.9, .2, away))+(.02+.1*uLow+.18*bd*(.4+uEnergy))*vec2(sin(ph), cos(ph))+vec2(.3, .45)*ring*4.*uHits*(1. - uHits);
  if (buTry(d, R, T, vec2(.0, .2), aa, sh)) {
   buHs=h; Lp=l0; buGain=.92+.7*pc.a*(.4+uEnergy)+1.2*ring*uHits+.4*bd*uEnergy+2.*uCue*buBump((away - .1 - 1.1*qc)/.35);
   buAdd=pc.rgb*.35;
  }
  sh*= 1. - .7*buS3(1.12, .8, length(o)/Ro)*step(.002, Ro)*(1. - .5*dull);
 }
 buL=Lp;
 if (buAll>.999) return vec3(.0);
 // the table, its paint worn off along the grain
 q=rot(.16)*w; float k=floor(q.y/.31), f=abs(fract(q.y/.31) - .5)*.31;
 q.x+=k*3.7;
 float g0=noise(q*vec2(5., 90.)), n=noise(q*vec2(2.6, 9.)+k*7.)*.6+.4*noise(q*vec2(14., 70.));
 vec3 paint=mix(mix(vec3(.72, .7, .65), vec3(.1, .05, .028), eve), vec3(.2, .44, .38), green);
 vec3 c=mix(paint*(.87+.1*g0+.08*hash11(k+3.)), mix(vec3(.3, .17, .08), vec3(.05, .025, .012), eve)*(.55+.8*g0), buS3(.66, .72, n+.13*buS3(.1, .155, f)));
 c*= 1. - .75*buS3(.1505, .154, f);
 // loose threads
 for (int i=0; i<2; i++) {
  float fi=float(i);
  q=rot(.35+1.6*fi)*(w - (i == 0?vec2(-.42, -.16):vec2(.62, -.1)));
  float x=q.x*12.+fi*2.+.3*sin(t*.11+fi), y=q.y - .05*sin(x), on=buIn(abs(q.x) - .26, .004), m=1./sqrt(1.+.36*cos(x)*cos(x));
  sh*= 1. - .4*buS3(.008, .001, abs(y+.008)*m)*on;
  c=mix(c, mix(i == 0?vec3(.45, .04, .04):vec3(.5, .33, .05), uKind[i+1]*.6, .3)*(.8+.2*sin(q.x*500.)), buIn(abs(y)*m - .0026, aa)*on);
 }
 // the tin's shadow, its lid, and the tin on its side
 vec2 ax=vec2(.867, .498), tp=p - vec2(.27, .185), bp=tp - vec2(.06, -.07)*(1.+low), nx=vec2(-ax.y, ax.x);
 float u=dot(tp, ax), v=dot(tp, nx), Rt=.175, L=.36, arc=.42*sqrt(max(Rt*Rt - v*v, .0)), px=1.4*aa0;
 float ts=1. - .72*buS3(.14, .0, length(max(abs(vec2(dot(bp, ax) - L*.5, dot(bp, nx))) - vec2(L*.5 - .02, Rt - .06), .0)));
 vec2 lw=w - vec2(-.62, .36); float lr=length(lw)/.215, le=length(lw+vec2(.0, .03))/.215, la=aa/.215;
 ts*= 1. - .6*buS3(1.12, .92, length(lw - S*.035)/.215);
 c*= buKey*sh*ts+sky*(.4+.6*sh*ts)+pc.rgb*.06*uEnergy;
 vec3 teal=vec3(.05, .2, .22), cream=vec3(.75, .66, .46), red=vec3(.5, .08, .05);
 vec3 lid=mix(mix(cream, teal, buBox(lr, .62, .9, .008)), red, buIn(abs(lr - .5) - .026, .006))*(buKey*sh*(.75 - 1.9*(lw.y - lw.x)*buS3(.04, .0, abs(lr - .87)))+sky);
 c=mix(c, mix(vec3(.35, .3, .22)*(buKey*.3+sky*.7), lid, buIn(lr - 1., la)), max(buIn(lr - 1., la), buIn(le - 1., la)));
 float th=asin(clamp(v/Rt, -.999, .999)), uc=(u - arc)/L;
 vec3 tin=mix(teal, cream, buBox(uc, .2, .72, .006));
 tin=mix(tin, red, buS3(.3, .26, length(vec2((uc - .46)*3.4, fract(th*5.) - .5))));
 tin=mix(tin, vec3(.28, .24, .2), .8*buS3(.62, .7, n*.35+.65*noise(vec2(uc*40., th*26.))));
 tin*= buKey*sat(cos(th - .75))*.85+sun*.1+sky*(.5+.4*sin(th));
 tin+=sun*.5*pow(sat(cos(th - .55)), 40.)*(.3+.7*pane+uKeys);
 float e=length(vec2(u/.42, v)), hv=v/Rt, deep=sat((u/.42+Rt)/(2.*Rt));
 tin=mix(tin, vec3(.62, .58, .48)*(sky+sun*(.25+.7*buS3(-.5, 1., hv))), buIn(e - Rt, px));
 tin=mix(tin, vec3(.4, .36, .28)*(sky*.35+sun*.3*buS3(-.1, -1., hv))*(1. - .8*buS3(.1, .75, deep)*(1. - .5*buS3(.0, -1., hv))), buIn(e - Rt+.008, px));
 return mix(c, tin*(.3+.7*sh), buIn(abs(v) - Rt, px)*buIn(-arc - u, px)*buIn(u - L - arc, px));
}
vec3 render(vec2 p) {
 buTop=buAll=buNear=buMoon=buCf=.0; buPx=buShd=buGain=1.; buSewn=1. - uVar; buTint=vec3(1.); buAdd=vec3(.0);
 buQ=buT=buB=vec2(.0); buHs=vec4(.5);
 vec4 boat=vec4(.0);
 vec3 c=uVar<.5?buSea(p, boat):buTin(p);
 buKey*= buShd; buSky*= .3+.7*buShd;
 if (buMoon>.5) { buKey=buKey*.55+vec3(.5, .56, .62); buSky+=.12; buAdd=vec3(.0); }
 vec3 f=buFace()+buAlb*buAdd;
 f=mix(buAlb*(buKey*(.12+.5*sat(dot(buN(buB+.001), buL.xy)))+buSky*.6), f, buCf/max(buTop, .01));
 c=mix(c, mix(buAlb*buSky*.4, f, sat(buTop/max(buAll, .01))*(1. - sat(buNear))), buAll);
 return screenOf(mix(c, boat.rgb, boat.a));
}
