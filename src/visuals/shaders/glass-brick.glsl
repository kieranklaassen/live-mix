// name: Glass bricks
// a: Garden behind
// b: Stair at night
// what: A curved wall of square glass blocks with a garden behind: each block holds its own blur of lawn, hedge, red flowers and sky, upside down, and an enamel basin with a towel stands low right; or a round stair tower at night, dark steps climbing left before blocks full of street lamps and shop windows, with a tram passing.
// follows: Each kind is a coloured thing behind the glass, a soft patch or a lamp, and grows with its level; the piece tints the blocks and the bands brighten the columns. A hit lights a block and those beside it; a cue takes a lamp across from right to left. Keys catch on the rims. Tone clears or ripples the glass. In the garden a voice brings someone in a light coat.
// own: 0 amber evening at -1, dark blue night at 1; in the tower pale dawn at -1, red dusk at 1; 1 milk glass at -1, each block its own stained colour at 1; 2 few great blocks at -1, many small ones at 1; 3 a long flat wall, a wide tower at -1, a tight round drum, a narrow tower at 1; 4 snow over the garden, the shops shut at -1, flower beds everywhere and autumn trees, bright signs over the shops at 1; 5 round lenses at -1, blocks cut to a point with four facets at 1; 6 the glass one round pillar alone in the room (in the tower the stair a level bridge at -0.5, climbing to the right at -1) at -1, a straight wall square on to us (in the tower no stair) at 1; 7 still water for a floor at -1, broad dark leaves near us at 1
float gbPx, gbA, gbE; // a pixel, half the picture's width (to 1.2), how strongly it answers; how much of the day is left
#define gbDay (1.0 - .6 * sat(-uOwn[0]) - .88 * sat(uOwn[0]))
float gbMid, gbCount;
#define gbRound sat(-uOwn[5])
#define gbCut sat(uOwn[5])
#define gbMilk sat(-uOwn[1])
#define gbStain sat(uOwn[1])
#define GB_POST max(-uOwn[6], 0.0)
#define GB_FLAT max(uOwn[6], 0.0)
#define GB_POOL max(-uOwn[7], 0.0)
#define GB_LEAF max(uOwn[7], 0.0)
// the middle column in sight, blocks to a unit; round blocks, cut blocks; milk glass, stained glass
vec2 gbWide, gbHit, gbCue; // how much of the scene one block holds, and its ripples bend; where a hit lies on the wall, and the lamp of a cue, in blocks
float gbS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float gbBell(float x) { return exp(-x * x); }
float gbBlob(vec2 d, vec2 r) { d /= r; return exp(-dot(d, d)); }
float gbFold(float x) { return abs(mod(x + 3.0, 4.0) - 2.0) - 1.0; } // inside a block the side walls mirror
vec3 gbDeep(vec3 c, float k) { c *= c; return max(mix(vec3(dot(c, vec3(.3, .59, .11))), c, k), 0.0); }
float gbLevel(int i) { return i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : uHits; }
// The garden, out of focus: sky, trees, a hedge, the lawn, red flowers, somebody in a light coat, and the five kinds.
vec3 gbGarden(vec2 s) {
  float sway = .03 * sin(uTime * .21 + s.x * 2.0);
  float snow = sat(-uOwn[4]), rich = sat(uOwn[4]), eve = sat(-uOwn[0]), night = sat(uOwn[0]), hour = 1.0 - .72 * eve - .9 * night;
  vec3 sky = mix(vec3(1.85, 1.75, 1.45), vec3(.6, 1.05, 1.6), gbS(.12, .8, s.y));
  sky = mix(sky, mix(vec3(2.4, .72, .12), vec3(.3, .22, .5), gbS(.1, .8, s.y)), eve);
  sky = mix(sky, mix(vec3(.16, .3, .5), vec3(.02, .05, .16), gbS(.1, .9, s.y)), night);
  vec3 tint = mix(vec3(1.0), vec3(.55, .8, 1.5), night) * mix(vec3(1.0), vec3(1.5, .8, .6), eve) * hour;
  vec3 tree = mix(vec3(.26, .46, .13), vec3(.75, .84, .95), snow) * tint, hedge = mix(vec3(.025, .09, .03), vec3(.05, .07, .08), snow) * tint, lawn = mix(vec3(.8, 1.0, .34), vec3(1.5, 1.55, 1.65), snow) * tint;
  lawn = mix(lawn, vec3(1.7, .22, .62) * tint, rich * (.65 + .35 * sin(s.x * 8.0) * sin(s.y * 9.0 + s.x * 3.0)));
  tree = mix(tree, vec3(1.5, .62, .06) * tint, rich * (.55 + .4 * sin(s.x * 4.0 + 1.0)));
  vec3 c = mix(sky, tree, gbS(.16, -.1, s.y - .16 - .2 * sin(s.x * 2.1 + 1.0) - .08 * sin(s.x * 5.3) - sway));
  c = mix(c, hedge, gbS(.12, -.08, s.y + .1 - .09 * sin(s.x * 3.0)) * .95);
  c = mix(c, lawn, gbS(.06, -.12, s.y + .4 + .05 * sin(s.x * 1.7)));
  c += (vec3(1.8, 1.5, 1.0) * (1.0 - .5 * eve - .75 * night)) * gbBlob(s - vec2(-.25, .62), vec2(.42, .36) * (1.0 - .6 * night));
  float red = (1.0 + rich) * gbBlob(s - vec2(-.62, -.2 + sway), vec2(.22, .13)) + gbBlob(s - vec2(.35, -.28), vec2(.19, .11)) + .8 * gbBlob(s - vec2(1.15, -.12 - sway), vec2(.18, .2)) + .8 * gbBlob(s - vec2(-1.5, -.2), vec2(.2, .16));
  c = mix(c, vec3(1.3, .07, .05) * (hour + .25 * eve), sat(red * (.9 - .65 * snow)));
  // the coat goes by about every two minutes; a voice brings it near
  float go = fract(uTime / 131.0) * 7.0 - 3.5;
  c = mix(c, vec3(1.75, 1.6, 1.35) * (.3 + .7 * hour), max(gbBlob(s - vec2(go, -.1), vec2(.13, .42)), gbBlob(s - vec2(.1, -.1), vec2(.16, .45)) * uMic));
  for (int i = 0; i < 5; i++) {
    float f = float(i), l = sat(gbLevel(i) * gbE * 1.1), z = .8 + .07 * f;
    vec2 at = vec2(-.55 + .34 * mod(f * 2.0, 5.0) + .2 * sin(f * 2.0 + 1.0 + uTime * .031), .04 + .2 * sin(f * 1.9 + .4) + .1 * l);
    c = mix(c, gbDeep(uKind[i] + .05, .85) * 1.6 + .05, gbBlob(s - at, vec2(.17, .24) * (.7 + .8 * l) / z) * gbS(0.0, .8, l) * .92);
  }
  return c;
}
float gbDisc(vec2 d, float r, float e) { float l = length(d); return gbS(r + e, r - e, l) * (.6 + .55 * gbS(.1 * r, r, l)); }
float gbBar(vec2 d, vec2 h, float e) { d = abs(d) - h; return gbS(e, -e, d.x) * gbS(e, -e, d.y); }
// The street at night, out of focus: shop windows, five lamps, a tram that goes by, and all of it in the wet road.
vec3 gbStreet(vec2 s) {
  float dawn = sat(-uOwn[0]), red = sat(uOwn[0]), many = .5 + .5 * uOwn[4];
  vec3 c = mix(vec3(.02, .035, .085), vec3(.016, .05, .14), gbS(-.1, .7, s.y));
  c = mix(c, mix(vec3(.9, .6, .42), vec3(.16, .32, .6), gbS(0.0, .8, s.y)), .75 * dawn);
  c = mix(c, mix(vec3(1.1, .16, .04), vec3(.18, .03, .16), gbS(0.0, .7, s.y)), .8 * red);
  float wet = gbS(-.17, -.25, s.y), dim = mix(1.0, .5, wet);
  vec2 q = vec2(s.x, (sqrt((s.y + .21) * (s.y + .21) + .0004) - .21) * mix(1.0, .6, wet));
  // the houses stand dark against the sky, with shop windows
  c *= 1.0 - .72 * gbS(.1, -.1, s.y - .36 - .1 * sin(s.x * 3.0)) * (1.0 - .5 * wet);
  float sx = s.x * 1.15 + .3, id = floor(sx), h = hash11(id + 7.0);
  vec3 shop = mix(vec3(1.0, .5, .16), mix(vec3(.15, .7, .75), vec3(.95, .2, .25), step(.5, fract(h * 7.0))), step(.55, h));
  c += shop * gbBar(vec2(fract(sx) - .5, q.y + .02), vec2(.26, .06), .12) * gbS(0.0, .3, many * 1.3 - fract(h * 13.0) * .9) * .55 * dim;
  for (int i = 0; i < 5; i++) {
    float f = float(i), l = sat(gbLevel(i) * gbE * 1.2);
    vec2 at = vec2(-1.3 + .66 * f + .2 * sin(uTime * .037 + f * 2.0), .17 + .15 * sin(f * 2.3));
    c += gbDeep(uKind[i] + .07, .85) * gbDisc(q - at, .09 + .04 * l, .06 + .05 * uSpace) * (.14 + 1.35 * l) * dim;
  }
  float up = fract(s.x * 1.9 + .1); c += mix(vec3(.1, .8, 1.0), vec3(1.0, .15, .5), step(.5, hash11(floor(s.x * 1.9 + .1) + 3.0))) * sat(uOwn[4]) * gbBar(vec2(up - .5, s.y - .5), vec2(.24, .05), .1) * 1.6;
  // the tram
  float go = fract(uTime / 97.0) * 11.0 - 5.5, tx = s.x + go;
  float body = gbBar(vec2(tx, q.y - .08), vec2(.8, .17), .08);
  c = mix(c, vec3(.06, .014, .012), body * .8 * dim);
  c += vec3(1.5, 1.05, .5) * body * gbBar(vec2(tx, q.y - .11), vec2(.74, .035), .07) * (.7 + .3 * cos(tx * 22.0)) * .75 * dim * sat(1.0 + uOwn[4]);
  c += vec3(1.6, 1.4, 1.0) * gbDisc(vec2(tx + .95, q.y + .06), .06, .04) * 1.6 * dim;
  return c;
}
vec3 gbScene(vec2 s) { return uVar < .5 ? gbGarden(s) : gbStreet(s); }
// Where in the scene the middle of a block looks.
vec2 gbLook(vec2 id) { return uVar < .5 ? vec2((id.x - gbMid) * .16, id.y * .16 - .5) / gbCount * 1.2 : vec2(id.x * .15, id.y * .13 - .42) / gbCount * .92; }
// One block of the wall and its joint. uv counts blocks, slope is how far the eye goes aside for a block of depth,
// w is a pixel in blocks, nv how squarely it is seen.
vec3 gbGlass(vec2 uv, vec2 slope, vec2 w, float nv) {
  vec2 id = floor(uv), e = (uv - id) * 2.0 - 1.0, h = hash22(id + 311.0), me = e * 1.075;
  float r = mix(mix(.2, 1.0, gbRound), .05, gbCut);
  vec2 q = abs(me) - (1.0 - r), m = max(q, 0.0), sg = vec2(me.x < 0.0 ? -1.0 : 1.0, me.y < 0.0 ? -1.0 : 1.0);
  float d = length(m) + min(max(q.x, q.y), 0.0) - r;
  vec2 n = q.x > q.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  if (min(q.x, q.y) > 0.0) n = m / max(length(m), 1e-4);
  vec2 sn = n * sg;
  float aa = dot(n, w) * 2.2 + .004, far = exp(-6.0 * dot(w, w)), room = uVar < .5 ? gbDay : .12;
  // the pressed face: slow ripples that lie another way in each block, and a steep bevel round it
  float rip = mix(.75, .12, uTone) * far * (.55 + .9 * h.x);
  vec2 k = rot(h.y * 3.0 - .6) * me + h * 9.0;
  float w1 = k.x * 3.4 + 1.5 * sin(k.y * 2.1 + uTime * .05), w2 = k.y * 5.5 + 1.2 * sin(k.x * 3.3 - uTime * .04), w3 = k.x * 9.0 + 2.0 * sin(k.y * 4.0);
  vec2 rp = (vec2(cos(w1) + .35 * cos(w3), .7 * cos(w2)) * rot(h.y * 3.0 - .6)) * rip;
  float bev = gbS(-.26, -.03, d);
  vec2 facet = vec2(gbS(-.12, .12, me.x) * 2.0 - 1.0, gbS(-.12, .12, me.y) * 2.0 - 1.0) * gbS(0.0, .2, abs(abs(me.x) - abs(me.y)) + .1);
  float diag = gbS(-.05, .05, abs(me.x) - abs(me.y)); facet *= vec2(diag, 1.0 - diag);
  vec2 tilt = rp * (1.0 - .7 * gbCut) + sn * bev * bev * 1.5 + me * .2 + facet * gbCut * .9;
  // through the block: the side walls mirror what passes them
  vec2 x = me * .98 + slope * .8 - tilt * .3;
  vec2 f = vec2(gbFold(x.x), gbFold(x.y)), over = max(abs(x) - 1.0, 0.0);
  vec2 g2 = gbLook(id) - f * gbWide.x * vec2(1.0, .92) * (.75 + .5 * h.y) - tilt * gbWide.y + (h.yx - .5) * .2;
  vec3 c = gbScene(g2);
  // the piece, as colour seen through
  vec2 pu = vec2(id.x - gbMid + .5 + f.x * .5, id.y + .5 + f.y * .5) / vec2(16.0, 7.5) * 1.2 / gbCount;
  vec4 pc = piece(vec2(sat(pu.x + .5), sat(1.0 - pu.y)));
  vec3 tint = gbDeep(pc.rgb / max(pc.a, .02), 1.2);
  float seen = sat(pc.a * 1.2) * sat(gbE);
  c = uVar < .5 ? mix(c, c * (.45 + .95 * tint), seen * .5) : c + tint * seen * .22;
  // the bands, one column each
  c *= 1.0 + gbE * (uVar < .5 ? .32 : .55) * band(sat(abs(fract((id.x - gbMid + 8.0) / 32.0) * 2.0 - 1.0)));
  // the glass's own colour: green where the path is long; the seam where the far face meets the sides
  float side = max(gbS(0.0, .1, over.x), gbS(0.0, .1, over.y)), seam = max(gbBell((abs(x.x) - 1.0) / .06), gbBell((abs(x.y) - 1.0) / .06)) * far * (1.0 - gbRound);
  vec3 own = h.x < .2 ? vec3(1.0, .5, .12) : h.x < .42 ? vec3(.12, .55, 1.0) : h.x < .6 ? vec3(.95, .12, .2) : h.x < .8 ? vec3(.2, .85, .4) : vec3(1.0, .85, .35);
  c *= mix(vec3(1.0), own * 1.2, gbStain * .85) * (1.0 - side * vec3(.5, .34, .42)) * (1.0 - .35 * seam) * exp(-min(over.x + over.y, 3.0) * vec3(.3, .14, .22));
  float l = dot(c, vec3(.3, .5, .2));
  c = mix(c, mix(c, vec3(l), .5) * .5 + vec3(.4, .42, .41) * room, gbMilk * .8);
  // the rim: thick glass goes dark green, then takes the light in broken lines
  float lit = dot(sn, vec2(-.45, .85)), brk = .5 + .5 * sin(w1 * 1.3 + me.x * 3.0);
  c = mix(c, c * c * vec3(.3, .5, .4) + c * .12, gbS(-.16, -.05, d) * .75);
  c += (vec3(1.0, .99, .95) * room + c) * (gbBell((d + .18) / .035) * brk * (.12 + .7 * sat(lit)) + gbBell((d + .035) / .03) * .4 * sat(-lit));
  c += gbDeep(uKind[3], 1.0) * uKeys * gbE * gbBell((d + .2) / .08) * sat(.4 - lit) * brk * 1.6;
  vec2 g = rp * 1.4 + sn * bev * .8 + me * .35 + vec2(.5, -.6);
  c += vec3(1.0, .98, .94) * room * .55 * exp(-dot(g, g) * 18.0) * far;
  // a hit lights a block and its neighbours; a cue's lamp goes by behind
  vec2 dh = id + .5 - gbHit, dc = id + .5 - gbCue;
  float hl = sat(uHits * gbE) * exp(-dot(dh, dh) * 1.1);
  c = mix(c, (gbDeep(uKind[4], 1.4) * 2.6 + .12) * (.3 + 2.2 * gbBell(length(f + tilt * .5 + .15) * 1.6)), hl * .9);
  c += vec3(1.5, 1.1, .6) * uCue * (exp(-dot(dc, dc) * .2) * .14 + exp(-dot(dc + f * 1.1, dc + f * 1.1) * .9)) * (uVar < .5 ? 1.6 : 1.05) * gbE;
  // what the room mirrors in the face at a low angle
  c = mix(c, vec3(.52, .5, .46) * room, .02 + .5 * pow(max(1.0 - nv, 0.0), 4.0));
  // the joint, hollow, with the light of the blocks on its edges
  vec3 jt = uVar < .5 ? vec3(.4, .375, .33) * gbDay * (.8 + .3 * noise(uv * 31.0)) : vec3(.01, .012, .02) * (.6 + .8 * noise(uv * 31.0));
  jt *= .75 + .25 * gbS(0.0, .12, d); jt += c * vec3(.14, .16, .14) * exp(-max(d, 0.0) * 14.0) + jt * .5 * sat(lit);
  return mix(jt, c, gbS(aa, -aa, d));
}
// The light of day through the wall, where it falls: from F, in plan, a height up. 0 where none comes.
vec3 gbFall(vec2 F, float up, vec2 ax, float R, float blur) {
  vec2 L = normalize(vec2(-.35, 1.0)), o = F - ax;
  float lb = dot(o, L), lc = dot(o, o) - R * R, ld = lb * lb - lc;
  if (ld <= 0.0 || lc <= 0.0 || lb > 0.0) return vec3(0.0);
  float lt = -lb - sqrt(ld);
  vec2 Q = o + L * lt, uv = vec2(R * atan(Q.x, -Q.y) * 1.12, lt * .62 + up - .35) * gbCount;
  uv += .06 * vec2(sin(uv.y * 5.0 + uTime * .23 + uv.x), sin(uv.x * 4.0 - uTime * .19));
  vec2 id = floor(uv), e = abs(uv - id - .5) * 2.0;
  float sf = .1 + .03 * lt + blur, cell = mix(gbS(.84 + sf, .84 - sf, max(e.x, e.y)), .6, sat(blur * 1.2 - .2)) * gbS(-.1, .1, uv.y);
  float ca = .6 + .7 * gbBell((length(e) - .6 + .22 * sin(uv.x * 6.0 + uTime * .3)) * 3.2) * exp(-blur * 2.0);
  vec3 g = gbGarden(gbLook(id) * .8 + vec2(0.0, .35));
  return (g * .6 + vec3(.5, .42, .28)) * cell * ca * exp(-lt * (.13 - .05 * uSpace)) * gbDay * gbS(0.0, 14.0 - 12.0 * GB_POST, ld) * (1.0 + 1.2 * GB_POST) * gbS(6.5 * gbCount, 5.0 * gbCount, uv.y);
}
// An enamel basin on a stool, its towel over the rim, the light on it from the left. The rim's middle is 0.
vec3 gbBasin(vec2 p, vec3 col, float px) {
  const vec2 R = vec2(.25, .074);
  if (p.y > .09 || p.x < -.36) return col;
  float x = p.x / R.x; vec3 light = vec3(1.0, .98, .92) * gbDay;
  // its shadow on the floor, then the stool
  col *= 1.0 - .55 * gbBlob(p - vec2(.1, -.3), vec2(.34, .12));
  vec2 s = p - vec2(0.0, -.165);
  float y0 = -.052 * sqrt(max(1.0 - s.x * s.x / .0324, 0.0));
  float leg = min(abs(s.x + .115 - .12 * (s.y + .05)), abs(s.x - .115 + .12 * (s.y + .05)));
  float lg = gbS(.014 + px, .014 - px, leg) * gbS(px, -px, s.y + .03);
  vec3 wood = mix(vec3(.42, .22, .09), vec3(.12, .06, .03), gbS(-.15, .16, s.x)) * gbDay * (.85 + .25 * noise(vec2(s.x * 14.0, s.y * 120.0)));
  col = mix(col, wood * .7, lg);
  float seat = gbS(px, -px, length(s / vec2(.18, .052)) * .052 - .052), edge = gbS(px, -px, abs(s.x) - .18) * gbS(px, -px, s.y) * gbS(-px, px, s.y - y0 + .022);
  col = mix(col, wood * .75, edge); col = mix(col, wood * (1.3 + .5 * gbS(.0, -.16, s.x)), seat * (1.0 - .6 * gbBlob(s - vec2(.03, 0.0), vec2(.16, .05))));
  // the bowl
  float dep = sat(-p.y / .15), hw = R.x * (1.0 - .42 * dep * dep - .06 * dep), base = -.135 - .035 * sqrt(max(1.0 - p.x * p.x / (.145 * .145), 0.0));
  float bowl = gbS(px, -px, abs(p.x) - hw) * gbS(px, -px, p.y) * gbS(-px, px, p.y - base);
  float a = p.x / max(hw, .01);
  vec3 en = light * mix(vec3(.95), vec3(.2, .19, .18), gbS(-.75, .75, a)) * (1.0 - .35 * dep) + vec3(.05, .07, .04) * gbS(.6, 1.0, a);
  en += light * .5 * gbBell((a + .62) / .1) * (1.0 - dep);
  col = mix(col, en, bowl);
  float e = length(p / R), ee = (e - 1.0) * R.y * 1.6;
  // inside: shade under the near light, the right wall bright, water with the windows in it
  vec3 in_ = light * mix(vec3(.3, .3, .29), vec3(.95, .94, .9), gbS(-.8, .9, x + p.y * 4.0));
  vec2 wq = (p - vec2(0.0, -.014)) / (R * .78); float we = length(wq), wpx = px / (R.y * .7);
  vec3 wat = gbGarden(vec2(wq.x * .6 - .2, .1 - wq.y * .55 + .05 * sin(wq.y * 9.0 + uTime * .5))) * .5 + vec3(.1, .11, .1) * gbDay;
  in_ = mix(in_, wat, gbS(1.0 + wpx, 1.0 - wpx, we) * .85);
  in_ *= 1.0 - .3 * gbBell((we - 1.0) / .08);
  col = mix(col, in_, gbS(px, -px, ee));
  float rim = gbBell(ee / (.006 + .5 * px));
  col = mix(col, mix(vec3(.06, .13, .3), vec3(1.0), .6 * gbS(.2, -1.0, x)) * gbDay, sat(rim * 1.2));
  // the towel: over the near rim on the left, hanging in three folds
  float tx = (p.x + .125 + .02 * p.y) / .078, top = -R.y * sqrt(max(1.0 - x * x, 0.0)) + .004 + .02 * gbS(-1.0, 1.0, tx), bot = -.255 - .012 * sin(tx * 4.0 + 1.0) + .01 * tx;
  float fold = sin(tx * 5.2 + p.y * 3.0 + .7) * gbS(.06, -.2, p.y) , tw = gbS(px, -px, (abs(tx) - 1.0 - .06 * sin(p.y * 18.0)) * .078) * gbS(px, -px, p.y - top) * gbS(-px, px, p.y - bot);
  col *= 1.0 - .4 * gbBlob(vec2(max(abs(tx - .35) - .8, 0.0) * .078, min(p.y - bot, 0.0) + max(p.y - top, 0.0)), vec2(.02)) * gbS(px, -px, p.y - top) * (1.0 - tw);
  vec3 cloth = light * vec3(.98, .95, .88) * (.66 - .18 * tx + .26 * fold) * (1.0 - .25 * gbBell((p.y - top + .012) / .01));
  float st = gbS(.0105 + px, .0105 - px, abs(p.y - bot - .045)) + gbS(.003 + px, .003 - px, abs(p.y - bot - .07));
  cloth *= mix(vec3(1.0), vec3(.72, .13, .1), sat(st) * .9);
  cloth *= .93 + .1 * noise(p * 260.0);
  return mix(col, cloth, tw);
}
vec3 gbWallA(vec2 p) {
  float eye = 2.6, hor = .16, X = p.x + .4 - .45 * gbA, Y = p.y - hor, px = gbPx;
  float R = 11.0 * exp2(-1.1 * uOwn[3] - 2.45 * GB_POST + GB_FLAT), D = R + 4.6 + 3.4 * GB_FLAT + 3.0 * GB_POST, al = (.38 - asin(R / D)) * (1.0 - GB_POST) * (1.0 - GB_FLAT);
  vec2 ax = D * vec2(sin(al), cos(al)), rd = vec2(X, 1.0);
  float a = dot(rd, rd), b = dot(rd, ax), disc = b * b - a * (D * D - R * R);
  float t = (b - sqrt(max(disc, 0.0))) / a, miss = (R - abs(rd.x * ax.y - rd.y * ax.x) / sqrt(a)) / (t * px);
  float on = gbS(-.7, .7, miss);
  // the room: a plain wall, and the floor that takes the light
  float zw = 13.0, v = Y * t + eye, tf = Y < -.001 ? eye / -Y : 1e4;
  float wall = gbS(-1.0, 1.0, (Y + eye / zw) / px);
  vec3 plaster = mix(vec3(.7, .64, .54), vec3(.2, .19, .18), gbS(.35, 1.0, X - .25 * Y)) * (.9 + .1 * noise(p * 5.0)) * (1.0 - .3 * gbS(.1, .5, Y));
  vec3 col = plaster * gbDay;
  vec3 fl = vec3(.2, .175, .15) * gbDay * (1.0 + 1.1 * GB_POST * (.7 + .5 * noise(p * 3.0)));
  bool seen = on < 1.0 || v < 2.0 * t * px;
  if (seen && wall < 1.0) {
    vec2 F = rd * min(tf, zw);
    if (GB_POOL > 0.0) F += GB_POOL * .12 * vec2(sin(F.y * 2.3 + uTime * .31 + F.x), sin(F.x * 1.9 - uTime * .27));
    fl *= .92 + .12 * noise(F * 9.0);
    fl += gbFall(F, 0.0, ax, R, tf * tf * px * gbCount * 1.6) * (.95 + .5 * uLow * gbE);
  }
  if (seen && wall > 0.0) col += plaster * gbFall(rd * zw, eye + Y * zw, ax, R, .5) * .8;
  if (GB_POOL > 0.0) {
    float fr = pow(1.0 - sat(-Y * 1.7), 3.0);
    vec2 F = rd * min(tf, zw);
    vec3 wm = gbGarden(vec2(X * .9 + .05 * sin(F.y * 3.0 + F.x + uTime * .4), -Y * .6 - .3));
    fl = mix(fl, fl * vec3(.35, .62, .6) + vec3(.02, .07, .075) * gbDay + (plaster * gbDay * .3 + wm * .3) * (.2 + .6 * fr), GB_POOL);
    float gl = gbBell(sin(F.x * 2.6 + 1.3 * sin(F.y * 1.7 + uTime * .33)) * 5.0) * gbBell(sin(F.y * 3.1 + 1.1 * sin(F.x * 1.3 - uTime * .29)) * 5.0);
    fl += GB_POOL * (wm * .5 + .12 * gbDay) * gl * .5;
  }
  // light off the water wavers on the wall
  vec2 cw = (p - vec2(gbA - .2, .22)) * vec2(19.0, 30.0);
  cw += .8 * sin(cw.yx * .8 + uTime * vec2(.31, -.27)); cw += .35 * sin(cw.yx * 2.1 - uTime * vec2(.23, .37));
  float net = gbBell(sin(cw.x * .5 + .8 * cw.y) * 1.6) * gbBell(sin(cw.y * .9 - .5 * cw.x) * 1.2);
  col += vec3(.95, .9, .74) * gbDay * gbDay * net * (.14 + .2 * uLevel * gbE) * gbBlob(p - vec2(gbA - .2, .2), vec2(.28, .15));
  col = mix(fl, col, wall);
  if (on > 0.0) {
    vec2 q = rd * t - ax, n = q / R;
    float nd = max(-dot(rd, n), .02), nv = nd / sqrt(a);
    vec2 slope = vec2(dot(rd, vec2(-n.y, n.x)), Y) / nd; slope /= 1.0 + .12 * abs(slope);
    vec2 w = vec2(t * px / max(nv, .05), t * px) * gbCount;
    float u = R * atan(q.x, -q.y) * 1.12;
    float kerb = .34, below = step(v, 0.0), av = abs(v);
    slope.y *= 1.0 - 2.0 * below;
    if (GB_POOL > 0.0 && below > .5) { float k = GB_POOL * (.03 + .03 * uLow + .03 * uHits) * sat(av * 1.5); u += k * sin(av * 7.0 + u * 1.7 + uTime * .7) ; av += k * .5 * sin(u * 3.1 - uTime * .5 + av * 4.0); }
    vec3 g = gbGlass(vec2(u, av - kerb) * gbCount, slope, w, nv);
    vec3 k = vec3(.6, .56, .49) * gbDay * (.45 + .3 * av / kerb) * (.6 + .5 * nv);
    g = mix(k, g, gbS(-w.y, w.y, (av - kerb) * gbCount));
    vec3 mir = fl * (1.0 - .55 * GB_POOL) + g * (.16 + .5 * pow(1.0 - sat(-Y * 1.6), 5.0) + .45 * GB_POOL) * exp(-av * (.3 - .22 * GB_POOL));
    g = mix(g, mir, gbS(w.y, -w.y, v * gbCount));
    col = mix(col, g, on);
  }
  if (GB_POOL > 0.0) return col;
  vec2 bp = (p - vec2(gbA - .15, -.2)) / mix(.6, 1.0, gbS(.28, .8, gbA));
  return gbBasin(bp, col, px / mix(.6, 1.0, gbS(.28, .8, gbA)));
}
// b: inside a round stair tower. The stair climbs to the left along the wall of blocks, dark, with its rail.
vec3 gbWallB(vec2 p) {
  float eye = 3.4 - 1.9 * GB_POOL, hor = -.12, X = p.x - .1, Y = p.y - hor, px = gbPx;
  float R = 8.5 * exp2(-.5 * uOwn[3]);
  vec2 ax = R * vec2(-.2, .22), rd = vec2(X, 1.0);
  float a = dot(rd, rd), b = dot(rd, ax), k = dot(ax, ax);
  float t = (b + sqrt(b * b - a * (k - R * R))) / a;
  vec2 q = rd * t - ax, n = -q / R;
  float v = Y * t + eye, sink = v, nd = max(-dot(rd, n), .05), nv = nd / sqrt(a), th = atan(q.x, q.y);
  vec2 slope = vec2(dot(rd, vec2(-n.y, n.x)), Y) / nd; slope /= 1.0 + .12 * abs(slope);
  vec2 w = vec2(t * px / nv, t * px) * gbCount;
  float below = step(v, 0.0), av = abs(v); slope.y *= 1.0 - 2.0 * below;
  if (GB_POOL > 0.0 && v < 0.0) { v = mix(v, av, GB_POOL); av += GB_POOL * (.03 + .05 * uLow + .06 * uHits) * sat(av) * sin(av * 6.0 + 9.0 * th + uTime * .6); }
  // the stair: its near side on a smaller round
  float r = R * .74, t2 = (b + sqrt(max(b * b - a * (k - r * r), 0.0))) / a;
  vec2 q2 = rd * t2 - ax; float th2 = atan(q2.x, q2.y), v2 = Y * t2 + eye, ap = t2 * px;
  if (GB_POOL > 0.0) v2 = mix(v2, abs(v2), GB_POOL);
  float dth = .15, rise = .62 * (1.0 - 2.0 * GB_POST), y0 = 2.9 - 14.0 * GB_FLAT - 1.1 * GB_POOL + .5 * GB_POST, go = dth * r;
  float s1 = (th2 - .0) / dth, c1 = floor(s1), f1 = s1 - c1, top = y0 - rise * c1, y = v2 - top;
  float line = y0 - rise * s1;
  float in1 = max(gbS(ap, -ap, y), gbS(ap, -ap, y - rise) * gbS(ap, -ap, (f1) * go)), under = gbS(-ap, ap, v2 - line + 1.0);
  vec3 col = vec3(0.0);
  if (in1 * under < 1.0) {
    vec3 g = gbGlass(vec2(R * th, av) * gbCount + vec2(.3, 0.0), slope, w, nv);
    col = mix(g, vec3(.014, .016, .024) + g * (.3 + .5 * GB_POOL) * exp(-av * (.25 - .2 * GB_POOL)), gbS(w.y, -w.y, sink * gbCount));
  }
  float topw = y0 - rise * floor(th / dth), lw = y0 - rise * th / dth;
  if (GB_FLAT > .99) return col;
  if (v2 - line > 3.6 || v2 - line < -1.1 && v - lw < -1.1) return col;
  vec3 spill = gbStreet(vec2(th * .8, .12)) * .2 + vec3(.006, .009, .016);
  // treads seen from above, or the soffit from below
  float tread = gbS(-3.0 * ap, -ap, y) * gbS(ap, -ap, v - topw), soff = gbS(3.0 * ap, ap, v2 - line + 1.0) * gbS(-ap, ap, v - lw + 1.0);
  if (tread > 0.0 && (GB_POOL == 0.0 || sink > 0.0)) {
    float c = c1, tc = t2, kind = 0.0, at = t; bool hit = false;
    for (int i = 0; i < 6 && !hit; i++) {
      float go_ = th > th2 ? 1.0 : 0.0, ang = (c + go_) * dth; vec2 dir = vec2(sin(ang), cos(ang));
      float den = rd.x * dir.y - rd.y * dir.x, tb = abs(den) < 1e-4 ? t : (ax.x * dir.y - ax.y * dir.x) / den;
      if (tb < tc || tb > t) tb = t;
      float tp = Y < 0.0 ? (y0 - rise * c - eye) / Y : 1e4;
      if (tp <= tb) { at = tp; kind = 1.0; hit = true; }
      else { c += go_ * 2.0 - 1.0; tc = tb; if (Y * tb + eye < y0 - rise * c) { at = tb; hit = true; } else if (tb >= t) hit = true; }
    }
    vec2 qh = rd * at - ax; float fh = atan(qh.x, qh.y) / dth - c, near = gbS(r, R, length(qh));
    vec3 tr = mix(spill * .25 + .004, (spill * 1.3 + .012) * (.25 + .9 * near) * (.75 + .5 * gbS(.75, 1.0, fh)), kind);
    col = mix(col, tr, tread);
  }
  col = mix(col, vec3(.004, .005, .009) + spill * .5 * sat((v - lw + 1.0) / 2.0), soff);
  col = mix(col, vec3(.006, .007, .012) + spill * .12 * gbBell((v2 - line + .5) * 2.0), in1 * under);
  col += (spill * .55 + vec3(.01, .014, .025)) * gbBell((y + .05) / (.04 + ap)) * gbS(.0, -.02, y) * under;
  // rail and balusters
  float rail = gbS(.085 + ap, .085 - ap, abs(v2 - line - 3.3)), bal = gbS(.03 + ap, .03 - ap, abs(f1 - .5) * go) * gbS(-ap, ap, y) * gbS(ap, -ap, v2 - line - 3.3);
  col = mix(col, vec3(.004, .005, .008), max(rail, bal) * .96);
  col += spill * .9 * gbBell((v2 - line - 3.37) / (.03 + ap)) * rail;
  return col;
}
// Broad leaves near us, out of the corners, with the light of the wall behind them.
vec3 gbPlant(vec2 p, vec3 col) {
  float day = uVar < .5 ? gbDay : .1;
  for (int i = 0; i < 8; i++) {
    float f = float(i), right = f < 3.0 ? 1.0 : 0.0, h = hash11(f + 2.0);
    vec2 o = p - vec2(right > .5 ? gbA - .05 : -gbA + .1, -.62);
    if (right > .5) o.x = -o.x;
    float ang = right > .5 ? .75 + .3 * f : .35 + .27 * (f - 3.0), len = GB_LEAF * (.8 + .4 * h - .2 * right);
    o = rot(ang + .02 * sin(uTime * (.17 + .05 * h) + f * 2.0) + .03 * uLow) * o;
    float x = o.x / len, y = o.y + (.16 + .2 * h) * x * x * len - .05 * x;
    if (x < 0.0 || x > 1.0) continue;
    float b = sat((x - .22) / .78), wd = (.17 * sqrt(max(b, 1e-4)) * (1.0 - b * b) * len) * (.8 + .3 * h) + .006, d = abs(y) - wd;
    d += .008 * sin(x * 40.0 + f) * b;
    float on = gbS(.004, -.004, d);
    float vein = gbBell(sin((x * 26.0 - abs(y) * 30.0) * 1.0) * 2.4), up = y > 0.0 ? 1.0 : .62;
    vec3 c = mix(vec3(.035, .12, .035), vec3(.09, .17, .04), h) * (day * .9 + .05) * up * (.75 + .35 * vein) + gbDeep(uKind[1], .9) * .03 * uPad;
    c += col * (uVar < .5 ? .10 : .02) * up; c += vec3(.9, 1.0, .7) * (day * .22 + .015) * gbBell(d / .006) * up;
    c *= .55 + .45 * gbS(0.0, .5, x); c = mix(c, c * 1.5, gbBell(y / .006));
    col = mix(col * (1.0 - .35 * gbS(.05, -.02, d - .02) * (1.0 - on)), c, on);
  }
  return col;
}
vec3 render(vec2 p) {
  gbPx = 1.0 / uRes.y;
  gbA = min(.5 * uRes.x / uRes.y, 1.2);
  gbE = .45 + 1.2 * uEnergy;
  gbCount = (uVar < .5 ? 1.2 : .92) * exp2(.8 * uOwn[2]);
  gbWide = uVar < .5 ? vec2(.44, .34) : vec2(.38, .2);
  gbMid = uVar < .5 ? 7.0 * exp2(-1.7 * uOwn[3]) * (1.0 - GB_POST) * (1.0 - GB_POST) * (1.0 - GB_POST) * (1.0 - GB_FLAT) * gbCount / 1.2 : 0.0;
  gbHit = vec2(gbMid, 0.0) + vec2((uVar < .5 ? -.5 : .8) + 3.0 * cos(TAU * uLoop), 2.6 + 1.1 * sin(TAU * uLoop)) * gbCount / 1.2;
  gbCue = vec2(gbMid, 0.0) + vec2(mix(-8.0, 8.0, uCue), 3.2) * gbCount / 1.2;
  vec3 col = uVar < .5 ? gbWallA(p) : gbWallB(p);
  if (GB_LEAF > 0.0) col = gbPlant(p, col);
  col = screenOf(col);
  return mix(col, col * col * (3.0 - 2.0 * col), .5);
}
