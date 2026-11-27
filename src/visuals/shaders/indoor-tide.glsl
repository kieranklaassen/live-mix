// name: Indoor tide
// a: Dining room
// b: Stair falls
// what: A pale house in morning light whose ground floor is the sea: clear water lies ankle deep on the boards of a dining room, a set table and three chairs stand in it, and the double door gives on the horizon; or a calm river comes down a white stair as falling sheets, past a banister and a coat on its peg, into a pool on tiles.
// follows: Drone colours the sea, drone and pad lift the water, pad brightens the net of light on the walls, texture tints the clouds, phrase, keys and a voice light the lamp, low raises the waves, the bands are the falls on the steps, and the piece lies as light under the water. A hit drops a ring on the water; a cue sends one long wave through the house.
// own: 0 evening at -1, night with the lamp lit at 1, morning between; 1 the ebb, a wet floor at -1, a flood over the chair seats or the third step at 1; 2 a still mirror at -1, lively turquoise water at 1; 3 rose plaster at -1, deep green paint at 1; 4 seen from high up at -1, from close above the water at 1; 5 in the dining room sand at -1 and tiles at 1, on the stair dark wood with a floor of boards at -1, a red runner and red tiles at 1; 6 the furniture gone and birch trunks standing in the water at -1, a far larger house with door after door and lamp after lamp at 1 (the stair: a grand hall); 7 no roof and broken walls at -1, open arches on to the sea at 1
#define ITG max(uOwn[6],0.)
#define ITB max(-uOwn[6],0.)
#define ITA max(uOwn[7],0.)
#define ITO max(-uOwn[7],0.)
#define itDh (2.38 + .9*ITG)
#define itWin mix(vec4(-.7,3.2,.66,1.05),vec4(-2.1,4.9,1.3,2.1),ITG)
bool itB;
float itNight,itH,itLive; // night, height of the water, how lively it is
vec3 itSun,itSunC,itDay,itWall,itHor,itZen,itSea,itLo,itHi,itFrom,itGlobe;
float itT; float itUpSun; vec3 itN; int itId; // what a ray meets: how far, its face, what it is
const float itD0=-.8,itD1=2.1; // the double door in the left wall
const float itZ=.5,itRun=.27,itRi=1./.27,itRise=.175,itSl=.175/.27,itE=.6,itTop=1.575,itZt=2.66; // the stair
vec2 itRing;
const vec3 itPaint=vec3(.82,.8,.76);
#define itUp(a,b,x) itRamp(((x) - (a))*(1./((b) - (a))))
float itRamp(float x) { x=sat(x); return x*x*(3. - 2.*x); }
// Falling away from 1, as exp(-x) does.
float itAw(float x) { x=sat(1. - .22*x); x *= x; return x*x; }
float itP(float x) { x *= x; return x*x; }
// A slow wave between -1 and 1.
float itTri(float x) { x=abs(fract(x) - .5)*2.; return x*x*(6. - 4.*x) - 1.; }
// A lean noise.
float itNoise(vec2 p) {
 vec2 i=floor(p),f=p - i; f=f*f*(3. - 2.*f);
 vec4 n=fract((i.x + i.y*57. + vec4(0.,1.,57.,58.))*.1031);
 n *= n + 33.33; n *= n + n; n=fract(n);
 n.xy=mix(n.xy,n.zw,f.y);
 return mix(n.x,n.y,f.x);
}
float itRy,itPx; // one over twice the size of a pixel where we look
float itIn(float d) { return sat(d*itPx + .5); }
void itSet() {
 itB=uVar > .5; itRy=1./uRes.y;
 float o=uOwn[0],h=abs(o); bool ev=o < 0.; itNight=max(o,0.);
 itH=(itB ? .13 : .17) + .045*(uDrone + uPad) + .008*itTri(uTime*.05);
 itH+=uOwn[1] > 0. ? uOwn[1]*.42 : uOwn[1]*.12;
 itLive=1. + .5*uOwn[2]; itLive *= itLive;
 itSun=itB ? normalize(vec3(-.5,.52,-.8)) : normalize(vec3(-.75,.32,-.44));
 itSunC=mix(vec3(4.3,3.5,2.4),ev ? vec3(3.5,1.45,.5) : vec3(.2,.3,.5),h)*mix(vec3(1.06,1.,.88),vec3(.94,1.,1.12),uTone);
 itDay=mix(vec3(.6,.71,.8),ev ? vec3(.7,.47,.45) : vec3(.05,.078,.13),h);
 itHor=mix(vec3(.9,.96,.95),ev ? vec3(1.6,.72,.34) : vec3(.06,.1,.17),h);
 itZen=mix(vec3(.12,.36,.68),ev ? vec3(.3,.28,.5) : vec3(.008,.016,.045),h);
 itSea=mix(vec3(.02,.17,.27),ev ? vec3(.16,.15,.22) : vec3(.006,.02,.04),h);
 itSea=mix(itSea,uKind[0]*dot(itSea,vec3(1.2)),.75*uDrone);
 float w=uOwn[3];
 itWall=mix(vec3(.82,.8,.75),w > 0. ? vec3(.13,.25,.23) : vec3(.82,.5,.42),abs(w));
 itLo=itB ? mix(vec3(-1.9,0.,-6.),vec3(-4.6,0.,-9.),ITG) : vec3(-2.8,0.,-4.6);
 itHi=itB ? mix(vec3(3.9,5.2,4.),vec3(7.,8.8,4.),ITG) : mix(vec3(3.3,2.9,3.2),vec3(4.2,4.4,17.5),ITG);
 itFrom=itB ? vec3(itWin.xy,4.1) : vec3(-2.9,1.35,.7);
 itGlobe=itB ? vec3(1.75,3.1,1.5) : vec3(.95,2.02,.75);
 if (uOwn[6] > 0.) itGlobe.y+=(itB ? 1.6 : .8)*ITG;
 if (uOwn[7] < 0.) itGlobe=mix(itGlobe,itB ? vec3(1.1,itH + .11,-.4) : vec3(-.95,itH + .11 - 3.*ITB,.1),sat(3.*ITO));
 itRing=itB ? vec2(1.35,-.5 - 2.*ITG) : vec2(-.15,-.75);
}
vec3 itInv(vec3 d) { return 1./(d + (step(0.,d) - .5)*2e-5); }
// Door after door down a long house.
float itWrap(float z) {
 if (uOwn[6] > 0. && !itB) z-=3.7*clamp(floor((z - itD0 + .8)/3.7),0.,floor((itHi.z - 2.3)/3.7));
 return z;
}
float itRow(float z) { return uOwn[6] > 0. && !itB ? 3.7*clamp(floor((z - .75)/3.7 + .5),0.,3.) : 0.; }
// How high a broken wall still stands.
float itCut(vec3 q) { float u=q.x*.9 + q.z*1.1; return itHi.y*(1. - sat(2.*ITO - 1.)*(.12 + .62*itNoise(vec2(u,3.)) + .07*itNoise(vec2(floor(u*6.),9.)))); }
// An arch: less than nothing inside.
vec2 itArchAt(vec3 q) {
 float i=clamp(floor((q.x - 1.)/2.7),0.,1.)*(itB ? step(.2,uOwn[6]) : 0.);
 return itB ? vec2(q.x - 2.3 - 2.7*i,q.y - 1.1 - i) : vec2(mod(q.x + .7,1.9) - .95,q.y - 1.35 - 1.2*ITG);
}
float itArch(vec2 u) { return (u.y < 0. ? abs(u.x) : length(u)) - (itB ? .92 : .76)*ITA; }
// One box on a ray.
void itBox(vec3 o,vec3 iv,vec3 c,vec3 h,int id) {
 vec3 a=(c - o)*iv,k=abs(iv)*h,u=a - k,v=a + k;
 float t0=max(u.x,max(u.y,u.z)),t1=min(v.x,min(v.y,v.z));
 bool hit=t0 < t1 && t0 > .001 && t0 < itT;
 itT=hit ? t0 : itT; itId=hit ? id : itId; itN=hit ? -sign(iv)*vec3(t0==u.x,t0==u.y,t0==u.z) : itN;
}
bool itNear(vec3 o,vec3 iv,vec3 c,vec3 h) {
 vec3 a=(c - o)*iv,k=abs(iv)*h,u=a - k,v=a + k;
 float t0=max(u.x,max(u.y,u.z)),t1=min(v.x,min(v.y,v.z));
 return t0 < t1 && t1 > 0. && t0 < itT;
}
// A ball, or one drawn tall.
void itBall(vec3 ro,vec3 rd,vec3 c,vec2 r,int id) {
 vec3 k=1./r.xyx,o=(ro - c)*k,d=rd*k;
 float a=dot(d,d),b=dot(o,d),g=b*b - a*(dot(o,o) - 1.);
 float t=(-b - sqrt(max(g,0.)))/a;
 bool hit=g > 0. && t > .001 && t < itT;
 itT=hit ? t : itT; itId=hit ? id : itId; itN=hit ? normalize((o + d*t)*k) : itN;
}
const vec2 itTrA[7]=vec2[7](vec2(-1.75,.5),vec2(-.35,2.1),vec2(1.2,.5),vec2(2.5,1.7),vec2(.3,-1.35),vec2(1.75,2.6),vec2(-1.5,2.7));
const vec2 itTrB[7]=vec2[7](vec2(-1.3,-1.5),vec2(2.75,.7),vec2(3.4,-.9),vec2(1.15,1.5),vec2(.1,-2.3),vec2(3.1,2.1),vec2(-.3,.05));
const vec3 itTab=vec3(.95,.65,.7);
float itStepH(float x) { return itRise*(floor(x*itRi) + 1.); }
// 1 a wall, 2 the sky, 3 the table, 4 its legs, 5 chairs, 6 the lamp, 8 the depth of the wall, 9 a vase, 11 the steps, 13 the side of the upper flight
void itTrace(vec3 ro,vec3 rd) {
 vec3 sg=step(0.,rd),m=(mix(itLo,itHi,sg) - ro)*itInv(rd);
 itT=min(m.x,min(m.y,m.z)); itId=1;
 itN=itT==m.z ? vec3(0.,0.,1. - 2.*sg.z) : itT==m.x ? vec3(1. - 2.*sg.x,0.,0.) : vec3(0.,1. - 2.*sg.y,0.);
 vec3 q=ro + rd*itT;
 // the window and the side of the upper flight, or the door and the depth of its wall
 vec2 w=abs(q.xy - itWin.xy) - itWin.zw;
 float t=(itZt - ro.z)/max(rd.z,1e-5); vec3 a=ro + rd*t; float qz=itWrap(q.z);
 bool side=itB && rd.z > 0. && t > 0. && t < itT && a.x > itE && a.y < itTop + itStepH(a.x - itE) + .04;
 bool door=!itB && itN.x > .5 && qz > itD0 && qz < itD1 && q.y < itDh;
 float s=.22/max(-rd.x,1e-3),tz=((rd.z > 0. ? itD1 : itD0) - qz)/(rd.z + (sg.z - .5)*2e-3),ty=rd.y > 0. ? (itDh - q.y)/max(rd.y,1e-3) : 9.,tj=min(tz,ty);
 bool jamb=door && tj < s;
 itId=side ? 13 : jamb ? 8 : door || itB && itN.z < -.5 && max(w.x,w.y) < 0. ? 2 : 1;
 itT=side ? t : jamb ? itT + tj : itT;
 itN=side ? vec3(0.,0.,-1.) : jamb ? tz < ty ? vec3(0.,0.,-sign(rd.z)) : vec3(0.,-1.,0.) : itN;
 if (uOwn[7] < 0. && itId != 13 && (itN.y < -.5 && itId==1 ? length(q.xz - vec2(.3,1.)) < 48.*ITO*ITO*(.8 + .4*itNoise(q.xz*2.)) : q.y > itCut(q))) { itId=2; itT=60.; }
 if (uOwn[7] > 0. && (itB ? side : itId==1 && itN.z < -.5)) {
  vec3 at=ro + rd*itT,b=at + rd*(.24/max(rd.z,.05)); vec2 u=itArchAt(at),w2=u + (b - at).xy;
  if (itArch(u) < 0. && u.y > -9.) {
   bool in2=itArch(w2) < 0.;
   itId=in2 ? 2 : 8; itN=in2 ? itN : normalize(vec3(-w2.x,-max(w2.y,0.),-.3)); itT=in2 ? 60. : itT + .1;
  }
 }
 // what stands in the house: the table and three chairs; or the stair
 int n=itB ? 1 : uOwn[6] < -.9 ? 0 : 4,g0=itB || itNear(ro,itInv(rd),vec3(.85,.55,.34),vec3(1.75,.56,1.12)) ? 0 : 3;
 for (int g=g0; g < n; g++) {
  // a chair: its place, sine and cosine of its turn
  bool ch=g > 0;
  vec4 k=!ch ? vec4(0.,0.,0.,1.) : g==1 ? vec4(-.52,.62,-.9927,.1205) : g==2 ? vec4(.62,-.42,.2182,.9759) : vec4(2.2,.1,.8085,-.5885);
  mat2 R=mat2(k.w,k.z,-k.z,k.w);
  vec3 o=ro,d=rd; o.xz=R*(o.xz - k.xy); d.xz=R*d.xz;
  vec3 iv=itInv(d); float was=itT;
  // the few steps that the ray can meet
  float h0=ro.y - itSl*(ro.z - itZ),b=rd.y - itSl*rd.z,ts=(itE - ro.x)*iv.x; b=1./(b + (step(0.,b) - .5)*1e-3);
  vec3 z=ro.z - itZ + rd.z*clamp(vec3((itRise - h0)*b,-h0*b,ts),0.,50.);
  z.z=ts < 0. || ro.y + rd.y*ts > itSl*z.z + itRise ? z.x : z.z;
  z=clamp(floor(z*itRi),0.,8.);
  int all=ch ? 7 : 5,num=itB ? int(max(z.x,max(z.y,z.z))) + 1 : all;
  int j0=itB ? int(min(z.x,min(z.y,z.z))) : itNear(o,iv,ch ? vec3(0.,.48,0.) : vec3(itTab.x,.39,itTab.z),ch ? vec3(.22,.49,.24) : vec3(.95,.39,.53)) ? 0 : all - 1;
  for (int j=j0; j < num; j++) {
   float f=float(j),sx=(j & 1)==0 ? 1. : -1.,y=(f + 1.)*itRise*.5,zj=itZ + f*itRun;
   bool first=j==0,rail=j > 4,fore=j < 3;
   vec3 c=itB ? vec3(.5*(itLo.x + itE),y,.5*(zj + 4.)) : ch ? first ? vec3(0.,.455,0.) : rail ? vec3(0.,.775 + .105*sx,-.2) : vec3(.185*sx,fore ? .48 : .22,fore ? -.2 : .185) : first ? itTab : itTab + vec3(.82*sx,-.38,fore ? -.41 : .41);
   vec3 h=itB ? vec3(.5*(itE - itLo.x),y,.5*(4. - zj)) : ch ? first ? vec3(.21,.018,.21) : rail ? vec3(.18,.04,.01) : vec3(.018,c.y,.018) : first ? vec3(.95,.13,.53) : vec3(.035,.27,.035);
   if (uOwn[6] < 0. && !itB) c.y-=1.4*ITB;
   itBox(o,iv,c,h,itB ? 11 : ch ? 5 : first ? 3 : 4);
  }
  itN.xz=itT < was ? itN.xz*R : itN.xz;
 }
 // the lamp, or the vase lower down
 float bt=(itGlobe.z - ro.z)/(rd.z + (sg.z - .5)*1e-3); bool lo=!itB && ro.y + rd.y*bt < 1.45 && uOwn[7] > -.1;
 itBall(ro,rd,lo ? vec3(1.05,.97 - 1.4*ITB,.75) : itGlobe,lo ? vec2(.085,.19) : vec2(.19),lo ? 9 : 6);
 if (uOwn[6] > 0. && !itB) for (int i=1; i < 4; i++) itBall(ro,rd,itGlobe + vec3(0.,0.,3.7*float(i)),vec2(.19),6);
 if (uOwn[6] < 0.) for (int i=0; i < 7; i++) {
  float f=float(i),r=(.075 + .05*fract(f*.618))*ITB; vec2 P=itB ? itTrB[i] : itTrA[i],L=.05*vec2(sin(f*2.3),cos(f*3.1)),o2=ro.xz - P - L*ro.y,d2=rd.xz - L*rd.y;
  float a=dot(d2,d2) + 1e-5,b=dot(o2,d2),g=b*b - a*(dot(o2,o2) - r*r),t=(-b - sqrt(max(g,0.)))/a;
  if (g > 0. && t > .001 && t < itT) { itT=t; itId=14; vec2 m2=(o2 + d2*t)/r; itN=normalize(vec3(m2.x,.05,m2.y)); }
 }
}
// How much of a place the balusters and the rail take up.
float itBan(vec2 q) {
 float base=itRise*(floor((q.x - itZ)*itRi) + 1.),slope=(q.x - itZ)*itSl,rail=1.06 + slope;
 float k=itIn(.03 - abs(q.y - rail))*itIn(q.x - itZ + .06)*itIn(itZt + .04 - q.x);
 float f=abs(fract((q.x - itZ)*itRi*2. - .5) - .5)*itRun*.5;
 k=max(k,itIn(.013 - f)*step(base - .01,q.y)*step(q.y,rail)*step(itZ,q.x)*step(q.x,itZt));
 return max(k,itIn(.048 - abs(q.x - itZ + .02))*step(q.y,1.24)*step(0.,q.y));
}
// The slope of the water, and a noise for its foam.
vec2 itBend; float itCue; // where the crest of the cue is
vec3 itSlope(vec2 x,float far) {
 if (itB) x=x.yx*vec2(-1.,1.);
 float A=(.02 + .05*uLow)*itLive*(itB ? .6 : 1.);
 vec2 g=A*(vec2(.92,.38)*itTri(.41*x.x + .18*x.y - uTime*.14)
  + .6*vec2(.94,-.34)*itTri(.73*x.x - .27*x.y - uTime*.21));
 itBend=itB ? vec2(g.y,-g.x) : g;
 vec2 u=x*vec2(5.,itB ? 1.6 : 4.) - vec2(uTime*.5,0.);
 float n=itNoise(u),n2=itNoise(u*2.7 + 9. - vec2(uTime*.5,uTime*.3));
 g+=itAw(far*.14)*itLive*(.1 + .12*uLow)*(itB ? .5 : 1.)*(vec2(n + n2,n2 - n)*.8 - vec2(.8,0.));
 // one long wave of the cue goes through the house
 itCue=itB ? x.x + 1.5 - 5.*(1. - uCue) : x.x*.75 + x.y*.55 + 2.7 - 5.5*(1. - uCue);
 g+=vec2(.8,.6)*-itCue*2.4*itAw(itCue*itCue*5.)*uCue*(1. - uCue)*.9;
 return vec3(itB ? vec2(g.y,-g.x) : g,n*.6 + n2*.4);
}
// How much of the sun comes in: by the door, or on the stair by a tall window behind us.
float itSunIn(vec3 q) {
 // a is how far inside on four sides
 vec4 a; float s=(q.x - itLo.x)/-itSun.x,b=1./(.012 + .02*s),z=itWrap(q.z + itSun.z*s);
 vec2 u=vec2(q.x - .625*q.z + 1.15,q.y + .65*q.z - 2.15);
 a=itB ? 16.*vec4(vec2(.95,1.) - abs(u),abs(u.x) - .035,abs(abs(u.y) - .33) - .03) : b*vec4(1.,itDh - q.y - itSun.y*s,z - itD0,itD1 - z);
 a=clamp(a + .5,0.,1.);
 // the sea outside throws the sun up as a mirror does
 float y=q.y - itSun.y*s;
 itUpSun=sat((y - itH)*b)*sat((itDh - y)*b)*a.z*a.w;
 float l=a.x*a.y*a.z*a.w;
 if (uOwn[7] < 0.) { s=min(s,(q.z - itLo.z)/-itSun.z); vec3 k=q + itSun*s; l=max(l,sat(1.4*ITO - .4)*.5*itRamp((k.y - itCut(k))*3.)); }
 return l;
}
vec3 itShade(vec3 ro,vec3 rd,bool full,vec2 bend) {
 vec3 q=ro + rd*itT,n=itN,m=vec3(itSun.x,-itSun.y,itSun.z),alb;
 float px=itT*itRy,ao,qz=itWrap(q.z),step9=min(floor((q.z - itZ + .01)*itRi),8.);
 int id=itId;
 itPx=.6/px;
 if (q.y < itH) q.xz+=bend*(itH - q.y);
 bool flo=id==1 && n.y > .5,steps=id==11 && n.x < .5,tread=steps && n.y > .5;
 // two noises, each matter's own; on walls and floor they make the net of light that water throws
 bool under=q.y < itH;
 float tt=uTime*.16;
 vec2 u1=under ? q.xz*2.4 : n.y < -.5 ? q.xz*vec2(1.5,2.2) : vec2(q.x*1.8 + q.z,q.y*2.),w=.8*vec2(itTri(u1.y*.175 + tt*.27),itTri(u1.x*.2 - tt*.2)),u2=u1*1.13 - w + vec2(17.,tt*.7);
 u1+=w + vec2(tt*.6,0.);
 float sy=tread ? q.z - itZ - step9*itRun : q.y - itRise*step9;
 u1=tread ? vec2(sy*9. + uTime*.9,q.x*5.6 + step9*3.) : steps ? vec2(sy*2.5 + uTime*1.1,q.x*16. + step9*3.7) : id==2 ? rd.xz/(max(rd.y,0.) + .1)*vec2(.9,.6) + uTime*.01 : u1;
 u2=tread ? u1 + vec2(.35,.2) : steps ? vec2(sy*4. + uTime*1.9,q.x*47. + sy*9.) : id==2 ? u1*2.7 + 5. : u2;
 float n1=itNoise(u1),n2=itNoise(u2),na=n1 - n2,net=itAw(abs(na)*15.) + .6*itAw(abs(n1 + n2 - 1.)*15.);
 net=steps ? .5 : net;
 vec3 kk=max(1. - .8*min(q - itLo,itHi - q),0.); kk=1. - .4*kk*kk*kk;
 vec3 sk=mix(mix(itHor,itZen,itUp(0.,.55,max(rd.y,0.))),mix(itHor*1.15 + .12*itSunC,uKind[2]*dot(itHor,vec3(.9)),.55*uTexture),itUp(.5,.78,n1*.68 + n2*.32)*(.5 + .3*uTexture));
 vec2 wb=abs(fract((q.xy - itWin.xy)*vec2(1.515,1.4286) + vec2(0.,.5)) - .5)*.66;
 if (uOwn[7] >= 0. || q.z < 4.2) sk=mix(sk,itPaint*itDay*.8,itB && (uOwn[7]==0. || q.z < 4.2 && q.y > itWin.y - itWin.w) ? itIn(.018 - min(wb.x,wb.y)) : 0.);
 if (uOwn[7] < 0. && id==2) {
  vec3 g=rd*70.; vec3 gi=floor(g); float h=hash31(gi),dm=length(rd - normalize(itB ? vec3(-.347,.246,.905) : vec3(-.12,.36,.93)));
  sk+=itNight*step(.965,h)*itUp(.4,.05,length(g - gi - .5))*vec3(.8,.9,1.)*(.3 + .7*fract(h*91.))*sat(rd.y*8.);
  sk=mix(sk,mix(itHor*1.9,vec3(1.,1.05,1.1),itNight)*(.75 + .35*itNoise(rd.xy*70.)),itUp(.066,.061,dm)*sat(2.*ITO)) + (itHor*.5 + .05)*itAw(dm*5.)*ITO*.6;
 }
 alb=id==4 ? vec3(.5,.38,.26) : id==5 ? vec3(.34,.2,.1) : id==9 ? mix(vec3(.05,.14,.28),uKind[3]*.5,.4*uPhrase) : itPaint;
 ao=id==8 ? .55 : 1.;
 if (flo) {
  // boards under the water, sand or tiles
  float f=abs(fract(q.z*6.4516) - .5)*.155,r=fract(floor(q.z*6.4516)*.618),e=fract(q.x*.4 + r*7.3); e=min(e,1. - e)*2.5;
  alb=mix(vec3(.5,.37,.24),vec3(.66,.52,.36),r)*(.93 + .07*itTri(q.z*41. + .4*itTri(q.x*.7)));
  alb *= 1. - .55*max(itIn(f - .0742),itIn(.0032 - e));
  vec2 k=abs(fract(q.xz*1.19) - .5) - .25; k=clamp(k*1.4*itPx,-1.,1.);
  float o=uOwn[5];
  alb=mix(alb,mix(mix(vec3(.07,.1,.12),vec3(.36,.08,.04),itB ? max(o,0.) : 0.),vec3(.8,.78,.72),.5 + .5*k.x*k.y),itB ? 1. - max(-o,0.) : max(o,0.));
  if (!itB) { alb=mix(alb,vec3(.8,.69,.5)*(.93 + .07*itTri(q.x*4. + .5*itTri(q.z*.7))),max(-o,0.)); vec2 t=abs(q.xz - itTab.xz) - vec2(.9,.48); ao=1. - .5*itAw(max(t.x,t.y)*5.); }
  ao *= kk.x*kk.z;
 }
 if (id==1 && !flo) {
  ao=abs(n.x) > .5 ? kk.y*kk.z : abs(n.y) > .5 ? kk.x*kk.z : kk.x*kk.y;
  alb=mix(vec3(.84,.83,.8),itWall,.2);
  if (n.y > -.5) {
   alb=itWall;
   float sk=q.y - .2,fr=1.;
   vec4 fm=itB ? vec4(itWin.xy,itWin.zw) : vec4(.5*(itD0 + itD1),0.,.5*(itD1 - itD0),itDh);
   vec2 dd=abs((itB ? q.xy : vec2(qz,q.y)) - fm.xy) - fm.zw;
   if ((itB ? -n.z : n.x) > .5) fr=max(dd.x,dd.y);
   vec2 lf=abs(dd - vec2(.63,-itDh*.5)) - vec2(.62,itDh*.5 - .03);
   float leaf=n.x > .5 && !itB ? max(lf.x,lf.y) : 9.;
   ao *= 1. - .3*itAw(max(leaf,0.)*14.);
   ao *= 1. - .35*itAw(abs(leaf + .16)*70.);
   alb=mix(alb,itPaint,max(max(itIn(-sk),itIn(-leaf)),itIn(.11 - fr)));
   ao *= 1. - .35*itAw(abs(sk)*60.) - .25*itAw(abs(fr - .11)*50.)*step(0.,leaf);
   if (uOwn[7] > 0. && n.z < -.5 && !itB) { float ar=itArch(itArchAt(q)); alb=mix(alb,itPaint,itIn(.1 - ar)); ao *= 1. - .3*itAw(abs(ar - .1)*40.); }
   if (n.z < -.5 && !itB && uOwn[7]==0.) {
    // a small picture on the far wall
    vec2 pq=q.xy - vec2(1.75,1.72),pd=abs(pq) - vec2(.42,.31);
    float f=max(pd.x,pd.y);
    ao *= 1. - .3*itAw(f*25.)*step(0.,f);
      alb=mix(alb,f > -.035 ? vec3(.34,.24,.15) : f > -.1 ? vec3(.78,.75,.66) : pq.y > -.03 ? vec3(.3,.4,.43) + pq.y : vec3(.1,.2,.24),itIn(-f));
   }
  }
 }
 if (id==3) {
  // the cloth hangs in folds, and four plates stand on it
  vec2 l=q.xz - itTab.xz; float pr=length(vec2(abs(l.x) - .5,l.y + .27)),cy=q.y - itTab.y,up=step(.5,n.y);
  alb=vec3(.88,.87,.84)*mix(1. - (.1 + .12*itTri(l.x*3.7 + l.y*4.3 + .3*itTri(l.x*1.1)))*itUp(.1,-.1,cy),1. - .3*itAw(abs(pr - .13)*50.),up);
  alb=mix(alb,mix(vec3(.3,.42,.55),uKind[3]*.6,.4*up),itIn(.007 - abs(mix(cy + .1,pr - .115,up)))*.85);
 }
 if (uOwn[6] < 0. && id==14) { float bk=itNoise(vec2(n.x*2. + q.x*.5,q.y*21.))*.65 + .35*itNoise(vec2(n.x*7.,q.y*47.)),bw=itNoise(vec2(n.z*1.5 + q.z,q.y*2.3)); alb=mix(vec3(.84,.82,.77)*(.9 + .2*bk),vec3(.09,.08,.08),itUp(.62,.74,bk + .35*bw - .2)); alb=mix(alb,vec3(.16,.15,.12),itUp(.9,.2,q.y - itH)*.6); ao=.55 + .45*itUp(1.,-.6,n.x); }
 // the stair and its falls: a film sliding over each tread, a sheet coming down each riser
 vec3 wr=vec3(rd.x + (n1 - n2)*.5,abs(rd.y),rd.z + (n2 - n1)*.4);
 vec2 wh=abs(q.xy + wr.xy*(4. - q.z)/max(wr.z,.05) - itWin.xy) - itWin.zw;
 float wet=!steps ? 0. : tread ? .06 + .94*itP(1. - abs(rd.y)) : .1,be=itRun - sy;
 vec3 wetC=tread ? mix(itDay*itWall*.6,itHor*1.5,itUp(-.25,.25,-max(wh.x,wh.y))) : itHor;
 if (steps) {
  float lv=sat((step9 < 2.5 ? uBands[1] : step9 < 4.5 ? uBands[4] : step9 < 6.5 ? uBands[8] : uBands[12])*(.6 + .8*uEnergy)),fs=n1*.75 + n2*.25,o5=uOwn[5];
  float foam=tread ? (step9 > 7.5 ? 0. : itUp(.13,0.,be)*itUp(.3,.75,n1 + .3*lv)) + .6*itUp(.03,0.,sy) : itUp(.022,.005,itRise - sy) + itUp(.07,0.,sy)*(.3 + fs) + itUp(.4,1.25,fs + .3*lv)*(.35 + .6*lv);
  alb=mix(itPaint,o5 < 0. ? vec3(.2,.12,.07) : vec3(.42,.06,.06),o5 < 0. ? -o5 : o5*itIn(.8 - abs(q.x - .5*(itLo.x + itE))));
  alb *= tread ? vec3(.72,.92,.93) : mix(vec3(.56,.81,.84),vec3(.82,.96,.96),itUp(.15,.85,fs));
  alb=mix(alb,mix(vec3(.94,.97,.96),uKind[2]*1.1,.4*lv),sat(foam*(1. + .6*uOwn[1]))*.9);
  ao=kk.x*(tread ? 1. - .2*itUp(.1,0.,be) : 1.);
 }
 if (id==13 || id==11 && !steps) {
  float u=id==11 ? q.z - itZ : q.x - itE,v=id==11 ? q.y : q.y - itTop,top=itStepH(u) - v,skew=u*itSl - .12 - v;
  alb=mix(itPaint*.93,itWall,itIn(skew));
  ao=1. - .3*itAw(abs(skew)*50.);
  if (id==13) {
   // water over the edge of the upper flight
   float fl=itUp(.12,0.,fract(u*itRi));
   alb=mix(alb,mix(vec3(.58,.84,.86),vec3(.95),fl),itIn(.04 + .05*fl - top));
   // pegs and a coat
   vec2 c=q.xy - vec2(2.05,1.68 + 9.*step(.05,uOwn[7])),k=c + vec2(.05,0.);
   alb=mix(alb,vec3(.34,.22,.13),itIn(.045 - abs(c.y))*itIn(.62 - abs(c.x - .1)));
   float wd=.03 + .17*itUp(0.,-.2,k.y) + .09*itUp(-.2,-1.1,k.y);
   float fold=itTri(k.x*4.1 + .3*k.y*k.y);
   float co=min(wd - abs(k.x),min(.01 - k.y,k.y + 1.05 + .03*fold));
   alb *= 1. - .3*itAw(max(-co,0.)*22.)*step(k.y,0.)*step(-1.1,k.y);
   alb=mix(alb,vec3(.1,.13,.17)*(.9 + .4*fold),itIn(co));
  }
 }
 // daylight
 vec3 v=itFrom - q; if (uOwn[6] > 0.) v.z+=itRow(q.z); float d2=dot(v,v),e=max(dot(n,v)*inversesqrt(d2)*.74 + .26,0.);
 vec3 c=itDay*(.15 + .09*n.y*n.y + (itB ? 6. : 4.5)*e/(1. + .34*d2) + (itB ? .4 : 0.)*max(-n.z,0.)) + itSunC*.085*(1. + .3*n.x);
 if (uOwn[7] != 0.) c+=itDay*(ITO*(.35 + .4*n.y) + ITA*.3*max(n.y*.5 + .6 - n.z*.2,0.));
 if (uOwn[6] > 0. && itB) c+=itDay*.5*ITG*(.5 + e);
 // the net of light: under the water, and what the water throws up
 float s1=0.,s=itSunIn(q)*(id != 8 ? max(dot(n,itSun),0.) : 0.);
 if (!under) s1=itB ? .28*itAw(.6*(q.y - itH)) : itUpSun*max(.6 + .5*dot(n,m),0.)*step(-.1,dot(n,m));
 if (itB) { float a=(q.x - itE)*1.06; if (a > .001) s *= 1. - .85*itBan(vec2(q.z - .8*a*1.887,q.y + .52*a*1.887)); }
 if (under) { s *= .4 + .95*net; c *= .84 + .24*net; }
 c+=itSunC*s + (itSunC*.15 + uKind[1]*1.5*uPad*(.4 + uEnergy))*s1*net;
 // the lamp
 vec3 lv=itGlobe - q; if (uOwn[6] > 0.) lv.z+=itRow(q.z); float l2=dot(lv,lv);
 if (id != 6) c+=mix(vec3(1.5,.85,.38),uKind[3]*1.5,.5*uPhrase)*(1.3*itNight + .35*uPhrase*uEnergy)*max(dot(n,lv)*inversesqrt(l2) + .15,0.)/(.3 + l2);
 c *= ao;
 // the piece lies as light under the water
 if (under && full) c+=piece(vec2((q.x - itLo.x)/(itHi.x - itLo.x),(2. - q.z)/5.)).rgb*(.6 + 1.4*uEnergy)*(.25 + .55*net);
 vec3 own=id==6 ? (.55 + .45*n.y*n.y)*mix(vec3(1.5,.95,.45),uKind[3]*1.5,.55*uPhrase)*(1.5*itNight + .5*(uPhrase + .6*uKeys + .6*uMic)*(.5 + uEnergy)) : vec3(0.);
 return id==2 ? sk : mix(alb*c + own,wetC,wet);
}
vec3 render(vec2 p) {
 itSet();
 float tall=sat((1.2 - uRes.x/uRes.y)*1.5);
 p.x-=(itB ? .1 : .06)*tall;
 float sh=itB ? .08 : .04,foc=(itB ? 1.3 : .95) - (itB ? .3 : .42)*tall,eye=max((itB ? 1.65 : 1.45) - .75*uOwn[4]*(uOwn[4] > 0. ? .7 : 1.),itH + .35);
 vec3 ro=itB ? vec3(1.7,eye,-4.4 - 1.9*ITG) : vec3(1.,eye,-3.3),rd=normalize(vec3(p.x,p.y - sh,foc));
 vec2 cs=itB ? vec2(.9928,.1197) : vec2(.9597,.2812);
 rd.xz=vec2(cs.x*rd.x - cs.y*rd.z,cs.y*rd.x + cs.x*rd.z);
 float tw=rd.y < 0. ? (ro.y - itH)/-rd.y : 1e5;
 vec3 w=ro + rd*tw,o=ro,d=rd,rf=rd,base=vec3(0.);
 vec3 c=vec3(0.),g=itSlope(w.xz,min(tw,99.));
 bool wat=false,outs=false;
 float fr=1.,near=0.,ink=max(-uOwn[2],0.),milk=max(uOwn[2],0.);
 // what is seen: one thing, or what lies under the water and what it mirrors
 for (int k=0; k < (wat && !outs ? 2 : 1); k++) {
  itTrace(o,d);
  float dep=itT,foam=0.;
  bool one=k==0;
  near=one ? itT : near;
  wat=one ? tw < 300. && (tw < itT || itId==2 && (!itB || uOwn[7] > 0.)) : wat; outs=one ? wat && (w.x < itLo.x - .2 || uOwn[7] > 0. && (itB ? w.z > itZt && itId==2 : w.z > itHi.z)) : outs;
  vec2 gg=outs ? g.xy/(1. + tw*.06) : g.xy;
  vec3 n=normalize(vec3(-gg.x,1.,-gg.y));
  float u=1. - sat(dot(n,-rd));
  rf=reflect(rd,n); rf.y=max(rf.y,.003); rf=normalize(rf);
  fr=wat ? min(.02 + .4*ink + .98*itP(u),outs ? .5 : 1.) : 1.;
  base=mix(itSea,mix(itSea*1.7,vec3(.06,.4,.4)*itDay,.7*milk)*(1. - .6*ink),itAw((tw - 5.)*.1));
  // foam where it meets the house
  float db=!itB ? min(itHi.z - w.z,itHi.x - w.x) : min(itHi.x - w.x,w.x < itE ? max(itZ - w.z,0.)*.5 : itZt - w.z);
  foam=itUp(1.,0.,db*6. - .5*itTri(uTime*.1 + w.x*.2) - uLow)*itUp(.35,.65,g.z + .35*itAw(db*20.))*.8;
  itId=outs ? 2 : itId; d=outs ? rf : d;
  vec3 x=itShade(o,d,k==0,wat ? itBend*3.2 : vec2(0.));
  dep -= tw;
  vec3 y=mix(x/(1. + dep*vec3(1.1,.16,.1)),mix(itSea*2.5,vec3(.12,.75,.7)*itDay,milk),1. - itAw(dep*(.12 + .5*milk))*(1. - .8*ink));
  y=mix(y,itDay*1.1 + itSunC*.12,foam);
  x=outs ? mix(base,x,fr) : wat && one ? itId==2 ? base : y : x;
  c+=x*(!wat || outs ? 1. : k==0 ? 1. - fr : fr);
  o=w; d=rf;
 }
 // the rail of the stair
 if (itB) {
  float t=(itE + .02 - ro.x)*itInv(rd).x; vec3 b=ro + rd*t; itPx=.6/(t*itRy);
  if (t > 0. && t < near + .05 && b.y > itH) c=mix(c,vec3(.36,.25,.17)*(itDay*.8 + itSunC*.14),itBan(b.zy));
 }
 // the ring of a hit
 vec2 r=w.xz - itRing; float q=length(r),k=(q - .22 - 1.2*(1. - uHits))*9.;
 if (wat && !outs) c+=mix(itDay,uKind[4],.5)*uHits*(itAw(k*k)*.9 + .35*itAw(q*q*3.)) + (itDay + itSunC*.1)*uCue*itAw(itCue*itCue*5.)*1.1;
 // what the lamp hangs on
 vec3 l=itGlobe - ro; float lz=dot(l.xz,vec2(-cs.y,cs.x))/foc,ly=ro.y + (p.y - sh)*lz;
 if (uOwn[7] > -.02) c=mix(c,c*.35,step(itGlobe.y + .15,ly)*step(ly,itHi.y)*sat(1.2 - abs(p.x - dot(l.xz,cs)/lz)*uRes.y));
 if (uOwn[6] > 0. && !itB) for (int i=1; i < 4; i++) {
  l=itGlobe + vec3(0.,0.,3.7*float(i)) - ro; lz=dot(l.xz,vec2(-cs.y,cs.x))/foc; ly=ro.y + (p.y - sh)*lz;
  c=mix(c,c*.5,step(itGlobe.y + .15,ly)*step(ly,itHi.y)*sat(1.2 - abs(p.x - dot(l.xz,cs)/lz)*uRes.y));
 }
 return screenOf(c);
}
