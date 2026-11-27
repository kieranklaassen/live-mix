// name: Passed along
// a: Arms by day
// b: Lamps at anchor
// what: Hill behind hill at dawn, with a tower and three jointed arms on crest after crest, the nearest huge at the left, the last a tick in the haze, each taking up the shape of the one before; or ships at anchor on a foggy night, where a blinking lamp is answered hull by hull.
// follows: The phrase opens the near arms or the near lamp, and farther stations repeat the message seconds later. The drone lifts the mist, the pad lights the sky, texture brings birds or glints on the water, the bands lean the arms, the loop moves the sun or a boat's beam, a hit lights one station after another, a cue all at once, keys the windows.
// own: 0 snow or blue cold at -1, harvest gold or amber at 1; 1 night at -1, day at 1; 2 clear air at -1, thick fog at 1; 3 flat land or mirror water at -1, mountains or chop at 1; 4 the nearest stands back at -1, fills the frame at 1; 5 few stations at -1, many at 1; 6 beacon fires (b: low rowing boats) at -1, masts of flags (b: ships under sail) at 1; 7 islands in a sea (b: cliffs round the water) at -1, flat topped buttes (b: a great low moon or sun) at 1
float paW,paPx; // half the width drawn for, one pixel
float paSnow,paGold,paDark,paBright,paFlat,paSharp;
#define PA_M6 max(-uOwn[6], 0.)
#define PA_P6 max(uOwn[6], 0.)
#define PA_M7 max(-uOwn[7], 0.)
#define PA_P7 max(uOwn[7], 0.)
float paDn(float a,float b,float x) { return 1.-smoothstep(b,a,x); } // falls from a to b
float paH1(float n) { n=fract(n*.1031); n*=n+33.33; n*=n+n; return fract(n); }
float paN(float x) { float i=floor(x),f=x-i; f=f*f*(3.-2.*f); return mix(paH1(i),paH1(i+1.),f); }
float paSeg(vec2 p,vec2 a,vec2 b) { vec2 d=b-a; return length(p-a-d*sat(dot(p-a,d)/max(dot(d,d),1e-6))); }
float paCov(float d,float px) { return sat(.5-.5*d/px); }
vec3 paHour(vec3 dawn,vec3 day,vec3 dark) { return mix(mix(dawn,day,paBright),dark,paDark); }
vec2 paTurn(vec2 q,float a) { float c=cos(a),s=sin(a); return vec2(c*q.x+s*q.y,c*q.y-s*q.x); }
// The nearest is smaller in a narrow picture.
float paFit() { return mix(.62,1.,sat((paW-.28)/.5)); }
// How station n is lit: a hit runs back along them, a cue lights all.
float paEcho(float n) {
 float hit=n<.5?uHits*uHits:sat(1.-abs(uHits-1.+.19*n)*5.)*sat(uHits*5.);
 return max(hit,uCue);
}

// ---- a: arms by day
// Across (of the half width), which ridge, how big, which in the line.
const vec4 PA_POST[8]=vec4[8](
 vec4(.53,0.,.0125,4.),vec4(.02,0.,.016,5.),vec4(.37,1.,.023,3.),vec4(-.14,2.,.038,4.),
 vec4(.68,3.,.043,2.),vec4(.19,4.,.085,1.),vec4(.88,5.,.125,2.),vec4(-.66,7.,.37,0.));
// Beam, left arm, right arm: one held shape after another.
vec3 paShape(float k) {
 k=mod(k,61.);
 vec3 h=floor(8.*vec3(paH1(k+3.),paH1(k+91.),paH1(k+157.)))-3.5;
 return vec3(sign(h.x)*(abs(h.x)>2.?.9:.3),sign(h.yz)*(.48+.55*abs(h.yz)));
}
vec3 paPose(float t) {
 float k=floor(t/9.),f=t/9.-k;
 return mix(paShape(k-1.),paShape(k),smoothstep(0.,.24,f));
}
// A worn crest, not a fold.
float paAbs(float x) { return sqrt(x*x+.012); }
float paBase(float near) { return .068-.468*near*(.72+.28*near); }
float paRidge(float x,float fi) {
 float near=fi/6.,u=x*mix(2.7,.95,near)+fi*13.7;
 float n1=paN(u),n2=paN(u*2.3+3.),h=n1+.36*n2-.68;
 if (PA_P7>0.) h=mix(h,.95*smoothstep(.02,.1,h)+.5*smoothstep(-.34,-.3,h)-.75+.12*h,PA_P7);
 h-=.4*PA_M7;
 if (paSharp>0.) h=mix(h,1.1-paAbs(2.2*n1-1.1)+.45*(1.-paAbs(2.*n2-1.))-.7,paSharp);
 h*=mix(.052,.14,near)*(1.-.85*paFlat)*(1.+.8*paSharp*(1.-.6*near));
 float kx=(x-PA_POST[fi<.5?0:int(fi)+1].x*paW)/mix(.1,.34,near);
 return paBase(near)+h+mix(.018,.1,near)*(1.+.5*PA_M7)*exp(-kx*kx)*(1.-.4*paFlat);
}
float paTide(float near) { return paBase(near)+.004-.6*(1.-PA_M7); }
// One slatted arm lying along x from a to b, half as wide as w.
float paArm(vec2 q,float a,float b,float w,float px) {
 float whole=paCov(max(abs(q.x-.5*(a+b))-.5*(b-a),abs(q.y)-w),px);
 float s=fract((q.x+q.y*.45)*19.);
 float slat=smoothstep(0.,19.*px,.33-abs(s-.5));
 float rail=paCov(abs(abs(q.y)-w+.012)-.012,px);
 float ends=paCov(min(abs(q.x-a-.015),abs(q.x-b+.015))-.018,px);
 return whole*max(max(slat,rail),max(ends,smoothstep(.008,.013,px)));
}
// A station round its pivot, the mast one unit long: wood, stone, window, arms.
vec4 paStation(vec2 q,vec3 pose,float px,bool fine) {
 float mast=0.,stone=0.,win=0.,arm=0.,t=.75*px;
 if (dot(q,q)<2.) {
  const float few=max(1.-PA_M6-PA_P6,.02);
  q /= few; px /= few;
  vec2 b=paTurn(q,pose.x);
  arm=paArm(b,-.8,.8,.052+t,px);
  for (int s=0; s<2; s++) {
   vec2 e=paTurn(vec2((s==0?-b.x:b.x)-.8,b.y),s==0?pose.y:pose.z);
   arm=max(arm,paArm(e,-.02,.6,.046+t,px));
   if (fine) arm=max(arm,max(paCov(paSeg(e,vec2(0.),vec2(-.24,0.))-.007,px),paCov(length(e+vec2(.24,0.))-.028,px)));
  }
  arm=max(arm,paCov(length(q)-.05-t,px))*step(.03,few);
  q*=few; px*=few;
 }
 if (q.y<.1&&abs(q.x)<.5) {
  float w=.052-.028*q.y,in_=max(q.y,-1.02-q.y);
  if (fine) {
   float d=min(abs(abs(q.x)-w)-.015,max(abs(fract(q.y*12.)-.5)/12.-.009,abs(q.x)-w));
   // ropes, rail, the keeper with a glass
   vec2 m=vec2(abs(q.x),q.y);
   d=min(max(d,in_),min(paSeg(m,vec2(.03,-.02),vec2(.16,-1.)),paSeg(m,vec2(.04,-.42),vec2(.4,-1.)))-.0035);
   d=min(d,max(m.x-.42,min(abs(q.y+.86)-.006,max(abs(fract(q.x*9.)-.5)/9.-.006,abs(q.y+.94)-.08))));
   m=q-vec2(.27,-1.02);
   d=min(d,max(max(abs(m.x+.02*m.y)-.042+.1*m.y,m.y-.215),-m.y));
   d=min(min(d,length(m-vec2(.008,.248))-.026),paSeg(m,vec2(0.,.18),vec2(.07,.228))-.01);
   mast=paCov(min(d,paSeg(m,vec2(.026,.243),vec2(.15,.262))-.0065),px);
  } else mast=paCov(max(abs(q.x)-w*.8-t,in_),px);
  float half_=(fine?.36:.29)-.03*(q.y+1.);
  stone=paCov(max(min(abs(q.x)-half_,max(abs(q.x)-half_-.07,abs(q.y+1.06)-.045)),max(q.y+1.015,-3.2-q.y)),px);
  vec2 v=vec2(q.x+.06,q.y+1.5);
  win=paCov(max(abs(v.x)-.055-t,abs(v.y)-.1-t),px);
  if (fine) win*=1.-.8*paCov(abs(fract(v.y*15.)-.5)/15.-.006,px);
 }
 mast*=1.-PA_M6*step(-.72,q.y);
 return vec4(mast,stone,win,arm);
}
const vec3 paLit=vec3(1.,.86,.66);
vec3 paHaze,paDim;
vec2 paSun;
vec3 paSky(vec2 p) {
 float y=p.y-.06;
 vec3 top=paHour(vec3(.66,.69,.8),vec3(.36,.6,.8),vec3(.06,.09,.19));
 vec3 mid=paHour(vec3(.86,.82,.85),vec3(.7,.83,.9),vec3(.15,.19,.32));
 vec3 c=mix(paHaze,mid,smoothstep(-.02,.2,y));
 c=mix(c,top,smoothstep(.14,.48,y));
 // long thin cloud
 vec2 q=vec2(p.x*1.5+uTravel*.012+uTime*.002,y*11.+.4*sin(p.x*2.3+uTime*.01));
 float n=.6*noise(q)+.27*noise(q*vec2(2.6,2.2)+5.)+.13*noise(q*vec2(7.,4.6)+9.);
 float ds=length((p-paSun)*vec2(.6,1.));
 vec3 cc=mix(vec3(.95,.92,.92),vec3(1.,.87,.74),exp(-ds*3.))*(1.-paDark*vec3(.5,.48,.34));
 c=mix(c,cc,smoothstep(.42,.75,n)*smoothstep(.02,.12,y)*(.55+.3*uPad));
 // the sun, a moon by night
 float glow=exp(-ds*(6.-1.5*uPad))*(.35+.45*uPad+.2*uLevel+.3*uCue);
 c=mix(c,mix(mix(vec3(1.,.9,.74),uKind[1],.14),vec3(.72,.78,.92),paDark),sat(glow));
 return mix(c,vec3(.98,.96,.93),.92*paCov(length(p-paSun)-.034,1.5*paPx+.002));
}
// Birds, crossing slowly.
float paBirds(vec2 p) {
 float b=0.;
 for (int k=0; k<5; k++) {
  float f=float(k),flap=.55*sin(uTime*2.4+f*1.9);
  vec2 q=p-vec2(1.25-2.5*fract(uTime*.008+.36)+.05*abs(f-1.6),.29+.022*f+.008*sin(uTime*.3+f*f));
  q.x=abs(q.x);
  b=max(b,paCov(max(abs(q.y-flap*q.x+(6.+9.*flap)*q.x*q.x)-.0019+.06*q.x,q.x-.026),paPx));
 }
 return b;
}
// The land below one ridge's line.
vec3 paLand(vec2 p,float h,float fi) {
 float near=fi/6.,base=paBase(near),below=mix(h,base,.7*paSharp)-p.y;
 float s=mix(.16,1.,near*near),k=mix(.35,1.,near);
 float warp=noise(vec2(p.x*3./s+fi*7.,below*5./s));
 // spurs wander as they come down
 float x=p.x+paSharp*below*(2.2*warp-1.),dh=(paRidge(x+.02,fi)-paRidge(x,fi))/.02;
 float v=(below*9.-.15*p.x)/s+warp*.9,row=floor(v);
 float u=(p.x*1.7+below*.5)/s+.35*warp+paH1(row+fi*17.)*5.,cell=floor(u);
 float r=hash21(vec2(cell+.5,row+fi*19.)),r2=fract(r*17.3);
 vec3 rock=vec3(0.);
 if (PA_P7>0.) {
  float bed=p.y*46./k+1.3*warp+fi*3.,id=floor(bed),b1=paH1(id+fi*7.);
  rock=mix(mix(vec3(.52,.24,.17),vec3(.85,.6,.42),b1),kindColour(b1*3.),.3)*(.85+.3*noise(vec2(p.x*90./k,bed*.6)));
  rock*=1.-.3*paDn(.12,.03,fract(bed))-.22*smoothstep(.5,.85,noise(vec2(x*34./k+3.*warp,3.+fi)));
  rock=mix(rock,vec3(.87,.72,.52),smoothstep(.0,.35,below/s-.25+.2*warp)*.75);
 }
 vec3 c=r<.5?mix(vec3(.17,.35,.23),vec3(.37,.53,.29),r2):r<.68?vec3(.53,.46,.55):r<.8?vec3(.6,.62,.42):vec3(.83,.83,.78);
 c=mix(c,vec3(.34,.49,.29)+.05*warp,.9*sat(-uOwn[5]));
 c=mix(c,mix(vec3(.58,.4,.2),vec3(.8,.63,.3),r2),.85*paGold);
 c*=1.+.07*sin((r2<.5?u*46.:v*34.+u*5.)+warp*3.)*near*step(.4,fract(r*31.));
 c=mix(c,mix(vec3(.84,.87,.92),vec3(.94,.95,.96),warp),.94*paSnow);
 if (PA_P7>0.) c=mix(c,mix(rock,c,.8*paSnow*step(abs(dh),.4)),PA_P7);
 // hedges, and clumps of trees
 vec2 e=(.5-abs(fract(vec2(u,v))-.5))*vec2(.47,.11)*s;
 float leaf=noise(p*130./k);
 float hedge=paDn(.0042,.0012,min(e.x,e.y)/k-.0022*leaf);
 float wood=smoothstep(.68-.18*uOwn[5],.73-.18*uOwn[5],noise(vec2(p.x*5./s+3.,below*13./s+fi))+.16*leaf);
 vec3 dark=vec3(.1,.18,.15)+vec3(.14,0.,-.05)*paGold+vec3(.14,.07,.15)*paSnow;
 wood=max(wood,smoothstep(0.,.002,p.y-h));
 c=mix(c,dark*(.75+.6*leaf),max(.75*hedge*sat(1.+uOwn[5]),wood)*(.5+.5*k)*(1.-PA_P7));
 if (PA_M7>0.) c=mix(c,mix(vec3(.3,.27,.28),vec3(.72,.66,.56),leaf),PA_M7*paDn(.012,.004,p.y-paTide(near)-.006*warp)*(.4+.6*k));
 // light from the right, lilac shade
 float lit=sat(.45-dh*1.3+.25*(warp-.5));
 c*=mix(vec3(.58,.59,.8),vec3(1.2,1.1,.92),mix(lit,smoothstep(.2,.75,lit),uTone));
 c+=paLit*.09*exp(-max(h-p.y,0.)*60./s)*lit*(1.-wood);
 if (PA_P7>0.) { float gl=(p.x+.8-1.5*(1.-uHits)-.1*fi)*4.; c=mix(c,mix(uKind[4],vec3(1.,.95,.85),.4)*1.1,PA_P7*uHits*exp(-gl*gl-max(h-p.y,0.)*26./s)); }
 c*=paDim*(.9+.12*uPad);
 // the air between, and mist at the foot of the ridge
 float air=pow(1.-near,.8)*(.86+.12*uSpace)*(1.+.3*uOwn[2]);
 c=mix(c,mix(vec3(.72,.72,.86)*mix(vec3(1.),paHaze,.5),paHaze,pow(1.-near,3.))*(1.-.25*paDark),sat(air)*.92);
 float wisp=.3*warp+.7*noise(vec2(p.x*2.2+uTime*.01*(1.+near)+fi*5.,p.y*11.-uTime*.006));
 float gap=mix(.055,.17,near),thick=.5+.35*uDrone+.06*sin(uTime*.2+fi)+.4*uOwn[2];
 float m=paDn(gap*1.5,0.,p.y-(h*.25+.75*base)+gap*(1.45-thick)-(wisp-.5)*gap*1.3);
 vec4 pc=piece(vec2(p.x*uRes.y/uRes.x+.5+.25*(wisp-.5),near));
 vec3 mist=mix(paHaze,vec3(.97,.98,1.)*(1.-paDark*vec3(.7,.64,.48)),.6);
 mist=mix(mist,mix(pc.rgb/max(pc.a,.03),vec3(.92),.45)*(1.-.6*paDark),.45*sat(pc.a*1.2)*sat(wisp*1.6));
 return mix(c,mist,sat(m*(.55+.4*uDrone+.3*uOwn[2])*mix(1.,.7,near)));
}
// One station over c.
void paPost(int n,vec2 p,float seen,inout vec3 c) {
 vec4 at=PA_POST[n];
 bool first=n==7;
 vec2 q=vec2(p.x-at.x*paW,p.y-.175-.02*uOwn[4]);
 float fi=at.y,near=fi/6.,e=paEcho(at.w),size=at.z;
 if (first) size*=exp2(.75*uOwn[4])*paFit();
 else size=max(.0005,size*(n==1||n==3||n==6?smoothstep(0.,.9,uOwn[5]):n==5?1.:smoothstep(-1.,-.2,uOwn[5])));
 if (!first) q.y=p.y-paRidge(at.x*paW,fi)-1.75*size;
 q /= size;
 c=mix(c,mix(vec3(1.,.8,.5),uKind[4],.35),e*(first?.5:.75)*exp(-dot(q,q)*(first?2.2:.6))*mix(.6,1.,uEnergy));
 if (seen<fi-.5&&(dot(q,q)<2.||(q.y<0.&&abs(q.x)<.5))) {
  float lift=first?sat(.12+1.1*uPhrase+.5*uLevel):sat(.25+1.7*uLevel);
  vec3 pose=mix(vec3(.5,2.15,-2.3),paPose(uTime+400.-2.6*at.w),lift);
  pose.yz+=vec2(-1.,1.)*uCue*(1.-uCue);
  if (first) pose+=vec3(.16*(uBands[2] - uBands[6]),.3*uBands[4],.9*uHits*(1.-uHits)-.3*uBands[9]);
  vec4 st=paStation(q,pose,.8*paPx/size,first);
  float air=sat(1.-near)*(.82+.12*uOwn[2]);
  vec3 wood=vec3(.085,.08,.1),stone=vec3(.36,.34,.39);
  if (first) {
   vec2 g=vec2(q.x*5.+.5*mod(floor(q.y*9.),2.),q.y*9.),j=abs(fract(g)-.5);
   stone*=(.84+.26*hash21(floor(g)+.5))*(1.-.22*smoothstep(.44,.5,max(j.x-.01,j.y)));
  }
  stone+=paLit*.36*smoothstep(.2,.37,q.x)*(1.-paDark);
  stone*=1.-paDark*vec3(.58,.54,.38);
  vec3 armC=mix(wood,uKind[3]*.6,.35*uPhrase*(first?1.:.4));
  armC=mix(armC,mix(vec3(.95,.45,.2),uKind[4],.3),e*.9*(first?smoothstep(-.2,.5,q.x):1.));
  armC=mix(armC,vec3(1.,.76,.42),paDark*(first?0.:.6));
  vec3 b=mix(stone,vec3(1.,.82,.46),st.z*st.y*sat(.6+.4*uKeys+.3*uMic));
  b=mix(mix(b,wood,st.x),armC,st.w);
  b=mix(b,paHaze*.92,air*(1.-.8*e));
  c=mix(c,b,max(max(st.x,st.y),st.w));
  if (PA_M6>0.) {
   // the basket, its fire and its smoke
   vec2 v=q+vec2(0.,.62);
   float w=.13+.25*v.y,bars=max(abs(v.x)-w,abs(v.y-.17)-.17),iron=max(bars,min(min(abs(abs(v.x)-w)-.025,abs(abs(v.x)-.4*w)-.012),min(abs(v.y-.02)-.02,abs(v.y-.31)-.025)));
   iron=min(iron,max(abs(v.x)-.03,abs(v.y+.2)-.22));
   float burn=sat(.45+.5*lift+e)*(.8+.2*sin(uTime*.8+at.w*2.)),up=v.y-.12,nn=noise(vec2(v.x*7.+at.w,v.y*4.-uTime*2.2))-.5;
   float tongue=abs(v.x+.25*nn*sat(up*2.)-.12*up)-.27*sqrt(sat(up/.3+.2))*sat(1.-up/(.35+.75*burn)),high=up+.3;
   float px=.8*paPx/size;
   if (high>0.) {
    float sm=paDn(1.,.2,abs(v.x-.1*high*high-.3*high*(noise(vec2(high*1.6-uTime*.5,at.w+4.))-.5))/(.1+.26*high))*paDn(first?3.2:2.4,.3,high)*smoothstep(.3,.7,high);
    c=mix(c,mix(vec3(.36,.34,.38)*mix(vec3(1.),paDim,.7)+vec3(.3,.13,.03)*exp(-high*1.2),paHaze,.25+.6*air),PA_M6*sm*(.35+.4*noise(vec2(v.x*6.,high*5.-uTime*.9)))*step(at.y,first?9.:5.5));
   }
   c=mix(c,mix(wood,paHaze,air),paCov(iron,px)*PA_M6);
   c+=PA_M6*burn*vec3(.9,.42,.12)*exp(-dot(v-vec2(0.,.3),v-vec2(0.,.3))*2.2)*(.35+.5*paDark);
   c=mix(c,mix(vec3(.95,.36,.1),vec3(1.,.88,.55),1.-smoothstep(-.16,0.,tongue)),PA_M6*paDn(.03,-.05,tongue)*step(-.02,up)*sat(burn*1.4));
  }
  if (PA_P6>0.) {
   // two strings of flags, and a pennant
   float px=.8*paPx/size,k=floor((-.02-q.y)/.19),t9=floor((uTime+400.-2.6*at.w)/9.);
   float gust=sin(q.x*9.-uTime*1.6+at.w)*.02,wire=min(min(abs(q.y+.02)-.012,abs(q.y+.03)-.02),9.);
   wire=max(wire,abs(q.x)-.66);
   for (int sd=0; sd<2; sd++) {
    float dir=sd==0?-1.:1.,sx=dir*mix(.62,.4,sat(-q.y/.86)),dx=q.x-sx;
    wire=min(wire,max(abs(dx)-.004,abs(q.y+.44)-.42));
    vec2 f=vec2(dx,q.y+gust*sat(dx*5.)+.02+.19*(k+.5));
    float hh=paH1(mod(t9,61.)*3.+k*7.+dir*2.+at.w),flag=max(abs(f.x-.17)-.17,abs(f.y)-.085+(hh>.7?.28*f.x:0.));
    if (k<0.||k>3.||fract(hh*91.)>.35+.65*lift) continue;
    float mark=fract(hh*37.),cut=mark<.3?step(.17,f.x):mark<.6?step(.028,abs(f.y)):mark<.8?step(.045,length(f-vec2(.16,0.))):1.;
    vec3 fc=mix(vec3(.95,.92,.85),mix(kindColour(hh*4.),uKind[4],e),.3+.7*cut)*mix(vec3(1.),paDim,.75)*(1.+.14*sin(q.x*22.-uTime*1.6));
    c=mix(c,mix(fc,paHaze,air*(1.-e)),paCov(flag,px)*PA_P6);
   }
   float pn=q.x*.9,pd=max(abs(q.y-.12-.05*sin(q.x*6.-uTime*1.9+at.w)*sat(q.x*2.))-.065*(1.-pn),abs(q.x-.5)-.5);
   wire=min(wire,max(abs(q.x)-.014,abs(q.y-.05)-.16));
   c=mix(c,mix(wood,paHaze,air),paCov(wire-.002,px)*PA_P6);
   c=mix(c,mix(mix(uKind[3],uKind[4],e)*mix(vec3(1.),paDim,.75),paHaze,air*(1.-e)),paCov(pd,px)*PA_P6);
  }
  q+=vec2(.06,1.5);
  c+=vec3(.5,.33,.14)*uKeys*exp(-dot(q,q)*9.)*(1.-air);
 }
}
vec3 paDay(vec2 p) {
 paHaze=paHour(vec3(.95,.88,.84),vec3(.88,.92,.93),vec3(.27,.27,.38));
 paHaze=mix(paHaze,(uOwn[0]<0.?vec3(.84,.87,.92):vec3(.98,.84,.62))*(1.-.62*paDark),.6*abs(uOwn[0]));
 paDim=paHour(vec3(1.04,1.02,1.),vec3(1.15,1.15,1.05),vec3(.26,.32,.5));
 paSun=vec2(.49*paW+.05*sin(TAU*uLoop),.205+.13*paBright-.025*cos(TAU*uLoop));
 // which ridge is seen here
 float seen=-1.,h=0.,m=0.;
 for (int i=6; i>=0&&m<=0.&&p.y<.19+.12*paSharp; i--) {
  float fi=float(i),near=fi/6.;
  h=paRidge(p.x,fi);
  float top=h;
  // trees
  if (abs(p.y-h)<.03) {
   float tf=mix(260.,70.,near),clump=smoothstep(.5,.7,paN(p.x*mix(16.,6.,near)+fi*5.));
   top+=1.2*paN(p.x*tf)/tf*clump*(.4+near)*(1.-PA_P7);
  }
  m=smoothstep(-paPx,paPx,top-p.y);
  if (PA_M7>0.) m*=smoothstep(-paPx,paPx,p.y-paTide(near));
  seen=fi;
 }
 if (m<=0.) seen=-1.;
 vec3 c=vec3(.9,.9,.93)*paHaze*(1.-.2*paDark);
 if (p.y>-.02&&m<1.) {
  c=paSky(p);
  c=mix(c,mix(vec3(.16,.15,.2),c,.3+.4*paDark),paBirds(p)*sat(2.*uTexture));
 }
 if (PA_M7>0.&&p.y<paTide(0.)&&m<1.) {
  float i=6.;
  for (int k=6; k>=0; k--) { i=float(k); if (paTide(i/6.)>p.y) break; }
  float wy=paTide(i/6.),dep=paTide(0.)-p.y,z=1./(dep+.04);
  float rip=.6*noise(vec2(p.x*z*1.1+uTime*.04,z*7.-uTime*.12))+.4*noise(vec2(p.x*z*2.6-uTime*.05,z*17.+uTime*.1));
  vec3 w=paSky(vec2(p.x,.085+.75*dep+.06*(rip-.5)))*mix(vec3(.95),vec3(.42,.58,.66),sat(.15+dep*1.3));
  float sh=paRidge(p.x+.03*(rip-.5),i/1.);
  w=mix(w,mix(vec3(.2,.26,.28)*paDim,paHaze,.25+.6*(1.-i/6.)),.65*smoothstep(-.006,.01,sh-wy-.9*(wy-p.y)+.02*(rip-.5)));
  float gx=(p.x-paSun.x)/(.05+.3*dep);
  w+=mix(vec3(1.,.84,.6),vec3(.6,.7,.9),paDark)*exp(-gx*gx)*smoothstep(.5,.75,rip)*(.45+.4*uPad+.4*uTexture);
  vec4 pc=piece(vec2(sat(p.x*uRes.y/uRes.x+.5),sat(dep/.55)));
  w=mix(w,pc.rgb/max(pc.a,.03)*(.4+.6*rip)*mix(vec3(1.),paDim,.7),.4*sat(pc.a));
  w=mix(w,vec3(.95)*paHaze,.7*paDn(.006,.001,abs(p.y-wy) )*step(wy,sh)*rip);
  w=mix(w,paHaze,sat((.35*exp(-dep*9.)+.25*uDrone*exp(-dep*4.))*(1.+uOwn[2])));
  c=mix(c,w,smoothstep(-paPx,paPx,paTide(0.)-p.y));
  if (m<=0.) seen=i;
 }
 if (m>0.) c=mix(c,paLand(p,h,seen),m);
 // the stations near here
 int n=0;
 float lit=max(uHits,uCue);
 for (int i=0; i<8; i++) {
  for (; n<8; n++) {
   vec4 at=PA_POST[n];
   if (abs(p.x-at.x*paW)<at.z*(n==7?2.4:lit>.01?4.5:1.9)&&(n==7||abs(p.y-.05)<.28)&&(seen<at.y-.5||lit>.01)) break;
  }
  if (n>7) break;
  paPost(n,p,seen,c);
  n++;
 }
 return c;
}

// ---- b: lamps at anchor
const float PA_SEA=.075;
// The ships: across, how near, which way the bow lies, which in the line (below 0: of the fleet).
const vec4 PA_BERTH[10]=vec4[10](
 vec4(.66,1.,1.,0.),vec4(-.84,.7,-1.,-1.5),vec4(-.58,.46,-1.,1.),vec4(.17,.37,-1.,-2.),vec4(.1,.28,1.,2.),
 vec4(-.27,.165,1.,3.),vec4(-.4,.115,1.,-4.),vec4(.44,.1,-1.,4.),vec4(.29,.07,-1.,-5.),vec4(-.06,.06,-1.,5.));
// The message: a lamp opened and shut slowly.
float paSign(float t) {
 float k=floor(t),f=t-k;
 vec2 m=mod(vec2(k,k+1.),91.);
 vec2 on=step(.42,vec2(paH1(m.x+5.),paH1(m.y+5.)))*step(mod(m,13.),vec2(7.5));
 return mix(on.x,on.y,smoothstep(.35,.9,f));
}
float paCloth; // how much sail is here
// One ship, waterline at 0, bow to the left: cover, lit windows, the line along the rail.
vec3 paShip(vec2 q,float px,bool fine) {
 float t=.6*px,deck=.125+(q.x<0.?.48:.32)*q.x*q.x;
 float d=max(max(q.y-deck,-.44-.28*q.y-.1*smoothstep(.1,.26,q.y)-q.x),max(q.x-.5-.2*q.y,-.02-q.y));
 paCloth=0.;
 if (PA_M6>0.) {
  // a low boat, one standing in it with an oar, a pole for the lamp
  float low=.045+.55*q.x*q.x,rb=max(max(q.y-low,abs(q.x)-.34-.35*q.y),-.02-q.y);
  rb=min(rb,max(abs(q.x-.14+.06*q.y)-.034+.06*q.y,abs(q.y-.15)-.11));
  rb=min(min(rb,length(q-vec2(.13,.285))-.022),paSeg(q,vec2(.12,.22),vec2(.2,.14))-.012);
  rb=min(min(rb,paSeg(q,vec2(.17,.26),vec2(.44,-.02))-.005-t),paSeg(q,vec2(-.3,.06),vec2(-.28,.33))-.006-t);
  rb=min(rb,length((q-vec2(-.04,.07))*vec2(1.,1.3))-.06);
  float rw=paCov(abs(q.y-low+.018)-.004,px);
  if (PA_M6>.99) return vec3(paCov(rb,px),0.,rw);
  d=mix(d,rb,PA_M6);
 }
 float wale=paCov(abs(q.y-deck+.028)-.004,px);
 // a house on deck, the bowsprit, the anchor's chain
 vec2 hq=q-vec2(.3,.135);
 d=min(d,max(abs(hq.x)-.115,abs(hq.y)-.05));
 d=min(d,paSeg(q,vec2(-.45,.225),vec2(-.71,.318))-.009-t);
 float cx=1.-sat((-.5-q.x)/.16);
 float line=max(abs(q.y-.17*cx*cx)*.7,abs(q.x+.58)-.08)-(fine?.0025:0.);
 vec2 v=vec2(fract(hq.x*15.)-.5,(hq.y-.031)*15.);
 float win=paCov(max(abs(v.x)-.2,abs(v.y)-.19),15.*px)*step(abs(hq.x),.1)*step(px,.012);
 for (int k=0; k<2; k++) {
  float mx=k==0?-.12:.27,top=k==0?.8:.58,ty=top*.94;
  vec2 m=vec2(abs(q.x-mx-.02*q.y),q.y);
  d=min(d,max(m.x-.011*(1.2-q.y/top)-t,max(q.y-top,.1-q.y)));
  // shrouds, the stay forward, the boom with its furled sail
  line=min(line,paSeg(m,vec2(0.,ty),vec2(.08,.14)));
  line=min(line,paSeg(q,vec2(mx+.02*top,ty),k==0?vec2(-.7,.315):vec2(-.11,.62)));
  if (fine) {
   float rung=max(abs(fract(q.y*26.)-.5)/26.,m.x-.08*(ty-q.y)/(ty-.14));
   line=min(line,min(paSeg(m,vec2(0.,ty),vec2(.055,.14)),max(rung,max(q.y-top*.8,.15-q.y))));
  }
  if (PA_P6>0.) {
   // the sails set
   float u=(q.y-.25)/(ty*.97-.25),leech=.36*(1.-.72*u)*(k==0?1.:.75)+.06*sin(PI*sat(u)),x=q.x-mx-.02*q.y-.012;
   float sl=max(max(-x,x-leech),abs(u-.5)-.5+.06*x);
   vec2 hd=vec2(mx+.02*top,ty*.96),tk=k==0?vec2(-.66,.31):vec2(-.1,.36),ed=hd-tk,jq=q-tk;
   float ju=sat(jq.y/ed.y),jx=jq.x-ed.x*ju;
   float jb=max(max(-jx,jx-.27*(1.-ju)*ju*2.2-.02),abs(jq.y/ed.y-.5)-.48);
   float seam=.88+.12*smoothstep(0.,.2,abs(fract(q.y*15.)-.5));
   paCloth=max(paCloth,PA_P6*max(paCov(sl,px)*(.75+.25*sat(x/.3)),paCov(jb,px)*(.7+.4*sat(jx*5.)))*seam);
  }
  float al=sat((q.x-mx-.02)/.3);
  d=min(d,length(q-vec2(mx+.02+.3*al,.24+.035*al))-(.022+.004*sin(al*40.))*(1.1-.6*al));
 }
 return vec3(max(paCov(d,px),.75*paCov(line-.0018-t,px)),win,wale);
}
const vec3 paWarm=vec3(1.,.5,.18);
float paWave,paGlint,paChop;
// A lamp in fog at l, and its broken light on the water below the waterline wl.
float paLamp(vec2 p,vec2 l,float wl,float s,float thick) {
 vec2 d=p-l;
 float r=length(d),z=.45+.55*s;
 float v=.34*exp(-r/(.016*z))+(.04+.05*thick)*exp(-r/(.075*z*(.6+thick)))+1.8*paCov(r-max(.0065*s,1.3*paPx),max(paPx,.001+.002*thick*s));
 float dy=wl-p.y;
 if (dy>0.) {
  float h=max(l.y-wl,.01),x=d.x+(paWave-.5)*(.012+.16*dy)*paChop,w=.004+.006*s+.055*dy*paChop;
  float along=smoothstep(0.,.4*h,dy)*exp(-max(dy-h,0.)*(3.2+1.4*uOwn[3]));
  v=.4*v+.8*exp(-x*x/(w*w))*along*mix(1.,paGlint,.93)*sat(.02/w+.12);
 }
 return v;
}
vec3 paNight(vec2 p) {
 float thick=sat(.48+.18*uDrone+.48*uOwn[2] - .15*paDark);
 vec3 top=vec3(.012,.019,.026),low=vec3(.115,.142,.148);
 top+=paGold*vec3(.033,.003,.004)+paSnow*vec3(-.004,.007,.024);
 low+=paGold*vec3(.145,-.027,-.09)+paSnow*vec3(-.055,-.015,.02);
 top=mix(top,top*8.+vec3(.1,.12,.19),paBright)*(1.-.65*paDark);
 low=mix(low,low*2.5+vec3(.5,.42,.39),paBright)*(1.-.65*paDark);
 low*=(1.+.45*uPad+.3*uDrone)*(1.+.4*uOwn[5]);
 low=mix(low,low.g*(uKind[1]*uKind[1]*1.8+.2),.35*uPad);
 float y=p.y-PA_SEA,dep=max(-y,0.);
 // waves, closer together far off
 float z=1./(dep+.03);
 float w1=noise(vec2(p.x*z*.55+uTime*.05,z*3.6-uTime*.13));
 float w2=noise(vec2(p.x*z*1.5-uTime*.07,z*9.+uTime*.16+4.*w1));
 paWave=.62*w1+.38*w2;
 paChop=1.+.85*uOwn[3];
 paGlint=smoothstep(.42,.72,.45*w1+.55*w2)*1.9;
 // banks of fog that drift
 vec2 fq=vec2(p.x*1.3+uTravel*.015+uTime*.004,p.y*4.5-uTime*.003);
 float fog=.55*noise(fq)+.3*noise(fq*2.3+3.)+.15*noise(fq*vec2(4.6,6.1)+8.);
 vec3 c=mix(top,low,sat(exp(-abs(y)*mix(5.5,2.2,thick)*(y<0.?1.7:1.))*(.45+.6*fog)))*(.75+.5*fog);
 if (PA_P7>0.) {
  // a great moon, a sun by day, low over the water
  vec2 mo=p-vec2(-.2*paW,PA_SEA+.15);
  float mr=length(mo),face=.8+.2*smoothstep(.3,.6,noise(mo*9.+3.)*.7+.3*noise(mo*23.));
  vec3 mc=mix(mix(vec3(1.,.72,.42),vec3(.75,.85,1.),.5+.5*paSnow-.5*paGold),mix(vec3(1.,.4,.16),uKind[1],.3)*1.9,paBright);
  c+=mc*PA_P7*(.16+.12*uPad)*exp(-mr*4.)*(y>0.?1.:.4);
  if (y>0.) c=mix(c,mc*mix(face,1.,paBright)*mix(.9,mix(.5,.85,paBright),thick)*mix(.75,1.,sat(y*7.)),PA_P7*paCov(mr-.17,1.5*paPx+.004*thick)*sat(.35+y*5.));
  float gx=mo.x/(.1+.5*dep);
  if (y<0.) c+=mc*PA_P7*exp(-gx*gx)*paGlint*(.32+.2*uLevel+.5*uHits)*exp(-dep*1.3)*smoothstep(0.,.02,dep);
 }
 if (PA_M7>0.) for (int k=0; k<3; k++) {
  // cliffs down to the water, and what it gives back of them
  float fk=float(k),my=y>0.?y:-y*1.1+.05*(paWave-.5)*sat(dep*8.),side=smoothstep(-.1,.75,abs(p.x/paW+.16*(fk-1.))+.25*fk-.35);
  float top_=(.03+.42*side)*(.55+.75*paN(p.x*(4.-fk)+fk*9.)+.22*paN(p.x*17.+fk*5.)+.06*paN(p.x*61.))*(.75+.12*fk)*PA_M7;
  float in_=smoothstep(-.003,.003,top_-my),lie=.5*noise(vec2(p.x*26.+9.*my,my*9.+fk*4.))+.3*noise(vec2(p.x*41.-30.*my,my*36.+fk*9.))+.2*noise(vec2(p.x*120.+40.*my,my*95.+fk*7.)),snowy=smoothstep(.45,.68,my/max(top_,.02)+.5*(lie-.5))*smoothstep(.1,.3,top_);
  vec3 cl=mix(mix(top*.5,low*.35,.4),low*1.25+.02,snowy*(.35+.4*lie)*(.5+paSnow+.5*paBright))*(.75+.5*lie);
  vec2 wl2=vec2(p.x*60.,my*60.),wi=floor(wl2);
  cl+=paWarm*step(.93,hash21(wi+fk*31.))*paDn(.09,.02,my)*step(.012,my)*paDn(.35,.1,length(fract(wl2)-.5))*(.35+.8*uKeys+.5*uBands[int(hash21(wi)*15.)])*(1.-paBright+3.*uHits);
  cl=mix(cl,c,sat((.62-.22*fk)*(.6+thick*.8)));
  c=mix(c,cl*(y>0.?1.:.6),in_*(y>0.?1.:.75*exp(-dep*1.5)));
 }
 if (PA_M7>0.) {
  float run=(abs(p.x)/paW-1.1*(1.-uHits))*4.;
  c+=paWarm*1.6*PA_M7*uHits*exp(-run*run-abs(y)*26.)*(.5+.5*paGlint);
 }
 vec2 g=p*34.,id=floor(g);
 g-=id+.15+.7*hash22(id);
 c+=vec3(.5,.6,.75)*paDark*paDn(.07,0.,length(g))*(1.-PA_P7)*step(.72,hash21(id+7.))*sat(y*4.-thick);
 if (y<0.) {
  c=mix(c,mix(top*.42,low*.28,paBright),sat(dep*2.4)*(.6+.4*paDn(.75,.3,paWave))*(1.-.7*paFlat));
  c*=1.+paSharp*(2.6*smoothstep(.35,.8,paWave)-.6)*sat(dep*6.);
  vec4 pc=piece(vec2(p.x*uRes.y/uRes.x+.5,sat(dep/.5)));
  c+=pc.rgb*pc.rgb*(.025+.05*paGlint)*smoothstep(0.,.12,dep)*(1.+paBright);
  c+=low*(.35*uTexture+.2*paSharp)*smoothstep(.6,.9,.3*w1+.7*w2)*smoothstep(0.,.1,dep);
 }
 vec3 cold=mix(vec3(.72,.95,1.),uKind[3]*uKind[3]*1.4+.15,.35);
 vec3 sum=vec3(0.);
 float left=1.;
 int n=0;
 for (int i=0; i<10&&left>.01; i++) {
  for (; n<10; n++) {
   vec4 at=PA_BERTH[n];
   float dy=PA_SEA-.43*at.y-p.y;
   if (abs(p.x-at.x*paW)<.05+(n==0?1.35:.75)*at.y+.15*max(dy,0.)&&-dy<.07+(n==0?1.4:.85)*at.y&&(at.w>=0.||uOwn[5]>.01)) break;
  }
  if (n>9) break;
  vec4 at=PA_BERTH[n];
  float wl=PA_SEA-.43*at.y-(n==0?.05*uOwn[4]:0.);
  int kind=n<5?n:n-5;
  float there=at.w<0.?smoothstep(0.,.8,uOwn[5]):n==0||n==4?1.:smoothstep(-1.,-.3,uOwn[5]);
  float s=at.y*(n==0?exp2(.6*uOwn[4])*paFit():1.);
  vec2 o=vec2(at.x*paW,wl);
  float far_=1.-sqrt(at.y),order=abs(at.w),thru=there*exp(-far_*(.7+1.2*thick));
  // riding lamp, shuttered lamp
  vec2 a=mix(vec2(-.42,.505),vec2(-.28,.345),PA_M6)*vec2(at.z,1.)*s+o,b=mix(vec2(-.105,.5),vec2(.22,.15),PA_M6)*vec2(at.z,1.)*s+o;
  sum+=left*mix(paWarm,uKind[kind]*uKind[kind]*1.4,.35)*paLamp(p,a,wl,s,thick)*(.62+.5*(kind==0?uDrone:kind==1?uPad:kind==2?uTexture:kind==3?uPhrase:uLow))*thru*1.6;
  float say=paSign(uTime+300.-1.4*order)*(n==0?sat(.15*uLevel+1.3*uPhrase):1.1*sat(uLevel*2.4));
  say=max(say,1.5*paEcho(order))*there*exp(-far_*1.2)*1.8;
  sum+=left*mix(cold,uKind[4],.3*uHits)*paLamp(p,b,wl,s*1.25,thick)*say;
  // the hull and its image
  vec2 q=p-o;
  bool under=q.y<0.;
  float soft=paPx/s,shown=there;
  if (under) {
   q.x+=(paWave-.5)*.35*min(-q.y,.2)*paChop;
   q.y=-q.y; soft+=.03+.25*q.y; shown*=.8*exp(-q.y/s*1.4);
  }
  q /= s;
  q.x=q.x*at.z+.006*sin(uTime*.31+float(n)*2.)*paChop*q.y;
  float m=0.;
  vec3 hullC=vec3(0.);
  if (abs(q.x)<.8&&q.y<.82) {
   vec3 sh=paShip(q,soft,n==0&&!under);
   m=sh.x*shown;
   hullC=mix(top*.18,low*.06,.3)*(1.+.5*sat(q.y*3.)+(under?0.:1.3)*sh.z);
   float veil=sat(1.-exp(-far_*(1.2+1.9*thick))+.5*thick*exp(-q.y*s*22.)*(fog+.15)*(under?.5:1.));
   if (PA_P6>0.) {
    float cloth=paCloth*shown;
    vec3 sc=mix(low*.8+.02,uKind[kind]*uKind[kind] + .04,.45+.3*uPhrase)*(.5+.9*paCloth)*(.9+1.1*paBright)*(1.+paEcho(order));
    hullC=mix(hullC,sc,sat(cloth)*(1.-.85*sh.x));
    m=max(m,sat(cloth*1.3)*shown);
   }
   hullC=mix(hullC,c,veil)+paWarm*sh.y*(.05+1.1*uKeys+.3*uMic)*thru;
  }
  sum+=left*m*hullC;
  left*=1.-m;
  n++;
 }
 // the guard boat's beam
 g=p-vec2(-.8*paW,PA_SEA-.135);
 float r=length(g),ang=g.y/max(g.x,.01)-.05-.16*sin(TAU*uLoop);
 float beam=exp(-ang*ang/.0022-r*1.5)*smoothstep(0.,.05,g.x)*(.5+fog)*(.4+thick);
 return sum+left*c+cold*(beam*(.05+.1*uLevel)+.3*exp(-r/.007));
}
vec3 render(vec2 p) {
 paW=clamp(.5*uRes.x/uRes.y,.28,.95);
 paPx=1./uRes.y;
 paSnow=max(-uOwn[0],0.); paGold=max(uOwn[0],0.);
 paDark=max(-uOwn[1],0.); paBright=max(uOwn[1],0.);
 paFlat=max(-uOwn[3],0.); paSharp=max(uOwn[3],0.);
 return uVar<.5?paDay(p):screenOf(paNight(p));
}
