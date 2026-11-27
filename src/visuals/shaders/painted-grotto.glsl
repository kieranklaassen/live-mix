// name: Painted grotto
// a: Through the tank
// b: Cloud rails
// what: Through a tank with three large goldfish, wet and round in the light, a painted grotto of grey rock, cloth weed, a paper sun and a giant clam with pearls; or a painted sky tacked to a batten, rows of cut cotton clouds on rails, a hung cloud and its foil rain.
// follows: Drone brightens the limelight, pad sways the weed or rolls the clouds, texture is bubbles or foil glitter, a phrase steers fish or hung cloud, bands raise weed or clouds. A hit lets go a puff of smoke and the clam gapes, a cue runs a second tint over all, the loop moves the sun, keys light pearls or gilt edges.
// own: 0 moonlight at -1, embers at 1; 1 one great fish or huge clouds at -1, five fish or small ones at 1; 2 slim fish or flat clouds at -1, veil-tailed fish or heaped clouds at 1; 3 narrow cave or sky right across at -1, wide cave or the workings bare at 1; 4 an untinted print at -1, full hand colour at 1; 5 further back, or a dry sky, at -1, close, or foil rain right across, at 1; 6 jellyfish for fish (b: a hung moon and stars for the sun) at -1, a ring of small fish (b: rows of painted waves for clouds) at 1; 7 open water with no rock (b: rows of houses with lit windows) at -1, a sunk arcade (b: rows of cut firs) at 1
#define PG_M6 max(-uOwn[6], .0)
#define PG_P6 max(uOwn[6], .0)
#define PG_M7 max(-uOwn[7], .0)
#define PG_P7 max(uOwn[7], .0)
float pgPx,pgFit,pgHand; // a pixel; the picture's width; how much hand colour
vec3 pgLime,pgShade;        // the limelight, and the light in the shadows
float pgBy(float low,float mid,float high,float q) { return q<.0?mix(mid,low,-q):mix(mid,high,q); }
vec3 pgBy(vec3 low,vec3 mid,vec3 high,float q) { return q<.0?mix(mid,low,-q):mix(mid,high,q); }
vec3 pgInk(int k) { vec3 c=uKind[k]; return c*c*1.5+c*.1; }
float pgDn(float a,float b,float x) { return 1.-smoothstep(b,a,x); }
float pgIn(float d,float s) { return pgDn(s,-s,d); }
float pgIn(float d) { return pgDn(pgPx,-pgPx,d); }
float pgLum(vec3 c) { return dot(c,vec3(.3,.59,.11)); }
vec3 pgDye(vec3 c,vec3 dye,float k) { return mix(c,pgLum(c)*dye/max(pgLum(dye),.02),k); }
// Grey distemper with colour laid over by hand.
vec3 pgPaint(float t,vec3 dye) {
 t=sat(t);
 return pgDye(mix(mix(vec3(.02,.017,.021),vec3(.19,.16,.14),smoothstep(.0,.5,t)),vec3(.74,.67,.53),smoothstep(.4,1.,t)),dye,pgHand);
}
vec3 pgPiece(vec3 c,vec2 uv) {
 vec4 m=piece(uv);
 return pgDye(c,m.rgb/max(m.a,.05),sat(m.a*1.3)*.65)*(1.+.5*m.a);
}
float pgBrush(vec2 q,float along,float over) { q*=vec2(along,over); return .6*noise(q)+.4*noise(q*2.7+5.); }
vec3 pgWood(vec2 q) { return vec3(.34,.19,.085)*(.4+pgBrush(q,50.,3.)); }
// A puff of stage smoke.
void pgSmoke(inout vec3 col,vec2 q,vec3 light) {
 if (uHits<.01||length(q)>.45) return;
 float open=1.-uHits,thick=.0,lit=.5;
 for (int k=0; k<7; k++) {
  float fk=float(k);
  vec2 o=(q/.24-vec2(sin(fk*2.4),.2+.23*fk)*(.3+.3*open))/(.34+.16*open);
  float m=pgDn(1.,.35,length(o)+.7*(noise(q*30.+fk)-.5));
  lit=mix(lit,.5+.5*dot(o,vec2(-.6,.8)),m);
  thick=max(thick,m);
 }
 col=mix(col,mix(.3,1.1,sat(lit))*light+pgInk(4)*.2,thick*sqrt(uHits));
}

// ---- a: the set behind the tank
vec3 pgRock(vec2 q,float seed,vec3 wash) {
 vec2 w=rot(.5)*q*vec2(7.,3.4)+seed*7.3+.9*noise(q*5.+seed),i=floor(w-.5),near=vec2(.0);
 float d1=9.,d2=9.,h=.0;
 for (int k=0; k<4; k++) {
  vec2 g=i+vec2(k % 2,k/2);
  float o=hash21(g);
  vec2 r=w-g-.25-.5*vec2(o,fract(o*57.3));
  float d=dot(r,r);
  if (d<d1) { d2=d1; d1=d; near=r; h=o; } else d2=min(d2,d);
 }
 float brush=noise(rot(.5+1.3*h)*q*vec2(13.,80.))-.5;
 float t=.42+.6*dot(near,vec2(-.75,.62))+.25*(h-.5)+.5*brush;
 t=mix(t,(floor(t*5.)+smoothstep(.3,.7,fract(t*5.)))/5.,.7);
 return pgPaint(t*(.35+.65*smoothstep(.0,.14,sqrt(d2)-sqrt(d1)+.1*brush)),mix(vec3(1.),wash,.4+h));
}
// Painted blocks of an arcade.
vec3 pgStone(vec2 q) {
 float wide=.5*pgFit,ax=(fract(q.x/wide+.28)-.5)*wide,ay=q.y-.1,R=.17*pgFit,l=length(vec2(ax,ay));
 vec2 b=ay>.0&&l<R+.075?vec2(atan(ay,ax)*4.2,(l-R)/.075):vec2(q.x*9./pgFit+.5*mod(floor(q.y*13.),2.),q.y*13.);
 vec2 f=fract(b);
 float h=hash21(floor(b)+3.),edge=min(min(f.x,1.-f.x)*1.4,min(f.y,1.-f.y));
 float turned=ay>.0?.0:clamp((abs(ax)-R)/max(.5*wide-R,.01),.0,1.)*sign(ax);
 float t=.5+.18*(h-.5)+.22*(pgBrush(q,20.,60.)-.5)-.16*turned+.2*pgDn(.1,.0,abs(f.y-.85));
 return pgPaint(t*(.45+.55*smoothstep(.02,.14,edge)),mix(vec3(1.,.62,.42),vec3(1.,.86,.66),h));
}
// Two flats, the floor and the cave's mouth: below 0 inside.
float pgFlat(int i,vec2 q) {
 float tooth=abs(2.*fract(q.x*4.6+.2)-1.);
 if (i==0) return .8*(q.y+.39+.05*PG_M7-.05*tooth-.02*sin(q.x*41.)-.16*smoothstep(.35,.85,abs(q.x/pgFit+.1)));
 vec2 c=q-vec2(-.14+.05*sin(q.y*6.),-.12);
 float a=atan(c.y,c.x+1e-5);
 tooth*=(.4+.6*hash11(floor(q.x*4.6+.7)))*smoothstep(.0,.3,c.y)*pgDn(.5,.2,abs(c.x));
 float cave=.36*(pgBy(.62,1.,1.45,uOwn[3])+.3*(noise(vec2(a*4.,2.))-.5)-length(c/vec2(.56*pgFit,.36))-.42*tooth)+.6*PG_M7;
 if (PG_P7>.0) {
  float ax=abs(fract(q.x/.5/pgFit+.28)-.5)*.5*pgFit,ay=max(q.y-.1,.0);
  cave=mix(cave,(.17*pgFit-length(vec2(ax,ay)))*.9,PG_P7);
 }
 return cave;
}
vec2 pgShell;
// A giant clam.
vec4 pgClam(vec2 q) {
 vec2 c=(q-pgShell)/.25;
 if (abs(c.x)>1.3||abs(c.y)>1.1) return vec4(.0);
 float e=pgPx*5.;
 // the raised half
 vec2 d=c+vec2(.0,.26); d.y /= .8+.2*(4.*uHits*(1.-uHits)+.3*uLow+.1*sin(uTime*.23));
 float r=length(d),a=atan(d.x,d.y+1e-5),ph=TAU*a*2.35,R=1.08-.06*a*a+.05*cos(ph),deep=smoothstep(.1,1.,r/R);
 float fan=max(r-R,(abs(a)-1.42)*r);
 float t=.16+.6*deep+.17*sin(ph+.9)*deep+.2*(noise(vec2(a*22.,r*4.))-.5);
 vec4 o=vec4(pgPaint(t+.4*pgDn(.05,.03,abs(fan+.035)),vec3(1.,.65,.5)),pgIn(fan,e));
 // flesh
 d=c+vec2(.0,.2);
 float frill=length(d*vec2(1.,2.5))-.8-.05*sin(atan(d.y,d.x+1e-5)*24.);
 vec3 flesh=pgPaint(.36+1.2*frill+.3*noise(c*30.),vec3(.2,.72,.75))*smoothstep(-.36,-.1,frill);
 o=mix(o,vec4(flesh,1.),pgIn(frill,e));
 for (int k=0; k<5; k++) {
  vec2 b=(d-vec2(-.42+.21*float(k),-.035+.025*float((k*2) % 3)))/.09;
  float pearl=.12+.6*sat(.5+.5*dot(b,vec2(-.6,.8)))+.9*pgDn(.35,.1,length(b-vec2(-.3,.4)));
  o.rgb=mix(o.rgb,pearl*vec3(1.,.92,.85)*(.75+2.*uKeys*(.5+.5*sin(float(k)*2.+uTime))),pgIn(length(b)-1.,10.*e));
 }
 // the lower half
 float x=c.x/1.04,turn=TAU*(2.2+.4*abs(x)),lip=-.27+.085*cos(x*turn)+.12*x*x,down=sat((lip-c.y)/.6);
 turn*=x/max(1.-.55*down,.3);
 t=.56+.28*cos(turn+.8)-.5*down-.2*x+.22*(noise(vec2(turn*2.,down*7.))-.5);
 float dish=max(c.y-lip,-.27-.6*pow(max(1.-x*x,.0),.4)-c.y+.2*x*x);
 return mix(o,vec4(pgPaint(t+.5*pgDn(.055,.04,lip-c.y),vec3(1.,.83,.63)),1.),pgIn(dish,e)*step(abs(x),1.));
}
vec3 pgSet(vec2 q) {
 // one round pool of limelight on the shell
 vec2 l=rot(-.5)*(q-pgShell-vec2(.0,.7*PG_M7)-vec2(-.02,.1));
 float pool=pgDn(.5,.26,length(l*vec2(1.15,.8)));
 vec3 light=pgShade*(.9+.5*uLevel)+pgLime*(pool*(1.5+(.3+uEnergy)*uDrone+.6*uHits)+.07);
 vec4 clam=pgClam(q);
 vec3 col=clam.rgb*light*clam.a;
 float left=1.-clam.a,shadow=1.-.8*pgDn(1.15,.75,length((q-pgShell-vec2(.06,-.03))*vec2(3.8,4.6)));
 for (int i=0; i<2&&left>.02; i++) {
  float d=pgFlat(i,q),a=left*pgIn(d);
  if (a>.0) {
   vec3 stone=pgRock(q,float(i)+1.,i==0?vec3(1.,.7,.4):vec3(.42,.6,.74));
   if (PG_P7>.0&&i==1) stone=mix(stone,pgStone(q),PG_P7);
   vec3 c=pgPiece(stone,vec2(.5+.52*q.x/pgFit,.5-q.y));
   col+=a*c*.8*light*shadow;
   left-=a;
  }
  if (left>.02) shadow=min(shadow,.25+.75*smoothstep(-.02,.035,pgFlat(i,q+vec2(-.03,.03))));
 }
 if (left>.02) {
  // the far cloth: rays and a paper sun
  vec2 v=q-vec2((.02+.2*sin(TAU*uLoop))*pgFit,.06+.06*cos(TAU*uLoop)+.3*PG_M7);
  float r=length(v),a=atan(v.y,v.x+1e-5),br=noise(vec2(a*70.,r*7.))-.5;
  float t=.72-.55*smoothstep(.1,.65,r)+.12*sin(a*18.+.6*sin(a*5.))*smoothstep(.1,.2,r)+.2*br;
  vec3 c=mix(pgPaint(t,vec3(.44,.7,.78)),1.4*pgPaint(.88-.3*br,vec3(1.,.5,.05)),pgIn(r-.085,.002));
  if (PG_M7>.0) {
   float beam=smoothstep(.35,.75,.6*noise(vec2(a*9.,3.+uTime*.03))+.4*noise(vec2(a*23.,7.-uTime*.04)));
   vec3 sea=mix(pgPaint(.2+.1*br,vec3(.2,.5,.7)),pgPaint(.95+.1*br,vec3(.6,.85,.85)),exp(-1.7*r)*(.5+.8*beam));
   c=mix(c,pgPiece(sea,vec2(.5+.52*q.x/pgFit,.5-q.y))+c*.25*pgIn(r-.085,.01),PG_M7);
  }
  col+=left*c*(pgShade+pgLime*(.27+.25*uLevel)+.42*light)*mix(shadow,1.,.3);
 }
 return col;
}
// Strips of cloth weed on strings.
void pgWeed(vec2 q,inout vec3 col) {
 float y=q.y+.46,turn=q.y*5.+q.x*4.+uTime*.4,x=(q.x-(.02+.05*uPad)*sin(turn)*smoothstep(.0,.4,y))/pgFit;
 float n=x<.0?(x+.94)*10.:(x-.4)*8.,k=floor(n),dx=(n-k-.5)*(x<.0?.1:.125);
 if (k<.0||k>3.) return;
 k+=x<.0?.0:4.;
 float h=fract(k*.618),u=y/(.3+.28*h+(.2+.4*uEnergy)*uBands[int(k)*2+1]);
 float s=fract(q.y*11.+(dx<.0?.0:.5)+h),w=u>1.?.0006:.005+.042*(1.-s)*smoothstep(.0,.16,s)*(1.-u*u*u);
 float t=(.36+.26*cos(turn)*sign(dx)+.2*(1.-s))*(.5+.5*smoothstep(.0,.006,abs(dx)));
 vec3 c=pgPaint(t,mix(vec3(.46,.6,.3),pgInk(1)+.05,.75*uPad))*(pgShade*1.5+pgLime*.3+pgInk(1)*uPad*uEnergy);
 col=mix(col,c,pgIn(abs(dx)-w)*(u>1.?.4:1.));
}

// ---- the fish: they are real
vec3 pgFlesh,pgThin;
void pgLay(inout vec4 o,vec3 c,float a) { o.rgb=mix(o.rgb,c,a); o.a+=a*(1.-o.a); }
// A fin opened from one point.
void pgFan(inout vec4 o,vec2 d,vec2 dir,float spread,float R,float e) {
 float r=length(d);
 if (r<R*1.05+2.*e) {
  dir=normalize(dir); d=vec2(dot(d,dir),dir.x*d.y-dir.y*d.x);
  float x=max(d.x,1e-4),a=x*d.y/(x*x+.28*d.y*d.y)/spread,w=(e+.004)/max(r,.03)/spread;
  float out_=r/(R*(1.-.3*a*a)),ray=.5+.5*cos(a*46.),thin=smoothstep(.0,.8,out_);
  pgLay(o,mix(pgFlesh,pgThin*(.7+.5*ray),thin)*(.85+.2*a),pgIn((out_-1.)*R,e+.01)*pgDn(1.+w,1.-w,abs(a))*step(abs(d.y),1.2*d.x)*(1.-thin*(.4-.15*ray)));
 }
}
// go: facing, turned, tipped.
void pgFish(inout vec3 col,vec2 p,vec2 at,float size,vec3 go,float t,float coat,float soft) {
 vec2 q=(p-at)/size;
 if (dot(q,q)>(uOwn[2]>.0?2.8:2.1)) return;
 float e=pgPx/size+soft,stout=pgBy(.66,1.,1.2,uOwn[2]),veil=pgBy(.65,1.,1.4,uOwn[2]),turned=cos(go.y),beat=sin(t*1.3);
 q.x*=go.x; q=rot(-go.z)*q;
 if (q.x>.65||abs(q.y)>.72*max(veil,1.)) return;
 vec3 hot=vec3(.84,.085,.006),gold=vec3(1.,.31,.022),pale=vec3(1.,.66,.28);
 pgFlesh=hot*(pgLime*.55+pgShade);
 pgThin=mix(gold,pale,.2)*(pgLime*.8+.1)*mix(vec3(1.),.5+pgInk(3),.6*uPhrase);
 vec4 o=vec4(pgFlesh,.0);
 // the tail, swung from side to side
 float bx=q.x/turned;
 vec2 f=vec2(bx,q.y),d=vec2((bx+.5)*turned/mix(max(cos(go.y+.75*beat),.3),1.,.3),q.y-.015);
 float far=max(-d.x,.0);
 d.y+=.1*far*sin(far*5.-t*1.3)+.22*veil*far*far;
 pgFan(o,d,vec2(-.89,.46),.44,.74*veil,e);
 pgFan(o,d,vec2(-.94,.05*beat-.35),.5,.8*veil,e);
 // the body's height along it
 float ux=(bx+.6)/1.2,u=sat(ux),k=max(2.*u-1.,.0),y=q.y+.02-.03*sin(u*3.);
 float h=(.07+.26*smoothstep(-.02,.62,u))*sqrt(max(1.-pow(k,2.3),.0))*stout*(y>.0?1.:1.12);
 float hp=u<.62?4.2*u*(.62-u):-1.1*k*k;
 pgFan(o,f-vec2(.12,.12*stout),vec2(-.76,.64),.75,.48*veil,e);
 float sway=.18*sin(t*.9);
 pgFan(o,f-vec2(.04,-.25*stout),vec2(-.66,.7*sway-.75),.34,.38*veil,e);
 float a=pgIn((abs(y)-h)*.8,e)*smoothstep(.0,.03,ux)*step(ux,1.);
 if (a>.0) {
  float v=clamp(y/max(h,.001),-1.,1.),s=sqrt(1.-v*v),head=smoothstep(-.06,.06,bx-.25+.9*v*v*h);
  float row=asin(v)*5.+20.,j=floor(row),ff=row-j-.5,sc=fract(bx*17.+.5*mod(j,2.)+2.*ff*ff);
  float fine=pgDn(.05,.012,e)*(1.-head)*smoothstep(.0,.5,s);
  vec3 n=normalize(vec3(-hp+(sc-.45)*.5*fine,v+ff*.35*fine,s/.62+.02));
  n.xz=rot(go.y)*n.xz; n.x*=go.x;
  vec3 L=normalize(vec3(-.5,.76,.45)),alb=mix(mix(hot,gold,pgDn(.7,-.4,v)),pale,.6*pgDn(.0,-.9,v));
  alb=mix(alb,vec3(.92,.84,.72),coat*smoothstep(.5,.58,noise(vec2(bx*3.4+9.,v*1.3+4.))));
  alb*=mix(1.,.62+.5*smoothstep(.0,.7,sc)-.4*smoothstep(.84,1.,sc),fine);
  float dif=sat(.12+.88*dot(n,L)),spec=pow(sat(dot(n,normalize(L+vec3(.0,.0,1.)))),30.);
  vec3 c=alb*(pgLime*(1.5*dif*dif+.6*pow(sat(n.y),5.))+pgShade*(.6+.4*n.y)+vec3(.06,.13,.12)*sat(-n.y));
  c+=pgLime*spec*(.6+.6*uTone)*(.5+.5*fine+.4*head);
  float gill=length(vec2(bx-.43,q.y+.02)*vec2(.9,.75))-.19;
  c*=1.-.5*pgDn(.45,.33,bx)*pgDn(.035,.0,gill)*smoothstep(-.006,.004,gill);
  c*=1.-.7*pgIn(abs(y+.05-.2*(bx-.56))-.004,e+.004)*smoothstep(.5,.54,bx);
  vec2 ey=(f-vec2(.44,.065*stout))*vec2(turned,1.); float er=length(ey);
  c=mix(c,gold*(.4+sat(.5+10.*ey.y))*pgLime,pgIn(er-.046,e));
  c=mix(c,vec3(.006),pgIn(er-.034,e+.003))+1.2*pgIn(length(ey-vec2(-.011*go.x,.015))-.009,e);
  pgLay(o,c,a);
 }
 pgFan(o,f-vec2(.17,-.11*stout),vec2(-.76,-.64-1.5*sway),.42,.3*veil,e);
 col=mix(col,pgDye(o.rgb,vec3(.9,1.,1.1),max(-uOwn[4],.0))*(1.+max(-uOwn[4],.0)),o.a);
}
// A jellyfish of gauze: a pulsing bell, frilled, with its threads.
void pgJelly(inout vec3 col,vec2 p,vec2 at,float size,float t,vec3 dye) {
 vec2 q=rot(.2*sin(t*.3))*(p-at)/size;
 float beat=sin(t*.8),wide=.46+.05*beat;
 if (abs(q.x)>.8||q.y>.6||q.y<-1.5) return;
 float e=pgPx/size,y=q.y/(.44-.05*beat),x=q.x/wide,frill=-.1+.07*cos(x*19.)-.1*x*x;
 vec3 light=pgLime*.5+pgShade+dye*.5;
 // threads
 for (int k=0; k<9; k++) {
  float fk=float(k)-4.,down=max(-q.y,.0),arm=k % 3==1?1.:.0;
  float dx=q.x-fk*.1*(1.-.25*down)-(.03+.05*uPad)*sin(down*6.-t*1.1+fk*1.7)*(.4+down),w=mix(.003,.04*(1.+.4*sin(down*37.+fk))*(1.-down),arm);
  float len=.7+.5*fract(fk*.618+3.);
  col=mix(col,light*mix(.8,1.,arm)*mix(vec3(1.),dye*2.+.2,.5),pgIn(abs(dx)-w,e)*step(q.y,.02)*pgDn(len,len*.4,down)*mix(.75,.4,arm));
 }
 float r=length(vec2(x,max(y,.0)));
 float m=pgIn((r-1.)*.4,e)*step(frill,y);
 if (m>.0) {
  float z=sqrt(max(1.-r*r,.0)),rib=pow(.5+.5*cos(atan(x,y+.5)*26.),3.);
  float lit=sat(.4*y-.5*x+.5),body=.3+.55*smoothstep(.55,1.,r)+.3*rib*(1.-y);
  vec3 c=mix(col,light*mix(vec3(1.),dye*2.5+.1,.6)*(.35+lit),sat(body));
  c=mix(c,dye*2.2+pgLime*.15,.7*pgDn(.12,.04,abs(length(vec2(x,(y-.4)*1.3))-.24-.08*cos(4.*atan(x,y-.4001))))*z);
  c+=pgLime*(.9*pgDn(.2,.0,length(vec2(x+.4,y-.6)*vec2(1.6,1.)))+.5*pgDn(.07,.0,abs(y-frill)))*(.5+.5*uTone);
  col=mix(col,c*(1.+.5*uHits),m);
 }
}
// A ring of small fish that goes round.
void pgShoal(inout vec3 col,vec2 p,float much) {
 vec2 o=p-vec2(.12*pgFit,.02+.04*uPhrase);
 o.y /= .62; o=rot(.22)*o;
 float r=length(o),lane=.07,k0=floor(r/lane);
 if (k0<1.||k0>7.) return;
 for (int j=0; j<2; j++) {
  float k=k0+float(j),R=k*lane+.012*sin(k*5.),n=floor(R*26.+2.);
  if (k<2.||k>7.) continue;
  float a=(atan(o.y,o.x+1e-5)/TAU+mod(uTime*(.016+.004*fract(k*.618))*.6+k*.37,1.))*n,c=floor(a),h=hash21(vec2(mod(c,n),k));
  if (h>.25+.6*much+.15*uBands[int(h*15.)]) continue;
  vec2 q=vec2((a-c-.5-.3*(h-.5))*TAU*R/n,r-R-.02*(fract(h*57.)-.5))/(.058*(.7+.6*fract(h*13.)));
  q.y+=.12*sin(q.x*3.-uTime*2.+h*40.)*sat(.4-q.x);
  float e=pgPx/.058,body=abs(q.y)-.27*sqrt(sat(q.x+.75))*sqrt(sat(1.-q.x)),tail=max(abs(q.y)+.75*q.x+.35,-q.x-1.15);
  float m=pgIn(min(max(body,abs(q.x-.1)-.86),tail),e)*much;
  float side=sat(.5-q.y*2.2*clamp((o.y+.3)*5.,-1.,1.)),flash=.5+.5*sin(atan(o.y,o.x+1e-5)*2.-uTime*.3+h*2.);
  vec3 fc=mix(vec3(.03,.05,.06),mix(pgInk(3),vec3(.9),.6),side*(.45+.65*flash))*(pgLime*(.85+.6*uPhrase+1.2*uHits)+pgShade);
  fc=mix(fc,vec3(.004),pgDn(.085,.05,length(q-vec2(.7,.04))));
  col=mix(col,fc*(.6+.4*k/7.),m);
 }
}
void pgBubbles(inout vec3 col,vec2 p) {
 vec2 sc=vec2(12.,6.),g=p*sc-vec2(.0,mod(uTime*.2,256.)),id=floor(g),key=vec2(id.x,mod(id.y,256.)),h=hash22(key);
 float often=.15+.6*uTexture,on=pgDn(often+.1,often,hash21(key+5.5)),r=on*(.07+.24*h.y*h.y*h.y)/sc.x;
 if (on<=.0) return;
 vec2 w=(g-id-.5+(h-.5)*.4)/sc/r;
 float b=length(w),shine=.5*smoothstep(.55,.96,b)+1.2*pgDn(.35,.1,length(w-vec2(-.4,.45)));
 col=mix(col,col*.7+(pgLime*.3+.1)*mix(vec3(.8),pgInk(2)+.3,.6)*shine*(.5+.7*uTexture),pgIn(b*r-r));
}
vec3 pgTank(vec2 p) {
 float zoom=pgBy(1.3,1.,.76,uOwn[5]);
 p=p*zoom-vec2(.0,.05*max(uOwn[5],.0));
 pgPx*=zoom;
 pgShell=vec2(-.3*pgFit,-.19-.7*PG_M7);
 float front=.425+.004*sin(p.x*7.+uTime*.5)+.003*uMic*sin(p.x*60.+uTime*2.);
 float back=front-.035;
 bool wet=p.y<back;
 vec2 q=wet?p*.97+.004*sin(p.yx*vec2(13.,11.)+uTime*.3+2.*sin(p*5.)):p;
 vec3 col=pgSet(q);
 pgWeed(q,col);
 pgSmoke(col,q-pgShell-vec2(.27,-.16+.7*PG_M7),pgLime*.6+pgShade);
 if (wet) {
  col=col*vec3(.93,.98,.95)+.012*uSpace;
  float many=max(uOwn[1],.0),alone=max(-uOwn[1],.0);
  for (int i=0; i<5; i++) {
   if (i>2&&many<=.0) break;
   float fi=float(i),ph=i==1?-uPhrase:uPhrase;
   vec4 f=i==0?vec4(.33,.09,.35,-1):i==1?vec4(-.56,.2,.21,1):i==2?vec4(.7,-.33,.43,-1):i==3?vec4(-.02,.3,.13,-1):vec4(-.66,-.03,.19,1);
   vec4 s=sin(uTime*vec4(.11,.17,.09,.13)+fi*2.1+.6);
   float size=f.z*(.75+.25*min(pgFit,1.))*(i>2?many:i==0?1.+.5*alone-.25*many:1.-.15*fi*many);
   vec2 at=f.xy*vec2(pgFit,1.)+vec2(.022,.014)*s.xy+vec2(.0,.04*ph);
   at.x+=alone*(i==1?-.9:sign(fi));
   vec3 go=vec3(f.w,.3*s.z+.35*ph*cos(fi),.1*s.w+.14*ph+(i==1?-.16:.1));
   if (PG_M6>.0) { pgJelly(col,p,at+vec2(.0,.12*size),size*.95*PG_M6,uTime+fi*2.3,pgInk(i)); size*=1.-PG_M6; if (size<.02) continue; }
   size*=1.-PG_P6;
   if (size<.02) break;
   pgFish(col,p,at,size,go,uTime+fi*2.3,i==1?1.:.0,i==2?.012:.0);
  }
  if (PG_P6>.0) pgShoal(col,p,PG_P6);
  pgBubbles(col,p);
 } else {
  // the skin of the water
  float st=pgBrush(p+sin(.04*uTime),9.,70.);
  col=mix(col,pgLime*(.05+.7*st*st*st),.85*pgIn(p.y-front));
 }
 col+=pgLime*(pgDn(.005,.0,abs(p.y-front))*(.6+.4*uLevel)+.3*pgDn(.003,.0,abs(p.y-back)));
 // the brass foot
 float m=-10.1-22.2*p.y;
 vec3 brass=vec3(.17,.1,.04)*(1.-smoothstep(.0,.5,abs(m-.4)))*pgLime;
 return mix(col,brass+pgWood(p.yx)*pgLime*.14*step(1.,m),smoothstep(-.02,.02,m));
}

// ---- b: cut cotton clouds on rails before a painted sky
vec3 pgForm; // wide, tall, heaped
vec2 pgPuff; // where in its tuft this point lies
const vec3 PG_TUFT[8]=vec3[8](vec3(0,.58,.36),vec3(.371,.456,.36),vec3(-.548,.31,.36),vec3(.437,.408,.36),vec3(-.64,.1,.26),vec3(-.2,.1,.26),vec3(.24,.1,.26),vec3(.68,.1,.26));
// One cloud, its tufts laid back to front: below 0 inside.
void pgCloud(vec2 q,float size,float seed,inout float d) {
 q /= pgForm.xy*size;
 if (abs(q.x)>1.35||q.y>1.35*pgForm.z) return;
 float m=9.;
 for (int j=0; j<8; j++) {
  vec3 t=PG_TUFT[j];
  float h=fract(seed*.37+float(j)*.618);
  vec2 o=(q-vec2(t.x+.14*(h-.5),t.y*pgForm.z))/(t.z*(.8+.45*h));
  float l=dot(o,o);
  if (l<1.) pgPuff=o;
  m=min(m,l);
 }
 d=min(d,(sqrt(m)-1.)*.35*size);
}
float pgRow(int i,vec2 q,float size) {
 float fi=float(i),W=size*2.1,dir=i % 2==0?1.:-1.,d=1.;
 float x=q.x+dir*(.06*uPad-mod(uTime*(.004+.007*fract(fi*.618+.9)),W*64.))+fi*.37+9.,c=floor(x/W);
 for (int k=-1; k<=1; k++) {
  float id=mod(c+float(k),64.),h=hash21(vec2(id,fi+2.));
  float lift=(.15+.4*uEnergy)*uBands[int(mod(id*5.+fi*3.,16.))] + .02*sin(uTime*.21+id*2.);
  pgCloud(vec2(x-(c+float(k)+.3+.4*h)*W,q.y/(1.+lift)),size*(.75+.5*h),id*1.7+fi*13.,d);
 }
 return d;
}
// Boards cut as waves, houses or firs: how far outside, and how it is painted there.
vec3 pgCut(int i,vec2 q,float size,inout float d,vec3 lit,vec3 under) {
 float fi=float(i),dir=i % 2==0?1.:-1.;
 vec3 c=vec3(.0);
 if (PG_P6>.0) {
  float x=q.x+dir*(.05+.04*uPad)*sin(uTime*.23+fi*1.3)+fi*.37,W=size*1.5,n=x/W,id=floor(n);
  float lift=.75+(.2+.5*uEnergy)*uBands[int(mod(fi*3.,16.))];
  // a crest that leans, its hollow below
  float y=q.y/(size*.95*pgForm.y),f=fract(n+.24*dir*y*y)-.5,top=.35+.6*lift*pow(1.-abs(sin(PI*f)),1.3);
  float dw=(y-top)*size*.45,skin=(top-y)*7.;
  float w=.5+.5*cos(skin*TAU*.5+.8*noise(q*30.));
  c=pgPaint(.16+.1*fi+.3*w*w+.2*(pgBrush(q,12.,60.)-.5),mix(vec3(.16,.42,.62),vec3(.5,.85,.85),w))*(pgShade+lit)+under*(.6+w)*.8;
  float foam=pgDn(.3,.05,skin-.35*noise(vec2(x*60.,fi))-.25*abs(sin(x*8.4/size)));
  c=mix(c,pgPaint(.95,vec3(1.,.95,.85))*(pgShade+lit*1.2),foam);
  d=mix(d,dw,PG_P6);
 }
 if (PG_M7+PG_P7>.0) {
  float W=size*mix(.62,.78,PG_M7),x=q.x+dir*(.03*uPad-mod(uTime*.003*(1.-.2*fi),W*64.))+fi*.37+9.,c0=floor(x/W),best=1.;
  for (int k=-1; k<=1; k++) {
   float id=mod(c0+float(k),64.),h=hash21(vec2(id,fi+5.)),b=uBands[int(mod(id*5.+fi*3.,16.))],H=size*(.8+.8*h)*(1.+.15*b*uEnergy),dd,tt,win=.0;
   vec2 o=vec2(x-(c0+float(k)+.5+.3*(h-.5))*W,q.y);
   if (PG_P7>.0) {
    H*=1.25;
    float v=sat(o.y/H),f=fract(v*6.+.35*abs(fract(o.x/size*8.+h)-.5)),w=size*.44*(1.-v)*(.62+.45*(1.-f));
    dd=max(abs(o.x)-w,o.y-H)*.8;
    tt=.26+.1*fi+.35*pgDn(.75,.1,f)*(.6-o.x/size)+.25*(pgBrush(o+h,90.,30.)-.5)-.3*smoothstep(.75,1.,f);
   } else {
    float wide=size*(.28+.14*fract(h*7.)),wall=H*.6,roof=wall+(wide-abs(o.x))*(.7+.8*fract(h*17.));
    dd=max(abs(o.x)-wide,o.y-roof)*.8;
    vec2 g=vec2(o.x/wide*1.5,o.y/size*4.2),gf=fract(g)-.5;
    float on=step(hash21(floor(g)+id+fi),.3+.5*b+.3*uKeys)*step(o.y+.07*size,wall)*step(.06*size,o.y);
    win=on*pgIn(max(abs(gf.x)-.24,abs(gf.y)-.3),.06);
    float shed=step(wall,o.y-.01*size);
    tt=mix(.3+.07*fi-.1*(o.x/wide)+.25*h,.2+.1*fi+.18*step(.5,fract((roof-o.y)/size*14.)),shed)+.2*(pgBrush(o,60.,20.)-.5);
   }
   if (dd<best&&(dd<.0||best>.0)) {
    best=dd;
    c=pgPaint(tt,PG_P7>.0?vec3(.32,.52,.36):mix(vec3(1.,.6,.4),vec3(.6,.65,.8),h))*(pgShade*1.3+lit)+under*.5*tt;
    c+=lit*vec3(1.,.7,.4)*pgDn(.008,.0,-dd)*(.3+uKeys);
    c=mix(c,vec3(1.,.62,.2)*(.6+.8*h+.6*b+uHits*step(.5,fract(h*31.))),win);
   }
  }
  d=mix(d,best,PG_M7+PG_P7);
 }
 return c;
}
// Cotton wool.
vec3 pgCotton(vec2 q,float d,float body,vec3 lit,vec3 under) {
 float wool=pgBrush(q+.03*pgPuff,70.,130.)-.5,rim=smoothstep(.2,1.,length(pgPuff))*sat(.25+dot(pgPuff,vec2(-.45,.85)));
 float t=body+.16*pgPuff.y+.6*rim*rim+.2*wool;
 vec3 c=pgPaint(t,mix(vec3(.4,.42,.85),vec3(1.,.76,.52),smoothstep(.25,.8,t)))*(pgShade+lit);
 c+=lit*vec3(1.,.66,.28)*pgDn(.012,.0,-d)*(.4+1.5*uKeys);
 return c+under*sat(.6-.6*pgPuff.y)*(.7+.8*wool);
}
// Strips of foil under y: x light, y cover.
vec2 pgFoil(vec2 p,float y) {
 float n=p.x*62.,id=floor(n),h=hash11(id+4.),dry=max(-uOwn[5],.0),all=max(uOwn[5],.0);
 float on=sat(3.*(pgIn(abs(p.x/pgFit-.32)-.2,.04)*(1.-dry)+1.2*all-.75*hash11(id+9.)))*step(.4*h*h-.2,p.y)*step(p.y,mix(y,.6,all));
 if (on<=.0) return vec2(.0);
 float turn=p.y*(14.+22.*h)+h*40.+1.5*sin(uTime*.35+h*9.),x=n-id-.3-.4*h;
 return vec2(.1+.25*abs(sin(turn))+pow(.5+.5*sin(turn*2.+1.),7.)*(.6+1.8*uTexture),on*pgIn(abs(x)/62.-.0007-.0034*abs(cos(turn))));
}
vec3 pgSky(vec2 p,vec3 lit,vec2 v) {
 float r=length(v),a=atan(v.y,v.x+1e-5),br=pgBrush(p,5.,42.)-.5,ray=smoothstep(-.35,.35,sin(a*15.+.5*sin(a*4.)+1.5*br));
 float t=.62-.5*p.y+.18*ray*exp(-r*2.)+.3*br+.25*exp(-r*4.);
 vec3 c=pgPiece(pgPaint(t,mix(vec3(1.,.72,.42),vec3(.26,.54,.8),smoothstep(.15,.6,p.y+.6*r))),vec2(.5+.55*p.x/pgFit,.75-1.3*p.y));
 vec3 disc=mix(vec3(1.,.66,.22),vec3(1.,.26,.12),PG_P7);
 if (PG_M6>.0) c=mix(c,pgPaint(.2+.2*br+.5*exp(-r*5.),vec3(.4,.5,.95)),.9*PG_M6);
 c=mix(c,pgPaint(.9-.2*br,disc)*(1.+.3*uMic),pgIn(r-.12-.07*PG_P6-.04*PG_P7)*(1.-PG_M6*pgIn(length(v-vec2(.055,.03))-.1)));
 if (PG_M6>.0) for (int k=0; k<2; k++) {
  // tin stars on threads
  float n=p.x*(5.+2.*float(k))+.4*float(k),id=floor(n),h=hash11(id+17.*float(k)),R=.018+.02*fract(h*9.);
  vec2 o=vec2((n-id-.3-.4*h)/(5.+2.*float(k))+.006*sin(uTime*.3+h*9.),p.y-.06-.36*fract(h*37.));
  float sa=abs(mod(atan(o.x,o.y+1e-5)+PI/5.,TAU/5.)-PI/5.),ro=length(o),st=ro*(cos(sa)+1.2*sin(sa))-R;
  c=mix(c,c*.45,pgIn(abs(o.x)-.0006)*step(.0,o.y)*PG_M6);
  c=mix(c,pgPaint(.75+12.*(o.y-o.x),vec3(1.,.8,.45))*(1.2+2.*uBands[int(h*15.)] + uKeys),pgIn(st*.8)*PG_M6);
 }
 return c*(pgShade+lit/(.75+.35*pgLum(lit)));
}
// Past the cloth.
vec3 pgWing(vec2 p,float x,vec3 lit) {
 vec3 c=mix(lit*.08*exp(-x*7.)+.006,vec3(.2,.14,.08)*lit,pgIn(abs(abs(x-.16)-.03)-.004));
 c=mix(c,pgWood(vec2(x,p.y))*(.35+1.2*pgDn(.045,.004,x))*(lit+pgShade),pgIn(x-.046));
 return mix(c,.6*lit,pgIn(length(vec2(x-.01,(fract(p.y*8.)-.5)/8.))-.0045));
}
vec3 pgRails(vec2 p) {
 float x=p.x-pgBy(1.35,.6,.12,uOwn[3])*pgFit,many=pgBy(1.5,1.,.65,uOwn[1]),shadow=1.,d=1.;
 vec2 v=p-vec2((-.3+.16*sin(TAU*uLoop)+.5*PG_P6+.32*PG_P7)*pgFit,.18+.06*cos(TAU*uLoop)-.06*PG_P6-.07*PG_P7);
 vec3 lit=pgLime*(.16+.95*exp(-2.6*dot(v,v)))*(.95+(.25+.6*uEnergy)*uDrone+.25*uLevel);
 pgPuff=vec2(.0);
 pgForm=vec3(pgBy(1.5,1.,.94,uOwn[2]),pgBy(.5,.85,.9,uOwn[2]),1.+.28*max(uOwn[2],.0));
 // the cloud let down from above
 vec2 q=p-vec2(.32*pgFit+.012*sin(.13*uTime),.27+.006*sin(.21*uTime)-.04*uPhrase+.6*min(PG_P6+PG_P7+PG_M7,1.));
 pgCloud(q,.24,5.,d);
 float hung=pgIn(d+.012*(noise(p*80.)-.5),.003)*step(.0,q.y),hang=smoothstep(-.02,.07,max(d,-q.y)),left=1.-hung,a;
 vec3 col=vec3(.0);
 if (hung>.0) col=hung*pgCotton(p,d,.34,pgLime*.45,pgInk(3)*uPhrase*.5);
 for (int i=0; i<5&&left>.03; i++) {
  if (i==3) { vec2 fo=pgFoil(p,p.y-q.y); a=fo.y*left; col+=a*fo.x*(lit+.2)*mix(vec3(1.),pgInk(2)+.3,.5*uTexture)*1.5; left-=a; }
  float fi=float(i),far=fi/4.,size=(.31-.066*fi+.0034*fi*fi)*many,h=p.y+.465-.125*fi+.006*fi*fi;
  int kd=(i+4) % 5;
  vec3 under=pgInk(kd)*(.1+.8*uEnergy)*(kd==0?uDrone:kd==1?uPad:kd==2?uTexture:kd==3?uPhrase:uHits);
  d=1.; pgPuff=vec2(.0);
  const float cut=min(PG_P6+PG_M7+PG_P7,1.);
  if (h>.0&&h<size*max(1.9*pgForm.y*pgForm.z,2.5*cut)) {
   if (cut<1.) d=pgRow(i,vec2(p.x,h),size);
   vec3 board=vec3(.0);
   if (cut>.0) board=pgCut(i,vec2(p.x,h),size,d,lit*mix(.5,1.,far),under);
   float wasD=d;
   if (abs(d+.006)<.1*size+.006) d+=size*.09*(pgBrush(p,14./size,14./size)-.5);
   d=mix(d,wasD,cut);
   a=left*pgIn(d,pgPx+size*.006);
   if (a>.0) {
    vec3 cc=cut<1.?pgCotton(p,d,mix(.16,.6,far)+.2*h/size,lit*mix(.5,1.,far),under):board;
    col+=a*mix(cc,board,cut)*(.3+.7*shadow); left-=a; }
  } else if (h<=.0) {
   // the rail, and the cloth that hangs from it
   float rail=.01-.006*far;
   vec3 c=pgPaint(.34+.3*far+.3*(pgBrush(p+far,7.,60.)-.5),vec3(.34,.44,.85))*(pgShade+lit*.7)*smoothstep(-.02,.03,-h-rail);
   vec3 w=pgWood(p.yx)*(pgShade+lit)*(.35+1.1*pgDn(rail*.5,.0,-h));
   col+=left*mix(c,w,pgIn(-h-rail))*(.3+.7*shadow);
   left=.0;
  }
  shadow=(.3+.7*smoothstep(-.02,.2,d/size))*(.7+.3*smoothstep(.0,.07,h));
 }
 if (left>.03) {
  vec3 c=pgSky(p,lit,v)*(.4+.6*shadow)*(.65+.35*hang);
  col+=left*(x>-pgPx?mix(c,pgWing(p,x,lit),pgIn(-x)):c);
 }
 pgSmoke(col,p-vec2(-.12*pgFit,-.3),lit+pgShade);
 return col;
}
vec3 render(vec2 p) {
 pgPx=1./uRes.y;
 pgFit=clamp(uRes.x/uRes.y/1.78,.42,1.3);
 pgHand=pgBy(.0,.36+.34*uVar,1.,uOwn[4]);
 pgLime=pgBy(vec3(.4,.62,1.05),vec3(1.2,.98,.66),vec3(1.4,.56,.2),uOwn[0]);
 pgShade=pgBy(vec3(.03,.06,.14),vec3(.125,.11,.12),vec3(.14,.05,.06),uOwn[0]);
 pgLime*=mix(vec3(1.),.5+pgInk(0),.3*uDrone);
 vec3 col;
 if (uVar<.5) col=pgTank(p); else col=pgRails(p);
 // a second hand tint
 float run=uCue*pgDn(1.6,1.3,length(p+vec2(.3*pgFit,.1))+1.1*uCue);
 col=pgDye(col,mix(pgInk(4),vec3(.9,.35,.5),.4),.75*run);
 return screenOf(col*1.6*(1.-.45*smoothstep(.45,1.1,length(p*vec2(.8/max(pgFit,.6),1.15)))));
}
