// name: Moon terrace
// a: First rain
// b: Moonrise
// what: Watercolour on burnished paper: a white house low down, its front, sides and roof all turned to us, a garden laid open, a pink cloth cut by the frame, a wide slate-green sky with a pearled roll of rain cloud and egrets; or the same house small over a night lake, a great round moon, its path in fine strokes, lamp boats, lotus.
// follows: The drone deepens the field, the pad lowers the cloud or spreads the moon's halo, texture rain or strokes on the lake, a phrase brings egrets or lights the boats. Bands swell the scallops; the piece colours cushions and lamps. A hit is a thread of lightning or a ring in the water, a cue lights every window, keys the pavilions, the loop moves egrets or moon.
// own: 0 a yellow sky at -1, a brick-red dusk at 1 (at night a grey dawn, or copper dark); 1 no cloud at -1, cloud over most of the sky at 1 (a small moon, or a huge one); 2 the house far off at -1, near at 1; 3 bare dry ground at -1, a full garden at 1 (no lotus, or lotus across the water); 4 bare paper at -1, lapis and gold at 1; 5 the house cut by the left edge at -1, over at the right at 1 (fewer boats, or all); 6 one great tree in place of the house at -1, painted rocks piled high behind it at 1; 7 paper kites aloft, or fireworks, at -1, all seen through a scalloped arch at 1
float mtPx,mtHw,mtN; // one pixel, half the width, how strongly it answers
const vec3 mtWh=vec3(.935,.915,.86);
vec3 mtAmb,mtInk,mtF; // the light on paint, the drawn line, the pale fine line
// A soft step, that may run either way.
float mtM(float a,float b,float x){ x=sat((x-a)/(b-a)); return x*x*(3. - 2.*x); }
float mtI(float d){ return sat(.5 - d/mtPx); }
float mtL(float d,float w){ return sat(.5+(w-abs(d))/mtPx)*min(1.,.25+2.*w/mtPx); }
// A line repeated every T along s.
float mtR(float s,float T,float w){ return mtL((fract(s/T)-.5)*T,w); }
float mtBox(vec2 q,vec2 lo,vec2 hi){ vec2 d=max(lo - q,q - hi); return max(d.x,d.y); }
float mtSeg(vec2 q,vec2 a,vec2 b){ vec2 d=b - a; return length(q - a - d*sat(dot(q-a,d)/dot(d,d))); }
void mtY(inout vec3 c,vec3 k,float m){ c=mix(c,k*mtAmb,sat(m)); }
void mtE(inout vec3 c,float m){ c=mix(c,mtInk,sat(m)); }
void mtS(inout vec3 c,vec3 k,float d){ mtY(c,k,mtI(d)); mtE(c,.75*mtL(d,.0007)); }

// The plain field, in broad strokes.
vec3 mtField(vec2 p){
 float o=abs(uOwn[0]),dr=uDrone*mtN;
 bool am=uOwn[0]<0.,day=uVar<.5;
 vec3 hi=day?vec3(.325,.415,.385) : vec3(.085,.125,.265),lo=day?vec3(.58,.6,.48) : vec3(.165,.235,.4);
 hi=mix(hi,day?am?vec3(.8,.6,.24) : vec3(.64,.29,.22) : am?vec3(.5,.52,.58) : vec3(.22,.095,.085),o);
 lo=mix(lo,day?am?vec3(.9,.76,.42) : vec3(.85,.56,.4) : am?vec3(.76,.69,.66) : vec3(.4,.19,.13),o);
 hi=mix(hi,uOwn[4]<0.?vec3(.8,.745,.63) : vec3(.055,.085,.2),abs(uOwn[4]));
 lo=mix(lo,uOwn[4]<0.?vec3(.86,.805,.69) : vec3(.09,.14,.29),abs(uOwn[4]));
 float g=exp(-(day?max(p.y+.3,0.) : abs(p.y-.02))*(5.6-3.*uSpace));
 vec3 c=mix(hi,lo,g)*(1. - .2*dr*(1.-.6*g));
 c=mix(c,c*(.75+.5*uKind[0]),.35*dr);
 float st=noise(vec2(p.x*1.3+3.,p.y*30.+.6*sin(p.x*3.))),sh=p.x*.55+p.y - .08 - .16*sin(uTime*.021);
 float fine=.5+.5*sin(p.y*260.+5.*st+p.x*9.);
 return c*(.945+.06*st+.02*fine+.05*sin(p.x*2.1+2.*sin(p.y*3.))+.1*(.6+.8*uTone)*exp(-9.*sh*sh)+.045*(hash21(floor(p*300.))-.5));
}

// Stepped battlements along s: how high they stand here, 0 to 1.
float mtMer(float s,float T){
 vec3 m=sat(.5+(vec3(.84,.58,.3)-abs(fract(s/T)-.5)*2.)*.5*T/mtPx);
 return dot(m,vec3(.33));
}
void mtWall(inout vec3 c,vec2 q,vec2 x,float lo,float hi){
 float d=max(max(lo-q.y,q.y-hi-.013*mtMer(q.x,.0286)),max(x.x-q.x,q.x-x.y));
 mtS(c,mtWh*.97,d);
 mtE(c,.45*mtI(d)*max(mtL(q.y-hi+.005,.0006),mtL(q.y-lo-.008,.0006)));
}
// An arched opening.
float mtArch(vec2 q,float w,float h){
 float y=max(q.y - h,0.);
 return max(length(vec2(abs(q.x)+.22*y,.72*y)) - w,-q.y);
}

// A pavilion: a dome on one, a bowed roof on the other.
void mtPav(inout vec3 c,vec2 q,bool dome,float lit){
 const float w=.066,h=.078;
 float ax=abs(q.x),y=q.y - h - .011,cell=w*.667,bx=(fract(q.x/cell+.5) - .5)*cell;
 float room=mtBox(q,vec2(-w,0.),vec2(w,h)),in1=mtI(room);
 mtY(c,dome?vec3(.29,.36,.3) : vec3(.42,.25,.18),in1);
 c=mix(c,vec3(1.,.74,.36),in1*lit*(.5+.45*exp(-ax*22.)));
 mtY(c,dome?vec3(.72,.24,.17) : vec3(.27,.38,.45),in1*mtI(.052-q.y));
 mtS(c,mtWh,max(room,-mtArch(vec2(bx,q.y),cell*.5-.004,.047)));
 mtS(c,mtWh,max(abs(abs(bx)-cell*.5)-.0036,mtBox(q,vec2(-w-.005,.0),vec2(w+.005,.05))));
 float rail=mtBox(q,vec2(-w-.008,-.009),vec2(w+.008,.019));
 mtS(c,mtWh*.97,rail);
 float d;
 if (dome){
  mtS(c,mtWh,mtBox(vec2(q.x,y),vec2(-.047,0.),vec2(.047,.011)));
  y -= .011;
  d=y<.016?max(ax - .041 - .28*y+9.*y*y,-y) : length(vec2(ax+.25*(y-.016),(y-.016)*.74)) - .0432;
  mtS(c,mix(mtWh,vec3(.68,.7,.7),mtM(.01,-.045,q.x)),d);
  y -= .061;
 } else {
  float top=.056 - 7.5*ax*ax,low=-3.4*ax*ax - .001;
  d=max(max(y-top,low-y),ax - w - .024)*.8;
  mtS(c,mix(vec3(.83,.63,.27),vec3(.62,.36,.19),mtM(top,low,y)),d);
  y -= .053;
 }
 mtE(c,.2*mtI(d)*mtR(q.x*(1.+60.*ax*ax),.0125,.0006));
 mtS(c,mtWh,max(mtBox(q,vec2(-1.,h),vec2(1.,h+.011)),ax-w-.026+(q.y-h)*1.4));
 mtY(c,vec3(.92,.72,.28),mtI(min(mtBox(vec2(q.x,y),vec2(-.0012,0.),vec2(.0012,.03)),length(vec2(q.x,y-.009))-.005)));
}

// The house, laid open.
void mtPalace(inout vec3 c,vec2 q,float rest){
 float a=abs(q.x),v=q.y,lit=sat(rest+1.2*uCue);
 if (a>.41||v<-.02||v>.62) return;
 vec3 room=mix(vec3(.19,.14,.14)*mtAmb,mix(vec3(1.,.8,.4),uKind[1],.2),lit);
 mtWall(c,q,vec2(-.33,.33),.2,.25);
 // the terrace, its carpet, the cushions of the piece
 float wf=.2+1.3*(v - .13),fl=max(max(.13-v,v-.232),(a-wf)*.61);
 mtS(c,vec3(.8,.765,.69)*(.94+.5*(v-.13)),fl);
 float cw=.135+.9*(v - .165),car=max(max(.163-v,v-.212),(a-cw)*.74);
 mtS(c,vec3(.66,.22,.17),car);
 mtY(c,vec3(.22,.34,.4),mtI(car+.006));
 mtY(c,vec3(.86,.72,.42),.7*mtI(car+.008)*mtM(.2,.1,length(fract(vec2(q.x/max(cw,.05)*11.,(v-.163)*95.))-.5)));
 float ci=clamp(floor(q.x/.045),-3.,2.)+.5;
 vec2 k=q - vec2(.045*ci,.188+.005*sin(ci*2.4));
 vec4 pc=piece(vec2(ci/6.+.5,.7));
 float cu=max(length(k*vec2(1.,1.5)) - .0125 - .006*pc.a,abs(k.y) - .0085 - .004*pc.a);
 mtS(c,mix(ci<-1.?vec3(.8,.62,.3) : ci<1.?vec3(.78,.36,.3) : vec3(.56,.62,.5),pc.rgb/max(pc.a,.05),.8*pc.a),cu);
 vec2 b=vec2(q.x - (q.x<0.?-.245 : .245),v - .2);
 mtPav(c,b,q.x<0.,sat(lit+.7*(uMic+uKeys)));
 float u=a - .2,sv=v - .77*max(u,0.);
 float T=u>0.?.065 : .08,wx=u>0.?(fract(u/T) - .5)*T : (fract(q.x/T+.5) - .5)*T;
 bool door=u<0.&&a<.04;
 float d=max(max(-sv,sv-.134-.017*mtMer(u>0.?u : q.x,u>0.?.026 : .0333)),a - .33);
 vec3 stone=u<0.?mtWh*(.96+.3*v) : (q.x<0.?vec3(.68,.69,.68) : vec3(.83,.79,.7))*(.95+.5*u);
 mtS(c,stone,d);
 float in1=mtI(d);
 c=mix(c,vec3(1.,.78,.45),in1*(.28*uCue+.06*rest)*(1.-sat(sv*5.)));
 mtE(c,in1*max(.7*mtL(u,.0008),.5*max(mtL(sv-.126,.0007),max(mtL(sv-.112,.0007),mtL(sv-.012,.0007)))));
 vec2 dm=abs(vec2((fract(q.x*60.)-.5)/60.,sv-.119));
 mtY(c,vec3(.7,.26,.18),in1*mtI(dm.x+dm.y-.0042));
 vec2 w=vec2(wx,sv - (door?.012 : .028));
 float fr=mtBox(w,vec2(-.025,-.005),vec2(.025,door?.092 : .076)),win=mtArch(w,u>0.?.0135 : .0175,door?.055 : .042);
 mtY(c,vec3(.86,.8,.66),.8*mtI(fr)*step(u,0.));
 c=mix(c,room,mtI(win)*in1);
 if (door) mtY(c,vec3(.5,.3,.17),mtI(win+.003)*step(.003,abs(wx))*(1.-.8*lit));
 else mtY(c,stone,mtI(max(win,w.y-.018))*in1*(.3+.7*mtR(q.x,.0055,.0012)));
 mtE(c,.7*mtL(win,.0008)*in1);
 // lamps along the front, for the parts of the piece
 float li=clamp(floor(q.x/.0333),-6.,5.)+.5;
 vec2 lq=q - vec2(li*.0333,.158);
 pc=piece(vec2(li/12.+.5,.42));
 vec3 lc=mix(vec3(1.,.8,.45),pc.rgb/max(pc.a,.05),.5);
 c=mix(c,mix(lc,vec3(1.),.3),mtI(length(lq*vec2(1.7,1.)-vec2(0.,.003))-.0035-.005*pc.a)*sat(pc.a*2.+.5*rest));
 c += lc*pc.a*(.12+.25*uEnergy)*exp(-dot(lq,lq)*1600.);
}

// A tree: kind 0 a cypress, 1 a banana, 2 a round crown.
void mtTree(inout vec3 c,vec2 q,float h,float kind,float seed){
 if (h<.01||abs(q.x)>h*.75||q.y<-.01||q.y>h*1.15) return;
 q.x += .036*sin(uTime*.37+seed*9.)*(1.+1.5*uLow)*q.y*q.y/h;
 vec2 k=q - vec2(0.,kind<1.5?h*.46 : h*.66);
 float an=atan(k.x,k.y+1e-5),r=length(k),d,t=sat(q.y/h);
 mtY(c,kind<1.5&&kind>.5?vec3(.52,.56,.36) : vec3(.34,.24,.18),mtI(mtBox(q,vec2(-.0055,-.004),vec2(.0055,h*(kind<.5?.1 : .5)))));
 if (kind<.5){
  d=max(abs(q.x) - .2*h*sqrt(t)*(1.-t*t)*(1.3-.4*t),q.y - h)*.9;
  mtY(c,mix(vec3(.1,.19,.15),vec3(.2,.33,.22),mtM(-.1,.1,q.x/h)),mtI(d));
 } else if (kind<1.5){
  // its leaves droop
  float bend=an - sign(an)*1.15*r/h*abs(an)*.8,id=clamp(floor(bend/.44+.5),-3.,3.);
  float L=h*(.56+.14*hash11(seed*3.+id)),w=(bend - id*.44)*r;
  t=sat(r/L);
  d=max(abs(w) - .2*h*sqrt(t*(1.-t)),r - L)*.8;
  mtY(c,mix(vec3(.24,.4,.22),vec3(.5,.62,.3),.6*hash11(seed+id*1.7)+.4*step(0.,w)),mtI(d));
  mtE(c,.6*mtL(d,.0006));
  mtY(c,vec3(.78,.82,.52),mtI(d)*mtL(w,.0008));
 } else {
  d=r - h*(.36+.025*sin(an*7.+seed*5.));
  mtY(c,vec3(.13,.22,.15),mtI(d));
 }
 // small leaves laid light on dark
 if (kind<.5||kind>1.5){
  vec2 g=k*vec2(kind<.5?160. : 92.,kind<.5?70. : 92.);
  g.x += .5*floor(mod(g.y,2.));
  vec2 id=floor(g),o=rot(1.5*(hash21(id+seed)-.5)+(kind<.5?-2.*k.x/h : an))*(fract(g) - .5);
  float up=sat(.5+1.3*(k.y*.6+.5*k.x)/h);
  mtY(c,mix(vec3(.2,.33,.2),vec3(.48,.57,.31),up*(.5+.5*hash21(id))),mtI(d+.002)*mtM(.1,-.15,length(o*vec2(2.2,1.))-.42));
 }
}

// A lotus from the side, its petals fanned out as it opens.
void mtLotus(inout vec3 c,vec2 q,float r,float open){
 if (abs(q.x)>r*1.3||q.y<-.25*r||q.y>r*1.3) return;
 float an=atan(q.x,q.y+1e-5),l=length(q);
 for (int row=0; row<2; row++){
  float off=row == 0?.5 : 0.,st=(row == 0?.6 : .56)*open,id=floor(an/st+off+.5) - off;
  id=clamp(id,-2.+off,2. - off);
  float L=r*(row == 0?1.12 : .95)*(1. - .05*abs(id)),w=(an - id*st)*l,t=sat(l/L);
  float d=max(abs(w) - r*.5*sqrt(t)*(1.-t*t),l - L);
  float e=min(abs(an/st-id)*2.,1.);
  mtY(c,mix(vec3(.97,.89,.83),vec3(.86,.38,.46),t*t*.8+.05+.35*e*e*e*e),mtI(d));
  mtE(c,.6*mtL(d,.001)*step(l,L));
 }
}

// How low the cloud hangs.
float mtRoll(float x){
 float u=x/mtHw,g=uOwn[1],s=sin(u*3.6+.4);
 return .25+clamp(mtHw/.8,.35,1.)*(.4*mtM(-.95,.75,u)+.16*mtM(.3,1.1,u) - .15*sqrt(s*s+.08)) - .085*uPad*mtN+(g<0.?-.62*g : -.3*g*(1.+.5*mtM(-.5,1.,u)));
}
// The rolled rain cloud: pouches with pale edges and pearls. n: how far in.
void mtCloud(inout vec3 c,float x,float n,float roll){
 float lean=(mtRoll(x+.01) - roll)*100.,sz=.135*clamp(mtHw/.89,.55,1.1),creep=.02*sin(uTime*.017),low=floor(n/(sz*.46)+1.3),cover=mtI(sz*.3 - n),row=low,hh=.5,b=0.;
 if (low<0.) return;
 vec3 top=vec3(0.,9.,-9.);
 for (int j=0; j<4; j++){
  float fr=low - 1.+floor(float(j)*.5),shift=creep*(1.+.4*sin(fr))+fr*.437*sz;
  float id=floor((x+shift)/sz - .5)+mod(float(j),2.),h=hash21(vec2(id+80.,fr+2.)),bb=fr<1.?uBands[int(mod(2.*id+64.,16.))] : uBands[int(mod(2.*id+65.,16.))];
  vec2 o=vec2(x+shift - (id+.5+.24*(h-.5))*sz,n - (fr*.46+.25+.2*(h-.5))*sz);
  o.y += lean*o.x;
  float rr=sz*(.5+.25*h+.13*bb*mtN+.02*sin(uTime*.11+h*40.)),d=o.y>0.?abs(o.x) - rr : length(o) - rr;
  if (fr<0.) d=1.;
  cover=max(cover,mtI(d));
  if (d<0.){ top=vec3(atan(o.x,-o.y+1e-5),rr,d); row=fr; hh=h; b=bb; }
 }
 float t=-top.z/top.y,deep=exp(-.5*row),dn=mtM(1.75,1.1,abs(top.x));
 vec3 dark=mix(mix(vec3(.15,.18,.215),uKind[1]*.4,.2+.2*uPad*mtN),vec3(.43,.41,.39),.8*max(-uOwn[4],0.));
 vec3 k=mix(dark*(.8+.3*deep)+.03*hh,mix(vec3(.45,.49,.51),vec3(.62,.6,.5),.3+.4*hh),exp(-t*4.5)*(.12+.7*deep)*dn);
 float line=mtL(top.z+.0022,.0011)+(.45*mtL(.1*(t-.2),.0008)+.35*mtL(.1*(t-.36),.0007)+.25*mtL(.1*(t-.52),.0006))*mtM(1.4,.8,abs(top.x));
 float bead=length(vec2((fract(top.x*top.y/.0085)-.5)*.0085,top.z+top.y*.1)) - .0013;
 // a hit runs along the roll as a gold lining
 float run=sat(exp(-abs(x-mtHw*(.15-.8*(1.-uHits)))*5.)*uHits+.8*uCue*exp(-row));
 k=mix(k,vec3(1.,.8,.4),.45*run*exp(-t*4.)*dn);
 k=mix(k,mix(mtF*mtAmb,vec3(1.,.8,.38),run),sat(max(line,.8*mtI(bead)))*dn*(.05+.8*deep+.4*b+.15*uTone));
 c=mix(c,k,cover);
}

// An egret far off: s turns it from flying one way to the other.
void mtEgret(inout vec3 c,vec2 q,float s,float flap,float on){
 float ax=abs(q.x);
 vec2 h=vec2(q.x*s,q.y);
 float wing=max(abs(q.y-ax*(.5+.3*flap)+ax*ax*(11.+7.*flap)) - .004*sqrt(sat(1.-ax/.045)),ax - .045);
 float body=min(length(h*vec2(.36,1.)) - .0042,mtSeg(h,vec2(.008,.001),vec2(.026,.004)) - .0016);
 mtY(c,vec3(.97,.965,.93),on*max(mtI(wing),max(mtI(length(q)-.0045),abs(s)*mtI(max(body,ax-.03)))));
}

// A boat with a small bowed awning and a lamp at its prow.
void mtBoat(inout vec3 c,vec2 q,float lamp,float on){
 float x2=q.x*q.x,ax=abs(q.x),top=.004+3.*x2+16.*x2*ax;
 float hull=max(max(q.y-top,4.6*x2-.016-q.y)*.75,ax - .098);
 float aw=max(max(q.y-.055+11.*x2,.036-8.*x2-q.y)*.8,ax - .046);
 mtY(c,vec3(.85,.8,.7),on*mtI(max(abs(ax-.036)-.0011,abs(q.y-.017)-.017)));
 mtY(c,vec3(.8,.29,.21),on*mtI(aw));
 mtY(c,vec3(.93,.83,.58),on*mtI(aw)*mtR(q.x,.0167,.0012));
 mtY(c,vec3(.62,.45,.28),on*mtI(hull));
 mtY(c,vec3(.92,.82,.6),on*mtI(hull)*mtL(q.y-top+.006,.0012));
 mtE(c,on*.75*max(mtL(hull,.0008),mtL(aw,.0008)));
 vec2 l=q - vec2(.088,.082);
 mtE(c,on*mtI(max(abs(l.x)-.0008,abs(l.y+.02)-.02)));
 vec3 warm=mix(vec3(1.,.8,.42),uKind[3],.22)*lamp*on;
 c=mix(c,mix(vec3(.55,.42,.25)*mtAmb,vec3(1.,.9,.62),lamp),on*mtI(length(l*vec2(1.3,1.))-.007));
 float g=max(1. - dot(l,l)*140.,0.),y=-.02 - q.y;
 c += warm*(.3*exp(-dot(l,l)*900.)+.14*g*g);
 c += warm*.5*step(0.,y)*exp(-max(y,0.)*26.)*mtM(.011+.1*y,0.,abs(l.x+.004*sin(q.y*260.+uTime*.7)))*mtM(-.1,.5,sin(q.y*620.));
}

// A great tree: a trunk that parts, hanging roots, a crown of many heaps of leaves.
void mtGreat(inout vec3 c,vec2 q,float h){
 if (h<.02||abs(q.x)>h*.95||q.y>h*1.25) return;
 q /= h; float px=mtPx; mtPx /= h;
 q.x += .006*sin(uTime*.31)*(1.+uLow)*q.y;
 float tr=mtSeg(q,vec2(0.,-.02),vec2(.02,.34)) - .055+.06*q.y - .05*exp(-max(q.y,0.)*22.);
 vec2 b=vec2(abs(q.x-.02),q.y);
 tr=min(tr,min(mtSeg(b,vec2(0.,.3),vec2(.28,.56)) - .026,mtSeg(b,vec2(0.,.34),vec2(.1,.75)) - .024));
 mtS(c,mix(vec3(.5,.42,.36),vec3(.3,.23,.2),mtM(-.03,.05,q.x)),tr);
 mtE(c,.35*mtI(tr)*mtR(q.x+.03*sin(q.y*21.),.021,.001));
 float lo=.42 - .24*hash11(floor(q.x/.037)+3.);
 mtY(c,vec3(.4,.32,.26),mtI(max(abs((fract(q.x/.037)-.5)*.037+.004*sin(q.y*30.)) - .0026,max(max(lo-q.y,q.y-.62),abs(q.x)-.45))));
 float d=1.,up=0.,wh=0.;
 for (int i=0; i<11; i++){
  float f=float(i),t=f*2.4,r=.16+.05*hash11(f+2.);
  vec2 o=(q - vec2(.02,.68) - vec2(cos(t),.62*sin(t))*.5*sqrt(f/10.));
  float an=atan(o.y,o.x+1e-5),e=length(o) - r - .012*sin(an*9.+f) - .012*uBands[i];
  if (e<0.||e<d){ if (e<0.||d>0.){ up=sat(.5+(o.y*.8+o.x*.35)/r*.6); wh=f; } d=min(d,e); }
 }
 mtY(c,vec3(.11,.19,.13),mtI(d));
 vec2 g=q*31.+wh*.37; g.x += .5*floor(mod(g.y,2.));
 vec2 id=floor(g); float hs=hash21(id+7.);
 vec2 o=rot(2.2*(hs-.5))*(fract(g)-.5);
 mtY(c,mix(vec3(.17,.3,.17),vec3(.55,.6,.3),up*up*(.4+.6*hs)),mtI(d+.004)*mtM(.1,-.14,length(o*vec2(2.3,1.))-.42));
 vec4 pc=piece(vec2(sat(q.x/1.4+.5),sat(1.3-q.y)));
 mtY(c,mix(vec3(.93,.62,.36),pc.rgb/max(pc.a,.05),.8*sat(pc.a*2.)),mtI(d+.012)*step(.86-.2*pc.a-.3*uHits*exp(-abs(q.y-.68)*3.),fract(hs*31.))*mtM(.36,.22,length(fract(g)-.5-.35*(vec2(hs,fract(hs*57.))-.5))));
 c += uKind[4]*.4*uHits*mtI(d)*exp(-3.*abs(length(q-vec2(0.,.68))-.6*(1.-uHits)));
 mtPx=px;
}
// Rocks heaped in rows, each row in front of a higher one, edged pale.
void mtRocks(inout vec3 c,vec2 p,float base,float k){
 for (int j=9; j >= 0; j--){
  float fr=floor(float(j)*.5),T=.15+.035*fr,x=p.x/T+fr*.37+.5*mod(float(j),2.),id=floor(x),u=(x - id - .5)*2.,h=hash21(vec2(id,float(j)+4.));
  float rise=.55+.45*sin(fr*1.3+id*T*2.6+1.2);
  float top=base+k*(.03+fr*.088*rise+.05*h) - .02,d=(p.y - top+T*(.5*u*u+.34*u*u*u*u))*.7 - .006*sin(p.y*70.+h*20.);
  vec3 a=h<.3?vec3(.83,.56,.5) : h<.6?vec3(.72,.6,.68) : h<.8?vec3(.86,.74,.52) : vec3(.56,.63,.55);
  float b=uBands[int(mod(id*3.+float(j)+64.,16.))]*mtN;
  a=mix(a,uKind[j/2]*.8+.15,.3)*(.94+.3*b);
  float m=mtI(d)*step(.001,k);
  mtY(c,a*(uVar<.5?1. : .62)*(.62+.38*exp(d*9.))+.03*noise(p*vec2(40.,9.)+h*9.),m);
  mtY(c,mix(a,vec3(.97,.93,.85),.75),m*(1.+.8*b)*(.8*mtL(d+.004,.0014)+.4*mtL(d+.017,.0008)+.25*mtL(d+.033,.0007)));
  mtE(c,.7*mtL(d,.0009)*step(.001,k));
  mtY(c,vec3(.24,.36,.22),m*mtM(.67,.77,noise(p*vec2(105.,130.)+h*30.))*mtM(-.06,-.006,d)*step(.45,h));
 }
}
// Paper kites on their threads.
void mtKites(inout vec3 c,vec2 p,float k){
 for (int i=0; i<7; i++){
  float f=float(i),g=fract(f*.618+.2),s=(.05+.03*fract(f*.37))*k;
  vec2 at=vec2((-.8+1.65*g)*mtHw+.03*sin(uTime*.13+f*2.),.02+.4*fract(f*.414+.25)+.02*sin(uTime*.19+f)),o=rot(.3*sin(f*3.)+.12*sin(uTime*.37+f*1.7))*(p - at);
  mtY(c,vec3(.96,.93,.86),.7*k*mtL(o.x+.25*o.y*o.y - .1*o.y*sin(f),.0006)*step(o.y,0.)*mtM(-.9,-.2,o.y));
  float d=(abs(o.x)+abs(o.y)*.86 - s)*.75;
  vec3 a=mix(uKind[i % 5],vec3(.95,.85,.7),.25);
  mtS(c,o.x>0.?a : mix(a,vec3(.97,.94,.88),.75),d);
  mtE(c,.6*mtI(d)*max(mtL(o.x,.0009),mtL(o.y+6.*o.x*o.x,.0008)));
  vec2 t=o - vec2(.008*sin(o.y*60.+uTime*1.1),-s*1.16);
  mtY(c,a,mtI(max(abs(t.x) - .003 - .006*abs(fract(t.y*28.)-.5),abs(t.y+s*.6) - s*.6)));
 }
}
// Fireworks: flowers of gold grains that open and sink.
vec3 mtFire(vec2 p){
 vec3 l=vec3(0.);
 for (int i=0; i<6; i++){
  float f=float(i),w=uTime*.055+f*.171,cy=floor(w),t=w - cy,h=hash21(vec2(f,mod(cy,97.)+3.)),R=(.12+.1*fract(h*37.))*(1. - exp(-5.*t));
  vec2 o=p - vec2((-.75+1.5*fract(f*.618+.3*h))*mtHw,.12+.28*fract(h*91.) - .06*t*t);
  float r=length(o); if (r>R+.03) continue;
  float n=14.+8.*fract(h*7.),a=atan(o.x,o.y)/TAU*n+h*9.,da=(fract(a)-.5)/n*TAU*r;
  float dot_=0.;
  for (int j=0; j<3; j++){ float q=R*(1. - .3*float(j)); dot_ += exp(-(da*da+(r-q)*(r-q))/(.000012+.000012*float(3-j)))*(1. - .2*float(j)); }
  dot_ += .4*exp(-da*da*160000.)*mtM(.1*R,R,r);
  l += .62*mix(uKind[i % 5],vec3(1.,.74,.36),.6)*dot_*mtM(0.,.12,t)*mtM(1.,.45,t)*(.75+.5*uBands[i*2]*mtN+.6*uHits);
 }
 return l;
}
// The arch all is seen through, with a pierced rail below.
vec3 mtFrame(vec3 c,vec2 p,float k){
 mtPx=1./uRes.y;
 float W=mix(1.5,.66,k)*max(mtHw,.4)/.89,y0=.02,an=atan(p.x,max(p.y-y0,0.)+1e-5);
 float R=W*(1. - .34*k*pow(abs(cos(an)),1.5)),cusp=.045*W*abs(cos(an*4.5));
 float d=p.y>y0?(length(p-vec2(0.,y0)) - R - cusp)*.9 : abs(p.x) - W - .032*W;
 bool day=uVar<.5;
 vec3 st=mix(day?vec3(.63,.3,.22) : vec3(.1,.085,.13),uKind[1]*(day?.7 : .22),.3),pale=day?vec3(.93,.83,.66) : mix(vec3(.75,.55,.3),mtF,.2);
 vec2 g=(p+.004*sin(p.yx*40.))*15.,e=abs(fract(g)-.5); float fl=length(e) - .3 - .1*cos(4.*atan(e.y,e.x+1e-4));
 vec3 w=st*(.93+.1*noise(p*vec2(9.,60.)));
 w=mix(w,mix(st,pale,.3),mtI(fl/15.)*mtM(.06,.09,d));
 w=mix(w,pale,.9*max(max(mtL(d-.012,.0022),mtL(d-.05,.0016)),mtI(length(vec2((fract(an*18.+p.y*(p.y>y0?0. : 18.))-.5)*.03,d-.031))-.007)));
 w *= .75+.25*mtM(0.,.02,d);
 c=mix(c,w,mtI(-d));
 float ry=p.y+.5; vec2 t=vec2(p.x,ry)*19.,s=abs(fract(t)-.5),v=abs(fract(t+.5)-.5);
 float ja=min(abs(s.x+s.y-.5)-.07,abs(max(s.x,s.y)-.36)-.05)/19.,rail=max(ry-.13*k,-ry);
 c=mix(c,w*(day?1.1 : 1.2),mtI(max(rail,ja)));
 return mix(c,mix(st,pale,.35),mtI(abs(ry-.135*k)-.009)*step(.01,k));
}
vec3 mtScene(vec2 p){
 float px=1./uRes.y,a=TAU*uLoop,many=uOwn[3],o0=abs(uOwn[0]);
 mtPx=px;
 mtHw=.5*uRes.x/uRes.y;
 mtN=.55+.9*uEnergy;
 bool day=uVar<.5;
 float sc=clamp(mtHw/.8,.5,1.1),lapis=max(uOwn[4],0.);
 mtAmb=day?mix(vec3(1.),uOwn[0]<0.?vec3(1.,.97,.88) : vec3(.98,.84,.76),o0) : mix(vec3(.7,.76,.9),uOwn[0]<0.?vec3(.98,.95,.95) : vec3(.9,.68,.56),o0);
 mtAmb=mix(mtAmb,vec3(1.),max(-uOwn[4],0.));
 mtInk=mix(day?vec3(.26,.17,.14) : vec3(.07,.08,.14),vec3(.95,.76,.36),lapis);
 mtF=mix(day?vec3(.88,.89,.87) : mix(vec3(.97,.945,.84),vec3(.98,.7,.42),max(uOwn[0],0.)),vec3(.96,.8,.46),lapis);
 vec3 ground=mtField(p),c=ground;
 float pad=uPad*mtN;
 vec2 m=vec2((.22-.05*cos(a)-.7*max(uOwn[5],0.))*mtHw,.255+.018*sin(a)+.01*pad);
 float mr=.082*exp2(1.1*uOwn[1])*mix(sc,1.,.5);
 if (day){
  float roll=mtRoll(p.x),under=roll - p.y;
  mtCloud(c,p.x,-under,roll);
  // fine rain
  float wet=.16+.84*uTexture*mtN,rx=p.x+.13*p.y;
  float fall=mtM(.02,.1,under)*mtM(.66,.1,under)*mtM(.75,-.35,p.x/mtHw - .5*wet)*sat(1.+1.2*uOwn[1]);
  for (int k=0; k<2&&fall>0.; k++){
   float T=k == 0?.0135 : .0093,h=hash11(floor(rx/T)+57.*float(k)),s=fract(p.y*(k == 0?2.3 : 3.1)+h*17.+uTime*(k == 0?.21 : .27));
   float dash=mtM(0.,.12,s)*mtM(.75,.5,s)*mtM(h - .15,h+.15,wet*1.1+.08*uHigh);
   mtY(c,vec3(.9,.92,.9),fall*dash*(.18+.3*wet)*mtL((fract(rx/T)-.5+.5*(h-.5))*T,.00045+.0003*wet));
  }
  // a thread of lightning draws itself down
  float lx=.02*mtHw,y=(.42 - p.y)/sc,reach=.3+.33*mtM(0.,.5,1. - uHits),live=mtM(reach,reach - .04,y)*mtM(-.015,0.,under)*step(0.,y);
  float x=(p.x - lx)/sc - .22*y - .075*(abs(fract(y*4.3+.1)-.5) - .4) - .042*(abs(fract(y*11.7+.3)-.5) - .25) - .016*abs(fract(y*29.) - .5);
  float th=mtL(x*.72*sc,mix(.0026,.0009,sat(y*1.6)))*live;
  vec3 gold=mix(vec3(1.,.86,.46),uKind[4],.15);
  c=mix(c,gold,th*mtM(0.,.4,uHits));
  c += gold*.3*uEnergy*uHits*exp(-abs(x)*30.)*live*sat(y*20.);
  // egrets, there and back with the loop
  float v=-sin(a),s=v/sqrt(v*v+.04);
  for (int i=0; i<4; i++){
   float fi=float(i),sz=(i<2?1.25 : 1.)*sc;
   vec2 at=vec2((.46+.1*cos(a)+(fi-1.)*.085)*mtHw+.01*sin(uTime*.05+fi),.06+.032*(i == 1?-.6 : fi)+.012*sin(uTime*.083+fi*2.1));
   mtPx=px/sz;
   mtEgret(c,(p-at)/sz,s,sin(uTime*(1.1+.07*fi)+fi*1.9)*(.5+.4*uPhrase),sat(2.*uPhrase+2. - fi));
  }
 } else {
  vec2 sg=p*17.,si=floor(sg);
  float st=hash21(si+4.),md=length(p - m) - mr;
  vec2 so=fract(sg) - .5 - .7*(vec2(st,fract(st*57.)) - .5);
  c += .5*step(.62,st)*mtI(length(so)/17. - .0011 - .0008*uHigh)*mtM(.08,.22,p.y)*(.5+.5*sin(uTime*.4+st*60.))*(1. - .8*max(-uOwn[0],0.));
  // the moon, in a thin ring of gold
  c=mix(c,mtF,.17*exp(-max(md,0.)*(11.-5.*pad))*(.8+.6*pad));
  vec2 o=(p - m)/mr;
  vec3 face=mtF - vec3(.07,.06,.05)*mtM(.45,1.1,length(o-vec2(-.15,.2)));
  c=mix(c,face,mtI(md));
  c=mix(c,vec3(.8,.62,.3),.9*mtL(md,.0011));
 }
 if (!day&&uOwn[7]<0.) c += mtFire(p)*-uOwn[7];
 if (day&&uOwn[7]<0.) mtKites(c,p,-uOwn[7]);
 // the ground, in the house's own measure
 float z=exp2(.75*uOwn[2])*(day?.9*min(sc,1.) : .56*sc);
 vec2 org=day?vec2((-.34+.5*uOwn[5])*mtHw,-.5+.036*z) : vec2((-.5+(uOwn[5]<0.?.35 : .95)*uOwn[5])*mtHw,-.015),q=(p - org)/z;
 float tx=(mtHw - org.x)/z - .34;
 mtPx=px/z;
 vec3 dry=vec3(.75,.66,.44),green=mix(vec3(.45,.53,.36),dry,.8*max(-many,0.));
 float h1=day?.2+.02*sin(q.x*1.9+2.)+.012*sin(q.x*4.3) : (.04+.018*sin(p.x*3.1+1.)+.008*sin(p.x*8.3) - org.y)/z;
 float h2=day?.15+.03*sin(q.x*1.4)+.004*sin(q.x*9.) : .055 - .1*mtM(.35,1.15,q.x)+.012*sin(q.x*5.);
 if (uOwn[6]>0.){ mtPx=px; mtRocks(c,p,day?org.y+.16*z : .0,uOwn[6]); mtPx=px/z; }
 c=mix(c,vec3(.93,.86,.66)*mtAmb,(day?.22 : .06)*exp(-max(q.y-h1,0.)*22.));
 c=mix(c,mix(green*mtAmb,ground,day?.4 : .7),mtI(q.y-h1));
 mtY(c,green*(day?.88+.9*q.y : .75+3.*max(q.y,0.)),mtI(q.y-h2));
 // the garden laid open
 float bed=max(q.y - .165,.2 - q.x),wide=.56+1.6*max(q.y,0.);
 if (day){
  mtWall(c,q,vec2(.2,9.),.16,.2);
  mtY(c,mix(vec3(.2,.31,.21),dry*.78,max(-many,0.)),mtI(bed));
  float path=min((.5-abs(fract((q.x-.52)/wide/.12)-.5))*.12*wide - .006,(.5-abs(fract((q.y-.024)/.07)-.5))*.07 - .005);
  vec2 fg=vec2(q.x*85.,q.y*120.);
  float fh=hash21(floor(fg));
  mtY(c,fh>.8?vec3(.86,.42,.42) : fh>.6?vec3(.93,.85,.62) : vec3(.4,.53,.31),mtI(bed)*mtM(.35,.2,length(fract(fg)-.5))*sat(.75+many));
  mtY(c,vec3(.76,.69,.55),mtI(bed)*mtI(path));
 }
 for (int i=0; i<3&&q.y<.62; i++){
  bool near=i>1;
  float T=.115,ci=floor(q.x/T - (near?-.5 : .5))+(i == 1?1. : 0.);
  float cx=(ci+(near?0. : .5))*T,hs=hash11(ci*3.1+(near?9. : 4.)),kind=mod(ci+(near?1. : 0.),2.)<.5?0. : hs<.55?1. : 2.;
  float keep=mtM(hs - .3,hs+.1,.75+many)*(1.+.2*max(many,0.));
  keep *= cx>0.?mtM(.29,.36,cx)*mtM(tx,tx - .08,cx) : mtM(-.35,-.4,cx);
  if (near) keep *= day?step(0.,cx)*.5 : 0.;
  if (!day) keep *= mtM(1.,.7,cx);
  mtTree(c,q - vec2(cx,day?(near?.052 : .132)-.02*hs : .04-.04*max(cx-.35,0.)),(kind<.5?.24+.05*hs : .18)*keep,kind,ci);
 }
 mtWall(c,q,day?vec2(.2,9.) : vec2(-.68,.56),0.,day?.036 : .045);
 if (day) mtWall(c,q,vec2(tx-.004,9.),.11,.154);
 vec3 open_=c;
 mtPalace(c,q,day?0. : .5);
 if (uOwn[6]<0.){
  c=mix(c,open_,mtM(-.2,-.7,uOwn[6]));
  float grown=mtM(-.1,-1.,uOwn[6]);
  mtPav(c,(q - vec2(-.24,.04))/1.2,true,.6*grown);
  mtGreat(c,q - vec2(.02,.03),.6*grown);
 }
 if (!day) mtS(c,mtWh*.85,max(abs(q.y+.004)-.016,abs(q.x+.06)-.64+q.y));
 mtPx=px;
 // the water, in fine white hatch
 float shore=day?org.y : min(.02 - .035 - .02*z+.03*mtM(.3,1.,q.x),.016),yy=shore - p.y,sea=mtI(-yy);
 c=mix(c,day?vec3(.4,.5,.51)*mtAmb : ground,sea);
 if (!day&&uOwn[7]<0.) c += .35*sea*mtFire(vec2(p.x+.012*sin(p.y*160.+uTime*.6),shore+yy))*-uOwn[7];
 float dep=max(yy,-.02)+.07,w=log(dep)*54.,row=floor(w),rh=dep/54.,hr=hash11(row*1.3);
 float ring=exp(-20.*abs(length((p-vec2((.02+.06*sin(uTravel*.031))*mtHw,-.2))*vec2(1.,2.4))-(.1+.22*(1.-uHits))*sc))*uHits*(day?0. : 1.);
 c=mix(c,mtF,.4*ring*sea);
 for (int k=0; k<2&&sea>0.; k++){
  float T=dep*(k == 0?.34 : .2),xx=p.x/T+hr*7.+.12*sin(uTime*.13+row)+3.7*float(k),fx=fract(xx) - .5,h=hash21(vec2(floor(xx),row+50.*float(k)));
  float arc=(fract(w) - .5 - (float(k)-.5)*.4+1.1*fx*fx - .1)*rh;
  float off=(p.x - m.x - .02*sin(row*.7+uTime*.11))/(.014+.5*mr+.2*max(yy,0.)+.015*pad);
  float on=day?.25*step(.4,h) : mtM(h - .25,h+.2,1.2*exp(-off*off) - .14)*(.75+.25*sin(uTime*.5+h*40.));
  float all=.09*mtM(.55,.8,h)+.14*uTexture*mtN*mtM(.45,.8,h+.25*uTexture)+ring*step(.2,h);
  c=mix(c,mtF*(day?mtAmb : vec3(1.)),sea*mtM(.5,.36,abs(fx))*mtL(arc,.0006+.045*rh)*sat(max(on,all)));
  // the house, broken in the water
  c=mix(c,mix(vec3(.8)*mtAmb,vec3(1.,.75,.4),uCue),(.12+.4*uCue)*sea*mtM(.36,.3,abs(q.x))*float(!day)*exp(-max(yy,0.)*14./z)*mtM(.5,.3,abs(fx))*mtL(arc,.25*rh));
 }
 if (day){
  // the terrace and the pink cloth, cut by the frame
  mtPx=px/z;
  float lean=.5*(q.y - .12);
  vec2 cl=vec2(q.x - tx - .07 - lean,q.y);
  mtS(c,vec3(.86,.83,.765),max(q.y-.124,-(cl.x+.07)*.9));
  float cloth=max(max(-.006-q.y,q.y-.092),-cl.x*.9);
  mtS(c,vec3(.7,.22,.26),cloth);
  mtY(c,mix(vec3(.89,.47,.47),uKind[1],.12),mtI(cloth+.015));
  mtY(c,vec3(.95,.84,.62),mtI(cloth+.002)*max(max(mtL(cloth+.004,.0006),mtL(cloth+.015,.0006)),mtL(cloth+.0095,.0016)*mtR(cl.x+q.y,.013,.0024)));
  vec2 bt=cl*vec2(28.,34.);
  bt.x += .5*mod(floor(bt.y),2.);
  mtY(c,vec3(.97,.8,.74),.8*mtI(cloth+.019)*mtM(.16,.08,length(fract(bt)-.5)));
  vec2 bo=vec2(abs(q.x-tx-.3),q.y - .062);
  float bol=length(vec2(max(bo.x-.085,0.),bo.y)) - .021;
  mtS(c,mix(mtWh,vec3(.66,.6,.6),mtM(.012,-.02,bo.y)),bol);
  mtY(c,vec3(.7,.3,.25),mtI(bol)*mtL(bo.x-.078,.006));
 } else for (int i=0; i<4; i++){
  float fi=float(i),W=2.*mtHw+.5,on=i == 0?1. : mtM(.25*fi - .25,.25*fi,.5+.5*uOwn[5]);
  vec2 at=i == 0?vec2(-.42,-.315) : i == 1?vec2(-.08,-.2) : i == 2?vec2(-.86,-.38) : vec2(.34,-.13);
  float sz=(.45+1.7*(-at.y-.1))*mix(sc,1.,.25);
  at.x=mod(at.x*mtHw+uTravel*(.006+.0012*fi)+.5*W,W) - .5*W;
  mtPx=px/sz;
  mtBoat(c,rot(.02*sin(uTime*.43+fi*1.3))*(p-at-vec2(0.,.0018*sin(uTime*.6+fi*2.)))/sz,sat(.32+.2*uLevel+.7*uPhrase*mtM(.15*fi-.1,.15*fi+.4,uPhrase*mtN+.2)+.4*uCue),on);
 }
 // lotus: a row along the tank, or a bank near the eye
 if (p.y>-.05) return c;
 mtPx=px;
 vec4 leaf[2];
 leaf[0]=leaf[1]=vec4(1.,1.,.01,0.);
 vec3 bud=vec3(9.,9.,.01);
 float far=1e3,ls=mix(sc,1.,.35),ow=max(many,0.);
 for (int i=0; i<13; i++){
  float fi=float(i),t=fi/12.,g=fract(fi*.618+.1),g2=fract(fi*.731);
  float size=day?.017*z*mtM(-.2,.15,.6+.5*many - g) : (.055+.075*t)*ls*(mod(fi,4.)>2.5?mtM(0.,.8,many) : mtM(-1.+.6*g,-.5+.4*g,many));
  vec2 at=day?vec2(mix(-mtHw,mtHw-.38*z,(fi+.5+.6*g)/13.),-.5+(.01+.014*g2)*z) : vec2(mtHw+.04 - g*(.14+.62*t+1.1*ow*(.4+.6*t))*ls,mix(-.235,-.5,t));
  at += (day?.0006 : .003)*sin(uTime*.27+fi);
  vec2 o=p - at,l=o;
  l.y /= .42+.14*g2;
  if (length(l)<size&&size>.003){ leaf[1]=leaf[0]; leaf[0]=vec4(l,size,g); }
  // some carry a flower
  if (mod(fi,day?2. : 4.)<.5){
   float fs=size*(day?1. : .78);
   vec2 f2=o - (day?vec2(.004*z,.003*z) : vec2(0.,size*(.4+.5*g2)));
   float near=length(f2 - vec2(0.,.5*fs))/max(fs,.002);
   if (!day) mtY(c,vec3(.42,.54,.38),mtI(mtBox(o,vec2(-.0018,0.),vec2(.0018,size*.6)))*step(.004,size));
   if (near<far&&fs>.003){ far=near; bud=vec3(f2,fs); }
  }
 }
 for (int i=1; i >= 0; i--){
  float size=leaf[i].z,r=length(leaf[i].xy),an=atan(leaf[i].y,leaf[i].x+1e-5),d=(r - size)*.6,dm=mtI(d);
  mtY(c,mix(vec3(.17,.34,.29),vec3(.36,.53,.38),leaf[i].w)*(.7+.3*sat(.5+(leaf[i].y-.3*leaf[i].x)/size)),dm);
  float vein=mtL((fract(an*13./TAU)-.5)*r*.29,.0007)*mtM(size,size*.6,r)*mtM(.05,.2,r/size);
  mtY(c,vec3(.7,.8,.62),dm*((.55+.4*ow*uBands[int(leaf[i].w*15.9)])*vein+.75*mtL(d+.003,.0011)));
  c += ow*dm*uKind[int(leaf[i].w*4.9)]*(.33*uBands[int(leaf[i].w*15.9)]*mtN+.1*uPad)*mtM(size,0.,r);
  mtE(c,.7*dm*max(mtL(d+.0008,.0008),mtI(abs(leaf[i].x)-.04*r)*step(leaf[i].y,0.)));
 }
 mtLotus(c,bud.xy,bud.z,1.+(.05+.2*ow)*uLow+.25*uKeys);
 return c;
}
vec3 render(vec2 p){
 vec3 c=mtScene(p);
 return uOwn[7]>0.?mtFrame(c,p,uOwn[7]) : c;
}
