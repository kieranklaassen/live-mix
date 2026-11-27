// name: Steam line
// a: Trestle at night
// b: Iron footbridge
// what: A short dark train of six amber windows crosses a low iron trestle over a wide wet valley under the moon, its steam lying down behind it, its lights broken on the river; or a winter morning on an iron footbridge, steam rising through the lattice and thinning to show wet rails, signals and snowy roofs.
// follows: The loop runs the train through once. The phrase and six bands light its windows; drone thickens mist and steam, pad the moon or sun, texture sparks and frost; the piece tints the mist. A hit opens a firebox, a cue sends up a great puff, keys light far windows, a voice the nearest lamp.
// own: 0 a black night at -1, dawn or a red evening at 1; 1 dry land under a harvest moon, or no snow, at -1, deep snow at 1; 2 clear air at -1, mist and steam over all at 1; 3 a low causeway, or wide lattice, at -1, tall legs, or fine lattice, at 1; 4 looking down at -1, a big sky at 1; 5 a thread of river, or rails that swing left, at -1, a flood, or rails hard right, at 1
float slPx, slHw, slFr, slHz; // a pixel, half the picture's width, 1 broad and 0 tall, the horizon
float slH(float n) { n = fract(n*.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float slN1(float x) { float i = floor(x), f = x - i; return mix(slH(i), slH(i + 1.), f*f*(3. - 2.*f)); }
float slIn(float d) { return 1. - smoothstep(-slPx, slPx, d); }
float slUp(float a, float b, float x) { return smoothstep(a, b, x); }
float slDn(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
float slBell(float x) { return exp(-x*x); }
float slBox(vec2 q, vec2 c, vec2 r) { q = abs(q - c) - r; return max(q.x, q.y); }
float slN2(vec2 q) { return .65*noise(q) + .35*noise(q*2.4 + 4.); }
// Noise that stays fine however far it goes.
float slGo(vec2 q) {
  vec2 i = mod(floor(q) + 99., 198.) - 99., j = mod(i + 100., 198.) - 99., f = fract(q); f *= f*(3. - 2.*f);
  return mix(mix(hash21(i), hash21(vec2(j.x, i.y)), f.x), mix(hash21(vec2(i.x, j.y)), hash21(j), f.x), f.y);
}
// Heaped steam: round lobes with creases between. Age makes them large, soft rounds them.
float slHeap(vec2 q, float age, float soft) {
  float s = 0., w = .25 + .4*age, sum = 0.;
  for (int j = 0; j < 4; j++) {
    float g = 2.*slGo(q) - 1., m = sqrt(g*g + soft);
    s += w*m; sum += w; w *= .58 - .06*age;
    q = mat2(.8, .6, -.6, .8)*q*2.1 + 3.7;
  }
  return s/sum;
}
// The same, and in y how it faces a light at l.
vec2 slLit(vec2 q, float age, float soft, vec2 l) {
  float h = slHeap(q, age, soft);
  return vec2(h, h - slHeap(q + l*.13, age, soft));
}
// How bright window n of six is.
float slLamp(float n) { return .4 + .45*uPhrase + (.3 + .6*uEnergy)*band((n + .5)/6.); }
// ---- a: the valley
vec3 slTop, slLow, slMn; vec2 slMp; float slMr, slDk, slDw;
vec3 slSky(vec2 p) {
  float up = p.y - slHz, r = length(p - slMp);
  vec3 c = mix(slLow, slTop, slUp(-.02, .36, up)) + vec3(.5, .2, .1)*slDw*exp(-max(up, 0.)*9.);
  float cl = slN2(vec2(p.x*1.3 + uTravel*.006, p.y*6. - p.x*.7)), veil = slUp(.45, .8, cl);
  c += slMn*mix(vec3(1.), uKind[1]*1.5, .3*uPad)*(.5 + .9*uPad)*(.2*exp(-r*10.) + .06*exp(-r*3.))*(.5 + 1.3*veil);
  float face = slDn(-1.5*slPx, 1.5*slPx, r - slMr);
  c = mix(c, slMn*(.8 + .8*uPad)*(.6 + .5*slUp(.3, .65, noise((p - slMp)/slMr*1.7 + 3.))), face*(1. - .5*veil));
  vec2 g = p*42., id = floor(g); float h = hash21(id + 7.);
  float star = step(.8, h)*slDn(0., .07, length(g - id - .2 - .6*hash22(id)));
  return c + star*(h - .75)*(.25 + 2.6*slDk)*(1. - slDw)*(1. - veil)*slUp(.02, .2, up);
}
float slHill(float x, int i) {
  float f = float(i), u = x*(1.1 + .7*f) + 4.7*f + 2.;
  float h = slN1(u) + .45*slN1(u*2.3 + 8.) + .16*slN1(u*6.1);
  return slHz + (i == 0 ? -.03 + .065*h + .1*slUp(.1, .9, x) : i == 1 ? .02 + .075*h + .07*slDn(-.9, .2, x) : .06 + .1*h);
}
// The train at b behind its front: its shape, how far from a window, which window.
vec3 slTrain(float b, float y) {
  vec2 q = vec2(b, y);
  float d = min(slBox(q, vec2(.051, .0185), vec2(.047, .0095)), slBox(q, vec2(.018, .034), vec2(.005, .01)));
  d = min(d, min(slBox(q, vec2(.099, .021), vec2(.012, .019)), slBox(q, vec2(.099, .0405), vec2(.016, .0016))));
  d = min(d, length(vec2(min(abs(b - .028), min(abs(b - .052), abs(b - .076))), y - .0075)) - .0085);
  d = min(d, slBox(q, vec2(.092, .0155), vec2(.056, .013)) + 9.*step(b, .112));
  float car = clamp(floor((b - .156)/.146), 0., 2.), c = b - .225 - .146*car, right = step(0., c);
  d = min(d, slBox(vec2(c, y), vec2(0., .0265 - 1.5*c*c), vec2(.069, .02)));
  return vec3(d, slBox(vec2(c + .034 - .068*right, y), vec2(0., .0275), vec2(.022, .0065)), car*2. + right);
}
vec3 slValley(vec2 p) {
  float snow = max(uOwn[1], 0.), dry = max(-uOwn[1], 0.), air = uOwn[2], fog = max(air, 0.), x = p.x;
  slDk = max(-uOwn[0], 0.); slDw = max(uOwn[0], 0.);
  slHz = .1 - .15*uOwn[4];
  float yd = slHz - .1 + .1*uOwn[3] + .04*uOwn[4], yf = slHz - .215; // the rails, and the feet
  slTop = mix(mix(vec3(.005, .0115, .027), vec3(.001, .002, .005), slDk), vec3(.07, .12, .22), slDw);
  slLow = mix(mix(vec3(.036, .064, .1), vec3(.006, .01, .018), slDk), vec3(.42, .3, .28), slDw);
  slLow *= mix(vec3(1.), vec3(1.35, .95, .6), dry);
  slMn = mix(vec3(.86, .92, 1.), vec3(1.15, .66, .3), dry)*(1. - .9*slDk);
  slMp = vec2(mix(-.12, -.47, slFr), .33 - .1*dry*(1. - .4*uOwn[4])); slMr = .027 + .02*dry;
  float hx = mix(-min(slHw, 1.2) - .06, min(slHw, 1.2) + .78, uLoop); // the front of the train
  float here = slUp(0., .06, uLoop)*slDn(.8, .97, uLoop);
  vec4 heard = piece(vec2(x/1.78 + .5, sat((slHz + .12 - p.y)/.5)));
  vec3 tint = mix(vec3(1.), heard.rgb/max(heard.a, .05), .3*heard.a), haze = slLow*.75 + slMn*(.012 + .04*exp(-abs(x - slMp.x)*2.5));
  vec3 earth = mix(mix(vec3(.2, .27, .28), vec3(.6, .4, .2), dry), vec3(1.7, 1.85, 2.), snow);
  vec3 light = slMn*.08 + slLow*.5 + slDw*vec3(.16, .1, .07), amber = vec3(1., .4, .085), red = vec3(1., .15, .04);
  float s = slHz - p.y, b = hx - x;
  vec3 col = p.y > slHill(x, 0) - slPx ? slSky(p) : vec3(0.);
  // hills, the far one first
  for (int i = 2; i >= 0; i--) {
    float f = float(i), h = slHill(x, i), m = slIn(p.y - h), dep = h - p.y;
    if (m <= 0.) continue;
    float n = noise(vec2(x*6. + f*9., dep*20.)), row = fract(dep*70. + 2.*n);
    float ter = slUp(.35, .8, row)*slDn(.85, 1., row)*slUp(.3, .6, n)*step(f, 1.5);
    vec3 c = earth*light*(.4 + clamp((h - slHill(x - .012, i))*16., -.3, .6) + 1.4*ter);
    c = mix(c, haze, .16 + .22*f + .12*uSpace);
    c = mix(c, haze*1.4*tint, slUp(.03, .11, dep + .05*noise(vec2(x*3. + uTravel*.012 + f*7., p.y*14.)) + .05*air)*(.45 + .35*uDrone));
    col = mix(col, c, m);
  }
  // the wet valley floor and the river
  if (s > 0.) {
    float d = .3/max(s, .01), l = log(d + .2);
    vec2 g = vec2(x*d, d);
    float bank = .6*noise(g*vec2(2.5, 6.)) + .25*noise(g*vec2(9., 26.)), o5 = uOwn[5];
    float rc = .5 - 2.6*s + 1.6*s*s + .05*sin(s*24.)*slDn(0., .3, s);
    float rv = (abs(x - rc) - s*(o5 > 0. ? .62 + 2.5*o5 : .62 + .45*o5) - .008)/s + (bank - .42)*.6;
    float pool = .78 - .2*o5 - slN2(g*vec2(1.3, 4.) + 3.7) - .2*bank;
    rv = min(rv, pool*1.2);
    float water = slDn(-2.*slPx/s, 2.*slPx/s, rv);
    vec3 c = earth*light*(.45 + .5*bank)*(.4 + .6*slUp(0., .25, rv));
    c *= 1. - .5*slUp(.5, .7, noise(g*vec2(1.6, 4.) + 8.));
    float rip = slGo(vec2(x*11./(.25 + s), l*62. - uTravel*.5)) - .5, rip2 = slGo(vec2(x*34., l*130. + uTravel*.7)) - .5;
    float broken = slUp(-.12, .3, rip + .8*rip2);
    vec3 w = mix(slLow, slTop, slUp(0., .5, s + .1*rip)) + slMn*(.012 + .02*exp(-abs(x - slMp.x)*4.));
    w *= mix(.35, 1., slUp(.04, .2, s + .05*rip));
    // moon, windows and legs on the water
    w += slMn*slBell((x - slMp.x + rip*.06)/(.014 + .13*s))*broken*(.5 + .6*uPad);
    float below = yf - p.y, lift = yd - yf + .0275, rx = b - .034*rip - .01*rip2, k = (rx - .156)/.073, id = clamp(floor(k), 0., 5.);
    float on = slUp(-.02, .02, below), gap = abs(below - lift);
    w += amber*slDn(.2, .5, abs(k - id - .48))*exp(-max(gap - .012, 0.)*(19. - 8.*uTone))*on*broken*slLamp(id)*1.1;
    w += red*uHits*here*slBell((rx - .1)/.05)*exp(-gap*9.)*on*broken*1.3;
    w *= 1. - .5*on*max(slDn(.004, .009, abs(fract((hx - rx)/.105 + .5) - .5)*.105)*slDn(lift*.5, lift, below), slDn(.006, .016, abs(below - lift + .035)));
    col = mix(col, mix(mix(c, w, water), haze, exp(-s*13.)*.8), slUp(0., .012, s));
  }
  // a farmhouse, and far windows that answer the keys
  vec2 fq = p - vec2(mix(.16, .43, slFr), slHz + .012);
  col = mix(col, earth*light*.5, slIn(slBox(fq, vec2(0.), vec2(.017, .008))));
  col = mix(col, mix(earth*.3, vec3(2.), snow)*light, slIn(max(abs(fq.x)*.75 + fq.y - .022, .006 - fq.y)));
  col += amber*1.4*slIn(slBox(fq, vec2(.005, 0.), vec2(.0028, .003))) + amber*(.1 + .5*uMic)*exp(-length(fq)*60.);
  for (int i = 1; i < 7; i++) {
    float f = float(i);
    vec2 q = p - vec2((-.75 + .25*f + .1*slH(f))*mix(.35, 1., slFr), slHz + .02 + .05*slH(f + 20.));
    float r2 = dot(q, q);
    col += vec3(1., .6, .25)*(exp(-r2*160000.) + .1*exp(-r2*6000.))*(.15 + 1.6*uKeys);
  }
  // mist on the floor behind the trestle
  float n = slN2(vec2(x*2.2 + uTravel*.02, p.y*11.));
  float ms = slBell((p.y - slHz + .035 - .06*air - .03*uLow)/(.04 + .04*uDrone + .06*fog))*slUp(.3, .75, n + .2*air)*sat(.5 + .5*uDrone + .4*air);
  col = mix(col, (haze*1.5 + slMn*.03)*tint + heard.rgb*.1*uEnergy, sat(ms));
  // the trestle: splayed legs, braces, a laced girder
  if (p.y < yd + .01 && p.y > yf - .03) {
    float H = yd - yf, t = sat((yd - p.y)/max(H, .01)), cx = (fract(x/.105 + .5) - .5)*.105, ac = abs(cx), wd = .008 + .012*t;
    float d = min(abs(ac - wd) - .0023, max(abs(abs(t*2. - 1.) - ac*50.)*H*.4 - .0012, ac - wd));
    d = max(min(d, max(abs(p.y - yd + .5*H) - .0016, ac - wd)), max(p.y - yd, yf - p.y - .006*slN1(x*12.)));
    float in_ = abs(p.y - yd + .0105), deck = max(p.y - yd, yd - .0195 - p.y);
    float lace = abs((yd - .0035 - p.y)/.0125 - abs(fract(x/.021) - .5)*2.)*.0075 - .0011;
    col = mix(col, slLow*.06 + vec3(.0008, .0012, .002), slIn(min(d, in_ > .0062 ? deck : max(deck, lace))));
    col += slMn*.09*slIn(abs(p.y - yd + .001) - .0012);
  }
  // the train
  if (b > -.03 && b < .63) {
    vec3 tr = slTrain(b, p.y - yd);
    float lam = slLamp(tr.z);
    col = mix(col, vec3(.002, .0024, .003) + slLow*.03, slIn(tr.x));
    col += slMn*.12*slIn(abs(tr.x + .0012) - .0008)*slUp(.028, .042, p.y - yd);
    col = mix(col, mix(amber, vec3(1., .7, .3), .4*slUp(.02, .034, p.y - yd))*(.4 + 1.2*lam), slIn(tr.y));
    col += amber*lam*.1*exp(-max(tr.y, 0.)*75.);
    col += vec3(1., .3, .07)*(.06 + 1.7*uHits)*slIn(slBox(vec2(b, p.y - yd), vec2(.1, .026), vec2(.006)));
  }
  // the steam that lies down behind it
  b -= .018;
  if (b > -.04) {
    float a = max(b, .0005), yc = yd + .05 + .07*(1. - exp(-a*7.)) + .05*a + .012*sin(a*7. - uTravel*.12);
    float wd = (.012 + .088*sqrt(a))*(.75 + .35*uLevel + .45*air), e = (p.y - yc)/wd;
    if (abs(e) < 2.) {
      vec2 fr = vec2(7., 9.5);
      vec2 h = slLit(p*fr + vec2(uTravel*.02, -uTravel*.03), sat(a*1.2), .015, vec2(-.5, .85));
      float T = 1. - e*e*(e < 0. ? 1.4 : 1.) + (h.x - .42)*(1.8 + a) - .35*a - 1.8*slUp(.76, .99, uLoop);
      float top = sat(.42 + 2.2*h.y + .32*e), und = sat(.55 - 1.6*h.y - .4*e);
      vec3 st = (slMn*.3 + slLow*.5)*(.1 + 1.25*top*top) + slDw*vec3(.4, .25, .18)*top;
      float lam = slLamp(clamp((b - .138)/.073 - .5, 0., 5.));
      st += amber*slUp(.06, .24, b)*slDn(.5, .75, b)*lam*(.04 + .85*und*und)*exp(-max(p.y - yd - .045, 0.)*11.);
      st += red*slBell((b - .07)/.12)*(.03 + 1.4*uHits)*(.15 + und);
      col = mix(col, st, slUp(0., mix(.9, .45, uTone), T)*exp(-a*.55)*slUp(-.02, .012, b)*slUp(0., .03, uLoop));
    }
    for (int i = 0; i < 9; i++) { // sparks
      float f = float(i), t = fract(uTime*(.16 + .02*f) + slH(f + 3.));
      vec2 d = vec2(-b, p.y - yd - .05) - t*vec2(-.2, .1)*(vec2(slH(f), slH(f + 9.)) + .4) - .012*sin(t*9. + f);
      col += amber*4.*here*uTexture*exp(-dot(d, d)*150000.)*(1. - t)*slUp(0., .1, t);
    }
  }
  // a signal, and low mist before the legs
  vec2 sq = p - vec2(mix(.2, .54, slFr), yd);
  col = mix(col, vec3(.002), slIn(slBox(sq, vec2(0., .03), vec2(.0014, .03))));
  float r = length(sq - vec2(0., .058));
  col += red*(slIn(r - .004)*(.25 + 1.6*uHits) + (.01 + .35*uHits)*exp(-r*40.));
  n = slN2(vec2(x*1.7 - uTravel*.016, p.y*13. + 5.));
  ms = slBell((p.y - yf + .02 - .03*air)/(.028 + .03*uDrone + .04*fog))*slUp(.45, .85, n + .15*air + .1*uDrone)*sat(.35 + .5*uDrone + .6*air);
  col = mix(col, haze*1.2 + slMn*.02 + heard.rgb*.06*uEnergy, sat(ms));
  // a cue
  if (uCue > .003) {
    float run = 1. - uCue;
    vec2 q = p - vec2(mix(.1*slFr, clamp(hx, -.65*slHw, .65*slHw), here), yd + .05);
    col += amber*.5*uCue*exp(-length(q)*11.);
    q = (q - vec2(0., .03 + .26*run))/(.07 + .45*run);
    float r2 = dot(q, q);
    if (r2 < 4.) {
      vec2 h = slLit(q*1.7 + vec2(3., -run), .6, .03, vec2(-.5, .85));
      float top = sat(.45 + 2.2*h.y + .25*dot(q, vec2(-.5, .85)));
      vec3 st = (slMn*.3 + slLow*.5)*(.12 + 1.2*top*top) + amber*.16*(1. - top)*slDn(-.6, .3, q.y);
      col = mix(col, st, slUp(0., 1., 1. - r2*.8 + (h.x - .42)*2.)*sat(uCue*1.6)*sat(run*5.)*.85);
    }
  }
  // the near hillside
  float e = x - min(slHw, .95), slope = -.5 + .2*slUp(-1., .1, e/mix(.5, 1., slFr)) + .02*slN1(x*4.), g0 = slope;
  for (int i = 0; i < 2; i++) {
    float f = float(i), gx = x*(80. + 50.*f) + (p.y - g0)*(12. + 8.*f)*sin(x*7. + .6*sin(uTime*.3 + x*3.)), id = floor(gx);
    slope = max(slope, g0 + .045*slH(id + 31.*f)*max(0., 1. - 2.4*abs(fract(gx) - .5)));
  }
  float dn = slope - p.y, rim = exp(-max(dn, 0.)*30.);
  vec3 ns = earth*light*(.08 + .5*rim)*(.5 + noise(p*vec2(60., 25.)))*mix(.5, 1., snow);
  ns += slMn*.03*uTexture*rim + slMn*(.05 + .25*uTexture)*step(.97, hash21(floor(p*130.)))*slDn(.1, .3, length(fract(p*130.) - .5))*rim;
  col = mix(col, ns, slUp(-slPx*1.5, slPx*1.5, dn));
  // the pine, cut by the frame
  if (e > -.5) {
    vec2 q = vec2(e, p.y)/mix(.6, 1., slFr);
    float tx = -.07 - .07*sin((q.y + .2)*4.2), pads = 1., under = 0.;
    float trunk = max(abs(q.x - tx) - .017 + .018*q.y, q.y - .4) + .004*(noise(q*vec2(60., 22.)) - .5);
    const vec2 at[6] = vec2[6](vec2(-.2, .13), vec2(.02, .22), vec2(-.16, .31), vec2(0., .43), vec2(-.25, -.03), vec2(-.07, .07));
    for (int i = 0; i < 6; i++) {
      vec2 u = q - at[i], rr = i == 3 ? vec2(.19, .06) : vec2(i == 4 ? .1 : .15, .034);
      float bx = -.07 - .07*sin((at[i].y + .2)*4.2) - at[i].x, ht = sat(u.x/bx);
      trunk = min(trunk, max(abs(u.y + .012 + .03*ht) - .004 - .004*ht, max(u.x*sign(bx) - abs(bx), -u.x*sign(bx) - .05)));
      u.y += .25*u.x*u.x/rr.x; u.x -= .004*sin(uTime*.4 + float(i));
      if (u.y < 0.) u.y *= 1.9;
      float l = (length(u/rr) - 1.)*rr.y;
      if (l < pads) { pads = l; under = u.y/rr.y; }
    }
    float tuft = .6*noise(q*vec2(46., 40.)) + .4*noise(q*vec2(150., 70.)), lit = under + tuft - .5;
    col = mix(col, vec3(.0015, .002, .003), slUp(-slPx, slPx, -trunk));
    vec3 pc = mix(vec3(.001, .002, .0025) + light*.1*slUp(.1, 1.2, lit), vec3(1.6)*light, snow*slUp(.1, .7, lit));
    col = mix(col, pc, slUp(-slPx*1.5, slPx*1.5, -pads - (tuft - .5)*.036));
  }
  return screenOf(col*1.3);
}
// ---- b: the footbridge over the cutting
const float slW = .36;
vec2 slBend;  // where the rails go, how hard they swing
float slCurve(float s) { return slBend.x + slBend.y*(.03/(s + .06) - .06); }
vec3 slCutting(vec2 p) {
  float night = max(-uOwn[0], 0.), dusk = max(uOwn[0], 0.), white = max(uOwn[1], 0.) - max(-uOwn[1], 0.), air = uOwn[2], x = p.x;
  slHz = .12 - .13*uOwn[4];
  slBend = vec2(.14*slFr + .1*uOwn[5], uOwn[5] > 0. ? 1. + 2.2*uOwn[5] : 1. + 2.8*uOwn[5]);
  vec3 pearl = mix(mix(vec3(.66, .645, .64), vec3(.11, .135, .19), night), vec3(.8, .56, .45), dusk);
  vec3 high = mix(mix(vec3(.44, .49, .56), vec3(.035, .05, .09), night), vec3(.38, .35, .46), dusk);
  vec3 sun = mix(mix(vec3(1., .95, .84), vec3(.5, .56, .66), night), vec3(1., .68, .4), dusk);
  vec3 day = mix(mix(vec3(1.), vec3(.2, .24, .33), night), vec3(1., .78, .68), dusk), iron = vec3(.1, .085, .085)*mix(1., .3, night);
  vec3 amber = vec3(1., .66, .26), red = vec3(.9, .2, .08);
  vec4 heard = piece(vec2(x/1.78 + .5, sat(.5 - p.y)));
  float sy = slHz - p.y, up = -sy;
  // sky and the pale sun
  vec2 sp = vec2(mix(-.1, .44, slFr), slHz + .23);
  float sr = length(p - sp), cl = slN2(vec2(x*1.6 + uTravel*.006, p.y*6.));
  vec3 col = mix(mix(pearl, high, slUp(0., .5, up)), pearl, .6*slUp(.35, .8, cl));
  col = mix(col, sun, (.6 + .4*uPad)*max((.2 + .75*uPad)*exp(-sr*4.), slDn(-.004, .004, sr - .05)*(1. - .4*slUp(.4, .7, cl))));
  // snowy roofs on the lip of the cutting
  for (int k = 0; k < 2; k++) {
    float f = float(k), cell = .13 + .13*f, gx = (x + .31*f + .05)/cell, id = floor(gx), r1 = slH(id + 17.*f), r2 = slH(id + 40. + 9.*f);
    float cx = (gx - id - .5)*cell, ax = abs(cx), hw = cell*(.28 + .18*r1), wall = slHz + (.012 + .03*f)*(.3 + r2);
    float roof = max(p.y - wall - hw*(.45 + .2*r2)*(1. - ax/hw), max(wall - p.y, ax - hw)), body = max(ax - hw*.88, p.y - wall);
    body = min(body, slBox(vec2(cx - hw*.4, p.y), vec2(0., wall + hw*.35), vec2(.006, .018)));
    float there = step(.25, r1)*(k == 0 ? 1. : slUp(.16, .18, abs((id + .5)*cell - .36 - slCurve(.02)))), far = .55 - .3*f;
    col = mix(col, mix(vec3(.36, .25, .22)*day*(.85 + .2*noise(p*vec2(60., 200.))), pearl, far), slIn(body)*there*step(sy, .03));
    col = mix(col, mix(mix(vec3(.33, .3, .32), vec3(.95), sat(.8 + white))*day, pearl, far*.8), slIn(roof)*there);
    col = mix(col, amber, slIn(slBox(vec2(cx + hw*.3, p.y), vec2(0., wall - .013), vec2(.005, .006)))*there*sat(.15 + .8*uKeys + night));
  }
  // the cutting: its banks, its floor, the wet rails
  if (sy > .007*slN1(x*11.)) {
    float s = sy, l = (x - slCurve(s))/(slW*s), m = .6, up2 = 0.;
    if (abs(l) > 2.3) {
      for (int i = 0; i < 2; i++) s = (sy + m*abs(x - slCurve(s))/slW)/(1. + m*2.3);
      l = (x - slCurve(s))/(slW*s); up2 = max(abs(l) - 2.3, 0.)*m;
    }
    float d = 1./max(s, .012), fog = 1. - exp(-max(d - 1.6, 0.)*(.15 + .06*uSpace + .05*air)), n;
    vec3 c;
    if (up2 > 0.) {
      vec2 q = vec2(d*2.2 + up2*.5, up2*5. + (l > 0. ? 11. : 0.));
      n = .5*slN2(q) + .3*noise(q*5.) + .2*noise(q*vec2(26., 9.));
      n = mix(n, .5, slUp(4., 9., d));
      float sn = slUp(.4, .56, n + .3*white + .1*(up2 - .5));
      c = mix(mix(vec3(.3, .24, .205), vec3(.27, .265, .18), max(-white, 0.))*(.4 + n), mix(vec3(.5, .55, .63), vec3(.83, .81, .79), sat(2.*n - .5 - .4*step(0., l))), sn);
      c *= .7 + .3*slUp(0., .3, up2);
    } else {
      vec2 q = vec2(l*3., d*5.);
      n = .6*noise(q) + .4*noise(q*vec2(5., 4.));
      float tl = abs(abs(l) - 1.05), gauge = abs(tl - .46), bed = slDn(.7, .74, tl), rw = max(.04, 1.2*slPx/(slW*s));
      c = mix(mix(vec3(.17, .145, .14), vec3(.31, .28, .27), n), vec3(.62, .65, .71), .8*slUp(.5, .62, n + .25*white - .05));
      c = mix(c, vec3(.13, .105, .1), mix(.35, slUp(.35, .6, abs(fract(d*5.5) - .5)*2.), slDn(3.5, 8., d))*bed*(1. - .4*white));
      c = mix(c, vec3(.17, .11, .085), .8*slDn(rw, rw*2.4, gauge));
      c = mix(c, mix(pearl, sun, .6)/max(day, .3), slDn(rw*.6, rw*1.2, gauge)*min(1., .056/rw)*(.6 + .4*noise(vec2(d*3., l))));
    }
    col = mix(c*day, pearl, fog);
  }
  // signal masts with round lamps
  for (int k = 0; k < 3; k++) {
    float f = float(k), s = k == 0 ? .25 : k == 1 ? .15 : .09, l = k == 1 ? -2.05 : 2., dir = -sign(l), top = slHz + s*(k == 0 ? .85 : 1.);
    vec2 q = vec2(x - slCurve(s) - l*slW*s, p.y), l1 = q - vec2(dir*.3*s, top - .1*s), l2 = l1 + vec2(0., .38*s);
    float d = slBox(q, vec2(0., .5*(slHz - s + top)), vec2(.012*s + .0008, .5*(top - slHz + s)));
    d = min(d, slBox(vec2(l1.x, min(abs(l1.y + .1*s), abs(l2.y + .1*s))), vec2(-dir*.14*s, 0.), vec2(.17*s, .014*s)));
    float ld = min(length(l1), length(l2)), g = sat(.25 + (l1.y*l1.y < l2.y*l2.y ? .6*band(.2 + .3*f) + uKeys : .9*band(.35 + .25*f)));
    vec3 dye = mix(red, amber, slUp(-.02*s, .02*s, l1.y + .19*s));
    float fog = 1. - exp(-(1./s - 1.6)*(.09 + .05*air));
    col = mix(col, mix(iron, pearl, fog), slIn(min(d, ld - .085*s)));
    col = mix(col, dye*(.3 + .75*g), slIn(ld - .06*s)*(1. - .4*fog));
    col += dye*g*.14*exp(-ld*9./s);
  }
  // the steam, behind the lattice and again before it
  float env = .5 + .5*cos(TAU*(uLoop - .42)), puff = 4.*uCue*(1. - uCue), xs = x/mix(.5, 1., slFr) + .2 - .75*(p.y + .4);
  float lev = -.42 + .16*uDrone + .26*env + .3*air + .06*uLow + .7*puff + .54*slBell(xs*1.7);
  vec2 h = slLit(p*2.8 - vec2(uTravel*.012, uTravel*.05), .7, .09, vec2(.62, .7));
  float T = (lev - .38*slUp(0., .45, x) - p.y)*3. + (h.x - .48)*3.6, lit = sat(.5 + 1.9*h.y + 1.5*(h.x - .48))*mix(.6, 1., slUp(-.4, .12, p.y + .15*xs));
  vec3 wh = mix(vec3(.4, .395, .45), vec3(1., .97, .92), lit)*mix(vec3(1.), day, .85);
  wh = mix(wh, wh*(.45 + .75*heard.rgb/max(heard.a, .05)), .12*heard.a);
  // six windows of a train it hides, once a loop
  for (int i = 0; i < 6; i++) {
    float d = mix(-6., 13., uLoop) + .9*float(i), s = 1./max(d, 1.);
    vec2 q = (p - vec2(slCurve(s) - .5*slW*s, slHz - .62*s))/s;
    vec2 e = max(abs(q) - vec2(.02, .04), 0.);
    wh = mix(wh, vec3(1., .78, .42), sat(slLamp(float(i))*(exp(-dot(e, e)*400.) + .2*exp(-dot(q, q)*25.)))*slUp(1.1, 1.6, d)*slDn(6., 13., d));
  }
  vec2 fire = vec2(x + .22*slFr, p.y + .46);
  wh = mix(wh, vec3(.93, .4, .2), sat((.08 + 1.1*uHits + .4*uCue)*exp(-length(fire)*5.)*(.3 + 2.*h.x)));
  float back = slUp(0., 1., T)*.95;
  col = mix(col, wh, back);
  // the parapet, and the lamp at its end
  float xe = mix(-.22, -.7, slFr), k = max(x - xe + .95, .2), v = (sy/k - .075)/.325, rust = slN2(vec2(40./k, v*9.));
  if (x > xe - .02) {
    float D = 11.*exp(.55*uOwn[3]), u = D/k, N = D*.15, ew = slPx*(D/(k*k) + N*3.1/k), wd = .075 + .02*uOwn[3];
    float g1 = .5 - fract(u + v*N), g2 = fract(u - v*N) - .5, f1 = abs(g1), f2 = abs(g2), ice = sat(.3 + .4*white + .8*uTexture), in_ = slUp(0., .02, v)*slDn(.98, 1., v);
    float far = .62*slDn(.7, 2.3, k), on1 = slDn(wd - ew, wd + ew, f1)*in_, on2 = slDn(wd - ew, wd + ew, f2)*in_;
    vec3 metal = mix(iron, vec3(.36, .19, .12)*day, .75*slUp(.5, .75, rust));
    col = mix(col, mix(mix(metal*.7, vec3(.85)*day, ice*slUp(wd*.4, wd, g1)), pearl, far), on1);
    col = mix(col, mix(mix(metal, vec3(.9)*day, ice*slUp(wd*.4, wd, g2)), pearl, far), on2);
    col = mix(col, mix(metal*2.2, pearl, far), slDn(.03, .03 + ew, length(vec2(f1, f2)))*in_*.8);
    float eh = slPx*3.1/k;
    float post = slDn(.1, .1 + ew, abs(fract(u/5. + .04) - .5)*5.)*slUp(0., .02, v);
    float rail = slUp(-.11 - eh, -.11 + eh, v)*slDn(.03 - eh, .03 + eh, v);
    rail = max(rail, slUp(.95 - eh, .95 + eh, v)*slDn(1.05 - eh, 1.05 + eh, v));
    col = mix(col, mix(metal*(.6 + 1.1*slDn(-.06, -.02, v)), pearl, far), max(post*slDn(1., 1. + eh, v), rail));
    float cap = v + .11 + .02*slN1(u*9.) + .03*white;
    ice = slUp(-eh, eh, cap)*slDn(-eh, eh, v + .075)*sat(1. + 1.5*white);
    col = mix(col, vec3(.95, .95, .97)*day + step(.96, hash21(floor(p*260.)))*uTexture*.5, ice);
  }
  vec2 q = p - vec2(xe, slHz + .17);
  float post = slBox(q, vec2(0., -.2), vec2(.0055, .19));
  float cage = max(abs(q.x) - .012 - .28*(q.y + .01), abs(q.y - .012) - .022);
  post = min(post, max(abs(q.x) - .03 + 1.3*(q.y - .034), .034 - q.y));
  col = mix(col, mix(iron, pearl, .3), slIn(min(post, cage)));
  col = mix(col, amber*(1. + .2*uMic), slIn(cage + .004)*(.75 + .25*uMic));
  col += amber*(.16 + .3*night + .4*uMic + .3*uCue)*exp(-length(q - vec2(0., .01))*13.);
  col = mix(col, wh, slUp(0., 1.6, T - 1.5)*.88);
  return col;
}
vec3 render(vec2 p) {
  slPx = 1./uRes.y; slHw = .5*uRes.x/uRes.y; slFr = slUp(.5, 1.4, 2.*slHw);
  return uVar < .5 ? slValley(p) : sat(slCutting(p));
}
