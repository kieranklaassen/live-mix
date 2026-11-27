// name: Jelly palace
// a: Unmoulded
// b: Inside the aspic
// what: A jelly in the shape of a palace, raspberry, lemon and clear, stands on a white damask cloth in window sun; the light lies in front as a pool of colour with a silver spoon in it, a green fish and an amber ring behind. Or we are inside one: a honey hall with ribs, fruit and bubbles hanging, a bite gone at the left.
// follows: A hit makes it wobble, and light runs out over the cloth or up the ribs; a cue cuts a clean wedge and lets it close. The drone deepens the colour, the pad is the sun, texture is the fish's stripes and the bubbles, a phrase leans the towers or rocks the fruit. The spectrum lights flutes and ribs, the piece tints the pool or the floor, the loop moves the sun.
// own: 0 gooseberry and lime at -1, plum and rose at 1; 1 clear as water at -1, milk jelly at 1; 2 a dark room with a low warm lamp at -1, pale snow light at 1; 3 a smooth mould at -1, deep twisted flutes at 1; 4 a low cake, or only the large slice of orange, at -1, tall spires, or more fruit, at 1; 5 near and low, or looking up into the dome, at -1, from above and far, or wide and down to the floor, at 1; 6 one jelly alone with no turrets, or round pearls for the fruit, at -1, square stepped towers, or flowers for the fruit, at 1; 7 a black polished table, or level layers and no bite, at -1, outdoors on open sand or ice, or the bite a mouth onto the sea, at 1 (6 and 7 at either end also dye the jelly in the sounds' colours)
vec3 jpS0,jpS1,jpS2,jpT0,jpT1,jpT2; // what each layer swallows, and the colour it scatters
vec3 jpL,jpSun,jpSky,jpW,jpHoney,jpHs; // the sun and its light, the room's, the wobble, the honey
vec2 jpDir,jpLean[3]; // the way shadows fall; how the towers lean
float jpTan,jpFl,jpTw,jpH,jpCut,jpMilk,jpPx;
const vec3 jpA=vec3(.5,0.,0.),jpB=vec3(-.72,0.,.62),jpC=vec3(1.95,0.,-.42);
// A soft step that may also run downward.
float jpE(float a,float b,float x) { x=sat((x-a)/(b-a));return x*x*(3.-2.*x);}
float jpSq(float x) { return x*x;}
float jpBell(float x,float w) { x/=w;return exp(-x*x);}
// How far from the middle, round or square.
float jpR(vec2 q) { float r=length(q);if (uOwn[6]>0.) { vec2 k=q*q;r=mix(r,.98*sqrt(sqrt(dot(k*k,vec2(1.))+1e-8))*.5+.49*max(abs(q.x),abs(q.y)),uOwn[6]);} return r+1e-4;}
// A scalloped edge of two to the n lobes.
float jpLobe(vec2 c,int n) {
 for (int i=0;i<n;i++) c=vec2(c.x*c.x-c.y*c.y,2.*c.x*c.y);
 return sqrt(.54+.46*c.x);
}
float jpDrum(float r,float y,float R,float lo,float hi,float k) {
 vec2 d=vec2(r-R,abs(y-.5*(lo+hi))-.5*(hi-lo))+k;
 return length(max(d,0.))+min(max(d.x,d.y),0.)-k;
}
float jpTower(vec3 q,float R,float H) {
 float r=jpR(q.xz),y=q.y;
 float f=jpFl*.075*(jpLobe(uOwn[6]>0.?q.xz/(length(q.xz)+1e-4):q.xz/r,3)-.8);
 float d=jpDrum(r-f,y,R-.07*y,-.2,H,.1);
 d=smin(d,jpDrum(r-f*.7,y,R*.72,H-.1,H+.2,.07),.05);
 d=smin(d,length(vec2(r-.4*f,(y-H-.2)*.8))-R*.56,.05);
 return smin(d,length(vec2(r,y-clamp(y,H+.2,H+.6)))-.1+.16*max(y-H-.35,0.),.12);
}
// The palace. All of it is bent by one wobble first.
float jpMap(vec3 p) {
 float y=p.y/jpH;
 float up=y*(.4+.3*y);
 p.xz-=jpW.x*up*vec2(1.,.35);
 vec3 q=p-jpA;q.y=y;
 float bul=1.+jpW.z*(.55-y);
 q.xz-=jpLean[0]*up;
 q.xz*=bul;
 float r=length(q.xz)+1e-4;
 float a=uTravel*.02+(jpTw+jpW.y)*y,ca=cos(a),sa=sin(a);
 vec2 c=mat2(ca,-sa,sa,ca)*q.xz/r;
 float f=jpFl*.085*(jpLobe(c,4)-.8);
 if (uOwn[6]>0.) r=mix(r,jpR(c*r),uOwn[6]);
 float d=jpDrum(r-f,y,.98-.1*y,-.2,.56,.1);
 d=smin(d,jpDrum(r-f*.9,y,.64-.06*y,.4,1.08,.09),.06);
 d=smin(d,(length(vec2(r-f*.8,(y-1.1)*.86))-.5),.05);
 d=smin(d,length(vec2(r,y-clamp(y,1.5,1.8)))-.115+.22*max(y-1.6,0.),.14);
 // the ring of eight little turrets
 vec2 e=abs(c*r);e=e.x<e.y?e.yx:e;
 e-=.775*vec2(.9239,.3827);
 float tr=length(e);
 float th=sat((y-.45)/.46);
 d=smin(d,(length(vec2(tr,y-clamp(y,.4,.88)))-.185+.11*th*th)*.9+.35*max(-uOwn[6],0.),.05);
 // the wedge a cue cuts
 if (jpCut>.001) {
  vec2 w=p.xz-jpA.xz-vec2(-.05,-.12);
  float wd=abs(w.x+.45*w.y)*.91+(w.y)*jpCut*.6;
  d=max(d,-wd);
 }
 bool left=p.x<.62;
 q=p-(left?jpB:jpC);q.y=y;q.xz-=jpLean[left?1:2]*up;q.xz*=bul;
 d=smin(d,jpTower(q,left?.44:.5,left?1.02:1.12)+max(-uOwn[6],0.),.12);
 return d*min(jpH,1.)*(1.05-.4*min(jpTw,.9));
}
vec3 jpNormal(vec3 p,float e,float d) {
 vec3 n=vec3(0.,1e-5,0.);
 for (int i=0;i<3;i++) { vec3 k=vec3(i==0,i==1,i==2);n+=k*(jpMap(p+k*e)-d);}
 return normalize(n);
}
// How much of the second and third layer lies on a way from y0 up to y1; and a thing that differs by layer.
vec2 jpLay(float y0,float y1) {
 float w=(y1-y0)/jpH;w=abs(w)<.02?.02:w;
 vec2 l=y0/jpH-vec2(.76,1.2);
 return sat((max(l+w,0.)-max(l,0.))/w);
}
vec3 jp3(vec3 a,vec3 b,vec3 c,vec2 m) { return a+(b-a)*m.x+(c-b)*m.y;}
// The room, out of focus: a dim wall, the window of the sun, and one behind us that makes the shine.
vec3 jpRoom(vec3 rd) {
 vec2 a=rd.xy/(abs(rd.z)+.12),b=a-vec2(.41,.42);
 float back=jpE(-.15,.15,rd.z);
 vec3 c=jpSky*mix(vec3(.07,.14,.17),vec3(.5,.47,.42),jpE(-.7,.75,a.x+.25*a.y));
 float bar=jpE(.01,.04,min(abs(b.x),abs(b.y+.425)));
 c+=(jpSun*1.5+jpSky*.3)*jpE(.04,-.03,max(abs(b.x)-.14,abs(b.y)-.46))*(.3+.7*bar)*back;
 b=abs(a-vec2(-.75,.75));
 vec3 shine=jpSky*4.5*jpE(.06,-.06,max(b.x-.3,b.y-.42))*jpE(.02,.07,min(b.x,b.y))*(1.-back);
 if (uOwn[7]<0.) c=mix(c,jpSky*(.03+.16*jpBell(a.y-.02,.35)*back)+jpSun*.10*jpBell(length(a*vec2(.7,1.)-vec2(-.05,.25)),.55)*back,-uOwn[7]);
 if (uOwn[7]>0.) { // open sky, a sun low in its haze, a far ridge
  float e=rd.y,g=sat(dot(rd,normalize(vec3(.42,.16,.9)))),ri=.035+.07*noise(vec2(atan(rd.x,rd.z+1e-5)*2.6+3.,1.))+.02*noise(vec2(atan(rd.x,rd.z+1e-5)*14.,5.));
  vec3 s=mix(jpSun*.55+jpSky*.35,jpSky*mix(vec3(.8),uKind[3],.45)*.85,jpE(-.02,.55,e));
  s+=jpSun*(.5*pow(g,12.)+2.2*jpE(.9986,.9994,g));
  s=mix(s,mix(s,jpSky*.35*(uKind[2]+.3)+jpSun*.12,.55),jpE(.004,-.004,e-ri));
  c=mix(c,s,uOwn[7]);shine*=1.-.8*uOwn[7];
 }
 return c+shine;
}
// Open ground: ripples the wind left, long swells, small stones or lumps of ice.
vec3 jpSand(vec2 x,vec3 c,float px) {
 vec3 k=mix(vec3(.80,.66,.48),uKind[2],.75);
 vec2 q=rot(-.35)*x;
 float far=jpE(.14,.0,px),b=q.y*5.+1.1*sin(q.x*.8+.6)+1.6*noise(q*vec2(.5,.9)),w=sin(b+.45*sin(b));
 float sw=noise(q*vec2(.22,.55)+3.)-.5,g=noise(x*34.)-.5;
 c*=k*(1.+(.20*w*(.4+noise(q*1.3))+.10*g)*far+.8*sw*(.4+.6*jpE(2.,8.,x.y)));
 vec2 s=x*1.6,h=hash22(floor(s)),f=fract(s)-.5-(h-.5)*.6;
 float R=.16*jpE(.80,1.,h.x)*(.4+h.y);
 float lit=dot(f,-jpDir)/(R+1e-3),st=jpE(R+px*2.,R-px*2.,length(f*vec2(1.,1.5)))*step(.02,R);
 c*=1.-.45*jpE(R*1.5+.01,.0,length((f-jpDir*R*1.1)*vec2(1.,1.4)))*step(.02,R);
 return mix(c,k*(jpSun*(.35+.45*lit)+jpSky*.45),st*.9);
}
// The cloth: damask, the sun on it, and the shadow of the palace, which is a pool of colour.
vec3 jpCloth(vec2 x,float px) {
 vec3 tau=vec3(0.);float gain=0.,inside=0.,contact=1.;
 for (int i=0;i<3;i++) {
  vec3 R=i==0?vec3(jpA.xz,.98):(i==1?vec3(jpB.xz,.46):vec3(jpC.xz,.52));
  if (i>0) R.z*=1.-max(-uOwn[6],0.);
  vec2 d=x-R.xy;
  float u=dot(d,jpDir),v=d.x*jpDir.y-d.y*jpDir.x,y=max(u-.72*R.z,0.)*jpTan/jpH,H=y/(i==0?1.95:1.65);if (i>0&&uOwn[6]<=-1.) continue;
  v+=(.02*sin(u*6.+uTime*.5)+jpW.x*.6)*y;
  float w=R.z*(1.-.1*y)*mix(1.,.66,jpE(.26,.32,H))*sqrt(sat(1.-jpSq(max(H-.55,0.)*2.)));
  if (u<0.) w=sqrt(max(R.z*R.z-u*u,0.));
  float k=v/(w+.02),in1=jpE(1.,.8-.1*y,abs(k))*step(.02,w);
  tau+=jp3(jpS0,jpS1,jpS2,jpLay(y*jpH,y*jpH+.05))*2.2*w*sqrt(sat(1.-k*k));
  float lob=.5+.5*cos(9.*asin(clamp(k,-1.,1.))+2.*sin(u*2.2+uTime*.21)+1.3*k);
  gain+=in1*(1.5*exp(-k*k*5.)+2.6*jpSq(jpSq(lob))*jpFl*(.4+y)-.5);
  gain+=1.1*jpE(.75,.95,abs(k))*jpE(1.14,1.,abs(k))*jpE(0.,.3,y)*step(.03,w);
  inside=max(inside,in1);
  contact=min(contact,mix(jpE(0.,.5,length(d)-.92*R.z),1.,i>0?max(-uOwn[6],0.):0.));
 }
 vec3 thr=exp(-tau);
 thr=mix(thr,thr*.5+.1*dot(thr,vec3(.333)),jpMilk);
 float pv=x.x*jpDir.y-x.y*jpDir.x;
 float lay=jpE(-2.6,-1.5,pv)*jpE(5.2,2.2,x.y)*(1.-.6*jpBell(pv+1.15,.07));
 if (uOwn[7]!=0.) lay=mix(lay,1.,abs(uOwn[7]));
 vec3 sun=jpSun*thr*mix(.2,1.,lay)*max(1.+gain*(.5+.4*uEnergy)*(1.-.7*jpMilk),.15);
 vec2 d=x-jpA.xz;
 vec4 m=piece(vec2(sat(.5+.28*(d.x*jpDir.y-d.y*jpDir.x)),sat(.95-.38*dot(d,jpDir))));
 sun=(sun+m.rgb*inside*(.2+.8*uEnergy)*(thr+.1)*jpSun)*(1.+.6*uHits*inside);
 vec3 c=vec3(.92,.93,.95)*(sun*.86+jpSky*(.2+.28*contact)*mix(vec3(1.),.15+.75*thr,.8*inside));
 if (uOwn[7]<0.) c=mix(c,(vec3(.05)+.9*inside*thr)*sun*.6+jpSky*.012,-uOwn[7]);
 if (uOwn[7]>=1.) return jpSand(x,c,px);
 vec3 bare=c;
 // the damask, only a change of sheen, and two ironed folds
 vec2 g=rot(.5)*x*vec2(1.9,1.4);
 float k=floor(g.x),e=.02+px*2.;
 vec2 f=vec2(g.x-k-.5,fract(g.y+.5*mod(k,2.))-.5);
 float og=abs(abs(f.x)-.25-.2*cos(TAU*f.y))-.05-.03*cos(5.*TAU*f.y);
 og=min(og,abs(length(f)-.14-.03*cos(6.*atan(f.y,f.x+1e-5)))-.06);
 c*=1.-.11*(jpE(e,-e,og)-.4)*jpE(.1,0.,px);
 vec2 fo=vec2(x.x*.94-x.y*.34+1.55,x.x*.34+x.y*.94+.95)/.11;
 c*=1.+.14*dot(fo,exp(-fo*fo));
 if (uOwn[7]<0.) c=mix(c,bare,-uOwn[7]);
 if (uOwn[7]>0.) c=mix(c,jpSand(x,bare,px),uOwn[7]);
 return c;
}
// The silver spoon on the cloth, its bowl in the pool.
void jpSpoon(vec2 x,vec3 rd,float px,inout vec3 c) {
 x-=vec2(-.72,-1.02);
 vec2 q=rot(-.5)*x,z=rot(-.5)*(x-jpDir*.07),b=vec2(-q.x/.3,q.y/.2);
 float s=-q.x,hw=.026+.04*jpE(.9,1.75,s)+.06*exp(-max(s-.26,0.)*14.),r=length(b);
 float bowl=(r-1.)*.2,d=min(bowl,max(abs(q.y)-hw,max(.2-s,s-1.9+4.*q.y*q.y)));
 c*=1.-vec3(.4,.37,.32)*jpE(.05,-.04,min((length(z/vec2(.3,.2))-1.)*.2,max(abs(z.y)-.03,abs(z.x+1.05)-.85)));
 vec3 n=mix(vec3(.08*sin(s*5.),1.,q.y/hw*.9),vec3(.62*b.x,1.,-.62*b.y),jpE(0.,-.02,bowl));
 n.xz=rot(.5)*n.xz;
 n=reflect(rd,normalize(n));
 vec3 m=jpSky*(.1+1.4*jpE(.25,1.05,n.x+.4*n.y)+.5*jpBell(n.x+.5,.3));
 m=mix(m,jpSun*.5*jpT0,.75*jpE(0.,.5,dot(n.xz,vec2(.77,.64)))*jpE(.95,.5,n.y));
 m+=jpSun*(6.*pow(sat(dot(n,jpL)),40.)*(1.+1.5*uHits)+.4*jpBell(r-.95,.06));
 c=mix(c,m,jpE(px,-px,d));
}
// The small jellies behind, out of focus: an amber ring and a green fish, seen flat.
void jpSmall(vec2 p,vec3 ro,vec3 fw,vec3 rt,vec3 uu,inout vec3 c) {
 for (int i=0;i<2;i++) {
  vec3 r=(i==0?vec3(-3.2,0.,2.9):vec3(-2.05,0.,1.8))-ro;
  float z=max(dot(r,fw),.5),d,hi;
  vec2 q=p*z/1.7-vec2(dot(r,rt),dot(r,uu));
  q.x+=jpW.x*q.y;
  vec3 k=i==0?mix(vec3(1.,.42,.05),uKind[4],.2):mix(vec3(.08,.5,.16),uKind[2],.22);
  c=mix(c,c*(k*1.2+.05),.9*jpE(1.,.1,length((q-vec2(-.3,-.12))*vec2(1.05,4.2))));
  vec2 f=q-vec2(-.05,.28);
  float dark=jpE(.3,-.25,f.y)*.7;
  if (i==0) {
   d=(length(f*vec2(1.6,3.3))-1.)*.3;
   dark=mix(dark,.9,jpE(1.2,.7,length(f*vec2(3.8,10.)-vec2(0.,.9))));
   hi=jpBell(d+.06,.03)*jpE(0.,.18,f.y);
  } else {
   f.y+=.45*f.x*f.x;
   float w=max(f.x-.34,0.);
   d=smin((length(f*vec2(2.,4.)+vec2(.16,0.))-1.)*.25,max(abs(f.x-.48)-.14,abs(abs(f.y-.1)-.4*w)-.06-.25*w),.1);
   dark*=1.+(.3+.7*uTexture)*sin(f.x*30.)*jpE(-.36,-.2,f.x);
   hi=jpE(.06,0.,length(f-vec2(-.42,.05)))+.7*jpE(.07,0.,abs(f.y-.14))*jpE(.4,.1,abs(f.x));
  }
  c=mix(c,k*(jpSun*(.2+.95*dark)+jpSky*.2)+jpSky*1.3*hi,jpE(.045,-.045,d));
 }
}
// The jelly itself, where the eye's ray meets it: in, through the layers, and out again bent.
vec3 jpGel(vec3 pos,vec3 rd,float d) {
 vec3 n=vec3(0.),ne=n,ri=rd,T=vec3(1.),S=vec3(0.),q=pos,qa=pos-jpA;
 float s=0.,sFloor=1e3;bool exits=false;
 s=length(qa.xz);
 float red=.3*jpH*jpE(.66,.8,s)*jpE(1.15,1.02,s)*jpE(.5,.62,length(pos.xz-jpB.xz)+max(-uOwn[6],0.))*(1.-max(-uOwn[6],0.)); // the turrets keep the base's colour almost to their tips
 s=0.;
 float bnd=band(abs(fract((atan(qa.z,qa.x+1e-5)+uTravel*.02+jpTw*pos.y)/TAU)*2.-1.));
 for (int side=0;side<2;side++) {
  ne=jpNormal(q,side==0?.006:.05-.09*red,d);
  if (side==1) break;
  n=ne;
  ri=refract(rd,n,.735);
  sFloor=ri.y<-1e-3?-pos.y/ri.y:1e3;
  float ds=.04;
  for (int i=0;i<8;i++) {
   float y0=pos.y+ri.y*s;
   ds=min(ds,sFloor-s);
   vec3 m=pos+ri*(s+.5*ds);
   s+=ds;
   q=pos+ri*s;
   vec2 ly=jpLay(y0-red,q.y-red);
   vec3 sg=jp3(jpS0,jpS1,jpS2,ly)*(1.+3.5*red*jpE(.6,.74,pos.y/jpH)),tn=jp3(jpT0,jpT1,jpT2,ly);
   // how far the sun has come through jelly to get here, gathered into shafts by the flutes
   vec2 cc=m.x<-.35?jpB.xz:(m.x>1.42?jpC.xz:jpA.xz);if (uOwn[6]<=-.5) cc=jpA.xz;
   float RR=cc.x==jpA.x?mix(.9,.55,jpE(.5,.65,m.y/jpH)):.44;
   vec2 e=m.xz-cc;
   float sp=max(RR+dot(e,jpDir),0.)+.02,v=(e.x*jpDir.y-e.y*jpDir.x)/RR;
   float shaft=.45+1.1*jpFl*jpSq(jpSq(.5+.5*cos(15.*v+3.*v*v*v)));
   vec3 lit=jpSun*exp(-(sg+.3)*sp*.8)*shaft*(1.+1.8*bnd*uEnergy)+jpSky*.12;
   S+=T*(1.-exp(-ds*(.42+4.*jpMilk)))*lit*tn;
   T*=exp(-(sg+3.*jpMilk)*ds);
   if (s>sFloor-1e-3) break;
   d=jpMap(q);
   if (d>-.004&&i>0) { exits=true;q-=ri*max(d,0.);d=0.;break;}
   ds=max(-d*1.3,.04);
  }
 }
 vec3 out1=refract(ri,-ne,1.36);
 vec3 rEx=dot(out1,out1)<.1?reflect(ri,ne):out1,rf=reflect(rd,n),bg=vec3(0.),env=bg;
 for (int i=0;i<2;i++) { vec3 r=jpRoom(i==0?rEx:rf);if (i==0) bg=r;else env=r;}
 vec2 fall=q.xz-rEx.xz*(q.y/min(rEx.y,-.02));
 vec3 cl=mix(jpSun*.8+jpSky*.3,(jpSun*.55*(jpT0+.25)+jpSky*.2),jpE(-.2,.4,dot(fall-jpA.xz,jpDir))*jpE(2.8,.9,length(fall-jpA.xz)));
 bg=mix(bg,cl,jpE(0.,-.05,rEx.y)*jpE(5.5,3.4,fall.y));
 if (dot(out1,out1)<.1) bg=mix(bg,jpSun*.35*jpT0,.6*sat(red*5.)); // light held in a turret comes out in its own colour
 bg+=jpSun*1.5*pow(sat(dot(rEx,jpL)),8.);
 if (!exits&&ri.y<-.02) bg=(jpSun*(.4+1.2*jpFl*jpSq(jpSq(.5+.5*cos(13.*((q.x-jpA.x)*jpDir.y-q.z*jpDir.x)+1.5*sin(4.*dot(q.xz,jpDir)+uTime*.2)))))+jpSky*.1)*(jpT0+.05)*(.6+.6*sat(.5-dot(q.xz-jpA.xz,jpDir)));
 float nv=sat(dot(n,-rd));
 vec3 col=bg*T*mix(.6,1.,jpE(.05,.6,nv))+S;
 env=mix(jpSky*.5+jpSun*.2,env,jpE(-.1,.05,rf.y));
 col=mix(col,env,.03+.8*pow(1.-nv,5.));
 float spec=pow(sat(dot(n,normalize(jpL-rd))),mix(60.,260.,uTone));
 vec2 w=pos.xz-jpA.xz-vec2(-.05,-.12);
 spec=spec*(2.+4.*uHits+5.*uKeys)+6.*uCue*(1.-jpCut)*jpBell(w.x+.45*w.y,.04)*step(w.y,0.);
 return col+jpSun*spec;
}
vec3 jpOutside(vec2 p) {
 float o5=uOwn[5],hi=max(o5,0.),lo5=max(-o5,0.);
 vec3 ta=vec3(.25*lo5+.42*max(-uOwn[6],0.),.68+.12*lo5+.42*max(uOwn[4],0.),0.);
 vec3 ro=vec3(-.15+.45*max(-uOwn[6],0.)+.05*sin(uTime*.041),1.9+1.3*hi-.97*lo5,-4.5-hi+.9*lo5-.5*max(uOwn[4],0.)-.3*(uSpace-.5));
 vec3 fw=normalize(ta-ro),rt=normalize(cross(vec3(0.,1.,0.),fw)),uu=cross(fw,rt);
 vec3 rd=normalize(fw*1.7+rt*p.x+uu*p.y),c=jpRoom(rd);
 float px=jpPx/1.7,tf=rd.y<-1e-3?min(-ro.y/rd.y,99.):99.;
 vec3 hit=ro+rd*tf,cl=jpCloth(hit.xz,px*tf*2.);
 if (uOwn[7]==0.) jpSpoon(hit.xz,rd,px*tf*1.2,cl);
 else if (abs(uOwn[7])<1.) { vec3 sp=cl;jpSpoon(hit.xz,rd,px*tf*1.2,sp);cl=mix(sp,cl,abs(uOwn[7]));}
 if (uOwn[7]<0.&&tf<40.) { // the polish gives the jelly back, upside down
  vec3 rr=vec3(rd.x,-rd.y,rd.z);
  float s=.05,e=0.;vec3 q=hit,g=jpRoom(rr)*.5;
  for (int i=0;i<16;i++) { q=hit+rr*s;e=jpMap(q);if (e<.012||s>6.) break;s+=e;}
  float on=jpE(.10,.0,e)*step(s,6.);
  vec2 ly=jpLay(q.y,q.y+.1);
  g=mix(g,jp3(jpT0,jpT1,jpT2,ly)*(jpSun*(.25+.5*sat(.5+dot(q.xz-jpA.xz,-jpDir)*.6))+jpSky*.15),on);
  cl=mix(cl,cl+g*(.12+.55*pow(1.-sat(-rd.y),3.)),-uOwn[7]);
 }
 cl*=1.+.45*uHits*jpBell(length(hit.xz-jpA.xz)-.9-1.7*(1.-uHits),.13);
 c=mix(cl,c,jpE(4.2+12.*max(uOwn[7],0.),5.6+40.*max(uOwn[7],0.),hit.z));
 if (uOwn[7]==0.) jpSmall(p,ro,fw,rt,uu,c);
 else if (abs(uOwn[7])<1.) { vec3 sm=c;jpSmall(p,ro,fw,rt,uu,sm);c=mix(sm,c,abs(uOwn[7]));}
 vec3 i1=(vec3(-1.35,0.,-1.15)-ro)/rd,i2=(vec3(2.6,2.1*jpH,1.25)-ro)/rd,mn=min(i1,i2),mx=max(i1,i2);
 float t=max(max(mn.x,mn.y),max(mn.z,0.)),t1=min(min(mx.x,mx.y),min(mx.z,tf)),near=9.,d=0.;
 bool on=false;
 for (int i=0;i<34;i++) {
  if (t>t1) break;
  d=jpMap(ro+rd*t);
  near=min(near,d/t);
  if (d<.7*px*t) { on=true;break;}
  t+=d;
 }
 c=mix(c,jpSky*.6,.5*jpE(2.,.6,near/px));
 for (int k=on?0:1;k<1;k++) c=jpGel(ro+rd*t,rd,d);
 return c;
}
vec3 jpFog(vec3 c,float back,float t) {
 back*=back;
 return c*exp(-jpHs*t)+jpHoney*(jpSun*(.05+.4*back*back)+jpSky*.06)*(1.-exp(-(.09+jpMilk)*t));
}
// fruit, from far to near: middle and size; its face and kind (0 a leaf, 1 a berry, else its segments)
const vec4 jpF[9]=vec4[9](vec4(-.5,1.15,1.6,.42),vec4(.5,.95,1.2,.38),vec4(.1,-.6,1.2,.42),vec4(.25,.25,.9,.3),vec4(-.1,.5,.8,.15),
  vec4(1.05,-.22,-.25,.7),vec4(-.06,-.24,0,.2),vec4(.88,.75,-1.2,.42),vec4(-.45,-.5,-.9,.26));
const vec4 jpN[9]=vec4[9](vec4(.5,-.5,-.8,9),vec4(-.6,-.3,-.8,10),vec4(-.3,.75,-.8,9),vec4(.3,.2,-1,0),vec4(0,0,-1,1),
  vec4(-.4,.25,-1,10),vec4(0,0,-1,1),vec4(.4,-.5,-.8,0),vec4(-.4,.6,-.8,8));
vec3 jpFruit(int i,out float R) {
 float o4=uOwn[4],ph=uTime*.3,fi=float(i);
 R=jpF[i].w*(i>7?jpE(0.,.6,o4):i==5?1.+.3*min(o4,0.):i==7?1.+min(o4,0.):1.+o4*(o4<0.?1.:.45))+1e-3;
 vec3 m=jpF[i].xyz;
 m.xy+=.02*vec2(sin(ph*.6+fi*2.1),cos(ph*.5+fi*1.7))+uPhrase*.05*vec2(sin(ph-fi*1.1),.6*cos(ph-fi*1.1));
 if (uOwn[6]<0.&&i!=4&&i!=6) R*=abs(1.+2.*uOwn[6]);
 return m+vec3(jpW.x*.6*(m.y+.8),-.06*uDrone,0.);
}
vec3 jpInside(vec2 p) {
 float o4=uOwn[4],o5=uOwn[5],rib=min(jpFl,1.6)*.9;
 vec2 sp=vec2(.34+.12*sin(TAU*uLoop),.26+.05*cos(TAU*uLoop));
 p.x+=.35*jpW.x*(p.y+.5)+.004*sin(p.y*7.+uTime*.23);
 vec3 ro=vec3(.12*sin(uTime*.037),.1,-2.5+.5*max(-o5,0.)),sunw=normalize(vec3(sp,1.));
 vec3 rd=vec3(p,.95-.28*max(o5,0.)+.35*max(-o5,0.));
 rd.yz=rot(.1-.25*o5)*rd.yz;
 rd=normalize(rd);
 float back=.5+.5*dot(rd,sunw);
 // the wall of the mould: straight, then closing in a dome
 float a=dot(rd.xz,rd.xz)+1e-4,b=dot(ro.xz,rd.xz),t=(-b+sqrt(max(b*b+a*(9.-dot(ro.xz,ro.xz)),0.)))/a;
 if (ro.y+rd.y*t>.75) {
  vec3 so=(ro-vec3(0.,.75,0.))*vec3(1.,1.3,1.),sd=rd*vec3(1.,1.3,1.);
  a=dot(sd,sd);b=dot(so,sd);
  t=(-b+sqrt(max(b*b-a*(dot(so,so)-9.),0.)))/a;
 }
 vec3 w=ro+rd*t;
 float ang=atan(w.x,w.z+1e-5),x=fract((ang+jpTw*.16*w.y)*20./TAU+.5)-.5;
 // the bright world outside, bent by a rib
 vec2 o=vec2(atan(rd.x,rd.z+1e-5)+.16*rib*sin(TAU*x),rd.y),s=o-sp;
 vec3 col=jpSky*(mix(.45,.12,jpE(0.,.5,o.y))+.8*jpE(-.12,-.3,o.y));
 a=dot(s,s);
 col+=jpSun*(1.-.45*max(-uOwn[1],0.))*(2.6*exp(-a*18.)+1.2*jpE(.3,.2,max(abs(s.x),abs(s.y)*.6))+.6*exp(-a*2.5));
 col*=1.-.6*rib*jpBell(.5-abs(x),.1)+.4*rib*jpBell(x,.13)+1.8*uEnergy*band(abs(ang)*1.2);
 // a cue cuts one clean wedge of daylight out of the wall
 float gap=abs(ang+.27-.05*w.y)-.13*jpCut;
 col=mix(col,jpSky*2.+jpSun*.6,jpE(.01,-.01,gap)*sat(jpCut*9.))+jpSun*5.*uCue*jpBell(gap,.05);
 // the red floor, with the sun lying on it
 float tf=rd.y<-.01?min((-1.05-ro.y)/rd.y,99.):99.;
 w=ro+rd*min(t,tf);
 a=jpBell(sin(5.*(w.x-.55*w.z)+.5*sin(w.z*2.+uTime*.13)),.45);
 col=mix(col,(jpT0+.03)*(jpSun*(.12+.7*back*back*a)+jpSky*.2+piece(vec2(.5+w.x*.2,.5-w.z*.18)).rgb*uEnergy*2.),jpE(0.,.5,t-tf));
 t=min(t,tf+.1);
 if (uOwn[7]<0.) { // level layers, each with a bright skin where it meets the next
  float h=ro.y+rd.y*min(t,2.8)+.02*sin(p.x*3.+uTime*.2)+.05*jpW.x*p.x,l=h*1.75+1.75,k=clamp(floor(l+.5),1.,4.),e=l-k;
  vec3 lo=k<1.5?uKind[0]:k<2.5?uKind[1]:k<3.5?uKind[2]:uKind[3],hi=k<1.5?uKind[1]:k<2.5?uKind[2]:k<3.5?uKind[3]:uKind[1];
  float st=jpE(-.06,.06,e);
  vec3 ly=mix(lo,hi,st);ly=ly*ly*1.1+ly*.1;
  jpHoney=mix(jpHoney,ly,-uOwn[7]);
  vec3 hs=(1.06-jpHoney)*.62*(.75+.5*uDrone)*(1.+.75*min(uOwn[1],0.));
  jpHs=mix(jpHs,hs,-uOwn[7]);
  col+=uOwn[7]*-1.*jpSun*(.35*jpBell(e-.07,.03)-.25*jpBell(e+.02,.05)*dot(col,vec3(.33)));
  col=max(col,0.);
 }
 col=jpFog(col,back,t);
 col*=1.+.7*uHits*jpBell(p.y+.42-1.1*(1.-uHits),.06);
 // the bite: scalloped scoops of air at the left
 vec3 m=mix(vec3(-2.08,-.02,.2),vec3(-.12,.0,1.1),max(uOwn[7],0.))-ro;
 float tb=dot(m,rd),dd=length(m-rd*tb);
 vec2 bq=rd.xy*tb-m.xy;
 float sc=abs(sin(2.5*atan(bq.y,bq.x+1e-5)+.5)),R=.9+.24*sqrt(sc);
 R*=1.+.55*max(uOwn[7],0.);R=mix(R,-.1,max(-uOwn[7],0.));
 float bite=jpE(R+2.*jpPx,R-2.*jpPx,dd);
 vec3 air=jpSky*(.07+.3*jpE(.5,-.8,bq.y)+.25*jpBell(sc,.2)*jpE(.5,1.,dd/R));
 R=max(R,.02);
 if (uOwn[7]>0.) { // out of the mouth: the sea, its sun, two far headlands
  vec2 s=bq-vec2(.42,.24);
  float d=-.16-bq.y,dep=1./(abs(d)+.04),w2=noise(vec2(bq.x*dep*1.4,dep*2.+uTime*.1));
  vec3 sk=mix(jpSun*.75+jpSky*.35,jpSky*mix(vec3(.75,.9,1.),uKind[2],.5)*.9,jpE(-.2,.9,bq.y))+jpSun*(.8*exp(-dot(s,s)*9.)+2.*jpE(.125,.115,length(s)));
  vec3 se=jpSky*mix(vec3(.15,.4,.45),uKind[0],.6)*(.35+.5*w2)+jpSun*1.4*jpE(.5,.8,w2)*exp(-abs(s.x)/(.06+.5*max(d,0.)));
  sk=mix(sk,jpSky*.35+jpSun*.15,.7*jpE(.01,-.01,bq.y+.16-.16*max(noise(vec2(bq.x*2.4+1.,2.))-.3,0.)-.12*jpE(-.4,-1.2,bq.x)));
  air=mix(air,mix(sk,se,jpE(-.006,.006,d)),uOwn[7]);
 }
 vec3 mir=jpHoney*(jpSun*(.1+.7*jpSq(sat(.5+bq.x+bq.y)))+jpSky*.1),n;
 col=mix(col,mix(air,mir,jpE(.82,.9,dd/R)*(.35+.65*jpE(.9,.99,dd/R))),bite);
 float kd[9]=float[9](4.,3.,2.,2.,2.,1.,0.,2.,3.);
 int count=o4>0.?9:8,n0=0,ids[4]=int[4](0,0,0,0);
 for (int i=0;i<count;i++) {
  m=jpFruit(i,R)-ro;
  tb=dot(m,rd);
  if (n0<4&&dot(m,m)-tb*tb<1.4*R*R) ids[n0++]=i;
 }
 for (int j=0;j<n0;j++) {
  int i=ids[j];
  float fi=float(i),seg=jpN[i].w;
  m=jpFruit(i,R)-ro;n=normalize(jpN[i].xyz);
  vec3 kc=i==6?vec3(.75,0.,.03):(i==1||i==8?vec3(1.,.75,.06):(i==0||i==5?vec3(1.,.27,.0):vec3(.2,.5,.06)));
  kc=mix(kc,kindColour(kd[i]),.12+.65*abs(uOwn[6]))*(1.+.5*uEnergy*(i==5?uPad:i==1?uPhrase:i==2?uTexture:0.));
  tb=dot(m,rd);dd=length(m-rd*tb);
   float soft=jpPx*tb*1.2+.016*abs(tb-2.4)*(1.3-.6*uTone),cov,cov2=0.;
   vec3 thru=jpSun*(.12+1.1*jpSq(back*back))+jpSky*.2,c=kc;
   if (seg==1.||uOwn[6]<-.5) {
    cov=jpE(R+soft,R-soft,dd);
    n=normalize(rd*(tb-sqrt(max(R*R-dd*dd,0.)))-m+1e-4);
    c*=jpSun*(.06+.8*jpSq(sat(.5+.5*dot(n,sunw)))+jpSq(sat(-dot(n,sunw+vec3(0.,.3,0.)))))+jpSky*.15;
    if (uOwn[6]<0.&&seg!=1.) c+=uOwn[6]*-1.*kc*thru*(.25+.9*jpSq(1.-sat(dot(n,-rd))))*.6;
    c+=(jpSun+jpSky)*.7*jpE(.93,.97,dot(n,vec3(-.44,.68,-.58)));
   } else {
    float dn=min(dot(rd,n),-.1);
    vec3 u=normalize(cross(n,vec3(0.,1.,.02))),v=cross(u,n),h=rd*dot(m,n)/dn-m;
    mat2 turn=rot(fi*.7+uTravel*.005*(fi-4.5)+jpW.y)/R;
    vec2 q=turn*vec2(dot(h,u),dot(h,v));
    h-=rd*(.1*R/dn);
    soft/=R;
    float e=soft+.012,r=length(q),rr=length(turn*vec2(dot(h,u),dot(h,v))),an=mod(atan(q.y,q.x+1e-5)*max(seg,1.)/TAU,max(seg,1.));
    float petal=0.;
    if (uOwn[6]>0.&&seg>=.5) { // a flower: rounded petals, a warm eye
     float th=atan(q.y,q.x+1e-5),np=i==0||i==5?3.:i==1?4.:2.5,co=abs(cos(th*np)),lb=mix(1.,.45+.55*sqrt(co),uOwn[6]);
     r/=lb;rr/=lb;petal=uOwn[6];
    }
    if (seg<.5) {
     q.y+=.2*q.x*q.x-.06;
     rr=r=max(1.+(abs(q.y)-.48*sqrt(sat(1.-q.x*q.x))*(1.-.45*q.x)-.014*sin(q.x*36.))*1.6,abs(q.x)*.98);
     c*=(.8+.2*jpE(.1,.4,abs(fract(q.x*5.-abs(q.y)*4.)-.5)))*(.8+.6*jpE(.02+e,0.,abs(q.y)));
    } else {
     float k2=abs(fract(an)-.5),flesh=jpE(.02-e,.02+e,(.5-k2)*r*TAU/seg)*jpE(.84+e,.84-e,r)*jpE(.1-e,.1+e,r);
     c*=(1.+.22*sin(an*37.+4.*sin(r*9.+an*5.))*sin(r*23.-k2*19.))*(.6+.6*r);
     vec3 pc=mix(kc*kc*.7,kc*1.1+.12,jpE(.0,.95,r))*(1.-.16*jpE(.75,1.,abs(sin(an*9.+sin(r*5.))))*r);
     pc=mix(pc,vec3(.95,.62,.12)*(.6+.5*noise(q*26.)),jpE(.24+e,.18-e,length(q)));
     c=mix(mix(vec3(.7,.55,.3)+.1*kc,kc*.75,jpE(.9-e,.9+e,r)),c,flesh);
     if (petal>0.) c=mix(c,pc,petal);
    }
    thru*=.9+.45*dot(h.xy,vec2(.6,.8))/R;
    cov=jpE(1.+soft,1.-soft,r);cov2=jpE(1.+soft,1.-soft,rr);
    c=c*thru+jpSun*.3*pow(sat(.5+.5*dot(reflect(rd,n),jpL)),12.);
   }
   cov*=sat(R*12.-.1);cov2*=sat(R*12.-.1);
   col=mix(col,jpFog(kc*.35*thru,back,tb*.5),cov2);
   col=mix(col,jpFog(c,back,tb*.5),cov);
 }
 if (uOwn[6]<0.) for (int i=0;i<3;i++) { // many more pearls, small and far to larger and near
  float fi=float(i),sz=mix(.22,.36,fi*.5)*jpE(0.,.5,-uOwn[6]);
  vec2 g=p*(5.6-1.6*fi)+vec2(5.3*fi,-.02*fi*uTime)+.25*sin(p.yx*3.+fi),ic=floor(g),h=hash22(mod(ic,61.)+fi*7.);
  R=sz*(.45+.55*h.x)*step(.42,h.y)+1e-3;
  vec2 q=(fract(g)-.5-(h-.5)*(1.-2.*sz))/R;
  float rr2=dot(q,q),e=jpPx*6./R+.02+.10*(2.-fi)*(1.-.5*uTone),in1=jpE(1.+e,1.-e,sqrt(rr2))*step(.02,R)*(1.-bite);
  n=vec3(q,-sqrt(max(1.-rr2,0.)));
  vec3 kc=kindColour(4.*fract(h.x*7.+.2));kc=kc*kc*.8+kc*.1;
  vec3 c=kc*(jpSun*(.08+.9*jpSq(sat(.5+.5*dot(n,sunw)))+.5*back*back*rr2)+jpSky*.18)+(jpSun+jpSky)*.8*jpE(.92,.97,dot(n,vec3(-.44,.68,-.58)));
  col=mix(col,jpFog(c,back,1.9-.7*fi),in1);
 }
 // round bubbles, held in the jelly
 for (int i=0;i<2;i++) {
  vec2 g=p*(5.+4.*float(i))+3.7*float(i),h=hash22(floor(g));
  R=(.05+.17*h.x*h.x)*jpE(0.,.25,h.y-.78+.5*uTexture)+1e-3;
  vec2 q=(fract(g)-.5-(h-.5)*.5)/R;
  float r=length(q),e=jpPx*8./(R+.02),in1=jpE(1.+e,1.-e,r)*jpE(.01,.04,R)*(1.-bite);
  col*=1.-.45*in1*jpE(.5,1.,r);
  col+=(jpSun+jpSky)*in1*(.3*jpE(.95,.6,r)*sat(-q.x*.6-q.y*.8)+(.5+2.*uKeys)*jpE(.25+e,.2,length(q-vec2(.35,.45))));
 }
 return col;
}
vec3 jpMixed(vec3 c,vec3 a,vec3 b,float o) { return mix(mix(c,a,max(-o,0.)),b,max(o,0.));}
vec3 render(vec2 p) {
 float o0=uOwn[0],o1=uOwn[1],o2=uOwn[2],o3=uOwn[3],o4=uOwn[4],k=1.-uHits;
 jpW=uHits*vec3(.16*sin(19.*k),.16*sin(13.*k),.12*sin(26.*k))
  +vec3(.012*sin(uTime*.9)*sin(uTime*.11),.02*sin(uTime*.37),.008*sin(uTime*.53)+.06*uDrone);
 for (int i=0;i<3;i++) { float a=uTime*.45-float(i)*1.9;jpLean[i]=uPhrase*.07*vec2(sin(a),.5*cos(a*.7));}
 jpFl=o3<0.?1.+o3:1.+.6*o3;
 jpTw=.35+.5*max(o3,0.);
 jpH=1.+(o4>0.?.36:.38)*o4;
 jpCut=4.*uCue*(1.-uCue);
 jpMilk=max(o1,0.);
 jpPx=1./uRes.y;
 float az=.8+.2*sin(TAU*uLoop),deep=(.75+.5*uDrone)*(1.+.75*min(o1,0.));
 jpDir=-vec2(sin(az),cos(az));
 jpTan=tan(.66+.1*cos(TAU*uLoop));
 jpL=normalize(vec3(-jpDir.x,jpTan,-jpDir.y));
 jpSun=jpMixed(vec3(1.75,1.56,1.26),vec3(.9,.46,.16),vec3(1.2,1.3,1.45),o2)*(.8+.3*uPad);
 jpSky=jpMixed(vec3(.62,.68,.78),vec3(.05,.055,.08),vec3(1.1,1.2,1.35),o2);
 jpT0=jpMixed(vec3(.86,.05,.13),vec3(.02,.4,.25),vec3(.3,.03,.3),o0);
 jpT1=jpMixed(vec3(1.,.86,.08),vec3(.5,.85,.3),vec3(.95,.2,.3),o0);
 jpHoney=jpMixed(vec3(1.,.62,.17),vec3(.35,.75,.4),vec3(.8,.14,.2),o0);
 const float dye=max(abs(uOwn[6]),abs(uOwn[7]));
 jpT0=mix(jpT0,uKind[0],.12);jpT1=mix(jpT1,uKind[1],.12);
 if (dye>0.) { jpT0=mix(jpT0,uKind[0]*uKind[0]+.02,.75*dye);jpT1=mix(jpT1,uKind[1]*uKind[1]+.04,.75*dye);jpHoney=mix(jpHoney,uKind[1]*uKind[1]+.03,.8*dye);}
 jpS0=(1.05-jpT0)*3.8*deep;jpS1=(1.06-jpT1)*5.*deep;jpS2=vec3(.2,.14,.11)*deep;jpHs=(1.06-jpHoney)*.52*deep;
 jpT2=mix(vec3(.13,.15,.16),vec3(.9),jpMilk)*mix(vec3(1.),uKind[3]*1.5,.15);
 vec3 c;
 if (uVar<.5) c=jpOutside(p);else c=jpInside(p);
 c=min(screenOf(c),1.);
 return mix(c,c*c*(3.-2.*c),.5);
}
