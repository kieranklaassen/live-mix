// name: Burnt gate
// a: Through the heat
// b: Melted sheet
// what: A frame of old amber and rose film has stopped in the gate and burns: gold halos, bubbles, black crusts, and holes where the bare lamp comes through; or a creased sheet of white plastic before a grey wall melts from the heat behind it, its holes sagging into drops with glossy, charred rims, torn films and threads.
// follows: Strokes burn where they lie, more as they sound; pads open two big holes, a phrase a line; the drone browns the border or the foot. Texture boils the film or blisters the sheet; bands swell bubbles or the heat. The loop carries the heat; a hit burns at the playing place, a cue in the middle; keys prick pinholes, a voice lights rims or folds.
// own: 0 1 many small holes, -1 few great ones; 1 1 holes drawn out into tall slits, -1 clean and round as if punched; 2 what lies beyond: 1 a night of stars, -1 a bright sky in the phrase's and the hit's colours; 3 the sheet: 1 in the colours of the kinds, -1 pale scorched paper (b: glossy black); 4 the rims: 1 white with frost in place of char, -1 bare and cut clean with no bubbles; 5 a: 1 many small frames of a strip, -1 no frame, cracked all over like old glaze; b: 1 a hung curtain in long folds, -1 pulled smooth and cracked; 6 1 paper under paper, steps of colour down into each hole, -1 turned about: only islands of it are left where sounds are; 7 1 dark, the rims alight as embers, -1 pale smoke rises over it
float bgK, bgClean, bgFrost, bgBare, bgEmber, bgNew;
vec2 bgG;      // which way leads away from the nearest hole
vec3 bgHue;    // the colour of the sound that burns here
float bgHitD;  // how far the hole of a hit is
// One spot of heat joins the field: it opens as r grows past 0; in the sheet it sags into a drop.
void bgJoin(inout float d, vec2 v, float r, vec3 hue, float k) {
  vec2 v0 = v;
  if (uVar > .5) {
    v.x *= .95 + .6 * smoothstep(-.9, 1.5, v.y / (abs(r) + .05));
    v.y = .64 * v.y + .02;
  }
  if (bgClean > .0) v = mix(v, v0, bgClean);
  if (uOwn[1] > .0) v = rot(.3 * uOwn[1]) * v * vec2(1.0 + 1.5 * uOwn[1], 1.0 - .3 * uOwn[1]);
  float l = length(v), di = l - r, h = sat(.5 + .5 * (di - d) / k);
  vec2 g = v / (l + .012);
  d = mix(di, d, h) - k * h * (1.0 - h);
  bgG = mix(g, bgG, h); bgHue = mix(hue, bgHue, h);
}
// A soft step from a to b, whichever is larger.
float bgS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float bgEase(float x) { return x * x * (3.0 - 2.0 * x); }
// How far a place is from the nearest hole (below 0 is inside it).
float bgField(vec2 p, float X) {
  vec2 cell = vec2(.25, uVar < .5 ? .25 : .31) * bgK, id0 = floor(p / cell);
  float d = .3; bgG = vec2(.0, 1.0); bgHue = vec3(.6, .35, .15);
  // the piece: a jittered scatter of spots, each as hot as the sound at its place
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j)), h = hash22(id + 3.7);
    vec2 c = (id + .5 + .62 * (h - .5)) * cell, uv = vec2(.5 + .5 * c.x / X, .5 - .95 * c.y), far = (p - c) * vec2(1.0, uVar < .5 ? 1.0 : .64);
    if (dot(far, far) > .17 * bgK * bgK) continue;
    vec4 m = piece(uv);
    if (m.a < .004) continue;
    float w = abs(fract(uv.x - uLoop + .5) - .5), k = fract(h.x * 7.3 + h.y * 3.1);
    float a = m.a * (.62 + .4 * exp(-w * w * 26.0) + .3 * uEnergy);
    float r = -.22 + .16 * smoothstep(.0, .2, a) + (.07 + .1 * k * k) * smoothstep(.05 + .25 * h.x, .7 + .3 * h.x, a);
    bgJoin(d, p - c, r * bgK + .003 * sin(uTime * .23 + h.y * 40.0), m.rgb / m.a, .05 * bgK);
  }
  float s = X / .89;
  // pads: two large slow holes
  if (uPad > .0) {
    float e = bgEase(uPad), side = uVar < .5 ? s : -s;
    bgJoin(d, p - vec2(-.4 * side, .12), (-.22 + .37 * e) * bgK, uKind[1], .07);
    bgJoin(d, p - vec2(.47 * side, -.17), (-.22 + .31 * e) * bgK, uKind[1], .07);
  }
  // a phrase: a burnt line
  if (uPhrase > .0) {
    float y = p.y - .3 - .045 * sin(p.x * 3.4 + .8) - .02 * sin(p.x * 9.0), x = p.x / s + .15;
    if (uVar > .5) y = p.y - .17 - .55 * x * x - .02 * sin(p.x * 8.0);
    bgJoin(d, vec2(max(abs(p.x - .12 * s) - .46 * s, .0), y * 1.3), -.22 + (.19 + .06 * noise(vec2(p.x * 11.0, 3.0))) * bgEase(uPhrase), uKind[3], .04);
  }
  // the keys: four pinholes
  if (uKeys > .0) for (int i = 0; i < 4; i++) {
    float fi = float(i);
    bgJoin(d, p - vec2((.62 - .37 * fi) * s, .04 + .19 * sin(fi * 2.4 + .7)), -.22 + .232 * uKeys, uKind[3], .03);
  }
  // a hit: one hole at the playing place; a cue: a great one from the middle
  float ring = 1.94 * X;
  vec2 at = p - vec2((uLoop - .5) * ring, .04);
  at.x -= ring * floor(at.x / ring + .5);
  float t = 1.0 - uHits;
  bgHitD = length(at);
  if (uHits > .0) bgJoin(d, at, -.22 + .33 * smoothstep(.0, .35, t) * bgS(1.0, .6, t), uKind[4], .05);
  if (uCue > .0) bgJoin(d, p, -.22 + .43 * 4.0 * uCue * (1.0 - uCue), uKind[4], .07);
  if (uOwn[6] < .0) { float k = bgS(.0, 1.0, -uOwn[6]); d = mix(d, .085 - d, k); bgG *= 1.0 - 2.0 * k; }
  return d;
}
// What lies beyond the sheet: a night of stars, or a bright sky.
vec3 bgBeyond(vec2 p, vec3 was) {
  float night = max(uOwn[2], .0), day = max(-uOwn[2], .0), cloud = noise(p * vec2(2.2, 4.0) + vec2(uTravel * .01, 3.0)) * .6 + noise(p * vec2(5.0, 11.0) + 7.0) * .4;
  vec3 k0 = uKind[0] * uKind[0], k1 = uKind[1] * uKind[1], k2 = uKind[2] * uKind[2], k3 = uKind[3] * uKind[3], k4 = uKind[4] * uKind[4];
  if (night > .0) {
    vec2 g = p * 30.0, h = hash22(floor(g) + 5.0), v = fract(g) - .15 - .7 * h;
    float n = fract(h.x * 41.0);
    vec3 sky = .004 + (.05 + .32 * cloud * cloud) * k0 + .04 * k1 * bgS(.5, .8, cloud);
    sky += (.5 + .5 * k2) * bgS(.11, .0, length(v)) * n * n * n * n * 1.6 * (.8 + .3 * uHigh);
    was = mix(was, sky, night);
  }
  if (day > .0) was = mix(was, mix(k3, k4, sat(.5 + p.y * 1.1 + .3 * (cloud - .5))) * (.8 + .2 * uLevel) + .3 * bgS(.45, .8, cloud), day);
  return was;
}
// Steps of paper down into a hole; u counts them.
vec3 bgSteps(vec3 was, float u, float shade) {
  float i = floor(u), f = fract(u);
  vec3 k = mix(uKind[int(mod(i + 1.0, 5.0))], uKind[int(mod(i + 2.0, 5.0))], bgS(.9, 1.0, f));
  return mix(was, k * k * (.35 + .65 * bgS(.0, .55, f) * bgS(1.0, .9, f)) * (1.05 - .1 * i) * shade + .16 * k * bgS(.1, .02, f) * shade, uOwn[6] * step(u, 4.0));
}
// Cracks, as in old glaze: how deep one is here.
float bgCracks(vec2 p) {
  vec2 q = p * 9.0 + .5 * vec2(noise(p * 6.0), noise(p * 6.0 + 20.0)), id = floor(q), far = vec2(9.0);
  for (int j = 0; j < 9; j++) {
    vec2 k = id + vec2(float(j % 3), float(j / 3)) - 1.0, v = q - k - hash22(k + 41.0);
    float l = dot(v, v);
    far = l < far.x ? vec2(l, far.x) : vec2(far.x, min(far.y, l));
  }
  return bgS(.09, .01, sqrt(far.y) - sqrt(far.x));
}
// Smoke that rises over it, thickest over the holes.
vec3 bgSmoke(vec3 c, vec2 p, float d) {
  float k = -uOwn[7], t = uTime * .05;
  vec2 q = p * vec2(2.6, 1.5) + vec2(.35 * sin(p.y * 4.0 - t * 4.0), -t * 1.6);
  q += .6 * (vec2(noise(q * 1.7), noise(q * 1.7 + 30.0)) - .5);
  float s = noise(q * 1.3) * .55 + noise(q * 3.1 + 4.0) * .3 + noise(q * 7.0) * .15;
  s = bgS(.3, .78, s + .14 * p.y) * (.75 + .25 * bgS(.2, .0, d));
  return mix(c, .22 + .75 * uKind[1] * uKind[1] + .1 * s, k * .8 * s);
}
// Bubbles packed side by side: xy leads from the middle of the nearest (1 at its rim), z is its number.
vec3 bgFoam(vec2 q, float swell) {
  vec2 id0 = floor(q); float a = 9.0; vec3 o = vec3(.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j)), h = hash22(id + 11.3);
    vec2 v = q - id - .5 - .8 * (h - .5) - .06 * vec2(sin(uTime * .31 + h.y * 30.0), cos(uTime * .27 + h.x * 30.0));
    float r = .16 + .34 * h.x * h.y + swell * (.16 + .1 * sin(uTime * (.4 + .4 * h.x) + h.y * 20.0)), f = length(v) - r;
    if (f < a) { a = f; o = vec3(v / r, h.y); }
  }
  return o;
}
// How a bubble of melted film bends the lamp: x its dark wall, y what shines through, z a glint. soft is how flat it lies.
vec3 bgLens(vec2 v, float soft) {
  float e = length(v), in_ = bgS(1.04, .96, e);
  float dirn = dot(v, vec2(-.55, .83)) / (e + 1e-3);
  float wall = smoothstep(mix(.55, .8, soft), 1.0, e) * bgS(1.16, 1.0, e) * (.75 + .3 * dirn);
  float light = in_ * (.3 * (1.0 - e * e) + smoothstep(.3, .75, e) * bgS(.98, .8, e) * bgS(.1, -1.0, dirn));
  vec2 k = v - vec2(-.32, .45);
  return vec3(wall, light, in_ * exp(-dot(k, k) * 60.0) * (1.0 - soft));
}
// a: the frame stopped in the gate
vec3 bgFilm(vec2 p, float px, float X) {
  float A = .5 * uRes.x / uRes.y, s = X / .89;
  vec2 o = rot(.5) * p;
  float creep = uTravel * .012;
  vec2 n1 = vec2(noise(o * 5.0 + vec2(creep, 1.7)), noise(o * 5.0 + vec2(8.3, -creep))) - .5;
  vec2 n2 = vec2(noise(o * 19.0 + 3.1), noise(o * 19.0 + vec2(17.0, creep * 3.0))) - .5;
  float d = bgField(p + (n1 * .1 + n2 * .03) * (1.0 - bgClean), X);
  // the gate: a rounded opening
  vec2 b = abs(p) - vec2(A - .03, .472) + .05;
  float gate = length(max(b, .0)) + min(max(b.x, b.y), .0) - .05;
  vec2 frame = vec2(.0);
  if (uOwn[5] > .0) { // a strip of many frames, with the holes that carry it
    vec2 g = p / vec2(.46, .34) + vec2(.5, .5); frame = floor(g);
    vec2 v = (fract(g) - .5) * vec2(.46, .34), e = abs(v) - vec2(.23, .17) + .045 - .065 * (1.0 - uOwn[5]) - vec2(.0, -.015) * uOwn[5];
    e.y += .012 * uOwn[5];
    float g2 = length(max(e, .0)) + min(max(e.x, e.y), .0) - .014;
    gate = max(gate, g2);
  }
  if (uOwn[5] < .0) gate -= .35 * -uOwn[5];
  // the picture on the film: old orange under rose, out of focus
  float u = sat(p.y + .5 + .1 * p.x + .2 * (noise(p * 1.6 + 4.0) - .5) + (uOwn[5] > .0 ? bgS(.4, .7, uOwn[5]) * .5 * (hash21(frame + 9.0) - .5) : .0));
  vec3 film = mix(vec3(.55, .07, .005), vec3(1.1, .34, .025), smoothstep(.0, .4, u));
  film = mix(film, vec3(.78, .17, .075), smoothstep(.36, .72, u));
  film = mix(film, vec3(.3, .05, .06), smoothstep(.66, 1.08, u));
  vec3 k0 = uKind[0] * uKind[0], k1 = uKind[1] * uKind[1], k2 = uKind[2] * uKind[2], k3 = uKind[3] * uKind[3];
  float own3 = max(uOwn[3], .0), paper = max(-uOwn[3], .0);
  if (own3 > .0) film = mix(film, mix(mix(k0, k1, smoothstep(.05, .5, u)), k2, smoothstep(.5, 1.0, u)) * 1.15, own3);
  if (paper > .0) film = mix(film, vec3(.86, .79, .64) * (.35 + .65 * uKind[1]) * (.9 + .12 * noise(p * 90.0) + .16 * noise(p * vec2(9.0, 40.0))), paper);
  film *= .75 + .6 * noise(p * 2.6 + 9.0) * noise(p * 1.3);
  if (uOwn[5] < .0) film *= 1.0 + .85 * uOwn[5] * bgCracks(p);
  // tired film: fine upright scratches
  for (int i = 0; i < 3; i++) {
    float fi = float(i), x = p.x - s * (-.63 + .55 * fi) - .004 * sin(p.y * 2.0 + fi * 2.0);
    if (abs(x) < px) film += vec3(.55, .3, .12) * .2 * (1.0 - bgNew) * bgS(px, .0, abs(x)) * smoothstep(.35, .75, noise(vec2(fi * 7.0, p.y * 5.0)));
  }
  film = mix(film, film * (.3 + 1.3 * bgHue), .5 * bgS(.2, .0, d));
  vec2 lp = (p - vec2(-.42 * X * cos(TAU * uLoop), .03)) * vec2(.8, 1.15);
  float lamp = .5 + 1.15 * exp(-dot(lp, lp) * 3.4);
  // heat before the burn: the dyes fade to gold, then brown; the drone browns the border
  float w = .7 + .6 * uSpace;
  film = mix(film, mix(mix(vec3(1.3, .4, .035), k2 * 1.3, own3), vec3(.8, .95, 1.05), bgFrost), .4 * (1.0 - bgBare) * bgS(.18 * w, .05 * w, d));
  float rim = (-gate + .06 * noise(p * 6.0) + .03 * n2.y) / (.06 + .4 * uDrone);
  float border = exp(-max(rim, .0) * 1.6) * (.25 + .75 * sat(uDrone * 2.4)), brown = bgS(.085 * w, .015, d) * (1.0 - bgBare);
  film *= mix(vec3(1.0), mix(mix(vec3(.15, .045, .025), .06 + .25 * k0, own3), vec3(.95, 1.05, 1.15), bgFrost), max(brown, border));
  // bubbles
  float bx = band(.5 + .5 * p.x / X);
  float heat = d < .17 ? bgS(.1 + .06 * uTexture, .01, d) * (.55 + .9 * noise(p * 7.0 + 2.0)) : .0;
  vec3 f1 = vec3(2.0, .0, .0), f2 = f1;
  if (d < .17) f1 = bgFoam((p + n1 * .03 + n2 * .008) * 18.0, .1 + .7 * bx + .5 * uTexture);
  if (d < .08) f2 = bgFoam(p * 46.0 + n1 * 3.0 + n2, .4 + .5 * bx);
  float big = smoothstep(.15, .5, heat - .35 * f1.z), small = bgS(.055 + .02 * uTexture, .01, d) * (1.0 - bgBare);
  big *= 1.0 - bgBare;
  vec3 l1 = bgLens(f1.xy, .8 - .6 * f1.z) * big, l2 = bgLens(f2.xy, .3) * small;
  vec3 gold = mix(vec3(1.3, .4, .03), vec3(.75, .15, .01), brown) * (.3 + .7 * lamp);
  if (own3 > .0) gold = mix(gold, mix(k2, k1, .3) * (.3 + .7 * lamp), own3);
  if (bgFrost > .0) gold = mix(gold, vec3(.55, .68, .78) * lamp, bgFrost);
  film *= (1.0 - .7 * l1.x) * (1.0 - .75 * l2.x);
  film += gold * (.6 * l1.y + .4 * l2.y) + vec3(.9, .6, .3) * (.5 * l1.z + .5 * l2.z);
  // three blisters that swell and sink under the skin, always
  for (int i = 0; i < 3; i++) {
    float fi = float(i), sw = .5 + .5 * sin(uTime * (.16 + .03 * fi) + fi * 2.2 + .6);
    vec2 c = vec2((.33 - .17 * fi * fi + .09 * fi) * s, -.14 + .27 * fi - .16 * fi * fi);
    if (dot(p - c, p - c) > .004) continue;
    vec3 l = bgLens((p - c + n2 * .006) / ((.034 - .007 * fi) * (.75 + .25 * sw)), .2) * (.4 + .6 * sw) * smoothstep(.02, .09, d) * (1.0 - bgBare);
    film *= 1.0 - .75 * l.x;
    film += gold * l.y * .6 + vec3(.9, .7, .4) * l.z * .4;
  }
  // the crust and the hole, its rim bitten by burst bubbles
  float bite = max(.5 - length(f1.xy) * .5, .0) * .03 + max(.5 - length(f2.xy) * .5, .0) * .018;
  float hole = d - bite * (1.0 - bgBare) * (1.0 - bgClean) + .006;
  float crust = bgS(.034 + .05 * max(n2.x + .1, .0) + .03 * n1.y, .006, hole);
  crust *= 1.0 - bgBare;
  if (bgFrost > .0) { film = mix(film, vec3(.8, .88, .93) * (.55 + .6 * noise(p * 60.0)) * (.8 + .5 * n2.y), bgFrost * max(crust, .6 * bgS(.1, .0, hole + .1 * n2.x))); crust *= 1.0 - bgFrost; }
  film *= 1.0 - .97 * crust * (1.0 - .5 * l2.y - .4 * l1.y);
  if (bgBare > .0) film *= 1.0 - .35 * bgBare * bgS(.03, .0, hole);
  vec3 col = film * mix(lamp, .35 + .5 * lamp, paper);
  if (bgEmber > .0) col *= 1.0 - .88 * bgEmber;
  // light spills from the hole over the crust and into the film
  col += mix(mix(vec3(.75, .16, .015), k2 * .6, own3), vec3(.2, .3, .36), bgFrost) * (1.0 - bgBare) * (.5 * exp(-max(hole, .0) * 110.0) + .1 * exp(-max(hole, .0) * 8.0)) * bgS(.2, .0, d) * (.6 + .6 * uMic);
  // the hole: a lip of clear melted base, strands of it, then the bare lamp
  vec3 white = mix(vec3(1.0, .84, .55), vec3(.97, .95, .9), uTone) * 2.2 * (.62 + .28 * lamp);
  if (uOwn[2] != .0) white = bgBeyond(p, white);
  if (bgEmber > .0) white *= 1.0 - .93 * bgEmber;
  float lip = exp(min(hole, .0) * (90.0 + 160.0 * n2.y)), deep = bgS(-.005, -.07, hole);
  if (bgBare > .0) lip *= 1.0 - bgBare;
  float str = hole < px ? abs(noise(p * 13.0 + n2 * 1.5) - .5) : 1.0;
  float web = bgS(.035, .015, str) * smoothstep(-.045, -.004, hole);
  vec3 through = mix(white * vec3(1.0, .86, .66), white, deep);
  through *= mix(vec3(1.0), mix(mix(vec3(1.0, .36, .05), k3, own3), vec3(.7, .88, 1.0), bgFrost), sat(lip));
  through *= mix(vec3(1.0), mix(vec3(.5, .16, .03), vec3(.7, .85, .95), bgFrost), web * .9 * (1.0 - bgBare));
  if (uOwn[6] > .0) through = bgSteps(through, max(-hole, .0) / (.026 * sqrt(bgK)) + .3 * n1.y * (1.0 - bgClean), .6 + .6 * lamp);
  col = mix(col, through, bgS(px, -px, hole));
  // flame: the first instant of a hit and of a cue
  col += (vec3(1.6, .6, .1) + uKind[4] * .5) * uHits * ((1.0 + 2.2 * pow(uHits, 4.0)) * exp(-bgHitD * bgHitD * 120.0) + .8 * exp(-abs(hole) * 50.0) * bgS(.3, .1, bgHitD));
  col += vec3(1.3, .5, .1) * uCue * exp(-dot(p, p) * 30.0);
  if (bgEmber > .0) {
    float run = noise(vec2(p.x * 9.0 + 3.0, p.y * 9.0 - uTime * .07)) * noise(p * 23.0 + uTime * .05);
    col += bgEmber * (uKind[4] * uKind[4] * vec3(1.6, .6, .25) + vec3(.5, .06, .0)) * (exp(-abs(hole) * 90.0) * (.3 + 4.0 * run) + .12 * exp(-abs(hole) * 14.0)) * (.7 + .6 * uLevel);
  }
  if (uOwn[7] < .0) col = bgSmoke(col, p, hole);
  // the gate, and a hair caught in it
  vec2 hp = p - vec2(.56 * s, -.472);
  float hair = abs(hp.x + .05 * sin(hp.y * 26.0) - hp.y * .6) / 1.35;
  col *= 1.0 - .8 * (1.0 - bgNew) * bgS(.0022 + px, .0012, hair) * bgS(.13, .11, hp.y);
  col *= bgS(.004, -.01, gate + .006 * n2.x);
  if (uOwn[5] > .0) { // the lit holes between two rows of frames
    vec2 v = vec2(fract(p.x / .0575) - .5, fract(p.y / .34) - .5) * vec2(.0575, .34);
    v.y = abs(v.y); v = abs(v) - vec2(.014, .009);
    col += uOwn[5] * vec3(.5, .45, .38) * mix(vec3(1.0), 2.0 * k1, own3) * lamp * (1.0 - .8 * bgEmber) * bgS(px, -px, max(v.x, v.y)) * bgS(.4, .9, uOwn[5]) * bgS(.5, .49, abs(p.y));
  }
  return screenOf(col + vec3(.006, .004, .003));
}
// Noise with its slope: x the value, yz the slope.
vec3 bgN(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash21(i), b = hash21(i + vec2(1, 0)) - a, c = hash21(i + vec2(0, 1)) - a, k = hash21(i + vec2(1, 1)) - a - b - c;
  return vec3(a + b * u.x + c * u.y + k * u.x * u.y, du * (vec2(b, c) + k * u.yx));
}
// A crease where the noise is in its middle, with its slope.
vec3 bgRidge(float n, vec2 g, float soft) { n = 2.0 * n - 1.0; float r = sqrt(n * n + soft); return vec3(1.0 - r, -2.0 * n / r * g); }
// The folds of the sheet at a place, with their slope: long hanging ones and a fine crumple.
vec3 bgFold(vec2 q) {
  mat2 Ru = rot(.6), Rk = rot(1.9), Rw = rot(.35), Rc = rot(-.7), Re = rot(1.1);
  vec3 bend = bgN(Ru * q * 2.3 + 3.0), kink = bgN(Rk * q * 6.0);
  bend.yz = bend.yz * Ru * 2.3; kink.yz = kink.yz * Rk * 6.0;
  vec2 w = Rw * q + vec2(.3 * bend.x + .05 * kink.x, .0);
  vec2 push = .3 * bend.yz + .05 * kink.yz, wx = vec2(1, 0) * Rw + push, wy = vec2(0, 1) * Rw;
  vec3 a = bgN(vec2(w.x * 4.2, w.y * 1.1 + 2.0 * bend.x)), b = bgN(vec2(w.x * 8.5 + 4.0, w.y * 1.9 + bend.x));
  a.yz = a.y * 4.2 * wx + a.z * (1.1 * wy + 2.0 * bend.yz);
  b = bgRidge(b.x, b.y * 8.5 * wx + b.z * (1.9 * wy + bend.yz), .004);
  vec2 k = Rc * q * 9.0 + 2.8 * bend.x + .6 * kink.x;
  push = 2.8 * bend.yz + .6 * kink.yz;
  vec2 kx = vec2(9, 0) * Rc + push, ky = vec2(0, 9) * Rc + push;
  vec3 c = bgN(vec2(k.x, k.y * .5)), e = bgN(Re * k.yx * 1.9 + 1.7 * kink.x);
  c = bgRidge(c.x, c.y * kx + c.z * .5 * ky, .004);
  vec2 eg = e.yz * Re * 1.9;
  e = bgRidge(e.x, eg.x * ky + eg.y * kx + (e.y + e.z) * 1.7 * kink.yz, .01);
  float b2 = b.x * b.x, c2 = c.x * c.x, m = .4 + bend.x;
  return vec3(a.x * .06 + b2 * b.x * .034 + c2 * c.x * .014 * m + e.x * e.x * .0034,
              a.yz * .06 + .102 * b2 * b.yz + .042 * c2 * m * c.yz + .014 * c2 * c.x * bend.yz + .0068 * e.x * e.yz);
}
// b: a sheet of white plastic hung before a grey wall, melting
vec3 bgSheet(vec2 p, float px, float X) {
  float s = X / .89, creep = uTravel * .01;
  vec2 o = rot(.5) * p;
  vec2 n1 = vec2(noise(o * 5.5 + vec2(creep, 1.7)), noise(o * 5.5 + vec2(8.3, -creep))) - .5;
  vec2 n2 = vec2(noise(o * 16.0 + 3.1), noise(o * 16.0 + vec2(17.0, creep))) - .5;
  float d = bgField(p + (n1 * .09 + n2 * .018) * (1.0 - bgClean), X);
  vec2 g = bgG;
  vec3 heat = mix(vec3(1.0, .4, .1), bgHue * 1.3, .35);
  vec2 L2 = vec2(-.62, .64);
  // relief: folds turn aside round a hole, creases run out from it
  vec2 q = p + g * exp(-max(d, .0) * 9.0) * .07 * bgS(.15, .04, d);
  vec2 hung = vec2(1.0);
  if (uOwn[5] > .0) hung = vec2(1.0 + .5 * uOwn[5], 1.0 - .85 * uOwn[5]);
  vec3 fold = bgFold(q * hung);
  fold.yz *= hung;
  vec2 slope = fold.yz;
  if (uOwn[5] > .0) { fold.yz *= 1.0 + .6 * uOwn[5]; slope = fold.yz + vec2(.5 * uOwn[5] * sin(q.x * 21.0 + 2.0 * noise(vec2(q.x * 2.0, q.y * .7)) * TAU), .0); }
  if (uOwn[5] < .0) slope *= 1.0 + .85 * uOwn[5];
  float ang = atan(g.y, g.x + 1e-4), dd = max(d, .0);
  float cr = .6 * sin(ang * 7.0 + n1.x * 9.0 + n2.y * 2.0) + .5 * sin(ang * 16.0 + n1.y * 14.0);
  slope += vec2(-g.y, g.x) * cr * exp(-dd * 14.0) * (1.0 - exp(-dd * 60.0)) * 1.2 * bgS(.125, .06, d);
  // texture: the plastic boils into small blisters where it is hot
  if (uTexture > .0 && d > .0 && d < .13 && bgBare < 1.0) {
    vec3 f = bgFoam(p * 27.0 + n1 * 2.5, .2 + .5 * uTexture);
    slope -= (1.0 - bgBare) * f.xy * bgS(1.05, .8, length(f.xy)) * 1.5 * uTexture * bgS(.13, .03, d) * smoothstep(.1, .5, f.z);
  }
  // slow dents that come and go
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 v = p - vec2((-.5 + .47 * fi) * s, .1 - .26 * fi + .17 * fi * fi);
    slope += v * 6.0 * (.3 + .5 * sin(uTime * (.13 + .04 * fi) + fi * 2.0)) * exp(-dot(v, v) * 70.0);
  }
  // rims that have run back and folded over, thick here and thin there
  float rw = .006 + .03 * sat(n1.y + .35 + .4 * n2.x) * sat(.65 - .5 * g.y), x1 = d / rw - 1.0, x2 = (d - rw * 2.6) / (rw * 1.3);
  float roll = bgS(1.1, .7, abs(x1)), roll2 = bgS(1.2, .5, abs(x2)) * smoothstep(-.15, .25, n1.x + n2.y);
  if (bgBare > .0) { roll *= 1.0 - bgBare; roll2 *= 1.0 - bgBare; }
  slope = mix(slope, slope * .6 - g * x1 * 2.6, roll) - g * x2 * 1.3 * roll2;
  vec3 n = normalize(vec3(-slope, 1.0)), L = normalize(vec3(L2, .62));
  float dif = sat(dot(n, L)), spec = pow(sat(dot(n, normalize(L + vec3(.0, .0, 1.0)))), 70.0), low = pow(sat(dot(n, normalize(vec3(.55, -.3, .8)))), 20.0);
  // milk-white where it is thick, grey where the wall shows through
  float thick = smoothstep(.25, .8, noise((uOwn[5] > .0 ? rot(.7 - .7 * uOwn[5]) * (p * hung) : rot(.7) * p) * 2.3 + 6.0) + .4 * n1.x + 2.0 * (fold.x - .05));
  vec3 skin = mix(vec3(.36, .365, .37), vec3(.97, .95, .9), .35 + .65 * thick);
  vec3 k0 = uKind[0] * uKind[0], k1 = uKind[1] * uKind[1], k2 = uKind[2] * uKind[2];
  float own3 = max(uOwn[3], .0), black = max(-uOwn[3], .0);
  if (own3 > .0) skin = mix(skin, mix(mix(k0, k1, sat(.5 + p.y + .8 * n1.x + .25 * p.x)), k2, .75 * bgS(.35, .75, thick)) * (.6 + .4 * thick), own3);
  if (black > .0) skin = mix(skin, .012 + .05 * k0, black);
  float crack = .0;
  if (uOwn[5] < .0) { crack = -uOwn[5] * bgCracks(p); skin *= 1.0 - .8 * crack; }
  float light = 1.15 - .55 * length((p - vec2(-.5 * s, .3)) * vec2(.8 / s, .9));
  vec3 sh = skin * (.06 + 1.25 * dif * sqrt(dif)) * light;
  // heat behind: it shines through, stains amber, then chars; the drone stains the foot
  float hot = bgS(.17, .0, d), foot = sat(uDrone * 1.8) * smoothstep(.0, .6, -p.y + .25 * n1.x + .06 * n2.x);
  sh += heat * skin * ((.12 + .4 * band(.5 + .5 * p.x / X)) * hot * hot + .4 * foot * (.3 + uEnergy));
  if (black > .0) sh += black * (.04 + .4 * k1) * pow(sat(n.y * .5 + n.x * -.7 + .25), 2.0) * light;
  float char_ = (1.0 - bgBare) * (1.0 - bgFrost), sc = bgS(.075, .0, d + .09 * n2.x + .07 * n1.x) * char_;
  sh *= mix(vec3(1.0), vec3(.5, .22, .06), max(sc * .85, .7 * foot));
  sh = bgFrost > .0 ? mix(sh, vec3(.5, .56, .6) * (.35 + 1.0 * dif) * (.6 + .6 * noise(p * 70.0)) * light, bgFrost * bgS(.07, .0, d + .09 * n2.x)) : sh;
  sh *= 1.0 - .93 * char_ * bgS(.028, .0, d + .05 * n2.y + .04 * n1.y);
  sh += vec3(1.0, .97, .92) * (spec * (.65 + .6 * roll) + low * (.04 + .25 * uMic)) * (.6 + .8 * uTone) * (.5 + .5 * light);
  // through the hole: a grey wall, and on it the sheet's shadow
  vec3 wall = vec3(.07, .072, .077) * (.8 + .4 * noise(p * 3.0)) * (.85 + .3 * noise(p * 70.0)) * light;
  float shade = smoothstep(-.085, -.045, d + (.05 + .08 * uSpace) * dot(g, L2) + .02 * n1.x);
  if (uOwn[2] != .0) { wall = mix(wall, bgBeyond(p, wall) * .55, abs(uOwn[2])); shade *= 1.0 - .75 * abs(uOwn[2]); }
  if (bgEmber > .0) sh *= 1.0 - .85 * bgEmber;
  vec3 back = wall * (1.0 - .92 * shade) * (.6 + .4 * bgS(.0, -.05, d)) + heat * .04 * exp(d * 30.0) * (.5 + uLevel);
  // a torn film of it left inside the rim, and threads drawn across
  float df = d + (.1 * sat(n1.x + .3) + .12 * sat(n1.y + .1)) * sat(.15 + g.y + .5 * n2.x) + .006 * n2.y;
  float film = smoothstep(-px, px, df) * step(d, .0);
  if (bgBare > .0 || bgEmber > .0 || uOwn[6] > .0) film *= (1.0 - bgBare) * (1.0 - bgEmber) * (1.0 - max(uOwn[6], .0));
  back = mix(back, skin * mix(vec3(.85, .5, .22), vec3(.8, .75, .7), sat(df * 18.0)) * (.03 + .5 * dif * dif) * light * (.5 + noise(vec2(p.x * 42.0, p.y * 9.0) + 4.0 * n1)), film * .6);
  back += vec3(1.0, .9, .75) * film * light * (.7 * spec + .12 * exp(-abs(df) * 500.0));
  for (int i = 0; i < 2; i++) {
    float fi = float(i), n = 15.0 - 5.0 * fi;
    vec2 c = rot(.22 - .75 * fi) * p;
    c.x = (c.x + .014 * sin(c.y * 9.0 + fi * 2.0) + .004 * n2.x) * n;
    float at = hash11(floor(c.x) + 31.0 * fi), w = .0005 + .005 * exp(min(d, .0) * 90.0);
    float l = abs(fract(c.x) - .3 - .4 * at) / n;
    float on = bgS(w + .8 * px, w - .4 * px, l) * step(.5 + .2 * fi, at);
    back = mix(back, skin * (.1 + .6 * fract(at * 9.0)) * light * vec3(1.0, .88, .74), on * (.3 + .6 * uTexture) * (1.0 - max(max(bgBare, bgEmber), max(abs(uOwn[6]), abs(uOwn[2])))));
  }
  if (uOwn[6] > .0) back = bgSteps(back, max(-d, .0) / (.026 * sqrt(bgK)) + .3 * n1.y * (1.0 - bgClean), .5 * light);
  vec3 col = mix(back, sh, smoothstep(-px, px, d));
  if (bgEmber > .0) {
    float run = noise(vec2(p.x * 9.0 + 3.0, p.y * 9.0 - uTime * .07)) * noise(p * 23.0 + uTime * .05);
    col += .5 * bgEmber * (uKind[4] * uKind[4] * vec3(1.6, .6, .25) + vec3(.5, .06, .0)) * (exp(-abs(d) * 80.0) * (.3 + 4.0 * run) + .12 * exp(-abs(d) * 14.0)) * (.7 + .6 * uLevel);
  }
  if (uOwn[7] < .0) col = mix(col, bgSmoke(col * 2.1, p, d) / 2.1, 1.0);
  // flame: the first instant of a hit and of a cue
  col += (vec3(1.5, .55, .1) + uKind[4] * .5) * uHits * ((.8 + 1.2 * pow(uHits, 4.0)) * exp(-bgHitD * bgHitD * 120.0) + .9 * exp(-abs(d) * 60.0) * bgS(.3, .1, bgHitD));
  col += vec3(1.1, .42, .1) * uCue * exp(-dot(p, p) * 30.0) * .6;
  return screenOf(col * 2.1);
}
vec3 render(vec2 p) {
  float px = 1.0 / uRes.y, X = clamp(.5 * uRes.x / uRes.y, .28, 1.2);
  bgK = exp2(-uOwn[0]); bgClean = max(-uOwn[1], .0); bgFrost = max(uOwn[4], .0); bgBare = max(-uOwn[4], .0); bgEmber = max(uOwn[7], .0); bgNew = max(max(abs(uOwn[3]), abs(uOwn[6])), bgEmber);
  return uVar < .5 ? bgFilm(p, px, X) : bgSheet(p, px, X);
}
