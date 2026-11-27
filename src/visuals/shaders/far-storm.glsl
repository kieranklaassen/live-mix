// name: Far storm
// a: Over the plain
// b: Over the tops
// what: Night over a wide dark plain: far off a thunderhead stands in faint moonlight, lit softly from inside, its anvil drawn out across the stars, rain under it and one lamp on a thin road; or the same weather from high above, a floor of cloud tops out to the curved edge of the world, with lights blooming under it.
// follows: Each kind of sound is a glow of its own inside the cloud, brighter as it sounds; the low end swells the towers, the high end shimmers in the rain and on the tops; a hit is a branching glow deep inside that spreads and fades, a cue lights the anvil or the far tops slowly; keys brighten windows and stars, a voice the lamp or the rim of air.
// own: 0 1 broad day under a pale sky, -1 the sun gone down behind it, every edge lit; 1 1 a tall column on a stem (b: high towers), -1 a low wide bank (b: long flat swells); 2 1 drawn out in smooth flat plates, -1 a few big round heads; 3 1 a row of storms (b: many small heads), -1 one very near (b: few and great); 4 1 water that mirrors it (b: the floor opens on a sea), -1 hills and a mountain (b: peaks stand out of it); 5 1 rain over everything (b: fog lies level in the hollows), -1 dry, a funnel let down (b: deep dark clefts); 6 1 a great world in the sky, -1 curtains of light; 7 1 from high up (b: the world small and round), -1 far off under a great sky (b: looking down, no sky)
vec3 fsInk[5];
vec3 fsAt[5];
vec3 fsMoon;
vec3 fsSunC, fsAmb, fsRim;
#define fsDay max(uOwn[0],.0)
#define fsDusk max(-uOwn[0],.0)
float fsPx, fsSoft;
float fsBolt, fsNear;
float fsE(float a, float b, float x) { x=sat((x-a)/(b-a)); return x*x*(3.-2.*x); }
float fsT, fsWet;
float fsLum(vec3 c) { return dot(c, vec3(.3,.59,.11)); }
void fsLights() {
 float lv[5]=float[5](uDrone, uPad, uTexture, uPhrase, uHits);
 int k=0;
 do {
  vec3 c=uKind[k]*uKind[k];
  c=mix(c, vec3(fsLum(c))*vec3(.95,1.,1.12), k == 4 ? .6 : .22);
  float br=.8+.2*sin(uTime*(.19+.07*float(k))+float(k)*1.9);
  fsInk[k]=c*lv[k]*(.65+.35*lv[k])*br*(.6+.9*uEnergy)*(k == 0 ? 3.1 : 1.9);
 } while (++k < 5);
}
vec2 fsPair(vec2 p) { vec3 q=fract(p.xyx*vec3(.1031,.103,.0973)); q += dot(q, q.yzx+33.33); return fract((q.xx+q.yz)*q.zy); }
// One size of cloud heads: how high the nearest one stands here (0 to 1) and where we are on it.
float fsHeads(vec2 q, float t, out vec2 on) {
 vec2 id=floor(q), f=q-id; t /= TAU; float best=-9.; on=vec2(.0);
 vec2 o=vec2(-1.);
 do {
  vec2 h=fsPair(id+o);
  vec2 u=fract(t+h)*2.-1., v=f-o-.5+1.44*u*(1.-abs(u));
  float e=.95-.35*h.x-dot(v, v), m=sat(.5+.5*(e-best)/fsSoft);
  best=mix(best, e, m)+fsSoft*m*(1.-m); on=mix(on, v, m);
  if (++o.x > 1.5) { o.x=-1.; ++o.y; }
 } while (o.y < 1.5);
 return best;
}
const mat2 fsTurn=mat2(.8,.6,-.6,.8);
// The smaller heads, still, riding on the bigger ones: only the four nearest are asked, each let go before it is out of reach.
float fsTiny(vec2 q, out vec2 on) {
 vec2 id=floor(q-.5), f=q-id; float best=-9.; on=vec2(.0);
 vec2 o=vec2(.0);
 do {
  vec2 h=fsPair(id+o), w=f-o-.5, g=max(abs(w)-.7,.0), v=w+.3-.6*h;
  float e=.95-.35*h.x-dot(v, v)-5.*dot(g, g), m=sat(.5+.5*(e-best)/fsSoft);
  best=mix(best, e, m)+fsSoft*m*(1.-m); on=mix(on, v, m);
  if (++o.x > 1.5) { o.x=.0; ++o.y; }
 } while (o.y < 1.5);
 return best;
}
float fsLine(float x) { float i=floor(x), f=x-i; return mix(hash11(i), hash11(i+1.), f*f*(3.-2.*f)); }
vec3 fsSq(int k) { return uKind[k]*uKind[k]; }
vec3 fsGlow(float m, float f) { return fsSunC*m*m+fsAmb+fsRim*(exp(-max(f,.0)*(uVar > .5 ? 60. : 130.))+(.1+.15*uVar)*exp(-max(f,.0)*22.)); }
vec3 fsAir(float y) { return fsDay*mix(fsSq(0)*.6, uKind[3]*.55+.2, exp(-y*4.5))+fsDusk*(fsSq(2)*1.5*exp(-y*7.)+fsSq(1)*.5*exp(-y*2.4)); }
// What hangs in the sky: a great world, or curtains of light.
vec3 fsHang(vec2 p, float up, vec3 sky) {
 if (uOwn[6] > .0) {
  float R=.27*sqrt(max(uOwn[6], 1e-4)); vec2 v=(p-vec2(-.42,.2))/R;
  float r2=dot(v, v), in_=fsE(1.+fsPx*1.5/R,1.-fsPx*1.5/R, sqrt(r2));
  vec3 n=vec3(v, sqrt(max(1.-r2,.0)));
  float tex=.62+.5*noise(vec2(n.x*2.-n.y*5., n.y*9.+2.*noise(n.xy*3.)))*fsE(.0,.5, n.z);
  float li=fsE(-.15,.8, dot(n, vec3(.55,.6,.58)));
  sky=mix(sky, sky*.6+(uKind[3]*.7+.2)*tex*(.05+.9*li)*mix(.5,.3, fsDay), in_*fsE(.0,.07, up));
  sky += uKind[3]*.05*exp(-max(sqrt(r2)-1.,.0)*5.)*(1.-in_)*fsE(.0,.07, up);
 }
 int i=0;
 if (uOwn[6] < .0) do {
  float fi=float(i), x=p.x+.09*sin(p.x*3.1+uTime*.05+fi*2.)+.05*sin(p.x*7.3-uTime*.07+fi), b=.1+.13*fi+.1*sin(p.x*2.2+fi*2.6+uTime*.03);
  float h=up-b, ray=.35+.65*noise(vec2(x*34.+fi*7., uTime*.12))*(.5+noise(vec2(x*7., uTime*.06+fi)));
  sky += -uOwn[6]*mix(uKind[3]*(.3+.9*uPhrase), uKind[1]*(.4+1.2*uPad), sat(h*4.))*ray*fsE(-.015,.02, h)*exp(-max(h,.0)*(6.5-2.*ray))*(.6+.5*uLevel)*fsE(-1.2,.1, sin(p.x*2.3+fi*4.+uTime*.04));
 } while (++i < 2);
 return sky;
}
// A line of mountains, and the rock of one: sl is how far it is turned to the light, e how far under its top.
float fsRidge(float x) { float n=1.-abs(2.*fsLine(x*1.5)-1.); return .17*n*n*(.35+.65*fsLine(x*.9+2.))+.04*fsLine(x*4.1)+.018*fsLine(x*11.)+.008*fsLine(x*31.); }
vec3 fsRock(float sl, float e, float snow) {
 e=max(e,.0); sl=fsE(.3,.75, sl); vec3 al=mix(fsSq(0)*.3+fsSq(2)*.4, vec3(.75), snow*fsE(.16,.0, e-.06*sl));
 return vec3(.002,.003,.005)+al*(vec3(.5,.6,.78)*.17*sl+fsSunC*.8*sl+fsAmb*1.3)+fsRim*(.16*exp(-e*90.)+.1*sl*al);
}
vec3 fsFacing(vec2 n) { float r=dot(n, n); if (r > .96) n *= sqrt(.96/r); return vec3(n, sqrt(1.-min(r,.96))); }
// The big heads of the tower, four shells from front to back.
vec2 fsS; vec3 fsShell[4];
vec3 fsB;
void fsBig(float x, float y, float r) { vec2 v=fsS-vec2(x, y); float e=.5*(r-dot(v, v)/r); if (e > fsB.z) fsB=vec3(v/r, e); }
void fsShells() {
 fsB=vec3(.0,.0,-1.); fsBig(-.1,.13,.075); fsBig(.015,.12,.085); fsBig(.13,.12,.07); fsBig(-.035,.215,.065); fsBig(.075,.195,.06); fsBig(-.185,.1,.05); fsBig(.205,.095,.045); fsBig(.02,.18,.06); fsShell[0]=fsB;
 fsB=vec3(.0,.0,-1.); fsBig(-.075,.27,.07); fsBig(.04,.29,.085); fsBig(.135,.215,.065); fsBig(-.14,.195,.06); fsBig(-.01,.365,.07); fsBig(.21,.12,.06); fsBig(-.245,.095,.045); fsBig(-.02,.315,.06); fsBig(.02,.165,.085); fsShell[1]=fsB;
 fsB=vec3(.0,.0,-1.); fsBig(-.045,.435,.065); fsBig(.065,.4,.075); fsBig(-.105,.345,.06); fsBig(.135,.31,.06); fsBig(.02,.48,.075); fsBig(-.225,.15,.04); fsBig(-.315,.085,.035); fsShell[2]=fsB;
 fsB=vec3(.0,.0,-1.); fsBig(.0,.545,.075); fsBig(-.085,.46,.07); fsBig(.105,.47,.07); fsBig(.165,.38,.045); fsBig(.035,.585,.05); fsBig(.27,.09,.035); fsBig(.0,.31,.1); fsBig(.02,.17,.1); fsBig(.085,.44,.105); fsBig(.0,.23,.1); fsBig(.1,.17,.09); fsShell[3]=fsB;
}
// Tower, anvil and rain in their own place: y 0 is the horizon.
vec3 fsLit(vec3 P, vec3 N, float f, float crease) {
 vec3 c=vec3(.0); float thin=2.*exp(-f*42.)+.18;
 int k=0;
 do {
  vec3 L=fsAt[k]-P; if (k == 2) L.x *= .45;
  float d2=dot(L, L), dl=sqrt(d2+1e-5);
  float wrap=sat((dot(N, L)/dl+.45)/1.45);
  float fall=1./(1.+d2*mix(58.,96., uTone)); fall *= fall;
  c += fsInk[k]*fall*(wrap*wrap*2.9+thin);
 } while (++k < 4);
 return c*crease;
}
// The branching glow of a hit: a bent stem with three limbs, growing outwards as it fades.
void fsBranch(vec2 q, vec2 at, float size) {
 fsBolt=.0; fsNear=.0;
 float grow=.35+1.*(1.-uHits), d=9.;
 vec2 u=(q-at)/size; float out_=fsE(3.2,1.2, dot(u, u));
 if (uHits > .01 && dot(u, u) < 3.2) {
 u += .16*(vec2(noise(u*3.1+4.), noise(u*3.1+19.))-.5)+.1*(vec2(noise(u*8.), noise(u*8.+31.))-.5)+.05*(vec2(noise(u*21.), noise(u*21.+11.))-.5);
 const vec4 limb[6]=vec4[6](vec4(.0,.55,.1,-.1), vec4(.1,-.1,-.08,-.75), vec4(.1,-.1,.52,-.5), vec4(.0,.55,-.55,.85), vec4(.0,.55,.5,.95), vec4(.06,.2,-.45,.02));
 int i=0;
 do {
  vec2 a=limb[i].xy, b=limb[i].zw-a, v=u-a;
  float h=sat(dot(v, b)/dot(b, b)), l=length(v-b*h);
  float w=.006+.012*(1.-h)*(i < 2 ? 1.5 : 1.);
  float on=fsE(grow+.15, grow-.15, length(a+b*h-vec2(.0,.3)));
  fsBolt=max(fsBolt, on*(.9*exp(-max(l-w,.0)*30.)+.5*exp(-l*8.)));
  d=min(d, l+(1.-on)*.3);
 } while (++i < 6);
 fsNear=exp(-d*2.6)*out_*uHits; fsBolt *= out_*uHits;
 }
}
vec3 fsRain(vec2 q, vec3 sky) {
 float x=q.x+q.y*.32, w=fsE(.33,.08, abs(x+.03))*fsE(-.5,.0, uOwn[5]);
 if (w > .0 && q.y < .17) {
 float shaft=fsE(.2,.85,.65*noise(vec2(x*11.+uTime*.01,1.7))+.35*noise(vec2(x*34.+uTime*.013,4.7)));
 float fine=noise(vec2(x*210., q.y*9.+fsT*.6))*.6+noise(vec2(x*90.+3., q.y*5.+fsT*.4))*.4;
 fine=mix(.45, fine, fsWet);
 float hang=fsE(.17,.1, q.y)*mix(.35+.65*noise(vec2(x*23.,7.)),1., fsE(.0,.07, q.y));
 vec3 lit=vec3(.012,.016,.022);
 lit += fsInk[0]*.16*exp(-49.*(q.x-fsAt[0].x)*(q.x-fsAt[0].x));
 vec4 m=piece(vec2((x+.26)/.52,.25+q.y*4.));
 lit += m.rgb*m.rgb*(.1+.2*uEnergy);
 lit += vec3(.3,.36,.42)*.45*uHigh*fine*fine*fine;
 lit += fsAmb*.8+fsDusk*fsSq(2)*.2;
 sky=mix(sky, lit*(.75+.5*fine), w*hang*(.15+.85*shaft)*.8);
 }
 return sky;
}
float fsStar(vec2 p) {
 vec2 g=p*30., id=floor(g), h=hash22(id);
 float r=length(g-id-.2-.6*h)/(30.*max(fsPx,.0011)), b=hash21(id+7.7);
 b *= b; b *= b; b *= b; b *= b; b *= b;
 return b*exp(-r*r*(2.2-1.2*b))*(.8+.2*sin(uTime*(.5+h.x)+h.y*40.));
}
vec4 fsAnvil(vec2 s) {
 vec4 an=vec4(.0);
 float x=s.x, ax=x < .0 ? -x : x/.36;
 float top=.607+.012*x-.045*ax*ax*ax+.014*(noise(vec2(x*9.,2.))-.5);
 float bot=.42+.158*(1.-exp(-ax*3.4))-.012*x+.02*(noise(vec2(x*6.+3.,5.))-.5);
 if (ax < 1.1 && s.y < top+.02 && s.y > bot-.04) {
 float slow=uTime*.004;
 float str=noise(vec2(x*5.-slow*3., s.y*46.+x*3.)), thin=noise(vec2(x*13.-slow*5., s.y*120.+x*9.));
 vec2 v=vec2(.0), w2=v; float h=.5, h2=.5;
 if (s.y-bot < .09) { h=fsHeads(vec2(x*13.-slow*6., s.y*21.), uTime*.03, v); h2=fsTiny(vec2(x*33.-slow*9., s.y*44.)+v, w2); }
 float up=top-s.y+.009*(str-.5)+.006*(h2-.5), dn=s.y-bot+.034*(h-.5)+.012*(h2-.5)+.012*(str-.5);
 float f=min(up, dn);
 float wisp=fsE(1.02,.55, ax+.35*(str-.5)+.2*(thin-.5));
 float a=fsE(-.002,.004+.03*fsE(.1,.8, ax), f+.012*(thin-.6)*fsE(.05,.4, ax))*wisp*mix(.55+.45*thin,1., fsE(.9,.2, ax));
 float pouch=fsE(.06,.0, dn);
 vec2 nx=v*pouch*.8+w2*.4*pouch+vec2(.0, fsE(.03,.0, up)*.8-.5*pouch);
 vec3 N=fsFacing(nx);
 float run=noise(vec2(x*7.-slow*4., (s.y-bot)/(max(top-bot,0.)+.02)*7.+2.*str));
 float grain=.45+.5*run+.35*str*(.6+.4*thin), crease=mix(1.,.4+.6*fsE(.1,.7, h), pouch*.8);
 float m=sat(dot(N, fsMoon)*.8+.2);
 vec3 moonC=vec3(.5,.6,.78);
 vec3 c=vec3(.009,.013,.022)+moonC*.12*m*m+moonC*.3*exp(-max(up,.0)*140.);
 c=(c+fsGlow(m, f*1.4))*grain+fsLit(vec3(s,-.06), N, max(f,.0)*.7,1.)*grain;
 float reach=exp(-ax*1.6)*(.45+.55*fsE(.35,.0, abs(ax-(1.-uCue)*1.1)));
 c += (vec3(.55,.62,.8)+.5*fsInk[2])*uCue*reach*grain*(.45+.55*exp(-max(f,.0)*30.))*.75;
 c += fsInk[4]*fsNear*.35*grain;
 an=vec4(c*crease, a*fsE(-.6,-.1, uOwn[1]));
 }
 return an;
}
vec3 fsStorm(vec2 q, vec3 sky) {
 float t=uTime*.05, rise=uTime*.0016+uTravel*.0012;
 vec3 acc=vec3(.0); float left=1., ahead=-1.;
 vec3 moonC=vec3(.5,.6,.78)*.56;
 vec2 s=q; s.x *= 1.-.07*uLow; s.y *= 1.-.05*uLow*fsE(.0,.5, q.y);
 vec4 an=vec4(.0);
 if (s.y > .36 && s.y < .66) an=fsAnvil(s);
 vec2 b=s;
 if (uOwn[1] > .0) b.x *= mix(1., mix(2.5,.72, fsE(.12,.52, b.y)), uOwn[1]);
 if (uOwn[1] < .0) { b.x *= mix(1.,.4,-uOwn[1]); b.y=mix(b.y, b.y*1.9-.02,-uOwn[1]); }
 bool by=abs(b.x) < mix(.36,.25, fsE(.1,.2, b.y)) && b.y < .68 && s.y > .05;
 vec2 hs=exp2(uOwn[2]*(uOwn[2] > .0 ? vec2(-1.8,.4) : vec2(1.1))); float fine=1.-.75*max(abs(uOwn[2]),.0);
 if (by) { fsS=b+.034*(vec2(noise(s*13.), noise(s*13.+41.))-.5); fsShells(); }
 int l=0;
 do {
  if (left < .01 || (!by && an.a <= .0)) break;
  if (l == 3) { acc += left*an.a*an.rgb*(1.-.5*fsE(-.05,.0, ahead)); left *= 1.-an.a; }
  float fl=float(l), z=.24-.13*fl, f=by ? fsShell[l].z : -1.; vec2 bn=by ? fsShell[l].xy : vec2(.0);
  if (f > -.037) {
  vec2 o=vec2(fl*3.7, fl*5.1-rise*14.), v1, v2, v3;
  float h1=fsHeads(s*hs*15.+o, t+fl, v1);
  if (uOwn[2] > .0) f += uOwn[2]*.05*(sin(s.y*62.+4.*noise(vec2(s.x*5.+fl,1.))+fl*1.7)-.3);
  if (f+.044*(h1-.45) > -.015) {
  float h2=fsTiny(s*hs*33.+o*2.2+v1*1.1, v2);
  float h3=fsTiny(fsTurn*(s*78.+v2*1.1)+o*5.2, v3); v3=v3*fsTurn*fine;
  f += (.044+.03*max(-uOwn[2],.0))*(h1-.45)+.019*mix(1., fine, step(uOwn[2],.0))*(h2-.5)+.008*fine*(h3-.5);
  float foot=s.y-.062-.03*h1-.012*h2-.004*h3-.02*noise(vec2(s.x*11.+fl,3.));
  f=min(f, foot*1.3);
  float a=fsE(-fsPx, fsPx*1.5, f);
   vec2 nx=bn*.5+v1*.55+v2*.42+v3*.26+vec2(s.x*1.3,.0);
   vec3 N=fsFacing(nx);
   vec3 P=vec3(q, z+.12*sat(f*10.));
   float crease=.45+.55*fsE(.1,.75,.5*h1+.35*h2+.15*h3);
   float under=fsE(.02,.1, foot);
   float shade=1.-.55*fsE(-.045,.0, ahead);
   float m=sat(dot(N, fsMoon)*.88+.12), high=fsE(.05,.5, q.y);
   vec3 c=vec3(.0035,.006,.011)*(.5+high)+moonC*m*m*mix(.25,1., high)*shade*mix(.25,1., under);
   c=(c+fsGlow(m*mix(.5,1., high)*shade*mix(.3,1., under), f)*mix(.55,1., under))*crease+fsLit(P, N, max(f,.0), crease);
   c += fsInk[4]*(l > 0 ? fsBolt*(l > 1 ? 3.2 : 1.4)*crease*crease*(.4+.6*exp(-max(f,.0)*18.))+fsNear*.35*crease*1.5 : fsNear*(.12+1.*exp(-max(f,.0)*45.))*crease);
   c += vec3(.5,.58,.8)*uCue*.22*crease*fsE(.25,.6, q.y)*(l > 1 ? 1. : .4)*sat(.3+N.y);
   c=mix(c, sky, (.35+.3*uSpace)*exp(-q.y*14.));
   acc += left*a*c; left *= 1.-a;
  }
  }
  ahead=max(ahead, f);
 } while (++l < 4);
 return acc+left*sky;
}
vec3 fsAbove(vec2 q, vec2 p, vec3 spill) {
  float fun=max(-2.*uOwn[5]-1.,.0), base=.1+.13*fun;
  vec2 c=q-vec2(.0,.02+.13*fun);
  fsBranch(q, vec2(.02+.03*sin(uTime*.07),.33),.2);
  vec3 sky=mix(vec3(.0075,.0125,.0195), vec3(.0012,.0019,.0045), fsE(.0,.4+.3*uSpace, q.y))+spill*.003+fsAir(q.y);
  sky += fsDusk*uKind[3]*.8*exp(-dot(c-vec2(.0,.2), c-vec2(.0,.2))*12.);
  if (q.y > .1) sky += vec3(.75,.82,1.)*fsStar(p)*fsE(.1,.5, q.y)*(.5+.8*uKeys)*(1.-min(fsDay*3.,1.));
  if (uOwn[6] != .0) sky=fsHang(p, p.y+.4-.3*max(uOwn[7],.0), sky);

  if (q.y < .09) {
   vec2 v; float h=fsHeads(q*vec2(26.,30.), uTime*.02, v);
   float f=.052*fsE(.35,.8, noise(vec2(q.x*4.5+3.+uTime*.0015,.5)))-q.y+.018*(h-.3);
   float m=sat(dot(vec3(v,.5), fsMoon));
   sky=mix(sky, vec3(.008,.012,.019)+fsGlow(m*.6,.2)*.35+fsAir(q.y)*.7+vec3(.014,.017,.023)*m*m*fsE(.0,.05, q.y), fsE(-fsPx, fsPx*2., f)*.85);
  }
  if (fun > .0 && q.y < .3) {
   float y=q.y/base, lim=y-1.1+1.12*fun, x=q.x-.035*sin(y*3.1+uTime*.13)*(1.2-y)+.004*sin(y*16.-uTime*.5)-.02;
   float hw=.0035+.02*y*y+.05*y*y*y*y*y, u=x/hw, rim=sqrt(max(1.-u*u,.0));
   float a=fsE(1.+2.*fsPx/hw,1.-2.*fsPx/hw-.25*y, abs(u))*fsE(.0,.12, lim)*fsE(1.3,1.1, y);
   float tw=.6+.5*noise(vec2(u*1.5-uTime*.2, y*9.-u*2.5-uTime*.4)), m=sat(.4-.75*u);
   vec3 k=vec3(.006,.009,.014)+fsInk[0]*.1+vec3(.03,.036,.045)*m+fsGlow(m*.75, rim*.06)*.75;
   k=mix(k*tw, fsAir(.0),.15*fsDay);
   sky=mix(sky, k, a);
   float foam=exp(-q.y*60.)*fsE(.07,.0, abs(x))*noise(vec2(x*70.+uTime*.3, q.y*60.-uTime*.7));
   sky=mix(sky, k*.5+fsAir(.0)*.6+.03, sat(foam*1.3)*fsE(.7,1., fun));
  }
  float px=fsPx;
  int i=uOwn[3] > .0 ? 1 : 0;
  do {
   vec2 g=q, gc=c; vec3 was=sky;
   if (i == 1) {
    float id=floor(q.x/.56+.5), h=hash11(id+9.), z=(.2+.13*h)*uOwn[3];
    g=(q-vec2(id*.56+.09,.01))/z*vec2(1.2-.4*h,.85+.3*hash11(id+3.)); gc=g; fsPx=px/z;
   }
   sky=mix(was, fsStorm(gc, fsRain(g, sky)), i == 1 ? .75 : 1.);
   fsPx=px;
  } while (--i >= 0);
  return sky;
}
vec3 fsPlain(vec2 p) {
 float asp=uRes.x/uRes.y, hz=-.35+(uOwn[7] > .0 ? .29 : .07)*uOwn[7], cx=.2*fsE(.7,1.5, asp);
 vec2 q=(p-vec2(cx, hz))*(1.+(uOwn[7] > .0 ? .42 : -1.3)*uOwn[7])*(1.-.5*max(-uOwn[3],.0));
 vec3 spill=vec3(.0);
 int k=0;
 do spill += fsInk[k]/(1.+14.*dot(q-fsAt[k].xy, q-fsAt[k].xy)); while (++k < 4);
 vec3 col=vec3(.0);
 vec2 mq=q, mp=p; vec3 sky=col;
 if (q.y <= .0 && uOwn[4] > .0) {
  float d=-q.y, z=1./(d+.004);
  vec2 w=vec2(q.x,1.)*z; float ry=(noise(w*vec2(.35,2.6)+vec2(.0, uTime*.12))-.5)*.6+(noise(w*vec2(1.3,9.)-vec2(.0, uTime*.2))-.5)*.4;
  mq=vec2(q.x+ry*d*.12, d*(1.35+ry*.7)+.003); mp.y += mq.y-q.y;
 }
 if (q.y > .0 || uOwn[4] > .0) sky=fsAbove(mq, mp, spill);
 if (q.y > .0) col=sky;
 else {
 float d=-q.y, z=.1/(d+.004);
 vec2 w=vec2(q.x*z*10., z*10.);

 float near=fsE(.004,.1, d);
 float row=floor(w.y*.32+.25*sin(w.x*.05)), tint=hash11(row+3.);
 col=vec3(.003,.0045,.0048)*(.5+.9*tint);
 col *= .7+.6*mix(.5, noise(w*vec2(1.6,5.))*.6+.4*noise(w*vec2(5.,17.)), near);
 float water=fsE(.5,.75, noise(w*vec2(.1,.42)+3.)*.75+.25*mix(.5, noise(w*vec2(.5,1.9)), near))*fsE(.16,.03, d)*fsE(.0,.02, d);
 vec3 glow=vec3(.0);
 k=0;
 do { float x=(q.x-fsAt[k].x*1.3)*5./(1.+5.*d); x=1.+x*x; glow += fsInk[k]/(x*sqrt(x))*exp(-d*7.-fsAt[k].y); } while (++k < 4);
 glow += fsInk[4]*.4/(1.+q.x*q.x*30.)*exp(-d*7.);
 vec4 m=piece(vec2(sat(p.x/min(asp,1.8)+.5),1.-exp(-d*9.)));
 col += m.rgb*m.rgb*.012*(.3+tint);
 col += glow*(.006*(.4+tint)+.2*water)+vec3(.01,.014,.019)*water/(1.+q.x*q.x*3.);
 float lit=fsE(.0,.05, d);
 vec3 soil=mix(fsSq(2), fsSq(0), tint)*(.25+.5*mix(.5, noise(w*vec2(1.6,5.)), near))*(.6+.8*tint);
 col += soil*(fsSunC*.4+fsAmb+fsRim*.04)+fsAir(.0)*exp(-d*22.)*.7+water*fsAir(.05)*.5;
 if (uOwn[4] > .0) {
  col=mix(col, sky*(.55+.4*exp(-d*9.))+fsAir(.0)*.03, uOwn[4]);
 }
 float land=1.-abs(uOwn[4]);

 float rx=-.03-1.9*d+d*.75*sin(.2/(d+.035)), half_=.0006+.022*d;
 float road=fsE(half_+fsPx*1.5, half_-fsPx, abs(q.x-rx))*land;
 col=mix(col, vec3(.026,.033,.042)+fsAmb*.7+fsSunC*.12+fsAir(.0)*.15+spill*.05*exp(-d*5.), road*.8);

 float vx=p.x*24., vi=floor(vx), vh=hash11(vi+2.);
 vec2 vd=vec2((vx-vi-.2-.6*hash11(vi+8.))/24., d-.004-.02*vh*vh)/fsPx;
 col += vec3(1.,.7,.38)*step(.8, vh)*exp(-dot(vd, vd)*.4)*(.025+1.2*uKeys)*(.5+hash11(vi+5.));
 if (land > .01) {
 float trip=fract(uTime/160.+.45), dc=1./mix(120.,9., trip)-.004;
 vec2 car=vec2(-.03-1.9*dc+dc*.75*sin(.2/(dc+.035)),-dc);
 float seen=fsE(.0,.1, trip)*fsE(1.,.9, trip), size=.0011+.012*dc;
 vec2 cv=q-car-vec2(.0, size);
 float r=length(cv);
 vec3 lamp=vec3(1.,.74,.42)*seen*(.55+.9*uMic)*land;
 col += lamp*(exp(-r*r/(size*size))*1.3+.0000022/(r*r+.00004)*3.+road*.1*exp(-abs(cv.y)/(.06*dc+.003))*step(cv.y,.0));
 }
 }
 int i=0;
 if (uOwn[4] < .0 && q.y < .25) do {
  float fi=float(i), x=q.x*(2.6-fi*.6)+fi*7.3, h=fsRidge(x)*(.6+.3*fi), h2=fsRidge(x+.03)*(.6+.3*fi);
  float lo=.01+.065*fi;
  if (i == 0) { h=max(h,.2-.5*abs(q.x)-.05*exp(-abs(q.x)*30.)+.02*noise(vec2(x*11.,9.))); h2=max(h2,.2-.5*abs(q.x+.0115)-.05*exp(-abs(q.x+.0115)*30.)+.02*noise(vec2(x*11.+.33,9.))); }
  float e=(h-lo+.12)*-uOwn[4]-.12-q.y, a=fsE(-fsPx, fsPx, e);
  float sl=sat(.5+(h2-h)*12.*exp(-e*12.)+.5*(noise(vec2(x*9.-e*20., q.y*30.))-.5)+.4*(noise(vec2(x*33.+e*30., q.y*80.))-.5));
  vec3 k=fsRock(sl, e,.3)+spill*.05*sl*exp(-e*12.);
  k=mix(k, fsAir(.03)+vec3(.008,.011,.016), (.6-.22*fi)*exp(-e*6.));
  col=mix(col, k, a);
 } while (++i < 3);
 if (uOwn[5] > .0) {
  float rx2=p.x+p.y*.16, fall=fsT*.5;
  float sh=fsE(.3,.8, noise(vec2(rx2*3.4-uTime*.012, p.y*.5+3.))*.65+.35*noise(vec2(rx2*13.-uTime*.02, p.y*.6+fall*.1)));
  float th=noise(vec2(rx2*150., p.y*3.5+fall*2.))*.6+.4*noise(vec2(rx2*70.+9., p.y*2.+fall*1.4));
  th=mix(.45, th, fsWet);
  vec4 m=piece(vec2(sat(p.x/min(asp,1.8)+.5), sat(.5-p.y)));
  vec3 k=vec3(.016,.021,.028)+fsAir(.12)*.8+fsAmb*.3+spill*.025+m.rgb*m.rgb*.12*(.4+uEnergy);
  col=mix(col, k*(.6+.8*th*th+.3*uHigh*th), uOwn[5]*(.25+.6*sh)*(.72+.28*th));
 }
 return col;
}
// The tops, from high above: banks of cloud one behind another, out to the curved edge of the world.
vec3 fsTops(vec2 p) {
 float hy=.2-(.12+max(uOwn[7],.0)*(.35+.9*p.x*p.x))*p.x*p.x-.32*min(uOwn[7],.0), limb=p.y-hy, al=max(limb,.0);
 vec3 edge=vec3(.006,.015,.021)+fsAir(.04)*.6;
 vec3 sky=vec3(.0012,.0018,.0042)+edge*exp(-al*13.)+fsAir(al)*exp(-al*2.5*max(uOwn[7],.0));
 float go0=uTravel*.02;
 sky += vec3(.02,.046,.034)*exp(-3800.*(limb-.002)*(limb-.002))*(.7+.5*uMic);
 if (limb > .04) sky += vec3(.75,.82,1.)*fsStar(p)*fsE(.04,.2, limb)*(.5+.8*uKeys)*(1.-min(fsDay*3.,1.));
 if (uOwn[6] != .0 && limb > -.06) sky=fsHang(p, al, sky);
 sky += fsDusk*uKind[3]*exp(-(p.x-.2)*(p.x-.2)*5.-al*11.);
 if (uOwn[4] > .0 && limb < fsPx) {
  float sz=.5/max(-limb,.004); vec2 sw=vec2(p.x*sz, sz+go0);
  float gl=noise(sw*vec2(13.,23.)+uTime*.05)*noise(sw*vec2(45.,73.)-uTime*.11)*fsE(3.,.8, sz)+.12; vec3 was=sky;
  sky=vec3(.012,.018,.026)*(.4+gl)+fsSq(0)*(fsDay*.5+.012)+fsAir(.05)*(.12+gl*.5)*.5+vec3(.1,.12,.15)*gl*gl+fsInk[0]*.1*gl;
  sky=mix(mix(sky, was, exp(limb*9.)), was, fsE(-fsPx, fsPx, limb));
 }
 fsBranch((p-vec2(-.16+.04*sin(uTime*.05),.03))*vec2(.62,1.3), vec2(.0),.2);
 float go=uTime*.005+uTravel*.007, at=fract(go), n0=floor(go), ahead=-1.;
 const float ratio=1.31;
 float many=exp2(uOwn[3]); vec2 hs=exp2(uOwn[2]*(uOwn[2] > .0 ? vec2(-1.8,.5) : vec2(1.))); float amp=1.-.6*max(-uOwn[1],.0)+.8*max(-uOwn[5],.0);
 vec3 acc=vec3(.0); float left=1., z=.42*pow(ratio,-at);
 float flat_=max(-uOwn[1],.0), tall=max(uOwn[1],.0), n, sd; vec2 q;
 int j=0;
 // the clouds bank by bank; the peaks of every third bank are reached only when it is
 if (limb <= .06+.3*max(max(uOwn[1],-uOwn[4]),.0)) do {
 do {
  if (uOwn[4] > .99 && .5+limb*z*1.31 < -.5/many) { j=99; break; }
  z *= ratio;
  n=n0+float(j); sd=mod(n,97.)*3.17; float yb=hy-.5/z;
  q=vec2(p.x*z+36.*fract(sd*.77), (p.y-yb)*z)*many;
  if (q.y < .4+.5*max(tall,-uOwn[4])) {
  float tower=fsE(.55,.9, fsLine(q.x*1.3+sd+40.));
  float line=(.04+.1*fsLine(q.x*2.2+sd)+(.105+.05*uLow)*tower*(1.+2.*tall))*(1.-.55*flat_)*fsE(.36,1., z), up=line-q.y, h1=.5, h2=.5, h3=.5;
  vec2 v1=vec2(.0), v2=v1, v3=v1;
  if (up > -.08) {
  if (up < .31+.3*tall) h1=fsHeads((q+.02*sin(q.yx*vec2(17.,13.)+sd))*hs*5.5+sd, uTime*.03+n, v1);
  if (uOwn[2] > .0) up += uOwn[2]*.03*sin(q.y*70.+4.*noise(vec2(q.x*2.+sd,1.)))*fsE(9.,4., z);
  if (up+.1*amp*(h1-.4) > -.026) {
  float fine=fsE(7.,4.5, z), some=fsE(10.,6.5, z);
  if (up < .25+.25*tall && z < 10.) { h2=mix(.5, fsTiny(q*hs*13.+sd+v1, v2), some); v2 *= some; }
  if (up < .25+.25*tall && z < 7.) { h3=mix(.5, fsTiny(fsTurn*(q*31.+v2), v3), fine); v3=v3*fsTurn*fine; }
  float f=up+.1*amp*(h1-.4)+.034*amp*(h2-.5)+.017*amp*(h3-.5), px=fsPx*z*many;
  float a=fsE(-px, px*1.5, f)*(j == 14 ? fsE(24.,19.5, z) : 1.);
  if (uOwn[4] > .0) a *= mix(1., fsE(.36,.2, up)*fsE(.48,.58, noise(vec2(p.x*z*1.2, mod(n,97.)*.55))+.12*h1), uOwn[4]);
   vec2 nx=v1*.85+v2*.45+v3*.2+vec2(.0,.3*exp(-max(f,.0)*8.));
   vec3 N=fsFacing(nx);
   float crease=.5+.5*fsE(.1,.75,.5*h1+.35*h2+.15*h3);
   float shade=1.-.5*fsE(-.06,.0, ahead);
   float m=sat(dot(N, fsMoon)*.88+.12);
   vec3 c=(vec3(.0035,.006,.011)+vec3(.5,.6,.78)*.42*m*m*shade+fsGlow(m*shade, f*.5))*crease;
   vec3 mist=vec3(.007,.0105,.0165)+fsAir(.1)*.55+fsAmb*.5+max(uOwn[5],.0)*(vec3(.03,.037,.046)+fsAmb+fsSunC*.25);

   float g=floor(n/3.), in3=n-3.*g, cx=floor(p.x*z/1.3-.5);
   float thin=4.*exp(-max(f,.0)*18.)*(in3 < .5 ? 1. : .3)+.12;
   int i=0;
   do {
    float id=cx+float(i), h=hash21(vec2(id, mod(g,89.))+3.);
    int k=int(mod(id+2.*g+400.,4.));
    vec3 L=vec3((id+.2+.6*h)*1.3-p.x*z,.06-q.y, in3 < .5 ? -.16 : .2*in3);
    float d2=dot(L, L), wrap=sat((dot(N, L)/sqrt(d2+1e-4)+.45)/1.45), fall=(.4+.6*hash11(h*7.))*fsE(.9,.55, abs(L.x))/(1.+d2*mix(12.,19., uTone));
    float own=.55+.45*sin(uTime*(.1+.12*h)+TAU*h);
    mist += fsInk[k]*fall*own*(.36+.5*fall*fall);
    c += fsInk[k]*fall*fall*(wrap*wrap*7.+thin)*crease*own;
   } while (++i < 2);
   float back=fsE(2.,2.6, z);
   c += fsInk[4]*crease*(back*(fsBolt*2.2*crease+fsNear*.4)+(1.-back)*fsNear*exp(-max(f,.0)*18.));
   float lz=log(z)-2.4*uCue, cs=exp(-lz*lz*2.5)*uCue;
   c += vec3(.55,.64,.8)*cs*crease*(.25*N.y+.12+.5*exp(-max(f,.0)*14.))*exp(-(p.x-.2)*(p.x-.2)*1.5);
   if (f < .06 && uHigh > .01) c += vec3(.5,.58,.7)*uHigh*.35*max(exp(-max(f,.0)*60.)-.03,.0)*mix(.45, noise(q*vec2(30.,8.)+fsT*.3), fsWet);
   vec4 pm=piece(vec2(sat(p.x*.55+.5), sat(1./(.7+z))));
   mist += pm.rgb*pm.rgb*.03;
   c=mix(c, mist*exp(-max(up-.2,0.)*5.), fsE(.03-.05*max(uOwn[5],.0), (.26-.16*max(uOwn[5],.0))*(1.+1.2*tall), f)*mix(.9,1., fsE(.17,.25, up)));
  c *= 1.-.9*max(-uOwn[5],.0)*fsE(.02,.16, f);
   c=mix(c, edge*.7,1.-exp(-z*(.03+.04*uSpace)));
   acc += left*a*c; left *= 1.-a;
  }
  ahead=max(ahead, up);
  }
  }
 } while (++j < 15 && left >= .01 && (uOwn[4] >= .0 || mod(n,3.) > .5));
  if (uOwn[4] < .0 && mod(n,3.) < .5 && q.y < min(1., .4+.5*max(tall,-uOwn[4])) && left > .01) {
  float cx=p.x*z*many*.62+hash11(sd)*9., id=floor(cx), ph=hash21(vec2(id, mod(n,89.))), dx=(cx-id-.38-.24*ph)/.62;
  float jag=.13*fsLine(q.x*5.)+.06*fsLine(q.x*14.)+.022*fsLine(q.x*47.), rh=.42+.6*ph-abs(dx)*(1.35-.5*abs(dx))-.1+jag-fsE(.3,.5, abs(cx-id-.5));
  float e=(rh*fsE(.3,.45, ph)+.1)*fsE(.4,.8, z)*-uOwn[4]-.1-q.y, fan=dx/(max(e,.0)+.12);
  float sl=sat(.5-1.6*dx/(.12+abs(dx))*.3+.6*(noise(vec2(fan*5.+sd, q.y*5.))-.5)+.5*(noise(vec2(fan*13.+q.y*9., q.y*17.))-.5)+.3*(noise(q*vec2(50.,70.))-.5));
  vec3 k=fsRock(sl, e*.6,.8)+fsInk[3]*.05*sl;
  float a=fsE(-fsPx*z, fsPx*z, e);
  acc += left*a*mix(k, edge,1.-exp(-z*.06)); left *= 1.-a;

  }
 } while (j < 15 && left >= .01);
 return acc+left*sky;
}
vec3 render(vec2 p) {
 fsPx=1./max(uRes.y,1.);
 fsLights();
 fsSunC=fsDay*(uKind[3]*.7+.55)*2.1; fsAmb=fsDay*(fsSq(0)*.45+.1)+fsDusk*fsSq(1)*.08; fsRim=fsDusk*(uKind[3]+fsSq(2))*.9;
 fsT=mod(uTime,480.); fsWet=fsE(.0,5., fsT)*fsE(480.,475., fsT);
 vec3 c=vec3(.0);
 if (uVar > .5) {
  fsSoft=.19; fsMoon=normalize(vec3(-.55,.8,.1));
  c=fsTops(p);
 }
 else {
  fsSoft=.12; fsMoon=normalize(vec3(-.62,.62,.3));
  fsAt[0]=vec3(.0,.16,.16); fsAt[1]=vec3(-.03,.33,.06); fsAt[2]=vec3(-.25,.53,.0); fsAt[3]=vec3(.1,.43,-.03);
  fsInk[0] += vec3(.018,.026,.038);
  c=fsPlain(p);
 }
 return screenOf(c);
}
