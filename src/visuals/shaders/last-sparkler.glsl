// name: Last sparkler
// a: Pine needles
// b: Willow
// what: A warm near-black night, a twisted paper string, and one small molten drop that throws thin branching sparks like pine needles over a wooden rail; or the later, heavier drop over dark water, its long soft threads bowing down like willow, each ending in a tiny fork, all seen again in the ripples.
// follows: The mix is the size and heat of the drop, the low band draws it down; bands and kinds each feed sparks of their own, and kinds tint night and smoke. The piece lies along the rail or the water. A hit throws a burst, a cue shakes the drop and opens a ring of fine sparks. Highs and keys feed a crown of short sparks, a voice the heat; the loop swells the fire.
// own: 0 1 many drops hang far and near, -1 the fire is strung along a rope; 1 1 the sparks open as five petalled blossoms, -1 as soft round lights; 2 what lies below: 1 snow, -1 tall grass; 3 1 a pale day with the sparks in ink, -1 a dusk sky in the sounds' colours; 4 1 a great moon behind, -1 a grove of stems lit by the fire; 5 1 the sparks reach across the whole picture, -1 they curl upward; 6 the drop: 1 a great molten globe, -1 a pinprick; 7 1 a full round burst (b: a thick fall of threads), -1 hardly a spark
float lsDn(float a,float b,float x){return 1.-smoothstep(b,a,x);} // 1 below b, 0 above a
float lsPx,lsW,lsHalo; // one pixel, how wide a spark is, how soft round it
float lsPh; // the phase of the burning, once up and down in a loop
float lsFire; // how much the sparks light what stands round
vec4 lsKl; // how loud each kind is
float lsPale,lsDye,lsRope,lsMany;
vec3 lsHue(int k){return uKind[k]*uKind[k]*1.2+uKind[k]*.1+.02;}
float lsBump(float x){return exp(-x*x);}
// The light of a thin line seen at distance d: a core, and a little light round it.
float lsLine(float d,float w){
w*=lsW;
float g=2.2*w;
return sat((w+lsPx-d)/(2.*lsPx))*min(1.,w/lsPx+.1)+lsHalo*g*g/(d*d+g*g)*lsDn(.014,0.,d);
}
float lsGroup(int i){return .25*(uBands[i*4]+uBands[i*4+1]+uBands[i*4+2]+uBands[i*4+3]);}
// What a spark opens into: a blossom or a round light, r from its middle.
float lsHead(vec2 r,float R,float seed){
float flower=max(uOwn[1],0.),disc=max(-uOwn[1],0.),d=length(r),res=0.;
if(d>1.25*R)return 0.;
if(flower>0.){
float an=atan(r.y,r.x+1e-6)+seed*40.,c=abs(cos(an*2.5)),x=d/R,edge=.5+.5*pow(c,.7)-.16*smoothstep(.93,1.,c);
float soft=lsPx*2./R,in1=lsDn(edge+soft,edge-soft,x);
res+=flower*in1*(.05+.2*x*x+.14*(1.0 - smoothstep(0., .2,1.-c))*x+.3*lsDn(.07+soft,0.,abs(x-edge+.03))+.6*lsBump(x*7.));
}
if(disc>0.)res+=disc*lsDn(1.,.8,d/R)*(.28+.3*smoothstep(.5,.9,d/R));
return res;
}
// The sky of another night or day, p in heights, q from the drop, up from the horizon.
vec3 lsSky(vec3 col,vec2 p,vec2 q,float up,float lamp){
float t=uTime*.004;
if(lsDye>0.){
float cl=fbm(vec2(p.x*1.3+t*3.,up*4.5)),v=sat(up*1.15+.35*(cl-.5));
vec3 c=mix(lsHue(1)*(.28+.3*uPad),lsHue(0)*(.1+.1*uDrone),smoothstep(0.,.55,v));
c+=lsHue(2)*(.05+.2*uTexture)*smoothstep(.45,.75,cl)*lsDn(.7,.1,v);
vec4 m=piece(clamp(vec2((p.x+.86)/1.72,.95-up*1.2)+.3*(vec2(cl,noise(vec2(p.x*3.+t*3.,up*9.)))-.5),.01,.99));
c+=m.rgb*m.rgb*.5*smoothstep(.38,.7,cl)*(1.0 - smoothstep(.6, 1.,abs(p.x)));
vec2 g=p*46.,id=floor(g),h=hash22(id);
c+=.5*step(.93,h.x)*lsDn(.12,.02,length(fract(g)-.5-.6*(h.yx-.5)))*smoothstep(.25,.6,v)*(.5+.5*sin(uTime*(.3+h.y)+h.y*40.));
col=mix(col,col+c,lsDye);
}
if(lsPale>0.){
float cl=fbm(vec2(p.x*1.1+t*3.,p.y*2.6+3.));
vec4 m=piece(clamp(vec2((p.x+.86)/1.72,.5-p.y)+.35*(vec2(cl,fbm(p*2.3-t))-.5),.01,.99))*(1.0 - smoothstep(.55, .95,abs(p.x)));
col=mix(col,mix(vec3(1.75,1.7,1.6),m.rgb/max(m.a,.05),.4*sat(m.a)*(.5+cl))*mix(vec3(1.),min(lsHue(1)+.3,1.1),.1+.35*smoothstep(.4,.7,cl)+.15*uPad)*(.88+.12*uLevel),lsPale);
}
if(uOwn[4]>0.){
vec2 m=p-vec2(.05,.1);
float R=.27+.02*uPad,d=length(m),sea=fbm(m*5.+4.),disc=lsDn(R+1.5*lsPx,R-1.5*lsPx,d);
vec3 mc=(lsHue(3)*.75+.06)*(.5+.35*smoothstep(.35,.65,sea))*(.75+.35*uLevel);
float cloud=smoothstep(.42,.62,fbm(vec2(p.x*1.6-t*4.,p.y*7.)));
col+=uOwn[4]*mc*.12*exp(-max(d-R,0.)*7.)*(1.-lsPale);
mc*=.8+.5*sat(lsKl.x*.3+lsKl.y*.3+lsKl.w*.6);col=mix(col,mix(mc,lsHue(3)*1.5,lsPale)*(1.-.55*cloud),disc*uOwn[4]);
}
if(uOwn[4]<0.)for(int k=0;k<3;k++){
float f=float(k),cell=.34-.085*f,x=p.x+.04*sin(uTime*.02+f)+.02*f;
float id=floor(x/cell),h=hash11(id+17.*f+2.),h2=fract(h*37.7),w=(.034)*(.6+.6*h2)*(1.-.28*(2.-f))*step(.28,h);
float cx=(id+.3+.4*h2)*cell-0.,e=(x-cx-(.02*(h-.5))*p.y*4.-.006*sin(uTime*.21+id)*(p.y+.5))/max(w,1e-3);
float seg=p.y*(4.+3.*h)+h*9.,ring=fract(seg),node=lsBump((ring-.5)/.03)*(1.-lsPale);
e/=1.+.12*node;
float a=lsDn(1.+lsPx/w,1.-lsPx/w,abs(e))*step(1e-3,w),z=sqrt(max(1.-e*e,0.));
float side=q.x>0.?-1.:1.,lit=sat(.35+.65*side*e)*z,far=1./(1.+dot(q,q)*(22.-5.*f));
vec3 c=lsHue(int(mod(id+f,3.)))*(.006+.04*lsKl[int(mod(id+f,3.))]+vec3(1.,.6,.3)*lit*lamp*far*(.5+.25*f))*(.75+.5*noise(vec2(e*6.,seg*4.)))*(1.-.45*lsBump((ring-.53)/.02))*(1.+.8*node);
c=mix(c+.0006,mix(vec3(1.3),lsHue(0)+.35,.65-.25*f)*(.35+.65*z)*(1.-.85*smoothstep(.62,.7,noise(vec2(e*1.6+h*30.,p.y*(70.-12.*f)+h*50.)))*smoothstep(.35,.6,noise(vec2(h*9.,p.y*7.)))),lsPale);
col=mix(col,c,a*sat(-uOwn[4]*1.3)*mix(.55+.225*f,.25+.36*f,lsPale));
}
return col;
}
// The ground that takes the place of the rail or the water.
vec3 lsGround(vec3 col,vec2 p,vec2 q,float lamp){
vec4 m=piece(vec2((p.x+.86)/1.72,sat((p.y+.5)*3.)));
float fall=1./(1.+dot(q,q)*5.);
if(uOwn[2]>0.){
for(int k=0;k<2&&p.y<-.05;k++){
float f=float(k),top=-.75+uOwn[2]*(.55-.1*f)+.05*sin(p.x*(2.2+f)+1.+2.6*f)+.03*noise(vec2(p.x*5.,3.+f)),dd=top-p.y;
if(dd>-.02){
vec2 s=vec2(p.x,dd*3.+f);
float h0=fbm(s*vec2(3.,5.)),hx=fbm((s+vec2(.02,0.))*vec2(3.,5.))-h0,hy=fbm((s+vec2(0.,.02))*vec2(3.,5.))-h0;
float lit=sat(.5-9.*hx*sign(q.x+1e-5)*min(abs(q.x)*6.,1.)+5.*hy+.3*exp(-dd*20.)),gl=step(.985,hash21(floor(p*380.)));
vec3 c=(lsHue(0)*.14+.012)*(.4+.8*h0)*(.6+.4*uLevel+2.*lsDye*.5)+vec3(1.,.52,.22)*.5*lamp*lit*fall*fall+m.rgb*m.rgb*.35*(.3+lit);
if(uOwn[4]>0.)c+=lsHue(3)*.14*uOwn[4]*lit;
c+=gl*(.25+1.5*uHigh)*lit*fall*vec3(1.,.8,.6);
c=mix(c,mix(vec3(1.7),lsHue(0),.22+.25*sat(m.a))*(.5+.55*lit),lsPale);
col=mix(col,c,lsDn(lsPx*2.,-lsPx*2.,p.y-top));
}
}
}
if(uOwn[2]<0.)for(int k=0;k<5&&p.y<.02;k++){
float f=float(k),cell=.011+.0045*f;
for(int j=-2;j<=2;j++){
float id=floor(p.x/cell)+float(j),h=hash11(id*1.3+41.*f),h2=fract(h*57.1);
float base=-.56-.02*f,len=-uOwn[2]*(.2+.24*h2)*(1.05-.1*f)*(.8+.35*sin(id*cell*5.+f)),tt=(p.y-base)/max(len,1e-3);
if(tt>0.&&tt<1.){
float sway=.012*sin(uTime*.6+id*cell*6.+f)+.05*(h-.5);
float off=p.x-(id+.5+.5*(h-.5))*cell-sway*tt*tt*1.6,w=(.0026+.0006*f)*(1.-tt);
if(h2>.8)w=max(w,.0042*smoothstep(.72,.8,tt)*lsDn(1.,.9,tt));
vec3 c=lsHue(int(mod(id,3.)))*(.01+(.03+.12*lsDye)*tt)+(vec3(1.,.55,.22)*.3+.35*lsHue(2))*lamp*fall*tt*(.35+.65*sat(.5-off/(w+1e-4)*sign(q.x+1e-5)*.8))+m.rgb*m.rgb*.5*tt;
c*=1.15-.16*f;c=mix(c,lsHue(int(mod(id,3.)))*(.2+.4*tt),lsPale);
col=mix(col,c,lsDn(w+lsPx,w-lsPx,abs(off)));
}
}
}
return col;
}
// One pine needle: a stem along d, a node at its end that bursts into eight branches, and most of those burst again.
// x is the light of stem and branches, y the light of the finest tips and the nodes; u is its life, 0 to 1, dark at both ends.
vec2 lsNeedle(vec2 q,vec2 d,float L,float seed,float u){
vec2 n=vec2(-d.y,d.x),r=q-d*L,res=vec2(0.);
float s=clamp(dot(q,d),0.,L),ds=length(q-d*s),R=1.15*L,k=s/L;
bool away=dot(r,r)>R*R;
if(ds>.03&&away)return res;
float head=L*smoothstep(0.,.2,u),dead=lsDn(1.,.6,u);
res.x+=lsLine(ds,.0009)*lsDn(head+1e-3,head-.03,s)*(.12+.88*k*k)*lsDn(.3+.6*k,.1+.25*k,u)*smoothstep(0.,.05,u);
if(away)return res;
float open=smoothstep(.12,.4,u)*lsDn(.98,.6,u);
if(uOwn[1]!=0.){res.x*=1.-.35*abs(uOwn[1]);res.y+=1.3*open*lsHead(r,L*(.5+.25*fract(seed*9.1))*(.4+.6*open),seed);}
res.y+=exp(-dot(r,r)/(2e-5*lsW))*smoothstep(.14,.2,u)*lsDn(.6,.22,u)*1.6;
r.y+=.5*dot(r,r)*u; // the far ends sink a little as they cool
for(int i=0;i<8;i++){
float fi=float(i),h=fract(seed*37.3+fi*.618+.21*fi*seed),h2=fract(h*13.7+seed*5.);
float an=(fi-3.5)*.56+.62*(h-.5),ca=cos(an),sa=sin(an);
vec2 c=d*ca+n*sa;
float l=L*(.14+.52*h2*(.6+.4*ca)),x=dot(r,c),y=dot(r,vec2(-c.y,c.x));
float a=clamp(x,0.,l),u2=u-.14-.06*h,kk=a/l,hd=l*smoothstep(0.,.22,u2);
if(uOwn[1]!=0.){vec2 rr=r-c*l*1.15;res.y+=open*lsHead(rr,(.012+.03*h2)*(.4+.6*open),h);}
res.x+=(1.-.8*abs(uOwn[1]))*lsLine(length(vec2(x-a,y)),.0008*(.5+.5*kk))*lsDn(hd+1e-3,hd-.02,a)*smoothstep(0.,.05,u2)*lsDn(.75,.2,u2-.2*kk)*(.35+.65*kk)*dead;
 // the last and finest splitting, found by its angle
x-=l;
float rho=length(vec2(x,y)),g=min(.8*l,.07)*step(.25,fract(h2*5.7))+1e-4;
if(rho<g+.008){
float an2=atan(y,x+1e-6),id=clamp(floor(an2/.36+.5),-5.,5.),hh=fract(h*7.1+id*.377+.11*id*id*h2);
float off=min(abs(an2-.36*id-.3*(hh-.5)),1.5),gl=g*(.08+.92*hh*hh),u3=u2-.15;
float along=rho*cos(off),hg=gl*smoothstep(0.,.2,u3);
res.y+=(1.-abs(uOwn[1]))*lsLine(rho*sin(off)+max(along-gl,0.),.0007*(1.-.8*sat(along/gl))+1e-5)*lsDn(hg+2e-3,hg-.006,along)*smoothstep(0.,.05,u3)*lsDn(.56,.15,u3-.2*along/g)*dead;
res.y+=.4*exp(-rho*rho/(3e-6*lsW))*smoothstep(0.,.05,u3)*lsDn(.3,.05,u3);
}
}
return res;
}
// The molten drop, q from its middle: rgb light and a how much of it is here.
vec4 lsDrop(vec2 q,float R,float st,float heat,float pale){
q.y/=st;
float neck=smoothstep(.1,1.7,q.y/R);
q.x/=1.-.5*neck;
float d=length(vec2(q.x,q.y*(1.-.28*neck)));
float a=lsDn(R+lsPx,R-lsPx,d),z=sqrt(max(1.-d*d/(R*R),0.));
if(a<=0.)return vec4(0.);
vec2 f=q/R/(.6+.4*z);
float slag=noise(f*1.6+vec2(3.,7.*sin(uTime*.016)))*.75+noise(f*3.7-vec2(5.*sin(uTime*.013),9.*sin(uTime*.015)))*.25;
float h=heat*.82*(.2+.8*z)*(.42+1.15*slag)+.25*lsBump((q.y/R+.55)*1.6)*z;
vec3 c=mix(vec3(.5,.06,.008),vec3(1.6,.42,.05),smoothstep(.15,.6,h));
c=mix(c,vec3(3.2,1.5,.38)+vec3(0.,.4,.5)*pale,smoothstep(.5,1.15,h));
if(lsPale>0.)c=mix(c,lsHue(3)*(.2+.75*h)+.25*lsBump((h-1.2)*2.),lsPale);
return vec4(c,a);
}
// The twisted paper string above the drop: h how far up, x how far across it.
vec4 lsString(float x,float h,float w0,float lit){
float w=w0*(.75+1.5*max(h,0.)),e=x/w;
float a=lsDn(w+lsPx,w-lsPx,abs(x))*smoothstep(-.004,.004,h);
if(a<=0.)return vec4(0.);
float tw=h/w0*.55+e*1.1,st=.5+.5*sin(tw),z=sqrt(max(1.-e*e,0.));
vec3 stain=mix(vec3(.8,.68,.5),kindColour(min(h*6.,3.)),.5);
float l=lit*(.7*exp(-h*16.)+.08*exp(-h*5.))+.004;
vec3 c=stain*l*(.3+.7*z)*(.3+.9*st);
c*=smoothstep(w0*2.,w0*8.,h);
c+=vec3(1.2,.24,.03)*exp(-h/(w0*2.2))*(.4+.6*st);
return vec4(c,a);
}
// The smoke, q from the top of the drop: how thick. It leans to the left as it goes up.
float lsSmoke(vec2 q,float wide){
if(q.y<0.||abs(q.x+.5*q.y)>.3)return 0.;
float t=uTime,h=q.y,lean=-.5*h*h/(h+.12);
float x=q.x-lean,gw=sqrt(h)*wide;
x+=gw*(.5*sin(h*9.-t*.42)+.35*sin(h*17.-t*.71+1.3));
float s=0.;
for(int i=0;i<3;i++){
float f=float(i),off=gw*(1.*sin(h*(6.+2.3*f)-t*(.3+.09*f)+f*2.1)),w=.0016+gw*(.04+.06*f);
float y=(x-off)/w;
s+=exp(-abs(y)*(y>0.?1.6:.5))*(.75-.15*f);
}
return s*smoothstep(0.,.05,h)*exp(-h*3.2)/(1.+7.*gw);
}
// What has just sounded, carried up in the smoke: how far up is how long ago.
vec3 lsStain(vec2 q){
vec4 m=piece(vec2(fract(uLoop-.55*max(q.y,0.)),sat(.5-q.x*2.)));
vec3 c=uKind[0]*lsKl.x+uKind[1]*lsKl.y+uKind[2]*lsKl.z+uKind[3]*lsKl.w;
return mix(vec3(.8,.55,.4),c/max(dot(lsKl,vec4(1.)),.2)*1.3,.75*sat(dot(lsKl,vec4(.5))))*.6+m.rgb*2.6;
}
// The rope the fire is strung along, in place of the string.
vec4 lsRoped(vec4 str,vec2 q,float mid,float gap,float sag,float lamp){
float x=(q.x-mid)/gap,d=q.y-sag*x*x-.002-.004*sin(q.x*9.),w=.003,tw=.5+.5*sin(q.x*420.+d*500.);
str.a*=1.-lsRope;
vec4 rope=vec4(mix(vec3(.5,.36,.22)*(.03+.4*lamp/(1.+30.*x*x*.02))*(.35+.65*tw)*(.5+.5*sat(-d/w)),vec3(.2,.16,.13),lsPale),lsRope*lsDn(w+lsPx,w-lsPx,abs(d)));
return rope.a>str.a?rope:str;
}
// What a cue opens: a ring of fine sparks.
vec3 lsRing(vec2 q){
float rr=length(q),an=atan(q.y,q.x+1e-6)/TAU,s=0.;
if(uCue<.01||rr>.5)return vec3(0.);
for(int j=0;j<3;j++){
float nn=41.+22.*float(j),a=an*nn,id=mod(floor(a),nn),h=hash11(id+9.+70.*float(j)),h2=fract(h*51.3);
float at=(.06+.27*(1.-uCue))*(.62+.75*h),y=abs(fract(a)-.3-.4*h2)*TAU/nn*rr,z=(rr-at)/(.008+.03*h2*h2);
s+=(2.4-1.2*h)*lsLine(y,.00055)*exp(-z*z)*step(.35,h2);
}
return uCue*vec3(1.,.56,.2)*s;
}
// A crown of short fine sparks close round the drop, each with a little life of its own; the high band and the keys feed it.
float lsCrown(vec2 q,float r0,float reach){
float rr=length(q),an=atan(q.y,q.x+1e-6)/TAU,s=0.;
if(rr>r0+.14*reach)return 0.;
for(int j=0;j<2;j++){
float nn=19.+10.*float(j),a=an*nn,id=mod(floor(a),nn),h=hash11(id+31.+60.*float(j));
float x=uTime/(1.1+.9*h)+7.*h,u=fract(x),h2=hash11(mod(floor(x),977.)+id*3.1),h3=fract(h2*31.7);
float y=abs(fract(a)-.25-.5*h3)*TAU/nn*rr,at=r0+(.02+.11*h2*h2)*reach*(1.-(1.-u)*(1.-u)),len=.014+.05*h3*h3;
float z=at-rr;
s+=lsLine(y,.0005)*smoothstep(0.,.003,z)*lsDn(len,0.,z)*sin(PI*u)*step(.35,h3);
}
return s;
}
// Other drops, far and near, each with its string and a few sparks: what they add and what they cover.
vec3 lsOthers(vec3 col,vec2 p,float willow){
for(int i=0;i<9;i++){
float f=float(i),h=hash11(f*3.1+5.),h2=fract(h*43.7),near=.35+.65*fract(f*.618+.1);
float shown=smoothstep(0.,.25,lsMany*1.25-.1*f),loud=lsKl[i % 4]+uBands[i+3];
float ox=(f-4.)*.215+.07*(h-.5),away=ox+.12-.27*willow;
ox+=.11*(away<0.?-1.:1.)*(1.0 - smoothstep(0., .2,abs(away)));
vec2 q=p-vec2(ox,.02+.34*(h2-.5)+.08*(1.-near)+.6*(1.-shown));
q.x+=.006*sin(uTime*(.4+.2*h)+f*2.)*(.3-q.y);
float R=(.006+.012*near)*(.8+.4*sat(loud))*shown*exp2(.7*uOwn[6]),d=length(q*vec2(1.,q.y>0.?.75:1.)),on=.3+.7*sat(loud)+.5*uCue;
if(shown<.01)continue;
col=mix(col,mix(vec3(.02,.016,.012)+vec3(1.,.5,.2)*.35*on*exp(-q.y*14.),vec3(.15,.13,.12),lsPale),lsDn(R*.14+lsPx,R*.14-lsPx,abs(q.x-.004*sin(q.y*20.+f)))*step(0.,q.y)*.9);
vec3 tint=mix(vec3(1.,.5,.17),lsHue(i % 4)*1.6+.1,.45);
col+=(1.-lsPale)*tint*on*(.22*exp(-d/R*.45)+.00025/(d*d+.002));
float reach=(.05+.11*near)*(.6+.5*sat(loud)+.3*uHits),s=0.;
vec2 k=q;float sink=.8+.9*willow+2.6*min(uOwn[5],0.);k.y+=sink*dot(q,q);
float rr=length(k),an=atan(k.y,k.x+1e-6)/TAU;
if(rr<reach*1.2){
float nn=13.,a=an*nn,id=mod(floor(a),nn),hh=hash11(id+9.*f),x=uTime/(2.2+1.8*hh)+9.*hh,u=fract(x),h3=fract(hash11(mod(floor(x),977.)+id)*7.7),len=reach*(.3+.7*h3);
float mid=.25+.5*mix(h3,.5,abs(uOwn[1])),y=abs(fract(a)-mid)*TAU/nn*rr,hd=len*smoothstep(0.,.35,u);
s+=lsLine(y,.0006)*lsDn(hd+1e-3,hd-.02,rr)*smoothstep(0.,len,rr)*lsDn(1.,.4,u)*step(.3,hh)*(1.-.8*abs(uOwn[1]));
vec2 tip=vec2(cos((floor(a)+mid)/nn*TAU),sin((floor(a)+mid)/nn*TAU))*len;
if(uOwn[1]!=0.)s+=lsHead(q-tip+vec2(0.,sink*dot(tip,tip)),len*.19,hh)*smoothstep(.2,.4,u)*lsDn(1.,.6,u)*step(.3,hh)*1.3;
}
col=mix(col+(1.-lsPale)*tint*s*on*1.9,mix(vec3(.12,.1,.1),lsHue(i % 4),.6),lsPale*sat(s*on*1.3));
float core=lsDn(R+lsPx,R-lsPx,d),z=sqrt(max(1.-d*d/(R*R),0.));
col=mix(col,mix(vec3(1.3,.3,.04),vec3(2.6,1.3,.4),z*(.4+.6*on)),core);
}
return col;
}
// The sparks over what stands behind them: light in the dark, ink on a pale ground.
vec3 lsOver(vec3 col,vec3 sp){
if(lsPale<=0.)return col+sp;
float l=max(sp.r,max(sp.g,sp.b));
return mix(col+sp*(1.-lsPale),mix(vec3(.05,.04,.05),sp/max(l,1e-3)*.6,.35),lsPale*sat(l*.8));
}
vec3 lsPine(vec2 p){
vec2 C=vec2(-.12,.085),T=.0009*vec2(sin(uTime*5.3),sin(uTime*6.7+1.));
float sh=4.*uCue*(1.-uCue);
T+=.004*sh*vec2(sin(uTime*15.),sin(uTime*19.+2.));
float swell=.5+.5*sin(uTime*.61),R=.0135+.0012*swell+.004*uLevel+.0015*lsPh;
R*=exp2(1.9*uOwn[6]);if(lsRope>0.)R*=1.-.6*lsRope;
float heat=.72+.1*swell+.25*uLevel+.3*uCue+.25*uMic;
vec2 q=p-C;
float d2=dot(q,q),reach=.95+.3*uSpace+.18*lsPh;
vec2 qs=q;
if(uOwn[5]!=0.){reach*=1.+.9*max(uOwn[5],0.);qs.y+=1.3*min(uOwn[5],0.)*d2;}
if(uOwn[6]>0.)reach*=1.+.4*uOwn[6];
 // the sparks
vec3 sp=vec3(0.);
float fire=0.;
for(int i=0;i<4;i++){
float f=float(i),x=uTime/(2.9+.53*f)+.31*f,e=mod(floor(x),991.),u=fract(x)*1.08;
float h=hash11(e+f*17.),h2=fract(h*91.7);
float amp=(i==0?1.6:i==2?1.2:.35)+(.4+uEnergy)*(.9*lsKl[i]+.8*lsGroup(i));
if(uOwn[7]!=0.)amp*=uOwn[7]<0.?1.+uOwn[7]:1.+.5*uOwn[7];
vec2 qn=qs;
if(lsRope>0.){qn.x-=lsRope*((f-1.5)*.36+.1);qn.y-=lsRope*.12*(f-1.5)*(f-1.5)*.35;}
fire+=amp*smoothstep(0.,.2,u)*lsDn(.9,.4,u);
float an=.5+f*TAU*.25+(h-.5)*1.5,L=(.15+.07*h2)*reach;
if(dot(qn,qn)>4.9*L*L)continue;
vec2 l=lsNeedle(qn,vec2(cos(an),sin(an)),L,h2,u);
vec3 tip=vec3(1.,.57,.18)*mix(vec3(1.),uKind[i]*1.7,(.25+.6*abs(uOwn[1]))*sat(lsKl[i]*2.+2.*abs(uOwn[1])));
sp+=min(amp,1.9)*(mix(vec3(1.,.33,.07),vec3(1.,.6,.2),lsDn(.6,.1,u))*l.x*1.8+tip*l.y*2.);
}
if(uOwn[7]>0.&&d2<.3){ // a full round burst
for(int j=0;j<2&&d2<.2;j++){
float nn=9.,a=atan(qs.y,qs.x+1e-6)/TAU*nn+uTime*.011,k=floor(a)+(j==0?0.:(fract(a)>.5?1.:-1.)),w=mod(k,nn),h=hash11(w+23.+nn),x=uTime/(4.3+2.*h)+5.*h,h2=hash11(mod(floor(x),977.)+w*3.3);
float an=(k+.5+.5*(h2-.5)-uTime*.011)*TAU/nn,u=fract(x)*1.08,loud=.5+lsKl[int(w)% 4]+lsGroup(int(w)% 4);
float LL=(.11+.14*h2)*reach;vec2 l=lsNeedle(qs,vec2(cos(an),sin(an)),LL,h2,u);
sp+=uOwn[7]*loud*.8*(vec3(1.,.45,.13)*l.x*1.6+vec3(1.,.57,.18)*mix(vec3(1.),uKind[int(w)% 4]*1.8,.5)*l.y*1.8);
}
}
 // a hit throws a whole burst
if(uHits>.01&&d2<.2){
float a=atan(qs.y,qs.x+1e-6)/TAU*8.+uTime*.013,id=floor(a),life=.42+.36*(1.-uHits);
for(int j=0;j<2;j++){
float k=id+(j==0?0.:(fract(a)>.5?1.:-1.)),w=mod(k,8.),h=hash11(w+3.3),an=(k+.5+.8*(h-.5)-uTime*.013)*TAU/8.;
vec2 l=lsNeedle(qs,vec2(cos(an),sin(an)),(.07+.15*fract(h*17.))*reach,h,life);
sp+=uHits*mix(vec3(1.,.3,.06),vec3(1.,.64,.26),uHits)*(l.x*2.4+mix(vec3(1.),uKind[4]*1.6,.4)*l.y*3.);
}
}
sp+=lsRing(q)+vec3(1.,.6,.24)*lsCrown(q,R,reach)*(.6+(1.2+uEnergy)*uHigh+1.5*uKeys);
fire+=1.6*uHits+1.2*uCue;
float lamp=.35+.5*uLevel+.16*swell+.35*fire;
 // the night, and the light of the drop in it
float dn=length(q);
vec3 col=mix(vec3(.0030,.0017,.0013),vec3(.0010,.0013,.0024),smoothstep(-.3,.45,p.y+.1*(noise(p*2.+.3*sin(uTime*.03))-.5)));
col+=uKind[0]*uDrone*.0016*lsDn(.35,-.35,p.y)+uKind[1]*uPad*.003*smoothstep(-.1,.5,p.y);
col+=vec3(1.,.36,.1)*lamp*(.03/(1.+dn*dn*400.)+.004/(1.+dn*dn*18.));
if(uOwn[7]>0.)lamp*=1.+.3*uOwn[7];
if(uOwn[3]!=0.||uOwn[4]!=0.)col=lsSky(col,p,q,p.y+.34,lamp);
float rail=sat(1.-1.5*max(abs(uOwn[2]),lsPale)),gone=.35*(1.-rail);
 // a wooden rail far below, lit from above, with one post
float ry=p.y+.362-.035*p.x+gone,dx=p.x-C.x;
float fall=1./(1.+dx*dx*6.);fall*=sqrt(fall);
if(ry<.12&&rail>0.){
float grain=noise(vec2(p.x*5.,ry*190.))*.6+noise(vec2(p.x*13.+7.,ry*460.))*.4;
vec3 wood=(vec3(.32,.13,.05)+.06*uKind[0]*uDrone)*(.3+1.2*grain)*lamp*fall;
vec4 m=piece(vec2((p.x+.86)/1.72,sat(.15-ry*8.)));
wood+=m.rgb*m.rgb*(.4+.6*uEnergy)*(.35+1.5*grain*grain)*vec3(1.15,.85,.65)*(.5+.5*fall)*2.*lsDn(.86,.6,abs(p.x));
float shade=lsDn(lsPx,-lsPx,ry+.03);
col=mix(col,wood*.62+vec3(1.,.5,.2)*.26*lamp*fall*fall*lsBump((ry+.028)/.0022),lsDn(lsPx,-lsPx,ry));
col=mix(col,wood*mix(.1,.05,sat(-ry*10.))+vec3(.0004,.0003,.0003),shade);
col=mix(col,vec3(.0013,.0009,.0008),lsDn(lsPx,-lsPx,ry+.088));
float post=abs(p.x-.475)-.026-.008*lsDn(.003,0.,abs(p.y+.262)-.008),pe=(p.x-.475)/.03;
float pm=lsDn(lsPx,-lsPx,max(post,p.y+.25+.03*pe*pe+gone));
float pg=noise(vec2(p.x*210.,p.y*6.)),side=sat(-.2-.9*pe);
col=mix(col,vec3(.32,.13,.05)*(.4+pg)*lamp*.4*(side*side*.5+.03)*exp(-2.*max(-p.y-.25,0.))+vec3(.0004,.0003,.0003),pm);
}
if(lsMany>0.)col=lsOthers(col,p,0.);
 // smoke, string, sparks, drop
vec2 sq=q-vec2(0.,.012);
float sm=lsSmoke(sq,.03+.03*uSpace);
if(uOwn[2]!=0.)col=lsGround(col,p,q,lamp);
if(sm>0.){vec3 haze=lsStain(sq)*sm*(.05+.13*uLevel*uEnergy+.3/(1.+dn*12.))*(.3+.35*lamp);col=lsPale>0.?mix(col+haze*(1.-lsPale),lsHue(1)*.5+.15,lsPale*sat(sm*.3)):col+haze;}
float h=q.y-R*1.1,sx=q.x-T.x*exp(-h*6.)-.16*h-.05*h*h-.004*sin(h*14.);
vec4 str=lsString(sx,h,.0035,.5+.6*lamp);
if(lsPale>0.)str.rgb+=lsPale*vec3(.3,.27,.24);
if(lsRope>0.)str=lsRoped(str,q,.1,.36,.042,lamp);
col=mix(col,str.rgb,str.a);
col=lsOver(col,sp);
vec4 dr=lsDrop(q-T,R,1.04+.5*uLow,heat,0.);
col+=vec3(1.,.35,.07)*.3*exp(-dn/R*1.6)*heat*(1.-.8*lsPale)*(1.-lsRope);
dr.a*=1.-lsRope;
return mix(col,dr.rgb,dr.a);
}
// One willow thread: out on the wind of the drop and down in a long bow, with a tiny fork at its end.
// q is measured from the drop with the thread's side as positive x; X how far out it ends, Y how far down, a how steep it leaves.
vec2 lsThread(vec2 q,float X,float Y,float a,float seed,float u){
if(q.x<0.||q.x>X+.05)return vec2(0.);
Y*=.9+.22*u;
float b=(a*X+Y)/(X*X);
if(q.y<-Y-.07||q.y>.25*a*a/b+.014)return vec2(0.);
float x=min(q.x,X),f=q.y-x*(a-b*x),sl=a-2.*b*x;
float k=x/X,hd=smoothstep(0.,.42,u)*X*1.02,d=abs(f)*inversesqrt(1.+sl*sl);
if(q.x>X)d=length(vec2(q.x-X,f));
vec2 res=vec2(0.);
if(d<.02){
float live=smoothstep(0.,.05,u)*lsDn(.3+.62*k,.12+.3*k,u-.06*k);
res.x=lsLine(d,.0010)*lsDn(hd+1e-3,hd-.06,x)*(.1+.9*k)*live*(.75+.25*sin(x*260./(1.+abs(sl))+seed*40.));
}
 // the fork
vec2 e=vec2(q.x-X,q.y+Y);
float rho=length(e),u2=u-.38;
if(rho<.07){
e.y+=3.*rho*rho;
float an=atan(e.y,e.x+1e-6)-atan(a-2.*b*X),id=clamp(floor(an/.3+.5),-3.,3.),hh=fract(seed*7.1+id*.377);
float off=min(abs(an-.3*id-.22*(hh-.5)),1.5),gl=(.012+.034*hh)*(1.-.24*abs(id)),al=rho*cos(off),hg=gl*smoothstep(0.,.15,u2);
float on=smoothstep(0.,.04,u2)*lsDn(.5,.12,u2);
if(uOwn[1]!=0.){float op=smoothstep(0.,.2,u2)*lsDn(.62,.3,u2);res.y=1.5*op*lsHead(vec2(q.x-X,q.y+Y),(.022+.032*fract(seed*5.3))*(.4+.6*op),seed);}
res.y+=(1.-abs(uOwn[1]))*on*(lsLine(rho*sin(off)+max(al-gl,0.),.0006*(1.-.8*sat(al/gl))+1e-5)*lsDn(hg+2e-3,hg-.005,al)+.8*exp(-rho*rho/7e-6)*lsDn(.25,0.,u2));
}
return res;
}
vec3 lsWillow(vec2 p){
const float WL=-.285;
vec2 C=vec2(.15,.15),w=p;
float under=lsDn(lsPx,-lsPx,p.y-WL),deep=max(WL-p.y,0.);
 // over still water: below the line the same things are seen again, broken by small waves
float rip=0.;
if(p.y<WL){
float far=.02+deep;
rip=noise(vec2(p.x*1.2/far,5./far-50.*sin(uTime*.007)))-.5+.5*(noise(vec2(p.x*3.1/far+9.,11./far-45.*sin(uTime*.0133+1.)))-.5);
w=vec2(p.x+rip*.12*(.25+2.*deep),WL+2.5*deep+rip*.09);
}
vec2 T=.001*vec2(sin(uTime*4.1),sin(uTime*5.3+1.))+.005*4.*uCue*(1.-uCue)*vec2(sin(uTime*13.),sin(uTime*17.+2.));
float swell=.5+.5*sin(uTime*.47),R=.0235+.0014*swell+.004*uLevel-.002*lsPh;
R*=exp2(1.5*uOwn[6]);if(lsRope>0.)R*=1.-.6*lsRope;
float heat=.74+.08*swell+.2*uLevel+.25*uCue+.25*uMic;
vec2 q=w-C;
float dn=length(q),reach=(.85+.3*uSpace)*(.92+.14*lsPh),fire=0.;
vec3 sp=vec3(0.);
vec2 qs=q;
if(uOwn[5]!=0.){reach*=1.+.6*max(uOwn[5],0.);}
for(int i=0;i<4;i++){
float f=float(i),x=uTime/(6.1+1.3*f)+.27*f,e=mod(floor(x),991.),u=fract(x)*1.12;
float h=hash11(e+f*23.+4.),sd=h<.5?-1.:1.;
float loud=lsKl[i]+.8*lsGroup(i),amp=(i==0?1.3:i==2?.9:.12)+(.4+uEnergy)*.9*loud;
fire+=amp*smoothstep(0.,.2,u)*lsDn(.95,.5,u);
if(f>1.5)sd=-sd*sign(hash11(e*1.7+2.)-.3);
vec3 tip=vec3(1.,.6,.22)*mix(vec3(1.),uKind[i]*1.7,(.25+.6*abs(uOwn[1]))*sat(lsKl[i]*2.+2.*abs(uOwn[1])));
if(uOwn[7]<0.)amp*=1.+uOwn[7];
if(lsRope<=0.&&uOwn[7]<=0.&&uOwn[5]>=0.&&qs.x*sd<0.)continue;
for(int j=0;j<5;j++){
if(j>2&&uOwn[7]<=0.)break;
vec2 qn=qs;float sj=uOwn[7]>0.&&(j==4||j==1)?-sd:sd;
if(lsRope>0.){float o=mix(mod(f*3.+float(j),12.)-5.5,(mod(f*7.+float(j)*5.+3.*e,28.)-13.5)*.43,max(uOwn[7],0.));qn.x-=lsRope*(o*.125-.15);qn.y-=lsRope*.0035*o*o;}
float g=float(j),h2=fract(h*(17.3+11.*g)+.37*g),h3=fract(h2*9.7),u1=u-.05*g;
float own=j==0?1.:smoothstep(.02,.35,loud)*(.9-.2*g);
if(j>2)own=uOwn[7]*(.25+.6*sat(loud));
if(lsRope>0.)own=mix(own,1.+loud,lsRope);
qn.x*=sj;
if(uOwn[5]<0.)qn=rot(2.5*uOwn[5])*qn;
if(qn.x<0.)continue;
vec2 l=lsThread(qn,(.14+.4*h2)*reach*(1.-.72*lsRope),(.1+.36*h3)*(1.+.1*lsRope),.25+1.7*fract(h3*5.3)*(1.-.6*h2),h2,u1);
sp+=min(amp,1.8)*own*(mix(vec3(.95,.24,.05),vec3(1.,.56,.2),lsDn(.7,.2,u1))*l.x*1.7+tip*l.y*2.2);
}
}
if(uHits>.01){
float sd=qs.x<0.?-1.:1.,life=.42+.36*(1.-uHits);
for(int j=0;j<5;j++){
float h=hash11(float(j)+8.*sd+20.),h2=fract(h*23.);
vec2 l=lsThread(vec2(qs.x*sd,qs.y),(.08+.3*h)*reach,.05+.25*h2,.2+2.*fract(h2*7.)*(1.-h),h,life);
sp+=uHits*mix(vec3(1.,.3,.06),vec3(1.,.64,.26),uHits)*(l.x*3.+mix(vec3(1.),uKind[4]*1.6,.4)*l.y*3.);
}
}
sp+=lsRing(q)+vec3(1.,.6,.24)*lsCrown(q,R,reach)*(.2+1.3*uHigh+1.5*uKeys);
fire+=1.6*uHits+1.2*uCue;
float lamp=.4+.5*uLevel+.16*swell+.25*fire;
 // the summer night: ink blue, paler where it meets the far bank
float up=w.y-WL;
vec3 col=mix(vec3(.0035,.0052,.0085),vec3(.0008,.0011,.0022),smoothstep(0.,.55,up+.06*(noise(p*vec2(1.5,4.))-.5)));
col+=uKind[0]*uDrone*.0045*exp(-up*9.)+uKind[1]*uPad*.0022*smoothstep(.1,.7,up);
if(up<.06)col=mix(col,vec3(.0006,.0007,.001),lsDn(.004,-.004,up-.016-.03*noise(vec2(w.x*2.3,3.))-.008*noise(vec2(w.x*17.,8.))));
if(uOwn[3]!=0.||uOwn[4]!=0.)col=lsSky(col,vec2(w.x,up+WL),q,up,lamp);
if(lsMany>0.)col=lsOthers(col,w,1.);
col+=(1.-lsPale)*vec3(1.,.4,.12)*lamp*(.03/(1.+dn*dn*160.)+.003/(1.+dn*dn*14.));
vec2 sq=q*vec2(-1.,1.)-vec2(0.,R);
float sm=lsSmoke(sq,.04+.03*uSpace);
if(sm>0.){vec3 haze=lsStain(sq)*sm*(.05+.13*uLevel*uEnergy+.2/(1.+dn*9.))*(.3+.35*lamp);col=lsPale>0.?mix(col+haze*(1.-lsPale),lsHue(1)*.5+.15,lsPale*sat(sm*.3)):col+haze;}
float h=q.y-R*1.15,sx=q.x-T.x*exp(-h*6.)+.3*h+.1*h*h-.004*sin(h*11.);
vec4 str=lsString(sx,h,.005,.5+.6*lamp);
if(lsPale>0.)str.rgb+=lsPale*vec3(.3,.27,.24);
if(lsRope>0.)str=lsRoped(str,q,-.15,.125,.0035,lamp);
col=lsOver(mix(col,str.rgb,str.a),sp)+vec3(1.,.38,.1)*.3*exp(-dn/R*1.6)*heat*(1.-lsPale)*(1.-lsRope);
vec4 dr=lsDrop(q-T,R,1.1+.5*uLow,heat,1.);
dr.a*=1.-lsRope;
col=mix(col,dr.rgb,dr.a);
 // the water keeps some of it
vec3 wat=col*(.5-.5*deep)*(.7+.8*rip)+vec3(.0006,.0010,.0018);
if(lsDye+lsPale>0.)wat+=(lsDye*.02+lsPale*.1)*lsHue(0);
vec4 m=piece(vec2((p.x+.86+.15*rip)/1.72,sat(.1+deep*3.9)));
wat+=m.rgb*m.rgb*(.25+.75*uEnergy)*.095*smoothstep(-.35,.5,rip)*lsDn(.88,.65,abs(p.x));
col=mix(col,wat,under);
return uOwn[2]!=0.?lsGround(col,p,q,lamp):col;
}
vec3 render(vec2 p){
lsPx=.6/uRes.y;
lsW=1.25-.4*uTone;
lsHalo=.34-.2*uTone;lsW*=1.+.9*max(uOwn[3],0.)+.5*max(uOwn[5],0.);
lsPh=.5-.5*cos(TAU*uLoop);
lsKl=vec4(uDrone,uPad,uTexture,uPhrase);
lsPale=max(uOwn[3],0.);lsDye=max(-uOwn[3],0.);lsMany=max(uOwn[0],0.);lsRope=max(-uOwn[0],0.);
return screenOf(uVar<.5?lsPine(p):lsWillow(p));
}