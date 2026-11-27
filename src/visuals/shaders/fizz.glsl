// name: Fizz
// a: Noon table
// b: Glass floor
// what: A tall glass of sparkling water on a white garden table in hard sun: ice, a slice of lemon, chains of bubbles, drops jumping over the rim, a blue shadow full of a net of light, a straw hat and garden behind; or the view up from the floor of the glass: the bright surface, ice and lemon overhead, bubbles leaving.
// follows: Each band feeds its own chain: louder is bigger, brighter, closer set. Pad is the light in the water, drone the garden's colour, texture the jumping drops or the outer chains, phrase the lemon. The piece tints the net of light or the wall. A hit frees a cluster and a wave of light, a cue ducks an ice block, keys light the drops or the hoop.
// own: 0 blue night with lamps at -1, low gold sun at 1; 1 red drink, blood orange at -1, amber tea, lime at 1; 2 low wide glass, no ice at -1, slim tall glass at 1; 3 hazy day, soft shade, still water at -1, long shadow, fierce bubbles at 1; 4 close up at -1, farther off at 1; 5 by the sea at -1, autumn at 1
const float FZ_EYE = 1.0, FZ_F = 3.0, FZ_FOOT = -.31, FZ_BASE = .065; // eye height, lens, where the glass stands, its thick foot
const vec2 FZ_UP = vec2(.6, .8);
vec3 fzSun, fzKey, fzFill, fzAll, fzLeaf, fzWarm, fzTint, fzPulp, fzRind, fzLamp;
float fzS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float fzRoom, fzPx, fzNight, fzGold, fzHaze, fzHard, fzGx, fzTall, fzFull, fzBroad, fzIce, fzFizz, fzLight, fzBob;

// The light and the materials, from the hour, the drink and the place.
void fzSet() {
  fzNight = max(-uOwn[0], .0); fzGold = max(uOwn[0], .0);
  fzFizz = uOwn[3]; fzHaze = max(-fzFizz, .0); fzHard = max(fzFizz, .0); fzIce = uOwn[2];
  fzSun = mix(vec3(.96, .87, .7), vec3(1.0, .5, .18), fzGold);
  fzFill = mix(vec3(.13, .205, .36), vec3(.17, .12, .24), fzGold);
  fzWarm = mix(vec3(1.0), vec3(1.2, .69, .39), fzGold);
  fzFill += fzSun * .3 * fzHaze; fzSun *= 1.0 - .55 * fzHaze;
  fzSun = mix(fzSun, vec3(.05, .085, .18), fzNight);
  fzFill = mix(fzFill, vec3(.018, .028, .07), fzNight);
  fzAll = fzSun + fzFill; fzLamp = vec3(1.0, .6, .26) * fzNight; fzKey = fzSun + fzLamp;
  float red = max(-uOwn[1], .0), tea = max(uOwn[1], .0);
  fzTint = mix(mix(vec3(.86, .965, .95), vec3(.93, .3, .34), red), vec3(.95, .58, .17), tea);
  fzPulp = mix(mix(vec3(1.0, .8, .14), vec3(.95, .16, .08), red), vec3(.5, .78, .14), tea);
  fzRind = mix(fzPulp * vec3(.95, .82, .25), vec3(.12, .4, .05), tea);
  fzLeaf = mix(vec3(.17, .36, .06), vec3(.6, .15, .03), max(uOwn[5], .0));
  fzLeaf = mix(fzLeaf, vec3(.02, .2, .5), max(-uOwn[5], .0));
  fzLeaf = mix(fzLeaf, uKind[0] * uKind[0] * .6, .4 * uDrone);
  fzLight = .6 + (.75 * uPad + .25 * uLevel + .4 * uMic) * (.6 + uEnergy);
  fzRoom = fzS(.3, .8, .5 * uRes.x / uRes.y); // how wide the picture is
  fzBob = 4.0 * uCue * (1.0 - uCue);
  float slim = max(fzIce, .0), low = max(-fzIce, .0);
  fzTall = .69 + .06 * slim - .21 * low; fzFull = fzTall * .79; fzBroad = 1.0 - .28 * slim + .25 * low;
}
vec3 fzDye(float k) { return mix(vec3(1.0), fzTint, k); }   // the drink's colour, so thick
// The garden out of focus: lawn, hedge and, where it is seen straight, discs of light; or the sea.
vec3 fzGarden(vec2 q, bool all) {
  float n = noise(q * vec2(3.2, 4.0) + 4.0);
  float hedge = fzS(.17, .36, q.y + .12 * (n - .5)), air = .0, lamp = .0;
  vec3 c = mix(mix(fzLeaf, vec3(.6, .68, .1), .45), fzLeaf * (.1 + 1.1 * n * n), hedge);
  if (all) for (int k = 0; k < 2; k++) {
    float fk = float(k);
    vec2 g = rot(.5 + .9 * fk) * (q + vec2(.004 * sin(uTime * .11 + fk), .0)) / (.15 - .05 * fk) + fk * 3.7, h = hash22(floor(g) + 3.0 + 9.0 * fk);
    float r = .15 + .15 * h.x, d = length(fract(g) - .5 - (h - .5) * (.9 - 2.0 * r));
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
  return mix(c, c * vec3(.035, .06, .14), fzNight) + fzLamp * lamp * hedge * .7;
}
// What stands behind the glass: garden, white table, straw hat. fzTab is how much is table, fzW the place on it.
float fzTab; vec2 fzW;
vec3 fzBack(vec2 q, bool all) {
  float s = max((FZ_EYE - q.y) / (FZ_EYE - FZ_FOOT), .2);
  fzW = vec2(q.x / s, FZ_F * (1.0 / s - 1.0));
  fzTab = fzS(.05, -.05, length(fzW - vec2(.25, .0)) - 2.05);
  vec3 c = vec3(.0);
  if (fzTab < 1.0) c = fzGarden(q, all);
  if (fzTab > .0) {
    float px = fzPx * FZ_F / (s * s * 1.3) + .016 * abs(fzW.y);
    vec2 b = rot(.42) * fzW;
    float gap = fzS(.006 + px, .003, abs(fract(b.y / .46 + .3) - .5) * .46) * .35 * fzS(.05, .006, px);
    c = mix(c, vec3(.94, .93, .9) * fzAll * (1.0 - gap), fzTab);
  }
  vec2 h = q - vec2(-.47, .085);
  if (!all || dot(h, h) > .16) return c;
  float sh = length((h + vec2(.1, .035)) / vec2(.27, .062)), soft = .08 + .3 * fzHaze;
  c *= mix(vec3(1.0), fzFill / fzAll, .85 * fzS(1.0 + soft, 1.0 - soft, sh) * fzTab);
  float brim = length(h / vec2(.235, .072)), up = h.y - .012, hx = h.x / .118;
  float crown = up > .0 ? pow(pow(abs(hx), 3.0) + pow(up / .118, 3.0), .3333) : length(vec2(hx, up / .036));
  vec3 straw = vec3(.9, .6, .22) * (1.0 + .06 * sin(brim * 60.0));
  float dim = fzS(1.1, .8, length((h + vec2(.085, -.012)) / vec2(.135, .034)));
  c = mix(c, straw * (fzFill + fzSun * (1.0 - dim) * (.8 + h.x)), fzS(1.06, .95, brim));
  vec3 body = straw * (fzFill + fzSun * fzS(-.75, .5, hx + 13.5 * up - .2));
  float low = up + .036 * sqrt(max(1.0 - hx * hx, .0)); // above the foot of the crown
  body = mix(body, vec3(.05, .09, .2) * (fzFill + fzSun * fzS(-1.0, .8, hx)), fzS(.05, .04, low));
  return mix(c, body, fzS(1.06, .94, crown));
}
// A net of light: where two drifting fields are equal.
float fzNet(vec2 q, float t, float sharp) {
  float a = noise(q + vec2(t * .16, t * .09)), b = noise(q * 1.37 - vec2(t * .11, -t * .13) + 5.0), c = sat(1.0 - abs(a - b) * sharp);
  return c * c * c;
}
float fzWide(float y) { return mix(.195, .265, sat(y / fzTall)) * fzBroad; }
// Sun and shade on the table: the shadow of the glass, and what the water makes of the light in it.
vec3 fzShade(vec2 w, float px) {
  vec2 d = w - vec2(fzGx, .0), k = vec2(-1.25 - .45 * fzHard, -.06 - .16 * fzHard);
  float k2 = dot(k, k), y = dot(d, k) / k2, yc = clamp(y, .0, fzTall), R = fzWide(yc);
  float soft = .003 + px + (.028 - .02 * uTone + .12 * fzHaze) * yc;
  float inside = fzS(soft, -soft, length(d - k * yc) - R);
  if (inside <= .0) return vec3(1.0);
  float v = dot(d, vec2(-k.y, k.x)) / sqrt(k2) / R, av = abs(v), t = uTime;
  float wet = fzS(fzFull + .02, fzFull - .02, y + .06 * v * v);
  // dark edges, two folds of gathered sun that meet, and a beam beyond
  float L = mix(0.66 - 0.45 * fzS(0.75, 1.0, av), 0.1 + 0.2 * (1.0 - av), wet);
  float fold = 0.8 * pow(sat(1.0 - y / 0.34), 1.4), fd = av - fold;
  float beam = (exp(-fd * fd * 700.0) + 0.5 * fzS(0.02, -0.02, fd) * exp(fd * 5.0)) * fzS(-0.1, 0.06, y);
  beam += exp(-v * v * 34.0) * fzS(0.22, 0.36, y) * 0.75;
  vec2 q = vec2(y * 9.0, v * 2.6) + 0.35 * vec2(sin(v * 4.0 + t * 0.21), sin(y * 13.0 - t * 0.26));
  float net = (fzNet(q, t, 4.2) * 0.8 + fzNet(q * 2.1 + 7.0, t * 1.2, 4.6) * 0.5) * fzS(1.0, 0.55, av);
  float hit = y - 0.75 + 0.6 * uHits, cue = y - 0.6 + 0.5 * uCue;
  float wave = 1.2 * exp(-hit * hit * 40.0) * uHits + 0.8 * exp(-cue * cue * 30.0) * uCue;
  vec3 li = vec3(L) + wet * fzTint * (beam * 1.1 + net * 1.5) * (fzLight * (0.85 + 0.15 * sin(t * 0.37)) + 2.5 * wave) + wave * 0.8;
  float fr = length(vec2((y - 0.43 * fzTall) / 0.135, (v + 0.12) / 0.62)); // the slice of fruit stains it
  li = mix(li, li * (fzPulp * 1.25) + fzPulp * fzPulp * (0.22 + 0.5 * uPhrase), fzS(1.15, 0.75, fr + 0.25 * (net - 0.3)) * wet * 0.9);
  vec4 pc = piece(vec2(sat(y / fzTall), sat(0.5 + 0.45 * v)));
  li += pc.rgb * pc.rgb * (0.5 + 1.8 * net + 0.8 * beam) * wet * (0.5 + 0.9 * uEnergy);
  float ring = abs(length(d - k * fzTall) - fzWide(fzTall)); // the rim
  li += 0.3 * fzS(0.016 + px, 0.004, ring) - 0.3 * fzS(0.03 + px, 0.01, abs(ring - 0.028)) * (1.0 - wet);
  return mix(vec3(1.0), li + fzLamp * wet * (beam + net) * 5.0, inside * (1.0 - 0.45 * fzHaze));
}
// A slice of fruit: q in radii. Its colour, and how much of it is there.
vec4 fzSlice(vec2 q, float aa) {
  float r = length(q);
  if (r > 1.05) return vec4(0.0);
  float seg = atan(q.y, q.x + 1e-5) / TAU * 9.0 + 0.2, sf = abs(fract(seg) - 0.5), wall = (0.5 - sf) * 0.7 * r;
  float fibre = noise(vec2(seg * 15.0, r * 6.0));
  float flesh = fzS(0.012, 0.045, wall) * fzS(0.86, 0.81, r + 0.05 * fzS(0.34, 0.5, sf)) * fzS(0.07, 0.12, r);
  vec3 c = mix(mix(vec3(0.97, 0.93, 0.74), fzPulp, 0.22), fzPulp * (0.66 + 0.62 * fibre), flesh);
  return vec4(mix(c, fzRind, fzS(0.91, 0.945, r)), fzS(1.0 + aa, 1.0 - aa, r));
}
// What a chain's band feeds it: every other bubble first, then those between.
float fzFed(float id, float lv) { return mod(id, 2.0) < 0.5 ? fzS(-0.1, 0.12, lv + 0.3 * fzFizz) : fzS(0.06, 0.6, lv + 0.5 * fzFizz); }
// Lays a clear bubble over what is behind: q from its middle, L towards the light.
vec3 fzBubble(vec3 c, vec2 q, float size, float bright, vec2 L, vec3 hue) {
  if (size < 0.0007) return c;
  q /= size;
  float aa = 1.3 * fzPx / size, r = length(q), m = fzS(1.0 + aa, 1.0 - aa, r);
  if (m <= 0.0) return c;
  if (r > 1.0) q /= r;
  r = min(r, 1.0);
  float to = dot(q, L);
  float wall = fzS(0.45, 0.95, r);
  vec3 b = c * (1.06 - wall * (0.28 + 0.6 * (1.0 - fzS(-0.5, 0.75, to))));
  float k = max(hue.r, max(hue.g, hue.b));
  b = mix(b, hue / max(k, 0.01), min(0.4 * k, 0.6) * (1.0 - r * r));
  b += fzAll * bright * 0.4 * fzS(0.55, 0.9, r) * fzS(0.2, 0.85, to);
  vec2 g = q - L * 0.5;
  return mix(c, b + (fzSun + 0.2) * exp(-dot(g, g) * 22.0) * bright * 1.4, m / max(1.0, aa));
}
// A hit: a cluster set free, going from one place to another.
vec3 fzBurst(vec3 c, vec2 q, vec2 from, vec2 to, float wide, vec2 L) {
  if (uHits > 0.01) for (int i = 0; i < 12; i++) {
    float h1 = hash11(float(i) + 41.0), h2 = hash11(float(i) * 3.7 + 9.0), go = 1.0 - uHits, rb = wide * (0.05 + 0.08 * h2 * h1) * fzS(0.0, 0.25, uHits);
    vec2 at = mix(from, to, go * (0.4 + 0.6 * h2)) + wide * vec2(h1 - 0.5, h2 - 0.5);
    c = fzBubble(c, q - at, rb, 1.3, L, uKind[4] * 1.8);
  }
  return c;
}
const vec3 fzAt[3] = vec3[3](vec3(-0.115, -0.045, 0.02), vec3(0.052, -0.03, -0.05), vec3(0.01, -0.075, 0.13));
float fzEdge(vec3 q) { q = abs(q); return max(min(q.x, q.y), min(max(q.x, q.y), q.z)); } // near to an edge of a block
vec3 fzNoon(vec2 p) {
  float t = uTime, zoom = 0.93 * (1.0 + 0.43 * uOwn[4]) * (0.985 + 0.03 * uSpace);
  fzGx = mix(0.03, 0.46, fzRoom);
  vec2 about = vec2(fzGx - 0.1, 0.06 - 0.12 * max(-uOwn[4], 0.0));
  p = about + (p - about) * zoom;
  fzPx = zoom / uRes.y;
  vec2 g = p - vec2(fzGx, FZ_FOOT);
  float R = fzWide(g.y), u = g.x / R, aa = fzPx * 1.4;
  vec3 col = fzBack(p, true);
  if (fzTab > 0.0) {
    vec3 shade = fzShade(fzW, fzPx * 2.6 / (FZ_EYE - p.y));
    col *= mix(vec3(1.0), (fzFill + fzSun * shade) / fzAll, fzTab);
    col *= 1.0 - 0.55 * fzS(1.12, 0.95, length(fzW - vec2(fzGx, 0.0)) / (0.215 * fzBroad)); // where the foot stands
  }
  float lean = (FZ_EYE - p.y) / FZ_F, bow = sqrt(max(1.0 - u * u, 0.0)) * R * lean;
  float yf = g.y + bow, yb = g.y - bow; // the height on the near wall and the far
  float body = fzS(-aa, aa, (1.0 - abs(u)) * R) * fzS(-aa, aa, yf) * fzS(aa, -aa, yb - fzTall);
  if (body > 0.0) {
    float cu = clamp(u, -0.999, 0.999), thick = sqrt(1.0 - cu * cu);
    float full = fzFull + 0.007 * sin(g.x * 23.0 + t * 0.7) * (0.25 + 0.5 * uLow) * (1.0 + 2.0 * fzBob);
    float wet = fzS(aa, -aa, yf - full);
    vec3 c = col * (1.0 - 0.5 * fzS(0.88, 1.0, abs(cu)));
    if (yf < full + aa) { // through the water what is behind is turned about
      float turned = 2.0 * (asin(cu) - asin(cu / 1.34));
      vec3 thru = fzBack(vec2(p.x - 0.8 * tan(clamp(turned, -1.25, 1.25)), p.y + 0.1 + 0.1 * g.y), false) * pow(fzTint, vec3(0.4 + 1.5 * thick));
      thru *= mix(vec3(1.0), vec3(0.74, 0.9, 0.93), thick);
      thru += fzAll * fzTint * (0.05 + 0.1 * fzLight * fzS(0.0, 0.6, g.y)) * thick;
      c = mix(c, mix(thru, fzLeaf * 0.1 * fzAll, 0.9 * fzS(0.86, 1.0, abs(cu))), wet);
    } else { // the top of the water
      float rip = noise(vec2(g.x * 16.0 + t * 0.3, (g.y - full) * 55.0 - t * 0.2));
      vec3 top = mix(fzBack(p - vec2(0.0, 0.1), false), fzAll * vec3(0.8, 0.92, 1.0), 0.35 + 0.3 * rip) * fzTint;
      c = mix(c, top + fzAll * 0.5 * fzS(0.55, 0.9, rip + 0.2 * uLevel), fzS(aa, -aa, yb - full));
    }
    float ft = yf / FZ_BASE, foot = fzS(1.0 + aa / FZ_BASE, 1.0 - aa / FZ_BASE, ft);
    vec3 heavy = mix(fzLeaf * 0.2 + fzFill * 0.25, fzAll * 0.95, fzS(-0.3, 0.8, sin(ft * 9.0 + 3.0 * thick + 1.5 * u)) * (0.7 - 0.3 * u));
    c = mix(c, heavy * fzDye(0.6), foot * 0.85) + fzAll * 0.22 * fzS(0.012, 0.0, abs(yb - FZ_BASE)) * (1.0 - foot);
    // in the water things look wider than they are
    float xm = g.x * mix(1.0, 0.78, wet), fs = min(1.0, fzTall / 0.6) * min(1.0, fzBroad);
    vec2 lq = rot(-0.35 + 0.05 * sin(t * 0.13)) * (vec2(xm, g.y) - vec2(-0.035, 0.43 * fzTall + 0.006 * sin(t * 0.23))) / (0.129 * fs);
    lq.x *= 1.14;
    vec4 le = fzSlice(lq, fzPx * 9.0);
    le.rgb *= (fzAll * (0.85 + 0.2 * lq.x) + fzLamp * 0.2) * (1.0 + 0.3 * uPhrase);
    c = mix(c, fzRind * fzAll * 0.55, fzS(1.01, 0.99, length(lq - vec2(0.05, -0.07))) * wet);
    c = mix(c, le.rgb, le.a * wet * 0.96);
    for (int i = 0; i < 3; i++) {
      float fi = float(i), size = 0.08 * min(1.0, fzBroad * 1.1) * fzS(-0.8, 0.0, fzIce);
      vec3 at = fzAt[i] * vec3(fzBroad, 1.0, 1.0);
      at.y += fzFull + 0.006 * sin(t * 0.5 + fi * 2.0) - (i == 1 ? 0.09 : 0.012) * fzBob;
      vec3 ro = vec3(xm, g.y + lean, -1.0) - at, rd = vec3(0.0, -lean, 1.0);
      if (size < 0.004 || length(ro.xy - vec2(0.0, lean * (1.0 + at.z))) > size * 1.85) continue;
      float ya = fi * 1.9 + 0.5 + 0.1 * sin(t * 0.11 + fi), xa = 0.35 + 0.5 * sin(fi * 2.3);
      ro.xz *= rot(ya); rd.xz *= rot(ya); ro.xy *= rot(xa); rd.xy *= rot(xa);
      ro /= size;
      vec3 k = 1.0 / max(abs(rd), 1e-4), n = -ro * sign(rd) * k, t1 = n - k, t2 = n + k;
      float tn = max(max(t1.x, t1.y), t1.z), tf = min(min(t2.x, t2.y), t2.z);
      if (tn >= tf) continue;
      vec3 a = ro + rd * tn, b = ro + rd * tf, mid = (a + b) * 0.5, nw = -sign(rd) * step(t1.yzx, t1) * step(t1.zxy, t1);
      nw.xy = nw.xy * rot(-xa); nw.xz = nw.xz * rot(-ya);
      float lit = sat(dot(nw, vec3(0.53, 0.79, -0.31))), bevel = fzS(0.8, 0.95, fzEdge(a));
      float cloud = exp(-dot(mid, mid) * 2.2) * 0.25;
      vec3 ice = fzBack(p + nw.xy * 0.22 + 0.004 * (b.xy - a.xy), false) * fzDye(0.5) * 0.86 + fzAll * (0.06 + 0.35 * lit * lit + cloud);
      ice = mix(ice, ice * 0.5 + fzAll * 0.08, fzS(0.86, 0.97, fzEdge(b)) * 0.7);
      ice = mix(ice, fzAll * (0.35 + 0.85 * fzS(-0.2, 0.6, nw.y + 0.4 * nw.x)), bevel * 0.75);
      if (i == 1) ice += fzKey * uCue * (0.25 + 0.6 * bevel);
      c = mix(c, ice, mix(0.82, 0.5, wet));
    }
    // the chains, each a band's
    float rise = full - bow * 0.6;
    if (g.y < rise) {
      for (int i = 0; i < 14; i++) {
        float fi = float(i), h1 = hash11(fi + 3.1), h2 = hash11(fi + 8.7), y0 = 0.05 + 0.2 * h2 * h2, ht = (g.y - y0) / (rise - y0);
        float dx = g.x - (-0.88 + 1.76 * (fi + 0.5 + 1.6 * (h1 - 0.5)) / 14.0) * R - 0.006 * sin(g.y * 19.0 - t * 0.5 + fi * 1.7) * ht;
        if (ht <= 0.0 || abs(dx) > 0.02) continue;
        bool first = i == 4 || i == 9;
        float lv = band((fi + 0.5) / 14.0), N = 10.0 + floor(h1 * 8.0), age = pow(ht, 0.6);
        float qq = age * N - mod(t * N / (7.5 + 2.5 * h2), 64.0), id = floor(qq), dy = (fract(qq) - 0.5) / N * 1.667 * pow(age, 0.667) * (rise - y0);
        float rb = mix(0.0029, 0.0088, age * age) * (first ? 1.25 : 0.6 + 0.7 * h2) * (0.8 + 0.5 * lv + 0.4 * fzFizz);
        rb *= max(first ? 1.0 : 0.0, fzFed(id, lv)) * fzS(1.0, 0.97, ht);
        c = fzBubble(c, vec2(dx, dy), rb, 0.7 + 0.6 * lv, FZ_UP, kindColour(fi / 3.3) * lv);
      }
      c = fzBurst(c, g, vec2(0.08 * fzBroad, 0.1), vec2(0.06 * fzBroad, 0.36), 0.18, FZ_UP);
    }
    c += fzAll * 0.5 * fzS(0.004, 0.0, abs(yf - full));
    float front = fzS(aa, -aa, yf - fzTall);
    float streak = (fzS(0.035, 0.015, abs(u - 0.66)) + 0.28 * fzS(0.09, 0.02, abs(u + 0.8))) * fzS(0.02, 0.15, yf);
    c = mix(c, fzAll * 1.5, streak * front * 0.6);
    float rim = max(fzS(0.0075, 0.004, abs(yf - fzTall)), 0.8 * fzS(0.006, 0.003, abs(yb - fzTall + 0.004)));
    c = mix(c, mix(fzLeaf * 0.3 + fzFill * 0.5, fzAll * 1.25, fzS(0.35, 0.6, noise(vec2(u * 5.0, g.y * 9.0)))), rim * 0.8);
    col = mix(col, c, body);
  }
  // drops that jump above the water
  if (abs(u) < 1.4 && g.y > fzFull - 0.06) for (int i = 0; i < 18; i++) {
    float fi = float(i), cyc = t / (2.6 + 1.8 * hash11(fi + 0.3)) + hash11(fi + 5.0), f = fract(cyc);
    float n = mod(floor(cyc), 97.0) + fi * 13.0, h1 = hash11(n), h2 = hash11(n + 31.0);
    vec2 at = vec2((h1 - 0.5) * 0.42 * (0.8 + 0.6 * f) * fzBroad, fzFull + 4.0 * f * (1.0 - f) * (0.07 + 0.3 * h2 * h2));
    float rb = (0.0045 + 0.009 * h2 * hash11(n + 77.0) + 0.0015 * uTexture + 0.002 * uKeys) * sat(12.0 * f * (1.0 - f)) * fzS(0.0, 0.3, 0.14 + 0.9 * uTexture + 0.7 * uKeys + 0.4 * fzFizz - 0.02 * fi);
    col = fzBubble(col, g - at, rb, 1.3 + uKeys, FZ_UP, uKind[2] * uTexture * 0.8);
  }
  return col;
}
// b: the eye on the glass's floor
float fzFloe(vec2 x, int i) { // a block of ice from under it
  float fi = float(i), size = (0.36 - 0.06 * fi) * fzS(-0.8, -0.1, fzIce) * (1.0 + 0.2 * max(fzIce, 0.0));
  if (size < 0.02) return 9.0;
  vec2 at = i == 0 ? vec2(-0.2, 0.46) : i == 1 ? vec2(0.5, 0.1) : vec2(0.2, -0.52);
  vec2 q = rot(fi * 1.3 + 0.4 + 0.12 * sin(uTime * 0.07 + fi * 1.7)) * (x - at - 0.02 * sin(uTime * 0.13 + fi * 2.0));
  float d = smin(size - abs(q.x), 0.74 * size - abs(q.y), 0.28 * size);
  return -smin(d, 0.92 * size - dot(q, FZ_UP.yx), 0.17 * size);
}
vec3 fzSky(vec2 x) { // what is over the glass: sky, and a branch in it
  vec3 c = mix(vec3(0.3, 0.58, 0.85), vec3(0.78, 0.9, 0.93), fzS(-0.9, 0.9, x.y - x.x * 0.6));
  float leaf = fzS(0.46, 0.66, noise(x * 3.1 + vec2(4.0, 9.0)) + 0.3 * fzS(0.2, -1.0, x.y - 0.4 * x.x) - 0.1 + 0.16 * uOwn[5]);
  c = mix(mix(c, fzLeaf * (0.5 + 0.9 * noise(x * 8.0)), leaf), vec3(0.75), 0.6 * fzHaze);
  return mix(c * fzWarm, vec3(0.02, 0.035, 0.09), fzNight);
}
vec3 fzGlassFloor(vec2 p) {
  float t = uTime;
  vec2 V = vec2(mix(-0.02, 0.14, fzRoom), 0.09 + 0.008 * sin(t * 0.09)); // straight up
  vec2 E = vec2(-0.38, -0.22), q = p - V; // where the eye lies; the way it looks
  float zs = 3.0 * exp2(0.7 * uOwn[4] + 0.08 * (uSpace - 0.5) + 0.4 * fzIce), r = max(length(q), 1e-3); // height of the surface
  fzPx = 1.0 / uRes.y;
  float a = r * r, b = dot(q, E), z = (-b + sqrt(max(b * b - a * (dot(E, E) - 1.0), 0.0))) / a, up = sat(z / zs);
  vec2 hit = q * z + E, side = hit / max(length(hit), 1e-3), look = q / r;
  float sunny = fzS(-0.5, 0.9, dot(side, vec2(-0.85, -0.5)));
  float n1 = noise(side * 2.1 + vec2(up * 0.9, 3.0)), n2 = noise(side * 8.0 + vec2(up, 0.02 * t)), n3 = noise(side * 31.0 + up);
  vec3 deep = fzLeaf * (0.04 + 0.4 * n1) + vec3(0.0, 0.025, 0.04), pale = mix(vec3(0.4, 0.76, 0.8), fzLeaf * 1.6, 0.12);
  float s = fzS(0.42, 0.95, 0.5 * n1 + 0.36 * n2 + 0.2 * n3 + 0.5 * fzS(0.4, 1.0, up) + 0.15 * sunny - 0.12 * fzFizz);
  vec3 col = mix(deep, pale, s) * (fzFill * 1.3 + fzSun * (0.3 + 0.7 * sunny)) * mix(vec3(1.0), fzTint * fzTint, 0.85);
  col *= 0.3 + 0.8 * fzS(0.1, 0.8, up + 0.12 * sunny);
  float ray = fzS(0.5, 0.8, n2) * fzS(0.1, 1.0, up);
  col += fzKey * fzTint * ray * 0.4 * (0.2 + 0.8 * sunny) * fzLight;
  vec4 pc = piece(vec2(abs(atan(hit.y, hit.x + 1e-5)) / PI, sat(1.1 - 1.1 * up)));
  col += pc.rgb * pc.rgb * (0.1 + 0.6 * s + 0.4 * ray) * (0.3 + 0.9 * uEnergy);
  float w1 = up - 0.25 - 0.6 * uHits, w2 = up - 0.2 - 0.75 * uCue;
  col += (fzAll + fzLamp) * fzTint * (0.35 * uHits * exp(-w1 * w1 * 120.0) + 0.5 * uCue * exp(-w2 * w2 * 60.0)) * (0.4 + n2);
  // the surface
  vec2 x = q * zs + E;
  vec2 wave = vec2(sin(x.y * 5.0 + t * 0.5), sin(x.x * 6.0 + x.y * 2.0 - t * 0.44) + 0.6 * sin(x.y * 9.0 + x.x * 4.0 - t * 0.57)) * (0.006 + 0.012 * uLow);
  x += wave;
  float edge = length(x) - 1.0, aa = fzPx * zs * 1.5;
  if (edge < 0.2) {
    vec3 sky = fzSky(x * 1.1 + wave * 4.0) * (0.65 + 0.25 * fzLight);
    vec2 sd = x - vec2(0.16, 0.3) + wave * 5.0; // the sun
    sky += fzKey * (2.2 * exp(-dot(sd, sd) * 70.0) + 0.4 * exp(-dot(sd, sd) * 5.0)) * (0.6 + 0.6 * uPad);
    float rip = noise(x * 6.0 + wave * 30.0 + vec2(t * 0.1, -t * 0.12));
    sky += fzKey * 0.3 * fzS(0.55, 0.85, rip) * (0.4 + uLevel);
    sky = mix(sky * fzDye(0.7), (fzAll + fzLamp * 0.3) * vec3(0.85, 0.97, 1.0) * (0.6 + 0.4 * n2 + (0.1 + 0.9 * uKeys) * n3), fzS(-0.15, -0.1, edge) * 0.85);
    sky *= 1.0 - 0.85 * fzS(0.035, 0.0, abs(edge + 0.14));
    col = mix(col * (1.0 - 0.75 * fzS(0.12, 0.0, edge)), sky, fzS(aa, -aa, edge));
  }
  vec2 lq = rot(0.5 + 0.05 * sin(t * 0.1)) * (q * zs * 0.9 + E - vec2(-0.55, -0.38)) / 0.47;
  vec4 le = fzSlice(lq, fzPx * zs * 3.0);
  col *= 1.0 - 0.5 * fzS(1.25, 0.95, length(lq));
  le.rgb *= (fzAll * (0.85 + 0.25 * lq.y) + fzLamp * 0.3) * (0.95 + 0.35 * uPhrase);
  col = mix(col, le.rgb, le.a);
  if (edge < 0.6) for (int i = 0; i < 3; i++) {
    float in_ = -fzFloe(q * zs * (i == 1 ? 0.84 - 0.08 * fzBob : 0.84) + E + wave * 0.5, i);
    if (in_ < -0.3) continue;
    float d = min(-in_, fzFloe(q * zs * 0.92 + E + wave * 0.5, i)), m = fzS(aa, -aa, d);
    if (m <= 0.0) continue;
    vec3 dark = fzTint * (vec3(0.006, 0.06, 0.075) + fzAll * 0.12 * n3);
    vec3 face = fzSky(x * 0.7 + in_ * vec2(-1.6, 1.2)) * 0.8 * fzDye(0.6) + (fzAll + fzLamp * 0.2) * 0.14;
    vec3 ice = mix(dark, face, fzS(0.0, 0.07, in_));
    ice += fzKey * (0.9 * fzS(0.014, 0.0, abs(in_ - 0.004)) * fzS(0.3, 0.6, n2) + (i == 1 ? 0.5 * uCue * fzS(0.0, 0.12, in_) : 0.0));
    col = mix(col, ice, m);
  }
  // chains: each is a spoke that runs in to the point overhead
  float turn = atan(q.y, q.x + 1e-5);
  for (int k = 0; k < 4; k++) {
    float fk = float(k), n = 7.0 + 3.0 * fk, cell = turn / TAU * n + 0.37 * fk, id = mod(floor(cell), n);
    float h1 = hash11(id + 17.0 * fk), h2 = hash11(id + 31.0 * fk + 5.0), rho = 0.3 + 0.2 * fk + 0.16 * h1, zc = rho / r;
    if (zc > zs * 1.1) continue;
    float lv = k < 3 ? band((id + 0.5) / n) : uTexture, N = 9.0 + floor(h2 * 5.0), go = mod(t * N / (8.0 + 2.0 * h1), 64.0), one = step(0.72, h2);
    float ki = floor(pow(zc / zs, 0.625) * N - go), ac = clamp((ki + 0.5 + go) / N, 0.02, 1.0), zb = zs * pow(ac, 1.6);
    float ang = (fract(cell) - 0.5 - 0.3 * (h2 - 0.5)) / n * TAU - 0.05 * sin(zb * 2.2 + h1 * 9.0 + t * 0.3) / (1.0 + fk);
    float rb = (0.006 + 0.06 * ac * ac * ac) / zb * (0.75 + 0.5 * lv + 0.3 * fzFizz);
    rb = min(rb, 0.4 * rho / (zb * zb) * zs * 1.6 * pow(ac, 0.6) / N);
    vec2 wp = rho * vec2(cos(turn - ang), sin(turn - ang)) + E;
    rb *= max(one, fzFed(ki, lv));
    rb *= fzS(0.98, 0.9, dot(wp, wp)) * fzS(1.0, 0.95, ac);
    vec2 bq = look * (cos(ang) * r - rho / zb) + vec2(-look.y, look.x) * sin(ang) * r;
    col = fzBubble(col, bq, rb, 0.8 + 0.6 * lv, -look, kindColour(h1 * 4.0) * lv);
  }
  return fzBurst(col, q, vec2(-0.45, -0.2), vec2(-0.2, -0.09), 0.19, -look);
}
vec3 render(vec2 p) {
  fzSet();
  vec3 c = uVar < 0.5 ? fzNoon(p) : fzGlassFloor(p);
  return pow(1.0 - exp(-1.9 * max(c, 0.0)), vec3(0.4545));
}
