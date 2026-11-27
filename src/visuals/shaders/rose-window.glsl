// name: Rose window
// a: Rose
// b: Tall lights
// what: A great round window of coloured glass seen from the aisle, deep in carved stone and half behind a dark pier, hundreds of small pieces held in lead with daylight moving behind; or five tall lights in the end wall of a dark room, their colours thrown long and soft across the floor and up the side wall.
// follows: Each kind of sound lights its petals, or its tall light; low to high the bands glow from the middle out, or from the sill up; each piece brightens with its own place in the piece. A hit runs out along one petal, or down one light; a cue lets the full sun through one wedge, or one light. The sun shifts with the loop; keys and voice light the roundels' eyes.
// own: 0 the eye: 1 straight before the window, -1 close under it and steeply aside (b: high up and far back, over the floor); 1 a: 1 many narrow petals, -1 a few broad ones (b: slender slits, short broad lights); 2 the glass: 1 fine crumbs, -1 great slabs in thick lead; 3 1 all of it dyed in the sounds' colours, -1 pale clear glass; 4 the room: 1 limewashed and full of day, -1 stone in the warm light of lamps; 5 1 a ruin, the glass fallen and sky in the holes, -1 leaves hang behind it; 6 the stone: 1 thin, glass nearly everywhere, -1 thick with small openings; 7 the openings: 1 rounds, -1 points (b: lozenges)
#define sst smoothstep
// A soft step that may also run downward.
float rwStep(float a,float b,float x) { x=sat((x-a)/(b-a)); return x*x*(3.-2.*x); }
float rwNp=10.,rwSa=TAU/10.; // how many petals the rose has, and one of them
float rwKindAt[5],rwGain;     // how loud each kind is (the hit apart), how strongly the glass answers
vec3 rwPot[5];                 // each kind's colour as glass
// The piece at hand: how far in from its lead, its number, place and colour.
float rwLead,rwId; vec2 rwSite; vec3 rwTint;

vec3 rwBlue=vec3(.012,.055,.42),rwRuby=vec3(.46,.008,.02),rwHorn=vec3(.66,.66,.5),rwGold=vec3(.72,.33,.03),rwCool=vec3(.0064,.0056,.0054);
float rwFall,rwHang,rwOut=.0,twHalf=.165,twRo=.118,rwFine=1.;

void rwSetUp() {
	rwKindAt=float[5](uDrone,uPad,uTexture,uPhrase,.0);
	for (int k=0; k<5; k++) {
		vec3 c=uKind[k]; c /= max(max(c.r,max(c.g,c.b)),.05); c*=c*c;
		rwPot[k]=c*.42/(.4+.75*dot(c,vec3(.3,.5,.2)));
	}
	rwGain=.6+.9*uEnergy;
	rwFall=max(uOwn[5],.0); rwHang=max(-uOwn[5],.0);
	if (uOwn[1] != .0) { rwNp=floor(10.5+uOwn[1]*(uOwn[1]>.0?8.:4.)); rwSa=TAU/rwNp; twHalf*=exp2(uOwn[1]>.0?-1.2*uOwn[1]:-.4*uOwn[1]); }
	if (uOwn[2] != .0) rwFine=exp2(uOwn[2]*.7);
	if (uOwn[1] != .0 || uOwn[2] != .0) twRo*=min(1.+min(uOwn[2],.0),twHalf/.14);
	if (uOwn[3]>.0) { rwBlue=mix(rwBlue,rwPot[0]*.6,uOwn[3]); rwRuby=mix(rwRuby,rwPot[1],uOwn[3]); rwHorn=mix(rwHorn,.2+1.1*rwPot[3],uOwn[3]); rwGold=mix(rwGold,rwPot[4]*1.4,uOwn[3]); }
	if (uOwn[3]<.0) {
		float w=-.9*uOwn[3]; rwBlue=mix(rwBlue,vec3(.42,.5,.54),w); rwRuby=mix(rwRuby,vec3(.6,.55,.46),w); rwGold=mix(rwGold,vec3(.7,.56,.34),w);
		for (int k=0; k<5; k++) rwPot[k]=mix(rwPot[k],.34+.35*rwPot[k],w);
	}
	if (uOwn[4]>.0) rwCool=mix(rwCool*exp2(6.*uOwn[4]),vec3(.46,.43,.38),.6*uOwn[4]);
	if (uOwn[4]<.0) rwCool=mix(rwCool,vec3(.1,.046,.017),-uOwn[4]);
}
// Glass cut freely: how far in from the lead, and its middle.
void rwCut(vec2 p,float sc) {
	if (uOwn[2] != .0) sc*=exp2(uOwn[2]);
	vec2 q=p*sc,g=floor(q-.5),f=q-g,b1=vec2(.0),b2=vec2(9.);
	float d1=9.,d2=9.;
	for (int j=0; j<4; j++) {
		vec2 o=vec2(j & 1,j >> 1),c=o+.5+.62*(hash22(g+o)-.5)-f;
		float d=dot(c,c);
		if (d<d1) { d2=d1; b2=b1; d1=d; b1=c; } else if (d<d2) { d2=d; b2=c; }
	}
	rwLead=(d2-d1)/(2.*max(length(b2-b1),.05))/sc;
	rwSite=(q+b1)/sc;
	rwId=hash21(floor(q+b1)+3.7);
}
// A roundel: an eye (0), n pieces about it (1), a ring of pearls (2).
float rwRoundel(vec2 l,float big,float n,float seed) {
	float r=length(l)/big,ring=step(.32,r)+step(.82,r);
	float s=TAU/(ring>1.5?3.*n:n),a=atan(l.y,l.x+1e-5)+seed,i=floor(a/s),f=a-(i+.5)*s;
	rwLead=min(min(abs(r-.32),abs(r-.82)),1.-r)*big;
	if (ring>.5) rwLead=min(rwLead,r*big*sin(.5*s-abs(f)));
	rwId=fract(hash11(seed+ring*(i+2.3))*7.3);
	return ring;
}
vec3 rwParts(float ring,vec3 eye,vec3 body) { return ring<.5?eye:ring>1.5?rwHorn*.5:body; }
float rwTurned(float lv) { return .9*rwStep(.0,.2,lv-rwId); } // pieces that have taken their kind's colour
// Leaves that hang behind the glass: how much light they let by.
float rwLeaves(vec2 p) {
	float v=1.;
	for (int k=0; k<2; k++) {
		float f=float(k); vec2 u=rot(.5+f)*(p+.015*sin(uTime*vec2(.31,.23)+p.yx*2.+f))*(6.-2.2*f)+f*9.,id=floor(u); float n=hash21(id+50.);
		vec2 l=rot(n*40.)*(u-id-.5); l.x+=l.y*l.y*.5;
		v*=1.-.85*step(n,.7)*rwStep(.3,-.3,abs(l.y)/(.2+.1*fract(n*7.))+l.x*l.x*5.5+l.x*.5-1.);
	}
	return mix(1.,v*mix(.4,1.,rwStep(.8,.4,noise(p*2.1+5.))),rwHang);
}
// Where a piece has fallen out there is the sky.
vec3 rwGone(vec3 g,vec2 p) {
	if (rwHang>.0) { float v=rwLeaves(p); g*=mix(vec3(.35,.6,.25)*.6*v,vec3(1.),v); }
	if (rwFall <= .0) return g;
	vec3 sky=mix(mix(vec3(.16,.3,.46),rwPot[0],.4),vec3(1.,.95,.88),rwStep(.36,.62,.15*p.y+fbm(p*vec2(1.5,2.6)+vec2(uTime*.012,.0))));
	rwOut=rwStep(.0,.06,rwFall*.95-.35*noise(p*4.)-.6*fract(rwId*17.3)+.1);
	return mix(g,sky*.7*(.8+.6*uLevel),rwOut); //0.0, 0.06, rwFall * 0.95 - 0.35 * noise(p * 4.0) - 0.6 * fract(rwId * 17.3) + 0.1));
}
// What is in the glass: streaks, seeds, thick and thin, dirt along the lead.
vec3 rwPotMetal(vec2 p,float px) {
	vec2 u=rot(rwId*40.)*p;
	float st=noise(u*vec2(130.,17.)+rwId*50.),wd=noise(u*vec2(34.,26.)+rwId*20.);
	u*=vec2(85.,60.); float sh=hash21(floor(u)+rwId),own=fract(rwId*13.7);
	float seed=rwStep(.3,.12,length(fract(u)-.35-.3*vec2(sh,fract(sh*37.))))*step(.8,sh)*sat(1.6-px*400.);
	vec3 c=pow(rwTint+.004,vec3(1.4-.7*wd-.5*st+.5*rwId))*(.4+1.25*own*own)*(1.+.5*seed);
	c=mix(c,c.grb,.16*fract(rwId*31.));
	return c*mix(.3,1.,rwStep(.0,.012,rwLead+.004*(wd-.5)));
}

// ---- a: the rose ----
float rwWd; // how much wider the openings are
// The openings: how far outside the nearest, and which (0 eye, 1 petal, 2 between petals, 3 outer rounds, 4 rim).
vec2 rwPolar(vec2 ra,float n,float off) { float s=TAU/n,a=mod(ra.y+off+.5*s,s)-.5*s; return ra.x*vec2(cos(a),sin(a)); }
vec2 rwOpen(vec2 p) {
	float r=length(p); vec2 ra=vec2(r,atan(p.y,p.x+1e-5));
	if (r<.215) { vec2 e=rwPolar(ra,5.,.3); return vec2(min(length(e-vec2(.108,.0))-.068,r-.095)-rwWd,.0); }
	if (r<.714) {
		vec2 q=rwPolar(ra,rwNp,.0); q.y=abs(q.y);
		float wide=10./rwNp; if (uOwn[1]<.0) wide=min(wide,1.35);
		float side=q.x*sin(.5*rwSa)-q.y*cos(.5*rwSa);
		float pet=max(max(.014-side,.232-r),q.x-.5);
		pet=min(pet,min(length(q-vec2(.562,.0))-.094*wide,length(q-vec2(.495,.06*wide))-.084*wide));
		if (uOwn[7]>.0) pet=mix(pet,min(min(length(q-vec2(.3,.0))-.052*wide,length(q-vec2(.425,.0))-.066*min(wide,1.1)),length(q-vec2(.588,.0))-.09*min(wide,1.2)),uOwn[7]);
		if (uOwn[7]<.0) pet=mix(pet,max(length(q-vec2(.46,.085*wide-.246))-.246,.24-r)*.9,-uOwn[7]);
		vec2 s=rwPolar(ra,rwNp,.5*rwSa);
		float sp=length(s-vec2(.645,.0))-.059*min(wide,1.15);
		if (uOwn[7]<.0) sp=mix(sp,(abs(s.x-.64)*.75+abs(s.y)-.055*wide)*.8,-uOwn[7]);
		sp -= rwWd; pet -= rwWd;
		return sp<pet?vec2(sp,2.):vec2(pet,1.);
	}
	vec2 o=rwPolar(ra,2.*rwNp,.25*rwSa); float small=min(10./rwNp,1.15);
	o=abs(o-vec2(.838,.0)); if (o.y>o.x) o=o.yx;
	float ro=min(length(o-vec2(.056*small,.0))-.058*small,length(o)-.07*small);
	if (uOwn[7]>.0) ro=mix(ro,length(o)-.085*small,uOwn[7]);
	if (uOwn[7]<.0) ro=mix(ro,(o.x+o.y-.115*small)*.7,-uOwn[7]);
	vec2 t=rwPolar(ra,2.*rwNp,.0);
	float ti=length(t-vec2(.96,.0))-.03*small-.6*rwWd; ro -= rwWd;
	return ti<ro?vec2(ti,4.):vec2(ro,3.);
}
// The sun at a place behind the glass, and the sky about it.
float rwDay(vec2 p,vec2 sun,float tight) {
	sun=p-sun;
	return .38+.38*noise(p*1.2+vec2(uTime*.013,3.))+.1*p.y+(.6+1.2*uLevel)*exp(-dot(sun,sun)*tight);
}
float rwRoseDay(vec2 p) { return 1.1*rwDay(p,vec2(.25+.3*sin(TAU*uLoop),.12+.2*cos(TAU*uLoop)),4.); }
// How loud kind k is; far is how near a hit has come, along its one petal or light.
float rwLoud(int k,bool hit,float far) {
	return hit?uHits*(1.5*exp(-far*far*14.)+.5)*(1.+1.5*max(uOwn[4],.0)+1.5*max(-uOwn[0],.0)):rwKindAt[k];
}
float rwPetal(int k,float r) { return rwLoud(k % 5,k == 9 || (uOwn[1]>.0 && k % 5 == 4),r-1.15*(1.-uHits)); }
float rwWedge(float a) { float d=abs(mod(a+2.1-.25*uCue+PI,TAU)-PI); return uCue*rwStep(.62,.3,d); }
// Lead between the pieces, iron between the panels.
vec3 rwLeaded(vec3 g,float iron,float px) {
	float thick=.0021+.005*max(-uOwn[2],.0),lead=max(rwStep(thick+px*.8,thick-px*.8,rwLead),rwStep(.0045+px,.0045-px,iron));
	if (rwFall>.0) lead*=1.-rwOut*rwStep(.2,.5,rwFall-.4*rwId+.1);
	return mix(g,g*.07+.002,lead);
}
// How bright a piece is: its kind, its band, its own place; the eyes also by keys and voice.
float rwLit(float lv,float bandAt,float own,float eye) {
	return .55+.9*max(uOwn[4],.0)+rwGain*(1.5*lv*(.45+.8*rwId)+.9*band(bandAt)*(.3+fract(rwId*3.))+own*(.4+fract(rwId*5.3)))+1.6*(uKeys+uMic)*step(eye,.5);
}
vec3 rwRoseGlass(vec2 p,float px) {
	vec2 o=rwOpen(p),ra=vec2(length(p),atan(p.y,p.x+1e-5));
	float d=-o.x,r=ra.x,petal=mod(floor(ra.y/rwSa+.5)+rwNp,rwNp),odd=mod(floor(o.y<.5?ra.y*8./TAU:ra.y/(.5*rwSa)+1.),2.),ring=1.,lr;
	int kind=int(petal) % 5,w=int(o.y);
	vec3 own=rwPot[kind],body=mix(rwRuby,rwBlue*1.3,odd),eye=rwGold;
	rwSite=p;
	// a roundel in the opening (its place, its size), or free pieces about it
	vec2 m=w == 0?vec2(.0,.09):w == 2?vec2(.645,.06):w == 3?vec2(.838,.06):w == 4?vec2(.96,.09):r>.489?vec2(.556,.066):r>.387?vec2(.438,.051):vec2(.346,.04);
	vec2 l=w == 0?p:rwPolar(ra,w>2?2.*rwNp:rwNp,w == 3?.25*rwSa:w == 2?.5*rwSa:.0)-vec2(m.x,.0);
	if (uOwn[2]<.0) m.y*=1.+uOwn[2];
	if (w == 1) body=mix(rwRuby,own,step(.5,fract(petal*.5+m.x*5.)));
	if (w == 3) eye=mix(own,rwGold,.5);
	lr=length(l);
	if (lr<m.y) { ring=rwRoundel(l,m.y,8.,float(w>0)*petal+m.x*10.); rwTint=rwParts(ring,eye,body); if (w == 1) rwSite=m.x*vec2(cos(petal*rwSa),sin(petal*rwSa)); if (w == 0) { petal=.0; if (ring<.5) rwSite=vec2(.02,.0); else petal=mod(floor(floor(ra.y*8./TAU)*1.25+11.1),10.); } }
	else {
		rwCut(p,32.); rwLead=min(rwLead,lr-m.y);
		rwTint=mix(mix(w == 3?mix(rwBlue*1.2,rwRuby,odd):rwBlue,own*.8,rwTurned(.06+.8*rwKindAt[kind])),rwRuby,step(.86,fract(rwId*9.)));
	}
	if (d<.011) { rwId=.5; rwTint=rwBlue*.6; rwLead=min(d,.011-d); }
	else rwLead=min(rwLead,d-.011);
	rwLead=max(rwLead,.0);
	r=length(rwSite); float a=atan(rwSite.y,rwSite.x+1e-5);
	vec4 s=piece(vec2(fract(a/TAU+.45),.08+.84*sat(r)));
	vec3 g=rwPotMetal(p,px)*(rwLit(rwPetal(int(petal),r),r*.95,s.a,ring)+3.2*rwWedge(a))*rwRoseDay(p)+.1*s.rgb*rwGain*rwTint;
	g=rwGone(g,p);
	return rwLeaded(g,w == 1 && uOwn[7] <= .5?min(abs(ra.x-.392),abs(ra.x-.494)):1.,px);
}
// What glass of kind i throws on stone.
vec3 rwNear(int i,float lv) { return mix(rwBlue*.5,rwPot[i],.45)*(.3+rwGain*lv); }
vec3 rwHalo(float a) { // the rose, by the angle
	float f=mod(a*10./TAU+10.,10.); int i=int(f) % 10,j=(i+1) % 10;
	vec3 h=mix(rwNear(i % 5,rwPetal(i,.9)),rwNear(j % 5,rwPetal(j,.9)),rwStep(.0,1.,fract(f)));
	h=mix(h,dot(h,vec3(.3,.5,.2))*vec3(.75,.85,1.35),.4);
	h*=1.-.6*max(uOwn[4],.0);
	return (h+vec3(.8,.5,.2)*rwWedge(a))*(.5+.5*uLevel);
}
vec3 rwSight(float yaw,float f,vec2 p) { float c=cos(yaw),n=sin(yaw); return vec3(n*f+c*p.x,p.y,n*p.x-c*f); }
float rwStone(vec2 p) { return .72+.35*noise(p*9.)+.22*(noise(p*47.)-.5); }
// A wall or floor laid in courses: blocks a little different, thin joints.
float rwCourse(vec2 p,vec2 sc,float wide) {
	vec2 b=p*sc+.2; float row=floor(b.y); b.x+=.5*mod(row,2.)+.3*hash11(row);
	vec2 f=min(fract(b),1.-fract(b))/sc;
	float lime=1.-.75*max(uOwn[4],.0);
	return rwStone(p)*(.75+.5*mix(.6,hash21(floor(b)+3.),lime))*(1.-.6*lime*sat(.02/(wide+.004))*rwStep(.004+wide,.001,min(f.x,f.y)));
}
vec3 rwRose(vec2 p) {
	// the wall is z = 0, the rose one unit about its middle, the eye low and to the left
	vec3 eye=vec3(-2.2,-1.5,2.6);
	float yaw=.702,fo=2.25; vec2 sh=vec2(-.13,.713);
	if (uOwn[0]>.0) { float w=uOwn[0]; eye=mix(eye,vec3(.0,.0,3.),w); yaw=mix(yaw,.0,w); fo=mix(fo,1.32,w); sh=mix(sh,vec2(.0),w); }
	if (uOwn[0]<.0) { float w=-uOwn[0]; eye=mix(eye,vec3(1.9,-1.75,1.35),w); yaw=mix(yaw,-.75,w); fo=mix(fo,1.75,w); sh=mix(sh,vec2(-.36,1.19),w); }
	rwWd=uOwn[6]*(uOwn[6]>.0?.016:.03);
	vec3 dir=rwSight(.702,2.25,p+vec2(-.13,.713)); if (uOwn[0] != .0) dir=rwSight(yaw,fo,p+sh);
	vec2 sl=dir.xy/-dir.z; // sideways for each step into the wall
	vec2 p0=eye.xy+sl*(eye.z-.2); // where the sight meets the wall
	float px=1.25/uRes.y*eye.z/-dir.z;
	vec3 col=vec3(.0);
	vec2 fill=normalize(vec2(-.8,.5)); // a little light from the far side
	vec2 q=p0+.2*sl;
	vec3 halo=rwHalo(atan(q.y,q.x+1e-5));
	vec3 cool=rwCool*(.8+.5*uLevel);
	if (uOwn[4]<.0) cool*=mix(1.,(1.5*exp(-1.5*(p0.y+1.))*exp(-.35*p0.x*p0.x)+.06),-uOwn[4]);
	// steps of stone going in to the window
	float R[3]=float[3](1.2,1.12,1.045),Z[4]=float[4](.0,.07,.13,.2);
	int hit=-1; bool face=false;
	for (int i=0; i<3; i++) {
		q=p0+sl*Z[i];
		if (length(q)>R[i]) { hit=i; face=true; break; }
		vec2 n=p0+sl*Z[i+1];
		if (length(n)>R[i]) { hit=i; q=n; break; }
	}
	if (hit == 0 && face) {
		float e=length(q)-1.2,st=rwCourse(q,vec2(2.2,4.4),px);
		col=st*(cool*(.5-.2*q.x)*(.4+exp(-e*1.2))+.045*halo*exp(-e*3.5));
	} else if (hit >= 0) {
		float r=length(q);
		if (face) {
			float f=sat((R[hit-1]-r)/(R[hit-1]-R[hit])),tilt=2.*f-1.; // a roll moulding on each step
			col=rwStone(q)*(cool*(.8+1.6*max(dot(q,fill)*-tilt,.0))+halo*(.015+.12*rwStep(.1,1.,tilt)*float(hit)));
			col*=.35+.65*rwStep(.0,.25,f);
		} else {
			r=float(hit+1)/3.;
			col=rwStone(q*vec2(1.,3.))*halo*(.06+.3*r*r)+cool*.4;
		}
	} else {
		// the tracery, and the glass at the back of it
		q=p0+sl*.2;
		vec2 o=rwOpen(q);
		const float deep=.05; float ll=length(sl);
		float edge=rwStep(-px,px,o.x);
		if (edge<1.) {
			// the side of the opening, or the glass
			float t=.0,a=o.x; bool side=false;
			for (int i=0; i<6; i++) { t+=max(-a,.002)/ll; if (t>deep) break; a=rwOpen(q+sl*t).x; if (a>-.001) { side=true; break; } }
			float back=rwOpen(q+sl*deep).x,stone=side && (back<-px || t<.8*deep)?1.:rwStep(-px,px,back);
			t=min(t,deep);
			vec2 h=q+sl*t;
			col=rwRoseGlass(stone>.5?h-sl/ll*.03:q+sl*deep,px);
			t /= deep;
			if (stone>.0) col=mix(col,rwStone(h*3.)*(cool*.5+(.6*halo+.25*col)*(.15+.85*t*t)),stone);
		}
		if (edge>.0) {
			float ch=rwStep(.022,.0,o.x)*sat((o.x-rwOpen(q+.004*fill).x)/.004);
			col=mix(col,rwStone(q*2.)*(cool*(.55+2.2*ch)+halo*(.015+.11*exp(-max(o.x,.0)*70.)*rwStep(.0,.03,abs(length(q)-.714)))),edge);
		}
	}
	// the pier in front: a bundle of shafts, dark, its edges taking colour
	float x=p.x+.23+uOwn[0]*(uOwn[0]>.0?1.4:2.),pw=1.2/uRes.y,rg=rwStep(.016,.008,abs(p.y+.3));
	if (abs(x)<.13) {
		float best=-1.,nx=.0,ax=abs(x),cover=rwStep(.09+pw,.09-pw,ax);
		for (int k=0; k<3; k++) {
			float C=.044*float(k),w=(k == 0?.044:k == 1?.026:.021)+.007*rg,dx=(ax-C)/w,z=w*sqrt(max(1.-dx*dx,.0))-C*.35;
			if (abs(dx)<1. && z>best) { best=z; nx=dx*sign(x); }
			cover=max(cover,rwStep(w+pw,w-pw,ax-C));
		}
		float rim=rwStep(.35,1.,abs(nx))*step(.0,nx*x+.0008)*sat(ax/.1),joint=(.5-abs(fract(p.y*4.3+.1)-.5))/4.3;
		float st=rwStone(vec2(x*6.+nx,p.y*6.))*(1.-.4*rwStep(.003,.001,joint));
		vec3 pc=st*(cool*(.25+1.1*sat(-nx*.8+.25))+halo*rim*rim*.9*exp(-max(length(p0)-1.,.0)*2.));
		col=mix(col,pc,cover);
	}
	// light hanging in the air before the glass
	col+=halo*(.015+.03*uSpace)*rwRoseDay(p0)*exp(-max(length(p0)-.7,.0)*2.2);
	return col;
}

// ---- b: five tall lights ----
const float twSill=.5;
float twSpring(float i) { return 2.3+.17*(2.-abs(i-2.))+(uOwn[1]<.0?.75:.1)*uOwn[1]-1.75*(twHalf-.165)*float(uOwn[1]<.0); }
// How far outside the nearest light's opening, less than 0 inside.
float twOpen(vec2 p,float i) {
	float x=abs(p.x-(i-2.)*.5),y=p.y-twSpring(i);
	float d=max(y>.0?length(vec2(x+twHalf,y))-2.*twHalf:x-twHalf,twSill-p.y);
	if (uOwn[6] != .0) d -= uOwn[6]*(uOwn[6]>.0?.04:.45*twHalf);
	if (uOwn[7] != .0) {
		float v=(fract((p.y-twSill)/.31)-.5)*.31,w=min(twHalf*.86,.142)*(1.+.3*min(uOwn[6],.0));
		d=mix(d,max(uOwn[7]>.0?length(vec2(x,v))-w:(x*.145/twHalf+abs(v)-.145)*.75,max(d,p.y-twSill-.31*floor((twSpring(i)+.5*twHalf-twSill)/.31))),abs(uOwn[7]));
	}
	return d;
}
float twOf(float x) { return clamp(floor(x/.5+2.5),.0,4.); }
float twLoud(int k,float y) { return rwLoud(k,k == 4,.4*(y-twSill)-uHits); }
float twCue(float x) { float d=(x+.5)*2.2; return 3.6*uCue*exp(-d*d*d*d); }
const float twPanel=.31; // from one iron bar to the next
// Which light p is in, how loud, lozenge or roundel, how far from the iron, its colours.
float twI,twLv,twOdd,twLoz,twBar; vec2 twL; vec3 twOwn,twRound;
void twPlace(vec2 p) {
	twI=twOf(p.x); int k=int(twI); twLv=twLoud(k,p.y); twOwn=rwPot[k];
	float v=(p.y-twSill)/twPanel,j=floor(v); v -= j+.5;
	twL=vec2(p.x-(twI-2.)*.5,v*twPanel); twOdd=mod(twI+j,2.);
	twLoz=(1.-abs(twL.x)/.115-abs(twL.y)/.15)*.09; twBar=(.5-abs(v))*twPanel;
	twRound=mix(rwRuby,twOwn,mod(j,4.)<2.?1.:.8*rwStep(.1,.8,twLv));
}
vec3 twLit(vec2 p,float eye) {
	float m=piece(vec2(sat(.02+.4*(p.y-twSill)),.1+.2*twI)).a;
	return vec3(rwLit(twLv,(p.y-twSill)/2.4,m,eye)+twCue(p.x))*rwDay(p,vec2(-.35,1.9),1.1);
}
// One light: roundels and lozenges by turns on pale quarries.
vec3 twGlass(vec2 p,float px) {
	twPlace(p);
	float d=-twOpen(p,twI),in_=1.,r=twRo-length(twL);
	if (d<.016) { rwId=.6; rwTint=rwHorn*.5; rwLead=min(d,.016-d); }
	else if (twOdd<.5 && r>.0) { in_=rwRoundel(twL,twRo,8.,twI*9.+floor(p.y/twPanel)); rwTint=rwParts(in_,rwGold,twRound); }
	else if (twOdd>.5 && twLoz>.0) {
		rwCut(p,30.); rwLead=min(rwLead,twLoz);
		rwTint=mix(mix(rwBlue,twOwn,rwTurned(.1+.9*twLv)),rwRuby,step(.8,fract(rwId*9.)));
	} else {
		// pale quarries, set corner up
		vec2 q=vec2(twL.x*1.25+p.y,p.y-twL.x*1.25)*15.*rwFine,f=.5-abs(fract(q)-.5);
		rwId=hash21(floor(q)+twI*13.); rwLead=min(min(f.x,f.y)/(24.*rwFine),twOdd<.5?-r:-twLoz);
		rwTint=mix(mix(rwHorn*vec3(.3,.36,.34),rwBlue*.9,step(.72,rwId)),twOwn*.8,.85*rwStep(.0,.3,.75*twLv-fract(rwId*5.)));
	}
	if (d >= .016) rwLead=min(rwLead,d-.016);
	rwLead=max(rwLead,.0);
	return rwLeaded(rwGone(rwPotMetal(p,px)*twLit(p,in_),p),twBar,px);
}
// The same light as it falls on stone, out of focus by b.
vec3 twThrown(vec2 p,float b) {
	float m=rwStep(b,-b,twOpen(p,twOf(p.x)));
	if (m <= .0) return vec3(.0);
	twPlace(p);
	float n=noise(p*13.),n2=noise(p*29.);
	vec3 c=mix(mix(rwHorn*vec3(.3,.36,.34),rwBlue,.2+.5*n2),twOwn*.7,.15+.5*twLv);
	if (twOdd<.5) {
		float r=length(twL);
		c=mix(mix(c,twRound,rwStep(twRo+b,twRo-b,r)),rwGold,rwStep(.04*twRo/.118+b,.04*twRo/.118-b,r));
		r=(r-twRo)/b; c*=1.-.45*exp(-r*r);
	} else c=mix(c,mix(mix(rwBlue,rwRuby,rwStep(.35,.75,n)),twOwn,.1+.7*twLv),rwStep(-b,b,twLoz));
	rwId=.5;
	if (rwHang>.0) m*=rwLeaves(p);
	if (rwFall>.0) c=mix(c,vec3(.62,.58,.5),rwStep(.0,.3,rwFall*1.1-.5*n-.3*noise(p*4.)));
	return c*m*(.6+.8*n2)*(1.-.5*rwStep(.008+b,.0,twBar))*twLit(p,1.);
}
vec3 twGlow(float x) { // the lights near this x, for the stone about them
	float f=clamp(x*2.+2.,.0,4.); int i=int(min(f,3.));
	return mix(rwNear(i,twLoud(i,1.5)),rwNear(i+1,twLoud(i+1,1.5)),f-float(i))*exp(-max(abs(x)-1.1,.0)*1.5)+.06*twCue(x);
}
vec3 twRoom(vec2 p) {
	vec2 sun=vec2(.36+.035*sin(TAU*uLoop)+.06*sin(uTime*.021),-.62-.025*cos(TAU*uLoop));
	vec3 eye=vec3(.95,1.15,5.);
	float yaw=.1,fo=1.17; vec2 sh=vec2(.2,.06);
	if (uOwn[0]>.0) { float w=uOwn[0]; eye=mix(eye,vec3(.0,1.62,3.6),w); yaw=mix(yaw,.0,w); fo=mix(fo,1.2,w); sh=mix(sh,vec2(.0),w); }
	if (uOwn[0]<.0) { float w=-uOwn[0]; eye=mix(eye,vec3(-.9,2.7,5.4),w); yaw=mix(yaw,.32,w); fo=mix(fo,.9,w); sh=mix(sh,vec2(-.03,.46),w); }
	vec3 dir=rwSight(.1,1.17,p-vec2(.2,.06)); if (uOwn[0] != .0) dir=rwSight(yaw,fo,p-sh);
	vec3 cool=rwCool*(.8+.5*uLevel);
	const float side=2.15,front=.15;
	float tw=dir.z<-.001?(front-eye.z)/dir.z:1e4;
	float tf=dir.y<-.001?-eye.y/dir.y:1e4;
	float ts=dir.x>.001?(side-eye.x)/dir.x:1e4;
	float t=min(tw,min(tf,ts));
	vec3 x=eye+dir*t,col;
	if (uOwn[4]<.0) cool*=mix(1.,.8*exp(-1.2*x.y)+.06+1.6*exp(-length(x-vec3(-2.2,.8,.8))*1.2),-uOwn[4]);
	float px=1.25/uRes.y*eye.z/max(-dir.z,.2);
	if (t == tw) {
		float i=twOf(x.x),o=twOpen(x.xy,i)-.062;
		vec2 sl=dir.xy/-dir.z*front;
		if (o<.0) {
			vec2 h=x.xy+sl; float g=twOpen(h,i);
			if (g<.0) col=twGlass(h,px);
			else col=rwStone(h*3.)*(cool+twGlow(x.x)*.35*exp(-g*24.)); // the splayed stone about each light
			col*=.5+.5*rwStep(.0,.012,-o);
		} else {
			float roll=rwStep(.03,.018,abs(o-.03)),st=rwCourse(x.xy,vec2(1.5,3.1),px);
			col=st*(cool*(.25+.8*roll+exp(-o*1.6))+(.035*exp(-o*5.)+.02*roll)*twGlow(x.x));
		}
	} else {
		bool flr=t == tf;
		float foot=t*1.2/uRes.y/max(flr?-dir.y:dir.x,.1);
		float st=flr?rwCourse(x.xz,vec2(1.25),foot):rwCourse(x.zy,vec2(1.5,3.1),foot);
		vec3 th=twThrown(x.xy-sun*x.z,.007+.011*x.z);
		col=st*(cool*exp(-x.z*.2-x.y*.7)+th*(.07+.5*th)*(flr?.85:.65)*(.5+.5*uLevel)+twGlow(x.x)*.03*exp(-x.z*.5));
		col*=1.-.6*rwStep(.1,.0,flr?min(x.z-front,side-x.x):min(x.y,x.z-front));
	}
	// dusty air: how far the sight goes through each beam
	vec2 w0=eye.xy-sun*eye.z,w1=dir.xy-sun*dir.z;
	w1+=step(abs(w1),vec2(1e-3))*3e-3;
	vec2 ty=(vec2(twSill,2.6)-w0.y)/w1.y;
	for (int k=0; k<5; k++) {
		vec2 tx=(vec2(-twHalf,twHalf)+(float(k)-2.)*.5-w0.x)/w1.x;
		float l=max(min(min(max(tx.x,tx.y),max(ty.x,ty.y)),t)-max(max(min(tx.x,tx.y),min(ty.x,ty.y)),.0),.0);
		col+=mix(vec3(.1,.13,.2),rwPot[k],.5)*l*l/(l+.6)*(.25+rwGain*twLoud(k,1.5)+twCue(.5*float(k)-1.))*(.008+.02*uSpace)*(.4+uLevel);
	}
	return col;
}
vec3 render(vec2 p) {
	rwSetUp();
	vec3 c=uVar<.5?rwRose(p):twRoom(p);
	c=min(screenOf(c*(2.3+.8*uTone)),1.);
	return mix(c,c*c*(3.-2.*c),.65);
}
