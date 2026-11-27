// name: Fizz
// a: Noon table
// b: Glass floor
// what: A tall glass of sparkling water on a white garden table in hard sun: ice, a slice of lemon, chains of bubbles, drops jumping over the rim, a blue shadow full of a net of light, a straw hat and garden behind; or the view up from the floor of the glass: the bright surface, ice and lemon overhead, bubbles leaving.
// follows: Each band feeds its own chain: louder is bigger, brighter, closer set. Pad is the light in the water, drone the garden's colour, texture the jumping drops or the outer chains, phrase the lemon. The piece tints the net of light or the wall. A hit frees a cluster and a wave of light, a cue ducks an ice block, keys light the drops or the hoop.
// own: 0 blue night with lamps at -1, low gold sun at 1; 1 red drink, blood orange at -1, amber tea, lime at 1; 2 low wide glass, no ice at -1, slim tall glass at 1; 3 hazy day, soft shade, still water at -1, long shadow, fierce bubbles at 1; 4 close up at -1, farther off at 1; 5 by the sea at -1, autumn at 1; 6 no garden, only a light behind the glass and a polished black table, or the wall all dark and the bubbles rimmed with light, at -1, a checked cloth, or a cut glass seen from within, at 1; 7 berries in place of the slice at -1, a row of glasses each of another drink, or slices all over the top, at 1
const float FZ_EYE = 1., FZ_F = 3., FZ_FOOT = -.31, FZ_BASE = .065; // eye height, lens, where the glass stands, its thick foot
#define FZ_DARK max(-uOwn[6], .0)
#define FZ_CUT max(uOwn[6], .0)
#define FZ_BERRY max(-uOwn[7], .0)
#define FZ_AWAY min(4. * (abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4])), 1.)
#define FZ_ROW max(uOwn[7], .0)
#define FZ_STEP mix(2.6, .62 * (1. - .28 * max(uOwn[2], .0) + .25 * max(-uOwn[2], .0)), FZ_ROW)
const vec2 FZ_UP = vec2(.6, .8);
vec3 fzSun, fzKey, fzFill, fzAll, fzLeaf, fzWarm, fzTint, fzPulp, fzRind, fzLamp;
float fzS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float fzRoom, fzPx, fzNight, fzGold, fzHaze, fzHard, fzGx, fzTall, fzFull, fzBroad, fzIce, fzFizz, fzLight, fzBob;

// The light and the materials, from the hour, the drink and the place.
void fzSet() {
 fzNight = max(-uOwn[0], .0); fzGold = max(uOwn[0], .0);
 fzFizz = uOwn[3]; fzHaze = max(-fzFizz, .0); fzHard = max(fzFizz, .0); fzIce = uOwn[2];
 fzSun = mix(vec3(.96, .87, .7), vec3(1., .5, .18), fzGold);
 fzFill = mix(vec3(.13, .205, .36), vec3(.17, .12, .24), fzGold);
 fzWarm = mix(vec3(1.), vec3(1.2, .69, .39), fzGold);
 fzFill += fzSun * .3 * fzHaze; fzSun *= 1. - .55 * fzHaze;
 fzSun *= 1. - .45 * FZ_DARK; fzFill *= 1. - .75 * FZ_DARK;
 fzSun = mix(fzSun, vec3(.05, .085, .18), fzNight);
 fzFill = mix(fzFill, vec3(.018, .028, .07), fzNight);
 fzAll = fzSun + fzFill; fzLamp = vec3(1., .6, .26) * fzNight; fzKey = fzSun + fzLamp;
 float red = max(-uOwn[1], .0), tea = max(uOwn[1], .0);
 fzTint = mix(mix(vec3(.86, .965, .95), vec3(.93, .3, .34), red), vec3(.95, .58, .17), tea);
 fzPulp = mix(mix(vec3(1., .8, .14), vec3(.95, .16, .08), red), vec3(.5, .78, .14), tea);
 fzRind = mix(fzPulp * vec3(.95, .82, .25), vec3(.12, .4, .05), tea);
 fzLeaf = mix(vec3(.17, .36, .06), vec3(.6, .15, .03), max(uOwn[5], .0));
 fzLeaf = mix(fzLeaf, vec3(.02, .2, .5), max(-uOwn[5], .0));
 fzLeaf = mix(fzLeaf, uKind[0] * uKind[0] * .6, .4 * uDrone);
 fzLight = .6 + (.75 * uPad + .25 * uLevel + .4 * uMic) * (.6 + uEnergy);
 fzRoom = fzS(.3, .8, .5 * uRes.x / uRes.y); // how wide the picture is
 fzBob = 4. * uCue * (1. - uCue);
 float slim = max(fzIce, .0), low = max(-fzIce, .0);
 fzTall = .69 + .06 * slim - .21 * low; fzFull = fzTall * .79; fzBroad = 1. - .28 * slim + .25 * low;
}
// What stands in glass k of a row.
void fzDrink(float k) {
 float red = max(-uOwn[1], .0), tea = max(uOwn[1], .0), m = step(.5, abs(k));
 vec3 d = uKind[int(mod(k + 10., 5.))]; d = d / max(max(d.r, max(d.g, d.b)), .2); d *= d * d;
 fzTint = mix(mix(mix(vec3(.86, .965, .95), vec3(.93, .3, .34), red), vec3(.95, .58, .17), tea), vec3(.08) + .9 * d, .85 * m);
 fzPulp = mix(mix(mix(vec3(1., .8, .14), vec3(.95, .16, .08), red), vec3(.5, .78, .14), tea), vec3(.1) + .85 * d, .8 * m);
 fzRind = mix(mix(fzPulp * vec3(.95, .82, .25), vec3(.12, .4, .05), tea), fzPulp * .75, m);
 fzFull = fzTall * (.79 - .16 * m * hash11(k + 7.3));
}
// A round berry over what is behind: q in its radii.
vec4 fzBerry(vec2 q, float aa, float h) {
 float r = length(q), z = sqrt(max(1. - r * r, .0));
 vec2 g = q - vec2(.3, .42);
 vec3 b = mix(uKind[4], uKind[1], h); b *= b;
 vec3 c = b * (fzFill * 1.2 + fzSun * (.12 + .9 * sat(.55 * q.x + .7 * q.y + .25 * z)) + fzLamp * .3);
 c += b * fzAll * .35 * fzS(.5, 1., -.6 * q.x - .6 * q.y) + fzAll * .7 * exp(-dot(g, g) * 22.);
 return vec4(c, fzS(1. + aa, 1. - aa, r));
}
vec3 fzDye(float k) { return mix(vec3(1.), fzTint, k); }   // the drink's colour, so thick
// The garden out of focus: lawn, hedge and, where it is seen straight, discs of light; or the sea.
vec3 fzGarden(vec2 q, bool all) {
 float n = noise(q * vec2(3.2, 4.) + 4.);
 float hedge = fzS(.17, .36, q.y + .12 * (n - .5)), air = .0, lamp = .0;
 vec3 c = mix(mix(fzLeaf, vec3(.6, .68, .1), .45), fzLeaf * (.1 + 1.1 * n * n), hedge);
 if (all) for (int k = 0; k < 2; k++) {
  float fk = float(k);
  vec2 g = rot(.5 + .9 * fk) * (q + vec2(.004 * sin(uTime * .11 + fk), .0)) / (.15 - .05 * fk) + fk * 3.7, h = hash22(floor(g) + 3. + 9. * fk);
  float r = .15 + .15 * h.x, d = length(fract(g) - .5 - (h - .5) * (.9 - 2. * r));
  float disc = fzS(r + .02, r - .06, d) * fzS(.35, .9, h.y);
  air += disc * (.3 + .7 * h.x); lamp += disc * step(.72, h.y);
 }
 air *= fzS(.35, .65, n + .08);
 c += (fzLeaf * vec3(2.4, 1.9, 1.2) + vec3(.16, .15, .04)) * air * hedge * (.6 + .35 * uLevel);
 vec3 sea = mix(vec3(.66, .5, .26), vec3(.03, .3, .38), fzS(.19, .24, q.y));
 sea = mix(sea, vec3(.55, .74, .86) - .6 * (q.y - .36), fzS(.35, .365, q.y));
 c = mix(c, sea, max(-uOwn[5], .0));
 c = mix(c, vec3(.6, .64, .64), .65 * fzHaze * fzS(.1, .35, q.y));
 c *= fzWarm;
 c = mix(c, c * vec3(.035, .06, .14), fzNight) + fzLamp * lamp * hedge * .7;
 if (uOwn[6] < .0) { vec2 d = q - vec2(fzGx, .05); c = mix(c, vec3(.006, .006, .008) + fzKey * fzTint * (.6 * exp(-dot(d, d) * 11.) + .025 * exp(-dot(d, d) * 1.5)) * (.5 + .7 * fzLight), FZ_DARK); }
 return c;
}
// What stands behind the glass: garden, white table, straw hat. fzTab is how much is table, fzW the place on it.
float fzTab; vec2 fzW;
vec3 fzBack(vec2 q, bool all) {
 float s = max((FZ_EYE - q.y) / (FZ_EYE - FZ_FOOT), .2);
 fzW = vec2(q.x / s, FZ_F * (1. / s - 1.));
 fzTab = fzS(.05, -.05, length(fzW - vec2(.25, .0)) - 2.05);
 vec3 c = vec3(.0);
 if (fzTab < 1.) c = fzGarden(q, all);
 if (fzTab > .0) {
  float px = fzPx * FZ_F / (s * s * 1.3) + .016 * abs(fzW.y);
  vec2 b = rot(.42) * fzW;
  float gap = fzS(.006 + px, .003, abs(fract(b.y / .46 + .3) - .5) * .46) * .35 * fzS(.05, .006, px);
  vec3 top = vec3(.94, .93, .9);
  if (uOwn[6] > .0) { // a checked cloth, with a thin line in it
   vec2 k = abs(fract(b / .4 + .13) - .5), e = vec2(.012 + px), s1 = smoothstep(.25 - e * 2.5, .25 + e * 2.5, k), s2 = 1. - smoothstep(vec2(.02), .03 + e * 2.5, k);
   vec3 d1 = mix(vec3(1.), uKind[1] * .9, .62), d2 = mix(vec3(1.), uKind[3] * .9, .6);
   float thread = .96 + .06 * sin(b.x * 700.) * sin(b.y * 700.) * fzS(.004, .001, px);
   top = mix(top, top * mix(vec3(1.), d1, s1.x) * mix(vec3(1.), d1, s1.y) * mix(vec3(1.), d2, max(s2.x, s2.y) * .6) * thread, FZ_CUT); gap *= 1. - FZ_CUT;
  }
  top *= 1. - .965 * FZ_DARK;
  c = mix(c, top * fzAll * (1. - gap), fzTab);
  if (uOwn[6] < .0) { // polished black: the light behind the glass lies on it
   float gx = (q.x - fzGx) / (.24 * fzBroad), gy = FZ_FOOT - q.y;
   c += FZ_DARK * fzTab * fzKey * fzTint * (.3 * exp(-gx * gx * 1.4) * exp(-4. * max(gy, .0)) * fzS(-.1, .02, gy) + .03 * exp(-gx * gx * .2)) * (.5 + .7 * fzLight);
  }
 }
 vec2 h = q - vec2(-.47 - 2. * max(FZ_ROW, max(FZ_DARK, FZ_BERRY)), .085);
 if (!all || dot(h, h) > .16) return c;
 float sh = length((h + vec2(.1, .035)) / vec2(.27, .062)), soft = .08 + .3 * fzHaze;
 c *= mix(vec3(1.), fzFill / fzAll, .85 * fzS(1. + soft, 1. - soft, sh) * fzTab);
 float brim = length(h / vec2(.235, .072)), up = h.y - .012, hx = h.x / .118;
 float crown = up > .0 ? pow(pow(abs(hx), 3.) + pow(up / .118, 3.), .3333) : length(vec2(hx, up / .036));
 vec3 straw = vec3(.9, .6, .22) * (1. + .06 * sin(brim * 60.));
 float dim = fzS(1.1, .8, length((h + vec2(.085, -.012)) / vec2(.135, .034)));
 c = mix(c, straw * (fzFill + fzSun * (1. - dim) * (.8 + h.x)), fzS(1.06, .95, brim));
 vec3 body = straw * (fzFill + fzSun * fzS(-.75, .5, hx + 13.5 * up - .2));
 float low = up + .036 * sqrt(max(1. - hx * hx, .0)); // above the foot of the crown
 body = mix(body, vec3(.05, .09, .2) * (fzFill + fzSun * fzS(-1., .8, hx)), fzS(.05, .04, low));
 return mix(c, body, fzS(1.06, .94, crown));
}
// A net of light: where two drifting fields are equal.
float fzNet(vec2 q, float t, float sharp) {
 float a = noise(q + vec2(t * .16, t * .09)), b = noise(q * 1.37 - vec2(t * .11, -t * .13) + 5.), c = sat(1. - abs(a - b) * sharp);
 return c * c * c;
}
float fzWide(float y) { return mix(.195, .265, sat(y / fzTall)) * fzBroad; }
// Sun and shade on the table: the shadow of the glass, and what the water makes of the light in it.
vec3 fzShade(vec2 w, float px) {
 vec2 d = w - vec2(fzGx, .0), k = vec2(-1.25 - .45 * fzHard, -.06 - .16 * fzHard);
 float k2 = dot(k, k), y = dot(d, k) / k2, yc = clamp(y, .0, fzTall), R = fzWide(yc);
 float soft = .003 + px + (.028 - .02 * uTone + .12 * fzHaze) * yc;
 float inside = fzS(soft, -soft, length(d - k * yc) - R);
 if (inside <= .0) return vec3(1.);
 float v = dot(d, vec2(-k.y, k.x)) / sqrt(k2) / R, av = abs(v), t = uTime;
 float wet = fzS(fzFull + .02, fzFull - .02, y + .06 * v * v);
 // dark edges, two folds of gathered sun that meet, and a beam beyond
 float L = mix(.66 - .45 * fzS(.75, 1., av), .1 + .2 * (1. - av), wet);
 float fold = .8 * pow(sat(1. - y / .34), 1.4), fd = av - fold;
 float beam = (exp(-fd * fd * 700.) + .5 * fzS(.02, -.02, fd) * exp(fd * 5.)) * fzS(-.1, .06, y);
 beam += exp(-v * v * 34.) * fzS(.22, .36, y) * .75;
 vec2 q = vec2(y * 9., v * 2.6) + .35 * vec2(sin(v * 4. + t * .21), sin(y * 13. - t * .26));
 float net = (fzNet(q, t, 4.2) * .8 + fzNet(q * 2.1 + 7., t * 1.2, 4.6) * .5) * fzS(1., .55, av);
 float hit = y - .75 + .6 * uHits, cue = y - .6 + .5 * uCue;
 float wave = 1.2 * exp(-hit * hit * 40.) * uHits + .8 * exp(-cue * cue * 30.) * uCue;
 vec3 li = vec3(L) + wet * fzTint * (beam * 1.1 + net * 1.5) * (fzLight * (.85 + .15 * sin(t * .37)) + 2.5 * wave) + wave * .8;
 float fr = length(vec2((y - .43 * fzTall) / .135, (v + .12) / .62)); // the slice of fruit stains it
 li = mix(li, li * (fzPulp * 1.25) + fzPulp * fzPulp * (.22 + .5 * uPhrase), fzS(1.15, .75, fr + .25 * (net - .3)) * wet * .9);
 vec4 pc = piece(vec2(sat(y / fzTall), sat(.5 + .45 * v)));
 li += pc.rgb * pc.rgb * (.5 + 1.8 * net + .8 * beam) * wet * (.5 + .9 * uEnergy);
 float ring = abs(length(d - k * fzTall) - fzWide(fzTall)); // the rim
 li += .3 * fzS(.016 + px, .004, ring) - .3 * fzS(.03 + px, .01, abs(ring - .028)) * (1. - wet);
 return mix(vec3(1.), li + fzLamp * wet * (beam + net) * 5., inside * (1. - .45 * fzHaze));
}
// A slice of fruit: q in radii. Its colour, and how much of it is there.
vec4 fzSlice(vec2 q, float aa) {
 float r = length(q);
 if (r > 1.05) return vec4(.0);
 float seg = atan(q.y, q.x + 1e-5) / TAU * 9. + .2, sf = abs(fract(seg) - .5), wall = (.5 - sf) * .7 * r;
 float fibre = noise(vec2(seg * 15., r * 6.));
 float flesh = fzS(.012, .045, wall) * fzS(.86, .81, r + .05 * fzS(.34, .5, sf)) * fzS(.07, .12, r);
 vec3 c = mix(mix(vec3(.97, .93, .74), fzPulp, .22), fzPulp * (.66 + .62 * fibre), flesh);
 return vec4(mix(c, fzRind, fzS(.91, .945, r)), fzS(1. + aa, 1. - aa, r));
}
// What a chain's band feeds it: every other bubble first, then those between.
float fzFed(float id, float lv) { return mod(id, 2.) < .5 ? fzS(-.1, .12, lv + .3 * fzFizz) : fzS(.06, .6, lv + .5 * fzFizz); }
// Lays a clear bubble over what is behind: q from its middle, L towards the light.
vec3 fzBubble(vec3 c, vec2 q, float size, float bright, vec2 L, vec3 hue) {
 if (size < .0007) return c;
 q /= size;
 float aa = 1.3 * fzPx / size, r = length(q), m = fzS(1. + aa, 1. - aa, r);
 if (m <= .0) return c;
 if (r > 1.) q /= r;
 r = min(r, 1.);
 float to = dot(q, L);
 float wall = fzS(.45, .95, r);
 vec3 b = c * (1.06 - wall * (.28 + .6 * (1. - fzS(-.5, .75, to))));
 float k = max(hue.r, max(hue.g, hue.b));
 b = mix(b, hue / max(k, .01), min(.4 * k, .6) * (1. - r * r));
 b += fzAll * bright * .4 * fzS(.55, .9, r) * fzS(.2, .85, to);
 vec2 g = q - L * .5;
 if (uOwn[6] < .0) b += FZ_DARK * vec3(.95, .9, .8) * bright * (.1 * wall + .5 * fzS(.6, .97, r) * fzS(-.9, .7, to));
 return mix(c, b + (fzSun + .2) * exp(-dot(g, g) * 22.) * bright * 1.4, m / max(1., aa));
}
// A hit: a cluster set free, going from one place to another.
vec3 fzBurst(vec3 c, vec2 q, vec2 from, vec2 to, float wide, vec2 L) {
 if (uHits > .01) for (int i = 0; i < 12; i++) {
  float h1 = hash11(float(i) + 41.), h2 = hash11(float(i) * 3.7 + 9.), go = 1. - uHits, rb = wide * (.05 + .08 * h2 * h1) * fzS(.0, .25, uHits);
  vec2 at = mix(from, to, go * (.4 + .6 * h2)) + wide * vec2(h1 - .5, h2 - .5);
  c = fzBubble(c, q - at, rb, 1.3, L, uKind[4] * 1.8);
 }
 return c;
}
const vec3 fzAt[3] = vec3[3](vec3(-.115, -.045, .02), vec3(.052, -.03, -.05), vec3(.01, -.075, .13));
float fzEdge(vec3 q) { q = abs(q); return max(min(q.x, q.y), min(max(q.x, q.y), q.z)); } // near to an edge of a block
vec3 fzNoon(vec2 p) {
 float t = uTime, zoom = .93 * (1. + .43 * uOwn[4]) * (.985 + .03 * uSpace);
 fzGx = mix(.03, .46, fzRoom);
 vec2 about = vec2(fzGx - .1, .06 - .12 * max(-uOwn[4], .0));
 p = about + (p - about) * zoom;
 fzPx = zoom / uRes.y;
 float gx0 = fzGx;
 if (uOwn[7] > .0) { float id = clamp(floor((p.x - gx0) / FZ_STEP + .5), -5., 3.); fzDrink(id); fzGx = gx0 + id * FZ_STEP; }
 vec2 g = p - vec2(fzGx, FZ_FOOT);
 float R = fzWide(g.y), u = g.x / R, aa = fzPx * 1.4;
 vec3 col = fzBack(p, true);
 if (fzTab > .0) {
  float px2 = fzPx * 2.6 / (FZ_EYE - p.y), foot = length(fzW - vec2(fzGx, .0));
  vec3 shade = vec3(1.);
  if (uOwn[7] <= .0) shade = fzShade(fzW, px2);
  else { // each glass of the row throws its own
   float was = fzGx, i0 = floor((fzW.x - gx0) / FZ_STEP + .5);
   for (float j = .0; j < 3.; j++) { float id = i0 + j; if (id < -5.5 || id > 3.5) continue; fzDrink(id); fzGx = gx0 + id * FZ_STEP; foot = min(foot, length(fzW - vec2(fzGx, .0))); shade *= fzShade(fzW, px2); }
   fzGx = was; fzDrink(clamp(floor((p.x - gx0) / FZ_STEP + .5), -5., 3.));
  }
  if (uOwn[6] < .0) shade = mix(shade, vec3(1.) + max(shade - 1., .0) * 4., FZ_DARK);
  col *= mix(vec3(1.), (fzFill + fzSun * shade) / fzAll, fzTab);
  col *= 1. - .55 * fzS(1.12, .95, foot / (.215 * fzBroad)); // where the foot stands
 }
 float lean = (FZ_EYE - p.y) / FZ_F, bow = sqrt(max(1. - u * u, .0)) * R * lean;
 float yf = g.y + bow, yb = g.y - bow; // the height on the near wall and the far
 float body = fzS(-aa, aa, (1. - abs(u)) * R) * fzS(-aa, aa, yf) * fzS(aa, -aa, yb - fzTall);
 if (body > .0) {
  float cu = clamp(u, -.999, .999), thick = sqrt(1. - cu * cu);
  float full = fzFull + .007 * sin(g.x * 23. + t * .7) * (.25 + .5 * uLow) * (1. + 2. * fzBob);
  float wet = fzS(aa, -aa, yf - full);
  vec3 c = col * (1. - .5 * fzS(.88, 1., abs(cu)));
  if (yf < full + aa) { // through the water what is behind is turned about
   float turned = 2. * (asin(cu) - asin(cu / 1.34));
   vec3 thru = fzBack(vec2(p.x - .8 * tan(clamp(turned, -1.25, 1.25)), p.y + .1 + .1 * g.y), false) * pow(fzTint, vec3(.4 + 1.5 * thick));
   thru *= mix(vec3(1.), vec3(.74, .9, .93), thick);
   thru += fzAll * fzTint * (.05 + .1 * fzLight * fzS(.0, .6, g.y)) * thick;
   c = mix(c, mix(thru, fzLeaf * .1 * fzAll, .9 * fzS(.86, 1., abs(cu))), wet);
  } else { // the top of the water
   float rip = noise(vec2(g.x * 16. + t * .3, (g.y - full) * 55. - t * .2));
   vec3 top = mix(fzBack(p - vec2(.0, .1), false), fzAll * vec3(.8, .92, 1.), .35 + .3 * rip) * fzTint;
   c = mix(c, top + fzAll * .5 * fzS(.55, .9, rip + .2 * uLevel), fzS(aa, -aa, yb - full));
  }
  float ft = yf / FZ_BASE, foot = fzS(1. + aa / FZ_BASE, 1. - aa / FZ_BASE, ft);
  vec3 heavy = mix(fzLeaf * .2 + fzFill * .25, fzAll * .95, fzS(-.3, .8, sin(ft * 9. + 3. * thick + 1.5 * u)) * (.7 - .3 * u));
  c = mix(c, heavy * fzDye(.6), foot * .85) + fzAll * .22 * fzS(.012, .0, abs(yb - FZ_BASE)) * (1. - foot);
  // in the water things look wider than they are
  float xm = g.x * mix(1., .78, wet), fs = min(1., fzTall / .6) * min(1., fzBroad);
  vec2 lq = rot(-.35 + .05 * sin(t * .13)) * (vec2(xm, g.y) - vec2(-.035, .43 * fzTall + .006 * sin(t * .23))) / (.129 * fs);
  lq.x *= 1.14;
  vec4 le = fzSlice(lq, fzPx * 9.);
  le.rgb *= (fzAll * (.85 + .2 * lq.x) + fzLamp * .2) * (1. + .3 * uPhrase);
  if (uOwn[7] < .0) { lq /= max(1. - FZ_BERRY, .02); le = fzSlice(lq, fzPx * 9.); le.a *= 1. - step(.97, FZ_BERRY); le.rgb *= fzAll * (.85 + .2 * lq.x) * (1. + .3 * uPhrase); }
  c = mix(c, fzRind * fzAll * .55, fzS(1.01, .99, length(lq - vec2(.05, -.07))) * wet * (1. - step(.97, FZ_BERRY)));
  c = mix(c, le.rgb, le.a * wet * .96);
  if (uOwn[7] < .0) for (int i = 0; i < 16; i++) { // berries, some sunk and some riding up
   float fi = float(i), h1 = hash11(fi + 2.2), h2 = hash11(fi * 1.7 + 11.), rb = (.034 + .022 * h2) * FZ_BERRY;
   vec2 at = vec2((h1 - .5) * 1.5 * fzBroad * .19, i < 7 ? .1 + .07 * h2 + .05 * fi / 7. : fzFull * (.45 + .5 * h2) + .012 * sin(t * (.3 + .2 * h1) + fi));
   vec4 be = fzBerry((vec2(xm, g.y) - at) / max(rb, 1e-3), fzPx * 1.3 / max(rb, 1e-3), h2);
   be.rgb *= 1. + .45 * uPhrase * step(.5, h1);
   c = mix(c, be.rgb, be.a * wet * .94);
  }
  for (int i = 0; i < 3; i++) {
   float fi = float(i), size = .08 * min(1., fzBroad * 1.1) * fzS(-.8, .0, fzIce);
   vec3 at = fzAt[i] * vec3(fzBroad, 1., 1.);
   at.y += fzFull + .006 * sin(t * .5 + fi * 2.) - (i == 1 ? .09 : .012) * fzBob;
   vec3 ro = vec3(xm, g.y + lean, -1.) - at, rd = vec3(.0, -lean, 1.);
   if (size < .004 || length(ro.xy - vec2(.0, lean * (1. + at.z))) > size * 1.85) continue;
   float ya = fi * 1.9 + .5 + .1 * sin(t * .11 + fi), xa = .35 + .5 * sin(fi * 2.3);
   ro.xz *= rot(ya); rd.xz *= rot(ya); ro.xy *= rot(xa); rd.xy *= rot(xa);
   ro /= size;
   vec3 k = 1. / max(abs(rd), 1e-4), n = -ro * sign(rd) * k, t1 = n - k, t2 = n + k;
   float tn = max(max(t1.x, t1.y), t1.z), tf = min(min(t2.x, t2.y), t2.z);
   if (tn >= tf) continue;
   vec3 a = ro + rd * tn, b = ro + rd * tf, mid = (a + b) * .5, nw = -sign(rd) * step(t1.yzx, t1) * step(t1.zxy, t1);
   nw.xy = nw.xy * rot(-xa); nw.xz = nw.xz * rot(-ya);
   float lit = sat(dot(nw, vec3(.53, .79, -.31))), bevel = fzS(.8, .95, fzEdge(a));
   float cloud = exp(-dot(mid, mid) * 2.2) * .25;
   vec3 ice = fzBack(p + nw.xy * .22 + .004 * (b.xy - a.xy), false) * fzDye(.5) * .86 + fzAll * (.06 + .35 * lit * lit + cloud);
   ice = mix(ice, ice * .5 + fzAll * .08, fzS(.86, .97, fzEdge(b)) * .7);
   ice = mix(ice, fzAll * (.35 + .85 * fzS(-.2, .6, nw.y + .4 * nw.x)), bevel * .75);
   if (i == 1) ice += fzKey * uCue * (.25 + .6 * bevel);
   c = mix(c, ice, mix(.82, .5, wet));
  }
  // the chains, each a band's
  float rise = full - bow * .6;
  if (g.y < rise) {
   for (int i = 0; i < 14; i++) {
    float fi = float(i), h1 = hash11(fi + 3.1), h2 = hash11(fi + 8.7), y0 = .05 + .2 * h2 * h2, ht = (g.y - y0) / (rise - y0);
    float dx = g.x - (-.88 + 1.76 * (fi + .5 + 1.6 * (h1 - .5)) / 14.) * R - .006 * sin(g.y * 19. - t * .5 + fi * 1.7) * ht;
    if (ht <= .0 || abs(dx) > .02) continue;
    bool first = i == 4 || i == 9;
    float lv = band((fi + .5) / 14.), N = 10. + floor(h1 * 8.), age = pow(ht, .6);
    float qq = age * N - mod(t * N / (7.5 + 2.5 * h2), 64.), id = floor(qq), dy = (fract(qq) - .5) / N * 1.667 * pow(age, .667) * (rise - y0);
    float rb = mix(.0029, .0088, age * age) * (first ? 1.25 : .6 + .7 * h2) * (.8 + .5 * lv + .4 * fzFizz);
    rb *= max(first ? 1. : .0, fzFed(id, lv)) * fzS(1., .97, ht);
   rb *= mix(1., fzS(.4, 3., id + .5 + mod(t * N / (7.5 + 2.5 * h2), 64.)), FZ_AWAY); // no bubble cut at its foot
    c = fzBubble(c, vec2(dx, dy), rb, .7 + .6 * lv, FZ_UP, kindColour(fi / 3.3) * lv);
   }
   c = fzBurst(c, g, vec2(.08 * fzBroad, .1), vec2(.06 * fzBroad, .36), .18, FZ_UP);
  }
  c += fzAll * .5 * fzS(.004, .0, abs(yf - full));
  float front = fzS(aa, -aa, yf - fzTall);
  float streak = (fzS(.035, .015, abs(u - .66)) + .28 * fzS(.09, .02, abs(u + .8))) * fzS(.02, .15, yf);
  c = mix(c, fzAll * 1.5, streak * front * .6);
  float rim = max(fzS(.0075, .004, abs(yf - fzTall)), .8 * fzS(.006, .003, abs(yb - fzTall + .004)));
  c = mix(c, mix(fzLeaf * .3 + fzFill * .5, fzAll * 1.25, fzS(.35, .6, noise(vec2(u * 5., g.y * 9.)))), rim * .8);
  col = mix(col, c, body);
 }
 // drops that jump above the water
 if (abs(u) < 1.4 && g.y > fzFull - .06) for (int i = 0; i < 18; i++) {
  float fi = float(i), cyc = t / (2.6 + 1.8 * hash11(fi + .3)) + hash11(fi + 5.), f = fract(cyc);
  float n = mod(floor(cyc), 97.) + fi * 13., h1 = hash11(n), h2 = hash11(n + 31.);
  vec2 at = vec2((h1 - .5) * .42 * (.8 + .6 * f) * fzBroad, fzFull + 4. * f * (1. - f) * (.07 + .3 * h2 * h2));
  float rb = (.0045 + .009 * h2 * hash11(n + 77.) + .0015 * uTexture + .002 * uKeys) * sat(12. * f * (1. - f)) * fzS(.0, .3, .14 + .9 * uTexture + .7 * uKeys + .4 * fzFizz - .02 * fi);
  col = fzBubble(col, g - at, rb, 1.3 + uKeys, FZ_UP, uKind[2] * uTexture * .8);
 }
 return col;
}
// b: the eye on the glass's floor
float fzFloe(vec2 x, int i) { // a block of ice from under it
 float fi = float(i), size = (.36 - .06 * fi) * fzS(-.8, -.1, fzIce) * (1. + .2 * max(fzIce, .0));
 if (size < .02) return 9.;
 vec2 at = i == 0 ? vec2(-.2, .46) : i == 1 ? vec2(.5, .1) : vec2(.2, -.52);
 vec2 q = rot(fi * 1.3 + .4 + .12 * sin(uTime * .07 + fi * 1.7)) * (x - at - .02 * sin(uTime * .13 + fi * 2.));
 float d = smin(size - abs(q.x), .74 * size - abs(q.y), .28 * size);
 return -smin(d, .92 * size - dot(q, FZ_UP.yx), .17 * size);
}
vec3 fzSky(vec2 x) { // what is over the glass: sky, and a branch in it
 vec3 c = mix(vec3(.3, .58, .85), vec3(.78, .9, .93), fzS(-.9, .9, x.y - x.x * .6));
 float leaf = fzS(.46, .66, noise(x * 3.1 + vec2(4., 9.)) + .3 * fzS(.2, -1., x.y - .4 * x.x) - .1 + .16 * uOwn[5]);
 c = mix(mix(c, fzLeaf * (.5 + .9 * noise(x * 8.)), leaf), vec3(.75), .6 * fzHaze);
 c = mix(c * fzWarm, vec3(.02, .035, .09), fzNight);
 return c * (1. - .93 * FZ_DARK);
}
vec3 fzGlassFloor(vec2 p) {
 float t = uTime;
 vec2 V = vec2(mix(-.02, .14, fzRoom), .09 + .008 * sin(t * .09)); // straight up
 vec2 E = vec2(-.38, -.22), q = p - V; // where the eye lies; the way it looks
 float zs = 3. * exp2(.7 * uOwn[4] + .08 * (uSpace - .5) + .4 * fzIce), r = max(length(q), 1e-3); // height of the surface
 fzPx = 1. / uRes.y;
 float a = r * r, b = dot(q, E), z = (-b + sqrt(max(b * b - a * (dot(E, E) - 1.), .0))) / a, up = sat(z / zs);
 vec2 hit = q * z + E, side = hit / max(length(hit), 1e-3), look = q / r;
 float sunny = fzS(-.5, .9, dot(side, vec2(-.85, -.5)));
 float n1 = noise(side * 2.1 + vec2(up * .9, 3.)), n2 = noise(side * 8. + vec2(up, .02 * t)), n3 = noise(side * 31. + up);
 vec3 deep = fzLeaf * (.04 + .4 * n1) + vec3(.0, .025, .04), pale = mix(vec3(.4, .76, .8), fzLeaf * 1.6, .12);
 float s = fzS(.42, .95, .5 * n1 + .36 * n2 + .2 * n3 + .5 * fzS(.4, 1., up) + .15 * sunny - .12 * fzFizz);
 vec3 col = mix(deep, pale, s) * (fzFill * 1.3 + fzSun * (.3 + .7 * sunny)) * mix(vec3(1.), fzTint * fzTint, .85);
 col *= .3 + .8 * fzS(.1, .8, up + .12 * sunny);
 float ray = fzS(.5, .8, n2) * fzS(.1, 1., up);
 if (uOwn[6] < .0) { col *= 1. - .94 * FZ_DARK; ray *= 1. - .8 * FZ_DARK; }
 if (uOwn[6] > .0) { // cut glass: lozenges all up the wall
  float av = atan(side.y, side.x + 1e-5) / TAU * 26., lu = log(max(z, .05)) * 4.2;
  vec2 ct = vec2(av + lu, av - lu), id = mod(floor(ct), 26.), f = fract(ct) - .5;
  float h = hash21(id + 3.), e = .5 - max(abs(f.x), abs(f.y)), tilt = dot(f, vec2(.9, .5)), w = fzPx * 7. / r;
  float fac = .18 + 1.2 * h * h + 1.6 * tilt * (h - .4) + .5 * step(.8, h) * sunny;
  vec3 cut = col * fac + (fzAll + fzLamp * .5) * mix(vec3(1.), fzTint, .5) * (.36 * fzS(.022 + w, .0, e) * (.25 + .75 * sunny) + .25 * step(.86, fract(h * 7.)) * (.4 + .6 * uKeys + .5 * uLevel));
  col = mix(col, cut, FZ_CUT * fzS(.0, .2, 1.1 - w));
 }
 col += fzKey * fzTint * ray * .4 * (.2 + .8 * sunny) * fzLight;
 vec4 pc = piece(vec2(abs(atan(hit.y, hit.x + 1e-5)) / PI, sat(1.1 - 1.1 * up)));
 if (uOwn[6] < .0) pc *= 1. - .55 * FZ_DARK;
 col += pc.rgb * pc.rgb * (.1 + .6 * s + .4 * ray) * (.3 + .9 * uEnergy);
 float w1 = up - .25 - .6 * uHits, w2 = up - .2 - .75 * uCue;
 col += (fzAll + fzLamp) * fzTint * (.35 * uHits * exp(-w1 * w1 * 120.) + .5 * uCue * exp(-w2 * w2 * 60.)) * (.4 + n2);
 // the surface
 vec2 x = q * zs + E;
 vec2 wave = vec2(sin(x.y * 5. + t * .5), sin(x.x * 6. + x.y * 2. - t * .44) + .6 * sin(x.y * 9. + x.x * 4. - t * .57)) * (.006 + .012 * uLow);
 x += wave;
 float edge = length(x) - 1., aa = fzPx * zs * 1.5;
 if (edge < .2) {
  vec3 sky = fzSky(x * 1.1 + wave * 4.) * (.65 + .25 * fzLight);
  vec2 sd = x - vec2(.16, .3) + wave * 5.; // the sun
  sky += fzKey * (2.2 * exp(-dot(sd, sd) * 70.) + .4 * exp(-dot(sd, sd) * 5.)) * (.6 + .6 * uPad);
  float rip = noise(x * 6. + wave * 30. + vec2(t * .1, -t * .12));
  sky += fzKey * .3 * fzS(.55, .85, rip) * (.4 + uLevel);
  sky = mix(sky * fzDye(.7), (fzAll + fzLamp * .3) * vec3(.85, .97, 1.) * (.6 + .4 * n2 + (.1 + .9 * uKeys) * n3), fzS(-.15, -.1, edge) * .85);
  sky *= 1. - .85 * fzS(.035, .0, abs(edge + .14));
  col = mix(col * (1. - .75 * fzS(.12, .0, edge)), sky, fzS(aa, -aa, edge));
 }
 vec2 lq = rot(.5 + .05 * sin(t * .1)) * (q * zs * .9 + E - vec2(-.55, -.38)) / .47;
 float lone = 1.;
 if (uOwn[7] < .0) { lone = 1. - step(.97, FZ_BERRY); lq /= max(1. - FZ_BERRY, .02); }
 vec4 le = fzSlice(lq, fzPx * zs * 3.) * vec4(1., 1., 1., lone);
 col *= 1. - lone * .5 * fzS(1.25, .95, length(lq));
 le.rgb *= (fzAll * (.85 + .25 * lq.y) + fzLamp * .3) * (.95 + .35 * uPhrase);
 col = mix(col, le.rgb, le.a);
 if (uOwn[7] > .0) { // slices all over the top, each of its own fruit
  vec3 pulp = fzPulp, rind = fzRind;
  for (float i = .0; i < 8.; i++) {
   float h1 = hash11(i + 5.2), h2 = hash11(i * 2.3 + 1.1), an = i * .785 + .5 * (h1 - .5) + .06 * sin(t * .07 + i);
   vec2 q2 = rot(h1 * 6. + (h2 - .5) * .1 * t) * (q * zs * (.86 + .1 * h2) + E - (.3 + .42 * mod(i, 2.)) * vec2(cos(an), sin(an))) / ((.25 + .1 * h2) * sqrt(max(FZ_ROW, 1e-4)));
   vec3 d = uKind[int(mod(i, 5.))]; d /= max(max(d.r, max(d.g, d.b)), .2);
   fzPulp = mix(pulp, .06 + .94 * d * d, .85 * step(.2, h1)); fzRind = mix(rind, fzPulp * .7, step(.4, h1));
   col *= 1. - .5 * fzS(1.3, .92, length(q2 + vec2(.06)));
   vec4 s2 = fzSlice(q2, fzPx * zs * 4.);
   float lit = i < 1. ? uDrone : i < 2. ? uPad : i < 3. ? uTexture : uPhrase;
   col = mix(col, s2.rgb * (fzAll * (.7 + .2 * q2.y + .35 * fzLight) + fzLamp * .35) * (.8 + .4 * lit), s2.a);
  }
  fzPulp = pulp; fzRind = rind;
 }
 if (uOwn[7] < .0 && edge < .8) for (float i = .0; i < 18.; i++) { // berries under the top
  float h1 = hash11(i + 2.2), h2 = hash11(i * 1.7 + 11.), rb = (.1 + .07 * h2) * FZ_BERRY;
  vec2 at = sqrt(h1) * .86 * vec2(cos(i * 2.4), sin(i * 2.4)) + .015 * sin(t * (.2 + .1 * h1) + i * vec2(1., 2.));
  vec2 q2 = (q * zs * (.7 + .25 * h2) + E - at) / max(rb, 1e-3);
  if (dot(q2, q2) > 2.) continue;
  col *= 1. - .45 * fzS(1.4, .9, length(q2 + vec2(.1)));
  vec4 be = fzBerry(q2, fzPx * zs * 1.4 / max(rb, 1e-3), h2);
  be.rgb *= .75 + .3 * fzLight + .6 * uPhrase * step(.5, h1);
  col = mix(col, be.rgb, be.a);
 }
 if (edge < .6) for (int i = 0; i < 3; i++) {
  float in_ = -fzFloe(q * zs * (i == 1 ? .84 - .08 * fzBob : .84) + E + wave * .5, i);
  if (in_ < -.3) continue;
  float d = min(-in_, fzFloe(q * zs * .92 + E + wave * .5, i)), m = fzS(aa, -aa, d);
  if (m <= .0) continue;
  vec3 dark = fzTint * (vec3(.006, .06, .075) + fzAll * .12 * n3);
  vec3 face = fzSky(x * .7 + in_ * vec2(-1.6, 1.2)) * .8 * fzDye(.6) + (fzAll + fzLamp * .2) * .14;
  vec3 ice = mix(dark, face, fzS(.0, .07, in_));
  ice += fzKey * (.9 * fzS(.014, .0, abs(in_ - .004)) * fzS(.3, .6, n2) + (i == 1 ? .5 * uCue * fzS(.0, .12, in_) : .0));
  col = mix(col, ice, m);
 }
 // chains: each is a spoke that runs in to the point overhead
 float turn = atan(q.y, q.x + 1e-5);
 for (int k = 0; k < 4; k++) {
  float fk = float(k), n = 7. + 3. * fk, cell = turn / TAU * n + .37 * fk, id = mod(floor(cell), n);
  float h1 = hash11(id + 17. * fk), h2 = hash11(id + 31. * fk + 5.), rho = .3 + .2 * fk + .16 * h1, zc = rho / r;
  if (zc > zs * 1.1) continue;
  float lv = k < 3 ? band((id + .5) / n) : uTexture, N = 9. + floor(h2 * 5.), go = mod(t * N / (8. + 2. * h1), 64.), one = step(.72, h2);
  float ki = floor(pow(zc / zs, .625) * N - go), ac = clamp((ki + .5 + go) / N, .02, 1.), zb = zs * pow(ac, 1.6);
  float ang = (fract(cell) - .5 - .3 * (h2 - .5)) / n * TAU - .05 * sin(zb * 2.2 + h1 * 9. + t * .3) / (1. + fk);
  float rb = (.006 + .06 * ac * ac * ac) / zb * (.75 + .5 * lv + .3 * fzFizz);
  rb = min(rb, .4 * rho / (zb * zb) * zs * 1.6 * pow(ac, .6) / N);
  vec2 wp = rho * vec2(cos(turn - ang), sin(turn - ang)) + E;
  rb *= max(one, fzFed(ki, lv));
  rb *= fzS(.98, .9, dot(wp, wp)) * fzS(1., .95, ac);
  vec2 bq = look * (cos(ang) * r - rho / zb) + vec2(-look.y, look.x) * sin(ang) * r;
  col = fzBubble(col, bq, rb, .8 + .6 * lv, -look, kindColour(h1 * 4.) * lv);
 }
 return fzBurst(col, q, vec2(-.45, -.2), vec2(-.2, -.09), .19, -look);
}
vec3 render(vec2 p) {
 fzSet();
 vec3 c = uVar < .5 ? fzNoon(p) : fzGlassFloor(p);
 return pow(1. - exp(-1.9 * max(c, .0)), vec3(.4545));
}
