// name: Breath pane
// a: Misted
// b: Greenhouse
// what: A misted window, pale grey and wet, and behind it an evening garden: a house with lit windows, a lamp, a string of lights, one tree. Where sounds are the mist is wiped away in arcs, and drops run down in crooked clean tracks; or a steamed greenhouse pane with dark leaves pressed on it, sharp where they touch and lost behind.
// follows: The mist is wiped where the piece sounds and comes back as it fades. Drone lights the lamp, bands the string of lights or far spots, texture and keys add beads, the phrase draws a finger line with the loop; in the greenhouse each held kind presses its leaf. A hit is a round touch and one falling drop, a cue or a voice breathes mist, travel brings headlights.
// own: 0 the glass: 1 frost in feathers in place of mist, -1 ribbed glass; 1 the water: 1 covered in drops of every size, -1 dry; 2 the wiping: 1 dabbed by fingertips, dot by dot, -1 drawn straight down in bands; 3 the mist: 1 wiped away in outlines only, ring in ring, -1 none, all clear; 4 the window: 1 small panes between bars, -1 a round port; 5 the hour: 1 a pale snowy day (b: white light, leaves in the sounds' colours), -1 deep night; 6 outside: 1 a town of lit windows (b: a thicket of thin blades), -1 a lake under peaks (b: a few great leaves); 7 1 the water runs aslant as on a train and the town goes by, -1 the drops are few and huge, seen close
float bpPx,bpAsp,bpDay,bpNight,bpOpen,bpCity,bpIce;
float bpS(float a,float b,float x) { x=sat((x - a) / (b - a)); return x*x*(3. - 2.*x); }
float bpBell(float x) { return exp(-x*x); }
// Where the water stands on the glass, worked out once for a pixel.
float bpFog; // mist, 0 wiped clean to 1
float bpRim,bpDrop; // the wet edge of a wiped place; 1 inside a drop
vec2 bpBend; // how far the water shifts what is seen through it
float bpDark,bpGlint; // the dark rim of a drop, its light

vec2 bpUV(vec2 q) { return vec2(q.x / bpAsp+.5,.5 - q.y); }
// The wiping arm swings about an elbow under the sill.
vec2 bpArc(vec2 p) { vec2 e=p - vec2(.16,-1.6); float r=length(e); return vec2(atan(e.x,e.y)*1.6+.16,r - 1.6); }
// How wiped a place is by the sounds there.
float bpWiped(vec2 arc) {
 vec2 u=bpUV(arc),e=min(u,1. - u);
 return piece(clamp(u,.0,1.)).a*bpS(.0,.07,e.x)*bpS(-.12,.0,e.y);
}
// Lays one drop on the glass. v from its middle in its own radii, r its radius.
void bpLay(vec2 v,float r,float on) {
 float d=length(v),e=bpPx*1.2 / max(r,1e-4);
 float m=bpS(1.+e,1. - e,d)*on;
 bpFog *= 1. - m;
 bpRim *= 1. - m;
 bpBend=mix(bpBend,-v*(r*1.4+.13),m);
 bpDrop=max(bpDrop,m);
 float rim=bpS(.35,1.,d);
 bpDark=mix(bpDark,rim*rim*(.55+.45*v.y),m);
 bpGlint=mix(bpGlint,bpS(.34,.12,length(v - vec2(-.32,.42)))+.3*bpS(.5,.95,d)*bpS(.1,.9,-v.y),m);
}
// Standing beads in a grid.
void bpBeads(vec2 p,float scale,float seed,float grow,float share) {
 vec2 g=p*scale,id=floor(g),h=hash22(id+seed);
 float n=fract(h.x*91.7);
 float r=(.1+.3*n*n)*bpS(1. - share,1.15 - share,h.y)*grow;
 vec2 c=.5+(h - .5)*(1. - 2.*r)*.9;
 vec2 v=fract(g) - c; v.y *= .92;
 if (r > .02) bpLay(v / r,r / scale,bpS(.02,.08,r));
}
// A finger's line: where it goes, how fresh it is.
float bpFinger(float x) { return .205+.055*sin(x*10.+1.)+.026*sin(x*23.) - .05*x; }
float bpFresh(float x) { float u=x / bpAsp+.5,age=fract(uLoop - u); return uPhrase*exp(-age*3.5)*bpS(1.,.96,age)*bpS(.03,.1,u)*bpS(.97,.9,u); }
// How far a drop has run, in stops and starts.
float bpCreep(float x,float h) { float s=5.*x,i=floor(s),f=s - i; return sat((i+bpS(.15+.4*h,1.,f)) / 5.); }
// In each column a drop runs a crooked way down from a wet edge.
void bpRuns(vec2 p,float cell,float seed) {
 float g=p.x / cell+seed,id=floor(g);
 float h0=hash11(mod(id,512.)+seed*7.3);
 float beat=uTime / (26.+30.*h0)+h0*17.,turn=mod(floor(beat),256.),ph=beat - floor(beat);
 vec2 h=hash22(vec2(id,turn)+seed);
 float n=fract(h.x*57.3);
 float x0=(id+.5 - seed+(h.x - .5)*.4)*cell;
 float start=mix(.46,-.2,h.y);
 float wet=bpS(.1,.25,bpWiped(bpArc(vec2(x0,start))));
 float own=step(.73,n),fast=max(uOwn[7],.0),more=.5*max(uOwn[1],fast); // a few run in silence
 if (own > .5) start=mix(.53,.1,h.y*h.y);
 if (fast > .0) start=mix(start,1.1 - 1.6*h.y,fast);
 if (n < .22 && fast == .0) { start=bpFinger(x0) - .01; wet=bpS(.2,.5,bpFresh(x0)); }
 if (more > .0) own=max(own,bpS(.73 - more,.78 - more,n));
 float on=max(wet,own)*(1. - max(-uOwn[1],.0))*bpS(.0,.04,ph)*bpS(1.,.8,ph);
 if (on < .01) return;
 float wob=(noise(vec2(p.y*7.,id*3.7+turn)) - .5)*.3*cell+.028*cell*sin(p.y*43.+id*2.3+2.*sin(p.y*17.));
 float dx=p.x - x0 - wob,run=bpCreep(min(ph*1.3,1.),n)*(.28+.5*fract(n*13.))*(1.+fast)+.001;
 float down=start - p.y,w=cell*(.055+.05*fract(n*31.));
 float track=bpS(w+bpPx,w - bpPx,abs(dx)*(1.+.7*bpS(run*.6,.0,down)))*bpS(-.005,.02,down)*bpS(run+.002,run - .002,down);
 float edge=bpS(w*.4,w,abs(dx))*track;
 bpFog *= 1. - .92*track*on*(.5+.5*bpS(.0,run,down));
 bpRim=max(bpRim*(1. - track),edge*.7*on);
 bpBend.x += dx / w*.035*track*on;
 float r=w*1.75;
 vec2 v=vec2(dx,p.y - (start - run)) / r;
 v.y *= v.y > .0 ? .62 : 1.; v.x *= v.y > .0 ? 1.+.35*v.y : 1.;
 bpLay(v,r,on);
}
// The glass: the mist, what is wiped from it, and the water on it.
void bpGlass(vec2 p,float ghost) {
 bpRim=bpDrop=bpDark=bpGlint=.0; bpBend=vec2(.0);
 vec2 arc=bpArc(p),sw=arc;
 float down=max(-uOwn[2],.0),dab=max(uOwn[2],.0);
 if (down > .0) sw=mix(arc,p.yx,down);
 float cloud=noise(p*2.3+vec2(.1*sin(uTime*.05),3.))*.6+noise(p*6.1 - vec2(.2*sin(uTime*.03),.0))*.4;
 float streak=noise(vec2(sw.x*1.7,sw.y*24.))*.55+noise(vec2(sw.x*3.+3.,sw.y*85.))*.45;
 float w=bpWiped(arc+vec2(.45*arc.y+.05*sin(arc.y*15.+2.)+.012*sin(arc.y*37.)+.07*(streak - .5),.07*(cloud - .5)));
 float part=p.x / .13+40.;
 if (down > .0) w=mix(w,bpWiped(vec2((floor(part) - 39.5)*.13,p.y*.6 - .04+.22*hash11(floor(part)))),down);
 float f=w*(.45+.95*cloud)+(streak - .5)*.07+.03*uLevel;
 if (down > .0) f -= down*.5*bpS(.45,.5,abs(fract(part) - .5));
 if (dab > .0) {
  vec2 g=p*15.; float row=.5*mod(floor(g.y),2.); g.x += row;
  vec2 id=floor(g),at=.5+.24*(hash22(id+60.) - .5);
  float l=bpWiped((id+at - vec2(row,.0)) / 15.);
  w=mix(w,l,dab);
  f=mix(f,.16+.6*(.02+.37*sqrt(sat(l*1.5)) - length(fract(g) - at))+.03*(cloud - .5),dab);
 }
 float clear=bpS(.15,.19,f);
 float film=bpS(.66,.85,streak)*.45*(1. - dab);
 if (uOwn[3] > .0) clear=mix(clear,bpS(.17,.11,abs(fract(f*4.) - .5))*bpS(.03,.06,w),uOwn[3]);
 bpRim=bpBell((f - .155) / .017)*bpS(.03,.1,w);
 bpFog=(.8+.2*bpS(.25,.7,cloud))*(1. - clear*(1. - film));
 // an old wipe, half misted over again
 float old=bpS(.075,.03,abs(arc.y - ghost)+(streak - .5)*.06)*bpS(-.62,-.4,arc.x)*bpS(.35,.0,arc.x);
 bpFog *= 1. - .5*old*(.55+.45*streak);
 bpBend=vec2(.0,(streak - .5)*.012)*clear+(cloud - .5)*.05*bpRim;
 // the finger's line, with the water it pushed aside
 float fresh=bpS(.04,.35,bpFresh(p.x)),fy=abs(p.y - bpFinger(p.x));
 if (fresh > .0 && fy < .1) {
  float fs=.55*cos(p.x*10.+1.)+.6*cos(p.x*23.) - .05,fw=.0105;
  fy=fy / sqrt(1.+fs*fs)+.003*(noise(p*45.) - .5);
  float line=bpS(fw+.0015,fw - .0015,fy)*fresh;
  bpFog += .25*fresh*bpBell((fy - fw*1.35) / .004)*(1. - clear);
  bpFog *= 1. - .94*line;
  bpRim=max(bpRim,.6*line*bpS(.4*fw,fw,fy));
 }
 if (uOwn[3] < .0) { bpFog *= 1.+uOwn[3]; bpRim *= 1.+.8*uOwn[3]; }
 if (uOwn[0] > .0) { // feathers of ice grow from many seeds, and where two meet there is an edge
  vec2 g=p*3.6+.35*(vec2(noise(p*5.),noise(p*5.+9.)) - .5),id=floor(g),far=vec2(9.);
  for (int j=0; j < 9; j++) {
   vec2 k=id+vec2(float(j % 3),float(j / 3)) - 1.,h=hash22(k+21.),v=g - k - h;
   float dd=dot(v,v);
   if (dd < far.x) { far=vec2(dd,far.x); v=rot(TAU*h.y)*v; float y=abs(v.y),b0=(v.x - y*1.1+.6*y*y)*9.,bf=abs(fract(b0) - .5)*2.,t=abs(fract((y*1.5+v.x*.4)*34.) - .5)*2.;
    bpIce=max(bpS(.035,.0,y),max(bpS(.5,.05,bf)*(.5+.5*bpS(.2,.9,t)),.5*bpS(.4,.9,t)*bpS(.9,.4,bf))); }
   else far.y=min(far.y,dd);
  }
  bpIce=sat(bpIce*(.55+.7*cloud)+.35*bpS(.16,.0,sqrt(far.y) - sqrt(far.x)));
  bpIce *= sat(bpFog*1.15);
  bpFog *= mix(1.,.3+.75*bpIce,uOwn[0]);
  bpBend += uOwn[0]*.05*(bpIce - .4)*bpFog;
 }
 if (uOwn[4] > .0) { vec2 b=.5 - abs(fract(p*vec2(3.1,2.9)+.5) - .5); bpFog=mix(bpFog,1.,.6*uOwn[4]*bpS(.3,.0,min(b.x,b.y)+.12*(cloud - .5))*bpS(.0,.25,bpFog+.15)); }
 // a cue breathes thick mist that shrinks from its edge; a voice mists the foot of the pane
 float b=length(p - vec2(-.08,.04))+.1*(cloud - .5);
 float breath=bpS(.0,.5,uCue)*bpS(.34,.1,b+.16*(1. - uCue));
 breath=max(breath,uMic*.8*bpS(.3,.0,length((p - vec2(.1,-.4))*vec2(.6,1.))));
 bpFog=mix(bpFog,1.35,breath);
 float dry=1. - sat(breath);
 bpRim *= dry;
 float grow=.6+.3*uTexture+.1*uKeys;
 float px=bpPx,wet=max(uOwn[1],.0);
 vec2 wp=p;
 if (uOwn[1] < .0) dry *= 1.+uOwn[1];
 if (uOwn[7] < .0) { float k=exp2(2.2*uOwn[7]); wp *= k; bpPx *= k; grow *= 1. - .35*uOwn[7]; wet=max(wet,-.35*uOwn[7]); }
 if (uOwn[7] > .0) wp=rot(-1.2*uOwn[7])*p;
 bpBeads(wp,62.,5.,grow*dry,.07+.5*bpRim+.1*uTexture+.1*uKeys+.5*wet);
 bpBeads(wp+.37,25.,9.,grow*dry,.02+.22*bpRim+.05*uTexture+.06*uKeys+.5*wet);
 if (wet > .0) bpBeads(wp - .21,11.,3.,(.7+.2*uTexture)*dry,.55*wet);
 bpRuns(wp,.085,1.);
 bpRuns(wp,.034,40.5);
 bpPx=px;
 if (uOwn[0] < .0) { float u=fract(p.x*24.) - .5; bpBend.x += uOwn[0]*u*.11; }
 // a hit: a touch clears a round place, and one heavy drop runs down from it
 if (uHits > .01) {
  float hx=.06+.2*sin(uTime*.037),top=.16,y=top - .02 - .6*(1. - uHits),on=bpS(.0,.3,uHits);
  float dx=p.x - hx - .035*(noise(vec2(p.y*6.,2.)) - .5);
  float tap=length(vec2(p.x - hx,(p.y - top - .06)*.7))+.05*(streak - .5);
  bpFog *= 1. - .95*bpS(.155,.125,tap)*uHits;
  if (uOwn[3] < .0) { // with no mist to touch, the touch leaves a ring of breath that opens and goes
   float o=bpBell((tap - .1 - .09*(1. - uHits)) / .035)*on*-uOwn[3];
   bpFog=max(bpFog,.8*o); bpBend += o*.4*vec2(p.x - hx,p.y - top - .06);
  }
  bpRim=max(bpRim,on*bpBell((tap - .14) / .012));
  float wide=.011*bpS(top+.02,top - .1,p.y)+1e-4;
  float tr=bpS(wide+bpPx,wide - bpPx,abs(dx))*step(p.y,top)*step(y,p.y)*on;
  bpFog *= 1. - tr; bpBend.x += dx*3.*tr;
  bpLay(vec2(dx*(p.y > y ? 1.15 : 1.),(p.y - y)*(p.y > y ? .55 : 1.)) / .024,.024,on);
 }
}
// A soft light of radius r seen through blur b.
float bpLamp(vec2 v,float r,float b) { float k=r*r+b*b; return r*r / k*exp(-dot(v,v) / k); }
float bpCap(vec2 p,vec2 a,vec2 b,float w0,float w1) { vec2 d=b - a; float h=sat(dot(p - a,d) / dot(d,d)); return length(p - a - d*h) - mix(w0,w1,h); }
vec3 bpKind(int i) { vec3 k=uKind[i]; return k*k*1.6; }
// How high the peaks stand over the lake, and the colour of a hill in this hour.
float bpTops(float x) {
 if (uOwn[6] >= .0) return .0;
 float n=noise(vec2(x,3.)),m=1. - abs(2.*noise(vec2(x*2.1,8.)) - 1.);
 return -uOwn[6]*(n*.65+m*.35*n+.09*noise(vec2(x*11.,1.)));
}
vec3 bpHill(vec3 was,vec3 sky,float near,float y) {
 vec3 k=uKind[0]*uKind[0];
 return mix(mix(was,mix(sky,.04+.3*k,near)+.25*bpS(.0,.3,y),bpDay),(.004+.05*k)*(1.4 - near),bpNight);
}
// The garden, as sharp as b is small.
vec3 bpGarden(vec2 q,float b) {
 vec2 o=q;
 if (bpOpen > .0 && q.y < -.165) { // what stands outside is mirrored in water or a wet street
  float d=-.165 - q.y;
  q=mix(q,vec2(q.x+(.02+.12*d)*(noise(vec2(q.x*3. / (.12+d),60.*log(.05+d)+uTime*.4)) - .5),-.165+d*.95),min(bpOpen*3.,1.));
 }
 float s=bpPx*1.3+b,e=.4+.9*uEnergy;
 float up=sat((q.y+.16) / .66);
 vec3 c=mix(vec3(1.05,.52,.22),vec3(.5,.36,.37),bpS(.0,.3,up));
 c=mix(c,vec3(.12,.19,.3),bpS(.15,.9,up));
 float st=noise(vec2(q.x*2.2+4.,q.y*13.+.6*q.x))*.65+.35*noise(vec2(q.x*6.,q.y*34.));
 c=mix(c,vec3(.95,.42,.27)*(.4+.6*(1. - up)),bpS(.5,.8,st)*.5*bpS(.9,.2,up));
 vec4 m=piece(bpUV(q));
 c += (m.rgb*m.rgb - .35*m.a)*.12*e;
 c += bpKind(1)*uPad*.1*e*bpS(.7,.1,up);
 vec3 k1=uKind[1]*uKind[1],k2=uKind[2]*uKind[2];
 c=mix(c,mix(.35+.8*k2,.12+.9*k1,sat(up*1.4))+.2*(st - .5),bpDay);
 if (bpNight > .0) {
  vec2 sg=q*34.,h=hash22(floor(sg)+4.);
  c=mix(c,mix(.02+.22*k2,.005+.17*k1,sqrt(up))*(.7+.6*st)+bpS(.12,.0,length(fract(sg) - .2 - .6*h))*step(.88,fract(h.x*33.))*.7*bpS(.02,.0,b),bpNight);
 }
 // far hills one behind another, and a road where headlights pass
 c=mix(c,bpHill(vec3(.27,.19,.22),c,.35,q.y),bpS(s,-s,q.y+.07 - .06*noise(vec2(q.x*2.,1.)) - bpTops(q.x*2.3+2.)*.5));
 c=mix(c,bpHill(vec3(.085,.072,.095),c,.7,q.y),bpS(s+.003,-s,q.y+.125 - .03*noise(vec2(q.x*5.,9.)) - bpTops(q.x*3.1+5.3)*.3 - .02*noise(vec2(q.x*24.,4.))));
 float car=fract(uTravel*.011),hx=1.3 - 2.6*car;
 vec2 hv=q - vec2(hx,-.142);
 c += vec3(1.5,1.2,.8)*(bpLamp(hv,.01,b)+bpLamp(hv - vec2(.03,.0),.01,b))*bpS(.0,.1,car)*bpS(1.,.9,car)*1.6;
 if (bpCity > .0) for (int k=0; k < 2; k++) {
  float fk=float(k),gx=q.x*(9. - 4.*fk)+60.+fk*7.3+uTravel*.03*(.5+fk)*max(uOwn[7],.0),id=floor(gx),h=hash11(mod(id,97.)+fk*31.),fx=fract(gx);
  float top=-.18+bpCity*mix(.12+.36*h,.03+.2*h*h,fk);
  float m=bpS(s,-s,q.y - top)*bpS(-s,s,(.48 - abs(fx - .5)) / (9. - 4.*fk));
  vec2 gw=vec2(fx*floor(3.+3.*fract(h*7.)),(top - q.y)*mix(36.,26.,fk)),wf=fract(gw) - .5;
  float lit=hash21(floor(gw)+vec2(id*5.,fk*40.)),pane=mix(bpS(.36,.24,abs(wf.x))*bpS(.36,.24,abs(wf.y)),bpS(.55,.3,length(wf))*.6,bpS(.004,.025,b));
  vec3 wall=mix(mix(vec3(.05,.045,.06),vec3(.018,.017,.024),fk),mix(c,.08+.4*k2*h,.5+.35*fk),bpDay);
  vec3 hc=mix(vec3(1.5,.95,.5),bpKind(int(lit*97.) % 5)*1.5,.55);
  c=mix(c,wall*(1. - .5*bpDay*pane)+hc*pane*step(.6,lit)*(.25+.5*h+1.5*e*band(fract(lit*41.)))*(1. - .65*bpDay),m);
 }
 // the lawn, and a wet path
 vec3 warm=vec3(2.1,1.02,.3)*(.7+.6*uLevel),lc=mix(vec3(1.7,.95,.42),bpKind(0)*2.2,.4*uDrone)*(.8+1.7*uDrone*e+.4*uLow);
 vec2 a=q - vec2(-.6,-.02),wg=a - vec2(.04,-.09),l=q - vec2(.16,.035);
 float lawn=bpS(s,-s,o.y+.17 - .026*noise(vec2(o.x*21.,2.)));
 if (lawn > .0) {
  float deep=sat(-.165 - o.y),lg=log(.055+deep),blade=noise(vec2(o.x*30. / (.12+deep),27.*lg));
  vec3 g=mix(vec3(.03,.036,.036),vec3(.01,.017,.018),bpS(.0,.3,deep))*(.75+.6*blade);
  float pw=.012+.17*deep,path=bpS(pw+s,pw - s,abs(o.x - .135+.06*sin(deep*9.)+.4*deep*deep)+pw*.25*(blade - .5));
  float wet=mix(noise(vec2(o.x*10. / (.15+deep),22.*lg)),.5,bpS(.0,.04,b));
  if (bpDay > .0) g=mix(g,(.3+.65*k1)*(.85+.12*blade)*(1. - .25*deep),bpDay);
  g *= 1. - .6*bpNight;
  g=mix(g,mix(vec3(.07,.058,.06),vec3(.4,.25,.19),bpS(.15,.85,wet)),path*.8*(1. - .5*bpDay));
  g += lc*(.4*path*bpS(.2,.75,wet)+.02)*bpBell(l.x / (.05+b))*bpS(-.6,-.2,l.y);
  c=mix(c,mix(c*mix(.7,.45,bpOpen),g,1. - bpOpen),lawn);
 }
 // the house, and a bush
 if (q.x < -.1 && bpOpen < 1.) {
  float roof=min(max(abs(a.x) - .3,a.y - .2+abs(a.x)*.62),max(abs(a.x - .13) - .017,abs(a.y - .12) - .065));
  float eave=abs(a.x)*.62+a.y - .2;
  vec3 wall=vec3(.03,.027,.034)+.025*bpS(-.2,.15,a.y);
  wall=mix(wall,vec3(.085,.075,.09),bpBell((eave+.008) / (.007+.5*s))*.8)+warm*.022*exp(-dot(wg,wg)*60.);
  wall=mix(wall,mix(vec3(.07,.06,.055),vec3(.95),bpS(.05,.02,abs(eave+.02))*step(a.y,.22)),bpDay);
  vec3 bare=c;
  c=mix(c,wall,bpS(s,-s,roof)*bpS(-s,s,q.y+.155));
  vec2 w1=abs(vec2(abs(a.x - .04) - .06,a.y+.07)),w2=w1 - vec2(.028,.045);
  float pane=bpS(s,-s,max(w2.x,w2.y))*(.045 / (.045+b))*mix(bpS(.001,.0035,min(w1.x,abs(a.y+.055))),.85,bpS(.005,.025,b));
  c=mix(c,warm*mix(1.1,.5,bpS(-.1,-.025,a.y))*(.72+.28*bpS(.03,.012,w1.x)),pane)+warm*.05*exp(-dot(wg,wg)*40.);
  float bush=length((q - vec2(-.33,-.165))*vec2(.75,1.)) - .06 - .03*(noise(q*30.)+noise(q*70.) - .8);
  c=mix(c,vec3(.018,.02,.02)+.5*bpDay*bpS(.0,-.06,bush+.6*(q.y+.2)),bpS(s,-s,bush));
  c=mix(c,bare,bpOpen);
 }
 // the lamp on its post, for the drone
 float post=bpS(s,-s,max(abs(l.x) - .0034,max(l.y,-l.y - .23)))*(.004 / (.004+b*.7));
 c=mix(c,vec3(.02,.018,.022),post);
 float ld=length(l);
 c += lc*(1.3*bpLamp(l,.015,b)+.1*exp(-ld*ld*60.)+.16*exp(-ld*15.));
 // a string of small lamps, one for each band
 float t=(q.x+.46) / .96,tt=sat(t),i=clamp(floor(t*16.),.0,15.),bt=(i+.5) / 16.;
 vec2 bl=vec2(bt*.96 - .46,mix(.1,.19,bt) - .34*bt*(1. - bt) - .012);
 float yc=mix(.1,.19,tt) - .34*tt*(1. - tt);
 if (uOwn[6] < .0) { bl.y=mix(bl.y,-.15,-uOwn[6]); yc=mix(yc,-.15,-uOwn[6]); }
 c *= 1. - .6*(1. - bpOpen)*step(abs(t - .5),.5)*bpS(.0022+b*.3,.0004,abs(q.y - yc))*(.002 / (.002+b*.6));
 bl=q - bl;
 c += (1. - bpCity)*mix(vec3(1.6,.78,.3),kindColour(i*.25)*1.7,.45)*(.25+2.2*uBands[int(i)]*e)*(1.2*bpLamp(bl,.0072,b)+.12*exp(-dot(bl,bl)*1500.)*.02 / (.02+b));
 // one dark tree
 vec2 r=q - vec2(.57+.006*sin(uTime*.21+q.y*3.)*bpS(-.2,.4,q.y),.0),cr=(r - vec2(.0,.18)) / vec2(.29,.235);
 float ls=.1+b*22.,oval=1. - dot(cr,cr),fine=1. - bpS(.01,.06,b);
 if (oval < -1.5*fine - ls && abs(r.x) > .1+s) return c;
 float tree=min(bpCap(r,vec2(.02,-.26),vec2(.0,.04),.026,.013),bpCap(r,vec2(.0,.0),vec2(-.14,.2),.011,.003));
 tree=min(tree,bpCap(r,vec2(.0,.04),vec2(.05,.3),.012,.003));
 oval += (noise(r*9.+3.) - .5)*(.5+.9*fine);
 if (fine > .0) oval += fine*((noise(rot(.6)*r*30.) - .5)*1.2+(noise(rot(1.1)*r*80.) - .5)*.9);
 float dark=max(bpS(s,-s,tree),bpS(.3 - ls,.3+ls,oval)*.97)*(1. - bpOpen);
 return mix(c,vec3(.018,.024,.024)+bpDay*.6*bpS(.45,.75,noise(r*24.)*.6+.4*cr.y)+vec3(.06,.028,.014)*bpS(.4,-.9,cr.x+.4*cr.y+2.*max(-cr.y - .5,.0)),dark);
}
vec3 bpMisted(vec2 p) {
 bpGlass(p,.0);
 float fog=min(bpFog,1.);
 float b=mix(.012 - .006*uTone,.06+.06*uSpace,fog*fog*(.4+.6*fog))+bpDrop*.012;
 vec3 c=bpGarden(p+bpBend*(1.+1.4*bpDrop),b);
 // the mist: the light behind it and its own pale grey
 float lum=.62+.3*bpS(-.5,.45,p.y);
 vec2 l=p - vec2(.16,.035),w=p - vec2(-.56,-.09);
 vec3 halo=vec3(1.,.6,.28)*(.22*exp(-length(w)*5.5)+(.1+.25*uDrone)*exp(-length(l)*6.));
 vec3 own=mix(mix(vec3(.5,.525,.54),.1+.95*uKind[1]*uKind[1],bpDay),.004+.11*uKind[1]*uKind[1],bpNight);
 vec3 mist=c*.4+own*lum*.95+halo;
 c=mix(c,mist,fog);
 return c+.55*vec3(1.,.97,.93)*max(bpFog - 1.,.0);
}
float bpWide,bpFar;
vec3 bpHot,bpC; // the light behind the greenhouse; the picture so far
float bpMot; // an unevenness all leaves share
// One leaf, bowed from its base. near: where it touches the glass. frond: 0 broad, 1 leaflets, 2 fingers.
void bpLeaf(vec2 p,vec2 base,float ang,float len,float wid,float bow,vec4 near,float frond,vec3 tint,float lv) {
 wid *= bpWide; len *= bpFar;
 vec2 d=p - base;
 float ca=cos(ang),sa=sin(ang);
 vec2 q=vec2(ca*d.x+sa*d.y,ca*d.y - sa*d.x) / len;
 float x=q.x,xx=sat(x);
 q.y -= bow*x*x+.012*x*x*sin(uTime*.17+ang*3.);
 if (x < -.12 || x > 1.12 || abs(q.y) > wid+.12) return;
 float y=abs(q.y),side=q.y < .0 ? .0 : 1.;
 float w=wid*max(sin(PI*pow(xx,.72)),.0)*(1.+.05*sin(x*17.+side*2.+ang));
 if (y > w+.1) return;
 float rib=.01*(1. - xx)+.002,yy=y / max(w,1e-3),broad=1. - step(.5,frond);
 // how far from the glass this place is
 float z=near.x+near.y*abs(x - near.z)+near.w*y / wid+.1*(bpMot - .5) - .16*lv;
 float off=max(z,.0);
 float s=bpPx*1.2+off*(.05+.05*uSpace)*(.35+.65*bpFog);
 float in_=min(w - y,x*.5+.004),vein;
 float v=(x - y*.9+.35*y*y / wid)*11.,vs=abs(fract(v) - .5)*2.;
 if (frond > .5 && frond < 1.5) {
  float ey=min(yy,1.),n=17.,u=x*n - ey*2.2*(1. - .4*xx);
  float k=floor(u),lf=abs(u - k - .5)*2.;
  float tip=.72+.28*hash11(k+side*31.+ang);
  in_=min(in_,(.66*(1. - pow(ey / tip,3.)) - lf) / (2.*n));
  in_=max(in_,rib - y);
  vein=bpS(.16,.0,lf);
 } else {
  if (frond > 1.5) in_=min(min(in_,w*(1. - .3*(1. - vs)*(1. - vs)) - y),(vs - .22*bpS(.3,.75,yy)*bpS(.12,.3,xx)*bpS(.95,.75,xx)) / 22.+.003);
  vein=bpS(.86,.97,1. - vs)*bpS(.0,.3,1. - yy)+.4*bpS(.7,1.,abs(fract(v*5.) - .5)*2.);
 }
 float cov=bpS(-s,s,in_*len)*mix(1.,wid*len*.5 / (wid*len*.5+s),.8);
 if (cov < .004) return;
 float mid=bpS(rib*1.2+s,rib*.4,y);
 float fleck=noise(q*vec2(9.,26.));
 vec3 leaf=mix(vec3(.005,.024,.016),vec3(.016,.07,.03),.2+.4*side+.4*fleck+.25*vs*broad);
 leaf=mix(leaf,tint*tint*(.12+.5*fleck*side+.25*vs*broad),bpDay)*(1. - .85*bpNight);
 leaf += bpNight*tint*tint*((.5+lv)*bpBell(in_*len / .006)+.06+.5*vein*(.3+lv));
 leaf += bpHot*bpHot*mix(vec3(.06,.11,.016),tint*.12,bpDay)*(.35+.65*side);
 leaf *= 1.+.55*vein*bpS(.1,.0,off);
 // its sound's colour comes up in it as variegation along the rib
 float stripe=bpS(.75,.1,yy+.5*(1. - vs)*broad+.35*fleck);
 leaf=mix(leaf,tint*tint*.5+.01,lv*.7*stripe);
 leaf += (vec3(.09,.15,.08)+.15*tint*lv)*mid*(1. - min(frond,1.)*.5);
 float touch=bpS(.004,-.02,z);
 leaf=mix(leaf+vec3(.02,.03,.022),leaf*.8,touch);
 float veil=(1. - touch)*sat(.34+1.25*off)*bpFog;
 // the film of water round the part that touches
 float film=bpBell((z - .002) / .0045)*bpS(.0,.01,in_);
 leaf += vec3(.3,.36,.31)*film*bpS(.3,.6,fleck);
 veil *= 1. - .8*film;
 bpC=mix(bpC,mix(leaf,bpC*.15+bpHot,veil*.94),cov);
}
vec3 bpHouse(vec2 p) {
 bpGlass(p,.14);
 float fog=min(bpFog,1.);
 vec2 q=p+bpBend*(1.+1.2*bpDrop);
 // pale wet light, strongest high up to the right
 vec2 sv=(q - vec2(.24,.3))*vec2(.8,1.1);
 float sun=exp(-dot(sv,sv)*(4. - 1.6*uTone));
 bpMot=noise(q*9.);
 bpHot=mix(vec3(.2,.29,.25),vec3(.95,.98,.78),sun)*(.85+.25*uLevel);
 bpHot=mix(mix(bpHot,.08+1.1*uKind[1]*uKind[1]+.25*sun,bpDay),.004+.2*uKind[1]*uKind[1]*(.3+sun),bpNight);
 // far behind: green dusk with round spots of light, for the bands
 float b=.02+.09*fog,e=.4+.9*uEnergy;
 float far=noise(q*3.1+5.)*.5+noise(rot(.7)*q*vec2(15.,3.5))*.5;
 bpC=mix(vec3(.006,.02,.015),vec3(.06,.115,.04),bpS(.35,.75,far))*(.6+1.2*sun);
 if (bpDay+bpNight > .0) bpC=mix(mix(bpC,(.45+.6*far)*(.1+1.1*uKind[1]*uKind[1])+.3*sun,bpDay),(.01+.12*uKind[0]*uKind[0])*(.4+1.2*far*far),bpNight);
 bpC += (1. - max(bpDay,bpNight))*vec3(.5,.6,.26)*sun*bpS(.42,.8,far)*.9;
 vec4 m=piece(bpUV(q));
 vec2 sg=rot(.7)*q*6.3+vec2(1.5,.25*sin(uTime*.04)),h=hash22(floor(sg)+3.);
 float r=.1+.22*h.x,n=fract(h.y*37.);
 vec3 kc=kindColour(n*4.),spot=mix(vec3(.75,.85,.4),kc*kc*1.6,.4+.5*max(bpDay,bpNight));
 bpC += spot*(.05+.55*band(n)*e)*bpS(r+.09,r - .09,length(fract(sg) - .5 - (h - .5)*.16))*step(.45,h.y)*(1. - .8*fog)*(.3+far);
 bpC=mix(bpC,bpC*.6+m.rgb*m.rgb*(.06+.2*far)*e,bpS(.1,.7,m.a)*.7);
 bpC=mix(bpC,bpC*.12+bpHot,.95*fog);
 bpWide=exp2(uOwn[6] > .0 ? -2.*uOwn[6] : -.9*uOwn[6]); bpFar=1.;
 if (uOwn[6] > .0) for (int i=0; i < 8; i++) {
  vec2 h=hash22(vec2(float(i),3.));
  bpLeaf(q,vec2(-.9+.23*float(i)+.1*h.x,-.62),1.2+.75*h.y,uOwn[6]*(.6+.6*h.x)+.01,.1,.3*(h.y - .5),vec4(.3*fract(h.x*9.) - .02,.2,.5,.05),.0,uKind[i % 5],i % 5 == 0 ? uDrone : uPad);
 }
 bpFar=1. - .98*max(-uOwn[6],.0);
 // the leaves, the far ones first
 bpLeaf(q,vec2(-.3,-.7),1.72,1.08,.12,-.1,vec4(.42,.1,.5,.05),.0,uKind[4],.0);
 bpLeaf(q,vec2(.66,.7),4.3,1.,.2,.12,vec4(.34,.1,.5,.0),1.,uKind[2],uTexture*.6);
 bpLeaf(q,vec2(-.66,.62),5.,.66,.2,.15,vec4(.06,.5,.72,.1),.0,uKind[3],uPhrase);
 bpFar=1.;
 bpLeaf(q,vec2(.28,-.68),1.22,.84,.2,-.16,vec4(-.02,.5,.62,.05),1.,uKind[2],uTexture);
 bpLeaf(q,vec2(1.02,-.46),2.74,.98,.2,-.16,vec4(-.06,.55,.6,.1),2.,uKind[1],uPad);
 bpLeaf(q,vec2(-.04,-.66),2.02,.66,.07,.1,vec4(-.03,.6,.68,.05),.0,uKind[3],uPhrase);
 bpLeaf(q,vec2(-.88,-.62),.96,1.06,.17,-.12,vec4(-.1,.42,.55,.1),.0,uKind[0],uDrone);
 return bpC+.55*max(bpFog - 1.,.0);
}
vec3 render(vec2 p) {
 bpPx=1. / uRes.y; bpAsp=uRes.x / uRes.y;
 bpDay=max(uOwn[5],.0); bpNight=max(-uOwn[5],.0); bpOpen=abs(uOwn[6]); bpCity=max(uOwn[6],.0); bpIce=.0;
 vec3 c=uVar < .5 ? bpMisted(p) : bpHouse(p);
 c *= (1.+.11*min(bpFog,1.)*(noise(p*300.) - .5))*(1. - .75*bpDark*bpDrop); // the grain of the mist, the drops
 c += vec3(1.,.95,.88)*bpGlint*bpDrop*(.5+.5*uHigh);
 c=c*(1. - .3*bpRim);
 if (uOwn[0] > .0) c += uOwn[0]*bpIce*mix(vec3(.2,.23,.26),.15*uKind[1]+.02,bpNight);
 if (uOwn[0] < .0) { float u=abs(fract(p.x*24.) - .5); c=c*(1.+uOwn[0]*(.5*bpS(.28,.5,u) - .1)) - uOwn[0]*.14*bpS(.1,.0,abs(u - .2))*(.15+c); }
 if (uOwn[4] > .0) { // bars of painted wood
  vec2 b=(.5 - abs(fract(p*vec2(3.1,2.9)+.5) - .5)) / vec2(3.1,2.9);
  float w=.02*uOwn[4],d=min(b.x,b.y);
  vec3 k=uKind[0]*uKind[0];
  vec3 wood=(mix(.03+.12*k,vec3(.75,.73,.68)*(.6+.4*k),bpDay))*(.75+.4*noise(p*(b.x < b.y ? vec2(160.,6.) : vec2(6.,160.))))*(1.15 - .5*bpS(.5*w,w,d))*(.8+.5*p.y);
  c=mix(c*(1. - .4*bpS(2.*w,w,d)*uOwn[4]),wood,bpS(w+bpPx,w - bpPx,d)*step(.001,uOwn[4]));
 }
 if (uOwn[4] < .0) { // a round port with a metal ring
  float r=length(p),R=mix(1.35,.4,-uOwn[4]),t=(r - R) / .07,lamp=r > 1e-4 ? dot(p / r,vec2(-.5,.86)) : .0,x=2.*t - 1.;
  vec3 k=uKind[0]*uKind[0],metal=(.05+.35*k)*(.35+.65*sat(.5+.6*lamp*x))+.5*k*pow(sat(lamp*x),6.);
  metal *= .9+.2*noise(vec2(atan(p.y,p.x)*3.,t*30.));
  vec3 hull=(.012+.07*k)*(.7+.5*noise(p*5.)+.2*noise(p*90.))*(1.+.6*p.y)*(.5+.5*bpS(.0,.2,r - R - .07));
  c *= 1. - .6*bpS(R - .09,R,r);
  c=mix(c,metal,bpS(R - bpPx,R+bpPx,r));
  c=mix(c,hull,bpS(R+.07 - bpPx,R+.07+bpPx,r));
 }
 return screenOf(c*1.1);
}
