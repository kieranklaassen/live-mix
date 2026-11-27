// name: Thin air
// a: Edge of space
// b: Dawn launch
// what: At the edge of space a great clear balloon, slack below, hangs at the left with the sun in its folds and a small box on a thread, high above clouds on a curved blue earth; or a snow plain at dawn, where a tall bubble of film stands on a limp train that lies along the snow and climbs in an S, with three people and a red lamp.
// follows: Drone and pad fill the gas and smooth its folds; drone lights the thin air or the dawn, pad glows in the film, texture crinkles film and snow. The phrase sways the thread or the train, the bands light sixteen gores, the piece tints the clouds or the snow. A hit flashes at the foot and runs up one seam, a cue is the sun coming up, keys light small lamps.
// own: 0 night at -1, late sun or sunrise at 1; 1 bare desert at -1, a floor of cloud or a sea of mist at 1; 2 slack, the bubble low, at -1, blown full and round at 1; 3 smoke-black film at -1, gold film at 1; 4 far off and small at -1, close at 1; 5 northern lights at -1, seven other balloons at 1; 6 a bunch of small round balloons at -1, at 1 squat and lobed, its gores dyed in the sounds' colours; 7 broad pale day lower down at -1, at 1 from straight above (b: peaks behind)
#define TA_BUNCH max(-uOwn[6], 0.)
#define TA_PUMP max(uOwn[6], 0.)
#define TA_DAY max(-uOwn[7], 0.)
#define TA_TOP max(uOwn[7], 0.)
float taOff(float lo,float hi,float x) { return 1. - smoothstep(lo,hi,x); }
float taPx,taNight,taRed,taSlack,taFull,taDark,taGold; // a pixel, then the world
vec3 taSun,taUp,taDown,taBack;  // light on the film
float taTall,taSunA; // the height of the crown, which way round the sun stands
vec3 taBy(vec3 low,vec3 mid,vec3 high,float q) { return q<0. ? mix(mid,low,-q) : mix(mid,high,q); }
float taBy(float low,float mid,float high,float q) { return q<0. ? mix(mid,low,-q) : mix(mid,high,q); }
float taIn(float d,float w) { return taOff(-w,w,d); }
// Noise on cells that come round, fine after a day of travel.
float taNoise(vec2 p) {
 vec2 i=floor(p),f=p - i,j=mod(i + 1.,512.);
 i=mod(i,512.); f=f*f*(3. - 2.*f);
 return mix(mix(hash21(i),hash21(vec2(j.x,i.y)),f.x),mix(hash21(vec2(i.x,j.y)),hash21(j),f.x),f.y);
}
float taFbm(vec2 p,float fine) {
 float s=.5*taNoise(p); p=rot(.6)*p*2.03 + 5.3;
 s+=.27*taNoise(p); p=rot(.6)*p*2.07 + 3.1;
 s+=.15*mix(.5,taNoise(p),fine);
 if (fine<=.1) return s + .04;
 p=rot(.6)*p*2.11 + 1.7;
 return s + .08*mix(.5,taNoise(p),fine*fine - .01);
}
// The dye of a gore, its edge as soft as a pixel; where gores are finer than that, all of them together.
vec3 taDip(float i) { return pow(kindColour(mod(i,5.)),vec3(1.7))*1.3; }
vec3 taDye(float u,float soft,float all) {
 float i=floor(u),f=u - i - .5,s=min(soft,.5);
 vec3 c=mix(taDip(mod(i,all)),taDip(mod(i + (f<0. ? -1. : 1.),all)),.5*smoothstep(.5 - s,.5,abs(f)));
 vec3 m=pow((uKind[0] + uKind[1] + uKind[2] + uKind[3] + uKind[4])*.2,vec3(1.7))*1.3;
 return mix(c,m,smoothstep(.35,1.,soft));
}
// The clear film, far wall then near wall. x is -1 to 1 across, v foot to crown, r the half width, up the lean of the wall.
void taFilm(inout vec3 col,float x,float v,float r,float up,float loose,float cover,float glintAt) {
 if (cover<=0.) return;
 x=clamp(x,-.999,.999);
 float th=asin(x),wide=sqrt(1. - x*x),lean=sqrt(max(1. - up*up,.02));
 float pix=taPx / (max(r,.002)*max(wide,.12));
 vec3 tint=mix(mix(vec3(1.),vec3(.1,.095,.12),taDark),vec3(1.1,.68,.22),taGold);
 for (int k=0; k<2; k++) {
  float nearer=float(k),a=(k==0 ? PI - th : th) + .1*sin(uTime*.05);
  vec2 c=vec2(cos(a),sin(a));
  float w1=noise(c*1.7 + vec2(v*2.3,-v*1.6) + 9.) - .5,w2=noise(c*5. + vec2(-v*5.,v*4.1 + uTime*.02) + 31.) - .5;
  // slack folds, heavier at the left
  float heavy=.65 - .35*c.y,f1=a*9. + w1*6.5*loose + 2.*sin(a*2. + 1.)*loose,f2=a*23. + w1*9. + w2*5.;
  float far1=taOff(.7,2.6,pix*9.),far2=taOff(.6,2.4,pix*23.);
  float fold=loose*heavy*(1.05*sin(f1) + .35*sin(2.*f1 + 1.))*far1 + (.16 + .42*loose*(.9 + w1))*sin(f2 + .6*sin(f2))*far2;
  // sixteen gores and their seams
  float u=a*32. / TAU,g=fract(u + .5) - .5,soft=pix*32. / TAU,gore=taOff(.35,1.,soft);
  float crease=g;
  if (uOwn[6]>0.) crease*=1. - sat(6.*uOwn[6])*smoothstep(.5 - min(soft*1.5,.4),.5,abs(g));
  fold+=(.3 + .35*taFull + .75*TA_PUMP)*crease*2.*gore;
  float crinkle=(noise(vec2(a*17.,v*11.) + 5.*w1) - .5)*(.22 + .9*uTexture)*taOff(.3,1.2,pix*17.);
  float turn=th + (k==0 ? -fold : fold)*.8 + crinkle*.6;
  float face=abs(cos(turn))*lean,thick=1. / (face + .1);
  float band16=uBands[int(mod(floor(u + .5),16.))]*taOff(.4 - soft,.5,abs(g))*gore;
  float seam=taOff(0.,.02 + soft,.5 - abs(g))*gore*mix(.35,1.,nearer);
  float to=cos(turn - taSunA),hot=pow(abs(to),mix(21.,39.,uTone))*(1. - .6*up*up);
  float side=.5 + .5*sin(th)*sign(taSunA);
  vec3 amb=mix(taDown,taUp,smoothstep(-.7,.9,up + v*.5 - .2));
  vec3 lit=amb*(.55 + .1*thick) + taSun*(.1 + .55*side*side)*(.35 + .65*abs(to));
  float body=sat(.008 + .03*max(thick - 1.,0.))*mix(.75,1.,nearer);
  body=sat(body + .4*seam + .1*loose*heavy*(.5 + .5*sin(f1 + 1.8))*far1);
  body=max(body,.35*smoothstep(.9,2.6,pix*9.));
  lit+=taBack*(.25 + .5*uPad)*(.3 + .9*side*side);
  lit=(lit + uKind[1]*(uVar<.5 ? .12 : .5)*uPad*sat(1. - abs(v - .7)))*tint;
  if (uOwn[6]>0.) { tint=mix(tint,taDye(u + .5,soft,640.),uOwn[6]); lit=mix(lit,(lit + .12)*tint,uOwn[6]); body=mix(body,max(body,.72),uOwn[6]); }
  vec3 ray=taSun*tint*hot*(.4 + .16*thick)*mix(.4,.85,nearer)*(.3 + .8*side);
  ray+=mix(taUp*2.,kindColour(mod(floor(u + .5),16.) / 4.),.65)*band16*(.3 + uEnergy)*mix(.05,.12,nearer)*(uVar<.5 ? 1. : 2.2)*(1. - .7*taDark);
  // a hit runs up one seam
  float run=v - glintAt,on=exp(-abs(a - .35*sign(taSunA))*mix(3.5,14.,sat(v)))*(exp(-run*run*45.) + .16*taOff(-.1,.1,run))*nearer*uHits;
  ray+=(uKind[4]*.5 + .8)*on*2.2;
  // frost in patches
  body+=.1*uTexture*taOff(0.,.2,abs(w2 + .1*noise(vec2(a*60.,v*90.))))*taOff(.3,.75,v);
  body+=.045*loose*loose*heavy;
  body=mix(body,max(body,.85),taDark); body=mix(body,max(body,.5),taGold);
  col=mix(col,col + (lit - col)*body + ray,cover);
 }
}
// The balloon's half width at height y, the crown above 0, the tail down to -len.
float taPear(float y,float len,float fill) {
 float s=sat(1. + y / len),tail=mix(.5 - .5*cos(PI*pow(s,1.25)),sin(.5*PI*pow(s,1.1)),fill);
 return y>0. ? sqrt(max(1. - y*y / (taTall*taTall),0.)) : mix(.028,1.,tail);
}
// A bunch of small balloons round mid, their strings to one hand.
void taBunch(inout vec3 col,vec2 p,vec2 mid,float size,vec2 hand) {
 for (int i=18; i>=0; i--) {
  float f=float(i),a=f*2.39996 + .6,h=hash11(f + 2.3),rr=sqrt((f + .4) / 19.);
  vec2 c=mid + size*vec2(1.05*rr*cos(a),.95*rr*sin(a)) + size*.04*vec2(sin(uTime*.21 + f),sin(uTime*.17 + f*1.7));
  float rad=size*(.22 + .11*h)*(1. + .1*uBands[i>15 ? 3 : i])*smoothstep(0.,.6,TA_BUNCH);
  vec2 d=hand - c,o=p - c;
  float k=sat(dot(o,d) / max(dot(d,d),1e-4)),st=length(o - d*k - vec2(.012*sin(k*PI)*sin(f),0.));
  col=mix(col,uVar<.5 ? taSun*.7 : taUp*.25,taIn(st - .0009,taPx)*.6*TA_BUNCH);
  o /= max(rad,1e-3);
  o.y*=o.y<0. ? .82 : 1.;
  float l=dot(o,o);
  if (l>1.2) continue;
  float z=sqrt(max(1. - l,0.)),s=sign(taSunA),rim=1. - z;
  vec3 n=vec3(o,z),dye=kindColour(mod(f*2.,5.));
  dye*=dye*1.1;
  dye=mix(dye,vec3(.2,.19,.22),taDark); dye=mix(dye,vec3(1.,.72,.3),taGold);
  float di=sat(dot(n,vec3(.72*s,.35,.6))),hi=pow(sat(dot(n,vec3(.5*s,.52,.69))),mix(20.,60.,uTone));
  vec3 c3=dye*(taUp*.8 + taDown*.35*sat(-n.y) + taSun*(.15 + .75*di) + taBack*(1. + 2.*uPad)*(1. - .5*z));
  c3+=dye*taSun*.5*pow(sat(-o.x*s*.6 - o.y*.5 + .2),2.) + taSun*hi*(.55 + 1.2*uHits) + uKind[4]*.25*uHits*rim;
  col=mix(col,c3,taIn(sqrt(l) - 1.,taPx / max(rad,1e-3))*(.8 + .2*rim));
 }
}
// One balloon from straight above: gores round the crown.
void taCrown(inout vec3 col,vec2 q,float size,float glint) {
 float r=length(q),a=atan(q.y,q.x + 1e-6) + .02*uTime,on=TA_TOP;
 if (r>1.1) return;
 float u=a*24. / TAU,g=fract(u) - .5,soft=taPx*24. / (TAU*size*max(r,.03)),id=mod(floor(u),24.);
 float edge=1. - .03*(1. - taFull)*(noise(vec2(cos(a),sin(a))*3. + 4.) + noise(vec2(cos(a),sin(a))*7.)) - .015*(1. - 4.*g*g);
 float z=sqrt(max(1. - r*r,0.)),far=taOff(.3,1.,soft);
 float w=noise(vec2(cos(a),sin(a))*4. + r*2.) - .5,fold=(1. - .7*taFull)*r*sin(u*TAU*.5 + 9.*w)*.5 + g*1.6*far*sqrt(r);
 vec3 n=normalize(vec3(q + fold*vec2(-q.y,q.x)*.8,z + .25));
 vec3 tint=mix(mix(vec3(1.),vec3(.1,.095,.12),taDark),vec3(1.1,.68,.22),taGold);
 if (uOwn[6]>0.) tint=mix(tint,taDye(u,soft*1.5,24.),uOwn[6]);
 float di=sat(dot(n,vec3(.75,.3,.5))),hot=pow(sat(dot(n,normalize(vec3(.75,.3,1.2)))),mix(24.,50.,uTone));
 float b=uBands[int(mod(id,16.))]*taOff(.4 - soft,.5,abs(g))*far;
 vec3 lit=(taUp + taDown*.4 + taSun*(.12 + .8*di) + kindColour(mod(id,16.) / 4.)*b*.5*(.3 + uEnergy) + taBack*uPad)*tint;
 float seam=taOff(.0,.03 + soft,.5 - abs(g))*far*smoothstep(.06,.2,r),thick=1. / (z + .12);
 float body=sat(.2 + .06*thick + .45*seam + .3*di*r + .55*smoothstep(.0,.5,abs(fold) - .2)*r);
 body=max(body,.85*taOff(.085,.095,r)); body=mix(body,max(body,.85),max(taDark,max(taGold*.8,TA_PUMP)));
 float ring=abs(r - .1);
 lit*=1. - .5*taOff(.004,.02,ring);
 float run=r - glint;
 vec3 c=mix(col,lit,body) + taSun*tint*hot*.6;
 c=mix(c,uKind[4],uHits*exp(-run*run*14.)*(.6 + .4*seam));
 col=mix(col,c,taIn(r - edge,taPx / size)*on);
}
// The whole balloon, q in its own size.
void taBalloon(inout vec3 col,vec2 q,float size,float len,float fill,float loose,float lean,float glintAt) {
 if (q.y>taTall||q.y<-len - .05||abs(q.x)>1.35) return;
 float v=sat((q.y + len) / (len + taTall)),low=taOff(-.5,.1,q.y);
 float px=q.x - lean*low*(1. - .8*taOff(-len,-.8*len,q.y))*(1. + .6*sin(q.y*3. + .15*uTime));
 float r=taPear(q.y,len,fill),e=.02,dr=(taPear(q.y + e,len,fill) - taPear(q.y - e,len,fill)) / (2.*e);
 float left=noise(vec2(v*9.,3. + uTime*.03)) - .5,right=noise(vec2(v*7.,17. - uTime*.03)) - .5;
 r*=1. + loose*(.5*mix(left + .1,right - .04,smoothstep(-1.,1.,px / r)))*taOff(.35,.7,v)*smoothstep(0.,.1,v);
 float cs=1. / sqrt(1. + dr*dr),cover=taIn((abs(px) - r)*cs,taPx / size);
 cover*=1. - max(TA_BUNCH,TA_TOP);
 float folds=loose*mix(.12,1.,taOff(.25,.75,v));
 taFilm(col,px / max(r,.004),v,r*size,clamp(-dr*cs,-.97,.97),folds,cover,glintAt);
}
void taWorld() {
 taPx=1. / uRes.y;
 taNight=max(-uOwn[0],0.); taRed=max(uOwn[0],0.);
 taSlack=max(-uOwn[2],0.); taFull=max(uOwn[2],0.);
 taDark=max(-uOwn[3],0.); taGold=max(uOwn[3],0.);
}
vec3 taStars(vec2 p) {
 vec2 i=floor(p),q=fract(p) - .5 - .3*(hash22(i + 3.) - .5);
 return vec3(.8,.9,1.)*step(.97,hash21(i))*taOff(.02,.22,length(q))*hash21(i + 8.);
}
// Northern light: hanging curtains, y above their foot.
vec3 taAurora(float x,float y) {
 float on=max(-uOwn[5],0.);
 if (on<=0.||y<-.05) return vec3(0.);
 vec3 c=vec3(0.);
 for (int i=0; i<2; i++) {
  float f=float(i),bend=.1*sin(x*(3.1 + f) + .05*uTime + 2.*f) + .05*sin(x*7.3 - .07*uTime + f);
  float foot=y - .05 - .05*f - .35*bend,rays=noise(vec2(x*34. + 60.*bend,.16*uTime + f*9.)),broad=noise(vec2(x*3. + .04*uTime,f + 4.));
  float l=smoothstep(-.012,.02,foot)*exp(-max(foot,0.)*(7. + 6.*rays))*(.25 + .75*rays)*smoothstep(.15,.75,broad);
  c+=l*mix(vec3(.16,.9,.5),vec3(.65,.2,.6),smoothstep(.02,.22,foot));
 }
 return c*on*(.5 + .35*uPhrase);
}
// Other balloons, far off, up to seven.
void taFleet(inout vec3 col,vec2 p,float lift,float from) {
 float many=max(uOwn[5],0.);
 for (int i=0; i<7; i++) {
  float f=float(i),on=sat(many*7. - f);
  if (on<=0.) break;
  float h=hash11(f + 3.7),size=mix(.1,.026,hash11(f + 9.1));
  vec2 c=vec2(from + .82*fract(f*.618 + .22),lift + .1 + .22*h + .006*sin(uTime*.09 + f*2.));
  if (uVar<.5&&uOwn[7]>0.) c=mix(c,vec2(-.8 + 1.6*fract(f*.618 + .5),-.42 + .84*fract(f*.382 + .31 + .1*h)),uOwn[7]);
  vec2 q=(p - c) / size;
  if (uVar<.5&&uOwn[7]>.5) {
   float l=length(q),an=atan(q.y,q.x + 1e-6);
   col=mix(col,(mix(taUp,taSun,.5 + .4*q.x) + .1)*(.8 + .2*cos(an*12.)*l),taIn(l - .8,taPx / size)*on*(.45 + .5*l*l));
   continue;
  }
  if (abs(q.x)>1.1||q.y>taTall||q.y<-4.6) continue;
  float r=taPear(q.y,1.9,.25),cv=taIn(abs(q.x) - r,taPx / size)*step(-1.9,q.y)*on;
  float x=clamp(q.x / max(r,.01),-1.,1.),side=.5 + .5*x*sign(taSunA);
  col=mix(col,mix(taUp,taSun,side*side)*(.8 + .2*sin(asin(x)*9. + f + q.y)),cv*(.25 + .5*pow(abs(x),3.) + .3*side*side));
  float th=taIn(abs(q.x) - .02,taPx / size)*step(q.y,-1.9)*step(-4.2,q.y);
  float bx=taIn(max(abs(q.x),abs(q.y + 4.25)) - .12,taPx / size);
  col=mix(col,taSun*.8,max(th*.35,bx)*on);
 }
}
vec3 taEdge(vec2 p) {
 float view=uOwn[4],across=smoothstep(.25,.8,.5*uRes.x / uRes.y);
 float gas=.5*uPad + .5*uDrone;
 vec3 warm=taBy(vec3(.5,.6,.85),vec3(1.,.78,.62),vec3(1.,.5,.25),uOwn[0]);
 float day=1. - .8*taNight;
 // the earth, a ball seen from high above it
 float dip=.307 + .006*gas + .05*view*view - .11*TA_DAY,h=1. / cos(dip) - 1.;
 float hor=-.15 + taBy(.1,0.,-.08,view),pitch=-dip - atan(hor);
 if (uOwn[7]>0.) pitch=mix(pitch,-1.47,uOwn[7]);
 vec3 rd=normalize(vec3(p,1.));
 rd.yz=rot(pitch)*rd.yz;
 float cam=1. + h,b=cam*rd.y,disc=b*b - (cam*cam - 1.);
 float alt=sqrt(max(cam*cam - b*b,0.)) - 1.;   // how high this line of sight passes
 if (rd.y>0.) alt=h + .5*rd.y*rd.y;
 alt=max(alt,0.);
 float edge=sqrt(max(cam*cam - 1.,0.));
 vec3 high=taBy(vec3(.006,.009,.025),vec3(.005,.012,.042),vec3(.014,.01,.05),uOwn[0]);
 vec3 airC=taBy(vec3(.05,.12,.3),vec3(.12,.34,.8),vec3(.4,.2,.42),uOwn[0]);
 vec3 rimC=taBy(vec3(.2,.42,.7),vec3(.75,.92,1.),vec3(1.,.62,.3),uOwn[0]);
 if (uOwn[7]<0.) { high=mix(high,taBy(vec3(.02,.04,.1),vec3(.12,.27,.55),vec3(.35,.3,.42),uOwn[0]),TA_DAY); airC=mix(airC,airC*.6 + .22,TA_DAY); rimC=mix(rimC,rimC*.5 + .35,TA_DAY); }
 vec3 sky=high*(1.15 - .6*uLevel) + airC*(.2*exp(-alt*45.) + .6*exp(-alt*130.));
 sky+=mix(rimC,uKind[0] + .3,.35*uDrone)*exp(-alt*330.)*(.75 + 1.1*uDrone);
 sky+=taStars(p*70.)*smoothstep(.02,.12,alt)*(.1 + .8*taNight);
 sky=sky*(1. - .5*max(-uOwn[5],0.)) + taAurora(p.x,p.y - hor + .17*p.x*p.x);
 vec3 col=sky;
 if (disc>0.&&rd.y<0.) {
  float t=-b - sqrt(disc);
  vec3 P=vec3(0.,cam,0.) + rd*t;
  float ang=atan(P.z,P.y),far=sat(t / edge),fine=taOff(.35,.95,far);
  vec2 q=vec2(P.x,ang + .0016*uTravel + .0004*uTime)*120.;
  vec2 w=q + 1.6*vec2(noise(q*.22) - .5,noise(q*.22 + 40.) - .5);
  float big=noise(w*.11 + 3.)*.65 + noise(w*.27 + 8.)*.35;
  vec2 r=rot(.55)*w;
  float street=.5 + .5*sin(r.x*2.3 + 3.*noise(r*vec2(.3,.12)));
  float thr=taBy(.74,.47,.18,uOwn[1]);
  vec2 so=vec2(.22,.12);
  float n0=taFbm(r*vec2(1.3,.9),fine),n1=taFbm((r + so)*vec2(1.3,.9),fine);
  float add=.2*street*taOff(.35,.75,big) + .36*(big - .5);
  float dens=mix(smoothstep(thr,thr + .2,n0 + add),.45,smoothstep(.55,.9,far));
  float rise=clamp((n0 - n1)*4.5,-1.,1.)*(1. - smoothstep(.5,.9,far));
  vec3 base=taBy(vec3(.008,.016,.04),vec3(.018,.085,.2),vec3(.1,.05,.11),uOwn[0]);
  if (uOwn[1]<0.) base=mix(base,mix(vec3(.3,.15,.08),vec3(.62,.4,.23),noise(r*vec2(.5,.3) + 20.))*(.8 + .5*rise)*(.5 + .5*warm)*day,-uOwn[1]);
  vec3 lit=taBy(vec3(.16,.21,.33),vec3(.8,.86,.92),vec3(.95,.56,.4),uOwn[0]);
  vec3 shade=taBy(vec3(.03,.05,.1),vec3(.22,.36,.56),vec3(.22,.13,.26),uOwn[0]);
  vec3 cloud=mix(shade,lit,sat(.45 + .9*rise + .25*dens));
  // the piece lies as tints on the cloud floor
  vec4 m=piece(vec2(sat(.5 + p.x / 1.7),sat(.08 + .95*(1. - (hor - p.y) / (hor + .52)))));
  vec3 hue=m.rgb / max(m.a,.05);
  cloud=mix(cloud,cloud*(.45 + 1.1*hue) + .08*hue,sat(m.a*1.3)*(.5 + .5*uEnergy));
  base+=.05*m.rgb;
  vec3 gnd=mix(base,cloud,dens*.96);
  // night towns
  if (taNight>0.) {
   vec2 tg=q*5.;
   gnd+=vec3(1.,.7,.35)*taNight*(1. - dens)*step(.9,hash21(floor(tg)))*taOff(.1,.5,length(fract(tg) - .5))*smoothstep(.5,.7,noise(q*.4 + 60.))*fine;
  }
  float haze=pow(far,mix(5.,2.6,uSpace))*.9;
  vec3 hz=mix(airC*1.2,rimC,.25 + .5*far)*(.75 + .35*uDrone);
  col=mix(gnd,hz,haze);
  col*=mix(vec3(.72,.78,.9),1. + .45*warm,smoothstep(-.7,.8,p.x));
  float lim=1. - sqrt(max(cam*cam - b*b,0.));
  col+=mix(rimC,uKind[0] + .3,.35*uDrone)*exp(-lim*260.)*(.4 + .6*uDrone);
  col=mix(sky,col,smoothstep(0.,2.2*edge*taPx,lim));
 }
 // light on the film
 taSunA=.95;
 taSun=warm*mix(1.,.55,taNight)*1.15;
 taUp=high*3. + airC*.35; taDown=taBy(vec3(.1,.15,.28),vec3(.5,.66,.85),vec3(.6,.36,.36),uOwn[0]);
 taBack=warm*.22*day;
 taFleet(col,p,-.02,0.);
 float size=.31*taBy(.5,1.,1.55,view);
 vec2 mid=vec2(mix(-.02,-.25,across) + taBy(.06,0.,.04,view),taBy(.22,.3,.47,view));
 if (uOwn[7]>0.) { mid=mix(mid,vec2(-.1*across + .28*view,.02 + .1*view),uOwn[7]); size*=1. + .12*uOwn[7]; }
 if (uOwn[6]<0.) mid=mix(mid,vec2(mid.x,mid.y - .1 + .03*view),-uOwn[6]);
 mid.x+=.004*sin(uTime*.07);
 float fill=sat(.16*gas - .22*taSlack + .75*taFull),loose=sat(.82 - .3*gas + .3*taSlack - .6*taFull);
 float len=1.6 + .45*taSlack - .3*taFull;
 if (uOwn[6]>0.) { fill=mix(fill,1.,uOwn[6]); loose*=1. - .85*uOwn[6]; len=mix(len,.8,uOwn[6]); taTall=mix(taTall,.66,uOwn[6]); size*=1. + .12*uOwn[6]; mid.y-=.12*uOwn[6]; }
 // the thread and its box
 vec2 foot=mid - vec2(0.,size*len);
 float tl=.2*taBy(.8,1.,.75,view)*(1. - .5*taSlack),down=(foot.y - p.y) / tl;
 float sway=(.012 + .05*uPhrase)*sin(uTime*.5),bow=sway*down*down + .01*sin(down*4. + uTime*.31)*down;
 float thr=abs(p.x - foot.x - bow);
 float sizeB=.017*taBy(.75,1.,1.4,view);
 float seen=1. - TA_TOP;
 col=mix(col,taSun*.95,taIn(thr - .0011,taPx)*step(0.,down)*step(down,1.)*.8*seen);
 // a folded parachute
 float chute=max(thr - .0045 - .002*sin(down*60.),abs(down - .16)*tl - .022);
 col=mix(col,vec3(.8,.34,.16)*(1. + 70.*(p.x - foot.x - bow))*day,taIn(chute,taPx)*seen);
 vec2 bq=p - foot + vec2(-sway - .01*sin(4. + uTime*.31),tl + sizeB*.6);
 bq=rot(.16*sin(uTime*.23) + sway*2.)*bq / sizeB;
 float box=max(abs(bq.x) - .62,abs(bq.y) - .55);
 vec3 bc=mix(taDown*.55,taSun*.95,step(.22,bq.x)*(.9 - .2*bq.y))*(1. - .5*taIn(abs(bq.y + .1) - .1,.08));
 float panel=max(abs(bq.x + .02) - 1.75,abs(bq.y + .2 + .05*bq.x) - .26);
 col=mix(col,mix(vec3(.05,.09,.2),taSun*.7,smoothstep(.6,1.8,bq.x)),taIn(panel,taPx / sizeB)*seen);
 col=mix(col,bc,taIn(box,taPx / sizeB)*seen);
 for (int i=0; i<3; i++) {
  vec2 lp=bq - vec2(-.4 + .4*float(i),-.62);
  col+=(uKind[3]*.6 + .5)*exp(-dot(lp,lp)*5.)*(.12 + 1.5*uKeys*(.5 + .5*sin(uTime*2. + 2.1*float(i))) + uMic)*seen;
 }
 if (uOwn[6]<0.) taBunch(col,p,mid,size*1.02,foot);
 if (uOwn[7]>0.&&uOwn[6]>=0.) taCrown(col,(p - mid) / size,size,mix(1.2,.1,uHits));
 taBalloon(col,(p - mid) / size,size,len,fill,loose,-.12 - .1*taSlack,mix(1.2,.12,uHits));
 float spark=length(p - foot - vec2(0.,.02));
 col+=(uKind[4]*.6 + .6)*uHits*uHits*(.8*exp(-spark*45.) + .22*exp(-spark*10.))*seen;
 // a cue: the sun comes over the shoulder
 vec2 sp=p - mid - size*vec2(.9,.48);
 float sd=length(sp),star=exp(-abs(sp.x*.8 + sp.y*.6)*90.) + exp(-abs(sp.x*.6 - sp.y*.8)*120.);
 col+=uCue*warm*(1.2*exp(-sd*38.) + .3*exp(-sd*7.) + .35*star*exp(-sd*11.));
 return screenOf(col*1.55);
}
// b: the train of film comes along the snow, turns up and climbs to the bubble.
float taWide(float s) { return .013 + (.016 + .024*taSlack)*noise(vec2(s*11.,3.)) + .006*noise(vec2(s*37.,uTime*.11)); }
vec3 taLaunch(vec2 p) {
 float view=uOwn[4],across=smoothstep(.25,.8,.5*uRes.x / uRes.y);
 float bx=mix(.06,.2,across),zoom=taBy(.6,1.,1.5,view),gas=.5*uPad + .5*uDrone;
 vec2 eye=vec2(bx,taBy(-.12,0.,.1,view));
 p=(p - eye) / zoom + eye; taPx /= zoom;
 float hor=-.16,day=1. - .8*taNight;
 vec3 pink=taBy(vec3(.3,.38,.6),vec3(1.,.56,.46),vec3(1.,.52,.2),uOwn[0]);
 vec3 zen=taBy(vec3(.008,.013,.035),vec3(.035,.075,.19),vec3(.09,.19,.34),uOwn[0]);
 vec3 midS=taBy(vec3(.02,.035,.08),vec3(.24,.24,.37),vec3(.5,.42,.4),uOwn[0]);
 vec3 lowS=taBy(vec3(.05,.1,.15),vec3(.95,.46,.36),vec3(1.,.62,.28),uOwn[0]);
 if (uOwn[7]<0.) {
  zen=mix(zen,taBy(vec3(.05,.07,.12),vec3(.4,.52,.68),vec3(.4,.5,.6),uOwn[0]),TA_DAY);
  midS=mix(midS,taBy(vec3(.06,.08,.13),vec3(.72,.78,.84),vec3(.85,.74,.6),uOwn[0]),TA_DAY);
  lowS=mix(lowS,lowS*.25 + taBy(vec3(.1),vec3(.72,.76,.8),vec3(.6),uOwn[0]),TA_DAY);
 }
 float el=max(p.y - hor,0.),glow=exp(-length((p - vec2(-.8,hor))*vec2(.7,1.6))*1.6);
 vec3 sky=mix(zen,midS,exp(-el*4.5));
 sky=mix(sky,lowS,exp(-el*(8. - 2.5*uDrone))*(.2 + .75*glow + .35*uDrone));
 sky+=pink*.22*glow*day;
 sky+=taStars(p*66.)*taNight*smoothstep(.02,.25,el);
 sky=sky*(1. - .6*max(-uOwn[5],0.)) + taAurora(p.x + .4,(p.y - hor)*.7 - .02);
 vec3 col=sky;
 // low hills a long way off
 for (int i=0; i<2; i++) {
  float f=float(i),top=hor + (.05 - .026*f)*noise(vec2(p.x*(2.2 + 2.*f) + 7.*f,f)) + .008*noise(vec2(p.x*14.,f + 4.));
  col=mix(col,mix(midS*.75,sky,.55 - .25*f)*mix(1.,.8,f),taIn(p.y - top,taPx));
 }
 if (uOwn[7]>0.) for (int i=0; i<3; i++) {
  float f=float(i),x=p.x*(2.1 + .5*f) + 5.3*f + 1.1,n=0.,a=.5,y=p.y - hor;
  for (int j=0; j<4; j++) { n+=a*(1. - abs(2.*noise(vec2(x,f*7. + float(j)*3.)) - 1.)); x=x*2.17 + 3.; a*=.46; }
  float top=TA_TOP*(.13 + .62*n*n*(.95 - .24*f)*(1. - .55*exp(-pow(abs(p.x - bx + .1),2.)*9.)*(.4 + .3*f))),d=top - y;
  if (d<-taPx) continue;
  float w=noise(vec2(p.x*5. + f*3.,d*4.)),sk=p.x*9. + 3.*w,fl=abs(2.*noise(vec2(sk + d*7.,d*2. + f)) - 1.),fr=abs(2.*noise(vec2(sk + .3 + d*7.,d*2. + f)) - 1.);
  float lit=smoothstep(-.14,.2,fr - fl + .06*(noise(vec2(p.x*60.,d*24.)) - .5));
  float rock=smoothstep(.5,.72,.55*noise(vec2(p.x*46. + d*20.,y*11. + f)) + .45*noise(vec2(p.x*17. - d*9.,y*7.)) + .16*(.5 - lit) - .3*exp(-d*12.) + .05);
  vec3 c=mix(mix(midS*.38,zen*.5,.5),mix(midS,lowS*1.1 + .06,.55) + pink*.3*day,lit);
  c=mix(c,(midS*.12 + .012)*(.7 + .9*lit),rock*.85);
  col=mix(col,mix(c,mix(midS,lowS,.5),.62 - .27*f + (.38 + .27*f)*exp(-max(y,0.)*26.)),taIn(-d,taPx));
 }
 // the snow
 vec3 shade=taBy(vec3(.03,.045,.09),vec3(.21,.25,.41),vec3(.27,.24,.34),uOwn[0]);
 vec3 bright=taBy(vec3(.1,.14,.24),vec3(.86,.54,.5),vec3(1.,.68,.42),uOwn[0]);
 if (uOwn[7]<0.) { shade=mix(shade,shade*.6 + .36,TA_DAY); bright=mix(bright,bright*.3 + .7,TA_DAY); }
 if (p.y<hor) {
  float z=.12 / (hor - p.y + .004);
  vec2 w=vec2(p.x*z*2.2,z*1.6),q=rot(.35)*w;
  float near=taOff(.4,2.6,z);
  float n0=taFbm(q*vec2(1.2,7.5),near),n1=taFbm((q + vec2(-.11,.035))*vec2(1.2,7.5),near);
  float rise=clamp((n0 - n1)*4.,-1.,1.)*mix(.35,1.,near);
  vec2 lee=vec2(-.2,.35),q1=q*vec2(4.,27.),q2=q*vec2(9.,80.);
  float graze=.3 + .3*rise + .34*glow - .12*p.x;
  if (near>0.) graze+=(.55 + .6*uTexture)*near*(noise(q1) - noise(q1 + lee));
  if (z<1.1) graze+=.5*taOff(.4,1.1,z)*(noise(q2) - noise(q2 + lee));
  graze=sat(graze);
  vec3 snow=mix(shade,bright,graze);
  vec3 earth=mix(vec3(.07,.055,.06),vec3(.4,.24,.16),graze*graze + .25*n0)*mix(vec3(1.),pink*1.3,.4)*day;
  snow=mix(snow,earth,max(-uOwn[1],0.)*smoothstep(.15,.4,n0 + .2));
  // the piece lies as tints on the snow
  vec4 m=piece(vec2(sat(.5 + p.x / 1.7),sat((hor - p.y) / .34)));
  vec3 hue=m.rgb / max(m.a,.05);
  snow=mix(snow,snow*(.35 + 1.2*hue) + .06*hue,sat(m.a*1.6)*(.5 + .45*uEnergy));
  col=mix(snow,lowS*.75 + midS*.2,exp(-(hor - p.y)*26.));
 }
 // light on the film
 taSunA=-.95; taSun=pink*1.5; taUp=zen*.8 + midS*.75; taDown=mix(shade,bright,.3); taBack=pink*.24*day;
 taFleet(col,p - vec2(bx - .15,0.),.02,-.75 - .3*TA_PUMP);
 // the train
 float size=.142*taBy(.78,1.,2.,uOwn[2]),my=taBy(.1,.272,.22,uOwn[2]),yc=-.205,rb=.085,len=1.9 + .2*taSlack - .5*taFull;
 taTall=taBy(1.6,1.25,.9,uOwn[2]);
 float fill=sat(.06 + .12*gas - .2*taSlack + .8*taFull),loose=sat(.85 - .25*gas + .2*taSlack - .5*taFull);
 if (uOwn[6]>0.) { fill=mix(fill,1.,uOwn[6]); loose*=1. - .85*uOwn[6]; len=mix(len,.85,uOwn[6]); taTall=mix(taTall,.68,uOwn[6]); size*=1. + .6*uOwn[6]; my-=.07*uOwn[6]; }
 float gy=yc - rb,glint=mix(1.2,-1.2,uHits);
 float sway=.018*sin(uTime*.23) + .05*uPhrase*sin(uTime*.55);
 float end=bx - .72;
 // its shadow
 float lie=gy + .018*(noise(vec2(p.x*5.,1.)) - .5)*smoothstep(0.,.2,bx - rb - p.x);
 float sh=(p.y - lie + .02) / .016;
 sh=exp(-sh*sh)*smoothstep(end - .03,end + .05,p.x)*taOff(bx - .05,bx + .28,p.x);
 col=mix(col,shade*.5,.75*sh*(1. - TA_BUNCH));
 float s,x,r,up=0.,cv;
 if (p.y>yc) {
  float k=sat((p.y - yc) / (.34 - .16*taSlack)),win=16.*k*k*(1. - k)*(1. - k);
  float cx=bx + win*(1. - .75*taFull)*(.04*(1. - .3*taSlack)*sin(TAU*k + .4) + sway*sin(4.*k + .3*uTime));
  float yy=(p.y - my) / size,e=.02;
  s=yc - p.y;
  float pear=taPear(yy,len,fill),dr=(taPear(yy + e,len,fill) - taPear(yy - e,len,fill)) / (2.*e),tw=taWide(s)*taOff(0.,.95,yy + len*.5);
  float left=noise(vec2(p.y*17.,3. + uTime*.03)) - .5,right=noise(vec2(p.y*14.,17. - uTime*.03)) - .5;
  r=-smin(-pear*size,-tw,.012)*step(0.,taTall - yy);
  r*=1. + loose*.3*mix(left,right,smoothstep(-1.,1.,(p.x - cx) / max(r,.002)))*taOff(-.4,.5,yy);
  x=(p.x - cx) / max(r,.001); up=clamp(-dr / sqrt(1. + dr*dr),-.97,.97);
  cv=taIn((abs(p.x - cx) - r)*sqrt(1. - up*up),taPx)*step(.0004,r)*(1. - TA_BUNCH);
  float v=(yy + len) / (len + taTall);
  taFilm(col,x,v,r,up,loose*mix(.12,1.,taOff(.25,.75,v)),cv,glint);
 } else {
  float d;
  vec2 o=p - vec2(bx - rb,yc);
  if (o.x>0.) { float a=atan(-o.y,o.x + 1e-5); d=length(o) - rb; s=a*rb; }
  else { d=lie - p.y; s=rb*1.5708 - o.x; }
  r=taWide(s)*(1. + .3*smoothstep(.1,.3,s))*smoothstep(end - .01,end + .06,p.x);
  cv=taIn(abs(d) - r,taPx)*step(.0008,r)*(1. - TA_BUNCH);
  float v0=(yc - my) / size,v=(v0 + len) / (len + taTall) - s / (size*(len + taTall))*.5;
  taFilm(col,d / max(r,.001),v,r,0.,loose,cv,glint);
 }
 if (uOwn[6]<0.) taBunch(col,p,vec2(mix(bx,end + .42,-uOwn[6]),my - .06),size*1.5,vec2(end,gy + .02));
 // the box at its foot, its red lamp, three people
 vec2 bp=p - vec2(end - .005,gy + .006);
 col=mix(col,mix(shade*.35,pink*.7,step(bp.x,-.006)),taIn(max(abs(bp.x) - .012,abs(bp.y) - .012),taPx));
 col=mix(col,shade*.4,taIn(max(abs(bp.x) - .0012,abs(bp.y - .024) - .014),taPx));
 vec2 lp=bp - vec2(0.,.04);
 float beat=.65 + .35*sin(uTime*.8),ld=length(lp);
 col=mix(col,vec3(1.,.12,.06)*(.7 + .8*beat),taIn(ld - .0042,taPx));
 col+=vec3(1.,.1,.05)*beat*(.5*exp(-ld*60.) + .13*exp(-length(bp*vec2(1.,3.) + vec2(0.,.06))*18.))*(1. + uMic);
 col+=(uKind[4]*.7 + .5)*uHits*uHits*(exp(-length(bp)*34.) + .35*exp(-length(bp*vec2(1.,2.))*8.));
 if (uOwn[7]<0.) col=mix(col,uKind[4]*uKind[4],sat(TA_DAY*uHits*(exp(-length(bp)*14.) + .8*exp(-length(bp*vec2(.2,1.6))*8.))));
 for (int i=0; i<3; i++) {
  float f=float(i);
  vec2 m=vec2(i==0 ? end - .05 : i==1 ? end + .065 : bx - .16,gy - .016 - .008*f),d=p - m;
  float man=min(length(vec2(d.x,max(abs(d.y - .009) - .007,0.))) - .0036,length(d - vec2(0.,.0215)) - .003);
  float shd=length(vec2(max(abs(d.x - .024) - .022,0.),(d.y + .001)*1.6)) - .002;
  col=mix(col,shade*.55,.6*taIn(shd,2.*taPx));
  col=mix(col,mix(vec3(.03,.03,.05),pink*.8,taOff(-.003,0.,d.x)),taIn(man,taPx));
 }
 // the keys light a row of small lamps on the snow
 float kx=(p.x - bx) / .12,ki=floor(kx);
 vec2 kp=vec2((kx - ki - .5)*.12,p.y - gy + .055);
 if (ki<3.&&ki>-6.) col+=vec3(1.,.75,.4)*exp(-dot(kp*vec2(1.,1.4),kp)*22000.)*(.06 + 1.6*uKeys*(.5 + .5*sin(uTime*1.7 + ki*2.1)));
 // mist on the snow
 float mh=taBy(.012,.036,.1,uOwn[1]),my0=hor + taBy(0.,-.004,-.06,uOwn[1]);
 float fog=(p.y - my0) / mh;
 fog=exp(-fog*fog);
 if (fog>.01) {
  fog*=smoothstep(.2,.75,taFbm(vec2(p.x*2.2 + .012*uTime,p.y*9. - .006*uTime),1.) + .1 + .1*uSpace);
  col=mix(col,(mix(midS,lowS,.4 + .4*glow)*1.15 + .07*day),sat(fog*taBy(.3,.95,1.2,uOwn[1])));
 }
 // a cue: the rim of the sun over the far hills
 vec2 cp=p - vec2(-.66*across - .12,hor + .016);
 float cd=length(cp);
 col+=(uCue + .75*taRed)*pink*(1.6*exp(-cd*34.) + .5*exp(-length(cp*vec2(.5,1.5))*6.))*vec3(1.,.9,.75);
 return screenOf(col*1.45);
}
vec3 render(vec2 p) {
 taWorld();
 taTall=uVar<.5 ? .92 : 1.25;
 return uVar<.5 ? taEdge(p) : taLaunch(p);
}
