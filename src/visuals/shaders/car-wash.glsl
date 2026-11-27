// name: Car wash
// a: Foam ropes
// b: Blower drops
// what: The view through a windscreen in a car wash: pink, yellow and pale blue foam slides down in ropes and lumps, lace at the edges, with lamps along the tunnel, a small square of daylight far off, and a great blue brush pressing in from the left; or the last stage, drops driven up the glass and a door lifting on white day.
// follows: Pad lights the left lamps, drone the right; the piece tints what is seen through. Bands feed the foam ropes or make drops glint; texture is froth and fine drops; low presses the brush or the air. A hit slaps on a fresh gob, or runs up through the drops; a cue brings the brush across, or lifts the door. Keys and the phrase light bubbles, or swell the runs.
// own: 0 dusk with an amber way out at -1, white noon at 1; 1 foam nearly rinsed off, few drops at -1, the whole glass packed at 1; 2 fine froth and small drops at -1, great bubbles and big drops at 1; 3 ropes leaning down to the left, the blower low at -1, leaning to the right, the blower high over dry glass at 1; 4 brush gone, door nearly shut at -1, brush over half the glass, door wide open at 1; 5 white soap and white lamps, fog outside at -1, violet, green and orange soap, yellow and green lamps, warm autumn outside at 1; 6 a window of many panes in place of the windscreen, the soap wiped in arcs, at -1, a round door with a turning drum of foam, or a porthole, at 1; 7 lamps of a night street beyond the glass at -1, a low sun over open water at 1 (away from 0, 6 and 7 dye the soap in the sounds' colours)
float cwPx, cwA, cwE, cwFall; // a pixel, half the picture's width (to 1.2), how strongly it answers, how far the foam has slid
vec2 cwVp, cwBr; // the far daylight, the brush's middle
float cwRad; // the brush's reach
float cwNight, cwNoon, cwPlain, cwHot; // the hour, and whether the colours are none or hot
#define cwElse min(1.5 * max(abs(uOwn[6]), abs(uOwn[7])), 1.0)
float cwS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float cwSmax(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return max(a, b) + h * h * k * .25; }
vec3 cwRich(vec3 c, float k) { c *= c; c = max(mix(vec3(dot(c, vec3(.3, .59, .11))), c, k), 0.0); return c / max(max(c.r, max(c.g, c.b)), .05); }
float cwBell(float x) { return exp(-x * x); }
// The tunnel's lamps, left and right: the pad's and the drone's.
vec3 cwLamp(float left) {
 vec3 a = mix(vec3(.95, .12, .5), cwRich(uKind[1], 1.3), .5) * (.35 + 1.5 * uPad * cwE);
 vec3 b = mix(vec3(.02, .55, .85), cwRich(uKind[0], 1.3), .5) * (.35 + 1.5 * uDrone * cwE);
 vec3 c = mix(b, a, left);
 c = mix(c, c.gbr * .6 + vec3(.4, .15, 0.0), cwHot);
 return mix(c, vec3(.8, .86, .9) * dot(c, vec3(.6)), .8 * cwPlain);
}
// The colour of a soap rope: pink, yellow, pale blue, by its number; or plain, or hotter.
vec3 cwSoap(float n) {
 float k = mod(n, 3.0);
 vec3 c = k < .5 ? vec3(.96, .3, .5) : k < 1.5 ? vec3(1.0, .7, .2) : vec3(.28, .62, .95);
 vec3 hot = k < .5 ? vec3(.5, .2, .86) : k < 1.5 ? vec3(.2, .82, .55) : vec3(1.0, .42, .14);
 c = mix(c, hot, cwHot);
 if (cwElse > 0.0) c = mix(c, cwRich(kindColour(mod(n * 2.0, 5.0)), 1.1), .85 * cwElse);
 return mix(c, vec3(.82, .86, .9), .9 * cwPlain);
}
// Beyond the glass: the lamps of a street at night, or a low sun over water.
vec3 cwBeyond(vec2 p, float soft) {
 vec4 pc = piece(vec2(sat(p.x / 1.78 + .5), sat(.5 - p.y)));
 vec3 c;
 if (uOwn[7] < 0.0) {
  float hz = exp(-abs(p.y + .04) * 5.0);
  c = vec3(.006, .009, .018) * (1.0 + 2.0 * hz) + (kindColour(2.0 + 1.7 * sin(p.x * 3.0 + 1.0)) * .10 + .02) * hz * (.6 + uLevel) * (1.0 + 2.0 * soft) + pc.rgb * pc.rgb * .5 * hz;
  if (soft < .12) for (int k = 0; k < 3; k++) {
   float fk = float(k), cell = .105 + .06 * fk, wet = step(p.y, -.12 - .03 * fk);
   vec2 q = p; q.y = wet > .5 ? (-.24 - .06 * fk - p.y) * .55 - .02 : p.y; q.x += .004 * wet * sin(p.y * 160.0);
   vec2 g = vec2(q.x + uTravel * .0012 * (1.0 + fk), q.y - .03) / cell + 7.7 * fk, id = floor(g), h = hash22(mod(id, 711.0) + 31.0 + fk), v = g - id - .5 - (h - .5) * .3;
   float y0 = (id.y + .5 - 7.7 * fk) * cell + .03, r = min(.10 + .8 * soft / cell + .10 * h.x, .31), l = length(v * mix(vec2(1.0), vec2(1.25, .85), wet)), there = cwS(.72, .9, fract(h.y * 7.3) + .62 * exp(-abs(y0 - .02) * 5.0) - .12 * fk);
   vec3 hue = mix(cwRich(kindColour(floor(h.y * 4.99)), 1.25), vec3(1.0, .78, .45), .45 * step(.5, h.x));
   there *= cwS(.0, .05, abs(p.y + .12 + .03 * fk));
   c += hue * there * (1.0 - .72 * wet) * (.25 + .5 * uLevel + 1.5 * cwE * band(h.x)) * cwS(r + .04 + cwPx / cell, r - .02 - (r - .02) * wet, l) * (.55 + .45 * cwS(.4 * r, r, l)) * .05 / (r * r * .6 + .03);
  }
 } else {
  float e = .003 + soft * .6, hz = p.y + .03;
  vec3 a = mix(cwRich(uKind[1], .8), vec3(1.0, .93, .82), .35), b = mix(uKind[0] * uKind[0], vec3(.5, .66, .8), .4);
  c = mix(a * 1.5, b * 1.0, cwS(-.02, .5, p.y)) * mix(1.0, .5, cwNight);
  vec2 q = p - vec2(.08, .075);
  float l = length(q), gl = exp(-q.x * q.x * 60.0 / (1.0 + 5.0 * max(-hz, 0.0)));
  vec3 sun = mix(vec3(1.0, .86, .6), cwRich(uKind[3], 1.0), .4);
  c += sun * (2.6 * cwS(.06 + e, .06 - e, l) + .9 * exp(-l * 7.0) * (.7 + .6 * uLevel));
  c = mix(c, a * .6 * mix(1.0, .6, cwNight), .7 * cwS(.35, .75, noise(vec2(p.x * 2.4 + uTravel * .004, p.y * 12.0))) * cwS(.02, .2, p.y));
  float w = noise(vec2(p.x * 5.0 / (.05 - min(hz, 0.0)) * .12 + 40.0, 3.0 / (.03 - min(hz, 0.0)) + mod(uTime * .25, 64.0)));
  w = mix(.5, w, exp(-4.5 * soft / (.05 - min(hz, 0.0))));
  vec3 sea = mix(b * .34, a * .62, exp(hz * 7.0)) * (.75 + .5 * w) * mix(1.0, .6, cwNight) + sun * gl * cwS(.45, .75, w + .25 * exp(hz * 10.0)) * (.9 + .8 * uLevel);
  c = mix(c, sea, cwS(e, -e, hz));
  float land = .035 + .05 * noise(vec2(p.x * 6.0 + 3.0, 1.0)) - .16 * cwS(-.55, -.1, p.x) - .02;
  c = mix(c, b * .22 + a * .05, cwS(e, -e, hz - land) * cwS(-e, e, hz + .004) * cwS(-.1, -.3, p.x));
  c = mix(c, c * (.3 + 1.1 * pc.rgb / max(pc.a, .02)), sat(pc.a) * .55 * sat(cwE));
  c = mix(c, vec3(dot(c, vec3(.35))) + .2, .6 * cwNoon) * (1.0 + .5 * uMic);
 }
 return c;
}
// The tunnel: lamps stand along both walls and cross the roof, a small square of daylight at its end; the floor is wet.
vec3 cwTunnel(vec2 p, float soft) {
 vec2 q = p - cwVp;
 float ax = abs(q.x) * .75, ay = q.y * 1.3, m = max(max(ax, ay), -q.y) + .02;
 float z = .26 / m + uTravel * .015, id = floor(z), f = fract(z) - .5, left = cwS(.05, -.05, q.x / (abs(q.y) + abs(q.x) + .02));
 float far = cwS(5.0, 1.5, .26 / m), w = .07 + soft * 1.3, side = cwS(-.1, .15, (ax - abs(ay)) / m + .5 * soft);
 float tube = exp(-f * f / (w * w)) * .13 / (w + .03) * far * (side * cwS(-.75, -.2, q.y / m) + .5 * cwS(0.0, .3, (ay - ax) / m));
 vec3 hue = cwLamp(left);
 vec3 col = mix(vec3(.01, .022, .05), vec3(.06, .016, .07), cwS(-.2, .5, p.y - .4 * p.x)) * (1.0 - .6 * cwNight);
 col += hue * (tube * (.8 + .5 * uLevel) + .16 * cwBell((m - .34) / .22) * (.4 + .6 * side));
 col = mix(col, col * .6 + vec3(.46, .52, .58), cwNoon * .8);
 // the piece: the colour seen through
 vec4 pc = piece(vec2(sat(p.x / 1.78 + .5), sat(.5 - p.y)));
 col += pc.rgb * pc.rgb * .4 * cwE * (.3 + .7 * far);
 // the way out, and its light on the air and on the wet floor
 vec3 day = mix(mix(vec3(1.0, .94, .84), vec3(1.0, .42, .1), cwNight), vec3(1.0), cwNoon) * (3.2 + 1.5 * uMic);
 vec2 k = abs(q) - vec2(.05, .042);
 float bd = length(max(k, 0.0)) + min(max(k.x, k.y), 0.0), e = .004 + soft * .22, wet = cwS(.03, .07, -q.y);
 col += day * cwS(e, -e, bd) / (1.0 + 18.0 * soft);
 bd = max(bd, 0.0);
 col += day * (.055 * exp(-bd * 22.0) + (.025 + .04 * uSpace) * exp(-bd * 5.5) + .1 * wet * exp(-q.x * q.x * 220.0 / (1.0 - 9.0 * min(q.y, 0.0)) + q.y * 4.0));
 if (uOwn[7] != 0.0) col = mix(col, cwBeyond(p, soft), cwS(0.0, .8, abs(uOwn[7])));
 return col;
}
// How much foam is at a place: below 0 none. Ropes hang from the top, each with a heavy head; the bands feed them.
vec3 cwDye; // the soap of the ropes nearest
float cwDens(vec2 p, bool dye) {
 p.x += uOwn[3] * (.5 * p.y + .1 * sin(p.y * 5.0 + 1.0));
 float W = .205, t = uTime, d = -1.0, ws = 0.0;
 if (dye) cwDye = vec3(0.0);
 float gx = floor(p.x / W), y = p.y + cwFall;
 for (int k = -1; k <= 1; k++) {
  float i = gx + float(k), h = hash11(i + 41.0), h2 = hash11(i * 1.7 + 11.3), h3 = hash11(i * 2.3 + 5.1);
  float bd = band(sat((i + 4.5) / 9.0)) * cwE;
  float cx = (i + .5 + (h - .5) * .6) * W + .035 * sin(p.y * 4.3 + h * 40.0 + t * .04) + .01 * sin(p.y * 13.0 + h2 * 30.0);
  float yb = mix(-.46, .36, h2) + .03 * sin(t * .05 + h * 20.0) - .16 * bd - .3 * uOwn[1];
  float r = W * (.1 + .3 * h3 * h3) * (1.0 + .4 * bd) + .045 * uOwn[1];
  r *= 1.0 + .34 * sin(y * 11.0 + h * 30.0) * sin(y * 4.7 + h2 * 20.0);
  r += .022 * cwBell((p.y - yb - .03) / .055) + .03 * cwS(.1, .5, p.y);
  float v = r - length(vec2(p.x - cx, max(yb - p.y, 0.0)));
  if (dye) { float w = exp(clamp(v * 55.0, -60.0, 30.0)) + 1e-27; cwDye += cwSoap(i) * w; ws += w; }
  d = cwSmax(d, v, .05);
 }
 if (dye) cwDye /= ws;
 float s = sin(p.x * 7.0 + t * .03) * .5 + sin(p.x * 17.0 + 1.0) * .25;
 float u = p.x + .24, u2 = p.x - .6;
 d = cwSmax(d, (p.y - .36 + .2 * exp(-u * u * 30.0) + .09 * exp(-u2 * u2 * 50.0) + .045 * s + .09 * uOwn[1]) * .8, .08);
 return cwSmax(d, -.35 - p.y + .05 * s + .03 * uLevel, .08);
}
// Lumps of one size. Leaves how high the foam stands, which way it faces, and its edge (above 0 inside).
float cwZ; vec2 cwG;
void cwLumps(vec2 g, float cell, float d, vec2 dg, float big, float seed) {
 vec2 id = floor(g);
 cwZ = -1.0; cwG = vec2(0.0);
 for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
  vec2 c = id + vec2(float(i), float(j)), h = hash22(mod(c, 711.0) + seed);
  vec2 v = g - (c + .5 + (h - .5) * .75);
  float dc = d - dot(dg, v) * cell;
  float r = big * (.62 + .38 * h.x) * cwS(-.2 * cell, .9 * cell, dc);
  if (r < .06) continue;
  float z = r * (1.0 - dot(v, v) / (r * r));
  float k = .3, a = sat(.5 + .5 * (z - cwZ) / k);
  cwZ = mix(cwZ, z, a) + k * a * (1.0 - a);
  cwG = mix(cwG, -2.0 * v / r, a);
 }
}
// Bubbles that stand alone: thin round skins, bright above and below.
float cwBub(vec2 g, float seed, float some, float px) {
 vec2 id = floor(g), h = hash22(mod(id, 711.0) + seed), v = fract(g) - .5 - (h - .5) * .4;
 float r = .28 * sqrt(h.x) * cwS(0.0, .5, some - h.y), l = length(v);
 if (r < px || l > r + px) return 0.0;
 float rim = cwS(r + px, r, l) * cwS(.55 * r, .97 * r, l);
 return rim * (.25 + .75 * abs(v.y) / r) + .9 * cwS(.22 * r + px, 0.0, length(v - vec2(-.35, .45) * r));
}
// The brush: wet blue felts thrown outward from a post off to the left, far out of focus.
vec3 cwBrush(vec2 p, out float cover) {
 vec2 q = p - cwBr; float r = length(q), an = atan(q.y, q.x - 1e-4);
 float spin = uTime * .07, tw = an * 7.0 + 1.6 * r;
 float s = .5 + .5 * sin(tw + spin * 7.0 + 1.2 * sin(an * 3.0 + 3.0 * spin)), s2 = .5 + .5 * sin(tw * 2.0 + spin * 14.0 + 2.0 + 2.0 * s);
 float core = cwS(.12, .55, r); s = mix(.5, s, core); s2 = mix(.5, s2, core);
 float edge = cwRad * (.95 + .045 * s + .02 * s2);
 cover = cwS(edge + .05, edge - .13, r);
 float deep = cwS(edge, edge - .3, r);
 vec3 c = mix(vec3(.006, .035, .22), vec3(.04, .25, .85), s * s2 * .9 + .2 * s2);
 c = mix(c * 1.15 + vec3(.02, .08, .14), vec3(.004, .018, .12), deep * .85) * (.8 + .9 * p.y);
 return max(c, 0.0) * (1.0 + 1.4 * uCue * cwE);
}
vec2 cwPane(vec2 p) { return (p - vec2(.02, .03)) / vec2(.40, .44) + vec2(.5, .5); }
vec3 cwFoamView(vec2 p) {
 float pr; vec3 brush = cwBrush(p, pr);
 // the brush drags what it presses into arcs
 vec2 q = p - cwBr; float r = length(q), drag = cwS(cwRad + .2, cwRad - .12, r);
 vec2 f = cwBr + rot(drag * .5) * q;
 f += .012 * vec2(sin(f.y * 9.0 + uTime * .05), sin(f.x * 8.0 - uTime * .04));
 vec2 o = p - cwVp;
 float away2 = 0.0;
 if (uOwn[6] < 0.0) {
  vec2 id = floor(cwPane(p)), pv = cwPane(p) - id - .5; float h = hash21(id + 5.0);
  f.y += uOwn[6] * .5 * (h - .5); f.x += uOwn[6] * .4 * h;
  pv -= vec2(.75 * sign(h - .5), -.6);
  away2 = -uOwn[6] * .2 * cwS(.26, .16, abs(length(pv) - .75 - .06 * noise(vec2(atan(pv.y, pv.x + 1e-4) * 12.0, h * 9.0)))) * cwS(.2, .35, h);
 }
 float turn = 0.0;
 if (uOwn[6] > 0.0) { turn = uOwn[6] * (2.6 * (.5 - length(p)) + uTime * .025); f = rot(turn) * (f - vec2(0.0, -.02)); }
 float eye = .13 * exp(-dot(o, o) / .024), away = eye + .2 * pr * (1.0 - .5 * uLow);
 float d = cwDens(f, true);
 vec2 dg = vec2(cwDens(f + vec2(.008, 0.0), false) - d, cwDens(f + vec2(0.0, .008), false) - d) / .008;
 dg += eye * 2.0 * o / .024; d -= away; d -= away2; vec3 soap = cwDye;
 // a hit: a fresh gob, sliding as it goes
 if (uHits > .01) {
  vec2 gp = p - vec2((.3 * cos(TAU * uLoop) - .1) * cwA, .02 + .12 * sin(TAU * uLoop) - .05 * (1.0 - uHits));
  float gob = .14 * sqrt(uHits) - length(gp) * (1.0 + .09 * sin(atan(gp.y, gp.x + 1e-4) * 5.0));
  gob *= 1.0 + 2.0 * max(uOwn[1], 0.0) + 1.5 * abs(uOwn[6]);
  float on = cwS(-.02, .02, gob - d);
  soap = mix(soap, mix(vec3(1.0), uKind[4], .5 + .4 * max(cwElse, cwPlain)), on); dg = mix(dg, -gp / (length(gp) + 1e-4), on); d = max(d, gob);
 }
 float fine = pow(2.0, 1.1 * uOwn[2]);
 vec2 s = f + vec2(0.0, cwFall);
 float c1 = .085 * fine, c2 = .036 * fine;
 cwLumps(s * vec2(1.0, .72) / c1, c1, d, dg * vec2(1.0, 1.39), .8, 3.0); float z1 = cwZ; vec2 g1 = cwG;
 cwLumps(rot(.6) * s / c2, c2, d, dg * rot(-.6), .74, 17.0); float z2 = cwZ; vec2 g2 = cwG * rot(.6);
 float cov = max(cwS(0.0, 3.0 * cwPx / c1 + .06, z1), cwS(0.0, 3.0 * cwPx / c2 + .1, z2));
 float body = exp(-max(d, 0.0) / .045);
 // pressed on the glass the lumps are flat, with seams between
 float q1 = max(z1, 0.0), q2 = max(z2, 0.0), p1 = exp(-q1 * 4.5), p2 = exp(-q2 * 4.5);
 vec2 rs = vec2(f.x * 30.0, s.y * 1.6);
 float run = noise(rs), run2 = noise(rs + vec2(.25, 0.0)), fibre = noise(vec2(f.x * 85.0, s.y * 3.5)) - .5;
 vec2 gr = dg * body * 1.5 + g1 * step(0.0, z1) * (.1 + .34 * p1) + g2 * step(0.0, z2) * (.05 + .34 * p2) * (.5 + uTexture) + vec2((run2 - run) * 1.1 + fibre * .5, 0.0) * cwS(-.1, .5, f.y - .1);
 if (uOwn[6] > 0.0) gr = gr * rot(turn);
 float hgt = (1.0 - body) + .35 * (1.0 - p1) + .2 * (1.0 - p2);
 // wet glass between: thin water in runs, and the film the foam left
 float film = cwS(-.1, .01, d) * (1.0 - pr);
 vec2 ref = vec2((run2 - run) * .1 + fibre * .02, (run - .5) * .02) * (.4 + film);
 vec3 glass = mix(cwTunnel(p + ref, .035 + .08 * film), brush, pr);
 vec3 soft = mix(cwTunnel(p, .22), brush * 1.5 + .02, pr);
 float lit = dot(soft, vec3(.4));
 glass += (soap * .16 + .03) * film * cwS(.35, .9, run) * (.2 + 1.5 * lit);
 // the foam by the lamps behind it and the light from above
 vec3 nrm = normalize(vec3(-gr, 1.0));
 float up = sat(.35 + .65 * dot(nrm, normalize(vec3(-.3, .8, .45))));
 vec3 key = mix(vec3(.92, .88, 1.0), vec3(.42, .36, .62), cwNight);
 vec3 alb = mix(soap, vec3(1.0), .12 + .4 * up * up);
 float seam = 1.0 - .3 * p1 * cwS(0.0, .03, d) - .14 * p2 * (1.0 - body);
 vec3 foam = alb * seam * (vec3(.02, .02, .06) + key * .8 * up * up * up + soft * (.6 + 3.2 * exp(-hgt * 1.2)));
 foam *= 1.0 + .2 * fibre;
 // froth: the small bubbles all over it
 float fr = cwBub(rot(.3) * s / (.0125 * fine), 7.0, 1.5 * run2 * noise(s * 14.0) + .1, 1.2 * cwPx / (.0125 * fine)) + cwBub(rot(1.2) * s / (.0075 * fine), 8.0, 1.6 * run, 1.2 * cwPx / (.0075 * fine));
 foam = foam * (.93 + .25 * fr) + mix(soap, vec3(1.0), .4) * fr * ((.03 + .25 * lit) * (.4 + uTexture) + .8 * uKeys);
 foam += (soap * .6 + .4) * (.9 * uKeys + .12 * uPhrase) * cwS(.45, .75, z1) * (1.0 - .6 * pr);
 foam += vec3(1.0, .97, .95) * pow(sat(dot(nrm, normalize(vec3(-.2, .5, .85)))), 50.0) * .6 * uTone * cwS(.3, .9, hgt);
 // thin foam is a lace of bubbles one sees through, thick foam is milk
 float lace = cwS(.055, 0.0, d), hole = max(cwS(.12, .45, z2) * .85, cwS(.25, .6, z1) * cwS(.03, 0.0, d) * .8);
 cov *= mix(1.0, 1.0 - hole, lace) * mix(.55 + .45 * run, 1.0, sat(hgt * 1.1));
 foam += soap * lace * (.1 + .9 * lit) * (1.0 - hole);
 // bubbles along its edges
 float near = cwS(-.055, 0.0, d) * (.3 + .7 * run);
 float bub = cwBub(s / .02 / fine, 5.0, near, 1.5 * cwPx / (.02 * fine)) + cwBub(rot(.8) * s / .011 / fine, 9.0, near * near, 1.5 * cwPx / (.011 * fine));
 glass = glass * (1.0 - .25 * sat(bub)) + bub * (soap * .4 + .5) * (.12 + .8 * lit + .3 * uTexture + 3.5 * uKeys + .8 * uPhrase);
 return mix(glass, foam, cov);
}
// b: the last stage. White day under a lifting door, two lamps of the tunnel still lit beside it.
float cwTop, cwNoz; // how high the door hangs, where the nozzle is
vec3 cwDay(vec2 q, float soft) {
 float e = .003 + soft, top = cwTop + .1 * q.x, x = abs(q.x + .06 * cwA) - .5 * min(cwA, .95), ys = q.y - top;
 // outside: sky, a line of trees, pale wet ground
 vec3 sky = mix(vec3(1.0, 1.0, .98), vec3(.5, .72, .98), cwS(.02, .4, q.y));
 sky = mix(sky, mix(vec3(1.0, .46, .16), vec3(.12, .16, .42), cwS(0.0, .3, q.y)) * .75, cwNight);
 sky = mix(sky, mix(vec3(1.0, .86, .55), vec3(1.0, .5, .36), cwS(0.0, .35, q.y)), .8 * cwHot * (1.0 - .6 * cwNight));
 vec3 day = mix(vec3(.66, .67, .66) * mix(vec3(1.0), vec3(.45, .36, .42), cwNight), sky, cwS(-.09 - e, -.07 + e, q.y));
 float crown = -.015 + .035 * sin(q.x * 7.0 + 1.0) + .018 * sin(q.x * 19.0);
 vec3 leaf = mix(vec3(.1, .26, .12), vec3(.62, .22, .04), cwHot) * mix(1.0, .35, cwNight);
 day = mix(day, leaf, cwS(e, -e, q.y - crown) * cwS(-e, e, q.y + .08) * .9 * (1.0 - cwPlain));
 day = mix(day, vec3(.9, .93, .95) * (1.0 - .5 * cwNight), .85 * cwPlain);
 // the piece hangs in the day as soft coloured panes
 vec4 pc = piece(vec2(sat(q.x / 1.2 + .5), sat(.45 - 1.3 * q.y)));
 vec3 tint = pc.rgb / max(pc.a, .02);
 day = mix(day, day * (.25 + .9 * tint * tint), sat(pc.a * 1.1) * .75 * sat(cwE));
 day *= (1.8 + .5 * cwNoon) * (.92 + .12 * uLevel);
 // inside: dark tiles, the door's slats, a lamp to each side, the wet floor
 vec3 in_ = mix(vec3(.02, .03, .045), vec3(.22, .25, .27), cwNoon) * (1.0 + q.y);
 in_ += vec3(.05, .055, .06) * (.6 + .4 * sin(q.y * 120.0) * exp(-soft * 60.0)) * cwS(e, -e, x) * cwS(-e, e, ys);
 in_ += vec3(.85, .5, .05) * (1.0 + 5.0 * uCue) * cwS(.022 + e, .022 - e, abs(ys - .02)) * cwS(e, -e, x) * .55;
 float lx = (x - .1) / (.018 + soft * .7), ly = cwS(.42 + e, .36 - e, abs(q.y - .05));
 in_ += cwLamp(step(q.x, 0.0)) * ly * (exp(-lx * lx) * (.35 + .5 * uCue) / (.35 + 4.0 * soft) + (.06 + .08 * uSpace + .25 * uCue) * exp(-abs(lx) * .35)) * cwS(-.12, 0.0, x);
 in_ += day * .35 * cwS(-.2, -.27, q.y) * exp(-max(x, 0.0) * 9.0 + (q.y + .2) * 4.0);
 float open = cwS(e, -e, x) * cwS(e, -e, ys) * cwS(-e, e, q.y + .23);
 in_ = mix(in_, day, open) + day * .05 * exp(-max(max(x, ys), 0.0) * 7.0);
 if (uOwn[7] != 0.0) in_ = mix(in_, cwBeyond(q, soft), cwS(0.0, .8, abs(uOwn[7])));
 return in_;
}
float cwScale; vec2 cwV; float cwR; // how great the drops are, the place in a drop (1 at its edge), its size
float cwDrop(vec2 u, float cell, float seed, float some, float long_, float noz) {
 vec2 g = u / cell, id = floor(g), h = hash22(mod(id, 711.0) + seed), c = id + .5;
 some -= noz * cwS(.07, -.02, (c.y + 2.0 * (fract(h.x * 23.7 + h.y) - .5)) * cell - cwNoz / cwScale);
 float there = cwS(some, some - .12, fract(h.y * 11.7));
 c.x += .035 * sin(uTime * (1.3 + h.y) + h.x * 40.0) * (.25 + uHigh) * long_;
 float r = .12 + .28 * h.x * h.x;
 c += (fract(h * 23.7) - .5) * 2.0 * max(.39 - r, 0.0);
 r *= there;
 cwR = cell * r;
 if (r < .02 || cwR < cwPx) return 1e9;
 vec2 v = (g - c) / r;
 v += .14 * vec2(sin(v.y * 2.3 + h.x * 20.0), sin(v.x * 2.1 + h.y * 31.0));
 v.x *= 1.0 - .16 * v.y * long_;
 cwV = v;
 return length(v);
}
vec3 cwDrops(vec2 p) {
 // over the nozzle the drops are drawn out upward; under it the glass is all but dry
 float over = p.y - cwNoz, blow = exp(-max(over, 0.0) / .22) * (.75 + .35 * uLow), long_ = .35 + blow, many = .6 + .34 * uOwn[1];
 cwScale = pow(2.0, .8 * uOwn[2]);
 vec2 u = vec2((p.x - .05) * (1.15 - .35 * over), p.y - .115 * (1.0 - exp(-max(over, 0.0) / .18))) / cwScale;
 float d = 9.0, R = .1, near = 9.0; vec2 V = vec2(0.0);
 // runs driven upward, two arms meeting in one
 float W = .145, gx = floor(p.x / W), track = 0.0;
 for (int k = -1; k <= 1; k++) {
  float i = gx + float(k), h = hash11(i + 3.0), h2 = hash11(i + 77.0);
  float cyc = fract(uTime / (34.0 + 24.0 * h) + h2), yh = cwNoz + (1.25 - cwNoz) * cyc - .1;
  float x0 = p.x - ((i + .3 + .4 * h) * W + .016 * sin(p.y * 9.0 + h * 30.0) + .006 * sin(p.y * 27.0 + h2 * 9.0 + .6 * sin(uTime * 2.1 + h * 9.0) * uHigh));
  float arm = .055 * (.4 + h2) * (1.0 - exp(-max(yh - .16 - .12 * h - p.y, 0.0) * 7.0)), below = yh - p.y;
  float x1 = abs(x0) - arm, r = (.0125 * exp(-max(below, 0.0) * 14.0) + .0052) * (.75 + .35 * sin(p.y * 47.0 + h * 9.0)) * (1.0 + .5 * max(uKeys, uPhrase) * step(.5, h2)) * cwS(0.0, .06, cyc);
  r *= cwS(.55, .25, below) * cwS(-.03, .03, over) + 1e-3;
  float dd = length(vec2(x1, max(-below, 0.0))) / r;
  track = max(track, exp(-dd * dd * .03) * cwS(0.0, .004, r));
  near = min(near, dd);
  if (dd < 1.0 + 2.0 * cwPx / r && r > .5 * cwPx && dd < d) { d = dd; V = vec2((arm > .012 ? x1 * sign(x0) : x0) / r, .5 - .4 * exp(-max(below, 0.0) * 30.0)); R = r; }
 }
 for (int k = 0; k < 4 && d > 1.0; k++) {
  float fk = float(k), cell = k == 0 ? .16 : k == 1 ? .074 : k == 2 ? .034 : .0165;
  float e = cwDrop(u + vec2(.17 * fk, 0.0), cell, 3.0 + 13.0 * fk, (k == 0 ? many - .2 : many + .06 * fk) - (k > 1 ? 1.2 * track + .12 - .25 * uTexture : 0.0), long_, k < 2 ? 1.0 : .22);
  // a drop gives way to the greater one beside it
  float own = e; e += 1.5 * cwS(1.45, 1.05, near); near = min(near, own);
  if (e < 1.0 + min(2.0 * cwPx / max(cwR, 1e-5), .6)) { d = e; V = cwV; R = cwR; break; }
 }
 // a hit: one great drop lands and is driven up
 if (uHits > .01) {
  float rr = .065 * sqrt(uHits);
  vec2 v = (p - vec2((.34 * cos(TAU * uLoop) - .05) * cwA, .1 + .09 * sin(TAU * uLoop) + .06 * (1.0 - uHits))) / rr;
  v.x *= 1.0 - .2 * v.y; v += .1 * sin(v.yx * 2.6);
  float e = length(v);
  if (e < 1.0 + 2.0 * cwPx / rr) { d = e; V = v; R = rr; }
 }
 vec3 bg = cwDay(p, mix(.075, .04, uTone));
 // the nozzle: a dark duct across the glass, out of focus, with its bright slot
 float n = (over + .055 + .04 * p.x) / .055, nk = cwS(1.35, .75, abs(n)) * cwS(.62, .5, p.x / cwA) * (1.0 - cwElse);
 bg = mix(bg, vec3(.02, .026, .034) + vec3(.2, .24, .28) * cwBell((n - .35) * 2.6), .93 * nk);
 bg *= 1.0 - .1 * track;
 vec3 col = bg;
 if (d < 9.0) {
  float l2 = min(d * d, 1.0);
  vec3 c = cwDay(vec2(p.x * .2 - .03, .02) - V * vec2(.6, .4) * (.7 + .45 * l2), .012 + min(cwPx / R * .5, .1));
  c *= mix(1.0, .28, cwS(.55, 1.0, d) * cwS(-.9, .5, V.y)) * 1.05;
  vec2 g = V - vec2(-.3, .48);
  // a hit runs up through the drops as a gust of light
  float gust = uHits * cwBell((over - .05 - .75 * (1.0 - uHits)) / .1);
  c += (exp(-dot(g, g) * 40.0) * (.2 + .5 * uTone + 1.5 * band(sat(p.x / 1.6 + .5)) * cwE) + gust * cwS(.4, 1.0, d) * 1.6);
  c = mix(bg, c, .35 + .65 * cwS(.0015, .007, R));
  col = mix(bg * mix(.75, 1.0, cwS(1.0, 1.25, d)), c, cwS(1.0 + cwPx / R, 1.0 - cwPx / R, d));
 }
 return col;
}
// The car: the dash along the bottom, the pillar cut by the right edge.
vec3 cwCar(vec2 p, vec3 col) {
 float bow = p.x / cwA + .15, dash = p.y + .425 + .05 * bow * bow + .4 * abs(uOwn[6]);
 float pil = (p.x - cwA * .86) * .93 + (p.y - .1) * .36 * cwA - .9 * abs(uOwn[6]);
 float m = max(-dash, pil);
 float k = cwS(-.006, .006, m);
 vec3 body = vec3(.007, .007, .011) + mix(vec3(.012, .03, .06), vec3(.06, .05, .05), cwBell((p.x - cwVp.x) / .22)) * exp(-max(m, 0.0) * 34.0);
 col *= 1.0 - .5 * exp(min(m, 0.0) * 26.0);
 col = mix(col, body, k);
 vec3 room = mix(mix(uKind[0] * uKind[0], vec3(.5), .35), vec3(.8), .5 * cwNoon) * mix(.16, .55, cwNoon) * (1.0 - .7 * cwNight);
 if (uOwn[6] < 0.0) {
  // glazing bars
  vec2 g = cwPane(p), v = abs(fract(g) - .5), dd = (.5 - v) * vec2(.40, .44), w = -uOwn[6] * vec2(.016, .018);
  float e = min(dd.x - w.x, dd.y - w.y), in2 = cwS(1.5 * cwPx, -1.5 * cwPx, e), lit = dd.x - w.x < dd.y - w.y ? sign(fract(g.x) - .5) : sign(.5 - fract(g.y));
  col *= 1.0 - .55 * exp(-max(e, 0.0) * 60.0) * -uOwn[6];
  col = mix(col, room * (.7 + .5 * lit * cwS(-.004, -.010, e) * cwS(-.017, -.011, e) + .25 * noise(p * vec2(90.0, 90.0))) + .05 * cwS(-.003, 0.0, e), in2);
 }
 if (uOwn[6] > 0.0) {
  // a round rim, bolted
  float R = .43 + 1.1 * (1.0 - uOwn[6]), l = length(p), an = atan(p.y, p.x + 1e-5), u = (l - R) / .095;
  vec2 n2 = p / max(l, 1e-3);
  float nn = clamp(u * 2.0 - 1.0, -1.0, 1.0), lam = dot(normalize(vec3(n2 * nn, sqrt(max(1.0 - nn * nn, 0.0)) + .2)), normalize(vec3(-.35, .7, .5)));
  col *= 1.0 - .6 * exp(-max(R - l, 0.0) * 30.0);
  vec3 ring = room * (.25 + 1.1 * max(lam, 0.0)) + .9 * pow(max(lam, 0.0), 14.0) * (.3 + room);
  float ba = an / TAU * 12.0, bx = (fract(ba) - .5) * TAU / 12.0 * l, bolt = length(vec2(bx, l - R - .0475));
  ring *= 1.0 - .5 * cwS(.016, .012, bolt) * cwS(.008, .012, bolt) + .25 * cwS(.012, .004, bolt);
  vec3 wall = room * (.55 + .25 * p.y) * (1.0 - .5 * exp(-max(u - 1.0, 0.0) * 1.2) * (1.0 - .5 * n2.y));
  col = mix(col, u > 1.0 ? mix(ring, wall, cwS(1.0, 1.0 + 2.0 * cwPx / .095, u)) : ring, cwS(-1.5 * cwPx, 1.5 * cwPx, l - R));
 }
 return col;
}
vec3 render(vec2 p) {
 cwPx = 1.0 / uRes.y;
 cwNight = cwS(0.0, 1.0, -uOwn[0]); cwNoon = cwS(0.0, 1.0, uOwn[0]); cwPlain = cwS(0.0, 1.0, -uOwn[5]); cwHot = cwS(0.0, 1.0, uOwn[5]);
 cwA = min(.5 * uRes.x / uRes.y, 1.2);
 cwE = .35 + 1.3 * uEnergy;
 cwFall = uTime * .003 + uTravel * .006;
 cwVp = vec2(.22 * cwA, .015);
 float sweep = 4.0 * uCue * (1.0 - uCue);
 cwBr = vec2(-cwA - .34 + .5 * sweep * cwA, .02);
 cwRad = .34 + .52 * cwA + .06 * uLow + .02 * sin(uTime * .11) + .35 * uOwn[4];
 cwTop = .2 + .02 * sin(uTime * .05) + .23 * uOwn[4] + .1 * sweep;
 cwNoz = -.22 + .04 * sin(uTime * .04) + .24 * uOwn[3] + .05 * sweep;
 vec3 col;
 if (uVar < .5) col = cwFoamView(p); else col = cwDrops(p);
 col = cwCar(p, col);
 col = screenOf(col * (1.0 - .3 * dot(p, p)));
 col = max(mix(vec3(dot(col, vec3(.3, .5, .2))), col, 1.2), 0.0);
 return mix(col, col * col * (3.0 - 2.0 * col), .6);
}
