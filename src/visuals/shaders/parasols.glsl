// name: Parasols
// a: Beach rows
// b: Night stalls
// what: A wide beach at noon from a balcony: rows of plain and striped parasols, large at the lower left, specks along the shore, each with its round blue shade, towels, a plank way, a red ball, turquoise water; or a market square at dusk packed with square canopies lit from below, dim lanes, steam, one white canopy half open.
// follows: Each kind of sound opens and dyes its own parasols or lights its own canopies, and so does the piece where it lies; bands swell or light the rows. A hit runs over the parasols as colour, or flares a few lamps. A cue is a gust, or light, going away from you. Lows bring up the surf, a melody opens the white canopy, keys glint.
// own: 0 late sun at -1, night at 1; 1 black sand or black roofs at -1, red sand or snow on the roofs at 1; 2 a few at -1, larger and closer at 1; 3 from high above at -1, low over the tops at 1; 4 all white at -1, all bright and striped at 1; 5 tall at -1, nearly flat at 1.
// A soft step from a to b, either way round.
float ppT(float a, float b, float x) { float t = sat((x - a) / (b - a)); return t * t * (3.0 - 2.0 * t); }
vec3 ppRo, ppRd; // the eye and its ray: x along the rows
vec2 ppRt, ppFw; // across the picture and into it, on the ground
float ppPx, ppG, ppFew, ppMany, ppLate, ppNight, ppDark, ppPale, ppWhite, ppGay, ppTall, ppFlat, ppDown, ppLow;
vec3 ppSun; // towards the sun

// The hour: as it is, late, or at night.
vec3 ppHour(vec3 day, vec3 late, vec3 night) { return mix(mix(day, late, ppLate), night, ppNight); }
void ppEye(vec2 p, float high, float pitch, float f, float yaw) {
  vec3 d = normalize(vec3(p, f));
  d.yz = vec2(d.y * cos(pitch) - d.z * sin(pitch), d.y * sin(pitch) + d.z * cos(pitch));
  ppRt = vec2(cos(yaw), sin(yaw)); ppFw = vec2(-sin(yaw), cos(yaw));
  ppRd = vec3(ppRt * d.x + ppFw * d.z, d.y).xzy;
  ppRo = vec3(0.0, high, 0.0);
  ppPx = 1.0 / (f * uRes.y);
}
float ppKind(int k) { return sat((k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : uPhrase) * ppG); }
vec3 ppHold(vec3 k) { return k / max(max(k.r, max(k.g, k.b)), .08); }
// The piece over the ground.
vec4 ppMap(vec2 c) { c = (c - ppRo.xz) * mat2(ppRt, ppFw); return piece(vec2(.5 + c.x / (14.0 + 1.3 * max(c.y, 0.0)), 1.0 - c.y / 48.0)); }
// Where the ray goes by an upright line: aside, high, on.
vec3 ppBy(vec2 c) {
  float l = max(length(ppRd.xz), .02); vec2 e = ppRd.xz / l, v = c - ppRo.xz;
  float t = dot(v, e) / l;
  return vec3(v.x * e.y - v.y * e.x, ppRo.y + ppRd.y * t, t);
}
// How much of the pixel a post fills.
float ppPost(vec2 c, float thick, float high, float px) {
  vec3 b = ppBy(c);
  return sat(.5 + (thick - length(vec2(b.x, max(b.y - high + thick, 0.0)))) / px) * ppT(-px, 0.0, b.y);
}

// A cue's wave, from the front to the back.
float ppWave(vec2 c) { float w = dot(c - ppRo.xz, ppFw) - 8.0 - (1.0 - uCue) * 55.0; return exp(-w * w * .008); }
// The four cells round a place, and the ones near the eye first.
vec2 ppCell(int k) { return vec2(float(k & 1), float(k >> 1)); }
vec2 ppNear(int k) { return abs(step(ppRd.xz, vec2(0.0)) - ppCell(k)); }

// a: the beach
const float ppZ = 29.0; // how far off the water begins
const float ppC = 3.3; // from one parasol to the next
struct PpP { vec2 c; float R, hh, high, lit, hit; vec4 h; int k; };
vec4 ppH(vec2 id) { return vec4(hash22(id + 3.1), hash22(id + 41.7)); }
// The parasol of a cell.
PpP ppParasol(vec2 id) {
  PpP o; o.h = ppH(id);
  o.c = (id + .5 + .2 * (o.h.xy - .5)) * ppC;
  o.k = int(fract(o.h.x * 7.7 + o.h.w) * 6.4);
  vec4 m = ppMap(o.c);
  o.lit = sat((o.k < 4 ? .65 * ppKind(o.k) : 0.0) + .9 * m.a * ppG);
  float there = ppT(o.h.z - .04, o.h.z, .88 - .75 * ppFew + .2 * ppMany) * step(id.y, 5.5);
  if (mod(id.x + 2.0, 7.0) < .5) there = 0.0; // the plank way is left free
  float ring = length(o.c - vec2(.5, 7.5)) - (1.0 - uHits) * 16.0, hit = max(step(.8, o.h.w), exp(-ring * ring * .15));
  float open = min((o.k < 4 ? mix(.66, 1.0, o.lit) : .95) + hit * 1.4 * uHits * (1.0 - uHits), 1.12);
  o.R = 1.42 * (.86 + .22 * o.h.z) * (.5 + .5 * open) * (.97 + .09 * band(sat(id.y / 8.0)) * ppG) * (1.0 + .14 * ppMany) * there;
  o.hh = o.R * clamp(.36 + .5 * (1.0 - open) + .4 * ppTall - .22 * ppFlat, .12, .95);
  o.high = (2.25 - .1 * o.h.y) * mix(.3, 1.0, there);
  o.hit = hit * uHits;
  return o;
}
const vec3 ppDyes[6] = vec3[6](vec3(.1, .33, .66), vec3(.93, .33, .28), vec3(.97, .74, .2), vec3(.1, .62, .58), vec3(.96, .94, .88), vec3(.95, .55, .55));
vec3 ppBright(float x) { return pal(x, vec3(.6, .45, .42), vec3(.4, .38, .35), vec3(1.0), vec3(0.0, .25, .55)); }
vec3 ppDye(int k) { return ppDyes[clamp(k, 0, 5)]; }
// Lays a thing behind what is laid already.
void ppPut(inout vec4 pic, vec3 c, float cov) { pic.rgb += pic.a * cov * c; pic.a *= 1.0 - cov; }
// The cloth of a parasol, where the ray meets it.
void ppDome(inout vec4 pic, PpP o, vec3 sunC, vec3 skyC) {
  float wind = sin(uTime * .43 + o.c.x * .16 + o.c.y * .1) + .5 * sin(uTime * 1.1 + o.h.x * 40.0);
  vec2 lean = .3 * (o.h.xy - .5) + vec2(.03, .015) * wind + vec2(.42, .2) * 4.0 * uCue * (1.0 - uCue) * ppWave(o.c);
  vec3 C = vec3(o.c.x, o.high, o.c.y), n = normalize(vec3(lean.x, 1.0, lean.y));
  float Rs = (o.R * o.R + o.hh * o.hh) / (2.0 * o.hh);
  vec3 oc = ppRo - C - n * (o.hh - Rs);
  float b = dot(oc, ppRd), q2 = dot(oc, oc) - b * b, ds = Rs * Rs - q2, px = -b * ppPx;
  if (ds <= 0.0) return;
  vec3 X = ppRo - ppRd * (b + sqrt(ds)) - C;
  float up = dot(X, n), under = 0.0;
  if (up < 0.0) { X += ppRd * 2.0 * sqrt(ds); up = dot(X, n); under = 1.0; if (up < 0.0) return; }
  vec3 N = (X - n * (o.hh - Rs)) / Rs, fl = X - n * up;
  vec3 a1 = normalize(vec3(n.y, -n.x, 0.0)), a2 = cross(n, a1);
  float r = length(fl), ph = (atan(dot(fl, a2), dot(fl, a1) + 1e-5) / TAU + o.h.y) * 8.0, g = fract(ph) - .5, slope = max(length(cross(N, n)), .12);
  up -= o.hh * .17 * (1.0 - 4.0 * g * g);
  float cov = sat(.5 + min(up / slope, Rs - sqrt(max(q2, 0.0))) / px);
  vec3 rad = fl / max(r, 1e-4), tau = cross(rad, n);
  N = normalize(N + tau * g * (TAU / 8.0) * 1.8 * slope);
  float rd = (.5 - abs(g)) * TAU / 8.0 * r, s = r / o.R, w = px / o.R;
  // plain, in halves, rimmed, or ringed
  vec3 white = vec3(.97, .95, .89), dye = ppDye(o.k);
  vec4 m = ppMap(o.c);
  vec3 tint = m.a > .01 ? ppHold(m.rgb) : dye;
  if (o.k < 4) tint = mix(tint, ppHold(uKind[o.k]), .5);
  dye = mix(dye, tint * tint, .55 * o.lit);
  dye = mix(mix(dye, ppBright(o.h.z + .3 * o.h.x), .85 * ppGay), white, .9 * ppWhite);
  float turn = mod(floor(ph), 2.0) * 2.0 - 1.0, half_ = sat(.5 + turn * rd / px), kind = fract(o.h.w * 13.7 + o.h.y);
  float pat = kind < .42 ? 0.0 : kind < .7 ? half_ : kind < .85 ? ppT(.74 - w, .74 + w, s) : sat(.5 + sin(s * 21.0) / (21.0 * w + .02));
  pat = mix(pat, half_, ppGay);
  vec3 cloth = mix(dye, mix(o.k == 4 ? ppDye(int(o.h.z * 3.99)) : white, white, ppWhite), pat);
  cloth = mix(cloth, mix(ppHold(uKind[4]), vec3(1.0, .98, .85), .35), .75 * o.hit);
  float ndl = dot(N, ppSun);
  vec3 c = cloth * (sunC * (.22 + .78 * sat(ndl * 1.05)) + skyC * .34 * (.6 + .4 * N.y));
  c *= 1.0 - .2 * (1.0 - ppT(0.0, .03 + px, rd)) * ppT(.02, .1, s);
  c *= 1.0 - .16 * ppT(.03 + w, .02, (up / slope) / o.R - .11);  // the hem hangs
  c = mix(c, vec3(1.0, .98, .93) * (sunC + skyC * .3), ppT(.06 + w, .05, s));
  c += .25 * sunC * sat(uKeys) * pow(sat(ndl), 24.0);
  c *= 1.0 + .3 * uCue * ppWave(o.c) + .35 * o.hit;
  if (under > .5) c = cloth * (skyC * .6 + sunC * .35);
  ppPut(pic, c, cov);
}
// Lays the parasol of one cell.
void ppLay(inout vec4 pic, vec2 id, vec3 sunC, vec3 skyC) {
  vec3 M = ppRo - vec3((id + .5) * ppC, 2.35).xzy; float far = dot(M, ppRd), aside = M.x * ppRd.z - M.z * ppRd.x;
  if (pic.a < .01 || (dot(M, M) - far * far > 4.6 && aside * aside > .3 * dot(ppRd.xz, ppRd.xz))) return;
  PpP o = ppParasol(id);
  if (o.R < .08) return;
  ppDome(pic, o, sunC, skyC);
  ppPut(pic, vec3(.78, .77, .76) * (sunC * .6 + skyC * .4), ppPost(o.c, .035, o.high, -far * ppPx));
}
vec3 ppBeach(vec2 p) {
  float pitch = .44 + .9 * ppDown - .2 * ppLow, high = 7.6 + 9.0 * ppDown - 3.4 * ppLow;
  ppEye(p, high, pitch, .85, .7);
  ppRo.xz += ppFw * 14.0 * ppDown + vec2(0.0, 6.0) * ppDown - ppRt * 1.5;
  float turn = .12 * sin(TAU * uLoop) + .1 * sin(uTime * .013);
  vec2 sh = rot(turn) * vec2(.5, .16) * (1.0 + 1.7 * ppLate + .3 * ppNight);
  ppSun = normalize(vec3(-sh.x, 1.0, -sh.y));
  vec3 sunC = ppHour(vec3(1.0, .97, .9), vec3(1.0, .72, .45), vec3(.24, .34, .55));
  vec3 skyC = ppHour(vec3(.5, .66, .85), vec3(.55, .45, .6), vec3(.1, .16, .32));
  vec3 haze = ppHour(vec3(.83, .92, .94), vec3(1.0, .8, .62), vec3(.13, .2, .36));
  float el = ppRd.y / max(length(ppRd.xz), .05);
  // the sky, and one sail on the line
  vec3 sky = mix(haze, ppHour(vec3(.5, .75, .9), vec3(.65, .5, .62), vec3(.03, .06, .16)), ppT(0.0, .3, el));
  if (ppRd.y > -.02) {
    float far = .12 / (el + .05), bank = noise(vec2(p.x * 5.0 * far + uTime * .006, far * 5.0)) * .88;
    sky = mix(sky, mix(vec3(1.0), sunC, .8), .7 * ppT(.46, .8, bank) * ppT(.01, .06, el));
    float sx = mod(uTravel * .004 + 1.75, 3.0) - 1.5; vec2 sq = vec2(p.x - sx, el + .004);
    float sail = max(-sq.y, abs(sq.x - .12 * sq.y) * 4.0 + sq.y - .045);
    sky = mix(sky, vec3(1.0, .97, .92) * sunC, sat(.5 - sail * uRes.y * .5));
  }
  if (ppRd.y > -.0015) return sky;
  float t = -ppRo.y / ppRd.y; vec2 g = ppRo.xz + ppRd.xz * t;
  float px = t * ppPx, pz = px / max(-ppRd.y, .03), air = ppT(30.0, 180.0, t) * (.5 + .4 * uSpace);
  // the parasols, near ones first; then the ground
  vec4 pic = vec4(0.0, 0.0, 0.0, 1.0);
  vec2 gc = ppRo.xz + ppRd.xz * (2.1 - ppRo.y) / ppRd.y, id0;
  if (gc.y < 26.0) {
    id0 = floor(gc / ppC - .5);
    for (int k = 0; k < 4; k++) ppLay(pic, id0 + ppNear(k), sunC, skyC);
    if (pic.a < .01) return mix(pic.rgb, haze, air);
  }
  float shore = g.y - ppZ - 1.4 * sin(g.x * .09) - .6 * sin(g.x * .23 + 1.0);
  float n2 = noise(g * 2.3), fine = ppT(.25, .02, pz), thin = 1.0 / (1.0 + pz);
  float edge = shore - .5 + .8 * sin(uTime * .21 + .06 * g.x) + 1.6 * (noise(vec2(g.x * .35, uTime * .07)) - .5) + 1.4 * uLow * ppG;
  // the sea: over 0 is water
  vec3 sea = vec3(0.0), sand = vec3(0.0);
  if (edge > -1.2 - pz) {
    float far = max(shore, 0.0);
    sea = mix(vec3(.7, .9, .84), vec3(.22, .74, .74), ppT(0.0, 9.0, far));
    sea = mix(sea, vec3(.06, .52, .68), ppT(6.0, 30.0, far)); sea = mix(sea, vec3(.1, .36, .62), ppT(25.0, 90.0, far));
    float chop = noise(vec2(g.x * .12 + uTime * .05, g.y * .5 - uTime * .1)) - .5;
    sea += vec3(.03, .07, .07) * (chop + .5 * sin(far * 1.1 + 4.0 * chop + uTime * .3)) * ppT(.8, .1, px);
    // three breakers come in
    float ph = fract(uTravel * .04), foam = 0.0;
    if (far < 26.0) for (int k = 0; k < 3; k++) {
      float at = 8.0 * (float(k) + 1.0 - ph), d = far - at - 2.5 * (noise(vec2(g.x * .18 + float(k) * 7.0, 3.0)) - .5), wd = .2 + .5 * ppT(18.0, 2.0, at) + pz;
      if (abs(d) < wd) foam = max(foam, ppT(wd, 0.0, abs(d)) * ppT(.35, .6, noise(vec2(g.x * .25 + 3.0 * float(k), d * .6)) + .1) * ppT(24.0, 18.0, at) * ppT(0.0, 3.0, at));
    }
    foam = max(foam, ppT(.75 + pz, .1, abs(edge - .25 - .3 * mix(.5, n2, thin))) * mix(1.0, thin, .6));
    foam = max(foam, .5 * ppT(3.0, 0.0, edge) * ppT(.5, .75, noise(g * 1.3)));
    sea = mix(sea, vec3(.98, .99, .97), foam * .9) * mix(vec3(1.0), sunC * 1.1, .8);
    sea = mix(sea, haze, ppT(40.0, 320.0, far));
  }
  if (edge < 1.0) {
    float n1 = noise(g * .5);
    vec3 dry = mix(vec3(.95, .87, .7), mix(vec3(.2, .19, .2), vec3(.86, .5, .42), ppPale), max(ppDark, ppPale));
    sand = dry * (.95 + .08 * n1 - .06 * ppT(.55, .8, n2) * fine);
    sand = mix(sand, sand * vec3(.78, .73, .69), ppT(-4.0, -.6, shore + .6 * n1));
  }
  // shade, and what lies beside it
  vec2 tw = -ppSun.xz / ppSun.y * 2.2; id0 = floor((g - tw) / ppC - .5);
  float shade = 0.0;
  vec2 f0 = floor(g / ppC - .5);
  if (g.y < 24.0) {
    float way = abs(mod(floor(g.x / ppC) + 2.0, 7.0)) < .5 ? abs(fract(g.x / ppC) - .5) * ppC : 9.0;
    float plank = g.y / .28;
    sand = mix(sand, vec3(.76, .66, .54) * (.85 + .2 * hash11(floor(plank))) * (1.0 - .35 * ppT(.4, .5, abs(fract(plank) - .5)) * fine), ppT(.75 + px, .75, way) * ppT(22.5, 22.3, g.y));
    for (int j = 0; j < 4; j++) {
      vec2 id = id0 + ppCell(j);
      vec2 v = g - (id + .5) * ppC;
      float al = sat(dot(v, tw) / max(dot(tw, tw), 1e-3));
      if (length(v - tw) < 2.3 || length(v - tw * al) < .6) {
        PpP o = ppParasol(id);
        v = g - o.c;
        vec2 q = v - tw;
        float gg = fract((atan(q.y, q.x + 1e-5) / TAU + o.h.y) * 8.0) - .5, rr = o.R * (.9 + .4 * gg * gg);
        float under = max(sat(.5 + (rr - length(q)) / (pz * .7 + .2 - .18 * uTone)), sat(.5 + (.04 - length(v - tw * al)) / px));
        shade = max(shade, under * step(.08, o.R));
      }
      // a towel, sometimes with someone on it
      id = f0 + ppCell(j);
      vec4 h = ppH(id);
      float here = sat((.9 - .6 * ppFew - h.z) * 20.0);
      vec2 tq = g - (id + .5 + .2 * (h.xy - .5)) * ppC - vec2(1.25, -.5 - .5 * h.x);
      if (dot(tq, tq) < 1.2 && h.w < .62 && here > 0.0 && id.y < 6.0 && mod(id.x + 2.0, 7.0) > .5) {
        tq = rot(.9 + 1.2 * (h.y - .5)) * tq;
        vec3 tc = mix(ppDye(int(h.y * 5.0)), vec3(.97), .25 + .4 * step(.5, fract(tq.y * 2.2)) * step(.4, h.x));
        sand = mix(sand, tc, sat(.5 - max(abs(tq.x) - .42, abs(tq.y) - .95) / px) * here);
        if (h.w < .36) {
          float body = length(vec2(tq.x, max(abs(tq.y + .1) - .25, 0.0))) - .18;
          body = min(body, length(vec2(abs(tq.x) - .1, max(abs(tq.y - .5) - .35, 0.0))) - .07);
          body = min(body, length(tq - vec2(0.0, -.66)) - .13);
          sand = mix(sand, mix(vec3(.84, .6, .45), vec3(.62, .42, .3), h.x), sat(.5 - body / px) * here);
          sand = mix(sand, ppDye(int(h.x * 4.0)), sat(.5 - max(abs(tq.x) - .2, abs(tq.y - .16) - .09) / px) * here);
        }
      }
    }
  }
  shade *= .4 + .6 * ppT(1.5, .3, pz);
  vec3 shaded = mix(vec3(.47, .6, .93), vec3(.55, .42, .6), ppLate);
  sand *= mix(vec3(1.0), shaded, shade * (1.0 - .5 * ppNight)) * mix(vec3(1.0), sunC * 1.05, .9);
  // the red ball, left on the empty sand
  vec3 bc = vec3(-5.8, .7, 25.2), oc = ppRo - bc; float b = dot(oc, ppRd), bq = dot(oc, oc) - b * b, br = .7;
  vec2 bs = g - bc.xz + ppSun.xz / ppSun.y * br; sand *= mix(vec3(1.0), shaded, sat(.5 + (br - length(bs)) / pz));
  vec3 col = mix(sand, sea, ppT(-.12 - pz, .12, edge));
  if (bq < br * br + .2) {
    vec3 N = (oc - ppRd * (b + sqrt(max(br * br - bq, 0.0)))) / br;
    col = mix(col, vec3(.9, .13, .1) * (skyC * .75 + sunC * (.25 + sat(dot(N, ppSun)) * .85 + .3 * uMic)), sat(.5 + (br - sqrt(max(bq, 0.0))) / (-b * ppPx)));
  }
  col = pic.rgb + pic.a * col;
  return mix(col, haze, air);
}

// b: the market
const float ppS = 3.9;
struct PpS { vec2 c; float w, e, hh, lamp, turn; vec3 dye; vec4 h; };
PpS ppStall(vec2 id) {
  PpS o; o.h = vec4(hash22(id + 11.3), hash22(id + 71.9));
  o.c = (id + .5) * ppS;
  o.c.y += mod(id.y, 2.0) < .5 ? .22 : -.22; o.c.x -= .24 * (mod(id.x, 3.0) - 1.0); o.c += .24 * (o.h.zw - .5);
  int k = int(fract(o.h.x * 5.3 + o.h.y) * 4.9);
  vec4 m = ppMap(o.c);
  float lit = sat(.65 * (k < 4 ? ppKind(k) : .4 * uLevel) + .9 * m.a * ppG);
  vec3 base = k == 0 ? vec3(.1, .35, 1.0) : k == 1 ? vec3(1.0, .12, .2) : k == 2 ? vec3(1.0, .5, .05) : k == 3 ? vec3(.1, .8, .35) : vec3(1.0, .28, .12);
  vec3 tint = k < 4 ? ppHold(uKind[k]) : base;
  o.dye = mix(base, tint * tint, .12 + .28 * lit);
  o.dye = mix(mix(o.dye, ppBright(o.h.z), .8 * ppGay), vec3(1.0, .76, .5), .9 * ppWhite);
  o.lamp = (.3 + .5 * o.h.w) * ppT(-.15, .25, o.h.w) * (.97 + .06 * sin(uTime * .7 + o.h.y * 50.0)) + .75 * lit + .35 * band(sat(id.y / 16.0)) * ppG;
  o.lamp += 1.6 * uCue * ppWave(o.c) + 1.8 * uHits * step(.9, o.h.z);
  float there = ppT(o.h.x - .06, o.h.x, .97 - .62 * ppFew);
  o.w = 1.66 * there * (1.0 + .1 * ppMany); o.e = 2.15 + .25 * o.h.y; o.hh = there * (.85 + .35 * o.h.x) * (1.0 + 1.1 * ppTall - .65 * ppFlat);
  o.turn = .14 * (o.h.x - .5);
  vec2 d = id - vec2(1.0, 5.0);
  if (d == vec2(0.0)) { float op = .5 + .3 * uPhrase * ppG; o.w = 1.75 * op; o.hh = 2.2 - op; o.e = 2.0; o.dye = vec3(1.0, .95, .86); o.lamp = 2.6 + .8 * uPhrase + .6 * uMic; o.turn = .3; }
  else if (abs(d.x - .5) < 1.0 && abs(d.y + .5) < 1.0) { o.w = 0.0; o.lamp = 0.0; }
  return o;
}
void ppCanopy(inout vec4 pic, vec2 id, vec3 skyC) {
  vec3 M = ppRo - vec3((id + .5) * ppS, 2.6).xzy; float near = dot(M, ppRd);
  if (pic.a < .01 || dot(M, M) - near * near > 8.5) return;
  PpS o = ppStall(id);
  if (o.w < .05) return;
  mat2 R = rot(o.turn);
  vec3 a = ppRo - vec3(o.c.x, o.e, o.c.y), d = ppRd; a.xz = R * a.xz; d.xz = R * d.xz;
  d.xz += 2e-3 * step(abs(d.xz), vec2(1e-3));
  float skirt = .32, k = o.hh / o.w;
  // the sides, the hem, the slopes
  vec2 ti = (-o.w * sign(d.xz) - a.xz) / d.xz, to = (o.w * sign(d.xz) - a.xz) / d.xz;
  float tn = max(ti.x, ti.y), tf = min(min(to.x, to.y), (-skirt - a.y) / min(d.y, -.01));
  for (int i = 0; i < 4; i++) {
    float s = (i & 1) == 0 ? 1.0 : -1.0, along = s * (i < 2 ? a.x : a.z), run = s * (i < 2 ? d.x : d.z);
    float D = a.y - o.hh + k * along, v = d.y + k * run; if (abs(v) < 1e-3) v = -1e-3;
    float tt = -D / v;
    if (v < 0.0) tn = max(tn, tt); else tf = min(tf, tt);
  }
  // a bulb
  vec3 bu = a - vec3(o.w, -.2, -o.w - .12); float bt = -dot(bu, d), bd = length(bu + d * bt), bw = .05 + bt * ppPx;
  pic.rgb += pic.a * vec3(1.0, .7, .34) * (o.lamp + uKeys) * (2.5 * exp(-bd * bd / (bw * bw)) + .13 * max(exp(-bd * 5.0) - .02, 0.0)) * step(.35, o.h.w);
  if (tf <= tn) return;
  float px = tn * ppPx, cov = sat((tf - tn) / (2.2 * px));
  vec3 X = a + d * tn; vec2 q = X.xz / o.w, aq = abs(q);
  float m = max(aq.x, aq.y), s = aq.x > aq.y ? q.y : q.x;
  // the lamp hangs under the peak
  vec3 lp = vec3(.5 * (o.h.z - .5), .36 * o.hh, .5 * (o.h.w - .5)), v = X - lp; float l2 = dot(v, v);
  float stripe = sat(.5 + sin(s * o.w * 7.0) / (7.0 * px + .05)) * max(step(.6, o.h.y), ppGay);
  vec3 c;
  if (X.y > .002) {
    float fold = .85 + .3 * noise(vec2(s / max(m, .02) * 5.0 + o.h.x * 30.0 + (aq.x > aq.y ? 11.0 : 0.0), m * 2.0));
    float I = o.lamp * fold * .6 / pow(.22 + l2, 1.5 + .5 * uTone);
    vec3 cl = mix(o.dye, vec3(1.0, .86, .68), .75 * stripe);
    I *= 1.0 - .88 * ppDark;
    c = pow(cl, vec3(1.5 + 1.3 * m)) * I + vec3(1.0, .75, .42) * cl * .35 * I * I;
    c *= 1.0 - .6 * ppT(.05 + px, 0.0, abs(aq.x - aq.y) * o.w * .7) - .3 * ppT(.03 + px, 0.0, abs(m - .55) * o.w);
    c += (.12 + .3 * cl) * skyC * .3;
    c = mix(c, vec3(.7, .78, .9) * (skyC * 1.3 + o.lamp * .12 * o.dye), .85 * ppPale * ppT(.2, .5, noise(X.xz * 1.5 + o.h.xy * 20.0) + .3 * m));
  } else {
    float f = -X.y / skirt;
    c = mix(o.dye, vec3(1.0, .86, .68), .75 * stripe); c = c * c * o.lamp * (.12 + .16 * f) + skyC * .06;
  }
  ppPut(pic, c, cov);
}
// People in the lanes.
void ppPeople(inout vec3 col, vec3 L, vec3 skyC, float t) {
  float lane = floor((ppRo.z + ppRd.z * (.9 - ppRo.y) / ppRd.y) / (2.0 * ppS) + .5);
  for (int k = 0; k < 2; k++) {
    float off = uTravel * (k == 0 ? .35 : -.28), cell = 1.5, zl = lane * 2.0 * ppS + (float(k) - .5) * .7;
    float at = clamp((zl - ppRo.z) / (abs(ppRd.z) < .02 ? .02 : ppRd.z), (1.8 - ppRo.y) / ppRd.y, t);
    float i = floor((ppRo.x + ppRd.x * at - off) / cell);
    vec2 h = hash22(vec2(mod(i, 256.0), lane + 37.0 * float(k)));
    float who = ppT(h.x, h.x + .1, .75 - .5 * ppFew);
    if (who <= 0.0) continue;
    vec3 b = ppBy(vec2((i + .3 + .4 * h.y) * cell + off, zl));
    float tall = (1.45 + .2 * h.y) * who, y = b.y / tall, x = b.x - .03 * y * sin(uTravel * 2.2 + h.y * 40.0);
    float body = max(abs(x) - .24 * (1.0 - .75 * ppT(.62, .9, y)) * (1.0 - .25 * y), max(-b.y, b.y - tall * .86));
    body = min(body, length(vec2(x, b.y - tall * .93)) - .125 * who);
    vec3 coat = mix(vec3(.12, .1, .12), vec3(.62, .25 + .35 * h.y, .3), h.x * 1.3);
    col = mix(col, coat * (L * (.26 - .16 * y) + skyC * .35), who * sat(.5 - body / (at * ppPx)));
  }
}
vec3 ppMarket(vec2 p) {
  float pitch = .36 + .95 * ppDown - .14 * ppLow, high = 11.0 + 6.0 * ppDown - 5.4 * ppLow;
  ppEye(p, high, pitch, .8, .45);
  ppRo.xz += ppFw * 16.0 * ppDown + ppRt * 1.4;
  vec3 top = ppHour(vec3(.004, .018, .085), vec3(.1, .17, .4), vec3(.002, .004, .014));
  vec3 low = ppHour(vec3(.04, .085, .21), vec3(.8, .36, .16), vec3(.012, .016, .04));
  vec3 glow = ppHour(vec3(.2, .075, .02), vec3(.9, .4, .1), vec3(.03, .012, .004));
  vec3 skyC = top * 1.2 + low * .5;
  vec3 col;
  // houses at the far side of the square, their shops lit
  float tw = 62.0 / max(dot(ppRd.xz, ppFw), .05), wy = ppRo.y + ppRd.y * tw, foot = .8 * tan(pitch - atan(ppRo.y / 62.0));
  float wx = 62.0 * p.x / (foot * sin(pitch) + .8 * cos(pitch)); // the walls stand upright
  float t = ppRd.y < -.002 ? -ppRo.y / ppRd.y : 1e4;
  if (t > tw) {
    float el = ppRd.y / max(length(ppRd.xz), .05);
    col = mix(low, top, ppT(0.0, .26, el)) + glow * exp(-max(el, 0.0) * 15.0);
    col *= .85 + .3 * noise(vec2(p.x * 3.0, el * 24.0));
    float b = floor(wx / 7.0), bh = 7.0 + 10.0 * hash11(b + 5.0) * hash11(b + 2.0) + 2.5 * step(.6, hash11(floor(wx / 2.6 + .4)));
    vec2 wv = vec2(wx / 1.3, wy / 2.1), wf = abs(fract(wv) - .5); float ph = tw * ppPx * .6;
    float win = ppT(.16 + ph, .16 - ph, wf.x) * ppT(.28 + ph, .28 - ph, wf.y) * ppT(.72, .95, hash21(floor(wv) + 3.0)) * step(4.2, wy);
    float shop = ppT(2.9, 2.5, wy) * ppT(.44, .38, abs(fract(wx / 2.3) - .5)) * ppT(.35, 1.2, hash11(floor(wx / 2.3) + 70.0));
    vec3 wall = low * .05 + top * .25 + vec3(1.0, .5, .17) * (.4 * win + .5 * shop * (1.0 + .5 * uLow));
    col = mix(col, wall, sat(.5 + (bh - wy) / (tw * ppPx)));
  } else {
    vec2 g = ppRo.xz + ppRd.xz * t; float px = t * ppPx;
    vec4 pic = vec4(0.0, 0.0, 0.0, 1.0);
    float tc = (2.5 - ppRo.y) / ppRd.y; vec2 id0 = floor((ppRo.xz + ppRd.xz * tc) / ppS - .5);
    for (int k = 0; k < 4; k++) ppCanopy(pic, id0 + ppNear(k), skyC);
    col = vec3(0.0);
    if (pic.a > .01) {
      vec3 gr = mix(vec3(.075, .06, .06), vec3(.5, .53, .6), ppPale), L = skyC * (.7 + 2.0 * ppFew);
      id0 = floor(g / ppS - .5);
      for (int j = 0; j < 4; j++) {
        PpS o = ppStall(id0 + ppCell(j));
        vec2 q = rot(o.turn) * (g - o.c);
        float bx = max(abs(q.x), abs(q.y)), out_ = max(bx - o.w, 0.0);
        vec3 warm = mix(o.dye, vec3(1.0, .68, .34), .55);
        L += warm * o.lamp * (.22 * exp(-out_ * 2.0) + 2.2 * ppT(1.7, .2, bx)) * (1.0 + ppDark) * step(.05, o.w);
      }
      col = gr * L;
      ppPeople(col, L, skyC, t);
    }
    col = pic.rgb + pic.a * col;
    col = mix(col, low * .25 + vec3(.05, .025, .01), (.35 + .5 * uSpace) * ppT(25.0, 80.0, t));
  }
  // steam over three of the pitches
  for (int k = 0; k < 3; k++) {
    vec2 c = k == 0 ? vec2(-7.4, 21.5) : k == 1 ? vec2(-3.0, 37.0) : vec2(5.6, 29.5);
    vec3 by = ppBy(c);
    float y = by.y - 2.6, off = by.x, wide = .35 + .3 * max(y, 0.0);
    if (by.z < 0.0 || y < 0.0 || y > 8.0 || abs(off) > 1.5 + .6 * y) continue;
    off += .25 * y * sin(.5 * y - uTime * .3 + float(k) * 2.0) + .22 * y;
    float puff = noise(vec2(off * 1.3 + float(k) * 9.0, y * .8 - uTime * .55)) * .75 + noise(vec2(off, y - uTime * .4) * 3.0) * .25;
    float a = exp(-off * off / (wide * wide)) * ppT(.15, .75, puff) * ppT(0.0, .8, y) * ppT(8.0, 1.5, y) * (.55 + .3 * ppKind(2));
    col = mix(col, skyC * 1.6 + vec3(.6, .36, .17) * exp(-y * .5) * (.6 + .6 * uLevel), a);
  }
  return screenOf(col * 1.5);
}
void ppOwn(float o, out float a, out float b) { a = sat(-o); b = sat(o); }
vec3 render(vec2 p) {
  ppG = .6 + .9 * uEnergy;
  ppOwn(uOwn[0], ppLate, ppNight); ppOwn(uOwn[1], ppDark, ppPale); ppOwn(uOwn[2], ppFew, ppMany);
  ppOwn(uOwn[3], ppDown, ppLow); ppOwn(uOwn[4], ppWhite, ppGay); ppOwn(uOwn[5], ppTall, ppFlat);
  return uVar < .5 ? ppBeach(p) : ppMarket(p);
}
