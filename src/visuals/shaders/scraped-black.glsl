// name: Scraped black
// a: Lone shell
// b: Unlit stair
// what: A plate worked to a velvet black, and every light scraped back out of its burr by hand: one snail shell on a faint ledge, a bright window on its shoulder, its mouth dark; or six worn stair treads that climb from the lower left into the black, each a soft lit lip, inside the pale line of the plate's edge.
// follows: Drone burnishes the ground; pad widens the greys; texture roughens the burr; a phrase lifts the dark edge, or lights the stair tread by tread. The piece lies on ledge or treads, the bands are sixteen scrapes, the loop turns the light. A hit is a burnished stroke that fills in; a cue opens the highlight or a light above; keys are pins, a voice lifts the dark.
// own: 0 1 a tall spire (b: many low steps), -1 a flat coiled disc (b: a few great blocks); 1 1 cut in ruled lines as an engraving, -1 smooth, with hardly a grain; 2 1 the plate wiped pale, the thing drawn dark on it, -1 the light stands behind: a low disc (b: an open door at the top); 3 1 inked in the colours of the sounds, -1 lit from within; 4 1 still water that mirrors it, -1 rippled sand to a skyline (b: snow lying on the treads); 5 1 seen from above, -1 from the side (b: from low in front); 6 1 rows of many shells, -1 a strewn handful (b: 1 bowed wide like the seats of a theatre, -1 thin slabs that float); 7 1 ribbed and spined (b: a winding stair), -1 sawn open, hollow (b: the treads broken apart and slid aside)
float sbK; // how fast the shell grows with its turning
vec3 sbT; // its tube at the mouth: out from the axis, down from the tip, radius
float sbRib,sbSaw,sbPale,sbBack,sbLamp,sbDye; // the own numbers: ribs, sawn, pale, light behind, light within, colour
vec3 sbV,sbHue; // towards the eye, in the shell's own frame; the colour of what is seen
vec2 sbRule; // which way the engraver's lines go there, and how far they are bent
float sbAt; // how far the saw has got
vec3 sbL; // towards the light
float sbHalf,sbPx,sbGain,sbGap; // half the picture's width, a pixel, how strongly things answer, the groove between whorls

float sbBell(float x) { return exp(-x*x); }
// The burr a rocker raised, 0 to 1: four passes of fine teeth at four angles, fixed to the screen.
float sbBurr(vec2 fc) {
 vec2 q=fc/max(1.,uRes.y/760.);
 float h=.0;
 for (int i=0; i<4; i++) {
  vec2 c=rot(.31+.785*float(i))*q;
  h+=noise(c*vec2(.25,1.27)+31.7*float(i));
 }
 return smoothstep(1.1,2.9,h);
}
// One stroke of the burnisher from a to b: a lens of light with the tool's own streaks in it.
float sbStroke(vec2 p,vec2 a,vec2 b,float wide) {
 vec2 d=b-a; float l2=dot(d,d),t=dot(p-a,d)/l2;
 float off=dot(p-a,vec2(-d.y,d.x))/sqrt(l2)+wide*1.2*t*(1.-t);
 float w=wide*sqrt(max(4.*t*(1.-t),.0));
 return (1.-smoothstep(w*.35-sbPx,w+sbPx,abs(off)))*smoothstep(.0,.1,t)*(1.-smoothstep(.5,1.,t))*(.72+.28*noise(vec2(t*5.,off/wide*5.)));
}

// Towards the shell: distance; how far along the spiral (over 0.5: 1 the mouth, 2 the lip); the place across the tube.
vec4 sbShell(vec3 q) {
 float r=length(q.xz)+1e-5,th=atan(-q.z,q.x+1e-5),cap=th>.0?-1.:.0;
 vec2 cone=vec2(1.-.75*max(uOwn[0],.0),1.);
 float f=floor(log(max(length(uOwn[0]>.0?vec2(r,q.y)*cone:vec2(r,q.y)),.003)/(uOwn[0]>.0?length(sbT.xy*cone):length(sbT.xy)))/(TAU*sbK)-th/TAU);
 vec4 best=vec4(1e3,.0,.0,.0);
 sbGap=1e3;
 for (int i=0; i<2; i++) {
  float n=min(f+float(i),cap),ph=th+TAU*n,s=exp(sbK*ph);
  vec2 c=vec2(r-sbT.x*s,(q.y+sbT.y*s)*.88);
  float d=length(c)-sbT.z*s;
  if (sbRib>.0&&d<.4*s) {
   float a=atan(c.y,c.x+1e-5),kn=.5+.5*cos(ph*7.);
   d-=sbT.z*s*sbRib*(.05*cos(ph*14.)+.36*kn*kn*kn*kn*kn*(sbBell((a-.75)/.24)+.6*sbBell((a+.35)/.2)));
  }
  if (sbSaw>.0&&d<.15) { // hollow, with a bowed wall every so often
   float wall=.03*s,cell=abs(fract(ph*2.1+.6*dot(c,c)/(s*s))-.5)/2.1*length(c+vec2(sbT.x*s,.0))-.016*s;
   d=min(abs(d+wall)-wall,ph<-1.1?max(cell,d):1e3);
  }
  if (i==1&&n>f) sbGap=abs(d-best.x)/s;
  if (d<best.x) best=vec4(d,ph,c/(sbT.z*s));
 }
 // the mouth: a dark plate across the end of the tube, and the lip round it
 vec2 m=vec2(q.x-sbT.x,(q.y+sbT.y)*.88);
 float e=length(m)-sbT.z;
 float plate=length(vec2(max(e,.0),q.z))-.012,lip=length(vec2(e-.02,q.z+.012))-.034;
 if (sbSaw>.0) { plate+=2.*sbSaw; lip+=2.*sbSaw; }
 if (plate<best.x) best=vec4(plate,1.,m/sbT.z);
 if (lip<best.x) best=vec4(lip,2.,m/sbT.z);
 if (sbSaw>.0) best.x=max(best.x,dot(q+vec3(.0,.72*sbT.y,.0),sbV)-sbAt);
 return best;
}

// The other grounds a shell can lie on: pale, lit from behind, sand, water, or the plate seen flat from above.
float sbOther(vec2 p,vec2 c,vec2 u,float was,float on,float pool,float m,float floorY,float front,float flatly,float sand,float water,float size) {
 vec2 lit=p-vec2(-.22,.14),low=p-vec2(c.x-.1,floorY);
 vec4 pm=piece(vec2(.5+p.x/1.75,.5-p.y));
 pm*= 1.-smoothstep(.62,.87,abs(p.x));
 float wide=exp(-dot(lit,lit)*(2.4-1.2*uSpace)),mw=sat(pm.a)*sbGain,hz=floorY+.15,yH=hz-p.y;
 float lay=mix(step(.0,yH),1.,flatly); // 1 on the ground, 0 on the wall or the sky
 vec2 sh=mix((u-vec2(.5,-.52))/vec2(1.,.16),(u-vec2(.3,-.26))/vec2(.9,.82),flatly);
 float shadow=exp(-dot(sh,sh)*dot(sh,sh))*(1.0 - smoothstep(.85, 1.25,max(abs(u.x),abs(u.y))-.6*(1.-flatly)));
 float grit=noise(p*vec2(9.,60.)+3.);
 // black: flat, then sand, then water
 float g=mix(was,(wide*(.13+.16*uDrone)*(1.-.8*max(uOwn[1],.0))+(.1+.2*wide)*mw)*(.75+.5*grit)*(1.-.92*shadow),flatly);
 // pale: a sheet, or a shelf against a wall
 float shelf=mix(.84-.1*(1.-wide),mix(.5,.9,on),(1.0 - smoothstep(floorY+.03, floorY+.06,p.y)));
 float sheet=mix(shelf-.2*m*on,.9-.1*(1.-wide)-.22*mw*(.6+.4*grit),flatly);
 sheet+=.05*(uDrone-.3)*wide;
 sheet*= 1.-.62*shadow*mix(on,1.,flatly);
 g=mix(g,sheet,sbPale);
 // the light behind: a low disc and its glow, which the ground takes up
 if (sbBack>.0) {
  float r=length(p-mix(vec2(c.x-.13,floorY+.17),vec2(.0),flatly)),R=mix(.23,.3,flatly);
  float glow=exp(-max(r-R,.0)*4.2);
  float sun=(1.0 - smoothstep(R-.012, R+.012,r))*(.62+.14*uLevel+.1*uCue+.12*(noise(p*vec2(3.,9.)+uTravel*.01)-.5))+glow*glow*(.2+.18*uDrone);
  float floor_=exp(-pow(abs(low.x)/.45,2.))*(.16+.25*uDrone+.3*m)*smoothstep(front-.004,front+.004,p.y)*(.6+.5*grit);
  g=mix(g,mix(sun,floor_*(1.-.8*shadow),mix((1.0 - smoothstep(floorY+.044, floorY+.05,p.y)),.0,flatly)),sbBack*(1.-.45*sbPale));
 }
 if (sand>.0) {
  float z=.2/(max(yH,.0)+.03),far=smoothstep(.0,.1,yH);
  vec2 w=mix(vec2(low.x*z*4.,z*4.),p*vec2(4.,12.),flatly);
  float ph=w.y*5.5+3.2*noise(w*vec2(.45,.6)+5.)+1.2*noise(w*1.3),rip=cos(ph)+.35*cos(2.*ph+.7);
  float lamp=mix(exp(-dot(low*vec2(1.7,1.3),low*vec2(1.7,1.3))*2.2),wide,flatly),mz=mix(sat(piece(vec2(.5+p.x/1.75,sat(1.-(p.y+.5)/max(hz+.5,.05)))).a)*sbGain,mw,flatly);
  float s=(.3+.2*uDrone+.3*mz)*lamp+.05;
  s=mix(s,.8-.24*mz-.12*(1.-lamp),sbPale)*mix(1.,.84+.42*rip*mix(1.,.45,sbPale),mix(far,1.,flatly))*(.85+.3*grit);
  s*= 1.-mix(.94,.6,sbPale)*shadow;
  s=mix(s,s*(.4+.8*far)+(1.-far)*.22,sbBack);
  float sky=mix(mix(.02+.1*uDrone*exp(-abs(yH)*14.),.86-.5*exp(yH*9.)*.2,sbPale),g,sbBack);
  g=mix(g,mix(sky,s,lay),sand);
 }
 if (water>.0) {
  float wl=floorY-.028,below=wl-p.y,run=noise(vec2(p.x*7.,below*60./(1.+7.*max(below,.0))+uTime*.2));
  float back=mix(mix(.03+.1*uDrone,.8,sbPale),.0,flatly),depth=exp(-max(below,.0)*3.);
  // the sky again, in the water
  float r=length(vec2(p.x+.06*(run-.5),wl+below)-vec2(c.x-.13,floorY+.17));
  float s=(back+.07*(1.-sbPale))*depth*(.7+.5*run)+sbBack*((1.0 - smoothstep(.2, .25,r))*.5+.22*exp(-max(r-.2,.0)*5.))*(.6+.6*run)*(1.-.6*sbPale);
  s+=.32*smoothstep(.62,.8,run)*depth*(.25+mw+uHigh*.3)*exp(-pow(low.x/.5,2.))*mix(1.,-.8,sbPale);
  s+=sbBell(below/.002)*.4*exp(-pow(low.x/.3,2.))*(.5+m);
  float up=mix(mix(.03+(.08+.12*uDrone)*exp(-max(-below,.0)*6.)*(.6+.4*wide),.86,sbPale),g,sbBack);
  float net=abs(noise(p*7.+uTime*.08)+noise(p*9.-uTime*.07+20.)-1.);
  g=mix(g,mix(mix(up,s,smoothstep(-sbPx,sbPx,below)),g*(.85+.1*net)+.3*wide*exp(-net*9.)*(.5+mw)*mix(1.,.4,sbPale),flatly),water);
 }
 if (sbLamp>.0) { // what the shell lights round itself
  float r=length(u*vec2(1.,mix(1.+2.*on,1.,flatly))),near=exp(-max(r-.6,.0)*2.2);
  g+=sbLamp*(1.-.7*sbPale)*near*(.2+.2*uDrone+.1*uLevel)*(.5+.6*grit)*mix(.35+.9*on,1.,flatly);
 }
 if (sbDye>.0) {
  vec3 of=pm.a>.02?pm.rgb/pm.a:uKind[0];
  sbHue=mix(sbHue,mix(sbHue,mix(uKind[0],of,sat(pm.a*2.)),mix(.8,.25+.5*mw,sbPale)),sbDye);
 }
 return sat(g);
}
// a: one shell on a ledge. Returns how much burr is gone, 0 to 1.
float sbLone(vec2 p) {
 float fit=min(1.,sbHalf/.42),size=.235*(.3+.7*fit);
 vec2 c=vec2(.2*sat((sbHalf-.2)/.6),-.13),u=(p-c)/size;
 float above=max(uOwn[5],.0),many=abs(uOwn[6]),flatly=sat(above+1.3*many),sand=max(-uOwn[4],.0),water=max(uOwn[4],.0);
 float tall=max(uOwn[0],.0),disc=max(-uOwn[0],.0);
 bool other=flatly+sand+water+tall+disc+sbPale+sbBack+sbLamp>.0;
 if (other) { c=mix(c,vec2(.02,.0),flatly); size*= (1.+.42*above)*(1.+(.4*tall+.25*disc)*(1.-many))*(1.-.45*many); c.y+=.04*max(water,sand)*(1.-flatly); u=(p-c)/size; }
 vec3 h3=vec3(.5);
 if (many>.0) { // one shell in each part of the plate
  float pitch=.3/max(many,.05),k=1.;
  vec2 g=(p-c)/pitch;
  if (uOwn[6]<.0) g.x+=.43*floor(g.y+.5)*many;
  vec2 id=floor(g+.5),at=(g-id)*pitch;
  h3=vec3(hash22(id+7.),hash21(id*1.7+3.1));
  if (uOwn[6]<.0) {
   k=mix(1.,(.34+.8*h3.z*h3.z)*smoothstep(.2,.24,h3.x),many)+1e-3;
   at-=(h3.xy-.5)*2.*max(.5*pitch-1.15*size*k,.0);
  }
  u=at/(size*k);
 }
 float floorY=c.y-.5*size-(.12*disc-.02*tall)*size*2.*(1.-flatly),front=floorY-.1+.003*sin(p.x*4.+1.)+.002*sin(p.x*11.);
 float open=uCue;
 // the wall behind: a little lighter past the shell's dark side
 vec2 w=(p-c-vec2(.2,.1))/(vec2(.42,.3)*(.85+.4*uSpace));
 float tone=(.05+.1*uDrone+.08*open)*exp(-dot(w,w))*(.8+.4*noise(rot(.7)*p*vec2(4.,30.)+uTravel*.012));
 // the ledge
 float on=(1.-smoothstep(floorY-.04,floorY+.06,p.y))*smoothstep(front-sbPx,front+sbPx,p.y);
 float pool=sbBell((p.x-c.x+.06)/(.4+.25*uSpace));
 float m=sat(piece(vec2(.5+p.x/1.75,sat(.9-(p.y-front)/.14))).a)*(1.-smoothstep(.6,.87,abs(p.x)))*sbGain;
 float led=pool*(.1+.2*uDrone)+.24*m*(.35+.65*pool);
 led*= .75+.5*noise(p*vec2(9.,120.));
 vec2 sh=(u-vec2(.42,-.58))/vec2(.95,.14);
 led*= 1.-.96*exp(-dot(sh,sh)*dot(sh,sh));
 tone=mix(tone,led,on);
 tone+=sbBell((p.y-front)/.0028)*(pool*pool*(.14+.2*uDrone)+.2*m);
 tone*= .15+.85*smoothstep(front-.05,front,p.y);
 float wl=floorY-.028,mirror=.0;
 if (other) tone=sbOther(p,c,u,tone,on,pool,m,floorY,front,flatly,sand,water,size);
 if (water>.0&&flatly<.5&&p.y<wl) { // what stands there is seen again in the water
  float below=wl-p.y;
  mirror=water*(1.-smoothstep(.1,.5,flatly));
  u=(vec2(p.x+(.003+.05*below)*(noise(vec2(p.x*9.,p.y*90./(1.+6.*below)-uTime*.25))-.5),wl+below*1.06)-c)/size;
 }
 // a hit: one stroke of the burnisher along the ledge, which fills in again, and its light on what stands near
 vec2 sa=vec2(c.x-.72*fit,front+.038),sb=vec2(c.x-.2*fit,front+.06);
 vec2 sg=(p-mix(sa,sb,.5))/vec2(.3,.07);
 tone+=uHits*(.8*sbStroke(p,sa,sb,.022)+.16*exp(-dot(sg,sg))*step(front,p.y));
 // the shell
 float ln=.25,tl=-.7,tn=-.27;
 if (other||uOwn[5]!=.0) {
  float side=max(-uOwn[5],.0);
  ln=mix(mix(ln,.36,tall*(1.-side)),.05,side);
  tl=mix(mix(mix(tl,-.25,tall),-1.25,disc),mix(-.1,-.85,disc),side)-.75*above*(1.-.3*disc);
  tn=mix(tn,.1,side);
  if (many>.0) { ln+=(h3.x-.5)*(uOwn[6]<.0?5.6:.5)*many; tn+=(h3.y-.5)*1.6*many; tl+=(h3.z-.5)*(uOwn[6]<.0?1.2:.7)*many; }
 }
 mat2 lean=rot(ln),tilt=rot(tl),turn=rot(tn);
 float lift=mix(mix(.62,.86,tall),.06,disc);
 if (many>.0) { sbT.y*= mix(1.,.6+.9*h3.x,many); sbT.z*= mix(1.,.84+.3*h3.y,many); lift*= mix(1.,.6+.9*h3.x,many); }
 if (sbSaw>.0) {
  sbV=vec3(.0,.0,-1.);
  sbV.xy=lean*sbV.xy; sbV.yz=tilt*sbV.yz; sbV.xz=turn*sbV.xz;
  sbAt=mix(1.3,.0,sbSaw);
 }
 float t=1.7,hit=.0;
 vec2 bd=u-vec2(.15,.1);
 bool near=dot(bd,bd)<1.25;
 if (other) near=dot(u,u)<(many>.0?1.2:1.7)&&mirror>=.0;
 float stride=sbRib>.0?.8-.2*sbRib:.8,under=tone,last=4.6;
 float eps=.004;
 int dark=9,most=44;
 if (other&&near) { float in_=sqrt(1.7-dot(u,u)); t=3.-in_; last=3.+in_; bool brief=many+sbSaw>.0; dark=brief?2:5; most=brief?20:28; eps=brief?.014:.008; }
 vec3 q=vec3(.0);
 vec4 h=vec4(.0);
 for (int i=0; i<44&&near; i++) {
  q=vec3(u,t-3.);
  q.xy=lean*q.xy; q.yz=tilt*q.yz; q.xz=turn*q.xz; q.y-=lift;
  h=sbShell(q);
  if (h.x<eps) { hit=1.; break; }
  t+=h.x*stride;
  if (t>last||i>most) break;
 }
 float gap=sbGap,shade=1.;
 vec3 n=vec3(.0),L=sbL;
 L.xy=lean*L.xy; L.yz=tilt*L.yz; L.xz=turn*L.xz;
 for (int i=0; i<4&&hit>.5; i++) {
  vec3 e=.012*(vec3(float(((i+3) >> 1) & 1),float((i >> 1) & 1),float(i & 1))*2.-1.);
  n+=e*sbShell(q+e).x;
 }
 float st=.06;
 for (int i=0; i<dark&&hit>.5; i++) { float d=sbShell(q+L*st).x; shade=min(shade,sat(.5+5.*d/st)); st+=max(d,.07); }
 if (hit>.5) {
  n/= max(length(n),1e-5);
  n.xz=n.xz*turn; n.yz=n.yz*tilt; n.xy=n.xy*lean; // back to the room
  sbRule=vec2(.9,8.*(n.x*.6+n.y*.5));
  if (sbDye>.0) {
   float turned=fract(h3.z*3.7+.12*h.y);
   sbHue=mix(sbHue,mix(mix(kindColour(3.*abs(2.*turned-1.)),kindColour(floor(h3.y*4.99)),.85*many),uKind[1],.6*(1.-.8*many)*sbBell((atan(h.w,h.z+1e-5)-.5)/.4)),sbDye);
   if (h.y>.5) sbHue=mix(sbHue,uKind[3],.7*sbDye);
  }
  float l=dot(n,sbL),wrap=.08+.36*uPad;
  float lit=pow(sat((l+wrap)/(1.+wrap)),2.1)*mix(.25,1.,shade);
  float edge=pow(1.-sat(-n.z),2.5);
  if (h.y<.5) {
   float ang=atan(h.w,h.z+1e-5),s=exp(sbK*h.y),across=sat((ang+1.1)/2.6);
   // what the shell grew: lines along its mouth's shape, darker turns of colour along the spiral
   float grow=noise(vec2(h.y*9.,ang*1.5))*.6+noise(vec2(h.y*34.,ang*2.5))*.4;
   float belt=sbBell((ang-.75)/.12)+sbBell((ang-.2)/.16)*.8+sbBell((ang+.35)/.1)*.6;
   lit*= (.72+.5*grow)*(1.-.45*sat(belt)*(.75+.5*grow));
   // sixteen threads, each scraped as deep as its band
   float th=across*16.,thread=sbBell((fract(th)-.5)/.2)*smoothstep(.25,.5,s);
   lit+=thread*band(across)*sbGain*.6*(.14+lit);
   // the keys: pins of light along the threads
   vec2 pin=vec2(fract(h.y*2.2)-.5,fract(th)-.5),pc=vec2(floor(h.y*2.2),floor(th));
   lit+=uKeys*step(.62,hash21(pc+60.))*exp(-dot(pin*vec2(.8,1.),pin*vec2(.8,1.))*40.)*smoothstep(.3,.6,s)*(.4+lit)*2.;
   lit*= .35+.65*smoothstep(.0,.3,gap);
   tone=.02+1.2*lit/(1.+.2*uPad*lit+.12*lit);
  } else if (h.y<1.5) {
   float r=length(h.zw);
   tone=.012+(.2+.4*uMic)*smoothstep(.45,1.05,r)*sat(dot(h.zw,vec2(.85,-.5)));
  } else tone=.07+(.06+.5*uPhrase)*pow(sat(dot(n,vec3(.5,-.7,-.5))),3.)+1.1*lit;
  // the burnished window on the shoulder; a cue opens it
  float sp=sat(dot(reflect(vec3(.0,.0,1.),n),normalize(vec3(-.42+.1*sin(TAU*uLoop)+.07*sin(uTime*.07),.62,-.66))));
  if (h.y<.5) tone+=(smoothstep(.91-.14*open,.985-.05*open,sp)*.7+.3*pow(sp,12.))*(.75+.25*uLevel)*(.6+.4*smoothstep(.0,.2,gap));
  tone+=uHits*.5*pow(sat(dot(n,vec3(-.72,-.65,-.25))),1.5)*(h.y<.5?1.:.3);
  // light thrown back on the dark side
  tone+=edge*sat(dot(n,vec3(.75,-.5,-.1))+.15)*(.06+.6*uPhrase);
  if (sbPale>.0) { // dark on pale: what was black is a half tone, and the rim is drawn
   float mid=.16+.8*sat(tone)/(.35+.65*sat(tone))-.5*edge*(1.-.6*sat(tone));
   mid-=.14*sbBell(gap/.1)*step(h.y,.5);
   tone=mix(tone,h.y>.5&&h.y<1.5?.06+.5*tone:mid,sbPale);
  }
  if (sbBack>.0) { // the light behind: the face goes dark, the rim catches it
   float rim=pow(1.-sat(-n.z),3.2)*(.5+.5*sat(n.y+.5));
   tone=mix(tone,.22*tone*(1.+uPhrase)+rim*(.75+.25*uLevel),sbBack);
  }
  if (sbLamp>.0) { // the light within: thin walls glow, the mouth is open to it
   float thin=h.y<.5?(.16+.7*smoothstep(-.1,.9,-n.z))*(.45+.75*noise(vec2(h.y*9.,atan(h.w,h.z+1e-5)*2.)))*(.45+.55*smoothstep(.0,.45,gap)):h.y<1.5?.95-.45*length(h.zw):.6;
   tone=mix(tone,thin*(.62+.3*uLevel+.25*uDrone)*(.8+.5*exp(.25*min(h.y,.0)))+.4*tone*(1.-sbPale),sbLamp);
  }
  if (mirror>.0) tone=mix(under,tone*.62+.1*sbPale+.12*sbBack,mirror*(1.0 - smoothstep(.0, .5,(wl-p.y)/size)));
 }
 return tone;
}

// b: worn treads, six of them
float sbWear(float x) { return .11*sbBell((x-.1)/.62)+.004*sin(x*5.+1.); }
int sbN; float sbMany; // how many treads
float sbTd,sbTh,sbW,sbWd; // a tread's depth and height, half the width, and that beside the plain one
float sbTurn,sbArc,sbSlab,sbLoose; // winding, bowed, floating, broken apart
bool sbPlain; // the straight stair as it was
// Where a ray meets the stair: how far; which side of which tread (1 riser, 2 top, 3 end), how far from its lip, how far along it.
float sbSteps(vec3 ro,vec3 rd,out float s,out float x,out float k,out float kind) {
 float best=1e4,a=.0,endW=sbWear(sbW),reach=sbTd*(1.+2.2*abs(sbTurn)),thick=mix(sbTh+.13+4.*abs(sbTurn)+sbLoose,.17,sbSlab);
 vec3 P=vec3(.0);
 s=x=k=kind=.0;
 for (int i=0; i<14; i++) {
  if (i>=sbN) break;
  float fi=float(i),y1=(fi+1.)*sbTh,W=sbW;
  vec2 h=sbLoose>.0?hash22(vec2(fi+4.,3.))-.5:vec2(.0);
  float b=a+sbLoose*.75*h.y;
  W*= 1.-sbLoose*.55*fract(h.x*17.3);
  vec2 fw=vec2(sin(b),cos(b));
  vec3 o=ro-P,d=rd;
  o.xz=vec2(dot(o.xz,vec2(fw.y,-fw.x)),dot(o.xz,fw)); d.xz=vec2(dot(d.xz,vec2(fw.y,-fw.x)),dot(d.xz,fw));
  o.x-=sbLoose*2.1*h.x;
  // the riser, bowed towards us at its ends
  float A=sbArc*d.x*d.x,B=d.z+2.*sbArc*o.x*d.x,C=o.z+sbArc*o.x*o.x,root=B*B-4.*A*C,xf=9.;
  if (root>.0) {
   float den=B+(B<.0?-1.:1.)*sqrt(root),t=-2.*C/(abs(den)<1e-5?1e-5:den);
   vec3 q=o+d*t;
   if (B>.0) xf=clamp(q.x,-W,W);
   float y=q.y-y1;
   if (t>.02&&t<best&&abs(q.x)<W&&y<.0&&y>-thick-.2) {
    y+=sbWear(q.x);
    if (y<.0&&y>-thick) { best=t; s=y; x=q.x; k=fi; kind=1.; }
   }
  }
  if (d.y<-1e-4) {
   float t=(y1-ro.y)/d.y;
   if (t<best&&abs(o.x+d.x*t)<W+.5) t=(y1-sbWear(xf>8.?o.x+d.x*t:xf)-ro.y)/d.y;
   vec3 q=o+d*t;
   float z=q.z+sbArc*q.x*q.x;
   if (t>.02&&t<best&&abs(q.x)<W&&z>-.09&&z<reach) { best=t; s=max(z,.0); x=q.x; k=fi; kind=2.; }
  }
  if (abs(d.x)>1e-5) {
   float e=d.x<.0?W:-W,t=(e-o.x)/d.x;
   vec3 q=o+d*t;
   float z=q.z+sbArc*e*e,y=q.y-y1+endW;
   if (t>.02&&t<best&&z>.0&&z<reach&&y<.0&&y>-thick) { best=t; s=y; x=z; k=fi; kind=3.; }
  }
  P.xz+=vec2(sin(a),cos(a))*sbTd;
  a+=sbTurn;
 }
 return best;
}
// The light on it there.
float sbShade(float kind,float s,float x,float k) {
 float tone=.0,wide=1.+1.3*uPad,n=sbMany/6.;
 float mid=x-.1+.16*sin(TAU*uLoop)+.14*sin(uTime*.07),chip=noise(vec2(x*9.,k*5.+s*8.)),far=pow(.62+.22*uSpace,k/n);
 float pool=sbBell(mid/(.8*sbWd));
 float gain=.95*far+.6*smoothstep(k/sbMany-.1,k/sbMany+.3,uPhrase);
 gain+=.5*uCue*k/(sbMany-1.);
 float lip=kind>1.5?exp(-s/(.07+.02*k)):exp(s/((.04+.01*k)*(.6+.8*chip)));
 float soft=kind>1.5?exp(-s/(.26*wide)):.75*exp(s/(.1*wide));
 tone=gain*(.55*lip*(.12+pool)+.4*soft*pool*(.7+.6*chip));
 // what the dark still lets through: treads a little, risers less
 tone+=(kind>1.5?.07:.035)*sbBell(mid/(1.3*sbWd))*far*(.5+chip)*(1.+1.5*uDrone);
 if (kind>2.5) { pool=.4; tone=.05*far*noise(vec2(x*7.,s*9.+k))*exp(s/.6); }
 float along=x/(2.*sbW)+.5,cut=fract(along*16.)-.5;
 vec4 pm=vec4(.0);
 if (sbPale+sbBack+sbLamp+sbDye>.0||uOwn[4]<.0) {
  pm=piece(vec2(along,(k+.5)/sbMany));
  float snow=max(-uOwn[4],.0),up=k/max(sbMany-1.,1.);
  if (kind>2.5) {
   chip=noise(vec2(x*7.,s*9.+k));
   tone=mix(tone,.24+.1*chip,sbPale);
  } else {
   float m=sat(pm.a)*sbGain,back=exp(-max(sbTd-s,.0)/.16);
   if (sbPale>.0) tone=mix(tone,kind>1.5?.93-.34*back-.06*chip-.2*m-.1*(1.-pool):.52+.14*chip+.2*exp(s/.05)-.12*m+.2*s+.12*pool,sbPale);
   if (snow>.0) { // it lies thick, and hangs a little over each lip
    float lump=noise(vec2(x*1.6+k*7.,s*1.5))*.7+.3*noise(vec2(x*5.,s*5.+k*3.)),hang=.05+.13*noise(vec2(x*2.2,k*9.+3.))*mix(.5,1.2,noise(vec2(x*9.,k*3.)));
    float lies=kind>1.5?(.42+.3*lump+.22*pool)*mix(.75,1.,smoothstep(.0,.16,s))*(1.-.4*back):(.34+.3*pool)*smoothstep(-hang-.02,-hang,s)*(1.+.6*s/hang);
    lies*= mix(.5+.5*far,1.,sbPale)*(.85+.4*uDrone)-.18*m*sbPale;
    tone=mix(tone,max(tone*.6,lies+(1.-sbPale)*.16*m),snow*mix(1.,smoothstep(-hang-.03,-hang+.02,s),kind>1.5?.0:1.));
   }
   if (sbBack>.0) { // it comes down the treads from the door
    float beam=sbBell(x/(.34*sbW+.5*sbW*(1.-up)))*(.3+.7*up*up)*(.8+.2*uLevel+.3*uCue);
    tone=mix(tone,kind>1.5?.2*tone+beam*(.62+.3*chip)*(.55+.45*smoothstep(.0,.1,s))+beam*.5*exp(-s/.03):tone*.25+.05*beam*exp(s/.06),sbBack);
   }
  }
  if (sbLamp>.0) { // light from under each lip
   float l=(.55+.25*uLevel+.3*smoothstep(up-.2,up+.2,uPhrase))*(.8+.4*chip);
   tone=mix(tone,kind>2.5?.05+.1*exp(-abs(s+.1)/.1):kind>1.5?tone*.3+l*.85*exp((s-sbTd)/(.3*sbTd)):l*1.25*(1.0 - smoothstep(-.06, -.02,s))*exp((s+.05)/(.45*sbTh)),sbLamp);
  }
  if (sbDye>.0) sbHue=mix(sbHue,mix(kindColour(3.*abs(fract(k*.5/n*.34+.1)*2.-1.)),pm.a>.02?pm.rgb/pm.a:uKind[0],sat(pm.a*1.6)*.85),sbDye);
 }
 float dark=1.-1.75*sbPale; // what sounds is scraped light, or rubbed dark where the plate is pale
 if (kind>2.5) return tone;
 if (kind>1.5) {
  // sixteen scrapes across each tread, as deep as their bands, and the piece: its loop along a tread, its room up the stair
  tone+=dark*sbBell((cut+.3*(chip-.5))/.2)*exp(-s/.3)*band(along)*.3*sbGain*far;
  tone+=max(dark,.0)*sat(piece(vec2(along,(k+.5)/sbMany)).a)*exp(-s/.4)*(.6+.6*chip)*.3*sbGain*(.4+.6*far);
  if (!sbPlain||uOwn[5]>.0) if (k==floor(sbMany*(uOwn[7]>.0?.6:.2))) tone+=dark*uHits*(.8*sbStroke(vec2(x/sbWd,s),vec2(-.95,.5*sbTd),vec2(.9,.3*sbTd),.09)+.35*sbBell(x/sbWd)*sbBell(s/sbTd-.5));
 } else if (k==1.) tone+=dark*(uHits*.9*sbStroke(vec2(x,s),vec2(-.95,-.33),vec2(.9,-.23),.09)+uHits*.2*sbBell(x/.9)*sbBell((s+.28)/.22));
 if (k==.0&&kind>1.5) tone+=dark*uHits*.4*exp((s-sbTd)/.45)*sbBell(x/.9);
 return tone+dark*uKeys*step(.5,hash21(vec2(floor(along*16.),k)))*exp(-cut*cut*90.-s*s*1500.)*.9;
}
float sbStair(vec2 p) {
 float fit=min(1.,sbHalf/.6);
 p=(p+vec2(.02-.28*(1.-fit),-.035+.16*(1.-fit)))/(.2+.8*fit);
 float small=max(uOwn[0],.0),arc=max(uOwn[6],.0),wind=max(uOwn[7],.0),size=exp2(uOwn[0]>.0?-1.1*uOwn[0]:-.8*uOwn[0]);
 sbTd=.95*size; sbTh=.5*size; sbWd=1.+1.5*arc+.2*(size-1.)*step(size,1.); sbW=1.4*sbWd;
 sbMany=6.+8.*sat(small+wind); sbN=int(ceil(sbMany)); sbMany=max(sbMany,2.);
 sbTurn=-.43*wind; sbArc=.13*arc; sbSlab=max(-uOwn[6],.0); sbLoose=max(-uOwn[7],.0);
 sbPlain=uOwn[0]==.0&&uOwn[6]==.0&&uOwn[7]==.0;
 vec3 ro=vec3(3.1,2.2,-3.5),ta=vec3(.36,1.42,2.);
 if (wind>.0) { float mx=-sbTd/.43; sbTh*= 1.-.45*wind; ro=mix(ro,vec3(mx+2.2,6.6,-5.2),wind); ta=mix(ta,vec3(mx+.05,1.5,.1),wind); sbW*= 1.-.2*wind*min(size,1.); }
 if (arc>.0) { ro=mix(ro,vec3(.5,3.3,-5.4),arc); ta=mix(ta,vec3(.05,1.25,2.2),arc); }
 if (uOwn[5]>.0) { ro=mix(ro,vec3(ta.x+.9,9.,ta.z-1.6),uOwn[5]); ta=mix(ta,vec3(ta.x+.1,1.,ta.z+.55),uOwn[5]); }
 if (uOwn[5]<.0) { ro=mix(ro,vec3(ta.x*.2+.35,1.05,ta.z-7.),-uOwn[5]); ta=mix(ta,vec3(ta.x*.3,1.5,ta.z),-uOwn[5]); }
 vec3 f=normalize(ta-ro),r=normalize(cross(vec3(.0,1.,.0),f)),up=cross(f,r);
 vec3 rd=normalize(f*1.5+r*p.x+up*p.y);
 float best=1e4,s=.0,x=.0,k=.0,kind=.0;
 bool side=false;
 float ke=.0; vec3 e=vec3(.0);
 if (sbPlain) {
  for (int i=0; i<6; i++) {
   float fi=float(i),z0=fi*sbTd,y1=(fi+1.)*sbTh;
   float t=(z0-ro.z)/rd.z; vec3 q=ro+rd*t;
   float y=q.y-y1+sbWear(q.x);
   if (t<best&&abs(q.x)<sbW&&y<.0&&y>-sbTh-.13) { best=t; s=y; x=q.x; k=fi; kind=1.; }
   // a ray that clears the lip and falls lands on the tread, worn as deep as its lip was there
   if (y>=.0&&rd.y<-1e-4) {
    t=(y1-sbWear(q.x)-ro.y)/rd.y; q=ro+rd*t;
    if (t<best&&abs(q.x)<sbW&&q.z<z0+sbTd) { best=t; s=max(q.z-z0,.0); x=q.x; k=fi; kind=2.; }
   }
  }
  // the near end of the stair
  float te=(sbW-ro.x)/(abs(rd.x)<1e-5?1e-5:rd.x); e=ro+rd*te;
  ke=clamp(floor(e.z/sbTd),.0,5.);
  side=te>.0&&te<best&&e.z>.0&&e.z<6.*sbTd&&e.y<(ke+1.)*sbTh-sbWear(sbW);
  if (side) { best=te; s=e.y-(ke+1.)*sbTh; x=e.z; k=ke; }
 } else best=sbSteps(ro,rd,s,x,k,kind);
 // the place round it: a wall or the sky, a floor where it is pale or snowed on, a door at the head of the stair
 float around=.0,water=max(uOwn[4],.0),snow=max(-uOwn[4],.0);
 if (sbPale+sbBack+sbLamp+snow>.0) {
  float n=sbMany-1.,topY=sbMany*sbTh;
  around=mix(.04*snow,.82-.12*dot(p,p),sbPale);
  if (rd.y<-1e-3) {
   vec3 q=ro-rd*ro.y/rd.y;
   float off=length(max(vec2(abs(q.x)-sbW,-q.z-.1),.0)),shut=exp(-off*1.6),far=exp(-.12*length(q.xz-ro.xz));
   around=mix(around,mix(.1,.4,snow)*(.6+.5*noise(q.xz*1.3))*mix(far,1.,.2)*(1.-.5*shut),snow*(1.-sbPale));
   around=mix(around,(.86-.34*shut+.06*snow)*mix(.96,1.,noise(q.xz*3.)),sbPale*smoothstep(.0,.1,-rd.y));
  }
  if (sbBack>.0) {
   float a=sbTurn*n; vec3 P=vec3(.0,topY,sbMany*sbTd);
   if (!sbPlain&&sbTurn!=.0) P.xz=sbTd/sbTurn*vec2(1.-cos(a+sbTurn),sin(a+sbTurn));
   vec2 fw=vec2(sin(a),cos(a));
   float dn=dot(rd.xz,fw),t=dot(P.xz-ro.xz,fw)/(abs(dn)<1e-4?1e-4:dn);
   vec3 q=ro+rd*t-P; float qx=dot(q.xz,vec2(fw.y,-fw.x)),w=.42*sbW,hgt=2.3*min(sbTh/.5,1.2);
   float dd=max(abs(qx)-w,q.y<hgt-w?-1.:length(vec2(qx,q.y-hgt+w))-w);
   float door=(1.0 - smoothstep(-.02, .02,dd))*step(.0,t),halo=exp(-max(dd,.0)*1.6)*step(.0,t);
   around=mix(around,(.74+.16*uLevel+.1*uCue)*door*(.85+.15*noise(vec2(qx*3.,q.y*4.-uTravel*.05)))+(1.-door)*(halo*halo*(.2+.2*uDrone)+.5*around*sbPale),sbBack);
  }
 }
 float tone=around;
 if (side) { kind=.0; tone=sbPale>.0?mix(.03,.26+.1*noise(e.zy*vec2(3.,5.)),sbPale):.03*exp(-ke*.5)*noise(e.zy*vec2(6.,9.)); sbRule=vec2(2.2,.0); }
 if (kind>.5) {
  if (sbDye>.0||kind<2.5||!sbPlain) tone=sbShade(kind,s,x,k);
  sbRule=kind>2.5?vec2(2.2,.0):kind>1.5?vec2(.06,.0):vec2(1.2,.0);
  tone=mix(around,tone,sat(sbMany-k));
 } else if (!side) {
  // past the last tread, a light that a cue and a voice let in
  vec2 w=(p-vec2(.31,.36))/vec2(.2,.28);
  tone+=(.3*uCue+.12*uMic+.04*uDrone)*exp(-dot(w,w))*(1.-1.4*sbPale);
 }
 if (water>.0) { // still water over the lowest treads, and the stair again in it
  float wl=1.45*sbTh,t=(wl-ro.y)/(rd.y>-1e-4?-1e-4:rd.y);
  if (rd.y<-1e-4&&t<best) {
   vec3 q=ro+rd*t,m=rd;
   float z=length(q-ro),ripple=noise(q.xz*vec2(3.,5.)+vec2(uTime*.1,-uTime*.14))-.5,fine=noise(q.xz*vec2(9.,16.)-uTime*.2)-.5;
   m=normalize(vec3(rd.x+.06*ripple,-rd.y+.04*fine,rd.z+.05*ripple));
   float s2,x2,k2,kd2,hit2=sbSteps(q+m*.02,m,s2,x2,k2,kd2);
   vec3 was=sbHue;
   float again=kd2>.5&&kd2<2.5?sbShade(kd2,s2,x2,k2):mix(.02,.78,sbPale);
   if (sbDye>.0) sbHue=mix(uKind[0],sbHue,.5);
   float glint=smoothstep(.1,.4,ripple+.5*fine)*(.2+.6*uHigh+.5*uDrone)*exp(-.12*z*z*.2);
   float drowned=kind>1.5&&kind<2.5?.35*tone*exp(-2.5*max(wl-(k+1.)*sbTh,.0)):.0;
   tone=mix(tone,again*mix(.85+.5*sbBack,.85,sbPale)+drowned+.22*glint*mix(.6,-.5,sbPale)+.02,water);
   sbRule=vec2(.0,5.*ripple);
  }
 }
 return tone;
}

vec3 render(vec2 p) {
 sbPx=1./uRes.y; sbHalf=.5*uRes.x/uRes.y; sbGain=.5+uEnergy;
 sbK=.1063; sbT=vec3(.6,.84,.455);
 sbPale=max(uOwn[2],.0); sbBack=max(-uOwn[2],.0); sbDye=max(uOwn[3],.0); sbLamp=max(-uOwn[3],.0);
 sbRib=max(uOwn[7],.0); sbSaw=max(-uOwn[7],.0);
 if (uOwn[0]>.0) { sbT=mix(sbT,vec3(.3,1.42,.36),uOwn[0]); sbK=mix(sbK,.055,uOwn[0]); }
 if (uOwn[0]<.0) { sbT=mix(sbT,vec3(.68,.08,.34),-uOwn[0]); sbK=mix(sbK,.088,-uOwn[0]); }
 sbHue=vec3(.94,.915,.87); sbRule=vec2(.0);
 sbL=normalize(vec3(-.72+.14*sin(TAU*uLoop)+.1*sin(uTime*.07),.62,-.36));
 vec2 at=p+(hash22(gl_FragCoord.xy)-.5)*1.4*sbPx*(1.-max(.9*uOwn[1],-.3*uOwn[1])); // every edge breaks into burr
 float tone=sat(uVar<.5?sbLone(at):sbStair(at));
 float ruled=max(uOwn[1],.0),smooth_=max(-uOwn[1],.0);
 float b=ruled<1.?sbBurr(gl_FragCoord.xy):.5;
 float rough=.26+.2*uTexture+.16*(uTone-.5);
 rough*= 1.-.85*smooth_;
 float white=sat(tone+(.5-b)*rough*4.*tone*(1.-tone)*(.5+.5*smoothstep(.05,.4,tone)));
 float inkBurr=1.-b;
 if (smooth_>.0) inkBurr=mix(inkBurr,.45,smooth_*.8);
 if (ruled>.0) { // the graver's lines: their width is the tone, and a second set crosses the darks
  float n=min(132.,.36*uRes.y),aa=n*2.6*sbPx;
  vec2 q=rot(sbRule.x)*p; float bend=sbRule.y+.9*(noise(p*5.)-.5);
  float l=abs(fract(q.y*n*.5+bend)-.5)*2.,l2=abs(fract((rot(1.)*q).y*n*.5+bend)-.5)*2.;
  float worn=.1*(noise(p*vec2(70.,90.))-.5)*(.6+uTexture);
  float cut=sat((tone*1.12-l*.96+worn)/aa+.5);
  cut=mix(cut,max(cut,sat((tone*1.6-1.-l2*.5+worn)/aa+.5)),sat(1.-sbPale));
  cut*= mix(1.,sat((tone*2.6-l2*.9+worn)/aa+.5),sbPale);
  cut=mix(cut,tone,sat(aa-.8));
  white=mix(white,sat(cut),ruled); inkBurr=mix(inkBurr,.2,ruled);
 }
 vec3 ink=vec3(.03,.028,.027)+.05*inkBurr*(.7+.6*noise(rot(.6)*p*vec2(3.,24.)+uTravel*.01));
 vec3 paper=vec3(.94,.915,.87);
 if (sbDye>.0) { paper=mix(paper,sat(sbHue*1.06+.04),sbDye); ink=mix(ink,ink+.1*paper*paper*(.3+white),sbDye); }
 vec3 col=mix(ink,paper,white);
 if (sbDye>.0) col=mix(col,vec3(.97,.95,.9),sbDye*.75*smoothstep(.8,1.,white)*(1.-.85*sbPale));
 // a breath of what sounds in the half-tones
 vec3 hue=.15+uKind[0]*uDrone+uKind[1]*uPad+uKind[2]*uTexture+uKind[3]*uPhrase;
 col*= mix(vec3(1.),hue/max(dot(hue,vec3(.3,.59,.11)),.05),.09*white*(1.-white)*4.);
 // the plate's edge, where the picture does not run off it
 float plate=uVar;
 plate*= 1.-sat(2.*max(max(abs(uOwn[2]),abs(uOwn[4])),max(abs(uOwn[5]),max(uOwn[6],uOwn[7]))));
 vec2 b2=abs(p)-vec2(sbHalf-.03,.47);
 float ed=max(b2.x,b2.y)+.002*(noise(p*9.)-.5);
 col=mix(col,vec3(.05,.048,.046),plate*smoothstep(-sbPx,sbPx,ed));
 return mix(col,vec3(.94,.915,.87),plate*.42*(1.-smoothstep(.003-sbPx,.003+sbPx,abs(ed)))*(.5+.5*noise(p*14.)));
}
