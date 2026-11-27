// name: Finish strip
// a: Things passing
// b: Once round
// what: A long photograph taken through a slit, time laid out sideways on white paper: a high bicycle with bent spokes, birds, cloth on poles and turning leaves over streaks of ground that never moved. Or the painted skin of a round clay pot unrolled: wading birds, reeds, spirals and hatching between two dark rims.
// follows: Across is the loop: each stroke is a sheaf of streaks, or darker paint. Drones darken and stretch the bicycle or fill the spirals, pads the cloth or reeds, texture the leaves or hatching, phrases the birds. Bands are ground streaks or turned lines. A hit is a needle at the playhead; a cue widens the middle; Tone sharpens, Space pales, keys darken the scale.
// own: 0 1 a dark ground with everything drawn light on it, -1 a ground of raw clay in the drone's colour; 1 1 many small things in rows, -1 few and near; 2 1 only birds, a flock of them (b: a thicket of reeds), -1 only cloth, a parade (b: fish); 3 1 drawn as outlines alone, -1 smeared sideways (b: the paint has run down); 4 1 rolled up, a drum standing (b: a round pot), -1 swaying in long waves; 5 1 bare, nothing but the things, -1 streaks and bands over everything; 6 1 laid in small stones, -1 woven; 7 1 a great sun behind, -1 rain across it
float fnPx, fnDx, fnNow, fnHit;
float fnGain;
// A soft step from a to b, whichever is the larger.
float fnS(float a, float b, float x) { x = sat((x-a)/(b-a)); return x*x*(3.-2.*x); }
float fnQuiet = 1.;
float fnOdd;
// A shape, or only the line round it.
float fnLine(float f) { return uOwn[3] > .0 ? max(f, -f-mix(.5, .045, uOwn[3])) : f; }
vec3 fnLt(vec3 c) { return mix(c, c*.6+.5, max(uOwn[0], .0)); }
vec3 fnBase(vec3 c) { return mix(mix(c, uKind[0]*uKind[0]*.3*c, max(uOwn[0], .0)), c*(.16+.95*uKind[0]), max(-uOwn[0], .0)); }
float fnHide(float x) { return 1.-sat(x); }
float fnEdge(float f) { float w = fwidth(f)*mix(1.5, .7, uTone)+1e-5; if (fnOdd > .0) w = min(w, .2); return fnS(w, -w, fnLine(f)); }
// The same where cells would show in fwidth.
float fnCell(float f) { float w = min(fwidth(f), 5./uRes.y)*mix(1.5, .7, uTone)+1e-5; return fnS(w, -w, fnLine(f)); }
float fnBell(float x) { return exp(-x*x); }
// A kind's colour as a muted ink.
vec3 fnInk(int k, vec3 own, float dark) {
 vec3 c = uKind[k];
 c = mix(vec3(dot(c, vec3(.333))), c, .7);
 c *= 1./max(max(c.r, max(c.g, c.b)), .05);
 return mix(mix(own, c*dark, .36), uKind[k]*.85+.18, max(uOwn[0], .0));
}
// The piece at a place on the strip; and round it: x its strength, y how long it lasts there.
float fnOne(vec2 c) { return piece(vec2(c.x/1.78+.5, clamp(.5-c.y/.78, .06, .94))).a; }
vec2 fnThere(vec2 c, float span) {
 float m = fnOne(c), l = fnOne(c-vec2(span, .0)), r = fnOne(c+vec2(span, .0));
 return vec2(sat(max(m, .7*max(l, r))*1.3), sat((l+m+r)*.45));
}
// A wheel that rolled past the slit, in its radii: the spokes come out bent.
float fnWheel(vec2 q, float n, float turn) {
 float r = length(q), a = r > 1e-4 ? atan(q.y, q.x) : .0;
 float m = fnEdge(abs(r-.965)-.035);
 m = max(m, .7*fnEdge(abs(r-.895)-.008));
 m = max(m, fnEdge(r-.085));
 float f = sin(.5*n*(a+q.x-turn)), w = fwidth(f), th = .5*n*.0075/max(r, .05);
 float s = fnS(th+w, max(th-w, .0)-1e-4, abs(f));
 s = mix(s, sat(th*.8), fnS(.7, 1.8, w));
 return max(m, .85*s*step(r, .95)*step(.06, r));
}
// A high bicycle: big wheel, little wheel, the bent backbone between.
float fnCycle(vec2 q, float turn) {
 float m = fnWheel(q, 22., turn);
 m = max(m, fnWheel((q-vec2(1.2, -.65))/.35, 12., turn*2.857));
 float r = length(q), a = r > 1e-4 ? atan(q.y, q.x) : .0;
 float s = sat((1.72-a)/2.22);
 float back = abs(r-(1.12+.245*s*s))-.036+.018*s;
 m = max(m, fnEdge(max(back, max(a-1.575, -.494-a))));
 m = max(m, fnEdge(max(abs(q.x+.015)-.024-.012*sat(q.y), max(-q.y, q.y-1.2))));
 float bx = q.x+.06, bar = max(abs(q.y-1.2+1.1*bx*bx)-.017-.06*bx*bx, abs(bx)-.26);
 float seat = length((q-vec2(.27, 1.2-.12*q.x))*vec2(1., 3.6))-.15;
 return max(m, fnEdge(min(bar, seat)));
}
// A bird flying left, bent by its beat. x near wing and body, y the far wing.
vec2 fnBird(vec2 q, float beat) {
 float bob = .07*sin(beat+q.x*2.2);
 float y = q.y-bob, s = q.x;
 float t = sat(1.-s*s);
 float body = abs(y)-.17*pow(t, .62)*(1.-.6*s)*(1.-.12*fnBell((s+.62)/.12));
 body = max(body, abs(s)-1.);
 float beak = max(abs(y+.02)-.05*sat((s+1.22)/.3), max(-1.22-s, s+.8));
 float tf = (s-.55)/.85;
 float tail = max(abs(abs(y)-.11*tf*tf)-.06*(1.-tf), max(-tf, tf-1.));
 float H1 = 1.05+.3*sin(beat), H2 = .75-.3*sin(beat+.8);
 float h = sat((y-.02)/H1);
 float sc = -.22-.75*h*(1.-h)+1.05*h*h+.12*sin(beat+h*3.);
 float near = max(abs(s-sc)-.36*pow(1.-h, .65), max(-y, y-.02-.97*H1));
 h = sat((.05-y)/H2);
 sc = -.12-.4*h+1.15*h*h;
 float far = max(abs(s-sc)-.3*pow(1.-h, .7), max(y-.05, .05-y-.97*H2));
 return vec2(max(fnEdge(min(min(body, beak), tail)), fnEdge(near)), fnEdge(far));
}
// A leaf that turned over as it went by. x cover, y which face and rib.
vec2 fnLeaf(vec2 q, float ph) {
 float s = q.x, y = q.y-.35*sin(s*1.6+ph*.7);
 float c = cos(s*2.3+ph), w = .42*sat(1.-s*s)*(1.-.25*s);
 float f = max(abs(y)-w*(.1+.9*abs(c)), abs(s)-1.);
 float stem = max(abs(y)-.022, max(.9-s, s-1.5));
 float rib = fnEdge(abs(y)-.014);
 return vec2(max(fnEdge(f), fnEdge(stem)), .5+.35*fnS(-.3, .3, c)-.3*rib);
}
// Cloth on a pole. x cover, y the light on its folds, z its hem.
vec3 fnCloth(vec2 q, float len, float tall, float ph) {
 float t = q.x/len, g = fnS(.0, .62, t), wv = t*10.-ph;
 float lift = .36*tall*g*sin(wv)+.14*tall*g*sin(wv*1.7+1.);
 float top = lift-.05*t, low = lift-tall*(1.-.5*t)*(1.-.3*g*sin(wv+1.5))-.03*t;
 float v = (q.y-low)/max(top-low, .01);
 float end = 1.-.16*(1.-abs(2.*v-1.));
 float f = max(max(q.y-top, low-q.y), max(-q.x, (t-end)*len));
 float fold = sin(wv+.9+1.2*v)*g;
 return vec3(fnEdge(f)*fnS(-.2, .0, 1.02-t), fold, fnS(.1, .0, min(v, 1.-v)));
}
const vec3 fnLeaves[7] = vec3[7](vec3(.68, -.25, .05), vec3(-.72, -.2, .042), vec3(.77, -.1, .026), vec3(-.08, .31, .02), vec3(.14, .1, .022), vec3(-.47, .08, .026), vec3(.66, .27, .018));
// A great sun, drawn long by the slit, and rain.
vec3 fnSun(vec3 col, vec2 P, vec2 c) {
 vec2 q = (P-c)/vec2(.26, .2); float r = length(q), R = sqrt(uOwn[7]), rays = .5+.5*noise(vec2(P.y*60., P.x*2.));
 vec3 k = mix(uKind[4], vec3(1., .95, .85), .05+.2*uLevel);
 col = mix(col, k, (.3+.4*fnHit+.2*uCue)*uOwn[7]*exp(-max(r-R, .0)*3.)*rays);
 return mix(col, k*(.86+.14*rays+.16*noise(q*2.3+7.)-.1*r/max(R, .1)), .94*fnS(.015, -.015, r-R));
}
vec3 fnRain(vec3 col, vec2 P) {
 for (int i = 0; i < 2; i++) {
  float f = float(i); vec2 q = vec2(P.x+P.y*.22, P.y)*vec2(48.-18.*f, 5.-2.*f); float id = floor(q.x);
  q.y += uTime*(.7+.25*f)+9.*hash11(id+f*50.); float h = hash21(vec2(id, mod(floor(q.y), 64.))+f), y = fract(q.y);
  col = mix(col, mix(fnInk(2, fnLt(vec3(.3, .34, .38)), .5), vec3(.97), .55*f), -uOwn[7]*step(.45, h)*fnS(.12, .05, abs(fract(q.x)-.5)+.06*abs(y-.5))*fnS(.0, .2, y)*fnS(.9, .5, y)*sat(.5+.35*uTexture+.5*uHits));
 }
 return col;
}
vec3 fnPassing(vec2 P) {
 float foot = -.365;
 vec2 W = P;
 if (uOwn[1] < .0) P = (P-vec2(.12, -.33))*(1.+.5*uOwn[1])+vec2(.12, -.33);
 if (uOwn[1] > .0) {
  float s = exp2(1.585*uOwn[1]), row = floor((.395-P.y)*s/.76);
  P = vec2(mod(P.x*s+.73*row+.89, 1.78)-.89, .395-mod((.395-P.y)*s, .76));
 }
 if (uOwn[3] < .0) P.x += uOwn[3]*.2*(fnS(.3, .8, noise(vec2(W.x*.7+uTime*.02, W.y*36.)))*noise(vec2(3., W.y*110.)));
 float flock = max(uOwn[2], .0), flags = max(-uOwn[2], .0), bands = max(-uOwn[5], .0), some = fnHide(uOwn[5]);
 float n1 = noise(vec2(W.x*.35, P.y*34.)), n2 = noise(vec2(W.x*.6, P.y*110.+40.)), n3 = noise(vec2(W.x*1.4, P.y*380.));
 float gnd = fnS(-.06, -.2, P.y);
 vec3 col = mix(vec3(.905, .91, .905), vec3(.83, .822, .8), gnd);
 col -= .06*fnS(-.02, .42, P.y);
 float str = (n1-.5)*.5+(n2-.5)*.35+(n3-.5)*.25;
 col = fnBase(col);
 col *= 1.+str*mix(.06, .26, gnd)*some*fnQuiet;
 if (uOwn[7] > .0) col = fnSun(col, P, vec2(.36, .14));
 col *= 1.-.16*some*fnBell((P.y+.125+.004*n1)/.012)-.1*fnBell((P.y+.155)/.004);
 float at = sat((P.y-foot)/.76);
 float st = fnS(.46, .8, noise(vec2(W.x*.5-uTime*.01, P.y*46.+9.)))+.7*fnS(.55, .85, noise(vec2(W.x*.9+5., P.y*150.)));
 vec3 tint = mix(vec3(.27, .37, .42), vec3(.60, .33, .25), fnS(.42, .62, noise(vec2(W.x*.15, P.y*19.+31.))));
 col = mix(col, fnLt(tint), sat(st*band(at)*(.58-.28*at))*some);
 if (bands > .0) {
  float by = P.y*9.+.4*noise(vec2(W.x*.4, P.y*3.)), bi = floor(by), bf = by-bi, bh = hash11(bi+2.);
  vec3 bc = mix(uKind[int(mod(bi+40., 4.))], vec3(.5), .1)*(.5+.7*bh);
  col = mix(col, bc*(.85+.3*n2), bands*.85*fnS(.0, .1, bf)*fnS(.25+.75*bh, .15+.75*bh, bf)*(.45+.55*fnS(.25, .6, n1*.6+.4*n2)));
 }
 vec4 m = piece(vec2(W.x/1.78+.5, clamp(.5-W.y/.78, .04, .96)));
 vec3 hue = m.rgb/max(max(m.r, max(m.g, m.b)), .05);
 col *= mix(vec3(1.), .48+.2*hue, sat(m.a*.68*fnGain)*fnS(.42, .72, noise(vec2(W.x*.8+2., P.y*75.+70.))));
 vec3 grey = fnLt(vec3(.25, .265, .28)), rust = fnLt(vec3(.60, .27, .19)), slate = fnLt(vec3(.24, .36, .43));
 float air = mix(.12, -.06, 1.-uSpace);
 P.y += .0011*(noise(vec2(P.x*130., 3.))-.5);
 for (int i = 0; i < 4; i++) {
  float f = float(i), x = -.74+.46*f+.12*hash11(f+5.);
  float d = abs(P.x-x-.012*sin(P.y*9.+f))-.0022-.002*hash11(f);
  col = mix(col, grey, fnEdge(max(d, max(P.y-.1-.1*hash11(f+9.), -.15-P.y)))*(.3-air)*some*(1.-flock));
 }
 for (int i = 0; i < (uOwn[2] > .0 ? 6 : 3); i++) {
  float f = float(i);
  vec3 at3 = i == 0 ? vec3(-.5, .225, .09) : i == 1 ? vec3(.34, .255, .064) : vec3(.02, .16, .042);
  if (i > 2) at3 = vec3(-.62+.5*(f-3.), -.1-.13*hash11(f+1.)+.1*sin(f*2.4), (.04+.06*hash11(f+6.))*sqrt(flock));
  if (flock > .0) at3.z *= 1.+(i == 0 ? .9 : .5)*flock;
  vec2 c = at3.xy;
  vec2 a = fnThere(c, .07);
  float k = (i == 0 ? 1.5 : i == 1 ? .8 : 1.1)*(1.+.6*a.y+.2*uPhrase);
  c.y += .008*sin(uTime*.23+f*2.);
  vec2 q = (P-c)/at3.z; q.x /= k;
  vec2 b = fnBird(q, uTime*.31+f*2.1);
  float on = sat((.6+.2*hash11(f+3.)+.4*fnGain*(.6*a.x+uPhrase)+.2*fnNow)*(i == 2 ? .6 : 1.))-air;
  vec3 ink = mix(grey, fnInk(3, slate, .5), .4+.4*sat(a.x+uPhrase));
  on *= 1.-flags;
  col = mix(col, mix(ink, vec3(.75), .4), b.y*(1.-b.x)*on*.75);
  col = mix(col, ink*(.9+.35*sat(q.y)), b.x*on);
 }
 for (int i = 0; i < (uOwn[2] < .0 ? 6 : 2); i++) {
  vec2 c = i == 0 ? vec2(.46, .13) : vec2(-.81, .05);
  float f = float(i), h1 = hash11(f+2.);
  if (i > 1) c = vec2(-.72+.29*(f-2.), .31-.2*h1);
  c.y += flags*.14*(i == 0 ? 1. : i == 1 ? .5 : .0);
  vec2 a = fnThere(c+vec2(.12, -.05), .12);
  float len = (i == 0 ? .36 : .16)*(1.+.7*a.y), ta = i == 0 ? .13 : .08;
  if (i > 1) { len = (.2+.16*h1)*sqrt(flags); ta = (.1+.08*h1)*sqrt(flags); }
  float on = sat(.62+.4*fnGain*(.6*a.x+uPad)+.15*fnNow)*(i == 0 ? 1. : .65)-air;
  on *= 1.-flock; if (i > 1) on = min(on+.3, .95)*fnS(.0, .3, flags);
  vec3 ink = fnInk(1, rust, .62); if (i > 1) ink = mix(ink, uKind[i-2]*(.75+.2*uOwn[0]), .8*flags);
  vec2 d = P-c; d.x -= .02*sin(d.y*5.);
  vec3 q = fnCloth(d, len, ta, uTime*.35+float(i));
  col = mix(col, ink*(1.02+.26*q.y+.16*q.y*q.y*q.y-.2*q.z), q.x*on*.9);
  col = mix(col, grey*.8, fnEdge(max(abs(d.x-.006)-.0035, max(d.y-.03, foot+.02+(i > 1 ? .05*h1 : .12*float(i))-P.y)))*on);
 }
 for (int i = 0; i < 7; i++) {
  float f = float(i), h1 = hash11(f+31.), h2 = hash11(f+47.);
  vec3 at3 = fnLeaves[i];
  vec2 c = at3.xy;
  float a = fnOne(vec2(c.x, c.y-.1)), S = at3.z*(1.+.3*uTexture), k = (.9+.9*h2)*(1.+.6*a);
  c.y += .01*sin(uTime*.19+f*1.7);
  vec2 q = (P-c)/S; q.x /= k; q.y += (h1-.5)*.7*q.x;
  vec2 l = fnLeaf(q, uTime*.27+f*2.4);
  float on = sat((i < 3 ? .62 : .12)+.8*fnGain*(.3*a+uTexture)+.2*fnNow)-.5*air;
  vec3 ink = fnInk(2, i % 2 == 0 ? rust : grey, .6);
  col = mix(col, ink*(.5+l.y), l.x*sat(on)*.92*(1.-flags));
 }
 {
  vec2 c = vec2(-.24, -.145);
  vec2 a = fnThere(vec2(c.x, -.25), .16);
  float R = .185, k = 1.55*(1.+.22*a.y+.08*uDrone);
  vec2 q = (P-c)/R; q.x /= k; q.x += .1*sin(q.x*2.1+.7);
  float sh = fnBell((P.y-c.y+R+.012)/.014)*(fnBell(q.x/.75)+.6*fnBell((q.x-1.2)/.4));
  float on = sat(.74+.4*fnGain*(.5*a.x+.8*uDrone))-air;
  on *= (1.-flock)*(1.-flags);
  col *= 1.-.42*sh*on;
  vec3 ink = mix(grey*.75, fnInk(0, slate, .4), .55);
  float r = length(q), lit = fnBell((r-.972)/.012)*sat(q.y*.8+.5);
  col = mix(col, ink*(1.+.25*q.y)+.2*lit*step(r, 1.), fnCycle(q, uTime*.12)*on);
 }
 float nd = abs(fnDx)-.011*sat(1.-pow(abs(W.y-.02)/.34, 1.6))*(.5+.5*uHits);
 col = mix(col, fnInk(4, rust, .6), fnEdge(nd)*step(abs(W.y-.02), .34)*fnHit);
 col = mix(col, rust, .16*fnHit*fnBell(fnDx/.05));
 col *= 1.+.04*(n2+n3-1.)+.04*(noise(vec2(W.x*260., 1.))-.5);
 return col*(1.-.16*uCue*fnBell(W.x/.32));
}
// A painted wading bird, its feet at y = -0.5. x paint, y scratched lines.
vec2 fnWader(vec2 q, float low) {
 vec2 b = rot(.3)*(q-vec2(.03, .02));
 float e = length(b/vec2(.2+.03*b.x, .105-.16*max(b.x, .0)));
 float body = (e-1.)*.1;
 float tl = (b.x-.1)/.28;
 body = smin(body, max(abs(b.y-.02+.06*tl)-.055*(1.-tl), max(-tl, tl-1.)*.28), .03);
 vec2 a0 = vec2(-.13, .08), a1 = mix(vec2(-.34, .2), vec2(-.40, .3), low), a2 = mix(vec2(-.06, .3), vec2(-.33, .05), low), a3 = mix(vec2(-.17, .44), vec2(-.31, -.2), low);
 float neck = 1.;
 vec2 last = a0;
 for (int i = 1; i <= 9; i++) {
  float t = float(i)/9., u = 1.-t;
  vec2 c = u*u*u*a0+3.*u*u*t*a1+3.*u*t*t*a2+t*t*t*a3, d = c-last, v = q-last;
  neck = min(neck, length(v-d*sat(dot(v, d)/dot(d, d)))-mix(.034, .017, t));
  last = c;
 }
 vec2 h = q-a3; h = rot(mix(.1, 1.15, low))*h;
 float head = length((h+vec2(.015, .0))*vec2(.8, 1.))-.03;
 float bt = -h.x/.19;
 head = min(head, max(abs(h.y+.02*bt)-.017*(1.-bt), max(-bt, bt-1.)*.19));
 float f = smin(min(body, smin(neck, body, .04)), head, .02);
 float y = q.y, k1 = .04*fnBell((y+.26)/.1), k2 = .05*fnBell((y+.24)/.1);
 float leg = min(abs(q.x-.02-k1+.1*(y+.1))-.011, abs(q.x-.08-k2-.2*(y+.1))-.011);
 leg = max(leg, max(-.5-y, y+.02));
 float toe = max(abs(y+.494)-.006, abs(q.x)-.09);
 float cut = fnCell(abs(sin(b.y*62.+9.*b.x*b.x))-.22)*fnS(.75, .6, e)*fnS(-.1, .0, b.x);
 cut = max(cut, fnCell(length(h+vec2(.012, -.004))-.008));
 return vec2(fnCell(min(f, min(leg, toe))), cut);
}
// A painted fish. x paint, y scratched scales.
vec2 fnFish(vec2 q, float ph) {
 float s = q.x/.4, y = q.y-.02*sin(s*2.6+ph), t = sat(1.-s*s), u = (s-.72)/.5, v = (s+.35)/.75;
 float f = max(abs(y)-.17*pow(t, .8)*(1.-.45*s), abs(q.x)-.4);
 f = min(f, max(abs(abs(y)-.15*u*u)-.075*u*(1.15-u)-.008, max(-u, u-1.)*.2));
 f = min(f, max(abs(y)-.15-.09*sin(PI*sat(v))*(.7+.3*sin(s*60.)), max(-v, v-1.)*.3));
 vec2 g = vec2(q.x*17., y*22.); g.x += .5*mod(floor(g.y), 2.); g = fract(g)-vec2(.8, .5);
 float cut = fnCell(abs(length(g)-.62)-.1)*fnS(-.45, -.38, s)*fnS(.8, .6, s)*step(abs(y), .15*t);
 return vec2(fnCell(f), max(cut, max(fnCell(length(q+vec2(.3, -.03))-.02), fnCell(abs(length(q-vec2(-.42, .0))-.21)-.008))));
}
// Reeds between the birds. x stems and blades, y heads.
vec2 fnReed(vec2 q, float sway) {
 float m = 1., hd = 1.;
 for (int i = 0; i < 3; i++) {
  float f = float(i)-1., y = q.y+.5, tall = .86-.16*abs(f)+.06*f;
  float g = f*.02+(f*.16+sway)*y*y, bg = f*(.03+.5*y*(1.-.5*y))+.03+sway*y;
  m = min(m, max(min(abs(q.x-g)-.009, .9*abs(q.x-bg)-.02+.04*y), max(-y, y-tall)));
  hd = min(hd, length(vec2(q.x-g, (y-tall)*.36))-.026);
 }
 return vec2(fnCell(m), fnCell(hd));
}
// Spirals joined in a row. x the line, y the ground between.
vec2 fnCurl(vec2 q, float turn, float fat) {
 vec2 c = vec2(fract(q.x)-.5, q.y);
 float r = length(c), a = r > 1e-4 ? atan(c.y, c.x) : .0, gap = .155;
 float s = sin(.5*(a-turn)-PI*r/gap);
 float w = fwidth(r)*PI/gap*1.2+1e-4;
 float m = fnS(fat+w, fat-w, abs(s))*fnS(.43+fwidth(r), .43, r);
 m = max(m, fnEdge(r-.06));
 float x = fract(q.x+.5)-.5, g = .43*sin(.5*PI*sin(PI*x)), sl = 2.1*cos(PI*x)*cos(.5*PI*sin(PI*x));
 float ln = abs(q.y-g)/sqrt(1.+sl*sl)-(.02+.05*fat)*sqrt(sat(1.-16.*x*x*x*x));
 m = max(m, fnEdge(ln)*step(abs(x), .49));
 return vec2(m, fnS(.47-fwidth(r), .47, r)*(1.-m));
}
vec3 fnPot(vec2 P) {
 vec3 slip = vec3(.885, .805, .685);
 vec2 Q = P+.0035*(vec2(noise(P*13.), noise(P*13.+40.))-.5);
 if (uOwn[3] < .0) Q.y -= uOwn[3]*(.1*pow(noise(vec2(P.x*17., 2.)), 3.)+.03*noise(vec2(P.x*47., 5.))-.02)*fnS(.4, .3, abs(P.y));
 float some = fnHide(uOwn[5]), bands = max(-uOwn[5], .0);
 Q.y += .0035*sin(3.53*P.x+1.)+.002*sin(10.6*P.x+uTime*.05);
 float y = Q.y;
 float turnm = noise(vec2(P.x*1.6, P.y*120.)), cloud = fbm(P*vec2(1.6, 2.6)+4.), fine = noise(P*170.);
 fine = mix(.5, fine, fnQuiet); turnm = mix(.5, turnm, fnQuiet);
 vec3 col = slip*(1.+.07*(turnm-.5)+.05*(fine-.5));
 col = mix(col, vec3(.74, .6, .48), .6*fnS(.52, .8, cloud));
 col = mix(col, vec3(.94, .9, .82), .5*fnS(.46, .2, cloud));
 col = fnBase(col);
 if (uOwn[7] > .0) col = fnSun(col, P, vec2(.17, .04));
 float brush = .8+.2*noise(vec2(P.x*26., P.y*90.));
 float worn = fnS(.26, .4, .45*noise(P*19.+7.)+.3*noise(P*70.)+.25*fine+1.-fnQuiet);
 float a = fnOne(vec2(P.x, .0));
 float ink = brush*mix(.45+.55*worn, 1., .5*a);
 vec3 black = fnLt(vec3(.19, .145, .125)), red = fnLt(vec3(.60, .25, .16)), blue = fnLt(vec3(.30, .38, .42));
 col = mix(col, black, max(fnEdge(.362-y), fnEdge(y+.375))*ink*.92*some);
 if (bands > .0) { float by = y/.046+.5, bh = hash11(floor(by)+4.); col = mix(col, mix(black, uKind[int(mod(floor(by)+20., 4.))], .7), bands*.8*ink*fnEdge(abs(fract(by)-.5)-.22-.25*bh)*step(abs(y-.02), .24)); }
 float tx = Q.x/1.78*24., tri = abs(fract(tx)-.5)*2., ty = (y-.292)/.052;
 float tr = max(tri-ty, max(-ty, ty-1.));
 float hat = fnEdge(abs(sin((tx*2.+ty)*9.))-.35-.6*uTexture);
 float tin = fnEdge(tr), ted = fnEdge(abs(tr)-.06)*step(-.1, ty)*step(ty, 1.1);
 col = mix(col, fnInk(2, red, .6), max(tin*hat*(.55+.4*sat(fnGain*uTexture)), ted*.8)*ink*some);
 for (int i = 0; i < 8; i++) {
  float f = float(i), h = i < 3 ? -.222+.017*f : i < 5 ? -.345+.012*(f-3.) : .262+.013*(f-5.);
  float b = max(uBands[i*2], uBands[i*2+1]);
  col = mix(col, i == 1 ? red : black, fnEdge(abs(y-h)-.0016-.0034*b)*ink*(.75+.25*b)*some);
 }
 {
  vec2 q = vec2(Q.x/1.78*11., (y+.283)/.1);
  float on = step(abs(q.y), .52), dr = sat(fnGain*1.3*uDrone+.4*fnGain*fnOne(vec2(P.x, -.25)));
  vec2 c = fnCurl(q, uTime*.09, .4+.3*dr)*on;
  col = mix(col, fnInk(0, red, .5), c.y*ink*.85*dr*some);
  col = mix(col, fnInk(0, black, .42), c.x*ink*(.7+.3*dr)*some);
 }
 {
  float row = .0, field = 1.;
  if (uOwn[1] != .0) {
   float s = exp2(uOwn[1]*(uOwn[1] > .0 ? 1.585 : .6)), tall = mix(.47, .72, max(uOwn[5], .0));
   field = fnS(.0, .004, .5*tall-abs(y-.02));
   float v = (y-.02)*s+(uOwn[1] < .0 ? .03*uOwn[1] : .235*pow(sin(.5*PI*(s-1.)), 2.)); row = uOwn[1] > .0 ? floor(v/.47+.5) : .0;
   Q.x = Q.x*s+.22*row; y = v-row*.47+.02;
  }
  float tn = Q.x/.445, id = floor(tn+.5), rid = floor(tn);
  vec2 c = vec2(id*.445, .03), q = (vec2(Q.x, y)-c)/.41;
  float there = fnThere(vec2(c.x, .14), .09).x;
  float low = abs(mod(id, 4.)-1.) < .5 ? 1. : .0;
  vec2 w = fnWader(q, low);
  if (uOwn[2] < .0) w = mix(w, fnFish((q+vec2(.0, .02-.2*low))*vec2(low < .5 ? 1. : -1., 1.)*.85, uTime*.4+id), -uOwn[2]);
  w.x *= field*fnHide(uOwn[2]);
  vec3 bi = mix(black, fnInk(3, red, .55), .15+.45*low+(.5-.3*low)*max(-uOwn[2], .0));
  col = mix(col, bi, w.x*ink*(1.-w.y*fnQuiet)*sat(.72+.3*fnGain*(there+uPhrase)));
  c.x = (rid+.5)*.445;
  q = (vec2(Q.x, y)-c)/.41;
  there = fnThere(c, .09).x;
  vec2 r = fnReed(q, .06*sin(uTime*.21+rid*1.3));
  for (int i = 0; i < (uOwn[2] > .0 ? 2 : 0); i++) {
   float f = float(i), tx2 = Q.x/.445+.36+.31*f, ti = floor(tx2);
   r = max(r, fnReed(vec2((tx2-ti-.5)*.445/.41, (y-.03)/.41)*(1.12-.22*f)+vec2(.0, .06-.11*f), .1*sin(uTime*.17+ti*1.7+f))*fnS(.0, .5, uOwn[2]));
  }
  r *= field*(1.-.75*max(-uOwn[2], .0));
  col = mix(col, fnInk(1, blue, .5), r.x*ink*sat(.6+.4*fnGain*(there+uPad)));
  col = mix(col, fnInk(1, red, .7), r.y*ink*sat(.5+.5*fnGain*(there+uPad)));
 }
 float sh = fnBell((y-.2)/.035)*.16+fnBell((y-.232)/.006)*.12+fnBell((y+.12)/.06)*.05;
 col += sh*(.6+.8*uSpace)*(.6+.5*noise(vec2(P.x*2.2-uTime*.02, P.y*60.)))*vec3(1., .98, .94);
 col *= 1.-.28*fnS(.3, .42, abs(y))-.1*fnS(.1, .4, -y);
 for (int i = 0; i < 2; i++) {
  float f = float(i), g = .85*f-.38+.09*noise(vec2(P.y*7., f+3.))+.03*noise(vec2(P.y*31., f))+.12*P.y*(1.-2.*f);
  col *= 1.-.5*fnEdge(abs(P.x-g)-.0012);
 }
 col = mix(col, vec3(1., .97, .92), .85*fnHit*fnS(.011, .002, abs(fnDx)/max(.15, 1.-y*y*5.)));
 return col*(1.+vec3(.14, .1, .04)*fnHit*fnBell(fnDx/.06))*(1.+.14*uCue*fnBell(P.x/.35));
}
vec3 render(vec2 p) {
 float wide = clamp(uRes.x/uRes.y, .9, 2.4), c = 4.*uCue*(1.-uCue);
 fnPx = 1./uRes.y;
 vec2 P = vec2(p.x/wide*1.78, p.y);
 P.x += .022*sin(P.x*2.6+uTime*.13)+.012*sin(P.x*6.1-uTime*.17);
 P.x *= 1.-.16*c*fnBell(P.x/.5);
 fnOdd = abs(uOwn[1])+abs(uOwn[6]); fnQuiet = 1.-.9*abs(uOwn[6]);
 if (uOwn[4] < .0) { p.y += uOwn[4]*(.05*sin(P.x*4.2+uTime*.11)+.02*sin(P.x*9.5-uTime*.16)); P.x -= uOwn[4]*.07*sin(p.y*9.-uTime*.12); P.y = p.y; }
 vec2 was = p; float R = 9., round_ = 1., u = .0;
 if (uOwn[4] > .0) {
  float v = min(p.y/.39, 1.), own = uOwn[4];
  R = mix(.5, .3+.3*sqrt(sat(1.-(v-.1)*(v-.1)*.8))-.05*fnS(.5, .95, v), uVar)+2.6*(1.-own);
  u = p.x/R; round_ = sqrt(max(1.-u*u, .0));
  p.y += own*.06*(round_-.85);
  P = vec2(mix(P.x, asin(clamp(u, -1., 1.))*mix(R, .6, own)*1.05+own*.14*sin(uTime*.05), min(own*6., 1.)), p.y);
 }
 vec2 T = P, grid = vec2(.0), odd = vec2(.0); float gap = 1.;
 if (uOwn[6] > .0) {
  vec2 g = P*62., id = floor(g); float near = 9., next = 9.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
   vec2 o = id+vec2(float(i), float(j)), h = hash22(o), d = o+.5+.5*(h-.5)-g; float m = dot(d, d);
   if (m < near) { next = near; near = m; grid = o+.5+.5*(h-.5); odd = h; } else next = min(next, m);
  }
  gap = sqrt(next)-sqrt(near); P = mix(P, grid/62., uOwn[6]);
 }
 if (uOwn[6] < .0) { grid = floor(P*vec2(95., 130.)); odd = P*vec2(95., 130.)-grid-.5; P = mix(P, (grid+.5)/vec2(95., 130.), -uOwn[6]); }
 fnDx = P.x-(uLoop-.5)*1.78;
 float ends = fnS(.0, .04, uLoop)*fnS(1., .96, uLoop);
 fnNow = fnBell(fnDx/.1)*ends;
 fnHit = sat(uHits*1.4)*(.3+.7*fnS(.0, .01, uLoop)*fnS(1., .99, uLoop));
 fnGain = .7+.6*uEnergy;
 float y = p.y+uVar*(.004*sin(TAU*P.x/1.78)+.003*(noise(vec2(P.x*9., 2.))-.5));
 float top = mix(.395, .4, uVar), foot = mix(-.365, -.4, uVar);
 vec3 col = uVar < .5 ? fnPassing(P) : fnPot(P);
 if (uOwn[7] < .0) col = fnRain(col, P);
 if (uOwn[6] > .0) col = mix(col, mix(fnBase(vec3(.8, .77, .72))*.75, col*(.92+.16*odd.x), fnS(.04, .2, gap)), uOwn[6]);
 if (uOwn[6] < .0) { float over = mod(grid.x+grid.y, 2.), th = over > .5 ? odd.y : odd.x, lo = over > .5 ? odd.x : odd.y; col *= 1.+uOwn[6]*(.32-1.*cos(th*PI)*cos(lo*PI*.8)*.42-.1*over+.12*hash21(grid)); }
 col *= 1.-max(uOwn[4], .0)*(1.-fnS(.0, 1., .5+.45*round_-.42*u))*.85;
 col *= 1.-.13*ends*fnS(1.5, .3, abs(fnDx)*uRes.y);
 vec3 paper = vec3(.952, .946, .928)*(1.+.02*(noise(vec2(P.x*30., p.y*40.))-.5));
 paper = fnBase(paper);
 float glow = max(uOwn[4], .0)*max(uOwn[7], .0);
 paper *= 1.-.94*glow; col *= 1.+.35*glow*round_*(.5+.7*uLevel+.8*uHits);
 if (uOwn[4] > .0) paper *= 1.-.5*uOwn[4]*exp(-max(length(vec2((p.x-.12)/.6, (p.y-foot)/.05))-.7, .0)*2.5);
 paper *= 1.-.2*uVar*fnHide(uOwn[4])*exp(min(p.y-foot, .0)/.02)*step(p.y, .0);
 float tk = T.x/1.78*64., near = abs(fract(tk+.5)-.5)*1.78/64., down = foot-mix(.014, .03, uVar)-p.y;
 float len = mod(floor(tk+.5), 8.) < .5 ? .024 : .012;
 paper *= 1.-(.35+.5*max(uKeys, uMic)*fnNow)*fnS(.0012+fnPx, .0004, near)*fnS(len+fnPx, len, down)*fnS(-fnPx, .0, down)*fnHide(uOwn[4]*3.);
 if (uOwn[4] > .0) {
  float mouth = p.y-top, deep = was.y-top-uOwn[4]*.06*(.85+round_);
  paper = mix(paper, col*.3+.05*fnBase(vec3(1.))*(1.+u), fnS(-fnPx, fnPx, mouth)*fnS(fnPx, -fnPx, deep)*fnS(-2.*fnPx, .0, R-abs(R*u)));
 }
 return mix(paper, col, fnS(fnPx, -fnPx, max(y-top, foot-y))*fnS(-2.*fnPx, .0, R-abs(R*u)));
}
