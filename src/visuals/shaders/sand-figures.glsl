// name: Sand figures
// a: Brass plate
// b: Water drum
// what: Fine pale sand on a square brass plate clamped at its middle, gathered by the sound into stars, loops and knots, every grain with its size and shadow under a low lamp, the figure sliding slowly into the next; or a round dish of water over black, standing in rings and petals with silver light along them.
// follows: Loudness draws the sand into sharp lines and raises the water; with nothing sounding the sand lies loose and the water faint. The bands lean on which figure stands. Each kind lights one side, the piece tints what swings, a hit throws up grains or sends out a ring, a cue shakes the figure loose until it settles. Keys brighten the far side, a voice the swing.
// own: 0 1 fine figures with many turns, -1 a few great curves; 1 the plate is round (b: a square dish), -1 it has no edge and goes on for ever; 2 the ground: 1 pale, with dark dyed sand (b: milk), -1 deep lacquer in the drone's colour (b: dyed oil); 3 1 great beads (b: a field of drops), -1 drawn in thin contour lines; 4 the light: 1 full and even, -1 dark, and the figure itself glows; 5 the eye: 1 straight from above, -1 low along it; 6 1 rings and spokes, -1 bent and wandering; 7 1 heaped and broad (b: steep), -1 thin and sparse (b: hardly stirred)
#define sst smoothstep
// Bent and wandering.
vec2 sfBent(vec2 q) {
	float w=-.26*min(uOwn[6],.0);
	return q+w*vec2(sin(q.y*2.7+uTime*.03+1.)+.5*sin(q.y*5.9+q.x*2.3),sin(q.x*3.1-uTime*.026)+.5*sin(q.x*5.1-q.y*3.7+2.));
}
float sfHt=.0; // the height of the water
float sfGo; // the slow clock of the figures
vec3 sfRd; float sfF;
// How strongly the plate or the dish is driven, and how much of that a cue shakes loose for a moment.
float sfDrive() { return sat(.1+.75*sqrt(sat(uLevel))+.12*uDrone+.1*uKeys); }
float sfLoose() { return 4.*uCue*(1.-uCue); }
float sfG(float x) { return exp(-x*x); }
vec3 sfInk(vec3 c) { return c*c*1.2+.03; }
float sfFall(float a,float b,float x) { return 1.-sst(b,a,x); } // falls from 1 at b to 0 at a
// The plate's standing wave at q (-1 to 1 each way): x its height, yz its slope. Eight figures, each coming and going on a long
// sine of its own and leaned on by its part of the spectrum.
vec3 sfPlate(vec2 q) {
	const ivec2 M[8]=ivec2[8](ivec2(1,2),ivec2(1,2),ivec2(1,3),ivec2(1,3),ivec2(2,3),ivec2(2,4),ivec2(0,4),ivec2(1,4));
	const float SG[8]=float[8](1.,-1.,1.,-1.,1.,-1.,1.,-1.);
	vec2 q0=q; float fine=uOwn[0] == .0?1.:exp2(.9*uOwn[0]);
	if (uOwn[0] != .0) q*=fine;
	if (uOwn[6]<.0) q=sfBent(q);
	vec2 C[5],S[5];
	C[0]=vec2(1.); S[0]=vec2(.0);
	C[1]=cos(PI*q); S[1]=sin(PI*q);
	for (int k=2; k<5; k++) { C[k]=C[k-1]*C[1]-S[k-1]*S[1]; S[k]=S[k-1]*C[1]+C[k-1]*S[1]; }
	vec3 u=vec3(.0); float ww=.0;
	float star=sst(-.45,.45,sin(sfGo*.83+.4)); // the figures with a cross through the middle, or those without
	for (int i=0; i<8; i++) {
		float fi=float(i),cl=float(i & 1);
		float a=.5+.5*sin(sfGo*(1.+.27*cl)+fi*.25*PI+cl*1.2+.5*sin(sfGo*.31+fi*1.9)); // of each sort one is always up
		a*=a; float w=a*a*(.5+.9*uBands[i*2])*(SG[i]<.0?star:1.-star);
		int n=M[i].x,m=M[i].y;
		float s=SG[i];
		u.x+=w*(C[n].x*C[m].y+s*C[m].x*C[n].y);
		u.y -= w*PI*(float(n)*S[n].x*C[m].y+s*float(m)*S[m].x*C[n].y);
		u.z -= w*PI*(float(m)*C[n].x*S[m].y+s*float(n)*C[m].x*S[n].y);
		ww+=w*w;
	}
	u /= sqrt(ww+1e-6);
	if (uOwn[0] != .0) u.yz*=fine;
	if (uOwn[6]>.0) { // as a round plate swings
		float r=length(q0),th=r>1e-4?atan(q0.y,q0.x):.0; vec2 o=q0/max(r,1e-3),x=vec2(-o.y,o.x); vec3 v=vec3(.0); ww=.0;
		for (int i=0; i<4; i++) {
			float fi=float(i),n=fi == .0?.0:2.+2.*fi,k=(9.5+2.6*fi-4.*step(2.5,fi))*fine,a=.5+.5*sin(sfGo*.9+fi*1.571),w=(.06+a*a)*(.5+.9*uBands[i*4]);
			float c=cos(n*th),s=sin(k*r+fi),b=cos(k*r+fi);
			v+=w*vec3(c*b,-k*c*s*o-n*sin(n*th)*b/(r+.08)*x); ww+=w*w;
		}
		u=mix(u,v*1.3/sqrt(ww+1e-6),uOwn[6]);
	}
	return u;
}
// The ray through p, for an eye tipped down by the angle whose sine and cosine are given.
vec3 sfEye(vec2 p,float D,float sn,float cs) {
	sfRd=vec3(p.x,p.y*sn+sfF*cs,min(p.y*cs-sfF*sn,-.08));
	return vec3(.0,-D*cs,D*sn);
}
vec3 sfSand(float h) { return mix(uKind[1],uKind[3],h)*mix(uKind[1],uKind[3],h); }
float sfBox(vec2 q,float h,float r) { vec2 d=abs(q)-h+r; return length(max(d,.0))+min(max(d.x,d.y),.0)-r; }
// The plate: square, round, or without an edge.
float sfSide(vec2 q,float r) {
	if (uOwn[1]>.0) r=mix(r,1.,uOwn[1]);
	return sfBox(q,1.-14.*min(uOwn[1],.0),r);
}
float sfSeg(vec2 q,vec2 b) { return length(q-b*sat(dot(q,b)/max(dot(b,b),1e-6))); }
// One sowing of grains. Every grain has its place and its own threshold for good: it swells and fades there as the sand gathers.
void sfGrains(vec2 q,float cell,float seed,vec3 u,float sig,float amount,float loose,vec2 L,float px,vec3 lit,inout vec3 col) {
	vec2 g=q/cell,b=floor(g-.5);
	for (int k=0; k<4; k++) {
		vec2 id=b+vec2(float(k & 1),float(k >> 1));
		vec2 h=hash22(id+seed);
		float h2=fract(h.x*17.31+h.y*5.7); // when it comes
		vec2 c=id+.5+(h-.5)*.6;
		vec2 d=g-c;
		float uu=u.x-dot(u.yz,d)*cell;
		float line=exp(-uu*uu/(sig*sig));
		float dens=loose+amount*line;
		float on=sst(h2,h2+.22,dens*1.22);
		if (on <= .01) continue;
		float r=(.22+.2*h.y)*on,aa=px/cell;
		vec2 e=d*rot(h.x*6.); e.x*=.72+.28*h.y; // no two alike
		float l=length(e);
		float body=sfFall(r+aa*.6,r-aa*.6,l)*min(1.,r/(aa*.6));
		vec2 sd=d+L*r;
		float sh=sfFall(r*1.5+aa,r*.4,length(vec2(dot(sd,L)*.6,dot(sd,vec2(-L.y,L.x)))))*on;
		col*=1.-.6*sh;
		float lam=sat(.45+.6*dot(d,L)/max(r,.02));
		vec3 skin=mix(vec3(.82,.7,.5),vec3(.95,.9,.8),h2<.7?h.y:1.);
		skin*=h.x<.06?.3:.75+.35*h.x;
		if (uOwn[2] != .0) skin=mix(skin,sfSand(h2)*(.7+.5*h.y)*(uOwn[2]>.0?.75:2.),.9*abs(uOwn[2]));
		col=mix(col,skin*lit*(.22+1.5*lam*lam),body);
	}
}
// Grains a hit throws up at the middle of the plate: how much of one covers q.
float sfHop(vec2 q,float px) {
	const float cell=.034;
	vec2 g=q/cell,b=floor(g-.5);
	float most=.0;
	for (int k=0; k<4; k++) {
		vec2 id=b+vec2(float(k & 1),float(k >> 1)),h=hash22(id+71.);
		vec2 c=(id+.5+(h-.5)*.6)*cell;
		float r=cell*(.07+.12*h.y)*sfFall(.5,.12,length(c))*sst(.25,.45,h.x);
		most=max(most,sfFall(r+px*.6,r-px*.6,length(q-c))*min(1.,r/(px*.6)));
	}
	return most;
}
vec3 sfBrass(vec2 p) {
	sfF=1.65;
	float D=3.1+.2*uSpace;
	float top_=max(uOwn[5],.0),low=max(-uOwn[5],.0),pale=max(uOwn[2],.0),dye=max(-uOwn[2],.0),glow=max(-uOwn[4],.0),big=uOwn[3]>.0?exp2(1.7*uOwn[3]):1.,knob=1.+min(uOwn[1],.0);
	vec3 ro=sfEye(p-vec2(.03,.03),D,.8,.6);
	if (uOwn[5] != .0) { float a=mix(.9273,uOwn[5]>.0?1.5:.36,abs(uOwn[5])); D=mix(D,uOwn[5]>.0?3.75:2.1,abs(uOwn[5])); ro=sfEye(p-mix(vec2(.03),vec2(.0,-.08*low),abs(uOwn[5])),D,sin(a),cos(a)); }
	vec3 rd=sfRd;
	mat2 yaw=rot(.5); if (top_>.0) yaw=rot(.5*(1.-top_));
	float t=ro.z/-rd.z;
	vec2 q=yaw*(ro+rd*t).xy,par=yaw*(rd.xy/-rd.z); // par: how far q slides for a unit of height
	float px=1.15*t/uRes.y;
	vec2 L=yaw*rot(.12*sin(uTime*.021))*vec2(-.86,.5); // the low lamp to the left, swaying over minutes
	float e=sfDrive()*(1.-.7*sfLoose());
	vec3 col,warm=vec3(1.,.86,.68);
	// each kind's lamp stands low at one side
	vec3 k0=sfInk(uKind[0])*(uDrone+.6*uCue),k1=sfInk(uKind[1])*(uPad+.6*uCue),k2=sfInk(uKind[2])*(uTexture+.6*uCue),k3=sfInk(uKind[3])*(uPhrase+.4*uKeys+.6*uCue);
	vec4 near=exp(-3.2*max(vec4(1.+q.y,1.+q.x,1.-q.x,1.-q.y),.0));
	vec3 rim=k0*near.x+k1*near.y+k2*near.z+k3*near.w;
	float edge=sfSide(q,.03);
	vec2 la=q-L*.85;
	float pool=(1.75+.5*uCue)*exp(-dot(la,la)*mix(.35,.75,uTone))+.12;
	if (uOwn[4]>.0) pool=mix(pool,1.+.25*exp(-dot(la,la)*.4),uOwn[4]);
	pool*=1.-.88*glow; warm=mix(warm,vec3(1.),pale);
	if (edge>-px) {
		// the bench under it: black stone, the plate's shadow, spilt grains
		vec2 b=q+par*.5,lb=b-L*1.7;
		float under=sst(-.15,.22,sfSide(b+L*.75,.1));
		float lp=exp(-dot(lb,lb)*.28)*under;
		col=vec3(.005,.0043,.004)*(.7+.6*fbm(b*3.))*(.12+2.6*lp);
		if (pale>.0) col=mix(col,mix(vec3(.75,.72,.67),sfInk(uKind[0]),.3)*(.28+.5*lp)*(.5+.5*under)*(.94+.1*fbm(b*5.))*(1.-.8*glow),pale);
		if (dye>.0) col+=dye*sfInk(uKind[0])*.035*(.15+lp)*(1.-.6*glow);
		sfGrains(b,.016*big,41.,vec3(.0),1.,.0,.11*exp(-max(sfSide(b,.1),.0)*4.),L,px,warm*(.04+1.1*lp),col);
		// the plate's thickness on its near sides
		float side=sfFall(px,-px,sfSide(q+par*.045,.03));
		vec2 ql=q+par*.02;
		vec3 kc=abs(ql.x)>abs(ql.y)?(ql.x>.0?k2:k1):(ql.y>.0?k3:k0);
		col=mix(col,vec3(.05,.032,.012)*(.4+pool)+kc*.22,side);
	}
	if (edge<px) {
		vec3 u=sfPlate(q);
		vec3 pc=sfInk(piece(vec2(q.x,-q.y)*.49+.5).rgb);
		float r=length(q),swing=u.x*u.x/(1.+.6*u.x*u.x)*sst(.1,.4,r);
		// dark polished brass: a window's light lies along the fine scratches
		float scr=noise(vec2(q.x*4.,q.y*160.))+noise(vec2(q.x*9.+3.,q.y*390.))-1.;
		vec2 R=yaw*normalize(vec3(rd.xy,-rd.z)).xy+vec2(.5,-.36);
		float gloss=exp(-R.x*R.x*9.-R.y*R.y*22.);
		float cloud=fbm(q*2.3+9.);
		vec3 plate=vec3(.4,.25,.085)*(.005+.016*pool*pool+.8*gloss*cloud)*(1.+.3*scr);
		plate+=vec3(.42,.28,.11)*sfFall(.35,.0,abs(R.x*.6+R.y-.02))*sfFall(.8,-.2,R.x)*.17*(.7+.5*cloud)*(1.+.3*scr);
		plate+=vec3(.5,.36,.2)*rim*(.07+.04*scr);
		// where the plate swings it takes the colour of what sounds there; a hit sends a ring of light out through it
		float ring=r-1.25*(1.-uHits);
		plate+=(pc*(.02+.055*uEnergy)+vec3(.5,.35,.16)*.08*(uMic+uLevel*.2))*swing;
		plate+=(sfInk(uKind[4])+.15)*uHits*exp(-ring*ring*30.)*(.1+.12*swing);
		plate+=vec3(.4,.27,.12)*.22*max(uOwn[4],.0)*(.8+.4*cloud)*(1.+.2*scr);
		if (pale>.0) plate=mix(plate,mix(vec3(.95,.92,.86),.2+.8*uKind[0],.25)*(.3+.5*pool)*(.96+.05*scr+.04*cloud)*mix(vec3(1.),.45+.75*uKind[4],uHits*exp(-ring*ring*7.))*(1.-.35*min(swing,1.)*(1.-mix(uKind[0],pc,sat(pc.r+pc.g+pc.b)))),pale);
		if (dye>.0) plate=mix(plate,uKind[0]*uKind[0]*(.05+.2*pool+.3*gloss)*(.9+.2*cloud)+pc*(.04+.1*uEnergy)*swing,dye);
		float sig=mix(.8,.14,pow(e,.6))*(.4+.6*sst(.0,7.,length(u.yz))),amount=mix(.34,1.02,e),loose=.17*(1.-.85*e)+.02*uTexture;
		if (uOwn[7] != .0) { sig*=exp2(uOwn[7]*(uOwn[7]>.0?1.1:.9)); loose=max(loose+.07*uOwn[7],.0); amount*=1.+.25*min(uOwn[7],.0); }
		float hold=sst(.12*knob-.1*(1.-knob),.2*knob-.02*(1.-knob),r)*sfFall(.0,-.03,edge);
		amount*=hold; loose*=hold;
		// the heap: shaded as a low ridge, with its soft shadow
		float line=exp(-u.x*u.x/(sig*sig))*amount;
		float um=u.x+dot(u.yz,L)*.035;
		float thrown=exp(-um*um/(sig*sig))*amount;
		float ridge=sat(.62+.04*u.x*dot(u.yz,L)/(sig*sig)*line);
		vec3 lit=warm*pool*(.25+1.7*ridge)+rim*.9;
		lit+=(sfInk(uKind[4])+.3)*uHits*1.2*exp(-r*r*9.);
		vec3 hue=vec3(.0);
		if (glow>.0) { // the sand gives the light itself
			hue=mix(sfSand(.5+.5*sin(q.x*2.+q.y*1.3)),pc*1.6,sat(2.*dot(pc,vec3(.4))));
			lit+=glow*(.35+1.5*hue+.5*e); float far=u.x/(sig*2.5+.12);
			plate*=1.-.7*glow; far*=1.6;
			plate+=glow*hue*(.06+.35*e)*exp(-far*far)*hold;
		}
		col=plate*(1.-.8*(1.-.45*pale)*(1.-glow)*sst(.3,.9,thrown));
		vec3 heap=vec3(.8,.68,.5); if (uOwn[2] != .0) heap=mix(heap,sfSand(.4)*(uOwn[2]>.0?.7:1.7),abs(uOwn[2]));
		if (glow>.0) heap=mix(heap,.3+hue,.7*glow);
		col=mix(col,heap*lit*.6,sst(.5,.95,line));
		mat2 m1=rot(.6),m2=rot(1.9);
		vec3 top=col;
		if (uOwn[3]>-.99) {
		sfGrains(q,.0105*big,3.,u,sig,amount,loose,L,px,lit,top);
		sfGrains(m1*q,.015*big,9.,vec3(u.x,m1*u.yz),sig,amount*.9,loose*.8,m1*L,px,lit,top);
		sfGrains(m2*q,.0082*big,17.,vec3(u.x,m2*u.yz),sig,amount,loose*.7,m2*L,px,lit,top);
		}
		if (uOwn[3]<.0) { // the same swing, drawn as a map is
			float y=u.x*1.7,gr=length(u.yz)*1.7,wd=px*.4+.0012+.002*e,f=abs(fract(y)-.5)/max(gr,2.),main=abs(u.x)/max(gr/1.7,1.2);
			float ln=max(sfFall(wd+px,wd-px*.5,f)*.6*sfFall(90.,40.,gr),sfFall(1.9*wd+px,1.9*wd-px,main))*sfFall(.0,-.03,edge)*(.35+.65*e);
			vec3 ink=uOwn[2]>.0?mix(heap*lit*.6,sfSand(.5)*.35,pale):heap*lit*.9;
			vec3 map=mix(plate*(1.+.5*u.x/(1.+abs(u.x))*(1.-.6*pale)),ink+pc*.4*(1.-pale),ln);
			top=mix(top,map,-uOwn[3]);
		}
		// a hit: grains leap near the middle
		if (uHits>.01 && r<.75) {
			float z=4.*uHits*(1.-uHits)*.16;
			top*=1.-.6*min(1.,uHits*3.)*sfHop(q+L*z*1.4,px*2.);
			top=mix(top,(warm*1.2+sfInk(uKind[4]))*(.4+pool),min(1.,uHits*3.)*sfHop(q-par*z,px));
		}
		// the bevel, catching the lamp
		float bev=sst(-.014-px,-.014+px,edge);
		vec2 out2=abs(q.x)>abs(q.y)?vec2(sign(q.x),.0):vec2(.0,sign(q.y));
		if (uOwn[1]>.0) out2=mix(out2,q/max(r,1e-3),uOwn[1]);
		vec3 brass=mix(mix(vec3(.5,.33,.13),uKind[0]*.6,.7*dye),vec3(.8,.78,.74),.8*pale);
		top=mix(top,brass*(.02+.35*pale+.9*pool*sat(dot(out2,L)+.15))+rim*.4,bev*.85);
		if (knob>.02) {
		vec3 bare=top;
		// the clamp at the middle: its shadow, a felt ring, a turned brass knob
		float cs=sfFall(.05,-.02,sfSeg(q,-L*.42)-.06)*sfFall(.6,.1,r);
		top*=1.-.85*cs;
		top=mix(top,vec3(.05,.008,.008)*(.3+pool),sfFall(px,-px,r-.098*knob));
		vec2 cap=par*.13;
		float wall=sfSeg(q,cap)-.062;
		float across=dot(q,vec2(-cap.y,cap.x))/max(length(cap),1e-3)/.062;
		vec3 metal=mix(vec3(.42,.27,.1),vec3(.3),max(pale,.6*dye))*(.03+.5*sfG((across*sign(dot(L,vec2(-cap.y,cap.x)))-.5)*3.7))*(.8+.2*sin(across*40.));
		top=mix(top,metal+rim,sfFall(px,-px,wall));
		vec2 tq=q-cap; float tr=length(tq);
		float fan=pow(abs(dot(tq,L))/max(tr,1e-3),6.);
		vec3 disc=mix(vec3(.5,.33,.13),vec3(.4),max(pale,.6*dye))*(.06+.75*fan*pool)*(.9+.1*sin(tr*900.))+(sfInk(uKind[4])*uHits+sfInk(uKind[3])*uKeys*.6)*.3;
		top=mix(top,disc,sfFall(px,-px,tr-.062));
		top+=warm*.5*pool*sfFall(px*1.5,.0,abs(tr-.058))*sat(dot(tq,L)*16.);
		top=mix(bare,top,sst(.0,.5,knob));
		}
		col=edge>-px?mix(col,top,sfFall(px,-px,edge)):top;
	}
	return screenOf(col*1.7);
}
// The rig over the water: a hoop of lamps hung round the place the eye sees mirrored, each kind with its arc, and a soft light
// inside it. k is how far off that place a ray goes.
vec3 sfRig(vec2 k,float blur) {
	float l=length(k),wd=mix(.04,.018,uTone),w=(l-.3)/(wd+blur);
	vec2 d=k/max(l,1e-3);
	vec4 arc=sat(vec4(-d.y,-d.x,d.x,d.y)); arc*=arc*arc;
	vec3 tint=sfInk(uKind[0])*arc.x*uDrone+sfInk(uKind[1])*arc.y*uPad+sfInk(uKind[2])*arc.z*uTexture+sfInk(uKind[3])*arc.w*(uPhrase+.5*uKeys);
	vec3 c=(vec3(.85,.89,.94)*(.25+.95*sat(.5-.6*d.x+.3*d.y))+1.5*tint)*exp(-w*w)*wd/(wd+blur);
	vec2 win=k-vec2(-.2,.17);
	c+=vec3(1.,.97,.9)*(.5+.6*uHigh)*exp(-dot(win,win)*1100.);
	return c+vec3(.05,.06,.075)*exp(-l*l*500.);
}
// The standing waves on the water at q: g its slope, H its bend (xx, yy, xy), all for waves of one step each.
void sfDish(vec2 q,out vec2 g,out vec3 H) {
	float K[3]=float[3](24.,31.,40.),fine=uOwn[0] == .0?1.:exp2(uOwn[0]*(uOwn[0]>.0?.8:1.3));
	float r=length(q); vec2 q0=q; sfHt=.0;
	if (uOwn[6]<.0) q=sfBent(q);
	g=vec2(.0); H=vec3(.0);
	float ww=.0;
	for (int s=0; s<3; s++) {
		float fs=float(s),a=.5+.5*sin(sfGo+fs*TAU/3.+1.5+.5*sin(sfGo*.37+fs*2.));
		float w=(.04+a*a*a)*(.5+.9*uBands[s*5+1]);
		float k=K[s]*fine,kn=k/36.;
		ww+=w*w*6.;
		for (int j=0; j<6; j++) {
			float th=PI*(float(j)+(s == 1?.5:.0))/6.+.2;
			vec2 d=vec2(cos(th),sin(th));
			float o=(j & 1) == 0?w:-w,x=k*dot(d,q),c=o*cos(x); // one up, the next down: petals
			g -= o*sin(x)*d;
			sfHt+=c;
			H -= c*kn*vec3(d.x*d.x,d.y*d.y,d.x*d.y);
		}
	}
	float m=1./sqrt(ww*.35+.02)/(.85+.4*r);
	sfHt*=m;
	// rings that the wall sends back
	vec2 o=q/max(r,1e-3);
	float y=44.*(1.-r),we=.8*exp(-(1.-r)*7.);
	if (uOwn[1]<.0) we*=1.+uOwn[1];
	if (uOwn[6]>.0) { // rings, with a few spokes in them
		float w=uOwn[6],k=24.*fine,th=r>1e-3?atan(q0.y,q0.x):.0,a=.5+.5*sin(sfGo*1.3),fade=sst(.08,.5,r),sp=1.-.25*a*fade*(1.-cos(12.*th)),x=k*r;
		vec2 ox=vec2(-o.y,o.x);
		g=mix(g,(sin(x)*sp*o+fade*.1*a*12.*sin(12.*th)*cos(x)/(k*r+1.)*ox)*-1.2,w);
		H=mix(H,-1.2*k/36.*cos(x)*sp*vec3(o.x*o.x,o.y*o.y,o.x*o.y),w); sfHt=mix(sfHt,1.2*cos(x)*sp,w); m=mix(m,1.,w);
	}
	g=g*m+we*sin(y)*o;
	H=H*m-we*cos(y)*vec3(o.x*o.x,o.y*o.y,o.x*o.y);
}
vec3 sfWater(vec2 p) {
	sfF=1.65;
	float D=2.55+.15*uSpace;
	vec3 ro=sfEye(p-vec2(.2,-.02),D,.82,.572);
	float pale=max(uOwn[2],.0),dye=max(-uOwn[2],.0),glow=max(-uOwn[4],.0),day=max(uOwn[4],.0);
	if (uOwn[5] != .0) { float w=abs(uOwn[5]),a=mix(.9616,uOwn[5]>.0?1.5:.34,w); D=mix(D,uOwn[5]>.0?3.45:1.9,w); ro=sfEye(p-mix(vec2(.2,-.02),vec2(.0,uOwn[5]>.0?.0:-.1),w),D,sin(a),cos(a)); }
	vec3 rd=sfRd,v=normalize(rd);
	float t=ro.z/-rd.z;
	vec2 q=(ro+rd*t).xy;
	float px=1.15*t/uRes.y,r=length(q),drop=max(uOwn[3],.0),cell=.085; vec2 id=vec2(.0),qc=q,ql=vec2(.0);
	if (uOwn[1]>.0) { vec2 a=q*q; a*=a; r=mix(r,sqrt(sqrt(a.x+a.y+1e-9))*1.02,uOwn[1]); }
	r*=1.+.9*min(uOwn[1],.0);
	if (drop>.0) { // a field of drops, each showing what its middle shows
		vec2 sk=floor(vec2(q.x-q.y*.57735,q.y*1.1547)/cell); float most=1e6;
		for (int k=0; k<4; k++) { vec2 f=sk+vec2(float(k & 1),float(k >> 1)),c=vec2(f.x+.5*f.y,f.y*.866025)*cell; float d=dot(q-c,q-c); if (d<most) { most=d; qc=c; id=f; } }
		ql=(q-qc)/cell; qc=mix(q,qc,drop);
	}
	vec2 o=q/max(r,1e-3),L=vec2(-.8,.6);
	vec2 la=q-L*.55;
	float pool=.1+(2.+.5*uCue)*exp(-dot(la,la)*1.5);
	pool=mix(pool,1.2,.8*day)*(1.-.75*glow);
	vec3 col=vec3(.0009,.001,.0013)*(1.+4.*pool*exp(-max(r-1.,.0)*4.));
	if (pale>.0) col=mix(col,mix(vec3(.62,.6,.57),sfInk(uKind[0]),.6)*(.35+.3*pool)*(.5+.5*sst(1.,1.35,r+.12*dot(q,L)/max(length(q),1e-3)))*(1.-.7*glow),pale);
	if (dye>.0) col+=dye*sfInk(uKind[0])*.02*(.3+pool);
	if (r<1.+px) {
		vec2 g; vec3 H;
		sfDish(qc,g,H);
		float amp=sfDrive()*(1.-.85*sfLoose());
		float A=.019+.095*amp; if (uOwn[7] != .0) A*=exp2(uOwn[7]*(uOwn[7]>.0?.8:1.6));
		A*=1.+.3*pale;
		float ring=r-1.1*(1.-uHits);
		vec2 kick=o*uHits*.3*exp(-ring*ring*90.)*cos(ring*45.);
		vec2 kf=v.xy/-v.z;
		vec4 pc=piece(qc*vec2(.49,-.49)+.5);
		vec3 wat=vec3(.0);
		float blur=px*mix(1.,2.4/max(-v.z,.06),max(-uOwn[5],.0))*(72.*A*sqrt(H.x*H.x+H.y*H.y+2.*H.z*H.z)+27.*uHits*exp(-ring*ring*90.));
		// the water swings too fast to see: what is seen is its two ends, one over the other
		for (int s=0; s<2; s++) {
			vec2 sl=g*(s == 0?A:-A)+kick;
			vec3 R=reflect(v,normalize(vec3(-sl,1.)));
			wat+=sfRig(R.xy/max(R.z,.2)-kf,blur)*.5*(1.-.6*glow);
			if (day>.0) wat+=day*mix(vec3(.12,.16,.2),vec3(.75,.72,.66),sst(-.5,.7,dot(R.xy-v.xy,L)*2.+R.y*.4))*.13;
			// and the light it gathers on the floor of the dish
			float f=(s == 0?4.5:-4.5)*A;
			float ca=1./(abs(1.+f*(H.x+H.y)+f*f*(H.x*H.y-H.z*H.z))+(uOwn[5]<.0?.2+60.*-uOwn[5]*A*px/max(-v.z,.06):.2)); // far off it is softer than a pixel's step
			wat+=(vec3(.008,.01,.013)+.09*sfInk(pc.rgb)*(.4+.7*uEnergy))*max(ca*ca-.75,.0)*(.5+.5*uMic);
		}
		if (glow>.0) wat+=glow*(pc.rgb*.9+sfInk(uKind[1])*.12*amp)*sst(.1,1.1,abs(sfHt))*3.;
		if (dye>.0) wat=mix(wat,wat*mix(vec3(1.),uKind[0]*uKind[0]*2.2,.85)+sfInk(uKind[0])*.03+pc.rgb*.05,dye);
		wat*=pool*1.1*(1.+1.6*uHits*exp(-ring*ring*9.));
		wat*=1.-exp(-r*r*40.)*(1.+min(uOwn[1],.0))*sat(.6-3.*dot(q,L)); // the still middle leans from the lamp
		wat=wat*wat/(wat+.03);
		if (pale>.0) { // milk: lit through, shaded by its slope, the colours lying in its hollows
			vec2 sl=g*A+kick; float lam=.62+2.2*dot(sl,L)/(.35+length(sl))*.35+.1*sfHt*A*8.;
			vec3 milk=mix(vec3(.95,.93,.89),sfInk(uKind[1]),.25)*max(lam,.05)*(.45+.45*pool);
			vec3 kc=mix(uKind[2],pc.rgb/max(pc.a,.2),sat(pc.a*2.));
			milk=mix(milk,milk*(.12+1.15*kc*kc),sst(-.5,1.4,-sfHt)*(.45+.55*amp));
			milk=mix(milk,milk*(.3+.9*uKind[4]),sat(uHits*1.2*exp(-ring*ring*16.)));
			milk+=.6*pow(sat(1.-length(sl-vec2(-.12,.09))*5.),3.);
			wat=mix(wat,milk,pale);
		}
		if (uOwn[3]<.0) { // drawn in lines of one height
			float y=sfHt*2.2,w=px*70.*(uOwn[0] == .0?1.:exp2(uOwn[0]*(uOwn[0]>.0?.8:1.3)))*(length(g)+.05)+1e-4,ln=sfFall(1.7,.4,abs(fract(y)-.5)/w)*sfFall(.7,.25,w)*(.25+.75*amp);
			vec3 ink=mix((.35+.5*sfInk(uKind[1])+1.2*pc.rgb)*(.25+.6*pool),sfInk(uKind[1])*.2,pale);
			vec3 ground=mix(wat*.06,mix(vec3(.9,.87,.8),sfInk(uKind[0]),.2)*(.5+.3*pool),pale);
			wat=mix(wat,mix(ground+dye*sfInk(uKind[0])*.06,ink,ln),-uOwn[3]);
		}
		if (drop>.0) {
			float rd2=.1+.32*sat(.15+1.5*abs(sfHt)*(.3+.7*amp)); ql -= (hash22(id+5.)-.5)*1.4*(.48-rd2); float l=length(ql),z=sqrt(sat(1.-l*l/(rd2*rd2))); vec3 n=vec3(ql/rd2,z);
			vec3 bead=wat*(.4+.8*z)+(.25+wat)*(pow(sat(dot(n,vec3(-.5,.4,.77))),24.)*(.3+.5*pool)+.12*(1.-z)*sat(dot(n.xy,vec2(.7,-.6))));
			wat=mix(wat,mix(mix(wat*.04,mix(vec3(.9,.87,.82),sfInk(uKind[0]),.3)*(.5+.3*pool)*(1.-.4*sfFall(rd2*1.5,rd2*.6,length(ql+L*.12))),pale),bead,sfFall(rd2+px/cell,rd2-px/cell,l)),drop);
		}
		wat+=(sfInk(uKind[4])+.2)*uHits*(.07*exp(-ring*ring*140.)+.3*exp(-ring*ring*900.))*sfFall(1.,.75,r);
		col=mix(col,wat,sfFall(1.+px,1.-px,r));
	}
	// the hoop that holds the skin: brass, with a bright line where the lamp lies along it
	float hp=(r-1.035)/.035;
	float sp=sat(dot(o,L)),sp2=sat(dot(o,vec2(.75,-.66)));
	vec3 hoop=vec3(.9,.6,.26)*(.006+.1*pow(sp,3.)*sfG((hp-.35)*2.6)+1.4*pow(sp,10.)*sfG((hp+.4)*7.)+.12*pow(sp2,14.)*sfG((hp-.5)*6.));
	vec4 side=sat(vec4(-o.y,-o.x,o.x,o.y));
	hoop+=(sfInk(uKind[0])*side.x*(uDrone+uCue)+sfInk(uKind[1])*side.y*(uPad+uCue)+sfInk(uKind[2])*side.z*(uTexture+uCue)+sfInk(uKind[3])*side.w*(uPhrase+uKeys+uCue))*.16*sfG((hp+.15)*3.2);
	col=mix(col,hoop,sfFall(1.+px/.035,1.-px/.035,abs(hp)));
	return screenOf(col*1.7);
}
vec3 render(vec2 p) {
	sfGo=uTime*.016+uTravel*.022;
	return uVar<.5?sfBrass(p):sfWater(p);
}
