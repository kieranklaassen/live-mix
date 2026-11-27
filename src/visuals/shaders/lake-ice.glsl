// name: Lake ice
// a: Bubble stacks
// b: Skate marks
// what: Clear bottle-green lake ice looked down into, with stacks of flat white bubbles frozen one under another, cracks that are pale walls going down, fine pearls, and dry snow drifted over one side; or grey evening ice from higher up, crossed by long skate strokes of fine white powder, one lantern low over it and a reed edge.
// follows: Each kind swells and whitens the bubbles at its own depth, or its own strokes; the piece says which stacks are full, or where powder is bright. The mix is the daylight or the lamp, bands brighten single bubbles or strokes. A hit runs a hairline crack or throws powder; a cue lights one long crack, or the lamp and one stroke. The loop skates a circle.
// own: 0 1 many: small stacks (b: a tangle of strokes), -1 few and great; 1 1 leaves held in the ice (b: rings), -1 six armed frost stars (b: straight lanes); 2 1 upright blocks (b: plates and open leads), -1 no cracks (b: clean, with bubbles in it); 3 1 pale day ice, -1 dyed in the sounds' colours; 4 1 snow over nearly all, -1 none; 5 1 the eye low (b: with a sky), -1 straight down; 6 1 a low sun (b: a disc and its path), -1 lit from below (b: a row of lanterns); 7 1 pearls rising (b: a thicket of reeds), -1 fish under it (b: no shore)
float liPx,liHit; // a pixel; a hit that is no cue
float liW,liD,liL,liT;
// A smooth step that may also run downward.
float liS(float a,float b,float x){x=sat((x-a)/(b-a));return x*x*(3.-2.*x);}
float liLv(int k){return k==0?uDrone:k==1?uPad:k==2?uTexture:uPhrase;}
vec3 liHue(int k){vec3 c=uKind[k];return c*c*.9+c*.25+.05;}
float liH(float n){n=fract(n*.1031+.37);n*=n+33.33;n*=n+n;return fract(n);}
vec2 liUV(vec2 w){return vec2(w.x/1.78+.5,.5-w.y);}
// A jagged line: its height, its slope.
vec2 liJag(float s,float seed){
float i=floor(s),f=s-i,a=liH(i+seed),b=liH(i+1.+seed);
return vec2(mix(a,b,f),b-a);
}
// Upright blocks. x how far from the nearest edge, y how far along v to a wall, z which wall, w the block.
vec4 liBlocks(vec2 x,vec2 v){
vec2 i0=floor(x),f=x-i0,mr=vec2(.0),mg=vec2(.0);float md=9.;
for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
vec2 g=vec2(float(i),float(j)),r=g+.5+.75*(hash22(i0+g)-.5)-f;
float d=dot(r,r);
if(d<md){md=d;mr=r;mg=g;}
}
vec3 o=vec3(9.,9.,.0);
for(int j=-2;j<=2;j++)for(int i=-2;i<=2;i++){
vec2 g=mg+vec2(float(i),float(j)),r=g+.5+.75*(hash22(i0+g)-.5)-f,e=r-mr;
float l=length(e);
if(l>.001){
e/=l;
float d=dot(.5*(mr+r),e),rate=dot(v,e);
o.x=min(o.x,d);
if(rate>.001&&d/rate<o.y)o.yz=vec2(d/rate,.5+.5*dot(e,vec2(.7,.714)));
}
}
return vec4(o,hash21(i0+mg+7.7));
}
// ---------- a: looking down into the ice ----------
const vec3 LI_AB=vec3(3.4,.62,.8);
vec2 liVP; // where every upright line leads
vec2 liCam;float liDeep;
vec3 liFar,liAb; // the colour of the deep, what a depth of one takes
// What is seen of a colour so deep in the ice.
vec3 liDepth(vec3 c,float z){return mix(liFar,c,exp(-z*1.1))*exp(-z*liAb);}
// The colour of a thing in the ice.
vec3 liStuff(vec3 c,vec3 hue,float light){
float leaf=liL;light+=.3*uCue;
c=mix(c,hue*hue*(.12+1.5*light)+hue*.08,leaf*.93);
c=mix(c,hue*(.2+.85*light)+.1*light,liD*.75*(1.-leaf));
return mix(c,hue*(.05+.35*light)*mix(.6,2.4,leaf),liW*.92);
}
// Its form: how far out q is (1 is its edge); y a vein.
vec2 liForm(vec2 q,float a,float seed){
float leaf=liL,star=liT,d=length(q);
vec2 o=vec2(d,.0),r=rot(a)*q;
if(leaf>.0){
float bend=r.y+.22*(r.x*r.x-.3)*(fract(seed*7.1)-.5)*2.,x=sat(.5+r.x/2.5),wide=.03+.62*pow(4.*x*(1.-x),.8)*(1.15-.5*x);
float saw=.06*abs(fract(r.x*5.-abs(bend)*2.)-.5);
float l=max(abs(bend)/(wide+saw),abs(r.x)/1.25);
float stem=max(abs(bend)/.035,abs(r.x+1.3)/.4);
o.x=mix(o.x,min(l,stem),leaf);
o.y=leaf*max(liS(.06,.0,abs(bend)),.6*liS(.35,.0,abs(fract(r.x*4.-abs(bend)*3.)-.5)*2.));
}
if(star>.0){
float an=atan(r.y,r.x+1e-5)/TAU*6.,f=abs(fract(an)-.5)*2.;
float side=(1.-f)*PI/6.*d,along=d*1.1;
float arm=.055+.05*liS(1.1,.0,d),barb=abs(fract(along*4.5-side*3.)-.5)*2.;
float reach=.36*liS(1.2,.25,d);
float s=min(side/arm,max(side/max(reach,.02),.45+barb*1.3))*.85;
o.x=mix(o.x,max(s,d/1.3),star);
o.y=star*liS(.6,.0,side/arm);
}
return o;
}
// Many small stacks, in four floors.
vec3 liMany(vec3 col,vec2 p,float much){
float cell=.115*(1.+.75*liL);
for(int k=0;k<4;k++){
float fk=float(k),z=liDeep*.62*(1.-fk/3.1)+.01;
vec2 g=rot(.3)*(liVP+liCam+(p-liVP)*(1.+z))/cell,id=floor(g),h=hash22(id+3.);
vec4 pc=piece(clamp(liUV(transpose(rot(.3))*(id+.5)*cell),.03,.97));
float on=sat(.25+.9*pc.a),lv=liLv(k),hk=liH(h.x*91.+fk);
float r=(.14+.24*h.y*h.y)*(.75+.25*hk)*(.75+.35*on+.15*lv*on)*much;
r*=1.+.35*(liL+liT);
r=min(r,.44)*step(.32-.25*much,h.x);
if(r>.02){
vec2 q=(fract(g)-.5-(.46-r)*(hash22(id+fk*.31)-.5)*1.6)/r;
if(liL+liT==.0)q+=.16*(vec2(noise(q*1.7+h*60.),noise(q*1.7-h*40.))-.5);
vec2 fo=liForm(q*(1.+.35*(liL+liT)),h.y*TAU+fk*1.3,hk);
float aa=1.6*liPx*(1.+z)/(cell*r),m=liS(1.+aa,1.-aa,fo.x),side=dot(q,vec2(.62,.78));
float white=.25+.35*on+.4*uCue+lv*(.2+.7*on)*(.45+.55*uEnergy)+.3*uBands[k*2+1]*on;
float rim=liS(.16+aa,.0,abs(fo.x-.9)),frost=noise(q*3.2+h*50.);
float light=(.3+.75*white)*(.7+.4*side)*(.7+.5*frost)+rim*.4+fo.y*.35;
vec3 hue=mix(liHue(k),pc.rgb/max(pc.a,.05),.5*sat(pc.a*2.));
col*=1.-.4*liS(1.25,.7,length(q+vec2(.2,.28)));
vec3 c=mix(vec3(.86,.97,1.),hue*1.6,.35*lv)*light*1.5;
col=mix(col,liDepth(liStuff(c,hue,light)*(uOwn[6]<.0?1.+uOwn[6]*(.85-.7*rim):1.),z),m*sat(.35+.5*white+rim*.4));
}
}
return col;
}
// Fish under the ice.
vec3 liFish(vec3 col,vec2 p,float much){
for(int i=0;i<7;i++){
float fi=float(i),h=liH(fi*3.7+2.),z=.25+.5*h,T=uTime*(.05+.03*h)*(h>.5?1.:-1.)+fi*2.1;
vec2 w=liVP+liCam+(p-liVP)*(1.+z),A=vec2(.5+.45*liH(fi+9.),.3+.3*h);
vec2 c=vec2(.12,-.12)+.5*vec2(fi*.4-1.3,.9*cos(fi*1.7))+A*vec2(cos(T),sin(T+.6*h))*.75,dir=vec2(-sin(T)*A.x,cos(T+.6*h)*A.y)*(h>.5?1.:-1.);
dir/=max(length(dir),.001);
float L=(.18+.13*liH(fi*1.9+4.))*(1.+.12*liLv(i % 4));
vec2 v=(w-c)/L,sh=v+vec2(.25,.4);
if(dot(v,v)<4.){
vec2 q=vec2(dot(v,dir),dot(v,vec2(-dir.y,dir.x)));
q.y+=.13*sin(q.x*2.6+uTime*1.1+fi*2.)*liS(.5,-1.2,q.x);
float x=sat(.5+q.x*.5),wide=.62*x*sqrt(max(1.-x,.0))+.025;
float body=liS(wide+.03,wide-.03,abs(q.y))*liS(-1.02,-.95,q.x)*liS(1.02,.98,q.x);
float ft=-q.x-.85,tail=liS(.03,-.03,abs(abs(q.y)-.32*ft)-.13*sat(ft*2.))*step(.0,ft)*liS(.65,.4,ft);
vec3 hue=liHue(i % 4),c2=mix(hue,vec3(.9,.88,.82),liS(.45,.6,noise(vec2(q.x*2.2+fi*9.,q.y*2.5+3.)))*.85);
float lit=.5+.5*liLv(i % 4)+.3*uCue,back=1.-.75*sat(abs(q.y)/wide);
col*=1.-.35*much*liS(.9,.2,length(vec2(dot(sh,dir),dot(sh,vec2(-dir.y,dir.x))*2.6)));
col=mix(col,liDepth(c2*(.35+.9*back)*lit*1.9*(1.-.4*liW),z*.3),sat(body+.55*tail+.6*liS(.06,-.03,abs(q.x-.42+abs(q.y)*.9)-.09)*liS(.5,.2,abs(q.y)))*much);
}
}
return col;
}
// The stacks: where, width, seed.
const vec4 LI_S[8]=vec4[8](vec4(-.2,.33,.075,5.),vec4(1.02,.3,.1,9.),vec4(.53,.24,.11,12.),vec4(.2,.18,.05,14.),vec4(-.02,.02,.135,18.),vec4(.78,-.02,.085,21.),vec4(-.36,-.16,.08,24.),vec4(.36,-.14,.07,27.));
vec3 liStack(vec3 col,vec2 p,vec4 st,float fine,float st2){
float R=st.z*st2,seed=st.w,K=1./1.02-1./(1.+liDeep);
vec2 d0=st.xy-liCam-liVP,top=liVP+d0/1.02,ax=-d0*K;
float al=length(ax)+1e-5,along=dot(p-top,ax)/(al*al),reach=R*1.2/al;
float far=length(p-top-ax*sat(along));
if(far<R*1.4){
vec4 pc=piece(clamp(liUV(st.xy),.03,.97));
float on=sat((R>.1?.65:.12)+.9*pc.a);
vec3 ph=pc.rgb/max(pc.a,.05);
 vec2 zz=1./(1./1.02-sat(along+vec2(reach,-reach))*K)-1.;
vec2 kk=clamp(8.*(1.-(zz-.015)/(.96*liDeep))+vec2(-.7,.7),.0,7.);
int k1=int(kk.y);
for(int k=int(kk.x);k<=k1;k++){
float fk=float(k),h=liH(seed+fk*1.7),h2=liH(seed*1.3+fk*2.9+5.);
int kind=k/2;float lv=liLv(kind);
float z=liDeep*(1.-(fk+.35*h)/8.)*.96+.015;
vec2 c=liVP+(d0+(vec2(h,h2)-.5)*R*.55)/(1.+z);
float swell=.62+.2*on+.26*lv*on;
float r=R*(.45+.35*h2+.3*sin(.36*fk+.55))*swell/(1.+z);
vec2 q=(p-c)/r;q.y*=1.3;
float d=length(q);
vec2 fo=vec2(.0);
if(uOwn[1]!=.0&&d<1.5){fo=liForm(q*(1.-.12*abs(uOwn[1])),h*TAU,h2);d=fo.x;}
if(d<1.4){
float white=.2+.35*on+lv*(.25+.75*on)*(.45+.55*uEnergy)+.35*uBands[k*2]*on;
d+=.3*(noise(q*1.6+seed*7.+fk*3.)-.5)*(1.-.8*abs(uOwn[1]));
float aa=1.6*liPx/r;
 col*=1.-.5*liS(1.2,.75,length(q+vec2(.16,.22)))*(.5+.5*on);
float m=liS(1.+aa,1.-aa,d);
float side=dot(q,vec2(.62,.78));
float frost=noise(q*3.2+seed+fk*11.);
float thin=liS(.62,.3,frost)*liS(.95,.3,d);
float body=(.77+.15*sin(d*13.+frost*6.)+.2*fine)*(1.-(.8-.2*white)*thin);
float rim=liS(.1+aa,.0,abs(d-.93));
float lens=liS(.1,.0,abs(d-.7))*liS(.3,.7,side);
float alpha=m*sat(body*(.5+.6*white)+rim*.35+lens*.4);
vec3 tint=mix(vec3(.86,.97,1.),liHue(kind)*1.8,.28*lv);
tint=mix(tint,ph,.2*sat(pc.a));
float light=(.3+.75*white)*(.7+.45*side)*(.75+.35*fine)+rim*(.15+.45*sat(.3+side))+lens*(.5+.7*uTone);
if(uOwn[1]!=.0)light+=.5*fo.y;
vec3 c3=tint*light*1.5;
if(uOwn[1]!=.0||uOwn[3]!=.0){c3=liStuff(c3,mix(liHue(kind),ph,.5*sat(pc.a)),light);alpha=mix(alpha,m,.8*max(uOwn[1],.0));}
if(uOwn[6]<.0)c3*=1.+uOwn[6]*(.85-.7*rim);
col=mix(col,liDepth(c3,z),alpha);
}
}
}
return col;
}
// A crack is a wall going down from a jagged line.
vec3 liCrack(vec3 col,vec2 p,vec2 at,vec2 e,float seed,float depth,float slant,float from,float to,float lit){
vec2 n=vec2(-e.y,e.x),w=p+liCam-at,v=p-liVP;
float s0=dot(w,e),g=dot(w,n);
float rate=dot(v,n)+slant;rate=rate<.0?min(rate,-.06):max(rate,.06);
#define LIW(s) (.11 * (liJag((s) * 2.3, seed).x - .5) + .035 * (liJag((s) * 8., seed + 40.).x - .5))
float w0=LIW(s0);
float z=(w0-g)/rate;
if(z>-.02&&z<depth+.25){
float s=s0+z*dot(v,e);
z=(LIW(s)-g)/rate;s=s0+z*dot(v,e);
float ends=liS(from,from+.25,s)*liS(to,to-.25,s);
float face=liJag(s*8.,seed+40.).y*.5+liJag(s*2.3,seed).y*.4;
float f1=s*11.+1.5*z,i1=floor(f1),e1=liS(.0,.05,f1-i1);
float fac=mix(liH(i1-1.+seed),liH(i1+seed),e1);
float D=depth*(.35+.65*fac)*ends;
if(z>.0&&z<D){
float t=z/max(D,.001);
float comb=noise(vec2(s*75.+z*30.,z*3.+seed)),bow=noise(vec2(s*5.,34.*z+7.*sin(s*7.+seed)));
float fade=exp(-2.6*t);
float a=(.12+.5*fac*fac+.5*face)*fade;
a+=.35*liS(.5,.95,comb)*fade*(.3+fac)+.22*liS(.6,.85,bow)*(1.-t)*(.3+comb);
a=max(a,.0)+.3*exp(-z*170.);
a*=liS(1.,.6,t)*(.8+.9*lit);
vec3 wl=max(col,liDepth(vec3(.7,1.,1.03)*(1.3+1.1*lit),z));
if(uOwn[3]!=.0)wl=mix(mix(wl,max(col,liDepth(liHue(3)*(1.3+lit)+.2,z)),liD),mix(vec3(.02,.07,.1),liHue(0)*.2,.6)*(1.4-lit*.4),liW*.9);
col=mix(col,wl,min(a,.92)*(1.-max(-uOwn[2],.0)));
}
}
if(abs(g-w0)<5.*liPx){
float ragged=liJag(s0*24.,seed+5.).x,away=abs(g-w0)/liPx;
float line=liS(1.5,.2,away/(.7+2.2*ragged*ragged))*(.55+.45*ragged);
float es=liS(from,from+.1,s0)*liS(to,to-.1,s0);
col=mix(col,vec3(1.5,1.7,1.75)*(.8+lit),line*es*(1.-max(-uOwn[2],.0)));
}
return col;
}
// A hairline: how white, how far along.
vec2 liHair(vec2 p,vec2 at,vec2 e,float seed,float len,float wide){
vec2 w=p+liCam-at;
float s=dot(w,e),g=dot(w,vec2(-e.y,e.x));
vec2 o=vec2(.0);
if(s>.0&&s<len&&abs(g)<.05){
float wob=(.05*(liJag(s*5.+.5,seed).x-.5)+.02*(liJag(s*17.,seed+9.).x-.5))*liS(.0,.1,s);
o=vec2(liS(1.4,.2,abs(g-wob)/(liPx*wide))*liS(.0,.01,s)*liS(len,len*.6,s),s/len);
}
return o;
}
float liDrift(vec2 w){
vec2 r=rot(.55)*w;
float big=noise(r*vec2(2.4,4.2)+4.),rip=noise(r*vec2(4.,15.)+vec2(2.,3.)*big);
return .55*big+.16*rip+.03*noise(r*vec2(16.,29.)+3.*rip);
}
vec3 liDown(vec2 p){
liVP=vec2(.1,-.8);liFar=vec3(.002,.026,.026);liAb=LI_AB;
vec2 pe=p;float low=max(uOwn[5],.0),away=1.;
if(uOwn[5]<.0)liVP-=uOwn[5]*vec2(-.02,.74);
if(low>.0){
float D=1./max(1.-1.55*p.y,.1);away=mix(1.,D,low);
p=mix(p,vec2(p.x,1.3*p.y-.03)*D,low);liPx*=away;
}
if(uOwn[3]!=.0){
liFar=mix(mix(liFar,uKind[0]*uKind[0]*.14,liD),vec3(.6,.72,.78),liW);
liAb=mix(mix(liAb,2.6*(1.-.85*uKind[1]),liD),vec3(.5,.22,.15),liW);
}
liCam=vec2(.07*sin(uTravel*.023),.05*sin(uTravel*.017+1.))+vec2(.006*sin(uTime*.11),.005*cos(uTime*.087));
liDeep=.62+.3*uSpace;
 // the body of the ice
vec2 w1=p+liCam,w2=liVP+liCam+(p-liVP)*1.35,w3=liVP+liCam+(p-liVP)*1.8;
float m2=noise(w2*2.1+7.)*.65+noise(w2*5.3)*.35,m3=noise(w3*1.5+3.);
vec2 sd=p-vec2(.62,.5);
float sun=exp(-dot(sd,sd)*2.4);
vec3 col=vec3(.0004,.006,.0058)+vec3(.0006,.018,.014)*liS(.35,.8,m3)*(.5+.6*uLow);
col+=liHue(0)*uDrone*.05*liS(.2,.8,m3);
col+=vec3(.002,.105,.105)*(sun*1.5+.1*liS(.45,.85,m2))*(.5+.7*uLevel);
vec4 bl=vec4(.0);
if(uOwn[3]!=.0){
vec3 dye=uKind[0]*uKind[0]*(.06+.2*m3)+uKind[1]*uKind[1]*(.5*liS(.35,.85,m2)*(.5+.5*uLevel)+1.1*sun*(.4+.6*uPad))+uKind[2]*uKind[2]*.3*liS(.5,.9,noise(w3*2.6+11.))*(.3+uTexture);
vec3 milk=vec3(.85,.97,1.02)*(.62+.25*m2+.16*m3+.25*sun)*(.85+.2*uLevel);
col=mix(mix(col,dye,liD),milk,liW);
}
if(uOwn[6]<.0){ // light from below
vec2 gv=(pe-vec2(.22,-.16))*vec2(.8,1.);float gl=exp(-dot(gv,gv)*2.6);
col+=-uOwn[6]*mix(vec3(.25,.85,.7),liHue(1)*1.5+.06,.4+.5*liD)*gl*(.25+.55*uLevel+.35*uCue)*(.6+.7*m2);
}
if(uOwn[7]<.0)col=liFish(col,p,-uOwn[7]);
if(uOwn[2]>.0){ // upright blocks
const float B=2.7;
vec2 x=rot(.35)*(w1+.03*(vec2(noise(w1*5.),noise(w1*5.+9.))-.5))*B,v=rot(.35)*(p-liVP)*B;
bl=liBlocks(x,v);int bk=int(bl.w*3.99);
float D=.55+.35*bl.w,t=sat(bl.y/D),comb=noise(vec2(dot(x,vec2(13.,9.))*2.2+bl.y*26.,bl.y*5.)),arc=noise(vec2(bl.y*30.+4.*bl.w,dot(x,vec2(2.,-1.5))));
float face=bl.z*bl.z,a=(.1+.8*face)*(.55+.5*comb)+.25*liS(.55,.85,arc)*(1.-t);
vec3 tone_=mix(mix(vec3(.3,.95,1.),liHue(bk)*1.6+.1,.25+.55*liD),vec3(.25,.4,.5),liW);
a*=(.55+.5*uLevel+.6*liLv(bk))*(.5+1.1*sun+.4*uCue*liS(.3,.9,bl.w));
col=mix(col,liDepth(tone_*a*1.6+liFar*.6,bl.y),uOwn[2]*liS(1.,.55,t)*.92);
col*=1.+uOwn[2]*.5*(bl.w-.5);
}
 // pearls
for(int k=0;k<5;k++){
if(k>1&&uOwn[7]<=.0)break;
float fk=float(k),z=.55-.22*fk,cell=.016+.008*fk,up=.0;
if(uOwn[7]>.0){if(k>1)cell=.02;up=fract(uTime*.012+fk*.2);z=.95*(1.-up);cell*=1.+1.1*uOwn[7];up=uOwn[7]*sin(PI*up);}
vec2 w=liVP+liCam+(p-liVP)*(1.+z),g=rot(.4+fk)*w/cell,id=floor(g);
vec2 h=hash22(id+fk*17.);
float some=step(1.02-.75*liS(.55,.85,noise(id*cell*5.+fk*9.)),h.x);
if(uOwn[7]<.0)some*=step(-uOwn[7],h.y+.001);
if(uOwn[7]>.0)some=step(.6,h.x)*up;
float r=(.05+.17*h.y*h.y*h.y)*some*(1.+1.4*up);
vec2 q=fract(g)-.5-(h.yx-.5)*.4;
float d=length(q)/max(r,.001),aa=liPx*(1.+z)/cell/max(r,.01);
float dot_=liS(1.+aa,1.-aa,d)*step(.001,r);
col=mix(col,liDepth(vec3(.8,.95,1.)*(.6+1.2*uKeys+.5*uHigh),z),dot_*(.35+.4*h.y));
}
col=liCrack(col,p,vec2(.62,-.3),vec2(.97,.2431),30.,.2,.2,-1.4,.9,.1+.4*uLow);
float fine=noise(w2*110.);
if(uOwn[0]>.0)col=liMany(col,p,uOwn[0]);
for(int i=0;i<8;i++){
float st2=1.;
if(uOwn[7]<.0)st2+=uOwn[7];
if(uOwn[0]<.0)st2*=1.-uOwn[0]*(i==4?.9:i==1||i==7?.25:-1.);
else if(uOwn[0]>.0)st2*=1.-uOwn[0];
if(st2>.05)col=liStack(col,p,LI_S[i],fine,st2);
}
if(uOwn[2]>.0){float es=liS(.022*away,.0,bl.x-.5*liPx);col=mix(col,mix(vec3(1.1,1.3,1.35)*(.6+.5*uLevel),vec3(.1,.2,.25),liW),uOwn[2]*es*.85*(.4+.6*noise(w1*40.)));col+=uOwn[2]*liHue(4)*liHit*(.25*bl.w+es)*exp(-dot(p,p)*5.);}
float lit=.15+.25*uLevel+1.3*uCue;
col=liCrack(col,p,vec2(.0,.14),vec2(.8575,.5145),3.,.4,.2,-1.1,1.3,lit);
col=liCrack(col,p,vec2(.33,.34),vec2(.47,-.8827),63.,.5,.05,.02,1.2,.1+.2*uMid);
 // hairlines
float hair=.5*liHair(p,vec2(.33,.3),vec2(.9701,-.2425),4.,.75,.8).x;
hair+=.4*liHair(p,vec2(.47,.04),vec2(-.6402,-.7682),19.,.6,.7).x;

col=mix(col,vec3(.5,.75,.78),hair*.6);
if(liHit>.002){
float run=.0,at=.3+.9*(1.-liHit);
for(int k=0;k<3;k++){
float fk=float(k),a=fk-1.4+.3*sin(uTime*.017+fk*2.3)+.3*sin(uTime*.011);
vec2 hb=liHair(p,vec2(.075,.0),vec2(cos(a),sin(a)),23.+fk*7.,.34+.07*fk,1.+.7*liHit);
run+=hb.x*liS(at,at-.12,hb.y*(1.+.2*fk));
}
vec2 hv=p+liCam-vec2(.075,.0);
col+=vec3(.5,.75,.8)*liHit*exp(-dot(hv,hv)*160.)*.8;
col=mix(col,vec3(1.6,1.75,1.8)*(.7+.5*liHit),sat(run)*sat(liHit*1.6));
}
col+=vec3(.16,.24,.26)*sun*sun*(.12+.25*uLevel);
if(uOwn[6]>.0){ // a low sun beyond the edge
vec2 sv=pe-vec2(.75,.56);float sl=length(sv),an=atan(sv.y,sv.x+.0001);
float ray=noise(vec2(an*14.,3.))*.6+noise(vec2(an*37.,9.))*.4;
vec3 gold=mix(vec3(1.7,.72,.24),liHue(3)*1.8,.5);
col+=uOwn[6]*gold*(exp(-sl*1.9)*(.25+.9*ray*ray)+.9*exp(-sl*sl*9.))*(.35+.5*uLevel+.3*uCue)*(1.-.45*liW);
}
 // snow
float edge=-.3+.5*p.y-w1.x;
if(uOwn[4]!=.0){
float win=.0;
if(uOwn[4]>.0){vec2 e1=(w1-vec2(.28,-.04))*vec2(.95,1.25),e2=(w1-vec2(-.55,.3))*vec2(1.1,1.5);win=min(length(e1)-.34,length(e2)-.15)*1.3+.12*(noise(w1*3.)-.5);}
edge=uOwn[4]>.0?mix(edge,win,uOwn[4]):edge+uOwn[4]*2.2;
}
vec3 day=mix(vec3(.5,.62,.8),vec3(1.5,1.3,1.08),sat(.2+.8*uLevel))*(.85+.3*uTone);
if(uOwn[6]>.0)day=mix(day,vec3(1.8,.85,.5),.6*uOwn[6]);
if(uOwn[3]<.0)day=mix(day,day*(uKind[1]+.25),.75*liD);
if(edge>-.3){
float e=.01,h0=liDrift(w1),shown=liS(-.3,-.18,edge);
float thick=edge*2.2+(h0-.42)*1.3;
float grain=hash21(floor((w1+3.)*420.)),wisp=noise(rot(.75)*w1*vec2(5.,44.)+2.*h0);
float cover=liS(-.02,.16,thick+.12*(wisp-.5)+.03*(grain-.5));
cover=max(cover,.42*liS(-.5,.0,thick)*liS(.5,.95,wisp)*(.7+.5*grain))*shown;
vec2 sl=vec2(liDrift(w1+vec2(e,.0))-h0,liDrift(w1+vec2(.0,e))-h0)/e*.48;
sl.x-=.45*liS(.3,.0,thick);
float rake=sat(.36-dot(sl,vec2(.85,.5))*.6);
vec3 snow=vec3(.1,.17,.27)*(.7+.5*h0)+day*rake*(.5+rake)*1.2;
if(uOwn[6]<.0)snow*=1.+.72*uOwn[6];
col=mix(col,snow*(.9+.2*grain),cover);
}
if(low>.0){ // the far side
vec3 air=mix(mix(vec3(.12,.2,.24),uKind[1]*uKind[1]*.5+.03,.6*liD),vec3(.75,.8,.84),liW);
col=mix(col,air*(.6+.5*uLevel),low*liS(1.5,5.5,away)*.85);
}
return col;
}
// ---------- b: the skated ice ----------
// each stroke: a place, its way there; its bend, its length to each side
const vec4 LI_A[14]=vec4[14](vec4(.05,.02,.877,.479),vec4(-.20,.30,.939,-.342),vec4(.30,.35,-.801,.598),vec4(-.10,-.22,.988,.149),vec4(.45,.10,-.323,.946),vec4(-.45,.15,.540,.841),vec4(.00,.55,.995,.099),vec4(.15,-.10,-.924,.381),vec4(-.35,.60,.696,-.717),vec4(.70,.50,-.588,.808),vec4(.10,.18,.315,.949),vec4(.35,-.25,.581,.813),vec4(.50,.85,.980,-.198),vec4(-.15,.08,.988,-.149));
const vec3 LI_B[14]=vec3[14](vec3(1.5,.95,.806),vec3(1.1,.8,.747),vec3(-.9,.8,.630),vec3(-.8,.5,.811),vec3(.75,.6,.696),vec3(-1.3,.8,.816),vec3(2.2,.9,.917),vec3(1.7,.8,.891),vec3(.8,.5,.811),vec3(1.4,.7,.877),vec3(-.55,.6,.461),vec3(1.,.4,.921),vec3(1.2,.6,.877),vec3(.6,.55,.608));
// How near a stroke is to w.
// Closed rings, or lanes side by side.
void liBent(int i,inout vec4 a,inout vec3 b){
float fi=float(i),ring=max(uOwn[1],.0),lane=max(-uOwn[1],.0),k0=1./b.x,sg=sign(b.x);
vec2 e=a.zw;float R1,len=b.y;vec2 at=a.xy;
if(ring>.0){
float g=mod(fi,3.),n=floor(fi/3.);
vec2 c=g<.5?vec2(-.3,.02):g<1.5?vec2(.33,.3):vec2(.48,-.2);
R1=.09+.075*n+.02*liH(fi+3.);
if(g>1.5)R1*=.8;
float R=1./mix(abs(k0),1./R1,ring);
len=mix(len,PI*R*1.04,ring);
at=mix(at,c-sg*R1*vec2(-e.y,e.x),ring*ring);
b=vec3(sg*R,len,cos(min(PI,len/R))-.02);
}else{
vec2 to=vec2(.58,.8146);
if(dot(to,e)<.0){e=-e;sg=-sg;k0=-k0;}
e=normalize(mix(e,to,lane));
float R=1./(abs(k0)*(1.-.93*lane));
vec2 c=vec2(-to.y,to.x)*((fi-6.)*.088+.05*(liH(fi+5.)-.5))+to*(liH(fi*2.1)-.5)*.7+vec2(.05,.12);
at=mix(at,c,lane);
len=mix(len,1.5,lane);
b=vec3(sg*R,len,cos(min(PI,len/R))-.0005);
}
a=vec4(at,e);
}
float liNear(vec2 w,vec4 a,vec3 b){
vec2 n=vec2(-a.w,a.z),v=w-a.xy-b.x*n;
float r=length(v),d=r-abs(b.x);
return(d>.0?d:-2.5*d)+step(-sign(b.x)*dot(v,n),b.z*r)*9.;
}
// The powder of one stroke: how much, how far along, how it faces the lamp.
vec3 liMark(vec2 w,vec4 a,vec3 b,float px,float seed,vec2 toLamp,float g){
vec2 c=a.xy+b.x*vec2(-a.w,a.z),v=w-c;
float R=abs(b.x),r=length(v),d=r-R;
vec2 u=v/max(r,.001),u0=sign(b.x)*vec2(a.w,-a.z);
float s=sign(b.x)*R*atan(u0.x*u.y-u0.y*u.x,dot(u0,u));
float x=s/b.y*.5+.5,taper=liS(.0,.2,x)*liS(1.,.9,x),clump=noise(vec2(s*13.,seed));
float wd=.0035+.02*x*x*clump;
float bank=d>.0?exp(-d/wd):exp(d/(.0012+.4*px));
float d2=d+.012-.004*x;
float m=bank*(.2+1.*g)*(.5+.7*clump)+.5*liS(1.3*px+.0006,.0,abs(d2))*(.4+g)+.35*liS(.014,.0,abs(d+.005))*clump*g;
return vec3(m*taper,x,dot(u,toLamp));
}
// Faint old marks.
float liOld(vec2 w,vec2 c,vec2 to,float gap,float px){
vec2 v=w-c;float r=length(v),n=floor(r/gap),h=liH(n+c.x*31.);
float d=abs(fract(r/gap)-.15-.7*h)*gap;
float h2=liH(n*1.7+3.),off=dot(v,vec2(-to.y,to.x))/max(r,.001)-1.3*(h2-.5);
return liS(1.3*px,.0,d)*liS(.3*h+.05,.0,abs(off))*step(.0,dot(v,to))*h*h2;
}
float liSeg(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*sat(dot(p-a,d)/dot(d,d)));}
vec3 liSkate(vec2 p){
vec2 p0=p;
p+=vec2(.018*sin(uTravel*.019),.012*sin(uTravel*.013));
float D=1./(1.1-.85*min(p.y,1.1));
vec2 w=vec2(p.x,1.5*p.y)*D;
float low=max(uOwn[5],.0),top=max(-uOwn[5],.0),ea=mix(1.1,.3,low),eb=mix(.85,1.6,low),es=mix(1.,.42,low),ey=mix(1.5,3.4,low),under=1.;
vec2 shift=vec2(.0),pl=p;
if(low>.0){
float den=ea-eb*p.y;
under=liS(.035,.05,den); // what is not sky
D=es/max(den,.04);w=vec2(p.x,ey*p.y)*D;
float fy=.156*ea/(ey*es+.156*eb),fy0=.156*1.1/(1.5+.156*.85);
shift=vec2(.255/es*(ea-eb*fy)-.255*(1.1-.85*fy0),fy-fy0);
}
if(top>.0){w=mix(w,p*1.12,top);D=mix(D,1.12,top);}
float px=liPx*D*1.25;
 vec2 lampP=vec2(.2,.275)+shift,tl=vec2(.2,.17)-w;
float gap=4.+3.5*min(uOwn[6],.0),gp=gap*(ea-eb*(shift.y+.105))/es;
if(uOwn[6]<.0){tl.x=mod(tl.x+.5*gap,gap)-.5*gap;pl.x=lampP.x+mod(p.x-lampP.x+.5*gp,gp)-.5*gp;}
float r2=dot(tl,tl),r1=sqrt(r2)+.001;
float lamp=.6+.4*uLevel+.9*uCue,fall=1./(1.+r2*mix(9.,4.5,uSpace));
float disc=max(uOwn[6],.0),lantern=1.-disc;
lamp*=lantern*(1.-.8*liW);
float I=lamp*(fall*fall+.06*fall);
vec3 warm=mix(vec3(1.9,.8,.24),vec3(1.7,1.05,.55),uTone);
vec3 dusk=vec3(.2,.27,.4)*(.75+.4*uLevel);
 // the ice
float m1=noise(w*1.6+3.),m2=noise(rot(.5)*w*vec2(3.,8.)+1.);
float milk=liS(.3,.75,.6*m1+.4*m2);
vec3 col=mix(vec3(.006,.012,.018),vec3(.04,.056,.075),milk);
float far=liS(-.15,.6,p.y);
col+=(vec3(.05,.07,.11)+vec3(.14,.07,.07)*far*liS(.9,-.6,p.x))*far*far*1.6*(.7+.4*uLevel);
col+=warm*I*(.012+.075*milk);
if(uOwn[3]!=.0){
vec3 dye=uKind[0]*uKind[0]*(.05+.22*milk)+uKind[1]*uKind[1]*far*(.25+.5*uLevel)+uKind[2]*uKind[2]*.22*liS(.55,.85,noise(w*1.1+9.))*(.4+uTexture)+warm*I*.06;
vec3 day=mix(vec3(.62,.74,.82),vec3(1.05,1.1,1.1),milk)*(.8+.25*uLevel);
col=mix(mix(col,dye,liD),day,liW);
dusk=mix(dusk,(uKind[3]*.55+.06)*(.6+.6*uLevel),liD);
}
vec4 bl=vec4(9.);float thrown=.0;int bk=0;
if(uOwn[2]>.0){
bl=liBlocks(rot(.4)*(w+.05*(vec2(noise(w*4.),noise(w*4.+9.))-.5))*2.1+3.,vec2(1.,.4));bk=int(bl.w*3.99);
col*=1.+uOwn[2]*1.3*(bl.w-.5);col+=uOwn[2]*dusk*.22*bl.w*bl.w;
}
if(uOwn[2]<.0){ // bubbles in it, small stacks
liVP=vec2(.1,-2.4);liFar=mix(col,vec3(.03,.05,.06),.5);liAb=vec3(1.4,.8,.7);liDeep=.25;liCam=vec2(.0);
float was=liPx;liPx*=D;col=liMany(col,w*.8,-uOwn[2]);liPx=was;
}
 // dry snow, old marks
vec2 wr=rot(.35)*w;
float gr=noise(w*270.),gm=noise(w*70.);
if(low>.0){float f=low*liS(.6,2.2,D);gr=mix(gr,.4,f);gm=mix(gm,.5,f);}
float dust=liS(.52,.8,.55*noise(wr*vec2(1.8,6.)+8.)+.3*noise(wr*vec2(9.,40.))+.15*gr);
float P=.3*dust*(.7+.5*uTexture);
P+=.5*(liOld(w,vec2(-1.6,-.7),vec2(.9,.44),.021,px)+liOld(w,vec2(.5,2.4),vec2(-.1,-.99),.034,px)+liOld(w,vec2(.15,-1.7),vec2(.0,1.),.027,px));
P*=1.+(uOwn[2]<.0?uOwn[2]:.0);
if(uOwn[4]<.0)P*=1.+.9*uOwn[4];
if(uOwn[0]<.0)P*=1.+.6*uOwn[0];
float P0=P;
 // the long strokes
vec2 toLamp=tl/r1;
vec4 pc=piece(clamp(liUV(p0),.0,1.));
vec3 glow=vec3(.0);
for(int pass=0;pass<2;pass++){
if(pass==1&&uOwn[0]<=.0)break;
float much=pass==1?uOwn[0]:1.;
vec2 ws=pass==1?rot(2.2)*w*1.35+vec2(.25,-.2):w,tp=pass==1?rot(2.2)*toLamp:toLamp;
vec2 best=vec2(9.);ivec2 who=ivec2(0);
for(int i=0;i<14;i++){
vec4 sa=LI_A[i];vec3 sb=LI_B[i];
if(uOwn[1]!=.0)liBent(i,sa,sb);
float n=liNear(ws,sa,sb);
if(uOwn[0]<.0&&i!=0&&i!=6&&i!=9)n+=uOwn[0]<-.98?9.:.0;
if(n<best.x){best.y=best.x;who.y=who.x;best.x=n;who.x=i;}else if(n<best.y){best.y=n;who.y=i;}
}
for(int j=0;j<2;j++){
int i=j==0?who.x:who.y;
float n=j==0?best.x:best.y;
vec4 sa=LI_A[i];vec3 sb=LI_B[i];
if(uOwn[1]!=.0)liBent(i,sa,sb);
vec3 st=liMark(ws,sa,sb,px,float(i)*3.1,tp,gr)*step(n,1.);
if(uOwn[0]<.0)st.x*=i==0||i==6||i==9?1.-.4*uOwn[0]:1.+uOwn[0];
if(pass==1)st.x*=much*.8;
int k=i % 4;
float on=liLv(k);
P+=st.x*(.5+.55*on+.5*uBands[i]+.4*pc.a)*(.85+.5*st.z);
glow+=mix(liHue(k),pc.rgb,.4*sat(pc.a))*st.x*(.5*on+.4*pc.a)*(.3+.9*uEnergy);
if(i==0&&pass==0){float run=st.y-1.1+uCue*1.2;glow+=warm*st.x*2.5*uCue*exp(-run*run*30.);}
}
}
 // a circle skated with the loop
vec2 v=w-vec2(-.2,-.04);float r=length(v),d=r-.2;
if(d>-.012&&d<.04){
float behind=fract(uLoop-atan(v.y,v.x)/TAU);
float body=(d>.0?exp(-d/.006):exp(d/(.0015+.4*px)))*(.2+gr);
float fresh=exp(-behind*4.)*liS(.0,.03,behind)*liS(1.,.9,behind);
P+=body*(.45+1.2*fresh*(.4+.6*uPhrase))*(.85+.5*dot(v/r,toLamp));
}
 // a hit throws a fan of powder
v=w-vec2(.1,-.19);r=length(v);
thrown=(liHit+.7*uCue)*exp(-8.*r*r)*(.15+.5*gm);
if(r<.36){
float fan=liS(.2,.95,dot(v/max(r,.001),vec2(-.75,.66)));
float place=.2+.15*(1.-liHit);
thrown+=liHit*fan*liS(place,place*.3,r)*(.5+gm);
P+=liHit*fan*liS(place,place*.3,r)*liS(.0,.04,r)*(.7+3.*gm*gr);
P+=.7*fan*exp(-abs(r-.05-.02*gm)*200.)*(.2+gr);
}
P*=1.+4.*(uKeys+.3*uHigh)*liS(.8,.95,gr);
vec3 powder=dusk*1.5+warm*I*1.3;
float marks=P-P0;P+=liW*marks;
col=mix(col,liHue(4)*(1.6-1.2*liW),sat(.75*thrown*max(max(abs(uOwn[2]),abs(uOwn[5])),max(liW,max(disc,uOwn[4])))));
if(uOwn[3]>.0){powder=mix(powder,(vec3(.0,.02,.04)+.3*liHue(3)*liHue(3))*(.6+.4*gr),liW);glow*=1.-.9*liW;}
if(uOwn[4]>.0){
float h0=liDrift(w),rake=sat(.45-25.*dot(vec2(liDrift(w+vec2(.012,.0)),liDrift(w+vec2(.0,.012)))-h0,vec2(.8,.6)));
float cov=liS(1.02-uOwn[4]*.8,1.22-uOwn[4]*.95,h0+.36*uOwn[4]+.05*(gr-.5))*uOwn[4];
vec3 sn=(dusk*.95+vec3(.03,.05,.09))*(.35+1.1*rake)*(1.+1.6*liW)+warm*I*(.25+1.2*rake);
if(liD>.0)sn=mix(sn,sn*(.5+uKind[1]),liD);
if(disc>.0)sn+=disc*liHue(3)*.35*rake*(.4+.5*uLevel);
col=mix(col,sn*(.9+.2*gr),cov*(1.-.9*sat(marks*1.4)));
P=mix(P,P0*.3+.12*marks,uOwn[4]*cov);
}
if(uOwn[2]>.0){
float lead=bl.x-.012,ep=px*2.1;
float open=liS(.012+ep,.004-ep,lead+.01*(gm-.5)-.03*(noise(w*6.)-.4));
P+=uOwn[2]*(.9+.6*uLow)*exp(-max(lead,.0)*34.)*(.25+.9*gm*gr+.3*gm)*(1.-open);
col+=uOwn[2]*mix(liHue(bk),pc.rgb,sat(pc.a))*(.1*liLv(bk)+.35*pc.a)*(.4+.6*gm)*(1.-open)*(1.-.5*liW);
P*=1.-.95*uOwn[2]*open;col=mix(col,mix(vec3(.003,.006,.01)+liHue(0)*.05*(.3+uDrone),vec3(.02,.07,.1),liW),uOwn[2]*open*.95);
}
col=mix(col,powder,sat(P*.8))+powder*max(P-1.1,.0)*.25+glow*(.45+I);
 float mx=(p.x-lampP.x)/(.014+.05*sat(.3-p.y));
float rough=.35+1.1*noise(vec2(w.x*30.,w.y*13.));
if(uOwn[6]<.0||shift.y!=.0)mx=(pl.x-lampP.x)/(.014+.05*sat(lampP.y+.025-p.y));
col+=warm*lamp*.6*exp(-mx*mx)*liS(.07,-.02,p.y)*liS(-.36,.02,p.y)*rough*(1.-.7*sat(P));
if(disc>.0){
vec2 dp=vec2(.16,mix(.62,ea/eb+.045,low));float yy=dp.y-.05-p.y,px2=(p.x-dp.x)/(.05+.13*sat(yy));
float rip=noise(vec2(w.x*9.,w.y*26./(.6+D)))*.65+noise(vec2(w.x*30.,w.y*60./(.6+D)))*.35;
vec3 lc=liHue(3)*1.5+.12;
col+=disc*lc*exp(-px2*px2)*liS(-.02,.05,yy)*(.15+1.6*rip*rip)*(.3+.4*uDrone+.4*uPad+.5*uCue)*(1.-.5*liW)*(1.-.8*sat(P))*under;
col+=disc*pc.rgb*rip*.5*under;
col+=disc*lc*.12*exp(-length(p-dp)*2.2)*(.4+.6*uLevel);
}
if(low>.0&&under<1.){
float hy=p.y-ea/eb,hill=.035*noise(vec2(p.x*5.+3.,1.))+.02*noise(vec2(p.x*16.,5.));
vec3 sk=mix(vec3(.26,.2,.22),vec3(.05,.075,.12),liS(.0,.35,hy))*(.7+.5*uLevel);
sk=mix(mix(sk,mix(uKind[1]*uKind[1]*.8+.02,uKind[0]*uKind[0]*.3,liS(.0,.32,hy))*(.7+.5*uLevel),max(liD,.65*disc)),vec3(.72,.78,.82),liW);
if(disc>.0){vec2 dv=p-vec2(.16,ea/eb+.06);float dl=length(dv);sk+=disc*(liHue(3)*1.4+.1)*((2.2+.6*uLevel)*liS(.048+liPx,.048-liPx,dl)+.4*exp(-dl*6.));}
sk=mix(sk,mix(sk*.25,vec3(.35,.42,.47),liW),liS(liPx,-liPx,hy-hill)*.85);
col=mix(sk,col,under);
}
 // pole, arm and lantern
p=pl-shift;
float post=lantern*(1.-top);
float pole=min(liSeg(p,vec2(.258,.105),vec2(.25,.345)),liSeg(p,vec2(.25,.345),vec2(.2,.325)));
pole=min(pole,liSeg(p,vec2(.2,.325),vec2(.2,.3))+.0018);
col=mix(col,vec3(.006,.006,.008)+warm*.03*liS(.15,.33,p.y),liS(.0032+liPx,.0032-liPx,pole)*post);
p+=shift;vec2 q=p-lampP;
float hl=length(q),wide=.0105-.1*q.y;
col+=warm*lamp*(.15*exp(-hl*9.)+.6*exp(-hl*36.));
float body=max(abs(q.x)-wide,abs(q.y)-.016),roof=max(abs(q.x)-.4*(.034-q.y),abs(q.y-.02)-.006);
col=mix(col,vec3(3.6,2.3,1.)*lamp*(.6+.5*exp(-hl*90.)),liS(liPx,-liPx,body)*post);
col=mix(col,vec3(.02,.014,.01),post*liS(liPx,-liPx,min(min(roof,max(abs(q.x)-.011,abs(q.y+.018)-.0025)),max(abs(q.x)-.0008,abs(q.y)-.016))));
 // the reed edge
float thick=max(uOwn[7],.0),slope=.5*(1.-.8*thick),foot=-.46+.04*thick-1.2*max(-uOwn[7],.0),slim=1.-.7*liW;
if(thick>.0?p0.y<.42:uOwn[7]>-.99&&p0.x<.15&&p0.y+.5*p0.x<-.1){
float lump=noise(p0*9.),bank=foot-slope*(p0.x+.5)+.1*lump-p0.y;
if(thick>.0)bank=min(bank,bank-thick*.12*liS(-.3,.5,p0.x));
float crust=noise(rot(.5)*p0*vec2(30.,90.));
col=mix(col,dusk*(.25+.9*lump*liS(.2,.0,bank)+.25*crust)+warm*I*liS(.1,.0,bank),liS(-.01,.02,bank+.02*(crust-.5)));
for(int k=0;k<5;k++){
if(k>1&&thick<=.0)break;
float fk=float(k),cell=(.03+.012*fk)*(1.+.2*thick),bx=floor(p0.x/cell+.37*fk);
for(int j=-1;j<=1;j++){
float id=bx+float(j),h=liH(id+60.+fk*37.),h2=liH(id*1.7+80.+fk*11.);
float cx=(id+.5-.37*fk+(h-.5)*.5)*cell;
float by=foot-.02-slope*(cx+.5)+.07*h2,top=by+(.2+.36*h)*(thick>.0?mix(liS(.1,-.6,cx),(1.3+.35*sin(cx*4.+fk))*(.45+.55*liS(.75,-.1,cx)),thick):liS(.1,-.6,cx)),tt=(p0.y-by)/max(top-by,.01);
if(tt>.0&&tt<1.){
float sway=.003*sin(uTime*.5+id*.7)*(.5+uLow);
float off=p0.x-cx-((h2-.25)*.05+sway)*tt*tt,half_=mix(.0028,.0007,tt)*(1.+.7*thick);
if(h2>.62)half_=max(half_,.0062*liS(.7,.73,tt)*liS(.93,.89,tt));
vec3 reed=mix(vec3(.004,.005,.007),vec3(.022,.016,.012),h)+uOwn[3]*step(.0,uOwn[3])*(.05*h+.25*uKind[2]*uKind[2])+liD*.06*uKind[4]+warm*(.015+I)*liS(.1,1.,off/half_);
col=mix(col,reed,liS(half_+liPx,half_-liPx,abs(off))*liS(.0,.1,tt));
}
}
}
}
return col;
}
vec3 render(vec2 p){
liPx=1./uRes.y;liW=max(uOwn[3],.0);liD=max(-uOwn[3],.0);
if(uVar<.5){liL=max(uOwn[1],.0);liT=max(-uOwn[1],.0);}else liL=liT=.0;
liHit=uHits*(1.-sat(2.*uCue));
vec3 col=uVar<.5?liDown(p):liSkate(p);
 // a voice: breath
vec2 b=(p-vec2(.1,-.52))*vec2(1.7,2.6);
col=mix(col,vec3(.42,.5,.56),.55*uMic*exp(-dot(b,b)*2.));
return screenOf(col);
}
