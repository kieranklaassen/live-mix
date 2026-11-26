// name: Wood print
// a: Evening sea
// b: Rain on terraces
// what: A colour woodcut on a paper sheet: a bay at evening under a pale moon, islands, a pine branch across one corner, and a boat with a square sail; or rice fields in steps round a hill under ruled rain, the sky wiped dark at the top, a lit house at the head of one path and someone walking up it under a red umbrella.
// follows: Each block is a kind, fuller as it sounds: sea, sky, pine and islands, or banks, sky, rain and water. The low band rolls the waves or lifts the mist; a hit is a gust at sea or a passing shower, a cue inks the sky again. A paler stretch of water or field goes with the playhead; boat and walker go slowly on; keys light the window or lantern.
// A soft step that may run either way.
float wpM(float a,float b,float x) { x = sat((x - a)/(b - a)); return x*x*(3. - 2.*x); }
float wpPx,wpG,wpG2,wpAns; // one pixel,the plank's grain twice,how strongly it answers
vec2 wpHf; // half the size of the printed image
const vec3 wpC = vec3(.945,.91,.83);
float wpI(float d) { return wpM(.7*wpPx,-.7*wpPx,d); }
float wpL(float d,float w) { return wpM(w + .6*wpPx,w - .6*wpPx,abs(d))*min(1.,.35 + w/wpPx); }
// Where the playhead is, faded at both ends.
float wpNow(float x) { x = .5 + .5*x/wpHf.x - uLoop; return exp(-50.*x*x)*sat(6.*min(uLoop,1. - uLoop)); }
// Ink on what is printed.
vec3 wpP(vec3 c,vec3 ink,float d) { return c*mix(vec3(1.),ink,sat(d)); }
vec3 wpT(vec3 ink,int k,float lv) { return mix(ink,min(uKind[k]*1.05,1.),.34*lv); }
float wpS(vec2 p,vec2 a,vec2 b,float wa,float wb) {
 vec2 d = b - a; float h = sat(dot(p - a,d)/dot(d,d));
 return length(p - a - d*h) - mix(wa,wb,h);
}
float wpB(vec2 p,vec2 b) { vec2 d = abs(p) - b; return min(max(d.x,d.y),0.) + length(max(d,0.)); }
// A rounded hill with its own slope on each side.
float wpH(float x,float c,float l,float r,float h) {
 float u = (x - c)/(x < c ? l : r); u = max(1. - u*u,0.);
 return h*u*(.4 + .6*u);
}
// Small tree tops along a ridge.
float wpTrees(float x,float f) { return (abs(sin(x*f + 1.3*sin(x*f*.31))) + .6*abs(sin(x*f*1.73 + 2.)))/f; }
float wpGrain(vec2 p,vec2 k) {
 vec2 d = (p - k)*vec2(1.,2.6);
 float bend = .035*sign(d.y)*exp(-dot(d,d)*14.)*sqrt(sat(abs(d.y)*30.));
 float y = p.y - bend + .012*sin(p.x*2.3 + p.y*9.) + .006*sin(p.x*5.1);
 return .8 + .24*noise(vec2(p.x*2.,y*85.)) + .16*noise(vec2(p.x*5.,y*210.));
}
// The dark wiped in from the top of the sky; a cue inks it again, from side to side.
float wpWipe(float up,float from) {
 float w = wpM(from + .14*(.5 - uTone) - .1*uPad*wpAns,1.,up);
 float b = gl_FragCoord.x/uRes.x - 1.1 + 1.2*uCue;
 return w*(.5 + .55*w)*(.85 + .25*uPad*wpAns + .2*uCue)*wpG2 + (.06 + .5*w)*uCue*exp(-10.*b*b);
}
// One fan of pine needles. x: the flat of green, y: the needles.
vec2 wpFan(vec2 d,float R,float seed) {
 d = rot((hash11(seed) - .5)*1.1)*d;
 d.y *= 1.15;
 float r = length(d);
 if (r > R || r < 1e-5) return vec2(0.);
 float a = atan(d.x,d.y),c = a*21./PI,id = floor(c + .5);
 float L = R*(.72 + .28*hash11(id + seed*7.3));
 return vec2(wpM(R*.9,R*.7,r),wpL((c - id)*r*PI/21.,mix(.0011,.0005,r/R))*wpM(L,L - .006,r))*wpM(2.1,1.75,abs(a));
}
const vec4 wpBo[9] = vec4[9](vec4(.1,-.34,-.13,-.225),vec4(-.13,-.225,-.25,-.245),vec4(-.25,-.245,-.37,-.18),vec4(-.37,-.18,-.51,-.2),vec4(-.51,-.2,-.63,-.16),vec4(-.1,-.24,-.19,-.36),vec4(-.19,-.36,-.32,-.4),vec4(-.25,-.245,-.27,-.12),vec4(-.27,-.12,-.37,-.07));
const float wpTk[9] = float[9](34.,24.,17.,12.,7.,13.,8.,10.,6.);
const vec2 wpTu[18] = vec2[18](vec2(-.62,-.175),vec2(-.665,-.2),vec2(-.56,-.16),vec2(-.5,-.195),vec2(-.43,-.175),vec2(-.37,-.06),vec2(-.31,-.045),vec2(-.42,-.085),vec2(-.25,-.06),vec2(-.36,-.165),vec2(-.3,-.41),vec2(-.345,-.43),vec2(-.235,-.39),vec2(-.17,-.35),vec2(-.15,-.12),vec2(-.08,-.14),vec2(-.02,-.11),vec2(-.04,-.36));
vec3 wpPine(vec3 c,vec2 q,vec3 key) {
 if (q.x < -.78 || q.y < -.56) return c;
 float d = 1.;
 for (int i = 0; i < 9; i++) d = min(d,wpS(q,wpBo[i].xy,wpBo[i].zw,wpTk[i]*.001,wpTk[i]*.0006));
 vec2 f = vec2(0.);
 for (int i = 0; i < 18; i++) {
  float fi = float(i);
  vec2 o = q - wpTu[i] - .0024*vec2(sin(uTime*.7 + fi*.9),.5*sin(uTime*.53 + fi*1.7));
  if (abs(o.x) > .11 || abs(o.y) > .1) continue;
  for (int k = 0; k < 3; k++) {
   vec2 t = wpFan(o - (k == 0 ? vec2(0.,.018) : k == 1 ? vec2(.042,.002) : vec2(-.034,-.01)),.058 - .007*float(k) + .008*hash11(fi),fi*3. + float(k));
   f = vec2(max(f.x,t.x),max(f.y*(1. - .8*t.x),t.y));
  }
 }
 float bark = abs(sin(q.x*120. + 60.*d + 3.*sin(q.x*37.)));
 c = mix(c,wpP(vec3(.55,.42,.33),vec3(.6,.5,.5),wpM(-.004,-.03,d))*wpG,wpI(d + .0016));
 c = mix(c,key,max(wpL(d,.0016),wpI(d + .003)*wpM(.35,.1,bark)*.8));
 float tx = uTexture*wpAns;
 c = mix(c,mix(vec3(.62,.68,.52),wpT(vec3(.27,.43,.34),2,uTexture*.8),.5 + .5*tx)*wpG2,f.x*(.88 + .12*tx));
 return mix(c,vec3(.04,.12,.14),f.y);
}
// The boat, about .25 high. Everything is laid on c.
vec3 wpBoat(vec3 c,vec2 b,vec3 key) {
 if (abs(b.x) > .17 || b.y < -.06 || b.y > .27) return c;
 float fill = .012 + .07*uHits*(1. - uHits) + .004*sin(uTime*.6);
 float rope = max(wpL(wpS(b,vec2(-.135,.032),vec2(-.004,.246),0.,0.),.0007),wpL(wpS(b,vec2(.126,.045),vec2(.004,.246),0.,0.),.0007));
 c = mix(c,key,max(rope*.8,wpI(wpS(b,vec2(0.),vec2(0.,.253),.0032,.0022))));
 // the sail: strips of cloth, the sides bent by the wind, the foot dyed
 float u = (b.y - .135)/.092,wide = .066 - .004*u;
 vec2 s = b - vec2(fill*(1. - min(u*u,1.6)),.01*(1. - u)*(1. - min(b.x*b.x/.0049,2.)));
 float sd = wpB(s - vec2(0.,.135),vec2(wide,.092)),sail = wpI(sd);
 float lines = max(wpL(sd,.0013),sail*wpL((fract(s.x/wide*2.5 + .5) - .5)*wide/2.5,.0006));
 float dye = wpM(.17,.045,s.y)*.55 + .25*wpM(.01,.06,s.x);
 c = mix(c,wpP(vec3(.965,.925,.83),mix(vec3(.83,.5,.3),uKind[4],.25),dye*wpG + .75*uHits),sail);
 c = mix(c,key,lines*.9);
 // the one who steers, and the hull
 float man = min(length(b - vec2(-.1,.066)) - .0075,wpS(b,vec2(-.102,.03),vec2(-.1,.052),.012,.007));
 float hat = max(abs(b.x + .1) + (b.y - .079)*1.7,.069 - b.y) - .004;
 c = mix(c,vec3(.22,.3,.4),wpI(man));
 c = mix(mix(c,vec3(.9,.78,.52),wpI(hat)),key,wpL(hat,.0008));
 float top = .012 + 2.2*b.x*b.x + .35*max(b.x - .07,0.),bot = -.02 + 1.5*b.x*b.x;
 float hull = max(max(b.y - top,bot - b.y),abs(b.x) - .13 - .2*(b.y - .03)*sign(b.x));
 c = mix(c,mix(vec3(.6,.4,.26),vec3(.3,.2,.18),wpM(top,bot,b.y)*.8)*wpG,wpI(hull));
 c = mix(c,key,max(wpL(hull,.0013),wpI(hull)*wpL(b.y - top + .011,.0008)));
 // a lantern in the bow: the keys
 float lamp = length((b - vec2(.128,.083))*vec2(1.2,1.)) - .0085;
 c = mix(mix(c,mix(vec3(.93,.8,.6),vec3(1.,.8,.36),uKeys),wpI(lamp)),key,wpL(lamp,.0009));
 return c + vec3(.4,.22,.04)*uKeys*exp(-lamp*lamp*700.);
}
// A gull: white, dark at the tips.
vec3 wpGull(vec3 c,vec2 q,float flap,vec3 key,float on) {
 float x = abs(q.x),y = q.y - flap*x + (.5 + flap)*x*x*11.,th = .006*sat(1. - x/.05);
 float w = max(wpI(abs(y) - th)*wpI(x - .055),wpI(length(q*vec2(.55,1.) + vec2(0.,.002)) - .0065));
 return mix(mix(c,vec3(.98,.95,.88),w*on),key,max(wpL(y + th + .001,.0011)*wpI(x - .05),w*step(.038,x))*on);
}
vec3 wpSea(vec2 p) {
 float hw = wpHf.x,hh = wpHf.y,hor = -.015,fx = clamp(hw/.86,.5,1.25),mx = max(-.43*fx,.1 - hw),x = p.x/fx;
 vec3 key = vec3(.075,.13,.24),c = wpC;
 float pad = uPad*wpAns,phr = uPhrase*wpAns,dr = uDrone*wpAns;
 // the sky. The moon and the bars of cloud are left uncut
 vec2 q = p + vec2(.0016,-.0012);
 float up = max(q.y - hor,0.)/(hh - hor),sky = wpI(hor - p.y),moon = wpI(length(p - vec2(mx,.2)) - .058);
 vec2 k = p - vec2(.012*sin(uTime*.05),0.);
 k.x /= fx;
 float cl = wpS(k,vec2(-.75,.115),vec2(-.3,.115),.013,.013);
 cl = min(cl,wpS(k,vec2(-.58,.138),vec2(-.46,.138),.011,.011));
 cl = min(cl,wpS(k,vec2(-.45,.093),vec2(-.06,.093),.01,.01));
 cl = min(cl,wpS(k,vec2(.02,.21),vec2(.46,.21),.012,.012));
 cl = min(cl,wpS(k,vec2(.22,.187),vec2(.9,.187),.012,.012));
 float bare = (1. - moon)*(1. - .82*wpI(cl))*sky,rose = wpM(.5,0.,up);
 c = wpP(c,wpT(vec3(.97,.56,.4),1,uPad*.6),rose*rose*(.6 + .4*pad)*wpG*bare);
 c = wpP(c,wpT(vec3(.5,.74,.79),1,uPad*.4),wpM(.2,.62,up)*.62*wpG2*bare);
 c = wpP(c,wpT(vec3(.07,.18,.37),1,.3*uPad),wpWipe(up,.55)*bare);
 c = wpP(c,vec3(1.,.97,.88),moon*(1. - wpI(cl)));
 // the far range, wiped away at its foot
 float far = q.y - hor - max(max(wpH(x,.1,.34,.5,.06),wpH(x,-.13,.22,.3,.035)),wpH(x,.75,.42,.4,.075));
 c = wpP(c,wpT(vec3(.42,.46,.66),3,uPhrase*.6),wpI(far)*sky*(.28 + .5*wpM(-.05,0.,far) + .2*phr)*wpG);
 // the sea
 float s = max(hor - p.y,0.)/(hor + hh),foot = wpM(.4,1.,s);
 vec3 w = wpP(wpC,wpT(vec3(.48,.74,.75),0,uDrone*.6),(.5 + .4*dr)*wpG);
 w = wpP(w,vec3(.1,.29,.48),exp(-s*12.)*(.62 + .2*dr)*wpG2);
 w = wpP(w,wpT(vec3(.07,.2,.39),0,.35*uDrone),foot*(.5 + .5*foot)*(.82 + .3*dr)*wpG2);
 // what sounds lies on the water: across is the loop, towards us is the room
 vec4 m = piece(vec2(.5 + .5*p.x/hw,.06 + .88*s));
 w = mix(w,w*.45 + .6*m.rgb/max(m.a,.02)*(.35 + .65*dot(w,vec3(.333))),sat(m.a*(.5 + .8*uEnergy))*.5*wpM(.02,.15,s)*wpG);
 w = mix(w,wpC,.22*wpNow(p.x)*wpM(1.,.2,s));
 // a gust: a dark patch that runs over the water
 vec2 gq = p - vec2((.25 - uHits)*fx,-.235);
 float gust = uHits*wpM(1.,.35,length(gq*vec2(2.4,9.)));
 w = wpP(w,vec3(.1,.22,.36),gust*.5);
 // the moon on the water: lens-shaped cuts left as paper
 float dk = 25.*pow(s,.6),di = floor(dk),dh = hash11(di + 3.),slope = 15./pow(max(s,.004),.4)/(hor + hh);
 float dx = (p.x - mx + (dh - .5)*.05*(.3 + s) + .004*sin(uTime*(.3 + .2*dh) + dh*40.))/((.02 + .085*s)*(.45 + .75*hash11(di + 11.)));
 float lens = (abs(dk - di - .5) - .34*(1. - dx*dx))/slope;
 w = mix(w,vec3(.97,.9,.74),wpI(lens)*step(abs(dx),1.)*wpM(0.,.012,s)*wpM(1.,.55,s)*(.8 + .2*uMic));
 // the carved lines of the waves: blue ones printed, white ones cut
 float row = floor(22.*pow(s,.59)),ln = 0.,wl = 0.;
 for (int i = -1; i <= 1; i++) {
  float r = row + float(i) + .5;
  if (r < 0.) continue;
  float t = r/22.,near = pow(t,1.7),sp = (hor + hh)*.076*pow(t,.7),h1 = hash11(r*1.7);
  float fr = mix(100.,13.,sqrt(near))*(.85 + .3*h1),ph = p.x*fr + h1*40. - uTravel*(.3 + .2*h1),lag = ph*.31 + h1*9. + uTravel*.05;
  float b = .5 + .5*sin(lag),a = .5 + .5*sin(ph + .9*sin(lag*1.7) + .4*sin(ph));
  a *= a;
  float d = p.y - hor + (hor + hh)*near - sp*((.35 + .8*uLow)*a*(.2 + .8*b) + .35*b - .4);
  float gap = max(wpM(.35,.7,.4 + .5*sin(p.x*fr*.17 + h1*31. - uTravel*.04) + .3*a*b),gust);
  ln = max(ln,wpL(d,(.0005 + .0022*near)*gap*(.4 + .9*a))*wpM(.02,.25,gap));
  float th = (.0004 + .0026*near)*wpM(.3,.9,a*(.3 + .7*b))*wpM(.1,.6,gap);
  wl = max(wl,wpL(d + sp*.17,th)*wpM(0.,.0006,th));
 }
 w = mix(w,wpC,wl*(.75 + .25*uHigh));
 w = mix(w,mix(vec3(.09,.24,.43),key,foot),ln*.85);
 c = mix(w,c,sky);
 // the headland, an island and two rocks
 float hi = max(max(wpH(x,-.83,.3,.44,.115),wpH(x,-.5,.2,.22,.045)),max(max(wpH(x,.36,.12,.17,.085),wpH(x,.49,.14,.12,.05)),max(wpH(x,.12,.028,.022,.032),wpH(x,.165,.014,.02,.016))));
 float top = hor + hi + wpTrees(x,210.)*wpM(.012,.04,hi) - .004,base = hor - .012*wpM(0.,.05,hi) - .002;
 q = p + vec2(.0018,.0014);
 float land = wpI(max(q.y - top,base - q.y));
 c = mix(c,wpC,land);
 c = wpP(c,wpT(vec3(.26,.4,.45),3,uPhrase),land*(.55 + .35*phr)*wpG);
 c = wpP(c,vec3(.2,.3,.42),land*wpM(0.,.09,q.y - base)*.7*wpG2);
 float fc = x*46. + (top - p.y)*14.,fh = hash11(floor(fc) + 5.),fl = (top - p.y - .012 - .02*fh)/(.012 + .04*fh);
 c = mix(c,key,.75*wpL((fract(fc) - .5)/46.,.0011*wpM(0.,.2,fl)*wpM(1.,.3,fl))*step(0.,fl)*step(fl,1.)*wpM(base,base + .012,p.y));
 c = mix(c,key,wpL(p.y - top,.0011)*step(base,p.y)*wpM(.004,.01,hi));
 c = mix(c,wpC,wpL(p.y - base + .003 + .0012*sin(x*60. + uTravel),.0018)*wpM(.008,.02,hi));
 // a far sail
 vec2 b = p - vec2(.02*sin(uTime*.013) - .2*fx,hor - .018);
 float sd = wpB(b - vec2(.002,.019),vec2(.008,.0135));
 c = mix(mix(c,wpC,wpI(sd)),key,max(wpL(sd,.0007),wpI(wpS(b,vec2(-.013,.001),vec2(.014,.001),.0022,.0022))));
 // the boat, slowly across
 b = (p - vec2(mix(-hw - .2,hw + .2,fract(uTravel*.013 + .3)),-.17 + .003*sin(uTime*.9) + .003*uLow*sin(uTime*.5)))*1.3;
 vec2 br = vec2(b.x + .006*sin(b.y*160. + uTime*.8),-b.y - .1);
 c = mix(c,wpC,.35*wpI(wpB(br,vec2(.06,.08)))*wpM(.13,-.07,br.y)*wpI((abs(fract(br.y*34. + .2*sin(p.x*30.)) - .5) - .27)/34.));
 c = wpBoat(c,rot(.02*sin(uTime*.45))*b,key);
 // one gull far off, and one that answers a hit
 c = wpGull(c,(p - vec2(.02*fx + .06*sin(uTime*.04),.11 + .012*sin(uTime*.07)))*1.7,.55 + .2*sin(uTime*1.1),key,1.);
 c = wpGull(c,p - vec2((.2*uHits - .25)*fx,.14 - .12*uHits),.65 + .25*sin(uHits*9.),key,wpM(0.,.25,uHits));
 return wpPine(c,(p - wpHf)/min(1.,.25 + .87*hw),key);
}
float wpCrest(float x) { return mix(-.3,.1,wpM(-.95,.2,x)) + .06*wpM(.1,.9,x) + .006*sin(x*9. + 1.); }
float wpWay(float y) { return .16 + .3*sin(y*6.4 + .15)*wpM(.14,-.4,y); }
vec3 wpRain(vec2 p) {
 float hw = wpHf.x,hh = wpHf.y,fx = clamp(hw/.86,.45,1.25),x = p.x/fx;
 vec3 key = vec3(.1,.14,.2),c = wpC;
 float pad = uPad*wpAns,dr = uDrone*wpAns,phr = uPhrase*wpAns,tx = uTexture*wpAns,mist = .08*uLow + .06*uSpace - .03;
 // the sky, wiped dark at the top
 vec2 q = p + vec2(.0015,-.0013);
 float up = sat((q.y + .02)/(hh + .02));
 c = wpP(c,wpT(vec3(.6,.74,.77),1,.5*uPad),(.3 + .5*wpM(.1,.6,up))*wpG);
 c = wpP(c,wpT(vec3(.1,.14,.22),1,.25*uPad),wpWipe(up,.5 + .04*sin(p.x*3.1 + 1.) + .02*sin(p.x*7.3)));
 // hills behind, flat and grey, lost in mist at the foot, and the valley floor
 float m1 = wpH(x,-.5,.7,.5,.25) + wpH(x,-.1,.3,.4,.1) + .5*wpTrees(x,160.),m2 = .04 + wpH(x,.55,.6,.6,.23) + wpTrees(x,130.),m3 = -.03 + wpH(x,-.9,.2,.5,.13) + wpTrees(x,150.);
 c = wpP(c,wpT(vec3(.44,.54,.64),1,.5*uPad),wpI(q.y - m1)*(.1 + .65*wpM(.04 + mist,.24,q.y))*wpG);
 q = p + vec2(-.0013,.0015);
 c = wpP(c,vec3(.28,.4,.47),wpI(q.y - m2)*.8*wpM(.08 + mist,.25,q.y)*wpG2);
 c = wpP(c,vec3(.26,.4,.44),wpI(q.y - m3)*.85*wpM(-.05 + mist,.1,q.y)*wpG);
 float vy = sat((-.06 - p.y)/.3),vv = 7.*sqrt(vy) + .3*sin(x*9.),vf = fract(vv) - .5;
 c = wpP(c,wpT(vec3(.5,.66,.5),0,uDrone),wpM(0.,.1,vy)*(.2 + .5*step(0.,vf)*vf*2.)*wpG);
 c = mix(c,vec3(.3,.42,.42),wpM(.02,.3,vy)*.6*wpL(vf*sqrt(vy + .001)/11.6,.0007));
 // cedars: five down in the mist, five on the hill
 float S = wpCrest(x);
 for (int i = 0; i < 10; i++) {
  float fi = float(i),h = hash11(fi + 2.),cx = (i < 5 ? -.74 + .048*fi : .5 + .055*(fi - 5.)) + .016*h,ht = (i < 5 ? .15 : .23)*(.7 + .45*h);
  vec2 t = vec2((x - cx)*fx,p.y - (i < 5 ? -.12 : wpCrest(cx) - .01))/ht;
  if (abs(t.x) > .3 || t.y < -.1 || t.y > 1.1) continue;
  float tier = 1. - fract(t.y*8. + h*3. + (t.x > 0. ? .4 : 0.)),d = max(abs(t.x) - .17*pow(sat(1. - t.y),.75)*(.6 + .5*tier),t.y - 1.);
  float low = i < 5 ? wpM(.05,.7,t.y - 1.5*mist) : 1.;
  c = mix(c,mix(c,vec3(.1,.2,.22)*wpG,.95*low),wpI(d*ht));
 }
 // the hill: steps that bow round it
 float land = wpI(p.y - S),bright = 0.;
 if (p.y < S + 2.*wpPx) {
  float Y = p.y - .2*(x - .42)*(x - .42) + .016*sin(x*6.5 + p.y*5. + .5) + .01*sin(x*13. + p.y*9.) + .005*sin(x*24. - p.y*14.);
  float T = max((.165 - Y)/.8,.002),v = 15.*pow(T,.8) + .3,dv = 15.*.8*pow(T,-.2)/.8,n = sat((.16 - p.y)*1.6);
  float id = floor(v),f = v - id,h = hash11(id + 4.),lip = .63 + .19*sin(x*4.3 + id*2.1);
  float d1 = (f - lip)/dv,d0 = (.5 - abs(f - .5))/dv,isB = wpM(-.7,.7,d1/wpPx),bk = sat((f - lip)/(1. - lip));
  // water, pale, darker at its far edge; low walls cut each step into fields
  float kw = mix(9.,3.,n),k = (x - .42)/(.3 + .8*T)*3.2 + h*7.,kd = floor(k),kh = hash21(vec2(kd,id));
  float wall = (.5 - abs(fract(k) - .5))*(.3 + .8*T)/3.2*fx - .0015 - .004*n;
  vec3 w = wpP(wpC,wpT(vec3(.55,.75,.8),3,.5*uPhrase),(.1 + .4*kh + .6*wpM(.6,0.,f/lip))*(.75 + .4*phr)*wpG);
  vec4 m = piece(vec2(.5 + .5*p.x/hw,.04 + .92*n));
  w = mix(w,w*(.5 + .75*m.rgb/max(m.a,.02)),sat(m.a*(.4 + .8*uEnergy))*.7);
  w = mix(w,wpC,.3*wpNow(p.x));
  // young rice
  float s1 = (x - .42)/(.3 + .8*T)*60.,ry = f/lip*3.;
  float tick = wpL((fract(s1) - .5)/60.*(.3 + .8*T),.0012*(.2 + n))*wpI((abs(fract(ry) - .5) - .28)*lip/3./dv)*step(.45,kh);
  w = mix(w,vec3(.28,.44,.33),tick*.85*wpM(.03,.2,n));
  // the banks, green, hatched
  vec3 gr = wpT(mix(vec3(.56,.64,.4),vec3(.34,.52,.42),h),0,.8*uDrone);
  vec3 bank = wpP(wpP(wpC,gr,(.75 + .35*dr)*wpG2),vec3(.16,.3,.33),bk*(.45 + .35*dr)*wpG);
  float hc = p.x*70./(.3 + n) + .8*sin(p.x*21.);
  bank = mix(bank,vec3(.1,.2,.2),.75*wpL((fract(hc + .4*bk) - .5)/70.*(.3 + n),.0011*(.3 + n))*step(.15 + .6*hash11(floor(hc + .4*bk) + id),bk)*wpM(.08,.25,n));
  w = mix(w,bank,max(isB,wpI(wall)));
  w = mix(w,key,.85*max(wpL(wall,.0006)*(1. - isB),max(wpL(d1,.0005 + .0005*n),wpL(d0,.0007 + .0012*n))));
  // the path, winding up
  float way = abs(p.x - wpWay(p.y)*fx) - .007 - .06*n*n;
  w = mix(w,wpP(wpC,vec3(.86,.74,.58),(.55 + .35*bk)*wpG),wpI(way));
  w = mix(w,key,max(wpL(way,.0007 + .0009*n),wpI(way)*wpL(d0,.0006)*.7));
  c = mix(mix(c,w,land),key,wpL(p.y - S,.0009));
 }
 // the house at the head of the path, its window lit
 vec2 ho = vec2((x - .27)*fx,p.y - .085)/1.25;
 if (abs(ho.x) < .14 && abs(ho.y - .04) < .12) {
  float wall = wpB(ho - vec2(0.,.016),vec2(.058,.018)),win = wpB(ho - vec2(-.014,.014),vec2(.026,.012));
  c = mix(mix(c,vec3(.6,.48,.38),wpI(wall)),key,wpL(wall,.0009));
  c = mix(c,mix(vec3(.93,.74,.42),vec3(1.,.84,.45),sat(uKeys + uLevel)),wpI(win));
  c = mix(c,key,max(wpL(win,.0008),wpI(win)*wpL(min(abs(fract((ho.x + .04)/.013) - .5)*.013,abs(ho.y - .014)),.0004)));
  float ry = (ho.y - .03)/.05,rw = mix(.083,.036,pow(sat(ry),.7)),roof = max(abs(ho.x) - rw,max(-ry,ry - 1.)*.05);
  vec3 th = wpP(wpC,vec3(.5,.42,.34),(.75 + .5*wpM(1.,0.,ry))*wpG2);
  c = mix(mix(c,mix(th,key,.5*wpL((fract(ho.x/rw*11.) - .5)*rw/11.,.0004)),wpI(roof)),key,wpL(roof,.001));
  float ridge = wpS(ho,vec2(-.038,.081),vec2(.038,.081),.0045,.0045);
  c = mix(mix(c,vec3(.3,.27,.26),wpI(ridge)),key,wpL(ridge,.0008));
  ho -= vec2(-.014,.012);
  c += vec3(.3,.18,.04)*(.25 + .75*uKeys)*exp(-dot(ho,ho)*500.);
 }
 // someone under an umbrella walks up
 float on = fract(uTravel*.011 + .25),wy = mix(-.62,.07,on),z = .3 + 1.7*sat(.1 - wy);
 vec2 u = (p - vec2(wpWay(wy)*fx,wy))/z;
 if (abs(u.x) < .06 && abs(u.y - .05) < .08) {
  on = wpM(1.,.93,on);
  float body = min(wpS(u,vec2(-.001,.027),vec2(0.,.05),.0115,.0085),min(wpS(u,vec2(-.005,0.),vec2(-.004,.02),.0025,.005),wpS(u,vec2(.005,.005),vec2(.004,.02),.0025,.005))),cap = max(length(u - vec2(0.,.032)) - .05,.055 - u.y + 4.*u.x*u.x);
  c = mix(c,vec3(.2,.28,.4),wpI(body*z)*on);
  c = mix(c,wpP(vec3(.8,.36,.24),vec3(.8,.5,.4),wpM(.02,-.02,u.x)),wpI(cap*z)*on);
  c = mix(c,key,on*max(wpL(cap*z,.001),wpI(cap*z)*wpL((fract(u.x/(.09 - u.y)*3.5) - .5)*.01*z,.0005)));
 }
 // ruled rain, one block of it left as paper; a hit is a shower that crosses
 float gx = p.x - p.y*.2 - .6*hw + 1.3*hw*uHits,gst = exp(-16.*gx*gx)*uHits;
 for (int i = 0; i < 3; i++) {
  float fi = float(i),n = 62. - 15.*fi;
  vec2 r = rot(.16 + .025*fi)*p;
  float ci = floor(r.x*n),h = hash11(ci + 40.*fi + 300.),h2 = hash11(ci*1.3 + fi*17. + 91.),len = .35 + .35*tx + .5*gst;
  float a = fract(r.y*(.9 + .5*h2) + uTime*(.035 + .03*h) + h2*9.);
  float l = wpL((fract(r.x*n) - .5 - (h - .5)*.7)/n,.00045 + .0003*h + .0006*gst)*wpM(0.,.06,a)*wpM(len + .04,len,a);
  c = mix(c,i == 1 ? wpC : vec3(.2,.25,.32),l*(.38 + .35*tx + .35*gst));
 }
 return wpP(c,vec3(.35,.42,.5),gst*.4);
}
vec3 render(vec2 p) {
 wpPx = max(fwidth(p.y),1e-4);
 wpHf = vec2(.5*uRes.x/uRes.y,.5) - .032;
 wpAns = .6 + .8*uEnergy;
 wpG = wpGrain(p,vec2(.36,.27)); wpG2 = wpGrain(vec2(3.1 - p.x,p.y + 3.1),vec2(3.5,2.85));
 float fr = wpB(p,wpHf),fib = .975 + .033*noise(p*vec2(90.,260.));
 vec3 c = wpC;
 if (fr < .006) c = mix(c,uVar < .5 ? wpSea(p) : wpRain(p),wpI(wpB(p + vec2(.0016,.0014),wpHf) + .0012*sin(p.x*23.)*sin(p.y*31. + 1.)));
 c = mix(c,vec3(.08,.13,.22),wpL(fr,.0013)*.9);
 return c*fib;
}
