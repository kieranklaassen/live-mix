// name: River lanterns
// a: Downstream
// b: From the bridge
// what: A wide dark river at night: small square paper lanterns drift away from you past low hills, each with a long wavering reflection, the near ones with slats and a raft, the far ones a bending string of points; or the same lanterns seen from a bridge, open at the top, passing between wet stones in rings of their own light.
// follows: Every lantern carries one kind of sound and warms as it plays; where the piece is loud more are lit, across for the loop and away for the room. Low swells the water and rocks them, high glints. A hit drops a ring that tips the nearest, a cue lights all, near to far. Keys brighten some, a voice spreads their light. The current follows the music.
// own: 0 the hour, its papers dyed in the sounds' colours: 1 a pale misty day, -1 a full moon; 1 1 many small lanterns, -1 a few great ones; 2 1 round ribbed globes, -1 open water lilies; 3 1 they stand in lying snow, -1 among lily pads and reeds; 4 1 rough water and rain, -1 a still mirror; 5 the eye: 1 low under a wide sky (b: slanting), -1 high, no sky (b: from straight above); 6 1 in ordered ranks, -1 sky lanterns that rise (b: one single file); 7 1 a steep gorge (b: great boulders), -1 open sea and stars (b: no stones, a pebbled bed)
#define sst smoothstep
const float rlT=.185;
float rlHor=.25,rlSt=.33,rlC=.6,rlSz=1.,rlDay,rlMoon,rlSnow,rlGrow,rlStill,rlPad=.045;
float rlWd; // how narrow the picture is
#define rlGone (1. - uHits)
float rlOff(float lo,float hi,float x) { return 1.-sst(lo,hi,x); }
float rlIn(float w,float x) { return 1.-sst(-w,w,x); }
// Noise on a lattice that comes round, so a long evening does not wear it out.
float rlN(vec2 p) {
	vec2 i=floor(p),f=p-i,a=mod(i,289.),b=mod(i+1.,289.);
	f*=f*(3.-2.*f);
	return mix(mix(hash21(a),hash21(vec2(b.x,a.y)),f.x),mix(hash21(vec2(a.x,b.y)),hash21(b),f.x),f.y);
}
float rlK(int k) { return k == 0?uDrone:k == 1?uPad:k == 2?uTexture:k == 3?uPhrase:uHits; }
// Paper with a flame behind it and some of the colour of its kind.
vec3 rlPap(int k) {
	vec3 c=uKind[k]; c*=c; c /= max(max(c.r,max(c.g,c.b)),.05);
	return mix(mix(vec3(1.,.36,.075),c*vec3(1.,.66,.5),.42),c,.8*abs(uOwn[0]));
}
// How brightly a lantern burns; far is 0 near and 1 far, the way a cue passes.
float rlB(int k,float h,float here,float far) {
	float breath=.5+.5*sin(uTime*(.22+.2*h)+h*40.);
	float front=sst(far-.3,far+.05,(1.-uCue)*1.5)*uCue;
	return .36+.16*breath+(.35+uEnergy)*(.8*rlK(k)*(.7+.3*breath)+.6*here)+1.6*front;
}
// The middle of the stream, d below the far shore.
float rlMid(float d) { float q=sqrt(d); return rlWd*(-.27+.66*q*sin(q*4.3))*(1.-max(uOwn[6],.0)); }
vec3 rlLin(vec3 c,float most) { c*=c; return most*c/max(max(c.r,max(c.g,c.b)),.1); }
const vec2 rlMn=vec2(.36,.155); // the moon
vec3 rlPale() { return mix(vec3(1.05),rlLin(uKind[0],1.),.55); }
// Round pads on the water: how much there, and how light.
vec2 rlPads(vec2 u,float want,float aa) {
	vec2 id=floor(u),a=mod(id,289.); float n=hash21(a+77.),h=fract(n*57.3);
	float here=sst(want+.05,want-.05,.4*n+.6*rlN(id*.21+9.)); if (here<.01) return vec2(.0);
	float rad=.22+.2*h; vec2 l=u-id-.5-(vec2(fract(n*91.3),fract(n*13.7))-.5)*(.96-2.*rad);
	float r=length(l); if (r>rad+aa) return vec2(.0);
	float an=abs(mod(r>1e-4?atan(l.y,l.x)+n*40.:.0,TAU)-PI);
	float cov=rlIn(aa,r-rad)*sst(-aa,aa,r*sin(min(an,1.5))-.03-.12*r);
	return vec2(cov*here,(.7+.5*h)*(.75+.25*sst(.1,.3,abs(sin(an*6.))+aa*3.))*mix(.75,1.15,sat(r/rad)));
}
// Lanterns that rise in the air; at is over the far shore.
vec4 rlAir(vec2 at,float blur) {
	vec3 c=vec3(.0); float ease=1.;
	for (int i=0; i<6; i++) {
		float f=float(i),cs=.05*exp2(f*.56)*rlSz;
		vec2 g=at/cs+vec2(f*3.7+.15*sin(uTime*.07+f),-(uTravel*.011+uTime*.004)*(1.+.35*f)/cs+f*11.3);
		float col=floor(g.x); g.y+=hash11(col+f*31.)*7.;
		vec2 id=vec2(col,floor(g.y)),a=vec2(col,mod(id.y,289.)); float n=hash21(a+13.+f*41.);
		vec2 h=vec2(fract(n*91.7),fract(n*47.1)),l=g-id-.5-(h-.5)*.46,o=at-l*cs;
		vec4 pc=piece(vec2(o.x/1.78+.5,sat(.9-o.y*1.4)));
		float show=max(sst(.36,.3,n),.6*sst(.1,.5,pc.a))*sst(.0,.1+.03*f,o.y);
		if (show<.01) continue;
		l=rot(.14*sin(uTime*.4+n*50.))*l;
		int kd=int(fract(n*313.7)*4.99); vec3 paper=rlPap(kd); float lit=rlB(kd,h.x,pc.a,f*.17)*(1.+.5*uKeys),aa=(1.3/uRes.y+blur*.02)/cs;
		float v=(l.y+.17)/.34,w=mix(.1,.155,sst(.0,.7,v))*sqrt(sat((1.06-v)*3.));
		w=mix(w,.17*sqrt(sat(1.-(2.*v-1.)*(2.*v-1.))),max(uOwn[2],.0));
		float body=rlIn(aa,abs(l.x)-w)*rlIn(aa,abs(l.y)-.175),heart=exp(-dot(l+vec2(.0,.11),l+vec2(.0,.11))*22.);
		vec3 b=mix(paper*paper*.7,mix(paper,vec3(1.,.6,.25),.5),heart)*lit*(.25+1.5*heart)*(1.-.45*sst(.35,1.,abs(l.x)/max(w,.01)));
		b+=rlDay*(paper*.3+.1); b*=1.-.5*rlOff(.03,.05+aa*3.,v)*(1.-sat(aa*6.));
		c+=paper*lit*show*.13*exp(-dot(l,l)*34.)*sst(.5,.3,max(abs(l.x),abs(l.y)))*(1.-.7*rlDay);
		float over=body*show;
		c=mix(c,b,over); ease*=1.-over;
	}
	return vec4(c,1.-ease);
}
// The evening sky and three ranges of hills; e is the height over the far shore.
vec3 rlSky(float x,float e,float soft) {
	float gx=x/rlWd+.3,glow=exp(-gx*gx*3.);
	vec3 c=mix(vec3(.026,.082,.122),vec3(.004,.011,.038),sst(.0,.25,e));
	c+=vec3(.3,.12,.045)*glow*exp(-e*19.);
	if (uOwn[7]<.0 && e>.02) {
		vec2 s=vec2(x,e)*46.,i=floor(s); float n=hash21(i+200.); s -= i+.3+.4*vec2(fract(n*37.),fract(n*83.));
		c+=-uOwn[7]*vec3(.7,.8,1.)*sst(.72,1.,n)*exp(-dot(s,s)*160.)*(.5+.3*sin(uTime*.6+n*90.))*sst(.02,.12,e)*(1.-rlDay)*rlOff(.008,.02,soft);
	}
	if (rlDay>.0) c=mix(c,mix(mix(vec3(1.25,1.2,1.12),rlLin(uKind[1],1.2),.3),mix(vec3(.9),rlLin(uKind[0],.9),.6),sst(.0,.5,e))+vec3(.25,.17,.08)*glow*exp(-e*5.),rlDay);
	if (rlMoon>.0) {
		vec2 m=vec2(x-rlMn.x*rlWd,e-rlMn.y); float r=length(m);
		c=mix(c,mix(vec3(.07,.13,.18),vec3(.012,.03,.07),sst(.0,.5,e)),rlMoon*.85);
		c+=rlMoon*(vec3(.16,.2,.24)*exp(-r*7.)+vec3(1.5,1.4,1.15)*sst(.4,.8,rlMoon)*rlIn(.0015+soft*.6,r-.062)*(.75+.3*noise(m*38.+5.)));
	}
	c*=1.-.5*sst(.45,.8,noise(vec2(x*1.4+uTime*.004,e*20.)))*sst(.05,.16,e)*(1.-.8*rlDay);
	if (e>.2+.5*max(uOwn[7],.0)) return c;
	vec3 mist=vec3(.017,.043,.063)+vec3(.07,.026,.01)*glow;
	if (uOwn[0] != .0) mist=mix(mist+rlMoon*vec3(.03,.05,.06),vec3(1.1,1.08,1.04),rlDay);
	float rough=.0075*noise(vec2(x*24.,1.))+.004*noise(vec2(x*83.,5.));
	float y=x/rlWd;
	vec3 top=vec3(.04+.014*sin(y*5.3+.4)+.008*sin(y*11.),.012+.1*sst(-.2,.62,y)*(1.+.22*sin(y*7.+1.)+.1*sin(y*17.)),.008+.075*rlOff(-.95,-.38,y)*(1.+.2*sin(y*13.)));
	if (uOwn[7]>.0) { float b=abs(y+.16); top+=uOwn[7]*vec3(.1+.05*sin(y*3.),.5*sst(.2,.75,b+.06*sin(y*9.)),.75*sst(.42,.95,b+.05*sin(y*13.+2.))); rough*=1.+3.*uOwn[7]; }
	top*=1.+min(uOwn[7],.0)*vec3(1.,1.1,1.1);
	for (int i=0; i<3; i++) {
		float f=float(i);
		vec3 hc=i == 0?vec3(.013,.028,.044):i == 1?vec3(.004,.0105,.019):vec3(.002,.005,.01);
		if (rlDay>.0) hc=mix(hc,mix(vec3(.75),rlLin(uKind[0],.4),.45+.2*f)*(1.-.27*f),rlDay);
		hc=mix(mist,hc,sst(-.03,.085-.025*f,e));
		c=mix(c,hc,rlIn(soft,e-top[i]-rough*(.4+.6*f)));
	}
	return c;
}
// A paper wall lit from within: u across -1 to 1, v up 0 to 1.
vec3 rlWl(float u,float v,vec3 paper,float lit,float aa,float seed) {
	float w=u*.55,h=(v-.3)*1.1;
	float r=w*w*1.5+h*h,heart=exp(-r*3.2),hot=exp(-r*15.);
	float fib=noise(vec2(u*5.,v*30.)+seed*91.)*.6+noise(vec2(u*19.,v*11.)+seed*37.)*.4;
	vec3 c=mix(paper*paper*.7,mix(paper,vec3(1.,.56,.2),.5),heart)*lit*(.16+1.35*heart)*(.8+.4*fib)+vec3(1.,.72,.36)*hot*lit*1.1;
	c+=rlDay*(paper*.34+.08)*(.75+.4*fib);
	float slat=max(rlOff(.1-aa*2.,.1+aa*2.,1.-abs(u)),rlOff(.035-aa,.035+aa,min(v,1.-v)));
	if (uVar<.5) slat=max(slat,.75*rlOff(.016-aa,.016+aa,abs(v-.68)));
	return mix(c,c*.22+vec3(.006,.003,.002),slat*rlOff(.05,.22,aa));
}
// A wall seen from inside, through the open mouth.
vec3 rlIns(float u,float v,vec3 paper,float lit) {
	float h=(v-.2)*1.2,heart=exp(-(u*u*.8+h*h*2.6));
	return mix(paper*paper*.8,mix(paper,vec3(1.,.58,.2),.6),heart)*lit*(.16+2.1*heart*heart);
}
vec2 rlNr(float yaw,float sp) { return vec2(sin(yaw),-cos(yaw)*sp)*.105; }
vec2 rlR(float yaw,float sp) { return vec2(cos(yaw),sin(yaw)*sp)*.105; }
// The far edge of a lantern's square foot at x (N its near corner, R its right one).
float rlE(float x,vec2 N,vec2 R) { return x<-N.x?mix(-R.y,-N.y,(x+R.x)/(R.x-N.x)):mix(-N.y,R.y,(x+N.x)/(R.x+N.x)); }
// One near lantern: q from its foot, sp how far we look down on it.
void rlBox(inout vec3 c,vec2 q,float yaw,float sp,vec3 paper,float lit,float aa,float seed,float show) {
	float x=q.x;
	vec2 N=rlNr(yaw,sp),R=rlR(yaw,sp);
	// the raft
	vec2 b=vec2(x,q.y+.012)/1.22;
	float lo=-rlE(-b.x,N,R),hi=rlE(b.x,N,R);
	float cov=rlIn(aa,abs(b.x)-R.x)*sst(-aa,aa,b.y-lo+.02)*rlIn(aa,b.y-hi);
	c=mix(c,.004+paper*paper*.2*lit*sst(-aa,aa,b.y-lo),cov*show);
	// the two walls
	bool left=x<N.x;
	float u=left?(x+R.x)/(N.x+R.x):(x-N.x)/(R.x-N.x);
	lo=-rlE(-x,N,R); hi=rlE(x,N,R);
	float up=q.y-lo-rlT,side=rlIn(aa,abs(x)-R.x);
	float wall=side*sst(-aa,aa,q.y-lo)*rlIn(aa,up),mouth=side*sst(-aa,aa,up)*rlIn(aa,q.y-hi-rlT);
	if (wall>.0) c=mix(c,rlWl(u*2.-1.,(q.y-lo)/rlT,paper,lit,aa/rlT,seed)*(left?.75:1.),wall*show);
	// its open mouth
	if (mouth>.0) {
		bool far=x<-N.x;
		float uf=far?(x+R.x)/(R.x-N.x):(x+N.x)/(R.x+N.x),deep=hi+rlT-q.y,v=1.-1.7*deep/rlT;
		c=mix(c,rlIns(uf*2.-1.,v,paper,lit)*(far?1.:.8)*(.2+.8*sst(.0,.008+aa,min(deep,up+.003))),mouth*show);
	}
}
// A globe of ribbed paper, or an open lily with a flame in it.
float rlBall(vec2 q) { q=(q-vec2(.0,.1))/vec2(.115,.1); return length(q)-1.; }
vec3 rlGlobe(vec2 n,float lat,float lit,vec3 paper,float aa) {
	float heart=exp(-dot(n+vec2(.0,.3),n+vec2(.0,.3))*1.1),rib=abs(fract(lat*2.6+.5)-.5);
	vec3 c=mix(paper*paper*.7,mix(paper,vec3(1.,.56,.2),.45),heart)*lit*(.2+1.5*heart)+rlDay*(paper*.36+.06)*(1.2-.7*dot(n,n));
	return c*(1.-.5*rlOff(.04,.09+aa,rib)*rlOff(.2,.5,aa));
}
void rlOther(inout vec3 c,vec2 q,float yaw,float sp,vec3 paper,float lit,float aa,float show) {
	if (uOwn[2]>.0) {
		float b=rlBall(q),cov=rlIn(aa*10.,b)*show;
		vec2 f=vec2(q.x/.06,(q.y+.004)/(.06*sp+.012));
		c=mix(c,paper*paper*.16*lit+.003,rlIn(.2,length(f)-1.)*show*(1.-rlSnow));
		vec2 n=(q-vec2(.0,.1))/vec2(.115,.1); float z=sqrt(sat(1.-dot(n,n))),tilt=.25+.5*sp,lat=asin(clamp(n.y*cos(tilt)-z*sin(tilt),-1.,1.));
		vec3 b3=rlGlobe(n,lat,lit,paper,aa*10.);
		b3=mix(b3,vec3(.006,.004,.003)+paper*.1*lit,rlIn(.1,.89-abs(n.y*cos(tilt)+z*sin(tilt)))*step(.0,n.y));
		c=mix(c,b3,cov); return;
	}
	for (int k=0; k<2; k++) {
		float ring=k == 0?1.:.66;
		for (int i=0; i<9; i++) {
			float a=PI*.5+(float(i % 2)*2.-1.)*float((i+1)/2)*.698+yaw+float(k)*.35,s=sin(a);
			vec2 t=vec2(cos(a)*.165,s*.165*sp+(k == 0?.052:.1))*ring,l=q-vec2(.0,.015);
			float tt=dot(t,t),v=dot(l,t)/tt; if (v<-.05 || v>1.06) continue;
			float w=(l.x*t.y-l.y*t.x)/sqrt(tt),wide=.05*ring*(1.-.3*abs(cos(a)))*sin(PI*pow(sat(v),.75)),cov=rlIn(aa,abs(w)-wide);
			if (cov <= .0) continue;
			float in_=s>.0?1.:.5;
			vec3 pc=mix(paper,vec3(1.,.55,.22),.55*exp(-v*2.5))*lit*(.14+1.9*in_*exp(-v*v*2.2))+rlDay*(paper*.4+.2)*(.6+.5*v);
			pc*=(.82+.18*cos(w*260./ring))*(1.-.55*sst(.6,1.,abs(w)/max(wide,1e-3)));
			c=mix(c,pc,cov*show);
		}
		if (k == 0) { vec2 f=q-vec2(.0,.055); c+=vec3(1.,.62,.28)*lit*exp(-dot(f,f)*900.)*show; }
	}
}
// A hit: the crest of its ring, and the light of ring and drop.
float rlCr(float z) { return (exp(-z*z)+.4*exp(-(z+2.6)*(z+2.6)))*uHits; }
vec3 rlH(float ring,float r) { return (uKind[4]*uKind[4]+vec3(.25,.2,.14))*(ring+uHits*uHits*exp(-r*r))*(.4+uEnergy); }
vec3 rlRiver(vec2 p) {
	float d=rlHor-p.y,px=1./uRes.y;
	if (d <= .0) {
		vec3 sky=rlSky(p.x,-d,px*1.2);
		if (uOwn[6]<.0) { vec4 a=rlAir(vec2(p.x,-d),.0); sky=sky*(1.-a.a*-uOwn[6])-uOwn[6]*a.rgb; }
		return sky;
	}
	d=max(d,.0015);
	float fl=uTravel*.03,S=-log(d)-fl,X=(p.x-rlMid(d))/d;
	float swell=.55+1.1*uLow;
	swell*=(1.+max(uOwn[4],.0))*(1.-.85*rlStill);
	// ripples: long slow ones and short flat ones
	float n1=rlN(vec2(X*.9+uTime*.05,S*9.-uTime*.06))-.5;
	float n2=rlN(vec2(X*2.6-uTime*.11,S*25.-uTime*.1+n1*3.))-.5;
	float n3=rlN(vec2(X*3.6+uTime*.16+7.,S*58.-uTime*.17+n1*5.))-.5;
	float rip=n1*.5+n2*.7*sst(.004,.04,d)+n3*.75*sst(.03,.14,d);
	rip*=1.-.92*rlStill;
	float drop=.0;
	if (uOwn[4]>.0) for (int i=0; i<2; i++) { // the rings of the rain
		float f=float(i); vec2 u=vec2(p.x/d*(3.2+f),-log(d)*(6.5+2.*f))+f*7.3,id=floor(u); float n=hash21(id+60.),t=fract(uTime*(.45+.2*n)+n*7.);
		u -= id+.5+(vec2(fract(n*53.),fract(n*91.))-.5)*.3; float o=(length(u)-.33*t)*20.; drop+=exp(-o*o)*(1.-t)*sst(.02,.07,d);
	}
	drop*=max(uOwn[4],.0); rip+=drop*.5;
	// where a hit drops its ring
	vec2 at=vec2((.16+.14*sin(uTime*.05))*rlWd,.35+.05*cos(uTime*.043));
	vec2 to=vec2(p.x/d-at.x/at.y,(1./d-1./at.y))*at.y;
	float rr=length(to),z=(rr-rlGone*.5)*44.;
	float crest=rlCr(z),slope=-z*exp(-z*z*.7)*uHits;
	// the hills and the sky upside down
	float mir=d*.95+rip*(.03+.12*d)*swell*1.4+slope*.02;
	vec3 c=rlSky(p.x+n2*.02,abs(mir)+.004,.006+.025*d)*mix(mix(.7,.3,sst(.0,.45,d)),mix(.92,.72,sst(.0,.5,d)),max(rlDay,.8*rlMoon));
	if (rlMoon>.0) { float w=(p.x-rlMn.x*rlWd+(n1+n2)*.1*swell)/(.035+.11*d); c+=rlMoon*rlMoon*vec3(.5,.52,.5)*exp(-w*w)*sst(-.25-rlStill,.4,rip)*exp(-d*1.5); }
	c+=drop*vec3(.1,.13,.15)*(1.+2.*rlDay);
	if (uOwn[6]<.0) { vec4 a=rlAir(vec2(p.x+(n1+n2*.5)*.06*swell,abs(d+rip*.015*swell)),.5); c=c*(1.+.5*a.a*uOwn[6])-uOwn[6]*a.rgb*.5*sst(-.3,.1,rip+.12); }
	c+=vec3(.007,.018,.027)*sst(.1,.5,rip)*(.25+.75*rlOff(.1,.6,d))*(.7+.8*uHigh);
	c=mix(c,vec3(.035,.05,.06)+rlDay,.6*exp(-d*110.));
	float soft=.0;
	if (rlSnow>.0) { // snow on ice
		float b=rlN(vec2(X*.7,S*5.))+.5*rlN(vec2(X*2.+5.,S*15.)),gr=hash21(floor(p*uRes.y*.5));
		vec3 s=mix(vec3(.035,.06,.1)*(1.+3.*rlMoon),rlPale(),rlDay)*(.45+.5*b+.25*sst(.75,.95,b))*(.94+.12*gr);
		c=mix(c,s,rlSnow); soft=rlSnow;
	}
	if (rlGrow>.0) { // pads on the water
		vec2 a=rlPads(vec2(X*2.2,S*4.2),rlGrow*(.35+.3*sst(.1,.9,abs(p.x/rlWd+.15))),2.2*px/d+.004/(d+.02)*.2);
		a.x*=sst(.015,.06,d); vec3 k=rlLin(uKind[2],1.);
		c=mix(c,mix(vec3(.012,.03,.022)+.02*k+rlMoon*vec3(.02,.05,.05),vec3(.1,.22,.12)+.2*k,rlDay)*a.y,a.x); soft=max(soft,.75*a.x);
	}
	// the lanterns, far rows first
	float L=1.5+.7*uSpace,k0=floor((-log(d/(1.+L*rlSz))-fl)/rlSt)+1.,rank=max(uOwn[6],.0);
	vec3 air=vec3(.0),hP=air; vec2 hQ=vec2(.0); float hY=.0,hS=.1,hL=.0,hA=1.,hH=.0,hW=.0;
	for (int i=0; i<7; i++) {
		float k=k0-float(i),D0=exp(-(k*rlSt+fl));
		if (D0>1.15*d/max(1.-rlT*rlSz-.1*rlSz,.16)) break;
		if (D0<.0034) continue;
		float m=mod(k,997.),shift=hash11(m)*5.*(1.-rank)+.5*rank,mid=rlMid(D0);
		float cx=(p.x-mid)/D0/rlC+shift,id=floor(cx);
		float lx=(id+.5-shift)*rlC;
		float n=hash21(vec2(id+141.,m+3.));
		float dens=(.3+.65*rlOff(.03,.5,D0))*exp(-lx*lx*.06)+.02;
		if (uOwn[6] != .0) dens=mix(dens*(1.+min(uOwn[6],.0)),1.1*rlOff(1.4,2.2,abs(lx)),rank)+min(uOwn[6],.0);
		if (n>dens+.35) continue;
		vec2 h=vec2(fract(n*91.7),n),g=fract(n*vec2(313.7,47.1));
		lx+=(h.x-.5)*.3*rlC*(1.-rank);
		float D=D0*exp((g.x-.5)*.28*(1.-rank)),near=rlOff(.02,.5,D);
		vec2 foot=vec2(mid+lx*D0,rlHor-D);
		vec4 pc=piece(vec2(foot.x/1.78+.5,sat(D/.75)));
		float show=max(rlOff(dens-.06,dens,h.y),sst(.1,.5,pc.a))*sst(.0034,.007,D)*(1.+min(uOwn[6],.0));
		if (show<.01) continue;
		int kd=int(g.y*4.99);
		float burn=rlB(kd,h.x,pc.a,near*.9)*(1.-.25*near)*show*(1.+.8*uKeys*near);
		vec3 paper=rlPap(kd);
		float ph=h.x*60.+g.x*9.,ax=at.x-foot.x;
		float tip=4.*uHits*rlGone*exp(-(ax*ax*5.+(D-at.y)*(D-at.y)*16.));
		foot.y+=D*((.005+.014*uLow)*sin(uTime*.6+ph)+.03*tip*sin(ph));
		vec2 q=(p-foot)/(D*rlSz);
		float aa=px/(D*rlSz),e=2.*abs(fract(cx)-.5),win=1.-e*e*e*e;
		win*=win;
		if (win<.004) continue;
		// light in the air
		vec2 hq=q-vec2(.0,.09);
		air+=paper*burn*win*(.15+.1*uSpace+.1*uMic)*exp(-dot(hq,hq*vec2(1.,.8))*40.)*rlOff(.1,.31,q.y)*(1.-.6*rlDay);
		if (q.y<.02) {
			// the long reflection, broken into flat strokes further down
			float dy=max(-q.y,.0),t=dy/L;
			float wx=q.x+(n1*.4+n2*.22)*(.1+dy)*swell*.6+n3*.05+slope*.06;
			if (abs(wx)<.17+aa) {
				float wide=.066+.02*dy,body=rlOff(wide-.03-aa,wide+.03+aa,abs(wx));
				float cut=sst(-.12,.1,rip*.9+.4-.72*t-.16*sst(.0,.1,dy));
				float fall=exp(-dy*1.25)*rlOff(.5,1.,t)*(.35+.65*sst(.0,.07,dy))*mix(cut,.8,rlStill)*burn*win*(1.-soft);
				c*=1.-rlDay*.8*min(fall*body*1.4,1.);
				c+=fall*(body*(paper*.55+vec3(.1,.03,.0))*(.8+.4*uTone)+vec3(1.,.6,.24)*.5*exp(-wx*wx*380.-dy*2.));
			}
			// and the warm stain round its foot
			c+=paper*burn*win*.22*exp(-q.x*q.x*22.-dy*11.)*(.5+rip)*rlOff(-.08,.02,q.y);
			if (soft>.0) c+=soft*(paper+vec3(.2,.08,.02))*burn*win*.55*exp(-dot(q*vec2(1.,2.1),q*vec2(1.,2.1))*22.)*(1.-.6*rlDay);
			if (rlDay>.0) c*=1.-.45*rlDay*show*exp(-dot(q*vec2(1.,3.),q*vec2(1.,3.))*70.)*win;
		}
		if (q.y>-.1 && q.y<.36) {
			float tiny=sst(.028,.05,aa),w2=.055+aa*.8; // far off, a point
			if (tiny>.0) {
				c+=tiny*mix(paper,vec3(1.,.55,.2),.45)*burn*exp(-dot(hq*vec2(1.,.7),hq)/(w2*w2))*1.3*win;
			}
			if (tiny<1. && abs(q.x)<.2) { // the nearest one here is drawn last
				q=rot(sin(uTime*.5+ph*1.7)*(.02+.06*uLow)+.25*tip*sin(ph*2.3))*q;
				float yaw=(g.x-.5)*1.1+.1*sin(uTime*.13+ph),sp=.08+.6*D,lo=-q.y-.037-sp*.13;
				vec2 N=rlNr(yaw,sp),R=rlR(yaw,sp);
				if ((uOwn[2]<-.5?length(vec2(q.x/.17,(q.y-.045+.04*sp)/(.075+.1*sp)))-1.:uOwn[2]>.5?(rlBall(q)<.0?-1.:1.):max(abs(q.x)-R.x*(q.y<.02?1.22:1.),max(lo,q.y-rlT-rlE(q.x,N,R))))<aa) { hQ=q; hY=yaw; hS=sp; hP=paper; hL=burn*1.15; hA=aa; hH=h.x; hW=sst(.0,.4,show)*(1.-tiny); }
			}
		}
	}
	if (hW>.0) {
		float o=sst(.25,.75,abs(uOwn[2]));
		if (o<1.) rlBox(c,hQ,hY,hS,hP,hL,hA,hH,hW*(1.-o));
		if (o>.0) rlOther(c,hQ,hY,hS,hP,hL,hA,hW*o);
	}
	if (rlGrow>.0) for (int i=-1; i<2; i++) { // reeds before us, to the sides
		float id=floor(p.x*34.)+float(i),n=hash11(id+300.),x0=(id+.2+.6*fract(n*31.))/34.,side=sst(.35,.95,abs(x0+.1)/rlWd);
		float top=rlGrow*side*(.2+.8*n),h=(p.y+.55)/max(top,1e-3); if (h>1.) continue;
		float x=p.x-x0-(n-.5)*.06*h*h-.012*h*h*sin(uTime*.5+n*9.+x0*3.);
		float w=mix(.0042,.001,h)+.005*sst(.1,.0,abs(h-.84)-.05)*step(.6,fract(n*71.));
		c=mix(c,mix(vec3(.004,.009,.008),vec3(.11,.13,.08),rlDay),rlIn(px,abs(x)-w));
	}
	c+=air;
	return c+rlH(crest*(.7+.8*rip)*exp(-rr*rr*3.),rr*42.);
}
// Where the stones stand along the current, and how big they are.
const vec3 rlS[5]=vec3[5](vec3(-.3944,.3513,.17),vec3(.3249,-.3871,.2),vec3(-.3386,-.3129,.11),vec3(-.1245,.3784,.075),vec3(.6235,-.3613,.07));
const mat2 rlM=mat2(.9211,-.3894,.3894,.9211);
float rlLow=.8; // how much the slant shortens the water
// How far the current gives way at l from a stone, squared.
float rlRd(vec2 l,float R) {
	vec2 f=l/R; f*=f;
	float w=max(1.-f.x*.13,.0)*max(1.-f.y*.16,.0);
	return R*R*w*w;
}
// The current parts round each stone.
void rlPush(inout vec2 q,vec3 st) {
	vec2 l=q-st.xy; float w=rlRd(l,st.z+rlPad);
	if (w>.0) q.y+=.5*((l.y<.0?-1.:1.)*sqrt(l.y*l.y+4.*w)-l.y);
}
// A stone, as great as it is here.
vec3 rlStone(int i) { vec3 s=rlS[i]; s.z*=1.+(uOwn[7]>.0?.5:1.)*uOwn[7]; if (uOwn[7]>.0) s.xy*=1.+.22*uOwn[7]; return s; }
vec2 rlPart(vec2 q) { rlPush(q,rlStone(0)); rlPush(q,rlStone(1)); rlPush(q,rlStone(2)); return q; }
// An open lily from over it: how much, how light.
vec3 rlLily(vec2 l,float px) {
	float r=length(l),a=r>1e-4?atan(l.y,l.x):.0; vec3 o=vec3(.0,1.,.0);
	for (int k=0; k<3; k++) {
		float n=8.-float(k),len=.082-.021*float(k),v=r/len,part=TAU/n,w=(mod(a+float(k)*.4,part)-.5*part)*r;
		float wide=.62*part*len*.75*sin(PI*pow(sat(v),.8))+(v<.3?.004:.0),cov=rlIn(px,max(abs(w)-wide,(v-1.)*len));
		float sh=(.8+.2*cos(w*900./(1.+float(k))))*(1.-.6*sst(.5,1.,abs(w)/max(wide,1e-4)))*mix(.55,1.15,sat(v*1.1));
		o=vec3(max(o.x,cov),mix(o.y,sh,cov),.0);
	}
	return o;
}
vec3 rlTop(vec2 p) {
	float px=1.2/uRes.y,fl=uTravel*.014,swell=.6+uLow;
	swell*=(1.+.8*max(uOwn[4],.0))*(1.-.85*rlStill);
	vec2 p0=p; if (uOwn[5] != .0) { float z=exp2(-.5*uOwn[5]); p*=z; px*=z; }
	vec2 P=vec2(p.x,p.y/rlLow),q=rlM*P,sl=vec2(.0),lane=q,sn=vec2(.0);
	float stone=.0,shade=1.,squeeze=.0,dome=.0,grain=.0;
	for (int i=0; i<5; i++) {
		vec3 st=rlStone(i); vec2 l=q-st.xy; float R=st.z+rlPad,o2=float(i); if (st.z<.004) continue;
		if (i<3) { float w=rlRd(l,R); lane.y -= w*l.y/max(l.y*l.y,R*R); squeeze+=w; }
		vec2 e=l*vec2(.86,1.1); float r=length(e);
		if (r>st.z+.2) continue;
		vec2 en=e/st.z; float rim=st.z*(.94+.05*sin(en.x*2.6+o2*2.1)+.045*sin(en.y*3.1+en.x+o2*4.7));
		float edge=r-rim,o=max(edge,.0),cov=rlIn(px,edge);
		vec2 out_=e/max(r,.001);
		if (cov>stone) { stone=cov; float b=sat(r/rim); sn=out_*b*b; dome=1.-b*b; }
		// rings that leave the stone, stronger downstream
		sl+=out_*cos(o*110.-uTime+o2)*rlOff(.0,.2,o)*rlOff(-.05,.2,o)*(.65+.35*out_.x)*.8;
		shade*=1.-.6*rlOff(.0,.06,o);
	}
	vec2 fw=q-vec2(fl*1.1,.0);
	float n1=rlN(fw*vec2(5.,10.)+vec2(.0,uTime*.1))-.5,n2=rlN(fw*vec2(13.,42.)+n1*2.+vec2(uTime*.12,-uTime*.15))-.5;
	float n3=.5*sin(fw.x*61.+fw.y*25.+n1*9.+uTime*.4)*sin(fw.y*105.-fw.x*17.+n2*7.+uTime*.5);
	sl*=1.-.5*rlStill;
	sl+=vec2(n2+n3*.5,n1+n2+n3)*swell*.7;
	float drop=.0;
	if (uOwn[4]>.0) for (int i=0; i<2; i++) { // the rings of the rain
		float f=float(i); vec2 u=P*(5.+2.5*f)+f*7.3,id=floor(u); float n=hash21(id+60.),t=fract(uTime*(.4+.2*n)+n*7.);
		u -= id+.5+(vec2(fract(n*53.),fract(n*91.))-.5)*.2; float r=length(u),o=(r-.4*t)*22.,w=exp(-o*o)*(1.-t)*uOwn[4]; drop+=w; sl+=rlM*u/max(r,.01)*o*w*.8;
	}
	vec2 at=vec2(.16*sin(uTime*.047),-.12+.1*cos(uTime*.039)),to=P-at;
	float rr=length(to),z=(rr-rlGone*.4)*60.,tip=4.*uHits*rlGone;
	if (rr>.001) sl -= rlM*to/rr*z*exp(-z*z*.6)*uHits*1.2;
	// dark water, a little sky on it
	vec3 c=mix(vec3(.004,.015,.02),vec3(.002,.005,.014),sst(-.6,.6,p.x*.5-p.y));
	float sky=dot(sl,rlM*vec2(.2,.98)),soft=.0;
	if (uOwn[7]<.0) { // the bed of the shallows, through the water
		vec2 u=(q+sl*.006)*15.,id=floor(u),best=vec2(9.,.0);
		for (int j=-1; j<2; j++) for (int i=-1; i<2; i++) { vec2 g=id+vec2(float(i),float(j)); float n=hash21(g+400.); vec2 l=g+.5+.7*(vec2(fract(n*37.),fract(n*71.))-.5)-u; float r=length(rot(n*20.)*l*vec2(1.,1.35))/(.45+.35*fract(n*113.)); if (r<best.x) best=vec2(r,n); }
		float dome=sat(1.-best.x*best.x); vec3 peb=mix(vec3(.5,.46,.4),rlLin(uKind[2],.55),.5*fract(best.y*17.))*(.35+.8*fract(best.y*5.3))*(.12+.88*sqrt(dome))*(.85+.3*noise(u*5.));
		float net=1.-abs(n1+n2); net*=net*net;
		c+=-uOwn[7]*peb*(mix(.03,1.5,rlDay)+.06*rlMoon)*(.8+.5*net*net); soft=-uOwn[7]*.4;
	}
	if (rlDay>.0) { float w=rlDay*mix(1.,.4,max(-uOwn[7],.0)); c=mix(c,rlPale()*(.8+.25*sst(-.9,.9,sky)+.1*(p0.y-p0.x*.4)),w); }
	if (rlMoon>.0) { vec2 m=p0-vec2(.02,.26)+sl*.03; c+=rlMoon*(vec3(.02,.045,.06)*(.6+.8*sst(.0,.9,sky))+vec3(.14,.17,.19)*exp(-length(m)*6.)+vec3(.9,.86,.75)*sst(.4,.8,rlMoon)*rlIn(.01,length(m)-.085)); }
	shade=mix(shade,1.,.8*rlSnow);
	c+=drop*vec3(.03,.05,.06)*(1.+4.*rlDay);
	if (rlGrow>.0) {
		vec2 a=rlPads(fw*7.5+sin(fw.yx*9.+vec2(.0,uTime*.3))*.04,rlGrow*.56,px*7.5),b=rlPads(fw*3.6+20.,rlGrow*.4,px*3.6); if (b.x>a.x) a=b;
		vec3 k=rlLin(uKind[2],1.);
		c=mix(c,mix(vec3(.01,.024,.018)+.015*k+rlMoon*vec3(.02,.045,.045),vec3(.1,.24,.14)+.2*k,rlDay)*a.y,a.x); soft=max(soft,a.x*.8); sl*=1.-.8*a.x;
	}
	if (rlSnow>.0) {
		float b=rlN(q*2.3+3.)+.5*rlN(q*7.)+.16*rlN(q*40.),e=b-rlN((q+rlM*vec2(-.02,.03))*2.3+3.)-.5*rlN((q+rlM*vec2(-.02,.03))*7.);
		c=mix(c,mix(vec3(.03,.05,.085)*(1.+3.*rlMoon),rlPale(),rlDay)*(.85-1.9*e+.2*b)*(.94+.12*hash21(floor(gl_FragCoord.xy*.5))),rlSnow); soft=max(soft,rlSnow); sl*=1.-rlSnow;
	}
	c+=vec3(.006,.02,.028)*sst(.15,1.1,sky)*(.25+sat(p.y+.5))*(.8+.6*uHigh)*(1.-soft);
	c*=shade;
	// the stones: wet, dark, cool where they take the sky
	if (stone>.0) {
		grain=noise(q*24.)*.6+noise(q*85.)*.4;
		float face=sat(.35+.8*dot(sn,vec2(-.011,.873)));
		vec3 sc=vec3(.006,.0095,.014)*(.35+grain)*(.25+2.2*face)+vec3(.02,.034,.045)*sst(.62,.8,grain)*face;
		if (rlDay>.0 || rlMoon>.0) sc=mix(sc*(1.+4.*rlMoon),(.12+.3*rlLin(uKind[2],.7))*(.3+.7*grain)*(.3+1.2*face),rlDay);
		dome=max(dome,.2*rlSnow);
		if (rlSnow>.0) sc=mix(sc,mix(vec3(.04,.065,.11)*(1.+3.*rlMoon),rlPale(),rlDay)*(.75+.35*dot(sn,vec2(-.3,.9))+.35*grain),rlSnow*sst(.1,.25,.5*dome+.3*(grain-.5)+.4*sn.y+.15));
		c=mix(c,sc*(.2+.8*sst(.0,.2,dome)),stone);
	}
	const float A=.04; float CX=.33*rlSz,CY=.2*rlSz,rank=max(uOwn[6],.0),file=max(-uOwn[6],.0),under=.0; vec2 hG=vec2(.0),gq;
	float row0=floor(lane.y/CY);
	vec3 lit=vec3(.0),hP=lit; vec2 hB=vec2(.0),hS=hB; float hCov=.0,hL=.0,hR=.0,hW=.0,hH=.0,wide=.0023+.0006*uSpace+.0005*uMic;
	float far=uOwn[5]+uOwn[7]>.3?2.:1.;
	for (int i=0; i<(far>1.?10:6); i++) {
		float row=row0+far-float(i/2),stag=fract(row*.5);
		vec2 id=vec2(floor((lane.x-fl)/CX-.5-stag)+1.-float(i % 2),row);
		if (squeeze == .0 && abs((row+.5)*CY-lane.y)>.24*rlSz) continue;
		float n=hash21(vec2(id.x+5.,id.y+31.));
		if (n>.78+.3*abs(uOwn[6])) continue;
		float on=1.-file*sst(.1,.3,abs(mod(row+4.,9.)-4.)); if (on<.01) continue;
		vec2 h=vec2(fract(n*91.7),n),g=fract(n*vec2(313.7,47.1));
		vec2 ctr=vec2((id.x+.5+(h.x-.5)*.4*(1.-rank)+stag)*CX+fl,(id.y+.5+(g.x-.5)*.3*(1.-rank))*CY),off=ctr-lane;
		if (dot(off,off)>.065*far*rlSz*rlSz) continue;
		ctr=rlPart(ctr);
		vec2 l=q-ctr;
		if (dot(l,l)>.042*rlSz*rlSz) continue;
		vec2 sp=ctr*rlM;
		vec4 pc=piece(vec2(sp.x/1.78+.5,.5-sp.y*rlLow));
		float show=max(step(h.y,.4+.7*abs(uOwn[6])),sst(.1,.5,pc.a))*on;
		if (show<.01) continue;
		int kd=int(g.y*4.99);
		float ph=h.x*60.+g.x*9.,there=sst(.0,.4,show);
		vec2 near=sp-at; float tp=tip*exp(-dot(near,near)*8.);
		ctr+=vec2(sin(uTime*.31+ph),cos(uTime*.27+ph))*(.003+.006*uLow)+tp*.012*vec2(sin(ph),cos(ph));
		float burn=rlB(kd,h.x,pc.a,sat(sp.y*rlLow+.5)*.9)*show*(1.+.4*uKeys*sat(sin(ph+uTime)));
		burn+=1.6*uHits*exp(-dot(near,near)*3.)*sat(2.*(abs(uOwn[0])+abs(uOwn[4])));
		vec3 paper=rlPap(kd);
		l=(q-ctr)/rlSz;
		float r=length(l);
		vec2 dir=l/max(r,.001);
		// what it lights
		float win=rlOff(.06,.2,r)*rlOff(.04,.065,dot(off,off)/(rlSz*rlSz)),pool=win*wide/(r*r+.0012);
		float facing=dot(-dir,sl),f=sat(facing),facet=mix(.16+1.5*f*f,.6,soft);
		under=max(under,show*exp(-r*r*220.));
		float glint=sst(.5,.9,sin(r*150.-uTime*1.2+ph)+facing)*win*.5*(1.-soft)*(1.-.7*rlStill);
		float onStone=(.1+1.6*sat(dot(-dir,sn)+.05))*(.2+1.2*grain);
		lit+=paper*burn*mix(pool*facet+glint*(.16+.2*uTone)*win,pool*onStone*1.8,stone);
		// its short reflection towards the bridge
		vec2 at2=l*rlM; float x=at2.x,y=-at2.y;
		if (y>.0 && y<.2) {
			float wx=x+(n1+n2)*(.01+y*.25)*swell;
			lit+=(paper*.8+vec3(.12,.05,.0))*burn*.8*win*rlOff(.028,.05,abs(wx))*exp(-y*14.)*sst(-.2,.15,n2+n3*.8+.3-y*3.2)*rlOff(.12,.2,y)*(1.-stone)*(1.-soft);
		}
		// the lantern here is drawn last
		vec2 lean=rlM*(vec2(sp.x*.03,.062+sp.y*.03)+vec2(.003,.002)*sin(uTime*.5+ph))*(1.+.6*uOwn[5]+.2*min(uOwn[5],.0)),mid=l-lean*.5;
		if (dot(mid,mid)<.0121) {
			mat2 m=rot(g.x*6.*(1.-rank)+.4*rank+.2*sin(uTime*.11+ph)+tp*.3*sin(ph*3.));
			vec2 b=m*l,s=m*lean,cb=abs(b-s*.5)-A-abs(s)*.5,nn=vec2(-s.y,s.x)/max(length(s),.001);
			float raft=rlIn(px,max(abs(b.x),abs(b.y))-A*1.22);
			float hull=rlIn(px,max(max(cb.x,cb.y),abs(dot(b,nn))-A*(abs(nn.x)+abs(nn.y))));
			if (uOwn[2]>.0) { // a globe, seen from over it
				float o=sst(.25,.75,uOwn[2]),ball; gq=(l-lean*.5)*rlM*vec2(1.,rlLow*1.25); ball=rlIn(px,length(gq)-.052);
				if (max(raft,ball)>min(hCov,.5)) hG=gq;
				raft=mix(raft,rlIn(px,r-.03),o)*(1.-rlSnow); hull=mix(hull,ball,o);
			} else if (uOwn[2]<.0) { float o=sst(.25,.75,-uOwn[2]); raft*=1.-o; hull=mix(hull,rlLily(m*(l-lean*.15),px).x,o); }
			if (max(raft,hull)>min(hCov,.5)) { hCov=max(raft,hull); hB=b; hS=s; hP=paper; hL=burn; hR=raft*there; hW=hull*there; hH=h.x; }
		}
	}
	if (hCov>.0) {
		vec2 sd=vec2(hS.x<.0?-1.:1.,hS.y<.0?-1.:1.),aS=max(abs(hS),.001),e=hB*sd/aS,tn=e+A/aS,sh=sst(.0,.018,aS);
		float v=clamp(min(tn.x,tn.y),.0,1.);
		bool wx=tn.x<tn.y,ix=e.x-A/aS.x>e.y-A/aS.y;
		vec2 on=(hB-hS*v)/A,bt=abs(hB-hS); float rim=max(bt.x,bt.y)-A;
		vec3 body=rlWl(wx?on.y:on.x,v,hP,hL*1.25,px/.06,hH)*(wx?.8*sh.x:sh.y); // a wall seen edge on is only its slat
		// its mouth: the inner walls and the flame
		float vi=max(max(e.x-A/aS.x,e.y-A/aS.y),.0);
		vec2 in_=(hB-hS*vi)/A,fv=hB-hS*.25;
		vec3 inner=rlIns(vi>.0?(ix?in_.y:in_.x):length(in_)*.8,vi,hP,hL*1.1)*(ix?.78*sh.x:sh.y)+vec3(1.,.74,.38)*hL*2.*exp(-dot(fv,fv)*5000.);
		body=mix(body,inner,rlIn(px,rim));
		body*=1.-.75*rlOff(.0022-px,.0022+px,abs(rim+.002));
		if (uOwn[2]>.0) {
			vec2 n=hG/.052,t=vec2(.0,length(hS)); float z=sqrt(sat(1.-dot(n,n))); vec3 ax=normalize(vec3(t*9.,.8));
			float al=dot(vec3(n,z),ax),lat=asin(clamp(al,-1.,1.)); vec2 f=n+t*5.;
			vec3 b=rlGlobe(f*.9,lat,hL*1.2,hP,px/.02);
			b=mix(b,(hP*.5+vec3(.5,.32,.12))*hL*exp(-dot(n-t*5.,n-t*5.)*5.)*1.8+.004,sst(.83,.87,al))*(1.-.8*rlOff(.0,.03+px,abs(al-.85)));
			body=mix(body,b,sst(.25,.75,uOwn[2]));
		} else if (uOwn[2]<.0) {
			vec2 lq=hB-hS*.15; vec3 w=rlLily(lq,px); float r=length(lq)/.08;
			vec3 b=mix(hP,vec3(1.,.55,.22),.6*exp(-r*3.))*hL*(.14+1.5*exp(-r*r*3.2))+rlDay*(hP*.4+.22)*(.5+.6*r);
			b=b*w.y+vec3(1.,.66,.3)*hL*1.6*exp(-r*r*34.);
			body=mix(body,b,sst(.25,.75,-uOwn[2]));
		}
		c*=1.-.45*rlDay*under*(1.-hW);
		c=mix(mix(c,hP*hP*hL*.16+.003,hR),body,hW);
		lit*=(1.-hR)*(1.-.95*hW);
	}
	return c+lit+rlH(rlCr(z)*exp(-rr*rr*6.)*.4,rr*39.)*(1.-stone);
}
vec3 render(vec2 p) {
	rlWd=clamp(uRes.x/uRes.y/1.78,.4,1.15);
	rlDay=max(uOwn[0],.0); rlMoon=max(-uOwn[0],.0); rlSnow=max(uOwn[3],.0); rlGrow=max(-uOwn[3],.0); rlStill=max(-uOwn[4],.0);
	if (uOwn[1] != .0 || uOwn[5] != .0) {
		if (uVar<.5) {
			rlHor=uOwn[5]>.0?.25-.36*uOwn[5]:.25-.42*uOwn[5];
			rlSz=exp2(-.9*uOwn[1]+(uOwn[5]>.0?.6:.8)*uOwn[5]);
			rlSt*=pow(rlSz,.75); rlC*=rlSz;
		} else { rlSz=exp2((uOwn[1]>.0?-.6:-.9)*uOwn[1]); rlLow=uOwn[5]>.0?.8-.3*uOwn[5]:.8-.2*uOwn[5]; rlPad*=rlSz; }
	}
	return screenOf(uVar<.5?rlRiver(p):rlTop(p));
}
