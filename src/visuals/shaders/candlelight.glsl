// name: Candlelight
// a: One flame
// b: Many steps
// what: A candle burns behind a plain bowl in a deep niche, out of sight but for its tip: its light goes up the wall, through a glass of water and along the edge of the table, and the rest is lost in brown dark; or dozens of small candles stand on stone steps that climb into the dark, each with its own halo.
// follows: The mix is the height of the flame and how far it reaches; each kind of sound colours what the light touches: bowl, linen, wall, glass, smoke, or its own candles on the steps. A hit bends the flame and lights its smoke, or is a breath across the steps; a cue brightens the whole niche, or is a glow that climbs the stairs; the keys make it flicker.
// own: 0 1 crowded with lights (a: a row of vessels), -1 a few great ones (a: the bowl alone); 1 1 steep steps (a: a tall niche), -1 a level plain (a: a low wide shelf); 2 1 paper lanterns, -1 tall tapers; 3 1 white ground by day, -1 black water; 4 1 open to the evening sky, -1 thick fog; 5 (of a) 1 tall bottles, -1 heaped stones; 6 1 the flame in front (b: lights in clumps), -1 out of sight at the left (b: in straight ranks); 7 the eye: 1 from above, -1 low down
// A soft step that may also run downward.
float cnS(float a,float b,float x){x=sat((x-a)/(b-a));return x*x*(3.-2.*x);}
vec3 cnT[5]; // the stain of each kind
float cnLv[5]; // how loud each kind is
// A warm light of strength e: pale where strong, deep brown where nearly gone.
vec3 cnWarm(float e){
 e=max(e,0.);e=e*e/(e+.05);
 float s=e/(1.+e*.25);
 return vec3(s,s*mix(.4,.66,sat(s)),s*mix(.12,.33,sat(s*.6))*(.85+.3*uTone));
}
vec3 cnTint(int k,float m){return mix(vec3(1.),cnT[k],sat(m));}
vec3 cnF,cnRt,cnV; // the eye's forward, right and up
vec3 cnEye(vec3 f,float foc,vec2 p){cnF=normalize(f);cnRt=normalize(vec3(f.z,0.,-f.x));cnV=cross(cnF,cnRt);return normalize(cnF*foc+cnRt*p.x+cnV*p.y);}
// A slow unsteadiness and a quick one, -1 to 1, with a seed.
float cnWaver(float s){return .6*sin(uTime*1.31+s*5.1)+.4*sin(uTime*2.27+s*9.7);}
float cnQuick(float s){return .6*sin(uTime*9.1+s*4.)+.4*sin(uTime*13.7+s*7.);}
float cnBump(float x){return exp(-x*x);}
// A flame, u across and v from wick (0) to tip (1): x how much there is of it, y how hot.
vec2 cnFlame(vec2 q,float soft){
 float v=sat(q.y),w=.46*sqrt(v)*pow(1.-v,.8)+.02,d=abs(q.x)/w;
 return vec2(cnS(1.+soft,1.-soft,d)*cnS(-.03,.03,q.y)*cnS(1.02,.96,q.y),
       cnS(0.,.4,v)*(1.-.45*v)*(1.-.4*min(d*d,1.)));
}

const float cnZE=-.85,cnZW=-.5,cnZB=1.45,cnCX=.02; // table edge, front and back wall;the arch's middle, half width, spring
float cnW,cnSP,cnRi; // half width, spring and flatness of the arch
const vec3 cnB=vec3(-.16,.48,0.),cnP=vec3(-.98,.2,.46),cnJ=vec3(-.5,.42,1.08),cnGl=vec3(.74,0.,0.);
const float cnGR=.15,cnGH=.62,cnGWater=.4;
vec3 cnL; // where the flame's light comes from
float cnI,cnHgt; // how strong it is, how high the flame
float cnArch(vec2 q){q.x-=cnCX;return q.y<cnSP?abs(q.x)-cnW:length(vec2(q.x,(q.y-cnSP)*cnRi))-cnW;}
float cU(float x){return max(x,0.);}
// The evening: dark hills, a moon.
vec3 cnSky(vec3 d){
 vec2 q=d.xy/max(d.z,.2);
 vec3 lo=uKind[1]*uKind[1],hi=uKind[0]*uKind[0];
 vec3 c=mix(lo*(1.1+.5*uLevel)+uKind[2]*uKind[2]*.7*cnBump((q.y-.03)*9.),hi*.4,cnS(-.02,.5,q.y));
 c*=.75+.6*noise(q*vec2(3.,11.)+vec2(uTime*.01,0.));
 float m=length(q-vec2(.06,.27));
 c+=vec3(1.,.93,.8)*(2.*cnS(.037,.033,m)+.05/(.1+m*4.));
 for(int i=0;i<2;i++){float f=float(i);c=mix(c,hi*(.1-.07*f),cnS(-.005,.005,.035-.05*f+.09*noise(vec2(q.x*(3.+2.*f),f*7.))-q.y));}
 return c;
}
// How much of the flame a ball lets by, softer farther off.
float cnShade(vec3 p,vec3 d,float far,vec3 c,float r){
 vec3 oc=p-c;if(uOwn[5]>0.){float k=1.-.65*uOwn[5];oc.y*=k;d.y*=k;d=normalize(d);}
 float t=-dot(oc,d),h=sqrt(max(dot(oc,oc)-t*t,0.));
 return t<0.||t>far?1.:cnS(-.035,.03+.12*t,h-r);
}
float cnNo(float x){return clamp(floor(x/.66+.5),-1.,2.);}
// Light of the flame arriving at p on a face n;a thing does not shade itself.
float cnLight(vec3 p,vec3 n,float wrap,int self){
 vec3 v=cnL-p;float d2=dot(v,v),far=sqrt(d2);v/=far;
 float s=sat((dot(n,v)+wrap)/(1.+wrap))/(d2*(.65+.35*d2)+.06);
 float over=p.y-v.y*dot(p-cnB,v); // past the rim of the bowl
 if(self!=1) s*=mix(1.,cnShade(p,v,far,cnB,.5),cnS(.56,.4,over));
 float sm=1.-cU(-uOwn[0]);
 if(self!=2) s*=mix(1.,cnShade(p,v,far,cnP,.2),cU(sm-cU(uOwn[1])));
 if(self!=3&&sm>0.){vec3 j=cnJ-vec3(0.,.1,0.);if(uOwn[0]>0.){float k=cnNo(p.x+v.x*cU((j.z-p.z)/(v.z+(v.z<0.?-.02:.02)))-j.x);j.x+=.66*k;if(k!=0.) sm=uOwn[0];}s*=mix(1.,cnShade(p,v,far,j,.3-.12*cU(uOwn[0])),sm);}
 float m=p.z<cnZW?cnS(.02,-.1,cnArch((p+v*((cnZW-p.z)/max(v.z,.02))).xy)):1.; // only through its mouth
 s*=mix(m,1.,cnS(-.4,-.7,cnL.z));
 if(cnL.z<cnZW&&p.z>cnZW) s*=cnS(.1,-.15,cnArch((p+v*((cnZW-p.z)/min(v.z,-.02))).xy));
 return s;
}
vec3 cnDay(vec3 p,vec3 n,int self){
 const vec3 d=vec3(-.5,.62,-.604);float s=.22+.78*sat(dot(n,d)*.8+.2);
 float o=p.z>cnZW?cnS(.5,-.4,cnArch((p+d*((p.z-cnZW)/.604)).xy)):1.;
 if(self!=1) o*=.25+.75*cnShade(p,d,9.,cnB-vec3(0.,.1,0.),.4);
 return mix(vec3(.5,.6,.78),vec3(.95,.97,1.),o)*s*(.3+.7*o)*(.5+.25*uLevel)*uOwn[3];
}
// The glass takes light from its shadow (x) into a bright line (y).
vec2 cnCaustic(vec3 p){
 vec2 d=normalize(cnGl.xz-cnL.xz),o=p.xz-cnGl.xz;
 float al=dot(o,d),ac=dot(o,vec2(-d.y,d.x)),w=.02+.13*abs(al-.35),fade=exp(-max(al,0.));
 float sh=cnS(cnGR*(1.+.5*al),cnGR*.7,abs(ac))*cnS(-.02,.06,al);
 return vec2(1.-.75*sh*fade,cnS(0.,.1,al)*fade*cnBump(ac/w)*.05/w);
}
// The linen, from under the glass over the table's edge: x how much of it, y and z how its folds lean.
vec3 cnLinen(vec2 q){
 float hang=cnS(cnZE+.45,cnZE-.1,q.y),n=noise(q*vec2(2.6,1.4)+4.);
 float x=q.x-.5+.1*q.y+.16*(n-.5)*(1.+hang),u=x*13.+4.*n,cz=(q.y+.2-.06*x)*34.;
 return vec3(cnS(-.6,-.5,uOwn[0]*.8)*cnS(-.4,-.1,uOwn[3])*cnS(.5,.494,abs(x))*cnS(.27,.264,q.y+.07*x+.06*n),cos(u)*(.3+.6*hang),.9*(noise(q*6.)-.5)+.7*cnBump(cz)*cz);
}
float cnPlaster(vec2 q){
 float a=0.,k=.5;q*=1.9;
 for(int i=0;i<4;i++){a+=k*noise(q);q=mat2(1.68,1.26,-1.26,1.68)*q+3.7;k*=.55;}
 return a;
}
// Stone, plaster, wood and linen: everything that stands still.
vec3 cnRoom(vec3 ro,vec3 rd,float px,out float tb){
 float tE=(cnZE-ro.z)/max(rd.z,1e-3),tT=rd.y<-1e-4?-ro.y/rd.y:1e5;
 vec3 e=ro+rd*tE;
 if(tE>0.&&e.y<0.){// the front of the table, in its own shadow, with the linen hanging before it
  tb=tE;
  float g=cnLight(vec3(e.x,0.,cnZE),vec3(0.,1.,0.),.12,0)*cnI;
  vec3 c=cnWarm(g*(6.*exp(e.y*70.)+.12*exp(e.y*5.)))*.3+vec3(.005,.0028,.0015)*cnI;
  vec3 li=cnLinen(vec2(e.x,cnZE+e.y*.8));
  float fo=sat(.45+.9*li.y),hem=cnS(-.36,-.354,e.y);
  vec3 l=(cnWarm(g*(4.*exp(e.y*12.)+.8)*mix(fo,1.,exp(e.y*40.)))*.75+vec3(.01,.006,.0036)*cnI*(.4+fo))*cnTint(1,.4*uPad)*(1.+.6*uPad);
  c=mix(c,l,li.x*hem);
  if(uOwn[3]>0.) c+=cnDay(e,vec3(0.,0.,-1.),0)*vec3(.8,.79,.77)*mix(.85,.6+.4*fo,li.x*hem);
  return c;
}
 float tW=rd.z>0.?(cnZW-ro.z)/rd.z:-1.;
 vec3 fw=ro+rd*tW;
 float ad=tW>0.?cnArch(fw.xy):-1.,inn=cnS(px,-px,ad);
 vec3 outer=vec3(0.);
 if(inn<1.&&tW<tT){// the wall outside the niche: almost nothing
  outer=vec3(.0075,.0042,.0024)*(.5+.5*cnI)*(.35+exp(-max(ad,0.)*2.))+cnWarm(.04*cnI)*exp(-max(ad,0.)*60.)*.25;
  if(uOwn[3]>0.) outer+=cnDay(fw,vec3(0.,0.,-1.),0)*(.85+.3*cnPlaster(fw.xy))/(1.+exp(fw.x*.9-.6));
  if(cnL.z<cnZW) outer+=cnWarm(cnLight(fw,vec3(0.,0.,-1.),.1,0)*cnI)*.16;
  tb=tW;if(inn<=0.) return outer;
}
 // inside: the back wall, or the sides and the vault
 vec3 alb=vec3(.66,.55,.43),n=vec3(0.,0.,-1.);
 tb=rd.z>1e-3?(cnZB-ro.z)/rd.z:1e4;
 vec3 pos=ro+rd*min(tb,50.);
 if(cnArch(pos.xy)>0.){
  float sx=rd.x>0.?1.:-1.,tx=(cnCX+sx*cnW-ro.x)/(sx*max(abs(rd.x),1e-4));
  tb=tx;n=vec3(-sx,0.,0.);
  if(ro.y+rd.y*tx>cnSP){
   vec2 o=vec2(ro.x-cnCX,(ro.y-cnSP)*cnRi),D=rd.xy*vec2(1.,cnRi);float A=dot(D,D)+1e-6,B=dot(o,D);
   tb=(-B+sqrt(max(B*B-A*(dot(o,o)-cnW*cnW),0.)))/A;
   n=vec3(-(o+D*tb)/cnW,0.);if(cnRi!=1.) n=normalize(n*vec3(1.,cnRi,0.)+1e-5);
}
}
 bool table=tT<tb||tT<tW,back=n.z<-.5&&!table;
 if(table){tb=tT;n=vec3(0.,1.,0.);}
 pos=ro+rd*tb;
 float ao=.25+.75*cnS(-1.7,-.1,pos.x),linen=0.;
 if(table){
  float gr=noise(vec2(pos.x*1.6+2.*noise(pos.xz*.7),pos.z*34.));
  alb=vec3(.4,.26,.15)*(.6+.7*gr);
  ao*=cnS(.02,.3,length(pos.xz-cnB.xz))*cnS(.02,.24,length(pos.xz-cnP.xz))*cnS(.05,.36,length(pos.xz-cnJ.xz))*cnS(-.2,.3,cnZB-pos.z);
  vec3 li=cnLinen(pos.xz);linen=li.x;
  alb=mix(alb,vec3(.8,.72,.6)*(.8+.12*noise(vec2(pos.x*90.,pos.z*5.))+.1*sin(pos.x*330.)*cnS(.0045,.002,px)),linen);
  n=normalize(n-vec3(li.y,0.,li.z)*.4*linen);
}else{
  bool flat1=n.z<-.5;
  vec2 q=flat1?pos.xy:vec2(pos.z,pos.y<cnSP?pos.y:cnSP+cnW*atan(pos.y-cnSP,abs(pos.x-cnCX)+1e-4));
  float a1=cnPlaster(q);
  vec2 gd=vec2(a1-cnPlaster(q+vec2(.04,0.)),a1-cnPlaster(q+vec2(0.,.04)))/.04;
  n=normalize(n+(flat1?vec3(gd,0.):vec3(n.y*gd.y,-n.x*gd.y,gd.x))*.11);
  alb*=(.7+.5*a1)*vec3(1.,.9,.8);
  ao*=(.5+.5*cnS(0.,.35,pos.y))*(.6+.4*cnS(0.,.5,flat1?-cnArch(pos.xy):cnZB-pos.z));
}
 if(uOwn[3]>0.) alb=mix(alb,vec3(.84,.82,.78)*(.85+.2*noise(pos.xz*5.+pos.y*3.)),uOwn[3]);
 vec3 light=cnWarm(cnLight(pos+n*.004,n,.12,0)*cnI*ao);
 if(table){
  vec2 ca=cnCaustic(pos);vec3 v=cnL-pos;
  float ed=exp(-(pos.z-cnZE)*34.); // the worn edge takes the light
  light*=ca.x*mix(vec3(1.),cnTint(1,.4*uPad)*(1.3+uPad),linen)*(1.+1.1*cnS(-.2,-.8,pos.z))*(1.+3.2*ed*(1.-.5*linen));
  light+=cnWarm(cnI*ca.y*2./(dot(v,v)+.3))*cnTint(3,.3*uPhrase)*(.6+1.6*uPhrase);
}else{
  light*=cnTint(2,.3*uTexture)*(1.+.3*uTexture)*(1.+piece(vec2(sat(.5+(pos.x-cnCX)*.36),sat(1.-pos.y*.55))).rgb*(.4+uEnergy));
}
 light+=vec3(.011,.0062,.0035)*cnI*ao*(.6+uSpace); // what the niche gives back
 if(uOwn[3]>0.) light+=cnDay(pos,n,0)*(.4+.6*ao);
 alb*=light;
 if(uOwn[4]>0.) alb=mix(alb+uOwn[4]*alb/(light+.1)*uKind[1]*uKind[1]*.5*cnS(.4,1.45,pos.z)*sat(n.z*-.2+n.y+.6),back?cnSky(vec3(rd.xy*2.6+vec2(0.,.1),rd.z)):alb,uOwn[4]*(back?1.:0.));
 return table&&tT<tW?alb:mix(outer,alb,inn);
}
// The things on the table: x how near, y which (1 bowl, 2 pear, 3 jug).
float cnBot(vec2 c,vec4 b){return smin(length(max(vec2(c.x-b.x+.1,abs(c.y-b.y*.5)-b.y*.5+.1),0.))-.1,length(max(vec2(c.x-b.z,abs(c.y-b.w*.5)-b.w*.5),0.))-.012,.16)+.004;}
float cnEgg(vec3 q,vec3 r){return (length(q/r)-1.)*min(r.y,r.z);}
vec2 cnMap(vec3 p){
 float tall=cU(uOwn[5]),stone=cU(-uOwn[5]),sc=1.-cU(-uOwn[0]),many=cU(uOwn[0]);
 vec3 q=p-cnB;q.y/=.86;
 vec2 c=vec2(length(q.xz),q.y);
 float d=(c.y>-.0408*c.x?length(c-vec2(.4896,-.02)):abs(length(c)-.49))-.017;
 d=smin(d,length(vec2(c.x-.19,c.y+.5))-.04,.05)*.86;
 if(tall>0.) d=mix(d,cnBot(vec2(c.x,p.y),vec4(.3,.42,.06,.92)),tall);
 if(stone>0.){vec3 e=p-cnB;d=mix(d,min(cnEgg(e+vec3(0.,.26,0.),vec3(.56,.23,.46)),min(cnEgg(e-vec3(.04,.115,0.),vec3(.36,.145,.3)),cnEgg(e-vec3(-.03,.35,.02),vec3(.2,.1,.18)))),stone);}
 vec2 best=vec2(d,1.);
 q=p-cnP;float z=1.;
 z=max(sc-cU(uOwn[1]),.02);q.y=(q.y+.2)/z-.2;q.xz/=z;q.xy=rot(.22)*q.xy;if(tall>0.) q.xy=rot(-.22*tall)*q.xy;
 d=smin(length(q)-.2,length(q-vec3(0.,.23,0.))-.085,.16);
 if(stone>0.) d=mix(d,cnEgg(q+vec3(0.,.08,0.),vec3(.26,.12,.2)),stone);
 else{c=vec2(length(q.xz),q.y-.3);c.y-=sat(c.y/.1)*.1;d=min(d,length(c)-.011);}
 if(tall>0.) d=mix(d,cnBot(vec2(length(q.xz),q.y+.2),vec4(.15,.34,.05,.56)),tall);
 d*=z;
 if(d<best.x) best=vec2(d,2.);
 q=p-cnJ;z=1.;
 if(many>0.){float k=cnNo(q.x);q.x-=.66*k;q.z+=.1*k*k-.1*abs(k);z=k==0.?1.:many*(.82+.3*fract(k*.618+.3));}
 z*=max(sc,.02);q.y=(q.y+.42)/z-.42;q.xz/=z;
 c=vec2(length(q.xz),q.y);
 d=length(c*vec2(1.,.84)-vec2(0.,-.11))-.31;
 d=smin(d,max(c.x-.116-.35*max(c.y-.3,0.),abs(c.y-.24)-.2),.1);
 d=min(d,length(vec2(length(q.xy-vec2(-.2,.2))-.15,q.z))-.028);
 d*=.85;
 if(tall>0.) d=mix(d,cnBot(vec2(c.x,q.y+.42),vec4(.21,.66,.055,1.16)),tall);
 if(stone>0.) d=mix(d,cnEgg(q+vec3(0.,.06,0.),vec3(.42,.46,.36)),stone);
 d=max(d*z,-p.y);
 return d<best.x?vec2(d,3.):best;
}
vec4 cnThing(vec3 pos,vec3 rd,int id){
 vec2 e=vec2(.0015,-.0015);
 vec3 n=normalize(e.xyy*cnMap(pos+e.xyy).x+e.yyx*cnMap(pos+e.yyx).x+e.yxy*cnMap(pos+e.yxy).x+e.xxx*cnMap(pos+e.xxx).x+1e-9);
 vec3 alb,v=cnL-pos,stain=vec3(1.);float spec=.2,thru=0.,near=cnI/(dot(v,v)+.06);
 v=normalize(v);
 if(id==1){// thin clay lets the light through, most by the rim
  alb=vec3(.7,.62,.5)*(.85+.1*noise(pos*14.)+.1*noise(vec2(pos.y*60.,1.)));
  spec=.6;stain=cnTint(0,.45*uDrone);
  thru=.32*pow(cnS(.02,.5,pos.y),4.)*cnBump((pos.x-cnL.x+.06)*2.)*(.35+.65*uDrone);
}else if(id==2) alb=mix(vec3(.5,.36,.1),vec3(.45,.16,.07),cnS(.35,.75,noise(pos*4.)));
 else alb=vec3(.32,.16,.09)*(.7+.5*noise(pos*9.));
 float d=cnLight(pos+n*.006,n,.06,id)*cnI;
 vec2 w=vec2(cnZB-pos.z,pos.x-cnL.x); // what the lit wall and the table send back
 float back=.1*sat(.1+.9*n.z)/(.5+w.x*w.x)+.11*sat(.5-.5*n.y)*cnS(-.1,.75,pos.x-cnB.x)/(.4+w.y*w.y);
 vec3 light=cnWarm(d)+cnWarm(near*thru*1.6)*vec3(1.,.5,.24)+cnWarm(back*cnI)+vec3(.007,.0036,.002)*cnI*(.6+.4*n.y);
 float sp=pow(sat(dot(n,normalize(v-rd+1e-4))),60.)*step(1e-4,d)*min(near,4.),fr=pow(1.-sat(-dot(n,rd)),4.);
 if(uOwn[5]!=0.){stain=mix(stain,cnTint(id-1,.6),abs(uOwn[5]));alb=mix(alb,vec3(.45,.42,.38)*(.6+.5*noise(pos*9.)+.3*noise(pos*31.)),cU(-uOwn[5]));}
 if(uOwn[3]>0.) light+=cnDay(pos,n,id);
 vec3 col=alb*light*stain+cnWarm(sp*spec*1.2+fr*spec*cnI*.14*sat(n.y+n.z+.4));
 return vec4(col,cnS(0.,.14,-dot(n,rd))); // a smooth outline
}
vec3 cnLamp; // the foot of the flame
float cnBend,cnHit;
// All but the glass.
vec3 cnSee(vec3 ro,vec3 rd,float px,float t,float far,bool maybe,out float tb){
 vec3 col=cnRoom(ro,rd,px,tb);
 float hit=0.,t0=t;
 if(maybe) for(int i=0;i<44;i++){
  vec2 m=cnMap(ro+rd*t);
  if(m.x<.0016){hit=m.y;break;}
  t+=m.x;if(t>min(tb,far)) break;
}
 if(hit>0.&&t<tb+.01){
  vec4 th=cnThing(ro+rd*t,rd,int(hit+.5));
  float u=t,off=0.;
  if(th.a<.98) for(int i=0;i<24&&u<tb;i++){// behind its outline may be another side of it
   float m=cnMap(ro+rd*u).x;
   if(m>.006) off=1.;else if(off>0.&&m<.0016){th.a=1.;break;}
   u+=abs(m)+.003;
}
  col=mix(col,th.rgb,th.a);tb=t;
}
 // the flame, in the plane it stands in
 float bend=cnBend,c=cnHit;
 vec3 fp=cnLamp;float tf=(fp.z-ro.z)/rd.z;if(tf<0.) return col;
 vec3 q=ro+rd*tf-fp;
 if(tf<tb&&(uOwn[2]<0.||uOwn[6]>0.)){
  float x=abs(q.x)/.05;
  col=mix(col,cnWarm(cnI*(1.6*exp(min(q.y,0.)*8.)+.16))*(.45+.55*sqrt(sat(1.-x*x))),cnS(1.05,.95,x)*cnS(.005,-.005,q.y)*cnS(0.,.2,cU(-uOwn[2])+cU(uOwn[6])));
}
 vec2 fq=q.xy/cnHgt;fq.x-=bend*.9*fq.y*fq.y+.05*cnWaver(2.)*sat(fq.y);
 vec2 fm=cnFlame(fq,.3);
 float lan=cU(uOwn[2]);
 if(tf<tb){
  col=mix(col,vec3(6.,4.2,2.)*(.35+fm.y),fm.x*(1.-lan));
  if(lan>0.){
   vec2 g=(q.xy-vec2(.02*cnWaver(2.)+.06*bend,.3))/(.31*lan);float l=length(g),h=sqrt(sat(1.-l*l));
   col=mix(col,cnWarm(cnI*(.55+.9*h*exp(-2.2*dot(g-vec2(0.,-.25),g-vec2(0.,-.25))))*(.84+.16*cos(asin(clamp(g.y,-1.,1.))*22.))*1.15),cnS(1.,.97,l)*cnS(.93,.9,abs(g.y)));
}
}
 float y=q.y-cnHgt*.7;
 if(y>0.&&tf<tb&&lan<1.){
  float x=q.x-bend*.12-.05*y*sin(y*5.-uTime*.5)-.035*y*sin(y*11.-uTime*.83+1.),w=.006+.022*y;
  float s=cnBump(x/w)+.35*cnBump((x+.04*y*sin(y*7.-uTime*.6))/(w*1.6)),puff=cnBump((y-.1-.9*(1.-c))/.3)*c;
  col+=cnWarm(cnI*s*(.06+2.*puff)/(.35+3.*y*y))*vec3(.8,.95,1.2)*cnTint(4,.3)*.4*cnS(0.,.05,y)*(1.-lan);
}
 return col;
}
vec3 cnOne(vec2 p){
 float c=uHits,bend=4.*c*(1.-c),up=cU(uOwn[7]),low=cU(-uOwn[7]);
 cnBend=bend;cnHit=c;
 cnHgt=.13+.17*uLevel;
 cnLamp=vec3(.1,.27,.66);
 if(uOwn[2]<0.) cnLamp.y-=.42*uOwn[2];
 if(uOwn[6]!=0.) cnLamp=uOwn[6]>0.?mix(cnLamp,vec3(.42,cnLamp.y+.03,-.38),uOwn[6]):mix(cnLamp,vec3(-1.9,1.05,-1.7),-uOwn[6]);
 cnL=cnLamp+vec3(.012*cnWaver(2.)+.14*bend,cnHgt*.55,0.);
 cnL.y+=.2*cU(uOwn[2]);
 cnI=(.7+(.75+.5*uEnergy)*uLevel+.15*c+.9*uCue+.15*uMic)*(1.+.03*cnWaver(1.)+(.006+.07*uKeys)*cnQuick(1.));
 if(uOwn[6]<0.) cnI*=1.-4.*uOwn[6];
 float wide=1.+.75*sat(1.2-uRes.x/uRes.y); // a tall picture steps back
 p*=wide;
 vec3 ro=vec3(.12*sin(uTime*.041)-.1,.98+.03*sin(uTime*.057),-4.7),ta=vec3(.26,.58,0.);
 if(uOwn[7]!=0.){ro+=up*vec3(0.,1.75,.75)+low*vec3(-.55,-.72,1.2);ta+=up*vec3(-.12,-.28,.1)+low*vec3(-.2,.02,0.);}
 vec3 rd=cnEye(ta-ro,2.3-.25*low,p);
 float px=2.6*wide/uRes.y,tb;
 bool other=uOwn[0]!=0.||uOwn[5]!=0.||uOwn[7]!=0.;
 vec3 col=cnSee(ro,rd,px,other?4.-.3*up-1.5*low:4.,6.4,other||(ro.y+rd.y*5.6<1.&&ro.y+rd.y*4.>-.3),tb);
 vec3 at=ro+rd*tb;
 if(uOwn[3]<0.&&abs(at.y)<.004&&rd.y<0.){
  float tr;vec2 w=at.xz*vec2(5.,16.)+vec2(0.,uTime*.25);
  vec3 r=normalize(reflect(rd,normalize(vec3(.05*(noise(w)-.5),1.,(.1+.3*bend)*(noise(w+9.)-.5)))));
  vec3 m=cnSee(at+r*.01,r,px,.02,3.,r.y<.75,tr);
  col=mix(col,m*(.25+.7*pow(1.-sat(-rd.y),3.))*vec3(.92,.97,1.)+vec3(.002,.0018,.0015),-uOwn[3]);
}
 // the glass of water
 vec2 o=ro.xz-cnGl.xz;float A=dot(rd.xz,rd.xz),B=dot(o,rd.xz),h=B*B-A*(dot(o,o)-cnGR*cnGR);
 float gone=1.-cU(-uOwn[0]);
 if(h>0.&&gone>0.){
  h=sqrt(h);
  vec3 g0=ro+rd*((-B-h)/A),g1=ro+rd*((-B+h)/A),g=col;
  if(g0.y>0.&&g1.y<cnGH+.012){
   vec3 n=vec3((g0.xz-cnGl.xz)/cnGR,0.).xzy,st=cnTint(3,.3*uPhrase)*(.85+uPhrase);
   float ex=sat(-dot(n,normalize(vec3(rd.x,0.,rd.z)))),edge=pow(1.-ex,3.),side=sat(dot(n.xz,normalize(cnL.xz-cnGl.xz)));
   if(g0.y<cnGWater) // the flame, turned from side to side by the water
    g=(col*.5*(.2+.8*ex)+cnWarm(cnI*(cnBump((n.x-.6)/.08)*cnBump((g0.y-.22)/(cnHgt*.5))*2.4+.3*cnBump((n.x-.7)/.22)+.12*cnS(-.4,.9,n.x)*cnS(0.,.4,g0.y))))*st;
   g*=1.-.75*edge;
 // the rim, the line of the water, the thick foot
   float ln=cnS(.012,0.,abs(cnGH-g0.y))+.7*cnS(.01,0.,abs(cnGH-g1.y));
   ln=ln*(.2+.8*edge+.5*side)+.3*cnS(.012,0.,abs(g0.y-cnGWater))+.45*cnS(.01,0.,abs(g1.y-cnGWater))+.2*cnS(.05,0.,g0.y)+.15*step(cnGWater,g0.y)*step(g1.y,cnGWater);
   g+=cnWarm(cnI*(.5*ln+.9*edge*side))*st*.55;
   col=mix(col,g,cnS(0.,.03,h)*gone);
}
}
 // the halo in the air
 vec3 oc=ro-cnL;float b=dot(oc,rd);
 float fog=cU(-uOwn[4]),near=dot(oc,oc)-b*b;
 if(fog>0.) col=mix(col,(uKind[1]*uKind[1]+.1)*(.12+.4*uLevel+.5*cnI/(1.+2.*near))*(.7+.5*noise(vec3(p*2.5,uTime*.07))),fog*(1.-.72*exp(-.7*cU(tb-4.2))));
 col+=cnWarm(cnI*(.018+.03*uSpace)*(1.+1.2*c)/(near+.03+.05*uSpace))*(.1+.9*cnS(.15,.6,ro.z+rd.z*tb))*(uOwn[6]<0.?1.+.9*uOwn[6]:1.);
 return col;
}

const float cnD=.8,cnTop=12.;float cnH,cnGap,cnSz; // a step deep and high, candles apart, the last step with any
float cnOff(float row){return fract(row*.618+.1)*cnGap*(uOwn[6]<0.?1.+uOwn[6]:1.);}
// Where a candle stands;c is its height (0: none here), its half width, its own number and its kind.
vec3 cnStand(float cell,float row,out vec4 c){
 vec4 j=fract(vec4(cell,row,cell,row)*vec4(.1031,.103,.0973,.1099)+.37);j+=dot(j,j.wzxy+33.33);j=fract((j.xxyz+j.yzzw)*j.zywx);
 c=vec4(j.w>.9-.02*row||row>cnTop?0.:.1+.34*j.z*j.z,.05+.03*j.y,cell*3.+row*7.,mod(cell*2.+row*3.+200.,5.));
 float loose=.44,deep=.35;
 if(uOwn[6]!=0.){
  float k=cU(uOwn[6]),o=cU(-uOwn[6]),g=noise(vec2(cell*cnGap*.9+3.,row*.8));
  loose*=1.-o+.25*k;deep*=1.-o+.2*k;
  c.x=mix(mix(c.x,row>cnTop?0.:.2,o),g<.45||row>cnTop?0.:.1+(.1+1.1*j.z*j.z)*(g-.3),k);
}
 if(uOwn[2]<0.&&c.x>0.){c.x*=1.-1.9*uOwn[2];c.x-=.2*uOwn[2];c.y*=1.+.5*uOwn[2];}
 if(uOwn[0]!=0.) c.xy*=cnSz;
 return vec3((cell+.5+(j.x-.5)*loose)*cnGap+cnOff(row),cnH*row,cnD*row+.4+(j.y-.4)*deep);
}
// A breath that runs across the near steps on a hit.
float cnGust(vec3 b,float row){return uHits<.004?0.:cnBump((b.x*.22-.5+uHits)*4.)*exp(-abs(row-2.)*.4)*uHits;}
// The stain of its kind on a candle's light, stronger as the kind sounds.
vec3 cnOwn(vec4 c){int k=int(c.w);return cnTint(k,.05+.17*cnLv[k]);}
// How brightly a candle burns.
float cnHow(vec3 b,vec4 c,float row){
 float m=piece(vec2(sat(.5+(b.x+.4*row)*.13),sat(1.-row*.08))).a;
 float a=.3+(.7*cnLv[int(c.w)]+.3*uBands[int(mod(c.z+160.,16.))]+.6*m)*(.55+.5*uEnergy);
 a*=1.+.05*cnWaver(c.z);if(uKeys>.004) a*=1.+.09*uKeys*cnQuick(c.z);
 a+=1.6*cnGust(b,row);if(uCue>.004) a+=uCue*cnBump((row*.09-1.+uCue)*1.3);
 return a*mix(.06+.94*cnS(cnTop+1.,4.,row),.8,.6*cU(uOwn[2]));
}
vec3 cnMany(vec2 p){
 float up=cU(uOwn[7]),low=cU(-uOwn[7]),lan=cU(uOwn[2]),fog=cU(-uOwn[4]),wet=cU(-uOwn[3]),day=cU(uOwn[3]),flat1=cU(-uOwn[1]);
 cnH=.3+uOwn[1]*(uOwn[1]>0.?.36:.298);cnGap=1.6*exp2(-uOwn[0]*(uOwn[0]>0.?.95:1.25));cnSz=exp2(-.6*uOwn[0]);float cnLim=min(1.,cnGap*cnGap/2.56);
 vec3 ro=vec3(.12*sin(uTime*.037),2.3+.04*sin(uTime*.051),-1.9);
 ro+=vec3(.3*up,2.6*up-1.55*low,-.4*up);
 float far=5.;if(uOwn[1]!=0.||uOwn[2]!=0.||uOwn[7]!=0.||uOwn[0]<0.) far=11.-3.*up;
 const float foc=1.5;
 vec3 rd=cnEye(vec3(-.42,-.11+uOwn[1]*(uOwn[1]>0.?.24:.1)-.62*up+.2*low,1.),foc,p);
 // the plane through the edges of the steps, then the notch behind it
 vec2 sl=vec2(-cnH,cnD)/length(vec2(cnH,cnD)); // its normal, in z and y
 float dn=rd.z*sl.x+rd.y*sl.y,t=-(ro.z*sl.x+ro.y*sl.y)/min(dn,-1e-3);
 bool hit=dn<-2e-3;
 float st=hit?floor((ro.z+rd.z*t)/cnD):40.,ty=(st*cnH-ro.y)/min(rd.y,-1e-4),tz=((st+1.)*cnD-ro.z)/max(rd.z,1e-3);
 if(uOwn[4]>0.||uOwn[3]>0.) hit=hit&&st<cnTop+2.5;
 bool tread=rd.y<0.&&(ty<tz||cnH<.01);
 float tb=tread?ty:tz,px=1.2/uRes.y,alpha=0.;
 vec3 pos=ro+rd*tb,n=tread?vec3(0.,1.,0.):vec3(0.,0.,-1.),light=vec3(0.),air=vec3(0.),front=vec3(0.);
 vec2 sq=vec2(pos.x,tread?pos.z:pos.y+5.*st);
 float n1=hit?noise(sq*9.):0.,tex=hit?.35+.6*noise(sq*3.)+.4*n1:0.;
 n=normalize(n+.4*vec3(n1-.5,0.,0.));
 if(hit&&st<cnTop+2.&&wet*flat1<1.) for(int k=0;k<2;k++){
  vec4 c;vec3 b=cnStand(floor((pos.x-cnOff(st))/cnGap-.5)+float(k),st,c),v=b+vec3(0.,c.x+.09,0.)-pos;
  float d2=dot(v,v);if(c.x==0.||d2>1.5*cnLim) continue;
  float a=cnHow(b,c,st),l=sat(dot(n,v)*inversesqrt(d2))/(d2+.03),own=c.y*max(v.y,0.)*16.;
  l*=.3+.7*cnS(.2*own,1.2*own+.04,length(pos.xz-b.xz)); // its wax stands in its own light
  float fa=1.-d2/(1.5*cnLim);if(uOwn[0]>0.) fa*=mix(1.,fa,uOwn[0]);
  light+=cnWarm(l*a*.24*fa)*cnOwn(c);
}
 for(int k=0;k<13;k++){
  if(float(k)>=far) break;
  float row=min(st,cnTop)-float(k);
  float u=(cnD*(row+.5)-ro.z)/max(rd.z,.05);
  if(u<0.||ro.y+rd.y*u-cnH*row>(far>5.?2.4:1.25)) continue; // seen over
  vec4 c;vec3 b=cnStand(floor((ro.x+rd.x*u-cnOff(row))/cnGap),row,c),q=b+vec3(0.,c.x+.07,0.)-ro;
  float z=dot(q,cnF);if(c.x==0.||z<.4) continue;
  float sc=foc/z,ap=px/sc;vec2 o=p/sc-vec2(dot(q,cnRt),dot(q,cnV));float h2=dot(o,o),lim=sat(1.-h2/(uOwn[0]>0.?.22*cnLim:.22));
  if(lim==0.&&abs(o.x)>.1+.3*lan) continue;
  float clear=fog>0.?exp(-fog*.16*cU(z-2.)):1.;
  vec3 tint=cnOwn(c);
  float a=cnHow(b,c,row);
  air+=(1.+fog)*clear*vec3(1.,.5,.17)*tint*(a*.012*(.6+.8*uSpace)*lim*lim*lim/(h2+.022));
  if(abs(o.x)>.12+.3*lan||abs(o.y)>(far>5.?1.9:.6)) continue;
  float fh=(.1+.08*min(a,1.5))*cnSz,cw=c.y,yt=-.07,r2=sqrt(max(0.,1.-o.x*o.x/(cw*cw))),e2=r2*cw*sat((ro.y-b.y)/z);
  float hid=max(0.,(b.y-ro.y)/z)*(b.z-cnD*row)*.9; // what the edge of the step hides
  float body=cnS(ap,-ap,abs(o.x)-cw)*cnS(-ap,ap,o.y-(yt-c.x+hid)+e2)*cnS(ap,-ap,o.y-yt-e2)*(1.-lan)*clear;
  float wax=(1.7*exp(-max(yt-o.y,0.)*10.)+.22)*(.45+.55*r2);
  front=mix(front,mix(cnWarm(wax*a*1.2)*vec3(1.,.84,.68)+day*vec3(.4,.4,.39),cnWarm(a*1.8),.8*cnS(ap,-ap,abs(o.y-yt)-e2))*tint,body);
  vec2 fq=vec2(o.x*1.2,o.y-yt)/fh;
  fq.x-=(.06*cnWaver(c.z+3.)+2.5*cnGust(b,row)*(1.-uHits))*fq.y*fq.y;
  vec2 fm=cnFlame(fq,.25+ap/fh*3.);
  fm.x*=(1.-lan)*clear;
  if(lan>0.){
   float R=(.11+1.6*cw)*lan;vec2 g=(o-vec2(.02*cnWaver(c.z+3.)+.3*cnGust(b,row),R*.9-.16))/R;float l=length(g);
   body=max(body,cnS(ap/R,-ap/R,l-1.)*clear);g.y+=.25;
   front=mix(front,cnWarm(a*(.35+1.1*exp(-1.8*dot(g,g)))*(.86+.14*cos(asin(clamp(g.y-.25,-1.,1.))*19.))*1.5)*tint,cnS(ap/R,-ap/R,l-1.)*clear);
}
  front=mix(front,mix(vec3(.8,.28,.06),vec3(5.,3.6,1.8),fm.y)*(.6+.4*min(a,1.5)),fm.x);
  alpha=mix(mix(alpha,1.,body),1.,fm.x);air*=1.-.7*body;
}
 vec3 col=vec3(.002,.0012,.0008),haze=vec3(0.);
 if(uOwn[4]>0.&&!hit) col=mix(col,cnSky(rd+vec3(.36,.14,0.)),uOwn[4]);
 if(day>0. ){haze=mix(vec3(.5,.6,.76),vec3(.8,.82,.84),sat(.5-rd.y*1.5))*(.75+.2*uLevel);col=mix(col,haze,day*(1.-cU(uOwn[4])));}
 if(hit){
  // the worn edge takes the light;its rim and the inner corner lie in shade
  float ed=tread?pos.z-cnD*st:(st+1.)*cnH-pos.y,co=tread?cnD-ed:cnH-ed;
  tex*=(.2+.8*cnS(0.,2.5*px*tb/(foc*(tread?-rd.y+.02:1.)),ed))*(.5+.5*cnS(0.,.08,co));if(flat1>0.) tex=mix(tex,.35+.6*noise(sq*3.)+.4*n1,flat1);
  col+=vec3(.42,.33,.26)*tex*(1.+.5*exp(-ed*(tread?40.:60.)))*(light+vec3(.034,.018,.009)*exp(-tb*.16)*(.5+uLevel));
  if(day>0.) col=mix(col,(light*.55+vec3(.5,.6,.78)*(.28+.5*sat(dot(n,vec3(-.36,.8,-.48))))*(.7+.3*uLevel))*(.72+.28*tex)*.95,day),col=mix(col,haze,day*(1.-exp(-cU(tb-3.)*.07)));
  if(uOwn[4]>0.) col+=uOwn[4]*uKind[1]*uKind[1]*.2*tex*sat(n.y+.2);
}
 if(wet>0.&&hit&&tread){
  vec2 w=pos.xz*vec2(3.,9.)+vec2(0.,uTime*.3);
  vec3 r=normalize(vec3(rd.x+.05*(noise(w)-.5),-rd.y+.16*(noise(w+5.)-.5),rd.z)),add=vec3(0.);
  for(int k=0;k<3;k++){
   float row=st+float(k);vec4 c;vec3 b=cnStand(floor((pos.x+r.x*(cnD*(row+.5)-pos.z)/max(r.z,.1)-cnOff(row))/cnGap),row,c);
   if(c.x==0.||row>cnTop) continue;
   vec3 v=b+vec3(0.,c.x+.1+.12*lan,0.)-pos;
   float al=dot(v,r);vec3 off=v-r*al;if(al<0.) continue;
   vec2 e=vec2(length(off.xz),off.y)/(vec2(.03,.08)+.02*al*vec2(.3,1.)+.13*lan);
   add+=cnWarm(cnHow(b,c,row)*(2.6*exp(-dot(e,e))+.06/(.08+dot(off.xz,off.xz)*20.)*exp(-off.y*off.y*9.)))*cnOwn(c);
}
  col=mix(col,col*.12+(add+(uOwn[4]>0.?uOwn[4]*cnSky(r+vec3(.36,.14,0.))*.6:vec3(0.)))*(.35+.65*pow(1.-sat(-rd.y),3.)),wet*max(flat1,cnS(0.,.06,pos.z-cnD*st)));
}
 if(fog>0.){haze=(uKind[1]*uKind[1]+.08)*(.16+.4*uLevel)*(.8+.5*p.y+.2*noise(vec3(p*1.5,uTime*.06)));col=mix(haze*fog,col,hit?exp(-fog*.24*cU(tb-1.5)):(1.-fog)*(1.-fog));}
 return mix(col,front,alpha)+air;
}

vec3 render(vec2 p){
 cnW=1.42*(1.+uOwn[1]*(uOwn[1]>0.?-.22:-.7));cnSP=.8+uOwn[1]*(uOwn[1]>0.?.6:.1);cnRi=exp2(-uOwn[1]*(uOwn[1]>0.?.25:2.2));
 for(int k=0;k<5;k++){vec3 c=uKind[k]*uKind[k];cnT[k]=min(c/max(dot(c,vec3(.35,.5,.15)),.08),1.7)*vec3(1.06,.92,1.);}// a stain
 cnLv=float[5](uDrone,uPad,uTexture,uPhrase,uLevel);
 return screenOf(uVar>.5?cnMany(p):cnOne(p));
}
