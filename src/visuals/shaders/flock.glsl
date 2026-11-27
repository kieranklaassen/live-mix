// name: Flock
// a: Evening birds
// b: Fireflies
// what: A great flock of small birds at dusk, thousands of dark points turning together as one folding cloud over low land and a few trees; or fireflies drifting over a dark meadow at night, a few near and soft, many far and small.
// follows: Each kind of sound gathers birds in its own part of the sky and warms the sky there in its colour; the fuller the mix the more birds and the tighter the cloud; the low band sends slow waves through it, the high band is the shimmer of wings; a hit or cue turns the whole flock at once, so a dark wave runs through it. At night each firefly belongs to one kind of sound and glows with it, and a hit runs a flash across the meadow.
// own: 0 1 many and tiny, -1 a few great ones; 1 a: 1 gulls on long bent wings, -1 slim fish; b: 1 paper lanterns, -1 flakes of fine rays; 2 a: 1 one great turning ring, -1 ordered skeins of geese; b: 1 hung along strings, -1 gathered in the crown of one great tree; 3 the ground: 1 open water that mirrors, -1 no ground at all, only depth with shafts of light; 4 1 a wood of firs, -1 bare peaks; 5 the hour: 1 day and -1 moonlight, sky, land and birds in the colours of the kinds, a sun or moon past 0.9; 6 the eye: 1 looks down on much ground, -1 up at the sky; 7 1 falling, everywhere, -1 rising (a: as a funnel)
#define flS smoothstep
float flUp,flFall;
vec3 flK0,flK1,flK2,flK3,flK4;
float flSq(float x) { return x*x; }
vec2 flCa,flCb,flCc,flCd;
vec2 flC0,flC1,flC2,flC3,flC4;
mat2 flM0,flM1,flM2,flM3,flM4;
float flW0,flW1,flW2,flW3,flW4;
vec3 flT0,flT1,flT2,flT3,flT4;
float flHit,flMany,flTwist,flSea,flVoid,flLit,flDay,flRing,flGrove,flFir,flPure;
vec3 flLand;
mat2 flSpin;
const vec2 flMid=vec2(.02,.1);
// The sky of a world's own hour, y above its horizon: high the drone's colour, low the pad's, a disc in the phrase's.
vec3 flAir(vec2 p,float y) {
  float day=step(0.,uOwn[5]);
  vec3 c=mix(flK1,flK0,flS(0.,.62,y))*mix(.3,2.4,day);
  vec2 m=p-mix(vec2(.27,.17),flMid,flRing*step(uVar,.5));
  float r=length(m);
  vec3 k=flK3;
  c+=k*(.5+.6*uPhrase)*exp(-r*7.)*mix(.35,.6,day);
  r*=1.-.4*flRing*step(uVar,.5);
  if (r<.13) c=mix(c,k*mix(1.9-.8*noise(m*22.+3.)*noise(m*9.),3.2,day),flS(.112,.108,r)*flS(.9,1.,flLit-flVoid));
  return c;
}
// Light from above, less of it below.
float flShaft(vec2 p) {
  float t=uTime,s=(p.x-.1)/max(1.-p.y,.1),ray=noise(vec2(s*5.+t*.04,t*.06))*noise(vec2(s*13.-t*.05,3.+t*.03));
  return mix(1.,(.3+.8*flS(-.65,.4,p.y))*(.75+1.4*ray*flS(-.5,.5,p.y)),flVoid);
}
// A ragged line of firs standing on base: n to a height of the picture, up to tall.
float flFirs(vec2 p,float base,float n,float tall,float px) {
  float gx=p.x*n,id=floor(gx),h=hash11(id+n),up=(p.y-base)/max(tall*(.45+.55*h),1e-3);
  if (up<-.2||up>1.) return step(up,0.);
  float ft=tall*(.45+.55*h),x=abs(fract(gx)-.5-.24*(hash11(id+7.)-.5))/n;
  float w=(1.-up)*.17*ft*(.62+.38*fract(-up*8.+h))*(.8+.4*noise(p*180.))+.008*ft;
  return max(flS(px,-px,x-w)*flS(1.,.97,up),flS(.02,-.02,up));
}
// How high the bare peaks stand there,0 to 1.
float flPeak(float x) {
  float s=0.,a=.58;
  for (int i=0; i<4; i++) { float f=floor(x); s+=a*mix(hash11(f+3.),hash11(f+4.),x-f); x=x*2.17+5.3; a*=.45; }
  return s;
}
vec3 flPeaks(vec2 p,float base,float tall,float fr,vec3 rock,vec3 air,out float there) {
  float h=flPeak(p.x*fr+1.7),y=(p.y-base)/max(tall,1e-3);
  float side=flPeak(p.x*fr+1.7+.1*(h-y)+.12*noise(p*16.))-flPeak(p.x*fr+1.82+.12*noise(p*16.));
  float lit=flS(-.12,.12,side),snow=flS(.1,.2,y-.42+.25*(noise(p*vec2(30.,18.))-.5));
  there=flS(.012,-.012,y-h);
  vec3 c=mix(rock*(.5+.7*lit),mix(rock,air,.75)*(.55+.75*lit),snow);
  return mix(air,c,.2+.7*flS(-.2,.7,y));
}
// A gull from the front: e in half spans; below 0 is inside.
float flGull(vec2 e,float flap) {
  float a=abs(e.x),d=max(abs(e.y-flap*a*(1.15-a)*1.5+.12)-.12*(1.-a)-.02,a-1.);
  return min(d,length(e*vec2(1.,1.7)+vec2(0.,.16))-.2);
}
// lean is the cosine and sine of the way this gathering lies; w holds four slow swings between -1 and 1:
// two move it, one rocks it a little about its lean (a small angle, so no trig is needed), one stretches it
void flLobe(vec2 home,vec2 lean,vec2 pa,vec2 pb,vec2 pc,vec2 pd,float size,out vec2 c,out mat2 m) {
  vec4 w=vec4(dot(flCa,pa),dot(flCb,pb),dot(flCc,pc),dot(flCd,pd));
  c=home*.85+vec2(.1,.05)*w.xy;
  float a=.5*w.z,cw=1.-.5*a*a,sw=a*(1.-a*a/6.);
  float ca=lean.x*cw-lean.y*sw,sa=lean.y*cw+lean.x*sw;
  m=mat2(1.,0.,0.,2.+.6*w.w)*mat2(ca,-sa,sa,ca)/size;
}
void flGather() {
  flUp=max(uOwn[6],0.); flFall=max(uOwn[7],0.);
  flK0=uKind[0]*uKind[0]; flK1=uKind[1]*uKind[1]; flK2=uKind[2]*uKind[2]; flK3=uKind[3]*uKind[3]; flK4=uKind[4]*uKind[4];
  flHit=sat(uHits+.6*uCue);
  flMany=exp2(uOwn[0]*(uOwn[0]>0.?.6:1.7)-1.1*abs(uOwn[1])*step(uVar,.5));
  flTwist=mod(uTime*.05*flRing,TAU);
  flSpin=rot(flTwist);
  flSea=max(uOwn[3],0.); flVoid=max(-uOwn[3],0.); flLit=abs(uOwn[5]); flDay=max(uOwn[5],0.);
  flRing=max(uOwn[2],0.); flGrove=max(-uOwn[2],0.); flFir=max(uOwn[4],0.);
  flPure=sat(abs(uOwn[1])+flLit+abs(uOwn[7]));
  flLand=flK2*(uOwn[5]>0.?.9:.22);
  float full=flS(.3,1.,uLevel);
  float size=mix(.3,.23,full);
  float gain=.75+.5*full;
  flW0=(.12+1.1*uDrone)*gain;
  flW1=(.12+1.1*uPad)*gain;
  flW2=(.12+1.1*uTexture)*gain;
  flW3=(.12+1.1*uPhrase)*gain;
  flW4=(.3+.5*full)*gain;
  flT0=flK0*(.34*uDrone);
  flT1=flK1*(.34*uPad);
  flT2=flK2*(.34*uTexture);
  flT3=flK3*(.34*uPhrase);
  flT4=flK4*(.34*flHit);
  if (uOwn[5]!=0.) flT4=flK3*flHit*.7;

  flCa=vec2(sin(uTime*.11),cos(uTime*.11)),flCb=vec2(sin(uTime*.09),cos(uTime*.09));
  flCc=vec2(sin(uTime*.07),cos(uTime*.07)),flCd=vec2(sin(uTime*.05),cos(uTime*.05));
  flLobe(vec2(-.5,0.),vec2(1.,0.),vec2(1.,0.),vec2(0.,1.),vec2(1.,0.),vec2(1.,0.),size,flC0,flM0);
  flLobe(vec2(-.05,.2),vec2(.6216,.7833),vec2(-.4161,.9093),vec2(-.9636,.2675),vec2(-.1288,.9917),vec2(.5403,.8415),size,flC1,flM1);
  flLobe(vec2(.5,.06),vec2(-.2272,.9738),vec2(-.6536,-.7568),vec2(-.5155,-.8569),vec2(-.9668,-.2555),vec2(-.4161,.9093),size,flC2,flM2);
  flLobe(vec2(.27,.3),vec2(-.9041,.4274),vec2(.9602,-.2794),vec2(.6878,-.7259),vec2(.3780,-.9258),vec2(-.9900,.1411),size,flC3,flM3);
  flLobe(vec2(-.32,.3),vec2(-.8968,-.4425),vec2(-.1455,.9894),vec2(.8835,.4685),vec2(.8694,.4941),vec2(-.6536,-.7568),size,flC4,flM4);
}
// How thick the flock is at a place: one cloud with a lobe for each kind of sound. warm is the light those kinds give the sky there.
float flBody(vec2 p,out vec3 warm) {
  vec2 q0=flM0*(p-flC0),q1=flM1*(p-flC1),q2=flM2*(p-flC2),q3=flM3*(p-flC3),q4=flM4*(p-flC4);
  float u0=1./(1.+.6*dot(q0,q0)),u1=1./(1.+.6*dot(q1,q1)),u2=1./(1.+.6*dot(q2,q2));
  float u3=1./(1.+.6*dot(q3,q3)),u4=1./(1.+.6*dot(q4,q4));
  warm=flT0*u0+flT1*u1+flT2*u2+flT3*u3+flT4*u4;
  vec2 qb=(p-vec2(0.,.15))*vec2(1.2,3.4);
  float d=flW0*u0*u0+flW1*u1*u1+flW2*u2*u2+flW3*u3*u3+flW4*u4*u4+.32/flSq(1.+.6*dot(qb,qb));
  d=max(d-.1,0.);
  if (uOwn[2]>0.) {
    vec2 q=(p-flMid)*vec2(1.,1.25);
    float r=length(q);
    vec2 e=q/max(r,1e-4);
    float k=flSq(.5+.5*e.x)*flW0+flSq(.5-.5*e.x)*flW1+flSq(.5+.5*e.y)*flW2+flSq(.5-.5*e.y)*flW3;
    d=mix(d,(.25+.55*k)*1.5*exp(-flSq((r-.31)/(.07+.03*e.x))),uOwn[2]);
  }
  if (uOwn[2]<0.) d*=flSq(1.+uOwn[2]);
  if (uOwn[7]>0.) d=mix(d,.42*(.6+.8*noise(p*4.+uTime*.03))+.15*d,uOwn[7]);
  if (uOwn[7]<0.) {
    float y=sat(p.y+.36),x=p.x-.05-.14*sin(y*4.+uTime*.1)*y;
    float k=mix(mix(flW0,flW1,sat(y*3.)),mix(flW2,flW3,sat(y*3.-1.6)),sat(y*2.-.4));
    d=mix(d,(.5+1.*k)*exp(-flSq(x/(.025+.2*y+.35*y*y)))*flS(0.,.1,p.y+.36),-uOwn[7]);
  }
  return d;
}
// The same with the darker sheets where the cloud folds over itself, and the slow waves of the low band.
float flDense(vec2 p,out vec3 warm) {
  float d=flBody(p,warm);
  float sheet=1.-abs(2.*noise(p*vec2(2.6,4.2)+vec2(uTime*.045,-uTime*.03))-1.);
  d*=.45+1.1*sheet*sheet;
  d*=1.+.6*uLow*sin(p.x*7.+p.y*4.-uTravel*1.3);
  return d;
}
vec3 flSkyAt(vec2 p,float horizon) {
  float y=max(p.y-horizon,0.);
  vec3 c=mix(vec3(.95,.4,.1),vec3(.5,.16,.22),flS(0.,.2,y));
  c=mix(c,vec3(.13,.08,.24),flS(.1,.42,y));
  c=mix(c,vec3(.015,.03,.11),flS(.3,.8,y));
  float sunD=length((p-vec2(-.38,horizon-.03))*vec2(.5,1.));
  c+=vec3(1.,.55,.2)*exp(-sunD*4.)*.75;
  if (uOwn[5]!=0.) c=mix(c,flAir(p,y),abs(uOwn[5]));
  return c;
}
// One tree against the sky: a trunk, two limbs and flat clumps of leaves with ragged edges and a little sky between them.
float flSeg(vec2 q,vec2 a,vec2 b) { vec2 pa=q-a,ba=b-a; return length(pa-ba*sat(dot(pa,ba)/dot(ba,ba))); }
float flTree(vec2 p,vec2 foot,float tall,float flip) {
  vec2 q=(p-foot)/tall;
  q.x*=flip;
  float soft=1.2/(uRes.y*tall);
  float wood=flSeg(q,vec2(0.,-.05),vec2(.03,.56))-.034+.03*q.y;
  wood=min(wood,flSeg(q,vec2(.02,.47),vec2(-.26,.72))-.013);
  wood=min(wood,flSeg(q,vec2(.03,.54),vec2(.3,.8))-.013);
  const vec2 e=vec2(1.,1.5);
  float d=length((q-vec2(-.28,.74))*e)-.2;
  d=min(d,length((q-vec2(.02,.92))*e)-.25);
  d=min(d,length((q-vec2(.3,.8))*e)-.2);
  d=min(d,length((q-vec2(-.06,.69))*e)-.11);
  d=min(d,length((q-vec2(.5,.67))*e)-.09);
  d+=.085*(noise(q*9.+tall*50.)-.5)+.045*(noise(q*27.)-.5);
  return max(flS(soft,-soft,wood),flS(soft,-soft,d));
}
// One layer of birds: a grid turned its own way, one bird to a cell, there only where the flock is thick enough.
vec3 flBirds(vec3 col,vec2 p,float fi,float n,vec2 cs,float D,float head,float turn,vec3 dark) {
  float t=uTime,near=fi/5.;
  vec2 drift=vec2(t*(.005+.003*fi),.0015*t*sin(fi*2.))+fi*7.3;
  vec2 at=p;
  if (uOwn[2]>0.) at=flSpin*(p-flMid);
  if (uOwn[7]!=0.) drift.y+=t*uOwn[7]*(.012+.004*fi);
  vec2 g=mat2(cs.x,-cs.y,cs.y,cs.x)*(at+drift)*n,id=floor(g),f=fract(g);
  vec2 h=hash22(id+fi*17.);
  float h3=fract(h.x*9.7+h.y*5.3);
  vec2 pos=.22+.56*h+.14*vec2(sin(t*(.5+.5*h.x)+h.y*40.),cos(t*(.45+.5*h.y)+h.x*40.));
  float vis=flS(0.,.12,D*1.5-.06-h3*(.75+.5*near+1.4*max(-uOwn[0],0.)));
  pos=mix(pos,.5+.35*(pos-.5),max(abs(uOwn[1]),-uOwn[0]));
  vec2 dq=rot(head+.6*(h.x-.5)-fi*.83-.4-flTwist)*(f-pos),along=dq;
  dq.x+=.9*abs(dq.y);
  float wing=.5+.5*sin(t*1.6+h3*TAU+p.x*5.)*(.25+.75*uHigh);
  float sx=.21*(.7+.6*h.y)*(1.+.35*turn),sy2=sx*(.3+.45*wing+1.3*turn);
  float d=length(dq/vec2(sx,sy2));
  float gull=max(max(uOwn[1],0.),-uOwn[0]*(1.+min(uOwn[1],0.)));
  if (gull>0.) d=mix(d,1.+3.*flGull(rot(.25*head+.6*(h.x-.5)-fi*.83-.4-flTwist)*(f-pos)/(sx*1.45),1.7*wing-.35+turn),gull);
  if (uOwn[1]<0.) {
    vec2 u=along/(sx*1.05);
    u.y+=.12*sin(t*1.9+h3*TAU+u.x*2.5);
    float w=abs(u.y);
    d=mix(d,1.+1.6*min(max(w-.3*max(1.-u.x*u.x,0.),abs(u.x)-1.),max(w-.5*(-.75-u.x),-1.35-u.x)),-uOwn[1]);
    dark=mix(dark,flK4*(1.3+turn),-uOwn[1]*flS(.2,.9,sin(head*2.5+h.x*2.+t*.3))*flS(-.3,.3,u.y+.15));
  }
  float aa=n/(uRes.y*sx);
  float a=flS(1.+aa,1.-aa,d)*min(1.,1.4/(1.+aa*aa))*vis;
  vec3 ink=mix(vec3(.008,.008,.014),uOwn[5]==0.?dark:flK4,max(abs(uOwn[5]),.7*max(-uOwn[1],0.)));
  return mix(col,mix(dark,ink,.3+.7*near),a*mix(.6,.97,near));
}
// One skein of geese, its point at tip, as many as that kind of sound is loud.
float flSkein(vec2 p,vec2 tip,float many,float big,float turn) {
  vec2 q=p-tip*vec2(1.15,1.);
  float a=abs(q.y),gap=.062*big;
  float s=q.x*.925+a*.38,v=a*.925-q.x*.38,id=max(floor(s/gap+.5),0.),ds=s-id*gap;
  vec2 e=vec2(ds*.925-v*.38,(ds*.38+v*.925)*(q.y<0.?-1.:1.));
  float up=q.y<0.?1.:0.,r=.024*big,beat=sin(uTime*1.1-id*.9+up*2.*min(id,1.)+tip.x*9.);
  float soft=1.2/(uRes.y*r),d=flGull(e/r,.45+(.3+.35*uHigh)*beat+turn);
  return flS(soft,-soft,d)*sat(2.+8.*many-id);
}
vec3 flDusk(vec2 p) {
  float t=uTime;
  float horizon=-.33+(uOwn[6]>0.?.36:.26)*uOwn[6];
  vec2 pf=p-vec2(0.,.2*flUp);
  float full=flS(.3,1.,uLevel);
  float bright=.5+.25*full;

  vec2 fold=.12*vec2(noise(p*1.7+vec2(t*.07,0.))-.5,noise(p*1.7+vec2(9.,-t*.06))-.5)
           +.035*vec2(noise(p*5.+vec2(0.,t*.1))-.5,noise(p*5.+vec2(5.,t*.09))-.5);
  float kick=sat(uHits*1.3);
  float frontA=mix(-.95,.95,1.-kick),frontB=mix(.95,-.95,1.-uCue);
  float turn=sqrt(kick)*exp(-flSq((p.x-frontA)/.13))+sqrt(uCue)*.8*exp(-flSq((p.x+.5*p.y-frontB)/.2));
  vec3 warm;
  float D=flDense(pf+fold*2.,warm)*(1.+1.6*turn);

  vec3 col=flSkyAt(p,horizon)+warm;

  float sy=p.y-horizon;
  vec2 cq=vec2(p.x*1.2+t*.008,sy*7.+2.);
  float cl=.5*noise(cq)+.3*noise(cq*2.1+7.)+.2*noise(cq*4.3+13.);
  float cloud=flS(.5,.75,cl)*flS(.03,.18,sy);
  float under=flS(.5,.6,cl)*(1.-flS(.6,.75,cl))*flS(.03,.18,sy);
  cloud*=1.-flVoid; under*=1.-.8*max(flVoid,flLit);
  col=mix(col,col*.5,cloud*.8)+vec3(.9,.3,.16)*under*.16*exp(-sy*2.5);
  col*=bright;
  if (uOwn[3]<0.) col*=flShaft(p);
  vec3 land=flLand,open;
  float lit=flLit;

  float head=2.6*(noise(p*1.3+vec2(t*.05,3.))-.5)+1.4*turn;
  vec3 dark=mix(col*.3,vec3(.012,.012,.022),.6);
  if (lit>0.) dark=mix(dark,mix(col,flK4,.6),lit);
  if (uOwn[2]>0.) {
    vec2 q=pf-flMid,v=mix(vec2(cos(head),sin(head)),q.yx*vec2(-1.,1.)/max(length(q),1e-3),uOwn[2]);
    head=atan(v.y,v.x+1e-5)+turn;
  }
  if (uOwn[1]<0.||uOwn[7]<0.) head*=1.+.5*min(uOwn[1],0.)*step(uOwn[2],0.);
  col=mix(col,dark,(1.-exp(-D*2.4))*.85*(1.+.75*min(uOwn[0],0.))*(1.-.7*flFall)*(1.+.65*min(uOwn[1],0.)));
  col=flBirds(col,pf,0.,250.*flMany,vec2(.9211,.3894),D,head,turn,dark);
  col=flBirds(col,pf,1.,170.*flMany,vec2(.3342,.9425),D,head,turn,dark);
  col=flBirds(col,pf,2.,115.6*flMany,vec2(-.4699,.8827),D,head,turn,dark);
  col=flBirds(col,pf,3.,78.6*flMany,vec2(-.9685,.2489),D,head,turn,dark);
  col=flBirds(col,pf,4.,53.5*flMany,vec2(-.8373,-.5467),D,head,turn,dark);
  col=flBirds(col,pf,5.,36.3*flMany,vec2(-.1617,-.9868),D,head,turn,dark);
  if (uOwn[2]<0.) {
    float big=.9/sqrt(flMany);
    float g=flSkein(pf,flC0,flW0,1.1*big,turn)+flSkein(pf,flC1+vec2(-.1,0.),flW1,.75*big,turn)+flSkein(pf,flC2+vec2(.05,-.05),flW2,.6*big,turn)
           +flSkein(pf,flC3,flW3,.9*big,turn);
    col=mix(col,lit>0.?mix(dark,flK4,lit):dark,sat(g)*.95*(1.-flS(-.5,0.,uOwn[2])));
  }
  open=col;

  float rn=noise(vec2(p.x*2.6+4.,.5));
  float ridge=horizon+(.03*rn+.004*sin(p.x*23.+9.*rn))*(1.-1.9*flSea);
  vec3 far=mix(vec3(.1,.055,.09),vec3(.34,.15,.1),exp(-abs(p.x+.38)*2.2))*bright;
  vec3 air=flSkyAt(vec2(p.x,horizon+.06),horizon)*bright;
  if (lit>0.) far=mix(far,mix(air,land,.45),lit);
  if (uOwn[4]<0.) {
    float there;
    vec3 rock=mix(vec3(.05,.035,.07),land*.8,lit),c=flPeaks(p,horizon-.02,-.62*uOwn[4],1.9,rock,air,there);
    col=mix(col,c,there);
    c=flPeaks(p,horizon-.03,-.24*uOwn[4],4.3,rock*.8,air*.85,there);
    col=mix(col,c,there);
  }
  col=mix(col,far,flS(.003,-.003,p.y-ridge));
  float gy=horizon-.028-p.y;
  if (gy>0.) {
    vec2 mp=vec2(p.x+.003*sin(p.y*300.+t*.7),horizon+gy*3.+.03);
    vec3 pond=flSkyAt(mp,horizon)*bright*.75;
    vec2 mf=mp-vec2(0.,.2*flUp);
    pond=(pond+warm*.4*bright)*mix(1.,mix(.3,.75,max(lit,-min(uOwn[2],0.))),1.-exp(-flBody(mf+fold*2.,warm)*1.3));
    if (uOwn[3]>0.) {
      vec2 w=vec2(p.x,.22)/(gy+.035);
      float sw=noise(w*vec2(1.6,5.)+vec2(t*.12,-t*.5))+.5*noise(w*vec2(4.,11.)-vec2(t*.2,t*.7))-.75;
      pond*=1.+uOwn[3]*(.75+.4*uLow)*sw*exp(-.035/(gy+.004));
      if (lit>0.) pond=mix(pond,land*(.6+1.*bright),.45*lit*uOwn[3]*(1.-exp(-gy*5.)));
    }
    vec3 ground=mix(vec3(.012,.01,.015),land*(.5+.5*exp(-gy*4.)),lit);
    float bank=.05+.03*noise(vec2(p.x*2.2,8.))+1.3*flSea+.4*flUp;
    float rx=p.x*240.,rh=hash11(floor(rx));
    float reeds=bank-(.006+.05*rh*rh*noise(vec2(p.x*5.,5.)))*flS(.5,.2,abs(fract(rx)-.5));
    col=mix(pond,ground,flS(-.002,.002,gy-reeds));
    col=mix(far*.5,col,flS(0.,.004,gy));
  }
  col+=(lit>0.?mix(vec3(.6,.3,.18),air*1.5,lit):vec3(.6,.3,.18))*.09*bright*exp(-flSq((p.y-horizon+.015)/.025));

  vec3 tr=p.x<-.525?vec3(-.66,.04,.24):p.x<0.?vec3(-.44,.035,.14):p.x<.42?vec3(.27,.03,.09):vec3(.66,.06,.34);
  float left=max(1.-abs(uOwn[4])-flSea*1.2,0.);
  tr.y+=flUp*tr.z;
  vec3 wood=mix(vec3(.01,.008,.013),land*.2,lit);
  if (uOwn[4]>0.) {
    float cx=(floor(p.x*7.)+.5)/7.,px=1.2/uRes.y,f=flFirs(p,horizon-.02,30.,.13*uOwn[4],px)*step(horizon-.03,p.y);
    col=mix(col,mix(wood*1.5,air,.4),f);
    f=flFirs(p,horizon-.06,15.,.22*uOwn[4],px)*step(horizon-.06-.03*flSea,p.y);
    col=mix(col,mix(wood,air,.12),f);
    f=flFirs(p,horizon-.13,7.,uOwn[4]*.46*flS(.2,.75,abs(cx+.08))+.001,px)*(1.-flSea);
    col=mix(col,wood,f);
  }
  float trees=left<.08?0.:flTree(p,vec2(tr.x,horizon-tr.y*left),tr.z*left,p.x<-.525||p.x>.42?-1.:1.);
  col=mix(col,wood,trees);
  if (uOwn[3]<0.) col=mix(col,open,-uOwn[3]);
  col*=1.-.35*dot(p,p);
  return max(mix(vec3(dot(col,vec3(.3,.55,.15))),col,1.25),0.);
}
// Where the fireflies of one kind of sound gather: each kind has its own slow drifting stretch of the meadow.
float flPatch(vec2 x,float k) {
  return flSq(sat(.5+.8*sin(x.x*3.1+x.y*2.3+k*1.9+uTime*.02)));
}
vec3 flPool(vec3 k,float sig,float lay,float at) {
  return mix(vec3(.75,1.,.25),k*k*2.6,.7+.3*flPure)*(sig*flSq(sat(.5+.9*cos(TAU*(lay*1.6-at)))));
}
// What hangs there instead of a spark: a paper lantern, or a six-armed flake turning slowly.
float flShape(float was,vec2 e,float fi,float n,float h,float turn) {
  float px=1.2*n/uRes.y;
  if (uOwn[1]>0.) {
    vec2 q=e/(.13+.05*h);
    float w=.72-.22*q.y*q.y,d=max(abs(q.x)-w,abs(q.y)-1.)*.15;
    float lamp=flS(px,-px,d)*(.35+.9*exp(-2.*dot(q+vec2(0.,.5),q+vec2(0.,.5)))+.25*sat(-q.y))*(.85+.15*cos(q.y*16.))*(.8+.2*cos(q.x*4.));
    return mix(was,lamp,uOwn[1]);
  }
  float r=.11+.1*h,arm=1.,soft=px+.003*fi*fi;
  e=rot(turn+h*6.)*e;
  for (int i=0; i<5; i++) {
    vec2 a=abs(e);
    arm=min(arm,min(max(a.y-.03*r,a.x-r),length(a-vec2(r,0.))-.09*r));
    e=mat2(.809,.588,-.588,.809)*e;
  }
  return mix(was,.75*flS(soft,-soft,arm)*min(1.,.03/px)+.35*was,-uOwn[1]);
}
// Lights hung along slack strings, one string to a kind of sound and one over.
void flString(vec2 p,float j,vec3 kc,float sig,inout vec3 glow,inout vec3 lightOn) {
  float near=fract(j*.4+.2),n=mix(22.,8.,near)*sqrt(flMany),top=.36-.13*j+.3*uOwn[6];
  float gx=p.x*n+j*3.7,id=floor(gx),h=hash11(id+j*13.);
  for (float k=-1.; k<1.5; k++) {
    float x=(id+k+.5-j*3.7)/n,u=fract(x*.62+j*.37)-.5;
    vec2 e=p-vec2(x+.004*sin(uTime*.6+x*5.+j),top+(.3-.07*j)*(u*u-.12)+.007*sin(uTime*.4+x*3.+j*2.));
    float d=length(e),r=.12/n,body=1.6*flSq(sat(1.-d*d/(r*r)));
    if (uOwn[1]!=0.) body=flShape(body,e*n*.75+vec2(0.,.1),j,n*.75,h,0.);
    float lum=flRing*(.35+1.4*sig)*(.75+.25*sin(uTime*.5+h*9.+x*7.));
    glow+=kc*kc*2.6*lum*(body+.35*flSq(flSq(sat(1.-d*n*.8)))*(1.-.8*flDay));
    lightOn+=kc*kc*lum*.5*sat(1.-d*n*.5);
  }
  float u=fract(p.x*.62+j*.37)-.5,line=abs(p.y-.35/n-top-(.3-.07*j)*(u*u-.12)-.007*sin(uTime*.4+p.x*3.+j*2.));
  glow+=flRing*kc*kc*.12*flS(.0022,.0006,line);
}
// One layer of fireflies, one to a cell; each belongs to one kind of sound and glows with it.
void flFlies(vec2 p,float fi,float n,float full,float flash,inout vec3 glow,inout vec3 lightOn) {
  float t=uTime,near=fi/3.;
  vec2 go=vec2(0.,uOwn[7]*t*(.012+.012*fi));
  vec2 g=(p+vec2(.003*t*(1.+fi),0.)+fi*3.1+go)*n,id=floor(g),f=fract(g);
  vec2 h=hash22(id+fi*23.);
  float h3=fract(h.x*9.7+h.y*5.3),h4=fract(h.x*3.3+h.y*11.1);
  vec2 ph=vec2(t*.21*(.6+h.x)+h.y*50.,t*.27*(.6+h.y)+h.x*50.);
  vec2 pos=.5+.17*vec2(sin(ph.x),sin(ph.y));
  vec2 wp=(id+pos)/n-vec2(.003*t*(1.+fi),0.)-fi*3.1-go;
  wp.y-=.3*uOwn[6]+.13*flSea;
  float fk=floor(h3*4.999);

  float band=1./flSq(1.+flSq((wp.y-mix(-.07,-.2,near))/mix(.07,.3,near)));
  float here=step(h4,band*(.2+1.*flPatch(wp,fk))*(.5+.5*full));
  if (uOwn[2]<0.||uOwn[7]!=0.||uOwn[3]<0.) {
    vec2 cw=wp-vec2(.07,.27);
    float crown=exp(-dot(cw,cw*vec2(20.,42.)));
    float all=mix(mix(band*(.2+flPatch(wp,fk)),.5,max(abs(uOwn[7]),flVoid)),crown*2.6+.06*band,flGrove);
    here=flS(h4-.05,h4+.05,all*(.6+.4*full));
  }
  here*=1.-flRing;
  float blink=flSq(.5+.5*sin(t*(.45+.6*h4)+h3*40.));
  blink*=mix(blink,1.,near);
  float sig=fk<.5?uDrone:fk<1.5?uPad:fk<2.5?uTexture:fk<3.5?uPhrase:flHit;
  vec3 kc=fk<.5?uKind[0]:fk<1.5?uKind[1]:fk<2.5?uKind[2]:fk<3.5?uKind[3]:uKind[4];
  float lum=here*(mix(blink,.75,.8*abs(uOwn[1]))*(.1+.25*flPure+1.7*sig)+flash);
  vec3 tint=mix(vec3(.75,1.,.25),kc*kc*2.6,.55+.45*flPure);
  float d=length(f-pos);
  float r=mix(.03,.19,near*near);
  float sharp=2.4*flSq(flSq(sat(1.-d*d/(r*r*1.6))));
  float disc=flS(r,r*.72,d)*(.3+.3*sat((d-r*.4)/(r*.55)));
  float halo=sat(1.-d/.33);
  halo*=halo*halo;
  float body=mix(sharp,disc,near*near);
  if (uOwn[1]!=0.) body=flShape(body,f-pos,fi,n,h.y,t*(.1+.2*h.x)*(h3-.5));
  glow+=tint*lum*(body+halo*mix(.5,.1,near)*(1.-.8*flDay));
  lightOn+=tint*lum*halo*mix(1.6,.4,near);
}
// One row of grass, catching the light along its top.
vec3 flRow(vec3 col,vec2 p,float fj,float base,vec3 lightOn,float px,vec2 wind) {
  float amp=.008+.017*fj,fr=110./(1.+.9*fj);
  float sway=.3*mix(wind.x,wind.y,fract(fj*.37+.15));
  float bx=p.x*fr*5.+fj*10.+sway*3.,bh=hash11(floor(bx)+fj*7.);
  float top=base+amp*(.7*noise(vec2(p.x*fr*.5+fj*10.+sway,fj))+1.1*bh*bh*flS(.5,.1,abs(fract(bx)-.5)));
  float in_=flS(px,-px,p.y-top);
  float rim=1./flSq(1.+.8*max(top-p.y,0.)/(amp*1.3+.004));
  float streak=.6+.8*fract(floor(bx*.5)*.618+fj*.37)*(.5+.5*bh);
  vec3 row=vec3(.003,.008,.007)+vec3(.25,.5,.2)*lightOn*(.2+2.6*rim)*streak*mix(1.,.5,fj/5.);
  if (flLit>0.) row=mix(row,(flLand*(.5+.12*fj)+lightOn*flLand*2.)*(.75+.5*rim)*(.8+.2*streak),flLit);
  return mix(col,row,in_*(1.-flSea)*(1.-flVoid));
}
// Tall grass close to us, dark and out of focus.
vec3 flBlades(vec3 col,vec2 p,float fj,vec3 lightOn) {
  float t=uTime,n=8.+7.*fj;
  float gx=p.x*n+fj*5.,id=floor(gx);
  float h=hash11(id+fj*31.);
  float top=-.5+(.18+.3*h)*(1.-.35*fj);
  float up=(p.y+.5)/(top+.5);
  float lean=(h-.5)*.9+.12*sin(t*.5+h*20.);
  float bx=fract(gx)-.5-lean*up*up;
  float wide=.14*(1.-up);
  float blade=flS(wide+.07-.04*fj,wide-.03,abs(bx))*step(up,1.)*step(0.,up);
  return mix(col,vec3(.003,.008,.005)+lightOn*.03+flLit*flLand*.35,blade*.93*(1.-flSea)*(1.-flVoid)*sat(1.-1.4*flFir));
}
vec3 flNight(vec2 p) {
  float t=uTime;
  float hz=-.04+.3*uOwn[6];
  float full=flS(.3,1.,uLevel);

  float y=p.y-hz;
  vec3 col=mix(vec3(.035,.11,.13),vec3(.012,.035,.08),flS(0.,.2,y));
  col=mix(col,vec3(.003,.007,.022),flS(.15,.55,y));
  col+=vec3(.05,.09,.08)*exp(-flSq((p.x-.45)/.5))*exp(-max(y,0.)*6.);
  if (flLit>0.) col=mix(col,flAir(p,max(y,0.)),flLit);
  vec2 sg=p*34.,sid=floor(sg);
  vec2 sh=hash22(sid);
  col+=vec3(.7,.8,1.)*step(.88,sh.x)*flS(.1,0.,length(fract(sg)-.2-.6*sh))*(.3+.2*sin(t*(.5+sh.y)+sh.y*30.))*flS(.12,.35,y)*(1.-flDay)*(1.-flVoid);
  if (uOwn[3]<0.) col*=flShaft(p);
  vec3 air=flAir(vec2(p.x,hz),.05),dusk=mix(vec3(.03,.08,.1),air,flLit),wood=mix(vec3(.002,.005,.007),flLand*.2,flLit),open=col;
  if (uOwn[4]<0.) {
    float there;
    vec3 c=flPeaks(p,hz,-.55*uOwn[4],1.9,mix(vec3(.01,.02,.03),flLand*.8,flLit),dusk,there);
    col=mix(col,c,there);
  }
  float tn=noise(vec2(p.x*2.7,1.)),tn2=noise(vec2(p.x*7.,4.));
  float tl=hz+.035+.1*tn+.022*sqrt(abs(sin(p.x*23.+5.*tn2)))*(.5+tn)+.014*sqrt(abs(sin(p.x*57.+9.*tn2+3.*tn)))+.008*noise(vec2(p.x*90.,7.));
  tl-=(tl-hz)*abs(uOwn[4])*step(uOwn[4],0.)*1.1;
  vec3 hedge=mix(vec3(.002,.005,.007),mix(wood,air,.35),flLit);
  col=mix(col,hedge,flS(.004,-.004,p.y-tl));
  if (uOwn[4]>0.) {
    float px2=1.2/uRes.y,cx=(floor(p.x*7.)+.5)/7.;
    col=mix(col,mix(hedge,dusk,.25),flFirs(p,hz+.02,24.,.22*flFir,px2));
    col=mix(col,hedge,flFirs(p,hz-.01,13.,.32*flFir,px2));
  }
  if (uOwn[3]<0.) col=mix(col,open,flVoid);

  vec3 pools=vec3(0.);
  float lay=noise(vec2(p.x*1.6+uTime*.02,p.y*2.6-uTime*.013));
  pools+=flPool(uKind[0],uDrone,lay,0.)+flPool(uKind[1],uPad,lay,.2)+flPool(uKind[2],uTexture,lay,.4)
        +flPool(uKind[3],uPhrase,lay,.6)+flPool(uKind[4],flHit,lay,.8);
  vec3 lightOn=vec3(.01,.03,.035)+pools*.035;

  vec3 glow=vec3(0.);
  float kick=sat(uHits*1.3);
  float flash=kick*exp(-flSq((p.x-mix(-1.,1.,1.-kick))/.22))+uCue*.8*exp(-flSq((p.x-mix(1.,-1.,1.-uCue))/.35));
  if (flGrove>0.) col=mix(col,wood,flTree(p,vec2(.06,hz-.14*flGrove),.56*flGrove+.01,1.)*flS(.1,.3,flGrove));
  vec2 pw=p;
  float gy=hz-p.y,many=flMany;
  if (flSea>0.&&gy>0.) {
    vec2 w=vec2(p.x,.22)/(gy+.06);
    float sw=noise(w*vec2(1.6,4.)+vec2(t*.1,-t*.35))+.5*noise(w*vec2(4.,9.)-vec2(t*.15,t*.5))-.75;
    vec2 m=vec2(p.x+.02*sw*sat(gy*4.),gy*1.25+.06*sw*sat(gy*3.));
    vec3 c=mix(mix(vec3(.03,.09,.11),vec3(.006,.015,.04),flS(0.,.4,m.y)),flAir(vec2(m.x,hz+m.y),max(m.y,0.)),flLit)*.8;
    c=mix(c,hedge*1.5+c*.15,flS(.03,-.02,m.y-(tl-hz)-.1*flFir*(.6+noise(vec2(m.x*15.,2.)))));
    col=mix(col,c*(1.+.35*sw),flSea);
    pw=mix(p,vec2(m.x,hz+gy+.03*sw),step(.5,flSea));
  }
  float shown=1.;
  if (pw.y!=p.y) shown=.65;
  flFlies(pw,0.,26.*many,full,flash,glow,lightOn);
  flFlies(pw,1.,14.04*many,full,flash,glow,lightOn);
  flFlies(pw,2.,7.58*many,full,flash,glow,lightOn);
  flFlies(pw,3.,4.09*many,full,flash,glow,lightOn);
  if (uOwn[2]>0.) {
    flString(pw,0.,uKind[0],uDrone,glow,lightOn);
    flString(pw,1.,uKind[1],uPad,glow,lightOn);
    flString(pw,2.,uKind[2],uTexture,glow,lightOn);
    flString(pw,3.,uKind[3],uPhrase,glow,lightOn);
  }
  if (shown<1.) glow*=shown;

  float px=1.5/uRes.y;
  vec2 wind=sin(t*.3+p.x*3.+vec2(0.,2.2));
  col=flRow(col,p,0.,-.0520+.292*uOwn[6],lightOn,px,wind);
  col=flRow(col,p,1.,-.1220+.247*uOwn[6],lightOn,px,wind);
  col=flRow(col,p,2.,-.2185+.184*uOwn[6],lightOn,px,wind);
  col=flRow(col,p,3.,-.3284+.112*uOwn[6],lightOn,px,wind);
  col=flRow(col,p,4.,-.4480+.034*uOwn[6],lightOn,px,wind);

  col+=(mix(vec3(.012,.03,.035),air*.3,flLit)+pools*.07)*(1.-flVoid)*exp(-flSq((p.y-hz+.03)/.05));
  float over=dot(glow,vec3(.6));
  col=mix(col+glow,mix(col,glow/max(over,1e-3)*2.,1.-exp(-over*2.5)),flDay);

  col=flBlades(col,p,0.,lightOn);
  col=flBlades(col,p,1.,lightOn);
  return col;
}
vec3 render(vec2 p) {
  flGather();
  if (uVar<.5) return screenOf(flDusk(p));
  return screenOf(flNight(p));
}
