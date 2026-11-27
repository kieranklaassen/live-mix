// name: River plates
// a: Plate rack
// b: Round the jar
// what: Eleven blue and white dishes stand in a wooden rack in morning light, and one river painted in five washes of cobalt runs on from dish to dish past hills and reeds; its boat turns pale as it crosses the dark wood. Or one great jar, so near that it fills the view, a wide strait and its ridges going round into shade.
// follows: A drone darkens the ridges, a pad lays the sky's wash, texture hatches the water, a phrase inks the reeds. Bands raise the ridges; the piece sets shores and islands. The loop moves the boat and sways the jar. A hit flushes five birds and rings the water; a cue floods one dish, or the jar's sky, with deep blue. Keys brighten the window's mark.
// own: 0 iron red paint at -1, copper green at 1; 1 a jade glaze at -1, dipped in deep colour from the foot up at 1, the painting left pale; 2 night by one warm lamp at -1, bright noon and a limewashed rack or pale room at 1; 3 close to the painting at -1, at 1 along the rack from the side, or down on the jar and its open mouth; 4 petal-edged dishes and a lobed jar at -1, eight-sided dishes and a jar of flat sides at 1; 5 winter at -1, snow on the hills and pale water, at 1 rain and a high river; 6 a wall of square tiles at -1, one great dish alone at 1 (b: a wide bowl looked into at -1, a row of lidded jars at 1); 7 open sea, scale waves and a moon at -1, painted in the sounds' colours at 1
#define RP_ONE max(uOwn[6], .0)
#define RP_TILE max(-uOwn[6], .0)
#define RP_SEA max(-uOwn[7], .0)
#define RP_DYE max(uOwn[7], .0)
vec3 rpK;              // the pigment laid last, as what it takes from the light
vec3 rpInk(int i) { return -1.2*log(clamp(uKind[i],.03,.97)); }
float rpD;             // how much pigment lies here
vec3 rpTint;           // a thin enamel over the glaze
float rpPx;            // a pixel, in the painting's own measure
vec3 rpN,rpM;         // the shake of the hand: broad, and fine
float rpWash(float d) { return smoothstep(-rpPx,rpPx,d); }
// three noises for the price of one
vec3 rpRand(vec2 p) { float h=hash21(p); return fract(h*vec3(1.,57.31,131.7)); }
vec3 rpNoise(vec2 p) {
 vec2 i=floor(p),f=fract(p); f=f*f*(3. - 2.*f);
 return mix(mix(rpRand(i),rpRand(i + vec2(1,0)),f.x),mix(rpRand(i + vec2(0,1)),rpRand(i + vec2(1,1)),f.x),f.y);
}
// a brush line of half width w, pale where it is finer than a pixel
float rpLine(float d,float w) { return (1. - smoothstep(max(w - rpPx,.0),w + rpPx,abs(d)))*min(1.,.3 + w / (1.6*rpPx)); }
float rpSeg(vec2 p,vec2 a,vec2 b,float wa,float wb) {
 vec2 d=b - a,q=p - a;
 float h=sat(dot(q,d) / dot(d,d));
 return rpLine(length(q - d*h),mix(wa,wb,h));
}
// a wash, with a darker edge where it dried
void rpLay(float d,float tone,float pool,float hold) { rpD=mix(rpD,tone + pool*exp(-max(d,.0)*160.),rpWash(d)*hold); }
// One hill: an outline, the far flank flooded, thinning down into bare glaze.
void rpHill(vec2 s,float at,float wide,float base,float high,float seed,float tone,float ink) {
 float t=(s.x - at) / wide;
 t /= 1. + sign(t)*.45*(fract(seed*.731) - .5);
 float m=1. - abs(t);
 if (m<=.0||s.y>base + high*1.15) return;
 float sharp=.15 + .5*fract(seed*.37),near=smoothstep(.0,.2,m);
 float bump=.05*sin(t*9. + seed) + .10*(rpN.x - .5) + .05*(rpM.x - .5);
 float top=base + high*(mix(m*m*(3. - 2.*m),m,sharp) + bump*near);
 float up=length(vec2(1.,high / wide*mix(6.*m*(1. - m),1.,sharp))),d=(top - s.y) / up;
 if (d<-.015) return;
 float lo=sat((s.y - base - .02) / (high<.0 ? min(.5*high,-.0001) : max(.5*high,.0001))); // high may lie either side of nothing
 float dd=max(d,.0),low=lo*lo*(3. - 2.*lo)*near,white=max(-uOwn[5],.0);
 float fold=(t + .10 - .13*sin(dd*26. + seed*5.) - .16*(rpN.y - .5))*wide;
 float flank=smoothstep(-rpPx,rpPx,fold),thin=mix(exp(-dd*5.),.15 + .85*smoothstep(.0,.09,dd)*exp(-dd*2.),white);
 float body=tone*thin*(.25 + flank*(.75 + .35*exp(-max(fold,.0)*130.)) + .35*(1. - ink)*(1. - flank))*(.8 + .4*rpM.y);
 // strokes down the lit side
 float ln=dd*34. + 1.2*rpN.y + seed;
 body+=ink*.4*tone*(1. - flank)*(1. - smoothstep(.06,.2,abs(fract(ln) - .5)))*smoothstep(.5,.75,rpN.z)*(1. - smoothstep(.02,.16,dd));
 rpD=mix(rpD,body,rpWash(d)*low);
 if (uOwn[7]>.0) rpK=mix(rpK,rpInk(0),rpWash(d + .004)*low);
 rpD+=ink*low*rpLine(d - .002,.0011 + .0036*rpM.x*(.35 + flank))*(.3 + .8*tone);
 rpD+=(1. - ink)*low*rpWash(d)*tone*.5*exp(-dd*190.);
}
// the middle of the river and half its width
vec2 rpRiver(float x) {
 float flood=1. + .5*max(uOwn[5],.0);
 if (RP_SEA>.0&&uVar>.5) return mix(vec2(-.09 + .04*sin(x*2.1),.15),vec2(-.3,.4),RP_SEA);
 if (RP_SEA>.0) return mix(vec2(-.235 + .24*smoothstep(-.2,1.2,x),.1),vec2(-.3,.37),RP_SEA);
 if (uVar>.5) return vec2(-.09 + .04*sin(x*2.1) + .025*sin(x*3.7 + 1.),(.15 + .035*sin(x*1.7 + 2.))*flood);
 float up=smoothstep(-.2,1.2,x);
 return vec2(-.235 + .24*up + .05*sin(x*4.6 + 1.2),mix(.115,.06,up)*(1. + .2*sin(x*6. + 2.))*flood);
}
// The boat: hull, mat roof, and one standing with a pole.
vec3 rpBoatAt(vec2 o) {
 if (abs(o.x)>.075||abs(o.y)>.08) return vec3(.0);
 float sag=7.*o.x*o.x,hull=min(min(sag - o.y,o.y - .55*sag + .0115),.05 - abs(o.x));
 float roof=min(.022 - 34.*(o.x + .006)*(o.x + .006) - o.y,o.y - .001);
 float pole=max(rpSeg(o,vec2(.026,.054),vec2(.046,-.022),.0012,.001),rpSeg(o,vec2(.031,.004),vec2(.0315,.026),.0036,.0022));
 return vec3(rpWash(hull),rpWash(roof),pole);
}
// A hit: five birds flushed from beside the boat.
float rpBirds(vec2 o) {
 float k=.0,gone=1. - uHits;
 if (uHits>.003&&abs(o.x)<.4&&abs(o.y - .17)<.2) for (int j=0; j<5; j++) {
  float fj=float(j);
  vec2 q=o - vec2(-.13 + .066*fj + .05*(fj - 1.5)*gone,.085 + .06*fract(fj*.618) + .1*gone*(.7 + .5*fract(fj*.37)));
  q.x=abs(q.x + .25*q.y);
  k=max(k,rpLine(q.y - .6*q.x + 11.*q.x*q.x,max(.0062 - .2*q.x,.0))*step(q.x,.031));
 }
 return k*sat(uHits*1.6);
}
// where along the piece a place of the painting is
float rpAlong(float x) { return uVar>.5 ? abs(fract(x*.45)*2. - 1.) : sat((x + .95) / 2.1); }
// Waves as overlapping scales of rings: how dark.
float rpScales(vec2 s) {
 vec2 q=s / .042 + vec2(uTravel*.05,.0);
 float r0=floor(q.y),d=.0,n=.0;
 for (int i=-1; i<2; i++) {
  float row=r0 + float(i),off=2.*mod(row,2.),c=floor((q.x - off) / 4. + .5);
  d=length(vec2(q.x - off - 4.*c,q.y - row));
  n=mod(c*5. + row*3.,16.);
  if (d<2.) break;
 }
 float lv=uBands[int(n)],g=fract(d*1.5 - uTime*.05),e=1.5*rpPx / .042;
 return .18 + .2*d*d*.5 + .45*lv*smoothstep(.2,2.,d) + .4*(1. - smoothstep(.1,.1 + e,abs(g - .5) - .06))*smoothstep(.2,.6,d) - .3*(1. - smoothstep(.08,.08 + e*.7,2. - d));
}
// The painting: s.x along the river, s.y from -0.5 to 0.5.
void rpPaint(vec2 s,vec2 boat) {
 rpTint=vec3(1.);
 if (uOwn[7]>.0) rpK=rpInk(2);
 bool jar=uVar>.5;
 float rain=max(uOwn[5],.0),snow=max(-uOwn[5],.0);
 rpN=rpNoise(s*8.); rpM=rpNoise(s*vec2(27.,21.) + 5.);
 s+=.005*(rpN.xz - .5);
 float x=s.x,y=s.y;
 vec2 rv=rpRiver(x);
 // the sky: level washes that come with the pad
 rpD=.0;
 if (y>.0) {
  vec3 sky=rpNoise(vec2(x*1.7 + uTime*.006,y*13. + 3.));
  float k=sky.x*.8 + rpN.x*.14 + rpM.x*.06 - .68 + .22*uPad + .1*rain;
  rpD=(.07 + .2*uPad)*smoothstep(.0,.016,k)*(.65 + .7*(1. - smoothstep(.0,.045,k))) + (.4*snow + .36*rain)*smoothstep(-.1,.4,y)*(.7 + .6*sky.y);
  // on the jar a cue floods the whole sky with deep wet blue
  if (jar) rpD=mix(rpD,.75 + .5*sky.y + .3*rpN.y,sat(1.2*uCue)*.9);
  if (RP_SEA>.0) {
   vec2 mo=vec2(jar ? mod(x - .25 + .85,1.7) - .85 : x - .15,y - .235);
   float md=length(mo) - .1 + .003*(rpM.x - .5);
   rpD+=RP_SEA*(.3 + .4*sky.y*rpN.x + .2*uDrone)*smoothstep(.0,.3,y);
   rpD*=mix(1.,smoothstep(-rpPx,rpPx,md),RP_SEA);
   rpD+=RP_SEA*(.6*rpLine(md,.0016) + .3*exp(-max(md,.0)*22.)*step(.0,md));
  }
  rpD*=smoothstep(.0,.12,y);
 }
 // sixteen ridges, even ones far, odd ones near
 float gap=.16,trend=jar ? -.02 : -.17 + .24*smoothstep(-.2,1.2,x),rise=1. - .85*RP_SEA;
 if (RP_SEA>.0) trend=mix(trend,.07,RP_SEA);
 if (y>min(trend,rv.x + .4*rv.y)) for (int row=0; row<2; row++) {
  if (!jar&&(row==0 ? y<.13 : y>trend + .36)) continue;
  float fr=float(row);
  if (!jar) gap=row==0 ? .07 : .115;
  float c0=floor((x + 1.02) / gap*.5 - .5*fr);
  for (int i=-1; i<2; i++) {
   float id=2.*(c0 + float(i)) + fr,h=hash11(mod(id,97.) + 4.1),h2=fract(h*37.7);
   float lv=uBands[int(mod(id,16.))],cx=-1.02 + (id + 1. + .6*(h - .5))*gap;
   if (row==0) rpHill(s,cx,gap*(1.35 + .6*h2),jar ? trend : .13,jar ? (.18 + .17*h + .14*lv)*rise : (.04 + .1*h*h + .11*lv)*rise,h*91. + 3.,(.15 + .12*h2 + .28*uDrone)*(1.2 - .4*uSpace),jar ? .0 : .5);
   else rpHill(s,cx,gap*(.8 + .8*h2),trend,((jar ? .1 + .15*h2*h2 : .08 + .1*h2*h2) + (jar ? .15 : .11)*lv)*rise,h*77. + 8.,.45 + .25*h + .4*uDrone,1.);
  }
 }
 // the river in five washes, each with a darker edge where it dried
 float u=(y - rv.x) / rv.y,shore=.45*sat(piece(vec2(rpAlong(x + .1*u + .12*(rpN.z - .5)),u>.0 ? .2 : .85)).a*(.5 + .6*uEnergy))*(1. - .8*RP_SEA);
 float wet=(1. - shore + .16*(rpN.x - .5) + .1*(rpM.x - .5) - abs(u))*rv.y;
 if (wet>-.02) {
  vec3 run=rpNoise(vec2(x*3. - uTravel*.04,u*1.7 + 4.));
  float deep=max((.85 - .85*u*u) + .95*(run.x - .5) - .1*u,.0)*4.2,fl=min(floor(deep),4.),fr=deep - fl;
  float tone=.09 + .18*(fl + smoothstep(.0,.05 + rpPx*4.2 / rv.y,fr));
  tone+=.14*(1. - smoothstep(.02,.3,fr))*smoothstep(.0,.05,fr)*min(fl,1.);
  tone*=(1. - .55*snow)*(.85 + .3*rpM.y);
  if (RP_SEA>.0) tone=mix(tone,rpScales(s),RP_SEA);
  // fine level strokes where there is texture
  float ln=(y + .004*sin(x*13.))*120.,row=floor(ln),hr=hash11(row);
  float dash=fract(x*2.3 + hr*9. - uTravel*.015);
  float hatch=(1. - smoothstep(.08,.26,abs(ln - row - .5)))*smoothstep(.0,.12,dash)*(1. - smoothstep(.2 + .2*uTexture,.4 + .2*uTexture,dash))*step(.45,fract(hr*7.7));
  tone+=hatch*(.14 + .4*uTexture)*(1. - .8*RP_SEA);
  // a hit sends a ring over the water from the boat
  vec2 rq=(s - boat)*vec2(.7,1.5);
  float ring=length(rq) - .13 - .22*(1. - uHits);
  tone=mix(tone,.04,sat(uHits*1.3)*.75*exp(-ring*ring*420.));
  rpD=mix(rpD,tone,rpWash(wet));
  if (uOwn[7]>.0) rpK=mix(rpK,rpInk(1),rpWash(wet + .004));
  rpD+=rpLine(wet,.001 + .003*rpM.z)*(.35 + .5*rpN.z);
 }
 // the near bank
 if (y<rv.x) for (int i=-1; i<2; i++) {
  float id=floor(x / .21 + .5) + float(i),h=hash11(mod(id,61.) + 6.6);
  rpHill(s,(id + .3*(h - .5))*.21,.2 + .16*h,-.56,(rv.x - rv.y + .56)*(jar ? .3 + .75*h : .35 + .35*h) + .04,h*63.,.5 + .3*h + .2*uLow,1.);
 }
 // islands, where the piece has something: a rock and a tree or two
 float pitch=jar ? .3 : .235,i0=floor(x / pitch);
 if (abs(u)<1.6) for (int i=0; i<2; i++) {
  float id=i0 + (fract(x / pitch)<.5 ? -float(i) : float(i)),h=hash11(mod(id,83.) + 2.7),h2=fract(h*91.3);
  float cx=(id + .5 + .3*(h - .5))*pitch,row=mod(id,2.);
  vec2 r=rpRiver(cx);
  vec4 m=piece(vec2(rpAlong(cx),row<.5 ? .34 : .68));
  float big=.35*smoothstep(.35,.8,h2) + 1.1*sat(m.a*(.6 + .6*uEnergy));
  if (big<.02) continue;
  float lf=smoothstep(.1,.35,big),on=smoothstep(.0,.2,big);
  big=min(big,1.)*(jar ? 1.25 : 1.);
  vec2 o=s - vec2(cx,r.x + r.y*(row<.5 ? .3 : -.45));
  float w=.035 + .075*big,tall=(.012 + .032*big)*on,q=1. - o.x*o.x / (w*w);
  if (q<-.6||abs(o.y)>.14) continue;
  float top=tall*q*(.75 + .5*rpN.x + .3*rpM.x),d=min(top - o.y,o.y + .008*q*on);
  float flank=rpWash(o.x - w*(.1 + .5*(rpN.y - .5)));
  // bare glaze kept round it, then the rock
  rpD*=1. - .7*on*smoothstep(.0,.6,q)*smoothstep(-.02,-.004,o.y)*(1. - smoothstep(.0,.012,o.y));
  rpLay(d,.06 + .5*flank,.2,on);
  rpD+=.9*on*rpLine(d,.0012 + .002*rpM.x);
  vec3 c=m.a>.01 ? m.rgb / m.a : vec3(1.);
  float leaf=1e3;
  vec2 tr=o - vec2(-.2*w,tall*.7);
  float hgt=(.03 + .04*h2)*lf + .001;
  tr.x-=(.3*(h - .5) + .05*sin(uTime*.31 + id))*tr.y;
  if (tr.y<hgt) rpD+=.9*rpLine(tr.x,.0018)*smoothstep(.0,.004,tr.y)*lf;
  for (int j=0; j<3; j++) {
   vec2 b=tr - hgt*vec2(.55*float(j) - .5,j==1 ? 1.15 : .8 + .2*h);
   leaf=min(leaf,length(b*vec2(.62,1.5)) - hgt*.36);
  }
  leaf+=.012*(rpM.y - .5) + .006*(rpN.y - .5);
  rpLay(-leaf,.75 + .5*rpM.z,.3,lf);
  if (uOwn[7]>.0) rpK=mix(rpK,rpInk(3),max(rpWash(d + .003),rpWash(.003 - leaf)*lf));
  rpTint=mix(rpTint,mix(vec3(1.),c,.6*(1. - RP_DYE)),max(rpWash(d),rpWash(-leaf)*lf)*sat(m.a)*.9);
 }
 // reeds on the near bank, a fan from one root
 if (y<(jar ? .0 : -.17)) {
  float pr=jar ? .26 : .2,id=floor(x / pr),h=hash11(mod(id,71.) + 8.8);
  vec2 o=vec2(x - (id + .4 + .2*h)*pr,y + (jar ? .5 : .46) - .03*h);
  float on=smoothstep(.1,.2,fract(h*17.3))*(1. - RP_SEA);
  if (on>.0&&o.y>-.03) for (int j=0; j<6; j++) {
   float fj=float(j),g=fract(h*13.1 + fj*.618),tall=(.10 + .13*g)*(jar ? 1.35 : 1.)*(.85 + .2*uPhrase),v=o.y / tall;
   if (v>1.) continue;
   float bend=(fj - 2.5)*.006 + (g - .5)*.16*v*v + .012*v*sin(uTime*.4 + fj + id)*(.4 + uPhrase);
   if (uOwn[7]>.0) rpK=mix(rpK,rpInk(3),on*rpLine(o.x - bend,.005)*step(v,1.));
   rpD=max(rpD,on*rpLine(o.x - bend,.0046*(1. - v)*smoothstep(-.2,.3,v) + .0006)*(.5 + .7*uPhrase)*(.55 + .45*g));
  }
 }
 // the boat
 vec2 o=(s - boat) / (jar ? 1.4 : 1.);
 vec3 b=rpBoatAt(o);
 rpD*=1. - .9*(1. - smoothstep(.034,.042,length(o*vec2(.6,1.5) + vec2(.0,-.004)) + .02*(rpM.x - .5)));
 rpD=mix(mix(rpD,.42,b.y),1.5,max(b.x,b.z));
 rpD=mix(rpD,1.4,rpBirds(o));
 // a shower
 if (rain>.0) {
  vec2 q=rot(-.25)*s*vec2(85.,9.) + vec2(.0,mod(uTravel*.25,64.)),c=floor(q);
  rpD+=.3*rain*step(.68,hash21(vec2(c.x,mod(c.y,64.))))*(1. - smoothstep(.05,.05 + 85.*rpPx,abs(fract(q.x) - .5)))*smoothstep(.0,.2,fract(q.y))*(1. - smoothstep(.5,.9,fract(q.y)));
 }
}
vec3 rpPigBase() {
 vec3 k=mix(vec3(2.35,1.6,.72),vec3(.55,1.75,2.1),max(-uOwn[0],.0));
 return mix(k,vec3(2.4,.85,1.35),max(uOwn[0],.0));
}
vec3 rpPig() {
 vec3 k=mix(vec3(2.35,1.6,.72),vec3(.55,1.75,2.1),max(-uOwn[0],.0));
 k=mix(k,vec3(2.4,.85,1.35),max(uOwn[0],.0));
 if (uOwn[7]>.0) k=mix(k,rpK,uOwn[7]);
 return k;
}
vec3 rpGlaze() { return mix(vec3(.925,.94,.945),vec3(.66,.80,.70),max(-uOwn[1],.0)); }
// Pigment under glaze. Below the dip line the ground is deep and the painting left pale.
vec3 rpFired(float dip) { return rpGlaze()*rpTint*exp(-mix(rpD,max(1.4 - 1.25*rpD,.02),dip)*rpPig()); }
vec2 rpBoat() {
 float x=uVar>.5 ? uTravel*.006 + .12 - .2*cos(TAU*uLoop) : -.2 - .34*cos(TAU*uLoop);
 vec2 r=rpRiver(x);
 return vec2(x,r.x - .02*r.y + .0015*sin(uTime*.7));
}
// The dishes, nearest first: across, shelf, radius, own number.
const vec4 RPP[11]=vec4[11](
 vec4(.05,.0,.148,.2),vec4(.70,.0,.165,.7),vec4(-.31,1.,.150,.5),vec4(.415,1.,.165,.9),
 vec4(-.25,.0,.262,.3),vec4(.37,.0,.245,.6),vec4(1.00,.0,.235,.1),vec4(-.68,.0,.215,.8),
 vec4(.05,1.,.218,.4),vec4(-.66,1.,.205,.0),vec4(.80,1.,.222,1.));
float rpShelf(float row) { return (row<.5 ? -.445 : .125) + (row<.5 ? -.75 : .75)*max(RP_ONE,RP_TILE); }
vec4 rpPut(int i) {
 vec4 k=RPP[i];
 if (uOwn[6]>.0) k=i==4 ? mix(k,vec4(.02,.0,.425,k.w),uOwn[6]) : vec4(k.x + (k.x + .25>.0 ? 2.2 : -2.2)*uOwn[6],k.y,k.z,k.w);
 if (uOwn[6]<.0) k.z*=max(1. + 1.5*uOwn[6],.001);
 return k;
}
vec2 rpMid(int i,vec4 k) {
 vec2 c=vec2(k.x,rpShelf(k.y) + k.z*.985);
 return i==4&&uOwn[6]>.0 ? mix(c,vec2(.02,.0),uOwn[6]) : c;
}
vec3 rpWood(vec2 w,float along) {
 vec3 f=rpNoise(w*vec2(80.,2.6) + along);
 vec3 c=mix(vec3(.16,.105,.065),vec3(.34,.235,.15),.1 + .4*f.x + .45*noise(vec2(w.x*23. + along,w.y*1.6)));
 if (uOwn[7]>.0) c=mix(c,uKind[4]*uKind[4]*(.45 + 1.6*dot(c,vec3(.6))),.9*uOwn[7]);
 return mix(c,c + vec3(.44,.42,.38)*(1. - .6*RP_DYE),max(uOwn[2],.0));
}
// the window's light: tall panes of it lying slanting over the rack
vec3 rpLight(vec2 w) {
 float a=w.x + .42*w.y - .03*sin(uTime*.021),b=w.y - .2*w.x;
 float pane=smoothstep(-.66,-.54,a)*(1. - smoothstep(.42,.62,a))*(.25 + .75*smoothstep(.012,.05,abs(a + .07)));
 pane*=(1. - smoothstep(.36,.46,b))*(.3 + .7*smoothstep(.012,.05,abs(b + .02)));
 vec3 l=vec3(.80,.88,1.)*mix(.68,.48,smoothstep(-.8,1.2,w.x)) + vec3(1.,.91,.76)*pane*.38;
 l=mix(l,vec3(.97,.98,.97),max(uOwn[2],.0)*.75);
 vec2 q=w - vec2(.42,-.3);
 l=mix(l,vec3(1.1,.84,.58)*(.12 + exp(-dot(q,q)*1.7)) + vec3(.03,.05,.11),max(-uOwn[2],.0));
 return l*(1. + .1*uLevel) + vec3(.13,.07,.02)*uMic;
}
// Where w lies in a dish, in radii; z is 1 at the lip.
vec3 rpDish(int i,vec2 w,vec4 k) {
 vec2 q=(w - rpMid(i,k)) / k.z;
 float r=length(q) + 1e-5;
 if (abs(uOwn[4])>.001&&r<1.3) {
  float an=atan(q.y,q.x + 1e-6) + k.w*2.;
  r*=uOwn[4]>.0 ? mix(1.,1.04*cos(mod(an,PI / 4.) - PI / 8.) / cos(PI / 8.),uOwn[4]) : 1. + uOwn[4]*.09*(abs(sin(an*6.)) - .7);
 }
 return vec3(q,r);
}
// One dish with the painting on it.
vec3 rpGlazed(int i,vec2 w,vec3 light,float sh) {
 vec4 k=rpPut(i);
 vec3 at=rpDish(i,w,k);
 vec2 q=at.xy,dir=q / (length(q) + 1e-5);
 float r=at.z,px=rpPx / k.z,keep=rpD;
 float bowl=.12 + .35*fract(k.w*7.3 + .2),x=(r - .69) / .055;
 float slope=mix((r<.69 ? bowl*r : bowl*.5) + .62*exp(-x*x),-.9,smoothstep(.955,1.,r));
 vec3 n=normalize(vec3(-slope*dir + .1*(fract(k.w*vec2(3.7,5.9)) - .5),1.));
 // a blue line round the lip and two round the well; the small dishes have a flooded rim
 rpD+=.75*rpLine((r - .965)*k.z,.0032) + .6*rpLine((r - .735)*k.z,.0014);
 if (i<4) rpD=mix(rpD,.62 + .25*rpN.x + .25*exp(-abs(r - .735)*70.) + .3*exp(-abs(.95 - r)*60.),smoothstep(.735 - px,.735 + px,r)*(1. - smoothstep(.945,.955,r)));
 // a cue floods one dish with deep wet blue
 if (i==4) rpD=mix(rpD,1.05 + .5*rpN.x + .3*exp(-abs(1. - r)*14.),sat(1.3*uCue)*.92*(1. - smoothstep(.93,.95,r)));
 float dip=smoothstep(-px,px,2.4*max(uOwn[1],.0) - 1.22 - q.y + .07*sin(q.x*3. + k.w*9.)),f=(r - .655) / .05;
 vec3 c=rpFired(dip)*mix(vec3(1.),vec3(.78,.90,.955),.75*exp(-f*f));
 c*=light*(.60 + .80*max(dot(n,vec3(-.634,.346,.692)),.0))*mix(.4,1.,sh);
 // the window bent in the glaze
 vec2 g=abs(2.*n.xy*n.z - vec2(-.44,.24)) / vec2(.13,.2);
 float blur=mix(.4,.1,uTone);
 float win=(1. - smoothstep(1. - blur,1. + blur,max(g.x,g.y)))*(.35 + .65*smoothstep(.06,.13,min(g.x,g.y)));
 rpD=keep;
 return c + win*(.15 + .4*uKeys + .1*uHigh)*(light + .15)*mix(.5,1.,sh);
}
// The wall of tiles: how much of one is here in w, its own number, and its middle's offset in half tiles.
vec3 rpTiled(vec2 w,vec3 light,float px,out float cov) {
 vec2 g=w / .3 + vec2(.5,.35),id=floor(g),f=g - id - .5;
 float n=hash21(mod(id,64.) + 3.),m=hash21(mod(id,64.) + 31.),hw=.49*RP_TILE,e=hw - max(abs(f.x),abs(f.y));
 if (abs(uOwn[4])>.001) e=min(e,uOwn[4]>.0 ? mix(1.,.68*RP_TILE - (abs(f.x) + abs(f.y)),uOwn[4]) : mix(1.,hw*1.15 - length(f),-uOwn[4]));
 cov=smoothstep(-px / .3,px / .3,e);
 rpD+=.3*exp(-max(e,.0)*60.)*rpN.x;
 rpD=mix(rpD,1. + .5*rpN.x,sat(1.3*uCue)*.9*step(n,.14));
 float dip=smoothstep(-px / .3,px / .3,2.4*max(uOwn[1],.0) - 1.22 - 2.*f.y + .3*(m - .5)*(1. - max(uOwn[1],.0)) + .07*sin(f.x*6. + n*9.));
 vec3 nn=normalize(vec3(.16*(vec2(n,m) - .5) + f*.12 + sign(f)*.5*exp(-max(hw - abs(f),.0)*45.),1.));
 vec3 c=rpFired(dip)*light*(.62 + .72*max(dot(nn,vec3(-.634,.346,.692)),.0))*(.93 + .1*n);
 vec2 sh=f + vec2(.16,-.16) + .6*(vec2(m,n) - .5);
 return c + (.03 + .1*uKeys + .04*uHigh)*light*exp(-dot(sh,sh)*mix(9.,24.,uTone));
}
vec3 rpRack(vec2 p) {
 float near=max(-uOwn[3],.0),slant=max(uOwn[3],.0),zoom=1. - .42*near;
 vec2 z=p*zoom - vec2(.1,.1)*near;
 float per=1. / max(1. - (.2 + .22*slant)*z.x + .05*z.y,.3);
 vec2 w=z*per + vec2(-.12*slant,.0),boat=rpBoat();
 float px=per*per*zoom / uRes.y;
 rpPx=px*.8;
 vec3 light=rpLight(w),col=vec3(.0);
 // front to back: the first dish, the one behind its edge, and the light the nearer ones let by
 float left=1.,sh=1.,shA=1.,shB=1.,covA=.0,covB=.0;
 int A=-1,B=-1;
 for (int i=0; i<(uOwn[6]<-.9?0:11); i++) {
  vec4 k=rpPut(i);
  float r=rpDish(i,w,k).z,cov=smoothstep(-px,px,(1. - r)*k.z);
  if (cov>.0) {
   if (A<0) { A=i; covA=cov; shA=sh; } else { B=i; covB=left*cov; shB=sh; }
   left*=1. - cov;
   if (left<.01||B>=0) break;
  }
  vec2 v=w - rpMid(i,k) - vec2(.045,-.026);
  sh*=1. - .8*(1. - smoothstep(k.z - .03,k.z + .03,length(v)));
 }
 // the shelf's front edge stands before everything
 float lipY=w.y - rpShelf(w.y>-.15 ? 1. : .0),lip=smoothstep(-px,px,.012 - lipY)*smoothstep(-px,px,lipY + .03)*(1. - smoothstep(1.27 - px,1.27 + px,w.x));
 vec3 tile=vec3(.0);
 float tiled=.0;
 if (uOwn[6]<.0) { rpPaint(w,boat); tile=rpTiled(w,light,px,tiled); }
 if (A>=0&&lip<.99&&tiled<.99) {
  rpPaint(w,boat);
  col=covA*rpGlazed(A,w,light,shA);
  if (covB>.0) col+=covB*rpGlazed(B,w,light,shB);
 }
 if ((left>.01||lip>.0)&&tiled<.995) {
  // the back boards, in the rack's shade, or the edge of the shelf
  bool edge=lip>.5;
  float bd=w.x / .19,id=floor(bd),under=rpShelf(1.) - .03 - w.y;
  vec3 c=rpWood(edge ? w.yx : w,edge ? 3. : id*9.7)*light;
  if (edge) c*=1. + .8*smoothstep(.004,.012,lipY) - .5*(1. - smoothstep(-.03,-.018,lipY));
  else c*=(.8 + .35*hash11(id + 3.))*(.3 + .7*smoothstep(.006,.02,.5 - abs(fract(bd) - .5)))*(.5 + .6*sh)*(under>.0 ? 1. - .7*exp(-under*14.) : 1.);
  // far to the right the rack ends
  if (w.x>1.24) {
   float in_=smoothstep(1.27 - px,1.27 + px,w.x);
   c=mix(c*(1. - .5*smoothstep(1.24,1.27,w.x)),mix(c*2.,vec3(.80,.74,.64)*light*(1. - .6*exp(-max(w.x - 1.34,.0)*14.)),smoothstep(1.34 - px,1.34 + px,w.x)),in_);
  }
  if (uOwn[6]<.0) c=mix(c,(vec3(.62,.58,.52) - .3*max(uOwn[1],.0))*light*(.9 + .2*rpM.x),smoothstep(.5,.9,RP_TILE));
  // over the gap the boat is pale as bare glaze
  vec3 b=rpBoatAt(w - boat);
  if (edge) col=mix(col,c,lip);
  else col+=left*mix(c,rpGlaze()*light*.85,max(max(b.x,.7*b.y),max(b.z,rpBirds(w - boat))));
 }
 return uOwn[6]<.0 ? mix(col,tile,tiled) : col;
}
// The jars behind the first: across, away, radius, how tall beside it.
const vec4 RPJ[5]=vec4[5](vec4(.0,.0,1.,.9),vec4(-1.82,.5,.72,1.35),vec4(1.75,.35,.62,.95),vec4(-3.4,.2,.86,.8),vec4(3.15,.7,.8,1.5));
vec3 rpJar(vec2 p) {
 float near=max(-uOwn[3],.0),over=max(uOwn[3],.0),night=max(-uOwn[2],.0),noon=max(uOwn[2],.0);
 float turn=uTravel*.006 + .1*sin(TAU*uLoop),f=1.9 + .9*near;
 vec3 ro=vec3(-.07 - .1*near,.72 + .75*over,-2.),ta=vec3(ro.x,.19 + .2*over - .02*near,.0);
 float row=RP_ONE,open=RP_TILE;
 if (row>.0) { ro=mix(ro,vec3(-.5,.95 + 1.2*over,-6.6),row); ta=mix(ta,vec3(-.05,-.02,.0),row); f=mix(f,2.9 + 1.6*near,row); }
 if (open>.0) { ro=mix(ro,vec3(-.1,1.75 + .7*over,-1.6),open); ta=mix(ta,vec3(.0,-.32,-.02),open); f=mix(f,1.36 + .6*near,open); }
 vec3 fw=normalize(ta - ro),rt=normalize(cross(vec3(0,1,0),fw)),up=cross(fw,rt);
 vec3 rd=normalize(fw*f + rt*p.x + up*p.y);
 // the room behind, out of focus, its window off to the left
 vec3 key=mix(mix(vec3(1.,.93,.82),vec3(1.),noon),vec3(1.05,.76,.50),night)*(1. + .1*uLevel),fill=mix(vec3(.80,.88,1.)*(.26 + .22*noon),vec3(.10,.13,.20),night) + vec3(.12,.07,.03)*uMic;
 vec3 L=normalize(mix(vec3(-.75,.42,-.55),vec3(.75,.15,-.5),night));
 float glow=exp(-dot(p - vec2(-1.,.35),p - vec2(-1.,.35))*1.6);
 vec3 col=mix(vec3(.085,.065,.052),vec3(.46,.37,.28),glow)*(1. - .8*night) + noon*vec3(.42,.40,.37);
 if (uOwn[7]>.0) col=mix(col,uKind[4]*uKind[4]*(.12 + glow*.8 + .55*noon),.9*uOwn[7]*(1. - .6*night));
 const float H=.9;
 float lip=1.;
 vec3 jc=vec3(.0),jr=vec3(1.,H,1.);
 float jn=.0,table=max(row,open);
 // the table they stand on
 if (table>.0&&rd.y<-.01) {
  float tt=(-.8 - ro.y) / rd.y;
  vec2 g=ro.xz + rd.xz*tt;
  float sh=1.;
  for (int i=0; i<(uOwn[6]>.0 ? 5 : 1); i++) {
   vec4 k=i==0 ? vec4(.0,.0,1.,.0) : RPJ[i];
   k.x*=3. - 2.*row;
   vec2 v=g - k.xy;
   float along=dot(v,vec2(.78,.62)),off=dot(v,vec2(.62,-.78));
   sh*=1. - .75*(1. - smoothstep(.3*k.z,.75*k.z,length(v)));
   sh*=1. - .5*smoothstep(-.3,.3,along)*(1. - smoothstep(.7,2.2,along))*(1. - smoothstep(.35*k.z,.95*k.z,abs(off)));
  }
  float lum=mix(.42,1.25,noon)*mix(1.,.4*exp(-dot(g - vec2(2.2,-1.4),g - vec2(2.2,-1.4))*.12) + .06,night);
  vec3 tc=mix(vec3(.40,.31,.23),vec3(.66,.64,.60),noon);
  tc*=.85 + .3*noise(vec2(g.x*2.,g.y*26.));
  if (uOwn[7]>.0) tc=mix(tc,uKind[4]*uKind[4]*.9 + .03,.9*uOwn[7]);
  tc*=lum*sh*(1. + .1*uLevel)*mix(vec3(1.,.96,.9),vec3(1.1,.8,.55),night);
  col=mix(col,tc,table*(1. - smoothstep(1.6,4.5,g.y))*smoothstep(.01,.06,-rd.y));
 }
 if (row>.0) {
  // the lids' knobs, and the nearest of the jars
  float best=1e4;
  for (int i=0; i<5; i++) {
   vec4 k=i==0 ? vec4(.0,.0,1.,.9) : RPJ[i];
   k.x*=3. - 2.*row;
   vec3 rr=k.z*vec3(1.,k.w,1.),cc=vec3(k.x,mix(.0,-.8 + .92*rr.y,i==0 ? row : 1.),k.y);
   vec3 ka=(ro - cc - vec3(.0,rr.y*1.06,.0)) / (.115*k.z),kd=rd / (.115*k.z);
   float kA=dot(kd,kd),kB=dot(ka,kd),kh=kB*kB - kA*(dot(ka,ka) - 1.);
   if (kh>.0) {
    vec3 kn=ka - kd*((kB + sqrt(kh)) / kA);
    vec3 ink=uOwn[7]>.0 ? mix(rpPigBase(),rpInk(0),uOwn[7]) : rpPigBase();
    col=mix(col,rpGlaze()*exp(-ink*mix(1.1,.1,max(uOwn[1],.0)))*(fill*1.2 + key*max(dot(kn,L),.0)) + .5*key*pow(max(dot(kn,normalize(L - rd)),.0),40.),row*smoothstep(.0,.5,kh / max(kA*.06,1e-4)));
   }
   vec3 ja=(ro - cc) / rr,jd=rd / rr;
   float jA=dot(jd,jd),jB=dot(ja,jd),jh=jB*jB - jA*(dot(ja,ja) - 1.);
   if (jh<=.0) continue;
   float jt=(-jB - sqrt(jh)) / jA;
   if (jt<best) { best=jt; jc=cc; jr=rr; jn=float(i); }
  }
  if (best>9e3) return col;
 }
 vec3 a=vec3(ro.x,ro.y / H,ro.z),d=vec3(rd.x,rd.y / H,rd.z);
 if (row>.0) { a=(ro - jc) / jr; d=rd / jr; }
 float A=dot(d,d),B=dot(a,d),C=dot(a,a) - 1.,h=B*B - A*C;
 if (h<=.0) return col;
 float t=(-B - sqrt(h)) / A;
 vec3 P=ro + rd*t,n=normalize(P / vec3(1.,H*H,1.));
 float cut=mix(.87,.02,open),inside=.0,rim=1.;
 if (row>.0) { P-=jc; n=normalize(P / (jr*jr)); if (P.y + jc.y<-.8) return col; P*=vec3(1.,H / jr.y,1.); P.xz /= jr.x; }
 if (open>.0) {
  rim=P.y / H - cut;
  lip=abs(rim);
  if (rim>.0) {
   // in through the mouth, to the far wall
   t=(-B + sqrt(h)) / A;
   P=ro + rd*t;
   if (P.y / H>cut) return col;
   n=-normalize(P / vec3(1.,H*H,1.));
   inside=1.;
   rim=cut - P.y / H;
  } else rim=1.;
  if (inside<.5&&P.y<-.8) return col;
 }
 float phi=atan(P.x,-P.z),lat=asin(clamp(P.y / H,-1.,1.)),face=max(dot(n,-rd),.0);
 rpPx=1.04*t / (f*uRes.y) / max(face,.25);
 vec2 s=vec2(phi*1.3 + turn,(lat - .47)*1.3);
 if (row>.0) { rpPx /= jr.x; s.x+=jn*1.7; }
 float well=1.,panel=1.;
 if (inside>.5) {
  // six panels round the wall, and a picture in the well
  well=lat + .9;
  float pp=phi + .35*turn,id=floor(pp / (PI / 3.)),lp=(fract(pp / (PI / 3.)) - .5)*(PI / 3.);
  panel=(PI / 6. - abs(lp))*max(cos(lat),.1);
  s=well>.0 ? vec2(lp*.95*(.35 + .65*cos(lat)) + id*.62 + turn,.36 + lat*.92) : vec2(P.x*.8 + uTravel*.006,P.z*.8 + .04);
  rpPx*=.9;
 }
 vec2 boat=rpBoat();
 if(row>.0){ boat.x+=jn*1.7; boat.y=rpRiver(boat.x).x; }
 rpPaint(s,boat);
 if (inside>.5) {
  float edge=max(cut*1. - lat,.0);
  float band=well>.0 ? min(min(panel - .028,well - .07),edge - .09) : .05 - well;
  float deep=.75 + .35*rpN.x;
  rpD=mix(deep,rpD,smoothstep(-rpPx,rpPx,band));
  rpD+=.8*rpLine(band - .014,.0022);
  rpD*=smoothstep(.012 - rpPx,.012 + rpPx,edge)*smoothstep(.004 - rpPx,.004 + rpPx,abs(well - .012));
  rpD=mix(rpD,1.4,sat(uCue*1.2)*.8*step(.0,well)*smoothstep(-rpPx,rpPx,band)*step(.5,fract(floor((phi + .35*turn) / (PI / 3.))*.5)));
  if (uOwn[7]>.0) rpK=mix(rpInk(0),rpK,smoothstep(-rpPx,rpPx,band));
  s.y=-.3;
 }
 if (table>.0&&inside<.5) rpD=mix(rpD,.7*rpLine(s.y + .52,.004) + .6*rpLine(s.y + .55,.0015) + .8*rpWash(-.95 - s.y),table*rpWash(-.5 - s.y));
 // the rim's line, and the deep band above it
 rpD*=1. - smoothstep(.455 - rpPx,.455 + rpPx,s.y);
 rpD+=.9*rpLine(s.y - .46,.004) + .5*rpLine(s.y - .476,.0015);
 rpD+=smoothstep(.49 - rpPx,.49 + rpPx,s.y)*(1. - smoothstep(.71 - rpPx,.71 + rpPx,s.y))*(.75 + .4*rpN.x + .3*exp(-abs(s.y - .49)*60.));
 float dip=smoothstep(-rpPx,rpPx,1.3*max(uOwn[1],.0) - .62 - s.y + .03*sin(s.x*4.) + .02*sin(s.x*11.));
 if(table>.0&&uOwn[1]<=.0) dip=.0;
 vec3 c=rpFired(dip);
 // the body: throwing rings, and lobes or flat sides where the other worlds have them
 float turned=phi + turn / 1.3,part=mod(turned,PI / 6.) - PI / 12.;
 float yaw=uOwn[4]>.0 ? -uOwn[4]*part*(1. - smoothstep(.225,.2618,abs(part))) : -uOwn[4]*.32*sin(turned*12.);
 n.xz*=rot(yaw);
 n=normalize(n + vec3(.0,.012*sin(P.y*90.) + .02*(rpN.y - .5),.0));
 c*=mix(vec3(1.),vec3(.75,.87,.93),.6*max(-uOwn[4],.0)*smoothstep(.4,1.,-cos(turned*12.)));
 float dif=max(dot(n,L),.0);
 c*=fill*(.8 + .4*n.y) + key*.9*dif;
 // the window bent in the glaze
 vec3 r=reflect(rd,n);
 if (r.x<-.05) {
  vec2 g=abs(vec2(r.z,r.y) / -r.x - vec2(.12,.95)) / vec2(.34,.4);
  float blur=mix(.3,.06,uTone);
  float win=(1. - smoothstep(1. - blur,1. + blur,max(g.x,g.y)))*smoothstep(.03,.08,min(g.x,g.y));
  c+=win*(.19 + .4*uKeys + .1*uHigh)*vec3(.9,.96,1.)*(1. - .8*night);
 }
 c+=key*(.25*night + .06)*pow(max(dot(n,normalize(L - rd)),.0),60.);
 c+=(1. - smoothstep(.0,.5,face))*col*.5;
 // the bowl's near lip, and its side below it in shade
 if (open>.0) c=mix(inside>.5 ? c : c*(1. - .55*open*(1. - smoothstep(-.6,.0,P.y))),rpGlaze()*(fill + .55*key),open*(1. - smoothstep(.012,.012 + 3.*rpPx,lip)));
 // the mouth
 if (inside>.5) return mix(col,c*(1. - .35*exp(-rim*5.)*smoothstep(-.2,.6,dot(normalize(P.xz + 1e-4),L.xz))),smoothstep(.0,.014,rim));
 if (row>.0) {
  float lid=smoothstep(.765 - rpPx,.765 + rpPx,s.y),g=abs(s.y - .775);
  c=mix(c,c*.35,(1. - smoothstep(.004,.022,g))*.8*row);
  c*=1. - .55*row*exp(-max(P.y / H + .9,.0)*7.);
  c+=.13*uHits*row*(fill+key*dif);
  return mix(col,mix(c,vec3(.02),lid*(1. - row)),smoothstep(.0,6. / uRes.y,h));
 }
 c=mix(c,vec3(.02,.022,.03) + .05*key*smoothstep(.82,.9,s.y),smoothstep(.765 - rpPx,.765 + rpPx,s.y));
 return mix(col,c,smoothstep(.0,6. / uRes.y,h)*smoothstep(.0,rpPx*2.,rim));
}
vec3 render(vec2 p) { return uVar<.5 ? rpRack(p) : rpJar(p); }
