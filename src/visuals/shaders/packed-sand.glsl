// name: Packed sand
// a: In the bottle
// b: Falling hills
// what: The shoulder of a great round bottle by a window, packed with dyed sand grain by grain: level bands, a row of points, a striped hill with dark trees, water with one sail, far peaks; or two panes of glass with striped mountains of sand in water, threads of sand falling from a raft of bubbles, a low sun behind.
// follows: The piece lies in the bands and the hills: where it is loud they thicken and take its colours; a light stands where the loop is. Drone and pad dye the sand, texture speckles it, a phrase fills the sail or tints the ridges. The spectrum is the sixteen points, or the threads. A hit lets a pinch slide, a cue pours a new colour, keys glint.
// own: 0 moonlit night at -1, red evening at 1; 1 ash and salt at -1, bright dyed sands at 1; 2 low land at -1 (open water in the bottle), steep peaks at 1; 3 so near that every grain shows at -1, stood back at 1 (the panes in their frame); 4 a dark room at -1, a blue wall at 1; 5 the bottle square-shouldered at -1, a pointed flask at 1; between the panes most of the sand still held above at -1, nearly all of it fallen at 1; 6 woven diamonds and zigzags (b: a round pane in a ring) at -1, a desert with camels and palms (b: an hourglass) at 1; 7 a row of small bottles on a shelf (b: round swelling hills) at -1, the sand picture flat and wide, no bottle (b: hills in steps) at 1
const vec3 psPlain[6]=vec3[6](vec3(.86,.79,.66),vec3(.67,.64,.59),vec3(.76,.62,.43),vec3(.55,.3,.17),vec3(.33,.26,.21),vec3(.94,.9,.82));
const vec3 psDyed[6]=vec3[6](vec3(.95,.74,.22),vec3(.16,.52,.58),vec3(.9,.43,.18),vec3(.72,.14,.15),vec3(.13,.17,.42),vec3(.96,.91,.8));
float psPx;   // a pixel
float psG;    // the size of a grain
vec2 psV;     // where on its grain the eye looks
float psTurn,psAx,psFoot;   // how the bottle is turned; how far from its middle a grain is seen, and its width at the trees' feet
float psMoved=.0;
float psRad,psPow;   // the bottle's belly and how square its shoulder is
const vec2 psMid=vec2(-.27,-.42);
#define PS_WEAVE max(-uOwn[6], .0)
#define PS_SAND max(uOwn[6], .0)
#define PS_ROW max(-uOwn[7], .0)
#define PS_FLAT max(uOwn[7], .0)
#define PS_S exp2(2.4 * PS_FLAT)
float psNight,psDusk,psDim;   // the hour
vec3 psLamp;   // and its light
vec3 psC[6];   // the six sands: as dug, as ash and salt, or dyed
// From 0 at a to 1 at b, whichever is greater.
float psS(float a,float b,float x) { x=sat((x-a)/(b-a)); return x*x*(3.-2.*x); }
float psH(float n) { n=fract(n*.1031); n*=n+33.33; n*=n+n; return fract(n); }
// The edge of a shape of packed grains.
float psIn(float d) { return psS(-.4*psG,.4*psG,d); }
float psCut(float d) { return psS(psPx,-psPx,d); }
// Ash and salt in place of coloured sand.
vec3 psAshen(vec3 c) { float l=dot(c,vec3(.3,.6,.1)); return mix(c,vec3(psS(.12,.95,l)*.96+.03),.92*sat(-uOwn[1])); }
vec3 psTri(float o,vec3 a,vec3 b,vec3 c) { return mix(mix(b,a,sat(-o)),c,sat(o)); }
// A sound's colour as a dye that sand would take.
vec3 psDye(vec3 c) {
 float l=dot(c,vec3(.3,.6,.1));
 c=.15+.06*l+.74*c;
 return clamp(mix(c,vec3(1.35*l-.1),.75*sat(-uOwn[1])),.04,.95);
}
float psSmax(float a,float b,float k) { return -smin(-a,-b,k); }
// The half width of the bottle at a height.
float psWide(float y) {
 float dy=(y-psMid.y)/psRad;
 dy=dy<.0?-.62*dy:dy;
 float n=y<psMid.y?max(psPow,2.):psPow;
 float r=psRad*pow(max(1.-pow(dy+1e-4,n),.0),1./n);
 return psSmax(r,.155+.02*psS(.3,.45,y),.1);
}
vec3 psDyeOf(vec4 m) { return psDye(m.rgb/max(m.a,.004)); }
// The packed grain nearest to a place: round the belly (an angle) and up, then its distance and its own number. Turned: each
// row holds as many grains as fit round the bottle there.
vec4 psGrain(vec2 q,float turned) {
 float qy=q.y/psG,row0=floor(qy-.5);
 vec4 best=vec4(.0,.0,9.,.0);
 for (int j=0; j<2; j++) {
  float row=row0+float(j),per=1.;
  if (turned>.5) per=max(psWide(.06+((row+.5)*psG-.06)*1.1),.1);
  float qx=q.x*per/psG,b=floor(qx-.5);
  for (int i=0; i<2; i++) {
   vec2 id=vec2(b+float(i),row);
   float h=hash31(vec3(id,7.));
   vec2 c=id+.5+.56*(vec2(h,fract(h*61.7))-.5);
   vec2 v=vec2(qx,qy)-c;
   float d=dot(v,v)*(.75+.6*fract(h*17.3));
   if (d<best.z) { best=vec4(c.x*psG/per,c.y*psG,d,h); psV=v; }
  }
 }
 best.z=sqrt(best.z);
 return best;
}
float psRange(float x,float f,float seed) {
 return .5+.27*sin(x*f+seed)+.15*sin(x*f*2.17+seed*2.3)+.08*sin(x*f*4.9+seed*4.1);
}
// A hill, packed in skins along its slope and dyed by the pad and the piece, with a line of other grains along its top.
vec3 psHill(vec3 col,float deep,vec4 m,vec3 lead,float pad,float w,float seed,float h,vec3 line,float wet) {
 lead=mix(mix(lead,psDye(uKind[1]),pad*uPad),psDyeOf(m),.7*sat(m.a*1.2));
 float u=deep/w+.2*(h-.5),k=5.7*floor(u)+seed;
 vec3 skin=mix(psC[int(5.99*psH(k-5.7))],psC[int(5.99*psH(k))],psS(.0,.12,fract(u)));
 col=mix(col,mix(mix(lead,skin,.5+.3*sat(uOwn[1])),col,wet)*psDim,psIn(deep));
 return mix(col,line*psDim,psS(1.4*psG,.5*psG,abs(deep-.3*psG))*.6);
}
// The sand at a place on the glass: x round the belly, y its height; h the grain's own number.
vec3 psPacked(vec2 s,float h) {
 float h2=fract(h*91.3),h3=fract(h*37.7),x=s.x,y=s.y,px=sat(.5+x*.5);
 vec3 col,fresh=mix(psDye(uKind[4]),vec3(1.,.85,.6),.3);
 if (y<-.118) {
  // level bands, each as thick as the sound was there
  vec4 lay[9];
  float sum=.0,at=-.47;
  for (int k=0; k<9; k++) {
   float fk=float(k);
   vec4 m=piece(vec2(px,.95-.088*fk));
   float a=sat(m.a*(.65+uEnergy));
   float thick=.45+.75*psH(fk*5.3+3.1)+2.2*a+(k==2?1.5*uDrone:.0);
   vec3 own=mix(psC[k % 2==1?(k==5?2:1):k % 4==0?0:5],psDyeOf(m),.92*psS(.02,.5,a));
   if (k==2) own=mix(own,psDye(uKind[0]),.85*uDrone);
   lay[k]=vec4(own*(k % 2==0?1.12:.86),thick);
   sum+=thick;
  }
  col=psC[int(psH(floor(y*42.)*3.3+900.)*2.99)];
  for (int k=0; k<9; k++) {
   col=mix(col,lay[k].rgb,psIn(y-at));
   col=mix(col,psC[4]*.8,psS(.75*psG,.3*psG,abs(y-at))*(k % 2==0?.75:.25));
   at+=lay[k].w/sum*.29;
  }
  // a row of points poked with the rod, one for each band
  float u=(x+1.)*8.,k=clamp(floor(u),.0,15.),b=uBands[int(k)];
  float tri=1.-2.*abs(fract(u)-.5),up=(y+.178)/.06;
  col=mix(col,psC[5],psS(-.02,.06,up));
  float pt=tri*(.45+.5*b)-up;
  col=mix(col,mix(psC[3],psDye(kindColour(k/4.)),.25+.6*b),psS(-.05,.05,pt)*step(.0,up+.05));
  col=mix(col,psC[4],psS(-.05,.05,tri*.35-up+.02)*step(.0,up+.05));
 } else {
  // sky: grains of two sands mixed, more of one the higher
  float hor=.055,up=sat((y-hor)/.26);
  vec3 low=psTri(uOwn[0],vec3(.3,.34,.46),vec3(.93,.84,.7),vec3(.95,.52,.26));
  vec3 high=psTri(uOwn[0],vec3(.07,.09,.19),vec3(.66,.74,.78),vec3(.6,.3,.36));
  low=mix(psAshen(low),psDye(uKind[1]),.35*uPad)+vec3(.12,.1,.06)*uMic;
  col=mix(low,psAshen(high),psS(-.22,.22,up-.15-.7*h2));
  // a moon and stars at night, a sun at evening
  col=mix(col,vec3(.96,.93,.83),(psNight+psDusk)*psS(.042,.037,length(vec2(psAx+psWide(.2)*sin(.06/PS_S+psTurn),1.16*(y-.18-.17*PS_FLAT)))));
  col=mix(col,vec3(.9),psNight*psS(.988,.994,h3)*step(.1,y));
  // two far ranges
  for (float k=.0; k<2.; k++) {
   vec4 m=piece(vec2(px,.34+.12*k));
   float r0=psRange(x,3.3+1.9*k,4.3+3.7*k),peak=1.-2.*abs(fract(x*(2.6+1.4*k)+.15+.37*k)-.5);
   float ht=(.135-.06*k)*(1.+.8*uOwn[2])*mix(r0,1.5*(.25+.75*r0)*peak,.8-.4*k);
   ht*=.95+.25*uPad+.3*m.a;
   col=psHill(col,hor+.012+ht-y,m,k<.5?vec3(.48,.48,.53):vec3(.56,.34,.22),.6,.022,11.+20.*k,h,psC[5],.2-.1*k+.2*(uSpace-.5));
  }
  vec3 water=psAshen(psTri(uOwn[0],vec3(.16,.21,.31),vec3(.54,.65,.68),mix(vec3(.54,.65,.68),low,.45)));
  float dep=hor-y;
  water=mix(water,psC[5]*psDim,.45*psS(.45,.9,sin(y*230.+2.*sin(x*7.))+.9*(h2-.5)));
  water=mix(water,mix(vec3(.98,.9,.72),psDye(uKind[3]),.4*uPhrase),(.2+.75*uPhrase)*psS(.1+dep*.6,.0,abs(x-.24-.02*sin(y*90.))+.06*h3));
  if (PS_SAND>.0) water=mix(water,mix(psC[2],psC[0],.5+.5*sin(dep*150.+5.*sin(x*4.)+1.5*h2))*psDim,step(fract(h*53.),PS_SAND));
  col=mix(col,water,psIn(dep));
  // the sail, and what the water gives back of it
  vec2 q=vec2(x-.17-.05*sin(uTime*.017),y-.018);
  float mir=q.y<.0?.35:1.,tall=.135+.055*uPhrase;
  q.y=q.y<.0?-q.y*1.3+.012*sin(y*400.):q.y;
  float sy=sat((q.y-.014)/tall);
  float sail=min(min(q.x+.004,(.085+.03*uPhrase)*(1.-sy)*(1.+.5*sy)-q.x),min(q.y-.022,tall-q.y+.014));
  float jib=min(min(-q.x-.004,q.x+.06*(1.-sy*1.2)),q.y-.026),front=step(sail,jib);
  float hull=min(min(q.y+.002,.018-q.y),.085-abs(q.x-.012)+.9*(q.y-.016));
  col=mix(col,mix(vec3(.97,.94,.87),psDye(uKind[3]),(.25+.65*front)*uPhrase)*(1.-.14*front)*(1.-.28*psNight),psIn(max(sail,jib))*mir*(1.-PS_SAND));
  col=mix(col,psC[3]*.55,psIn(hull)*mir*(1.-PS_SAND));
  // a few dark trees along the crest
  for (float k=.0; k<5.; k++) {
   float hk=psH(k+8.);
   vec2 tq=vec2(abs(psAx-psFoot*sin((.085*k+.05*hk-.5)/.66/PS_S-psTurn)),(y+.02)/(.13+.06*hk));
   float tr=.052*sqrt(sat(tq.y))*(1.-tq.y)-tq.x;
   if (PS_SAND>.0) {
    // palms
    tq.y*=.75;
    vec2 f=vec2(tq.x,(tq.y-.74)*.13);
    float fr=length(f),fa=atan(f.y+.9*fr*fr/.06,f.x+1e-5);
    tr=mix(tr,max(.007-tq.x-.5*max(tq.y-.74,.0),min((.012+.046*sat(sin(fa*7.+1.))*psS(-1.1,-.6,fa))-fr,.006)),PS_SAND);
   }
   col=mix(col,vec3(.2,.21,.15)*(.7+.5*h3)*psDim,psIn(tr)*step(.0,tq.y)*sat(1.+uOwn[2])*(1.-PS_SAND*mod(k,2.)));
  }
  // the near hills
  for (float k=.0; k<2.; k++) {
   vec4 m=piece(vec2(px,.52+.14*k));
   float bank=.5+.5*sin(k<.5?x*2.6-2.1:x*2.2+1.9);
   float ht=(.025+(.145-.03*k)*bank*bank)*(1.+.6*uOwn[2])*(.75+.5*psRange(x,4.,5.+4.*k));
   ht*=.9+.12*uPad+.22*m.a;
   float deep=ht-.125-y;
   col=psHill(col,deep,m,k<.5?vec3(.45,.27,.17):vec3(.58,.42,.24),.5*k,.026-.006*k,57.+9.*k,h,psC[4]*.8,.0);
   // a hit's pinch, a cue's new colour along the crest
   float run=1.-uHits,go=1.-uCue,on=psIn(deep)*k;
   col=mix(col,fresh,on*uHits*psS(.34,.1,length(vec2(x+.3-.4*run,1.5*deep-.02))+.06*h3));
   col=mix(col,fresh,on*uCue*psS(.07,.03,deep+.01*h3)*psS(.5,.1,abs(x+.5-1.2*go)));
  }
  if (PS_SAND>.0) for (float k=.0; k<4.; k++) {
   // camels along the crest of the near hill
   float xc=-.34+.19*k+.02*sin(uTime*.02)+.02*psH(k+3.),ba=.5+.5*sin(xc*2.2+1.9);
   vec2 q=(s-vec2(xc,(.025+.115*ba*ba)*(1.+.6*uOwn[2])*(.75+.5*psRange(xc,4.,9.))*.95-.136))/.105;
   vec2 nk=q-vec2(.36,.5),hd=q-vec2(.6,.93);
   float d=min(length((q-vec2(.0,.55))*vec2(.5,1.))-.19,length((q-vec2(-.04,.74))*vec2(.85,1.))-.16);
   d=min(d,length(nk-vec2(.24,.43)*sat(dot(nk,vec2(.24,.43))/.2425))-.07);
   d=min(d,length(hd*vec2(.55,1.)-vec2(.05,.0))-.075);
   d=min(d,max(abs(abs(abs(q.x)-.27)-.075)-.034,abs(q.y-.26)-.3));
   vec3 cc=mix(psC[4]*.9,psDye(kindColour(1.+k)),step(abs(q.x+.04),.2)*step(.52,q.y)*(.5+.5*uPhrase));
   col=mix(col,cc*psDim,psIn(-d*.105)*PS_SAND);
  }
  if (PS_WEAVE>.0) {
   // rows of diamonds, zigzags and checks
   float tall=.072,ry=(y+.118)/tall,row=floor(ry),f=fract(ry),ty=mod(row,4.),ux=x*7.+.5*ty;
   vec2 c=vec2(abs(fract(ux)-.5)*2.,abs(f-.5)*2.);
   vec4 m=piece(vec2(px,.8-.1*row));
   float a=sat(m.a*1.2),dia=c.x+c.y,zig=f-.2-.6*c.x;
   float shape=ty<1.?.85-dia:ty<2.?.28-abs(zig):ty<3.?(fract(ux)-.5)*(f-.5)*6.:.62-abs(c.x-c.y);
   vec3 ground=mix(psC[int(5.99*psH(row*2.3+1.))],psDyeOf(m),.6*a),fig=mix(psC[int(5.99*psH(row*2.3+41.))],psDye(kindColour(mod(row+floor(ux),5.))),.35+.5*band(.5+.5*x)+.3*uPhrase);
   if (ty<1.) fig=mix(fig,psC[5],psS(.45,.38,dia));
   vec3 w=mix(ground,fig,psS(-.12,.12,shape));
   w=mix(w,psC[4]*.7,psS(.2,.1,abs(shape))*.85);
   w=mix(w,psC[4]*.8,psS(.1,.05,min(f,1.-f)));
   w=mix(w,fresh,uHits*psS(.22,.1,abs(x+.6-1.2*(1.-uHits))+.05*h3)+uCue*psS(.5,.4,abs(ry-4.*(1.-uCue))));
   col=mix(col,w*psDim,step(fract(h*53.),PS_WEAVE));
  }
  col=mix(col,psC[4]*.8,psS(.9*psG,.4*psG,abs(y+.118)));
 }
 col=mix(col,psDye(uKind[2]),.85*sat((uTexture*.1-h3)*30.)*psS(.05,-.02,y));
 col*=.86+.28*h2;
 return col*(1.-.45*step(.965,fract(h*211.)));
}
// How light falls on one grain.
float psDot(vec4 g,float square) {
 float d=1.-.62*psS(.34,.74,g.z)+.42*dot(psV,vec2(-.6,.8));
 return mix(.96,d*1.06,psS(1.2,3.6,square*psG/psPx));
}
float psNow(float at) {
 at=(at-uLoop)*8.;
 return .92+.16*uTone+(.12+.3*uEnergy)*exp(-at*at)*sat(4.*sin(PI*uLoop));
}
// A few grains are clear and catch the light.
float psGlint(vec4 g) {
 return step(.972,fract(g.w*313.))*(.1+.6*uKeys+.5*uHits)*(.5+.5*sin(uTime*.7+g.w*400.))*psS(.6,.1,g.z);
}
vec3 psBottle(vec2 p) {
 psRad=(.74-.1*sat(-uOwn[5])+.06*sat(uOwn[5]))*PS_S;
 psPow=mix(mix(2.,5.5,sat(-uOwn[5])),1.25,sat(uOwn[5]));
 vec2 w0=p;
 float cell=.0,hC=.0;
 if (PS_ROW>.0) {
  // the shelf: one bottle to each length of it, each of its own shape
  float span=1.72/max(PS_ROW,1e-4);
  cell=floor((p.x-psMid.x)/span+.5);
  p.x-=cell*span;
  float hc=psH(cell*3.7+5.);
  hC=hc;
  for (int i=0; i<6; i++) psC[i]=mix(psAshen(psPlain[(i+int(hc*5.)) % 6]),psDyed[(i+int(hc*6.)) % 6],sat(uOwn[1]));
  psMoved=cell*1.3;
 }
 vec3 wall=psTri(uOwn[4],vec3(.085,.085,.095),vec3(.9,.86,.79),vec3(.36,.53,.6));
 float fall=1.04-.17*psS(-.5,1.1,w0.x-.4*w0.y);
 vec3 col=wall*(fall+.035*(noise(w0*vec2(9.,7.))-.5));
 float shelf=-.335;
 vec3 table=mix(wall,vec3(.7,.54,.38),.6-.4*sat(-uOwn[4]))*(.97+.1*noise(w0*vec2(3.,45.)));
 col=mix(col,table*fall*1.04,psCut(p.y-shelf));
 // its shadow, warm, over the wall and down on the table
 vec2 sh=p-vec2(psMid.x+.3+.05*uSpace,-.075);
 if (p.y<shelf) sh.x-=(shelf-p.y)*.5;
 float dark=psS(.09,-.1,abs(sh.x)-psWide(min(sh.y,.44)))*psS(.5,.4,sh.y)*(1.-.65*psS(.3,.38,sh.y));
 if (PS_ROW>.0) {
  sh.x+=1.72/max(PS_ROW,1e-4);
  dark=max(dark,psS(.09,-.1,abs(sh.x)-psWide(min(sh.y,.44)))*psS(.5,.4,sh.y)*(1.-.65*psS(.3,.38,sh.y)));
  dark*=mix(1.,psS(-1.5,-.7,p.y),PS_ROW);
 }
 col*=psLamp*mix(vec3(1.),mix(vec3(.6,.5,.43),vec3(.62,.55,.6),psNight),dark);
 if (cell != .0) { psRad*=1.-.2*fract(hC*7.); psPow=hC<.33?1.35:hC<.66?2.:4.6; }
 // the bottle
 float x=p.x-psMid.x,rOut=psWide(p.y),slope=(psWide(p.y+.004)-rOut)/.004;
 float e=min((rOut-abs(x))/sqrt(1.+slope*slope),p.y+1.04),lipY=.405+1.5*PS_FLAT;
 vec3 room=col;
 // the rod stands in the open top
 float rx=x-.03-(p.y-.3)*(.22+.04*sin(TAU*uLoop));
 vec3 rod=mix(vec3(.32,.2,.11),vec3(.85,.66,.42),psS(-.011,.011,-rx))*psLamp;
 float rodMask=psCut(abs(rx)-.0105)*step(.2+2.*PS_FLAT,p.y);
 if (e>-2.*psPx&&p.y<lipY) {
  float wallT=.02,st=clamp(x/max(rOut-wallT*.6,.05),-.999,.999);
  float th=asin(st),cz=sqrt(1.-st*st);
  psTurn=.22/PS_S*sin(uTravel*.045+.4)+psMoved;
  float ys=.06+(p.y-.06)*(1.-.26*cz*rOut/PS_S);   // level rings curve, seen from the middle
  vec4 g=psGrain(vec2(th+psTurn,ys),1.);
  psAx=rOut*sin(g.x-psTurn); psFoot=psWide(-.04);
  vec3 n=normalize(vec3(st,-slope*.8,cz+.05));
  float lam=(.5+.62*max(dot(n,vec3(-.62,.42,.66)),.0))*(1.-.35*pow(abs(st),6.));
  float top=.315+2.*PS_FLAT+.02*cos(st*2.4)+.12*uCue*(1.-uCue)*cz;
  vec3 sand=psPacked(vec2(g.x*.66*PS_S,g.y),g.w);
  sand=mix(sand,psDye(uKind[4]),sat(uCue*1.2)*psS(.17,.05,top-ys+.03*g.w));
  if (PS_ROW>.0) sand=mix(sand,psDye(uKind[4]),PS_ROW*.9*uHits*psS(.1,.05,abs(ys+.75-uHits)+.04*g.w));
  sand*=psDot(g,.4+.6*cz)*lam*psLamp*psNow(.5+g.x*.33*PS_S)*(1.+.15*psNight);
  sand+=psLamp*psGlint(g);
  // above the sand the neck is empty
  vec3 air=mix(room*(.93-.35*pow(abs(st),8.))+.03,rod,rodMask);
  air=mix(air,psDye(uKind[4]),psS(.006,.0,abs(x-.01*sin(p.y*30.)))*uCue);
  vec3 body=mix(air,sand,psIn(top-g.y));
  // the glass: its thickness at the limb, and the window as one curved bar
  body=mix(body,room*.62+psLamp*.11,psS(wallT+psPx,wallT-psPx,e)*.75);
  body=mix(body,room*.42,.8*psS(3.*psPx+.003,.0,e));
  body+=psLamp*.35*psS(.004+psPx,.0,abs(e-.011))*(st<.0?1.:.35);
  float win=psS(.097,.081,abs(th+.8))*psS(.0,.03,min(p.y+.58,.255-p.y))*(1.-.85*psS(.012,.006,abs(th+.8)))*(1.-.85*psS(.014,.008,abs(p.y+.12)));
  body+=psLamp*(win*(.42+.1*uTone)+.06*psS(.55,.0,abs(th+.8)))*(1.-.5*body);
  col=mix(col,body,psCut(-e));
 }
 // the lip
 col=mix(col,rod,rodMask*step(lipY,p.y));
 vec2 lq=abs(vec2(x,p.y-lipY))-vec2(.185,.004);
 float lip=length(max(lq,.0))+min(max(lq.x,lq.y),.0)-.019;
 float lu=(p.y-lipY)/.023,lx=x/.2;
 vec3 lipC=room*(.7-.25*lx*lx)+psLamp*(.08+.5*psS(.3,.0,abs(lu-.35))*psS(.5,.1,abs(lx+.45)));
 lipC=mix(lipC,room*.45,psS(.006,.0,-lip)*.6);
 col=mix(col,lipC,psCut(lip));
 return col;
}
// One fall of sand: heaps side by side, each as steep as its sand will lie, flatter at the foot.
float psHeaps(float x,float wide,float seed,float steep) {
 float u=x/wide+seed*.37,k=floor(u),top=-9.;
 for (int i=-1; i<=1; i++) {
  float id=k+float(i),h=psH(id*1.7+seed*13.1),h2=fract(h*57.1);
  float at=(id+.5+.5*(h-.5)-seed*.37)*wide;
  float tall=wide*(.06+.44*h2)*(1.+.12*sin(uTime*(.021+.017*h)+h*40.));
  float d=x-at;
  float lie=d<.0?.72+.4*h:1.1-.35*h2,far=sqrt(d*d+.00012+.05*PS_ROW*wide*wide)-.011-(sqrt(.00012+.05*PS_ROW*wide*wide)-sqrt(.00012));
  if (PS_FLAT>.0) { float st=.085+.05*wide,f=far/st+h; far=mix(far,st*max(floor(f)+psS(.9,1.,fract(f))-h,.0),PS_FLAT); }
  top=psSmax(top,steep*(tall-lie*far*(1.-.28*min(far/wide,1.4))),.02*wide);
 }
 return top;
}
// One skin: h picks which of the fall's three sands it is; the piece and the kinds dye it.
vec3 psSkin(int k,float h,vec3 dye,float a) {
 int f=k % 3;
 a=psS(.02,.5,a);
 if (h<.5) return mix(f==0?psC[4]*.45:psC[f==1?3:5],dye*(f==0?.35:.8),.25*a);
 if (h<.84) return mix(f==0?psC[3]*.8:f==1?psC[4]*.5:psC[2],dye,.9*a);
 vec3 c=f==0?psC[5]:f==1?psC[0]:psC[1]*.7;
 return k>5?c:mix(c,psDye(uKind[k/3]),.9*(k<3?uDrone:uPad));
}
vec3 psPanes(vec2 p) {
 vec4 g=psGrain(p,.0);
 float h=g.w,h2=fract(h*91.3),h3=fract(h*37.7);
 // water before a bright wall, the sun low behind
 float ds=length(p-vec2(.29,.03));
 vec3 wall=psTri(uOwn[4],vec3(.15,.18,.21),vec3(.88,.91,.88),vec3(.36,.64,.7));
 wall=mix(mix(wall,wall*vec3(1.05,.62,.44),psDusk),wall*vec3(.18,.26,.42),psNight);
 vec3 glow=psTri(uOwn[0],vec3(.66,.75,.86),vec3(1.,.79,.5),vec3(1.,.4,.16));
 vec3 col=wall*mix(vec3(1.),vec3(.66,.78,.8),psS(-.1,.5,p.y)*.8)*(1.-.16*psS(.3,1.2,ds));
 col=mix(col,glow,.55*exp(-ds*(3.6-1.2*uSpace)));
 col+=glow*(.08+.16*uLevel)*exp(-ds*5.5);
 col=mix(col,min(glow+vec3(.17,.17+.22*psDusk,.17+.2*psDusk),1.),psS(.125,.085,ds)*(.85+.15*uMic));
 vec3 airless=col;
 // one fall of sand lies on another, in skins along its slope
 float steep=.62*exp2(.9*uOwn[2]),top=-.62-.2*PS_SAND;
 vec3 sand=psC[4]*.5;
 float roof=-.2+.42*exp2(.9*uOwn[2])+.15*uOwn[5];   // no hill is higher
 // a mountain at the left, a gap before the sun
 float land=(.13*exp(-(g.x+.4)*(g.x+.4)*9.)-.07*exp(-(g.x-.3)*(g.x-.3)*16.))*(1.+uOwn[2]);
 if (PS_SAND>.0) land=mix(land,.2*exp(-g.x*g.x*20.)-.17,PS_SAND);
 for (int k=0; k<8&&p.y<roof; k++) {
  float fk=float(k),wide=k==5?1.25:1.-.085*fk;
  vec4 m=piece(vec2(sat(.5+g.x*.42),.93-.1*fk));
  float a=sat(m.a*(.65+uEnergy)),rag=.004*sin(g.x*37.+fk*2.)*sin(g.x*13.);
  float b=psHeaps(g.x+rag,wide,fk+1.,steep*(.8+.5*psH(fk+5.)))-.52-.16*PS_SAND+.06*fk+.04*a+.15*uOwn[5] + land*min(fk*.25,1.);
  float now=max(b,top+(.007+.03*a)*(.55+.45*sin(g.x*3.+fk*2.)));
  if (g.y>top-psG&&g.y<now+.02) {
   float u=(now-g.y)/(.013+.011*psH(fk+.7))+.5*sin(g.x*9.+fk)+.3*(h2-.5),id=floor(u);
   vec3 dye=psDyeOf(m),c=mix(psSkin(k,psH((id-1.)*3.7+fk*17.),dye,a),psSkin(k,psH(id*3.7+fk*17.),dye,a),psS(.0,.2,fract(u)));
   sand=mix(sand,c*(1.-.22*psS(.0,.16,now-g.y)),psIn(g.y-top));
  }
  top=now;
  if (top>g.y+.15) break;      // so deep, nothing above matters
 }
 float deep=top-g.y;
 // the last lies on the ridges like snow; a cue pours another colour there
 float pour=uCue*psS(.75,.2,abs(g.x+.6-1.6*(1.-uCue)));
 vec3 fresh=mix(psDye(uKind[4]),vec3(1.,.8,.45),.35);
 sand=mix(sand,mix(psC[5],psDye(uKind[3]),.75*uPhrase),.85*psS(.022,.006,deep+.01*sin(g.x*14.)+.012*h3));
 sand=mix(sand,fresh,pour*psS(.1,.06,deep+.02*h3));
 // a pinch slides down one slope on a hit
 float run=1.-uHits;
 sand=mix(sand,fresh*1.1,uHits*psS(.27+.08*run,.06,length(vec2(g.x+.36*(1.-.7*(PS_WEAVE+PS_SAND))-.32*run,deep*1.8))+.06*h3));
 sand=mix(sand,psDye(uKind[2]),.8*sat((uTexture*.08-h3)*40.));
 float grain=psDot(g,1.)*(.84+.32*h2);
 sand*=grain*psLamp*psNow(.5+g.x*.42);
 sand=mix(sand,glow,(.5*psS(.02,.0,deep)+.15)*exp(-ds*4.5));
 sand+=psLamp*psGlint(g);
 // a thread of sand for each band
 vec3 air=col;
 if (PS_SAND>.0) {
  float lv=p.y+.05,b=band(fract(lv*1.7+.5)),wd=.004+.005*b+.008*sat(-lv);
  vec3 tc=mix(psC[3],psDye(kindColour(4.*fract(.5+lv*2.+.1*uLoop))),.35)*psLamp;
  air=mix(air,tc,PS_SAND*psS(wd+psPx,wd*.3,abs(p.x+.003*sin(p.y*30.+uTime*.3)))*step(lv,.03)*(.6+.4*sin(p.y*90.+mod(uTime*9.,TAU))));
 }
 float x=p.x+.9,w=1.8/16.;
 for (int i=0; i<2&&deep<psG&&PS_SAND<.9; i++) {
  float k=floor(x/w-.5)+float(i);
  if (k<.0||k>15.) continue;
  float hk=psH(k+2.3),b=uBands[int(k)],fall=max(.5-p.y,.0);
  float at=(k+.5+.6*(hk-.5))*w+(.004*sin(uTime*.4+k)+.003*sin(p.y*9.+k))*fall,d=abs(x-at);
  float beads=.5+.5*sin(p.y*80.+mod(uTime*9.,TAU)+2.5*sin(p.y*23.+k*9.));
  float wide=.0012+.0022*b+.0022*fall,strong=(hk>.7?.55:.0)+.8*b,tone=mod(k,3.);
  vec3 tc=(tone<.5?psC[4]*.6:tone<1.5?psC[3]:psC[2]*.8)*psLamp;
  air=mix(air,tc,sat(strong)*psS(wide+psPx,wide*.2,d)*(.25+.75*beads));
  air=mix(air,tc,.1*sat(strong)*exp(-d*d/(wide*wide*(20.+60.*fall))));
 }
 // the rest lies on a raft of bubbles
 float hang=.455-.2*sat(-uOwn[5])+.06*sat(uOwn[5]);
 float bank=hang+.017+.2*sat(uOwn[5])+.012*sin(g.x*4.);
 vec3 held=mix(psC[3],psC[4]*.5,psS(.35,.6,fract(g.y*22.+.3*sin(g.x*5.)+.3*h2)));
 if (PS_SAND>.0) {
  float lv=g.y+.05,fill=.24-.05*uOwn[5] + .012*sin(g.x*9.)-.1*exp(-g.x*g.x*26.),f=(fill-lv)*13.+.25*h2;
  vec4 m=piece(vec2(sat(.5+g.x),sat(.1+.3*(fill-lv)*8.)));
  held=mix(held,mix(mix(psC[int(5.99*psH(floor(f)+3.))],psC[2],psS(.8,1.,fract(f))),psDyeOf(m),.85*psS(.02,.5,m.a)),PS_SAND);
  bank=mix(bank,lv>.0&&lv<fill?g.y-psG:9.,step(.02,PS_SAND));
 }
 air=mix(air,held*grain*psLamp,psIn(g.y-bank));
 if (deep<psG&&p.y>hang-.2&&p.y<hang+.06) {
  const float cs=.074;
  vec2 q=vec2(p.x+.02*sin(uTravel*.06),(p.y-hang)/.9)/cs;
  float ry0=floor(q.y+.5);
  for (int j=-1; j<=1; j++) {
   float ry=ry0+float(j),odd=.5*mod(ry+8.,2.);
   if (ry>.5||ry<-2.5) continue;
   float bx0=floor(q.x-odd+.5);
   for (int i=-1; i<=1; i++) {
    float bx=bx0+float(i),hb=hash21(vec2(bx,ry)+91.);
    vec2 c=vec2(bx+odd,ry)+.22*(vec2(hb,fract(hb*31.7))-.5);
    float keep=psS(-.02,.03,c.y*.067+.07+.055*sin(c.x*.35+.6)+.04*sin(c.x*.9));
    float r=(.36+.17*fract(hb*77.))*keep*(1.-PS_SAND);
    if (r<.03) continue;
    vec2 n=(q-c)/r;
    float l=length(n),aa=psPx/(cs*r)*1.5;
    vec3 bc=mix(col,vec3(1.)*max(max(wall.r,wall.g),wall.b),.3)+glow*.16*sat(-n.y);
    bc=mix(bc,wall*vec3(.2,.24,.26),psS(.8,.98,l)*.85);
    bc=mix(bc,glow,.6*psS(.1,.0,abs(l-.74))*psS(.3,1.,dot(n,vec2(.45,-.89))));
    bc=mix(bc,vec3(1.),(1.-.6*psNight)*.8*psS(.2,.04,length(n-vec2(-.42,.42))));
    air=mix(air,bc,psS(1.+aa,1.-aa,l)*keep);
   }
  }
 }
 if (PS_SAND>.0) { float dp=PS_SAND*uHits*psS(.24,.06,length(vec2(g.x,g.y+.2+.15*run))+.05*h3); sand=mix(sand,fresh*1.2,dp); air=mix(air,fresh*1.2,dp*psS(.02,.005,abs(p.x))); }
 col=mix(air,sand,psIn(deep)*(1.-PS_SAND*psIn(g.y+.09)));
 if (PS_SAND>.0) {
  // the two bulbs, and the wood they stand in
  vec2 q=vec2(abs(p.x),p.y+.05);
  float t=sat(abs(q.y)/.43),w=.012+.32*psS(-.03,.8,t)*(1.+.4*(1.-t))*sqrt(max(1.-pow(max(t-.5,.0)/.505,2.4),.0))+2.5*(1.-PS_SAND);
  float out1=max(q.x-w,q.y-.44-2.*(1.-PS_SAND)),plate=max(q.x-.36,abs(abs(q.y)-.455)-.026)+2.*(1.-PS_SAND),post=max(abs(q.x-.405)-.011,abs(q.y)-.44)+2.*(1.-PS_SAND);
  plate=max(q.x-.44,abs(abs(q.y)-.455)-.026)+2.*(1.-PS_SAND);
  vec3 wood=mix(psC[4],psC[3],.4+.3*noise(p*vec2(8.,90.)))*psLamp*.55;
  float table=psCut(p.y+.53+2.*(1.-PS_SAND));
  vec3 back=mix(airless,mix(wall*.45,wood,.6)*(.8+.3*noise(p*vec2(3.,60.)))+glow*.35*exp(-abs(p.x-.29)*5.),table);
  col=mix(col*mix(vec3(.94),vec3(1.),psS(.0,.12,-out1)),back,psCut(-out1));
  col=mix(col,wall*.35,.75*step(abs(q.y),.44)*psS(.005+psPx,.0,abs(out1)));
  col+=psLamp*.4*psS(.005,.0,abs(out1+.014))*step(abs(q.y),.43)+psLamp*.3*psS(.012,.006,abs(p.x+w*.72))*psS(.16,.05,abs(abs(q.y)-.22))*step(out1,.0);
  col=mix(col,wood*(1.+.5*psS(.02,-.02,plate+.01)*step(.0,p.y+.05-.46)),psCut(min(plate,post)));
 }
 if (PS_WEAVE>.0) {
  // a round pane
  float ra=length(p-vec2(.0,-.05))-mix(1.5,.43,psS(.0,1.,PS_WEAVE));
  vec3 paper=wall*(.97-.12*p.x-.1*p.y)*psLamp*(1.-.5*exp(-max(length(p-vec2(-.03,-.085))-.46,.0)*12.));
  vec3 ring=mix(psC[4]*.4,psC[4] + .25,sat(.5+12.*(ra-.014)*dot(normalize(p+vec2(1e-4,.05)),vec2(-.6,.8))))*psLamp;
  col*=1.-.4*psS(-.05,.0,ra);
  col=mix(col,ring,psCut(-ra));
  col=mix(col,paper,psCut(.03-ra));
 }
 // the frame, seen from far off
 vec2 fq=abs(p)-vec2(1.27,.6);
 float fr=length(max(fq,.0))+min(max(fq.x,fq.y),.0);
 if (fr>-.01) {
  col=mix(col,mix(.09*psLamp,wall*(.92-.35*exp(-max(fr-.045,.0)*14.)),psCut(.045-fr)),psCut(-fr));
 }
 return col;
}
vec3 render(vec2 p) {
 psNight=sat(-uOwn[0]); psDusk=sat(uOwn[0]); psDim=1.-.25*psNight;
 psLamp=psTri(uOwn[0],vec3(.3,.38,.56),vec3(1.,.985,.96),vec3(1.06,.82,.6));
 for (int i=0; i<6; i++) psC[i]=mix(psAshen(psPlain[i]),psDyed[i],sat(uOwn[1]));
 float asp=uRes.x/uRes.y,zoom=clamp(.95/asp,1.,1.8)*exp2(uOwn[3]*(uOwn[3]<.0?.9:.5));
 vec2 eye=uVar<.5?vec2(-.06,.06):vec2(.0,-.05);
 p=(p-eye)*zoom+eye;
 if (PS_ROW>.0&&uVar<.5) { zoom*=1.+1.5*PS_ROW; p=p*(1.+1.5*PS_ROW)-vec2(.2,.36)*PS_ROW; }
 psPx=.75*zoom/uRes.y;
 psG=uVar<.5?.0062*(1.+.9*PS_ROW):.0054;
 return sat(uVar<.5?psBottle(p):psPanes(p));
}
