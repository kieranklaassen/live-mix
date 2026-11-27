// name: Dabs
// a: Quay
// b: Orchard
// what: A still harbour at a late hour, painted on pale board in small separate dabs of unmixed colour: two masts and a dark hull moored at the right, its image in the water, houses and a light tower far off; or an orchard on a slope, round trees with a ladder, blue and violet shadows lying down the grass.
// follows: Each kind dyes and fattens the dabs of its part: pads the sky, drones the boats or the shadows, textures the water or the grass, phrases the gleam or the leaves. Bands lift the light and the piece colours water and grass. A hit pales the dabs in one soft circle, a cue sends a gleam over. The loop leans from cool to warm; keys brighten odd dabs.
// own: 0 1 a few great dabs, -1 the finest points; 1 1 long slanting strokes, -1 square tiles set in order; 2 1 the sounds' colours only, -1 dots of dark ink on the bare board; 3 1 night with its few lights, -1 fog; 4 1 many masts (b: tall poplars), -1 the boats and the quay gone (b: one tree left); 5 1 rows of waves (b: rows of a crop running to a point), -1 the tide out (b: the orchard under water); 6 1 flakes falling over it, -1 all of it blown off on the wind; 7 1 a great low sun or moon in rings, -1 heaped cloud
// One place of the scene: two pigments in the light, two in the shade, an odd one; how much light; which sound dyes it.
vec3 dqL1, dqL2, dqS1, dqS2, dqK, dqDye;
float dqLit, dqOdd, dqAmt, dqGlow, dqHaze, dqSh, dqEd; // own light, how far off, where the boats and the quay are
void dqSet(vec3 l1, vec3 l2, vec3 s1, vec3 s2, vec3 k, float odd, float lit) { dqL1 = l1; dqL2 = l2; dqS1 = s1; dqS2 = s2; dqK = k; dqOdd = odd; dqLit = lit; }
void dqBy(vec3 dye, float amt) { dqDye = dye; dqAmt = amt; dqGlow = 0.0; }
float dqBar(vec2 p, vec2 a, vec2 b) { vec2 d = b - a; return length(p - a - d * sat(dot(p - a, d) / dot(d, d))); }

float dqFall(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); }
const float dqHz = .09, dqWl = -.17;   // the far water's edge, and where the hulls meet the water
float dqBow(vec2 q) { float u = sat((q.y - dqWl) / .23); return q.x - .215 + .15 * sqrt(u); }
// A great sun at d from here, or heaped cloud.
void dqSky(vec2 d, float up) {
  dqHaze = .8;
  if (uOwn[7] > 0.0) {
    float r = length(d), o = uOwn[7], ring = .5 + .5 * cos(r * 48.0 - uTime * .12);
    dqLit += o * exp(-r * 2.6) * (2.2 * ring - .8);
    dqGlow = .8 * o * exp(-r * 3.4) * ring;
    if (r < .17 * o) { dqSet(vec3(1.0,.92,.7), vec3(1.0,.82,.52), vec3(.98,.7,.46), vec3(.96,.86,.66), vec3(1.0,.97,.88), .1, 1.2); dqBy(mix(uKind[3], vec3(1.0), .3), 1.0); dqGlow = o; }
  }
  if (uOwn[7] < 0.0) {
    float n = fbm(vec2(d.x * 2.3 + .006 * uTime, d.y * 3.6 + 4.0)), m = fbm(vec2(d.x * 2.3 + .006 * uTime - .12, d.y * 3.6 + 4.35));
    float c = smoothstep(.47, .54, n + .05 * (1.0 - up));
    dqLit = mix(dqLit, mix(-.1, .5 + 9.0 * (n - m), c), -uOwn[7]);
    dqS1 = mix(dqS1, mix(vec3(.3,.42,.6), vec3(.42,.42,.56), c), -uOwn[7]); dqS2 = mix(dqS2, vec3(.36,.4,.62), -uOwn[7]);
  }
}
float dqRail(float x) { float u = max(x - .08, 0.0); return .06 - .17 * u + .12 * u * u; }
// What stands over the water: q among the hulls, f among the far things.
void dqOver(vec2 q, vec2 f) {
  dqHaze = .12;
  if (q.x > 0.0 && q.y > dqWl) {
    dqBy(uKind[0], uDrone);
    // the near hull
    float bow = dqBow(q), d = dqRail(q.x) - q.y;
    if (bow > 0.0 && d > 0.0) {
      if (d < .02) dqSet(vec3(1.0,.86,.58), vec3(.99,.7,.42), vec3(.56,.48,.74), vec3(.5,.3,.5), vec3(1.0,.97,.9), .1, .85);
      else if (d > .05 && d < .066) dqSet(vec3(1.0,.94,.8), vec3(.9,.84,.9), vec3(.66,.7,.9), vec3(.8,.7,.8), vec3(1.0,.97,.9), .1, .65);
      else if (q.y < dqWl + .04) dqSet(vec3(.96,.46,.22), vec3(.9,.26,.18), vec3(.6,.12,.26), vec3(.34,.14,.42), vec3(.1,.5,.5), .1, .5);
      else dqSet(vec3(.94,.48,.28), vec3(.4,.44,.8), vec3(.16,.18,.5), vec3(.36,.14,.42), vec3(.06,.42,.52), .14, .10 + .3 * dqFall(.14, 0.0, bow));
      return;
    }
    // masts, a furled sail
    float m1 = q.x - .45, m2 = q.x - .72, m3 = q.x - 1.04;
    if (uOwn[4] > 0.0) {
      float k = floor(q.x / .125), n = fract(q.x / .125) - .5;
      if (abs(n) < .065 * uOwn[4] && q.y < .16 + .34 * hash11(k + 3.0)) { dqSet(vec3(1.0,.72,.42), vec3(.9,.48,.3), vec3(.22,.22,.5), vec3(.4,.22,.42), vec3(.2,.5,.6), .06, .5 - 8.0 * n); return; }
    }
    float m = abs(m1) < .0175 - .008 * q.y ? m1 : abs(m2) < .014 - .006 * q.y ? m2 : abs(m3) < .015 ? m3 : 9.0;
    if (m < 1.0) { dqSet(vec3(1.0,.68,.34), vec3(.94,.5,.28), vec3(.22,.22,.54), vec3(.42,.2,.42), vec3(.2,.5,.6), .06, .5 - 70.0 * m); return; }
    float u = q.y - .118 - .13 * (q.x - .47), w = .030 * dqFall(1.02, .94, q.x) + .006 * sin(q.x * 34.0);
    if (q.x > .47 && abs(u) < w) { dqSet(vec3(.97,.66,.36), vec3(.95,.8,.52), vec3(.62,.3,.34), vec3(.42,.28,.54), vec3(.2,.56,.6), .06, .5 + 18.0 * u + .25 * sin(q.x * 68.0)); return; }
    // the deckhouse, with its windows
    if (q.x > .56 && q.x < .90 && q.y < .062) {
      float win = step(abs(fract((q.x - .56) / .085) - .5), .28) * step(abs(q.y - .022), .017);
      if (win > .5 || q.y > .05) dqSet(vec3(.56,.72,.8), vec3(.98,.8,.5), vec3(.16,.34,.56), vec3(.34,.24,.54), vec3(.1,.5,.5), .06, .14);
      else dqSet(vec3(1.0,.82,.52), vec3(.98,.66,.4), vec3(.7,.56,.78), vec3(.6,.6,.84), vec3(1.0,.94,.8), .1, .82);
      dqGlow = win;
      return;
    }
    float r2 = .115 - .10 * max(q.x - .28, 0.0);
    if (q.x > .36 - .12 * sqrt(sat((q.y - dqWl) / .3)) && q.y < r2) {
      if (q.y > r2 - .02) dqSet(vec3(1.0,.93,.78), vec3(1.0,.8,.54), vec3(.62,.6,.84), vec3(.72,.62,.8), vec3(.95,.6,.4), .1, .8);
      else dqSet(vec3(.34,.68,.6), vec3(.66,.76,.48), vec3(.08,.4,.52), vec3(.18,.3,.58), vec3(.95,.6,.3), .08, .45);
      return;
    }
  }
  dqBy(uKind[1], uPad); dqHaze = .7;
  float h = f.y - dqHz;
  if (h < 0.0) { dqSet(vec3(.96,.84,.66), vec3(.72,.82,.82), vec3(.4,.62,.82), vec3(.56,.54,.82), vec3(.36,.7,.66), .13, .3); return; }
  if (h < .2) {
    // a light tower, houses, a sail, a far hill
    float tw = f.x + .19, wide = .023 - .055 * h;
    if (h < .165 && abs(tw) < wide) {
      if (h > .138) dqSet(vec3(.96,.46,.24), vec3(.98,.62,.3), vec3(.56,.2,.36), vec3(.4,.26,.56), vec3(1.0,.9,.6), .1, .6 - 20.0 * tw);
      dqGlow = step(.145, h);
      if (h <= .138) dqSet(vec3(1.0,.94,.76), vec3(1.0,.8,.5), vec3(.42,.46,.78), vec3(.56,.42,.68), vec3(.98,.9,.8), .05, .42 - 28.0 * tw);
      return;
    }
    float bx = f.x * 11.0, bh = hash11(floor(bx) + 9.0), by = fract(bx);
    float wall = .02 + .03 * bh, gable = wall + .022 * (1.0 - abs(2.0 * by - 1.0) * .7);
    float there = step(f.x, -.272) * step(bh, .86);
    if (there > .5 && h < gable && h > .006) {
      if (h > wall) dqSet(vec3(.96,.5,.3), vec3(.98,.64,.42), vec3(.62,.34,.5), vec3(.5,.4,.7), vec3(.98,.8,.6), .08, .7);
      else dqSet(vec3(1.0,.89,.66), vec3(1.0,.78,.54), vec3(.48,.5,.8), vec3(.62,.5,.74), vec3(.98,.94,.8), .08, by > .62 ? .1 : .95);
      return;
    }
    if (h < .02 && f.x < -.10 && (h < .007 || f.x > -.272)) { dqSet(vec3(.9,.68,.6), vec3(.96,.78,.6), vec3(.46,.46,.76), vec3(.58,.46,.72), vec3(.4,.62,.7), .1, .3); return; }
    float sl = f.x + .02;
    if (h > .006 && h < .105 && abs(sl + .10 * h) < .036 * (1.0 - h / .11)) { dqSet(vec3(.98,.58,.28), vec3(.96,.72,.42), vec3(.66,.3,.4), vec3(.48,.34,.6), vec3(1.0,.88,.6), .06, .65 - 18.0 * sl); return; }
    if (h < .028 + .016 * sin(f.x * 3.1 + .6) + .006 * sin(f.x * 9.0)) { dqSet(vec3(.88,.74,.78), vec3(.8,.8,.84), vec3(.64,.68,.88), vec3(.72,.66,.86), vec3(.98,.84,.66), .1, .35); return; }
  }
  float up = sat(h / .42), veil = noise(vec2(f.x * 1.3 + f.y * 2.0, f.y * 6.0 + 3.0)) - .5;
  dqSet(mix(vec3(1.0,.86,.56), vec3(.98,.9,.76), up), mix(vec3(.99,.74,.58), vec3(.96,.8,.8), up),
        mix(vec3(.82,.76,.88), vec3(.56,.77,.89), up), mix(vec3(.74,.84,.84), vec3(.72,.73,.91), up), vec3(.99,.95,.84), .1, .95 - up + .6 * veil);
  dqSky(f - vec2(-.48,.25), up);
}
void dqQuay(vec2 p) {
  float edge = -.405 - .165 * p.x - p.y - dqEd;      // over 0 on the stones of the quay
  if (edge > -.15) {
    // two bollards
    dqBy(uKind[3], .5 * uPhrase);
    bool near = p.x > -.38;
    p.y += dqEd;
    vec2 d = near ? (p - vec2(-.15,-.435)) / 1.35 : (p - vec2(-.72,-.325)) / .9;
    vec2 cap = (d - vec2(0.0,.078)) / vec2(.043,.024);
    if (dot(cap, cap) < 1.0 || (abs(d.x) < .031 - .08 * d.y && d.y > -.012 && d.y < .078)) {
      dqSet(vec3(1.0,.64,.32), vec3(.94,.42,.26), vec3(.16,.18,.48), vec3(.36,.14,.4), vec3(.1,.46,.5), .1, .3 - 30.0 * d.x);
      return;
    }
    if (edge > 0.0) {
      dqSet(vec3(1.0,.89,.66), vec3(.99,.75,.55), vec3(.76,.7,.9), vec3(.92,.68,.74), vec3(.66,.82,.8), .08, .80 - .45 * step(.46, abs(fract((p.x - edge * 1.6) * 2.7) - .5)));
      if (dqBar(d, vec2(0.0), vec2(.34,-.09)) < .026) dqSet(vec3(.92,.62,.62), vec3(.7,.66,.9), vec3(.32,.4,.8), vec3(.48,.36,.72), vec3(.4,.66,.7), .1, .12);
      else if (edge < .02) { dqS1 = vec3(.98,.82,.66); dqL1 = vec3(1.0,.97,.86); dqLit = .9; }
      return;
    }
    p.y -= dqEd;
  }
  vec2 b = vec2(p.x - dqSh, p.y);
  if (p.y > dqHz || (p.y > dqWl && dqBow(b) > 0.0 && b.x > 0.0)) { dqOver(b, p); return; }
  // the water, with what stands over it upside down
  float down = dqHz - p.y, below = max(dqWl - p.y, 0.0);
  float sw = sin(p.y * 95.0 + p.x * 3.0 + uTime * .45) + .6 * sin(p.y * 43.0 - p.x * 7.0 - uTime * .31);
  float x = p.x + sw * (.003 + .022 * below + .015 * down), crest = 0.0;
  if (uOwn[5] > 0.0) {
    crest = sin(3.6 / (down + .075) + .9 * sin(p.x * 2.1 + uTime * .05) + .5 * sin(p.x * 5.3 - 1.0 / (down + .2)) + uTime * .35) * uOwn[5] * smoothstep(0.0, .06, down);
    x += crest * .08 * down;
  }
  dqOver(vec2(x - dqSh, below > 0.0 ? 2.0 * dqWl - p.y : -9.0), vec2(x, dqHz + down * .95));
  float streak = noise(vec2(p.x * 3.2 + .03 * uTime, p.y * 34.0));
  float gl = (p.x + .40 + .1 * down) / (.10 + .35 * down), gleam = exp(-gl * gl);
  vec4 m = piece(vec2(p.x * .56 + .5, sat(down / .6)));
  dqS1 = mix(dqS1, vec3(.28,.56,.8), .55); dqS2 = mix(dqS2, vec3(.46,.44,.78), .45);
  dqL2 = mix(dqL2, vec3(.6,.8,.8), .3);
  dqK = vec3(.36,.7,.66); dqOdd = .13;
  dqHaze = .7 * exp(-down * 6.0);
  dqLit = dqLit * .62 - .1 - .25 * smoothstep(0.0, .5, down) + .55 * (streak - .5) + .5 * gleam * streak + .35 * m.a
        + (.3 + .5 * uEnergy) * band(.5 + p.x * .55) * smoothstep(.35, .75, streak);
  // the gleam takes the phrase, the rest the texture and, where a sound of the piece lies, its colour
  float w = sat(1.6 * gleam - .3);
  dqBy(mix(mix(uKind[2], m.rgb / max(m.a, .02), sat(3.0 * m.a)), uKind[3], w), max(mix(.7 * uTexture, uPhrase, w), .6 * m.a));
  if (uOwn[5] > 0.0) {
    dqLit = mix(dqLit, .5 + .9 * crest + .5 * (streak - .5), .8 * uOwn[5]);
    dqS1 = mix(dqS1, vec3(.14,.32,.5), .75 * uOwn[5]); dqS2 = mix(dqS2, vec3(.18,.44,.52), .75 * uOwn[5]);
    dqL1 = mix(dqL1, vec3(.97,.96,.9), uOwn[5]); dqL2 = mix(dqL2, vec3(.62,.8,.8), uOwn[5]);
  }
  if (uOwn[7] > 0.0) { float u = (p.x + .48) / (.07 + .1 * down); dqGlow = max(dqGlow, uOwn[7] * exp(-u * u) * smoothstep(.3, .6, streak)); dqLit += dqGlow * .6; }
  if (uOwn[5] < 0.0) {
    float dry = -uOwn[5] * smoothstep(.36, .45, fbm(vec2(p.x * 1.6 + 3.0 * down, 1.1 / (down + .1))) + .06 * sin(down * 30.0 + p.x * 4.0));
    dqL1 = mix(dqL1, vec3(.98,.85,.62), dry); dqL2 = mix(dqL2, vec3(.93,.72,.54), dry); dqS1 = mix(dqS1, vec3(.7,.56,.52), dry); dqS2 = mix(dqS2, vec3(.58,.5,.6), dry); dqK = mix(dqK, vec3(.76,.64,.46), dry);
    dqLit = mix(dqLit + .35 * -uOwn[5], .4 + .5 * (streak - .5), dry); dqDye = mix(mix(dqDye, uKind[1], -.6 * uOwn[5]), uKind[2], dry);
  }
}
// The trees: middle and size of the crown.
const vec3 dqT0 = vec3(.44,.09,.25), dqT1 = vec3(-.7,-.02,.215), dqT2 = vec3(1.1,.12,.2), dqT3 = vec3(-1.18,0.0,.2), dqT4 = vec3(-.07,.055,.135),
  dqT5 = vec3(.79,.24,.11), dqT6 = vec3(-.31,.055,.085), dqT7 = vec3(.17,.165,.075), dqT8 = vec3(-.44,.05,.055);
vec3 dqNear(float x) { return x < -.4 ? (x < -.945 ? dqT3 : dqT1) : x < .12 ? dqT4 : x < .8 ? dqT0 : dqT2; }
vec3 dqFar(float x) { return x < 0.0 ? (x < -.39 ? dqT8 : dqT6) : x < .5 ? dqT7 : dqT5; }
// How deep a place of the grass lies in the shadow of tree t.
vec3 dqTree(vec3 t) { if (uOwn[4] < 0.0 && t.x != dqT0.x) t.z = max(t.z * (1.0 + uOwn[4]), .002); return t; }
float dqShade(vec2 p, vec3 t) { if (uOwn[4] != 0.0) t = dqTree(t); vec2 d = (p - t.xy) / t.z + vec2(1.35,1.75); d.y -= .16 * d.x; d *= vec2(.62,2.3); return 1.25 - dot(d, d); }
void dqLand(vec2 p) {
  vec2 tall = exp2(max(uOwn[4], 0.0) * vec2(1.15,-.95));
  for (int i = 0; i < 2; i++) {
    vec3 t = i == 0 ? dqNear(p.x) : dqFar(p.x);
    if (uOwn[4] != 0.0) t = dqTree(t);
    vec2 d = (p - t.xy) / t.z;
    if (uOwn[4] > 0.0) { d.x += uOwn[4] * .55 * sin(t.x * 40.0); d = d * tall + vec2(0.0, -.42 * uOwn[4]); if (uOwn[4] > .4) d.y = d.y > 0.0 ? d.y : d.y * 1.6; }
    dqHaze = max(.75 - 2.7 * t.z, 0.0);
    if (abs(d.x) > 1.3 || d.y > 1.2 || d.y < -1.7) continue;
    float fi = t.x * 9.0 + 2.0;
    vec2 u = d + .10 * sin(d.yx * vec2(4.3,5.1) + fi * vec2(2.1,1.3)) + .05 * sin(d.yx * 11.0 + fi);
    u.y -= .07 * u.x * u.x + .22 * max(-d.y, 0.0);
    if (dot(u, u) < 1.0) {
      float lump = sin(d.x * 5.0 + fi) * sin(d.y * 5.5 + 1.7 * fi);
      float lit = .45 + .55 * dot(d, vec2(.62,.72)) + .28 * lump;
      dqSet(vec3(.95,.84,.26), vec3(.62,.78,.22), vec3(.1,.42,.36), vec3(.18,.26,.6), lit > .4 ? vec3(.99,.5,.2) : vec3(.5,.16,.44), .12, lit);
      dqBy(uKind[3], uPhrase);
      return;
    }
    float lean = d.x - .08 * sin(d.y * 2.0 + fi);
    if (d.y < -.5 && d.y > -1.6 && abs(lean) < .075 + .06 * dqFall(-1.2, -1.6, d.y)) {
      dqSet(vec3(.99,.66,.38), vec3(.86,.48,.46), vec3(.26,.24,.54), vec3(.44,.22,.44), vec3(.2,.5,.5), .1, .4 + 6.0 * lean);
      dqBy(uKind[0], uDrone);
      return;
    }
  }
  float g = .115 + .115 * p.x + .02 * sin(p.x * 2.6 + .6) - p.y;
  dqHaze = .7 * exp(-max(g, 0.0) * 6.0);
  if (g > 0.0) {
    float far = exp(-g * 5.0), row = noise(vec2(p.x * 2.0 + p.y * 5.0, (p.y - .115 * p.x) * 22.0));
    float shade = max(dqShade(p, p.x < -.5 ? (p.x < -1.28 ? dqT3 : dqT1) : p.x < .5 - .3 * min(uOwn[4], 0.0) ? dqT0 : dqT2), dqShade(p, p.x > .4 ? dqT5 : p.y > -.135 ? dqT6 : dqT4));
    if (shade > .28 + .16 * sin(p.x * 17.0 + p.y * 31.0) + .3 * (row - .5)) {
      dqSet(vec3(.62,.7,.4), vec3(.8,.56,.6), vec3(.24,.38,.78), vec3(.44,.36,.74), vec3(.16,.54,.6), .12, .12 + .5 * smoothstep(.75, .9, row));
      dqBy(uKind[0], uDrone);
    } else {
      vec4 m = piece(vec2(p.x * .56 + .5, sat(g * 1.6)));
      dqSet(mix(vec3(.94,.84,.3), vec3(.98,.88,.54), far), mix(vec3(.68,.78,.28), vec3(.8,.84,.52), far), vec3(.38,.66,.36), vec3(.3,.6,.52), vec3(.98,.6,.36), .1,
            .66 + .6 * (row - .5) + (.2 + .4 * uEnergy) * band(.5 + p.x * .55) * (row - .2));
      dqBy(mix(uKind[2], m.rgb / max(m.a, .02), sat(3.0 * m.a)), max(.7 * uTexture, .6 * m.a));
      if (uOwn[5] > 0.0) {       // rows of a crop, running to a point
        float r = sin((p.x + .12) / (g + .1) * 4.6 + .6), o = uOwn[5] * smoothstep(0.0, .05, g);
        dqLit = mix(dqLit, .5 + .7 * r + .4 * (row - .5), o);
        r = o * smoothstep(-.15, .25, r);
        dqL1 = mix(dqL1, vec3(.74,.56,.84), r); dqL2 = mix(dqL2, vec3(.6,.5,.86), r); dqK = mix(dqK, vec3(.92,.62,.74), r);
        dqDye = mix(dqDye, uKind[4], r * (1.0 - sat(2.0 * m.a)));
      }
    }
    return;
  }
  dqBy(uKind[1], uPad); dqHaze = .75;
  if (p.y < .16 + .05 * sin(p.x * 2.2 + 2.4) + .02 * sin(p.x * 5.1)) {
    dqSet(vec3(.92,.78,.7), vec3(.7,.82,.7), vec3(.54,.64,.88), vec3(.66,.6,.84), vec3(.98,.88,.6), .1, .35 + 6.0 * (.14 - p.y));
    return;
  }
  float up = sat((p.y - .1) / .4);
  dqSet(mix(vec3(1.0,.9,.66), vec3(.98,.92,.8), up), mix(vec3(.99,.8,.7), vec3(.94,.84,.88), up), mix(vec3(.72,.84,.88), vec3(.52,.74,.9), up),
        mix(vec3(.82,.78,.9), vec3(.68,.76,.92), up), vec3(.97,.9,.84), .05, .75 - .7 * up + .8 * (noise(vec2(p.x * 2.0, p.y * 5.0)) - .5));
  dqSky(p - vec2(-.16,.27), up);
}
void dqOrchard(vec2 p) {
  float edge = uOwn[5] < 0.0 ? mix(-.62, -.1, -uOwn[5]) + .012 * sin(p.x * 3.0) - p.y : -1.0;
  if (edge < 0.0) { dqLand(p); return; }
  float sw = sin(p.y * 95.0 + p.x * 3.0 + uTime * .45) + .6 * sin(p.y * 43.0 - p.x * 7.0 - uTime * .31);
  dqLand(vec2(p.x + sw * (.003 + .03 * edge), p.y + 2.0 * edge));
  vec4 m = piece(vec2(p.x * .56 + .5, sat(edge * 2.2)));
  dqS1 = mix(dqS1, vec3(.3,.5,.7), .35); dqLit = dqLit * .8 - .1 + .6 * (noise(vec2(p.x * 3.2 + .03 * uTime, p.y * 34.0)) - .5) + .35 * m.a;
  dqHaze = .5 * exp(-edge * 6.0); dqDye = mix(mix(dqDye, uKind[2], .35), m.rgb / max(m.a, .02), sat(1.5 * m.a)); dqAmt = max(dqAmt, .6 * m.a);
}
// How the dabs lie at a place: which way (xy), how long (z), how fat the sound there makes them (w).
vec4 dqWay(float ang, float lng, float fat) { return vec4(cos(ang), sin(ang), lng, fat); }
vec4 dqLie(vec2 p) {
  if (uVar < .5) {
    float sky = smoothstep(dqHz - .01, dqHz + .02, p.y), hull = sat(dqBow(p - vec2(dqSh, 0.0)) * 30.0) * smoothstep(dqWl - .01, dqWl + .01, p.y);
    float quay = smoothstep(-.02, .01, -.405 - .165 * p.x - p.y - dqEd);
    vec4 l = vec4(1.0, 0.0, 1.5, uTexture);
    l = mix(l, dqWay(.35 + .5 * sin(p.x * 2.0 + p.y * 4.0), 1.2, uPad), sky);
    l = mix(l, vec4(.99, -.15, 1.38, uDrone), hull * (1.0 - smoothstep(0.0, .03, p.y - .13)));
    return mix(l, vec4(.99, -.16, 1.2, .5 * uPhrase), quay);
  }
  float sky = smoothstep(-.01, .03, p.y - .115 - .115 * p.x);
  vec4 l = mix(vec4(.99, .14, 1.4, uTexture), dqWay(-.3 + .5 * sin(p.x * 2.0 - p.y * 3.0), 1.2, uPad), sky);
  vec3 t = dqNear(p.x);
  vec2 d = (p - t.xy) / t.z;
  float r = dot(d, d);
  return mix(l, vec4(d.y < 0.0 ? vec2(-d.y, d.x) : vec2(d.y, -d.x), 1.35, uPhrase), dqFall(1.3, .9, r) * smoothstep(0.0, .1, r));
}
float dqLum(vec3 c) { return dot(c, vec3(.3,.59,.11)); }
vec2 dqHit; float dqWarm;   // where a hit falls, and how far the hour leans to the warm dabs
vec3 dqPaint(vec2 c, float h1, float h2) {
  float h3 = fract(h1 * 131.7), h4 = fract(h1 * 717.3), h5 = fract(h1 * 311.9);
  // a cue: a slow gleam that crosses
  float gx = c.x + .3 * c.y - mix(-.6, .8, 1.0 - uCue), cue = sat(1.0 - gx * gx * 5.0);
  cue *= cue * uCue;
  // light or shade, then one pigment of two
  float lit = dqLit + dqWarm + .05 * sin(uTime * (.2 + .25 * h3) + h4 * TAU) + .7 * cue;
  vec3 k = mix(h4 < .5 ? dqS1 : dqS2, h3 < .6 ? dqL1 : dqL2, smoothstep(h5 - .07, h5 + .07, lit));
  if (fract(h2 * 91.7) < dqOdd) k = mix(dqK, vec3(1.0,.93,.74), .75 * uKeys);
  k *= .97 + .07 * (h2 - .5);
  if (uOwn[2] > 0.0) {                  // from the dark to the light of one colour, and the odd dab another
    float l = sat(dqLum(k) * 1.15 - .08);
    vec3 of = fract(h2 * 91.7) < dqOdd ? mix(dqDye, uKind[4], .6) : dqDye * (.9 + .2 * h4) + .05 * (vec3(h3, h4, h5) - .5);
    k = mix(k, sat(l < .5 ? mix(of * of * .3, of, l * 2.0) : mix(of, vec3(.97,.94,.88), (l * 2.0 - 1.0) * .8)), uOwn[2]);
  }
  // the sound dyes its share of the dabs, each at about the lightness it had
  float l = dqLum(k), share = smoothstep(0.0, .25, dqAmt * (.2 + .42 * uEnergy) - fract(h1 * 991.3) * .95);
  vec3 dye = mix(dqDye * l / max(dqLum(dqDye), .05), vec3(l), max(0.0, l - .6) * .9);
  k = mix(k, sat(dye), .75 * share);
  if (uOwn[3] > 0.0) {
    vec2 d = uVar < .5 ? c - vec2(-.19,.243) : c - vec2(.24,-.03);   // the lamp of the tower, or a lantern on the ladder
    float r = length(d), halo = exp(-r * (uVar < .5 ? 9.0 : 7.0)) * (.75 + .25 * cos(r * 90.0));
    if (uVar < .5 && c.y < dqHz) halo = max(halo, .75 * exp(-abs(d.x) * 26.0 / (1.0 + 4.0 * (dqHz - c.y))) * exp((c.y - dqHz) * 3.0));
    l = dqLum(k);
    vec3 dark = mix(k, vec3(l), .35) * vec3(.24,.3,.46) + vec3(.012,.02,.05) + .06 * h3 * vec3(.5,.7,1.0);
    if (dqHaze > .78 && h4 > .988) dark = vec3(.7,.74,.8) * (.5 + h3);
    float lamp = smoothstep(h5 * .55, h5 * .55 + .12, halo * (.8 + .4 * uPhrase));
    dark = mix(dark, mix(vec3(1.0,.8,.46), uKind[3], .35) * (.35 + .75 * l + .7 * exp(-r * r * 160.0)), lamp * .85);
    k = mix(k, mix(dark, k, sat(dqGlow)), uOwn[3]);
  }
  if (uOwn[3] < 0.0) k = mix(k, (vec3(.88,.87,.85) + .07 * (h4 - .5)) * mix(vec3(1.0), uKind[1] + .35, .35), -uOwn[3] * min(dqHaze * 1.1 + .18, .95));
  if (uOwn[2] < 0.0) {
    l = dqLum(k);
    k = mix(k, mix(vec3(.93,.885,.79), mix(vec3(.1,.09,.11), dqDye * .45, .4 + .5 * share), smoothstep(h5 * .8 + .1, h5 * .8 + .2, 1.0 - l + .22 * dqAmt)), -uOwn[2]);
  }
  if (h2 > 1.5) k = mix(vec3(.99,.98,.96), uKind[4], .5) * mix(1.0, .75, max(uOwn[3], 0.0)) * (.9 + .1 * h3);
  // a hit pales the dabs in one soft circle
  vec2 hc = c - dqHit;
  float pale = uHits * dqFall(.036, .004, dot(hc, hc)) * smoothstep(.2, .5, h4) + .12 * cue;
  return mix(k, mix(vec3(1.0,.97,.9), uKind[4], .12), sat(pale));
}
// A row of dabs from a to b: cover, the dab's own number.
vec2 dqRow(vec2 p, vec2 a, vec2 b, float sag, float gap, vec2 half_) {
  vec2 ab = b - a, dir = ab / length(ab);
  float n = floor(length(ab) / gap), k = clamp(floor(dot(p - a, dir) / gap), 0.0, n), u = k / n;
  vec2 d = p - a - dir * (k + .5) * gap;
  float h = hash11(k + a.x * 31.0);
  d = vec2(dot(d, dir), dot(d, vec2(-dir.y, dir.x)) + sag * 4.0 * u * (1.0 - u)) / (half_ * (.75 + .4 * h));
  return vec2(sat(.5 + (1.0 - dot(d, d)) * .5 * min(half_.x, half_.y) * uRes.y), h);
}
vec3 render(vec2 p) {
  dqHit = vec2(.22 * sin(uTime * .11), -.08 + .14 * sin(uTime * .083 + 1.0));
  dqWarm = .12 * (uTone - .5) + .12 * uMic - .09 * cos(TAU * uLoop);
  dqSh = -.4 * max(uOwn[4], 0.0) - 1.4 * min(uOwn[4], 0.0); dqEd = -.5 * min(uOwn[4], 0.0);
  vec4 lie = dqLie(p);
  float fat = 1.0 + .2 * lie.w + .16 * (.5 - uSpace), root = sqrt(lie.z);
  lie.xy /= max(length(lie.xy), .01);
  mat2 grain = mat2(lie.x, -lie.y, lie.y, lie.x);
  // three sheets of dabs: the dab seen here and the one under its edge
  float many = exp2(uOwn[0] * (uOwn[0] > 0.0 ? -1.25 : -.75)), tile = max(-uOwn[1], 0.0), drawn = 2.4 * max(uOwn[1], 0.0), falls = max(uOwn[6], 0.0);
  const vec2 way = vec2(.62,.785);
  if (uOwn[1] > 0.0) { grain = grain * (1.0 - .8 * uOwn[1]) + mat2(.8 * uOwn[1]); }
  vec2 sp = p - way * dot(way, p) * drawn / (1.0 + drawn);
  vec4 one = vec4(p, .5, .5), two = one;
  float a1 = 0.0, a2 = 0.0;
  for (int s = 0; s < 3; s++) {
    float rows = (84.0 - 12.0 * float(s)) * many, seed = float(s) + 1.0;
    mat2 m = s == 0 ? mat2(.9211, -.3894, .3894, .9211) : s == 1 ? mat2(.7648, .6442, -.6442, .7648) : mat2(.4085, -.9128, .9128, .4085);
    if (tile > 0.0) m = rot((s == 0 ? .4 : s == 1 ? -.7 : 1.15) * (1.0 - tile) + .1 * tile);
    vec2 q = m * sp * rows + seed * 3.17;
    if (uOwn[6] != 0.0) q += mod(uTime * rows * (m * vec2(.014 * min(uOwn[6], 0.0) + (s == 0 ? -.012 * falls : 0.0), s == 0 ? .04 * falls : 0.0)), 289.0);
    vec2 at = floor(q - .5);
    for (int j = 0; j < 4; j++) {
      vec2 par = vec2(j & 1, (j >> 1) ^ (j & 1)), id = at + mod(par - at, 2.0);
      float h1 = hash21((uOwn[6] != 0.0 ? mod(id, 289.0) : id) + seed * 7.0), h2 = fract(h1 * 57.31), size = (.36 + .17 * fract(h1 * 131.7)) * fat;
      vec2 d = (q - id - .5 - (vec2(h1, h2) - .5) * (.54 - .4 * tile)) * m;
      if (tile > 0.0) size = mix(size, s == 0 ? .455 : .001, tile);
      bool flake = falls > 0.0 && s == 0;
      if (flake) size *= fract(h1 * 391.7) < .2 ? .6 + h2 * .7 : 1.0 - falls;
      if (dot(d, d) > 1.9 * size * size) continue;
      float tip = (fract(h1 * 717.3) - .5) * (.8 - .55 * tile);
      vec2 e = grain * d / size;
      if (tile > 0.0) e = mix(e, m * d / size, tile);
      e = (e + tip * vec2(-e.y, e.x)) * vec2(1.0 / root, root);
      if (tile > 0.0) e *= mix(vec2(1.0), vec2(root, 1.0 / root), tile);
      float rr = dot(e, e) / (1.0 + tip * tip) * (1.0 + .2 * (fract(h1 * 43.0) - .5) * e.x);
      if (tile > 0.0) rr = mix(rr, sqrt(e.x * e.x * e.x * e.x + e.y * e.y * e.y * e.y), tile);
      float a = sat(.5 + (1.0 - rr) * .23 * uRes.y * size / rows);
      if (a > .02) {
        vec4 dab = vec4(p - d / rows, h1, h2);
        if (drawn > 0.0) dab.xy = p - (d + way * dot(way, d) * drawn) / rows;
        if (uOwn[6] < 0.0) dab.xy += uOwn[6] * vec2(.26,.05) * h2 * h2 * h2;
        if (flake && fract(h1 * 391.7) < .2) dab.w += 2.0;
        if (a1 < .02) { one = dab; a1 = a; }
        else if (a2 < a) { two = dab; a2 = a; }
        if (max(a1, a2) > .95) break;
      }
    }
    if (max(a1, a2) > .95) break;
  }
  if (uVar < .5) dqQuay(one.xy); else dqOrchard(one.xy);
  vec3 col = vec3(.93,.885,.79) * mix(1.0, .1, max(uOwn[3], 0.0)) * mix(1.0, .8, tile);
  if (a1 < .95) col = mix(col, dqPaint(two.xy, two.z, two.w), a2);
  col = mix(col, dqPaint(one.xy, one.z, one.w), a1 > .95 ? 1.0 : a1);
  vec2 row = vec2(0.0);
  if (uVar < .5) {
    vec2 half_ = vec2(.006,.0031);
    row = p.x < .1 && p.y < .03 ? dqRow(p, vec2(-.14,-.345), vec2(.105,-.005), .03, .0125, half_)
      : p.x < .45 ? dqRow(p, vec2(.075,.066), vec2(.44,.64), 0.0, .0125, half_) : dqRow(p, vec2(.46,.64), vec2(.96,.02), 0.0, .0125, half_);
  } else if (abs(p.x - .32) < .09 && abs(p.y + .1) < .19) {
    vec2 r0 = dqRow(p, vec2(.262,-.265), vec2(.352,.065), 0.0, .0125, vec2(.0072,.0046));
    vec2 r1 = dqRow(p, vec2(.306,-.272), vec2(.380,.06), 0.0, .0125, vec2(.0072,.0046));
    vec2 r2 = dqRow(p, vec2(.284,-.26), vec2(.366,.05), 0.0, .037, vec2(.0042,.016));
    row = r0.x > r1.x ? r0 : r1;
    row = row.x > r2.x ? row : r2;
  }
  vec3 cord = uVar < .5 ? (row.y < .6 ? vec3(.34,.26,.56) : vec3(.96,.58,.32)) : (row.y < .65 ? vec3(1.0,.8,.5) : vec3(.95,.52,.34));
  if (uOwn[4] != 0.0 || uOwn[1] != 0.0 || uOwn[0] != 0.0 || uOwn[2] != 0.0) row.x *= (1.0 - smoothstep(.1, .4, max(max(abs(uOwn[4]), abs(uOwn[2])), max(abs(uOwn[1]), abs(uOwn[0])))));
  return mix(col, cord * mix(1.0, .45, max(uOwn[3], 0.0)), row.x);
}
