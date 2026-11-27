// name: Hills
// a: Dawn mist
// b: Dunes
// what: Ranges of hills one behind another at dawn with mist lying in the valleys, the far ones pale and the near ones dark; or dunes of sand in low side light with wind lifting a veil of sand from the crests.
// follows: Each range is one kind of sound: it rises a little and its mist glows in that colour as the sound plays; the low band is the breathing of the mist; the sun's glow follows the mix; a hit is a bloom of light in one valley and a cue runs light along another; on the dunes each ridge is a kind of sound, the low band is the wind and a hit is a gust.
// own: 0 the hour: 1 broad day, -1 night with stars; 1 1 jagged peaks, -1 flat tables with cliffs (b: terraces in steps); 2 1 many small hills, -1 a few great ones; 3 1 painted in the colours of the sounds, in rows and fields, -1 drawn in lines; 4 1 water lies in the valleys, -1 a sea of mist; 5 1 seen from high above, -1 low with a great sky; 6 1 trees everywhere (b: round bushes), -1 snow lies; 7 1 a great disc stands over the land (b: and lights it from behind), -1 no sun under a lid of cloud
float hiLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float hiH1(float n) { n = fract(n * .1031); n *= n + 33.33; n *= n + n; return fract(n); }
float hiN1(float x, float seed) { x += seed * 37.7; float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(hiH1(i), hiH1(i + 1.), f); }
float hiSq(float x) { return x * x; }
float hiSin(float x) { x = abs(fract(x * .159155) - .5) * 2.; return 1. - 2. * x * x * (3. - 2. * x); }
float hiDay, hiNight, hiJag, hiFlat, hiPaint, hiLine, hiPool, hiSea, hiHigh, hiLow, hiGrow, hiSnow, hiDisc, hiLid, hiStep, hiUp, hiMany;
void hiRead() {
  hiDay = max(uOwn[0], 0.); hiNight = max(-uOwn[0], 0.); hiJag = max(uOwn[1], 0.); hiFlat = max(-uOwn[1], 0.);
  hiPaint = max(uOwn[3], 0.); hiLine = max(-uOwn[3], 0.); hiPool = max(uOwn[4], 0.); hiSea = max(-uOwn[4], 0.);
  hiHigh = max(uOwn[5], 0.); hiLow = max(-uOwn[5], 0.); hiGrow = max(uOwn[6], 0.); hiSnow = max(-uOwn[6], 0.);
  hiDisc = max(uOwn[7], 0.); hiLid = max(-uOwn[7], 0.);
  hiStep = uOwn[2] > 0. ? .2 / (1. + .8 * uOwn[2]) : .2 / (1. + .55 * uOwn[2]);
  hiUp = .27 * hiHigh - .2 * hiLow;
  hiMany = uOwn[2];
}
// By the hour: dawn, day, night.
vec3 hiHour(vec3 dawn, vec3 day, vec3 night) { return mix(mix(dawn, day, hiDay), night, hiNight); }
vec3 hiPaper() { return mix(vec3(.012, .02, .036), vec3(1.9, 1.72, 1.4), smoothstep(0., .7, hiDay)) * (1. - .6 * hiNight); }
vec3 hiInk() { return mix(vec3(.75, .68, .56), vec3(.02, .025, .04), smoothstep(0., .7, hiDay)); }
float hiStars(vec2 q) {
  float s = 0.;
  for (int k = 0; k < 2; k++) {
    float f = k == 0 ? 19. : 43.;
    vec2 g = rot(.4) * q * f, id = floor(g), h = vec2(hash21(id + 3.7), hash21(id.yx + 51.3));
    float r = length(g - id - .2 - .6 * h), px = f / uRes.y, big = fract(h.x * 91.7 + h.y * 37.3);
    s += step(.75, big) * smoothstep(.02 + .07 * (big - .75) + px, 0., r) * (.25 + 9. * hiSq(big - .75)) * (.8 + .2 * hiSin(uTime * (.4 + h.x) + h.y * 40.));
  }
  return s;
}
// The sky at another hour, y over the land's end.
vec3 hiSky(vec3 col, float y, float lvl) {
  if (uOwn[0] != 0.) {
    vec3 high = mix(vec3(.07, .17, .34), uKind[1] * uKind[1] * .5, .4), low = mix(vec3(.95, .9, .8), uKind[1] + .2, .3);
    col = mix(col, mix(low, high, smoothstep(-.02, .42, y)), hiDay);
    col = mix(col, mix(vec3(.035, .055, .1), vec3(.003, .006, .016), smoothstep(-.02, .4, y)), hiNight);
  }
  if (hiLid > 0.) col = mix(col, hiHour(vec3(.16, .13, .15), vec3(.75, .8, .84), vec3(.03, .04, .06)) * mix(1.25, .5, smoothstep(0., .42, y)) * (.75 + .5 * lvl), hiLid);
  return col;
}
// The great disc; o is 1 long at its edge.
vec3 hiDiscOn(vec3 col, vec2 o, float lvl) {
  float l = dot(o, o);
  if (l > 1.1) return col;
  vec3 fire = mix(hiHour(vec3(1., .85, .6), vec3(1., .95, .85), vec3(.4, .43, .45)), uKind[4] * uKind[4] * 1.5, .6) * (.75 + .5 * lvl) * mix(.5, 1.3, smoothstep(-1., .7, o.y)) * (1. - .35 * l);
  return mix(col, fire * 1.5 * (.88 + .24 * noise(o * vec2(1.5, 5.) + 3.)), smoothstep(1.02, .98, sqrt(l)) * hiDisc * (1. - hiLid));
}
float hiBase(float near) {
  float b = mix(.075, -.335, pow(near, 1.1));
  if (uOwn[5] != 0.) b += mix(hiUp, .04 * hiHigh - .08 * hiLow, min(near, 1.));
  return b;
}
float hiTri(float v, float s) { float i = floor(v) + s; return mix(hiH1(i), hiH1(i + 1.), fract(v)); }
// The form of a range: rounded hills, sharp peaks or tables.
float hiForm(float u, float fi) {
  float h = hiN1(u, fi * 3.1) + .5 * hiN1(u * 2.3 + 4., fi * 3.1 + 7.) + .2 * hiN1(u * 5.9, fi + 11.);
  if (hiJag > 0.) {
    float g = hiTri(u * 1.15 + .3, fi * 37.);
    h = mix(h, 2.1 * g * g + .75 * hiTri(u * 2.9 + 1.7, fi * 11.) + .28 * hiTri(u * 7.3 + 5.1, fi * 23.) + .1 * hiN1(u * 24., fi + 2.) - .2, hiJag);
  }
  if (hiFlat > 0.) {
    float n = hiN1(u * 1.5 + 2., fi * 5.3) + .06 * hiN1(u * 11., fi), m = .2 + .7 * smoothstep(.54, .57, n) + .5 * smoothstep(.75, .77, n) + .35 * smoothstep(.34, .54, n) + .06 * hiN1(u * 3.1, fi + 4.) + .02 * hiN1(u * 41., fi + 4.);
    h = mix(h, m, hiFlat);
  }
  return h;
}
float hiWood(float w, float all) { return uOwn[6] != 0. || uOwn[1] != 0. || hiLine > 0. ? mix(w * (1. - hiSnow) * (1. - .9 * abs(uOwn[1])) * (1. - hiLine), all, hiGrow) : w; }
float hiWide(float near) { return mix(2.3, .85, min(near, 1.)) * exp2(hiMany * (hiMany > 0. ? .7 : .75)); }
float hiTall(float near) { return mix(.05, .15, min(near, 1.)) * exp2(-.75 * hiMany) * (1. + .55 * hiJag * (1.2 - near)); }
// The line of one range; near is 0 for the last and 1 for the nearest.
float hiRidge(float x, float fi, float near, float lift) {
  float f = hiWide(near), amp = hiTall(near), u = x * f + fi * 17.3, h = hiForm(u, fi);
  h = amp * (h - .85) * 1.5 + .03 * hiSin(x * 1.1 + fi * 2.3);
  float tf = mix(300., 64., min(near, 1.)), tu = x * tf + 3. * hiN1(x * tf * .21, fi), tip = max(0., 1. - 2.8 * abs(fract(tu) - .5)) * hiH1(floor(tu) + fi * 31.), wood = hiWood(smoothstep(.3, .7, near), 1.5 + 1.1 * smoothstep(.1, .8, near));
  h += (tip * tip * 1.6 + .5 * hiN1(x * tf * .6, fi + 5.)) / tf * wood;
  return hiBase(near) + h + lift;
}
float hiBird(vec2 q, float flap) {
  q.x = abs(q.x);
  float y = q.y - flap * q.x + (.5 + abs(flap)) * q.x * q.x * 16.;
  return smoothstep(.003, .001, abs(y)) * smoothstep(.03, .02, q.x);
}
vec3 hiDawn(vec2 p) {
  float px = 1.2 / uRes.y;
  vec2 real = p;
  float wet = 0., shore = 0.;
  if (hiPool > 0.) {
    shore = mix(-.66, hiBase(.6) - .015, hiPool);
    float deep = shore - p.y;
    wet = smoothstep(-px, px, deep);
    if (deep > 0.) {
      float rip = noise(vec2(p.x * 5. + uTime * .07, 26. * sqrt(deep + .001) - uTime * .12)) + noise(vec2(p.x * 2. - uTime * .05, 60. * sqrt(deep + .001) + uTime * .1)) - 1.;
      p = vec2(p.x + .012 * rip * smoothstep(0., .1, deep), shore + deep * .92 + .02 * rip * smoothstep(0., .15, deep));
    }
  }
  float drift = uTravel * .012 + uTime * .002, breath = .5 + .5 * hiSin(uTime * .21), lvl = uLevel;
  vec2 sun = vec2(.24, .078);
  float up = p.y - .03;
  if (hiUp != 0.) { up -= hiUp; sun.y += hiUp; }
  float big = .03, other = max(max(max(hiDay, hiNight), max(hiPaint, hiSnow)), .75 * abs(uOwn[1]));
  if (hiDisc > 0.) { sun = mix(sun, vec2(-.12, .13 + hiUp * .75), hiDisc); big += .15 * hiDisc; }
  vec3 col = mix(vec3(.4, .13, .08), vec3(.085, .035, .1), sat(up * 4.8));
  col = mix(col, vec3(.003, .008, .032), smoothstep(.06, .46, up));
  col = hiSky(col, up, lvl);
  if (hiNight > 0.) {
    float river = noise(vec2(p.x * 2. + p.y * 3., p.y * 4. - p.x * 2.)) * exp(-16. * hiSq(p.x * .55 - p.y + .25));
    col += hiNight * (1. - hiLid) * smoothstep(-.02, .2, up) * (vec3(.85, .9, 1.) * hiStars(p) * (.6 + river) + vec3(.03, .035, .06) * river);
  }
  float ds = length((p - sun) * vec2(.5, 1.)), glow = .22 + 1.1 * lvl, gone = 1. - hiLid, clear = (1. - hiLid) * (1. - .85 * hiLine);
  vec3 warm = hiHour(vec3(1., .33, .1), vec3(.9, .75, .5), vec3(.1, .14, .24)), core = hiHour(vec3(1., .68, .32), vec3(1., .9, .7), vec3(.28, .33, .45)), face = hiHour(vec3(1., .92, .75), vec3(1., .97, .9), vec3(.55, .58, .6));
  float ang = atan(p.y - sun.y, p.x - sun.x), rays = noise(vec2(ang * 7., uTime * .03)) * noise(vec2(ang * 19. + 4., uTime * .05));
  col += warm * glow * .5 * exp(-ds * 5.) * (.7 + 1.5 * rays * sat(1. - hiDisc - hiNight - .6 * hiDay)) * clear;
  col += core * glow * 1.4 * exp(-ds * 17.) * clear * (1. - .7 * hiDisc);
  col += face * glow * 4. * smoothstep(big, big - .004, length(p - sun)) * gone * (1. - hiDisc);
  if (hiDisc > 0.) col = hiDiscOn(col, (p - sun) / big, lvl);
  vec2 cq = vec2(p.x * 1.2 + drift * .4, p.y * 10. + 3.);
  float ci = .55 * noise(cq) + .3 * noise(cq * 2.1 + 5.) + .15 * noise(cq * 4.3 + 9.), cm = smoothstep(.48, .8, ci) * smoothstep(.03, .12, up) * smoothstep(.5, .18, up);
  col = mix(col, hiHour((vec3(.75, .22, .14) * exp(-ds * 2.6) + vec3(.06, .03, .065)) * (.5 + lvl), vec3(.95), vec3(.025, .035, .06)), cm * .6 * (1. - hiLine));
  if (hiLid > 0.) {
    float lid = fbm(vec2(p.x * 1.6 + drift, up * 5. + uTime * .005)), lean = p.x + .3 * p.y, rain = smoothstep(.4, .75, noise(vec2(lean * 2.6 + uTime * .02, 3.))) * (.4 + noise(vec2(lean * 34., p.y * 2. + uTime * .4)));
    col *= mix(1., (.5 + 1.05 * lid) * (1. - .6 * rain * smoothstep(.35, 0., up)), hiLid);
  }
  if (hiLine > 0.) {
    vec3 sk = hiPaper();
    float o = length(p - sun) - big * 1.2;
    sk = mix(sk, mix(uKind[4], sk, .2), .75 * smoothstep(px, -px, o) * gone);
    sk = mix(sk, hiInk(), .8 * smoothstep(2. * px, .5 * px, abs(o)) * gone);
    float yy = up * 60. + .6 * noise(vec2(p.x * 3., 1.)), lie = smoothstep(.5, .8, noise(vec2(p.x * 1.3 + drift * .5, floor(yy) * .33))) * smoothstep(.03, .1, up);
    sk = mix(sk, hiInk(), .6 * step(.01, lie) * smoothstep(60. * px, 0., abs(fract(yy) - .5) - .12 * lie + .02));
    col = mix(col, sk, hiLine);
  }
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec2 at = vec2(1.2 - 2.6 * fract(uTime * .012 + .31), .2 + hiUp) + vec2(.08 * fk - .03 * hiH1(fk + 1.), .03 * hiH1(fk + 4.) + .012 * hiSin(uTime * .3 + fk * 2.));
    float b = hiBird((p - at) * 1.5, .8 * hiSin(uTime * 2.8 + fk * 1.7));
    col = mix(col, vec3(.015, .012, .025), b * .8);
  }
  float hitX = -.28 + .25 * hiSin(uTime * .13), cueX = -1.1 + 2.2 * (1. - uCue);
  vec3 air = hiHour(vec3(.16, .1, .13) * (.5 + lvl), mix(vec3(.62, .68, .76), uKind[1], .35), vec3(.018, .03, .058)) * mix(1., .75, hiLid);
  vec3 lamp = hiHour(vec3(.75, .42, .3) * (.35 + .8 * lvl), vec3(1.35, 1.22, 1.), vec3(.06, .08, .12)) * mix(1., .6, hiLid), shade = hiHour(vec3(.06, .05, .11), vec3(.14, .21, .33), vec3(.01, .016, .035));
  bool crossed = hiPool <= 0.;
  for (int i = 0; i < 10; i++) {
    float fi = float(i), near = fi * hiStep;
    if (i > 5 && (hiMany <= 0. || near > 1.3)) break;
    if (near > 1.6) break;
    float lv, sink = 0.; vec3 kc;
    if (hiMany == 0.) {
      int kind = min(5 - i, 4);
      lv = i == 0 ? 0. : hiLv(kind);
      kc = uKind[kind];
    } else {
      float kf = clamp(5. * (1. - near), 0., 5.); int k0 = int(kf);
      lv = kf > 4. ? hiLv(4) * (5. - kf) : mix(hiLv(k0), hiLv(min(k0 + 1, 4)), kf - float(k0));
      kc = kindColour(kf);
      if (i > 5) sink = .3 * (1. - smoothstep(0., .25, hiMany));
    }
    vec3 hue = kc;
    kc = kc * kc * 1.5 + kc * .15;
    if (!crossed && near > .65) {
      crossed = true;
      if (wet > 0.) {
        float deep = max(shore - real.y, 0.);
        col = mix(col, col * .78 + air * .05 + .05 * air * noise(vec2(real.x * 3., 90. * sqrt(deep + .001) - uTime * .2)), wet);
        col += .2 * air * exp(-deep * 160.) * wet;
      }
      p = real;
    }
    if (hiPool > 0. && near > .65) sink += .2 * hiPool;
    float x = p.x + drift * mix(.2, 2.2, near * near), h = hiRidge(x, fi, near, .03 * lv * (1. - .4 * near) - sink), below = h - p.y, mask = smoothstep(-px, px, below);
    float toSun = exp(-abs(p.x - sun.x) * mix(1.4, 2.4, near));
    vec3 far = vec3(.07, .06, .125) + vec3(.3, .09, .03) * toSun * (.3 + lvl), body = mix(far, vec3(.0025, .006, .01), pow(near, .5));
    body *= .7 + .6 * noise(vec2(x * mix(14., 6., near) + fi * 9., (p.y - h * .7) * mix(50., 20., near)));
    float rim = exp(-max(below, 0.) * mix(300., 90., near)) * toSun;
    body += vec3(1., .45, .2) * rim * (.04 + .2 * lvl) * mix(1., .3, near);
    if ((other > 0. || hiLine > 0.) && mask > 0.) {
      // the face of the range, lit from one side
      float f = hiWide(near), b = max(below, 0.), um = (x + (.5 + .8 * hiJag) * b * (noise(vec2(x * f * 2., fi * 7.)) - .5)) * f + fi * 17.3, ee = .035;
      um += (noise(vec2(x * f * 5. + fi, b * 22.)) - .5) * (.14 - .05 * hiJag) * smoothstep(0., .03, b);
      if (hiJag > 0.) um += hiJag * .22 * (abs(fract(b * 9. + 2. * hiN1(x * f * 3., fi)) - .5) - .25) * smoothstep(0., .05, b) * f;
      float lean = (hiForm(um + ee, fi) - hiForm(um - ee, fi)) / ee, lit = sat(.5 - .42 * lean / (1. + abs(lean) * .35));
      lit = mix(lit, .62, .5 * hiLid);
      float fine = noise(vec2(x * mix(60., 26., near), b * mix(160., 60., near))), bed = hiFlat * (noise(vec2(fi * 3. + x * .6, b * mix(150., 70., near))) - .5);
      vec3 land = mix(vec3(.15, .17, .12) + .5 * bed * vec3(.2, .12, .08), hue * hue * (1.1 + bed) + .02, hiPaint);
      if (hiPaint > 0.) {
        float row = um * mix(26., 34., near) + b * 30. * (hiN1(floor(um * 1.7), fi) - .5), fw = 34. * f * px * 2. + .06, patch1 = hiH1(floor(um * 1.7 + .8 * hiN1(b * 9., fi)) + fi * 13.);
        land *= mix(1., (.65 + .7 * patch1) * (.82 + .36 * smoothstep(.5 - fw, .5 + fw, abs(fract(row) - .5) * 2.)), hiPaint * smoothstep(.1, .5, near + .1));
      }
      land *= .8 + .4 * fine;
      if (hiSnow > 0.) {
        float lies = smoothstep(.1, .5, hiSnow * 1.5 - b * (7. - 6. * hiSnow) + .5 * (fine - .5) + .4 * (lit - .5) * hiJag - .3 * hiJag * smoothstep(.72, .86, abs(lit - .5) * 2.));
        land = mix(land, vec3(.8, .83, .88) * (.95 + .1 * fine), lies);
      }
      land *= lamp * lit * 1.15 + shade * (.5 + .5 * (1. - lit));
      land += kc * lv * (.05 + .25 * exp(-b * 20.)) * (.3 + lamp);
      vec3 seen = mix(air, land, pow(sat(.18 + .82 * near), mix(.8, .5, max(hiPaint, hiSnow))));
      seen += warm * exp(-b * mix(300., 90., near)) * toSun * (.1 + .3 * lvl) * mix(1., .3, near) * gone;
      body = mix(body, seen, other);
      if (hiLine > 0.) {
        vec3 pap = hiPaper();
        float fq = mix(150., 60., near), v = b * fq * (1. + .6 * b) + 1.3 * noise(vec2(x * f * 3., fi * 5. + b * 3.)), w = fq * px, strong = sat((.7 - lit) * 1.1 + .06) * exp(-b * mix(9., 3., near));
        float stroke = smoothstep(w * 1.4 + .02, 0., abs(fract(v) - .5) - .3 * strong), edge = smoothstep(mix(1.6, 2.6, near) * px, .6 * px, below);
        vec3 wash = mix(pap, pap * (.35 + .75 * hue) + (1. - hiDay) * hue * hue * .1, (.25 + .55 * sqrt(lv)) * exp(-b * 5.));
        wash = mix(wash, hiInk(), max(edge, stroke * mix(.55, .85, near) * smoothstep(0., .1, strong)) * mix(.55, 1., near));
        body = mix(body, wash, hiLine);
      }
    }
    col = mix(col, body, mask);
    float b0 = hiBase(near), b1 = hiBase(hiMany == 0. ? min(near + hiStep, 1.25) : near + hiStep) - sink, gap = b0 - b1;
    if (hiMany < 0.) { gap = min(gap, .1); b1 = b0 - gap - sink - .1 * hiMany * hiMany; }
    vec2 mq = vec2(x * 1.6 + uTime * .012 * (1. + fi * .3) + fi * 5., p.y * 6. - uTime * .008);
    float wisp = noise(mq) * .65 + noise(mq * vec2(2.7, 3.4) + 5.) * .35, top = b1 + gap * (.15 + .5 * uLow * (.5 + .5 * breath) + .15 * breath) + (wisp - .5) * gap * 1.5, dens = smoothstep(top + gap * .8, top - gap * .5, p.y);
    dens *= .55 + .45 * noise(mq * vec2(4., 9.) + 9.);
    if (hiSea > 0.) {
      float roll = fbm(vec2(x * mix(5., 2.2, near) + fi * 5. + uTime * .01, (p.y - b1) * mix(16., 8., near))), lev = b1 + gap * .75 + mix(.02, .07, near) * (roll - .35) * 1.5 + .02 * breath * uLow;
      dens = mix(dens, smoothstep(.006, -.02, p.y - lev) * (.9 + .1 * wisp), hiSea);
      wisp = mix(wisp, sat(roll * 1.6 - .15 + (p.y - lev) * 4.), hiSea);
    }
    dens *= (1. - .85 * hiLine * (1. - hiSea)) * (1. - .5 * hiPool * step(near, .65)) * (1. - .55 * max(hiDay, max(hiPaint, hiSnow)) * (1. - hiSea));
    vec3 mist = mix(vec3(.15, .085, .14), vec3(.016, .03, .06), pow(near, .7)) * (.6 + .7 * lvl);
    mist += vec3(1., .4, .14) * toSun * (.1 + .5 * lvl) * mix(1., .1, near) * (.7 + 1.5 * rays);
    if (other > 0. || hiSea > 0.) {
      vec3 soft = hiHour(mix(vec3(.2, .13, .17), vec3(.08), near) * (.6 + .7 * lvl) + vec3(.8, .35, .15) * toSun * .35 * lvl, mix(vec3(.95), air, .4), vec3(.03, .045, .08)) * (.55 + .7 * wisp);
      mist = mix(mist, soft, max(other, hiSea));
    }
    mist += kc * lv * mix(.6, .35, near) * (.35 + 1.1 * wisp) * (1. - .6 * hiDay * (1. - hiLine));
    if (hiDay > 0.) mist = mix(mist, mist * (.45 + .8 * hue), hiDay * .8 * sat(lv * 1.2));
    if (hiLine > 0.) mist = mix(mist, hiPaper() * mix(vec3(1.), .4 + .75 * hue, hiDay * sat(lv)) + (1. - hiDay) * kc * lv * .3, hiLine);
    float hd = length(vec2(p.x - hitX, (p.y - top + .02) * 2.4)), one = max(0., 1. - abs(near - .6) / hiStep), two = max(0., 1. - abs(near - .8) / hiStep);
    if (one > .001) mist += one * mix(mix(vec3(1., .8, .55), uKind[4], .35), uKind[4] - .45, hiDay * .8) * uHits * 1.5 * exp(-hd * hd * 24.);
    float cd = length(vec2((p.x - cueX) * .8, (p.y - top + .02) * 2.6));
    if (two > .001) mist += two * vec3(1., .75, .5) * uCue * 1.1 * exp(-cd * cd * 14.);
    col = mix(col, mist, dens * .88);
  }
  float xn = p.x + drift * 3.2, hn = -.5 + .1 * hiN1(xn * .8 + 40., 3.) + .03 * hiN1(xn * 2.6, 9.), tu = xn * 23. + 2.5 * hiN1(xn * 5., 1.), tip = max(0., 1. - 2.5 * abs(fract(tu) - .5)) * hiH1(floor(tu));
  float tu2 = xn * 61. + 2. * hiN1(xn * 14., 2.), tip2 = max(0., 1. - 2.5 * abs(fract(tu2) - .5)) * hiH1(floor(tu2) + 9.), wood = .3 + .7 * smoothstep(.3, .7, hiN1(xn * 2., 5.));
  wood = hiWood(wood, 1.9);
  hn += (.11 * tip * tip * tip + .025 * tip2) * wood;
  hn -= .2 * max(max(hiHigh, hiPool), hiSea * (1. - hiGrow));
  vec3 foot = vec3(.002, .004, .006);
  if (other > 0.) {
    vec3 land = mix(mix(vec3(.05, .065, .04), uKind[0] * uKind[0] * .7, hiPaint), vec3(.75, .8, .88), hiSnow);
    foot = mix(foot, land * (lamp * .55 + shade * .5) * (.7 + .5 * noise(vec2(xn * 60., (hn - p.y) * 70.))) * (1. - .6 * hiGrow), other);
  }
  if (hiLine > 0.) foot = mix(foot, mix(hiPaper(), hiInk(), smoothstep(3. * px, px, hn - p.y)), hiLine);
  col = mix(col, foot, smoothstep(-px, px, hn - p.y));
  return col;
}
// The dunes. hiS.x is how far across its ridge a place is, hiS.y which ridge.
const float hiCrest = .66;
vec2 hiS;
float hiPile;
const mat2 hiRot = mat2(.9553, -.2955, .2955, .9553);
float hiK, hiHi, hiZ, hiBush, hiWater;
float hiDuneH(vec2 x) {
  float off = x.y - hiZ;
  if (hiMany != 0.) x *= hiK;
  vec2 r = hiRot * x;
  float w = 1.5 * hiSin(r.y * .15 + .9 * hiSin(r.x * .1)) + .6 * hiSin(r.y * .41 + 1.7), u = r.x * .19 + w * .3, id = floor(u), s = u - id, up = s / hiCrest;
  hiBush = 0.;
  float ramp = s < hiCrest ? up * sqrt(up) : (1. - s) / (1. - hiCrest), kind = id - 5. * floor(id * .2), lv = kind < .5 ? uDrone : kind < 1.5 ? uPad : kind < 2.5 ? uTexture : kind < 3.5 ? uPhrase : .3 * uHits;
  float pile = .3 + 1.9 * hiN1(r.y * .11, id) + .2 * lv;
  hiS = vec2(s, kind); hiPile = pile;
  float h = pile * ramp;
  if (hiMany != 0.) { h *= hiHi; hiPile *= hiHi; }
  if (hiJag > 0.) {
    float a = 1. - abs(2. * noise(x * .2 + 3.) - 1.), c = 1. - abs(2. * noise(x * .55 + .8 * a + 9.) - 1.), e = 1. - abs(2. * noise(x * 1.7 + c) - 1.);
    h = mix(h, (2.6 * a * a + 1.1 * c * a + .28 * e * c) * hiHi * mix(.3, 1., smoothstep(1., 14., off)), hiJag);
    hiPile = mix(hiPile, -9., hiJag);
  }
  if (hiFlat > 0.) {
    float l = h / .3, fl = floor(l), fr = l - fl;
    h = mix(h, (fl + smoothstep(.72, .98, fr)) * .3 + .012, hiFlat);
    hiPile = mix(hiPile, -9., hiFlat);
  }
  if (hiGrow > 0.) {
    vec2 g = r * .95, id = floor(g), j = hash22(id + 5.), o = g - id - .5 - .3 * (j - .5);
    float rr = (.17 + .2 * j.x) * smoothstep(0., .3, hiGrow) * step(1. - .9 * hiGrow, j.y + .1), b = rr * rr - dot(o, o);
    if (b > 0.) { h += 1.5 * sqrt(b) + .06; hiBush = 1.; }
  }
  return h;
}
vec3 hiDuneSky(vec3 rd, vec3 L, float lvl) {
  float y = max(rd.y, 0.);
  vec3 col = mix(vec3(.36, .12, .07), vec3(.08, .035, .1), sat(y * 4.5));
  col = mix(col, vec3(.003, .008, .032), smoothstep(.03, .34, y));
  float m = sat(dot(normalize(vec3(rd.x, y, rd.z)), L)), m2 = m * m, m4 = m2 * m2, beam = m4 / (1. + 40. * y * y) + .7 * m4 * m4 * m4 * m4 * m4;
  col = hiSky(col, y, lvl);
  col += hiHour(vec3(1., .4, .1), vec3(.6, .5, .35), vec3(.06, .09, .16)) * (.2 + .6 * lvl) * beam * (1. - hiLid);
  return col;
}
vec3 hiDunes(vec2 p) {
  float lvl = uLevel, wind = .2 + .8 * uLow;
  hiK = exp2(hiMany * (hiMany > 0. ? 1.3 : 1.5)); hiHi = exp2(-.8 * hiMany); hiZ = uTravel * .03;
  hiWater = 1.2 * hiPool * hiHi - .02;
  vec3 ro = vec3(uTravel * .1, 2.5, uTravel * .03);
  ro.y += 5. * hiHigh + (hiHi > 1. ? 2.4 : .9) * (hiHi - 1.) + .4 * hiGrow;
  vec3 rd = normalize(vec3(p.x, p.y - .14 - .4 * hiHigh + .3 * hiLow, 1.)), L = normalize(vec3(-.86, .22, .42));
  vec2 disc = vec2(-.22, .19);
  if (hiDisc > 0.) L = normalize(mix(L, vec3(-.3, .24, 1.), hiDisc));
  if (uOwn[0] > 0.) L = normalize(L + vec3(.1, .16, 0.) * hiDay * (1. - hiDisc));
  float t = .6 + .3 * hash21(gl_FragCoord.xy), d = 1., dPrev = 1., st = 0., veil = 0.;
  vec3 veilC = vec3(0.);
  for (int i = 0; i < 40; i++) {
    vec3 q = ro + rd * t;
    float bowl = .0016 * t * t;
    dPrev = d;
    d = q.y - hiDuneH(q.xz) - bowl;
    if (hiPool > 0.) d = min(d, q.y - hiWater - bowl);
    float past = hiS.x - hiCrest, sheet = past > 0. ? exp(-abs(q.y - bowl - hiPile + past * .8 - .04) * 14. - past * 26.) : exp(-max(d, 0.) * 16.) * smoothstep(-.12, 0., past), a = sheet * st * step(0., d) / (1. + .05 * t);
    int kd = int(hiS.y);
    veil += a; veilC += a * uKind[kd] * uKind[kd] * hiLv(kd);
    if (d < 0. || t > 70.) break;
    st = max(d * .5, .01 * t);
    t += st;
  }
  if (d < 0. && hiGrow > 0.) {
    float a = t - st;
    for (int k = 0; k < 5; k++) { float m = .5 * (a + t); vec3 q = ro + rd * m; if (q.y < hiDuneH(q.xz) + .0016 * m * m) t = m; else a = m; }
  } else if (d < 0.) t -= st * d / (d - dPrev);
  vec3 col = hiDuneSky(rd, L, lvl);
  if (hiNight > 0. && rd.y > 0.) col += hiNight * vec3(.85, .9, 1.) * hiStars(rd.xy / rd.z) * smoothstep(0., .2, rd.y);
  if (hiLid > 0.) {
    float lid = fbm(vec2(rd.x / (rd.y + .15) * .7 + uTime * .01, 1.2 / (rd.y + .15)));
    col *= mix(1., .45 + 1.1 * lid, hiLid * smoothstep(-.02, .12, rd.y));
  }
  if (hiDisc > 0.) col = hiDiscOn(col, (rd.xy / rd.z - disc) / .17, lvl);
  float ci = noise(vec2(p.x * 1.4 + uTime * .004, p.y * 12.)) * .65 + noise(vec2(p.x * 4., p.y * 30.) + 3.) * .35;
  col += hiHour(vec3(.6, .16, .08), vec3(.5), vec3(.02, .025, .04)) * (1. - hiLine) * (1. - .8 * hiLid) * (.3 + lvl) * smoothstep(.48, .85, ci) * smoothstep(.5, .2, p.y) * (.35 + .5 * sat(.6 - p.x));
  vec3 horizon = hiDuneSky(normalize(vec3(rd.x, .02, rd.z)), L, lvl);
  if (hiLine > 0.) { col = mix(col, hiPaper(), hiLine * (1. - .75 * hiDisc)); horizon = mix(horizon, hiPaper(), hiLine); }
  float other = max(max(hiDay, hiNight), max(max(hiPaint, hiSnow), max(hiLid, hiGrow)));
  if (t < 70.) {
    vec3 q = ro + rd * t;
    float e = .004 * t + .004, bowl = .0016 * t * t, h0 = hiDuneH(q.xz), bush = hiBush;
    vec2 s0 = hiS;
    vec3 n = normalize(vec3(h0 - hiDuneH(q.xz + vec2(e, 0.)), e, h0 - hiDuneH(q.xz + vec2(0., e))));
    float lee = step(hiCrest, s0.x);
    vec2 rr = hiRot * q.xz;
    float rp = sin(rr.x * 30. + 5. * noise(rr * 1.1) + 2.5 * noise(rr.yx * 4.)), rfade = (1. - .85 * lee) / (1. + .012 * t * t);
    rfade *= (1. - bush) * (1. - abs(uOwn[1])) * (1. - .75 * hiSnow) * (1. - .9 * hiPaint) * (1. - hiLine);
    n = normalize(n + vec3(.95, 0., .3) * rp * .4 * rfade);
    float dif = sat(dot(n, L));
    float sh = 1.;
    for (int k = 1; k < 5; k++) {
      float ds = .4 * float(k * k);
      vec3 qs = q + L * ds;
      sh = min(sh, smoothstep(-.02, .05 * ds + .02, qs.y - hiDuneH(qs.xz) - bowl));
    }
    int kd = int(s0.y);
    float lv = hiLv(kd);
    vec3 kc = uKind[kd]; kc = kc * kc * 1.5 + kc * .2;
    vec3 sand = vec3(.6, .33, .19) * (.8 + .4 * noise(q.xz * .4)) * (1. + .1 * rp * rfade), sunC = vec3(1., .36, .09) * (.4 + 1.5 * lvl), amb = vec3(.016, .03, .12) * (.3 + .9 * n.y) + vec3(.05, .012, .01) * sat(.3 - n.x), hue = uKind[kd];
    if (other > 0.) {
      sunC = hiHour(mix(sunC, vec3(1., .55, .3) * (.7 + 1.1 * lvl), max(hiSnow, hiPaint)), vec3(1.75, 1.5, 1.15), vec3(.1, .14, .23) * (.8 + .6 * lvl));
      amb = hiHour(amb, vec3(.15, .22, .34) * (.4 + .6 * n.y), vec3(.01, .017, .038) * (.5 + n.y));
      if (hiLid > 0.) { sh = mix(sh, 1., .8 * hiLid); dif = mix(dif, .3 * n.y, hiLid); amb = mix(amb, hiHour(vec3(.09, .08, .11), vec3(.7, .75, .8), vec3(.02, .026, .04)) * (.2 + .9 * n.y * n.y), hiLid); }
      if (hiPaint > 0.) {
        vec2 cell = floor(rr * vec2(.19, .28) * 1.6 + vec2(0., .5 * hiSin(rr.x * .7))); float fh = hash21(cell + 3.);
        vec2 dir = fh < .5 ? vec2(1., .25) : vec2(-.3, 1.);
        float row = dot(rr, dir) * 5., fw = 5. * (.0022 * t * (1. + 2. * abs(rd.x)) / max(-rd.y, .08)), stripe = mix(smoothstep(.3, .7, abs(fract(row) - .5) * 2.), .5, sat(fw * 1.2));
        vec3 crop = mix(hue, uKind[int(mod(s0.y + floor(fh * 2.99), 4.))], .6 * step(.5, fract(fh * 7.)));
        sand = mix(sand, crop * crop * (.65 + .5 * stripe) * (.8 + .5 * fract(fh * 13.)) + .015, hiPaint);
      }
      if (hiGrow > 0.) sand = mix(sand, mix(vec3(.09, .12, .055), hue * hue * .35, .4 * hiPaint) * (.7 + .6 * noise(q.xz * 24.)), bush);
      if (hiSnow > 0.) sand = mix(sand, vec3(.78, .81, .86), smoothstep(.25, .6, hiSnow * 1.4 - .7 * (1. - n.y) + .5 * (noise(q.xz * 1.7) - .5) - .35 * bush));
    }
    float off = abs(s0.x - hiCrest), crest = 1. / (1. + 120. * off * off);
    crest *= (1. - bush) * (1. - .8 * hiJag);
    col = sand * (sunC * dif * sh * (.75 + .6 * crest) + amb);
    col += sand * kc * lv * (.3 * dif * sh + .06 + .9 * crest * sh * (.3 + dif));
    col += (sunC * .6 + kc * lv) * .3 * sh / (1. + 3000. * off * off) * (1. - bush) * (1. - hiJag) * (1. - .7 * hiDay);
    if (hiLine > 0.) {
      vec3 pap = hiPaper();
      float v = h0 * 14., w = 20. * t / uRes.y / max(dot(-rd, n), .12) * sqrt(max(1. - n.y * n.y, 0.)) / max(n.y, .1) + 1e-3, far = sat(1.4 - w * 1.3), dark = 1. - sh * sat(dif * 1.6);
      float line = smoothstep(w * 1.1, 0., abs(fract(v) - .5) - .03 - .06 * dark) * far * smoothstep(34., 14., t);
      vec3 wash = mix(pap, pap * (.35 + .75 * hue) + (1. - hiDay) * hue * hue * .12, .2 + .6 * sqrt(lv));
      col = mix(col, mix(wash * (1. - .45 * dark * hiDay), hiInk(), .85 * line), hiLine);
    }
    if (hiPool > 0. && h0 < hiWater + .004) {
      float rip = noise(q.xz * vec2(3., 5.) + uTime * vec2(.3, .2)) - .5 + .5 * (noise(q.xz * 9. - uTime * .3) - .5);
      vec3 rf = normalize(vec3(rd.x + .03 * rip, .6 * abs(rd.y) + .04 * rip / (1. + .1 * t), rd.z));
      float tt = .25, hit = 0.;
      for (int k = 0; k < 14; k++) {
        vec3 z = q + rf * tt;
        float dz = z.y - hiDuneH(z.xz) - bowl;
        if (dz < 0.) { hit = 1.; break; }
        tt += max(dz * .6, .12) * (1. + .1 * float(k));
      }
      vec3 mir = hiDuneSky(rf, L, lvl);
      mir = mix(mir, mix(sand, mir, .25) * (amb + .3 * sunC * sat(.35 + .5 * L.y)), hit * .85);
      mir = mix(mir, hiPaper() * .8, hiLine);
      float fres = .55 + .45 * pow(1. - sat(-rd.y), 4.), edge = smoothstep(0., .16, hiWater - h0);
      vec3 bed = col * mix(vec3(1.), vec3(.06, .14, .16), edge) + kc * lv * .08;
      col = mix(bed, mir, fres * smoothstep(-.004, .02 + .001 * t, hiWater - h0));
      col += sunC * .25 * smoothstep(.02, 0., hiWater - h0);
    }
    col = mix(horizon * mix(.75, .95, max(hiDay, hiLine)), col, exp(-t * mix(.03, .016, hiDay)));
  }
  if (hiSea > 0.) {
    float lev = 1.3 * hiHi + .12 * uLow, reach = min(t, 70.), tin = rd.y < -.002 ? (lev - ro.y) / rd.y : 1e4, in1 = max(reach - max(tin, 0.), 0.);
    vec3 z = ro + rd * min(tin, 60.);
    float roll = fbm(z.xz * .5 + uTime * .03), deep = in1 * max(-rd.y, .02), a = 1. - exp(-max(deep - .5 * (1. - roll) + .2, 0.) * 9.);
    vec3 soft = mix(hiHour(vec3(.34, .27, .36) * (.5 + .9 * lvl), mix(vec3(.95), horizon, .4), vec3(.04, .06, .1)), hiPaper(), hiLine) * (.65 + .6 * roll), m4 = piece(vec2(sat(.5 + p.x * .5), sat(.5 - p.y))).rgb;
    soft = mix(soft, soft * (.4 + m4) + m4 * m4 * .2, sat(dot(m4, vec3(.4))));
    col = mix(col, mix(soft, horizon, 1. - exp(-min(tin, 70.) * .03)), a * hiSea * smoothstep(0., .4, in1));
  }
  float m = sat(dot(rd, L)), streak = noise(vec2(p.x * 3. - uTime * .25, p.y * 9. + p.x * 3.)) * (.5 + noise(vec2(p.x * 11. - uTime * .6, p.y * 40.)));
  vec3 vc = hiHour(vec3(1., .48, .2), vec3(1., .95, .85), vec3(.1, .14, .22)) * (.2 + .7 * lvl) * (.3 + 1.5 * m * m * m) * (1. - .8 * hiLine) + veilC / max(veil, .0001) * 1.1;
  float gx = p.x + .25 - .3 * hiSin(uTime * .11), cx = p.x - 1. + 2. * uCue, gust = uHits / (1. + 30. * gx * gx) + uCue / (1. + 20. * cx * cx), blown = 1.;
  if (other > 0.) blown = 1. - .85 * max(max(hiLid, hiGrow), hiDay);
  vec3 air = vc * (1. - exp(-veil * (.35 + 1.8 * wind + 7. * gust))) * (.4 + .9 * streak) * (1. + 1.6 * gust) * blown;
  if (hiLine * hiDay > 0.) { col *= 1. - .5 * hiLine * hiDay * sat(air); air *= 1. - hiLine * hiDay; }
  col += air;
  if (hiDay + hiFlat + hiJag + hiGrow + hiLid > 0.) {
    col *= 1. + .8 * exp(-12. * hiSq(p.y + .1 + .2 * hiLow)) * gust * sat(hiDay + hiFlat + hiJag + hiGrow + hiLid) * mix(vec3(1.), uKind[4] * 1.4, .6);
  }
  return col;
}
vec3 render(vec2 p) {
  hiRead();
  return screenOf(uVar < .5 ? hiDawn(p) : hiDunes(p));
}
