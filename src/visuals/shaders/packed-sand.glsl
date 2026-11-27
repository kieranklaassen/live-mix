// name: Packed sand
// a: In the bottle
// b: Falling hills
// what: The shoulder of a great round bottle by a window, packed with dyed sand grain by grain: level bands, a row of points, a striped hill with dark trees, water with one sail, far peaks; or two panes of glass with striped mountains of sand in water, threads of sand falling from a raft of bubbles, a low sun behind.
// follows: The piece lies in the bands and the hills: where it is loud they thicken and take its colours; a light stands where the loop is. Drone and pad dye the sand, texture speckles it, a phrase fills the sail or tints the ridges. The spectrum is the sixteen points, or the threads. A hit lets a pinch slide, a cue pours a new colour, keys glint.
// own: 0 moonlit night at -1, red evening at 1; 1 ash and salt at -1, bright dyed sands at 1; 2 low land at -1 (open water in the bottle), steep peaks at 1; 3 so near that every grain shows at -1, stood back at 1 (the panes in their frame); 4 a dark room at -1, a blue wall at 1; 5 the bottle square-shouldered at -1, a pointed flask at 1; between the panes most of the sand still held above at -1, nearly all of it fallen at 1
const vec3 psPlain[6] = vec3[6](vec3(0.86, 0.79, 0.66), vec3(0.67, 0.64, 0.59), vec3(0.76, 0.62, 0.43), vec3(0.55, 0.3, 0.17), vec3(0.33, 0.26, 0.21), vec3(0.94, 0.9, 0.82));
const vec3 psDyed[6] = vec3[6](vec3(0.95, 0.74, 0.22), vec3(0.16, 0.52, 0.58), vec3(0.9, 0.43, 0.18), vec3(0.72, 0.14, 0.15), vec3(0.13, 0.17, 0.42), vec3(0.96, 0.91, 0.8));
float psPx;   // a pixel
float psG;    // the size of a grain
vec2 psV;     // where on its grain the eye looks
float psTurn, psAx, psFoot;   // how the bottle is turned; how far from its middle a grain is seen, and its width at the trees' feet
float psRad, psPow;   // the bottle's belly and how square its shoulder is
const vec2 psMid = vec2(-0.27, -0.42);
float psNight, psDusk, psDim;   // the hour
vec3 psLamp;   // and its light
vec3 psC[6];   // the six sands: as dug, as ash and salt, or dyed
// From 0 at a to 1 at b, whichever is greater.
float psS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float psH(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
// The edge of a shape of packed grains.
float psIn(float d) { return psS(-0.4 * psG, 0.4 * psG, d); }
float psCut(float d) { return psS(psPx, -psPx, d); }
// Ash and salt in place of coloured sand.
vec3 psAshen(vec3 c) { float l = dot(c, vec3(0.3, 0.6, 0.1)); return mix(c, vec3(psS(0.12, 0.95, l) * 0.96 + 0.03), 0.92 * sat(-uOwn[1])); }
vec3 psTri(float o, vec3 a, vec3 b, vec3 c) { return mix(mix(b, a, sat(-o)), c, sat(o)); }
// A sound's colour as a dye that sand would take.
vec3 psDye(vec3 c) {
  float l = dot(c, vec3(0.3, 0.6, 0.1));
  c = 0.15 + 0.06 * l + 0.74 * c;
  return clamp(mix(c, vec3(1.35 * l - 0.1), 0.75 * sat(-uOwn[1])), 0.04, 0.95);
}
float psSmax(float a, float b, float k) { return -smin(-a, -b, k); }
// The half width of the bottle at a height.
float psWide(float y) {
  float dy = (y - psMid.y) / psRad;
  dy = dy < 0.0 ? -0.62 * dy : dy;
  float n = y < psMid.y ? max(psPow, 2.0) : psPow;
  float r = psRad * pow(max(1.0 - pow(dy + 1e-4, n), 0.0), 1.0 / n);
  return psSmax(r, 0.155 + 0.02 * psS(0.3, 0.45, y), 0.1);
}
vec3 psDyeOf(vec4 m) { return psDye(m.rgb / max(m.a, 0.004)); }
// The packed grain nearest to a place: round the belly (an angle) and up, then its distance and its own number. Turned: each
// row holds as many grains as fit round the bottle there.
vec4 psGrain(vec2 q, float turned) {
  float qy = q.y / psG, row0 = floor(qy - 0.5);
  vec4 best = vec4(0.0, 0.0, 9.0, 0.0);
  for (int j = 0; j < 2; j++) {
    float row = row0 + float(j), per = 1.0;
    if (turned > 0.5) per = max(psWide(0.06 + ((row + 0.5) * psG - 0.06) * 1.1), 0.1);
    float qx = q.x * per / psG, b = floor(qx - 0.5);
    for (int i = 0; i < 2; i++) {
      vec2 id = vec2(b + float(i), row);
      float h = hash31(vec3(id, 7.0));
      vec2 c = id + 0.5 + 0.56 * (vec2(h, fract(h * 61.7)) - 0.5);
      vec2 v = vec2(qx, qy) - c;
      float d = dot(v, v) * (0.75 + 0.6 * fract(h * 17.3));
      if (d < best.z) { best = vec4(c.x * psG / per, c.y * psG, d, h); psV = v; }
    }
  }
  best.z = sqrt(best.z);
  return best;
}
float psRange(float x, float f, float seed) {
  return 0.5 + 0.27 * sin(x * f + seed) + 0.15 * sin(x * f * 2.17 + seed * 2.3) + 0.08 * sin(x * f * 4.9 + seed * 4.1);
}
// A hill, packed in skins along its slope and dyed by the pad and the piece, with a line of other grains along its top.
vec3 psHill(vec3 col, float deep, vec4 m, vec3 lead, float pad, float w, float seed, float h, vec3 line, float wet) {
  lead = mix(mix(lead, psDye(uKind[1]), pad * uPad), psDyeOf(m), 0.7 * sat(m.a * 1.2));
  float u = deep / w + 0.2 * (h - 0.5), k = 5.7 * floor(u) + seed;
  vec3 skin = mix(psC[int(5.99 * psH(k - 5.7))], psC[int(5.99 * psH(k))], psS(0.0, 0.12, fract(u)));
  col = mix(col, mix(mix(lead, skin, 0.5 + 0.3 * sat(uOwn[1])), col, wet) * psDim, psIn(deep));
  return mix(col, line * psDim, psS(1.4 * psG, 0.5 * psG, abs(deep - 0.3 * psG)) * 0.6);
}
// The sand at a place on the glass: x round the belly, y its height; h the grain's own number.
vec3 psPacked(vec2 s, float h) {
  float h2 = fract(h * 91.3), h3 = fract(h * 37.7), x = s.x, y = s.y, px = sat(0.5 + x * 0.5);
  vec3 col, fresh = mix(psDye(uKind[4]), vec3(1.0, 0.85, 0.6), 0.3);
  if (y < -0.118) {
    // level bands, each as thick as the sound was there
    vec4 lay[9];
    float sum = 0.0, at = -0.47;
    for (int k = 0; k < 9; k++) {
      float fk = float(k);
      vec4 m = piece(vec2(px, 0.95 - 0.088 * fk));
      float a = sat(m.a * (0.65 + uEnergy));
      float thick = 0.45 + 0.75 * psH(fk * 5.3 + 3.1) + 2.2 * a + (k == 2 ? 1.5 * uDrone : 0.0);
      vec3 own = mix(psC[k % 2 == 1 ? (k == 5 ? 2 : 1) : k % 4 == 0 ? 0 : 5], psDyeOf(m), 0.92 * psS(0.02, 0.5, a));
      if (k == 2) own = mix(own, psDye(uKind[0]), 0.85 * uDrone);
      lay[k] = vec4(own * (k % 2 == 0 ? 1.12 : 0.86), thick);
      sum += thick;
    }
    col = psC[int(psH(floor(y * 42.0) * 3.3 + 900.0) * 2.99)];
    for (int k = 0; k < 9; k++) {
      col = mix(col, lay[k].rgb, psIn(y - at));
      col = mix(col, psC[4] * 0.8, psS(0.75 * psG, 0.3 * psG, abs(y - at)) * (k % 2 == 0 ? 0.75 : 0.25));
      at += lay[k].w / sum * 0.29;
    }
    // a row of points poked with the rod, one for each band
    float u = (x + 1.0) * 8.0, k = clamp(floor(u), 0.0, 15.0), b = uBands[int(k)];
    float tri = 1.0 - 2.0 * abs(fract(u) - 0.5), up = (y + 0.178) / 0.06;
    col = mix(col, psC[5], psS(-0.02, 0.06, up));
    float pt = tri * (0.45 + 0.5 * b) - up;
    col = mix(col, mix(psC[3], psDye(kindColour(k / 4.0)), 0.25 + 0.6 * b), psS(-0.05, 0.05, pt) * step(0.0, up + 0.05));
    col = mix(col, psC[4], psS(-0.05, 0.05, tri * 0.35 - up + 0.02) * step(0.0, up + 0.05));
  } else {
    // sky: grains of two sands mixed, more of one the higher
    float hor = 0.055, up = sat((y - hor) / 0.26);
    vec3 low = psTri(uOwn[0], vec3(0.3, 0.34, 0.46), vec3(0.93, 0.84, 0.7), vec3(0.95, 0.52, 0.26));
    vec3 high = psTri(uOwn[0], vec3(0.07, 0.09, 0.19), vec3(0.66, 0.74, 0.78), vec3(0.6, 0.3, 0.36));
    low = mix(psAshen(low), psDye(uKind[1]), 0.35 * uPad) + vec3(0.12, 0.1, 0.06) * uMic;
    col = mix(low, psAshen(high), psS(-0.22, 0.22, up - 0.15 - 0.7 * h2));
    // a moon and stars at night, a sun at evening
    col = mix(col, vec3(0.96, 0.93, 0.83), (psNight + psDusk) * psS(0.042, 0.037, length(vec2(psAx + psWide(0.2) * sin(0.06 + psTurn), 1.16 * (y - 0.18)))));
    col = mix(col, vec3(0.9), psNight * psS(0.988, 0.994, h3) * step(0.1, y));
    // two far ranges
    for (float k = 0.0; k < 2.0; k++) {
      vec4 m = piece(vec2(px, 0.34 + 0.12 * k));
      float r0 = psRange(x, 3.3 + 1.9 * k, 4.3 + 3.7 * k), peak = 1.0 - 2.0 * abs(fract(x * (2.6 + 1.4 * k) + 0.15 + 0.37 * k) - 0.5);
      float ht = (0.135 - 0.06 * k) * (1.0 + 0.8 * uOwn[2]) * mix(r0, 1.5 * (0.25 + 0.75 * r0) * peak, 0.8 - 0.4 * k);
      ht *= 0.95 + 0.25 * uPad + 0.3 * m.a;
      col = psHill(col, hor + 0.012 + ht - y, m, k < 0.5 ? vec3(0.48, 0.48, 0.53) : vec3(0.56, 0.34, 0.22), 0.6, 0.022, 11.0 + 20.0 * k, h, psC[5], 0.2 - 0.1 * k + 0.2 * (uSpace - 0.5));
    }
    vec3 water = psAshen(psTri(uOwn[0], vec3(0.16, 0.21, 0.31), vec3(0.54, 0.65, 0.68), mix(vec3(0.54, 0.65, 0.68), low, 0.45)));
    float dep = hor - y;
    water = mix(water, psC[5] * psDim, 0.45 * psS(0.45, 0.9, sin(y * 230.0 + 2.0 * sin(x * 7.0)) + 0.9 * (h2 - 0.5)));
    water = mix(water, mix(vec3(0.98, 0.9, 0.72), psDye(uKind[3]), 0.4 * uPhrase), (0.2 + 0.75 * uPhrase) * psS(0.1 + dep * 0.6, 0.0, abs(x - 0.24 - 0.02 * sin(y * 90.0)) + 0.06 * h3));
    col = mix(col, water, psIn(dep));
    // the sail, and what the water gives back of it
    vec2 q = vec2(x - 0.17 - 0.05 * sin(uTime * 0.017), y - 0.018);
    float mir = q.y < 0.0 ? 0.35 : 1.0, tall = 0.135 + 0.055 * uPhrase;
    q.y = q.y < 0.0 ? -q.y * 1.3 + 0.012 * sin(y * 400.0) : q.y;
    float sy = sat((q.y - 0.014) / tall);
    float sail = min(min(q.x + 0.004, (0.085 + 0.03 * uPhrase) * (1.0 - sy) * (1.0 + 0.5 * sy) - q.x), min(q.y - 0.022, tall - q.y + 0.014));
    float jib = min(min(-q.x - 0.004, q.x + 0.06 * (1.0 - sy * 1.2)), q.y - 0.026), front = step(sail, jib);
    float hull = min(min(q.y + 0.002, 0.018 - q.y), 0.085 - abs(q.x - 0.012) + 0.9 * (q.y - 0.016));
    col = mix(col, mix(vec3(0.97, 0.94, 0.87), psDye(uKind[3]), (0.25 + 0.65 * front) * uPhrase) * (1.0 - 0.14 * front) * (1.0 - 0.28 * psNight), psIn(max(sail, jib)) * mir);
    col = mix(col, psC[3] * 0.55, psIn(hull) * mir);
    // a few dark trees along the crest
    for (float k = 0.0; k < 5.0; k++) {
      float hk = psH(k + 8.0);
      vec2 tq = vec2(abs(psAx - psFoot * sin((0.085 * k + 0.05 * hk - 0.5) / 0.66 - psTurn)), (y + 0.02) / (0.13 + 0.06 * hk));
      float tr = 0.052 * sqrt(sat(tq.y)) * (1.0 - tq.y) - tq.x;
      col = mix(col, vec3(0.2, 0.21, 0.15) * (0.7 + 0.5 * h3) * psDim, psIn(tr) * step(0.0, tq.y) * sat(1.0 + uOwn[2]));
    }
    // the near hills
    for (float k = 0.0; k < 2.0; k++) {
      vec4 m = piece(vec2(px, 0.52 + 0.14 * k));
      float bank = 0.5 + 0.5 * sin(k < 0.5 ? x * 2.6 - 2.1 : x * 2.2 + 1.9);
      float ht = (0.025 + (0.145 - 0.03 * k) * bank * bank) * (1.0 + 0.6 * uOwn[2]) * (0.75 + 0.5 * psRange(x, 4.0, 5.0 + 4.0 * k));
      ht *= 0.9 + 0.12 * uPad + 0.22 * m.a;
      float deep = ht - 0.125 - y;
      col = psHill(col, deep, m, k < 0.5 ? vec3(0.45, 0.27, 0.17) : vec3(0.58, 0.42, 0.24), 0.5 * k, 0.026 - 0.006 * k, 57.0 + 9.0 * k, h, psC[4] * 0.8, 0.0);
      // a hit's pinch, a cue's new colour along the crest
      float run = 1.0 - uHits, go = 1.0 - uCue, on = psIn(deep) * k;
      col = mix(col, fresh, on * uHits * psS(0.34, 0.1, length(vec2(x + 0.3 - 0.4 * run, 1.5 * deep - 0.02)) + 0.06 * h3));
      col = mix(col, fresh, on * uCue * psS(0.07, 0.03, deep + 0.01 * h3) * psS(0.5, 0.1, abs(x + 0.5 - 1.2 * go)));
    }
    col = mix(col, psC[4] * 0.8, psS(0.9 * psG, 0.4 * psG, abs(y + 0.118)));
  }
  col = mix(col, psDye(uKind[2]), 0.85 * sat((uTexture * 0.1 - h3) * 30.0) * psS(0.05, -0.02, y));
  col *= 0.86 + 0.28 * h2;
  return col * (1.0 - 0.45 * step(0.965, fract(h * 211.0)));
}
// How light falls on one grain.
float psDot(vec4 g, float square) {
  float d = 1.0 - 0.62 * psS(0.34, 0.74, g.z) + 0.42 * dot(psV, vec2(-0.6, 0.8));
  return mix(0.96, d * 1.06, psS(1.2, 3.6, square * psG / psPx));
}
float psNow(float at) {
  at = (at - uLoop) * 8.0;
  return 0.92 + 0.16 * uTone + (0.12 + 0.3 * uEnergy) * exp(-at * at) * sat(4.0 * sin(PI * uLoop));
}
// A few grains are clear and catch the light.
float psGlint(vec4 g) {
  return step(0.972, fract(g.w * 313.0)) * (0.1 + 0.6 * uKeys + 0.5 * uHits) * (0.5 + 0.5 * sin(uTime * 0.7 + g.w * 400.0)) * psS(0.6, 0.1, g.z);
}
vec3 psBottle(vec2 p) {
  psRad = 0.74 - 0.1 * sat(-uOwn[5]) + 0.06 * sat(uOwn[5]);
  psPow = mix(mix(2.0, 5.5, sat(-uOwn[5])), 1.25, sat(uOwn[5]));
  vec3 wall = psTri(uOwn[4], vec3(0.085, 0.085, 0.095), vec3(0.9, 0.86, 0.79), vec3(0.36, 0.53, 0.6));
  float fall = 1.04 - 0.17 * psS(-0.5, 1.1, p.x - 0.4 * p.y);
  vec3 col = wall * (fall + 0.035 * (noise(p * vec2(9.0, 7.0)) - 0.5));
  float shelf = -0.335;
  vec3 table = mix(wall, vec3(0.7, 0.54, 0.38), 0.6 - 0.4 * sat(-uOwn[4])) * (0.97 + 0.1 * noise(p * vec2(3.0, 45.0)));
  col = mix(col, table * fall * 1.04, psCut(p.y - shelf));
  // its shadow, warm, over the wall and down on the table
  vec2 sh = p - vec2(psMid.x + 0.3 + 0.05 * uSpace, -0.075);
  if (p.y < shelf) sh.x -= (shelf - p.y) * 0.5;
  float dark = psS(0.09, -0.1, abs(sh.x) - psWide(min(sh.y, 0.44))) * psS(0.5, 0.4, sh.y) * (1.0 - 0.65 * psS(0.3, 0.38, sh.y));
  col *= psLamp * mix(vec3(1.0), mix(vec3(0.6, 0.5, 0.43), vec3(0.62, 0.55, 0.6), psNight), dark);
  // the bottle
  float x = p.x - psMid.x, rOut = psWide(p.y), slope = (psWide(p.y + 0.004) - rOut) / 0.004;
  float e = min((rOut - abs(x)) / sqrt(1.0 + slope * slope), p.y + 1.04), lipY = 0.405;
  vec3 room = col;
  // the rod stands in the open top
  float rx = x - 0.03 - (p.y - 0.3) * (0.22 + 0.04 * sin(TAU * uLoop));
  vec3 rod = mix(vec3(0.32, 0.2, 0.11), vec3(0.85, 0.66, 0.42), psS(-0.011, 0.011, -rx)) * psLamp;
  float rodMask = psCut(abs(rx) - 0.0105) * step(0.2, p.y);
  if (e > -2.0 * psPx && p.y < lipY) {
    float wallT = 0.02, st = clamp(x / max(rOut - wallT * 0.6, 0.05), -0.999, 0.999);
    float th = asin(st), cz = sqrt(1.0 - st * st);
    psTurn = 0.22 * sin(uTravel * 0.045 + 0.4);
    float ys = 0.06 + (p.y - 0.06) * (1.0 - 0.26 * cz * rOut);   // level rings curve, seen from the middle
    vec4 g = psGrain(vec2(th + psTurn, ys), 1.0);
    psAx = rOut * sin(g.x - psTurn); psFoot = psWide(-0.04);
    vec3 n = normalize(vec3(st, -slope * 0.8, cz + 0.05));
    float lam = (0.5 + 0.62 * max(dot(n, vec3(-0.62, 0.42, 0.66)), 0.0)) * (1.0 - 0.35 * pow(abs(st), 6.0));
    float top = 0.315 + 0.02 * cos(st * 2.4) + 0.12 * uCue * (1.0 - uCue) * cz;
    vec3 sand = psPacked(vec2(g.x * 0.66, g.y), g.w);
    sand = mix(sand, psDye(uKind[4]), sat(uCue * 1.2) * psS(0.17, 0.05, top - ys + 0.03 * g.w));
    sand *= psDot(g, 0.4 + 0.6 * cz) * lam * psLamp * psNow(0.5 + g.x * 0.33) * (1.0 + 0.15 * psNight);
    sand += psLamp * psGlint(g);
    // above the sand the neck is empty
    vec3 air = mix(room * (0.93 - 0.35 * pow(abs(st), 8.0)) + 0.03, rod, rodMask);
    air = mix(air, psDye(uKind[4]), psS(0.006, 0.0, abs(x - 0.01 * sin(p.y * 30.0))) * uCue);
    vec3 body = mix(air, sand, psIn(top - g.y));
    // the glass: its thickness at the limb, and the window as one curved bar
    body = mix(body, room * 0.62 + psLamp * 0.11, psS(wallT + psPx, wallT - psPx, e) * 0.75);
    body = mix(body, room * 0.42, 0.8 * psS(3.0 * psPx + 0.003, 0.0, e));
    body += psLamp * 0.35 * psS(0.004 + psPx, 0.0, abs(e - 0.011)) * (st < 0.0 ? 1.0 : 0.35);
    float win = psS(0.097, 0.081, abs(th + 0.8)) * psS(0.0, 0.03, min(p.y + 0.58, 0.255 - p.y)) * (1.0 - 0.85 * psS(0.012, 0.006, abs(th + 0.8))) * (1.0 - 0.85 * psS(0.014, 0.008, abs(p.y + 0.12)));
    body += psLamp * (win * (0.42 + 0.1 * uTone) + 0.06 * psS(0.55, 0.0, abs(th + 0.8))) * (1.0 - 0.5 * body);
    col = mix(col, body, psCut(-e));
  }
  // the lip
  col = mix(col, rod, rodMask * step(lipY, p.y));
  vec2 lq = abs(vec2(x, p.y - lipY)) - vec2(0.185, 0.004);
  float lip = length(max(lq, 0.0)) + min(max(lq.x, lq.y), 0.0) - 0.019;
  float lu = (p.y - lipY) / 0.023, lx = x / 0.2;
  vec3 lipC = room * (0.7 - 0.25 * lx * lx) + psLamp * (0.08 + 0.5 * psS(0.3, 0.0, abs(lu - 0.35)) * psS(0.5, 0.1, abs(lx + 0.45)));
  lipC = mix(lipC, room * 0.45, psS(0.006, 0.0, -lip) * 0.6);
  col = mix(col, lipC, psCut(lip));
  return col;
}
// One fall of sand: heaps side by side, each as steep as its sand will lie, flatter at the foot.
float psHeaps(float x, float wide, float seed, float steep) {
  float u = x / wide + seed * 0.37, k = floor(u), top = -9.0;
  for (int i = -1; i <= 1; i++) {
    float id = k + float(i), h = psH(id * 1.7 + seed * 13.1), h2 = fract(h * 57.1);
    float at = (id + 0.5 + 0.5 * (h - 0.5) - seed * 0.37) * wide;
    float tall = wide * (0.06 + 0.44 * h2) * (1.0 + 0.12 * sin(uTime * (0.021 + 0.017 * h) + h * 40.0));
    float d = x - at;
    float lie = d < 0.0 ? 0.72 + 0.4 * h : 1.1 - 0.35 * h2, far = sqrt(d * d + 0.00012) - 0.011;
    top = psSmax(top, steep * (tall - lie * far * (1.0 - 0.28 * min(far / wide, 1.4))), 0.02 * wide);
  }
  return top;
}
// One skin: h picks which of the fall's three sands it is; the piece and the kinds dye it.
vec3 psSkin(int k, float h, vec3 dye, float a) {
  int f = k % 3;
  a = psS(0.02, 0.5, a);
  if (h < 0.5) return mix(f == 0 ? psC[4] * 0.45 : psC[f == 1 ? 3 : 5], dye * (f == 0 ? 0.35 : 0.8), 0.25 * a);
  if (h < 0.84) return mix(f == 0 ? psC[3] * 0.8 : f == 1 ? psC[4] * 0.5 : psC[2], dye, 0.9 * a);
  vec3 c = f == 0 ? psC[5] : f == 1 ? psC[0] : psC[1] * 0.7;
  return k > 5 ? c : mix(c, psDye(uKind[k / 3]), 0.9 * (k < 3 ? uDrone : uPad));
}
vec3 psPanes(vec2 p) {
  vec4 g = psGrain(p, 0.0);
  float h = g.w, h2 = fract(h * 91.3), h3 = fract(h * 37.7);
  // water before a bright wall, the sun low behind
  float ds = length(p - vec2(0.29, 0.03));
  vec3 wall = psTri(uOwn[4], vec3(0.15, 0.18, 0.21), vec3(0.88, 0.91, 0.88), vec3(0.36, 0.64, 0.7));
  wall = mix(mix(wall, wall * vec3(1.05, 0.62, 0.44), psDusk), wall * vec3(0.18, 0.26, 0.42), psNight);
  vec3 glow = psTri(uOwn[0], vec3(0.66, 0.75, 0.86), vec3(1.0, 0.79, 0.5), vec3(1.0, 0.4, 0.16));
  vec3 col = wall * mix(vec3(1.0), vec3(0.66, 0.78, 0.8), psS(-0.1, 0.5, p.y) * 0.8) * (1.0 - 0.16 * psS(0.3, 1.2, ds));
  col = mix(col, glow, 0.55 * exp(-ds * (3.6 - 1.2 * uSpace)));
  col += glow * (0.08 + 0.16 * uLevel) * exp(-ds * 5.5);
  col = mix(col, min(glow + vec3(0.17, 0.17 + 0.22 * psDusk, 0.17 + 0.2 * psDusk), 1.0), psS(0.125, 0.085, ds) * (0.85 + 0.15 * uMic));
  // one fall of sand lies on another, in skins along its slope
  float steep = 0.62 * exp2(0.9 * uOwn[2]), top = -0.62;
  vec3 sand = psC[4] * 0.5;
  float roof = -0.2 + 0.42 * exp2(0.9 * uOwn[2]) + 0.15 * uOwn[5];   // no hill is higher
  // a mountain at the left, a gap before the sun
  float land = (0.13 * exp(-(g.x + 0.4) * (g.x + 0.4) * 9.0) - 0.07 * exp(-(g.x - 0.3) * (g.x - 0.3) * 16.0)) * (1.0 + uOwn[2]);
  for (int k = 0; k < 8 && p.y < roof; k++) {
    float fk = float(k), wide = k == 5 ? 1.25 : 1.0 - 0.085 * fk;
    vec4 m = piece(vec2(sat(0.5 + g.x * 0.42), 0.93 - 0.1 * fk));
    float a = sat(m.a * (0.65 + uEnergy)), rag = 0.004 * sin(g.x * 37.0 + fk * 2.0) * sin(g.x * 13.0);
    float b = psHeaps(g.x + rag, wide, fk + 1.0, steep * (0.8 + 0.5 * psH(fk + 5.0))) - 0.52 + 0.06 * fk + 0.04 * a + 0.15 * uOwn[5] + land * min(fk * 0.25, 1.0);
    float now = max(b, top + (0.007 + 0.03 * a) * (0.55 + 0.45 * sin(g.x * 3.0 + fk * 2.0)));
    if (g.y > top - psG && g.y < now + 0.02) {
      float u = (now - g.y) / (0.013 + 0.011 * psH(fk + 0.7)) + 0.5 * sin(g.x * 9.0 + fk) + 0.3 * (h2 - 0.5), id = floor(u);
      vec3 dye = psDyeOf(m), c = mix(psSkin(k, psH((id - 1.0) * 3.7 + fk * 17.0), dye, a), psSkin(k, psH(id * 3.7 + fk * 17.0), dye, a), psS(0.0, 0.2, fract(u)));
      sand = mix(sand, c * (1.0 - 0.22 * psS(0.0, 0.16, now - g.y)), psIn(g.y - top));
    }
    top = now;
    if (top > g.y + 0.15) break;      // so deep, nothing above matters
  }
  float deep = top - g.y;
  // the last lies on the ridges like snow; a cue pours another colour there
  float pour = uCue * psS(0.75, 0.2, abs(g.x + 0.6 - 1.6 * (1.0 - uCue)));
  vec3 fresh = mix(psDye(uKind[4]), vec3(1.0, 0.8, 0.45), 0.35);
  sand = mix(sand, mix(psC[5], psDye(uKind[3]), 0.75 * uPhrase), 0.85 * psS(0.022, 0.006, deep + 0.01 * sin(g.x * 14.0) + 0.012 * h3));
  sand = mix(sand, fresh, pour * psS(0.1, 0.06, deep + 0.02 * h3));
  // a pinch slides down one slope on a hit
  float run = 1.0 - uHits;
  sand = mix(sand, fresh * 1.1, uHits * psS(0.27 + 0.08 * run, 0.06, length(vec2(g.x + 0.36 - 0.32 * run, deep * 1.8)) + 0.06 * h3));
  sand = mix(sand, psDye(uKind[2]), 0.8 * sat((uTexture * 0.08 - h3) * 40.0));
  float grain = psDot(g, 1.0) * (0.84 + 0.32 * h2);
  sand *= grain * psLamp * psNow(0.5 + g.x * 0.42);
  sand = mix(sand, glow, (0.5 * psS(0.02, 0.0, deep) + 0.15) * exp(-ds * 4.5));
  sand += psLamp * psGlint(g);
  // a thread of sand for each band
  vec3 air = col;
  float x = p.x + 0.9, w = 1.8 / 16.0;
  for (int i = 0; i < 2 && deep < psG; i++) {
    float k = floor(x / w - 0.5) + float(i);
    if (k < 0.0 || k > 15.0) continue;
    float hk = psH(k + 2.3), b = uBands[int(k)], fall = max(0.5 - p.y, 0.0);
    float at = (k + 0.5 + 0.6 * (hk - 0.5)) * w + (0.004 * sin(uTime * 0.4 + k) + 0.003 * sin(p.y * 9.0 + k)) * fall, d = abs(x - at);
    float beads = 0.5 + 0.5 * sin(p.y * 80.0 + mod(uTime * 9.0, TAU) + 2.5 * sin(p.y * 23.0 + k * 9.0));
    float wide = 0.0012 + 0.0022 * b + 0.0022 * fall, strong = (hk > 0.7 ? 0.55 : 0.0) + 0.8 * b, tone = mod(k, 3.0);
    vec3 tc = (tone < 0.5 ? psC[4] * 0.6 : tone < 1.5 ? psC[3] : psC[2] * 0.8) * psLamp;
    air = mix(air, tc, sat(strong) * psS(wide + psPx, wide * 0.2, d) * (0.25 + 0.75 * beads));
    air = mix(air, tc, 0.1 * sat(strong) * exp(-d * d / (wide * wide * (20.0 + 60.0 * fall))));
  }
  // the rest lies on a raft of bubbles
  float hang = 0.455 - 0.2 * sat(-uOwn[5]) + 0.06 * sat(uOwn[5]);
  float bank = hang + 0.017 + 0.2 * sat(uOwn[5]) + 0.012 * sin(g.x * 4.0);
  vec3 held = mix(psC[3], psC[4] * 0.5, psS(0.35, 0.6, fract(g.y * 22.0 + 0.3 * sin(g.x * 5.0) + 0.3 * h2)));
  air = mix(air, held * grain * psLamp, psIn(g.y - bank));
  if (deep < psG && p.y > hang - 0.2 && p.y < hang + 0.06) {
    const float cs = 0.074;
    vec2 q = vec2(p.x + 0.02 * sin(uTravel * 0.06), (p.y - hang) / 0.9) / cs;
    float ry0 = floor(q.y + 0.5);
    for (int j = -1; j <= 1; j++) {
      float ry = ry0 + float(j), odd = 0.5 * mod(ry + 8.0, 2.0);
      if (ry > 0.5 || ry < -2.5) continue;
      float bx0 = floor(q.x - odd + 0.5);
      for (int i = -1; i <= 1; i++) {
        float bx = bx0 + float(i), hb = hash21(vec2(bx, ry) + 91.0);
        vec2 c = vec2(bx + odd, ry) + 0.22 * (vec2(hb, fract(hb * 31.7)) - 0.5);
        float keep = psS(-0.02, 0.03, c.y * 0.067 + 0.07 + 0.055 * sin(c.x * 0.35 + 0.6) + 0.04 * sin(c.x * 0.9));
        float r = (0.36 + 0.17 * fract(hb * 77.0)) * keep;
        if (r < 0.03) continue;
        vec2 n = (q - c) / r;
        float l = length(n), aa = psPx / (cs * r) * 1.5;
        vec3 bc = mix(col, vec3(1.0) * max(max(wall.r, wall.g), wall.b), 0.3) + glow * 0.16 * sat(-n.y);
        bc = mix(bc, wall * vec3(0.2, 0.24, 0.26), psS(0.8, 0.98, l) * 0.85);
        bc = mix(bc, glow, 0.6 * psS(0.1, 0.0, abs(l - 0.74)) * psS(0.3, 1.0, dot(n, vec2(0.45, -0.89))));
        bc = mix(bc, vec3(1.0), (1.0 - 0.6 * psNight) * 0.8 * psS(0.2, 0.04, length(n - vec2(-0.42, 0.42))));
        air = mix(air, bc, psS(1.0 + aa, 1.0 - aa, l) * keep);
      }
    }
  }
  col = mix(air, sand, psIn(deep));
  // the frame, seen from far off
  vec2 fq = abs(p) - vec2(1.27, 0.6);
  float fr = length(max(fq, 0.0)) + min(max(fq.x, fq.y), 0.0);
  if (fr > -0.01) {
    col = mix(col, mix(0.09 * psLamp, wall * (0.92 - 0.35 * exp(-max(fr - 0.045, 0.0) * 14.0)), psCut(0.045 - fr)), psCut(-fr));
  }
  return col;
}
vec3 render(vec2 p) {
  psNight = sat(-uOwn[0]); psDusk = sat(uOwn[0]); psDim = 1.0 - 0.25 * psNight;
  psLamp = psTri(uOwn[0], vec3(0.3, 0.38, 0.56), vec3(1.0, 0.985, 0.96), vec3(1.06, 0.82, 0.6));
  for (int i = 0; i < 6; i++) psC[i] = mix(psAshen(psPlain[i]), psDyed[i], sat(uOwn[1]));
  float asp = uRes.x / uRes.y, zoom = clamp(0.95 / asp, 1.0, 1.8) * exp2(uOwn[3] * (uOwn[3] < 0.0 ? 0.9 : 0.5));
  vec2 eye = uVar < 0.5 ? vec2(-0.06, 0.06) : vec2(0.0, -0.05);
  p = (p - eye) * zoom + eye;
  psPx = 0.75 * zoom / uRes.y;
  psG = uVar < 0.5 ? 0.0062 : 0.0054;
  return sat(uVar < 0.5 ? psBottle(p) : psPanes(p));
}
