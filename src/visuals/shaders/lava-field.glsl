// name: Lava field
// a: Crust
// b: Shore
// what: Cooling lava seen from a low height at dusk: plates of black, rope-wrinkled crust drift and part over red and orange seams, and an open channel winds through them carrying rafts; or a dark slope at night where five red fingers run down into the sea, each raising steam lit from below, their light broken on the water.
// follows: The low band widens the seams and fingers; on the crust the piece heats its own place, high sounds throw sparks and keys brighten the sheen; on the shore each kind of sound feeds its own finger and steam, highs glint on the sea and keys light surf and stars; a hit cracks a plate or bursts at one finger's foot; a cue sends a bright surge down the flow.
// own: 0 1 many small plates (b: lava in broad sheets), -1 a few great ones (b: one finger only); 1 1 six sided columns side by side (b: a cone with its crater), -1 long strips (b: a low flat coast); 2 1 the fire and the rock in the sounds' colours, -1 the rock under white ash; 3 1 the fire is out and water stands in its place (b: waterfalls), -1 nearly all molten; 4 1 smooth black glass (b: a mirror sea), -1 broken small everywhere (b: a heavy swell); 5 1 low, with a far edge and a sky (b: the sea draws back), -1 straight down (b: an island); 6 1 by day, -1 deep night; 7 1 thick steam, -1 no channel (b: no steam)
float lfDay,lfNight,lfDye,lfAsh,lfOut,lfGlass;
vec3 lfTone; // the colour of a dyed fire here
// The light of hot rock, 0 cold to 1 nearly white.
vec3 lfHot(float t){
t=max(t,0.);
float t2=t*t,t4=t2*t2;
if(lfDye+lfOut>0.){
vec3 fire=vec3(2.6*t2*min(1.,.25+t*1.2),.55*t4,.05*t4*t4);
fire=mix(fire,lfTone*(1.7*t2*min(1.,.25+t*1.2))+.2*t4*t4,lfDye);
return mix(fire,(.25+.9*lfTone)*.28*t,lfOut);
}
return vec3(2.6*t2*min(1.,.25+t*1.2),.55*t4,.05*t4*t4);
}
float lfS(float a,float b,float x){x=sat((x-a)/(b-a));return x*x*(3.-2.*x);}
// A number for a place, and the noise from it, that hold however far the flow has run.
float lfHash(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float lfVal(vec2 p){
vec2 i=floor(p),f=p-i;f=f*f*(3.-2.*f);
return mix(mix(lfHash(i),lfHash(i+vec2(1,0)),f.x),mix(lfHash(i+vec2(0,1)),lfHash(i+vec2(1,1)),f.x),f.y);
}
vec3 lfInk(vec3 k){return k*k/max(max(k.r,max(k.g,k.b)),.05);}
// ---- a: the crust from above
float lfD,lfId; // distance to the plate's edge, a number of its own
vec2 lfN,lfC; // the way to that edge, the plate's middle
vec3 lfPoint(vec2 c){
vec3 q=fract((c.xyx+17.)*vec3(.1031,.103,.0973));q+=dot(q,q.yzx+33.33);q=fract((q.xxy+q.yzz)*q.zyx);
vec2 o=abs(fract(uTime*(.003+.008*q.yx)+q.xy)-.5)*4.-1.;
if(uOwn[1]>0.){
float even=sat(uOwn[1]);
return vec3(mix(.5+.28*(q.xy*2.-1.)+.08*o,vec2(.25+.5*mod(c.y,2.),.5)+.035*(q.xy*2.-1.),even),.2*q.z*(1.-even));
}
return vec3(.5+.28*(q.xy*2.-1.)+.08*o,.2*q.z);
}
// Plates of uneven size, corners rounded off.
void lfPlates(vec2 x){
vec2 ic=floor(x),f=x-ic,mo=vec2(0.),mr=vec2(0.);
float best=9.;
for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
vec2 o=vec2(i,j);
vec3 q=lfPoint(ic+o);
vec2 r=o+q.xy-f;
float d=dot(r,r)-q.z;
if(d<best){best=d;mo=o;mr=r;}
}
float b=9.,hard=9.;
for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
if(i==0&&j==0)continue;
vec2 o=mo+vec2(i,j);
vec3 q=lfPoint(ic+o);
vec2 r=o+q.xy-f,e=r-mr;
float l=length(e)+1e-4,d=(dot(r,r)-q.z-best)/(2.*l);
if(d<hard){hard=d;lfN=e/l;}
b=smin(b,d,.07);
}
lfD=b;lfC=x+mr;lfId=hash21(ic+mo+7.);
}
// Small sharp pieces, in one pass.
float lfShards(vec2 x){
vec2 ic=floor(x),f=x-ic,r1=vec2(1.),r2=vec2(2.);
float a=9.,b=9.;
for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
vec2 o=vec2(i,j),r=o+lfPoint(ic+o).xy-f;
float d=dot(r,r);
if(d<a){b=a;r2=r1;a=d;r1=r;}else if(d<b){b=d;r2=r;}
}
float l=length(r2-r1)+1e-4;
lfN=(r2-r1)/l;
return(b-a)/(2.*l);
}
// Noise, then its slope along x and y.
vec3 lfNoise(vec2 p){
vec2 i=floor(p),f=p-i,u=f*f*(3.-2.*f),du=6.*f*(1.-f);
float a=lfHash(i),b=lfHash(i+vec2(1,0)),c=lfHash(i+vec2(0,1)),d=lfHash(i+vec2(1,1)),k=a-b-c+d;
return vec3(a+(b-a)*u.x+(c-a)*u.y+k*u.x*u.y,du*(vec2(b-a,c-a)+k*u.yx));
}
// The skin of one plate: arched ropes, folds along the edge, grain. Its slope, then its height.
vec3 lfSkin(vec2 x,float e,vec2 n,float px){
mat2 R=rot((lfId-.5)*2.6);
vec2 q=R*(x-lfC);
vec3 wob=lfNoise(x*2.3+lfId*40.),w2=lfNoise(x*6.5),g1=lfNoise(rot(.6)*x*40.);
wob.yz*=2.3;w2.yz*=6.5;
float curl=1.2+1.5*fract(lfId*13.),fr=mix(33.,52.,fract(lfId*29.));
float v=fr*(q.y+curl*q.x*q.x+.34*wob.x+.07*w2.x),sv=sin(v);
float m=(1.-.97*max(lfGlass,sat(uOwn[1])))*.72*(.3+.7*lfS(.14,.42,wob.x)*lfS(.03,.2,e))/(1.+px*px*fr*fr*.6);
vec2 s=m*cos(v)*sv/sqrt(sv*sv+.006)*(vec2(2.*curl*q.x,1.)*R+.34*wob.yz+.07*w2.yz);
float fo=30.*e+4.*wob.x+1.5*w2.x,sf=sin(fo),far=1./(1.+e*e*160.);
s+=.024*far/(1.+px*px*500.)*cos(fo)*sf/sqrt(sf*sf+.015)*(4.*wob.yz+1.5*w2.yz-30.*n);
g1.yz*=(1.-.93*lfGlass)*(1.-.6*lfDay);w2.yz*=1.-.5*lfGlass;
if(lfGlass>0.)s+=lfGlass*.16*wob.yz;
s+=.03*w2.yz+.2*g1.yz*(1.+2.4*exp(-max(e,0.)*9.))/(1.+px*px*1500.);
float grain=lfS(.013,.004,px);
if(grain>0.)s+=grain*(1.-lfGlass)*.24*lfNoise(rot(.3)*x*116.).yz;
float ro=sat((e+.02)/.15);
return vec3(s-n*2.6*ro*(1.-ro),m/fr*abs(sv));
}
// The crack of a hit, running out both ways from the middle of a plate: how far inside its gap we are.
float lfCrack(vec2 q,float open){
q=rot(lfId*5.)*q;
if(open<.02)return-1.;
float y=q.y+.09*(noise(vec2(q.x*8.+9.,lfId*90.))-.5)+.03*(noise(vec2(q.x*30.+50.,lfId*70.))-.5);
float l=.2+.14*(1.-uHits);
return .016*open*lfS(l,l-.17,abs(q.x))-.003-abs(y);
}
// Specks of fire that rise and go out.
float lfSparks(vec2 p){
vec2 q=p*19.;q.x+=.3*sin(q.y*.9+uTime*.3);
q.y-=uTime*.45;
vec2 c=floor(q),h=vec2(lfHash(c),lfHash(c+41.7));
float l=length(q-c-.2-.6*h),tw=.5+.5*sin(uTime*(.8+h.x)+TAU*h.y);
return step(.6,fract(h.x*17.+h.y*5.))*tw*exp(-l*l*260.);
}
vec3 lfCrust(vec2 p){
 // heat haze
float far=sat(p.y+.5)*(1.-max(uOwn[5],0.));
p.x+=.0016*far*sin(p.y*70.-uTime*1.1+2.*sin(p.x*13.));
float D=1./max(1.-p.y,.2);
float low=max(uOwn[5],0.),top=max(-uOwn[5],0.),sky=0.,den=1.;
if(low>0.){den=mix(1.-p.y,(.25-p.y)*1.75,low);sky=lfS(.075,.06,den);D=1./max(den,.06);}
vec2 g=vec2(p.x*D,D);
if(top>0.){g=mix(g,vec2(p.x,p.y+1.)*1.1,top);D=mix(D,1.1,top);}
 // the piece heats its own place
vec4 m=piece(clamp(vec2((p.x+.88)/1.76,.5-p.y),.01,.99));
float here=sat(m.a),px=p.x-1.7*(uLoop-.5);
here=sat(here+.2*uLevel*exp(-px*px*30.)*sin(PI*uLoop));
vec3 ink=lfInk(m.rgb/max(max(m.r,max(m.g,m.b)),.02)+.02);
vec3 tint=mix(vec3(1.),.45+ink,.36*sat(m.a*1.5));
float glow=.86+.22*uEnergy;
 // the channel, an S from far right to near left
float zz=g.y-.68;
float cx=-.22+.74*zz+.2*sin(zz*4.4),sl=.74+.88*cos(zz*4.4),il=1./sqrt(1.+sl*sl);
float t=(g.x-cx)*il,hw=.115+.03*sin(g.y*9.+1.)+.012*uLow;
t+=.04*(noise(g*8.)-.5)+.016*(noise(g*26.)-.5);
float side=hw-abs(t);
if(uOwn[7]<0.)side+=.4*uOwn[7];
bool run=side>0.;
float SC=run?5.6:2.3;
if(uOwn[0]!=0.)SC*=exp2(uOwn[0]*(uOwn[0]>0.?1.15:.95));
float s=g.y*1.35+uTravel*.06;
vec2 x=run?vec2(t,s*.62)*SC:(g+vec2(.004,.006)*uTravel)*SC;
if(uOwn[1]<0.&&!run)x*=exp2(-uOwn[1]*vec2(1.35,-1.1));
float regular=1.-.85*sat(uOwn[1]);
if(regular<1.)x.y*=1.+.15*(1.-regular);
x+=.34*regular*vec2(noise(x*1.1+5.),noise(x*1.1+19.))+.05*regular*sin(x.yx*5.1+2.*sin(x*3.3));
float vary=noise(g*2.6+vec2(uTime*.008,7.));
 // some plates are broken small
float e2=9.;
vec2 n2=vec2(0.);
float brk=lfS(.52,.76,noise(x*.75+13.));
if(uOwn[4]<0.)brk=mix(brk,1.,-uOwn[4]);
brk*=(1.-lfGlass)*(1.-sat(uOwn[1]));
if(brk>0.&&!run){
float sd=lfShards(x*2.9+4.);
e2=(sd-(.008+.04*uLow*vary+.02*here)*brk+.5*(1.-brk))/2.9;n2=lfN*lfS(.09,.02,e2);
}
lfPlates(x);
float w=run?.04+.09*vary+.03*uLow:.003+.03*lfS(.45,.8,vary)+.055*uLow*vary*vary+.01*here;
if(uOwn[3]<0.)w+=-uOwn[3]*(run?.1:.05+.24*vary*(.7+.6*uLow));
if(lfOut>0.)w+=lfOut*(run?.12:.03+.05*vary)*(1.-.45*sat(uOwn[1]));
float e=lfD-w;
vec2 n=lfN;
if(e2<e){e=e2;n=n2;}
 // ragged, near the edge
if(e<.12)e-=(1.-.8*sat(uOwn[1]))*lfS(.12,.05,e)*(.055*(lfVal(x*8.)-.5)+.035*(lfVal(x*24.)-.5));
 // open rock along both banks, and a lip that holds it
float bank=(side-.035)*SC,lip=(.018-abs(side))*SC;
if(run&&bank<e){e=bank;n=vec2(sign(t),0.);}
vec2 across=run?vec2(1.,0.):vec2(1.,-sl)*il;
if(lip>e){e=lip;n=-sign(t)*across;if(!run)e=max(e,(.03+side)*SC);}
 // a hit cracks the plate near one of two places; which one changes slowly
float ck=-1.,turn=uTime*.05;
if(uHits>.01&&!run){
vec2 c=(lfC-.17)/SC-vec2(.004,.006)*uTravel;
float one=lfS(.26,.16,length(c-vec2(.42,.9)))*lfS(-.2,.4,sin(turn)),two=lfS(.26,.16,length(c-vec2(-.4,.95)))*lfS(-.2,.4,-sin(turn));
ck=lfCrack((x-lfC)/SC,uHits*max(one,two)*(1.-brk));
if(-ck*SC<e){e=-ck*SC;n=vec2(.5,.86);}
}
float pxl=D*SC/uRes.y,crust=lfS(-pxl,pxl,e);
 // molten rock
float warm=.2*uLow+.5*here+.12*uLevel+.08*(uTone-.5);
float cz=zz-.82*uCue,surge=lfS(0.,.4,uCue)*(cz>0.?exp(-cz*1.6):exp(-cz*cz*40.)),chan=run?1.:exp(side*14.);
warm+=.3*uHits*max(max(lfDye,lfAsh),max(lfDay,low))*lfS(.35,.75,vary);
if(lfDye+lfOut>0.)lfTone=mix(mix(uKind[1]*uKind[1],uKind[3]*uKind[3],lfS(.35,.65,noise(g*1.4+3.))),m.rgb*m.rgb/max(m.a*m.a,.05),.6*here)*1.5+.02;
vec3 red=lfHot((.36+.75*warm+.3*surge*chan)*glow)*tint,lava=vec3(0.);
if(crust<1.){
float deep=sat(-e/(w+.03));
vec2 fl=run?vec2(t*34.,s*5.):x*6.;
float skin=.6*lfVal(fl+3.*lfVal(fl*.5))+.4*lfVal(fl*2.7);
float thread=1.-abs(2.*lfVal(fl*vec2(1.6,.8)+5.*skin)-1.);
float T=(run?.3:.2)+.36*deep*(.35+skin)+.95*warm*(.35+.65*deep)+.12*thread*thread*thread*deep;
T-=(run?.36:.26)*lfS(.47,.62,skin)*lfS(.15,.6,deep)*(1.-.5*warm);
T=(T+.75*surge*chan+.7*uHits*lfS(-.01,.002,ck))*glow;
T=T<.6?T:.6+.6*(1.-exp(-(T-.6)*1.7));
lava=lfHot(T)*tint;
if(lfOut>0.){ // water, and the sky in it
vec3 rp=lfNoise(vec2(x.x*3.,x.y*4.5)+vec2(uTime*.13,-uTime*.2))+.5*lfNoise(vec2(x.x*7.,x.y*11.)-vec2(uTime*.2,uTime*.17));
float rf=sat(.3+.1*rp.z+.3*sat(p.y+.5));
vec3 wa=mix(uKind[0]*uKind[0]*mix(.5,.13,deep)+.004,mix(vec3(.06,.09,.14),uKind[1]*uKind[1]*.6,.6)*(1.+2.2*lfDay),rf*rf*1.4)+lfTone*(.04+.35*here+.3*lfS(.55,.95,rp.x*.7)*(.2+uLevel));
wa*=.55+.45*lfS(0.,.5,deep);
lava=mix(lava,wa,lfOut);
}
}
 // the side of a plate that faces us
float thick=.04*max(-n.y,0.),wall=sat(-e/(thick+1e-4));
lava=mix(vec3(.006)+red*.5*wall,lava,lfS(.8,1.,wall));
vec3 col=lava;
if(crust>0.){
vec3 sk=lfSkin(x,e,n,pxl);
if(lfAsh>0.)sk.xy*=1.-.45*lfAsh;
vec3 N=normalize(vec3(-sk.xy,.8).xzy);
vec3 V=normalize(vec3(-p.x,1.,-.9-p.y*.3)),L=normalize(vec3(-.62,.36,.7));
float nl=sat(dot(N,L)),sp=sat(dot(N,normalize(L+V)));
sp*=sp;sp*=sp*sp;sp*=sp;
vec3 cold=vec3(.3,.42,.62)*mix(.75,1.15,sat(.5-p.x*.5+p.y*.4));
vec3 rock=vec3(.045,.042,.046);
if(lfDye+lfAsh+lfDay>0.)rock=mix(mix(rock+lfDay*.06,uKind[0]*uKind[0]*.3+.02+uKind[2]*uKind[2]*.16*lfS(.4,.7,noise(x*1.3+31.)),lfDye),vec3(.5,.48,.46)*(.8+.3*noise(x*3.))+.12*m.rgb*here,lfAsh);
if(uOwn[1]>0.||lfDay>0.)rock*=mix(1.,.45+1.1*fract(lfId*3.7),max(.45*lfDay,sat(uOwn[1])));
cold*=1.-.8*lfNight;
vec3 k=rock*(.7+.6*fract(lfId*3.7))*(cold*nl*2.+vec3(.1,.12,.2)*N.y*.5);
k+=cold*sp*(.26+.2*uKeys)*(.3+fract(lfId*5.7))+cold*.1*pow(1.-sat(dot(N,V)),4.);
if(lfDay>0.){
vec3 S=normalize(vec3(.72,.42,.25));float sn=sat(dot(N,S));
k=mix(k,rock*(vec3(1.5,1.25,.95)*2.3*sn*(.8+.3*uLevel)+vec3(.34,.42,.52)*(.35+.65*N.y)),lfDay);
}
if(lfGlass>0.){
vec3 R=reflect(-V,N);float hz=exp(-R.y*R.y*9.),fr=pow(1.-sat(dot(N,V)),3.);
k+=lfGlass*(.04+.6*fr+.3*hz)*mix(vec3(.1,.14,.22),uKind[1]*uKind[1]*.7+.02,.7)*(.5+.7*uPad+1.2*lfDay)*(.35+1.1*lfS(.2,.75,noise(R.xz*2.+x*.25)));
}
k*=.25+.75*lfS(0.,.1,e);
 // light thrown up by the seam, and by the channel
float tow=sat(dot(N,normalize(vec3(n.x,.15,n.y))));
k+=red*(tow*tow*.7+.008)*exp(-max(e,0.)*22.)*sat(w*24.);
vec2 to=-sign(t)*across;
k+=lfHot(.6*glow+.3*warm+.35*surge)*(run?.1:.2*exp(side*14.))*sat(dot(N,normalize(vec3(to.x,.12,to.y))))*(run?.4:1.);
k+=red*.7*exp(-max(e,0.)*70.);
k+=lfHot(.72)*exp(ck*60.)*.6*uHits*mix(vec3(1.),lfInk(uKind[4]),.3);
col=mix(lava,k,crust);
}
 // haze, and sparks over the open rock
float puff=0.;
if(uOwn[7]>0.){ // steam off the seams
vec2 sq=vec2(p.x*2.6-.4*p.y,p.y*2.9-uTime*.035)+.2*vec2(sin(p.y*4.+uTime*.05),0.);
float f=fbm(sq+.5*noise(sq*1.7-uTime*.02)),f2=fbm(sq+vec2(.12,-.14));
puff=uOwn[7]*lfS(.4,.72,f+.18*exp(-abs(t)*4.)+.06*uTexture+.05*sat(p.y))*.88;
vec3 st=mix(mix(vec3(.07,.08,.1),uKind[2]*uKind[2]*.4+.03,.5),vec3(1.,.98,.95),lfDay)*(.6+1.6*sat(.5+3.*(f-f2)))+lfHot(.5+.3*warm)*(.12+.7*exp(-abs(t)*4.5))*sat(.6-3.*(f-f2))*(1.-.6*lfDay);
col=mix(col,st,puff);
}
vec3 air=vec3(.02,.026,.044)+lfHot(.33+.15*uLevel+.15*uMic)*.22*exp(-abs(t)*2.5);
if(low+lfDay+lfNight>0.){
air=mix(air*(1.-.8*lfNight),mix(vec3(.75,.76,.76),uKind[1]*uKind[1]+.25,.4)*(.8+.2*uLevel),lfDay);
if(low>0.){
float hz=(.93-.5625*low)/(1.+.75*low),hy=max(p.y-hz,0.);vec3 hi=mix(uKind[0]*uKind[0]*.12+.004,vec3(.45,.55,.65)+uKind[0]*.2,lfDay);
air=mix(air,mix(uKind[1]*uKind[1]*.3+.015,air,lfDay),.7*low);
col=mix(col,air,sat((D-2.2)*.17)*lfS(0.,.4,low));
vec3 sk=mix(air,hi,lfS(.0,.3,hy+.1*(fbm(vec2(p.x*1.5+uTime*.004,p.y*6.))-.5)));
vec2 sc=p-vec2(-.38,hz+.18);float sl=length(sc);
sk+=(uKind[3]*uKind[3]*.9+.05)*(lfS(.085+1.5/uRes.y,.085-1.5/uRes.y,sl)*(.45+.4*noise(sc*14.))+.1*exp(-sl*5.))*(.6+.4*uLevel)*(1.-.4*lfDay);
float ridge=.02+.05*noise(vec2(p.x*3.5,2.))+.02*noise(vec2(p.x*13.,6.));
sk=mix(sk,air*mix(.3,.75,lfDay),lfS(.002,-.002,p.y-hz+.01-ridge));
col=mix(col,sk,sky);
}
}
col=mix(col,air,(1.-sky)*sat((D-.9)*(.26+.2*uSpace))*(1.-.85*low)*(1.-.6*lfDay));
if(uHigh>.01&&abs(t)<.4)col+=lfHot(.9)*3.*uHigh*lfSparks(p)*exp(-max(abs(t)-.05,0.)*12.);
return screenOf(col);
}
// ---- b: the shore at night
float lfSlope(float x){
if(uOwn[5]<0.)return mix(sat((x+.8)/1.7),.95*lfS(.62,.12,abs(x-.22)),-uOwn[5]);
return sat((x+.8)/1.7);
}
const float LF_PEAK=.22;
float lfTop(float x){
float s=lfSlope(x);
if(uOwn[1]!=0.){
float c=max(uOwn[1],0.),d=abs(x-LF_PEAK),cone=.43*exp(-max(d-.045,0.)*3.3)-.02+.016*noise(vec2(x*14.,4.))*lfS(.02,.1,d)-.012*lfS(.05,.03,d);
float was=.34*s*(.7+.3*s)+s*(.018*sin(x*8.+1.)+.008*sin(x*23.+2.*sin(x*7.))+.003*sin(x*71.+3.*sin(x*31.)));
return mix(was*(1.-.72*max(-uOwn[1],0.)),cone*lfS(0.,.25,s),c);
}
return .34*s*(.7+.3*s)+s*(.018*sin(x*8.+1.)+.008*sin(x*23.+2.*sin(x*7.))+.003*sin(x*71.+3.*sin(x*31.)));}
float lfEdge(float x){float s=lfSlope(x);if(uOwn[5]<0.)s*=1.+.7*uOwn[5];else s*=1.+.75*uOwn[5];return-.22*s*(.82+.18*s)-s*(.016*sin(x*11.+2.)+.008*sin(x*27.+2.*sin(x*9.))+.004*sin(x*66.+2.5*sin(x*29.)));}
const int lfKind[5]=int[5](1,2,4,0,3);
const vec3 lfFoot[5]=vec3[5](vec3(-.43,-.0409,.589),vec3(-.20,-.0657,.738),vec3(.04,-.1058,.894),vec3(.30,-.1284,1.062),vec3(.64,-.1805,1.282));
// Billows; x is all of them, y the two large ones alone.
vec2 lfPuff(vec2 q){
float a=.55*abs(2.*lfVal(q)-1.);q=rot(.7)*q*2.07+3.3;
float b=a+.275*abs(2.*lfVal(q)-1.);q=rot(.7)*q*2.07+3.3;
return vec2(b+.14*abs(2.*lfVal(q)-1.)+.07*lfVal(q*2.07),b);
}
float lfBig(vec2 q){return .55*abs(2.*lfVal(q)-1.)+.275*abs(2.*lfVal(rot(.7)*q*2.07+3.3)-1.);}
vec3 lfCoast(vec2 p){
lfTone=uKind[1]*uKind[1]*1.4+.03;
float top=lfTop(p.x),edge=lfEdge(p.x),slope=lfSlope(p.x),px=1.2/uRes.y;
float glow=.86+.22*uEnergy,tone=.08*(uTone-.5);
float lv[5],here[5];vec3 fire[5],tin[5],foot[5];
for(int i=0;i<5;i++){
float at=lfFoot[i].x-1.7*(uLoop-.5);
lv[i]=sat((i==0?uPad:i==1?uTexture:i==2?uHits:i==3?uDrone:uPhrase)+.2*uLevel*sin(PI*uLoop)/(1.+30.*at*at));
tin[i]=mix(vec3(1.),.45+lfInk(uKind[lfKind[i]]),.3);
if(lfDye+lfOut>0.)lfTone=uKind[lfKind[i]]*uKind[lfKind[i]]*1.5+.02;
fire[i]=lfHot((.36+.5*lv[i]+tone)*glow)*tin[i];
foot[i]=lfFoot[i];here[i]=1.;
if(uOwn[0]<0.&&i==3)lv[i]=sat(lv[i]-uOwn[0]*(.5*uPhrase+.3*uHits));
if(uOwn[0]<0.)here[i]=i==3?1.:sat(1.+uOwn[0]*1.02);
if(uOwn[5]!=0.){foot[i].x=mix(foot[i].x,.22+(float(i)-2.)*.13,max(-uOwn[5],0.));foot[i].y=lfEdge(foot[i].x)+.012;}
fire[i]*=here[i];
}
 // sky
vec3 col=mix(vec3(.016,.026,.05),vec3(.003,.005,.013),lfS(-.02,.42,p.y));
col+=vec3(.02,.03,.045)*exp(-abs(p.y)*14.)*lfS(.6,-.9,p.x);
if(p.y>0.){
vec2 sc=floor(p*46.),sh=hash22(sc+4.);
float sl=length(p*46.-sc-.15-.7*sh);
col+=vec3(.5,.6,.8)*step(.8,hash21(sc+9.))*exp(-sl*sl*260.)*(.4+sh.x)*lfS(.02,.2,p.y)*(.8+.2*sin(uTime*.4+TAU*sh.y)+1.6*uKeys);
}
if(lfDay>0.){
float cl=fbm(vec2(p.x*1.4+uTime*.006,p.y*5.+2.));
vec3 d=mix(uKind[1]*uKind[1]*.9+.3,uKind[0]*uKind[0]*.6+.22,lfS(0.,.45,p.y+.16*(cl-.5)))*(.85+.2*uLevel);
d+=.22*lfS(.5,.75,cl);
col=mix(col,d,lfDay);
}
if(lfNight>0.)col*=1.-.75*lfNight*lfS(.2,-.1,p.y);
if(uOwn[7]<0.||uOwn[5]<0.){ // a moon
float mo=max(-uOwn[7],0.)*(1.-lfDay),ml=length(p-vec2(-.42,.3));
col*=1.-min(mo*1.5,1.)*lfS(.047+px,.047-px,ml);
col+=mo*(uKind[3]*uKind[3]+.06)*(lfS(.047+px,.047-px,ml)*.8+(.07+.25*uPad)*exp(-ml*6.))*(.6+.4*uLevel);
}
 // the land
float v=max(p.y-edge,0.)/max(top-edge,.01),land=lfS(-px,px,top-p.y)*lfS(0.,.01,top-edge);
if(p.y<top+.01&&p.y>edge-.02&&land>0.){
 // old flows down to a dark cliff
float rise=top-edge,u=p.x-.35*v+.05*noise(p*12.),cliff=lfS(.34,.2,v+.14*noise(vec2(u*12.,3.)));
vec2 a1=vec2(u*26.,v*rise*mix(42.,20.,cliff));
float b1=noise(a1),rk=b1-noise(a1+vec2(.3,-.35))-.35*dot(lfNoise(vec2(u*90.,v*rise*110.+4.*b1)).yz,vec2(.4,-.5));
float grit=noise(p*210.);
vec3 k=vec3(.016,.023,.036)*sat(.22+rk*1.3)*(.5+grit)*mix(.5+.9*v,.2,cliff);
k+=vec3(.02,.028,.042)*exp(-(top-p.y)*90.);
if(lfDay+lfAsh+lfDye>0.){
vec3 rock=mix(mix(vec3(.12,.11,.12),uKind[0]*uKind[0]*.5+.02,lfDye),vec3(.8,.84,.9),lfAsh*lfS(.12,.4,v+.25*rk));
k=mix(k,rock*(.12+1.5*sat(.28+rk*1.1))*(.7+.4*grit)*mix(.25+.2*lfDye,1.2,lfDay)*mix(1.,.6,cliff*(1.-lfAsh)),max(lfDay,max(lfAsh,.8*lfDye)));
}
if(lfNight>0.)k*=1.-.7*lfNight;
 // thin threads between the fingers
float some=lfS(.5,.75,noise(vec2(u*9.+3.,v*4.+9.)))*lfS(.95,.6,v);
if(uOwn[0]<0.)some*=1.+uOwn[0];
if(uOwn[3]<0.||uOwn[0]>0.)some=mix(some,lfS(.3,.6,noise(vec2(u*9.+3.,v*4.+9.)))*lfS(1.,.8,v)*1.6,max(max(-uOwn[3],uOwn[0]),0.));
if(some>0.){
float cr=abs(noise(vec2(u*26.+.8*noise(vec2(u*14.,v*6.)),v*2.+20.))-.5);
k+=lfHot((.3+.45*uLow+.15*uLevel)*glow)*lfS(.045,0.,cr)*some*(.2+grit);
}
for(int i=0;i<5;i++){
float fi=float(i),w=.013*foot[i].z*(1.15-.5*v)*(1.+.5*lv[i]+.4*uLow);
if(here[i]<.01)continue;
w*=here[i]*(1.+1.3*max(uOwn[0],0.)+.6*max(-uOwn[3],0.));
float mid=foot[i].x+v*(.16+.05*fi)+.11*(noise(vec2(v*3.2,fi*7.))-.5)*lfS(0.,.2,v);
if(uOwn[1]>0.)mid=mix(mid,mix(foot[i].x,LF_PEAK+(fi-2.)*.012,lfS(0.,1.,v))+.04*(noise(vec2(v*5.,fi*7.))-.5)*lfS(0.,.2,v)*lfS(1.,.7,v),uOwn[1]);
float dx=p.x-mid;
if(abs(dx)>.22)continue;
float fork=.04*foot[i].z*lfS(.75,.1,v)*(i==1||i==4?1.:.5);
float two=min(abs(dx-fork),abs(dx+fork*.7));
two+=.9*w*(noise(vec2(p.x*50.,v*14.+fi))-.5)+.5*w*(grit-.5)*(1.-lfOut);
float in_=lfS(w+px+.5*w*lfOut,w-px-.4*w*lfOut,two),core=sat(1.-two/w);
float crust=lfS(.42,.66,noise(vec2(dx/w*.7+fi*9.,v*16.*(.5+slope)+uTravel*.12)));
float cq=v-uCue*.55,surge=lfS(0.,.5,uCue)*(cq>0.?exp(-cq*1.2):exp(-cq*cq*60.));
if(lfDye+lfOut>0.)lfTone=uKind[lfKind[i]]*uKind[lfKind[i]]*1.5+.02;
float T=(.3+.3*core+(.2+.35*core)*lv[i]+.1*exp(-v*9.)+tone+.7*surge)*glow-crust*(.28-.1*lv[i]);
in_*=lfS(.98,.7,v+.15*noise(vec2(p.x*30.,fi)));
k+=fire[i]*(.3+1.*surge)*exp(-two/w*.55)*(.06+.8*sat(.2+rk*1.6))*(.5+grit);
vec3 flow=lfHot(T)*tin[i];
if(lfOut>0.)flow=mix(flow,mix(vec3(.5,.56,.62),vec3(1.),lfDay)*(.12+.75*lfS(.25,.8,noise(vec2(dx/w*2.2+fi*5.,v*rise*40.+uTime*1.1))*.6+.4*core))*(.4+.8*lv[i])+lfTone*(.08+.6*lv[i]),lfOut);
if(uOwn[3]<0.)flow*=1.-.35*uOwn[3];
k=mix(k,flow,in_);
}
k=mix(mix(vec3(.012,.018,.033),col,lfDay),k,lfS(0.,.4,slope+.1));
col=mix(col,k,land);
}
 // the sea
float wet=lfS(px,-px,p.y-min(edge,0.));
if(wet>0.){
float d=max(-p.y,.002),ld=log(d+.004);
vec2 rq=vec2(p.x/(d+.07)*2.,ld*13.+uTime*.3);
float calm=lfGlass,swell=max(-uOwn[4],0.),fade=lfS(0.,.05,d);
if(swell>0.)rq*=1.-.45*swell;
float r1=lfVal(rq+vec2(uTime*.12,0.)),r2=lfVal(rq*vec2(2.7,2.3)-vec2(uTime*.2,4.)),r3=lfVal(rq*vec2(6.5,5.5)+vec2(uTime*.3,9.)),rip=mix(.5,.5*r1+.36*r2+.14*r3,fade);
if(calm>0.)rip=mix(rip,.57+.1*(rip-.5),calm);
if(swell>0.)rip=mix(rip,sat(.5+1.1*(r1-.5)+.5*(r2-.5)),swell);
float gl=lfS(.46,.68,rip);
vec3 k=vec3(.003,.006,.011)+vec3(.016,.026,.045)*exp(-d*9.)+vec3(.012,.018,.026)*gl*lfS(.5,-.8,p.x);
if(lfDay>0.)k=mix(k,mix(uKind[0]*uKind[0]*.35+.04,uKind[1]*uKind[1]*.8+.25,sat(.2+.8*gl*exp(-d*1.5)+.5*exp(-d*7.)))*(.8+.2*uLevel),lfDay*.95);
if(swell>0.){k*=1.+swell*(3.4*(r1-.45));k+=swell*mix(vec3(.05,.06,.075),vec3(.75),lfDay)*lfS(.72,.86,rip+.15*(r3-.5))*lfS(.02,.2,d)*.8;}
if(uOwn[7]<0.){float mx=(p.x+.42+(rip-.5)*(.05+.4*d))/(.02+.12*d*(1.-.6*calm));k+=-uOwn[7]*(uKind[3]*uKind[3]*.5+.03)*exp(-mx*mx)*(.1+1.2*gl)*(.6+.4*uLevel)*(1.-lfDay);}
if(calm>0.){ // the land stands on its head in it
float mt=lfTop(p.x+.01*(r2-.5)),my=2.*min(edge,0.)-p.y;
k*=1.-.6*calm*lfS(px,-px*4.,my*.9-mt)*lfS(0.,.02,mt-edge);
}
for(int i=0;i<5;i++){
float dd=max(foot[i].y-p.y,0.),rx=p.x-foot[i].x+(rip-.5)*(.06+.5*dd);
float wi=.022*foot[i].z+.16*dd;
if(calm>0.)wi*=1.-.6*calm*sat(dd*4.);
float ex=exp(-dd*4.8),nar=sat(1.-rx*rx/(3.*wi*wi)),wide=1./(1.+rx*rx*9./foot[i].z);
k+=fire[i]*ex*(nar*nar*(.08+1.5*gl*(1.+2.5*uHigh*r3*r3))*lfS(-.03,.01,foot[i].y-p.y)+wide*wide*(.015+.09*gl));
}
 // surf at the foot of the rock
float off=edge-p.y;
if(off<.06&&slope>0.){
float wave=.5+.5*sin(uTime*.5+p.x*5.+3.*noise(vec2(p.x*6.,0.)));
float foam=lfS(.016,0.,abs(off-.014*slope*(.4+wave)))*slope*lfS(.3,.75,noise(vec2(p.x*38.+p.y*60.,p.y*130.+3.*sin(p.x*41.))));
vec3 near=vec3(.02,.03,.045)+lfDay*.6;foam*=1.+1.5*swell;
for(int i=0;i<5;i++){float rx=p.x-foot[i].x;near+=fire[i]*exp(-rx*rx*160.);}
k+=near*foam*(1.2+3.*uKeys);
}
col=mix(col,k,wet);
}
 // steam, lit from below
float dens=0.;vec3 lit=vec3(0.);
for(int i=0;i<5;i++){
float h=(p.y-foot[i].y)/foot[i].z;
if(h<-.06)continue;
float hp=max(h,0.),cx=foot[i].x-foot[i].z*(.32*hp+.5*hp*hp),wd=foot[i].z*(.045+(.3+.1*uSpace)*hp);
if(uOwn[7]>0.)wd*=1.+.7*uOwn[7];
float dx=(p.x-cx)/wd,kn=sat(1.-.28*dx*dx),ex=exp(-hp*1.4),e2=ex*ex;
if(kn<=0.)continue;
float a=kn*kn*kn*lfS(-.06,.02,h)*ex*(i==2?.65:.5+.5*lv[i]);
a*=here[i]*(1.+.8*max(uOwn[7],0.))*(1.+min(uOwn[7],0.))*(1.-.55*lfOut)*(1.-.75*max(uOwn[1],0.))*(1.+.5*min(uOwn[1],0.));
dens+=a;lit+=a*fire[i]*(e2*e2*1.9+.035)*(1.+.6*uMic);
}
if(dens>.01){
vec2 q=vec2(p.x*6.5+p.y*2.,p.y*6.5)+vec2(uTime*.05,-uTime*.11);
q+=.16*sin(q.yx*1.7+2.*sin(q*.9));
vec2 pu=lfPuff(q);
float f=pu.x,dif=pu.y-lfBig(q+vec2(.16,-.2))+1.2*(pu.x-pu.y-.1);
float a=lfS(.38,.74,dens*1.35+(f-.4)*.9);
float under=sat(.4+dif*1.9);
vec3 fl=lit/dens,st=mix(fl,vec3(1.,.7,.58)*dot(fl,vec3(.6,.3,.1)),.32)*(.06+1.9*under*under);
st+=vec3(.03,.04,.06)*(.35+1.3*sat(.5-dif*1.8))*(.5+f);
if(lfDay+lfNight>0.){st=mix(st,(mix(vec3(.95,.93,.9),uKind[2]*uKind[2]+.3,.3))*(.45+.95*sat(.45+dif*1.6))+fl*.5,lfDay);st*=1.-.7*lfNight;a*=1.-.4*lfNight;}
col=mix(col,st,a*.93);
col+=lit*.08;
}
 // a hit: drops thrown up at the middle finger
if(uHits>.01&&length(p-foot[2].xy)<.4){
float t=1.12-uHits,b=0.;
for(int i=0;i<14;i++){
vec2 h=hash22(vec2(i,3)),at=foot[2].xy+vec2((h.x-.5)*.34,.14+.3*h.y)*t-vec2(0.,.26*t*t);
float l=length(p-at);
b+=.0000035*(.5+h.y)/(l*l+.000006);
}
col+=lfHot(1.)*tin[2]*b*uHits*2.*lfS(0.,.1,uHits);
}
return screenOf(col);
}
vec3 render(vec2 p){
lfDay=max(uOwn[6],0.);lfNight=max(-uOwn[6],0.);lfDye=max(uOwn[2],0.);lfAsh=max(-uOwn[2],0.);lfOut=max(uOwn[3],0.);lfGlass=max(uOwn[4],0.);
lfTone=vec3(1.);
if(uVar<.5)return lfCrust(p);return lfCoast(p);}