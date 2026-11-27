// name: Street carpet
// a: Before the crowd
// b: After the crowd
// what: A cobbled street before breakfast, and down its middle a thick carpet of dyed sawdust, petals and pine needles, cut by the shadows of roofs and a balustrade, a sack of red sawdust by its edge; or the same carpet from above once people have walked over it, its colours dragged, the stones showing, a straw hat left behind.
// follows: Drone dyes the sawdust, pad the petals, texture the needles, phrase the wavy border; the bands cut sixteen scallops. The piece lies along the street and colours each part of the carpet as it sounds. A hit throws down petals, a cue lets the sun cross, keys light single petals. Travel moves the view a little, or the petals by the kerb; voice brings haze.
// own: 0 moonlight at -1, a red evening at 1; 1 lime-white street and pale dyes at -1, black stone and hot dyes at 1; 2 dark ground and close zigzag bars at -1, cream ground and long round medallions at 1; 3 a narrow runner at -1, nearly wall to wall at 1; 4 close to the ground at -1, from higher up at 1; 5 the street bends left, or hardly walked on at -1; right, or walked nearly bare, at 1
float scPx,scNight,scEve;
vec3 scSun,scSky,scFog,scL;
vec3 scBase,scRed,scCream,scDark,scLeaf,scRose,scRun,scHeart;
float scS(float a,float b,float x) { x=sat((x-a)/(b-a));return x*x*(3.-2.*x);}
vec2 scH(vec2 p) { vec3 q=fract(p.xyx*vec3(.1031,.103,.0973));q+=dot(q,q.yzx+33.33);return fract((q.xx+q.yz)*q.zy);}
// Two noises at once.
vec2 scN2(vec2 p) {
 vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
 return mix(mix(scH(i),scH(i+vec2(1,0)),f.x),mix(scH(i+vec2(0,1)),scH(i+1.),f.x),f.y);
}
float scLum(vec3 c) { return dot(c,vec3(.3,.59,.11)); }
// Sawdust taking a dye: the hue of a sound, a little deeper than the field was.
vec3 scDye(vec3 c,vec3 k,float a) {
 k=k*k; k+=.02-.7*min(k.r,min(k.g,k.b));
 return mix(c,min(k*(.5*scLum(c)+.01)/scLum(k),vec3(.6)),sat(a));
}

void scHour() {
 scNight=sat(-uOwn[0]); scEve=sat(uOwn[0]);
 scSun=mix(mix(vec3(1.7,1.3,.82),vec3(.3,.42,.7),scNight),vec3(1.9,.78,.3),scEve)*(.95+.12*uLevel);
 scSky=mix(mix(vec3(.2,.28,.45),vec3(.03,.05,.12),scNight),vec3(.2,.15,.34),scEve);
 scFog=mix(mix(vec3(.82,.78,.72),vec3(.04,.065,.14),scNight),vec3(.85,.4,.24),scEve);
 float e=.45+.75*uEnergy,pale=sat(-uOwn[1]),bold=sat(uOwn[1]);
 scBase=scDye(mix(mix(vec3(.6,.36,.11),vec3(.72,.6,.42),pale),vec3(.75,.3,.03),bold),uKind[0],.55*uDrone*e);
 scRed=scDye(mix(mix(vec3(.4,.075,.035),vec3(.6,.3,.22),pale),vec3(.5,.02,.06),bold),uKind[0],.15*uDrone*e);
 scCream=mix(vec3(.82,.74,.58),vec3(.88,.85,.8),pale);
 scDark=mix(mix(vec3(.075,.03,.03),vec3(.3,.22,.2),pale),vec3(.06,.012,.07),bold);
 scLeaf=scDye(vec3(.07,.1,.035),uKind[2],.8*uTexture*e)*(1.+.8*uTexture);
 scRose=scDye(vec3(.8,.62,.42),uKind[1],1.1*uPad*e);
 scRun=scDye(vec3(.78,.62,.36),uKind[3],uPhrase*e);
 scHeart=scDye(vec3(.75,.5,.16),uKind[4],uHits*e)*(1.+.6*uHits*uEnergy);
}

// Loose pieces lying at q, one to a cell, one or two deep: chips, petals or needles by hs.
// scN is the tilt, scId which one, the answer how much is covered.
vec2 scN; float scId;
float scGrain(vec2 q,vec2 hs,float fill,float seed,float px,int deep) {
 float top=-1.,cov=0.;
 scN=vec2(0.); scId=.5;
 for (int j=0;j<deep;j++) {
  vec2 qq=q+float(j)*vec2(.47,.53),i=floor(qq-.5);
  for (int k=0;k<4;k++) {
   vec2 id=i+vec2(k & 1,k >> 1),h=scH(id+seed+float(j)*37.3);
   float g=fract(h.x*91.7+h.y*37.1),on=scS(g-.06,g+.06,fill*1.12-.06);
   if (on <= 0.) continue;
   vec2 d=qq-id-.5-(h-.5)*.8,a=h.yx-.5;
   a /= max(length(a),.02);
   vec2 b=vec2(-a.y,a.x),e=vec2(dot(d,a),dot(d,b))/(hs*(.75+.35*g)*on);
   float r=length(e),c=sat((1.-r)*hs.y/px+.5),z=float(j)*.2+.5*h.y;
   if (c>0. && z>top-.1) {
    top=mix(top,z,c);
    scN=mix(scN,a*e.x*.4+b*e.y+(h-.5)*.9,c);
    scId=mix(scId,g,c); cov=max(cov,c);
   }
  }
 }
 return cov;
}

// The stencilled ornament: x across (-1 to 1), y along, ft the size of a pixel both ways. Colour, and how high it is heaped.
// scMat is 0 chips, 1 petals, 2 needles.
float scMat;
void scLay(inout vec4 c,vec3 k,float h,float d,float aa) { c=mix(c,vec4(k,h),scS(aa,-aa,d)); }
vec4 scOrn(vec2 q,vec2 ft) {
 const float P=1.5; float o=uOwn[2]; q.y*=1.-.3*o; ft.y*=1.-.3*o;
 float ax=abs(q.x),id=floor(q.y/P),y=q.y-(id+.5)*P,ay=abs(y),odd=mod(id,2.);
 float sx=.006+ft.x,sd=.006+.6*(ft.x+ft.y*.5);
 vec4 c=vec4(mix(scBase,o<0.?scDark:scCream,.88*abs(o)),.5);
 vec3 f1=mix(mix(scRed,scDark,odd),scBase,sat(-o)),f2=mix(scDark,scRed,odd),f3=mix(scRed,o<0.?scBase:scLeaf,abs(o));
 scMat=0.;
 if (ax<.6+sx) {
  float u=ax/.52,v=ay/.68,dl=(mix(u+v,length(vec2(u,v)),sat(o))-1.)*.4;
  float bar=(abs(fract(q.y/P*2.+.5*ax)-.5)-.26)*.6;
  dl=mix(dl,max(bar,-.3),sat(-o));
  float dk=(abs(ax-.58)/.22+(.75-ay)/.3-1.)*.16;
  vec2 lf=rot(.9)*(vec2(ax,ay)-vec2(.39,.54));
  float leaf=length(lf*vec2(1.,2.6))-.15;
  scLay(c,scLeaf*1.5,.75,max(leaf,.012-abs(lf.y)),sd);
  scLay(c,f2,.7,dk,sd);
  scLay(c,scCream,.9,dk+.07,sd);
  scLay(c,scCream,.8,dl,sd);
  scLay(c,f1,.6,dl+.03,sd);
  scLay(c,scBase,.75,abs(dl+.1)-.014,sd);
  // the flower in the middle, eight petals laid with real ones
  float r=length(vec2(ax,y)),pt=(ax*ax-y*y)/max(r*r,1e-5);
  pt=abs(2.*pt*pt-1.);
  float fl=(r-.12-.15*sqrt(pt))*(.55+.45*pt);
  scLay(c,f2,.5,r-.31,sd);
  if (fl<0.) scMat=1.;
  scLay(c,mix(scRose,scCream,.3*odd),1.,fl,sd);
  scLay(c,scRed,.8,r-.1,sd);
  scLay(c,scHeart,1.1,r-.065,sd);
  if (r<.1) scMat=0.;
 }
 if (ax>.5) {
  scLay(c,scCream,.9,.57-ax,sx);
  scLay(c,scDark,.55,.595-ax,sx);
  // the running border
  float w=sin(q.y*TAU/.375),run=abs(ax-.655-.03*w)-.013-.008*uPhrase;
  scLay(c,scRun,.9,run,sx+.1*ft.y);
  scLay(c,scCream,.9,.715-ax,sx);
  scLay(c,f3,.55,.74-ax,sx);
  // sixteen scallops, one for each band, over two panels
  float cell=floor(q.y/.1875),bn=uBands[int(mod(cell,16.))&15];
  vec2 s=vec2((ax-.9)/(.1+.07*bn),(fract(q.y/.1875)-.5)/(.36+.16*bn));
  float sc=(length(s)-1.)*.08;
  scLay(c,scCream,.85,sc,sx+.4*ft.y);
  scLay(c,scBase,.95,sc+.026,sx+.4*ft.y);
  scLay(c,scDark,.8,sc+.06,sx+.4*ft.y);
  scLay(c,scLeaf,.7,.885-ax,sx);
  if (ax>.885) scMat=2.;
 }
 return c;
}
// What the two pictures ask for at a pixel: the place on the ground, on the carpet and in the piece, the loose things lying there,
// and the size of a pixel. Then what they are given.
float scOn,scE,scZ,scWide,scRed2,scId1,scLt;vec2 scSq;vec3 scBack,scV;vec4 scAt;
vec2 scW2,scO,scFt,scPc,scLd,scGu,scQ,scHs;
float scFar,scFine,scFill,scQx,scSf;
vec3 scStoneC,scHeapC;vec2 scStoneN,scHeapN,scLooseN;float scLoose,scLooseId;
// The carpet: fields stand a little above or below each other, each in its own stuff.
void scHeap() {
 float up=scOrn(scO+scLd*.022,scFt*1.3).a;
 vec4 c=scOrn(scO,scFt),m=piece(scPc);
 float mt=scMat,l=max(m.r,max(m.g,m.b)),F=mt>1.5?17.:mt>.5?26.:65.,show=scS(.8,.12,scFar*F);
 vec3 k=c.rgb;
 if (l>.004) k=scDye(k,sqrt(m.rgb/l),sat(m.a*1.2)*.75*(1.-.7*scS(.5,.75,scLum(k)))*(.55+.5*uEnergy))*(1.+.25*m.a);
 vec2 hs=mt>1.5?vec2(.85,.07):mt>.5?vec2(.6,.42):vec2(.5,.34);
 float cv=scGrain(scGu*F,hs,1.,1.+mt*5.,F*scFine,2);
 vec3 g=mix(k*.4,k*(.68+.64*scId),.3+.7*cv);
 if (mt>1.5) g=mix(g,g*vec3(2.6,1.5,.8),.4*step(.75,scId));
 else if (mt>.5) g+=g*1.5*uKeys*step(.86,scId);
 scHeapN=scN*show*(.6+.6*uTone)-scLd*(c.a-up)*1.7*scS(.25,.03,scFar);
 scHeapC=mix(k,g,show)*(.9+.25*(noise(scGu*vec2(9.,7.))-.5));
}
// The piece on the carpet: half by the panel, half where it lies. u is along, v across.
vec2 scPlace(float a,float b,float across) {
 return vec2(.5*(a+b),.5+.24*(across+(floor(across*4.)+.5)/4.));
}
// The stones: their colour, and their tilt in scN.
vec3 scStone(vec2 w,float foot) {
 w+=.035*(scN2(w*5.)-.5);
 vec2 n5=scN2(w*47.+90.);
 vec2 q=vec2(w.x/.25+scH(vec2(floor(w.y/.17),3.)).x*7.,w.y/.17),h=scH(floor(q)+5.);
 vec2 f=(fract(q)-.5-.1*(h-.5))*vec2(.25,.17),e=abs(f)-vec2(.072,.034)+.012*h.x;
 float d=length(max(e,0.))+min(max(e.x,e.y),0.)-.04,see=scS(.09,.02,foot);
 scN=(f*vec2(6.5,9.)*scS(-.05,0.,d)+(h-.5)*.35+.4*(n5.x-.5))*see;
 vec3 c=mix(vec3(.19,.18,.175),vec3(.3,.27,.235),h.y)*(.8+.4*n5.y);
 c=mix(vec3(.045,.045,.035),c,mix(.8,scS(.006+foot,-.01-foot,d),see));
 return mix(mix(c,sqrt(c)*vec3(1.1,1.07,1.),sat(-uOwn[1])),c*vec3(.24,.25,.3),sat(uOwn[1]));
}
// The handful of petals a hit throws down: w is a place on the ground, at where it lands.
void scBurst(inout vec3 c,vec2 w,vec2 at,float size,float foot) {
 vec2 d=w-at;
 if (uHits<.01 || dot(d,d)>size*size*1.7) return;
 float t=1.-uHits,o=.25+.75*t*(2.-t);
 c*=1.+.8*uHits*(.4+uEnergy)*exp(-dot(d,d)/(size*size)*2.);
 for (int i=0;i<24;i++) {
  float fi=float(i),a=fi*2.4;
  vec2 h=scH(vec2(fi,8.)),e=rot(h.x*6.+t*2.*(h.y-.5))*(d-size*o*sqrt((fi+.5)/24.)*vec2(cos(a),sin(a)));
  float r=length(e*vec2(1.,1.7))-size*(.08+.05*h.y);
  c=mix(c,mix(uKind[4]*uKind[4],scCream,.15+.4*h.x)*1.5,scS(foot+.004,-foot-.004,r)*sat(uHits*2.5));
 }
}
// How far a cue has lifted the shade at a place along the way the sun goes.
float scCue(float d) { return min(uCue*2.,1.)*exp(-d*d); }

// ---- before the crowd
const float scW=2.5;
float scBend,scRail,scHaze;
vec3 scAir(vec3 c,float z) { return mix(scFog,c,exp(-z*scHaze*(.4+min(z,40.)*.06))); }
// Where along the street z the houses are counted from, and how high each stands; the sun comes over those on the right.
float scNo(float side,float z) { return z/2.7+(side>0.?1.89:.55); }
float scTall(float side,float id) {
 float m=mod(id,3.);
 return side<0.?2.25+.5*hash11(id+4.):m<.5?1.25:m<1.5?2.9:2.35;
}
// scRail is 1 where a balustrade is on top.
float scRoof(float z) {
 float u=scNo(1.,z),id=floor(u),f=u-id,a=scTall(1.,id);
 scRail=a<1.5?scS(0.,.02,f)*scS(1.,.98,f):0.;
 return mix(a,scTall(1.,id+1.),scS(.985,1.,f));
}
// The balustrade on a wall of height h.
float scPosts(float z,float y,float h,float a,float b) {
 return max(scS(.05+a,-.05-a,abs(fract(z/.26)-.5)-.2)*scS(h+.5+b,h+.5-b,y),scS(b,-b,abs(y-h-.47)-.045));
}
// How much sun comes over the roofs to a place in the street.
float scLit(vec3 P,float foot) {
 float k=max(scW-P.x,0.)/scL.x,z=P.z+k*scL.z,y=P.y+k*scL.y,h=scRoof(z),pen=.025+.012*k+foot;
 h+=.05*abs(sin(z*15.))*(1.-scRail);
 float s=scS(h-pen,h+pen,y)*(1.-scRail*scPosts(z,y,h,foot*2.,pen));
 float cue=scCue((P.z-mix(0.,4.5,uCue))/(.8+.25*P.z));
 return max(s,cue)*(1.+.6*cue);
}
vec3 scPlaster(float side,float id) {
 vec2 h=scH(vec2(id*3.+40.,side*7.+20.));
 vec3 c=h.x<.25?vec3(.5,.31,.14):h.x<.5?vec3(.6,.56,.49):h.x<.75?vec3(.42,.16,.1):vec3(.32,.38,.4);
 return mix(c,vec3(.75,.72,.66),.75*sat(-uOwn[1]));
}
// A house front: plaster with rain stains and worn limewash, a door, a window in a pale frame.
vec3 scFront(float side,float z,float y,float foot,float lit) {
 float id=floor(z/2.7),f=z-(id+.5)*2.7,a=.005+foot,no=scTall(side,id)<1.5?9.:0.;
 vec3 c=scPlaster(side,id);
 vec2 pa=scN2(vec2(z*1.9,y*1.7)+id*5.+70.),pb=scN2(vec2(z*9.,y*8.)+70.);
 float pe=.75*pa.x+.25*pb.x;
 c*=.62+.4*pa.y+.16*pb.y+.14*noise(vec2(z,y)*47.);
 c=mix(c,vec3(.5,.45,.38),.55*scS(.6,.63,pe+.16*scS(1.2,0.,y)));
 c=mix(c,c*vec3(.42,.36,.36),scS(.626,.614,y));
 float dr=max(abs(f+.6)-.36,y-1.7)+no,wn=max(abs(f-.55)-.3,abs(y-1.3)-.42)+no;
 c=mix(c,vec3(.62,.55,.44),scS(a,-a,min(dr,wn)-.07));
 c=mix(c,vec3(.1,.055,.03)*(.7+.6*scS(.1,.16,abs(fract(f*4.)-.5))),scS(a,-a,dr));
 c=mix(c,vec3(.03,.035,.04),scS(a,-a,wn));
 c=mix(c,vec3(.12,.1,.08),scS(a*6.,-a*6.,abs(fract(f*8.)-.5)-.1)*scS(a,-a,wn));
 vec3 l=scSky*(.9+.1*y)+scSun*(side>0.?.13:.06)*(.6+.4*scS(2.2,0.,y));
 return c*(l+scSun*lit*.56);
}
// The sky, and the mountain at the end of the street.
vec3 scSkyCol(vec2 q) {
 vec3 c=mix(scFog*vec3(1.05,1.,.92),mix(mix(vec3(.3,.47,.72),vec3(.008,.015,.05),scNight),vec3(.3,.2,.4),scEve),scS(-.05,.5,q.y+.25*q.x));
 float x=abs(q.x+.06),n=noise(vec2(q.x*40.,1.)),m=min(.19-.4*x+.014*n,.16+.013*n);
 vec3 mc=mix(mix(vec3(.3,.4,.55),scFog*.6,.3),vec3(.02,.03,.07),scNight);
 return mix(c,mix(mc,scFog,scS(.2,-.02,q.y)*.55),scS(-.002,.002,m-q.y));
}
// The cut-out board, lozenges in a row.
float scHole(vec2 b) { return (abs(fract(b.x/.23)-.5)/.34+abs(b.y)/.13-1.)*.05; }
float scBoard(vec2 b) { return max(max(abs(b.x)-.46,abs(b.y)-.2),-scHole(b)); }
void scStreet(vec2 p) {
 float hi=uOwn[4],ch=.8*exp2(hi>0.?1.35*hi:.7*hi),px=scPx,cx=.28,creep=sin(uTravel*.04);
 vec2 q=p-vec2(.24*scS(.3,1.5,uRes.x/uRes.y),.17+.1*hi);
 float z0=ch*(1.72-.12*creep),cz=.12*creep*ch,B=.004+.03*uOwn[5];
 scBend=B;
 scHaze=.016*(.6+.8*uSpace)+.015*uMic;
 scL=normalize(vec3(.82,.6+.06*sin(uTime*.021),.4));
 vec3 col=scSkyCol(q);
 // where the eye meets the two rows of houses in a street that bends
 vec2 gap=vec2(scW+cx,scW-cx),zs=vec2(-q.x,q.x),dis=q.x*q.x+vec2(4,-4)*B*gap;
 zs=2.*gap/max(zs+sqrt(max(dis,0.)),1e-4);
 if (dis.x<0.) zs.x=1e4;
 if (dis.y<0.) zs.y=1e4;
 float zg=q.y<-.001?ch/-q.y:1e4;
 // the nearest house that stands in the way: its front, or the gable end that looks down the street towards us
 float cov=0.,hz=1e4,hy=0.,hs=1.,hu=0.,hH=0.,hg=0.;
 for (int k=0;k<2;k++) {
  float side=float(k)*2.-1.,z=k>0?zs.y:zs.x,id0=floor(scNo(side,cz));
  for (int j=1;j<4;j++) {
   float id=id0+float(j),zb=(id-scNo(side,0.))*2.7-cz;
   float X=side*(cx+q.x*zb-B*zb*zb)-scW,hb=scTall(side,id),Y=ch+q.y*zb,a=px*zb,c=step(0.,X)*scS(a,-a,Y-hb-.3*X);
   if (zb>.2 && X<2.6 && c>0. && zb<hz) { cov=c;hz=zb;hy=Y;hs=side;hu=(id+.02)*2.7+X;hH=hb+.3*X+.16;hg=1.;}
  }
  if (z<min(zg,400.)) {
   float zz=z+cz,y=ch+q.y*z,foot=px*z*z/scW*1.2,fy=px*z,H=scTall(side,floor(scNo(side,zz)));
   scRail=0.;
   if (k>0) H=scRoof(zz);
   float c=max(scS(H+fy,H-fy,y-.05*abs(sin(zz*15.))*(1.-scRail)),scRail*scPosts(zz,y,H,foot,fy));
   bool back=hz<1e3;
   if (c>(back?.5:.01) && z<hz) { cov=back?1.:c;hz=z;hy=y;hs=side;hu=scNo(side,zz)*2.7;hH=H;hg=0.;}
  }
 }
 scOn=q.y>-.001 || zg>min(zs.x,zs.y) || zg>400.?-1.:0.;
 zg=min(zg,400.); q.y=min(q.y,-.001);
 // the carpet stands a finger high: where does the eye meet its bank
 float W=1.02*(1.+(uOwn[3]>0.?.95:.5)*uOwn[3]),T=.1,lo=(ch-T)/-q.y,z=zg,e=0.;
 float rough=.022*(noise(vec2((cx+q.x*z)*14.,z*3.))-.5);
 // between the height of its top and the stones the bank is a slope
 float e0=min(W-abs(cx+q.x*lo-B*lo*lo),lo-z0)+rough+.01,e1=min(W-abs(cx+q.x*zg-B*zg*zg),zg-z0)+rough+.01,de=1.+(e1-e0)/.07;
 z=mix(lo,zg,e0>.07?0.:de<.001?1.:sat((1.-e0/.07)/de));
 vec2 w=vec2(cx+q.x*z-B*z*z,z+cz);
 float y=ch+q.y*z,foot=px*z*z/ch,fx=px*z,dz=w.y-cz-z0;
 e=min(W-abs(w.x),dz)+rough;
 bool wall=scOn<-.5;
 if (!wall) scOn=scS(-.012-fx,.012+fx,e);
 float zz=hz+cz;
 scLt=wall?scLit(vec3(-scW,hy,zz),.03):scLit(vec3(w.x,y,w.y),min(.5*foot,.3));
 if (cov>0.) {
  float fy=px*hz,foot=fy*hz/scW*1.2*(1.-hg),wave=abs(sin(zz*15.))*(1.-hg),lit=0.,rail=0.;
  if (hs>0.) { scRoof(zz);rail=scRail*(1.-hg);}
  else lit=scLt*scS(hH-.42,hH-.47,hy)*(1.-hg);
  vec3 c=scFront(hs,hu,hy+3.*hg,foot,lit);
  // the eave, dark underneath, and the ends of its tiles
  c=mix(c,vec3(.1,.05,.03)*(scSky+.1*scSun)*(1.+.8*step(.5,fract(zz*4.))*scS(.2,.05,foot)),scS(hH-.28-fy,hH-.28+fy,hy)*(1.-rail));
  c=mix(c,vec3(.45,.17,.09)*(scSky+scSun*(hs>0.?.1:.75)*(1.-hg))*(.6+.5*wave),scS(hH-.13-fy,hH-.13+fy,hy)*(1.-rail)*(1.-.7*hg));
  col=mix(col,scAir(c,hz),cov);
 }
 scBack=col;
 scW2=w;scSf=.6*foot;scGu=w+vec2(0.,40.+1.4*y);
 scO=vec2(w.x,dz)/W+.012*(scN2(scGu*30.)-.5)+vec2(0.,.1);
 float f9=log(9.),pid=(floor(scO.y/.375)+.5)*.375;
 scPc=scPlace(log(1.+max(pid*W/z0,0.))/f9,log(1.+max(scO.y*W/z0,0.))/f9,scO.x);
 scFt=vec2(fx,foot)/W;scLd=normalize(scL.xz);scFine=max(fx,.35*foot);scFar=.5*foot;
 // loose here are the crumbs fallen beside it
 scQ=scGu*60.;scHs=vec2(.42,.3);scFill=.75*exp(min(e,0.)*9.)*scS(.05,.02,foot);scQx=60.*scFine;
 scE=e;scZ=z;scV=vec3(q,y);scAt=vec4(cx,ch,cz,z0);scWide=W;
 // or the sack's own sawdust
 scSq=(p-vec2(-.82,-.58))/(.36+.03*creep);
 scSq.x+=.025*(noise(scSq.yy*5.)-.5);
 float rr=length((scSq-vec2(0.,.8))/vec2(.47,.125));
 scRed2=max(abs(scSq.x)-.44,scSq.y-.8-.3*exp(-scSq.x*scSq.x*9.));
 if (scSq.y<.8) scRed2=max(scRed2,(rr-1.)*.12);
 if (scRed2<.03) { scQ=scSq*62.;scHs=vec2(.5,.34);scFill=1.;scQx=174.*px;}
}
vec3 scStreetLit() {
 vec2 w=scW2,q=scV.xy,nn=scStoneN;
 float e=scE,on=scOn,z=scZ,W=scWide,ch=scAt.y,fx=scPx*z,foot=fx*z/ch,ao=.5+.5*scS(-.01,-.16,e),lit=scLt;
 float cr=scLoose*scS(.05,.015,foot)*step(.03,scRed2),dz=w.y-scAt.z-scAt.w;
 vec3 alb=mix(scStoneC,mix(scRed,scBase,step(.5,scLooseId)),cr);
 nn=mix(nn,scLooseN,cr);
 // its bank is raw sawdust
 vec2 n2=scHeapN+(dz<W-abs(w.x)?vec2(0.,-1.):vec2(sign(w.x),0.))*scS(.07,.02,e);
 vec3 ca=mix(mix(scRed,scBase,.25)*(.4+.7*scId1),scHeapC,scS(.035,.055,e+.03*scId1-.015));
 float o1=sat(on);
 alb=mix(alb,ca,o1);nn=mix(nn,n2,o1);ao=mix(ao,.75+.25*scS(0.,.08,e),o1);
 // the cut-out board, left where it was last used
 vec2 at=vec2(-W*.74,scAt.w+.66);
 float tb=(ch-.12)/-q.y,te=(ch-.104)/-q.y,ba=.004+fx,sh=scS(.02,-.01,scBoard(rot(-.22)*(w+scL.xz*.1-vec2(0.,scAt.z)-at)));
 vec2 bo=rot(-.22)*(vec2(scAt.x+q.x*tb-scBend*tb*tb,tb)-at),b2=rot(-.22)*(vec2(scAt.x+q.x*te-scBend*te*te,te)-at);
 float top=scS(ba,-ba,scBoard(bo)),brd=max(top,scS(ba,-ba,scBoard(b2)));
 vec2 wn=scN2(bo*vec2(6.,50.)+50.);
 vec3 wood=mix(vec3(.44,.3,.17)*(.7+.5*wn.x),scRed,.7*scS(.55,.8,wn.y))*(.35+.65*top);
 alb=mix(alb,wood,brd);nn*=1.-brd;ao=mix(ao,1.,brd);lit*=1.-sh*(1.-brd);
 scBurst(alb,w,vec2(.15+.4*sin(uTime*.037),scAt.z+scAt.w*1.75),.5*scAt.w,.3*foot);
 vec3 N=normalize(vec3(nn.x,1.,nn.y));
 vec3 c=alb*(scSky*ao*(1.15-.15*nn.y)+scSun*(lit*max(dot(N,scL)*1.25,0.)+vec3(.05,.035,.022)*ao));
 // the low sun on smooth stone
 float gl=pow(max(dot(N,normalize(scL+normalize(vec3(-q,-1.)))),0.),22.);
 c=on<-.5?scBack:scAir(c+(scSun*lit*.35+scSky*.15)*gl*(1.-o1),z);
 // the sack of raw red sawdust, near on the left and cut by the frame
 q=scSq;
 float wd=.52-.1*scS(.2,.75,q.y)+.06*sin(q.y*5.+.6),px=scPx*4.;
 c*=1.-.6*scS(.2,0.,max(q.x-wd,q.y-.6))*scS(-.9,0.,q.x);
 float nx=clamp(q.x/wd,-1.,1.),fold=1.4*noise(vec2(q.x*8.+q.y*1.5+20.,q.y*2.));
 vec3 bc=vec3(.4,.28,.16)*(.65+.35*(1.+.22*scS(.0036,.0016,scPx)*(sin(q.x*260.)+sin(q.y*280.))));
 vec3 lt=scSky*(.9-.3*nx+.5*q.y)+scSun*(.75*pow(sat(nx),3.)+.1)*(.4+.9*fold);
 c=mix(c,bc*lt*(.45+.6*fold),scS(px,-px,max(abs(q.x)-wd,q.y-.8)));
 vec2 m=(q-vec2(0.,.8))/vec2(.47,.125);
 float rr=length(m);
 vec3 rim=bc*(scSky*1.2+scSun*(.25+.75*sat(.6*m.x-.3*m.y)));
 c=mix(c,rim*(.5+.5*scS(1.22,1.,rr)),scS(1.2+px*4.,1.2-px*4.,rr));
 vec3 rc=scRed*(.6+.8*scLooseId)*(.4+.6*scLoose)*(scSky*(1.-.3*q.x)+scSun*max(.45+1.5*q.x+.5*scLooseN.x+.8*(q.y-.85),0.));
 return mix(c,rc,scS(px,-px,scRed2));
}

// ---- after the crowd
// A straw hat lying tipped on its brim: how much of the ray it stops; scHp is where, scHn faces out, scHm is 1 on the crown.
float scHm; vec3 scHn,scHp;
const vec3 scHa=vec3(-.66,.7,-.27);
float scHat(vec3 ro,vec3 rd,float soft) {
 vec3 a=scHa;
 float dn=dot(rd,a),oa=dot(ro,a),hit=0.,t=abs(dn)>1e-3?-oa/dn:-1.;
 scHm=0.;scHn=a;scHp=ro+rd*t;
 if (t>0.) hit=scS(.36+soft,.36-soft,length(scHp)-.012*sin(scHp.y*14.+scHp.x*9.));
 // the crown, half an egg on the brim's axis
 vec3 o=(ro-a*oa)/.185+a*oa/.2,d=(rd-a*dn)/.185+a*dn/.2;
 float A=dot(d,d),b=dot(o,d),D=b*b-A*(dot(o,o)-1.);
 if (D>0.) {
  t=(-b-sqrt(D))/A;
  vec3 q=ro+rd*t;
  if (t>0. && dot(q,a)>0.) { hit=max(hit,scS(0.,.06+soft,D/A*25.));scHm=1.;scHp=q;scHn=normalize(o+d*t);}
 }
 return hit;
}
// How far people's feet have gone: 1 in the middle of their way; then footprints.
vec2 scTrod;vec3 scNb;vec3 scRo,scRd;
const vec2 scMid=vec2(0.,1.97);
void scAfter(vec2 p) {
 float drop=3.*exp2(.5*uOwn[4]),pit=.98;
 scRo=vec3(0.,drop,0.); scRd=normalize(vec3(p.x,p.y*cos(pit)-1.25*sin(pit),p.y*sin(pit)+1.25*cos(pit)));
 float t=drop/max(-scRd.y,.02),foot=scPx*t/1.2;
 // the street runs slantwise through the picture
 scBack=vec3(-.86,.29+.04*sin(uTime*.019),.3); scBack /= length(scBack);
 vec2 w=rot(.62)*((scRo+scRd*t).xz-scMid),lg=rot(.62)*scBack.xz,gu=w+20.;
 scL=vec3(lg.x,scBack.y,lg.y); scLd=normalize(lg);
 float W=1.+(uOwn[3]>0.?.4:.45)*uOwn[3],e;
 vec2 na=scN2(gu*3.1),nb=scN2(gu*8.),nc=scN2(gu*33.);
 // the way people went, dragging the colours along
 float dx=w.x-.3*sin(w.y*1.1+.9)-.13*sin(w.y*2.7+2.),wide=.37*exp2(1.3*uOwn[5]),trk=exp(-dx*dx/(wide*wide));
 float st=noise(vec2(dx*34.+3.*na.x,w.y*2.2)),s2=noise(vec2(dx*11.,w.y*1.1+9.)),pr=0.;
 for (int k=0;k<2;k++) {
  float fk=float(k),v=w.y/.4+fk*.5,rw=floor(v);
  vec2 h=scH(vec2(rw,fk+3.)),f=vec2(dx+(fk-.5)*.28*(.6+wide)-.1*(mod(rw,2.)*2.-1.)-.1*(h.x-.5),(v-rw-.5)*.4);
  f=rot(.5*(h.y-.5))*f;
  float s=min(length((f-vec2(0.,.035))*vec2(1.,.62))-.054,length((f+vec2(0.,.1))*vec2(1.,.9))-.043);
  pr=max(pr,scS(.012,-.012,s));
 }
 scTrod=vec2(trk,pr); scNb=vec3(nb,nc.x);
 scO=(w+trk*vec2((na.x-.5)*.25,(st+s2-1.)*.5))/W;
 scO+=.012*(nc-.5);
 e=W-abs(w.x)+.05*(nb.x-.5)+.02*(nc.x-.5);
 float left=1.-trk*(.75+.5*max(uOwn[5],0.))+trk*(.9*nb.y+.5*st-.7)-.45*pr*(.3+trk);
 left=min(left,e*14.+.4)+.25*(nc.y-.5);
 scOn=scS(.25,.4,left)*(.7+.3*scS(.4,.8,left));
 float pid=(floor(scO.y/.375)+.5)*.375,kb=abs(w.x)-1.5,wy=w.y+20.+3.*step(0.,w.x),cm=fract(wy/.8);
 scPc=scPlace(.5+pid*W/4.2,.5+w.y/4.2,scO.x);
 scFt=vec2(foot)/W;scGu=gu;scFine=scFar=foot;scE=e;scZ=s2;
 // loose here are the petals, blown along the kerb into commas
 scFill=scS(.17*(1.-cm)+.02,0.,abs(.05+kb+.4*cm*cm))*scS(0.,.12,cm)+.1*exp(-abs(e)*2.)+.3*uPad*scS(.55,.8,na.y);
 scFill*=1.7*step(kb,.1);
 scQ=(gu+vec2(sin(uTravel*.05),cos(uTravel*.037))*.12)*15.;scHs=vec2(.5,.27);scQx=15.*foot;
 // the pavement is of smaller stones
 scW2=kb>.2?w.yx*1.7+9.:w;scSf=kb>.2?.7*foot:.4*foot;scAt=vec4(w,kb,foot);
}
vec3 scAfterLit() {
 vec2 w=scAt.xy,gu=scGu,lg=scL.xz;
 float kb=scAt.z,foot=scAt.w,e=scE,on=scOn,trk=scTrod.x,ks=.006+foot,pv=scS(-ks,ks,kb),in1=scS(-ks,ks,kb-.2);
 vec2 n2=scHeapN+1.2*(scNb.xy-.5)*trk;
 // colour trodden into the stones
 vec3 alb=mix(scStoneC,mix(scHeapC,mix(scRed,scBase,scZ),.5)*.8,.55*exp(min(e,0.)*3.5)*scS(.2,.75,.75*scNb.y+.35*scNb.z));
 alb=mix(alb,scHeapC*(1.-.45*scTrod.y),on);
 vec2 nn=mix(scStoneN,n2,on);
 float ao=mix(.75+.25*scS(0.,-.1,e),1.-.4*scTrod.y,on);
 vec3 pe=mix(scRose*vec3(.95,.5,.4),scCream,scS(.2,.95,scLooseId))*(.7+.4*scLooseId);
 alb=mix(alb,pe*(1.+uKeys*step(.8,scLooseId)),scLoose);nn=mix(nn,scLooseN*.5,scLoose);ao=mix(ao,1.,scLoose);
 vec3 slab=vec3(.4,.36,.31)*(.7+.4*scNb.z)*scS(-.01,.02+foot,abs(fract(w.y/.75)-.5)*.75);
 alb=mix(alb,mix(slab,sqrt(scStoneC)*vec3(.62,.57,.5),in1),pv);nn=mix(nn,scStoneN.yx*in1,pv);ao=mix(ao,1.,pv);
 // light: the kerb's shade, the roof's, the hat's
 float lit=mix(scS(.04,.1,(1.5-w.x*sign(lg.x))/max(abs(lg.x),.01)*scL.y),1.,pv);
 ao*=1.-.5*exp(-abs(kb+.01)*40.)*(1.-pv);
 vec2 rf=vec2(dot(w,scLd),dot(w,vec2(-scLd.y,scLd.x)));
 float eave=1.6-.08*abs(sin(rf.y*8.))-.5*scS(.18,.15,abs(rf.y+.5)),cue=scCue((w.y-mix(-2.2,.6,uCue))/.8);
 lit*=1.-scS(eave-.04,eave+.04,rf.x)*(1.-cue); lit*=1.+.6*cue;
 vec3 LW=scBack,hc=vec3(.42,.25,scMid.y+.1),gp=scRo+scRd*(scRo.y/max(-scRd.y,.02))-hc,n,amb=scSky*.7;
 lit*=1.-scHat(gp,LW,.03);
 scBurst(alb,w,vec2(-.35,-.3+.4*sin(uTime*.037)),.46,foot);
 n=normalize(vec3(nn.x,1.,nn.y));
 vec3 col=alb*(amb*ao+scSun*(lit*max(dot(n,scL)*2.2,0.)+vec3(.05,.035,.022)*ao));
 float hh=scHat(scRo-hc,scRd,foot);
 n=dot(scHn,scRd)>0.?-scHn:scHn;
 float al=dot(scHp,scHa),rr=length(scHp-scHa*al),ring=(scHm>.5?al:rr)*130.;
 vec3 sw=vec3(.66,.45,.2)*(.75+.2*sin(ring)*scS(.03,.004,foot)+.2*noise(vec2(ring*.3,atan(scHp.x,scHp.z+1e-4)*22.)));
 if (scHm>.5) sw=mix(sw,vec3(.1,.03,.035),scS(.075,.068,al));
 return mix(col,sw*(amb*(.9+.3*n.y)+scSun*(max(dot(n,LW),0.)*(1.-.5*scS(0.,.1,.23-rr)*(1.-scHm))+.06)),hh)+.1*uMic*scFog;
}
vec3 render(vec2 p) {
 scPx=1./uRes.y; scHour();
 if (uVar<.5) scStreet(p); else scAfter(p);
 scStoneC=scStone(scW2,scSf); scStoneN=scN;
 scHeap(); scId1=scId;
 scLoose=scGrain(scQ,scHs,scFill,9.,scQx,1);scLooseN=scN;scLooseId=scId;
 vec3 c=uVar<.5?scStreetLit():scAfterLit();
 c=max(c,0.); c=c*(1.+.12*c)/(1.+.35*c);
 return pow(sat(c*1.1),vec3(.4545));
}
