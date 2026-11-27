// name: Grain yard
// a: Drying mats
// b: Winnowing
// what: A mud roof in low morning sun with round straw mats of maize, red chillies, lentils and rice combed into furrows, the nearest cut by the frame, a rake left on one half-cleared mat and other roofs stepping down into haze; or grain tossed from a shallow basket before a dark barn door, falling to a heap while the chaff blows off.
// follows: Each kind dyes a mat or a layer of the toss in its colour; bands cut the furrows or fill the toss; the piece thickens and tints the nearest mat, or tints the heap. A hit runs over the chillies or along the toss; a cue is a bright rake stroke or a high throw. The loop walks round the furrows, travel turns the sun, keys light grains, voice lifts chaff.
// own: 0 moonlight at -1, a red evening at 1; 1 pale grain at -1, dark grain at 1; 2 two mats or a thin throw at -1, a full roof or a storm of grain at 1; 3 furrows like petals or a low flat throw at -1, straight furrows or a high throw at 1; 4 seen from above or close to at -1, from low down or far back at 1; 5 whitewashed at -1, dark red earth at 1
float gyPx, gyThin;
vec3 gySun, gySky, gyFog;
vec2 gyL; // along the ground towards the sun
float gyLv(int k) {return k==0?uDrone:k==1?uPad:k==2?uTexture:k==3?uPhrase:uHits; }
float gyS(float a, float b, float x) {x = sat((x-a)/(b-a)); return x*x*(3.-2.*x); }
vec2 gyH(vec2 p) {vec3 q = fract(p.xyx*vec3(.1031, .103, .0973)); q += dot(q, q.yzx+33.33); return fract((q.xx+q.yz)*q.zy); }
float gyLum(vec3 c) {return dot(c, vec3(.3, .59, .11)); }
// A crop that takes on the colour of a sound, as light or dark as it was.
vec3 gyDye(vec3 c, vec3 k, float a) {k = k*k+.02; return mix(c, k*gyLum(c)/gyLum(k), sat(a)); }
// The hour: 0 morning, -1 moonlight, 1 a red evening.
void gyHour() {
 float n = sat(-uOwn[0]), e = sat(uOwn[0]);
 gySun = mix(mix(vec3(1.62, 1.2, .72), vec3(.27, .38, .66), n), vec3(1.62, .68, .25), e);
 gySky = mix(mix(vec3(.15, .21, .36), vec3(.03, .045, .1), n), vec3(.17, .12, .3), e);
 gyFog = mix(mix(vec3(.88, .7, .49), vec3(.028, .048, .11), n), vec3(.78, .3, .17), e);
 gySun *= .94+.12*uLevel;
}
// Loose grains lying at q, one to a cell.
float gyZ, gyCov, gyId; vec2 gyN; float gyO;
void gyHeap(vec2 q, vec2 hs, float bend, float fill, float seed, float px, float lift) {
 gyZ = -.15; gyCov = 0.; gyId = .5; gyN = vec2(0); gyO = 0.; float sh = -1.;
 for (int j = 0; j<2; j++) {
  float fj = float(j);
  vec2 qq = q+fj*vec2(.47, .53), i = floor(qq-.5);
  for (int k = 0; k<4; k++) {
   vec2 id = i+vec2(k&1, k>>1), h = gyH(id+seed+fj*37.3);
   float g = fract(h.x*91.7+h.y*37.1), on = gyS(g-.06, g+.06, fill*1.12-.06);
   if (on<=0.) continue;
   vec2 d = qq-id-.5-(h-.5)*.42, a = h.yx-.5; a /= max(length(a), .01);
   vec2 e = vec2(dot(d, a), dot(d, vec2(-a.y, a.x)));
   e.y += bend*(e.x*e.x-.2); e /= hs*(.75+.2*g)*sqrt(on);
   float r = length(e), z = fj*.3+.35*h.y+lift*g, c = sat((1.-r)*hs.y/px+.5);
   vec2 o = d-gyL*.15, s = vec2(dot(o, a), dot(o, vec2(-a.y, a.x))); s.y += bend*(s.x*s.x-.2);
   sh = max(sh, (z+.75)*on*gyS(.9, .55, length(s/hs))-.5);
   if (c>0.&&z>gyZ-.12) {
    z += .4*sqrt(max(1.-r*r, 0.));
    vec2 n = a*e.x/(hs.x/hs.y)+vec2(-a.y, a.x)*e.y;
    gyZ = mix(gyZ, z, c); gyN = mix(gyN, n, c); gyId = mix(gyId, fract(g*7.7+h.x), c); gyCov = max(gyCov, c);
   }
  }
 }
 gyO = gyS(.02, .3, sh-gyZ);
}
// The mats: middle, size, and how big a grain of theirs is.
const vec4 gyMat[9] = vec4[9](
 vec4(-1.25, 3.62, .3, .04), vec4(2.02, 3.1, .5, .04), vec4(-1.95, 3.05, .66, .026), vec4(.3, 3.4, .4, .045),
 vec4(-.52, 2.92, .52, .027), vec4(.92, 2.5, .76, .08), vec4(-.98, 1.72, .98, .035), vec4(.72, 1.38, .5, .025), vec4(.03, 2.12, .3, .03));
const vec3 gyCrop[9] = vec3[9](
 vec3(.5, .2, .07), vec3(.17, .07, .09), vec3(.74, .7, .6), vec3(.8, .34, .06),
 vec3(.2, .27, .08), vec3(.56, .045, .02), vec3(.82, .5, .075), vec3(.78, .74, .64), vec3(.4, .3, .2));
const vec2 gyHalf[9] = vec2[9](
 vec2(.46), vec2(.52, .34), vec2(.6, .26), vec2(.47), vec2(.45), vec2(.8, .22), vec2(.46, .38), vec2(.62, .25), vec2(.46));
const int gyKind[9] = int[9](0, 2, 1, 4, 3, 1, 0, 2, 3);
float gyRad(int i) {
 float R = gyMat[i].z, w = uOwn[2], few = sat(-w), many = sat(w);
 if (w==0.) return i==0||i==8?0.:R;
 if (i==0||i==8) return R*gyS(.05, .9, many);
 if (i==6) return R*(1.-.12*many);
 if (i==5) return R*(1.+.1*few);
 return R*(1.-gyS(.1, .65, few))*(1.+.22*many);
}
// The furrows a foot has drawn at d on a mat.
float gyFur(vec2 d, float i, float fr) {
 float r = length(d), t = atan(d.y+1e-4, d.x), w = uOwn[3];
 float m = cos(TAU*fr*r+t+.5*sin(t*3.+i)+i);
 if (w<0.) m = mix(m, cos(t*18.+5.*r)*gyS(.05, .4, r), -w);
 if (w>0.) m = mix(m, cos((d.x*cos(i)+d.y*sin(i))*fr*6.+1.2*sin(d.y*2.)), w);
 return m*gyS(0., .12, r);
}
// Mud plaster.
vec3 gyMud(vec2 g, float fine, out float bump) {
 float a = noise(g*1.1+3.), b = noise((g+.5*vec2(a, noise(g*1.7+9.)))*rot(.3)*vec2(3., 13.)), c = noise(g*43.);
 bump = (b-.5)*.28*fine+(a-.5)*.25+(c-.5)*.12*fine;
 vec3 m = mix(vec3(.37, .255, .165), vec3(.47, .345, .235), a)*(.84+.14*b+.2*c*fine);
 m = mix(m, mix(m, vec3(.66, .63, .58), .85), sat(-uOwn[5]));
 m = mix(m, m*vec3(.42, .2, .15), sat(uOwn[5]));
 float k = noise(g*2.3+9.), cr = abs(k-.5+.1*(b-.5));
 m *= 1.-.45*gyS(.014, 0., cr)*gyS(.5, .65, a)*fine;
 vec2 u = g*9., id = floor(u), h = gyH(id); u = (u-id-.5-.5*(h-.5))*rot(h.x*6.3);
 float st = max(abs(u.y+.4*u.x*u.x)-.016, abs(u.x)-.05-.24*h.y);
 m = mix(m, vec3(.62, .48, .27), gyS(.02, -.005, st)*step(.5, fract(h.y*37.))*.6*fine);
 return m;
}
vec3 gyCol(int i) {
 vec3 c = gyCrop[i], d = mix(c, c.bgr, .6)*.26;
 return mix(mix(c, c*.25+vec3(.5, .47, .41), sat(-uOwn[1])), d, sat(uOwn[1]));
}
// Houses below: x, z, half width, depth, and how far down the roof lies.
const vec4 gyHs[9] = vec4[9](
 vec4(-3.3, 5.6, 1.7, 2.2), vec4(.9, 5.3, 1.25, 1.5), vec4(4.1, 6.6, 1.4, 2.4), vec4(-.9, 8.4, 1.4, 2.2), vec4(3.4, 10.6, 1.9, 2.6),
 vec4(-5.6, 10.4, 2.2, 3.), vec4(.9, 13.6, 2.2, 3.4), vec4(-3.6, 16.6, 2.4, 4.), vec4(6.9, 15., 2.6, 4.));
const float gyDn[9] = float[9](-.28, .2, -.02, .5, .85, .6, 1.5, 1.9, 1.3);
vec3 gyVillage(vec2 p, float hy, float f, float H, float zo) {
 vec3 ro = vec3(0, H, zo), rd = vec3(p.x, p.y-hy, f);
 float up = p.y-hy, r1 = .035+.05*noise(vec2(p.x*2.3+4., 1.))+.02*noise(vec2(p.x*9., 2.));
 vec3 haze = gyFog*mix(vec3(1.15, 1.1, 1.), vec3(.72, .82, 1.05), gyS(-.9, 1.1, p.x)), col = haze;
 col = mix(col, haze*vec3(.8, .84, .92), gyS(gyPx, -gyPx, up-r1)*.6);
 float best = 1e4; int face = 0, at = -1;
 for (int i = 0; i<9; i++) {
  vec4 h = gyHs[i];
  vec3 lo = vec3(h.x-h.z, -6., h.y), hi = vec3(h.x+h.z, -gyDn[i], h.y+h.w);
  vec3 iv = 1./(rd+1e-6), a = (lo-ro)*iv, b = (hi-ro)*iv, mn = min(a, b), mx = max(a, b);
  float tn = max(mn.x, max(mn.y, mn.z)), tf = min(mx.x, min(mx.y, mx.z));
  if (tn<tf&&tn>0.&&tn<best) {best = tn; at = i; face = tn==mn.y?1:tn==mn.x?0:2; }
 }
 if (at<0) return col;
 vec3 q = ro+rd*best; vec4 h = gyHs[at];
 vec3 mud = mix(mix(vec3(.45, .33, .22), vec3(.7, .67, .62), sat(-uOwn[5])*.9), vec3(.25, .12, .09), sat(uOwn[5])*.8);
 mud *= .85+.3*noise(q.xz*2.+q.y*3.);
 vec3 c;
 if (face==1) {
  vec2 u = q.xz-h.xy-vec2(0, h.w*.5), e = vec2(h.z, h.w*.5)-abs(u);
  c = mud*(gySun*.55+gySky);
  c = mix(c, mud*(gySun*.75+gySky), gyS(.12, .09, min(e.x, e.y)));
  for (int n = 0; n<2; n++) {
   float w = hash11(float(at*2+n)+3.), big = (.13+.12*w)*h.z;
   vec2 v = u-vec2((float(n)-.5)*h.z, (w-.5)*h.w*.3);
   vec3 crop = gyDye(gyCol((at*2+n*5+3) % 9), uKind[at % 5], gyLv(at % 5)*.4);
   c = mix(c, crop*(gySun*.6+gySky)*(1.+.15*sin(length(v)*22.)), gyS(.02, -.02, length(v)-big));
  }
 }else if (face==0) c = mud*(rd.x>0.?gySun*.95+gySky:gySky*1.2);
 else {
  c = mud*vec3(.95, .9, .9)*(gySky*1.5+gySun*.12);
  vec2 w = vec2(fract((q.x-h.x)/h.z*1.5+.5)-.5, (q.y+gyDn[at]+.42)/.15);
  c *= 1.-.6*gyS(.11, .09, abs(w.x))*gyS(1., .8, abs(w.y));
 }
 return mix(c, haze, 1.-exp(-max(best*f-4., 0.)*(.05+.06*uSpace)));
}
// How far from a straight stick.
float gyBar(vec2 p, vec2 d) {return length(p-d*sat(dot(p, d)/dot(d, d))); }
float gyRake(vec2 g) {
 vec2 h = vec2(1.12, 2.4), dir = normalize(vec2(.24, -.64)), pe = vec2(-dir.y, dir.x), q = g-h;
 vec2 u = vec2(dot(q, pe), dot(q, dir));
 float d = gyBar(u, vec2(0, 1.1))-.02;
 d = min(d, gyBar(vec2(abs(u.x), u.y), vec2(.27, 0))-.027);
 float tx = u.x-clamp(floor(u.x/.08+.5), -3., 3.)*.08;
 return min(d, gyBar(vec2(tx, u.y), vec2(0, -.1))-.011);
}
vec3 gyDrying(vec2 p) {
 p = p*(1.+.5*gyThin)+vec2(.3, 0)*gyThin;
 float low = sat(uOwn[4]), top = sat(-uOwn[4]);
 float hy = mix(mix(.57, .34, low), 1.5, top), f = mix(mix(1.4, 1.45, low), 1.75, top), H = hy*mix(1.72, 1.85, low);
 float zo = 2.5-1.78*f, v = hy-p.y, az = .36+.16*sin(uTravel*.013)+.04*sin(uTime*.02);
 gyL = vec2(-cos(az), sin(az));
 vec2 edge = vec2(.2, .98);
 float vv = max(v, .02), z = H*f/vv;
 vec2 g = vec2(p.x*z/f, z+zo);
 float off = dot(g, edge)-3.95;
// the low wall along the far edge of the roof
 float tw = (3.95-zo*edge.y)/max(p.x*edge.x+f*edge.y, .05), yw = H-v*tw;
 float zt = (H-.085)*f/vv; vec2 gt = vec2(p.x*zt/f, zt+zo); float ot = dot(gt, edge)-3.95;
 if (v<.02||(off>0.&&yw>.085&&ot>.16)) {
  vec3 c = vec3(0);
  for (int k = 0; k<2; k++) c += gyVillage(p+(float(k)-.5)*vec2(.5)*gyPx, hy, f, H, zo);
  return c*.5;
 }
 if (off>0.) {
  float b, isTop = gyS(-.01, .01, ot);
  vec3 m = gyMud(mix(vec2(p.x*3., yw*5.), gt, isTop), .6, b);
  vec3 c = m*mix(gySky*1.5+gySun*.22, gySun*(.8+b)+gySky, isTop);
  c *= .75+.25*gyS(0., .08, yw);
  return mix(c, gyFog, .2);
 }
 float fx = z/f*gyPx, fz = z/vv*gyPx, A = v/f;
 float fine = gyS(.04, .012, sqrt(fx*fz)), bump = 0., light = 1.; vec3 col = vec3(0);
// the shade of a house that is out of the picture
 float soft = .09-.04*uTone, shady = gyS(-soft, soft, dot(g, vec2(-gyL.y, gyL.x))+1.34)*gyS(-soft, soft, dot(g, gyL)+.12);
// the mat on top here, and the nearest
 int on = -1, near = -1; float nd = 1e3, od = 0.;
 for (int i = 0; i<9; i++) {
  float R = gyRad(i); if (R<.02) continue;
  vec2 d = g-gyMat[i].xy; float e = length(d)-R;
// the shade it throws on what lies under it
  if (e>0.&&e<.07) light *= 1.-.6*gyS(.02, -.03, length(d+gyL*.035)-R);
  if (e<fx) {on = i; od = e; }
  if (e<nd) {nd = e; near = i; }
 }
 int i = on>=0?on:near;
 if (on<0||od>-fx) col = gyMud(g, fine, bump);
 vec3 dir = normalize(vec3(gyL.x, .42, gyL.y));
 if (i>=0) {
  vec4 m = gyMat[i]; float R = max(gyRad(i), .02), fi = float(i);
  vec2 d = (g-m.xy)/R; float l = length(d);
  int kd = gyKind[i]; float lv = gyLv(kd)*(.6+uEnergy), lm = kd==4?0.:min(lv, 1.); // a hit only colours, it moves no furrow
  float ex = 1.;
  if (on>=0) {
// the mat: straw plaited over and under, with a bound rim
   float wv = 70.*R, wf = gyS(2., .5, fz*wv/R);
   float tw = sin(d.x*wv)*sin(d.y*wv);
   vec3 straw = vec3(.5, .37, .2)*(1.+.3*tw*wf)*(1.-.45*gyS(.02, .012, abs(abs(l-.86)-.03)))*(.85+.3*noise(g*9.));
   straw *= mix(1., .8+.22*sin(atan(d.y, d.x+1e-4)*120.)*wf, gyS(.955, .975, l));
   ex = gyS(fx, -fx, od);
   col = mix(col, straw, ex); bump = mix(bump, .12*tw*wf+.5*gyS(.93, .99, l)*dot(d, gyL), ex);
   light = mix(light, 1., ex);
  }
// how thick the grain lies
  float a = atan(d.y, d.x+1e-4);
  float rim = .85+.07*lm+.03*sin(a*4.+fi*2.);
  float thick = gyS(rim+.05, rim-.1, l), fill = thick;
  vec4 pc = vec4(0);
  if (i==6) {
   pc = piece(vec2(sat(.5+(d.x+.1)*.62), sat(.45-d.y*.6)));
   fill *= 1.+.4*pc.a;
  }else if (i==5) {
// half of it is raked clear
   float bite = length(d-vec2(.42, -.42))-.68;
   fill *= gyS(-.03, .06, bite+.03*sin(a*13.));
   thick *= gyS(-.02, .08, bite)*(1.+.6*exp(-bite*bite*60.));
  }
  float fr = R*7.5, amp = (.55+1.2*uEnergy*band(l)+.3*lm)*thick;
  float k = 0., path = 0., comb = exp(6.*(cos(a-TAU*uLoop)-1.))*.5; amp *= 1.+comb;
  float h0 = gyFur(d, fi, fr), hs = gyFur(d+gyL*.05/fr*2., fi, fr);
  if (i==6) {
// a cue: one fresh stroke of the rake
   float st = abs(length(d-vec2(-.2, 1.1))-1.05), head = d.x*.6+.1;
   path = gyS(.2, .08, st);
   k = sat(1.6*uCue)*path*gyS(.12, -.12, head+.05-1.2*(1.-uCue*uCue));
   float c = cos(st*90.), cs = cos((st+.01*sign(d.y))*90.);
   h0 = mix(h0, c, k); hs = mix(hs, cs, k); amp *= 1.+k;
  }
  fill *= mix(1.1, .72+.45*sat(.6+.6*h0), sat(amp*1.1));
// a few have strayed
  if (l>rim-.05) fill = max(fill, .13*exp(-max(l-rim, 0.)*R*11.));
  float ring = length(d-vec2(-.45, .2))-1.2*(1.-uHits), jump = i==5?uHits*exp(-ring*ring*7.):0.;
  float px = sqrt(fx*fz)/m.w, det = gyS(.75, .3, px);
  float st = mix(1., clamp(1./max(A, .2), 1., 1.9), i==5?.25:.62);
  vec3 crop = gyCol(i);
  if (i==6) crop = gyDye(crop, pc.rgb/max(pc.a, .05), min(pc.a, .7)*(.4+.5*uEnergy));
  crop = gyDye(crop, uKind[kd], min(lv, 1.)*(i==6?.15:i==5?.14:.3));
  vec3 flatC = crop*mix(.82, .7, det); float fc = gyS(0., .55, fill), shade = 0.; vec2 nn = vec2(0);
  if (det>0.) {
   vec2 q = (g-m.xy)/m.w; q.y /= st; q *= 1.02;
   gyHeap(q, gyHalf[i], i==5?.28:0., min(fill, 1.), fi*7.3, px, jump);
   vec3 c = crop*(.72+.56*gyId)*mix(.45, 1.05, gyS(-.1, .65, gyZ));
   c *= 1.+2.2*uKeys*gyS(.93, .97, gyId);
   float base = gyS(.5, .85, fill);
   flatC = mix(flatC, mix(crop*.22, c, gyCov), det);
   fc = mix(fc, max(gyCov, base), det); shade = gyO*det; nn = gyN*det*gyCov;
   light *= mix(1., 1.-.75*gyO*(1.-gyCov), det*(1.-base)*step(.02, fill));
  }
  if (on<0) fc *= gyS(.4, .0, nd);
// light on the heap
  float slope = (hs-h0)*amp*.75; // it rises towards the sun
  float sha = gyS(.15, .9, (hs-h0)*amp);
  vec3 n = normalize(vec3(nn.x*.9-gyL.x*slope, 1., nn.y*.9-gyL.y*slope));
  float nl = sat(dot(n, dir))/dir.y;
  float lit = nl*(1.-.72*shade)*(1.-.55*sha);
  vec3 heap = flatC*(gySun*min(lit, 2.2)*.62+gySky*(1.+.3*h0*amp));
  heap *= 1.+3.*jump+comb*.12+1.3*k+.5*uCue*path;
  col = mix(col*(light*gySun*(.62+bump)+gySky), heap, sat(fc));
 }else col *= light*gySun*(.62+bump)+gySky;
 vec3 cool = gySky/max(gySky+gySun*.62, .001);
 col *= mix(vec3(1), cool*1.5, shady);
// the rake and its shadow
 if (g.x>.7&&g.x<2.&&g.y<2.9) {
  float sc = gyS(.012, -.012, gyRake(g+gyL*.075)); col *= 1.-.68*sc;
  float rd = gyRake(g), c = gyS(fx, -fx, rd), tip = gyRake(g+gyL*.008)-rd;
  col = mix(col, vec3(.27, .145, .07)*(gySun*(.55+45.*tip)+gySky), c);
 }
 col = mix(col, gyFog, (1.-exp(-max(g.y-2.4, 0.)*.07))*(.6+.8*uSpace));
 return col;
}

// Where a thrown grain is, and how far the throw has spread.
vec2 gyFrom, gyTo;
vec3 gyFly(float s, float k) {
 float A = (.335+.12*uOwn[3]+.4*uCue*(1.-uCue))*(.8+.1*mod(k*2., 5.));
 return vec3(gyFrom.x-(gyFrom.x-gyTo.x)*(.86+.075*k)*s, mix(gyFrom.y, gyTo.y, s)+4.*A*s*(1.-s), .03+.2*sat(s*1.4)*(1.1-.35*s));
}
vec3 gyWinnow(vec2 p0) {
 float zoom = 1.+.28*max(uOwn[4], 0.)-.36*max(-uOwn[4], 0.);
 zoom += .8*gyThin; float px = gyPx*zoom;
 vec2 p = vec2(-.02, -.1)+(p0-vec2(-.02, -.1))*zoom+vec2(.13, -.06)*gyThin;
 float n2 = gyH(floor(p*150.)+300.).x, cue = uCue*(1.-uCue), tr = .03*sin(uTravel*.012);
 vec3 sun = gySun*.62;
// the wall: clay in full sun, under the shade of the thatch
 float eave = p.y-.37+.1*p.x+tr+.014*noise(vec2(p.x*45., 1.))+.035*noise(vec2(p.x*8., 2.));
 float light = gyS(.008, -.008, eave);
 vec2 dq = vec2(abs(p.x+.17)-.43, p.y-.33);
 float dd = max(dq.x, dq.y), fr = max(dq.x-.045, dq.y-.05);
 light *= 1.-.8*gyS(.02, -.006, max(abs(p.x+.2)-.475, dq.y-.05));
 float bump; vec3 col = vec3(0);
 if (fr>-px&&p.y>-.27) {
 vec3 wall = gyMud(p*2.3+7., 1., bump)*(1.4-.2*sat(-uOwn[5]));
 col = wall*(sun*light*(.95+1.2*bump)+gySky*(1.+bump)+gySun*vec3(.1, .08, .05));
 }
// the door, framed in old beams
 float gr = noise(dq.x>dq.y-.02?vec2(p.x*120., p.y*5.):vec2(p.x*5., p.y*120.));
 vec3 beam = mix(vec3(.13, .07, .04), vec3(.33, .21, .13), gr)*(sun*gyS(.008, -.008, eave)*(.8+.5*gr)+gySky);
 col = mix(col, beam*(1.-.5*gyS(.014, 0., dd)), gyS(px, -px, fr));
 float inn = gyS(px, -px, dd), hay = p.y+.08+.05*sin(p.x*9.)+.05*noise(vec2(p.x*26., 3.));
 vec3 dark = vec3(.014, .009, .008)+vec3(.05, .027, .011)*noise(vec2(p.x*70.+12.*p.y, p.y*4.))*gyS(.03, -.12, hay);
 col = mix(col, dark*(gySun/1.2+.12), inn);
// the beaten floor, and straw on it
 float isF = gyS(px, -px, p.y+.255+.006*noise(vec2(p.x*30., 0.)));
 if (isF>0.) {
 float gz = .16/max(-.095-p.y, .02), b2;
 vec3 fl = gyMud(vec2(p.x*gz, gz)*2.2, gyS(2.2, .7, gz), b2)*1.4;
 float st = max(noise(p*rot(.35)*vec2(34., 190.)), noise(p*rot(-.3)*vec2(40., 220.)));
 fl += vec3(.22, .16, .07)*gyS(.72, .85, st)*(1.-gyS(.05, -.2, p.y+.5));
 fl *= sun*(.9+.5*b2)+gySky;
 fl *= 1.-.75*inn*gyS(-.31, -.255, p.y);
 col = mix(col, fl, isF);
 }
 vec3 gold = mix(mix(vec3(.95, .58, .15), vec3(.9, .86, .76), sat(-uOwn[1])), vec3(.17, .075, .09), sat(uOwn[1]));
// the heap of clean grain, and its shadow to the left
 const vec2 hp = vec2(-.2, -.37);
 float w = .33, hgt = .2+.035*uOwn[3];
 vec2 c0 = p-hp;
 col *= 1.-vec3(.66, .62, .55)*isF*gyS(.12, -.1, length(vec2((c0.x+.17)/(w*1.25), c0.y/.068))-1.);
 float inC = min(hgt*(1.09-sqrt(c0.x*c0.x+.0012)/w)-c0.y, c0.y+sqrt(max(1.-c0.x*c0.x/(w*w), 0.))*.052)+.004*(n2-.5);
// grain that has rolled away lies round it
 float near = length(vec2(c0.x/w, (c0.y-.01)/.06)), loose = .5*exp(-max(near-1., 0.)*3.4)*isF;
 if (inC>-.01||loose>.05) {
  float t = sat(c0.y/hgt), hw = max(w*(1.-t), .02), sf = clamp(c0.x/hw, -.96, .96), cf = sqrt(1.-sf*sf), on = gyS(-px, px, inC);
  vec2 cell = on>.5?vec2(c0.x/.0085, (c0.y+cf*.05*(1.-t))/.0066):p/vec2(.0085, .006);
  vec4 pc = piece(vec2(sat(.5+c0.x*1.35), sat(.9-(c0.y+.04)*3.6)));
  gyHeap(cell, vec2(.58, .38), 0., on>.5?1.1:loose, 3., px/.0085, 0.);
  vec3 c = gyDye(gold*.88, pc.rgb/max(pc.a, .05), pc.a*.55*(.3+uEnergy))*(.7+.55*gyId)*mix(.4, 1.1, gyS(-.1, .6, gyZ));
  c *= 1.+1.5*uKeys*gyS(.94, .97, gyId);
  float nl = sat(dot(vec3(sf*.62, .72, cf*.62), vec3(.7, .5, .4))+.3*gyN.x*gyCov);
  col = mix(col, c*(sun*mix(1., nl*1.35, on)*(1.-.5*gyO)+gySky*.8), max(on, gyCov));
 }
// the basket, low on the right, tipped towards the heap
 float cyc = sin(uTime*TAU/12.)*.012;
 vec2 bc = vec2(.68, -.2+cyc+.2*cue), bq = (p-bc)*rot(.3), bo = bq/.34;
 gyFrom = bc+vec2(-.27, .03); gyTo = hp+vec2(0, hgt);
 float el = length(vec2(bo.x, bo.y/.3)), under = length(vec2(bo.x, (bo.y+.02)/.52)), an = atan(bo.y/.3, bo.x+1e-4);
 vec2 bs = (bo+vec2(.25, .3))*rot(-.15);
 col *= 1.-.5*gyS(1.15, .85, length(vec2(bs.x, bs.y/.33)))*(1.-inn*(1.-isF));
 if (bo.y<0.&&under<1.05&&el>.9) {
  float aa = atan(bo.y*2., bo.x);
  vec3 c = vec3(.5, .33, .17)*(.7+.3*sin(aa*46.)*sin(under*60.))*(gySky*1.1+sun*(.1+.25*sat(bo.x))+gySun*.1);
  col = mix(col, c, gyS(px*3., -px*3., under-1.));
 }
 if (el<1.06) {
  vec3 c = vec3(.68, .45, .22)*(.75+.22*sin(an*46.+floor(el*15.)*PI)+.25*abs(fract(el*15.)-.5))*(sun*(.5+.4*gyS(.8, -.9, bo.x))+gySky);
  float gl = length(vec2(bo.x+.25, (bo.y+.02)/.22))-.62+.05*sin(an*6.);
  if (gl<.1) {
   gyHeap(vec2(bq.x, bq.y*2.1)/.0095, vec2(.56, .36), 0., gyS(.1, -.1, gl), 9., px/.0095, 0.);
   c = mix(c, gold*(.7+.5*gyId)*mix(.4, 1., gyS(-.1, .6, gyZ))*(sun*(1.-.5*gyO)+gySky), max(gyCov, gyS(0., -.2, gl)));
  }
  float rim = gyS(.93, .95, el);
  c *= 1.-.35*gyS(.8, .93, el)*(1.-rim);
  c = mix(c, vec3(.5, .31, .14)*(.75+.35*sin(an*90.+el*60.))*(sun*(.75+bo.y)+gySky), rim);
  col = mix(col, c, gyS(px*4., -px*4., el-1.04));
 }
// the chaff, carried away to the left as a lit veil
 float much = 1.+.7*uOwn[2], cyP = uTime/14.;
 vec2 o = p-gyFly(.45, 1.).xy; float dn = -o.x;
 float wd = .035+.25*max(dn, 0.), v = (o.y+.02+.22*dn*dn)/wd;
 float m = exp(-v*v*(v>0.?2.:.8))*gyS(-.16, .12, dn)*gyS(1.2, .1, dn)*(.62+.35*uLow+.3*uMic+.5*uCue)*much;
 m = max(m-.01, 0.);
 if (m>0.) {
 float t1 = uTime*.05, bend = v+.5*noise(vec2(dn*4.-t1, v*2.));
 float ve = noise(vec2(dn*3.-t1, bend*4.))*.6+noise(vec2(dn*7.-t1*2., bend*13.+9.))*.4;
 vec3 air = mix(gold, vec3(1., .87, .62), .7)*(sun*1.7+gySky);
 col = mix(col, air, min(m*(.1+1.7*ve*ve), .9));
 for (int k = 0; k<2; k++) {
  float sc = 44.+40.*float(k); vec2 u = (p+vec2(0, .012*sin(uTime*.4+p.x*5.)))*rot(.3-.52*float(k))*sc+vec2(fract(uTime*.03*sc/97.)*97., float(k)*7.3), id = floor(u), h = gyH(vec2(mod(id.x, 97.), id.y));
  float g = fract(h.x*57.+h.y*131.);
  u = (u-id-.5-.7*(h-.5))*rot(h.x*6.3+.5*sin(uTime*.5+h.y*9.));
  float f = length(u*vec2(1., 3.))-.04-.12*h.y*h.y;
  col = mix(col, air*1.25, gyS(px*sc*3., -px*sc, f)*gyS(g, g+.2, m*(.3+1.6*ve)-.12)*.9);
 }
 }
// the grain in the air, at five depths; it goes up in clouds, one throw after another
 for (int k = 0; k<5; k++) {
  float fk = float(k), lv = gyLv(k), W = (gyFrom.x-gyTo.x)*(.86+.075*fk), s = (gyFrom.x-p.x)/W;
  if (s<-.05||s>1.15) continue;
  vec3 y = gyFly(s, fk), at; vec2 t = normalize(gyFly(s+.02, fk).xy-y.xy); float wq = (p.y-y.y)/y.z;
  if (abs(wq)>1.3) continue;
  float Ns = 54.-4.*fk, Nw = 9., ph = fract(cyP*Ns/64.)*64., bd = .25*band(s)*uEnergy;
  vec2 q = vec2(s*Ns-ph, wq*Nw), i = floor(q-.5);
  for (int n = 0; n<4; n++) {
   vec2 id = i+vec2(n&1, n>>1), h = gyH(vec2(mod(id.x, 64.), id.y)+fk*71.), c = id+.5+(h-.5)*.6;
   float sd = (c.x+ph)/Ns, wi = c.y/Nw, g = fract(h.x*57.+h.y*131.);
   float cloud = .5+.5*cos(TAU*(sd-cyP)+fk*.5), hit = (sd-1.+uHits)*5.;
   float fill = (.3+.34*cloud+.4*lv*(.5+uEnergy)+bd)*much*exp(-wi*wi*2.4);
   if (fill<g-.08) continue;
   at = gyFly(sd, fk);
   float on = gyS(g-.08, g+.08, fill)*gyS(0., .05, sd)*gyS(1.06, .97, sd), r = (.0015+.0023*h.y*h.y+.0005*fk)*on;
   vec2 d = p-at.xy-vec2(0, wi*at.z); d -= t*clamp(dot(d, t), -.0035, .0035);
   float glow = uHits*exp(-hit*hit)+.7*uKeys*gyS(.9, .95, g);
   vec3 gc = gyDye(gold, uKind[k], min(lv, 1.)*.34)*(.6+.7*g)*(sun*(1.2+.25*d.y/max(r, .001)+1.6*glow)+gySky);
   col = mix(col, gc, gyS(r+px, max(r-px, 0.), length(d))*sat(on*3.));
  }
 }
 return col;
}
vec3 render(vec2 p) {
 gyThin = gyS(1.3, .6, uRes.x/uRes.y); gyPx = 1./uRes.y; gyHour();
 vec3 c = uVar<.5?gyDrying(p):gyWinnow(p);
 c = max(c, 0.); c = c*(1.+.1*c)/(1.+.22*c);
 return pow(sat(c), vec3(.4545));
}
