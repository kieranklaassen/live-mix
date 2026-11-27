// name: Small world
// a: Round moor
// b: Round sky
// what: A small ball of moorland hangs in a wide pale morning sky: heather, a track, pools and a white house, with trees and stones pointing outward all round it like pins, and it rolls without hurry; or the world is inside out, the moor fills the frame, trees lean in from every side and the sky is a round pool of light in the middle.
// follows: The piece lies round the land and a patch of sun goes round with the loop. Drones raise the middle hills, pads fill the pools, textures colour the heather, phrases the leaves; trees grow where it is loud. Bands are the far hills, level the sun. A hit sends up birds where the loop is, a cue sends wind right round. Keys open flowers, a voice lights the lamp.
// own: 0 1 a crowd of small trees all round, -1 nearly everything gone but two or three; 1 1 firs, dark spires, -1 smooth caps on bare stems; 2 1 snow lies and falls toward the middle, -1 rippled sand; 3 1 the sea has risen and only islands stand, -1 built over with roofs and towers; 4 1 night with stars, a moon and lit windows, -1 evening with a great low sun; 5 the eye: 1 down on the land under a curved horizon (b: a wide open sky), -1 a tiny far ball with great trees (b: a narrow well); 6 1 tall sharp mountains all round, -1 no hills, a clean disc; 7 1 dyed in the colours of the sounds, -1 engraved in ink rings on paper
vec2 swL;     // the way to the sun, seen from where a thing stands upright
vec3 swSun;   // the sun's colour
float swWave; // the wind of a cue as it passes
// What stands on the moor: place round it in turns, height of its foot, size, and what it is:
// 0 thorn, 1 birch, 2 pine, 3 stone, 4 house. Nine on the far fold, five on the next, three near.
const vec4 swO[17]=vec4[17](
 vec4(.05,-.069,.36,1),vec4(.155,-.074,.17,3),vec4(.27,-.206,.42,2),vec4(.375,-.1,.15,3),vec4(.5,-.1,.17,4),vec4(.6,-.023,.34,2),
 vec4(.715,-.17,.36,0),vec4(.83,-.156,.3,1),vec4(.94,-.09,.21,3),vec4(.085,-.25,.5,0),vec4(.32,-.424,.24,3),vec4(.44,-.377,.46,1),
 vec4(.69,-.297,.2,3),vec4(.88,-.422,.56,2),vec4(.13,-.981,.2,3),vec4(.4,-.786,.5,0),vec4(.8,-.7,.22,3));
// The same on the plain under the eye: place of each foot, height, what it is.
const vec4 swB[17]=vec4[17](
 vec4(13.81,4.49,5.23,1),vec4(7.64,11.24,2.31,3),vec4(-.6,4.78,2.02,2),vec4(-7.04,7.04,1.49,3),vec4(-9.94,0,1.69,4),vec4(-13.48,-9.79,5.66,2),
 vec4(-1.28,-5.72,2.11,0),vec4(3.09,-5.61,1.92,1),vec4(10.29,-4.07,2.32,3),vec4(3.41,2.02,1.98,0),vec4(-.97,2.07,.55,3),vec4(-2.41,.95,1.19,1),
 vec4(-1.22,-3.08,.66,3),vec4(1.68,-1.57,1.29,2),vec4(.6,.64,.17,3),vec4(-.93,.68,.58,0),vec4(.41,-1.25,.29,3));
// From 1 below lo to 0 above hi.
#define swS smoothstep
float swX(float hi,float lo,float x) {return 1. - swS(lo,hi,x);}
// A line of noise that closes after per cells in x.
float swLine(float x,float per,float seed) {
 float i=floor(x),f=x - i;f=f*f*(3. - 2.*f);
 return mix(hash21(vec2(mod(i,per),seed)),hash21(vec2(mod(i + 1.,per),seed)),f);
}
float swGap(float a,float b) {return fract(a - b + .5) - .5;} // the way round from b to a, in turns
float swSeam(float u) {return swS(0.,.03,u)*swX(1.,.97,u);}
float swLoud(float u) {return swSeam(u)*max(piece(vec2(u,.22)).a,piece(vec2(u,.5)).a);}
vec3 swInk(vec3 c,float k) {float g=dot(c,vec3(.3,.59,.11));return clamp(mix(vec3(g),c,k),0.,1.);}
vec3 swDim;   // how the hour dims what stands in it
float swGlow; // a lit window here
#define swFull max(uOwn[0],0.)
#define swFew max(-uOwn[0],0.)
#define swFir max(uOwn[1],0.)
#define swCap max(-uOwn[1],0.)
#define swWhite max(uOwn[2],0.)
#define swSand max(-uOwn[2],0.)
#define swSea max(uOwn[3],0.)
#define swTown max(-uOwn[3],0.)
#define swNight max(uOwn[4],0.)
#define swEve max(-uOwn[4],0.)
#define swPeak max(uOwn[6],0.)
#define swFlat max(-uOwn[6],0.)
// Dyed in a kind's colour, its light and dark half kept.
vec3 swDye(vec3 c,vec3 k) {
 const vec3 w=vec3(.3,.59,.11);
 float g=dot(c,w),kg=max(dot(k,w),.1);
 vec3 d=k*(.35 + .65*g/kg);
 float m=max(d.r,max(d.g,d.b));if (m>1.) d=mix(d/m,vec3(1.),sat((m - 1.)*.5));
 return mix(c,d,.92*max(uOwn[7],0.));
}
// The top of a fold of the moor, a the angle round it.
float swFold0(int k,float a) {
 if (k==0) return -.09 + .06*sin(2.*a + 1.) + .045*sin(5.*a + 2.);
 if (k==1) return -.36 + .11*sin(3.*a + .5) + .08*sin(a + 2.);
 if (k==2) return -.8 + .14*sin(2.*a + 4.) + .07*sin(5.*a);
 return -1.25 + .12*sin(3.*a + 2.);
}
float swFold(int k,float a) {
 float w=swFold0(k,a);
 if (uOwn[6]!=0.) {float m=k==0?-.09:k==1?-.36:k==2?-.8:-1.25;w=m + (w - m)*(1. + uOwn[6]);}
 if (k==0) w=mix(w,-.06,swSea);
 return w;
}
// A crown of three flat balls: where in its ball a place is, and how far out.
vec3 swCrown(vec2 z,vec4 a,vec4 b,vec4 c) {
 vec2 na=(z - a.xy)/a.zw,nb=(z - b.xy)/b.zw,nc=(z - c.xy)/c.zw;
 float la=dot(na,na),lb=dot(nb,nb),lc=dot(nc,nc);
 return la<lb&&la<lc?vec3(na,la):lb<lc?vec3(nb,lb):vec3(nc,lc);
}
// One tree, z its own measure: foot at 0, top near 1. Leaves in dabs.
vec4 swTree(vec2 z,float kind,float seed,float e,float lean) {
 z.x-=lean*z.y*z.y;
 vec4 a,b,c;
 if (kind<.5) {a=vec4(.05,.63,.36,.2);b=vec4(.3,.76,.27,.14);c=vec4(-.2,.54,.2,.12);}
 else if (kind<1.5) {a=vec4(0.,.5,.16,.24);b=vec4(.03,.78,.1,.22);c=vec4(-.08,.38,.13,.12);}
 else {a=vec4(.03,.9,.2,.1);b=vec4(.17,.74,.24,.075);c=vec4(-.15,.63,.19,.06);}
 float fir=swFir,cap=swCap,high=.86;
 if (fir>0.) {a=mix(a,vec4(0.,.3,.27,.17),fir);b=mix(b,vec4(0.,.58,.18,.18),fir);c=mix(c,vec4(0.,.88,.085,.22),fir);high=mix(high,1.,fir);}
 if (cap>0.) {
  float wd=(.26 + .16*hash11(seed*3.1))*(kind>.5&&kind<1.5?.7:1.),ch=.13 + .08*hash11(seed*5.3);
  a=mix(a,vec4(.02,.74,wd,ch),cap);b=mix(b,vec4(0.,.79,wd*.8,ch),cap);c=mix(c,vec4(0.,.72,wd*.9,ch*.8),cap);high=mix(high,.78,cap);
 }
 float y=z.y,w=.032*(1.15 - y) + .03*exp(-y*14.) + .02*cap;
 float tx=z.x - .02*sin(y*7. + seed*9.);
 float trunk=swX(e,-e,abs(tx) - w)*step(-.08,y)*swX(high,high - .06,y);
 float bough=min(abs(tx - (y - .3)*.8),abs(tx + (y - .28)*.66));
 trunk=max(trunk,swX(e,-e,bough - .012)*swS(.26,.3,y)*swX(.66,.56,kind==1.?y + .2:y)*swX(.25,.05,abs(uOwn[1])));
 float side=swS(-.5,.5,tx/max(w,.004)*clamp(swL.x*4.,-1.,1.));
 bool birch=kind>.5&&kind<1.5;
 vec3 col=mix(birch?vec3(.5,.46,.5):vec3(.2,.15,.16),birch?vec3(.95,.91,.84):vec3(.55,.4,.3),side);
 if (birch) col*=1. - .45*step(.72,noise(vec2(tx*20.,y*38. + seed)));
 vec3 mid=kind>1.5?vec3(.2,.31,.27):birch?vec3(.72,.55,.2):vec3(.42,.43,.2);
 mid=mix(mid,swInk(uKind[3],1.)*.85,.12 + .4*uPhrase);
 if (fir>0.) mid=mix(mid,vec3(.15,.27,.25) + .12*(hash11(seed*7.7) - .4),.85*fir);
 if (cap>0.) mid=mix(mid,mix(vec3(.66,.42,.32),vec3(.86,.76,.6),hash11(seed*9.1)),.9*cap);
 if (uOwn[7]>0.) {mid=swDye(mid,uKind[3]);col=swDye(col,uKind[4]);}
 if (uOwn[2]<0.) mid=mix(mid,mid*vec3(1.15,1.05,.8) + .06,-uOwn[2]);
 vec3 dark=mid*vec3(.4,.42,.55) + vec3(.02,.02,.05),up=mix(mid*1.3 + .1,vec3(1.,.9,.6),.25)*swSun;
 if (uOwn[2]>0.) up=mix(up,vec3(.95,.97,1.),.9*uOwn[2]);
 vec3 s=swCrown(z,a,b,c);
 trunk*=swS(-.06,.03,y + .06*sin(z.x*160.));
 float al=trunk,mass=swX(.75,.55,s.z);
 if (fir>0.) {float tooth=.5*(.33 - .31*sat((y - .1)/.92))*(1.7 - fract(y*7. + .1));mass=mix(mass,swX(e,-e,abs(z.x) - tooth)*swS(.1,.12,y)*swX(1.05,1.,y),fir);}
 if (cap>0.) {
  float under=a.y - .06,dome=swX(1. + 2.5*e/a.z,1. - 2.5*e/a.z,s.z)*swS(under - e,under + e,y);
  mass=mix(mass,dome,cap);
 }
 al=max(al,mass);col=mix(col,cap>0.?mix(dark,mix(mix(dark,mid,swS(-.7,.1,dot(s.xy,swL))),up,swS(.2,1.,dot(s.xy,swL))*swS(.3,1.,s.y + .6)),cap):dark,mass/max(al,.001));
 vec2 gi=floor(z*15.) - 1.;
 int i=cap>=1.||(fir>=1.&&mass<.01)?9:0;
 if (cap<1.&&i<9) do {
  vec2 id=gi + vec2(i % 3,i/3);
  vec2 r=hash22(id + seed*13.),m=(id + .15 + .7*r)/15.;
  vec2 dz=(z - m)*vec2(.8,1.15);
  if (length(dz)>.052 + e) continue;
  vec3 n=swCrown(m,a,b,c);
  float dab=swX(.052 + e,.052 - e,length(dz))*step(n.z + .25*r.x,1.12)*(1. - cap);
  dab*=mix(1.,mass,fir);
  float lit=.5 + .45*dot(n.xy,swL) + .5*(r.y - .5);
  vec3 dc=mix(mix(dark,mid,swS(.15,.5,lit)),up,swS(.55,.95,lit));
  al=max(al,dab);col=mix(col,dc,dab/max(al,.001));
 } while (++i<9);
 return vec4(col,al);
}
// A stone, and the house with its lamp.
vec4 swStone(vec2 z,float seed,float e) {
 z.x-=(hash11(seed + 2.) - .5)*.3*z.y;
 float n=noise(z*9. + seed*7.),w=.2 - .09*z.y + .03*(n - .5);
 float d=max(abs(z.x) - w,z.y - .95 - z.x*(hash11(seed) - .5) + 5.*z.x*z.x);
 float lit=swS(-.35,.45,z.x/w*swL.x + .5*(noise(z*vec2(16.,9.) + seed) - .5));
 vec3 col=mix(vec3(.42,.41,.5),vec3(.85,.79,.73)*swSun,lit);
 col=mix(col,vec3(.72,.66,.4),.5*swS(.6,.75,n));
 return vec4(col,swX(e,-e,d)*swS(-.04,.03,z.y + .04*sin(z.x*75.)));
}
vec4 swHouse(vec2 z,float e) {
 float wall=max(abs(z.x) - .75,z.y - .5),roof=max(max(z.y - 1.,.45 - z.y),abs(z.x) + (z.y - .45)*.45 - .86);
 float chim=max(abs(abs(z.x) - .6) - .07,abs(z.y - 1.) - .16);
 float al=swX(e,-e,min(min(wall,roof),chim))*step(-.1,z.y);
 vec3 col=mix(vec3(.95,.91,.84),vec3(.8,.78,.8),swX(.2,-.2,z.x*clamp(swL.x*4.,-1.,1.)));
 float pane=swX(e,-e,max(abs(abs(z.x) - .38) - .085,abs(z.y - .26) - .1));
 col=mix(col,mix(vec3(.25,.27,.33),vec3(1.,.78,.36),.3 + .7*uMic),pane);
 swGlow=pane*al*swNight;
 col=mix(col,vec3(.5,.25,.2),swX(e,-e,max(abs(z.x) - .1,z.y - .36)));
 col=mix(col,mix(vec3(.38,.39,.46),vec3(.95,.97,1.),.9*swWhite),swX(e,-e,roof));
 return vec4(col,al);
}
// A town house or a tower.
vec4 swTower(vec2 z,float seed,float e) {
 float h1=hash11(seed*3.7 + 1.),h2=hash11(seed*5.1 + 2.),h3=hash11(seed*7.9 + 3.);
 float w=.17 + .16*h1,eave=(.35 + .4*h2)*(h3>.7?1.25:1.),slim=h3>.7?.55:1.,pitch=h3>.7?.5:1.1 + h1;
 w*=slim;
 float wall=max(abs(z.x) - w,z.y - eave),roof=max(eave - .01 - z.y,(abs(z.x) - w*1.18)*pitch*.9 + (z.y - eave)*.8);
 float al=swX(e,-e,min(wall,roof))*step(-.12,z.y);
 vec3 clay=mix(mix(vec3(.93,.88,.78),vec3(.82,.62,.5),h2),vec3(.75,.75,.78),step(.75,h1));
 clay=swDye(clay,h2>.5?uKind[0]:uKind[2]);
 float lit=swX(.25,-.25,z.x/w*-clamp(swL.x*4.,-1.,1.));
 vec3 col=mix(clay*vec3(.62,.62,.72),clay*swSun,lit);
 vec2 wz=vec2(z.x/w*1.5,(eave - z.y)*7.),wi=floor(wz),wf=abs(fract(wz) - .5);
 float ew=e*7.,pane=swX(ew,-ew,max(wf.x - .17,wf.y - .25))*step(abs(wz.x),1.5)*step(wall,0.)*swX(.5,.2,ew);
 col=mix(col,vec3(.3,.3,.36),pane*.8);
 swGlow=pane*al*swNight*step(hash21(wi + seed*17.),.26 + .5*uPhrase);
 vec3 rc=swDye(mix(vec3(.6,.33,.25),vec3(.4,.42,.5),step(.6,h2)),uKind[3]);
 rc=mix(rc,vec3(.95,.97,1.),.9*swWhite);
 return vec4(mix(col,rc*(.75 + .4*lit),swX(e,-e,roof)),al);
}
// The sky: thin cloud over the dome, closing into rings near the horizon.
vec3 swSky(vec2 dir,float l,vec2 p,vec2 sun) {
 float g=1./sinh(max(l,.05)),drift=uTravel*.00033 + uTime*.00007;
 vec3 col=mix(vec3(.97,.89,.79),vec3(.87,.89,.86),swS(0.,.45,l));
 col=mix(col,vec3(.66,.78,.84),swS(.3,1.4,l));
 vec2 q=rot(.6)*dir*g*1.7 + 60.*vec2(cos(drift),sin(drift));
 q+=.8*vec2(noise(q*.9 + 5.),noise(q*.9 + 11.));
 float far=swX(10.,2.5,g);
 float c=.5*noise(q) + .28*mix(.5,noise(rot(1.)*q*2.1 + 4.),far) + .22*mix(.5,noise(rot(2.1)*q*4.6 + 9.),far*far);
 float ds=length(sun - p),eve=swEve,night=swNight,body=swS(.45,.69,c);
 vec3 cl=mix(vec3(.985,.95,.9),vec3(.8,.81,.85),.7*swS(.56,.82,c));
 if (night>0.) {
  vec3 nc=mix(vec3(.2,.25,.36),mix(vec3(.08,.1,.19),vec3(.02,.025,.06),swS(.3,1.3,l)),swS(0.,.4,l));
  int i=0;do {
   float n=i==0?26.:48.;
   vec2 sp=rot(.4 + float(i))*p*n,id=floor(sp),h=hash22(id + 7.);
   float rr=.06 + .09*h.x*h.x*h.x,sd=length(fract(sp) - .5 - .6*(h - .5)),w=n/uRes.y;
   nc+=vec3(.95,.95,1.)*swX(rr + w,rr - w,sd)*step(.62,h.y)*(.5 + .35*sin(uTime*(.4 + h.x) + h.y*40.))*(i==0?1.:.6);
  } while (++i<2);
  col=mix(col,nc,night);cl=mix(cl,vec3(.16,.19,.28),night);body*=1. - .75*night;
 }
 if (eve>0.) {
  vec3 ec=mix(vec3(1.,.77,.48),vec3(.86,.47,.4),swS(0.,.4,l));
  ec=mix(ec,vec3(.42,.3,.44),swS(.25,.95,l));ec=mix(ec,vec3(.2,.19,.33),swS(.8,1.7,l));
  col=mix(col,ec,eve);cl=mix(cl,mix(vec3(.98,.64,.44),vec3(.48,.34,.46),swS(.1,1.2,l)),eve);
 }
 if (uOwn[7]>0.) {col=swDye(col,mix(mix(uKind[1],vec3(1.),.45),uKind[1],swS(0.,.9,l)));cl=swDye(cl,mix(uKind[1],vec3(1.),.35));}
 col=mix(col,cl,body*.75*swS(.02,.35,l));
 if (night>0.) col=mix(col,vec3(.6,.68,.85),.35*night*exp(-ds*9.));
 vec3 warm=mix(vec3(1.,.92,.78),vec3(1.,.66,.36),eve);
 col=mix(col,warm,(1. - .95*night)*(.3 + .35*uLevel)*exp(-ds*4.5));
 col=mix(col,vec3(1.,.975,.91),max(swX(.034,.031,ds),.5*exp(-ds*ds*260.))*(.65 + .35*uLevel)*(1. - abs(uOwn[4])));
 if (eve>0.) col=mix(col,mix(vec3(1.,.8,.48),vec3(.98,.52,.32),sat(.5 + (sun.y - p.y)*4.)),sat(eve*4.)*swX(.002,-.002,ds - .032 - .083*eve)*(.8 + .2*uLevel));
 if (night>0.) col=mix(col,vec3(.93,.92,.86)*(.8 + .25*noise((p - sun)*42. + 4.)),night*swX(.052,.049,ds)*(.85 + .15*uLevel));
 return col;
}
vec3 render(vec2 p) {
 bool sky=uVar>.5;
 float wide=.5*uRes.x/uRes.y,fit=swS(.2,.75,wide);
 // the hand: no edge is ruled
 vec2 pw=p + .003*(vec2(noise(p*30.),noise(p*30. + 31.)) - .5);
 vec2 mid=sky?vec2(.07*fit,.015):vec2(-.17*fit,-.045);
 float R=(sky?.29:.275)*mix(1.04,.96,uSpace)*mix(.52,1.,fit);
 float full=swFull,grand=max(uOwn[5],0.),tiny=max(-uOwn[5],0.),few=swFew,sea=swSea,town=swTown,white=swWhite,sand=swSand;
 vec2 mid0=mid;
 if (grand>0.) {mid=mix(mid,sky?vec2(.12*fit,.1):vec2(.1*fit,-.82),grand);R*=1. + (sky?.75:1.35)*grand;}
 if (tiny>0.) {mid=mix(mid,sky?vec2(0.,.05):vec2(.02*fit,-.06),tiny);R*=1. - (sky?.52:.58)*tiny;}
 vec2 sun=mid + (sky?R*vec2(-.34,.4):vec2(mix(.16,.62,fit),.33));
 if (!sky&&uOwn[5]!=0.) sun+=(mid0 - mid)*mix(1.,.85,grand) + vec2(0.,.02);
 if (uOwn[4]<0.) sun=mix(sun,mid + R*(sky?vec2(-.5,.42):mix(vec2(.95,.75),vec2(.35,1.02),grand)),-uOwn[4]);
 vec2 az=normalize(sun - mid);
 vec2 q=pw - mid;float r=max(length(q),.0005);
 vec2 er=q/r,et=vec2(-er.y,er.x);
 float l=log(r/R);if (sky) l=-l;
 float roll=fract(uTravel*.007),turn=atan(q.y,abs(q.x)<1e-6?1e-6:q.x)/TAU;
 float u=fract(turn + roll),a=u*TAU,e=.9/(uRes.y*r);
 vec2 land=vec2(cos(a),sin(a));
 swL=normalize(vec2(dot(az,et),.45));
 swSun=mix(vec3(.94,.94,.98),vec3(1.06,1.,.9),.3 + .7*uLevel);
 swGlow=0.;
 swDim=mix(vec3(1.),vec3(.29,.36,.54),swNight)*mix(vec3(1.),vec3(.72,.55,.56),swEve);
 float dh=swGap(u,uLoop),here=exp(-dh*dh*130.);
 float dw=swGap(turn - .25,1. - uCue),gust=exp(-dw*dw*60.)*uCue;
 swWave=exp(-dw*dw*60.)*4.*uCue*(1. - uCue);
 float grow=(sky?1.25:1.2)*(1. + (sky?.2:.65)*tiny - grand*(sky?.15:.3));
 vec3 col=vec3(0.),air=vec3(.94,.89,.83);
 if (uOwn[4]!=0.) air=mix(air,uOwn[4]>0.?vec3(.2,.25,.36):vec3(.95,.66,.46),abs(uOwn[4]));
 air=swDye(air,mix(uKind[1],vec3(1.),.3));
 float face=.5 + .5*dot(er,az)*(sky?-.6:min(1.,r/R));
 // the folds and what stands on them
 int st=-1,last=-1,first=4,end=-1;float top[4];int own[3];
 int k=0;do {
  float f=float(k);
  top[k]=swFold(k,a) + .03*(swLine(u*(41. - 6.*f),41. - 6.*f,30. + f) - .5)*(1. - sea)*(1. - .8*swFlat);
  if (l<top[k] - e) st=k;
  bool any=l<top[k] + .03 + .03*f;
  if (any) last=k;
  if (k<3) {
   int n=k==0?9:k==1?5:3;
   int i=(k==0?0:k==1?9:14) + min(int(fract(u - .035*max(l - top[k],0.))*float(n)),n - 1);
   if (few>.5) i=k==0?(abs(swGap(u,.5))<.07?4:2):k==1?9:15;
   vec4 o=swO[i];
   float dx=abs(swGap(u,o.x))*TAU,h=o.z*grow;
   if (few>0.) h*=mix(1.,i==2?1.2:i==4?1.1:i==15?1.2:0.,few);
   if (uOwn[3]!=0.||uOwn[6]!=0.) o.y+=swFold(k,o.x*TAU) - swFold0(k,o.x*TAU);
   if (full>0.||town>0.) any=any||(l>top[k] - .1&&l<top[k] + .55);
   bool in1=h>.03&&l>o.y - .03&&l<o.y + h*1.5&&dx<h*(o.w==1.?.75:1.2);
   own[k]=in1?i:-1;
   any=any||in1;
  }
  if (any) {first=min(first,k);end=k;}
 } while (++k<4);
 first=max(first,st);
 if (st<0) {
  col=swSky(er,l,p,sun);
  if (l<.6 + swPeak) {
   // far hills, and middle hills with firs
   float bh=band(1. - abs(2.*fract(u + .1) - 1.));
   float hf=.03 + .27*pow(swLine(u*5.,5.,1.),1.7) + .06*swLine(u*17.,17.,2.) + .014*swLine(u*70.,70.,3.) + .16*bh*(.35 + .65*swLine(u*23.,23.,7.));
   vec3 fc=mix(vec3(.57,.64,.77),swInk(uKind[0],.7)*.6 + .3,.1 + .25*uDrone)*(.92 + .16*face);
   if (swPeak>0.) {// sharp ones in two ranks
    float lit=0.,hb=0.;
    int j=0;do {
     float N=j==0?11.:19.,x=u*N + .5*float(j),h=hash21(vec2(mod(floor(x),N),51. + float(j))),w=fract(x) - .3 - .4*h;
     w+=.1*(noise(vec2(u*90.,l*16.)) - .5) + .07*(noise(vec2(u*240.,l*45.)) - .5);
     float tp=(j==0?.38 + .4*h:.25 + .24*h)*(1. - abs(w)/(w<0.?.42 + .3*h:.72 - .3*h)) + .08*bh;
     hb=max(hb,tp);
     if (l<tp) lit=swS(-.03,.03,w*-clamp(swL.x*5.,-1.,1.));
    } while (++j<2);
    hf=mix(hf,hb,swPeak);
    fc=mix(fc,mix(mix(vec3(.22,.26,.36),vec3(.56,.52,.53),lit),mix(vec3(.6,.68,.83),vec3(1.,.98,.96),lit),swS(.2,.25,l + .16*noise(vec2(u*120.,l*8.)) + .12*white)),.95*swPeak);
   }
   hf-=.9*swFlat;
   if (uOwn[7]>0.) fc=mix(swDye(fc,mix(uKind[0],uKind[1],.4)),fc,.6*swPeak);
   fc=mix(fc,vec3(.9,.93,1.)*(.85 + .2*face),.65*white*(1. - swPeak))*swDim;
   fc=mix(fc,air,(1. - .6*swPeak)*.15 + .2*uSpace + .5*swX(.12,-.02,l));
   col=mix(col,fc,swX(e,-e,l - hf));
   float ht=swLine(u*9.,9.,11.),hm=-.05 + .24*pow(ht,1.4) + .04*swLine(u*31.,31.,12.) + .2*uDrone*swLine(u*5. + .5,5.,14.);
   float copse=swLine(u*13.,13.,8.),fu=u*260.,ft=max(0.,1. - 2.4*abs(fract(fu) - .5))*(.4 + .6*hash21(vec2(floor(fu),5.)));
   float wood=swS(.45,.6,copse)*swS(-.07,-.02,l - hm);
   hm+=.04*ft*swS(.5,.62,copse)*(1. - sand);
   vec3 mc=mix(vec3(.6,.52,.61),vec3(.65,.65,.5),swS(.2,.8,noise(land*exp(l)*8. + 3.)));
   mc=mix(mc*(.82 + .3*face),vec3(.33,.43,.45),.85*wood);
   mc=mix(mc,swInk(uKind[0],.8)*.75,.3*uDrone);
   if (uOwn[2]!=0.||uOwn[7]>0.) {mc=mix(mc,mix(vec3(.9,.93,.99),vec3(.4,.48,.56),.8*wood),.85*white);mc=mix(mc,vec3(.87,.7,.5)*(.82 + .3*face),.9*sand);mc=swDye(mc,uKind[0]);}
   mc*=swDim;hm-=.8*swFlat + .6*sea;
   mc=mix(mc,air,.08 + (.2 + .5*uSpace)*swX(.05,-.1,l - .06*swLine(u*13. + .5,13.,4.)));
   col=mix(col,mc,swX(e,-e,l - hm));
  }
 }
 // the moor lies as a plain under the eye
 float under=1./sinh(max(-l,.08));
 vec2 g=land*under;
 float shade=0.,pool=0.,shore=0.,pa=0.,pb=0.,pd=0.,tr=0.,str=0.,deep=0.;vec4 pc=vec4(0.);
 if (last>=0) {
  vec2 sg=rot(-roll*TAU)*az;// the sun's way, turned with the land
  int i=0;do {
   vec4 o=swB[i];
   vec2 dg=g - o.xy;
   float al=-dot(dg,sg)/(o.z*1.8),ac=abs(dg.x*sg.y - dg.y*sg.x)/o.z;
   float broad=o.w<2.5?.04 + .2*swS(.4,.75,al):.14;
   if (few>0.) al=mix(al,i==2||i==4||i==15?al:9.,few);
   shade=max(shade,swS(-.02,.02,al)*swX(1.05,.5,al)*swX(.05,-.05,ac - broad));
  } while (++i<17);
  if (sea>0.) {
   float isle=9.;
   i=0;do {
    vec4 o=swO[i];
    vec2 d=vec2(swGap(u,o.x)*TAU/(.36 + .3*o.z),(l - o.y + .09)/(.1 + .3*o.z*(o.y<-.25?1.:.6)));
    isle=min(isle,dot(d,d));
   } while (++i<17);
   float n=noise(vec2(sin(a)*4. + 9.,l*6.)) + noise(land*9. + l*7.)*.6;
   deep=swS(0.,.12,isle - mix(9.5,.55,sea) + .5*(n - .8));
  }
  pa=noise(g*1.6 + 3.);pb=noise(g*5. + 11.);pd=noise(g*2.6 + 27.);str=noise(land*r*(sky?75.:140.) + 9.);
  pb=mix(.5,pb,swX(9.,4.,under));pd=mix(.45,pd,swX(12.,6.,under));
  i=0;if (town<1.) do {
   float at=i==0?.2:i==1?.56:i==2?.755:.06,oa=TAU*at,far=i==0?2.6:i==1?1.75:i==2?3.2:.42;
   vec2 dg=g - vec2(cos(oa),sin(oa))*far;
   float full=max(far,1.1)*(.17 + .07*uPad + .09*swSeam(at)*piece(vec2(at,.5)).a);
   float d=length(rot(oa)*dg*vec2(1.25,.8)) - full + (far<1.?.1:.6)*(pa - .5) + .2*min(far,1.)*(pb - .5);
   pool=max(pool,swX(.02,-.02,d));shore=max(shore,swX(.07,0.,d/min(far,1.)));
  } while (++i<(sky?3:4));
  pool*=1. - town;shore*=1. - town;
  if (sand>0.) {pool*=1. - sand;shore*=1. - .6*sand;if (sky) str=mix(str,noise(land*r*230. + 9.),sand);}
  if (sea>0.) {shore=max(shore*(1. - sea),4.*deep*(1. - deep));pool=max(pool*(1. - sea),deep);}
  pc=piece(vec2(u,sat(.06 - l*.7)))*swSeam(u)*(sky?1.:swS(.6,1.7,under));
  if (!sky) {float still=swX(1.6,.3,under);pb=mix(pb,.5,.6*still);str=mix(str,.5,.6*still);}
  tr=(1. - sand)*(1. - sea)*(1. - town)*swX(.06,.045,abs(under - 1.25 - .45*sin(a + 1.) - .3*sin(3.*a) + .12*(pb - .5)));
 }
 k=first;if (k<=end) do {
  float f=float(k);
  if (k<=last) {
   float rh=.03 + .028*f,tp=top[k],d1=max(tp - l,0.);
   // the fringe of grass
   float N=floor(TAU/(.2*rh)),wind=.15 + .15*sin(uTime*.7 + a*5.) + 1.4*swWave;
   float up=max(l - tp + .4*rh,0.),s=u - wind*up*up/rh/TAU,c1=s*N,c2=s*floor(N*.4) + .3;
   float bl=max((1. - 2.*abs(fract(c1) - .5))*hash21(vec2(mod(floor(c1),N),f)),(1. - 2.*abs(fract(c2) - .5))*hash21(vec2(mod(floor(c2),floor(N*.4)),f + 9.)));
   float tuft=swLine(u*47.,47.,f + 60.);
   float cv=swS(-e,e,tp + rh*bl*(.25 + 1.1*tuft)*(1. + .3*uTexture)*(1. - deep)*(1. - (.9 + .09*sand)*sand)*(1. - .7*white)*(1. - .8*town) - l);
   if (cv>0.) {
    float was=swGlow;swGlow=0.;
    // the ground in broad strokes, and the piece where it lies
    vec3 gc=mix(vec3(.56,.64,.42),vec3(.91,.84,.61),swS(.38,.62,pa*.55 + pb*.3 + (sky?.14:.3)*(str - .5)));
    float hea=swS(.5,.56,pd*.6 + .3*pb + .05 + (sky?.12:.16)*(str - .5) + .08*uTexture + .1*pc.a);
    vec3 hc=mix(vec3(.62,.42,.57),swInk(uKind[2],1.)*.8 + .1,.12 + .4*uTexture);
    vec3 sown=swInk(pc.rgb/max(pc.a,.04),1.)*.75 + .28;
    hc=mix(hc,sown,(sky?.75:.55)*sat(pc.a*1.5));
    if (sand>0.) {
     float rip=sin(l*60./(1. + .4*f) + 6.*pa + 3.*swLine(u*13.,13.,40. + f)),dune=noise(vec2(sin(a)*2. + f*5.,l*3.));
     gc=mix(gc,mix(vec3(.72,.53,.38),vec3(.96,.83,.62),swS(.2,.8,dune + (sky?.26:.16)*rip + .2*(str - .5))),sand);hea*=1. - .85*sand;
    }
    if (white>0.) {gc=mix(gc,mix(vec3(.74,.8,.9),vec3(.98,.98,1.),swS(.3,.7,pa*.7 + .2*pd + .1*str)),.94*white);hea*=1. - .8*white;}
    if (uOwn[7]>0.) {gc=swDye(gc,uKind[0]);hc=swDye(hc,uKind[2]);}
    gc=mix(gc,hc,hea*.8)*(.86 + .22*str);
    if (town>0.) {
     float ring=floor(l*9.),N=44.;vec2 tz=vec2(u*N + .5*mod(ring,2.),l*9.),ti=vec2(mod(floor(tz.x),N),ring),tf=fract(tz) - .5,th=hash22(ti + 3.);
     float et=e*9.,plot=swX(.43 + et,.43 - et,abs(tf.x))*swX(.36 + et,.36 - et,abs(tf.y)),sid=th.x>.5?tf.x:tf.y;
     vec3 rc=swDye(mix(mix(vec3(.66,.38,.28),vec3(.8,.55,.38),th.y),vec3(.5,.52,.58),step(.8,th.y)),mix(uKind[3],uKind[0],th.x));
     rc=mix(rc,vec3(.93,.95,1.),.9*white)*(.82 + .3*swS(-et,et,sid));
     float yard=step(th.y,.14);
     rc=mix(rc,gc*.9,yard);
     vec3 st=swDye(vec3(.86,.8,.7),mix(uKind[0],vec3(1.),.5));
     gc=mix(gc,mix(st,rc,plot*swX(.45,.25,et)),town*swX(-.02,-.12,l - tp));
     gc=mix(gc,gc*.5 + .6*pc.rgb,town*sat(pc.a)*plot*.8);
     swGlow=(1. - plot)*swNight*town*.2*step(th.x,.5);
    }
    gc=mix(gc,vec3(.93,.86,.74),tr*.9);
    // tufts and small flowers in rows out of step
    int i=0;do {
     float Nt=floor(TAU/(1.1*rh)),y=(tp - l)/rh + float(i)*.5,row=floor(y),x=s*Nt + .37*row + .5*float(i),ci=floor(x);
     vec2 hh=hash22(vec2(mod(ci,Nt),row + 50.*f + 25.*float(i)));
     vec2 z=vec2(fract(x) - .5 - .3*(hh.x - .5),1. - (y - row));// z.y: 0 at the foot, 1 at the top
     float ez=e/rh,seen=step(0.,row)*swX(.24,.1,ez);
     float keep=step(.45 - .25*tuft,hh.y)*seen*(1. - sand)*(1. - .8*white)*(1. - town);
     float fan=z.x/(.2 + .36*z.y),env=(1. - 1.5*fan*fan)*(.5 + .5*hh.x);
     float blades=swS(-.3,.3,sin(fan*30. + hh.x*9.) + .9 - z.y/max(env,.1));
     float tu=keep*swX(ez,-ez,z.y - env)*swX(.5,.4,abs(fan))*blades;
     vec3 tc=mix(gc*vec3(.74,.76,.78),mix(vec3(.98,.9,.62),hc*1.25 + .08,hea),swS(.1,.8,z.y));
     gc=mix(gc,tc,tu*(sky?.6:.85)*(1. - tr));
     float petal=length(z - vec2(.12,.45)) - (.05 + .15*uKeys);
     gc=mix(gc,i==0?vec3(.99,.97,.92):vec3(.98,.84,.35),step(hh.y,.2)*step(0.,row)*(1. - max(max(sand,white),town))*swX(.6,.2,ez)*swX(ez,-ez,petal));
    } while (++i<2);
    // the keys open larger flowers on the ball
    if (!sky&&uKeys>.01&&under<4.) {
     vec2 ci=floor(g*3.4),hh=hash22(ci + 70.),z=fract(g*3.4) - .3 - .4*hh;
     float ez=6.*e/max(-l,.3),d=length(z) - .2*uKeys*(1. + .13*cos(5.*atan(z.y,z.x + 1e-5)));
     float open=step(hh.y,.55)*swX(ez,-ez,d)*swX(4.,2.,under)*sat(uKeys*6.);
     gc=mix(gc,mix(vec3(1.,.8,.3),vec3(1.,.98,.94),swS(.03,.06,length(z))),open*(1. - tr));
    }
    gc*=mix(vec3(1.),vec3(.74,.74,.82),swS(.02,.45,d1)*.8);
    float lum=mix(sky?.82:.68,1.16,swS(.15,.75,face));
    vec3 light=mix(sky?vec3(.82,.84,.97):vec3(.86,.95,1.22),vec3(1.),swS(.78,1.,lum))*lum*swSun;
    light*=mix(vec3(1.),vec3(.52,.55,.74),shade*.8);
    light*=1. + vec3(.3,.25,.14)*here*(sky?1.:swS(.1,1.3,under))*(.4 + .6*uEnergy + .5*uLevel);
    light+=vec3(.4,.37,.3)*gust*(.4 + .8*str);
    gc*=light*swDim;
    // pools hold the sky
    float near=k<3||!sky?1.:0.;
    vec3 wc=mix(vec3(.56,.7,.81),vec3(.96,.94,.89),swS(.25,.75,noise(vec2(abs(swGap(u,.4))*31.,sky?l*42. + 3.*sin(uTime*.04):under*6. + sin(uTime*.06))) + .5*(pa - .5)));
    wc=mix(wc,swInk(uKind[1],.9)*.5 + .45,.12 + .45*uPad);
    if (sea>0.) near=1.;
    if (abs(uOwn[4]) + white + uOwn[7]*step(0.,uOwn[7])>0.) wc=mix(swDye(wc,uKind[1]),vec3(.88,.92,.96),.6*white)*mix(vec3(1.),vec3(.28,.36,.54),swNight)*mix(vec3(1.),vec3(1.05,.68,.5),swEve);
    if (sea>0.) {
     float q=abs(swGap(u,.4)),wv=.65*noise(vec2(q*42.,l*22. - uTime*.09)) + .35*noise(vec2(q*110. + 3.,l*64. + uTime*.12));
     wc=mix(wc,wc*mix(vec3(.58,.72,.78),vec3(1.),swS(.34,.66,wv))*(.75 + .4*face)*(1. + .4*here) + pc.rgb*.45*swS(.35,.65,wv),sea);
    }
    gc=mix(gc,sea>0.?mix(gc*vec3(.45,.42,.42),gc*.5 + wc*.6 + .1,sea):gc*vec3(.45,.42,.42),.8*shore*near);
    gc=mix(gc,wc,pool*near);
    gc=mix(gc,air,(1. - deep)*.4*exp(-f*1.3)*swS(.02,.16,d1)*(.5 + uSpace));
    col=mix(col,gc,cv);swGlow=mix(was,swGlow,cv);
   }
  }
  // a crowd of small ones
  int j=0;if ((full>0.||town>0.)&&k<3) do {
   float N=k==0?31.:k==1?21.:14.,fj=float(j),ci=floor(u*N + .5*fj),id=mod(ci,N);
   float h1=hash21(vec2(id,f*7. + fj*31. + 4.)),h2=hash21(vec2(id + 3.,f*5. + fj*17.)),cu=(ci + .5 - .5*fj + .3*(h1 - .5))/N;
   float wood=full>0.?swS(h2*.8,h2*.8 + .3,full*1.15):0.,built=town>0.?swS(h1*.7,h1*.7 + .3,town*1.05):0.;
   bool ht=built>0.&&(h2<.82||full==0.);
   float foot=swFold(k,cu*TAU) - .04 - .06*fj,h=TAU/N*(ht?1.5:mix(1.15,1.6,swFir))*(.65 + .6*h2)*(ht?built:wood) ;
   if (!ht) h*=1. + .3*swLoud(fract(cu));
   if (sea>0.) {// only on the islands
    float on=1.;
    int i=k==0?0:k==1?9:14;
    do on=min(on,abs(swGap(cu,swO[i].x))*TAU/(.36 + .3*swO[i].z)); while (++i<(k==0?9:k==1?14:17));
    h*=mix(1.,step(on,.55),sea);
   }
   if (h<.02) continue;
   vec2 z=vec2((fract(u - cu + .5) - .5)*TAU,l - foot)/h;
   if (abs(z.x)>.6||z.y<-.1||z.y>1.5) continue;
   float was=swGlow;swGlow=0.;
   vec4 c=town>0.&&(ht||full==0.)?swTower(z,id*.31 + f + .5*fj,e/h):swTree(z,floor(h1*2.99),id*.37 + fj,e/h,.05 + .02*sin(uTime*.8 + id) + .3*swWave);
   col=mix(col,mix(c.rgb*swDim,air,k==0?.12:0.),c.a);swGlow=mix(was,swGlow,c.a);
  } while (++j<2);
  // what stands here
  int i=k<3?own[min(k,2)]:-1;
  if (i>=0) {
   vec4 o=swO[max(i,0)];
   float h=o.z*grow;
   if (few>0.) h*=mix(1.,i==2?1.2:i==4?1.1:i==15?1.2:0.,few);
   if (uOwn[3]!=0.||uOwn[6]!=0.) o.y+=swFold(k,o.x*TAU) - swFold0(k,o.x*TAU);
   h=max(h,.02);
   if (o.w<2.5) h*=1. + .35*swLoud(o.x) + .08*uPhrase;
   vec2 z=vec2(swGap(u,o.x)*TAU,l - o.y)/h;
   vec4 c=vec4(0.);float was=swGlow;swGlow=0.;
   if (town>.5&&o.w!=4.) c=swTower(z,float(i) + 2.,e/h);
   else if (town<=.5&&o.w<2.5) c=swTree(z,o.w,float(i)*.37 + .2,e/h,.14 + .012*sin(uTime*.8 + float(i)) + .3*swWave);
   else c=o.w<3.5?swStone(z,float(i),e/h):swHouse(z,e/h);
   if (o.w>2.5) c.rgb=swDye(c.rgb,o.w<3.5?uKind[2]:mix(uKind[4],vec3(1.),.5));
   c.rgb=mix(c.rgb*swDim,air,k==0?.1:0.);
   col=mix(col,c.rgb,c.a);swGlow=mix(was,swGlow,c.a);
  }
 } while (++k<=end);
 float hg=uHits*exp(-9.*(dh*dh*12. + (l - .1)*(l - .1)*.5));
 col=mix(col,vec3(1.,.8,.42),swGlow*(.75 + .25*uLevel));
 if (uOwn[4]>0.) {vec2 wz=vec2(swGap(u,.5)*TAU,l + .06)/.3;col+=vec3(.5,.33,.12)*uOwn[4]*exp(-2.*dot(wz,wz))*(.5 + uMic);}
 // a hit: birds go up from the ground where the loop is, in a breath of light
 int i=uHits>.01?0:5;if (i<5) do {
  float fi=float(i),up=1. - uHits;
  vec2 z=vec2(dh*TAU,l) - vec2((fi - 2.)*(.13 + .07*up),.5*up + .16*hash11(fi + 3.));
  if (i==0) col=mix(col,mix(vec3(1.,.93,.76),swInk(uKind[4],1.),.45),.75*uHits*exp(-9.*(dh*dh*30. + (l + .05)*(l + .05))));
  z.x=abs(z.x);
  float y=z.y - z.x*.7*sin(uTime*8. + fi*2.) + z.x*z.x*6.;
  col=mix(col,vec3(.2,.17,.24),swX(.006 + e,.006 - e,abs(y) - .003*(1. - z.x*14.))*swX(.05,.042,z.x)*swS(0.,.2,uHits));
 } while (++i<5);
 if (white>0.) col=mix(col,uKind[4],.5*hg*white);
 // a voice: lamplight round the house
 vec2 hz=vec2(swGap(u,.5)*TAU,l + .03)/.24;
 col=mix(col,vec3(1.,.76,.38),.7*uMic*exp(-dot(hz,hz))*sat(dot(col,vec3(.5))));
 // the wind of a cue in the air over the land
 col=mix(col,vec3(1.,.96,.88),.35*gust*exp(-6.*l*l)*swS(-.2,.1,l));
 // snow falls toward the middle
 i=0;if (white>0.) do {
  float N=i==0?60.:96.,fi=float(i),lf=(l*(sky?-1.:1.))*N/TAU + (sky?-1.:1.)*uTime*(.35 + .2*fi);// toward the middle of the picture, or out of its sky
  float row=floor(lf);vec2 fz=vec2(u*N + .4*sin(uTime*.3 + row),lf),id=vec2(mod(floor(fz.x),N),mod(row,512.)),h=hash22(id + 11.);
  float w=e*N/TAU,rr=.05 + .1*h.x*h.x;
  col=mix(col,vec3(.98,.99,1.),white*step(.76,h.y)*.85*(sky?swS(-.6,0.,l):swS(-.25,.15,l))*swX(rr + w,max(rr - w,0.),length(fract(fz) - .5 - .55*(h - .5)))*swX(1.,.35,w));
 } while (++i<2);
 // engraved: rings of ink for the half dark, lines across them for the dark
 if (uOwn[7]<0.) {
  float g=sqrt(sat(dot(col,vec3(.3,.59,.11)))),px=1./uRes.y,pw1=max(.0062,3.2*px),w=.8*px/pw1,bend=.3*noise(p*9.);
  float r1=abs(fract(r/pw1 + bend) - .5),r2=abs(fract((p.x*.8 + p.y*.6)/pw1 + bend) - .5),t1=.44*sat((.93 - g)*1.6),t2=.36*sat((.52 - g)*2.2);
  float ink=max(swX(t1 + w,t1 - w,r1)*swS(0.,.06,t1),swX(t2 + w,t2 - w,r2)*swS(0.,.06,t2));
  col=mix(col,mix(mix(vec3(.96,.93,.86),uKind[4],.6*hg),mix(vec3(.13,.12,.14),col*.6,.4),max(ink,swX(.26,.16,g))),-uOwn[7]);
 }
 // the tone dial: veiled to clear
 return mix(col,swS(0.,1.,col),.5*(uTone - .5))*mix(vec3(.96,.98,1.03),vec3(1.02,1.,.97),uTone);
}
